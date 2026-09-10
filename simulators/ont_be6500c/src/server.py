#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""Gia lap giao dien web ONT-BE6500C (thu tu thiet bi that).
Chay: python server.py [port]   (mac dinh 8094 -- KHAC 8092 cua AP-BE6500C
de hai bo co the chay cung luc, xem CLAUDE.md muc 0)

GD2 (2026-08-12): chi doc. 39 duong dan /api/v1/data/* co bang chung THAT
(thu truc tiep tren thiet bi 192.168.1.1, xem spec/seed_api.json) duoc
phuc vu qua config_store. Duong dan nao KHONG co trong kho thi tra 501 ro
rang thay vi gia vo co du lieu (nguyen tac 2.1).

GD3 (2026-08-12): da co spec/api_methods.json trich tu MA GOC (bundle
index-CW0UhNxy.js, xem src/trich_api_methods.py) -> siet method dung theo
ma goc.

GD4 (2026-08-13): MO DUONG GHI. Hop dong phan hoi do TRUC TIEP tren thiet
bi that, xem reference/source/hop_dong_ghi_that.json (moi phep do deu hoan
tac, thiet bi ve nguyen trang). Bon dieu bat buoc:

  PATCH  -> 200, than RONG        (khong tra doi tuong da cap nhat)
  POST   -> 200, {"ids":[...]}    (khong tra ban ghi)
  DELETE -> 200, than RONG        (than gui len la {"ids":[...]})
  GET    -> nhu cu

Truoc GD4 ta doan PATCH tra ve du lieu moi -- do la SAI. Phai do that moi
biet."""
import json
import os
import sys
from http.server import SimpleHTTPRequestHandler, ThreadingHTTPServer
from urllib.parse import urlparse

try:
    from . import config_store
except (ImportError, ValueError):
    import importlib.util
    _my_dir = os.path.dirname(os.path.abspath(__file__))
    _spec = importlib.util.spec_from_file_location("ont_be6500c_config_store", os.path.join(_my_dir, "config_store.py"))
    config_store = importlib.util.module_from_spec(_spec)
    _spec.loader.exec_module(config_store)

PORT = int(sys.argv[1]) if len(sys.argv) > 1 else 8094
ROOT = os.path.join(os.path.dirname(os.path.abspath(__file__)), "www")

TIEN_TO_API = "/api/v1/data/"

# Thiet bi that tra 503 cho endpoint nay -- gia lap phai tra dung nhu vay.
# Xem spec/seed_api.json muc _khong_lay_duoc.
API_503 = {"speedTest/servers"}

# Method hop le cua tung resource -- TRICH TU MA GOC thiet bi, khong doan.
# Nguon: spec/api_methods.json (sinh boi src/trich_api_methods.py tu bundle
# index-CW0UhNxy.js). Resource nao khong co trong bang nay thi ung dung
# THAT khong bao gio goi toi -- gia lap cung khong can biet method nao hop le.
_P_METHOD = os.path.join(os.path.dirname(os.path.abspath(__file__)),
                         "..", "spec", "api_methods.json")
try:
    with open(_P_METHOD, encoding="utf-8") as _f:
        METHOD_HOP_LE = {k[len("api/v1/data/"):]: set(v)
                         for k, v in json.load(_f)["resources"].items()}
except (FileNotFoundError, KeyError):
    METHOD_HOP_LE = {}

if "portForwarding/policies" not in METHOD_HOP_LE:
    METHOD_HOP_LE["portForwarding/policies"] = {"GET", "POST", "PATCH", "DELETE"}
if "staticRouting/policies" not in METHOD_HOP_LE:
    METHOD_HOP_LE["staticRouting/policies"] = {"GET", "POST", "PATCH", "DELETE"}


# Ma goc: 'system/info' CHI DOC. Muon doi hostname phai PATCH 'system'
# (ham setSystemInfo). Kho cau hinh luu du lieu do o khoa 'system/info',
# nen ghi vao 'system' phai chuyen huong sang do.
# DA KIEM CHUNG TREN THIET BI THAT 2026-08-13: PATCH 'system' {hostname:X}
# lam GET 'system/info' doi theo; GET thang 'system' thi thiet bi dong ket
# noi khong tra gi (HTTP 0). Xem hop_dong_ghi_that.json nhom C.
GHI_CHUYEN_HUONG = {"system": "system/info"}


def _tra_cuu_method(r):
    """Tra ve tap method hop le cua resource, hoac None neu khong biet.
    Xu ly duong dan co tham so: ma goc ghi 'tcpdump/interfaces/{id}' con
    duong dan that la 'tcpdump/interfaces/eth0' hoac 'tcpdump/interfaces/'."""
    if r in METHOD_HOP_LE:
        return METHOD_HOP_LE[r]
    phan = r.split("/")
    for mau, methods in METHOD_HOP_LE.items():
        pm = mau.split("/")
        if len(pm) != len(phan):
            continue
        if all(a == b or a == "{id}" for a, b in zip(pm, phan)):
            return methods
    return None


def _ten_resource(p):
    """/api/v1/data/pon/status -> 'pon/status'. Giu nguyen dau '/' cuoi
    neu co (vd 'speedTest/records/') vi do la duong dan THAT app goi."""
    if not p.startswith(TIEN_TO_API):
        return None
    return p[len(TIEN_TO_API):]


class H(SimpleHTTPRequestHandler):
    # BAT BUOC tu khai bao Content-Type -- tren Windows, thu vien mimetypes
    # cua Python doc registry he thong truoc; nhieu may KHONG co muc dang
    # ky cho .css/.js/.woff2 nen SimpleHTTPRequestHandler tra sai kieu
    # (thuong la application/octet-stream). Chrome TU CHOI ap dung
    # <link rel="stylesheet"> neu Content-Type khong phai text/css --
    # ket qua la giao dien mat toan bo CSS (icon phong to het co thanh
    # tam giac den). Da xac nhan tren may anh Huynn 2026-08-12, sua bang
    # cach ep dinh dang, khong phu thuoc he dieu hanh.
    extensions_map = {**SimpleHTTPRequestHandler.extensions_map, **{
        ".css": "text/css",
        ".js": "text/javascript",
        ".mjs": "text/javascript",
        ".json": "application/json",
        ".svg": "image/svg+xml",
        ".woff2": "font/woff2",
        ".woff": "font/woff",
        ".ttf": "font/ttf",
        ".png": "image/png",
        ".html": "text/html",
    }}

    def __init__(self, *a, **k):
        super().__init__(*a, directory=ROOT, **k)

    def end_headers(self):
        self.send_header("Cache-Control", "no-store")
        super().end_headers()

    def _tra_json(self, obj, ma=200):
        body = json.dumps(obj, ensure_ascii=False).encode("utf-8")
        self.send_response(ma)
        self.send_header("Content-Type", "application/json")
        self.send_header("Content-Length", str(len(body)))
        self.end_headers()
        self.wfile.write(body)

    # ---------------------------------------------------------------
    # Duong dan quan tri cua RIENG BAN GIA LAP.
    # KHONG ton tai tren thiet bi that. Dat tien to '__sim/' de khong bao
    # gio lan voi API that (/api/v1/data/...) va de nguoi doc nhan ra ngay.
    # Muc dich: dat lai kho ve dung seed sau khi thu nghiem, khong phai
    # khoi dong lai server.
    # ---------------------------------------------------------------
    def _quan_tri(self):
        p = urlparse(self.path).path
        if p == "/__sim/dat_lai":
            config_store.dat_lai_factory()
            return self._tra_json({"ok": True, "da": "dat lai kho ve seed"})
        if p == "/__sim/trang_thai":
            return self._tra_json({"ok": True,
                                   "resource": config_store.danh_sach()})
        return None

    def do_GET(self):
        p = urlparse(self.path).path
        if p.startswith("/__sim/"):
            kq = self._quan_tri()
            if kq is not None:
                return kq
            return self._tra_json({"loi": "khong co duong dan quan tri nay"}, 404)
        r = _ten_resource(p)
        if r is not None:
            if r in API_503:
                return self._tra_json(
                    {"loi": "service unavailable (giong thiet bi that)"}, 503)
            if config_store.co(r):
                gia_tri = config_store.doc(r)
                if gia_tri is None:
                    # Resource co trong seed nhung gia tri That la None (vd
                    # 'diagnostic', 'system' -- GET tra rong tren thiet bi
                    # that, xem tao_seed_api.py). Giu nguyen hanh vi do:
                    # tra rong 200, KHONG bia du lieu.
                    return self._tra_json(None)
                return self._tra_json(gia_tri)
            return self._tra_json(
                {"loi": f"chua co bang chung that cho {p}",
                 "goi_y": "xem spec/seed_api.json; chua thu duoc thi KHONG bia",
                 "da_co": config_store.danh_sach()}, 501)
        if self.path in ("/", "/index.html"):
            self.path = "/home__overview.html"
        return super().do_GET()

    def _tra_rong(self):
        """200 kem than RONG -- dung hop dong PATCH/DELETE cua thiet bi
        that (do duoc, xem hop_dong_ghi_that.json muc 1 va 3). Van gui
        Content-Type: application/json vi thiet bi that co gui."""
        self.send_response(200)
        self.send_header("Content-Type", "application/json")
        self.send_header("Content-Length", "0")
        self.end_headers()

    def _chuan_bi_ghi(self, method):
        """Kiem tra chung truoc khi ghi. Tra (resource_kho, du_lieu) neu
        hop le, hoac None neu da tu gui phan hoi loi roi."""
        p = urlparse(self.path).path
        r = _ten_resource(p)
        if r is None:
            self._tra_json({"loi": "not found"}, 404)
            return None

        cho_phep = _tra_cuu_method(r)
        if cho_phep is None:
            self._tra_json(
                {"loi": f"{p} khong nam trong danh sach API cua thiet bi",
                 "nguon": "spec/api_methods.json trich tu ma goc"}, 404)
            return None
        if method not in cho_phep:
            # Thiet bi that KHONG cho method nay tren resource nay.
            self._tra_json(
                {"loi": f"{p} khong ho tro {method}",
                 "method_hop_le": sorted(cho_phep),
                 "nguon": "trich tu ma goc thiet bi, xem spec/api_methods.json"},
                405)
            return None

        ln = int(self.headers.get("Content-Length", 0))
        raw = self.rfile.read(ln) if ln else b""
        try:
            du_lieu = json.loads(raw) if raw else None
        except json.JSONDecodeError:
            self._tra_json({"loi": "body khong phai JSON hop le"}, 400)
            return None

        return GHI_CHUYEN_HUONG.get(r, r), du_lieu

    def _chua_co_bang_chung(self, method):
        p = urlparse(self.path).path
        return self._tra_json(
            {"loi": f"chua co bang chung that cho {method} {p}",
             "goi_y": "xem spec/seed_api.json; chua thu duoc thi KHONG bia"}, 501)

    def do_PATCH(self):
        kq = self._chuan_bi_ghi("PATCH")
        if kq is None:
            return
        kho, du_lieu = kq
        if config_store.ghi(kho, du_lieu) is None:
            return self._chua_co_bang_chung("PATCH")
        return self._tra_rong()

    def do_DELETE(self):
        kq = self._chuan_bi_ghi("DELETE")
        if kq is None:
            return
        kho, du_lieu = kq
        if config_store.xoa(kho, du_lieu) is None:
            return self._chua_co_bang_chung("DELETE")
        return self._tra_rong()

    def _oui_rpc(self):
        """Kenh RIENG '/oui-rpc' -- KHAC HOAN TOAN facade /api/v1/data/*.
        Thiet bi that dung kenh nay cho system/user (doi mat khau); xem
        reference/har/system_user_doi_mk.har (do 2026-08-18). Than gui la
        {"method":"call","params":[sid,module,action,args]}.

        CHI mo phong DUNG 2 method da do that: user/get_users, user/change.
        Cac method khac quan sat duoc trong HAR (alive/login/logout/whoami/
        challenge/ui.get_menus) THUOC ve luong dang nhap/phien -- trang
        /login nam NGOAI pham vi du an tu GD0 (xem CLAUDE.md muc 1: bo 4
        route ky thuat /login, /ext, /, *), nen KHONG mo phong: tra 501 ro
        rang thay vi gia vo, dung nguyen tac 2.1."""
        ln = int(self.headers.get("Content-Length", 0))
        raw = self.rfile.read(ln) if ln else b""
        try:
            than = json.loads(raw) if raw else {}
        except json.JSONDecodeError:
            return self._tra_json({"loi": "body khong phai JSON hop le"}, 400)

        ph = than.get("params")
        if than.get("method") == "call" and isinstance(ph, list) and len(ph) == 4 \
                and ph[1] == "user" and isinstance(ph[3], dict):
            action, args = ph[2], ph[3]
            if action == "get_users":
                return self._tra_json(
                    {"result": {"users": config_store.doc("user/users") or []}})
            if action == "change":
                # Gop theo 'id' -- dung lai config_store.ghi() (da co san co
                # che gop mang theo khoa dinh danh), khong viet lai logic.
                if config_store.ghi("user/users", [args]) is None:
                    return self._chua_co_bang_chung("POST /oui-rpc user/change")
                # Thiet bi that tra than RONG {} (do duoc trong HAR).
                return self._tra_json({})

        return self._tra_json(
            {"loi": f"chua co bang chung that cho RPC nay (method={than.get('method')!r})",
             "goi_y": "chi mo phong user/get_users va user/change -- "
                      "xem reference/har/system_user_doi_mk.har"}, 501)

    def do_POST(self):
        if urlparse(self.path).path == "/oui-rpc":
            return self._oui_rpc()
        kq = self._chuan_bi_ghi("POST")
        if kq is None:
            return
        kho, du_lieu = kq
        ids = config_store.them(kho, du_lieu)
        if ids is None:
            return self._chua_co_bang_chung("POST")
        # Thiet bi that tra {"ids": [...]} -- do duoc, khong phai suy doan.
        return self._tra_json({"ids": ids})

    def log_message(self, *a):
        pass


if __name__ == "__main__":
    srv = ThreadingHTTPServer(("0.0.0.0", PORT), H)
    srv.daemon_threads = True
    print("=" * 50)
    print("  Gia lap ONT-BE6500C (KHONG phai AP-BE6500C)")
    print(f"  Mo trinh duyet: http://localhost:{PORT}/")
    print("  Ctrl+C de dung")
    print("=" * 50)
    try:
        srv.serve_forever()
    except KeyboardInterrupt:
        print("\nDa dung.")
