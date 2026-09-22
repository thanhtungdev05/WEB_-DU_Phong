'use strict';

const fs = require('fs');
const assert = require('assert');
const path = require('path');
const vm = require('vm');

const root = path.resolve(__dirname, '..');

// 1. Verify ONT BE6500C bai4.js lesson structure
const ontBai4Code = fs.readFileSync(path.join(root, 'devices/ONT_be6500c/lessons/bai4.js'), 'utf8');
const ontContext = { window: {} };
vm.createContext(ontContext);
vm.runInContext(ontBai4Code, ontContext);

const ontLessons = ontContext.window.DEVICE_ONT_BE6500C_LESSONS;
assert.ok(Array.isArray(ontLessons), 'DEVICE_ONT_BE6500C_LESSONS must be an array');
const ontBai4 = ontLessons.find(l => l.id === 'ONT_be6500c-bai4');
assert.ok(ontBai4, 'ONT_be6500c-bai4 must exist');

// Rules must ONLY contain primary and secondary DNS
assert.strictEqual(ontBai4.grading.rules.length, 2, 'Grading rules must only have 2 rules (Primary & Secondary DNS)');
assert.strictEqual(ontBai4.grading.rules[0].id, 'dns_1');
assert.strictEqual(ontBai4.grading.rules[0].name, 'Primary DNS');
assert.strictEqual(ontBai4.grading.rules[0].expected, '8.8.8.8');
assert.strictEqual(ontBai4.grading.rules[1].id, 'dns_2');
assert.strictEqual(ontBai4.grading.rules[1].name, 'Secondary DNS');
assert.strictEqual(ontBai4.grading.rules[1].expected, '8.8.4.4');

// Must NOT contain Chế độ DNS or expected manual
assert.ok(!ontBai4.grading.rules.some(r => (r.name && r.name.toLowerCase().includes('chế độ dns')) ||(r.name && r.name.toLowerCase().includes('dns mode'))
  || r.expected === 'manual'),
  'No Chế độ DNS or manual rule must be present in grading rules');

// 2. Verify AP BE6500C bai4.js lesson structure
const apBai4Code = fs.readFileSync(path.join(root, 'devices/be6500c/lessons/bai4.js'), 'utf8');
const apContext = { window: {} };
vm.createContext(apContext);
vm.runInContext(apBai4Code, apContext);

const apLessons = apContext.window.DEVICE_BE6500C_LESSONS;
assert.ok(Array.isArray(apLessons), 'DEVICE_BE6500C_LESSONS must be an array');
const apBai4 = apLessons.find(l => l.id === 'be6500c-bai4');
assert.ok(apBai4, 'be6500c-bai4 must exist');
assert.strictEqual(apBai4.grading.rules.length, 2, 'Grading rules must only have 2 rules (Primary & Secondary DNS)');
assert.ok(!apBai4.grading.rules.some(r => (r.name && r.name.toLowerCase().includes('chế độ dns')) || r.expected === 'manual'),
  'No Chế độ DNS or manual rule must be present in AP BE6500C grading rules');

// 3. Verify portal.html cachebusters
const portalContent = fs.readFileSync(path.join(root, 'portal.html'), 'utf8');
assert.ok(/devices\/ONT_be6500c\/lessons\/bai4\.js\?v=20260916\d+/.test(portalContent),
  'portal.html must have updated cachebuster for ONT BE6500C bai4.js');
assert.ok(/devices\/be6500c\/lessons\/bai4\.js\?v=20260916\d+/.test(portalContent),
  'portal.html must have updated cachebuster for AP BE6500C bai4.js');
assert.ok(/app\.js\?v=202609\d+/.test(portalContent),
  'portal.html must have updated cachebuster for app.js');

// 4. Verify evaluateLesson filtering logic
const appJsContent = fs.readFileSync(path.join(root, 'app.js'), 'utf8');
assert.ok(appJsContent.includes('ONT_be6500c-bai4') && appJsContent.includes('chế độ dns'),
  'app.js must contain defensive filter to remove Chế độ DNS rule for ONT_be6500c-bai4');

console.log('ALL ONT BE6500C & BE6500C DNS (BAI 4) TESTS PASSED SUCCESSFULLY!');
