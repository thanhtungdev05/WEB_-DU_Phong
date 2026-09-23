'use strict';

const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');

const portalApp = fs.readFileSync(path.resolve(__dirname, '..', 'app.js'), 'utf8');

// Chế độ Thực hành: nút "Nộp bài & Chấm điểm" phải luôn khả dụng để học viên
// có thể nộp bài kể cả khi cấu hình sai và nhận kết quả "CHƯA ĐẠT" kèm danh sách lỗi.
// Nút "Xem lỗi sai" không được tự động tiết lộ lỗi trước khi nộp bài ở chế độ Thực hành.

// 1. Helper xác định thiết bị/bài học không cần cấu hình phải tồn tại.
assert.match(portalApp, /function isNoConfigDevice\(\)/);

// 2. Khi mở màn hình thực hành: nút Nộp bài sáng nếu đang ở chế độ practice hoặc thiết bị không cần cấu hình.
assert.match(
  portalApp,
  /if \(currentMode === 'practice' \|\| noConfigInit\)\s*\{\s*btnSubmitLab\.disabled = false/s,
);

// 3. Vòng lặp đồng bộ màn hình hướng dẫn/thực hành phải tách riêng chế độ practice.
assert.match(
  portalApp,
  /if \(currentMode === 'practice'\)\s*\{\s*\/\/ ⚡ CHẾ ĐỘ THỰC HÀNH:[\s\S]*?btnSubmitLab\.disabled = false;[\s\S]*?submitBtnPulse/s,
);
assert.match(
  portalApp,
  /Nút "Nộp bài & Chấm điểm" LUÔN KHẢ DỤNG để học viên nộp bài bất kỳ lúc nào/,
);

// 4. Hook onSimulatorSave phải tách riêng chế độ practice (nộp bài luôn sáng).
assert.match(
  portalApp,
  /if \(currentMode === 'practice'\)\s*\{\s*\/\/ ⚡ Chế độ Thực hành: Nút lỗi sai LUÔN ẨN, Nút Nộp bài LUÔN SÁNG/,
);

// 5. Không còn logic cũ gộp chung: trước đây nút nộp bài chỉ sáng khi bấm Save VÀ đạt yêu cầu,
// khiến chế độ Thực hành bị khóa nộp bài cho tới khi làm đúng.
assert.doesNotMatch(
  portalApp,
  /\/\/ BẮT BUỘC ĐÃ BẤM SAVE\/APPLY: nếu chưa bấm Save\/Apply thì KHÔNG BAO GIỜ sáng nút nộp bài/,
);

// 6. Guide mode vẫn giữ hành vi cũ: chỉ sáng khi bấm Save/Apply và đạt.
assert.match(
  portalApp,
  /if \(noConfig \|\| \(window\._hasClickedSaveInGuide && \(hasSuccHint \|\| \(evalResult && evalResult\.passed\)\)\)\)/,
);
assert.match(
  portalApp,
  /if \(noConfigSaved \|\| window\._hasSuccHintStored \|\| \(evalResult && evalResult\.passed\)\)/,
);

console.log('Practice submit-button contract passed.');
