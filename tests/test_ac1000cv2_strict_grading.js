/**
 * tests/test_ac1000cv2_strict_grading.js
 * Kiểm thử cơ chế bắt lỗi nghiêm ngặt và ngăn chặn cấu hình ngoài phạm vi cho AC1000C V2.
 */

const assert = require('assert');
const fs = require('fs');
const path = require('path');

// Giả lập môi trường trình duyệt window
global.window = global;
global.document = {
  querySelector: () => null,
  querySelectorAll: () => []
};

// Nạp các bài học của AC1000C V2
require('../devices/ac1000cv2/lessons/bai1.js');
require('../devices/ac1000cv2/lessons/bai2.js');
require('../devices/ac1000cv2/lessons/bai3.js');
require('../devices/ac1000cv2/lessons/bai4.js');
require('../devices/ac1000cv2/lessons/bai5.js');
require('../devices/ac1000cv2/lessons/bai6.js');

const lessons = window.DEVICE_AC1000CV2_LESSONS;
assert(lessons && lessons.length === 6, 'Phải có đủ 6 bài học AC1000C V2');

console.log('--- TEST BÀI 1: CẤU HÌNH PPPOE ---');
const bai1 = lessons.find(l => l.id === 'ac1000cv2-bai1');
// Test 1.1: Cấu hình đúng chuẩn
const mockDocB1Correct = [{
  location: { pathname: '/sim_ac1000cv2/wan.html' },
  _ftcIsSaved: true,
  querySelector: (sel) => {
    if (sel.includes('ppp_user')) return { value: 'sgfdl-210208-218' };
    if (sel.includes('ppp_pass')) return { value: 'fpt12345' };
    if (sel.includes('ip_mode')) return { value: '1' };
    if (sel.includes('wan_en1')) return { checked: true };
    if (sel.includes('nat_en1')) return { checked: true };
    return null;
  }
}];
let resB1 = bai1.grading.customGrading(mockDocB1Correct);
assert.strictEqual(resB1.passed, true, 'Bài 1: Cấu hình đúng phải đạt');
assert.strictEqual(resB1.score, 100, 'Bài 1: Điểm phải là 100');

// Test 1.2: KTV cố tình đổi IP mode sang Bridge
const mockDocB1Tamper = [{
  location: { pathname: '/sim_ac1000cv2/wan.html' },
  _ftcIsSaved: true,
  querySelector: (sel) => {
    if (sel.includes('ppp_user')) return { value: 'sgfdl-210208-218' };
    if (sel.includes('ppp_pass')) return { value: 'fpt12345' };
    if (sel.includes('ip_mode')) return { value: '8' }; // Bridge
    if (sel.includes('wan_en1')) return { checked: true };
    if (sel.includes('nat_en1')) return { checked: true };
    return null;
  }
}];
resB1 = bai1.grading.customGrading(mockDocB1Tamper);
assert.strictEqual(resB1.passed, false, 'Bài 1: Đổi sang Bridge phải BÁO SAI');
assert(resB1.details.some(d => d.id === 'err_wan_mode'), 'Phải có lỗi err_wan_mode');

// Test 1.3: KTV cố tình đổi MTU sang 1400
const mockDocB1Mtu = [{
  location: { pathname: '/sim_ac1000cv2/wan.html' },
  _ftcIsSaved: true,
  querySelector: (sel) => {
    if (sel.includes('ppp_user')) return { value: 'sgfdl-210208-218' };
    if (sel.includes('ppp_pass')) return { value: 'fpt12345' };
    if (sel.includes('ip_mode')) return { value: '1' };
    if (sel.includes('wan_en1')) return { checked: true };
    if (sel.includes('nat_en1') || sel.includes('nat0')) return { checked: true };
    if (sel.includes('mtu')) return { value: '1400' }; // Sửa MTU
    return null;
  }
}];
resB1 = bai1.grading.customGrading(mockDocB1Mtu);
assert.strictEqual(resB1.passed, false, 'Bài 1: Sửa MTU sang 1400 phải BÁO SAI');
assert(resB1.details.some(d => d.id === 'err_mtu'), 'Phải có lỗi err_mtu');

