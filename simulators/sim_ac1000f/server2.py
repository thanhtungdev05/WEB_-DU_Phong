#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
Gia lap AC1000F (FPT Internet Hub) - dung TRANG THAT crawl tu thiet bi.
Kien truc frameset ASP: index.asp gom header/nav/main frame, moi trang la URL
/cgi-bin/*.asp that. Server nay phuc vu dung cac URL do, tra .asp/.cgi ve dang
text/html de trinh duyet render (khong tai xuong).

Chay: python server2.py [port]   (mac dinh 8081)
"""
import os, sys, socket, re, hmac, json, time
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


def rewrite_sim_urls(content: str, sim_id: str = "sim_ac1000f") -> str:
    if not content:
        return content
    # Rewrite un-prefixed /cgi-bin/
    content = re.sub(rf'(?<!/{sim_id})(?<!{sim_id})/cgi-bin/', f'/{sim_id}/cgi-bin/', content)
    # Rewrite root static assets to remain inside simulator namespace
    content = re.sub(
        rf'(?<!/{sim_id})(?<!{sim_id})/(val\.js|style\.css|general\.js|ip\.js|ip_new\.js|jsl\.js|chksel\.js|spin\.js|pvc\.js|mac\.js|wanfunc\.js|[a-zA-Z0-9_-]+\.(?:png|gif|jpg|jpeg|ico|svg))',
        rf'/{sim_id}/\1',
        content,
        flags=re.IGNORECASE
    )
    return content


EXTENSION_ERROR_SHIELD = """<script>
(function(){
  window.addEventListener('unhandledrejection', function(e){
    try {
      var r = e.reason, s = (r && (r.stack || r.message)) ? String(r.stack || r.message) : String(r);
      if (s.indexOf('useCache') !== -1 || s.indexOf('content.js') !== -1 || s.indexOf('extension') !== -1) {
        e.preventDefault();
      }
    } catch(_){}
  });
  window.addEventListener('error', function(e){
    try {
      var f = e.filename || '', m = e.message || '';
      if (f.indexOf('content.js') !== -1 || f.indexOf('extension') !== -1 || m.indexOf('useCache') !== -1) {
        e.preventDefault();
        return true;
      }
    } catch(_){}
  });
})();
</script>"""


import threading

_STATE_LOCK = threading.Lock()
SIM_STATE = {}
USER_STATES = {}

# ---- B3: tai lap hang loat cho load test + thu hoi phien het han ----------
# Chi co the kich hoat khi dat bien moi truong FTC_SIM_ADMIN_TOKEN; khong dat
# thi /internal/reset luon tra 403 (mac dinh an toan).
_ADMIN_TOKEN = os.environ.get("FTC_SIM_ADMIN_TOKEN", "")
_SESSION_TTL = float(os.environ.get("FTC_SIM_SESSION_TTL", "1800") or 1800)
_LAST_SEEN = {}


def _gc_sessions_unlocked(now):
    het_han = [k for k, t in list(_LAST_SEEN.items()) if now - t > _SESSION_TTL]
    for k in het_han:
        USER_STATES.pop(k, None)
        _LAST_SEEN.pop(k, None)
    return len(het_han)


def _gc_loop():
    while True:
        time.sleep(max(30.0, _SESSION_TTL / 2.0))
        with _STATE_LOCK:
            _gc_sessions_unlocked(time.time())


def _khoi_dong_gc():
    threading.Thread(target=_gc_loop, daemon=True).start()

def get_client_state(key):
    if not key:
        return SIM_STATE
    with _STATE_LOCK:
        _LAST_SEEN[key] = time.time()
        if key not in USER_STATES:
            USER_STATES[key] = {}
        return USER_STATES[key]

def apply_sim_state_to_html(html_str, p_path, state=None):
    if state is None:
        state = SIM_STATE
    if "home_lan" in p_path.lower():
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

    if not state:
        return html_str
    
    # Neu la trang home_wan.asp: inject wan_PPPUsername, wan_PPPPassword, wan_vid neu da luu
    if "home_wan" in p_path.lower():
        if "wan_PPPUsername" in state:
            u_val = state["wan_PPPUsername"]
            html_str = re.sub(r'(NAME=["\']wan_PPPUsername["\'][^>]*?VALUE=["\'])[^"\']*?(["\'])', rf'\g<1>{u_val}\2', html_str, flags=re.IGNORECASE)
            html_str = re.sub(r'(VALUE=["\'])[^"\']*?(["\'][^>]*?NAME=["\']wan_PPPUsername["\'])', rf'\g<1>{u_val}\2', html_str, flags=re.IGNORECASE)
        if "wan_PPPPassword" in state:
            p_val = state["wan_PPPPassword"]
            html_str = re.sub(r'(NAME=["\']wan_PPPPassword["\'][^>]*?VALUE=["\'])[^"\']*?(["\'])', rf'\g<1>{p_val}\2', html_str, flags=re.IGNORECASE)
            html_str = re.sub(r'(VALUE=["\'])[^"\']*?(["\'][^>]*?NAME=["\']wan_PPPPassword["\'])', rf'\g<1>{p_val}\2', html_str, flags=re.IGNORECASE)
        if "wan_vid" in state:
            v_val = state["wan_vid"]
            html_str = re.sub(r'(NAME=["\']wan_vid["\'][^>]*?VALUE=["\'])[^"\']*?(["\'])', rf'\g<1>{v_val}\2', html_str, flags=re.IGNORECASE)
            html_str = re.sub(r'(VALUE=["\'])[^"\']*?(["\'][^>]*?NAME=["\']wan_vid["\'])', rf'\g<1>{v_val}\2', html_str, flags=re.IGNORECASE)

    # Neu la trang home_wireless.asp hoac home_wireless_5g.asp: inject SSID va PreSharedKey neu da luu
    if "home_wireless" in p_path.lower():
        if "ESSID" in state:
            s_val = state["ESSID"]
            html_str = re.sub(r'(NAME=["\']ESSID["\'][^>]*?VALUE=["\'])[^"\']*?(["\'])', rf'\g<1>{s_val}\2', html_str, flags=re.IGNORECASE)
            html_str = re.sub(r'(VALUE=["\'])[^"\']*?(["\'][^>]*?NAME=["\']ESSID["\'])', rf'\g<1>{s_val}\2', html_str, flags=re.IGNORECASE)
        for pkey in ["PreSharedKey1", "PreSharedKey2", "PreSharedKey3"]:
            if pkey in state:
                k_val = state[pkey]
                html_str = re.sub(rf'(NAME=["\']{pkey}["\'][^>]*?VALUE=["\'])[^"\']*?(["\'])', rf'\g<1>{k_val}\2', html_str, flags=re.IGNORECASE)
                html_str = re.sub(rf'(VALUE=["\'])[^"\']*?(["\'][^>]*?NAME=["\']{pkey}["\'])', rf'\g<1>{k_val}\2', html_str, flags=re.IGNORECASE)

    # Neu la trang home_lan.asp: inject cac truong IP, DHCP, DNS neu da luu
    if "home_lan" in p_path.lower():
        lan_fields = ["uiViewIPAddr", "uiViewNetMask", "StartIp", "EndIp", "dhcp_LeaseTime", "PrimaryDns", "SecondDns"]
        for fld in lan_fields:
            if fld in state:
                val = state[fld]
                html_str = re.sub(
                    rf'(<input\b[^>]*\bname=["\']{fld}["\'][^>]*\bvalue=["\'])[^"\']*?(["\'])',
                    rf'\g<1>{val}\2',
                    html_str,
                    flags=re.IGNORECASE,
                )
                html_str = re.sub(
                    rf'(<input\b[^>]*\bvalue=["\'])[^"\']*?(["\'][^>]*\bname=["\']{fld}["\'])',
                    rf'\g<1>{val}\2',
                    html_str,
                    flags=re.IGNORECASE,
                )
        if "dnsTypeRadio" in state:
            dns_type = state["dnsTypeRadio"]
            if str(dns_type) == "1":
                html_str = re.sub(r'(<option\s+value=["\']0["\'])\s+selected>', r'\1>', html_str, flags=re.IGNORECASE)
                html_str = re.sub(r'(<option\s+value=["\']1["\'])>', r'\1 selected>', html_str, flags=re.IGNORECASE)
        if "dhcpTypeRadio" in state:
            dhcp_type = state["dhcpTypeRadio"]
            if str(dhcp_type) == "1":
                html_str = re.sub(r'(<input\b[^>]*\bname=["\']dhcpTypeRadio["\'][^>]*\bvalue=["\']1["\'][^>]*?)(/?>)', r'\1 checked\2', html_str, flags=re.IGNORECASE)

    return html_str


class H(BaseHTTPRequestHandler):
    def _send(self, data, ctype, code=200, cache_control="no-store"):
        self.send_response(code)
        self.send_header("Content-Type", ctype)
        self.send_header("Content-Length", str(len(data)))
        self.send_header("Cache-Control", cache_control)
        self.send_header("Access-Control-Allow-Origin", "*")
        self.send_header("Access-Control-Allow-Methods", "GET, POST, OPTIONS")
        self.send_header("Access-Control-Allow-Headers", "*")
        self.end_headers()
        self.wfile.write(data)

    def _redirect(self, to):
        self.send_response(302)
        self.send_header("Location", to)
        self.send_header("Access-Control-Allow-Origin", "*")
        self.send_header("Content-Length", "0")
        self.end_headers()

    def do_OPTIONS(self):
        self.send_response(200)
        self.send_header("Access-Control-Allow-Origin", "*")
        self.send_header("Access-Control-Allow-Methods", "GET, POST, OPTIONS")
        self.send_header("Access-Control-Allow-Headers", "*")
        self.end_headers()

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
        cookie = self.headers.get("Cookie", "")
        if cookie:
            import re
            m = re.search(r'(?:ftc_session|ac1000f_sid|PHPSESSID|ktv_client_id)=([a-zA-Z0-9_-]+)', cookie)
            if m:
                return m.group(1)
        ref = self.headers.get("Referer", "")
        if ref and "_ktv=" in ref:
            try:
                q = parse_qs(urlparse(ref).query)
                if "_ktv" in q and q["_ktv"][0]:
                    return q["_ktv"][0].strip()
            except Exception:
                pass
        addr = getattr(self, "client_address", None)
        return str(addr[0]) if addr else "default"

    def _admin_ok(self):
        if not _ADMIN_TOKEN:
            return False
        header = self.headers.get("X-Admin-Token", "")
        return bool(header) and hmac.compare_digest(header.encode("utf-8"), _ADMIN_TOKEN.encode("utf-8"))

    def _xu_ly_internal(self, p):
        # Tien to /internal/ chi co o ban gia lap, khong ton tai tren thiet bi that.
        if p != "/internal/reset":
            return False
        if not self._admin_ok():
            self._send(b'{"status":"forbidden"}', "application/json; charset=utf-8", 403)
            return True
        with _STATE_LOCK:
            cleared = len(USER_STATES)
            USER_STATES.clear()
            SIM_STATE.clear()
            _LAST_SEEN.clear()
        resp = json.dumps({"status": "ok", "message": "AC1000F state reset (load test)", "cleared_sessions": cleared})
        self._send(resp.encode("utf-8"), "application/json; charset=utf-8")
        return True

    def do_GET(self):
        client_key = self._client_key()
        client_state = get_client_state(client_key)
        parsed = urlparse(self.path)
        p = unquote(parsed.path)
        if p.startswith("/sim_ac1000f/"):
            p = p[len("/sim_ac1000f"):]

        if p.startswith("/internal/"):
            return self._send(b'{"status":"method_not_allowed"}', "application/json; charset=utf-8", 405)

        if p in ("/", "/index.html", "/cgi-bin/login.html"):
            return self._redirect("/cgi-bin/login.asp")

        # Reset session / API reset -> xoa state
        if p in ("/api/reset", "/resetsession") or "resetsession" in self.path.lower():
            with _STATE_LOCK:
                USER_STATES.pop(client_key, None)
            resp = b'{"status":"ok","message":"AC1000F state reset"}'
            return self._send(resp, "application/json; charset=utf-8")

        if "logout" in self.path.lower() or p.endswith("/doLogout"):
            client_state.clear()
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
                    html = re.sub(r'src=["\']/cgi-bin/navigation-status\.asp["\']', f'src="{final_nav}?page={clean_page}"', html)
                    html = re.sub(r'src=["\']/cgi-bin/status_deviceinfo\.asp["\']', f'src="{clean_page}"', html)

                # Rewrite all /cgi-bin/ and static links to /sim_ac1000f/
                html = rewrite_sim_urls(html, "sim_ac1000f")
                if re.search(r'</head>', html, re.IGNORECASE):
                    html = re.sub(r'</head>', EXTENSION_ERROR_SHIELD + "</head>", html, count=1, flags=re.IGNORECASE)
                else:
                    html = EXTENSION_ERROR_SHIELD + html
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
                        var menu = document.getElementById('menu') || document.getElementById('MainMenu');
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
                    if re.search(r'</head>', html, re.IGNORECASE):
                        html = re.sub(r'</head>', tab_script + "</head>", html, flags=re.IGNORECASE)
                    else:
                        html = tab_script + html

                html = rewrite_sim_urls(html, "sim_ac1000f")
                return self._send(html.encode("utf-8"), "text/html; charset=utf-8")

        # Duong dan file trong www2
        f = os.path.join(WWW, p.lstrip("/"))
        if os.path.isfile(f):
            ext = os.path.splitext(f)[1].lower()
            if ext in (".asp", ".html", ".htm"):
                with open(f, "r", encoding="utf-8", errors="replace") as fh:
                    text_content = fh.read()

                if p.startswith("/cgi-bin/navigation"):
                    qs = parse_qs(parsed.query)
                    page_query = qs.get("page", [""])[0]
                    nav_guard_script = f"""
                    <script type="text/javascript">
                    (function() {{
                        var targetPage = '{page_query}'.split('/').pop().toLowerCase();
                        if (!targetPage) {{
                            var m = (window.location.search || '').match(/page=([^&]+)/);
                            if (m) targetPage = decodeURIComponent(m[1]).split('/').pop().toLowerCase();
                        }}
                        if (targetPage) {{
                            var origDoLoad = window.doLoad;
                            window.doLoad = function() {{
                                try {{
                                    if (window.innerHeight != undefined)
                                        document.getElementsByTagName("body")[0].style.height = window.innerHeight + "px";
                                    else
                                        document.getElementsByTagName("body")[0].style.height = document.documentElement.clientHeight + "px";
                                }} catch(e) {{}}
                                var menu = document.getElementById("MainMenu") || document.getElementById("menu");
                                if (menu) {{
                                    var links = menu.getElementsByTagName("a");
                                    for (var i = 0; i < links.length; i++) {{
                                        var href = (links[i].getAttribute("href") || "").toLowerCase();
                                        if (href.indexOf(targetPage) !== -1) {{
                                            for (var j = 0; j < links.length; j++) {{
                                                links[j].className = "other";
                                                links[j].style.color = "";
                                            }}
                                            links[i].className = "current";
                                            break;
                                        }}
                                    }}
                                }}
                            }};
                        }}
                    }})();
                    </script>
                    """
                    if re.search(r'</head>', text_content, re.IGNORECASE):
                        text_content = re.sub(r'</head>', nav_guard_script + "</head>", text_content, count=1, flags=re.IGNORECASE)
                    else:
                        text_content = nav_guard_script + text_content

                text_content = rewrite_sim_urls(text_content, "sim_ac1000f")
                text_content = apply_sim_state_to_html(text_content, p, state=client_state)
                if re.search(r'</head>', text_content, re.IGNORECASE):
                    text_content = re.sub(r'</head>', EXTENSION_ERROR_SHIELD + "</head>", text_content, count=1, flags=re.IGNORECASE)
                elif re.search(r'</html>', text_content, re.IGNORECASE):
                    text_content = re.sub(r'</html>', EXTENSION_ERROR_SHIELD + "</html>", text_content, count=1, flags=re.IGNORECASE)
                else:
                    text_content = text_content + EXTENSION_ERROR_SHIELD
                return self._send(text_content.encode("utf-8"), CT.get(ext, "text/html; charset=utf-8"))
            else:
                with open(f, "rb") as fh:
                    content = fh.read()
                return self._send(content, CT.get(ext, "application/octet-stream"), cache_control="public, max-age=86400, stale-while-revalidate=86400")

        # Fallback cac file/endpoint he thong router cu khong co tren disk nhung trinh duyet goi den
        p_clean = p.split("?")[0].rstrip("/")

        # 1. Scripts (OutVariant.asp va script mo phong)
        if p_clean.endswith("/OutVariant.asp") or p_clean == "/OutVariant.asp":
            return self._send(b"/* OutVariant */", "application/javascript; charset=utf-8")
        if p_clean.endswith(".js"):
            return self._send(b"/* simulated js */", "application/javascript; charset=utf-8")

        # 2. Stylesheets
        if p_clean.endswith(".css"):
            return self._send(b"/* simulated css */", "text/css; charset=utf-8")

        # 3. Images (1x1 transparent gif)
        if p_clean.endswith((".png", ".gif", ".jpg", ".jpeg", ".ico", ".svg")):
            trans_gif = b"GIF89a\x01\x00\x01\x00\x80\x00\x00\xff\xff\xff\x00\x00\x00!\xf9\x04\x01\x00\x00\x00\x00,\x00\x00\x00\x00\x01\x00\x01\x00\x00\x02\x02D\x01\x00;"
            return self._send(trans_gif, "image/gif", cache_control="public, max-age=86400")

        # 4. Certificates dropdown (Lab 1 - home_wan.asp)
        if p_clean.endswith("/getCertNames.cgi") or p_clean.endswith("/getCANames.cgi"):
            element_name = "wan_trusted_ca" if "getCANames" in p_clean else "wan_cert"
            dummy_html = (
                '<!DOCTYPE html><html><head><meta charset="utf-8"></head><body>'
                f'<form name="Alpha_WAN"><select name="{element_name}">'
                '<option value="N/A">N/A</option></select></form></body></html>'
            )
            return self._send(dummy_html.encode("utf-8"), "text/html; charset=utf-8")

        # 5. Connected Clients Table (Lab 2 & Lab 3 - show_2.4g_clients.asp / show_5g_clients.asp)
        if p_clean.endswith("/show_2.4g_clients.asp") or p_clean.endswith("/show_5g_clients.asp"):
            band = "5G" if "5g" in p_clean.lower() else "2.4G"
            client_table = (
                '<table width="600" border="1" cellpadding="3" cellspacing="0" bordercolor="#CCCCCC" '
                'style="border-collapse:collapse;margin:10px auto;font-size:12px;background:#fff;text-align:center;">'
                '<tr bgcolor="#EEEEEE"><th width="50">Index</th><th width="160">MAC Address</th>'
                '<th width="130">IP Address</th><th width="70">Band</th><th width="80">RSSI</th><th width="90">Speed</th></tr>'
                f'<tr><td>1</td><td>70:85:c2:5b:9e:10</td>'
                f'<td>192.168.1.100</td><td>{band}</td><td style="color:#008000;font-weight:bold;">-52 dBm</td>'
                '<td>144 Mbps</td></tr></table>'
            )
            return self._send(client_table.encode("utf-8"), "text/html; charset=utf-8")

        # 6. Backup Configuration Romfile Download (Lab 7 - tools_update.asp)
        if p_clean.endswith("/romfile.cfg") or p_clean.endswith("/VDSL_CO_romfile.cfg") or p_clean.endswith(".cfg"):
            cfg_data = (
                b"[Romfile_AC1000F]\n"
                b"Device_Model=AC1000F\n"
                b"Hardware_Version=AC1000F_V2\n"
                b"Firmware_Version=V1.0.12\n"
                b"WAN_Type=PPPoE\n"
                b"LAN_IP=192.168.1.1\n"
                b"SubnetMask=255.255.255.0\n"
                b"DHCP_Enabled=1\n"
                b"DHCP_Start=192.168.1.2\n"
                b"DHCP_End=192.168.1.254\n"
                b"SSID_24=FPT Telecom\n"
                b"SSID_5G=FPT Telecom_5G\n"
                b"Backup_Timestamp=" + str(int(time.time())).encode("ascii") + b"\n"
            )
            self.send_response(200)
            self.send_header("Content-Type", "application/octet-stream")
            self.send_header("Content-Disposition", 'attachment; filename="romfile.cfg"')
            self.send_header("Content-Length", str(len(cfg_data)))
            self.send_header("Access-Control-Allow-Origin", "*")
            self.end_headers()
            return self.wfile.write(cfg_data)

        # 7. Diagnostic logs (WIFI_2.4G_RSSI_Information.log, WIFI_5G_RSSI_Information.log, foxsys.log)
        if p_clean.endswith(".log") or "RSSI_Information.log" in p_clean:
            log_data = (
                b"[AC1000F Diagnostic System Log]\n"
                b"Time: 2026-11-04\n"
                b"WLAN 2.4G Status: UP (SSID: FPT Telecom, Channel: 6, Power: 100%)\n"
                b"WLAN 5G Status: UP (SSID: FPT Telecom_5G, Channel: 36, Power: 100%)\n"
                b"Client RSSI List: 70:85:c2:5b:9e:10 (-52 dBm, SNR: 45)\n"
            )
            return self._send(log_data, "text/plain; charset=utf-8")

        # 8. Diagnostics Packet Capture (Tcpdump.cap)
        if p_clean.endswith(".cap") or p_clean.endswith(".pcap"):
            cap_data = b"\xd4\xc3\xb2\xa1\x02\x00\x04\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x04\x00\x01\x00\x00\x00"
            self.send_response(200)
            self.send_header("Content-Type", "application/vnd.tcpdump.pcap")
            self.send_header("Content-Disposition", 'attachment; filename="Tcpdump.cap"')
            self.send_header("Content-Length", str(len(cap_data)))
            self.send_header("Access-Control-Allow-Origin", "*")
            self.end_headers()
            return self.wfile.write(cap_data)

        # 9. PVC / Service list popups
        if p_clean.endswith("/home_pvclist.asp") or p_clean.endswith("/home_servlist.asp"):
            dummy_popup = (
                '<!DOCTYPE html><html><head><meta charset="utf-8"><title>PVC/Service List</title>'
                '<link rel="stylesheet" href="/style.css">'
                '</head><body style="margin:10px;font-family:Arial,sans-serif;font-size:12px;background:#f5f5f5;">'
                '<h3 style="margin-top:0;color:#005a9c;">PVC / Service List</h3>'
                '<table border="1" cellpadding="5" cellspacing="0" style="border-collapse:collapse;width:100%;background:#fff;">'
                '<tr bgcolor="#eaeaea"><th>PVC</th><th>VPI/VCI</th><th>Encapsulation</th><th>Status</th></tr>'
                '<tr><td align="center">PVC0</td><td align="center">0/33</td><td align="center">LLC</td><td align="center" style="color:green;font-weight:bold;">Connected</td></tr>'
                '</table>'
                '<p style="text-align:center;margin-top:15px;"><input type="button" value="Close Window" onclick="window.close()" style="padding:4px 12px;cursor:pointer;"></p>'
                '</body></html>'
            )
            return self._send(dummy_popup.encode("utf-8"), "text/html; charset=utf-8")

        # 10. Filter lists
        if p_clean.endswith("/access_urlfilterlist.cgi") or p_clean.endswith("/access_ipfilterlist.cgi"):
            dummy_table = (
                '<!DOCTYPE html><html><head><meta charset="utf-8"></head><body style="margin:0;font-family:sans-serif;font-size:11px;">'
                '<table border="1" cellpadding="3" cellspacing="0" style="border-collapse:collapse;width:100%;">'
                '<tr bgcolor="#eee"><th width="30">#</th><th>Filter Rule</th><th width="60">Status</th></tr>'
                '<tr><td align="center">1</td><td>None (Allow All)</td><td align="center" style="color:green;">Enabled</td></tr>'
                '</table></body></html>'
            )
            return self._send(dummy_table.encode("utf-8"), "text/html; charset=utf-8")

        # 11. Catch-all cho moi trang .asp / .cgi / .html chua duoc crawl
        if p_clean.endswith((".asp", ".cgi", ".html", ".htm")):
            page_title = os.path.basename(p_clean)
            placeholder_html = (
                '<!DOCTYPE html><html><head><meta charset="utf-8"><title>AC1000F Gateway</title>'
                '<link rel="stylesheet" href="/style.css">'
                '</head><body style="padding:20px;font-family:Arial,sans-serif;color:#333;background:#fff;">'
                f'<h2 style="color:#005a9c;border-bottom:2px solid #005a9c;padding-bottom:5px;">ONT AC1000F - {page_title}</h2>'
                '<p>Chức năng cấu hình này đang hoạt động với cấu hình mặc định của hệ thống.</p>'
                '<p style="color:#666;font-size:12px;">Hệ thống mô phỏng FPT Telecom đã sẵn sàng cho bài thi của Kỹ thuật viên.</p>'
                '</body></html>'
            )
            return self._send(placeholder_html.encode("utf-8"), "text/html; charset=utf-8")

        return self._send(b"Not found: " + p.encode(), "text/plain", 404)

    def do_POST(self):
        parsed = urlparse(self.path)
        p = unquote(parsed.path)
        if p.startswith("/sim_ac1000f/"):
            p = p[len("/sim_ac1000f"):]
        if self._xu_ly_internal(p):
            return
        client_key = self._client_key()
        if p in ("/api/reset", "/resetsession") or "resetsession" in self.path.lower():
            with _STATE_LOCK:
                USER_STATES.pop(client_key, None)
            resp = b'{"status":"ok","message":"AC1000F state reset"}'
            return self._send(resp, "application/json; charset=utf-8")

        client_state = get_client_state(client_key)
        try:
            length = int(self.headers.get("Content-Length", 0) or 0)
            if length > 0:
                body_bytes = self.rfile.read(length)
                ctype = self.headers.get("Content-Type", "")
                if "application/x-www-form-urlencoded" in ctype:
                    params = parse_qs(body_bytes.decode("utf-8", errors="replace"))
                    for k, v in params.items():
                        if v:
                            client_state[k] = v[0]
        except Exception as e:
            pass

        # cac form Apply cua thiet bi POST ve CGI; ban gia lap luu state va redirect ve Referer
        self._redirect(self.headers.get("Referer") or "/cgi-bin/index.asp")

    def log_message(self, *a):
        pass


def make(port):
    s = ThreadingHTTPServer(("0.0.0.0", port), H)
    s.daemon_threads = True
    _khoi_dong_gc()
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
