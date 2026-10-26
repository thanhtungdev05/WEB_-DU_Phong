'use strict';

const assert = require('assert');
const fs = require('fs');
const path = require('path');
const vm = require('vm');

console.log('================================================================');
console.log('KIỂM THỬ TOOLTIP BÀI 8 DRAYTEK VIGOR 2927: 10 BƯỚC CẤU HÌNH TRỌNG TÂM CHO KTV');
console.log('================================================================\n');

const root = path.resolve(__dirname, '..');

// 1. Kiểm tra load tooltips/bai8.js
const bai8TooltipsCode = fs.readFileSync(path.join(root, 'devices/vigor2927/tooltips/bai8.js'), 'utf8');
const sandboxBai8 = { window: {} };
vm.runInNewContext(bai8TooltipsCode, sandboxBai8);

const tooltips = sandboxBai8.window.TOOLTIPS_VIGOR2927['vg2927-bai8'];
assert.ok(Array.isArray(tooltips), 'TOOLTIPS_VIGOR2927[vg2927-bai8] phải là một mảng');
assert.strictEqual(tooltips.length, 10, 'Bài 8 phải có đúng 10 bước tooltip tập trung vào các trường KTV cần cấu hình');

console.log('--- 1. Kiểm tra tiêu đề và thuộc tính trang của 10 bước ---');
assert.strictEqual(tooltips[0].text, 'Bước 1: chọn NAT');
assert.strictEqual(tooltips[0].hideOnPage, 'page_042|p2_130|ipnat.cgi|ipnat');
assert.ok(!tooltips[0].selector.includes('text:NAT'), 'Bước 1 selector không dùng text:NAT lỏng lẻo');

assert.strictEqual(tooltips[1].text, 'Bước 2: chọn Port Redirection');
assert.strictEqual(tooltips[1].hideOnPage, 'page_042|p2_130|ipnat.cgi|ipnat');
assert.ok(!tooltips[1].selector.includes('text:Port Redirection'), 'Bước 2 selector không dùng text:Port Redirection để tránh trùng tiêu đề trang con');

assert.strictEqual(tooltips[2].text, 'Bước 3: chọn 1');
assert.strictEqual(tooltips[2].page, 'page_042|deep_032|ipnatp1|fid=0');
assert.strictEqual(typeof tooltips[2].condition, 'function', 'Bước 3 phải có hàm condition để ẩn khi đã lưu cấu hình');

assert.strictEqual(tooltips[3].text, 'Bước 4: check vào Enable');
assert.strictEqual(tooltips[3].page, 'p2_130|ipnatp|fid=1');
assert.strictEqual(typeof tooltips[3].condition, 'function');
assert.ok(tooltips[3].selector.includes('lbl-nat-enable') || tooltips[3].selector.includes('chk-nat-enable'), 'Bước 4 selector phải có id thuận tiện');

assert.strictEqual(tooltips[4].text, 'Bước 5: nhập Camera');
assert.strictEqual(tooltips[4].page, 'p2_130|ipnatp|fid=1');
assert.strictEqual(typeof tooltips[4].condition, 'function');

assert.strictEqual(tooltips[5].text, 'Bước 6: WAN Interface chọn WAN1');
assert.strictEqual(tooltips[5].page, 'p2_130|ipnatp|fid=1');
assert.strictEqual(typeof tooltips[5].condition, 'function');

assert.strictEqual(tooltips[6].text, 'Bước 7: nhập 8080');
assert.strictEqual(tooltips[6].page, 'p2_130|ipnatp|fid=1');
assert.strictEqual(typeof tooltips[6].condition, 'function');

assert.strictEqual(tooltips[7].text, 'Bước 8: nhập 192.168.1.10');
assert.strictEqual(tooltips[7].page, 'p2_130|ipnatp|fid=1');
assert.strictEqual(typeof tooltips[7].condition, 'function');

assert.strictEqual(tooltips[8].text, 'Bước 9: nhập 8080');
assert.strictEqual(tooltips[8].page, 'p2_130|ipnatp|fid=1');
assert.strictEqual(typeof tooltips[8].condition, 'function');

assert.strictEqual(tooltips[9].text, 'Bước 10: chọn OK để lưu cấu hình');
assert.strictEqual(tooltips[9].page, 'p2_130|ipnatp|fid=1');
assert.strictEqual(typeof tooltips[9].condition, 'function');

console.log('✔ Cấu trúc 10 bước cấu hình trọng tâm đã chính xác 100%.\n');

console.log('--- 2. Kiểm tra tính tuần tự và không trùng lắp của các condition ---');

