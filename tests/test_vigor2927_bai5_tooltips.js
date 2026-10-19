'use strict';

const assert = require('assert');
const fs = require('fs');
const path = require('path');
const vm = require('vm');

console.log('================================================================');
console.log('KIỂM THỬ TOOLTIP BÀI 5 DRAYTEK VIGOR 2927: 6 BƯỚC CHI TIẾT');
console.log('================================================================\n');

const root = path.resolve(__dirname, '..');

// 1. Kiểm tra load tooltips/bai5.js
const bai5Code = fs.readFileSync(path.join(root, 'devices/vigor2927/tooltips/bai5.js'), 'utf8');
const sandboxBai5 = { window: {} };
vm.runInNewContext(bai5Code, sandboxBai5);

const tooltips = sandboxBai5.window.TOOLTIPS_VIGOR2927['vg2927-bai5'];
assert.ok(Array.isArray(tooltips), 'TOOLTIPS_VIGOR2927[vg2927-bai5] phải là một mảng');
assert.strictEqual(tooltips.length, 6, 'Bài 5 phải có đúng 6 bước tooltip chi tiết');

console.log('--- 1. Kiểm tra tiêu đề và selector của 6 bước ---');
assert.strictEqual(tooltips[0].text, 'Bước 1: chọn LAN');
assert.ok(tooltips[0].hideOnPage.includes('sht'), 'Bước 1 phải hideOnPage sht');

assert.strictEqual(tooltips[1].text, 'Bước 2: chọn General Setup');
assert.ok(tooltips[1].hideOnPage.includes('sht'), 'Bước 2 phải hideOnPage sht');

assert.strictEqual(tooltips[2].text, 'Bước 3: chọn Details Page');
assert.ok(tooltips[2].selector.includes('btnDtPage0'), 'Bước 3 phải trỏ vào btnDtPage0');
assert.ok(tooltips[2].hideOnPage.includes('sht'), 'Bước 3 phải hideOnPage sht');

assert.strictEqual(tooltips[3].text, 'Bước 4: điền Primary IP Address: 210.245.31.220');
assert.ok(tooltips[3].selector.includes('sDNSPri'), 'Bước 4 phải trỏ vào input sDNSPri');

assert.strictEqual(tooltips[4].text, 'Bước 5: điền Secondary IP Address: 8.8.8.8');
assert.ok(tooltips[4].selector.includes('sDNSSnd'), 'Bước 5 phải trỏ vào input sDNSSnd');

assert.strictEqual(tooltips[5].text, 'Bước 6: chọn OK để lưu cấu hình');
assert.ok(tooltips[5].selector.includes('btnOK'), 'Bước 6 phải trỏ vào nút btnOK');

console.log('✔ Toàn bộ 6 bước có selector và nội dung chính xác 100%.\n');

console.log('--- 2. Kiểm tra tính tuần tự không đè nhau của điều kiện condition ---');

function createMockDoc(dnsPri, dnsSnd, isSaved) {
  return {
    _ftcIsSaved: !!isSaved,
    querySelector: function (sel) {
      if (sel === 'input[name="sDNSPri"]') return { value: dnsPri };
      if (sel === 'input[name="sDNSSnd"]') return { value: dnsSnd };
      return null;
    }
  };
}

// Trạng thái 1: Chưa nhập gì
const docInitial = createMockDoc('', '', false);
assert.strictEqual(tooltips[3].condition(docInitial), true, 'B4 phải hiện khi chưa nhập Primary IP');
assert.strictEqual(tooltips[4].condition(docInitial), false, 'B5 phải ẩn khi chưa nhập Primary IP');
assert.strictEqual(tooltips[5].condition(docInitial), false, 'B6 phải ẩn khi chưa nhập đủ thông tin');
console.log('✔ Trạng thái ban đầu: chỉ hiện Bước 4 (điền Primary IP).');

// Trạng thái 2: Đã nhập Primary IP, chưa nhập Secondary IP
const docPriDone = createMockDoc('210.245.31.220', '', false);
assert.strictEqual(tooltips[3].condition(docPriDone), false, 'B4 phải ẩn sau khi nhập đúng Primary IP');
assert.strictEqual(tooltips[4].condition(docPriDone), true, 'B5 phải hiện sau khi nhập đúng Primary IP');
assert.strictEqual(tooltips[5].condition(docPriDone), false, 'B6 phải ẩn khi chưa nhập Secondary IP');
console.log('✔ Sau khi nhập Primary IP: tự động chuyển sang Bước 5 (điền Secondary IP).');

