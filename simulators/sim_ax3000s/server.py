#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
Gia lap may chu giao dien web AX3000S (FPT Mesh Router - LuCI).
Phuc vu toan bo giao dien LuCI nguyen ban + backend ao co lap theo phien KTV / node Mesh Lab.

Chay: python server.py [port]   (mac dinh 8098)
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

PORT = int(sys.argv[1]) if len(sys.argv) > 1 else 8098
BASE = os.path.dirname(os.path.abspath(__file__))
WWW = os.path.join(BASE, "www")

_STATE_LOCK = threading.RLock()
_USER_STATES = {}
_USER_LAST_SEEN = {}
_TTL_SECONDS = 14400

DEFAULT_STATE = {
    "lan": {
        "ipaddr": "192.168.1.1",
        "netmask": "255.255.255.0",
        "dhcp_enable": 1,
        "dhcp_start": "192.168.1.2",
        "dhcp_end": "192.168.1.254",
        "dhcp_lease": 86400,
        "dns1": "",
        "dns2": "",
    },
    "radios": [
        {
            "band": "2.4G",
            "ifname": "ra0",
            "enable": 1,
            "ssid": "",
            "password": "",
            "channel": 0,
            "channel_now": 6,
            "bandwidth": "40Mhz",
            "security": "WPA2/WPA3-PSK",
            "hidden": 0,
            "txpower": 100,
            "femstatus": "2/2",
        },
        {
            "band": "5G",
            "ifname": "rai0",
            "enable": 1,
            "ssid": "",
            "password": "",
            "channel": 0,
            "channel_now": 36,
            "bandwidth": "80Mhz",
            "security": "WPA2/WPA3-PSK",
            "hidden": 0,
            "txpower": 100,
            "femstatus": "3/3",
        },
    ],
    "wan": {
        "ipaddr": "113.161.75.42",
        "netmask": "255.255.255.0",
        "gateway": "113.161.75.1",
        "dns1": "210.245.24.20",
        "dns2": "210.245.24.21",
        "proto": "dhcp",
        "connected": True,
    },
    "mesh": {
        "enable": 1,
        "role": "controller",
        "nodes": [],
    },
    "clients": [
        {"hostname": "Laptop-GV", "mac": "A4:B1:C2:D3:E4:01", "ipv4": "192.168.1.101", "ifname": "eth0", "medium": "ethernet", "band": "-", "rssi": "-", "online": 1},
        {"hostname": "iPhone-15", "mac": "A4:B1:C2:D3:E4:02", "ipv4": "192.168.1.102", "ifname": "rai0", "medium": "wifi", "band": "5G", "rssi": -48, "online": 1},
        {"hostname": "SmartTV", "mac": "A4:B1:C2:D3:E4:03", "ipv4": "192.168.1.103", "ifname": "ra0", "medium": "wifi", "band": "2.4G", "rssi": -63, "online": 1},
    ],
}


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
        if isinstance(data.get("lan"), dict):
            st["lan"].update(data["lan"])
        if isinstance(data.get("radios"), list):
            for idx, r in enumerate(data["radios"][:2]):
                if isinstance(r, dict) and idx < len(st["radios"]):
                    st["radios"][idx].update(r)
        if isinstance(data.get("wan"), dict):
            st["wan"].update(data["wan"])
        if isinstance(data.get("mesh"), dict):
            st["mesh"].update(data["mesh"])
        if isinstance(data.get("clients"), list):
            st["clients"] = copy.deepcopy(data["clients"])
        return copy.deepcopy(st)


def reset_client_state(key):
    k = (key or "").strip() or "default"
    with _STATE_LOCK:
        _USER_STATES.pop(k, None)
        _USER_LAST_SEEN.pop(k, None)


def _inject_py_state(raw_bytes, st):
    txt = raw_bytes.decode("utf-8", errors="replace")
    payload = json.dumps(st, ensure_ascii=False).replace("</", "<\\/")
    script = f'<script data-ax3000s-py="1">window.__AX3000S_INIT_STATE={payload};</script>'
    marker = '<script src="sim/backend.js">'
    if marker in txt:
        txt = txt.replace(marker, script + "\n  " + marker, 1)
    elif "</head>" in txt.lower():
        txt = re.sub(r"</head>", script + "</head>", txt, count=1, flags=re.IGNORECASE)
    else:
        txt = script + txt
    return txt.encode("utf-8")


