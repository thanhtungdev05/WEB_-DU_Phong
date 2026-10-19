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
    "ont_wifi_enabled": True,
    "ap_synced_ssid": "FPT_BE12000_WIFI7",
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


def get_state():
    """Lấy snapshot trạng thái mạng topology hiện tại."""
    with _LOCK:
        now = time.time()
        # Tính toán trạng thái suy luận logic (Derived States)
        is_ap_online = _state["ont_power"] and _state["ap_power"] and (_state["link_type"] in ("ETH", "WIFI")) and _state["ap_paired"]

        # Ping Gateway & Internet từ Client
        if not is_ap_online:
            client_ping_gw = False
            client_internet = False
            client_ip_current = "169.254.10.15"  # APIPA nếu mất DHCP từ Mesh
        else:
            client_ping_gw = True
            client_internet = True
            client_ip_current = _state["client_ip"]

        if not _state["ont_power"]:
            mesh_status = "ONT_POWER_OFF"
        elif not _state["ap_power"]:
            mesh_status = "POWER_OFF"
        elif _state["link_type"] == "NONE" or not _state["ap_paired"]:
            mesh_status = "OFFLINE"
        elif _state["link_type"] == "ETH":
            mesh_status = "ONLINE_ETH"
        elif _state["link_type"] == "WIFI":
            mesh_status = "ONLINE_WIFI"
        else:
            mesh_status = "OFFLINE"

        # Đánh giá tốc độ và độ trễ dựa trên cổng cắm
        ont_port_info = ONT_PORTS.get(_state["ont_port"], ONT_PORTS["NONE"])
        ap_port_info = AP_PORTS.get(_state["ap_port"], AP_PORTS["NONE"])

        is_optimal_wiring = False
        port_warning = None

        if _state["link_type"] == "ETH" and _state["ap_power"] and _state["ont_power"]:
            # Đàm phán tốc độ cổng vật lý (Link Negotiation)
            negotiated_speed = min(ont_port_info["speed_mbps"], ap_port_info["speed_mbps"])
            if _state["cable_type"] == "CAT5E" and negotiated_speed > 1000:
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
        elif _state["link_type"] == "WIFI" and _state["ap_power"] and _state["ont_power"]:
            bandwidth_mbps = 1200  # Wi-Fi 7 MLO Wireless Backhaul
            latency_ms = 4
            is_optimal_wiring = True
        else:
            bandwidth_mbps = 0
            latency_ms = 999

        return {
            **_state,
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
            "elapsed_seconds": int(now - _state.get("started_at", now)),
        }


def connect_ports(ont_port, ap_port, cable_type="CAT6A"):
    """
    Mô phỏng đấu nối cổng vật lý kiểu Cisco Packet Tracer:
    - ont_port: "LAN1_10GE", "LAN2_1GE", "LAN3_1GE", "LAN4_1GE", "NONE"
    - ap_port: "WAN_25GE", "LAN_1GE", "NONE"
    - cable_type: "CAT6A", "CAT5E", "NONE"
    """
    with _LOCK:
        if ont_port not in ONT_PORTS:
            ont_port = "LAN1_10GE"
        if ap_port not in AP_PORTS:
            ap_port = "WAN_25GE"

        _state["ont_port"] = ont_port
        _state["ap_port"] = ap_port
        _state["cable_type"] = cable_type

        if ont_port == "NONE" or ap_port == "NONE" or cable_type == "NONE":
            # Rút cáp LAN -> Chuyển sang Wi-Fi Mesh MLO (Slide 34)
            _state["link_type"] = "WIFI"
        else:
            _state["link_type"] = "ETH"

        _state["last_failover_time"] = time.time()
        _sync_to_be12000()
        return get_state()


def set_link_type(link_type):
    """
    Thay đổi kiểu kết nối Backhaul:
    - "ETH": Cắm cáp LAN tối ưu (LAN1 10GE -> WAN 2.5GE)
    - "WIFI": Rút cáp, chuyển sang kết nối không dây EasyMesh (Slide 34)
    - "NONE" / "DISCONNECTED": Ngắt toàn bộ liên kết (mất kết nối vật lý)
    """
    with _LOCK:
        if link_type in ("DISCONNECTED", "CUT", "NONE"):
            link_type = "NONE"
            _state["ont_port"] = "NONE"
            _state["ap_port"] = "NONE"
            _state["cable_type"] = "NONE"
        elif link_type == "WIFI":
            _state["ont_port"] = "NONE"
            _state["ap_port"] = "NONE"
            _state["cable_type"] = "NONE"
        elif link_type == "ETH":
            if _state["ont_port"] == "NONE":
                _state["ont_port"] = "LAN1_10GE"
            if _state["ap_port"] == "NONE":
                _state["ap_port"] = "WAN_25GE"
            _state["cable_type"] = "CAT6A"
        else:
            link_type = "NONE"

        _state["link_type"] = link_type
        _state["last_failover_time"] = time.time()
        _sync_to_be12000()
        return get_state()


