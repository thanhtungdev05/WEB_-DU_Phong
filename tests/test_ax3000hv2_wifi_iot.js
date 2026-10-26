'use strict';

const fs = require('fs');
const assert = require('assert');
const path = require('path');
const vm = require('vm');

const root = path.resolve(__dirname, '..');

// 1. Verify bai3.js grading rules structure and allowedSelectors
const bai3Code = fs.readFileSync(path.join(root, 'devices/ax3000hv2/lessons/bai3.js'), 'utf8');
const context = { window: {} };
vm.createContext(context);
vm.runInContext(bai3Code, context);

const lessons = context.window.DEVICE_AX3000HV2_LESSONS;
assert.ok(Array.isArray(lessons), 'DEVICE_AX3000HV2_LESSONS must be an array');
const bai3 = lessons.find(l => l.id === 'LAB_AX3000HV2_03');
assert.ok(bai3, 'LAB_AX3000HV2_03 must exist');

const rules = bai3.grading.rules;
assert.equal(rules.length, 2, 'Must have exactly 2 rules: 2.4G SSID and 2.4G Key (5G is not required for IoT)');

const rule2GSSID = rules.find(r => r.id === 'iot_ssid_2g');
const rule2GKey = rules.find(r => r.id === 'iot_key_2g');
const rule5GSSID = rules.find(r => r.id === 'iot_ssid_5g');
const rule5GKey = rules.find(r => r.id === 'iot_key_5g');

assert.ok(rule2GSSID, 'iot_ssid_2g must exist');
assert.equal(rule2GSSID.selector, 'input[name="wifi5SSid_2G"]');
assert.equal(rule2GSSID.expected, 'FPT IoT');

assert.ok(rule2GKey, 'iot_key_2g must exist');
assert.equal(rule2GKey.selector, 'input[name="wifi5Pwd_2G"]');
assert.equal(rule2GKey.expected, 'fptiot123');

assert.ok(!rule5GSSID, 'iot_ssid_5g must NOT be in grading rules');
assert.ok(!rule5GKey, 'iot_key_5g must NOT be in grading rules');

// Verify clearFields only clears 2.4G
assert.deepEqual(Array.from(bai3.clearFields), ['input[name="wifi5SSid_2G"]', 'input[name="wifi5Pwd_2G"]']);

// Verify allowedSelectors in lessonObj and grading
assert.ok(Array.isArray(bai3.allowedSelectors), 'bai3 must have allowedSelectors array');
assert.ok(bai3.allowedSelectors.includes('input[name="Enable_Wifi5_2G"]'), 'allowedSelectors must include Enable_Wifi5_2G');
assert.ok(bai3.allowedSelectors.includes('input[name="Enable_Wifi5_5G"]'), 'allowedSelectors must include Enable_Wifi5_5G');

assert.ok(Array.isArray(bai3.grading.allowedSelectors), 'bai3.grading must have allowedSelectors array');
assert.ok(bai3.grading.allowedSelectors.includes('input[name="Enable_Wifi5_2G"]'), 'grading.allowedSelectors must include Enable_Wifi5_2G');
assert.ok(bai3.grading.allowedSelectors.includes('input[name="Enable_Wifi5_5G"]'), 'grading.allowedSelectors must include Enable_Wifi5_5G');

// 2. Verify tooltips/bai3.js
const tooltipsCode = fs.readFileSync(path.join(root, 'devices/ax3000hv2/tooltips/bai3.js'), 'utf8');
const tooltipsContext = { window: {} };
vm.createContext(tooltipsContext);
vm.runInContext(tooltipsCode, tooltipsContext);

const tooltips = tooltipsContext.window.TOOLTIPS_AX3000HV2['LAB_AX3000HV2_03'];
assert.ok(Array.isArray(tooltips), 'Tooltips for LAB_AX3000HV2_03 must exist');
assert.equal(tooltips.length, 6, 'Tooltips must have exactly 6 steps');
assert.ok(tooltips.some(t => t.text.includes('FPT IoT')), 'Tooltips must mention FPT IoT');
assert.ok(tooltips.some(t => t.text.includes('fptiot123')), 'Tooltips must mention fptiot123');
assert.ok(!tooltips.some(t => t.text.includes('5G:')), 'Tooltips must not require entering 5G fields');

// 2b. Verify wifi5.asp simulator checkSubmit validation
const wifi5AspContent = fs.readFileSync(path.join(root, 'simulators/sim_ax3000hv2/www2/cgi-bin/wifi5.asp'), 'utf8');
assert.ok(wifi5AspContent.includes('is5G && wpapskCheck'), 'wifi5.asp must only validate 5G password when 5G is enabled');

// 3. Verify app.js logic
const appContent = fs.readFileSync(path.join(root, 'app.js'), 'utf8');
assert.ok(appContent.includes('isAuxToggle'), 'app.js must define isAuxToggle');
assert.ok(appContent.includes('enable_wifi'), 'app.js must handle enable_wifi in isAuxToggle');
assert.ok(appContent.includes('wifi5'), 'app.js must handle wifi5 in isAuxToggle');
assert.ok(appContent.includes('2.4g wifi'), 'app.js unexpectedErrors filter must handle 2.4g wifi');
assert.ok(appContent.includes('5g wifi'), 'app.js unexpectedErrors filter must handle 5g wifi');
assert.ok(appContent.includes('effectiveLesson'), 'app.js must use effectiveLesson');

// 4. Verify portal.html cachebuster
const portalContent = fs.readFileSync(path.join(root, 'portal.html'), 'utf8');
assert.ok(portalContent.includes('devices/ax3000hv2/lessons/bai3.js?v='), 'portal.html must have cachebuster for bai3.js');
assert.ok(portalContent.includes('devices/ax3000hv2/tooltips/bai3.js?v='), 'portal.html must have cachebuster for tooltips/bai3.js');
assert.ok(portalContent.includes('app.js?v='), 'portal.html must have cachebuster for app.js');

// 5. Test unexpected error filter logic directly
let testErrors = [
  { label: '2.4G WiFi5', expected: 'Tắt/Disable', actual: 'Bật/Enable' },
  { label: '5G WiFi5', expected: 'Tắt/Disable', actual: 'Bật/Enable' },
  { label: 'Trường khác bị sửa bừa', expected: '0', actual: '1' }
];

const filteredErrors = testErrors.filter(err => {
  const lbl = (err.label || '').toLowerCase();
  const act = (err.actual || '').toLowerCase();
  if ((lbl.includes('username') || lbl.includes('password') || lbl.includes('tài khoản') || lbl.includes('mật khẩu')) && (act === 'admin' || act === '')) {
    return false;
  }
  if (lbl.includes('dns relay') || lbl.includes('dnstyperadio')) {
    return false;
  }
  if (lbl.includes('2.4g wifi') || lbl.includes('5g wifi') || lbl.includes('wifi5') || lbl.includes('wifi 5') || lbl.includes('enable_wifi') || lbl.includes('ssid broadcast')) {
    return false;
  }
  return true;
});

assert.equal(filteredErrors.length, 1, 'Only genuine unauthorized modifications should remain');
assert.equal(filteredErrors[0].label, 'Trường khác bị sửa bừa');

console.log('All AX3000HV2 Bai 3 Wi-Fi IoT tests passed successfully!');
