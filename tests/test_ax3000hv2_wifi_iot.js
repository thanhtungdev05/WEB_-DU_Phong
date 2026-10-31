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

// 2. Verify tooltips/bai3.js structure and conditions
const tooltipsCode = fs.readFileSync(path.join(root, 'devices/ax3000hv2/tooltips/bai3.js'), 'utf8');
const tooltipsContext = { window: {} };
vm.createContext(tooltipsContext);
vm.runInContext(tooltipsCode, tooltipsContext);

const tooltips = tooltipsContext.window.TOOLTIPS_AX3000HV2['LAB_AX3000HV2_03'];
assert.ok(Array.isArray(tooltips), 'Tooltips for LAB_AX3000HV2_03 must exist');
assert.equal(tooltips.length, 6, 'Tooltips must have exactly 6 steps');

const lessonPopups = bai3.guidePopups;
assert.ok(Array.isArray(lessonPopups), 'guidePopups in bai3 must exist');
assert.equal(lessonPopups.length, 6, 'guidePopups must have exactly 6 steps');

// 3. Test condition logic for sequential step gating on both tooltips and lesson guidePopups
[
  { name: 'tooltips/bai3.js', list: tooltips },
  { name: 'lessons/bai3.js', list: lessonPopups }
].forEach(({ name, list }) => {
  const step3 = list.find(s => s.text.includes('Bước 3'));
  const step4 = list.find(s => s.text.includes('Bước 4'));
  const step5 = list.find(s => s.text.includes('Bước 5'));
  const step6 = list.find(s => s.text.includes('Bước 6'));

  assert.ok(step3 && typeof step3.condition === 'function', `${name}: Step 3 must have condition function`);
  assert.ok(step4 && typeof step4.condition === 'function', `${name}: Step 4 must have condition function`);
  assert.ok(step5 && typeof step5.condition === 'function', `${name}: Step 5 must have condition function`);
  assert.ok(step6 && typeof step6.condition === 'function', `${name}: Step 6 must have condition function`);

  // Helper to build mock DOM document
  function createMockDoc({ enable2G, ssid, pwd, saved }) {
    return {
      _ftcIsSaved: Boolean(saved),
      location: { search: '' },
      querySelector(selector) {
        const s = selector.toLowerCase();
        if (s.includes('enable_wifi5_2g') && s.includes('1')) {
          return { checked: Boolean(enable2G) };
        }
        if (s.includes('wifi5ssid_2g')) {
          return { value: ssid !== undefined ? ssid : '' };
        }
        if (s.includes('wifi5pwd_2g')) {
          return { value: pwd !== undefined ? pwd : '' };
        }
        return null;
      }
    };
  }

  // State 0: Initial state (2.4G Disable, empty fields)
  // BUG IN SCREENSHOT: Step 6 was appearing alongside Step 3!
  const docInit = createMockDoc({ enable2G: false, ssid: '', pwd: '', saved: false });
  assert.strictEqual(step3.condition(docInit), true, `${name} State 0: Step 3 must be visible`);
  assert.strictEqual(step4.condition(docInit), false, `${name} State 0: Step 4 must be hidden`);
  assert.strictEqual(step5.condition(docInit), false, `${name} State 0: Step 5 must be hidden`);
  assert.strictEqual(step6.condition(docInit), false, `${name} State 0: Step 6 MUST be hidden (fixes screenshot bug)`);

  // State 1: 2.4G Enabled, SSID empty
  const docEnabled = createMockDoc({ enable2G: true, ssid: '', pwd: '', saved: false });
  assert.strictEqual(step3.condition(docEnabled), false, `${name} State 1: Step 3 must hide after enable`);
  assert.strictEqual(step4.condition(docEnabled), true, `${name} State 1: Step 4 must be visible`);
  assert.strictEqual(step5.condition(docEnabled), false, `${name} State 1: Step 5 must be hidden`);
  assert.strictEqual(step6.condition(docEnabled), false, `${name} State 1: Step 6 must be hidden`);

  // State 2: SSID entered ("FPT IoT"), password empty
  const docSsidDone = createMockDoc({ enable2G: true, ssid: 'FPT IoT', pwd: '', saved: false });
  assert.strictEqual(step3.condition(docSsidDone), false, `${name} State 2: Step 3 must be hidden`);
  assert.strictEqual(step4.condition(docSsidDone), false, `${name} State 2: Step 4 must hide after entering SSID`);
  assert.strictEqual(step5.condition(docSsidDone), true, `${name} State 2: Step 5 must be visible`);
  assert.strictEqual(step6.condition(docSsidDone), false, `${name} State 2: Step 6 must be hidden`);

  // State 3: Password entered ("fptiot123"), ready to Save
  const docPwdDone = createMockDoc({ enable2G: true, ssid: 'FPT IoT', pwd: 'fptiot123', saved: false });
  assert.strictEqual(step3.condition(docPwdDone), false, `${name} State 3: Step 3 must be hidden`);
  assert.strictEqual(step4.condition(docPwdDone), false, `${name} State 3: Step 4 must be hidden`);
  assert.strictEqual(step5.condition(docPwdDone), false, `${name} State 3: Step 5 must hide after entering Password`);
  assert.strictEqual(step6.condition(docPwdDone), true, `${name} State 3: Step 6 must be visible`);

  // State 4: Saved successfully
  const docSaved = createMockDoc({ enable2G: true, ssid: 'FPT IoT', pwd: 'fptiot123', saved: true });
  assert.strictEqual(step6.condition(docSaved), false, `${name} State 4: Step 6 must hide after Save`);
});

// 4. Verify wifi5.asp simulator checkSubmit and notifyGuidePopups
const wifi5AspContent = fs.readFileSync(path.join(root, 'simulators/sim_ax3000hv2/www2/cgi-bin/wifi5.asp'), 'utf8');
assert.ok(wifi5AspContent.includes('is5G && wpapskCheck'), 'wifi5.asp must only validate 5G password when 5G is enabled');
assert.ok(wifi5AspContent.includes('notifyGuidePopups'), 'wifi5.asp must define notifyGuidePopups');
assert.ok(wifi5AspContent.includes('REQUEST_GUIDE_POPUPS'), 'wifi5.asp must post REQUEST_GUIDE_POPUPS');

// 5. Verify portal.html cachebuster
const portalContent = fs.readFileSync(path.join(root, 'portal.html'), 'utf8');
assert.ok(/devices\/ax3000hv2\/lessons\/bai3\.js\?v=[a-f0-9]{16}/.test(portalContent), 'portal.html must have 16-hex hash cachebuster for bai3.js');
assert.ok(/devices\/ax3000hv2\/tooltips\/bai3\.js\?v=[a-f0-9]{16}/.test(portalContent), 'portal.html must have 16-hex hash cachebuster for tooltips/bai3.js');

console.log('All AX3000HV2 Bai 3 Wi-Fi IoT tests passed successfully!');
