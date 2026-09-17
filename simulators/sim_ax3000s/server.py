#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
Gia lap may chu giao dien web AX3000S (FPT Mesh Router - LuCI).
Phuc vu toan bo giao dien LuCI nguyen ban + backend ao.

Chay: python server.py [port]   (mac dinh 8098)
"""
import os
import sys
from http.server import BaseHTTPRequestHandler, ThreadingHTTPServer
from urllib.parse import urlparse, unquote

PORT = int(sys.argv[1]) if len(sys.argv) > 1 else 8098
BASE = os.path.dirname(os.path.abspath(__file__))
WWW = os.path.join(BASE, "www")

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
    def _gui(self, data, ctype, code=200):
        self.send_response(code)
        self.send_header("Content-Type", ctype)
        self.send_header("Content-Length", str(len(data)))
        self.send_header("Cache-Control", "no-store")
        self.end_headers()
        self.wfile.write(data)

    def _file(self, path, ctype):
        if os.path.exists(path) and os.path.isfile(path):
            with open(path, "rb") as fh:
                return self._gui(fh.read(), ctype)
        return self._gui(b"Not found", "text/plain", 404)

    def _chuyen(self, to):
        self.send_response(302)
        self.send_header("Location", to)
        self.send_header("Content-Length", "0")
        self.end_headers()

    def do_GET(self):
        p = unquote(urlparse(self.path).path)

        if p in ("/api/reset", "/resetsession"):
            return self._gui(b'{"status":"ok","message":"AX3000S state reset"}', "application/json")

        if p in ("/", "/index.html"):
            return self._chuyen("/login.html")

        file_path = os.path.join(WWW, p.lstrip("/"))

        if os.path.exists(file_path) and os.path.isfile(file_path):
            ext = os.path.splitext(file_path)[1].lower()
            return self._file(file_path, CT.get(ext, "application/octet-stream"))

        # Tra ve file rong cho cgi-bin hoac cac asset khong tim thấy để tránh vỡ giao diện
        if p.endswith(".css"):
            return self._gui(b"", "text/css")
        if p.endswith(".js"):
            return self._gui(b"", "application/javascript")
        if p.endswith((".png", ".jpg", ".gif", ".ico")):
            return self._gui(b"", "image/png")

        return self._gui(b"Not found", "text/plain", 404)

    def do_POST(self):
        p = unquote(urlparse(self.path).path)
        if p in ("/api/reset", "/resetsession"):
            return self._gui(b'{"status":"ok","message":"AX3000S state reset"}', "application/json")
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
