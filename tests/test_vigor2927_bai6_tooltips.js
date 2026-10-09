'use strict';

const assert = require('assert');
const fs = require('fs');
const path = require('path');
const vm = require('vm');

console.log('================================================================');
console.log('KIỂM THỬ TOOLTIP BÀI 6 DRAYTEK VIGOR 2927: 15 BƯỚC TUẦN TỰ');
console.log('================================================================\n');

const root = path.resolve(__dirname, '..');

// 1. Kiểm tra load tooltips/bai6.js
const bai6TooltipsCode = fs.readFileSync(path.join(root, 'devices/vigor2927/tooltips/bai6.js'), 'utf8');
const sandboxBai6 = { window: {} };
vm.runInNewContext(bai6TooltipsCode, sandboxBai6);

const tooltips = sandboxBai6.window.TOOLTIPS_VIGOR2927['vg2927-bai6'];
assert.ok(Array.isArray(tooltips), 'TOOLTIPS_VIGOR2927[vg2927-bai6] phải là một mảng');
assert.strictEqual(tooltips.length, 15, 'Bài 6 phải có đúng 15 bước tooltip chi tiết');

console.log('--- 1. Kiểm tra tiêu đề và thuộc tính trang của 15 bước ---');
assert.strictEqual(tooltips[0].text, 'Bước 1: chọn WAN');
assert.strictEqual(tooltips[0].hideOnPage, 'mwangen1|mwangen|wan.cgi');

assert.strictEqual(tooltips[1].text, 'Bước 2: chọn General Setup');
assert.strictEqual(tooltips[1].hideOnPage, 'mwangen1|mwangen|wan.cgi');

assert.strictEqual(tooltips[2].text, 'Bước 3: chọn Session Based');
assert.strictEqual(tooltips[2].page, 'mwangen1');

assert.strictEqual(tooltips[3].text, 'Bước 4: chọn According to Line Speed');
assert.strictEqual(tooltips[3].page, 'mwangen1');

assert.strictEqual(tooltips[4].text, 'Bước 5: chọn OK để lưu cấu hình, sau đó cấu hình tiếp WAN1 và WAN2.');
assert.strictEqual(tooltips[4].page, 'mwangen1');

assert.strictEqual(tooltips[5].text, 'Bước 6: chọn WAN1');
assert.strictEqual(tooltips[5].page, 'mwangen1');
assert.strictEqual(tooltips[5].selector, 'a[href*="gotoWanSet(1)"]');

assert.strictEqual(tooltips[6].text, 'Bước 7: nhập ISP-1');
assert.strictEqual(tooltips[6].page, 'mwangen.htm');

assert.strictEqual(tooltips[7].text, 'Bước 8: nhập 80 Mbps');
assert.strictEqual(tooltips[7].page, 'mwangen.htm');

assert.strictEqual(tooltips[8].text, 'Bước 9: nhập 80 Mbps');
assert.strictEqual(tooltips[8].page, 'mwangen.htm');

assert.strictEqual(tooltips[9].text, 'Bước 10: chọn OK');
assert.strictEqual(tooltips[9].page, 'mwangen.htm');

assert.strictEqual(tooltips[10].text, 'Bước 11: chọn WAN2');
assert.strictEqual(tooltips[10].page, 'mwangen1');
assert.strictEqual(tooltips[10].selector, 'a[href*="gotoWanSet(2)"]');

assert.strictEqual(tooltips[11].text, 'Bước 12: nhập ISP-2');
assert.strictEqual(tooltips[11].page, 'wan.cgi');

assert.strictEqual(tooltips[12].text, 'Bước 13: nhập 80 Mbps');
assert.strictEqual(tooltips[12].page, 'wan.cgi');

assert.strictEqual(tooltips[13].text, 'Bước 14: nhập 80 Mbps');
assert.strictEqual(tooltips[13].page, 'wan.cgi');

assert.strictEqual(tooltips[14].text, 'Bước 15: chọn OK');
assert.strictEqual(tooltips[14].page, 'wan.cgi');

console.log('✔ Toàn bộ 15 bước có selector và nội dung chính xác 100%.\n');

console.log('--- 2. Kiểm tra tính tuần tự không đè nhau trên trang General Setup (mwangen1.htm) ---');

function createMockDocOverview(basedVal, modeVal, isSaved, store) {
  const topWin = {
    _FTC_VG2927_BAI6: store || { overview: isSaved ? { lbMode: '0', lbBased: '1' } : null }
  };
  return {
    _ftcIsSaved: !!isSaved,
    defaultView: { _ftcIsSaved: !!isSaved, top: topWin },
    parentWindow: { _ftcIsSaved: !!isSaved, top: topWin },
    querySelector: function (sel) {
      if (sel === 'select[name="iBwLBBased"]') return { value: basedVal };
      if (sel === 'select[name="iBwLBMode"]') return { value: modeVal };
      return null;
    }
  };
}

