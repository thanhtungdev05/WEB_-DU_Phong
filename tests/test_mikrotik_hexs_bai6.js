/**
 * tests/test_mikrotik_hexs_bai6.js
 * Kiểm thử chi tiết Bài 6: Cấu hình NAT Port & Hairpin NAT (MikroTik hEX S)
 * - 23 bước tooltip tuần tự theo quy trình chuẩn Việt Tuấn
 * - Kiểm tra step-gating: bước trước đúng thì mới qua bước sau
 * - Đầy đủ 2 phần cấu hình:
 *     + Phần 1: NAT Port Camera (dstnat -> 192.168.1.10:8080)
 *     + Phần 2: Hairpin NAT Loopback (srcnat -> 192.168.1.0/24 -> 192.168.1.10:8080 masquerade)
 * - Cơ chế chấm điểm customGrading 2 tiêu chí (50% và 100%)
 * - Cơ chế đặt lại phiên (session reset) qua mkBai6Reset() và app.js
 */

const assert = require('assert');
const fs = require('fs');
const path = require('path');
const vm = require('vm');

const ROOT_DIR = path.resolve(__dirname, '..');

// 1. Nạp code bài học và tooltip
const lessonCode = fs.readFileSync(path.join(ROOT_DIR, 'devices/mikrotik_hexs/lessons/bai6.js'), 'utf8');
const tooltipCode = fs.readFileSync(path.join(ROOT_DIR, 'devices/mikrotik_hexs/tooltips/bai6.js'), 'utf8');

const sandbox = {
  window: {},
  document: {
    querySelectorAll: () => [],
    querySelector: () => null
  },
  setInterval: () => 1,
  setTimeout: () => 1
};
sandbox.window = sandbox;

vm.createContext(sandbox);
vm.runInContext(tooltipCode, sandbox);
vm.runInContext(lessonCode, sandbox);

console.log('--- TEST 1: NẠP VÀ KIỂM TRA METADATA BÀI 6 ---');
const lesson = sandbox.window.DEVICE_MIKROTIK_HEXS_LESSONS.find(l => l.id === 'mikrotik_hexs-bai6');
assert.ok(lesson, 'Bài mikrotik_hexs-bai6 phải được đăng ký vào DEVICE_MIKROTIK_HEXS_LESSONS');
assert.equal(lesson.title, 'Cấu hình NAT Port & Hairpin NAT');
assert.ok(lesson.instructions.some(txt => txt.includes('NAT Port (Port Forwarding)')), 'Hướng dẫn bài học phải có Phần 1: NAT Port');
assert.ok(lesson.instructions.some(txt => txt.includes('Hairpin NAT (NAT Loopback)')), 'Hướng dẫn bài học phải có Phần 2: Hairpin NAT');
assert.ok(lesson.instructions.some(txt => txt.includes('192.168.1.10') && txt.includes('8080')), 'Hướng dẫn phải chứa IP 192.168.1.10 và port 8080');
console.log('✔ Metadata và hướng dẫn bài 6 đầy đủ 2 phần chuẩn Việt Tuấn.');

console.log('\n--- TEST 2: KIỂM TRA 23 BƯỚC TOOLTIPS TUẦN TỰ ---');
const tooltips = sandbox.window.TOOLTIPS_MIKROTIK_HEXS['mikrotik_hexs-bai6'];
assert.ok(Array.isArray(tooltips), 'Danh sách tooltips phải là mảng');
console.log(`- Tổng số tooltips: ${tooltips.length}`);

// Kiểm tra nút Login không bị nhầm text
const loginBtnTooltip = tooltips.find(t => t.selector && t.selector.includes('Login'));
assert.ok(loginBtnTooltip, 'Có tooltip cho nút Login');
assert.equal(loginBtnTooltip.text, 'Nhấn Login', 'Nút login phải có nhãn "Nhấn Login", không bị nhầm "Nhập admin"');

const stepTexts = tooltips.map(t => t.text);

