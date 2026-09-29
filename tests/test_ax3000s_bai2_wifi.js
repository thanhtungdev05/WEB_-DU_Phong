'use strict';

const fs = require('fs');
const assert = require('assert');
const path = require('path');
const vm = require('vm');

const root = path.resolve(__dirname, '..');

// 1. Verify files exist and load contents
const bai2Path = path.join(root, 'devices/ax3000s/lessons/bai2.js');
const tooltipPath = path.join(root, 'devices/ax3000s/tooltips/bai2.js');
const dataPath = path.join(root, 'devices/ax3000s/data.js');
const portalPath = path.join(root, 'portal.html');
const appPath = path.join(root, 'app.js');

const bai2Content = fs.readFileSync(bai2Path, 'utf8');
const tooltipContent = fs.readFileSync(tooltipPath, 'utf8');
const dataContent = fs.readFileSync(dataPath, 'utf8');
const portalContent = fs.readFileSync(portalPath, 'utf8');
const appContent = fs.readFileSync(appPath, 'utf8');

// 2. Instructions check: Bandwidth must be required
assert.ok(
  bai2Content.includes('20Mhz'),
  'bai2.js instructions must require Bandwidth 20Mhz'
);
assert.ok(
  bai2Content.includes('FPT Telecom'),
  'bai2.js must require SSID FPT Telecom'
);
assert.ok(
  bai2Content.includes('19006600'),
  'bai2.js must require WPA Key 19006600'
);

// 3. Tooltips check: Bandwidth must be present with #Sel_BandWidth
assert.ok(
  tooltipContent.includes('20Mhz') && tooltipContent.includes('#Sel_BandWidth'),
  'tooltips/bai2.js must contain Bandwidth 20Mhz targeting #Sel_BandWidth'
);

// 4. Portal cachebuster check
assert.ok(
  portalContent.includes('devices/ax3000s/tooltips/bai2.js?v=20260927231500'),
  'portal.html must include bumped cachebuster for tooltips/bai2.js'
);
assert.ok(
  portalContent.includes('devices/ax3000s/lessons/bai2.js?v=20260927235000'),
  'portal.html must include bumped cachebuster for lessons/bai2.js'
);
assert.ok(
  /app\.js\?v=\d+/.test(portalContent),
  'portal.html must include cachebuster for app.js'
);

// 5. VM Evaluation
const context = {
  window: {},
  document: {},
  console: console
};
context.window = context;
vm.createContext(context);

vm.runInContext(tooltipContent, context);
vm.runInContext(bai2Content, context);
vm.runInContext(dataContent, context);

const tooltips = context.window.TOOLTIPS_AX3000S && context.window.TOOLTIPS_AX3000S['LAB_AX3000S_02'];
assert.ok(Array.isArray(tooltips), 'TOOLTIPS_AX3000S.LAB_AX3000S_02 must be an array');
assert.strictEqual(tooltips.length, 5, 'Must have exactly 5 clean steps');

const step1 = tooltips.find(t => t.text && t.text.includes('Bước 1'));
const step2 = tooltips.find(t => t.text && t.text.includes('Bước 2'));
const step3 = tooltips.find(t => t.text && t.text.includes('Bước 3'));
const step4 = tooltips.find(t => t.text && t.text.includes('Bước 4'));
const step5 = tooltips.find(t => t.text && t.text.includes('Bước 5'));

assert.ok(step1 && step1.selector.includes('#Sky_WLAN'), 'Bước 1 must target #Sky_WLAN');
assert.ok(step2 && step2.selector === '#Txt_SSID' && step2.expected === 'FPT Telecom', 'Bước 2 must target #Txt_SSID');
assert.ok(step3 && step3.selector === '#Pwd_WpaPsk' && step3.expected === '19006600', 'Bước 3 must target #Pwd_WpaPsk');
assert.ok(step4 && step4.selector === '#Sel_BandWidth' && step4.expected === '20Mhz', 'Bước 4 must target #Sel_BandWidth');
assert.ok(step5 && step5.selector === '#button_apply', 'Bước 5 must target #button_apply');

