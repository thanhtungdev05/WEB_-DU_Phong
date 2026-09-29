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
assert.ok(portalContent.includes('devices/be12000/tooltips/bai2.js?v=20260928103500'), 'portal.html must include bumped version of bai2 tooltips');
assert.ok(portalContent.includes('devices/be12000/lessons/bai2.js?v=20260928103500'), 'portal.html must include bumped version of bai2 lessons');
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

// Kiểm tra các bước 1 -> 4
const step1 = tooltips.find(t => t.text && t.text.includes('Bước 1: Nhập SSID Name: FPT Telecom'));
const step2 = tooltips.find(t => t.text && t.text.includes('Bước 2: Chọn WPA2-PSK-AES hoặc WPA3'));
const step3 = tooltips.find(t => t.text && t.text.includes('Bước 3: Nhập WPA Passphrase: 19006600'));
const step4 = tooltips.find(t => t.text && t.text.includes('Bước 4: Nhấn Apply để lưu cấu hình Wi-Fi'));

assert.ok(step1, 'Step 1 must be SSID Name');
assert.ok(step2, 'Step 2 must be Encryption Type');
assert.ok(step3, 'Step 3 must be WPA Passphrase');
assert.ok(step4, 'Step 4 must be Apply at SSID1');
console.log('✓ tooltips/bai2.js clean 4-step workflow verified');

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
console.log('✓ lessons/bai2.js verified');

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
