'use strict';

const assert = require('assert');
const fs = require('fs');
const path = require('path');
const vm = require('vm');

console.log('================================================================');
console.log('KIỂM THỬ BÀI 1 ONT BE6500C: BASICS IP MODE, WAN & ẨN/HIỆN PPPOE');
console.log('================================================================\n');

const root = path.resolve(__dirname, '..');

// 1. Kiểm tra cấu trúc bài 1 ONT BE6500C
const bai1Code = fs.readFileSync(path.join(root, 'devices/ONT_be6500c/lessons/bai1.js'), 'utf8');
const sandbox = { window: {} };
vm.runInNewContext(bai1Code, sandbox);

const lesson = sandbox.window.DEVICE_ONT_BE6500C_LESSONS.find(l => l.id === 'ONT_be6500c-bai1');
assert.ok(lesson, 'Bài 1 ONT BE6500C phải tồn tại');

console.log('--- 1. Kiểm tra Đề bài & Tiêu chí chấm điểm (Basics IPv4 & IPv6) ---');
const ipRule = (lesson.grading.rules || []).find(r => r.id === 'ip_version_mode');
assert.ok(ipRule, 'Phải có rule chấm điểm ip_version_mode');
assert.strictEqual(ipRule.expected, '10', 'ip_version_mode phải mong muốn giá trị 10');
assert.strictEqual(ipRule.displayExpected, 'IPv4 & IPv6', 'displayExpected phải là IPv4 & IPv6');

assert.ok(lesson.allowedSelectors.includes('input[name="radio"]'), 'allowedSelectors phải cho phép input[name="radio"] để không phạt lỗi thao tác thừa');
console.log('✔ Đề bài và quy tắc chấm điểm Basics IPv4 & IPv6 đạt 100%.\n');

console.log('--- 2. Kiểm tra GuidePopups Bài 1 ---');
assert.strictEqual(lesson.guidePopups.length, 8, 'guidePopups phải có đúng 8 bước');
assert.strictEqual(lesson.guidePopups[0].text, 'Bước 1: Chọn Advanced');
assert.strictEqual(lesson.guidePopups[1].text, 'Bước 2: Chọn WAN');
assert.ok(lesson.guidePopups[1].selector.includes('WAN'), 'Bước 2 phải có selector trỏ tới WAN');
assert.strictEqual(lesson.guidePopups[2].text, 'Bước 3: Kiểm tra/chọn mục Basics là IPv4 & IPv6');
assert.strictEqual(lesson.guidePopups[3].text, 'Bước 4: Chọn IPv4 Connection Type');
assert.strictEqual(lesson.guidePopups[4].text, 'Bước 5: Chọn PPPoE của phần Connection Type');
assert.strictEqual(lesson.guidePopups[5].text, 'Bước 6: Nhập Username: hnfdl-123456-789');
assert.strictEqual(lesson.guidePopups[6].text, 'Bước 7: Nhập Password: d123456');
assert.strictEqual(lesson.guidePopups[7].text, 'Bước 8: Chọn Save để lưu cấu hình');
console.log('✔ Toàn bộ 8 bước hướng dẫn tooltip chính xác 100%.\n');

// 3. Kiểm tra logic wan_binding.js
console.log('--- 3. Kiểm tra logic wan_binding.js (ẩn hiện trường PPPoE vs Static) ---');
const wanBindingCode = fs.readFileSync(path.join(root, 'simulators/ont_be6500c/src/www/wan_binding.js'), 'utf8');

assert.ok(wanBindingCode.includes("var anBanDau = (p4HienTai !== 'pppoe') ? 'display: none;' : '';"), 'Phải gắn display: none ngay từ khởi tạo HTML cho 2 ô PPPoE');
assert.ok(wanBindingCode.includes("var p4 = giaTri('ipv4Settings.protocol') || 'static';"), 'apDungAnHien phải mặc định protocol là static');
assert.ok(/apDungAnHien\(\);\s*nap\(\)/.test(wanBindingCode), 'batDau phải gọi apDungAnHien() đồng bộ ngay trước khi nap()');
assert.ok(wanBindingCode.includes("i4.__wanBindChange"), 'i4 phải có lắng nghe sự kiện change để cập nhật apDungAnHien');

console.log('✔ wan_binding.js thỏa mãn toàn bộ logic xử lý ẩn/hiện PPPoE và Static IP.\n');

console.log('================================================================');
console.log('TẤT CẢ CÁC MỤC KIỂM THỬ ĐÃ ĐẠT 100%!');
console.log('================================================================');
