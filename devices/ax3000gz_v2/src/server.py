#!/usr/bin/env python3
"""Giả lập nhóm đầu AX3000GZ_V2 / ZTE F6201B V9.3.10P6N16.

Phạm vi đã có bằng chứng thật:
  * trang đăng nhập + SID + token + SHA-256(password + login_token)
  * trang Home mặc định và ba API chỉ đọc của Home
  * Management & Diagnosis > Status (Device Information)
  * đăng xuất
"""
from __future__ import annotations

import base64
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
    # Imported by the portal dispatcher as a namespace package.
    from .config_store import STORE, bind_user, reset_user_store
except ImportError:  # pragma: no cover - standalone ``python server.py`` path
    from config_store import STORE, bind_user, reset_user_store

from cryptography.hazmat.primitives.ciphers import Cipher, algorithms, modes


PORT = int(sys.argv[1]) if len(sys.argv) > 1 else 8097
HERE = os.path.dirname(os.path.abspath(__file__))
WWW = os.path.join(HERE, "www")
STARTED = time.monotonic()
SESSIONS: dict[str, dict] = {}
LOCK = threading.RLock()
ALNUM = string.ascii_letters + string.digits


def token(n: int) -> str:
    return "".join(secrets.choice(ALNUM) for _ in range(n))


def xml_escape(value) -> str:
    return (str(value).replace("&", "&amp;").replace("<", "&lt;")
            .replace(">", "&gt;").replace('"', "&quot;"))


def zte_hex(value: str) -> str:
    return "".join(f"\\x{ord(ch):02x}" for ch in value)


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


def para(name: str, value) -> str:
    return f"<ParaName>{name}</ParaName><ParaValue>{xml_escape(value)}</ParaValue>"


def instance(items) -> str:
    return "<Instance>" + "".join(para(k, v) for k, v in items) + "</Instance>"


XML_OK = ("<ajax_response_xml_root><IF_ERRORPARAM>SUCC</IF_ERRORPARAM>"
          "<IF_ERRORTYPE>SUCC</IF_ERRORTYPE><IF_ERRORSTR>SUCC</IF_ERRORSTR>"
          "<IF_ERRORID>0</IF_ERRORID>")


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
    ]) + "</OBJ_POWERONTIME_ID>"
    body += "<OBJ_SN_INFO_ID>" + instance([
        ("_InstID", "IGD"), ("Sn", d["pon_sn"]),
    ]) + "</OBJ_SN_INFO_ID><encode>Pwd</encode>"
    body += "<OBJ_FLASHINFO_ID>" + instance([
        ("_InstID", "IGD"), ("TotalFlash", r["flash_total"]),
        ("Flash_Percent_Used", r["flash_percent_used"]),
    ]) + "</OBJ_FLASHINFO_ID>"
    body += "<OBJ_PON_OPTICALPARA_ID>" + instance([
        ("_InstID", "IGD"), ("Temp", r["optical_temperature"]),
    ]) + "</OBJ_PON_OPTICALPARA_ID>"
    body += "<OBJ_CPU_TEMPERATURE_ID>" + instance([
        ("_InstID", "IGD"), ("CPUTemp", r["cpu_temperature"]),
    ]) + "</OBJ_CPU_TEMPERATURE_ID>"
    body += "<OBJ_TAGPARAM_ID>" + instance([
        ("_InstID", "IGD"), ("FirstMAC", d["first_mac"]),
    ]) + "</OBJ_TAGPARAM_ID></ajax_response_xml_root>"
    return body.encode("utf-8")


def firewall_xml() -> bytes:
    h = STORE.get("home")
    return (XML_OK + "<OBJ_FWLEVEL_ID>" + instance([
        ("_InstID", "IGD"), ("Level", h["firewall_level"]),
        ("AntiAttack", h["anti_attack"]),
    ]) + "</OBJ_FWLEVEL_ID></ajax_response_xml_root>").encode()


def wlan_xml() -> bytes:
    h = STORE.get("home")
    return (XML_OK + "<OBJ_ACCESSDEV_ID></OBJ_ACCESSDEV_ID><OBJ_WLANRADIO_ID>" +
            instance([("RadioSwitch", h["wlan_radio_switch"])]) +
            "</OBJ_WLANRADIO_ID></ajax_response_xml_root>").encode()


def sntp_xml() -> bytes:
    h = STORE.get("home")
    seed = dt.datetime.fromisoformat(h["current_local_time_seed"])
    now = seed + dt.timedelta(seconds=int(time.monotonic() - STARTED))
    values = [
        ("_InstID", "IGD"), ("Enable", "1"), ("SntpBindWanName", ""),
        ("NtpServer5", ""), ("NtpServer4", ""), ("NtpConfigPermission", "0"),
        ("AutoSetTzname", "0"), ("CurrentLocalTime", now.isoformat(timespec="seconds")),
        ("NtpServer2", h["ntp_server_2"]), ("ZoneIndex", h["zone_index"]),
        ("Dscp", "-1"), ("PollTimeInterval", "86400"), ("NtpServer3", ""),
        ("NtpServer1", h["ntp_server_1"]), ("DaylightSavingsUsed", "0"),
    ]
    return (XML_OK + "<OBJ_SNTP_ID>" + instance(values) +
            "</OBJ_SNTP_ID></ajax_response_xml_root>").encode()


