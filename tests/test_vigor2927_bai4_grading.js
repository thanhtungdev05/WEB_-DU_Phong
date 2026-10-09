'use strict';

const assert = require('assert');
const fs = require('fs');
const path = require('path');
const vm = require('vm');

console.log('================================================================');
console.log('KIỂM THỬ LOGIC CHẤM ĐIỂM BÀI 4 DRAYTEK VIGOR 2927');
console.log('================================================================\n');

const root = path.resolve(__dirname, '..');
const lessonCode = fs.readFileSync(path.join(root, 'devices/vigor2927/lessons/bai4.js'), 'utf8');
const sandbox = { window: {} };
vm.runInNewContext(lessonCode, sandbox);

const lesson = sandbox.window.DEVICE_VIGOR2927_LESSONS.find(l => l.id === 'vg2927-bai4');
assert.ok(lesson, 'Phải tìm thấy bài học vg2927-bai4');
const customGrading = lesson.grading.customGrading;
assert.strictEqual(typeof customGrading, 'function', 'customGrading phải là hàm');

function createMockDoc(state) {
  const store = Object.assign({
    ip: '192.168.100.1',
    mask: '255.255.255.0',
    dhcp: '1',
    startIp: '192.168.100.10',
    pool: '200',
    gw: '192.168.100.1',
    lease: '86400',
    rip: '0',
    clearLease: true,
    dnsPri: '',
    dnsSnd: '',
    isSaved: false
  }, state);

  return {
    _ftcIsSaved: store.isSaved,
    location: { href: 'http://localhost:8080/doc/ENET.SHT' },
    defaultView: {
      _ftcIsSaved: store.isSaved
    },
    querySelector: function (sel) {
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
      if (sel === 'input[name="sDNSPri"]') {
        return { value: store.dnsPri };
      }
      if (sel === 'input[name="sDNSSnd"]') {
        return { value: store.dnsSnd };
      }
      return null;
    }
  };
}

console.log('--- TEST 1: Chưa vào trang Details Page (đang ở General Setup) ---');
const docGeneral = {
  location: { href: 'http://localhost:8080/doc/enet1.htm' },
  querySelector: function (sel) {
    if (sel === 'input[name="btnDtPage0"]') return { value: 'Details Page' };
    return null;
  }
};
const resNotOnPage = customGrading([docGeneral]);
assert.strictEqual(resNotOnPage.passed, false, 'Chưa vào trang con phải failed');
assert.strictEqual(resNotOnPage.passedCount, 0, 'passedCount phải là 0');
assert.ok(resNotOnPage.details[0].message.includes('Details Page'), 'Phải hướng dẫn bấm Details Page');
console.log('✔ Chưa mở trang con: Báo lỗi chính xác kèm hướng dẫn.');

console.log('\n--- TEST 2: Đã nhập đúng thông số nhưng CHƯA BẤM OK ĐỂ LƯU ---');
const docUnsaved = createMockDoc({ isSaved: false });
const resUnsaved = customGrading([docUnsaved]);
assert.strictEqual(resUnsaved.passed, false, 'Chưa bấm OK phải failed');
assert.ok(resUnsaved.details.some(d => d.message.includes('Chưa bấm OK')), 'Thông báo phải nhắc học viên bấm OK để lưu');
console.log('✔ Chưa lưu: Báo lỗi nhắc học viên bấm OK.');

console.log('\n--- TEST 3: Đã nhập đúng 11/11 thông số và ĐÃ BẤM OK LƯU ---');
const docSaved = createMockDoc({ isSaved: true });
const resSaved = customGrading([docSaved]);
assert.strictEqual(resSaved.passed, true, 'Đã lưu và đúng hết phải passed');
assert.strictEqual(resSaved.score, 100, 'Điểm phải là 100');
assert.strictEqual(resSaved.passedCount, 11, 'passedCount phải là 11');
assert.strictEqual(resSaved.totalRules, 11, 'totalRules phải là 11');
console.log('✔ Cấu hình chuẩn và đã lưu: 11/11 tiêu chí đạt 100%.');

console.log('\n--- TEST 4: Nhập sai thông số (IP sai, Pool sai) ---');
const docWrong = createMockDoc({
  ip: '192.168.1.1',
  pool: '100',
  isSaved: true
});
const resWrong = customGrading([docWrong]);
assert.strictEqual(resWrong.passed, false, 'Thông số sai phải failed');
const ipDetail = resWrong.details.find(d => d.id === 'dhcp_lan_ip');
assert.strictEqual(ipDetail.passed, false, 'IP 192.168.1.1 phải sai');
const poolDetail = resWrong.details.find(d => d.id === 'dhcp_pool_counts');
assert.strictEqual(poolDetail.passed, false, 'Pool 100 phải sai');
console.log('✔ Thông số sai: Phát hiện chính xác từng tiêu chí sai.');

console.log('\n================================================================');
console.log('✔ TẤT CẢ 4 BÀI TEST CHẤM ĐIỂM BÀI 4 ĐỀU VƯỢT QUA 100%!');
console.log('================================================================');
