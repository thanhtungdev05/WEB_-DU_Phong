#!/usr/bin/env python3
"""Giả lập máy chủ AC1000Z (ZTE ZXHN F671Y V9.0.11P2N53B).

Hỗ trợ chuẩn 4 mức độ:
  1. Hình ảnh: giao diện HTML/CSS/JS gốc từ thiết bị thật.
  2. Cấu trúc: giữ nguyên mọi endpoint, DOM, input name, script JS.
  3. Giao tiếp: chuẩn xác HTTP status, header, XML/JSON format, luồng 3 bước login SHA-256.
  4. Trạng thái: kết nối qua kho cấu hình trung tâm ConfigStore (state.json).
"""
from __future__ import annotations

import base64
import copy
import datetime as dt
import hashlib
import json
import mimetypes
import os
import re
import secrets
import string
import sys
import threading
import time
from http import HTTPStatus
from http.cookies import SimpleCookie
from http.server import BaseHTTPRequestHandler, ThreadingHTTPServer
from urllib.parse import parse_qs, urlparse
try:
    from .config_store import STORE, bind_user, reset_user_store
except ImportError:
    from config_store import STORE, bind_user, reset_user_store

from cryptography.hazmat.primitives.ciphers import Cipher, algorithms, modes

PORT = int(sys.argv[1]) if len(sys.argv) > 1 else 8098
HERE = os.path.dirname(os.path.abspath(__file__))
WWW = os.path.join(HERE, "www")
STARTED = time.monotonic()
SESSIONS: dict[str, dict] = {}
LOCK = threading.RLock()
ALNUM = string.ascii_letters + string.digits


def token(n: int = 24) -> str:
    return "".join(secrets.choice(ALNUM) for _ in range(n))


def xml_escape(value) -> str:
    return (str(value).replace("&", "&amp;").replace("<", "&lt;")
            .replace(">", "&gt;").replace('"', "&quot;"))


def para(name: str, value) -> str:
    return f"<ParaName>{name}</ParaName><ParaValue>{xml_escape(value)}</ParaValue>"


def instance(items) -> str:
    return "<Instance>" + "".join(para(k, v) for k, v in items) + "</Instance>"


def zte_encrypt(plain: str, sess_token: str) -> str:
    """AES-256-CBC khớp decodeParaValue của thiết bị thật.

    Key = SHA256(sess_token), iv = 16 byte đầu của SHA256(sess_token đảo).
    ZeroPadding thêm byte 0 cho đủ bội số 16 (không pad khi đã chia hết).
    """
    key = hashlib.sha256(sess_token.encode()).digest()
    iv = hashlib.sha256(sess_token[::-1].encode()).digest()[:16]
    raw = plain.encode("utf-8")
    raw += b"\x00" * ((16 - len(raw) % 16) % 16)
    enc = Cipher(algorithms.AES(key), modes.CBC(iv)).encryptor()
    return base64.b64encode(enc.update(raw) + enc.finalize()).decode()


XML_OK = ("<ajax_response_xml_root><IF_ERRORPARAM>SUCC</IF_ERRORPARAM>"
          "<IF_ERRORTYPE>SUCC</IF_ERRORTYPE><IF_ERRORSTR>SUCC</IF_ERRORSTR>"
          "<IF_ERRORID>0</IF_ERRORID>")

XML_SESSION_TIMEOUT = ("""<?xml version="1.0"?>
<ajax_response_xml_root>
    <IF_ERRORSTR>SessionTimeout</IF_ERRORSTR>
    <IF_ERRORPARAM>SUCC</IF_ERRORPARAM>
    <IF_ERRORTYPE>SUCC</IF_ERRORTYPE>
</ajax_response_xml_root>
""")


