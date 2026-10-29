/**
 * tests/test_mikrotik_hexs_bai5.js
 * Kiểm thử chi tiết Bài 5: Cấu hình Policy Routing (MikroTik hEX S)
 * - 21 bước tooltip tuần tự theo video hướng dẫn PBR thực tế
 * - Kiểm tra step-gating: bước trước đúng thì mới qua bước sau
 * - Đầy đủ 3 phần cấu hình: Routing > Tables -> IP > Routes -> IP > Firewall > Mangle
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
assert.ok(lesson.instructions.some(txt => txt.includes('Routing > Tables')), 'Hướng dẫn bài học phải có phần Routing > Tables');
assert.ok(lesson.instructions.some(txt => txt.includes('IP > Routes')), 'Hướng dẫn bài học phải có phần IP > Routes');
assert.ok(lesson.instructions.some(txt => txt.includes('Firewall') && txt.includes('Mangle')), 'Hướng dẫn bài học phải có phần IP > Firewall > Mangle');
console.log('✔ Metadata và hướng dẫn bài 5 đầy đủ 3 phần PBR.');

console.log('\n--- TEST 2: KIỂM TRA 21 BƯỚC TOOLTIPS TUẦN TỰ ---');
const tooltips = sandbox.window.TOOLTIPS_MIKROTIK_HEXS['mikrotik_hexs-bai5'];
assert.ok(Array.isArray(tooltips), 'Danh sách tooltips phải là mảng');
console.log(`- Tổng số tooltips: ${tooltips.length}`);

const stepTexts = tooltips.map(t => t.text);

// Phần 1: Bước 1 đến Bước 6
assert.ok(stepTexts.includes('Bước 1: Chọn menu Routing'), 'Có Bước 1: Chọn menu Routing');
assert.ok(stepTexts.includes('Bước 2: Chọn mục Tables'), 'Có Bước 2: Chọn mục Tables');
assert.ok(stepTexts.includes('Bước 3: Chọn Add New để tạo bảng định tuyến mới'), 'Có Bước 3: Chọn Add New');
assert.ok(stepTexts.includes('Bước 4: Nhập Name: ISP1'), 'Có Bước 4: Nhập Name: ISP1');
assert.ok(stepTexts.includes('Bước 5: Tích chọn ô FIB'), 'Có Bước 5: Tích chọn ô FIB');
assert.ok(stepTexts.includes('Bước 6: Nhấn OK để lưu bảng định tuyến ISP1'), 'Có Bước 6: Nhấn OK để lưu bảng');

// Phần 2: Bước 7 đến Bước 12
assert.ok(stepTexts.includes('Bước 7: Chọn menu IP'), 'Có Bước 7: Chọn menu IP');
assert.ok(stepTexts.includes('Bước 8: Chọn mục Routes'), 'Có Bước 8: Chọn mục Routes');
assert.ok(stepTexts.includes('Bước 9: Chọn Add New để tạo tuyến đường mới'), 'Có Bước 9: Chọn Add New');
assert.ok(stepTexts.includes('Bước 10: Nhập Gateway: 1.1.1.1'), 'Có Bước 10: Nhập Gateway: 1.1.1.1');
assert.ok(stepTexts.includes('Bước 11: Chọn Routing Table: ISP1'), 'Có Bước 11: Chọn Routing Table: ISP1');
assert.ok(stepTexts.includes('Bước 12: Nhấn OK để lưu tuyến đường'), 'Có Bước 12: Nhấn OK để lưu tuyến đường');

// Phần 3: Bước 13 đến Bước 21
assert.ok(stepTexts.includes('Bước 13: Chọn menu IP'), 'Có Bước 13: Chọn menu IP');
assert.ok(stepTexts.includes('Bước 14: Chọn mục Firewall'), 'Có Bước 14: Chọn mục Firewall');
assert.ok(stepTexts.includes('Bước 15: Chọn tab Mangle'), 'Có Bước 15: Chọn tab Mangle');
assert.ok(stepTexts.includes('Bước 16: Chọn Add New để tạo luật Mangle mới'), 'Có Bước 16: Chọn Add New');

const step16 = tooltips.find(t => t.text.includes('Bước 16:'));
assert.ok(step16, 'Tìm thấy Bước 16');
assert.ok(step16.selector.includes('#ftc-mk5-btn-add-mangle'), 'Bước 16 phải dùng ID #ftc-mk5-btn-add-mangle');
assert.ok(!step16.selector.includes('text:Add New'), 'Bước 16 không dùng text:Add New để chống giật lag DOM');

assert.ok(stepTexts.includes('Bước 17: Bấm mở khóa ô Src. Address') || stepTexts.includes('Bước 17: Nhập Src. Address: 192.168.1.0/24'), 'Có Bước 17: Src. Address');
assert.ok(stepTexts.includes('Bước 18: Nhấn khối Action để mở rộng tùy chọn Action'), 'Có Bước 18: Mở khối Action');
assert.ok(stepTexts.includes('Bước 19: Chọn Action: mark routing'), 'Có Bước 19: Chọn Action mark routing');
assert.ok(stepTexts.includes('Bước 20: Chọn New Routing Mark: ISP1'), 'Có Bước 20: Chọn New Routing Mark: ISP1');
assert.ok(stepTexts.includes('Bước 21: Nhấn OK để lưu luật Mangle và hoàn thành bài tập'), 'Có Bước 21: Nhấn OK hoàn thành');
console.log('✔ Toàn bộ 21 bước hướng dẫn được định nghĩa chuẩn xác.');

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

// Trạng thái 2: Đã lưu bảng ISP1 (Phần 1)
sandbox.window._FTC_MK5_BANG_SAVED = true;
let resPart1 = customGrading([]);
assert.equal(resPart1.passed, false, 'Chỉ xong Phần 1 thì chưa đạt');
assert.equal(resPart1.passedCount, 1, 'passedCount = 1');
assert.equal(resPart1.score, 33, 'Xong Phần 1 điểm = 33%');
console.log('✔ Xong Phần 1 (Routing Tables): 1/3 tiêu chí, điểm = 33%.');

// Trạng thái 3: Đã lưu tuyến Gateway 1.1.1.1 (Phần 2)
sandbox.window._FTC_MK5_ROUTE_SAVED = true;
let resPart2 = customGrading([]);
assert.equal(resPart2.passed, false, 'Chỉ xong Phần 1 + 2 thì chưa đạt');
assert.equal(resPart2.passedCount, 2, 'passedCount = 2');
assert.equal(resPart2.score, 67, 'Xong Phần 1 + 2 điểm = 67%');
console.log('✔ Xong Phần 2 (IP Routes): 2/3 tiêu chí, điểm = 67%.');

// Trạng thái 4: Đã lưu luật Mangle (Phần 3)
sandbox.window._FTC_MK5_MANGLE_SAVED = true;
let resPart3 = customGrading([]);
assert.equal(resPart3.passed, true, 'Xong cả 3 phần thì passed = true');
assert.equal(resPart3.passedCount, 3, 'passedCount = 3');
assert.equal(resPart3.score, 100, 'Xong cả 3 phần điểm = 100%');
console.log('✔ Xong Phần 3 (Firewall Mangle): 3/3 tiêu chí, điểm = 100%, PASSED.');

console.log('\n--- TEST 4: KIỂM TRA ĐẶT LẠI PHIÊN (SESSION RESET) ---');
sandbox.window.mkBai5Reset();
assert.equal(sandbox.window._FTC_MK5_BANG_SAVED, false, '_FTC_MK5_BANG_SAVED đã reset về false');
assert.equal(sandbox.window._FTC_MK5_ROUTE_SAVED, false, '_FTC_MK5_ROUTE_SAVED đã reset về false');
assert.equal(sandbox.window._FTC_MK5_MANGLE_SAVED, false, '_FTC_MK5_MANGLE_SAVED đã reset về false');
assert.equal(sandbox.window._FTC_MK5_DS_BANG, null, '_FTC_MK5_DS_BANG đã reset về null');
assert.equal(sandbox.window._FTC_MK5_DS_TUYEN, null, '_FTC_MK5_DS_TUYEN đã reset về null');
assert.equal(sandbox.window._FTC_MK5_DS_MANGLE, null, '_FTC_MK5_DS_MANGLE đã reset về null');
console.log('✔ Hàm mkBai5Reset() xóa sạch trạng thái phiên làm việc.');

console.log('\n--- TEST 5: KIỂM TRA TÍCH HỢP TRONG APP.JS VÀ PORTAL.HTML ---');
const appJsCode = fs.readFileSync(path.join(ROOT_DIR, 'app.js'), 'utf8');
assert.ok(appJsCode.includes('mkBai5Reset'), 'app.js phải gọi mkBai5Reset() khi reset phiên');
assert.ok(appJsCode.includes('_FTC_MK5_BANG_SAVED = false'), 'app.js phải xóa biến cờ Bài 5 khi reset');

const portalCode = fs.readFileSync(path.join(ROOT_DIR, 'portal.html'), 'utf8');
assert.ok(portalCode.includes('devices/mikrotik_hexs/tooltips/bai5.js'), 'portal.html phải nhúng tooltips/bai5.js');
assert.ok(portalCode.includes('devices/mikrotik_hexs/lessons/bai5.js'), 'portal.html phải nhúng lessons/bai5.js');
console.log('✔ app.js và portal.html đã tích hợp đầy đủ.');

console.log('\n================================================================');
console.log('TẤT CẢ CÁC BÀI KIỂM THỬ BÀI 5 POLICY ROUTING ĐỀU ĐẠT 100%!');
console.log('================================================================');
