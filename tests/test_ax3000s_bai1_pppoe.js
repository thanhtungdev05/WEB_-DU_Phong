'use strict';

const fs = require('fs');
const assert = require('assert');
const path = require('path');
const vm = require('vm');

const root = path.resolve(__dirname, '..');

// 1. Verify files exist and load contents
const bai1Path = path.join(root, 'devices/ax3000s/lessons/bai1.js');
const tooltipPath = path.join(root, 'devices/ax3000s/tooltips/bai1.js');
const appHtmlPath = path.join(root, 'simulators/sim_ax3000s/www/app.html');
const dataPath = path.join(root, 'devices/ax3000s/data.js');
const portalPath = path.join(root, 'portal.html');

const bai1Content = fs.readFileSync(bai1Path, 'utf8');
const tooltipContent = fs.readFileSync(tooltipPath, 'utf8');
const appHtmlContent = fs.readFileSync(appHtmlPath, 'utf8');
const dataContent = fs.readFileSync(dataPath, 'utf8');
const portalContent = fs.readFileSync(portalPath, 'utf8');

// 2. Verify CSS rule in app.html for .nav-layer1 a
assert.ok(
  appHtmlContent.includes('.nav-layer1 a') &&
  appHtmlContent.includes('display: block;') &&
  appHtmlContent.includes('float: left;'),
  'app.html must define .nav-layer1 a { display: block; float: left; } to prevent inline box collapse'
);

// 3. Verify portal.html cachebuster bump
assert.ok(
  portalContent.includes('devices/ax3000s/tooltips/bai1.js?v='),
  'portal.html must include cachebuster 20260918102500 for ax3000s/tooltips/bai1.js'
);
assert.ok(
  portalContent.includes('devices/ax3000s/lessons/bai1.js?v='),
  'portal.html must include cachebuster 20260927235000 for ax3000s/lessons/bai1.js'
);

// 4. Verify context evaluation
const context = {
  window: {},
  document: {},
  console: console
};
context.window = context;
vm.createContext(context);

// Load tooltips, then lesson, then data
vm.runInContext(tooltipContent, context);
vm.runInContext(bai1Content, context);
vm.runInContext(dataContent, context);

const tooltips = context.window.TOOLTIPS_AX3000S && context.window.TOOLTIPS_AX3000S['LAB_AX3000S_01'];
assert.ok(Array.isArray(tooltips), 'TOOLTIPS_AX3000S.LAB_AX3000S_01 must be an array');
assert.strictEqual(tooltips.length, 7, 'Must have exactly 7 steps after removing non-existent Restart button');

// Step 1: Network selector check
const step1 = tooltips[0];
assert.strictEqual(step1.text, 'Bước 1: Chọn Network');
assert.ok(
  step1.selector.startsWith('#Sky_Network li') || step1.selector.includes('#Sky_Network li'),
  'Step 1 selector must target #Sky_Network li to avoid displaced inline <a> box'
);

// Step 7: Save & Apply check
const step7 = tooltips[6];
assert.strictEqual(step7.text, 'Bước 7: Nhấn Save & Apply');
assert.strictEqual(step7.selector, '#Sky_Apply');

// Verify no step targets #Sky_Cancel or mentions Restart
tooltips.forEach((step, idx) => {
  assert.ok(!step.selector.includes('#Sky_Cancel'), `Step ${idx + 1} must not target #Sky_Cancel`);
  assert.ok(!step.text.toLowerCase().includes('restart'), `Step ${idx + 1} text must not mention Restart`);
});

// 5. Verify lesson definition
const lessons = context.window.DEVICE_AX3000S_LESSONS;
assert.ok(Array.isArray(lessons), 'DEVICE_AX3000S_LESSONS must be an array');
const bai1 = lessons.find(l => l.id === 'LAB_AX3000S_01');
assert.ok(bai1, 'LAB_AX3000S_01 must exist in DEVICE_AX3000S_LESSONS');
assert.strictEqual(bai1.practiceUrl, '/sim_ax3000s/app.html#wancfg');
assert.ok(bai1.guidePopups && bai1.guidePopups.length === 7, 'Lesson guidePopups must sync with TOOLTIPS_AX3000S (7 steps)');

// Check grading rules
const rules = bai1.grading.rules;
assert.strictEqual(rules.length, 2, 'Grading must have 2 rules (ppp_user and ppp_pwd)');
const userRule = rules.find(r => r.id === 'ppp_user');
const pwdRule = rules.find(r => r.id === 'ppp_pwd');
assert.ok(userRule && userRule.expected === 'hnfdl-123456-789');
assert.ok(pwdRule && pwdRule.expected === 'd123456');

// 6. Verify Login Page & Common Login Tooltip
const loginHtmlPath = path.join(root, 'simulators/sim_ax3000s/www/login.html');
const loginTooltipPath = path.join(root, 'devices/ax3000s/tooltips/common_login.js');
const loginHtmlContent = fs.readFileSync(loginHtmlPath, 'utf8');
const loginTooltipContent = fs.readFileSync(loginTooltipPath, 'utf8');

assert.ok(
  loginHtmlContent.includes('id="user" value=""'),
  'login.html must NOT prefill username: id="user" value=""'
);
assert.ok(
  portalContent.includes('devices/ax3000s/tooltips/common_login.js?v='),
  'portal.html must include cachebuster 20260918103800 for common_login.js'
);

// Run login tooltip script
vm.runInContext(loginTooltipContent, context);
const loginTooltips = context.window.TOOLTIPS_AX3000S && context.window.TOOLTIPS_AX3000S._common_login;
assert.ok(Array.isArray(loginTooltips), 'TOOLTIPS_AX3000S._common_login must be an array');
assert.strictEqual(loginTooltips.length, 2, 'Login must have tooltips for both username and password');
assert.ok(loginTooltips[0].selector.includes('input#user'), 'First login tooltip must target username input');
assert.strictEqual(loginTooltips[0].text, 'Nhập tên đăng nhập: admin');
assert.ok(loginTooltips[1].selector.includes('input#pass'), 'Second login tooltip must target password input');
assert.strictEqual(loginTooltips[1].text, 'Nhập mật khẩu: admin');

console.log('ALL AX3000S BAI 1 PPPOE & LOGIN TESTS PASSED SUCCESSFULLY!');