// Phần 1: Bước 1 đến Bước 14
assert.ok(stepTexts.includes('Bước 1: Chọn menu WebFig'), 'Có Bước 1: Chọn menu WebFig');
assert.ok(stepTexts.includes('Bước 2: Chọn menu IP'), 'Có Bước 2: Chọn menu IP');
assert.ok(stepTexts.includes('Bước 3: Chọn mục Firewall'), 'Có Bước 3: Chọn mục Firewall');
assert.ok(stepTexts.includes('Bước 4: Chọn tab NAT'), 'Có Bước 4: Chọn tab NAT');
assert.ok(stepTexts.includes('Bước 5: Chọn Add New để tạo rule NAT mở cổng Camera'), 'Có Bước 5: Chọn Add New');
assert.ok(stepTexts.includes('Bước 6: Chọn Chain: dstnat'), 'Có Bước 6: Chọn Chain: dstnat');
assert.ok(stepTexts.some(t => t.includes('Bước 7:') && t.includes('Protocol')), 'Có Bước 7: Protocol');
assert.ok(stepTexts.some(t => t.includes('Bước 8:') && t.includes('Dst. Port')), 'Có Bước 8: Dst. Port');
assert.ok(stepTexts.some(t => t.includes('Bước 9:') && t.includes('In. Interface')), 'Có Bước 9: In. Interface');
assert.ok(stepTexts.includes('Bước 10: Nhấn khối Action để mở rộng tùy chọn Action'), 'Có Bước 10: Mở khối Action');
assert.ok(stepTexts.includes('Bước 11: Chọn Action: dst-nat'), 'Có Bước 11: Chọn Action: dst-nat');
assert.ok(stepTexts.some(t => t.includes('Bước 12:') && t.includes('To Addresses')), 'Có Bước 12: To Addresses');
assert.ok(stepTexts.some(t => t.includes('Bước 13:') && t.includes('To Ports')), 'Có Bước 13: To Ports');
assert.ok(stepTexts.includes('Bước 14: Nhấn OK để lưu rule NAT Port'), 'Có Bước 14: Nhấn OK lưu Phần 1');

// Phần 2: Bước 15 đến Bước 23
assert.ok(stepTexts.includes('Bước 15: Chọn Add New để tạo rule Hairpin NAT'), 'Có Bước 15: Chọn Add New tạo rule 2');
assert.ok(stepTexts.includes('Bước 16: Chọn Chain: srcnat'), 'Có Bước 16: Chọn Chain: srcnat');
assert.ok(stepTexts.some(t => t.includes('Bước 17:') && t.includes('Src. Address')), 'Có Bước 17: Src. Address');
assert.ok(stepTexts.some(t => t.includes('Bước 18:') && t.includes('Dst. Address')), 'Có Bước 18: Dst. Address');
assert.ok(stepTexts.some(t => t.includes('Bước 19:') && t.includes('Protocol')), 'Có Bước 19: Protocol');
assert.ok(stepTexts.some(t => t.includes('Bước 20:') && t.includes('Dst. Port')), 'Có Bước 20: Dst. Port');
assert.ok(stepTexts.includes('Bước 21: Nhấn khối Action để mở rộng tùy chọn'), 'Có Bước 21: Mở khối Action');
assert.ok(stepTexts.includes('Bước 22: Chọn Action: masquerade'), 'Có Bước 22: Chọn Action: masquerade');
assert.ok(stepTexts.includes('Bước 23: Nhấn OK để lưu rule Hairpin NAT và hoàn thành bài tập'), 'Có Bước 23: Nhấn OK hoàn tất');

// Kiểm tra tính an toàn của Selector (chống giật DOM và reflow)
const step5 = tooltips.find(t => t.text.includes('Bước 5:'));
assert.ok(step5.selector.includes('#ftc-mk6-btn-add-nat'), 'Bước 5 dùng ID tĩnh #ftc-mk6-btn-add-nat');
assert.ok(!step5.selector.includes('text:Add New'), 'Bước 5 không dùng text:Add New');

const step15 = tooltips.find(t => t.text.includes('Bước 15:'));
assert.ok(step15.selector.includes('#ftc-mk6-btn-add-nat'), 'Bước 15 dùng ID tĩnh #ftc-mk6-btn-add-nat');
assert.ok(!step15.selector.includes('text:Add New'), 'Bước 15 không dùng text:Add New');
console.log('✔ Toàn bộ 23 bước hướng dẫn được định nghĩa chuẩn xác và an toàn DOM.');

console.log('\n--- TEST 3: KIỂM TRA CHẤM ĐIỂM CUSTOMGRADING VÀ LƯU TRẠNG THÁI ---');
const customGrading = lesson.grading.customGrading;
assert.equal(typeof customGrading, 'function', 'customGrading phải là hàm');

