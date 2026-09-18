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
            "function synchronizePortalCatalog(catalogDevices)",
            "const labName = String(lab.lab_name || '').trim()",
            "_catalogLabNames.set(labId, labName)",
            "lesson.title = catalogName",
            "new Set(synchronizePortalCatalog(catalogDevices).keys())",
        ):
            self.assertIn(contract, self.portal_js)

    def test_portal_and_report_share_the_database_catalog_contract(self):
        self.assertIn("lab.lab_id, lab.lab_name", self.catalog_api)
        self.assertIn("lab.lab_id, lab.lab_name", self.dashboard_report)
        self.assertIn("app.js?v=20260918160000", self.portal)

    def test_catalog_failure_is_closed_and_retryable(self):
        self.assertIn("_catalogDeviceIds = new Set()", self.portal_js)
        self.assertIn("populateDeviceDropdown([])", self.portal_js)
        self.assertIn("retry.textContent = 'Thử lại'", self.portal_js)
        self.assertNotIn("populateDeviceDropdown(DEVICES)", self.portal_js)

    def test_database_catalog_controls_device_names_and_order(self):
        self.assertIn("catalogDevices.forEach(function (catalogDevice)", self.portal_js)
        self.assertIn("device.name = catalogName", self.portal_js)
        self.assertIn("visibleDevices.push(device)", self.portal_js)
        self.assertIn("_catalogLabOrder", self.portal_js)

    def test_portal_loads_module_for_every_active_catalog_device(self):
        active_devices = re.findall(
            r"^\s*\('(DEV_[^']+)',\s*'[^']+',\s*'[^']+',\s*\d+,\s*TRUE\)",
            self.catalog_migration,
            re.MULTILINE,
        )
        self.assertEqual(len(active_devices), 10)
        for device_id in active_devices:
            folder = device_id.replace("DEV_", "").lower()
            folder = folder.replace("ax3000cv2", "ax3000c")
            folder = folder.replace("ac1000hi", "ac1000HI")
            folder = folder.replace("ont_be6500c", "ONT_be6500c")
            self.assertIn(f'<script src="devices/{folder}/data.js', self.portal)

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
