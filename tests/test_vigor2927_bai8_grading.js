'use strict';

const assert = require('assert');
const fs = require('fs');
const path = require('path');
const vm = require('vm');

console.log('================================================================');
console.log('KIỂM THỬ CHẤM ĐIỂM BÀI 8 DRAYTEK VIGOR 2927 (CUSTOM GRADING)');
console.log('================================================================\n');

const root = path.resolve(__dirname, '..');

// Load bai8 lesson
const bai8LessonCode = fs.readFileSync(path.join(root, 'devices/vigor2927/lessons/bai8.js'), 'utf8');
const sandboxLesson = {
  window: {
    DEVICE_VIGOR2927_LESSONS: []
  }
};
vm.runInNewContext(bai8LessonCode, sandboxLesson);

const lesson = sandboxLesson.window.DEVICE_VIGOR2927_LESSONS.find(l => l.id === 'vg2927-bai8');
assert.ok(lesson, 'Bài học vg2927-bai8 phải tồn tại');
assert.strictEqual(lesson.title, 'Cấu hình NAT Port');
assert.ok(lesson.grading, 'Bài học phải có đối tượng grading');
assert.strictEqual(lesson.grading.rules.length, 9, 'Grading phải có đủ 9 rules tiêu chí');
assert.strictEqual(typeof lesson.grading.customGrading, 'function', 'Phải có hàm customGrading');

const customGrading = lesson.grading.customGrading;

