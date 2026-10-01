<?php
declare(strict_types=1);

require_once dirname(__DIR__) . '/api/lib/runtime.php';
require_once dirname(__DIR__) . '/api/lib/dashboard_report_cache.php';

function cache_assert(bool $condition, string $message): void
{
    if (!$condition) {
        fwrite(STDERR, $message . PHP_EOL);
        exit(1);
    }
}

$baseQuery = [
    'section' => 'summary',
    'scope' => 'period',
    'from' => '2026-09-01',
    'to' => '2026-09-30',
    'include_branch_drilldown' => '0',
];
$sameQueryWithNoise = $baseQuery + ['refresh' => '1', 'ignored' => 'value'];
cache_assert(
    dashboard_report_cache_key('10', $baseQuery) === dashboard_report_cache_key('10', $sameQueryWithNoise),
    'Non-contract query parameters must not fragment the report cache.'
);
cache_assert(
    dashboard_report_cache_key('10', $baseQuery) !== dashboard_report_cache_key('11', $baseQuery),
    'A dashboard revision change must invalidate the report cache key.'
);
cache_assert(
    dashboard_report_cache_key('10', $baseQuery) !== dashboard_report_cache_key('10', array_merge($baseQuery, ['section' => 'trends'])),
    'Report sections must use independent cache entries.'
);

$directory = sys_get_temp_dir() . DIRECTORY_SEPARATOR . 'ftc-dashboard-cache-test-' . bin2hex(random_bytes(6));
cache_assert(mkdir($directory, 0700), 'Unable to create the isolated cache test directory.');
$path = $directory . DIRECTORY_SEPARATOR . 'report-' . str_repeat('a', 64) . '.json';
$payload = ['meta' => ['section' => 'summary'], 'summary' => ['current' => ['recorded_practice_count' => 12]]];
dashboard_report_cache_write($path, $payload);
cache_assert(dashboard_report_cache_read($path, 60) === $payload, 'Cache payload must round-trip without contract changes.');
touch($path, time() - 120);
cache_assert(dashboard_report_cache_read($path, 60) === null, 'Expired cache payloads must not be served.');

unlink($path);
rmdir($directory);
echo "Dashboard report cache tests passed.\n";
