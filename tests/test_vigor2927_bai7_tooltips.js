'use strict';

const assert = require('assert');
const fs = require('fs');
const path = require('path');
const vm = require('vm');

console.log('================================================================');
console.log('KIỂM THỬ TOOLTIP BÀI 7 DRAYTEK VIGOR 2927: 15 BƯỚC TUẦN TỰ KHỚP ẢNH HƯỚNG DẪN');
console.log('================================================================\n');

const root = path.resolve(__dirname, '..');

// 1. Kiểm tra load tooltips/bai7.js
const bai7TooltipsCode = fs.readFileSync(path.join(root, 'devices/vigor2927/tooltips/bai7.js'), 'utf8');
const sandboxBai7 = { window: {} };
vm.runInNewContext(bai7TooltipsCode, sandboxBai7);

const tooltips = sandboxBai7.window.TOOLTIPS_VIGOR2927['vg2927-bai7'];
assert.ok(Array.isArray(tooltips), 'TOOLTIPS_VIGOR2927[vg2927-bai7] phải là một mảng');
assert.strictEqual(tooltips.length, 15, 'Bài 7 phải có đúng 15 bước tooltip chi tiết khớp sơ đồ hướng dẫn');

console.log('--- 1. Kiểm tra tiêu đề và thuộc tính trang của 15 bước ---');
assert.strictEqual(tooltips[0].text, 'Bước 1: chọn Routing');
assert.strictEqual(tooltips[0].hideOnPage, 'policyrt1|v2x00.cgi');

assert.strictEqual(tooltips[1].text, 'Bước 2: chọn Load-Balance/Route Policy');
assert.strictEqual(tooltips[1].hideOnPage, 'policyrt1|v2x00.cgi');

assert.strictEqual(tooltips[2].text, 'Bước 3: chọn 1');
assert.strictEqual(tooltips[2].page, 'policyrt1');

assert.strictEqual(tooltips[3].text, 'Bước 4: check vào Enable');
assert.strictEqual(tooltips[3].page, 'v2x00.cgi');
assert.strictEqual(typeof tooltips[3].condition, 'function');
assert.ok(tooltips[3].selector.includes('lbl-route-enable') || tooltips[3].selector.includes('text:Enable'), 'Bước 4 selector phải trỏ vào chữ Enable thay vì chỉ trỏ vào checkbox');

assert.strictEqual(tooltips[4].text, 'Bước 5: nhập Ưu tiên Wan 1');
assert.strictEqual(tooltips[4].page, 'v2x00.cgi');
assert.strictEqual(typeof tooltips[4].condition, 'function');

assert.strictEqual(tooltips[5].text, 'Bước 6: chọn IP Range');
assert.strictEqual(tooltips[5].page, 'v2x00.cgi');
assert.strictEqual(typeof tooltips[5].condition, 'function');

assert.strictEqual(tooltips[6].text, 'Bước 7: nhập 192.168.1.100');
assert.strictEqual(tooltips[6].page, 'v2x00.cgi');
assert.strictEqual(typeof tooltips[6].condition, 'function');

assert.strictEqual(tooltips[7].text, 'Bước 8: nhập 192.168.1.110');
assert.strictEqual(tooltips[7].page, 'v2x00.cgi');
assert.strictEqual(typeof tooltips[7].condition, 'function');

assert.strictEqual(tooltips[8].text, 'Bước 9: Interface chính chọn WAN1');
assert.strictEqual(tooltips[8].page, 'v2x00.cgi');
assert.strictEqual(typeof tooltips[8].condition, 'function');

assert.strictEqual(tooltips[9].text, 'Bước 10: check vào Failover to');
assert.strictEqual(tooltips[9].page, 'v2x00.cgi');
assert.strictEqual(typeof tooltips[9].condition, 'function');
assert.ok(tooltips[9].selector.includes('lbl-route-failover') || tooltips[9].selector.includes('text:Failover to'), 'Bước 10 selector phải trỏ vào chữ Failover to');

assert.strictEqual(tooltips[10].text, 'Bước 11: chọn WAN2');
assert.strictEqual(tooltips[10].page, 'v2x00.cgi');
assert.strictEqual(typeof tooltips[10].condition, 'function');

assert.strictEqual(tooltips[11].text, 'Bước 12: click vào + Priority');
assert.strictEqual(tooltips[11].page, 'v2x00.cgi');
assert.strictEqual(typeof tooltips[11].condition, 'function');
assert.ok(tooltips[11].selector.includes('lbl-route-priority') || tooltips[11].selector.includes('Priority'), 'Bước 12 selector phải trỏ vào chữ Priority');

