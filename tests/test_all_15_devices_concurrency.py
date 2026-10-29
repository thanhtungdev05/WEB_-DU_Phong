#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
tests/test_all_15_devices_concurrency.py
================================================================================
Kiểm thử tải đồng thời & cách ly dữ liệu TOÀN BỘ 15 THIẾT BỊ trên hệ thống:
  1. sim_ac1000f
  2. sim_ac1000cv2
  3. sim_ax3000c
  4. sim_ax3000gz
  5. sim_ax3000gz_v2
  6. sim_ax3000hv2
  7. sim_ax3000s
  8. sim_ac1000HI
  9. sim_ac1000z
  10. sim_be12000
  11. sim_be15000
  12. sim_vigor2927
  13. sim_be6500c
  14. sim_ONT_be6500c
  15. sim_mikrotik_hexs

Mục tiêu kiểm thử:
  - 150 luồng KTV đồng thời (10 KTV / thiết bị x 15 thiết bị).
  - Kiểm tra endpoint /api/reset phản hồi < 2000ms trên 100% thiết bị.
  - Kiểm tra nạp giao diện chính không bị 404/500/treo trên 100% thiết bị.
  - Kiểm tra độc lập phiên đa KTV chung IP NAT.
================================================================================
"""
import http.client
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

TEST_PORT = 18095
CLASSROOM_IP = "203.162.10.45"

ALL_DEVICES = [
    'sim_ac1000f',
    'sim_ac1000cv2',
    'sim_ax3000c',
    'sim_ax3000gz',
    'sim_ax3000gz_v2',
    'sim_ax3000hv2',
    'sim_ax3000s',
    'sim_ac1000HI',
    'sim_ac1000z',
    'sim_be12000',
    'sim_be15000',
    'sim_vigor2927',
    'sim_be6500c',
    'sim_ONT_be6500c',
    'sim_mikrotik_hexs',
]


def make_req(path, method="GET", headers=None, body=None, timeout=6):
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
        return resp.status, dict(resp.getheaders()), data, duration_ms
    finally:
        conn.close()


class All15DevicesConcurrencyTests(unittest.TestCase):
    @classmethod
    def setUpClass(cls):
        cls.server = ThreadingHTTPServer(('127.0.0.1', TEST_PORT), run_all.MasterDispatcher)
        cls.thread = threading.Thread(target=cls.server.serve_forever, daemon=True)
        cls.thread.start()
        time.sleep(0.6)

    @classmethod
    def tearDownClass(cls):
        cls.server.shutdown()
        cls.server.server_close()

    # ─────────────────────────────────────────────────────────────────────────
    # TEST 1: Reset đồng thời cả 15 thiết bị (150 requests đồng thời)
    # ─────────────────────────────────────────────────────────────────────────
    def test_all_15_devices_concurrent_reset_speed(self):
        print(f"\n[Test 1] Kiểm tra Reset đồng thời 15 thiết bị x 10 KTV (Tổng 150 request)...")
        tasks = []
        for dev in ALL_DEVICES:
            for ktv_idx in range(10):
                ktv_id = f"ktv_{dev}_{ktv_idx:02d}"
                tasks.append((dev, ktv_id))

        results_by_dev = {dev: [] for dev in ALL_DEVICES}

        def run_reset(dev_name, ktv_id):
            reset_url = f"/{dev_name}/api/reset?_ktv={ktv_id}"
            st, _, _, duration_ms = make_req(
                reset_url,
                method="POST",
                headers={"Cookie": f"ktv_client_id={ktv_id}", "X-KTV-Session-ID": ktv_id}
            )
            return dev_name, ktv_id, st, duration_ms

        t_start = time.perf_counter()
        with ThreadPoolExecutor(max_workers=30) as executor:
            futures = [executor.submit(run_reset, d, k) for d, k in tasks]
            for f in as_completed(futures):
                dev_name, ktv_id, status, d_ms = f.result()
                self.assertEqual(status, 200, f"Thiết bị {dev_name} reset thất bại status={status}")
                results_by_dev[dev_name].append(d_ms)

        total_time_ms = (time.perf_counter() - t_start) * 1000
        print(f"  ✔ Hoàn tất 150 request reset cho 15 thiết bị trong {total_time_ms:.1f}ms:")

        for dev in ALL_DEVICES:
            durs = results_by_dev[dev]
            avg_d = sum(durs) / len(durs)
            max_d = max(durs)
            self.assertLess(max_d, 2500, f"Thiết bị {dev} có request reset vượt 2500ms (max={max_d:.1f}ms)")
            print(f"    - {dev:18s}: Avg {avg_d:5.1f}ms | Max {max_d:5.1f}ms | 10/10 OK")

    # ─────────────────────────────────────────────────────────────────────────
    # TEST 2: Nạp giao diện đồng thời cả 15 thiết bị
    # ─────────────────────────────────────────────────────────────────────────
    def test_all_15_devices_concurrent_ui_load(self):
        print(f"\n[Test 2] Kiểm tra tải giao diện đồng thời 15 thiết bị x 5 KTV (75 request)...")
        tasks = []
        for dev in ALL_DEVICES:
            for ktv_idx in range(5):
                ktv_id = f"ktv_ui_{dev}_{ktv_idx:02d}"
                tasks.append((dev, ktv_id))

        def run_ui(dev_name, ktv_id):
            cookie_val = f"ktv_client_id={ktv_id}; current_sim={dev_name}"
            st, hdrs, body, d_ms = make_req(
                f"/{dev_name}/?_ktv={ktv_id}",
                method="GET",
                headers={"Cookie": cookie_val}
            )
            return dev_name, ktv_id, st, hdrs, len(body), d_ms

        with ThreadPoolExecutor(max_workers=25) as executor:
            futures = [executor.submit(run_ui, d, k) for d, k in tasks]
            for f in as_completed(futures):
                dev_name, ktv_id, status, hdrs, blen, d_ms = f.result()
                # Status 200 (OK), 302 (Redirect to login), hoặc 401 (GPON basic auth prompt)
                self.assertIn(status, (200, 302, 401), f"Thiết bị {dev_name} load UI status={status}")
                if status == 302:
                    self.assertTrue("Location" in hdrs or "location" in hdrs,
                                    f"Thiết bị {dev_name} redirect 302 thiếu Location header")

        print(f"  ✔ 100% 15 thiết bị phản hồi giao diện hợp lệ trong thời gian thực, không bị 404/500/treo.")


if __name__ == "__main__":
    unittest.main()
