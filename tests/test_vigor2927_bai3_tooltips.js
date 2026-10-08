'use strict';

const assert = require('assert');
const fs = require('fs');
const path = require('path');
const vm = require('vm');

console.log('================================================================');
console.log('KIỂM THỬ TOOLTIP BÀI 3 DRAYTEK VIGOR 2927: 7 BƯỚC TUẦN TỰ');
console.log('================================================================\n');

const root = path.resolve(__dirname, '..');

// 1. Kiểm tra load tooltips/bai3.js
const bai3Code = fs.readFileSync(path.join(root, 'devices/vigor2927/tooltips/bai3.js'), 'utf8');
const sandbox = { window: {} };
vm.runInNewContext(bai3Code, sandbox);

const tooltips = sandbox.window.TOOLTIPS_VIGOR2927['vg2927-bai3'];
assert.ok(Array.isArray(tooltips), 'TOOLTIPS_VIGOR2927[vg2927-bai3] phải là một mảng');
assert.strictEqual(tooltips.length, 7, 'Bài 3 phải có đúng 7 bước tooltip chi tiết');

console.log('--- 1. Kiểm tra tiêu đề và selector của 7 bước ---');
assert.strictEqual(tooltips[0].text, 'Bước 1: chọn LAN');
assert.strictEqual(tooltips[0].hideOnPage, 'ipbmac', 'Bước 1 phải có hideOnPage: ipbmac');

assert.strictEqual(tooltips[1].text, 'Bước 2: chọn Bind IP to MAC');
assert.strictEqual(tooltips[1].hideOnPage, 'ipbmac', 'Bước 2 phải có hideOnPage: ipbmac');

assert.strictEqual(tooltips[2].text, 'Bước 3: chọn Enable');
assert.ok(tooltips[2].selector.includes('lbl-ipbmac-disable'), 'Bước 3 phải hỗ trợ #lbl-ipbmac-disable');
assert.ok(tooltips[2].selector.includes('sIpBndMacEnable'), 'Bước 3 phải hỗ trợ sIpBndMacEnable');

assert.strictEqual(tooltips[3].text, 'Bước 4: nhập IP Address: 192.168.1.100');
assert.ok(tooltips[3].selector.includes('sIpAddress'), 'Bước 4 phải trỏ vào input sIpAddress');

assert.strictEqual(tooltips[4].text, 'Bước 5: nhập MAC Address: AA-BB-CC-DD-EE-FF');
assert.ok(tooltips[4].selector.includes('txtMac'), 'Bước 5 phải trỏ vào input txtMac');

assert.strictEqual(tooltips[5].text, 'Bước 6: chọn Add để thêm vào danh sách IP Bind List');
assert.ok(tooltips[5].selector.includes('btnAdd'), 'Bước 6 phải trỏ vào nút btnAdd');

assert.strictEqual(tooltips[6].text, 'Bước 7: chọn OK để lưu cấu hình');
assert.ok(tooltips[6].selector.includes('btnOk'), 'Bước 7 phải trỏ vào nút btnOk');

console.log('✔ Toàn bộ 7 bước có selector và nội dung chính xác 100%.\n');

console.log('--- 2. Kiểm tra tính tuần tự không đè nhau của điều kiện condition ---');

// Mock DOM
function createMockDoc(state) {
  const store = Object.assign({
    enable: '0',
    ip: '',
    mac: '',
    isAdded: false,
    isSaved: false
  }, state);

  return {
    _ftcIsSaved: store.isSaved,
    defaultView: {
      aryIpBindMac: store.isAdded ? [['192.168.1.100', 'AA-BB-CC-DD-EE-FF', '', '']] : []
    },
    querySelector: function(sel) {
      if (sel.includes('sIpBndMacEnable') && sel.includes(':checked')) {
        return (store.enable === '1') ? { value: '1' } : null;
      }
      if (sel.includes('sIpAddress')) {
        return { value: store.ip };
      }
      if (sel.includes('txtMac')) {
        return { value: store.mac };
      }
      if (sel.includes('sltIpMac')) {
        return {
          options: store.isAdded ? [{ text: '1 192.168.1.100 AA-BB-CC-DD-EE-FF' }] : []
        };
      }
      return null;
    }
  };
}

// Khi mới vào trang (enable=0, ip='', mac=''):
const docInit = createMockDoc({});
assert.strictEqual(tooltips[2].condition(docInit), true, 'Bước 3 (Enable) phải hiển thị khi mới vào trang');
assert.strictEqual(tooltips[3].condition(docInit), false, 'Bước 4 (IP) KHÔNG được hiển thị (tránh đè bước 3)');
assert.strictEqual(tooltips[4].condition(docInit), false, 'Bước 5 (MAC) KHÔNG được hiển thị (tránh đè bước 3)');
assert.strictEqual(tooltips[5].condition(docInit), false, 'Bước 6 (Add) KHÔNG được hiển thị');
assert.strictEqual(tooltips[6].condition(docInit), false, 'Bước 7 (OK) KHÔNG được hiển thị');
console.log('✔ Khi mới vào trang: CHỈ có Bước 3 Enable hiển thị, triệt tiêu hoàn toàn lỗi đè popup trong ảnh.');

