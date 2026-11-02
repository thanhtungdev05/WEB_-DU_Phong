const assert = require('assert');
const fs = require('fs');
const path = require('path');
const vm = require('vm');

const root = path.resolve(__dirname, '..');
const appJsCode = fs.readFileSync(path.join(root, 'app.js'), 'utf8');

// Trích xuất hàm evaluateLesson & evaluateAutoBaseline & getLabelForElement từ app.js
const labelMatch = appJsCode.match(/function getLabelForElement\(el, doc\) \{[\s\S]*?\n  \}/);
assert.ok(labelMatch, 'getLabelForElement phải tồn tại trong app.js');

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
  `${labelMatch[0]}\n${autoBaselineMatch[0]}\n${evaluateLessonCode}`,
  sandbox
);

// 1. Kiểm tra evaluateAutoBaseline phát hiện khi có trường bị sửa ngoài yêu cầu
const mockDocWithUnrelated = [{
  location: { pathname: '/sim_ax3000gz_v2/' },
  _ftcIsSaved: true,
  _ftcOriginalValues: {
    'uid_unrelated': 'default_val'
  },
  querySelector: (sel) => {
    if (sel.includes('data-ftc-id="uid_unrelated"')) {
      return { id: 'unrelated_field', name: 'unrelated', value: 'modified_val', tagName: 'INPUT' };
    }
    return null;
  },
  querySelectorAll: () => []
}];
const baselineResult = sandbox.evaluateAutoBaseline(mockDocWithUnrelated, [{ selector: '#other_field' }], {});
assert.strictEqual(
  Array.isArray(baselineResult) && baselineResult.length > 0,
  true,
  'evaluateAutoBaseline phải phát hiện trường bị sửa ngoài hướng dẫn'
);
assert.strictEqual(baselineResult[0].actual, 'modified_val');
assert.strictEqual(baselineResult[0].expected, 'default_val');

// 2. Kiểm tra Bài 3 AX3000GZ V2: KTV thao tác ngoài hướng dẫn PHẢI BỊ CHẤM SAI
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

// Mô phỏng DOM: KTV nhập đúng 3 tiêu chí bài yêu cầu, NHƯNG sửa thêm 1 thông số không liên quan (unrelated_field)
const mockDocsWithUninstructedActions = [{
  location: { pathname: '/sim_ax3000gz_v2/' },
  _ftcIsSaved: true,
  _ftcOriginalValues: {
    'uid_unrelated': 'default_val'
  },
  querySelectorAll: (sel) => {
    if (sel === '[id="ESSID:3"]') return [{ id: 'ESSID:3', value: 'FPT IoT', tagName: 'INPUT' }];
    if (sel === '[id="EncryptionType:3"]') return [{ id: 'EncryptionType:3', value: 'WPA2-PSK-AES', tagName: 'SELECT' }];
    if (sel === '[id="HiddenKeyPass:3"]') return [{ id: 'HiddenKeyPass:3', value: 'Fptiot123', tagName: 'INPUT' }];
    return [];
  },
  querySelector: (sel) => {
    if (sel === '[id="ESSID:3"]') return { id: 'ESSID:3', value: 'FPT IoT', tagName: 'INPUT' };
    if (sel === '[id="EncryptionType:3"]') return { id: 'EncryptionType:3', value: 'WPA2-PSK-AES', tagName: 'SELECT' };
    if (sel === '[id="HiddenKeyPass:3"]') return { id: 'HiddenKeyPass:3', value: 'Fptiot123', tagName: 'INPUT' };
    if (sel.includes('data-ftc-id="uid_unrelated"')) return { id: 'unrelated', name: 'unrelated', value: 'modified_val', tagName: 'INPUT' };
    return null;
  }
}];

sandbox.getAllAccessibleDocuments = () => mockDocsWithUninstructedActions;
sandbox.deviceIframe = { contentWindow: {} };

// Kiểm tra ở chế độ Thực hành (Practice Mode): có thao tác ngoài hướng dẫn -> CHẤM LÀ SAI
sandbox.currentMode = 'practice';
const resultPractice = sandbox.evaluateLesson({ id: 'ax3000gz_v2' }, mockLessonAx3000gzV2Bai3);
assert.strictEqual(resultPractice.passed, false, 'Chế độ Thực hành: KTV thao tác ngoài hướng dẫn PHẢI BỊ CHẤM SAI');
assert.strictEqual(resultPractice.passedCount, 3, 'Số tiêu chí đúng của đề bài vẫn ghi nhận 3');
assert.ok(resultPractice.details.some(d => d.passed === false && (d.name.includes('Thao tác ngoài hướng dẫn') || d.name.includes('unrelated'))), 'Details phải chứa mục lỗi thao tác ngoài hướng dẫn');

