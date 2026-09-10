#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""Gia lap giao dien web BE6500C (thu tu thiet bi that).
Chay: python server.py [port]   (mac dinh 8092)

Muc 3/4 (2026-08-10): 27 duong dan /api/v1/data/* co bang chung THAT (thu
truc tiep tren thiet bi 192.168.1.1, xem spec/seed_api.json) duoc xu ly
dong qua config_store. Duong dan /api/v1/data/* nao KHONG co trong kho thi
tra 501 ro rang thay vi gia vo co du lieu (nguyen tac 2.1)."""
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
    _spec = importlib.util.spec_from_file_location("sim_ont_be6500c_config_store", os.path.join(_my_dir, "config_store.py"))
    config_store = importlib.util.module_from_spec(_spec)
    _spec.loader.exec_module(config_store)

PORT = int(sys.argv[1]) if len(sys.argv) > 1 else 8092
ROOT = os.path.join(os.path.dirname(os.path.abspath(__file__)), "www")

TIEN_TO_API = "/api/v1/data/"

# Thiet bi that tra 503 cho endpoint nay -> gia lap phai tra dung nhu vay,
# khong duoc "sua cho dep". Xem spec/seed_api.json muc _khong_lay_duoc.
API_503 = {"speedTest/servers"}

# Method hop le cua tung resource -- TRICH TU MA GOC cua thiet bi
# (reference/source/assets_goc/index-DVvqSuzn.js va cac chunk, xem
# spec/api_methods.json). Day la dac ta CHINH THUC, khong phai suy luan.
_P_METHOD = os.path.join(os.path.dirname(os.path.abspath(__file__)),
                         "..", "spec", "api_methods.json")
try:
    with open(_P_METHOD, encoding="utf-8") as _f:
        METHOD_HOP_LE = {k[len("api/v1/data/"):]: set(v)
                         for k, v in json.load(_f).items()}
except FileNotFoundError:
    METHOD_HOP_LE = {}

# Ma goc: 'system/info' CHI DOC. Muon doi hostname phai PATCH
# 'api/v1/data/system' (ham setSystemInfo). Kho cau hinh luu du lieu do o
# khoa 'system/info', nen ghi vao 'system' phai chuyen huong sang do.
GHI_CHUYEN_HUONG = {"system": "system/info"}


def _ten_resource(p):
    """/api/v1/data/ext/timer/wifi -> 'ext/timer/wifi'. Giu nguyen dau '/'
    cuoi neu co (vd 'speedTest/records/') vi do la duong dan THAT app goi."""
    if not p.startswith(TIEN_TO_API):
        return None
    return p[len(TIEN_TO_API):]


class H(SimpleHTTPRequestHandler):
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

    def do_GET(self):
        p = urlparse(self.path).path
        r = _ten_resource(p)
        if r is not None:
            if r in API_503:
                return self._tra_json(
                    {"loi": "service unavailable (giong thiet bi that)"}, 503)
            if config_store.co(r):
                return self._tra_json(config_store.doc(r))
            return self._tra_json(
                {"loi": f"chua co bang chung that cho {p}",
                 "goi_y": "xem spec/seed_api.json; chua thu duoc thi KHONG bia",
                 "da_co": config_store.danh_sach()}, 501)
        if self.path in ("/", "/index.html"):
            self.path = "/home__overview.html"
        return super().do_GET()

    def do_PATCH(self):
        p = urlparse(self.path).path
        r = _ten_resource(p)
        if r is None:
            return self._tra_json({"loi": "not found"}, 404)

        ln = int(self.headers.get("Content-Length", 0))
        raw = self.rfile.read(ln) if ln else b""
        try:
            du_lieu = json.loads(raw) if raw else None
        except json.JSONDecodeError:
            return self._tra_json({"loi": "body khong phai JSON hop le"}, 400)

        # Thiet bi that chi cho PATCH len dung nhung resource nay (doc tu ma
        # goc). Resource chi-doc ma bi PATCH -> phai bao loi, khong duoc ghi.
        cho_phep = METHOD_HOP_LE.get(r)
        if cho_phep is not None and "PATCH" not in cho_phep:
            return self._tra_json(
                {"loi": f"{p} khong ho tro PATCH",
                 "method_hop_le": sorted(cho_phep),
                 "nguon": "trich tu ma goc thiet bi, xem spec/api_methods.json"}, 405)

        kho = GHI_CHUYEN_HUONG.get(r, r)
        ket_qua = config_store.ghi(kho, du_lieu)
        if ket_qua is None:
            return self._tra_json(
                {"loi": f"chua co bang chung that cho PATCH {p}"}, 501)
        return self._tra_json(ket_qua)

    def _ghi_theo_method(self, method, ham):
        """Khung chung cho DELETE/POST: kiem tra method co hop le voi
        resource khong (theo ma goc), roi goi ham tuong ung trong kho."""
        p = urlparse(self.path).path
        r = _ten_resource(p)
        if r is None:
            return self._tra_json({"loi": "not found"}, 404)

        cho_phep = METHOD_HOP_LE.get(r)
        if cho_phep is not None and method not in cho_phep:
            return self._tra_json(
                {"loi": f"{p} khong ho tro {method}",
                 "method_hop_le": sorted(cho_phep),
                 "nguon": "trich tu ma goc thiet bi, xem spec/api_methods.json"}, 405)

        ln = int(self.headers.get("Content-Length", 0))
        raw = self.rfile.read(ln) if ln else b""
        try:
            du_lieu = json.loads(raw) if raw else None
        except json.JSONDecodeError:
            return self._tra_json({"loi": "body khong phai JSON hop le"}, 400)

        ket_qua = ham(GHI_CHUYEN_HUONG.get(r, r), du_lieu)
        if ket_qua is None:
            return self._tra_json(
                {"loi": f"chua co bang chung that cho {method} {p}"}, 501)
        return self._tra_json(ket_qua)

    def do_DELETE(self):
        return self._ghi_theo_method("DELETE", config_store.xoa)

    def do_POST(self):
        # ext/logpull la HANH DONG (bat dau thu thap log), khong phai them
        # ban ghi vao danh sach -- ma goc goi setLogPull khong kem body.
        if _ten_resource(urlparse(self.path).path) == "ext/logpull":
            return self._tra_json(config_store.bat_dau_logpull())
        return self._ghi_theo_method("POST", config_store.them)

    def log_message(self, *a):
        pass


if __name__ == "__main__":
    srv = ThreadingHTTPServer(("0.0.0.0", PORT), H)
    srv.daemon_threads = True
    print("=" * 50)
    print("  Gia lap BE6500C")
    print(f"  Mo trinh duyet: http://localhost:{PORT}/")
    print("  Ctrl+C de dung")
    print("=" * 50)
    try:
        srv.serve_forever()
    except KeyboardInterrupt:
        print("\nDa dung.")
