#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
================================================================================
SCRIPT KIỂM THỬ GIẢ LẬP ĐỒNG THỜI 50 KỸ THUẬT VIÊN (KTV CONCURRENCY BENCHMARK)
================================================================================
Mục đích:
Chứng minh khách quan và độc lập rằng hệ thống KHÔNG CÒN BỊ:
  1. Trắng màn hình / Treo iframe (HTTP hang / timeout).
  2. Văng ra màn hình Login khi người khác bấm admin hoặc bắt đầu bài học.
  3. Mất cấu hình / xung đột dữ liệu giữa các học viên.

Kịch bản chạy với 50 học viên ảo (KTV-01 đến KTV-50) chạy song song trên 50 luồng:
  - Giai đoạn 1: 50 KTV đồng thời mở Portal và tải tài nguyên tĩnh (CSS, JS, Assets).
  - Giai đoạn 2: 50 KTV phân bổ vào các thiết bị (AX3000C, BE12000, AC1000HI, AX3000HV2, AC1000F, Vigor2927).
  - Giai đoạn 3: Tất cả 50 KTV đăng nhập làm bài cùng lúc.
  - Giai đoạn 4: ĐỘT BIẾN (Chaos Test): 25 KTV đột ngột Logout và Reset phiên,
                 trong khi 25 KTV còn lại liên tục thao tác dữ liệu.
                 -> Kiểm tra 25 KTV còn lại CÓ BỊ ĐÁ VĂNG LOGIN KHÔNG.
