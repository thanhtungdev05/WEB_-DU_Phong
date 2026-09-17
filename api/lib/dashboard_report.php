<?php
declare(strict_types=1);

/**
 * Database-backed dashboard reporting for the simplified production schema.
 * Explicit class/lab assignments define the denominator; timer_sessions supplies
 * attempts and outcomes. No browser-maintained business catalog is used.
 */

function dashboard_report_parse_date(?string $value, DateTimeImmutable $fallback): DateTimeImmutable
{
    $value = trim((string)$value);
    if ($value === '') {
        return $fallback;
    }
    $parsed = DateTimeImmutable::createFromFormat('!Y-m-d', $value);
    $errors = DateTimeImmutable::getLastErrors();
    if (!$parsed || ($errors !== false && ($errors['warning_count'] > 0 || $errors['error_count'] > 0))) {
        throw new InvalidArgumentException('Invalid dashboard report date. Expected YYYY-MM-DD.');
    }
    return $parsed;
}

function dashboard_report_common_cte(): string
{
    return <<<'SQL'
WITH assignment_pairs AS (
    SELECT DISTINCT
           roster.user_id::text AS person_id,
           roster.user_id,
           roster.employee_id,
           roster.display_name,
           roster.email,
           COALESCE(NULLIF(assignment_region.region_name, ''), NULLIF(roster.region_name, ''), NULLIF(roster.region_code, ''), NULLIF(roster.dashboard_region, ''), 'FTC') AS region_name,
           COALESCE(NULLIF(assignment_region.region_code, ''), NULLIF(roster.region_code, ''), 'FTC') AS region_code,
           COALESCE(assignment.region_id_snapshot, roster.region_id) AS region_id,
           COALESCE(assignment_region.dashboard_group, roster.dashboard_group) AS dashboard_group,
           COALESCE(assignment_unit.unit_id, roster.unit_id) AS unit_id,
           COALESCE(NULLIF(assignment_unit.unit_code, ''), NULLIF(roster.unit_code, ''), 'FTC') AS unit_code,
           COALESCE(assignment_unit.unit_name, roster.branch_name) AS branch_name,
           assignment.region_id_snapshot IS NOT NULL AS region_snapshot_present,
           lab.lab_id,
           lab.lab_name,
           lab.sort_order AS lab_sort_order,
           device.device_id,
           device.device_name,
           device.sort_order AS device_sort_order,
           GREATEST(
               assignment.assigned_at,
               COALESCE(class_assignment.assigned_at, assignment.assigned_at),
               enrollment.valid_from::timestamp,
               training.start_date::timestamp
           ) AS effective_from,
NULLIF(
                LEAST(
                    COALESCE(enrollment.valid_to, 'infinity'::date),
                    COALESCE(class_assignment.due_at::date, 'infinity'::date),
                    COALESCE(assignment.due_at::date, 'infinity'::date)
                ),
                'infinity'::date
            ) AS effective_to
      FROM lab_assignments assignment
      JOIN class_enrollments enrollment ON enrollment.enrollment_id = assignment.enrollment_id
      JOIN training_classes training ON training.class_id = assignment.class_id_snapshot
      LEFT JOIN class_lab_assignments class_assignment
        ON class_assignment.class_lab_assignment_id = assignment.class_lab_assignment_id
      JOIN v_ktv_directory roster ON roster.user_id = enrollment.user_id
      LEFT JOIN regions assignment_region ON assignment_region.region_id = assignment.region_id_snapshot
      LEFT JOIN org_units assignment_unit ON assignment_unit.unit_id = assignment.unit_id_snapshot
      JOIN curriculum_labs curriculum_lab ON curriculum_lab.curriculum_lab_id = assignment.curriculum_lab_id
      JOIN lab_catalog lab ON lab.lab_id = curriculum_lab.lab_id
      JOIN device_catalog device ON device.device_id = lab.device_id
     WHERE roster.is_terminated = FALSE
       AND enrollment.is_mock = FALSE
       AND training.is_mock = FALSE
       AND (
           enrollment.status <> 'withdrawn'
           OR enrollment.updated_at::date >= enrollment.valid_from
       )
       AND assignment.status <> 'waived'
       AND (
           class_assignment.class_lab_assignment_id IS NULL
           OR class_assignment.status IN ('assigned', 'active', 'closed')
       )
       AND lab.is_active = TRUE
       AND device.is_active = TRUE
),
reportable_people AS (
    SELECT roster.user_id::text AS person_id,
           roster.user_id,
           roster.employee_id,
           roster.email
      FROM v_ktv_directory roster
     WHERE roster.is_terminated = FALSE
    UNION ALL
    SELECT 'firebase:' || LOWER(event.normalized_email) AS person_id,
           NULL::uuid AS user_id,
           NULL::varchar AS employee_id,
           LOWER(event.normalized_email) AS email
      FROM firebase_legacy_import_events event
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
reportable_identities AS (
    SELECT person_id, 'user:' || user_id::text AS identity_key
      FROM reportable_people WHERE user_id IS NOT NULL
    UNION
    SELECT person_id, 'email:' || LOWER(email)
      FROM reportable_people WHERE NULLIF(email, '') IS NOT NULL
    UNION
    SELECT person_id, 'employee:' || employee_id
      FROM reportable_people WHERE NULLIF(employee_id, '') IS NOT NULL
),
eligible AS (
    SELECT DISTINCT person_id, user_id, employee_id, email
      FROM assignment_pairs
),
eligible_identities AS (
    SELECT person_id, 'user:' || user_id::text AS identity_key FROM eligible WHERE user_id IS NOT NULL
    UNION
    SELECT person_id, 'email:' || LOWER(email) FROM eligible WHERE NULLIF(email, '') IS NOT NULL
    UNION
    SELECT person_id, 'employee:' || employee_id FROM eligible WHERE NULLIF(employee_id, '') IS NOT NULL
),
active_labs AS (
    SELECT lab.lab_id,
           lab.lab_name,
           lab.sort_order AS lab_sort_order,
           device.device_id,
           device.device_name,
           device.sort_order AS device_sort_order
      FROM lab_catalog lab
      JOIN device_catalog device ON device.device_id = lab.device_id
     WHERE lab.is_active = TRUE
       AND device.is_active = TRUE
),
all_valid_sessions AS (
    SELECT timer.id,
           identity.person_id,
           timer.lab_id,
           timer.device_id,
           COALESCE(timer.started_at, timer.finished_at, timer.created_at) AS occurred_at,
           timer.mode,
           timer.status,
           timer.is_passed,
           timer.completed_first_try,
           timer.practice_attempt_no,
           timer.attempt_sequence_complete,
           timer.duration_sec
      FROM timer_sessions timer
      JOIN reportable_identities identity
        ON identity.identity_key = CASE
            WHEN timer.user_id IS NOT NULL THEN 'user:' || timer.user_id::text
            WHEN NULLIF(timer.email, '') IS NOT NULL THEN 'email:' || LOWER(timer.email)
            ELSE 'employee:' || COALESCE(timer.technician_id, '')
        END
     WHERE NOT COALESCE(timer.is_mock, FALSE)
       AND timer.status IN ('completed', 'failed')
),
resolved_sessions AS (
    SELECT timer.id,
           identity.person_id,
           lab.lab_id,
           lab.device_id,
           COALESCE(timer.started_at, timer.finished_at, timer.created_at) AS occurred_at,
           timer.mode,
           timer.status,
           timer.is_passed,
           timer.completed_first_try,
           timer.practice_attempt_no,
           timer.attempt_sequence_complete,
           timer.duration_sec
      FROM timer_sessions timer
      JOIN active_labs lab ON lab.lab_id = timer.lab_id
      JOIN eligible_identities identity
        ON identity.identity_key = CASE
            WHEN timer.user_id IS NOT NULL THEN 'user:' || timer.user_id::text
            WHEN NULLIF(timer.email, '') IS NOT NULL THEN 'email:' || LOWER(timer.email)
            ELSE 'employee:' || COALESCE(timer.technician_id, '')
        END
     WHERE NOT COALESCE(timer.is_mock, FALSE)
       AND timer.status IN ('completed', 'failed')
       AND EXISTS (
           SELECT 1
             FROM assignment_pairs assigned
            WHERE assigned.person_id = identity.person_id
              AND assigned.lab_id = lab.lab_id
              AND COALESCE(timer.started_at, timer.finished_at, timer.created_at) >= assigned.effective_from
              AND (
                  assigned.effective_to IS NULL
                  OR COALESCE(timer.started_at, timer.finished_at, timer.created_at)
                     < assigned.effective_to::timestamp + INTERVAL '1 day'
              )
       )
),
numbered_sessions AS (
    SELECT session.*
      FROM resolved_sessions session
)
SQL;
}

function dashboard_report_metric(PDO $pdo, ?string $from, ?string $to): array
{
    $where = [];
    $params = [];
    if ($from !== null) {
        $where[] = 'occurred_at >= CAST(:from_date AS date)';
        $params['from_date'] = $from;
    }
    if ($to !== null) {
        $where[] = "occurred_at < CAST(:to_date AS date) + INTERVAL '1 day'";
        $params['to_date'] = $to;
    }
    $predicate = $where ? 'WHERE ' . implode(' AND ', $where) : '';
    $progressWhere = '';
    if ($to !== null) {
        $progressWhere = "WHERE occurred_at < CAST(:progress_to_date AS date) + INTERVAL '1 day'";
        $params['progress_to_date'] = $to;
    }
    $cohortPredicate = 'TRUE';
    if ($to !== null) {
        $cohortPredicate = "pair.effective_from < CAST(:cohort_to_date AS date) + INTERVAL '1 day'
            AND (pair.effective_to IS NULL OR pair.effective_to >= CAST(:cohort_to_date AS date))";
        $params['cohort_to_date'] = $to;
    }

    $sql = dashboard_report_common_cte() . ",\n" . <<<SQL
cohort_pairs AS (
    SELECT DISTINCT person_id, lab_id
      FROM assignment_pairs pair
     WHERE $cohortPredicate
),
activity_scoped AS (
    SELECT session.*
      FROM all_valid_sessions session
     $predicate
),
progress_scoped AS (
    SELECT session.*
      FROM numbered_sessions session
      JOIN cohort_pairs cohort
        ON cohort.person_id = session.person_id AND cohort.lab_id = session.lab_id
     $progressWhere
),
pair_outcomes AS (
    SELECT person_id,
           lab_id,
           BOOL_OR(
                mode IN ('Thực hành', 'practice')
                AND is_passed IS TRUE
           ) AS completed,
           MIN(practice_attempt_no) FILTER (
                WHERE mode IN ('Thực hành', 'practice')
                  AND is_passed IS TRUE
                  AND attempt_sequence_complete IS TRUE
           ) AS first_pass_attempt_no
      FROM progress_scoped
     GROUP BY person_id, lab_id
)
SELECT (SELECT COUNT(*) FROM cohort_pairs) AS assigned_count,
       COUNT(*) FILTER (WHERE activity_scoped.mode IN ('Thực hành', 'practice')) AS practice_attempts,
       COUNT(*) FILTER (WHERE activity_scoped.mode IN ('Hướng dẫn', 'guide')) AS guide_attempts,
       COUNT(DISTINCT activity_scoped.person_id) AS participating_technicians,
       COUNT(*) FILTER (
           WHERE activity_scoped.mode IN ('Thực hành', 'practice')
             AND activity_scoped.status IN ('completed', 'Hoàn thành')
       ) AS activity_completed_count,
       COUNT(*) FILTER (
           WHERE activity_scoped.mode IN ('Thực hành', 'practice')
             AND activity_scoped.status IN ('completed', 'Hoàn thành')
             AND activity_scoped.is_passed IS NULL
       ) AS ungraded_completed_count,
       (SELECT COUNT(*) FROM pair_outcomes WHERE completed IS TRUE) AS completed_count,
       COUNT(*) FILTER (
            WHERE activity_scoped.mode IN ('Thực hành', 'practice')
              AND activity_scoped.is_passed IS NOT NULL
              AND activity_scoped.attempt_sequence_complete IS TRUE
       ) AS graded_count,
       COUNT(*) FILTER (
            WHERE activity_scoped.mode IN ('Thực hành', 'practice')
              AND activity_scoped.is_passed IS TRUE
              AND activity_scoped.attempt_sequence_complete IS TRUE
       ) AS passed_count,
       ROUND(100.0 * (SELECT COUNT(*) FROM pair_outcomes WHERE completed IS TRUE)
           / NULLIF((SELECT COUNT(*) FROM cohort_pairs), 0), 2) AS completion_rate,
       ROUND(100.0 * COUNT(*) FILTER (
            WHERE activity_scoped.mode IN ('Thực hành', 'practice')
              AND activity_scoped.is_passed IS TRUE
              AND activity_scoped.attempt_sequence_complete IS TRUE
        ) / NULLIF(COUNT(*) FILTER (
             WHERE activity_scoped.mode IN ('Thực hành', 'practice')
               AND activity_scoped.is_passed IS NOT NULL
               AND activity_scoped.attempt_sequence_complete IS TRUE
        ), 0), 2) AS pass_rate,
       ROUND(100.0 * (SELECT COUNT(*) FROM pair_outcomes WHERE first_pass_attempt_no = 1)
            / NULLIF((SELECT COUNT(*) FROM pair_outcomes WHERE first_pass_attempt_no IS NOT NULL), 0), 2) AS first_try_rate,
       ROUND(AVG(activity_scoped.duration_sec) FILTER (
            WHERE activity_scoped.mode IN ('Thực hành', 'practice') AND activity_scoped.duration_sec > 0
       )) AS avg_duration_sec,
       COUNT(*) FILTER (
            WHERE activity_scoped.mode IN ('Thực hành', 'practice') AND activity_scoped.duration_sec > 0
       ) AS duration_known_count,
       ROUND(100.0 * COUNT(*) FILTER (
            WHERE activity_scoped.mode IN ('Thực hành', 'practice') AND activity_scoped.duration_sec > 0
       ) / NULLIF(COUNT(*) FILTER (
            WHERE activity_scoped.mode IN ('Thực hành', 'practice')
        ), 0), 2) AS duration_coverage_rate
  FROM activity_scoped
SQL;
    $stmt = $pdo->prepare($sql);
    $stmt->execute($params);
    return $stmt->fetch() ?: [];
}

function dashboard_report_monthly(PDO $pdo, int $year): array
{
    $sql = dashboard_report_common_cte() . ",\n" . <<<'SQL'
months AS (
    SELECT month,
           LEAST(month + INTERVAL '1 month', CURRENT_DATE + INTERVAL '1 day') AS cutoff
      FROM generate_series(
               CAST(:year_start AS date),
               CAST(:year_start AS date) + INTERVAL '11 months',
               INTERVAL '1 month'
           ) AS generated(month)
),
month_cohort AS (
    SELECT DISTINCT months.month, months.cutoff, pair.person_id, pair.lab_id
      FROM months
      JOIN assignment_pairs pair
        ON pair.effective_from < months.cutoff
       AND (pair.effective_to IS NULL OR pair.effective_to >= (months.cutoff - INTERVAL '1 day')::date)
     WHERE months.month <= DATE_TRUNC('month', CURRENT_DATE)::date
),
scoped AS (
    SELECT numbered.*,
           DATE_TRUNC('month', occurred_at)::date AS month
      FROM all_valid_sessions numbered
     WHERE occurred_at >= CAST(:year_start AS date)
       AND occurred_at < CAST(:year_start AS date) + INTERVAL '1 year'
),
attempt_metrics AS (
    SELECT scoped.month,
           COUNT(*) FILTER (WHERE mode IN ('Thực hành', 'practice')) AS practice_attempts,
           COUNT(*) FILTER (WHERE mode IN ('Hướng dẫn', 'guide')) AS guide_attempts,
           COUNT(DISTINCT scoped.person_id) AS participating_technicians,
           COUNT(*) FILTER (
               WHERE mode IN ('Thực hành', 'practice')
                 AND is_passed IS NOT NULL
                 AND attempt_sequence_complete IS TRUE
           ) AS graded_count,
           COUNT(*) FILTER (
               WHERE mode IN ('Thực hành', 'practice')
                 AND is_passed IS TRUE
                 AND attempt_sequence_complete IS TRUE
           ) AS passed_count,
           ROUND(AVG(duration_sec) FILTER (WHERE mode IN ('Thực hành', 'practice') AND duration_sec > 0)) AS avg_duration_sec,
           COUNT(*) FILTER (WHERE mode IN ('Thực hành', 'practice') AND duration_sec > 0) AS duration_known_count
      FROM scoped
     GROUP BY scoped.month
),
monthly_pair_outcomes AS (
    SELECT cohort.month,
           cohort.person_id,
           cohort.lab_id,
           BOOL_OR(
               session.mode IN ('Thực hành', 'practice')
               AND session.is_passed IS TRUE
           ) AS completed,
           MIN(session.practice_attempt_no) FILTER (
               WHERE session.mode IN ('Thực hành', 'practice')
                 AND session.is_passed IS TRUE
                 AND session.attempt_sequence_complete IS TRUE
           ) AS first_pass_attempt_no
      FROM month_cohort cohort
      LEFT JOIN numbered_sessions session
        ON session.person_id = cohort.person_id
       AND session.lab_id = cohort.lab_id
       AND session.occurred_at < cohort.cutoff
     GROUP BY cohort.month, cohort.person_id, cohort.lab_id
),
pair_metrics AS (
    SELECT month,
           COUNT(*) AS assigned_count,
           COUNT(*) FILTER (WHERE completed IS TRUE) AS completed_count,
           COUNT(*) FILTER (WHERE first_pass_attempt_no = 1) AS first_try_count,
           COUNT(first_pass_attempt_no) AS first_try_eligible_count
      FROM monthly_pair_outcomes
     GROUP BY month
)
SELECT TO_CHAR(months.month, 'YYYY-MM') AS month,
       COALESCE(attempt.practice_attempts, 0) AS practice_attempts,
       COALESCE(attempt.guide_attempts, 0) AS guide_attempts,
       COALESCE(attempt.participating_technicians, 0) AS participating_technicians,
       COALESCE(pair.assigned_count, 0) AS assigned_count,
       COALESCE(pair.completed_count, 0) AS completed_count,
       COALESCE(attempt.graded_count, 0) AS graded_count,
       COALESCE(attempt.passed_count, 0) AS passed_count,
       ROUND(100.0 * COALESCE(pair.completed_count, 0)
           / NULLIF(pair.assigned_count, 0), 2) AS completion_rate,
       ROUND(100.0 * COALESCE(attempt.passed_count, 0) / NULLIF(attempt.graded_count, 0), 2) AS pass_rate,
       ROUND(100.0 * COALESCE(pair.first_try_count, 0)
           / NULLIF(pair.first_try_eligible_count, 0), 2) AS first_try_rate,
       attempt.avg_duration_sec,
       COALESCE(attempt.duration_known_count, 0) AS duration_known_count,
       ((months.month + INTERVAL '1 month') > DATE_TRUNC('month', CURRENT_DATE) + INTERVAL '1 month') AS is_future
  FROM months
  LEFT JOIN attempt_metrics attempt ON attempt.month = months.month
  LEFT JOIN pair_metrics pair ON pair.month = months.month
 ORDER BY months.month
SQL;
    $stmt = $pdo->prepare($sql);
    $stmt->execute(['year_start' => sprintf('%04d-01-01', $year)]);
    return $stmt->fetchAll();
}

/**
 * Region reporting intentionally uses the current active roster, not class/lab
 * assignments. Every active technician is in scope for every active lab and
 * every valid session is considered, including sessions without an assignment.
 */
function dashboard_report_region_common_cte(): string
{
    return <<<'SQL'
WITH roster_people AS (
    SELECT roster.user_id::text AS person_id,
           roster.user_id,
           roster.employee_id,
           roster.display_name,
           roster.email,
           roster.region_id,
           COALESCE(NULLIF(roster.region_code, ''), 'FTC') AS region_code,
           COALESCE(NULLIF(roster.region_name, ''), NULLIF(roster.dashboard_region, ''), 'FTC') AS region_name,
           COALESCE(NULLIF(roster.dashboard_group, ''), NULLIF(roster.region_name, ''), 'FTC') AS dashboard_group,
           roster.unit_id,
           COALESCE(NULLIF(roster.unit_code, ''), 'FTC') AS unit_code,
           COALESCE(NULLIF(roster.branch_name, ''), NULLIF(roster.unit_name, ''), 'FTC') AS branch_name
      FROM v_ktv_directory roster
     WHERE roster.is_terminated = FALSE
),
firebase_ktv_people AS (
    SELECT 'firebase:' || LOWER(event.normalized_email) AS person_id,
           NULL::uuid AS user_id,
           NULL::varchar AS employee_id,
           MAX(NULLIF(timer.name, '')) AS display_name,
           LOWER(event.normalized_email) AS email,
           NULL::uuid AS region_id,
           'FTC'::varchar AS region_code,
           'FTC'::varchar AS region_name,
           'FTC'::varchar AS dashboard_group,
           NULL::uuid AS unit_id,
           'FTC'::varchar AS unit_code,
           'FTC'::varchar AS branch_name
      FROM firebase_legacy_import_events event
      JOIN timer_sessions timer ON timer.id = event.timer_session_id
     WHERE event.account_group = 'KTV'
       AND event.resolution_status = 'imported'
       AND NULLIF(event.normalized_email, '') IS NOT NULL
       AND NOT COALESCE(timer.is_mock, FALSE)
       AND NOT EXISTS (
           SELECT 1 FROM roster_people roster
            WHERE LOWER(roster.email) = LOWER(event.normalized_email)
       )
     GROUP BY LOWER(event.normalized_email)
),
regional_people AS (
    SELECT * FROM roster_people
    UNION ALL
    SELECT * FROM firebase_ktv_people
),
regional_identities AS (
    SELECT person_id, 'user:' || user_id::text AS identity_key
      FROM regional_people WHERE user_id IS NOT NULL
    UNION
    SELECT person_id, 'email:' || LOWER(email)
      FROM regional_people WHERE NULLIF(email, '') IS NOT NULL
    UNION
    SELECT person_id, 'employee:' || employee_id
      FROM regional_people WHERE NULLIF(employee_id, '') IS NOT NULL
),
active_labs AS (
    SELECT lab.lab_id,
           lab.lab_name,
           lab.sort_order AS lab_sort_order,
           device.device_id,
           device.device_name,
           device.sort_order AS device_sort_order
      FROM lab_catalog lab
      JOIN device_catalog device ON device.device_id = lab.device_id
     WHERE lab.is_active = TRUE
       AND device.is_active = TRUE
),
numbered_sessions AS (
    SELECT timer.id,
           identity.person_id,
           lab.lab_id,
           lab.device_id,
           COALESCE(timer.started_at, timer.finished_at, timer.created_at) AS occurred_at,
           timer.mode,
           timer.status,
           timer.is_passed,
           timer.attempt_sequence_complete,
           timer.duration_sec
      FROM timer_sessions timer
      JOIN active_labs lab ON lab.lab_id = timer.lab_id
      JOIN regional_identities identity
        ON identity.identity_key = CASE
            WHEN timer.user_id IS NOT NULL THEN 'user:' || timer.user_id::text
            WHEN NULLIF(timer.email, '') IS NOT NULL THEN 'email:' || LOWER(timer.email)
            ELSE 'employee:' || COALESCE(timer.technician_id, '')
        END
     WHERE NOT COALESCE(timer.is_mock, FALSE)
       AND timer.status IN ('completed', 'failed')
)
SQL;
}

function dashboard_report_branch_drilldown(PDO $pdo, string $from, string $to): array
{
    $sql = dashboard_report_region_common_cte() . ",\n" . <<<'SQL'
activity AS (
    SELECT session.person_id,
           session.lab_id,
           COUNT(session.id) FILTER (
               WHERE session.mode IN ('Thực hành', 'practice')
                 AND session.is_passed IS NOT NULL
                 AND session.attempt_sequence_complete IS TRUE
           ) AS attempt_count,
           COUNT(session.id) FILTER (
               WHERE session.mode IN ('Thực hành', 'practice')
                 AND session.is_passed IS TRUE
                 AND session.attempt_sequence_complete IS TRUE
           ) AS pass_count,
           COUNT(session.id) FILTER (
               WHERE session.mode IN ('Thực hành', 'practice')
                 AND session.is_passed IS TRUE
                 AND session.attempt_sequence_complete IS FALSE
           ) AS incomplete_attempt_count
      FROM numbered_sessions session
     WHERE session.occurred_at >= CAST(:from_date AS date)
       AND session.occurred_at < CAST(:to_date AS date) + INTERVAL '1 day'
     GROUP BY session.person_id, session.lab_id
),
progress AS (
    SELECT session.person_id,
           session.lab_id,
           BOOL_OR(
               session.mode IN ('Thực hành', 'practice') AND session.is_passed IS TRUE
           ) AS completed
      FROM numbered_sessions session
     WHERE session.occurred_at < CAST(:to_date AS date) + INTERVAL '1 day'
     GROUP BY session.person_id, session.lab_id
),
metric_pairs AS (
    SELECT person_id, lab_id FROM activity
    UNION
    SELECT person_id, lab_id FROM progress WHERE completed IS TRUE
)
SELECT person.*,
       lab.device_id,
       lab.device_name,
       lab.device_sort_order,
       lab.lab_id,
       lab.lab_name,
       lab.lab_sort_order,
       COALESCE(activity.attempt_count, 0) AS attempt_count,
       COALESCE(activity.pass_count, 0) AS pass_count,
       COALESCE(activity.incomplete_attempt_count, 0) AS incomplete_attempt_count,
       COALESCE(progress.completed, FALSE) AS completed
  FROM metric_pairs metric
  JOIN regional_people person USING (person_id)
  JOIN active_labs lab USING (lab_id)
  LEFT JOIN activity USING (person_id, lab_id)
  LEFT JOIN progress USING (person_id, lab_id)
 ORDER BY COALESCE(person.dashboard_group, person.region_name), person.region_name,
          person.branch_name, person.display_name, person.employee_id,
          lab.device_sort_order, lab.lab_sort_order, lab.lab_id
SQL;
    $stmt = $pdo->prepare($sql);
    $stmt->execute(['from_date' => $from, 'to_date' => $to]);

    $regions = [];
    $organizationRows = $pdo->query(
        "SELECT region.region_id, region.region_code, region.region_name, region.dashboard_group,
                unit.unit_id, unit.unit_code, unit.unit_name
           FROM regions region
           LEFT JOIN org_units unit
             ON unit.region_id = region.region_id
            AND unit.is_active = TRUE
          WHERE region.is_active = TRUE
          ORDER BY COALESCE(region.dashboard_group, region.region_name), region.region_name, unit.unit_name, unit.unit_code"
    )->fetchAll();
    foreach ($organizationRows as $organization) {
        $regionKey = (string)$organization['region_id'] . '|' . (string)$organization['region_code'];
        if (!isset($regions[$regionKey])) {
            $regions[$regionKey] = [
                'region' => [
                    'region_id' => $organization['region_id'],
                    'code' => (string)$organization['region_code'],
                    'name' => (string)$organization['region_name'],
                    'dashboard_group' => $organization['dashboard_group'] ?? null,
                ],
                'branches' => [],
            ];
        }
        if ($organization['unit_id'] !== null) {
            $unitKey = (string)$organization['unit_id'] . '|' . (string)$organization['unit_code'];
            $regions[$regionKey]['branches'][$unitKey] = [
                'unit_id' => $organization['unit_id'],
                'unit_code' => (string)$organization['unit_code'],
                'name' => (string)$organization['unit_name'],
                'cells' => [],
                'total' => ['population_count' => 0, 'attempted_count' => 0, 'completed_count' => 0, 'attempt_count' => 0, 'incomplete_attempt_count' => 0],
                'technicians' => [],
            ];
        }
    }
    $rosterRows = $pdo->query(
        dashboard_report_region_common_cte() . "\n"
        . "SELECT person_id, user_id, employee_id, display_name, email,
                  region_id, region_code, region_name, dashboard_group,
                  unit_id, unit_code, branch_name
             FROM regional_people
            ORDER BY COALESCE(dashboard_group, region_name), region_name,
                     branch_name, display_name, employee_id"
    )->fetchAll();
    foreach ($rosterRows as $roster) {
        $regionKey = (string)$roster['region_id'] . '|' . (string)$roster['region_code'];
        $unitKey = (string)$roster['unit_id'] . '|' . (string)$roster['unit_code'];
        if (!isset($regions[$regionKey])) {
            $regions[$regionKey] = [
                'region' => [
                    'region_id' => $roster['region_id'] ?? null,
                    'code' => (string)$roster['region_code'],
                    'name' => (string)$roster['region_name'],
                    'dashboard_group' => $roster['dashboard_group'] ?? null,
                ],
                'branches' => [],
            ];
        }
        if (!isset($regions[$regionKey]['branches'][$unitKey])) {
            $regions[$regionKey]['branches'][$unitKey] = [
                'unit_id' => $roster['unit_id'] ?? null,
                'unit_code' => (string)$roster['unit_code'],
                'name' => (string)$roster['branch_name'],
                'cells' => [],
                'total' => ['population_count' => 0, 'attempted_count' => 0, 'completed_count' => 0, 'attempt_count' => 0, 'incomplete_attempt_count' => 0],
                'technicians' => [],
            ];
        }
        $personKey = (string)$roster['person_id'];
        $regions[$regionKey]['branches'][$unitKey]['technicians'][$personKey] = [
            'user_id' => $roster['user_id'] ?? null,
            'employee_id' => (string)($roster['employee_id'] ?? ''),
            'display_name' => (string)($roster['display_name'] ?? ''),
            'email' => (string)($roster['email'] ?? ''),
            'cells' => [],
            'total' => ['pass_count' => 0, 'attempt_count' => 0, 'incomplete_attempt_count' => 0],
        ];
    }

    $activeLabIds = $pdo->query(
        'SELECT lab.lab_id
           FROM lab_catalog lab
           JOIN device_catalog device ON device.device_id = lab.device_id
          WHERE lab.is_active = TRUE AND device.is_active = TRUE
          ORDER BY device.sort_order, device.device_id, lab.sort_order, lab.lab_id'
    )->fetchAll(PDO::FETCH_COLUMN);
    foreach ($regions as &$region) {
        foreach ($region['branches'] as &$branch) {
            $population = count($branch['technicians']);
            foreach ($activeLabIds as $activeLabId) {
                $branch['cells'][(string)$activeLabId] = [
                    'population_count' => $population,
                    'attempted_count' => 0,
                    'completed_count' => 0,
                    'attempt_count' => 0,
                    'incomplete_attempt_count' => 0,
                ];
                $branch['total']['population_count'] += $population;
            }
        }
        unset($branch);
    }
    unset($region);
    while ($row = $stmt->fetch()) {
        $regionKey = (string)($row['region_id'] ?? '') . '|' . (string)$row['region_code'];
        $unitKey = (string)($row['unit_id'] ?? '') . '|' . (string)$row['unit_code'];
        $personKey = (string)$row['person_id'];
        $labId = (string)$row['lab_id'];
        if (!isset($regions[$regionKey])) {
            $regions[$regionKey] = [
                'region' => [
                    'region_id' => $row['region_id'] ?? null,
                    'code' => (string)$row['region_code'],
                    'name' => (string)$row['region_name'],
                    'dashboard_group' => $row['dashboard_group'] ?? null,
                ],
                'branches' => [],
            ];
        }
        if (!isset($regions[$regionKey]['branches'][$unitKey])) {
            $regions[$regionKey]['branches'][$unitKey] = [
                'unit_id' => $row['unit_id'] ?? null,
                'unit_code' => (string)$row['unit_code'],
                'name' => (string)$row['branch_name'],
                'cells' => [],
                'total' => ['population_count' => 0, 'attempted_count' => 0, 'completed_count' => 0, 'attempt_count' => 0, 'incomplete_attempt_count' => 0],
                'technicians' => [],
            ];
        }
        $branch =& $regions[$regionKey]['branches'][$unitKey];
        if (!isset($branch['cells'][$labId])) {
            $branch['cells'][$labId] = ['population_count' => 0, 'attempted_count' => 0, 'completed_count' => 0, 'attempt_count' => 0, 'incomplete_attempt_count' => 0];
        }
        $attempts = (int)$row['attempt_count'];
        $passes = (int)$row['pass_count'];
        $incompleteAttempts = (int)$row['incomplete_attempt_count'];
        $completed = in_array($row['completed'], [true, 1, '1', 't', 'true'], true);
        $branch['cells'][$labId]['attempted_count'] += $attempts > 0 ? 1 : 0;
        $branch['cells'][$labId]['completed_count'] += $completed ? 1 : 0;
        $branch['cells'][$labId]['attempt_count'] += $attempts;
        $branch['cells'][$labId]['incomplete_attempt_count'] += $incompleteAttempts;
        $branch['total']['attempted_count'] += $attempts > 0 ? 1 : 0;
        $branch['total']['completed_count'] += $completed ? 1 : 0;
        $branch['total']['attempt_count'] += $attempts;
        $branch['total']['incomplete_attempt_count'] += $incompleteAttempts;
        if (!isset($branch['technicians'][$personKey])) {
            $branch['technicians'][$personKey] = [
                'user_id' => $row['user_id'] ?? null,
                'employee_id' => (string)($row['employee_id'] ?? ''),
                'display_name' => (string)($row['display_name'] ?? ''),
                'email' => (string)($row['email'] ?? ''),
                'cells' => [],
                'total' => ['pass_count' => 0, 'attempt_count' => 0, 'incomplete_attempt_count' => 0],
            ];
        }
        $technician =& $branch['technicians'][$personKey];
        $technician['cells'][$labId] = [
            'pass_count' => $passes,
            'attempt_count' => $attempts,
            'incomplete_attempt_count' => $incompleteAttempts,
            'pass_rate' => $attempts ? round(100 * $passes / $attempts, 2) : null,
        ];
        $technician['total']['pass_count'] += $passes;
        $technician['total']['attempt_count'] += $attempts;
        $technician['total']['incomplete_attempt_count'] += $incompleteAttempts;
        unset($technician, $branch);
    }

    foreach ($regions as &$region) {
        foreach ($region['branches'] as &$branch) {
            foreach ($branch['cells'] as &$cell) {
                $cell['completion_rate'] = $cell['population_count']
                    ? round(100 * $cell['completed_count'] / $cell['population_count'], 2)
                    : null;
            }
            unset($cell);
            $branch['total']['completion_rate'] = $branch['total']['population_count']
                ? round(100 * $branch['total']['completed_count'] / $branch['total']['population_count'], 2)
                : null;
            foreach ($branch['technicians'] as &$technician) {
                $technician['total']['pass_rate'] = $technician['total']['attempt_count']
                    ? round(100 * $technician['total']['pass_count'] / $technician['total']['attempt_count'], 2)
                    : null;
            }
            unset($technician);
            $branch['technicians'] = array_values($branch['technicians']);
        }
        unset($branch);
        $region['branches'] = array_values($region['branches']);
    }
    unset($region);
    return ['regions' => array_values($regions)];
}

function dashboard_report_matrix(PDO $pdo, string $from, string $to, bool $includeBranchDrilldown = true): array
{
    // The branch drill-down already contains the complete region × branch × lab
    // population and outcome totals. Reuse it for the region matrix instead of
    // rebuilding the same active-roster cross product in a second large query.
    $branchDrilldown = dashboard_report_branch_drilldown($pdo, $from, $to);

    $catalogRows = $pdo->query(
        'SELECT device.device_id, device.device_name, device.sort_order AS device_sort_order,
                lab.lab_id, lab.lab_name, lab.sort_order AS lab_sort_order
           FROM device_catalog device
           JOIN lab_catalog lab ON lab.device_id = device.device_id
          WHERE device.is_active = TRUE AND lab.is_active = TRUE
          ORDER BY device.sort_order, device.device_id, lab.sort_order, lab.lab_id'
    )->fetchAll();
    $groups = [];
    $labMetadata = [];
    foreach ($catalogRows as $row) {
        $deviceId = (string)$row['device_id'];
        if (!isset($groups[$deviceId])) {
            $groups[$deviceId] = [
                'device' => ['device_id' => $deviceId, 'name' => (string)$row['device_name']],
                'labs' => [],
            ];
        }
        $groups[$deviceId]['labs'][] = [
            'lab_id' => (string)$row['lab_id'],
            'name' => (string)$row['lab_name'],
        ];
        $labMetadata[(string)$row['lab_id']] = $row;
    }

    $rowsByRegionLab = [];
    foreach (($branchDrilldown['regions'] ?? []) as $region) {
        $regionMeta = $region['region'] ?? [];
        foreach (($region['branches'] ?? []) as $branch) {
            foreach (($branch['cells'] ?? []) as $labId => $cell) {
                if (!isset($labMetadata[(string)$labId])) {
                    continue;
                }
                $catalog = $labMetadata[(string)$labId];
                $key = (string)($regionMeta['region_id'] ?? '') . '|'
                    . (string)($regionMeta['code'] ?? '') . '|'
                    . (string)$labId;
                if (!isset($rowsByRegionLab[$key])) {
                    $rowsByRegionLab[$key] = [
                        'region_id' => $regionMeta['region_id'] ?? null,
                        'region_code' => (string)($regionMeta['code'] ?? 'FTC'),
                        'region_name' => (string)($regionMeta['name'] ?? 'FTC'),
                        'dashboard_group' => $regionMeta['dashboard_group'] ?? null,
                        'branch_names' => [],
                        'device_id' => (string)$catalog['device_id'],
                        'device_name' => (string)$catalog['device_name'],
                        'device_sort_order' => (int)$catalog['device_sort_order'],
                        'lab_id' => (string)$catalog['lab_id'],
                        'lab_name' => (string)$catalog['lab_name'],
                        'lab_sort_order' => (int)$catalog['lab_sort_order'],
                        'population_count' => 0,
                        'attempted_count' => 0,
                        'completed_count' => 0,
                        'attempt_count' => 0,
                        'incomplete_attempt_count' => 0,
                    ];
                }
                $aggregate =& $rowsByRegionLab[$key];
                $branchName = trim((string)($branch['name'] ?? $branch['unit_code'] ?? ''));
                if ($branchName !== '') {
                    $aggregate['branch_names'][$branchName] = true;
                }
                foreach (['population_count', 'attempted_count', 'completed_count', 'attempt_count', 'incomplete_attempt_count'] as $metric) {
                    $aggregate[$metric] += (int)($cell[$metric] ?? 0);
                }
                unset($aggregate);
            }
        }
    }
    $rows = [];
    foreach ($rowsByRegionLab as $aggregate) {
        $branchNames = array_keys($aggregate['branch_names']);
        sort($branchNames, SORT_NATURAL | SORT_FLAG_CASE);
        unset($aggregate['branch_names']);
        $aggregate['branch_name'] = implode(', ', $branchNames);
        $aggregate['completion_rate'] = $aggregate['population_count']
            ? round(100 * $aggregate['completed_count'] / $aggregate['population_count'], 2)
            : null;
        $rows[] = $aggregate;
    }

    $regionRows = [];
    $grandCells = [];
    $grandTotal = ['population_count' => 0, 'attempted_count' => 0, 'completed_count' => 0, 'attempt_count' => 0, 'incomplete_attempt_count' => 0];
    foreach ($rows as $row) {
        $regionKey = (string)($row['region_id'] ?? '') . '|' . (string)$row['region_name'];
        if (!isset($regionRows[$regionKey])) {
            $regionRows[$regionKey] = [
                'region' => [
                    'region_id' => $row['region_id'] ?? null,
                    'code' => (string)$row['region_code'],
                    'name' => (string)$row['region_name'],
                    'dashboard_group' => $row['dashboard_group'] ?? null,
                    'branch_name' => $row['branch_name'] ?? null,
                ],
                'cells' => [],
                'total' => ['population_count' => 0, 'attempted_count' => 0, 'completed_count' => 0, 'attempt_count' => 0, 'incomplete_attempt_count' => 0],
            ];
        }
        $cell = [
            'population_count' => (int)$row['population_count'],
            'attempted_count' => (int)$row['attempted_count'],
            'completed_count' => (int)$row['completed_count'],
            'attempt_count' => (int)$row['attempt_count'],
            'incomplete_attempt_count' => (int)$row['incomplete_attempt_count'],
            'completion_rate' => $row['completion_rate'] === null ? null : (float)$row['completion_rate'],
        ];
        $labId = (string)$row['lab_id'];
        $regionRows[$regionKey]['cells'][$labId] = $cell;
        foreach (['population_count', 'attempted_count', 'completed_count', 'attempt_count', 'incomplete_attempt_count'] as $metric) {
            $regionRows[$regionKey]['total'][$metric] += $cell[$metric];
            $grandTotal[$metric] += $cell[$metric];
            $grandCells[$labId][$metric] = ($grandCells[$labId][$metric] ?? 0) + $cell[$metric];
        }
    }
    foreach ($regionRows as &$regionRow) {
        $population = $regionRow['total']['population_count'];
        $regionRow['total']['completion_rate'] = $population
            ? round(100 * $regionRow['total']['completed_count'] / $population, 2)
            : null;
    }
    unset($regionRow);
    foreach ($grandCells as &$cell) {
        $cell['completion_rate'] = $cell['population_count']
            ? round(100 * $cell['completed_count'] / $cell['population_count'], 2)
            : null;
    }
    unset($cell);
    $grandTotal['completion_rate'] = $grandTotal['population_count']
        ? round(100 * $grandTotal['completed_count'] / $grandTotal['population_count'], 2)
        : null;

    return [
        'device_groups' => array_values($groups),
        'rows' => array_values($regionRows),
        'branch_drilldown' => $includeBranchDrilldown ? $branchDrilldown : ['regions' => []],
        'grand_total' => ['cells' => $grandCells, 'total' => $grandTotal],
        'data_quality' => [
            'location_source' => 'current_roster',
            'scope' => 'all_active_technicians_x_active_labs',
            'incomplete_attempt_count' => (int)($grandTotal['incomplete_attempt_count'] ?? 0),
            'incomplete_attempt_policy' => 'completion_evidence_only_excluded_from_attempt_rates',
        ],
    ];
}

function dashboard_report_payload(PDO $pdo, array $query): array
{
    $cohort = trim((string)($query['cohort'] ?? 'assigned_as_of_period_end'));
    if ($cohort !== 'assigned_as_of_period_end') {
        throw new InvalidArgumentException('Unsupported dashboard report cohort.');
    }
    $today = new DateTimeImmutable('today');
    $defaultStart = $today->modify('first day of this month');
    $defaultEnd = $today;
    $from = dashboard_report_parse_date($query['from'] ?? null, $defaultStart);
    $to = dashboard_report_parse_date($query['to'] ?? null, $defaultEnd);
    if ($to < $from) {
        throw new InvalidArgumentException('Dashboard report end date must not be before start date.');
    }
    $previousEndDefault = $from->modify('-1 day');
    $periodLength = (int)$from->diff($to)->format('%a');
    $previousStartDefault = $previousEndDefault->modify('-' . $periodLength . ' days');
    $compareFrom = dashboard_report_parse_date($query['compare_from'] ?? null, $previousStartDefault);
    $compareTo = dashboard_report_parse_date($query['compare_to'] ?? null, $previousEndDefault);

    $includeBranchDrilldown = !array_key_exists('include_branch_drilldown', $query)
        || filter_var($query['include_branch_drilldown'], FILTER_VALIDATE_BOOLEAN);
    $current = dashboard_report_metric($pdo, $from->format('Y-m-d'), $to->format('Y-m-d'));
    $previous = dashboard_report_metric($pdo, $compareFrom->format('Y-m-d'), $compareTo->format('Y-m-d'));
    $lifetime = dashboard_report_metric($pdo, null, null);
    $monthly = dashboard_report_monthly($pdo, (int)$from->format('Y'));
    $matrix = dashboard_report_matrix(
        $pdo,
        $from->format('Y-m-d'),
        $to->format('Y-m-d'),
        $includeBranchDrilldown
    );

    return [
        'meta' => [
            'source' => 'database',
            'cohort' => 'assigned_as_of_period_end',
            'metric_semantics' => [
                'assigned_count' => 'KTV-lab assignments effective at the period end.',
                'attempt_metrics' => 'Practice and guide attempts by verified KTV accounts occurring inside the selected period.',
                'completion_metrics' => 'Cumulative passed KTV-lab assignments through the period end.',
                'pass_rate' => 'Passed practice attempts divided by graded practice attempts with complete attempt evidence in the selected period.',
                'first_try_rate' => 'Passed assignments whose first recorded passing attempt is attempt 1, divided by passed assignments with reliable attempt-number evidence.',
                'region_matrix' => 'All active technicians in the current region roster are in scope for every active lab; sessions do not require an assignment.',
            ],
            'data_quality' => $matrix['data_quality'] ?? [],
            'includes_branch_drilldown' => $includeBranchDrilldown,
            'period' => [
                'from' => $from->format('Y-m-d'),
                'to' => $to->format('Y-m-d'),
                'label' => $from->format('d/m/Y') . ' – ' . $to->format('d/m/Y'),
            ],
            'generated_at' => (new DateTimeImmutable())->format(DATE_ATOM),
        ],
        'summary' => ['current' => $current, 'previous' => $previous, 'lifetime' => $lifetime],
        'monthly' => $monthly,
        'matrix' => $matrix,
    ];
}