// Test 1.4: KTV cố tình bật VLAN Tagging
const mockDocB1Vlan = [{
  location: { pathname: '/sim_ac1000cv2/wan.html' },
  _ftcIsSaved: true,
  querySelector: (sel) => {
    if (sel.includes('ppp_user')) return { value: 'sgfdl-210208-218' };
    if (sel.includes('ppp_pass')) return { value: 'fpt12345' };
    if (sel.includes('ip_mode')) return { value: '1' };
    if (sel.includes('wan_en1')) return { checked: true };
    if (sel.includes('nat_en1') || sel.includes('nat0')) return { checked: true };
    if (sel.includes('mtu')) return { value: '1500' };
    if (sel.includes('vlan_en')) return { checked: true, value: '1' }; // Bật VLAN
    return null;
  }
}];
resB1 = bai1.grading.customGrading(mockDocB1Vlan);
assert.strictEqual(resB1.passed, false, 'Bài 1: Bật VLAN ngoài phạm vi phải BÁO SAI');
assert(resB1.details.some(d => d.id === 'err_vlan_en'), 'Phải có lỗi err_vlan_en');
console.log('✔ Bài 1: Đạt chuẩn bắt lỗi (PPPoE, Mode, WAN Enable, NAT, MTU, VLAN)');

console.log('--- TEST BÀI 2: WI-FI 2.4G & 5G ---');
const bai2 = lessons.find(l => l.id === 'ac1000cv2-bai2');
// Test 2.1: Cấu hình đúng chuẩn
const mockDocB2Correct = [
  {
    location: { pathname: '/sim_ac1000cv2/wifissid.html' },
    _ftcIsSaved: true,
    querySelector: (sel) => {
      if (sel.includes('ssid_network_name')) return { value: 'FPT Telecom' };
      return null;
    }
  },
  {
    location: { pathname: '/sim_ac1000cv2/wifisecu.html' },
    _ftcIsSaved: true,
    querySelector: (sel) => {
      if (sel.includes('security_wpa_key')) return { value: '19006600' };
      if (sel.includes('security_mode')) return { value: '1' };
      return null;
    }
  },
  {
    location: { pathname: '/sim_ac1000cv2/wifi5ssid.html' },
    _ftcIsSaved: true,
    querySelector: (sel) => {
      if (sel.includes('ssid_network_name')) return { value: 'FPT Telecom' };
      return null;
    }
  },
  {
    location: { pathname: '/sim_ac1000cv2/wifi5secu.html' },
    _ftcIsSaved: true,
    querySelector: (sel) => {
      if (sel.includes('security_wpa_key')) return { value: '19006600' };
      if (sel.includes('security_mode')) return { value: '1' };
      return null;
    }
  }
];
let resB2 = bai2.grading.customGrading(mockDocB2Correct);
assert.strictEqual(resB2.passed, true, 'Bài 2: Cấu hình đúng phải đạt');

// Test 2.2: KTV gõ sai FTP Telecom hoặc mật khẩu cũ fpt12345
const mockDocB2Typo = [
  {
    location: { pathname: '/sim_ac1000cv2/wifissid.html' },
    _ftcIsSaved: true,
    querySelector: (sel) => sel.includes('ssid_network_name') ? { value: 'FTP Telecom' } : null
  },
  {
    location: { pathname: '/sim_ac1000cv2/wifisecu.html' },
    _ftcIsSaved: true,
    querySelector: (sel) => sel.includes('security_wpa_key') ? { value: 'fpt12345' } : null
  },
  {
    location: { pathname: '/sim_ac1000cv2/wifi5ssid.html' },
    _ftcIsSaved: true,
    querySelector: (sel) => sel.includes('ssid_network_name') ? { value: 'FPT Telecom_5G' } : null
  },
  {
    location: { pathname: '/sim_ac1000cv2/wifi5secu.html' },
    _ftcIsSaved: true,
    querySelector: (sel) => sel.includes('security_wpa_key') ? { value: 'fpt12345' } : null
  }
];
resB2 = bai2.grading.customGrading(mockDocB2Typo);
assert.strictEqual(resB2.passed, false, 'Bài 2: Gõ FTP Telecom hoặc fpt12345 phải BÁO SAI');

