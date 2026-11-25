import http.client
import json
import threading
import unittest
from http.server import ThreadingHTTPServer

import run_all


class TestMeshAx3000Cv2Pair(unittest.TestCase):
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
            "X-KTV-Session-ID": "ktv_cv2_pair_test",
            "Cookie": "ktv_client_id=ktv_cv2_pair_test",
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

    def _ubus_login(self, node_id):
        payload = {
            "jsonrpc": "2.0",
            "id": 1,
            "method": "call",
            "params": ["00000000000000000000000000000000", "session", "login", {"username": "admin", "password": "admin"}],
        }
        st, _, data = self._req("POST", f"/mesh-node/{node_id}/sim_ax3000c/ubus", payload)
        self.assertEqual(st, 200)
        res = json.loads(data.decode("utf-8"))
        # Extract sid (either from login or fallback to dummy sid accepted by simulator)
        result = res.get("result") or []
        if len(result) > 1 and isinstance(result[1], dict) and result[1].get("ubus_rpc_session"):
            return result[1]["ubus_rpc_session"]
        # Try auto-login via ?autologin=1 or empty session
        st2, _, _ = self._req("GET", f"/mesh-node/{node_id}/sim_ax3000c/?autologin=1")
        self.assertEqual(st2, 200)
        return "00000000000000000000000000000001"

    def _ubus_call(self, node_id, sid, obj, fn, params=None):
        payload = {
            "jsonrpc": "2.0",
            "id": 2,
            "method": "call",
            "params": [sid, obj, fn, params or {}],
        }
        st, _, data = self._req("POST", f"/mesh-node/{node_id}/sim_ax3000c/ubus", payload)
        self.assertEqual(st, 200, f"ubus {obj}.{fn} failed with {st}: {data[:200]}")
        res = json.loads(data.decode("utf-8"))
        result = res.get("result")
        self.assertIsInstance(result, list, f"Unexpected ubus response for {obj}.{fn}: {res}")
        self.assertEqual(result[0], 0, f"ubus {obj}.{fn} returned error code: {res}")
        return result[1] if len(result) > 1 else {}

    def _make_cv2_node(self, node_id, name, mac, ip="192.168.1.200", mesh_role="", fw_extra=None):
        fw = {
            "ssid": "FPT Telecom-0A91",
            "ssid5g": "FPT Telecom-0A91",
            "password": "24c1e15f",
            "password5g": "24c1e15f",
            "security2g": "WPA2-PSK",
            "security5g": "WPA2-PSK",
            "lanIp": ip,
        }
        if mesh_role:
            fw["meshRole"] = mesh_role
        if fw_extra:
            fw.update(fw_extra)
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
            "meshRole": mesh_role,
            "power": True,
            "firmwareConfig": fw,
        }

    def test_01_mesh_lan_defaults_controller_100_1_agent_100_200_and_page18_easymesh_topo(self):
        payload = {
            "nodes": [
                self._make_cv2_node("cv2_ctrl_1", "AX3000CV2_1", "94:F7:17:24:0A:90", ip="192.168.1.200"),
                self._make_cv2_node("cv2_ag_1", "AX3000CV2_2", "5C:1A:6F:C3:A2:61", ip="192.168.1.200"),
                {
                    "id": "pc_client_1",
                    "catalogKey": "laptop_pc",
                    "simId": "",
                    "name": "Admin-PC",
                    "model": "Laptop",
                    "category": "client",
                    "ip": "192.168.100.55",
                    "mac": "D8:43:AE:2E:65:45",
                    "power": True,
                },
            ],
            "links": [
                {
                    "srcId": "cv2_ctrl_1",
                    "srcPort": "LAN1_1GE",
                    "tgtId": "cv2_ag_1",
                    "tgtPort": "LAN1_1GE",
                    "cableType": "ETH_CAT6A",
                    "speed": 1000,
                    "speedMbps": 1000,
                },
                {
                    "srcId": "cv2_ag_1",
                    "srcPort": "LAN2_1GE",
                    "tgtId": "pc_client_1",
                    "tgtPort": "ETH0",
                    "cableType": "ETH_CAT6A",
                    "speed": 1000,
                    "speedMbps": 1000,
                },
            ],
        }
        st, _, data = self._req("POST", "/api/mesh-lab/sync-topology", payload)
        self.assertEqual(st, 200)
        res = json.loads(data.decode("utf-8"))
        ad = res["adapter_sync"]
        self.assertEqual(ad["sync_modes"]["cv2_ctrl_1"], "source")
        self.assertEqual(ad["sync_modes"]["cv2_ag_1"], "ap_mesh")
        self.assertEqual(ad["node_configs"]["cv2_ctrl_1"]["lanIp"], "192.168.100.1")
        self.assertEqual(ad["node_configs"]["cv2_ctrl_1"]["meshRole"], "Controller")
        self.assertEqual(ad["node_configs"]["cv2_ag_1"]["lanIp"], "192.168.100.200")
        self.assertEqual(ad["node_configs"]["cv2_ag_1"]["meshRole"], "Agent")

        # Verify Page 18 EasyMesh Topo backend payload on Controller via real /ubus
        sid = self._ubus_login("cv2_ctrl_1")
        topo = self._ubus_call("cv2_ctrl_1", sid, "network", "topology")
        self.assertEqual(len(topo), 2, f"Expected Controller + Agent in network.topology, got: {list(topo.keys())}")
        self.assertIn("94:F7:17:24:0A:90", topo)
        self.assertIn("5C:1A:6F:C3:A2:61", topo)

        ctrl_entry = topo["94:F7:17:24:0A:90"]
        ag_entry = topo["5C:1A:6F:C3:A2:61"]
        self.assertNotIn("backhaul", ctrl_entry, "Controller must not have backhaul key so vis-network renders router")
        self.assertEqual(ctrl_entry["ip"], "192.168.100.1")
        self.assertEqual(ctrl_entry["modelname"], "AP-AX3000CV2")

        self.assertIsInstance(ag_entry.get("backhaul"), dict, "Agent backhaul must be an object for vis-network")
        self.assertEqual(ag_entry["backhaul"]["connect_method"], "eth1.5")
        self.assertEqual(ag_entry["backhaul"]["mac"], "94:F7:17:24:0A:90")
        self.assertEqual(ag_entry["backhaul"]["mac_connected"], "5C:1A:6F:C3:A2:61")
        self.assertEqual(ag_entry["info"]["eth1.5"]["speed"], "1000")
        self.assertEqual(ag_entry["ip"], "192.168.100.200")
        self.assertEqual(ag_entry["modelname"], "AP-AX3000CV2")
        self.assertEqual(len(ag_entry["legacy_devices"]), 1)
        self.assertEqual(ag_entry["legacy_devices"][0]["hostname"], "Admin-PC")

        de = self._ubus_call("cv2_ctrl_1", sid, "data_repo.data_element", "get")
        wfa_net = de["data"][0]["wfa-dataelements:Network"]
        self.assertEqual(wfa_net["ControllerID"], "94:f7:17:24:0a:90")
        self.assertEqual(wfa_net["NumberOfDevices"], 2)
        self.assertEqual(len(wfa_net["DeviceList"]), 2)

    def test_02_wrong_wan_port_blocks_mesh_and_replug_lan_recovers(self):
        # Case A: Controller LAN1 -> Agent WAN (wrong port!)
        payload = {
            "nodes": [
                self._make_cv2_node("cv2_ctrl_2", "AX3000CV2_Ctrl2", "94:F7:17:24:0B:10", ip="192.168.100.1", mesh_role="Controller"),
                self._make_cv2_node("cv2_ag_2", "AX3000CV2_Ag2", "5C:1A:6F:C3:B2:11", ip="192.168.100.200", mesh_role="Agent"),
            ],
            "links": [
                {
                    "srcId": "cv2_ctrl_2",
                    "srcPort": "LAN1_1GE",
                    "tgtId": "cv2_ag_2",
                    "tgtPort": "WAN_1GE",
                    "cableType": "ETH_CAT6A",
                    "speed": 1000,
                    "speedMbps": 1000,
                }
            ],
        }
        st, _, data = self._req("POST", "/api/mesh-lab/sync-topology", payload)
        self.assertEqual(st, 200)
        res = json.loads(data.decode("utf-8"))
        self.assertEqual(res["adapter_sync"]["sync_modes"]["cv2_ag_2"], "router_wan")

        sid = self._ubus_login("cv2_ctrl_2")
        topo_wrong = self._ubus_call("cv2_ctrl_2", sid, "network", "topology")
        self.assertEqual(len(topo_wrong), 1, "Wrong WAN port must NOT add Agent to Controller EasyMesh Topo")

        # Case B: Controller WAN -> Agent LAN1 (also wrong!)
        payload["links"][0]["srcPort"] = "WAN_1GE"
        payload["links"][0]["tgtPort"] = "LAN1_1GE"
        st, _, data = self._req("POST", "/api/mesh-lab/sync-topology", payload)
        self.assertEqual(st, 200)
        res_w2 = json.loads(data.decode("utf-8"))
        self.assertEqual(res_w2["adapter_sync"]["sync_modes"]["cv2_ag_2"], "router_wan")

        # Case C: Replug cleanly to LAN1_1GE -> LAN3_1GE (valid LAN-LAN recovery!)
        payload["links"][0]["srcPort"] = "LAN1_1GE"
        payload["links"][0]["tgtPort"] = "LAN3_1GE"
        st, _, data = self._req("POST", "/api/mesh-lab/sync-topology", payload)
        self.assertEqual(st, 200)
        res_ok = json.loads(data.decode("utf-8"))
        self.assertEqual(res_ok["adapter_sync"]["sync_modes"]["cv2_ag_2"], "ap_mesh")

        topo_ok = self._ubus_call("cv2_ctrl_2", sid, "network", "topology")
        self.assertEqual(len(topo_ok), 2, "Replugging to LAN1->LAN3 must cleanly recover EasyMesh Topo")

    def test_03_wan_uplink_node_wins_controller_role_and_core_excluded(self):
        payload = {
            "nodes": [
                {
                    "id": "olt_core_3",
                    "catalogKey": "olt_cloud",
                    "simId": "",
                    "name": "FPT_OLT_Core",
                    "model": "OLT_XGSPON",
                    "category": "infra",
                    "role": "core",
                    "ip": "10.0.0.1",
                    "mac": "00:11:22:33:44:55",
                    "power": True,
                },
                self._make_cv2_node("cv2_first_3", "AX3000CV2_First", "94:F7:17:24:0C:01", ip="192.168.1.200"),
                self._make_cv2_node("cv2_wan_3", "AX3000CV2_WithWAN", "94:F7:17:24:0C:02", ip="192.168.1.200"),
            ],
            "links": [
                {
                    "srcId": "olt_core_3",
                    "srcPort": "OPT_GPON",
                    "tgtId": "cv2_wan_3",
                    "tgtPort": "WAN_1GE",
                    "cableType": "ETH_CAT6A",
                    "speed": 1000,
                },
                {
                    "srcId": "cv2_wan_3",
                    "srcPort": "LAN1_1GE",
                    "tgtId": "cv2_first_3",
                    "tgtPort": "LAN1_1GE",
                    "cableType": "ETH_CAT6A",
                    "speed": 1000,
                },
            ],
        }
        st, _, data = self._req("POST", "/api/mesh-lab/sync-topology", payload)
        self.assertEqual(st, 200)
        res = json.loads(data.decode("utf-8"))
        ad = res["adapter_sync"]
        self.assertEqual(ad["sync_modes"]["cv2_wan_3"], "source")
        self.assertEqual(ad["sync_modes"]["cv2_first_3"], "ap_mesh")
        self.assertEqual(ad["node_configs"]["cv2_wan_3"]["meshRole"], "Controller")
        self.assertEqual(ad["node_configs"]["cv2_first_3"]["meshRole"], "Agent")

        sid = self._ubus_login("cv2_wan_3")
        topo = self._ubus_call("cv2_wan_3", sid, "network", "topology")
        self.assertEqual(len(topo), 2, "Core OLT must never be added as an EasyMesh extender")
        self.assertNotIn("00:11:22:33:44:55", topo)

    def test_04_disable_easymesh_via_ubus_drops_agent_and_reenable_restores(self):
        base_payload = {
            "source_node_id": "cv2_ctrl_4",
            "prefer_backend_source": True,
            "nodes": [
                self._make_cv2_node("cv2_ctrl_4", "AX3000CV2_Ctrl4", "94:F7:17:24:0D:01", ip="192.168.100.1", mesh_role="Controller"),
                self._make_cv2_node("cv2_ag_4", "AX3000CV2_Ag4", "5C:1A:6F:C3:D2:02", ip="192.168.100.200", mesh_role="Agent"),
            ],
            "links": [
                {
                    "srcId": "cv2_ctrl_4",
                    "srcPort": "LAN1_1GE",
                    "tgtId": "cv2_ag_4",
                    "tgtPort": "LAN1_1GE",
                    "cableType": "ETH_CAT6A",
                    "speed": 1000,
                }
            ],
        }
        # Initial sync (Mesh ON)
        init_payload = dict(base_payload, prefer_backend_source=False)
        st, _, _ = self._req("POST", "/api/mesh-lab/sync-topology", init_payload)
        self.assertEqual(st, 200)

        # Turn EasyMesh OFF via real /ubus call on Controller
        sid = self._ubus_login("cv2_ctrl_4")
        self._ubus_call("cv2_ctrl_4", sid, "network.wireless.easymesh", "set", {
            "MeshEnabled": False,
            "MeshRole": "Controller",
            "MeshBand": "5G",
            "MeshBSS": "FPT TelecomBH-0A91",
        })
        st, _, data = self._req("POST", "/api/mesh-lab/sync-topology", base_payload)
        self.assertEqual(st, 200)
        res_off = json.loads(data.decode("utf-8"))
        self.assertEqual(res_off["adapter_sync"]["sync_modes"]["cv2_ag_4"], "router_wan")
        self.assertFalse(res_off["adapter_sync"]["node_configs"]["cv2_ctrl_4"]["meshEnabled"])

        topo_off = self._ubus_call("cv2_ctrl_4", sid, "network", "topology")
        self.assertEqual(len(topo_off), 1, "Disabling EasyMesh must remove Agent from EasyMesh Topo")

        # Turn EasyMesh back ON via real /ubus call
        self._ubus_call("cv2_ctrl_4", sid, "network.wireless.easymesh", "set", {
            "MeshEnabled": True,
            "MeshRole": "Controller",
            "MeshBand": "5G",
            "MeshBSS": "FPT TelecomBH-0A91",
        })
        st, _, data = self._req("POST", "/api/mesh-lab/sync-topology", base_payload)
        self.assertEqual(st, 200)
        res_on = json.loads(data.decode("utf-8"))
        self.assertEqual(res_on["adapter_sync"]["sync_modes"]["cv2_ag_4"], "ap_mesh")
        topo_on = self._ubus_call("cv2_ctrl_4", sid, "network", "topology")
        self.assertEqual(len(topo_on), 2, "Re-enabling EasyMesh must restore Agent in EasyMesh Topo")

    def test_05_host_ssid_sync_unified_and_separate_24g_5g(self):
        sync_payload = {
            "source_node_id": "cv2_ctrl_5",
            "prefer_backend_source": True,
            "nodes": [
                self._make_cv2_node("cv2_ctrl_5", "AX3000CV2_Ctrl5", "94:F7:17:24:0E:01", ip="192.168.100.1", mesh_role="Controller"),
                self._make_cv2_node("cv2_ag_5", "AX3000CV2_Ag5", "5C:1A:6F:C3:E2:02", ip="192.168.100.200", mesh_role="Agent"),
            ],
            "links": [
                {
                    "srcId": "cv2_ctrl_5",
                    "srcPort": "LAN1_1GE",
                    "tgtId": "cv2_ag_5",
                    "tgtPort": "LAN1_1GE",
                    "cableType": "ETH_CAT6A",
                    "speed": 1000,
                }
            ],
        }
        # Seed pair
        st, _, _ = self._req("POST", "/api/mesh-lab/sync-topology", dict(sync_payload, prefer_backend_source=False))
        self.assertEqual(st, 200)

        sid_ctrl = self._ubus_login("cv2_ctrl_5")
        sid_ag = self._ubus_login("cv2_ag_5")

        # Part A: Unified Host SSID (Use separate SSID = OFF)
        self._ubus_call("cv2_ctrl_5", sid_ctrl, "data_repo.weboui", "wifi_set", {
            "host": {
                "2G": {"disabled": False, "vap_diff_mode": False, "ssid": "FPT-CV2-Unified", "encryption": "psk2+ccmp", "sae": "0", "key": "Unified8888"},
                "5G": {"disabled": False, "vap_diff_mode": False, "ssid": "FPT-CV2-Unified", "encryption": "psk2+ccmp", "sae": "0", "key": "Unified8888"},
            }
        })
        st, _, data = self._req("POST", "/api/mesh-lab/sync-topology", sync_payload)
        self.assertEqual(st, 200)

        ag_wifi_a = self._ubus_call("cv2_ag_5", sid_ag, "data_repo.weboui", "wifi_get")
        self.assertEqual(ag_wifi_a["host"]["2G"]["ssid"], "FPT-CV2-Unified")
        self.assertEqual(ag_wifi_a["host"]["2G"]["key"], "Unified8888")
        self.assertEqual(ag_wifi_a["host"]["5G"]["ssid"], "FPT-CV2-Unified")
        self.assertEqual(ag_wifi_a["host"]["5G"]["key"], "Unified8888")
        self.assertFalse(ag_wifi_a["host"]["2G"]["vap_diff_mode"])

        # Part B: Separate 2.4G & 5G Host SSID (Use separate SSID = ON)
        self._ubus_call("cv2_ctrl_5", sid_ctrl, "data_repo.weboui", "wifi_set", {
            "host": {
                "2G": {"disabled": False, "vap_diff_mode": True, "ssid": "FPT-CV2-24G", "encryption": "psk2+ccmp", "sae": "0", "key": "Pass24G1111"},
                "5G": {"disabled": False, "vap_diff_mode": True, "ssid": "FPT-CV2-5G", "encryption": "psk2+ccmp", "sae": "1", "key": "Pass5G2222"},
            }
        })
        st, _, data = self._req("POST", "/api/mesh-lab/sync-topology", sync_payload)
        self.assertEqual(st, 200)

        ag_wifi_b = self._ubus_call("cv2_ag_5", sid_ag, "data_repo.weboui", "wifi_get")
        self.assertEqual(ag_wifi_b["host"]["2G"]["ssid"], "FPT-CV2-24G")
        self.assertEqual(ag_wifi_b["host"]["2G"]["key"], "Pass24G1111")
        self.assertEqual(str(ag_wifi_b["host"]["2G"]["sae"]), "0")
        self.assertEqual(ag_wifi_b["host"]["5G"]["ssid"], "FPT-CV2-5G")
        self.assertEqual(ag_wifi_b["host"]["5G"]["key"], "Pass5G2222")
        self.assertEqual(str(ag_wifi_b["host"]["5G"]["sae"]), "1")
        self.assertTrue(ag_wifi_b["host"]["2G"]["vap_diff_mode"])
        self.assertTrue(ag_wifi_b["host"]["5G"]["vap_diff_mode"])

    def test_06_mesh_node_shim_ubus_detection_and_portal_isolation(self):
        st_m, _, data_m = self._req("GET", "/mesh-node/cv2_shim/sim_ax3000c/")
        self.assertEqual(st_m, 200)
        html_m = data_m.decode("utf-8", errors="replace")
        self.assertIn('data-fpt-mesh-node="1"', html_m)
        self.assertIn("network\\.wireless\\.easymesh", html_m)

        st_p, _, data_p = self._req("GET", "/sim_ax3000c/")
        self.assertEqual(st_p, 200)
        html_p = data_p.decode("utf-8", errors="replace")
        self.assertNotIn('data-fpt-mesh-node="1"', html_p, "Standalone portal.html /sim_ax3000c/ must stay isolated")


if __name__ == "__main__":
    unittest.main()
