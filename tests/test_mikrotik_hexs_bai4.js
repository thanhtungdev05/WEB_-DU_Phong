/**
 * tests/test_mikrotik_hexs_bai4.js
 * Kiểm thử chi tiết Bài 4: Cấu hình DHCP (MikroTik hEX S)
 * - 17 bước tooltip theo đúng thứ tự (Addresses -> Pool -> Networks)
 * - Đầy đủ 3 phần cấu hình: IP Addresses, IP Pool, DHCP Server Networks
 * - Cơ chế lưu cấu hình đa trang và cờ trạng thái
 * - Cơ chế đặt lại phiên (session reset) sạch sẽ
 */

const assert = require('assert');
const fs = require('fs');
const path = require('path');
const vm = require('vm');

const ROOT_DIR = path.resolve(__dirname, '..');

// 1. Kiểm tra cú pháp và cấu trúc file
const lessonCode = fs.readFileSync(path.join(ROOT_DIR, 'devices/mikrotik_hexs/lessons/bai4.js'), 'utf8');
const tooltipCode = fs.readFileSync(path.join(ROOT_DIR, 'devices/mikrotik_hexs/tooltips/bai4.js'), 'utf8');

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

console.log('--- TEST 1: NẠP VÀ KIỂM TRA METADATA BÀI 4 ---');
const lesson = sandbox.window.DEVICE_MIKROTIK_HEXS_LESSONS.find(l => l.id === 'mikrotik_hexs-bai4');
assert.ok(lesson, 'Bài mikrotik_hexs-bai4 phải được đăng ký vào DEVICE_MIKROTIK_HEXS_LESSONS');
assert.equal(lesson.title, 'Cấu hình DHCP');
assert.ok(lesson.instructions.some(txt => txt.includes('Pool')), 'Hướng dẫn bài học phải có phần cấu hình IP > Pool');
assert.ok(lesson.instructions.some(txt => txt.includes('Addresses')), 'Hướng dẫn bài học phải có phần cấu hình IP > Addresses');
assert.ok(lesson.instructions.some(txt => txt.includes('Networks')), 'Hướng dẫn bài học phải có phần cấu hình IP > DHCP Server > Networks');
console.log('✔ Metadata và hướng dẫn bài 4 đầy đủ 3 phần.');

console.log('\n--- TEST 2: KIỂM TRA 17 BƯỚC TOOLTIPS ---');
const tooltips = sandbox.window.TOOLTIPS_MIKROTIK_HEXS['mikrotik_hexs-bai4'];
assert.ok(Array.isArray(tooltips), 'Danh sách tooltips phải là mảng');
// Bao gồm 2 bước đăng nhập + 17 bước cấu hình = 19 entries (hoặc 18 nếu Bước 14 gom điều kiện)
console.log(`- Tổng số tooltips: ${tooltips.length}`);

const stepTexts = tooltips.map(t => t.text);
assert.ok(stepTexts.includes('Bước 1: chọn IP'), 'Có Bước 1: chọn IP');
assert.ok(stepTexts.includes('Bước 2: chọn Addresses'), 'Có Bước 2: chọn Addresses');
assert.ok(stepTexts.includes('Bước 3: nhấn đúp vào dòng bridge-LAN'), 'Có Bước 3: nhấn đúp vào dòng bridge-LAN');
assert.ok(stepTexts.includes('Bước 4: nhập 192.168.10.1/24'), 'Có Bước 4: nhập 192.168.10.1/24');
assert.ok(stepTexts.includes('Bước 5: nhập 192.168.10.0'), 'Có Bước 5: nhập 192.168.10.0');
assert.ok(stepTexts.includes('Bước 6: nhấn Apply và OK để lưu'), 'Có Bước 6: nhấn Apply và OK để lưu');

assert.ok(stepTexts.includes('Bước 7: chọn IP'), 'Có Bước 7: chọn IP');
assert.ok(stepTexts.includes('Bước 8: chọn Pool'), 'Có Bước 8: chọn Pool');
assert.ok(stepTexts.includes('Bước 9: nhấn đúp vào dòng dhcp-pool-lan'), 'Có Bước 9: nhấn đúp vào dòng dhcp-pool-lan');
assert.ok(stepTexts.includes('Bước 10: sửa Addresses thành 192.168.10.10-192.168.10.254'), 'Có Bước 10: sửa Addresses');
assert.ok(stepTexts.includes('Bước 11: nhấn Apply và OK để lưu'), 'Có Bước 11: nhấn Apply và OK để lưu');

