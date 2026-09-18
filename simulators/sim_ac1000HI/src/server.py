#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
MAY CHU GIA LAP — ONT AC1000HI (FPT Telecom, "GPON Home Gateway")
==================================================================

Chay:
    cd C:\\Claude_Code\\gia_lap_thiet_bi_mang\\devices\\ac1000hi\\src
    python server.py                # mac dinh cong 8095

Roi mo trinh duyet:  http://localhost:8095/
  -> tu chuyen sang /cgi-bin/login.asp (y het thiet bi that)
  -> dang nhap  admin / admin  (xem muc "TAI KHOAN" ben duoi)

TAI KHOAN
---------
Ban gia lap dung admin/admin (luu trong config_store.py, muc auth).
Day KHONG phai mat khau that cua thiet bi — thiet bi that khong cho doc
mat khau ra ngoai. Hoc vien dung cap nay de tap thao tac.

MUC DO TRUNG THUC (4 muc theo CLAUDE.md goc)
--------------------------------------------
1. Hinh anh : phuc vu NGUYEN VAN file HTML/CSS/JS/anh tai ve tu thiet bi that.
2. Cau truc : giu y nguyen duong dan /cgi-bin/*.asp, ten frame, ten input,
              ten ham JS. KHONG doi mot chu nao trong file goc.
3. Giao tiep: mo phong dung hop dong da do that —
              * chua dang nhap  -> MOI trang tra 401 + than 140 byte y het that
              * /cgi-bin/reqLogin doc cookie uid/psw -> cap SESSIONID -> vao index
              * /cgi-bin/logout.cgi -> xoa phien
4. Trang thai: moi thu doc/ghi qua config_store.py (dong vai tro NVRAM).

HOP DONG DA DO TREN THIET BI THAT (2026-08-22)
----------------------------------------------
  GET bat ky trang nao khi CHUA co phien:
      HTTP 401
      Content-Type: text/html; charset=gb2312
      Set-Cookie: SESSIONID=...
      than (140 byte, nguyen van):
      <HTML><HEAD><TITLE>Login</TITLE><script language=javascript>
      top.location.replace("/cgi-bin/login.asp");</script></HEAD><body></body></HTML>

  Dang nhap: JS trong login.asp dat 2 cookie uid/psw roi
      GET /cgi-bin/reqLogin
  (KHONG submit form — nut Login la type=button, xem
   reference/source/do_co_che_dang_nhap.json)
"""
import json
import os
import random
import sys
from http.server import SimpleHTTPRequestHandler, ThreadingHTTPServer
from http.cookies import SimpleCookie
from urllib.parse import urlparse

sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
from . import config_store as kho                                   # noqa: E402
from . import render_dong                                           # noqa: E402

PORT = int(sys.argv[1]) if len(sys.argv) > 1 else 8095
ROOT = os.path.join(os.path.dirname(os.path.abspath(__file__)), "www")

# --------------------------------------------------------------------------
# Than 401 — NGUYEN VAN tu thiet bi that, dung 140 byte. Khong sua mot ky tu.
# --------------------------------------------------------------------------
THAN_401 = (
    b'<HTML><HEAD><TITLE>Login</TITLE><script language=javascript>'
    b'location.replace("/cgi-bin/login.asp");</script></HEAD>'
    b'<body></body></HTML>\n'
)

# Cac duong dan KHONG can dang nhap (thiet bi that cho xem truoc khi vao).
CONG_KHAI = {
    "/cgi-bin/login.asp",
    "/cgi-bin/reqLogin",
    "/cgi-bin/logout.cgi",
}

# Duong dan tai nguyen tinh o goc (/style.css, /logo.png ...) — luon cho qua,
# vi trang login can chung de hien dung.
DUOI_TINH = (".css", ".js", ".png", ".gif", ".jpg", ".jpeg", ".ico",
             ".ttf", ".woff", ".woff2", ".htc")

# Hai duong dan CO trong menu nhung thiet bi that tra 404 — phai giu y nguyen,
# KHONG duoc tu dung trang (xem spec/menu-tree.json).
TRA_404 = {
    "/cgi-bin/access_cwmp.asp",
    "/cgi-bin/adv_portbinding.asp",
}

# ==========================================================================
# BAI HOC 2026-08-22 — DA TUNG KET LUAN SAI O DAY, GIU LAI DE KHONG LAP LAI
# ==========================================================================
# Ban dau tap tin nay co danh sach KHONG_TON_TAI_401 gom 3 duong dan
# /PIE.htc, /BeVietnam-Regular.ttf, /BeVietnam-Bold.ttf, kem lap luan:
# "thiet bi that tra 401 nen ban gia lap cung phai tra 401, khong duoc tu
# them font vao ke o lam dep hon that".
#
# LAP LUAN DO SAI. Su that:
#   - 3 tep CO THAT tren thiet bi: 86.308 / 88.456 / 41.137 byte.
#   - Chung chi tra 401 khi xin tu ngu canh CHUA DANG NHAP (trang login) hoac
#     tu script Python — con Chrome dang mo trang ben trong thi doc duoc 200
#     (da thu ca cache:'no-store' va cache:'reload' de loai tru bo nho dem).
#   - Tren thiet bi that, document.fonts bao "BeVietnamRegular = loaded".
#
# Hau qua neu khong sua: ban gia lap hien chu bang Times New Roman trong khi
# thiet bi that hien bang Be Vietnam. Do chieu rong chuoi
# 'Working Mode Serial Number Model' co 13px:
#       thiet bi that : 220.47 px
#       gia lap (sai) : 195.36 px
#
# Cai nguy hiem nhat: bo kiem tu dong van bao "43/43 dat", vi chinh no da bi
# day rang 401 la dung. Cong cu kiem xac nhan cho gia dinh sai cua nguoi viet.
# Anh Huynn phat hien bang cau hoi "font khong dung thi co giong that duoc
# khong?" — nhac lai rang PHAI DO KET QUA HIEN THI, khong duoc suy tu ma HTTP.
#
# Da lay du 3 tep ve (Chrome doc roi POST sang /__sim/nhan_file). Gio phuc vu
# binh thuong nhu moi tai nguyen tinh khac, va bo kiem co them phep so chieu
# rong chu giua hai ben.
# ==========================================================================


class H(SimpleHTTPRequestHandler):
    # Tu khai bao kieu MIME: tren Windows thu vien mimetypes doc registry he
    # thong, nhieu may khong co muc cho .css/.js nen tra sai kieu va Chrome
    # bo qua stylesheet -> giao dien vo hinh dang. Bai hoc tu cac thiet bi
    # truoc trong du an, ep cung o day cho chac.
    extensions_map = {**SimpleHTTPRequestHandler.extensions_map, **{
        ".css": "text/css",
        ".js": "text/javascript",
        ".png": "image/png",
        ".gif": "image/gif",
        ".ttf": "font/ttf",
        ".htc": "text/x-component",
        ".asp": "text/html",
        ".cgi": "text/html",
        "": "text/html",
    }}

    def __init__(self, *a, **k):
        super().__init__(*a, directory=ROOT, **k)

    # ---- tien ich ----
    def log_message(self, fmt, *args):
        sys.stderr.write("  %s\n" % (fmt % args))

    def _cookie(self, ten):
        raw = self.headers.get("Cookie")
        if not raw:
            return None
        try:
            c = SimpleCookie()
            c.load(raw)
            return c[ten].value if ten in c else None
        except Exception:                                    # noqa: BLE001
            return None

    def _tra_401(self):
        """Tra dung hop dong 401 cua thiet bi that."""
        sid = self._cookie("SESSIONID") or "%08x" % random.getrandbits(32)
        self.send_response(401)
        self.send_header("Content-Type", "text/html; charset=gb2312")
        self.send_header("Content-Length", str(len(THAN_401)))
        self.send_header("Set-Cookie", f"SESSIONID={sid}; path=/")
        self.end_headers()
        self.wfile.write(THAN_401)

    def _tra_404(self):
        """404 y het thiet bi that (165-169 byte, trang loi mac dinh)."""
        than = (b'<HTML><HEAD><TITLE>404 Not Found</TITLE></HEAD>'
                b'<BODY><H1>404 Not Found</H1>\nThe requested URL was not '
                b'found on this server.\n</BODY></HTML>\n')
        self.send_response(404)
        self.send_header("Content-Type", "text/html; charset=gb2312")
        self.send_header("Content-Length", str(len(than)))
        self.end_headers()
        self.wfile.write(than)

    def _chuyen_huong(self, den, sid=None):
        self.send_response(302)
        self.send_header("Location", den)
        if sid:
            self.send_header("Set-Cookie", f"SESSIONID={sid}; path=/")
        self.send_header("Content-Length", "0")
        self.end_headers()

    def _tra_json(self, obj, ma=200):
        b = json.dumps(obj, ensure_ascii=False).encode("utf-8")
        self.send_response(ma)
        self.send_header("Content-Type", "application/json; charset=utf-8")
        self.send_header("Content-Length", str(len(b)))
        self.end_headers()
        self.wfile.write(b)

    def end_headers(self):
        self.send_header("Cache-Control", "no-store")
        super().end_headers()

    # ---- dinh tuyen ----
    def do_GET(self):                                        # noqa: N802
        sid = self._cookie("SESSIONID")
        kho.dat_phien_hien_tai(sid)
        p = urlparse(self.path).path

        # 1) Duong dan quan tri CHI CO o ban gia lap (khong ton tai tren thiet
        #    bi that) — dat tien to __sim/ de khong bao gio lan voi duong that.
        if p in ("/__sim/dat_lai", "/api/reset", "/resetsession"):
            if sid:
                kho.dat_lai_factory(sid)
                kho.dong_phien(sid)
            return self._tra_json({"status": "ok", "message": "AC1000HI factory reset"})
        if p == "/__sim/kho":
            return self._tra_json(kho.tat_ca())

        # 2) Trang chu -> chuyen ve login (thiet bi that: go 192.168.1.1 se bi
        #    401 roi JS day ve login.asp; o day rut gon thanh chuyen huong).
        if p in ("/", "/index.html"):
            return self._chuyen_huong("/cgi-bin/login.asp")

        if p == "/cgi-bin/reqLogin":
            uid = self._cookie("uid")
            psw = self._cookie("psw")
            if kho.kiem_tra_dang_nhap(uid, psw):
                sid = "%08x" % random.getrandbits(32)
                kho.mo_phien(sid)
                return self._chuyen_huong("/cgi-bin/index.asp", sid=sid)
            # Sai tai khoan: thiet bi that tra ve gi thi CHUA DO DUOC
            # (khong thu go sai de tranh bi khoa) — ghi trong ISSUES.md.
            # Tam thoi tra ve dung hop dong 401 nhu moi trang chua co phien.
            return self._tra_401()

        # 4) Dang xuat
        if p == "/cgi-bin/logout.cgi":
            kho.dong_phien(sid)
            return self._chuyen_huong("/cgi-bin/login.asp")

        # 5) Hai trang thiet bi that tra 404 — giu nguyen
        if p in TRA_404:
            return self._tra_404()

        # (5b cu — luat tra 401 cho 2 font + PIE.htc — DA BO, xem ghi chu
        #  "BAI HOC 2026-08-22" o dau tap tin. Ba tep do CO THAT, nay phuc vu
        #  binh thuong nhu moi tai nguyen tinh khac.)

        # 6) Chan cua: moi trang .asp/.cgi deu doi phien, tru trang cong khai
        la_tinh = p.endswith(DUOI_TINH)
        if not la_tinh and p not in CONG_KHAI:
            if not kho.phien_hop_le(self._cookie("SESSIONID")):
                return self._tra_401()

        # 7) Trang co du lieu DONG: doc file goc roi bom gia tri tu kho cau
        #    hinh truoc khi tra (KHONG sua file goc tren dia — muc 2.2).
        if render_dong.co_bom(p):
            duong_dan_file = os.path.join(ROOT, p.lstrip("/").replace("/", os.sep))
            if os.path.exists(duong_dan_file):
                with open(duong_dan_file, encoding="utf-8", errors="ignore") as f:
                    html = f.read()
                html = render_dong.bom(p, html)
                b = html.encode("utf-8", "ignore")
                self.send_response(200)
                self.send_header("Content-Type", "text/html")
                self.send_header("Content-Length", str(len(b)))
                self.end_headers()
                return self.wfile.write(b)

        # 8) Phuc vu file that trong www/
        return super().do_GET()

    def do_OPTIONS(self):                                    # noqa: N802
        """Cho phep trinh duyet POST tu trang cua thiet bi that sang day
        (chi dung cho duong dan thu thap bang chung /__sim/nhan_file)."""
        self.send_response(204)
        self.send_header("Access-Control-Allow-Origin", "*")
        self.send_header("Access-Control-Allow-Methods", "POST, OPTIONS")
        self.send_header("Access-Control-Allow-Headers", "*")
        self.end_headers()

    def do_POST(self):                                       # noqa: N802
        sid = self._cookie("SESSIONID")
        kho.dat_phien_hien_tai(sid)
        p = urlparse(self.path).path

        if p in ("/__sim/dat_lai", "/api/reset", "/resetsession"):
            if sid:
                kho.dat_lai_factory(sid)
                kho.dong_phien(sid)
            return self._tra_json({"status": "ok", "message": "AC1000HI factory reset"})

        # ------------------------------------------------------------------
        # /__sim/nhan_file?ten=<ten file>
        # Duong dan CHI CO o ban gia lap, dung de THU THAP BANG CHUNG.
        #
        # Vi sao can: 3 tep /BeVietnam-Regular.ttf, /BeVietnam-Bold.ttf,
        # /PIE.htc tra 401 khi tai bang script Python, nhung Chrome dang mo
        # thiet bi that thi doc duoc binh thuong (200, dung kich thuoc, da thu
        # ca cache:'no-store'). Chua ro thiet bi phan biet bang gi.
        # => Cho chinh Chrome doc roi POST thang sang day, ghi vao www/.
        #
        # An toan: chi ghi duoc vao www/, chi nhan ten file trong danh sach
        # trang, khong cho duong dan long nhau.
        # ------------------------------------------------------------------
        if p == "/__sim/nhan_file":
            from urllib.parse import parse_qs
            q = parse_qs(urlparse(self.path).query)
            ten = (q.get("ten") or [""])[0]
            cho_phep = {"BeVietnam-Regular.ttf", "BeVietnam-Bold.ttf", "PIE.htc"}
            if ten not in cho_phep:
                self.send_response(400)
                self.send_header("Access-Control-Allow-Origin", "*")
                self.end_headers()
                return
            n = int(self.headers.get("Content-Length", 0))
            du_lieu = self.rfile.read(n)
            with open(os.path.join(ROOT, ten), "wb") as f:
                f.write(du_lieu)
            print(f"  [nhan_file] da ghi {ten}: {len(du_lieu)} byte")
            self.send_response(200)
            self.send_header("Access-Control-Allow-Origin", "*")
            self.send_header("Content-Type", "text/plain")
            b = f"da ghi {ten} {len(du_lieu)} byte".encode()
            self.send_header("Content-Length", str(len(b)))
            self.end_headers()
            return self.wfile.write(b)

        # ------------------------------------------------------------------
        # LUU CAU HINH — dung hop dong da do tren thiet bi that
        # (reference/har/tools_time_apply.har -> do_hop_dong_ghi.json):
        #   POST toi CHINH URL cua trang, body urlencoded, gui TOAN BO truong
        #   -> tra 200 + CHINH TRANG DO da render lai. Khong redirect, khong JSON.
        # ------------------------------------------------------------------
        if render_dong.co_ghi(p):
            if not kho.phien_hop_le(self._cookie("SESSIONID")):
                return self._tra_401()

            from urllib.parse import parse_qs
            n = int(self.headers.get("Content-Length", 0))
            raw = self.rfile.read(n).decode("utf-8", "replace")
            # keep_blank_values=True — thiet bi that GUI CA TRUONG RONG,
            # neu bo di se lech hop dong.
            truong = {k: v[0] for k, v in
                      parse_qs(raw, keep_blank_values=True).items()}

            da_ghi, _ = render_dong.ghi_tu_form(p, truong)
            print(f"  [POST] {p}: da ghi {da_ghi} truong vao kho")

            # Tra lai CHINH TRANG DO, da render lai tu kho (giong thiet bi that)
            duong_dan_file = os.path.join(ROOT, p.lstrip("/").replace("/", os.sep))
            with open(duong_dan_file, encoding="utf-8", errors="ignore") as f:
                html = f.read()
            if render_dong.co_bom(p):
                html = render_dong.bom(p, html)
            b = html.encode("utf-8", "ignore")
            self.send_response(200)
            self.send_header("Content-Type", "text/html;charset=utf-8")
            self.send_header("Content-Length", str(len(b)))
            self.end_headers()
            return self.wfile.write(b)

        return self._post_chua_gia_lap()

    def _post_chua_gia_lap(self):
        # GD hien tai (login + index) chua co trang nao ghi du lieu.
        # Khi lam tiep cac nhom menu se noi POST vao config_store o day,
        # dung hop dong do that trong reference/har/.
        self.send_response(501)
        self.send_header("Content-Type", "text/plain; charset=utf-8")
        than = ("Chua gia lap POST cho duong dan nay. Can do hop dong ghi "
                "that (HAR) truoc — xem ISSUES.md.").encode("utf-8")
        self.send_header("Content-Length", str(len(than)))
        self.end_headers()
        self.wfile.write(than)


def main():
    print("=" * 68)
    print("GIA LAP ONT AC1000HI — GPON Home Gateway")
    print(f"  Thu muc phuc vu : {ROOT}")
    print(f"  Dia chi         : http://localhost:{PORT}/")
    print(f"  Tai khoan       : {kho.doc('auth.username')} / {kho.doc('auth.password')}")
    print("  Dat lai kho     : http://localhost:%d/__sim/dat_lai" % PORT)
    print("=" * 68)
    with ThreadingHTTPServer(("0.0.0.0", PORT), H) as srv:
        try:
            srv.serve_forever()
        except KeyboardInterrupt:
            print("\nDa dung server.")


if __name__ == "__main__":
    main()

