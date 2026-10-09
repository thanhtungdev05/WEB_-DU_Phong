import sys, os

if hasattr(sys.stdout, 'reconfigure'):
    sys.stdout.reconfigure(encoding='utf-8')

sys.path.insert(0, os.path.abspath('simulators/sim_vigor2927/src'))
import render, vg_config_store, server

vg_config_store.dat_nguoi_dung_hien_tai('test_session')

print("--- TEST 1: Kiểm tra render ban đầu của doc/ipbmac.htm ---")
html_bytes, stats = render.render('doc/ipbmac.htm')
html = html_bytes.decode('latin-1')
print("Render stats:", stats)
assert 'turned OFF' in html, "Trạng thái ban đầu phải là turned OFF"
print("✔ Ban đầu: sIpBindMac chứa 'turned OFF'.")

print("\n--- TEST 2: Giả lập submit lưu cấu hình Bind IP to MAC (fid=126) ---")
h = server.H.__new__(server.H)
params = {
    'fid': '126',
    'webchange': '1',
    'sIpBndMacEnable': '1',
    'sIpBndMacStrict': '0',
    'sIpBndMac': '192.168.1.100 AA-BB-CC-DD-EE-FF ""\n'
}
h._xu_ly_post_ipbmac(params)
print("✔ Đã gọi _xu_ly_post_ipbmac() thành công.")

print("\n--- TEST 3: Kiểm tra render doc/ipbmac.htm SAU KHI LƯU ---")
html_bytes2, stats2 = render.render('doc/ipbmac.htm')
html2 = html_bytes2.decode('latin-1')
print("Render stats sau khi lưu:", stats2)

assert 'var sIpBndMacEnable=1;' in html2, "Sau khi lưu: sIpBndMacEnable phải là 1"
print("✔ Sau khi lưu: var sIpBndMacEnable=1;")

assert 'turned ON' in html2, "Sau khi lưu: sIpBindMac phải chứa 'turned ON'"
print("✔ Sau khi lưu: sIpBindMac chứa 'turned ON'.")

assert '192.168.1.100' in html2, "Sau khi lưu: phải chứa IP 192.168.1.100"
print("✔ Sau khi lưu: chứa IP 192.168.1.100.")

assert 'AA-BB-CC-DD-EE-FF' in html2, "Sau khi lưu: phải chứa MAC AA-BB-CC-DD-EE-FF"
print("✔ Sau khi lưu: chứa MAC AA-BB-CC-DD-EE-FF.")

assert 'id="lbl-ipbmac-disable"' in html2, "Phải có id='lbl-ipbmac-disable'"
print("✔ Có id='lbl-ipbmac-disable'.")

assert 'id="txt-ipbmac-ip"' in html2, "Phải có id='txt-ipbmac-ip'"
print("✔ Có id='txt-ipbmac-ip'.")

assert 'id="btn-ipbmac-ok"' in html2, "Phải có id='btn-ipbmac-ok'"
print("✔ Có id='btn-ipbmac-ok'.")

assert '_ftcIsSaved' in html2, "Phải có logic đồng bộ _ftcIsSaved"
print("✔ Có logic đồng bộ _ftcIsSaved.")

# Clean up
vg_config_store.dat_lai_factory()
print("\n✔ Reset factory hoàn tất.")
print("==================================================================")
print("TẤT CẢ KIỂM THỬ BACKEND SIMULATOR BÀI 3 ĐÃ ĐẠT 100%!")
print("==================================================================")
