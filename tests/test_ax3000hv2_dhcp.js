'use strict';

const fs = require('fs');
const assert = require('assert');
const path = require('path');
const vm = require('vm');

const root = path.resolve(__dirname, '..');

// 1. Verify bai5.js content and clearFields
const bai5Code = fs.readFileSync(path.join(root, 'devices/ax3000hv2/lessons/bai5.js'), 'utf8');
const context = { window: {} };
vm.createContext(context);
vm.runInContext(bai5Code, context);

const lessons = context.window.DEVICE_AX3000HV2_LESSONS;
assert.ok(Array.isArray(lessons), 'DEVICE_AX3000HV2_LESSONS must be an array');
const bai5 = lessons.find(l => l.id === 'LAB_AX3000HV2_05');
assert.ok(bai5, 'LAB_AX3000HV2_05 must exist');

// clearFields must be empty so default subnet 192.168.1.1 is preserved on load
assert.equal(bai5.clearFields.length, 0, 'clearFields must be empty to preserve default 192.168.1.1/24 subnet');

// 2. Verify grading rules
const rules = bai5.grading.rules;
assert.equal(rules.length, 6, 'Must have 6 rules: IP, Mask, DHCP Enable, Start IP, Pool, Lease');

const ruleIP = rules.find(r => r.id === 'dhcp_ip');
assert.ok(ruleIP, 'dhcp_ip rule must exist');
assert.strictEqual(ruleIP.expected, '192.168.100.1');

const ruleStart = rules.find(r => r.id === 'dhcp_start');
assert.ok(ruleStart, 'dhcp_start rule must exist');
assert.strictEqual(ruleStart.expected, '192.168.100.2');

const ruleMask = rules.find(r => r.id === 'dhcp_mask');
assert.strictEqual(ruleMask.expected, '255.255.255.0');

// 3. Verify guidePopups (steps 7 & 8 removed as requested by user)
const popups = bai5.guidePopups;
assert.ok(Array.isArray(popups) && popups.length === 7, 'Must have 7 guide popup steps after removing steps 7 & 8');

// Steps 1 & 2 hide on home_lan.asp
assert.strictEqual(popups[0].hideOnPage, 'home_lan.asp');
assert.strictEqual(popups[1].hideOnPage, 'home_lan.asp');

// Steps 3-7 belong to home_lan.asp
for (let i = 2; i < 7; i++) {
  assert.strictEqual(popups[i].page, 'home_lan.asp', `Step ${i + 1} must belong to home_lan.asp`);
}
assert.strictEqual(popups[6].text, 'Bước 7: Chọn Save');

// 4. Verify portal.html cachebuster
const portalContent = fs.readFileSync(path.join(root, 'portal.html'), 'utf8');
assert.ok(portalContent.includes('devices/ax3000hv2/lessons/bai5.js?v=20260915145700'), 'portal.html must have updated cachebuster for bai5.js');

// 5. Test grading simulation
function simulateGrading(inputs) {
  let passedCount = 0;
  for (const rule of rules) {
    const candVal = (inputs[rule.selector] !== undefined ? inputs[rule.selector] : '').trim();
    if (rule.type === 'element_exists') {
      if (inputs[rule.selector] === true || inputs[rule.selector] === 'Enable') passedCount++;
    } else if (candVal === String(rule.expected).trim()) {
      passedCount++;
    }
  }
  return {
    passed: passedCount === rules.length,
    passedCount,
    total: rules.length
  };
}

// Case 1: Keeping default 192.168.1.1 without changing subnet -> MUST FAIL
const testDefault = simulateGrading({
  'input[name="uiViewIPAddr"]': '192.168.1.1',
  'input[name="uiViewNetMask"]': '255.255.255.0',
  'input[name="dhcpTypeRadio"][value="1" i]:checked': 'Enable',
  'input[name="StartIp"]': '192.168.1.2',
  'input[name="PoolSize"]': '253',
  'input[name="dhcp_LeaseTime"]': '86400'
});
assert.strictEqual(testDefault.passed, false, 'Default 192.168.1.1 without modifying subnet must fail');

// Case 2: Changing to 192.168.100.1 / 192.168.100.2 -> MUST PASS
const testNewSubnet = simulateGrading({
  'input[name="uiViewIPAddr"]': '192.168.100.1',
  'input[name="uiViewNetMask"]': '255.255.255.0',
  'input[name="dhcpTypeRadio"][value="1" i]:checked': 'Enable',
  'input[name="StartIp"]': '192.168.100.2',
  'input[name="PoolSize"]': '253',
  'input[name="dhcp_LeaseTime"]': '86400'
});
assert.strictEqual(testNewSubnet.passed, true, 'Changed subnet 192.168.100.1 must pass');
assert.strictEqual(testNewSubnet.passedCount, 6);

console.log('AX3000HV2 DHCP Bai 5 regression tests passed successfully!');
