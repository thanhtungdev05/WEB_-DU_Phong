import unittest
import mesh_zte_engine
from simulators.sim_be12000.src.server import GLOBAL_SIM, cap_nhat_topology_mesh


class TestMeshZteTopology(unittest.TestCase):
    def setUp(self):
        mesh_zte_engine.reset_lab()

    def tearDown(self):
        mesh_zte_engine.reset_lab()

    def test_initial_state(self):
        st = mesh_zte_engine.get_state()
        self.assertTrue(st["ap_power"])
        self.assertEqual(st["link_type"], "ETH")
        self.assertEqual(st["mesh_status"], "ONLINE_ETH")
        self.assertEqual(st["ont_model"], "BE12000Z")
        self.assertEqual(st["ap_model"], "BE15000Z")
        self.assertEqual(st["ap_synced_ssid"], st["ont_wifi_ssid"])

    def test_link_changes(self):
        # 1. Chuyển sang Wi-Fi MLO
        st = mesh_zte_engine.set_link_type("WIFI")
        self.assertEqual(st["link_type"], "WIFI")
        self.assertEqual(st["mesh_status"], "ONLINE_WIFI")

        # Kiểm tra store BE12000
        raw = GLOBAL_SIM["store"]._state["jsonThoDataTags"]["topo_lua.lua"]["raw"]
        self.assertEqual(len(raw["slave"]), 1)
        self.assertEqual(raw["slave"][0]["DeviceName"], "BE15000Z")
        self.assertEqual(raw["slave"][0]["AccessType"], "WIFI")

        # 2. Rút dây (DISCONNECTED)
        st = mesh_zte_engine.set_link_type("DISCONNECTED")
        self.assertEqual(st["link_type"], "NONE")
        self.assertEqual(st["mesh_status"], "OFFLINE")
        raw = GLOBAL_SIM["store"]._state["jsonThoDataTags"]["topo_lua.lua"]["raw"]
        self.assertEqual(len(raw["slave"]), 0)

        # 3. Cắm lại cáp LAN (ETH)
        st = mesh_zte_engine.set_link_type("ETH")
        self.assertEqual(st["link_type"], "ETH")
        self.assertEqual(st["mesh_status"], "ONLINE_ETH")
        raw = GLOBAL_SIM["store"]._state["jsonThoDataTags"]["topo_lua.lua"]["raw"]
        self.assertEqual(len(raw["slave"]), 1)
        self.assertEqual(raw["slave"][0]["AccessType"], "ETH")

    def test_power_toggle(self):
        st = mesh_zte_engine.set_ap_power(False)
        self.assertFalse(st["ap_power"])
        self.assertEqual(st["mesh_status"], "POWER_OFF")

        # Khi tắt nguồn, controller không thấy slave
        raw = GLOBAL_SIM["store"]._state["jsonThoDataTags"]["topo_lua.lua"]["raw"]
        self.assertEqual(len(raw["slave"]), 0)

        # Bật lại nguồn
        st = mesh_zte_engine.set_ap_power(True)
        self.assertTrue(st["ap_power"])
        self.assertEqual(st["mesh_status"], "ONLINE_ETH")

    def test_wifi_sync(self):
        new_ssid = "FPT-Telecom-WiFi7-Test"
        new_pass = "MeshPass@2026"
        st = mesh_zte_engine.update_ont_wifi(new_ssid, new_pass)
        self.assertEqual(st["ont_wifi_ssid"], new_ssid)
        self.assertEqual(st["ont_wifi_key"], new_pass)
        self.assertEqual(st["ap_synced_ssid"], new_ssid)

    def test_grading_evaluation(self):
        # Trạng thái ban đầu đầy đủ chuẩn FPT
        res = mesh_zte_engine.evaluate_grading()
        self.assertEqual(res["total_score"], 100)
        self.assertTrue(res["all_passed"])

        # Nếu rút dây ngắt kết nối
        mesh_zte_engine.set_link_type("DISCONNECTED")
        res_dis = mesh_zte_engine.evaluate_grading()
        self.assertLess(res_dis["total_score"], 100)
        self.assertFalse(res_dis["all_passed"])


    def test_packet_tracer_port_wiring(self):
        # 1. Cắm tối ưu: LAN 1 (10GE) -> WAN (2.5GE)
        st = mesh_zte_engine.connect_ports("LAN1_10GE", "WAN_25GE", "CAT6A")
        self.assertEqual(st["link_type"], "ETH")
        self.assertEqual(st["bandwidth_mbps"], 2500)
        self.assertTrue(st["is_optimal_wiring"])
        self.assertIsNone(st["port_warning"])

        # 2. Cắm nghẽn: LAN 2 (1GE) -> WAN (2.5GE)
        st_bot = mesh_zte_engine.connect_ports("LAN2_1GE", "WAN_25GE", "CAT6A")
        self.assertEqual(st_bot["link_type"], "ETH")
        self.assertEqual(st_bot["bandwidth_mbps"], 1000)
        self.assertFalse(st_bot["is_optimal_wiring"])
        self.assertIsNotNone(st_bot["port_warning"])

        # 3. Rút dây -> failover sang Wi-Fi 7 MLO (1200 Mbps)
        st_unplug = mesh_zte_engine.connect_ports("NONE", "NONE", "NONE")
        self.assertEqual(st_unplug["link_type"], "WIFI")
        self.assertEqual(st_unplug["bandwidth_mbps"], 1200)

    def test_diagnostic_tools(self):
        # Ping Gateway
        p_gw = mesh_zte_engine.run_ping("192.168.1.1")
        self.assertTrue(p_gw["success"])
        self.assertEqual(p_gw["loss_pct"], 0)
        self.assertIn("Reply from 192.168.1.1", p_gw["output"])

        # Ping AP
        p_ap = mesh_zte_engine.run_ping("192.168.1.100")
        self.assertTrue(p_ap["success"])

        # Speedtest khi kết nối tối ưu
        mesh_zte_engine.connect_ports("LAN1_10GE", "WAN_25GE", "CAT6A")
        sp = mesh_zte_engine.run_speedtest()
        self.assertTrue(sp["success"])
        self.assertGreater(sp["download_mbps"], 2000)

        # ARP & Traceroute
        arp = mesh_zte_engine.run_arp()
        self.assertIn("192.168.1.1", arp["output"])
        tr = mesh_zte_engine.run_traceroute("8.8.8.8")
        self.assertIn("Trace complete", tr["output"])

    def test_missions_evaluation(self):
        m = mesh_zte_engine.get_missions()
        self.assertEqual(m["total"], 6)
        self.assertGreaterEqual(m["completed_count"], 4)
        self.assertIn("progress_percent", m)