// Test 2.3: Mô phỏng trình duyệt thật — Nộp bài ở trang cuối (wifi5secu), nhưng trang 3 chọn nhầm SSID 2 ở băng tần 5GHz
window._sessionRuleCache = {
  wifi24_ssid: { actualValue: 'FPT Telecom', isSaved: true },
  wifi24_key: { actualValue: '19006600', isSaved: true },
  wifi5_ssid: { actualValue: 'FPT Telecom', isSaved: true },
  wifi5_key: { actualValue: '19006600', isSaved: true },
  wifi5_out_of_scope: { ssid_idx: '1', isSaved: true } // Chọn SSID 2 ở 5G
};
const mockDocB2FinalOnly = [{
  location: { pathname: '/sim_ac1000cv2/wifi5secu.html' },
  _ftcIsSaved: true,
  querySelector: (sel) => {
    if (sel.includes('security_wpa_key')) return { value: '19006600' };
    if (sel.includes('security_mode')) return { value: '1' };
    return null;
  }
}];
let resB2CrossPageDisable = bai2.grading.customGrading(mockDocB2FinalOnly);
assert.strictEqual(resB2CrossPageDisable.passed, false, 'Bài 2: Chọn nhầm SSID 2 ở băng tần 5G xuyên trang phải BÁO SAI');
assert(resB2CrossPageDisable.details.some(d => d.id === 'err_wifi5_ssid_idx'), 'Phải báo lỗi err_wifi5_ssid_idx');

// Test 2.4: Mô phỏng trang 2 đổi bảo mật sang Open (không pass)
window._sessionRuleCache = {
  wifi24_ssid: { actualValue: 'FPT Telecom', isSaved: true },
  wifi24_key: { actualValue: '', isSaved: true },
  wifi5_ssid: { actualValue: 'FPT Telecom', isSaved: true },
  wifi5_key: { actualValue: '19006600', isSaved: true },
  wifi24_sec_mode: { modeVal: '5', modeText: 'Open', isUnsafe: true, isSaved: true }
};
let resB2CrossPageOpen = bai2.grading.customGrading(mockDocB2FinalOnly);
assert.strictEqual(resB2CrossPageOpen.passed, false, 'Bài 2: Đổi bảo mật 2.4G sang Open xuyên trang phải BÁO SAI');
assert(resB2CrossPageOpen.details.some(d => d.id === 'err_wifi24_mode'), 'Phải báo lỗi err_wifi24_mode');

// Test 2.5: Mô phỏng trang 1 chọn nhầm SSID 2
window._sessionRuleCache = {
  wifi24_ssid: { actualValue: 'FPT Telecom', isSaved: true },
  wifi24_key: { actualValue: '19006600', isSaved: true },
  wifi5_ssid: { actualValue: 'FPT Telecom', isSaved: true },
  wifi5_key: { actualValue: '19006600', isSaved: true },
  wifi24_out_of_scope: { ssid_idx: '1', isSaved: true } // Chọn SSID 2
};
let resB2CrossPageSSIDIdx = bai2.grading.customGrading(mockDocB2FinalOnly);
assert.strictEqual(resB2CrossPageSSIDIdx.passed, false, 'Bài 2: Chọn nhầm SSID 2 ở trang 1 xuyên trang phải BÁO SAI');
assert(resB2CrossPageSSIDIdx.details.some(d => d.id === 'err_wifi24_ssid_idx'), 'Phải báo lỗi err_wifi24_ssid_idx');