// Trạng thái 1: Chưa cấu hình gì
sandbox.window.mkBai6Reset();
let resInitial = customGrading([]);
assert.equal(resInitial.passed, false, 'Chưa làm gì thì passed phải là false');
assert.equal(resInitial.score, 0, 'Chưa làm gì thì score = 0');
assert.equal(resInitial.passedCount, 0, 'passedCount = 0');
console.log('✔ Trạng thái ban đầu: chưa đạt, điểm = 0%.');

// Trạng thái 2: Đã lưu Phần 1 (NAT Port Camera)
sandbox.window._FTC_MK6_RULE_PORT_SAVED = true;
let resPart1 = customGrading([]);
assert.equal(resPart1.passed, false, 'Chỉ xong Phần 1 thì chưa đạt cả bài');
assert.equal(resPart1.score, 50, 'Điểm đạt 50% sau Phần 1');
assert.equal(resPart1.passedCount, 1, '1/2 tiêu chí đạt');
console.log('✔ Xong Phần 1 (NAT Port Camera): 1/2 tiêu chí, điểm = 50%.');

// Trạng thái 3: Đã lưu cả Phần 1 và Phần 2 (Hairpin NAT)
sandbox.window._FTC_MK6_RULE_HAIRPIN_SAVED = true;
let resBoth = customGrading([]);
assert.equal(resBoth.passed, true, 'Đã xong cả 2 phần thì passed = true');
assert.equal(resBoth.score, 100, 'Điểm đạt 100%');
assert.equal(resBoth.passedCount, 2, '2/2 tiêu chí đạt');
console.log('✔ Xong cả 2 phần (NAT Port + Hairpin NAT): 2/2 tiêu chí, điểm = 100%, PASSED.');

// Trạng thái 4: Chấm qua danh sách bảng NAT quét được (bảo vệ kép)
sandbox.window.mkBai6Reset();
sandbox.window._FTC_MK6_DS_NAT = [
  { chain: 'dstnat', action: 'dst-nat', to: '192.168.1.10', port: '8080', raw: 'chain=dstnat dst-port=8080 action=dst-nat to-addresses=192.168.1.10 to-ports=8080' },
  { chain: 'srcnat', action: 'masquerade', src: '192.168.1.0/24', dst: '192.168.1.10', raw: 'chain=srcnat src-address=192.168.1.0/24 dst-address=192.168.1.10 action=masquerade' }
];
let resTableScan = customGrading([]);
assert.equal(resTableScan.passed, true, 'Quét bảng NAT đầy đủ 2 rule phải đạt');
assert.equal(resTableScan.score, 100, 'Điểm bảng NAT quét = 100%');
console.log('✔ Quét bảng danh sách NAT RouterOS: nhận diện chuẩn xác 2 rule, điểm = 100%.');

console.log('\n--- TEST 4: KIỂM TRA ĐẶT LẠI PHIÊN (SESSION RESET) ---');
sandbox.window.mkBai6Reset();
assert.equal(sandbox.window._FTC_MK6_NAT_SAVED, false, '_FTC_MK6_NAT_SAVED đã reset về false');
assert.equal(sandbox.window._FTC_MK6_RULE_PORT_SAVED, false, '_FTC_MK6_RULE_PORT_SAVED đã reset về false');
assert.equal(sandbox.window._FTC_MK6_RULE_HAIRPIN_SAVED, false, '_FTC_MK6_RULE_HAIRPIN_SAVED đã reset về false');
assert.equal(sandbox.window._FTC_MK6_CHUP_PORT, null, '_FTC_MK6_CHUP_PORT đã reset về null');
assert.equal(sandbox.window._FTC_MK6_CHUP_HAIRPIN, null, '_FTC_MK6_CHUP_HAIRPIN đã reset về null');
assert.equal(sandbox.window._FTC_MK6_DS_NAT, null, '_FTC_MK6_DS_NAT đã reset về null');
console.log('✔ Hàm mkBai6Reset() xóa sạch trạng thái phiên làm việc.');

