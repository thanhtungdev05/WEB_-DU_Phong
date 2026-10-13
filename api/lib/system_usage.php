<?php
declare(strict_types=1);

function system_usage_status(float $percent): string
{
    if ($percent >= 92.0) {
        return 'CRITICAL';
    }
    if ($percent >= 80.0) {
        return 'WARNING';
    }
    return 'OK';
}

function system_usage_percent(float $used, float $limit): ?float
{
    if ($limit <= 0.0) {
        return null;
    }
    return round(($used / $limit) * 100, 1);
}

function render_metric_base_value(float $value, string $unit): float
{
    return match (strtolower(trim($unit))) {
        'tb', 'terabyte', 'terabytes' => $value * 1024 ** 4,
        'gb', 'gigabyte', 'gigabytes' => $value * 1024 ** 3,
        'mb', 'megabyte', 'megabytes' => $value * 1024 ** 2,
        'kb', 'kilobyte', 'kilobytes' => $value * 1024,
        default => $value,
    };
}

/** @return array<int, array{values: array<int, float>, latest: ?float, unit: string}> */
function render_metric_series(mixed $payload): array
{
    if (!is_array($payload)) {
        return [];
    }
    $series = [];
    foreach ($payload as $item) {
        if (!is_array($item) || !is_array($item['values'] ?? null)) {
            continue;
        }
        $unit = (string)($item['unit'] ?? '');
        $values = [];
        foreach ($item['values'] as $point) {
            if (!is_array($point) || !is_numeric($point['value'] ?? null)) {
                continue;
            }
            if ($unit === '' && isset($point['unit'])) {
                $unit = (string)$point['unit'];
            }
            $values[] = render_metric_base_value((float)$point['value'], $unit);
        }
        if ($values !== []) {
            $series[] = ['values' => $values, 'latest' => $values[array_key_last($values)], 'unit' => $unit];
        }
    }
    return $series;
}

/** @return array<string, mixed> */
function render_usage_unavailable(string $reason): array
{
    return [
        'configured' => false,
        'available' => false,
        'reason' => $reason,
        'billingDashboardRequired' => ['instanceHours', 'buildPipelineMinutes', 'workspaceIncludedUsage'],
    ];
}

