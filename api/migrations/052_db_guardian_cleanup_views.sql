-- 052: DB Guardian — Tự động dọn dẹp session/log và bảo vệ Neon storage.
--
-- Tạo:
--   1. Function cleanup_expired_sessions() — xoá session/log hết hạn
--   2. View v_db_storage_report — dễ query kích thước DB
--   3. Index hỗ trợ cleanup nhanh trên app_sessions.expires_at (đã có từ migration 002)
--
-- Lưu ý: pg_cron KHÔNG khả dụng trên Neon Free Plan.
--   Thay vào đó, db_guardian.py trong run_all.py đảm nhiệm việc cleanup định kỳ.
--   Migration này chỉ tạo function/view để tái sử dụng thuận tiện.

-- ── 1. Function cleanup tổng hợp ──────────────────────────────────────────────
CREATE OR REPLACE FUNCTION cleanup_expired_sessions(
    p_login_log_retention_days INTEGER DEFAULT 90
)
RETURNS TABLE (
    php_sessions_deleted   BIGINT,
    django_sessions_deleted BIGINT,
    login_logs_deleted     BIGINT,
    db_size_mb             NUMERIC
)
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    v_php    BIGINT := 0;
    v_django BIGINT := 0;
    v_logs   BIGINT := 0;
BEGIN
    -- Xoá PHP app_sessions hết hạn
    IF EXISTS (
        SELECT 1 FROM information_schema.tables
        WHERE table_schema = 'public' AND table_name = 'app_sessions'
    ) THEN
        DELETE FROM app_sessions WHERE expires_at < NOW();
        GET DIAGNOSTICS v_php = ROW_COUNT;
    END IF;

    -- Xoá Django sessions hết hạn
    IF EXISTS (
        SELECT 1 FROM information_schema.tables
        WHERE table_schema = 'public' AND table_name = 'django_session'
    ) THEN
        DELETE FROM django_session WHERE expire_date < NOW();
        GET DIAGNOSTICS v_django = ROW_COUNT;
    END IF;

    -- Xoá login_logs cũ hơn retention period
    IF EXISTS (
        SELECT 1 FROM information_schema.tables
        WHERE table_schema = 'public' AND table_name = 'login_logs'
    ) THEN
        DELETE FROM login_logs
        WHERE created_at < NOW() - (p_login_log_retention_days || ' days')::INTERVAL;
        GET DIAGNOSTICS v_logs = ROW_COUNT;
    END IF;

    RETURN QUERY
    SELECT
        v_php,
        v_django,
        v_logs,
        ROUND(pg_database_size(current_database()) / 1024.0 / 1024.0, 2);
END;
$$;

COMMENT ON FUNCTION cleanup_expired_sessions(INTEGER) IS
    'Xoá session/log hết hạn và trả về số lượng đã xoá + kích thước DB hiện tại (MB). '
    'Gọi thủ công: SELECT * FROM cleanup_expired_sessions(); '
    'Hoặc tự động qua db_guardian.py chạy mỗi 6 giờ.';

-- ── 2. View báo cáo storage ────────────────────────────────────────────────────
CREATE OR REPLACE VIEW v_db_storage_report AS
SELECT
    pg_database_size(current_database()) / 1024.0 / 1024.0  AS db_size_mb,
    512.0                                                     AS neon_free_limit_mb,
    ROUND(
        pg_database_size(current_database()) / 1024.0 / 1024.0
        / 512.0 * 100.0,
        1
    )                                                         AS usage_pct,
    CASE
        WHEN pg_database_size(current_database()) / 1024.0 / 1024.0 > 471  THEN 'CRITICAL (>92%)'
        WHEN pg_database_size(current_database()) / 1024.0 / 1024.0 > 409  THEN 'WARNING (>80%)'
        ELSE 'OK'
    END                                                       AS status,
    (SELECT COUNT(*) FROM information_schema.tables
     WHERE table_schema = 'public')                           AS public_table_count,
    NOW()                                                     AS checked_at;

COMMENT ON VIEW v_db_storage_report IS
    'Báo cáo nhanh storage Neon. Query: SELECT * FROM v_db_storage_report;';

-- ── 3. View kích thước từng bảng ──────────────────────────────────────────────
CREATE OR REPLACE VIEW v_table_sizes AS
SELECT
    schemaname                                                    AS schema,
    tablename                                                     AS table_name,
    pg_size_pretty(pg_total_relation_size(schemaname||'.'||tablename)) AS total_size,
    pg_size_pretty(pg_relation_size(schemaname||'.'||tablename))       AS data_size,
    pg_size_pretty(
        pg_total_relation_size(schemaname||'.'||tablename)
        - pg_relation_size(schemaname||'.'||tablename)
    )                                                             AS index_size,
    pg_total_relation_size(schemaname||'.'||tablename)            AS size_bytes
FROM pg_tables
WHERE schemaname IN ('public')
ORDER BY size_bytes DESC;

COMMENT ON VIEW v_table_sizes IS
    'Kích thước từng bảng, sắp xếp từ lớn đến nhỏ. '
    'Query: SELECT * FROM v_table_sizes LIMIT 10;';

-- ── 4. Đảm bảo index exists trên expires_at (tăng tốc DELETE) ─────────────────
CREATE INDEX IF NOT EXISTS idx_app_sessions_expires_at
    ON app_sessions (expires_at);

-- ── 5. Ghi nhận vào migration ledger ──────────────────────────────────────────
-- (migration ledger sẽ tự cập nhật qua migrate.php nếu có)
