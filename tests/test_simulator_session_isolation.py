import importlib.util
import os
import sys
import threading
import time
import unittest
from pathlib import Path


ROOT = Path(__file__).resolve().parents[1]
if str(ROOT) not in sys.path:
    sys.path.insert(0, str(ROOT))


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
        self.assertIn("Promise.resolve(resetPromise).then", self.portal_js)
        self.assertIn("const resetPromises = Array.from(resetEndpoints).map", self.portal_js)
        self.assertIn("method: 'POST'", self.portal_js)
        self.assertIn("credentials: 'same-origin'", self.portal_js)
        self.assertIn("const resetExecutionPromise = Promise.all(resetPromises)", self.portal_js)
        self.assertIn("const requiresVerifiedReset = normalizeDeviceId(currentDeviceId) === 'ax3000gz_v2'", self.portal_js)
        self.assertIn("if (requiresVerifiedReset && resetSucceeded !== true)", self.portal_js)
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
        vg_store = load_server("simulators/sim_vigor2927/src/vg_config_store.py", "test_vg_config_store")

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
        gz_store = load_server("simulators/ax3000gz_v2/src/config_store.py", "test_ax3000gz_v2_store")

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


    def test_ax1800gz_multi_ktv_isolation_and_no_global_wipe(self):
        module = load_server("simulators/ax1800gz/src/server.py", "test_ax1800gz_server")
        ax1800gz_server_source = (ROOT / "simulators/ax1800gz/src/server.py").read_text(encoding="utf-8")
        self.assertNotIn("_phien_xac_thuc.clear()", ax1800gz_server_source)

        ktv_a = "ktv_ax1800gz_A_101"
        ktv_b = "ktv_ax1800gz_B_202"

        module._phien_xac_thuc.add(ktv_a)
        module._phien_xac_thuc.add(ktv_b)

        module.KHO.bind(ktv_a)
        module.KHO.ghi("lan.ip", "192.168.100.10")
        module.KHO.bind(ktv_b)
        module.KHO.ghi("lan.ip", "192.168.100.20")

        self.assertEqual(module.KHO.doc("lan.ip", key=ktv_a), "192.168.100.10")
        self.assertEqual(module.KHO.doc("lan.ip", key=ktv_b), "192.168.100.20")

        # Reset / logout KTV-A must not affect KTV-B
        module._phien_xac_thuc.discard(ktv_a)
        module.KHO.dat_lai(ktv_a)

        self.assertNotIn(ktv_a, module._phien_xac_thuc)
        self.assertIn(ktv_b, module._phien_xac_thuc, "KTV-B khong duoc mat phien khi KTV-A reset/logout")
        self.assertEqual(module.KHO.doc("lan.ip", key=ktv_b), "192.168.100.20")
        self.assertNotEqual(module.KHO.doc("lan.ip", key=ktv_a), "192.168.100.10")

    def test_mobile_five_issue_safeguards_remain_active(self):
        ftc_axc_js = (ROOT / "simulators/sim_ax3000c/ftc/ftc-ax3000c.js").read_text(encoding="utf-8")
        # 1. OOM Tab Crash cleanup on screen/device switch
        self.assertIn("function releaseSimulatorIframeMemory(", self.portal_js)
        self.assertIn("_PREPATCHED_CACHE", self.axc_source)
        # 2. Loading Mask ("Currently in agent mode...") suppression
        # Mat na duoc go ngay khi DOM doi (MutationObserver) + du phong dinh ky, thay cho 3 vong 250-300ms
        self.assertIn("new MutationObserver(lichQuet)", ftc_axc_js)
        self.assertIn("trietTieuLoadingTre();", ftc_axc_js)
        self.assertNotIn("setInterval(trietTieuLoadingTre", ftc_axc_js)
        self.assertIn("document.addEventListener('DOMContentLoaded', trietTieuLoadingTre);", ftc_axc_js)
        self.assertIn("e.loading=!1", self.axc_source)
        # 3. Port Forwarding Device/IP virtual keyboard freeze fix (<el-select> -> <el-input>)
        self.assertIn('r("el-input",{on:{input:e.forceUpdate},model:{value:t.row.dest_ip', self.axc_source)
        # 4. Fast Reboot countdown (0.3s instead of 5s-20s)
        self.assertIn("_goc.REBOOT_SAP_S = 0.3", self.axc_source)
        self.assertIn("_goc.REBOOT_CHUA_SAN_S = 0.3", self.axc_source)
        # 5. 4G/5G network switch session persistence and fetch retry
        self.assertIn("function getKtvClientId()", self.portal_js)
        self.assertIn("function fetchWithRetry(", self.portal_js)

    def test_ac1000hi_multi_ktv_isolation_and_reset(self):
        import simulators.sim_ac1000HI.src.config_store as achi_kho
        import simulators.sim_ac1000HI.src.server as achi_srv

        ktv_a = "ktv_ac1000hi_A_001"
        ktv_b = "ktv_ac1000hi_B_002"
        sid_a = "aaaa1111"
        sid_b = "bbbb2222"

        # 2 KTV cung dang nhap tren cung 1 Wi-Fi NAT
        achi_kho.mo_phien(sid_a, client_key=ktv_a)
        achi_kho.mo_phien(sid_b, client_key=ktv_b)

        self.assertTrue(achi_kho.phien_hop_le(sid_a))
        self.assertTrue(achi_kho.phien_hop_le(ktv_a))
        self.assertTrue(achi_kho.phien_hop_le(sid_b))
        self.assertTrue(achi_kho.phien_hop_le(ktv_b))

        # KTV-A doi SSID va LAN IP qua sid_a, KTV-B doi qua ktv_b
        achi_kho.dat_phien_hien_tai(sid_a)
        achi_kho.ghi("home_wireless.ESSID", "FPT_KTV_A")
        achi_kho.ghi("lan.uiViewIPAddr", "192.168.10.1")

        achi_kho.dat_phien_hien_tai(ktv_b)
        achi_kho.ghi("home_wireless.ESSID", "FPT_KTV_B")
        achi_kho.ghi("lan.uiViewIPAddr", "192.168.20.1")

        # Kiem tra doc cheo qua ca SESSIONID va client_key
        self.assertEqual(achi_kho.doc("home_wireless.ESSID", sid=sid_a), "FPT_KTV_A")
        self.assertEqual(achi_kho.doc("home_wireless.ESSID", sid=ktv_a), "FPT_KTV_A")
        self.assertEqual(achi_kho.doc("home_wireless.ESSID", sid=sid_b), "FPT_KTV_B")
        self.assertEqual(achi_kho.doc("home_wireless.ESSID", sid=ktv_b), "FPT_KTV_B")

        # KTV-A reset tu Portal (chi gui X-KTV-Session-ID = ktv_a)
        handler_a = achi_srv.H.__new__(achi_srv.H)
        handler_a.headers = {"X-KTV-Session-ID": ktv_a}
        handler_a.path = "/api/reset?_ktv=" + ktv_a
        self.assertEqual(handler_a._client_key(), ktv_a)

        achi_kho.dat_lai_factory(ktv_a)
        achi_kho.dong_phien(ktv_a)

        # KTV-A phai ve mac dinh va dong phien (ca sid_a lan ktv_a)
        self.assertFalse(achi_kho.phien_hop_le(sid_a))
        self.assertFalse(achi_kho.phien_hop_le(ktv_a))
        self.assertEqual(achi_kho.doc("home_wireless.ESSID", sid=ktv_a), "FPT")

        # KTV-B TUYET DOI KHONG bi anh huong
        self.assertTrue(achi_kho.phien_hop_le(sid_b))
        self.assertTrue(achi_kho.phien_hop_le(ktv_b))
        self.assertEqual(achi_kho.doc("home_wireless.ESSID", sid=sid_b), "FPT_KTV_B")
        self.assertEqual(achi_kho.doc("lan.uiViewIPAddr", sid=ktv_b), "192.168.20.1")

    def test_ax3000hv2_and_vigor2927_5000_ktv_mobile_scale_isolation(self):
        import sys
        vg_dir = str(ROOT / "simulators/sim_vigor2927/src")
        if vg_dir not in sys.path:
            sys.path.insert(0, vg_dir)
        import simulators.sim_ax3000hv2.server2 as hv2_srv
        import simulators.sim_vigor2927.src.vg_config_store as vg_store
        import simulators.sim_vigor2927.src.render as vg_render

        self.assertGreaterEqual(hv2_srv._MAX_SESSIONS, 10000)
        self.assertGreaterEqual(vg_store._MAX_SESSIONS, 10000)

        # Mo phong 5.000 KTV cung truy cap dong thoi tren ONT AX3000HV2 va DrayTek Vigor2927
        for i in range(5000):
            hv2_key = f"ktv_mob_hv2_{i}"
            st = hv2_srv.get_client_state(hv2_key)
            st["ESSID"] = f"FPT_HV2_{i}"

            vg_key = f"ktv_mob_vg_{i}"
            vg_store.dat_nguoi_dung_hien_tai(vg_key)
            c_u = vg_store._nap(user_key=vg_key)
            # Khi moi mo trang (chua sua), Copy-On-Write dict phai co 0 trang bi clone
            self.assertEqual(len(dict.keys(c_u["pages"])), 0)

        # Ca 5.000 phien KTV tren AX3000HV2 va Vigor2927 deu phai con nguyen, khong bi evict o muc 3.500
        self.assertGreaterEqual(len(hv2_srv.USER_STATES), 5000)
        self.assertGreaterEqual(len(vg_store.USER_CONFIGS), 5000)
        self.assertEqual(hv2_srv.get_client_state("ktv_mob_hv2_0")["ESSID"], "FPT_HV2_0")
        self.assertEqual(hv2_srv.get_client_state("ktv_mob_hv2_4999")["ESSID"], "FPT_HV2_4999")

        # Kiem tra Copy-On-Write + Bai 8 Port Redirection tren Vigor2927 giua KTV 0 va KTV 4999
        vg_store.dat_nguoi_dung_hien_tai("ktv_mob_vg_0")
        vg_store.dat("doc/ENET.SHT", "sLanIp", "192.168.10.1")
        vg_store.dat("doc/ipnatp1.htm", "_ftc_bai8_snap", {
            "enable": True, "svcName": "Cam_KTV0", "pubPort": "8081", "prvIp": "192.168.10.10", "isSaved": True
        })

        vg_store.dat_nguoi_dung_hien_tai("ktv_mob_vg_4999")
        self.assertNotEqual(vg_store.lay("doc/ENET.SHT", "sLanIp"), "192.168.10.1")
        self.assertIsNone(vg_store.lay("doc/ipnatp1.htm", "_ftc_bai8_snap"))

        vg_store.dat_nguoi_dung_hien_tai("ktv_mob_vg_0")
        self.assertEqual(vg_store.lay("doc/ENET.SHT", "sLanIp"), "192.168.10.1")
        snap_0 = vg_store.lay("doc/ipnatp1.htm", "_ftc_bai8_snap")
        self.assertEqual(snap_0["svcName"], "Cam_KTV0")
        rendered_list = vg_render.sua_ipnatp_list("var aryPtRedirect = ; var str=\"\";")
        self.assertIn("Cam_KTV0", rendered_list)

        # Don dep 5.000 phien test
        for i in range(5000):
            hv2_srv.USER_STATES.pop(f"ktv_mob_hv2_{i}", None)
            hv2_srv._LAST_SEEN.pop(f"ktv_mob_hv2_{i}", None)
            vg_store.USER_CONFIGS.pop(f"ktv_mob_vg_{i}", None)
            vg_store._USER_LAST_SEEN.pop(f"ktv_mob_vg_{i}", None)


if __name__ == "__main__":
    unittest.main()

