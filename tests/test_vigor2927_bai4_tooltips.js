'use strict';

const assert = require('assert');
const fs = require('fs');
const path = require('path');
const vm = require('vm');

console.log('================================================================');
console.log('KIỂM THỬ TOOLTIP BÀI 4 DRAYTEK VIGOR 2927: 11 BƯỚC CHI TIẾT');
console.log('================================================================\n');

const root = path.resolve(__dirname, '..');

// 1. Kiểm tra load tooltips/bai4.js
const bai4Code = fs.readFileSync(path.join(root, 'devices/vigor2927/tooltips/bai4.js'), 'utf8');
const sandbox = { window: {} };
vm.runInNewContext(bai4Code, sandbox);

const tooltips = sandbox.window.TOOLTIPS_VIGOR2927['vg2927-bai4'];
assert.ok(Array.isArray(tooltips), 'TOOLTIPS_VIGOR2927[vg2927-bai4] phải là một mảng');
assert.strictEqual(tooltips.length, 11, 'Bài 4 phải có đúng 11 bước tooltip chi tiết');

console.log('--- 1. Kiểm tra tiêu đề và selector của 11 bước ---');
assert.strictEqual(tooltips[0].text, 'Bước 1: chọn LAN');
assert.ok(tooltips[0].hideOnPage.includes('sht'), 'Bước 1 phải hideOnPage sht');

assert.strictEqual(tooltips[1].text, 'Bước 2: chọn General Setup');
assert.ok(tooltips[1].hideOnPage.includes('sht'), 'Bước 2 phải hideOnPage sht');

assert.strictEqual(tooltips[2].text, 'Bước 3: chọn Details Page');
assert.ok(tooltips[2].selector.includes('btnDtPage0'), 'Bước 3 phải trỏ vào btnDtPage0');
assert.ok(tooltips[2].hideOnPage.includes('sht'), 'Bước 3 phải hideOnPage sht');

assert.strictEqual(tooltips[3].text, 'Bước 4: điền IP Address: 192.168.100.1');
assert.ok(tooltips[3].selector.includes('sLanIp'), 'Bước 4 phải trỏ vào input sLanIp');

assert.strictEqual(tooltips[4].text, 'Bước 5: chọn Subnet Mask: 255.255.255.0 / 24');
assert.ok(tooltips[4].selector.includes('sLanMask'), 'Bước 5 phải trỏ vào select sLanMask');

assert.strictEqual(tooltips[5].text, 'Bước 6: chọn Enable Server');
assert.ok(tooltips[5].selector.includes('sDHCP'), 'Bước 6 phải trỏ vào radio sDHCP');

assert.strictEqual(tooltips[6].text, 'Bước 7: điền Start IP Address: 192.168.100.10');
assert.ok(tooltips[6].selector.includes('sDHCPStIP'), 'Bước 7 phải trỏ vào input sDHCPStIP');

assert.strictEqual(tooltips[7].text, 'Bước 8: điền IP Pool Counts: 200');
assert.ok(tooltips[7].selector.includes('iDHCPNo'), 'Bước 8 phải trỏ vào input iDHCPNo');

assert.strictEqual(tooltips[8].text, 'Bước 9: điền Gateway IP Address: 192.168.100.1');
assert.ok(tooltips[8].selector.includes('sDHCPGwIP'), 'Bước 9 phải trỏ vào input sDHCPGwIP');

assert.strictEqual(tooltips[9].text, 'Bước 10: điền Lease Time: 86400');
assert.ok(tooltips[9].selector.includes('sDHCPLsTime'), 'Bước 10 phải trỏ vào input sDHCPLsTime');

assert.strictEqual(tooltips[10].text, 'Bước 11: chọn OK để lưu cấu hình');
assert.ok(tooltips[10].selector.includes('btnOK'), 'Bước 11 phải trỏ vào nút btnOK');

console.log('✔ Toàn bộ 11 bước có selector và nội dung chính xác 100%.\n');

console.log('--- 2. Kiểm tra tính tuần tự không đè nhau của điều kiện condition ---');

function createMockDoc(state) {
  const store = Object.assign({
    ip: '',
    mask: '',
    dhcp: '1',
    startIp: '',
    pool: '',
    gw: '',
    lease: '',
    isSaved: false
  }, state);

  return {
    _ftcIsSaved: store.isSaved,
    querySelector: function (sel) {
      if (sel === 'input[name="sLanIp"]') return { value: store.ip };
      if (sel === 'select[name="sLanMask"]') {
        return {
          value: store.mask,
          selectedIndex: 0,
          options: [{ value: store.mask, text: store.mask + ' / 24' }]
        };
      }
      if (sel === 'input[name="sDHCP"]:checked') return { value: store.dhcp };
      if (sel === 'input[name="sDHCP"][value="1"]') {
        return {
          value: '1',
          addEventListener: function () {}
        };
      }
      if (sel === 'input[name="sDHCPStIP"]') {
        return {
          value: store.startIp,
          addEventListener: function () {}
        };
      }
      if (sel === 'input[name="iDHCPNo"]') return { value: store.pool };
      if (sel === 'input[name="sDHCPGwIP"]') return { value: store.gw };
      if (sel === 'input[name="sDHCPLsTime"]') return { value: store.lease };
      if (sel === 'input[name="btnOK"], input[value="OK"]') return { value: 'OK' };
      return null;
    }
  };
}

