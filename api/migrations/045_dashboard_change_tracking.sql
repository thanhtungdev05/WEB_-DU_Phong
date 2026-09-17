-- 045: Make dashboard invalidation and KTV location propagation database-safe.
--
-- Normal application writes already maintain these timestamps/snapshots. These
-- triggers also cover Django Admin, reconciliation jobs, and controlled SQL
-- maintenance so a successful data correction cannot leave dashboard views stale.

CREATE OR REPLACE FUNCTION dashboard_touch_updated_at()
RETURNS trigger
LANGUAGE plpgsql
AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$;

ALTER TABLE timer_sessions
    ADD COLUMN IF NOT EXISTS updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW();

DROP TRIGGER IF EXISTS trg_timer_sessions_touch_updated_at ON timer_sessions;
CREATE TRIGGER trg_timer_sessions_touch_updated_at
BEFORE UPDATE ON timer_sessions
FOR EACH ROW EXECUTE FUNCTION dashboard_touch_updated_at();

ALTER TABLE firebase_legacy_import_events
    ADD COLUMN IF NOT EXISTS updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW();

DROP TRIGGER IF EXISTS trg_firebase_legacy_events_touch_updated_at ON firebase_legacy_import_events;
CREATE TRIGGER trg_firebase_legacy_events_touch_updated_at
BEFORE UPDATE ON firebase_legacy_import_events
FOR EACH ROW EXECUTE FUNCTION dashboard_touch_updated_at();

DROP TRIGGER IF EXISTS trg_org_units_touch_updated_at ON org_units;
CREATE TRIGGER trg_org_units_touch_updated_at
BEFORE UPDATE ON org_units
FOR EACH ROW EXECUTE FUNCTION dashboard_touch_updated_at();

CREATE OR REPLACE FUNCTION dashboard_sync_user_assignment_location()
RETURNS trigger
LANGUAGE plpgsql
AS $$
DECLARE
    target_region_id UUID;
BEGIN
    SELECT unit.region_id
      INTO target_region_id
      FROM org_units unit
     WHERE unit.unit_id = NEW.unit_id;

    UPDATE lab_assignments assignment
       SET unit_id_snapshot = NEW.unit_id,
           region_id_snapshot = target_region_id,
           updated_at = NOW()
      FROM class_enrollments enrollment
     WHERE enrollment.enrollment_id = assignment.enrollment_id
       AND enrollment.user_id = NEW.user_id
       AND (
           assignment.unit_id_snapshot IS DISTINCT FROM NEW.unit_id
           OR assignment.region_id_snapshot IS DISTINCT FROM target_region_id
       );
    RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_users_sync_assignment_location ON users;
CREATE TRIGGER trg_users_sync_assignment_location
AFTER UPDATE OF unit_id ON users
FOR EACH ROW
WHEN (OLD.unit_id IS DISTINCT FROM NEW.unit_id)
EXECUTE FUNCTION dashboard_sync_user_assignment_location();

CREATE OR REPLACE FUNCTION dashboard_sync_org_unit_region()
RETURNS trigger
LANGUAGE plpgsql
AS $$
BEGIN
    UPDATE users roster
       SET region_id = NEW.region_id,
           region_code = region.region_code,
           dashboard_region = COALESCE(region.dashboard_group, region.region_name),
           updated_at = NOW()
      FROM regions region
     WHERE region.region_id = NEW.region_id
       AND roster.unit_id = NEW.unit_id
       AND (
           roster.region_id IS DISTINCT FROM NEW.region_id
           OR roster.region_code IS DISTINCT FROM region.region_code
           OR roster.dashboard_region IS DISTINCT FROM COALESCE(region.dashboard_group, region.region_name)
       );

    UPDATE lab_assignments
       SET region_id_snapshot = NEW.region_id,
           updated_at = NOW()
     WHERE unit_id_snapshot = NEW.unit_id
       AND region_id_snapshot IS DISTINCT FROM NEW.region_id;
    RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_org_units_sync_region ON org_units;
CREATE TRIGGER trg_org_units_sync_region
AFTER UPDATE OF region_id ON org_units
FOR EACH ROW
WHEN (OLD.region_id IS DISTINCT FROM NEW.region_id)
EXECUTE FUNCTION dashboard_sync_org_unit_region();

COMMENT ON FUNCTION dashboard_sync_user_assignment_location() IS
    'Keeps assignment location snapshots aligned when a KTV current unit changes outside the roster APIs.';
COMMENT ON FUNCTION dashboard_sync_org_unit_region() IS
    'Propagates an organization unit region change to current users and assignment location snapshots.';
