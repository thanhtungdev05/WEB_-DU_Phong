'use strict';

const assert = require('assert');
const fs = require('fs');
const path = require('path');
const vm = require('vm');

console.log('================================================================');
console.log('KIỂM THỬ TOOLTIP BÀI 2 DRAYTEK VIGOR 2927: 13 BƯỚC TUẦN TỰ');
console.log('================================================================\n');

const root = path.resolve(__dirname, '..');

// 1. Kiểm tra load tooltips/bai2.js
const bai2Code = fs.readFileSync(path.join(root, 'devices/vigor2927/tooltips/bai2.js'), 'utf8');
const sandbox = { window: {} };
vm.runInNewContext(bai2Code, sandbox);

const tooltips = sandbox.window.TOOLTIPS_VIGOR2927['vg2927-bai2'];
assert.ok(Array.isArray(tooltips), 'TOOLTIPS_VIGOR2927[vg2927-bai2] phải là một mảng');
assert.strictEqual(tooltips.length, 13, 'Bài 2 phải có đúng 13 bước tooltip chi tiết');

console.log('--- 1. Kiểm tra tiêu đề và selector của 13 bước ---');
assert.strictEqual(tooltips[0].text, 'Bước 1: chọn Bandwidth Management');
assert.strictEqual(tooltips[0].hideOnPage, 'ipbandw', 'Bước 1 phải có hideOnPage: ipbandw');

assert.strictEqual(tooltips[1].text, 'Bước 2: chọn Bandwidth Limit');
assert.strictEqual(tooltips[1].hideOnPage, 'ipbandw', 'Bước 2 phải có hideOnPage: ipbandw');

assert.strictEqual(tooltips[2].text, 'Bước 3: chọn Enable');
assert.ok(tooltips[2].selector.includes('lbl-bandwidth-disable'), 'Bước 3 phải trỏ vào #lbl-bandwidth-disable để tooltip nằm sau chữ Disable');
assert.ok(tooltips[2].selector.includes('sIpBandwEnable'), 'Bước 3 phải có fallback sIpBandwEnable');

assert.ok(tooltips[3].text.includes('Bước 4:'), 'Bước 4 phải là nhập TX Limit mặc định');
assert.ok(tooltips[3].selector.includes('sIpBandwDefTx'), 'Bước 4 selector phải là sIpBandwDefTx');

assert.ok(tooltips[4].text.includes('Bước 5:'), 'Bước 5 phải là nhập RX Limit mặc định');
assert.ok(tooltips[4].selector.includes('sIpBandwDefRx'), 'Bước 5 selector phải là sIpBandwDefRx');

assert.strictEqual(tooltips[5].text, 'Bước 6: nhập Start IP: 192.168.1.10');
assert.ok(tooltips[5].selector.includes('sIpBandwFrom'), 'Bước 6 phải trỏ vào sIpBandwFrom');

assert.strictEqual(tooltips[6].text, 'Bước 7: nhập End IP: 192.168.1.20');
assert.ok(tooltips[6].selector.includes('sIpBandwTo'), 'Bước 7 phải trỏ vào sIpBandwTo');

assert.ok(tooltips[7].text.includes('Bước 8:'), 'Bước 8 phải là chọn Each');
assert.ok(tooltips[7].selector.includes('sIpBandwShrd'), 'Bước 8 phải trỏ vào radio Each (sIpBandwShrd)');

assert.ok(tooltips[8].text.includes('Bước 9:'), 'Bước 9 phải là nhập TX Limit cho dải IP');
assert.ok(tooltips[8].selector.includes('sIpBandwTx'), 'Bước 9 selector phải là sIpBandwTx');

assert.ok(tooltips[9].text.includes('Bước 10:'), 'Bước 10 phải là nhập RX Limit cho dải IP');
assert.ok(tooltips[9].selector.includes('sIpBandwRx'), 'Bước 10 selector phải là sIpBandwRx');

assert.ok(tooltips[10].text.includes('Bước 11:'), 'Bước 11 phải là chọn Add');
assert.ok(tooltips[10].selector.includes('btnAdd'), 'Bước 11 selector phải là btnAdd');

assert.ok(tooltips[11].text.includes('Bước 12:'), 'Bước 12 phải là Time Schedule giữ nguyên None');
assert.ok(tooltips[11].selector.includes('nSch1'), 'Bước 12 selector phải là nSch1');

assert.ok(tooltips[12].text.includes('Bước 13:'), 'Bước 13 phải là chọn OK');
assert.ok(tooltips[12].selector.includes('btnOk'), 'Bước 13 selector phải là btnOk');

console.log('✔ Toàn bộ 13 bước có selector và nội dung chính xác 100%.\n');

console.log('--- 2. Kiểm tra tính tuần tự không đè nhau của điều kiện condition ---');

