/**
 * tests/test_cross_session_cache_investigation.js
 * Kiểm tra xem các cơ chế reset session và cache có còn sót trong 3 thiết bị mới không:
 * 1. resetDeviceSession có xóa BE12000_state trong localStorage không?
 * 2. _sessionRuleCache có bị rò rỉ giữa 2 bài có cùng rule.id (vd ONT_be6500c-bai6 -> be6500c-bai6) không?
 * 3. window._hasSuccHintStored và window._hasClickedSaveInGuide có được reset sạch khi chuyển bài/chuyển thiết bị không?
 */

const fs = require('fs');
const path = require('path');
const assert = require('assert');

console.log('--- KIỂM TRA LỖI LƯU CACHE CÁC PHIÊN LÀM VIỆC TRÊN 3 THIẾT BỊ MỚI ---');

const appJs = fs.readFileSync(path.join(__dirname, '..', 'app.js'), 'utf8');

// 1. Kiểm tra resetDeviceSession trong app.js
console.log('1. Kiểm tra xóa storage trong resetDeviceSession()...');
const hasBe12000StateReset = appJs.includes("localStorage.removeItem('BE12000_state')");
console.log(' - Có xóa BE12000_state trong localStorage không?:', hasBe12000StateReset ? 'CÓ' : 'CHƯA (LỖI LƯU CACHE)');

const hasLabStartTimeReset = appJs.includes("localStorage.removeItem('labStartTime')");
console.log(' - Có xóa labStartTime trong localStorage không?:', hasLabStartTimeReset ? 'CÓ' : 'CHƯA (LỖI LƯU CACHE)');

// 2. Kiểm tra _sessionRuleCache có được gắn namespace theo thiết bị & bài học không
console.log('2. Kiểm tra namespace của _sessionRuleCache...');
const hasSessionCacheScope = appJs.includes('_sessionRuleCacheScope') || appJs.includes('_sessionRuleCacheKey');
console.log(' - Có gắn scope/key (deviceId:lessonId) cho _sessionRuleCache không?:', hasSessionCacheScope ? 'CÓ' : 'CHƯA (LỖI LƯU CACHE)');

// 3. Kiểm tra selectLesson có gọi resetDeviceSession không
console.log('3. Kiểm tra selectLesson()...');
const selectLessonCode = appJs.slice(appJs.indexOf('function selectLesson('), appJs.indexOf('function renderLessonCard('));
const selectLessonCallsReset = selectLessonCode.includes('resetDeviceSession');
console.log(' - selectLesson có gọi resetDeviceSession không?:', selectLessonCallsReset ? 'CÓ' : 'CHƯA (LỖI LƯU CACHE)');

// 4. Kiểm tra openInFrame có dọn dẹp storage cho 3 thiết bị mới không
console.log('4. Kiểm tra openInFrame()...');
const openInFrameCode = appJs.slice(appJs.indexOf('function openInFrame('), appJs.indexOf('function showHero('));
const openInFrameResetsBe12000 = openInFrameCode.includes('BE12000_state');
console.log(' - openInFrame có xóa BE12000_state không?:', openInFrameResetsBe12000 ? 'CÓ' : 'CHƯA (LỖI LƯU CACHE)');