def device_info_xml() -> bytes:
    state = STORE.snapshot()
    d, r = state["device"], state["runtime"]
    uptime = r["power_on_time_seed"] + int(time.monotonic() - STARTED)
    body = XML_OK
    body += "<OBJ_DEVINFO_ID>" + instance([
        ("_InstID", "IGD"), ("ManuFacturerOui", d["manufacturer_oui"]),
        ("VerDate", d["version_date"]), ("SoftwareVer", d["software_version"]),
        ("ModelName", d["model_name"]), ("SoftwareVerExtent", d["batch_number"]),
        ("HardwareVer", d["hardware_version"]), ("OnuAlias", ""),
        ("ManuFacturer", d["manufacturer"]), ("SerialNumber", d["serial_number"]),
        ("BootVer", d["boot_version"]),
    ]) + "</OBJ_DEVINFO_ID>"
    body += "<OBJ_CPUMEMUSAGE_ID>" + instance([
        ("_InstID", "IGD"), ("CpuUsage2", r["cpu_usage_2"]),
        ("CpuUsage1", r["cpu_usage_1"]), ("CpuUsage4", r["cpu_usage_4"]),
        ("CpuUsage3", r["cpu_usage_3"]), ("MemUsage", r["memory_usage"]),
    ]) + "</OBJ_CPUMEMUSAGE_ID>"
    body += "<OBJ_POWERONTIME_ID>" + instance([
        ("_InstID", "IGD"), ("PowerOnTime", uptime),
    ]) + "</OBJ_POWERONTIME_ID></ajax_response_xml_root>"
    return body.encode("utf-8")