// Verify steps 2, 3, 4, 5 are configured to display on wlanBasicSetting2g
assert.strictEqual(step2.page, 'wlanBasicSetting2g');
assert.strictEqual(step3.page, 'wlanBasicSetting2g');
assert.strictEqual(step4.page, 'wlanBasicSetting2g');
assert.strictEqual(step5.page, 'wlanBasicSetting2g');

// 6. Test declarative grading rules
const lessons = context.window.DEVICE_AX3000S_LESSONS;
const bai2 = lessons.find(l => l.id === 'LAB_AX3000S_02');
assert.ok(bai2, 'LAB_AX3000S_02 must exist in DEVICE_AX3000S_LESSONS');
assert.strictEqual(bai2.practiceUrl, '/sim_ax3000s/app.html#wlanBasicSetting2g');

const rules = bai2.grading.rules;
assert.ok(Array.isArray(rules), 'grading.rules must be an array');
assert.strictEqual(rules.length, 3, 'Grading must have 3 rules: wifi_ssid, wifi_key, wifi_bw');

const ssidRule = rules.find(r => r.id === 'wifi_ssid');
const pwdRule = rules.find(r => r.id === 'wifi_key');
const bwRule = rules.find(r => r.id === 'wifi_bw');

assert.ok(ssidRule, 'wifi_ssid rule must exist');
assert.strictEqual(ssidRule.expected, 'FPT Telecom');
assert.strictEqual(ssidRule.required, true);

assert.ok(pwdRule, 'wifi_key rule must exist');
assert.strictEqual(pwdRule.expected, '19006600');
assert.strictEqual(pwdRule.required, true);

assert.ok(bwRule, 'wifi_bw rule must exist');
assert.strictEqual(bwRule.expected, '20Mhz');
assert.strictEqual(bwRule.required, true);

// 7. Test app.js unblocking of 2.4G save & removal of 5G requirements for LAB_AX3000S_02
assert.ok(
  !appContent.includes("if (_currentLesson && _currentLesson.id === 'LAB_AX3000S_02') {\n      const href = (simWin && simWin.location && simWin.location.href) ? simWin.location.href.toLowerCase() : '';\n      if (href.includes('wlanbasicsetting2g')) {\n        return;\n      }\n    }"),
  'app.js must not block 2.4G save in onSimulatorSave for LAB_AX3000S_02'
);
assert.ok(
  !appContent.includes("hasSaved5g"),
  'app.js must not require 5G to be saved for LAB_AX3000S_02'
);
assert.ok(
  !appContent.includes("if (currentLessonId === 'LAB_AX3000S_02' && d.location && d.location.href.toLowerCase().includes('wlanbasicsetting2g')) {\n            return false;\n          }"),
  'app.js must not ignore 2.4G save in isAnyDocSaved'
);

// 8. Test evaluation in VM for LAB_AX3000S_02 with valid vs garbage inputs
const evalPart = appContent.slice(appContent.indexOf('function evaluateLesson'), appContent.indexOf('function submitLab'));
const isSaveReqPart = appContent.slice(appContent.indexOf('function isSaveRequiredDevice'), appContent.indexOf('function populateDeviceDropdown'));
const isNoConfigPart = appContent.slice(appContent.indexOf('function isNoConfigDevice'), appContent.indexOf('function isSaveRequiredDevice'));

const evalCtx = {
  console: console,
  window: {},
  document: { getElementById: () => null },
  currentDeviceId: 'ax3000s',
  currentLessonId: 'LAB_AX3000S_02',
  currentMode: 'guide',
  _trackingSession: null,
  DEVICES: [{ id: 'ax3000s', name: 'AX3000S' }],
  deviceIframe: { contentWindow: {} },
  getAllAccessibleDocuments: () => []
};
evalCtx.window = evalCtx;
vm.createContext(evalCtx);

