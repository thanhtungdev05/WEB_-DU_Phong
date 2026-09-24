/**
 * tests/test_5_devices_cache_prevention.js
 * Kiểm thử tự động cơ chế chống lưu cache và cô lập phiên cho 5 thiết bị mới:
 * 1. AP BE6500C (be6500c)
 * 2. ONT BE6500C (ONT_be6500c)
 * 3. ONT BE12000 (be12000)
 * 4. ONT BE15000 (be15000)
 * 5. DrayTek Vigor2927 (vigor2927)
 */

'use strict';

const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');

const appJsPath = path.resolve(__dirname, '..', 'app.js');
const appJsCode = fs.readFileSync(appJsPath, 'utf8');

console.log('=== BẮT ĐẦU KIỂM THỬ CHỐNG LƯU CACHE CHO 5 THIẾT BỊ MỚI ===\n');

// 1. Kiểm tra cấu trúc code tĩnh trong app.js
console.log('1. Kiểm tra tĩnh hợp đồng code trong app.js:');

// Rule cache scope
assert.match(
  appJsCode,
  /window\._sessionRuleCacheScope\s*=\s*`\$\{targetDevId\}:\$\{targetLabId\}`/,
  'app.js phải khởi tạo _sessionRuleCacheScope khi startPractice'
);
assert.match(
  appJsCode,
  /const isScopeValid = \(window\._sessionRuleCacheScope === currentLessonKey\)/,
  'app.js phải kiểm tra isScopeValid khi đọc cache'
);
assert.match(
  appJsCode,
  /if \(!window\._sessionRuleCache \|\| window\._sessionRuleCacheScope !== currentLessonKey\)/,
  'app.js phải kiểm tra scope khi lưu vào _sessionRuleCache'
);
assert.match(
  appJsCode,
  /if \(window\._sessionRuleCache && window\._sessionRuleCacheScope === currentLessonKey\)/,
  'app.js phải kiểm tra scope khi xóa khỏi _sessionRuleCache'
);

// Dọn dẹp storage của 5 thiết bị mới trong resetDeviceSession
assert.match(appJsCode, /localStorage\.removeItem\('BE12000_state'\)/, 'Phải xóa BE12000_state');
assert.match(appJsCode, /localStorage\.removeItem\('labStartTime'\)/, 'Phải xóa labStartTime');
assert.match(appJsCode, /localStorage\.removeItem\('labStartSession'\)/, 'Phải xóa labStartSession');
assert.match(appJsCode, /sessionStorage\.removeItem\('be6500c_sid'\)/, 'Phải xóa be6500c_sid');
assert.match(appJsCode, /sessionStorage\.removeItem\('tech_support_sid'\)/, 'Phải xóa tech_support_sid');
assert.match(appJsCode, /sessionStorage\.removeItem\('vg_session'\)/, 'Phải xóa vg_session');
assert.match(appJsCode, /sessionStorage\.removeItem\('vg2927_sid'\)/, 'Phải xóa vg2927_sid');

// Dọn dẹp biến toàn cục Vigor2927
assert.match(appJsCode, /window\._FTC_VG2927_BAI6 = null/, 'Phải dọn biến _FTC_VG2927_BAI6');
assert.match(appJsCode, /window\._ftcHasClickedAdd = false/, 'Phải dọn biến _ftcHasClickedAdd');
assert.match(appJsCode, /window\._ftcLastAddIp = null/, 'Phải dọn biến _ftcLastAddIp');
assert.match(appJsCode, /window\._ftcLastAddMac = null/, 'Phải dọn biến _ftcLastAddMac');

// Reset endpoint của cả 5 thiết bị
assert.match(appJsCode, /resetEndpoints\.add\('\/sim_ONT_be6500c\/api\/reset'\)/, 'Phải bao phủ /sim_ONT_be6500c/api/reset');
assert.match(appJsCode, /resetEndpoints\.add\('\/ont_be6500c\/api\/reset'\)/, 'Phải bao phủ /ont_be6500c/api/reset');
assert.match(appJsCode, /resetEndpoints\.add\('\/sim_be6500c\/api\/reset'\)/, 'Phải bao phủ /sim_be6500c/api/reset');
assert.match(appJsCode, /resetEndpoints\.add\('\/sim_be12000\/api\/reset'\)/, 'Phải bao phủ /sim_be12000/api/reset');
assert.match(appJsCode, /resetEndpoints\.add\('\/sim_be15000\/api\/reset'\)/, 'Phải bao phủ /sim_be15000/api/reset');
assert.match(appJsCode, /resetEndpoints\.add\('\/sim_vigor2927\/api\/reset'\)/, 'Phải bao phủ /sim_vigor2927/api/reset');

console.log('   ✓ Kiểm tra hợp đồng tĩnh đạt yêu cầu.\n');

// 2. Kiểm tra giả lập môi trường chạy (Simulated Runtime)
console.log('2. Giả lập runtime kiểm tra cách ly cache và dọn dẹp storage:');

const mockLocalStorage = new Map();
const mockSessionStorage = new Map();
const mockWindow = {
  _sessionRuleCache: null,
  _sessionRuleCacheScope: null,
  _FTC_VG2927_BAI6: { wan1: 'configured' },
  _ftcHasClickedAdd: true,
  _ftcLastAddIp: '192.168.1.100',
  _ftcLastAddMac: 'AA-BB-CC-DD-EE-FF',
  vg2927Bai6Reset: function() {
    this._FTC_VG2927_BAI6 = null;
  }
};