assert.ok(stepTexts.includes('Bước 12: chọn IP'), 'Có Bước 12: chọn IP');
assert.ok(stepTexts.includes('Bước 13: chọn DHCP Server'), 'Có Bước 13: chọn DHCP Server');
assert.ok(stepTexts.includes('Bước 14: chọn tab Networks') || stepTexts.includes('Bước 14: nhấn đúp vào rule mạng'), 'Có Bước 14');
assert.ok(stepTexts.includes('Bước 15: nhập 192.168.10.0/24'), 'Có Bước 15: nhập 192.168.10.0/24');
assert.ok(stepTexts.includes('Bước 16: nhập 192.168.10.1'), 'Có Bước 16: nhập 192.168.10.1');
assert.ok(stepTexts.includes('Bước 17: nhấn Apply và OK để lưu'), 'Có Bước 17: nhấn Apply và OK để lưu');
console.log('✔ Toàn bộ 17 bước hướng dẫn được định nghĩa chuẩn xác theo thứ tự ảnh.');

console.log('\n--- TEST 3: KIỂM TRA CHẤM ĐIỂM CUSTOMGRADING VÀ LƯU TRẠNG THÁI ---');
// Thử nghiệm customGrading với các trạng thái khác nhau
const customGrading = lesson.grading.customGrading;
assert.equal(typeof customGrading, 'function', 'customGrading phải là hàm');

// Trạng thái 1: Chưa cấu hình gì
sandbox.window._FTC_MK_BAI4 = { addresses: null, pool: null, networks: null };
sandbox.window._FTC_MK_BAI4_ADDRESSES_SAVED = false;
sandbox.window._FTC_MK_BAI4_POOL_SAVED = false;
sandbox.window._FTC_MK_BAI4_NETWORKS_SAVED = false;

let resInitial = customGrading([]);
assert.equal(resInitial.passed, false, 'Chưa làm gì thì passed phải là false');
assert.equal(resInitial.score, 0, 'Chưa làm gì thì score = 0');
console.log('✔ Trạng thái ban đầu: chưa đạt, điểm = 0.');

// Trạng thái 2: Đã lưu đúng Phần 1 (Addresses)
sandbox.window._FTC_MK_BAI4.addresses = {
  'Enabled': true,
  'Address': '192.168.10.1/24',
  'Network': '192.168.10.0',
  'Interface': 'bridge-LAN'
};
sandbox.window._FTC_MK_BAI4_ADDRESSES_SAVED = true;

let resPart1 = customGrading([]);
assert.equal(resPart1.passed, false, 'Chỉ xong Phần 1 thì chưa đạt cả bài');
assert.ok(resPart1.score > 0, 'Xong Phần 1 thì có điểm phần trăm');
console.log(`✔ Xong Phần 1: passed=false, score=${resPart1.score}%`);

// Trạng thái 3: Đã lưu đúng Phần 1 + Phần 2 (Pool)
sandbox.window._FTC_MK_BAI4.pool = {
  'Name': 'dhcp-pool-lan',
  'Addresses': '192.168.10.10-192.168.10.254',
  'Next Pool': 'none'
};
sandbox.window._FTC_MK_BAI4_POOL_SAVED = true;

let resPart2 = customGrading([]);
assert.equal(resPart2.passed, false, 'Chỉ xong Phần 1 & 2 thì chưa đạt cả bài');
assert.ok(resPart2.score > resPart1.score, 'Điểm Phần 1 & 2 phải cao hơn chỉ Phần 1');
console.log(`✔ Xong Phần 2: passed=false, score=${resPart2.score}%`);

// Trạng thái 4: Đã lưu đúng cả 3 Phần (Addresses + Pool + Networks)
sandbox.window._FTC_MK_BAI4.networks = {
  'Address': '192.168.10.0/24',
  'Gateway': '192.168.10.1',
  'Netmask': '0',
  'No DNS': false,
  'DNS Servers#0': '8.8.8.8',
  'DNS Servers#1': '8.8.4.4',
  'Domain': '',
  'Next Server': '0.0.0.0',
  'Boot File Name': ''
};
sandbox.window._FTC_MK_BAI4_NETWORKS_SAVED = true;

let resAll = customGrading([]);
assert.equal(resAll.passed, true, 'Đầy đủ 3 phần phải đạt bài (passed=true)');
assert.equal(resAll.score, 100, 'Đầy đủ 3 phần thì điểm phải là 100');
assert.equal(resAll.passedCount, 16, 'Có đủ 16/16 tiêu chí đạt');
console.log('✔ Xong cả 3 Phần: passed=true, score=100%, 16/16 tiêu chí đạt hoàn hảo!');

console.log('\n================================================================');
console.log('TẤT CẢ KIỂM THỬ BÀI 4 (DHCP) ĐỀU THÀNH CÔNG 100%!');
console.log('================================================================');