// Trạng thái 1: Chưa chọn gì (mặc định IP Based = '0', Auto Detect = '1')
const docB3 = createMockDocOverview('0', '1', false);
assert.strictEqual(tooltips[2].condition(docB3), true, 'B3 phải hiện khi chưa chọn Session Based');
assert.strictEqual(tooltips[3].condition(docB3), false, 'B4 phải ẩn khi chưa chọn Session Based');
assert.strictEqual(tooltips[4].condition(docB3), false, 'B5 phải ẩn khi chưa hoàn thành B3 và B4');
assert.strictEqual(tooltips[5].condition(docB3), false, 'B6 (WAN1) phải ẩn khi chưa lưu General Setup');
console.log('✔ Trạng thái 1 (mặc định): Chỉ hiện Bước 3 (chọn Session Based), Bước 4, 5 & 6 ẩn.');

// Trạng thái 2: Đã chọn Session Based = '1', nhưng vẫn đang ở Auto Detect = '1'
const docB4 = createMockDocOverview('1', '1', false);
assert.strictEqual(tooltips[2].condition(docB4), false, 'B3 phải ẩn khi đã chọn Session Based');
assert.strictEqual(tooltips[3].condition(docB4), true, 'B4 phải hiện khi đã chọn Session Based nhưng chưa chọn Line Speed');
assert.strictEqual(tooltips[4].condition(docB4), false, 'B5 (nút OK) KHÔNG ĐƯỢC HIỆN khi đang ở Auto Detect!');
console.log('✔ Trạng thái 2 (đang ở Auto Detect): Hiện Bước 4 (chọn Line Speed). Nút OK (Bước 5) KHÔNG sáng sớm!');

// Trạng thái 3: Đã chọn Session Based = '1' và According to Line Speed = '0'
const docB5 = createMockDocOverview('1', '0', false);
assert.strictEqual(tooltips[2].condition(docB5), false, 'B3 phải ẩn');
assert.strictEqual(tooltips[3].condition(docB5), false, 'B4 phải ẩn');
assert.strictEqual(tooltips[4].condition(docB5), true, 'B5 (nút OK) phải hiện khi đã chọn đúng cả 2 tiêu chí');
assert.strictEqual(tooltips[5].condition(docB5), false, 'B6 (WAN1) chưa được hiện khi B5 chưa lưu');
console.log('✔ Trạng thái 3 (chọn đúng cả Session Based và According to Line Speed): Bước 5 (OK) sáng lên!');

// Trạng thái 4: Đã bấm OK lưu cấu hình General Setup -> Bước 6 (WAN1) sáng lên!
const docSavedOverview = createMockDocOverview('1', '0', true);
assert.strictEqual(tooltips[4].condition(docSavedOverview), false, 'B5 phải ẩn khi đã bấm OK lưu');
assert.strictEqual(tooltips[5].condition(docSavedOverview), true, 'B6 (chọn WAN1) PHẢI SÁNG LÊN sau khi bấm OK lưu Bước 5!');
assert.strictEqual(tooltips[10].condition(docSavedOverview), false, 'B11 (WAN2) chưa sáng khi WAN1 chưa cấu hình');
console.log('✔ Trạng thái 4 (sau khi bấm OK General Setup): Bước 5 ẩn đi, Bước 6 (chọn WAN1) sáng đèn dẫn đường!\n');

console.log('--- 3. Kiểm tra tính tuần tự trên trang WAN1 (mwangen.htm) ---');

function createMockDocWan(disName, inRate, inUnit, outRate, outUnit, isSaved) {
  return {
    _ftcIsSaved: !!isSaved,
    querySelector: function (sel) {
      if (sel === 'input[name="sBwWanDisName"]') return { value: disName };
      if (sel === 'input[name="uilBwLBInRate"]') return { value: inRate };
      if (sel === 'select[name="uilBwLBInRateUnit"]') return { value: inUnit };
      if (sel === 'input[name="uilBwLBOutRate"]') return { value: outRate };
      if (sel === 'select[name="uilBwLBOutRateUnit"]') return { value: outUnit };
      return null;
    }
  };
}

// B7 -> B8 -> B9 -> B10
const docWan1_0 = createMockDocWan('', '', '1', '', '1', false);
assert.strictEqual(tooltips[6].condition(docWan1_0), true, 'B7 phải hiện khi chưa nhập Display Name');
assert.strictEqual(tooltips[7].condition(docWan1_0), false, 'B8 phải ẩn');
assert.strictEqual(tooltips[8].condition(docWan1_0), false, 'B9 phải ẩn');
assert.strictEqual(tooltips[9].condition(docWan1_0), false, 'B10 phải ẩn');

const docWan1_1 = createMockDocWan('ISP-1', '', '1', '', '1', false);
assert.strictEqual(tooltips[6].condition(docWan1_1), false, 'B7 ẩn');
assert.strictEqual(tooltips[7].condition(docWan1_1), true, 'B8 hiện');
assert.strictEqual(tooltips[8].condition(docWan1_1), false, 'B9 ẩn');
assert.strictEqual(tooltips[9].condition(docWan1_1), false, 'B10 ẩn');