function createMockDoc(state) {
  const elements = {
    'input[name="sPSrvEnable"]': { checked: !!state.enable },
    'select[name="sPSrvMode"]': {
      value: state.modeVal !== undefined ? state.modeVal : '0',
      selectedIndex: 0,
      options: [{ text: state.modeText || 'Single' }]
    },
    'input[name="sPSrvSvcName"]': { value: state.svcName || '' },
    'select[name="sPSrvProto"]': {
      value: state.protoVal || '6',
      selectedIndex: 0,
      options: [{ text: state.protoText || 'TCP' }]
    },
    'select[name="sltWanIfIdx"]': {
      value: state.wanIfVal || '0',
      selectedIndex: 0,
      options: [{ text: state.wanIfText || 'WAN1' }]
    },
    'select[name="sPSrvWANIP"]': {
      value: state.wanIpVal || '-1',
      selectedIndex: 0,
      options: [{ text: state.wanIpText || 'None' }]
    },
    'input[name="sPSrvPubPort"]': { value: state.pubPort || '' },
    'select[name="sltSrcIP"]': {
      value: state.srcIpVal || '0',
      selectedIndex: 0,
      options: [{ text: state.srcIpText || 'Any' }]
    },
    'input[name="sPSrvPrvIp"]': { value: state.prvIp || '' },
    'input[name="sPSrvPrvPort"]': { value: state.prvPort || '' }
  };

  const doc = {
    _ftcIsSaved: !!state.isSaved,
    querySelector: function(sel) {
      for (const k in elements) {
        if (sel === k || sel.includes(k) || k.includes(sel)) return elements[k];
      }
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
console.log('✔ Chưa mở trang chi tiết: trả về 0 điểm và thông báo hướng dẫn rõ ràng.\n');

// 2. Khi mới mở trang chi tiết nhưng chưa cấu hình gì
console.log('--- 2. Khi mới mở trang chi tiết (mặc định ban đầu) ---');
let docInit = createMockDoc({});
let resInit = customGrading([docInit]);
assert.strictEqual(resInit.passed, false);
assert.strictEqual(resInit.score, 0);
console.log('✔ Mới mở trang: 0 điểm, passed = false.\n');

// 3. Cấu hình đúng đầy đủ nhưng CHƯA bấm OK để lưu
console.log('--- 3. Cấu hình hoàn chỉnh nhưng CHƯA bấm OK lưu ---');
let docFullNotSaved = createMockDoc({
  enable: true,
  modeVal: '0',
  modeText: 'Single',
  svcName: 'Camera',
  protoVal: '6',
  protoText: 'TCP',
  wanIfVal: '0',
  wanIfText: 'WAN1',
  pubPort: '8080',
  srcIpVal: '0',
  srcIpText: 'Any',
  prvIp: '192.168.1.10',
  prvPort: '8080',
  isSaved: false
});
let resFullNotSaved = customGrading([docFullNotSaved]);
assert.strictEqual(resFullNotSaved.passed, false);
assert.strictEqual(resFullNotSaved.score, 0);
assert.ok(resFullNotSaved.details.every(d => d.message.includes('Chưa nhấn OK để lưu cấu hình')), 'Mọi tiêu chí phải nhắc nhở chưa bấm OK lưu');
console.log('✔ Cấu hình đúng nhưng chưa lưu: 0 điểm và nhắc người dùng bấm OK.\n');

// 4. Cấu hình sai một số trường và đã lưu
console.log('--- 4. Cấu hình sai một số trường ---');
let docPartial = createMockDoc({
  enable: true,
  modeVal: '0',
  modeText: 'Single',
  svcName: 'MY_SERVER', // Sai Service Name (cần Camera)
  protoVal: '6',
  protoText: 'TCP',
  wanIfVal: '6',
  wanIfText: 'ALL',     // Sai WAN Interface (cần WAN1)
  pubPort: '8080',
  srcIpVal: '0',
  srcIpText: 'Any',
  prvIp: '192.168.1.20',  // Sai Private IP (cần 192.168.1.10)
  prvPort: '8080',
  isSaved: true
});
let resPartial = customGrading([docPartial]);
assert.strictEqual(resPartial.passed, false);
assert.strictEqual(resPartial.passedCount, 6); // 6/9 đúng
assert.strictEqual(resPartial.totalRules, 9);
assert.strictEqual(resPartial.score, 67); // Math.round(6/9 * 100) = 67
console.log('✔ Điểm số một phần chính xác (6/9 = 67%).\n');

// 5. Cấu hình đúng hoàn hảo 100% và đã bấm OK lưu
console.log('--- 5. Cấu hình chính xác hoàn toàn và đã lưu ---');
let docPerfect = createMockDoc({
  enable: true,
  modeVal: '0',
  modeText: 'Single',
  svcName: 'Camera',
  protoVal: '6',
  protoText: 'TCP',
  wanIfVal: '0',
  wanIfText: 'WAN1',
  pubPort: '8080',
  srcIpVal: '0',
  srcIpText: 'Any',
  prvIp: '192.168.1.10',
  prvPort: '8080',
  isSaved: true
});
let resPerfect = customGrading([docPerfect]);
assert.strictEqual(resPerfect.passed, true);
assert.strictEqual(resPerfect.score, 100);
assert.strictEqual(resPerfect.passedCount, 9);
assert.strictEqual(resPerfect.totalRules, 9);
assert.ok(resPerfect.details.every(d => d.passed === true));
console.log('✔ Cấu hình hoàn hảo: 100 điểm, passed = true.\n');

// 6. Kiểm tra cơ chế lưu cấu hình (Persistence qua window._FTC_VG2927_BAI8) khi đã quay lại trang danh sách
console.log('--- 6. Kiểm tra cơ chế lưu cấu hình (Persistence qua window._FTC_VG2927_BAI8) ---');
sandboxLesson.window._FTC_VG2927_BAI8 = {
  enable: true,
  mode: 'Single',
  svcName: 'Camera',
  proto: 'TCP',
  wanIf: 'WAN1',
  pubPort: '8080',
  srcIp: 'Any',
  prvIp: '192.168.1.10',
  prvPort: '8080',
  isSaved: true
};

// Gọi customGrading với danh sách docs rỗng (tương tự như khi router đã navigate sang page_042.html)
let resFromStore = customGrading([]);
assert.strictEqual(resFromStore.passed, true);
assert.strictEqual(resFromStore.score, 100);
assert.strictEqual(resFromStore.passedCount, 9);
assert.ok(resFromStore.details.every(d => d.passed === true));
console.log('✔ Cơ chế lưu cấu hình qua _FTC_VG2927_BAI8 hoạt động chuẩn xác 100% khi rời form chi tiết.\n');

// 7. Kiểm tra trường hợp form trong iframe bị reset trắng nhưng store đã có snapshot lưu thành công
console.log('--- 7. Kiểm tra trường hợp form bị reset trắng nhưng store đã lưu snapshot ---');
let docResetBlank = createMockDoc({}); // Form trắng trơn như sau khi reset
let resResetWithStore = customGrading([docResetBlank]);
assert.strictEqual(resResetWithStore.passed, true, 'Phải đạt 100% nhờ snapshot từ store');
assert.strictEqual(resResetWithStore.score, 100);
assert.strictEqual(resResetWithStore.passedCount, 9);
console.log('✔ Fallback store hoạt động hoàn hảo ngay cả khi form chi tiết bị reset trắng.\n');

console.log('================================================================');
console.log('🎉 TẤT CẢ CÁC KIỂM THỬ CHẤM ĐIỂM BÀI 8 ĐÃ ĐẠT 100%!');
console.log('================================================================');

