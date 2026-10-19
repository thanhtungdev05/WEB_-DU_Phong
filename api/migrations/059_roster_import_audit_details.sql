-- 059: Record exact KTV roster changes and failed import reasons.

ALTER TABLE roster_import_log
    ADD COLUMN IF NOT EXISTS unchanged INT NOT NULL DEFAULT 0,
    ADD COLUMN IF NOT EXISTS status VARCHAR(20) NOT NULL DEFAULT 'success',
    ADD COLUMN IF NOT EXISTS change_details JSONB NOT NULL DEFAULT '{}'::jsonb;

DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1
          FROM pg_constraint
         WHERE conname = 'chk_roster_import_log_status'
           AND conrelid = 'roster_import_log'::regclass
    ) THEN
        ALTER TABLE roster_import_log
            ADD CONSTRAINT chk_roster_import_log_status
            CHECK (status IN ('success', 'failed'));
    END IF;
END
$$;

CREATE INDEX IF NOT EXISTS idx_roster_import_log_status_imported_at
    ON roster_import_log (status, imported_at DESC);
