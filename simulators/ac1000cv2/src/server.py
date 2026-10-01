#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
MAY CHU GIA LAP — INTERNET HUB AC1000CV2 (G-97RG6W, fw R4.2.23.109)
===================================================================
Chay:  python server.py [cong]     (mac dinh: 8085)
Mo:    http://localhost:8085/
"""
import os
import sys
import json
import hashlib
import mimetypes
import urllib.parse
from http.server import BaseHTTPRequestHandler, ThreadingHTTPServer

_HERE = os.path.dirname(os.path.abspath(__file__))
if _HERE not in sys.path:
    sys.path.insert(0, _HERE)

try:
    from .config_store import KHO
    from . import render
except ImportError:
    from config_store import KHO
    import render

_DEV = os.path.abspath(os.path.join(_HERE, ".."))
_REF_HTML = os.path.join(_DEV, "reference", "html")
_REF_JS = os.path.join(_DEV, "reference", "js")
_REF_CSS = os.path.join(_DEV, "reference", "css")
_REF_IMG = os.path.join(_DEV, "reference", "img")

ROOT = _DEV
WWW = _REF_HTML

CONG = int(sys.argv[1]) if len(sys.argv) > 1 else 8085

# Quan ly phien dang nhap theo dia chi client IP va session cookie
_phien_xac_thuc = set()
_current_nonce = "2H7y9kh6bcXGCMY7K9yLwZmK2F3N7rl8"


class GponHandler(BaseHTTPRequestHandler):
    def _is_authenticated(self):
        client_ip = getattr(self, "client_address", ("", 0))[0]
        if client_ip in _phien_xac_thuc:
            return True
        raw_cookie = self.headers.get("Cookie", "") if hasattr(self, "headers") else ""
        if "ac1000cv2_auth=1" in raw_cookie:
            return True
        return False

    def _send_html(self, content, status=200, extra_headers=None):
        data = content.encode("utf-8") if isinstance(content, str) else content
        self.send_response(status)
        self.send_header("Content-Type", "text/html; charset=utf-8")
        self.send_header("Content-Length", str(len(data)))
        self.send_header("Server", "nginx/1.16.0")
        if extra_headers:
            for k, v in extra_headers.items():
                self.send_header(k, v)
        self.end_headers()
        self.wfile.write(data)

    def _send_401(self):
        html_401 = ('<!DOCTYPE html PUBLIC "-//W3C//Dtd XHTML 1.0 Strict//EN" "http://www.w3.org/tr/xhtml1/Dtd/xhtml1-Transitional.dtd">\n'
                    '<html xmlns="http://www.w3.org/1999/xhtml" xml:lang="utf-8" lang="utf-8" dir="ltr">\n'
                    '<head>\n<title>GPON Home Gateway</title>\n'
                    '<meta http-equiv="Content-Type" content="text/html; charset=utf-8" />\n'
                    '<meta http-equiv="refresh" content="0; url=login.html" />\n'
                    '</head>\n<body></body>\n</html>')
        self._send_html(html_401, status=401)

    def _send_static(self, filepath, mime=None):
        if not os.path.exists(filepath):
            self.send_error(404, "File not found")
            return
        if not mime:
            mime, _ = mimetypes.guess_type(filepath)
            if not mime:
                if filepath.endswith(".js"):
                    mime = "text/javascript"
                elif filepath.endswith(".css"):
                    mime = "text/css"
                elif filepath.endswith(".htc"):
                    mime = "text/x-component"
                elif filepath.endswith(".png"):
                    mime = "image/png"
                elif filepath.endswith(".ico"):
                    mime = "image/x-icon"
                else:
                    mime = "application/octet-stream"

        with open(filepath, "rb") as f:
            data = f.read()

        self.send_response(200)
        self.send_header("Content-Type", mime)
        self.send_header("Content-Length", str(len(data)))
        self.send_header("Server", "nginx/1.16.0")
        self.end_headers()
        self.wfile.write(data)

    def do_GET(self):
        client_ip = self.client_address[0]
        parsed = urllib.parse.urlparse(self.path)
        path = parsed.path
        if path.startswith("/sim_ac1000cv2"):
            path = path[len("/sim_ac1000cv2"):]
        if path.startswith("/GponForm") and path.endswith(".html"):
            path = path[len("/GponForm"):]
        if not path.startswith("/"):
            path = "/" + path

        # 0. API Reset session (ho tro Portal)
        if path in ("/api/reset", "/resetsession"):
            _phien_xac_thuc.discard(client_ip)
            KHO.dat_lai()
            resp = b'{"status":"ok","message":"AC1000CV2 state reset"}'
            self.send_response(200)
            self.send_header("Content-Type", "application/json; charset=utf-8")
            self.send_header("Content-Length", str(len(resp)))
            self.send_header("Set-Cookie", "ac1000cv2_auth=0; Path=/; Expires=Thu, 01 Jan 1970 00:00:00 GMT")
            self.end_headers()
            self.wfile.write(resp)
            return

        # 1. Favicon
        if path == "/favicon.ico":
            self.send_response(204)
            self.end_headers()
            return

        # 2. Trang goc /
        if path in ("", "/"):
            if self._is_authenticated():
                index_file = os.path.join(_REF_HTML, "index.html")
                with open(index_file, "r", encoding="utf-8", errors="ignore") as f:
                    content = f.read()
                self._send_html(content)
            else:
                self._send_401()
            return

        # 3. Tai nguyen tinh (JS, CSS, IMG) — ho tro ca duong dan tuong doi va /GponForm/
        if "/script/" in path or path.startswith("/script/") or (path.endswith(".js") and not path.endswith(".html")):
            fname = os.path.basename(path)
            fpath = os.path.join(_REF_JS, fname)
            if os.path.exists(fpath):
                self._send_static(fpath, "text/javascript")
                return

        if "/style/" in path or path.startswith("/style/") or path.endswith(".css") or path.endswith(".htc"):
            fname = os.path.basename(path)
            fpath = os.path.join(_REF_CSS, fname)
            if not os.path.exists(fpath):
                pie_path = os.path.join(_REF_CSS, "css3pie", fname)
                if os.path.exists(pie_path):
                    fpath = pie_path
            if os.path.exists(fpath):
                self._send_static(fpath)
                return

        if "/images/" in path or path.startswith("/images/") or path.lower().endswith((".png", ".jpg", ".jpeg", ".gif", ".ico")):
            fname = os.path.basename(path)
            fpath = os.path.join(_REF_IMG, fname)
            if os.path.exists(fpath):
                self._send_static(fpath)
                return

        # 4. Heartbeat / Reset timer
        if path == "/resettm.html":
            self._send_html("OK")
            return

        # 5. Trang login.html
        if path == "/login.html":
            login_file = os.path.join(_REF_HTML, "login.html")
            with open(login_file, "r", encoding="utf-8", errors="ignore") as f:
                content = f.read()
            self._send_html(content)
            return

        # 6. Trang logout.html
        if path == "/logout.html":
            _phien_xac_thuc.discard(client_ip)
            target = f"{prefix}/login.html" if prefix else "login.html"
            html_logout = (f'<html><head><meta http-equiv="refresh" content="0; url={target}"></head>'
                           f'<body><script>window.location.replace("{target}");</script>'
                           f'<p>Logged out. Redirecting to login page...</p></body></html>')
            self._send_html(html_logout, extra_headers={"Set-Cookie": "ac1000cv2_auth=0; Path=/; Expires=Thu, 01 Jan 1970 00:00:00 GMT"})
            return

        # 7. Kiem tra xac thuc cho cac trang HTML con lai (ke ca index.html)
        if not self._is_authenticated():
            self._send_401()
            return

        # 8. Trang index.html
        if path == "/index.html":
            index_file = os.path.join(_REF_HTML, "index.html")
            with open(index_file, "r", encoding="utf-8", errors="ignore") as f:
                content = f.read()
            self._send_html(content)
            return

        # 9. Cac trang cau hinh con
        if path.endswith(".html"):
            fname = os.path.basename(path)
            content = render.render_page(fname)
            if content is not None:
                self._send_html(content)
                return

        self.send_error(404, "Page Not Found")

    def do_POST(self):
        client_ip = self.client_address[0]
        parsed = urllib.parse.urlparse(self.path)
        path = parsed.path
        if path.startswith("/sim_ac1000cv2"):
            path = path[len("/sim_ac1000cv2"):]
        if not path.startswith("/"):
            path = "/" + path

        length = int(self.headers.get("Content-Length", 0))
        body = self.rfile.read(length) if length > 0 else b""
        
        host = self.headers.get("Host", "")
        referer = self.headers.get("Referer", "")
        prefix = "/sim_ac1000cv2" if is_dispatcher else ""

        # 0. API Reset session
        if path in ("/api/reset", "/resetsession"):
            _phien_xac_thuc.discard(client_ip)
            KHO.dat_lai()
            resp = b'{"status":"ok","message":"AC1000CV2 state reset"}'
            self.send_response(200)
            self.send_header("Content-Type", "application/json; charset=utf-8")
            self.send_header("Content-Length", str(len(resp)))
            self.send_header("Set-Cookie", "ac1000cv2_auth=0; Path=/; Expires=Thu, 01 Jan 1970 00:00:00 GMT")
            self.end_headers()
            self.wfile.write(resp)
            return

        # 1. Dang nhap
        if path.endswith("/LoginForm"):
            params = urllib.parse.parse_qs(body.decode("utf-8", "ignore"))
            x_ran_id = params.get("XRanID", [""])[0]

            admin_pwd = KHO.doc("auth.admin", "admin")
            allowed_pwds = {admin_pwd, "admin", "12345678"}
            valid_keys = {hashlib.sha256(("admin" + "d2" + p).encode()).hexdigest() for p in allowed_pwds}

            if x_ran_id in valid_keys:
                _phien_xac_thuc.add(client_ip)
                target_url = f"{prefix}/index.html"
                redirect_html = (
                    '<!DOCTYPE html>\n<html><head>\n<title>GPON Home Gateway</title>\n'
                    '<meta http-equiv="Content-Type" content="text/html; charset=utf-8" />\n'
                    f'<meta http-equiv="refresh" content="0; url={target_url}" />\n'
                    f'<script>window.location.replace("{target_url}");</script>\n'
                    f'</head><body><p>Redirecting to <a href="{target_url}">index.html</a>...</p></body></html>'
                )
                self._send_html(redirect_html, status=200, extra_headers={"Set-Cookie": "ac1000cv2_auth=1; Path=/; SameSite=Lax"})
            else:
                err_url = f"{prefix}/login.html?login_err=1"
                redirect_err = (
                    '<!DOCTYPE html>\n<html><head>\n<title>GPON Home Gateway</title>\n'
                    '<meta http-equiv="Content-Type" content="text/html; charset=utf-8" />\n'
                    f'<meta http-equiv="refresh" content="0; url={err_url}" />\n'
                    f'<script>window.location.replace("{err_url}");</script>\n'
                    f'</head><body></body></html>'
                )
                self._send_html(redirect_err, status=200)
            return

        # 2. Dang xuat
        if path.endswith("/LogoutForm"):
            _phien_xac_thuc.discard(client_ip)
            self._send_html("OK", status=200, extra_headers={"Set-Cookie": "ac1000cv2_auth=0; Path=/; Expires=Thu, 01 Jan 1970 00:00:00 GMT"})
            return

        # 3. Luu cau hinh cac trang /GponForm/<page>_XForm
        if path.startswith("/GponForm/") and (path.endswith("_XForm") or path.endswith("Form")):
            raw_form_name = path[len("/GponForm/"):]
            if raw_form_name.endswith("_XForm"):
                form_name = raw_form_name[:-len("_XForm")]
            elif raw_form_name.endswith("Form"):
                form_name = raw_form_name[:-len("Form")]
            else:
                form_name = raw_form_name

            params = urllib.parse.parse_qs(body.decode("utf-8", "ignore"))

            # Fallback nếu form_name không hợp lệ hoặc là undefined
            if form_name in ("undefined", "", None):
                if "XWebPageName" in params and params["XWebPageName"][0] and params["XWebPageName"][0] != "undefined":
                    form_name = params["XWebPageName"][0]
                elif "ppp_user" in params or "wan_list" in params:
                    form_name = "wan"
                elif "lan_ip" in params or "dhcp_enable" in params or "dns_overwrite" in params:
                    form_name = "lan"
                elif "portfwd_lanip" in params or "portfwd_wanstart" in params:
                    form_name = "portfwd"
                elif "ssid_network_name" in params:
                    form_name = "wifissid"
                else:
                    form_name = "devinfo"

            # Xu ly luu tung trang vao kho cau hinh
            if form_name == "devinfo":
                if "workMode" in params:
                    KHO.ghi("system.workMode", params["workMode"][0])
                if "wifi_button" in params:
                    KHO.ghi("system.wifi_button", params["wifi_button"][0])

            elif form_name == "lan":
                if "lan_ip" in params:
                    KHO.ghi("lan.ip", params["lan_ip"][0])
                if "lan_mask" in params:
                    KHO.ghi("lan.mask", params["lan_mask"][0])
                if "dhcp_enable" in params:
                    KHO.ghi("lan.dhcp_enable", params["dhcp_enable"][0])
                if "start_ip" in params:
                    KHO.ghi("lan.dhcp_start", params["start_ip"][0])
                elif "startip" in params:
                    KHO.ghi("lan.dhcp_start", params["startip"][0])
                elif "dhcp_start_ip" in params:
                    KHO.ghi("lan.dhcp_start", params["dhcp_start_ip"][0])
                if "end_ip" in params:
                    KHO.ghi("lan.dhcp_end", params["end_ip"][0])
                elif "endip" in params:
                    KHO.ghi("lan.dhcp_end", params["endip"][0])
                elif "dhcp_end_ip" in params:
                    KHO.ghi("lan.dhcp_end", params["dhcp_end_ip"][0])
                if "dns_overwrite" in params:
                    KHO.ghi("lan.dns_overwrite", params["dns_overwrite"][0])
                if "dns_primary" in params:
                    KHO.ghi("lan.dns_primary", params["dns_primary"][0])
                if "dns_secondary" in params:
                    KHO.ghi("lan.dns_secondary", params["dns_secondary"][0])

            elif form_name == "wifissid":
                idx = "0"
                if "ssid_list" in params:
                    idx = params["ssid_list"][0]
                KHO.ghi("wifi24.last_idx", idx)
                if idx == "1":
                    if "ssid_network_name" in params:
                        KHO.ghi("wifi_iot.ssid", params["ssid_network_name"][0])
                    if "ssid_state" in params:
                        KHO.ghi("wifi_iot.enable", params["ssid_state"][0])
                    elif "ssid_enable" in params:
                        KHO.ghi("wifi_iot.enable", params["ssid_enable"][0])
                else:
                    if "ssid_network_name" in params:
                        KHO.ghi("wifi24.ssid", params["ssid_network_name"][0])
                    if "ssid_state" in params:
                        KHO.ghi("wifi24.enable", params["ssid_state"][0])
                    elif "ssid_enable" in params:
                        KHO.ghi("wifi24.enable", params["ssid_enable"][0])

            elif form_name == "wifi5ssid":
                if "ssid_network_name" in params:
                    KHO.ghi("wifi5.ssid", params["ssid_network_name"][0])
                if "ssid_enable" in params:
                    KHO.ghi("wifi5.enable", params["ssid_enable"][0])

            elif form_name == "wifisecu":
                idx = "0"
                if "ssid_list" in params:
                    idx = params["ssid_list"][0]
                KHO.ghi("wifi24.last_idx", idx)
                val = params.get("security_wpa_key", [""])[0] or params.get("key", [""])[0]
                if idx == "1":
                    KHO.ghi("wifi_iot.password", val)
                else:
                    KHO.ghi("wifi24.password", val)

            elif form_name == "wifi5secu":
                if "security_wpa_key" in params:
                    KHO.ghi("wifi5.password", params["security_wpa_key"][0])
                elif "key" in params:
                    KHO.ghi("wifi5.password", params["key"][0])

            elif form_name == "dmz":
                if "dmz_enable" in params:
                    KHO.ghi("dmz.enable", params["dmz_enable"][0])
                if "dmz_ipaddr" in params:
                    KHO.ghi("dmz.dest_ip", params["dmz_ipaddr"][0])

            elif form_name == "wan":
                if "ppp_user" in params:
                    KHO.ghi("wan.ppp_user", params["ppp_user"][0])
                if "ppp_pass" in params:
                    KHO.ghi("wan.ppp_pass", params["ppp_pass"][0])

            elif form_name == "portfwd":
                if "portfwd_lanip" in params:
                    KHO.ghi("portfwd.lanip", params["portfwd_lanip"][0])
                if "portfwd_lanport" in params:
                    KHO.ghi("portfwd.lanport", params["portfwd_lanport"][0])
                if "portfwd_wanstart" in params:
                    KHO.ghi("portfwd.wanstart", params["portfwd_wanstart"][0])
                if "portfwd_wanend" in params:
                    KHO.ghi("portfwd.wanend", params["portfwd_wanend"][0])
                if "protocol" in params:
                    KHO.ghi("portfwd.protocol", params["protocol"][0])
                elif "value" in params:
                    val_parts = params["value"][0].split("|")
                    if len(val_parts) >= 7:
                        KHO.ghi("portfwd.wanstart", val_parts[1])
                        KHO.ghi("portfwd.wanend", val_parts[2])
                        KHO.ghi("portfwd.lanport", val_parts[3])
                        KHO.ghi("portfwd.lanip", val_parts[5])
                        KHO.ghi("portfwd.protocol", val_parts[6])

            elif form_name == "password":
                if "new_pwd" in params:
                    KHO.ghi("auth.admin", params["new_pwd"][0])

            # Tra ve response thanh cong va redirect ve lai trang do
            target_page = f"{prefix}/{form_name}.html?save_success=1"
            res_html = (
                f'<!DOCTYPE html>\n<html><head>\n'
                f'<meta http-equiv="refresh" content="0; url={target_page}">\n'
                f'<script>window.location.replace("{target_page}");</script>\n'
                f'</head><body><p>Saved successfully. Redirecting...</p></body></html>'
            )
            self._send_html(res_html, status=200)
            return

        self.send_error(404, "Form Endpoint Not Found")

    def log_message(self, format, *args):
        # In log gon gang
        sys.stdout.write(f"[{self.log_date_time_string()}] {self.address_string()} {format % args}\n")
        sys.stdout.flush()


# Alias tuong thich cho Master Dispatcher
H = GponHandler


def main():
    print("=" * 66)
    print("  MAY CHU GIA LAP — INTERNET HUB AC1000CV2")
    print(f"  Firmware: R4.2.23.109 (G-97RG6W)")
    print(f"  Mo trinh duyet: http://localhost:{CONG}/")
    print(f"  Tai khoan     : admin / {KHO.doc('auth.admin', '12345678')}")
    print("=" * 66)
    srv = ThreadingHTTPServer(("0.0.0.0", CONG), GponHandler)
    try:
        srv.serve_forever()
    except KeyboardInterrupt:
        print("\nDa dung may chu.")


if __name__ == "__main__":
    main()
