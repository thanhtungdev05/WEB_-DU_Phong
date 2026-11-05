<?php
declare(strict_types=1);

/**
 * One-off, ADD-ONLY seed of SOC KTV accounts from an approved roster workbook.
 *
 * Unlike the web roster import (snapshot mode) this script never terminates,
 * updates or reactivates anyone: rows whose Empl ID or Email already exists are
 * skipped and reported. It only accepts units that belong to the SOC regions.
 *
 * Usage:
 *   php scripts/seed_soc_ktv.php --file=Mau_Import_SOC.xlsx [--batch=soc-seed-YYYYMMDD]
 *       Dry run (default): validates, reports, then rolls back. Nothing is written.
 *   php scripts/seed_soc_ktv.php --file=... --batch=... --apply
 *       Writes inside one transaction (all rows or none).
 *   php scripts/seed_soc_ktv.php --file=... --check-file
 *       Offline validation of the workbook only (no database connection).
 *
 * Migration 066_soc_org_unit_catalog.sql must be applied first.
 */

if (PHP_SAPI !== 'cli') {
    http_response_code(404);
    exit;
}

const SOC_SEED_REGIONS = ['SOC', 'TSOC', 'PSOC'];

$root = dirname(__DIR__);
require_once $root . '/api/lib/runtime.php';
require_once $root . '/api/lib/ktv_roster_import.php';

function soc_seed_fail(string $message, int $code = 1): never
{
    fwrite(STDERR, '[seed-soc] ' . $message . PHP_EOL);
    exit($code);
}

function soc_seed_normalize_row(array $row, int $rowNumber, bool $uses1904Dates = false): array
{
    $employeeId = trim((string)($row['employee_id'] ?? ''));
    $email = strtolower(trim((string)($row['email'] ?? '')));
    $displayName = trim((string)($row['display_name'] ?? ''));
    if (!preg_match('/^\d{8}$/', $employeeId)) {
        throw new RuntimeException("Row $rowNumber has invalid Empl ID; expected exactly 8 digits.");
    }
    if (!filter_var($email, FILTER_VALIDATE_EMAIL)) {
        throw new RuntimeException("Row $rowNumber has invalid Email.");
    }
    if ($displayName === '') {
        throw new RuntimeException("Row $rowNumber has empty Name.");
    }
    $childDepartment2 = ktv_roster_nullable_text($row['child_department_2'] ?? null, 100);
    $childDepartment1 = ktv_roster_nullable_text($row['child_department_1'] ?? null, 100);
    $unitCode = strtoupper((string)($childDepartment2 ?: $childDepartment1));
    if ($unitCode === '') {
        throw new RuntimeException("Row $rowNumber has no Child Department.");
    }
    return [
        'employee_id' => $employeeId,
        'display_name' => $displayName,
        'email' => $email,
        'job_title' => ktv_roster_nullable_text($row['job_title'] ?? null),
        'branch' => ktv_roster_nullable_text($row['branch'] ?? null, 100),
        'parent_department' => strtoupper(trim((string)($row['parent_department'] ?? ''))),
        'class_code' => ktv_roster_nullable_text($row['class_code'] ?? null, 50),
        'unit_code' => $unitCode,
        'source_row' => $rowNumber,
    ];
}

function soc_seed_parse_workbook(string $path): array
{
    if (!is_file($path)) {
        throw new RuntimeException('Workbook not found.');
    }
    $zip = new ZipArchive();
    if ($zip->open($path) !== true) {
        throw new RuntimeException('Unable to open workbook.');
    }
    try {
        $sheets = ktv_roster_workbook_sheets($zip);
        $sheet = $sheets[0];
        foreach ($sheets as $candidate) {
            if (ktv_roster_sheet_name_key((string)$candidate['name']) === 'danh sách ktv') {
                $sheet = $candidate;
                break;
            }
        }
        return ktv_roster_parse_worksheet(
            $zip,
            $sheet,
            ktv_roster_shared_strings($zip),
            ktv_roster_uses_1904_dates($zip),
            KTV_ROSTER_REQUIRED_HEADERS,
            'soc_seed_normalize_row'
        );
    } finally {
        $zip->close();
    }
}

$options = getopt('', ['file:', 'batch::', 'apply', 'check-file']);
$file = (string)($options['file'] ?? '');
if ($file === '') {
    soc_seed_fail('Missing --file=<workbook.xlsx>.', 2);
}
$apply = array_key_exists('apply', $options);
$checkOnly = array_key_exists('check-file', $options);
$batch = (string)($options['batch'] ?? ('soc-seed-' . date('Ymd')));
if (!preg_match('/^[A-Za-z0-9._:-]{1,100}$/', $batch)) {
    soc_seed_fail('Invalid --batch value.', 2);
}
if ($apply && $checkOnly) {
    soc_seed_fail('--apply and --check-file cannot be combined.', 2);
}