// Test 2.6: Cấu hình đúng chuẩn toàn bộ 4 trang xuyên trang
window._sessionRuleCache = {
  wifi24_ssid: { actualValue: 'FPT Telecom', isSaved: true },
  wifi24_key: { actualValue: '19006600', isSaved: true },
  wifi5_ssid: { actualValue: 'FPT Telecom', isSaved: true },
  wifi5_key: { actualValue: '19006600', isSaved: true },
  wifi24_out_of_scope: { ssid_idx: null, isSaved: true },
  wifi5_out_of_scope: { ssid_idx: null, isSaved: true }
};
let resB2CrossPageCorrect = bai2.grading.customGrading(mockDocB2FinalOnly);
assert.strictEqual(resB2CrossPageCorrect.passed, true, 'Bài 2: Cấu hình đúng chuẩn xuyên trang phải ĐẠT');
assert.strictEqual(resB2CrossPageCorrect.score, 100, 'Bài 2: Điểm phải đạt 100');
window._sessionRuleCache = {};

// Test 2.7: Chấm điểm lũy tiến (Progressive Validation) ở Chế độ Hướng dẫn (Guide Mode)
window.currentMode = 'guide';
window._ftcAc1000cv2FinalApplyClicked = false;
window._sessionRuleCache = {
  wifi24_ssid: { actualValue: 'FPT Telecom', isSaved: true }
};
const mockDocB2Step1Only = [{
  location: { pathname: '/sim_ac1000cv2/wifissid.html' },
  _ftcIsSaved: true,
  querySelector: (sel) => {
    if (sel.includes('ssid_network_name')) return { value: 'FPT Telecom' };
    return null;
  }
}];
let resB2GuideStep1 = bai2.grading.customGrading(mockDocB2Step1Only);
assert.strictEqual(resB2GuideStep1.trangHienTaiDat, true, 'Bài 2 (Guide): Làm xong Trang 1 đúng thì trang hiện tại phải ĐẠT (không hiện nút lỗi)');
assert.strictEqual(resB2GuideStep1.daVaoTrangCuoi, false, 'Bài 2 (Guide): Chưa vào trang cuối');
assert.strictEqual(resB2GuideStep1.passed, false, 'Bài 2 (Guide): Chưa nộp bài được vì mới xong trang 1');
assert.strictEqual(resB2GuideStep1.details[0].passed, true, 'Bài 2 (Guide): Tiêu chí 1 đạt');
assert.strictEqual(resB2GuideStep1.details[1].isPending, true, 'Bài 2 (Guide): Tiêu chí 2 phải ở trạng thái pending');
assert.strictEqual(resB2GuideStep1.details[1].actual, '⏳ Đang chờ thực hiện', 'Bài 2 (Guide): Tiêu chí 2 hiển thị Đang chờ');
assert.strictEqual(resB2GuideStep1.details[2].isPending, true, 'Bài 2 (Guide): Tiêu chí 3 phải ở trạng thái pending');
assert.strictEqual(resB2GuideStep1.details[3].isPending, true, 'Bài 2 (Guide): Tiêu chí 4 phải ở trạng thái pending');

// Ở Chế độ Thực hành (Practice Mode): Tiêu chí 2, 3, 4 phải bị đánh trượt nghiêm ngặt
window.currentMode = 'practice';
let resB2PracticeStep1 = bai2.grading.customGrading(mockDocB2Step1Only);
assert.strictEqual(resB2PracticeStep1.passed, false, 'Bài 2 (Practice): Mới làm trang 1 thì không đạt');
assert.strictEqual(resB2PracticeStep1.details[1].passed, false, 'Bài 2 (Practice): Tiêu chí 2 bị chấm trượt');
assert.strictEqual(resB2PracticeStep1.details[1].isPending, false, 'Bài 2 (Practice): Không được ở trạng thái pending');
assert.strictEqual(resB2PracticeStep1.details[1].actual, '(Chưa nhập / Chưa tìm thấy)', 'Bài 2 (Practice): Báo Chưa nhập');

