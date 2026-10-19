# -*- coding: utf-8 -*-
"""
Mesh Logic Engine cho Combo ZTE (BE12000Z Controller + BE15000Z Agent).
Mô phỏng logic đấu nối topology, trạng thái cáp, nguồn điện, ghép đôi EasyMesh,
đồng bộ SSID và kiểm tra kết nối đầu cuối (Packet Tracer-lite).
"""

import json
import threading
import time

_LOCK = threading.RLock()

# Trạng thái mô hình đấu nối Mesh ZTE mặc định
_DEFAULT_STATE = {
    "combo": "ZTE_WIFI7",
    "controller_model": "ONT BE12000Z",
    "agent_model": "AP BE15000Z",
    "link_type": "ETH",          # "ETH" (Cáp LAN 2.5GE), "WIFI" (Không dây MLO), "NONE" (Ngắt kết nối)
    "ap_power": True,             # True: Bật nguồn, False: Mất nguồn
    "ap_paired": True,            # Đã bắt cặp Mesh
    "ont_wifi_ssid": "FPT_BE12000_WIFI7",
    "ont_wifi_key": "Fpt@123456",
    "ont_wifi_enabled": True,
    "ap_synced_ssid": "FPT_BE12000_WIFI7",
    "client_connected": True,
    "client_ip": "192.168.1.150",
    "client_hostname": "Smartphone_Client_KTV",
    "wps_active_until": 0,
    "last_failover_time": 0,
    "started_at": time.time(),
}

_state = dict(_DEFAULT_STATE)


def get_state():
    """Lấy snapshot trạng thái mạng topology hiện tại."""
    with _LOCK:
        now = time.time()
        # Tính toán trạng thái suy luận logic (Derived States)
        is_ap_online = _state["ap_power"] and (_state["link_type"] in ("ETH", "WIFI")) and _state["ap_paired"]
        
        # Ping Gateway & Internet từ Client
        if not is_ap_online:
            client_ping_gw = False
            client_internet = False
            client_ip_current = "169.254.10.15"  # APIPA nếu mất DHCP từ Mesh
        else:
            client_ping_gw = True
            client_internet = True
            client_ip_current = _state["client_ip"]

        if not _state["ap_power"]:
            mesh_status = "POWER_OFF"
        elif _state["link_type"] == "NONE" or not _state["ap_paired"]:
            mesh_status = "OFFLINE"
        elif _state["link_type"] == "ETH":
            mesh_status = "ONLINE_ETH"
        elif _state["link_type"] == "WIFI":
            mesh_status = "ONLINE_WIFI"
        else:
            mesh_status = "OFFLINE"

        latency_ms = 1 if _state["link_type"] == "ETH" else (4 if _state["link_type"] == "WIFI" else 999)
        bandwidth_mbps = 2500 if _state["link_type"] == "ETH" else (1200 if _state["link_type"] == "WIFI" else 0)

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
            "elapsed_seconds": int(now - _state.get("started_at", now)),
        }


def set_link_type(link_type):
    """
    Thay đổi kiểu kết nối Backhaul:
    - "ETH": Cắm cáp LAN 2.5GE
    - "WIFI": Rút cáp, chuyển sang kết nối không dây EasyMesh (Slide 34)
    - "NONE" / "DISCONNECTED": Ngắt toàn bộ liên kết (mất kết nối vật lý)
    """
    with _LOCK:
        if link_type in ("DISCONNECTED", "CUT", "NONE"):
            link_type = "NONE"
        elif link_type not in ("ETH", "WIFI"):
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


def reset_lab():
    """Khởi tạo lại trạng thái bài lab về ban đầu."""
    global _state
    with _LOCK:
        _state = dict(_DEFAULT_STATE)
        _state["started_at"] = time.time()
        _sync_to_be12000()
        return get_state()


def _sync_to_be12000():
    """Cập nhật dữ liệu danh sách node slave vào BE12000 (để mmTopology.html hiển thị động)."""
    try:
        import simulators.sim_be12000.src.server as be12000_srv
        is_online = _state["ap_power"] and (_state["link_type"] in ("ETH", "WIFI")) and _state["ap_paired"]
        
        if is_online:
            slave_node = {
                "DeviceName": "BE15000Z",
                "SoftwareVer": "V3.0.0P2_VN2-o",
                "MacAddr": "aa:bb:cc:00:00:15",
                "IpAddr": "192.168.1.100",
                "AccessType": _state["link_type"],
                "LinkSpeed": "2500" if _state["link_type"] == "ETH" else "1200",
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
    1. Đấu nối Backhaul (Cáp LAN 2.5GE hoặc Wi-Fi Backhaul) (25đ)
    2. Nguồn điện AP BE15000Z bật và ổn định (15đ)
    3. Ghép cặp EasyMesh thành công, Node xuất hiện trên mmTopology (25đ)
    4. Đồng bộ SSID Wi-Fi giữa Controller và Agent (20đ)
    5. Thiết bị Client nhận IP DHCP và ping thông Internet (15đ)
    """
    with _LOCK:
        rules = []
        # Tiêu chí 1: Đấu nối Backhaul
        c1 = _state["link_type"] in ("ETH", "WIFI")
        rules.append({
            "id": "mesh_link",
            "name": "Đấu nối liên kết Backhaul (Ethernet / Wireless)",
            "expected": "Đã kết nối (ETH 2.5GE hoặc Wi-Fi 5G/6G)",
            "actual": f"Kiểu liên kết: {_state['link_type']}",
            "passed": c1,
            "points": 25 if c1 else 0,
            "max_points": 25
        })

        # Tiêu chí 2: Nguồn điện AP
        c2 = _state["ap_power"]
        rules.append({
            "id": "ap_power",
            "name": "Trạng thái nguồn AP BE15000Z",
            "expected": "Bật nguồn (Power ON)",
            "actual": "Đang Bật" if c2 else "Đang Tắt nguồn",
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
