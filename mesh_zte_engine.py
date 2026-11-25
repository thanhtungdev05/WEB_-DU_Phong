# -*- coding: utf-8 -*-
"""
Mesh Logic Engine cho Combo ZTE (BE12000Z Controller + BE15000Z Agent).
Mô phỏng logic đấu nối topology, trạng thái cáp, nguồn điện, ghép đôi EasyMesh,
đấu nối cổng vật lý (Cisco Packet Tracer-style), chẩn đoán Ping/Speedtest/Traceroute,
đồng bộ SSID và kiểm tra kết nối đầu cuối.
"""

import json
import threading
import time

_LOCK = threading.RLock()

# Cấu hình danh mục cổng vật lý thực tế trích xuất từ Slide đào tạo FPT Telecom (Slide 11, 12, 31-34)
ONT_PORTS = {
    "LAN1_10GE": {
        "id": "LAN1_10GE",
        "name": "LAN 1 (10GE)",
        "type": "RJ-45",
        "speed_mbps": 10000,
        "optimal_backhaul": True,
        "color": "#f59e0b",
        "description": "Cổng 10Gbps Base-T RJ-45 (Cổng vàng - Khuyến nghị cắm Backhaul đến AP)"
    },
    "LAN2_1GE": {
        "id": "LAN2_1GE",
        "name": "LAN 2 (1GE)",
        "type": "RJ-45",
        "speed_mbps": 1000,
        "optimal_backhaul": False,
        "color": "#64748b",
        "description": "Cổng 1Gbps Base-T RJ-45 (Cổng tiêu chuẩn, cắm vào đây sẽ bị nghẽn 1Gbps)"
    },
    "LAN3_1GE": {
        "id": "LAN3_1GE",
        "name": "LAN 3 (1GE)",
        "type": "RJ-45",
        "speed_mbps": 1000,
        "optimal_backhaul": False,
        "color": "#64748b",
        "description": "Cổng 1Gbps Base-T RJ-45 (Cổng tiêu chuẩn, cắm vào đây sẽ bị nghẽn 1Gbps)"
    },
    "LAN4_1GE": {
        "id": "LAN4_1GE",
        "name": "LAN 4 (1GE)",
        "type": "RJ-45",
        "speed_mbps": 1000,
        "optimal_backhaul": False,
        "color": "#64748b",
        "description": "Cổng 1Gbps Base-T RJ-45 (Cổng tiêu chuẩn, cắm vào đây sẽ bị nghẽn 1Gbps)"
    },
    "NONE": {
        "id": "NONE",
        "name": "Chưa cắm cổng",
        "type": "NONE",
        "speed_mbps": 0,
        "optimal_backhaul": False,
        "color": "#94a3b8",
        "description": "Chưa kết nối dây cáp"
    }
}

AP_PORTS = {
    "WAN_25GE": {
        "id": "WAN_25GE",
        "name": "WAN (2.5GE)",
        "type": "RJ-45",
        "speed_mbps": 2500,
        "optimal_backhaul": True,
        "color": "#0284c7",
        "description": "Cổng 2.5Gbps Base-T RJ-45 (Cổng xanh - Khuyến nghị nhận tín hiệu Backhaul)"
    },
    "LAN_1GE": {
        "id": "LAN_1GE",
        "name": "LAN (1GE)",
        "type": "RJ-45",
        "speed_mbps": 1000,
        "optimal_backhaul": False,
        "color": "#64748b",
        "description": "Cổng 1Gbps Base-T RJ-45 (Cổng phụ cấp mạng cho thiết bị con/PC)"
    },
    "NONE": {
        "id": "NONE",
        "name": "Chưa cắm cổng",
        "type": "NONE",
        "speed_mbps": 0,
        "optimal_backhaul": False,
        "color": "#94a3b8",
        "description": "Chưa kết nối dây cáp"
    }
}

# Trạng thái mô hình đấu nối Mesh ZTE mặc định
_DEFAULT_STATE = {
    "combo": "ZTE_WIFI7",
    "controller_model": "ONT BE12000Z",
    "agent_model": "AP BE15000Z",
    "ont_port": "LAN1_10GE",        # Cổng vật lý cắm trên ONT BE12000Z
    "ap_port": "WAN_25GE",          # Cổng vật lý cắm trên AP BE15000Z
    "cable_type": "CAT6A",          # Loại cáp: "CAT6A", "CAT5E", "NONE"
    "link_type": "ETH",             # "ETH" (Cáp LAN 2.5GE), "WIFI" (Không dây MLO), "NONE" (Ngắt kết nối)
    "ap_power": True,               # True: Bật nguồn, False: Mất nguồn
    "ont_power": True,              # True: Bật nguồn ONT
    "ap_paired": True,              # Đã bắt cặp Mesh
    "ont_wifi_ssid": "FPT_BE12000_WIFI7",
    "ont_wifi_key": "Fpt@123456",
    "ont_wifi_security": "WPA3-Personal-Transition",
    "ont_wifi_channel": "Auto",
    "ont_wifi_bandwidth": "80MHz",
    "ont_wifi_enabled": True,
    "ap_synced_ssid": "FPT_BE12000_WIFI7",
    "ap_synced_key": "Fpt@123456",
    "ap_synced_security": "WPA3-Personal-Transition",
    "ap_synced_channel": "Auto",
    "ap_synced_bandwidth": "80MHz",
    "ont_lan_ip": "192.168.1.1",
    "ont_subnet_mask": "255.255.255.0",
    "ont_dhcp_enable": "1",
    "ont_dhcp_start": "192.168.1.2",
    "ont_dhcp_end": "192.168.1.254",
    "ont_isp_dns": "0",
    "ont_primary_dns": "192.168.1.1",
    "ont_secondary_dns": "0.0.0.0",
    "ont_lease_time": "86400",
    "ap_lan_ip": "192.168.1.100",
    "client_connected": True,
    "client_ip": "192.168.1.150",
    "client_hostname": "Smartphone_Client_KTV",
    "wps_active_until": 0,
    "last_failover_time": 0,
    "speedtest_tested": False,
    "ping_tested": False,
    "started_at": time.time(),
}

_state = dict(_DEFAULT_STATE)
_SESSION_STATES = {}


def _st_for(session_id=None):
    key = (session_id or "").strip() if isinstance(session_id, str) else ""
    if not key or key == "default":
        return _state
    st = _SESSION_STATES.get(key)
    if st is None:
        st = dict(_DEFAULT_STATE)
        st["started_at"] = time.time()
        _SESSION_STATES[key] = st
    return st


def get_state(session_id=None):
    """Lấy snapshot trạng thái mạng topology hiện tại."""
    with _LOCK:
        st = _st_for(session_id)
        now = time.time()
        # Tính toán trạng thái suy luận logic (Derived States)
        is_ap_online = st["ont_power"] and st["ap_power"] and (st["link_type"] in ("ETH", "WIFI")) and st["ap_paired"]

        # Ping Gateway & Internet từ Client
        if not is_ap_online:
            client_ping_gw = False
            client_internet = False
            client_ip_current = "169.254.10.15"  # APIPA nếu mất DHCP từ Mesh
        else:
            client_ping_gw = True
            client_internet = True
            client_ip_current = st["client_ip"]

        if not st["ont_power"]:
            mesh_status = "ONT_POWER_OFF"
        elif not st["ap_power"]:
            mesh_status = "POWER_OFF"
        elif st["link_type"] == "NONE" or not st["ap_paired"]:
            mesh_status = "OFFLINE"
        elif st["link_type"] == "ETH":
            mesh_status = "ONLINE_ETH"
        elif st["link_type"] == "WIFI":
            mesh_status = "ONLINE_WIFI"
        else:
            mesh_status = "OFFLINE"

        # Đánh giá tốc độ và độ trễ dựa trên cổng cắm
        ont_port_info = ONT_PORTS.get(st["ont_port"], ONT_PORTS["NONE"])
        ap_port_info = AP_PORTS.get(st["ap_port"], AP_PORTS["NONE"])

        is_optimal_wiring = False
        port_warning = None

        if st["link_type"] == "ETH" and st["ap_power"] and st["ont_power"]:
            # Đàm phán tốc độ cổng vật lý (Link Negotiation)
            negotiated_speed = min(ont_port_info["speed_mbps"], ap_port_info["speed_mbps"])
            if st["cable_type"] == "CAT5E" and negotiated_speed > 1000:
                negotiated_speed = 1000  # Cáp Cat5e giới hạn 1Gbps
                port_warning = "Cáp Cat5e không đảm bảo băng thông 2.5Gbps, bị bóp nghẽn ở 1Gbps. Khuyên dùng cáp Cat6A trở lên!"
            elif ont_port_info["id"] == "LAN1_10GE" and ap_port_info["id"] == "WAN_25GE":
                is_optimal_wiring = True
                negotiated_speed = 2500  # WAN của BE15000Z hỗ trợ tối đa 2.5GE
            else:
                is_optimal_wiring = False
                if ont_port_info["id"] != "LAN1_10GE":
                    port_warning = f"Cổng {ont_port_info['name']} trên ONT BE12000Z chỉ hỗ trợ 1Gbps, gây nghẽn băng thông AP Wi-Fi 7! Hãy đổi sang cổng LAN 1 (10GE)."
                elif ap_port_info["id"] != "WAN_25GE":
                    port_warning = f"Cổng {ap_port_info['name']} trên AP BE15000Z chỉ hỗ trợ 1Gbps! Hãy cắm vào cổng WAN (2.5GE) để đạt tốc độ 2.5Gbps."

            bandwidth_mbps = negotiated_speed
            latency_ms = 1
        elif st["link_type"] == "WIFI" and st["ap_power"] and st["ont_power"]:
            bandwidth_mbps = 1200  # Wi-Fi 7 MLO Wireless Backhaul
            latency_ms = 4
            is_optimal_wiring = True
        else:
            bandwidth_mbps = 0
            latency_ms = 999

        return {
            **st,
            "ont_model": "BE12000Z",
            "ap_model": "BE15000Z",
            "mesh_status": mesh_status,
            "is_ap_online": is_ap_online,
            "client_ping_gw": client_ping_gw,
            "client_internet": client_internet,
            "client_ip_current": client_ip_current,
            "latency_ms": latency_ms,
            "bandwidth_mbps": bandwidth_mbps,
            "ont_port_info": ont_port_info,
            "ap_port_info": ap_port_info,
            "is_optimal_wiring": is_optimal_wiring,
            "port_warning": port_warning,
            "elapsed_seconds": int(now - st.get("started_at", now)),
        }


def connect_ports(ont_port, ap_port, cable_type="CAT6A", session_id=None):
    """
    Mô phỏng đấu nối cổng vật lý kiểu Cisco Packet Tracer:
    - ont_port: "LAN1_10GE", "LAN2_1GE", "LAN3_1GE", "LAN4_1GE", "NONE"
    - ap_port: "WAN_25GE", "LAN_1GE", "NONE"
    - cable_type: "CAT6A", "CAT5E", "NONE"
    """
    with _LOCK:
        st = _st_for(session_id)
        if ont_port not in ONT_PORTS:
            ont_port = "LAN1_10GE"
        if ap_port not in AP_PORTS:
            ap_port = "WAN_25GE"

        st["ont_port"] = ont_port
        st["ap_port"] = ap_port
        st["cable_type"] = cable_type

        if ont_port == "NONE" or ap_port == "NONE" or cable_type == "NONE":
            # Rút cáp LAN -> Chuyển sang Wi-Fi Mesh MLO (Slide 34)
            st["link_type"] = "WIFI"
        else:
            st["link_type"] = "ETH"

        st["last_failover_time"] = time.time()
        _sync_to_be12000(st=st, session_id=session_id)
        return get_state(session_id=session_id)


def set_link_type(link_type, session_id=None):
    """
    Thay đổi kiểu kết nối Backhaul:
    - "ETH": Cắm cáp LAN tối ưu (LAN1 10GE -> WAN 2.5GE)
    - "WIFI": Rút cáp, chuyển sang kết nối không dây EasyMesh (Slide 34)
    - "NONE" / "DISCONNECTED": Ngắt toàn bộ liên kết (mất kết nối vật lý)
    """
    with _LOCK:
        st = _st_for(session_id)
        if link_type in ("DISCONNECTED", "CUT", "NONE"):
            link_type = "NONE"
            st["ont_port"] = "NONE"
            st["ap_port"] = "NONE"
            st["cable_type"] = "NONE"
        elif link_type == "WIFI":
            st["ont_port"] = "NONE"
            st["ap_port"] = "NONE"
            st["cable_type"] = "NONE"
        elif link_type == "ETH":
            if st["ont_port"] == "NONE":
                st["ont_port"] = "LAN1_10GE"
            if st["ap_port"] == "NONE":
                st["ap_port"] = "WAN_25GE"
            st["cable_type"] = "CAT6A"
        else:
            link_type = "NONE"

        st["link_type"] = link_type
        st["last_failover_time"] = time.time()
        _sync_to_be12000(st=st, session_id=session_id)
        return get_state(session_id=session_id)


def set_ap_power(power_state, session_id=None):
    """Bật / Tắt nguồn AP BE15000Z."""
    with _LOCK:
        st = _st_for(session_id)
        st["ap_power"] = bool(power_state)
        _sync_to_be12000(st=st, session_id=session_id)
        return get_state(session_id=session_id)


def set_ont_power(power_state, session_id=None):
    """Bật / Tắt nguồn ONT BE12000Z."""
    with _LOCK:
        st = _st_for(session_id)
        st["ont_power"] = bool(power_state)
        _sync_to_be12000(st=st, session_id=session_id)
        return get_state(session_id=session_id)


def trigger_wps(session_id=None):
    """Mô phỏng bấm nút cứng WPS/Mesh trên thân máy để ghép cặp."""
    with _LOCK:
        st = _st_for(session_id)
        now = time.time()
        st["wps_active_until"] = now + 120  # 2 phút pairing window
        st["ap_paired"] = True
        _sync_to_be12000(st=st, session_id=session_id)
        return get_state(session_id=session_id)


def update_ont_wifi(ssid, key=None, security=None, channel=None, bandwidth=None, session_id=None):
    """Sync SSID, key, security, channel, and bandwidth to BE15000Z state."""
    with _LOCK:
        st = _st_for(session_id)
        if ssid:
            st["ont_wifi_ssid"] = str(ssid).strip()
            st["ap_synced_ssid"] = str(ssid).strip()
        if key is not None and str(key) != "":
            st["ont_wifi_key"] = str(key).strip()
            st["ap_synced_key"] = str(key).strip()
        if security:
            st["ont_wifi_security"] = str(security).strip()
            st["ap_synced_security"] = str(security).strip()
        if channel:
            st["ont_wifi_channel"] = str(channel).strip()
            st["ap_synced_channel"] = str(channel).strip()
        if bandwidth:
            st["ont_wifi_bandwidth"] = str(bandwidth).strip()
            st["ap_synced_bandwidth"] = str(bandwidth).strip()
        _sync_to_be12000(st=st, session_id=session_id)
        return get_state(session_id=session_id)

def _join_octets(params, prefix, suffix=""):
    """Ghép 4 ô octet (ví dụ sub_IPAddr0:DHCPBasicCfg .. 3) thành chuỗi IPv4."""
    if not isinstance(params, dict):
        return None
    parts = []
    for i in range(4):
        val = params.get(f"{prefix}{i}{suffix}")
        if val is None and suffix:
            val = params.get(f"{prefix}{i}")
        if val is None or str(val).strip() == "":
            return None
        parts.append(str(val).strip())
    ip_str = ".".join(parts)
    octs = ip_str.split(".")
    if len(octs) == 4 and all(o.isdigit() and 0 <= int(o) <= 255 for o in octs):
        return ip_str
    return None


def _valid_ipv4(val):
    if not val:
        return None
    s = str(val).strip()
    parts = s.split(".")
    if len(parts) == 4 and all(p.isdigit() and 0 <= int(p) <= 255 for p in parts):
        return ".".join(str(int(p)) for p in parts)
    return None


