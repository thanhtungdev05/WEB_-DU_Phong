<?php
declare(strict_types=1);

function verify_tracking_access(): ?array
{
    if (function_exists('dev_bypass_enabled') && dev_bypass_enabled()) {
        return require_user();
    }

    if (function_exists('current_user_id') && (current_user_id() || current_email())) {
        $user = require_user();
        if (database_boolean($user['is_terminated'] ?? false)) {
            fail(403, 'tracking/user-terminated', 'This user is no longer active.');
        }
        return $user;
    }

    $expectedKey = env_value('TRACKING_API_KEY');
    if ($expectedKey) {
        $providedKey = $_SERVER['HTTP_X_TRACKING_KEY'] ?? null;
        if (!$providedKey && isset($_SERVER['HTTP_AUTHORIZATION'])) {
            if (preg_match('/Bearer\s+(.*)$/i', $_SERVER['HTTP_AUTHORIZATION'], $matches)) {
                $providedKey = trim($matches[1]);
            }
        }
        if ($providedKey && hash_equals($expectedKey, $providedKey)) {
            return null;
        }
    }

    fail(401, 'auth/unauthenticated', 'Sign in before submitting a lab result.');
}

function tracking_timer_response(array $timer): array
{
    return [
        'session_id' => (string)($timer['session_id'] ?? ''),
        'submission_id' => (string)($timer['submission_id'] ?? ''),
        'technician_id' => (string)($timer['technician_id'] ?? ''),
        'name' => (string)($timer['name'] ?? ''),
        'email' => (string)($timer['email'] ?? ''),
        'started_at' => safe_datetime($timer['started_at'] ?? null),
        'finished_at' => safe_datetime($timer['finished_at'] ?? null),
        'duration_sec' => (int)($timer['duration_sec'] ?? 0),
        'mode' => (string)($timer['mode'] ?? 'Thực hành'),
        'device' => (string)($timer['device'] ?? ''),
        'device_id' => (string)($timer['device_id'] ?? ''),
        'device_model' => (string)($timer['device_model'] ?? ($timer['device'] ?? '')),
        'lab_id' => (string)($timer['lab_id'] ?? ''),
        'lab_name' => (string)($timer['lab_name'] ?? ($timer['lab_id'] ?? '')),
        'status' => (string)($timer['status'] ?? 'completed'),
        'completed_first_try' => $timer['completed_first_try'] ?? null,
        'practice_attempt_no' => isset($timer['practice_attempt_no']) ? (int)$timer['practice_attempt_no'] : null,
        'is_passed' => isset($timer['is_passed']) ? (bool)$timer['is_passed'] : null,
        'grading_details' => $timer['grading_details'] ?? null,
        'client_ip' => $timer['client_ip'] ?? null,
        'user_agent' => $timer['user_agent'] ?? null,
        'session_type' => (string)($timer['session_type'] ?? 'practice'),
        'saved' => (bool)($timer['saved'] ?? false),
        'duplicate' => (bool)($timer['duplicate'] ?? false),
        'normalized_saved' => (bool)($timer['normalized_saved'] ?? false),
        'normalization_issue' => $timer['normalization_issue'] ?? null,
    ];
}

/**
 * Mirror a live timer submission into every effective assignment for the same
 * KTV-lab pair. Progress is a person-lab outcome; overlapping active classes
 * must not leave one assignment passed and another stale.
 * A raw timer without an active assignment remains auditable, but is not
 * counted as assigned progress in the normalized dashboard report.
 */
