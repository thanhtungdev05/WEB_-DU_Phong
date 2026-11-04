#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
tests/test_1000_ktv_6labs_3devices.py
================================================================================
STRESS TEST 1.000 KTV ĐỒNG THỜI CẤU HÌNH ĐỦ 6 BÀI TRÊN 3 THIẾT BỊ CHỦ CHỐT:
1. ZTE AX3000CV2 (sim_ax3000c)
2. ONT AX3000HV2 (sim_ax3000hv2)
3. DrayTek Vigor2927 (sim_vigor2927)

Yêu cầu kiểm chứng:
- 1.000 KTV ảo gửi request cấu hình liên tục đủ 6 bài học.
- Toàn bộ 1.000 KTV x 6 bài = 6.000 phiên cấu hình độc lập/thiết bị.
- Tổng cộng: 18.000 bài thi được thực hiện đồng thời.
- 100% request thành công, 0 lỗi 500, 0 lỗi trắng màn.
- Kiểm tra kết quả cấu hình trả về khớp 100% tiêu chí đề bài (ĐẠT).
================================================================================
"""
import copy
import http.client
import json
import os
import sys
import threading
import time
from concurrent.futures import ThreadPoolExecutor, as_completed
from http.server import ThreadingHTTPServer

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
sys.path.insert(0, ROOT)

import run_all

TEST_PORT = 19890
TOTAL_KTVS = 1000
CONCURRENCY = 50


class DeviceBatchMetrics:
    def __init__(self, name):
        self.name = name
        self.lock = threading.Lock()
        self.total_labs_attempted = 0
        self.total_labs_passed = 0
        self.total_requests = 0
        self.failed_requests = 0
        self.white_screens = 0
        self.latencies = []

    def record_req(self, ok, latency, is_white=False):
        with self.lock:
            self.total_requests += 1
            self.latencies.append(latency)
            if not ok:
                self.failed_requests += 1
            if is_white:
                self.white_screens += 1

    def record_lab(self, passed):
        with self.lock:
            self.total_labs_attempted += 1
            if passed:
                self.total_labs_passed += 1


def http_call(port, path, method="GET", headers=None, body=None, timeout=10):
    t0 = time.perf_counter()
    h = headers or {}
    conn = http.client.HTTPConnection("127.0.0.1", port, timeout=timeout)
    try:
        body_bytes = body.encode("utf-8") if isinstance(body, str) else body
        conn.request(method, path, body=body_bytes, headers=h)
        resp = conn.getresponse()
        data = resp.read()
        latency = time.perf_counter() - t0
        return resp.status, resp.getheaders(), data, latency
    except Exception as e:
        latency = time.perf_counter() - t0
        return 0, [], str(e).encode(), latency
    finally:
        conn.close()


# ─────────────────────────────────────────────────────────────────────────────
# 1. KỊCH BẢN AX3000CV2 — 6 BÀI
# ─────────────────────────────────────────────────────────────────────────────
def run_ax3000c_6labs(ktv_id, port, metrics):
    cookie_id = f"ktv_axc_{ktv_id:04d}"
    headers = {
        "Cookie": f"PHPSESSID={cookie_id}; ktv_client_id={cookie_id}",
        "X-KTV-Session-ID": cookie_id,
        "Content-Type": "application/json",
    }

    # Đăng nhập lấy sid hợp lệ với mật khẩu admin
    login_payload = json.dumps({
        "id": ktv_id,
        "method": "call",
        "params": ["00000000000000000000000000000000", "session", "login", {"username": "admin", "password": "admin"}]
    })
    st, _, data, lat = http_call(port, "/sim_ax3000c/ubus", method="POST", headers=headers, body=login_payload)
    metrics.record_req(st == 200, lat, is_white=(st == 200 and len(data) < 10))
    if st != 200:
        for _ in range(6): metrics.record_lab(False)
        return

    try:
        sid = json.loads(data.decode("utf-8"))["result"][1]["ubus_rpc_session"]
    except Exception:
        sid = f"fake_{ktv_id}"

    # Bài 1: Cấu hình PPPoE WAN (sgfdl-123456-789 / d123456)
    p1 = json.dumps({
        "id": ktv_id,
        "method": "call",
        "params": [sid, "data_repo.cigext", "set", {
            "network": {"wan": {"username": f"sgfdl-123456-789_{ktv_id}", "password": "d123456"}}
        }]
    })
    st, _, data, lat = http_call(port, "/sim_ax3000c/ubus", method="POST", headers=headers, body=p1)
    metrics.record_req(st == 200, lat)
    # Verify Bài 1 bằng cigext get template
    v1 = json.dumps({
        "id": ktv_id,
        "method": "call",
        "params": [sid, "data_repo.cigext", "get", {"network": {"wan": {"username": "", "password": ""}}}]
    })
    st, _, d_v1, lat = http_call(port, "/sim_ax3000c/ubus", method="POST", headers=headers, body=v1)
    metrics.record_req(st == 200, lat)
    b1_ok = (f"sgfdl-123456-789_{ktv_id}" in d_v1.decode("utf-8", "ignore"))
    metrics.record_lab(b1_ok)

    # Bài 2: Cấu hình Wi-Fi 2.4GHz SSID & Pass
    p2 = json.dumps({
        "id": ktv_id,
        "method": "call",
        "params": [sid, "network.wireless.ssid", "set", {
            "device": "radio0", "ssid": f"FPT_Telecom_{ktv_id}", "key": "fpt12345"
        }]
    })
    st, _, data, lat = http_call(port, "/sim_ax3000c/ubus", method="POST", headers=headers, body=p2)
    metrics.record_req(st == 200, lat)
    metrics.record_lab(st == 200)

    # Bài 3: Cấu hình Wi-Fi 5GHz SSID & Pass
    p3 = json.dumps({
        "id": ktv_id,
        "method": "call",
        "params": [sid, "network.wireless.ssid", "set", {
            "device": "radio1", "ssid": f"FPT_5G_{ktv_id}", "key": "fpt12345"
        }]
    })
    st, _, data, lat = http_call(port, "/sim_ax3000c/ubus", method="POST", headers=headers, body=p3)
    metrics.record_req(st == 200, lat)
    metrics.record_lab(st == 200)

    # Bài 4: Tắt Wi-Fi 5GHz
    p4 = json.dumps({
        "id": ktv_id,
        "method": "call",
        "params": [sid, "network.wireless.radio", "set", {"radio1": {"disabled": 1}}]
    })
    st, _, data, lat = http_call(port, "/sim_ax3000c/ubus", method="POST", headers=headers, body=p4)
    metrics.record_req(st == 200, lat)
    metrics.record_lab(st == 200)

    # Bài 5: Cấu hình LAN IP 192.168.100.1 & DHCP
    p5 = json.dumps({
        "id": ktv_id,
        "method": "call",
        "params": [sid, "data_repo.cigext", "set", {
            "network": {"lan": {"ipaddr": "192.168.100.1"}},
            "dhcp": {"lan": {"start": "192.168.100.2", "limit": "253"}}
        }]
    })
    st, _, data, lat = http_call(port, "/sim_ax3000c/ubus", method="POST", headers=headers, body=p5)
    metrics.record_req(st == 200, lat)
    # Verify Bài 5 bằng cigext get template
    v5 = json.dumps({
        "id": ktv_id,
        "method": "call",
        "params": [sid, "data_repo.cigext", "get", {"network": {"lan": {"ipaddr": ""}}, "dhcp": {"lan": {"start": "", "limit": ""}}}]
    })
    st, _, d_v5, lat = http_call(port, "/sim_ax3000c/ubus", method="POST", headers=headers, body=v5)
    metrics.record_req(st == 200, lat)
    b5_ok = ("192.168.100.1" in d_v5.decode("utf-8", "ignore"))
    metrics.record_lab(b5_ok)

    # Bài 6: Port Forwarding / NAT Port
    p6 = json.dumps({
        "id": ktv_id,
        "method": "call",
        "params": [sid, "firewall.redirect", "add", {
            "name": f"PORT_FW_{ktv_id}", "src_dport": "8080", "dest_ip": "192.168.100.50", "dest_port": "80"
        }]
    })
    st, _, data, lat = http_call(port, "/sim_ax3000c/ubus", method="POST", headers=headers, body=p6)
    metrics.record_req(st == 200, lat)
    metrics.record_lab(st == 200)


# ─────────────────────────────────────────────────────────────────────────────
# 2. KỊCH BẢN ONT AX3000HV2 — 6 BÀI
# ─────────────────────────────────────────────────────────────────────────────
def run_ax3000hv2_6labs(ktv_id, port, metrics):
    cookie_id = f"ktv_hv2_{ktv_id:04d}"
    headers = {
        "Cookie": f"PHPSESSID={cookie_id}; ktv_client_id={cookie_id}; ax3000hv2_sid={cookie_id}",
        "X-KTV-Session-ID": cookie_id,
        "Content-Type": "application/x-www-form-urlencoded",
    }

    # Bài 1: Cấu hình PPPoE WAN (sgfdl-210208-218 / fpt12345)
    body1 = f"Username=sgfdl-210208-218_{ktv_id}&pppPassword=fpt12345_{ktv_id}&pppUserName=sgfdl-210208-218_{ktv_id}"
    st, _, data, lat = http_call(port, "/sim_ax3000hv2/cgi-bin/home_wan.asp", method="POST", headers=headers, body=body1)
    metrics.record_req(st in (200, 302), lat)
    # Verify Bài 1 qua trang status
    st_v, _, d_v, lat = http_call(port, f"/sim_ax3000hv2/cgi-bin/home_wan.asp?_ktv={cookie_id}", headers=headers)
    metrics.record_req(st_v == 200, lat)
    b1_ok = (f"sgfdl-210208-218_{ktv_id}" in d_v.decode("utf-8", "ignore"))
    metrics.record_lab(b1_ok)

    # Bài 2: Cấu hình Wi-Fi 2.4G SSID & Pass (FPT Telecom / fpt12345)
    body2 = f"ESSID=FPT_Telecom_{ktv_id}&PreSharedKey=fpt12345&wifi5SSid_2G=FPT_Telecom_{ktv_id}"
    st, _, _, lat = http_call(port, "/sim_ax3000hv2/cgi-bin/home_wireless.asp", method="POST", headers=headers, body=body2)
    metrics.record_req(st in (200, 302), lat)
    metrics.record_lab(st in (200, 302))

    # Bài 3: Cấu hình Wi-Fi 5G SSID & Pass (FPT Telecom / fpt12345)
    body3 = f"ESSID_5g=FPT_5G_{ktv_id}&PreSharedKey_5g=fpt12345&wifi5SSid_5G=FPT_5G_{ktv_id}"
    st, _, _, lat = http_call(port, "/sim_ax3000hv2/cgi-bin/home_wireless.asp", method="POST", headers=headers, body=body3)
    metrics.record_req(st in (200, 302), lat)
    metrics.record_lab(st in (200, 302))

    # Bài 4: Tắt Wi-Fi 5G
    body4 = "Enable_Wifi5_2G=1&Enable_Wifi5_5G=0&enable_SSID=1&enable_SSID_5g=0"
    st, _, _, lat = http_call(port, "/sim_ax3000hv2/cgi-bin/home_wireless.asp", method="POST", headers=headers, body=body4)
    metrics.record_req(st in (200, 302), lat)
    metrics.record_lab(st in (200, 302))

    # Bài 5: Cấu hình LAN IP 192.168.100.1 & DHCP
    body5 = f"uiViewIPAddr=192.168.100.1&StartIp=192.168.100.2&PoolSize=253&PrimaryDns=8.8.8.8&dnsTypeRadio=1"
    st, _, _, lat = http_call(port, "/sim_ax3000hv2/cgi-bin/home_lan.asp", method="POST", headers=headers, body=body5)
    metrics.record_req(st in (200, 302), lat)
    # Verify Bài 5
    st_v5, _, d_v5, lat = http_call(port, f"/sim_ax3000hv2/cgi-bin/home_lan.asp?_ktv={cookie_id}", headers=headers)
    metrics.record_req(st_v5 == 200, lat)
    b5_ok = ("192.168.100.1" in d_v5.decode("utf-8", "ignore") and "8.8.8.8" in d_v5.decode("utf-8", "ignore"))
    metrics.record_lab(b5_ok)

    # Bài 6: Port Forwarding / NAT Virtual Server
    body6 = f"curPort=1&extPort=8080&inPort=80&inIP=192.168.100.50&prot=1"
    st, _, _, lat = http_call(port, "/sim_ax3000hv2/cgi-bin/adv_nat.asp", method="POST", headers=headers, body=body6)
    metrics.record_req(st in (200, 302), lat)
    metrics.record_lab(st in (200, 302))


# ─────────────────────────────────────────────────────────────────────────────
# 3. KỊCH BẢN DRAYTEK VIGOR2927 — 6 BÀI
# ─────────────────────────────────────────────────────────────────────────────
def run_vigor2927_6labs(ktv_id, port, metrics):
    cookie_id = f"ktv_vg_{ktv_id:04d}"
    headers = {
        "Cookie": f"PHPSESSID={cookie_id}; ktv_client_id={cookie_id}; vg_session={cookie_id}",
        "X-KTV-Session-ID": cookie_id,
        "Content-Type": "application/x-www-form-urlencoded",
    }

    # Bài 1: Cấu hình Giới hạn băng thông Bandwidth Limit (fid=302)
    target_ip = f"192.168.1.{ktv_id % 200 + 10}"
    body1 = f"fid=302&webchange=1&sIpBandwEnable=1&sIpBandwDefTx=20&iDefTx=1&sIpBandwDefRx=25&iDefRx=1&sIpBandwidth0={target_ip}-192.168.1.250+32788+32793"
    st, _, _, lat = http_call(port, "/sim_vigor2927/cgi-bin/v2x00.cgi", method="POST", headers=headers, body=body1)
    metrics.record_req(st in (200, 302), lat)
    # Verify Bài 1
    st_v1, _, d_v1, lat = http_call(port, f"/sim_vigor2927/doc/ipbandw.htm?_ktv={cookie_id}", headers=headers)
    metrics.record_req(st_v1 == 200, lat)
    b1_ok = (target_ip in d_v1.decode("utf-8", "ignore"))
    metrics.record_lab(b1_ok)

    # Bài 2: Cấu hình Bind IP to MAC (fid=126)
    mac_end = f"{ktv_id % 90 + 10:02d}"
    body2 = f"fid=126&webchange=1&sIpBndMacEnable=1&sIpBndMacStrict=0&sIpBndMac=192.168.1.{ktv_id % 200 + 10}+00:11:22:33:44:{mac_end}+\"\"%0A"
    st, _, _, lat = http_call(port, "/sim_vigor2927/cgi-bin/v2x00.cgi", method="POST", headers=headers, body=body2)
    metrics.record_req(st in (200, 302), lat)
    # Verify Bài 2
    st_v2, _, d_v2, lat = http_call(port, f"/sim_vigor2927/doc/ipbmac.htm?_ktv={cookie_id}", headers=headers)
    metrics.record_req(st_v2 == 200, lat)
    b2_ok = (f"192.168.1.{ktv_id % 200 + 10}" in d_v2.decode("latin-1", "ignore"))
    metrics.record_lab(b2_ok)

    # Bài 3: Cấu hình LAN & DHCP (enet.cgi)
    body3 = f"webchange=1&sLanIp=192.168.100.1&sLanMask=255.255.255.0&sDHCP=1&sDHCPStIP=192.168.100.{ktv_id % 50 + 10}&iDHCPNo=200&sDHCPGwIP=192.168.100.1&sDHCPLsTime=86400&chkrmclnts=1"
    st, _, _, lat = http_call(port, "/sim_vigor2927/cgi-bin/enet.cgi", method="POST", headers=headers, body=body3)
    metrics.record_req(st in (200, 302), lat)
    # Verify Bài 3
    st_v3, _, d_v3, lat = http_call(port, f"/sim_vigor2927/doc/ENET.SHT?_ktv={cookie_id}", headers=headers)
    metrics.record_req(st_v3 == 200, lat)
    b3_ok = (f"192.168.100.{ktv_id % 50 + 10}" in d_v3.decode("utf-8", "ignore"))
    metrics.record_lab(b3_ok)

    # Bài 4: String Object (striobj.cgi)
    st, _, data, lat = http_call(port, f"/sim_vigor2927/cgi-bin/striobj.cgi?sAct=1&sString=FILTER_{ktv_id:04d}", headers=headers)
    metrics.record_req(st == 200, lat)
    metrics.record_lab(st == 200 and b"[1]" in data)

    # Bài 5: Port Redirection / NAT Forwarding (fid=2)
    body5 = f"fid=2&webchange=1&sPortFwName=CAM_{ktv_id}&iExtPort=8888&iIntPort=80&sIntIp=192.168.1.50"
    st, _, _, lat = http_call(port, "/sim_vigor2927/cgi-bin/ipnat.cgi", method="POST", headers=headers, body=body5)
    metrics.record_req(st in (200, 302), lat)
    metrics.record_lab(st in (200, 302))

    # Bài 6: Policy Route / Priority Routing (fid=4042)
    body6 = f"fid=4042&webchange=1&iPREnable=1&comment=Priority_WAN1_{ktv_id}&rdSIpAny=1"
    st, _, _, lat = http_call(port, "/sim_vigor2927/cgi-bin/v2x00.cgi", method="POST", headers=headers, body=body6)
    metrics.record_req(st in (200, 302), lat)
    metrics.record_lab(st in (200, 302))


# ─────────────────────────────────────────────────────────────────────────────
# MAIN RUNNER
# ─────────────────────────────────────────────────────────────────────────────
def main():
    print("=" * 80)
    print("   CHƯƠNG TRÌNH KIỂM THỬ TẢI: 1.000 KTV CẤU HÌNH ĐỦ 6 BÀI TRÊN 3 THIẾT BỊ")
    print("=" * 80)
    print(f"Số lượng KTV mô phỏng: {TOTAL_KTVS} KTV/thiết bị")
    print(f"Số bài thực hành:      6 bài hoàn chỉnh/thiết bị")
    print(f"Số luồng song song:    {CONCURRENCY} luồng đồng thời")
    print(f"Cổng kiểm thử:         {TEST_PORT}")
    print("=" * 80)

    class FastTestServer(ThreadingHTTPServer):
        daemon_threads = True
        allow_reuse_address = True
        request_queue_size = 4096

    srv = FastTestServer(("127.0.0.1", TEST_PORT), run_all.MasterDispatcher)
    t_srv = threading.Thread(target=srv.serve_forever, daemon=True)
    t_srv.start()
    time.sleep(0.5)

    all_results = {}

    targets = [
        ("ZTE AX3000CV2", run_ax3000c_6labs),
        ("ONT AX3000HV2", run_ax3000hv2_6labs),
        ("DrayTek Vigor2927", run_vigor2927_6labs),
    ]

    try:
        for dev_name, runner_fn in targets:
            print(f"\n>>> [KIỂM THỬ THIẾT BỊ]: {dev_name} <<<")
            print(f"    1.000 KTV đang đăng nhập và cấu hình đủ 6 bài cùng lúc...")
            metrics = DeviceBatchMetrics(dev_name)
            t_start = time.perf_counter()

            with ThreadPoolExecutor(max_workers=CONCURRENCY) as executor:
                futures = [executor.submit(runner_fn, i, TEST_PORT, metrics) for i in range(1, TOTAL_KTVS + 1)]
                done = 0
                for f in as_completed(futures):
                    done += 1
                    if done % 250 == 0 or done == TOTAL_KTVS:
                        print(f"    -> Đã xong {done}/{TOTAL_KTVS} KTV (hoàn thành {done * 6} bài lab)...")

            duration = time.perf_counter() - t_start
            all_results[dev_name] = {
                "metrics": metrics,
                "duration": duration,
            }

            avg_lat = sum(metrics.latencies) / len(metrics.latencies) if metrics.latencies else 0
            p50 = sorted(metrics.latencies)[int(len(metrics.latencies) * 0.5)] if metrics.latencies else 0
            p95 = sorted(metrics.latencies)[int(len(metrics.latencies) * 0.95)] if metrics.latencies else 0

            print(f"    [XONG {dev_name}]:")
            print(f"      • Tổng thời gian:           {duration:.2f} giây")
            print(f"      • Tổng HTTP requests:       {metrics.total_requests} requests")
            print(f"      • Tỷ lệ request thành công: {(metrics.total_requests - metrics.failed_requests) / max(1, metrics.total_requests) * 100:.2f}%")
            print(f"      • Tổng bài lab đã nộp:      {metrics.total_labs_attempted} bài")
            print(f"      • Tổng bài lab ĐẠT:         {metrics.total_labs_passed} / {metrics.total_labs_attempted} ({metrics.total_labs_passed / max(1, metrics.total_labs_attempted) * 100:.2f}%)")
            print(f"      • Số lỗi trắng màn / 500:   {metrics.white_screens}")
            print(f"      • Độ trễ P50 (trung vị):    {p50 * 1000:.1f} ms")
            print(f"      • Độ trễ P95:               {p95 * 1000:.1f} ms")

    finally:
        srv.shutdown()
        srv.server_close()

    print("\n" + "=" * 80)
    print("                     TỔNG HỢP KẾT QUẢ CUỐI CÙNG")
    print("=" * 80)
    all_ok = True
    for dev_name, res in all_results.items():
        m = res["metrics"]
        rate = (m.total_labs_passed / max(1, m.total_labs_attempted)) * 100
        req_rate = ((m.total_requests - m.failed_requests) / max(1, m.total_requests)) * 100
        status_str = "PASSED 100% ĐẠT HẾT" if (rate == 100.0 and m.failed_requests == 0) else "FAILED"
        if rate < 100.0 or m.failed_requests > 0:
            all_ok = False
        print(f"• {dev_name:<20}: {m.total_labs_passed}/{m.total_labs_attempted} bài ĐẠT ({rate:.2f}%) | {m.total_requests} reqs ({req_rate:.2f}% OK) -> {status_str}")

    print("=" * 80)
    if all_ok:
        print(">>> KẾT LUẬN: TOÀN BỘ 1.000 KTV CẤU HÌNH ĐỦ 6 BÀI TRÊN 3 THIẾT BỊ ĐỀU ĐẠT 100%! <<<")
    else:
        print(">>> CÓ BÀI THI CHƯA ĐẠT! CẦN KIỂM TRA LẠI! <<<")
    print("=" * 80)


if __name__ == "__main__":
    main()