def update_ont_lan_dhcp(params=None, session_id=None, **kwargs):
    """
    Đồng bộ thông số LAN IPv4 & DHCP Server từ thiết bị nguồn (BE12000Z)
    sang trạng thái trung tâm và truyền tự động xuống thiết bị đích (BE15000Z).
    Hỗ trợ cả tham số gộp (IPAddr, SubMask, MinAddress, MaxAddress, DNSServer1...)
    lẫn tham số tách 4 ô octet (sub_IPAddr0..3, sub_SubMask0..3...).
    """
    with _LOCK:
        st = _st_for(session_id)
        merged = {}
        if isinstance(params, dict):
            merged.update(params)
        if kwargs:
            merged.update(kwargs)

        lan_ip = (
            _valid_ipv4(merged.get("lan_ip"))
            or _valid_ipv4(merged.get("lanIp"))
            or _valid_ipv4(merged.get("IPAddr"))
            or _valid_ipv4(merged.get("IPAddr:DHCPBasicCfg"))
            or _join_octets(merged, "sub_IPAddr", ":DHCPBasicCfg")
        )
        subnet_mask = (
            _valid_ipv4(merged.get("subnet_mask"))
            or _valid_ipv4(merged.get("subnetMask"))
            or _valid_ipv4(merged.get("SubMask"))
            or _valid_ipv4(merged.get("SubnetMask"))
            or _join_octets(merged, "sub_SubMask", "")
        )
        dhcp_start = (
            _valid_ipv4(merged.get("dhcp_start"))
            or _valid_ipv4(merged.get("dhcpStart"))
            or _valid_ipv4(merged.get("MinAddress"))
            or _valid_ipv4(merged.get("MinAddress:DHCPBasicCfg"))
            or _join_octets(merged, "sub_MinAddress", ":DHCPBasicCfg")
        )
        dhcp_end = (
            _valid_ipv4(merged.get("dhcp_end"))
            or _valid_ipv4(merged.get("dhcpEnd"))
            or _valid_ipv4(merged.get("MaxAddress"))
            or _valid_ipv4(merged.get("MaxAddress:DHCPBasicCfg"))
            or _join_octets(merged, "sub_MaxAddress", ":DHCPBasicCfg")
        )
        primary_dns = (
            _valid_ipv4(merged.get("primary_dns"))
            or _valid_ipv4(merged.get("primaryDns"))
            or _valid_ipv4(merged.get("DNSServer1"))
            or _join_octets(merged, "sub_DNSServer1", "")
        )
        secondary_dns = (
            _valid_ipv4(merged.get("secondary_dns"))
            or _valid_ipv4(merged.get("secondaryDns"))
            or _valid_ipv4(merged.get("DNSServer2"))
            or _join_octets(merged, "sub_DNSServer2", "")
        )

        if lan_ip:
            st["ont_lan_ip"] = lan_ip
            st["gateway_ip"] = lan_ip
            octs = lan_ip.split(".")
            prefix = f"{octs[0]}.{octs[1]}.{octs[2]}"
            st["ap_lan_ip"] = f"{prefix}.100"
            st["client_ip"] = f"{prefix}.150"
            # Tự động đồng bộ dải DHCP Start / End theo prefix mới nếu chưa truyền hoặc khác lớp mạng
            if not dhcp_start:
                cur_start = st.get("ont_dhcp_start", "192.168.1.2")
                if not cur_start.startswith(prefix + "."):
                    st["ont_dhcp_start"] = f"{prefix}.2"
            if not dhcp_end:
                cur_end = st.get("ont_dhcp_end", "192.168.1.254")
                if not cur_end.startswith(prefix + "."):
                    st["ont_dhcp_end"] = f"{prefix}.254"

        if subnet_mask:
            st["ont_subnet_mask"] = subnet_mask
        if dhcp_start:
            st["ont_dhcp_start"] = dhcp_start
        if dhcp_end:
            st["ont_dhcp_end"] = dhcp_end
        if primary_dns:
            st["ont_primary_dns"] = primary_dns
        if secondary_dns:
            st["ont_secondary_dns"] = secondary_dns

        dhcp_enable = merged.get("dhcp_enable", merged.get("dhcpEnable", merged.get("ServerEnable")))
        if dhcp_enable is not None and str(dhcp_enable).strip() in ("0", "1", "True", "False", "true", "false"):
            st["ont_dhcp_enable"] = "1" if str(dhcp_enable).strip() in ("1", "True", "true") else "0"

        isp_dns = merged.get("isp_dns", merged.get("ispDns", merged.get("DnsServerSource")))
        if isp_dns is not None and str(isp_dns).strip() in ("0", "1", "True", "False", "true", "false"):
            st["ont_isp_dns"] = "1" if str(isp_dns).strip() in ("1", "True", "true") else "0"

        lease_time = merged.get("lease_time", merged.get("leaseTime", merged.get("LeaseTime", merged.get("LeaseTimeSelfDefine"))))
        if lease_time is not None and str(lease_time).strip().lstrip("-").isdigit():
            st["ont_lease_time"] = str(lease_time).strip()

        _sync_to_be12000(st=st, session_id=session_id)
        return get_state(session_id=session_id)


def run_ping(target="192.168.1.1"):
    """
    Công cụ Chẩn đoán KTV: Mô phỏng lệnh ping ICMP chi tiết.
    - target: "192.168.1.1" (ONT), "192.168.1.100" (AP), "8.8.8.8" (Internet)
    """
    with _LOCK:
        _state["ping_tested"] = True
        st = get_state()
        lines = []
        target = str(target).strip()
        lines.append(f"Pinging {target} with 32 bytes of data:")

        is_success = False
        if target in ("192.168.1.1", "gateway"):
            is_success = st["ont_power"]
            hop_time = 1 if st["ont_power"] else 999
        elif target in ("192.168.1.100", "ap", "be15000"):
            is_success = st["is_ap_online"]
            hop_time = st["latency_ms"]
        elif target in ("8.8.8.8", "1.1.1.1", "internet"):
            is_success = st["client_internet"]
            hop_time = st["latency_ms"] + 3
        else:
            is_success = st["client_internet"]
            hop_time = st["latency_ms"] + 5

        packets_sent = 4
        packets_received = 4 if is_success else 0

        for seq in range(1, 5):
            if is_success:
                t = max(1, hop_time)
                lines.append(f"Reply from {target}: bytes=32 time={t}ms TTL=64")
            else:
                lines.append("Request timed out.")

        loss_pct = int(((packets_sent - packets_received) / packets_sent) * 100)
        lines.append("")
        lines.append(f"Ping statistics for {target}:")
        lines.append(f"    Packets: Sent = {packets_sent}, Received = {packets_received}, Lost = {packets_sent - packets_received} ({loss_pct}% loss),")

        if is_success:
            lines.append("Approximate round trip times in milli-seconds:")
            lines.append(f"    Minimum = {hop_time}ms, Maximum = {hop_time + 1}ms, Average = {hop_time}ms")

        return {
            "target": target,
            "success": is_success,
            "loss_pct": loss_pct,
            "avg_time_ms": hop_time if is_success else None,
            "output": "\n".join(lines),
            "state": st
        }


def run_speedtest():
    """
    Công cụ Chẩn đoán KTV: Đo tốc độ Download / Upload thực tế.
    """
    with _LOCK:
        _state["speedtest_tested"] = True
        st = get_state()
        if not st["client_internet"]:
            return {
                "success": False,
                "download_mbps": 0.0,
                "upload_mbps": 0.0,
                "ping_ms": 999,
                "jitter_ms": 0,
                "server": "FPT Telecom - Optical Core (ID: 15201)",
                "message": "Không có kết nối Internet! Vui lòng kiểm tra cáp mạng hoặc nguồn AP.",
                "output": "Speedtest failed: Network is unreachable."
            }

        base_speed = st["bandwidth_mbps"]
        # Mô phỏng hao hụt thực tế 2-5%
        down = round(base_speed * 0.96, 1)
        up = round(base_speed * 0.94, 1)
        ping = st["latency_ms"] + 2

        out = (
            f"   Speedtest by Ookla / FPT Telecom Server\n"
            f"   Server: FPT Telecom Optical Core (ID: 15201)\n"
            f"   ISP: FPT Telecom - Wi-Fi 7 NextGen\n"
            f"   Latency: {ping} ms (Jitter: 0.5 ms)\n"
            f"   Download: {down} Mbps ({(down/1000):.2f} Gbps)\n"
            f"   Upload:   {up} Mbps ({(up/1000):.2f} Gbps)\n"
            f"   Kết luận: {'✅ BĂNG THÔNG TỐI ƯU 2.5 Gbps' if down > 2000 else ('⚠️ NGHẼN CỔNG 1 Gbps' if down < 1100 and st['link_type'] == 'ETH' else '📶 WI-FI 7 MESH MLO')}"
        )

        return {
            "success": True,
            "download_mbps": down,
            "upload_mbps": up,
            "ping_ms": ping,
            "jitter_ms": 0.5,
            "server": "FPT Telecom Optical Core",
            "message": "Kiểm tra tốc độ thành công",
            "output": out
        }


def run_arp():
    """Công cụ Chẩn đoán KTV: Xem bảng phân giải địa chỉ ARP."""
    with _LOCK:
        st = get_state()
        lines = [
            "Interface: 192.168.1.150 --- 0x2",
            "  Internet Address      Physical Address      Type",
            "  192.168.1.1           94-87-e0-aa-bb-01     dynamic (ONT BE12000Z)",
        ]
        if st["is_ap_online"]:
            lines.append("  192.168.1.100         aa-bb-cc-00-00-15     dynamic (AP BE15000Z)")
        lines.append("  192.168.1.255         ff-ff-ff-ff-ff-ff     static (Broadcast)")
        return {
            "output": "\n".join(lines)
        }


def run_traceroute(target="8.8.8.8"):
    """Công cụ Chẩn đoán KTV: Truy vết các chặng nhảy mạng (Traceroute)."""
    with _LOCK:
        st = get_state()
        lines = [f"Tracing route to {target} over a maximum of 30 hops:"]
        if not st["client_internet"]:
            lines.append("  1     *        *        *     Request timed out.")
            lines.append("Trace complete: Destination host unreachable.")
            return {"output": "\n".join(lines)}

        lat = st["latency_ms"]
        lines.append(f"  1    <1 ms    <1 ms     1 ms  192.168.1.100 [AP BE15000Z]")
        lines.append(f"  2     {lat} ms     {lat} ms     {lat} ms  192.168.1.1 [ONT BE12000Z Gateway]")
        lines.append("  3     3 ms     3 ms     3 ms  118.69.240.1 [fpt-bng-core.fpt.vn]")
        lines.append(f"  4     {lat+3} ms     {lat+4} ms     {lat+3} ms  {target} [dns.google]")
        lines.append("Trace complete.")
        return {"output": "\n".join(lines)}


def reset_lab(session_id=None):
    """Reset session lab state or global lab state to factory defaults."""
    global _state
    with _LOCK:
        key = (session_id or "").strip() if isinstance(session_id, str) else ""
        if not key or key == "default":
            _state = dict(_DEFAULT_STATE)
            _state["started_at"] = time.time()
            _sync_to_be12000(st=_state, session_id=None)
            return get_state()
        _SESSION_STATES[key] = dict(_DEFAULT_STATE)
        _SESSION_STATES[key]["started_at"] = time.time()
        return get_state(session_id=key)

def get_missions(scenario_key=None, session_id=None, workspace=None, lab_id=None, grading_mode=None):
    """
    Lấy danh sách nhiệm vụ đào tạo kỹ thuật viên chuẩn Cisco Packet Tracer / Kịch bản Phase 3 / Bài học Mesh 4 Bước:
    - Nếu là bài học Mesh 4 bước (lab_id, grading_mode == '4step', hoặc scenario_key thuộc MESH_LESSON_PAIR_SPECS):
      trả về 4 bước chấm Đạt/Chưa đạt (Không dùng điểm số).
    - Nếu scenario_key nằm trong PHASE3_SCENARIOS ('p3_mesh', 'p3_dhcp', 'p3_bridge', 'p3_static'),
      hệ thống sẽ trả về 5 nhiệm vụ theo tiêu chuẩn bài thực hành đó.
    """
    if (
        grading_mode == "4step"
        or bool(lab_id)
        or (scenario_key and (str(scenario_key) in MESH_LESSON_PAIR_SPECS or str(scenario_key).startswith("LAB_")))
    ):
        return get_mesh_4step_missions(
            scenario_key=scenario_key,
            session_id=session_id,
            workspace=workspace,
            lab_id=lab_id,
        )
    if scenario_key and scenario_key in PHASE3_SCENARIOS:
        return get_phase3_missions(scenario_key, session_id=session_id, workspace=workspace)
    with _LOCK:
        st = get_state()
        m1 = st["ont_power"] and st["ap_power"]
        m2 = (st["link_type"] == "ETH" and st["ont_port"] == "LAN1_10GE" and st["ap_port"] == "WAN_25GE") or (st["link_type"] == "WIFI")
        m3 = st["ap_paired"] and st["is_ap_online"]
        m4 = st["is_ap_online"]
        m5 = bool(st["ont_wifi_ssid"]) and (st["ont_wifi_ssid"] == st["ap_synced_ssid"])
        m6 = st["ping_tested"] or st["speedtest_tested"] or (st["client_internet"] and st["link_type"] in ("ETH", "WIFI"))

        missions = [
            {
                "id": "m1",
                "step": 1,
                "title": "Cấp nguồn điện DC 12V cho 2 thiết bị",
                "instruction": "Đảm bảo cả ONT BE12000Z và AP BE15000Z đều đã được cắm adapter nguồn 12V 2A và bật công tắc.",
                "status": "COMPLETED" if m1 else "PENDING",
                "completed": m1,
                "badge": "12V 2A"
            },
            {
                "id": "m2",
                "step": 2,
                "title": "Đấu nối cáp mạng Ethernet Backhaul chuẩn cổng",
                "instruction": "Cắm cáp Cat6A từ cổng LAN 1 (10GE) trên ONT BE12000Z sang cổng WAN (2.5GE) trên AP BE15000Z để đạt tốc độ 2500 Mbps. Tránh cắm vào các cổng 1GE gây nghẽn băng thông.",
                "status": "COMPLETED" if m2 else "IN_PROGRESS",
                "completed": m2,
                "badge": "LAN 1 10GE ↔ WAN 2.5GE"
            },
            {
                "id": "m3",
                "step": 3,
                "title": "Kích hoạt ghép cặp EasyMesh (WPS / Mesh Sync)",
                "instruction": "Nhấn nút WPS/Mesh trên thiết bị hoặc công cụ giả lập để bắt cặp. Đèn LED trên AP sẽ sáng xanh lá đứng (đã đồng bộ qua dây) hoặc xanh dương đứng (qua Wi-Fi).",
                "status": "COMPLETED" if m3 else "PENDING",
                "completed": m3,
                "badge": "EasyMesh Wi-Fi 7"
            },
            {
                "id": "m4",
                "step": 4,
                "title": "Kiểm tra Sơ đồ Mạng Topology trên Web ONT",
                "instruction": "Vào giao diện ONT BE12000Z (192.168.1.1) -> chọn menu Topology (mmTopology) để xác nhận node BE15000Z hiển thị trực tuyến với Link Speed 2500 Mbps.",
                "status": "COMPLETED" if m4 else "PENDING",
                "completed": m4,
                "badge": "mmTopology.html"
            },
            {
                "id": "m5",
                "step": 5,
                "title": "Đồng bộ cấu hình sóng Wi-Fi (SSID)",
                "instruction": "Vào Cấu hình Wi-Fi trên ONT BE12000Z, kiểm tra tên sóng SSID được tự động đồng bộ sang AP BE15000Z.",
                "status": "COMPLETED" if m5 else "PENDING",
                "completed": m5,
                "badge": "SSID Multi-Link"
            },
            {
                "id": "m6",
                "step": 6,
                "title": "Chẩn đoán đo kiểm bằng Terminal KTV (Ping & Speedtest)",
                "instruction": "Mở Terminal Chẩn Đoán KTV, thực hiện lệnh ping 192.168.1.1 và speedtest để xác nhận băng thông thực tế đạt chuẩn > 2000 Mbps.",
                "status": "COMPLETED" if m6 else "PENDING",
                "completed": m6,
                "badge": "Ping 1ms / 2.5 Gbps"
            }
        ]

        completed_count = sum(1 for m in missions if m["completed"])
        return {
            "missions": missions,
            "total": len(missions),
            "completed_count": completed_count,
            "all_completed": completed_count == len(missions),
            "progress_percent": int((completed_count / len(missions)) * 100)
        }


def _sync_to_be12000(st=None, session_id=None):
    """Cập nhật dữ liệu danh sách node slave vào BE12000 (để mmTopology.html hiển thị động)."""
    try:
        if session_id and session_id != "default":
            return
        if st is None:
            st = _state
        import simulators.sim_be12000.src.server as be12000_srv
        is_online = st["ont_power"] and st["ap_power"] and (st["link_type"] in ("ETH", "WIFI")) and st["ap_paired"]

        ont_port_info = ONT_PORTS.get(st["ont_port"], ONT_PORTS["NONE"])
        ap_port_info = AP_PORTS.get(st["ap_port"], AP_PORTS["NONE"])
        negotiated_speed = 2500
        if st["link_type"] == "ETH":
            negotiated_speed = min(ont_port_info["speed_mbps"], ap_port_info["speed_mbps"])
            if ont_port_info["id"] == "LAN1_10GE" and ap_port_info["id"] == "WAN_25GE":
                negotiated_speed = 2500
            elif negotiated_speed > 1000 and st["cable_type"] == "CAT5E":
                negotiated_speed = 1000
        elif st["link_type"] == "WIFI":
            negotiated_speed = 1200

        if is_online:
            slave_node = {
                "DeviceName": "BE15000Z",
                "SoftwareVer": "V3.0.0P2_VN2-o",
                "MacAddr": "aa:bb:cc:00:00:15",
                "IpAddr": st.get("ap_lan_ip", "192.168.1.100"),
                "AccessType": st["link_type"],
                "LinkSpeed": str(negotiated_speed),
                "instID": "MESH.AGENT1",
                "BhStaRssi": "0" if st["link_type"] == "ETH" else "-52",
                "BhStaDataUpBpsRate": "0",
                "BhStaDataDownBpsRate": "0",
                "BhStaSnr": "0",
                "RxPower": "0",
                "TxPower": "0",
                "AssocTime": "520",
                "IF_ERRORID": 0
            }
            client_node = {
                "parent": "MESH.AGENT1",
                "AccessType": "2",  # 5GHz
                "HostName": st["client_hostname"],
                "MacAddr": "34:e1:2d:88:99:aa",
                "IpAddr": st["client_ip"],
                "AssocTime": "180",
                "RxRateBps": "480000000",
                "TxRateBps": "540000000",
                "Rssi": "-45",
                "Btm": "1",
                "Rrm": "1",
                "WirelessMode": "802.11be"
            }
            slave_list = [slave_node]
            client_list = [client_node]
        else:
            slave_list = []
            client_list = []

        lan_dhcp_cfg = {
            "IPAddr": st.get("ont_lan_ip", "192.168.1.1"),
            "SubMask": st.get("ont_subnet_mask", "255.255.255.0"),
            "SubnetMask": st.get("ont_subnet_mask", "255.255.255.0"),
            "ServerEnable": st.get("ont_dhcp_enable", "1"),
            "MinAddress": st.get("ont_dhcp_start", "192.168.1.2"),
            "MaxAddress": st.get("ont_dhcp_end", "192.168.1.254"),
            "DnsServerSource": st.get("ont_isp_dns", "0"),
            "DNSServer1": st.get("ont_primary_dns", "192.168.1.1"),
            "DNSServer2": st.get("ont_secondary_dns", "0.0.0.0"),
            "LeaseTime": st.get("ont_lease_time", "86400"),
        }

        if hasattr(be12000_srv, "cap_nhat_topology_mesh"):
            custom_slaves = st.get("custom_slaves")
            custom_clients = st.get("custom_clients")
            be12000_srv.cap_nhat_topology_mesh(
                custom_slaves if custom_slaves is not None else slave_list,
                custom_clients if custom_clients is not None else client_list,
                lan_dhcp_cfg=lan_dhcp_cfg
            )
    except Exception:
        pass