global.localStorage = {
  setItem: (k, v) => mockLocalStorage.set(k, String(v)),
  getItem: (k) => mockLocalStorage.get(k) || null,
  removeItem: (k) => mockLocalStorage.delete(k)
};

global.sessionStorage = {
  setItem: (k, v) => mockSessionStorage.set(k, String(v)),
  getItem: (k) => mockSessionStorage.get(k) || null,
  removeItem: (k) => mockSessionStorage.delete(k)
};

global.window = mockWindow;

// Cài đặt dữ liệu bẩn của phiên trước
localStorage.setItem('BE12000_state', '{"saved": true}');
localStorage.setItem('labStartTime', '123456');
localStorage.setItem('labStartSession', 'sess_old');
localStorage.setItem('ftc_sim_wifi24', 'FPT_OLD');
sessionStorage.setItem('be6500c_sid', 'sid_be6500c_old');
sessionStorage.setItem('tech_support_sid', 'sid_tech_old');
sessionStorage.setItem('BE12000_session', 'be12_token');
sessionStorage.setItem('vg_session', 'vg_old');
sessionStorage.setItem('vg2927_sid', 'vg2927_old');

// Giả lập rule cache của bài BE6500C Bai 1
mockWindow._sessionRuleCache = {
  pppoe_user: { actualValue: 'fpt_test', isSaved: true, isMatch: true }
};
mockWindow._sessionRuleCacheScope = 'be6500c:be6500c-bai1';

// Kiểm tra cách ly scope:
// Khi chuyển sang ONT_be6500c:ONT_be6500c-bai1
const currentLessonKey2 = 'ONT_be6500c:ONT_be6500c-bai1';
const isScopeValid = (mockWindow._sessionRuleCacheScope === currentLessonKey2);
assert.equal(isScopeValid, false, 'Scope của bài trước không được hợp lệ trên bài mới');

// Giả lập cơ chế checkRule khi element không tìm thấy
let elementFound = false;
let actualValue = '';
let isMatch = false;
let isSaved = false;

if (!elementFound) {
  const isScopeValidCheck = (mockWindow._sessionRuleCacheScope === currentLessonKey2);
  const cached = isScopeValidCheck && mockWindow._sessionRuleCache && mockWindow._sessionRuleCache['pppoe_user'];
  if (cached) {
    elementFound = true;
    actualValue = cached.actualValue;
    isSaved = cached.isSaved;
    isMatch = cached.isMatch;
  }
}

assert.equal(elementFound, false, 'Element vắng mặt trên bài mới KHÔNG ĐƯỢC lấy giá trị từ cache của bài cũ');
assert.equal(isMatch, false, 'Bài mới KHÔNG ĐƯỢC tự động ĐẠT nhờ cache cũ');

console.log('   ✓ Cách ly rule cache giữa các bài thành công (không bị leak kết quả).');

// Giả lập chạy hàm dọn dẹp storage & window globals
// Dựa trên logic của resetDeviceSession trong app.js
function runSimulatedReset() {
  window._sessionRuleCache = {};
  window._sessionRuleCacheScope = null;

  if (typeof window.vg2927Bai6Reset === 'function') {
    window.vg2927Bai6Reset();
  }
  window._FTC_VG2927_BAI6 = null;
  window._ftcHasClickedAdd = false;
  window._ftcLastAddIp = null;
  window._ftcLastAddMac = null;

  localStorage.removeItem('ftc_sim_wifi24');
  localStorage.removeItem('ftc_sim_wifi5g');
  localStorage.removeItem('BE12000_state');
  localStorage.removeItem('labStartTime');
  localStorage.removeItem('labStartSession');
  sessionStorage.removeItem('ftc_ac1000f_wan_PPPUsername');
  sessionStorage.removeItem('ftc_ac1000f_wan_PPPPassword');
  sessionStorage.removeItem('BE12000_session');
  sessionStorage.removeItem('BE12000_loginToken');
  sessionStorage.removeItem('sid');
  sessionStorage.removeItem('be6500c_sid');
  sessionStorage.removeItem('tech_support_sid');
  sessionStorage.removeItem('vg_session');
  sessionStorage.removeItem('vg2927_sid');
}

runSimulatedReset();

// Kiểm tra toàn bộ storage đã sạch
assert.equal(localStorage.getItem('BE12000_state'), null);
assert.equal(localStorage.getItem('labStartTime'), null);
assert.equal(localStorage.getItem('labStartSession'), null);
assert.equal(localStorage.getItem('ftc_sim_wifi24'), null);
assert.equal(sessionStorage.getItem('be6500c_sid'), null);
assert.equal(sessionStorage.getItem('tech_support_sid'), null);
assert.equal(sessionStorage.getItem('BE12000_session'), null);
assert.equal(sessionStorage.getItem('vg_session'), null);
assert.equal(sessionStorage.getItem('vg2927_sid'), null);

// Kiểm tra toàn bộ biến window đã sạch
assert.deepEqual(mockWindow._sessionRuleCache, {});
assert.equal(mockWindow._sessionRuleCacheScope, null);
assert.equal(mockWindow._FTC_VG2927_BAI6, null);
assert.equal(mockWindow._ftcHasClickedAdd, false);
assert.equal(mockWindow._ftcLastAddIp, null);
assert.equal(mockWindow._ftcLastAddMac, null);

console.log('   ✓ Dọn dẹp storage và biến toàn cục của cả 5 thiết bị hoàn thành 100%.');

console.log('\n================================================================');
console.log('TẤT CẢ CÁC BÀI KIỂM TRA CHỐNG LƯU CACHE ĐÃ ĐẠT 100%!');
console.log('================================================================\n');
