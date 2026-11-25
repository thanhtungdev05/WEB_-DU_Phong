import json
import os
import re
from http.server import SimpleHTTPRequestHandler

ROOT = os.path.join(os.path.dirname(os.path.abspath(__file__)), "www")


def _split_octets(ip_str, default_ip="192.168.1.1"):
    s = str(ip_str or default_ip).strip()
    parts = s.split(".")
    if len(parts) == 4 and all(p.isdigit() and 0 <= int(p) <= 255 for p in parts):
        return [str(int(p)) for p in parts]
    return default_ip.split(".")


def _replace_input_val(html, input_id, new_val):
    esc_id = re.escape(input_id)
    pattern = re.compile(r'(<input\b[^>]*\bid="' + esc_id + r'"[^>]*\bvalue=")([^"]*)(")', re.IGNORECASE)
    if pattern.search(html):
        return pattern.sub(lambda m: m.group(1) + str(new_val) + m.group(3), html)
    pattern_rev = re.compile(r'(<input\b[^>]*\bvalue=")([^"]*)("[^>]*\bid="' + esc_id + r'")', re.IGNORECASE)
    return pattern_rev.sub(lambda m: m.group(1) + str(new_val) + m.group(3), html)


def _inject_lan_mgr_ipv4(content, st):
    lan_ip = st.get("ont_lan_ip") or st.get("gateway_ip") or "192.168.1.1"
    subnet_mask = st.get("ont_subnet_mask") or "255.255.255.0"
    dhcp_enable = str(st.get("ont_dhcp_enable", "1"))
    dhcp_start = st.get("ont_dhcp_start") or "192.168.1.2"
    dhcp_end = st.get("ont_dhcp_end") or "192.168.1.254"
    isp_dns = str(st.get("ont_isp_dns", "0"))
    primary_dns = st.get("ont_primary_dns") or lan_ip
    secondary_dns = st.get("ont_secondary_dns") or "0.0.0.0"
    lease_time = str(st.get("ont_lease_time", "86400"))

    # Hidden inputs
    content = _replace_input_val(content, "IF_URL_HOST", lan_ip)
    content = _replace_input_val(content, "IPAddr:DHCPBasicCfg", lan_ip)
    content = _replace_input_val(content, "SubMask", subnet_mask)
    content = _replace_input_val(content, "SubnetMask", subnet_mask)
    content = _replace_input_val(content, "MinAddress:DHCPBasicCfg", dhcp_start)
    content = _replace_input_val(content, "MaxAddress:DHCPBasicCfg", dhcp_end)
    content = _replace_input_val(content, "DNSServer1", primary_dns)
    content = _replace_input_val(content, "DNSServer2", secondary_dns)
    content = _replace_input_val(content, "LeaseTime", lease_time)
    content = _replace_input_val(content, "LeaseTimeSelfDefine", lease_time)

    # 4-octet inputs
    ip_octs = _split_octets(lan_ip, "192.168.1.1")
    mask_octs = _split_octets(subnet_mask, "255.255.255.0")
    min_octs = _split_octets(dhcp_start, "192.168.1.2")
    max_octs = _split_octets(dhcp_end, "192.168.1.254")
    dns1_octs = _split_octets(primary_dns, "192.168.1.1")
    dns2_octs = _split_octets(secondary_dns, "0.0.0.0")

    for i in range(4):
        content = _replace_input_val(content, f"sub_IPAddr{i}:DHCPBasicCfg", ip_octs[i])
        content = _replace_input_val(content, f"sub_SubMask{i}", mask_octs[i])
        content = _replace_input_val(content, f"sub_MinAddress{i}:DHCPBasicCfg", min_octs[i])
        content = _replace_input_val(content, f"sub_MaxAddress{i}:DHCPBasicCfg", max_octs[i])
        content = _replace_input_val(content, f"sub_DNSServer1{i}", dns1_octs[i])
        content = _replace_input_val(content, f"sub_DNSServer2{i}", dns2_octs[i])

    if dhcp_enable == "0":
        content = content.replace(
            'id="ServerEnable1" name="ServerEnable" value="1" aria-label="DHCP Server On" checked="checked"',
            'id="ServerEnable1" name="ServerEnable" value="1" aria-label="DHCP Server On"'
        )
        content = content.replace(
            'id="ServerEnable0" name="ServerEnable" value="0" aria-label="DHCP Server Off"',
            'id="ServerEnable0" name="ServerEnable" value="0" aria-label="DHCP Server Off" checked="checked"'
        )
    if isp_dns == "1":
        content = content.replace(
            'id="DnsServerSource1" name="DnsServerSource" value="1" aria-label="ISP DNS On"',
            'id="DnsServerSource1" name="DnsServerSource" value="1" aria-label="ISP DNS On" checked="checked"'
        )
        content = content.replace(
            'id="DnsServerSource0" name="DnsServerSource" value="0" aria-label="ISP DNS Off" checked="checked"',
            'id="DnsServerSource0" name="DnsServerSource" value="0" aria-label="ISP DNS Off"'
        )

    # Expand DHCP Server container by default so synced values are immediately visible
    content = content.replace(
        '<div id="DHCPBasicCfg_container" aria-live="polite" style="display: none;">',
        '<div id="DHCPBasicCfg_container" aria-live="polite" style="display: block;">'
    )
    content = content.replace(
        'id="DHCPBasicCfgBar" tabindex="0" aria-expanded="false"',
        'id="DHCPBasicCfgBar" class="area-title collapBarWithDataTrans collapsibleBarExp" tabindex="0" aria-expanded="true"'
    )

    # Populate Allocated Address (DHCP) when connected
    if st.get("is_ap_online", True):
        client_ip = st.get("client_ip", "192.168.1.150")
        client_host = st.get("client_hostname", "Smartphone_Client_KTV")
        port_name = st.get("ap_port", "WAN_25GE")
        rows_html = f"""
<tr class="colorTblRow fpt-live-dhcp-row">
<td style="width:130px" title="ONT_BE12000Z">ONT_BE12000Z (Gateway)</td>
<td style="width:130px" title="94:87:e0:aa:bb:01">94:87:e0:aa:bb:01</td>
<td style="width:130px" id="fpt_sync_gw_ip" title="{lan_ip}">{lan_ip}</td>
<td style="width:130px" title="{port_name}">{port_name}</td>
<td style="width:130px" title="23h 59m 10s">23h 59m 10s</td>
</tr>
<tr class="colorTblRow colorRow fpt-live-dhcp-row">
<td style="width:130px" title="{client_host}">{client_host}</td>
<td style="width:130px" title="34:e1:2d:88:99:aa">34:e1:2d:88:99:aa</td>
<td style="width:130px" id="fpt_sync_client_ip" title="{client_ip}">{client_ip}</td>
<td style="width:130px" title="WLAN (Mesh)">WLAN (Mesh)</td>
<td style="width:130px" title="23h 55m 42s">23h 55m 42s</td>
</tr>
"""
        content = re.sub(
            r'<div class="noDataHint" style="">\s*<div>There are no data now\.\s*</div>\s*</div>',
            '<div class="noDataHint" style="display:none;"><div>There are no data now. </div></div>',
            content
        )
        content = content.replace(
            '<form class="form_content" onsubmit="return false;" aria-label="Allocated Address (DHCP)" style="display: none;">',
            '<form class="form_content" onsubmit="return false;" aria-label="Allocated Address (DHCP)" style="display: block;">'
        )
        content = content.replace(
            '<tr id="template_LANIPv4_DHCPHosts" class="colorTblRow" style="display:none;">',
            rows_html + '<tr id="template_LANIPv4_DHCPHosts" class="colorTblRow" style="display:none;">'
        )

    # Inject live real-time cross-tab & backend sync listener
    live_js = """
<script type="text/javascript">
(function(){
    function _setOctets(prefix, suffix, ipStr) {
        if (!ipStr || typeof ipStr !== "string") return;
        var parts = ipStr.trim().split(".");
        if (parts.length !== 4) return;
        for (var i = 0; i < 4; i++) {
            var el = document.getElementById(prefix + i + (suffix || ""));
            if (el && document.activeElement !== el) {
                el.value = parts[i];
            }
        }
    }
    function _applySyncedDhcp(d) {
        if (!d) return;
        var lanIp = d.ont_lan_ip || d.IPAddr || d.lanIp || "";
        var subMask = d.ont_subnet_mask || d.SubMask || d.subnetMask || "";
        var minIp = d.ont_dhcp_start || d.MinAddress || d.dhcpStart || "";
        var maxIp = d.ont_dhcp_end || d.MaxAddress || d.dhcpEnd || "";
        var dns1 = d.ont_primary_dns || d.DNSServer1 || d.primaryDns || "";
        var dns2 = d.ont_secondary_dns || d.DNSServer2 || d.secondaryDns || "";
        var lease = d.ont_lease_time || d.LeaseTime || d.leaseTime || "";
        var srvEn = d.ont_dhcp_enable !== undefined ? String(d.ont_dhcp_enable) : (d.ServerEnable !== undefined ? String(d.ServerEnable) : "");
        var ispDns = d.ont_isp_dns !== undefined ? String(d.ont_isp_dns) : (d.DnsServerSource !== undefined ? String(d.DnsServerSource) : "");

        if (lanIp) {
            _setOctets("sub_IPAddr", ":DHCPBasicCfg", lanIp);
            var hIp = document.getElementById("IPAddr:DHCPBasicCfg");
            if (hIp) hIp.value = lanIp;
            var gwCell = document.getElementById("fpt_sync_gw_ip");
            if (gwCell) { gwCell.textContent = lanIp; gwCell.title = lanIp; }
        }
        if (subMask) {
            _setOctets("sub_SubMask", "", subMask);
            var hMask = document.getElementById("SubMask");
            if (hMask) hMask.value = subMask;
        }
        if (minIp) {
            _setOctets("sub_MinAddress", ":DHCPBasicCfg", minIp);
            var hMin = document.getElementById("MinAddress:DHCPBasicCfg");
            if (hMin) hMin.value = minIp;
        }
        if (maxIp) {
            _setOctets("sub_MaxAddress", ":DHCPBasicCfg", maxIp);
            var hMax = document.getElementById("MaxAddress:DHCPBasicCfg");
            if (hMax) hMax.value = maxIp;
        }
        if (dns1) {
            _setOctets("sub_DNSServer1", "", dns1);
            var hDns1 = document.getElementById("DNSServer1");
            if (hDns1) hDns1.value = dns1;
        }
        if (dns2) {
            _setOctets("sub_DNSServer2", "", dns2);
            var hDns2 = document.getElementById("DNSServer2");
            if (hDns2) hDns2.value = dns2;
        }
        if (lease) {
            var lEl = document.getElementById("LeaseTimeSelfDefine");
            if (lEl && document.activeElement !== lEl) lEl.value = lease;
            var hLease = document.getElementById("LeaseTime");
            if (hLease) hLease.value = lease;
        }
        if (srvEn === "0" || srvEn === "1") {
            var r1 = document.getElementById("ServerEnable1");
            var r0 = document.getElementById("ServerEnable0");
            if (r1 && r0) { r1.checked = (srvEn === "1"); r0.checked = (srvEn === "0"); }
        }
        if (ispDns === "0" || ispDns === "1") {
            var d1 = document.getElementById("DnsServerSource1");
            var d0 = document.getElementById("DnsServerSource0");
            if (d1 && d0) { d1.checked = (ispDns === "1"); d0.checked = (ispDns === "0"); }
        }
        if (d.client_ip) {
            var clCell = document.getElementById("fpt_sync_client_ip");
            if (clCell) { clCell.textContent = d.client_ip; clCell.title = d.client_ip; }
        }
    }
    var _mNode = location.pathname.match(new RegExp("^(/mesh-node/[A-Za-z0-9_-]+)"));
    var _nodeId = _mNode ? _mNode[1].split("/").pop() : "";
    var _syncUrl = (location.pathname.indexOf("/sim_be15000") !== -1
        ? ((_mNode ? _mNode[1] : "") + "/sim_be15000/api/live-sync")
        : "/api/live-sync");
    function _pollBackend() {
        if (!_mNode) {
            try {
                var raw = localStorage.getItem("fpt_mesh_live_dhcp");
                if (raw) {
                    var parsed = JSON.parse(raw);
                    if (parsed && parsed.IPAddr) _applySyncedDhcp(parsed);
                }
            } catch (e) {}
        }
        try {
            fetch(_syncUrl, { cache: "no-store" })
                .then(function(r){ return r.ok ? r.json() : null; })
                .then(function(st){ if (st) _applySyncedDhcp(st); })
                .catch(function(){});
        } catch (e) {}
    }
    if (typeof BroadcastChannel !== "undefined") {
        try {
            var bc = new BroadcastChannel("fpt_mesh_live_sync");
            bc.onmessage = function(ev) {
                if (ev && ev.data && ev.data.payload) {
                    if (!_nodeId || ev.data.nodeId === _nodeId) _applySyncedDhcp(ev.data.payload);
                }
            };
        } catch (e) {}
    }
    window.addEventListener("storage", function(ev){
        if (!_mNode && ev.key === "fpt_mesh_live_dhcp" && ev.newValue) {
            try { _applySyncedDhcp(JSON.parse(ev.newValue)); } catch (e) {}
        }
    });
    window.addEventListener("focus", _pollBackend);
    setInterval(_pollBackend, 1500);
})();
</script>
"""
    if "</body>" in content:
        content = content.replace("</body>", live_js + "</body>")
    else:
        content += live_js
    return content


