#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""Comprehensive integration & security test suite for:
- Per-(ktv_id, node_id) simulator session isolation (/mesh-node/<node_id>/<sim_id>/...)
- Zero interference with standalone portal.html simulator sessions and current_sim cookies
- Real A -> B backend propagation & persistence across ALL 16/16 simulators
- Router A -> Router B (Router mode) WAN-only provisioning vs AP/Bridge full sync
- F5 workspace persistence (GET/POST /api/mesh-lab/workspace) and Reset cleanup
- Authorization (403 on non-DEV) and path-traversal / bad node_id rejection (400)
"""

from __future__ import annotations

import http.client
import json
import os
from pathlib import Path
import shutil
import sys
import threading
import unittest
from http.server import ThreadingHTTPServer
from urllib.parse import quote

REPO_ROOT = Path(__file__).resolve().parent.parent

_orig_argv = sys.argv
try:
    sys.argv = [sys.argv[0]]
    if str(REPO_ROOT) not in sys.path:
        sys.path.insert(0, str(REPO_ROOT))
    import mesh_sync_adapter
    import run_all
finally:
    sys.argv = _orig_argv


class Mesh16DevicesCrossSyncAndIsolationTests(unittest.TestCase):
    @classmethod
    def setUpClass(cls):
        cls.server = ThreadingHTTPServer(("127.0.0.1", 0), run_all.MasterDispatcher)
        cls.thread = threading.Thread(target=cls.server.serve_forever, daemon=True)
        cls.thread.start()
        cls.port = cls.server.server_address[1]
        cls._ktv_ids_to_clean: list[str] = []

    @classmethod
    def tearDownClass(cls):
        for ktv in cls._ktv_ids_to_clean:
            try:
                mesh_sync_adapter.reset_workspace(ktv)
                ws_path = mesh_sync_adapter._workspace_path(ktv)
                if ws_path.exists():
                    ws_path.unlink()
            except Exception:
                pass
        cls.server.shutdown()
        cls.server.server_close()
        cls.thread.join(timeout=5)

    def register_ktv(self, ktv_id: str) -> str:
        if ktv_id not in self._ktv_ids_to_clean:
            self._ktv_ids_to_clean.append(ktv_id)
        return ktv_id

    def http_req(
        self,
        path: str,
        method: str = "GET",
        body: bytes | dict | None = None,
        headers: dict[str, str] | None = None,
    ):
        hdrs = dict(headers or {})
        raw_body = body
        if isinstance(body, dict):
            raw_body = json.dumps(body).encode("utf-8")
            hdrs.setdefault("Content-Type", "application/json")
        conn = http.client.HTTPConnection("127.0.0.1", self.port, timeout=15)
        try:
            conn.request(method, path, body=raw_body, headers=hdrs)
            resp = conn.getresponse()
            data = resp.read()
            set_cookies = resp.headers.get_all("Set-Cookie") or []
            return resp.status, dict(resp.headers), set_cookies, data
        finally:
            conn.close()

    def json_req(
        self,
        path: str,
        method: str = "GET",
        body: dict | None = None,
        ktv_id: str = "ktv_test_default",
        role: str = "DEV",
    ):
        hdrs = {
            "X-KTV-Session-ID": ktv_id,
            "X-Mock-User-Role": role,
        }
        status, resp_hdrs, cookies, data = self.http_req(path, method=method, body=body, headers=hdrs)
        parsed = json.loads(data.decode("utf-8")) if data else {}
        return status, resp_hdrs, cookies, parsed

    # ------------------------------------------------------------------
    # 1. Security & Traversal Validation
    # ------------------------------------------------------------------

    def test_01_authorization_and_path_traversal_guards(self):
        ktv = self.register_ktv("ktv_sec_01")

        # Non-DEV roles must be forbidden on all mesh-lab state/sync endpoints
        for role in ("KTV", "ADMIN", "GUEST", ""):
            st_ws_get, _, _, _ = self.json_req("/api/mesh-lab/workspace", "GET", ktv_id=ktv, role=role)
            self.assertEqual(st_ws_get, 403, f"Expected 403 for role={role!r} on GET /workspace")

            st_ws_post, _, _, _ = self.json_req(
                "/api/mesh-lab/workspace", "POST", body={"nodes": []}, ktv_id=ktv, role=role
            )
            self.assertEqual(st_ws_post, 403, f"Expected 403 for role={role!r} on POST /workspace")

            st_nc, _, _, _ = self.json_req(
                "/api/mesh-lab/node-config?node_id=n1&sim_id=sim_be12000", "GET", ktv_id=ktv, role=role
            )
            self.assertEqual(st_nc, 403, f"Expected 403 for role={role!r} on GET /node-config")

            st_sync, _, _, _ = self.json_req(
                "/api/mesh-lab/sync-topology", "POST", body={"nodes": [], "links": []}, ktv_id=ktv, role=role
            )
            self.assertEqual(st_sync, 403, f"Expected 403 for role={role!r} on POST /sync-topology")

            st_rst, _, _, _ = self.json_req(
                "/api/mesh-lab/reset", "POST", body={}, ktv_id=ktv, role=role
            )
            self.assertEqual(st_rst, 403, f"Expected 403 for role={role!r} on POST /reset")

        # Traversal or invalid node_id / sim_id must be rejected (404 from sensitive-path guard or 400 from node regex)
        st_trav, _, _, _ = self.http_req("/mesh-node/../etc/sim_be12000/", headers={"X-KTV-Session-ID": ktv})
        self.assertIn(st_trav, (400, 404), "Expected 400 or 404 for traversal /mesh-node/../etc/sim_be12000/")

        bad_paths = [
            "/mesh-node/bad$node/sim_be12000/",
            "/mesh-node/node..dot/sim_be12000/",
        ]
        for bp in bad_paths:
            st, _, _, _ = self.http_req(bp, headers={"X-KTV-Session-ID": ktv})
            self.assertEqual(st, 400, f"Expected 400 for malformed /mesh-node/ path: {bp}")

        st_bad_nc, _, _, _ = self.json_req(
            "/api/mesh-lab/node-config?node_id=../etc&sim_id=sim_be12000", "GET", ktv_id=ktv, role="DEV"
        )
        self.assertEqual(st_bad_nc, 400)

        st_bad_sim, _, _, _ = self.json_req(
            "/api/mesh-lab/node-config?node_id=node_1&sim_id=sim_unknown_xyz", "GET", ktv_id=ktv, role="DEV"
        )
        self.assertEqual(st_bad_sim, 400)

    # ------------------------------------------------------------------
    # 2. Shim Injection, Content-Length, HEAD, Non-Polluting Cookies & Portal Isolation
    # ------------------------------------------------------------------

    def test_02_mesh_node_shim_injection_no_cookie_pollution_and_portal_isolation(self):
        ktv = self.register_ktv("ktv_shim_iso_02")

        # Load /mesh-node/node_a/sim_be15000/pages/localNetStatus.html
        st, hdrs, cookies, body = self.http_req(
            "/mesh-node/node_a/sim_be15000/pages/localNetStatus.html",
            headers={"X-KTV-Session-ID": ktv},
        )
        self.assertEqual(st, 200)
        html = body.decode("utf-8", errors="ignore")
        self.assertIn('data-fpt-mesh-node="1"', html)
        self.assertIn("__FPT_MESH_NODE_ID", html)
        self.assertEqual(int(hdrs.get("Content-Length", "-1")), len(body))

        # current_sim cookie must NEVER be emitted on /mesh-node/* responses
        for c in cookies:
            self.assertFalse(c.lower().startswith("current_sim="), f"Unexpected current_sim cookie leaked: {c}")

        # HEAD on /mesh-node/* must succeed with zero body
        st_head, _, cookies_head, body_head = self.http_req(
            "/mesh-node/node_a/sim_be15000/pages/localNetStatus.html",
            method="HEAD",
            headers={"X-KTV-Session-ID": ktv},
        )
        self.assertEqual(st_head, 200)
        self.assertEqual(len(body_head), 0)
        for c in cookies_head:
            self.assertFalse(c.lower().startswith("current_sim="))

        # Write 3 distinct AX3000S states under same ktv: node_s1, node_s2, and standalone portal
        st1, _, _, _ = self.http_req(
            "/mesh-node/node_s1/sim_ax3000s/api/sim-state",
            method="POST",
            body={"radios": [{"band": "2.4G", "ssid": "MESH_S1_WIFI", "password": "PassS1111"}]},
            headers={"X-KTV-Session-ID": ktv},
        )
        self.assertEqual(st1, 200)

        st2, _, _, _ = self.http_req(
            "/mesh-node/node_s2/sim_ax3000s/api/sim-state",
            method="POST",
            body={"radios": [{"band": "2.4G", "ssid": "MESH_S2_WIFI", "password": "PassS2222"}]},
            headers={"X-KTV-Session-ID": ktv},
        )
        self.assertEqual(st2, 200)

        st3, _, _, _ = self.http_req(
            "/sim_ax3000s/api/sim-state",
            method="POST",
            body={"radios": [{"band": "2.4G", "ssid": "PORTAL_STANDALONE_WIFI", "password": "PassPortal"}]},
            headers={"X-KTV-Session-ID": ktv},
        )
        self.assertEqual(st3, 200)

        # Read back each of the 3 sessions over HTTP -> all 3 remain completely isolated
        _, _, _, b1 = self.http_req("/mesh-node/node_s1/sim_ax3000s/api/sim-state", headers={"X-KTV-Session-ID": ktv})
        _, _, _, b2 = self.http_req("/mesh-node/node_s2/sim_ax3000s/api/sim-state", headers={"X-KTV-Session-ID": ktv})
        _, _, _, b3 = self.http_req("/sim_ax3000s/api/sim-state", headers={"X-KTV-Session-ID": ktv})
        self.assertEqual(json.loads(b1)["radios"][0]["ssid"], "MESH_S1_WIFI")
        self.assertEqual(json.loads(b2)["radios"][0]["ssid"], "MESH_S2_WIFI")
        self.assertEqual(json.loads(b3)["radios"][0]["ssid"], "PORTAL_STANDALONE_WIFI")

        # Cleanup standalone portal ktv state
        mesh_sync_adapter.reset_node_backend("sim_ax3000s", ktv)
        mesh_sync_adapter.reset_node_backend("sim_ax3000s", mesh_sync_adapter.make_node_session_key(ktv, "node_s1"))
        mesh_sync_adapter.reset_node_backend("sim_ax3000s", mesh_sync_adapter.make_node_session_key(ktv, "node_s2"))

    # ------------------------------------------------------------------
    # 3. Duplicate Identical Models Isolation Across Multiple Simulators
    # ------------------------------------------------------------------

    def test_03_duplicate_identical_models_isolated_under_same_ktv(self):
        ktv = self.register_ktv("ktv_dup_models_03")

        # A) Dual sim_ax3000gz HTTP save + readback
        self.http_req(
            "/mesh-node/gz_one/sim_ax3000gz/api/sim-state",
            method="POST",
            body={"wlan24": {"SSID": "GZ_NODE_ONE", "KeyPassphrase": "KeyGz1111"}, "lan": {"lanIp": "192.168.10.1"}},
            headers={"X-KTV-Session-ID": ktv},
        )
        self.http_req(
            "/mesh-node/gz_two/sim_ax3000gz/api/sim-state",
            method="POST",
            body={"wlan24": {"SSID": "GZ_NODE_TWO", "KeyPassphrase": "KeyGz2222"}, "lan": {"lanIp": "192.168.20.1"}},
            headers={"X-KTV-Session-ID": ktv},
        )
        _, _, _, g1_raw = self.http_req(
            "/mesh-node/gz_one/sim_ax3000gz/gia-tri-that.json", headers={"X-KTV-Session-ID": ktv}
        )
        _, _, _, g2_raw = self.http_req(
            "/mesh-node/gz_two/sim_ax3000gz/gia-tri-that.json", headers={"X-KTV-Session-ID": ktv}
        )
        self.assertEqual(json.loads(g1_raw)["admin__localnetwork__WLAN__WLANbasic"]["WLAN SSID Configuration"][0]["SSID"], "GZ_NODE_ONE")
        self.assertEqual(json.loads(g2_raw)["admin__localnetwork__WLAN__WLANbasic"]["WLAN SSID Configuration"][0]["SSID"], "GZ_NODE_TWO")

        # B) Dual sim_be15000 HTTP save + readback
        self.http_req(
            "/mesh-node/be15_one/sim_be15000/api/sim-state",
            method="POST",
            body={"ssid": "BE15_ONE_SSID", "lan_ip": "192.168.31.100"},
            headers={"X-KTV-Session-ID": ktv},
        )
        self.http_req(
            "/mesh-node/be15_two/sim_be15000/api/sim-state",
            method="POST",
            body={"ssid": "BE15_TWO_SSID", "lan_ip": "192.168.32.100"},
            headers={"X-KTV-Session-ID": ktv},
        )
        _, _, _, b15_1 = self.http_req(
            "/mesh-node/be15_one/sim_be15000/api/sim-state", headers={"X-KTV-Session-ID": ktv}
        )
        _, _, _, b15_2 = self.http_req(
            "/mesh-node/be15_two/sim_be15000/api/sim-state", headers={"X-KTV-Session-ID": ktv}
        )
        self.assertEqual(json.loads(b15_1)["ap_synced_ssid"], "BE15_ONE_SSID")
        self.assertEqual(json.loads(b15_2)["ap_synced_ssid"], "BE15_TWO_SSID")

        # C) Dual sim_vigor2927 CGI POST + GET readback
        self.http_req(
            "/mesh-node/vig_1/sim_vigor2927/cgi-bin/dualwl.cgi",
            method="POST",
            body=b"fid=0&enWlan=1&enSsid1=1&ssid1=VIGOR_DUP_1&channel=36",
            headers={"X-KTV-Session-ID": ktv, "Content-Type": "application/x-www-form-urlencoded"},
        )
        self.http_req(
            "/mesh-node/vig_2/sim_vigor2927/cgi-bin/dualwl.cgi",
            method="POST",
            body=b"fid=0&enWlan=1&enSsid1=1&ssid1=VIGOR_DUP_2&channel=149",
            headers={"X-KTV-Session-ID": ktv, "Content-Type": "application/x-www-form-urlencoded"},
        )
        _, _, _, v1_html = self.http_req(
            "/mesh-node/vig_1/sim_vigor2927/cgi-bin/dualwl.cgi?fid=0", headers={"X-KTV-Session-ID": ktv}
        )
        _, _, _, v2_html = self.http_req(
            "/mesh-node/vig_2/sim_vigor2927/cgi-bin/dualwl.cgi?fid=0", headers={"X-KTV-Session-ID": ktv}
        )
        self.assertIn("VIGOR_DUP_1", v1_html.decode("utf-8", errors="ignore"))
        self.assertNotIn("VIGOR_DUP_2", v1_html.decode("utf-8", errors="ignore"))
        self.assertIn("VIGOR_DUP_2", v2_html.decode("utf-8", errors="ignore"))
        self.assertNotIn("VIGOR_DUP_1", v2_html.decode("utf-8", errors="ignore"))

        # D) Dual nodes across remaining simulator types via sync-topology + node-config API
        dup_pairs = [
            ("sim_be12000", "gateway"),
            ("sim_ax3000c", "ap"),
            ("sim_be6500c", "ap"),
            ("sim_mikrotik_hexs", "ap"),
            ("sim_ac1000cv2", "ap"),
        ]
        for sim_id, cat in dup_pairs:
            nodes = [
                {
                    "id": f"d1_{sim_id}",
                    "simId": sim_id,
                    "category": cat,
                    "opMode": "ap" if cat == "ap" else "gateway",
                    "name": f"Dev1_{sim_id}",
                    "ip": "192.168.55.1",
                    "firmwareConfig": {
                        "ssid": f"ISO_1_{sim_id}",
                        "wpaKey": "Alpha1111",
                        "lanIp": "192.168.55.1",
                        "dhcpStart": "192.168.55.20",
                        "dhcpEnd": "192.168.55.120",
                    },
                },
                {
                    "id": f"d2_{sim_id}",
                    "simId": sim_id,
                    "category": cat,
                    "opMode": "ap" if cat == "ap" else "gateway",
                    "name": f"Dev2_{sim_id}",
                    "ip": "192.168.66.1",
                    "firmwareConfig": {
                        "ssid": f"ISO_2_{sim_id}",
                        "wpaKey": "Beta2222",
                        "lanIp": "192.168.66.1",
                        "dhcpStart": "192.168.66.30",
                        "dhcpEnd": "192.168.66.130",
                    },
                },
            ]
            st_sync, _, _, _ = self.json_req(
                "/api/mesh-lab/sync-topology",
                method="POST",
                body={"nodes": nodes, "links": []},
                ktv_id=ktv,
                role="DEV",
            )
            self.assertEqual(st_sync, 200)
            st_a, _, _, resp_a = self.json_req(
                f"/api/mesh-lab/node-config?node_id=d1_{sim_id}&sim_id={sim_id}", ktv_id=ktv, role="DEV"
            )
            st_b, _, _, resp_b = self.json_req(
                f"/api/mesh-lab/node-config?node_id=d2_{sim_id}&sim_id={sim_id}", ktv_id=ktv, role="DEV"
            )
            self.assertEqual(st_a, 200)
            self.assertEqual(st_b, 200)
            self.assertEqual(resp_a["config"]["ssid"], f"ISO_1_{sim_id}")
            self.assertEqual(resp_b["config"]["ssid"], f"ISO_2_{sim_id}")
            self.assertEqual(resp_a["config"]["lanIp"], "192.168.55.1")
            self.assertEqual(resp_b["config"]["lanIp"], "192.168.66.1")

        # Cleanup created node sessions
        self.json_req("/api/mesh-lab/reset", method="POST", body={"nodes": [
            {"id": "gz_one", "simId": "sim_ax3000gz"},
            {"id": "gz_two", "simId": "sim_ax3000gz"},
            {"id": "be15_one", "simId": "sim_be15000"},
            {"id": "be15_two", "simId": "sim_be15000"},
            {"id": "vig_1", "simId": "sim_vigor2927"},
            {"id": "vig_2", "simId": "sim_vigor2927"},
        ]}, ktv_id=ktv, role="DEV")

    # ------------------------------------------------------------------
    # 4. Full A -> B Propagation Across ALL 16/16 Simulators + Direct HTTP Readback
    # ------------------------------------------------------------------

    def test_04_real_a_to_b_propagation_all_16_simulators_and_backend_source(self):
        ktv = self.register_ktv("ktv_all16_sync_04")

        # Part A: Pair Gateway A (sim_be12000) with EVERY ONE of the 16 simulators as downstream AP/Mesh Agent B
        master_cfg = {
            "ssid": "FPT_MESH_16_PRO",
            "wpaKey": "Mesh@2026Pro",
            "password": "Mesh@2026Pro",
            "securityMode": "WPA3-SAE",
            "channel": "149",
            "bandwidth": "160MHz",
            "lanIp": "10.60.70.1",
            "subnetMask": "255.255.255.0",
            "dhcpStart": "10.60.70.40",
            "dhcpStartIp": "10.60.70.40",
            "dhcpEnd": "10.60.70.190",
            "dhcpEndIp": "10.60.70.190",
            "primaryDns": "1.1.1.1",
            "secondaryDns": "8.8.4.4",
            "leaseTime": "43200",
            "dhcpEnable": True,
        }

        all_targets = list(mesh_sync_adapter.ALL_SIM_IDS)
        self.assertEqual(len(all_targets), 16)

        nodes = [
            {
                "id": "master_gw",
                "simId": "sim_be12000",
                "category": "gateway",
                "opMode": "gateway",
                "name": "Master_BE12000Z",
                "ip": "10.60.70.1",
                "mac": "94:87:E0:00:00:01",
                "power": True,
                "hasInternet": True,
                "firmwareConfig": master_cfg,
            }
        ]
        links = []
        for idx, sim_id in enumerate(all_targets, start=1):
            nid = f"b_{sim_id}"
            nodes.append(
                {
                    "id": nid,
                    "simId": sim_id,
                    "category": "ap",
                    "opMode": "ap",
                    "meshRole": "Agent",
                    "name": f"Node_{sim_id}",
                    "ip": f"192.168.1.{100 + idx}",
                    "mac": f"94:87:E0:11:{idx:02X}:AA",
                    "power": True,
                    "firmwareConfig": {"opMode": "ap", "meshRole": "Agent"},
                }
            )
            links.append(
                {
                    "id": f"lnk_{idx}",
                    "srcId": "master_gw",
                    "srcPort": f"LAN{idx}",
                    "tgtId": nid,
                    "tgtPort": "WAN",
                    "cableType": "ETH_CAT6A",
                    "speed": 2500,
                }
            )
        # Add connected LAN/Wi-Fi client to test ARP/DHCP/Topology client table sync
        nodes.append(
            {
                "id": "client_pc1",
                "category": "client",
                "name": "Laptop_KTV_Pro",
                "mac": "D8:43:AE:99:88:77",
                "ip": "192.168.1.50",
                "power": True,
            }
        )
        links.append(
            {
                "id": "lnk_client",
                "srcId": "master_gw",
                "srcPort": "LAN_C1",
                "tgtId": "client_pc1",
                "tgtPort": "ETH0",
                "cableType": "ETH_CAT6A",
                "speed": 1000,
            }
        )

        st_sync, _, _, sync_resp = self.json_req(
            "/api/mesh-lab/sync-topology",
            method="POST",
            body={
                "nodes": nodes,
                "links": links,
                "source_node_id": "master_gw",
                "prefer_backend_source": False,
            },
            ktv_id=ktv,
            role="DEV",
        )
        self.assertEqual(st_sync, 200)
        adapter_sync = sync_resp["adapter_sync"]
        self.assertEqual(adapter_sync["sync_modes"]["master_gw"], "source")

        # Verify ALL 16/16 backend stores persisted A's configuration via GET /api/mesh-lab/node-config
        for sim_id in all_targets:
            nid = f"b_{sim_id}"
            self.assertEqual(adapter_sync["sync_modes"][nid], "ap_mesh", f"Unexpected mode for {sim_id}")
            st_nc, _, _, nc_resp = self.json_req(
                f"/api/mesh-lab/node-config?node_id={nid}&sim_id={sim_id}", ktv_id=ktv, role="DEV"
            )
            self.assertEqual(st_nc, 200, f"node-config failed for {sim_id}")
            cfg = nc_resp["config"]
            self.assertEqual(cfg["ssid"], "FPT_MESH_16_PRO", f"SSID mismatch on {sim_id}")
            self.assertEqual(cfg["wpaKey"], "Mesh@2026Pro", f"WPA Key mismatch on {sim_id}")
            self.assertEqual(cfg["netmask"], "255.255.255.0", f"Netmask mismatch on {sim_id}")
            self.assertTrue(cfg["lanIp"].startswith("10.60.70."), f"Subnet mismatch on {sim_id}: {cfg['lanIp']}")
            self.assertNotEqual(cfg["lanIp"], "10.60.70.1", f"IP collision with gateway on {sim_id}")
            self.assertEqual(cfg["dhcpStart"], "10.60.70.40", f"DHCP start mismatch on {sim_id}")
            self.assertEqual(cfg["dhcpEnd"], "10.60.70.190", f"DHCP end mismatch on {sim_id}")
            self.assertEqual(cfg["dhcpLease"], "43200", f"DHCP lease mismatch on {sim_id}")
            self.assertEqual(cfg["dns1"], "1.1.1.1", f"DNS1 mismatch on {sim_id}")
            self.assertEqual(cfg["dns2"], "8.8.4.4", f"DNS2 mismatch on {sim_id}")
            self.assertEqual(cfg["bandwidth"], "160MHz", f"BW mismatch on {sim_id}")
            self.assertEqual(cfg["channel"], "149", f"Channel mismatch on {sim_id}")
            self.assertIn("WPA3", cfg["security"], f"Security mismatch on {sim_id}: {cfg['security']}")

        # Verify actual simulator HTTP endpoints reflect synced config over /mesh-node/<nid>/<sim_id>/...
        # 1) sim_be15000 HTTP JSON
        _, _, _, b15_raw = self.http_req(
            "/mesh-node/b_sim_be15000/sim_be15000/api/sim-state", headers={"X-KTV-Session-ID": ktv}
        )
        b15 = json.loads(b15_raw)
        self.assertEqual(b15["ap_synced_ssid"], "FPT_MESH_16_PRO")
        self.assertEqual(b15["ont_dhcp_start"], "10.60.70.40")
        self.assertEqual(b15["ont_dhcp_end"], "10.60.70.190")

        # 2) sim_ax3000s HTTP JSON
        _, _, _, axs_raw = self.http_req(
            "/mesh-node/b_sim_ax3000s/sim_ax3000s/api/sim-state", headers={"X-KTV-Session-ID": ktv}
        )
        axs = json.loads(axs_raw)
        self.assertEqual(axs["radios"][0]["ssid"], "FPT_MESH_16_PRO")
        self.assertEqual(axs["lan"]["dhcp_start"], "10.60.70.40")
        self.assertGreaterEqual(len(axs.get("clients", [])), 1)

        # 3) sim_ax3000gz HTTP JSON
        _, _, _, gz_raw = self.http_req(
            "/mesh-node/b_sim_ax3000gz/sim_ax3000gz/gia-tri-that.json", headers={"X-KTV-Session-ID": ktv}
        )
        gz = json.loads(gz_raw)
        self.assertEqual(gz["admin__localnetwork__WLAN__WLANbasic"]["WLAN SSID Configuration"][0]["SSID"], "FPT_MESH_16_PRO")
        _, _, _, gz_st_raw = self.http_req(
            "/mesh-node/b_sim_ax3000gz/sim_ax3000gz/api/sim-state", headers={"X-KTV-Session-ID": ktv}
        )
        gz_st = json.loads(gz_st_raw)
        self.assertEqual(gz_st["lan"]["Primary_DNS"], "1.1.1.1")

        # 4) sim_vigor2927 HTTP CGI HTML
        _, _, _, vig_wl = self.http_req(
            "/mesh-node/b_sim_vigor2927/sim_vigor2927/cgi-bin/dualwl.cgi?fid=0", headers={"X-KTV-Session-ID": ktv}
        )
        self.assertIn("FPT_MESH_16_PRO", vig_wl.decode("utf-8", errors="ignore"))
        st_vl, hdr_vl, _, _ = self.http_req(
            "/mesh-node/b_sim_vigor2927/sim_vigor2927/cgi-bin/v2x00.cgi?fid=2001", headers={"X-KTV-Session-ID": ktv}
        )
        loc_vl = hdr_vl.get("Location") or hdr_vl.get("location") or ""
        self.assertEqual(st_vl, 302)
        self.assertTrue(loc_vl.startswith("/mesh-node/b_sim_vigor2927/sim_vigor2927/"), f"Redirect lost node prefix: {loc_vl}")
        _, _, _, vig_enet1 = self.http_req(loc_vl, headers={"X-KTV-Session-ID": ktv})
        self.assertIn("10.60.70.", vig_enet1.decode("utf-8", errors="ignore"))
        _, _, _, vig_lan = self.http_req(
            "/mesh-node/b_sim_vigor2927/sim_vigor2927/doc/ENET.SHT", headers={"X-KTV-Session-ID": ktv}
        )
        vig_lan_txt = vig_lan.decode("utf-8", errors="ignore")
        self.assertIn("10.60.70.", vig_lan_txt)

        # 5) sim_ac1000cv2 HTTP HTML
        _, _, _, cv2_wf = self.http_req(
            "/mesh-node/b_sim_ac1000cv2/sim_ac1000cv2/wifissid.html?autologin=1", headers={"X-KTV-Session-ID": ktv}
        )
        self.assertIn("FPT_MESH_16_PRO", cv2_wf.decode("utf-8", errors="ignore"))

        # 6) sim_ac1000HI / sim_ac1000f / sim_ax3000hv2 HTTP ASP
        for boa_sim in ("sim_ac1000HI", "sim_ac1000f", "sim_ax3000hv2"):
            hdr_boa = {"X-KTV-Session-ID": ktv}
            if boa_sim == "sim_ac1000HI":
                st_idx, _, ck_idx, _ = self.http_req(
                    f"/mesh-node/b_{boa_sim}/{boa_sim}/cgi-bin/index.asp?autologin=1",
                    headers={"X-KTV-Session-ID": ktv},
                )
                self.assertEqual(st_idx, 200)
                cookie_pairs = [c.split(";", 1)[0] for c in ck_idx if "=" in c]
                if cookie_pairs:
                    hdr_boa["Cookie"] = "; ".join(cookie_pairs)
            _, _, _, boa_wf = self.http_req(
                f"/mesh-node/b_{boa_sim}/{boa_sim}/cgi-bin/home_wireless.asp?autologin=1",
                headers=hdr_boa,
            )
            self.assertIn("FPT_MESH_16_PRO", boa_wf.decode("utf-8", errors="ignore"), f"Boa ASP missing synced SSID on {boa_sim}")

        # 7) Every single one of the 16 simulator UI entry URLs responds HTTP 200 under /mesh-node/
        entry_urls = {
            "sim_be12000": "/?autologin=1&view=wlanBasic",
            "sim_be15000": "/pages/localNetStatus.html",
            "sim_ax3000s": "/app.html?view=devinfo",
            "sim_ax3000gz": "/cgi-bin/luci/admin/home",
            "sim_ax3000gz_v2": "/?autologin=1",
            "sim_ax3000hv2": "/cgi-bin/index.asp",
            "sim_ax1800gz": "/?autologin=1",
            "sim_ax3000c": "/?autologin=1",
            "sim_ONT_be6500c": "/home__overview.html",
            "sim_be6500c": "/home__overview.html",
            "sim_ac1000f": "/cgi-bin/index.asp",
            "sim_ac1000HI": "/cgi-bin/index.asp?autologin=1",
            "sim_ac1000z": "/?autologin=1",
            "sim_ac1000cv2": "/index.html?autologin=1",
            "sim_mikrotik_hexs": "/webfig/?autologin=1",
            "sim_vigor2927": "/index.htm",
        }
        for sim_id, suffix in entry_urls.items():
            st_u, _, _, _ = self.http_req(
                f"/mesh-node/b_{sim_id}/{sim_id}{suffix}", headers={"X-KTV-Session-ID": ktv}
            )
            self.assertEqual(st_u, 200, f"HTTP 200 failed for {sim_id} at {suffix}")

        # Part B: Reverse check - save directly inside non-BE12000 controller (AX3000S) via simulator API
        # and sync with prefer_backend_source=True -> downstream AX3000GZ / AC1000CV2 updates automatically!
        self.http_req(
            "/mesh-node/ctrl_s/sim_ax3000s/api/sim-state",
            method="POST",
            body={
                "radios": [
                    {"band": "2.4G", "ssid": "AX3000S_BOSS", "password": "BossKey99"},
                    {"band": "5G", "ssid": "AX3000S_BOSS", "password": "BossKey99", "channel": 100, "bandwidth": "80MHz"},
                ],
                "lan": {"ipaddr": "172.30.40.1", "netmask": "255.255.255.0", "dhcp_start": "172.30.40.10", "dhcp_end": "172.30.40.99", "dns1": "9.9.9.9"},
            },
            headers={"X-KTV-Session-ID": ktv},
        )
        st_rev, _, _, _ = self.json_req(
            "/api/mesh-lab/sync-topology",
            method="POST",
            body={
                "nodes": [
                    {"id": "ctrl_s", "simId": "sim_ax3000s", "category": "gateway", "opMode": "gateway", "name": "Src_AX3000S", "power": True},
                    {"id": "agent_gz", "simId": "sim_ax3000gz", "category": "ap", "opMode": "ap", "name": "Agent_AX3000GZ", "power": True},
                ],
                "links": [{"id": "lr1", "srcId": "ctrl_s", "srcPort": "LAN1", "tgtId": "agent_gz", "tgtPort": "WAN", "cableType": "ETH_CAT6A", "speed": 1000}],
                "source_node_id": "ctrl_s",
                "prefer_backend_source": True,
            },
            ktv_id=ktv,
            role="DEV",
        )
        self.assertEqual(st_rev, 200)
        _, _, _, gz_rev_raw = self.http_req(
            "/mesh-node/agent_gz/sim_ax3000gz/gia-tri-that.json", headers={"X-KTV-Session-ID": ktv}
        )
        gz_rev = json.loads(gz_rev_raw)
        self.assertEqual(gz_rev["admin__localnetwork__WLAN__WLANbasic"]["WLAN SSID Configuration"][0]["SSID"], "AX3000S_BOSS")
        _, _, _, gz_st_rev = self.http_req(
            "/mesh-node/agent_gz/sim_ax3000gz/api/sim-state", headers={"X-KTV-Session-ID": ktv}
        )
        self.assertEqual(json.loads(gz_st_rev)["lan"]["Primary_DNS"], "9.9.9.9")

    # ------------------------------------------------------------------
    # 5. Router A -> Router B (Router Mode WAN-only vs AP/Bridge Full Sync)
    # ------------------------------------------------------------------

    def test_05_router_to_router_wan_only_vs_ap_bridge_full_inheritance(self):
        ktv = self.register_ktv("ktv_router_wan_05")

        nodes = [
            {
                "id": "gw_a",
                "simId": "sim_be12000",
                "category": "gateway",
                "opMode": "gateway",
                "name": "GW_A",
                "ip": "10.20.30.1",
                "power": True,
                "hasInternet": True,
                "firmwareConfig": {
                    "ssid": "CORP_UPLINK",
                    "wpaKey": "CorpPass123",
                    "securityMode": "WPA3-SAE",
                    "lanIp": "10.20.30.1",
                    "subnetMask": "255.255.255.0",
                    "dhcpStart": "10.20.30.50",
                    "dhcpEnd": "10.20.30.150",
                    "primaryDns": "1.1.1.1",
                    "secondaryDns": "8.8.8.8",
                },
            },
            {
                "id": "rtr_vigor",
                "simId": "sim_vigor2927",
                "category": "router",
                "name": "Vigor_RouterB",
                "ip": "172.16.50.1",
                "power": True,
                "firmwareConfig": {
                    "opMode": "router",
                    "ssid": "VIGOR_PRIVATE_LAN",
                    "wpaKey": "VigorOwn999",
                    "lanIp": "172.16.50.1",
                    "subnetMask": "255.255.255.0",
                    "dhcpStart": "172.16.50.10",
                    "dhcpEnd": "172.16.50.90",
                    "primaryDns": "172.16.50.1",
                },
            },
            {
                "id": "rtr_mk",
                "simId": "sim_mikrotik_hexs",
                "category": "router",
                "name": "MikroTik_RouterB",
                "ip": "192.168.88.1",
                "power": True,
                "firmwareConfig": {
                    "opMode": "router",
                    "ssid": "MK_PRIVATE",
                    "lanIp": "192.168.88.1",
                    "subnetMask": "255.255.255.0",
                    "dhcpStart": "192.168.88.20",
                    "dhcpEnd": "192.168.88.200",
                    "primaryDns": "192.168.88.1",
                },
            },
        ]
        links = [
            {"id": "l1", "srcId": "gw_a", "srcPort": "LAN1", "tgtId": "rtr_vigor", "tgtPort": "WAN1", "cableType": "ETH_CAT6A", "speed": 1000},
            {"id": "l2", "srcId": "gw_a", "srcPort": "LAN2", "tgtId": "rtr_mk", "tgtPort": "ether1", "cableType": "ETH_CAT6A", "speed": 1000},
        ]

        st, _, _, resp = self.json_req(
            "/api/mesh-lab/sync-topology",
            method="POST",
            body={"nodes": nodes, "links": links, "source_node_id": "gw_a"},
            ktv_id=ktv,
            role="DEV",
        )
        self.assertEqual(st, 200)
        modes = resp["adapter_sync"]["sync_modes"]
        self.assertEqual(modes["rtr_vigor"], "router_wan")
        self.assertEqual(modes["rtr_mk"], "router_wan")

        # Verify Vigor kept private LAN & SSID and received A's WAN
        _, _, _, v_nc = self.json_req(
            "/api/mesh-lab/node-config?node_id=rtr_vigor&sim_id=sim_vigor2927", ktv_id=ktv, role="DEV"
        )
        vcfg = v_nc["config"]
        self.assertEqual(vcfg["lanIp"], "172.16.50.1")
        self.assertEqual(vcfg["dhcpStart"], "172.16.50.10")
        self.assertEqual(vcfg["ssid"], "VIGOR_PRIVATE_LAN")
        self.assertTrue(vcfg["wanIp"].startswith("10.20.30.") and vcfg["wanIp"] != "10.20.30.1")
        self.assertEqual(vcfg["wanGateway"], "10.20.30.1")
        self.assertEqual(vcfg["wanDns1"], "1.1.1.1")

        # Verify HTTP readbacks on Vigor confirm private LAN + SSID and WAN gateway
        _, _, _, vig_wan_html = self.http_req(
            "/mesh-node/rtr_vigor/sim_vigor2927/cgi-bin/v2x00.cgi?fid=2031", headers={"X-KTV-Session-ID": ktv}
        )
        self.assertIn("10.20.30.1", vig_wan_html.decode("utf-8", errors="ignore"))
        _, _, _, vig_wl_html = self.http_req(
            "/mesh-node/rtr_vigor/sim_vigor2927/cgi-bin/dualwl.cgi?fid=0", headers={"X-KTV-Session-ID": ktv}
        )
        self.assertIn("VIGOR_PRIVATE_LAN", vig_wl_html.decode("utf-8", errors="ignore"))
        self.assertNotIn("CORP_UPLINK", vig_wl_html.decode("utf-8", errors="ignore"))

        # Verify MikroTik kept 192.168.88.1 LAN & received WAN in 10.20.30.0/24
        _, _, _, mk_nc = self.json_req(
            "/api/mesh-lab/node-config?node_id=rtr_mk&sim_id=sim_mikrotik_hexs", ktv_id=ktv, role="DEV"
        )
        mkcfg = mk_nc["config"]
        self.assertEqual(mkcfg["lanIp"], "192.168.88.1")
        self.assertTrue(mkcfg["wanIp"].startswith("10.20.30.") and mkcfg["wanIp"] != "10.20.30.1")
        self.assertEqual(mkcfg["wanGateway"], "10.20.30.1")

        # Now switch Vigor to AP/Bridge mode -> full inheritance!
        nodes[1]["opMode"] = "ap"
        nodes[1]["firmwareConfig"]["opMode"] = "ap"
        st2, _, _, resp2 = self.json_req(
            "/api/mesh-lab/sync-topology",
            method="POST",
            body={"nodes": nodes, "links": links, "source_node_id": "gw_a"},
            ktv_id=ktv,
            role="DEV",
        )
        self.assertEqual(st2, 200)
        self.assertEqual(resp2["adapter_sync"]["sync_modes"]["rtr_vigor"], "ap_mesh")
        _, _, _, v_ap_nc = self.json_req(
            "/api/mesh-lab/node-config?node_id=rtr_vigor&sim_id=sim_vigor2927", ktv_id=ktv, role="DEV"
        )
        vapcfg = v_ap_nc["config"]
        self.assertEqual(vapcfg["ssid"], "CORP_UPLINK")
        self.assertTrue(vapcfg["lanIp"].startswith("10.20.30."))
        self.assertEqual(vapcfg["dhcpStart"], "10.20.30.50")

    # ------------------------------------------------------------------
    # 6. F5 Workspace Persistence & Full Reset
    # ------------------------------------------------------------------

    def test_06_workspace_f5_persistence_and_reset_cleanup(self):
        ktv_a = self.register_ktv("ktv_ws_user_a")
        ktv_b = self.register_ktv("ktv_ws_user_b")

        ws_payload = {
            "nodes": [
                {
                    "id": "node-1",
                    "catalogKey": "be12000",
                    "simId": "sim_be12000",
                    "name": "GW_F5",
                    "ip": "192.168.77.1",
                    "category": "gateway",
                    "x": 200,
                    "y": 175,
                    "power": True,
                    "firmwareConfig": {
                        "ssid": "F5_PERSIST_SSID",
                        "wpaKey": "F5Key1234",
                        "lanIp": "192.168.77.1",
                        "dhcpStart": "192.168.77.50",
                        "dhcpStartIp": "192.168.77.50",
                        "dhcpEnd": "192.168.77.180",
                        "dhcpEndIp": "192.168.77.180",
                    },
                },
                {
                    "id": "node-2",
                    "catalogKey": "ax3000s",
                    "simId": "sim_ax3000s",
                    "name": "AP_F5",
                    "ip": "192.168.77.100",
                    "category": "ap",
                    "opMode": "ap",
                    "x": 540,
                    "y": 175,
                    "power": True,
                    "firmwareConfig": {"opMode": "ap"},
                },
            ],
            "links": [
                {"id": "link-1", "srcId": "node-1", "srcPort": "LAN1_10GE", "tgtId": "node-2", "tgtPort": "WAN", "cableType": "ETH_CAT6A", "speed": 2500}
            ],
        }

        # Sync + Save workspace for ktv_a
        self.json_req(
            "/api/mesh-lab/sync-topology",
            method="POST",
            body={"nodes": ws_payload["nodes"], "links": ws_payload["links"], "source_node_id": "node-1"},
            ktv_id=ktv_a,
            role="DEV",
        )
        st_save, _, _, _ = self.json_req(
            "/api/mesh-lab/workspace", method="POST", body=ws_payload, ktv_id=ktv_a, role="DEV"
        )
        self.assertEqual(st_save, 200)

        # Simulate F5 reload for ktv_a
        st_get, _, _, ws_resp = self.json_req("/api/mesh-lab/workspace", "GET", ktv_id=ktv_a, role="DEV")
        self.assertEqual(st_get, 200)
        ws = ws_resp["workspace"]
        self.assertIsNotNone(ws)
        self.assertEqual(len(ws["nodes"]), 2)
        self.assertEqual(ws["nodes"][0]["firmwareConfig"]["ssid"], "F5_PERSIST_SSID")
        self.assertEqual(ws["nodes"][0]["firmwareConfig"]["dhcpStartIp"], "192.168.77.50")

        # ktv_b must NOT see ktv_a's workspace
        st_other, _, _, ws_other = self.json_req("/api/mesh-lab/workspace", "GET", ktv_id=ktv_b, role="DEV")
        self.assertEqual(st_other, 200)
        self.assertIsNone(ws_other["workspace"])

        # Explicit Reset clears ktv_a workspace & node backends
        st_rst, _, _, _ = self.json_req(
            "/api/mesh-lab/reset", method="POST", body={"nodes": ws_payload["nodes"]}, ktv_id=ktv_a, role="DEV"
        )
        self.assertEqual(st_rst, 200)
        _, _, _, ws_after = self.json_req("/api/mesh-lab/workspace", "GET", ktv_id=ktv_a, role="DEV")
        self.assertIsNone(ws_after["workspace"])

        _, _, _, ax_after = self.json_req(
            "/api/mesh-lab/node-config?node_id=node-2&sim_id=sim_ax3000s", ktv_id=ktv_a, role="DEV"
        )
        self.assertNotEqual(ax_after["config"]["ssid"], "F5_PERSIST_SSID")

    # ------------------------------------------------------------------
    # 7. Frontend Contract Checks
    # ------------------------------------------------------------------

    def test_07_frontend_contracts_synced_and_cookie_safe(self):
        chassis = (REPO_ROOT / "js" / "mesh-lab" / "chassis-view.js").read_text(encoding="utf-8")
        fw_sync = (REPO_ROOT / "js" / "mesh-lab" / "firmware-sync.js").read_text(encoding="utf-8")
        main_js = (REPO_ROOT / "js" / "mesh-lab" / "main.js").read_text(encoding="utf-8")

        self.assertIn("buildMeshNodeUrl", chassis)
        self.assertNotIn("document.cookie = 'current_sim=", chassis)
        self.assertNotIn("document.cookie = 'current_sim=", fw_sync)
        self.assertNotIn("localStorage.setItem('fpt_mesh_live_lan_dhcp'", fw_sync)

        self.assertIn("isRouterModeNode", fw_sync)
        self.assertIn("dhcpStartIp", fw_sync)
        self.assertIn("fpt_mesh_fw_saved", fw_sync)

        self.assertIn("/api/mesh-lab/workspace", main_js)
        self.assertIn("/api/mesh-lab/reset", main_js)
        self.assertIn("restoreWorkspaceFromBackend", main_js)


if __name__ == "__main__":
    unittest.main()