vm.runInContext(isNoConfigPart, evalCtx);
vm.runInContext(isSaveReqPart, evalCtx);
vm.runInContext(evalPart, evalCtx);
vm.runInContext(bai2Content, evalCtx);

function createMock2gDoc(ssid, key, bw, isSaved) {
  const elements = {
    '#Txt_SSID, input[name="Txt_SSID"]': [{ value: ssid, type: 'text' }],
    '#Pwd_WpaPsk, input[name="Pwd_WpaPsk"]': [{ value: key, type: 'password' }],
    '#Sel_BandWidth, select[name="Sel_BandWidth"]': [{ value: bw, type: 'select-one' }]
  };
  return {
    location: { href: 'http://localhost/wlanbasicsetting2g', search: '' },
    _ftcIsSaved: isSaved,
    querySelectorAll: (sel) => elements[sel] || [],
    querySelector: (sel) => (elements[sel] && elements[sel][0]) || null
  };
}

// Case A: Cấu hình bậy (sai SSID, sai Password, sai Bandwidth) -> evalResult.passed MUST be false
evalCtx.getAllAccessibleDocuments = () => [createMock2gDoc('GarbageSSID', 'wrongpass', '40Mhz', true)];
evalCtx.window._hasClickedSaveInGuide = true;
const resGarbage = evalCtx.evaluateLesson({ id: 'ax3000s' }, bai2);
assert.strictEqual(resGarbage.passed, false, 'Configuring garbage values must fail evaluation');
assert.strictEqual(resGarbage.passedCount, 0, 'Passed count must be 0 for all-wrong inputs');

// Case B: Cấu hình chuẩn (FPT Telecom, 19006600, 20Mhz) và đã bấm Save trên 2.4G -> evalResult.passed MUST be true
evalCtx.getAllAccessibleDocuments = () => [createMock2gDoc('FPT Telecom', '19006600', '20Mhz', true)];
evalCtx.window._hasClickedSaveInGuide = true;
const resCorrect = evalCtx.evaluateLesson({ id: 'ax3000s' }, bai2);
assert.strictEqual(resCorrect.passed, true, 'Configuring correct values with 2.4G save must pass evaluation');
assert.strictEqual(resCorrect.passedCount, 3, 'Passed count must be 3 for all-correct inputs');

// Case C: KTV chuyển sang tab 5G (nơi Bandwidth mặc định là 80Mhz) -> Không được báo lỗi sai, evalResult.passed vẫn phải là true!
function createMock5gDoc(ssid, key, bw5g) {
  const bw5gEl = {
    value: bw5g,
    type: 'select-one',
    closest: (sel) => sel === '#11n_BandWidth5G' ? true : null,
    querySelector: (sel) => sel.includes('80Mhz') ? {} : null
  };
  const elements = {
    '#Txt_SSID, input[name="Txt_SSID"]': [{ value: ssid, type: 'text' }],
    '#Pwd_WpaPsk, input[name="Pwd_WpaPsk"]': [{ value: key, type: 'password' }],
    '#Sel_BandWidth, select[name="Sel_BandWidth"]': [bw5gEl]
  };
  return {
    location: { href: 'http://localhost/wlanbasicsetting5g', hash: '#wlanBasicSetting5g', search: '' },
    _ftcIsSaved: false,
    _ftc2gSaved: true,
    querySelectorAll: (sel) => elements[sel] || [],
    querySelector: (sel) => {
      if (sel === '#11n_BandWidth5G') return bw5gEl;
      if (sel === '.skpage-title') return { textContent: '5G Basic Setting' };
      return (elements[sel] && elements[sel][0]) || null;
    }
  };
}