window._sessionRuleCache = {};
window.currentMode = 'practice';

console.log('✔ Bài 2: Đạt chuẩn chấm điểm lũy tiến Guide mode & bắt lỗi nghiêm ngặt Practice mode');

console.log('--- TEST BÀI 3: WI-FI IOT (SSID 2) ---');
const bai3 = lessons.find(l => l.id === 'ac1000cv2-bai3');
// Test 3.1: Đúng chuẩn FPT Telecom-7EA8 & 00032934
const mockDocB3Correct = [
  {
    location: { pathname: '/sim_ac1000cv2/wifissid.html' },
    _ftcIsSaved: true,
    querySelector: (sel) => {
      if (sel.includes('ssid_list')) return { value: '1' };
      if (sel.includes('ssid_enable')) return { checked: true };
      if (sel.includes('ssid_network_name')) return { value: 'FPT Telecom-7EA8' };
      return null;
    }
  },
  {
    location: { pathname: '/sim_ac1000cv2/wifisecu.html' },
    _ftcIsSaved: true,
    querySelector: (sel) => {
      if (sel.includes('ssid_list')) return { value: '1' };
      if (sel.includes('security_wpa_key')) return { value: '00032934' };
      return null;
    }
  }
];
let resB3 = bai3.grading.customGrading(mockDocB3Correct);
assert.strictEqual(resB3.passed, true, 'Bài 3: Cấu hình đúng chuẩn phải đạt');

// Test 3.2: KTV sửa nhầm vào SSID 1
const mockDocB3TamperSSID1 = [
  {
    location: { pathname: '/sim_ac1000cv2/wifissid.html' },
    _ftcIsSaved: true,
    querySelector: (sel) => {
      if (sel.includes('ssid_list')) return { value: '0' }; // Đang chọn SSID 1
      if (sel.includes('ssid_network_name')) return { value: 'FPT Telecom-7EA8' };
      return null;
    }
  },
  {
    location: { pathname: '/sim_ac1000cv2/wifisecu.html' },
    _ftcIsSaved: true,
    querySelector: (sel) => {
      if (sel.includes('ssid_list')) return { value: '0' };
      if (sel.includes('security_wpa_key')) return { value: '00032934' };
      return null;
    }
  }
];
resB3 = bai3.grading.customGrading(mockDocB3TamperSSID1);
assert.strictEqual(resB3.passed, false, 'Bài 3: Sửa đè SSID 1 phải BÁO SAI');
assert(resB3.details.some(d => d.id === 'err_tamper_ssid1'), 'Phải báo lỗi sửa đè SSID 1');
console.log('✔ Bài 3: Đạt chuẩn bắt lỗi');

console.log('--- TEST BÀI 4: DNS THỦ CÔNG ---');
const bai4 = lessons.find(l => l.id === 'ac1000cv2-bai4');
// Test 4.1: Cấu hình đúng chuẩn
const mockDocB4Correct = [{
  location: { pathname: '/sim_ac1000cv2/lan.html' },
  _ftcIsSaved: true,
  querySelector: (sel) => {
    if (sel.includes('dns_overwrite')) return { checked: true };
    if (sel.includes('dns_primary')) return { value: '8.8.8.8' };
    if (sel.includes('dns_secondary')) return { value: '8.8.4.4' };
    if (sel.includes('lan_ip')) return { value: '192.168.10.1' };
    if (sel.includes('dhcp_enable0')) return { checked: true };
    return null;
  }
}];
let resB4 = bai4.grading.customGrading(mockDocB4Correct);
assert.strictEqual(resB4.passed, true, 'Bài 4: Cấu hình đúng phải đạt');