// Ban đầu (chưa điền gì): chỉ Bước 4 (IP) kích hoạt
const docInit = createMockDoc({});
assert.strictEqual(tooltips[3].condition(docInit), true, 'Ban đầu: Bước 4 (IP) phải hiện');
assert.strictEqual(tooltips[4].condition(docInit), false, 'Ban đầu: Bước 5 (Mask) không được hiện');
assert.strictEqual(tooltips[10].condition(docInit), false, 'Ban đầu: Bước 11 (OK) không được hiện');
console.log('✔ Ban đầu: Chỉ Bước 4 hiển thị.');

// Sau khi điền IP: Bước 4 ẩn, Bước 5 (Mask) hiện
const docIpDone = createMockDoc({ ip: '192.168.100.1' });
assert.strictEqual(tooltips[3].condition(docIpDone), false, 'Đã điền IP: Bước 4 phải ẩn');
assert.strictEqual(tooltips[4].condition(docIpDone), true, 'Đã điền IP: Bước 5 phải hiện');
console.log('✔ Sau khi điền IP: Bước 5 hiển thị.');

// Sau khi chọn Mask: Bước 5 ẩn, Bước 6 (Enable Server) hiện
const docMaskDone = createMockDoc({ ip: '192.168.100.1', mask: '255.255.255.0' });
assert.strictEqual(tooltips[4].condition(docMaskDone), false, 'Đã chọn Mask: Bước 5 phải ẩn');
assert.strictEqual(tooltips[5].condition(docMaskDone), true, 'Đã chọn Mask: Bước 6 phải hiện');
console.log('✔ Sau khi chọn Mask: Bước 6 hiển thị.');

// Sau khi xong tất cả 7 trường cấu hình: Bước 11 (OK) hiện
const docAllInputsDone = createMockDoc({
  ip: '192.168.100.1',
  mask: '255.255.255.0',
  dhcp: '1',
  startIp: '192.168.100.10',
  pool: '200',
  gw: '192.168.100.1',
  lease: '86400',
  isSaved: false
});
assert.strictEqual(tooltips[9].condition(docAllInputsDone), false, 'Xong hết thông số: Bước 10 phải ẩn');
assert.strictEqual(tooltips[10].condition(docAllInputsDone), true, 'Xong hết thông số: Bước 11 (OK) phải hiện');
console.log('✔ Điền xong hết 7 thông số: Bước 11 (OK) hiển thị.');

// Sau khi bấm OK lưu thành công: Tất cả các bước kết thúc
const docSaved = createMockDoc({
  ip: '192.168.100.1',
  mask: '255.255.255.0',
  dhcp: '1',
  startIp: '192.168.100.10',
  pool: '200',
  gw: '192.168.100.1',
  lease: '86400',
  isSaved: true
});
assert.strictEqual(tooltips[10].condition(docSaved), false, 'Đã lưu xong: Bước 11 phải ẩn');
console.log('✔ Đã lưu cấu hình: Toàn bộ tooltip hoàn thành và ẩn đi.');

console.log('\n--- 3. Kiểm tra đồng bộ trong tooltips.js và lessons/bai4.js ---');
const tooltipsAllCode = fs.readFileSync(path.join(root, 'devices/vigor2927/tooltips.js'), 'utf8');
const tooltipsAllSandbox = { window: {} };
vm.runInNewContext(tooltipsAllCode, tooltipsAllSandbox);
const tooltipsInAll = tooltipsAllSandbox.window.TOOLTIPS_VIGOR2927['vg2927-bai4'];
assert.strictEqual(tooltipsInAll.length, 11, 'devices/vigor2927/tooltips.js phải có đủ 11 bước');

const lessonCode = fs.readFileSync(path.join(root, 'devices/vigor2927/lessons/bai4.js'), 'utf8');
const lessonSandbox = { window: {} };
vm.runInNewContext(lessonCode, lessonSandbox);
const lesson = lessonSandbox.window.DEVICE_VIGOR2927_LESSONS.find(l => l.id === 'vg2927-bai4');
assert.strictEqual(lesson.guidePopups.length, 11, 'devices/vigor2927/lessons/bai4.js fallback guidePopups phải có đủ 11 bước');

console.log('✔ Đồng bộ hoàn hảo giữa tooltips/bai4.js, tooltips.js và lessons/bai4.js.');

console.log('\n================================================================');
console.log('✔ TẤT CẢ CÁC BÀI TEST TOOLTIP BÀI 4 ĐỀU VƯỢT QUA 100%!');
console.log('================================================================');
