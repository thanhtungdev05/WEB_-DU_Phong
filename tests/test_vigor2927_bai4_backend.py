import sys, os, urllib.request, urllib.parse

if hasattr(sys.stdout, 'reconfigure'):
    sys.stdout.reconfigure(encoding='utf-8')

sys.path.insert(0, os.path.abspath('simulators/sim_vigor2927/src'))
import render, vg_config_store, server

vg_config_store.dat_nguoi_dung_hien_tai('test_bai4_session')

print("--- TEST 1: Kiểm tra render ban đầu của doc/ENET.SHT ---")
html_bytes, stats = render.render('doc/ENET.SHT')
html = html_bytes.decode('utf-8')
print("Render stats:", stats)
assert 'name=sLanIp' in html, "Trang phải chứa input sLanIp"
assert '_ftcIsSaved' in html, "Trang phải có logic _ftcIsSaved"
print("✔ Ban đầu: doc/ENET.SHT render thành công và có cờ _ftcIsSaved.")

print("\n--- TEST 2: Giả lập lưu cấu hình DHCP qua _xu_ly_post_enet ---")
h = server.H.__new__(server.H)
params = {
    'sLanIp': '192.168.100.1',
    'sLanMask': '255.255.255.0',
    'sDHCP': '1',
    'sDHCPStIP': '192.168.100.10',
    'iDHCPNo': '200',
    'sDHCPGwIP': '192.168.100.1',
    'sDHCPLsTime': '86400',
    'iRIPLAN': '0',
    'chkrmclnts': '1',
    'sDNSPri': '',
    'sDNSSnd': '',
    'webchange': '1'
}
h._xu_ly_post_enet(params)
vg_config_store.ghi_post('/cgi-bin/enet.cgi', params, 'doc/ENET.SHT')
print("✔ Đã gọi _xu_ly_post_enet() và ghi_post() thành công.")

print("\n--- TEST 3: Kiểm tra render doc/ENET.SHT SAU KHI LƯU ---")
html_bytes2, stats2 = render.render('doc/ENET.SHT')
html2 = html_bytes2.decode('utf-8')

assert 'value="192.168.100.1"' in html2, "Sau khi lưu: sLanIp phải có value 192.168.100.1"
print("✔ Sau khi lưu: sLanIp có value 192.168.100.1.")

assert 'value="192.168.100.10"' in html2, "Sau khi lưu: sDHCPStIP phải có value 192.168.100.10"
print("✔ Sau khi lưu: sDHCPStIP có value 192.168.100.10.")

assert 'value="200"' in html2, "Sau khi lưu: iDHCPNo phải có value 200"
print("✔ Sau khi lưu: iDHCPNo có value 200.")

assert 'value="86400"' in html2, "Sau khi lưu: sDHCPLsTime phải có value 86400"
print("✔ Sau khi lưu: sDHCPLsTime có value 86400.")

assert 'document._ftcIsSaved=true' in html2, "Phải có logic đồng bộ _ftcIsSaved"
print("✔ Có logic đồng bộ _ftcIsSaved.")

print("\n--- TEST 4: Kiểm tra đồng bộ sang bảng tổng quan doc/enet1.htm ---")
html_enet1_bytes, _ = render.render('doc/enet1.htm')
html_enet1 = html_enet1_bytes.decode('utf-8')
assert '192.168.100.1' in html_enet1, "Bảng enet1.htm phải cập nhật IP LAN 1 thành 192.168.100.1"
print("✔ enet1.htm hiển thị đúng IP mới 192.168.100.1.")

# Clean up
vg_config_store.dat_lai_factory()
print("\n✔ Tất cả các bài kiểm tra backend Bài 4 DrayTek Vigor 2927 đã hoàn thành xuất sắc!")