/** @return array<string, mixed> */
function render_usage_metrics(): array
{
    $apiKey = trim((string)env_value('RENDER_API_KEY', ''));
    $serviceId = trim((string)env_value('RENDER_SERVICE_ID', ''));
    if ($apiKey === '' || $serviceId === '') {
        return render_usage_unavailable('missing_api_credentials');
    }
    if (!function_exists('curl_multi_init')) {
        return render_usage_unavailable('curl_unavailable');
    }

    $cacheTtl = env_int('SYSTEM_USAGE_PROVIDER_CACHE_SECONDS', 300, 60, 3600);
    $cachePath = rtrim(sys_get_temp_dir(), DIRECTORY_SEPARATOR)
        . DIRECTORY_SEPARATOR . 'ftc-render-usage-' . hash('sha256', $serviceId) . '.json';
    if (is_file($cachePath) && (time() - (int)filemtime($cachePath)) < $cacheTtl) {
        $cached = json_decode((string)file_get_contents($cachePath), true);
        if (is_array($cached)) {
            $cached['cache'] = ['hit' => true, 'ttlSeconds' => $cacheTtl];
            return $cached;
        }
    }

    $now = new DateTimeImmutable('now', new DateTimeZone('UTC'));
    $monthStart = $now->modify('first day of this month')->setTime(0, 0);
    $hourStart = $now->modify('-1 hour');
    // Render currently mis-parses a URL-encoded "+00:00" offset as a space.
    // Use the equivalent RFC 3339 UTC Z form accepted by the metrics API.
    $renderTime = static fn(DateTimeImmutable $value): string => $value->format('Y-m-d\TH:i:s\Z');
    $base = 'https://api.render.com/v1/metrics/';
    $common = '&resource=' . rawurlencode($serviceId);
    $requests = [
        'bandwidth' => $base . 'bandwidth?startTime=' . rawurlencode($renderTime($monthStart))
            . '&endTime=' . rawurlencode($renderTime($now)) . $common,
        'cpu' => $base . 'cpu?startTime=' . rawurlencode($renderTime($hourStart))
            . '&endTime=' . rawurlencode($renderTime($now)) . '&resolutionSeconds=300' . $common,
        'cpu_limit' => $base . 'cpu-limit?startTime=' . rawurlencode($renderTime($hourStart))
            . '&endTime=' . rawurlencode($renderTime($now)) . '&resolutionSeconds=300' . $common,
        'memory' => $base . 'memory?startTime=' . rawurlencode($renderTime($hourStart))
            . '&endTime=' . rawurlencode($renderTime($now)) . '&resolutionSeconds=300' . $common,
        'memory_limit' => $base . 'memory-limit?startTime=' . rawurlencode($renderTime($hourStart))
            . '&endTime=' . rawurlencode($renderTime($now)) . '&resolutionSeconds=300' . $common,
    ];

    $multi = curl_multi_init();
    $handles = [];
    foreach ($requests as $name => $url) {
        $handle = curl_init($url);
        curl_setopt_array($handle, [
            CURLOPT_RETURNTRANSFER => true,
            CURLOPT_CONNECTTIMEOUT => 3,
            CURLOPT_TIMEOUT => 6,
            CURLOPT_HTTPHEADER => [
                'Accept: application/json',
                'Authorization: Bearer ' . $apiKey,
            ],
            CURLOPT_USERAGENT => 'FTC-VirtualDevices-SystemMonitor/1.0',
        ]);
        curl_multi_add_handle($multi, $handle);
        $handles[$name] = $handle;
    }

    do {
        $status = curl_multi_exec($multi, $running);
        if ($running > 0) {
            curl_multi_select($multi, 0.5);
        }
    } while ($running > 0 && $status === CURLM_OK);

    $payloads = [];
    $errors = [];
    foreach ($handles as $name => $handle) {
        $httpStatus = (int)curl_getinfo($handle, CURLINFO_RESPONSE_CODE);
        $body = (string)curl_multi_getcontent($handle);
        if ($httpStatus === 200) {
            $decoded = json_decode($body, true);
            if (is_array($decoded)) {
                $payloads[$name] = $decoded;
            } else {
                $errors[$name] = 'invalid_response';
            }
        } else {
            $errors[$name] = $httpStatus > 0 ? 'http_' . $httpStatus : 'network_error';
        }
        curl_multi_remove_handle($multi, $handle);
        curl_close($handle);
    }
    curl_multi_close($multi);

    $bandwidthSeries = render_metric_series($payloads['bandwidth'] ?? null);
    $bandwidthBytes = 0.0;
    foreach ($bandwidthSeries as $series) {
        $bandwidthBytes += array_sum($series['values']);
    }
    $bandwidthGb = round($bandwidthBytes / 1024 ** 3, 3);
    // The public Render metrics API exposes usage but not the workspace's
    // included monthly quota. Never infer a quota from a plan name here.
    $bandwidthLimitGb = null;
    $bandwidthPercent = null;

    $cpuSeries = render_metric_series($payloads['cpu'] ?? null);
    $cpuLimitSeries = render_metric_series($payloads['cpu_limit'] ?? null);
    $memorySeries = render_metric_series($payloads['memory'] ?? null);
    $memoryLimitSeries = render_metric_series($payloads['memory_limit'] ?? null);
    $latestSum = static fn(array $series): float => array_sum(array_map(
        static fn(array $item): float => (float)($item['latest'] ?? 0.0),
        $series
    ));
    $maxSum = static fn(array $series): float => array_sum(array_map(
        static fn(array $item): float => $item['values'] === [] ? 0.0 : max($item['values']),
        $series
    ));

    $cpuCurrent = $latestSum($cpuSeries);
    $cpuLimit = $latestSum($cpuLimitSeries);
    $cpuPeak = $maxSum($cpuSeries);
    $memoryCurrent = $latestSum($memorySeries);
    $memoryLimit = $latestSum($memoryLimitSeries);
    $memoryPeak = $maxSum($memorySeries);

    $result = [
        'configured' => true,
        'available' => $payloads !== [],
        'serviceId' => $serviceId,
        'bandwidth' => [
            'available' => $bandwidthSeries !== [],
            'usedGb' => $bandwidthGb,
            'limitGb' => $bandwidthLimitGb,
            'usagePercent' => $bandwidthPercent,
            'status' => 'UNKNOWN',
            'quotaAvailable' => false,
            'periodStart' => $monthStart->format(DATE_ATOM),
            'source' => 'render_metrics_api',
        ],
        'cpu' => [
            'available' => $cpuSeries !== [] && $cpuLimitSeries !== [],
            'current' => round($cpuCurrent, 3),
            'peakLastHour' => round($cpuPeak, 3),
            'limit' => round($cpuLimit, 3),
            'usagePercent' => system_usage_percent($cpuCurrent, $cpuLimit),
            'peakPercent' => system_usage_percent($cpuPeak, $cpuLimit),
        ],
        'memory' => [
            'available' => $memorySeries !== [] && $memoryLimitSeries !== [],
            'currentBytes' => (int)round($memoryCurrent),
            'peakLastHourBytes' => (int)round($memoryPeak),
            'limitBytes' => (int)round($memoryLimit),
            'usagePercent' => system_usage_percent($memoryCurrent, $memoryLimit),
            'peakPercent' => system_usage_percent($memoryPeak, $memoryLimit),
        ],
        'errors' => $errors,
        'billingDashboardRequired' => ['instanceHours', 'buildPipelineMinutes', 'workspaceIncludedUsage'],
        'checkedAt' => $now->format(DATE_ATOM),
        'cache' => ['hit' => false, 'ttlSeconds' => $cacheTtl],
    ];
    @file_put_contents(
        $cachePath,
        json_encode($result, JSON_UNESCAPED_SLASHES | JSON_UNESCAPED_UNICODE),
        LOCK_EX
    );
    return $result;
}

