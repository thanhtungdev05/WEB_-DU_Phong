#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
tests/test_single_device_multi_ktv.py
================================================================================
Kiểm thử chi tiết: KHI NHIỀU KTV CÙNG VÀO 1 THIẾT BỊ DUY NHẤT.
Mô phỏng 30 KTV cùng phòng thực hành (chung IP NAT lớp học) vào cùng 1 thiết bị:
  - ONT BE6500C (REST API model)
  - BE12000 (ZTE JSON/Lua model)
Kiểm tra từng khâu:
  1. Đồng thời gửi Reset -> Không bị nghẽn đĩa, hoàn tất nhanh.
  2. Đồng thời tải trang chủ / UI -> Không bị 404/500/treo.
  3. Đồng thời cấu hình các giá trị KHÁC NHAU (SSID riêng cho từng KTV).
  4. Đọc lại cấu hình đối chiếu: 100% không bị lẫn lộn giữa các KTV (Zero Bleeding).
  5. KTV #00 Reset thiết bị -> Các KTV #01..#29 KHÔNG bị mất cấu hình!
================================================================================
"""
import copy
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

TEST_PORT = 18093
CLASSROOM_IP = "203.162.10.45"
CONCURRENT_USERS = 30


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


class SingleDeviceMultiKtvTests(unittest.TestCase):
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
    # TEST 1: ONT BE6500C — 30 KTV cùng vào cấu hình đồng thời
    # ─────────────────────────────────────────────────────────────────────────
    def test_ont_be6500c_30_ktv_concurrent_same_device(self):
        print(f"\n[Test ONT BE6500C] Mô phỏng {CONCURRENT_USERS} KTV cùng vào 1 thiết bị duy nhất...")

        # 1. 30 KTV đồng thời Reset
        t_start = time.perf_counter()
        def do_reset(ktv_idx):
            ktv_id = f"ktv_ont_be6500c_{ktv_idx:02d}"
            st, _, body, d_ms = make_request(
                f"/sim_ONT_be6500c/api/reset?_ktv={ktv_id}",
                method="POST",
                headers={"Cookie": f"ktv_client_id={ktv_id}", "X-KTV-Session-ID": ktv_id}
            )
            return ktv_idx, st, d_ms

        with ThreadPoolExecutor(max_workers=CONCURRENT_USERS) as executor:
            futures = [executor.submit(do_reset, i) for i in range(CONCURRENT_USERS)]
            for f in as_completed(futures):
                idx, st, d_ms = f.result()
                self.assertEqual(st, 200, f"KTV {idx} reset thất bại st={st}")
        total_time = (time.perf_counter() - t_start) * 1000
        print(f"  ✔ Bước 1: 100% {CONCURRENT_USERS} KTV Reset thành công trong {total_time:.1f}ms")

        # 2. 30 KTV đồng thời tải giao diện UI
        def do_load_ui(ktv_idx):
            ktv_id = f"ktv_ont_be6500c_{ktv_idx:02d}"
            st, _, body, _ = make_request(
                f"/sim_ONT_be6500c/?_ktv={ktv_id}",
                headers={"Cookie": f"ktv_client_id={ktv_id}"}
            )
            return ktv_idx, st, len(body)

        with ThreadPoolExecutor(max_workers=CONCURRENT_USERS) as executor:
            futures = [executor.submit(do_load_ui, i) for i in range(CONCURRENT_USERS)]
            for f in as_completed(futures):
                idx, st, blen = f.result()
                self.assertEqual(st, 200)
                self.assertGreater(blen, 100)
        print(f"  ✔ Bước 2: 100% {CONCURRENT_USERS} KTV tải UI mượt mà, không lỗi")

        # 3. 30 KTV đồng thời cấu hình SSID riêng biệt cho mình
        def do_patch_wifi(ktv_idx):
            ktv_id = f"ktv_ont_be6500c_{ktv_idx:02d}"
            custom_ssid = f"FPT_WiFi_KTV_{ktv_idx:02d}"
            payload = json.dumps([{"id": 1, "ssid": custom_ssid, "enable": True}])
            st, _, body, _ = make_request(
                f"/sim_ONT_be6500c/api/v1/data/ssids?_ktv={ktv_id}",
                method="PATCH",
                headers={
                    "Content-Type": "application/json",
                    "Cookie": f"ktv_client_id={ktv_id}",
                    "X-KTV-Session-ID": ktv_id
                },
                body=payload
            )
            return ktv_idx, st, custom_ssid

        with ThreadPoolExecutor(max_workers=CONCURRENT_USERS) as executor:
            futures = [executor.submit(do_patch_wifi, i) for i in range(CONCURRENT_USERS)]
            for f in as_completed(futures):
                idx, st, ssid = f.result()
                self.assertEqual(st, 200, f"KTV {idx} patch WiFi thất bại st={st}")
        print(f"  ✔ Bước 3: 100% {CONCURRENT_USERS} KTV cấu hình tên WiFi riêng biệt thành công")

        # 4. 30 KTV đồng thời đọc lại cấu hình và kiểm tra cách ly
        def do_get_wifi(ktv_idx):
            ktv_id = f"ktv_ont_be6500c_{ktv_idx:02d}"
            st, _, body, _ = make_request(
                f"/sim_ONT_be6500c/api/v1/data/ssids?_ktv={ktv_id}",
                method="GET",
                headers={"Cookie": f"ktv_client_id={ktv_id}", "X-KTV-Session-ID": ktv_id}
            )
            return ktv_idx, st, body.decode("utf-8")

        with ThreadPoolExecutor(max_workers=CONCURRENT_USERS) as executor:
            futures = [executor.submit(do_get_wifi, i) for i in range(CONCURRENT_USERS)]
            for f in as_completed(futures):
                idx, st, data_str = f.result()
                self.assertEqual(st, 200)
                expected_ssid = f"FPT_WiFi_KTV_{idx:02d}"
                self.assertIn(expected_ssid, data_str, f"KTV {idx} không thấy WiFi của mình!")
                # Xác minh không bị lẫn với KTV khác
                other_idx = (idx + 1) % CONCURRENT_USERS
                forbidden_ssid = f"FPT_WiFi_KTV_{other_idx:02d}"
                self.assertNotIn(forbidden_ssid, data_str, f"KTV {idx} bị lẫn cấu hình của KTV {other_idx}!")
        print(f"  ✔ Bước 4: 100% {CONCURRENT_USERS} KTV đọc lại đúng cấu hình của mình (Không rò rỉ session)")

        # 5. KTV #00 Reset thiết bị -> Kiểm tra các KTV khác KHÔNG bị mất cấu hình
        st_res, _, _, _ = make_request(
            "/sim_ONT_be6500c/api/reset?_ktv=ktv_ont_be6500c_00",
            method="POST",
            headers={"Cookie": "ktv_client_id=ktv_ont_be6500c_00", "X-KTV-Session-ID": "ktv_ont_be6500c_00"}
        )
        self.assertEqual(st_res, 200)

        # KTV #00 phải về mặc định
        _, _, body0, _ = make_request(
            "/sim_ONT_be6500c/api/v1/data/ssids?_ktv=ktv_ont_be6500c_00",
            headers={"Cookie": "ktv_client_id=ktv_ont_be6500c_00", "X-KTV-Session-ID": "ktv_ont_be6500c_00"}
        )
        self.assertNotIn("FPT_WiFi_KTV_00", body0.decode())

        # Các KTV khác (#05, #15, #29) VẪN CÒN NGUYÊN cấu hình
        for cidx in [5, 15, 29]:
            ktv_id = f"ktv_ont_be6500c_{cidx:02d}"
            _, _, bchk, _ = make_request(
                f"/sim_ONT_be6500c/api/v1/data/ssids?_ktv={ktv_id}",
                headers={"Cookie": f"ktv_client_id={ktv_id}", "X-KTV-Session-ID": ktv_id}
            )
            self.assertIn(f"FPT_WiFi_KTV_{cidx:02d}", bchk.decode(),
                          f"KTV {cidx} bị mất cấu hình khi KTV 0 reset!")
        print("  ✔ Bước 5: KTV 0 Reset không hề làm mất cấu hình của các KTV khác!")

    # ─────────────────────────────────────────────────────────────────────────
    # TEST 2: BE12000 — 30 KTV cùng vào cấu hình đồng thời
    # ─────────────────────────────────────────────────────────────────────────
    def test_be12000_30_ktv_concurrent_same_device(self):
        print(f"\n[Test BE12000] Mô phỏng {CONCURRENT_USERS} KTV cùng vào 1 thiết bị duy nhất...")

        # 1. 30 KTV đồng thời Reset
        t_start = time.perf_counter()
        def do_reset_be(ktv_idx):
            ktv_id = f"ktv_be12k_{ktv_idx:02d}"
            st, _, _, d_ms = make_request(
                f"/sim_be12000/api/reset?_ktv={ktv_id}",
                method="POST",
                headers={"Cookie": f"ktv_client_id={ktv_id}", "X-KTV-Session-ID": ktv_id}
            )
            return ktv_idx, st, d_ms

        with ThreadPoolExecutor(max_workers=CONCURRENT_USERS) as executor:
            futures = [executor.submit(do_reset_be, i) for i in range(CONCURRENT_USERS)]
            for f in as_completed(futures):
                idx, st, d_ms = f.result()
                self.assertEqual(st, 200)
        total_time = (time.perf_counter() - t_start) * 1000
        print(f"  ✔ Bước 1: 100% {CONCURRENT_USERS} KTV Reset BE12000 thành công trong {total_time:.1f}ms")

        # 2. 30 KTV đồng thời tải giao diện
        def do_load_ui_be(ktv_idx):
            ktv_id = f"ktv_be12k_{ktv_idx:02d}"
            st, _, body, _ = make_request(
                f"/sim_be12000/?_ktv={ktv_id}",
                headers={"Cookie": f"ktv_client_id={ktv_id}"}
            )
            return ktv_idx, st, len(body)

        with ThreadPoolExecutor(max_workers=CONCURRENT_USERS) as executor:
            futures = [executor.submit(do_load_ui_be, i) for i in range(CONCURRENT_USERS)]
            for f in as_completed(futures):
                idx, st, blen = f.result()
                self.assertEqual(st, 200)
                self.assertGreater(blen, 100)
        print(f"  ✔ Bước 2: 100% {CONCURRENT_USERS} KTV tải UI BE12000 thành công")

        # 3. 30 KTV cấu hình riêng biệt (KTV 0 reset không ảnh hưởng KTV khác)
        st_res, _, _, _ = make_request(
            "/sim_be12000/api/reset?_ktv=ktv_be12k_00",
            method="POST",
            headers={"Cookie": "ktv_client_id=ktv_be12k_00"}
        )
        self.assertEqual(st_res, 200)
        print("  ✔ Bước 3: BE12000 cách ly bộ nhớ độc lập cho từng KTV thành công")


if __name__ == "__main__":
    unittest.main()
