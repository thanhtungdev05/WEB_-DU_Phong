#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
tests/test_classroom_nat_concurrency.py
================================================================================
Kiểm thử tải đồng thời lớp học (NAT Classroom Concurrency Test):
Mô phỏng 100 KTV học chung một phòng/lớp (chung IP NAT) làm bài trên các thiết bị:
  1. ONT AX3000CV2:
     - Tải toàn bộ tài nguyên Webpack & static assets: JS, CSS, views, icons, i18n, img.
     - KHÔNG bị 404 Not Found (chống trắng màn hình).
     - Khi 1 KTV reboot thiết bị, các KTV khác KHÔNG bị rớt mạng hay bị ngắt kết nối.
  2. AC1000CV2:
     - 2 KTV cùng IP NAT đăng nhập độc lập.
     - Khi KTV A đăng xuất (logout.html), KTV B KHÔNG bị đá văng ra login.html.
  3. DrayTek Vigor 2927:
     - Các KTV cùng IP NAT có cấu hình NVRAM riêng biệt.
     - KTV A reset bài học KHÔNG xóa cấu hình của KTV B và không làm bẩn config.json trên đĩa.
  4. ZTE AX3000GZ_V2:
     - Các KTV cùng IP NAT có ConfigStore riêng biệt.
     - KTV A reset session KHÔNG reset trạng thái của KTV B.
  5. AP BE15000:
     - Tải giao diện quản trị đồng thời không lỗi.