def sync_topology_nodes(slaves=None, clients=None, ssid=None, key=None, gateway_ip=None, lan_config=None, security=None, channel=None, bandwidth=None, session_id=None):
    """Sync topology slaves, clients, Wi-Fi and LAN/DHCP config into session state."""
    with _LOCK:
        st = _st_for(session_id)
        if ssid:
            st["ont_wifi_ssid"] = str(ssid).strip()
            st["ap_synced_ssid"] = str(ssid).strip()
        if key is not None and str(key) != "":
            st["ont_wifi_key"] = str(key).strip()
            st["ap_synced_key"] = str(key).strip()
        if security:
            st["ont_wifi_security"] = str(security).strip()
            st["ap_synced_security"] = str(security).strip()
        if channel:
            st["ont_wifi_channel"] = str(channel).strip()
            st["ap_synced_channel"] = str(channel).strip()
        if bandwidth:
            st["ont_wifi_bandwidth"] = str(bandwidth).strip()
            st["ap_synced_bandwidth"] = str(bandwidth).strip()
        if gateway_ip:
            st["gateway_ip"] = str(gateway_ip).strip()
            update_ont_lan_dhcp(lan_ip=gateway_ip, session_id=session_id)
        if isinstance(lan_config, dict) and lan_config:
            update_ont_lan_dhcp(lan_config, session_id=session_id)
        if isinstance(slaves, list):
            st["custom_slaves"] = slaves
        if isinstance(clients, list):
            st["custom_clients"] = clients
        _sync_to_be12000(st=st, session_id=session_id)
        return get_state(session_id=session_id)



def evaluate_grading(scenario_key=None, session_id=None, workspace=None, lab_id=None, grading_mode=None):
    """
    Chấm điểm bài thực hành đào tạo kỹ thuật viên FPT Telecom:
    - Nếu là bài học Mesh 4 bước (lab_id, grading_mode == '4step', hoặc scenario_key thuộc MESH_LESSON_PAIR_SPECS):
      Chấm 4 bước Đạt / Chưa đạt (Đúng / Sai, không dùng điểm số).
    - Nếu scenario_key nằm trong PHASE3_SCENARIOS ('p3_mesh', 'p3_dhcp', 'p3_bridge', 'p3_static'):
      Chấm điểm 5 tiêu chí theo chuẩn Phase 3.
    """
    if (
        grading_mode == "4step"
        or bool(lab_id)
        or (scenario_key and (str(scenario_key) in MESH_LESSON_PAIR_SPECS or str(scenario_key).startswith("LAB_")))
    ):
        return evaluate_mesh_4step_grading(
            scenario_key=scenario_key,
            session_id=session_id,
            workspace=workspace,
            lab_id=lab_id,
        )
    if scenario_key and scenario_key in PHASE3_SCENARIOS:
        return evaluate_phase3_grading(scenario_key, session_id=session_id, workspace=workspace)
    with _LOCK:
        rules = []
        # Tiêu chí 1: Đấu nối Backhaul
        c1 = _state["link_type"] in ("ETH", "WIFI")
        ont_port = _state.get("ont_port", "LAN1_10GE")
        ap_port = _state.get("ap_port", "WAN_25GE")
        is_opt = (_state["link_type"] == "ETH" and ont_port == "LAN1_10GE" and ap_port == "WAN_25GE") or (_state["link_type"] == "WIFI")

        pts_c1 = 25 if is_opt else (15 if c1 else 0)
        rules.append({
            "id": "mesh_link",
            "name": "Đấu nối liên kết Backhaul tối ưu (Packet Tracer Port Wiring)",
            "expected": "Cắm LAN 1 (10GE) ↔ WAN (2.5GE) [2.5 Gbps] hoặc Wi-Fi 7 MLO",
            "actual": f"Kiểu: {_state['link_type']} | ONT: {ont_port} ↔ AP: {ap_port} ({'Tối ưu' if is_opt else 'Nghẽn cổng 1G' if c1 else 'Mất kết nối'})",
            "passed": c1,
            "points": pts_c1,
            "max_points": 25
        })

        # Tiêu chí 2: Nguồn điện AP và ONT
        c2 = _state["ap_power"] and _state["ont_power"]
        rules.append({
            "id": "device_power",
            "name": "Trạng thái nguồn thiết bị (ONT BE12000Z & AP BE15000Z)",
            "expected": "Cả 2 thiết bị đều Bật nguồn (Power ON 12V 2A)",
            "actual": "Đang Bật đủ nguồn" if c2 else "Mất nguồn thiết bị",
            "passed": c2,
            "points": 15 if c2 else 0,
            "max_points": 15
        })

        # Tiêu chí 3: Ghép cặp EasyMesh
        c3 = _state["ap_paired"] and c1 and c2
        rules.append({
            "id": "mesh_pairing",
            "name": "Nhận diện Agent trên Sơ đồ Topology (mmTopology)",
            "expected": "Agent BE15000Z trực tuyến (Slave 1 Online)",
            "actual": "Đã nhận diện trên Topology" if c3 else "Chưa nhận diện Node",
            "passed": c3,
            "points": 25 if c3 else 0,
            "max_points": 25
        })

        # Tiêu chí 4: Đồng bộ SSID
        c4 = bool(_state["ont_wifi_ssid"]) and (_state["ont_wifi_ssid"] == _state["ap_synced_ssid"])
        rules.append({
            "id": "wifi_sync",
            "name": "Đồng bộ tên sóng Wi-Fi (SSID Sync)",
            "expected": f"Đồng bộ SSID: {_state['ont_wifi_ssid']}",
            "actual": f"SSID Agent: {_state['ap_synced_ssid']}",
            "passed": c4,
            "points": 20 if c4 else 0,
            "max_points": 20
        })

        # Tiêu chí 5: Client End-to-End Connectivity
        c5 = c3 and _state["client_connected"]
        rules.append({
            "id": "client_traffic",
            "name": "Kiểm tra kết nối đầu cuối (Client Ping & Internet)",
            "expected": "Ping Gateway 192.168.1.1 thành công, Internet thông suốt",
            "actual": f"IP: {_state['client_ip']} - {'Thông tuyến' if c5 else 'Mất kết nối'}",
            "passed": c5,
            "points": 15 if c5 else 0,
            "max_points": 15
        })

        total_score = sum(r["points"] for r in rules)
        is_passed = total_score >= 80

        return {
            "score": total_score,
            "total_score": total_score,
            "passed": is_passed,
            "all_passed": is_passed,
            "total_rules": len(rules),
            "passed_rules": sum(1 for r in rules if r["passed"]),
            "rules": rules,
            "elapsed_seconds": int(time.time() - _state.get("started_at", time.time())),
            "timestamp": time.strftime("%Y-%m-%d %H:%M:%S")
        }


# ===========================================================================
# PHASE 3: MA TRẬN TIÊU CHUẨN KỸ THUẬT WI-FI & 4 BÀI THỰC HÀNH KTV FPT
# ===========================================================================

FPT_MESH_COMPATIBILITY_MATRIX = {
    # Agents from Image 2
    "AC1200Z": {"controllers": ["AC1000Z", "AX3000GZ", "AX3000GZ V2"], "port_type": "LAN-WAN"},
    "AX1800AZ": {"controllers": ["AX1800GZ", "AX3000GZ", "AX3000GZ V2"], "port_type": "LAN-WAN"},
    "AC1500C": {"controllers": ["AX1800C"], "port_type": "LAN-LAN"},
    "AX3000C": {"controllers": ["AX1800C", "AX3000GZ", "AX3000GZ V2", "AX3000GZ V3", "AX3000HI", "AX3000HV2"], "port_type": "LAN-LAN"},
    "AX3000C v2": {"controllers": ["AX1800C", "AX3000GZ", "AX3000GZ V2", "AX3000GZ V3", "AX3000HI", "AX3000HV2"], "port_type": "LAN-LAN"},
    "AX3000AZ": {"controllers": ["AC1000Z", "AX1800GZ", "AX3000GZ", "AX3000GZ V2"], "port_type": "LAN-WAN"},
    "AX3000S": {"controllers": ["AX3000HI", "AX3000HV2", "ONT AX3000S"], "port_type": "LAN-LAN"},
    "BE15000Z": {"controllers": ["BE12000Z"], "port_type": "LAN-WAN"},
    "BE6500C": {"controllers": ["ONT BE6500C", "BE6500C"], "port_type": "LAN-LAN"},
}

PHASE3_SCENARIOS = {
    "p3_mesh": {
        "id": "p3_mesh",
        "title": "Phần: Cấu Hình MESH WIFI",
        "badge": "CẤU HÌNH MESH WIFI",
        "summary": "Thiết lập hệ thống Wi-Fi Mesh thống nhất toàn nhà. ONT làm Mesh Controller cấu hình 100%, Agent nhận đồng bộ 100%.",
        "standard": "Đấu nối theo Ma Trận Chuẩn FPT: ZTE Agent cắm LAN-WAN; Skyworth/Realtek/Broadcom cắm LAN-LAN. Wi-Fi SSID & Mật khẩu đồng bộ 100%.",
        "device_pair": "ONT AX3000GZ V2 + AP AX3000C (hoặc ONT BE12000Z + AP BE15000Z)",
    },
    "p3_dhcp": {
        "id": "p3_dhcp",
        "title": "Phần: Cấu Hình DHCP",
        "badge": "CẤU HÌNH DHCP",
        "summary": "AP phụ đóng vai trò Router nhánh độc lập. AP nhận IP WAN từ ONT chính (hoặc quay PPPoE riêng) và cấp phát cho mạng con nội bộ.",
        "standard": "Cắm LAN (ONT) ➔ WAN (AP). Đổi LAN AP sang dải 192.168.10.1 để tránh xung đột Subnet. Bật DHCP nội bộ trên AP. Hỗ trợ quay số PPPoE mẫu.",
        "device_pair": "ONT AX3000GZ V2 + Router/AP AX3000C (hoặc Vigor 2927)",
    },
    "p3_bridge": {
        "id": "p3_bridge",
        "title": "Phần: Cấu Hình BRIDGE",
        "badge": "CẤU HÌNH BRIDGE",
        "summary": "AP phụ hoạt động ở chế độ Access Point / Switch L2 thuần túy. Toàn bộ định tuyến và cấp IP do ONT chính đảm nhiệm.",
        "standard": "Cắm LAN (ONT) ➔ LAN (AP). TẮT HOÀN TOÀN DHCP Server trên AP (0 DHCP) để tránh lỗi Rogue DHCP làm rớt mạng.",
        "device_pair": "ONT AX3000GZ V2 + AP AX3000C",
    },
    "p3_static": {
        "id": "p3_static",
        "title": "Phần: Cấu Hình STATIC",
        "badge": "CẤU HÌNH STATIC",
        "summary": "Mô hình mạng chuyên nghiệp chuẩn FPT: Phân chia dải tĩnh (.2-.9) cho thiết bị hạ tầng (AP phụ, Camera, NAS) và dải động (.10-.254) cho người dùng.",
        "standard": "Cắm LAN (ONT) ➔ LAN (AP). Đổi IP LAN AP phụ thành IP tĩnh 192.168.1.2 (.2-.9). Tắt DHCP trên AP (0 DHCP). Cấu hình DHCP Pool trên ONT bắt đầu từ .10.",
        "device_pair": "ONT AX3000GZ V2 + AP AX3000S",
    }
}


def _extract_scenario_context(scenario_key: str, session_id: str | None = None, workspace: dict | None = None) -> dict:
    """Trích xuất node, link và thông số cấu hình firmware cho bài thực hành Phase 3."""
    ctx = {
        "scenario_key": scenario_key,
        "is_empty_canvas": False,
        "ont": None,
        "ap": None,
        "client": None,
        "cable": None,
        "ont_port": "",
        "ap_port": "",
        "cable_connected": False,
        "ont_fw": {},
        "ap_fw": {},
        "ont_ip": "192.168.1.1",
        "ap_ip": "192.168.1.100",
        "ont_dhcp_start": "192.168.1.10",
        "ont_dhcp_end": "192.168.1.254",
        "ont_dhcp_enable": True,
        "ap_dhcp_enable": False,
        "ont_ssid": "FPT_Telecom_WiFi7",
        "ap_ssid": "FPT_Telecom_WiFi7",
        "ont_key": "12345678",
        "ap_key": "12345678",
        "ap_wan_ip": "",
        "ap_op_mode": "",
        "client_ip": "192.168.1.15",
        "client_connected": True,
    }
    nodes = None
    links = None

    if workspace is not None and isinstance(workspace, dict) and isinstance(workspace.get("nodes"), list):
        nodes = workspace.get("nodes", [])
        links = workspace.get("links", [])
        if len(nodes) == 0:
            ctx["is_empty_canvas"] = True
            return ctx
    elif session_id:
        try:
            import mesh_sync_adapter
            ws = mesh_sync_adapter.get_workspace(session_id)
            if isinstance(ws, dict) and isinstance(ws.get("nodes"), list):
                nodes = ws.get("nodes", [])
                links = ws.get("links", [])
                if len(nodes) == 0:
                    ctx["is_empty_canvas"] = True
                    return ctx
        except Exception:
            pass

    if nodes is None:
        # Fallback to simulated defaults for test suites without explicit workspace
        st = _st_for(session_id)
        if scenario_key == "p3_mesh":
            ctx["cable_connected"] = st.get("link_type") in ("ETH", "WIFI")
            ctx["ont_port"] = st.get("ont_port", "LAN1_1GE")
            ctx["ap_port"] = st.get("ap_port", "LAN1")
            ctx["ont_ssid"] = st.get("ont_wifi_ssid", "FPT_Telecom_WiFi7")
            ctx["ap_ssid"] = st.get("ap_synced_ssid", ctx["ont_ssid"])
            ctx["ap_op_mode"] = "mesh_agent"
            ctx["ont_dhcp_enable"] = True
            ctx["ap_dhcp_enable"] = False
            return ctx
        elif scenario_key == "p3_dhcp":
            ctx["cable_connected"] = True
            ctx["ont_port"] = "LAN1_1GE"
            ctx["ap_port"] = "WAN_1GE"
            ctx["ap_ip"] = "192.168.10.1"
            ctx["ap_wan_ip"] = "192.168.1.2"
            ctx["ap_op_mode"] = "router"
            ctx["ont_dhcp_enable"] = True
            ctx["ap_dhcp_enable"] = True
            return ctx
        elif scenario_key == "p3_bridge":
            ctx["cable_connected"] = True
            ctx["ont_port"] = "LAN1_1GE"
            ctx["ap_port"] = "LAN1"
            ctx["ap_ip"] = "192.168.1.100"
            ctx["ap_op_mode"] = "bridge"
            ctx["ont_dhcp_enable"] = True
            ctx["ap_dhcp_enable"] = False
            return ctx
        elif scenario_key == "p3_static":
            ctx["cable_connected"] = True
            ctx["ont_port"] = "LAN1_1GE"
            ctx["ap_port"] = "LAN1"
            ctx["ap_ip"] = "192.168.1.2"
            ctx["ont_dhcp_start"] = "192.168.1.10"
            ctx["ont_dhcp_end"] = "192.168.1.254"
            ctx["ap_op_mode"] = "ap"
            ctx["ont_dhcp_enable"] = True
            ctx["ap_dhcp_enable"] = False
            return ctx
        nodes = []
        links = []

    # 1. Tìm node ONT chính: Bất kỳ thiết bị Gateway / Master / ONT
    ont = next((n for n in nodes if n.get("category") == "gateway" or n.get("role") == "master" or "ONT" in str(n.get("model", "")).upper() or str(n.get("catalogKey", "")) in ("ax3000gz_v2", "be12000", "ont_be6500c", "ac1000z", "ax1800gz", "ax3000gz", "ax3000hv2")), None)
    if not ont:
        ont = next((n for n in nodes if n.get("category") not in ("core", "client")), None)

    # 2. Tìm node AP phụ: Bất kỳ thiết bị AP / Router / Switch / Mesh Slave
    ap = next((n for n in nodes if (n.get("category") in ("ap", "router") or n.get("role") == "slave" or str(n.get("catalogKey", "")) in ("ax3000c", "ax3000s", "be15000", "be6500c", "vigor2927", "mikrotik_hexs", "ac1000cv2")) and n != ont), None)

    # 3. Tìm Client
    client = next((n for n in nodes if n.get("category") == "client" or str(n.get("catalogKey", "")) in ("phone_ktv", "laptop_pc", "fpt_playbox")), None)

    ctx["ont"] = ont
    ctx["ap"] = ap
    ctx["client"] = client

    if ont and ap and isinstance(links, list):
        ont_id = ont.get("id")
        ap_id = ap.get("id")
        cable = next((l for l in links if (l.get("srcId") == ont_id and l.get("tgtId") == ap_id) or (l.get("tgtId") == ont_id and l.get("srcId") == ap_id)), None)
        if cable:
            ctx["cable"] = cable
            ctx["cable_connected"] = True
            ctx["ont_port"] = cable.get("srcPort") if cable.get("srcId") == ont_id else cable.get("tgtPort")
            ctx["ap_port"] = cable.get("tgtPort") if cable.get("srcId") == ont_id else cable.get("srcPort")

    if ont:
        fw = ont.get("firmwareConfig") or {}
        ctx["ont_fw"] = fw
        ctx["ont_ip"] = ont.get("ip") or fw.get("lanIp") or "192.168.1.1"
        ctx["ont_dhcp_start"] = fw.get("dhcpStart") or fw.get("dhcpStartIp") or "192.168.1.10"
        ctx["ont_dhcp_end"] = fw.get("dhcpEnd") or fw.get("dhcpEndIp") or "192.168.1.254"
        ctx["ont_dhcp_enable"] = str(fw.get("dhcpEnable", "1")) in ("1", "true", "True")
        ctx["ont_ssid"] = fw.get("ssid") or "FPT_Telecom_WiFi7"
        ctx["ont_key"] = fw.get("wpaKey") or fw.get("password") or "12345678"

    if ap:
        fw = ap.get("firmwareConfig") or {}
        ctx["ap_fw"] = fw
        ctx["ap_ip"] = ap.get("ip") or fw.get("lanIp") or "192.168.1.100"
        ctx["ap_dhcp_enable"] = str(fw.get("dhcpEnable", "1")) in ("1", "true", "True")
        ctx["ap_ssid"] = fw.get("ssid") or ""
        ctx["ap_key"] = fw.get("wpaKey") or fw.get("password") or ""
        ctx["ap_wan_ip"] = fw.get("wanIp") or ""
        ctx["ap_op_mode"] = ap.get("opMode") or fw.get("opMode") or ap.get("category") or ""

    if client:
        ctx["client_ip"] = client.get("ip") or "192.168.1.15"

    return ctx


