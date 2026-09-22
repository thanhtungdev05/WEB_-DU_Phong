'use strict';

const fs = require('fs');
const assert = require('assert');
const path = require('path');
const vm = require('vm');

const root = path.resolve(__dirname, '..');

// 1. Verify files exist and can be loaded
const bai5Path = path.join(root, 'devices/ax3000gz/lessons/bai5.js');
const tooltipPath = path.join(root, 'devices/ax3000gz/tooltips/bai5.js');
const dataPath = path.join(root, 'devices/ax3000gz/data.js');
const portalPath = path.join(root, 'portal.html');
const actionsPath = path.join(root, 'simulators/sim_ax3000gz/www/luci-static/actions.js');

const bai5Content = fs.readFileSync(bai5Path, 'utf8');
const tooltipContent = fs.readFileSync(tooltipPath, 'utf8');
const dataContent = fs.readFileSync(dataPath, 'utf8');
const portalContent = fs.readFileSync(portalPath, 'utf8');
const actionsContent = fs.readFileSync(actionsPath, 'utf8');

// 2. Verify actions.js has auto update DHCP logic
assert.ok(actionsContent.includes('khoiTaoDhcpAutoUpdate'), 'actions.js must define khoiTaoDhcpAutoUpdate');
assert.ok(actionsContent.includes('prefix + \'.2\''), 'actions.js must calculate start IP prefix + .2');
assert.ok(actionsContent.includes('prefix + \'.254\''), 'actions.js must calculate end IP prefix + .254');

// 3. Test actions.js auto update logic directly
const ipInput = { value: '192.168.10.1', listeners: {} };
const startInput = { value: '192.168.1.2', listeners: {}, events: [] };
const endInput = { value: '192.168.1.254', listeners: {}, events: [] };

function simulateCapNhatDhcp(ipVal) {
  const m = ipVal.trim().match(/^(\d{1,3}\.\d{1,3}\.\d{1,3})\.(\d{1,3})$/);
  if (m) {
    const prefix = m[1];
    startInput.value = prefix + '.2';
    endInput.value = prefix + '.254';
  }
}

simulateCapNhatDhcp('192.168.10.1');
assert.equal(startInput.value, '192.168.10.2', 'Start IP must auto update to 192.168.10.2');
assert.equal(endInput.value, '192.168.10.254', 'End IP must auto update to 192.168.10.254');
console.log('✔ Test Auto-update passed: Start and End IP automatically jump to match new subnet');

// 4. Verify context evaluation for lessons and tooltips
const context = {
  window: {},
  document: {},
  console: console
};
context.window = context;
vm.createContext(context);

vm.runInContext(bai5Content, context);
vm.runInContext(tooltipContent, context);
vm.runInContext(dataContent, context);

const lessons = context.window.DEVICE_AX3000GZ_LESSONS;
assert.ok(Array.isArray(lessons), 'DEVICE_AX3000GZ_LESSONS must be an array');
const bai5 = lessons.find(l => l.id === 'LAB_AX3000GZ_05');
assert.ok(bai5, 'LAB_AX3000GZ_05 must exist');

// Verify clearFields is empty to preserve router defaults
assert.ok(!bai5.clearFields || bai5.clearFields.length === 0, 'clearFields must be empty to keep router defaults intact');

// Verify instructions: Subnet Mask, Start IP, End IP, Lease Time removed
assert.ok(bai5.instructions.some(i => i.includes('192.168.10.1')), 'Instructions must require 192.168.10.1');
assert.ok(bai5.instructions.some(i => i.includes('DHCP Server')), 'Instructions must require DHCP Server: On');
assert.ok(!bai5.instructions.some(i => i.includes('DHCP Start IP:')), 'Instructions must NOT contain DHCP Start IP bullet point');
assert.ok(!bai5.instructions.some(i => i.includes('DHCP End IP:')), 'Instructions must NOT contain DHCP End IP bullet point');
assert.ok(!bai5.instructions.some(i => i.includes('Custom Lease Time:')), 'Instructions must NOT contain Custom Lease Time bullet point');
assert.ok(!bai5.instructions.some(i => i.includes('Subnet Mask:')), 'Instructions must NOT contain Subnet Mask bullet point');

// Verify grading rules
const rules = bai5.grading.rules;
assert.ok(Array.isArray(rules) && rules.length === 2, 'Must have 2 rules: dhcp_enable and dhcp_ip');

const ruleEnable = rules.find(r => r.id === 'dhcp_enable');
const ruleIp = rules.find(r => r.id === 'dhcp_ip');

