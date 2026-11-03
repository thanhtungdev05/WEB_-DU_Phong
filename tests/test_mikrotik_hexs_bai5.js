/**
 * tests/test_mikrotik_hexs_bai5.js
 * Kiểm thử chi tiết Bài 5: Cấu hình Policy Routing (MikroTik hEX S)
 * - 43 bước tooltip tuần tự theo mô hình PBR 2-PC / 2-WAN thực tế
 * - Kiểm tra quy trình chuẩn: Nhấn Apply lưu cấu hình trước, sau đó nhấn OK đóng form
 * - Kiểm tra bước nhập Dst. Address: 0.0.0.0/0 và Gateway: %pppoe-out1 / %pppoe-out2
 * - Đầy đủ 3 phần cấu hình:
 *     + Phần 1: Routing > Tables (Tạo 2 bảng ra-wan1 và ra-wan2, FIB = yes)
 *     + Phần 2: IP > Firewall > Mangle (Tạo 2 luật Mangle mark routing: PC1 100 -> ra-wan1, PC2 101 -> ra-wan2)
 *     + Phần 3: IP > Routes (Tạo 2 Default Route: 0.0.0.0/0 qua %pppoe-out1 và %pppoe-out2)
 * - Cơ chế chấm điểm customGrading (3 tiêu chí)
 * - Cơ chế đặt lại phiên (session reset) qua mkBai5Reset() và app.js
 */

const assert = require('assert');
const fs = require('fs');
const path = require('path');
const vm = require('vm');

const ROOT_DIR = path.resolve(__dirname, '..');

// 1. Nạp code bài học và tooltip
const lessonCode = fs.readFileSync(path.join(ROOT_DIR, 'devices/mikrotik_hexs/lessons/bai5.js'), 'utf8');
const tooltipCode = fs.readFileSync(path.join(ROOT_DIR, 'devices/mikrotik_hexs/tooltips/bai5.js'), 'utf8');

const sandbox = {
  window: {},
  document: {
    querySelectorAll: () => [],
    querySelector: () => null
  },
  setInterval: () => 1,
  setTimeout: () => 1
};
sandbox.window = sandbox;

vm.createContext(sandbox);
vm.runInContext(tooltipCode, sandbox);
vm.runInContext(lessonCode, sandbox);

console.log('--- TEST 1: NẠP VÀ KIỂM TRA METADATA BÀI 5 ---');
const lesson = sandbox.window.DEVICE_MIKROTIK_HEXS_LESSONS.find(l => l.id === 'mikrotik_hexs-bai5');
assert.ok(lesson, 'Bài mikrotik_hexs-bai5 phải được đăng ký vào DEVICE_MIKROTIK_HEXS_LESSONS');
assert.equal(lesson.title, 'Cấu hình Policy Routing');
assert.ok(lesson.instructions.some(txt => txt.includes('mikrotik_pbr_diagram.jpg')), 'Hướng dẫn bài học phải có ảnh sơ đồ mikrotik_pbr_diagram.jpg');
assert.ok(lesson.instructions.some(txt => txt.includes('192.168.1.100')), 'Hướng dẫn bài học phải chứa yêu cầu PC 1 (192.168.1.100)');
assert.ok(lesson.instructions.some(txt => txt.includes('192.168.1.101')), 'Hướng dẫn bài học phải chứa yêu cầu PC 2 (192.168.1.101)');
assert.ok(lesson.instructions.some(txt => txt.includes('%pppoe-out1')), 'Hướng dẫn bài học phải chứa %pppoe-out1');
assert.ok(lesson.instructions.some(txt => txt.includes('%pppoe-out2')), 'Hướng dẫn bài học phải chứa %pppoe-out2');
console.log('✔ Metadata và hướng dẫn bài 5 chuẩn xác.');

console.log('\n--- TEST 2: KIỂM TRA 43 BƯỚC TOOLTIPS TUẦN TỰ (APPLY -> OK, DST. ADDRESS, %PPPOE-OUT) ---');
const tooltips = sandbox.window.TOOLTIPS_MIKROTIK_HEXS['mikrotik_hexs-bai5'];
assert.ok(Array.isArray(tooltips), 'Danh sách tooltips phải là mảng');
console.log(`- Tổng số tooltips: ${tooltips.length}`);

const stepTexts = tooltips.map(t => t.text);

