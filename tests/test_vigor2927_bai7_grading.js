'use strict';

const assert = require('assert');
const fs = require('fs');
const path = require('path');
const vm = require('vm');

console.log('================================================================');
console.log('KIỂM THỬ CHẤM ĐIỂM BÀI 7 DRAYTEK VIGOR 2927 (CUSTOM GRADING)');
console.log('================================================================\n');

const root = path.resolve(__dirname, '..');

// Load bai7 lesson
const bai7LessonCode = fs.readFileSync(path.join(root, 'devices/vigor2927/lessons/bai7.js'), 'utf8');
const sandboxLesson = {
  window: {
    DEVICE_VIGOR2927_LESSONS: []
  }
};
vm.runInNewContext(bai7LessonCode, sandboxLesson);

const lesson = sandboxLesson.window.DEVICE_VIGOR2927_LESSONS.find(l => l.id === 'vg2927-bai7');
assert.ok(lesson, 'Bài học vg2927-bai7 phải tồn tại');
assert.ok(lesson.grading, 'Bài học phải có đối tượng grading');
assert.strictEqual(typeof lesson.grading.customGrading, 'function', 'Phải có hàm customGrading');

const customGrading = lesson.grading.customGrading;

function createMockDoc(state) {
  const elements = {
    'input[name="iPREnable"]': { checked: !!state.enable },
    'input[name="comment"]': { value: state.comment || '' },
    'select[name="rdSIpAny"]': {
      value: state.srcModeVal || '0',
      selectedIndex: 0,
      options: [{ text: state.srcModeText || 'Any' }]
    },
    'input[name="sPRSIpStart"]': { value: state.srcStart || '' },
    'input[name="iPRSIpCount"]': { value: state.srcEnd || '' },
    'select[name="multiwanWanIf"]': {
      value: state.ifaceWanVal || '3',
      selectedIndex: 0,
      options: [{ text: state.ifaceWanText || 'WAN1' }]
    },
    'input[name="iPRFailover"]': { checked: !!state.failover },
    'select[name="failoverwan"]': {
      value: state.failoverWanVal || '501',
      selectedIndex: 0,
      options: [{ text: state.failoverWanText || 'Default WAN' }]
    },
    'input[name="sPriority"]': { value: state.priorityVal !== undefined ? state.priorityVal : '' },
    'input[name="iPRFailback"]': { checked: !!state.failback }
  };

  const doc = {
    _ftcIsSaved: !!state.isSaved,
    querySelector: function(sel) {
      if (elements[sel]) return elements[sel];
      if (sel.includes('sPriority')) return elements['input[name="sPriority"]'];
      return null;
    }
  };
  doc.defaultView = { _ftcIsSaved: !!state.isSaved };
  return doc;
}

// 1. Khi chưa mở trang chi tiết rule Index 1
console.log('--- 1. Khi chưa mở trang chi tiết ---');
const emptyRes = customGrading([]);
assert.strictEqual(emptyRes.passed, false);
assert.strictEqual(emptyRes.score, 0);
assert.strictEqual(emptyRes.details[0].id, 'not_on_page');
console.log('✔ Chưa mở trang chi tiết: trả về 0 điểm và nhắc nhở chính xác.\n');

// 2. Khi mới mở trang chi tiết nhưng chưa cấu hình gì
console.log('--- 2. Khi mới mở trang chi tiết (mặc định ban đầu) ---');
let docInit = createMockDoc({});
let resInit = customGrading([docInit]);
assert.strictEqual(resInit.passed, false);
assert.strictEqual(resInit.score, 0); // Chưa lưu nên dù default WAN1 có sẵn cũng chưa passed
console.log('✔ Mới mở trang: 0 điểm, passed = false.\n');

// 3. Cấu hình đúng đầy đủ nhưng CHƯA bấm OK để lưu
console.log('--- 3. Cấu hình hoàn chỉnh nhưng CHƯA bấm OK lưu ---');
let docFullNotSaved = createMockDoc({
  enable: true,
  comment: 'Ưu tiên Wan 1',
  srcModeVal: '1',
  srcModeText: 'IP Range',
  srcStart: '192.168.1.100',
  srcEnd: '192.168.1.110',
  ifaceWanVal: '3',
  ifaceWanText: 'WAN1',
  failover: true,
  failoverWanVal: '4',
  failoverWanText: 'WAN2',
  priorityVal: '1',
  failback: true,
  isSaved: false
});
let resNotSaved = customGrading([docFullNotSaved]);
assert.strictEqual(resNotSaved.passed, false, 'Chưa lưu thì không thể passed');
assert.strictEqual(resNotSaved.score, 0, 'Chưa lưu thì chưa tính điểm');
assert.ok(resNotSaved.details.every(d => d.message.includes('Chưa bấm OK để lưu cấu hình')));
console.log('✔ Chưa lưu: thông báo "Chưa bấm OK để lưu cấu hình" rõ ràng.\n');

