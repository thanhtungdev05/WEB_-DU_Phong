import pathlib
import unittest


ROOT = pathlib.Path(__file__).resolve().parents[1]


class SessionLifecycleContractTests(unittest.TestCase):
    @classmethod
    def setUpClass(cls):
        cls.handler = (ROOT / "api" / "lib" / "PostgresSessionHandler.php").read_text(encoding="utf-8")
        cls.portal = (ROOT / "app.js").read_text(encoding="utf-8")
        cls.dashboard = (ROOT / "dashboard-authen" / "js" / "app.js").read_text(encoding="utf-8")
        cls.tracking = (ROOT / "api" / "lib" / "tracking_handler.php").read_text(encoding="utf-8")

    def test_database_session_handler_supports_php_lazy_write_touches(self):
        self.assertIn("SessionUpdateTimestampHandlerInterface", self.handler)
        self.assertIn("function validateId", self.handler)
        self.assertIn("function updateTimestamp", self.handler)
        self.assertIn("SET expires_at = NOW() + make_interval", self.handler)
        self.assertIn("AND expires_at > NOW()", self.handler)

    def test_portal_keeps_active_sessions_alive_without_trusting_client_identity(self):
        self.assertIn("SESSION_HEARTBEAT_INTERVAL_MS", self.portal)
        self.assertIn("20 * 60 * 1000", self.portal)
        self.assertIn("ftc-session-heartbeat-last-success-v1", self.portal)
        self.assertIn("claimSessionHeartbeatLease()", self.portal)
        self.assertIn("requestCurrentUserSession()", self.portal)
        self.assertIn("cache: 'no-store'", self.portal)
        self.assertIn("window.addEventListener('focus', refreshSessionHeartbeat)", self.portal)
        self.assertIn("document.visibilityState === 'visible'", self.portal)
        self.assertIn("verify_tracking_access", self.tracking)
        self.assertIn("require_user()", self.tracking)

    def test_tracking_rechecks_session_and_handles_unauthenticated_response(self):
        self.assertIn("authenticationChecked = false", self.portal)
        self.assertIn("Đang kiểm tra phiên đăng nhập trước khi lưu kết quả", self.portal)
        self.assertIn("err.status === 401", self.portal)
        self.assertIn("err.code === 'auth/unauthenticated'", self.portal)
        self.assertIn("recoveryAction === 'login'", self.portal)
        self.assertIn("Kết quả chưa được lưu", self.portal)

    def test_dashboard_keeps_active_admin_sessions_alive(self):
        self.assertIn("DASHBOARD_SESSION_HEARTBEAT_INTERVAL_MS", self.dashboard)
        self.assertIn("20 * 60 * 1000", self.dashboard)
        self.assertIn("ftc-session-heartbeat-last-success-v1", self.dashboard)
        self.assertIn("claimDashboardSessionHeartbeatLease()", self.dashboard)
        self.assertIn("fetchDashboardSessionUser()", self.dashboard)
        self.assertIn("cache: 'no-store'", self.dashboard)
        self.assertIn("window.addEventListener('focus', refreshDashboardSessionHeartbeat)", self.dashboard)
        self.assertIn("document.visibilityState === 'visible'", self.dashboard)

    def test_dashboard_does_not_redirect_on_temporary_auth_service_errors(self):
        self.assertIn("error?.status === 401 || error?.status === 403", self.dashboard)
        self.assertIn("Máy chủ xác thực tạm thời không phản hồi", self.dashboard)
        self.assertIn("redirectAfterDashboardSessionExpiry()", self.dashboard)


if __name__ == "__main__":
    unittest.main()