def loopback_vlan_xml() -> bytes:
    """Four real per-port containers, populated from the central store."""
    vlans = STORE.get("loopback_vlans", {}).get("items", [])
    groups = [[] for _ in range(4)]
    for item in vlans:
        match = re.search(r"BRPORT([2-5])$", item["PortID"])
        index = int(match.group(1)) - 2 if match else 0
        groups[index].append(item)
    body = XML_OK
    for group in groups:
        body += "<OBJ_LOOPBACK_VLAN_ID>"
        for item in group:
            body += instance([
                ("_InstID", item["_InstID"]),
                ("vlanCount", item.get("vlanCount", "1")),
                ("PortID", item["PortID"]),
                ("VidStr", item["VidStr"]),
            ])
        body += "</OBJ_LOOPBACK_VLAN_ID>"
    return (body + "</ajax_response_xml_root>").encode("utf-8")


def static_routes_xml(ipv6: bool = False) -> bytes:
    """Render the mutable IPv4/IPv6 static-route table in firmware order."""
    section = "routing_ipv6_static" if ipv6 else "routing_ipv4_static"
    object_id = "OBJ_ROUTESTATIC6_ID" if ipv6 else "OBJ_ROUTESTATIC_ID"
    routes = STORE.get(section, {}).get("items", [])
    body = XML_OK + f"<{object_id}>"
    for route in routes:
        if ipv6:
            fields = [("_InstID", route["_InstID"]),
                      ("PrefixLen", route["PrefixLen"]),
                      ("Enable", route["Enable"]),
                      ("DestIP", route["DestIP"]),
                      ("GWIP", route["GWIP"]),
                      ("Alias", route["Alias"]),
                      ("Interface", route["Interface"])]
        else:
            fields = [("_InstID", route["_InstID"]),
                      ("DestIPMask", route["DestIPMask"]),
                      ("Enable", route["Enable"]),
                      ("DestIP", route["DestIP"]),
                      ("GWIP", route["GWIP"]),
                      ("Alias", route["Alias"]),
                      ("Interface", route["Interface"])]
        body += instance(fields)
    return (body + f"</{object_id}></ajax_response_xml_root>").encode("utf-8")


