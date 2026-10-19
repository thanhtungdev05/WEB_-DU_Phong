import sys, os

if hasattr(sys.stdout, 'reconfigure'):
    sys.stdout.reconfigure(encoding='utf-8')

sys.path.insert(0, os.path.abspath('simulators/sim_vigor2927/src'))
import render, vg_config_store, server

vg_config_store.dat_nguoi_dung_hien_tai('test_session_bai2')

print("--- TEST 1: Kiểm tra render ban đầu của doc/ipbandw.htm ---")
html_bytes, stats = render.render('doc/ipbandw.htm')
html = html_bytes.decode('utf-8')
print("Render stats:", stats)
assert '192.168.1.10' not in html, "Ban đầu Limitation List không chứa 192.168.1.10"
print("✔ Ban đầu: Limitation List rỗng, chưa có dải IP 192.168.1.10.")

print("\n--- TEST 2: Giả lập submit lưu cấu hình Bandwidth Limit với dòng Each (fid=302) ---")
h = server.H.__new__(server.H)
params = {
    'fid': '302',
    'webchange': '1',
    'sIpBandwEnable': '1',
    'sIpBandwDefTx': '20',
    'iDefTx': '1',
    'sIpBandwDefRx': '25',
    'iDefRx': '1',
    'sIpBandwidth0': '192.168.1.10-192.168.1.20 32788 32793'
}
h._xu_ly_post_ipbandw(params)
print("✔ Đã gọi _xu_ly_post_ipbandw() thành công.")

print("\n--- TEST 3: Kiểm tra render doc/ipbandw.htm SAU KHI LƯU ---")
html_bytes2, stats2 = render.render('doc/ipbandw.htm')
html2 = html_bytes2.decode('utf-8')
print("Render stats sau khi lưu:", stats2)

assert '192.168.1.10' in html2, "Sau khi lưu: phải chứa Start IP 192.168.1.10"
print("✔ Sau khi lưu: chứa Start IP 192.168.1.10 trong aryIpBandw.")

assert '192.168.1.20' in html2, "Sau khi lưu: phải chứa End IP 192.168.1.20"
print("✔ Sau khi lưu: chứa End IP 192.168.1.20 trong aryIpBandw.")

assert '"N"' in html2, "Sau khi lưu: cờ Shared phải là 'N' (tương ứng Each)"
print("✔ Sau khi lưu: cờ Shared là 'N' (chọn dòng Each).")

assert '_ftcIsSaved' in html2, "Phải có logic đồng bộ _ftcIsSaved"
print("✔ Có logic đồng bộ _ftcIsSaved.")

assert '_ftcHasClickedAdd' in html2, "Phải có logic đồng bộ _ftcHasClickedAdd"
print("✔ Có logic đồng bộ _ftcHasClickedAdd.")

print("\n--- TEST 4: Giả lập lưu trực tiếp từ ô input mà chưa bấm Add ---")
vg_config_store.dat_lai_factory()
params_direct = {
    'fid': '302',
    'webchange': '1',
    'sIpBandwEnable': '1',
    'sIpBandwDefTx': '20',
    'iDefTx': '1',
    'sIpBandwDefRx': '25',
    'iDefRx': '1',
    'sIpBandwFrom': '192.168.1.10',
    'sIpBandwTo': '192.168.1.20',
    'sIpBandwTx': '20',
    'iProfTx': '1',
    'sIpBandwRx': '25',
    'iProfRx': '1',
    'sIpBandwShrd': 'N'
}
h._xu_ly_post_ipbandw(params_direct)
html_bytes3, stats3 = render.render('doc/ipbandw.htm')
html3 = html_bytes3.decode('utf-8')
assert '192.168.1.10' in html3, "Khi submit trực tiếp từ input, vẫn phải xuất dòng 192.168.1.10"
print("✔ Lưu trực tiếp từ input cũng tự động xuất 1 dòng Each 192.168.1.10.")

# Clean up
vg_config_store.dat_lai_factory()
print("\n✔ Reset factory hoàn tất.")
print("==================================================================")
print("TẤT CẢ KIỂM THỬ BACKEND SIMULATOR BÀI 2 ĐÃ ĐẠT 100%!")
print("==================================================================")
