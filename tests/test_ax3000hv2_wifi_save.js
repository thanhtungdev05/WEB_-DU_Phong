'use strict';

const fs = require('fs');
const assert = require('assert');
const path = require('path');
const vm = require('vm');

const root = path.resolve(__dirname, '..');

// 1. Verify bai2 tooltips
const tooltipContent = fs.readFileSync(path.join(root, 'devices/ax3000hv2/tooltips/bai2.js'), 'utf8');
assert.ok(tooltipContent.includes("hideOnPage: 'wifi_basic'"), 'Bước 1 and 2 must have hideOnPage: wifi_basic');
assert.ok(tooltipContent.includes("page: 'wifi_basic'"), 'Steps 3-7 must have page: wifi_basic');

// 2. Verify server2.py
const server2Content = fs.readFileSync(path.join(root, 'simulators/sim_ax3000hv2/server2.py'), 'utf8');
assert.ok(!server2Content.includes('alert("Operate successfully!");'), 'alert must be removed from server2.py');
assert.ok(server2Content.includes('document._ftcIsSaved = true;'), 'document._ftcIsSaved must be set in server2.py');
assert.ok(server2Content.includes('wifi_basic'), 'wifi_basic must be in get_nav_and_tab_for_page');

// 3. Verify app.js
const appContent = fs.readFileSync(path.join(root, 'app.js'), 'utf8');
assert.ok(appContent.includes('save_success=1'), 'save_success=1 handling must be present in app.js');
assert.ok(appContent.includes('FTC_SAVE_SUCCESS'), 'FTC_SAVE_SUCCESS handling must be present in app.js');
assert.ok(appContent.includes('_ftcScrollBound'), 'Scroll listener for tooltips must be present in app.js');

// 4. Verify portal.html cachebuster timestamps
const portalContent = fs.readFileSync(path.join(root, 'portal.html'), 'utf8');
assert.ok(portalContent.includes('devices/ax3000hv2/lessons/bai2.js?v=20260915141500'), 'bai2.js cachebuster must be updated in portal.html');
assert.ok(/app\.js\?v=\d+/.test(portalContent), 'app.js cachebuster must be updated in portal.html');

// 5. Verify bai2.js grading rules structure and strict grading evaluation
const bai2Code = fs.readFileSync(path.join(root, 'devices/ax3000hv2/lessons/bai2.js'), 'utf8');
const context = { window: {} };
vm.createContext(context);
vm.runInContext(bai2Code, context);

const lessons = context.window.DEVICE_AX3000HV2_LESSONS;
assert.ok(Array.isArray(lessons), 'DEVICE_AX3000HV2_LESSONS must be an array');
const bai2 = lessons.find(l => l.id === 'LAB_AX3000HV2_02');
assert.ok(bai2, 'LAB_AX3000HV2_02 must exist');

const rules = bai2.grading.rules;
assert.equal(rules.length, 4, 'Must have exactly 4 rules: 2.4G SSID, 2.4G Key, 5G SSID, 5G Key');

const rule2GSSID = rules.find(r => r.id === 'host_ssid_2g');
const rule2GKey = rules.find(r => r.id === 'host_key_2g');
const rule5GSSID = rules.find(r => r.id === 'host_ssid_5g');
const rule5GKey = rules.find(r => r.id === 'host_key_5g');

assert.ok(rule2GSSID, 'host_ssid_2g must exist');
assert.equal(rule2GSSID.selector, 'input[name="ESSID"]');

assert.ok(rule2GKey, 'host_key_2g must exist');
assert.equal(rule2GKey.selector, 'input[name="PreSharedKey"]');
assert.equal(rule2GKey.expected, 'fpt12345');

assert.ok(rule5GSSID, 'host_ssid_5g must exist');
assert.equal(rule5GSSID.selector, 'input[name="ESSID_5g"]');

assert.ok(rule5GKey, 'host_key_5g must exist');
assert.equal(rule5GKey.selector, 'input[name="PreSharedKey_5g"]');
assert.equal(rule5GKey.expected, 'fpt12345');