function sync_tracking_attempt(PDO $pdo, int $timerId, array $timer, ?string $userId): bool
{
    if (!$userId || ($timer['mode'] ?? '') !== 'Thực hành') {
        return false;
    }
    $lookup = $pdo->prepare(
        <<<'SQL'
        SELECT assignment.assignment_id, assignment.status
          FROM class_enrollments enrollment
          JOIN training_classes training ON training.class_id = enrollment.class_id
          JOIN lab_assignments assignment ON assignment.enrollment_id = enrollment.enrollment_id
          LEFT JOIN class_lab_assignments class_assignment
            ON class_assignment.class_lab_assignment_id = assignment.class_lab_assignment_id
          JOIN curriculum_labs curriculum_lab
            ON curriculum_lab.curriculum_lab_id = assignment.curriculum_lab_id
         WHERE enrollment.user_id = CAST(:user_id AS uuid)
           AND curriculum_lab.lab_id = :lab_id
            AND enrollment.status = 'active'
            AND enrollment.is_mock = FALSE
            AND enrollment.valid_from <= CURRENT_DATE
            AND (enrollment.valid_to IS NULL OR enrollment.valid_to >= CURRENT_DATE)
            AND training.start_date <= CURRENT_DATE
            AND training.status IN ('planned', 'active')
            AND training.is_mock = FALSE
            AND assignment.status IN ('assigned', 'in_progress', 'passed')
            AND assignment.assigned_at <= NOW()
            AND (assignment.due_at IS NULL OR assignment.due_at >= NOW())
            AND (
                class_assignment.class_lab_assignment_id IS NULL
                OR (
                    class_assignment.status IN ('assigned', 'active')
                    AND class_assignment.assigned_at <= NOW()
                    AND (class_assignment.due_at IS NULL OR class_assignment.due_at >= NOW())
                )
            )
          ORDER BY training.start_date DESC, assignment.created_at DESC
          FOR UPDATE OF assignment
        SQL
    );
    $lookup->execute(['user_id' => $userId, 'lab_id' => $timer['lab_id']]);
    $assignments = $lookup->fetchAll();
    if (!$assignments) {
        return false;
    }
    $linkAssignment = $pdo->prepare(
        <<<'SQL'
        INSERT INTO timer_session_assignment_links (
            timer_session_id, assignment_id, link_source, linked_at
        ) VALUES (
            :timer_session_id, CAST(:assignment_id AS uuid), 'live_sync', NOW()
        )
        ON CONFLICT (timer_session_id, assignment_id) DO NOTHING
        SQL
    );
    foreach ($assignments as $assignment) {
        $linkAssignment->execute([
            'timer_session_id' => $timerId,
            'assignment_id' => $assignment['assignment_id'],
        ]);
    }
    $passed = ($timer['is_passed'] ?? null) === true;
    $attemptNo = isset($timer['practice_attempt_no']) ? (int)$timer['practice_attempt_no'] : null;
    if ($passed && $attemptNo !== null) {
        $update = $pdo->prepare(
            <<<'SQL'
            UPDATE lab_assignments
               SET status = 'passed',
                   first_pass_attempt_no = COALESCE(first_pass_attempt_no, :attempt_no),
                   first_try_evidence = 'derived_complete',
                   completed_at = COALESCE(completed_at, CAST(:completed_at AS timestamptz)),
                    passed_at = COALESCE(passed_at, completed_at, CAST(:completed_at AS timestamptz)),
                   updated_at = NOW()
             WHERE assignment_id = CAST(:assignment_id AS uuid)
            SQL
        );
        foreach ($assignments as $assignment) {
            $update->execute([
                'attempt_no' => $attemptNo,
                'completed_at' => $timer['finished_at'],
                'assignment_id' => $assignment['assignment_id'],
            ]);
        }
    } elseif (($timer['status'] ?? '') === 'failed') {
        $update = $pdo->prepare(
            "UPDATE lab_assignments
                SET status = 'in_progress', updated_at = NOW()
              WHERE assignment_id = CAST(:assignment_id AS uuid)
                AND (
                    status <> 'passed'
                    OR first_pass_attempt_no IS NULL
                    OR completed_at IS NULL
                    OR passed_at IS NULL
                    OR first_try_evidence IS DISTINCT FROM 'derived_complete'
                )
                AND status = 'assigned'"
        );
        foreach ($assignments as $assignment) {
            $update->execute(['assignment_id' => $assignment['assignment_id']]);
        }
    }
    return true;
}

