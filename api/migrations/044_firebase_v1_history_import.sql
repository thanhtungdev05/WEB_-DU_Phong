-- 044: Auditable, idempotent staging for the Firebase v1 history import.
--
-- Firebase v1 only persisted successful completions. It did not persist failed
-- attempts, so imported practice rows are passed but have incomplete attempt
-- sequence evidence and must never be used for first-try statistics.

ALTER TABLE timer_sessions
    ADD COLUMN IF NOT EXISTS attempt_sequence_complete BOOLEAN NOT NULL DEFAULT TRUE;

COMMENT ON COLUMN timer_sessions.attempt_sequence_complete IS
    'TRUE only when all attempts needed to derive first-try success are known. Firebase v1 rows are FALSE.';

CREATE TABLE IF NOT EXISTS firebase_legacy_import_batches (
    batch_key VARCHAR(100) PRIMARY KEY,
    source_project_hash CHAR(64) NOT NULL,
    source_counts JSONB NOT NULL DEFAULT '{}'::jsonb,
    staged_count INTEGER NOT NULL DEFAULT 0,
    imported_count INTEGER NOT NULL DEFAULT 0,
    quarantined_count INTEGER NOT NULL DEFAULT 0,
    skipped_count INTEGER NOT NULL DEFAULT 0,
    status VARCHAR(20) NOT NULL DEFAULT 'staged',
    manifest_sha256 CHAR(64),
    summary JSONB NOT NULL DEFAULT '{}'::jsonb,
    started_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    completed_at TIMESTAMPTZ,
    CONSTRAINT firebase_legacy_import_batches_status_check
        CHECK (status IN ('staged', 'committed', 'failed')),
    CONSTRAINT firebase_legacy_import_batches_counts_check
        CHECK (
            staged_count >= 0
            AND imported_count >= 0
            AND quarantined_count >= 0
            AND skipped_count >= 0
        )
);

CREATE TABLE IF NOT EXISTS firebase_legacy_import_events (
    event_id BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    batch_key VARCHAR(100) NOT NULL,
    source_collection VARCHAR(80) NOT NULL,
    source_document_id VARCHAR(240) NOT NULL,
    source_key VARCHAR(320) NOT NULL,
    source_payload JSONB NOT NULL,
    source_payload_sha256 CHAR(64) NOT NULL,
    normalized_email VARCHAR(254),
    event_at TIMESTAMPTZ,
    matched_user_id UUID,
    account_group VARCHAR(30) NOT NULL DEFAULT 'NOT_APPLICABLE',
    resolution_status VARCHAR(20) NOT NULL DEFAULT 'staged',
    resolution_reason TEXT,
    timer_session_id BIGINT,
    staged_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    imported_at TIMESTAMPTZ,
    CONSTRAINT firebase_legacy_import_events_batch_fkey
        FOREIGN KEY (batch_key) REFERENCES firebase_legacy_import_batches(batch_key) ON DELETE RESTRICT,
    CONSTRAINT firebase_legacy_import_events_user_fkey
        FOREIGN KEY (matched_user_id) REFERENCES users(user_id) ON DELETE RESTRICT,
    CONSTRAINT firebase_legacy_import_events_timer_fkey
        FOREIGN KEY (timer_session_id) REFERENCES timer_sessions(id) ON DELETE RESTRICT,
    CONSTRAINT firebase_legacy_import_events_source_unique UNIQUE (source_key),
    CONSTRAINT firebase_legacy_import_events_document_unique
        UNIQUE (source_collection, source_document_id),
    CONSTRAINT firebase_legacy_import_events_account_group_check
        CHECK (account_group IN ('KTV', 'FTC_TEST', 'FTC_UNASSIGNED', 'NOT_APPLICABLE')),
    CONSTRAINT firebase_legacy_import_events_resolution_check
        CHECK (resolution_status IN ('staged', 'imported', 'quarantined', 'skipped'))
);

CREATE INDEX IF NOT EXISTS idx_firebase_legacy_events_batch_status
    ON firebase_legacy_import_events (batch_key, resolution_status);
CREATE INDEX IF NOT EXISTS idx_firebase_legacy_events_email
    ON firebase_legacy_import_events (LOWER(normalized_email))
    WHERE normalized_email IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_firebase_legacy_events_timer
    ON firebase_legacy_import_events (timer_session_id)
    WHERE timer_session_id IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_timer_sessions_sequence_evidence
    ON timer_sessions (attempt_sequence_complete, mode, is_passed)
    WHERE mode IN ('Thực hành', 'practice');

COMMENT ON TABLE firebase_legacy_import_events IS
    'Immutable source snapshots and reconciliation state for the one-time Firebase v1 import.';
COMMENT ON COLUMN firebase_legacy_import_events.source_payload IS
    'Original Firestore document fields only; credentials and OAuth tokens are never stored.';
