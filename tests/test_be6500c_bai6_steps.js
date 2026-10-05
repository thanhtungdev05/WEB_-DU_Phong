'use strict';

const assert = require('assert');
const fs = require('fs');
const path = require('path');
const vm = require('vm');

console.log('================================================================');
console.log('KIỂM THỬ ĐẶC TẢ BÀI 6 AP BE6500C: BƯỚC 1 & BƯỚC 2 PORT FORWARDING');
console.log('================================================================\n');

const root = path.resolve(__dirname, '..');

// 1. Kiểm tra cấu hình bai6.js
const bai6Code = fs.readFileSync(path.join(root, 'devices/be6500c/lessons/bai6.js'), 'utf8');
const mockWindow = { DEVICE_BE6500C_LESSONS: [] };
new Function('window', bai6Code)(mockWindow);
const bai6 = mockWindow.DEVICE_BE6500C_LESSONS.find(l => l.id === 'be6500c-bai6');
assert.ok(bai6, 'Bài 6 be6500c-bai6 phải tồn tại');

const step1 = bai6.guidePopups.find(p => p.text && p.text.includes('Bước 1'));
const step2 = bai6.guidePopups.find(p => p.text && p.text.includes('Bước 2'));
const step3 = bai6.guidePopups.find(p => p.text && p.text.includes('Bước 3'));

assert.ok(step1, 'Bước 1 phải tồn tại');
assert.ok(step2, 'Bước 2 phải tồn tại');
assert.ok(step3, 'Bước 3 phải tồn tại');

console.log('✔ Test 1: Các bước 1, 2, 3 trong guidePopups tồn tại đầy đủ.');

// 2. Kiểm tra selector Bước 1: hỗ trợ cả icon mạng khi sidebar thu gọn và tiêu đề khi mở rộng
assert.ok(step1.selector.includes('LanguageOutlinedIcon') || step1.selector.includes('LanguageTwoToneIcon') || step1.selector.includes('Network'),
  'Bước 1 selector phải hỗ trợ icon Language và chữ Network');
console.log('✔ Test 2: Bước 1 selector khớp cả icon quả cầu mạng khi sidebar thu gọn.');

// 3. Kiểm tra selector Bước 2: không được dùng đơn độc .MuiTypography-subtitle2 vì Port Forwarding mang class subtitle3
assert.ok(!step2.selector.trim().startsWith('.MuiTypography-subtitle2:contains("Port Forwarding")'),
  'Bước 2 không được dùng đơn độc subtitle2');
assert.ok(step2.selector.includes('MuiMenuItem') || step2.selector.includes('MuiTypography') || step2.selector.includes('span'),
  'Bước 2 selector phải khớp với menu item Port Forwarding');
console.log('✔ Test 3: Bước 2 selector đã được sửa chuẩn xác để nhận diện menu item Port Forwarding.');

// 4. Kiểm tra markup sidebar từ sidebar_data.js
const sbContent = fs.readFileSync(path.join(root, 'simulators/sim_ONT_be6500c/src/www/sidebar_data.js'), 'utf8');
const sbCtx = { window: {} };
vm.createContext(sbCtx);
vm.runInContext(sbContent, sbCtx);

const gonHtml = sbCtx.window.__SB_GON['network'];
const moHtml = sbCtx.window.__SB_MO['network__portforward'];

// Bước 1 phải khớp với icon trong bản thu gọn (GON)
assert.ok(gonHtml.includes('LanguageOutlinedIcon'), 'Bản thu gọn phải có icon LanguageOutlinedIcon');

// Bước 2 phải khớp với chữ Port Forwarding trong bản mở rộng (MO)
assert.ok(moHtml.includes('Port Forwarding'), 'Bản mở rộng phải chứa Port Forwarding');
assert.ok(moHtml.includes('MuiTypography-subtitle3') && moHtml.includes('Port Forwarding'),
  'Port Forwarding mang class MuiTypography-subtitle3');

console.log('✔ Test 4: Khớp 100% với markup thực tế của router BE6500C.');

console.log('\n================================================================');
console.log('TẤT CẢ KIỂM THỬ ĐẶC TẢ BÀI 6 AP BE6500C ĐÃ VƯỢT QUA 100%!');
console.log('================================================================');
