import unittest
from pathlib import Path


ROOT = Path(__file__).resolve().parents[1]


class FirebaseV1ImportContractTests(unittest.TestCase):
    @classmethod
    def setUpClass(cls):
        cls.importer = (ROOT / "api" / "import_firebase_v1.php").read_text(encoding="utf-8")
        cls.migration = (ROOT / "api" / "migrations" / "044_firebase_v1_history_import.sql").read_text(encoding="utf-8")
        cls.report = (ROOT / "api" / "lib" / "dashboard_report.php").read_text(encoding="utf-8")
        cls.api = (ROOT / "api" / "index.php").read_text(encoding="utf-8")
        cls.dashboard = (ROOT / "dashboard-authen" / "js" / "app.js").read_text(encoding="utf-8")
        cls.reconciler = (ROOT / "api" / "reconcile_firebase_v1.php").read_text(encoding="utf-8")

    def test_credentials_are_excluded_from_git_and_docker(self):
        self.assertIn("firebase-credentials/", (ROOT / ".gitignore").read_text(encoding="utf-8"))
        self.assertIn("firebase-credentials/", (ROOT / ".dockerignore").read_text(encoding="utf-8"))

    def test_import_is_atomic_auditable_and_idempotent(self):
        for contract in (
            "firebase_legacy_import_batches",
            "firebase_legacy_import_events",
            "source_payload_sha256",
            "manifest_sha256",
            "UNIQUE (source_key)",
            "UNIQUE (source_collection, source_document_id)",
            "pg_advisory_xact_lock",
            "LOCK TABLE timer_sessions IN SHARE ROW EXCLUSIVE MODE",
            "ON CONFLICT (seed_key)",
            "firebase_v1_timer_seed_key",
            "if ($options['commit'])",
            "$pdo->rollBack()",
            "This batch is already committed",
        ):
            self.assertIn(contract, self.migration + self.importer)
        self.assertIn("return 'firebase-v1:' . hash('sha256', $sourceKey);", self.importer)

    def test_import_does_not_create_users_or_grant_roles(self):
        self.assertNotIn("INSERT INTO users", self.importer)
        self.assertNotIn("UPDATE users", self.importer)
        self.assertIn("$role === 'KTV'", self.importer)
        self.assertIn("FTC_TEST", self.importer)
        self.assertIn("FTC_UNASSIGNED", self.importer)

    def test_legacy_results_are_passed_but_first_try_is_unknown(self):
        self.assertIn("attempt_sequence_complete BOOLEAN NOT NULL DEFAULT TRUE", self.migration)
        self.assertIn("attempt_sequence_complete, created_at", self.importer)
        self.assertIn("row.seed_key, FALSE, row.created_at", self.importer)
        self.assertIn("$activity['mode'] === 'practice' ? 1 : null", self.importer)
        self.assertIn("'completed', NULL, row.practice_attempt_no", self.importer)
        self.assertIn("attempt_sequence_complete IS TRUE", self.report)

    def test_large_import_is_batched(self):
        self.assertGreaterEqual(self.importer.count("jsonb_to_recordset"), 3)
        self.assertIn("array_chunk($insertRows, 500)", self.importer)
        self.assertIn("array_chunk($resolutionRows, 500)", self.importer)

    def test_vietnamese_normalization_does_not_require_intl(self):
        self.assertIn("'đ' => 'd'", self.importer)
        self.assertIn("'ư' => 'u'", self.importer)
        self.assertIn("^hoan thanh lab co huong dan", self.importer)

    def test_reconciliation_is_atomic_and_preserves_first_try_unknown(self):
        self.assertIn("pg_advisory_xact_lock", self.reconciler)
        self.assertIn("$pdo->beginTransaction()", self.reconciler)
        self.assertIn("$pdo->rollBack()", self.reconciler)
        self.assertIn("completed_first_try = NULL", self.reconciler)
        self.assertIn("attempt_sequence_complete = FALSE", self.reconciler)
        self.assertIn("SET practice_attempt_no = NULL WHERE seed_batch = :batch", self.reconciler)

    def test_unmapped_catalog_is_preserved_as_inactive_history(self):
        self.assertIn("FSV1_DEV_", self.importer)
        self.assertIn("FSV1_LAB_", self.importer)
        self.assertIn("FALSE, NOW(), NOW()", self.importer)
        self.assertGreaterEqual(self.importer.count("ON CONFLICT"), 4)

    def test_dashboard_uses_ftc_for_test_and_unassigned_accounts(self):
        self.assertIn("firebase_ftc_people AS", self.report)
        self.assertIn("'FTC'::varchar AS region_name", self.report)
        self.assertIn("timer.seed_batch LIKE 'firebase-v1-%'", self.report)
        self.assertIn("$firebaseFtcRows", self.api)
        self.assertIn("'dashboard_region' => 'FTC'", self.api)
        self.assertNotIn("Chưa phân vùng", self.dashboard)

    def test_overview_attempt_metrics_include_historical_catalog(self):
        self.assertIn("all_valid_sessions AS", self.report)
        self.assertIn("FROM all_valid_sessions session", self.report)
        self.assertIn("FROM all_valid_sessions numbered", self.report)


if __name__ == "__main__":
    unittest.main()