// Phần 1: Bước 1 đến Bước 10 (Routing > Tables)
assert.ok(stepTexts.includes('Bước 1: Chọn menu Routing'), 'Có Bước 1: Chọn menu Routing');
assert.ok(stepTexts.includes('Bước 2: Chọn mục Tables'), 'Có Bước 2: Chọn mục Tables');
assert.ok(stepTexts.includes('Bước 3: Chọn Add New để tạo bảng định tuyến 1 (ra-wan1)'), 'Có Bước 3: Add New bảng 1');
assert.ok(stepTexts.includes('Bước 4: Nhập Name: ra-wan1'), 'Có Bước 4: Nhập Name: ra-wan1');
assert.ok(stepTexts.includes('Bước 5: Tích chọn ô FIB'), 'Có Bước 5: Tích chọn ô FIB');
assert.ok(stepTexts.includes('Bước 6: Nhấn OK để lưu bảng ra-wan1'), 'Có Bước 6: Nhấn OK lưu bảng 1');
assert.ok(stepTexts.includes('Bước 7: Tiếp tục chọn Add New để tạo bảng định tuyến 2 (ra-wan2)'), 'Có Bước 7: Add New bảng 2');
assert.ok(stepTexts.includes('Bước 8: Nhập Name: ra-wan2'), 'Có Bước 8: Nhập Name: ra-wan2');
assert.ok(stepTexts.includes('Bước 9: Tích chọn ô FIB'), 'Có Bước 9: Tích chọn ô FIB');
assert.ok(stepTexts.includes('Bước 10: Nhấn OK để lưu bảng ra-wan2'), 'Có Bước 10: Nhấn OK lưu bảng 2');

// Phần 2: Bước 11 đến Bước 29 (IP > Firewall > Mangle)
assert.ok(stepTexts.includes('Bước 11: Chọn menu IP'), 'Có Bước 11: Chọn menu IP');
assert.ok(stepTexts.includes('Bước 12: Chọn mục Firewall'), 'Có Bước 12: Chọn mục Firewall');
assert.ok(stepTexts.includes('Bước 13: Chọn tab Mangle'), 'Có Bước 13: Chọn tab Mangle');
assert.ok(stepTexts.includes('Bước 14: Chọn Add New để tạo luật Mangle cho PC 1'), 'Có Bước 14: Add New Mangle PC 1');
assert.ok(stepTexts.includes('Bước 15: Bấm mở khóa ô Src. Address'), 'Có Bước 15: Mở khóa Src. Address PC 1');
assert.ok(stepTexts.includes('Bước 16: Nhập Src. Address: 192.168.1.100'), 'Có Bước 16: Nhập Src. Address 192.168.1.100');
assert.ok(stepTexts.includes('Bước 17: Nhấn khối Action để mở rộng tùy chọn Action'), 'Có Bước 17: Mở khối Action PC 1');
assert.ok(stepTexts.includes('Bước 18: Chọn Action: mark routing'), 'Có Bước 18: Chọn Action mark routing');
assert.ok(stepTexts.includes('Bước 19: Chọn New Routing Mark: ra-wan1'), 'Có Bước 19: Chọn New Routing Mark: ra-wan1');
assert.ok(stepTexts.includes('Bước 20: Nhấn Apply để lưu cấu hình luật PC 1'), 'Có Bước 20: Nhấn Apply lưu Mangle PC 1');
assert.ok(stepTexts.includes('Bước 21: Nhấn OK để đóng cửa sổ luật Mangle PC 1'), 'Có Bước 21: Nhấn OK đóng Mangle PC 1');

assert.ok(stepTexts.includes('Bước 22: Tiếp tục chọn Add New để tạo luật Mangle cho PC 2'), 'Có Bước 22: Add New Mangle PC 2');
assert.ok(stepTexts.includes('Bước 23: Bấm mở khóa ô Src. Address'), 'Có Bước 23: Mở khóa Src. Address PC 2');
assert.ok(stepTexts.includes('Bước 24: Nhập Src. Address: 192.168.1.101'), 'Có Bước 24: Nhập Src. Address 192.168.1.101');
assert.ok(stepTexts.includes('Bước 25: Nhấn khối Action để mở rộng tùy chọn Action'), 'Có Bước 25: Mở khối Action PC 2');
assert.ok(stepTexts.includes('Bước 26: Chọn Action: mark routing'), 'Có Bước 26: Chọn Action mark routing');
assert.ok(stepTexts.includes('Bước 27: Chọn New Routing Mark: ra-wan2'), 'Có Bước 27: Chọn New Routing Mark: ra-wan2');
assert.ok(stepTexts.includes('Bước 28: Nhấn Apply để lưu cấu hình luật PC 2'), 'Có Bước 28: Nhấn Apply lưu Mangle PC 2');
assert.ok(stepTexts.includes('Bước 29: Nhấn OK để đóng cửa sổ luật Mangle PC 2'), 'Có Bước 29: Nhấn OK đóng Mangle PC 2');

