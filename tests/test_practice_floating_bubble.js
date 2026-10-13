'use strict';

const fs = require('fs');
const path = require('path');
const assert = require('assert');
const vm = require('vm');

const root = path.resolve(__dirname, '..');
const portalHtml = fs.readFileSync(path.join(root, 'portal.html'), 'utf8');
const stylesCss = fs.readFileSync(path.join(root, 'styles.css'), 'utf8');
const appJs = fs.readFileSync(path.join(root, 'app.js'), 'utf8');

console.log('================================================================');
console.log('KIỂM THỬ TÍNH NĂNG: BONG BÓNG ĐỀ BÀI THỰC HÀNH (PRACTICE BUBBLE)');
console.log('================================================================\n');

// ── 1. Kiểm tra cấu trúc DOM trong portal.html ──
console.log('--- 1. Kiểm tra phần tử giao diện trong portal.html ---');
assert.ok(portalHtml.includes('id="practice-bubble-container"'), 'Phải có #practice-bubble-container');
assert.ok(portalHtml.includes('id="practice-bubble-head"'), 'Phải có #practice-bubble-head');
assert.ok(portalHtml.includes('id="practice-bubble-card"'), 'Phải có #practice-bubble-card');
assert.ok(portalHtml.includes('id="practice-bubble-drag-handle"'), 'Phải có #practice-bubble-drag-handle');
assert.ok(portalHtml.includes('id="practice-bubble-lesson-title"'), 'Phải có #practice-bubble-lesson-title');
assert.ok(portalHtml.includes('id="practice-bubble-btn-min"'), 'Phải có #practice-bubble-btn-min');
assert.ok(portalHtml.includes('id="practice-bubble-btn-close"'), 'Phải có #practice-bubble-btn-close');
assert.ok(portalHtml.includes('id="practice-bubble-content"'), 'Phải có #practice-bubble-content');
assert.ok(!portalHtml.includes('class="btn-copy"'), 'Tuyệt đối KHÔNG có nút copy theo yêu cầu');
console.log('✔ Cấu trúc HTML của bong bóng đề bài đầy đủ và chuẩn xác.');

// ── 2. Kiểm tra CSS trong styles.css ──
console.log('\n--- 2. Kiểm tra định dạng CSS trong styles.css ---');
assert.ok(stylesCss.includes('.practice-bubble-container'), 'styles.css phải định nghĩa .practice-bubble-container');
assert.ok(stylesCss.includes('.practice-bubble-head'), 'styles.css phải định nghĩa .practice-bubble-head');
assert.ok(stylesCss.includes('.practice-bubble-card'), 'styles.css phải định nghĩa .practice-bubble-card');
assert.ok(stylesCss.includes('z-index: 99999'), 'z-index phải đủ cao để nổi trên iframe thiết bị');
assert.ok(stylesCss.includes('.bubble-card-body .val'), 'Có định dạng nổi bật cho các thông số .val');
console.log('✔ CSS đáp ứng đầy đủ hiệu ứng nổi, bóng mờ và kéo thả.');

// ── 3. Kiểm tra logic Controller trong app.js ──
console.log('\n--- 3. Kiểm tra logic Controller trong app.js ---');
assert.ok(appJs.includes('function showPracticeBubble'), 'app.js phải có function showPracticeBubble');
assert.ok(appJs.includes('function hidePracticeBubble'), 'app.js phải có function hidePracticeBubble');
assert.ok(appJs.includes('function expandPracticeBubble'), 'app.js phải có function expandPracticeBubble');
assert.ok(appJs.includes('function collapsePracticeBubble'), 'app.js phải có function collapsePracticeBubble');
assert.ok(appJs.includes('function togglePracticeBubble'), 'app.js phải có function togglePracticeBubble');
assert.ok(appJs.includes('function initPracticeBubbleEvents'), 'app.js phải có function initPracticeBubbleEvents');
assert.ok(appJs.includes('showPracticeBubble(lesson)'), 'openInFrame phải kích hoạt showPracticeBubble khi mode là practice');

// ── 4. Mô phỏng chạy tương tác trong sandbox ──
console.log('\n--- 4. Mô phỏng hoạt động render & đóng mở bong bóng ---');
const mockElements = {
  'practice-bubble-container': { style: { display: 'none' }, offsetWidth: 60, offsetHeight: 60, getBoundingClientRect: () => ({ left: 100, top: 100 }) },
  'practice-bubble-head': { style: { display: 'none' }, classList: { remove: () => {}, add: () => {} }, addEventListener: () => {} },
  'practice-bubble-card': { style: { display: 'none' }, addEventListener: () => {} },
  'practice-bubble-lesson-title': { textContent: '' },
  'practice-bubble-content': { innerHTML: '', children: [], appendChild: function(el) { this.children.push(el); } },
  'practice-bubble-btn-min': { addEventListener: () => {} },
  'practice-bubble-btn-close': { addEventListener: () => {} },
  'practice-bubble-drag-handle': { addEventListener: () => {} }
};

