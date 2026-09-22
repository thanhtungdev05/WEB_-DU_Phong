'use strict';

const fs = require('fs');
const assert = require('assert');
const path = require('path');
const vm = require('vm');

const root = path.resolve(__dirname, '..');
const appJsPath = path.join(root, 'app.js');
const appJsCode = fs.readFileSync(appJsPath, 'utf8');

console.log('--- Testing Stage 1: Core app.js Fixes ---');

// 1. Static assertions on app.js code
assert.ok(appJsCode.includes('function isSaveRequiredDevice'), 'app.js must define isSaveRequiredDevice');
assert.ok(!appJsCode.includes('if (hasStoredNotification) {\n        isMatch = true;'), 'app.js must NOT force isMatch = true on hasStoredNotification');
assert.ok(!appJsCode.includes('passed = hasStoredNotification ||'), 'app.js must NOT force passed = true on hasStoredNotification');
assert.ok(appJsCode.includes('isSaveRequiredDevice(effectiveDeviceId)'), 'evaluateLesson must use isSaveRequiredDevice');

// 2. Test isSaveRequiredDevice logic
const isSaveRequiredMatch = appJsCode.match(/function isSaveRequiredDevice\([\s\S]*?\n  \}/);
assert.ok(isSaveRequiredMatch, 'Must find isSaveRequiredDevice function body');

const evalHelperContext = {};
vm.createContext(evalHelperContext);
vm.runInContext(isSaveRequiredMatch[0], evalHelperContext);
const isSaveRequiredDevice = evalHelperContext.isSaveRequiredDevice;

assert.strictEqual(isSaveRequiredDevice('ONT_be6500c'), true, 'ONT_be6500c requires save');
assert.strictEqual(isSaveRequiredDevice('be6500c'), true, 'be6500c requires save');
assert.strictEqual(isSaveRequiredDevice('be12000'), true, 'be12000 requires save');
assert.strictEqual(isSaveRequiredDevice('ax3000c'), true, 'ax3000c requires save');
assert.strictEqual(isSaveRequiredDevice('ax3000hv2'), true, 'ax3000hv2 requires save');
assert.strictEqual(isSaveRequiredDevice('ax3000s'), true, 'ax3000s requires save');
assert.strictEqual(isSaveRequiredDevice('be15000'), false, 'be15000 does not require save');

console.log('✔ Test 1 passed: isSaveRequiredDevice correctly identifies all 6 devices requiring Save/Apply.');

// 3. Test evaluateLesson behavior using minimal mock
function createMockDoc(elements, isSaved, hasSuccHint) {
  return {
    _ftcIsSaved: isSaved,
    _ftcHasSuccHint: hasSuccHint,
    querySelectorAll: function (sel) {
      if (elements[sel]) return elements[sel];
      return [];
    },
    querySelector: function (sel) {
      const list = this.querySelectorAll(sel);
      return list.length > 0 ? list[0] : null;
    }
  };
}

const mockLessonPPPoE = {
  id: 'ONT_be6500c-bai1',
  grading: {
    rules: [
      {
        id: 'pppoe_user',
        name: 'Username',
        selector: 'input[name="ipv4Settings.pppoe.username"]',
        expected: 'hnfdl-123456-789',
        type: 'text_exact',
        trim: true
      },
      {
        id: 'pppoe_pass',
        name: 'Password',
        selector: 'input[name="ipv4Settings.pppoe.password"]',
        expected: 'd123456',
        type: 'text_exact',
        trim: true
      }
    ]
  }
};

const mockLessonBE12000_PPPoE = {
  id: 'LAB_BE12000_01',
  grading: {
    rules: [
      {
        id: 'pppoe_user',
        name: 'PPPoE Username',
        selector: '#UserName',
        expected: 'hnfdl-123456-789',
        type: 'text_exact',
        trim: true
      },
      {
        id: 'pppoe_pwd',
        name: 'PPPoE Password',
        selector: '#Password',
        expected: 'd123456',
        type: 'text_exact',
        trim: true
      }
    ]
  }
};

// Setup context
const sandbox = {
  console: console,
  window: {},
  document: { getElementById: () => null },
  currentDeviceId: 'be12000',
  currentMode: 'practice',
  _trackingSession: null,
  DEVICES: [{ id: 'be12000', name: 'ONT BE12000' }],
  getAllAccessibleDocuments: () => []
};
sandbox.window = sandbox;

const domMockScript = `
  var currentDeviceId = 'be12000';
  var _currentLesson = null;
  var currentMode = 'practice';
  var _trackingSession = null;
  var deviceIframe = { contentWindow: {} };
  function getAllAccessibleDocuments() { return window.mockDocs || []; }
`;