// Phần 3: Bước 30 đến Bước 43 (IP > Routes)
assert.ok(stepTexts.includes('Bước 30: Chọn menu IP'), 'Có Bước 30: Chọn menu IP');
assert.ok(stepTexts.includes('Bước 31: Chọn mục Routes'), 'Có Bước 31: Chọn mục Routes');
assert.ok(stepTexts.includes('Bước 32: Chọn Add New để tạo tuyến đường cho WAN 1'), 'Có Bước 32: Add New Route WAN 1');
assert.ok(stepTexts.includes('Bước 33: Nhập Dst. Address: 0.0.0.0/0'), 'Có Bước 33: Nhập Dst. Address 0.0.0.0/0 WAN 1');
assert.ok(stepTexts.includes('Bước 34: Nhập Gateway: %pppoe-out1'), 'Có Bước 34: Nhập Gateway: %pppoe-out1');
assert.ok(stepTexts.includes('Bước 35: Chọn Routing Table: ra-wan1'), 'Có Bước 35: Routing Table ra-wan1');
assert.ok(stepTexts.includes('Bước 36: Nhấn Apply để lưu cấu hình tuyến WAN 1'), 'Có Bước 36: Nhấn Apply tuyến WAN 1');
assert.ok(stepTexts.includes('Bước 37: Nhấn OK để đóng cửa sổ tuyến WAN 1'), 'Có Bước 37: Nhấn OK tuyến WAN 1');

assert.ok(stepTexts.includes('Bước 38: Tiếp tục chọn Add New để tạo tuyến đường cho WAN 2'), 'Có Bước 38: Add New Route WAN 2');
assert.ok(stepTexts.includes('Bước 39: Nhập Dst. Address: 0.0.0.0/0'), 'Có Bước 39: Nhập Dst. Address 0.0.0.0/0 WAN 2');
assert.ok(stepTexts.includes('Bước 40: Nhập Gateway: %pppoe-out2'), 'Có Bước 40: Nhập Gateway: %pppoe-out2');
assert.ok(stepTexts.includes('Bước 41: Chọn Routing Table: ra-wan2'), 'Có Bước 41: Routing Table ra-wan2');
assert.ok(stepTexts.includes('Bước 42: Nhấn Apply để lưu cấu hình tuyến WAN 2'), 'Có Bước 42: Nhấn Apply tuyến WAN 2');
assert.ok(stepTexts.includes('Bước 43: Nhấn OK để đóng cửa sổ tuyến WAN 2 và hoàn thành bài tập'), 'Có Bước 43: Nhấn OK tuyến WAN 2');

console.log('✔ Toàn bộ 43 bước hướng dẫn Apply -> OK, Dst. Address và %pppoe-out được định nghĩa chuẩn xác.');

console.log('\n--- TEST 3: KIỂM TRA CHẤM ĐIỂM CUSTOMGRADING VÀ LƯU TRẠNG THÁI ---');
const customGrading = lesson.grading.customGrading;
assert.equal(typeof customGrading, 'function', 'customGrading phải là hàm');

// Trạng thái 1: Chưa cấu hình gì
sandbox.window.mkBai5Reset();
let resInitial = customGrading([]);
assert.equal(resInitial.passed, false, 'Chưa làm gì thì passed phải là false');
assert.equal(resInitial.score, 0, 'Chưa làm gì thì score = 0');
assert.equal(resInitial.passedCount, 0, 'passedCount = 0');
console.log('✔ Trạng thái ban đầu: chưa đạt, điểm = 0%.');

// Trạng thái 2: Đã lưu bảng ra-wan1 và ra-wan2 (Phần 1)
sandbox.window._FTC_MK5_BANG1_SAVED = true;
sandbox.window._FTC_MK5_BANG2_SAVED = true;
let resPart1 = customGrading([]);
assert.equal(resPart1.passed, false, 'Chỉ xong Phần 1 thì chưa đạt');
assert.equal(resPart1.passedCount, 1, 'passedCount = 1');
assert.equal(resPart1.score, 33, 'Xong Phần 1 điểm = 33%');
console.log('✔ Xong Phần 1 (Routing Tables ra-wan1 & ra-wan2): 1/3 tiêu chí, điểm = 33%.');

