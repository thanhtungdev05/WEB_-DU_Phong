<?php
declare(strict_types=1);

if (PHP_SAPI !== 'cli') {
    http_response_code(404);
    exit;
}

$root = dirname(__DIR__);
require_once $root . '/api/lib/runtime.php';
load_app_environment($root);

try {
    $pdo = create_database_connection();

    $databaseBytes = (int)$pdo->query('SELECT pg_database_size(current_database())')->fetchColumn();
    $tables = $pdo->query(
        <<<'SQL'
        SELECT relname AS table_name,
               n_live_tup::bigint AS estimated_rows,
               pg_total_relation_size(relid)::bigint AS total_bytes
          FROM pg_stat_user_tables
         ORDER BY pg_total_relation_size(relid) DESC, relname
        SQL
    )->fetchAll();

    $sessionPayload = $pdo->query(
        <<<'SQL'
        SELECT COUNT(*)::bigint AS row_count,
               COALESCE(SUM(pg_column_size(ROW(
                   id, user_id, technician_id, name, email,
                   COALESCE(started_at, finished_at), duration_sec, mode,
                   device_id, lab_id, is_passed, status, completed_first_try,
                   last_action, practice_attempt_no, attempt_sequence_complete,
                   seed_batch
               ))), 0)::bigint AS estimated_payload_bytes,
               COALESCE(SUM(pg_column_size(ROW(
                   id, user_id, technician_id, name, email,
                   COALESCE(started_at, finished_at), duration_sec, mode,
                   device_id, lab_id, is_passed, status, completed_first_try,
                   last_action, practice_attempt_no, attempt_sequence_complete,
                   seed_batch
               ))) FILTER (
                   WHERE COALESCE(started_at, finished_at) >= CURRENT_DATE - INTERVAL '180 days'
               ), 0)::bigint AS recent_180d_payload_bytes
          FROM timer_sessions
         WHERE NOT COALESCE(is_mock, FALSE)
           AND status IN ('completed', 'failed')
        SQL
    )->fetch();

    $boundedSessionCount = $pdo->prepare(
        <<<'SQL'
        SELECT COUNT(*)
          FROM timer_sessions
         WHERE COALESCE(started_at, finished_at) >=
               CURRENT_DATE - make_interval(days => CAST(:history_days AS INTEGER))
        SQL
    );
    $boundedSessionCount->execute([
        'history_days' => env_int('DASHBOARD_HISTORY_DAYS', 180, 30, 3650),
    ]);

    $stats = $pdo->query(
        <<<'SQL'
        SELECT xact_commit::bigint,
               xact_rollback::bigint,
               tup_returned::bigint,
               tup_fetched::bigint,
               tup_inserted::bigint,
               tup_updated::bigint,
               stats_reset
          FROM pg_stat_database
         WHERE datname = current_database()
        SQL
    )->fetch();

    $dashboardRevision = $pdo->query(
        'SELECT last_value::bigint AS revision FROM dashboard_revision_seq'
    )->fetch();
    $revisionTriggerCount = (int)$pdo->query(
        <<<'SQL'
        SELECT COUNT(*)
          FROM pg_trigger
         WHERE tgname = 'trg_dashboard_revision'
           AND NOT tgisinternal
        SQL
    )->fetchColumn();

    echo json_encode([
        'database_bytes' => $databaseBytes,
        'tables' => $tables,
        'dashboard_session_projection' => $sessionPayload,
        'bounded_dashboard_session_count' => (int)$boundedSessionCount->fetchColumn(),
        'database_activity_since_reset' => $stats,
        'dashboard_revision' => $dashboardRevision,
        'dashboard_revision_trigger_count' => $revisionTriggerCount,
        'note' => 'Payload sizes are PostgreSQL row-size estimates, not Neon billing measurements.',
    ], JSON_PRETTY_PRINT | JSON_UNESCAPED_SLASHES), PHP_EOL;
} catch (Throwable $exception) {
    fwrite(STDERR, '[audit-failed] ' . get_class($exception) . ': ' . $exception->getMessage() . PHP_EOL);
    exit(1);
}