class TestMeshZteDispatcherApi(unittest.TestCase):
    @classmethod
    def setUpClass(cls):
        import sys
        import http.client
        import json
        import threading
        from http.server import ThreadingHTTPServer

        cls.http = http.client
        cls.json = json

        _orig_argv = sys.argv
        try:
            sys.argv = [sys.argv[0]]
            import run_all
        finally:
            sys.argv = _orig_argv

        cls.server = ThreadingHTTPServer(('127.0.0.1', 0), run_all.MasterDispatcher)
        cls.thread = threading.Thread(target=cls.server.serve_forever, daemon=True)
        cls.thread.start()
        cls.port = cls.server.server_address[1]

    @classmethod
    def tearDownClass(cls):
        cls.server.shutdown()
        cls.server.server_close()
        cls.thread.join(timeout=5)

    def setUp(self):
        mesh_zte_engine.reset_lab()

    def test_mesh_lab_html_page(self):
        conn = self.http.HTTPConnection('127.0.0.1', self.port, timeout=5)
        conn.request('GET', '/mesh-lab.html')
        res = conn.getresponse()
        body = res.read().decode('utf-8')
        conn.close()

        self.assertEqual(res.status, 200)
        self.assertIn("Mesh Topology Lab", body)
        self.assertIn("BE12000Z", body)
        self.assertIn("BE15000Z", body)

    def test_api_status_and_actions(self):
        conn = self.http.HTTPConnection('127.0.0.1', self.port, timeout=5)

        # 1. GET /api/mesh-lab/status
        conn.request('GET', '/api/mesh-lab/status')
        res = conn.getresponse()
        data = self.json.loads(res.read().decode('utf-8'))
        self.assertEqual(res.status, 200)
        self.assertEqual(data.get("link_type"), "ETH")
        self.assertEqual(data.get("mesh_status"), "ONLINE_ETH")

        # 2. POST /api/mesh-lab/link (chuyển sang WIFI)
        body = self.json.dumps({"link_type": "WIFI"}).encode('utf-8')
        conn.request('POST', '/api/mesh-lab/link', body=body, headers={'Content-Type': 'application/json'})
        res = conn.getresponse()
        data = self.json.loads(res.read().decode('utf-8'))
        self.assertEqual(res.status, 200)
        self.assertEqual(data.get("link_type"), "WIFI")
        self.assertEqual(data.get("mesh_status"), "ONLINE_WIFI")

        # 3. POST /api/mesh-lab/connect-ports
        body = self.json.dumps({"ont_port": "LAN1_10GE", "ap_port": "WAN_25GE", "cable_type": "CAT6A"}).encode('utf-8')
        conn.request('POST', '/api/mesh-lab/connect-ports', body=body, headers={'Content-Type': 'application/json'})
        res = conn.getresponse()
        data = self.json.loads(res.read().decode('utf-8'))
        self.assertEqual(res.status, 200)
        self.assertEqual(data.get("bandwidth_mbps"), 2500)
        self.assertTrue(data.get("is_optimal_wiring"))

        # 4. POST /api/mesh-lab/ping
        body = self.json.dumps({"target": "192.168.1.1"}).encode('utf-8')
        conn.request('POST', '/api/mesh-lab/ping', body=body, headers={'Content-Type': 'application/json'})
        res = conn.getresponse()
        data = self.json.loads(res.read().decode('utf-8'))
        self.assertEqual(res.status, 200)
        self.assertTrue(data.get("success"))

        # 5. POST /api/mesh-lab/speedtest
        conn.request('POST', '/api/mesh-lab/speedtest', body=b'{}', headers={'Content-Type': 'application/json'})
        res = conn.getresponse()
        data = self.json.loads(res.read().decode('utf-8'))
        self.assertEqual(res.status, 200)
        self.assertTrue(data.get("success"))

        # 6. GET /api/mesh-lab/missions
        conn.request('GET', '/api/mesh-lab/missions')
        res = conn.getresponse()
        data = self.json.loads(res.read().decode('utf-8'))
        self.assertEqual(res.status, 200)
        self.assertEqual(data.get("total"), 6)

        # 7. POST /api/mesh-lab/grade
        conn.request('POST', '/api/mesh-lab/grade')
        res = conn.getresponse()
        data = self.json.loads(res.read().decode('utf-8'))
        self.assertEqual(res.status, 200)
        self.assertIn("rules", data)
        self.assertIn("score", data)

        conn.close()

    def test_mesh_lab_api_forbidden_for_unauthorized_cookie(self):
        conn = self.http.HTTPConnection('127.0.0.1', self.port, timeout=5)

        # 1. Tài khoản KTV bị chặn với 403 Forbidden
        conn.request('GET', '/api/mesh-lab/status', headers={'X-Mock-User-Role': 'KTV'})
        res = conn.getresponse()
        data = self.json.loads(res.read().decode('utf-8'))
        self.assertEqual(res.status, 403)
        self.assertEqual(data.get("code"), "mesh_lab_beta_restricted")
        self.assertIn("thử nghiệm", data.get("message", ""))

        # 2. Tài khoản ADMIN cũng bị chặn với 403 Forbidden (chỉ mở cho DEV)
        conn.request('GET', '/api/mesh-lab/status', headers={'X-Mock-User-Role': 'ADMIN'})
        res_admin = conn.getresponse()
        data_admin = self.json.loads(res_admin.read().decode('utf-8'))
        self.assertEqual(res_admin.status, 403)
        self.assertEqual(data_admin.get("code"), "mesh_lab_beta_restricted")

        # 3. Chỉ tài khoản DEV được phép truy cập
        conn.request('GET', '/api/mesh-lab/status', headers={'X-Mock-User-Role': 'DEV'})
        res_dev = conn.getresponse()
        data_dev = self.json.loads(res_dev.read().decode('utf-8'))
        self.assertEqual(res_dev.status, 200)
        self.assertIn("mesh_status", data_dev)

        conn.close()

    def test_mesh_lab_rbac_frontend_contracts(self):
        import pathlib
        root = pathlib.Path(__file__).resolve().parents[1]

        portal_html = (root / "portal.html").read_text(encoding="utf-8")
        app_js = (root / "app.js").read_text(encoding="utf-8")
        mesh_lab_html = (root / "mesh-lab.html").read_text(encoding="utf-8")

        # 1. Nút Lab Đấu Nối trên Portal phải ẩn mặc định (display: none)
        self.assertIn('id="btn-mesh-lab"', portal_html)
        self.assertIn('style="display: none;"', portal_html)

        # 2. app.js chỉ mở nút cho DEV
        self.assertIn("role === 'DEV'", app_js)
        self.assertIn("btnMeshLab.style.display", app_js)

        # 3. mesh-lab.html có màn hình hạn chế quyền truy cập cho tài khoản không phải DEV
        self.assertIn('id="access-restricted-screen"', mesh_lab_html)
        self.assertIn('Giới Hạn Quyền Truy Cập Phòng Lab', mesh_lab_html)
        self.assertIn('/api/index.php/auth/session', mesh_lab_html)
        self.assertIn("role === 'DEV'", mesh_lab_html)


if __name__ == "__main__":
    import threading
    unittest.main()