// Test 4.2: KTV tiện tay đổi IP LAN hoặc tắt DHCP trong bài 4
const mockDocB4Tamper = [{
  location: { pathname: '/sim_ac1000cv2/lan.html' },
  _ftcIsSaved: true,
  querySelector: (sel) => {
    if (sel.includes('dns_overwrite')) return { checked: true };
    if (sel.includes('dns_primary')) return { value: '8.8.8.8' };
    if (sel.includes('dns_secondary')) return { value: '8.8.4.4' };
    if (sel.includes('lan_ip')) return { value: '192.168.1.1' }; // Đổi IP LAN ngoài phạm vi
    if (sel.includes('dhcp_enable1')) return { checked: true }; // Tắt DHCP ngoài phạm vi
    return null;
  }
}];
resB4 = bai4.grading.customGrading(mockDocB4Tamper);
assert.strictEqual(resB4.passed, false, 'Bài 4: Sửa IP LAN ngoài phạm vi phải BÁO SAI');
assert(resB4.details.some(d => d.id === 'err_tamper_lan_ip'), 'Phải báo lỗi đổi IP LAN');
console.log('✔ Bài 4: Đạt chuẩn bắt lỗi');

console.log('--- TEST BÀI 5: LAN IP & DHCP ---');
const bai5 = lessons.find(l => l.id === 'ac1000cv2-bai5');
// Test 5.1: Cấu hình đúng chuẩn 192.168.1.x
const mockDocB5Correct = [{
  location: { pathname: '/sim_ac1000cv2/lan.html' },
  _ftcIsSaved: true,
  querySelector: (sel) => {
    if (sel.includes('lan_ip')) return { value: '192.168.1.1' };
    if (sel.includes('lan_mask')) return { value: '255.255.255.0' };
    if (sel.includes('dhcp_enable0')) return { checked: true };
    if (sel.includes('start_ip') || sel.includes('startip')) return { value: '192.168.1.2' };
    if (sel.includes('end_ip') || sel.includes('endip')) return { value: '192.168.1.254' };
    return null;
  }
}];
let resB5 = bai5.grading.customGrading(mockDocB5Correct);
assert.strictEqual(resB5.passed, true, 'Bài 5: Đổi sang 192.168.1.x phải đạt');

// Test 5.2: KTV để nguyên mặc định 192.168.10.x
const mockDocB5Default = [{
  location: { pathname: '/sim_ac1000cv2/lan.html' },
  _ftcIsSaved: true,
  querySelector: (sel) => {
    if (sel.includes('lan_ip')) return { value: '192.168.10.1' }; // Mặc định cũ
    if (sel.includes('lan_mask')) return { value: '255.255.255.0' };
    if (sel.includes('dhcp_enable0')) return { checked: true };
    if (sel.includes('start_ip') || sel.includes('startip')) return { value: '192.168.10.2' };
    if (sel.includes('end_ip') || sel.includes('endip')) return { value: '192.168.10.254' };
    return null;
  }
}];
resB5 = bai5.grading.customGrading(mockDocB5Default);
assert.strictEqual(resB5.passed, false, 'Bài 5: Giữ nguyên mặc định 192.168.10.x phải BÁO SAI');
console.log('✔ Bài 5: Đạt chuẩn bắt lỗi');

console.log('--- TEST BÀI 6: PORT FORWARDING ---');
const bai6 = lessons.find(l => l.id === 'ac1000cv2-bai6');
// Test 6.1: Cấu hình đúng chuẩn
const mockDocB6Correct = [{
  location: { pathname: '/sim_ac1000cv2/portfwd.html' },
  _ftcIsSaved: true,
  querySelector: (sel) => {
    if (sel.includes('portfwd_lanip')) return { value: '192.168.1.254' };
    if (sel.includes('portfwd_lanport')) return { value: '3389' };
    if (sel.includes('portfwd_wanstart')) return { value: '3389' };
    if (sel.includes('portfwd_wanend')) return { value: '3389' };
    if (sel.includes('protocol')) return { value: '1' };
    if (sel.includes('portfwd_sel')) return { value: '-1' };
    return null;
  }
}];
let resB6 = bai6.grading.customGrading(mockDocB6Correct);
assert.strictEqual(resB6.passed, true, 'Bài 6: Cấu hình đúng phải đạt');

