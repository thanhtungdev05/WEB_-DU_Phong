'use strict';

const fs = require('fs');
const assert = require('assert');
const path = require('path');
const vm = require('vm');

const root = path.resolve(__dirname, '..');

// 1. Verify bai5.js grading rules structure and allowedSelectors
const bai5Code = fs.readFileSync(path.join(root, 'devices/ax3000hv2/lessons/bai5.js'), 'utf8');
const context = { window: {} };
vm.createContext(context);
vm.runInContext(bai5Code, context);

const lessons = context.window.DEVICE_AX3000HV2_LESSONS;
assert.ok(Array.isArray(lessons), 'DEVICE_AX3000HV2_LESSONS must be an array');
const bai5 = lessons.find(l => l.id === 'LAB_AX3000HV2_05');
assert.ok(bai5, 'LAB_AX3000HV2_05 must exist');

const rules = bai5.grading.rules;
assert.equal(rules.length, 6, 'Must have exactly 6 rules: IP, Mask, DHCP Enable, Start IP, Pool Size, Lease Time');

const ruleIP = rules.find(r => r.id === 'dhcp_ip');
const ruleMask = rules.find(r => r.id === 'dhcp_mask');
const ruleDHCP = rules.find(r => r.id === 'dhcp_enable');
const ruleStart = rules.find(r => r.id === 'dhcp_start');
const rulePool = rules.find(r => r.id === 'dhcp_pool');
const ruleLease = rules.find(r => r.id === 'dhcp_lease');

assert.ok(ruleIP, 'dhcp_ip must exist');
assert.equal(ruleIP.expected, '192.168.100.1');

assert.ok(ruleMask, 'dhcp_mask must exist');
assert.equal(ruleMask.expected, '255.255.255.0');

assert.ok(ruleDHCP, 'dhcp_enable must exist');
assert.equal(ruleDHCP.name, 'DHCP');
assert.equal(ruleDHCP.selector, 'input[name="dhcpTypeRadio"]');
assert.ok(Array.isArray(ruleDHCP.expected), 'ruleDHCP.expected must be an array');
assert.ok(ruleDHCP.expected.includes('1'), 'expected must include 1');
assert.ok(ruleDHCP.expected.includes('Enable'), 'expected must include Enable');
assert.ok(ruleDHCP.expected.includes('Bật/Enable'), 'expected must include Bật/Enable');
assert.equal(ruleDHCP.displayExpected, 'Bật/Enable');

assert.ok(ruleStart, 'dhcp_start must exist');
assert.equal(ruleStart.expected, '192.168.100.2');

assert.ok(rulePool, 'dhcp_pool must exist');
assert.equal(rulePool.expected, '253');

assert.ok(ruleLease, 'dhcp_lease must exist');
assert.equal(ruleLease.expected, '86400');

// Verify allowedSelectors
assert.ok(Array.isArray(bai5.allowedSelectors), 'bai5 must have allowedSelectors array');
assert.ok(bai5.allowedSelectors.includes('input[name="dhcpTypeRadio"]'), 'allowedSelectors must include dhcpTypeRadio');
assert.ok(Array.isArray(bai5.grading.allowedSelectors), 'bai5.grading must have allowedSelectors array');
assert.ok(bai5.grading.allowedSelectors.includes('input[name="dhcpTypeRadio"]'), 'grading.allowedSelectors must include dhcpTypeRadio');

// 2. Verify app.js logic
const appContent = fs.readFileSync(path.join(root, 'app.js'), 'utf8');
assert.ok(appContent.includes('dhcptyperadio'), 'app.js must handle dhcptyperadio in isAuxToggle and unexpected filter');
assert.ok(appContent.includes("lbl === 'dhcp'"), 'app.js unexpectedErrors filter must handle lbl === dhcp');
assert.ok(appContent.includes("actualValue === '1' || actualValue === 'true'"), 'app.js must format dhcpTypeRadio actual display to Bật/Enable');

