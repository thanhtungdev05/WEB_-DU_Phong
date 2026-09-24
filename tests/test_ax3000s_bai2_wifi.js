'use strict';

const fs = require('fs');
const assert = require('assert');
const path = require('path');
const vm = require('vm');

const root = path.resolve(__dirname, '..');

// 1. Verify files exist and load contents
const bai2Path = path.join(root, 'devices/ax3000s/lessons/bai2.js');
const tooltipPath = path.join(root, 'devices/ax3000s/tooltips/bai2.js');
const dataPath = path.join(root, 'devices/ax3000s/data.js');
const portalPath = path.join(root, 'portal.html');
const appPath = path.join(root, 'app.js');

const bai2Content = fs.readFileSync(bai2Path, 'utf8');
const tooltipContent = fs.readFileSync(tooltipPath, 'utf8');
const dataContent = fs.readFileSync(dataPath, 'utf8');
const portalContent = fs.readFileSync(portalPath, 'utf8');
const appContent = fs.readFileSync(appPath, 'utf8');

// 2. Instructions check: Bandwidth must be removed, must require SSID and WPA Key
assert.ok(
  !bai2Content.toLowerCase().includes('bandwidth'),
  'bai2.js instructions must NOT contain Bandwidth'
);
assert.ok(
  bai2Content.includes('FPT Telecom'),
  'bai2.js must require SSID FPT Telecom'
);
assert.ok(
  bai2Content.includes('19006600'),
  'bai2.js must require WPA Key 19006600'
);

// 3. Tooltips check: Bandwidth must be removed and steps clean
assert.ok(
  !tooltipContent.toLowerCase().includes('bandwidth') && !tooltipContent.includes('#Sel_BandWidth'),
  'tooltips/bai2.js must NOT contain Bandwidth or #Sel_BandWidth'
);

// 4. Portal cachebuster check
assert.ok(
  portalContent.includes('devices/ax3000s/tooltips/bai2.js?v=20260924092000'),
  'portal.html must include bumped cachebuster for tooltips/bai2.js'
);
assert.ok(
  portalContent.includes('devices/ax3000s/lessons/bai2.js?v=20260924091500'),
  'portal.html must include bumped cachebuster for lessons/bai2.js'
);
assert.ok(
  /app\.js\?v=\d+/.test(portalContent),
  'portal.html must include cachebuster for app.js'
);

// 5. VM Evaluation
const context = {
  window: {},
  document: {},
  console: console
};
context.window = context;
vm.createContext(context);

vm.runInContext(tooltipContent, context);
vm.runInContext(bai2Content, context);
vm.runInContext(dataContent, context);

const tooltips = context.window.TOOLTIPS_AX3000S && context.window.TOOLTIPS_AX3000S['LAB_AX3000S_02'];
assert.ok(Array.isArray(tooltips), 'TOOLTIPS_AX3000S.LAB_AX3000S_02 must be an array');
assert.strictEqual(tooltips.length, 4, 'Must have exactly 4 clean steps');

const step1 = tooltips.find(t => t.text && t.text.includes('Bước 1'));
const step2 = tooltips.find(t => t.text && t.text.includes('Bước 2'));
const step3 = tooltips.find(t => t.text && t.text.includes('Bước 3'));
const step4 = tooltips.find(t => t.text && t.text.includes('Bước 4'));

assert.ok(step1 && step1.selector.includes('#Sky_WLAN'), 'Bước 1 must target #Sky_WLAN');
assert.ok(step2 && step2.selector === '#Txt_SSID' && step2.expected === 'FPT Telecom', 'Bước 2 must target #Txt_SSID');
assert.ok(step3 && step3.selector === '#Pwd_WpaPsk' && step3.expected === '19006600', 'Bước 3 must target #Pwd_WpaPsk');
assert.ok(step4 && step4.selector === '#button_apply', 'Bước 4 must target #button_apply');

// Verify steps 2, 3, 4 are configured to display on wlanBasicSetting2g
assert.strictEqual(step2.page, 'wlanBasicSetting2g');
assert.strictEqual(step3.page, 'wlanBasicSetting2g');
assert.strictEqual(step4.page, 'wlanBasicSetting2g');

// 6. Test declarative grading rules
const lessons = context.window.DEVICE_AX3000S_LESSONS;
const bai2 = lessons.find(l => l.id === 'LAB_AX3000S_02');
assert.ok(bai2, 'LAB_AX3000S_02 must exist in DEVICE_AX3000S_LESSONS');
assert.strictEqual(bai2.practiceUrl, '/sim_ax3000s/app.html#wlanBasicSetting2g');

const rules = bai2.grading.rules;
assert.ok(Array.isArray(rules), 'grading.rules must be an array');
assert.strictEqual(rules.length, 2, 'Grading must have 2 rules: wifi_ssid and wifi_key');

const ssidRule = rules.find(r => r.id === 'wifi_ssid');
const pwdRule = rules.find(r => r.id === 'wifi_key');

assert.ok(ssidRule, 'wifi_ssid rule must exist');
assert.strictEqual(ssidRule.expected, 'FPT Telecom');
assert.strictEqual(ssidRule.required, true);

assert.ok(pwdRule, 'wifi_key rule must exist');
assert.strictEqual(pwdRule.expected, '19006600');
assert.strictEqual(pwdRule.required, true);

console.log('ALL AX3000S BAI 2 WIFI TESTS PASSED SUCCESSFULLY!');
