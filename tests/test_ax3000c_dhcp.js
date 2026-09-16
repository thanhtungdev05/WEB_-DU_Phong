'use strict';

const fs = require('fs');
const assert = require('assert');
const path = require('path');
const vm = require('vm');

const root = path.resolve(__dirname, '..');

// 1. Verify simulators/sim_ax3000c/www/sim-pages/lan.html initial HTML defaults
const lanHtml = fs.readFileSync(path.join(root, 'simulators/sim_ax3000c/www/sim-pages/lan.html'), 'utf8');
assert.ok(lanHtml.includes('value="192.168.100.1" id="lanIp"'), 'lan.html must have default Router LAN IP 192.168.100.1');
assert.ok(lanHtml.includes('value="192.168.100.2" id="dhcpStart"'), 'lan.html must have default DHCP Start 192.168.100.2');
assert.ok(lanHtml.includes('value="192.168.100.249" id="dhcpEnd"'), 'lan.html must have default DHCP End 192.168.100.249');
assert.ok(lanHtml.includes('<div class="lbl">DNS Server 1</div><div class="ctrl"><input type="text" value="192.168.100.1"></div>'), 'lan.html must have DNS Server 1 192.168.100.1');

// 2. Verify bai5.js lesson rules & instructions
const bai5Code = fs.readFileSync(path.join(root, 'devices/ax3000c/lessons/bai5.js'), 'utf8');
const context = { window: {} };
vm.createContext(context);
vm.runInContext(bai5Code, context);

const lessons = context.window.DEVICE_AX3000C_LESSONS;
assert.ok(Array.isArray(lessons), 'DEVICE_AX3000C_LESSONS must be an array');
const bai5 = lessons.find(l => l.id === 'LAB_AX3000CV2_05');
assert.ok(bai5, 'LAB_AX3000CV2_05 must exist');

const rules = bai5.grading.rules;
assert.equal(rules.length, 4, 'Must have 4 grading rules');

const ruleIP = rules.find(r => r.id === 'lan_ip');
assert.strictEqual(ruleIP.expected, '192.168.1.1', 'lan_ip expected must be 192.168.1.1');

const ruleMask = rules.find(r => r.id === 'subnet_mask');
assert.strictEqual(ruleMask.expected, '255.255.255.0', 'subnet_mask expected must be 255.255.255.0');

const ruleStart = rules.find(r => r.id === 'dhcp_start');
assert.strictEqual(ruleStart.expected, '192.168.1.2', 'dhcp_start expected must be 192.168.1.2');

const ruleEnd = rules.find(r => r.id === 'dhcp_end');
assert.strictEqual(ruleEnd.expected, '192.168.1.249', 'dhcp_end expected must be 192.168.1.249');

// 3. Verify tooltips/bai5.js
const tooltipsCode = fs.readFileSync(path.join(root, 'devices/ax3000c/tooltips/bai5.js'), 'utf8');
const ttContext = { window: {} };
vm.createContext(ttContext);
vm.runInContext(tooltipsCode, ttContext);

const tooltips = ttContext.window.TOOLTIPS_AX3000C['LAB_AX3000CV2_05'];
assert.ok(Array.isArray(tooltips), 'tooltips array must exist');

const ttStep1 = tooltips.find(t => t.text.includes('Bước 1'));
assert.ok(ttStep1 && ttStep1.text.includes('192.168.1.1') && ttStep1.expected === '192.168.1.1');

const ttStep3 = tooltips.find(t => t.text.includes('Bước 3'));
assert.ok(ttStep3 && ttStep3.text.includes('192.168.1.2') && ttStep3.expected === '192.168.1.2');

const ttStep4 = tooltips.find(t => t.text.includes('Bước 4'));
assert.ok(ttStep4 && ttStep4.text.includes('192.168.1.249') && ttStep4.expected === '192.168.1.249');

// 4. Verify portal.html cachebuster
const portalContent = fs.readFileSync(path.join(root, 'portal.html'), 'utf8');
assert.ok(portalContent.includes('devices/ax3000c/lessons/bai5.js?v=20260916101500'), 'portal.html must have updated cachebuster');

// Verify tooltip selector for Network points to Network title and not Status
const ttNetwork = tooltips.find(t => t.text.includes('Chọn Network'));
assert.ok(ttNetwork, 'Must have Chọn Network tooltip');
assert.ok(!ttNetwork.selector.includes(':not(.is-opened):contains("Network")'), 'Selector must not match parent submenu by contains');
assert.ok(ttNetwork.selector.includes('index="/network"'), 'Selector must target /network index');

// 5. Simulate grading
function simulateGrading(inputs) {
  let passedCount = 0;
  for (const rule of rules) {
    let val = inputs[rule.id];
    if (rule.trim && typeof val === 'string') val = val.trim();
    if (val === rule.expected) passedCount++;
  }
  return {
    score: Math.round((passedCount / rules.length) * 100),
    passed: passedCount === rules.length
  };
}

// Case 1: Initial default (student hasn't changed IP to 192.168.1.1 yet) -> must fail
const testDefault = simulateGrading({
  lan_ip: '192.168.100.1',
  subnet_mask: '255.255.255.0',
  dhcp_start: '192.168.100.2',
  dhcp_end: '192.168.100.249'
});
assert.strictEqual(testDefault.passed, false, 'Initial unchanged subnet must fail');

// Case 2: Configured properly according to new requirement (192.168.1.1) -> must pass
const testCorrect = simulateGrading({
  lan_ip: '192.168.1.1',
  subnet_mask: '255.255.255.0',
  dhcp_start: '192.168.1.2',
  dhcp_end: '192.168.1.249'
});
assert.strictEqual(testCorrect.passed, true, 'Configured subnet 192.168.1.1 must pass');
assert.strictEqual(testCorrect.score, 100, 'Score must be 100%');

console.log('ALL AX3000C DHCP (BAI 5) TESTS PASSED SUCCESSFULLY!');
