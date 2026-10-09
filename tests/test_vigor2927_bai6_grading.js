'use strict';

const assert = require('assert');
const fs = require('fs');
const path = require('path');
const vm = require('vm');

console.log('================================================================');
console.log('KIỂM THỬ CHẤM ĐIỂM VÀ LƯU KẾT QUẢ BÀI 6 DRAYTEK VIGOR 2927');
console.log('================================================================\n');

const root = path.resolve(__dirname, '..');
const lessonCode = fs.readFileSync(path.join(root, 'devices/vigor2927/lessons/bai6.js'), 'utf8');

function createSandbox() {
  const sb = {
    window: {},
    document: {
      getElementById: function () { return null; }
    },
    setInterval: function () { return 123; },
    clearInterval: function () {},
    setTimeout: function (fn) { fn(); return 456; },
    Date: Date
  };
  sb.window = sb;
  vm.runInNewContext(lessonCode, sb);
  return sb;
}

const sb = createSandbox();
const lesson = sb.DEVICE_VIGOR2927_LESSONS.find(l => l.id === 'vg2927-bai6');
assert.ok(lesson, 'Phải tìm thấy bài học vg2927-bai6');
const customGrading = lesson.grading.customGrading;
assert.strictEqual(typeof customGrading, 'function', 'customGrading phải là hàm');

console.log('--- 1. Kiểm tra trạng thái ban đầu (chưa cấu hình trang nào) ---');
sb.vg2927Bai6Reset();
const resBanDau = customGrading();
assert.strictEqual(resBanDau.passed, false, 'Chưa làm gì phải chưa đạt');
assert.strictEqual(resBanDau.score, 0, 'Điểm ban đầu phải là 0');
assert.strictEqual(resBanDau.passedCount, 0, 'Chưa có tiêu chí nào đạt');
console.log('✔ Kho rỗng ban đầu: 0/19 tiêu chí đạt, passed = false.\n');

console.log('--- 2. Kiểm tra khi học viên chọn Auto Detect ở Bước 4 và bấm OK ---');
function createMockDocOverview(basedVal, modeVal) {
  const elements = {
    enchkwan0: { checked: true, value: '1' },
    ldbchken0: { checked: true, value: '1' },
    enchkwan1: { checked: true, value: '1' },
    ldbchken1: { checked: true, value: '1' },
    iBwLBBased: { value: basedVal },
    iBwLBMode: { value: modeVal },
    inBwLW: { value: '1' }
  };
  let statusDiv = null;
  const mockDoc = {
    _ftcBai6LastSave: 0,
    getElementsByName: function (name) {
      if (elements[name]) return [elements[name]];
      return [];
    },
    getElementById: function (id) {
      if (id === 'ftc-bai6-status') return statusDiv;
      return null;
    },
    createElement: function (tag) {
      statusDiv = { id: 'ftc-bai6-status', style: {}, textContent: '' };
      return statusDiv;
    },
    body: {
      appendChild: function (el) { statusDiv = el; }
    }
  };
  return mockDoc;
}

// Giả lập học viên chọn Auto Detect ('1') thay vì According to Line Speed ('0')
const docOverviewSai = createMockDocOverview('1', '1');
const simWinSai = {
  document: docOverviewSai
};

lesson.onSimSave(simWinSai);

const storeSai = sb.vg2927Bai6Store();
assert.ok(storeSai.overview, 'Overview phải được chụp lại trong store');
assert.strictEqual(storeSai.overview.lbMode, '1', 'Store phải lưu chính xác giá trị Auto Detect (1)');
assert.strictEqual(sb.vg2927Bai6TrangDaDung(storeSai, 'overview'), false, 'Trang Overview phải đánh giá là CHƯA ĐÚNG');
assert.strictEqual(sb.vg2927Bai6NenAnNutLoi(), false, 'Nút "Xem lỗi sai" KHÔNG ĐƯỢC ẨN khi vừa làm sai!');

const statusMsgSai = docOverviewSai.getElementById('ftc-bai6-status');
assert.ok(statusMsgSai, 'Phải có phần tử thông báo lỗi dưới nút OK');
assert.strictEqual(statusMsgSai.style.color, '#dc2626', 'Thông báo lỗi phải có màu đỏ');
assert.ok(statusMsgSai.textContent.includes('Auto Detect'), 'Nội dung lỗi phải chỉ rõ người dùng đang chọn Auto Detect thay vì According to Line Speed');
console.log('✔ Chọn Auto Detect và bấm OK:');
console.log('  - Lưu chính xác giá trị thực tế vào store (không bị mất)');
console.log('  - Phản hồi cảnh báo đỏ tại chỗ: "' + statusMsgSai.textContent + '"');
console.log('  - Nút "⚠️ Xem lỗi sai" sáng đèn và không bị ẩn.\n');

