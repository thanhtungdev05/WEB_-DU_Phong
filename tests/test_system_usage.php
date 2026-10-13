<?php
declare(strict_types=1);

require_once dirname(__DIR__) . '/api/lib/runtime.php';
require_once dirname(__DIR__) . '/api/lib/system_usage.php';

// Test 1: Percent calculation
assert(system_usage_percent(50.0, 100.0) === 50.0, '50/100 should be 50.0%');
assert(system_usage_percent(12.345, 100.0) === 12.3, '12.345/100 should round to 12.3%');
assert(system_usage_percent(50.0, 0.0) === null, '0 limit should be null');

// Test 2: Status threshold
assert(system_usage_status(50.0) === 'OK', '50% should be OK');
assert(system_usage_status(80.0) === 'WARNING', '80% should be WARNING');
assert(system_usage_status(92.0) === 'CRITICAL', '92% should be CRITICAL');

// Test 3: Resolve the Neon compute endpoint without mistaking it for a project ID.
assert(
    neon_endpoint_id_from_database_url(
        'postgresql://user@ep-cool-river-a1b2c3-pooler.ap-southeast-1.aws.neon.tech/db'
    ) === 'ep-cool-river-a1b2c3',
    'Pooled Neon host should resolve to its ep-* endpoint ID'
);
assert(
    neon_endpoint_id_from_database_url('postgresql://localhost/db') === null,
    'Non-Neon hosts should not produce an endpoint ID'
);

// Test 4: Usage and every limit come from the Neon Project API payload.
$projectMetrics = neon_project_metrics([
    'compute_time_seconds' => 7200,
    'data_transfer_bytes' => 123456,
    'written_data_bytes' => 654321,
    'consumption_period_start' => '2026-10-01T00:00:00Z',
    'consumption_period_end' => '2026-11-01T00:00:00Z',
    'branch_logical_size_limit_bytes' => 536870912,
    'settings' => [
        'quota' => [
            'logical_size_bytes' => 1073741824,
            'compute_time_seconds' => 360000,
        ],
    ],
]);
assert($projectMetrics['storageLimitBytes'] === 1073741824, 'Storage quota should come from settings.quota');
assert($projectMetrics['computeHours'] === 2.0, 'Compute usage should convert seconds to hours');
assert($projectMetrics['computeLimitHours'] === 100.0, 'Compute quota should convert seconds to hours');
assert($projectMetrics['dataTransferBytes'] === 123456, 'Transfer usage should come from project payload');

$unlimitedProjectMetrics = neon_project_metrics([
    'compute_time_seconds' => 0,
    'branch_logical_size_limit_bytes' => 0,
    'settings' => ['quota' => ['logical_size_bytes' => 0, 'compute_time_seconds' => 0]],
]);
assert($unlimitedProjectMetrics['storageLimitBytes'] === null, 'Zero storage quota means unavailable/unlimited');
assert($unlimitedProjectMetrics['computeLimitHours'] === null, 'Zero compute quota means unavailable/unlimited');

$freeMetrics = neon_apply_plan_allowances($unlimitedProjectMetrics, 'free');
assert($freeMetrics['computeLimitHours'] === 100, 'Verified Free plan should receive its current compute allowance');
assert($freeMetrics['dataTransferLimitMb'] === 5000, 'Verified Free plan should receive its current transfer allowance');
assert($freeMetrics['computeLimitSource'] === 'neon_free_plan_policy', 'Free plan fallback source should be explicit');

$paidMetrics = neon_apply_plan_allowances($unlimitedProjectMetrics, 'launch');
assert($paidMetrics['computeLimitHours'] === null, 'Paid plans must not inherit Free compute allowances');
assert($paidMetrics['dataTransferLimitMb'] === null, 'Paid plans must not inherit Free transfer allowances');

$apiQuotaMetrics = neon_apply_plan_allowances($projectMetrics, 'free');
assert($apiQuotaMetrics['computeLimitHours'] === 100.0, 'Project API quota should take precedence over plan fallback');
assert($apiQuotaMetrics['computeLimitSource'] === 'neon_project_api', 'API quota source should remain authoritative');

$systemUsageSource = file_get_contents(dirname(__DIR__) . '/api/lib/system_usage.php');
assert(
    str_contains($systemUsageSource, "neon_resolve_project_id(\$apiKey, true)"),
    'A stale configured project ID must fall back to automatic endpoint matching'
);
assert(
    str_contains($systemUsageSource, '/users/me/organizations'),
    'Personal API keys must discover organization projects without a hardcoded organization ID'
);

// Test 5: Unconfigured Neon metrics
$neon = neon_usage_metrics();
assert(isset($neon['configured']), 'Neon result should have configured flag');
if (empty($_ENV['NEON_API_KEY'])) {
    assert($neon['configured'] === false, 'Neon should be unconfigured without API key');
    assert($neon['available'] === false, 'Neon should not be available without API key');
}

// Test 6: Unconfigured Render metrics
$render = render_usage_metrics();
assert(isset($render['configured']), 'Render result should have configured flag');
if (empty($_ENV['RENDER_API_KEY'])) {
    assert($render['configured'] === false, 'Render should be unconfigured without API key');
    assert($render['available'] === false, 'Render should not be available without API key');
}

// Render exposes service bandwidth usage but no workspace quota in its public API.
assert(str_contains($systemUsageSource, "'quotaAvailable' => false"), 'Render bandwidth quota must not be invented');
assert(!str_contains($systemUsageSource, 'RENDER_BANDWIDTH_LIMIT_GB'), 'Render limit must not come from an env default');
assert(
    str_contains($systemUsageSource, "format('Y-m-d\\TH:i:s\\Z')"),
    'Render metric timestamps must use UTC Z form because +00:00 is rejected by the API'
);

$apiSource = file_get_contents(dirname(__DIR__) . '/api/index.php');
$frontendSource = file_get_contents(dirname(__DIR__) . '/dashboard-authen/js/system_monitor.js');
$envExample = file_get_contents(dirname(__DIR__) . '/.env.example');
foreach ([
    'NEON_STORAGE_LIMIT_MB',
    'NEON_CONNECTION_LIMIT',
    'NEON_COMPUTE_HOURS_LIMIT',
    'NEON_STORAGE_ACTUAL_MB',
    'NEON_COMPUTE_HOURS_USED',
    'RENDER_BANDWIDTH_LIMIT_GB',
] as $manualProviderValue) {
    assert(!str_contains($apiSource, $manualProviderValue), "$manualProviderValue must not affect the usage API");
    assert(!str_contains($frontendSource, $manualProviderValue), "$manualProviderValue must not affect the widget");
    assert(!str_contains($envExample, $manualProviderValue), "$manualProviderValue must not be configured manually");
}

echo "System usage metrics tests passed.\n";
