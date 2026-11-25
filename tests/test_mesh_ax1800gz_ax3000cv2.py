import http.client
import json
import threading
import unittest
from http.server import ThreadingHTTPServer

import run_all


class TestMeshAx1800GzAx3000Cv2(unittest.TestCase):
    @classmethod
    def setUpClass(cls):
        cls.server = ThreadingHTTPServer(("127.0.0.1", 0), run_all.MasterDispatcher)
        cls.port = cls.server.server_address[1]
        cls.thread = threading.Thread(target=cls.server.serve_forever, daemon=True)
        cls.thread.start()

    @classmethod
    def tearDownClass(cls):
        cls.server.shutdown()
        cls.server.server_close()

    def _req(self, method, path, body=None, headers=None):
        conn = http.client.HTTPConnection("127.0.0.1", self.port, timeout=10)
        hdrs = {
            "X-Mock-User-Role": "DEV",
            "X-KTV-Session-ID": "ktv_ax1800gz_cv2_test",
            "Cookie": "ktv_client_id=ktv_ax1800gz_cv2_test",
        }
        if headers:
            hdrs.update(headers)
        if isinstance(body, (dict, list)):
            body = json.dumps(body).encode("utf-8")
            hdrs.setdefault("Content-Type", "application/json")
        elif isinstance(body, str):
            body = body.encode("utf-8")
        conn.request(method, path, body=body, headers=hdrs)
        resp = conn.getresponse()
        data = resp.read()
        conn.close()
        return resp.status, dict(resp.getheaders()), data

    def _ubus_call(self, node_id, obj, fn, params=None):
        login_payload = {
            "jsonrpc": "2.0",
            "id": 1,
            "method": "call",
            "params": ["00000000000000000000000000000000", "session", "login", {"username": "admin", "password": "admin"}],
        }
        st, _, data = self._req("POST", f"/mesh-node/{node_id}/sim_ax3000c/ubus", login_payload)
        self.assertEqual(st, 200)
        res = json.loads(data.decode("utf-8"))
        result = res.get("result") or []
        sid = result[1]["ubus_rpc_session"] if (len(result) > 1 and isinstance(result[1], dict) and result[1].get("ubus_rpc_session")) else "00000000000000000000000000000001"

        call_payload = {
            "jsonrpc": "2.0",
            "id": 2,
            "method": "call",
            "params": [sid, obj, fn, params or {}],
        }
        st2, _, data2 = self._req("POST", f"/mesh-node/{node_id}/sim_ax3000c/ubus", call_payload)
        self.assertEqual(st2, 200)
        res2 = json.loads(data2.decode("utf-8"))
        result2 = res2.get("result") or []
        self.assertEqual(result2[0], 0, f"ubus {obj}.{fn} error: {res2}")
        return result2[1] if len(result2) > 1 else {}

    def _make_ont_node(self, node_id, name="ONT_AX1800GZ", ip="192.168.1.1", mac="94:87:E0:66:00:18"):
        return {
            "id": node_id,
            "catalogKey": "ax1800gz",
            "simId": "sim_ax1800gz",
            "name": name,
            "model": "AX1800GZ",
            "category": "gateway",
            "role": "master",
            "ip": ip,
            "mac": mac,
            "power": True,
            "firmwareConfig": {
                "ssid": "FPT_AX1800GZ_2G",
                "ssid5g": "FPT_AX1800GZ_5G",
                "password": "Password2G123",
                "password5g": "Password5G123",
                "security": "WPA2-PSK",
                "security2g": "WPA2-PSK",
                "security5g": "WPA2-PSK",
                "lanIp": ip,
                "meshRole": "Controller",
                "meshEnabled": True,
            },
        }

    def _make_ap_node(self, node_id, name="AP_AX3000C", ip="192.168.1.200", mac="5C:1A:6F:C3:A2:61"):
        return {
            "id": node_id,
            "catalogKey": "ax3000c",
            "simId": "sim_ax3000c",
            "name": name,
            "model": "AX3000C",
            "category": "ap",
            "role": "slave",
            "ip": ip,
            "mac": mac,
            "power": True,
            "firmwareConfig": {
                "ssid": "AP-Default-2G",
                "ssid5g": "AP-Default-5G",
                "password": "APPassword",
                "password5g": "APPassword",
                "lanIp": ip,
                "meshRole": "Agent",
                "opMode": "ap",
            },
        }

    def test_1_lan_mesh_connection_and_ip_assignment(self):
        """When AX1800GZ is wired LAN-to-LAN with AX3000C V2, AX3000C V2 becomes Mesh Agent (192.168.1.200)."""
        ont = self._make_ont_node("ont_gz1")
        ap = self._make_ap_node("ap_c1")
        link = {
            "id": "link_lan_lan_1",
            "srcId": "ont_gz1",
            "srcPort": "LAN1_1GE",
            "tgtId": "ap_c1",
            "tgtPort": "LAN1_1GE",
            "cableType": "ETH_CAT6A",
            "speedMbps": 1000,
        }
        st, _, data = self._req(
            "POST",
            "/api/mesh-lab/sync-topology",
            body={"nodes": [ont, ap], "links": [link], "action": "sync"},
        )
        self.assertEqual(st, 200)
        res = json.loads(data.decode("utf-8"))
        sync_res = res.get("adapter_sync", {})
        configs = sync_res.get("node_configs", {})
        self.assertEqual(sync_res.get("sync_modes", {}).get("ap_c1"), "ap_mesh")
        self.assertEqual(configs.get("ont_gz1", {}).get("lanIp"), "192.168.1.1")
        self.assertEqual(configs.get("ont_gz1", {}).get("meshRole"), "Controller")
        self.assertEqual(configs.get("ap_c1", {}).get("lanIp"), "192.168.1.200")
        self.assertEqual(configs.get("ap_c1", {}).get("gatewayIp"), "192.168.1.1")
        self.assertEqual(configs.get("ap_c1", {}).get("meshRole"), "Agent")

    def test_2_wifi_ssid_and_password_sync(self):
        """Wi-Fi credentials from AX1800GZ (2.4G & 5G) propagate directly to AX3000C V2."""
        ont = self._make_ont_node("ont_gz2")
        ap = self._make_ap_node("ap_c2")
        link = {
            "id": "link_lan_lan_2",
            "srcId": "ont_gz2",
            "srcPort": "LAN1_1GE",
            "tgtId": "ap_c2",
            "tgtPort": "LAN1_1GE",
            "cableType": "ETH_CAT6A",
            "speedMbps": 1000,
        }
        st, _, _ = self._req(
            "POST",
            "/api/mesh-lab/sync-topology",
            body={"nodes": [ont, ap], "links": [link], "action": "sync"},
        )
        self.assertEqual(st, 200)

        # Query AX3000C V2 Wi-Fi config via ubus
        wifi_res = self._ubus_call("ap_c2", "data_repo.weboui", "wifi_get")
        host_2g = wifi_res.get("host", {}).get("2G", {})
        host_5g = wifi_res.get("host", {}).get("5G", {})

        self.assertEqual(host_2g.get("ssid"), "FPT_AX1800GZ_2G")
        self.assertEqual(host_2g.get("key"), "Password2G123")
        self.assertEqual(host_5g.get("ssid"), "FPT_AX1800GZ_5G")
        self.assertEqual(host_5g.get("key"), "Password5G123")

    def test_3_easymesh_topology_on_both_devices(self):
        """EasyMesh topology structures on both AX1800GZ and AX3000C V2 reflect Controller-Agent relationship."""
        ont = self._make_ont_node("ont_gz3")
        ap = self._make_ap_node("ap_c3")
        link = {
            "id": "link_lan_lan_3",
            "srcId": "ont_gz3",
            "srcPort": "LAN2_1GE",
            "tgtId": "ap_c3",
            "tgtPort": "LAN1_1GE",
            "cableType": "ETH_CAT6A",
            "speedMbps": 1000,
        }
        st, _, _ = self._req(
            "POST",
            "/api/mesh-lab/sync-topology",
            body={"nodes": [ont, ap], "links": [link], "action": "sync"},
        )
        self.assertEqual(st, 200)

        # 1. On AX3000C V2: Check network topology via ubus
        topo_res = self._ubus_call("ap_c3", "network", "topology")
        self.assertTrue(isinstance(topo_res, dict))
        # Master node should exist with MAC matching AX1800GZ
        master_entry = next((v for v in topo_res.values() if isinstance(v, dict) and "backhaul" not in v), None)
        self.assertIsNotNone(master_entry, "No Controller entry found in AX3000C V2 topology")
        self.assertEqual(master_entry.get("ip"), "192.168.1.1")
        self.assertEqual(master_entry.get("hostname"), "ONT_AX1800GZ")

        # Slave/Agent entry in AX3000C V2
        agent_entry = next((v for v in topo_res.values() if isinstance(v, dict) and "backhaul" in v), None)
        self.assertIsNotNone(agent_entry, "No Agent entry found in AX3000C V2 topology")
        self.assertEqual(agent_entry.get("ip"), "192.168.1.200")
        bh = agent_entry.get("backhaul", {})
        self.assertEqual(bh.get("connect_method"), "eth1.5")
        self.assertEqual(bh.get("mac"), "94:87:E0:66:00:18")

        # 2. On AX1800GZ: Check topo_lua endpoint
        st_gz, _, data_gz = self._req("GET", "/mesh-node/ont_gz3/sim_ax1800gz/?_type=menuData&_tag=topo_lua.lua")
        self.assertEqual(st_gz, 200)
        gz_topo = json.loads(data_gz.decode("utf-8"))
        self.assertEqual(gz_topo.get("master", {}).get("IpAddr"), "192.168.1.1")
        self.assertEqual(len(gz_topo.get("slave", [])), 1)
        self.assertEqual(gz_topo["slave"][0].get("IpAddr"), "192.168.1.200")

    def test_4_live_web_gui_save_and_sync(self):
        """Saving Wi-Fi in AX1800GZ Web GUI dynamically synchronizes new SSID to AX3000C V2."""
        ont = self._make_ont_node("ont_gz4")
        ap = self._make_ap_node("ap_c4")
        link = {
            "id": "link_lan_lan_4",
            "srcId": "ont_gz4",
            "srcPort": "LAN1_1GE",
            "tgtId": "ap_c4",
            "tgtPort": "LAN1_1GE",
            "cableType": "ETH_CAT6A",
            "speedMbps": 1000,
        }
        st, _, _ = self._req(
            "POST",
            "/api/mesh-lab/sync-topology",
            body={"nodes": [ont, ap], "links": [link], "action": "sync"},
        )
        self.assertEqual(st, 200)

        # Simulate KTV saving new Wi-Fi credentials in AX1800GZ
        st_put, _, _ = self._req(
            "POST",
            "/mesh-node/ont_gz4/sim_ax1800gz/api/sim-state",
            body={
                "wlan24": {"enable": "1", "ssid": "FPT_AX1800GZ_NEW2G", "password": "NewSecretPass2G"},
                "wlan5": {"enable": "1", "ssid": "FPT_AX1800GZ_NEW5G", "password": "NewSecretPass5G"},
            },
        )
        self.assertEqual(st_put, 200)

        # Trigger sync-topology with prefer_backend_source
        st_sync, _, _ = self._req(
            "POST",
            "/api/mesh-lab/sync-topology",
            body={
                "nodes": [ont, ap],
                "links": [link],
                "source_node_id": "ont_gz4",
                "prefer_backend_source": True,
                "action": "sync",
            },
        )
        self.assertEqual(st_sync, 200)

        # Verify AX3000C V2 received the new live credentials
        wifi_res = self._ubus_call("ap_c4", "data_repo.weboui", "wifi_get")
        host_2g = wifi_res.get("host", {}).get("2G", {})
        host_5g = wifi_res.get("host", {}).get("5G", {})
        self.assertEqual(host_2g.get("ssid"), "FPT_AX1800GZ_NEW2G")
        self.assertEqual(host_2g.get("key"), "NewSecretPass2G")
        self.assertEqual(host_5g.get("ssid"), "FPT_AX1800GZ_NEW5G")
        self.assertEqual(host_5g.get("key"), "NewSecretPass5G")

    def test_5_wan_port_fallback_router_mode(self):
        """Plugging cable into AX3000C V2's WAN port falls back to Router mode (not Mesh Agent)."""
        ont = self._make_ont_node("ont_gz5")
        ap = self._make_ap_node("ap_c5")
        link_wan = {
            "id": "link_lan_wan_5",
            "srcId": "ont_gz5",
            "srcPort": "LAN1_1GE",
            "tgtId": "ap_c5",
            "tgtPort": "WAN",
            "cableType": "ETH_CAT6A",
            "speedMbps": 1000,
        }
        st, _, data = self._req(
            "POST",
            "/api/mesh-lab/sync-topology",
            body={"nodes": [ont, ap], "links": [link_wan], "action": "sync"},
        )
        self.assertEqual(st, 200)
        res = json.loads(data.decode("utf-8"))
        sync_res = res.get("adapter_sync", {})
        configs = sync_res.get("node_configs", {})
        self.assertEqual(sync_res.get("sync_modes", {}).get("ap_c5"), "router_wan")
        ap_cfg = configs.get("ap_c5", {})
        self.assertTrue(ap_cfg.get("wanIp", "").startswith("192.168.1."))
        self.assertEqual(ap_cfg.get("wanGateway"), "192.168.1.1")

    def test_6_web_gui_display_and_views(self):
        """Verify Web GUI for ONT AX1800GZ loads successfully with autologin and key views."""
        # 1. Main Dashboard (root.html with autologin)
        st, _, data = self._req("GET", "/mesh-node/ont_gui/sim_ax1800gz/?autologin=1")
        self.assertEqual(st, 200)
        body = data.decode("utf-8", "ignore")
        self.assertIn("commPageContainer", body)
        self.assertIn("_sessionTmpToken", body)

        # 2. Home view (home_t.lp -> homePage.html)
        st_home, _, data_home = self._req("GET", "/mesh-node/ont_gui/sim_ax1800gz/?_type=menuView&_tag=home_t.lp")
        self.assertEqual(st_home, 200)
        self.assertTrue(len(data_home) > 1000)

        # 3. Topology view (topo_t.lp -> mmTopology.html)
        st_topo, _, data_topo = self._req("GET", "/mesh-node/ont_gui/sim_ax1800gz/?_type=menuView&_tag=topo_t.lp")
        self.assertEqual(st_topo, 200)
        self.assertTrue(len(data_topo) > 1000)

        # 4. Wi-Fi view (wlanBasic)
        st_wifi, _, data_wifi = self._req("GET", "/mesh-node/ont_gui/sim_ax1800gz/?_type=menuView&_tag=wlanBasic")
        self.assertEqual(st_wifi, 200)
        self.assertTrue(len(data_wifi) > 1000)

    def test_7_separate_5g_configuration_sync(self):
        """When only 5G Wi-Fi is modified on AX1800GZ, AX3000C V2 updates its 5G SSID without affecting 2.4G."""
        ont = self._make_ont_node("ont_gz7")
        ap = self._make_ap_node("ap_c7")
        link = {
            "id": "link_lan_lan_7",
            "srcId": "ont_gz7",
            "srcPort": "LAN1_1GE",
            "tgtId": "ap_c7",
            "tgtPort": "LAN1_1GE",
            "cableType": "ETH_CAT6A",
            "speedMbps": 1000,
        }
        st, _, _ = self._req(
            "POST",
            "/api/mesh-lab/sync-topology",
            body={"nodes": [ont, ap], "links": [link], "action": "sync"},
        )
        self.assertEqual(st, 200)

        # Update AX1800GZ state with separate 5G configuration
        st_put, _, _ = self._req(
            "POST",
            "/mesh-node/ont_gz7/sim_ax1800gz/api/sim-state",
            body={
                "wlan24": {"enable": "1", "ssid": "FPT_AX1800GZ_2G", "password": "Password2G123"},
                "wlan5": {"enable": "1", "ssid": "FPT_AX1800GZ_5G_ULTRA", "password": "UltraPassword5G99"},
            },
        )
        self.assertEqual(st_put, 200)

        # Trigger sync-topology
        st_sync, _, _ = self._req(
            "POST",
            "/api/mesh-lab/sync-topology",
            body={
                "nodes": [ont, ap],
                "links": [link],
                "source_node_id": "ont_gz7",
                "prefer_backend_source": True,
                "action": "sync",
            },
        )
        self.assertEqual(st_sync, 200)

        # Verify AX3000C V2 received distinct 2.4G and 5G configurations
        wifi_res = self._ubus_call("ap_c7", "data_repo.weboui", "wifi_get")
        host_2g = wifi_res.get("host", {}).get("2G", {})
        host_5g = wifi_res.get("host", {}).get("5G", {})
        self.assertEqual(host_2g.get("ssid"), "FPT_AX1800GZ_2G")
        self.assertEqual(host_2g.get("key"), "Password2G123")
        self.assertEqual(host_5g.get("ssid"), "FPT_AX1800GZ_5G_ULTRA")
        self.assertEqual(host_5g.get("key"), "UltraPassword5G99")

    def test_8_login_page_display_and_logout(self):
        """Verify Login page displays correctly when accessed directly or via logout, and login entry functions."""
        # 1. Access login page with logout=1
        st_login, _, data_login = self._req("GET", "/mesh-node/ont_login_test/sim_ax1800gz/login?logout=1")
        self.assertEqual(st_login, 200)
        body_login = data_login.decode("utf-8", "ignore")
        self.assertIn("loginWrapper", body_login)
        self.assertIn("Frm_Username", body_login)
        self.assertIn("Frm_Password", body_login)
        self.assertIn("LoginId", body_login)

        # 2. Get login token (nonce)
        st_tok, _, data_tok = self._req("GET", "/mesh-node/ont_login_test/sim_ax1800gz/?_type=loginData&_tag=login_token")
        self.assertEqual(st_tok, 200)
        tok_body = data_tok.decode("utf-8", "ignore")
        self.assertIn("<ajax_response_xml_root>", tok_body)

        # 3. Perform login post with admin / admin
        import hashlib
        nonce = tok_body.replace("<ajax_response_xml_root>", "").replace("</ajax_response_xml_root>", "").strip()
        pwd_hash = hashlib.sha256(("admin" + nonce).encode("utf-8")).hexdigest()
        st_auth, _, data_auth = self._req(
            "POST",
            "/mesh-node/ont_login_test/sim_ax1800gz/?_type=loginData&_tag=login_entry",
            body={"action": "login", "Username": "admin", "Password": pwd_hash},
        )
        self.assertEqual(st_auth, 200)
        auth_json = json.loads(data_auth.decode("utf-8"))
        self.assertTrue(auth_json.get("login_need_refresh", False))
        self.assertTrue(len(auth_json.get("sess_token", "")) > 0)

    def test_9_menu_bar_safety_guard_and_resilience(self):
        """Verify root.html and unauth_root.html contain safety guard calculations and resize reflow handlers for Class 1 Menu."""
        # 1. Check root.html content
        st_root, _, data_root = self._req("GET", "/mesh-node/ont_menu_test/sim_ax1800gz/?autologin=1")
        self.assertEqual(st_root, 200)
        body_root = data_root.decode("utf-8", "ignore")
        self.assertIn("if (!navBarWidth || navBarWidth < 300)", body_root)
        self.assertIn("if (!menuWidth || menuWidth < 120)", body_root)
        self.assertIn("class1_resize_attached", body_root)

        # 2. Check unauth_root.html content (Login page)
        st_unauth, _, data_unauth = self._req("GET", "/mesh-node/ont_menu_test/sim_ax1800gz/login?logout=1")
        self.assertEqual(st_unauth, 200)
        body_unauth = data_unauth.decode("utf-8", "ignore")
        self.assertIn("if (!navBarWidth || navBarWidth < 300)", body_unauth)
        self.assertIn("fake_class1_resize_attached", body_unauth)


if __name__ == "__main__":
    unittest.main()
