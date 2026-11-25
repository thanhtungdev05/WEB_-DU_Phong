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


def _cap_nhat_store_topo(store, slave_list, client_list, lan_dhcp_cfg=None):
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

    # Đồng bộ cấu hình LAN / DHCP Server giữa các phiên BE12000Z
    if isinstance(lan_dhcp_cfg, dict) and lan_dhcp_cfg:
        try:
            store.ghi("OBJ_Br0AndDhcpsHosCfg_ID", lan_dhcp_cfg, inst=0)
        except Exception:
            pass

    # Đồng bộ bảng Allocated Address (DHCP) theo thiết bị kết nối thực tế
    objs = store._state.setdefault("objects", {})
    dhcp_host_obj = objs.setdefault("OBJ_DHCPHOSTINFO_ID", {
        "instances": [],
        "paraOrder": ["_InstID", "HostName", "MACAddr", "IPAddr", "PhyPortName", "ExpiredTime"],
        "nguon": ["Localnet_LanMgrIpv4_DHCPHostInfo_lua.lua"]
    })
    dhcp_host_obj["paraOrder"] = ["_InstID", "HostName", "MACAddr", "IPAddr", "PhyPortName", "ExpiredTime"]
    dt = store._state.setdefault("dataTags", {}).get("Localnet_LanMgrIpv4_DHCPHostInfo_lua.lua")
    if isinstance(dt, dict):
        dt.setdefault("paraOrder", {})["OBJ_DHCPHOSTINFO_ID"] = [
            "_InstID", "HostName", "MACAddr", "IPAddr", "PhyPortName", "ExpiredTime"
        ]

    dhcp_instances = []
    for idx, sl in enumerate(slave_list or [], 1):
        dhcp_instances.append({
            "_InstID": f"IGD.DHCPHOST{idx}",
            "HostName": sl.get("DeviceName", "BE15000Z"),
            "MACAddr": sl.get("MacAddr", "aa:bb:cc:00:00:15"),
            "IPAddr": sl.get("IpAddr", "192.168.1.100"),
            "PhyPortName": "LAN1" if sl.get("AccessType") == "ETH" else "WLAN (Mesh)",
            "ExpiredTime": "23h 58m 40s"
        })
    for idx, cl in enumerate(client_list or [], len(dhcp_instances) + 1):
        dhcp_instances.append({
            "_InstID": f"IGD.DHCPHOST{idx}",
            "HostName": cl.get("HostName", "Smartphone_Client_KTV"),
            "MACAddr": cl.get("MacAddr", "34:e1:2d:88:99:aa"),
            "IPAddr": cl.get("IpAddr", "192.168.1.150"),
            "PhyPortName": "SSID1",
            "ExpiredTime": "23h 55m 12s"
        })
    dhcp_host_obj["instances"] = dhcp_instances