evalCtx.getAllAccessibleDocuments = () => [createMock5gDoc('FPT Telecom', '19006600', '80Mhz')];
const res5g = evalCtx.evaluateLesson({ id: 'ax3000s' }, bai2);
assert.strictEqual(res5g.passed, true, 'Navigating to 5G tab with 80Mhz default must NOT fail 2.4G evaluation');
assert.strictEqual(res5g.passedCount, 3, 'All 3 rules must remain passed on 5G view');
const bwDetail = res5g.details.find(d => d.id === 'wifi_bw');
assert.ok(bwDetail && bwDetail.passed, 'wifi_bw detail must be passed on 5G view');

// Case D: KTV chuyển sang menu khác (ví dụ LAN/WAN không có ô cấu hình Wi-Fi) -> evalResult.passed vẫn phải giữ true từ Session Cache
evalCtx.getAllAccessibleDocuments = () => [{
  location: { href: 'http://localhost/lan', hash: '#lan', search: '' },
  querySelectorAll: () => [],
  querySelector: () => null
}];
const resOtherPage = evalCtx.evaluateLesson({ id: 'ax3000s' }, bai2);
assert.strictEqual(resOtherPage.passed, true, 'Navigating to LAN/WAN must retain passed evaluation from session cache');
assert.strictEqual(resOtherPage.passedCount, 3, 'Passed count must remain 3 from session cache');

// Case E: Kiểm tra clearLessonFields không xóa trắng trường 2.4G khi _ftc2gSaved là true
const clearFieldsPart = appContent.slice(appContent.indexOf('function clearLessonFields'), appContent.indexOf('window.ftcLayCheDo'));
const clearCtx = {
  console: console,
  window: { _hasClickedSaveInGuide: false, _ftc2gSaved: true },
  _currentLesson: bai2,
  currentLessonId: 'LAB_AX3000S_02',
  deviceIframe: { contentWindow: {} },
  getAllAccessibleDocuments: () => []
};
clearCtx.window = clearCtx;
vm.createContext(clearCtx);
vm.runInContext(clearFieldsPart, clearCtx);

const mock2gDocForClear = {
  _ftc2gSaved: true,
  _ftcLastSaveInteraction: Date.now(),
  _ftcIsSaved: true,
  location: { href: 'http://localhost/wlanbasicsetting2g', search: '' },
  querySelectorAll: (sel) => {
    if (sel.includes('Txt_SSID')) return [{ value: 'FPT Telecom', tagName: 'INPUT', dataset: {} }];
    if (sel.includes('Pwd_WpaPsk')) return [{ value: '19006600', tagName: 'INPUT', dataset: {} }];
    return [];
  }
};
clearCtx.getAllAccessibleDocuments = () => [mock2gDocForClear];
clearCtx.clearLessonFields();
const ssidInput = mock2gDocForClear.querySelectorAll('#Txt_SSID')[0];
const pwdInput = mock2gDocForClear.querySelectorAll('#Pwd_WpaPsk')[0];
assert.strictEqual(ssidInput.value, 'FPT Telecom', 'clearLessonFields must NOT wipe SSID when 2.4G was saved');
assert.strictEqual(pwdInput.value, '19006600', 'clearLessonFields must NOT wipe Password when 2.4G was saved');

// 9. Test Save Commit Snapshot & Status Toast for AX3000S
assert.ok(
  appContent.includes('ftc-ax3000s-save-status'),
  'app.js must provide visual save status feedback for AX3000S'
);
assert.ok(
  appContent.includes("window._sessionRuleCacheScope = 'ax3000s_LAB_AX3000S_02'"),
  'app.js must snapshot 2.4G values into session cache on save click'
);
assert.ok(
  appContent.includes("targetEl.id === 'Txt_SSID' || targetEl.name === 'Txt_SSID'"),
  'isEventOnAx3000s2g must specifically filter 2.4G inputs to prevent false-positive save invalidations'
);

console.log('ALL AX3000S BAI 2 WIFI TESTS PASSED SUCCESSFULLY!');
