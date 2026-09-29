'use strict';

const fs = require('fs');
const assert = require('assert');
const path = require('path');
const vm = require('vm');

const root = path.resolve(__dirname, '..');
const wlanJsPath = path.join(root, 'simulators/sim_ax3000s/www/luci-static/resources/view/skgwfpt/wlanBasicSetting2g.js');
const appJsPath = path.join(root, 'app.js');

const wlanJsContent = fs.readFileSync(wlanJsPath, 'utf8');
const appJsContent = fs.readFileSync(appJsPath, 'utf8');

// 1. Kiểm tra wlanBasicSetting2g.js đã có hàm ftcNotifyPortalSave
assert.ok(
  wlanJsContent.includes('function ftcNotifyPortalSave'),
  'wlanBasicSetting2g.js must define ftcNotifyPortalSave function'
);

// 2. Kiểm tra BntClick_Apply gọi ftcNotifyPortalSave trước khi setRadioInfo
assert.ok(
  wlanJsContent.includes('ftcNotifyPortalSave(ssid,password,bandwidth);'),
  'BntClick_Apply must call ftcNotifyPortalSave with SSID, password, and bandwidth'
);

// 3. Kiểm tra setBssInfo gọi ftcNotifyPortalSave sau khi lưu backend
assert.ok(
  wlanJsContent.includes('ftcNotifyPortalSave(getValue("Txt_SSID"),getValue("Pwd_WpaPsk"),getValue("Sel_BandWidth"))'),
  'setBssInfo callback must call ftcNotifyPortalSave on successful save'
);

// 4. Kiểm tra truyền dữ liệu FTC_SAVE_SUCCESS qua postMessage và onSimulatorSave
assert.ok(
  wlanJsContent.includes('p.onSimulatorSave(window,"wlanBasicSetting2g")'),
  'ftcNotifyPortalSave must invoke portal onSimulatorSave callback'
);
assert.ok(
  wlanJsContent.includes('type:"FTC_SAVE_SUCCESS"'),
  'ftcNotifyPortalSave must emit FTC_SAVE_SUCCESS postMessage'
);

// 5. Kiểm tra app.js xử lý message FTC_SAVE_SUCCESS và cập nhật sessionRuleCache
assert.ok(
  appJsContent.includes("e.data.source === 'ax3000s_wlanBasicSetting2g' || currentLessonId === 'LAB_AX3000S_02'"),
  'app.js message listener must handle ax3000s_wlanBasicSetting2g events'
);
assert.ok(
  appJsContent.includes("window._sessionRuleCache['wifi_ssid'] = { actualValue: sVal, isSaved: true, isMatch: (sVal === 'FPT Telecom') }"),
  'app.js message listener must cache wifi_ssid'
);

// 6. Mô phỏng luồng Save & Apply kích hoạt nút Nộp bài sáng lên
let btnSubmitLabState = {
  disabled: true,
  opacity: '0.5',
  cursor: 'not-allowed',
  animation: 'none'
};

const mockPortal = {
  _sessionRuleCache: {},
  _sessionRuleCacheScope: '',
  _ftc2gSaved: false,
  _hasClickedSaveInGuide: false,
  currentMode: 'guide',
  currentLessonId: 'LAB_AX3000S_02',
  currentDeviceId: 'ax3000s',
  btnSubmitLab: btnSubmitLabState,
  onSimulatorSave: function (simWin, modalTitle) {
    mockPortal._hasClickedSaveInGuide = true;
    mockPortal._ftc2gSaved = true;
    // Khi cấu hình đúng và đã bấm Save:
    const evalPassed = (mockPortal._sessionRuleCache['wifi_ssid']?.isMatch &&
                        mockPortal._sessionRuleCache['wifi_key']?.isMatch &&
                        mockPortal._sessionRuleCache['wifi_bw']?.isMatch);
    if (evalPassed) {
      mockPortal.btnSubmitLab.disabled = false;
      mockPortal.btnSubmitLab.opacity = '1';
      mockPortal.btnSubmitLab.cursor = 'pointer';
      mockPortal.btnSubmitLab.animation = 'submitBtnPulse 2.5s infinite';
    }
  },
  postMessage: function (msg, target) {
    if (msg.type === 'FTC_SAVE_SUCCESS') {
      mockPortal.onSimulatorSave(null, msg.source);
    }
  }
};

// Giả lập môi trường chạy hàm ftcNotifyPortalSave trong iframe AX3000S
const simContext = {
  window: { parent: mockPortal, top: mockPortal },
  document: { _ftc2gSaved: false, _ftcIsSaved: false, _ftcLastSaveInteraction: 0 },
  getValue: function (id) {
    if (id === 'Txt_SSID') return 'FPT Telecom';
    if (id === 'Pwd_WpaPsk') return '19006600';
    if (id === 'Sel_BandWidth') return '20Mhz';
    return '';
  },
  console: console
};
simContext.window.window = simContext.window;

// Trích xuất và chạy hàm ftcNotifyPortalSave
const fnStart = wlanJsContent.indexOf('function ftcNotifyPortalSave');
const fnEnd = wlanJsContent.indexOf('function setRadioInfo', fnStart);
const fnCode = wlanJsContent.slice(fnStart, fnEnd);

vm.createContext(simContext);
vm.runInContext(fnCode, simContext);

// KTV nhập đúng thông tin và bấm Save & Apply
simContext.ftcNotifyPortalSave('FPT Telecom', '19006600', '20Mhz');

// Kiểm tra: Dữ liệu đã truyền thành công về Portal
assert.strictEqual(mockPortal._ftc2gSaved, true, 'Portal must have _ftc2gSaved flag set to true');
assert.strictEqual(mockPortal._hasClickedSaveInGuide, true, 'Portal must have _hasClickedSaveInGuide set to true');
assert.strictEqual(mockPortal._sessionRuleCache['wifi_ssid'].actualValue, 'FPT Telecom', 'wifi_ssid must be saved in cache');
assert.strictEqual(mockPortal._sessionRuleCache['wifi_key'].actualValue, '19006600', 'wifi_key must be saved in cache');
assert.strictEqual(mockPortal._sessionRuleCache['wifi_bw'].actualValue, '20Mhz', 'wifi_bw must be saved in cache');

// Kiểm tra: Nút Nộp bài trên Portal ĐÃ BỪNG SÁNG LÊN
assert.strictEqual(mockPortal.btnSubmitLab.disabled, false, 'btnSubmitLab must be ENABLED (disabled = false)');
assert.strictEqual(mockPortal.btnSubmitLab.opacity, '1', 'btnSubmitLab must have opacity 1');
assert.strictEqual(mockPortal.btnSubmitLab.cursor, 'pointer', 'btnSubmitLab must have cursor pointer');
assert.strictEqual(mockPortal.btnSubmitLab.animation, 'submitBtnPulse 2.5s infinite', 'btnSubmitLab must pulse');

console.log('ALL AX3000S SAVE & APPLY LINKAGE TO SUBMIT BUTTON TESTS PASSED SUCCESSFULLY!');
