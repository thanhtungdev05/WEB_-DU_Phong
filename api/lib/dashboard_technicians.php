<?php
declare(strict_types=1);

/**
 * Compact activity source shared by the paginated technician directory and
 * the per-technician history endpoint. Identity resolution happens in SQL so
 * raw rows do not have to cross the Neon connection for PHP-side grouping.
 */
function dashboard_technician_activity_cte(): string
{
    return <<<'SQL'
WITH people AS (
    SELECT roster.user_id::text AS person_id,
           roster.user_id,
           roster.employee_id,
           LOWER(roster.email) AS email,
           roster.display_name,
           COALESCE(
               NULLIF(roster.dashboard_region, ''),
               NULLIF(roster.region_name, ''),
               NULLIF(roster.region_code, ''),
               'FTC'
           ) AS region,
           roster.job_title,
           roster.unit_code,
           roster.unit_name,
           roster.branch_name,
           roster.class_code
      FROM v_ktv_directory roster
     WHERE roster.is_terminated = FALSE
    UNION ALL
    SELECT 'firebase:' || LOWER(event.normalized_email) AS person_id,
           NULL::uuid AS user_id,
           NULL::varchar AS employee_id,
           LOWER(event.normalized_email) AS email,
           COALESCE(MAX(NULLIF(timer.name, '')), LOWER(event.normalized_email)) AS display_name,
           'FTC' AS region,
           'KTV lịch sử chưa đối chiếu khu vực' AS job_title,
           'FTC' AS unit_code,
           'FTC' AS unit_name,
           'FTC' AS branch_name,
           NULL::varchar AS class_code
      FROM firebase_legacy_import_events event
      JOIN timer_sessions timer ON timer.id = event.timer_session_id
     WHERE event.account_group = 'KTV'
       AND event.resolution_status = 'imported'
       AND NULLIF(event.normalized_email, '') IS NOT NULL
       AND NOT EXISTS (
           SELECT 1
             FROM v_ktv_directory roster
            WHERE roster.is_terminated = FALSE
              AND LOWER(roster.email) = LOWER(event.normalized_email)
       )
     GROUP BY LOWER(event.normalized_email)
),
identities AS (
    SELECT person_id, 'user:' || user_id::text AS identity_key
      FROM people WHERE user_id IS NOT NULL
    UNION
    SELECT person_id, 'email:' || email
      FROM people WHERE NULLIF(email, '') IS NOT NULL
    UNION
    SELECT person_id, 'employee:' || employee_id
      FROM people WHERE NULLIF(employee_id, '') IS NOT NULL
),
activity AS (
    SELECT timer.id AS session_id,
           identity.person_id,
           person.employee_id,
           person.email,
           person.display_name,
           person.region,
           person.job_title,
           person.unit_code,
           person.unit_name,
           person.branch_name,
           person.class_code,
           COALESCE(timer.started_at, timer.finished_at, timer.created_at) AS occurred_at,
           timer.duration_sec,
           timer.mode,
           timer.status,
           timer.is_passed,
           timer.completed_first_try,
           timer.practice_attempt_no,
           timer.attempt_sequence_complete,
           timer.seed_batch,
           timer.last_action,
           device.device_id,
           device.device_name,
           lab.lab_id,
           lab.lab_name
      FROM timer_sessions timer
      JOIN identities identity
        ON identity.identity_key = CASE
            WHEN timer.user_id IS NOT NULL THEN 'user:' || timer.user_id::text
            WHEN NULLIF(timer.email, '') IS NOT NULL THEN 'email:' || LOWER(timer.email)
            ELSE 'employee:' || COALESCE(timer.technician_id, '')
        END
      JOIN people person ON person.person_id = identity.person_id
      JOIN lab_catalog lab ON lab.lab_id = timer.lab_id AND lab.is_active = TRUE
      JOIN device_catalog device ON device.device_id = lab.device_id AND device.is_active = TRUE
     WHERE NOT COALESCE(timer.is_mock, FALSE)
       AND timer.status IN ('completed', 'failed')
)
SQL;
}

