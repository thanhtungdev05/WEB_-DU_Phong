import http.client
import json
import re
import threading
import unittest
from http.server import ThreadingHTTPServer

import run_all


class TestMeshAx3000Hv2Ax3000Cv2(unittest.TestCase):
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
            "X-KTV-Session-ID": "ktv_hv2_mesh_test",
            "Cookie": "ktv_client_id=ktv_hv2_mesh_test",
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

    def _extract_topo_json(self, html_text):
        m = re.search(r'"topo_json"\s*:\s*(\[[\s\S]*?\])(?=\s*,\s*"meshSetText")', html_text)
        self.assertIsNotNone(m, "topo_json block missing in mesh_topo.asp")
        return json.loads(m.group(1))

    def test_01_mesh_topology_assets_and_deviceinfo(self):
        for icon in ("root-1.png", "root-2.png", "node-1.png", "node-2.png", "conn.png", "conn-2.png"):
            st, hdrs, data = self._req("GET", f"/sim_ax3000hv2/{icon}")
            self.assertEqual(st, 200, f"Missing icon {icon}")
            self.assertTrue(data.startswith(b"\x89PNG\r\n\x1a\n"), f"{icon} is not valid PNG")

        st, _, data = self._req("GET", "/mesh-node/hv2_1/sim_ax3000hv2/cgi-bin/status_deviceinfo.asp")
        self.assertEqual(st, 200)
        html = data.decode("utf-8", errors="replace")
        self.assertIn("AX3000HV2", html)

    def test_02_mesh_lan_pair_renders_wired_networking_and_syncs_wifi(self):
        payload = {
            "source_node_id": "hv2_lan",
            "nodes": [
                {
                    "id": "hv2_lan",
                    "catalogKey": "ax3000hv2",
                    "simId": "sim_ax3000hv2",
                    "name": "ONT_AX3000HV2",
                    "model": "AX3000HV2",
                    "category": "gateway",
                    "ip": "192.168.1.1",
                    "mac": "20:BE:B4:0B:16:91",
                    "power": True,
                    "firmwareConfig": {
                        "ssid": "FPT_HV2_MESH_OK",
                        "wpaKey": "Hv2Secret@2026",
                        "lanIp": "192.168.1.1",
                        "meshEnabled": True,
                    },
                },
                {
                    "id": "ap_cv2_lan",
                    "catalogKey": "ax3000c",
                    "simId": "sim_ax3000c",
                    "name": "AP_AX3000CV2",
                    "model": "AX3000C",
                    "category": "ap",
                    "ip": "192.168.1.100",
                    "mac": "30:60:0A:DB:D5:8F",
                    "power": True,
                    "firmwareConfig": {},
                },
            ],
            "links": [
                {
                    "srcId": "hv2_lan",
                    "srcPort": "LAN1_1GE",
                    "tgtId": "ap_cv2_lan",
                    "tgtPort": "LAN1",
                    "cableType": "ETH_CAT6A",
                    "speed": 1000,
                }
            ],
        }
        st, _, data = self._req("POST", "/api/mesh-lab/sync-topology", body=payload)
        self.assertEqual(st, 200)
        sync_res = json.loads(data.decode("utf-8"))
        self.assertEqual(sync_res["adapter_sync"]["sync_modes"].get("ap_cv2_lan"), "ap_mesh")

        # 1) Verify Mesh Topology D3 data on AX3000HV2 matches Hình ảnh 11 & 12
        st, _, topo_raw = self._req("GET", "/mesh-node/hv2_lan/sim_ax3000hv2/cgi-bin/mesh_topo.asp")
        self.assertEqual(st, 200)
        topo_html = topo_raw.decode("utf-8", errors="replace")
        self.assertRegex(topo_html, r'"mapEnable"\s*:\s*"1"')
        self.assertRegex(topo_html, r'"state"\s*:\s*"Controller"')
        topo = self._extract_topo_json(topo_html)
        self.assertEqual(len(topo), 2)
        self.assertEqual(topo[0]["Role"], "01")
        self.assertEqual(topo[1]["Role"], "02")
        self.assertEqual(topo[1]["HostName"], "AP_AX3000CV2")
        self.assertEqual(topo[1]["UplinkMac"], topo[0]["Mac"])
        self.assertEqual(topo[1]["BhType"], "Ethernet")
        self.assertEqual(topo[1]["RSSI"], "N/A")
        self.assertEqual(topo[1]["BhPhyRate"], "N/A")

        # 2) Verify SSID AND Passphrase synced to AX3000Cv2 backend
        st, _, ap_cfg_raw = self._req("GET", "/api/mesh-lab/node-config?node_id=ap_cv2_lan&sim_id=sim_ax3000c")
        self.assertEqual(st, 200)
        ap_cfg = json.loads(ap_cfg_raw.decode("utf-8"))["config"]
        self.assertEqual(ap_cfg["ssid"], "FPT_HV2_MESH_OK")
        self.assertEqual(ap_cfg["password"], "Hv2Secret@2026")
        self.assertEqual(ap_cfg["meshRole"], "Agent")

        # 3) Verify AX3000Cv2 network.topology preserves info/radio/legacy_devices (so Home/Status Vue renders)
        import sys
        kho_mod = sys.modules["ax3000c_kho_cau_hinh"]
        ap_kho = kho_mod._kho_cua_ktv("ktv_hv2_mesh_test__mn_ap_cv2_lan")
        ap_topo = ap_kho.doc("network.topology")
        self.assertIsInstance(ap_topo, dict)
        self.assertTrue(len(ap_topo) >= 1)
        first_entry = next(iter(ap_topo.values()))
        self.assertIn("info", first_entry)
        self.assertIn("radio", first_entry)
        self.assertIn("legacy_devices", first_entry)

    def test_03_wrong_wan_port_does_not_pair_mesh_agent(self):
        payload = {
            "source_node_id": "hv2_wan_err",
            "nodes": [
                {
                    "id": "hv2_wan_err",
                    "catalogKey": "ax3000hv2",
                    "simId": "sim_ax3000hv2",
                    "name": "ONT_AX3000HV2",
                    "category": "gateway",
                    "ip": "192.168.1.1",
                    "mac": "20:BE:B4:0B:16:91",
                    "power": True,
                    "firmwareConfig": {"meshEnabled": True},
                },
                {
                    "id": "ap_cv2_wan_err",
                    "catalogKey": "ax3000c",
                    "simId": "sim_ax3000c",
                    "name": "AP_AX3000CV2",
                    "category": "ap",
                    "ip": "192.168.1.100",
                    "mac": "30:60:0A:DB:D5:8F",
                    "power": True,
                    "firmwareConfig": {},
                },
            ],
            "links": [
                {
                    "srcId": "hv2_wan_err",
                    "srcPort": "LAN1_1GE",
                    "tgtId": "ap_cv2_wan_err",
                    "tgtPort": "WAN_1GE",
                    "cableType": "ETH_CAT6A",
                    "speed": 1000,
                }
            ],
        }
        st, _, data = self._req("POST", "/api/mesh-lab/sync-topology", body=payload)
        self.assertEqual(st, 200)
        sync_res = json.loads(data.decode("utf-8"))
        self.assertEqual(sync_res["adapter_sync"]["sync_modes"].get("ap_cv2_wan_err"), "router_wan")

        st, _, topo_raw = self._req("GET", "/mesh-node/hv2_wan_err/sim_ax3000hv2/cgi-bin/mesh_topo.asp")
        self.assertEqual(st, 200)
        topo = self._extract_topo_json(topo_raw.decode("utf-8", errors="replace"))
        self.assertEqual(len(topo), 1, "Plugging into WAN port of AX3000Cv2 must not create Mesh Agent")

        # Replugging from WAN -> LAN must cleanly recover to Mesh Agent even if AP carried opMode="router"
        payload["nodes"][1]["opMode"] = "router"
        payload["nodes"][1]["firmwareConfig"]["opMode"] = "router"
        payload["links"][0]["tgtPort"] = "LAN1_1GE"
        st, _, data2 = self._req("POST", "/api/mesh-lab/sync-topology", body=payload)
        self.assertEqual(st, 200)
        sync_res2 = json.loads(data2.decode("utf-8"))
        self.assertEqual(sync_res2["adapter_sync"]["sync_modes"].get("ap_cv2_wan_err"), "ap_mesh")
        st, _, topo_raw2 = self._req("GET", "/mesh-node/hv2_wan_err/sim_ax3000hv2/cgi-bin/mesh_topo.asp")
        topo2 = self._extract_topo_json(topo_raw2.decode("utf-8", errors="replace"))
        self.assertEqual(len(topo2), 2, "Replugging to LAN1_1GE must recover AX3000Cv2 as Mesh Agent")

    def test_04_disable_mesh_setting_hides_topology_until_reenabled(self):
        # Disable Mesh via real Mesh Setting POST form
        st, _, _ = self._req(
            "POST",
            "/mesh-node/hv2_toggle/sim_ax3000hv2/cgi-bin/mesh_basic_setting.asp",
            body="SaveAll_Flag=1&Save_Flag=1&mesh_active=0&mesh_Role=1",
            headers={
                "Content-Type": "application/x-www-form-urlencoded",
                "Referer": f"http://127.0.0.1:{self.port}/mesh-node/hv2_toggle/sim_ax3000hv2/cgi-bin/mesh_basic_setting.asp",
            },
        )
        self.assertIn(st, (200, 302))

        st, _, set_raw = self._req("GET", "/mesh-node/hv2_toggle/sim_ax3000hv2/cgi-bin/mesh_basic_setting.asp")
        self.assertEqual(st, 200)
        set_html = set_raw.decode("utf-8", errors="replace")
        self.assertRegex(set_html, r'"mapEnable"\s*:\s*"0"')
        self.assertRegex(set_html, r'"state"\s*:\s*"Disabled"')

        # Sync topology while disabled -> must NOT show Agent
        payload = {
            "source_node_id": "hv2_toggle",
            "prefer_backend_source": True,
            "nodes": [
                {
                    "id": "hv2_toggle",
                    "catalogKey": "ax3000hv2",
                    "simId": "sim_ax3000hv2",
                    "name": "ONT_AX3000HV2",
                    "category": "gateway",
                    "ip": "192.168.1.1",
                    "mac": "20:BE:B4:0B:16:91",
                    "power": True,
                    "firmwareConfig": {},
                },
                {
                    "id": "ap_cv2_toggle",
                    "catalogKey": "ax3000c",
                    "simId": "sim_ax3000c",
                    "name": "AP_AX3000CV2",
                    "category": "ap",
                    "ip": "192.168.1.100",
                    "mac": "30:60:0A:DB:D5:8F",
                    "power": True,
                    "firmwareConfig": {},
                },
            ],
            "links": [
                {
                    "srcId": "hv2_toggle",
                    "srcPort": "LAN1_1GE",
                    "tgtId": "ap_cv2_toggle",
                    "tgtPort": "LAN1",
                    "cableType": "ETH_CAT6A",
                    "speed": 1000,
                }
            ],
        }
        st, _, _ = self._req("POST", "/api/mesh-lab/sync-topology", body=payload)
        self.assertEqual(st, 200)

        st, _, topo_raw = self._req("GET", "/mesh-node/hv2_toggle/sim_ax3000hv2/cgi-bin/mesh_topo.asp")
        topo_html = topo_raw.decode("utf-8", errors="replace")
        self.assertRegex(topo_html, r'"mapEnable"\s*:\s*"0"')
        self.assertEqual(len(self._extract_topo_json(topo_html)), 1)

        # Re-enable Mesh via Mesh Setting POST
        st, _, _ = self._req(
            "POST",
            "/mesh-node/hv2_toggle/sim_ax3000hv2/cgi-bin/mesh_basic_setting.asp",
            body="SaveAll_Flag=1&Save_Flag=1&mesh_active=1&mesh_Role=1",
            headers={
                "Content-Type": "application/x-www-form-urlencoded",
                "Referer": f"http://127.0.0.1:{self.port}/mesh-node/hv2_toggle/sim_ax3000hv2/cgi-bin/mesh_basic_setting.asp",
            },
        )
        self.assertIn(st, (200, 302))
        st, _, _ = self._req("POST", "/api/mesh-lab/sync-topology", body=payload)
        self.assertEqual(st, 200)

        st, _, topo_raw = self._req("GET", "/mesh-node/hv2_toggle/sim_ax3000hv2/cgi-bin/mesh_topo.asp")
        topo_html = topo_raw.decode("utf-8", errors="replace")
        self.assertRegex(topo_html, r'"mapEnable"\s*:\s*"1"')
        self.assertEqual(len(self._extract_topo_json(topo_html)), 2)

    def test_05_frameset_navigation_preserves_mesh_node_prefix(self):
        st, _, idx_raw = self._req("GET", "/mesh-node/hv2_nav/sim_ax3000hv2/cgi-bin/index.asp?page=mesh_topo.asp")
        self.assertEqual(st, 200)
        idx_html = idx_raw.decode("utf-8", errors="replace")
        self.assertIn('/mesh-node/hv2_nav/sim_ax3000hv2/cgi-bin/status.asp?tab=Network', idx_html)
        self.assertIn('/mesh-node/hv2_nav/sim_ax3000hv2/cgi-bin/navigation-basic.asp?page=', idx_html)
        self.assertIn('mesh_topo.asp', idx_html)
        self.assertIn('name="nav"', idx_html)
        self.assertIn('scrolling="auto"', idx_html)

        st, _, hdr_raw = self._req("GET", "/mesh-node/hv2_nav/sim_ax3000hv2/cgi-bin/status.asp")
        self.assertEqual(st, 200)
        hdr_html = hdr_raw.decode("utf-8", errors="replace")
        self.assertIn('/mesh-node/hv2_nav/sim_ax3000hv2/cgi-bin/navigation-basic.asp', hdr_html)

        st, _, nav_raw = self._req("GET", "/mesh-node/hv2_nav/sim_ax3000hv2/cgi-bin/navigation-basic.asp")
        self.assertEqual(st, 200)
        nav_html = nav_raw.decode("utf-8", errors="replace")
        self.assertIn('/mesh-node/hv2_nav/sim_ax3000hv2/cgi-bin/mesh_topo.asp', nav_html)
        self.assertIn('/mesh-node/hv2_nav/sim_ax3000hv2/cgi-bin/mesh_basic_setting.asp', nav_html)

    def test_06_host_ssid_sync_unified_and_split_2g_5g_to_ax3000cv2(self):
        import sys
        kho_mod = sys.modules["ax3000c_kho_cau_hinh"]

        def _sync_pair(hv2_id, ap_id, tgt_port="LAN1_1GE"):
            payload = {
                "source_node_id": hv2_id,
                "prefer_backend_source": True,
                "nodes": [
                    {
                        "id": hv2_id,
                        "catalogKey": "ax3000hv2",
                        "simId": "sim_ax3000hv2",
                        "name": "ONT_AX3000HV2",
                        "category": "gateway",
                        "ip": "192.168.1.1",
                        "mac": "20:BE:B4:0B:16:91",
                        "power": True,
                        "firmwareConfig": {},
                    },
                    {
                        "id": ap_id,
                        "catalogKey": "ax3000c",
                        "simId": "sim_ax3000c",
                        "name": "AP_AX3000CV2",
                        "category": "ap",
                        "ip": "192.168.1.200",
                        "mac": "30:60:0A:DB:D5:8F",
                        "power": True,
                        "firmwareConfig": {},
                    },
                ],
                "links": [
                    {
                        "srcId": hv2_id,
                        "srcPort": "LAN1_1GE",
                        "tgtId": ap_id,
                        "tgtPort": tgt_port,
                        "cableType": "ETH_CAT6A",
                        "speed": 1000,
                    }
                ],
            }
            st, _, raw = self._req("POST", "/api/mesh-lab/sync-topology", body=payload)
            self.assertEqual(st, 200)
            return json.loads(raw.decode("utf-8"))

        # 1) Save unified Host SSID (2.4G == 5G) on AX3000HV2 via real wifi_basic.asp POST
        st, _, _ = self._req(
            "POST",
            "/mesh-node/hv2_wifi/sim_ax3000hv2/cgi-bin/wifi_basic.asp",
            body=(
                "saveFlag=1&ESSID=FPT_NhaKhach&ESSID_5g=FPT_NhaKhach"
                "&PreSharedKey=MatKhauChung88&PreSharedKey_5g=MatKhauChung88"
                "&WEP_Selection=WPA2PSKWPA3PSK&WEP_Selection_5g=WPA2PSKWPA3PSK"
                "&TKIP_Selection=AES&TKIP_Selection_5g=AES"
                "&ESSID_HIDE_Selection=0&ESSID_HIDE_Selection_5g=0"
            ),
            headers={
                "Content-Type": "application/x-www-form-urlencoded",
                "Referer": f"http://127.0.0.1:{self.port}/mesh-node/hv2_wifi/sim_ax3000hv2/cgi-bin/wifi_basic.asp",
            },
        )
        self.assertIn(st, (200, 302))

        # Verify AX3000HV2 wifi_basic.asp renders the exact saved variables back
        st, _, wb_raw = self._req("GET", "/mesh-node/hv2_wifi/sim_ax3000hv2/cgi-bin/wifi_basic.asp")
        self.assertEqual(st, 200)
        wb_html = wb_raw.decode("utf-8", errors="replace")
        self.assertIn('var wifi_ssid_2g = "FPT_NhaKhach"', wb_html)
        self.assertIn('var wifi_pwd_5g = "MatKhauChung88"', wb_html)
        self.assertIn('var wifi_authMode_2g = "WPA2PSKWPA3PSK"', wb_html)

        # Guest Wi-Fi POST must NOT clobber Host SSID
        st, _, _ = self._req(
            "POST",
            "/mesh-node/hv2_wifi/sim_ax3000hv2/cgi-bin/wifi_guest.asp",
            body="saveFlag=1&ESSID=Guest_Only&PreSharedKey=GuestPass999",
            headers={
                "Content-Type": "application/x-www-form-urlencoded",
                "Referer": f"http://127.0.0.1:{self.port}/mesh-node/hv2_wifi/sim_ax3000hv2/cgi-bin/wifi_guest.asp",
            },
        )
        self.assertIn(st, (200, 302))

        # Sync to AX3000Cv2 (LAN-LAN) -> must receive unified Host SSID (vap_diff_mode=False)
        res_uni = _sync_pair("hv2_wifi", "ap_wifi")
        self.assertEqual(res_uni["adapter_sync"]["sync_modes"].get("ap_wifi"), "ap_mesh")
        ap_wifi_doc = kho_mod._kho_cua_ktv("ktv_hv2_mesh_test__mn_ap_wifi").doc("data_repo.weboui.wifi_get")
        self.assertEqual(ap_wifi_doc["host"]["2G"]["ssid"], "FPT_NhaKhach")
        self.assertEqual(ap_wifi_doc["host"]["5G"]["ssid"], "FPT_NhaKhach")
        self.assertEqual(ap_wifi_doc["host"]["2G"]["key"], "MatKhauChung88")
        self.assertEqual(ap_wifi_doc["host"]["5G"]["key"], "MatKhauChung88")
        self.assertEqual(ap_wifi_doc["host"]["2G"]["sae"], "1")
        self.assertFalse(ap_wifi_doc["host"]["2G"]["vap_diff_mode"])
        self.assertFalse(ap_wifi_doc["host"]["5G"]["vap_diff_mode"])

        # 2) Save split 2.4G vs 5G Host SSID (OPEN on 2.4G, WPA2/WPA3 on 5G with distinct names/keys)
        st, _, _ = self._req(
            "POST",
            "/mesh-node/hv2_wifi/sim_ax3000hv2/cgi-bin/wifi_basic.asp",
            body=(
                "saveFlag=1&ESSID=FPT_2G_Open&ESSID_5g=FPT_5G_Fast"
                "&PreSharedKey=Pass2G_1234&PreSharedKey_5g=Pass5G_9999"
                "&WEP_Selection=OPEN&WEP_Selection_5g=WPA2PSKWPA3PSK"
                "&TKIP_Selection=AES&TKIP_Selection_5g=AES"
            ),
            headers={
                "Content-Type": "application/x-www-form-urlencoded",
                "Referer": f"http://127.0.0.1:{self.port}/mesh-node/hv2_wifi/sim_ax3000hv2/cgi-bin/wifi_basic.asp",
            },
        )
        self.assertIn(st, (200, 302))
        _sync_pair("hv2_wifi", "ap_wifi")
        ap_wifi_split = kho_mod._kho_cua_ktv("ktv_hv2_mesh_test__mn_ap_wifi").doc("data_repo.weboui.wifi_get")
        self.assertEqual(ap_wifi_split["host"]["2G"]["ssid"], "FPT_2G_Open")
        self.assertEqual(ap_wifi_split["host"]["2G"]["encryption"], "none")
        self.assertEqual(ap_wifi_split["host"]["2G"]["sae"], "0")
        self.assertEqual(ap_wifi_split["host"]["5G"]["ssid"], "FPT_5G_Fast")
        self.assertEqual(ap_wifi_split["host"]["5G"]["key"], "Pass5G_9999")
        self.assertEqual(ap_wifi_split["host"]["5G"]["encryption"], "psk2+ccmp")
        self.assertEqual(ap_wifi_split["host"]["5G"]["sae"], "1")
        self.assertTrue(ap_wifi_split["host"]["2G"]["vap_diff_mode"])
        self.assertTrue(ap_wifi_split["host"]["5G"]["vap_diff_mode"])

        # 3) Negative guard: wrong WAN port must NOT push new Host SSID to AX3000Cv2
        st, _, _ = self._req(
            "POST",
            "/mesh-node/hv2_wifi/sim_ax3000hv2/cgi-bin/wifi_basic.asp",
            body=(
                "saveFlag=1&ESSID=ShouldNotSyncWan&ESSID_5g=ShouldNotSyncWan"
                "&PreSharedKey=NoSyncPass88&PreSharedKey_5g=NoSyncPass88"
                "&WEP_Selection=WPA2PSK&WEP_Selection_5g=WPA2PSK"
            ),
            headers={
                "Content-Type": "application/x-www-form-urlencoded",
                "Referer": f"http://127.0.0.1:{self.port}/mesh-node/hv2_wifi/sim_ax3000hv2/cgi-bin/wifi_basic.asp",
            },
        )
        self.assertIn(st, (200, 302))
        res_wan = _sync_pair("hv2_wifi", "ap_wifi_wan_blocked", tgt_port="WAN_1GE")
        self.assertEqual(res_wan["adapter_sync"]["sync_modes"].get("ap_wifi_wan_blocked"), "router_wan")
        ap_blocked_doc = kho_mod._kho_cua_ktv("ktv_hv2_mesh_test__mn_ap_wifi_wan_blocked").doc("data_repo.weboui.wifi_get")
        self.assertNotEqual(ap_blocked_doc["host"]["2G"]["ssid"], "ShouldNotSyncWan")

    def test_07_portal_vs_mesh_lab_isolation_on_wifi_basic(self):
        # 1) Portal direct route (/sim_ax3000hv2/cgi-bin/wifi_basic.asp) must remain original
        #    with no auto-mirroring between 2.4G and 5G
        st, _, portal_raw = self._req("GET", "/sim_ax3000hv2/cgi-bin/wifi_basic.asp")
        self.assertEqual(st, 200)
        portal_html = portal_raw.decode("utf-8", errors="replace")
        self.assertNotIn('data-fpt-mesh-node="1"', portal_html)
        self.assertNotIn('data-hv2-mesh-bandsteer="1"', portal_html)
        self.assertIn('NAME="bandsteering_enable" onClick="bandsteering_enable_switch(1)" VALUE="1" disabled', portal_html)

        # 2) POST without Referer header with distinct 2.4G and 5G must persist both independently
        st, hdrs, _ = self._req(
            "POST",
            "/mesh-node/hv2_noref/sim_ax3000hv2/cgi-bin/wifi_basic.asp",
            body="saveFlag=1&ESSID=FPT_24G&ESSID_5g=FPT_5G&PreSharedKey=Pass24G88&PreSharedKey_5g=Pass5G999",
            headers={"Content-Type": "application/x-www-form-urlencoded"},
        )
        self.assertEqual(st, 302)
        loc = hdrs.get("Location") or hdrs.get("location") or ""
        self.assertIn("/mesh-node/hv2_noref/sim_ax3000hv2/cgi-bin/wifi_basic.asp", loc)
        self.assertIn("save_success=1", loc)

        st, _, saved_raw = self._req("GET", loc)
        self.assertEqual(st, 200)
        saved_html = saved_raw.decode("utf-8", errors="replace")
        self.assertIn('data-fpt-mesh-node="1"', saved_html)
        self.assertNotIn('data-hv2-mesh-bandsteer="1"', saved_html)
        self.assertIn('var wifi_ssid_2g = "FPT_24G"', saved_html)
        self.assertIn('var wifi_ssid_5g = "FPT_5G"', saved_html)
        self.assertIn('var wifi_pwd_2g = "Pass24G88"', saved_html)
        self.assertIn('var wifi_pwd_5g = "Pass5G999"', saved_html)
        self.assertIn('Saved &amp; Synced to Mesh AP', saved_html)
        self.assertIn("nodeId: window.__FPT_MESH_NODE_ID || ''", saved_html)


if __name__ == "__main__":
    unittest.main()