assert.strictEqual(tooltips[12].text, 'Bước 13: kéo hoặc nhập số 1');
assert.strictEqual(tooltips[12].page, 'v2x00.cgi');
assert.strictEqual(typeof tooltips[12].condition, 'function');

assert.strictEqual(tooltips[13].text, 'Bước 14: check vào Failback');
assert.strictEqual(tooltips[13].page, 'v2x00.cgi');
assert.strictEqual(typeof tooltips[13].condition, 'function');

assert.strictEqual(tooltips[14].text, 'Bước 15: chọn OK để lưu cấu hình');
assert.strictEqual(tooltips[14].page, 'v2x00.cgi');
assert.strictEqual(typeof tooltips[14].condition, 'function');

console.log('✔ Cấu trúc 15 bước đã chính xác 100% theo ảnh hướng dẫn.\n');

console.log('--- 2. Kiểm tra tính tuần tự của các condition trên trang chi tiết v2x00.cgi ---');

function createMockDoc(state) {
  const elements = {
    'input[name="iPREnable"]': { checked: !!state.enable, addEventListener: function() {} },
    'input[name="comment"]': { value: state.comment || '', addEventListener: function() {} },
    'select[name="rdSIpAny"]': {
      value: state.srcModeVal || '0',
      selectedIndex: 0,
      options: [{ text: state.srcModeText || 'Any' }],
      addEventListener: function() {}
    },
    'input[name="sPRSIpStart"]': { value: state.srcStart || '', addEventListener: function() {} },
    'input[name="iPRSIpCount"]': { value: state.srcEnd || '', addEventListener: function() {} },
    'select[name="multiwanWanIf"]': {
      value: state.wanIfVal || '3',
      selectedIndex: 0,
      options: [{ text: state.wanIfText || 'WAN1' }],
      addEventListener: function() {}
    },
    'input[name="iPRFailover"]': { checked: !!state.failover, addEventListener: function() {} },
    'select[name="failoverwan"]': {
      value: state.failoverWanVal || '501',
      selectedIndex: 0,
      options: [{ text: state.failoverWanText || 'Default WAN' }],
      addEventListener: function() {}
    },
    '#image_option': { src: state.priorityOpen ? '/images/open.png' : '/images/close.png', addEventListener: function() {} },
    'tr.option_detail': { style: { display: state.priorityOpen ? '' : 'none' } },
    'input[name="sPriority"]': { value: state.priorityVal !== undefined ? state.priorityVal : '', addEventListener: function() {} },
    'input[name="iPRFailback"]': { checked: !!state.failback, addEventListener: function() {} },
    'input[name="btnOk"]': { addEventListener: function() {} },
    'input[value="OK"]': { addEventListener: function() {} }
  };

  const doc = {
    _ftcBai7Hooked: true,
    _ftcWanIfConfirmed: !!state.wanIfConfirmed,
    _ftcPriorityOpened: !!state.priorityOpen,
    _ftcIsSaved: !!state.isSaved,
    querySelector: function(sel) {
      if (elements[sel]) return elements[sel];
      if (sel.includes('#image_option')) return elements['#image_option'];
      if (sel.includes('input[name="btnOk"]') || sel.includes('input[value="OK"]')) return elements['input[name="btnOk"]'];
      if (sel.includes('sPriority')) return elements['input[name="sPriority"]'];
      return null;
    },
    getElementById: function(id) {
      if (id === 'image_option') return elements['#image_option'];
      return null;
    }
  };
  doc.defaultView = { _ftcIsSaved: !!state.isSaved, MoreOpen: state.priorityOpen ? 1 : 0 };
  return doc;
}

// Trạng thái 0: Ban đầu vào trang -> Chỉ Bước 4 (Enable) hiển thị
let state = {};
let doc = createMockDoc(state);
assert.strictEqual(tooltips[3].condition(doc), true, 'B4 (Enable) phải hiển thị');
assert.strictEqual(tooltips[4].condition(doc), false, 'B5 phải ẩn');
assert.strictEqual(tooltips[5].condition(doc), false, 'B6 phải ẩn');
assert.strictEqual(tooltips[6].condition(doc), false, 'B7 phải ẩn');
assert.strictEqual(tooltips[7].condition(doc), false, 'B8 phải ẩn');
assert.strictEqual(tooltips[8].condition(doc), false, 'B9 phải ẩn');
assert.strictEqual(tooltips[9].condition(doc), false, 'B10 phải ẩn');
assert.strictEqual(tooltips[10].condition(doc), false, 'B11 phải ẩn');
assert.strictEqual(tooltips[11].condition(doc), false, 'B12 phải ẩn');
assert.strictEqual(tooltips[12].condition(doc), false, 'B13 phải ẩn');
assert.strictEqual(tooltips[13].condition(doc), false, 'B14 phải ẩn');
assert.strictEqual(tooltips[14].condition(doc), false, 'B15 phải ẩn');
console.log('✔ Trạng thái 0: Ban đầu chỉ Bước 4 (Enable) hiển thị, không bị đè nhau.');