console.log('\n--- TEST 5: KIỂM TRA TÍCH HỢP TRONG APP.JS VÀ PORTAL.HTML ---');
const appJsCode = fs.readFileSync(path.join(ROOT_DIR, 'app.js'), 'utf8');
assert.ok(appJsCode.includes('mkBai6Reset'), 'app.js phải gọi mkBai6Reset() khi reset phiên');
assert.ok(appJsCode.includes('_FTC_MK6_RULE_PORT_SAVED = false'), 'app.js phải xóa biến cờ Bài 6 khi reset');

const portalCode = fs.readFileSync(path.join(ROOT_DIR, 'portal.html'), 'utf8');
assert.ok(portalCode.includes('devices/mikrotik_hexs/tooltips/bai6.js'), 'portal.html phải nhúng tooltips/bai6.js');
assert.ok(portalCode.includes('devices/mikrotik_hexs/lessons/bai6.js'), 'portal.html phải nhúng lessons/bai6.js');
console.log('✔ app.js và portal.html đã tích hợp đầy đủ.');

console.log('\n--- TEST 6: MÔ PHỎNG DOM COMBOVIEW CỦA WEBFIG CHO CHAIN ---');
const step6 = tooltips.find(t => t.text.includes('Bước 6:'));
const step7 = tooltips.find(t => t.text.includes('Bước 7:') && t.text.includes('Mở khóa ô Protocol'));
assert.ok(step6 && step7, 'Tìm thấy bước 6 và bước 7');

// Mock DOM mô phỏng RouterOS WebFig ComboView
const mockTrChain = {
  querySelectorAll: (sel) => {
    if (sel.includes('input') && sel.includes('select')) {
      return [
        { tagName: 'SELECT', selectedIndex: -1, value: '', options: [] }, // ComboView select bị -1 khi user click/type
        { tagName: 'INPUT', value: 'dstnat', type: 'text', style: {}, disabled: false } // TextInput lưu giá trị thực
      ];
    }
    if (sel.includes('span.cbox input') || sel.includes('.cbox input')) {
      return [{ tagName: 'INPUT', value: 'dstnat', type: 'text', style: {}, disabled: false }];
    }
    if (sel.includes('input')) {
      return [{ tagName: 'INPUT', value: 'dstnat', type: 'text', style: {}, disabled: false }];
    }
    if (sel.includes('select')) {
      return [{ tagName: 'SELECT', selectedIndex: -1, value: '', options: [] }];
    }
    return [];
  },
  querySelector: (sel) => {
    if (sel.includes('td.label') || sel.includes('th') || sel.includes('td:first-child')) {
      return { textContent: 'Chain' };
    }
    if (sel.includes('span.cbox input') || sel.includes('.cbox input')) {
      return { tagName: 'INPUT', value: 'dstnat', type: 'text', style: {}, disabled: false };
    }
    return null;
  }
};

const mockTrProto = {
  querySelectorAll: () => [],
  querySelector: (sel) => {
    if (sel.includes('td.label') || sel.includes('th') || sel.includes('td:first-child')) {
      return { textContent: 'Protocol' };
    }
    if (sel.includes('td.extra a.sbtn img') || sel.includes('img')) {
      return { src: 'down.svg' }; // Khóa
    }
    return null;
  }
};

const mockDoc = {
  location: { hash: '#IP:Firewall.NAT.*' },
  querySelectorAll: (sel) => {
    if (sel === 'tr') return [mockTrChain, mockTrProto];
    return [];
  },
  querySelector: () => null
};

// Khi Chain = 'dstnat':
// Bước 6 phải chuyển sang FALSE (không còn hiển thị nữa)
const step6Result = step6.condition(mockDoc);
assert.equal(step6Result, false, 'Bước 6 condition phải trả về false khi Chain đã là dstnat');

// Bước 7 phải chuyển sang TRUE (hiển thị hướng dẫn mở khóa Protocol)
const step7Result = step7.condition(mockDoc);
assert.equal(step7Result, true, 'Bước 7 condition phải trả về true khi Chain = dstnat và Protocol bị khóa');
console.log('✔ Mô phỏng ComboView WebFig: Bước 6 tự động chuyển sang Bước 7 mượt mà khi chọn/nhập dstnat.');

console.log('\n================================================================');
console.log('TẤT CẢ CÁC BÀI KIỂM THỬ BÀI 6 NAT PORT & HAIRPIN NAT ĐỀU ĐẠT 100%!');
console.log('================================================================');