// Mock DOM
function createMockDoc(state) {
  const store = Object.assign({
    enable: '0',
    defTx: '200',
    defTxUnit: '1',
    defRx: '800',
    defRxUnit: '1',
    from: '',
    to: '',
    each: 'N',
    tx: '',
    rx: '',
    isAdded: false,
    isSaved: false,
    eachConfirmed: false
  }, state);

  return {
    _ftcEachConfirmed: store.eachConfirmed,
    _ftcIsSaved: store.isSaved,
    defaultView: {
      aryIpBandw: store.isAdded ? [['192.168.1.10', '192.168.1.20', 20, 25, 'N']] : []
    },
    querySelector: function(sel) {
      if (sel.includes('sIpBandwEnable') && sel.includes(':checked')) {
        return (store.enable === '1') ? { value: '1' } : null;
      }
      if (sel.includes('sIpBandwDefTx')) {
        return { value: store.defTx };
      }
      if (sel.includes('sIpBandwDefRx')) {
        return { value: store.defRx };
      }
      if (sel.includes('iDefTx')) {
        return { value: store.defTxUnit };
      }
      if (sel.includes('iDefRx')) {
        return { value: store.defRxUnit };
      }
      if (sel.includes('sIpBandwFrom')) {
        return { value: store.from };
      }
      if (sel.includes('sIpBandwTo')) {
        return { value: store.to };
      }
      if (sel.includes('sIpBandwTx')) {
        return { value: store.tx };
      }
      if (sel.includes('sIpBandwRx')) {
        return { value: store.rx };
      }
      if (sel.includes('sIpBandwShrd')) {
        return { value: store.each, checked: store.each === 'N' };
      }
      return null;
    },
    querySelectorAll: function(sel) {
      if (sel.includes('#custlsttb0')) {
        return store.isAdded ? [{ textContent: '192.168.1.10 - 192.168.1.20' }] : [];
      }
      return [];
    }
  };
}

// Khi mới vào trang (enable=0, tx=200, rx=800):
const docInit = createMockDoc({});
assert.strictEqual(tooltips[2].condition(docInit), true, 'Bước 3 (Enable) phải hiển thị khi mới vào trang');
assert.strictEqual(tooltips[3].condition(docInit), false, 'Bước 4 KHÔNG được hiển thị (tránh đè bước 3)');
assert.strictEqual(tooltips[4].condition(docInit), false, 'Bước 5 KHÔNG được hiển thị (tránh đè bước 3)');
assert.strictEqual(tooltips[5].condition(docInit), false, 'Bước 6 KHÔNG được hiển thị');
console.log('✔ Khi mới vào trang: CHỈ có Bước 3 Enable hiển thị, hoàn toàn không bị đè như ảnh.');

// Khi học viên chọn Enable:
const docEnabled = createMockDoc({ enable: '1' });
assert.strictEqual(tooltips[2].condition(docEnabled), false, 'Bước 3 phải ẩn sau khi chọn Enable');
assert.strictEqual(tooltips[3].condition(docEnabled), true, 'Bước 4 (TX Limit 20) phải hiển thị');
assert.strictEqual(tooltips[4].condition(docEnabled), false, 'Bước 5 KHÔNG được hiển thị');
console.log('✔ Sau khi chọn Enable: Bước 3 ẩn, Bước 4 TX Limit hiển thị tuần tự.');

// Khi học viên nhập TX Limit = 20:
const docTxDone = createMockDoc({ enable: '1', defTx: '20' });
assert.strictEqual(tooltips[3].condition(docTxDone), false, 'Bước 4 phải ẩn sau khi nhập 20');
assert.strictEqual(tooltips[4].condition(docTxDone), true, 'Bước 5 (RX Limit 25) phải hiển thị');
console.log('✔ Sau khi nhập TX Limit = 20: Bước 4 ẩn, Bước 5 RX Limit hiển thị.');

// Khi học viên nhập RX Limit = 25:
const docDefDone = createMockDoc({ enable: '1', defTx: '20', defRx: '25' });
assert.strictEqual(tooltips[4].condition(docDefDone), false, 'Bước 5 phải ẩn sau khi nhập 25');
assert.strictEqual(tooltips[5].condition(docDefDone), true, 'Bước 6 (Start IP) phải hiển thị');
console.log('✔ Sau khi hoàn tất Default Limit: Bước 6 Start IP hiển thị.');

// Khi nhập Start IP 192.168.1.10:
const docStartIpDone = createMockDoc({ enable: '1', defTx: '20', defRx: '25', from: '192.168.1.10' });
assert.strictEqual(tooltips[5].condition(docStartIpDone), false, 'Bước 6 ẩn');
assert.strictEqual(tooltips[6].condition(docStartIpDone), true, 'Bước 7 (End IP) hiển thị');
console.log('✔ Khi nhập Start IP: Bước 6 ẩn, Bước 7 End IP hiển thị.');

