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


class NeonQuotaAlertTests(unittest.TestCase):
    def setUp(self):
        db_guardian._alert_state.clear()

    def test_quota_levels(self):
        self.assertEqual(db_guardian.quota_level(10)[0], 0)
        self.assertEqual(db_guardian.quota_level(70)[1], "WARN")
        self.assertEqual(db_guardian.quota_level(90)[1], "HIGH")
        self.assertEqual(db_guardian.quota_level(99)[1], "CRITICAL")

    def test_alert_dedupes_and_escalates(self):
        with patch.dict(os.environ, {"ALERT_WEBHOOK_URL": ""}):
            self.assertTrue(db_guardian.send_alert("k", 1, "warn"))
            self.assertFalse(db_guardian.send_alert("k", 1, "warn again"))
            self.assertTrue(db_guardian.send_alert("k", 3, "critical"))
            db_guardian.send_alert("k", 0, "")
            self.assertTrue(db_guardian.send_alert("k", 1, "warn after recovery"))

    @patch("db_guardian.urllib.request.urlopen")
    def test_webhook_only_https(self, mock_open):
        with patch.dict(os.environ, {"ALERT_WEBHOOK_URL": "http://insecure.example/x"}):
            db_guardian.send_alert("a", 1, "m")
        mock_open.assert_not_called()
        with patch.dict(os.environ, {"ALERT_WEBHOOK_URL": "https://hooks.example/x"}):
            db_guardian.send_alert("b", 1, "m")
        mock_open.assert_called_once()

    @patch("db_guardian.send_alert")
    @patch("db_guardian._neon_get")
    def test_check_neon_quota_percentages(self, mock_get, mock_alert):
        mock_get.return_value = {"project": {
            "compute_time_seconds": 90 * 3600,
            "data_transfer_bytes": 1_000_000_000,
        }}
        with patch.dict(os.environ, {
            "NEON_API_KEY": "k", "NEON_PROJECT_ID": "p",
            "NEON_COMPUTE_LIMIT_HOURS": "", "NEON_DATA_TRANSFER_LIMIT_GB": "",
        }):
            result = db_guardian.check_neon_quota()
        self.assertEqual(result["compute"], 90.0)
        self.assertEqual(result["transfer"], 20.0)
        keys = {call.args[0]: call.args[1] for call in mock_alert.call_args_list}
        self.assertEqual(keys["neon_compute"], 2)
        self.assertEqual(keys["neon_transfer"], 0)

    def test_no_api_key_is_noop(self):
        with patch.dict(os.environ, {"NEON_API_KEY": ""}):
            self.assertEqual(db_guardian.check_neon_quota(), {})


class ZaloChannelTests(unittest.TestCase):
    def setUp(self):
        import tempfile
        self.tmp = tempfile.TemporaryDirectory()
        self.store = os.path.join(self.tmp.name, "zalo.json")
        db_guardian._zalo_access.update({"token": "", "expires_at": 0.0})
        self.env = patch.dict(os.environ, {
            "ZALO_APP_ID": "app", "ZALO_APP_SECRET": "sec",
            "ZALO_ALERT_USER_ID": "u1", "ZALO_REFRESH_TOKEN": "env-refresh",
            "ZALO_TOKEN_STORE": self.store,
        })
        self.env.start()

    def tearDown(self):
        self.env.stop()
        self.tmp.cleanup()

    def test_unconfigured_is_noop(self):
        with patch.dict(os.environ, {"ZALO_APP_ID": ""}), \
                patch("db_guardian._zalo_post") as post:
            self.assertFalse(db_guardian.send_zalo("x"))
        post.assert_not_called()

    def test_refresh_then_send_persists_rotated_token(self):
        calls = []

        def fake_post(url, data, headers):
            calls.append(url)
            if url == db_guardian.ZALO_TOKEN_URL:
                self.assertEqual(headers["secret_key"], "sec")
                return {"access_token": "acc1", "refresh_token": "new-refresh", "expires_in": "3600"}
            self.assertEqual(headers["access_token"], "acc1")
            self.assertIn(b'"user_id": "u1"', data)
            return {"error": 0}

        with patch("db_guardian._zalo_post", side_effect=fake_post):
            self.assertTrue(db_guardian.send_zalo("hello"))
            self.assertTrue(db_guardian.send_zalo("again"))  # cached access token
        self.assertEqual(calls.count(db_guardian.ZALO_TOKEN_URL), 1)
        self.assertEqual(db_guardian._zalo_read_store()["refresh_token"], "new-refresh")

    def test_expired_token_refreshes_and_retries_once(self):
        db_guardian._zalo_access.update({"token": "stale", "expires_at": 9e12})
        sent = []

        def fake_post(url, data, headers):
            if url == db_guardian.ZALO_TOKEN_URL:
                return {"access_token": "fresh", "refresh_token": "r2", "expires_in": "3600"}
            sent.append(headers["access_token"])
            return {"error": -216} if headers["access_token"] == "stale" else {"error": 0}

        with patch("db_guardian._zalo_post", side_effect=fake_post):
            self.assertTrue(db_guardian.send_zalo("hello"))
        self.assertEqual(sent, ["stale", "fresh"])

    def test_falls_back_to_env_refresh_token_when_store_is_stale(self):
        db_guardian._zalo_write_store("stale-store")
        used = []

        def fake_post(url, data, headers):
            if url == db_guardian.ZALO_TOKEN_URL:
                used.append(data.decode())
                if b"stale-store" in data:
                    return {"error": -118}
                return {"access_token": "acc", "refresh_token": "r3", "expires_in": "3600"}
            return {"error": 0}

        with patch("db_guardian._zalo_post", side_effect=fake_post):
            self.assertTrue(db_guardian.send_zalo("hello"))
        self.assertEqual(len(used), 2)

    def test_message_is_truncated_and_failure_never_raises(self):
        captured = {}

        def fake_post(url, data, headers):
            if url == db_guardian.ZALO_TOKEN_URL:
                return {"access_token": "a", "refresh_token": "r", "expires_in": "3600"}
            captured["data"] = data
            return {"error": -999}

        with patch("db_guardian._zalo_post", side_effect=fake_post):
            self.assertFalse(db_guardian.send_zalo("x" * 5000))
        self.assertLessEqual(len(captured["data"]), 2200)

    def test_alert_reaches_zalo_channel(self):
        db_guardian._alert_state.clear()
        with patch("db_guardian.send_zalo") as zalo, patch("db_guardian.send_webhook"):
            db_guardian.send_alert("z", 1, "msg")
        zalo.assert_called_once_with("msg")


if __name__ == "__main__":
    unittest.main()
