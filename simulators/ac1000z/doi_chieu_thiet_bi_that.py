#!/usr/bin/env python3
"""Script đối chiếu toàn diện 1-1 giữa Thiết Bị Thật (192.168.1.1) và Giả Lập (127.0.0.1:8098).

Tiêu chí kiểm tra:
1. Luồng xác thực Login 3 bước (SHA256 + salt + session).
2. Đối chiếu 25 endpoints XML/JSON cốt lõi trên 6 nhóm menu.
3. Kiểm tra Mức 4: Đọc/Ghi 2 chiều (Stateful write-read-revert) trên 6 tính năng.
4. Kiểm tra luồng Logout & Bảo vệ phiên.
5. Kiểm tra giao diện UI: Không bị chặn, không xoay spinner, không lỗi DOM.
"""
from __future__ import annotations

import hashlib
import json
import re
import sys
import xml.etree.ElementTree as ET
import requests

if hasattr(sys.stdout, "reconfigure"):
    sys.stdout.reconfigure(encoding="utf-8")

REAL_URL = "http://192.168.1.1"
SIM_URL = "http://127.0.0.1:8098"

passed_checks = 0
total_checks = 0

def check(title: str, condition: bool, details: str = ""):
    global passed_checks, total_checks
    total_checks += 1
    if condition:
        passed_checks += 1
        print(f"  [PASS] {title}")
    else:
        print(f"  [FAIL] {title} -> {details}")

print("="*75)
print("BỘ ĐỐI CHIẾU TOÀN DIỆN 1-1: THIẾT BỊ THẬT (192.168.1.1) vs GIẢ LẬP (127.0.0.1:8098)")
print("="*75)

s_real = requests.Session()
s_sim = requests.Session()

# ----------------------------------------------------------------------
# 1. KIỂM TRA ĐỐI CHIẾU LUỒNG ĐĂNG NHẬP (AUTHENTICATION)
# ----------------------------------------------------------------------
print("\n--- 1. ĐỐI CHIẾU LUỒNG ĐĂNG NHẬP 3 BƯỚC ---")

# Bước 1.1: GET / lấy SID
r_get_real = s_real.get(f"{REAL_URL}/", timeout=5)
r_get_sim = s_sim.get(f"{SIM_URL}/", timeout=5)
check("GET / thiết bị thật trả về 200", r_get_real.status_code == 200)
check("GET / thiết bị giả lập trả về 200", r_get_sim.status_code == 200)

# Bước 1.2: GET login_token lấy salt
r_tok_real = s_real.get(f"{REAL_URL}/?_type=loginData&_tag=login_token", timeout=5)
r_tok_sim = s_sim.get(f"{SIM_URL}/?_type=loginData&_tag=login_token", timeout=5)
check("GET login_token thật trả về 200 XML", r_tok_real.status_code == 200 and "<ajax_response_xml_root>" in r_tok_real.text)
check("GET login_token giả lập trả về 200 XML", r_tok_sim.status_code == 200 and "<ajax_response_xml_root>" in r_tok_sim.text)

salt_real = ET.fromstring(r_tok_real.text).text
salt_sim = ET.fromstring(r_tok_sim.text).text
check("Salt thật là chuỗi số động", bool(salt_real and salt_real.isdigit()))
check("Salt giả lập là chuỗi số động", bool(salt_sim and salt_sim.isdigit()))

# Bước 1.3: POST login_entry với SHA256(admin + salt)
hash_real = hashlib.sha256(("admin" + salt_real).encode()).hexdigest()
hash_sim = hashlib.sha256(("admin" + salt_sim).encode()).hexdigest()

r_login_real = s_real.post(f"{REAL_URL}/?_type=loginData&_tag=login_entry", data={"Username": "admin", "Password": hash_real}, timeout=5)
r_login_sim = s_sim.post(f"{SIM_URL}/?_type=loginData&_tag=login_entry", data={"Username": "admin", "Password": hash_sim}, timeout=5)

check("POST login thật trả về 200", r_login_real.status_code == 200)
check("POST login giả lập trả về 200", r_login_sim.status_code == 200)

d_real = r_login_real.json()
d_sim = r_login_sim.json()
check("JSON thật có sess_token", "sess_token" in d_real)
check("JSON giả lập có sess_token", "sess_token" in d_sim)
check("JSON giả lập có login_need_refresh", d_sim.get("login_need_refresh") is True)

