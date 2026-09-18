'use strict';

const fs = require('fs');
const assert = require('assert');
const path = require('path');
const vm = require('vm');

const root = path.resolve(__dirname, '..');
const appJsPath = path.join(root, 'app.js');
const appJsCode = fs.readFileSync(appJsPath, 'utf8');

console.log('--- TEST BE12000 SPECIALPASSWORD MASKING HANDLING ---');

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

  function updateButtons(evalResult, mode, hasClickedSave) {
    let submitBtn = { disabled: false, opacity: '1', animation: 'submitBtnPulse 2.5s infinite' };
    let errorBtn = { display: 'none' };

    if (mode === 'practice') {
      submitBtn.disabled = false;
      submitBtn.opacity = '1';
      errorBtn.display = 'none';
    } else {
      if (hasClickedSave && evalResult && evalResult.passed) {
        submitBtn.disabled = false;
        submitBtn.opacity = '1';
        submitBtn.animation = 'submitBtnPulse 2.5s infinite';
        errorBtn.display = 'none';
      } else {
        submitBtn.disabled = true;
        submitBtn.opacity = '0.5';
        submitBtn.animation = 'none';
        if (hasClickedSave && evalResult && !evalResult.passed) {
          errorBtn.display = 'flex';
        } else {
          errorBtn.display = 'none';
        }
      }
    }
    return { submitBtn, errorBtn };
  }
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

// Helper mock doc
function createMockDoc(pwdElProps, isSaved) {
  const cnameEl = { id: 'WANCName', value: 'FPT' };
  const userEl = { id: 'UserName', value: 'hnfdl-123456-789' };
  const pwdEl = Object.assign({
    id: 'Password',
    type: 'password',
    classList: { contains: (cls) => cls === 'SpecialPassword' }
  }, pwdElProps);

  return {
    _ftcIsSaved: isSaved,
    _ftcHasSuccHint: true,
    querySelectorAll: function (selector) {
      if (selector.includes('WANCName')) return [cnameEl];
      if (selector.includes('UserName')) return [userEl];
      if (selector.includes('Password')) return [pwdEl];
      return [];
    },
    querySelector: function (selector) {
      const list = this.querySelectorAll(selector);
      return list.length > 0 ? list[0] : null;
    }
  };
}

// TEST CASE 1: Password bị ZTE mask thành 6 dấu TAB sau khi bấm Apply, nhưng đã lưu real password 'd123456'
console.log('Test 1: Password masked as 6 tabs but _ftcRealValue = "d123456"...');
sandbox.mockDocs = [createMockDoc({
  value: '\t\t\t\t\t\t', // Giá trị bị ZTE router mask
  _ftcRealValue: 'd123456'  // Giá trị thực tế được capture
}, true)];

const eval1 = sandbox.evaluateLesson({ id: 'be12000' }, bai1);
assert.strictEqual(eval1.passed, true, 'Test 1 must PASS when real password is d123456');
const pwdDetail1 = eval1.details.find(d => d.id === 'pppoe_pwd');
assert.strictEqual(pwdDetail1.passed, true, 'pppoe_pwd rule must be passed');
assert.strictEqual(pwdDetail1.actual, 'd123456', 'Actual value displayed must be d123456');

const btns1 = sandbox.updateButtons(eval1, 'guide', true);
assert.strictEqual(btns1.submitBtn.disabled, false, 'Submit button must be ENABLED');
assert.strictEqual(btns1.submitBtn.opacity, '1', 'Submit button opacity must be 1');
assert.strictEqual(btns1.errorBtn.display, 'none', 'Error button must be HIDDEN');
console.log('✓ Test 1 passed: Nút nộp bài sáng rực, nút xem lỗi ẩn khi mật khẩu đúng dù đã bị mask!');

// TEST CASE 2: Password bị mask nhưng người dùng cố tình nhập sai 'wrong123'
console.log('\nTest 2: Password masked as 6 tabs but _ftcRealValue = "wrong123"...');
sandbox.mockDocs = [createMockDoc({
  value: '\t\t\t\t\t\t',
  _ftcRealValue: 'wrong123'
}, true)];

const eval2 = sandbox.evaluateLesson({ id: 'be12000' }, bai1);
assert.strictEqual(eval2.passed, false, 'Test 2 must FAIL when real password is wrong');
const pwdDetail2 = eval2.details.find(d => d.id === 'pppoe_pwd');
assert.strictEqual(pwdDetail2.passed, false, 'pppoe_pwd rule must be failed');
assert.strictEqual(pwdDetail2.actual, 'wrong123', 'Actual value displayed must show the entered wrong password');

const btns2 = sandbox.updateButtons(eval2, 'guide', true);
assert.strictEqual(btns2.submitBtn.disabled, true, 'Submit button must be DISABLED');
assert.strictEqual(btns2.errorBtn.display, 'flex', 'Error button must be VISIBLE RED');
console.log('✓ Test 2 passed: Chấm SAI chính xác khi người dùng cố tình gõ sai, nút lỗi sáng đỏ!');

// TEST CASE 3: Password rỗng (chưa nhập)
console.log('\nTest 3: Password completely empty...');
sandbox.mockDocs = [createMockDoc({
  value: '',
  _ftcRealValue: undefined
}, true)];

const eval3 = sandbox.evaluateLesson({ id: 'be12000' }, bai1);
assert.strictEqual(eval3.passed, false, 'Test 3 must FAIL when empty');
console.log('✓ Test 3 passed: Chấm SAI khi để trống mật khẩu');

console.log('\n======================================================');
console.log('ALL BE12000 SPECIALPASSWORD MASKING TESTS PASSED 100%!');
console.log('======================================================');
