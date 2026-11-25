import http.client
import json
import threading
import unittest
from http.server import ThreadingHTTPServer

import run_all


class TestMeshAx3000GzV2Ax3000Cv2(unittest.TestCase):
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
            "X-KTV-Session-ID": "ktv_gzv2_cv2_test",
            "Cookie": "ktv_client_id=ktv_gzv2_cv2_test",
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

    def _zte_login(self, node_id):
        st, hdrs, _ = self._req("GET", f"/mesh-node/{node_id}/sim_ax3000gz_v2/?autologin=1")
        self.assertEqual(st, 200)
        cookie_header = hdrs.get("Set-Cookie", "")
        sid = ""
        for part in cookie_header.split(";"):
            if part.strip().startswith("SID="):
                sid = part.strip()
                break
        return sid

    def _make_ont_node(self, node_id, name="ONT_AX3000GZ_V2", ip="192.168.1.1", mac="84:3C:99:29:0E:A5"):
        return {
            "id": node_id,
            "catalogKey": "ax3000gz_v2",
            "simId": "sim_ax3000gz_v2",
            "name": name,
            "model": "AX3000GZ V2",
            "category": "gateway",
            "role": "master",
            "ip": ip,
            "mac": mac,
            "power": True,
            "firmwareConfig": {
                "ssid": "FPT-Telecom-0EA5",
                "ssid5g": "FPT-Telecom-0EA5",
                "password": "Password2G",
                "password5g": "Password5G",
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

    def test_1_mesh_lan_connect_and_topo_lua(self):
        """LAN-LAN connection between AX3000GZ V2 and AX3000C V2 activates EasyMesh slave in topo_lua.lua."""
        ont = self._make_ont_node("ont_gz1")
        ap = self._make_ap_node("ap_c1")
        link = {
            "id": "link_lan_lan",
            "srcId": "ont_gz1",
            "srcPort": "LAN1_1GE",
            "tgtId": "ap_c1",
            "tgtPort": "LAN1_1GE",
            "cableType": "ETH_CAT6A",
            "speedMbps": 1000,
        }

        payload = {
            "nodes": [ont, ap],
            "links": [link],
            "action": "sync",
        }
        st, _, data = self._req("POST", "/api/mesh-lab/sync-topology", body=payload)
        self.assertEqual(st, 200)
        sync_res = json.loads(data.decode("utf-8"))
        self.assertEqual(sync_res["adapter_sync"]["sync_modes"].get("ap_c1"), "ap_mesh")

        # Login to ONT session
        sid = self._zte_login("ont_gz1")

        # Check topo_lua.lua on AX3000GZ V2
        st_topo, hdrs_topo, data_topo = self._req(
            "GET",
            "/mesh-node/ont_gz1/sim_ax3000gz_v2/?_type=menuData&_tag=topo_lua.lua",
            headers={"Cookie": f"{sid}; ktv_client_id=ktv_gzv2_cv2_test"},
        )
        self.assertEqual(st_topo, 200)
        self.assertIn("application/json", hdrs_topo.get("Content-Type", ""))
        topo = json.loads(data_topo.decode("utf-8"))
        self.assertEqual(topo["master"]["DeviceName"], "ZTE:F6201B")
        self.assertEqual(topo["master"]["IpAddr"], "192.168.1.1")
        self.assertEqual(len(topo["slave"]), 1)
        slave = topo["slave"][0]
        self.assertEqual(slave["DeviceName"], "AX3000CV2")
        self.assertEqual(slave["IpAddr"], "192.168.1.200")
        self.assertEqual(slave["AccessType"], "ETH")
        self.assertEqual(slave["LinkSpeed"], "1000")

        # Verify shell view hook
        st_view, _, data_view = self._req("GET", "/mesh-node/ont_gz1/sim_ax3000gz_v2/?autologin=1&view=mmTopology")
        self.assertEqual(st_view, 200)
        view_html = data_view.decode("utf-8", errors="replace")
        self.assertIn('var v="mmTopology"', view_html)

        # Verify mmTopology.html fragment contains topology cascade logic
        st_frag, _, data_frag = self._req(
            "GET",
            "/mesh-node/ont_gz1/sim_ax3000gz_v2/?_type=menuView&_tag=mmTopology",
            headers={"Cookie": f"{sid}; ktv_client_id=ktv_gzv2_cv2_test"},
        )
        self.assertEqual(st_frag, 200)
        frag_html = data_frag.decode("utf-8", errors="replace")
        self.assertIn("dealcascade", frag_html)
        self.assertIn("slave1-middle", frag_html)

    def test_2_host_ssid_and_passphrase_sync(self):
        """Updating 2.4G & 5G SSIDs and passphrases on AX3000GZ V2 pushes down separately to AX3000C V2."""
        ont = self._make_ont_node("ont_gz2")
        ont["firmwareConfig"]["ssid"] = "FPT-ONT-2G-OFFICE"
        ont["firmwareConfig"]["ssid5g"] = "FPT-ONT-5G-VIP"
        ont["firmwareConfig"]["password"] = "Key2G_12345678"
        ont["firmwareConfig"]["password5g"] = "Key5G_87654321"

        ap = self._make_ap_node("ap_c2")
        link = {
            "id": "link_lan_lan_2",
            "srcId": "ont_gz2",
            "srcPort": "LAN2_1GE",
            "tgtId": "ap_c2",
            "tgtPort": "LAN1_1GE",
            "cableType": "ETH_CAT6A",
            "speedMbps": 1000,
        }

        payload = {
            "nodes": [ont, ap],
            "links": [link],
            "source_node_id": "ont_gz2",
            "action": "sync",
        }
        st, _, data = self._req("POST", "/api/mesh-lab/sync-topology", body=payload)
        self.assertEqual(st, 200)

        # Verify AX3000C V2 received the distinct 2.4G and 5G settings via ubus
        wifi_res = self._ubus_call("ap_c2", "data_repo.weboui", "wifi_get")
        host = wifi_res.get("host", {})
        self.assertEqual(host.get("2G", {}).get("ssid"), "FPT-ONT-2G-OFFICE")
        self.assertEqual(host.get("2G", {}).get("key"), "Key2G_12345678")
        self.assertEqual(host.get("5G", {}).get("ssid"), "FPT-ONT-5G-VIP")
        self.assertEqual(host.get("5G", {}).get("key"), "Key5G_87654321")
        self.assertTrue(host.get("2G", {}).get("vap_diff_mode"))

        # Verify AX3000C V2 EasyMesh status is Agent
        em_res = self._ubus_call("ap_c2", "network.wireless.easymesh", "get")
        self.assertEqual(em_res.get("MeshRole"), "Agent")

    def test_3_wan_port_plug_prevents_mesh_slave(self):
        """Plugging cable into WAN_1GE of AX3000C V2 functions as router_wan and does not show as EasyMesh slave."""
        ont = self._make_ont_node("ont_gz3")
        ap = self._make_ap_node("ap_c3")
        link = {
            "id": "link_lan_wan",
            "srcId": "ont_gz3",
            "srcPort": "LAN1_1GE",
            "tgtId": "ap_c3",
            "tgtPort": "WAN_1GE",
            "cableType": "ETH_CAT6A",
            "speedMbps": 1000,
        }

        payload = {
            "nodes": [ont, ap],
            "links": [link],
            "action": "sync",
        }
        st, _, data = self._req("POST", "/api/mesh-lab/sync-topology", body=payload)
        self.assertEqual(st, 200)
        sync_res = json.loads(data.decode("utf-8"))
        self.assertEqual(sync_res["adapter_sync"]["sync_modes"].get("ap_c3"), "router_wan")

        # Login to ONT session
        sid = self._zte_login("ont_gz3")

        # In router_wan mode, topo_lua.lua on AX3000GZ V2 has 0 mesh slaves
        st_topo, _, data_topo = self._req(
            "GET",
            "/mesh-node/ont_gz3/sim_ax3000gz_v2/?_type=menuData&_tag=topo_lua.lua",
            headers={"Cookie": f"{sid}; ktv_client_id=ktv_gzv2_cv2_test"},
        )
        self.assertEqual(st_topo, 200)
        topo = json.loads(data_topo.decode("utf-8"))
        self.assertEqual(len(topo["slave"]), 0)

    def test_4_portal_isolation(self):
        """Direct access to /sim_ax3000gz_v2/ (Portal) remains completely isolated without mesh shim."""
        st, _, data = self._req("GET", "/sim_ax3000gz_v2/")
        self.assertEqual(st, 200)
        html = data.decode("utf-8", errors="replace")
        self.assertNotIn('data-fpt-mesh-node="1"', html)

    def test_5_save_wifi_and_button_labels_preservation(self):
        """Web GUI Wi-Fi configuration on AX3000GZ V2 saves successfully and preserves button labels."""
        ont = self._make_ont_node("ont_gz5")
        ap = self._make_ap_node("ap_c5")
        link = {
            "id": "link_lan_lan_5",
            "srcId": "ont_gz5",
            "srcPort": "LAN1_1GE",
            "tgtId": "ap_c5",
            "tgtPort": "LAN1_1GE",
            "cableType": "ETH_CAT6A",
            "speedMbps": 1000,
        }
        st, _, _ = self._req("POST", "/api/mesh-lab/sync-topology", body={"nodes": [ont, ap], "links": [link], "action": "sync"})
        self.assertEqual(st, 200)

        # Login to ONT session
        sid = self._zte_login("ont_gz5")

        # 1. Fetch wlanBasic view and verify button values are 'Cancel' and 'Apply'
        st_view, _, data_view = self._req(
            "GET",
            "/mesh-node/ont_gz5/sim_ax3000gz_v2/?_type=menuView&_tag=wlanBasic",
            headers={"Cookie": f"{sid}; ktv_client_id=ktv_gzv2_cv2_test"},
        )
        self.assertEqual(st_view, 200)
        view_html = data_view.decode("utf-8", errors="replace")
        self.assertIn('value="Cancel"', view_html)
        self.assertIn('value="Apply"', view_html)
        self.assertNotIn('FPT_BE12000_WIFI7', view_html)

        # 2. Extract session token from wlanBasic view
        import re
        m = re.search(r'_sessionTmpToken\s*=\s*"([^"]+)"', view_html)
        self.assertTrue(m, "Could not find _sessionTmpToken in view_html")
        raw_token = m.group(1)
        if "\\x" in raw_token:
            token_val = bytes.fromhex(raw_token.replace("\\x", "")).decode("latin1")
        else:
            token_val = raw_token

        # 3. Submit Wi-Fi change: ESSID = hoilamchi, KeyPassphrase = 24BA7659 for SSID1 (DEV.WIFI.AP1)
        post_body = (
            f"IF_ACTION=Apply&_InstID=DEV.WIFI.AP1&Enable=1&ESSID=hoilamchi"
            f"&KeyPassphrase=24BA7659&_sessionTOKEN={token_val}"
        )
        st_post, _, data_post = self._req(
            "POST",
            "/mesh-node/ont_gz5/sim_ax3000gz_v2/?_type=menuData&_tag=wlan_wlansssidconf_lua.lua",
            body=post_body,
            headers={
                "Cookie": f"{sid}; ktv_client_id=ktv_gzv2_cv2_test",
                "Content-Type": "application/x-www-form-urlencoded",
            },
        )
        self.assertEqual(st_post, 200)
        post_xml = data_post.decode("utf-8", errors="replace")
        self.assertIn("<IF_ERRORTYPE>SUCC</IF_ERRORTYPE>", post_xml)

        # 4. Read back wlan_wlansssidconf_lua.lua and verify updated ESSID
        st_get, _, data_get = self._req(
            "GET",
            "/mesh-node/ont_gz5/sim_ax3000gz_v2/?_type=menuData&_tag=wlan_wlansssidconf_lua.lua",
            headers={"Cookie": f"{sid}; ktv_client_id=ktv_gzv2_cv2_test"},
        )
        self.assertEqual(st_get, 200)
        get_xml = data_get.decode("utf-8", errors="replace")
        self.assertIn("<ParaName>ESSID</ParaName><ParaValue>hoilamchi</ParaValue>", get_xml)

        # 5. Trigger topology sync: changes must propagate to AX3000C V2
        st_sync, _, _ = self._req("POST", "/api/mesh-lab/sync-topology", body={
            "nodes": [ont, ap],
            "links": [link],
            "source_node_id": "ont_gz5",
            "prefer_backend_source": True,
            "action": "sync",
        })
        self.assertEqual(st_sync, 200)

        # Verify AX3000C V2 received the new SSID 'hoilamchi' and passphrase '24BA7659'
        wifi_res = self._ubus_call("ap_c5", "data_repo.weboui", "wifi_get")
        host_2g = wifi_res.get("host", {}).get("2G", {})
        self.assertEqual(host_2g.get("ssid"), "hoilamchi")
        self.assertEqual(host_2g.get("key"), "24BA7659")


if __name__ == "__main__":
    unittest.main()
