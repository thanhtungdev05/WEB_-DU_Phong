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

// Test 3: Unconfigured Neon metrics
$neon = neon_usage_metrics();
assert(isset($neon['configured']), 'Neon result should have configured flag');
if (empty($_ENV['NEON_API_KEY'])) {
    assert($neon['configured'] === false, 'Neon should be unconfigured without API key');
    assert($neon['available'] === false, 'Neon should not be available without API key');
}

// Test 4: Unconfigured Render metrics
$render = render_usage_metrics();
assert(isset($render['configured']), 'Render result should have configured flag');
if (empty($_ENV['RENDER_API_KEY'])) {
    assert($render['configured'] === false, 'Render should be unconfigured without API key');
    assert($render['available'] === false, 'Render should not be available without API key');
}

echo "System usage metrics tests passed.\n";