// 3. Verify portal.html cachebusters
const portalContent = fs.readFileSync(path.join(root, 'portal.html'), 'utf8');
assert.ok(portalContent.includes('devices/ax3000hv2/lessons/bai5.js?v=20260917142000'), 'portal.html must have updated cachebuster for lessons/bai5.js');
assert.ok(/app\.js\?v=202609\d+/.test(portalContent), 'portal.html must have updated cachebuster for app.js');

// 4. Test evaluateLesson simulation for DHCP: Enable vs Disable
function simulateDHCPEval(dhcpRadioValue) {
  const inputs = {
    'input[name="uiViewIPAddr"]': '192.168.100.1',
    'input[name="uiViewNetMask"]': '255.255.255.0',
    'input[name="dhcpTypeRadio"]': dhcpRadioValue,
    'input[name="StartIp"]': '192.168.100.2',
    'input[name="PoolSize"]': '253',
    'input[name="dhcp_LeaseTime"]': '86400'
  };

  let passedCount = 0;
  const results = [];
  for (const r of rules) {
    const candVal = String(inputs[r.selector] || '').trim();
    let isMatch = false;
    if (r.type === 'any_of') {
      const choices = Array.isArray(r.expected) ? r.expected : [r.expected];
      isMatch = choices.some(c => c === candVal);
    } else {
      isMatch = candVal === r.expected;
    }
    if (isMatch) passedCount++;

    let displayActual = candVal;
    if (r.selector.includes('dhcpTypeRadio')) {
      displayActual = (candVal === '1' || candVal === 'Enable') ? 'Bật/Enable' : 'Tắt/Disable';
    }

    results.push({
      id: r.id,
      name: r.name,
      expected: r.displayExpected || r.expected,
      actual: displayActual,
      passed: isMatch
    });
  }

  return {
    passed: passedCount === rules.length,
    passedCount,
    total: rules.length,
    results
  };
}

// Case 1: KTV chọn Enable (value = '1') -> ĐẠT 6/6 (100%)
const testEnable = simulateDHCPEval('1');
assert.equal(testEnable.passed, true, 'Grading MUST PASS when DHCP is Enable');
assert.equal(testEnable.passedCount, 6, 'Must pass all 6 rules');
const dhcpResultEnable = testEnable.results.find(r => r.id === 'dhcp_enable');
assert.equal(dhcpResultEnable.passed, true);
assert.equal(dhcpResultEnable.actual, 'Bật/Enable');
assert.equal(dhcpResultEnable.expected, 'Bật/Enable');

// Case 2: KTV chọn Disable (value = '0') -> CHƯA ĐẠT (5/6)
const testDisable = simulateDHCPEval('0');
assert.equal(testDisable.passed, false, 'Grading MUST FAIL when DHCP is Disable');
assert.equal(testDisable.passedCount, 5, 'Must pass 5 out of 6 rules');
const dhcpResultDisable = testDisable.results.find(r => r.id === 'dhcp_enable');
assert.equal(dhcpResultDisable.passed, false, 'DHCP rule MUST FAIL when Disable');
assert.equal(dhcpResultDisable.expected, 'Bật/Enable');
assert.equal(dhcpResultDisable.actual, 'Tắt/Disable');

// 5. Test unexpected error filter: Ensure DHCP is not penalized as an unexpected error
const unexpectedList = [
  { label: 'DHCP', expected: 'Tắt/Disable', actual: 'Bật/Enable' },
  { label: 'Trường sửa bừa', expected: '0', actual: '1' }
];
const filteredUnexpected = unexpectedList.filter(err => {
  const lbl = (err.label || '').toLowerCase();
  if (lbl === 'dhcp' || lbl === 'dhcp server' || lbl.includes('dhcptyperadio')) {
    return false;
  }
  return true;
});
assert.equal(filteredUnexpected.length, 1, 'DHCP should be removed from unexpectedErrors');
assert.equal(filteredUnexpected[0].label, 'Trường sửa bừa');

console.log('All AX3000HV2 Bai 5 DHCP tests passed successfully!');