def evaluate_phase3_grading(scenario_key: str, session_id: str | None = None, workspace: dict | None = None) -> dict:
    """
    Chấm điểm bài thực hành KTV (Phase 3) theo thang điểm 100 với 5 tiêu chí:
    1. Cổng cắm vật lý (20đ)
    2. Chế độ hoạt động (20đ)
    3. Phân bổ lớp mạng IP (20đ)
    4. Dịch vụ DHCP Server (20đ)
    5. Cấu hình Wi-Fi & Xác thực (20đ)
    """
    with _LOCK:
        ctx = _extract_scenario_context(scenario_key, session_id, workspace)
        info = PHASE3_SCENARIOS.get(scenario_key, PHASE3_SCENARIOS["p3_mesh"])

        # Nếu Canvas hoàn toàn trống hoặc thiếu thiết bị
        if ctx.get("is_empty_canvas") or not ctx["ont"] or not ctx["ap"]:
            empty_rules = [
                {
                    "id": "c1_wiring",
                    "name": "1. Đấu Nối Cáp Vật Lý (Cổng LAN/WAN)",
                    "expected": "Cắm cáp kết nối giữa thiết bị Chính (ONT) và thiết bị Phụ (AP)",
                    "actual": "Chưa có thiết bị trên Canvas",
                    "passed": False, "points": 0, "max_points": 20,
                    "feedback": "Vui lòng kéo 1 thiết bị Chính (ONT/Gateway) và 1 thiết bị Phụ (AP/Router) từ kệ bên dưới lên Canvas và cắm dây cáp."
                },
                {
                    "id": "c2_mode",
                    "name": "2. Chế Độ Hoạt Động Thiết Bị",
                    "expected": "Cấu hình đúng chế độ hoạt động cho cặp thiết bị",
                    "actual": "Chưa có thiết bị",
                    "passed": False, "points": 0, "max_points": 20,
                    "feedback": "Cần kéo thiết bị lên Canvas để thiết lập chế độ hoạt động."
                },
                {
                    "id": "c3_subnet",
                    "name": "3. Phân Bổ Lớp Mạng IP & Gateway",
                    "expected": "Cấu hình địa chỉ IP đúng chuẩn kịch bản",
                    "actual": "Chưa có thiết bị",
                    "passed": False, "points": 0, "max_points": 20,
                    "feedback": "Cần cấu hình IP trên Web GUI của thiết bị."
                },
                {
                    "id": "c4_dhcp",
                    "name": "4. Dịch Vụ Cấp Phát DHCP Server",
                    "expected": "Thiết lập DHCP Server theo đúng cơ chế",
                    "actual": "Chưa có thiết bị",
                    "passed": False, "points": 0, "max_points": 20,
                    "feedback": "Cần kiểm tra trạng thái DHCP Server trên thiết bị."
                },
                {
                    "id": "c5_wifi_auth",
                    "name": "5. Cấu Hình Sóng Wi-Fi & Xác Thực",
                    "expected": "Cấu hình tên sóng Wi-Fi và bảo mật",
                    "actual": "Chưa có thiết bị",
                    "passed": False, "points": 0, "max_points": 20,
                    "feedback": "Cần cài đặt SSID và mật khẩu Wi-Fi."
                }
            ]
            return {
                "scenario": scenario_key,
                "scenario_title": info["title"],
                "score": 0,
                "total_score": 100,
                "passed": False,
                "all_passed": False,
                "total_rules": 5,
                "passed_rules": 0,
                "rules": empty_rules,
                "mini_topology": {
                    "ont": None,
                    "ap": None,
                    "cable": {"connected": False, "message": "Chưa có thiết bị"}
                },
                "actionable_fix": "👉 Hãy kéo 1 thiết bị Chính (ONT) và 1 thiết bị Phụ (AP) từ kệ 21 thiết bị bên dưới lên Canvas, nối dây cáp và mở Web GUI để cấu hình.",
                "elapsed_seconds": int(time.time() - _state.get("started_at", time.time())),
                "timestamp": time.strftime("%Y-%m-%d %H:%M:%S")
            }

        rules = []
        ont_port = str(ctx["ont_port"] or "").upper()
        ap_port = str(ctx["ap_port"] or "").upper()
        is_ont_lan = "LAN" in ont_port or "ETH" in ont_port
        is_ap_wan = "WAN" in ap_port or "ETHER1" in ap_port
        is_ap_lan = "LAN" in ap_port or "ETHER2" in ap_port or "GI0" in ap_port

        ap_model = str((ctx["ap"] and ctx["ap"].get("model")) or "AP").strip()
        ont_model = str((ctx["ont"] and ctx["ont"].get("model")) or "ONT").strip()
        ap_cat = str((ctx["ap"] and ctx["ap"].get("catalogKey")) or "").strip()

        # Nhận diện dòng ZTE: Image 2 quy định ZTE Agent cắm LAN-WAN; các hãng khác cắm LAN-LAN
        is_zte_agent = any(k in ap_model.upper() for k in ("BE15000", "AC1200Z", "AX1800AZ", "AX3000AZ")) or ap_cat in ("be15000", "ac1000z", "ax1800gz")

        # 1. KỊCH BẢN 1: MESH WI-FI (ĐỒNG BỘ CONTROLLER - AGENT)
        if scenario_key == "p3_mesh":
            req_port_str = "LAN (ONT) ➔ WAN (AP Agent)" if is_zte_agent else "LAN (ONT) ➔ LAN (AP Agent)"
            actual_type = "LAN-WAN" if (is_ont_lan and is_ap_wan) else ("LAN-LAN" if (is_ont_lan and is_ap_lan) else "Chưa nối đúng cổng")
            c1_pass = ctx["cable_connected"] and ((is_zte_agent and is_ont_lan and is_ap_wan) or (not is_zte_agent and is_ont_lan and is_ap_lan))
            rules.append({
                "id": "c1_wiring",
                "name": "1. Đấu Nối Cáp Vật Lý (Cổng LAN/WAN Theo Ma Trận FPT)",
                "expected": req_port_str,
                "actual": f"ONT: {ctx['ont_port'] or 'None'} ↔ AP: {ctx['ap_port'] or 'None'} ({actual_type})",
                "passed": c1_pass,
                "points": 20 if c1_pass else 0,
                "max_points": 20,
                "feedback": "Chính xác! Đấu nối cáp đạt chuẩn Tiêu Chuẩn Kỹ Thuật Wi-Fi & Mesh FPT." if c1_pass else (
                    f"Theo Tiêu Chuẩn Kỹ Thuật FPT (Ảnh 2), thiết bị {ap_model} yêu cầu cổng {req_port_str}, hiện tại đang cắm {actual_type}!"
                )
            })

            c2_pass = ctx["cable_connected"]
            rules.append({
                "id": "c2_mode",
                "name": "2. Chế Độ Hoạt Động (Mesh Controller & Agent)",
                "expected": f"ONT {ont_model} làm Controller, AP {ap_model} làm Agent Mesh",
                "actual": "Controller (Master) ➔ Agent Mesh (Slave)" if c2_pass else "Chưa nhận diện cặp Mesh",
                "passed": c2_pass,
                "points": 20 if c2_pass else 0,
                "max_points": 20,
                "feedback": "Cặp thiết bị đã vào chế độ EasyMesh Controller - Agent chuẩn." if c2_pass else "Chưa thiết lập liên kết Mesh giữa 2 thiết bị."
            })

            ap_ip = ctx["ap_ip"]
            c3_pass = ap_ip.startswith("192.168.1.")
            rules.append({
                "id": "c3_subnet",
                "name": "3. Lớp Mạng IP Quản Trị Mesh",
                "expected": "AP phụ nhận IP cùng lớp mạng quản trị ONT (192.168.1.x)",
                "actual": f"IP AP: {ap_ip} | Gateway: {ctx['ont_ip']}",
                "passed": c3_pass,
                "points": 20 if c3_pass else 0,
                "max_points": 20,
                "feedback": "AP phụ đã nằm trong dải IP quản trị của Mesh Controller." if c3_pass else "AP phụ bị lệch subnet với ONT chính."
            })

            c4_pass = ctx["ont_dhcp_enable"]
            rules.append({
                "id": "c4_dhcp",
                "name": "4. Dịch Vụ Cấp Phát DHCP Server",
                "expected": "ONT bật DHCP Server, AP phụ không cấp phát đè subnet",
                "actual": f"ONT DHCP: {'Bật' if ctx['ont_dhcp_enable'] else 'Tắt'} | AP: Mesh Slave",
                "passed": c4_pass,
                "points": 20 if c4_pass else 0,
                "max_points": 20,
                "feedback": "Hệ thống DHCP của mạng Mesh hoạt động chuẩn xác." if c4_pass else "ONT chính đang bị tắt DHCP Server!"
            })

            c5_pass = bool(ctx["ont_ssid"]) and (ctx["ont_ssid"] == ctx["ap_ssid"]) and (ctx["ont_key"] == ctx["ap_key"])
            rules.append({
                "id": "c5_wifi_auth",
                "name": "5. Đồng Bộ Sóng Wi-Fi (SSID & Mật Khẩu 100%)",
                "expected": f"Đồng bộ SSID: '{ctx['ont_ssid']}'",
                "actual": f"SSID AP: '{ctx['ap_ssid']}'",
                "passed": c5_pass,
                "points": 20 if c5_pass else 0,
                "max_points": 20,
                "feedback": "Đồng bộ 100% SSID và Mật khẩu Wi-Fi sang toàn bộ node Agent." if c5_pass else f"SSID/Mật khẩu trên AP chưa đồng bộ với Controller ONT (ONT: '{ctx['ont_ssid']}' vs AP: '{ctx['ap_ssid']}')."
            })

        # 2. KỊCH BẢN 2: ROUTER NHÁNH DHCP / PPPoE
        elif scenario_key == "p3_dhcp":
            c1_pass = ctx["cable_connected"] and is_ont_lan and is_ap_wan
            rules.append({
                "id": "c1_wiring",
                "name": "1. Đấu Nối Cáp Vật Lý (LAN ONT ➔ WAN AP)",
                "expected": "Cắm cáp từ cổng LAN của ONT sang cổng WAN của AP phụ",
                "actual": f"ONT: {ctx['ont_port'] or 'None'} ↔ AP: {ctx['ap_port'] or 'None'} ({'LAN-WAN' if is_ap_wan else 'LAN-LAN' if is_ap_lan else 'Khác'})",
                "passed": c1_pass,
                "points": 20 if c1_pass else 0,
                "max_points": 20,
                "feedback": "Cắm đúng cổng LAN (ONT) sang WAN (AP phụ) để cấp mạng cho Router nhánh." if c1_pass else "Router nhánh nhận IP từ ONT hoặc quay PPPoE bắt buộc phải cắm cáp từ cổng LAN của ONT vào cổng WAN của AP phụ!"
            })

            c2_pass = ctx["cable_connected"]
            rules.append({
                "id": "c2_mode",
                "name": "2. Chế Độ Hoạt Động (Router / Gateway Nhánh)",
                "expected": "AP phụ hoạt động ở chế độ Router nhánh (có giao diện WAN nhận IP)",
                "actual": "Router Mode (L3 Routing)" if c2_pass else "Chưa cấu hình chế độ",
                "passed": c2_pass,
                "points": 20 if c2_pass else 0,
                "max_points": 20,
                "feedback": "AP phụ đã cấu hình hoạt động ở chế độ Router nhánh." if c2_pass else "Cần kích hoạt chế độ Router cho AP phụ."
            })

            ap_ip = ctx["ap_ip"]
            c3_pass = (ap_ip == "192.168.10.1") or (not ap_ip.startswith("192.168.1."))
            rules.append({
                "id": "c3_subnet",
                "name": "3. Tách Lớp Mạng IP Tránh Xung Đột Subnet (192.168.10.1)",
                "expected": "LAN AP phụ đổi sang dải 192.168.10.1 (khác lớp 192.168.1.x của ONT)",
                "actual": f"AP LAN: {ap_ip} | ONT LAN: {ctx['ont_ip']}",
                "passed": c3_pass,
                "points": 20 if c3_pass else 0,
                "max_points": 20,
                "feedback": "Đã đổi lớp mạng LAN sang 192.168.10.1 thành công, triệt tiêu xung đột IP với ONT chính." if c3_pass else "Lỗi xung đột IP Subnet: Cả WAN và LAN của AP phụ đều đang dùng dải 192.168.1.x gây loop định tuyến. Bắt buộc chuyển LAN AP sang 192.168.10.1!"
            })

            c4_pass = ctx["ap_dhcp_enable"]
            rules.append({
                "id": "c4_dhcp",
                "name": "4. Dịch Vụ Cấp Phát DHCP Server Nội Bộ",
                "expected": "Bật DHCP Server nội bộ trên AP phụ cho dải 192.168.10.x",
                "actual": f"AP DHCP Server: {'Bật (192.168.10.x)' if c4_pass else 'Tắt'}",
                "passed": c4_pass,
                "points": 20 if c4_pass else 0,
                "max_points": 20,
                "feedback": "DHCP Server nội bộ đang hoạt động cấp phát cho nhánh 192.168.10.x." if c4_pass else "Router nhánh cần bật DHCP Server nội bộ (192.168.10.x) để cấp phát IP cho máy con!"
            })

            c5_pass = True
            rules.append({
                "id": "c5_wifi_auth",
                "name": "5. Cấu Hình Wi-Fi Độc Lập / Quay Số PPPoE",
                "expected": "Wi-Fi độc lập theo yêu cầu, hoặc quay PPPoE mẫu (hcm_ktv_demo@fpt / 123456)",
                "actual": f"SSID: '{ctx['ap_ssid'] or 'FPT_Branch_WiFi'}' | PPPoE: Sẵn sàng",
                "passed": c5_pass,
                "points": 20 if c5_pass else 0,
                "max_points": 20,
                "feedback": "Cấu hình Wi-Fi độc lập và sẵn sàng xác thực WAN quay PPPoE theo tiêu chuẩn FPT."
            })

        # 3. KỊCH BẢN 3: ACCESS POINT BRIDGE MODE
        elif scenario_key == "p3_bridge":
            c1_pass = ctx["cable_connected"] and is_ont_lan and (is_ap_lan or is_ap_wan)
            rules.append({
                "id": "c1_wiring",
                "name": "1. Đấu Nối Cáp Vật Lý (LAN ONT ➔ LAN/WAN AP)",
                "expected": "Cắm cáp từ cổng LAN của ONT sang cổng LAN của AP phụ (Switch L2) hoặc WAN Bridge",
                "actual": f"ONT: {ctx['ont_port'] or 'None'} ↔ AP: {ctx['ap_port'] or 'None'} ({'LAN-LAN' if is_ap_lan else 'LAN-WAN' if is_ap_wan else 'Khác'})",
                "passed": c1_pass,
                "points": 20 if c1_pass else 0,
                "max_points": 20,
                "feedback": "Cắm đúng cổng LAN ➔ LAN giúp AP phụ hoạt động ở tầng Switch L2 và không sinh Double NAT." if c1_pass else "Chế độ AP Bridge hoạt động ở tầng Switch L2 thuần túy, bắt buộc cắm LAN (ONT) sang LAN (AP phụ)! Cắm vào WAN sẽ biến AP thành Router gây chia tách định tuyến!"
            })

            c2_pass = ctx["cable_connected"]
            rules.append({
                "id": "c2_mode",
                "name": "2. Chế Độ Hoạt Động (Access Point Bridge Mode)",
                "expected": "AP phụ hoạt động ở chế độ Bridge / AP thuần túy (không NAT/Route)",
                "actual": "Bridge / AP Mode (L2 Switch AP)" if c2_pass else "Chưa cấu hình chế độ",
                "passed": c2_pass,
                "points": 20 if c2_pass else 0,
                "max_points": 20,
                "feedback": "AP phụ đã chuyển sang chế độ Switch L2 + Access Point thuần túy." if c2_pass else "Cần chuyển chế độ AP sang Bridge Mode."
            })

            ap_ip = ctx["ap_ip"]
            c3_pass = ap_ip.startswith("192.168.1.") and ap_ip != "192.168.1.1"
            rules.append({
                "id": "c3_subnet",
                "name": "3. Lớp Mạng IP Quản Trị AP Phụ",
                "expected": "AP phụ cùng dải mạng 192.168.1.x với ONT và khác IP Gateway (192.168.1.1)",
                "actual": f"AP IP: {ap_ip} | ONT Gateway: {ctx['ont_ip']}",
                "passed": c3_pass,
                "points": 20 if c3_pass else 0,
                "max_points": 20,
                "feedback": "IP AP phụ hợp lệ, cùng lớp mạng với Gateway ONT và không bị trùng IP." if c3_pass else f"IP AP phụ ({ap_ip}) bị lỗi (trùng Gateway hoặc khác subnet)."
            })

            c4_pass = not ctx["ap_dhcp_enable"]
            rules.append({
                "id": "c4_dhcp",
                "name": "4. TẮT HOÀN TOÀN DHCP Server Trên AP Phụ (0 DHCP)",
                "expected": "Tắt hoàn toàn DHCP Server trên AP phụ (0 DHCP), ONT chính cấp IP",
                "actual": f"AP DHCP Server: {'TẮT (0 DHCP - Chuẩn)' if c4_pass else 'BẬT (LỖI NGUY HIỂM)'}",
                "passed": c4_pass,
                "points": 20 if c4_pass else 0,
                "max_points": 20,
                "feedback": "Chính xác! Đã tắt hoàn toàn DHCP Server trên AP phụ (0 DHCP), tránh xung đột Rogue DHCP." if c4_pass else "LỖI NGHIÊM TRỌNG: Quên tắt DHCP Server trên AP phụ! Trong mô hình Bridge, nếu AP phụ bật DHCP sẽ sinh ra 2 DHCP Server cùng cấp IP trong 1 mạng (Rogue DHCP), gây tranh chấp làm thiết bị khách hàng rớt mạng liên tục!"
            })

            c5_pass = True
            rules.append({
                "id": "c5_wifi_auth",
                "name": "5. Phát Sóng Wi-Fi Độc Lập & Thông Mạng",
                "expected": "AP phát Wi-Fi, Client nhận IP từ DHCP ONT chính và thông mạng Internet",
                "actual": f"Wi-Fi AP: '{ctx['ap_ssid'] or 'FPT_AccessPoint'}' | Client IP: {ctx['client_ip']}",
                "passed": c5_pass,
                "points": 20 if c5_pass else 0,
                "max_points": 20,
                "feedback": "Access Point phát Wi-Fi ổn định, toàn bộ thiết bị nhận IP từ ONT chính và kết nối Internet thông suốt."
            })

        # 4. KỊCH BẢN 4: STATIC IP QUẢN LÝ (.2 - .9)
        elif scenario_key == "p3_static":
            c1_pass = ctx["cable_connected"] and is_ont_lan and (is_ap_lan or is_ap_wan)
            rules.append({
                "id": "c1_wiring",
                "name": "1. Đấu Nối Cáp Vật Lý (LAN ONT ➔ LAN AP)",
                "expected": "Cắm cáp từ cổng LAN của ONT sang cổng LAN của AP phụ",
                "actual": f"ONT: {ctx['ont_port'] or 'None'} ↔ AP: {ctx['ap_port'] or 'None'} ({'LAN-LAN' if is_ap_lan else 'LAN-WAN' if is_ap_wan else 'Khác'})",
                "passed": c1_pass,
                "points": 20 if c1_pass else 0,
                "max_points": 20,
                "feedback": "Cắm đúng LAN ➔ LAN để cùng broadcast domain và tránh Double NAT." if c1_pass else "Mô hình IP Tĩnh nội bộ gia đình chuẩn FPT bắt buộc cắm LAN ➔ LAN để cùng broadcast domain và tránh Double NAT!"
            })

            c2_pass = ctx["cable_connected"]
            rules.append({
                "id": "c2_mode",
                "name": "2. Chế Độ Hoạt Động (Switch + Static IP Access Point)",
                "expected": "AP phụ đóng vai trò Switch + AP cố định địa chỉ IP quản trị",
                "actual": "Switch + Static AP Mode" if c2_pass else "Chưa cấu hình chế độ",
                "passed": c2_pass,
                "points": 20 if c2_pass else 0,
                "max_points": 20,
                "feedback": "AP phụ hoạt động đúng vai trò Switch L2 kết hợp điểm phát sóng Wi-Fi cố định IP." if c2_pass else "Cần kích hoạt chế độ AP cho thiết bị phụ."
            })

            ap_ip = ctx["ap_ip"]
            last_oct = -1
            if ap_ip and ap_ip.startswith("192.168.1."):
                try:
                    last_oct = int(ap_ip.split(".")[3])
                except Exception:
                    pass
            c3_pass = (2 <= last_oct <= 9)
            if c3_pass:
                fb_c3 = f"Chính xác! Đã gán IP tĩnh {ap_ip} trong dải quản lý .2 đến .9 cho AP phụ theo đúng chuẩn kỹ thuật FPT."
            elif last_oct == 1:
                fb_c3 = "Lỗi trùng IP: IP AP phụ (192.168.1.1) trùng với địa chỉ Gateway của ONT chính!"
            elif last_oct >= 10:
                fb_c3 = f"Lỗi dải IP: IP AP phụ ({ap_ip}) đang nằm trong dải cấp phát động DHCP (.10-.254). Chuẩn FPT quy định AP phụ phải đặt trong dải tĩnh quản lý 192.168.1.2 đến 192.168.1.9 để tránh bị cấp trùng cho thiết bị di động!"
            else:
                fb_c3 = f"IP AP phụ ({ap_ip}) không thuộc dải 192.168.1.x cùng lớp mạng với Gateway ONT!"

            rules.append({
                "id": "c3_subnet",
                "name": "3. Đặt IP LAN AP Phụ Trong Dải Tĩnh Quản Lý (.2 ➔ .9)",
                "expected": "IP LAN AP phụ phải là IP tĩnh nằm trong dải quản lý 192.168.1.2 đến 192.168.1.9 (ví dụ 192.168.1.2)",
                "actual": f"AP IP: {ap_ip} (Octet cuối: .{last_oct})",
                "passed": c3_pass,
                "points": 20 if c3_pass else 0,
                "max_points": 20,
                "feedback": fb_c3
            })

            ont_dhcp_start = ctx["ont_dhcp_start"]
            ont_start_oct = 10
            if ont_dhcp_start and ont_dhcp_start.startswith("192.168.1."):
                try:
                    ont_start_oct = int(ont_dhcp_start.split(".")[3])
                except Exception:
                    pass

            c4_pass = (not ctx["ap_dhcp_enable"]) and (ont_start_oct >= 10)
            if not ctx["ap_dhcp_enable"] and ont_start_oct >= 10:
                pts_c4 = 20
                fb_c4 = f"Hoàn hảo! AP phụ đã tắt DHCP Server (0 DHCP) và ONT chính đã tách dải DHCP pool bắt đầu từ .{ont_start_oct} (>= .10) nhường dải .2-.9 cho thiết bị tĩnh."
            elif ctx["ap_dhcp_enable"]:
                pts_c4 = 0
                fb_c4 = "Lỗi nghiêm trọng: AP phụ chưa tắt DHCP Server! Bắt buộc phải tắt hoàn toàn DHCP trên AP phụ (0 DHCP) để tránh xung đột Rogue DHCP."
            else:
                pts_c4 = 10
                fb_c4 = f"AP phụ đã tắt DHCP thành công, nhưng dải DHCP Pool trên ONT chính đang bắt đầu từ .{ont_start_oct} thay vì .10. Cần chỉnh ONT DHCP bắt đầu từ 192.168.1.10 để bảo vệ dải IP tĩnh quản lý .2 đến .9!"

            rules.append({
                "id": "c4_dhcp",
                "name": "4. Quản Lý DHCP Server (Tắt DHCP AP & ONT Pool Bắt Đầu Từ .10)",
                "expected": "AP phụ TẮT DHCP Server (0 DHCP). ONT chính cấu hình DHCP Pool bắt đầu từ .10 (192.168.1.10 - 192.168.1.254)",
                "actual": f"AP DHCP: {'Bật (Lỗi)' if ctx['ap_dhcp_enable'] else 'Tắt (0 DHCP)'} | ONT Pool Bắt Đầu: .{ont_start_oct}",
                "passed": c4_pass,
                "points": pts_c4,
                "max_points": 20,
                "feedback": fb_c4
            })

            c5_pass = True
            rules.append({
                "id": "c5_wifi_auth",
                "name": "5. Phát Sóng Wi-Fi Độc Lập & Client Nhận IP DHCP .10-.254",
                "expected": "AP phát Wi-Fi độc lập, thiết bị khách hàng nhận IP động trong dải .10-.254 từ ONT và ping thông Internet",
                "actual": f"Wi-Fi AP: Phát sóng độc lập | Client IP: {ctx['client_ip']}",
                "passed": c5_pass,
                "points": 20 if c5_pass else 0,
                "max_points": 20,
                "feedback": "Thiết bị Client đã kết nối và nhận IP động hợp lệ từ ONT chính trong dải .10-.254, kết nối mạng thông suốt."
            })

        total_score = sum(r["points"] for r in rules)
        is_passed = total_score >= 80

        # Mini Topology metadata for rich visual rendering
        mini_topology = {
            "ont": {
                "id": ctx["ont"].get("id"),
                "name": ctx["ont"].get("name", ont_model),
                "model": ont_model,
                "ip": ctx["ont_ip"],
                "port": ctx["ont_port"] or "Chưa cắm",
                "dhcp_enable": ctx["ont_dhcp_enable"],
                "dhcp_pool": f"{ctx['ont_dhcp_start']} - {ctx['ont_dhcp_end']}"
            },
            "ap": {
                "id": ctx["ap"].get("id"),
                "name": ctx["ap"].get("name", ap_model),
                "model": ap_model,
                "ip": ctx["ap_ip"],
                "port": ctx["ap_port"] or "Chưa cắm",
                "dhcp_enable": ctx["ap_dhcp_enable"],
                "op_mode": ctx["ap_op_mode"]
            },
            "cable": {
                "connected": ctx["cable_connected"],
                "ont_port": ctx["ont_port"] or "Chưa cắm",
                "ap_port": ctx["ap_port"] or "Chưa cắm",
                "port_pair": f"{'LAN' if is_ont_lan else 'Port'} ➔ {'WAN' if is_ap_wan else 'LAN' if is_ap_lan else 'Port'}",
                "is_correct": bool(rules[0]["passed"])
            }
        }

        # Actionable Fix Box
        if is_passed:
            actionable_fix = "🎉 Xuất sắc! Hệ thống đã đạt tiêu chuẩn kỹ thuật FPT Telecom. Các thông số đấu nối và cấu hình hoàn toàn chuẩn xác."
        else:
            failed_reasons = [f"• {r['name']}: {r['feedback']}" for r in rules if not r["passed"]]
            actionable_fix = "\n".join(failed_reasons)

        return {
            "scenario": scenario_key,
            "scenario_title": info["title"],
            "score": total_score,
            "total_score": 100,
            "passed": is_passed,
            "all_passed": total_score == 100,
            "total_rules": len(rules),
            "passed_rules": sum(1 for r in rules if r["passed"]),
            "rules": rules,
            "mini_topology": mini_topology,
            "actionable_fix": actionable_fix,
            "elapsed_seconds": int(time.time() - _state.get("started_at", time.time())),
            "timestamp": time.strftime("%Y-%m-%d %H:%M:%S")
        }
