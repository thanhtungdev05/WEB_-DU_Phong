-- 047: Keep dashboard invalidation cheap enough for Neon free-plan operation.
--
-- The previous /dashboard/version query scanned MAX/COUNT across every
-- dashboard table on every browser poll. A singleton revision makes the poll a
-- one-row indexed read. Statement-level triggers bump it after committed data
-- changes; rolled-back writes roll the bump back as well.

CREATE TABLE IF NOT EXISTS dashboard_revision (
    singleton BOOLEAN PRIMARY KEY DEFAULT TRUE CHECK (singleton),
    revision BIGINT NOT NULL DEFAULT 1,
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

INSERT INTO dashboard_revision (singleton, revision, updated_at)
VALUES (TRUE, 1, NOW())
ON CONFLICT (singleton) DO NOTHING;

CREATE OR REPLACE FUNCTION bump_dashboard_revision()
RETURNS trigger
LANGUAGE plpgsql
AS $$
BEGIN
    INSERT INTO dashboard_revision (singleton, revision, updated_at)
    VALUES (TRUE, 1, NOW())
    ON CONFLICT (singleton) DO UPDATE
       SET revision = dashboard_revision.revision + 1,
           updated_at = NOW();
    RETURN NULL;
END;
$$;

DO $$
DECLARE
    table_name TEXT;
BEGIN
    FOREACH table_name IN ARRAY ARRAY[
        'users',
        'timer_sessions',
        'firebase_legacy_import_events',
        'regions',
        'org_units',
        'device_catalog',
        'lab_catalog',
        'training_classes',
        'class_enrollments',
        'class_lab_assignments',
        'lab_assignments',
        'timer_session_assignment_links'
    ]
    LOOP
        EXECUTE format('DROP TRIGGER IF EXISTS trg_dashboard_revision ON %I', table_name);
        EXECUTE format(
            'CREATE TRIGGER trg_dashboard_revision AFTER INSERT OR UPDATE OR DELETE ON %I FOR EACH STATEMENT EXECUTE FUNCTION bump_dashboard_revision()',
            table_name
        );
    END LOOP;
END;
$$;

COMMENT ON TABLE dashboard_revision IS
    'Singleton change token used by dashboard polling without scanning operational tables.';