// 6. Test grading simulation matching portal app.js evaluateLesson logic
function simulateGrading(inputs) {
  let passedCount = 0;
  const results = [];
  for (const rule of rules) {
    const candVal = (inputs[rule.selector] !== undefined ? inputs[rule.selector] : '').trim();
    let candidateMatch = false;

    if (rule.type === 'text_exact') {
      candidateMatch = candVal === String(rule.expected).trim();
    } else if (rule.type === 'any_of') {
      const choices = Array.isArray(rule.expected)
        ? rule.expected.map(v => String(v).trim())
        : String(rule.expected).split(',').map(v => v.trim());
      candidateMatch = choices.some(v => candVal === v);
    }

    if (candidateMatch) passedCount++;
    results.push({ id: rule.id, passed: candidateMatch, actual: candVal, expected: rule.expected });
  }
  return {
    passed: passedCount === rules.length,
    passedCount,
    total: rules.length,
    results
  };
}

// Case 1: User types FTp TeleCom (wrong case / typo) -> MUST FAIL!
const testWrongCase = simulateGrading({
  'input[name="ESSID"]': 'FTp TeleCom',
  'input[name="PreSharedKey"]': 'fpt12345',
  'input[name="ESSID_5g"]': 'FTp TeleCom',
  'input[name="PreSharedKey_5g"]': 'fpt12345'
});
assert.equal(testWrongCase.passed, false, 'Grading MUST FAIL when SSID is FTp TeleCom');
assert.equal(testWrongCase.results.find(r => r.id === 'host_ssid_2g').passed, false);
assert.equal(testWrongCase.results.find(r => r.id === 'host_ssid_5g').passed, false);

// Case 2: User types fpt telecom (all lowercase) -> MUST FAIL!
const testLower = simulateGrading({
  'input[name="ESSID"]': 'fpt telecom',
  'input[name="PreSharedKey"]': 'fpt12345',
  'input[name="ESSID_5g"]': 'fpt telecom',
  'input[name="PreSharedKey_5g"]': 'fpt12345'
});
assert.equal(testLower.passed, false, 'Grading MUST FAIL when SSID is fpt telecom');

// Case 3: User types fpt1234567 for 5G password -> MUST FAIL!
const testWrongPass = simulateGrading({
  'input[name="ESSID"]': 'FPT Telecom',
  'input[name="PreSharedKey"]': 'fpt12345',
  'input[name="ESSID_5g"]': 'FPT Telecom',
  'input[name="PreSharedKey_5g"]': 'fpt1234567'
});
assert.equal(testWrongPass.passed, false, 'Grading MUST FAIL when 5G password is fpt1234567');
assert.equal(testWrongPass.results.find(r => r.id === 'host_key_5g').passed, false);

// Case 4: User types FPT Telecom (exact standard) -> MUST PASS!
const testFPT = simulateGrading({
  'input[name="ESSID"]': 'FPT Telecom',
  'input[name="PreSharedKey"]': 'fpt12345',
  'input[name="ESSID_5g"]': 'FPT Telecom',
  'input[name="PreSharedKey_5g"]': 'fpt12345'
});
assert.equal(testFPT.passed, true, 'Grading MUST PASS when all 4 rules are satisfied with FPT Telecom');
assert.equal(testFPT.passedCount, 4);

// Case 5: User types FTP Telecom -> MUST PASS!
const testFTP = simulateGrading({
  'input[name="ESSID"]': 'FTP Telecom',
  'input[name="PreSharedKey"]': 'fpt12345',
  'input[name="ESSID_5g"]': 'FTP Telecom',
  'input[name="PreSharedKey_5g"]': 'fpt12345'
});
assert.equal(testFTP.passed, true, 'Grading MUST PASS when all 4 rules are satisfied with FTP Telecom');
assert.equal(testFTP.passedCount, 4);

console.log('AX3000HV2 Wi-Fi exact case and SSID/Password strict regression tests passed successfully!');
