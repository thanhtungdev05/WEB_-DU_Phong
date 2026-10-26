#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
MAY CHU GIA LAP — ONT AX1800GZ (ZTE F6600)
==========================================
Chay:  python server.py [cong]     (mac dinh: 8086)
Mo:    http://localhost:8086/
"""
import os
import sys
import json
import hashlib
import secrets
import mimetypes
import urllib.parse
from http.server import BaseHTTPRequestHandler, ThreadingHTTPServer

try:
    sys.stdout.reconfigure(encoding='utf-8', errors='backslashreplace')
    sys.stderr.reconfigure(encoding='utf-8', errors='backslashreplace')
except Exception:
    pass

_HERE = os.path.dirname(os.path.abspath(__file__))
try:
    from .config_store import KHO
    from . import render
except ImportError:
    if _HERE not in sys.path:
        sys.path.insert(0, _HERE)
    from config_store import KHO
    import render

_DEV = os.path.abspath(os.path.join(_HERE, ".."))
ROOT = _DEV
_REF_HTML = os.path.join(_DEV, "reference", "html")
_REF_JS = os.path.join(_DEV, "reference", "js")
_REF_CSS = os.path.join(_DEV, "reference", "css")
_REF_IMG = os.path.join(_DEV, "reference", "img")
_REF_FONTS = os.path.join(_DEV, "reference", "fonts")

CONG = int(sys.argv[1]) if (len(sys.argv) > 1 and sys.argv[1].isdigit()) else 8086

# Quan ly phien dang nhap theo SID cookie
_phien_xac_thuc = set()
_current_nonce = "78389087"


class ZteF6600Handler(BaseHTTPRequestHandler):
    def _strip_sim_prefix(self, raw_path):
        for prefix in ("/sim_ax1800gz", "/ax1800gz"):
            if raw_path == prefix:
                return "/"
            if raw_path.startswith(prefix + "/"):
                return raw_path[len(prefix):]
            if raw_path.startswith(prefix + "?"):
                return "/" + raw_path[len(prefix):]
        return raw_path

    def _get_cookie_sid(self):
        cookie_hdr = self.headers.get("Cookie", "")
        for pair in cookie_hdr.split(";"):
            parts = pair.strip().split("=", 1)
            if len(parts) == 2 and parts[0] == "SID":
                return parts[1]
        return None

    def _is_authenticated(self):
        sid = self._get_cookie_sid()
        return sid in _phien_xac_thuc if sid else False

    def _ensure_lab_authenticated(self):
        sid = self._get_cookie_sid()
        if not sid:
            sid = secrets.token_hex(32)
        _phien_xac_thuc.add(sid)
        return sid

    def _send_xml(self, content, status=200):
        data = content.encode("utf-8") if isinstance(content, str) else content
        self.send_response(status)
        self.send_header("Content-Type", "text/xml; charset=utf-8")
        self.send_header("Content-Length", str(len(data)))
        self.send_header("Cache-Control", "no-cache, no-store, must-revalidate")
        self.end_headers()
        self.wfile.write(data)

    def _send_json(self, data_dict, status=200, set_sid=None):
        data = json.dumps(data_dict, ensure_ascii=False).encode("utf-8")
        self.send_response(status)
        self.send_header("Content-Type", "application/json; charset=utf-8")
        self.send_header("Content-Length", str(len(data)))
        self.send_header("Cache-Control", "no-store")
        if set_sid:
            self.send_header("Set-Cookie", f"SID={set_sid}; Path=/; HttpOnly; SameSite=Lax")
            self.send_header("Set-Cookie", "_TESTCOOKIESUPPORT=1; Path=/; SameSite=Lax")
        self.end_headers()
        self.wfile.write(data)

    def _send_html(self, content, status=200):
        data = content.encode("utf-8") if isinstance(content, str) else content
        self.send_response(status)
        self.send_header("Content-Type", "text/html; charset=utf-8")
        self.send_header("Content-Length", str(len(data)))
        self.send_header("X-Frame-Options", "SAMEORIGIN")
        self.end_headers()
        self.wfile.write(data)

    def _send_static(self, filepath, mime=None):
        if not os.path.exists(filepath):
            self.send_error(404, "File not found")
            return
        if not mime:
            mime, _ = mimetypes.guess_type(filepath)
            if not mime:
                lower = filepath.lower()
                if lower.endswith(".js"):
                    mime = "application/javascript"
                elif lower.endswith(".css"):
                    mime = "text/css"
                elif lower.endswith(".ico"):
                    mime = "image/x-icon"
                elif lower.endswith(".gif"):
                    mime = "image/gif"
                elif lower.endswith(".png"):
                    mime = "image/png"
                elif lower.endswith(".ttf"):
                    mime = "font/ttf"
                elif lower.endswith(".woff2"):
                    mime = "font/woff2"
                elif lower.endswith(".woff"):
                    mime = "font/woff"
                elif lower.endswith(".eot"):
                    mime = "application/vnd.ms-fontobject"
                elif lower.endswith(".svg"):
                    mime = "image/svg+xml"
                else:
                    mime = "application/octet-stream"

        with open(filepath, "rb") as f:
            data = f.read()

        self.send_response(200)
        self.send_header("Content-Type", mime)
        self.send_header("Content-Length", str(len(data)))
        self.send_header("Cache-Control", "public, max-age=86400")
        self.end_headers()
        self.wfile.write(data)

    def _handle_reset(self):
        KHO.khoi_phuc_xuat_xuong()
        _phien_xac_thuc.clear()
        self._send_json({"status": "ok", "message": "Reset to factory"})

    def do_GET(self):
        clean_url = self._strip_sim_prefix(self.path)
        parsed = urllib.parse.urlparse(clean_url)
        path = parsed.path
        qs = urllib.parse.parse_qs(parsed.query)
        _type = qs.get("_type", [None])[0]
        _tag = qs.get("_tag", [None])[0]

        if path in ("/api/reset", "/reset_lab") or qs.get("reset", [None])[0] == "1":
            self._handle_reset()
            return

        # 1. Tai nguyen tinh
        if path == "/favicon.ico":
            self._send_static(os.path.join(_REF_IMG, "favicon.ico"), "image/x-icon")
            return

        if path.startswith("/jquery/"):
            fname = os.path.basename(path)
            self._send_static(os.path.join(_REF_JS, fname))
            return

        if path.startswith("/css/"):
            fname = os.path.basename(path)
            self._send_static(os.path.join(_REF_CSS, fname))
            return

        if path.startswith("/img/"):
            fname = os.path.basename(path)
            self._send_static(os.path.join(_REF_IMG, fname))
            return

        if path.startswith("/fonts/"):
            fname = os.path.basename(path)
            self._send_static(os.path.join(_REF_FONTS, fname))
            return

        # Direct image/font fallback at root (e.g. /logo_fpt.png, /HGW.png)
        if any(path.lower().endswith(ext) for ext in [".png", ".gif", ".jpg", ".jpeg", ".ico", ".svg"]):
            fname = os.path.basename(path)
            fpath = os.path.join(_REF_IMG, fname)
            if os.path.exists(fpath):
                self._send_static(fpath)
                return

        if any(path.lower().endswith(ext) for ext in [".ttf", ".woff", ".woff2", ".eot"]):
            fname = os.path.basename(path)
            fpath = os.path.join(_REF_FONTS, fname)
            if os.path.exists(fpath):
                self._send_static(fpath)
                return

        # 2. Login token endpoint
        if _type == "loginData" and _tag == "login_token":
            global _current_nonce
            _current_nonce = str(secrets.randbelow(89999999) + 10000000)
            xml_token = f"<ajax_response_xml_root>{_current_nonce}</ajax_response_xml_root>"
            self._send_xml(xml_token)
            return

        # 3. Kiem tra phien login_entry status
        if _type == "loginData" and _tag == "login_entry":
            self._send_json({"loginErrMsg": "", "lockingTime": -1, "promptMsg": "", "sess_token": ""})
            return

        # 4. View endpoint (menuView)
        if _type == "menuView" and _tag:
            if not self._is_authenticated():
                self._ensure_lab_authenticated()
            html_view = render.render_view(_tag)
            if html_view is not None:
                self._send_html(html_view)
            else:
                self.send_error(404, "View Not Found")
            return

        # 5. Data endpoint (menuData & hiddenData)
        if (_type == "menuData" or _type == "hiddenData") and _tag:
            if not self._is_authenticated():
                self._ensure_lab_authenticated()
            xml_data = render.render_data(_tag)
            if xml_data is not None:
                self._send_xml(xml_data)
            else:
                self._send_xml("<ajax_response_xml_root><IF_ERRORPARAM>SUCC</IF_ERRORPARAM><IF_ERRORTYPE>SUCC</IF_ERRORTYPE><IF_ERRORSTR>SUCC</IF_ERRORSTR></ajax_response_xml_root>")
            return

        # 6. Trang chu / va cac duong dan goc (/index.html, /login, /login.html)
        if path in ("", "/", "/index.html", "/login", "/login.html", "/login-page.html"):
            if qs.get("logout", [None])[0] == "1":
                sid = self._get_cookie_sid()
                if sid in _phien_xac_thuc:
                    _phien_xac_thuc.remove(sid)
            elif qs.get("autologin", [None])[0] == "1":
                self._ensure_lab_authenticated()

            if self._is_authenticated() and path not in ("/login", "/login.html", "/login-page.html"):
                auth_file = os.path.join(_REF_HTML, "root.html")
                with open(auth_file, "r", encoding="utf-8", errors="ignore") as f:
                    content = f.read()
                self._send_html(content)
            else:
                unauth_file = os.path.join(_REF_HTML, "unauth_root.html")
                with open(unauth_file, "r", encoding="utf-8", errors="ignore") as f:
                    content = f.read()
                self._send_html(content)
            return

        self.send_error(404, "Not Found")

    def do_POST(self):
        clean_url = self._strip_sim_prefix(self.path)
        parsed = urllib.parse.urlparse(clean_url)
        path = parsed.path
        qs = urllib.parse.parse_qs(parsed.query)
        _type = qs.get("_type", [None])[0]
        _tag = qs.get("_tag", [None])[0]

        if path in ("/api/reset", "/reset_lab") or qs.get("reset", [None])[0] == "1":
            self._handle_reset()
            return

        length = int(self.headers.get("Content-Length", 0) or 0)
        body = self.rfile.read(length) if length > 0 else b""
        params = urllib.parse.parse_qs(body.decode("utf-8", "ignore"), keep_blank_values=True)

        def pval(key, default=None):
            return params[key][0] if key in params and params[key] else default

        # 1. Dang nhap
        if _type == "loginData" and _tag == "login_entry":
            username = pval("Username", "")
            password_hash = pval("Password", "")

            expected_pwd = KHO.doc("auth.admin", "admin")
            expected_hash = hashlib.sha256((expected_pwd + _current_nonce).encode("utf-8")).hexdigest()

            if (username in ("admin", "") and (password_hash == expected_hash or password_hash == expected_pwd)):
                new_sid = secrets.token_hex(32)
                _phien_xac_thuc.add(new_sid)
                new_sess_token = secrets.token_urlsafe(18)[:24]
                res_data = {"sess_token": new_sess_token, "login_need_refresh": True}
                self._send_json(res_data, status=200, set_sid=new_sid)
            else:
                err_data = {"lockingTime": -1, "loginErrMsg": " Invalid username/password", "promptMsg": "", "sess_token": ""}
                self._send_json(err_data, status=200)
            return

        # 2. Dang xuat / Doi che do / Doi ngon ngu
        if _type == "loginData" and _tag == "logout_entry":
            sid = self._get_cookie_sid()
            if sid in _phien_xac_thuc:
                _phien_xac_thuc.remove(sid)
            self._send_json({"need_refresh": 1})
            return

        if (_type == "loginData" and _tag == "modeswitch_entry") or (_type == "hiddenData" and _tag == "switchlang_entry"):
            self._send_json({"need_refresh": 1})
            return

        # 3. Luu cau hinh menuData
        if _type == "menuData" and _tag:
            if not self._is_authenticated():
                self._ensure_lab_authenticated()

            action = pval("IF_ACTION", "Apply")
            inst_id_out = pval("_InstID", "")

            if _tag == "wan_internet_lua.lua":
                instances = list(KHO.doc("wan_instances", []))
                req_inst = pval("_InstID", "-1")
                if action == "Delete":
                    instances = [it for it in instances if it.get("_InstID") != req_inst]
                    KHO.ghi("wan_instances", instances)
                else:
                    target = None
                    for it in instances:
                        if it.get("_InstID") == req_inst:
                            target = it
                            break
                    if target is None:
                        next_idx = len(instances) + 1
                        inst_id_out = f"IGD.WD1.WCD{next_idx}.WCPPP1"
                        target = {
                            "_InstID": inst_id_out,
                            "WANCName": "FPT_Internet",
                            "Enable": "1",
                            "mode": "route",
                            "ServList": "1",
                            "StrServList": "INTERNET",
                            "linkMode": "PPP",
                            "TransType": "PPPoE",
                            "wantype": "pppoe",
                            "uplink": "2",
                            "pageType": "0",
                            "MTU": "1492",
                            "UserName": "",
                            "Password": "",
                            "AuthType": "PAP,CHAP,MS-CHAP",
                            "ConnTrigger": "AlwaysOn",
                            "IpMode": "Both",
                            "IsNAT": "1",
                            "VlanEnable": "0",
                            "VLANID": "0",
                            "Priority": "0",
                            "IsDefGW": "1",
                            "IsPD": "1",
                            "IsSLAAC": "1",
                            "IsGUA": "1",
                            "IsPdAddr": "1",
                            "IPv6AcquireMode": "Auto",
                            "Unnumbered": "0",
                            "EchoTime": "30",
                            "EchoRetry": "3"
                        }
                        instances.append(target)
                    else:
                        inst_id_out = target["_InstID"]

                    for field in ("WANCName", "Enable", "mode", "ServList", "MTU", "linkMode", "TransType",
                                  "UserName", "Password", "AuthType", "ConnTrigger", "IpMode", "IsNAT",
                                  "VlanEnable", "VLANID", "Priority", "IsPD", "Unnumbered", "IsSLAAC",
                                  "IsGUA", "IsPdAddr", "IPv6AcquireMode"):
                        val = pval(field)
                        if val is not None:
                            if field == "Password" and val.strip() == "":
                                continue
                            target[field] = val
                    KHO.ghi("wan_instances", instances)

            elif _tag == "firewall_dmz_lua.lua":
                if "Enable" in params:
                    KHO.ghi("dmz.enable", pval("Enable", "0"))
                if "InternalClient" in params:
                    KHO.ghi("dmz.ip", pval("InternalClient", "192.168.1.100"))
                elif "HostIPAddress" in params:
                    KHO.ghi("dmz.ip", pval("HostIPAddress", "192.168.1.100"))

            elif _tag == "firewall_portforwarding_lua.lua":
                rules = list(KHO.doc("port_forwarding", []))
                req_inst = pval("_InstID", "-1")
                if action == "Delete":
                    rules = [r for r in rules if r.get("_InstID") != req_inst]
                    KHO.ghi("port_forwarding", rules)
                else:
                    target = None
                    for r in rules:
                        if r.get("_InstID") == req_inst:
                            target = r
                            break
                    if target is None:
                        next_idx = len(rules) + 1
                        inst_id_out = f"IGD.FWPM{next_idx}"
                        target = {
                            "_InstID": inst_id_out,
                            "Enable": "1",
                            "Alias": "",
                            "Protocol": "BOTH",
                            "AllInterface": "1",
                            "Interface": "WANAll",
                            "RemoteHost": "0.0.0.0",
                            "RemoteHostEndRange": "0.0.0.0",
                            "InternalClient": "",
                            "ExternalPort": "",
                            "ExternalPortEndRange": "",
                            "InternalPort": "",
                            "InternalPortEndRange": "",
                        }
                        rules.append(target)
                    else:
                        inst_id_out = target["_InstID"]

                    for field in ("Enable", "Alias", "Description", "Protocol", "AllInterface", "Interface",
                                  "RemoteHost", "RemoteHostEndRange", "InternalClient",
                                  "ExternalPort", "ExternalPortEndRange", "InternalPort", "InternalPortEndRange"):
                        val = pval(field)
                        if val is not None:
                            target[field] = val
                    KHO.ghi("port_forwarding", rules)

            elif _tag == "wlan_wlansssidconf_lua.lua":
                inst_id = pval("_InstID", "DEV.WIFI.AP1")
                if inst_id == "DEV.WIFI.AP2":
                    prefix = "wlan24_ssid2"
                elif inst_id == "DEV.WIFI.AP5":
                    prefix = "wlan5"
                else:
                    prefix = "wlan24"

                if "Enable" in params:
                    KHO.ghi(f"{prefix}.enable", pval("Enable", "1"))
                if "ESSID" in params:
                    KHO.ghi(f"{prefix}.ssid", pval("ESSID", ""))
                if "ESSIDHideEnable" in params:
                    KHO.ghi(f"{prefix}.hide", pval("ESSIDHideEnable", "0"))
                if "BeaconType" in params:
                    KHO.ghi(f"{prefix}.beacon_type", pval("BeaconType", "WPAand11i"))
                if "11iEncryptType" in params:
                    KHO.ghi(f"{prefix}.encrypt_11i", pval("11iEncryptType", "TKIPandAESEncryption"))
                if "WPAEncryptType" in params:
                    KHO.ghi(f"{prefix}.encrypt_wpa", pval("WPAEncryptType", "TKIPandAESEncryption"))
                if "KeyPassphrase" in params and pval("KeyPassphrase", "").strip() != "":
                    KHO.ghi(f"{prefix}.password", pval("KeyPassphrase", ""))

            elif _tag == "Localnet_LanMgrIpv4_DHCPBasicCfg_lua.lua":
                if "IPAddr" in params:
                    KHO.ghi("lan.ip", pval("IPAddr", "192.168.1.1"))
                if "SubMask" in params:
                    KHO.ghi("lan.mask", pval("SubMask", "255.255.255.0"))
                if "ServerEnable" in params:
                    KHO.ghi("lan.dhcp_enable", pval("ServerEnable", "1"))
                if "MinAddress" in params:
                    KHO.ghi("lan.dhcp_start", pval("MinAddress", "192.168.1.2"))
                if "MaxAddress" in params:
                    KHO.ghi("lan.dhcp_end", pval("MaxAddress", "192.168.1.254"))
                if "LeaseTime" in params:
                    KHO.ghi("lan.lease_time", pval("LeaseTime", "86400"))
                if "DnsServerSource" in params:
                    KHO.ghi("lan.dns_source", pval("DnsServerSource", "0"))
                if "DNSServer1" in params:
                    KHO.ghi("lan.dns1", pval("DNSServer1", "8.8.8.8"))
                if "DNSServer2" in params:
                    KHO.ghi("lan.dns2", pval("DNSServer2", "8.8.4.4"))

            elif _tag == "devauth_accountmgr_lua.lua":
                if "Password" in params:
                    KHO.ghi("auth.admin", pval("Password", "admin"))

            inst_tag = f"<_InstID>{inst_id_out}</_InstID>\n" if inst_id_out and inst_id_out != "-1" else ""
            succ_xml = ("<ajax_response_xml_root>\n"
                        "<IF_ERRORPARAM>SUCC</IF_ERRORPARAM>\n"
                        "<IF_ERRORTYPE>SUCC</IF_ERRORTYPE>\n"
                        "<IF_ERRORSTR>SUCC</IF_ERRORSTR>\n"
                        "<IF_ERRORID>0</IF_ERRORID>\n"
                        f"{inst_tag}"
                        "</ajax_response_xml_root>")
            self._send_xml(succ_xml)
            return

        self.send_error(404, "Endpoint Not Found")

    def log_message(self, format, *args):
        sys.stdout.write(f"[{self.log_date_time_string()}] {self.address_string()} {format % args}\n")
        sys.stdout.flush()


def main():
    print("=" * 66)
    print("  MAY CHU GIA LAP -- ONT AX1800GZ (ZTE F6600)")
    print("  Firmware: V9.0.11P2N15B (ZTE Corporation)")
    print(f"  Mo trinh duyet: http://localhost:{CONG}/")
    print(f"  Tai khoan     : admin / {KHO.doc('auth.admin', 'admin')}")
    print("=" * 66)
    srv = ThreadingHTTPServer(("0.0.0.0", CONG), ZteF6600Handler)
    try:
        srv.serve_forever()
    except KeyboardInterrupt:
        print("\nDa dung may chu.")


if __name__ == "__main__":
    main()