// Trạng thái 1: Đã tick Enable -> Chỉ Bước 5 hiển thị
state.enable = true;
doc = createMockDoc(state);
assert.strictEqual(tooltips[3].condition(doc), false, 'B4 phải ẩn khi đã tick');
assert.strictEqual(tooltips[4].condition(doc), true, 'B5 (Comment) phải hiển thị');
assert.strictEqual(tooltips[5].condition(doc), false, 'B6 phải ẩn');

// Trạng thái 2: Đã nhập Comment "Ưu tiên Wan 1" -> Chỉ Bước 6 hiển thị
state.comment = 'Ưu tiên Wan 1';
doc = createMockDoc(state);
assert.strictEqual(tooltips[4].condition(doc), false, 'B5 phải ẩn khi đã nhập comment');
assert.strictEqual(tooltips[5].condition(doc), true, 'B6 (IP Range) phải hiển thị');
assert.strictEqual(tooltips[6].condition(doc), false, 'B7 phải ẩn');

// Trạng thái 3: Đã chọn IP Range -> Chỉ Bước 7 hiển thị
state.srcModeVal = '1';
state.srcModeText = 'IP Range';
doc = createMockDoc(state);
assert.strictEqual(tooltips[5].condition(doc), false, 'B6 phải ẩn');
assert.strictEqual(tooltips[6].condition(doc), true, 'B7 (Start IP) phải hiển thị');
assert.strictEqual(tooltips[7].condition(doc), false, 'B8 phải ẩn');

// Trạng thái 4: Đã nhập Start 192.168.1.100 -> Chỉ Bước 8 hiển thị
state.srcStart = '192.168.1.100';
doc = createMockDoc(state);
assert.strictEqual(tooltips[6].condition(doc), false, 'B7 phải ẩn');
assert.strictEqual(tooltips[7].condition(doc), true, 'B8 (End IP) phải hiển thị');
assert.strictEqual(tooltips[8].condition(doc), false, 'B9 phải ẩn');

// Trạng thái 5: Đã nhập End 192.168.1.110 -> Chỉ Bước 9 (WAN1) hiển thị
state.srcEnd = '192.168.1.110';
doc = createMockDoc(state);
assert.strictEqual(tooltips[7].condition(doc), false, 'B8 phải ẩn');
assert.strictEqual(tooltips[8].condition(doc), true, 'B9 (Interface WAN1) phải hiển thị');
assert.strictEqual(tooltips[9].condition(doc), false, 'B10 phải ẩn');

// Trạng thái 6: Đã xác nhận Interface WAN1 -> Chỉ Bước 10 (Failover to) hiển thị
state.wanIfConfirmed = true;
doc = createMockDoc(state);
assert.strictEqual(tooltips[8].condition(doc), false, 'B9 phải ẩn');
assert.strictEqual(tooltips[9].condition(doc), true, 'B10 (Failover to) phải hiển thị');
assert.strictEqual(tooltips[10].condition(doc), false, 'B11 phải ẩn');

// Trạng thái 7: Đã tick Failover to -> Chỉ Bước 11 (WAN2) hiển thị
state.failover = true;
doc = createMockDoc(state);
assert.strictEqual(tooltips[9].condition(doc), false, 'B10 phải ẩn');
assert.strictEqual(tooltips[10].condition(doc), true, 'B11 (WAN2) phải hiển thị');
assert.strictEqual(tooltips[11].condition(doc), false, 'B12 phải ẩn');

// Trạng thái 8: Đã chọn WAN2 -> Chỉ Bước 12 (+ Priority) hiển thị
state.failoverWanVal = '4';
state.failoverWanText = 'WAN2';
doc = createMockDoc(state);
assert.strictEqual(tooltips[10].condition(doc), false, 'B11 phải ẩn');
assert.strictEqual(tooltips[11].condition(doc), true, 'B12 (+ Priority) phải hiển thị');
assert.strictEqual(tooltips[12].condition(doc), false, 'B13 phải ẩn');

// Trạng thái 9: Đã click mở Priority -> Chỉ Bước 13 (Priority 1) hiển thị
state.priorityOpen = true;
doc = createMockDoc(state);
assert.strictEqual(tooltips[11].condition(doc), false, 'B12 phải ẩn');
assert.strictEqual(tooltips[12].condition(doc), true, 'B13 (Priority 1) phải hiển thị');
assert.strictEqual(tooltips[13].condition(doc), false, 'B14 phải ẩn');