// Kiểm tra ở chế độ Hướng dẫn (Guide Mode): có thao tác ngoài hướng dẫn -> CHẤM LÀ SAI
sandbox.currentMode = 'guide';
const resultGuide = sandbox.evaluateLesson({ id: 'ax3000gz_v2' }, mockLessonAx3000gzV2Bai3);
assert.strictEqual(resultGuide.passed, false, 'Chế độ Hướng dẫn: KTV thao tác ngoài hướng dẫn PHẢI BỊ CHẤM SAI');
assert.ok(resultGuide.details.some(d => d.passed === false && (d.name.includes('Thao tác ngoài hướng dẫn') || d.name.includes('unrelated'))), 'Details phải chứa mục lỗi thao tác ngoài hướng dẫn ở chế độ guide');

// 3. Kiểm tra thiết bị AC1000Z cũng được gông chặt chẽ tương tự
const mockLessonAc1000zBai1 = {
  id: 'LAB_AC1000Z_01',
  grading: {
    rules: [
      { id: 'pppoe_user', name: 'Username', selector: '[id="UserName:0"]', expected: 'sgfdl-123456-789', type: 'text_exact' },
      { id: 'pppoe_password', name: 'Password', selector: '[id="Password:0"]', expected: 'fpt12345', type: 'text_exact' }
    ]
  }
};
const mockAc1000zDocsWithOutsideEdit = [{
  location: { pathname: '/sim_ac1000z/' },
  _ftcIsSaved: true,
  _ftcOriginalValues: {
    'uid_mtu': '1492'
  },
  querySelectorAll: (sel) => {
    if (sel === '[id="UserName:0"]') return [{ id: 'UserName:0', value: 'sgfdl-123456-789', tagName: 'INPUT' }];
    if (sel === '[id="Password:0"]') return [{ id: 'Password:0', value: 'fpt12345', tagName: 'INPUT' }];
    return [];
  },
  querySelector: (sel) => {
    if (sel === '[id="UserName:0"]') return { id: 'UserName:0', value: 'sgfdl-123456-789', tagName: 'INPUT' };
    if (sel === '[id="Password:0"]') return { id: 'Password:0', value: 'fpt12345', tagName: 'INPUT' };
    if (sel.includes('data-ftc-id="uid_mtu"')) return { id: 'MTU', name: 'MTU', value: '1500', tagName: 'INPUT' };
    return null;
  }
}];
sandbox.getAllAccessibleDocuments = () => mockAc1000zDocsWithOutsideEdit;
sandbox.currentDeviceId = 'ac1000z';
const resultAc1000z = sandbox.evaluateLesson({ id: 'ac1000z' }, mockLessonAc1000zBai1);
assert.strictEqual(resultAc1000z.passed, false, 'AC1000Z: Sửa thông số ngoài hướng dẫn (MTU) PHẢI BỊ CHẤM SAI');
assert.ok(resultAc1000z.details.some(d => d.passed === false && (d.name.includes('Thao tác ngoài hướng dẫn') || d.name.includes('MTU'))), 'AC1000Z: Phải báo lỗi thao tác ngoài hướng dẫn cho MTU');

// 4. Kiểm tra khi KTV làm ĐÚNG và KHÔNG có thao tác ngoài hướng dẫn thì ĐẠT 100%
const mockDocsClean = [{
  location: { pathname: '/sim_ax3000gz_v2/' },
  _ftcIsSaved: true,
  _ftcOriginalValues: {},
  querySelectorAll: (sel) => {
    if (sel === '[id="ESSID:3"]') return [{ id: 'ESSID:3', value: 'FPT IoT', tagName: 'INPUT' }];
    if (sel === '[id="EncryptionType:3"]') return [{ id: 'EncryptionType:3', value: 'WPA2-PSK-AES', tagName: 'SELECT' }];
    if (sel === '[id="HiddenKeyPass:3"]') return [{ id: 'HiddenKeyPass:3', value: 'Fptiot123', tagName: 'INPUT' }];
    return [];
  },
  querySelector: (sel) => {
    if (sel === '[id="ESSID:3"]') return { id: 'ESSID:3', value: 'FPT IoT', tagName: 'INPUT' };
    if (sel === '[id="EncryptionType:3"]') return { id: 'EncryptionType:3', value: 'WPA2-PSK-AES', tagName: 'SELECT' };
    if (sel === '[id="HiddenKeyPass:3"]') return { id: 'HiddenKeyPass:3', value: 'Fptiot123', tagName: 'INPUT' };
    return null;
  }
}];
sandbox.getAllAccessibleDocuments = () => mockDocsClean;
const resultClean = sandbox.evaluateLesson({ id: 'ax3000gz_v2' }, mockLessonAx3000gzV2Bai3);
assert.strictEqual(resultClean.passed, true, 'KTV làm đúng đề bài và không có thao tác thừa PHẢI ĐƯỢC CHẤM ĐẠT');
assert.strictEqual(resultClean.passedCount, 3, '3/3 tiêu chí đạt');
assert.strictEqual(resultClean.totalRules, 3, 'Tổng tiêu chí là 3');

console.log('✔ TẤT CẢ CÁC KIỂM THỬ: GÔNG CHẶT THAO TÁC NGOÀI HƯỚNG DẪN TRÊN AX3000GZ V2 VÀ AC1000Z ĐÃ ĐẠT 100%!');
