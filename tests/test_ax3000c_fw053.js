'use strict';

const fs = require('fs');
const assert = require('assert');
const path = require('path');
const vm = require('vm');

const root = path.resolve(__dirname, '..');

// 1. Verify portal.html has all required AX3000CV2 fw 0.5.3 scripts
const portalHtml = fs.readFileSync(path.join(root, 'portal.html'), 'utf8');
assert.ok(portalHtml.includes('devices/ax3000c/ftc_chung.js'), 'portal.html must include ftc_chung.js');
for (let i = 1; i <= 7; i++) {
  assert.ok(portalHtml.includes(`devices/ax3000c/lessons/bai${i}.js`), `portal.html must include bai${i}.js`);
  assert.ok(portalHtml.includes(`devices/ax3000c/tooltips/bai${i}.js`), `portal.html must include tooltips bai${i}.js`);
}

// 2. Evaluate AX3000C scripts in VM context
const context = { window: {}, document: {}, location: { href: 'http://localhost/' } };
context.window = context;
vm.createContext(context);

// Load ftc_chung.js
const ftcChungCode = fs.readFileSync(path.join(root, 'devices/ax3000c/ftc_chung.js'), 'utf8');
vm.runInContext(ftcChungCode, context);
assert.ok(context.window.FTC_AX3000C, 'FTC_AX3000C must be defined');
assert.strictEqual(typeof context.window.FTC_AX3000C.o, 'function');
assert.strictEqual(typeof context.window.FTC_AX3000C.nut, 'function');
assert.strictEqual(typeof context.window.FTC_AX3000C.cot, 'function');
assert.strictEqual(typeof context.window.FTC_AX3000C.xoaO, 'function');
assert.strictEqual(typeof context.window.FTC_AX3000C.datTrangThaiBai, 'function');

// Load tooltips common_login and bai1..bai7
const tooltipsLogin = fs.readFileSync(path.join(root, 'devices/ax3000c/tooltips/common_login.js'), 'utf8');
vm.runInContext(tooltipsLogin, context);
for (let i = 1; i <= 7; i++) {
  const ttCode = fs.readFileSync(path.join(root, `devices/ax3000c/tooltips/bai${i}.js`), 'utf8');
  vm.runInContext(ttCode, context);
}

// Load lessons bai1..bai7
for (let i = 1; i <= 7; i++) {
  const lessonCode = fs.readFileSync(path.join(root, `devices/ax3000c/lessons/bai${i}.js`), 'utf8');
  vm.runInContext(lessonCode, context);
}

// Load data.js
const dataCode = fs.readFileSync(path.join(root, 'devices/ax3000c/data.js'), 'utf8');
vm.runInContext(dataCode, context);

// 3. Verify lessons array
const lessons = context.window.DEVICE_AX3000C_LESSONS;
assert.ok(Array.isArray(lessons), 'DEVICE_AX3000C_LESSONS must be an array');
assert.strictEqual(lessons.length, 7, 'Must have exactly 7 lessons for AX3000CV2');

const expectedIds = [
  'LAB_AX3000CV2_01',
  'LAB_AX3000CV2_02',
  'LAB_AX3000CV2_03',
  'LAB_AX3000CV2_04',
  'LAB_AX3000CV2_05',
  'LAB_AX3000CV2_06',
  'LAB_AX3000CV2_07'
];

expectedIds.forEach((id, idx) => {
  const lesson = lessons.find(l => l.id === id);
  assert.ok(lesson, `Lesson ${id} must exist`);
  assert.ok(lesson.grading && Array.isArray(lesson.grading.rules), `${id} must have grading rules`);
  const tt = context.window.TOOLTIPS_AX3000C[id];
  assert.ok(Array.isArray(tt) && tt.length > 0, `${id} must have tooltips registered`);
});

// Verify specific grading requirements for fw 0.5.3
const bai2 = lessons.find(l => l.id === 'LAB_AX3000CV2_02');
assert.strictEqual(bai2.grading.rules.find(r => r.id === 'band_steering')?.expected, 'false', 'Bai 2 must require Use separate SSID = false');

const bai4 = lessons.find(l => l.id === 'LAB_AX3000CV2_04');
assert.strictEqual(bai4.grading.rules.find(r => r.id === 'dns_custom_enable')?.expected, '1', 'Bai 4 must expect radio 1 for custom DNS');

const bai5 = lessons.find(l => l.id === 'LAB_AX3000CV2_05');
const bai5Instructions = bai5.instructions.join(' ');
assert.ok(bai5Instructions.includes('192.168.100.1'), 'Bai 5 must display the Ver2.1 LAN address');
assert.ok(bai5Instructions.includes('192.168.100.2'), 'Bai 5 must display the Ver2.1 DHCP start address');
assert.ok(bai5Instructions.includes('192.168.100.254'), 'Bai 5 must display the Ver2.1 DHCP end address');
assert.ok(!bai5Instructions.includes('192.168.100.249'), 'Bai 5 must not display the obsolete DHCP end address');
assert.strictEqual(bai5.grading.rules.find(r => r.id === 'lan_ip')?.expected, '192.168.100.1', 'Bai 5 grading must match the displayed LAN address');
assert.strictEqual(bai5.grading.rules.find(r => r.id === 'dhcp_start')?.expected, '192.168.100.2', 'Bai 5 grading must match the displayed DHCP start address');
assert.strictEqual(bai5.grading.rules.find(r => r.id === 'dhcp_end')?.expected, '192.168.100.254', 'Bai 5 grading must match the displayed DHCP end address');
const bai5Guide = context.window.TOOLTIPS_AX3000C['LAB_AX3000CV2_05'];
assert.ok(bai5Guide.some(step => String(step.text || '').includes('192.168.100.254')), 'Bai 5 tooltip must use the Ver2.1 DHCP end address');
assert.ok(!bai5Guide.some(step => String(step.text || '').includes('192.168.100.249')), 'Bai 5 tooltip must not use the obsolete DHCP end address');

const bai6 = lessons.find(l => l.id === 'LAB_AX3000CV2_06');
assert.strictEqual(bai6.grading.rules.find(r => r.id === 'enable')?.expected, 'on', 'Bai 6 must require Enable = on');

const bai7 = lessons.find(l => l.id === 'LAB_AX3000CV2_07');
assert.strictEqual(bai7.grading.rules.find(r => r.id === 'mesh_enabled')?.expected, 'on', 'Bai 7 must require Enabled = on');
assert.strictEqual(bai7.grading.rules.find(r => r.id === 'mesh_role')?.expected, 'Controller', 'Bai 7 must require MeshRole = Controller');

console.log('ALL AX3000CV2 FIRMWARE 0.5.3 CONTRACT TESTS PASSED SUCCESSFULLY!');
