<?php
declare(strict_types=1);

if (PHP_SAPI !== 'cli') {
    http_response_code(404);
    exit;
}

define('FIREBASE_V1_LIBRARY_ONLY', true);
require_once __DIR__ . '/import_firebase_v1.php';

$commit = in_array('--commit', $argv, true);
$batch = 'firebase-v1-20260916';
foreach (array_slice($argv, 1) as $argument) {
    if ($argument === '--commit' || $argument === '--dry-run') continue;
    if (str_starts_with($argument, '--batch=')) {
        $batch = substr($argument, strlen('--batch='));
        continue;
    }
    firebase_v1_fail("Unknown option: $argument", 2);
}
if (!preg_match('/^[A-Za-z0-9._:-]{1,100}$/D', $batch)) {
    firebase_v1_fail('--batch must contain 1-100 safe characters.', 2);
}

$pdo = null;
try {
    $pdo = create_database_connection();
    $batchStmt = $pdo->prepare("SELECT status FROM firebase_legacy_import_batches WHERE batch_key = :batch");
    $batchStmt->execute(['batch' => $batch]);
    if ($batchStmt->fetchColumn() !== 'committed') {
        throw new RuntimeException('The requested Firebase import batch is not committed.');
    }

    $pdo->beginTransaction();
    $lock = $pdo->prepare("SELECT pg_advisory_xact_lock(hashtext(:lock_name))");
    $lock->execute(['lock_name' => 'ftc_firebase_v1_import']);
    $pdo->exec('LOCK TABLE timer_sessions IN SHARE ROW EXCLUSIVE MODE');

    $catalog = new FirebaseV1Catalog($pdo);
    $devices = $catalog->devices();
    $labs = $catalog->labs();
    $sourceStmt = $pdo->prepare(<<<'SQL'
        SELECT event.event_id, event.source_payload, timer.id AS timer_id,
               timer.user_id::text AS user_id, LOWER(timer.email) AS email,
               timer.technician_id, timer.lab_id AS old_lab_id,
               timer.session_type AS old_mode,
               COALESCE(timer.started_at, timer.finished_at, timer.created_at) AS occurred_at
          FROM firebase_legacy_import_events event
          JOIN timer_sessions timer ON timer.id = event.timer_session_id
         WHERE event.batch_key = :batch
           AND event.source_collection = 'activity_logs'
           AND event.resolution_status = 'imported'
         ORDER BY COALESCE(timer.started_at, timer.finished_at, timer.created_at), event.source_key
        SQL);
    $sourceStmt->execute(['batch' => $batch]);

    $attemptMax = [];
    $baseStmt = $pdo->prepare(<<<'SQL'
        SELECT user_id::text AS user_id, LOWER(email) AS email, technician_id, lab_id, practice_attempt_no
          FROM timer_sessions
         WHERE seed_batch IS DISTINCT FROM :batch
           AND mode IN ('Thực hành', 'practice')
           AND practice_attempt_no IS NOT NULL
        SQL);
    $baseStmt->execute(['batch' => $batch]);
    foreach ($baseStmt->fetchAll() as $attemptRow) {
        $labId = (string)$attemptRow['lab_id'];
        $attemptNo = (int)$attemptRow['practice_attempt_no'];
        foreach ([
            'user:' . (string)($attemptRow['user_id'] ?? ''),
            'email:' . (string)($attemptRow['email'] ?? ''),
            'employee:' . (string)($attemptRow['technician_id'] ?? ''),
        ] as $identityKey) {
            if (str_ends_with($identityKey, ':')) continue;
            $key = $identityKey . '|' . $labId;
            $attemptMax[$key] = max($attemptMax[$key] ?? 0, $attemptNo);
        }
    }

    $updates = [];
    $modeChanges = 0;
    $catalogChanges = 0;
    $practice = 0;
    $guide = 0;
    foreach ($sourceStmt->fetchAll() as $row) {
        $payload = json_decode((string)$row['source_payload'], true, 512, JSON_THROW_ON_ERROR);
        $description = firebase_v1_text($payload['description'] ?? $payload['desc'] ?? '', 1000);
        $mode = firebase_v1_mode($description);
        $deviceName = firebase_v1_text($payload['device'] ?? $payload['deviceName'] ?? '', 100);
        $title = firebase_v1_text($payload['actionTitle'] ?? $payload['title'] ?? '', 150);
        [$deviceId, $labId, $historical] = $catalog->resolve($deviceName, $title);
        if ($mode !== (string)$row['old_mode']) $modeChanges++;
        if ($labId !== (string)$row['old_lab_id']) $catalogChanges++;

        $attemptNo = null;
        if ($mode === 'practice') {
            $practice++;
            $identityKeys = array_values(array_filter([
                $row['user_id'] ? 'user:' . $row['user_id'] : null,
                $row['email'] ? 'email:' . strtolower((string)$row['email']) : null,
                $row['technician_id'] ? 'employee:' . $row['technician_id'] : null,
            ]));
            $base = 0;
            foreach ($identityKeys as $identityKey) {
                $base = max($base, $attemptMax[$identityKey . '|' . $labId] ?? 0);
            }
            $attemptNo = $base + 1;
            foreach ($identityKeys as $identityKey) {
                $attemptMax[$identityKey . '|' . $labId] = $attemptNo;
            }
        } else {
            $guide++;
        }
        $updates[] = [
            'timer_id' => (int)$row['timer_id'],
            'event_id' => (int)$row['event_id'],
            'device_id' => $deviceId,
            'device_name' => $devices[$deviceId]['device_name'],
            'lab_id' => $labId,
            'lab_name' => $labs[$labId]['lab_name'],
            'mode' => $mode === 'guide' ? 'Hướng dẫn' : 'Thực hành',
            'session_type' => $mode,
            'is_passed' => $mode === 'practice' ? true : null,
            'practice_attempt_no' => $attemptNo,
            'reason' => $historical ? 'Imported with historical inactive catalog mapping.' : null,
        ];
    }

    $updateTimer = $pdo->prepare(<<<'SQL'
        UPDATE timer_sessions timer
           SET device_id = row.device_id,
               device = row.device_name,
               lab_id = row.lab_id,
               lab_name = row.lab_name,
               mode = row.mode,
               session_type = row.session_type,
               is_passed = row.is_passed,
               practice_attempt_no = row.practice_attempt_no,
               completed_first_try = NULL,
               attempt_sequence_complete = FALSE
          FROM jsonb_to_recordset(CAST(:rows AS jsonb)) AS row(
              timer_id bigint, event_id bigint, device_id text, device_name text,
              lab_id text, lab_name text, mode text, session_type text,
              is_passed boolean, practice_attempt_no integer, reason text
          )
         WHERE timer.id = row.timer_id
        SQL);
    $updateEvent = $pdo->prepare(<<<'SQL'
        UPDATE firebase_legacy_import_events event
           SET resolution_reason = row.reason
          FROM jsonb_to_recordset(CAST(:rows AS jsonb)) AS row(event_id bigint, reason text)
         WHERE event.event_id = row.event_id
        SQL);
    $clearAttempts = $pdo->prepare('UPDATE timer_sessions SET practice_attempt_no = NULL WHERE seed_batch = :batch');
    $clearAttempts->execute(['batch' => $batch]);
    foreach (array_chunk($updates, 500) as $chunk) {
        $encoded = json_encode($chunk, JSON_UNESCAPED_SLASHES | JSON_UNESCAPED_UNICODE | JSON_THROW_ON_ERROR);
        $updateTimer->execute(['rows' => $encoded]);
        $eventRows = array_map(static fn(array $row): array => [
            'event_id' => $row['event_id'],
            'reason' => $row['reason'],
        ], $chunk);
        $updateEvent->execute(['rows' => json_encode($eventRows, JSON_UNESCAPED_SLASHES | JSON_UNESCAPED_UNICODE | JSON_THROW_ON_ERROR)]);
    }

    $summary = [
        'rows' => count($updates),
        'mode_changes' => $modeChanges,
        'catalog_changes' => $catalogChanges,
        'practice' => $practice,
        'guide' => $guide,
    ];
    $auditStmt = $pdo->prepare(<<<'SQL'
        UPDATE firebase_legacy_import_batches
           SET summary = summary || jsonb_build_object('reconciliation', CAST(:summary AS jsonb))
         WHERE batch_key = :batch
        SQL);
    $auditStmt->execute([
        'summary' => json_encode($summary, JSON_UNESCAPED_SLASHES | JSON_UNESCAPED_UNICODE | JSON_THROW_ON_ERROR),
        'batch' => $batch,
    ]);

    if ($commit) {
        $pdo->commit();
        $mode = 'committed';
    } else {
        $pdo->rollBack();
        $mode = 'dry-run-rolled-back';
    }
    echo json_encode(['mode' => $mode, 'batch' => $batch, 'summary' => $summary], JSON_PRETTY_PRINT | JSON_UNESCAPED_SLASHES), PHP_EOL;
} catch (Throwable $exception) {
    if ($pdo instanceof PDO && $pdo->inTransaction()) $pdo->rollBack();
    firebase_v1_fail($exception->getMessage());
}
