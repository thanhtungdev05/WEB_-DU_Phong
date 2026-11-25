# -*- coding: utf-8 -*-
"""
Contract & End-to-End Integration Tests for the 4-Step Binary Mesh Grading System
and Portal Lesson Integration (Bài 7 - Cấu hình Mesh AX3000CV2 với AX3000CV2,
ONT + AP pairs, Out-of-Scope Config Guard, LAN-LAN vs ZTE LAN-WAN wiring, and Live Topology).
"""

import copy
import sys
import unittest
from pathlib import Path

ROOT = Path(__file__).resolve().parent.parent
FW053_SRC = ROOT / "simulators" / "sim_ax3000c" / "fw_053" / "src"
for p in (str(ROOT), str(FW053_SRC)):
    if p not in sys.path:
        sys.path.insert(0, p)

import ax3000c_kho_cau_hinh as kho_mod
import mesh_sync_adapter
import mesh_zte_engine


def _make_ax3000c_pair_workspace() -> dict:
    return {
        "nodes": [
            {
                "id": "node-1",
                "catalogKey": "ax3000c",
                "simId": "sim_ax3000c",
                "name": "AX3000C_V2_1",
                "model": "AX3000C V2",
                "category": "ap",
                "role": "slave",
                "ip": "192.168.100.1",
                "mac": "94:F7:17:24:0A:90",
                "power": True,
                "requireExplicitMeshMode": True,
                "firmwareConfig": {"requireExplicitMeshMode": True},
            },
            {
                "id": "node-2",
                "catalogKey": "ax3000c",
                "simId": "sim_ax3000c",
                "name": "AX3000C_V2_2",
                "model": "AX3000C V2",
                "category": "ap",
                "role": "slave",
                "ip": "192.168.100.200",
                "mac": "5C:1A:6F:C3:A2:61",
                "power": True,
                "requireExplicitMeshMode": True,
                "firmwareConfig": {"requireExplicitMeshMode": True},
            },
        ],
        "links": [
            {
                "id": "link-1",
                "srcId": "node-1",
                "srcPort": "LAN1_1GE",
                "tgtId": "node-2",
                "tgtPort": "LAN1_1GE",
                "fromNodeId": "node-1",
                "fromPort": "LAN1_1GE",
                "toNodeId": "node-2",
                "toPort": "LAN1_1GE",
                "cableType": "ETH_CAT6A",
                "speed": 1000,
                "speedMbps": 1000,
            }
        ],
    }


def _configure_ax3000c_backend(
    base_ktv_id: str,
    node_id: str,
    *,
    mesh_enabled: bool = True,
    mesh_role: str = "Controller",
    pppoe_user: str = "sgfdl-123456-789",
    pppoe_pass: str = "d123456",
    wan_proto: str = "pppoe",
    ssid: str = "FPT Telecom",
    wifi_pass: str = "fpt12345",
    vap_diff_mode: bool = False,
    modify_lan_ip: str | None = None,
    modify_guest_wifi: bool = False,
    modify_portfwd: bool = False,
) -> None:
    skey = mesh_sync_adapter.make_node_session_key(base_ktv_id, node_id)
    for k in (skey, "cookie:" + skey):
        kho = kho_mod._kho_cua_ktv(k)
        kho.dat_lai()

        # Bước 1: EasyMesh Mode
        kho.ghi(
            "network.wireless.easymesh.get",
            {
                "MeshEnabled": mesh_enabled,
                "MeshRole": mesh_role,
                "MeshBand": "5G",
                "MeshBSS": f"{ssid}BH",
            },
        )

        # Bước 2.1: WAN PPPoE
        cig = copy.deepcopy(kho.doc("data_repo.cigext.cay_cau_hinh") or {})
        cig_wan = cig.setdefault("network", {}).setdefault("wan", {})
        cig_wan["proto"] = wan_proto
        cig_wan["username"] = pppoe_user
        cig_wan["password"] = pppoe_pass
        kho.ghi("data_repo.cigext.cay_cau_hinh", cig)

        uci = copy.deepcopy(kho.doc("uci.cay_cau_hinh") or {})
        uci_wan = uci.setdefault("network", {}).setdefault("wan", {})
        uci_wan["proto"] = wan_proto
        uci_wan["username"] = pppoe_user
        uci_wan["password"] = pppoe_pass
        if modify_lan_ip:
            uci.setdefault("network", {}).setdefault("lan", {})["ipaddr"] = modify_lan_ip
        kho.ghi("uci.cay_cau_hinh", uci)

        wan_doc = copy.deepcopy(kho.doc("data_repo.weboui.wan_get") or {"wan": {}})
        wan_sec = wan_doc.setdefault("wan", {})
        wan_sec["proto"] = wan_proto
        wan_sec["username"] = pppoe_user
        wan_sec["password"] = pppoe_pass
        kho.ghi("data_repo.weboui.wan_get", wan_doc)

        # Bước 2.2: Wi-Fi
        wifi_doc = copy.deepcopy(kho.doc("data_repo.weboui.wifi_get") or {"host": {"2G": {}, "5G": {}}})
        host = wifi_doc.setdefault("host", {})
        for band in ("2G", "5G"):
            b = host.setdefault(band, {})
            b["disabled"] = False
            b["vap_diff_mode"] = vap_diff_mode
            b["ssid"] = ssid
            b["key"] = wifi_pass
            b["encryption"] = "psk2+ccmp"
            b["sae"] = "0"
        if modify_guest_wifi:
            wifi_doc.setdefault("guest", {}).setdefault("2G", {})["ssid"] = "Hacked_Guest_WiFi"
        kho.ghi("data_repo.weboui.wifi_get", wifi_doc)

        if modify_portfwd:
            kho.ghi("data_repo.weboui.portfwd_get", {"rules": [{"name": "test", "wan_port": "8080"}]})

        kho.ghi("uci.cay_mtime", {"network": 1, "wireless": 1})