// Trạng thái 10: Đã nhập Priority 1 -> Chỉ Bước 14 (Failback) hiển thị
state.priorityVal = '1';
doc = createMockDoc(state);
assert.strictEqual(tooltips[12].condition(doc), false, 'B13 phải ẩn');
assert.strictEqual(tooltips[13].condition(doc), true, 'B14 (Failback) phải hiển thị');
assert.strictEqual(tooltips[14].condition(doc), false, 'B15 phải ẩn');

// Trạng thái 11: Đã tick Failback -> Chỉ Bước 15 (OK) hiển thị
state.failback = true;
doc = createMockDoc(state);
assert.strictEqual(tooltips[13].condition(doc), false, 'B14 phải ẩn');
assert.strictEqual(tooltips[14].condition(doc), true, 'B15 (OK) phải hiển thị');

// Trạng thái 12: Đã bấm OK để lưu -> Tất cả tooltip đều ẩn
state.isSaved = true;
doc = createMockDoc(state);
assert.strictEqual(tooltips[14].condition(doc), false, 'B15 phải ẩn khi đã lưu');

console.log('✔ Chuỗi tương tác 15 bước hoàn toàn tuần tự và chính xác.');

// --- 2.1. Test hồi quy lỗi Ảnh 1: KTV tick Failback trước nhưng Priority vẫn là 267 ---
const stateRegression = {
  enable: true,
  comment: 'Wan 1',
  srcModeVal: '1',
  srcStart: '192.168.1.100',
  srcEnd: '192.168.1.110',
  wanIfConfirmed: true,
  failover: true,
  failoverWanVal: '4',
  failoverWanText: 'WAN2',
  priorityOpen: false,
  priorityVal: '267',
  failback: true
};
const docReg1 = createMockDoc(stateRegression);
assert.strictEqual(tooltips[11].condition(docReg1), true, 'B12 (+ Priority) BẮT BUỘC hiển thị khi Priority chưa mở dù Failback đã tick');
assert.strictEqual(tooltips[14].condition(docReg1), false, 'B15 (OK) TUYỆT ĐỐI KHÔNG được hiển thị khi Priority vẫn là 267');

stateRegression.priorityOpen = true;
const docReg2 = createMockDoc(stateRegression);
assert.strictEqual(tooltips[12].condition(docReg2), true, 'B13 (nhập Priority 1) BẮT BUỘC hiển thị khi Priority chưa về 1 dù Failback đã tick');
assert.strictEqual(tooltips[14].condition(docReg2), false, 'B15 (OK) TUYỆT ĐỐI KHÔNG được hiển thị khi Priority vẫn là 267');

stateRegression.priorityVal = '1';
const docReg3 = createMockDoc(stateRegression);
assert.strictEqual(tooltips[12].condition(docReg3), false, 'B13 phải ẩn khi Priority đã về 1');
assert.strictEqual(tooltips[14].condition(docReg3), true, 'B15 (OK) chỉ hiển thị khi Priority ĐÃ VỀ 1 và Failback đã tick');
console.log('✔ Test hồi quy lỗi Ảnh 1: Ngăn chặn triệt để nhảy cóc sang Bước 15 khi Priority chưa về 1!');


// 3. Kiểm tra đồng bộ với devices/vigor2927/tooltips.js
console.log('\n--- 3. Kiểm tra đồng bộ với devices/vigor2927/tooltips.js ---');
const allTooltipsCode = fs.readFileSync(path.join(root, 'devices/vigor2927/tooltips.js'), 'utf8');
const sandboxAll = { window: {} };
vm.runInNewContext(allTooltipsCode, sandboxAll);

const tooltipsAll = sandboxAll.window.TOOLTIPS_VIGOR2927['vg2927-bai7'];
assert.ok(Array.isArray(tooltipsAll), 'tooltips.js phải có vg2927-bai7');
assert.strictEqual(tooltipsAll.length, 15, 'tooltips.js phải có đúng 15 bước');
for (let i = 0; i < 15; i++) {
  assert.strictEqual(tooltipsAll[i].text, tooltips[i].text, `Bước ${i + 1} phải khớp giữa bai7.js và tooltips.js`);
}
console.log('✔ Đồng bộ 100% với devices/vigor2927/tooltips.js.');

console.log('\n================================================================');
console.log('TẤT CẢ KIỂM THỬ TOOLTIP BÀI 7 ĐÃ ĐẠT 100% THEO SƠ ĐỒ 15 BƯỚC!');
console.log('================================================================');