def cap_nhat_topology_mesh(slave_list=None, client_list=None, lan_dhcp_cfg=None, session_id=None):
    with _SIM_LOCK:
        if session_id is not None:
            if session_id == "default" and "store" in GLOBAL_SIM:
                _cap_nhat_store_topo(GLOBAL_SIM["store"], slave_list, client_list, lan_dhcp_cfg=lan_dhcp_cfg)
            elif session_id in _USER_SIMS:
                s = _USER_SIMS[session_id]
                if isinstance(s, dict) and "store" in s:
                    _cap_nhat_store_topo(s["store"], slave_list, client_list, lan_dhcp_cfg=lan_dhcp_cfg)
            return
        if "store" in GLOBAL_SIM:
            _cap_nhat_store_topo(GLOBAL_SIM["store"], slave_list, client_list, lan_dhcp_cfg=lan_dhcp_cfg)
        for skey, s in _USER_SIMS.items():
            # Never overwrite per-node /mesh-node/ sessions (__mn_) during global legacy broadcast
            if "__mn_" in str(skey):
                continue
            if isinstance(s, dict) and "store" in s:
                _cap_nhat_store_topo(s["store"], slave_list, client_list, lan_dhcp_cfg=lan_dhcp_cfg)


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
        forwarded = self.headers.get("X-Forwarded-For", "")
        if forwarded:
            ip = forwarded.split(",")[0].strip()
        else:
            real_ip = self.headers.get("X-Real-IP", "")
            if real_ip:
                ip = real_ip.strip()
            else:
                addr = getattr(self, "client_address", None)
                ip = str(addr[0]) if addr else "127.0.0.1"
        self._has_be_cookie = False
        safe_ip = ip.replace(":", "_").replace(".", "_")
        self._current_be_sid = f"be_{safe_ip}"
        return self._current_be_sid

    def _get_or_create_user_sim(self):
        client_id = self._client_session_info()
        now = time.time()
        with _SIM_LOCK:
            expired = [cid for cid, s in _USER_SIMS.items() if now - s.get("last_active", now) > 14400]
            for cid in expired:
                _USER_SIMS.pop(cid, None)

            if client_id not in _USER_SIMS:
                import hashlib
                raw_safe = "".join(c for c in client_id if c.isalnum() or c in ("-", "_")) or "default"
                if len(raw_safe) > 40:
                    safe_id = raw_safe[:22] + "_" + hashlib.sha1(client_id.encode("utf-8")).hexdigest()[:12]
                else:
                    safe_id = raw_safe
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
            # Tu dong duy tri phien phong lab de KTV khong bi vang 404 gay trang man hinh
            sim["session"].da_dang_nhap = True
            sim["session"].lan_hoat_dong_cuoi = time.time()

        if loai == "menuView":
            sim["session"].cham()
            noi_dung, kieu, ma = sim["disp"].menu_view(tag, sim["session"].sess_token)
            if tag == "lanMgrIpv4" and isinstance(noi_dung, str):
                live_sync_js = """
<script type="text/javascript">
(function(){
    var _syncTimer = null;
    function _readOctets(prefix, suffix) {
        var parts = [];
        for (var i = 0; i < 4; i++) {
            var el = document.getElementById(prefix + i + (suffix || ""));
            if (!el) return "";
            var v = (el.value || "").trim();
            if (!/^\\d{1,3}$/.test(v) || parseInt(v, 10) > 255) return "";
            parts.push(String(parseInt(v, 10)));
        }
        return parts.join(".");
    }
    function _pushLiveDhcpSync() {
        var lanIp = _readOctets("sub_IPAddr", ":DHCPBasicCfg");
        var subMask = _readOctets("sub_SubMask", "");
        var minIp = _readOctets("sub_MinAddress", ":DHCPBasicCfg");
        var maxIp = _readOctets("sub_MaxAddress", ":DHCPBasicCfg");
        var dns1 = _readOctets("sub_DNSServer1", "");
        var dns2 = _readOctets("sub_DNSServer2", "");
        if (!lanIp && !minIp && !maxIp && !dns1) return;
        var srvEnEl = document.getElementById("ServerEnable0");
        var srvEn = (srvEnEl && srvEnEl.checked) ? "0" : "1";
        var ispEl = document.getElementById("DnsServerSource1");
        var ispDns = (ispEl && ispEl.checked) ? "1" : "0";
        var leaseEl = document.getElementById("LeaseTimeSelfDefine") || document.getElementById("LeaseTime");
        var leaseVal = (leaseEl && leaseEl.value) ? leaseEl.value.trim() : "86400";
        var payload = {
            IPAddr: lanIp,
            SubMask: subMask,
            MinAddress: minIp,
            MaxAddress: maxIp,
            DNSServer1: dns1,
            DNSServer2: dns2,
            ServerEnable: srvEn,
            DnsServerSource: ispDns,
            LeaseTime: leaseVal,
            ts: Date.now()
        };
        try {
            localStorage.setItem("fpt_mesh_live_dhcp", JSON.stringify(payload));
            if (typeof BroadcastChannel !== "undefined") {
                var bc = new BroadcastChannel("fpt_mesh_live_sync");
                bc.postMessage({ type: "DHCP_SYNC", payload: payload });
                bc.close();
            }
        } catch (e) {}
        var formBody = Object.keys(payload).map(function(k){
            return encodeURIComponent(k) + "=" + encodeURIComponent(payload[k] || "");
        }).join("&");
        try {
            var xhr = new XMLHttpRequest();
            xhr.open("POST", "/?_type=hiddenData&_tag=mesh_auto_sync", true);
            xhr.setRequestHeader("Content-Type", "application/x-www-form-urlencoded; charset=UTF-8");
            xhr.send(formBody);
        } catch (e) {}
    }
    $(document).on("input change", "#DHCPBasicCfg input, #DHCPBasicCfg select", function(){
        if (_syncTimer) clearTimeout(_syncTimer);
        _syncTimer = setTimeout(_pushLiveDhcpSync, 180);
    });
    $(document).on("click", "#Btn_apply_DHCPBasicCfg", function(){
        setTimeout(_pushLiveDhcpSync, 50);
    });
})();
</script>
"""
                noi_dung = noi_dung + live_sync_js
            return self._gui(noi_dung, kieu, ma)

        if loai == "menuData":
            sim["session"].cham()
            if tag in ("topo_lua.lua", "Localnet_LanMgrIpv4_DHCPHostInfo_lua.lua", "Localnet_LanMgrIpv4_DHCPBasicCfg_lua.lua"):
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
            elif ts.get("autologin") == "1" or ts.get("mesh_lab") == "1":
                sim["session"].da_dang_nhap = True
                sim["session"].lan_hoat_dong_cuoi = time.time()

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
                view_target = ts.get("view")
                if view_target and du_lieu:
                    try:
                        html_str = du_lieu.decode("utf-8")
                        auto_script = f"""
                        <script type="text/javascript">
                        $(document).ready(function() {{
                            setTimeout(function() {{
                                if (typeof openLink === 'function') {{
                                    openLink("{view_target}");
                                }}
                            }}, 300);
                        }});
                        </script>
                        """
                        if "</body>" in html_str:
                            html_str = html_str.replace("</body>", auto_script + "</body>")
                            du_lieu = html_str.encode("utf-8")
                    except Exception:
                        pass
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
                cid = self._client_session_info()
                mesh_sid = cid if "__mn_" in str(cid or "") else None
                if ssid or key:
                    try:
                        import mesh_zte_engine
                        mesh_zte_engine.update_ont_wifi(ssid, key, session_id=mesh_sid)
                    except Exception:
                        pass
                if (
                    "dhcpbasiccfg" in (tag or "").lower()
                    or any(k in than for k in ("IPAddr", "SubMask", "SubnetMask", "MinAddress", "MaxAddress", "DNSServer1", "sub_IPAddr0:DHCPBasicCfg"))
                ):
                    try:
                        import mesh_zte_engine
                        mesh_zte_engine.update_ont_lan_dhcp(than, session_id=mesh_sid)
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
        if tag == "mesh_auto_sync":
            if than:
                try:
                    import mesh_zte_engine
                    cid = self._client_session_info()
                    mesh_sid = cid if "__mn_" in str(cid or "") else None
                    if any(k in than for k in ("IPAddr", "SubMask", "SubnetMask", "MinAddress", "MaxAddress", "DNSServer1", "DNSServer2", "ServerEnable", "DnsServerSource", "LeaseTime")):
                        mesh_zte_engine.update_ont_lan_dhcp(than, session_id=mesh_sid)
                    ssid = than.get("ESSID") or than.get("SSID")
                    key = than.get("HiddenKeyPass") or than.get("KeyPass") or than.get("WPAKey")
                    if ssid or key:
                        mesh_zte_engine.update_ont_wifi(ssid, key, session_id=mesh_sid)
                except Exception:
                    pass
            return self._gui('{"status":"ok"}', "application/json; charset=utf-8")
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