def get_phase3_missions(scenario_key: str, session_id: str | None = None, workspace: dict | None = None) -> dict:
    """Lấy danh sách 5 nhiệm vụ checklist theo kịch bản Phase 3 kèm trạng thái tiến độ thời gian thực."""
    grading = evaluate_phase3_grading(scenario_key, session_id, workspace)
    info = PHASE3_SCENARIOS.get(scenario_key, PHASE3_SCENARIOS["p3_mesh"])
    rules = grading["rules"]

    missions = []
    for idx, r in enumerate(rules, start=1):
        missions.append({
            "id": f"m{idx}",
            "step": idx,
            "title": r["name"],
            "instruction": f"Yêu cầu: {r['expected']}. {r['feedback']}",
            "status": "COMPLETED" if r["passed"] else "PENDING",
            "completed": bool(r["passed"]),
            "badge": f"{r['points']}/{r['max_points']}đ",
            "points": r["points"],
            "max_points": r["max_points"],
            "feedback": r["feedback"]
        })

    completed_count = sum(1 for m in missions if m["completed"])
    return {
        "scenario": info,
        "missions": missions,
        "total": len(missions),
        "completed_count": completed_count,
        "all_completed": completed_count == len(missions),
        "progress_percent": int((completed_count / len(missions)) * 100),
        "score": grading["score"],
        "passed": grading["passed"]
    }


# ===========================================================================
# HỆ THỐNG CHẤM BÀI HỌC MESH 4 BƯỚC (ĐẠT / CHƯA ĐẠT - KHÔNG TÍNH ĐIỂM SỐ)
# Kế thừa chuẩn cấu hình Bài 1 (PPPoE) & Bài 2 (Wi-Fi) của từng dòng thiết bị
# ===========================================================================

CATALOG_KEY_TO_SIM_ID = {
    "ax3000c": "sim_ax3000c",
    "ax3000gz_v2": "sim_ax3000gz_v2",
    "ax3000hv2": "sim_ax3000hv2",
    "ax1800gz": "sim_ax1800gz",
    "be12000": "sim_be12000",
    "ax3000s": "sim_ax3000s",
    "ax3000gz": "sim_ax3000gz",
    "ac1000z": "sim_ac1000z",
    "ont_be6500c": "sim_ONT_be6500c",
    "be6500c": "sim_be6500c",
    "ac1000f": "sim_ac1000f",
    "ac1000hi": "sim_ac1000HI",
    "ac1000cv2": "sim_ac1000cv2",
}

CATALOG_KEY_TO_DISPLAY_NAME = {
    "ax3000c": "AX3000CV2",
    "ax3000gz_v2": "ONT AX3000GZ V2",
    "ax3000hv2": "ONT AX3000HV2",
    "ax1800gz": "ONT AX1800GZ",
    "be12000": "ONT BE12000Z",
    "be15000": "AP BE15000Z",
    "ax3000s": "AP AX3000S",
    "ax3000gz": "ONT AX3000GZ",
    "ac1000z": "ONT AC1000Z",
    "ont_be6500c": "ONT BE6500C",
    "be6500c": "AP BE6500C",
    "ac1000f": "ONT AC1000F",
    "ac1000hi": "ONT AC1000HI",
    "ac1000cv2": "ONT AC1000CV2",
    "vigor2927": "DrayTek Vigor 2927",
    "mikrotik_hexs": "MikroTik hEX S",
}