// Trạng thái 3: Đã lưu luật Mangle cho cả 2 PC (Phần 2)
sandbox.window._FTC_MK5_MANGLE1_SAVED = true;
sandbox.window._FTC_MK5_MANGLE2_SAVED = true;
let resPart2 = customGrading([]);
assert.equal(resPart2.passed, false, 'Chỉ xong Phần 1 + 2 thì chưa đạt');
assert.equal(resPart2.passedCount, 2, 'passedCount = 2');
assert.equal(resPart2.score, 67, 'Xong Phần 1 + 2 điểm = 67%');
console.log('✔ Xong Phần 2 (Firewall Mangle PC1 & PC2): 2/3 tiêu chí, điểm = 67%.');

// Trạng thái 4: Đã lưu cả 2 tuyến Default Route (Phần 3)
sandbox.window._FTC_MK5_ROUTE1_SAVED = true;
sandbox.window._FTC_MK5_ROUTE2_SAVED = true;
let resPart3 = customGrading([]);
assert.equal(resPart3.passed, true, 'Xong cả 3 phần thì passed = true');
assert.equal(resPart3.passedCount, 3, 'passedCount = 3');
assert.equal(resPart3.score, 100, 'Xong cả 3 phần điểm = 100%');
console.log('✔ Xong Phần 3 (IP Routes WAN1 & WAN2): 3/3 tiêu chí, điểm = 100%, PASSED.');

console.log('\n--- TEST 4: KIỂM TRA ĐẶT LẠI PHIÊN (SESSION RESET) ---');
sandbox.window.mkBai5Reset();
assert.equal(sandbox.window._FTC_MK5_BANG1_SAVED, false, '_FTC_MK5_BANG1_SAVED đã reset về false');
assert.equal(sandbox.window._FTC_MK5_BANG2_SAVED, false, '_FTC_MK5_BANG2_SAVED đã reset về false');
assert.equal(sandbox.window._FTC_MK5_MANGLE1_SAVED, false, '_FTC_MK5_MANGLE1_SAVED đã reset về false');
assert.equal(sandbox.window._FTC_MK5_MANGLE2_SAVED, false, '_FTC_MK5_MANGLE2_SAVED đã reset về false');
assert.equal(sandbox.window._FTC_MK5_ROUTE1_SAVED, false, '_FTC_MK5_ROUTE1_SAVED đã reset về false');
assert.equal(sandbox.window._FTC_MK5_ROUTE2_SAVED, false, '_FTC_MK5_ROUTE2_SAVED đã reset về false');
assert.equal(sandbox.window._FTC_MK5_ROUTE1_APPLIED, false, '_FTC_MK5_ROUTE1_APPLIED đã reset về false');
assert.equal(sandbox.window._FTC_MK5_ROUTE2_APPLIED, false, '_FTC_MK5_ROUTE2_APPLIED đã reset về false');
assert.equal(sandbox.window._FTC_MK5_MANGLE1_APPLIED, false, '_FTC_MK5_MANGLE1_APPLIED đã reset về false');
assert.equal(sandbox.window._FTC_MK5_MANGLE2_APPLIED, false, '_FTC_MK5_MANGLE2_APPLIED đã reset về false');
assert.equal(sandbox.window._FTC_MK5_DS_BANG, null, '_FTC_MK5_DS_BANG đã reset về null');
assert.equal(sandbox.window._FTC_MK5_DS_TUYEN, null, '_FTC_MK5_DS_TUYEN đã reset về null');
assert.equal(sandbox.window._FTC_MK5_DS_MANGLE, null, '_FTC_MK5_DS_MANGLE đã reset về null');
console.log('✔ Hàm mkBai5Reset() xóa sạch trạng thái phiên làm việc.');

console.log('\n--- TEST 5: KIỂM TRA TÍCH HỢP TRONG APP.JS VÀ PORTAL.HTML ---');
const appJsCode = fs.readFileSync(path.join(ROOT_DIR, 'app.js'), 'utf8');
assert.ok(appJsCode.includes('mkBai5Reset'), 'app.js phải gọi mkBai5Reset() khi reset phiên');
assert.ok(appJsCode.includes('_FTC_MK5_BANG1_SAVED = false'), 'app.js phải xóa biến cờ Bài 5 khi reset');

const portalCode = fs.readFileSync(path.join(ROOT_DIR, 'portal.html'), 'utf8');
assert.ok(portalCode.includes('devices/mikrotik_hexs/tooltips/bai5.js'), 'portal.html phải nhúng tooltips/bai5.js');
assert.ok(portalCode.includes('devices/mikrotik_hexs/lessons/bai5.js'), 'portal.html phải nhúng lessons/bai5.js');
console.log('✔ app.js và portal.html đã tích hợp đầy đủ.');

console.log('\n================================================================');
console.log('TẤT CẢ CÁC BÀI KIỂM THỬ BÀI 5 POLICY ROUTING ĐỀU ĐẠT 100%!');
console.log('================================================================');