class H(SimpleHTTPRequestHandler):
    def __init__(self, *args, **kwargs):
        super().__init__(*args, directory=ROOT, **kwargs)

    def _client_id(self):
        hdr = (self.headers.get("X-KTV-Session-ID", "") or "").strip() if hasattr(self, "headers") else ""
        if hdr:
            return hdr
        from urllib.parse import parse_qs, urlparse
        q = parse_qs(urlparse(getattr(self, "path", "")).query)
        if "_ktv" in q and q["_ktv"][0]:
            return q["_ktv"][0].strip()
        cookie = self.headers.get("Cookie", "") if hasattr(self, "headers") else ""
        m = re.search(r'(?:ftc_session|be15000_sid|PHPSESSID|ktv_client_id)=([a-zA-Z0-9_-]+)', cookie)
        if m:
            return m.group(1)
        return None

    def _gui_reset(self):
        try:
            import mesh_zte_engine
            mesh_zte_engine.reset_lab(session_id=self._client_id())
        except Exception:
            pass
        resp = b'{"status":"ok","message":"BE15000 state reset"}'
        self.send_response(200)
        self.send_header("Content-Type", "application/json")
        self.send_header("Cache-Control", "no-store")
        self.send_header("Content-Length", str(len(resp)))
        self.end_headers()
        self.wfile.write(resp)

    def _gui_json(self, data_obj, code=200):
        raw = json.dumps(data_obj, ensure_ascii=False).encode("utf-8")
        self.send_response(code)
        self.send_header("Content-Type", "application/json; charset=utf-8")
        self.send_header("Cache-Control", "no-store")
        self.send_header("Content-Length", str(len(raw)))
        self.end_headers()
        self.wfile.write(raw)

    def _gui_html(self, html_text, code=200):
        data = html_text.encode('utf-8')
        self.send_response(code)
        self.send_header("Content-Type", "text/html; charset=utf-8")
        self.send_header("Cache-Control", "no-store")
        self.send_header("Content-Length", str(len(data)))
        self.end_headers()
        self.wfile.write(data)

    def do_GET(self):
        path = self.path.split('?')[0].split('#')[0]
        sid = self._client_id()
        if path in ("/api/reset", "/resetsession"):
            return self._gui_reset()

        if path in ("/api/live-sync", "/api/sim-state"):
            try:
                import mesh_zte_engine
                return self._gui_json(mesh_zte_engine.get_state(session_id=sid))
            except Exception:
                return self._gui_json({"status": "error"}, 500)

        # Kiểm tra trạng thái nguồn AP từ Mesh Engine
        st = {}
        try:
            import mesh_zte_engine
            st = mesh_zte_engine.get_state(session_id=sid)
            if not st.get("ap_power", True):
                if not (path.endswith('.css') or path.endswith('.js') or path.endswith('.png') or path.endswith('.ico')):
                    return self._gui_html(
                        '<!DOCTYPE html><html><head><meta charset="utf-8"><title>AP Đang Tắt Nguồn</title></head>'
                        '<body style="background:#090d16;color:#f87171;font-family:system-ui,-apple-system,sans-serif;'
                        'display:flex;align-items:center;justify-content:center;height:100vh;margin:0;">'
                        '<div style="text-align:center;padding:36px;background:#131c2e;border-radius:16px;'
                        'border:1px solid #1e293b;max-width:480px;box-shadow:0 20px 40px rgba(0,0,0,0.5);">'
                        '<div style="font-size:52px;margin-bottom:16px;">🔌❌</div>'
                        '<h2 style="color:#f8fafc;margin:0 0 10px 0;font-size:20px;">AP BE15000Z Đang Tắt Nguồn</h2>'
                        '<p style="color:#94a3b8;font-size:14px;line-height:1.6;margin:0 0 20px 0;">'
                        'Thiết bị Access Point đang ở trạng thái ngắt điện. Vui lòng bật nguồn thiết bị trên '
                        '<b>Sơ đồ Đấu nối Topology</b> để truy cập giao diện quản trị.</p>'
                        '<span style="display:inline-block;padding:6px 14px;background:rgba(239,68,68,0.15);'
                        'color:#fca5a5;border-radius:20px;font-size:12px;font-weight:600;">STATUS: POWER_OFF (0V)</span>'
                        '</div></body></html>', 503
                    )
        except Exception:
            pass

        full_path = os.path.join(self.directory, path.lstrip('/'))
        if not os.path.exists(full_path) and os.path.exists(full_path + '.html'):
            self.path = self.path.replace(path, path + '.html', 1)
            full_path = full_path + '.html'

        # Động hóa thông số LAN / DHCP Server từ BE12000Z sang trang lanMgrIpv4.html của BE15000Z
        if 'lanMgrIpv4' in path and os.path.exists(full_path):
            try:
                with open(full_path, 'r', encoding='utf-8', errors='replace') as fh:
                    content = fh.read()
                content = _inject_lan_mgr_ipv4(content, st or {})
                return self._gui_html(content)
            except Exception:
                pass

        # Động hóa SSID và IP đồng bộ từ Controller sang trang localNetStatus.html / arpTable.html
        if ('localNetStatus' in path or 'arpTable' in path) and os.path.exists(full_path):
            try:
                with open(full_path, 'r', encoding='utf-8', errors='replace') as fh:
                    content = fh.read()
                if st:
                    synced_ssid = st.get("ap_synced_ssid")
                    if synced_ssid:
                        content = content.replace('title="H6701Q_99A2" \'="">H6701Q_99A2',
                                                  f'title="{synced_ssid}" \'="">{synced_ssid}')
                        content = content.replace('H6701Q_99A2', synced_ssid)
                    lan_ip = st.get("ont_lan_ip")
                    ap_ip = st.get("ap_lan_ip") or lan_ip
                    if lan_ip:
                        content = content.replace('192.168.5.1', ap_ip or lan_ip)
                        content = content.replace('192.168.1.1', lan_ip)
                    client_ip = st.get("client_ip")
                    if client_ip:
                        content = content.replace('192.168.5.179', client_ip)
                    sec_val = st.get("ap_synced_security") or st.get("ont_wifi_security")
                    if sec_val:
                        content = content.replace('WPA2/WPA3-PSK', sec_val)
                return self._gui_html(content)
            except Exception:
                pass

        return super().do_GET()

    def do_POST(self):
        path = self.path.split('?')[0].split('#')[0]
        sid = self._client_id()
        if path in ("/api/reset", "/resetsession"):
            return self._gui_reset()
        length = int(self.headers.get("Content-Length", "0") or 0)
        raw = self.rfile.read(length).decode("utf-8", "replace") if length > 0 else ""
        try:
            import mesh_zte_engine
            from urllib.parse import parse_qs
            data = {}
            if raw.lstrip().startswith("{"):
                data = json.loads(raw) or {}
            elif raw:
                q = parse_qs(raw, keep_blank_values=True)
                data = {k: v[0] for k, v in q.items() if v}
            if data:
                mesh_zte_engine.sync_topology_nodes(
                    slaves=data.get("slaves") if isinstance(data.get("slaves"), list) else None,
                    clients=data.get("clients") if isinstance(data.get("clients"), list) else None,
                    ssid=data.get("ssid") or data.get("ESSID"),
                    key=data.get("key") or data.get("KeyPassphrase"),
                    security=data.get("security"),
                    channel=data.get("channel"),
                    bandwidth=data.get("bandwidth"),
                    lan_config=data,
                    session_id=sid,
                )
            st = mesh_zte_engine.get_state(session_id=sid)
            return self._gui_json({"status": "ok", "state": st})
        except Exception as e:
            return self._gui_json({"status": "error", "error": str(e)}, 500)