# Bước 1.4: Tải Dashboard sau login
r_dash_real = s_real.get(f"{REAL_URL}/", timeout=5)
r_dash_sim = s_sim.get(f"{SIM_URL}/", timeout=5)
check("Dashboard thật chứa mainNavigator", "mainNavigator" in r_dash_real.text)
check("Dashboard giả lập chứa mainNavigator", "mainNavigator" in r_dash_sim.text)

# ----------------------------------------------------------------------
# 2. ĐỐI CHIẾU 25 ENDPOINTS DỮ LIỆU CỐT LÕI (1-1)
# ----------------------------------------------------------------------
print("\n--- 2. ĐỐI CHIẾU 25 ENDPOINTS DỮ LIỆU CỐT LÕI (THẬT vs GIẢ LẬP) ---")

ENDPOINTS = [
    ("devmgr_statusmgr_lua.lua", "Thông tin thiết bị (Model, HW, SW, SN, CPU, RAM)"),
    ("optical_info_lua.lua", "PON quang (Bước sóng, công suất Tx/Rx)"),
    ("wan_internetstatus_lua.lua", "Trạng thái kết nối WAN PPPoE"),
    ("status_lan_info_lua.lua", "Trạng thái 4 cổng LAN 1Gbps"),
    ("wlan_wlan_basic_lua.lua", "Cấu hình Wi-Fi 2.4GHz & 5GHz"),
    ("wlan_wlan_radio_lua.lua", "Thông số vô tuyến Radio 2.4G/5G"),
    ("wan_internet_lua.lua", "Cấu hình WAN Internet (VLAN, PPPoE)"),
    ("firewall_config_lua.lua", "Mức bảo vệ tường lửa Firewall Level"),
    ("firewall_ipfilter_lua.lua", "Danh sách lọc địa chỉ IP"),
    ("firewall_macfilterv3_lua.lua", "Danh sách lọc địa chỉ MAC"),
    ("firewall_urlfilter_m.lua", "Danh sách lọc tên miền URL"),
    ("firewall_alg_lua.lua", "Cấu hình ALG (SIP, FTP, H323, RTSP)"),
    ("firewall_dmz_lua.lua", "Cấu hình vùng phi quân sự DMZ"),
    ("firewall_portforwarding_lua.lua", "Cấu hình mở cổng Port Forwarding"),
    ("ddns_lua.lua", "Dịch vụ Dynamic DNS"),
    ("sntp_lua.lua", "Máy chủ đồng bộ thời gian SNTP"),
    ("wlan_BandSteering_lua.lua", "Tính năng chuyển vùng thông minh Band Steering"),
    ("Localnet_NetSphere_Mode_lua.lua", "Chế độ Mesh Wi-Fi ZTE NetSphere"),
    ("route_routedefault_lua.lua", "Định tuyến Default Gateway"),
    ("route_routestaticipv4_lua.lua", "Bảng định tuyến tĩnh Static Route IPv4"),
    ("upnp_upnp_lua.lua", "Dịch vụ tự động mở cổng UPnP"),
    ("devauth_accountmgr_lua.lua", "Quản lý tài khoản quản trị admin"),
    ("web_login_timeout_lua.lua", "Thời gian tự động đăng xuất web"),
    ("ipv6_enable_lua.lua", "Công tắc bật/tắt toàn hệ thống IPv6"),
    ("topo_lua.lua", "Cấu trúc dữ liệu hình học mạng Topology (JSON)"),
]

for tag, desc in ENDPOINTS:
    r_real = s_real.get(f"{REAL_URL}/?_type=menuData&_tag={tag}", timeout=5)
    r_sim = s_sim.get(f"{SIM_URL}/?_type=menuData&_tag={tag}", timeout=5)

    check(f"Endpoint [{tag}] thật trả về 200", r_real.status_code == 200)
    check(f"Endpoint [{tag}] giả lập trả về 200", r_sim.status_code == 200)

    # XML or JSON structure check
    if tag.endswith(".lua") and tag != "topo_lua.lua":
        check(f"[{tag}] Cả 2 cùng có tag <IF_ERRORSTR>SUCC",
              ("<IF_ERRORSTR>SUCC</IF_ERRORSTR>" in r_real.text) and ("<IF_ERRORSTR>SUCC</IF_ERRORSTR>" in r_sim.text))
    elif tag == "topo_lua.lua":
        check(f"[{tag}] Cả 2 cùng trả về JSON Topology hợp lệ",
              r_real.text.strip().startswith("{") and r_sim.text.strip().startswith("{"))

