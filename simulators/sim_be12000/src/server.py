#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""Gia lap BE12000 (ZTE F8728D V3.0.12P2N2).

Chay:
    python server.py                                  # cong 8098, state mac dinh
    python server.py --port 8099 --state may2.json    # thuc the thu hai

Moi thuc the = mot tien trinh + mot file state rieng -> chay song song duoc,
phuc vu muc tieu ao hoa kieu GNS3 (CLAUDE.md muc 3.3).

Chi dung thu vien chuan Python, khong phu thuoc ngoai.
"""
import argparse
import json
import os
import sys
from http.server import BaseHTTPRequestHandler, ThreadingHTTPServer
from urllib.parse import parse_qs, urlparse

THU_MUC = os.path.dirname(os.path.abspath(__file__))
sys.path.insert(0, THU_MUC)

from config_store import ConfigStore            # noqa: E402
from dispatch import Dispatcher, nap_ban_do_ngu_canh  # noqa: E402
from session import Session, _chuoi_ngau_nhien, DAI_SESS_TOKEN  # noqa: E402

MAC_DINH_CONG = 8098
ROOT = THU_MUC
WWW = os.path.join(THU_MUC, "www")
BASE = os.path.dirname(THU_MUC)
FACTORY = os.path.join(THU_MUC, "state", "factory.json")
CGI_MAP = os.path.join(os.path.dirname(THU_MUC), "spec", "cgi-map.json")

import threading
import time

_SIM_LOCK = threading.Lock()
_CGI_MAP_OBJ = nap_ban_do_ngu_canh(CGI_MAP)
_DEFAULT_STATE = os.path.join(THU_MUC, "state", "instance-01.json")
_store = ConfigStore(_DEFAULT_STATE, FACTORY)
_session = Session("admin", "admin")
_disp = Dispatcher(THU_MUC, _store, _session, _CGI_MAP_OBJ)
GLOBAL_SIM = {"store": _store, "session": _session, "disp": _disp, "chi_tiet": False}
_USER_SIMS = {}


def _cap_nhat_store_topo(store, slave_list, client_list):
    if not hasattr(store, "_state") or not isinstance(store._state, dict):
        return
    jt = store._state.setdefault("jsonThoDataTags", {})
    tl = jt.setdefault("topo_lua.lua", {})
    raw = tl.setdefault("raw", {})
    raw["slave"] = list(slave_list) if slave_list is not None else []
    ad = raw.setdefault("ad", {})
    if client_list:
        ad["MGET_INST_NUM"] = len(client_list)
        for idx, cl in enumerate(client_list, 1):
            ad[str(idx)] = cl
    else:
        ad["MGET_INST_NUM"] = 0


def cap_nhat_topology_mesh(slave_list=None, client_list=None):
    with _SIM_LOCK:
        if "store" in GLOBAL_SIM:
            _cap_nhat_store_topo(GLOBAL_SIM["store"], slave_list, client_list)
        for s in _USER_SIMS.values():
            if isinstance(s, dict) and "store" in s:
                _cap_nhat_store_topo(s["store"], slave_list, client_list)


class Handler(BaseHTTPRequestHandler):

    protocol_version = "HTTP/1.1"
    server_version = "BE12000-sim"

    # ---------- tien ich ----------

    def _gui(self, du_lieu, kieu, ma=200):
        if isinstance(du_lieu, str):
            du_lieu = du_lieu.encode("utf-8")
        self.send_response(ma)
        self.send_header("Content-Type", kieu)
        self.send_header("Content-Length", str(len(du_lieu)))
        self.send_header("Cache-Control", "no-store")
        if not getattr(self, "_has_be_cookie", True) and hasattr(self, "_current_be_sid"):
            self.send_header("Set-Cookie", f"be12000_sid={self._current_be_sid}; Path=/; SameSite=Lax")
            self._has_be_cookie = True
        self.end_headers()
        self.wfile.write(du_lieu)

    def _tham_so_url(self):
        q = parse_qs(urlparse(self.path).query, keep_blank_values=True)
        return {k: v[0] for k, v in q.items()}

    def _than_post(self):
        dai = int(self.headers.get("Content-Length") or 0)
        raw = self.rfile.read(dai).decode("utf-8", "replace") if dai else ""
        q = parse_qs(raw, keep_blank_values=True)
        return {k: v[0] for k, v in q.items()}

    def _client_session_info(self):
        hdr = (self.headers.get("X-KTV-Session-ID", "") or "").strip()
        if hdr:
            self._has_be_cookie = True
            self._current_be_sid = hdr
            return hdr
        if "?_ktv=" in getattr(self, "path", "") or "&_ktv=" in getattr(self, "path", ""):
            try:
                q = parse_qs(urlparse(self.path).query)
                if "_ktv" in q and q["_ktv"][0]:
                    sid = q["_ktv"][0].strip()
                    self._has_be_cookie = True
                    self._current_be_sid = sid
                    return sid
            except Exception:
                pass
        cookie = self.headers.get("Cookie", "")
        if cookie:
            import re
            m = re.search(r'(?:ftc_session|be12000_sid|PHPSESSID|ktv_client_id)=([a-zA-Z0-9_-]+)', cookie)
            if m:
                self._has_be_cookie = True
                self._current_be_sid = m.group(1)
                return m.group(1)
        ref = self.headers.get("Referer", "")
        if ref and "_ktv=" in ref:
            try:
                q = parse_qs(urlparse(ref).query)
                if "_ktv" in q and q["_ktv"][0]:
                    sid = q["_ktv"][0].strip()
                    self._has_be_cookie = True
                    self._current_be_sid = sid
                    return sid
            except Exception:
                pass
        addr = getattr(self, "client_address", None)
        ip = str(addr[0]) if addr else "127.0.0.1"
        self._has_be_cookie = False
        self._current_be_sid = f"{ip}_{os.urandom(6).hex()}"
        return self._current_be_sid

    def _get_or_create_user_sim(self):
        client_id = self._client_session_info()
        now = time.time()
        with _SIM_LOCK:
            expired = [cid for cid, s in _USER_SIMS.items() if now - s.get("last_active", now) > 14400]
            for cid in expired:
                _USER_SIMS.pop(cid, None)

            if client_id not in _USER_SIMS:
                safe_id = "".join(c for c in client_id if c.isalnum() or c in ("-", "_"))[:32] or "default"
                user_state_file = os.path.join(THU_MUC, "state", f"user-{safe_id}.json")
                store = ConfigStore(user_state_file, FACTORY)
                session = Session("admin", "admin")
                disp = Dispatcher(THU_MUC, store, session, _CGI_MAP_OBJ)
                _USER_SIMS[client_id] = {
                    "store": store,
                    "session": session,
                    "disp": disp,
                    "chi_tiet": False,
                    "last_active": now,
                    "state_file": user_state_file
                }
            sim = _USER_SIMS[client_id]
            sim["last_active"] = now
            return sim

    @property
    def _sim(self):
        server_sim = getattr(self.server, 'sim', None)
        if server_sim:
            return server_sim
        return self._get_or_create_user_sim()

    # ---------- GET ----------

    def do_GET(self):
        sim = self._sim
        duong_dan = urlparse(self.path).path
        ts = self._tham_so_url()
        loai, tag = ts.get("_type"), ts.get("_tag")

        if duong_dan in ("/api/reset", "/reset_lab") or ts.get("reset") == "1":
            sim["store"].khoi_phuc_xuat_xuong()
            if "session" in sim and sim["session"]:
                sim["session"].da_dang_nhap = False
                sim["session"].view_hien_tai = None
                sim["session"].sess_token = _chuoi_ngau_nhien(DAI_SESS_TOKEN)
            return self._gui(json.dumps({"status": "ok", "message": "Reset to factory"}), "application/json; charset=utf-8")

        if loai == "loginData":
            return self._login_get(tag)
        if loai == "hiddenData":
            return self._hidden(tag)

        if loai in ("menuView", "menuData") and not sim["session"].con_han():
            if loai == "menuData":
                return self._gui(sim["store"].xml_cho(tag or "", ma_loi="SessionTimeout"),
                                 "text/xml; charset=utf-8")
            return self._gui(sim["disp"]._trang_404(), "text/html; charset=utf-8", 404)

        if loai == "menuView":
            sim["session"].cham()
            noi_dung, kieu, ma = sim["disp"].menu_view(tag, sim["session"].sess_token)
            return self._gui(noi_dung, kieu, ma)

        if loai == "menuData":
            sim["session"].cham()
            if tag == "topo_lua.lua":
                try:
                    import mesh_zte_engine
                    mesh_zte_engine._sync_to_be12000()
                except Exception:
                    pass
            noi_dung, kieu, ma = sim["disp"].menu_data_doc(tag, ts)
            return self._gui(noi_dung, kieu, ma)

        # trang khung: chua dang nhap -> trang dang nhap, da dang nhap -> trang chinh
        if duong_dan in ("/", "/index.html", "/login", "/login-page.html"):
            if ts.get("logout") == "1":
                sim["session"].da_dang_nhap = False

            da_vao = sim["session"].con_han()
            if da_vao and duong_dan not in ("/login", "/login-page.html"):
                # '/' CHINH LA trang chu. Bang chung login-day-du.har: ngay sau khi
                # tai '/', client goi menuData firewall_homepage / wlan_homepage
                # MA KHONG co menuView nao truoc do.
                # Neu khong dat ngu canh o day, hai request do bi tra SessionTimeout
                # -> client reload -> vong lap vo han (loi da mac 2026-08-03).
                sim["session"].view_hien_tai = "homePage"
                sim["session"].cham()
                # BAT BUOC render _sessionTmpToken song vao index.html, khong
                # duoc tra file tinh — xem ghi chu trong dispatch.trang_chu().
                du_lieu, kieu = sim["disp"].trang_chu(sim["session"].sess_token)
                ten = "index.html"
            else:
                du_lieu, kieu = sim["disp"].tai_nguyen("login-page.html")
                ten = "login-page.html"
            if du_lieu is None:
                return self._gui("Thieu " + ten, "text/plain", 500)
            return self._gui(du_lieu, "text/html; charset=utf-8")

        du_lieu, kieu = sim["disp"].tai_nguyen(duong_dan)
        if du_lieu is None:
            return self._gui(sim["disp"]._trang_404(), "text/html; charset=utf-8", 404)
        return self._gui(du_lieu, kieu)

    # ---------- POST ----------

    def do_POST(self):
        sim = self._sim
        duong_dan = urlparse(self.path).path
        ts = self._tham_so_url()
        if duong_dan in ("/api/reset", "/reset_lab") or ts.get("reset") == "1":
            sim["store"].khoi_phuc_xuat_xuong()
            if "session" in sim and sim["session"]:
                sim["session"].da_dang_nhap = False
                sim["session"].view_hien_tai = None
                sim["session"].sess_token = _chuoi_ngau_nhien(DAI_SESS_TOKEN)
            return self._gui(json.dumps({"status": "ok", "message": "Reset to factory"}), "application/json; charset=utf-8")
        loai, tag = ts.get("_type"), ts.get("_tag")
        than = self._than_post()

        if loai == "loginData":
            return self._login_post(tag, than)
        if loai == "hiddenData":
            return self._hidden(tag, than)

        if loai == "menuData":
            if not sim["session"].con_han():
                return self._gui(sim["store"].xml_cho(tag or "", ma_loi="SessionTimeout"),
                                 "text/xml; charset=utf-8")
            noi_dung, kieu, ma, ghi_chu = sim["disp"].menu_data_ghi(tag, than)
            if than:
                ssid = than.get("ESSID") or than.get("SSID")
                key = than.get("HiddenKeyPass") or than.get("KeyPass") or than.get("WPAKey")
                if ssid or key:
                    try:
                        import mesh_zte_engine
                        mesh_zte_engine.update_ont_wifi(ssid, key)
                    except Exception:
                        pass
            if sim["chi_tiet"]:
                print("  [GHI] %-32s %s" % (tag, ghi_chu))
            return self._gui(noi_dung, kieu, ma)

        return self._gui(sim["disp"]._trang_404(), "text/html; charset=utf-8", 404)

    # ---------- loginData ----------

    def _login_get(self, tag):
        s = self._sim["session"]
        if tag == "login_entry":
            return self._gui(s.json_login_entry(), "application/json; charset=utf-8")
        if tag == "login_token":
            return self._gui(s.xml_login_token(), "text/xml; charset=utf-8")
        return self._gui(self._sim["disp"]._trang_404(), "text/html; charset=utf-8", 404)

    def _login_post(self, tag, than):
        s = self._sim["session"]
        if tag == "login_entry":
            js, ok = s.dang_nhap(than.get("Username", ""),
                                 than.get("Password", ""),
                                 than.get("_sessionTOKEN"))
            if self._sim["chi_tiet"]:
                print("  [DANG NHAP] %s -> %s" % (than.get("Username"), "OK" if ok else "TU CHOI"))
            return self._gui(js, "application/json; charset=utf-8")
        if tag == "logout_entry":
            return self._gui(s.dang_xuat(), "application/json; charset=utf-8")
        if tag == "modeswitch_entry":
            return self._gui('{"need_refresh":1}', "application/json; charset=utf-8")
        return self._gui(self._sim["disp"]._trang_404(), "text/html; charset=utf-8", 404)

    # ---------- hiddenData ----------

    def _hidden(self, tag, than=None):
        """hiddenData: switchlang_entry va sntp_data (trang chu poll lien tuc).

        CANH BAO — day la cho da gay loi vong lap reload vo han:
        index.html vi tri 118020 co doan
            else if ( ErrorString == "SessionTimeout" ) { top.location.href = top.location.href; }
        Nghia la HE MOT response nao tra SessionTimeout thi client RELOAD CA TRANG.
        Trang chu poll sntp_data lien tuc -> tra SessionTimeout o day = reload vo han.
        Vi vay tuyet doi KHONG duoc tra SessionTimeout cho tag khong ton tai;
        tra 404 giong thiet bi that (da xac minh voi wan_internet_lua.lua).
        """
        sim = self._sim
        if tag == "switchlang_entry":
            return self._gui('{"need_refresh":1}', "application/json; charset=utf-8")
        if sim["store"].co_data_tag(tag or ""):
            return self._gui(sim["store"].xml_cho(tag), "text/xml; charset=utf-8")
        return self._gui(sim["disp"]._trang_404(), "text/html; charset=utf-8", 404)

    def log_message(self, *a):
        if self._sim["chi_tiet"]:
            super().log_message(*a)


def main():
    p = argparse.ArgumentParser(description="Gia lap BE12000 (ZTE F8728D)")
    p.add_argument("--port", type=int, default=MAC_DINH_CONG)
    p.add_argument("--state", default=os.path.join(THU_MUC, "state", "instance-01.json"),
                   help="File trang thai rieng cua thuc the nay")
    p.add_argument("--user", default="admin")
    p.add_argument("--password", default="admin",
                   help="CHUA CO BANG CHUNG mat khau that; dat qua tham so nay")
    p.add_argument("--reset", action="store_true", help="Khoi phuc cau hinh xuat xuong")
    p.add_argument("--quiet", action="store_true")
    args = p.parse_args()

    store = ConfigStore(args.state, FACTORY)
    if args.reset:
        store.khoi_phuc_xuat_xuong()
        print("Da khoi phuc cau hinh xuat xuong:", args.state)

    session = Session(args.user, args.password)
    disp = Dispatcher(THU_MUC, store, session, nap_ban_do_ngu_canh(CGI_MAP))

    srv = ThreadingHTTPServer(("0.0.0.0", args.port), Handler)
    srv.daemon_threads = True
    srv.sim = {"store": store, "session": session, "disp": disp,
               "chi_tiet": not args.quiet}

    print("=" * 62)
    print("  Gia lap BE12000 - ZTE F8728D V3.0.12P2N2")
    print("  Mo trinh duyet : http://localhost:%d/" % args.port)
    print("  File trang thai: %s" % args.state)
    print("  So trang       : %d" % len(os.listdir(os.path.join(THU_MUC, "views"))))
    print("  Tai khoan      : %s" % args.user)
    print("  Ctrl+C de dung")
    print("=" * 62)
    try:
        srv.serve_forever()
    except KeyboardInterrupt:
        print("\nDa dung.")


if __name__ == "__main__":
    main()
