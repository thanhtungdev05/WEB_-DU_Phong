# -*- coding: utf-8 -*-
"""
Unit tests for Phase 3: Technical Standards, Compatibility Matrix, and 4 Training Scenarios Grading.
Covers:
1. Scenario 1 (p3_mesh): Mesh Wi-Fi (Controller ➔ Agent), Image 2 Matrix Port Verification.
2. Scenario 2 (p3_dhcp): Branch Router DHCP/PPPoE, Subnet Isolation 192.168.10.1.
3. Scenario 3 (p3_bridge): AP Bridge Mode, 0 DHCP Enforcement.
4. Scenario 4 (p3_static): Static IP Management (.2-.9) & DHCP Pool Separation (.10-.254).
5. HTTP Endpoints (/api/mesh-lab/missions, /api/mesh-lab/grade) integration.
"""

import json
import unittest
from unittest.mock import patch

import mesh_zte_engine


class TestMeshPhase3ScenariosAndGrading(unittest.TestCase):

    def setUp(self):
        mesh_zte_engine.reset_lab("test_p3_session")

    def test_compatibility_matrix_and_scenario_registry(self):
        """Verify Image 2 matrix and scenario definitions are complete."""
        matrix = mesh_zte_engine.FPT_MESH_COMPATIBILITY_MATRIX
        self.assertIn("AX3000C", matrix)
        self.assertEqual(matrix["AX3000C"]["port_type"], "LAN-LAN")
        self.assertIn("AX3000S", matrix)
        self.assertEqual(matrix["AX3000S"]["port_type"], "LAN-LAN")
        self.assertIn("AX3000AZ", matrix)
        self.assertEqual(matrix["AX3000AZ"]["port_type"], "LAN-WAN")
        self.assertIn("BE15000Z", matrix)
        self.assertEqual(matrix["BE15000Z"]["port_type"], "LAN-WAN")

        scenarios = mesh_zte_engine.PHASE3_SCENARIOS
        self.assertIn("p3_mesh", scenarios)
        self.assertIn("p3_dhcp", scenarios)
        self.assertIn("p3_bridge", scenarios)
        self.assertIn("p3_static", scenarios)

    # -------------------------------------------------------------------------
    # BÀI 1: MESH WI-FI (p3_mesh)
    # -------------------------------------------------------------------------
    def test_scenario1_mesh_positive_skyworth_lan_lan(self):
        """Bài 1 Đạt 100đ: AX3000C nối LAN-LAN với ONT AX3000GZ V2 theo Ma Trận FPT."""
        ws = {
            "nodes": [
                {"id": "node-1", "catalogKey": "ax3000gz_v2", "model": "AX3000GZ V2", "category": "gateway", "ip": "192.168.1.1",
                 "firmwareConfig": {"ssid": "FPT_Mesh_VIP", "wpaKey": "Pass123456", "dhcpEnable": "1"}},
                {"id": "node-2", "catalogKey": "ax3000c", "model": "AX3000C", "category": "ap", "ip": "192.168.1.100",
                 "firmwareConfig": {"ssid": "FPT_Mesh_VIP", "wpaKey": "Pass123456", "dhcpEnable": "0"}}
            ],
            "links": [
                {"srcId": "node-1", "srcPort": "LAN1_1GE", "tgtId": "node-2", "tgtPort": "LAN1", "cableType": "ETH_CAT6A"}
            ]
        }
        res = mesh_zte_engine.evaluate_grading("p3_mesh", session_id="test_p3_session", workspace=ws)
        self.assertEqual(res["score"], 100)
        self.assertTrue(res["passed"])
        self.assertEqual(len(res["rules"]), 5)
        for r in res["rules"]:
            self.assertTrue(r["passed"])

    def test_scenario1_mesh_negative_skyworth_wrong_wan(self):
        """Bài 1 Trừ điểm: AX3000C cắm LAN-WAN (sai chuẩn ma trận Image 2)."""
        ws = {
            "nodes": [
                {"id": "node-1", "catalogKey": "ax3000gz_v2", "model": "AX3000GZ V2", "category": "gateway", "ip": "192.168.1.1",
                 "firmwareConfig": {"ssid": "FPT_Mesh_VIP", "wpaKey": "Pass123456", "dhcpEnable": "1"}},
                {"id": "node-2", "catalogKey": "ax3000c", "model": "AX3000C", "category": "ap", "ip": "192.168.1.100",
                 "firmwareConfig": {"ssid": "FPT_Mesh_VIP", "wpaKey": "Pass123456", "dhcpEnable": "0"}}
            ],
            "links": [
                {"srcId": "node-1", "srcPort": "LAN1_1GE", "tgtId": "node-2", "tgtPort": "WAN_1GE", "cableType": "ETH_CAT6A"}
            ]
        }
        res = mesh_zte_engine.evaluate_grading("p3_mesh", session_id="test_p3_session", workspace=ws)
        self.assertLess(res["score"], 100)
        c1 = next(r for r in res["rules"] if r["id"] == "c1_wiring")
        self.assertFalse(c1["passed"])
        self.assertIn("Tiêu Chuẩn Kỹ Thuật FPT", c1["feedback"])

    def test_scenario1_mesh_negative_wifi_not_synced(self):
        """Bài 1 Trừ điểm: AP chưa đồng bộ SSID với Controller ONT."""
        ws = {
            "nodes": [
                {"id": "node-1", "catalogKey": "ax3000gz_v2", "model": "AX3000GZ V2", "category": "gateway", "ip": "192.168.1.1",
                 "firmwareConfig": {"ssid": "FPT_Mesh_VIP", "wpaKey": "Pass123456", "dhcpEnable": "1"}},
                {"id": "node-2", "catalogKey": "ax3000c", "model": "AX3000C", "category": "ap", "ip": "192.168.1.100",
                 "firmwareConfig": {"ssid": "KhachHang_WiFi_Khac", "wpaKey": "Pass123456", "dhcpEnable": "0"}}
            ],
            "links": [
                {"srcId": "node-1", "srcPort": "LAN1_1GE", "tgtId": "node-2", "tgtPort": "LAN1", "cableType": "ETH_CAT6A"}
            ]
        }
        res = mesh_zte_engine.evaluate_grading("p3_mesh", session_id="test_p3_session", workspace=ws)
        c5 = next(r for r in res["rules"] if r["id"] == "c5_wifi_auth")
        self.assertFalse(c5["passed"])
        self.assertEqual(c5["points"], 0)

    # -------------------------------------------------------------------------
    # BÀI 2: ROUTER NHÁNH DHCP & PPPoE (p3_dhcp)
    # -------------------------------------------------------------------------
    def test_scenario2_dhcp_positive(self):
        """Bài 2 Đạt 100đ: LAN ONT ➔ WAN AP, LAN AP đổi sang 192.168.10.1, bật DHCP."""
        ws = {
            "nodes": [
                {"id": "node-1", "catalogKey": "ax3000gz_v2", "model": "AX3000GZ V2", "category": "gateway", "ip": "192.168.1.1",
                 "firmwareConfig": {"lanIp": "192.168.1.1"}},
                {"id": "node-2", "catalogKey": "ax3000c", "model": "AX3000C", "category": "router", "ip": "192.168.10.1", "opMode": "router",
                 "firmwareConfig": {"lanIp": "192.168.10.1", "dhcpEnable": "1", "dhcpStart": "192.168.10.10", "dhcpEnd": "192.168.10.254"}}
            ],
            "links": [
                {"srcId": "node-1", "srcPort": "LAN1_1GE", "tgtId": "node-2", "tgtPort": "WAN_1GE", "cableType": "ETH_CAT6A"}
            ]
        }
        res = mesh_zte_engine.evaluate_grading("p3_dhcp", session_id="test_p3_session", workspace=ws)
        self.assertEqual(res["score"], 100)
        self.assertTrue(res["passed"])

    def test_scenario2_dhcp_negative_subnet_collision(self):
        """Bài 2 Trừ điểm: AP LAN vẫn giữ 192.168.1.1 (xung đột IP subnet với ONT)."""
        ws = {
            "nodes": [
                {"id": "node-1", "catalogKey": "ax3000gz_v2", "model": "AX3000GZ V2", "category": "gateway", "ip": "192.168.1.1",
                 "firmwareConfig": {"lanIp": "192.168.1.1"}},
                {"id": "node-2", "catalogKey": "ax3000c", "model": "AX3000C", "category": "router", "ip": "192.168.1.1", "opMode": "router",
                 "firmwareConfig": {"lanIp": "192.168.1.1", "dhcpEnable": "1"}}
            ],
            "links": [
                {"srcId": "node-1", "srcPort": "LAN1_1GE", "tgtId": "node-2", "tgtPort": "WAN_1GE", "cableType": "ETH_CAT6A"}
            ]
        }
        res = mesh_zte_engine.evaluate_grading("p3_dhcp", session_id="test_p3_session", workspace=ws)
        c3 = next(r for r in res["rules"] if r["id"] == "c3_subnet")
        self.assertFalse(c3["passed"])
        self.assertIn("Lỗi xung đột IP Subnet", c3["feedback"])

    def test_scenario2_dhcp_negative_wrong_port_lan_lan(self):
        """Bài 2 Trừ điểm: Router nhánh cắm LAN-LAN thay vì LAN-WAN."""
        ws = {
            "nodes": [
                {"id": "node-1", "catalogKey": "ax3000gz_v2", "model": "AX3000GZ V2", "category": "gateway", "ip": "192.168.1.1"},
                {"id": "node-2", "catalogKey": "ax3000c", "model": "AX3000C", "category": "router", "ip": "192.168.10.1",
                 "firmwareConfig": {"lanIp": "192.168.10.1", "dhcpEnable": "1"}}
            ],
            "links": [
                {"srcId": "node-1", "srcPort": "LAN1_1GE", "tgtId": "node-2", "tgtPort": "LAN1", "cableType": "ETH_CAT6A"}
            ]
        }
        res = mesh_zte_engine.evaluate_grading("p3_dhcp", session_id="test_p3_session", workspace=ws)
        c1 = next(r for r in res["rules"] if r["id"] == "c1_wiring")
        self.assertFalse(c1["passed"])

    # -------------------------------------------------------------------------
    # BÀI 3: ACCESS POINT BRIDGE MODE (p3_bridge)
    # -------------------------------------------------------------------------
    def test_scenario3_bridge_positive(self):
        """Bài 3 Đạt 100đ: LAN-LAN, AP DHCP Server TẮT (0 DHCP)."""
        ws = {
            "nodes": [
                {"id": "node-1", "catalogKey": "ax3000gz_v2", "model": "AX3000GZ V2", "category": "gateway", "ip": "192.168.1.1"},
                {"id": "node-2", "catalogKey": "ax3000c", "model": "AX3000C", "category": "ap", "ip": "192.168.1.100",
                 "firmwareConfig": {"lanIp": "192.168.1.100", "dhcpEnable": "0"}}  # 0 DHCP!
            ],
            "links": [
                {"srcId": "node-1", "srcPort": "LAN1_1GE", "tgtId": "node-2", "tgtPort": "LAN1", "cableType": "ETH_CAT6A"}
            ]
        }
        res = mesh_zte_engine.evaluate_grading("p3_bridge", session_id="test_p3_session", workspace=ws)
        self.assertEqual(res["score"], 100)
        self.assertTrue(res["passed"])

    def test_scenario3_bridge_negative_forgot_to_disable_dhcp(self):
        """Bài 3 Trừ điểm: AP quên tắt DHCP Server (gây lỗi Rogue DHCP)."""
        ws = {
            "nodes": [
                {"id": "node-1", "catalogKey": "ax3000gz_v2", "model": "AX3000GZ V2", "category": "gateway", "ip": "192.168.1.1"},
                {"id": "node-2", "catalogKey": "ax3000c", "model": "AX3000C", "category": "ap", "ip": "192.168.1.100",
                 "firmwareConfig": {"lanIp": "192.168.1.100", "dhcpEnable": "1"}}  # Rogue DHCP ON!
            ],
            "links": [
                {"srcId": "node-1", "srcPort": "LAN1_1GE", "tgtId": "node-2", "tgtPort": "LAN1", "cableType": "ETH_CAT6A"}
            ]
        }
        res = mesh_zte_engine.evaluate_grading("p3_bridge", session_id="test_p3_session", workspace=ws)
        c4 = next(r for r in res["rules"] if r["id"] == "c4_dhcp")
        self.assertFalse(c4["passed"])
        self.assertEqual(c4["points"], 0)
        self.assertIn("Rogue DHCP", c4["feedback"])

    # -------------------------------------------------------------------------
    # BÀI 4: IP TĨNH QUẢN LÝ (.2-.9) & TÁCH DHCP POOL (.10-.254) (p3_static)
    # -------------------------------------------------------------------------
    def test_scenario4_static_positive(self):
        """Bài 4 Đạt 100đ: LAN-LAN, AP IP 192.168.1.2 (.2-.9), 0 DHCP, ONT DHCP bắt đầu từ .10."""
        ws = {
            "nodes": [
                {"id": "node-1", "catalogKey": "ax3000gz_v2", "model": "AX3000GZ V2", "category": "gateway", "ip": "192.168.1.1",
                 "firmwareConfig": {"lanIp": "192.168.1.1", "dhcpStart": "192.168.1.10", "dhcpEnd": "192.168.1.254"}},
                {"id": "node-2", "catalogKey": "ax3000s", "model": "AX3000S", "category": "ap", "ip": "192.168.1.2",
                 "firmwareConfig": {"lanIp": "192.168.1.2", "dhcpEnable": "0"}}  # 0 DHCP!
            ],
            "links": [
                {"srcId": "node-1", "srcPort": "LAN1_1GE", "tgtId": "node-2", "tgtPort": "LAN1", "cableType": "ETH_CAT6A"}
            ]
        }
        res = mesh_zte_engine.evaluate_grading("p3_static", session_id="test_p3_session", workspace=ws)
        self.assertEqual(res["score"], 100)
        self.assertTrue(res["passed"])

    def test_scenario4_static_negative_ip_in_dynamic_dhcp_range(self):
        """Bài 4 Trừ điểm: AP đặt IP 192.168.1.50 (rơi vào dải cấp phát động .10-.254)."""
        ws = {
            "nodes": [
                {"id": "node-1", "catalogKey": "ax3000gz_v2", "model": "AX3000GZ V2", "category": "gateway", "ip": "192.168.1.1",
                 "firmwareConfig": {"lanIp": "192.168.1.1", "dhcpStart": "192.168.1.10", "dhcpEnd": "192.168.1.254"}},
                {"id": "node-2", "catalogKey": "ax3000s", "model": "AX3000S", "category": "ap", "ip": "192.168.1.50",
                 "firmwareConfig": {"lanIp": "192.168.1.50", "dhcpEnable": "0"}}
            ],
            "links": [
                {"srcId": "node-1", "srcPort": "LAN1_1GE", "tgtId": "node-2", "tgtPort": "LAN1", "cableType": "ETH_CAT6A"}
            ]
        }
        res = mesh_zte_engine.evaluate_grading("p3_static", session_id="test_p3_session", workspace=ws)
        c3 = next(r for r in res["rules"] if r["id"] == "c3_subnet")
        self.assertFalse(c3["passed"])
        self.assertEqual(c3["points"], 0)
        self.assertIn("cấp phát động DHCP (.10-.254)", c3["feedback"])

    def test_scenario4_static_negative_ont_pool_overlap_warning(self):
        """Bài 4 Nhắc nhở: AP đã tắt DHCP nhưng ONT DHCP pool bắt đầu từ .2 (chưa tách dải .2-.9)."""
        ws = {
            "nodes": [
                {"id": "node-1", "catalogKey": "ax3000gz_v2", "model": "AX3000GZ V2", "category": "gateway", "ip": "192.168.1.1",
                 "firmwareConfig": {"lanIp": "192.168.1.1", "dhcpStart": "192.168.1.2", "dhcpEnd": "192.168.1.254"}},
                {"id": "node-2", "catalogKey": "ax3000s", "model": "AX3000S", "category": "ap", "ip": "192.168.1.2",
                 "firmwareConfig": {"lanIp": "192.168.1.2", "dhcpEnable": "0"}}
            ],
            "links": [
                {"srcId": "node-1", "srcPort": "LAN1_1GE", "tgtId": "node-2", "tgtPort": "LAN1", "cableType": "ETH_CAT6A"}
            ]
        }
        res = mesh_zte_engine.evaluate_grading("p3_static", session_id="test_p3_session", workspace=ws)
        c4 = next(r for r in res["rules"] if r["id"] == "c4_dhcp")
        self.assertFalse(c4["passed"])
        self.assertEqual(c4["points"], 10)  # Partial credit
        self.assertIn("thay vì .10", c4["feedback"])

    # -------------------------------------------------------------------------
    # MISSIONS CHECKLIST TEST
    # -------------------------------------------------------------------------
    def test_missions_endpoint_returns_scenario_specs(self):
        """Kiểm tra get_missions trả về đủ 5 nhiệm vụ checklist và thông số đề bài."""
        for skey in ("p3_mesh", "p3_dhcp", "p3_bridge", "p3_static"):
            m = mesh_zte_engine.get_missions(scenario_key=skey)
            self.assertEqual(m["total"], 5)
            self.assertEqual(len(m["missions"]), 5)
            self.assertIn("scenario", m)
            self.assertEqual(m["scenario"]["id"], skey)
            self.assertIn("device_pair", m["scenario"])

    # -------------------------------------------------------------------------
    # UNIVERSAL MULTI-DEVICE & BLANK CANVAS TESTS
    # -------------------------------------------------------------------------
    def test_empty_canvas_returns_zero_and_actionable_fix(self):
        """Khi Canvas trống hoàn toàn, chấm điểm trả về 0đ và hướng dẫn kéo thiết bị."""
        ws = {"nodes": [], "links": []}
        res = mesh_zte_engine.evaluate_grading("p3_mesh", session_id="test_empty", workspace=ws)
        self.assertEqual(res["score"], 0)
        self.assertFalse(res["passed"])
        self.assertIn("kéo", res["actionable_fix"].lower())
        self.assertIn("mini_topology", res)
        self.assertIsNone(res["mini_topology"]["ont"])

    def test_universal_zte_agent_requires_lan_wan(self):
        """ZTE Agent (AC1200Z/AX1800AZ/AX3000AZ/BE15000Z) theo Ảnh 2 phải cắm LAN ➔ WAN."""
        ws_wan = {
            "nodes": [
                {"id": "ont-1", "catalogKey": "ax3000gz", "model": "AX3000GZ", "category": "gateway", "ip": "192.168.1.1",
                 "firmwareConfig": {"lanIp": "192.168.1.1", "ssid": "FPT_Mesh", "wpaKey": "12345678", "dhcpEnable": "1"}},
                {"id": "ap-1", "catalogKey": "ac1200z", "model": "AC1200Z", "category": "ap", "ip": "192.168.1.100",
                 "firmwareConfig": {"lanIp": "192.168.1.100", "ssid": "FPT_Mesh", "wpaKey": "12345678"}}
            ],
            "links": [
                {"srcId": "ont-1", "srcPort": "LAN1", "tgtId": "ap-1", "tgtPort": "WAN", "cableType": "ETH_CAT6A"}
            ]
        }
        res_wan = mesh_zte_engine.evaluate_grading("p3_mesh", workspace=ws_wan)
        c1 = next(r for r in res_wan["rules"] if r["id"] == "c1_wiring")
        self.assertTrue(c1["passed"])
        self.assertEqual(c1["points"], 20)

        # Cắm LAN-LAN đối với ZTE Agent sẽ bị trừ điểm theo ma trận Ảnh 2
        ws_lan = {
            "nodes": ws_wan["nodes"],
            "links": [
                {"srcId": "ont-1", "srcPort": "LAN1", "tgtId": "ap-1", "tgtPort": "LAN1", "cableType": "ETH_CAT6A"}
            ]
        }
        res_lan = mesh_zte_engine.evaluate_grading("p3_mesh", workspace=ws_lan)
        c1_lan = next(r for r in res_lan["rules"] if r["id"] == "c1_wiring")
        self.assertFalse(c1_lan["passed"])
        self.assertEqual(c1_lan["points"], 0)
        self.assertIn("Ảnh 2", c1_lan["feedback"])

    def test_universal_non_zte_agent_requires_lan_lan(self):
        """Non-ZTE Agent (AX3000C, AX3000S, etc.) theo Ảnh 2 phải cắm LAN ➔ LAN."""
        ws_lan = {
            "nodes": [
                {"id": "ont-2", "catalogKey": "ax1800c", "model": "AX1800C", "category": "gateway", "ip": "192.168.1.1",
                 "firmwareConfig": {"lanIp": "192.168.1.1", "ssid": "FPT_Mesh", "wpaKey": "12345678", "dhcpEnable": "1"}},
                {"id": "ap-2", "catalogKey": "ax3000c", "model": "AX3000C", "category": "ap", "ip": "192.168.1.100",
                 "firmwareConfig": {"lanIp": "192.168.1.100", "ssid": "FPT_Mesh", "wpaKey": "12345678"}}
            ],
            "links": [
                {"srcId": "ont-2", "srcPort": "LAN1", "tgtId": "ap-2", "tgtPort": "LAN1", "cableType": "ETH_CAT6A"}
            ]
        }
        res_lan = mesh_zte_engine.evaluate_grading("p3_mesh", workspace=ws_lan)
        c1 = next(r for r in res_lan["rules"] if r["id"] == "c1_wiring")
        self.assertTrue(c1["passed"])
        self.assertEqual(c1["points"], 20)



if __name__ == "__main__":
    unittest.main()