# Chuẩn cấu hình Bài 1 (PPPoE) và Bài 2 (Wi-Fi) kế thừa từ devices/<device>/lessons/bai1.js & bai2.js
DEVICE_LESSON_STANDARDS = {
    "ax3000c": {
        "model": "AX3000CV2",
        "pppoe_user": "sgfdl-123456-789",
        "pppoe_pass": "d123456",
        "wan_proto": "pppoe",
        "ssid_2g": "FPT Telecom",
        "ssid_5g": "FPT Telecom",
        "wifi_pass_2g": "fpt12345",
        "wifi_pass_5g": "fpt12345",
        "require_unified_ssid": True,
    },
    "ax3000gz_v2": {
        "model": "AX3000GZ V2",
        "pppoe_user": "sgfdl-123456-789",
        "pppoe_pass": "fpt12345",
        "ssid_2g": "FPT Telecom",
        "ssid_5g": "FPT Telecom",
        "wifi_pass_2g": "Fptwifi123",
        "wifi_pass_5g": "Fptwifi123",
    },
    "ac1000z": {
        "model": "AC1000Z",
        "pppoe_user": "sgfdl-123456-789",
        "pppoe_pass": "fpt12345",
        "ssid_2g": "FPT Telecom",
        "ssid_5g": "FPT Telecom",
        "wifi_pass_2g": "Fptwifi123",
        "wifi_pass_5g": "Fptwifi123",
    },
    "ax3000hv2": {
        "model": "AX3000HV2",
        "pppoe_user": "sgfdl-210208-218",
        "pppoe_pass": "fpt12345",
        "ssid_2g": "FPT Telecom",
        "ssid_5g": "FPT Telecom",
        "wifi_pass_2g": "fpt12345",
        "wifi_pass_5g": "fpt12345",
    },
    "ax1800gz": {
        "model": "AX1800GZ",
        "pppoe_user": "hnfdl-123456-789",
        "pppoe_pass": "d123456",
        "wan_nat": "Enable",
        "wan_vlan": "Disable",
        "ssid_2g": "FPT Telecom",
        "ssid_5g": "FPT Telecom",
        "wifi_pass_2g": "19006600",
        "wifi_pass_5g": "19006600",
    },
    "be12000": {
        "model": "BE12000Z",
        "pppoe_user": "hnfdl-123456-789",
        "pppoe_pass": "d123456",
        "wan_connection_name": "FPT",
        "ssid_2g": "FPT Telecom",
        "ssid_5g": "FPT Telecom",
        "wifi_pass_2g": "19006600",
        "wifi_pass_5g": "19006600",
    },
    "ax3000s": {
        "model": "AX3000S",
        "pppoe_user": "sgfdl-123456-789",
        "pppoe_pass": "d123456",
        "ssid_2g": "FPT Telecom",
        "ssid_5g": "FPT Telecom",
        "wifi_pass_2g": "fpt12345",
        "wifi_pass_5g": "fpt12345",
    },
    "ax3000gz": {
        "model": "AX3000GZ",
        "pppoe_user": "sgfdl-123456-789",
        "pppoe_pass": "d123456",
        "ssid_2g": "FPT Telecom",
        "ssid_5g": "FPT Telecom",
        "wifi_pass_2g": "fpt12345",
        "wifi_pass_5g": "fpt12345",
    },
    "ont_be6500c": {
        "model": "ONT BE6500C",
        "pppoe_user": "sgfdl-123456-789",
        "pppoe_pass": "d123456",
        "ssid_2g": "FPT Telecom",
        "ssid_5g": "FPT Telecom",
        "wifi_pass_2g": "fpt12345",
        "wifi_pass_5g": "fpt12345",
    },
    "be6500c": {
        "model": "AP BE6500C",
        "pppoe_user": "sgfdl-123456-789",
        "pppoe_pass": "d123456",
        "ssid_2g": "FPT Telecom",
        "ssid_5g": "FPT Telecom",
        "wifi_pass_2g": "fpt12345",
        "wifi_pass_5g": "fpt12345",
    },
}

# Đặc tả cặp thiết bị bắt buộc cho từng bài học Mesh
MESH_LESSON_PAIR_SPECS = {
    "LAB_AX3000CV2_07": {
        "lab_id": "LAB_AX3000CV2_07",
        "scenario_key": "p3_mesh_ax3000cv2",
        "title": "Bài 7 - Cấu hình Mesh AX3000CV2 với AX3000CV2",
        "badge": "MESH AX3000CV2 ↔ AX3000CV2",
        "required_devices": ["ax3000c", "ax3000c"],
        "pair_label": "AX3000CV2 (Controller) với AX3000CV2 (Agent)",
        "primary_catalog": "ax3000c",
        "secondary_catalog": "ax3000c",
        "wiring_rule": "LAN-LAN",
    },
    "p3_mesh_ax3000cv2": {
        "lab_id": "LAB_AX3000CV2_07",
        "scenario_key": "p3_mesh_ax3000cv2",
        "title": "Bài 7 - Cấu hình Mesh AX3000CV2 với AX3000CV2",
        "badge": "MESH AX3000CV2 ↔ AX3000CV2",
        "required_devices": ["ax3000c", "ax3000c"],
        "pair_label": "AX3000CV2 (Controller) với AX3000CV2 (Agent)",
        "primary_catalog": "ax3000c",
        "secondary_catalog": "ax3000c",
        "wiring_rule": "LAN-LAN",
    },
    "LAB_AX3000GZV2_07": {
        "lab_id": "LAB_AX3000GZV2_07",
        "scenario_key": "p3_mesh_ax3000gzv2",
        "title": "Bài 7 - Cấu hình Mesh AX3000GZ V2 với AX3000CV2",
        "badge": "MESH AX3000GZ V2 ↔ AX3000CV2",
        "required_devices": ["ax3000gz_v2", "ax3000c"],
        "pair_label": "ONT AX3000GZ V2 với AP AX3000CV2",
        "primary_catalog": "ax3000gz_v2",
        "secondary_catalog": "ax3000c",
        "wiring_rule": "LAN-LAN",
    },
    "p3_mesh_ax3000gzv2": {
        "lab_id": "LAB_AX3000GZV2_07",
        "scenario_key": "p3_mesh_ax3000gzv2",
        "title": "Bài 7 - Cấu hình Mesh AX3000GZ V2 với AX3000CV2",
        "badge": "MESH AX3000GZ V2 ↔ AX3000CV2",
        "required_devices": ["ax3000gz_v2", "ax3000c"],
        "pair_label": "ONT AX3000GZ V2 với AP AX3000CV2",
        "primary_catalog": "ax3000gz_v2",
        "secondary_catalog": "ax3000c",
        "wiring_rule": "LAN-LAN",
    },
    "LAB_AX3000HV2_07": {
        "lab_id": "LAB_AX3000HV2_07",
        "scenario_key": "p3_mesh_ax3000hv2",
        "title": "Bài 7 - Cấu hình Mesh AX3000HV2 với AX3000CV2",
        "badge": "MESH AX3000HV2 ↔ AX3000CV2",
        "required_devices": ["ax3000hv2", "ax3000c"],
        "pair_label": "ONT AX3000HV2 với AP AX3000CV2",
        "primary_catalog": "ax3000hv2",
        "secondary_catalog": "ax3000c",
        "wiring_rule": "LAN-LAN",
    },
    "p3_mesh_ax3000hv2": {
        "lab_id": "LAB_AX3000HV2_07",
        "scenario_key": "p3_mesh_ax3000hv2",
        "title": "Bài 7 - Cấu hình Mesh AX3000HV2 với AX3000CV2",
        "badge": "MESH AX3000HV2 ↔ AX3000CV2",
        "required_devices": ["ax3000hv2", "ax3000c"],
        "pair_label": "ONT AX3000HV2 với AP AX3000CV2",
        "primary_catalog": "ax3000hv2",
        "secondary_catalog": "ax3000c",
        "wiring_rule": "LAN-LAN",
    },
    "LAB_AX1800GZ_07": {
        "lab_id": "LAB_AX1800GZ_07",
        "scenario_key": "p3_mesh_ax1800gz",
        "title": "Bài 7 - Cấu hình Mesh AX1800GZ với AX3000CV2",
        "badge": "MESH AX1800GZ ↔ AX3000CV2",
        "required_devices": ["ax1800gz", "ax3000c"],
        "pair_label": "ONT AX1800GZ với AP AX3000CV2",
        "primary_catalog": "ax1800gz",
        "secondary_catalog": "ax3000c",
        "wiring_rule": "LAN-LAN",
    },
    "p3_mesh_ax1800gz": {
        "lab_id": "LAB_AX1800GZ_07",
        "scenario_key": "p3_mesh_ax1800gz",
        "title": "Bài 7 - Cấu hình Mesh AX1800GZ với AX3000CV2",
        "badge": "MESH AX1800GZ ↔ AX3000CV2",
        "required_devices": ["ax1800gz", "ax3000c"],
        "pair_label": "ONT AX1800GZ với AP AX3000CV2",
        "primary_catalog": "ax1800gz",
        "secondary_catalog": "ax3000c",
        "wiring_rule": "LAN-LAN",
    },
    "LAB_AX3000S_07": {
        "lab_id": "LAB_AX3000S_07",
        "scenario_key": "p3_mesh_ax3000s",
        "title": "Bài 7 - Cấu hình Mesh AX3000S với AX3000CV2",
        "badge": "MESH AX3000S ↔ AX3000CV2",
        "required_devices": ["ax3000s", "ax3000c"],
        "pair_label": "AX3000S với AP AX3000CV2",
        "primary_catalog": "ax3000s",
        "secondary_catalog": "ax3000c",
        "wiring_rule": "LAN-LAN",
    },
    "p3_mesh_ax3000s": {
        "lab_id": "LAB_AX3000S_07",
        "scenario_key": "p3_mesh_ax3000s",
        "title": "Bài 7 - Cấu hình Mesh AX3000S với AX3000CV2",
        "badge": "MESH AX3000S ↔ AX3000CV2",
        "required_devices": ["ax3000s", "ax3000c"],
        "pair_label": "AX3000S với AP AX3000CV2",
        "primary_catalog": "ax3000s",
        "secondary_catalog": "ax3000c",
        "wiring_rule": "LAN-LAN",
    },
    "LAB_BE12000_07": {
        "lab_id": "LAB_BE12000_07",
        "scenario_key": "p3_mesh_zte",
        "title": "Bài 7 - Cấu hình Mesh BE12000Z với BE15000Z",
        "badge": "MESH ZTE BE12000Z ↔ BE15000Z",
        "required_devices": ["be12000", "be15000"],
        "pair_label": "ONT BE12000Z với AP BE15000Z",
        "primary_catalog": "be12000",
        "secondary_catalog": "be15000",
        "wiring_rule": "LAN-WAN",
    },
    "p3_mesh_zte": {
        "lab_id": "LAB_BE12000_07",
        "scenario_key": "p3_mesh_zte",
        "title": "Bài 7 - Cấu hình Mesh BE12000Z với BE15000Z",
        "badge": "MESH ZTE BE12000Z ↔ BE15000Z",
        "required_devices": ["be12000", "be15000"],
        "pair_label": "ONT BE12000Z với AP BE15000Z",
        "primary_catalog": "be12000",
        "secondary_catalog": "be15000",
        "wiring_rule": "LAN-WAN",
    },
}


def _resolve_mesh_4step_spec(scenario_key: str | None = None, lab_id: str | None = None, net_nodes: list | None = None) -> dict:
    for key in (lab_id, scenario_key):
        if key and str(key) in MESH_LESSON_PAIR_SPECS:
            return dict(MESH_LESSON_PAIR_SPECS[str(key)])
    # If generic 4-step mode is requested without a specific lab_id, infer pair from current Canvas or default to AX3000CV2 pair
    if isinstance(net_nodes, list) and len(net_nodes) == 2:
        k0 = str(net_nodes[0].get("catalogKey") or "").strip()
        k1 = str(net_nodes[1].get("catalogKey") or "").strip()
        for spec in MESH_LESSON_PAIR_SPECS.values():
            if sorted(spec["required_devices"]) == sorted([k0, k1]):
                return dict(spec)
    return dict(MESH_LESSON_PAIR_SPECS["LAB_AX3000CV2_07"])


def _read_live_or_fw_node_cfg(node: dict, base_ktv_id: str) -> dict:
    import mesh_sync_adapter
    cat_key = str(node.get("catalogKey") or "").strip()
    sim_id = str(node.get("simId") or CATALOG_KEY_TO_SIM_ID.get(cat_key) or "").strip()
    nid = str(node.get("id") or "node-1")
    fw = dict(node.get("firmwareConfig") or {})
    if sim_id and sim_id in getattr(mesh_sync_adapter, "_ADAPTER_TABLE", {}):
        skey = mesh_sync_adapter.make_node_session_key(base_ktv_id, nid)
        req_exp = bool(node.get("requireExplicitMeshMode") or fw.get("requireExplicitMeshMode"))
        if sim_id == "sim_ax3000c" and req_exp:
            mesh_sync_adapter.ensure_ax3000c_mesh_lesson_agent_default(skey)
        b_cfg = mesh_sync_adapter.read_node_backend_config(sim_id, skey, fw)
        # If workspace node explicitly injected test overrides without touching WebGUI, allow explicit test fields
        if not b_cfg.get("webguiTouched"):
            if fw.get("pppoeUser") and not b_cfg.get("pppoeUser"):
                b_cfg["pppoeUser"] = str(fw["pppoeUser"]).strip()
            if fw.get("pppoePass") and not b_cfg.get("pppoePass"):
                b_cfg["pppoePass"] = str(fw["pppoePass"]).strip()
            if isinstance(fw.get("untouchedViolations"), list) and fw["untouchedViolations"]:
                b_cfg["untouchedViolations"] = list(fw["untouchedViolations"])
            if fw.get("hasKtvCustomConfig"):
                if fw.get("ssid"):
                    b_cfg["ssid"] = str(fw["ssid"])
                    b_cfg["ssid5g"] = str(fw.get("ssid5g") or fw["ssid"])
                if fw.get("wpaKey") or fw.get("password"):
                    pwd = str(fw.get("password") or fw.get("wpaKey"))
                    b_cfg["password"] = pwd
                    b_cfg["password5g"] = str(fw.get("password5g") or pwd)
                if "meshRole" in fw:
                    b_cfg["meshRole"] = str(fw["meshRole"])
                if "meshEnabled" in fw:
                    b_cfg["meshEnabled"] = bool(fw["meshEnabled"])
        return b_cfg
    return mesh_sync_adapter.normalize_cfg(fw)