function createMockDoc(state) {
  const row0Cells = [
    { innerHTML: "<a href='javascript:gotoDetailSet(1)'>1.</a>", querySelector: () => null },
    { innerHTML: "<input type=checkbox value=1 name=enPtRedirec0>", querySelector: () => ({ checked: false }) },
    { innerHTML: "&nbsp;", querySelector: () => null },
    { innerHTML: "&nbsp;ALL", querySelector: () => null },
    { innerHTML: "&nbsp;", querySelector: () => null },
    { innerHTML: "&nbsp;", querySelector: () => null },
    { innerHTML: "&nbsp;Any", querySelector: () => null },
    { innerHTML: "&nbsp;", querySelector: () => null },
    { innerHTML: "<input type=checkbox value=1 name=selClr0>", querySelector: () => ({ checked: false }) }
  ];

  const row0El = {
    querySelectorAll: function(sel) {
      if (sel === 'td') return row0Cells;
      return [];
    }
  };

  const elements = {
    'input[name="sPSrvEnable"]': { checked: !!state.enable, addEventListener: function() {} },
    'input[name="sPSrvSvcName"]': { value: state.svcName || '', addEventListener: function() {} },
    'select[name="sltWanIfIdx"]': {
      value: state.wanIfVal !== undefined ? state.wanIfVal : '6',
      selectedIndex: 0,
      options: [{ text: state.wanIfText || (state.wanIfVal === '0' ? 'WAN1' : 'ALL') }],
      addEventListener: function() {}
    },
    'input[name="sPSrvPubPort"]': { value: state.pubPort || '', addEventListener: function() {} },
    'input[name="sPSrvPrvIp"]': { value: state.prvIp || '', addEventListener: function() {} },
    'input[name="sPSrvPrvPort"]': { value: state.prvPort || '', addEventListener: function() {} },
    'input[name="btnOk"]': { addEventListener: function() {} },
    'tr.row0': row0El
  };

  const doc = {
    _ftcBai8Hooked: false,
    _ftcIsSaved: !!state.isSaved,
    _ftcBai8Snapshot: state.isSaved ? {
      enable: true,
      svcName: 'Camera',
      pubPort: '8080',
      prvIp: '192.168.1.10',
      prvPort: '8080',
      wanIf: 'WAN1',
      proto: 'TCP',
      srcIp: 'Any',
      isSaved: true
    } : null,
    querySelector: function(sel) {
      for (const k in elements) {
        if (sel.includes(k) || k.includes(sel)) return elements[k];
      }
      return null;
    }
  };
  doc.defaultView = {
    _ftcIsSaved: !!state.isSaved,
    _FTC_VG2927_BAI8: doc._ftcBai8Snapshot,
    aryPtRedirect: [["","",0,0,0,-2,0,"Any"]]
  };
  return doc;
}

// Trạng thái 1: Ban đầu mới vào trang (chưa lưu cấu hình)
let d = createMockDoc({});
assert.strictEqual(tooltips[2].condition(d), true, 'B3 (chọn 1) phải hiển thị khi KTV chưa cấu hình');
assert.strictEqual(tooltips[3].condition(d), true, 'B4 (Enable) phải hiển thị');
assert.strictEqual(tooltips[4].condition(d), false, 'B5 (Camera) chưa hiển thị');
assert.strictEqual(tooltips[5].condition(d), false, 'B6 (WAN1) chưa hiển thị');
assert.strictEqual(tooltips[9].condition(d), false, 'B10 (OK) chưa hiển thị');

// Trạng thái 2: Đã tick Enable -> Ngay lập tức hiện B5 (nhập Camera)
d = createMockDoc({ enable: true });
assert.strictEqual(tooltips[3].condition(d), false, 'B4 ẩn');
assert.strictEqual(tooltips[4].condition(d), true, 'B5 (nhập Camera) hiển thị');
assert.strictEqual(tooltips[5].condition(d), false, 'B6 chưa hiển thị');

// Trạng thái 3: Đã nhập Service Name "Camera" -> Hiện B6 (WAN Interface chọn WAN1)
d = createMockDoc({ enable: true, svcName: 'Camera' });
assert.strictEqual(tooltips[4].condition(d), false, 'B5 ẩn');
assert.strictEqual(tooltips[5].condition(d), true, 'B6 (WAN Interface chọn WAN1) hiển thị');
assert.strictEqual(tooltips[6].condition(d), false, 'B7 chưa hiển thị');

