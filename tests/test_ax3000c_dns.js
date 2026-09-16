'use strict';

const fs = require('fs');
const assert = require('assert');
const path = require('path');
const vm = require('vm');

const root = path.resolve(__dirname, '..');

// 1. Verify devices/ax3000c/lessons/bai4.js content
const bai4Code = fs.readFileSync(path.join(root, 'devices/ax3000c/lessons/bai4.js'), 'utf8');

// Ensure no hint text 'Gợi ý' exists in bai4.js
assert.ok(!bai4Code.includes('Gợi ý IP DNS'), 'bai4.js must not contain "Gợi ý IP DNS"');
assert.ok(!bai4Code.includes('210.245.31.221'), 'bai4.js must not contain obsolete hint IP 210.245.31.221');
assert.ok(!bai4Code.includes('8.8.4.4'), 'bai4.js must not contain obsolete hint IP 8.8.4.4');

// Verify evaluation & execution in VM context
const context = { window: {} };
vm.createContext(context);
vm.runInContext(bai4Code, context);

const lessons = context.window.DEVICE_AX3000C_LESSONS;
assert.ok(Array.isArray(lessons), 'DEVICE_AX3000C_LESSONS must be an array');
const bai4 = lessons.find(l => l.id === 'LAB_AX3000CV2_04');
assert.ok(bai4, 'LAB_AX3000CV2_04 must exist');

// Verify instructions array length and content
assert.strictEqual(bai4.instructions.length, 4, 'Instructions must have exactly 4 lines (no extra hint lines)');
assert.ok(bai4.instructions.some(i => i.includes('210.245.31.220')), 'Must contain DNS Server 1: 210.245.31.220');
assert.ok(bai4.instructions.some(i => i.includes('8.8.8.8')), 'Must contain DNS Server 2: 8.8.8.8');
for (const line of bai4.instructions) {
  assert.ok(!line.toLowerCase().includes('gợi ý'), `Instruction line must not contain hint: "${line}"`);
}

// Verify grading rules
const rules = bai4.grading.rules;
assert.strictEqual(rules.length, 3, 'Must have 3 grading rules');
const ruleCustom = rules.find(r => r.id === 'dns_custom_enable');
assert.strictEqual(ruleCustom.expected, 'Enable');
const ruleDns1 = rules.find(r => r.id === 'dns_server_1');
assert.strictEqual(ruleDns1.expected, '210.245.31.220');
const ruleDns2 = rules.find(r => r.id === 'dns_server_2');
assert.strictEqual(ruleDns2.expected, '8.8.8.8');

// 2. Verify devices/ax3000c/tooltips/bai4.js
const tooltipsCode = fs.readFileSync(path.join(root, 'devices/ax3000c/tooltips/bai4.js'), 'utf8');
const ttContext = { window: {} };
vm.createContext(ttContext);
vm.runInContext(tooltipsCode, ttContext);

const tooltips = ttContext.window.TOOLTIPS_AX3000C['LAB_AX3000CV2_04'];
assert.ok(Array.isArray(tooltips), 'tooltips array must exist');
const ttStep2 = tooltips.find(t => t.text.includes('Bước 2'));
assert.ok(ttStep2 && ttStep2.text.includes('210.245.31.220'), 'Step 2 tooltip must guide 210.245.31.220');
const ttStep3 = tooltips.find(t => t.text.includes('Bước 3'));
assert.ok(ttStep3 && ttStep3.text.includes('8.8.8.8'), 'Step 3 tooltip must guide 8.8.8.8');

// 3. Verify portal.html cachebuster is updated
const portalContent = fs.readFileSync(path.join(root, 'portal.html'), 'utf8');
assert.ok(portalContent.includes('devices/ax3000c/lessons/bai4.js?v=20260916101500'), 'portal.html must have updated cachebuster for bai4.js');
assert.ok(portalContent.includes('devices/ax3000c/tooltips/bai4.js?v=20260916101500'), 'portal.html must have updated cachebuster for tooltips bai4.js');

// Verify tooltip selector for Network points to Network title and not Status
const ttNetwork = tooltips.find(t => t.text.includes('Chọn Network'));
assert.ok(ttNetwork, 'Must have Chọn Network tooltip');
assert.ok(!ttNetwork.selector.includes(':not(.is-opened):contains("Network")'), 'Selector must not match parent submenu by contains');
assert.ok(ttNetwork.selector.includes('index="/network"'), 'Selector must target /network index');

console.log('ALL AX3000C DNS (BAI 4) TESTS PASSED SUCCESSFULLY!');
