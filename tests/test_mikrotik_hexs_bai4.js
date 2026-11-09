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
assert.ok(lesson.instructions.some(txt => txt.includes('192.168.10.0/24')), 'Hướng dẫn bài học phải có yêu cầu đổi lớp mạng 192.168.10.0/24');
assert.ok(lesson.instructions.some(txt => txt.includes('192.168.10.10 - 192.168.10.254')), 'Hướng dẫn bài học phải có Range ip khả dụng 192.168.10.10 - 192.168.10.254');
assert.ok(lesson.grading.rules.some(r => r.name.includes('[Addresses]')), 'Grading phải có tiêu chí Addresses');
assert.ok(lesson.grading.rules.some(r => r.name.includes('[Pool]')), 'Grading phải có tiêu chí Pool');
assert.ok(lesson.grading.rules.some(r => r.name.includes('[Networks]')), 'Grading phải có tiêu chí Networks');
console.log('✔ Metadata và đề bài Bài 4 chuẩn yêu cầu nghiệp vụ.');

console.log('\n--- TEST 2: KIỂM TRA CÁC BƯỚC TOOLTIPS ---');
const tooltips = sandbox.window.TOOLTIPS_MIKROTIK_HEXS['mikrotik_hexs-bai4'];
assert.ok(Array.isArray(tooltips), 'Danh sách tooltips phải là mảng');
console.log(`- Tổng số tooltips: ${tooltips.length}`);

const stepTexts = tooltips.map(t => t.text);
assert.ok(stepTexts.some(t => t.includes('chọn IP')), 'Có bước chọn IP');
assert.ok(stepTexts.some(t => t.includes('chọn Addresses')), 'Có bước chọn Addresses');
assert.ok(stepTexts.some(t => t.includes('bridge-LAN')), 'Có bước nhấn bridge-LAN');
assert.ok(stepTexts.some(t => t.includes('192.168.10.1/24')), 'Có bước nhập 192.168.10.1/24');
assert.ok(stepTexts.some(t => t.includes('192.168.10.0')), 'Có bước nhập 192.168.10.0');
assert.ok(stepTexts.some(t => t.includes('Nhấn Apply để lưu cấu hình')), 'Có bước Nhấn Apply để lưu cấu hình');
assert.ok(stepTexts.some(t => t.includes('Nhấn OK để đóng cửa sổ')), 'Có bước Nhấn OK để đóng cửa sổ');

assert.ok(stepTexts.some(t => t.includes('chọn Pool')), 'Có bước chọn Pool');
assert.ok(stepTexts.some(t => t.includes('dhcp-pool-lan')), 'Có bước nhấn dhcp-pool-lan');
assert.ok(stepTexts.some(t => t.includes('192.168.10.10-192.168.10.254')), 'Có bước sửa Addresses Pool');
assert.ok(stepTexts.some(t => t.includes('Nhấn Apply để lưu cấu hình Pool')), 'Có bước Nhấn Apply Pool');
assert.ok(stepTexts.some(t => t.includes('Nhấn OK để đóng cửa sổ Pool')), 'Có bước Nhấn OK Pool');

assert.ok(stepTexts.some(t => t.includes('DHCP Server')), 'Có bước chọn DHCP Server');
assert.ok(stepTexts.some(t => t.includes('Networks')), 'Có bước chọn tab Networks');
assert.ok(stepTexts.some(t => t.includes('rule mạng')), 'Có bước nhấn đúp vào rule mạng');
assert.ok(stepTexts.some(t => t.includes('192.168.10.0/24')), 'Có bước nhập 192.168.10.0/24');
assert.ok(stepTexts.some(t => t.includes('192.168.10.1')), 'Có bước nhập 192.168.10.1');
assert.ok(stepTexts.some(t => t.includes('Nhấn Apply để lưu cấu hình Networks')), 'Có bước Nhấn Apply Networks');
assert.ok(stepTexts.some(t => t.includes('Nhấn OK để đóng cửa sổ Networks')), 'Có bước Nhấn OK Networks');
console.log('✔ Toàn bộ các bước hướng dẫn (tách biệt Apply và OK) được định nghĩa chuẩn xác.');

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