class Handler(BaseHTTPRequestHandler):
    server_version = ""
    sys_version = ""

    def log_message(self, *_):
        pass

    def _sid(self):
        cookie = SimpleCookie(self.headers.get("Cookie", ""))
        return cookie["SID"].value if "SID" in cookie else None

    def _session(self, create=False):
        sid = self._sid()
        with LOCK:
            if sid in SESSIONS:
                return sid, SESSIONS[sid], False
            if not create:
                return sid, None, False
            sid = secrets.token_hex(32)
            SESSIONS[sid] = {"logged_in": False, "sess_token": token(24),
                             "login_token": None, "last_seen": time.monotonic()}
            return sid, SESSIONS[sid], True

    def _client_key(self):
        hdr = (self.headers.get("X-KTV-Session-ID", "") or "").strip()
        if hdr:
            return hdr
        if "?_ktv=" in getattr(self, "path", "") or "&_ktv=" in getattr(self, "path", ""):
            try:
                q = parse_qs(urlparse(self.path).query)
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
        return path in ("/api/reset", "/resetsession")

    def _reset_session(self):
        """Portal gọi khi đổi/trở về bài học: xóa session hiện tại và
        đưa ConfigStore về trạng thái mặc định, buộc học viên đăng nhập lại."""
        sid = self._sid()
        client_key = self._client_key()
        if sid:
            with LOCK:
                SESSIONS.pop(sid, None)
        reset_user_store(client_key)
        body = json.dumps({"status": "ok", "message": "AX3000GZ_V2 state reset"},
                          separators=(",", ":")).encode("utf-8")
        self._send(body, "application/json; charset=utf-8", clear_sid=True)

    def _send(self, data: bytes, ctype: str, status=200, sid=None, clear_sid=False):
        self.send_response(status)
        self.send_header("Connection", "close")
        self.send_header("Cache-Control", "no-cache,no-store")
        self.send_header("Pragma", "no-cache")
        self.send_header("Content-Length", str(len(data)))
        if clear_sid:
            self.send_header("Set-Cookie",
                             "SID=; PATH=/; HttpOnly; SameSite=strict; Max-Age=0")
        elif sid:
            self.send_header("Set-Cookie", f"SID={sid}; PATH=/; HttpOnly; SameSite=strict")
        self.send_header("Server", "")
        self.send_header("Accept-Ranges", "bytes")
        self.send_header("X-Content-Type-Options", "nosniff")
        self.send_header("X-XSS-Protection", "1; mode=block")
        self.send_header("Content-Security-Policy", "frame-ancestors 'self' ")
        self.send_header("X-Frame-Options", "SAMEORIGIN")
        self.send_header("Content-Type", ctype)
        self.end_headers()
        self.wfile.write(data)

    def _file(self, rel: str):
        root = os.path.realpath(WWW)
        path = os.path.realpath(os.path.join(root, rel.lstrip("/")))
        if path != root and not path.startswith(root + os.sep):
            return self._send(b"Not found", "text/plain", 404)
        if not os.path.isfile(path):
            return self._send(b"Not found", "text/plain", 404)
        ctype = mimetypes.guess_type(path)[0] or "application/octet-stream"
        if ctype.startswith("text/") or path.endswith(".js"):
            ctype += "; charset=utf-8"
        with open(path, "rb") as fh:
            self._send(fh.read(), ctype)

    def _common_page(self, sess):
        with open(os.path.join(WWW, "common_page.html"), encoding="utf-8") as fh:
            text = fh.read()
        escaped = zte_hex(sess["sess_token"])
        text = re.sub(
            r'(_sessionTmpToken\s*=\s*")(?:(?:\\x[0-9a-fA-F]{2})+)(")',
            lambda match: match.group(1) + escaped + match.group(2),
            text,
        )
        self._send(text.encode("utf-8"), "text/html; charset=utf-8")

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
            pattern = (r"(<ParaName>%s</ParaName><ParaValue>)([^<]*)(</ParaValue>)"
                       % re.escape(name))

            def replace(mm, token=token):
                value = mm.group(2)
                if value == "":
                    return mm.group(0)
                return mm.group(1) + zte_encrypt(value, token) + mm.group(3)

            text = re.sub(pattern, replace, text)
        return text.encode("utf-8")

    def _serv_data(self, payload: bytes, sess: dict):
        return self._send(self._enc(payload, sess), "text/xml; charset=utf-8")

    def _menu_view(self, rel: str, sess):
        with open(os.path.join(WWW, rel), encoding="utf-8") as fh:
            text = fh.read()
        escaped = zte_hex(sess["sess_token"])
        text = re.sub(
            r'(_sessionTmpToken\s*=\s*")(?:(?:\\x[0-9a-fA-F]{2})+)(")',
            lambda match: match.group(1) + escaped + match.group(2),
            text,
        )
        self._send(text.encode("utf-8"), "text/html; charset=utf-8")

    def do_GET(self):
        bind_user(self._client_key())
        u = urlparse(self.path)
        if self._is_reset_path(u.path):
            return self._reset_session()
        q = parse_qs(u.query)
        typ, tag = q.get("_type", [None])[0], q.get("_tag", [None])[0]
        sid, sess, created = self._session(create=True)

        if u.path == "/" and not typ:
            if sess["logged_in"]:
                return self._common_page(sess)
            with open(os.path.join(WWW, "login_page.html"), "rb") as fh:
                return self._send(fh.read(), "text/html; charset=utf-8", sid=sid if created else None)

        if typ == "loginData" and tag == "login_entry":
            sess["sess_token"] = token(24)
            body = json.dumps({"lockingTime": 0, "loginErrMsg": "", "promptMsg": "",
                               "sess_token": sess["sess_token"]},
                              separators=(",", ":")).encode()
            return self._send(body, "application/json; charset=utf-8",
                              sid=sid if created else None)

        if typ == "loginData" and tag == "login_token":
            sess["login_token"] = token(8)
            body = ("<ajax_response_xml_root>" + sess["login_token"] +
                    "</ajax_response_xml_root>").encode()
            return self._send(body, "text/xml; charset=utf-8", sid=sid if created else None)

        # Tài nguyên giao diện thật được phục vụ cả trước đăng nhập. Thiết bị
        # thật tải jQuery/CSS/ảnh ngay trên trang login.
        if not typ and u.path != "/":
            return self._file(u.path)

        if not sess["logged_in"]:
            return self._send(b"SessionTimeout", "text/plain; charset=utf-8", 401)

        if typ == "menuView" and tag == "statusMgr":
            return self._menu_view("api/statusMgr.html", sess)
        if typ == "menuData" and tag == "devmgr_statusmgr_lua.lua":
            return self._serv_data(device_info_xml(), sess)
        # Internet > Status: cac fragment va response chi doc duoc sao chep
        # nguyen van tu thiet bi that. Cac endpoint nay khong co thao tac ghi.
        views = {
            "ponopticalinfo": "api/ponopticalinfo.html",
            "ethWanStatus": "api/ethWanStatus.html",
            "tunnel4in6Status": "api/tunnel4in6Status.html",
            "l2tpStatus": "api/l2tpStatus.html",
            "conntracks": "api/conntracks.html",
            "localNetStatus": "api/localNetStatus.html",
        }
        data = {
            "optical_info_lua.lua": "api/optical_info.xml",
            "wan_internetstatus_lua.lua": "api/wan_internetstatus.xml",
            "tunnel_4in6_status_lua.lua": "api/tunnel_4in6_status.xml",
            "l2tp_lua.lua": "api/l2tp.xml",
            "firewall_conntrack_lua.lua": "api/firewall_conntrack.xml",
            "status_lan_info_lua.lua": "api/status_lan_info.xml",
            "wlan_wlanstatus_lua.lua": "api/wlan_wlanstatus.xml",
            "wlan_client_stat_lua.lua": "api/wlan_client_stat.xml",
            "accessdev_landevs_lua.lua": "api/accessdev_landevs.xml",
        }
        if typ == "menuView" and tag in views:
            return self._menu_view(views[tag], sess)
        if typ == "menuData" and tag in data:
            return self._serv_data(STORE.internet_status_xml(tag), sess)
        # Cac fragment/API chi doc da crawl tu thiet bi that. Ten tag va ten
        # file duoc giu nguyen; XML duoc tai sinh tu ConfigStore.
        if typ == "menuView" and tag:
            rel = f"api/{tag}.html"
            if os.path.isfile(os.path.join(WWW, rel)):
                return self._menu_view(rel, sess)
        dynamic_tags = {"firewall_homepage_lua.lua", "wlan_homepage_lua.lua",
                        "sntp_data", "networkdiag_ping_lua.lua",
                        "networkdiag_traceroute_lua.lua", "loopback_vlan_lua.lua"}
        if typ == "menuData" and tag == "networkdiag_ping_lua.lua":
            runtime = STORE.get("networkdiag_ping_runtime", {})
            if runtime.get("pending"):
                host = runtime["host"]
                ack = (f"PING&#32;{host}&#32;({host}):&#32;56&#32;data&#32;bytes\n"
                       f"Reply&#32;from&#32;{host}:&#32;bytes=56&#32;ttl=64&#32;time=0.4ms&#32;seq=0\n\n"
                       f"---&#32;{host}&#32;ping&#32;statistics&#32;---\n"
                       "1&#32;packets&#32;transmitted,&#32;1&#32;packets&#32;received,&#32;0%&#32;packet&#32;loss\n"
                       "round-trip&#32;min/avg/max&#32;=&#32;0.4/0.4/0.4&#32;ms\n")
                STORE.update_values(tag, {
                    "PingAck": ack, "SuccessCount": "1", "FailureCount": "0",
                    "DiagnosticsState": "Complete",
                })
                STORE.update_section("networkdiag_ping_runtime", {"pending": False})
            payload = STORE.generic_data(tag)
            return self._serv_data(payload, sess)
        if typ == "menuData" and tag == "networkdiag_traceroute_lua.lua":
            runtime = STORE.get("networkdiag_traceroute_runtime", {})
            if runtime.get("pending"):
                host = runtime["host"]
                result = (f"traceroute&#32;to&#32;{host}&#32;({host}),&#32;30&#32;hops&#32;max,&#32;"
                          "38&#32;byte&#32;packets[IPV4-UDP]\n"
                          f"&#32;1&#32;&#32;&#32;{host}&#32;({host})&#32;&#32;0.267&#32;ms&#32;"
                          "&#32;0.260&#32;ms&#32;&#32;&#32;0.214&#32;ms&#32;\n"
                          "Traceroute&#32;Complete.\n")
                STORE.update_values(tag, {
                    "Flag": "0", "NumberOfPRouteHops": "1",
                    "DiagnosticsState": "Complete", "Result": result,
                })
                STORE.update_section("networkdiag_traceroute_runtime", {"pending": False})
            return self._serv_data(STORE.generic_data(tag), sess)
        if typ == "menuData" and tag == "loopback_vlan_lua.lua":
            return self._serv_data(loopback_vlan_xml(), sess)
        if typ == "menuData" and tag == "route_routestaticipv4_lua.lua":
            return self._serv_data(static_routes_xml(False), sess)
        if typ == "menuData" and tag == "route_routestaticipv6_lua.lua":
            return self._serv_data(static_routes_xml(True), sess)
        if typ in ("menuData", "hiddenData") and tag and tag not in dynamic_tags:
            payload = STORE.generic_data(tag)
            if payload is not None:
                return self._serv_data(payload, sess)
            for suffix, ctype in ((".json", "application/json; charset=utf-8"),
                                  (".hidden", "text/xml; charset=utf-8")):
                rel = f"api/{tag}{suffix}"
                if os.path.isfile(os.path.join(WWW, rel)):
                    return self._file(rel)
        if typ == "menuData" and tag == "firewall_homepage_lua.lua":
            return self._send(firewall_xml(), "text/xml; charset=utf-8")
        if typ == "menuData" and tag == "wlan_homepage_lua.lua":
            return self._send(wlan_xml(), "text/xml; charset=utf-8")
        if typ == "hiddenData" and tag == "sntp_data":
            return self._send(sntp_xml(), "text/xml; charset=utf-8")

        return self._send(b"Not captured", "text/plain; charset=utf-8", 404)

    def do_POST(self):
        bind_user(self._client_key())
        u = urlparse(self.path)
        if self._is_reset_path(u.path):
            return self._reset_session()
        q = parse_qs(u.query)
        typ, tag = q.get("_type", [None])[0], q.get("_tag", [None])[0]
        sid, sess, created = self._session(create=True)
        length = int(self.headers.get("Content-Length", "0") or 0)
        form = parse_qs(self.rfile.read(length).decode("utf-8", "replace"))

        if typ == "loginData" and tag == "login_entry":
            expected = hashlib.sha256(("admin" + (sess.get("login_token") or "")).encode()).hexdigest()
            ok = (form.get("Username", [""])[0] == "admin" and
                  form.get("Password", [""])[0] == expected and
                  form.get("_sessionTOKEN", [""])[0] == sess.get("sess_token"))
            sess["sess_token"] = token(24)
            sess["logged_in"] = bool(ok)
            if ok:
                # The real firmware emits sess_token first; preserve byte-level order.
                data = {"sess_token": sess["sess_token"], "login_need_refresh": True}
            else:
                data = {"lockingTime": -1,
                        "loginErrMsg": " Invalid username/password",
                        "promptMsg": "", "sess_token": sess["sess_token"]}
            return self._send(json.dumps(data, separators=(",", ":")).encode(),
                              "application/json; charset=utf-8", sid=sid if created else None)

        if typ == "loginData" and tag == "logout_entry":
            sess["logged_in"] = False
            sess["sess_token"] = token(24)
            return self._send(b'{"need_refresh":true}', "application/json; charset=utf-8")

        if typ == "menuData" and tag == "sntp_lua.lua":
            if (not sess["logged_in"] or
                    form.get("_sessionTOKEN", [""])[0] != sess.get("sess_token") or
                    form.get("IF_ACTION", [""])[0] != "Apply"):
                return self._send(b"SessionTimeout", "text/plain; charset=utf-8", 401)
            fields = {
                key: values[0]
                for key, values in form.items()
                if key not in {"IF_ACTION", "Btn_cancel", "Btn_apply", "_sessionTOKEN"}
            }
            STORE.update_values(tag, fields)
            STORE.update_section("home", {
                "ntp_server_1": fields.get("NtpServer1", ""),
                "ntp_server_2": fields.get("NtpServer2", ""),
                "zone_index": fields.get("ZoneIndex", "24"),
            })
            payload = STORE.generic_data(tag)
            marker = b"<IF_ERRORID>0</IF_ERRORID>"
            payload = payload.replace(marker, marker + b"<_InstID>IGD</_InstID>", 1)
            return self._send(payload, "text/xml; charset=utf-8")

        if typ == "menuData" and tag == "firewall_alg_lua.lua":
            if (not sess["logged_in"] or
                    form.get("_sessionTOKEN", [""])[0] != sess.get("sess_token") or
                    form.get("IF_ACTION", [""])[0] != "Apply"):
                return self._send(b"SessionTimeout", "text/plain; charset=utf-8", 401)
            fields = {
                key: values[0]
                for key, values in form.items()
                if key.startswith("Is") and key.endswith("Alg")
            }
            STORE.update_values(tag, fields)
            body = (b"<ajax_response_xml_root><INSTIDENTITY>IGD</INSTIDENTITY>"
                    b"<IF_ERRORID>0</IF_ERRORID><IF_ERRORTYPE>SUCC</IF_ERRORTYPE>"
                    b"<IF_ERRORSTR>SUCC</IF_ERRORSTR><IF_ERRORPARAM>SUCC</IF_ERRORPARAM>"
                    b"<_InstID>IGD</_InstID></ajax_response_xml_root>")
            return self._send(body, "text/xml; charset=utf-8")

        if typ == "menuData" and tag == "firewall_config_lua.lua":
            if (not sess["logged_in"] or
                    form.get("_sessionTOKEN", [""])[0] != sess.get("sess_token") or
                    form.get("IF_ACTION", [""])[0] != "Apply"):
                return self._send(b"SessionTimeout", "text/plain; charset=utf-8", 401)
            level = form.get("Level", ["Middle"])[0]
            STORE.update_values(tag, {"Enable": form.get("Enable", ["1"])[0],
                                      "Level": level})
            STORE.update_section("home", {"firewall_level": level})
            body = (b"<ajax_response_xml_root><INSTIDENTITY>IGD</INSTIDENTITY>"
                    b"<IF_ERRORID>0</IF_ERRORID><IF_ERRORTYPE>SUCC</IF_ERRORTYPE>"
                    b"<IF_ERRORSTR>SUCC</IF_ERRORSTR><IF_ERRORPARAM>SUCC</IF_ERRORPARAM>"
                    b"<_InstID>IGD</_InstID></ajax_response_xml_root>")
            return self._send(body, "text/xml; charset=utf-8")

        if typ == "menuData" and tag == "upnp_upnp_lua.lua":
            if (not sess["logged_in"] or
                    form.get("_sessionTOKEN", [""])[0] != sess.get("sess_token") or
                    form.get("IF_ACTION", [""])[0] != "Apply"):
                return self._send(b"SessionTimeout", "text/plain; charset=utf-8", 401)
            fields = {key: form.get(key, [""])[0]
                      for key in ("EnableUPnPIGD", "ADPeriod", "TTL", "LimitEnable")}
            STORE.update_values(tag, fields)
            body = (b"<ajax_response_xml_root><INSTIDENTITY>IGD</INSTIDENTITY>"
                    b"<IF_ERRORID>0</IF_ERRORID><IF_ERRORTYPE>SUCC</IF_ERRORTYPE>"
                    b"<IF_ERRORSTR>SUCC</IF_ERRORSTR><IF_ERRORPARAM>SUCC</IF_ERRORPARAM>"
                    b"<_InstID>IGD</_InstID></ajax_response_xml_root>")
            return self._send(body, "text/xml; charset=utf-8")

        if typ == "menuData" and tag == "bpdu_lua.lua":
            if (not sess["logged_in"] or
                    form.get("_sessionTOKEN", [""])[0] != sess.get("sess_token") or
                    form.get("IF_ACTION", [""])[0] != "Apply"):
                return self._send(b"SessionTimeout", "text/plain; charset=utf-8", 401)
            STORE.update_values(tag, {"BPDUEnable": form.get("BPDUEnable", ["1"])[0]})
            body = (b"<ajax_response_xml_root><INSTIDENTITY>IGD</INSTIDENTITY>"
                    b"<IF_ERRORID>0</IF_ERRORID><IF_ERRORTYPE>SUCC</IF_ERRORTYPE>"
                    b"<IF_ERRORSTR>SUCC</IF_ERRORSTR><IF_ERRORPARAM>SUCC</IF_ERRORPARAM>"
                    b"</ajax_response_xml_root>")
            return self._send(body, "text/xml; charset=utf-8")

        if typ == "menuData" and tag == "networkdiag_ping_lua.lua":
            if (not sess["logged_in"] or
                    form.get("_sessionTOKEN", [""])[0] != sess.get("sess_token") or
                    form.get("IF_ACTION", [""])[0] != "PingDiagnosis"):
                return self._send(b"SessionTimeout", "text/plain; charset=utf-8", 401)
            fields = {key: form.get(key, [""])[0]
                      for key in ("_InstID", "Host", "NumofRepeat", "DataBlockSize",
                                  "Interface", "Timeout")}
            fields.update({"PingAck": "NULL", "MinimumResponseTime": "0",
                           "MaximumResponseTime": "0", "AverageResponseTime": "0",
                           "SuccessCount": "0", "FailureCount": "0",
                           "DiagnosticsState": "Requested", "DSCP": "255"})
            STORE.update_values(tag, fields)
            STORE.update_section("networkdiag_ping_runtime",
                                 {"pending": True, "host": fields["Host"]})
            xml = STORE.generic_data(tag).decode("utf-8")
            obj = re.search(r"(<OBJ_DEVPING_ID>.*</OBJ_DEVPING_ID>)", xml).group(1)
            body = ("<ajax_response_xml_root><INSTIDENTITY></INSTIDENTITY>"
                    "<IF_ERRORID>0</IF_ERRORID><IF_ERRORTYPE>SUCC</IF_ERRORTYPE>"
                    "<IF_ERRORSTR>SUCC</IF_ERRORSTR><IF_ERRORPARAM>SUCC</IF_ERRORPARAM>" +
                    obj + "</ajax_response_xml_root>")
            return self._send(body.encode("utf-8"), "text/xml; charset=utf-8")

        if typ == "menuData" and tag == "networkdiag_traceroute_lua.lua":
            if (not sess["logged_in"] or
                    form.get("_sessionTOKEN", [""])[0] != sess.get("sess_token") or
                    form.get("IF_ACTION", [""])[0] != "TraceRouteDiagnosis"):
                return self._send(b"SessionTimeout", "text/plain; charset=utf-8", 401)
            fields = {key: form.get(key, [""])[0]
                      for key in ("_InstID", "Host", "Interface", "Timeout",
                                  "MaxHopCount", "Protocol", "Control")}
            fields.update({"DataBlockSize": "38", "DSCP": "0", "Port": "0",
                           "NumberOfTries": "3", "Flag": "1", "ResponseTime": "0",
                           "NumberOfPRouteHops": "0", "DiagnosticsState": "Requested",
                           "Result": "NULL"})
            STORE.update_values(tag, fields)
            STORE.update_section("networkdiag_traceroute_runtime",
                                 {"pending": True, "host": fields["Host"]})
            xml = STORE.generic_data(tag).decode("utf-8")
            obj = re.search(r"(<OBJ_TRACERT_ID>.*</OBJ_TRACERT_ID>)", xml).group(1)
            body = ("<ajax_response_xml_root><INSTIDENTITY></INSTIDENTITY>"
                    "<IF_ERRORID>0</IF_ERRORID><IF_ERRORTYPE>SUCC</IF_ERRORTYPE>"
                    "<IF_ERRORSTR>SUCC</IF_ERRORSTR><IF_ERRORPARAM>SUCC</IF_ERRORPARAM>" +
                    obj + "</ajax_response_xml_root>")
            return self._send(body.encode("utf-8"), "text/xml; charset=utf-8")

        if typ == "menuData" and tag == "networkdiag_svcsimulation_lua.lua":
            action = form.get("IF_ACTION", [""])[0]
            if (not sess["logged_in"] or
                    form.get("_sessionTOKEN", [""])[0] != sess.get("sess_token") or
                    action not in {"PPPoE_APPLY", ""}):
                return self._send(b"SessionTimeout", "text/plain; charset=utf-8", 401)
            if action == "PPPoE_APPLY":
                STORE.update_values(tag, {
                    "RetryTimes": form.get("RetryTimes", ["1"])[0],
                    "PortViewName": form.get("PortViewName", [""])[0],
                    "IPMode": form.get("IPMode", ["IPv4"])[0],
                    "SimulationType": "1", "AuthType": form.get("AuthType", ["0"])[0],
                    "OptLen": form.get("OptLen", ["0"])[0], "PortState": "1",
                    "Issucceed": "0", "FailReason": "", "UserName": "******",
                    "PassWord": "******", "SimuMAC": "00:00:00:00:00:00",
                })
                STORE.update_section("networkdiag_simulation_runtime", {"polls": 0})
            else:
                runtime = STORE.get("networkdiag_simulation_runtime", {"polls": 0})
                polls = int(runtime.get("polls", 0)) + 1
                STORE.update_section("networkdiag_simulation_runtime", {"polls": polls})
                if polls >= 2:
                    STORE.update_values(tag, {
                        "FailReason": "Receive&#32;PADO&#32;timeOut",
                        "SimuMAC": "84:3c:99:29:0e:aa", "PortState": "3",
                        "Issucceed": "0",
                    })
            return self._send(STORE.generic_data(tag), "text/xml; charset=utf-8")

        if typ == "menuData" and tag == "mirror_mirrormgr_lua.lua":
            if (not sess["logged_in"] or
                    form.get("_sessionTOKEN", [""])[0] != sess.get("sess_token") or
                    form.get("IF_ACTION", [""])[0] != "Apply"):
                return self._send(b"SessionTimeout", "text/plain; charset=utf-8", 401)
            fields = {key: form.get(key, [""])[0]
                      for key in ("_InstID", "MirrorEnable", "MirrorSrc", "MirrorDest")}
            STORE.update_values(tag, fields)
            body = (b"<ajax_response_xml_root><INSTIDENTITY>IGD</INSTIDENTITY>"
                    b"<IF_ERRORID>0</IF_ERRORID><IF_ERRORTYPE>SUCC</IF_ERRORTYPE>"
                    b"<IF_ERRORSTR>SUCC</IF_ERRORSTR><IF_ERRORPARAM>SUCC</IF_ERRORPARAM>"
                    b"<_InstID>IGD</_InstID></ajax_response_xml_root>")
            return self._send(body, "text/xml; charset=utf-8")

        if (typ == "menuData" and
                tag in {"route_routestaticipv4_lua.lua",
                        "route_routestaticipv6_lua.lua"}):
            action = form.get("IF_ACTION", [""])[0]
            if (not sess["logged_in"] or
                    form.get("_sessionTOKEN", [""])[0] != sess.get("sess_token") or
                    action not in {"Apply", "Delete"}):
                return self._send(b"SessionTimeout", "text/plain; charset=utf-8", 401)
            ipv6 = tag == "route_routestaticipv6_lua.lua"
            section = "routing_ipv6_static" if ipv6 else "routing_ipv4_static"
            state = STORE.get(section, {"next_id": 1, "items": []})
            inst_id = form.get("_InstID", ["-1"])[0]
            if action == "Apply":
                if inst_id == "-1":
                    suffix = "IPV6FWD" if ipv6 else "IPV4FWD"
                    inst_id = f"DEV.ROUTING.RT1.{suffix}{state['next_id']}"
                    state["next_id"] += 1
                    route = {"_InstID": inst_id}
                    state["items"].append(route)
                else:
                    route = next((item for item in state["items"]
                                  if item["_InstID"] == inst_id), None)
                    if route is None:
                        route = {"_InstID": inst_id}
                        state["items"].append(route)
                keys = (["Type", "Enable", "Alias", "Interface", "DestIP",
                         "PrefixLen", "GWIP"] if ipv6 else
                        ["DestIP", "DestIPMask", "GWIP", "Type", "Enable",
                         "Alias", "Interface"])
                route.update({key: form.get(key, [""])[0] for key in keys})
                STORE.update_section(section, state)
                body = (f"<ajax_response_xml_root><INSTIDENTITY>{inst_id}</INSTIDENTITY>"
                        "<IF_ERRORID>0</IF_ERRORID><IF_ERRORTYPE>SUCC</IF_ERRORTYPE>"
                        "<IF_ERRORSTR>SUCC</IF_ERRORSTR><IF_ERRORPARAM>SUCC</IF_ERRORPARAM>"
                        f"<_InstID>{inst_id}</_InstID></ajax_response_xml_root>").encode()
            else:
                state["items"] = [item for item in state["items"]
                                  if item["_InstID"] != inst_id]
                STORE.update_section(section, state)
                body = (b"<ajax_response_xml_root><IF_ERRORPARAM>SUCC</IF_ERRORPARAM>"
                        b"<IF_ERRORTYPE>SUCC</IF_ERRORTYPE><IF_ERRORSTR>SUCC</IF_ERRORSTR>"
                        b"<IF_ERRORID>0</IF_ERRORID><_InstID></_InstID>"
                        b"</ajax_response_xml_root>")
            return self._send(body, "text/xml; charset=utf-8")

        if typ == "menuData" and tag == "loopback_vlan_lua.lua":
            action = form.get("IF_ACTION", [""])[0]
            if (not sess["logged_in"] or
                    form.get("_sessionTOKEN", [""])[0] != sess.get("sess_token") or
                    action not in {"Apply", "Delete"}):
                return self._send(b"SessionTimeout", "text/plain; charset=utf-8", 401)
            state = STORE.get("loopback_vlans", {"next_id": 1, "items": []})
            if action == "Apply":
                inst_id = form.get("_InstID", ["-1"])[0]
                if inst_id == "-1":
                    inst_id = f"DEV.LOOP.VLAN{state['next_id']}"
                    state["next_id"] += 1
                    state["items"].append({
                        "_InstID": inst_id,
                        "vlanCount": form.get("vlanCount", ["1"])[0],
                        "PortID": form.get("PortID", [""])[0],
                        "VidStr": form.get("VidStr", [""])[0],
                    })
                else:
                    for item in state["items"]:
                        if item["_InstID"] == inst_id:
                            item.update({"PortID": form.get("PortID", [""])[0],
                                         "VidStr": form.get("VidStr", [""])[0]})
                STORE.update_section("loopback_vlans", state)
                body = (f"<ajax_response_xml_root><INSTIDENTITY>{inst_id}</INSTIDENTITY>"
                        "<IF_ERRORID>0</IF_ERRORID><IF_ERRORTYPE>SUCC</IF_ERRORTYPE>"
                        "<IF_ERRORSTR>SUCC</IF_ERRORSTR><IF_ERRORPARAM>SUCC</IF_ERRORPARAM>"
                        f"<_InstID>{inst_id}</_InstID></ajax_response_xml_root>").encode()
            else:
                inst_id = form.get("_InstID", [""])[0]
                state["items"] = [item for item in state["items"]
                                  if item["_InstID"] != inst_id]
                STORE.update_section("loopback_vlans", state)
                body = (b"<ajax_response_xml_root><IF_ERRORPARAM>SUCC</IF_ERRORPARAM>"
                        b"<IF_ERRORTYPE>SUCC</IF_ERRORTYPE><IF_ERRORSTR>SUCC</IF_ERRORSTR>"
                        b"<IF_ERRORID>0</IF_ERRORID><_InstID></_InstID>"
                        b"</ajax_response_xml_root>")
            return self._send(body, "text/xml; charset=utf-8")

        if typ == "menuData" and tag == "loopback_basic_lua.lua":
            if (not sess["logged_in"] or
                    form.get("_sessionTOKEN", [""])[0] != sess.get("sess_token") or
                    form.get("IF_ACTION", [""])[0] != "Apply"):
                return self._send(b"SessionTimeout", "text/plain; charset=utf-8", 401)
            fields = {key: form.get(key, [""])[0]
                      for key in ("_InstID", "Ethertype", "DMac", "Sendinterval",
                                  "RenewTime", "CheckInterval")}
            STORE.update_values(tag, fields)
            body = (b"<ajax_response_xml_root><INSTIDENTITY>IGD</INSTIDENTITY>"
                    b"<IF_ERRORID>0</IF_ERRORID><IF_ERRORTYPE>SUCC</IF_ERRORTYPE>"
                    b"<IF_ERRORSTR>SUCC</IF_ERRORSTR><IF_ERRORPARAM>SUCC</IF_ERRORPARAM>"
                    b"</ajax_response_xml_root>")
            return self._send(body, "text/xml; charset=utf-8")

        if typ == "menuData" and tag == "loopback_enable_lua.lua":
            if (not sess["logged_in"] or
                    form.get("_sessionTOKEN", [""])[0] != sess.get("sess_token") or
                    form.get("IF_ACTION", [""])[0] != "Apply"):
                return self._send(b"SessionTimeout", "text/plain; charset=utf-8", 401)
            count = int(form.get("_InstNum", ["0"])[0] or 0)
            last_inst = ""
            for index in range(count):
                last_inst = form.get(f"_InstID_{index}", [""])[0]
                fields = {key: form.get(f"{key}_{index}", [""])[0]
                          for key in ("_InstID", "IFID", "PortLoopbackEnable",
                                      "PortAlarmEnable", "PortDisLoopedEnable")}
                STORE.update_instance_values(tag, index, fields)
            body = (f"<ajax_response_xml_root><INSTIDENTITY>{xml_escape(last_inst)}</INSTIDENTITY>"
                    "<IF_ERRORID>0</IF_ERRORID><IF_ERRORTYPE>SUCC</IF_ERRORTYPE>"
                    "<IF_ERRORSTR>SUCC</IF_ERRORSTR><IF_ERRORPARAM>SUCC</IF_ERRORPARAM>"
                    "</ajax_response_xml_root>").encode("utf-8")
        lab_tags = {
            "wan_internet_lua.lua",
            "wlan_wlansssidconf_lua.lua",
            "wlan_wlanbasiconoff_lua.lua",
            "wlan_wlanbasicadconf_lua.lua",
            "dns_localdns_lua.lua",
            "Localnet_LanMgrIpv4_DHCPBasicCfg_lua.lua",
            "firewall_portforwarding_lua.lua",
        }
        if typ == "menuData" and tag in lab_tags:
            action = form.get("IF_ACTION", [""])[0]
            if (not sess["logged_in"] or
                    form.get("_sessionTOKEN", [""])[0] != sess.get("sess_token") or
                    action not in {"Apply", "Delete", "Add"}):
                return self._send(b"SessionTimeout", "text/plain; charset=utf-8", 401)
            fields = {
                key: values[0]
                for key, values in form.items()
                if key not in {"IF_ACTION", "Btn_cancel", "Btn_apply", "_sessionTOKEN"}
            }
            inst_id = form.get("_InstID", ["IGD"])[0]
            if inst_id == "-1":
                inst_id = "DEV.INST1"
            STORE.update_values(tag, fields)
            body = (f"<ajax_response_xml_root><INSTIDENTITY>{xml_escape(inst_id)}</INSTIDENTITY>"
                    f"<IF_ERRORID>0</IF_ERRORID><IF_ERRORTYPE>SUCC</IF_ERRORTYPE>"
                    f"<IF_ERRORSTR>SUCC</IF_ERRORSTR><IF_ERRORPARAM>SUCC</IF_ERRORPARAM>"
                    f"<_InstID>{xml_escape(inst_id)}</_InstID></ajax_response_xml_root>").encode("utf-8")
            return self._send(body, "text/xml; charset=utf-8")

        return self._send(b"Not captured", "text/plain; charset=utf-8", 404)


if __name__ == "__main__":
    server = ThreadingHTTPServer(("0.0.0.0", PORT), Handler)
    server.daemon_threads = True
    print("=" * 62)
    print("  AX3000GZ_V2 - ZTE F6201B V9.3.10P6N16")
    print(f"  http://localhost:{PORT}/   (admin/admin)")
    print("  Pham vi: Login + Home + Management/Status")
    print("=" * 62)
    try:
        server.serve_forever()
    except KeyboardInterrupt:
        pass
