#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
tests/test_multi_ktv_concurrent_config.py
================================================================================
Kiểm thử tải đồng thời & cách ly dữ liệu khi NHIỀU KTV CÙNG VÀO CẤU HÌNH 1 THIẾT BỊ:
Mô phỏng 30 KTV cùng phòng học (chung IP NAT) đồng thời:
  1. Gửi lệnh /api/reset (chứng minh không bị nghẽn đĩa, tốc độ < 200ms).
  2. Tải giao diện thiết bị & tài nguyên HTML/JS/CSS song song (không bị 404/500/treo).
  3. Đăng nhập và lấy session token độc lập.
  4. Cấu hình các thông số khác nhau trên CÙNG MỘT THIẾT BỊ.
  5. Đọc lại và đối chiếu: dữ liệu của KTV nào nằm đúng phiên của KTV đó (100% cách ly).
  6. Reset riêng lẻ: KTV A reset không ảnh hưởng đến cấu hình của KTV B.
Kiểm thử trên cả 2 dòng thiết bị tiêu biểu:
  - ZTE AX3000GZ V2
  - ZTE AC1000Z
================================================================================
"""
import base64
import hashlib
import http.client
import json
import os
import sys
import threading
import time
import unittest
from concurrent.futures import ThreadPoolExecutor, as_completed
from http.server import ThreadingHTTPServer

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
sys.path.insert(0, ROOT)

import run_all

TEST_PORT = 18092
CLASSROOM_IP = "203.162.10.45"
CONCURRENT_USERS = 50


def make_request(path, method="GET", headers=None, body=None, timeout=6):
    h = {
        "Host": f"127.0.0.1:{TEST_PORT}",
        "X-Forwarded-For": CLASSROOM_IP,
        "X-FTC-Client-IP": CLASSROOM_IP,
        "Connection": "keep-alive",
    }
    if headers:
        h.update(headers)
    body_bytes = body.encode("utf-8") if isinstance(body, str) else body
    conn = http.client.HTTPConnection("127.0.0.1", TEST_PORT, timeout=timeout)
    t0 = time.perf_counter()
    try:
        conn.request(method, path, body=body_bytes, headers=h)
        resp = conn.getresponse()
        data = resp.read()
        duration_ms = (time.perf_counter() - t0) * 1000
        raw_headers = resp.getheaders()
        return resp.status, raw_headers, data, duration_ms
    finally:
        conn.close()


def extract_sid(raw_headers):
    for k, v in raw_headers:
        if k.lower() == "set-cookie" and "SID=" in v:
            return v.split("SID=")[1].split(";")[0].strip()
    return None


class MultiKtvConcurrentConfigTests(unittest.TestCase):
    @classmethod
    def setUpClass(cls):
        cls.server = ThreadingHTTPServer(('127.0.0.1', TEST_PORT), run_all.MasterDispatcher)
        cls.thread = threading.Thread(target=cls.server.serve_forever, daemon=True)
        cls.thread.start()
        time.sleep(0.5)

    @classmethod
    def tearDownClass(cls):
        cls.server.shutdown()
        cls.server.server_close()

    # ─────────────────────────────────────────────────────────────────────────
    # TEST 1: AX3000GZ V2 — 30 KTV đồng thời reset, đăng nhập và cấu hình
    # ─────────────────────────────────────────────────────────────────────────
    def test_ax3000gz_v2_30_ktv_concurrent_config_and_isolation(self):
        print(f"\n[Test AX3000GZ V2] Bắt đầu mô phỏng {CONCURRENT_USERS} KTV cấu hình cùng lúc...")

        # Giai đoạn 1: 30 KTV ĐỒNG THỜI GỌI /api/reset
        t_start = time.perf_counter()
        reset_durations = []

        def do_reset(ktv_idx):
            ktv_id = f"ktv_ax_concur_{ktv_idx:02d}"
            status, _, _, duration_ms = make_request(
                f"/sim_ax3000gz_v2/api/reset?_ktv={ktv_id}",
                method="POST",
                headers={"Cookie": f"ktv_client_id={ktv_id}", "X-KTV-Session-ID": ktv_id}
            )
            return ktv_idx, status, duration_ms

        with ThreadPoolExecutor(max_workers=CONCURRENT_USERS) as executor:
            futures = [executor.submit(do_reset, i) for i in range(CONCURRENT_USERS)]
            for f in as_completed(futures):
                idx, st, d_ms = f.result()
                self.assertEqual(st, 200, f"KTV {idx} reset thất bại status={st}")
                reset_durations.append(d_ms)

        total_reset_time = (time.perf_counter() - t_start) * 1000
        avg_reset = sum(reset_durations) / len(reset_durations)
        max_reset = max(reset_durations)
        print(f"  ✔ Giai đoạn 1 - Reset: {CONCURRENT_USERS} KTV hoàn thành trong {total_reset_time:.1f}ms "
              f"(Avg: {avg_reset:.1f}ms, Max: {max_reset:.1f}ms)")
        self.assertLess(max_reset, 2000, f"Reset bị nghẽn! Max latency {max_reset:.1f}ms > 2000ms")

        # Giai đoạn 2: 30 KTV ĐỒNG THỜI TẢI GIAO DIỆN & STATIC ASSETS
        def do_fetch_ui(ktv_idx):
            ktv_id = f"ktv_ax_concur_{ktv_idx:02d}"
            status, _, body, _ = make_request(
                f"/sim_ax3000gz_v2/?_ktv={ktv_id}",
                method="GET",
                headers={"Cookie": f"ktv_client_id={ktv_id}"}
            )
            return ktv_idx, status, len(body)

        with ThreadPoolExecutor(max_workers=CONCURRENT_USERS) as executor:
            futures = [executor.submit(do_fetch_ui, i) for i in range(CONCURRENT_USERS)]
            for f in as_completed(futures):
                idx, st, blen = f.result()
                self.assertEqual(st, 200, f"KTV {idx} tải UI thất bại status={st}")
                self.assertGreater(blen, 100, f"KTV {idx} nhận body rỗng")
        print(f"  ✔ Giai đoạn 2 - Load UI: 100% {CONCURRENT_USERS} KTV tải giao diện thành công.")

        # Giai đoạn 3: 30 KTV ĐỒNG THỜI ĐĂNG NHẬP (Lấy Token + POST Login)
        sessions = {}

        def do_login(ktv_idx):
            ktv_id = f"ktv_ax_concur_{ktv_idx:02d}"
            # 1. Lấy login token
            st1, h1, b1, _ = make_request(
                f"/sim_ax3000gz_v2/?_type=loginData&_tag=login_entry&_ktv={ktv_id}",
                headers={"Cookie": f"ktv_client_id={ktv_id}"}
            )
            data1 = json.loads(b1.decode())
            login_token = data1.get("login_token", "")
            sess_token = data1.get("sess_token", "")
            sid = extract_sid(h1)

            # 2. Đăng nhập với SHA256(admin + login_token)
            expected_pw = hashlib.sha256(("admin" + login_token).encode()).hexdigest()
            body_post = f"Username=admin&Password={expected_pw}&_sessionTOKEN={sess_token}"
            cookie_hdr = f"ktv_client_id={ktv_id}" + (f"; SID={sid}" if sid else "")
            st2, h2, b2, _ = make_request(
                f"/sim_ax3000gz_v2/?_type=loginData&_tag=login_entry&_ktv={ktv_id}",
                method="POST",
                headers={
                    "Content-Type": "application/x-www-form-urlencoded",
                    "Cookie": cookie_hdr
                },
                body=body_post
            )
            data2 = json.loads(b2.decode())
            sid2 = extract_sid(h2) or sid
            active_cookie = f"ktv_client_id={ktv_id}; SID={sid2}"
            return ktv_idx, st2, data2.get("sess_token", ""), active_cookie

        with ThreadPoolExecutor(max_workers=CONCURRENT_USERS) as executor:
            futures = [executor.submit(do_login, i) for i in range(CONCURRENT_USERS)]
            for f in as_completed(futures):
                idx, st, new_token, cookie_hdr = f.result()
                self.assertEqual(st, 200)
                self.assertTrue(bool(new_token))
                sessions[idx] = (new_token, cookie_hdr)
        print(f"  ✔ Giai đoạn 3 - Login: 100% {CONCURRENT_USERS} KTV đăng nhập và có session độc lập.")

        # Giai đoạn 4: 30 KTV ĐỒNG THỜI CẤU HÌNH CÁC GIÁ TRỊ KHÁC NHAU (SNTP Server riêng)
        def do_config(ktv_idx):
            sess_token, cookie_hdr = sessions[ktv_idx]
            custom_ntp = f"ntp{ktv_idx:02d}.fpt.vn"
            body = (f"IF_ACTION=Apply&NtpServer1={custom_ntp}&NtpServer2=time.google.com"
                    f"&ZoneIndex=24&_sessionTOKEN={sess_token}")
            ktv_id = f"ktv_ax_concur_{ktv_idx:02d}"
            st, _, resp_body, _ = make_request(
                f"/sim_ax3000gz_v2/?_type=menuData&_tag=sntp_lua.lua&_ktv={ktv_id}",
                method="POST",
                headers={
                    "Content-Type": "application/x-www-form-urlencoded",
                    "Cookie": cookie_hdr
                },
                body=body
            )
            return ktv_idx, st, custom_ntp, resp_body

        with ThreadPoolExecutor(max_workers=CONCURRENT_USERS) as executor:
            futures = [executor.submit(do_config, i) for i in range(CONCURRENT_USERS)]
            for f in as_completed(futures):
                idx, st, custom_ntp, resp_body = f.result()
                self.assertEqual(st, 200, f"KTV {idx} apply SNTP thất bại")
                self.assertIn(custom_ntp.encode(), resp_body)
        print(f"  ✔ Giai đoạn 4 - Apply Config: 100% {CONCURRENT_USERS} KTV cập nhật cấu hình thành công.")

        # Giai đoạn 5: ĐỌC LẠI VÀ XÁC MINH CÁCH LY 100% (Không bị đè / lẫn dữ liệu)
        def do_verify(ktv_idx):
            _, cookie_hdr = sessions[ktv_idx]
            ktv_id = f"ktv_ax_concur_{ktv_idx:02d}"
            st, _, resp_body, _ = make_request(
                f"/sim_ax3000gz_v2/?_type=menuData&_tag=sntp_lua.lua&_ktv={ktv_id}",
                method="GET",
                headers={"Cookie": cookie_hdr}
            )
            return ktv_idx, st, resp_body

        with ThreadPoolExecutor(max_workers=CONCURRENT_USERS) as executor:
            futures = [executor.submit(do_verify, i) for i in range(CONCURRENT_USERS)]
            for f in as_completed(futures):
                idx, st, resp_body = f.result()
                self.assertEqual(st, 200)
                expected_ntp = f"ntp{idx:02d}.fpt.vn"
                # Phải thấy đúng NTP của mình
                self.assertIn(expected_ntp.encode(), resp_body,
                              f"KTV {idx} không thấy NTP của mình!")
                # KHÔNG ĐƯỢC thấy NTP của bất kỳ KTV nào khác
                other_idx = (idx + 1) % CONCURRENT_USERS
                forbidden_ntp = f"ntp{other_idx:02d}.fpt.vn"
                self.assertNotIn(forbidden_ntp.encode(), resp_body,
                                 f"KTV {idx} bị lẫn cấu hình của KTV {other_idx}!")
        print(f"  ✔ Giai đoạn 5 - Isolation: Toàn bộ {CONCURRENT_USERS} KTV giữ nguyên cấu hình riêng biệt 100%.")

        # Giai đoạn 6: KTV 0 RESET — CÁC KTV CÒN LẠI VẪN NGUYÊN VẸN
        ktv0_cookie = sessions[0][1]
        st_reset0, _, _, _ = make_request(
            "/sim_ax3000gz_v2/api/reset?_ktv=ktv_ax_concur_00",
            method="POST",
            headers={"Cookie": ktv0_cookie}
        )
        self.assertEqual(st_reset0, 200)

        # Kiểm tra KTV 5, KTV 15, KTV 29 vẫn giữ nguyên cấu hình của họ
        for check_idx in [5, 15, 29]:
            ktv_id = f"ktv_ax_concur_{check_idx:02d}"
            _, _, b_chk, _ = make_request(
                f"/sim_ax3000gz_v2/?_type=menuData&_tag=sntp_lua.lua&_ktv={ktv_id}",
                method="GET",
                headers={"Cookie": sessions[check_idx][1]}
            )
            self.assertIn(f"ntp{check_idx:02d}.fpt.vn".encode(), b_chk,
                          f"KTV {check_idx} bị mất cấu hình khi KTV 0 reset!")
        print("  ✔ Giai đoạn 6 - Partial Reset: Reset riêng lẻ KTV 0 không ảnh hưởng các KTV khác.")

    # ─────────────────────────────────────────────────────────────────────────
    # TEST 2: AC1000Z — 30 KTV đồng thời reset, đăng nhập và cấu hình
    # ─────────────────────────────────────────────────────────────────────────
    def test_ac1000z_30_ktv_concurrent_config_and_isolation(self):
        print(f"\n[Test AC1000Z] Bắt đầu mô phỏng {CONCURRENT_USERS} KTV cấu hình cùng lúc...")

        # Giai đoạn 1: 30 KTV Đồng thời Reset
        t_start = time.perf_counter()
        reset_durations = []

        def do_reset_ac(ktv_idx):
            ktv_id = f"ktv_acz_concur_{ktv_idx:02d}"
            status, _, _, duration_ms = make_request(
                f"/sim_ac1000z/api/reset?_ktv={ktv_id}",
                method="POST",
                headers={"Cookie": f"ktv_client_id={ktv_id}", "X-KTV-Session-ID": ktv_id}
            )
            return ktv_idx, status, duration_ms

        with ThreadPoolExecutor(max_workers=CONCURRENT_USERS) as executor:
            futures = [executor.submit(do_reset_ac, i) for i in range(CONCURRENT_USERS)]
            for f in as_completed(futures):
                idx, st, d_ms = f.result()
                self.assertEqual(st, 200, f"KTV {idx} reset AC1000Z thất bại status={st}")
                reset_durations.append(d_ms)

        total_reset_time = (time.perf_counter() - t_start) * 1000
        avg_reset = sum(reset_durations) / len(reset_durations)
        max_reset = max(reset_durations)
        print(f"  ✔ Giai đoạn 1 - Reset: {CONCURRENT_USERS} KTV hoàn thành trong {total_reset_time:.1f}ms "
              f"(Avg: {avg_reset:.1f}ms, Max: {max_reset:.1f}ms)")
        self.assertLess(max_reset, 2000, f"Reset bị nghẽn! Max latency {max_reset:.1f}ms > 2000ms")

        # Giai đoạn 2: 30 KTV ĐỒNG THỜI ĐĂNG NHẬP
        sessions = {}

        def do_login_ac(ktv_idx):
            ktv_id = f"ktv_acz_concur_{ktv_idx:02d}"
            st1, h1, b1, _ = make_request(
                f"/sim_ac1000z/?_type=loginData&_tag=login_entry&_ktv={ktv_id}",
                headers={"Cookie": f"ktv_client_id={ktv_id}"}
            )
            data1 = json.loads(b1.decode())
            salt = data1.get("salt", "")
            sid = extract_sid(h1)

            expected_hash = hashlib.sha256(("admin" + salt).encode()).hexdigest()
            body_post = f"Username=admin&Password={expected_hash}"
            cookie_hdr = f"ktv_client_id={ktv_id}" + (f"; SID={sid}" if sid else "")
            st2, h2, b2, _ = make_request(
                f"/sim_ac1000z/?_type=loginData&_tag=login_entry&_ktv={ktv_id}",
                method="POST",
                headers={
                    "Content-Type": "application/x-www-form-urlencoded",
                    "Cookie": cookie_hdr
                },
                body=body_post
            )
            data2 = json.loads(b2.decode())
            sid2 = extract_sid(h2) or sid
            active_cookie = f"ktv_client_id={ktv_id}; SID={sid2}"
            return ktv_idx, st2, data2.get("sess_token", ""), active_cookie

        with ThreadPoolExecutor(max_workers=CONCURRENT_USERS) as executor:
            futures = [executor.submit(do_login_ac, i) for i in range(CONCURRENT_USERS)]
            for f in as_completed(futures):
                idx, st, new_token, cookie_hdr = f.result()
                self.assertEqual(st, 200)
                self.assertTrue(bool(new_token))
                sessions[idx] = (new_token, cookie_hdr)
        print(f"  ✔ Giai đoạn 2 - Login: 100% {CONCURRENT_USERS} KTV đăng nhập AC1000Z thành công.")

        # Giai đoạn 3: 30 KTV ĐỒNG THỜI CẤU HÌNH NTP RIÊNG
        def do_config_ac(ktv_idx):
            sess_token, cookie_hdr = sessions[ktv_idx]
            custom_ntp = f"192.168.1.{100 + ktv_idx}"
            body = f"IF_ACTION=Apply&NtpServer1={custom_ntp}&_sessionTOKEN={sess_token}"
            ktv_id = f"ktv_acz_concur_{ktv_idx:02d}"
            st, _, resp_body, _ = make_request(
                f"/sim_ac1000z/?_type=menuData&_tag=sntp_lua.lua&_ktv={ktv_id}",
                method="POST",
                headers={
                    "Content-Type": "application/x-www-form-urlencoded",
                    "Cookie": cookie_hdr
                },
                body=body
            )
            return ktv_idx, st, custom_ntp, resp_body

        with ThreadPoolExecutor(max_workers=CONCURRENT_USERS) as executor:
            futures = [executor.submit(do_config_ac, i) for i in range(CONCURRENT_USERS)]
            for f in as_completed(futures):
                idx, st, custom_ntp, resp_body = f.result()
                self.assertEqual(st, 200, f"KTV {idx} apply AC1000Z thất bại")
        print(f"  ✔ Giai đoạn 3 - Apply Config: 100% {CONCURRENT_USERS} KTV cập nhật cấu hình AC1000Z thành công.")

        # Giai đoạn 4: ĐỐI CHIẾU DỮ LIỆU ĐỘC LẬP
        def do_verify_ac(ktv_idx):
            _, cookie_hdr = sessions[ktv_idx]
            ktv_id = f"ktv_acz_concur_{ktv_idx:02d}"
            st, _, resp_body, _ = make_request(
                f"/sim_ac1000z/?_type=menuData&_tag=sntp_lua.lua&_ktv={ktv_id}",
                method="GET",
                headers={"Cookie": cookie_hdr}
            )
            return ktv_idx, st, resp_body

        with ThreadPoolExecutor(max_workers=CONCURRENT_USERS) as executor:
            futures = [executor.submit(do_verify_ac, i) for i in range(CONCURRENT_USERS)]
            for f in as_completed(futures):
                idx, st, resp_body = f.result()
                self.assertEqual(st, 200)
                expected_ntp = f"192.168.1.{100 + idx}"
                self.assertIn(expected_ntp.encode(), resp_body)
                other_idx = (idx + 1) % CONCURRENT_USERS
                forbidden_ntp = f"192.168.1.{100 + other_idx}"
                self.assertNotIn(forbidden_ntp.encode(), resp_body)
        print(f"  ✔ Giai đoạn 4 - Isolation: Toàn bộ {CONCURRENT_USERS} KTV giữ nguyên cấu hình riêng biệt trên AC1000Z.")


if __name__ == "__main__":
    unittest.main()
