<?php
declare(strict_types=1);

if (PHP_SAPI !== 'cli') {
    http_response_code(404);
    exit;
}

$root = dirname(__DIR__);
require_once __DIR__ . '/lib/runtime.php';
load_app_environment($root);

$arguments = array_slice($argv, 1);
$unknownArguments = array_values(array_diff($arguments, ['--dry-run', '--status', '--fallback']));
if ($unknownArguments) {
    fwrite(STDERR, '[migration-error] Unknown option: ' . implode(', ', $unknownArguments) . PHP_EOL);
    exit(2);
}

$dryRun = in_array('--dry-run', $arguments, true);
$statusOnly = in_array('--status', $arguments, true);
$targetFallback = in_array('--fallback', $arguments, true);
if ($targetFallback) {
    putenv('DATABASE_ACTIVE=fallback');
    $_ENV['DATABASE_ACTIVE'] = 'fallback';
    fwrite(STDOUT, "[migration] Targeting FALLBACK_DATABASE_URL.\n");
}
if ($dryRun && $statusOnly) {
    fwrite(STDERR, "[migration-error] Use either --dry-run or --status, not both.\n");
    exit(2);
}

$migrationDirectory = __DIR__ . DIRECTORY_SEPARATOR . 'migrations';
$migrationFiles = glob($migrationDirectory . DIRECTORY_SEPARATOR . '*.sql') ?: [];
sort($migrationFiles, SORT_STRING);

if (!$migrationFiles) {
    fwrite(STDERR, "[migration-error] No migration files were found.\n");
    exit(1);
}

$pdo = null;
$lockAcquired = false;

try {
    $pdo = create_database_connection();
    $pdo->query("SELECT pg_advisory_lock(hashtext('ftc_schema_migrations'))");
    $lockAcquired = true;

    $migrationTableExists = (bool)$pdo
        ->query("SELECT to_regclass('public.schema_migrations')")
        ->fetchColumn();

    if (!$migrationTableExists && !$statusOnly && !$dryRun) {
        $pdo->exec(
            'CREATE TABLE schema_migrations (
                version TEXT PRIMARY KEY,
                checksum CHAR(64) NOT NULL,
                execution_ms INTEGER NOT NULL,
                applied_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
            )'
        );
        $migrationTableExists = true;
    }

    $appliedRows = $migrationTableExists
        ? $pdo->query('SELECT version, checksum, applied_at FROM schema_migrations ORDER BY version')->fetchAll()
        : [];
    $applied = [];
    foreach ($appliedRows as $row) {
        $applied[$row['version']] = $row;
    }
    $latestAppliedVersion = $appliedRows
        ? (string)$appliedRows[array_key_last($appliedRows)]['version']
        : null;

    $pendingCount = 0;
    foreach ($migrationFiles as $file) {
        $version = basename($file, '.sql');
        $sql = (string)file_get_contents($file);
        $normalized = str_replace(["\r\n", "\r"], "\n", $sql);
        $checksum = hash('sha256', $normalized);

        if (isset($applied[$version])) {
            if (!hash_equals((string)$applied[$version]['checksum'], $checksum)) {
                $crlfChecksum = hash('sha256', str_replace("\n", "\r\n", $normalized));
                if (!hash_equals((string)$applied[$version]['checksum'], $crlfChecksum)) {
                    throw new RuntimeException("Migration $version was modified after it was applied.");
                }
                $resync = $pdo->prepare('UPDATE schema_migrations SET checksum = :checksum, applied_at = applied_at WHERE version = :version');
                $resync->execute(['checksum' => $checksum, 'version' => $version]);
                fwrite(STDOUT, "[resynced] $version (line-ending checksum)\n");
            }
            fwrite(STDOUT, "[applied] $version\n");
            continue;
        }

        // Forward-only migrations: a database may have been baselined at a newer
        // version after the migration ledger was introduced. Never replay an
        // older, unrecorded file on top of that newer schema.
        if ($latestAppliedVersion !== null && strcmp($version, $latestAppliedVersion) < 0) {
            fwrite(STDOUT, "[superseded] $version (database baseline: $latestAppliedVersion)\n");
            continue;
        }

        $pendingCount++;
        if ($statusOnly || $dryRun) {
            fwrite(STDOUT, "[pending] $version\n");
            continue;
        }

        $startedAt = microtime(true);
        $pdo->beginTransaction();
        try {
            $pdo->exec($sql);
            $executionMs = (int)round((microtime(true) - $startedAt) * 1000);
            $stmt = $pdo->prepare(
                'INSERT INTO schema_migrations (version, checksum, execution_ms) VALUES (:version, :checksum, :execution_ms)'
            );
            $stmt->execute([
                'version' => $version,
                'checksum' => $checksum,
                'execution_ms' => $executionMs,
            ]);
            $pdo->commit();
            fwrite(STDOUT, "[migrated] $version ({$executionMs} ms)\n");
        } catch (Throwable $exception) {
            if ($pdo->inTransaction()) {
                $pdo->rollBack();
            }
            throw $exception;
        }
    }

    if ($statusOnly || $dryRun) {
        fwrite(STDOUT, "Pending migrations: $pendingCount\n");
    } elseif ($pendingCount === 0) {
        fwrite(STDOUT, "Database is up to date.\n");
    }
} catch (Throwable $exception) {
    fwrite(STDERR, '[migration-error] ' . $exception->getMessage() . PHP_EOL);
    exit(1);
} finally {
    if ($lockAcquired && $pdo instanceof PDO) {
        try {
            $pdo->query("SELECT pg_advisory_unlock(hashtext('ftc_schema_migrations'))");
        } catch (Throwable) {
        }
    }
}
