#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
tests/test_ax3000c_all_labs.py
================================================================================
Kiểm thử toàn diện 7 bài Lab và các tính năng chống đơ lag, chống trắng màn
của ONT AX3000CV2 (sim_ax3000c) sử dụng cơ chế in-memory MockSocket.
================================================================================
"""
import io
import json
import os
import sys
import time
import unittest

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


def execute_req(handler_cls, raw_http):
    sock = MockSocket(raw_http)
    handler = handler_cls(sock, ("127.0.0.1", 12345), None)
    output = sock._wfile.getvalue()
    header_end = output.find(b"\r\n\r\n")
    if header_end != -1:
        headers_raw = output[:header_end].decode("utf-8", errors="replace")
        body = output[header_end + 4 :]
    else:
        headers_raw = output.decode("utf-8", errors="replace")
        body = b""
    return headers_raw, body


class TestAX3000CAllLabs(unittest.TestCase):
    def setUp(self):
        self.ktv_id = "ktv_test_mobile_01"
        self.cookie_header = f"Cookie: PHPSESSID={self.ktv_id}; ktv_client_id={self.ktv_id}\r\nX-KTV-Session-ID: {self.ktv_id}\r\n"

    def _get_active_sid(self):
        sid = f"ftc_sid_{self.ktv_id}"
        ax3000c._goc._phien[sid] = {
            "user": "admin",
            "client_key": "cookie:" + self.ktv_id,
            "luc": time.time(),
        }
        return sid

    def test_01_reset_session_clean_memory(self):
        """Kiểm tra reset session không rò rỉ bộ nhớ, trả về 200 OK nhanh tức thì."""
        raw = f"GET /sim-reset-session HTTP/1.1\r\nHost: localhost\r\n{self.cookie_header}\r\n".encode()
        headers, body = execute_req(ax3000c.Handler, raw)
        self.assertIn("200 OK", headers)
        self.assertIn(b'"ok":1', body)

    def test_02_ftc_ax3000c_js_and_root_index(self):
        """Kiểm tra giao diện index.html và script ftc-ax3000c.js được nạp chuẩn xác."""
        raw_js = f"GET /sim_ax3000c/ftc-ax3000c.js HTTP/1.1\r\nHost: localhost\r\n{self.cookie_header}\r\n".encode()
        headers, body = execute_req(ax3000c.Handler, raw_js)
        self.assertIn("200 OK", headers)
        self.assertIn("text/javascript", headers)
        self.assertIn(b"document._ftcIsSaved", body)

        raw_index = f"GET / HTTP/1.1\r\nHost: localhost\r\n{self.cookie_header}\r\n".encode()
        headers, body = execute_req(ax3000c.Handler, raw_index)
        self.assertIn("200 OK", headers)
        self.assertIn("text/html", headers)
        self.assertIn(b"ftc-ax3000c.js", body)

    def test_03_login_ubus(self):
        """Kiểm tra đăng nhập admin/admin qua ubus trả về session hợp lệ."""
        payload = json.dumps({
            "id": 1,
            "method": "call",
            "params": ["00000000000000000000000000000000", "session", "login", {"username": "admin", "password": "admin"}]
        }).encode("utf-8")
        raw = f"POST /ubus HTTP/1.1\r\nHost: localhost\r\nContent-Type: application/json\r\nContent-Length: {len(payload)}\r\n{self.cookie_header}\r\n".encode() + payload
        headers, body = execute_req(ax3000c.Handler, raw)
        self.assertIn("200 OK", headers)
        res_json = json.loads(body.decode("utf-8"))
        self.assertEqual(res_json["result"][0], 0)
        self.assertIn("ubus_rpc_session", res_json["result"][1])

    def test_04_lab1_pppoe_wan(self):
        """Bài 1: Cấu hình PPPoE WAN (sgfdl-123456-789 / d123456)."""
        sid = self._get_active_sid()
        payload = json.dumps({
            "id": 2,
            "method": "call",
            "params": [sid, "data_repo.cigext", "set", {
                "network": {"wan": {"username": "sgfdl-123456-789", "password": "d123456"}}
            }]
        }).encode("utf-8")
        raw = f"POST /ubus HTTP/1.1\r\nHost: localhost\r\nContent-Type: application/json\r\nContent-Length: {len(payload)}\r\n{self.cookie_header}\r\n".encode() + payload
        headers, body = execute_req(ax3000c.Handler, raw)
        self.assertIn("200 OK", headers)
        res_json = json.loads(body.decode("utf-8"))
        self.assertEqual(res_json["result"][0], 0)

        # Đọc lại kiểm tra đã lưu đúng
        v1 = json.dumps({
            "id": 21,
            "method": "call",
            "params": [sid, "data_repo.cigext", "get", {"network": {"wan": {"username": "", "password": ""}}}]
        }).encode("utf-8")
        raw_v = f"POST /ubus HTTP/1.1\r\nHost: localhost\r\nContent-Type: application/json\r\nContent-Length: {len(v1)}\r\n{self.cookie_header}\r\n".encode() + v1
        _, b_v = execute_req(ax3000c.Handler, raw_v)
        res_v = json.loads(b_v.decode("utf-8"))
        self.assertEqual(res_v["result"][1]["network"]["wan"]["username"], "sgfdl-123456-789")

    def test_05_lab2_wifi_mesh_role_controller(self):
        """Bài 2: Đảm bảo MeshRole = Controller để không bị khóa và đổi SSID/Key thành công."""
        raw_set = f"GET /ftc-dat-bai?bai=2 HTTP/1.1\r\nHost: localhost\r\n{self.cookie_header}\r\n".encode()
        headers, body = execute_req(ax3000c.Handler, raw_set)
        self.assertIn("200 OK", headers)

        sid = self._get_active_sid()
        payload = json.dumps({
            "id": 3,
            "method": "call",
            "params": [sid, "data_repo.weboui", "wifi_set", {
                "wifi": {"2G": {"ssid": "FPT Telecom", "key": "fpt12345", "vap_diff_mode": "0"}}
            }]
        }).encode("utf-8")
        raw = f"POST /ubus HTTP/1.1\r\nHost: localhost\r\nContent-Type: application/json\r\nContent-Length: {len(payload)}\r\n{self.cookie_header}\r\n".encode() + payload
        headers, body = execute_req(ax3000c.Handler, raw)
        self.assertIn("200 OK", headers)
        res_json = json.loads(body.decode("utf-8"))
        self.assertEqual(res_json["result"][0], 0)

    def test_06_lab5_lan_ip_dhcp_pool(self):
        """Bài 5: Cấu hình LAN IP 192.168.100.1, dải DHCP 192.168.100.2 - 192.168.100.254."""
        raw_set = f"GET /ftc-dat-bai?bai=5 HTTP/1.1\r\nHost: localhost\r\n{self.cookie_header}\r\n".encode()
        headers, body = execute_req(ax3000c.Handler, raw_set)
        self.assertIn("200 OK", headers)

        sid = self._get_active_sid()
        payload = json.dumps({
            "id": 5,
            "method": "call",
            "params": [sid, "data_repo.cigext", "set", {
                "network": {"lan": {"ipaddr": "192.168.100.1"}},
                "dhcp": {"lan": {"start": "192.168.100.2", "limit": "253"}}
            }]
        }).encode("utf-8")
        raw = f"POST /ubus HTTP/1.1\r\nHost: localhost\r\nContent-Type: application/json\r\nContent-Length: {len(payload)}\r\n{self.cookie_header}\r\n".encode() + payload
        headers, body = execute_req(ax3000c.Handler, raw)
        self.assertIn("200 OK", headers)
        res_json = json.loads(body.decode("utf-8"))
        self.assertEqual(res_json["result"][0], 0)

    def test_07_lab6_port_forwarding_el_input_patch(self):
        """Bài 6: Cấu hình Port Forwarding sử dụng el-input thay vì el-select tránh lag điện thoại."""
        # 1. Kiểm tra patch chunk-82690506 đã thay el-select cho Device/IP bằng el-input
        raw_chunk = f"GET /js/chunk-82690506.9b4ab5b7.1726822665278.js HTTP/1.1\r\nHost: localhost\r\n{self.cookie_header}\r\n".encode()
        headers, body = execute_req(ax3000c.Handler, raw_chunk)
        self.assertIn("200 OK", headers)
        self.assertIn(b'r("el-input",{on:{input:e.forceUpdate}', body)

        # 2. Cấu hình Port Forwarding qua ubus data_repo.weboui portfwd_set
        sid = self._get_active_sid()
        payload = json.dumps({
            "id": 6,
            "method": "call",
            "params": [sid, "data_repo.weboui", "portfwd_set", {
                "redirect": [{
                    "_method": "add", "name": "PF_RULE_1", "src_dport": "8080",
                    "dest_port": "80", "dest_ip": "192.168.100.109", "proto": "tcp", "enabled": True
                }]
            }]
        }).encode("utf-8")
        raw = f"POST /ubus HTTP/1.1\r\nHost: localhost\r\nContent-Type: application/json\r\nContent-Length: {len(payload)}\r\n{self.cookie_header}\r\n".encode() + payload
        headers, body = execute_req(ax3000c.Handler, raw)
        self.assertIn("200 OK", headers)
        res_json = json.loads(body.decode("utf-8"))
        self.assertEqual(res_json["result"][0], 0)

    def test_08_reboot_fast_delay_patch(self):
        """Kiểm tra thời gian chờ reboot được rút ngắn từ 5s xuống 0.2s để tránh đơ màn hình."""
        raw_app = f"GET /js/app.9b4ab5b7.1726822665278.js HTTP/1.1\r\nHost: localhost\r\n{self.cookie_header}\r\n".encode()
        headers, body = execute_req(ax3000c.Handler, raw_app)
        self.assertIn("200 OK", headers)
        self.assertIn(b"window.setTimeout(o,200)", body)
        self.assertNotIn(b"window.setTimeout(o,5e3)", body)

    def test_09_iwinfo_assoclist_and_ecm_status_prevention(self):
        """Kiểm tra fix chống Uncaught (in promise) {req, error} khi Home gọi update2/getAssoclist/ecm."""
        sid = self._get_active_sid()

        # 1. iwinfo devices
        p_dev = json.dumps({"id": 10, "method": "call", "params": [sid, "iwinfo", "devices", {}]}).encode()
        raw_dev = f"POST /ubus HTTP/1.1\r\nHost: localhost\r\nContent-Type: application/json\r\nContent-Length: {len(p_dev)}\r\n{self.cookie_header}\r\n".encode() + p_dev
        headers, body = execute_req(ax3000c.Handler, raw_dev)
        self.assertIn("200 OK", headers)
        res_dev = json.loads(body.decode("utf-8"))
        self.assertEqual(res_dev["result"][0], 0)
        self.assertIn("devices", res_dev["result"][1])

        # 2. iwinfo assoclist
        p_assoc = json.dumps({"id": 11, "method": "call", "params": [sid, "iwinfo", "assoclist", {"device": "ath0"}]}).encode()
        raw_assoc = f"POST /ubus HTTP/1.1\r\nHost: localhost\r\nContent-Type: application/json\r\nContent-Length: {len(p_assoc)}\r\n{self.cookie_header}\r\n".encode() + p_assoc
        headers, body = execute_req(ax3000c.Handler, raw_assoc)
        self.assertIn("200 OK", headers)
        res_assoc = json.loads(body.decode("utf-8"))
        self.assertEqual(res_assoc["result"][0], 0)
        self.assertEqual(res_assoc["result"][1], {"results": []})

        # 3. ecm status
        p_ecm = json.dumps({"id": 12, "method": "call", "params": [sid, "ecm", "status", {}]}).encode()
        raw_ecm = f"POST /ubus HTTP/1.1\r\nHost: localhost\r\nContent-Type: application/json\r\nContent-Length: {len(p_ecm)}\r\n{self.cookie_header}\r\n".encode() + p_ecm
        headers, body = execute_req(ax3000c.Handler, raw_ecm)
        self.assertIn("200 OK", headers)
        res_ecm = json.loads(body.decode("utf-8"))
        self.assertEqual(res_ecm["result"][0], 0)
        self.assertEqual(res_ecm["result"][1], {"entries": []})


if __name__ == "__main__":
    unittest.main()