// Trạng thái 4: Đã chọn WAN1 -> Hiện B7 (nhập 8080 Public Port)
d = createMockDoc({ enable: true, svcName: 'Camera', wanIfVal: '0', wanIfText: 'WAN1' });
assert.strictEqual(tooltips[5].condition(d), false, 'B6 ẩn');
assert.strictEqual(tooltips[6].condition(d), true, 'B7 (nhập 8080 Public Port) hiển thị');
assert.strictEqual(tooltips[7].condition(d), false, 'B8 chưa hiển thị');

// Trạng thái 5: Đã nhập Public Port 8080 -> Hiện B8 (nhập Private IP 192.168.1.10)
d = createMockDoc({ enable: true, svcName: 'Camera', wanIfVal: '0', wanIfText: 'WAN1', pubPort: '8080' });
assert.strictEqual(tooltips[6].condition(d), false, 'B7 ẩn');
assert.strictEqual(tooltips[7].condition(d), true, 'B8 (nhập 192.168.1.10) hiển thị');
assert.strictEqual(tooltips[8].condition(d), false, 'B9 chưa hiển thị');

// Trạng thái 6: Đã nhập Private IP 192.168.1.10 -> Hiện B9 (nhập Private Port 8080)
d = createMockDoc({ enable: true, svcName: 'Camera', wanIfVal: '0', wanIfText: 'WAN1', pubPort: '8080', prvIp: '192.168.1.10' });
assert.strictEqual(tooltips[7].condition(d), false, 'B8 ẩn');
assert.strictEqual(tooltips[8].condition(d), true, 'B9 (nhập 8080 Private Port) hiển thị');
assert.strictEqual(tooltips[9].condition(d), false, 'B10 chưa hiển thị');

// Trạng thái 7: Đã nhập Private Port 8080 -> Hiện B10 (chọn OK để lưu cấu hình)
d = createMockDoc({ enable: true, svcName: 'Camera', wanIfVal: '0', wanIfText: 'WAN1', pubPort: '8080', prvIp: '192.168.1.10', prvPort: '8080' });
assert.strictEqual(tooltips[8].condition(d), false, 'B9 ẩn');
assert.strictEqual(tooltips[9].condition(d), true, 'B10 (OK Button) hiển thị rõ ràng!');

// Trạng thái 8: Đã bấm OK lưu cấu hình thành công -> Quay về trang Port Redirection Table
d = createMockDoc({ enable: true, svcName: 'Camera', wanIfVal: '0', wanIfText: 'WAN1', pubPort: '8080', prvIp: '192.168.1.10', prvPort: '8080', isSaved: true });
assert.strictEqual(tooltips[2].condition(d), false, 'B3 (chọn 1) PHẢI ẨN HOÀN TOÀN khi đã lưu cấu hình thành công');
assert.strictEqual(tooltips[9].condition(d), false, 'B10 ẩn khi đã lưu thành công');

// Kiểm tra đồng bộ dòng 1 của bảng khi đã lưu:
const row0 = d.querySelector('tr.row0');
const tds = row0.querySelectorAll('td');
assert.strictEqual(tds[2].innerHTML, '&nbsp;Camera', 'Dòng 1 cột Service Name phải là Camera');
assert.strictEqual(tds[3].innerHTML, '&nbsp;WAN1', 'Dòng 1 cột WAN Interface phải là WAN1');
assert.strictEqual(tds[4].innerHTML, '&nbsp;TCP', 'Dòng 1 cột Protocol phải là TCP');
assert.strictEqual(tds[5].innerHTML, '&nbsp;8080', 'Dòng 1 cột Public Port phải là 8080');
assert.strictEqual(tds[6].innerHTML, '&nbsp;Any', 'Dòng 1 cột Source IP phải là Any');
assert.strictEqual(tds[7].innerHTML, '&nbsp;192.168.1.10', 'Dòng 1 cột Private IP phải là 192.168.1.10');
console.log('✔ Kiểm tra đồng bộ dữ liệu vào bảng Port Redirection khi đã lưu: Chính xác 100%!');

console.log('✔ Quá trình chuyển tiếp 10 bước hoàn toàn tuần tự, mượt mà và không đè lấn nhau.\n');

// 3. Kiểm tra đồng bộ với devices/vigor2927/tooltips.js
console.log('--- 3. Kiểm tra đồng bộ với devices/vigor2927/tooltips.js ---');
const allTooltipsCode = fs.readFileSync(path.join(root, 'devices/vigor2927/tooltips.js'), 'utf8');
const sandboxAll = { window: {} };
vm.runInNewContext(allTooltipsCode, sandboxAll);

