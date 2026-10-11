import importlib.util
import os
import sys
import threading
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
        cls.axc_core_source = (
            ROOT / "simulators/sim_ax3000c/fw_053/src/server.py"
        ).read_text(encoding="utf-8")
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
        self.assertNotIn("_goc._phien.clear()", self.axc_source)
        self.assertNotIn("_phien.clear()", self.axc_core_source)
        self.assertIn('session.get("client_key") == client_key', self.axc_source)
        self.assertIn("_goc.KHO.reset(client_key)", self.axc_source)

    def test_ax3000cv2_parallel_technicians_keep_independent_configuration(self):
        module = load_server("simulators/sim_ax3000c/server_fw053.py", "test_ax3000c_fw053_isolation")
        store = module._goc.KHO
        barrier = threading.Barrier(2)
        failures = []

        def configure(client_key, value):
            try:
                store.bind(client_key)
                barrier.wait(timeout=5)
                for attempt in range(20):
                    store.ghi("ftc.test.concurrent", {"owner": value, "attempt": attempt})
                    self.assertEqual(store.doc("ftc.test.concurrent")["owner"], value)
            except Exception as exc:  # pragma: no cover - surfaced below
                failures.append(exc)

        first = threading.Thread(target=configure, args=("cookie:ktv-a", "A"))
        second = threading.Thread(target=configure, args=("cookie:ktv-b", "B"))
        first.start()
        second.start()
        first.join(timeout=10)
        second.join(timeout=10)

        self.assertFalse(first.is_alive() or second.is_alive(), "parallel configuration threads must finish")
        self.assertEqual(failures, [])
        store.bind("cookie:ktv-a")
        self.assertEqual(store.doc("ftc.test.concurrent")["owner"], "A")
        store.bind("cookie:ktv-b")
        self.assertEqual(store.doc("ftc.test.concurrent")["owner"], "B")

        module.dat_lai_thiet_bi("cookie:ktv-a")
        store.bind("cookie:ktv-a")
        self.assertIsNone(store.doc("ftc.test.concurrent"))
        store.bind("cookie:ktv-b")
        self.assertEqual(store.doc("ftc.test.concurrent")["owner"], "B")

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


    def test_ac1000cv2_logout_under_same_ip_does_not_kick_other_ktv(self):
        module = load_server("simulators/ac1000cv2/src/server.py", "test_ac1000cv2_server")
        # Giả lập 2 KTV cùng phòng học (chung IP 192.168.1.100), khác session ID
        ktv_a_id = "ktv_student_A_123"
        ktv_b_id = "ktv_student_B_456"

        module._phien_xac_thuc.add(ktv_a_id)
        module._phien_xac_thuc.add(ktv_b_id)

        # KTV-A và KTV-B lưu cấu hình khác nhau
        module.KHO.bind(ktv_a_id)
        module.KHO.ghi("lan.ip", "192.168.10.50")
        module.KHO.bind(ktv_b_id)
        module.KHO.ghi("lan.ip", "192.168.10.99")

        self.assertEqual(module.KHO.doc("lan.ip", key=ktv_a_id), "192.168.10.50")
        self.assertEqual(module.KHO.doc("lan.ip", key=ktv_b_id), "192.168.10.99")

        # KTV-A đăng xuất
        module._phien_xac_thuc.discard(ktv_a_id)

        # KTV-A mất phiên, nhưng KTV-B PHẢI VẪN CÒN PHIÊN
        self.assertNotIn(ktv_a_id, module._phien_xac_thuc)
        self.assertIn(ktv_b_id, module._phien_xac_thuc, "KTV-B khong duoc bi kick khi KTV-A dang xuat")
        self.assertEqual(module.KHO.doc("lan.ip", key=ktv_b_id), "192.168.10.99")

    def test_vigor2927_multi_ktv_isolation_and_no_global_wipe(self):
        import sys
        vg_dir = str(ROOT / "simulators/sim_vigor2927/src")
        if vg_dir not in sys.path:
            sys.path.insert(0, vg_dir)
        import vg_config_store as vg_store

        ktv_a = "ktv_vg_user_A"
        ktv_b = "ktv_vg_user_B"

        vg_store.dat_nguoi_dung_hien_tai(ktv_a)
        c_a = vg_store._nap(user_key=ktv_a)
        c_a["pages"]["doc/enet1.htm"]["vars"]["aryLanDhcp"] = "192.168.1.100"

        vg_store.dat_nguoi_dung_hien_tai(ktv_b)
        c_b = vg_store._nap(user_key=ktv_b)
        c_b["pages"]["doc/enet1.htm"]["vars"]["aryLanDhcp"] = "192.168.2.200"

        self.assertEqual(vg_store.USER_CONFIGS[ktv_a]["pages"]["doc/enet1.htm"]["vars"]["aryLanDhcp"], "192.168.1.100")
        self.assertEqual(vg_store.USER_CONFIGS[ktv_b]["pages"]["doc/enet1.htm"]["vars"]["aryLanDhcp"], "192.168.2.200")

        # Reset KTV-A
        vg_store.dat_lai_factory(ktv_a)
        self.assertNotIn(ktv_a, vg_store.USER_CONFIGS)
        self.assertIn(ktv_b, vg_store.USER_CONFIGS, "Reset KTV-A khong duoc xoa state cua KTV-B")
        self.assertEqual(vg_store.USER_CONFIGS[ktv_b]["pages"]["doc/enet1.htm"]["vars"]["aryLanDhcp"], "192.168.2.200")

    def test_ax3000gz_v2_multi_ktv_isolation_and_reset(self):
        gz_store = load_server("devices/ax3000gz_v2/src/config_store.py", "test_ax3000gz_v2_store")

        ktv_a = "ktv_gz_A"
        ktv_b = "ktv_gz_B"

        gz_store.bind_user(ktv_a)
        gz_store.STORE.update_section("home", {"firewall_level": "High"})

        gz_store.bind_user(ktv_b)
        gz_store.STORE.update_section("home", {"firewall_level": "Low"})

        gz_store.bind_user(ktv_a)
        self.assertEqual(gz_store.STORE.get("home")["firewall_level"], "High")
        gz_store.bind_user(ktv_b)
        self.assertEqual(gz_store.STORE.get("home")["firewall_level"], "Low")

        # Reset KTV-A
        gz_store.reset_user_store(ktv_a)
        gz_store.bind_user(ktv_a)
        self.assertNotEqual(gz_store.STORE.get("home")["firewall_level"], "High")
        gz_store.bind_user(ktv_b)
        self.assertEqual(gz_store.STORE.get("home")["firewall_level"], "Low", "Reset KTV-A khong duoc anh huong KTV-B")

    def test_ax3000c_reboot_isolation_per_ktv(self):
        module = load_server("simulators/sim_ax3000c/fw_053/src/server.py", "test_ax3000c_reboot")
        ktv_a = "cookie:ktv-reboot-a"
        ktv_b = "cookie:ktv-reboot-b"

        module.KHO.bind(ktv_a)
        module._REBOOT_THEO_KTV[ktv_a] = time.time()

        module.KHO.bind(ktv_b)
        # KTV-B KHÔNG hề bị reboot
        self.assertIsNone(module._pha_reboot(ktv_b), "KTV-B khong duoc bi coi la dang reboot")
        self.assertEqual(module._pha_reboot(ktv_a), "sap", "KTV-A phai o pha sap khi vua reboot")


if __name__ == "__main__":
    unittest.main()

