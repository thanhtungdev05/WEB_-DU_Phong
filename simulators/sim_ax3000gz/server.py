#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
Gia lap giao dien web AX3000GZV3 (ZTE F6201B - LuCI).
Phuc vu dung duong dan /cgi-bin/luci/... + co lap state Python theo phien KTV / node Mesh Lab.

Chay: python server.py [port]   (mac dinh 8094)
"""
import copy
import json
import os
import re
import sys
import threading
import time
from http.server import BaseHTTPRequestHandler, ThreadingHTTPServer
from urllib.parse import parse_qs, unquote, urlparse

PORT = int(sys.argv[1]) if len(sys.argv) > 1 else 8094
BASE = os.path.dirname(os.path.abspath(__file__))
WWW = os.path.join(BASE, "www")
PAGES = os.path.join(WWW, "pages")
TRANG_CHU = "/cgi-bin/luci/admin/home"

_STATE_LOCK = threading.RLock()
_USER_STATES = {}
_USER_LAST_SEEN = {}
_TTL_SECONDS = 14400

DEFAULT_STATE = {
    "lan": {
        "ipaddr": "192.168.1.1",
        "netmask": "255.255.255.0",
        "start": "192.168.1.2",
        "end": "192.168.1.254",
        "leasetime": "86400",
        "Primary_DNS": "192.168.1.1",
        "Secondary_DNS": "0.0.0.0",
        "ignore": "0",
    },
    "wlan24": {
        "Enable": "1",
        "SSID": "FPT-Telecom-A34C",
        "KeyPassphrase": "DA6BBED8",
        "encryption": "WPA/WPA2-PSK-AES",
        "Channel": "Auto",
        "BandWidth": "20MHz",
    },
    "wlan5": {
        "Enable": "1",
        "SSID": "FPT-Telecom-A34C",
        "KeyPassphrase": "DA6BBED8",
        "encryption": "WPA/WPA2-PSK-AES",
        "Channel": "Auto",
        "BandWidth": "160MHz",
    },
    "wan": {
        "ipaddr": "113.161.75.42",
        "netmask": "255.255.255.0",
        "gateway": "113.161.75.1",
        "dns1": "210.245.24.20",
        "dns2": "210.245.24.21",
        "proto": "dhcp",
    },
    "mesh": {
        "Enable": "1",
        "Mode": "Controller",
        "nodes": [],
    },
    "clients": [],
}

_GTT_BASE = None
try:
    with open(os.path.join(WWW, "luci-static", "gia-tri-that.json"), encoding="utf-8") as _fh:
        _GTT_BASE = json.load(_fh)
except Exception:
    _GTT_BASE = {}

try:
    with open(os.path.join(WWW, "firstchild.json"), encoding="utf-8") as fh:
        FIRSTCHILD = json.load(fh)
except Exception:
    FIRSTCHILD = {}

_GZ_IFRAME_SHIM = (
    '<style data-gz-responsive="1">'
    '@media(max-width:960px){'
    '#topmenu{width:100%!important;display:flex!important;flex-wrap:wrap!important}'
    '#topmenu>li{width:auto!important;margin-right:8px!important}'
    '.container,.main,table,form{max-width:100%!important;box-sizing:border-box!important}'
    'body{overflow-x:auto!important}'
    '}'
    '</style>'
    '<script data-gz-shim="1">'
    '(function(){if(window.__gzShim)return;window.__gzShim=1;'
    'var _mGz=location.pathname.match(/^(?:\\/mesh-node\\/[A-Za-z0-9_-]+)?\\/sim_ax3000gz/);'
    'var pfx=_mGz?_mGz[0]:"";'
    'if(!pfx)return;'
    'window.__gzUrl=function(u){if(typeof u==="string"&&u.indexOf("/")===0&&u.indexOf("//")!==0&&u.indexOf(pfx+"/")!==0&&u!==pfx)return pfx+u;return u;};'
    'document.addEventListener("click",function(ev){var a=ev.target&&ev.target.closest?ev.target.closest("a[href]"):null;'
    'if(!a)return;var h=a.getAttribute("href")||"";if(h.indexOf("/")===0&&h.indexOf("//")!==0&&h.indexOf(pfx+"/")!==0)a.setAttribute("href",pfx+h);},true);'
    'document.addEventListener("submit",function(ev){var f=ev.target;if(!f||!f.getAttribute)return;'
    'var act=f.getAttribute("action")||"";if(act.indexOf("/")===0&&act.indexOf(pfx+"/")!==0)f.setAttribute("action",pfx+act);},true);'
    '})();'
    '</script>'
)


def _gc_unlocked(now):
    expired = [k for k, ts in _USER_LAST_SEEN.items() if now - ts > _TTL_SECONDS]
    for k in expired:
        _USER_LAST_SEEN.pop(k, None)
        _USER_STATES.pop(k, None)


def get_client_state(key):
    k = (key or "").strip() or "default"
    now = time.time()
    with _STATE_LOCK:
        _gc_unlocked(now)
        _USER_LAST_SEEN[k] = now
        if k not in _USER_STATES:
            _USER_STATES[k] = copy.deepcopy(DEFAULT_STATE)
        return _USER_STATES[k]


def update_client_state(key, data):
    if not isinstance(data, dict):
        return copy.deepcopy(get_client_state(key))
    with _STATE_LOCK:
        st = get_client_state(key)
        for sec in ("lan", "wlan24", "wlan5", "wan", "mesh"):
            if isinstance(data.get(sec), dict):
                st[sec].update(data[sec])
        if isinstance(data.get("clients"), list):
            st["clients"] = copy.deepcopy(data["clients"])
        return copy.deepcopy(st)


def reset_client_state(key):
    k = (key or "").strip() or "default"
    with _STATE_LOCK:
        _USER_STATES.pop(k, None)
        _USER_LAST_SEEN.pop(k, None)


def _build_gtt_for_state(st):
    out = copy.deepcopy(_GTT_BASE) if isinstance(_GTT_BASE, dict) else {}
    wb = out.get("admin__localnetwork__WLAN__WLANbasic")
    if isinstance(wb, dict):
        globs = wb.get("WLAN Global Configuration")
        if isinstance(globs, list):
            if len(globs) > 0 and isinstance(globs[0], dict):
                globs[0]["Channel"] = str(st["wlan24"].get("Channel", globs[0].get("Channel", "Auto")))
                globs[0]["BandWidth"] = str(st["wlan24"].get("BandWidth", globs[0].get("BandWidth", "20MHz")))
            if len(globs) > 1 and isinstance(globs[1], dict):
                globs[1]["Channel"] = str(st["wlan5"].get("Channel", globs[1].get("Channel", "Auto")))
                globs[1]["BandWidth"] = str(st["wlan5"].get("BandWidth", globs[1].get("BandWidth", "160MHz")))
        ssids = wb.get("WLAN SSID Configuration")
        if isinstance(ssids, list):
            if len(ssids) > 0 and isinstance(ssids[0], dict):
                for fk in ("Enable", "SSID", "KeyPassphrase", "encryption"):
                    if st["wlan24"].get(fk) is not None:
                        ssids[0][fk] = str(st["wlan24"][fk])
            if len(ssids) > 4 and isinstance(ssids[4], dict):
                for fk in ("Enable", "SSID", "KeyPassphrase", "encryption"):
                    if st["wlan5"].get(fk) is not None:
                        ssids[4][fk] = str(st["wlan5"][fk])
    return out


def _replace_input_value(html_text, field_name, new_val):
    esc = re.escape(field_name)
    safe_v = str(new_val).replace("&", "&amp;").replace('"', "&quot;")
    p1 = re.compile(r'(<input\b[^>]*\bname="' + esc + r'"[^>]*\bvalue=")([^"]*)(")', re.IGNORECASE)
    if p1.search(html_text):
        return p1.sub(lambda m: m.group(1) + safe_v + m.group(3), html_text)
    p2 = re.compile(r'(<input\b[^>]*\bvalue=")([^"]*)("[^>]*\bname="' + esc + r'")', re.IGNORECASE)
    if p2.search(html_text):
        return p2.sub(lambda m: m.group(1) + safe_v + m.group(3), html_text)
    return html_text


def _inject_gz_state(txt, st):
    lan = st.get("lan") or {}
    for k in ("ipaddr", "netmask", "start", "end", "leasetime", "Primary_DNS", "Secondary_DNS"):
        if k in lan and lan[k] is not None:
            txt = _replace_input_value(txt, f"cbid.network.lan.{k}", lan[k])
    w24 = st.get("wlan24") or {}
    if w24.get("SSID"):
        txt = txt.replace("FPT-Telecom-A34C", str(w24["SSID"]))
    payload = json.dumps(st, ensure_ascii=False).replace("</", "<\\/")
    state_js = f'<script data-ax3000gz-py="1">window.__AX3000GZ_STATE={payload};</script>'
    idx = txt.lower().find("</head>")
    if idx != -1:
        txt = txt[:idx] + state_js + txt[idx:]
    else:
        txt = state_js + txt
    return txt


def _inject_gz_shim(raw_bytes, st=None):
    txt = raw_bytes.decode("utf-8", errors="replace")
    txt = txt.replace(
        "location.href = '/cgi-bin/luci/admin/home'",
        "location.href = ((location.pathname.match(/^(?:\\/mesh-node\\/[A-Za-z0-9_-]+)?\\/sim_ax3000gz/) || [''])[0]) + '/cgi-bin/luci/admin/home'",
    )
    if st is not None:
        txt = _inject_gz_state(txt, st)
    if 'data-gz-shim="1"' not in txt:
        idx = txt.lower().find("</head>")
        if idx != -1:
            txt = txt[:idx] + _GZ_IFRAME_SHIM + txt[idx:]
        else:
            txt = _GZ_IFRAME_SHIM + txt
    return txt.encode("utf-8")


def ten_file(luci_path):
    """/admin/localnetwork/WLAN/WLANbasic -> admin__localnetwork__WLAN__WLANbasic.html"""
    p = luci_path.strip("/")
    return p.replace("/", "__") + ".html" if p else None


def tim_trang(luci_path):
    """Tra ve duong dan file cho 1 duong dan LuCI."""
    p = "/" + luci_path.strip("/")
    f = ten_file(p)
    if f and os.path.exists(os.path.join(PAGES, f)):
        return os.path.join(PAGES, f)
    dich = FIRSTCHILD.get(p)
    if dich:
        f2 = ten_file(dich)
        if f2 and os.path.exists(os.path.join(PAGES, f2)):
            return os.path.join(PAGES, f2)
    if f:
        prefix = f[:-5] + "__"
        con = sorted(x for x in os.listdir(PAGES) if x.startswith(prefix))
        if con:
            return os.path.join(PAGES, con[0])
    return None


class H(BaseHTTPRequestHandler):
    def _client_key(self):
        hdr = (self.headers.get("X-KTV-Session-ID", "") or "").strip() if hasattr(self, "headers") else ""
        if hdr:
            return hdr
        q = parse_qs(urlparse(getattr(self, "path", "")).query)
        if "_ktv" in q and q["_ktv"][0]:
            return q["_ktv"][0].strip()
        cookie = self.headers.get("Cookie", "") if hasattr(self, "headers") else ""
        m = re.search(r"(?:ftc_session|ktv_client_id|PHPSESSID)=([a-zA-Z0-9_-]+)", cookie)
        if m:
            return m.group(1)
        addr = getattr(self, "client_address", None)
        return str(addr[0]) if addr else "default"

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
        parsed = urlparse(self.path)
        path = unquote(parsed.path)
        qs = parse_qs(parsed.query)
        autologin = qs.get("autologin", [""])[0] == "1"
        key = self._client_key()

        if path in ("/api/reset", "/resetsession"):
            reset_client_state(key)
            return self._gui(b'{"status":"ok","message":"AX3000GZ state reset"}', "application/json")

        if path == "/api/sim-state":
            with _STATE_LOCK:
                st = copy.deepcopy(get_client_state(key))
            return self._gui(json.dumps(st, ensure_ascii=False).encode("utf-8"), "application/json")

        if path in ("/", "/index.html", "/cgi-bin/luci", "/cgi-bin/luci/"):
            return self._chuyen(TRANG_CHU if autologin else "/cgi-bin/luci/login")

        if path in ("/cgi-bin/luci/admin/logout", "/cgi-bin/luci/logout"):
            return self._chuyen("/cgi-bin/luci/login")

        if path in ("/cgi-bin/luci/login", "/login", "/login.html"):
            if autologin:
                return self._chuyen(TRANG_CHU)
            with open(os.path.join(WWW, "login.html"), "rb") as fh:
                return self._gui(_inject_gz_shim(fh.read()), "text/html; charset=utf-8")

        if path in ("/luci-static/gia-tri-that.json", "/gia-tri-that.json"):
            with _STATE_LOCK:
                st = copy.deepcopy(get_client_state(key))
            gtt = _build_gtt_for_state(st)
            return self._gui(json.dumps(gtt, ensure_ascii=False).encode("utf-8"), "application/json")

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
            if path.endswith(".css"):
                return self._gui(b"", "text/css")
            return self._gui(b"", "image/gif")

        if path.startswith("/cgi-bin/luci/"):
            sub = path[len("/cgi-bin/luci"):]
            f = tim_trang(sub)
            if f:
                with _STATE_LOCK:
                    st = copy.deepcopy(get_client_state(key))
                with open(f, "rb") as fh:
                    return self._gui(_inject_gz_shim(fh.read(), st=st), "text/html; charset=utf-8")
            return self._gui(
                ("<meta http-equiv='refresh' content='0;url=%s'>"
                 "<p style=\"font-family:sans-serif;padding:20px\">Trang <code>%s</code> "
                 "khong co trong ban gia lap. Dang ve trang chu...</p>" % (TRANG_CHU, sub)
                 ).encode(), "text/html; charset=utf-8", 404)

        if path in ("/menu.json", "/modal-defs.json", "/firstchild.json"):
            with open(os.path.join(WWW, path.lstrip("/")), "rb") as fh:
                return self._gui(fh.read(), "application/json")

        return self._gui(b"Not found", "text/plain", 404)

    def do_POST(self):
        path = unquote(urlparse(self.path).path)
        key = self._client_key()
        if path in ("/api/reset", "/resetsession"):
            reset_client_state(key)
            return self._gui(b'{"status":"ok","message":"AX3000GZ state reset"}', "application/json")
        if path == "/api/sim-state":
            length = int(self.headers.get("Content-Length", "0") or 0)
            raw = self.rfile.read(length).decode("utf-8", "replace") if length > 0 else "{}"
            try:
                data = json.loads(raw) if raw.strip() else {}
                st = update_client_state(key, data)
                return self._gui(json.dumps({"status": "ok", "state": st}, ensure_ascii=False).encode("utf-8"), "application/json")
            except Exception as e:
                return self._gui(json.dumps({"status": "error", "error": str(e)}).encode("utf-8"), "application/json", 400)
        # Normal HTML form POST: persist any submitted cbid.network.lan.* or WLAN fields
        length = int(self.headers.get("Content-Length", "0") or 0)
        if length > 0:
            raw = self.rfile.read(length).decode("utf-8", "replace")
            if raw.lstrip().startswith("{"):
                try:
                    update_client_state(key, json.loads(raw) or {})
                except Exception:
                    pass
            else:
                q = parse_qs(raw, keep_blank_values=True)
                lan_patch = {}
                for k in ("ipaddr", "netmask", "start", "end", "leasetime", "Primary_DNS", "Secondary_DNS"):
                    fk = f"cbid.network.lan.{k}"
                    if fk in q and q[fk]:
                        lan_patch[k] = q[fk][0]
                if lan_patch:
                    update_client_state(key, {"lan": lan_patch})
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
