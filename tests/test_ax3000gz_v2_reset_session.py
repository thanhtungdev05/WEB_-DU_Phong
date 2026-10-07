"""AX3000GZ_V2: /api/reset phải bắt buộc đăng nhập lại khi đổi bài học.

Portal gọi ``POST /sim_ax3000gz_v2/api/reset`` (fallback ``GET``) trước khi
tải bài mới. Nếu server không xử lý, cookie SID còn hạn nên học viên vào
luật trang cấu hình mà không cần đăng nhập lại.
"""
import hashlib
import http.client
import importlib.util
import json
import re
import sys
import threading
import unittest
from http.server import ThreadingHTTPServer
from pathlib import Path


ROOT = Path(__file__).resolve().parents[1]
SIM_SRC = ROOT / "devices" / "ax3000gz_v2" / "src"


def load_server(module_name: str):
    path = SIM_SRC / "server.py"
    added_path = str(SIM_SRC) not in sys.path
    if added_path:
        sys.path.insert(0, str(SIM_SRC))
    # ``server.py`` falls back to a flat ``from config_store import STORE``.
    # Một simulator khác có thể đã nạp module cùng tên trước đó trong phiên
    # pytest này, nên phải nạp bản AX3000GZ_V2 rồi trả lại bản cũ.
    previous_store = sys.modules.pop("config_store", None)
    original_argv = sys.argv[:]
    try:
        store_spec = importlib.util.spec_from_file_location(
            "config_store", SIM_SRC / "config_store.py")
        store_module = importlib.util.module_from_spec(store_spec)
        sys.modules["config_store"] = store_module
        store_spec.loader.exec_module(store_module)

        # ``server.py`` reads PORT from argv[1]; pytest puts paths there.
        sys.argv = [str(path)]
        spec = importlib.util.spec_from_file_location(module_name, path)
        module = importlib.util.module_from_spec(spec)
        spec.loader.exec_module(module)
        return module
    finally:
        sys.argv = original_argv
        if previous_store is not None:
            sys.modules["config_store"] = previous_store
        else:
            sys.modules.pop("config_store", None)
        if added_path:
            sys.path.remove(str(SIM_SRC))