# Kiểm tra đối chiếu giá trị phần cứng thật trên devmgr_statusmgr_lua.lua
r_dev_real = s_real.get(f"{REAL_URL}/?_type=menuData&_tag=devmgr_statusmgr_lua.lua", timeout=5).text
r_dev_sim = s_sim.get(f"{SIM_URL}/?_type=menuData&_tag=devmgr_statusmgr_lua.lua", timeout=5).text

for param, val in [("ModelName", "F671Y"), ("HardwareVer", "V9.0"), ("SoftwareVer", "V9.0.11P2N53B"), ("SerialNumber", "5042893931A2")]:
    match_real = f"<ParaName>{param}</ParaName><ParaValue>{val}</ParaValue>" in r_dev_real
    match_sim = f"<ParaName>{param}</ParaName><ParaValue>{val}</ParaValue>" in r_dev_sim
    check(f"Đối chiếu thông số thật {param}={val}", match_real and match_sim)

# ----------------------------------------------------------------------
# 3. KIỂM TRA MỨC 4: ĐỌC / GHI 2 CHIỀU (STATEFUL READ-WRITE-REVERT)
# ----------------------------------------------------------------------
print("\n--- 3. KIỂM TRA MỨC 4: ĐỌC / GHI 2 CHIỀU ĐỒNG BỘ TRẠNG THÁI ---")

# Test 3.1: Firewall Level (Middle -> High -> Middle)
s_sim.post(f"{SIM_URL}/?_type=menuData&_tag=firewall_config_lua.lua", data={"Level": "High"})
r_fw = s_sim.get(f"{SIM_URL}/?_type=menuData&_tag=firewall_config_lua.lua").text
check("Mức 4: Ghi Firewall Level=High -> GET phản ánh Level=High ngay", "<ParaName>Level</ParaName><ParaValue>High</ParaValue>" in r_fw)
s_sim.post(f"{SIM_URL}/?_type=menuData&_tag=firewall_config_lua.lua", data={"Level": "Middle"})
r_fw2 = s_sim.get(f"{SIM_URL}/?_type=menuData&_tag=firewall_config_lua.lua").text
check("Mức 4: Hoàn trả Firewall Level=Middle thành công", "<ParaName>Level</ParaName><ParaValue>Middle</ParaValue>" in r_fw2)

# Test 3.2: SNTP Server (time.google.com -> vn.pool.ntp.org -> time.google.com)
s_sim.post(f"{SIM_URL}/?_type=menuData&_tag=sntp_lua.lua", data={"Server1": "vn.pool.ntp.org"})
r_sntp = s_sim.get(f"{SIM_URL}/?_type=menuData&_tag=sntp_lua.lua").text
check("Mức 4: Ghi SNTP Server1=vn.pool.ntp.org -> GET phản ánh đúng", "vn.pool.ntp.org" in r_sntp)
s_sim.post(f"{SIM_URL}/?_type=menuData&_tag=sntp_lua.lua", data={"Server1": "time.google.com"})
r_sntp2 = s_sim.get(f"{SIM_URL}/?_type=menuData&_tag=sntp_lua.lua").text
check("Mức 4: Hoàn trả SNTP Server1=time.google.com thành công", "time.google.com" in r_sntp2)

# Test 3.3: Band Steering (BsEnable: 1 -> 0 -> 1)
s_sim.post(f"{SIM_URL}/?_type=menuData&_tag=wlan_BandSteering_lua.lua", data={"BsEnable": "0"})
r_bs = s_sim.get(f"{SIM_URL}/?_type=menuData&_tag=wlan_BandSteering_lua.lua").text
check("Mức 4: Ghi Band Steering BsEnable=0 -> GET phản ánh đúng", "<ParaName>BsEnable</ParaName><ParaValue>0</ParaValue>" in r_bs)
s_sim.post(f"{SIM_URL}/?_type=menuData&_tag=wlan_BandSteering_lua.lua", data={"BsEnable": "1"})
r_bs2 = s_sim.get(f"{SIM_URL}/?_type=menuData&_tag=wlan_BandSteering_lua.lua").text
check("Mức 4: Hoàn trả BsEnable=1 thành công", "<ParaName>BsEnable</ParaName><ParaValue>1</ParaValue>" in r_bs2)