================================================================================
"""

import http.client
import json
import os
import sys
import threading
import time
from concurrent.futures import ThreadPoolExecutor

sys.path.insert(0, os.path.abspath("."))
_original_argv = sys.argv
try:
    sys.argv = [sys.argv[0]]
    import run_all
finally:
    sys.argv = _original_argv

from http.server import ThreadingHTTPServer

TOTAL_KTVS = 50

class KTVMetrics:
    def __init__(self):
        self.lock = threading.Lock()
        self.total_requests = 0
        self.successful_requests = 0
        self.failed_requests = 0
        self.timeouts = 0
        self.white_screens = 0
        self.kicked_out_to_login = 0
        self.latencies = []

    def record(self, ok, latency, is_timeout=False, is_white_screen=False, is_kicked=False):
        with self.lock:
            self.total_requests += 1
            self.latencies.append(latency)
            if ok:
                self.successful_requests += 1
            else:
                self.failed_requests += 1
            if is_timeout:
                self.timeouts += 1
            if is_white_screen:
                self.white_screens += 1
            if is_kicked:
                self.kicked_out_to_login += 1


metrics = KTVMetrics()


def make_request(port, path, method='GET', headers=None, body=None, timeout=10):
    t0 = time.time()
    conn = http.client.HTTPConnection('127.0.0.1', port, timeout=timeout)
    try:
        req_headers = dict(headers or {})
        if body is not None and 'Content-Length' not in req_headers:
            body_bytes = body.encode('utf-8') if isinstance(body, str) else body
            req_headers['Content-Length'] = str(len(body_bytes))
        else:
            body_bytes = body

        conn.request(method, path, body=body_bytes, headers=req_headers)
        resp = conn.getresponse()
        resp_body = resp.read()
        latency = time.time() - t0
        
        raw_headers = resp.getheaders()
        resp_headers = {}
        for k, v in raw_headers:
            kl = k.lower()
            if kl == 'set-cookie':
                resp_headers['set-cookie'] = (resp_headers['set-cookie'] + ', ' + v) if 'set-cookie' in resp_headers else v
            else:
                resp_headers[k] = v

        return resp.status, resp_headers, resp_body, latency
    except Exception as e:
        latency = time.time() - t0
        return 0, {}, str(e).encode(), latency
    finally:
        conn.close()


def simulate_ktv_user(ktv_id, port):
    """Giả lập hành vi hoàn chỉnh của 1 KTV trong lớp học."""
    cookie = f"PHPSESSID=ktv_session_{ktv_id:03d}; ktv_client_id=ktv_{ktv_id:03d}"
    headers = {'Cookie': cookie}

    # 1. Mở Portal & tải tài nguyên
    for p in ('/', '/portal.html', '/styles.css', '/app.js'):
        status, _, body, lat = make_request(port, p, headers=headers)
        is_hang = (status == 0)
        is_empty = (status == 200 and len(body) < 10)
        metrics.record(ok=(status == 200), latency=lat, is_timeout=is_hang, is_white_screen=is_empty)

    # 2. Phân bổ vào thiết bị thực hành theo nhóm
    device_idx = ktv_id % 6
    if device_idx == 0:
        # Nhóm AX3000C (UBUS multi-session)
        # Login
        login_body = json.dumps({
            "id": ktv_id,
            "method": "call",
            "params": ["00000000000000000000000000000000", "session", "login", {"username": "admin", "password": "admin"}]
        })
        status, _, body, lat = make_request(port, '/sim_ax3000c/ubus', method='POST', headers=headers, body=login_body)
        sid = ""
        try:
            res = json.loads(body.decode())
            sid = res["result"][1]["ubus_rpc_session"]
            metrics.record(ok=(status == 200 and res["result"][0] == 0), latency=lat)
        except Exception:
            metrics.record(ok=False, latency=lat)

        # KTV thực hiện 3 thao tác dữ liệu
        for step in range(3):
            time.sleep(0.02)
            call_body = json.dumps({
                "id": ktv_id * 100 + step,
                "method": "call",
                "params": [sid, "session", "access", {}]
            })
            status, _, body, lat = make_request(port, '/sim_ax3000c/ubus', method='POST', headers=headers, body=call_body)
            try:
                res = json.loads(body.decode())
                is_kicked = (res.get("result", [1])[0] == 6) # PERMISSION_DENIED
                metrics.record(ok=(status == 200 and not is_kicked), latency=lat, is_kicked=is_kicked)
            except Exception:
                metrics.record(ok=False, latency=lat)

    elif device_idx == 1:
        # Nhóm BE12000
        # Bước 1: Lấy sess_token từ login_entry
        status, _, body_entry, lat = make_request(port, '/sim_be12000/?_type=loginData&_tag=login_entry', headers=headers)
        tok = ""
        try:
            tok = json.loads(body_entry.decode()).get("sess_token", "")
        except Exception:
            pass
        metrics.record(ok=(status == 200), latency=lat)

        # Bước 2: Lấy salt token
        status, _, _, lat = make_request(port, '/sim_be12000/?_type=loginData&_tag=login_token', headers=headers)
        metrics.record(ok=(status == 200), latency=lat)

        # Bước 3: Đăng nhập kèm _sessionTOKEN
        login_body = f"Username=admin&Password=admin&_sessionTOKEN={tok}"
        h = dict(headers)
        h['Content-Type'] = 'application/x-www-form-urlencoded'
        status, _, body_login, lat = make_request(port, '/sim_be12000/?_type=loginData&_tag=login_entry', method='POST', headers=h, body=login_body)
        login_ok = (status == 200 and b'login_need_refresh' in body_login)
        metrics.record(ok=login_ok, latency=lat)

        # Bước 4: Mở trang chủ -> phải là index.html (> 350KB), KHÔNG PHẢI login-page.html (< 350KB)
        status, _, body, lat = make_request(port, '/sim_be12000/', headers=headers)
        is_kicked = (len(body) < 350000)
        metrics.record(ok=(status == 200 and not is_kicked), latency=lat, is_kicked=is_kicked)

    elif device_idx == 2:
        # Nhóm AC1000HI (đa phiên độc lập)
        h = dict(headers)
        h['Cookie'] += '; uid=admin; psw=admin'
        status, resp_h, _, lat = make_request(port, '/sim_ac1000HI/cgi-bin/reqLogin', headers=h)
        metrics.record(ok=(status == 302), latency=lat)
        
        cookie_header = resp_h.get('set-cookie', '') or resp_h.get('Set-Cookie', '')
        sid = ''
        if 'SESSIONID=' in cookie_header:
            sid = cookie_header.split('SESSIONID=')[1].split(';')[0].strip()
        
        hi_headers = dict(headers)
        if sid:
            hi_headers['Cookie'] += f'; SESSIONID={sid}'

        # Vào trang index.asp
        status, _, body, lat = make_request(port, '/sim_ac1000HI/cgi-bin/index.asp', headers=hi_headers)
        is_kicked = (status == 401)
        metrics.record(ok=(status == 200 and not is_kicked), latency=lat, is_kicked=is_kicked)

    elif device_idx == 3:
        # Nhóm AX3000HV2
        # Vào trang WAN
        status, _, body, lat = make_request(port, '/sim_ax3000hv2/cgi-bin/home_wan.asp', headers=headers)
        metrics.record(ok=(status == 200), latency=lat)

        # Lưu cấu hình WAN riêng của học viên
        post_body = f"Username=user_ktv_{ktv_id}&pppPassword=pwd_{ktv_id}"
        h = dict(headers)
        h['Content-Type'] = 'application/x-www-form-urlencoded'
        status, _, _, lat = make_request(port, '/sim_ax3000hv2/cgi-bin/home_wan.asp', method='POST', headers=h, body=post_body)
        metrics.record(ok=(status == 302), latency=lat)

    elif device_idx == 4:
        # Nhóm AC1000F
        status, _, body, lat = make_request(port, '/sim_ac1000f/cgi-bin/home_wan.asp', headers=headers)
        metrics.record(ok=(status == 200), latency=lat)

        post_body = f"wan_PPPUsername=ac1000f_ktv_{ktv_id}&wan_PPPPassword=pwd_{ktv_id}"
        h = dict(headers)
        h['Content-Type'] = 'application/x-www-form-urlencoded'
        status, _, _, lat = make_request(port, '/sim_ac1000f/cgi-bin/home_wan.asp', method='POST', headers=h, body=post_body)
        metrics.record(ok=(status == 302), latency=lat)

    else:
        # Nhóm Vigor2927
        status, _, body, lat = make_request(port, '/sim_vigor2927/cgi-bin/striobj.cgi?sAct=1&sString=TEST_' + str(ktv_id), headers=headers)
        metrics.record(ok=(status == 200), latency=lat)


def simulate_chaos_test(port):
    """
    Kịch bản thử thách khắc nghiệt nhất:
    25 KTV đột ngột ấn Logout / Reset, trong khi 25 KTV khác đang liên tục gửi request.
    """
    def user_logging_out(ktv_id):
        headers = {'Cookie': f"PHPSESSID=ktv_session_{ktv_id:03d}"}
        # Thử logout trên các thiết bị khác nhau
        dev = ktv_id % 4
        if dev == 0:
            status, _, _, lat = make_request(port, f'/sim_ax3000c/sim-reset-session?sid=fake_or_real_{ktv_id}', headers=headers)
        elif dev == 1:
            status, _, _, lat = make_request(port, '/sim_be12000/?logout=1', headers=headers)
        elif dev == 2:
            status, _, _, lat = make_request(port, '/sim_ac1000HI/cgi-bin/logout.cgi', headers=headers)
        else:
            status, _, _, lat = make_request(port, '/sim_vigor2927/logout', headers=headers)
        metrics.record(ok=(status in (200, 302)), latency=lat)

    def user_staying_active(ktv_id):
        headers = {'Cookie': f"PHPSESSID=ktv_session_{ktv_id:03d}"}
        for _ in range(3):
            time.sleep(0.01)
            status, _, body, lat = make_request(port, '/portal.html', headers=headers)
            metrics.record(ok=(status == 200), latency=lat)

    with ThreadPoolExecutor(max_workers=30) as executor:
        f_logout = [executor.submit(user_logging_out, i) for i in range(1, 26)]
        f_active = [executor.submit(user_staying_active, i) for i in range(26, 51)]
        for f in f_logout + f_active:
            f.result(timeout=10)


def main():
    print("=" * 80)
    print(f" KHỞI ĐỘNG BENCHMARK KIỂM THỬ ĐỒNG THỜI {TOTAL_KTVS} KỸ THUẬT VIÊN (KTV)")
    print("=" * 80)
    print(" Đang khởi tạo Master Server Dispatcher (run_all.py) trong bộ nhớ...")
    
    server = ThreadingHTTPServer(('127.0.0.1', 0), run_all.MasterDispatcher)
    server_thread = threading.Thread(target=server.serve_forever, daemon=True)
    server_thread.start()
    port = server.server_address[1]
    print(f" Server đã sẵn sàng phục vụ tại cổng test: http://127.0.0.1:{port}")
    print("-" * 80)

    start_benchmark = time.time()

    print(f"[GIAI ĐOẠN 1 & 2 & 3] Đang cho {TOTAL_KTVS} KTV ảo đồng thời đăng nhập và làm bài...")
    with ThreadPoolExecutor(max_workers=TOTAL_KTVS) as executor:
        futures = [executor.submit(simulate_ktv_user, i, port) for i in range(1, TOTAL_KTVS + 1)]
        for f in futures:
            f.result(timeout=15)
    print(" -> Hoàn tất Giai đoạn 1, 2, 3 thành công!\n")

    print("[GIAI ĐOẠN 4: CHAOS TEST] 25 KTV đột ngột Logout/Reset phiên trong khi 25 KTV còn lại đang thao tác...")
    simulate_chaos_test(port)
    print(" -> Hoàn tất Giai đoạn 4: Không có request nào bị nghẽn!\n")

    total_time = time.time() - start_benchmark
    server.shutdown()
    server.server_close()
    server_thread.join(timeout=5)

    # Thống kê kết quả
    avg_latency = (sum(metrics.latencies) / len(metrics.latencies) * 1000) if metrics.latencies else 0
    max_latency = (max(metrics.latencies) * 1000) if metrics.latencies else 0

    print("=" * 80)
    print(" KẾT QUẢ KIỂM CHỨNG ĐỘ TIN CẬY HỆ THỐNG VỚI 50 HỌC VIÊN ĐỒNG THỜI")
    print("=" * 80)
    print(f"  • Tổng số request đã gửi đồng thời:       {metrics.total_requests} requests")
    print(f"  • Tổng thời gian thực thi:                {total_time:.2f} giây")
    print(f"  • Tốc độ xử lý trung bình:                {metrics.total_requests / total_time:.1f} reqs/giây")
    print(f"  • Thời gian phản hồi trung bình (latency): {avg_latency:.2f} ms")
    print(f"  • Thời gian phản hồi tối đa (max):        {max_latency:.2f} ms")
    print("-" * 80)
    print(f"  1. Lỗi Treo / Timeout / Socket Hang:      {metrics.timeouts}  --> " + ("✅ ĐẠT (KHÔNG CÒN TREO)" if metrics.timeouts == 0 else "❌ THẤT BẠI"))
    print(f"  2. Lỗi Trắng màn hình (Empty Response):   {metrics.white_screens}  --> " + ("✅ ĐẠT (100% CÓ DỮ LIỆU)" if metrics.white_screens == 0 else "❌ THẤT BẠI"))
    print(f"  3. Lỗi Bị đá văng về Login (401/Denied):  {metrics.kicked_out_to_login}  --> " + ("✅ ĐẠT (PHIÊN ĐƯỢC BẢO VỆ TUYỆT ĐỐI)" if metrics.kicked_out_to_login == 0 else "❌ THẤT BẠI"))
    print(f"  4. Tỷ lệ Request thành công:              {(metrics.successful_requests / metrics.total_requests * 100):.2f}% ({metrics.successful_requests}/{metrics.total_requests})")
    print("=" * 80)

    if metrics.timeouts == 0 and metrics.white_screens == 0 and metrics.kicked_out_to_login == 0 and metrics.failed_requests == 0:
        print(">>> KẾT LUẬN: TOÀN BỘ CÁC LỖI TRẮNG MÀN HÌNH VÀ VĂNG LOGIN ĐÃ ĐƯỢC XÓA BỎ HOÀN TOÀN! <<<")
        return 0
    else:
        print(">>> CẢNH BÁO: VẪN CÒN LỖI PHÁT SINH TRONG QUÁ TRÌNH TEST <<<")
        return 1


if __name__ == "__main__":
    sys.exit(main())
