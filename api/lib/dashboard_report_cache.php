<?php
declare(strict_types=1);

function dashboard_report_data_version(PDO $pdo): string
{
    $version = $pdo->query('SELECT last_value::text FROM dashboard_revision_seq')->fetchColumn();
    return is_string($version) ? $version : '';
}

function dashboard_report_cache_directory(): ?string
{
    $directory = trim((string)env_value('DASHBOARD_REPORT_CACHE_DIR', ''));
    if ($directory === '') {
        $directory = rtrim(sys_get_temp_dir(), DIRECTORY_SEPARATOR)
            . DIRECTORY_SEPARATOR . 'ftc-dashboard-report-cache-v1';
    }
    if (!is_dir($directory) && !@mkdir($directory, 0700, true) && !is_dir($directory)) {
        return null;
    }
    @chmod($directory, 0700);
    return $directory;
}

function dashboard_report_cache_key(string $version, array $query): string
{
    $allowed = [
        'section', 'scope', 'from', 'to', 'compare_from', 'compare_to',
        'cohort', 'include_branch_drilldown',
    ];
    $normalized = ['data_version' => $version];
    foreach ($allowed as $key) {
        if (array_key_exists($key, $query)) {
            $normalized[$key] = trim((string)$query[$key]);
        }
    }
    ksort($normalized);
    return hash('sha256', json_encode($normalized, JSON_UNESCAPED_SLASHES | JSON_UNESCAPED_UNICODE));
}

function dashboard_report_cache_read(string $path, int $maximumAgeSeconds): ?array
{
    clearstatcache(true, $path);
    if (!is_file($path)) {
        return null;
    }
    $modifiedAt = filemtime($path);
    if (!is_int($modifiedAt) || $modifiedAt < time() - $maximumAgeSeconds) {
        return null;
    }
    $handle = @fopen($path, 'rb');
    if (!is_resource($handle)) {
        return null;
    }
    try {
        if (!flock($handle, LOCK_SH)) {
            return null;
        }
        $json = stream_get_contents($handle);
        flock($handle, LOCK_UN);
    } finally {
        fclose($handle);
    }
    if (!is_string($json) || $json === '') {
        return null;
    }
    try {
        $decoded = json_decode($json, true, 512, JSON_THROW_ON_ERROR);
    } catch (JsonException) {
        return null;
    }
    return is_array($decoded) ? $decoded : null;
}

function dashboard_report_cache_write(string $path, array $payload): void
{
    $json = json_encode($payload, JSON_UNESCAPED_UNICODE | JSON_UNESCAPED_SLASHES | JSON_THROW_ON_ERROR);
    $handle = @fopen($path, 'c+b');
    if (!is_resource($handle)) {
        return;
    }
    try {
        if (!flock($handle, LOCK_EX)) {
            return;
        }
        ftruncate($handle, 0);
        rewind($handle);
        fwrite($handle, $json);
        fflush($handle);
        flock($handle, LOCK_UN);
    } finally {
        fclose($handle);
    }
    @chmod($path, 0600);
}

function dashboard_report_cache_prune(string $directory, int $maximumFiles): void
{
    $paths = glob($directory . DIRECTORY_SEPARATOR . 'report-*.json') ?: [];
    if (count($paths) <= $maximumFiles) {
        return;
    }
    usort($paths, static fn(string $left, string $right): int => (filemtime($right) ?: 0) <=> (filemtime($left) ?: 0));
    foreach (array_slice($paths, $maximumFiles) as $path) {
        if (preg_match('/^report-[a-f0-9]{64}\.json$/D', basename($path)) && is_file($path)) {
            @unlink($path);
            if (is_file($path . '.lock')) {
                @unlink($path . '.lock');
            }
        }
    }
}

function dashboard_report_cache_annotate(array $payload, string $status, string $version, float $startedAt): array
{
    $payload['meta'] = is_array($payload['meta'] ?? null) ? $payload['meta'] : [];
    $payload['meta']['data_version'] = $version;
    $payload['meta']['cache'] = [
        'status' => $status,
        'duration_ms' => (int)round((microtime(true) - $startedAt) * 1000),
    ];
    $GLOBALS['dashboard_report_cache_status'] = $status;
    return $payload;
}

function dashboard_report_cached_payload(PDO $pdo, array $query): array
{
    $startedAt = microtime(true);
    $includeBranchDrilldown = !array_key_exists('include_branch_drilldown', $query)
        || filter_var($query['include_branch_drilldown'], FILTER_VALIDATE_BOOLEAN);
    $cacheable = env_bool('DASHBOARD_REPORT_CACHE_ENABLED', true) && !$includeBranchDrilldown;
    if (!$cacheable) {
        return dashboard_report_cache_annotate(
            dashboard_report_payload($pdo, $query),
            'bypass',
            dashboard_report_data_version($pdo),
            $startedAt
        );
    }

    $version = dashboard_report_data_version($pdo);
    $directory = dashboard_report_cache_directory();
    if ($directory === null) {
        return dashboard_report_cache_annotate(
            dashboard_report_payload($pdo, $query),
            'bypass',
            $version,
            $startedAt
        );
    }

    $maximumAge = env_int('DASHBOARD_REPORT_CACHE_SECONDS', 21600, 30, 86400);
    $key = dashboard_report_cache_key($version, $query);
    $path = $directory . DIRECTORY_SEPARATOR . 'report-' . $key . '.json';
    $cached = dashboard_report_cache_read($path, $maximumAge);
    if ($cached !== null) {
        return dashboard_report_cache_annotate($cached, 'hit', $version, $startedAt);
    }

    $lock = @fopen($path . '.lock', 'c+b');
    if (is_resource($lock)) {
        flock($lock, LOCK_EX);
        $cached = dashboard_report_cache_read($path, $maximumAge);
        if ($cached !== null) {
            flock($lock, LOCK_UN);
            fclose($lock);
            return dashboard_report_cache_annotate($cached, 'hit-after-wait', $version, $startedAt);
        }
    }

    try {
        $payload = dashboard_report_payload($pdo, $query);
        dashboard_report_cache_write($path, $payload);
        dashboard_report_cache_prune(
            $directory,
            env_int('DASHBOARD_REPORT_CACHE_MAX_FILES', 64, 8, 512)
        );
    } finally {
        if (is_resource($lock)) {
            flock($lock, LOCK_UN);
            fclose($lock);
        }
    }
    return dashboard_report_cache_annotate($payload, 'miss', $version, $startedAt);
}