// Trích xuất code controller từ app.js
const controllerMatch = appJs.match(/\/\/ ── Practice Requirements Floating Bubble[\s\S]*?\n  function resetDeviceSession/);
assert.ok(controllerMatch, 'Tìm thấy khối controller bong bóng trong app.js');

const sandbox = {
  document: {
    getElementById: (id) => mockElements[id] || null,
    createElement: (tag) => ({ tagName: tag, className: '', innerHTML: '', textContent: '' })
  },
  window: {
    innerWidth: 1920,
    innerHeight: 1080,
    addEventListener: () => {},
    removeEventListener: () => {}
  },
  setTimeout: (fn, ms) => setTimeout(fn, 10),
  clearTimeout: (t) => clearTimeout(t),
  console: console
};

const scriptCode = `
  const practiceBubbleContainer = document.getElementById('practice-bubble-container');
  const practiceBubbleHead = document.getElementById('practice-bubble-head');
  const practiceBubbleCard = document.getElementById('practice-bubble-card');
  const practiceBubbleLessonTitle = document.getElementById('practice-bubble-lesson-title');
  const practiceBubbleContent = document.getElementById('practice-bubble-content');
  const practiceBubbleBtnMin = document.getElementById('practice-bubble-btn-min');
  const practiceBubbleBtnClose = document.getElementById('practice-bubble-btn-close');
  const practiceBubbleDragHandle = document.getElementById('practice-bubble-drag-handle');

  ${controllerMatch[0].replace(/\n  function resetDeviceSession$/, '')}
`;

vm.createContext(sandbox);
vm.runInContext(scriptCode, sandbox);

const sampleLesson = {
  id: 'LAB_TEST_01',
  title: 'Bài 1: Cấu hình PPPoE Internet',
  instructions: [
    '<b>Yêu cầu:</b>',
    '- Username: <span class="val">fpt_hcm_ktv01</span>',
    '- Password: <span class="val">Fpt@2026</span>'
  ]
};

// Test showPracticeBubble (mặc định thu gọn dạng icon tròn Messenger)
sandbox.showPracticeBubble(sampleLesson);
assert.strictEqual(mockElements['practice-bubble-container'].style.display, 'block', 'Container phải hiện');
assert.strictEqual(mockElements['practice-bubble-head'].style.display, 'flex', 'Mặc định hiển thị icon tròn Messenger nhỏ gọn ở góc');
assert.strictEqual(mockElements['practice-bubble-card'].style.display, 'none', 'Mặc định card thu gọn không che khuất màn hình');
assert.strictEqual(mockElements['practice-bubble-lesson-title'].textContent, sampleLesson.title, 'Tiêu đề bài học đúng');
assert.strictEqual(mockElements['practice-bubble-content'].children.length, 3, 'Render đủ 3 dòng yêu cầu đề bài');
console.log('✔ showPracticeBubble nạp đề bài và mặc định thu gọn dạng icon tròn Messenger chuẩn xác.');

// Test expandPracticeBubble (khi KTV bấm vào icon tròn)
sandbox.expandPracticeBubble();
assert.strictEqual(mockElements['practice-bubble-card'].style.display, 'flex', 'Bấm mở card xem đề thành công');
assert.strictEqual(mockElements['practice-bubble-head'].style.display, 'none', 'Icon tròn ẩn khi card đang mở');
console.log('✔ expandPracticeBubble mở rộng card xem chi tiết đề bài thành công.');

// Test collapsePracticeBubble (khi KTV bấm nút thu gọn hoặc đóng)
sandbox.collapsePracticeBubble();
assert.strictEqual(mockElements['practice-bubble-card'].style.display, 'none', 'Card thu gọn thành công');
assert.strictEqual(mockElements['practice-bubble-head'].style.display, 'flex', 'Icon tròn hiển thị ở góc');
console.log('✔ collapsePracticeBubble thu gọn card thành bong bóng tròn thành công.');
console.log('✔ collapsePracticeBubble thu gọn card thành bong bóng tròn thành công.');

// Test togglePracticeBubble
sandbox.togglePracticeBubble();
assert.strictEqual(mockElements['practice-bubble-card'].style.display, 'flex', 'Bấm toggle mở lại card thành công');
sandbox.togglePracticeBubble();
assert.strictEqual(mockElements['practice-bubble-card'].style.display, 'none', 'Bấm toggle thu gọn lại card thành công');
console.log('✔ togglePracticeBubble chuyển đổi qua lại giữa bong bóng và card trơn tru.');

// Test hidePracticeBubble
sandbox.hidePracticeBubble();
assert.strictEqual(mockElements['practice-bubble-container'].style.display, 'none', 'hidePracticeBubble ẩn sạch container');
console.log('✔ hidePracticeBubble ẩn hoàn toàn bong bóng khi rời bài hoặc chuyển sang Hướng dẫn.');

console.log('\n================================================================');
console.log('TẤT CẢ KIỂM THỬ BONG BÓNG ĐỀ BÀI THỰC HÀNH ĐỀU ĐẠT 100%!');
console.log('================================================================');