// Khi nhập End IP 192.168.1.20:
const docEndIpDone = createMockDoc({ enable: '1', defTx: '20', defRx: '25', from: '192.168.1.10', to: '192.168.1.20' });
assert.strictEqual(tooltips[6].condition(docEndIpDone), false, 'Bước 7 ẩn');
assert.strictEqual(tooltips[7].condition(docEndIpDone), true, 'Bước 8 (Each) hiển thị');
console.log('✔ Khi nhập End IP: Bước 7 ẩn, Bước 8 Each hiển thị.');

// Khi xác nhận Each và chuyển sang TX:
const docEachDone = createMockDoc({ enable: '1', defTx: '20', defRx: '25', from: '192.168.1.10', to: '192.168.1.20', eachConfirmed: true });
assert.strictEqual(tooltips[7].condition(docEachDone), false, 'Bước 8 ẩn');
assert.strictEqual(tooltips[8].condition(docEachDone), true, 'Bước 9 (TX Limit 20) hiển thị');
console.log('✔ Khi xác nhận Each: Bước 8 ẩn, Bước 9 TX Limit hiển thị.');

// Khi nhập TX Limit dải = 20:
const docEntryTxDone = createMockDoc({ enable: '1', defTx: '20', defRx: '25', from: '192.168.1.10', to: '192.168.1.20', tx: '20' });
assert.strictEqual(tooltips[8].condition(docEntryTxDone), false, 'Bước 9 ẩn');
assert.strictEqual(tooltips[9].condition(docEntryTxDone), true, 'Bước 10 (RX Limit 25) hiển thị');
console.log('✔ Khi nhập TX Limit = 20: Bước 9 ẩn, Bước 10 RX Limit hiển thị.');

// Khi nhập RX Limit dải = 25:
const docEntryRxDone = createMockDoc({ enable: '1', defTx: '20', defRx: '25', from: '192.168.1.10', to: '192.168.1.20', tx: '20', rx: '25' });
assert.strictEqual(tooltips[9].condition(docEntryRxDone), false, 'Bước 10 ẩn');
assert.strictEqual(tooltips[10].condition(docEntryRxDone), true, 'Bước 11 (Nút Add) hiển thị');
console.log('✔ Khi nhập RX Limit = 25: Bước 10 ẩn, Bước 11 (Nút Add) hiển thị.');

// Khi bấm Add:
const docAdded = createMockDoc({ enable: '1', defTx: '20', defRx: '25', isAdded: true });
assert.strictEqual(tooltips[10].condition(docAdded), false, 'Bước 11 ẩn sau khi Add');
assert.strictEqual(tooltips[11].condition(docAdded), true, 'Bước 12 (Time Schedule) hiển thị');
assert.strictEqual(tooltips[12].condition(docAdded), true, 'Bước 13 (OK) hiển thị');
console.log('✔ Sau khi Add: Bước 11 ẩn, Bước 12 (Time Schedule) và Bước 13 (OK) hiển thị.');

// Khi bấm OK lưu:
const docSaved = createMockDoc({ enable: '1', defTx: '20', defRx: '25', isAdded: true, isSaved: true });
assert.strictEqual(tooltips[11].condition(docSaved), false, 'Bước 12 ẩn sau khi lưu');
assert.strictEqual(tooltips[12].condition(docSaved), false, 'Bước 13 ẩn sau khi lưu');
console.log('✔ Sau khi bấm OK: Hoàn tất bài, mọi tooltip đều ẩn.');

console.log('\n--- 3. Kiểm tra đồng bộ lessons/bai2.js ---');
const lessonCode = fs.readFileSync(path.join(root, 'devices/vigor2927/lessons/bai2.js'), 'utf8');
const lessonSandbox = { window: {} };
vm.runInNewContext(lessonCode, lessonSandbox);

const lesson = lessonSandbox.window.DEVICE_VIGOR2927_LESSONS.find(l => l.id === 'vg2927-bai2');
assert.ok(lesson, 'Bài học vg2927-bai2 phải tồn tại trong DEVICE_VIGOR2927_LESSONS');
assert.strictEqual(lesson.guidePopups.length, 13, 'guidePopups trong lessons/bai2.js phải có đúng 13 bước');
assert.strictEqual(lesson.grading.rules.length, 12, 'grading.rules phải có 12 tiêu chí chấm điểm');
console.log('✔ lessons/bai2.js đồng bộ 13 bước guidePopups và 12 tiêu chí chấm điểm chuẩn xác.');

console.log('\n================================================================');
console.log('TẤT CẢ KIỂM THỬ TOOLTIP BÀI 2 VIGOR 2927 ĐÃ ĐẠT 100%!');
console.log('================================================================');
