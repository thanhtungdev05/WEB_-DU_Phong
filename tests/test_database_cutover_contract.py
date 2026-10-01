import pathlib
import subprocess
import unittest

ROOT = pathlib.Path(__file__).resolve().parents[1]


class DatabaseCutoverContractTests(unittest.TestCase):
    def run_php(self, expression: str) -> subprocess.CompletedProcess[str]:
        return subprocess.run(
            ["php", "-r", expression],
            cwd=ROOT,
            text=True,
            capture_output=True,
            check=False,
        )

    def test_php_selection_defaults_to_primary_and_accepts_fallback(self):
        runtime = (ROOT / "api" / "lib" / "runtime.php").as_posix()
        primary = self.run_php(
            f"require '{runtime}'; putenv('DATABASE_ACTIVE'); echo configured_active_database_tier();"
        )
        fallback = self.run_php(
            f"require '{runtime}'; putenv('DATABASE_ACTIVE=fallback'); echo configured_active_database_tier();"
        )
        self.assertEqual(primary.returncode, 0, primary.stderr)
        self.assertEqual(primary.stdout, "primary")
        self.assertEqual(fallback.returncode, 0, fallback.stderr)
        self.assertEqual(fallback.stdout, "fallback")

    def test_php_rejects_invalid_selection(self):
        runtime = (ROOT / "api" / "lib" / "runtime.php").as_posix()
        result = self.run_php(
            f"require '{runtime}'; putenv('DATABASE_ACTIVE=automatic'); configured_active_database_tier();"
        )
        self.assertNotEqual(result.returncode, 0)
        self.assertIn("DATABASE_ACTIVE must be either primary or fallback", result.stderr)

    def test_django_does_not_probe_or_automatically_switch(self):
        settings = (ROOT / "admin_app" / "admin_site" / "settings.py").read_text(encoding="utf-8")
        self.assertIn("DATABASE_ACTIVE", settings)
        self.assertNotIn("psycopg.connect", settings)
        self.assertIn("DATABASE_ACTIVE=fallback requires FALLBACK_DATABASE_URL", settings)

    def test_widget_has_no_fabricated_production_values(self):
        html = (ROOT / "dashboard-authen" / "index.html").read_text(encoding="utf-8")
        self.assertNotIn("15.98 MB", html)
        self.assertNotIn("Auto-failover", html)
        self.assertNotIn("PHP: 5", html)
        self.assertIn("Chuyển đổi có kiểm soát", html)

    def test_example_and_runbook_document_controlled_cutover(self):
        example = (ROOT / ".env.example").read_text(encoding="utf-8")
        runbook = (ROOT / "docs" / "DATABASE_CONTROLLED_CUTOVER.md").read_text(encoding="utf-8")
        self.assertIn("DATABASE_ACTIVE=primary", example)
        self.assertIn("FALLBACK_DATABASE_URL", example)
        self.assertIn("Do not allow both tiers", runbook)


if __name__ == "__main__":
    unittest.main()
