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

        # 3. POST /api/mesh-lab/power (tắt nguồn AP)
        body = self.json.dumps({"power": False}).encode('utf-8')
        conn.request('POST', '/api/mesh-lab/power', body=body, headers={'Content-Type': 'application/json'})
        res = conn.getresponse()
        data = self.json.loads(res.read().decode('utf-8'))
        self.assertEqual(res.status, 200)
        self.assertFalse(data.get("ap_power"))
        self.assertEqual(data.get("mesh_status"), "POWER_OFF")

        # 4. POST /api/mesh-lab/grade
        conn.request('POST', '/api/mesh-lab/grade')
        res = conn.getresponse()
        data = self.json.loads(res.read().decode('utf-8'))
        self.assertEqual(res.status, 200)
        self.assertIn("rules", data)
        self.assertIn("score", data)

        conn.close()


if __name__ == "__main__":
    import threading
    unittest.main()

