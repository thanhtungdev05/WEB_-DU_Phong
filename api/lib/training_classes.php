<?php
declare(strict_types=1);

use PhpOffice\PhpSpreadsheet\Cell\Coordinate;
use PhpOffice\PhpSpreadsheet\IOFactory;
use PhpOffice\PhpSpreadsheet\Shared\Date as SpreadsheetDate;
use PhpOffice\PhpSpreadsheet\Spreadsheet;
use PhpOffice\PhpSpreadsheet\Writer\Xlsx;

const TRAINING_CLASS_IMPORT_MAX_BYTES = 8_388_608;
const TRAINING_CLASS_IMPORT_MAX_ROWS = 5_000;

function training_class_date(mixed $value, string $label, bool $required = true): ?string
{
    if ($value === null || trim((string)$value) === '') {
        if ($required) {
            fail(400, 'bad-request', "$label is required.");
        }
        return null;
    }
    $text = trim((string)$value);
    $date = DateTimeImmutable::createFromFormat('!Y-m-d', $text);
    if (!$date || $date->format('Y-m-d') !== $text) {
        fail(400, 'bad-request', "$label must use YYYY-MM-DD format.");
    }
    return $text;
}

function training_class_array(array $input, string $key, int $maximum = 5000): array
{
    $values = $input[$key] ?? [];
    if (!is_array($values) || count($values) > $maximum) {
        fail(400, 'bad-request', "$key must be an array with at most $maximum items.");
    }
    $result = [];
    foreach ($values as $value) {
        if (!is_scalar($value)) {
            fail(400, 'bad-request', "$key contains an invalid value.");
        }
        $text = trim((string)$value);
        if ($text !== '') {
            $result[$text] = true;
        }
    }
    return array_keys($result);
}

function training_class_status_for_dates(string $startDate): string
{
    $timezone = new DateTimeZone(normalize_app_timezone(env_value('APP_TIMEZONE')));
    $today = (new DateTimeImmutable('today', $timezone))->format('Y-m-d');
    if ($startDate > $today) {
        return 'planned';
    }
    return 'active';
}

function training_class_default_curriculum_id(PDO $pdo): string
{
    $id = $pdo->query(
        "SELECT curriculum_id
          FROM curricula
          WHERE status = 'active'
          ORDER BY CASE WHEN curriculum_code = 'FTC-PORTAL-LABS' THEN 0 ELSE 1 END,
                   is_default DESC,
                   CASE WHEN curriculum_code = 'LEGACY-PORTAL-LABS' THEN 0 ELSE 1 END,
                   effective_from DESC NULLS LAST,
                   created_at DESC
          LIMIT 1"
    )->fetchColumn();
    if (!is_string($id) || $id === '') {
        throw new RuntimeException('No active curriculum is configured.');
    }
    return $id;
}

function training_class_next_code(PDO $pdo): string
{
    $number = (int)$pdo->query("SELECT nextval('training_class_code_seq')")->fetchColumn();
    return sprintf('FTC-%06d', $number);
}

function training_class_assert_dates(string $startDate): void
{
}

function training_class_actor_user_id(PDO $pdo, array $actor): ?string
{
    $userId = trim((string)($actor['user_id'] ?? $actor['id'] ?? ''));
    if (!preg_match('/^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/iD', $userId)) {
        return null;
    }
    $lookup = $pdo->prepare('SELECT user_id FROM users WHERE user_id = CAST(:user_id AS uuid)');
    $lookup->execute(['user_id' => $userId]);
    return $lookup->fetchColumn() !== false ? $userId : null;
}