/** @return array{success: bool, status: int, data: ?array} */
function neon_api_request(string $url, string $apiKey, int $timeoutSeconds = 5): array
{
    if (!function_exists('curl_init')) {
        return ['success' => false, 'status' => 0, 'data' => null];
    }
    $handle = curl_init($url);
    curl_setopt_array($handle, [
        CURLOPT_RETURNTRANSFER => true,
        CURLOPT_CONNECTTIMEOUT => 3,
        CURLOPT_TIMEOUT => $timeoutSeconds,
        CURLOPT_HTTPHEADER => [
            'Accept: application/json',
            'Authorization: Bearer ' . $apiKey,
        ],
        CURLOPT_USERAGENT => 'FTC-VirtualDevices-SystemMonitor/1.0',
    ]);
    $body = (string)curl_exec($handle);
    $status = (int)curl_getinfo($handle, CURLINFO_RESPONSE_CODE);
    curl_close($handle);

    if ($status === 200) {
        $decoded = json_decode($body, true);
        if (is_array($decoded)) {
            return ['success' => true, 'status' => 200, 'data' => $decoded];
        }
    }
    return ['success' => false, 'status' => $status, 'data' => null];
}

function neon_endpoint_id_from_database_url(string $databaseUrl): ?string
{
    $host = (string)parse_url($databaseUrl, PHP_URL_HOST);
    if ($host === '' || preg_match('/^(ep-[a-z0-9-]+?)(?:-pooler)?\./i', $host, $matches) !== 1) {
        return null;
    }
    return strtolower((string)$matches[1]);
}