function dashboard_decode_json_list(mixed $value): array
{
    if (is_array($value)) return array_values($value);
    $decoded = json_decode((string)$value, true);
    return is_array($decoded) ? array_values($decoded) : [];
}

function dashboard_technician_safe_datetime(mixed $value): ?string
{
    if (!$value) return null;
    try {
        return (new DateTimeImmutable((string)$value))->format(DateTimeInterface::ATOM);
    } catch (Throwable) {
        return null;
    }
}

function dashboard_technician_summary_page(
    PDO $pdo,
    string $from,
    string $to,
    array $filters,
    int $limit,
    int $offset,
    string $sort,
    string $direction
): array {
    $activityWhere = [
        'activity.occurred_at >= CAST(:date_from AS date)',
        "activity.occurred_at < CAST(:date_to AS date) + INTERVAL '1 day'",
    ];
    $params = ['date_from' => $from, 'date_to' => $to];

    $addArrayFilter = static function (
        array $values,
        string $column,
        string $prefix
    ) use (&$activityWhere, &$params): void {
        $values = array_values(array_unique(array_filter(array_map(
            static fn(mixed $value): string => trim((string)$value),
            $values
        ), static fn(string $value): bool => $value !== '')));
        if (!$values) return;
        $placeholders = [];
        foreach ($values as $index => $value) {
            $key = $prefix . '_' . $index;
            $placeholders[] = ':' . $key;
            $params[$key] = $value;
        }
        $activityWhere[] = $column . ' IN (' . implode(', ', $placeholders) . ')';
    };

    $addArrayFilter($filters['regions'] ?? [], 'activity.region', 'region');
    $addArrayFilter($filters['devices'] ?? [], 'activity.device_name', 'device');
    $addArrayFilter($filters['labs'] ?? [], 'activity.lab_name', 'lab');
    $addArrayFilter($filters['identities'] ?? [], 'activity.email', 'identity');

    $summaryWhere = [];
    $search = trim((string)($filters['search'] ?? ''));
    if ($search !== '') {
        $summaryWhere[] = "(
            summary.display_name ILIKE :search
            OR summary.email ILIKE :search
            OR summary.employee_id ILIKE :search
        )";
        $params['search'] = '%' . $search . '%';
    }

    $sortColumns = [
        'learner' => 'summary.display_name',
        'email' => 'summary.email',
        'region' => 'summary.region',
        'total' => 'summary.total_sessions',
        'lastDateTimeMs' => 'summary.last_started_at',
    ];
    $sortColumn = $sortColumns[$sort] ?? $sortColumns['lastDateTimeMs'];
    $sortDirection = strtolower($direction) === 'asc' ? 'ASC' : 'DESC';
    $activityPredicate = implode("\n       AND ", $activityWhere);
    $summaryPredicate = $summaryWhere ? 'WHERE ' . implode(' AND ', $summaryWhere) : '';

    $sql = dashboard_technician_activity_cte() . ",\n" . <<<SQL
scoped AS (
    SELECT activity.*
      FROM activity
     WHERE $activityPredicate
),
summary AS (
    SELECT scoped.person_id,
           MAX(scoped.employee_id) AS employee_id,
           MAX(scoped.email) AS email,
           MAX(scoped.display_name) AS display_name,
           MAX(scoped.region) AS region,
           COUNT(*) AS total_sessions,
           TO_JSONB(ARRAY_AGG(DISTINCT scoped.device_name ORDER BY scoped.device_name)) AS device_names,
           TO_JSONB(ARRAY_AGG(DISTINCT scoped.lab_name ORDER BY scoped.lab_name)) AS lab_names,
           MAX(scoped.occurred_at) AS last_started_at,
           (ARRAY_AGG(scoped.duration_sec ORDER BY scoped.occurred_at DESC, scoped.session_id DESC))[1] AS latest_duration_sec,
           COUNT(*) FILTER (
               WHERE scoped.mode IN ('Thực hành', 'practice')
                 AND scoped.is_passed IS NOT NULL
                 AND scoped.attempt_sequence_complete IS TRUE
           ) AS rate_eligible_count,
           COUNT(*) FILTER (
               WHERE scoped.mode IN ('Thực hành', 'practice')
                 AND scoped.is_passed IS TRUE
                 AND scoped.attempt_sequence_complete IS TRUE
           ) AS passed_count
      FROM scoped
     GROUP BY scoped.person_id
),
filtered AS (
    SELECT summary.*
      FROM summary
     $summaryPredicate
)
SELECT summary.*,
       COUNT(*) OVER () AS matched_technicians,
       COALESCE(SUM(summary.total_sessions) OVER (), 0) AS matched_sessions
  FROM filtered summary
 ORDER BY $sortColumn $sortDirection NULLS LAST, summary.person_id ASC
 LIMIT :page_limit OFFSET :page_offset