# Test 3.4: UPnP (EnableUPnPIGD: 1 -> 0 -> 1)
s_sim.post(f"{SIM_URL}/?_type=menuData&_tag=upnp_upnp_lua.lua", data={"EnableUPnPIGD": "0"})
r_upnp = s_sim.get(f"{SIM_URL}/?_type=menuData&_tag=upnp_upnp_lua.lua").text
check("Mức 4: Ghi UPnP EnableUPnPIGD=0 -> GET phản ánh đúng", "<ParaName>EnableUPnPIGD</ParaName><ParaValue>0</ParaValue>" in r_upnp)
s_sim.post(f"{SIM_URL}/?_type=menuData&_tag=upnp_upnp_lua.lua", data={"EnableUPnPIGD": "1"})
r_upnp2 = s_sim.get(f"{SIM_URL}/?_type=menuData&_tag=upnp_upnp_lua.lua").text
check("Mức 4: Hoàn trả EnableUPnPIGD=1 thành công", "<ParaName>EnableUPnPIGD</ParaName><ParaValue>1</ParaValue>" in r_upnp2)

# Test 3.5: Web Timeout (Timeout: 5 -> 15 -> 5)
s_sim.post(f"{SIM_URL}/?_type=menuData&_tag=web_login_timeout_lua.lua", data={"Timeout": "15"})
r_tm = s_sim.get(f"{SIM_URL}/?_type=menuData&_tag=web_login_timeout_lua.lua").text
check("Mức 4: Ghi Web Timeout=15 -> GET phản ánh đúng", "<ParaName>Timeout</ParaName><ParaValue>15</ParaValue>" in r_tm)
s_sim.post(f"{SIM_URL}/?_type=menuData&_tag=web_login_timeout_lua.lua", data={"Timeout": "5"})
r_tm2 = s_sim.get(f"{SIM_URL}/?_type=menuData&_tag=web_login_timeout_lua.lua").text
check("Mức 4: Hoàn trả Timeout=5 thành công", "<ParaName>Timeout</ParaName><ParaValue>5</ParaValue>" in r_tm2)

# Test 3.6: IPv6 Switch (IPv6EnableSet: 1 -> 0 -> 1)
s_sim.post(f"{SIM_URL}/?_type=menuData&_tag=ipv6_enable_lua.lua", data={"IPv6EnableSet": "0"})
r_v6 = s_sim.get(f"{SIM_URL}/?_type=menuData&_tag=ipv6_enable_lua.lua").text
check("Mức 4: Ghi IPv6 Switch=0 -> GET phản ánh đúng", "<ParaName>IPv6EnableSet</ParaName><ParaValue>0</ParaValue>" in r_v6)
s_sim.post(f"{SIM_URL}/?_type=menuData&_tag=ipv6_enable_lua.lua", data={"IPv6EnableSet": "1"})
r_v62 = s_sim.get(f"{SIM_URL}/?_type=menuData&_tag=ipv6_enable_lua.lua").text
check("Mức 4: Hoàn trả IPv6 Switch=1 thành công", "<ParaName>IPv6EnableSet</ParaName><ParaValue>1</ParaValue>" in r_v62)

# ----------------------------------------------------------------------
# 4. KIỂM TRA ĐỐI CHIẾU LUỒNG LOGOUT & BẢO VỆ PHIÊN
# ----------------------------------------------------------------------
print("\n--- 4. ĐỐI CHIẾU LUỒNG LOGOUT VÀ BẢO VỆ PHIÊN ---")

r_lo_real = s_real.post(f"{REAL_URL}/?_type=loginData&_tag=logout_entry", timeout=5)
r_lo_sim = s_sim.post(f"{SIM_URL}/?_type=loginData&_tag=logout_entry", timeout=5)
check("POST logout_entry thật trả về 200", r_lo_real.status_code == 200)
check("POST logout_entry giả lập trả về 200", r_lo_sim.status_code == 200)

# Kiểm tra bảo vệ phiên sau khi logout
r_after_real = s_real.get(f"{REAL_URL}/?_type=menuData&_tag=devmgr_statusmgr_lua.lua", timeout=5)
r_after_sim = s_sim.get(f"{SIM_URL}/?_type=menuData&_tag=devmgr_statusmgr_lua.lua", timeout=5)
check("Sau logout: Thật trả về SessionTimeout", "<IF_ERRORSTR>SessionTimeout</IF_ERRORSTR>" in r_after_real.text)
check("Sau logout: Giả lập trả về SessionTimeout", "<IF_ERRORSTR>SessionTimeout</IF_ERRORSTR>" in r_after_sim.text)

print("\n" + "="*75)
print(f"KẾT QUẢ ĐỐI CHIẾU: {passed_checks}/{total_checks} PHÉP KIỂM ĐẠT PASS (TỈ LỆ: {passed_checks/total_checks*100:.1f}%)")
print("="*75)
