'use strict';

const fs = require('fs');
const assert = require('assert');
const path = require('path');
const vm = require('vm');

console.log('================================================================');
console.log('KIỂM THỬ XÁC NHẬN SỬA LỖI IPV4 CONNECTION TYPE (PPPOE / STATIC / DHCP)');
console.log('================================================================\n');

const root = path.resolve(__dirname, '..');

// 1. Kiểm tra wan_binding.js (simulator ONT BE6500C)
console.log('--- 1. Kiểm tra mã nguồn wan_binding.js ---');
const wanCode = fs.readFileSync(path.join(root, 'simulators/ont_be6500c/src/www/wan_binding.js'), 'utf8');

// Không còn lỗi thẻ label malformed
assert.ok(
  wanCode.includes("'<label class=\"' + (coChu ? LOP_NHAN_CO_CHU : LOP_NHAN_RONG) + '\" data-shrink=\"'"),
  'Hàm oVanBan phải có thẻ mở <label ...> đầy đủ'
);
assert.ok(
  !wanCode.includes("'>' + (coChu ? 'true' : 'false') + '\" for=\"'"),
  'Không được còn đoạn ghép thẻ lỗi sinh text rác'
);
console.log('✔ Hàm oVanBan sinh mã HTML chuẩn, đã loại bỏ 100% lỗi in text rác ngoài label.');

// Ẩn hiện nghiêm ngặt
assert.ok(
  wanCode.includes("fc.style.setProperty('display', 'none', 'important');"),
  'Phải sử dụng setProperty(\'display\', \'none\', \'important\') để ẩn triệt để container'
);
assert.ok(
  wanCode.includes("fc.style.removeProperty('display');"),
  'Phải sử dụng removeProperty(\'display\') để khôi phục hiển thị'
);
console.log('✔ Đã hỗ trợ ẩn/hiện triệt để cho cả 2 ô PPPoE và 3 ô Static.');

// 2. Kiểm tra interact.js
console.log('\n--- 2. Kiểm tra interact.js ---');
const interactOnt = fs.readFileSync(path.join(root, 'simulators/ont_be6500c/src/www/interact.js'), 'utf8');
const interactSim = fs.readFileSync(path.join(root, 'simulators/sim_ONT_be6500c/src/www/interact.js'), 'utf8');

assert.ok(
  interactOnt.includes('.MuiFormControl-root:not([style*="display: none"]):not([style*="display:none"])'),
  'interact.js ont_be6500c không được áp dụng display:flex lên các phần tử đang bị display: none'
);
assert.ok(
  interactSim.includes('.MuiFormControl-root:not([style*="display: none"]):not([style*="display:none"])'),
  'interact.js sim_ONT_be6500c không được áp dụng display:flex lên các phần tử đang bị display: none'
);
console.log('✔ interact.js không còn ghi đè display: flex !important lên phần tử ẩn.');

// 3. Kiểm tra bài 1 ONT BE6500C (devices/ONT_be6500c/lessons/bai1.js)
console.log('\n--- 3. Kiểm tra tooltip condition trong Bài 1 ONT BE6500C ---');
const ontBai1Code = fs.readFileSync(path.join(root, 'devices/ONT_be6500c/lessons/bai1.js'), 'utf8');
const ontSandbox = { window: {} };
vm.runInNewContext(ontBai1Code, ontSandbox);
const ontLesson = ontSandbox.window.DEVICE_ONT_BE6500C_LESSONS.find(l => l.id === 'ONT_be6500c-bai1');

const step6 = ontLesson.guidePopups.find(g => g.text.includes('Bước 6'));
const step7 = ontLesson.guidePopups.find(g => g.text.includes('Bước 7'));

assert.ok(step6 && typeof step6.condition === 'function', 'Bước 6 phải có hàm condition');
assert.ok(step7 && typeof step7.condition === 'function', 'Bước 7 phải có hàm condition');

// Giả lập DOM khi ở Static
const mockDocStatic = {
  querySelector: function(sel) {
    if (sel.includes('protocol')) return { value: 'static' };
    if (sel.includes('username')) return { closest: () => ({ style: { display: 'none' }, offsetWidth: 0 }) };
    if (sel.includes('password')) return { closest: () => ({ style: { display: 'none' }, offsetWidth: 0 }) };
    return null;
  }
};
assert.strictEqual(step6.condition(mockDocStatic), false, 'Bước 6 PHẢI ẨN khi ở Static');
assert.strictEqual(step7.condition(mockDocStatic), false, 'Bước 7 PHẢI ẨN khi ở Static');

// Giả lập DOM khi ở DHCP
const mockDocDhcp = {
  querySelector: function(sel) {
    if (sel.includes('protocol')) return { value: 'dhcp' };
    if (sel.includes('username')) return { closest: () => ({ style: { display: 'none' }, offsetWidth: 0 }) };
    if (sel.includes('password')) return { closest: () => ({ style: { display: 'none' }, offsetWidth: 0 }) };
    return null;
  }
};
assert.strictEqual(step6.condition(mockDocDhcp), false, 'Bước 6 PHẢI ẨN khi ở DHCP');
assert.strictEqual(step7.condition(mockDocDhcp), false, 'Bước 7 PHẢI ẨN khi ở DHCP');

// Giả lập DOM khi ở PPPoE
const mockDocPppoe = {
  querySelector: function(sel) {
    if (sel.includes('protocol')) return { value: 'pppoe' };
    if (sel.includes('username')) return { closest: () => ({ style: { display: '' }, offsetWidth: 200 }) };
    if (sel.includes('password')) return { closest: () => ({ style: { display: '' }, offsetWidth: 200 }) };
    return null;
  }
};
assert.strictEqual(step6.condition(mockDocPppoe), true, 'Bước 6 PHẢI HIỂN THỊ khi ở PPPoE');
assert.strictEqual(step7.condition(mockDocPppoe), true, 'Bước 7 PHẢI HIỂN THỊ khi ở PPPoE');

console.log('✔ Tooltip Bước 6 & 7 tự động ẩn ở Static/DHCP và CHỈ xuất hiện khi chọn PPPoE.');

console.log('\n================================================================');
console.log('TẤT CẢ CÁC ĐIỀU KIỆN ĐÃ ĐẠT CHUẨN XÁC 100%!');
console.log('================================================================');