console.log('--- 3. Kiểm tra hiển thị tiêu chí lỗi khi bấm "⚠️ Xem lỗi sai" ---');
sb._FTC_VG2927_BAI6_SCOPE = 'overview';
const resXemLoi = customGrading();
assert.strictEqual(resXemLoi.passed, false, 'Xem lỗi sai trang overview phải trả về passed = false');
const ruleMode = resXemLoi.details.find(d => d.id === 'gs_lb_mode');
assert.ok(ruleMode, 'Phải có tiêu chí gs_lb_mode');
assert.strictEqual(ruleMode.passed, false, 'Tiêu chí Line Speed phải failed');
assert.strictEqual(ruleMode.expected, 'According to Line Speed');
assert.strictEqual(ruleMode.actual, 'Auto Detect');
console.log('✔ Xem lỗi sai chỉ soi riêng trang General Setup: Tiêu chí Line Speed hiển thị rõ mong muốn và thực tế: Auto Detect.\n');

console.log('--- 4. Kiểm tra khi học viên sửa lại đúng According to Line Speed và bấm OK ---');
const docOverviewDung = createMockDocOverview('1', '0');
const simWinDung = { document: docOverviewDung };
lesson.onSimSave(simWinDung);

const storeDung = sb.vg2927Bai6Store();
assert.strictEqual(storeDung.overview.lbMode, '0', 'Store phải cập nhật According to Line Speed (0)');
assert.strictEqual(sb.vg2927Bai6TrangDaDung(storeDung, 'overview'), true, 'Trang Overview phải đánh giá là ĐÃ ĐÚNG');
assert.strictEqual(sb.vg2927Bai6NenAnNutLoi(), true, 'Nút lỗi sai phải ẩn đi vì trang vừa làm đã đúng');

const statusMsgDung = docOverviewDung.getElementById('ftc-bai6-status');
assert.ok(statusMsgDung, 'Phải có phần tử thông báo thành công');
assert.strictEqual(statusMsgDung.style.color, '#15803d', 'Thông báo thành công phải có màu xanh');
assert.ok(statusMsgDung.textContent.includes('Đã lưu cấu hình General Setup'), 'Thông báo nhắc học viên chuyển sang cấu hình WAN1');
console.log('✔ Sửa lại đúng và bấm OK:');
console.log('  - Store cập nhật chính xác');
console.log('  - Thông báo xanh: "' + statusMsgDung.textContent + '"');
console.log('  - Nút lỗi sai tự động ẩn đi.\n');

console.log('--- 5. Kiểm tra hoàn tất cả 3 trang WAN1 và WAN2 ---');
function createMockDocWan(disName, inRate, inUnit, outRate, outUnit) {
  const elements = {
    iBwWanEnable: { value: '1' },
    sBwWanDisName: { value: disName },
    iBwActMode: { value: '0' },
    iLdBlnc: { checked: true },
    sNBMode: { value: '0' },
    uilBwLBInRate: { value: inRate },
    ulBwLBInRate: { value: '0' },
    uilBwLBInRateUnit: { value: inUnit },
    uilBwLBOutRate: { value: outRate },
    ulBwLBOutRate: { value: '0' },
    uilBwLBOutRateUnit: { value: outUnit }
  };
  let statusDiv = null;
  return {
    _ftcBai6LastSave: 0,
    getElementsByName: function (name) {
      if (elements[name]) return [elements[name]];
      return [];
    },
    getElementById: function (id) {
      if (id === 'ftc-bai6-status') return statusDiv;
      return null;
    },
    createElement: function (tag) {
      statusDiv = { id: 'ftc-bai6-status', style: {}, textContent: '' };
      return statusDiv;
    },
    body: {
      appendChild: function (el) { statusDiv = el; }
    }
  };
}

// Lưu WAN1 đúng: ISP-1, 80 Mbps
const docWan1 = createMockDocWan('ISP-1', '80', '1', '80', '1');
const simWinWan1 = { document: docWan1, iInetWanIdx: 1 };
lesson.onSimSave(simWinWan1);
assert.strictEqual(sb.vg2927Bai6TrangDaDung(sb.vg2927Bai6Store(), 'wan1'), true, 'WAN1 phải đúng');

// Lưu WAN2 đúng: ISP-2, 80 Mbps
const docWan2 = createMockDocWan('ISP-2', '80', '1', '80', '1');
const simWinWan2 = { document: docWan2, iInetWanIdx: 2 };
lesson.onSimSave(simWinWan2);
assert.strictEqual(sb.vg2927Bai6TrangDaDung(sb.vg2927Bai6Store(), 'wan2'), true, 'WAN2 phải đúng');

const resHoanTat = customGrading();
assert.strictEqual(resHoanTat.passed, true, 'Hoàn tất cả 3 trang phải đạt 100%');
assert.strictEqual(resHoanTat.score, 100, 'Điểm số phải đạt 100');
assert.strictEqual(resHoanTat.passedCount, resHoanTat.totalRules, 'Tất cả tiêu chí đều phải passed');
console.log('✔ Hoàn thành cả 3 trang: Đạt 100% (' + resHoanTat.passedCount + '/' + resHoanTat.totalRules + ' tiêu chí).\n');

console.log('================================================================');
console.log('TẤT CẢ CÁC BÀI KIỂM THỬ CHẤM ĐIỂM BÀI 6 ĐÃ ĐẠT 100% THÀNH CÔNG!');
console.log('================================================================');
