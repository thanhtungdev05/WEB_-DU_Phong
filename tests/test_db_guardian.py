import os
import pathlib
import unittest
from unittest.mock import MagicMock, patch

import db_guardian

ROOT = pathlib.Path(__file__).resolve().parents[1]


class DbGuardianContractTests(unittest.TestCase):
    def test_db_guardian_constants(self):
        self.assertEqual(db_guardian.NEON_FREE_LIMIT_MB, 512)
        self.assertEqual(db_guardian.WARN_THRESHOLD_PCT, 80)
        self.assertEqual(db_guardian.CRITICAL_THRESHOLD_PCT, 92)
        self.assertGreater(db_guardian.STORAGE_CHECK_INTERVAL_SEC, 0)
        self.assertGreater(db_guardian.CLEANUP_INTERVAL_SEC, 0)
        self.assertGreater(db_guardian.KEEPALIVE_INTERVAL_SEC, 0)

    @patch("db_guardian._get_db_connection")
    def test_check_storage_returns_mb(self, mock_get_conn):
        mock_conn = MagicMock()
        mock_cur = MagicMock()
        mock_cur.fetchone.return_value = (150.5,)
        mock_conn.cursor.return_value.__enter__.return_value = mock_cur
        mock_get_conn.return_value.__enter__.return_value = mock_conn

        with patch.dict(os.environ, {
            "DATABASE_ACTIVE": "primary",
            "DATABASE_URL": "postgresql://primary.example/db",
            "FALLBACK_DATABASE_URL": "",
        }):
            size_mb = db_guardian.check_storage()
        self.assertEqual(size_mb, 150.5)

    @patch("db_guardian._get_db_connection")
    def test_cleanup_expired_sessions_executes(self, mock_get_conn):
        mock_conn = MagicMock()
        mock_cur = MagicMock()
        mock_cur.rowcount = 5
        mock_conn.cursor.return_value.__enter__.return_value = mock_cur
        mock_get_conn.return_value.__enter__.return_value = mock_conn

        with patch.dict(os.environ, {
            "DATABASE_ACTIVE": "fallback",
            "DATABASE_URL": "postgresql://primary.example/db",
            "FALLBACK_DATABASE_URL": "postgresql://fallback.example/db",
        }):
            results = db_guardian.cleanup_expired_sessions()
        self.assertIn("app_sessions", results)
        self.assertIn("django_session", results)
        self.assertIn("login_logs", results)
        mock_get_conn.assert_called_once_with("postgresql://fallback.example/db")

    def test_database_selection_is_explicit_and_stable(self):
        env = {
            "DATABASE_ACTIVE": "fallback",
            "DATABASE_URL": "postgresql://primary.example/db",
            "FALLBACK_DATABASE_URL": "postgresql://fallback.example/db",
        }
        with patch.dict(os.environ, env):
            selection = db_guardian.get_database_selection()
        self.assertEqual(selection, (
            "fallback",
            "postgresql://fallback.example/db",
            "primary",
            "postgresql://primary.example/db",
        ))

    def test_fallback_selection_requires_fallback_url(self):
        with patch.dict(os.environ, {
            "DATABASE_ACTIVE": "fallback",
            "DATABASE_URL": "postgresql://primary.example/db",
            "FALLBACK_DATABASE_URL": "",
        }), self.assertRaisesRegex(RuntimeError, "FALLBACK_DATABASE_URL"):
            db_guardian.get_database_selection()

    def test_migration_052_contains_cleanup_and_views(self):
        migration_file = ROOT / "api" / "migrations" / "052_db_guardian_cleanup_views.sql"
        self.assertTrue(migration_file.exists())
        content = migration_file.read_text(encoding="utf-8")
        self.assertIn("cleanup_expired_sessions", content)
        self.assertIn("v_db_storage_report", content)
        self.assertIn("v_table_sizes", content)

    def test_api_index_contains_system_routes(self):
        api_index = (ROOT / "api" / "index.php").read_text(encoding="utf-8")
        self.assertIn("function handle_system", api_index)
        self.assertIn("$resource === 'system'", api_index)
        self.assertIn("handle_system($segments, $method)", api_index)

    def test_django_cleanup_command_exists(self):
        cmd_file = ROOT / "admin_app" / "admin_portal" / "management" / "commands" / "cleanup_db.py"
        self.assertTrue(cmd_file.exists())
        content = cmd_file.read_text(encoding="utf-8")
        self.assertIn("class Command", content)
        self.assertIn("handle", content)

    def test_django_sync_fallback_command_exists(self):
        cmd_file = ROOT / "admin_app" / "admin_portal" / "management" / "commands" / "sync_fallback_db.py"
        self.assertTrue(cmd_file.exists())
        content = cmd_file.read_text(encoding="utf-8")
        self.assertIn("class Command", content)
        self.assertIn("_apply_migrations_to_fallback", content)
        self.assertIn("_sync_tables", content)

    def test_runtime_php_supports_fallback_database(self):
        runtime_content = (ROOT / "api" / "lib" / "runtime.php").read_text(encoding="utf-8")
        self.assertIn("FALLBACK_DATABASE_URL", runtime_content)
        self.assertIn("get_active_database_tier", runtime_content)
        self.assertIn("active_database_tier", runtime_content)
        self.assertIn("DATABASE_ACTIVE", runtime_content)
        self.assertNotIn("Auto-failing over", runtime_content)

    def test_migrate_php_supports_fallback_flag(self):
        migrate_content = (ROOT / "api" / "migrate.php").read_text(encoding="utf-8")
        self.assertIn("--fallback", migrate_content)
        self.assertIn("DATABASE_ACTIVE=fallback", migrate_content)


if __name__ == "__main__":
    unittest.main()