class TestMesh4StepGradingContract(unittest.TestCase):
    def setUp(self):
        self.ktv_id = "ktv_4step_test"
        mesh_sync_adapter.reset_workspace(self.ktv_id)
        for nid in ("node-1", "node-2"):
            skey = mesh_sync_adapter.make_node_session_key(self.ktv_id, nid)
            for k in (skey, "cookie:" + skey):
                kho_mod._kho_cua_ktv(k).dat_lai()

    def test_01_wrong_device_pair_rejected_with_clear_error(self):
        """Selecting wrong devices for LAB_AX3000CV2_07 must report explicit wrong-device error."""
        wrong_ws = {
            "nodes": [
                {"id": "node-1", "catalogKey": "ax3000gz_v2", "model": "AX3000GZ V2", "category": "gateway"},
                {"id": "node-2", "catalogKey": "ax3000c", "model": "AX3000C V2", "category": "ap"},
            ],
            "links": [],
        }
        res = mesh_zte_engine.evaluate_grading(
            scenario_key="p3_mesh_ax3000cv2",
            session_id=self.ktv_id,
            workspace=wrong_ws,
            lab_id="LAB_AX3000CV2_07",
            grading_mode="4step",
        )
        self.assertFalse(res["passed"])
        self.assertEqual(res["status_label"], "CHƯA ĐẠT")
        self.assertFalse(res["device_pair_valid"])
        self.assertIn("Sai thiết bị! Vui lòng chọn đúng thiết bị thuộc phần cấu hình đã chọn", res["device_pair_error"])
        self.assertEqual(len(res["rules"]), 4)
        self.assertTrue(all(not r["passed"] for r in res["rules"]))

    def test_02_initial_unconfigured_ax3000cv2_pair_fails_step1_and_step2(self):
        """Freshly dragged AX3000CV2 pair starts at MeshRole=Agent and default PPPoE/Wi-Fi -> fails Step 1, 2, 4."""
        ws = _make_ax3000c_pair_workspace()
        res = mesh_zte_engine.evaluate_grading(
            scenario_key="p3_mesh_ax3000cv2",
            session_id=self.ktv_id,
            workspace=ws,
            lab_id="LAB_AX3000CV2_07",
            grading_mode="4step",
        )
        self.assertFalse(res["passed"])
        self.assertEqual(res["status_label"], "CHƯA ĐẠT")
        self.assertTrue(res["device_pair_valid"])
        rules_by_id = {r["id"]: r for r in res["rules"]}
        # Step 1 fails because both devices are still Agent
        self.assertFalse(rules_by_id["step1_mesh_mode"]["passed"])
        # Step 2 fails because PPPoE and Wi-Fi are not configured yet
        self.assertFalse(rules_by_id["step2_ont_pppoe_wifi"]["passed"])
        # Step 3 passes because LAN1_1GE <-> LAN1_1GE cable is connected
        self.assertTrue(rules_by_id["step3_wiring"]["passed"])
        # Step 4 fails because Step 1 is not Controller yet so Topology hasn't formed
        self.assertFalse(rules_by_id["step4_mesh_topology"]["passed"])

    def test_03_all_4_steps_correct_passes_binary_grading(self):
        """When all 4 steps are properly configured on AX3000CV2 ↔ AX3000CV2, result is ĐẠT."""
        ws = _make_ax3000c_pair_workspace()
        _configure_ax3000c_backend(
            self.ktv_id,
            "node-1",
            mesh_enabled=True,
            mesh_role="Controller",
            pppoe_user="sgfdl-123456-789",
            pppoe_pass="d123456",
            ssid="FPT Telecom",
            wifi_pass="fpt12345",
            vap_diff_mode=False,
        )
        res = mesh_zte_engine.evaluate_grading(
            scenario_key="p3_mesh_ax3000cv2",
            session_id=self.ktv_id,
            workspace=ws,
            lab_id="LAB_AX3000CV2_07",
            grading_mode="4step",
        )
        self.assertTrue(res["passed"], f"Expected pass, got: {res}")
        self.assertEqual(res["status_label"], "ĐẠT")
        self.assertEqual(res["passed_rules"], 4)
        self.assertEqual(res["total_rules"], 4)
        for r in res["rules"]:
            self.assertTrue(r["passed"], f"Rule {r['id']} failed: {r}")
            self.assertEqual(r["status_text"], "✔ Đúng")
            self.assertNotIn("points", r)

    def test_04_step2_out_of_scope_modification_fails_strictly(self):
        """Modifying out-of-scope sections (LAN/DHCP, Guest Wi-Fi, Port Forwarding) must fail Step 2."""
        ws = _make_ax3000c_pair_workspace()
        _configure_ax3000c_backend(
            self.ktv_id,
            "node-1",
            mesh_enabled=True,
            mesh_role="Controller",
            pppoe_user="sgfdl-123456-789",
            pppoe_pass="d123456",
            ssid="FPT Telecom",
            wifi_pass="fpt12345",
            modify_lan_ip="192.168.55.1",
            modify_portfwd=True,
        )
        res = mesh_zte_engine.evaluate_grading(
            scenario_key="p3_mesh_ax3000cv2",
            session_id=self.ktv_id,
            workspace=ws,
            lab_id="LAB_AX3000CV2_07",
            grading_mode="4step",
        )
        self.assertFalse(res["passed"])
        self.assertEqual(res["status_label"], "CHƯA ĐẠT")
        rules_by_id = {r["id"]: r for r in res["rules"]}
        self.assertFalse(rules_by_id["step2_ont_pppoe_wifi"]["passed"])
        self.assertIn("Cấu hình LAN / DHCP", rules_by_id["step2_ont_pppoe_wifi"]["actual"])
        self.assertIn("Cấu hình Port Forwarding", rules_by_id["step2_ont_pppoe_wifi"]["actual"])

    def test_05_step3_wiring_lan_wan_fails_on_ax3000cv2_but_passes_on_zte(self):
        """Step 3 requires LAN-LAN for AX3000CV2 and LAN-WAN for ZTE (BE12000Z + BE15000Z)."""
        ws = _make_ax3000c_pair_workspace()
        ws["links"][0]["tgtPort"] = "WAN_1GE"
        ws["links"][0]["toPort"] = "WAN_1GE"
        _configure_ax3000c_backend(self.ktv_id, "node-1")

        res_cv2 = mesh_zte_engine.evaluate_grading(
            scenario_key="p3_mesh_ax3000cv2",
            session_id=self.ktv_id,
            workspace=ws,
            lab_id="LAB_AX3000CV2_07",
            grading_mode="4step",
        )
        self.assertFalse(res_cv2["passed"])
        rules_cv2 = {r["id"]: r for r in res_cv2["rules"]}
        self.assertFalse(rules_cv2["step3_wiring"]["passed"])
        self.assertIn("LAN ➔ LAN", rules_cv2["step3_wiring"]["feedback"])
        # Because cable is plugged into WAN instead of LAN, Mesh Topology in Step 4 also fails
        self.assertFalse(rules_cv2["step4_mesh_topology"]["passed"])

        # Now test ZTE BE12000Z + BE15000Z where LAN -> WAN is required
        zte_ws = {
            "nodes": [
                {
                    "id": "node-1",
                    "catalogKey": "be12000",
                    "simId": "sim_be12000",
                    "name": "ONT_BE12000Z",
                    "model": "ONT BE12000Z",
                    "category": "gateway",
                },
                {
                    "id": "node-2",
                    "catalogKey": "be15000",
                    "name": "AP_BE15000Z",
                    "model": "AP BE15000Z",
                    "category": "ap",
                },
            ],
            "links": [
                {
                    "id": "link-1",
                    "srcId": "node-1",
                    "srcPort": "LAN1_10GE",
                    "tgtId": "node-2",
                    "tgtPort": "WAN_25GE",
                }
            ],
        }
        res_zte = mesh_zte_engine.evaluate_grading(
            scenario_key="p3_mesh_zte",
            session_id=self.ktv_id,
            workspace=zte_ws,
            lab_id="LAB_BE12000_07",
            grading_mode="4step",
        )
        rules_zte = {r["id"]: r for r in res_zte["rules"]}
        self.assertTrue(rules_zte["step3_wiring"]["passed"])

        # If ZTE is wired LAN -> LAN, Step 3 must fail
        zte_ws["links"][0]["tgtPort"] = "LAN1_1GE"
        res_zte_bad = mesh_zte_engine.evaluate_grading(
            scenario_key="p3_mesh_zte",
            session_id=self.ktv_id,
            workspace=zte_ws,
            lab_id="LAB_BE12000_07",
            grading_mode="4step",
        )
        rules_zte_bad = {r["id"]: r for r in res_zte_bad["rules"]}
        self.assertFalse(rules_zte_bad["step3_wiring"]["passed"])
        self.assertIn("LAN ➔ WAN", rules_zte_bad["step3_wiring"]["feedback"])

    def test_06_ont_ax3000gzv2_with_ax3000cv2_inherits_device_lesson_standards(self):
        """ONT AX3000GZ V2 + AP AX3000CV2 inherits AX3000GZ V2 Bai 1 (sgfdl-123456-789/fpt12345) & Bai 2 (FPT Telecom/Fptwifi123)."""
        ws = {
            "nodes": [
                {
                    "id": "node-1",
                    "catalogKey": "ax3000gz_v2",
                    "simId": "sim_ax3000gz_v2",
                    "name": "ONT_AX3000GZ_V2",
                    "model": "AX3000GZ V2",
                    "category": "gateway",
                    "firmwareConfig": {
                        "hasKtvCustomConfig": True,
                        "pppoeUser": "sgfdl-123456-789",
                        "pppoePass": "fpt12345",
                        "ssid": "FPT Telecom",
                        "ssid5g": "FPT Telecom",
                        "password": "Fptwifi123",
                        "password5g": "Fptwifi123",
                    },
                },
                {
                    "id": "node-2",
                    "catalogKey": "ax3000c",
                    "simId": "sim_ax3000c",
                    "name": "AP_AX3000CV2",
                    "model": "AX3000C V2",
                    "category": "ap",
                    "requireExplicitMeshMode": True,
                    "firmwareConfig": {"requireExplicitMeshMode": True},
                },
            ],
            "links": [
                {
                    "id": "link-1",
                    "srcId": "node-1",
                    "srcPort": "LAN1_1GE",
                    "tgtId": "node-2",
                    "tgtPort": "LAN1_1GE",
                }
            ],
        }
        res = mesh_zte_engine.evaluate_grading(
            scenario_key="p3_mesh_ax3000gzv2",
            session_id=self.ktv_id,
            workspace=ws,
            lab_id="LAB_AX3000GZV2_07",
            grading_mode="4step",
        )
        self.assertTrue(res["passed"], f"Expected AX3000GZ V2 + AX3000CV2 to pass, got: {res}")
        self.assertEqual(res["status_label"], "ĐẠT")

    def test_07_portal_lesson_metadata_and_guide_popup_layers(self):
        """Verify devices/ax3000c/lessons/bai7.js and app.js support 2-layer Guide tooltips & Practice Popup for Mesh."""
        bai7_text = (ROOT / "devices" / "ax3000c" / "lessons" / "bai7.js").read_text(encoding="utf-8")
        self.assertIn("displayTitle: 'Bài 7 - Cấu hình Mesh AX3000CV2 với AX3000CV2'", bai7_text)
        self.assertIn("isMeshTopologyLab: true", bai7_text)
        self.assertIn("meshRequiredDevices: ['ax3000c', 'ax3000c']", bai7_text)
        self.assertIn("evaluatePortalMeshLessonSync", bai7_text)

        app_text = (ROOT / "app.js").read_text(encoding="utf-8")
        self.assertIn("getMeshTopologyGuidePopupsForDoc", app_text)
        self.assertIn("lesson.displayTitle || lesson.title", app_text)

    def test_08_atomic_details_rows_pinpoint_exact_wrong_fields(self):
        """Verify res['details'] provides atomic per-field rows so only the exact wrong field is flagged."""
        ws = _make_ax3000c_pair_workspace()
        _configure_ax3000c_backend(
            self.ktv_id,
            "node-1",
            mesh_enabled=True,
            mesh_role="Controller",
            pppoe_user="sgfdl-123456-789",
            pppoe_pass="WRONG_PASS",
            ssid="FPT Telecom",
            wifi_pass="fpt12345",
            vap_diff_mode=False,
        )
        res = mesh_zte_engine.evaluate_grading(
            scenario_key="p3_mesh_ax3000cv2",
            session_id=self.ktv_id,
            workspace=ws,
            lab_id="LAB_AX3000CV2_07",
            grading_mode="4step",
        )
        self.assertFalse(res["passed"])
        details_by_field = {d["field"]: d for d in res.get("details", [])}
        # Only PPPoE Password should fail; all other atomic fields should pass!
        self.assertTrue(details_by_field["Bước 1 (Mode Mesh): EasyMesh Enabled (Thiết bị 1 - Chính)"]["ok"])
        self.assertTrue(details_by_field["Bước 1 (Mode Mesh): MeshRole (Thiết bị 1 - Chính)"]["ok"])
        self.assertTrue(details_by_field["Bước 2 (PPPoE): Giao thức WAN (Protocol)"]["ok"])
        self.assertTrue(details_by_field["Bước 2 (PPPoE): Username"]["ok"])
        self.assertFalse(details_by_field["Bước 2 (PPPoE): Password"]["ok"])
        self.assertEqual(details_by_field["Bước 2 (PPPoE): Password"]["actual"], "WRONG_PASS")
        self.assertEqual(details_by_field["Bước 2 (PPPoE): Password"]["expected"], "d123456")
        self.assertTrue(details_by_field["Bước 2 (Wi-Fi): Use separate SSID for 2.4G and 5G"]["ok"])
        self.assertTrue(details_by_field["Bước 2 (Wi-Fi): Tên sóng Wi-Fi (SSID)"]["ok"])
        self.assertTrue(details_by_field["Bước 2 (Wi-Fi): Mật khẩu Wi-Fi (Password)"]["ok"])
        self.assertTrue(details_by_field["Bước 3 (Đấu nối dây): Cổng cắm cáp giữa 2 thiết bị"]["ok"])
        self.assertTrue(details_by_field["Bước 4 (Topology Mesh): Kết nối & Đồng bộ Sơ đồ Mesh"]["ok"])

    def test_09_sync_topology_never_overwrites_webgui_configured_ax3000cv2(self):
        """Stale frontend firmwareConfig (e.g. wpaKey='admin') must never overwrite live Web GUI config in kho."""
        ws = _make_ax3000c_pair_workspace()
        # Simulate stale frontend firmwareConfig values that previously overwrote kho
        ws["nodes"][0]["firmwareConfig"] = {
            "requireExplicitMeshMode": True,
            "webguiTouched": True,
            "ssid2g": "FPT_Wifi6",
            "wpaKey": "admin",
            "password": "admin",
            "meshEnable": False,
        }
        _configure_ax3000c_backend(
            self.ktv_id,
            "node-1",
            mesh_enabled=True,
            mesh_role="Controller",
            pppoe_user="sgfdl-123456-789",
            pppoe_pass="d123456",
            ssid="FPT Telecom",
            wifi_pass="fpt12345",
            vap_diff_mode=False,
        )
        res = mesh_zte_engine.evaluate_grading(
            scenario_key="p3_mesh_ax3000cv2",
            session_id=self.ktv_id,
            workspace=ws,
            lab_id="LAB_AX3000CV2_07",
            grading_mode="4step",
        )
        self.assertTrue(res["passed"], f"Expected pass even with stale frontend firmwareConfig, got: {res}")
        self.assertTrue(all(d["ok"] for d in res.get("details", [])))


if __name__ == "__main__":
    unittest.main()