// 4. Cấu hình hoàn chỉnh và ĐÃ LƯU
console.log('--- 4. Cấu hình hoàn chỉnh và ĐÃ LƯU ---');
let docFullSaved = createMockDoc({
  enable: true,
  comment: 'Ưu tiên Wan 1',
  srcModeVal: '1',
  srcModeText: 'IP Range',
  srcStart: '192.168.1.100',
  srcEnd: '192.168.1.110',
  ifaceWanVal: '3',
  ifaceWanText: 'WAN1',
  failover: true,
  failoverWanVal: '4',
  failoverWanText: 'WAN2',
  priorityVal: '1',
  failback: true,
  isSaved: true
});
let resSaved = customGrading([docFullSaved]);
assert.strictEqual(resSaved.passed, true, 'Đã lưu và cấu hình đúng 100% phải passed');
assert.strictEqual(resSaved.score, 100, 'Điểm phải là 100');
assert.strictEqual(resSaved.passedCount, 10);
assert.strictEqual(resSaved.totalRules, 10);
console.log('✔ Cấu hình đúng 100% và đã lưu: 10/10 tiêu chí đạt, 100 điểm, passed = true.\n');

// 5. Kiểm tra chấp nhận Priority = 0 (khi kéo slider hết về High 0)
console.log('--- 5. Kiểm tra Priority = 0 (slider High 0) ---');
let docSlider0 = createMockDoc({
  enable: true,
  comment: 'Ưu tiên Wan 1',
  srcModeVal: '1',
  srcModeText: 'IP Range',
  srcStart: '192.168.1.100',
  srcEnd: '192.168.1.110',
  ifaceWanVal: '3',
  ifaceWanText: 'WAN1',
  failover: true,
  failoverWanVal: '4',
  failoverWanText: 'WAN2',
  priorityVal: '0',
  failback: true,
  isSaved: true
});
let resSlider0 = customGrading([docSlider0]);
assert.strictEqual(resSlider0.passed, true, 'Priority 0 phải được chấp nhận đạt');
assert.strictEqual(resSlider0.score, 100);
console.log('✔ Priority = 0 (kéo slider High) cũng đạt 100 điểm.\n');

// 6. Kiểm tra phát hiện sai sót cụ thể
console.log('--- 6. Kiểm tra phát hiện sai sót ---');
let docWrong = createMockDoc({
  enable: true,
  comment: 'Sai Comment',
  srcModeVal: '1',
  srcModeText: 'IP Range',
  srcStart: '192.168.1.10',
  srcEnd: '192.168.1.20',
  ifaceWanVal: '3',
  ifaceWanText: 'WAN1',
  failover: false,
  failoverWanVal: '3',
  failoverWanText: 'WAN1',
  priorityVal: '200',
  failback: false,
  isSaved: true
});
let resWrong = customGrading([docWrong]);
assert.strictEqual(resWrong.passed, false);
const cmtDetail = resWrong.details.find(d => d.id === 'pr_comment');
assert.strictEqual(cmtDetail.passed, false);
assert.ok(cmtDetail.message.includes('Sai Comment'));

const startDetail = resWrong.details.find(d => d.id === 'pr_src_start');
assert.strictEqual(startDetail.passed, false);

const foDetail = resWrong.details.find(d => d.id === 'pr_failover');
assert.strictEqual(foDetail.passed, false);

const priDetail = resWrong.details.find(d => d.id === 'pr_priority');
assert.strictEqual(priDetail.passed, false);

const fbDetail = resWrong.details.find(d => d.id === 'pr_failback');
assert.strictEqual(fbDetail.passed, false);

console.log('✔ Báo lỗi cụ thể và chính xác cho từng mục sai.');

console.log('\n================================================================');
console.log('TẤT CẢ KIỂM THỬ CHẤM ĐIỂM BÀI 7 ĐÃ ĐẠT 100%!');
console.log('================================================================');