const tooltipsInAll = sandboxAll.window.TOOLTIPS_VIGOR2927['vg2927-bai8'];
assert.ok(Array.isArray(tooltipsInAll), 'TOOLTIPS_VIGOR2927[vg2927-bai8] trong tooltips.js phải là một mảng');
assert.strictEqual(tooltipsInAll.length, 10, 'Bài 8 trong tooltips.js phải có đủ 10 bước');

for (let i = 0; i < tooltips.length; i++) {
  assert.strictEqual(tooltipsInAll[i].text, tooltips[i].text, `Bước ${i + 1} text không khớp giữa bai8.js và tooltips.js`);
}
console.log('✔ Đồng bộ 100% với devices/vigor2927/tooltips.js.\n');

// 4. Kiểm tra đồng bộ với fallback guidePopups trong devices/vigor2927/lessons/bai8.js
console.log('--- 4. Kiểm tra đồng bộ với devices/vigor2927/lessons/bai8.js ---');
const bai8LessonCode = fs.readFileSync(path.join(root, 'devices/vigor2927/lessons/bai8.js'), 'utf8');
const sandboxLesson = { window: { DEVICE_VIGOR2927_LESSONS: [] } };
vm.runInNewContext(bai8LessonCode, sandboxLesson);

const lesson = sandboxLesson.window.DEVICE_VIGOR2927_LESSONS.find(l => l.id === 'vg2927-bai8');
assert.ok(lesson, 'Bài học vg2927-bai8 phải tồn tại trong DEVICE_VIGOR2927_LESSONS');
assert.ok(Array.isArray(lesson.guidePopups), 'Fallback guidePopups phải là mảng');
assert.strictEqual(lesson.guidePopups.length, 10, 'Fallback guidePopups phải có đủ 10 bước');
console.log('✔ Fallback guidePopups trong bài học đủ 10 bước.\n');

// 5. Kiểm tra cơ chế: Nhập sai bất kỳ bước nào thì tooltip bước đó KHÔNG ĐƯỢC TẮT, chỉ chuyển bước khi đúng
console.log('--- 5. Kiểm tra cơ chế khóa Tooltip khi nhập sai (Không tắt, chỉ chuyển khi đúng) ---');

// Test 5.1: Gõ sai Service Name ('Camera1' thay vì 'Camera')
let dErr = createMockDoc({ enable: true, svcName: 'Camera1' });
assert.strictEqual(tooltips[4].condition(dErr), true, 'B5: Khi gõ sai Service Name ("Camera1"), tooltip Bước 5 PHẢI GIỮ NGUYÊN không được tắt!');
assert.strictEqual(tooltips[5].condition(dErr), false, 'B6: Không được phép nhảy sang Bước 6 khi Bước 5 đang sai!');

// Test 5.2: Chọn sai WAN Interface ('ALL' thay vì 'WAN1')
dErr = createMockDoc({ enable: true, svcName: 'Camera', wanIfVal: '6', wanIfText: 'ALL' });
assert.strictEqual(tooltips[4].condition(dErr), false, 'B5 đã đúng nên ẩn');
assert.strictEqual(tooltips[5].condition(dErr), true, 'B6: Khi chưa chọn WAN1, tooltip Bước 6 PHẢI GIỮ NGUYÊN không được tắt!');
assert.strictEqual(tooltips[6].condition(dErr), false, 'B7: Không được phép nhảy sang Bước 7 khi Bước 6 chưa chọn WAN1!');

// Test 5.3: Gõ sai Public Port ('80' thay vì '8080')
dErr = createMockDoc({ enable: true, svcName: 'Camera', wanIfVal: '0', wanIfText: 'WAN1', pubPort: '80' });
assert.strictEqual(tooltips[5].condition(dErr), false, 'B6 đã đúng nên ẩn');
assert.strictEqual(tooltips[6].condition(dErr), true, 'B7: Khi gõ sai Public Port ("80"), tooltip Bước 7 PHẢI GIỮ NGUYÊN không được tắt!');
assert.strictEqual(tooltips[7].condition(dErr), false, 'B8: Không được phép nhảy sang Bước 8 khi Bước 7 đang sai!');

// Test 5.4: Gõ sai Private IP ('192.168.1.11' thay vì '192.168.1.10')
dErr = createMockDoc({ enable: true, svcName: 'Camera', wanIfVal: '0', wanIfText: 'WAN1', pubPort: '8080', prvIp: '192.168.1.11' });
assert.strictEqual(tooltips[6].condition(dErr), false, 'B7 đã đúng nên ẩn');
assert.strictEqual(tooltips[7].condition(dErr), true, 'B8: Khi gõ sai Private IP ("192.168.1.11"), tooltip Bước 8 PHẢI GIỮ NGUYÊN không được tắt!');
assert.strictEqual(tooltips[8].condition(dErr), false, 'B9: Không được phép nhảy sang Bước 9 khi Bước 8 đang sai!');

