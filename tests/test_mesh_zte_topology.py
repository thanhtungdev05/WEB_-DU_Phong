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
        import re
        for script_src in re.findall(r'<script\s+src="([^"]+)"></script>', mesh_lab_html):
            script_path = root / script_src.split('?', 1)[0].lstrip('/')
            if script_path.exists():
                mesh_lab_html += "\n" + script_path.read_text(encoding="utf-8")

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

        # 4. Kiểm tra các tính năng nâng cấp chuẩn Cisco Packet Tracer trong mesh-lab.html
        self.assertIn("getDeviceSvgGraphic", mesh_lab_html)
        self.assertIn("drawCiscoLinkLight", mesh_lab_html)
        self.assertIn("autoConnectTwoNodes", mesh_lab_html)
        self.assertIn("executeSimplePdu", mesh_lab_html)
        self.assertIn("renderRearChassisSvg", mesh_lab_html)
        self.assertIn("pdu-scenario-tbody", mesh_lab_html)
        self.assertIn("setWorkspaceMode", mesh_lab_html)
        self.assertIn("openCiscoPortPopup", mesh_lab_html)
        self.assertIn("attachWebGuiTwoWayBridge", mesh_lab_html)
        self.assertIn("syncFromWebGuiIframe", mesh_lab_html)

        # 5. Kiểm tra đủ 16 bộ giả lập thiết bị thật từ run_all.py có mặt trong FPT_CATALOG của mesh-lab.html
        expected_sim_folders = [
            "sim_be12000", "sim_be15000", "sim_ONT_be6500c", "sim_be6500c",
            "sim_ax3000gz", "sim_ax3000gz_v2", "sim_ax3000hv2", "sim_ax3000s", "sim_ax1800gz", "sim_ax3000c",
            "sim_ac1000f", "sim_ac1000HI", "sim_ac1000z", "sim_ac1000cv2",
            "sim_mikrotik_hexs", "sim_vigor2927"
        ]
        for sim_folder in expected_sim_folders:
            self.assertIn(sim_folder, mesh_lab_html, f"Missing simulator {sim_folder} in mesh-lab.html")

        # 6. Kiểm tra Giai đoạn 2: Hop-by-Hop ARP/ICMP & PDU Inspector (OSI 7 Tầng + Wireshark + Hex Dump)
        self.assertIn("findTopologyPathHops", mesh_lab_html)
        self.assertIn("buildPduHopEvents", mesh_lab_html)
        self.assertIn("openPduInspectorModal", mesh_lab_html)
        self.assertIn("buildWiresharkHexDump", mesh_lab_html)
        self.assertIn("stepSimForward", mesh_lab_html)

        # 7. Kiểm tra Giai đoạn 3: Máy Trạng Thái CLI Đa Hãng Phân Cấp (Cisco IOS / MikroTik RouterOS / ZTE PON / KTV Shell)
        self.assertIn("getCliVendorProfile", mesh_lab_html)
        self.assertIn("initCliForNode", mesh_lab_html)
        self.assertIn("autocompleteCliInput", mesh_lab_html)
        self.assertIn("buildCiscoShowIpIntBrief", mesh_lab_html)
        self.assertIn("buildZtePonOpticalInfo", mesh_lab_html)
        self.assertIn("buildMikrotikOutput", mesh_lab_html)
        self.assertIn("show pon optical-info", mesh_lab_html)
        self.assertIn("/interface print", mesh_lab_html)
        self.assertIn("show ip interface brief", mesh_lab_html)

        # 8. Kiểm tra Giai đoạn 4: Mô hình Vật lý ns-3 (Suy hao Quang PON dBm & Tường Cản Sóng Wi-Fi)
        self.assertIn("calculateOpticalPonMetrics", mesh_lab_html)
        self.assertIn("calculateWifiLinkPhysics", mesh_lab_html)
        self.assertIn("toggleNs3PhysicsPanel", mesh_lab_html)
        self.assertIn("applyNs3PhysicsConfig", mesh_lab_html)
        self.assertIn('id="ns3-physics-panel"', mesh_lab_html)
        self.assertIn("COST-231 Multi-Wall", mesh_lab_html)

        # 9. Kiểm tra Giai đoạn 5: Topology-as-Code (Containerlab YAML / .fptlab JSON) & Kho Đề Bài Pan Bệnh Thực Tế
        self.assertIn("openContainerlabModal", mesh_lab_html)
        self.assertIn("buildContainerlabYaml", mesh_lab_html)
        self.assertIn("buildFptLabJson", mesh_lab_html)
        self.assertIn("loadTroubleshootingFaultScenario", mesh_lab_html)
        self.assertIn("verifyCurrentFaultResolved", mesh_lab_html)
        self.assertIn('id="containerlab-modal"', mesh_lab_html)

        # 10. Kiểm tra Liên thông 3 Lớp Firmware Thiết bị A ➔ Dây cáp ➔ Firmware Thiết bị B
        self.assertIn("triggerManualCrossDeviceSync", mesh_lab_html)
        self.assertIn("propagateFirmwareStateAcrossLinks", mesh_lab_html)
        self.assertIn("extractConfigFromFirmwareDom", mesh_lab_html)
        self.assertIn("injectLinkedStateIntoFirmwareDom", mesh_lab_html)
        self.assertIn("renderFwLinkSyncOverlay", mesh_lab_html)
        self.assertIn("syncTopologyNodesToBackend", mesh_lab_html)
        self.assertIn('id="fw-link-sync-overlay"', mesh_lab_html)
        self.assertIn('id="btn-apply-fw-sync"', mesh_lab_html)
        self.assertIn("/api/mesh-lab/sync-topology", mesh_lab_html)
        self.assertIn("scheduleAutoCrossDeviceSync", mesh_lab_html)
        self.assertIn("triggerAutoCrossDeviceSync", mesh_lab_html)
        self.assertIn("handleConfigTabLiveEdit", mesh_lab_html)
        self.assertIn("hasKtvCustomConfig", mesh_lab_html)
        self.assertIn("customFieldMap", mesh_lab_html)
        self.assertIn("readOctetIpFromDoc", mesh_lab_html)
        self.assertIn("writeOctetIpToDoc", mesh_lab_html)
        self.assertIn("isOctetSplitInput", mesh_lab_html)
        self.assertIn("toggleMinimizeDeviceWindow", mesh_lab_html)
        self.assertIn("toggleCompactDeviceWindow", mesh_lab_html)
        self.assertIn("toggleFwLinkSyncOverlay", mesh_lab_html)
        self.assertIn("closeFwLinkSyncOverlay", mesh_lab_html)
        self.assertIn("initNodeNetworkStack", mesh_lab_html)
        self.assertIn("updateNodeNetworkStackFromConfig", mesh_lab_html)
        self.assertIn("learnSourceMacOnSwitch", mesh_lab_html)
        self.assertIn("networkStack", mesh_lab_html)
        self.assertIn("isSameSubnet", mesh_lab_html)

    def test_cisco_virtual_network_stack_phase1(self):
        import pathlib
        root = pathlib.Path(__file__).resolve().parents[1]
        ns_js = (root / "js" / "mesh-lab" / "network-stack.js").read_text(encoding="utf-8")
        
        # 1. Kiểm tra các hàm toán học Bitwise Subnetting
        self.assertIn("ipToLong", ns_js)
        self.assertIn("longToIp", ns_js)
        self.assertIn("isSameSubnet", ns_js)
        self.assertIn("calculateNetworkAddress", ns_js)
        self.assertIn("calculateBroadcastAddress", ns_js)

        # 2. Kiểm tra Ngăn xếp L2/L3 Network Stack
        self.assertIn("initNodeNetworkStack", ns_js)
        self.assertIn("updateNodeNetworkStackFromConfig", ns_js)
        self.assertIn("learnSourceMacOnSwitch", ns_js)
        self.assertIn("macAddressTable", ns_js)
        self.assertIn("arpTable", ns_js)
        self.assertIn("routingTable", ns_js)
        self.assertIn("accessControlLists", ns_js)
        self.assertIn("portSecurity", ns_js)
        self.assertIn("dhcpServer", ns_js)
        self.assertIn("dhcpClient", ns_js)

    def test_cisco_dynamic_pdu_dispatcher_phase2(self):
        import pathlib
        root = pathlib.Path(__file__).resolve().parents[1]
        pdu_js = (root / "js" / "mesh-lab" / "pdu-dispatcher.js").read_text(encoding="utf-8")
        
        # 1. Kiểm tra các hàm L2/L3 Routing, ACL và PDU Hop Evaluator
        self.assertIn("evaluateL3PacketRoute", pdu_js)
        self.assertIn("checkRouterAclFilter", pdu_js)
        self.assertIn("findTopologyPathHops", pdu_js)
        self.assertIn("buildPduHopEvents", pdu_js)
        self.assertIn("executeSimplePdu", pdu_js)

        # 2. Kiểm tra các cơ chế phân tích lỗi mạng không kịch bản
        self.assertIn("ICMP Destination Net Unreachable", pdu_js)
        self.assertIn("ACL Filter Denied", pdu_js)
        self.assertIn("ARP Request", pdu_js)
        self.assertIn("ARP Reply", pdu_js)
        self.assertIn("ICMP Echo Request", pdu_js)
        self.assertIn("ICMP Echo Reply", pdu_js)

    def test_cisco_cli_state_machine_phase3(self):
        import pathlib
        root = pathlib.Path(__file__).resolve().parents[1]
        cli_js = (root / "js" / "mesh-lab" / "cli-terminal.js").read_text(encoding="utf-8")
        
        # 1. Kiểm tra các hàm Show Commands mới chuẩn Cisco Packet Tracer
        self.assertIn("buildCiscoShowIpRoute", cli_js)
        self.assertIn("buildCiscoShowVlanBrief", cli_js)
        self.assertIn("buildCiscoShowPortSecurity", cli_js)
        self.assertIn("buildCiscoShowAccessLists", cli_js)

        # 2. Kiểm tra bộ phân tích cú pháp cấu hình động CLI
        self.assertIn("switchport mode access", cli_js)
        self.assertIn("switchport access vlan", cli_js)
        self.assertIn("switchport mode trunk", cli_js)
        self.assertIn("switchport port-security", cli_js)
        self.assertIn("switchport port-security mac-address sticky", cli_js)
        self.assertIn("ip route", cli_js)
        self.assertIn("access-list", cli_js)
        self.assertIn("vlan", cli_js)
        self.assertIn("config-vlan", cli_js)

    def test_lan_dhcp_4octet_sync_be12000_to_be15000(self):
        import pathlib
        from simulators.sim_be15000 import server as be15000_server

        # Mô phỏng cấu hình từ BE12000Z như Ảnh 2 của KTV:
        # LAN IP: 192.168.10.1, Start: 192.168.10.2, End: 192.168.10.254, Primary DNS: 192.168.1.1
        st = mesh_zte_engine.update_ont_lan_dhcp({
            "sub_IPAddr0:DHCPBasicCfg": "192",
            "sub_IPAddr1:DHCPBasicCfg": "168",
            "sub_IPAddr2:DHCPBasicCfg": "10",
            "sub_IPAddr3:DHCPBasicCfg": "1",
            "sub_SubMask0": "255",
            "sub_SubMask1": "255",
            "sub_SubMask2": "255",
            "sub_SubMask3": "0",
            "sub_MinAddress0:DHCPBasicCfg": "192",
            "sub_MinAddress1:DHCPBasicCfg": "168",
            "sub_MinAddress2:DHCPBasicCfg": "10",
            "sub_MinAddress3:DHCPBasicCfg": "2",
            "sub_MaxAddress0:DHCPBasicCfg": "192",
            "sub_MaxAddress1:DHCPBasicCfg": "168",
            "sub_MaxAddress2:DHCPBasicCfg": "10",
            "sub_MaxAddress3:DHCPBasicCfg": "254",
            "sub_DNSServer10": "192",
            "sub_DNSServer11": "168",
            "sub_DNSServer12": "1",
            "sub_DNSServer13": "1",
            "LeaseTime": "86400"
        })
        self.assertEqual(st["ont_lan_ip"], "192.168.10.1")
        self.assertEqual(st["gateway_ip"], "192.168.10.1")
        self.assertEqual(st["ont_dhcp_start"], "192.168.10.2")
        self.assertEqual(st["ont_dhcp_end"], "192.168.10.254")
        self.assertEqual(st["ont_primary_dns"], "192.168.1.1")
        self.assertEqual(st["ap_lan_ip"], "192.168.10.100")

        # Kiểm tra store của BE12000Z nhận đủ thông số + bảng Allocated Address (DHCP)
        dhcp_inst = GLOBAL_SIM["store"]._state["objects"]["OBJ_Br0AndDhcpsHosCfg_ID"]["instances"][0]
        self.assertEqual(dhcp_inst["IPAddr"], "192.168.10.1")
        self.assertEqual(dhcp_inst["MinAddress"], "192.168.10.2")
        self.assertEqual(dhcp_inst["MaxAddress"], "192.168.10.254")
        self.assertEqual(dhcp_inst["DNSServer1"], "192.168.1.1")
        dhcp_hosts = GLOBAL_SIM["store"]._state["objects"]["OBJ_DHCPHOSTINFO_ID"]["instances"]
        self.assertGreaterEqual(len(dhcp_hosts), 1)
        self.assertEqual(dhcp_hosts[0]["HostName"], "BE15000Z")
        self.assertEqual(dhcp_hosts[0]["IPAddr"], "192.168.10.100")

        # Kiểm tra trang lanMgrIpv4.html của BE15000Z được tiêm đúng từng ô octet 192.168.10.1 / .2 / .254 / 192.168.1.1
        root = pathlib.Path(__file__).resolve().parents[1]
        raw_html = (root / "simulators" / "sim_be15000" / "www" / "pages" / "lanMgrIpv4.html").read_text(encoding="utf-8", errors="ignore")
        injected = be15000_server._inject_lan_mgr_ipv4(raw_html, st)
        self.assertIn('id="sub_IPAddr2:DHCPBasicCfg" value="10"', injected)
        self.assertIn('id="sub_MinAddress2:DHCPBasicCfg" value="10"', injected)
        self.assertIn('id="sub_MaxAddress2:DHCPBasicCfg" value="10"', injected)
        self.assertIn('id="sub_MaxAddress3:DHCPBasicCfg" value="254"', injected)
        self.assertIn('id="sub_DNSServer12" value="1"', injected)
        self.assertIn('id="IPAddr:DHCPBasicCfg" value="192.168.10.1"', injected)
        self.assertIn('id="MinAddress:DHCPBasicCfg" value="192.168.10.2"', injected)
        self.assertIn('id="MaxAddress:DHCPBasicCfg" value="192.168.10.254"', injected)
        self.assertIn('id="DNSServer1" value="192.168.1.1"', injected)

    def test_cross_device_sync_topology_api(self):
        conn = self.http.HTTPConnection('127.0.0.1', self.port, timeout=5)
        payload = self.json.dumps({
            "ssid": "FPT_WiFi7_Synced_A_To_B",
            "key": "88889999",
            "gateway_ip": "192.168.88.1",
            "slaves": [
                {
                    "name": "AP_BE15000Z_Tang2",
                    "model": "ZTE H6701Q BE15000Z",
                    "mac": "94:87:E0:99:99:A2",
                    "ip": "192.168.88.2",
                    "backhaul": "Ethernet",
                    "speed_mbps": 2500,
                    "rssi": -25
                }
            ],
            "clients": [
                {
                    "name": "Laptop_KTV",
                    "mac": "AA:BB:CC:11:22:01",
                    "ip": "192.168.88.10",
                    "band": "5GHz + 6GHz (MLO)",
                    "rssi": -40,
                    "rate_mbps": 2882
                }
            ]
        })
        conn.request(
            'POST',
            '/api/mesh-lab/sync-topology',
            body=payload,
            headers={'Content-Type': 'application/json', 'X-Mock-User-Role': 'DEV'}
        )
        res = conn.getresponse()
        data = self.json.loads(res.read().decode('utf-8'))
        self.assertEqual(res.status, 200)
        self.assertEqual(data["ont_wifi_ssid"], "FPT_WiFi7_Synced_A_To_B")
        self.assertEqual(data["gateway_ip"], "192.168.88.1")
        self.assertEqual(data["ap_synced_ssid"], "FPT_WiFi7_Synced_A_To_B")
        self.assertEqual(len(data.get("custom_slaves", [])), 1)
        self.assertEqual(data["custom_slaves"][0]["name"], "AP_BE15000Z_Tang2")
        conn.close()


if __name__ == "__main__":
    import threading
    unittest.main()


