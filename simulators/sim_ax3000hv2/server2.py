#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
Gia lap AX3000Hv2 (FPT Internet Hub) - dung TRANG THAT crawl tu thiet bi.
Kien truc frameset ASP: index.asp gom header/nav/main frame, moi trang la URL
/cgi-bin/*.asp that. Server nay phuc vu dung cac URL do, tra .asp/.cgi ve dang
text/html de trinh duyet render (khong tai xuong).

Chay: python server2.py [port]   (mac dinh 8092)
"""
import os, sys, socket, re, hmac, json, time
from http.server import BaseHTTPRequestHandler, ThreadingHTTPServer
from urllib.parse import urlparse, unquote, parse_qs

PORT = int(sys.argv[1]) if len(sys.argv) > 1 and sys.argv[1].isdigit() else 8092
BASE = os.path.dirname(os.path.abspath(__file__))
WWW = os.path.join(BASE, "www2")

CT = {
    ".asp": "text/html; charset=utf-8", ".cgi": "text/html; charset=utf-8",
    ".html": "text/html; charset=utf-8", ".htm": "text/html; charset=utf-8",
    ".css": "text/css", ".js": "application/javascript",
    ".png": "image/png", ".gif": "image/gif", ".jpg": "image/jpeg",
    ".jpeg": "image/jpeg", ".ico": "image/x-icon", ".svg": "image/svg+xml",
    ".ttf": "font/ttf", ".woff": "font/woff", ".woff2": "font/woff2",
    ".otf": "font/otf", ".eot": "application/vnd.ms-fontobject",
}

_RE_CGIBIN_CACHE = {}
_RE_ASSETS_CACHE = {}


def get_nav_and_tab_for_page(page_name):
    page_lower = page_name.lower()
    if any(k in page_lower for k in ["home_wan", "home_wireless", "home_lan", "adv_nat", "adv_qos", "home_wizard", "wifi_basic", "wifi_guest", "wifi5"]):
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


def rewrite_sim_urls(content: str, sim_id: str = "sim_ax3000hv2") -> str:
    if not content:
        return content
    re_cgibin = _RE_CGIBIN_CACHE.get(sim_id)
    if re_cgibin is None:
        re_cgibin = re.compile(rf'(?<!/{sim_id})(?<!{sim_id})/cgi-bin/')
        _RE_CGIBIN_CACHE[sim_id] = re_cgibin
    re_assets = _RE_ASSETS_CACHE.get(sim_id)
    if re_assets is None:
        re_assets = re.compile(
            rf'(?<!/{sim_id})(?<!{sim_id})/(val\.js|style\.css|general\.js|ip\.js|ip_new\.js|jsl\.js|chksel\.js|spin\.js|pvc\.js|mac\.js|wanfunc\.js|mesh\.js|mesh_basic_setting\.js|mesh_topo\.js|d3\.v5\.min\.js|jquery_e8c\.js|menu_e8c\.js|util_e8c\.js|sha256\.js|stylemain_e8c\.css|mesh\.css|BeVietnam-[a-zA-Z]+\.ttf|PIE\.htc|[a-zA-Z0-9_-]+\.(?:png|gif|jpg|jpeg|ico|svg))',
            flags=re.IGNORECASE,
        )
        _RE_ASSETS_CACHE[sim_id] = re_assets
    content = re_cgibin.sub(f'/{sim_id}/cgi-bin/', content)
    content = re_assets.sub(rf'/{sim_id}/\1', content)
    return content


import threading

_STATE_LOCK = threading.Lock()
SIM_STATE = {}
USER_STATES = {}

# ---- B3: tai lap hang loat cho load test + thu hoi phien het han ----------
# Chi co the kich hoat khi dat bien moi truong FTC_SIM_ADMIN_TOKEN; khong dat
# thi /internal/reset luon tra 403 (mac dinh an toan).
_ADMIN_TOKEN = os.environ.get("FTC_SIM_ADMIN_TOKEN", "")
_SESSION_TTL = float(os.environ.get("FTC_SIM_SESSION_TTL", "1800") or 1800)
_MAX_SESSIONS = 10000
_LAST_SEEN = {}
_HV2_STATIC_CACHE = {}
_HV2_TEXT_CACHE = {}


def _doc_text_rewritten(f, sim_id="sim_ax3000hv2"):
    """Doc va cache ban HTML da rewrite URL trong RAM de 5.000 KTV khong chay lai Regex."""
    cache_key = (f, sim_id)
    cached = _HV2_TEXT_CACHE.get(cache_key)
    if cached is not None:
        return cached
    raw = _HV2_TEXT_CACHE.get(f)
    if raw is None:
        with open(f, "r", encoding="utf-8", errors="replace") as fh:
            raw = fh.read()
        _HV2_TEXT_CACHE[f] = raw
    rewritten = rewrite_sim_urls(raw, sim_id)
    _HV2_TEXT_CACHE[cache_key] = rewritten
    return rewritten


def _gc_sessions_unlocked(now):
    het_han = [k for k, t in list(_LAST_SEEN.items()) if now - t > _SESSION_TTL]
    for k in het_han:
        USER_STATES.pop(k, None)
        _LAST_SEEN.pop(k, None)
    if len(USER_STATES) > _MAX_SESSIONS:
        sap_xep = sorted(_LAST_SEEN.items(), key=lambda x: x[1])
        so_can_xoa = len(USER_STATES) - _MAX_SESSIONS
        for k, _ in sap_xep[:so_can_xoa]:
            USER_STATES.pop(k, None)
            _LAST_SEEN.pop(k, None)
    return len(het_han)


def _gc_loop():
    while True:
        time.sleep(max(30.0, _SESSION_TTL / 2.0))
        with _STATE_LOCK:
            _gc_sessions_unlocked(time.time())


_GC_STARTED = False

def _khoi_dong_gc():
    global _GC_STARTED
    with _STATE_LOCK:
        if _GC_STARTED:
            return
        _GC_STARTED = True
        threading.Thread(target=_gc_loop, daemon=True, name="ax3000hv2_gc").start()

# Khoi dong GC tu dong khi nap qua run_all.py hoac chay truc tiep
_khoi_dong_gc()

def get_client_state(key):
    if not key:
        return SIM_STATE
    with _STATE_LOCK:
        _LAST_SEEN[key] = time.time()
        if key not in USER_STATES:
            if len(USER_STATES) >= _MAX_SESSIONS:
                _gc_sessions_unlocked(_LAST_SEEN[key])
            USER_STATES[key] = {}
        return USER_STATES[key]

def apply_sim_state_to_html(html_str, show_success=False, page_path="", state=None):
    if state is None:
        state = SIM_STATE
    # Kiểm tra xem trang có dữ liệu trong state hay không
    has_saved_data = False
    if state:
        p_lower = (page_path or "").lower()
        if "wan" in p_lower and any(k in state for k in ["pppUserName", "pppPassword", "Username", "Password"]):
            has_saved_data = True
        elif ("lan" in p_lower or "dhcp" in p_lower) and any(k in state for k in ["uiViewIPAddr", "StartIp", "PoolSize", "PrimaryDns", "dnsTypeRadio"]):
            has_saved_data = True
        elif ("wireless" in p_lower or "wifi" in p_lower) and any(k in state for k in ["ESSID", "PreSharedKey", "wifi5SSid_2G"]):
            has_saved_data = True

    if show_success or has_saved_data:
        # Inject: danh dau _ftcIsSaved + goi onSimulatorSave len Portal (khong alert native popup)
        save_js = """<script type="text/javascript">
document._ftcIsSaved = true;
window.addEventListener("DOMContentLoaded", function() {
    document._ftcIsSaved = true;
    // Lang nghe thay doi input -> reset co neu nguoi dung sua lai
    document.addEventListener('input', function() { document._ftcIsSaved = false; });
    document.addEventListener('change', function() { document._ftcIsSaved = false; });
    // Thong bao len Portal (app.js) qua postMessage de vuot qua gioi han cross-origin
    try {
        window.top.postMessage({ type: 'FTC_SAVE_SUCCESS', source: 'ax3000hv2' }, '*');
    } catch(e) {}
});
try {
    window.top.postMessage({ type: 'FTC_SAVE_SUCCESS', source: 'ax3000hv2' }, '*');
} catch(e) {}
</script>"""
        if re.search(r'</head>', html_str, re.IGNORECASE):
            html_str = re.sub(r'</head>', save_js + "</head>", html_str, count=1, flags=re.IGNORECASE)
        else:
            html_str = save_js + html_str

    if not state:
        return html_str

    # 1. Replace JavaScript variables to prevent inline script overrides
    VAR_MAPPINGS = {
        "pppoe_name": "pppUserName",
        "pppoe_pwd": "pppPassword",
        "wifi_ssid_2g": "ESSID",
        "wifi_pwd_2g": "PreSharedKey",
        "wifi_ssid_5g": "ESSID_5g",
        "wifi_pwd_5g": "PreSharedKey_5g",
        "wifi_enable_2g": "enable_SSID",
        "wifi_enable_5g": "enable_SSID_5g",
        "wifi5_ssid_2g": "wifi5SSid_2G",
        "wifi5_psk_2g": "wifi5Pwd_2G",
        "wifi5_ssid_5g": "wifi5SSid_5G",
        "wifi5_psk_5g": "wifi5Pwd_5G",
        "wifi5_enable_2g": "Enable_Wifi5_2G",
        "wifi5_enable_5g": "Enable_Wifi5_5G",
        "lan_ip": "uiViewIPAddr",
        "lan_netmask": "uiViewNetMask",
        "dhcpd_start": "StartIp",
        "dhcpd_pool_count": "PoolSize",
        "dhcpd_lease": "dhcp_LeaseTime",
    }

    for var_name, param_name in VAR_MAPPINGS.items():
        if param_name in state:
            val = state[param_name]
            escaped_val = val.replace('\\', '\\\\').replace('"', '\\"')
            html_str = re.sub(rf'(var\s+{var_name}\s*=\s*["\'])[^"\']*?(["\'])', rf'\g<1>{escaped_val}\2', html_str, flags=re.IGNORECASE)
            html_str = re.sub(rf'\b({var_name}\s*=\s*["\'])[^"\']*?(["\'])', rf'\g<1>{escaped_val}\2', html_str, flags=re.IGNORECASE)

    if "dnsTypeRadio" in state:
        val = state["dnsTypeRadio"]
        html_str = re.sub(r'(var\s+dhcpd_type\s*=\s*["\'])[^"\']*?(["\'])', fr'\g<1>{val}\g<2>', html_str, flags=re.IGNORECASE)

    if "PrimaryDns" in state or "SecondDns" in state:
        pri = state.get("PrimaryDns", "")
        sec = state.get("SecondDns", "")
        val_dns = f"N/A,{pri},{sec}"
        html_str = re.sub(r'(var\s+dhcpd_dns_all\s*=\s*["\'])[^"\']*?(["\'])', fr'\g<1>{val_dns}\g<2>', html_str, flags=re.IGNORECASE)

    # 2. Replace HTML inputs directly
    for name, val in state.items():
        escaped_val = val.replace('\\', '\\\\').replace('"', '\\"')

        def input_callback(match):
            tag = match.group(0)

            # Check input type
            type_match = re.search(r'type=["\'](.*?)["\']', tag, flags=re.IGNORECASE)
            itype = type_match.group(1).lower() if type_match else 'text'

            if itype in ('radio', 'checkbox'):
                val_match = re.search(rf'value=["\'](.*?)["\']', tag, flags=re.IGNORECASE)
                tag_clean = re.sub(r'\s+checked(=["\']?checked["\']?)?', '', tag, flags=re.IGNORECASE)
                if val_match and val_match.group(1) == val:
                    if tag_clean.endswith('/>'):
                        return tag_clean[:-2] + ' checked="checked" />'
                    else:
                        return tag_clean[:-1] + ' checked="checked" >'
                return tag_clean
            else:
                if re.search(r'value=["\']', tag, flags=re.IGNORECASE):
                    tag_clean = re.sub(r'(value=["\'])[^"\']*?(["\'])', rf'\g<1>{escaped_val}\2', tag, flags=re.IGNORECASE)
                    return tag_clean
                else:
                    if tag.endswith('/>'):
                        return tag[:-2] + f' value="{escaped_val}" />'
                    else:
                        return tag[:-1] + f' value="{escaped_val}" >'

        pattern_input = rf'<input[^>]*?name=["\']{re.escape(name)}["\'][^>]*?>'
        html_str = re.sub(pattern_input, input_callback, html_str, flags=re.IGNORECASE)

    return html_str


class H(BaseHTTPRequestHandler):
    def _send(self, data, ctype, code=200, cache_control="no-store"):
        try:
            self.send_response(code)
            self.send_header("Content-Type", ctype)
            self.send_header("Content-Length", str(len(data)))
            self.send_header("Cache-Control", cache_control)
            self.send_header("Access-Control-Allow-Origin", "*")
            self.send_header("Access-Control-Allow-Methods", "GET, POST, OPTIONS")
            self.send_header("Access-Control-Allow-Headers", "*")
            self.end_headers()
            self.wfile.write(data)
        except (ConnectionResetError, ConnectionAbortedError, BrokenPipeError):
            pass

    def _redirect(self, to):
        self.send_response(302)
        self.send_header("Location", to)
        self.send_header("Access-Control-Allow-Origin", "*")
        self.send_header("Content-Length", "0")
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
            m = re.search(r'(?:ftc_session|ax3000hv2_sid|PHPSESSID|ktv_client_id)=([a-zA-Z0-9_-]+)', cookie)
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
        resp = json.dumps({"status": "ok", "message": "AX3000HV2 state reset (load test)", "cleared_sessions": cleared})
        self._send(resp.encode("utf-8"), "application/json; charset=utf-8")
        return True

    def do_GET(self):
        client_key = self._client_key()
        client_state = get_client_state(client_key)
        parsed = urlparse(self.path)
        p = unquote(parsed.path)

        if p.startswith("/internal/"):
            return self._send(b'{"status":"method_not_allowed"}', "application/json; charset=utf-8", 405)

        if p in ("/", "/index.html", "/cgi-bin/login.html"):
            return self._redirect("/cgi-bin/login.asp")

        if p in ("/cgi-bin/requestFromLoginPage", "/cgi-bin/reqLogin", "/cgi-bin/logincheck.cgi"):
            return self._redirect("/cgi-bin/index.asp")

        if p in ("/api/reset", "/resetsession") or "resetsession" in self.path.lower():
            with _STATE_LOCK:
                USER_STATES.pop(client_key, None)
            resp = b'{"status":"ok","message":"AX3000Hv2 state reset"}'
            return self._send(resp, "application/json; charset=utf-8")

        if "logout" in self.path.lower():
            client_state.clear()
            return self._redirect("/cgi-bin/login.asp")

        show_success = "save_success=1" in self.path

        # Xu ly dac biet cho /cgi-bin/index.asp (ho tro render full frameset theo page)
        if p == "/cgi-bin/index.asp":
            qs = parse_qs(parsed.query)
            page_param = qs.get("page", [""])[0]
            nav_param = qs.get("nav", [""])[0]
            tab_param = qs.get("tab", [""])[0]

            f = os.path.join(WWW, "cgi-bin", "index.asp")
            if os.path.isfile(f):
                if page_param:
                    if f not in _HV2_TEXT_CACHE:
                        with open(f, "r", encoding="utf-8", errors="replace") as fh:
                            _HV2_TEXT_CACHE[f] = fh.read()
                    html = _HV2_TEXT_CACHE[f]
                    clean_page = page_param if page_param.startswith("/cgi-bin/") else f"/cgi-bin/{page_param}"
                    auto_nav, auto_tab = get_nav_and_tab_for_page(clean_page)
                    final_nav = nav_param if nav_param else auto_nav
                    final_tab = tab_param if tab_param else auto_tab

                    html = re.sub(r'src=["\']/cgi-bin/status\.asp["\']', f'src="/cgi-bin/status.asp?tab={final_tab}"', html)
                    html = re.sub(r'src=["\']/cgi-bin/navigation-status\.asp["\']', f'src="{final_nav}?page={clean_page}"', html)
                    html = re.sub(r'src=["\']/cgi-bin/status_deviceinfo\.asp["\']', f'src="{clean_page}"', html)
                    html = rewrite_sim_urls(html, "sim_ax3000hv2")
                else:
                    html = _doc_text_rewritten(f, "sim_ax3000hv2")

                html = apply_sim_state_to_html(html, show_success, page_param or p, state=client_state)
                return self._send(html.encode("utf-8"), "text/html; charset=utf-8")

        # Xu ly dac biet cho /cgi-bin/status.asp de active tab truyen qua URL (?tab=Network)
        if p == "/cgi-bin/status.asp":
            qs = parse_qs(parsed.query)
            tab_val = qs.get("tab", [""])[0]

            f = os.path.join(WWW, "cgi-bin", "status.asp")
            if os.path.isfile(f):
                html = _doc_text_rewritten(f, "sim_ax3000hv2")

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
                        html = re.sub(r'</head>', tab_script + "</head>", html, count=1, flags=re.IGNORECASE)
                    else:
                        html = tab_script + html

                html = apply_sim_state_to_html(html, show_success, p, state=client_state)
                return self._send(html.encode("utf-8"), "text/html; charset=utf-8")

        # Duong dan file trong www2
        f = os.path.join(WWW, p.lstrip("/"))
        if os.path.isfile(f):
            ext = os.path.splitext(f)[1].lower()
            if ext in (".asp", ".html", ".htm"):
                text_content = _doc_text_rewritten(f, "sim_ax3000hv2")

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

                text_content = apply_sim_state_to_html(text_content, show_success, p, state=client_state)
                return self._send(text_content.encode("utf-8"), CT.get(ext, "text/html; charset=utf-8"))
            else:
                if f in _HV2_STATIC_CACHE:
                    content = _HV2_STATIC_CACHE[f]
                else:
                    with open(f, "rb") as fh:
                        content = fh.read()
                    _HV2_STATIC_CACHE[f] = content
                return self._send(content, CT.get(ext, "application/octet-stream"), cache_control="public, max-age=86400, stale-while-revalidate=86400")

        return self._send(b"Not found: " + p.encode(), "text/plain", 404)

    def do_POST(self):
        parsed = urlparse(self.path)
        p = unquote(parsed.path)
        if self._xu_ly_internal(p):
            return
        client_key = self._client_key()
        if p in ("/api/reset", "/resetsession") or "resetsession" in self.path.lower():
            with _STATE_LOCK:
                USER_STATES.pop(client_key, None)
            resp = b'{"status":"ok","message":"AX3000Hv2 state reset"}'
            return self._send(resp, "application/json; charset=utf-8")

        client_state = get_client_state(client_key)
        try:
            length = int(self.headers.get("Content-Length", 0) or 0)
            if length > 0:
                body_bytes = self.rfile.read(length)
                params = parse_qs(body_bytes.decode("utf-8", errors="replace"))
                for k, v in params.items():
                    if v:
                        client_state[k] = v[0]
                        if k == "Username":
                            client_state["pppUserName"] = v[0]
                        elif k == "Password":
                            client_state["pppPassword"] = v[0]
                        elif k == "PreSharedKey":
                            client_state["PreSharedKey1"] = v[0]
                        elif k == "PreSharedKey1":
                            client_state["PreSharedKey"] = v[0]
        except Exception:
            pass

        referer = self.headers.get("Referer") or "/cgi-bin/index.asp"
        ref_parsed = urlparse(referer)
        path_to_use = ref_parsed.path or "/cgi-bin/index.asp"
        if not path_to_use.startswith('/'):
            path_to_use = '/' + path_to_use
        if "save_success=1" in referer:
            redirect_to = path_to_use + (("?" + ref_parsed.query) if ref_parsed.query else "")
        else:
            query_part = (ref_parsed.query + "&" if ref_parsed.query else "") + "save_success=1"
            redirect_to = path_to_use + "?" + query_part
        self._redirect(redirect_to)

    def log_message(self, *a):
        pass


class DualStack(ThreadingHTTPServer):
    address_family = socket.AF_INET6
    daemon_threads = True

    def server_bind(self):
        try:
            self.socket.setsockopt(socket.IPPROTO_IPV6, socket.IPV6_V6ONLY, 0)
        except (AttributeError, OSError):
            pass
        super().server_bind()


def make(port):
    s = ThreadingHTTPServer(("0.0.0.0", port), H)
    s.daemon_threads = True
    _khoi_dong_gc()
    return s


if __name__ == "__main__":
    srv = make(PORT)
    print("=" * 56)
    print("  Gia lap AX3000Hv2 (FPT Internet Hub) - tu thiet bi that")
    print(f"  Mo trinh duyet: http://localhost:{PORT}/")
    print(f"  So trang: {len(os.listdir(os.path.join(WWW,'cgi-bin')))}")
    print("  Ctrl+C de dung")
    print("=" * 56)
    try:
        srv.serve_forever()
    except KeyboardInterrupt:
        print("\nDa dung.")