const docWan1_2 = createMockDocWan('ISP-1', '80', '1', '', '1', false);
assert.strictEqual(tooltips[7].condition(docWan1_2), false, 'B8 ẩn');
assert.strictEqual(tooltips[8].condition(docWan1_2), true, 'B9 hiện');
assert.strictEqual(tooltips[9].condition(docWan1_2), false, 'B10 ẩn');

const docWan1_3 = createMockDocWan('ISP-1', '80', '1', '80', '1', false);
assert.strictEqual(tooltips[8].condition(docWan1_3), false, 'B9 ẩn');
assert.strictEqual(tooltips[9].condition(docWan1_3), true, 'B10 (nút OK) hiện');

const docWan1_saved = createMockDocWan('ISP-1', '80', '1', '80', '1', true);
assert.strictEqual(tooltips[9].condition(docWan1_saved), false, 'B10 ẩn khi đã lưu');
console.log('✔ Tuần tự WAN1: B7 (ISP-1) -> B8 (80 Mbps In) -> B9 (80 Mbps Out) -> B10 (OK) -> Ẩn.\n');

console.log('--- 4. Kiểm tra khi quay lại trang General Setup sau khi lưu WAN1 ---');
const storeSauWan1 = {
  overview: { lbMode: '0', lbBased: '1' },
  wan1: { displayName: 'ISP-1' },
  wan2: null
};
const docQuayLaiMwangen1 = createMockDocOverview('1', '0', true, storeSauWan1);
assert.strictEqual(tooltips[5].condition(docQuayLaiMwangen1), false, 'B6 (WAN1) đã làm xong nên phải ẩn');
assert.strictEqual(tooltips[10].condition(docQuayLaiMwangen1), true, 'B11 (chọn WAN2) PHẢI SÁNG LÊN để hướng dẫn vào WAN2!');
console.log('✔ Khi quay lại General Setup: Bước 6 (WAN1) ẩn, Bước 11 (chọn WAN2) sáng đèn dẫn đường!\n');

console.log('--- 5. Kiểm tra tính tuần tự trên trang WAN2 (wan.cgi) ---');
const docWan2_0 = createMockDocWan('', '', '1', '', '1', false);
assert.strictEqual(tooltips[11].condition(docWan2_0), true, 'B12 hiện');
assert.strictEqual(tooltips[12].condition(docWan2_0), false, 'B13 ẩn');

const docWan2_3 = createMockDocWan('ISP-2', '80', '1', '80', '1', false);
assert.strictEqual(tooltips[14].condition(docWan2_3), true, 'B15 (OK) hiện');

const docWan2_saved = createMockDocWan('ISP-2', '80', '1', '80', '1', true);
assert.strictEqual(tooltips[14].condition(docWan2_saved), false, 'B15 ẩn khi đã lưu');
console.log('✔ Tuần tự WAN2: B12 (ISP-2) -> B13 (80 Mbps In) -> B14 (80 Mbps Out) -> B15 (OK) -> Ẩn.\n');

console.log('--- 6. Kiểm tra đồng bộ giữa các file (tooltips/bai6.js, tooltips.js, lessons/bai6.js) ---');
const allTooltipsCode = fs.readFileSync(path.join(root, 'devices/vigor2927/tooltips.js'), 'utf8');
const sandboxAll = { window: {} };
vm.runInNewContext(allTooltipsCode, sandboxAll);
const tooltipsAll = sandboxAll.window.TOOLTIPS_VIGOR2927['vg2927-bai6'];
assert.strictEqual(tooltipsAll.length, 15, 'tooltips.js phải có đủ 15 bước');

const lessonCode = fs.readFileSync(path.join(root, 'devices/vigor2927/lessons/bai6.js'), 'utf8');
const sandboxLesson = { window: {} };
vm.runInNewContext(lessonCode, sandboxLesson);
const lesson = sandboxLesson.window.DEVICE_VIGOR2927_LESSONS.find(l => l.id === 'vg2927-bai6');
assert.ok(lesson, 'Phải tìm thấy bài học vg2927-bai6');
assert.strictEqual(lesson.guidePopups.length, 15, 'guidePopups trong bài 6 phải có 15 bước');

for (let i = 0; i < 15; i++) {
  assert.strictEqual(tooltipsAll[i].text, tooltips[i].text, `tooltips.js bước ${i + 1} phải khớp`);
  assert.strictEqual(lesson.guidePopups[i].text, tooltips[i].text, `lessons/bai6.js bước ${i + 1} phải khớp`);
}
console.log('✔ Đồng bộ 100% giữa tooltips/bai6.js, tooltips.js, và lessons/bai6.js.\n');

console.log('================================================================');
console.log('TẤT CẢ CÁC BÀI KIỂM THỬ TOOLTIP BÀI 6 (15 BƯỚC) ĐÃ ĐẠT 100% THÀNH CÔNG!');
console.log('================================================================');