class Ax3000GzV2ResetSessionTests(unittest.TestCase):
    @classmethod
    def setUpClass(cls):
        cls.module = load_server("test_ax3000gz_v2_server")
        cls.server = ThreadingHTTPServer(("127.0.0.1", 0), cls.module.Handler)
        cls.server.daemon_threads = True
        cls.thread = threading.Thread(target=cls.server.serve_forever, daemon=True)
        cls.thread.start()
        cls.port = cls.server.server_address[1]

    @classmethod
    def tearDownClass(cls):
        cls.server.shutdown()
        cls.server.server_close()
        cls.thread.join(timeout=5)

    # ── HTTP helpers ──────────────────────────────────────────────

    def request(self, method, path, body=None, cookie=None):
        conn = http.client.HTTPConnection("127.0.0.1", self.port, timeout=10)
        headers = {}
        if cookie:
            headers["Cookie"] = f"SID={cookie}"
        if body is not None:
            headers["Content-Type"] = "application/x-www-form-urlencoded"
        try:
            conn.request(method, path, body=body, headers=headers)
            response = conn.getresponse()
            payload = response.read()
            set_cookie = response.getheader("Set-Cookie")
            return response.status, set_cookie, payload
        finally:
            conn.close()

    @staticmethod
    def sid_from(set_cookie):
        if not set_cookie:
            return None
        match = re.search(r"SID=([^;]*)", set_cookie)
        return match.group(1) if match else None

    def login(self):
        """Đi qua đúng luồng đăng nhập thật của thiết bị, trả về (sid, sess_token)."""
        status, set_cookie, payload = self.request(
            "GET", "/?_type=loginData&_tag=login_entry")
        self.assertEqual(status, 200)
        sid = self.sid_from(set_cookie)
        self.assertTrue(sid, "first visit must issue a SID cookie")
        sess_token = json.loads(payload.decode())["sess_token"]

        status, _, payload = self.request(
            "GET", "/?_type=loginData&_tag=login_token", cookie=sid)
        self.assertEqual(status, 200)
        login_token = re.search(r"<ajax_response_xml_root>([^<]+)</ajax_response_xml_root>",
                                payload.decode()).group(1)

        digest = hashlib.sha256(("admin" + login_token).encode()).hexdigest()
        status, _, payload = self.request(
            "POST", "/?_type=loginData&_tag=login_entry", cookie=sid,
            body=("Username=admin&Password=%s&_sessionTOKEN=%s"
                  % (digest, sess_token)))
        self.assertEqual(status, 200)
        self.assertTrue(json.loads(payload.decode())["login_need_refresh"])
        return sid

    def is_logged_in(self, sid):
        status, _, payload = self.request("GET", "/", cookie=sid)
        self.assertEqual(status, 200)
        # Trang đăng nhập có ô Username; trang cấu hình thì không.
        return b'Frm_Username' not in payload

    # ── Tests ─────────────────────────────────────────────────────

    def test_portal_reset_endpoint_forces_login_again(self):
        for method in ("POST", "GET"):
            with self.subTest(method=method):
                sid = self.login()
                self.assertTrue(self.is_logged_in(sid), "login must open the config page")

                self.module.STORE.update_section("home", {"firewall_level": "Low"})

                status, set_cookie, payload = self.request(method, "/api/reset", cookie=sid)
                self.assertEqual(status, 200)
                body = json.loads(payload.decode())
                self.assertEqual(body["status"], "ok")
                self.assertIn("SID=;", set_cookie or "", "SID cookie must expire")
                self.assertNotIn(sid, self.module.SESSIONS, "caller session must be dropped")

                self.assertFalse(self.is_logged_in(sid), "reset must require a new login")
                home = self.module.STORE.get("home")
                self.assertNotEqual(home["firewall_level"], "Low")
                self.assertEqual(home["firewall_level"], "Middle")

    def test_reset_keeps_other_sessions_and_works_without_cookie(self):
        first = self.login()
        _, set_cookie, _ = self.request("GET", "/?_type=loginData&_tag=login_entry")
        second_sid = self.sid_from(set_cookie)
        # Phiên thứ hai đăng nhập hẳn để chắc reset không xoá nhầm.
        self.login_with_sid(second_sid)
        self.assertTrue(self.is_logged_in(second_sid))

        status, _, payload = self.request("POST", "/api/reset", cookie=first)
        self.assertEqual(status, 200)
        self.assertEqual(json.loads(payload.decode())["status"], "ok")
        self.assertNotIn(first, self.module.SESSIONS)
        self.assertTrue(self.is_logged_in(second_sid),
                        "another technician session must survive the reset")

        # Không có cookie: vẫn 200 (portal gửi POST trước rồi mới GET).
        status, _, payload = self.request("POST", "/api/reset")
        self.assertEqual(status, 200)
        self.assertEqual(json.loads(payload.decode())["status"], "ok")

    def login_with_sid(self, sid):
        _, _, payload = self.request("GET", "/?_type=loginData&_tag=login_entry", cookie=sid)
        sess_token = json.loads(payload.decode())["sess_token"]
        _, _, payload = self.request("GET", "/?_type=loginData&_tag=login_token", cookie=sid)
        login_token = re.search(r"<ajax_response_xml_root>([^<]+)</ajax_response_xml_root>",
                                payload.decode()).group(1)
        digest = hashlib.sha256(("admin" + login_token).encode()).hexdigest()
        self.request("POST", "/?_type=loginData&_tag=login_entry", cookie=sid,
                     body=("Username=admin&Password=%s&_sessionTOKEN=%s"
                           % (digest, sess_token)))


if __name__ == "__main__":
    unittest.main()