function neon_project_id_for_endpoint(array $projects, string $endpointId, string $apiKey): ?string
{
    if (!function_exists('curl_multi_init')) {
        return null;
    }
    $projectIds = [];
    foreach (array_slice($projects, 0, 100) as $project) {
        $projectId = trim((string)($project['id'] ?? ''));
        if ($projectId !== '') {
            $projectIds[] = $projectId;
        }
    }

    // Resolve projects in small concurrent batches so accounts with several
    // projects do not make the dashboard wait one HTTP timeout per project.
    foreach (array_chunk($projectIds, 20) as $batch) {
        $multi = curl_multi_init();
        $handles = [];
        foreach ($batch as $projectId) {
            $url = 'https://console.neon.tech/api/v2/projects/'
                . rawurlencode($projectId) . '/endpoints';
            $handle = curl_init($url);
            if ($handle === false) {
                continue;
            }
            curl_setopt_array($handle, [
                CURLOPT_RETURNTRANSFER => true,
                CURLOPT_CONNECTTIMEOUT => 3,
                CURLOPT_TIMEOUT => 5,
                CURLOPT_HTTPHEADER => [
                    'Accept: application/json',
                    'Authorization: Bearer ' . $apiKey,
                ],
                CURLOPT_USERAGENT => 'FTC-VirtualDevices-SystemMonitor/1.0',
            ]);
            curl_multi_add_handle($multi, $handle);
            $handles[$projectId] = $handle;
        }

        do {
            $status = curl_multi_exec($multi, $running);
            if ($running > 0) {
                curl_multi_select($multi, 0.5);
            }
        } while ($running > 0 && $status === CURLM_OK);

        $matchedProjectId = null;
        foreach ($handles as $projectId => $handle) {
            if ((int)curl_getinfo($handle, CURLINFO_RESPONSE_CODE) === 200) {
                $decoded = json_decode((string)curl_multi_getcontent($handle), true);
                $endpoints = is_array($decoded['endpoints'] ?? null) ? $decoded['endpoints'] : [];
                foreach ($endpoints as $endpoint) {
                    if (strtolower((string)($endpoint['id'] ?? '')) === $endpointId) {
                        $matchedProjectId = $projectId;
                        break;
                    }
                }
            }
            curl_multi_remove_handle($multi, $handle);
            curl_close($handle);
        }
        curl_multi_close($multi);

        if ($matchedProjectId !== null) {
            return $matchedProjectId;
        }
    }
    return null;
}

/** @return array{projectId: ?string, source: string, reason: ?string, status: int} */
function neon_resolve_project_id(string $apiKey, bool $ignoreConfiguredProject = false): array
{
    $configuredProjectId = trim((string)env_value('NEON_PROJECT_ID', ''));
    if (!$ignoreConfiguredProject && $configuredProjectId !== '') {
        return ['projectId' => $configuredProjectId, 'source' => 'environment', 'reason' => null, 'status' => 200];
    }

    $endpointId = neon_endpoint_id_from_database_url((string)env_value('DATABASE_URL', ''));
    $projectsResponse = neon_api_request('https://console.neon.tech/api/v2/projects?limit=400', $apiKey, 6);
    if (!$projectsResponse['success'] && (int)$projectsResponse['status'] === 400) {
        // Personal API keys need org_id for organization projects. Discover
        // organizations from the key instead of asking operators to hardcode it.
        $organizationsResponse = neon_api_request(
            'https://console.neon.tech/api/v2/users/me/organizations',
            $apiKey,
            6
        );
        $organizations = is_array($organizationsResponse['data']['organizations'] ?? null)
            ? $organizationsResponse['data']['organizations']
            : [];
        $organizationProjects = [];
        $successfulOrganizationRequests = 0;
        foreach (array_slice($organizations, 0, 50) as $organization) {
            $organizationId = trim((string)($organization['id'] ?? ''));
            if ($organizationId === '') {
                continue;
            }
            $response = neon_api_request(
                'https://console.neon.tech/api/v2/projects?limit=400&org_id=' . rawurlencode($organizationId),
                $apiKey,
                6
            );
            if (!$response['success']) {
                continue;
            }
            $successfulOrganizationRequests++;
            $projectsForOrganization = is_array($response['data']['projects'] ?? null)
                ? $response['data']['projects']
                : [];
            array_push($organizationProjects, ...$projectsForOrganization);
        }
        if ($successfulOrganizationRequests > 0) {
            $projectsResponse = [
                'success' => true,
                'status' => 200,
                'data' => ['projects' => $organizationProjects],
            ];
        }
    }
    if (!$projectsResponse['success']) {
        return [
            'projectId' => null,
            'source' => 'projects_api',
            'reason' => 'projects_request_failed',
            'status' => (int)$projectsResponse['status'],
        ];
    }

    $projects = is_array($projectsResponse['data']['projects'] ?? null)
        ? $projectsResponse['data']['projects']
        : [];
    if (count($projects) === 1 && !empty($projects[0]['id'])) {
        return [
            'projectId' => (string)$projects[0]['id'],
            'source' => 'single_accessible_project',
            'reason' => null,
            'status' => 200,
        ];
    }
    if ($endpointId === null) {
        return [
            'projectId' => null,
            'source' => 'projects_api',
            'reason' => $projects === [] ? 'no_accessible_projects' : 'database_endpoint_not_detected',
            'status' => 0,
        ];
    }

    // DATABASE_URL identifies a compute endpoint (ep-*), not a project. Match
    // that endpoint against the projects visible to the configured API key.
    $matchedProjectId = neon_project_id_for_endpoint($projects, $endpointId, $apiKey);
    if ($matchedProjectId !== null) {
        return [
            'projectId' => $matchedProjectId,
            'source' => 'database_endpoint_match',
            'reason' => null,
            'status' => 200,
        ];
    }

    return [
        'projectId' => null,
        'source' => 'projects_api',
        'reason' => count($projects) > 100 ? 'too_many_projects_to_match' : 'database_project_not_found',
        'status' => 0,
    ];
}

