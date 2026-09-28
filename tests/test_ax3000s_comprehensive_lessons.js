'use strict';

const fs = require('fs');
const assert = require('assert');
const path = require('path');
const vm = require('vm');

const root = path.resolve(__dirname, '..');

// 1. Verify portal includes and cachebusters
const portalPath = path.join(root, 'portal.html');
const portalContent = fs.readFileSync(portalPath, 'utf8');

assert.ok(portalContent.includes('devices/ax3000s/tooltips/bai1.js'), 'portal.html must include ax3000s bai1 tooltips');
assert.ok(portalContent.includes('devices/ax3000s/tooltips/bai2.js?v='), 'portal.html must include ax3000s bai2 tooltips with bumped version');
assert.ok(portalContent.includes('devices/ax3000s/lessons/bai2.js?v='), 'portal.html must include ax3000s bai2 lessons with bumped version');
assert.ok(portalContent.includes('devices/ax3000s/tooltips/bai3.js?v='), 'portal.html must include ax3000s bai3 tooltips with bumped version');
assert.ok(portalContent.includes('devices/ax3000s/lessons/bai3.js?v='), 'portal.html must include ax3000s bai3 lessons with bumped version');
assert.ok(portalContent.includes('devices/ax3000s/tooltips/bai4.js?v='), 'portal.html must include ax3000s bai4 tooltips with bumped version');
assert.ok(portalContent.includes('devices/ax3000s/tooltips/bai5.js?v='), 'portal.html must include ax3000s bai5 tooltips with bumped version');
assert.ok(portalContent.includes('devices/ax3000s/tooltips/bai6.js?v='), 'portal.html must include ax3000s bai6 tooltips with bumped version');

// 2. Setup VM environment and load all AX3000S files
const context = {
  window: {},
  document: {},
  console: console
};
context.window = context;
vm.createContext(context);

const filesToLoad = [
  'devices/ax3000s/tooltips/common_login.js',
  'devices/ax3000s/tooltips/bai1.js',
  'devices/ax3000s/tooltips/bai2.js',
  'devices/ax3000s/tooltips/bai3.js',
  'devices/ax3000s/tooltips/bai4.js',
  'devices/ax3000s/tooltips/bai5.js',
  'devices/ax3000s/tooltips/bai6.js',
  'devices/ax3000s/lessons/bai1.js',
  'devices/ax3000s/lessons/bai2.js',
  'devices/ax3000s/lessons/bai3.js',
  'devices/ax3000s/lessons/bai4.js',
  'devices/ax3000s/lessons/bai5.js',
  'devices/ax3000s/lessons/bai6.js',
  'devices/ax3000s/data.js'
];

for (const f of filesToLoad) {
  const content = fs.readFileSync(path.join(root, f), 'utf8');
  vm.runInContext(content, context);
}

// 3. Test Bài 1 (PPPoE)
const tip1 = context.window.TOOLTIPS_AX3000S['LAB_AX3000S_01'];
assert.strictEqual(tip1.length, 7, 'Bài 1 must have 7 steps');

// 4. Test Bài 2 (Wi-Fi)
const bai2 = context.window.DEVICE_AX3000S_LESSONS.find(l => l.id === 'LAB_AX3000S_02');
assert.ok(bai2.instructions.some(i => i.includes('20Mhz')), 'Bài 2 instructions must include 20Mhz');
const tip2 = context.window.TOOLTIPS_AX3000S['LAB_AX3000S_02'];
assert.strictEqual(tip2.length, 5, 'Bài 2 must have 5 steps');
assert.ok(tip2.some(t => t.selector === '#Sel_BandWidth' && t.expected === '20Mhz'), 'Bài 2 tooltips must include #Sel_BandWidth 20Mhz');
assert.strictEqual(bai2.grading.rules.length, 3, 'Bài 2 grading must have 3 rules');
assert.ok(bai2.grading.rules.some(r => r.id === 'wifi_bw' && r.expected === '20Mhz'), 'Bài 2 grading must check wifi_bw');

// 5. Test Bài 3 (Wi-Fi IoT)
const bai3 = context.window.DEVICE_AX3000S_LESSONS.find(l => l.id === 'LAB_AX3000S_03');
assert.ok(bai3.clearFields.includes('#Txt_SSID_2G_3'), 'Bài 3 clearFields must include #Txt_SSID_2G_3');
assert.strictEqual(bai3.grading.rules.length, 5, 'Bài 3 grading must have 5 rules');
assert.ok(bai3.grading.rules.some(r => r.id === 'iot_disable_5g'), 'Bài 3 grading must verify 5G is not enabled');
const tip3 = context.window.TOOLTIPS_AX3000S['LAB_AX3000S_03'];
assert.strictEqual(tip3.length, 9, 'Bài 3 must have 9 tooltip definitions (8 main + 1 conditional helper)');
assert.ok(tip3.some(t => t.selector.includes(':not(.active)')), 'Bài 3 Step 4 must use :not(.active)');
const tip3Bs = tip3.find(t => t.selector.includes('Chk_BandSteeringEnable_3'));
assert.ok(typeof tip3Bs.condition === 'function', 'Bài 3 Band Steering step must have condition function');

// 6. Test Bài 4 (DNS)
const tip4 = context.window.TOOLTIPS_AX3000S['LAB_AX3000S_04'];
const tip4Step3 = tip4.find(t => t.selector.includes('#Sky_IPv4_Configuration'));
assert.ok(typeof tip4Step3.condition === 'function', 'Bài 4 Step 3 must have condition function');

// 7. Test Bài 5 (DHCP)
const bai5 = context.window.DEVICE_AX3000S_LESSONS.find(l => l.id === 'LAB_AX3000S_05');
assert.ok(bai5.instructions.some(i => i.includes('192.168.2.1')), 'Bài 5 instructions must use 192.168.2.1');
const tip5 = context.window.TOOLTIPS_AX3000S['LAB_AX3000S_05'];
const tip5Step3 = tip5.find(t => t.selector.includes('#Sky_IPv4_Configuration'));
assert.ok(typeof tip5Step3.condition === 'function', 'Bài 5 Step 3 must have condition function');

// 8. Test Bài 6 (Port Forwarding)
const tip6 = context.window.TOOLTIPS_AX3000S['LAB_AX3000S_06'];
const tip6Enable = tip6.find(t => t.text.includes('Enable'));
assert.ok(typeof tip6Enable.condition === 'function', 'Bài 6 Enable step must have condition function');

console.log('ALL AX3000S COMPREHENSIVE TESTS PASSED SUCCESSFULLY!');
