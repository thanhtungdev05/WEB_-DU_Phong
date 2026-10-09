import hashlib
import unittest
from pathlib import Path


ROOT = Path(__file__).resolve().parents[1]
MIGRATIONS = ROOT / "api" / "migrations"


class MigrationImmutabilityTests(unittest.TestCase):
    def test_ap_be1500_migration_keeps_production_checksum(self):
        migration = MIGRATIONS / "054_rename_be15000_to_ap_be1500.sql"
        normalized = migration.read_text(encoding="utf-8").replace("\r\n", "\n").replace("\r", "\n")
        checksum = hashlib.sha256(normalized.encode("utf-8")).hexdigest()
        self.assertEqual(
            checksum,
            "499bbc5b5237ea48c3ae0318166709917c93826c27b50207ffb59d8087255a4a",
        )

    def test_ap_be15000_correction_is_forward_only(self):
        correction = MIGRATIONS / "057_correct_ap_be15000_display_name.sql"
        sql = correction.read_text(encoding="utf-8")
        self.assertIn("device_name = 'AP BE15000'", sql)
        self.assertIn("model = 'BE15000'", sql)
        self.assertIn("lab_name = 'Xem thiết bị AP BE15000'", sql)
        self.assertNotIn("schema_migrations", sql.lower())
        self.assertNotRegex(sql, r"(?i)\b(delete|drop|truncate)\b")

    def test_standardize_device_display_names_is_forward_only(self):
        correction = MIGRATIONS / "058_standardize_device_display_names.sql"
        sql = correction.read_text(encoding="utf-8")
        self.assertIn("device_name = 'ONT AX3000S'", sql)
        self.assertIn("device_name = 'ONT AC1000C V2'", sql)
        self.assertIn("device_name = 'ONT BE1200Z'", sql)
        self.assertIn("device_name = 'AP BE1500Z'", sql)
        self.assertIn("lab_name = 'Xem thiết bị AP BE1500Z'", sql)
        self.assertNotIn("schema_migrations", sql.lower())
        self.assertNotRegex(sql, r"(?i)\b(delete|drop|truncate)\b")


if __name__ == "__main__":
    unittest.main()