try {
    $parsed = soc_seed_parse_workbook($file);
} catch (Throwable $exception) {
    soc_seed_fail('Parse failed: ' . $exception->getMessage());
}
$rows = $parsed['rows'];
$errors = $parsed['errors'];
echo 'Workbook rows: ' . (int)$parsed['totalRows'] . ', valid: ' . count($rows) . ', invalid: ' . count($errors) . PHP_EOL;
foreach ($errors as $error) {
    echo '  invalid row ' . ($error['row'] ?? '?') . ': ' . ($error['message'] ?? '') . PHP_EOL;
}
if ($errors || !$rows) {
    soc_seed_fail('Workbook has invalid or no rows. Nothing was written.');
}
if ($checkOnly) {
    echo 'Offline check passed. No database connection was made.' . PHP_EOL;
    exit(0);
}

load_app_environment($root);
$pdo = null;
try {
    $pdo = create_database_connection();
    echo 'Mode: ' . ($apply ? 'APPLY (will write)' : 'DRY RUN (will roll back)') . ', batch: ' . $batch . PHP_EOL;
    $pdo->beginTransaction();

    $unitCache = ktv_roster_load_unit_cache($pdo);
    $userCache = ktv_roster_load_user_match_cache($pdo, $rows, $apply);
    $insert = $pdo->prepare(
        <<<'SQL'
        INSERT INTO users (
            email, display_name, role, iam_profile,
            employee_id, job_title,
            class_code, is_terminated, termination_date, termination_reason,
            unit_id, unit_code, unit_name, region_code, dashboard_region, region_id,
            employee_source, employee_seed_batch, employee_synced_at,
            created_at, updated_at
        ) VALUES (
            :email, :display_name, 'KTV', '{}'::jsonb,
            :employee_id, :job_title,
            :class_code, FALSE, NULL, NULL,
            :unit_id, :unit_code, :unit_name, :region_code, :dashboard_region, :region_id,
            :employee_source, :employee_seed_batch, NOW(),
            NOW(), NOW()
        )
        SQL
    );

    $inserted = [];
    $existingRows = [];
    $problems = [];
    $regionMismatchRows = [];
    foreach ($rows as $row) {
        $rowNumber = (int)$row['source_row'];
        $unit = $unitCache[$row['unit_code']] ?? null;
        if (!is_array($unit)) {
            $problems[] = "Row $rowNumber: unit {$row['unit_code']} is not in the active catalog (apply migration 066?).";
            continue;
        }
        $regionCode = strtoupper((string)$unit['region_code']);
        if (!in_array($regionCode, SOC_SEED_REGIONS, true)) {
            $problems[] = "Row $rowNumber: unit {$row['unit_code']} belongs to non-SOC region $regionCode; refusing.";
            continue;
        }
        if ($row['parent_department'] !== '' && $row['parent_department'] !== $regionCode) {
            $regionMismatchRows[] = $rowNumber;
        }
        if (ktv_roster_cached_user_matches($userCache, $row)) {
            $existingRows[] = $rowNumber;
            continue;
        }
        $dashboardRegion = (string)($unit['dashboard_group'] ?: $unit['region_name']);
        $insert->execute([
            'email' => $row['email'],
            'display_name' => $row['display_name'],
            'employee_id' => $row['employee_id'],
            'job_title' => $row['job_title'],
            'class_code' => $row['class_code'],
            'unit_id' => $unit['unit_id'],
            'unit_code' => $unit['unit_code'],
            'unit_name' => $unit['unit_name'],
            'region_code' => $unit['region_code'],
            'dashboard_region' => $dashboardRegion,
            'region_id' => $unit['region_id'],
            'employee_source' => KTV_ROSTER_IMPORT_SOURCE,
            'employee_seed_batch' => $batch,
        ]);
        $row['dashboard_region'] = $dashboardRegion;
        $inserted[] = ktv_roster_compact_change($row);
    }

    echo 'To insert: ' . count($inserted) . PHP_EOL;
    echo 'Skipped (Empl ID or Email already exists): ' . count($existingRows)
        . ($existingRows ? ' rows ' . implode(',', $existingRows) : '') . PHP_EOL;
    echo 'Rows whose Parent Department differs from the unit region (unit wins): '
        . count($regionMismatchRows)
        . ($regionMismatchRows ? ' rows ' . implode(',', $regionMismatchRows) : '') . PHP_EOL;
    if ($problems) {
        foreach ($problems as $problem) {
            echo '  ' . $problem . PHP_EOL;
        }
        throw new RuntimeException('Blocking problems found; rolled back.');
    }

    if ($apply) {
        ktv_roster_log_import($pdo, [
            'batch_id' => $batch,
            'total_rows' => count($rows),
            'inserted' => count($inserted),
            'updated' => 0,
            'unchanged' => count($existingRows),
            'terminated' => 0,
            'reactivated' => 0,
            'status' => 'success',
            'error_count' => 0,
            'errors' => [],
            'changes' => ['inserted' => $inserted, 'updated' => [], 'terminated' => [], 'reactivated' => []],
        ], null, basename($file));
        $pdo->commit();
        echo 'COMMITTED ' . count($inserted) . ' users in batch ' . $batch . '.' . PHP_EOL;
    } else {
        $pdo->rollBack();
        echo 'Dry run finished; transaction rolled back, nothing written.' . PHP_EOL;
    }
} catch (Throwable $exception) {
    if ($pdo instanceof PDO && $pdo->inTransaction()) {
        $pdo->rollBack();
    }
    soc_seed_fail(get_class($exception) . ': ' . $exception->getMessage());
}
