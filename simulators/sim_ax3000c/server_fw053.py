#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""Lop noi AX3000CV2 firmware 0.5.3 vao he thong bai hoc FTC.

Ban gia lap firmware moi nam nguyen trong fw_053/ (server that + bang chung).
File nay KHONG sua logic cua no, chi bo sung nhung gi Portal can — giu dung
cac tinh nang ma ban cu (server.py, firmware 0.10.2) da co:
  - Dang nhap admin/admin (anh Huynn chon 2026-09-26; thiet bi that la 6455147589).
  - GET /sim-reset-session: huy moi phien + dua cau hinh ve mac dinh
    (nut Huong dan / Thuc hanh goi truoc khi mo trang login).
  - Trang "/" chen them /ftc-ax3000c.js: dat document._ftcIsSaved cho bo cham
    diem (thay cho sim-pages/state.js cua ban cu).

Chay rieng: python server_fw053.py [cong]   (mac dinh 8090)
"""
import importlib.util
import json
import os
import sys
import time
from http.server import ThreadingHTTPServer

_HERE = os.path.dirname(os.path.abspath(__file__))
_SRC = os.path.join(_HERE, "fw_053", "src")
if _SRC not in sys.path:
    sys.path.insert(0, _SRC)

# Nap server firmware moi theo duong dan tep, dat ten rieng de khong dung
# module 'server' cua thiet bi khac trong run_all.py.
_spec = importlib.util.spec_from_file_location("ax3000c_fw053_server", os.path.join(_SRC, "server.py"))
_goc = importlib.util.module_from_spec(_spec)
sys.modules["ax3000c_fw053_server"] = _goc
_spec.loader.exec_module(_goc)

PORT = int(sys.argv[1]) if len(sys.argv) > 1 else 8090

# Tai khoan hoc vien: admin/admin (Portal cung bat buoc admin/admin o trang login)
_goc.TAI_KHOAN.clear()
_goc.TAI_KHOAN["admin"] = "admin"

# Rut ngan thoi gian cho xuong muc toi thieu (khong do tre, lam nhanh nhat cho hoc vien)
_goc.REBOOT_SAP_S = 0.3
_goc.REBOOT_CHUA_SAN_S = 0.3
_goc.REBOOT_GOC_UPTIME_S = 0.0
#   - Giao dien: thay luc phuc vu tep, KHONG de tre hoac khoa mat na agent mode
THAY_JS = {
    "js__chunk-2d0b6e5b.9b4ab5b7.1726822665278.js": [  # WAN
        (b"checkNetworkStatus(2e4)", b"checkNetworkStatus(100)"),
        (b"checkNetworkStatus(2e3)", b"checkNetworkStatus(100)"),
        (b'loadingText:"WAN settings are unavailable currently in bridge agent mode."', b'loadingText:""'),
    ],
    "js__chunk-7266f7c8.9b4ab5b7.1726822665278.js": [  # LAN
        (b"checkNetworkStatus(2e4)", b"checkNetworkStatus(100)"),
        (b"checkNetworkStatus(2e3)", b"checkNetworkStatus(100)"),
    ],
    "js__chunk-16271a96.9b4ab5b7.1726822665278.js": [  # LAN IPv6
        (b"checkNetworkStatus(2e4)", b"checkNetworkStatus(100)"),
        (b"checkNetworkStatus(2e3)", b"checkNetworkStatus(100)"),
    ],
    "js__chunk-2d237504.9b4ab5b7.1726822665278.js": [  # Wi-Fi
        (b"e.checkWIFiStatus(0)", b"e.loading=!1"),
        (b'attrs:{"element-loading-text":e.loadingText}', b'attrs:{"element-loading-text":""}'),
    ],
    "js__chunk-2d0c8817.9b4ab5b7.1726822665278.js": [  # Wi-Fi Advanced
        (b'attrs:{"element-loading-text":H.$t("Currently in agent mode, can not configure wifi parameters")}', b'attrs:{"element-loading-text":""}'),
    ],
    "js__app.9b4ab5b7.1726822665278.js": [  # Reboot
        (b"window.setTimeout(o,5e3)}", b"window.setTimeout(o,200)}"),
        (b"window.setTimeout(o,2e3)}", b"window.setTimeout(o,200)}"),
        (b'void 0===t&&(t="/"),void 0===n&&(n=160);', b"void 0===t&&(t=location.pathname),void 0===n&&(n=1);"),
    ],
}

TEP_FTC_JS = os.path.join(_HERE, "ftc", "ftc-ax3000c.js")
THE_CHEN = b"<script src=/ftc-ax3000c.js></script>"

# main() cua ban goc khong chay khi nap qua run_all.py -> dong bo khung tu uci mot lan o day
_goc._dong_bo_khung_tu_uci()


def dat_lai_thiet_bi():
    """Huy moi phien + cau hinh ve mac dinh (tuong duong reset_sid + xoa sim_state.json cua ban cu)."""
    _goc._phien.clear()
    _goc._TMP.clear()
    _goc._REBOOT["luc"] = None
    _goc.KHO.dat_lai()
    _goc._dong_bo_khung_tu_uci()


def dat_trang_thai_bai(bai):
    """Trang thai xuat phat rieng cua tung bai Lab (goi tu onSimLoad cua bai hoc, luc dang o trang login).

    Ghi qua dung loi goi *set cua firmware (nhu bam Apply that) de uci va cac khung *_get
    di theo — khong sua thang kho.
      Bai 2 (Wi-Fi): Dam bao MeshRole = Controller de khong bao gio bi khoa.
      Bai 5 (DHCP): IP LAN 192.168.1.1, DHCP start 192.168.1.2 (nhu ban cu) — hoc vien doi
                    sang 192.168.100.1 thi firmware tu nhay dai DHCP (.2 -> .254).
      Bai 7 (Mesh): Enabled bat, MeshRole = Agent (anh Huynn chon) — hoc vien doi sang
                    Controller; giao dien Wi-Fi da duoc mo khoa hoan toan khong con bi treo."""
    if str(bai) not in ("2", "5", "7"):
        return False
    sid = "ftc" + os.urandom(13).hex()
    _goc._phien[sid] = {"user": "admin", "luc": time.time()}

    def goi(doi_tuong, ham, ts):
        return _goc._xu_ly_ubus_day_du({"params": [sid, doi_tuong, ham, ts]}).get("result") or [1]

    try:
        if str(bai) == "2":
            hien = goi("network.wireless.easymesh", "get", {})
            ts = dict(hien[1]) if len(hien) > 1 and isinstance(hien[1], dict) else {}
            ts.update({"MeshRole": "Controller"})
            kq = goi("network.wireless.easymesh", "set", ts)
        elif str(bai) == "5":
            kq = goi("data_repo.cigext", "set", {"network": {"lan": {"ipaddr": "192.168.1.1"}},
                                                 "dhcp": {"lan": {"start": "192.168.1.2"}}})
        else:
            hien = goi("network.wireless.easymesh", "get", {})
            ts = dict(hien[1]) if len(hien) > 1 and isinstance(hien[1], dict) else {}
            ts.update({"MeshEnabled": True, "MeshRole": "Agent"})
            kq = goi("network.wireless.easymesh", "set", ts)
        return kq[0] == 0
    finally:
        _goc._phien.pop(sid, None)


class Handler(_goc.H):
    def _gui_ftc(self, ma, than, kieu, them=()):
        self.send_response(ma)
        self.send_header("Content-Type", kieu)
        self.send_header("Content-Length", str(len(than)))
        self.send_header("Cache-Control", "no-cache, no-store, must-revalidate")
        self.send_header("Pragma", "no-cache")
        for k, v in them:
            self.send_header(k, v)
        self.end_headers()
        self.wfile.write(than)

    def do_POST(self):
        p = self.path.split("?")[0].split("#")[0]
        if p.rstrip("/") in ("/sim-reset-session", "/api/reset"):
            dat_lai_thiet_bi()
            return self._gui_ftc(200, b'{"ok":1}', "application/json",
                                 [("Access-Control-Allow-Origin", "*")])
        return super().do_POST()

    def do_GET(self):
        p = self.path.split("?")[0].split("#")[0]
        if p.rstrip("/") in ("/sim-reset-session", "/api/reset"):
            dat_lai_thiet_bi()
            return self._gui_ftc(200, b'{"ok":1}', "application/json",
                                 [("Access-Control-Allow-Origin", "*")])
        if p == "/ftc-dat-bai":
            from urllib.parse import parse_qs
            bai = (parse_qs(self.path.split("?", 1)[1] if "?" in self.path else "").get("bai") or [""])[0]
            ok = dat_trang_thai_bai(bai)
            return self._gui_ftc(200, json.dumps({"ok": 1 if ok else 0}).encode(), "application/json")
        if p == "/ftc-ax3000c.js":
            with open(TEP_FTC_JS, "rb") as f:
                return self._gui_ftc(200, f.read(), "text/javascript")
        if p in ("", "/") and not self._dang_sap():
            with open(os.path.join(_goc.GOC_WWW, "__ROOT__index.html"), "rb") as f:
                html = f.read()
            # chen TRUOC bundle de script chay truoc khi SPA doc sessionStorage
            html = html.replace(b"<script src=/js/chunk-vendors", THE_CHEN + b"<script src=/js/chunk-vendors", 1)
            return self._gui_ftc(200, html, "text/html")
        ten = _goc._ten_tep(self.path)
        if ten in THAY_JS and not self._dang_sap():
            with open(os.path.join(_goc.GOC_WWW, ten), "rb") as f:
                js = f.read()
            for cu, moi in THAY_JS[ten]:
                js = js.replace(cu, moi)
            return self._gui_ftc(200, js, "text/javascript")
        if ten.endswith(".js") and not self._dang_sap():
            p_tep = os.path.join(_goc.GOC_WWW, ten)
            if os.path.isfile(p_tep):
                with open(p_tep, "rb") as f:
                    js = f.read()
                return self._gui_ftc(200, js, "text/javascript")
        return super().do_GET()

    def do_HEAD(self):
        # BaseHTTPRequestHandler goc khong co HEAD; tra header cho gon
        self.send_response(200 if os.path.isfile(os.path.join(_goc.GOC_WWW, _goc._ten_tep(self.path))) else 404)
        self.end_headers()


if __name__ == "__main__":
    print("AX3000CV2 (fw 0.5.3) + FTC: http://localhost:%d/   dang nhap admin / admin" % PORT)
    httpd = ThreadingHTTPServer(("0.0.0.0", PORT), Handler)
    httpd.daemon_threads = True
    try:
        httpd.serve_forever()
    except KeyboardInterrupt:
        print("\nstopped")