// Test 6.2: KTV chọn Application profile có sẵn
const mockDocB6Preset = [{
  location: { pathname: '/sim_ac1000cv2/portfwd.html' },
  _ftcIsSaved: true,
  querySelector: (sel) => {
    if (sel.includes('portfwd_lanip')) return { value: '192.168.1.254' };
    if (sel.includes('portfwd_lanport')) return { value: '3389' };
    if (sel.includes('portfwd_wanstart')) return { value: '3389' };
    if (sel.includes('portfwd_wanend')) return { value: '3389' };
    if (sel.includes('protocol')) return { value: '1' };
    if (sel.includes('portfwd_sel')) return { value: '0', options: [{ text: 'FTP' }], selectedIndex: 0 };
    return null;
  }
}];
resB6 = bai6.grading.customGrading(mockDocB6Preset);
assert.strictEqual(resB6.passed, false, 'Bài 6: Chọn Application profile có sẵn phải BÁO SAI');
console.log('✔ Bài 6: Đạt chuẩn bắt lỗi');

console.log('--- TEST 7: AUTO-BASELINE INTEGRATION TRONG APP.JS ---');
const appJsPath = path.resolve(__dirname, '..', 'app.js');
const appJsCode = fs.readFileSync(appJsPath, 'utf8');

// Trích xuất hàm evaluateAutoBaseline và evaluateLesson từ app.js
const vm = require('vm');
const sandbox = {
  console: console,
  window: {},
  document: { body: {} },
  currentMode: 'practice',
  currentLessonId: 'ac1000cv2-bai1',
  currentDeviceId: 'ac1000cv2',
  _trackingSession: { cachedUnexpectedErrors: [] },
  isSaveRequiredDevice: () => false,
  gradingDisplayValue: (r, v) => String(v)
};
sandbox.window = sandbox;

const autoBaselineCode = appJsCode.match(/function getLabelForElement[\s\S]*?function evaluateAutoBaseline[\s\S]*?\n  \}/);
assert.ok(autoBaselineCode, 'Phải tìm thấy evaluateAutoBaseline trong app.js');

