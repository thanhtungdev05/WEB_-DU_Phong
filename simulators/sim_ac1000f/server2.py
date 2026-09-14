#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
Gia lap AC1000F (FPT Internet Hub) - dung TRANG THAT crawl tu thiet bi.
Kien truc frameset ASP: index.asp gom header/nav/main frame, moi trang la URL
/cgi-bin/*.asp that. Server nay phuc vu dung cac URL do, tra .asp/.cgi ve dang
text/html de trinh duyet render (khong tai xuong).

Chay: python server2.py [port]   (mac dinh 8081)
"""
import os, sys, socket, re
from http.server import BaseHTTPRequestHandler, ThreadingHTTPServer
from urllib.parse import urlparse, parse_qs, unquote

PORT = int(sys.argv[1]) if len(sys.argv) > 1 else 8081
BASE = os.path.dirname(os.path.abspath(__file__))
WWW = os.path.join(BASE, "www2")

CT = {
    ".asp": "text/html; charset=utf-8", ".cgi": "text/html; charset=utf-8",
    ".html": "text/html; charset=utf-8", ".htm": "text/html; charset=utf-8",
    ".css": "text/css", ".js": "application/javascript",
    ".png": "image/png", ".gif": "image/gif", ".jpg": "image/jpeg",
    ".jpeg": "image/jpeg", ".ico": "image/x-icon", ".svg": "image/svg+xml",
}


def get_nav_and_tab_for_page(page_name):
    page_lower = page_name.lower()
    if any(k in page_lower for k in ["home_wan", "home_wireless", "home_lan", "adv_nat", "adv_qos", "home_wizard"]):
        return "/cgi-bin/navigation-basic.asp", "Network"
    if any(k in page_lower for k in ["access_", "urlfilter", "ipfilter", "ddns", "cwmp", "snmp", "upnp", "samba"]):
        return "/cgi-bin/navigation-access.asp", "Access"
    if any(k in page_lower for k in ["tools_", "system", "admin", "reboottimer", "wifitimer", "update", "time"]):
        return "/cgi-bin/navigation-maintenance.asp", "Maintenance"
    if any(k in page_lower for k in ["adv_portbinding", "adv_routing", "adv_static", "adv_firewall"]):
        return "/cgi-bin/navigation-advanced.asp", "Advanced"
    if any(k in page_lower for k in ["status_"]):
        return "/cgi-bin/navigation-status.asp", "Status"
    return "/cgi-bin/navigation-basic.asp", "Network"


SIM_STATE = {}

def apply_sim_state_to_html(html_str, p_path):
    if "home_lan" in p_path.lower():
        # DNS and DHCP share the same firmware form. The captured HTML left
        # unrelated DHCP fields empty, so saving only DNS failed the firmware's
        # whole-form validation. Restore the device's normal LAN defaults; the
        # lesson clearFields mechanism still blanks fields KTV must enter.
        defaults = {
            "StartIp": "192.168.1.2",
            "EndIp": "192.168.1.254",
        }
        for field_name, default_value in defaults.items():
            html_str = re.sub(
                rf'(<input\b[^>]*\bname=["\']{field_name}["\'][^>]*\bvalue=["\'])\s*(["\'])',
                rf'\g<1>{default_value}\2',
                html_str,
                flags=re.IGNORECASE,
            )

    if not SIM_STATE:
        return html_str
    
    # Neu la trang home_wan.asp: inject wan_PPPUsername, wan_PPPPassword neu da luu
    if "home_wan" in p_path.lower():
        if "wan_PPPUsername" in SIM_STATE:
            u_val = SIM_STATE["wan_PPPUsername"]
            html_str = re.sub(r'(NAME=["\']wan_PPPUsername["\'][^>]*?VALUE=["\'])[^"\']*?(["\'])', rf'\g<1>{u_val}\2', html_str, flags=re.IGNORECASE)
            html_str = re.sub(r'(VALUE=["\'])[^"\']*?(["\'][^>]*?NAME=["\']wan_PPPUsername["\'])', rf'\g<1>{u_val}\2', html_str, flags=re.IGNORECASE)
        if "wan_PPPPassword" in SIM_STATE:
            p_val = SIM_STATE["wan_PPPPassword"]
            html_str = re.sub(r'(NAME=["\']wan_PPPPassword["\'][^>]*?VALUE=["\'])[^"\']*?(["\'])', rf'\g<1>{p_val}\2', html_str, flags=re.IGNORECASE)
            html_str = re.sub(r'(VALUE=["\'])[^"\']*?(["\'][^>]*?NAME=["\']wan_PPPPassword["\'])', rf'\g<1>{p_val}\2', html_str, flags=re.IGNORECASE)
            
    return html_str


class H(BaseHTTPRequestHandler):
    def _send(self, data, ctype, code=200):
        self.send_response(code)
        self.send_header("Content-Type", ctype)
        self.send_header("Content-Length", str(len(data)))
        self.send_header("Cache-Control", "no-store")
        self.send_header("Access-Control-Allow-Origin", "*")
        self.send_header("Access-Control-Allow-Methods", "GET, POST, OPTIONS")
        self.send_header("Access-Control-Allow-Headers", "*")
        self.end_headers()
        self.wfile.write(data)

    def _redirect(self, to):
        self.send_response(302)
        self.send_header("Location", to)
        self.send_header("Access-Control-Allow-Origin", "*")
        self.end_headers()

    def do_OPTIONS(self):
        self.send_response(200)
        self.send_header("Access-Control-Allow-Origin", "*")
        self.send_header("Access-Control-Allow-Methods", "GET, POST, OPTIONS")
        self.send_header("Access-Control-Allow-Headers", "*")
        self.end_headers()

    def do_GET(self):
        global SIM_STATE
        parsed = urlparse(self.path)
        p = unquote(parsed.path)

        if p in ("/", "/index.html", "/cgi-bin/login.html"):
            return self._redirect("/cgi-bin/login.asp")

        # Reset session / Logout -> xoa state
        if "logout" in p.lower() or p.endswith("/doLogout") or "resetsession" in p.lower():
            SIM_STATE.clear()
            return self._redirect("/cgi-bin/login.asp")

        # Dang nhap: login.asp goi submitform() -> top.location "/cgi-bin/requestFromLoginPage"
        if p in ("/cgi-bin/requestFromLoginPage", "/cgi-bin/logincheck.cgi"):
            return self._redirect("/cgi-bin/index.asp")

        # Xu ly dac biet cho /cgi-bin/index.asp (ho tro render full frameset theo page)
        if p == "/cgi-bin/index.asp":
            qs = parse_qs(parsed.query)
            page_param = qs.get("page", [""])[0]
            nav_param = qs.get("nav", [""])[0]
            tab_param = qs.get("tab", [""])[0]

            f = os.path.join(WWW, "cgi-bin", "index.asp")
            if os.path.isfile(f):
                with open(f, "r", encoding="utf-8", errors="replace") as fh:
                    html = fh.read()

                if page_param:
                    clean_page = page_param if page_param.startswith("/cgi-bin/") else f"/cgi-bin/{page_param}"
                    auto_nav, auto_tab = get_nav_and_tab_for_page(clean_page)
                    final_nav = nav_param if nav_param else auto_nav
                    final_tab = tab_param if tab_param else auto_tab

                    html = re.sub(r'src=["\']/cgi-bin/status\.asp["\']', f'src="/cgi-bin/status.asp?tab={final_tab}"', html)
                    html = re.sub(r'src=["\']/cgi-bin/navigation-status\.asp["\']', f'src="{final_nav}"', html)
                    html = re.sub(r'src=["\']/cgi-bin/status_deviceinfo\.asp["\']', f'src="{clean_page}"', html)

                html = re.sub(
                    r'(?i)(\bsrc=["\'])/cgi-bin/',
                    r'\1/sim_ac1000f/cgi-bin/',
                    html,
                )

                data = html.encode("utf-8")
                return self._send(data, "text/html; charset=utf-8")

        # Xu ly dac biet cho /cgi-bin/status.asp de active tab truyen qua URL (?tab=Network)
        if p == "/cgi-bin/status.asp":
            qs = parse_qs(parsed.query)
            tab_val = qs.get("tab", [""])[0]

            f = os.path.join(WWW, "cgi-bin", "status.asp")
            if os.path.isfile(f):
                with open(f, "r", encoding="utf-8", errors="replace") as fh:
                    html = fh.read()

                if tab_val:
                    tab_script = f"""
                    <script type="text/javascript">
                    window.addEventListener('DOMContentLoaded', function() {{
                        var tabTarget = '{tab_val}'.toLowerCase();
                        var menu = document.getElementById('menu');
                        if (menu) {{
                            var links = menu.getElementsByTagName('a');
                            for (var i = 0; i < links.length; i++) {{
                                if (links[i].textContent.trim().toLowerCase() === tabTarget) {{
                                    links[i].className = 'current';
                                }} else {{
                                    links[i].className = 'other';
                                }}
                            }}
                        }}
                    }});
                    </script>
                    """
                    html = html.replace('</head>', tab_script + '</head>')

                return self._send(html.encode("utf-8"), "text/html; charset=utf-8")

        # Duong dan file trong www2
        f = os.path.join(WWW, p.lstrip("/"))
        if os.path.isfile(f):
            ext = os.path.splitext(f)[1].lower()
            if ext in (".asp", ".html", ".htm"):
                with open(f, "r", encoding="utf-8", errors="replace") as fh:
                    text_content = fh.read()
                text_content = apply_sim_state_to_html(text_content, p)
                return self._send(text_content.encode("utf-8"), CT.get(ext, "text/html; charset=utf-8"))
            else:
                with open(f, "rb") as fh:
                    content = fh.read()
                return self._send(content, CT.get(ext, "application/octet-stream"))

        return self._send(b"Not found: " + p.encode(), "text/plain", 404)

    def do_POST(self):
        global SIM_STATE
        try:
            length = int(self.headers.get("Content-Length", 0) or 0)
            if length > 0:
                body_bytes = self.rfile.read(length)
                ctype = self.headers.get("Content-Type", "")
                if "application/x-www-form-urlencoded" in ctype:
                    params = parse_qs(body_bytes.decode("utf-8", errors="replace"))
                    for k, v in params.items():
                        if v:
                            SIM_STATE[k] = v[0]
        except Exception as e:
            pass

        # cac form Apply cua thiet bi POST ve CGI; ban gia lap luu state va redirect ve Referer
        self._redirect(self.headers.get("Referer") or "/cgi-bin/index.asp")

    def log_message(self, *a):
        pass


def make(port):
    s = ThreadingHTTPServer(("0.0.0.0", port), H)
    s.daemon_threads = True
    return s


if __name__ == "__main__":
    srv = make(PORT)
    print("=" * 56)
    print("  Gia lap AC1000F (FPT Internet Hub) - tu thiet bi that")
    print(f"  Mo trinh duyet: http://localhost:{PORT}/")
    print(f"  So trang: {len(os.listdir(os.path.join(WWW,'cgi-bin')))}")
    print("  Ctrl+C de dung")
    print("=" * 56)
    try:
        srv.serve_forever()
    except KeyboardInterrupt:
        print("\nDa dung.")