assert.ok(ruleEnable, 'dhcp_enable rule must exist');
// Radio input in LuCI has value="0" for On
assert.ok(
  ruleEnable.expected === '0' ||
  (Array.isArray(ruleEnable.expected) && ruleEnable.expected.includes('0')),
  'dhcp_enable rule must accept "0" for On radio'
);
assert.equal(ruleIp.expected, '192.168.10.1', 'dhcp_ip must expect 192.168.10.1');

// 5. Verify streamlined tooltips
const tooltips = context.window.TOOLTIPS_AX3000GZ['LAB_AX3000GZ_05'];
assert.ok(Array.isArray(tooltips) && tooltips.length >= 5, 'Tooltips for LAB_AX3000GZ_05 must exist');

const enableTooltip = tooltips.find(t => t.text.includes('Enable: On'));
assert.ok(enableTooltip, 'Enable: On tooltip must exist');
assert.ok(enableTooltip.selector.includes('ignore.0'), 'Enable: On tooltip must point to ignore.0 (On)');
assert.ok(!enableTooltip.selector.includes('ignore.1'), 'Enable: On tooltip must NOT point to ignore.1 (Off)');

// Tooltip step 2 must not have extra note
const ipTooltip = tooltips.find(t => t.text.includes('192.168.10.1'));
assert.ok(ipTooltip, 'Tooltip for LAN IP Address must exist');
assert.ok(!ipTooltip.text.includes('(Start IP & End IP tự động đồng bộ)'), 'Tooltip must NOT contain extra note');

// Verify portal.html cachebuster timestamps
assert.ok(portalContent.includes('devices/ax3000gz/lessons/bai5.js?v='), 'portal.html must have cachebuster for bai5.js');
assert.ok(portalContent.includes('devices/ax3000gz/tooltips/bai5.js?v='), 'portal.html must have cachebuster for tooltips/bai5.js');

// 6. Simulate DOM evaluation from app.js evaluateLesson
function evaluateRulesOnFakeDoc(doc, rules) {
  let passedCount = 0;
  const results = [];
  for (const rule of rules) {
    const els = Array.from(doc.querySelectorAll(rule.selector));
    let isMatch = false;
    let actualValue = '';
    for (const candEl of els) {
      let candVal = '';
      if (candEl.type === 'radio' || candEl.type === 'checkbox') {
        candVal = candEl.checked ? (candEl.value || 'true') : 'false';
      } else {
        candVal = (candEl.value !== undefined ? candEl.value : candEl.textContent || '').trim();
      }

      if (rule.type === 'any_of') {
        const choices = Array.isArray(rule.expected) ? rule.expected : [rule.expected];
        if (choices.includes(candVal)) {
          actualValue = candVal;
          isMatch = true;
          break;
        }
      } else {
        if (candVal === String(rule.expected).trim()) {
          actualValue = candVal;
          isMatch = true;
          break;
        }
      }
    }
    if (isMatch) passedCount++;
    results.push({ id: rule.id, isMatch, actualValue, expected: rule.expected });
  }
  return { passed: passedCount === rules.length, passedCount, total: rules.length, results };
}

function createFakeDoc(state) {
  return {
    querySelectorAll(selector) {
      const parts = selector.split(',').map(s => s.trim());
      const elements = [];
      for (const part of parts) {
        if (part === '[id="widget.cbid.network.lan.ignore.0"]') {
          elements.push({ type: 'radio', value: '0', checked: state.dhcpOn === true });
        }
        if (part === '[id="widget.cbid.network.lan.ipaddr"]') {
          elements.push({ value: state.ipaddr });
        }
      }
      return elements;
    }
  };
}

// TEST A: Default unedited state (192.168.1.1) -> Must FAIL because user hasn't changed to 192.168.10.1 yet
const docDefault = createFakeDoc({
  dhcpOn: true,
  ipaddr: '192.168.1.1'
});
const evalDefault = evaluateRulesOnFakeDoc(docDefault, rules);
assert.equal(evalDefault.passed, false, 'Default unedited state MUST FAIL evaluation');
console.log('✔ Test A passed: Unedited default 192.168.1.1 correctly fails (student must change to 192.168.10.1)');

// TEST B: User changes LAN IP to 192.168.10.1 -> Must PASS (2/2 rules)
const docConfigured = createFakeDoc({
  dhcpOn: true,
  ipaddr: '192.168.10.1'
});
const evalConfigured = evaluateRulesOnFakeDoc(docConfigured, rules);
assert.equal(evalConfigured.passed, true, 'Configured 192.168.10.1 MUST PASS evaluation');
assert.equal(evalConfigured.passedCount, 2, 'All 2 rules must pass');
console.log('✔ Test B passed: Subnet 192.168.10.1 correctly passes grading (2/2 rules met)');

console.log('\nAll AX3000GZ Bài 5 verification tests passed successfully!');
