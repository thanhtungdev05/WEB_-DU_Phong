#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
tests/test_ax3000c_1000_ktv_concurrency.py
================================================================================
MÔ PHỎNG 1.000 KTV ĐỒNG THỜI CẤU HÌNH TRÊN ONT AX3000CV2 (fw 0.5.3)
Kiểm tra khả năng chịu tải, cách ly phiên, và đảm bảo 0 lỗi trắng màn / 0 lỗi 500.
================================================================================
"""
import io
import json
import os
import sys
import time
from concurrent.futures import ThreadPoolExecutor, as_completed

if hasattr(sys.stdout, "reconfigure"):
    sys.stdout.reconfigure(encoding="utf-8", errors="replace")

sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
import simulators.sim_ax3000c.server_fw053 as ax3000c


class MockSocket:
    def __init__(self, data=b""):
        self._rfile = io.BytesIO(data)
        self._wfile = io.BytesIO()

    def makefile(self, mode, *args, **kwargs):
        if "b" in mode:
            if "r" in mode:
                return self._rfile
            return self._wfile
        return None

    def sendall(self, data):
        self._wfile.write(data)

    def close(self):
        pass


def execute_req(raw_http):
    sock = MockSocket(raw_http)
    ax3000c.Handler(sock, ("127.0.0.1", 12345), None)
    output = sock._wfile.getvalue()
    header_end = output.find(b"\r\n\r\n")
    if header_end != -1:
        headers_raw = output[:header_end].decode("utf-8", errors="replace")
        body = output[header_end + 4 :]
    else:
        headers_raw = output.decode("utf-8", errors="replace")
        body = b""
    return headers_raw, body


def simulate_one_ktv(ktv_num):
    ktv_id = f"ktv_{ktv_num:04d}"
    cookie_hdr = f"Cookie: PHPSESSID={ktv_id}; ktv_client_id={ktv_id}\r\nX-KTV-Session-ID: {ktv_id}\r\n"

    # 1. Reset phiên trước khi vào bài
    h1, b1 = execute_req(f"GET /sim-reset-session HTTP/1.1\r\nHost: localhost\r\n{cookie_hdr}\r\n".encode())
    if "200 OK" not in h1 or b'"ok":1' not in b1:
        return False, "reset_fail"

    # 2. Login
    p_login = json.dumps({
        "id": 1, "method": "call",
        "params": ["00000000000000000000000000000000", "session", "login", {"username": "admin", "password": "admin"}]
    }).encode("utf-8")
    raw_login = f"POST /ubus HTTP/1.1\r\nHost: localhost\r\nContent-Type: application/json\r\nContent-Length: {len(p_login)}\r\n{cookie_hdr}\r\n".encode() + p_login
    h2, b2 = execute_req(raw_login)
    if "200 OK" not in h2:
        return False, "login_fail"
    try:
        sid = json.loads(b2.decode("utf-8"))["result"][1]["ubus_rpc_session"]
    except Exception:
        return False, "login_parse_fail"

    # 3. Cấu hình PPPoE WAN (Bài 1)
    p_wan = json.dumps({
        "id": 2, "method": "call",
        "params": [sid, "data_repo.cigext", "set", {
            "network": {"wan": {"username": f"sgfdl-123456_{ktv_num}", "password": "d123456"}}
        }]
    }).encode("utf-8")
    raw_wan = f"POST /ubus HTTP/1.1\r\nHost: localhost\r\nContent-Type: application/json\r\nContent-Length: {len(p_wan)}\r\n{cookie_hdr}\r\n".encode() + p_wan
    h3, b3 = execute_req(raw_wan)
    if "200 OK" not in h3 or b'"result":[0' not in b3:
        return False, "wan_fail"

    # 4. Cấu hình Wi-Fi (Bài 2)
    p_wifi = json.dumps({
        "id": 3, "method": "call",
        "params": [sid, "data_repo.weboui", "wifi_set", {
            "wifi": {"2G": {"ssid": f"FPT_{ktv_num}", "key": "fpt12345", "vap_diff_mode": "0"}}
        }]
    }).encode("utf-8")
    raw_wifi = f"POST /ubus HTTP/1.1\r\nHost: localhost\r\nContent-Type: application/json\r\nContent-Length: {len(p_wifi)}\r\n{cookie_hdr}\r\n".encode() + p_wifi
    h4, b4 = execute_req(raw_wifi)
    if "200 OK" not in h4 or b'"result":[0' not in b4:
        return False, "wifi_fail"

    # 5. Polling Home (assoclist & ecm status) không được lỗi
    p_assoc = json.dumps({"id": 4, "method": "call", "params": [sid, "iwinfo", "assoclist", {"device": "ath0"}]}).encode("utf-8")
    raw_assoc = f"POST /ubus HTTP/1.1\r\nHost: localhost\r\nContent-Type: application/json\r\nContent-Length: {len(p_assoc)}\r\n{cookie_hdr}\r\n".encode() + p_assoc
    h5, b5 = execute_req(raw_assoc)
    if "200 OK" not in h5 or b'"results":[]' not in b5:
        return False, "assoc_fail"

    return True, "ok"


def main():
    print("=" * 75)
    print("  KIỂM THỬ TẢI: 1.000 KTV ĐỒNG THỜI TRÊN ONT AX3000CV2 (fw 0.5.3)")
    print("=" * 75)
    start_time = time.perf_counter()
    total_ktvs = 1000
    concurrency = 50

    results = []
    print(f"Bắt đầu chạy {total_ktvs} KTV với {concurrency} luồng đồng thời...")
    with ThreadPoolExecutor(max_workers=concurrency) as executor:
        futures = {executor.submit(simulate_one_ktv, i): i for i in range(1, total_ktvs + 1)}
        done = 0
        for f in as_completed(futures):
            ok, msg = f.result()
            results.append((ok, msg))
            done += 1
            if done % 250 == 0 or done == total_ktvs:
                print(f"  -> Đã hoàn thành {done}/{total_ktvs} KTV...")

    duration = time.perf_counter() - start_time
    passed = sum(1 for ok, _ in results if ok)
    failed = total_ktvs - passed

    print("\n" + "=" * 75)
    print("                     KẾT QUẢ KIỂM THỬ TẢI AX3000CV2")
    print("=" * 75)
    print(f"• Tổng số KTV tham gia:        {total_ktvs} KTV")
    print(f"• Số KTV hoàn thành ĐẠT:       {passed}/{total_ktvs} ({passed / total_ktvs * 100:.2f}%)")
    print(f"• Số lỗi (trắng màn / 500):    {failed}")
    print(f"• Tổng thời gian thực thi:     {duration:.2f} giây")
    print(f"• Tốc độ xử lý trung bình:     {total_ktvs / duration:.1f} KTV/giây")
    print("=" * 75)

    if passed == total_ktvs:
        print(">>> KẾT LUẬN: 1.000 KTV ĐỒNG THỜI TRÊN AX3000CV2 HOÀN TOÀN MƯỢT MÀ, 0 LỖI TRẮNG MÀN! <<<")
    else:
        print(">>> CÓ LỖI XẢY RA! <<<")
    print("=" * 75)


if __name__ == "__main__":
    main()
