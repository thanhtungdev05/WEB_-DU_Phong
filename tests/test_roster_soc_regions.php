<?php
declare(strict_types=1);

require_once dirname(__DIR__) . '/api/lib/ktv_roster_import.php';

function soc_expect(bool $condition, string $message): void
{
    if (!$condition) {
        throw new RuntimeException($message);
    }
}

foreach (['SOC', 'TSOC', 'PSOC'] as $parent) {
    $row = ktv_roster_normalize_row([
        'employee_id' => '00012345',
        'email' => 'soc.user@fpt.com',
        'display_name' => 'SOC User',
        'parent_department' => $parent,
        'child_department_1' => $parent . 'HT1',
    ], 10);
    soc_expect($row['region_code'] === $parent, "$parent parent department must be accepted.");
}

$unit = ['unit_code' => 'TSOCHT1', 'region_code' => 'TSOC'];
$resolved = ktv_roster_resolve_unit(
    ['unit_code' => 'TSOCHT1', 'region_code' => 'SOC'],
    ['TSOCHT1' => $unit]
);
soc_expect($resolved === $unit, 'SOC parent must resolve a unit catalogued under TSOC.');

// Non-SOC regions must stay strict.
$rejected = false;
try {
    ktv_roster_resolve_unit(
        ['unit_code' => 'TSOCHT1', 'region_code' => 'TINHNI'],
        ['TSOCHT1' => $unit]
    );
} catch (RuntimeException $exception) {
    $rejected = true;
}
soc_expect($rejected, 'A TIN parent department must not resolve a SOC unit.');

echo "Roster SOC region regression passed.\n";