// Test 5.5: Gõ sai Private Port ('80' thay vì '8080')
dErr = createMockDoc({ enable: true, svcName: 'Camera', wanIfVal: '0', wanIfText: 'WAN1', pubPort: '8080', prvIp: '192.168.1.10', prvPort: '80' });
assert.strictEqual(tooltips[7].condition(dErr), false, 'B8 đã đúng nên ẩn');
assert.strictEqual(tooltips[8].condition(dErr), true, 'B9: Khi gõ sai Private Port ("80"), tooltip Bước 9 PHẢI GIỮ NGUYÊN không được tắt!');
assert.strictEqual(tooltips[9].condition(dErr), false, 'B10: Tuyệt đối không cho hiện nút OK khi có trường bị sai!');

// Test 5.6: Khi lỡ uncheck Enable thì tooltip lập tức quay về Bước 4
dErr = createMockDoc({ enable: false, svcName: 'Camera', wanIfVal: '0', wanIfText: 'WAN1', pubPort: '8080', prvIp: '192.168.1.10', prvPort: '8080' });
assert.strictEqual(tooltips[3].condition(dErr), true, 'B4: Khi lỡ bỏ check Enable, tooltip lập tức quay lại Bước 4!');
assert.strictEqual(tooltips[4].condition(dErr), false, 'B5 không hiện');
assert.strictEqual(tooltips[9].condition(dErr), false, 'B10 không hiện');

console.log('✔ Cơ chế khóa Tooltip khi nhập sai hoạt động hoàn hảo 100%: Nhập sai không tắt, chỉ chuyển khi nhập đúng!\n');

// 6. Kiểm tra cơ chế Reset Phiên (Session Isolation): Kết thúc phiên 1 thì tất cả trạng thái trở về từ đầu cho phiên 2
console.log('--- 6. Kiểm tra cơ chế Reset Phiên (Session Isolation) ---');
// Giả lập Phiên 1 hoàn tất
sandboxBai8.window._FTC_VG2927_BAI8 = { enable: true, svcName: 'Camera', pubPort: '8080', prvIp: '192.168.1.10', prvPort: '8080', wanIf: 'WAN1', isSaved: true };
let dSaved = createMockDoc({ isSaved: true });
assert.strictEqual(tooltips[2].condition(dSaved), false, 'Phiên 1: Đã lưu nên Bước 3 ẩn');

// KTV kết thúc Phiên 1 -> Hệ thống gọi vg2927Bai8Reset()
assert.strictEqual(typeof sandboxBai8.window.vg2927Bai8Reset, 'function', 'vg2927Bai8Reset phải là một hàm');
sandboxBai8.window.vg2927Bai8Reset();
assert.strictEqual(sandboxBai8.window._FTC_VG2927_BAI8, null, 'Sau khi reset: _FTC_VG2927_BAI8 phải bị xóa về null');

// KTV bắt đầu Phiên 2 (Mở lại bài học từ đầu)
let dSession2 = createMockDoc({});
assert.strictEqual(tooltips[2].condition(dSession2), true, 'Phiên 2: Bước 3 ("chọn 1") PHẢI HIỆN LẠI từ đầu!');
assert.strictEqual(tooltips[3].condition(dSession2), true, 'Phiên 2: Bước 4 ("check vào Enable") sẵn sàng');

// Kiểm tra dòng 1 bảng ở Phiên 2 đã quay về mặc định trống
const row0Session2 = dSession2.querySelector('tr.row0');
const tds2 = row0Session2.querySelectorAll('td');
const chkEnable2 = tds2[1].querySelector('input[type="checkbox"]');
assert.strictEqual(chkEnable2.checked, false, 'Phiên 2: Enable trên bảng phải bỏ tích (false)');
assert.notStrictEqual(tds2[2].innerHTML, '&nbsp;Camera', 'Phiên 2: Service Name không được lưu Camera của phiên 1');
console.log('✔ Cơ chế Reset Phiên hoạt động chính xác 100%: Kết thúc phiên 1 xóa sạch trạng thái để phiên 2 làm lại từ đầu!\n');

console.log('================================================================');
console.log('🎉 TẤT CẢ CÁC KIỂM THỬ TOOLTIP BÀI 8 (10 BƯỚC + RESET PHIÊN) ĐÃ ĐẠT 100%!');
console.log('================================================================');