CT = {
    ".html": "text/html; charset=utf-8",
    ".css": "text/css",
    ".js": "application/javascript",
    ".json": "application/json",
    ".png": "image/png",
    ".gif": "image/gif",
    ".jpg": "image/jpeg",
    ".jpeg": "image/jpeg",
    ".svg": "image/svg+xml",
    ".ico": "image/x-icon",
    ".woff": "font/woff",
    ".woff2": "font/woff2",
    ".ttf": "font/ttf",
    ".eot": "application/vnd.ms-fontobject",
}


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

    def _file(self, path, ctype, key=None):
        if os.path.exists(path) and os.path.isfile(path):
            with open(path, "rb") as fh:
                data = fh.read()
            if path.lower().endswith(".html") and key is not None:
                with _STATE_LOCK:
                    st = copy.deepcopy(get_client_state(key))
                data = _inject_py_state(data, st)
            return self._gui(data, ctype)
        return self._gui(b"Not found", "text/plain", 404)

    def _chuyen(self, to):
        self.send_response(302)
        self.send_header("Location", to)
        self.send_header("Content-Length", "0")
        self.end_headers()

    def do_GET(self):
        p = unquote(urlparse(self.path).path)
        key = self._client_key()

        if p in ("/api/reset", "/resetsession"):
            reset_client_state(key)
            return self._gui(b'{"status":"ok","message":"AX3000S state reset"}', "application/json")

        if p == "/api/sim-state":
            with _STATE_LOCK:
                st = copy.deepcopy(get_client_state(key))
            return self._gui(json.dumps(st, ensure_ascii=False).encode("utf-8"), "application/json")

        if p in ("/", "/index.html"):
            return self._chuyen("/login.html")

        file_path = os.path.join(WWW, p.lstrip("/"))

        if os.path.exists(file_path) and os.path.isfile(file_path):
            ext = os.path.splitext(file_path)[1].lower()
            return self._file(file_path, CT.get(ext, "application/octet-stream"), key=key)

        if p.endswith(".css"):
            return self._gui(b"", "text/css")
        if p.endswith(".js"):
            return self._gui(b"", "application/javascript")
        if p.endswith((".png", ".jpg", ".gif", ".ico")):
            return self._gui(b"", "image/png")

        return self._gui(b"Not found", "text/plain", 404)

    def do_POST(self):
        p = unquote(urlparse(self.path).path)
        key = self._client_key()
        if p in ("/api/reset", "/resetsession"):
            reset_client_state(key)
            return self._gui(b'{"status":"ok","message":"AX3000S state reset"}', "application/json")
        if p == "/api/sim-state":
            length = int(self.headers.get("Content-Length", "0") or 0)
            raw = self.rfile.read(length).decode("utf-8", "replace") if length > 0 else "{}"
            try:
                data = json.loads(raw) if raw.strip() else {}
                st = update_client_state(key, data)
                return self._gui(json.dumps({"status": "ok", "state": st}, ensure_ascii=False).encode("utf-8"), "application/json")
            except Exception as e:
                return self._gui(json.dumps({"status": "error", "error": str(e)}).encode("utf-8"), "application/json", 400)
        self._chuyen(self.headers.get("Referer") or "/app.html")

    def log_message(self, *a):
        pass


if __name__ == "__main__":
    srv = ThreadingHTTPServer(("0.0.0.0", PORT), H)
    srv.daemon_threads = True
    print("=" * 56)
    print("  Gia lap AX3000S (FPT Mesh Router)")
    print(f"  Mo trinh duyet: http://localhost:{PORT}/")
    print("  Ctrl+C de dung")
    print("=" * 56)
    try:
        srv.serve_forever()
    except KeyboardInterrupt:
        print("\nDa dung.")
