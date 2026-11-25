#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""Comprehensive verification of all 16 Mesh Lab firmware GUIs via MasterDispatcher.

Verifies:
1. All subPages across all 16 simulated devices in js/mesh-lab/catalog.js return HTTP 200.
2. Vigor 2927 /js/*.js assets are not shadowed by Portal (200 OK) and ?main= frameset rewrites cleanly.
3. Unauthenticated portal.html auth/401 contracts remain unchanged when autologin=1 is absent.
4. ?autologin=1 and ?view=/?page= deep-links authenticate only the requester session cleanly.
5. firmware-sync.js & chassis-view.js preserve login pages, handle framesets, and scope ZTE demo banner.
"""
import http.client
import json
import pathlib
import re
import subprocess
import sys
import threading
import unittest
from http.server import ThreadingHTTPServer

ROOT = pathlib.Path(__file__).resolve().parent.parent
if str(ROOT) not in sys.path:
    sys.path.insert(0, str(ROOT))

import run_all


def load_catalog_subpages():
    node_code = (
        "const fs=require('fs'),vm=require('vm');"
        "const src=fs.readFileSync('js/mesh-lab/catalog.js','utf8');"
        "const ctx={};"
        "vm.runInNewContext(src+'\\n;globalThis.__CAT=FPT_CATALOG;',ctx);"
        "const out={};"
        "for(const [k,v] of Object.entries(ctx.__CAT)){if(v.subPages&&v.subPages.length){out[k]={folder:v.folder||('sim_'+k),subPages:v.subPages};}}"
        "process.stdout.write(JSON.stringify(out));"
    )
    res = subprocess.run(["node", "-e", node_code], cwd=ROOT, capture_output=True, text=True, encoding="utf-8", check=True)
    return json.loads(res.stdout)


class MeshAll16FirmwareGuisTest(unittest.TestCase):
    @classmethod
    def setUpClass(cls):
        cls.server = ThreadingHTTPServer(("127.0.0.1", 0), run_all.MasterDispatcher)
        cls.port = cls.server.server_address[1]
        cls.thread = threading.Thread(target=cls.server.serve_forever, daemon=True)
        cls.thread.start()
        cls.catalog = load_catalog_subpages()

    @classmethod
    def tearDownClass(cls):
        cls.server.shutdown()
        cls.server.server_close()

    def request(self, path, headers=None):
        conn = http.client.HTTPConnection("127.0.0.1", self.port, timeout=8)
        conn.request("GET", path, headers=headers or {})
        resp = conn.getresponse()
        body = resp.read()
        hdrs = resp.getheaders()
        conn.close()
        return resp.status, hdrs, body

    def test_all_16_device_subpages_return_200(self):
        self.assertEqual(len(self.catalog), 16, f"Expected 16 simulated devices with subPages, got {list(self.catalog.keys())}")
        for key, info in self.catalog.items():
            folder = info["folder"]
            self.assertGreaterEqual(len(info["subPages"]), 2, f"{key} should have at least Login + Dashboard subPages")
            for idx, sp in enumerate(info["subPages"]):
                raw_url = sp["url"].split("#", 1)[0]
                hdrs = {
                    "Cookie": f"current_sim={folder}; active_sim={folder}",
                    "Referer": f"http://127.0.0.1:{self.port}/{folder}/",
                }
                status, _, body = self.request(raw_url, hdrs)
                self.assertEqual(
                    status,
                    200,
                    f"Device {key} subPage[{idx}] ({sp['label']}) URL {raw_url} returned HTTP {status}",
                )
                self.assertGreater(len(body), 50, f"Empty body for {key} -> {raw_url}")

    def test_vigor2927_js_not_shadowed_and_frameset_main_param(self):
        for js_path in ("/sim_vigor2927/js/gettext.min.js", "/sim_vigor2927/js/tree.min.js"):
            st, _, body = self.request(js_path)
            self.assertEqual(st, 200, f"{js_path} returned {st}")
            self.assertGreater(len(body), 100)

        st_ref, _, body_ref = self.request(
            "/js/gettext.min.js",
            headers={
                "Cookie": "current_sim=sim_vigor2927; active_sim=sim_vigor2927",
                "Referer": f"http://127.0.0.1:{self.port}/sim_vigor2927/menu.htm",
            },
        )
        self.assertEqual(st_ref, 200)
        self.assertGreater(len(body_ref), 100)

        st_main, _, body_main = self.request(
            "/sim_vigor2927/index.htm?main=%2Fcgi-bin%2Fcgimesh.cgi%3Ffid%3D4",
            headers={"Cookie": "current_sim=sim_vigor2927"},
        )
        self.assertEqual(st_main, 200)
        self.assertIn(b'src="/cgi-bin/cgimesh.cgi?fid=4"', body_main)

    def test_portal_auth_contracts_preserved_without_autologin(self):
        # AC1000Hi & AC1000CV2 still return 401 on protected routes when autologin=1 is absent
        for protected_url in (
            "/sim_ac1000HI/cgi-bin/index.asp",
            "/sim_ac1000cv2/index.html",
            "/sim_ac1000cv2/wifibasic.html",
        ):
            st, _, _ = self.request(protected_url, headers={"X-KTV-Session-ID": "ktv_unauth_probe"})
            self.assertEqual(st, 401, f"{protected_url} without autologin must stay 401 for portal.html")

        # ZTE routers without autologin still serve login page on /
        for url, marker in (
            ("/sim_ax3000gz_v2/", b"Frm_Username"),
            ("/sim_ac1000z/", b"Frm_Username"),
            ("/sim_ax1800gz/", b"unauth_root"),  # or Login button / Frm_Username
        ):
            st, _, body = self.request(url, headers={"X-KTV-Session-ID": "ktv_unauth_zte"})
            self.assertEqual(st, 200)
            self.assertTrue(
                b"Frm_Username" in body or b"login" in body.lower(),
                f"{url} without autologin did not serve login shell",
            )

        # AX3000C / without autologin must NOT inject sessionStorage.setItem("sid",...)
        st_ac, _, body_ac = self.request("/sim_ax3000c/")
        self.assertEqual(st_ac, 200)
        self.assertNotIn(b'sessionStorage.setItem("sid"', body_ac)

        # MikroTik WebFig /webfig/ without autologin remains untouched (no admin/admin injection)
        st_mk, _, body_mk = self.request("/sim_mikrotik_hexs/webfig/")
        self.assertEqual(st_mk, 200)
        self.assertNotIn(b'sessionStorage.setItem("name","admin")', body_mk)

    def test_autologin_session_and_deeplink_hooks(self):
        # 1) AX3000C autologin gives unique SID per KTV
        _, _, b1 = self.request("/sim_ax3000c/?autologin=1&_ktv=mesh_ktv_1")
        _, _, b2 = self.request("/sim_ax3000c/?autologin=1&_ktv=mesh_ktv_2")
        m1 = re.search(rb'sessionStorage\.setItem\("sid","([^"]+)"\)', b1)
        m2 = re.search(rb'sessionStorage\.setItem\("sid","([^"]+)"\)', b2)
        self.assertIsNotNone(m1)
        self.assertIsNotNone(m2)
        self.assertNotEqual(m1.group(1), m2.group(1))

        # 2) AC1000Hi autologin sets SESSIONID cookie and rewrites nav/main frames
        st, hdrs, body = self.request(
            "/sim_ac1000HI/cgi-bin/index.asp?autologin=1&page=home_wan.asp",
            headers={"X-KTV-Session-ID": "ktv_hi_demo"},
        )
        self.assertEqual(st, 200)
        self.assertIn(b'src="/cgi-bin/navigation-basic.asp"', body)
        self.assertIn(b'src="/cgi-bin/home_wan.asp"', body)
        cookies = [v for k, v in hdrs if k.lower() == "set-cookie"]
        self.assertTrue(any("SESSIONID=" in c for c in cookies))

        # 3) AC1000CV2 autologin rewrites contentfrm and sets ac1000cv2_auth=1
        st, hdrs, body = self.request(
            "/sim_ac1000cv2/index.html?autologin=1&page=wifibasic.html",
            headers={"X-KTV-Session-ID": "ktv_cv2_demo"},
        )
        self.assertEqual(st, 200)
        self.assertIn(b'src="wifibasic.html"', body)
        cookies = [v for k, v in hdrs if k.lower() == "set-cookie"]
        self.assertTrue(any("ac1000cv2_auth=1" in c for c in cookies))

        # 4) ZTE views (ax3000gz_v2, ax1800gz, ac1000z) inject openLink view hook
        for url in (
            "/sim_ax3000gz_v2/?autologin=1&view=wlanBasic",
            "/sim_ax1800gz/?autologin=1&view=wlanBasic",
            "/sim_ac1000z/?autologin=1&view=wlanBasic",
        ):
            st, _, body = self.request(url, headers={"X-KTV-Session-ID": "ktv_zte_auto"})
            self.assertEqual(st, 200)
            self.assertIn(b'openLink(v+"&Menu3Location=0")', body)
            self.assertIn(b'_sessionTmpToken', body)

        # 5) MikroTik WebFig autologin sets sessionStorage bootstrap
        st, _, body = self.request("/sim_mikrotik_hexs/webfig/?autologin=1")
        self.assertEqual(st, 200)
        self.assertIn(b'sessionStorage.setItem("name","admin")', body)

    def test_frontend_sync_guards_and_banner_scoping(self):
        fw_sync = (ROOT / "js" / "mesh-lab" / "firmware-sync.js").read_text(encoding="utf-8")
        self.assertIn("function isLoginPageDoc(doc)", fw_sync)
        self.assertIn("doc.body.tagName === 'FRAMESET'", fw_sync)
        self.assertIn("const isZteMeshDemo = (node.catalogKey === 'be12000' || node.catalogKey === 'be15000')", fw_sync)
        self.assertNotIn("'input[name*=\"pass\" i]'", fw_sync)
        self.assertNotIn("'input[id*=\"pass\" i]'", fw_sync)

        chassis = (ROOT / "js" / "mesh-lab" / "chassis-view.js").read_text(encoding="utf-8")
        self.assertIn("loadedNodeId", chassis)


if __name__ == "__main__":
    unittest.main()