function neon_positive_number(mixed $value): ?float
{
    return is_numeric($value) && (float)$value > 0.0 ? (float)$value : null;
}

/** @return array<string, mixed> */
function neon_project_metrics(array $project): array
{
    $quota = is_array($project['settings']['quota'] ?? null) ? $project['settings']['quota'] : [];
    $storageLimitBytes = neon_positive_number($quota['logical_size_bytes'] ?? null)
        ?? neon_positive_number($project['branch_logical_size_limit_bytes'] ?? null);
    $computeLimitSeconds = neon_positive_number($quota['compute_time_seconds'] ?? null);
    $computeSeconds = max(0.0, (float)($project['compute_time_seconds'] ?? 0.0));

    return [
        'storageLimitBytes' => $storageLimitBytes === null ? null : (int)round($storageLimitBytes),
        'computeTimeSeconds' => (int)round($computeSeconds),
        'computeHours' => round($computeSeconds / 3600, 2),
        'computeLimitSeconds' => $computeLimitSeconds === null ? null : (int)round($computeLimitSeconds),
        'computeLimitHours' => $computeLimitSeconds === null ? null : round($computeLimitSeconds / 3600, 2),
        'dataTransferBytes' => max(0, (int)($project['data_transfer_bytes'] ?? 0)),
        'writtenDataBytes' => max(0, (int)($project['written_data_bytes'] ?? 0)),
        'consumptionPeriodStart' => $project['consumption_period_start'] ?? null,
        'consumptionPeriodEnd' => $project['consumption_period_end'] ?? null,
        'quotaSource' => $storageLimitBytes !== null || $computeLimitSeconds !== null
            ? 'neon_project_api'
            : 'not_exposed_for_project',
    ];
}

/** @return array<string, int|string|null> */
function neon_plan_allowances(?string $plan): array
{
    if (strtolower(trim((string)$plan)) !== 'free') {
        return [
            'computeLimitSeconds' => null,
            'computeLimitHours' => null,
            'dataTransferLimitBytes' => null,
            'dataTransferLimitMb' => null,
            'source' => null,
        ];
    }

    // Neon currently exposes the account plan through GET /users/me, but not
    // these Free Plan allowances in the project quota payload. Keep this
    // fallback scoped to a verified Free account; API-provided quotas win.
    // https://neon.com/blog/neon-free-plan-1-gb-per-project
    // https://neon.com/blog/how-to-make-the-most-of-neons-free-plan
    return [
        'computeLimitSeconds' => 100 * 3600,
        'computeLimitHours' => 100,
        'dataTransferLimitBytes' => 5_000_000_000,
        'dataTransferLimitMb' => 5000,
        'source' => 'neon_free_plan_policy',
    ];
}

function neon_current_plan(string $apiKey): ?string
{
    $response = neon_api_request('https://console.neon.tech/api/v2/users/me', $apiKey, 6);
    $plan = $response['success'] ? trim((string)($response['data']['plan'] ?? '')) : '';
    return $plan === '' ? null : strtolower($plan);
}

/** @return array<string, mixed> */
function neon_apply_plan_allowances(array $metrics, ?string $plan): array
{
    $allowances = neon_plan_allowances($plan);
    if (($metrics['computeLimitSeconds'] ?? null) === null
        && $allowances['computeLimitSeconds'] !== null
    ) {
        $metrics['computeLimitSeconds'] = $allowances['computeLimitSeconds'];
        $metrics['computeLimitHours'] = $allowances['computeLimitHours'];
        $metrics['computeLimitSource'] = $allowances['source'];
    } else {
        $metrics['computeLimitSource'] = ($metrics['computeLimitSeconds'] ?? null) === null
            ? null
            : 'neon_project_api';
    }
    $metrics['dataTransferLimitBytes'] = $allowances['dataTransferLimitBytes'];
    $metrics['dataTransferLimitMb'] = $allowances['dataTransferLimitMb'];
    $metrics['dataTransferLimitSource'] = $allowances['source'];
    $metrics['plan'] = $plan;
    return $metrics;
}

