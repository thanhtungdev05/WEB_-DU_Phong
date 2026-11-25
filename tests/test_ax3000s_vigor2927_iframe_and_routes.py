#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""Regression suite for AX3000S, Vigor 2927, dispatcher anti-collision routing, and shared frameset safety."""

import http.client
import json
import os
import re
import sys
import threading
import unittest
from http.server import ThreadingHTTPServer
from pathlib import Path
from urllib.parse import quote

REPO_ROOT = Path(__file__).resolve().parent.parent

_orig_argv = sys.argv
try:
    sys.argv = [sys.argv[0]]
    if str(REPO_ROOT) not in sys.path:
        sys.path.insert(0, str(REPO_ROOT))
    import run_all
finally:
    sys.argv = _orig_argv


class FirmwareIframeAndRoutesTests(unittest.TestCase):
    @classmethod
    def setUpClass(cls):
        cls.server = ThreadingHTTPServer(("127.0.0.1", 0), run_all.MasterDispatcher)
        cls.thread = threading.Thread(target=cls.server.serve_forever, daemon=True)
        cls.thread.start()
        cls.port = cls.server.server_address[1]

    @classmethod
    def tearDownClass(cls):
        cls.server.shutdown()
        cls.server.server_close()
        cls.thread.join(timeout=5)

    def request(self, path, method="GET", body=None, headers=None, follow_redirects=False):
        cur_path = path
        req_headers = dict(headers or {})
        set_cookies = []
        for _ in range(5):
            conn = http.client.HTTPConnection("127.0.0.1", self.port, timeout=10)
            try:
                conn.request(method, cur_path, body=body, headers=req_headers)
                resp = conn.getresponse()
                raw = resp.read()
                sc_list = resp.msg.get_all("Set-Cookie") or []
                set_cookies.extend(sc_list)
                hdrs = {k.lower(): v for k, v in resp.getheaders()}
                hdrs["set-cookies"] = set_cookies
                if follow_redirects and resp.status in (301, 302, 303, 307, 308) and hdrs.get("location"):
                    cur_path = hdrs["location"]
                    method = "GET"
                    body = None
                    continue
                return resp.status, hdrs, raw
            finally:
                conn.close()
        return resp.status, hdrs, raw

    def test_ax3000s_iframe_navigation_assets_and_autologin(self):
        ax_www = REPO_ROOT / "simulators" / "sim_ax3000s" / "www"
        login_html = (ax_www / "login.html").read_text(encoding="utf-8", errors="replace")
        self.assertIn("autologin", login_html)
        self.assertNotIn('"app.html" + window.location.search + "&v="', login_html)

        st, _, raw_app = self.request("/sim_ax3000s/app.html")
        self.assertEqual(st, 200)
        app_html = raw_app.decode("utf-8", errors="replace")
        self.assertNotIn("sim/tracker.js", app_html)
        self.assertIn("window.navTo", app_html)
        self.assertIn("loadView('quickset')", app_html)
        self.assertIn("1220px", app_html)
        self.assertIn("Sky_", app_html)
        self.assertIn("layer2-leaf-", app_html)

        _, _, raw_qs = self.request("/sim_ax3000s/luci-static/skgwfpt/sk_quickset.js")
        qs_js = raw_qs.decode("utf-8", errors="replace")
        self.assertNotIn("top.location.href", qs_js)

        _, _, raw_gw = self.request("/sim_ax3000s/luci-static/resources/sk_gateway.js")
        gw_js = raw_gw.decode("utf-8", errors="replace")
        self.assertIn("window.navTo", gw_js)

        _, _, raw_ext = self.request("/sim_ax3000s/sim/backend-ext.js")
        ext_js = raw_ext.decode("utf-8", errors="replace")
        self.assertIn("rtweb.session.login", ext_js)
        self.assertIn("rtweb.system.diagnostic", ext_js)

        _, _, raw_net = self.request("/sim_ax3000s/sim/net-mock.js")
        net_js = raw_net.decode("utf-8", errors="replace")
        self.assertIn("/cgi-bin/cgi-exec", net_js)
        self.assertIn("/cgi-bin/cgi-download", net_js)

    def test_vigor2927_all_85_menu_routes_and_critical_subpages_succeed(self):
        menu_path = REPO_ROOT / "simulators" / "sim_vigor2927" / "src" / "www" / "menu.htm"
        menu_txt = menu_path.read_text(encoding="utf-8", errors="replace")
        raw_urls = re.findall(r"MainFunction\(\s*['\"]([^'\"]+)['\"]", menu_txt)
        urls = list(dict.fromkeys(raw_urls))
        self.assertGreaterEqual(len(urls), 200, "Expected >= 200 menu items in menu.htm")

        bad_tokens = (b"Authorization Required", b"404 - Not Found", b"Authorization Error")
        unrewritten_top = (
            b"top.act_sta",
            b"top.authStr",
            b"top.printLogo",
            b"top.notSupportWAN",
            b"top.menu",
            b"var bg=top",
            b"var bg = top",
        )

        failures = []
        headers = {"Cookie": "ktv_client_id=vigor_menu_check"}
        for u in urls:
            p = u if u.startswith("/") else "/" + u
            st, _, body = self.request("/sim_vigor2927" + p, headers=headers, follow_redirects=True)
            if st != 200 or any(tok in body for tok in bad_tokens) or any(tok in body for tok in unrewritten_top):
                failures.append((u, st))
        self.assertEqual(failures, [], f"Vigor menu routes failed: {failures}")

        extra_critical = [
            *(f"/cgi-bin/dualwl.cgi?fid={fid}" for fid in (0, 2, 4, 6, 7, 10, 12, 13, 14, 16)),
            "/cgi-bin/v2x00.cgi?fid=2047",
            "/cgi-bin/v2x00.cgi?fid=2049",
            "/cgi-bin/v2x00.cgi?fid=2101",
            "/cgi-bin/v2x00.cgi?fid=2102",
            "/cgi-bin/v2x00.cgi?fid=2312",
            "/cgi-bin/v2x00.cgi",
            "/cgi-bin/cgilte.cgi?fid=0",
            "/cgi-bin/cgiapm.cgi?fid=4&sAct=view",
            "/cgi-bin/cgidashboard.cgi?fid=1",
            "/cgi-bin/func.cgi?fid=11",
            "/cgi-bin/ospf.cgi",
            "/cgi-bin/wizanti.cgi?fid=0",
            "/doc/constructerr.htm",
        ]
        for sub in extra_critical:
            st, _, body = self.request("/sim_vigor2927" + sub, headers=headers, follow_redirects=True)
            self.assertEqual(st, 200, sub)
            for tok in bad_tokens + unrewritten_top:
                self.assertNotIn(tok, body, f"{tok!r} leaked in {sub}")
            self.assertIn(b"__vgRoot", body, f"Missing __vgRoot iframe shim in {sub}")

    def test_vigor2927_dualwl_persistence_isolation_autologin_and_grading_contracts(self):
        hdr_a = {"Cookie": "ktv_client_id=ktv_vig_A", "Content-Type": "application/x-www-form-urlencoded"}
        hdr_b = {"Cookie": "ktv_client_id=ktv_vig_B"}

        payload = "fid=0&webchange=1&ssid1=FPT_5G_KTV_A&channel=149&mode=11ax_ac_n_a"
        st_post, hdrs_post, _ = self.request(
            "/sim_vigor2927/cgi-bin/dualwl.cgi",
            method="POST",
            body=payload.encode("utf-8"),
            headers=hdr_a,
        )
        self.assertIn(st_post, (200, 302))
        if st_post == 302:
            self.assertIn("dualwl.cgi", hdrs_post.get("location", ""))

        st_a, _, body_a = self.request("/sim_vigor2927/cgi-bin/dualwl.cgi?fid=0&save_success=1", headers={"Cookie": "ktv_client_id=ktv_vig_A"})
        st_b, _, body_b = self.request("/sim_vigor2927/cgi-bin/dualwl.cgi?fid=0", headers=hdr_b)
        self.assertEqual(st_a, 200)
        self.assertEqual(st_b, 200)
        self.assertIn(b"FPT_5G_KTV_A", body_a)
        self.assertIn(b'<option value="149" selected>', body_a)
        self.assertNotIn(b"FPT_5G_KTV_A", body_b)
        self.assertIn(b"DrayTek-5G", body_b)

        # Autologin behavior vs normal login page
        st_auto, hdrs_auto, _ = self.request("/sim_vigor2927/weblogin.htm?autologin=1")
        self.assertEqual(st_auto, 302)
        self.assertEqual(hdrs_auto.get("location"), "/sim_vigor2927/index.htm")

        st_login, _, body_login = self.request("/sim_vigor2927/weblogin.htm")
        self.assertEqual(st_login, 200)
        self.assertIn(b"wlogin", body_login)

        # Tree icons must exist and be valid GIF
        for gif in ("/sim_vigor2927/images/nfolder.gif", "/sim_vigor2927/images/nunknown.gif"):
            st_g, _, body_g = self.request(gif)
            self.assertEqual(st_g, 200, gif)
            self.assertTrue(body_g.startswith(b"GIF"), gif)

        # Preserve _ftcIsSaved and _hasClickedSaveInGuide grading hooks on Vigor pages
        st_enet, _, body_enet = self.request("/sim_vigor2927/doc/ENET.SHT", headers={"Cookie": "ktv_client_id=ktv_vig_A"})
        self.assertEqual(st_enet, 200)
        self.assertIn(b"_ftcIsSaved", body_enet)

    def test_multi_device_dispatcher_path_fallback_prevents_cookie_hijacking(self):
        # Even if browser holds current_sim=sim_ax3000s, Vigor unique paths resolve to sim_vigor2927
        st_v, _, body_v = self.request(
            "/cgi-bin/dualwl.cgi?fid=0",
            headers={"Cookie": "ktv_client_id=multi_dev_1; current_sim=sim_ax3000s"},
        )
        self.assertEqual(st_v, 200)
        self.assertIn(b"DrayTek-5G", body_v)

        st_d, _, body_d = self.request(
            "/cgi-bin/cgidashboard.cgi?fid=1",
            headers={"Cookie": "ktv_client_id=multi_dev_1; current_sim=sim_ax3000s"},
            follow_redirects=True,
        )
        self.assertEqual(st_d, 200)
        self.assertIn(b"__vgRoot", body_d)

        # Even if browser holds current_sim=sim_vigor2927, AX3000S unique assets resolve to sim_ax3000s
        st_ax1, _, body_ax1 = self.request(
            "/luci-static/resources/sk_gateway.js",
            headers={"Cookie": "ktv_client_id=multi_dev_1; current_sim=sim_vigor2927"},
        )
        self.assertEqual(st_ax1, 200)
        self.assertIn(b"navTo", body_ax1)

        st_ax2, _, body_ax2 = self.request(
            "/sim/backend-ext.js",
            headers={"Cookie": "ktv_client_id=multi_dev_1; current_sim=sim_vigor2927"},
        )
        self.assertEqual(st_ax2, 200)
        self.assertIn(b"rtweb.session.login", body_ax2)

    def test_phase3_shared_frameset_iframe_safety_and_auth_preserved(self):
        # 1. sim_ac1000HI: unauthenticated stays 401; authenticated status.asp fixes top.test
        st_hi_unauth, _, _ = self.request("/sim_ac1000HI/cgi-bin/index.asp")
        self.assertEqual(st_hi_unauth, 401)
        st_hi_idx, hdr_hi, body_hi = self.request(
            "/sim_ac1000HI/cgi-bin/index.asp?autologin=1",
            headers={"Cookie": "ktv_client_id=hi_test"},
        )
        self.assertEqual(st_hi_idx, 200)
        self.assertIn(b'src="/cgi-bin/navigation-status.asp"', body_hi)
        hi_cookies = "; ".join(c.split(";", 1)[0] for c in hdr_hi.get("set-cookies", []))
        st_hi_stat, _, body_hi_stat = self.request(
            "/sim_ac1000HI/cgi-bin/status.asp",
            headers={"Cookie": f"ktv_client_id=hi_test; {hi_cookies}"},
        )
        self.assertEqual(st_hi_stat, 200)
        self.assertNotIn(b"top.test.nav", body_hi_stat)

        # 2. sim_ax3000hv2: autologin + __hv2Root iframe confinement
        st_hv2_auto, hdr_hv2_auto, _ = self.request("/sim_ax3000hv2/cgi-bin/login.asp?autologin=1")
        self.assertEqual(st_hv2_auto, 302)
        self.assertEqual(hdr_hv2_auto.get("location"), "/sim_ax3000hv2/cgi-bin/index.asp")

        for sub in (
            "/sim_ax3000hv2/cgi-bin/status.asp",
            "/sim_ax3000hv2/cgi-bin/tools_admin.asp",
            "/sim_ax3000hv2/cgi-bin/mesh_topo.asp",
            "/sim_ax3000hv2/cgi-bin/wifi_multi_ap_status.asp",
            "/sim_ax3000hv2/menu_e8c.js",
            "/sim_ax3000hv2/util_e8c.js",
        ):
            st_sub, _, body_sub = self.request(sub, headers={"Cookie": "ktv_client_id=hv2_test"})
            self.assertEqual(st_sub, 200, sub)
            self.assertNotIn(b"top.window.location", body_sub, sub)
            self.assertNotIn(b"top.Content_", body_sub, sub)
            self.assertNotIn(b"top.json_string", body_sub, sub)
            self.assertNotIn(b"top.g_url", body_sub, sub)
            self.assertIn(b"__hv2Root", body_sub, sub)

        # 3. sim_ac1000cv2: unauthenticated stays 401; autologin + __ac2Root preserves grading hooks
        st_ac2_401, _, _ = self.request("/sim_ac1000cv2/index.html")
        self.assertEqual(st_ac2_401, 401)
        st_ac2_alg, _, body_ac2_alg = self.request(
            "/sim_ac1000cv2/alg.html?autologin=1",
            headers={"Cookie": "ktv_client_id=ac2_test"},
        )
        self.assertEqual(st_ac2_alg, 200)
        self.assertIn(b"__ac2Root", body_ac2_alg)
        self.assertNotIn(b"top.XWebTimeout", body_ac2_alg)
        self.assertNotIn(b"top.window.location", body_ac2_alg)

        st_ac2_js, _, body_ac2_js = self.request("/sim_ac1000cv2/script/common.js")
        self.assertEqual(st_ac2_js, 200)
        self.assertIn(b"window.top._hasClickedSaveInGuide = true", body_ac2_js)
        self.assertIn(b"__ac2Root", body_ac2_js)

        # 4. sim_ax3000gz: autologin vs login redirect + prefix/responsive shim
        st_gz_login, hdr_gz_login, _ = self.request("/sim_ax3000gz/")
        self.assertEqual(st_gz_login, 302)
        self.assertEqual(hdr_gz_login.get("location"), "/sim_ax3000gz/cgi-bin/luci/login")

        st_gz_auto, hdr_gz_auto, _ = self.request("/sim_ax3000gz/?autologin=1")
        self.assertEqual(st_gz_auto, 302)
        self.assertEqual(hdr_gz_auto.get("location"), "/sim_ax3000gz/cgi-bin/luci/admin/home")

        st_gz_home, _, body_gz_home = self.request("/sim_ax3000gz/cgi-bin/luci/admin/home")
        self.assertEqual(st_gz_home, 200)
        self.assertIn(b"__gzShim", body_gz_home)

    def _vigor_session_headers(self, ktv_id):
        st, hdrs, _ = self.request(
            "/sim_vigor2927/?autologin=1",
            headers={"Cookie": f"ktv_client_id={ktv_id}"},
            follow_redirects=True,
        )
        self.assertEqual(st, 200, f"Vigor autologin failed for {ktv_id}")
        cookies = {"ktv_client_id": ktv_id}
        for raw_sc in hdrs.get("set-cookies", []):
            pair = raw_sc.split(";", 1)[0].strip()
            if "=" in pair:
                k, v = pair.split("=", 1)
                cookies[k.strip()] = v.strip()
        return {"Cookie": "; ".join(f"{k}={v}" for k, v in cookies.items())}

    def test_vigor2927_full_firmware_routes_assets_titles_and_isolation(self):
        from urllib.parse import urlencode

        menu_path = REPO_ROOT / "simulators" / "sim_vigor2927" / "src" / "www" / "menu.htm"
        menu_txt = menu_path.read_text(encoding="utf-8", errors="replace")

        required_selectors = [
            "menu-wan",
            "sub-wan",
            "menu-wan-general",
            "menu-wan-internet",
            "menu-lan",
            "sub-lan",
            "menu-lan-general",
            "menu-lan-ipbmac",
            "menu-bandwidth",
            "sub-bandwidth",
            "menu-bandwidth-limit",
            "menu-routing",
            "sub-routing",
            "menu-routing-policy",
            "menu-nat",
            "sub-nat",
            "menu-nat-port-redirection",
        ]
        for dom_id in required_selectors:
            self.assertIn(f'id="{dom_id}"', menu_txt, f"Missing required menu selector #{dom_id}")

        raw_urls = re.findall(r"MainFunction\(\s*['\"]([^'\"]+)['\"]", menu_txt)
        urls = list(dict.fromkeys(raw_urls))
        self.assertGreaterEqual(len(urls), 200, f"Expected >= 200 menu items, got {len(urls)}")

        hdrs_a = self._vigor_session_headers("vigor_full_ktv_a")
        hdrs_b = self._vigor_session_headers("vigor_full_ktv_b")

        forbidden_phrases = (
            "Get Control Name Error",
            "Construct informations fail",
            "Authorization Required",
            "404 - Not Found",
        )
        top_leak_re = re.compile(r"(?<![.\w-])top\.(?!_)[A-Za-z$]")

        for rel_url in urls:
            full_path = rel_url if rel_url.startswith("/sim_vigor2927") else f"/sim_vigor2927/{rel_url.lstrip('/')}"
            st, _, raw = self.request(full_path, headers=hdrs_a, follow_redirects=True)
            self.assertEqual(st, 200, f"Menu route failed ({st}): {full_path}")
            self.assertGreater(len(raw), 100, f"Menu route returned unexpectedly small body: {full_path}")
            text = raw.decode("utf-8", errors="replace")
            for bad in forbidden_phrases:
                self.assertNotIn(bad, text, f"{full_path} contained error text {bad!r}")
            self.assertIsNone(
                top_leak_re.search(text),
                f"{full_path} contained unrewritten top.* JS reference: {top_leak_re.search(text).group(0) if top_leak_re.search(text) else ''}",
            )

        # Frameset children, REL:, and case-insensitive .sht lookup
        frameset_and_ci_routes = [
            "/sim_vigor2927/cgi-bin/openvpn.htm",
            "/sim_vigor2927/cgi-bin/XgCert.HTM",
            "/sim_vigor2927/cgi-bin/frmupMain.htm",
            "/sim_vigor2927/cgi-bin/cfgMain.htm",
            "/sim_vigor2927/cgi-bin/REL:XSelfG.HTM",
            "/sim_vigor2927/doc/enet.sht",
        ]
        for path in frameset_and_ci_routes:
            st, _, raw = self.request(path, headers=hdrs_a, follow_redirects=True)
            self.assertEqual(st, 200, f"Frameset/CI route failed ({st}): {path}")
            self.assertGreater(len(raw), 100, f"Frameset/CI route empty: {path}")

        # Restored reference static assets & CGI/JS data endpoints
        ref_endpoints = [
            ("/sim_vigor2927/js/QoS.JS", 100),
            ("/sim_vigor2927/images/02.png", 100),
            ("/sim_vigor2927/cgi-bin/webvpngraph.js", 50),
            ("/sim_vigor2927/dashbctl.cgi", 1),
            ("/sim_vigor2927/check_swm_enable.cgi", 1),
            ("/sim_vigor2927/cgi-bin/certificatedata.cgi", 1),
            ("/sim_vigor2927/cgi-bin/websyslog.cgi", 1),
            ("/sim_vigor2927/cgi-bin/usbweb.cgi", 1),
            ("/sim_vigor2927/cgi-bin/arp.cgi?fid=1", 1),
            ("/sim_vigor2927/dashbclose.cgi", 1),
        ]
        for path, min_len in ref_endpoints:
            st, _, raw = self.request(path, headers=hdrs_a)
            self.assertEqual(st, 200, f"Reference asset/data endpoint failed ({st}): {path}")
            self.assertGreaterEqual(len(raw), min_len, f"Reference asset/data too short: {path}")

        # .cgi& query separator normalization
        st_amp, _, raw_amp = self.request("/sim_vigor2927/cgi-bin/v2x00.cgi&fid=2016", headers=hdrs_a, follow_redirects=True)
        self.assertEqual(st_amp, 200)
        self.assertGreater(len(raw_amp), 100)
        amp_txt = raw_amp.decode("utf-8", errors="replace")
        for bad in forbidden_phrases:
            self.assertNotIn(bad, amp_txt, f".cgi& normalized page contained {bad!r}")

        # dualwl.cgi fid title alignment
        dualwl_titles = {
            12: "AP Discovery",
            13: "Station List",
            14: "Station Control",
            16: "Bandwidth Management",
        }
        for fid, expected_title in dualwl_titles.items():
            st, _, raw = self.request(f"/sim_vigor2927/cgi-bin/dualwl.cgi?fid={fid}", headers=hdrs_a)
            self.assertEqual(st, 200, f"dualwl fid={fid} failed")
            txt = raw.decode("utf-8", errors="replace")
            self.assertIn(expected_title, txt, f"dualwl fid={fid} missing expected title {expected_title!r}")

        # POST /cgi-bin/ipfeds.cgi without save params still navigates to doc/ipfedr filter page
        post_hdrs_a = {**hdrs_a, "Content-Type": "application/x-www-form-urlencoded"}
        st_ipf, _, raw_ipf = self.request(
            "/sim_vigor2927/cgi-bin/ipfeds.cgi",
            method="POST",
            body=urlencode({"sGroupIdx": "1"}),
            headers=post_hdrs_a,
            follow_redirects=True,
        )
        self.assertEqual(st_ipf, 200)
        self.assertIn("Filter", raw_ipf.decode("utf-8", errors="replace"))

        # POST persistence + per-KTV isolation across new endpoints
        iso_cases = [
            (
                "/sim_vigor2927/cgi-bin/cntrobj.cgi?sCnObjAct=showitem",
                "/sim_vigor2927/cgi-bin/cntrobj.cgi?sCnObjAct=showitem",
                {"fid": "0", "sCnObjAct": "showitem", "webchange": "1", "name": "IsoCountryA", "country": "VN (Viet Nam)"},
                "IsoCountryA",
            ),
            (
                "/sim_vigor2927/cgi-bin/csmim.cgi",
                "/sim_vigor2927/cgi-bin/csmim.cgi?sProfileAct=showpage",
                {"fid": "0", "sProfileAct": "showpage", "webchange": "1", "profName": "IsoIMPolicyA", "chk1": "1"},
                "IsoIMPolicyA",
            ),
            (
                "/sim_vigor2927/cgi-bin/ospf.cgi",
                "/sim_vigor2927/cgi-bin/ospf.cgi",
                {"fid": "0", "webchange": "1", "enOspf": "1", "routerId": "10.99.88.77", "areaId": "0.0.0.1"},
                "10.99.88.77",
            ),
            (
                "/sim_vigor2927/cgi-bin/fwuser.cgi?fid=9",
                "/sim_vigor2927/cgi-bin/fwuser.cgi?fid=9",
                {"fid": "9", "iAct": "0", "webchange": "1", "en": "1", "svcName": "IsoFwHostA", "acName": "AC-Test"},
                "IsoFwHostA",
            ),
        ]
        for post_url, get_url, payload, sentinel in iso_cases:
            st_p, hdr_p, _ = self.request(
                post_url,
                method="POST",
                body=urlencode(payload),
                headers=post_hdrs_a,
                follow_redirects=False,
            )
            self.assertIn(st_p, (200, 302), f"POST failed ({st_p}) on {post_url}")
            if "cntrobj.cgi" in post_url and st_p == 302:
                self.assertIn("sCnObjAct=showitem", hdr_p.get("location", ""))

            st_ga, _, raw_ga = self.request(get_url, headers=hdrs_a)
            self.assertEqual(st_ga, 200, f"GET after POST failed for KTV A on {get_url}")
            self.assertIn(sentinel, raw_ga.decode("utf-8", errors="replace"), f"Saved {sentinel} missing for KTV A on {get_url}")

            st_gb, _, raw_gb = self.request(get_url, headers=hdrs_b)
            self.assertEqual(st_gb, 200, f"GET isolation check failed for KTV B on {get_url}")
            self.assertNotIn(sentinel, raw_gb.decode("utf-8", errors="replace"), f"Cross-KTV leak of {sentinel} into KTV B on {get_url}")

        # wlogout.cgi?sAct=1 auto-logout timeout dropdown MUST NOT wipe KTV A session
        # and should redirect safely within /sim_vigor2927/
        st_wl, hdr_wl, _ = self.request(
            "/sim_vigor2927/cgi-bin/wlogout.cgi?sAct=1&sTimeout=300",
            headers=hdrs_a,
            follow_redirects=False,
        )
        self.assertEqual(st_wl, 302)
        self.assertEqual(hdr_wl.get("location"), "/sim_vigor2927/l_m.htm")
        st_lm, _, raw_lm = self.request(hdr_wl["location"], headers=hdrs_a)
        self.assertEqual(st_lm, 200)
        self.assertGreater(len(raw_lm), 100)
        st_after, _, raw_after = self.request("/sim_vigor2927/cgi-bin/ospf.cgi", headers=hdrs_a)
        self.assertEqual(st_after, 200)
        self.assertIn("10.99.88.77", raw_after.decode("utf-8", errors="replace"))

        # HTML menu pages vs AJAX data endpoints for arp.cgi & striobj.cgi, plus Angular {{...}}
        st_arp_html, _, raw_arp_html = self.request("/sim_vigor2927/cgi-bin/arp.cgi", headers=hdrs_a, follow_redirects=True)
        self.assertEqual(st_arp_html, 200)
        self.assertIn("ARP Cache Table", raw_arp_html.decode("utf-8", errors="replace"))

        st_str_html, _, raw_str_html = self.request("/sim_vigor2927/cgi-bin/striobj.cgi?sAct=0&iPage=1", headers=hdrs_a, follow_redirects=True)
        self.assertEqual(st_str_html, 200)
        self.assertIn("String Object", raw_str_html.decode("utf-8", errors="replace"))

        st_str_api, _, raw_str_api = self.request("/sim_vigor2927/cgi-bin/striobj.cgi?sString=TestStr", headers=hdrs_a)
        self.assertEqual(st_str_api, 200)
        self.assertEqual(raw_str_api.strip(), b"[1]")

        st_ng, _, raw_ng = self.request("/sim_vigor2927/cgi-bin/wan.cgi?fid=100", headers=hdrs_a, follow_redirects=True)
        self.assertEqual(st_ng, 200)
        ng_txt = raw_ng.decode("utf-8", errors="replace")
        self.assertIn("ng-app", ng_txt)
        self.assertIn("{{", ng_txt)


if __name__ == "__main__":
    unittest.main()
