import http.client
import json
import threading
import unittest
from http.server import ThreadingHTTPServer

import run_all


class TestMeshAx3000SAx3000Cv2(unittest.TestCase):
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
            "X-KTV-Session-ID": "ktv_ax3000s_cv2_test",
            "Cookie": "ktv_client_id=ktv_ax3000s_cv2_test",
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

    def _make_ont_node(self, node_id, name="ONT_AX3000S", ip="192.168.1.1", mac="AC:9E:17:10:20:30"):
        return {
            "id": node_id,
            "catalogKey": "ax3000s",
            "simId": "sim_ax3000s",
            "name": name,
            "model": "AX3000S",
            "category": "gateway",
            "role": "master",
            "ip": ip,
            "mac": mac,
            "power": True,
            "firmwareConfig": {
                "ssid": "FPT_AX3000S_2G",
                "ssid5g": "FPT_AX3000S_5G",
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
        """When AX3000S is wired LAN-to-LAN with AX3000C V2, AX3000C V2 becomes Mesh Agent (192.168.1.200)."""
        ont = self._make_ont_node("ont_s1")
        ap = self._make_ap_node("ap_c1")
        link = {
            "id": "link_lan_lan_1",
            "srcId": "ont_s1",
            "srcPort": "LAN1",
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
        self.assertEqual(configs.get("ont_s1", {}).get("lanIp"), "192.168.1.1")
        self.assertEqual(configs.get("ont_s1", {}).get("meshRole"), "Controller")
        self.assertEqual(configs.get("ap_c1", {}).get("lanIp"), "192.168.1.200")
        self.assertEqual(configs.get("ap_c1", {}).get("gatewayIp"), "192.168.1.1")
        self.assertEqual(configs.get("ap_c1", {}).get("meshRole"), "Agent")

    def test_2_wifi_ssid_and_password_sync(self):
        """Wi-Fi credentials from AX3000S (2.4G & 5G) propagate directly to AX3000C V2."""
        ont = self._make_ont_node("ont_s2")
        ap = self._make_ap_node("ap_c2")
        link = {
            "id": "link_lan_lan_2",
            "srcId": "ont_s2",
            "srcPort": "LAN1",
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

        self.assertEqual(host_2g.get("ssid"), "FPT_AX3000S_2G")
        self.assertEqual(host_2g.get("key"), "Password2G123")
        self.assertEqual(host_5g.get("ssid"), "FPT_AX3000S_5G")
        self.assertEqual(host_5g.get("key"), "Password5G123")

    def test_3_easymesh_topology_on_both_devices(self):
        """EasyMesh topology structures on both AX3000S and AX3000C V2 reflect Controller-Agent relationship."""
        ont = self._make_ont_node("ont_s3")
        ap = self._make_ap_node("ap_c3")
        link = {
            "id": "link_lan_lan_3",
            "srcId": "ont_s3",
            "srcPort": "LAN2",
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
        # Master node should exist with MAC matching AX3000S
        master_entry = next((v for v in topo_res.values() if isinstance(v, dict) and "backhaul" not in v), None)
        self.assertIsNotNone(master_entry, "No Controller entry found in AX3000C V2 topology")
        self.assertEqual(master_entry.get("ip"), "192.168.1.1")
        self.assertEqual(master_entry.get("hostname"), "ONT_AX3000S")

        # Slave/Agent entry in AX3000C V2
        agent_entry = next((v for v in topo_res.values() if isinstance(v, dict) and "backhaul" in v), None)
        self.assertIsNotNone(agent_entry, "No Agent entry found in AX3000C V2 topology")
        self.assertEqual(agent_entry.get("ip"), "192.168.1.200")
        bh = agent_entry.get("backhaul", {})
        self.assertEqual(bh.get("connect_method"), "eth1.5")
        self.assertEqual(bh.get("mac"), "AC:9E:17:10:20:30")

        # 2. On AX3000S: Check simulated state
        st_s, _, data_s = self._req("GET", "/mesh-node/ont_s3/sim_ax3000s/api/sim-state")
        self.assertEqual(st_s, 200)
        s_state = json.loads(data_s.decode("utf-8"))
        mesh_info = s_state.get("mesh", {})
        self.assertEqual(mesh_info.get("role"), "Controller")
        self.assertEqual(len(mesh_info.get("nodes", [])), 1)
        self.assertEqual(mesh_info["nodes"][0].get("ip"), "192.168.1.200")

    def test_4_live_web_gui_save_and_sync(self):
        """Saving Wi-Fi in AX3000S Web GUI dynamically synchronizes new SSID to AX3000C V2."""
        ont = self._make_ont_node("ont_s4")
        ap = self._make_ap_node("ap_c4")
        link = {
            "id": "link_lan_lan_4",
            "srcId": "ont_s4",
            "srcPort": "LAN1",
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

        # Simulate KTV saving new Wi-Fi credentials in AX3000S Web GUI
        new_radios = [
            {"band": "2.4G", "ssid": "FPT_Sky_Mesh_2G", "password": "SecretPass2G", "enable": 1},
            {"band": "5G", "ssid": "FPT_Sky_Mesh_5G", "password": "SecretPass5G", "enable": 1},
        ]
        st_put, _, _ = self._req(
            "POST",
            "/mesh-node/ont_s4/sim_ax3000s/api/sim-state",
            body={"radios": new_radios},
        )
        self.assertEqual(st_put, 200)

        # Trigger sync-topology with prefer_backend_source
        st_sync, _, _ = self._req(
            "POST",
            "/api/mesh-lab/sync-topology",
            body={
                "nodes": [ont, ap],
                "links": [link],
                "source_node_id": "ont_s4",
                "prefer_backend_source": True,
                "action": "sync",
            },
        )
        self.assertEqual(st_sync, 200)

        # Verify AX3000C V2 received the new live credentials
        wifi_res = self._ubus_call("ap_c4", "data_repo.weboui", "wifi_get")
        host_2g = wifi_res.get("host", {}).get("2G", {})
        host_5g = wifi_res.get("host", {}).get("5G", {})
        self.assertEqual(host_2g.get("ssid"), "FPT_Sky_Mesh_2G")
        self.assertEqual(host_2g.get("key"), "SecretPass2G")
        self.assertEqual(host_5g.get("ssid"), "FPT_Sky_Mesh_5G")
        self.assertEqual(host_5g.get("key"), "SecretPass5G")

    def test_5_wan_port_fallback_router_mode(self):
        """Plugging cable into AX3000C V2's WAN port falls back to Router mode (not Mesh Agent)."""
        ont = self._make_ont_node("ont_s5")
        ap = self._make_ap_node("ap_c5")
        link_wan = {
            "id": "link_lan_wan_5",
            "srcId": "ont_s5",
            "srcPort": "LAN1",
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

    def test_6_separate_5g_configuration_sync(self):
        """When only 5G Wi-Fi is modified on AX3000S, AX3000C V2 updates its 5G SSID without affecting 2.4G."""
        ont = self._make_ont_node("ont_s6")
        ap = self._make_ap_node("ap_c6")
        link = {
            "id": "link_lan_lan_6",
            "srcId": "ont_s6",
            "srcPort": "LAN1",
            "tgtId": "ap_c6",
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

        # Update AX3000S state with separate 5G configuration
        # Keep 2.4G as FPT_AX3000S_2G, change 5G to FPT_AX3000S_5G_FAST
        new_radios = [
            {"band": "2.4G", "ssid": "FPT_AX3000S_2G", "password": "Password2G123", "enable": 1},
            {"band": "5G", "ssid": "FPT_AX3000S_5G_FAST", "password": "FastPassword5G99", "enable": 1},
        ]
        st_put, _, _ = self._req(
            "POST",
            "/mesh-node/ont_s6/sim_ax3000s/api/sim-state",
            body={"radios": new_radios},
        )
        self.assertEqual(st_put, 200)

        # Trigger sync-topology
        st_sync, _, _ = self._req(
            "POST",
            "/api/mesh-lab/sync-topology",
            body={
                "nodes": [ont, ap],
                "links": [link],
                "source_node_id": "ont_s6",
                "prefer_backend_source": True,
                "action": "sync",
            },
        )
        self.assertEqual(st_sync, 200)

        # Verify AX3000C V2 received distinct 2.4G and 5G configurations
        wifi_res = self._ubus_call("ap_c6", "data_repo.weboui", "wifi_get")
        host_2g = wifi_res.get("host", {}).get("2G", {})
        host_5g = wifi_res.get("host", {}).get("5G", {})
        self.assertEqual(host_2g.get("ssid"), "FPT_AX3000S_2G")
        self.assertEqual(host_2g.get("key"), "Password2G123")
        self.assertEqual(host_5g.get("ssid"), "FPT_AX3000S_5G_FAST")
        self.assertEqual(host_5g.get("key"), "FastPassword5G99")


if __name__ == "__main__":
    unittest.main()