/** @return array<string, mixed> */
function neon_usage_unavailable(string $reason): array
{
    return [
        'configured' => false,
        'available' => false,
        'reason' => $reason,
    ];
}

/** @return array<string, mixed> */
function neon_usage_metrics(): array
{
    $apiKey = trim((string)env_value('NEON_API_KEY', ''));
    if ($apiKey === '') {
        return neon_usage_unavailable('missing_api_key');
    }
    if (!function_exists('curl_init')) {
        return neon_usage_unavailable('curl_unavailable');
    }

    $cacheTtl = env_int('SYSTEM_USAGE_PROVIDER_CACHE_SECONDS', 300, 60, 3600);
    $projectHint = trim((string)env_value('NEON_PROJECT_ID', ''));
    $endpointHint = neon_endpoint_id_from_database_url((string)env_value('DATABASE_URL', '')) ?? '';
    $cachePath = rtrim(sys_get_temp_dir(), DIRECTORY_SEPARATOR)
        . DIRECTORY_SEPARATOR . 'ftc-neon-usage-' . hash('sha256', $apiKey . $projectHint . $endpointHint) . '.json';

    if (is_file($cachePath) && (time() - (int)filemtime($cachePath)) < $cacheTtl) {
        $cached = json_decode((string)file_get_contents($cachePath), true);
        if (is_array($cached)) {
            $cached['cache'] = ['hit' => true, 'ttlSeconds' => $cacheTtl];
            return $cached;
        }
    }

    $resolvedProject = neon_resolve_project_id($apiKey);
    $projectId = $resolvedProject['projectId'];
    if ($projectId === null) {
        return [
            'configured' => true,
            'available' => false,
            'reason' => $resolvedProject['reason'],
            'httpStatus' => $resolvedProject['status'],
            'projectIdSource' => $resolvedProject['source'],
        ];
    }

    $requestProject = static fn(string $id): array => neon_api_request(
        'https://console.neon.tech/api/v2/projects/' . rawurlencode($id),
        $apiKey,
        6
    );
    $projectResponse = $requestProject($projectId);

    // A stale or endpoint-shaped NEON_PROJECT_ID used to leave the widget in
    // an endless checking state. Treat it as an optional hint: on 404, resolve
    // the project again by matching DATABASE_URL's ep-* endpoint.
    if (!$projectResponse['success']
        && (int)$projectResponse['status'] === 404
        && $resolvedProject['source'] === 'environment'
    ) {
        $automaticProject = neon_resolve_project_id($apiKey, true);
        if ($automaticProject['projectId'] !== null && $automaticProject['projectId'] !== $projectId) {
            $resolvedProject = $automaticProject;
            $projectId = $automaticProject['projectId'];
            $projectResponse = $requestProject($projectId);
        }
    }
    if (!$projectResponse['success'] || !is_array($projectResponse['data']['project'] ?? null)) {
        return [
            'configured' => true,
            'available' => false,
            'reason' => 'project_request_failed',
            'httpStatus' => (int)$projectResponse['status'],
            'projectIdSource' => $resolvedProject['source'],
        ];
    }

    $now = new DateTimeImmutable('now', new DateTimeZone('UTC'));
    $metrics = neon_apply_plan_allowances(
        neon_project_metrics($projectResponse['data']['project']),
        neon_current_plan($apiKey)
    );

    $result = [
        'configured' => true,
        'available' => true,
        'projectId' => $projectId,
        'projectIdSource' => $resolvedProject['source'],
        ...$metrics,
        'computeUsagePercent' => system_usage_percent(
            (float)$metrics['computeTimeSeconds'],
            (float)($metrics['computeLimitSeconds'] ?? 0)
        ),
        'source' => 'neon_project_api',
        'checkedAt' => $now->format(DATE_ATOM),
        'cache' => ['hit' => false, 'ttlSeconds' => $cacheTtl],
    ];

    @file_put_contents(
        $cachePath,
        json_encode($result, JSON_UNESCAPED_SLASHES | JSON_UNESCAPED_UNICODE),
        LOCK_EX
    );
    return $result;
}