function reserve_tracking_timer_start(array $trackingActor, array $input): array
{
    $submissionId = optional_text($input, 'submission_id', 64)
        ?? optional_text($input, 'submissionId', 64);
    if (!$submissionId || !preg_match('/^[A-Za-z0-9._:-]{8,64}$/D', $submissionId)) {
        fail(400, 'bad-request', 'submission_id is required and must contain 8-64 safe characters.');
    }

    $labId = optional_text($input, 'lab_id', 50)
        ?? optional_text($input, 'labId', 50)
        ?? optional_text($input, 'lab', 50);
    if (!$labId) {
        fail(400, 'bad-request', 'lab_id is required.');
    }

    $mode = optional_text($input, 'mode', 30) ?? 'Thực hành';
    if (!in_array($mode, ['Thực hành', 'Hướng dẫn'], true)) {
        fail(400, 'bad-request', "mode must be 'Thực hành' or 'Hướng dẫn'.");
    }
    $sessionType = $mode === 'Hướng dẫn' ? 'guide' : 'practice';
    $startedAt = normalized_timestamp($input['started_at'] ?? $input['startedAt'] ?? null, 'started_at')
        ?? (new DateTimeImmutable())->format(DateTimeInterface::ATOM);
    if (new DateTimeImmutable($startedAt) > (new DateTimeImmutable())->modify('+5 minutes')) {
        fail(400, 'bad-request', 'started_at cannot be in the future.');
    }

    $pdo = db();
    $catalogLookup = $pdo->prepare(
        'SELECT lab.lab_name, lab.device_id, device.device_name
           FROM lab_catalog lab
           JOIN device_catalog device ON device.device_id = lab.device_id
          WHERE lab.lab_id = :lab_id
            AND lab.is_active = TRUE
            AND device.is_active = TRUE'
    );
    $catalogLookup->execute(['lab_id' => $labId]);
    $catalog = $catalogLookup->fetch();
    if (!$catalog) {
        fail(422, 'tracking/unknown-lab', 'lab_id is not in the active catalog.');
    }

    $userId = (string)($trackingActor['user_id'] ?? '');
    if ($userId === '') {
        fail(401, 'auth/unauthenticated', 'Sign in before starting a lab session.');
    }
    $employeeId = (string)($trackingActor['employee_id'] ?? '');
    $email = (string)($trackingActor['email'] ?? '');
    $name = (string)($trackingActor['display_name'] ?? '');

    $actorExists = $userId !== '' && (bool)$pdo->query('SELECT 1 FROM users WHERE user_id = ' . $pdo->quote($userId))->fetchColumn();
    $validUserId = $actorExists ? $userId : null;

    try {
        $pdo->beginTransaction();
        $submissionLock = $pdo->prepare('SELECT pg_advisory_xact_lock(hashtextextended(:lock_key, 0))');
        $submissionLock->execute(['lock_key' => 'submission|' . $submissionId]);
        $existingStatement = $pdo->prepare(
            'SELECT id, user_id, technician_id, name, email, started_at, finished_at,
                    duration_sec, mode, device, device_id, lab_id, lab_name, status,
                    completed_first_try, practice_attempt_no, is_passed, score,
                    grading_details, session_type, submission_id
               FROM timer_sessions
              WHERE submission_id = :submission_id
              FOR UPDATE'
        );
        $existingStatement->execute(['submission_id' => $submissionId]);
        $existing = $existingStatement->fetch();
        if ($existing) {
            $existingUserId = (string)($existing['user_id'] ?? '');
            if (($validUserId !== null && $existingUserId !== $validUserId)
                || (string)$existing['lab_id'] !== $labId
                || (string)$existing['mode'] !== $mode) {
                $pdo->rollBack();
                fail(409, 'tracking/submission-conflict', 'submission_id was already used for a different session.');
            }
            $pdo->commit();
            $existing['session_id'] = (string)$existing['id'];
            $existing['saved'] = true;
            $existing['duplicate'] = true;
            $existing['normalized_saved'] = true;
            return tracking_timer_response($existing);
        }

        $practiceAttemptNo = null;
        if ($mode === 'Thực hành') {
            $lockKey = strtolower($userId . '|' . $labId);
            $lock = $pdo->prepare('SELECT pg_advisory_xact_lock(hashtextextended(:lock_key, 0))');
            $lock->execute(['lock_key' => $lockKey]);
            $nextAttempt = $pdo->prepare(
                <<<'SQL'
                SELECT COALESCE(MAX(practice_attempt_no), 0) + 1
                  FROM timer_sessions
                 WHERE lab_id = :lab_id
                   AND mode IN ('Thực hành', 'practice')
                   AND (
                       (:user_id IS NOT NULL AND user_id = CAST(:user_id AS uuid))
                       OR (NULLIF(:email, '') IS NOT NULL AND LOWER(email) = LOWER(:email))
                       OR (NULLIF(:technician_id, '') IS NOT NULL AND technician_id = :technician_id)
                   )
                SQL
            );
            $nextAttempt->execute([
                'lab_id' => $labId,
                'user_id' => $validUserId,
                'email' => $email,
                'technician_id' => $employeeId,
            ]);
            $practiceAttemptNo = (int)$nextAttempt->fetchColumn();
        }

        $insert = $pdo->prepare(
            <<<'SQL'
            INSERT INTO timer_sessions (
                user_id, technician_id, name, email, started_at, finished_at,
                duration_sec, mode, device, device_id, lab_id, lab_name,
                status, completed_first_try, practice_attempt_no, last_action,
                is_passed, score, grading_details, session_type, submission_id
            ) VALUES (
                CAST(:user_id AS uuid), :technician_id, :name, :email,
                CAST(:started_at AS timestamptz), NULL,
                0, :mode, :device, :device_id, :lab_id, :lab_name,
                'in_progress', NULL, :practice_attempt_no, 'Bắt đầu phiên',
                NULL, NULL, NULL, :session_type, :submission_id
            )
            RETURNING id
            SQL
        );
        $insert->execute([
            'user_id' => $validUserId,
            'technician_id' => $employeeId,
            'name' => $name,
            'email' => $email,
            'started_at' => $startedAt,
            'mode' => $mode,
            'device' => (string)$catalog['device_name'],
            'device_id' => (string)$catalog['device_id'],
            'lab_id' => $labId,
            'lab_name' => (string)$catalog['lab_name'],
            'practice_attempt_no' => $practiceAttemptNo,
            'session_type' => $sessionType,
            'submission_id' => $submissionId,
        ]);
        $timerId = (int)$insert->fetchColumn();
        $pdo->commit();

        return tracking_timer_response([
            'session_id' => (string)$timerId,
            'submission_id' => $submissionId,
            'technician_id' => $employeeId,
            'name' => $name,
            'email' => $email,
            'started_at' => $startedAt,
            'finished_at' => null,
            'duration_sec' => 0,
            'mode' => $mode,
            'device' => (string)$catalog['device_name'],
            'device_id' => (string)$catalog['device_id'],
            'lab_id' => $labId,
            'lab_name' => (string)$catalog['lab_name'],
            'status' => 'in_progress',
            'practice_attempt_no' => $practiceAttemptNo,
            'session_type' => $sessionType,
            'saved' => true,
            'duplicate' => false,
            'normalized_saved' => true,
        ]);
    } catch (Throwable $exception) {
        if ($pdo->inTransaction()) {
            $pdo->rollBack();
        }
        report_exception($exception, 'tracking-timer-start');
        fail(500, 'tracking/start-failed', 'Unable to start the timer session.');
    }
}

