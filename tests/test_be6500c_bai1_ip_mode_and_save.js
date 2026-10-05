'use strict';

const fs = require('fs');
const assert = require('assert');
const path = require('path');
const vm = require('vm');

const root = path.resolve(__dirname, '..');
const appJsPath = path.join(root, 'app.js');
const appJsCode = fs.readFileSync(appJsPath, 'utf8');

console.log('================================================================');
console.log('KIỂM THỬ ĐẶC TẢ BÀI 1 AP BE6500C: BASICS IP MODE & SAVE BUTTON');
console.log('================================================================\n');

// 1. Trích xuất hàm evaluateLesson & isSaveRequiredDevice từ app.js
const isSaveRequiredMatch = appJsCode.match(/function isSaveRequiredDevice\([\s\S]*?\n  \}/);
assert.ok(isSaveRequiredMatch, 'Phải tìm thấy isSaveRequiredDevice');

const evalFnMatch = appJsCode.match(/function evaluateLesson\(device, lesson\) \{[\s\S]*?\n  function submitLab/);
assert.ok(evalFnMatch, 'Phải tìm thấy evaluateLesson');
const evaluateLessonCode = evalFnMatch[0].replace(/\n  function submitLab$/, '');

const sandbox = {
  console: console,
  window: {},
  document: { getElementById: () => null },
  currentDeviceId: 'be6500c',
  currentLessonId: 'be6500c-bai1',
  currentMode: 'guide',
  _trackingSession: null,
  _trackedOriginalValues: {},
  DEVICES: [{ id: 'be6500c', name: 'AP BE6500C' }],
  mockDocs: []
};
sandbox.window = sandbox;

const engineScript = `
  var currentDeviceId = 'be6500c';
  var currentLessonId = 'be6500c-bai1';
  var currentMode = 'guide';
  var _trackingSession = null;
  var _trackedOriginalValues = {};
  var _hasClickedSaveInGuide = false;
  var _hasSuccHintStored = false;
  var deviceIframe = { contentWindow: {} };

  ${isSaveRequiredMatch[0]}
  function isNoConfigDevice() { return false; }
  function getAllAccessibleDocuments() { return window.mockDocs || []; }
  ${evaluateLessonCode}
`;

vm.createContext(sandbox);
vm.runInContext(engineScript, sandbox);

// 2. Load bài 1 AP BE6500C
const bai1Code = fs.readFileSync(path.join(root, 'devices/be6500c/lessons/bai1.js'), 'utf8');
const lessonCtx = { window: {} };
vm.runInNewContext(bai1Code, lessonCtx);
const bai1 = lessonCtx.window.DEVICE_BE6500C_LESSONS.find(l => l.id === 'be6500c-bai1');
assert.ok(bai1, 'Phải nạp được be6500c-bai1');

// Helper mock doc
function createMockDoc(radioValue, isSaved) {
  const elements = {
    'input[name="radio"][value="10"]:checked, input[name="radio"][value="4"]:checked, input[name="radio"][value="6"]:checked': [
      { type: 'radio', name: 'radio', checked: true, value: radioValue }
    ],
    'input[name="ipv4Settings.protocol"]': [{ value: 'pppoe' }],
    'input[name="ipv4Settings.pppoe.username"]': [{ value: 'hnfdl-123456-789' }],
    'input[name="ipv4Settings.pppoe.password"]': [{ value: 'd123456' }]
  };

  return {
    _ftcIsSaved: isSaved,
    querySelectorAll: function (selector) {
      const qParts = selector.split(',').map(s => s.trim());
      for (const k in elements) {
        const kParts = k.split(',').map(s => s.trim());
        const match = qParts.some(qp => kParts.includes(qp) || qp === k);
        if (match) return elements[k];
      }
      return [];
    },
    querySelector: function (selector) {
      const res = this.querySelectorAll(selector);
      return res.length > 0 ? res[0] : null;
    }
  };
}

// TEST 1: Chọn '10' (IPv4 & IPv6 - mặc định) + Đã Save -> Passed = true
sandbox._hasClickedSaveInGuide = true;
sandbox.mockDocs = [createMockDoc('10', true)];
const resIPv4IPv6 = sandbox.evaluateLesson({ id: 'be6500c' }, bai1);
assert.strictEqual(resIPv4IPv6.passed, true, 'Chọn IPv4 & IPv6 phải ĐẠT');
const ipRuleResult1 = resIPv4IPv6.details.find(d => d.id === 'ip_version_mode');
assert.strictEqual(ipRuleResult1.passed, true);
assert.strictEqual(ipRuleResult1.actual, 'IPv4 & IPv6');
console.log('✔ Test 1 passed: Chọn IPv4 & IPv6 (mặc định) chấm ĐÚNG (100%).');

// TEST 2: Chọn '4' (IPv4) + Đã Save -> Passed = false (BÁO SAI vì chỉ chấp nhận IPv4 & IPv6)
sandbox._hasClickedSaveInGuide = true;
sandbox.mockDocs = [createMockDoc('4', true)];
const resIPv4 = sandbox.evaluateLesson({ id: 'be6500c' }, bai1);
assert.strictEqual(resIPv4.passed, false, 'Chọn IPv4 phải BÁO SAI');
const ipRuleResult2 = resIPv4.details.find(d => d.id === 'ip_version_mode');
assert.strictEqual(ipRuleResult2.passed, false);
assert.strictEqual(ipRuleResult2.actual, 'IPv4');
assert.ok(ipRuleResult2.message.includes('IPv4 & IPv6'));
console.log('✔ Test 2 passed: Chọn IPv4 chấm SAI chính xác (Mong muốn IPv4 & IPv6, Thực tế IPv4).');

// TEST 3: Chọn '6' (IPv6) + Đã Save -> Passed = false (BÁO SAI vì chỉ chấp nhận IPv4 & IPv6)
sandbox._hasClickedSaveInGuide = true;
sandbox.mockDocs = [createMockDoc('6', true)];
const resIPv6 = sandbox.evaluateLesson({ id: 'be6500c' }, bai1);
assert.strictEqual(resIPv6.passed, false, 'Chọn IPv6 phải BÁO SAI');
const ipRuleResult3 = resIPv6.details.find(d => d.id === 'ip_version_mode');
assert.strictEqual(ipRuleResult3.passed, false);
assert.strictEqual(ipRuleResult3.actual, 'IPv6');
assert.ok(ipRuleResult3.message.includes('IPv4 & IPv6'));
console.log('✔ Test 3 passed: Chọn IPv6 chấm SAI chính xác (Mong muốn IPv4 & IPv6, Thực tế IPv6).');

// TEST 4: Chọn giá trị khác (ví dụ 'unknown') -> Passed = false
sandbox._hasClickedSaveInGuide = true;
sandbox.mockDocs = [createMockDoc('unknown', true)];
const resInvalid = sandbox.evaluateLesson({ id: 'be6500c' }, bai1);
assert.strictEqual(resInvalid.passed, false, 'Chọn giá trị không hợp lệ phải báo SAI');
const ipRuleResult4 = resInvalid.details.find(d => d.id === 'ip_version_mode');
assert.strictEqual(ipRuleResult4.passed, false);
console.log('✔ Test 4 passed: Giá trị radio không hợp lệ chấm SAI chính xác.');

// TEST 5: Đúng hết các trường nhưng CHƯA BẤM SAVE -> Passed = false (yêu cầu Save)
sandbox._hasClickedSaveInGuide = false;
sandbox.mockDocs = [createMockDoc('10', false)];
const resUnsaved = sandbox.evaluateLesson({ id: 'be6500c' }, bai1);
assert.strictEqual(resUnsaved.passed, false, 'Chưa bấm Save trên AP BE6500C phải báo SAI');
assert.ok(resUnsaved.details.some(d => d.message.includes('Chưa bấm Save')), 'Phải có thông báo Chưa bấm Save');
console.log('✔ Test 5 passed: Chưa bấm Save bị chặn nộp bài và nhắc bấm Save chính xác.');

// TEST 6: Kiểm tra nút Save tĩnh và hookSave trong HTML simulator
const wanHtmlSimONT = fs.readFileSync(path.join(root, 'simulators/sim_ONT_be6500c/src/www/advanced__wan.html'), 'utf8');
assert.ok(wanHtmlSimONT.includes('data-sim-save="1"'), 'sim_ONT_be6500c advanced__wan.html phải có data-sim-save="1"');
assert.ok(wanHtmlSimONT.includes('alternative-layout--submit'), 'sim_ONT_be6500c advanced__wan.html phải có class alternative-layout--submit');
assert.ok(wanHtmlSimONT.includes('hookSave'), 'sim_ONT_be6500c advanced__wan.html phải có hàm hookSave()');
console.log('✔ Test 6 passed: Simulator sim_ONT_be6500c advanced__wan.html có đầy đủ nút Save tĩnh và hookSave.');

// TEST 7: Kiểm tra allowedSelectors trong bai1.js chứa radio
assert.ok(bai1.allowedSelectors.includes('input[name="radio"]'), 'allowedSelectors phải chứa input[name="radio"]');
assert.ok(bai1.grading.allowedSelectors.includes('input[name="radio"]'), 'grading.allowedSelectors phải chứa input[name="radio"]');
console.log('✔ Test 7 passed: allowedSelectors được cấp phép đầy đủ, không gây lỗi thao tác thừa.');

console.log('\n================================================================');
console.log('TẤT CẢ 7 BÀI KIỂM THỬ ĐẶC TẢ BÀI 1 AP BE6500C ĐỀU ĐẠT 100%!');
console.log('================================================================');
