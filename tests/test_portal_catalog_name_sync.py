import re
import unittest
from pathlib import Path


ROOT = Path(__file__).resolve().parents[1]


class PortalCatalogNameSyncContractTests(unittest.TestCase):
    @classmethod
    def setUpClass(cls):
        cls.portal = (ROOT / "portal.html").read_text(encoding="utf-8")
        cls.portal_js = (ROOT / "app.js").read_text(encoding="utf-8")
        cls.catalog_api = (ROOT / "api" / "lib" / "training_classes.php").read_text(encoding="utf-8")
        cls.dashboard_report = (ROOT / "api" / "lib" / "dashboard_report.php").read_text(encoding="utf-8")
        cls.catalog_migration = (ROOT / "api" / "migrations" / "043_sync_portal_lab_catalog.sql").read_text(encoding="utf-8")

    def test_portal_uses_catalog_lab_name_for_every_matching_lesson(self):
        for contract in (
            "function synchronizePortalLessonNames(catalogDevices)",
            "const labName = String(lab.lab_name || '').trim()",
            "_catalogLabNames.set(labId, labName)",
            "lesson.title = catalogName",
            "new Set(synchronizePortalLessonNames(catalogDevices).keys())",
        ):
            self.assertIn(contract, self.portal_js)

    def test_portal_and_report_share_the_database_catalog_contract(self):
        self.assertIn("lab.lab_id, lab.lab_name", self.catalog_api)
        self.assertIn("lab.lab_id, lab.lab_name", self.dashboard_report)
        self.assertIn("app.js?v=20260916-practice-submit-fix", self.portal)

    def test_offline_fallback_does_not_reuse_stale_catalog_names(self):
        self.assertIn("_catalogLabNames = null", self.portal_js)

    def test_catalog_migration_preserves_history_and_activates_only_portal_labs(self):
        active_lab_ids = re.findall(r"^\s*\('([^']+)',\s*'DEV_[^']+',\s*'[^']+',\s*\d+,\s*TRUE\)", self.catalog_migration, re.MULTILINE)
        self.assertEqual(len(active_lab_ids), 55)
        self.assertEqual(len(set(active_lab_ids)), 55)
        self.assertIn("UPDATE lab_catalog\n   SET is_active = FALSE", self.catalog_migration)
        self.assertNotIn("DELETE FROM LAB_CATALOG", self.catalog_migration.upper())
        self.assertNotIn("DELETE FROM TIMER_SESSIONS", self.catalog_migration.upper())
        self.assertIn("Bài 2 - Cấu hình mạng Wi-Fi (Gộp sóng Band Steering)", self.catalog_migration)
        self.assertIn("Bài 2 - Cấu hình Wi-Fi MLO (Wi-Fi 7)", self.catalog_migration)


if __name__ == "__main__":
    unittest.main()
