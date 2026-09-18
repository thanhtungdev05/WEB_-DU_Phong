#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""May chu gia lap AX3000CV2 (OpenWrt/OUI Vue SPA).
- Phuc vu /www tinh (oui.html la trang chu).
- Mock /ubus (JSON-RPC) de SPA chay: dang nhap + tra du lieu tu cau hinh mac dinh.
Chay: python server.py [port]   (mac dinh 8090)
"""
import os, sys, json, socket
from http.server import SimpleHTTPRequestHandler, ThreadingHTTPServer
from urllib.parse import urlparse, parse_qs, unquote

PORT = int(sys.argv[1]) if len(sys.argv) > 1 else 8090
ROOT = os.path.join(os.path.dirname(os.path.abspath(__file__)), "www")

import threading, time

# Quan ly phien dang nhap theo mo hinh Multi-Session
_SESSION_LOCK = threading.Lock()
SID = os.urandom(16).hex()
ACTIVE_SESSIONS = {SID: {"user": "admin", "last_active": time.time(), "state": {}}}

def reset_sid(target_sid=None):
    """Xoa phien chi dinh hoac don dep phien cu qua han, khong lam anh huong cac KTV khac."""
    global SID
    with _SESSION_LOCK:
        if target_sid and target_sid in ACTIVE_SESSIONS:
            ACTIVE_SESSIONS.pop(target_sid, None)
        elif not target_sid:
            now = time.time()
            expired = [s for s, v in ACTIVE_SESSIONS.items() if now - v.get("last_active", now) > 7200]
            for s in expired:
                ACTIVE_SESSIONS.pop(s, None)
            if not ACTIVE_SESSIONS:
                SID = os.urandom(16).hex()
                ACTIVE_SESSIONS[SID] = {"user": "admin", "last_active": now, "state": {}}

# Muc 1: trang thai cau hinh nguoi dung (ho tro per-session namespace trong RAM)
STATE_FILE = os.path.join(os.path.dirname(os.path.abspath(__file__)), "sim_state.json")
USER_STATES = {}

def load_state(key=None):
    if key and key in USER_STATES:
        return USER_STATES[key]
    try:
        with open(STATE_FILE, "r", encoding="utf-8") as f:
            return json.load(f)
    except Exception:
        return {}

def save_state(st, key=None):
    if key:
        USER_STATES[key] = st
        return
    try:
        with open(STATE_FILE, "w", encoding="utf-8") as f:
            json.dump(st, f, indent=1)
    except Exception:
        pass

# ghi lai request /ubus de phan tich (debug)
UBUS_LOG = []


def ubus_result(rid, code, data=None):
    r = [code] if data is None else [code, data]
    return {"jsonrpc": "2.0", "id": rid, "result": r}


MOCK_FILE = os.path.join(os.path.dirname(os.path.abspath(__file__)), "ubus_mock.json")
CONFIG_DIR = os.path.join(os.path.dirname(os.path.abspath(__file__)), "etc_config")


def parse_uci(text):
    """Parse 1 file /etc/config -> {section_id: {".type","".name",opt:val,list:[...]}}"""
    values = {}
    cur = None
    anon = 0
    for raw in text.splitlines():
        line = raw.strip()
        if not line or line.startswith("#"):
            continue
        if line.startswith("config"):
            parts = line.split(None, 2)
            stype = parts[1] if len(parts) > 1 else ""
            sname = parts[2].strip().strip("'\"") if len(parts) > 2 else ""
            if sname:
                sid = sname
            else:
                anon += 1
                sid = "cfg%02d" % anon
            cur = {".type": stype, ".name": sid}
            if sname:
                cur[".anonymous"] = False
            values[sid] = cur
        elif line.startswith("option") and cur is not None:
            p = line.split(None, 2)
            if len(p) >= 3:
                cur[p[1]] = p[2].strip().strip("'\"")
            elif len(p) == 2:
                cur[p[1]] = ""
        elif line.startswith("list") and cur is not None:
            p = line.split(None, 2)
            if len(p) >= 3:
                cur.setdefault(p[1], []).append(p[2].strip().strip("'\""))
    return values


def uci_get(args):
    cfg = args.get("config")
    if not cfg:
        return None
    fp = os.path.join(CONFIG_DIR, cfg)
    if not os.path.isfile(fp):
        return {"values": {}}
    try:
        values = parse_uci(open(fp, encoding="utf-8", errors="replace").read())
    except Exception:
        return {"values": {}}
    sec = args.get("section")
    opt = args.get("option")
    if sec and opt:
        return {"value": values.get(sec, {}).get(opt, "")}
    if sec:
        return {"values": values.get(sec, {})}
    return {"values": values}

def ubus_data(obj, fn, args):
    """Doc du lieu mock tu ubus_mock.json (TUOI moi request) theo khoa 'obj/method'.
    Nho vay chi can sua JSON, khong phai khoi dong lai server."""
    try:
        m = json.load(open(MOCK_FILE, encoding="utf-8"))
    except Exception:
        return None
    return m.get(obj + "/" + fn, m.get(obj + "." + fn))


def _devstat(name, up=False, speed="", carrier=False):
    return {"up": up, "carrier": carrier, "speed": speed, "mtu": 1500,
            "macaddr": "AA:BB:CC:DD:EE:FF", "type": "ethernet",
            "statistics": {"tx_bytes": 0, "rx_bytes": 0, "tx_packets": 0,
                           "rx_packets": 0, "tx_errors": 0, "rx_errors": 0}}

def smart_ubus(obj, fn, args):
    """Mock CO DIEU KIEN theo tham so + shape chuan OpenWrt/OUI. None neu khong xu ly."""
    args = args or {}
    # network.device status: khong ten -> dict tat ca thiet bi; co ten -> stats phang
    if obj == "network.device" and fn == "status":
        if args.get("name"):
            n = args["name"]
            return _devstat(n, up=(n in ("br-lan", "eth1", "lan1")))
        return {
            "lo": _devstat("lo", up=True),
            "eth0": _devstat("eth0", up=False),
            "eth1": _devstat("eth1", up=True, speed="1000F", carrier=True),
            "br-lan": _devstat("br-lan", up=True, speed="1000F", carrier=True),
            "wl2g": _devstat("wl2g", up=True), "wl5g": _devstat("wl5g", up=True),
            "pppoe-wan": _devstat("pppoe-wan", up=False),
        }
    # iwinfo (radio wifi)
    if obj == "iwinfo" and fn == "devices":
        return {"devices": ["wl2g", "wl5g"]}
    if obj == "iwinfo" and fn == "info":
        dev = args.get("device", "wl2g")
        is5 = "5" in dev
        return {"phy": dev, "ssid": "FPT_AX3000CV2" + ("_5G" if is5 else ""),
                "bssid": "AA:BB:CC:DD:EE:F0", "mode": "Master",
                "channel": 36 if is5 else 6, "frequency": 5180 if is5 else 2437,
                "txpower": 20, "quality": 70, "quality_max": 70,
                "signal": -40, "noise": -95, "bitrate": 1200000 if is5 else 300000,
                "encryption": {"enabled": True, "wpa": [2], "authentication": ["psk"],
                               "ciphers": ["ccmp"]},
                "hwmodes": ["a", "n", "ac", "ax"] if is5 else ["b", "g", "n", "ax"],
                "hardware": {"name": "Qualcomm"}}
    if obj == "iwinfo" and fn == "assoclist":
        return {"results": []}
    if obj == "iwinfo" and fn in ("scan", "countrylist", "freqlist", "txpowerlist"):
        return {"results": []}
    # uci state (giong get)
    if obj == "uci" and fn in ("state",):
        return uci_get(args)
    return None


def handle_ubus(req):
    rid = req.get("id", 0)
    method = req.get("method")
    params = req.get("params", [])
    if method == "call" and len(params) >= 3:
        sid, obj, fn = params[0], params[1], params[2]
        args = params[3] if len(params) > 3 else {}
        # dang nhap
        if obj == "session" and fn == "login":
            user = (args.get("username") or "").strip()
            pw = (args.get("password") or "").strip()
            # user HOAC pass rong -> tu choi (giong thiet bi that) -> SPA hien form login
            if not user or not pw:
                return ubus_result(rid, 6)   # PERMISSION_DENIED
            user_sid = os.urandom(16).hex()
            with _SESSION_LOCK:
                now = time.time()
                # don dep cac session khong hoat dong > 4 gio
                for s in [k for k, v in ACTIVE_SESSIONS.items() if now - v.get("last_active", now) > 14400]:
                    ACTIVE_SESSIONS.pop(s, None)
                ACTIVE_SESSIONS[user_sid] = {"user": user, "last_active": now, "state": {}}
            return ubus_result(rid, 0, {
                "ubus_rpc_session": user_sid,
                "timeout": 3600, "expires": 3600,
                "acls": {"access-group": {"unauthenticated": ["read"]}, "ubus": {"*": ["*"]}},
                "data": {"username": user},
            })
        # dang xuat: huy phien -> tra ok, client se ve trang login
        if obj == "session" and fn in ("destroy", "logout"):
            with _SESSION_LOCK:
                ACTIVE_SESSIONS.pop(sid, None)
            return ubus_result(rid, 0, {})
        # chi chap nhan khi dung SID hop le trong ACTIVE_SESSIONS
        if obj == "session" and fn == "access":
            with _SESSION_LOCK:
                is_valid = sid in ACTIVE_SESSIONS
                if is_valid:
                    ACTIVE_SESSIONS[sid]["last_active"] = time.time()
            return ubus_result(rid, 0, {"access": is_valid})
        if obj == "session" and fn == "get":
            with _SESSION_LOCK:
                sdata = ACTIVE_SESSIONS.get(sid)
                if sdata:
                    sdata["last_active"] = time.time()
            if sdata:
                return ubus_result(rid, 0, {"username": sdata.get("user", "admin"), "access": True,
                                            "ubus_rpc_session": sid})
            return ubus_result(rid, 6)   # PERMISSION_DENIED -> chua dang nhap
        # doc cau hinh get
        if obj == "session" and fn == "wizardstate_get":
            return ubus_result(rid, 0, {"state": "done", "step": 0})
        if obj == "system" and fn == "board":
            DATA = ubus_data("system", "board", args)
            if DATA is not None:
                return ubus_result(rid, 0, DATA)
            return ubus_result(rid, 0, {"model_name": "AP-AX3000CV2", "release": {"revision": "AP-AX3000C-0.10.2"}})

        # KIEM TRA SID CHO CAC CALL DU LIEU:
        # Neu SID khong hop le trong ACTIVE_SESSIONS -> tu choi call du lieu.
        with _SESSION_LOCK:
            is_valid = sid in ACTIVE_SESSIONS
            if is_valid:
                ACTIVE_SESSIONS[sid]["last_active"] = time.time()
        if not is_valid:
            return ubus_result(rid, 6)   # UBUS_STATUS_PERMISSION_DENIED

        # -- Cac goi du lieu duoi day CHI DUOC THUC HIEN KHI KHOP SID --
        # doc cau hinh that tu /etc/config
        if obj == "uci" and fn == "get":
            u = uci_get(args)
            if u is not None:
                return ubus_result(rid, 0, u)
        # du lieu wizard (dung cau hinh mac dinh that cua firmware)
        if obj == "data_repo.weboui" and fn == "wizard_get_v2":
            return ubus_result(rid, 0, {
                "wan": {"proto": "pppoe", "username": "fpt", "password": "fpt",
                        "ipaddr": "", "netmask": "", "gateway": "", "dns": ""},
                "lan": {"ipaddr": "192.168.100.1", "start": "2", "limit": "248"},
                "wireless": {"host": "", "specific": ""},
            })
        # mock co dieu kien theo tham so (network.device, iwinfo...)
        SM = smart_ubus(obj, fn, args)
        if SM is not None:
            return ubus_result(rid, 0, SM)
        # cac object du lieu chinh (dashboard/status) tu ubus_mock.json
        DATA = ubus_data(obj, fn, args)
        if DATA is not None:
            return ubus_result(rid, 0, DATA)

        return ubus_result(rid, 0, {})
    return ubus_result(rid, 0)


class Handler(SimpleHTTPRequestHandler):
    def __init__(self, *a, **k):
        super().__init__(*a, directory=ROOT, **k)

    def end_headers(self):
        self.send_header("Cache-Control", "no-store")
        super().end_headers()

    # ---- Muc 1: luu trang thai cau hinh that ra sim_state.json ----
    def _state_page(self):
        q = parse_qs(urlparse(self.path).query)
        return (q.get("page", [""])[0] or "").strip()

    def _send_json(self, obj, code=200):
        resp = json.dumps(obj).encode()
        self.send_response(code)
        self.send_header("Content-Type", "application/json")
        self.send_header("Content-Length", str(len(resp)))
        self.end_headers()
        self.wfile.write(resp)

    def _client_session_key(self):
        cookie = self.headers.get("Cookie", "")
        if cookie:
            import re
            m = re.search(r'(?:ftc_session|ax3000c_sid|PHPSESSID|ktv_client_id)=([a-zA-Z0-9_-]+)', cookie)
            if m:
                return m.group(1)
        addr = getattr(self, "client_address", None)
        return str(addr[0]) if addr else "default"

    def do_DELETE(self):
        if self.path.split("?")[0].rstrip("/") == "/sim-state":
            key = self._client_session_key()
            st = load_state(key); st.pop(self._state_page(), None); save_state(st, key)
            return self._send_json({"ok": True})
        self.send_error(404)

    def do_POST(self):
        path_clean = self.path.split("?")[0].rstrip("/")
        if path_clean in ("/sim-reset-session", "/api/reset", "/resetsession"):
            key = self._client_session_key()
            with _SESSION_LOCK:
                USER_STATES.pop(key, None)
            reset_sid()
            return self._send_json({"status": "ok", "message": "AX3000C state reset"})
        if self.path.split("?")[0].rstrip("/") == "/sim-state":
            ln = int(self.headers.get("Content-Length", 0))
            try:
                data = json.loads(self.rfile.read(ln) if ln else b"{}")
            except Exception:
                data = {}
            key = self._client_session_key()
            st = load_state(key); st[self._state_page()] = data; save_state(st, key)
            return self._send_json({"ok": True})
        if self.path.rstrip("/") == "/ubus":
            ln = int(self.headers.get("Content-Length", 0))
            body = self.rfile.read(ln) if ln else b""
            try:
                req = json.loads(body or b"{}")
            except Exception:
                req = {}
            items = req if isinstance(req, list) else [req]
            for x in items:
                pr = x.get("params", [])
                if len(pr) >= 3:
                    UBUS_LOG.append({"obj": pr[1], "method": pr[2], "args": pr[3] if len(pr) > 3 else None})
            out = [handle_ubus(x) for x in items]
            resp = json.dumps(out if isinstance(req, list) else out[0]).encode()
            self.send_response(200)
            self.send_header("Content-Type", "application/json")
            self.send_header("Content-Length", str(len(resp)))
            self.end_headers()
            self.wfile.write(resp)
            return
        self.send_error(404)

    def do_GET(self):
        if self.path.split("?")[0].rstrip("/") == "/sim-state":
            key = self._client_session_key()
            return self._send_json(load_state(key).get(self._state_page(), {}))
        # endpoint debug: liet ke cac call /ubus da nhan
        if self.path.rstrip("/") == "/__ubuslog":
            resp = json.dumps(UBUS_LOG, indent=1).encode()
            self.send_response(200)
            self.send_header("Content-Type", "application/json")
            self.send_header("Content-Length", str(len(resp)))
            self.end_headers()
            self.wfile.write(resp)
            return
        # reset session / API reset -> xoa sach state
        path_clean = self.path.split("?")[0].rstrip("/")
        if path_clean in ("/sim-reset-session", "/api/reset", "/resetsession"):
            key = self._client_session_key()
            with _SESSION_LOCK:
                USER_STATES.pop(key, None)
            reset_sid()
            return self._send_json({"status": "ok", "message": "AX3000C state reset"})
        # trang chu -> oui.html (SPA shell)
        if path_clean in ("", "/", "/index.html"):
            q = "?" + self.path.split("?", 1)[1] if "?" in self.path else ""
            self.path = "/oui.html" + q
        return super().do_GET()

    def log_message(self, *a):
        pass


class DualStack(ThreadingHTTPServer):
    address_family = socket.AF_INET6
    daemon_threads = True
    def server_bind(self):
        try: self.socket.setsockopt(socket.IPPROTO_IPV6, socket.IPV6_V6ONLY, 0)
        except Exception: pass
        super().server_bind()


if __name__ == "__main__":
    os.chdir(ROOT)
    try:
        httpd = DualStack(("::", PORT), Handler)
    except OSError:
        httpd = ThreadingHTTPServer(("0.0.0.0", PORT), Handler); httpd.daemon_threads = True
    print("AX3000CV2 sim: http://localhost:%d/" % PORT)
    try: httpd.serve_forever()
    except KeyboardInterrupt: print("\nstopped")
