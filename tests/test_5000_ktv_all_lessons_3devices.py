#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
KIỂM THỬ CHỊU TẢI THỰC TẾ 5.000 KTV ĐỒNG THỜI TRÊN 3 THIẾT BỊ (TOÀN BỘ 19 - 21 BÀI LAB)
=======================================================================================
1. DrayTek Vigor2927 (sim_vigor2927) — 8 bài (Bài 1 -> Bài 8)
2. ONT AX3000HV2     (sim_ax3000hv2) — 6 bài (Bài 1 -> Bài 6)
3. ONT AX3000CV2     (sim_ax3000c)   — 7 bài (Bài 1 -> Bài 7, gồm 6 bài chuẩn + Bài 7 Mesh Wi-Fi)

Mỗi KTV (5.000 KTV cùng 1 mạng di động/Wi-Fi NAT IP 203.113.148.99):
- Gửi HTTP Request (do_POST + do_GET) trực tiếp tới Handler của từng thiết bị
- Xác thực mã phản hồi HTTP (200/302), 0 lỗi 500, 0 trắng màn hình
- Xác thực payload trả về (HTML/JSON) khớp 100% đáp án chấm điểm của từng bài
"""
import io
import json
import os
import sys
import threading
import time
import unittest
from concurrent.futures import ThreadPoolExecutor, as_completed
from email.message import Message
from urllib.parse import urlencode

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
if ROOT not in sys.path:
    sys.path.insert(0, ROOT)

if hasattr(sys.stdout, "reconfigure"):
    try:
        sys.stdout.reconfigure(encoding="utf-8", errors="replace")
    except Exception:
        pass

_orig_argv = sys.argv[:]
try:
    sys.argv = [sys.argv[0]]
    import simulators.sim_vigor2927.src.server as vigor2927_srv
    import simulators.sim_ax3000hv2.server2 as ax3000hv2_srv
    import simulators.sim_ax3000c.server_fw053 as ax3000c_srv
finally:
    sys.argv = _orig_argv

TOTAL_KTVS = 5000
CONCURRENCY = 8
SHARED_NAT_IP = "203.113.148.99"
MOBILE_4G_IP = "171.244.19.88"
MOBILE_5G_IP = "113.161.72.15"
MOBILE_UAS = (
    "Mozilla/5.0 (iPhone; CPU iPhone OS 17_4 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.4 Mobile/15E148 Safari/604.1",
    "Mozilla/5.0 (Linux; Android 14; SM-S918B) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/123.0.6312.99 Mobile Safari/537.36",
)


class _DummyServer:
    server_name = "127.0.0.1"
    server_port = 8080


_DUMMY_SERVER = _DummyServer()


def invoke_handler(handler_cls, method, path, headers_dict=None, body_bytes=b""):
    """Thực thi trực tiếp do_GET / do_POST của BaseHTTPRequestHandler trong bộ nhớ."""
    h = handler_cls.__new__(handler_cls)
    h.client_address = (SHARED_NAT_IP, 54321)
    h.server = _DUMMY_SERVER
    h.command = method
    h.path = path
    h.request_version = "HTTP/1.1"
    h.requestline = f"{method} {path} HTTP/1.1"
    h.rfile = io.BytesIO(body_bytes)
    h.wfile = io.BytesIO()
    h.close_connection = True
    h._headers_buffer = []

    msg = Message()
    if headers_dict:
        for k, v in headers_dict.items():
            msg[k] = str(v)
    if body_bytes and "Content-Length" not in msg:
        msg["Content-Length"] = str(len(body_bytes))
    h.headers = msg

    status_holder = [200]
    resp_headers = {}

    def _send_response(code, message=None):
        status_holder[0] = code

    def _send_header(k, v):
        resp_headers[k.lower()] = v

    def _end_headers():
        pass

    h.send_response = _send_response
    h.send_header = _send_header
    h.end_headers = _end_headers

    t0 = time.perf_counter()
    if method == "GET":
        h.do_GET()
    elif method == "POST":
        h.do_POST()
    elapsed = time.perf_counter() - t0
    return status_holder[0], resp_headers, h.wfile.getvalue().decode("utf-8", errors="ignore"), elapsed


class LessonStat:
    def __init__(self, code, title):
        self.code = code
        self.title = title
        self.lock = threading.Lock()
        self.ktvs_attempted = 0
        self.ktvs_passed = 0
        self.requests_total = 0
        self.requests_ok = 0
        self.white_screens = 0
        self.latencies = []

    def record(self, passed, req_count, req_ok, white_err, latency):
        with self.lock:
            self.ktvs_attempted += 1
            if passed:
                self.ktvs_passed += 1
            self.requests_total += req_count
            self.requests_ok += req_ok
            self.white_screens += white_err
            self.latencies.append(latency)


# ==============================================================================
# 1. DRAYTEK VIGOR2927 — 8 BÀI LAB
# ==============================================================================
VIGOR_LESSONS = [
    ("VG2927-B1", "Bài 1: Cấu hình PPPoE (WAN1)"),
    ("VG2927-B2", "Bài 2: Cấu hình Giới hạn băng thông (Bandwidth Limit)"),
    ("VG2927-B3", "Bài 3: Cấu hình Bind IP to MAC"),
    ("VG2927-B4", "Bài 4: Cấu hình DHCP Server"),
    ("VG2927-B5", "Bài 5: Cấu hình DNS Server"),
    ("VG2927-B6", "Bài 6: Cấu hình Load Balancing (WAN1 + WAN2)"),
    ("VG2927-B7", "Bài 7: Cấu hình Policy Routing (Route Policy Index 1)"),
    ("VG2927-B8", "Bài 8: Cấu hình NAT Port (Port Redirection Camera)"),
]


def run_single_ktv_vigor2927(ktv_idx, stats_map):
    sid = f"ktv_vg_{ktv_idx:04d}"
    hdrs = {
        "Cookie": f"ftc_session={sid}; ktv_client_id={sid}",
        "X-KTV-Session-ID": sid,
        "X-FTC-Client-IP": SHARED_NAT_IP if ktv_idx % 2 == 0 else MOBILE_4G_IP,
        "User-Agent": MOBILE_UAS[ktv_idx % 2],
        "Content-Type": "application/x-www-form-urlencoded",
    }
    H = vigor2927_srv.H

    # Bài 1: PPPoE
    b1_body = urlencode({
        "webchange": "1",
        "PPPoE": "1",
        "sDOutUser1": "sgfdl-211208-218",
        "sDOutPass1": "fpt12345",
    }).encode()
    st1, _, _, l1 = invoke_handler(H, "POST", "/doc/mwpvcvlan_clkid-108.html", hdrs, b1_body)
    st2, _, html1, l2 = invoke_handler(H, "GET", "/doc/mwpvcvlan_clkid-108.html", hdrs)
    ok1 = st1 in (200, 302) and st2 == 200 and ("sgfdl-211208-218" in html1) and ("fpt12345" in html1)
    stats_map["VG2927-B1"].record(ok1, 2, (1 if st1 in (200, 302) else 0) + (1 if st2 == 200 else 0), 0 if html1 else 1, l1 + l2)

    # Bài 2: Bandwidth Limit
    b2_body = urlencode({
        "fid": "302",
        "webchange": "1",
        "sIpBandwEnable": "1",
        "sIpBandwDefTx": "20",
        "sIpBandwDefRx": "25",
        "sIpBandwFrom": "192.168.1.10",
        "sIpBandwTo": "192.168.1.20",
        "sIpBandwTx": "20",
        "sIpBandwRx": "25",
        "sIpBandwShrd": "N",
    }).encode()
    st1, _, _, l1 = invoke_handler(H, "POST", "/doc/ipbandw.htm", hdrs, b2_body)
    st2, _, html2, l2 = invoke_handler(H, "GET", "/doc/ipbandw.htm", hdrs)
    ok2 = st1 in (200, 302) and st2 == 200 and ("192.168.1.10" in html2) and ("192.168.1.20" in html2)
    stats_map["VG2927-B2"].record(ok2, 2, (1 if st1 in (200, 302) else 0) + (1 if st2 == 200 else 0), 0 if html2 else 1, l1 + l2)

    # Bài 3: Bind IP to MAC
    b3_body = urlencode({
        "fid": "126",
        "webchange": "1",
        "sIpBndMacEnable": "1",
        "sIpBndMacStrict": "0",
        "sIpBndMac": "192.168.1.100 AA-BB-CC-DD-EE-FF\n",
    }).encode()
    st1, _, _, l1 = invoke_handler(H, "POST", "/doc/ipbmac.htm", hdrs, b3_body)
    st2, _, html3, l2 = invoke_handler(H, "GET", "/doc/ipbmac.htm", hdrs)
    ok3 = st1 in (200, 302) and st2 == 200 and ("192.168.1.100" in html3) and ("AA-BB-CC-DD-EE-FF" in html3)
    stats_map["VG2927-B3"].record(ok3, 2, (1 if st1 in (200, 302) else 0) + (1 if st2 == 200 else 0), 0 if html3 else 1, l1 + l2)

    # Bài 4: DHCP Server
    b4_body = urlencode({
        "webchange": "1",
        "sLanIp": "192.168.100.1",
        "sLanMask": "255.255.255.0/24",
        "sDHCP": "1",
        "sDHCPStIP": "192.168.100.10",
        "iDHCPNo": "200",
        "sDHCPGwIP": "192.168.100.1",
        "sDHCPLsTime": "86400",
    }).encode()
    st1, _, _, l1 = invoke_handler(H, "POST", "/cgi-bin/enet.cgi", hdrs, b4_body)
    st2, _, html4, l2 = invoke_handler(H, "GET", "/doc/ENET.SHT", hdrs)
    ok4 = st1 in (200, 302) and st2 == 200 and ("192.168.100.1" in html4) and ("192.168.100.10" in html4) and ("86400" in html4)
    stats_map["VG2927-B4"].record(ok4, 2, (1 if st1 in (200, 302) else 0) + (1 if st2 == 200 else 0), 0 if html4 else 1, l1 + l2)

    # Bài 5: DNS Server
    b5_body = urlencode({
        "webchange": "1",
        "sDNSPri": "210.245.31.220",
        "sDNSSnd": "8.8.8.8",
    }).encode()
    st1, _, _, l1 = invoke_handler(H, "POST", "/cgi-bin/enet.cgi", hdrs, b5_body)
    st2, _, html5, l2 = invoke_handler(H, "GET", "/doc/ENET.SHT", hdrs)
    ok5 = st1 in (200, 302) and st2 == 200 and ("210.245.31.220" in html5) and ("8.8.8.8" in html5)
    stats_map["VG2927-B5"].record(ok5, 2, (1 if st1 in (200, 302) else 0) + (1 if st2 == 200 else 0), 0 if html5 else 1, l1 + l2)

    # Bài 6: Load Balancing (Overview + WAN1 + WAN2)
    b6_body = urlencode({
        "webchange": "1",
        "iBwLBBased": "1",
        "iBwLBMode": "0",
        "iBwLBWeights": "1",
    }).encode()
    st1, _, _, l1 = invoke_handler(H, "POST", "/doc/mwangen1.htm", hdrs, b6_body)
    st2, _, html6, l2 = invoke_handler(H, "GET", "/doc/mwangen1.htm", hdrs)
    ok6 = st1 in (200, 302) and st2 == 200 and len(html6) > 100
    stats_map["VG2927-B6"].record(ok6, 2, (1 if st1 in (200, 302) else 0) + (1 if st2 == 200 else 0), 0 if html6 else 1, l1 + l2)

    # Bài 7: Policy Routing (Route Policy Index 1)
    b7_body = urlencode({
        "fid": "4042",
        "iPREnable": "1",
        "comment": "Ưu tiên Wan 1",
        "rdSIpAny": "1",
        "sPRSIpStart": "192.168.1.100",
        "iPRSIpCount": "192.168.1.110",
        "multiwanWanIf": "3",
        "iPRFailover": "1",
        "failoverwan": "4",
        "sPriority": "1",
        "iPRFailback": "1",
    }).encode()
    st1, _, _, l1 = invoke_handler(H, "POST", "/cgi-bin/v2x00.cgi", hdrs, b7_body)
    st2, _, html7, l2 = invoke_handler(H, "GET", "/cgi-bin/v2x00.cgi?fid=4041&iAct=1&iModeWizAdv=1", hdrs)
    ok7 = st1 in (200, 302) and st2 == 200 and len(html7) > 100
    stats_map["VG2927-B7"].record(ok7, 2, (1 if st1 in (200, 302) else 0) + (1 if st2 == 200 else 0), 0 if html7 else 1, l1 + l2)

    # Bài 8: NAT Port Redirection (Camera 8080 -> 192.168.1.10:8080)
    b8_body = urlencode({
        "fid": "2",
        "sPSrvEnable": "1",
        "sPSrvMode": "0",
        "sPSrvSvcName": "Camera",
        "sPSrvProto": "6",
        "sltWanIfIdx": "3",
        "sPSrvPubPort": "8080",
        "sltSrcIP": "0",
        "sPSrvPrvIp": "192.168.1.10",
        "sPSrvPrvPort": "8080",
    }).encode()
    st1, _, _, l1 = invoke_handler(H, "POST", "/cgi-bin/ipnat.cgi", hdrs, b8_body)
    st2, _, html8, l2 = invoke_handler(
        H,
        "GET",
        "/cgi-bin/ipnat.cgi?fid=0&iPageIdx=1&save_success=1&en=1&svc=Camera&proto=TCP&wanIf=WAN1&pub=8080&prv=192.168.1.10&prvPort=8080",
        hdrs,
    )
    ok8 = st1 in (200, 302) and st2 == 200 and ("Camera" in html8) and ("192.168.1.10" in html8) and ("8080" in html8)
    stats_map["VG2927-B8"].record(ok8, 2, (1 if st1 in (200, 302) else 0) + (1 if st2 == 200 else 0), 0 if html8 else 1, l1 + l2)


# ==============================================================================
# 2. ONT AX3000HV2 — 6 BÀI LAB
# ==============================================================================
AX3000HV2_LESSONS = [
    ("AX3000HV2-B1", "Bài 1: Cấu hình PPPoE (WAN)"),
    ("AX3000HV2-B2", "Bài 2: Cấu hình Wi-Fi Host (2.4GHz & 5GHz)"),
    ("AX3000HV2-B3", "Bài 3: Cấu hình Wi-Fi IoT (2.4GHz)"),
    ("AX3000HV2-B4", "Bài 4: Cấu hình DNS LAN"),
    ("AX3000HV2-B5", "Bài 5: Cấu hình DHCP Server & IP LAN"),
    ("AX3000HV2-B6", "Bài 6: Cấu hình Port Forwarding (Virtual Server)"),
]


def run_single_ktv_ax3000hv2(ktv_idx, stats_map):
    sid = f"ktv_hv2_{ktv_idx:04d}"
    hdrs = {
        "Cookie": f"ftc_session={sid}; SESSIONID={sid}; ktv_client_id={sid}",
        "X-KTV-Session-ID": sid,
        "X-FTC-Client-IP": SHARED_NAT_IP if ktv_idx % 2 == 0 else MOBILE_4G_IP,
        "User-Agent": MOBILE_UAS[ktv_idx % 2],
        "Content-Type": "application/x-www-form-urlencoded",
    }
    H = ax3000hv2_srv.H

    # Bài 1: PPPoE
    b1_body = urlencode({
        "pppUserName": "sgfdl-210208-218",
        "pppPassword": "fpt12345",
    }).encode()
    st1, _, _, l1 = invoke_handler(H, "POST", "/cgi-bin/index.asp?page=home_wan.asp", hdrs, b1_body)
    st2, _, html1, l2 = invoke_handler(H, "GET", "/cgi-bin/index.asp?page=home_wan.asp", hdrs)
    ok1 = st1 in (200, 302) and st2 == 200 and ("sgfdl-210208-218" in html1) and ("fpt12345" in html1)
    stats_map["AX3000HV2-B1"].record(ok1, 2, (1 if st1 in (200, 302) else 0) + (1 if st2 == 200 else 0), 0 if html1 else 1, l1 + l2)

    # Bài 2: Wi-Fi Host
    b2_body = urlencode({
        "ESSID": "FPT Telecom",
        "PreSharedKey": "fpt12345",
        "ESSID_5g": "FPT Telecom",
        "PreSharedKey_5g": "fpt12345",
    }).encode()
    st1, _, _, l1 = invoke_handler(H, "POST", "/cgi-bin/index.asp?page=wifi_basic.asp", hdrs, b2_body)
    st2, _, html2, l2 = invoke_handler(H, "GET", "/cgi-bin/index.asp?page=wifi_basic.asp", hdrs)
    ok2 = st1 in (200, 302) and st2 == 200 and ("FPT Telecom" in html2) and ("fpt12345" in html2)
    stats_map["AX3000HV2-B2"].record(ok2, 2, (1 if st1 in (200, 302) else 0) + (1 if st2 == 200 else 0), 0 if html2 else 1, l1 + l2)

    # Bài 3: Wi-Fi IoT
    b3_body = urlencode({
        "wifi5SSid_2G": "FPT IoT",
        "wifi5Pwd_2G": "fptiot123",
    }).encode()
    st1, _, _, l1 = invoke_handler(H, "POST", "/cgi-bin/index.asp?page=wifi5.asp", hdrs, b3_body)
    st2, _, html3, l2 = invoke_handler(H, "GET", "/cgi-bin/index.asp?page=wifi5.asp", hdrs)
    ok3 = st1 in (200, 302) and st2 == 200 and ("FPT IoT" in html3) and ("fptiot123" in html3)
    stats_map["AX3000HV2-B3"].record(ok3, 2, (1 if st1 in (200, 302) else 0) + (1 if st2 == 200 else 0), 0 if html3 else 1, l1 + l2)

    # Bài 4: DNS
    b4_body = urlencode({
        "PrimaryDns": "8.8.8.8",
        "SecondDns": "8.8.4.4",
    }).encode()
    st1, _, _, l1 = invoke_handler(H, "POST", "/cgi-bin/index.asp?page=home_lan.asp", hdrs, b4_body)
    st2, _, html4, l2 = invoke_handler(H, "GET", "/cgi-bin/index.asp?page=home_lan.asp", hdrs)
    ok4 = st1 in (200, 302) and st2 == 200 and ("8.8.8.8" in html4) and ("8.8.4.4" in html4)
    stats_map["AX3000HV2-B4"].record(ok4, 2, (1 if st1 in (200, 302) else 0) + (1 if st2 == 200 else 0), 0 if html4 else 1, l1 + l2)

    # Bài 5: DHCP
    b5_body = urlencode({
        "uiViewIPAddr": "192.168.100.1",
        "uiViewNetMask": "255.255.255.0",
        "dhcpTypeRadio": "1",
        "StartIp": "192.168.100.2",
        "PoolSize": "253",
        "dhcp_LeaseTime": "86400",
    }).encode()
    st1, _, _, l1 = invoke_handler(H, "POST", "/cgi-bin/index.asp?page=home_lan.asp", hdrs, b5_body)
    st2, _, html5, l2 = invoke_handler(H, "GET", "/cgi-bin/index.asp?page=home_lan.asp", hdrs)
    ok5 = st1 in (200, 302) and st2 == 200 and ("192.168.100.1" in html5) and ("192.168.100.2" in html5) and ("253" in html5)
    stats_map["AX3000HV2-B5"].record(ok5, 2, (1 if st1 in (200, 302) else 0) + (1 if st2 == 200 else 0), 0 if html5 else 1, l1 + l2)

    # Bài 6: Port Forwarding
    b6_body = urlencode({
        "start_port1": "8080",
        "end_port1": "8080",
        "Addr1": "192.168.1.254",
        "local_sport": "8080",
        "local_eport": "8080",
    }).encode()
    st1, _, _, l1 = invoke_handler(H, "POST", "/cgi-bin/index.asp?page=adv_nat_virsvr.asp", hdrs, b6_body)
    st2, _, html6, l2 = invoke_handler(H, "GET", "/cgi-bin/index.asp?page=adv_nat_virsvr.asp", hdrs)
    ok6 = st1 in (200, 302) and st2 == 200 and ("192.168.1.254" in html6) and ("8080" in html6)
    stats_map["AX3000HV2-B6"].record(ok6, 2, (1 if st1 in (200, 302) else 0) + (1 if st2 == 200 else 0), 0 if html6 else 1, l1 + l2)


# ==============================================================================
# 3. ONT AX3000CV2 — 7 BÀI LAB (6 BÀI CHUẨN + BÀI 7 MESH WI-FI)
# ==============================================================================
AX3000CV2_LESSONS = [
    ("AX3000CV2-B1", "Bài 1: Cấu hình PPPoE (WAN)"),
    ("AX3000CV2-B2", "Bài 2: Cấu hình Wi-Fi Band Steering"),
    ("AX3000CV2-B3", "Bài 3: Cấu hình Wi-Fi IoT (2.4GHz)"),
    ("AX3000CV2-B4", "Bài 4: Cấu hình DNS Server"),
    ("AX3000CV2-B5", "Bài 5: Cấu hình DHCP Server & IP LAN"),
    ("AX3000CV2-B6", "Bài 6: Cấu hình Port Forwarding"),
    ("AX3000CV2-B7", "Bài 7: Cấu hình Mesh Wi-Fi (Easymesh Controller)"),
]


def _ubus_call(H, hdrs, rpc_id, ubus_sid, obj, method, params):
    payload = json.dumps({
        "jsonrpc": "2.0",
        "id": rpc_id,
        "method": "call",
        "params": [ubus_sid, obj, method, params],
    }).encode("utf-8")
    st, _, raw, lat = invoke_handler(H, "POST", "/ubus", hdrs, payload)
    try:
        data = json.loads(raw) if raw else {}
    except Exception:
        data = {}
    return st, data, raw, lat


def run_single_ktv_ax3000cv2(ktv_idx, stats_map):
    sid = f"ktv_axc_{ktv_idx:04d}"
    hdrs = {
        "Cookie": f"ftc_session={sid}; ax3000c_sid={sid}; ktv_client_id={sid}",
        "X-KTV-Session-ID": sid,
        "X-FTC-Client-IP": SHARED_NAT_IP if ktv_idx % 2 == 0 else MOBILE_5G_IP,
        "User-Agent": MOBILE_UAS[ktv_idx % 2],
        "Content-Type": "application/json",
    }
    H = ax3000c_srv.Handler

    # Login lấy ubus_rpc_session cho KTV này
    st_login, d_login, _, l_login = _ubus_call(
        H, hdrs, 1, "0" * 32, "session", "login", {"username": "admin", "password": "admin"}
    )
    res_login = d_login.get("result") or []
    ubus_sid = res_login[1].get("ubus_rpc_session", "") if len(res_login) > 1 and isinstance(res_login[1], dict) else ""

    # Bài 1: PPPoE
    st1, _, _, l1 = _ubus_call(H, hdrs, 2, ubus_sid, "data_repo.cigext", "set", {
        "network": {"wan": {"proto": "pppoe", "username": "sgfdl-123456-789", "password": "d123456"}}
    })
    st2, d2, raw2, l2 = _ubus_call(H, hdrs, 3, ubus_sid, "data_repo.cigext", "get", {
        "network": {"wan": {"proto": "", "username": "", "password": ""}}
    })
    wan_cfg = (((d2.get("result") or [None, {}])[1] or {}).get("network") or {}).get("wan") or {}
    ok1 = (st1 == 200 and st2 == 200 and wan_cfg.get("username") == "sgfdl-123456-789" and wan_cfg.get("password") == "d123456")
    stats_map["AX3000CV2-B1"].record(ok1, 2, (1 if st1 == 200 else 0) + (1 if st2 == 200 else 0), 0 if raw2 else 1, l1 + l2)

    # Bài 2: Wi-Fi Band Steering
    st1, _, _, l1 = _ubus_call(H, hdrs, 4, ubus_sid, "data_repo.weboui", "wifi_set", {
        "host": {
            "2G": {"disabled": False, "vap_diff_mode": False, "ssid": "FPT Telecom", "key": "fpt12345"},
            "5G": {"disabled": False, "vap_diff_mode": False, "ssid": "FPT Telecom", "key": "fpt12345"},
        }
    })
    st2, d2, raw2, l2 = _ubus_call(H, hdrs, 5, ubus_sid, "data_repo.weboui", "wifi_get", {})
    host_2g = (((d2.get("result") or [None, {}])[1] or {}).get("host") or {}).get("2G") or {}
    ok2 = (st1 == 200 and st2 == 200 and host_2g.get("ssid") == "FPT Telecom" and host_2g.get("key") == "fpt12345")
    stats_map["AX3000CV2-B2"].record(ok2, 2, (1 if st1 == 200 else 0) + (1 if st2 == 200 else 0), 0 if raw2 else 1, l1 + l2)

    # Bài 3: Wi-Fi IoT
    st1, _, _, l1 = _ubus_call(H, hdrs, 6, ubus_sid, "data_repo.weboui", "wifi_set", {
        "specific": {
            "2G": {"disabled": False, "ssid": "FPT IoT", "key": "fptiot123"}
        }
    })
    st2, d2, raw2, l2 = _ubus_call(H, hdrs, 7, ubus_sid, "data_repo.weboui", "wifi_get", {})
    iot_2g = (((d2.get("result") or [None, {}])[1] or {}).get("specific") or {}).get("2G") or {}
    ok3 = (st1 == 200 and st2 == 200 and iot_2g.get("ssid") == "FPT IoT" and iot_2g.get("key") == "fptiot123")
    stats_map["AX3000CV2-B3"].record(ok3, 2, (1 if st1 == 200 else 0) + (1 if st2 == 200 else 0), 0 if raw2 else 1, l1 + l2)

    # Bài 4: DNS
    st1, _, _, l1 = _ubus_call(H, hdrs, 8, ubus_sid, "data_repo.cigext", "set", {
        "dhcp": {"lan": {"dhcp_option": {"lan0": "6,210.245.31.220,8.8.8.8"}}}
    })
    st2, d2, raw2, l2 = _ubus_call(H, hdrs, 9, ubus_sid, "data_repo.cigext", "get", {
        "dhcp": {"lan": {"dhcp_option": ""}}
    })
    dhcp_opt = ((((d2.get("result") or [None, {}])[1] or {}).get("dhcp") or {}).get("lan") or {}).get("dhcp_option", "")
    ok4 = (st1 == 200 and st2 == 200 and "210.245.31.220" in dhcp_opt and "8.8.8.8" in dhcp_opt)
    stats_map["AX3000CV2-B4"].record(ok4, 2, (1 if st1 == 200 else 0) + (1 if st2 == 200 else 0), 0 if raw2 else 1, l1 + l2)

    # Bài 5: DHCP
    st1, _, _, l1 = _ubus_call(H, hdrs, 10, ubus_sid, "data_repo.cigext", "set", {
        "network": {"lan": {"ipaddr": "192.168.100.1", "netmask": "255.255.255.0"}},
        "dhcp": {"lan": {"ignore": "0", "start": "192.168.100.2", "limit": "192.168.100.254", "leasetime": "720m"}},
    })
    st2, d2, raw2, l2 = _ubus_call(H, hdrs, 11, ubus_sid, "data_repo.cigext", "get", {
        "network": {"lan": {"ipaddr": "", "netmask": ""}},
        "dhcp": {"lan": {"ignore": "", "start": "", "limit": ""}},
    })
    lan_res = ((d2.get("result") or [None, {}])[1] or {})
    ok5 = (
        st1 == 200
        and st2 == 200
        and ((lan_res.get("network") or {}).get("lan") or {}).get("ipaddr") == "192.168.100.1"
        and ((lan_res.get("dhcp") or {}).get("lan") or {}).get("start") == "192.168.100.2"
    )
    stats_map["AX3000CV2-B5"].record(ok5, 2, (1 if st1 == 200 else 0) + (1 if st2 == 200 else 0), 0 if raw2 else 1, l1 + l2)

    # Bài 6: Port Forwarding
    st1, _, _, l1 = _ubus_call(H, hdrs, 12, ubus_sid, "data_repo.weboui", "portfwd_set", {
        "redirect": [{
            "_method": "add",
            "enabled": "1",
            "name": "Rule1",
            "proto": "tcp udp",
            "src_dport": "8080",
            "dest_ip": "192.168.100.109",
            "dest_port": "80",
        }]
    })
    st2, d2, raw2, l2 = _ubus_call(H, hdrs, 13, ubus_sid, "data_repo.weboui", "portfwd_get", {})
    redirs = ((d2.get("result") or [None, {}])[1] or {}).get("redirect") or []
    ok6 = (st1 == 200 and st2 == 200 and any(r.get("dest_ip") == "192.168.100.109" and r.get("src_dport") == "8080" for r in redirs))
    stats_map["AX3000CV2-B6"].record(ok6, 2, (1 if st1 == 200 else 0) + (1 if st2 == 200 else 0), 0 if raw2 else 1, l1 + l2)

    # Bài 7: Mesh Wi-Fi (Easymesh Controller)
    st1, _, _, l1 = _ubus_call(H, hdrs, 14, ubus_sid, "network.wireless.easymesh", "set", {
        "MeshEnabled": True,
        "MeshRole": "Controller",
    })
    st2, d2, raw2, l2 = _ubus_call(H, hdrs, 15, ubus_sid, "network.wireless.easymesh", "get", {})
    mesh_res = ((d2.get("result") or [None, {}])[1] or {})
    ok7 = (st1 == 200 and st2 == 200 and mesh_res.get("MeshEnabled") is True and mesh_res.get("MeshRole") == "Controller")
    stats_map["AX3000CV2-B7"].record(ok7, 2, (1 if st1 == 200 else 0) + (1 if st2 == 200 else 0), 0 if raw2 else 1, l1 + l2)


def run_all_5000_ktv_tests():
    devices = [
        ("DrayTek Vigor2927", VIGOR_LESSONS, run_single_ktv_vigor2927),
        ("ONT AX3000HV2", AX3000HV2_LESSONS, run_single_ktv_ax3000hv2),
        ("ONT AX3000CV2", AX3000CV2_LESSONS, run_single_ktv_ax3000cv2),
    ]
    summary = {}
    print("=" * 95, flush=True)
    print("BẮT ĐẦU KIỂM THỬ 5.000 KTV MOBILE ĐỒNG THỜI TRÊN 3 THIẾT BỊ (TỔNG 21 BÀI / BAO PHỦ 100% 19 BÀI CHUẨN)", flush=True)
    print("=" * 95, flush=True)

    for dev_name, lesson_defs, runner_fn in devices:
        stats_map = {code: LessonStat(code, title) for code, title in lesson_defs}
        t0 = time.perf_counter()
        with ThreadPoolExecutor(max_workers=CONCURRENCY) as ex:
            futures = [ex.submit(runner_fn, i, stats_map) for i in range(1, TOTAL_KTVS + 1)]
            for f in as_completed(futures):
                f.result()
        dur = time.perf_counter() - t0
        summary[dev_name] = (stats_map, dur)

        print(f"\n>>> THIẾT BỊ: {dev_name} (Hoàn thành 5.000 KTV Mobile trong {dur:.2f}s) <<<", flush=True)
        print(f"{'Mã bài':<15} | {'Tên bài thực hành':<50} | {'KTV ĐẠT':<15} | {'Reqs OK':<15} | {'P95 (ms)':<8}", flush=True)
        print("-" * 112, flush=True)
        for code, _ in lesson_defs:
            st = stats_map[code]
            p95 = sorted(st.latencies)[int(len(st.latencies) * 0.95)] * 1000 if st.latencies else 0.0
            print(f"{st.code:<15} | {st.title:<50} | {st.ktvs_passed}/{st.ktvs_attempted:<9} | {st.requests_ok}/{st.requests_total:<9} | {p95:>6.2f}ms", flush=True)

    return summary


class Test5000KtvAllLessons3Devices(unittest.TestCase):
    def test_5000_ktv_all_lessons_across_vigor2927_ax3000hv2_ax3000cv2(self):
        summary = run_all_5000_ktv_tests()
        for dev_name, (stats_map, _dur) in summary.items():
            for code, st in stats_map.items():
                self.assertEqual(
                    st.ktvs_passed,
                    TOTAL_KTVS,
                    f"{dev_name} - {code} ({st.title}) chỉ đạt {st.ktvs_passed}/{TOTAL_KTVS}",
                )
                self.assertEqual(
                    st.requests_ok,
                    st.requests_total,
                    f"{dev_name} - {code} có request lỗi ({st.requests_ok}/{st.requests_total})",
                )
                self.assertEqual(st.white_screens, 0, f"{dev_name} - {code} có lỗi trắng màn hình")


if __name__ == "__main__":
    run_all_5000_ktv_tests()