function training_class_fetch_users(PDO $pdo, array $userIds): array
{
    if (!$userIds) {
        return [];
    }
    $placeholders = [];
    $params = [];
    foreach (array_values($userIds) as $index => $userId) {
        if (!preg_match('/^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/iD', $userId)) {
            fail(400, 'bad-request', 'memberUserIds contains an invalid UUID.');
        }
        $key = 'user_' . $index;
        $placeholders[] = ':' . $key;
        $params[$key] = $userId;
    }
    $stmt = $pdo->prepare(
        'SELECT user_id, employee_id, email, display_name, region_id
           FROM users
          WHERE user_id IN (' . implode(',', $placeholders) . ")
            AND role = 'KTV'
            AND is_terminated = FALSE"
    );
    $stmt->execute($params);
    $rows = $stmt->fetchAll();
    if (count($rows) !== count($userIds)) {
        fail(422, 'invalid-members', 'One or more selected technicians do not exist or are inactive.');
    }
    return $rows;
}

function training_class_fetch_devices(PDO $pdo, array $deviceIds): array
{
    if (!$deviceIds) {
        return [];
    }
    $placeholders = [];
    $params = [];
    foreach (array_values($deviceIds) as $index => $deviceId) {
        if (!preg_match('/^[A-Za-z0-9._:-]{1,50}$/D', $deviceId)) {
            fail(400, 'bad-request', 'deviceIds contains an invalid device code.');
        }
        $key = 'device_' . $index;
        $placeholders[] = ':' . $key;
        $params[$key] = $deviceId;
    }
    $stmt = $pdo->prepare(
        'SELECT device_id, device_name
           FROM device_catalog
          WHERE device_id IN (' . implode(',', $placeholders) . ')
            AND is_active = TRUE'
    );
    $stmt->execute($params);
    $rows = $stmt->fetchAll();
    if (count($rows) !== count($deviceIds)) {
        fail(422, 'invalid-devices', 'One or more selected devices do not exist or are inactive.');
    }
    return $rows;
}

function training_class_member_import_rows(array $input): array
{
    $items = $input['memberImports'] ?? $input['member_imports'] ?? [];
    if (!is_array($items) || count($items) > TRAINING_CLASS_IMPORT_MAX_ROWS) {
        fail(400, 'bad-request', 'memberImports must be an array with at most 5,000 items.');
    }
    $rows = [];
    foreach (array_values($items) as $index => $item) {
        if (!is_array($item)) {
            fail(400, 'bad-request', 'memberImports contains an invalid item.');
        }
        $employeeId = trim((string)($item['employee_id'] ?? $item['employeeId'] ?? ''));
        $displayName = trim((string)($item['display_name'] ?? $item['displayName'] ?? ''));
        $email = strtolower(trim((string)($item['email'] ?? '')));
        if (mb_strlen($employeeId, 'UTF-8') > 20 || mb_strlen($displayName, 'UTF-8') > 200 || strlen($email) > 320) {
            fail(400, 'bad-request', 'An imported class member exceeds the allowed field length.');
        }
        $rows[] = [
            'source_sheet'=>'KTV',
            'source_row'=>$index + 2,
            'employee_id'=>$employeeId,
            'display_name'=>$displayName,
            'email'=>$email,
        ];
    }
    return $rows;
}

function training_class_materialize_imported_users(PDO $pdo, array $rows): array
{
    if (!$rows) {
        return [];
    }
    $validated = validate_training_class_member_preview($pdo, ['members'=>$rows, 'errors'=>[]]);
    if ($validated['errors']) {
        fail(422, 'invalid-members', 'Imported KTV data changed or conflicts with the current employee database. Preview the file again.');
    }
    $insert = $pdo->prepare(
        <<<'SQL'
        INSERT INTO users (
            email, display_name, role, iam_profile, employee_id,
            is_terminated, employee_source, employee_synced_at,
            created_at, updated_at
        ) VALUES (
            :email, :display_name, 'KTV', '{}'::jsonb, :employee_id,
            FALSE, 'class-member-import', NOW(), NOW(), NOW()
        )
        RETURNING user_id, employee_id, email, display_name, region_id
        SQL
    );
    $users = [];
    foreach ($validated['members'] as $member) {
        if (($member['action'] ?? '') === 'create') {
            try {
                $insert->execute([
                    'email'=>$member['email'],
                    'display_name'=>$member['display_name'],
                    'employee_id'=>$member['employee_id'],
                ]);
            } catch (PDOException $exception) {
                if ($exception->getCode() === '23505') {
                    fail(409, 'member-conflict', 'A KTV was created by another request. Preview the file again.');
                }
                throw $exception;
            }
            $created = $insert->fetch();
            if (!$created) {
                throw new RuntimeException('Unable to create imported KTV.');
            }
            $users[] = $created;
            continue;
        }
        $users[] = $member;
    }
    return $users;
}

function training_class_add_members(
    PDO $pdo,
    string $classId,
    array $users,
    string $validFrom,
    string $source = 'manual'
): int {
    $upsert = $pdo->prepare(
        <<<'SQL'
        INSERT INTO class_enrollments (
            class_id, user_id, source_class_code, status, valid_from, valid_to,
            is_mock, seed_batch, created_at, updated_at
        )
        SELECT :class_id, :user_id, class_code, 'active', CAST(:valid_from AS date),
               NULL, FALSE, :source, NOW(), NOW()
          FROM training_classes
         WHERE class_id = CAST(:class_id AS uuid)
        ON CONFLICT (class_id, user_id, valid_from) DO UPDATE SET
            status = 'active',
            valid_to = NULL,
            updated_at = NOW()
        RETURNING enrollment_id
        SQL
    );
    $createAssignments = $pdo->prepare(
        <<<'SQL'
        INSERT INTO lab_assignments (
            enrollment_id, class_lab_assignment_id, curriculum_lab_id,
            assigned_at, due_at, status, region_id_snapshot, unit_id_snapshot, class_id_snapshot,
            assignment_source, is_inferred, created_at, updated_at
        )
        SELECT enrollment.enrollment_id, class_assignment.class_lab_assignment_id,
               class_assignment.curriculum_lab_id, class_assignment.assigned_at,
                class_assignment.due_at, 'assigned', roster.region_id, roster.unit_id,
                training.class_id, :source, FALSE, NOW(), NOW()
           FROM class_lab_assignments class_assignment
           JOIN training_classes training ON training.class_id = class_assignment.class_id
           JOIN class_enrollments enrollment ON enrollment.enrollment_id = :enrollment_id
           JOIN users roster ON roster.user_id = enrollment.user_id
         WHERE class_assignment.class_id = CAST(:class_id AS uuid)
           AND class_assignment.status IN ('assigned', 'active')
        ON CONFLICT (enrollment_id, curriculum_lab_id) DO NOTHING
        SQL
    );
    $count = 0;
    foreach ($users as $user) {
        $upsert->execute([
            'class_id' => $classId,
            'user_id' => $user['user_id'],
            'valid_from' => $validFrom,
            'source' => $source,
        ]);
        $enrollmentId = $upsert->fetchColumn();
        if ($enrollmentId === false) {
            throw new RuntimeException('Unable to create class enrollment.');
        }
        $createAssignments->execute([
            'enrollment_id' => $enrollmentId,
            'class_id' => $classId,
            'source' => $source === 'import' ? 'import' : 'manual',
        ]);
        $count++;
    }
    return $count;
}

function training_class_add_devices(
    PDO $pdo,
    string $classId,
    string $curriculumId,
    array $devices,
    string $startDate,
    string $source = 'manual',
    ?int &$newAssignments = null
): int {
    $insertClassAssignments = $pdo->prepare(
        <<<'SQL'
        INSERT INTO class_lab_assignments (
            class_id, curriculum_lab_id, assigned_at, due_at, status,
            assignment_source, is_inferred, created_at, updated_at
        )
        SELECT CAST(:class_id AS uuid), curriculum_lab.curriculum_lab_id,
               CAST(:start_date AS date)::timestamp,
               NULL,
               'active', :source, FALSE, NOW(), NOW()
          FROM curriculum_labs curriculum_lab
          JOIN lab_catalog lab ON lab.lab_id = curriculum_lab.lab_id
         WHERE curriculum_lab.curriculum_id = CAST(:curriculum_id AS uuid)
           AND curriculum_lab.required_mode IN ('practice', 'both')
           AND lab.device_id = :device_id
           AND lab.is_active = TRUE
        ON CONFLICT (class_id, curriculum_lab_id) DO UPDATE SET
            assigned_at = EXCLUDED.assigned_at,
            due_at = EXCLUDED.due_at,
            status = 'active',
            assignment_source = EXCLUDED.assignment_source,
            updated_at = NOW()
        SQL
    );
    $createIndividualAssignments = $pdo->prepare(
        <<<'SQL'
        INSERT INTO lab_assignments (
            enrollment_id, class_lab_assignment_id, curriculum_lab_id,
            assigned_at, due_at, status, region_id_snapshot, unit_id_snapshot, class_id_snapshot,
            assignment_source, is_inferred, created_at, updated_at
        )
        SELECT enrollment.enrollment_id, class_assignment.class_lab_assignment_id,
               class_assignment.curriculum_lab_id, class_assignment.assigned_at,
                class_assignment.due_at, 'assigned', roster.region_id, roster.unit_id,
                training.class_id, :assignment_source, FALSE, NOW(), NOW()
           FROM class_enrollments enrollment
           JOIN training_classes training ON training.class_id = enrollment.class_id
           JOIN users roster ON roster.user_id = enrollment.user_id
          JOIN class_lab_assignments class_assignment ON class_assignment.class_id = training.class_id
          JOIN curriculum_labs curriculum_lab
            ON curriculum_lab.curriculum_lab_id = class_assignment.curriculum_lab_id
          JOIN lab_catalog lab ON lab.lab_id = curriculum_lab.lab_id
         WHERE enrollment.class_id = CAST(:class_id AS uuid)
           AND enrollment.status = 'active'
           AND class_assignment.status IN ('assigned', 'active')
           AND lab.device_id = :device_id
        ON CONFLICT (enrollment_id, curriculum_lab_id) DO NOTHING
        SQL
    );
    $count = 0;
    $newAssignments = 0;
    foreach ($devices as $device) {
        $insertClassAssignments->execute([
            'class_id' => $classId,
            'curriculum_id' => $curriculumId,
            'start_date' => $startDate,
            'source' => $source,
            'device_id' => $device['device_id'],
        ]);
        if ($insertClassAssignments->rowCount() === 0) {
            fail(422, 'device-without-labs', 'Device ' . $device['device_id'] . ' has no practice labs in the class curriculum.');
        }
        $createIndividualAssignments->execute([
            'class_id' => $classId,
            'device_id' => $device['device_id'],
            'assignment_source' => $source === 'import' ? 'import' : 'manual',
        ]);
        $newAssignments += $createIndividualAssignments->rowCount();
        $count++;
    }
    return $count;
}

function training_class_create(PDO $pdo, array $input, array $actor): array
{
    $name = optional_text($input, 'className', 200) ?? optional_text($input, 'class_name', 200);
    if ($name === null) {
        fail(400, 'bad-request', 'className is required.');
    }
    $validFrom = training_class_date($input['validFrom'] ?? $input['start_date'] ?? null, 'validFrom');
    training_class_assert_dates($validFrom);
    $memberIds = training_class_array($input, 'memberUserIds');
    $memberImportRows = training_class_member_import_rows($input);
    $deviceIds = training_class_array($input, 'deviceIds');
    if (!$memberIds && !$memberImportRows) {
        fail(400, 'bad-request', 'Select at least one class member.');
    }
    if (!$deviceIds) {
        fail(400, 'bad-request', 'Select at least one assigned device.');
    }

    $users = training_class_fetch_users($pdo, $memberIds);
    $users = array_merge($users, training_class_materialize_imported_users($pdo, $memberImportRows));
    $usersById = [];
    foreach ($users as $user) {
        $usersById[(string)$user['user_id']] = $user;
    }
    $users = array_values($usersById);
    $devices = training_class_fetch_devices($pdo, $deviceIds);
    $curriculumId = training_class_default_curriculum_id($pdo);
    $classCode = training_class_next_code($pdo);
    $status = training_class_status_for_dates($validFrom);
    $regionId = null;
    $regionNames = [];
    foreach ($users as $user) {
        if (!empty($user['region_id'])) {
            $regionNames[(string)$user['region_id']] = true;
        }
    }
    if (count($regionNames) === 1) {
        $regionId = array_key_first($regionNames);
    }
    $regionName = 'Toàn quốc';
    if ($regionId !== null) {
        $lookup = $pdo->prepare('SELECT region_name FROM regions WHERE region_id = CAST(:region_id AS uuid)');
        $lookup->execute(['region_id' => $regionId]);
        $regionName = (string)($lookup->fetchColumn() ?: $regionName);
    }

    $insert = $pdo->prepare(
        <<<'SQL'
        INSERT INTO training_classes (
            class_code, class_name, region_name, region_id, curriculum_id,
            start_date, capacity, status, created_by,
            is_mock, created_at, updated_at
        ) VALUES (
            :class_code, :class_name, :region_name, CAST(:region_id AS uuid),
            CAST(:curriculum_id AS uuid), CAST(:start_date AS date),
            :capacity, :status, CAST(:created_by AS uuid), FALSE, NOW(), NOW()
        )
        RETURNING class_id
        SQL
    );
    $insert->execute([
        'class_code' => $classCode,
        'class_name' => $name,
        'region_name' => $regionName,
        'region_id' => $regionId,
        'curriculum_id' => $curriculumId,
        'start_date' => $validFrom,
        'capacity' => count($users),
        'status' => $status,
        'created_by' => training_class_actor_user_id($pdo, $actor),
    ]);
    $classId = (string)$insert->fetchColumn();
    training_class_add_members($pdo, $classId, $users, $validFrom);
    training_class_add_devices($pdo, $classId, $curriculumId, $devices, $validFrom);
    return training_class_detail($pdo, $classId);
}

function training_class_update(PDO $pdo, string $classId, array $input): array
{
    $name = optional_text($input, 'className', 200) ?? optional_text($input, 'class_name', 200);
    if ($name === null) {
        fail(400, 'bad-request', 'className is required.');
    }
    $validFrom = training_class_date($input['validFrom'] ?? $input['start_date'] ?? null, 'validFrom');
    $expectedUpdatedAt = optional_text($input, 'expectedUpdatedAt', 80)
        ?? optional_text($input, 'expected_updated_at', 80);
    if ($expectedUpdatedAt === null) {
        fail(400, 'bad-request', 'expectedUpdatedAt is required when editing a class.');
    }
    try {
        new DateTimeImmutable($expectedUpdatedAt);
    } catch (Throwable) {
        fail(400, 'bad-request', 'expectedUpdatedAt is invalid.');
    }

    $memberIds = training_class_array($input, 'memberUserIds');
    $memberImportRows = training_class_member_import_rows($input);
    $deviceIds = training_class_array($input, 'deviceIds');
    if (!$memberIds && !$memberImportRows) {
        fail(400, 'bad-request', 'Select at least one class member.');
    }
    if (!$deviceIds) {
        fail(400, 'bad-request', 'Select at least one assigned device.');
    }
    $users = array_merge(
        training_class_fetch_users($pdo, $memberIds),
        training_class_materialize_imported_users($pdo, $memberImportRows)
    );
    $usersById = [];
    foreach ($users as $user) {
        $usersById[(string)$user['user_id']] = $user;
    }
    $users = array_values($usersById);
    $devices = training_class_fetch_devices($pdo, $deviceIds);

    $lock = $pdo->prepare(
        'SELECT class_id, class_code, curriculum_id, start_date, updated_at
           FROM training_classes
          WHERE class_id = CAST(:class_id AS uuid)
          FOR UPDATE'
    );
    $lock->execute(['class_id' => $classId]);
    $current = $lock->fetch();
    if (!$current) {
        fail(404, 'class-not-found', 'Training class was not found.');
    }
    training_class_assert_dates($validFrom);
    $sameVersion = $pdo->prepare(
        'SELECT CAST(:expected_updated_at AS timestamptz) = CAST(:actual_updated_at AS timestamptz)'
    );
    $sameVersion->execute([
        'expected_updated_at' => $expectedUpdatedAt,
        'actual_updated_at' => $current['updated_at'],
    ]);
    if (!$sameVersion->fetchColumn()) {
        fail(409, 'class-conflict', 'Lớp đã được cập nhật sau khi bạn mở. Hãy tải lại trước khi lưu.');
    }
    $timezone = new DateTimeZone(normalize_app_timezone(env_value('APP_TIMEZONE')));
    $today = (new DateTimeImmutable('today', $timezone))->format('Y-m-d');
    if ((string)$current['start_date'] <= $today && (string)$current['start_date'] !== $validFrom) {
        fail(422, 'class-start-locked', 'Không thể đổi ngày bắt đầu sau khi lớp đã có hiệu lực.');
    }
    $curriculumId = (string)($current['curriculum_id'] ?: training_class_default_curriculum_id($pdo));

    $regionIds = [];
    foreach ($users as $user) {
        if (!empty($user['region_id'])) {
            $regionIds[(string)$user['region_id']] = true;
        }
    }
    $regionId = count($regionIds) === 1 ? array_key_first($regionIds) : null;
    $regionName = 'Toàn quốc';
    if ($regionId !== null) {
        $regionLookup = $pdo->prepare('SELECT region_name FROM regions WHERE region_id = CAST(:region_id AS uuid)');
        $regionLookup->execute(['region_id' => $regionId]);
        $regionName = (string)($regionLookup->fetchColumn() ?: $regionName);
    }

    $updateClass = $pdo->prepare(
        'UPDATE training_classes
            SET class_name = :class_name,
                region_name = :region_name,
                region_id = CAST(:region_id AS uuid),
                curriculum_id = CAST(:curriculum_id AS uuid),
                start_date = CAST(:start_date AS date),
                capacity = :capacity,
                status = :status,
                updated_at = NOW()
          WHERE class_id = CAST(:class_id AS uuid)'
    );
    $updateClass->execute([
        'class_name' => $name,
        'region_name' => $regionName,
        'region_id' => $regionId,
        'curriculum_id' => $curriculumId,
        'start_date' => $validFrom,
        'capacity' => count($users),
        'status' => training_class_status_for_dates($validFrom),
        'class_id' => $classId,
    ]);

    $enrollmentQuery = $pdo->prepare(
        "SELECT enrollment_id, user_id, valid_from
           FROM class_enrollments
          WHERE class_id = CAST(:class_id AS uuid) AND status = 'active'
          FOR UPDATE"
    );
    $enrollmentQuery->execute(['class_id' => $classId]);
    $activeEnrollments = [];
    foreach ($enrollmentQuery->fetchAll() as $enrollment) {
        $activeEnrollments[(string)$enrollment['user_id']] = $enrollment;
    }
    $selectedUserIds = array_fill_keys(array_keys($usersById), true);
    $retainEnrollment = $pdo->prepare(
        "UPDATE class_enrollments
            SET valid_from = CAST(:valid_from AS date), valid_to = NULL, updated_at = NOW()
          WHERE enrollment_id = :enrollment_id AND status = 'active'"
    );
    $withdrawEnrollment = $pdo->prepare(
        "UPDATE class_enrollments
            SET status = 'withdrawn',
                valid_to = CASE WHEN valid_from > CURRENT_DATE THEN valid_from
                                ELSE LEAST(COALESCE(valid_to, CURRENT_DATE), CURRENT_DATE) END,
                updated_at = NOW()
          WHERE enrollment_id = :enrollment_id AND status = 'active'"
    );
    $closeMemberAssignments = $pdo->prepare(
        "UPDATE lab_assignments
            SET status = CASE WHEN assigned_at > NOW() THEN 'waived' ELSE status END,
                due_at = GREATEST(assigned_at, LEAST(COALESCE(due_at, NOW()), NOW())),
                updated_at = NOW()
          WHERE enrollment_id = :enrollment_id AND status IN ('assigned', 'in_progress')"
    );
    $newUsers = [];
    foreach ($activeEnrollments as $userId => $enrollment) {
        if (isset($selectedUserIds[$userId])) {
            $retainEnrollment->execute([
                'valid_from' => $validFrom,
                'enrollment_id' => $enrollment['enrollment_id'],
            ]);
            continue;
        }
        $withdrawEnrollment->execute(['enrollment_id' => $enrollment['enrollment_id']]);
        $closeMemberAssignments->execute(['enrollment_id' => $enrollment['enrollment_id']]);
    }
    foreach ($users as $user) {
        if (!isset($activeEnrollments[(string)$user['user_id']])) {
            $newUsers[] = $user;
        }
    }
    if ($newUsers) {
        training_class_add_members($pdo, $classId, $newUsers, $validFrom, 'manual');
    }

    $activeDeviceQuery = $pdo->prepare(
        "SELECT DISTINCT lab.device_id
           FROM class_lab_assignments assignment
           JOIN curriculum_labs curriculum_lab ON curriculum_lab.curriculum_lab_id = assignment.curriculum_lab_id
           JOIN lab_catalog lab ON lab.lab_id = curriculum_lab.lab_id
          WHERE assignment.class_id = CAST(:class_id AS uuid)
            AND assignment.status IN ('assigned', 'active')"
    );
    $activeDeviceQuery->execute(['class_id' => $classId]);
    $selectedDeviceIds = array_fill_keys(array_map(static fn(array $device): string => (string)$device['device_id'], $devices), true);
    $closeClassDevice = $pdo->prepare(
        "UPDATE class_lab_assignments assignment
            SET status = CASE WHEN assignment.assigned_at > NOW() THEN 'cancelled' ELSE 'closed' END,
                due_at = GREATEST(assignment.assigned_at, LEAST(COALESCE(assignment.due_at, NOW()), NOW())),
                updated_at = NOW()
           FROM curriculum_labs curriculum_lab
           JOIN lab_catalog lab ON lab.lab_id = curriculum_lab.lab_id
          WHERE assignment.curriculum_lab_id = curriculum_lab.curriculum_lab_id
            AND assignment.class_id = CAST(:class_id AS uuid)
            AND lab.device_id = :device_id
            AND assignment.status IN ('assigned', 'active')"
    );
    $closeIndividualDevice = $pdo->prepare(
        "UPDATE lab_assignments individual
            SET status = CASE WHEN individual.assigned_at > NOW() THEN 'waived' ELSE individual.status END,
                due_at = GREATEST(individual.assigned_at, LEAST(COALESCE(individual.due_at, NOW()), NOW())),
                updated_at = NOW()
           FROM curriculum_labs curriculum_lab
           JOIN lab_catalog lab ON lab.lab_id = curriculum_lab.lab_id
          WHERE individual.curriculum_lab_id = curriculum_lab.curriculum_lab_id
            AND individual.class_id_snapshot = CAST(:class_id AS uuid)
            AND lab.device_id = :device_id
            AND individual.status IN ('assigned', 'in_progress')"
    );
    foreach ($activeDeviceQuery->fetchAll(PDO::FETCH_COLUMN) as $deviceId) {
        if (isset($selectedDeviceIds[(string)$deviceId])) {
            continue;
        }
        $params = ['class_id' => $classId, 'device_id' => $deviceId];
        $closeClassDevice->execute($params);
        $closeIndividualDevice->execute($params);
    }

    training_class_add_devices($pdo, $classId, $curriculumId, $devices, $validFrom, 'manual');
    $syncIndividualAssignments = $pdo->prepare(
        "UPDATE lab_assignments individual
            SET class_lab_assignment_id = class_assignment.class_lab_assignment_id,
                assigned_at = class_assignment.assigned_at,
                due_at = class_assignment.due_at,
                status = CASE WHEN individual.status = 'waived' THEN 'assigned' ELSE individual.status END,
                updated_at = NOW()
           FROM class_lab_assignments class_assignment
           JOIN curriculum_labs curriculum_lab ON curriculum_lab.curriculum_lab_id = class_assignment.curriculum_lab_id
           JOIN lab_catalog lab ON lab.lab_id = curriculum_lab.lab_id
           JOIN class_enrollments enrollment ON enrollment.class_id = class_assignment.class_id
          WHERE individual.enrollment_id = enrollment.enrollment_id
            AND individual.curriculum_lab_id = class_assignment.curriculum_lab_id
            AND class_assignment.class_id = CAST(:class_id AS uuid)
            AND enrollment.status = 'active'
            AND class_assignment.status IN ('assigned', 'active')
            AND lab.device_id = :device_id
            AND individual.status <> 'passed'"
    );
    foreach (array_keys($selectedDeviceIds) as $deviceId) {
        $syncIndividualAssignments->execute(['class_id' => $classId, 'device_id' => $deviceId]);
    }

    return training_class_detail($pdo, $classId);
}

function training_class_detail(PDO $pdo, string $classId): array
{
    $stmt = $pdo->prepare(
        <<<'SQL'
        SELECT training.class_id, training.class_code, training.class_name,
               training.start_date, training.status,
               training.region_name, training.created_at, training.updated_at
          FROM training_classes training
         WHERE training.class_id = CAST(:class_id AS uuid)
        SQL
    );
    $stmt->execute(['class_id' => $classId]);
    $class = $stmt->fetch();
    if (!$class) {
        fail(404, 'class-not-found', 'Training class was not found.');
    }
    $members = $pdo->prepare(
        <<<'SQL'
        SELECT enrollment.enrollment_id, enrollment.valid_from, enrollment.valid_to,
               enrollment.status, users.user_id, users.employee_id, users.email,
               users.display_name
          FROM class_enrollments enrollment
          JOIN users ON users.user_id = enrollment.user_id
         WHERE enrollment.class_id = CAST(:class_id AS uuid)
           AND enrollment.status = 'active'
         ORDER BY users.display_name NULLS LAST, users.employee_id
        SQL
    );
    $members->execute(['class_id' => $classId]);
    $devices = $pdo->prepare(
        <<<'SQL'
        SELECT device.device_id, device.device_name, COUNT(*) AS lab_count
          FROM class_lab_assignments assignment
          JOIN curriculum_labs curriculum_lab
            ON curriculum_lab.curriculum_lab_id = assignment.curriculum_lab_id
          JOIN lab_catalog lab ON lab.lab_id = curriculum_lab.lab_id
          JOIN device_catalog device ON device.device_id = lab.device_id
         WHERE assignment.class_id = CAST(:class_id AS uuid)
           AND assignment.status IN ('assigned', 'active')
         GROUP BY device.device_id, device.device_name, device.sort_order
         ORDER BY device.sort_order, device.device_name
        SQL
    );
    $devices->execute(['class_id' => $classId]);
    $class['members'] = $members->fetchAll();
    $class['devices'] = $devices->fetchAll();
    return $class;
}

function training_class_list(PDO $pdo): array
{
    return $pdo->query(
        <<<'SQL'
        SELECT training.class_id, training.class_code, training.class_name,
               training.start_date, training.status,
               training.region_name,
               COUNT(DISTINCT enrollment.enrollment_id) FILTER (
                   WHERE enrollment.status = 'active'
               ) AS member_count,
               COUNT(DISTINCT lab.device_id) FILTER (
                   WHERE class_assignment.status IN ('assigned', 'active')
               ) AS device_count,
               training.created_at, training.updated_at
          FROM training_classes training
          LEFT JOIN class_enrollments enrollment ON enrollment.class_id = training.class_id
          LEFT JOIN class_lab_assignments class_assignment ON class_assignment.class_id = training.class_id
          LEFT JOIN curriculum_labs curriculum_lab
            ON curriculum_lab.curriculum_lab_id = class_assignment.curriculum_lab_id
          LEFT JOIN lab_catalog lab ON lab.lab_id = curriculum_lab.lab_id
         WHERE training.is_mock = FALSE
         GROUP BY training.class_id
         ORDER BY training.start_date DESC, training.class_code DESC
        SQL
    )->fetchAll();
}

function training_class_catalog(PDO $pdo): array
{
    return [
        'members' => $pdo->query(
            "SELECT user_id, employee_id, email, display_name
               FROM users
              WHERE role = 'KTV' AND is_terminated = FALSE
              ORDER BY display_name NULLS LAST, employee_id"
        )->fetchAll(),
        'devices' => $pdo->query(
            'SELECT device_id, device_name, model
               FROM device_catalog
              WHERE is_active = TRUE
              ORDER BY sort_order, device_name'
        )->fetchAll(),
    ];
}

function training_class_learning_catalog(PDO $pdo, array $_user): array
{
    // Authentication is enforced by handle_learning(). Assignments define the
    // reporting scope, not access to the practice catalog.
    $stmt = $pdo->query(
        "SELECT device.device_id, device.device_name, device.model,
                lab.lab_id, lab.lab_name, lab.sort_order
           FROM device_catalog device
           JOIN lab_catalog lab ON lab.device_id = device.device_id
          WHERE device.is_active = TRUE AND lab.is_active = TRUE
          ORDER BY device.sort_order, device.device_name, lab.sort_order, lab.lab_name"
    );
    $devices = [];
    foreach ($stmt->fetchAll() as $row) {
        $deviceId = (string)$row['device_id'];
        if (!isset($devices[$deviceId])) {
            $devices[$deviceId] = [
                'device_id' => $deviceId,
                'device_name' => (string)$row['device_name'],
                'model' => $row['model'] ?? null,
                'labs' => [],
            ];
        }
        $devices[$deviceId]['labs'][] = [
            'lab_id' => (string)$row['lab_id'],
            'lab_name' => (string)$row['lab_name'],
        ];
    }
    return array_values($devices);
}

function training_class_import_header(string $value): string
{
    $value = mb_strtolower(trim(str_replace("\xEF\xBB\xBF", '', $value)), 'UTF-8');
    $value = strtr($value, [
        'á'=>'a','à'=>'a','ả'=>'a','ã'=>'a','ạ'=>'a','ă'=>'a','ắ'=>'a','ằ'=>'a','ẳ'=>'a','ẵ'=>'a','ặ'=>'a','â'=>'a','ấ'=>'a','ầ'=>'a','ẩ'=>'a','ẫ'=>'a','ậ'=>'a',
        'đ'=>'d','é'=>'e','è'=>'e','ẻ'=>'e','ẽ'=>'e','ẹ'=>'e','ê'=>'e','ế'=>'e','ề'=>'e','ể'=>'e','ễ'=>'e','ệ'=>'e',
        'í'=>'i','ì'=>'i','ỉ'=>'i','ĩ'=>'i','ị'=>'i','ó'=>'o','ò'=>'o','ỏ'=>'o','õ'=>'o','ọ'=>'o','ô'=>'o','ố'=>'o','ồ'=>'o','ổ'=>'o','ỗ'=>'o','ộ'=>'o','ơ'=>'o','ớ'=>'o','ờ'=>'o','ở'=>'o','ỡ'=>'o','ợ'=>'o',
        'ú'=>'u','ù'=>'u','ủ'=>'u','ũ'=>'u','ụ'=>'u','ư'=>'u','ứ'=>'u','ừ'=>'u','ử'=>'u','ữ'=>'u','ự'=>'u','ý'=>'y','ỳ'=>'y','ỷ'=>'y','ỹ'=>'y','ỵ'=>'y',
    ]);
    return preg_replace('/[^a-z0-9]+/', '', $value) ?? '';
}

function training_class_import_date(mixed $value): ?string
{
    if ($value === null || $value === '') {
        return null;
    }
    if (is_numeric($value)) {
        try {
            return SpreadsheetDate::excelToDateTimeObject((float)$value)->format('Y-m-d');
        } catch (Throwable) {
            return null;
        }
    }
    $text = trim((string)$value);
    foreach (['!Y-m-d', '!d/m/Y', '!d-m-Y'] as $format) {
        $date = DateTimeImmutable::createFromFormat($format, $text);
        if ($date instanceof DateTimeImmutable && $date->format(str_replace('!', '', $format)) === $text) {
            return $date->format('Y-m-d');
        }
    }
    return null;
}

function training_class_sheet_rows(object $sheet, array $requiredHeaders, array &$errors): array
{
    $highestRow = min((int)$sheet->getHighestDataRow(), TRAINING_CLASS_IMPORT_MAX_ROWS + 1);
    $highestColumn = Coordinate::columnIndexFromString($sheet->getHighestDataColumn());
    $headers = [];
    for ($column = 1; $column <= $highestColumn; $column++) {
        $raw = $sheet->getCell([$column, 1])->getValue();
        $headers[training_class_import_header((string)$raw)] = $column;
    }
    foreach ($requiredHeaders as $key => $aliases) {
        $found = null;
        foreach ($aliases as $alias) {
            $normalized = training_class_import_header($alias);
            if (isset($headers[$normalized])) {
                $found = $headers[$normalized];
                break;
            }
        }
        if ($found === null) {
            $errors[] = ['sheet' => $sheet->getTitle(), 'row' => 1, 'message' => "Thiếu cột bắt buộc: $key."];
        }
        $requiredHeaders[$key] = $found;
    }
    if (in_array(null, $requiredHeaders, true)) {
        return [];
    }
    if ((int)$sheet->getHighestDataRow() > TRAINING_CLASS_IMPORT_MAX_ROWS + 1) {
        $errors[] = ['sheet' => $sheet->getTitle(), 'row' => null, 'message' => 'Sheet vượt quá 5.000 dòng dữ liệu.'];
        return [];
    }
    $rows = [];
    for ($rowNumber = 2; $rowNumber <= $highestRow; $rowNumber++) {
        $row = ['source_row' => $rowNumber, 'source_sheet' => $sheet->getTitle()];
        $hasValue = false;
        foreach ($requiredHeaders as $key => $column) {
            $value = $sheet->getCell([$column, $rowNumber])->getValue();
            if (is_string($value) && str_starts_with(ltrim($value), '=')) {
                $errors[] = ['sheet' => $sheet->getTitle(), 'row' => $rowNumber, 'message' => "Không chấp nhận công thức tại cột $key."];
                $value = null;
            }
            if ($value !== null && trim((string)$value) !== '') {
                $hasValue = true;
            }
            $row[$key] = $value;
        }
        if ($hasValue) {
            $rows[] = $row;
        }
    }
    return $rows;
}

function parse_training_class_xlsx(string $path): array
{
    if (!class_exists(IOFactory::class)) {
        throw new RuntimeException('PhpSpreadsheet is required to read class assignment workbooks.');
    }
    $reader = IOFactory::createReader('Xlsx');
    $reader->setReadDataOnly(true);
    $workbook = $reader->load($path);
    $errors = [];
    $sheetMap = [];
    foreach ($workbook->getWorksheetIterator() as $sheet) {
        $sheetMap[training_class_import_header($sheet->getTitle())] = $sheet;
    }
    foreach (['lop', 'thanhvien', 'thietbi'] as $requiredSheet) {
        if (!isset($sheetMap[$requiredSheet])) {
            $errors[] = ['sheet' => null, 'row' => null, 'message' => "Thiếu sheet bắt buộc: $requiredSheet."];
        }
    }
    if ($errors) {
        return ['classes' => [], 'members' => [], 'devices' => [], 'errors' => $errors];
    }
    $classes = training_class_sheet_rows($sheetMap['lop'], [
        'class_code' => ['Mã lớp', 'MaLop'],
        'class_name' => ['Tên lớp', 'TenLop'],
        'valid_from' => ['Hiệu lực từ', 'HieuLucTu'],
    ], $errors);
    $members = training_class_sheet_rows($sheetMap['thanhvien'], [
        'class_code' => ['Mã lớp', 'MaLop'],
        'employee_id' => ['Mã NV', 'MaNV'],
        'email' => ['Email', 'Mail'],
        'display_name' => ['Tên KTV', 'TenKTV'],
    ], $errors);
    $devices = training_class_sheet_rows($sheetMap['thietbi'], [
        'class_code' => ['Mã lớp', 'MaLop'],
        'device_id' => ['Mã thiết bị', 'MaThietBi'],
    ], $errors);
    return compact('classes', 'members', 'devices', 'errors');
}

function parse_training_class_members_xlsx(string $path): array
{
    if (!class_exists(IOFactory::class)) {
        throw new RuntimeException('PhpSpreadsheet is required to read class member workbooks.');
    }
    $reader = IOFactory::createReader('Xlsx');
    $reader->setReadDataOnly(true);
    $workbook = $reader->load($path);
    $errors = [];
    try {
        $members = training_class_sheet_rows($workbook->getActiveSheet(), [
            'employee_id' => ['Mã NV', 'Ma NV', 'MaNV', 'Employee ID'],
            'display_name' => ['Tên KTV', 'Ten KTV', 'TenKTV', 'Họ tên', 'Ho ten', 'Name'],
            'email' => ['Email', 'Mail'],
        ], $errors);
        return ['members' => $members, 'errors' => $errors];
    } finally {
        $workbook->disconnectWorksheets();
    }
}

function training_class_normalize_person_name(string $value): string
{
    return mb_strtolower(preg_replace('/\s+/u', ' ', trim($value)) ?? '', 'UTF-8');
}

function validate_training_class_member_preview(PDO $pdo, array $parsed): array
{
    $errors = $parsed['errors'] ?? [];
    $warnings = [];
    $members = [];
    $seenEmployeeIds = [];
    $seenEmails = [];
    $lookup = $pdo->prepare(
        "SELECT user_id, employee_id, email, display_name, role, is_terminated, region_id
           FROM users
          WHERE employee_id = :employee_id OR LOWER(email) = :email
          ORDER BY user_id"
    );
    foreach ($parsed['members'] ?? [] as $row) {
        $sheet = (string)($row['source_sheet'] ?? 'KTV');
        $rowNumber = (int)($row['source_row'] ?? 0);
        $employeeId = trim((string)($row['employee_id'] ?? ''));
        $displayName = trim((string)($row['display_name'] ?? ''));
        $email = strtolower(trim((string)($row['email'] ?? '')));
        if ($employeeId === '' || $displayName === '' || !filter_var($email, FILTER_VALIDATE_EMAIL)) {
            $errors[] = ['sheet'=>$sheet, 'row'=>$rowNumber, 'message'=>'Mã NV, tên KTV hoặc email không hợp lệ.'];
            continue;
        }
        if (isset($seenEmployeeIds[$employeeId]) || isset($seenEmails[$email])) {
            $errors[] = ['sheet'=>$sheet, 'row'=>$rowNumber, 'message'=>'Mã NV hoặc email bị lặp trong file.'];
            continue;
        }
        $seenEmployeeIds[$employeeId] = true;
        $seenEmails[$email] = true;
        $lookup->execute(['employee_id'=>$employeeId, 'email'=>$email]);
        $matches = $lookup->fetchAll();
        if (count($matches) === 0) {
            $members[] = [
                'source_row'=>$rowNumber,
                'user_id'=>null,
                'employee_id'=>$employeeId,
                'display_name'=>$displayName,
                'email'=>$email,
                'imported_display_name'=>$displayName,
                'region_id'=>null,
                'action'=>'create',
                'warnings'=>[],
            ];
            continue;
        }
        if (count($matches) !== 1) {
            $errors[] = ['sheet'=>$sheet, 'row'=>$rowNumber, 'message'=>'Mã NV và email đang trỏ tới hai người dùng khác nhau.'];
            continue;
        }
        $matched = $matches[0];
        if ((string)$matched['employee_id'] !== $employeeId || strtolower((string)$matched['email']) !== $email) {
            $errors[] = ['sheet'=>$sheet, 'row'=>$rowNumber, 'message'=>'Mã NV và email không cùng khớp với hồ sơ KTV.'];
            continue;
        }
        $isTerminated = in_array(strtolower(trim((string)($matched['is_terminated'] ?? ''))), ['1', 't', 'true', 'yes', 'on'], true);
        if (strtoupper((string)($matched['role'] ?? '')) !== 'KTV' || $isTerminated) {
            $errors[] = ['sheet'=>$sheet, 'row'=>$rowNumber, 'message'=>'Người dùng đã tồn tại nhưng không phải KTV đang hoạt động.'];
            continue;
        }
        $memberWarnings = [];
        if (training_class_normalize_person_name((string)($matched['display_name'] ?? '')) !== training_class_normalize_person_name($displayName)) {
            $message = 'Tên trong file khác tên hồ sơ; hệ thống sẽ dùng tên hồ sơ hiện tại.';
            $memberWarnings[] = $message;
            $warnings[] = ['sheet'=>$sheet, 'row'=>$rowNumber, 'message'=>$message];
        }
        $members[] = [
            'source_row'=>$rowNumber,
            'user_id'=>(string)$matched['user_id'],
            'employee_id'=>(string)$matched['employee_id'],
            'display_name'=>(string)($matched['display_name'] ?? ''),
            'email'=>(string)$matched['email'],
            'imported_display_name'=>$displayName,
            'region_id'=>$matched['region_id'] ?? null,
            'action'=>'existing',
            'warnings'=>$memberWarnings,
        ];
    }
    return ['members'=>$members, 'errors'=>$errors, 'warnings'=>$warnings];
}

function stream_training_class_member_template(): never
{
    $workbook = new Spreadsheet();
    $sheet = $workbook->getActiveSheet();
    $sheet->setTitle('KTV');
    $sheet->fromArray([
        ['Mã NV', 'Tên KTV', 'Email'],
        ['00123456', 'Nguyễn Văn A', 'ktv@example.com'],
    ]);
    $sheet->freezePane('A2');
    $sheet->getStyle('1:1')->getFont()->setBold(true);
    foreach (range(1, 3) as $column) {
        $sheet->getColumnDimension(Coordinate::stringFromColumnIndex($column))->setAutoSize(true);
    }
    $temporary = tempnam(sys_get_temp_dir(), 'class_members_template_');
    if ($temporary === false) {
        fail(500, 'template-failed', 'Unable to create the class member template.');
    }
    try {
        (new Xlsx($workbook))->save($temporary);
        header_remove('Content-Type');
        header('Content-Type: application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
        header('Content-Disposition: attachment; filename="Mau_Import_KTV_Vao_Lop.xlsx"');
        header('Content-Length: ' . filesize($temporary));
        readfile($temporary);
    } finally {
        $workbook->disconnectWorksheets();
        @unlink($temporary);
    }
    exit;
}

function stream_training_class_import_template(): never
{
    $workbook = new Spreadsheet();
    $classSheet = $workbook->getActiveSheet();
    $classSheet->setTitle('Lop');
    $classSheet->fromArray([
        ['Mã lớp', 'Tên lớp', 'Hiệu lực từ'],
        ['FTC-000001', 'Lớp KTV tháng 09/2026', '01/09/2026'],
    ]);
    $memberSheet = $workbook->createSheet();
    $memberSheet->setTitle('ThanhVien');
    $memberSheet->fromArray([
        ['Mã lớp', 'Mã NV', 'Email', 'Tên KTV'],
        ['FTC-000001', '00123456', 'ktv@example.com', 'Nguyễn Văn A'],
    ]);
    $deviceSheet = $workbook->createSheet();
    $deviceSheet->setTitle('ThietBi');
    $deviceSheet->fromArray([
        ['Mã lớp', 'Mã thiết bị'],
        ['FTC-000001', 'DEV_AX3000CV2'],
    ]);
    foreach ($workbook->getWorksheetIterator() as $sheet) {
        $sheet->freezePane('A2');
        $sheet->getStyle('1:1')->getFont()->setBold(true);
        $highestColumn = Coordinate::columnIndexFromString($sheet->getHighestColumn());
        for ($column = 1; $column <= $highestColumn; $column++) {
            $sheet->getColumnDimension(Coordinate::stringFromColumnIndex($column))->setAutoSize(true);
        }
    }
    $temporary = tempnam(sys_get_temp_dir(), 'class_template_');
    if ($temporary === false) {
        fail(500, 'template-failed', 'Unable to create the import template.');
    }
    try {
        (new Xlsx($workbook))->save($temporary);
        header_remove('Content-Type');
        header('Content-Type: application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
        header('Content-Disposition: attachment; filename="Mau_Import_Giao_Bai.xlsx"');
        header('Content-Length: ' . filesize($temporary));
        readfile($temporary);
    } finally {
        $workbook->disconnectWorksheets();
        @unlink($temporary);
    }
    exit;
}

function validate_training_class_import(PDO $pdo, array $parsed): array
{
    $errors = $parsed['errors'] ?? [];
    $classes = [];
    $seen = [];
    foreach ($parsed['classes'] ?? [] as $row) {
        $code = strtoupper(trim((string)($row['class_code'] ?? '')));
        $name = trim((string)($row['class_name'] ?? ''));
        $from = training_class_import_date($row['valid_from'] ?? null);
        if ($code === '' || $name === '' || $from === null) {
            $errors[] = ['sheet'=>$row['source_sheet'], 'row'=>$row['source_row'], 'message'=>'Thông tin lớp hoặc thời gian hiệu lực không hợp lệ.'];
            continue;
        }
        if (isset($seen[$code])) {
            $errors[] = ['sheet'=>$row['source_sheet'], 'row'=>$row['source_row'], 'message'=>"Mã lớp $code bị lặp."];
            continue;
        }
        $lookup = $pdo->prepare('SELECT class_id, curriculum_id FROM training_classes WHERE UPPER(class_code) = :class_code');
        $lookup->execute(['class_code'=>$code]);
        $existing = $lookup->fetch();
        if (!$existing) {
            $errors[] = ['sheet'=>$row['source_sheet'], 'row'=>$row['source_row'], 'message'=>"Không tìm thấy lớp $code."];
            continue;
        }
        $seen[$code] = true;
        $curriculumId = (string)($existing['curriculum_id'] ?? '');
        if ($curriculumId === '') {
            $curriculumId = training_class_default_curriculum_id($pdo);
        }
        $classes[$code] = ['class_id'=>(string)$existing['class_id'], 'curriculum_id'=>$curriculumId, 'class_code'=>$code, 'class_name'=>$name, 'valid_from'=>$from];
    }
    $members = [];
    $memberKeys = [];
    foreach ($parsed['members'] ?? [] as $row) {
        $code = strtoupper(trim((string)($row['class_code'] ?? '')));
        $employeeId = trim((string)($row['employee_id'] ?? ''));
        $email = strtolower(trim((string)($row['email'] ?? '')));
        $displayName = trim((string)($row['display_name'] ?? ''));
        if (!isset($classes[$code]) || $employeeId === '' || $displayName === '' || !filter_var($email, FILTER_VALIDATE_EMAIL)) {
            $errors[] = ['sheet'=>$row['source_sheet'], 'row'=>$row['source_row'], 'message'=>'Mã lớp, mã NV hoặc email không hợp lệ.'];
            continue;
        }
        $lookup = $pdo->prepare("SELECT user_id, employee_id, email, display_name, region_id FROM users WHERE employee_id = :employee_id AND LOWER(email) = :email AND role = 'KTV' AND is_terminated = FALSE");
        $lookup->execute(['employee_id'=>$employeeId, 'email'=>$email]);
        $user = $lookup->fetch();
        if (!$user) {
            $errors[] = ['sheet'=>$row['source_sheet'], 'row'=>$row['source_row'], 'message'=>"Không tìm thấy KTV đang hoạt động khớp mã NV $employeeId và email $email."];
            continue;
        }
        $canonicalName = preg_replace('/\s+/u', ' ', mb_strtolower(trim((string)($user['display_name'] ?? '')), 'UTF-8'));
        $importedName = preg_replace('/\s+/u', ' ', mb_strtolower($displayName, 'UTF-8'));
        if ($canonicalName !== '' && $canonicalName !== $importedName) {
            $errors[] = ['sheet'=>$row['source_sheet'], 'row'=>$row['source_row'], 'message'=>"Tên KTV không khớp hồ sơ của mã NV $employeeId."];
            continue;
        }
        $key = $code . '|' . $user['user_id'];
        if (!isset($memberKeys[$key])) {
            $members[] = ['class_code'=>$code, 'user'=>$user];
            $memberKeys[$key] = true;
        }
    }
    $devices = [];
    $deviceKeys = [];
    foreach ($parsed['devices'] ?? [] as $row) {
        $code = strtoupper(trim((string)($row['class_code'] ?? '')));
        $deviceId = trim((string)($row['device_id'] ?? ''));
        if (!isset($classes[$code]) || $deviceId === '') {
            $errors[] = ['sheet'=>$row['source_sheet'], 'row'=>$row['source_row'], 'message'=>'Mã lớp hoặc mã thiết bị không hợp lệ.'];
            continue;
        }
        $lookup = $pdo->prepare('SELECT device_id, device_name FROM device_catalog WHERE device_id = :device_id AND is_active = TRUE');
        $lookup->execute(['device_id'=>$deviceId]);
        $device = $lookup->fetch();
        if (!$device) {
            $errors[] = ['sheet'=>$row['source_sheet'], 'row'=>$row['source_row'], 'message'=>"Không tìm thấy thiết bị đang hoạt động $deviceId."];
            continue;
        }
        $key = $code . '|' . $deviceId;
        if (!isset($deviceKeys[$key])) {
            $devices[] = ['class_code'=>$code, 'device'=>$device];
            $deviceKeys[$key] = true;
        }
    }
    foreach (array_keys($classes) as $code) {
        if (!array_filter($members, static fn(array $item): bool => $item['class_code'] === $code)) {
            $errors[] = ['sheet'=>'ThanhVien', 'row'=>null, 'message'=>"Lớp $code không có thành viên hợp lệ."];
        }
        if (!array_filter($devices, static fn(array $item): bool => $item['class_code'] === $code)) {
            $errors[] = ['sheet'=>'ThietBi', 'row'=>null, 'message'=>"Lớp $code không có thiết bị hợp lệ."];
        }
    }
    return ['classes'=>$classes, 'members'=>$members, 'devices'=>$devices, 'errors'=>$errors];
}

function apply_training_class_import(PDO $pdo, array $validated, string $batchId, array $actor, ?string $fileName): array
{
    $existing = $pdo->prepare('SELECT class_count, member_count, device_count, assignment_count, error_count FROM assignment_import_log WHERE batch_id = :batch_id');
    $existing->execute(['batch_id'=>$batchId]);
    if ($row = $existing->fetch()) {
        return ['batch_id'=>$batchId, 'duplicate'=>true] + $row;
    }
    $assignmentCount = 0;
    $update = $pdo->prepare("UPDATE training_classes SET class_name=:class_name, curriculum_id=COALESCE(curriculum_id, CAST(:curriculum_id AS uuid)), start_date=CAST(:valid_from AS date), status=:status, updated_at=NOW() WHERE class_id=CAST(:class_id AS uuid)");
    $updateEnrollments = $pdo->prepare("UPDATE class_enrollments SET valid_to=NULL, updated_at=NOW() WHERE class_id=CAST(:class_id AS uuid) AND status='active'");
    $updateClassAssignments = $pdo->prepare("UPDATE class_lab_assignments SET assigned_at=CAST(:valid_from AS date)::timestamp, due_at=NULL, updated_at=NOW() WHERE class_id=CAST(:class_id AS uuid) AND status IN ('assigned','active')");
    $updateIndividualAssignments = $pdo->prepare("UPDATE lab_assignments SET assigned_at=CAST(:valid_from AS date)::timestamp, due_at=NULL, updated_at=NOW() WHERE class_id_snapshot=CAST(:class_id AS uuid) AND status IN ('assigned','in_progress')");
    foreach ($validated['classes'] as $class) {
        $dateParams = ['valid_from'=>$class['valid_from'], 'class_id'=>$class['class_id']];
        $update->execute(['class_name'=>$class['class_name'], 'curriculum_id'=>$class['curriculum_id'], 'status'=>training_class_status_for_dates($class['valid_from'])] + $dateParams);
        $updateEnrollments->execute(['class_id'=>$class['class_id']]);
        $updateClassAssignments->execute($dateParams);
        $updateIndividualAssignments->execute($dateParams);
        $classMembers = array_values(array_map(static fn(array $item): array => $item['user'], array_filter($validated['members'], static fn(array $item): bool => $item['class_code'] === $class['class_code'])));
        $classDevices = array_values(array_map(static fn(array $item): array => $item['device'], array_filter($validated['devices'], static fn(array $item): bool => $item['class_code'] === $class['class_code'])));
        training_class_add_members($pdo, $class['class_id'], $classMembers, $class['valid_from'], 'import');
        $createdForClass = 0;
        training_class_add_devices($pdo, $class['class_id'], $class['curriculum_id'], $classDevices, $class['valid_from'], 'import', $createdForClass);
        $assignmentCount += $createdForClass;
    }
    $result = ['batch_id'=>$batchId, 'duplicate'=>false, 'class_count'=>count($validated['classes']), 'member_count'=>count($validated['members']), 'device_count'=>count($validated['devices']), 'assignment_count'=>$assignmentCount, 'error_count'=>0];
    $log = $pdo->prepare("INSERT INTO assignment_import_log (batch_id, imported_by, file_name, class_count, member_count, device_count, assignment_count, error_count, error_details) VALUES (:batch_id, CAST(:imported_by AS uuid), :file_name, :class_count, :member_count, :device_count, :assignment_count, 0, '[]'::jsonb)");
    $log->execute(['batch_id'=>$batchId, 'imported_by'=>training_class_actor_user_id($pdo, $actor), 'file_name'=>$fileName, 'class_count'=>$result['class_count'], 'member_count'=>$result['member_count'], 'device_count'=>$result['device_count'], 'assignment_count'=>$result['assignment_count']]);
    return $result;
}

function training_class_personal_dashboard_payload(PDO $pdo, array $user): array
{
    $userId = (string)($user['user_id'] ?? '');
    if ($userId === '') {
        fail(401, 'auth/unauthenticated', 'Sign in to access personal dashboard.');
    }

    // 1. User profile and region
    $userQuery = $pdo->prepare(
        'SELECT user_id, employee_id, display_name, email, role, job_title,
                unit_id, unit_code, unit_name, region_id, region_code, region_name, branch_name
           FROM v_ktv_directory
          WHERE user_id = CAST(:user_id AS uuid)'
    );
    $userQuery->execute(['user_id' => $userId]);
    $userInfo = $userQuery->fetch(PDO::FETCH_ASSOC) ?: $user;

    // 2. Active class enrollments
    $enrollmentsQuery = $pdo->prepare(
        <<<'SQL'
        SELECT e.enrollment_id, e.status AS enrollment_status, e.valid_from, e.valid_to,
               c.class_id, c.class_code, c.class_name, c.start_date, c.status AS class_status
          FROM class_enrollments e
          JOIN training_classes c ON c.class_id = e.class_id
         WHERE e.user_id = CAST(:user_id AS uuid)
           AND e.status = 'active'
           AND e.valid_from <= CURRENT_DATE
           AND (e.valid_to IS NULL OR e.valid_to >= CURRENT_DATE)
           AND c.status IN ('planned', 'active')
           AND c.start_date <= CURRENT_DATE
         ORDER BY c.start_date DESC
        SQL
    );
    $enrollmentsQuery->execute(['user_id' => $userId]);
    $enrolledClasses = $enrollmentsQuery->fetchAll(PDO::FETCH_ASSOC);

    // 3. Assigned labs from v_lab_assignment_progress
    $assignmentsQuery = $pdo->prepare(
        <<<'SQL'
        SELECT progress.assignment_id,
               progress.class_code,
               progress.class_name,
               progress.device_id,
               progress.device_name,
               progress.lab_id,
               progress.lab_name,
               progress.assignment_status AS status,
               progress.assigned_at,
               progress.due_at,
               progress.completed_at,
               progress.passed_at,
               progress.first_pass_attempt_no,
               progress.first_try_success,
               device.model,
               device.sort_order AS device_sort_order,
               lab.sort_order AS lab_sort_order
          FROM v_lab_assignment_progress progress
          JOIN lab_assignments assignment ON assignment.assignment_id = progress.assignment_id
          JOIN class_enrollments enrollment ON enrollment.enrollment_id = assignment.enrollment_id
          JOIN training_classes training ON training.class_id = progress.class_id
          JOIN device_catalog device ON device.device_id = progress.device_id
          JOIN lab_catalog lab ON lab.lab_id = progress.lab_id
         WHERE progress.user_id = CAST(:user_id AS uuid)
           AND progress.assignment_status <> 'waived'
           AND enrollment.status = 'active'
           AND training.status IN ('planned', 'active')
         ORDER BY device.sort_order, progress.device_name, lab.sort_order, progress.lab_name
        SQL
    );
    $assignmentsQuery->execute(['user_id' => $userId]);
    $rawAssignments = $assignmentsQuery->fetchAll(PDO::FETCH_ASSOC);

    // 4. Group by device
    $deviceProgressMap = [];
    $totalAssignedLabs = count($rawAssignments);
    $passedLabsCount = 0;
    $inProgressLabsCount = 0;
    $firstTryPassCount = 0;
    $firstTryEligibleCount = 0;
    $assignments = [];

    foreach ($rawAssignments as $row) {
        $devId = (string)$row['device_id'];
        if (!isset($deviceProgressMap[$devId])) {
            $deviceProgressMap[$devId] = [
                'device_id' => $devId,
                'device_name' => (string)$row['device_name'],
                'model' => $row['model'] ?? null,
                'total_labs' => 0,
                'passed_labs' => 0,
                'in_progress_labs' => 0,
                'assigned_labs' => 0,
                'progress_percent' => 0,
                'labs' => [],
            ];
        }
        $deviceProgressMap[$devId]['total_labs']++;
        $status = (string)$row['status'];
        if ($status === 'passed') {
            $deviceProgressMap[$devId]['passed_labs']++;
            $passedLabsCount++;
            if ($row['first_pass_attempt_no'] !== null) {
                $firstTryEligibleCount++;
                if ((int)$row['first_pass_attempt_no'] === 1) {
                    $firstTryPassCount++;
                }
            }
        } elseif ($status === 'in_progress') {
            $deviceProgressMap[$devId]['in_progress_labs']++;
            $inProgressLabsCount++;
        } else {
            $deviceProgressMap[$devId]['assigned_labs']++;
        }

        $assignmentItem = [
            'assignment_id' => (string)$row['assignment_id'],
            'class_code' => (string)$row['class_code'],
            'class_name' => (string)$row['class_name'],
            'device_id' => $devId,
            'device_name' => (string)$row['device_name'],
            'lab_id' => (string)$row['lab_id'],
            'lab_name' => (string)$row['lab_name'],
            'status' => $status,
            'assigned_at' => safe_datetime($row['assigned_at']),
            'due_at' => safe_datetime($row['due_at']),
            'completed_at' => safe_datetime($row['completed_at'] ?? $row['passed_at']),
            'first_pass_attempt_no' => $row['first_pass_attempt_no'] !== null ? (int)$row['first_pass_attempt_no'] : null,
            'first_try_success' => $row['first_try_success'] !== null ? (bool)$row['first_try_success'] : null,
        ];
        $deviceProgressMap[$devId]['labs'][] = $assignmentItem;
        $assignments[] = $assignmentItem;
    }

    foreach ($deviceProgressMap as &$dev) {
        $dev['progress_percent'] = $dev['total_labs'] > 0
            ? round(($dev['passed_labs'] / $dev['total_labs']) * 100, 1)
            : 0;
    }
    unset($dev);
    $deviceProgressList = array_values($deviceProgressMap);

    // 5. Timer sessions history
    $sessionsQuery = $pdo->prepare(
        <<<'SQL'
        SELECT s.id,
               s.lab_id,
               s.lab_name,
               s.device AS device_name_snapshot,
               s.device_id,
               COALESCE(d.device_name, s.device) AS device_name,
               s.mode,
               s.session_type,
               s.status,
               s.is_passed,
               s.duration_sec,
               s.started_at,
               s.finished_at,
               s.practice_attempt_no,
               s.last_action
          FROM timer_sessions s
          LEFT JOIN device_catalog d ON d.device_id = s.device_id
         WHERE (
               s.user_id = CAST(:user_id AS uuid)
            OR (NULLIF(:email, '') IS NOT NULL AND LOWER(s.email) = LOWER(:email))
            OR (NULLIF(:employee_id, '') IS NOT NULL AND s.technician_id = :employee_id)
         )
           AND s.status IN ('completed', 'failed')
           AND NOT COALESCE(s.is_mock, FALSE)
         ORDER BY s.finished_at DESC NULLS LAST, s.id DESC
         LIMIT 500
        SQL
    );
    $sessionsQuery->execute([
        'user_id' => $userId,
        'email' => $user['email'] ?? '',
        'employee_id' => $user['employee_id'] ?? '',
    ]);
    $rawSessions = $sessionsQuery->fetchAll(PDO::FETCH_ASSOC);

    $sessions = [];
    $totalDurationSec = 0;
    $practiceCount = 0;
    $guideCount = 0;
    $gradedPracticeSessionsCount = 0;
    $passedPracticeSessionsCount = 0;
    $trendDaysMap = [];

    foreach ($rawSessions as $sess) {
        $mode = (string)($sess['mode'] ?? 'Thực hành');
        $sessionType = (string)($sess['session_type'] ?? ($mode === 'Hướng dẫn' ? 'guide' : 'practice'));
        $duration = (int)($sess['duration_sec'] ?? 0);
        $isPassed = $sess['is_passed'] === null
            ? null
            : database_boolean($sess['is_passed']);
        $finishedAt = safe_datetime($sess['finished_at']);
        $startedAt = safe_datetime($sess['started_at']);
        $isPractice = !($mode === 'Hướng dẫn' || $sessionType === 'guide');
        $labId = (string)($sess['lab_id'] ?? '');

        if (!$isPractice) {
            $guideCount++;
        } else {
            $practiceCount++;
            $totalDurationSec += $duration;
            if ($isPassed !== null) {
                $gradedPracticeSessionsCount++;
                if ($isPassed) {
                    $passedPracticeSessionsCount++;
                }
            }

        }

        $timestamp = $sess['finished_at'] ?? $sess['started_at'] ?? null;
        if ($timestamp) {
            $dateKey = substr((string)$timestamp, 0, 10);
            if (!isset($trendDaysMap[$dateKey])) {
                $trendDaysMap[$dateKey] = [
                    'date' => $dateKey,
                    'practice_count' => 0,
                    'guide_count' => 0,
                    'graded_count' => 0,
                    'passed_count' => 0,
                    'duration_sec' => 0,
                ];
            }
            if (!$isPractice) {
                $trendDaysMap[$dateKey]['guide_count']++;
            } else {
                $trendDaysMap[$dateKey]['practice_count']++;
                if ($isPassed !== null) {
                    $trendDaysMap[$dateKey]['graded_count']++;
                    if ($isPassed) {
                        $trendDaysMap[$dateKey]['passed_count']++;
                    }
                }
                $trendDaysMap[$dateKey]['duration_sec'] += $duration;
            }
        }

        $sessions[] = [
            'id' => (int)$sess['id'],
            'lab_id' => $labId,
            'lab_name' => (string)($sess['lab_name'] ?? ''),
            'device_id' => (string)($sess['device_id'] ?? ''),
            'device_name' => (string)($sess['device_name'] ?? ($sess['device_name_snapshot'] ?? '')),
            'mode' => $mode,
            'session_type' => $sessionType,
            'status' => (string)($sess['status'] ?? 'completed'),
            'is_passed' => $isPassed,
            'duration_sec' => $duration,
            'started_at' => $startedAt,
            'finished_at' => $finishedAt,
            'practice_attempt_no' => $sess['practice_attempt_no'] !== null ? (int)$sess['practice_attempt_no'] : null,
            'last_action' => (string)($sess['last_action'] ?? ''),
        ];
    }

    ksort($trendDaysMap);
    $trendList = [];
    foreach ($trendDaysMap as $d => $data) {
        $dailyPassRate = $data['graded_count'] > 0
            ? round(100 * $data['passed_count'] / $data['graded_count'], 1)
            : null;
        $trendList[] = [
            'date' => $d,
            'total_sessions' => $data['practice_count'] + $data['guide_count'],
            'practice_count' => $data['practice_count'],
            'guide_count' => $data['guide_count'],
            'graded_count' => $data['graded_count'],
            'passed_count' => $data['passed_count'],
            'pass_rate_percent' => $dailyPassRate,
            'duration_sec' => $data['duration_sec'],
        ];
    }

    // KPI and daily trend must cover the complete history even though the
    // detailed session list is intentionally capped for payload safety.
    $sessionStatsQuery = $pdo->prepare(
        <<<'SQL'
        SELECT COUNT(*) AS total_sessions_count,
               COUNT(*) FILTER (WHERE COALESCE(s.mode, 'Thực hành') IN ('Hướng dẫn', 'guide') OR s.session_type = 'guide') AS guide_count,
               COUNT(*) FILTER (WHERE NOT (COALESCE(s.mode, 'Thực hành') IN ('Hướng dẫn', 'guide') OR s.session_type = 'guide')) AS practice_count,
               COUNT(*) FILTER (
                   WHERE NOT (COALESCE(s.mode, 'Thực hành') IN ('Hướng dẫn', 'guide') OR s.session_type = 'guide')
                     AND s.is_passed IS NOT NULL
               ) AS graded_count,
               COUNT(*) FILTER (
                   WHERE NOT (COALESCE(s.mode, 'Thực hành') IN ('Hướng dẫn', 'guide') OR s.session_type = 'guide')
                     AND s.is_passed IS TRUE
               ) AS passed_count,
               COALESCE(SUM(COALESCE(s.duration_sec, 0)) FILTER (
                   WHERE NOT (COALESCE(s.mode, 'Thực hành') IN ('Hướng dẫn', 'guide') OR s.session_type = 'guide')
               ), 0) AS practice_duration_sec
          FROM timer_sessions s
         WHERE (
               s.user_id = CAST(:user_id AS uuid)
            OR (NULLIF(:email, '') IS NOT NULL AND LOWER(s.email) = LOWER(:email))
            OR (NULLIF(:employee_id, '') IS NOT NULL AND s.technician_id = :employee_id)
         )
           AND s.status IN ('completed', 'failed')
           AND NOT COALESCE(s.is_mock, FALSE)
        SQL
    );
    $sessionStatsQuery->execute([
        'user_id' => $userId,
        'email' => $user['email'] ?? '',
        'employee_id' => $user['employee_id'] ?? '',
    ]);
    $allSessionStats = $sessionStatsQuery->fetch(PDO::FETCH_ASSOC) ?: [];
    $practiceCount = (int)($allSessionStats['practice_count'] ?? 0);
    $guideCount = (int)($allSessionStats['guide_count'] ?? 0);
    $gradedPracticeSessionsCount = (int)($allSessionStats['graded_count'] ?? 0);
    $passedPracticeSessionsCount = (int)($allSessionStats['passed_count'] ?? 0);
    $totalDurationSec = (int)($allSessionStats['practice_duration_sec'] ?? 0);
    $allSessionsCount = (int)($allSessionStats['total_sessions_count'] ?? 0);

    $sessionTrendQuery = $pdo->prepare(
        <<<'SQL'
        SELECT COALESCE(s.finished_at, s.started_at)::date AS activity_date,
               COUNT(*) FILTER (WHERE COALESCE(s.mode, 'Thực hành') IN ('Hướng dẫn', 'guide') OR s.session_type = 'guide') AS guide_count,
               COUNT(*) FILTER (WHERE NOT (COALESCE(s.mode, 'Thực hành') IN ('Hướng dẫn', 'guide') OR s.session_type = 'guide')) AS practice_count,
               COUNT(*) FILTER (
                   WHERE NOT (COALESCE(s.mode, 'Thực hành') IN ('Hướng dẫn', 'guide') OR s.session_type = 'guide')
                     AND s.is_passed IS NOT NULL
               ) AS graded_count,
               COUNT(*) FILTER (
                   WHERE NOT (COALESCE(s.mode, 'Thực hành') IN ('Hướng dẫn', 'guide') OR s.session_type = 'guide')
                     AND s.is_passed IS TRUE
               ) AS passed_count,
               COALESCE(SUM(COALESCE(s.duration_sec, 0)) FILTER (
                   WHERE NOT (COALESCE(s.mode, 'Thực hành') IN ('Hướng dẫn', 'guide') OR s.session_type = 'guide')
               ), 0) AS duration_sec
          FROM timer_sessions s
         WHERE (
               s.user_id = CAST(:user_id AS uuid)
            OR (NULLIF(:email, '') IS NOT NULL AND LOWER(s.email) = LOWER(:email))
            OR (NULLIF(:employee_id, '') IS NOT NULL AND s.technician_id = :employee_id)
         )
           AND s.status IN ('completed', 'failed')
           AND NOT COALESCE(s.is_mock, FALSE)
           AND COALESCE(s.finished_at, s.started_at) IS NOT NULL
         GROUP BY activity_date
         ORDER BY activity_date
        SQL
    );
    $sessionTrendQuery->execute([
        'user_id' => $userId,
        'email' => $user['email'] ?? '',
        'employee_id' => $user['employee_id'] ?? '',
    ]);
    $trendList = array_map(static function (array $row): array {
        $graded = (int)$row['graded_count'];
        $passed = (int)$row['passed_count'];
        $practice = (int)$row['practice_count'];
        $guide = (int)$row['guide_count'];
        return [
            'date' => (string)$row['activity_date'],
            'total_sessions' => $practice + $guide,
            'practice_count' => $practice,
            'guide_count' => $guide,
            'graded_count' => $graded,
            'passed_count' => $passed,
            'pass_rate_percent' => $graded > 0 ? round(100 * $passed / $graded, 1) : null,
            'duration_sec' => (int)$row['duration_sec'],
        ];
    }, $sessionTrendQuery->fetchAll(PDO::FETCH_ASSOC));

    $completionRate = $totalAssignedLabs > 0 ? round(($passedLabsCount / $totalAssignedLabs) * 100, 1) : 0;
    $firstTryRate = $firstTryEligibleCount > 0 ? round(($firstTryPassCount / $firstTryEligibleCount) * 100, 1) : 0;
    $practicePassRate = $gradedPracticeSessionsCount > 0
        ? round(100 * $passedPracticeSessionsCount / $gradedPracticeSessionsCount, 1)
        : 0;

    return [
        'user' => [
            'user_id' => (string)($userInfo['user_id'] ?? $userId),
            'employee_id' => (string)($userInfo['employee_id'] ?? ($user['employee_id'] ?? '')),
            'display_name' => (string)($userInfo['display_name'] ?? ($user['display_name'] ?? 'Kỹ thuật viên')),
            'email' => (string)($userInfo['email'] ?? ($user['email'] ?? '')),
            'role' => (string)($userInfo['role'] ?? ($user['role'] ?? 'KTV')),
            'role_name' => (string)($userInfo['role_name'] ?? 'Kỹ thuật viên'),
            'job_title' => $userInfo['job_title'] ?? null,
            'unit_name' => $userInfo['unit_name'] ?? null,
            'region_name' => $userInfo['region_name'] ?? null,
        ],
        'classes' => $enrolledClasses,
        'stats' => [
            'total_assigned_labs'        => $totalAssignedLabs,
            'passed_labs'                => $passedLabsCount,
            'in_progress_labs'           => $inProgressLabsCount,
            'unstarted_labs'             => max(0, $totalAssignedLabs - $passedLabsCount - $inProgressLabsCount),
            'completion_rate_percent'    => $completionRate,
            'first_try_pass_rate_percent'=> $firstTryRate,
            'first_try_eligible_labs'    => $firstTryEligibleCount,
            'first_try_passed_labs'      => $firstTryPassCount,
            'total_sessions_count'       => $allSessionsCount,
            'practice_sessions_count'    => $practiceCount,
            'guide_sessions_count'       => $guideCount,
            'graded_practice_sessions_count' => $gradedPracticeSessionsCount,
            'passed_practice_sessions_count' => $passedPracticeSessionsCount,
            'practice_pass_rate_percent' => $practicePassRate,
            'total_practice_duration_sec'=> $totalDurationSec,
        ],
        'device_progress' => $deviceProgressList,
        'assignments' => $assignments,
        'sessions' => $sessions,
        'session_history_returned_count' => count($sessions),
        'session_history_truncated' => count($sessions) < $allSessionsCount,
        'trend' => $trendList,
    ];
}

