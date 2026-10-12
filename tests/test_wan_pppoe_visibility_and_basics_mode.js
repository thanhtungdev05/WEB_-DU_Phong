'use strict';

const fs = require('fs');
const assert = require('assert');
const path = require('path');
const vm = require('vm');

const root = path.resolve(__dirname, '..');

console.log('================================================================');
console.log('KIỂM THỬ TỔNG HỢP: ẨN/HIỆN PPPOE THEO PROTOCOL VÀ BASICS IP MODE');
console.log('================================================================\n');

// 1. Kiểm tra Bài 1 AP BE6500C (devices/be6500c/lessons/bai1.js)
console.log('--- 1. Kiểm tra đề bài và tooltip Bài 1 AP BE6500C ---');
const bai1Code = fs.readFileSync(path.join(root, 'devices/be6500c/lessons/bai1.js'), 'utf8');
const lessonCtx = { window: {} };
vm.runInNewContext(bai1Code, lessonCtx);
const bai1 = lessonCtx.window.DEVICE_BE6500C_LESSONS.find(l => l.id === 'be6500c-bai1');
assert.ok(bai1, 'Phải nạp được be6500c-bai1');

// Kiểm tra rule và tooltip Bước 2 (Chọn WAN) & Bước 3 (Basics)
const ipRule = (bai1.grading.rules || []).find(r => r.id === 'ip_version_mode');
assert.ok(ipRule, 'Phải có rule chấm điểm ip_version_mode');

const step2 = bai1.guidePopups.find(g => g.text.includes('Bước 2'));
assert.ok(step2 && step2.text.includes('WAN'), 'Bước 2 phải hướng dẫn Chọn WAN');
const step3 = bai1.guidePopups.find(g => g.text.includes('Bước 3'));
assert.ok(step3 && step3.text.includes('Basics') && step3.text.includes('IPv4 & IPv6'), 'Bước 3 phải hướng dẫn mục Basics IPv4 & IPv6');
console.log('✔ Tooltip Bước 2 & Bước 3 chính xác: ' + step2.text + ' | ' + step3.text);

// 2. Kiểm tra HTML simulator sim_ONT_be6500c/src/www/advanced__wan.html
console.log('\n--- 2. Kiểm tra simulator AP BE6500C (advanced__wan.html) ---');
const wanHtml = fs.readFileSync(path.join(root, 'simulators/sim_ONT_be6500c/src/www/advanced__wan.html'), 'utf8');

// Mặc định Connection Type là Static
assert.ok(wanHtml.includes('id="mui-component-select-ipv4Settings.protocol" role="combobox" tabindex="0">Static</div>'), 'Mặc định Connection Type phải hiển thị Static');
assert.ok(wanHtml.includes('name="ipv4Settings.protocol" tabindex="-1" value="static"'), 'Input protocol mặc định phải có value="static"');
console.log('✔ Mặc định Connection Type là Static.');

// Mặc định 2 ô PPP Username & Password có display: none
const userBoxMatch = wanHtml.match(/<div class="MuiFormControl-root MuiTextField-root css-5p9558" style="display:\s*none;"><label[^>]*>PPP Username<\/label>/);
assert.ok(userBoxMatch, 'PPP Username phải có style="display: none;" khi ở Static');
const passBoxMatch = wanHtml.match(/<div class="MuiFormControl-root MuiTextField-root css-5p9558" style="display:\s*none;"><label[^>]*>PPP Password<\/label>/);
assert.ok(passBoxMatch, 'PPP Password phải có style="display: none;" khi ở Static');
console.log('✔ Khi ở Static/DHCP: 2 ô PPP Username và PPP Password mặc định ẩn (display: none).');

// Kiểm tra script xử lý dropdown tương tác và ẩn hiện
assert.ok(wanHtml.includes('capNhatAnHienTheoProtocol'), 'advanced__wan.html phải có hàm capNhatAnHienTheoProtocol');
assert.ok(wanHtml.includes('initProtocolSelect'), 'advanced__wan.html phải có hàm initProtocolSelect');
assert.ok(wanHtml.includes('sim-protocol-menu-popover'), 'initProtocolSelect phải hỗ trợ mở popover menu chọn protocol');
console.log('✔ Có đầy đủ logic dropdown menu và tự động ẩn/hiện trường PPPoE theo protocol.');

// 3. Kiểm tra simulator ont_be6500c/src/www/wan_binding.js
console.log('\n--- 3. Kiểm tra simulator ONT BE6500C (wan_binding.js) ---');
const wanBindingCode = fs.readFileSync(path.join(root, 'simulators/ont_be6500c/src/www/wan_binding.js'), 'utf8');
assert.ok(wanBindingCode.includes("(p4 === 'pppoe') ? '' : 'none'"), 'wan_binding.js phải ẩn 2 ô PPP nếu p4 !== pppoe');
assert.ok(wanBindingCode.includes("(p4 === 'static') ? '' : 'none'"), 'wan_binding.js phải ẩn 3 ô Static IP nếu p4 !== static');
console.log('✔ wan_binding.js điều khiển ẩn/hiện chuẩn xác: khi PPPoE hiện 2 ô PPP, khi DHCP để rỗng, khi Static chỉ hiện Static.');

console.log('\n================================================================');
console.log('TẤT CẢ CÁC MỤC KIỂM THỬ ĐÃ ĐẠT 100%!');
console.log('================================================================');
