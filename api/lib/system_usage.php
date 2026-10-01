<?php
declare(strict_types=1);

function system_usage_float(string $key, float $default, float $minimum, float $maximum): float
{
    $raw = env_value($key);
    if ($raw === null || !is_numeric($raw)) {
        return $default;
    }
    return max($minimum, min($maximum, (float)$raw));
}

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
    $base = 'https://api.render.com/v1/metrics/';
    $common = '&resource=' . rawurlencode($serviceId);
    $requests = [
        'bandwidth' => $base . 'bandwidth?startTime=' . rawurlencode($monthStart->format(DATE_ATOM))
            . '&endTime=' . rawurlencode($now->format(DATE_ATOM)) . $common,
        'cpu' => $base . 'cpu?startTime=' . rawurlencode($hourStart->format(DATE_ATOM))
            . '&endTime=' . rawurlencode($now->format(DATE_ATOM)) . '&resolutionSeconds=300' . $common,
        'cpu_limit' => $base . 'cpu-limit?startTime=' . rawurlencode($hourStart->format(DATE_ATOM))
            . '&endTime=' . rawurlencode($now->format(DATE_ATOM)) . '&resolutionSeconds=300' . $common,
        'memory' => $base . 'memory?startTime=' . rawurlencode($hourStart->format(DATE_ATOM))
            . '&endTime=' . rawurlencode($now->format(DATE_ATOM)) . '&resolutionSeconds=300' . $common,
        'memory_limit' => $base . 'memory-limit?startTime=' . rawurlencode($hourStart->format(DATE_ATOM))
            . '&endTime=' . rawurlencode($now->format(DATE_ATOM)) . '&resolutionSeconds=300' . $common,
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
    $bandwidthLimitGb = system_usage_float('RENDER_BANDWIDTH_LIMIT_GB', 100.0, 0.0, 1000000.0);
    $bandwidthPercent = system_usage_percent($bandwidthGb, $bandwidthLimitGb);

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
            'status' => $bandwidthPercent === null ? 'UNKNOWN' : system_usage_status($bandwidthPercent),
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

    $projectId = trim((string)env_value('NEON_PROJECT_ID', ''));
    $cacheTtl = env_int('SYSTEM_USAGE_PROVIDER_CACHE_SECONDS', 300, 60, 3600);
    $cachePath = rtrim(sys_get_temp_dir(), DIRECTORY_SEPARATOR)
        . DIRECTORY_SEPARATOR . 'ftc-neon-usage-' . hash('sha256', $apiKey . $projectId) . '.json';

    if (is_file($cachePath) && (time() - (int)filemtime($cachePath)) < $cacheTtl) {
        $cached = json_decode((string)file_get_contents($cachePath), true);
        if (is_array($cached)) {
            $cached['cache'] = ['hit' => true, 'ttlSeconds' => $cacheTtl];
            return $cached;
        }
    }

    $now = new DateTimeImmutable('now', new DateTimeZone('UTC'));

    // Tự động tìm project ID nếu chưa cấu hình NEON_PROJECT_ID
    if ($projectId === '') {
        $projectsRes = neon_api_request('https://api.neon.tech/api/v2/projects', $apiKey, 6);
        if ($projectsRes['success'] && is_array($projectsRes['data']['projects'] ?? null)) {
            $projects = $projectsRes['data']['projects'];
            if (!empty($projects[0]['id'])) {
                $projectId = (string)$projects[0]['id'];
            }
        }
    }

    if ($projectId === '') {
        return neon_usage_unavailable('project_id_not_found');
    }

    // Lấy consumption metrics cho project
    $metricsUrl = 'https://api.neon.tech/api/v2/projects/' . rawurlencode($projectId) . '/consumption_metrics';
    $res = neon_api_request($metricsUrl, $apiKey, 6);

    $storageBytes = 0.0;
    $computeSeconds = 0.0;
    $dataTransferBytes = 0.0;
    $writtenDataBytes = 0.0;
    $available = false;

    if ($res['success'] && is_array($res['data'])) {
        $data = $res['data'];
        $period = is_array($data['periods'][0] ?? null) ? $data['periods'][0] : $data;
        $storageBytes = (float)($period['synthetic_storage_size'] ?? $period['data_storage_bytes'] ?? 0.0);
        $computeSeconds = (float)($period['compute_time_seconds'] ?? 0.0);
        $dataTransferBytes = (float)($period['data_transfer_bytes'] ?? 0.0);
        $writtenDataBytes = (float)($period['written_data_bytes'] ?? 0.0);
        $available = true;
    } else {
        // Fallback gọi trực tiếp project info
        $projectUrl = 'https://api.neon.tech/api/v2/projects/' . rawurlencode($projectId);
        $projRes = neon_api_request($projectUrl, $apiKey, 6);
        if ($projRes['success'] && is_array($projRes['data']['project'] ?? null)) {
            $proj = $projRes['data']['project'];
            $storageBytes = (float)($proj['synthetic_storage_size'] ?? 0.0);
            $computeSeconds = (float)($proj['compute_time_seconds'] ?? 0.0);
            $available = true;
        }
    }

    $storageMb = round($storageBytes / (1024 * 1024), 2);
    $computeHours = round($computeSeconds / 3600, 2);
    $storageLimitMb = system_usage_float('NEON_STORAGE_LIMIT_MB', 512.0, 1.0, 10485760.0);
    $computeLimitHours = env_int('NEON_COMPUTE_HOURS_LIMIT', 100, 1, 1000000);

    $result = [
        'configured' => true,
        'available' => $available,
        'projectId' => $projectId,
        'syntheticStorageBytes' => (int)round($storageBytes),
        'syntheticStorageMb' => $storageMb,
        'storageUsagePercent' => system_usage_percent($storageMb, $storageLimitMb),
        'computeTimeSeconds' => (int)round($computeSeconds),
        'computeHours' => $computeHours,
        'computeUsagePercent' => system_usage_percent($computeHours, (float)$computeLimitHours),
        'dataTransferBytes' => (int)round($dataTransferBytes),
        'writtenDataBytes' => (int)round($writtenDataBytes),
        'source' => 'neon_management_api',
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