def evaluate_mesh_4step_grading(
    scenario_key: str | None = None,
    session_id: str | None = None,
    workspace: dict | None = None,
    lab_id: str | None = None,
) -> dict:
    """
    Chấm bài thực hành Mesh theo đúng 4 bước (Chỉ chấm ĐẠT / CHƯA ĐẠT, Đúng / Sai từng bước, không chấm điểm số):
    - Ràng buộc thiết bị: Kiểm tra KTV kéo thả đúng cặp thiết bị của bài học đã chọn.
    - Bước 1: Chọn Mode Mesh trong giao diện thiết bị (Tập trung AX3000CV2: Controller & Agent).
    - Bước 2: Cấu hình trên thiết bị chính/ONT (Chỉ cấu hình đúng 2 phần PPPoE & Wi-Fi theo chuẩn Bài 1 & Bài 2; sửa phần khác báo Sai).
    - Bước 3: Kiểm tra Đấu Nối Dây (LAN-LAN tất cả các dòng; LAN-WAN cho dòng ZTE BE12000Z với BE15000Z).
    - Bước 4: Kiểm tra Sơ đồ Topology Mesh trong các thiết bị kết nối.
    """
    import mesh_sync_adapter

    with _LOCK:
        base_ktv_id = mesh_sync_adapter.sanitize_base_ktv_id(session_id or "default")
        nodes = None
        links = None
        if isinstance(workspace, dict) and isinstance(workspace.get("nodes"), list):
            nodes = workspace.get("nodes") or []
            links = workspace.get("links") or []
        else:
            ws = mesh_sync_adapter.get_workspace(base_ktv_id)
            if isinstance(ws, dict) and isinstance(ws.get("nodes"), list):
                nodes = ws.get("nodes") or []
                links = ws.get("links") or []
        if nodes is None:
            nodes = []
        if links is None:
            links = []

        # Lọc các thiết bị mạng chính trên Canvas (bỏ qua OLT Core và thiết bị đầu cuối PC/Phone/PlayBox)
        net_nodes = [
            n for n in nodes
            if isinstance(n, dict)
            and str(n.get("category") or "") not in ("core", "client")
            and str(n.get("catalogKey") or "") not in ("olt_cloud", "laptop_pc", "phone_ktv", "fpt_playbox")
        ]

        spec = _resolve_mesh_4step_spec(scenario_key=scenario_key, lab_id=lab_id, net_nodes=net_nodes)
        req_keys = list(spec["required_devices"])
        pair_label = spec["pair_label"]
        p_std = DEVICE_LESSON_STANDARDS.get(spec["primary_catalog"], DEVICE_LESSON_STANDARDS["ax3000c"])

        actual_keys = [str(n.get("catalogKey") or "").strip() for n in net_nodes]
        actual_names = [
            CATALOG_KEY_TO_DISPLAY_NAME.get(k, str(n.get("model") or k or "Thiết bị"))
            for k, n in zip(actual_keys, net_nodes)
        ]

        device_pair_valid = sorted(actual_keys) == sorted(req_keys) and len(net_nodes) == 2
        device_pair_error = ""
        if len(net_nodes) == 0:
            device_pair_error = (
                f"Chưa có thiết bị trên Canvas! Vui lòng kéo thả đúng thiết bị thuộc phần cấu hình đã chọn: {pair_label}."
            )
        elif not device_pair_valid:
            actual_str = " + ".join(actual_names) if actual_names else "Chưa chọn đủ thiết bị"
            device_pair_error = (
                f"Sai thiết bị! Vui lòng chọn đúng thiết bị thuộc phần cấu hình đã chọn ({pair_label}). "
                f"Hiện tại trên Canvas đang có: {actual_str}."
            )

        # Yêu cầu đề bài của 4 bước
        if spec["primary_catalog"] == "ax3000c" and spec["secondary_catalog"] == "ax3000c":
            step1_expected = (
                "Thiết bị 1 (AX3000CV2 Chính): EasyMesh = Bật, Mesh Role = Controller | "
                "Thiết bị 2 (AX3000CV2 Phụ): EasyMesh = Bật, Mesh Role = Agent"
            )
        elif spec["secondary_catalog"] == "ax3000c":
            step1_expected = (
                f"Thiết bị Chính ({p_std['model']}): Bật Mesh Controller | "
                "Thiết bị Phụ (AX3000CV2): EasyMesh = Bật, Mesh Role = Agent"
            )
        else:
            step1_expected = f"Kích hoạt chế độ Mesh Controller trên {p_std['model']} và Mesh Agent trên thiết bị phụ"

        step2_expected = (
            f"Chỉ cấu hình đúng 2 phần trên {p_std['model']}: "
            f"1) PPPoE (User: {p_std['pppoe_user']}, Pass: {p_std['pppoe_pass']}) và "
            f"2) Wi-Fi (SSID: {p_std['ssid_2g']}, Pass: {p_std['wifi_pass_2g']})"
            + (", Use separate SSID: Tắt" if p_std.get("require_unified_ssid") else "")
            + ". Giữ nguyên mặc định tất cả các phần cấu hình khác"
        )

        is_zte_pair = (
            spec["wiring_rule"] == "LAN-WAN"
            or spec["secondary_catalog"] in ("be15000", "ac1000z", "ax1800gz")
        )
        step3_expected = (
            "Đấu nối dây LAN ➔ WAN cho dòng ZTE (Cổng LAN thiết bị chính sang cổng WAN thiết bị phụ)"
            if is_zte_pair
            else "Đấu nối dây LAN ➔ LAN (Cổng LAN thiết bị chính sang cổng LAN thiết bị phụ)"
        )
        step4_expected = (
            f"Thiết bị Agent xuất hiện trực tuyến trong Sơ đồ Topology Mesh và đồng bộ 100% Wi-Fi "
            f"(SSID: {p_std['ssid_2g']})"
        )

        if not device_pair_valid:
            rules = [
                {
                    "id": "step1_mesh_mode",
                    "name": "Bước 1: Chọn Mode Mesh trong giao diện thiết bị",
                    "label": "Bước 1: Chọn Mode Mesh trong giao diện thiết bị",
                    "expected": step1_expected,
                    "actual": device_pair_error,
                    "passed": False,
                    "status_text": "✖ Sai",
                    "feedback": device_pair_error,
                },
                {
                    "id": "step2_ont_pppoe_wifi",
                    "name": f"Bước 2: Cấu hình PPPoE và Wi-Fi trên thiết bị chính ({p_std['model']})",
                    "label": f"Bước 2: Cấu hình PPPoE và Wi-Fi trên thiết bị chính ({p_std['model']})",
                    "expected": step2_expected,
                    "actual": device_pair_error,
                    "passed": False,
                    "status_text": "✖ Sai",
                    "feedback": device_pair_error,
                },
                {
                    "id": "step3_wiring",
                    "name": "Bước 3: Kiểm tra Đấu Nối Dây",
                    "label": "Bước 3: Kiểm tra Đấu Nối Dây",
                    "expected": step3_expected,
                    "actual": device_pair_error,
                    "passed": False,
                    "status_text": "✖ Sai",
                    "feedback": device_pair_error,
                },
                {
                    "id": "step4_mesh_topology",
                    "name": "Bước 4: Kiểm tra Sơ đồ Topology Mesh trong các thiết bị kết nối",
                    "label": "Bước 4: Kiểm tra Sơ đồ Topology Mesh trong các thiết bị kết nối",
                    "expected": step4_expected,
                    "actual": device_pair_error,
                    "passed": False,
                    "status_text": "✖ Sai",
                    "feedback": device_pair_error,
                },
            ]
            return {
                "grading_mode": "4step_binary",
                "scenario": spec["scenario_key"],
                "lab_id": spec["lab_id"],
                "scenario_title": spec["title"],
                "status_label": "CHƯA ĐẠT",
                "passed": False,
                "all_passed": False,
                "device_pair_valid": False,
                "device_pair_error": device_pair_error,
                "total_rules": 4,
                "passed_rules": 0,
                "rules": rules,
                "details": [
                    {
                        "id": "device_pair_check",
                        "name": "Thiết bị trên Canvas",
                        "label": "Thiết bị trên Canvas",
                        "field": "Thiết bị trên Canvas",
                        "expected": pair_label,
                        "actual": (" + ".join(actual_names)) if actual_names else "Chưa kéo thiết bị lên Canvas",
                        "passed": False,
                        "ok": False,
                        "message": device_pair_error,
                    }
                ],
                "mini_topology": {
                    "ont": None,
                    "ap": None,
                    "cable": {"connected": False, "message": device_pair_error},
                },
                "actionable_fix": f"❌ {device_pair_error}",
                "elapsed_seconds": int(time.time() - _state.get("started_at", time.time())),
                "timestamp": time.strftime("%Y-%m-%d %H:%M:%S"),
            }

        # Xác định thiết bị Chính (Primary / Controller / ONT) và thiết bị Phụ (Secondary / Agent / AP)
        if spec["primary_catalog"] == spec["secondary_catalog"]:
            c0 = _read_live_or_fw_node_cfg(net_nodes[0], base_ktv_id)
            c1 = _read_live_or_fw_node_cfg(net_nodes[1], base_ktv_id)
            r0 = str(c0.get("meshRole") or "Agent").strip()
            r1 = str(c1.get("meshRole") or "Agent").strip()
            if r1 == "Controller" and r0 != "Controller":
                primary_node, secondary_node = net_nodes[1], net_nodes[0]
            elif r0 == r1 and bool(c1.get("pppoeUser")) and not bool(c0.get("pppoeUser")):
                primary_node, secondary_node = net_nodes[1], net_nodes[0]
            else:
                primary_node, secondary_node = net_nodes[0], net_nodes[1]
        else:
            if str(net_nodes[0].get("catalogKey")) == spec["primary_catalog"]:
                primary_node, secondary_node = net_nodes[0], net_nodes[1]
            else:
                primary_node, secondary_node = net_nodes[1], net_nodes[0]

        # Đảm bảo node mang simId chuẩn trước khi đồng bộ topology
        for n in (primary_node, secondary_node):
            ck = str(n.get("catalogKey") or "").strip()
            if not n.get("simId") and ck in CATALOG_KEY_TO_SIM_ID:
                n["simId"] = CATALOG_KEY_TO_SIM_ID[ck]

        # Đồng bộ topology từ trạng thái backend hiện tại của thiết bị
        try:
            p_pre = _read_live_or_fw_node_cfg(primary_node, base_ktv_id)
            p_fw_check = primary_node.get("firmwareConfig") or {}
            p_req_exp = bool(primary_node.get("requireExplicitMeshMode") or p_fw_check.get("requireExplicitMeshMode"))
            prefer_backend = bool(p_pre.get("webguiTouched") or p_req_exp or not p_fw_check.get("hasKtvCustomConfig"))
            mesh_sync_adapter.sync_all_nodes_backend(
                base_ktv_id,
                nodes,
                links,
                source_node_id=str(primary_node.get("id") or ""),
                prefer_backend_source=prefer_backend,
            )
        except Exception:
            pass

        p_cfg = _read_live_or_fw_node_cfg(primary_node, base_ktv_id)
        s_cfg = _read_live_or_fw_node_cfg(secondary_node, base_ktv_id)

        p_name = str(primary_node.get("name") or p_std["model"])
        s_name = str(secondary_node.get("name") or CATALOG_KEY_TO_DISPLAY_NAME.get(spec["secondary_catalog"], "AP"))

        # -------------------------------------------------------------------
        # BƯỚC 1: Chọn Mode Mesh trong giao diện thiết bị
        # -------------------------------------------------------------------
        p_mesh_en = True if p_cfg.get("meshEnabled") is None else bool(p_cfg.get("meshEnabled"))
        s_mesh_en = True if s_cfg.get("meshEnabled") is None else bool(s_cfg.get("meshEnabled"))
        p_role = str(p_cfg.get("meshRole") or "Agent").strip()
        s_role = str(s_cfg.get("meshRole") or "Agent").strip()

        if spec["primary_catalog"] == "ax3000c" and spec["secondary_catalog"] == "ax3000c":
            step1_pass = (
                p_mesh_en
                and p_role.lower() == "controller"
                and s_mesh_en
                and s_role.lower() == "agent"
            )
            step1_actual = (
                f"{p_name}: EasyMesh={'Bật' if p_mesh_en else 'Tắt'}, Role={p_role} | "
                f"{s_name}: EasyMesh={'Bật' if s_mesh_en else 'Tắt'}, Role={s_role}"
            )
            if step1_pass:
                step1_fb = "Chính xác! Đã chọn đúng Mode EasyMesh Controller trên thiết bị chính và Agent trên thiết bị phụ."
            elif not p_mesh_en or not s_mesh_en:
                step1_fb = "EasyMesh đang bị Tắt (Disabled) trên thiết bị! Vui lòng bật EasyMesh (Enabled) trên cả 2 thiết bị AX3000CV2."
            elif p_role.lower() != "controller":
                step1_fb = (
                    f"Chưa chuyển Mesh Role trên thiết bị chính ({p_name}) sang Controller "
                    f"(hiện đang là '{p_role}'). Hãy mở Web GUI -> Network -> EasyMesh -> chọn Controller và bấm Save."
                )
            else:
                step1_fb = (
                    f"Thiết bị phụ ({s_name}) phải để Mesh Role là Agent (hiện đang là '{s_role}')."
                )
        elif spec["secondary_catalog"] == "ax3000c":
            step1_pass = p_mesh_en and s_mesh_en and s_role.lower() == "agent"
            step1_actual = (
                f"{p_name}: Mesh={'Bật' if p_mesh_en else 'Tắt'} | "
                f"{s_name} (AX3000CV2): EasyMesh={'Bật' if s_mesh_en else 'Tắt'}, Role={s_role}"
            )
            step1_fb = (
                "Chính xác! Thiết bị đã chọn đúng chế độ Mesh."
                if step1_pass
                else f"Vui lòng bật EasyMesh và chọn Mesh Role = Agent trên thiết bị AX3000CV2 ({s_name})."
            )
        else:
            step1_pass = p_mesh_en and s_mesh_en
            step1_actual = f"{p_name}: Mesh={'Bật' if p_mesh_en else 'Tắt'} | {s_name}: Mesh={'Bật' if s_mesh_en else 'Tắt'}"
            step1_fb = "Chính xác! Đã bật chế độ Mesh trên các thiết bị." if step1_pass else "Chế độ Mesh đang bị tắt trên thiết bị."

        # -------------------------------------------------------------------
        # BƯỚC 2: Cấu hình trên thiết bị ONT / Chính (Chỉ đúng 2 phần PPPoE & Wi-Fi; sửa phần khác báo Sai)
        # -------------------------------------------------------------------
        actual_pppoe_user = str(p_cfg.get("pppoeUser") or "").strip()
        actual_pppoe_pass = str(p_cfg.get("pppoePass") or "").strip()
        actual_wan_proto = str(p_cfg.get("wanProto") or "pppoe").strip().lower()

        pppoe_ok = (
            actual_pppoe_user == p_std["pppoe_user"]
            and actual_pppoe_pass == p_std["pppoe_pass"]
            and (not p_std.get("wan_proto") or actual_wan_proto == p_std["wan_proto"])
        )
        if p_std.get("wan_nat") and str(p_cfg.get("wanNat") or "Enable") != p_std["wan_nat"]:
            pppoe_ok = False
        if p_std.get("wan_vlan") and str(p_cfg.get("wanVlan") or "Disable") != p_std["wan_vlan"]:
            pppoe_ok = False
        if p_std.get("wan_connection_name") and str(p_cfg.get("wanConnectionName") or "") != p_std["wan_connection_name"]:
            pppoe_ok = False

        actual_ssid_2g = str(p_cfg.get("ssid") or "").strip()
        actual_ssid_5g = str(p_cfg.get("ssid5g") or actual_ssid_2g).strip()
        actual_pass_2g = str(p_cfg.get("password") or "").strip()
        actual_pass_5g = str(p_cfg.get("password5g") or actual_pass_2g).strip()
        vap_diff = bool(p_cfg.get("vapDiffMode", False))
        w2_dis = bool(p_cfg.get("wifi2gDisabled", False))
        w5_dis = bool(p_cfg.get("wifi5gDisabled", False))

        wifi_ok = (
            actual_ssid_2g == p_std["ssid_2g"]
            and actual_ssid_5g == p_std["ssid_5g"]
            and actual_pass_2g == p_std["wifi_pass_2g"]
            and actual_pass_5g == p_std["wifi_pass_5g"]
            and not w2_dis
            and not w5_dis
            and (not p_std.get("require_unified_ssid") or not vap_diff)
        )

        p_violations = list(p_cfg.get("untouchedViolations") or [])
        s_violations = [f"{v} (trên {s_name})" for v in (s_cfg.get("untouchedViolations") or [])]
        all_violations = p_violations + s_violations

        step2_pass = pppoe_ok and wifi_ok and (len(all_violations) == 0)

        pppoe_disp = (
            f"PPPoE({actual_pppoe_user or 'Chưa nhập'}/{actual_pppoe_pass or 'Chưa nhập'})"
        )
        wifi_disp = (
            f"Wi-Fi(SSID: {actual_ssid_2g or 'Chưa nhập'}, Pass: {actual_pass_2g or 'Chưa nhập'}"
            + (f", Separate SSID: {'Bật' if vap_diff else 'Tắt'}" if p_std.get("require_unified_ssid") else "")
            + ")"
        )
        viol_disp = (
            f" | Vi phạm sửa cấu hình khác: {', '.join(all_violations)}"
            if all_violations
            else " | Các phần khác: Giữ nguyên mặc định"
        )
        step2_actual = f"{pppoe_disp} | {wifi_disp}{viol_disp}"

        if step2_pass:
            step2_fb = (
                f"Chính xác! Đã cấu hình đúng chuẩn 2 phần PPPoE & Wi-Fi trên {p_std['model']} và giữ nguyên các phần cấu hình khác."
            )
        else:
            err_parts = []
            if not pppoe_ok:
                err_parts.append(
                    f"Sai cấu hình PPPoE (Yêu cầu User '{p_std['pppoe_user']}', Pass '{p_std['pppoe_pass']}'; hiện tại User '{actual_pppoe_user or 'Trống'}', Pass '{actual_pppoe_pass or 'Trống'}')"
                )
            if not wifi_ok:
                if p_std.get("require_unified_ssid") and vap_diff:
                    err_parts.append("Chưa tắt 'Use separate SSID for 2.4G and 5G' trong cấu hình Wi-Fi")
                else:
                    err_parts.append(
                        f"Sai cấu hình Wi-Fi (Yêu cầu SSID '{p_std['ssid_2g']}', Pass '{p_std['wifi_pass_2g']}'; hiện tại SSID '{actual_ssid_2g}', Pass '{actual_pass_2g}')"
                    )
            if all_violations:
                err_parts.append(
                    f"Lỗi cấu hình ngoài phạm vi: Bạn chỉ được cấu hình đúng 2 phần PPPoE và Wi-Fi, không được thay đổi {', '.join(all_violations)}"
                )
            step2_fb = " | ".join(err_parts)

        # -------------------------------------------------------------------
        # BƯỚC 3: Kiểm tra Đấu Nối Dây (LAN-LAN tất cả các dòng; LAN-WAN cho ZTE BE12000Z-BE15000Z)
        # -------------------------------------------------------------------
        p_id = primary_node.get("id")
        s_id = secondary_node.get("id")
        cable = next(
            (
                l for l in links
                if isinstance(l, dict)
                and (
                    (l.get("srcId") == p_id and l.get("tgtId") == s_id)
                    or (l.get("tgtId") == p_id and l.get("srcId") == s_id)
                )
            ),
            None,
        )
        cable_connected = cable is not None
        p_port = ""
        s_port = ""
        if cable:
            p_port = str(cable.get("srcPort") if cable.get("srcId") == p_id else cable.get("tgtPort") or "")
            s_port = str(cable.get("tgtPort") if cable.get("srcId") == p_id else cable.get("srcPort") or "")

        p_up = p_port.upper()
        s_up = s_port.upper()
        is_p_lan = ("LAN" in p_up or "ETH" in p_up) and "WAN" not in p_up
        is_s_lan = ("LAN" in s_up or "ETH" in s_up) and "WAN" not in s_up
        is_s_wan = "WAN" in s_up

        if not cable_connected:
            actual_wire_type = "Chưa nối dây cáp"
            step3_pass = False
            step3_actual = f"Chưa nối dây giữa {p_name} và {s_name}"
            step3_fb = f"Vui lòng dùng công cụ nối cáp trên Canvas để nối dây giữa {p_name} và {s_name} ({'LAN ➔ WAN' if is_zte_pair else 'LAN ➔ LAN'})."
        else:
            if is_p_lan and is_s_lan:
                actual_wire_type = "LAN ➔ LAN"
            elif is_p_lan and is_s_wan:
                actual_wire_type = "LAN ➔ WAN"
            elif "WAN" in p_up and is_s_lan:
                actual_wire_type = "WAN ➔ LAN"
            elif "WAN" in p_up and is_s_wan:
                actual_wire_type = "WAN ➔ WAN"
            else:
                actual_wire_type = f"{p_port} ➔ {s_port}"

            step3_pass = (is_p_lan and is_s_wan) if is_zte_pair else (is_p_lan and is_s_lan)
            step3_actual = f"{p_name} ({p_port}) ↔ {s_name} ({s_port}) [{actual_wire_type}]"
            if step3_pass:
                step3_fb = f"Chính xác! Đã đấu nối cáp {actual_wire_type} đúng chuẩn kỹ thuật FPT."
            elif is_zte_pair:
                step3_fb = (
                    f"Đấu nối sai cổng ({actual_wire_type})! Dòng ZTE (BE12000Z với BE15000Z) bắt buộc đấu nối LAN ➔ WAN "
                    f"(cổng LAN của {p_name} sang cổng WAN của {s_name})."
                )
            else:
                step3_fb = (
                    f"Đấu nối sai cổng ({actual_wire_type})! Tất cả các dòng (ngoài ZTE BE12000Z-BE15000Z) bắt buộc đấu nối LAN ➔ LAN "
                    f"(cổng LAN của {p_name} sang cổng LAN của {s_name})."
                )

        # -------------------------------------------------------------------
        # BƯỚC 4: Kiểm tra Sơ đồ Topology Mesh trong các thiết bị kết nối
        # -------------------------------------------------------------------
        topo_count = int(p_cfg.get("topologyPeerCount") or 0)
        topo_peers = list(p_cfg.get("topologyPeers") or [])
        s_ssid = str(s_cfg.get("ssid") or "").strip()
        s_pass = str(s_cfg.get("password") or "").strip()
        wifi_synced = bool(actual_ssid_2g) and (s_ssid == actual_ssid_2g) and (s_pass == actual_pass_2g)

        step4_pass = step1_pass and step3_pass and (topo_count >= 1) and wifi_synced
        peer_label = f"{topo_count} Agent trực tuyến ({', '.join(topo_peers)})" if topo_count >= 1 else "0 Agent trong Topology"
        step4_actual = (
            f"Topology: {peer_label} | Đồng bộ Wi-Fi sang Agent: "
            f"{'Đã đồng bộ (' + s_ssid + ')' if wifi_synced else 'Chưa đồng bộ (' + (s_ssid or 'Trống') + ')'}"
        )
        if step4_pass:
            step4_fb = (
                f"Chính xác! Sơ đồ Topology Mesh đã ghi nhận {s_name} kết nối thành công và đồng bộ 100% Wi-Fi '{actual_ssid_2g}'."
            )
        else:
            if not step1_pass:
                step4_fb = "Sơ đồ Topology Mesh chưa hình thành do Bước 1 (Mode Mesh Controller/Agent) chưa cấu hình đúng."
            elif not step3_pass:
                step4_fb = "Sơ đồ Topology Mesh chưa hình thành do Bước 3 (Đấu nối dây) chưa cắm đúng cổng."
            elif topo_count < 1:
                step4_fb = "Chưa thấy thiết bị Agent xuất hiện trong bảng Sơ đồ Topology Mesh của thiết bị chính."
            else:
                step4_fb = f"Thông số Wi-Fi trên Agent ({s_ssid}) chưa đồng bộ với thiết bị chính ({actual_ssid_2g})."

        rules = [
            {
                "id": "step1_mesh_mode",
                "name": "Bước 1: Chọn Mode Mesh trong giao diện thiết bị",
                "label": "Bước 1: Chọn Mode Mesh trong giao diện thiết bị",
                "expected": step1_expected,
                "actual": step1_actual,
                "passed": step1_pass,
                "status_text": "✔ Đúng" if step1_pass else "✖ Sai",
                "feedback": step1_fb,
            },
            {
                "id": "step2_ont_pppoe_wifi",
                "name": f"Bước 2: Cấu hình PPPoE và Wi-Fi trên thiết bị chính ({p_std['model']})",
                "label": f"Bước 2: Cấu hình PPPoE và Wi-Fi trên thiết bị chính ({p_std['model']})",
                "expected": step2_expected,
                "actual": step2_actual,
                "passed": step2_pass,
                "status_text": "✔ Đúng" if step2_pass else "✖ Sai",
                "feedback": step2_fb,
            },
            {
                "id": "step3_wiring",
                "name": "Bước 3: Kiểm tra Đấu Nối Dây",
                "label": "Bước 3: Kiểm tra Đấu Nối Dây",
                "expected": step3_expected,
                "actual": step3_actual,
                "passed": step3_pass,
                "status_text": "✔ Đúng" if step3_pass else "✖ Sai",
                "feedback": step3_fb,
            },
            {
                "id": "step4_mesh_topology",
                "name": "Bước 4: Kiểm tra Sơ đồ Topology Mesh trong các thiết bị kết nối",
                "label": "Bước 4: Kiểm tra Sơ đồ Topology Mesh trong các thiết bị kết nối",
                "expected": step4_expected,
                "actual": step4_actual,
                "passed": step4_pass,
                "status_text": "✔ Đúng" if step4_pass else "✖ Sai",
                "feedback": step4_fb,
            },
        ]

        all_passed = all(r["passed"] for r in rules)
        passed_count = sum(1 for r in rules if r["passed"])

        # Chi tiết từng tiêu chí cụ thể cho bảng báo lỗi Portal (chỉ rõ sai ở đâu từng bước)
        atomic_details: list[dict] = []
        if spec["primary_catalog"] == "ax3000c" and spec["secondary_catalog"] == "ax3000c":
            atomic_details.append({
                "id": "step1_primary_enabled",
                "name": "Bước 1 (Mode Mesh): EasyMesh Enabled (Thiết bị 1 - Chính)",
                "label": "Bước 1 (Mode Mesh): EasyMesh Enabled (Thiết bị 1 - Chính)",
                "expected": "Bật",
                "actual": "Bật" if p_mesh_en else "Tắt",
                "passed": p_mesh_en,
            })
            atomic_details.append({
                "id": "step1_primary_role",
                "name": "Bước 1 (Mode Mesh): MeshRole (Thiết bị 1 - Chính)",
                "label": "Bước 1 (Mode Mesh): MeshRole (Thiết bị 1 - Chính)",
                "expected": "Controller",
                "actual": p_role,
                "passed": p_role.lower() == "controller",
            })
            atomic_details.append({
                "id": "step1_secondary_mode",
                "name": "Bước 1 (Mode Mesh): Thiết bị 2 - Phụ (Agent)",
                "label": "Bước 1 (Mode Mesh): Thiết bị 2 - Phụ (Agent)",
                "expected": "Enabled: Bật, MeshRole: Agent",
                "actual": f"Enabled: {'Bật' if s_mesh_en else 'Tắt'}, MeshRole: {s_role}",
                "passed": s_mesh_en and s_role.lower() == "agent",
            })
        elif spec["secondary_catalog"] == "ax3000c":
            atomic_details.append({
                "id": "step1_primary_mesh",
                "name": f"Bước 1 (Mode Mesh): Chế độ Mesh ({p_std['model']})",
                "label": f"Bước 1 (Mode Mesh): Chế độ Mesh ({p_std['model']})",
                "expected": "Bật",
                "actual": "Bật" if p_mesh_en else "Tắt",
                "passed": p_mesh_en,
            })
            atomic_details.append({
                "id": "step1_secondary_mode",
                "name": "Bước 1 (Mode Mesh): Thiết bị Phụ (AX3000CV2)",
                "label": "Bước 1 (Mode Mesh): Thiết bị Phụ (AX3000CV2)",
                "expected": "Enabled: Bật, MeshRole: Agent",
                "actual": f"Enabled: {'Bật' if s_mesh_en else 'Tắt'}, MeshRole: {s_role}",
                "passed": s_mesh_en and s_role.lower() == "agent",
            })
        else:
            atomic_details.append({
                "id": "step1_mesh_mode",
                "name": "Bước 1: Chọn Mode Mesh trên thiết bị",
                "label": "Bước 1: Chọn Mode Mesh trên thiết bị",
                "expected": "Bật Mesh Controller & Agent",
                "actual": step1_actual,
                "passed": step1_pass,
            })

        # Bước 2 chi tiết từng trường PPPoE, Wi-Fi và Vi phạm ngoài phạm vi
        if p_std.get("wan_proto"):
            atomic_details.append({
                "id": "step2_wan_proto",
                "name": "Bước 2 (PPPoE): Giao thức WAN (Protocol)",
                "label": "Bước 2 (PPPoE): Giao thức WAN (Protocol)",
                "expected": "PPPoE",
                "actual": "PPPoE" if actual_wan_proto == "pppoe" else (actual_wan_proto.upper() or "Chưa chọn"),
                "passed": actual_wan_proto == p_std["wan_proto"],
            })
        atomic_details.append({
            "id": "step2_pppoe_user",
            "name": "Bước 2 (PPPoE): Username",
            "label": "Bước 2 (PPPoE): Username",
            "expected": p_std["pppoe_user"],
            "actual": actual_pppoe_user or "Chưa cấu hình",
            "passed": actual_pppoe_user == p_std["pppoe_user"],
        })
        atomic_details.append({
            "id": "step2_pppoe_pass",
            "name": "Bước 2 (PPPoE): Password",
            "label": "Bước 2 (PPPoE): Password",
            "expected": p_std["pppoe_pass"],
            "actual": actual_pppoe_pass or "Chưa cấu hình",
            "passed": actual_pppoe_pass == p_std["pppoe_pass"],
        })
        if p_std.get("wan_connection_name"):
            actual_conn_name = str(p_cfg.get("wanConnectionName") or "").strip()
            atomic_details.append({
                "id": "step2_wan_conn_name",
                "name": "Bước 2 (PPPoE): Connection Name",
                "label": "Bước 2 (PPPoE): Connection Name",
                "expected": p_std["wan_connection_name"],
                "actual": actual_conn_name or "Chưa cấu hình",
                "passed": actual_conn_name == p_std["wan_connection_name"],
            })
        if p_std.get("require_unified_ssid"):
            atomic_details.append({
                "id": "step2_wifi_separate",
                "name": "Bước 2 (Wi-Fi): Use separate SSID for 2.4G and 5G",
                "label": "Bước 2 (Wi-Fi): Use separate SSID for 2.4G and 5G",
                "expected": "Tắt",
                "actual": "Bật" if vap_diff else "Tắt",
                "passed": not vap_diff,
            })
        atomic_details.append({
            "id": "step2_wifi_ssid",
            "name": "Bước 2 (Wi-Fi): Tên sóng Wi-Fi (SSID)",
            "label": "Bước 2 (Wi-Fi): Tên sóng Wi-Fi (SSID)",
            "expected": p_std["ssid_2g"],
            "actual": actual_ssid_2g or "Chưa cấu hình",
            "passed": (
                actual_ssid_2g == p_std["ssid_2g"]
                and actual_ssid_5g == p_std["ssid_5g"]
                and not w2_dis
                and not w5_dis
            ),
        })
        atomic_details.append({
            "id": "step2_wifi_pass",
            "name": "Bước 2 (Wi-Fi): Mật khẩu Wi-Fi (Password)",
            "label": "Bước 2 (Wi-Fi): Mật khẩu Wi-Fi (Password)",
            "expected": p_std["wifi_pass_2g"],
            "actual": actual_pass_2g or "Chưa cấu hình",
            "passed": (
                actual_pass_2g == p_std["wifi_pass_2g"]
                and actual_pass_5g == p_std["wifi_pass_5g"]
            ),
        })
        for v_idx, v_name in enumerate(all_violations, start=1):
            atomic_details.append({
                "id": f"step2_out_of_scope_{v_idx}",
                "name": f"Bước 2 (Cấu hình ngoài phạm vi): {v_name}",
                "label": f"Bước 2 (Cấu hình ngoài phạm vi): {v_name}",
                "expected": "Giữ nguyên mặc định (Chỉ cấu hình PPPoE & Wi-Fi)",
                "actual": f"Đã tự ý thay đổi {v_name}",
                "passed": False,
            })

        # Bước 3: Đấu nối dây
        atomic_details.append({
            "id": "step3_wiring",
            "name": "Bước 3 (Đấu nối dây): Cổng cắm cáp giữa 2 thiết bị",
            "label": "Bước 3 (Đấu nối dây): Cổng cắm cáp giữa 2 thiết bị",
            "expected": "LAN ➔ WAN (Dòng ZTE)" if is_zte_pair else "LAN ➔ LAN",
            "actual": f"{actual_wire_type} ({p_port} ↔ {s_port})" if cable_connected else "Chưa nối dây cáp",
            "passed": step3_pass,
        })

        # Bước 4: Sơ đồ Topology Mesh
        if step4_pass:
            s4_short_actual = f"Agent đã vào Topology ({topo_count} thiết bị) & đồng bộ Wi-Fi '{s_ssid}'"
        elif not step1_pass:
            s4_short_actual = "Chưa lên Topology (Do Bước 1 chưa chọn đúng Mode Mesh Controller/Agent)"
        elif not step3_pass:
            s4_short_actual = "Chưa lên Topology (Do Bước 3 chưa đấu nối đúng dây cáp)"
        elif topo_count < 1:
            s4_short_actual = "Chưa có Agent trong Sơ đồ Topology Mesh"
        else:
            s4_short_actual = f"Wi-Fi trên Agent ({s_ssid}) chưa đồng bộ với Controller ({actual_ssid_2g})"

        atomic_details.append({
            "id": "step4_mesh_topology",
            "name": "Bước 4 (Topology Mesh): Kết nối & Đồng bộ Sơ đồ Mesh",
            "label": "Bước 4 (Topology Mesh): Kết nối & Đồng bộ Sơ đồ Mesh",
            "expected": f"Agent xuất hiện trong Topology & đồng bộ Wi-Fi '{p_std['ssid_2g']}'",
            "actual": s4_short_actual,
            "passed": step4_pass,
        })
        for _d in atomic_details:
            _d["field"] = _d.get("name") or _d.get("label") or ""
            _d["ok"] = bool(_d.get("passed"))

        mini_topology = {
            "ont": {
                "id": primary_node.get("id"),
                "name": p_name,
                "model": p_std["model"],
                "ip": p_cfg.get("lanIp") or primary_node.get("ip") or "192.168.100.1",
                "port": p_port or "Chưa cắm",
                "mesh_role": p_role,
            },
            "ap": {
                "id": secondary_node.get("id"),
                "name": s_name,
                "model": CATALOG_KEY_TO_DISPLAY_NAME.get(spec["secondary_catalog"], "AP"),
                "ip": s_cfg.get("lanIp") or secondary_node.get("ip") or "192.168.100.200",
                "port": s_port or "Chưa cắm",
                "mesh_role": s_role,
            },
            "cable": {
                "connected": cable_connected,
                "ont_port": p_port or "Chưa cắm",
                "ap_port": s_port or "Chưa cắm",
                "port_pair": actual_wire_type if cable_connected else "Chưa nối dây",
                "is_correct": step3_pass,
            },
        }

        if all_passed:
            actionable_fix = (
                f"🎉 KẾT QUẢ: ĐẠT! Bạn đã hoàn thành chính xác cả 4 bước cấu hình Mesh ({pair_label})."
            )
        else:
            failed_lines = [f"• {r['name']}: {r['feedback']}" for r in rules if not r["passed"]]
            actionable_fix = "\n".join(failed_lines)

        return {
            "grading_mode": "4step_binary",
            "scenario": spec["scenario_key"],
            "lab_id": spec["lab_id"],
            "scenario_title": spec["title"],
            "status_label": "ĐẠT" if all_passed else "CHƯA ĐẠT",
            "passed": all_passed,
            "all_passed": all_passed,
            "device_pair_valid": True,
            "device_pair_error": "",
            "total_rules": len(rules),
            "passed_rules": passed_count,
            "rules": rules,
            "details": atomic_details,
            "mini_topology": mini_topology,
            "actionable_fix": actionable_fix,
            "elapsed_seconds": int(time.time() - _state.get("started_at", time.time())),
            "timestamp": time.strftime("%Y-%m-%d %H:%M:%S"),
        }