// Khi học viên chọn Enable:
const docEnabled = createMockDoc({ enable: '1' });
assert.strictEqual(tooltips[2].condition(docEnabled), false, 'Bước 3 phải ẩn sau khi chọn Enable');
assert.strictEqual(tooltips[3].condition(docEnabled), true, 'Bước 4 (IP Address 192.168.1.100) phải hiển thị');
assert.strictEqual(tooltips[4].condition(docEnabled), false, 'Bước 5 (MAC) KHÔNG được hiển thị');
assert.strictEqual(tooltips[5].condition(docEnabled), false, 'Bước 6 (Add) KHÔNG được hiển thị');
assert.strictEqual(tooltips[6].condition(docEnabled), false, 'Bước 7 (OK) KHÔNG được hiển thị');
console.log('✔ Sau khi chọn Enable: Bước 3 ẩn, Bước 4 IP Address hiển thị tuần tự.');

// Khi học viên nhập IP = 192.168.1.100:
const docIpDone = createMockDoc({ enable: '1', ip: '192.168.1.100' });
assert.strictEqual(tooltips[3].condition(docIpDone), false, 'Bước 4 phải ẩn sau khi nhập IP');
assert.strictEqual(tooltips[4].condition(docIpDone), true, 'Bước 5 (MAC Address) phải hiển thị');
assert.strictEqual(tooltips[5].condition(docIpDone), false, 'Bước 6 (Add) KHÔNG được hiển thị');
console.log('✔ Sau khi nhập IP Address: Bước 4 ẩn, Bước 5 MAC Address hiển thị.');

// Khi học viên nhập MAC = AA-BB-CC-DD-EE-FF (hoặc có dấu hai chấm):
const docMacDone = createMockDoc({ enable: '1', ip: '192.168.1.100', mac: 'AA-BB-CC-DD-EE-FF' });
assert.strictEqual(tooltips[4].condition(docMacDone), false, 'Bước 5 phải ẩn sau khi nhập MAC');
assert.strictEqual(tooltips[5].condition(docMacDone), true, 'Bước 6 (Nút Add) phải hiển thị');
console.log('✔ Sau khi nhập MAC Address: Bước 5 ẩn, Bước 6 (Nút Add) hiển thị.');

// Khi học viên bấm nút Add:
const docAdded = createMockDoc({ enable: '1', ip: '', mac: '', isAdded: true });
assert.strictEqual(tooltips[5].condition(docAdded), false, 'Bước 6 phải ẩn sau khi Add');
assert.strictEqual(tooltips[6].condition(docAdded), true, 'Bước 7 (Nút OK) phải hiển thị');
console.log('✔ Sau khi bấm Add: Bước 6 ẩn, Bước 7 (Nút OK) hiển thị.');

// Khi học viên bấm OK lưu cấu hình:
const docSaved = createMockDoc({ enable: '1', isAdded: true, isSaved: true });
assert.strictEqual(tooltips[6].condition(docSaved), false, 'Bước 7 phải ẩn sau khi lưu');
console.log('✔ Sau khi bấm OK: Hoàn tất bài, tooltip ẩn toàn bộ.');

console.log('\n--- 3. Kiểm tra đồng bộ tooltips.js và lessons/bai3.js ---');
const tooltipsAllCode = fs.readFileSync(path.join(root, 'devices/vigor2927/tooltips.js'), 'utf8');
const tooltipsAllSandbox = { window: {} };
vm.runInNewContext(tooltipsAllCode, tooltipsAllSandbox);
const tooltipsInAll = tooltipsAllSandbox.window.TOOLTIPS_VIGOR2927['vg2927-bai3'];
assert.strictEqual(tooltipsInAll.length, 7, 'tooltips.js phải có đúng 7 bước cho vg2927-bai3');

const lessonCode = fs.readFileSync(path.join(root, 'devices/vigor2927/lessons/bai3.js'), 'utf8');
const lessonSandbox = { window: {} };
vm.runInNewContext(lessonCode, lessonSandbox);
const lesson = lessonSandbox.window.DEVICE_VIGOR2927_LESSONS.find(l => l.id === 'vg2927-bai3');
assert.ok(lesson, 'Bài học vg2927-bai3 phải tồn tại trong DEVICE_VIGOR2927_LESSONS');
assert.strictEqual(lesson.guidePopups.length, 7, 'guidePopups trong lessons/bai3.js phải có đúng 7 bước');
assert.strictEqual(lesson.grading.rules.length, 6, 'grading.rules phải có 6 tiêu chí chấm điểm');
console.log('✔ tooltips.js và lessons/bai3.js đã đồng bộ 7 bước chuẩn xác 100%.');

console.log('\n================================================================');
console.log('TẤT CẢ KIỂM THỬ TOOLTIP BÀI 3 VIGOR 2927 ĐÃ ĐẠT 100%!');
console.log('================================================================');