def set_ap_power(power_state):
    """Bật / Tắt nguồn AP BE15000Z."""
    with _LOCK:
        _state["ap_power"] = bool(power_state)
        _sync_to_be12000()
        return get_state()


def set_ont_power(power_state):
    """Bật / Tắt nguồn ONT BE12000Z."""
    with _LOCK:
        _state["ont_power"] = bool(power_state)
        _sync_to_be12000()
        return get_state()


def trigger_wps():
    """Mô phỏng bấm nút cứng WPS/Mesh trên thân máy để ghép cặp."""
    with _LOCK:
        now = time.time()
        _state["wps_active_until"] = now + 120  # 2 phút pairing window
        _state["ap_paired"] = True
        _sync_to_be12000()
        return get_state()


def update_ont_wifi(ssid, key=None):
    """Đồng bộ SSID & Mật khẩu từ Controller BE12000Z sang Agent BE15000Z."""
    with _LOCK:
        if ssid:
            _state["ont_wifi_ssid"] = str(ssid).strip()
            _state["ap_synced_ssid"] = str(ssid).strip()
        if key:
            _state["ont_wifi_key"] = str(key).strip()
        _sync_to_be12000()
        return get_state()


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


def reset_lab():
    """Khởi tạo lại trạng thái bài lab về ban đầu."""
    global _state
    with _LOCK:
        _state = dict(_DEFAULT_STATE)
        _state["started_at"] = time.time()
        _sync_to_be12000()
        return get_state()


def get_missions():
    """
    Lấy danh sách 6 nhiệm vụ đào tạo kỹ thuật viên chuẩn Cisco Packet Tracer:
    1. Cấp nguồn điện
    2. Đấu nối cáp cổng vật lý tối ưu
    3. Ghép cặp EasyMesh
    4. Kiểm tra sơ đồ Topology
    5. Đồng bộ sóng Wi-Fi SSID
    6. Chẩn đoán kết nối đầu cuối (Ping/Speedtest)
    """
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


def _sync_to_be12000():
    """Cập nhật dữ liệu danh sách node slave vào BE12000 (để mmTopology.html hiển thị động)."""
    try:
        import simulators.sim_be12000.src.server as be12000_srv
        is_online = _state["ont_power"] and _state["ap_power"] and (_state["link_type"] in ("ETH", "WIFI")) and _state["ap_paired"]

        ont_port_info = ONT_PORTS.get(_state["ont_port"], ONT_PORTS["NONE"])
        ap_port_info = AP_PORTS.get(_state["ap_port"], AP_PORTS["NONE"])
        negotiated_speed = 2500
        if _state["link_type"] == "ETH":
            negotiated_speed = min(ont_port_info["speed_mbps"], ap_port_info["speed_mbps"])
            if ont_port_info["id"] == "LAN1_10GE" and ap_port_info["id"] == "WAN_25GE":
                negotiated_speed = 2500
            elif negotiated_speed > 1000 and _state["cable_type"] == "CAT5E":
                negotiated_speed = 1000
        elif _state["link_type"] == "WIFI":
            negotiated_speed = 1200

        if is_online:
            slave_node = {
                "DeviceName": "BE15000Z",
                "SoftwareVer": "V3.0.0P2_VN2-o",
                "MacAddr": "aa:bb:cc:00:00:15",
                "IpAddr": "192.168.1.100",
                "AccessType": _state["link_type"],
                "LinkSpeed": str(negotiated_speed),
                "instID": "MESH.AGENT1",
                "BhStaRssi": "0" if _state["link_type"] == "ETH" else "-52",
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
                "HostName": _state["client_hostname"],
                "MacAddr": "34:e1:2d:88:99:aa",
                "IpAddr": _state["client_ip"],
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

        if hasattr(be12000_srv, "cap_nhat_topology_mesh"):
            be12000_srv.cap_nhat_topology_mesh(slave_list, client_list)
    except Exception:
        pass


def evaluate_grading():
    """
    Chấm điểm bài thực hành đấu nối Mesh ZTE theo tiêu chuẩn đào tạo FPT Telecom:
    1. Đấu nối Backhaul tối ưu (LAN1 10GE -> WAN 2.5GE hoặc Wi-Fi MLO) (25đ)
    2. Nguồn điện 2 thiết bị ổn định (15đ)
    3. Ghép cặp EasyMesh thành công, Node xuất hiện trên mmTopology (25đ)
    4. Đồng bộ SSID Wi-Fi giữa Controller và Agent (20đ)
    5. Thiết bị Client nhận IP DHCP và ping thông Internet (15đ)
    """
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
