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

const bai2Content = fs.readFileSync(bai2Path, 'utf8');
const tooltipContent = fs.readFileSync(tooltipPath, 'utf8');
const dataContent = fs.readFileSync(dataPath, 'utf8');
const portalContent = fs.readFileSync(portalPath, 'utf8');

// 2. Instructions check: Bandwidth must be removed
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

// 3. Tooltips check: Bandwidth must be removed and steps numbered 1-5
assert.ok(
  !tooltipContent.toLowerCase().includes('bandwidth') && !tooltipContent.includes('#Sel_BandWidth'),
  'tooltips/bai2.js must NOT contain Bandwidth or #Sel_BandWidth'
);

// 4. Portal cachebuster check
assert.ok(
  portalContent.includes('devices/ax3000s/tooltips/bai2.js?v=20260918111200'),
  'portal.html must include bumped cachebuster for tooltips/bai2.js'
);
assert.ok(
  portalContent.includes('app.js?v=20260924-session-heartbeat-v22'),
  'portal.html must use the combined Guest Guide/Ver2.1 device cachebuster for app.js'
);

// 4b. app.js isolation & requireSaved check
const appPath = path.join(root, 'app.js');
const appContent = fs.readFileSync(appPath, 'utf8');
assert.ok(
  appContent.includes('isAx3000sBai2_2g'),
  'app.js must define isAx3000sBai2_2g to isolate 2.4G save'
);
assert.ok(
  appContent.includes("href.includes('wlanbasicsetting2g')"),
  'app.js onSimulatorSave must ignore wlanbasicsetting2g for LAB_AX3000S_02'
);
assert.ok(
  appContent.includes('pop.requireSaved'),
  'app.js must support pop.requireSaved'
);
assert.ok(
  appContent.includes('pop.hideWhenSaved'),
  'app.js must support pop.hideWhenSaved'
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

const step1 = tooltips.find(t => t.text && t.text.includes('Bước 1'));
const step2 = tooltips.find(t => t.text && t.text.includes('Bước 2'));
const step3 = tooltips.find(t => t.text && t.text.includes('Bước 3'));
const step4 = tooltips.find(t => t.text && t.text.includes('Bước 4'));
const step5 = tooltips.find(t => t.text && t.text.includes('Bước 5'));
const step6 = tooltips.find(t => t.text && t.text.includes('Bước 6'));

assert.ok(step1 && step1.selector === '#Txt_SSID' && step1.hideWhenSaved === true, 'Bước 1 must target #Txt_SSID and hideWhenSaved');
assert.ok(step2 && step2.selector === '#Pwd_WpaPsk' && step2.hideWhenSaved === true, 'Bước 2 must target #Pwd_WpaPsk and hideWhenSaved');
assert.ok(step3 && step3.selector === '#button_apply' && step3.page === 'wlanBasicSetting2g' && step3.hideWhenSaved === true, 'Bước 3 must target Save on 2.4G and hideWhenSaved');
assert.ok(step4 && step4.selector.includes('#layer2-leaf-wlanaband') && step4.requireSaved === true, 'Bước 4 must target WLAN 5G menu and requireSaved');
assert.ok(step5 && step5.selector.includes('wlanBasicSetting5g') && step5.requireSaved === true, 'Bước 5 must target Basic Settings of WLAN 5G and requireSaved');
assert.ok(step6 && step6.selector === '#button_apply' && step6.page === 'wlanBasicSetting5g', 'Bước 6 must target Save on 5G');

// 6. Test customGrading logic
const lessons = context.window.DEVICE_AX3000S_LESSONS;
const bai2 = lessons.find(l => l.id === 'LAB_AX3000S_02');
assert.ok(bai2, 'LAB_AX3000S_02 must exist');
const grader = bai2.grading.customGrading;
assert.strictEqual(typeof grader, 'function', 'customGrading must be a function');

// Case 1: No 5G document loaded yet
const res1 = grader([
  { location: { href: 'http://localhost/sim_ax3000s/app.html#wlanBasicSetting2g' } }
]);
assert.strictEqual(res1.passed, false, 'Grading must fail if 5G page has not been visited');
assert.strictEqual(res1.totalRules, 3, 'Total rules must be 3');

// Helper to mock a 5G document
function mock5gDoc(ssid, pwd, isSaved) {
  return {
    location: { href: 'http://localhost/cgi-bin/luci/admin/wlan/wlanaband/wlanBasicSetting5g' },
    _ftcIsSaved: isSaved,
    querySelector: function(sel) {
      if (sel === '#Txt_SSID') return { value: ssid };
      if (sel === '#Pwd_WpaPsk') return { value: pwd };
      return null;
    }
  };
}

// Case 2: 5G page visited but wrong credentials and not saved
const res2 = grader([
  { location: { href: 'http://localhost/sim_ax3000s/app.html' } },
  mock5gDoc('WrongSSID', '123', false)
]);
assert.strictEqual(res2.passed, false);
assert.strictEqual(res2.score, 0);
assert.strictEqual(res2.passedCount, 0);

// Case 3: Correct credentials and saved
const res3 = grader([
  { location: { href: 'http://localhost/sim_ax3000s/app.html' } },
  mock5gDoc('FPT Telecom', '19006600', true)
]);
assert.strictEqual(res3.passed, true, 'Grading must pass when SSID, WPA Key and Save are verified');
assert.strictEqual(res3.score, 100, 'Score must be 100');
assert.strictEqual(res3.passedCount, 3, '3 out of 3 rules must pass');
assert.ok(!res3.details.some(d => d.name.toLowerCase().includes('bandwidth')), 'No bandwidth rule in details');

console.log('ALL AX3000S BAI 2 WIFI TESTS PASSED SUCCESSFULLY!');
