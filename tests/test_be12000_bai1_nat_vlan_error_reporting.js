'use strict';

const fs = require('fs');
const assert = require('assert');
const path = require('path');
const vm = require('vm');

const root = path.resolve(__dirname, '..');
const appJsPath = path.join(root, 'app.js');
const appJsCode = fs.readFileSync(appJsPath, 'utf8');

console.log('--- TEST BE12000 BAI 1 NAT & VLAN ERROR REPORTING WITH HIDDEN TEMPLATE ---');

// 1. Trích xuất hàm evaluateLesson & isSaveRequiredDevice từ app.js
const isSaveRequiredMatch = appJsCode.match(/function isSaveRequiredDevice\([\s\S]*?\n  \}/);
assert.ok(isSaveRequiredMatch, 'Must find isSaveRequiredDevice in app.js');

const evalFnMatch = appJsCode.match(/function evaluateLesson\(device, lesson\) \{[\s\S]*?\n  function submitLab/);
assert.ok(evalFnMatch, 'Must find evaluateLesson in app.js');
const evaluateLessonCode = evalFnMatch[0].replace(/\n  function submitLab$/, '');

// 2. Setup VM Sandbox
const sandbox = {
  console: console,
  window: {},
  document: { getElementById: () => null },
  currentDeviceId: 'be12000',
  currentLessonId: 'LAB_BE12000_01',
  currentMode: 'guide',
  _trackingSession: null,
  _trackedOriginalValues: {},
  triggerSaveFlashEffect: () => {},
  DEVICES: [{ id: 'be12000', name: 'ONT BE12000' }],
  mockDocs: []
};
sandbox.window = sandbox;

const engineScript = `
  var currentDeviceId = 'be12000';
  var currentLessonId = 'LAB_BE12000_01';
  var currentMode = 'guide';
  var _trackingSession = null;
  var _trackedOriginalValues = {};
  var _hasClickedSaveInGuide = true;
  var _hasSuccHintStored = true;
  var deviceIframe = { contentWindow: {} };

  ${isSaveRequiredMatch[0]}
  function isNoConfigDevice() { return false; }
  function getAllAccessibleDocuments() { return window.mockDocs || []; }
  ${evaluateLessonCode}
`;

vm.createContext(sandbox);
vm.runInContext(engineScript, sandbox);

// 3. Load BE12000 Bài 1 lesson
const lesson1Code = fs.readFileSync(path.join(root, 'devices/be12000/lessons/bai1.js'), 'utf8');
const l1Ctx = { window: {} };
vm.createContext(l1Ctx);
vm.runInContext(lesson1Code, l1Ctx);
const bai1 = l1Ctx.window.DEVICE_BE12000_LESSONS.find(l => l.id === 'LAB_BE12000_01');
assert.ok(bai1, 'Must find LAB_BE12000_01');

// Mô phỏng đúng DOM thật của ethWanConfig (ZTE BE12000):
//  - #template_Internet      : template gốc ẩn (NAT=On, VLAN=Off mặc định)
//  - #template_Internet_0    : kết nối có sẵn của nhà máy "internet_tr069" (NAT=On, VLAN=Off), đang thu gọn
//  - #template_Internet_1    : bản học viên vừa "Create New Item", đang mở rộng (ChangeArea hiển thị)
function makeContainer(id, display, expanded) {
  return {
    id,
    style: { display },
    querySelector: (sel) => (sel === '.ChangeArea' ? { style: { display: expanded ? 'block' : 'none' } } : null)
  };
}
function makeInstanceEls(container, sfx, cfg) {
  const s = sfx === null ? '' : ':' + sfx;
  const mk = (o) => Object.assign({ closest: (sel) => (sel.includes('template_') ? container : null) }, o);
  return {
    cname: mk({ id: 'WANCName' + s, name: 'WANCName' + s, type: 'text', value: cfg.cname }),
    user: mk({ id: 'UserName' + s, name: 'UserName' + s, type: 'text', value: cfg.username }),
    pwd: mk({ id: 'Password' + s, name: 'Password' + s, type: 'password', value: cfg.password }),
    nat1: mk({ id: 'IsNAT1' + s, name: 'IsNAT' + s, type: 'radio', value: '1', checked: cfg.nat === '1' }),
    nat0: mk({ id: 'IsNAT0' + s, name: 'IsNAT' + s, type: 'radio', value: '0', checked: cfg.nat === '0' }),
    vlan1: mk({ id: 'VlanEnable1' + s, name: 'VlanEnable' + s, type: 'radio', value: '1', checked: cfg.vlan === '1' }),
    vlan0: mk({ id: 'VlanEnable0' + s, name: 'VlanEnable' + s, type: 'radio', value: '0', checked: cfg.vlan === '0' })
  };
}
function createZteWanMockDoc(userConfig, opts) {
  opts = opts || {};
  const hidden = makeInstanceEls(makeContainer('template_Internet', 'none', false), null,
    { cname: '', username: '', password: '', nat: '1', vlan: '0' });
  const factory = makeInstanceEls(makeContainer('template_Internet_0', 'block', Boolean(opts.factoryExpanded)), 0,
    { cname: 'internet_tr069', username: 'ZmFrZVVzZXJOYW1lMDEyMw==', password: '', nat: '1', vlan: '0' });
  const student = makeInstanceEls(makeContainer('template_Internet_1', 'block', opts.studentExpanded !== false), 1, userConfig);
  // Thứ tự DOM thật: các clone được chèn TRƯỚC template gốc
  const all = [factory, student, hidden];
  const pick = (k) => all.map(g => g[k]);

  return {
    _ftcIsSaved: true,
    _ftcHasSuccHint: true,
    querySelectorAll: function (selector) {
      if (selector.includes('WANCName')) return pick('cname');
      if (selector.includes('UserName')) return pick('user');
      if (selector.includes('Password')) return pick('pwd');
      if (selector.includes('IsNAT')) return all.flatMap(g => [g.nat1, g.nat0]);
      if (selector.includes('VlanEnable')) return all.flatMap(g => [g.vlan1, g.vlan0]);
      return [];
    },
    querySelector: function (selector) {
      const list = this.querySelectorAll(selector);
      return list.length > 0 ? list[0] : null;
    }
  };
}

// TEST 1: User deliberately configures Username wrong, Password wrong, NAT=Off, VLAN=On
console.log('Test 1: Deliberate errors: Username=dfff, Password=******, NAT=0 (Off), VLAN=1 (On)...');
sandbox.mockDocs = [createZteWanMockDoc({
  cname: 'FPT',
  username: 'dfff',
  password: '******',
  nat: '0', // User chose Off (wrong)
  vlan: '1'  // User chose On (wrong)
})];

const evalResult1 = sandbox.evaluateLesson({ id: 'be12000' }, bai1);

console.log('Passed:', evalResult1.passed, 'Passed Count:', evalResult1.passedCount, 'Total:', evalResult1.totalRules);
evalResult1.details.forEach(d => {
  console.log(` - [${d.passed ? 'PASS' : 'FAIL'}] ${d.name} | Expected: ${d.expected} | Actual: ${d.actual}`);
});

assert.strictEqual(evalResult1.passed, false, 'Eval 1 must NOT pass');
assert.strictEqual(evalResult1.passedCount, 1, 'Only Connection Name should pass (1/5)');

const natDetail = evalResult1.details.find(d => d.id === 'pppoe_nat');
assert.ok(natDetail, 'Must have NAT detail');
assert.strictEqual(natDetail.passed, false, 'NAT must FAIL when user selected Off');
assert.strictEqual(natDetail.expected, 'On', 'NAT expected display must be On');
assert.strictEqual(natDetail.actual, 'Off', 'NAT actual display must be Off');

const vlanDetail = evalResult1.details.find(d => d.id === 'pppoe_vlan');
assert.ok(vlanDetail, 'Must have VLAN detail');
assert.strictEqual(vlanDetail.passed, false, 'VLAN must FAIL when user selected On');
assert.strictEqual(vlanDetail.expected, 'Off', 'VLAN expected display must be Off');
assert.strictEqual(vlanDetail.actual, 'On', 'VLAN actual display must be On');

const userDetail = evalResult1.details.find(d => d.id === 'pppoe_user');
assert.strictEqual(userDetail.passed, false, 'Username must FAIL');
assert.strictEqual(userDetail.actual, 'dfff');

const pwdDetail = evalResult1.details.find(d => d.id === 'pppoe_pwd');
assert.strictEqual(pwdDetail.passed, false, 'Password must FAIL');

// Exactly 4 fails
const fails = evalResult1.details.filter(d => !d.passed);
assert.strictEqual(fails.length, 4, 'Must have exactly 4 failed criteria');

console.log('===> Test 1 PASSED: Exactly 4 errors reported with On/Off labels!');

// TEST 2: Correct configuration (NAT=On, VLAN=Off, Username=hnfdl-123456-789, Password=d123456)
console.log('Test 2: Correct configuration...');
sandbox.mockDocs = [createZteWanMockDoc({
  cname: 'FPT',
  username: 'hnfdl-123456-789',
  password: 'd123456',
  nat: '1', // Correct
  vlan: '0'  // Correct
})];

const evalResult2 = sandbox.evaluateLesson({ id: 'be12000' }, bai1);
console.log('Passed:', evalResult2.passed, 'Passed Count:', evalResult2.passedCount, 'Total:', evalResult2.totalRules);
assert.strictEqual(evalResult2.passed, true, 'Eval 2 must PASS');
assert.strictEqual(evalResult2.passedCount, 5, 'All 5 must pass');
console.log('===> Test 2 PASSED: 5/5 criteria passed!');

// TEST 3: Đúng kịch bản người dùng báo lỗi: Username sai, NAT=On (đúng), VLAN=On (SAI).
// Kết nối có sẵn internet_tr069 có VLAN=Off KHÔNG được làm VLAN của học viên "Đúng" nhầm.
console.log('Test 3: Only VLAN wrong (On), factory internet_tr069 has VLAN=Off...');
sandbox.window._sessionRuleCache = {};
sandbox.mockDocs = [createZteWanMockDoc({
  cname: 'FPT', username: 'hnf', password: 'd123456', nat: '1', vlan: '1'
})];
const evalResult3 = sandbox.evaluateLesson({ id: 'be12000' }, bai1);
evalResult3.details.forEach(d => console.log(` - [${d.passed ? 'PASS' : 'FAIL'}] ${d.name} | Expected: ${d.expected} | Actual: ${d.actual}`));
const vlan3 = evalResult3.details.find(d => d.id === 'pppoe_vlan');
assert.strictEqual(vlan3.passed, false, 'VLAN must FAIL when student chose On');
assert.strictEqual(vlan3.actual, 'On');
assert.strictEqual(evalResult3.details.find(d => d.id === 'pppoe_nat').passed, true, 'NAT On must pass');
assert.strictEqual(evalResult3.details.filter(d => !d.passed).length, 2, 'Username + VLAN = 2 errors');
console.log('===> Test 3 PASSED: VLAN On is flagged as wrong!');

// TEST 4: Sau khi Apply, các bản đều thu gọn => chấm bản mới nhất (hậu tố lớn nhất), không phải internet_tr069.
console.log('Test 4: All instances collapsed after Apply, student NAT=Off...');
sandbox.window._sessionRuleCache = {};
sandbox.mockDocs = [createZteWanMockDoc({
  cname: 'FPT', username: 'hnfdl-123456-789', password: 'd123456', nat: '0', vlan: '0'
}, { studentExpanded: false })];
const evalResult4 = sandbox.evaluateLesson({ id: 'be12000' }, bai1);
const nat4 = evalResult4.details.find(d => d.id === 'pppoe_nat');
assert.strictEqual(nat4.passed, false, 'NAT Off must FAIL even when collapsed');
assert.strictEqual(nat4.actual, 'Off');
assert.strictEqual(evalResult4.passed, false);
console.log('===> Test 4 PASSED: newest instance graded after Apply.');

// TEST 5: Học viên mở xem internet_tr069 cùng lúc với bản mới => vẫn chấm bản mới.
console.log('Test 5: Both factory and student instances expanded...');
sandbox.window._sessionRuleCache = {};
sandbox.mockDocs = [createZteWanMockDoc({
  cname: 'FPT', username: 'hnfdl-123456-789', password: 'd123456', nat: '1', vlan: '1'
}, { factoryExpanded: true })];
const evalResult5 = sandbox.evaluateLesson({ id: 'be12000' }, bai1);
assert.strictEqual(evalResult5.details.find(d => d.id === 'pppoe_vlan').passed, false, 'VLAN On must FAIL');
console.log('===> Test 5 PASSED.');
