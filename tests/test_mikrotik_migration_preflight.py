from pathlib import Path
import unittest


ROOT = Path(__file__).resolve().parents[1]


class MikroTikMigrationPreflightTests(unittest.TestCase):
    def test_legacy_name_collision_is_reconciled_before_049(self):
        migration = (
            ROOT
            / "api"
            / "migrations"
            / "048a_prepare_mikrotik_hexs_catalog.sql"
        ).read_text(encoding="utf-8")

        self.assertIn("device_id <> 'DEV_MIKROTIK_HEXS'", migration)
        self.assertIn("device_name = 'Router MikroTik'", migration)
        self.assertIn("is_active = FALSE", migration)
        self.assertIn("legacy", migration)


if __name__ == "__main__":
    unittest.main()
