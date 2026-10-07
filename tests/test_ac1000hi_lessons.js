'use strict';

const fs = require('fs');
const assert = require('assert');
const path = require('path');
const vm = require('vm');

const root = path.resolve(__dirname, '..');

// 1. Verify portal.html includes and cachebusters
const portalPath = path.join(root, 'portal.html');
const portalContent = fs.readFileSync(portalPath, 'utf8');

for (let i = 1; i <= 6; i++) {
  assert.ok(
    portalContent.includes(`devices/ac1000HI/lessons/bai${i}.js?v=`),
    `portal.html must include bumped version of ac1000HI bai${i}.js`
  );
}

// 2. Setup VM environment and load AC1000HI files
const context = {
  window: {},
  document: {},
  console: console
};
context.window = context;
vm.createContext(context);

const filesToLoad = [
  'devices/ac1000HI/tooltips/common_login.js',
  'devices/ac1000HI/tooltips/bai1.js',
  'devices/ac1000HI/tooltips/bai2.js',
  'devices/ac1000HI/tooltips/bai3.js',
  'devices/ac1000HI/tooltips/bai4.js',
  'devices/ac1000HI/tooltips/bai5.js',
  'devices/ac1000HI/tooltips/bai6.js',
  'devices/ac1000HI/lessons/bai1.js',
  'devices/ac1000HI/lessons/bai2.js',
  'devices/ac1000HI/lessons/bai3.js',
  'devices/ac1000HI/lessons/bai4.js',
  'devices/ac1000HI/lessons/bai5.js',
  'devices/ac1000HI/lessons/bai6.js',
  'devices/ac1000HI/data.js'
];

for (const f of filesToLoad) {
  const content = fs.readFileSync(path.join(root, f), 'utf8');
  vm.runInContext(content, context);
}

const lessons = context.window.DEVICE_AC1000HI_LESSONS;
assert.ok(Array.isArray(lessons), 'DEVICE_AC1000HI_LESSONS must be an array');
assert.ok(lessons.length >= 6, 'Must have at least 6 lessons');

// Bài 1
const b1 = lessons.find(l => l.id === 'LAB_AC1000HI_01');
assert.ok(b1, 'Bài 1 must exist');
assert.strictEqual(b1.instructions.length, 4, 'Bài 1 instructions must have 4 items (title + context + 2 inputs)');
assert.ok(b1.instructions.some(i => i.includes('hnfdl-123456-789')));
assert.ok(b1.instructions.some(i => i.includes('d123456')));

// Bài 2
const b2 = lessons.find(l => l.id === 'LAB_AC1000HI_02');
assert.ok(b2, 'Bài 2 must exist');
assert.strictEqual(b2.instructions.length, 4, 'Bài 2 instructions must have 4 items (title + context + 2 inputs)');
assert.ok(b2.instructions.some(i => i.includes('FPT Telecom-7EA8')));
assert.ok(b2.instructions.some(i => i.includes('00032934')));

// Bài 3
const b3 = lessons.find(l => l.id === 'LAB_AC1000HI_03');
assert.ok(b3, 'Bài 3 must exist');
assert.strictEqual(b3.instructions.length, 5, 'Bài 3 instructions must have 5 items (title + context + 3 inputs)');
assert.ok(b3.instructions.some(i => i.includes('FPT Telecom_IoT')));
assert.ok(b3.instructions.some(i => i.includes('fpt12345')));

// Bài 4
const b4 = lessons.find(l => l.id === 'LAB_AC1000HI_04');
assert.ok(b4, 'Bài 4 must exist');
assert.strictEqual(b4.instructions.length, 4, 'Bài 4 instructions must have 4 items (title + context + 2 inputs)');
assert.ok(b4.instructions.some(i => i.includes('8.8.8.8')));
assert.ok(b4.instructions.some(i => i.includes('8.8.4.4')));

// Bài 5
const b5 = lessons.find(l => l.id === 'LAB_AC1000HI_05');
assert.ok(b5, 'Bài 5 must exist');
assert.strictEqual(b5.instructions.length, 4, 'Bài 5 instructions must have 4 items (title + context + 2 inputs)');
assert.ok(b5.instructions.some(i => i.includes('192.168.10.1')));
assert.ok(b5.instructions.some(i => i.includes('255.255.255.0')));

// Bài 6
const b6 = lessons.find(l => l.id === 'LAB_AC1000HI_06');
assert.ok(b6, 'Bài 6 must exist');
assert.strictEqual(b6.instructions.length, 7, 'Bài 6 instructions must have 7 items (title + context + 5 inputs)');
assert.ok(b6.instructions.some(i => i.includes('192.168.1.254')));
assert.ok(b6.instructions.some(i => i.includes('3389')));

console.log('ALL ONT AC1000HI LESSONS TESTS PASSED SUCCESSFULLY!');