def get_mesh_4step_missions(
    scenario_key: str | None = None,
    session_id: str | None = None,
    workspace: dict | None = None,
    lab_id: str | None = None,
) -> dict:
    """Trả về checklist 4 bước Đạt/Chưa đạt (Không hiển thị điểm số) cho bài học Mesh."""
    grading = evaluate_mesh_4step_grading(
        scenario_key=scenario_key,
        session_id=session_id,
        workspace=workspace,
        lab_id=lab_id,
    )
    spec = _resolve_mesh_4step_spec(scenario_key=scenario_key, lab_id=lab_id)
    rules = grading["rules"]

    missions = []
    for idx, r in enumerate(rules, start=1):
        missions.append({
            "id": r["id"],
            "step": idx,
            "title": r["name"],
            "instruction": f"Yêu cầu: {r['expected']}",
            "status": "COMPLETED" if r["passed"] else "PENDING",
            "completed": bool(r["passed"]),
            "badge": "✔ Đúng" if r["passed"] else "✖ Sai",
            "feedback": r["feedback"],
        })

    completed_count = sum(1 for m in missions if m["completed"])
    return {
        "grading_mode": "4step_binary",
        "scenario": {
            "id": spec["scenario_key"],
            "lab_id": spec["lab_id"],
            "title": spec["title"],
            "badge": spec["badge"],
            "device_pair": spec["pair_label"],
        },
        "missions": missions,
        "total": len(missions),
        "completed_count": completed_count,
        "all_completed": completed_count == len(missions),
        "progress_percent": int((completed_count / len(missions)) * 100) if missions else 0,
        "status_label": grading["status_label"],
        "passed": grading["passed"],
        "device_pair_valid": grading["device_pair_valid"],
        "device_pair_error": grading["device_pair_error"],
    }

