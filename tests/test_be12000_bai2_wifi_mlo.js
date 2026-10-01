'use strict';

const fs = require('fs');
const assert = require('assert');
const path = require('path');
const vm = require('vm');

const root = path.resolve(__dirname, '..');

console.log('--- TEST BE12000 LAB 2 (WI-FI MLO) STANDARDIZATION ---');

// 1. Kiểm tra portal.html đã cập nhật cachebuster
const portalPath = path.join(root, 'portal.html');
const portalContent = fs.readFileSync(portalPath, 'utf8');
assert.ok(/devices\/be12000\/tooltips\/bai2\.js\?v=[a-f0-9]{16}/.test(portalContent), 'portal.html must include content hash for bai2 tooltips');
assert.ok(/devices\/be12000\/lessons\/bai2\.js\?v=[a-f0-9]{16}/.test(portalContent), 'portal.html must include content hash for bai2 lessons');
console.log('✓ portal.html cachebuster verified');

// 2. Kiểm tra tooltips/bai2.js
const tooltipPath = path.join(root, 'devices/be12000/tooltips/bai2.js');
const tooltipCode = fs.readFileSync(tooltipPath, 'utf8');

// Không được chứa tooltip thao tác thừa ở SSID5
assert.ok(!tooltipCode.includes('Bước 4: Mở mục SSID5'), 'Tooltip must NOT contain redundant Step 4 to open SSID5');
assert.ok(!tooltipCode.includes('instName_WLANSSIDConf:4'), 'Tooltip must NOT target SSID5 accordion');
assert.ok(!tooltipCode.includes('Btn_apply_WLANSSIDConf:4'), 'Tooltip must NOT target SSID5 Apply button');

const context = { window: {} };
vm.createContext(context);
vm.runInContext(tooltipCode, context);

const tooltips = context.window.TOOLTIPS_BE12000['LAB_BE12000_02'];
assert.ok(tooltips, 'Tooltips for LAB_BE12000_02 must exist');

// Kiểm tra các bước cấu hình tuần tự Option 1
const step6 = tooltips.find(t => t.text && t.text.includes('Bước 6: Nhập SSID Name: FPT Telecom'));
const step7 = tooltips.find(t => t.text && t.text.includes('Bước 7: Chọn WPA2-PSK-AES hoặc WPA3'));
const step8 = tooltips.find(t => t.text && t.text.includes('Bước 8: Nhập WPA Passphrase: 19006600'));
const step9 = tooltips.find(t => t.text && t.text.includes('Bước 9: Nhấn Apply để lưu cấu hình Wi-Fi'));

assert.ok(step6, 'Step 6 must be SSID Name');
assert.ok(step7, 'Step 7 must be Encryption Type');
assert.ok(step8, 'Step 8 must be WPA Passphrase');
assert.ok(step9, 'Step 9 must be Apply at SSID1');
console.log('✓ tooltips/bai2.js sequential Option 1 workflow verified');

// 3. Kiểm tra lessons/bai2.js
const lessonPath = path.join(root, 'devices/be12000/lessons/bai2.js');
const lessonCode = fs.readFileSync(lessonPath, 'utf8');

assert.ok(!lessonCode.includes('Mở mục <b>SSID5 (5GHz)</b>'), 'Lesson instructions must NOT ask to open SSID5');
assert.ok(lessonCode.includes('Cấu hình Wi-Fi MLO (Wi-Fi 7)'), 'Subtitle must indicate Wi-Fi MLO (Wi-Fi 7)');

const lCtx = { window: { TOOLTIPS_BE12000: context.window.TOOLTIPS_BE12000 } };
vm.createContext(lCtx);
vm.runInContext(lessonCode, lCtx);

const lesson = lCtx.window.DEVICE_BE12000_LESSONS.find(l => l.id === 'LAB_BE12000_02');
assert.ok(lesson, 'Lesson LAB_BE12000_02 must exist');
assert.strictEqual(lesson.guidePopups.length, tooltips.length, 'guidePopups must match tooltips length');
assert.strictEqual(lesson.grading.rules.length, 3, 'MLO grading must only check the synchronized SSID configuration');
assert.ok(!lesson.grading.rules.some(rule => rule.id === 'wifi_ssid_5' || rule.id === 'wifi_pass_5'), 'MLO grading must not require separate SSID5 fields');
assert.ok(!tooltipCode.includes('(2.4GHz)'), 'Tooltip must NOT contain (2.4GHz) suffix');
console.log('✓ lessons/bai2.js verified (3 MLO rules, no 5GHz error, no 2.4GHz suffix)');

// 4. Kiểm tra Giải pháp 2 (Option 2) chống văng trang và giật cuộn khi xem các SSID
const srcIndexPath = path.join(root, 'simulators/sim_be12000/src/www/index.html');
const srcIndexContent = fs.readFileSync(srcIndexPath, 'utf8');
assert.ok(srcIndexContent.includes('[hasError] Ignored SessionTimeout reload'), 'src/www/index.html must neutralize SessionTimeout reload loop');
assert.ok(!srcIndexContent.includes('$(".Btn_cancel", ChangeArea).click()'), 'src/www/index.html must not trigger Btn_cancel click on accordion collapse');

const wwwIndexPath = path.join(root, 'simulators/sim_be12000/www/index.html');
const wwwIndexContent = fs.readFileSync(wwwIndexPath, 'utf8');
assert.ok(wwwIndexContent.includes('[hasError] Ignored SessionTimeout reload'), 'www/index.html must neutralize SessionTimeout reload loop');
assert.ok(!wwwIndexContent.includes('$(".Btn_cancel", ChangeArea).click()'), 'www/index.html must not trigger Btn_cancel click on accordion collapse');

const sessionPyPath = path.join(root, 'simulators/sim_be12000/src/session.py');
const sessionPyContent = fs.readFileSync(sessionPyPath, 'utf8');
assert.ok(sessionPyContent.includes('if self.da_dang_nhap and self.con_han():'), 'session.py must accept active authenticated session in kiem_token');

const dispatchPyPath = path.join(root, 'simulators/sim_be12000/src/dispatch.py');
const dispatchPyContent = fs.readFileSync(dispatchPyPath, 'utf8');
assert.ok(dispatchPyContent.includes('if self.session.da_dang_nhap and self.session.con_han():'), 'dispatch.py must not return SessionTimeout when session is active');
console.log('✓ Option 2 stability fixes verified (SessionTimeout neutralization, Cancel trigger removed, token rotation handled)');

console.log('\n======================================================');
console.log('ALL BE12000 LAB 2 (WI-FI MLO) TESTS PASSED 100%!');
console.log('======================================================');
