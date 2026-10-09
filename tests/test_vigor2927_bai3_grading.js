'use strict';

const assert = require('assert');
const fs = require('fs');
const path = require('path');
const vm = require('vm');

console.log('================================================================');
console.log('KIỂM THỬ LOGIC CHẤM ĐIỂM BÀI 3 DRAYTEK VIGOR 2927');
console.log('================================================================\n');

const root = path.resolve(__dirname, '..');
const lessonCode = fs.readFileSync(path.join(root, 'devices/vigor2927/lessons/bai3.js'), 'utf8');
const sandbox = { window: {} };
vm.runInNewContext(lessonCode, sandbox);

const lesson = sandbox.window.DEVICE_VIGOR2927_LESSONS.find(l => l.id === 'vg2927-bai3');
assert.ok(lesson, 'Phải tìm thấy bài học vg2927-bai3');
const customGrading = lesson.grading.customGrading;
assert.strictEqual(typeof customGrading, 'function', 'customGrading phải là hàm');

function createMockDoc(state) {
  const store = Object.assign({
    enable: '0',
    ip: '',
    mac: '',
    aryBind: [],
    isSaved: false,
    hasClickedAdd: false,
    lastAddIp: '',
    lastAddMac: '',
    strict: false,
    macLearn: false
  }, state);

  return {
    _ftcIsSaved: store.isSaved,
    _ftcHasClickedAdd: store.hasClickedAdd,
    _ftcLastAddIp: store.lastAddIp,
    _ftcLastAddMac: store.lastAddMac,
    defaultView: {
      aryIpBindMac: store.aryBind,
      _ftcIsSaved: store.isSaved
    },
    querySelector: function (sel) {
      if (sel.includes('sIpBndMacEnable') && sel.includes(':checked')) {
        return (store.enable === '1') ? { value: '1' } : { value: '0' };
      }
      if (sel.includes('sIpAddress')) {
        return { value: store.ip };
      }
      if (sel.includes('txtMac')) {
        return { value: store.mac };
      }
      if (sel.includes('sIpBndMacStrict')) {
        return { checked: store.strict };
      }
      if (sel.includes('sMacLearnEnable')) {
        return { checked: store.macLearn };
      }
      if (sel.includes('sltIpMac')) {
        const opts = [{ text: 'Index IP Address MAC Address HOST ID Comment' }];
        for (let i = 0; i < store.aryBind.length; i++) {
          opts.push({ text: `${i + 1} ${store.aryBind[i][0]} ${store.aryBind[i][1]}` });
        }
        return { options: opts };
      }
      return null;
    }
  };
}

// 1. Kịch bản ban đầu: Chưa cấu hình gì
console.log('--- 1. Kịch bản ban đầu: Chưa cấu hình gì ---');
const docInit = createMockDoc({});
const resInit = customGrading([docInit]);
assert.strictEqual(resInit.passed, false);
assert.strictEqual(resInit.score, 0);
assert.strictEqual(resInit.passedCount, 0);
assert.strictEqual(resInit.totalRules, 6);
console.log('✔ Ban đầu: 0/6 tiêu chí, 0 điểm.\n');

// 2. Kịch bản đã nhập đúng & bấm Add nhưng chưa bấm OK (chưa lưu)
console.log('--- 2. Kịch bản đã cấu hình đúng nhưng CHƯA bấm OK để lưu ---');
const docNotSaved = createMockDoc({
  enable: '1',
  aryBind: [['192.168.1.100', 'AA-BB-CC-DD-EE-FF', '---', '']],
  isSaved: false
});
const resNotSaved = customGrading([docNotSaved]);
// Vì chưa bấm OK, điểm chưa đạt và các message thông báo rõ ràng cần bấm OK
assert.strictEqual(resNotSaved.passed, false);
assert.strictEqual(resNotSaved.score, 0);
assert.ok(resNotSaved.details[0].message.includes('chưa bấm OK để lưu'));
assert.ok(resNotSaved.details[1].message.includes('chưa bấm OK để lưu'));
assert.ok(resNotSaved.details[2].message.includes('chưa bấm OK để lưu'));
console.log('✔ Khi chưa bấm OK: Thông báo rõ ràng "chưa bấm OK để lưu cấu hình" cho từng tiêu chí.\n');

// 3. Kịch bản HOÀN TẤT: Đã cấu hình và đã lưu thành công trên simulator
console.log('--- 3. Kịch bản HOÀN TẤT: Đã lưu thành công (100% ĐẠT) ---');
const docSaved = createMockDoc({
  enable: '1',
  aryBind: [['192.168.1.100', 'AA-BB-CC-DD-EE-FF', '---', '']],
  isSaved: true
});
const resSaved = customGrading([docSaved]);
assert.strictEqual(resSaved.passed, true, 'allPassed phải là true');
assert.strictEqual(resSaved.score, 100, 'score phải là 100');
assert.strictEqual(resSaved.passedCount, 6, 'passedCount phải là 6/6');
for (const d of resSaved.details) {
  assert.strictEqual(d.passed, true, `Tiêu chí ${d.name} phải đạt`);
}
console.log('✔ Sau khi lưu: ĐẠT 6/6 tiêu chí, 100 điểm tuyệt đối!\n');

// 4. Kịch bản nhập sai IP hoặc MAC
console.log('--- 4. Kịch bản nhập sai IP hoặc MAC ---');
const docWrong = createMockDoc({
  enable: '1',
  aryBind: [['192.168.1.99', 'AA-BB-CC-DD-EE-99', '---', '']],
  isSaved: true
});
const resWrong = customGrading([docWrong]);
assert.strictEqual(resWrong.passed, false);
assert.strictEqual(resWrong.details[1].passed, false, 'IP sai phải không đạt');
assert.strictEqual(resWrong.details[2].passed, false, 'MAC sai phải không đạt');
console.log('✔ Nhập sai IP/MAC: Hệ thống nhận diện lỗi chính xác.\n');

console.log('================================================================');
console.log('TẤT CẢ KIỂM THỬ CHẤM ĐIỂM BÀI 3 ĐÃ ĐẠT 100%!');
console.log('================================================================');
