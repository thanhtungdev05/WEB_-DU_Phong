'use strict';

const fs = require('fs');
const assert = require('assert');
const path = require('path');
const vm = require('vm');

const root = path.resolve(__dirname, '..');

// 1. Check portal.html cachebuster for ax3000gz bai5 and bai6
const portalPath = path.join(root, 'portal.html');
const portalContent = fs.readFileSync(portalPath, 'utf8');

assert.ok(
  portalContent.includes('devices/ax3000gz/lessons/bai5.js?v='),
  'portal.html must include bumped version of ax3000gz bai5.js'
);
assert.ok(
  portalContent.includes('devices/ax3000gz/lessons/bai6.js?v='),
  'portal.html must include bumped version of ax3000gz bai6.js'
);

// 2. Setup VM environment and load files
const context = {
  window: {},
  document: {},
  console: console
};
context.window = context;
vm.createContext(context);

const bai5Content = fs.readFileSync(path.join(root, 'devices/ax3000gz/lessons/bai5.js'), 'utf8');
vm.runInContext(bai5Content, context);

const bai6Content = fs.readFileSync(path.join(root, 'devices/ax3000gz/lessons/bai6.js'), 'utf8');
vm.runInContext(bai6Content, context);

const lessons = context.window.DEVICE_AX3000GZ_LESSONS;
assert.ok(Array.isArray(lessons), 'DEVICE_AX3000GZ_LESSONS must be an array');

// 3. Test Bài 5
const bai5 = lessons.find(l => l.id === 'LAB_AX3000GZ_05');
assert.ok(bai5, 'Bài 5 must exist');
assert.strictEqual(bai5.instructions.length, 6, 'Bài 5 instructions must have 6 items (title + 5 fields)');
assert.ok(!bai5.instructions.some(i => i.includes('DHCP Server:')), 'Bài 5 must NOT have DHCP Server toggle');
assert.ok(!bai5.instructions.some(i => i.includes('Thực hiện thay đổi')), 'Bài 5 must NOT have long intro sentence');
assert.ok(bai5.instructions.some(i => i.includes('192.168.10.1')), 'Bài 5 must have IP Address');
assert.ok(bai5.instructions.some(i => i.includes('255.255.255.0')), 'Bài 5 must have Subnet Mask');

// 4. Test Bài 6
const bai6 = lessons.find(l => l.id === 'LAB_AX3000GZ_06');
assert.ok(bai6, 'Bài 6 must exist');
assert.strictEqual(bai6.instructions.length, 7, 'Bài 6 instructions must have 7 items (title + 6 fields)');
assert.ok(!bai6.instructions.some(i => i.includes('Enable: On')), 'Bài 6 must NOT have Enable toggle');
assert.ok(!bai6.instructions.some(i => i.includes('Thực hiện cấu hình Mở Port')), 'Bài 6 must NOT have long intro sentence');
assert.ok(bai6.instructions.some(i => i.includes('FPT Telecom')), 'Bài 6 must have Name');
assert.ok(bai6.instructions.some(i => i.includes('TCP/UDP')), 'Bài 6 must have Protocol');

console.log('ALL AX3000GZ BAI 5 & 6 INSTRUCTIONS TESTS PASSED SUCCESSFULLY!');
