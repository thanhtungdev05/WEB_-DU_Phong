#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
Gia lap giao dien web AX3000GZV3 (ZTE F6201B - LuCI).
Phuc vu dung duong dan /cgi-bin/luci/... nen cac lien ket that trong trang
chay duoc nguyen ven, khong can va JavaScript.

Chay: python server.py [port]   (mac dinh 8094)
"""
import os, sys, json
from http.server import BaseHTTPRequestHandler, ThreadingHTTPServer
from urllib.parse import urlparse, unquote

PORT = int(sys.argv[1]) if len(sys.argv) > 1 else 8094
BASE = os.path.dirname(os.path.abspath(__file__))
WWW = os.path.join(BASE, "www")
PAGES = os.path.join(WWW, "pages")

TRANG_CHU = "/cgi-bin/luci/admin/home"


def ten_file(luci_path):
    """/admin/localnetwork/WLAN/WLANbasic -> admin__localnetwork__WLAN__WLANbasic.html"""
    p = luci_path.strip("/")
    return p.replace("/", "__") + ".html" if p else None


# Ban do 'firstchild'/'alias' lay tu menu.json cua thiet bi.
# LuCI chon trang con theo truong 'order' (KHONG phai theo thu tu chu cai),
# vi du /admin/internet -> /admin/internet/status/poninform chu khong phai .../ddns
try:
    with open(os.path.join(WWW, "firstchild.json"), encoding="utf-8") as fh:
        FIRSTCHILD = json.load(fh)
except Exception:
    FIRSTCHILD = {}


def tim_trang(luci_path):
    """Tra ve duong dan file cho 1 duong dan LuCI."""
    p = "/" + luci_path.strip("/")

    # 1) khop chinh xac
    f = ten_file(p)
    if f and os.path.exists(os.path.join(PAGES, f)):
        return os.path.join(PAGES, f)

    # 2) node nhom -> giai theo dung ban do cua thiet bi
    dich = FIRSTCHILD.get(p)
    if dich:
        f2 = ten_file(dich)
        if f2 and os.path.exists(os.path.join(PAGES, f2)):
            return os.path.join(PAGES, f2)

    # 3) cuoi cung moi doan theo tien to (truong hop menu.json thieu)
    if f:
        prefix = f[:-5] + "__"
        con = sorted(x for x in os.listdir(PAGES) if x.startswith(prefix))
        if con:
            return os.path.join(PAGES, con[0])
    return None


class H(BaseHTTPRequestHandler):
    def _gui(self, data, ctype, code=200):
        self.send_response(code)
        self.send_header("Content-Type", ctype)
        self.send_header("Content-Length", str(len(data)))
        self.send_header("Cache-Control", "no-store")
        self.end_headers()
        self.wfile.write(data)

    def _chuyen(self, to):
        self.send_response(302)
        self.send_header("Location", to)
        self.send_header("Content-Length", "0")
        self.end_headers()

    def do_GET(self):
        path = unquote(urlparse(self.path).path)
        if path in ("/api/reset", "/resetsession"):
            return self._gui(b'{"status":"ok","message":"AX3000GZ state reset"}', "application/json")

        # Vao trang goc -> trang dang nhap TRUOC (giong thiet bi that:
        # go 192.168.1.1 se ra login, dang nhap xong moi vao home).
        if path in ("/", "/index.html", "/cgi-bin/luci", "/cgi-bin/luci/"):
            return self._chuyen("/cgi-bin/luci/login")

        # Dang xuat -> ve trang dang nhap (giong thiet bi that)
        if path in ("/cgi-bin/luci/admin/logout", "/cgi-bin/luci/logout"):
            return self._chuyen("/cgi-bin/luci/login")

        # Trang dang nhap
        if path in ("/cgi-bin/luci/login", "/login", "/login.html"):
            with open(os.path.join(WWW, "login.html"), "rb") as fh:
                return self._gui(fh.read(), "text/html; charset=utf-8")

        # tai nguyen tinh: CSS, anh, icon
        if path.startswith("/luci-static/"):
            f = os.path.join(WWW, path.lstrip("/"))
            if os.path.exists(f):
                ext = os.path.splitext(f)[1].lower()
                ct = {
                    ".css": "text/css",
                    ".png": "image/png",
                    ".gif": "image/gif",
                    ".jpg": "image/jpeg", ".jpeg": "image/jpeg",
                    ".svg": "image/svg+xml",
                    ".ico": "image/x-icon",
                    ".js": "application/javascript",
                }.get(ext, "application/octet-stream")
                with open(f, "rb") as fh:
                    return self._gui(fh.read(), ct)
            # thieu file -> tra dung kieu de trinh duyet khong bao loi
            if path.endswith(".css"):
                return self._gui(b"", "text/css")
            return self._gui(b"", "image/gif")

        # trang cau hinh
        if path.startswith("/cgi-bin/luci/"):
            sub = path[len("/cgi-bin/luci"):]
            f = tim_trang(sub)
            if f:
                with open(f, "rb") as fh:
                    return self._gui(fh.read(), "text/html; charset=utf-8")
            return self._gui(
                ("<meta http-equiv='refresh' content='0;url=%s'>"
                 "<p style=\"font-family:sans-serif;padding:20px\">Trang <code>%s</code> "
                 "khong co trong ban gia lap. Dang ve trang chu...</p>" % (TRANG_CHU, sub)
                 ).encode(), "text/html; charset=utf-8", 404)

        if path in ("/menu.json", "/modal-defs.json", "/firstchild.json",
                    "/gia-tri-that.json"):
            with open(os.path.join(WWW, path.lstrip("/")), "rb") as fh:
                return self._gui(fh.read(), "application/json")

        return self._gui(b"Not found", "text/plain", 404)

    def do_POST(self):
        path = unquote(urlparse(self.path).path)
        if path in ("/api/reset", "/resetsession"):
            return self._gui(b'{"status":"ok","message":"AX3000GZ state reset"}', "application/json")
        self._chuyen(self.headers.get("Referer") or TRANG_CHU)

    def log_message(self, *a):
        pass


if __name__ == "__main__":
    srv = ThreadingHTTPServer(("0.0.0.0", PORT), H)
    srv.daemon_threads = True
    print("=" * 56)
    print("  Gia lap AX3000GZV3 (ZTE F6201B)")
    print(f"  Mo trinh duyet: http://localhost:{PORT}/")
    print(f"  So trang: {len(os.listdir(PAGES))}")
    print("  Ctrl+C de dung")
    print("=" * 56)
    try:
        srv.serve_forever()
    except KeyboardInterrupt:
        print("\nDa dung.")