class RouterHandler(BaseHTTPRequestHandler):
    server_version = ""
    sys_version = ""

    def get_session(self) -> tuple[str, dict]:
        cookie_hdr = self.headers.get("Cookie", "")
        sid = None
        if cookie_hdr:
            try:
                cookies = SimpleCookie()
                cookies.load(cookie_hdr)
                if "SID" in cookies:
                    sid = cookies["SID"].value
            except Exception:
                pass
            if not sid:
                m = re.search(r'SID=([a-zA-Z0-9_-]+)', cookie_hdr)
                if m:
                    sid = m.group(1)

        with LOCK:
            if sid and sid in SESSIONS:
                return sid, SESSIONS[sid]

            # If a session is already logged in on localhost simulator, attach to it
            logged_in_sids = [s for s, data in SESSIONS.items() if data.get("logged_in")]
            if logged_in_sids:
                active_sid = logged_in_sids[-1]
                return active_sid, SESSIONS[active_sid]

            new_sid = hashlib.sha256(token(32).encode()).hexdigest()
            SESSIONS[new_sid] = {
                "logged_in": False,
                "sess_token": token(24),
                "salt": str(secrets.randbelow(90000000) + 10000000),
                "active_menu": "homePage",
            }
            return new_sid, SESSIONS[new_sid]

    def set_cookie_headers(self, sid: str):
        self.send_header("Set-Cookie", f"SID={sid}; Path=/; HttpOnly; SameSite=Strict")
        self.send_header("Set-Cookie", "_TESTCOOKIESUPPORT=1; Path=/; HttpOnly; SameSite=Strict")

    def send_data(self, payload: bytes, sid: str):
        stripped = payload.strip()
        if stripped.startswith((b"{", b"[")):
            ctype = "application/json; charset=utf-8"
        else:
            ctype = "text/xml; charset=utf-8"
        self.send_response(HTTPStatus.OK)
        self.send_header("Content-Type", ctype)
        self.send_header("Content-Length", str(len(payload)))
        self.send_header("Cache-Control", "no-cache,no-store")
        self.set_cookie_headers(sid)
        self.end_headers()
        self.wfile.write(payload)

    def send_xml(self, payload: bytes, sid: str):
        self.send_response(HTTPStatus.OK)
        self.send_header("Content-Type", "text/xml; charset=utf-8")
        self.send_header("Content-Length", str(len(payload)))
        self.send_header("Cache-Control", "no-cache,no-store")
        self.set_cookie_headers(sid)
        self.end_headers()
        self.wfile.write(payload)

    def send_json(self, data: dict, sid: str):
        payload = json.dumps(data, ensure_ascii=False).encode("utf-8")
        self.send_response(HTTPStatus.OK)
        self.send_header("Content-Type", "application/json; charset=utf-8")
        self.send_header("Content-Length", str(len(payload)))
        self.send_header("Cache-Control", "no-cache,no-store")
        self.set_cookie_headers(sid)
        self.end_headers()
        self.wfile.write(payload)

    def send_html(self, html_text: str, sid: str):
        payload = html_text.encode("utf-8")
        self.send_response(HTTPStatus.OK)
        self.send_header("Content-Type", "text/html; charset=utf-8")
        self.send_header("Content-Length", str(len(payload)))
        self.send_header("Cache-Control", "no-cache,no-store")
        self.set_cookie_headers(sid)
        self.end_headers()
        self.wfile.write(payload)

    def _enc(self, payload: bytes, sess: dict) -> bytes:
        """Mã hóa theo phiên các trường liệt kê trong thẻ <encode>.

        File mẫu lưu giá trị PLAINTEXT; giống thiết bị thật, server mã hóa
        bằng sess_token hiện tại trước khi gửi để trang giải mã ra đúng giá trị.
        """
        try:
            text = payload.decode("utf-8")
        except UnicodeDecodeError:
            return payload
        encode_groups = re.findall(r"<encode>([^<]*)</encode>", text)
        if not encode_groups:
            return payload
        names = list(dict.fromkeys(
            name.strip()
            for group in encode_groups
            for name in group.split(",")
            if name.strip()
        ))
        token = sess.get("sess_token")
        if not names or not token:
            return payload
        for name in names:
            pattern = (r"(<ParaName>%s</ParaName>\s*<ParaValue>)([^<]*)(</ParaValue>)"
                       % re.escape(name))

            def replace(mm, token=token):
                value = mm.group(2)
                if value == "":
                    return mm.group(0)
                return mm.group(1) + zte_encrypt(value, token) + mm.group(3)

            text = re.sub(pattern, replace, text)
        return text.encode("utf-8")

    def serve_static(self, rel_path: str):
        rel = rel_path.lstrip("/").replace("/", os.sep)
        full_path = os.path.join(WWW, rel)
        if not os.path.exists(full_path) or os.path.isdir(full_path):
            self.send_error(HTTPStatus.NOT_FOUND, "File not found")
            return
        ctype, _ = mimetypes.guess_type(full_path)
        if not ctype:
            ctype = "application/octet-stream"
        with open(full_path, "rb") as fh:
            data = fh.read()
        self.send_response(HTTPStatus.OK)
        self.send_header("Content-Type", ctype)
        self.send_header("Content-Length", str(len(data)))
        self.end_headers()
        self.wfile.write(data)

    def _client_key(self) -> str:
        hdr = (self.headers.get("X-KTV-Session-ID", "") or "").strip()
        if hdr:
            return hdr
        path = getattr(self, "path", "")
        if "?_ktv=" in path or "&_ktv=" in path:
            try:
                q = parse_qs(urlparse(path).query)
                if "_ktv" in q and q["_ktv"][0]:
                    return q["_ktv"][0].strip()
            except Exception:
                pass
        cookie_raw = self.headers.get("Cookie", "")
        for part in cookie_raw.split(";"):
            part = part.strip()
            if part.startswith("ftc_session=") or part.startswith("PHPSESSID=") or part.startswith("ktv_client_id="):
                return part.split("=", 1)[1]
        ref = self.headers.get("Referer", "")
        if ref and "_ktv=" in ref:
            try:
                q = parse_qs(urlparse(ref).query)
                if "_ktv" in q and q["_ktv"][0]:
                    return q["_ktv"][0].strip()
            except Exception:
                pass
        return "default"

    def _is_reset_path(self, path: str) -> bool:
        clean = path.rstrip("/").split("?")[0]
        if clean.startswith("/sim_ac1000z"):
            clean = clean[len("/sim_ac1000z"):]
        return clean in ("/api/reset", "/resetsession")

    def _reset_session(self):
        cookie_hdr = self.headers.get("Cookie", "")
        sid = None
        if cookie_hdr:
            m = re.search(r'SID=([a-zA-Z0-9_-]+)', cookie_hdr)
            if m:
                sid = m.group(1)
        if sid:
            with LOCK:
                SESSIONS.pop(sid, None)
        client_key = self._client_key()
        reset_user_store(client_key)
        payload = json.dumps({"status": "ok", "message": "AC1000Z state reset"}).encode("utf-8")
        self.send_response(HTTPStatus.OK)
        self.send_header("Content-Type", "application/json; charset=utf-8")
        self.send_header("Content-Length", str(len(payload)))
        self.send_header("Set-Cookie", "SID=; Path=/; HttpOnly; SameSite=Strict; Max-Age=0")
        self.send_header("Cache-Control", "no-cache,no-store")
        self.end_headers()
        self.wfile.write(payload)

    def do_GET(self):
        bind_user(self._client_key())
        parsed = urlparse(self.path)
        if parsed.path.startswith("/sim_ac1000z"):
            clean_path = parsed.path[len("/sim_ac1000z"):] or "/"
            self.path = clean_path + (("?" + parsed.query) if parsed.query else "")
            parsed = urlparse(self.path)

        if self._is_reset_path(parsed.path):
            return self._reset_session()

        qs = parse_qs(parsed.query)
        sid, sess = self.get_session()

        # Static assets
        if parsed.path.startswith(("/jquery/", "/img/", "/css/")):
            self.serve_static(parsed.path)
            return

        q_type = qs.get("_type", [None])[0]
        q_tag = qs.get("_tag", [None])[0]

        # Login flow GET
        if q_type == "loginData":
            if q_tag == "login_entry":
                self.send_json({
                    "lockingTime": 0,
                    "loginErrMsg": "",
                    "promptMsg": "",
                    "sess_token": sess["sess_token"],
                }, sid)
                return
            elif q_tag == "login_token":
                xml = f"<ajax_response_xml_root>{sess['salt']}</ajax_response_xml_root>".encode("utf-8")
                self.send_xml(xml, sid)
                return

        # Main index page
        if parsed.path == "/" and not q_type:
            if not sess["logged_in"]:
                # Serve login page
                login_path = os.path.join(WWW, "login_page.html")
                with open(login_path, "r", encoding="utf-8") as f:
                    html = f.read()
                self.send_html(html, sid)
                return
            else:
                # Serve dashboard with active session token
                index_path = os.path.join(WWW, "index.html")
                with open(index_path, "r", encoding="utf-8") as f:
                    html = f.read()
                # Inject token into dashboard using lambda to avoid regex escape errors
                token_hex = "".join(f"\\x{ord(c):02x}" for c in sess["sess_token"])
                html = re.sub(r'var _sessionTmpToken = ".*?";',
                              lambda _: f'var _sessionTmpToken = "{token_hex}";', html)
                self.send_html(html, sid)
                return

        # Access check for internal menu APIs
        if not sess["logged_in"]:
            self.send_xml(XML_SESSION_TIMEOUT.encode("utf-8"), sid)
            return

        # menuView: Render fragment
        if q_type == "menuView":
            with LOCK:
                sess["active_menu"] = q_tag
            frag_name = f"{q_tag}.html"
            frag_path = os.path.join(WWW, frag_name)
            if os.path.exists(frag_path):
                with open(frag_path, "r", encoding="utf-8") as f:
                    frag_html = f.read()
                token_hex = "".join(f"\\x{ord(c):02x}" for c in sess["sess_token"])
                frag_html = re.sub(r'var _sessionTmpToken = ".*?";',
                                   lambda _: f'var _sessionTmpToken = "{token_hex}";', frag_html)
                frag_html = re.sub(r'_sessionTmpToken = ".*?";',
                                   lambda _: f'_sessionTmpToken = "{token_hex}";', frag_html)
                self.send_html(frag_html, sid)
                return
            else:
                # Fallback fragment if not found yet
                self.send_html(f"<!-- fragment {q_tag} -->", sid)
                return

        # menuData / hiddenData: XML data
        if q_type in ("menuData", "hiddenData"):
            # Device Information
            if q_tag in ("devmgr_statusmgr_lua.lua", "devmgr_statusmgr_lua"):
                self.send_xml(device_info_xml(), sid)
                return

            # Generic lookup from ConfigStore
            clean_tag = q_tag.split("&")[0]
            # Try raw tag or without .lua
            candidates = [clean_tag, clean_tag.replace(".lua", "")]
            for c in candidates:
                if STORE.has_data(c):
                    data = STORE.get_data(c)
                    data = self._enc(data, sess)
                    self.send_data(data, sid)
                    return

            self.send_xml(XML_SESSION_TIMEOUT.encode("utf-8"), sid)
            return

        self.send_error(HTTPStatus.NOT_FOUND, "Not found")

    def do_POST(self):
        bind_user(self._client_key())
        parsed = urlparse(self.path)
        if parsed.path.startswith("/sim_ac1000z"):
            clean_path = parsed.path[len("/sim_ac1000z"):] or "/"
            self.path = clean_path + (("?" + parsed.query) if parsed.query else "")
            parsed = urlparse(self.path)

        if self._is_reset_path(parsed.path):
            return self._reset_session()

        qs = parse_qs(parsed.query)
        sid, sess = self.get_session()

        content_len = int(self.headers.get("Content-Length", 0))
        body = self.rfile.read(content_len).decode("utf-8", errors="ignore")
        post_data = parse_qs(body)

        q_type = qs.get("_type", [None])[0]
        q_tag = qs.get("_tag", [None])[0]

        if q_type == "loginData":
            if q_tag == "login_entry":
                username = post_data.get("Username", [""])[0]
                password_hash = post_data.get("Password", [""])[0]
                # Check SHA256("admin" + salt)
                expected_hash = hashlib.sha256(("admin" + sess["salt"]).encode()).hexdigest()
                if username == "admin" and password_hash.lower() == expected_hash.lower():
                    with LOCK:
                        sess["logged_in"] = True
                        sess["sess_token"] = token(24)
                    self.send_json({
                        "sess_token": sess["sess_token"],
                        "login_need_refresh": True,
                    }, sid)
                    return
                else:
                    self.send_json({
                        "loginErrMsg": "failed",
                        "sess_token": sess["sess_token"],
                    }, sid)
                    return

            elif q_tag == "logout_entry":
                with LOCK:
                    sess["logged_in"] = False
                    sess["sess_token"] = token(24)
                    sess["salt"] = str(secrets.randbelow(90000000) + 10000000)
                self.send_json({"result": "success", "need_refresh": True}, sid)
                return

        # Check authenticated for other POSTs
        if not sess["logged_in"]:
            self.send_xml(XML_SESSION_TIMEOUT.encode("utf-8"), sid)
            return

        # Handle configuration POSTs (level 4 state updates)
        flat_fields = {k: v[0] for k, v in post_data.items()}
        clean_tag = (q_tag or "").split("&")[0]
        candidates = [clean_tag, clean_tag.replace(".lua", "")]
        for c in candidates:
            if STORE.has_data(c):
                STORE.update_values(c, flat_fields)
                data = STORE.get_data(c)
                data = self._enc(data, sess)
                self.send_data(data, sid)
                return

        self.send_xml(XML_OK.encode("utf-8"), sid)


Handler = RouterHandler
ROOT = WWW


def run_server():
    server_address = ("", PORT)
    httpd = ThreadingHTTPServer(server_address, RouterHandler)
    print(f"AC1000Z Simulator running on http://127.0.0.1:{PORT}")
    try:
        httpd.serve_forever()
    except KeyboardInterrupt:
        print("\nShutting down server.")
        httpd.server_close()


if __name__ == "__main__":
    run_server()
