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

// 2. Instructions check: Bandwidth must be required
assert.ok(
  bai2Content.includes('20Mhz'),
  'bai2.js instructions must require Bandwidth 20Mhz'
);
assert.ok(
  bai2Content.includes('FPT Telecom'),
  'bai2.js must require SSID FPT Telecom'
);
assert.ok(
  bai2Content.includes('19006600'),
  'bai2.js must require WPA Key 19006600'
);

// 3. Tooltips check: Bandwidth must be present with #Sel_BandWidth
assert.ok(
  tooltipContent.includes('20Mhz') && tooltipContent.includes('#Sel_BandWidth'),
  'tooltips/bai2.js must contain Bandwidth 20Mhz targeting #Sel_BandWidth'
);

// 4. Portal cachebuster check
assert.ok(
  portalContent.includes('devices/ax3000s/tooltips/bai2.js?v=20260927231500'),
  'portal.html must include bumped cachebuster for tooltips/bai2.js'
);
assert.ok(
  portalContent.includes('devices/ax3000s/lessons/bai2.js?v=20260927235000'),
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
assert.strictEqual(tooltips.length, 5, 'Must have exactly 5 clean steps');

const step1 = tooltips.find(t => t.text && t.text.includes('Bước 1'));
const step2 = tooltips.find(t => t.text && t.text.includes('Bước 2'));
const step3 = tooltips.find(t => t.text && t.text.includes('Bước 3'));
const step4 = tooltips.find(t => t.text && t.text.includes('Bước 4'));
const step5 = tooltips.find(t => t.text && t.text.includes('Bước 5'));

assert.ok(step1 && step1.selector.includes('#Sky_WLAN'), 'Bước 1 must target #Sky_WLAN');
assert.ok(step2 && step2.selector === '#Txt_SSID' && step2.expected === 'FPT Telecom', 'Bước 2 must target #Txt_SSID');
assert.ok(step3 && step3.selector === '#Pwd_WpaPsk' && step3.expected === '19006600', 'Bước 3 must target #Pwd_WpaPsk');
assert.ok(step4 && step4.selector === '#Sel_BandWidth' && step4.expected === '20Mhz', 'Bước 4 must target #Sel_BandWidth');
assert.ok(step5 && step5.selector === '#button_apply', 'Bước 5 must target #button_apply');

// Verify steps 2, 3, 4, 5 are configured to display on wlanBasicSetting2g
assert.strictEqual(step2.page, 'wlanBasicSetting2g');
assert.strictEqual(step3.page, 'wlanBasicSetting2g');
assert.strictEqual(step4.page, 'wlanBasicSetting2g');
assert.strictEqual(step5.page, 'wlanBasicSetting2g');

// 6. Test declarative grading rules
const lessons = context.window.DEVICE_AX3000S_LESSONS;
const bai2 = lessons.find(l => l.id === 'LAB_AX3000S_02');
assert.ok(bai2, 'LAB_AX3000S_02 must exist in DEVICE_AX3000S_LESSONS');
assert.strictEqual(bai2.practiceUrl, '/sim_ax3000s/app.html#wlanBasicSetting2g');

const rules = bai2.grading.rules;
assert.ok(Array.isArray(rules), 'grading.rules must be an array');
assert.strictEqual(rules.length, 3, 'Grading must have 3 rules: wifi_ssid, wifi_key, wifi_bw');

const ssidRule = rules.find(r => r.id === 'wifi_ssid');
const pwdRule = rules.find(r => r.id === 'wifi_key');
const bwRule = rules.find(r => r.id === 'wifi_bw');

assert.ok(ssidRule, 'wifi_ssid rule must exist');
assert.strictEqual(ssidRule.expected, 'FPT Telecom');
assert.strictEqual(ssidRule.required, true);

assert.ok(pwdRule, 'wifi_key rule must exist');
assert.strictEqual(pwdRule.expected, '19006600');
assert.strictEqual(pwdRule.required, true);

assert.ok(bwRule, 'wifi_bw rule must exist');
assert.strictEqual(bwRule.expected, '20Mhz');
assert.strictEqual(bwRule.required, true);

console.log('ALL AX3000S BAI 2 WIFI TESTS PASSED SUCCESSFULLY!');
