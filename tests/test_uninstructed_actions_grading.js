const assert = require('assert');
const fs = require('fs');
const path = require('path');
const vm = require('vm');

const root = path.resolve(__dirname, '..');
const appJsCode = fs.readFileSync(path.join(root, 'app.js'), 'utf8');

// Trích xuất hàm evaluateLesson & evaluateAutoBaseline từ app.js
const autoBaselineMatch = appJsCode.match(/function evaluateAutoBaseline\(allDocs, rules, lesson\) \{[\s\S]*?\n  \}/);
assert.ok(autoBaselineMatch, 'evaluateAutoBaseline phải tồn tại trong app.js');

const evalFnMatch = appJsCode.match(/function evaluateLesson\(device, lesson\) \{[\s\S]*?\n  function submitLab/);
assert.ok(evalFnMatch, 'evaluateLesson phải tồn tại trong app.js');
const evaluateLessonCode = evalFnMatch[0].replace(/\n  function submitLab$/, '');

const sandbox = {
  console: console,
  window: {},
  document: { body: {} },
  currentMode: 'practice',
  currentLessonId: 'LAB_AX3000GZ_V2_03',
  currentDeviceId: 'ax3000gz_v2',
  _trackingSession: null,
  getAttemptRuleEvidence: () => ({ interactionAt: Date.now(), savedAfterInteraction: true }),
  getCurrentAttemptId: () => 'attempt_1',
  isSaveRequiredDevice: () => false,
  isNoConfigDevice: () => false,
  gradingDisplayValue: (r, v) => String(v)
};
sandbox.window = sandbox;

vm.runInNewContext(
  `${autoBaselineMatch[0]}\n${evaluateLessonCode}`,
  sandbox
);

// 1. Kiểm tra evaluateAutoBaseline trả về mảng rỗng (không bắt lỗi thừa ngoài yêu cầu)
const baselineResult = sandbox.evaluateAutoBaseline([], [], {});
assert.strictEqual(
  Array.isArray(baselineResult) && baselineResult.length === 0,
  true,
  'evaluateAutoBaseline phải trả về [] để không phạt lỗi thao tác ngoài hướng dẫn'
);

// 2. Kiểm tra Bài 3 AX3000GZ V2: Cấu hình Wi-Fi IoT
const mockLessonAx3000gzV2Bai3 = {
  id: 'LAB_AX3000GZ_V2_03',
  grading: {
    rules: [
      { id: 'iot_ssid', name: 'SSID Name', selector: '[id="ESSID:3"]', expected: 'FPT IoT', type: 'text_exact' },
      { id: 'iot_security', name: 'Encryption Type', selector: '[id="EncryptionType:3"]', expected: 'WPA2-PSK-AES', type: 'text_exact' },
      { id: 'iot_password', name: 'WPA Passphrase', selector: '[id="HiddenKeyPass:3"]', expected: 'Fptiot123', type: 'text_exact' }
    ]
  }
};

// Mô phỏng DOM: KTV nhập đúng 3 tiêu chí bài yêu cầu,
// ĐỒNG THỜI bật switch On/Off (Enable:3) và chỉnh một thông số không liên quan (unrelated_field)
const mockDocsWithUninstructedActions = [{
  location: { pathname: '/sim_ax3000gz_v2/' },
  _ftcIsSaved: true,
  _ftcOriginalValues: {
    'uid_enable': '0',
    'uid_unrelated': 'default_val'
  },
  querySelectorAll: (sel) => {
    if (sel === '[id="ESSID:3"]') return [{ id: 'ESSID:3', value: 'FPT IoT', tagName: 'INPUT' }];
    if (sel === '[id="EncryptionType:3"]') return [{ id: 'EncryptionType:3', value: 'WPA2-PSK-AES', tagName: 'SELECT' }];
    if (sel === '[id="HiddenKeyPass:3"]') return [{ id: 'HiddenKeyPass:3', value: 'Fptiot123', tagName: 'INPUT' }];
    if (sel === '[id="Enable:3"]') return [{ id: 'Enable:3', value: '1', tagName: 'INPUT' }];
    return [];
  },
  querySelector: (sel) => {
    if (sel === '[id="ESSID:3"]') return { id: 'ESSID:3', value: 'FPT IoT', tagName: 'INPUT' };
    if (sel === '[id="EncryptionType:3"]') return { id: 'EncryptionType:3', value: 'WPA2-PSK-AES', tagName: 'SELECT' };
    if (sel === '[id="HiddenKeyPass:3"]') return { id: 'HiddenKeyPass:3', value: 'Fptiot123', tagName: 'INPUT' };
    if (sel.includes('data-ftc-id="uid_enable"')) return { id: 'Enable:3', value: '1', tagName: 'INPUT' };
    if (sel.includes('data-ftc-id="uid_unrelated"')) return { id: 'unrelated', value: 'modified_val', tagName: 'INPUT' };
    return null;
  }
}];

sandbox.getAllAccessibleDocuments = () => mockDocsWithUninstructedActions;
sandbox.deviceIframe = { contentWindow: {} };

const result = sandbox.evaluateLesson({ id: 'ax3000gz_v2' }, mockLessonAx3000gzV2Bai3);
assert.strictEqual(result.passed, true, 'KTV làm đúng yêu cầu bài và có thao tác trường ngoài hướng dẫn PHẢI ĐƯỢC CHẤM ĐẠT');
assert.strictEqual(result.passedCount, 3, 'Số tiêu chí đạt phải là 3/3');
assert.strictEqual(result.totalRules, 3, 'Tổng số tiêu chí chỉ tính các rules trong bài (3)');
assert.strictEqual(result.details.length, 3, 'Details chỉ chứa 3 tiêu chí của bài học');
assert.ok(!result.details.some(d => d.passed === false), 'Không được có tiêu chí nào bị đánh sai ngoài yêu cầu');
assert.ok(!result.details.some(d => d.name && d.name.includes('Thao tác thừa')), 'Không được có mục Thao tác thừa');

// 3. Kiểm tra bài dùng customGrading cũng không bị ép trượt
const mockCustomGradingLesson = {
  id: 'LAB_CUSTOM_01',
  grading: {
    rules: [{ id: 'r1', name: 'Rule 1', selector: '#field1', expected: 'val1' }],
    customGrading: (allDocs) => ({
      passed: true,
      passedCount: 1,
      totalRules: 1,
      score: 100,
      details: [{ id: 'r1', name: 'Rule 1', expected: 'val1', actual: 'val1', passed: true, message: 'Chính xác' }]
    })
  }
};

const customResult = sandbox.evaluateLesson({ id: 'any_device' }, mockCustomGradingLesson);
assert.strictEqual(customResult.passed, true, 'customGrading phải giữ nguyên kết quả đạt');
assert.strictEqual(customResult.details.length, 1, 'Details chỉ chứa các tiêu chí do customGrading trả về');
assert.ok(!customResult.details.some(d => d.name && d.name.includes('Thao tác ngoài phạm vi')), 'Không được chèn Thao tác ngoài phạm vi vào customGrading');

console.log('✔ TẤT CẢ CÁC KIỂM THỬ: KHÔNG CHẤM SAI KHI KTV THAO TÁC NGOÀI HƯỚNG DẪN ĐÃ ĐẠT 100%!');
