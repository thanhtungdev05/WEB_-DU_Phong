-- 050: Support server-side KTV summaries and cursor-paginated history.
-- Indexes only; no persisted rows are rewritten.

CREATE INDEX IF NOT EXISTS idx_timer_sessions_dashboard_time
    ON timer_sessions (
        COALESCE(started_at, finished_at, created_at) DESC,
        id DESC
    )
    WHERE NOT COALESCE(is_mock, FALSE)
      AND status IN ('completed', 'failed');

CREATE INDEX IF NOT EXISTS idx_timer_sessions_dashboard_user_time
    ON timer_sessions (
        user_id,
        COALESCE(started_at, finished_at, created_at) DESC,
        id DESC
    )
    WHERE user_id IS NOT NULL
      AND NOT COALESCE(is_mock, FALSE)
      AND status IN ('completed', 'failed');

CREATE INDEX IF NOT EXISTS idx_timer_sessions_dashboard_email_time
    ON timer_sessions (
        LOWER(email),
        COALESCE(started_at, finished_at, created_at) DESC,
        id DESC
    )
    WHERE user_id IS NULL
      AND NULLIF(email, '') IS NOT NULL
      AND NOT COALESCE(is_mock, FALSE)
      AND status IN ('completed', 'failed');

CREATE INDEX IF NOT EXISTS idx_timer_sessions_dashboard_employee_time
    ON timer_sessions (
        technician_id,
        COALESCE(started_at, finished_at, created_at) DESC,
        id DESC
    )
    WHERE user_id IS NULL
      AND NULLIF(email, '') IS NULL
      AND NULLIF(technician_id, '') IS NOT NULL
      AND NOT COALESCE(is_mock, FALSE)
      AND status IN ('completed', 'failed');
