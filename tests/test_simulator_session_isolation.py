import importlib.util
import os
import sys
import time
import unittest
from pathlib import Path


ROOT = Path(__file__).resolve().parents[1]


def load_server(relative_path: str, module_name: str):
    path = ROOT / relative_path
    original_argv = sys.argv[:]
    try:
        sys.argv = [str(path)]
        spec = importlib.util.spec_from_file_location(module_name, path)
        module = importlib.util.module_from_spec(spec)
        spec.loader.exec_module(module)
        return module
    finally:
        sys.argv = original_argv


def make_handler(module, headers):
    handler = module.H.__new__(module.H)
    handler.headers = headers
    sent = {}
    handler._send = lambda data, ctype, code=200: sent.update(data=data, ctype=ctype, code=code)
    return handler, sent


class SimulatorSessionIsolationTests(unittest.TestCase):
    @classmethod
    def setUpClass(cls):
        cls.portal_js = (ROOT / "app.js").read_text(encoding="utf-8")
        cls.ac_source = (ROOT / "simulators/sim_ac1000f/server2.py").read_text(encoding="utf-8")
        cls.hv2_source = (ROOT / "simulators/sim_ax3000hv2/server2.py").read_text(encoding="utf-8")
        cls.axc_source = (ROOT / "simulators/sim_ax3000c/server_fw053.py").read_text(encoding="utf-8")
        cls.achi_store_source = (ROOT / "simulators/sim_ac1000HI/src/config_store.py").read_text(encoding="utf-8")
        cls.achi_server_source = (ROOT / "simulators/sim_ac1000HI/src/server.py").read_text(encoding="utf-8")
        cls.ap6500_store_source = (ROOT / "simulators/ont_be6500c/src/config_store.py").read_text(encoding="utf-8")
        cls.ont6500_store_source = (ROOT / "simulators/sim_ONT_be6500c/src/config_store.py").read_text(encoding="utf-8")
        cls.mikrotik_source = (ROOT / "simulators/mikrotik_hexs/src/server.py").read_text(encoding="utf-8")

    def test_mikrotik_configuration_is_isolated_per_technician_session(self):
        module = load_server("simulators/mikrotik_hexs/src/server.py", "test_mikrotik_server")
        first = module._kho_cua_ktv("ktv-a")
        second = module._kho_cua_ktv("ktv-b")
        first.dat_scalar((20, 9), {1: (33, b"KTV-A")})
        self.assertEqual(first.lop_phu_scalar((20, 9))[1], (33, b"KTV-A"))
        self.assertEqual(second.lop_phu_scalar((20, 9)), {})
        self.assertIsNot(first, second)
        self.assertIn("KhoCauHinh(tu_dia=False)", self.mikrotik_source)
        self.assertIn("Session state is intentionally memory-only", self.mikrotik_source)

    def test_ac1000f_and_ax3000hv2_keep_independent_user_state(self):
        for relative_path, module_name in (
            ("simulators/sim_ac1000f/server2.py", "test_sim_ac1000f_server"),
            ("simulators/sim_ax3000hv2/server2.py", "test_sim_ax3000hv2_server"),
        ):
            module = load_server(relative_path, module_name)
            first = module.get_client_state("ktv-a")
            second = module.get_client_state("ktv-b")
            first["ssid"] = "A"
            second["ssid"] = "B"
            self.assertEqual(module.get_client_state("ktv-a")["ssid"], "A")
            self.assertEqual(module.get_client_state("ktv-b")["ssid"], "B")
            self.assertIsNot(first, second)

    def test_reset_endpoints_remove_only_current_client(self):
        for source in (self.ac_source, self.hv2_source):
            self.assertIn("USER_STATES.pop(", source)
        # Toan cuc clear chi duoc phep ton tai trong /internal/reset co token
        # quan tri (B3) -- khong bao gio o cac endpoint reset quen thuoc cua trinh duyet.
        for source in (self.ac_source, self.hv2_source):
            self.assertEqual(source.count("USER_STATES.clear()"), 1)
            self.assertIn("if not self._admin_ok():", source)
        self.assertIn("_phien.clear()", self.axc_source)

    def test_active_simulators_never_clear_every_users_state_from_reset(self):
        for source in (
            self.achi_store_source,
            self.ap6500_store_source,
            self.ont6500_store_source,
        ):
            self.assertNotIn("USER_STATES.clear()", source)
            self.assertNotIn("_USER_CACHES.clear()", source)
        self.assertNotIn("ACTIVE_SESSIONS.clear()", self.achi_store_source)
        self.assertIn("if sid:\n                kho.dat_lai_factory(sid)", self.achi_server_source)

    def test_portal_waits_for_current_session_reset_before_loading(self):
        self.assertIn("const resetPromise = resetDeviceSession(currentDeviceId)", self.portal_js)
        self.assertIn("Promise.resolve(resetPromise).finally", self.portal_js)
        self.assertIn("const resetPromises = Array.from(resetEndpoints).map", self.portal_js)
        self.assertIn("method: 'POST'", self.portal_js)
        self.assertIn("credentials: 'same-origin'", self.portal_js)
        self.assertIn("return Promise.allSettled(resetPromises)", self.portal_js)
        self.assertIn("window._sessionRuleCacheScope", self.portal_js)

    def test_select_device_and_lesson_scope_the_session_rule_cache(self):
        self.assertEqual(self.portal_js.count("resetDeviceSession(device.id);"), 2)
        self.assertIn("currentLessonKey", self.portal_js)
        for source in (self.ac_source, self.hv2_source):
            self.assertIn("_LAST_SEEN[key] = time.time()", source)
            self.assertIn("_gc_sessions_unlocked(", source)

    def test_internal_reset_requires_admin_token_and_is_opt_in(self):
        module = load_server("simulators/sim_ac1000f/server2.py", "b3_test_ac_no_token")
        self.assertEqual(module._ADMIN_TOKEN, "", "must default to UN-set token (safe)")
        handler, sent = make_handler(module, headers={})
        handled = handler._xu_ly_internal("/internal/reset")
        self.assertTrue(handled)
        self.assertEqual(sent["code"], 403)
        self.assertIn("forbidden", sent["data"].decode())

    def test_internal_reset_with_valid_token_clears_all_sessions(self):
        old = os.environ.get("FTC_SIM_ADMIN_TOKEN")
        try:
            os.environ["FTC_SIM_ADMIN_TOKEN"] = "sekret-token-xyz"
            module = load_server("simulators/sim_ax3000hv2/server2.py", "b3_test_hv2_token")
        finally:
            if old is None:
                os.environ.pop("FTC_SIM_ADMIN_TOKEN", None)
            else:
                os.environ["FTC_SIM_ADMIN_TOKEN"] = old
        module.get_client_state("u1")["x"] = 1
        module.get_client_state("u2")["y"] = 2
        handler, sent = make_handler(module, headers={"X-Admin-Token": "sekret-token-xyz"})
        self.assertTrue(handler._admin_ok())
        self.assertTrue(handler._xu_ly_internal("/internal/reset"))
        self.assertEqual(sent["code"], 200)
        self.assertEqual(len(module.USER_STATES), 0)
        self.assertEqual(len(module._LAST_SEEN), 0)

    def test_internal_reset_rejects_bad_token(self):
        old = os.environ.get("FTC_SIM_ADMIN_TOKEN")
        try:
            os.environ["FTC_SIM_ADMIN_TOKEN"] = "sekret-token-xyz"
            module = load_server("simulators/sim_ac1000f/server2.py", "b3_test_ac_bad_token")
        finally:
            if old is None:
                os.environ.pop("FTC_SIM_ADMIN_TOKEN", None)
            else:
                os.environ["FTC_SIM_ADMIN_TOKEN"] = old
        module.get_client_state("u1")["x"] = 1
        handler, sent = make_handler(module, headers={"X-Admin-Token": "wrong-token"})
        self.assertFalse(handler._admin_ok())
        self.assertTrue(handler._xu_ly_internal("/internal/reset"))
        self.assertEqual(sent["code"], 403)
        self.assertEqual(len(module.USER_STATES), 1)

    def test_gc_prunes_stale_sessions_but_keeps_live_ones(self):
        module = load_server("simulators/sim_ac1000f/server2.py", "b3_test_gc")
        now = time.time()
        module.get_client_state("live")["v"] = 1
        module.get_client_state("stale")["v"] = 1
        module._LAST_SEEN["live"] = now
        module._LAST_SEEN["stale"] = now - 100000
        removed = module._gc_sessions_unlocked(now)
        self.assertGreaterEqual(removed, 1)
        self.assertIn("live", module.USER_STATES)
        self.assertNotIn("stale", module.USER_STATES)


if __name__ == "__main__":
    unittest.main()
