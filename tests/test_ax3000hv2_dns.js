'use strict';

const fs = require('fs');
const assert = require('assert');
const path = require('path');
const vm = require('vm');

const root = path.resolve(__dirname, '..');

// 1. Verify bai4.js lesson structure
const bai4Code = fs.readFileSync(path.join(root, 'devices/ax3000hv2/lessons/bai4.js'), 'utf8');
const context = { window: {} };
vm.createContext(context);
vm.runInContext(bai4Code, context);

const lessons = context.window.DEVICE_AX3000HV2_LESSONS;
assert.ok(Array.isArray(lessons), 'DEVICE_AX3000HV2_LESSONS must be an array');
const bai4 = lessons.find(l => l.id === 'LAB_AX3000HV2_04');
assert.ok(bai4, 'LAB_AX3000HV2_04 must exist');

// Rules must ONLY contain primary and secondary DNS
assert.strictEqual(bai4.grading.rules.length, 2, 'Grading rules must only have 2 rules (Primary & Secondary DNS)');
assert.strictEqual(bai4.grading.rules[0].id, 'dns_primary');
assert.strictEqual(bai4.grading.rules[0].expected, '8.8.8.8');
assert.strictEqual(bai4.grading.rules[1].id, 'dns_secondary');
assert.strictEqual(bai4.grading.rules[1].expected, '8.8.4.4');

// DNS Relay must NOT be an enforced rule
assert.ok(!bai4.grading.rules.some(r => r.id === 'dns_relay'), 'dns_relay must not be in grading rules');

// 2. Verify portal.html cachebusters
const portalContent = fs.readFileSync(path.join(root, 'portal.html'), 'utf8');
assert.ok(portalContent.includes('devices/ax3000hv2/lessons/bai4.js?v=20260916103500'), 'portal.html must have updated cachebuster for AX3000HV2 bai4.js');
assert.ok(/app\.js\?v=\d+/.test(portalContent), 'portal.html must have updated cachebuster for app.js');

console.log('AX3000HV2 DNS (BAI 4) TESTS PASSED SUCCESSFULLY!');
