import io
import os
import sys
import unittest
from urllib.parse import urlencode

sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
import simulators.sim_ac1000f.server2 as ac1000f


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


def execute_request(handler_cls, raw_http):
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


class TestAC1000FAllLabs(unittest.TestCase):
    def setUp(self):
        with ac1000f._STATE_LOCK:
            ac1000f.USER_STATES.clear()
            ac1000f.SIM_STATE.clear()

    def test_lab1_outvariant_and_cert_names(self):
        # 1. OutVariant.asp
        raw = b"GET /sim_ac1000f/cgi-bin/OutVariant.asp HTTP/1.1\r\nHost: localhost\r\n\r\n"
        headers, body = execute_request(ac1000f.H, raw)
        self.assertIn("200 OK", headers)
        self.assertIn("application/javascript", headers)
        self.assertEqual(body, b"/* OutVariant */")

        # 2. getCertNames.cgi & getCANames.cgi
        raw = b"GET /sim_ac1000f/cgi-bin/getCertNames.cgi HTTP/1.1\r\nHost: localhost\r\n\r\n"
        headers, body = execute_request(ac1000f.H, raw)
        self.assertIn("200 OK", headers)
        self.assertIn("text/html", headers)
        self.assertIn(b"wan_cert", body)

        raw = b"GET /sim_ac1000f/cgi-bin/getCANames.cgi HTTP/1.1\r\nHost: localhost\r\n\r\n"
        headers, body = execute_request(ac1000f.H, raw)
        self.assertIn("200 OK", headers)
        self.assertIn("text/html", headers)
        self.assertIn(b"wan_trusted_ca", body)

    def test_lab2_and_lab3_wifi_show_clients_polling(self):
        # 2.4G clients polling
        raw = b"GET /sim_ac1000f/cgi-bin/show_2.4g_clients.asp HTTP/1.1\r\nHost: localhost\r\n\r\n"
        headers, body = execute_request(ac1000f.H, raw)
        self.assertIn("200 OK", headers)
        self.assertIn("text/html", headers)
        self.assertIn(b"MAC Address", body)
        self.assertIn(b"2.4G", body)

        # 5G clients polling
        raw = b"GET /sim_ac1000f/cgi-bin/show_5g_clients.asp HTTP/1.1\r\nHost: localhost\r\n\r\n"
        headers, body = execute_request(ac1000f.H, raw)
        self.assertIn("200 OK", headers)
        self.assertIn("text/html", headers)
        self.assertIn(b"MAC Address", body)
        self.assertIn(b"5G", body)

    def test_lab7_backup_romfile_download(self):
        raw = b"GET /sim_ac1000f/cgi-bin/romfile.cfg HTTP/1.1\r\nHost: localhost\r\n\r\n"
        headers, body = execute_request(ac1000f.H, raw)
        self.assertIn("200 OK", headers)
        self.assertIn("application/octet-stream", headers)
        self.assertIn('attachment; filename="romfile.cfg"', headers)
        self.assertIn(b"[Romfile_AC1000F]", body)

    def test_rssi_log_and_pcap_download(self):
        raw = b"GET /WIFI_2.4G_RSSI_Information.log HTTP/1.1\r\nHost: localhost\r\n\r\n"
        headers, body = execute_request(ac1000f.H, raw)
        self.assertIn("200 OK", headers)
        self.assertIn("text/plain", headers)

        raw = b"GET /cgi-bin/Tcpdump.cap HTTP/1.1\r\nHost: localhost\r\n\r\n"
        headers, body = execute_request(ac1000f.H, raw)
        self.assertIn("200 OK", headers)
        self.assertIn("application/vnd.tcpdump.pcap", headers)

    def test_unmodeled_router_page_graceful_fallback(self):
        raw = b"GET /sim_ac1000f/cgi-bin/wifiqa_advanced.asp HTTP/1.1\r\nHost: localhost\r\n\r\n"
        headers, body = execute_request(ac1000f.H, raw)
        self.assertIn("200 OK", headers)
        self.assertIn("text/html", headers)
        self.assertIn(b"ONT AC1000F - wifiqa_advanced.asp", body)

    def test_apply_sim_state_wifi_and_lan_and_wan(self):
        state = {
            "wan_PPPUsername": "sgfdl-210208-218",
            "wan_PPPPassword": "fptsecretpass",
            "ESSID": "FPT Telecom Special",
            "PreSharedKey3": "1900660099",
            "uiViewIPAddr": "192.168.10.1",
            "PrimaryDns": "8.8.8.8",
            "SecondDns": "8.8.4.4",
            "dnsTypeRadio": "1",
            "dhcpTypeRadio": "1",
        }

        # Check WAN
        wan_html = '<input name="wan_PPPUsername" value="old"><input name="wan_PPPPassword" value="old">'
        res_wan = ac1000f.apply_sim_state_to_html(wan_html, "/cgi-bin/home_wan.asp", state=state)
        self.assertIn('value="sgfdl-210208-218"', res_wan)
        self.assertIn('value="fptsecretpass"', res_wan)

        # Check WiFi
        wifi_html = '<input name="ESSID" value="FPT_default"><input name="PreSharedKey3" value="12345678">'
        res_wifi = ac1000f.apply_sim_state_to_html(wifi_html, "/cgi-bin/home_wireless.asp", state=state)
        self.assertIn('value="FPT Telecom Special"', res_wifi)
        self.assertIn('value="1900660099"', res_wifi)

        # Check LAN & DNS
        lan_html = '<input name="uiViewIPAddr" value="192.168.1.1"><input name="PrimaryDns" value="0.0.0.0"><option value="0" selected><option value="1">'
        res_lan = ac1000f.apply_sim_state_to_html(lan_html, "/cgi-bin/home_lan.asp", state=state)
        self.assertIn('value="192.168.10.1"', res_lan)
        self.assertIn('value="8.8.8.8"', res_lan)
        self.assertIn('<option value="1" selected>', res_lan)


if __name__ == "__main__":
    unittest.main()
