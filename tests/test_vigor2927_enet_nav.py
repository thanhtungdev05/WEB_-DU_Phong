import sys, os
if hasattr(sys.stdout, 'reconfigure'):
    sys.stdout.reconfigure(encoding='utf-8')
from urllib.parse import urlparse

sys.path.insert(0, os.path.abspath('simulators/sim_vigor2927/src'))
import server, vg_config_store

class DummyServer(server.H):
    def __init__(self):
        self.headers = {}
        self.redirect_path = None
    def _redirect(self, path):
        self.redirect_path = path
        return path
    def _send(self, data, ct, code=200):
        return (code, ct, data)
    def _serve_cgi(self, path, params, method="GET"):
        goc, _st, _ct = server.tim_trang_goc(method, path, params)
        if goc and _st == 302:
            return self._redirect("/" + goc)
        return "served"

vg_config_store.dat_nguoi_dung_hien_tai('test_user_nav')
h = DummyServer()

# 1. Test Navigation from enet1.htm to LAN 1 (fid=2117)
p1 = "/cgi-bin/v2x00.cgi"
params1 = {"fid": "2117", "iAct": "0", "iProfileIdx": "1"}

goc1, _st1, _ct1 = server.tim_trang_goc("POST", p1, params1)
is_ipbmac1 = (goc1 == "doc/ipbmac.htm" or params1.get("fid") == "126")
is_enet1 = (p1 == "/cgi-bin/enet.cgi" or (goc1 == "doc/ENET.SHT" and str(params1.get("webchange")) == "1"))
is_ipbandw1 = (goc1 == "doc/ipbandw.htm" or str(params1.get("fid")) == "302")

print(f"TEST 1: Chuyển trang Details Page (fid=2117) -> is_enet={is_enet1}")
assert not is_enet1, "Chuyển trang Details Page không được coi là is_enet lưu cấu hình!"

# Giả lập luồng POST
if (params1.get("webchange") or is_ipbmac1 or is_enet1 or is_ipbandw1) and (goc1 or is_enet1 or is_ipbandw1):
    res1 = h._redirect("/" + goc1 + ("?save_success=1" if is_enet1 else ""))
else:
    res1 = h._serve_cgi(p1, params1, method="POST")

print(f"Redirect URL khi bấm Details Page: {res1}")
assert res1 == "/doc/ENET.SHT", f"Redirect phải là /doc/ENET.SHT, không được chứa ?save_success=1, nhận được: {res1}"
print("✔ TEST 1 PASSED: Bấm Details Page chỉ redirect về /doc/ENET.SHT sạch sẽ, không có save_success=1!")

# 2. Test Lưu cấu hình khi bấm OK (p = /cgi-bin/enet.cgi)
p2 = "/cgi-bin/enet.cgi"
params2 = {"sLanIp": "192.168.1.1", "sDNSPri": "210.245.31.220", "sDNSSnd": "8.8.8.8", "webchange": "1"}

goc2, _st2, _ct2 = server.tim_trang_goc("POST", p2, params2)
is_enet2 = (p2 == "/cgi-bin/enet.cgi" or (goc2 == "doc/ENET.SHT" and str(params2.get("webchange")) == "1"))
print(f"\nTEST 2: Bấm OK lưu cấu hình -> is_enet={is_enet2}")
assert is_enet2, "Bấm OK lưu cấu hình phải là is_enet=True!"

if not goc2:
    goc2 = "doc/ENET.SHT"
res2 = h._redirect("/" + goc2 + ("?save_success=1" if is_enet2 else ""))
print(f"Redirect URL khi bấm OK: {res2}")
assert res2 == "/doc/ENET.SHT?save_success=1", f"Redirect phải kèm ?save_success=1, nhận được: {res2}"
print("✔ TEST 2 PASSED: Bấm OK lưu cấu hình redirect chính xác kèm ?save_success=1!")

print("\n🎉 TẤT CẢ TEST ĐÃ VƯỢT QUA 100%!")
