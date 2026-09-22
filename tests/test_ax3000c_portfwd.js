'use strict';

const fs = require('fs');
const assert = require('assert');
const path = require('path');
const vm = require('vm');

const root = path.resolve(__dirname, '..');

// 1. Verify devices/ax3000c/lessons/bai6.js
const bai6Code = fs.readFileSync(path.join(root, 'devices/ax3000c/lessons/bai6.js'), 'utf8');
const context = { window: {} };
vm.createContext(context);
vm.runInContext(bai6Code, context);

const lessons = context.window.DEVICE_AX3000C_LESSONS;
assert.ok(Array.isArray(lessons), 'DEVICE_AX3000C_LESSONS must be an array');
const bai6 = lessons.find(l => l.id === 'LAB_AX3000CV2_06');
assert.ok(bai6, 'LAB_AX3000CV2_06 must exist');

// 2. Verify devices/ax3000c/tooltips/bai6.js
const tooltipsCode = fs.readFileSync(path.join(root, 'devices/ax3000c/tooltips/bai6.js'), 'utf8');
const ttContext = { window: {} };
vm.createContext(ttContext);
vm.runInContext(tooltipsCode, ttContext);

const tooltips = ttContext.window.TOOLTIPS_AX3000C['LAB_AX3000CV2_06'];
assert.ok(Array.isArray(tooltips), 'tooltips array must exist');

const ttNetwork = tooltips.find(t => t.text.includes('Chọn Network'));
assert.ok(ttNetwork, 'Must have Chọn Network tooltip');
assert.ok(!ttNetwork.selector.includes(':not(.is-opened):contains("Network")'), 'Selector must not match parent submenu by contains');
assert.ok(ttNetwork.selector.includes('index="/network"'), 'Selector must target /network index');

const ttAccess = tooltips.find(t => t.text.includes('Chọn Access'));
assert.ok(ttAccess, 'Must have Chọn Access tooltip');

const ttPortFwd = tooltips.find(t => t.text.includes('Chọn Port Forwarding'));
assert.ok(ttPortFwd, 'Must have Chọn Port Forwarding tooltip');

// 3. Verify portal.html cachebuster is updated
const portalContent = fs.readFileSync(path.join(root, 'portal.html'), 'utf8');
assert.ok(portalContent.includes('devices/ax3000c/lessons/bai6.js?v=20260916101500'), 'portal.html must have updated cachebuster for bai6.js');
assert.ok(portalContent.includes('devices/ax3000c/tooltips/bai6.js?v=20260916101500'), 'portal.html must have updated cachebuster for tooltips bai6.js');

console.log('ALL AX3000C PORT FORWARDING (BAI 6) TESTS PASSED SUCCESSFULLY!');