const evaluateLessonCode = appJsCode.match(/function evaluateLesson\(device, lesson\) \{[\s\S]*?\n  function submitLab/);
assert.ok(evaluateLessonCode, 'Phải tìm thấy evaluateLesson trong app.js');

vm.runInNewContext(
  `${autoBaselineCode[0]}\n${evaluateLessonCode[0].replace(/\n  function submitLab$/, '')}`,
  sandbox
);

// Mô phỏng tài liệu có 1 input ngoài phạm vi bài học (ví dụ: trường #dscp bị KTV sửa từ 0 thành 46)
const mockDocWithBaseline = [{
  location: { pathname: '/sim_ac1000cv2/wan.html' },
  _ftcIsSaved: true,
  _ftcOriginalValues: { 'ftc_dscp_1': '0' },
  querySelector: (sel) => {
    if (sel.includes('ppp_user')) return { value: 'sgfdl-210208-218', tagName: 'INPUT' };
    if (sel.includes('ppp_pass')) return { value: 'fpt12345', tagName: 'INPUT' };
    if (sel.includes('ip_mode')) return { value: '1', tagName: 'SELECT' };
    if (sel.includes('wan_en1')) return { checked: true, type: 'radio', value: '1', tagName: 'INPUT' };
    if (sel.includes('nat0') || sel.includes('nat_en1')) return { checked: true, type: 'radio', value: '1', tagName: 'INPUT' };
    if (sel.includes('mtu')) return { value: '1500', tagName: 'INPUT' };
    if (sel.includes('data-ftc-id="ftc_dscp_1"')) {
      return {
        id: 'dscp_val',
        name: 'dscp',
        tagName: 'INPUT',
        value: '46', // Giá trị bị sửa khác với original '0'
        type: 'text',
        closest: (s) => (s === 'tr' ? { querySelector: () => ({ textContent: 'DSCP Marking' }) } : null),
        parentElement: {
          tagName: 'TD',
          parentElement: {
            tagName: 'TR',
            querySelector: () => ({ textContent: 'DSCP Marking' })
          }
        }
      };
    }
    return null;
  },
  querySelectorAll: (sel) => {
    return [];
  }
}];

sandbox.getAllAccessibleDocuments = () => mockDocWithBaseline;
sandbox.deviceIframe = { contentWindow: {} };

const evalResult = sandbox.evaluateLesson({ id: 'ac1000cv2' }, bai1);
assert.strictEqual(evalResult.passed, false, 'Khi có trường ngoài phạm vi bị sửa, evaluateLesson PHẢI ĐÁNH TRƯỢT');
const unexpItem = evalResult.details.find(d => d.name && d.name.includes('Thao tác ngoài phạm vi'));
assert.ok(unexpItem, 'Phải có mục Thao tác ngoài phạm vi trong details');
console.log('✔ Test 7: Auto-Baseline tự động bắt và đánh trượt trường ngoài phạm vi bài học!');

console.log('--- TEST 8: BÀI KHÔNG CÓ grading.rules KHÔNG BỊ ÉP TRƯỢT ---');
// Regression: evaluateAutoBaseline dùng (rules || []).some(...) nên với rules rỗng,
// isExpected luôn false và MỌI ô KTV nhập bị coi là ngoài phạm vi -> passed = false.
// evaluateLesson phải bỏ qua bộ lọc này khi bài không khai báo grading.rules.
const lessonWithoutRules = {
  id: 'LAB_NO_RULES_01',
  grading: {
    customGrading: () => ({
      passed: true,
      totalRules: 1,
      passedCount: 1,
      details: [{ id: 'r1', name: 'Cấu hình nền', expected: 'x', actual: 'x', passed: true }]
    })
  }
};

sandbox.getAllAccessibleDocuments = () => [{
  location: { pathname: '/sim_ac1000f/wlan.htm' },
  _ftcIsSaved: true,
  _ftcOriginalValues: { 'ftc_ssid': 'default-ssid' },
  querySelector: (sel) => {
    if (sel.includes('ftc_ssid')) {
      return {
        id: 'ssid', name: 'ssid', tagName: 'INPUT', type: 'text',
        value: 'FPT Telecom',
        closest: (s) => (s === 'tr' ? { querySelector: () => ({ textContent: 'SSID' }) } : null),
        parentElement: {
          tagName: 'TD',
          parentElement: { tagName: 'TR', querySelector: () => ({ textContent: 'SSID' }) }
        }
      };
    }
    return null;
  },
  querySelectorAll: () => []
}];

const noRulesResult = sandbox.evaluateLesson({ id: 'ac1000f' }, lessonWithoutRules);
assert.strictEqual(
  noRulesResult.passed,
  true,
  'Bài dùng customGrading mà KHÔNG có grading.rules không được ép trượt vì thao tác ngoài phạm vi'
);
assert.ok(
  !noRulesResult.details.some(d => d.name && d.name.includes('Thao tác ngoài phạm vi')),
  'Bài không có grading.rules không được sinh mục Thao tác ngoài phạm vi'
);
console.log('✔ Test 8: Bài không khai báo grading.rules giữ nguyên kết quả chấm điểm!');

console.log('\n🎉 TẤT CẢ 6 BÀI HỌC VÀ CƠ CHẾ BẮT LỖI NGOÀI PHẠM VI CỦA AC1000C V2 ĐỀU ĐẠT CHUẨN!');
