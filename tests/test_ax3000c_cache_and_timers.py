#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
tests/test_ax3000c_cache_and_timers.py
================================================================================
Chong trang man / giat do CACHE CU va do VONG LAP DOM tren ONT AX3000CV2 (fw 0.5.3).

Su co 2026-11-12: index.html van tro app.js?v=v21_clean_input trong khi tep JS tra
"immutable" 1 nam -> may da mo truoc ban va 10/11 tiep tuc chay app.js cu.
================================================================================
"""
import hashlib
import io
import os
import re
import shutil
import subprocess
import sys
import tempfile
import unittest

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
sys.path.insert(0, ROOT)
import simulators.sim_ax3000c.server_fw053 as ax3000c  # noqa: E402

APP_JS = "/js/app.9b4ab5b7.1726822665278.js"
VENDORS_JS = "/sim_ax3000c/js/chunk-vendors.9b4ab5b7.1726822665278.js"
FTC_JS_PATH = os.path.join(ROOT, "simulators", "sim_ax3000c", "ftc", "ftc-ax3000c.js")


class _MockSocket:
    def __init__(self, data=b""):
        self._rfile = io.BytesIO(data)
        self._wfile = io.BytesIO()

    def makefile(self, mode, *args, **kwargs):
        if "b" in mode:
            return self._rfile if "r" in mode else self._wfile
        return None

    def sendall(self, data):
        self._wfile.write(data)

    def close(self):
        pass


def _get(path, extra=""):
    raw = (
        f"GET {path} HTTP/1.1\r\nHost: localhost\r\n"
        "Cookie: PHPSESSID=ktv_cache_test\r\nX-KTV-Session-ID: ktv_cache_test\r\n"
        f"{extra}\r\n"
    ).encode()
    sock = _MockSocket(raw)
    ax3000c.Handler(sock, ("127.0.0.1", 12345), None)
    out = sock._wfile.getvalue()
    end = out.find(b"\r\n\r\n")
    head = out[:end].decode("utf-8", "replace")
    headers = {}
    for line in head.split("\r\n")[1:]:
        if ":" in line:
            k, v = line.split(":", 1)
            headers[k.strip().lower()] = v.strip()
    return head.split("\r\n")[0], headers, out[end + 4:]


class TestAX3000CCacheBusting(unittest.TestCase):
    def test_version_tokens_are_16_hex(self):
        self.assertRegex(ax3000c.ASSET_V, r"^[0-9a-f]{16}$")
        self.assertRegex(ax3000c.FTC_JS_V, r"^[0-9a-f]{16}$")

    def test_index_versions_every_bundle_and_drops_stale_token(self):
        status, headers, body = _get("/")
        self.assertIn("200", status)
        self.assertIn("no-cache", headers.get("cache-control", ""))
        self.assertNotIn(b"v21_clean_input", body)
        self.assertNotIn(b"v21_fw053_stable", body)
        refs = re.findall(rb"(?:href|src)=(/sim_ax3000c/(?:js|css)/[^\s>]+)", body)
        self.assertGreaterEqual(len(refs), 6, refs)
        for ref in refs:
            self.assertTrue(
                ref.endswith(b"?v=" + ax3000c.ASSET_V.encode()),
                f"Bundle chua gan phien ban hien tai: {ref!r}",
            )
        self.assertIn(b"/sim_ax3000c/ftc-ax3000c.js?v=" + ax3000c.FTC_JS_V.encode(), body)

    def test_chunk_loader_versions_every_lazy_chunk(self):
        _, _, body = _get(APP_JS + "?v=" + ax3000c.ASSET_V)
        self.assertNotIn(b"__FTC_ASSET_V__", body)
        self.assertIn(
            b'function s(e){return c.p+"js/"+({}[e]||e)+".9b4ab5b7.1726822665278.js?v='
            + ax3000c.ASSET_V.encode() + b'"}',
            body,
        )

    def test_only_current_version_url_is_immutable(self):
        _, headers, body = _get(VENDORS_JS + "?v=" + ax3000c.ASSET_V)
        self.assertTrue(body)
        self.assertEqual(headers.get("cache-control"), "public, max-age=31536000, immutable")
        self.assertTrue(headers.get("etag"))

        for stale in (VENDORS_JS, VENDORS_JS + "?v=v21_clean_input", APP_JS + "?v=v21_fw053_stable"):
            _, headers, _ = _get(stale)
            cc = headers.get("cache-control", "")
            self.assertNotIn("immutable", cc, stale)
            self.assertIn("must-revalidate", cc, stale)
            # run_all.py bo moi Cache-Control co no-cache/no-store voi tep tinh -> khong duoc dung
            self.assertNotIn("no-cache", cc, stale)
            self.assertNotIn("no-store", cc, stale)
            self.assertTrue(headers.get("etag"), stale)

    def test_stale_url_revalidates_with_304(self):
        _, headers, _ = _get(VENDORS_JS)
        status, _, body = _get(VENDORS_JS, f"If-None-Match: {headers['etag']}\r\n")
        self.assertIn("304", status)
        self.assertEqual(body, b"")

    def test_ftc_script_cache_follows_its_content_hash(self):
        with open(FTC_JS_PATH, "rb") as f:
            expected = hashlib.sha256(f.read().replace(b"\r\n", b"\n")).hexdigest()[:16]
        self.assertEqual(ax3000c.FTC_JS_V, expected)
        _, headers, _ = _get("/sim_ax3000c/ftc-ax3000c.js?v=" + ax3000c.FTC_JS_V)
        self.assertIn("immutable", headers.get("cache-control", ""))
        _, headers, _ = _get("/sim_ax3000c/ftc-ax3000c.js?v=v21_fw053_stable")
        self.assertNotIn("immutable", headers.get("cache-control", ""))

    def test_asset_version_changes_when_patch_table_changes(self):
        before = ax3000c._tinh_phien_ban_tai_nguyen()
        key = "js__chunk-2d0c8817.9b4ab5b7.1726822665278.js"
        ax3000c.THAY_JS[key].append((b"__probe_old__", b"__probe_new__"))
        try:
            self.assertNotEqual(before, ax3000c._tinh_phien_ban_tai_nguyen())
        finally:
            ax3000c.THAY_JS[key].pop()
        self.assertEqual(before, ax3000c._tinh_phien_ban_tai_nguyen())

    def test_unpatched_media_is_cached_but_not_forever(self):
        _, headers, body = _get("/img/Up-side.55586474.png")
        self.assertTrue(body)
        self.assertEqual(headers.get("cache-control"), "public, max-age=604800")

    def test_every_patched_js_bundle_has_valid_js_syntax(self):
        node = shutil.which("node")
        if not node:
            self.skipTest("node not installed")
        all_js = sorted(
            f for f in os.listdir(ax3000c._goc.GOC_WWW)
            if f.startswith("js__") and f.endswith(".js")
        )
        self.assertGreaterEqual(len(all_js), 85)
        with tempfile.TemporaryDirectory() as tmp:
            for key in all_js:
                # Validate EVERY bundle served by the simulator (all 85 fw_053 JS files)
                body = ax3000c._doc_va_va_tep(key)
                self.assertIsNotNone(body, key)
                self.assertNotIn(b'"/icons/', body, f"Unprefixed double-quoted /icons/ in {key}")
                self.assertNotIn(b"'/icons/", body, f"Unprefixed single-quoted /icons/ in {key}")
                out_path = os.path.join(tmp, key)
                with open(out_path, "wb") as f:
                    f.write(body)
                res = subprocess.run([node, "--check", out_path], capture_output=True, text=True, encoding="utf-8", errors="replace")
                self.assertEqual(
                    res.returncode,
                    0,
                    f"JS SyntaxError in {key}: {res.stderr}",
                )
            for key in sorted(ax3000c.THAY_JS.keys()):
                # Also verify HTTP serving for every entry explicitly configured in THAY_JS
                url_path = "/" + key.replace("__", "/", 1) + "?v=" + ax3000c.ASSET_V
                status, _, body = _get(url_path)
                self.assertIn("200", status, url_path)
                self.assertGreater(len(body), 0, url_path)

    def test_font_uses_swap_and_no_unexpected_reloads_or_3s_retry(self):
        _, _, css = _get("/css/app.06c49f94.css?v=" + ax3000c.ASSET_V)
        self.assertIn(b"font-display:swap;", css)
        for chunk in (
            "/js/chunk-2d0b6e5b.9b4ab5b7.1726822665278.js",
            "/js/chunk-7266f7c8.9b4ab5b7.1726822665278.js",
            "/js/chunk-16271a96.9b4ab5b7.1726822665278.js",
        ):
            _, _, js = _get(chunk + "?v=" + ax3000c.ASSET_V)
            self.assertNotIn(b"checkNetworkStatus(3e3)", js, chunk)
            self.assertNotIn(b"checkNetworkStatus(2e4)", js, chunk)
        for chunk in (
            "/js/chunk-3404a532.9b4ab5b7.1726822665278.js",
            "/js/chunk-13cd769e.9b4ab5b7.1726822665278.js",
            "/js/chunk-2d20fee3.9b4ab5b7.1726822665278.js",
            "/js/chunk-58926e63.9b4ab5b7.1726822665278.js",
            "/js/chunk-82690506.9b4ab5b7.1726822665278.js",
        ):
            _, _, js = _get(chunk + "?v=" + ax3000c.ASSET_V)
            self.assertNotIn(b"location.reload()", js, chunk)

    def test_instant_boot_shell_mobile_css_and_namespaced_icons(self):
        _, _, index_body = _get("/")
        self.assertIn(b'id=ftc-ax3000c-boot', index_body)
        self.assertIn(b'<link rel=icon href="data:,">', index_body)
        status_ico, _, ico_body = _get("/sim_ax3000c/logo-fpt.ico")
        self.assertIn("200", status_ico)
        self.assertTrue(ico_body)

        _, _, css = _get("/css/app.06c49f94.css?v=" + ax3000c.ASSET_V)
        self.assertIn(b"-apple-system", css)
        self.assertIn(b"@media(max-width:960px)", css)
        self.assertIn(b"url(/sim_ax3000c/icons/log-out.svg)", css)
        self.assertNotIn(b"url(/icons/", css)

        for chunk in (
            APP_JS,
            "/js/chunk-44bc1f1e.9b4ab5b7.1726822665278.js",
            "/js/chunk-47368b9a.9b4ab5b7.1726822665278.js",
            "/js/chunk-b90fa57a.9b4ab5b7.1726822665278.js",
            "/js/chunk-26c4d9fc.9b4ab5b7.1726822665278.js",
            "/js/chunk-6b9124a9.9b4ab5b7.1726822665278.js",
        ):
            _, _, body = _get(chunk + "?v=" + ax3000c.ASSET_V)
            self.assertNotIn(b'"/icons/', body, chunk)
            self.assertIn(b'"/sim_ax3000c/icons/', body, chunk)

    def test_head_and_options_cors_and_prewarm_cache(self):
        sock_head = _MockSocket(b"HEAD /sim_ax3000c/ftc-ax3000c.js HTTP/1.1\r\nHost: localhost\r\n\r\n")
        ax3000c.Handler(sock_head, ("127.0.0.1", 12345), None)
        head_resp = sock_head._wfile.getvalue().decode("utf-8", "replace")
        self.assertIn("200", head_resp.splitlines()[0])

        sock_opt = _MockSocket(b"OPTIONS /sim_ax3000c/ubus HTTP/1.1\r\nHost: localhost\r\n\r\n")
        ax3000c.Handler(sock_opt, ("127.0.0.1", 12345), None)
        opt_resp = sock_opt._wfile.getvalue().decode("utf-8", "replace")
        self.assertIn("200", opt_resp.splitlines()[0])
        self.assertIn("Access-Control-Allow-Origin: *", opt_resp)

        ax3000c._prewarm_tai_nguyen()
        self.assertIn("index_html", ax3000c._PREPATCHED_CACHE)
        self.assertIn("ftc_js", ax3000c._PREPATCHED_CACHE)
        self.assertIn("asset:js__chunk-vendors.9b4ab5b7.1726822665278.js", ax3000c._PREPATCHED_CACHE)


class TestAX3000CDomScheduler(unittest.TestCase):
    @classmethod
    def setUpClass(cls):
        with open(FTC_JS_PATH, encoding="utf-8") as f:
            cls.js = f.read()

    def test_single_fallback_interval_paused_when_hidden(self):
        self.assertEqual(len(re.findall(r"setInterval\(", self.js)), 1)
        self.assertIn("setInterval(function () { if (!document.hidden) quetNgay(); }, QUET_DU_PHONG_MS);", self.js)
        self.assertIn("var QUET_DU_PHONG_MS = 1500;", self.js)
        for removed in ("setInterval(ganNhan", "setInterval(doRoute", "setInterval(trietTieuLoadingTre"):
            self.assertNotIn(removed, self.js)

    def test_mutation_observer_does_not_watch_attributes(self):
        # datNhan() ghi thuoc tinh data-ftc-*; neu theo doi attributes se tu kich hoat vo han.
        m = re.search(r"new MutationObserver\(lichQuet\)\.observe\(document\.documentElement, \{(.*?)\}\)", self.js, re.S)
        self.assertIsNotNone(m)
        self.assertNotIn("attributes", m.group(1))
        self.assertIn("childList: true", m.group(1))

    def test_route_changes_detected_via_history_hooks(self):
        self.assertIn("['pushState', 'replaceState'].forEach", self.js)
        self.assertIn("window.addEventListener('hashchange', doRoute);", self.js)

    def test_recovery_really_reloads_with_bounded_retries(self):
        self.assertIn("var SO_LAN_CUU_TOI_DA = 3;", self.js)
        self.assertIn("location.reload();", self.js)
        code_only = re.sub(r"//.*", "", re.sub(r"/\*.*?\*/", "", self.js, flags=re.S))
        self.assertNotIn("location.replace(", code_only)
        self.assertIn("appEl.__vue__", self.js)

    def test_global_create_element_hook_removed(self):
        self.assertNotIn("document.createElement = function", self.js)

    def test_new_launch_clears_stale_save_state_and_postmessage_fallback(self):
        self.assertIn("ftc_ax3000c_tab_t", self.js)
        self.assertIn("ks.indexOf('ftc_luu:') === 0", self.js)
        self.assertIn("FTC_SAVE_SUCCESS", self.js)
        ftc_chung_path = os.path.join(ROOT, "devices", "ax3000c", "ftc_chung.js")
        with open(ftc_chung_path, encoding="utf-8") as f:
            ftc_chung = f.read()
        self.assertIn("sessionStorage.getItem('sid')", ftc_chung)
        node = shutil.which("node")
        if node:
            for p in (FTC_JS_PATH, ftc_chung_path):
                res = subprocess.run([node, "--check", p], capture_output=True, text=True)
                self.assertEqual(res.returncode, 0, f"SyntaxError in {p}: {res.stderr}")


if __name__ == "__main__":
    unittest.main(verbosity=2)