function handle_tracking(array $segments, string $method): void
{
    // Allow a lightweight unauthenticated health check before enforcing API key
    $sub = $segments[1] ?? '';

    if ($sub === 'health' && $method === 'GET') {
        respond([
            'status' => 'ok',
            'service' => 'tracking',
            'time' => (new DateTimeImmutable())->format(DateTimeInterface::ATOM),
        ]);
    }

    $trackingActor = verify_tracking_access();

    // POST /tracking/timer/start reserves an immutable practice attempt number.
    if ($sub === 'timer' && ($segments[2] ?? '') === 'start' && $method === 'POST') {
        if (!is_array($trackingActor)) {
            fail(401, 'auth/unauthenticated', 'Sign in before starting a lab session.');
        }
        respond(['item' => reserve_tracking_timer_start($trackingActor, json_body())]);
    }

    // POST /tracking/timer or /tracking/timers or /tracking
    if (($sub === 'timer' || $sub === 'timers' || $sub === '') && $method === 'POST') {
        $input = json_body();

        $technicianId = optional_text($input, 'technician_id', 50) ?? optional_text($input, 'technicianId', 50);
        $email = optional_text($input, 'email', 100) ?? optional_text($input, 'mail', 100);
        $name = optional_text($input, 'name', 100) ?? optional_text($input, 'full_name', 100) ?? optional_text($input, 'fullName', 100);
        $labId = optional_text($input, 'lab_id', 50) ?? optional_text($input, 'labId', 50) ?? optional_text($input, 'lab', 50);
        $mode = optional_text($input, 'mode', 30) ?? 'Thực hành';
        $device = optional_text($input, 'device', 100) ?? optional_text($input, 'device_model', 100) ?? optional_text($input, 'deviceModel', 100);
        $deviceId = optional_text($input, 'device_id', 50) ?? optional_text($input, 'deviceId', 50);
        $sessionType = optional_text($input, 'session_type', 30)
            ?? optional_text($input, 'sessionType', 30)
            ?? ($mode === 'Hướng dẫn' ? 'guide' : 'practice');
        $statusWasProvided = array_key_exists('status', $input);
        $status = optional_text($input, 'status', 30) ?? 'completed';

        if (!in_array($mode, ['Thực hành', 'Hướng dẫn'], true)) {
            fail(400, 'bad-request', "mode must be 'Thực hành' or 'Hướng dẫn'.");
        }
        if (!in_array($status, ['completed', 'failed', 'abandoned'], true)) {
            fail(400, 'bad-request', "status must be 'completed', 'failed' or 'abandoned'.");
        }

        $completedFirstTry = null;
        $firstTryKey = array_key_exists('completed_first_try', $input)
            ? 'completed_first_try'
            : (array_key_exists('completedFirstTry', $input) ? 'completedFirstTry' : null);
        if ($firstTryKey !== null && $input[$firstTryKey] !== null && $input[$firstTryKey] !== '') {
            if (!is_bool($input[$firstTryKey])) {
                fail(400, 'bad-request', 'completed_first_try must be a JSON boolean.');
            }
            $completedFirstTry = $input[$firstTryKey];
        }
        if ($status !== 'completed' && $completedFirstTry !== null) {
            fail(400, 'bad-request', 'completed_first_try is only valid for completed sessions.');
        }
        if ($mode === 'Hướng dẫn') {
            $completedFirstTry = null;
        }

        $durationSec = $input['duration_sec'] ?? $input['durationSec'] ?? $input['duration'] ?? null;
        $durationWasProvided = $durationSec !== null;
        if ($durationSec !== null) {
            $durationSec = filter_var($durationSec, FILTER_VALIDATE_INT);
            if ($durationSec === false || $durationSec < 0) {
                fail(400, 'bad-request', 'duration_sec must be a non-negative integer.');
            }
            $maximumDuration = env_int('TRACKING_MAX_DURATION_SECONDS', 86400, 60, 604800);
            if ($durationSec > $maximumDuration) {
                fail(400, 'bad-request', 'duration_sec exceeds the allowed session duration.');
            }
        }

        // Kết quả Đạt/Chưa đạt. Score chỉ được giữ để tương thích client cũ.
        $isPassed = null;
        if (array_key_exists('is_passed', $input) && $input['is_passed'] !== null) {
            if (!is_bool($input['is_passed'])) {
                fail(400, 'bad-request', 'is_passed must be a JSON boolean.');
            }
            $isPassed = $input['is_passed'];
        } elseif (array_key_exists('passed', $input) && $input['passed'] !== null) {
            if (!is_bool($input['passed'])) {
                fail(400, 'bad-request', 'passed must be a JSON boolean.');
            }
            $isPassed = $input['passed'];
        }
        if (!$statusWasProvided && $isPassed === false) {
            $status = 'failed';
        }
        if (($status === 'completed' && $isPassed === false) || ($status === 'failed' && $isPassed === true)) {
            fail(400, 'bad-request', 'status and is_passed describe conflicting outcomes.');
        }
        if ($status !== 'completed' && $completedFirstTry !== null) {
            fail(400, 'bad-request', 'completed_first_try is only valid for completed sessions.');
        }

        $score = null;
        if (isset($input['score'])) {
            $scoreVal = filter_var($input['score'], FILTER_VALIDATE_FLOAT);
            if ($scoreVal === false || $scoreVal < 0 || $scoreVal > 100) {
                fail(400, 'bad-request', 'score must be a number between 0 and 100.');
            }
            $score = (float)$scoreVal;
        }

        $gradingDetails = $input['grading_details'] ?? $input['details'] ?? null;
        if ($gradingDetails !== null && !is_array($gradingDetails)) {
            fail(400, 'bad-request', 'grading_details must be a JSON array or object.');
        }
        $gradingDetailsJson = is_array($gradingDetails) ? json_encode($gradingDetails, JSON_UNESCAPED_UNICODE | JSON_UNESCAPED_SLASHES) : null;

        $finishedAt = normalized_timestamp(
            $input['finished_at'] ?? $input['finishedAt'] ?? $input['end_time'] ?? null,
            'finished_at'
        ) ?? (new DateTimeImmutable())->format(DateTimeInterface::ATOM);
        $startedAt = normalized_timestamp($input['started_at'] ?? $input['startedAt'] ?? null, 'started_at');
        $finishedDate = new DateTimeImmutable($finishedAt);
        $startedDate = $startedAt ? new DateTimeImmutable($startedAt) : null;
        if ($finishedDate > (new DateTimeImmutable())->modify('+5 minutes')) {
            fail(400, 'bad-request', 'finished_at cannot be in the future.');
        }
        if ($startedDate && $startedDate > $finishedDate) {
            fail(400, 'bad-request', 'started_at must be on or before finished_at.');
        }
        if ($startedDate) {
            $timestampDuration = $finishedDate->getTimestamp() - $startedDate->getTimestamp();
            $maximumDuration = env_int('TRACKING_MAX_DURATION_SECONDS', 86400, 60, 604800);
            if ($timestampDuration > $maximumDuration) {
                fail(400, 'bad-request', 'The session duration exceeds the allowed maximum.');
            }
            if ($durationWasProvided && abs($timestampDuration - (int)$durationSec) > 5) {
                fail(400, 'bad-request', 'duration_sec does not match started_at and finished_at.');
            }
        }

        // Idempotency key — client-generated UUID per practice session
        $submissionId = optional_text($input, 'submission_id', 64)
            ?? optional_text($input, 'submissionId', 64)
            ?? null;
        if (!$submissionId || !preg_match('/^[A-Za-z0-9._:-]{8,64}$/D', $submissionId)) {
            fail(400, 'bad-request', 'submission_id is required and must contain 8-64 safe characters.');
        }
        if (!$labId) {
            fail(400, 'bad-request', 'lab_id is required.');
        }
        if (!in_array($sessionType, ['practice', 'guide'], true)) {
            fail(400, 'bad-request', "session_type must be 'practice' or 'guide'.");
        }
        if (($mode === 'Hướng dẫn') !== ($sessionType === 'guide')) {
            fail(400, 'bad-request', 'mode and session_type must describe the same mode.');
        }

        $clientIp = function_exists('request_ip') ? request_ip() : ($_SERVER['REMOTE_ADDR'] ?? null);
        $userAgent = function_exists('request_user_agent') ? request_user_agent() : ($_SERVER['HTTP_USER_AGENT'] ?? null);

        $pdo = db();

        $catalogLookup = $pdo->prepare(
            'SELECT lab.lab_name, lab.device_id, device.device_name, device.model
               FROM lab_catalog lab
               JOIN device_catalog device ON device.device_id = lab.device_id
              WHERE lab.lab_id = :lab_id
                AND lab.is_active = TRUE
                AND device.is_active = TRUE'
        );
        $catalogLookup->execute(['lab_id' => $labId]);
        $catalog = $catalogLookup->fetch();
        if (!$catalog) {
            fail(422, 'tracking/unknown-lab', 'lab_id is not in the active catalog.');
        }
        $deviceId = (string)$catalog['device_id'];
        $device = (string)$catalog['device_name'];

        $timer = [
            'session_id' => 'TMR_' . date('YmdHis') . '_' . bin2hex(random_bytes(3)),
            'submission_id' => $submissionId,
            'technician_id' => $technicianId ?? '',
            'name' => $name ?? '',
            'email' => $email ?? '',
            'finished_at' => $finishedAt,
            'duration_sec' => $durationSec ?? 0,
            'mode' => $mode,
            'device' => $device ?? '',
            'device_id' => $deviceId ?? '',
            'device_model' => $device ?? '',
            'lab_id' => $labId ?? '',
            'lab_name' => (string)$catalog['lab_name'],
            'status' => $status,
            'completed_first_try' => $completedFirstTry,
            'is_passed' => $isPassed,
            'score' => $score,
            'grading_details' => $gradingDetails,
            'client_ip' => $clientIp,
            'user_agent' => $userAgent,
            'session_type' => $sessionType,
            'saved' => false,
            'normalized_saved' => false,
            'normalization_issue' => null,
        ];

        // If duration was omitted, derive it from the timestamps. The normalized
        // attempt model requires started_at, so use a deterministic fallback.
        if (!$durationWasProvided && $startedAt) {
            $timer['duration_sec'] = max(0, (new DateTimeImmutable($finishedAt))->getTimestamp() - (new DateTimeImmutable($startedAt))->getTimestamp());
        }
        if (!$startedAt) {
            $startedAt = (new DateTimeImmutable($finishedAt))
                ->modify('-' . $timer['duration_sec'] . ' seconds')
                ->format(DateTimeInterface::ATOM);
        }

        $resolvedUserId = is_array($trackingActor) ? (string)($trackingActor['user_id'] ?? '') : null;
        if ($timer['technician_id'] !== '' || $timer['email'] !== '') {
            $resolve = $pdo->prepare(
                <<<'SQL'
                WITH input AS (
                    SELECT NULLIF(:technician_id, '')::text AS technician_id,
                           NULLIF(:email, '')::text AS email
                )
                SELECT roster.user_id,
                       roster.employee_id,
                       roster.email,
                       roster.display_name,
                       roster.is_terminated,
                       input.technician_id IS NOT NULL
                           AND roster.employee_id = input.technician_id AS employee_match,
                       input.email IS NOT NULL
                           AND LOWER(roster.email) = LOWER(input.email) AS email_match
                  FROM users roster
                  CROSS JOIN input
                 WHERE roster.employee_id = input.technician_id
                    OR LOWER(roster.email) = LOWER(input.email)
                SQL
            );
            $resolve->execute([
                'technician_id' => $timer['technician_id'],
                'email' => $timer['email'],
            ]);
            $resolvedRows = $resolve->fetchAll();
            $employeeUserIds = [];
            $emailUserIds = [];
            $usersById = [];
            foreach ($resolvedRows as $resolvedRow) {
                $candidateId = (string)$resolvedRow['user_id'];
                $usersById[$candidateId] = $resolvedRow;
                if (database_boolean($resolvedRow['employee_match'] ?? false)) {
                    $employeeUserIds[$candidateId] = true;
                }
                if (database_boolean($resolvedRow['email_match'] ?? false)) {
                    $emailUserIds[$candidateId] = true;
                }
            }
            if (count($employeeUserIds) > 1 || count($emailUserIds) > 1) {
                fail(409, 'tracking/identity-ambiguous', 'The supplied tracking identity matches multiple users.');
            }
            $employeeUserId = array_key_first($employeeUserIds);
            $emailUserId = array_key_first($emailUserIds);
            if ($employeeUserId && $emailUserId && $employeeUserId !== $emailUserId) {
                fail(409, 'tracking/identity-conflict', 'technician_id and email belong to different users.');
            }
            $matchedUserId = $employeeUserId ?: $emailUserId;
            if (is_array($trackingActor) && $matchedUserId && $matchedUserId !== (string)$trackingActor['user_id']) {
                fail(403, 'tracking/identity-conflict', 'The submitted identity does not match the signed-in user.');
            }
            $resolvedUserId = is_array($trackingActor) ? (string)$trackingActor['user_id'] : $matchedUserId;
            if ($resolvedUserId && isset($usersById[$resolvedUserId])) {
                $canonicalUser = $usersById[$resolvedUserId];
                if (database_boolean($canonicalUser['is_terminated'] ?? false)) {
                    fail(403, 'tracking/user-terminated', 'This user is no longer active.');
                }
                $timer['technician_id'] = (string)($canonicalUser['employee_id'] ?: $timer['technician_id']);
                $timer['email'] = (string)($canonicalUser['email'] ?: $timer['email']);
                $timer['name'] = (string)($canonicalUser['display_name'] ?: $timer['name']);
            }
        }
        if (is_array($trackingActor)) {
            $actorId = (string)($trackingActor['user_id'] ?? '');
            $actorExists = $actorId !== '' && (bool)$pdo->query('SELECT 1 FROM users WHERE user_id = ' . $pdo->quote($actorId))->fetchColumn();
            $resolvedUserId = $actorExists ? $actorId : null;
            $timer['technician_id'] = (string)(($trackingActor['employee_id'] ?? null) ?: $timer['technician_id']);
            $timer['email'] = (string)(($trackingActor['email'] ?? null) ?: $timer['email']);
            $timer['name'] = (string)(($trackingActor['display_name'] ?? null) ?: $timer['name']);
        } elseif ($resolvedUserId) {
            $userExists = (bool)$pdo->query('SELECT 1 FROM users WHERE user_id = ' . $pdo->quote($resolvedUserId))->fetchColumn();
            if (!$userExists) {
                $resolvedUserId = null;
            }
        }

        $timer['started_at'] = $startedAt;
        $timer['last_action'] = $timer['status'] === 'completed'
            ? 'Save & Apply cấu hình cuối'
            : ($timer['status'] === 'failed' ? 'Nộp cấu hình nhưng chưa đạt yêu cầu' : 'Rời phiên trước khi hoàn thành');

        try {
            $pdo->beginTransaction();
            $submissionLock = $pdo->prepare('SELECT pg_advisory_xact_lock(hashtextextended(:lock_key, 0))');
            $submissionLock->execute(['lock_key' => 'submission|' . $submissionId]);

            $existingStatement = $pdo->prepare(
                'SELECT id, user_id, lab_id, mode, status, is_passed, session_type,
                        practice_attempt_no, completed_first_try,
                        started_at IS NOT DISTINCT FROM CAST(:started_at AS timestamptz) AS same_started_at,
                        finished_at IS NOT DISTINCT FROM CAST(:finished_at AS timestamptz) AS same_finished_at,
                        duration_sec IS NOT DISTINCT FROM CAST(:duration_sec AS integer) AS same_duration,
                        score IS NOT DISTINCT FROM CAST(:score AS numeric) AS same_score,
                        grading_details IS NOT DISTINCT FROM CAST(:grading_details AS jsonb) AS same_grading_details
                   FROM timer_sessions
                  WHERE submission_id = :submission_id
                  FOR UPDATE'
            );
            $existingStatement->execute([
                'submission_id' => $submissionId,
                'started_at' => $startedAt,
                'finished_at' => $finishedAt,
                'duration_sec' => $timer['duration_sec'],
                'score' => $timer['score'],
                'grading_details' => $gradingDetailsJson,
            ]);
            $existingTimer = $existingStatement->fetch();

            if ($existingTimer) {
                $sameIdentity = (string)$existingTimer['user_id'] === (string)$resolvedUserId
                    && (string)$existingTimer['lab_id'] === $timer['lab_id']
                    && (string)$existingTimer['mode'] === $timer['mode']
                    && (string)$existingTimer['session_type'] === $timer['session_type']
                    && database_boolean($existingTimer['same_started_at'] ?? false);
                if (!$sameIdentity) {
                    $pdo->rollBack();
                    fail(409, 'tracking/submission-conflict', 'submission_id was already used for a different session.');
                }

                $timer['practice_attempt_no'] = $existingTimer['practice_attempt_no'] !== null
                    ? (int)$existingTimer['practice_attempt_no']
                    : null;
                $timer['completed_first_try'] = $timer['is_passed'] === true
                    ? $timer['practice_attempt_no'] === 1
                    : null;
                if ((string)$existingTimer['status'] === 'in_progress') {
                    $update = $pdo->prepare(
                        <<<'SQL'
                        UPDATE timer_sessions
                           SET technician_id = :technician_id,
                               name = :name,
                               email = :email,
                               finished_at = CAST(:finished_at AS timestamptz),
                               duration_sec = :duration_sec,
                               device = :device,
                               device_id = :device_id,
                               lab_name = :lab_name,
                               status = :status,
                               completed_first_try = :completed_first_try,
                               last_action = :last_action,
                               is_passed = :is_passed,
                               score = :score,
                               grading_details = CAST(:grading_details AS jsonb),
                               client_ip = :client_ip,
                               user_agent = :user_agent
                         WHERE id = :id
                        SQL
                    );
                    $update->execute([
                        'technician_id' => $timer['technician_id'],
                        'name' => $timer['name'],
                        'email' => $timer['email'],
                        'finished_at' => $finishedAt,
                        'duration_sec' => $timer['duration_sec'],
                        'device' => $timer['device'],
                        'device_id' => $deviceId,
                        'lab_name' => $timer['lab_name'],
                        'status' => $timer['status'],
                        'completed_first_try' => $timer['completed_first_try'] === null
                            ? null
                            : ($timer['completed_first_try'] ? 1 : 0),
                        'last_action' => $timer['last_action'],
                        'is_passed' => $timer['is_passed'] !== null ? ($timer['is_passed'] ? 1 : 0) : null,
                        'score' => $timer['score'],
                        'grading_details' => $gradingDetailsJson,
                        'client_ip' => $clientIp,
                        'user_agent' => $userAgent,
                        'id' => (int)$existingTimer['id'],
                    ]);
                    $timer['session_id'] = (string)$existingTimer['id'];
                    $savedRow = ['id' => $existingTimer['id']];
                } else {
                    $existingPassed = $existingTimer['is_passed'] !== null
                        ? database_boolean($existingTimer['is_passed'])
                        : null;
                    $existingFirstTry = $existingTimer['completed_first_try'] !== null
                        ? database_boolean($existingTimer['completed_first_try'])
                        : null;
                    $sameSubmission = (string)$existingTimer['status'] === $timer['status']
                        && $existingPassed === $timer['is_passed']
                        && $existingFirstTry === $timer['completed_first_try']
                        && database_boolean($existingTimer['same_finished_at'] ?? false)
                        && database_boolean($existingTimer['same_duration'] ?? false)
                        && database_boolean($existingTimer['same_score'] ?? false)
                        && database_boolean($existingTimer['same_grading_details'] ?? false);
                    if (!$sameSubmission) {
                        $pdo->rollBack();
                        fail(409, 'tracking/submission-conflict', 'submission_id was already used for a different result.');
                    }
                    $timer['session_id'] = (string)$existingTimer['id'];
                    $savedRow = null;
                }
            } else {
                $practiceAttemptNo = null;
                if ($mode === 'Thực hành') {
                    $identityKey = strtolower((string)($resolvedUserId ?: $timer['email'] ?: $timer['technician_id']) . '|' . $timer['lab_id']);
                    $attemptLock = $pdo->prepare('SELECT pg_advisory_xact_lock(hashtextextended(:lock_key, 0))');
                    $attemptLock->execute(['lock_key' => 'attempt|' . $identityKey]);
                    $nextAttempt = $pdo->prepare(
                        <<<'SQL'
                        SELECT COALESCE(MAX(practice_attempt_no), 0) + 1
                          FROM timer_sessions
                         WHERE lab_id = :lab_id
                           AND mode IN ('Thực hành', 'practice')
                           AND (
                               (:user_id IS NOT NULL AND user_id = CAST(:user_id AS uuid))
                               OR (NULLIF(:email, '') IS NOT NULL AND LOWER(email) = LOWER(:email))
                               OR (NULLIF(:technician_id, '') IS NOT NULL AND technician_id = :technician_id)
                           )
                        SQL
                    );
                    $nextAttempt->execute([
                        'lab_id' => $timer['lab_id'],
                        'user_id' => $resolvedUserId ?: null,
                        'email' => $timer['email'],
                        'technician_id' => $timer['technician_id'],
                    ]);
                    $practiceAttemptNo = (int)$nextAttempt->fetchColumn();
                }
                $timer['practice_attempt_no'] = $practiceAttemptNo;
                $timer['completed_first_try'] = $timer['is_passed'] === true
                    ? $practiceAttemptNo === 1
                    : null;

                $insert = $pdo->prepare(
                    <<<'SQL'
                    INSERT INTO timer_sessions (
                        user_id, technician_id, name, email, started_at, finished_at,
                        duration_sec, mode, device, device_id, lab_id, lab_name,
                        status, completed_first_try, practice_attempt_no, last_action,
                        is_passed, score, grading_details, client_ip, user_agent,
                        session_type, submission_id
                    ) VALUES (
                        :user_id, :technician_id, :name, :email, :started_at, :finished_at,
                        :duration_sec, :mode, :device, :device_id, :lab_id, :lab_name,
                        :status, :completed_first_try, :practice_attempt_no, :last_action,
                        :is_passed, :score, :grading_details, :client_ip, :user_agent,
                        :session_type, :submission_id
                    )
                    RETURNING id
                    SQL
                );
                $insert->execute([
                    'user_id' => $resolvedUserId,
                    'technician_id' => $timer['technician_id'],
                    'name' => $timer['name'],
                    'email' => $timer['email'],
                    'started_at' => $startedAt,
                    'finished_at' => $finishedAt,
                    'duration_sec' => $timer['duration_sec'],
                    'mode' => $mode,
                    'device' => $timer['device'],
                    'device_id' => $deviceId,
                    'lab_id' => $timer['lab_id'],
                    'lab_name' => $timer['lab_name'],
                    'status' => $timer['status'],
                    'completed_first_try' => $timer['completed_first_try'] === null
                        ? null
                        : ($timer['completed_first_try'] ? 1 : 0),
                    'practice_attempt_no' => $practiceAttemptNo,
                    'last_action' => $timer['last_action'],
                    'is_passed' => $timer['is_passed'] !== null ? ($timer['is_passed'] ? 1 : 0) : null,
                    'score' => $timer['score'],
                    'grading_details' => $gradingDetailsJson,
                    'client_ip' => $clientIp,
                    'user_agent' => $userAgent,
                    'session_type' => $sessionType,
                    'submission_id' => $submissionId,
                ]);
                $savedRow = $insert->fetch();
                $timer['session_id'] = (string)$savedRow['id'];
            }
            $timer['normalized_saved'] = sync_tracking_attempt(
                $pdo,
                (int)$timer['session_id'],
                $timer,
                $resolvedUserId ?: null
            );
            $timer['saved'] = true;
            $timer['duplicate'] = !$savedRow;
            $timer['normalization_issue'] = $timer['normalized_saved'] ? null : 'No effective assignment matched the saved timer.';
            $pdo->commit();
        } catch (Throwable $exception) {
            if ($pdo->inTransaction()) {
                $pdo->rollBack();
            }
            report_exception($exception, 'tracking-timer-save');
            fail(500, 'tracking/save-failed', 'Unable to save the timer session.');
        }

        respond(['item' => tracking_timer_response($timer)]);
    }

    fail(404, 'not-found', 'Tracking endpoint not found.');
}
