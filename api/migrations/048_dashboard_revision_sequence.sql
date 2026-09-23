-- 048: Avoid a hot-row lock when many KTV sessions update concurrently.
--
-- A PostgreSQL sequence is safe and cheap under concurrency. A rolled-back
-- transaction may still advance it, which can cause one harmless dashboard
-- refresh but cannot make the dashboard stale.

CREATE SEQUENCE IF NOT EXISTS dashboard_revision_seq AS BIGINT;

SELECT setval(
    'dashboard_revision_seq',
    GREATEST(COALESCE((SELECT revision FROM dashboard_revision WHERE singleton = TRUE), 1), 1),
    TRUE
);

CREATE OR REPLACE FUNCTION bump_dashboard_revision()
RETURNS trigger
LANGUAGE plpgsql
AS $$
BEGIN
    PERFORM nextval('dashboard_revision_seq');
    RETURN NULL;
END;
$$;

COMMENT ON SEQUENCE dashboard_revision_seq IS
    'Lock-light change token used by dashboard polling.';