const evalFnMatch = appJsCode.match(/function evaluateLesson\(device, lesson\) \{[\s\S]*?\n  function submitLab/);
assert.ok(evalFnMatch, 'Must find evaluateLesson in app.js');
const evaluateLessonCode = evalFnMatch[0].replace(/\n  function submitLab$/, '');

const fullTestCode = `
  ${isSaveRequiredMatch[0]}
  function isNoConfigDevice() { return false; }
  ${domMockScript}
  ${evaluateLessonCode}
`;

vm.createContext(sandbox);
vm.runInContext(fullTestCode, sandbox);

// TEST CASE A: BE12000 with WRONG VALUES and hasStoredNotification = true
sandbox.currentDeviceId = 'be12000';
sandbox.window._hasSuccHintStored = true;
sandbox.window.mockDocs = [
  createMockDoc({
    '#UserName': [{ value: 'wrong_user', type: 'text' }],
    '#Password': [{ value: 'wrong_pass', type: 'password' }]
  }, true, true)
];

const resWrongWithStoredHint = sandbox.evaluateLesson({ id: 'be12000' }, mockLessonBE12000_PPPoE);
assert.strictEqual(resWrongWithStoredHint.passed, false, 'BE12000 with wrong values MUST FAIL even if hasStoredNotification = true!');
assert.strictEqual(resWrongWithStoredHint.passedCount, 0, 'Passed count must be 0 for wrong values');
console.log('✔ Test 2 passed: BE12000 deliberately configured with WRONG values fails grading even with hasStoredNotification banner active.');

// TEST CASE B: ONT_BE6500C with CORRECT VALUES but NEVER CLICKED SAVE (isSaved = false)
sandbox.currentDeviceId = 'ONT_be6500c';
sandbox.window._hasSuccHintStored = false;
sandbox.window._hasClickedSaveInGuide = false;
sandbox.window.mockDocs = [
  createMockDoc({
    'input[name="ipv4Settings.pppoe.username"]': [{ value: 'hnfdl-123456-789', type: 'text' }],
    'input[name="ipv4Settings.pppoe.password"]': [{ value: 'd123456', type: 'password' }]
  }, false, false)
];

const resUnsavedONT = sandbox.evaluateLesson({ id: 'ONT_be6500c' }, mockLessonPPPoE);
assert.strictEqual(resUnsavedONT.passed, false, 'ONT_be6500c without Save MUST FAIL grading!');
assert.ok(resUnsavedONT.details.every(d => d.message === 'Chưa bấm Save để lưu cấu hình'), 'Details must indicate Chưa bấm Save để lưu cấu hình');
console.log('✔ Test 3 passed: ONT_BE6500C without clicking Save correctly fails grading and prompts student to Save.');

// TEST CASE C: AP BE6500C with CORRECT VALUES but NEVER CLICKED SAVE (isSaved = false)
sandbox.currentDeviceId = 'be6500c';
sandbox.window._hasSuccHintStored = false;
sandbox.window._hasClickedSaveInGuide = false;
sandbox.window.mockDocs = [
  createMockDoc({
    'input[name="ipv4Settings.pppoe.username"]': [{ value: 'hnfdl-123456-789', type: 'text' }],
    'input[name="ipv4Settings.pppoe.password"]': [{ value: 'd123456', type: 'password' }]
  }, false, false)
];
const resUnsavedAP = sandbox.evaluateLesson({ id: 'be6500c' }, mockLessonPPPoE);
assert.strictEqual(resUnsavedAP.passed, false, 'be6500c without Save MUST FAIL grading!');
console.log('✔ Test 4 passed: AP BE6500C without clicking Save correctly fails grading.');

// TEST CASE D: CORRECT VALUES AND CLICKED SAVE (isSaved = true)
sandbox.currentDeviceId = 'be12000';
sandbox.window._hasSuccHintStored = true;
sandbox.window.mockDocs = [
  createMockDoc({
    '#UserName': [{ value: 'hnfdl-123456-789', type: 'text' }],
    '#Password': [{ value: 'd123456', type: 'password' }]
  }, true, true)
];

const resCorrectSaved = sandbox.evaluateLesson({ id: 'be12000' }, mockLessonBE12000_PPPoE);
assert.strictEqual(resCorrectSaved.passed, true, 'BE12000 with correct values and Save MUST PASS 100%!');
assert.strictEqual(resCorrectSaved.passedCount, 2, 'Passed count must be 2');
console.log('✔ Test 5 passed: BE12000 with correct values and Save passes 100%.');

console.log('\nALL STAGE 1 VERIFICATION TESTS PASSED SUCCESSFULLY!');
