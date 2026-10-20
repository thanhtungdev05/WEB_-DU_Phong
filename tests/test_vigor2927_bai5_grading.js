'use strict';

const assert = require('assert');
const fs = require('fs');
const path = require('path');
const vm = require('vm');

console.log('================================================================');
console.log('KIỂM THỬ LOGIC CHẤM ĐIỂM BÀI 5 DRAYTEK VIGOR 2927');
console.log('================================================================\n');

const root = path.resolve(__dirname, '..');
const lessonCode = fs.readFileSync(path.join(root, 'devices/vigor2927/lessons/bai5.js'), 'utf8');
const sandbox = { window: {} };
vm.runInNewContext(lessonCode, sandbox);

const lesson = sandbox.window.DEVICE_VIGOR2927_LESSONS.find(l => l.id === 'vg2927-bai5');
assert.ok(lesson, 'Phải tìm thấy bài học vg2927-bai5');
const customGrading = lesson.grading.customGrading;
assert.strictEqual(typeof customGrading, 'function', 'customGrading phải là hàm');

function createMockDoc(state) {
  const store = Object.assign({
    dnsPri: '210.245.31.220',
    dnsSnd: '8.8.8.8',
    ip: '192.168.1.1',
    mask: '255.255.255.0',
    dhcp: '1',
    startIp: '192.168.1.10',
    pool: '200',
    gw: '192.168.1.1',
    lease: '86400',
    rip: '0',
    clearLease: true,
    isSaved: true
  }, state);

  return {
    _ftcIsSaved: store.isSaved,
    location: { href: 'http://localhost:8080/doc/ENET.SHT' },
    defaultView: {
      _ftcIsSaved: store.isSaved
    },
    querySelector: function (sel) {
      if (sel === 'input[name="sDNSPri"]') {
        return { value: store.dnsPri };
      }
      if (sel === 'input[name="sDNSSnd"]') {
        return { value: store.dnsSnd };
      }
      if (sel === 'input[name="sLanIp"]') {
        return { value: store.ip };
      }
      if (sel === 'select[name="sLanMask"]') {
        return {
          value: store.mask,
          selectedIndex: 0,
          options: [{ value: store.mask, text: store.mask + ' / 24' }]
        };
      }
      if (sel === 'input[name="sDHCP"]:checked') {
        return { value: store.dhcp };
      }
      if (sel === 'input[name="sDHCPStIP"]') {
        return { value: store.startIp };
      }
      if (sel === 'input[name="iDHCPNo"]') {
        return { value: store.pool };
      }
      if (sel === 'input[name="sDHCPGwIP"]') {
        return { value: store.gw };
      }
      if (sel === 'input[name="sDHCPLsTime"]') {
        return { value: store.lease };
      }
      if (sel === 'select[name="iRIPLAN"]') {
        return { value: store.rip };
      }
      if (sel === 'input[name="chkrmclnts"]') {
        return { checked: store.clearLease };
      }
      return null;
    }
  };
}

console.log('--- TEST 1: Chưa vào trang Details Page (đang ở General Setup) ---');
const docWrongPage = {
  location: { href: 'http://localhost:8080/doc/ENET1.HTM' },
  querySelector: function () { return null; }
};
const resWrongPage = customGrading([docWrongPage]);
assert.strictEqual(resWrongPage.passed, false, 'Chưa mở trang SHT phải không đạt');
assert.strictEqual(resWrongPage.passedCount, 0, 'passedCount phải là 0');
console.log('✔ Chưa mở trang con: Báo lỗi chính xác kèm hướng dẫn.');

console.log('\n--- TEST 2: Điền đầy đủ thông số nhưng CHƯA bấm OK lưu ---');
const docUnsaved = createMockDoc({ isSaved: false });
const resUnsaved = customGrading([docUnsaved]);
assert.strictEqual(resUnsaved.passed, false, 'Chưa lưu thì KHÔNG ĐẠT');
assert.ok(resUnsaved.details.some(d => d.message && d.message.includes('Chưa bấm OK')), 'Thông báo phải nhắc học viên bấm OK để lưu');
console.log('✔ Chưa lưu: Kết quả không đạt, nhắc học viên bấm OK.');

console.log('\n--- TEST 3: Cấu hình chuẩn xác và ĐÃ BẤM OK lưu ---');
const docFullPass = createMockDoc({ isSaved: true });
const resPass = customGrading([docFullPass]);
assert.strictEqual(resPass.passed, true, 'Bài làm phải ĐẠT');
assert.strictEqual(resPass.score, 100, 'Điểm số phải đạt 100');
assert.strictEqual(resPass.passedCount, 11, 'Phải pass 11/11 tiêu chí');
assert.strictEqual(resPass.totalRules, 11, 'Tổng số tiêu chí phải là 11');
console.log('✔ Cấu hình chuẩn và đã lưu: 11/11 tiêu chí đạt 100%.');

console.log('\n--- TEST 4: Sai Primary IP (DNS) ---');
const docWrongPri = createMockDoc({ dnsPri: '210.245.31.221' });
const resWrongPri = customGrading([docWrongPri]);
assert.strictEqual(resWrongPri.passed, false, 'Sai Primary IP thì không đạt');
const priRule = resWrongPri.details.find(d => d.id === 'dns_primary');
assert.ok(priRule && !priRule.passed, 'Tiêu chí dns_primary phải failed');
console.log('✔ Báo lỗi chính xác khi sai Primary IP.');

console.log('\n--- TEST 5: Sai Secondary IP (DNS) ---');
const docWrongSnd = createMockDoc({ dnsSnd: '1.1.1.1' });
const resWrongSnd = customGrading([docWrongSnd]);
assert.strictEqual(resWrongSnd.passed, false, 'Sai Secondary IP thì không đạt');
const sndRule = resWrongSnd.details.find(d => d.id === 'dns_secondary');
assert.ok(sndRule && !sndRule.passed, 'Tiêu chí dns_secondary phải failed');
console.log('✔ Báo lỗi chính xác khi sai Secondary IP.');

console.log('\n--- TEST 6: Cách ly cờ toàn cục window._hasClickedSaveInGuide ---');
sandbox.window._hasClickedSaveInGuide = true;
const docHasGlobalFlagOnly = createMockDoc({ isSaved: false });
const resGlobalFlagOnly = customGrading([docHasGlobalFlagOnly]);
assert.strictEqual(resGlobalFlagOnly.passed, false, 'Cờ toàn cục cũ không được làm bài 5 tự động pass khi chưa bấm OK');
console.log('✔ Cờ toàn cục cũ bị chặn: Bài 5 bắt buộc phải bấm OK trên trang mới được tính là lưu.');

console.log('\n================================================================');
console.log('TẤT CẢ KIỂM THỬ CHẤM ĐIỂM BÀI 5 ĐÃ VƯỢT QUA XUẤT SẮC (PASSED 100%)');
console.log('================================================================');