// Trạng thái 3: Đã nhập cả Primary IP và Secondary IP, chưa bấm OK
const docBothDone = createMockDoc('210.245.31.220', '8.8.8.8', false);
assert.strictEqual(tooltips[3].condition(docBothDone), false, 'B4 phải ẩn khi đã nhập đủ');
assert.strictEqual(tooltips[4].condition(docBothDone), false, 'B5 phải ẩn khi đã nhập đủ');
assert.strictEqual(tooltips[5].condition(docBothDone), true, 'B6 phải hiện sau khi đã điền xong cả 2 DNS');
console.log('✔ Sau khi nhập cả 2 DNS: tự động chuyển sang Bước 6 (bấm OK).');

// Trạng thái 4: Đã bấm OK lưu cấu hình
const docSaved = createMockDoc('210.245.31.220', '8.8.8.8', true);
assert.strictEqual(tooltips[3].condition(docSaved), false, 'B4 phải ẩn khi đã lưu');
assert.strictEqual(tooltips[4].condition(docSaved), false, 'B5 phải ẩn khi đã lưu');
assert.strictEqual(tooltips[5].condition(docSaved), false, 'B6 phải ẩn khi đã lưu');
console.log('✔ Sau khi bấm OK: tất cả tooltip hoàn tất và ẩn đi.\n');

console.log('--- 3. Kiểm tra tính đồng bộ với tooltips.js và lessons/bai5.js ---');

// Kiểm tra tooltips.js
const tooltipsAllCode = fs.readFileSync(path.join(root, 'devices/vigor2927/tooltips.js'), 'utf8');
const sandboxTooltips = { window: {} };
vm.runInNewContext(tooltipsAllCode, sandboxTooltips);
const tooltipsMerged = sandboxTooltips.window.TOOLTIPS_VIGOR2927['vg2927-bai5'];
assert.ok(Array.isArray(tooltipsMerged), 'tooltips.js phải có vg2927-bai5');
assert.strictEqual(tooltipsMerged.length, 6, 'tooltips.js phải có đúng 6 bước');
for (let i = 0; i < 6; i++) {
  assert.strictEqual(tooltipsMerged[i].text, tooltips[i].text, `Bước ${i + 1} text phải đồng bộ hoàn toàn`);
}
console.log('✔ Đồng bộ 100% với devices/vigor2927/tooltips.js.');

// Kiểm tra lessons/bai5.js
const lessonCode = fs.readFileSync(path.join(root, 'devices/vigor2927/lessons/bai5.js'), 'utf8');
const sandboxLesson = { window: { TOOLTIPS_VIGOR2927: sandboxTooltips.window.TOOLTIPS_VIGOR2927 } };
vm.runInNewContext(lessonCode, sandboxLesson);
const lesson = sandboxLesson.window.DEVICE_VIGOR2927_LESSONS.find(l => l.id === 'vg2927-bai5');
assert.ok(lesson, 'Phải tìm thấy bài học vg2927-bai5');
assert.strictEqual(lesson.guidePopups.length, 6, 'lesson.guidePopups phải có đúng 6 bước');
// 4. Kiểm tra logic auto-scroll và click hook nút OK
console.log('--- 4. Kiểm tra auto-scroll và click hook nút OK ---');
let scrolled = false;
let clickHandler = null;
const mockBtn = {
  scrollIntoView: function() { scrolled = true; },
  addEventListener: function(event, handler) {
    if (event === 'click') clickHandler = handler;
  }
};
const docForScroll = {
  _ftcIsSaved: false,
  querySelector: function(sel) {
    if (sel === 'input[name="sDNSPri"]') return { value: '210.245.31.220', addEventListener: function() {} };
    if (sel === 'input[name="sDNSSnd"]') return { value: '8.8.8.8', addEventListener: function() {} };
    if (sel.includes('btnOK')) return mockBtn;
    return null;
  }
};
assert.strictEqual(tooltips[5].condition(docForScroll), true, 'B6 phải trả về true khi đã điền đúng 2 DNS');
assert.strictEqual(scrolled, true, 'B6 phải tự động gọi scrollIntoView tới nút OK');
assert.ok(typeof clickHandler === 'function', 'B6 phải gắn click handler cho nút OK');
clickHandler();
assert.strictEqual(docForScroll._ftcIsSaved, true, 'Click nút OK phải đánh dấu _ftcIsSaved');
console.log('✔ Tự động cuộn tới nút OK và hook lưu cấu hình hoạt động chính xác.\n');

console.log('================================================================');
console.log('TẤT CẢ KIỂM THỬ TOOLTIP BÀI 5 ĐÃ VƯỢT QUA XUẤT SẮC (PASSED 100%)');
console.log('================================================================');