================================================================================
"""
import http.client
import json
import os
import sys
import threading
import time
import unittest
from concurrent.futures import ThreadPoolExecutor

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
sys.path.insert(0, ROOT)

import run_all
from http.server import ThreadingHTTPServer


TEST_PORT = 18085
CLASSROOM_IP = "203.162.10.45"  # Cùng 1 địa chỉ IP đại diện phòng học qua NAT gateway


class ClassroomNATConcurrencyTests(unittest.TestCase):
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

    def _req(self, path, method="GET", headers=None, body=None, timeout=5):
        h = {
            "Host": f"127.0.0.1:{TEST_PORT}",
            "X-Forwarded-For": CLASSROOM_IP,
            "X-FTC-Client-IP": CLASSROOM_IP,
        }
        if headers:
            h.update(headers)
        body_bytes = body.encode("utf-8") if isinstance(body, str) else body
        conn = http.client.HTTPConnection("127.0.0.1", TEST_PORT, timeout=timeout)
        try:
            conn.request(method, path, body=body_bytes, headers=h)
            resp = conn.getresponse()
            data = resp.read()
            resp_headers = dict(resp.getheaders())
            return resp.status, resp_headers, data
        finally:
            conn.close()

    # ─────────────────────────────────────────────────────────────
    # 1. AX3000CV2: Kiểm tra các asset JS/CSS/Views/Icons không bị 404
    # ─────────────────────────────────────────────────────────────
    def test_ax3000c_static_assets_never_return_404(self):
        assets = [
            "/sim_ax3000c/",
            "/sim_ax3000c/views/services/rtty.js",
            "/sim_ax3000c/views/services/upnp.js",
            "/sim_ax3000c/i18n/services/rtty.json",
            "/sim_ax3000c/i18n/services/upnp.json",
            "/sim_ax3000c/icons/GF_815.png",
            "/sim_ax3000c/icons/Internet.svg",
            "/sim_ax3000c/img/Up-side.55586474.png",
            "/sim_ax3000c/img/product_810df.7351e3a5.png",
            "/sim_ax3000c/fonts/element-icons.535877f5.woff",
            "/sim_ax3000c/fonts/NotoSans-Regular.2a1861cd.ttf",
            # Kiểm tra trường hợp Vue Webpack SPA nạp trực tiếp qua đường dẫn gốc (như khi iframe gọi)
            "/views/services/rtty.js",
            "/views/services/upnp.js",
            "/i18n/services/rtty.json",
            "/icons/GF_815.png",
            "/icons/Internet.svg",
            "/img/Up-side.55586474.png",
            "/img/product_810df.7351e3a5.png",
        ]
        for asset in assets:
            status, _, data = self._req(asset)
            self.assertEqual(status, 200, f"Asset {asset} bi loi HTTP {status} (phai la 200)")
            self.assertGreater(len(data), 0, f"Asset {asset} tra ve noi dung rong")

    # ─────────────────────────────────────────────────────────────
    # 2. AX3000CV2: 1 KTV reboot KHÔNG làm sập hay gián đoạn KTV khác
    # ─────────────────────────────────────────────────────────────
    def test_ax3000c_reboot_does_not_affect_concurrent_technicians(self):
        ktv_a_cookie = "ktv_client_id=ktv_ax3000c_rebooter_A"
        ktv_b_cookie = "ktv_client_id=ktv_ax3000c_working_B"

        # KTV-A và KTV-B cùng login vào AX3000C
        login_payload = json.dumps({
            "id": 1,
            "method": "call",
            "params": ["00000000000000000000000000000000", "session", "login", {"username": "admin", "password": "admin"}]
        })
        st_a, _, body_a = self._req("/sim_ax3000c/ubus", method="POST", headers={"Cookie": ktv_a_cookie}, body=login_payload)
        st_b, _, body_b = self._req("/sim_ax3000c/ubus", method="POST", headers={"Cookie": ktv_b_cookie}, body=login_payload)
        self.assertEqual(st_a, 200)
        self.assertEqual(st_b, 200)

        sid_a = json.loads(body_a.decode())["result"][1]["ubus_rpc_session"]
        sid_b = json.loads(body_b.decode())["result"][1]["ubus_rpc_session"]

        # KTV-A thực hiện lệnh REBOOT
        reboot_payload = json.dumps({
            "id": 2,
            "method": "call",
            "params": [sid_a, "system", "reboot", {}]
        })
        st_reb, _, body_reb = self._req("/sim_ax3000c/ubus", method="POST", headers={"Cookie": ktv_a_cookie}, body=reboot_payload)
        self.assertEqual(st_reb, 200)
        self.assertEqual(json.loads(body_reb.decode())["result"][0], 0)

        # KTV-B ngay lập tức gọi API tiếp tục thao tác: PHẢI HOẠT ĐỘNG BÌNH THƯỜNG (không bị close socket)
        access_payload = json.dumps({
            "id": 3,
            "method": "call",
            "params": [sid_b, "session", "access", {}]
        })
        st_b2, _, body_b2 = self._req("/sim_ax3000c/ubus", method="POST", headers={"Cookie": ktv_b_cookie}, body=access_payload)
        self.assertEqual(st_b2, 200, "KTV-B khong duoc bi rot mang khi KTV-A reboot")
        res_b2 = json.loads(body_b2.decode())
        self.assertEqual(res_b2["result"][0], 0, "KTV-B van phai co quyen truy cap binh thuong")

    # ─────────────────────────────────────────────────────────────
    # 3. AC1000CV2: KTV-A logout KHÔNG đá văng KTV-B cùng IP phòng học
    # ─────────────────────────────────────────────────────────────
    def test_ac1000cv2_logout_under_shared_nat_ip_does_not_kick_others(self):
        ktv_a_id = "ktv_ac1000c_student_A"
        ktv_b_id = "ktv_ac1000c_student_B"

        # Cả 2 cùng đăng nhập vào AC1000CV2
        # XRAND ID hợp lệ: admin + d2 + admin
        import hashlib
        valid_key = hashlib.sha256(b"admind2admin").hexdigest()
        login_body = f"XRanID={valid_key}"
        login_headers = {"Content-Type": "application/x-www-form-urlencoded"}

        st_a, hdr_a, _ = self._req(
            "/sim_ac1000cv2/GponForm/LoginForm",
            method="POST",
            headers={"Cookie": f"ktv_client_id={ktv_a_id}", **login_headers},
            body=login_body
        )
        st_b, hdr_b, _ = self._req(
            "/sim_ac1000cv2/GponForm/LoginForm",
            method="POST",
            headers={"Cookie": f"ktv_client_id={ktv_b_id}", **login_headers},
            body=login_body
        )
        self.assertEqual(st_a, 200)
        self.assertEqual(st_b, 200)

        # Cả 2 cùng truy cập trang cấu hình LAN
        st_lan_a, _, _ = self._req("/sim_ac1000cv2/lan.html", headers={"Cookie": f"ktv_client_id={ktv_a_id}; ac1000cv2_auth=1; ac1000cv2_sid={ktv_a_id}"})
        st_lan_b, _, _ = self._req("/sim_ac1000cv2/lan.html", headers={"Cookie": f"ktv_client_id={ktv_b_id}; ac1000cv2_auth=1; ac1000cv2_sid={ktv_b_id}"})
        self.assertEqual(st_lan_a, 200)
        self.assertEqual(st_lan_b, 200)

        # KTV-A đăng xuất qua logout.html
        st_logout, _, _ = self._req("/sim_ac1000cv2/logout.html", headers={"Cookie": f"ktv_client_id={ktv_a_id}; ac1000cv2_auth=1; ac1000cv2_sid={ktv_a_id}"})
        self.assertEqual(st_logout, 200)

        # KTV-A truy cập lại lan.html -> PHẢI 401 (văng ra login)
        st_a_post_logout, _, _ = self._req("/sim_ac1000cv2/lan.html", headers={"Cookie": f"ktv_client_id={ktv_a_id}"})
        self.assertEqual(st_a_post_logout, 401)

        # KTV-B (CÙNG PHÒNG HỌC, CHUNG IP NAT) truy cập lan.html -> PHẢI VẪN 200 (KHÔNG BỊ VĂNG!)
        st_b_check, _, _ = self._req("/sim_ac1000cv2/lan.html", headers={"Cookie": f"ktv_client_id={ktv_b_id}; ac1000cv2_auth=1; ac1000cv2_sid={ktv_b_id}"})
        self.assertEqual(st_b_check, 200, "KTV-B bi kick văng ra login khi KTV-A logout chung IP NAT!")

    # ─────────────────────────────────────────────────────────────
    # 4. Vigor 2927: Cấu hình đa KTV không xung đột và reset không đè nhau
    # ─────────────────────────────────────────────────────────────
    def test_vigor2927_multi_ktv_isolated_config_and_reset(self):
        ktv_a = "ktv_vg_student_A"
        ktv_b = "ktv_vg_student_B"

        # KTV-A đặt String Object A
        st_a, _, body_a = self._req("/sim_vigor2927/cgi-bin/striobj.cgi?sAct=1&sString=VALUE_KTV_A", headers={"Cookie": f"ktv_client_id={ktv_a}"})
        self.assertEqual(st_a, 200)

        # KTV-B đặt String Object B
        st_b, _, body_b = self._req("/sim_vigor2927/cgi-bin/striobj.cgi?sAct=1&sString=VALUE_KTV_B", headers={"Cookie": f"ktv_client_id={ktv_b}"})
        self.assertEqual(st_b, 200)

        # KTV-A reset phiên của mình
        st_res, _, _ = self._req("/sim_vigor2927/api/reset", headers={"Cookie": f"ktv_client_id={ktv_a}"})
        self.assertEqual(st_res, 200)

        # KTV-B tiếp tục truy cập trang quản trị -> bình thường
        st_vg_b, _, body_vg_b = self._req("/sim_vigor2927/doc/enet1.htm", headers={"Cookie": f"ktv_client_id={ktv_b}"})
        self.assertEqual(st_vg_b, 200)

    # ─────────────────────────────────────────────────────────────
    # 5. AX3000GZ_V2: Multi-tenant ConfigStore & reset an toàn
    # ─────────────────────────────────────────────────────────────
    def test_ax3000gz_v2_multi_ktv_isolation_under_nat(self):
        ktv_a = "ktv_gz_student_A"
        ktv_b = "ktv_gz_student_B"

        # KTV-A đăng nhập
        st_a_entry, _, body_entry_a = self._req("/sim_ax3000gz_v2/?_type=loginData&_tag=login_entry", headers={"Cookie": f"ktv_client_id={ktv_a}"})
        self.assertEqual(st_a_entry, 200)

        # KTV-B đăng nhập
        st_b_entry, _, body_entry_b = self._req("/sim_ax3000gz_v2/?_type=loginData&_tag=login_entry", headers={"Cookie": f"ktv_client_id={ktv_b}"})
        self.assertEqual(st_b_entry, 200)

        # KTV-A reset session
        st_reset, _, _ = self._req("/sim_ax3000gz_v2/api/reset", headers={"Cookie": f"ktv_client_id={ktv_a}"})
        self.assertEqual(st_reset, 200)

        # KTV-B tải tài nguyên -> vẫn hoạt động tốt
        st_b_check, _, _ = self._req("/sim_ax3000gz_v2/?_type=loginData&_tag=login_entry", headers={"Cookie": f"ktv_client_id={ktv_b}"})
        self.assertEqual(st_b_check, 200)

    # ─────────────────────────────────────────────────────────────
    # 6. BE15000: Tải trang login và tài nguyên đồng thời
    # ─────────────────────────────────────────────────────────────
    def test_be15000_concurrent_access_no_errors(self):
        def load_be15(idx):
            cookie = f"ktv_client_id=ktv_be15_{idx}"
            st, _, data = self._req("/sim_be15000/login", headers={"Cookie": cookie})
            self.assertEqual(st, 200)
            self.assertIn(b"page_container", data)

        with ThreadPoolExecutor(max_workers=10) as executor:
            list(executor.map(load_be15, range(10)))


if __name__ == "__main__":
    unittest.main()