SQL;

    $statement = $pdo->prepare($sql);
    foreach ($params as $key => $value) {
        $statement->bindValue(':' . $key, $value);
    }
    $statement->bindValue(':page_limit', $limit, PDO::PARAM_INT);
    $statement->bindValue(':page_offset', $offset, PDO::PARAM_INT);
    $statement->execute();
    $rows = $statement->fetchAll();
    $total = $rows ? (int)$rows[0]['matched_technicians'] : 0;
    $totalSessions = $rows ? (int)$rows[0]['matched_sessions'] : 0;

    return [
        'items' => array_map(static fn(array $row): array => [
            'person_id' => (string)$row['person_id'],
            'employee_id' => $row['employee_id'] ?? null,
            'email' => (string)($row['email'] ?? ''),
            'display_name' => (string)($row['display_name'] ?? ''),
            'region' => (string)($row['region'] ?? 'FTC'),
            'total_sessions' => (int)$row['total_sessions'],
            'device_names' => dashboard_decode_json_list($row['device_names'] ?? null),
            'lab_names' => dashboard_decode_json_list($row['lab_names'] ?? null),
            'last_started_at' => dashboard_technician_safe_datetime($row['last_started_at'] ?? null),
            'latest_duration_sec' => $row['latest_duration_sec'] !== null
                ? (int)$row['latest_duration_sec']
                : null,
            'rate_eligible_count' => (int)$row['rate_eligible_count'],
            'passed_count' => (int)$row['passed_count'],
        ], $rows),
        'page' => [
            'limit' => $limit,
            'offset' => $offset,
            'total' => $total,
            'total_sessions' => $totalSessions,
            'has_more' => $offset + count($rows) < $total,
        ],
    ];
}

function dashboard_technician_session_page(
    PDO $pdo,
    string $personId,
    string $from,
    string $to,
    int $limit,
    array $cursor
): array {
    $where = [
        'activity.person_id = :person_id',
        'activity.occurred_at >= CAST(:date_from AS date)',
        "activity.occurred_at < CAST(:date_to AS date) + INTERVAL '1 day'",
    ];
    $params = ['person_id' => $personId, 'date_from' => $from, 'date_to' => $to];
    if (isset($cursor['started_at'], $cursor['session_id'])) {
        $where[] = '(activity.occurred_at, activity.session_id) < (:cursor_started_at, CAST(:cursor_session_id AS BIGINT))';
        $params['cursor_started_at'] = (string)$cursor['started_at'];
        $params['cursor_session_id'] = (string)$cursor['session_id'];
    }
    $predicate = implode("\n       AND ", $where);
    $sql = dashboard_technician_activity_cte() . "\n" . <<<SQL
SELECT activity.*
  FROM activity
 WHERE $predicate
 ORDER BY activity.occurred_at DESC, activity.session_id DESC
 LIMIT :page_limit
SQL;
    $statement = $pdo->prepare($sql);
    foreach ($params as $key => $value) {
        $statement->bindValue(':' . $key, $value);
    }
    $statement->bindValue(':page_limit', $limit + 1, PDO::PARAM_INT);
    $statement->execute();
    $rows = $statement->fetchAll();
    $hasMore = count($rows) > $limit;
    if ($hasMore) array_pop($rows);

    return [
        'rows' => $rows,
        'has_more' => $hasMore,
    ];
}
