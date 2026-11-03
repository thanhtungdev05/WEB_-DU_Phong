/**
 * tests/test_mikrotik_hexs_bai6.js
 * Kiểm thử chi tiết Bài 6: Cấu hình NAT Port & Hairpin NAT (MikroTik hEX S)
 * - 23 bước tooltip tuần tự theo quy trình chuẩn Việt Tuấn
 * - Có bước nhập Comment: Camera trước bước chọn Chain
 * - Vị trí tooltip chọn Chain đặt ở bottom, không che dấu xổ chọn
 * - Nhận diện khối Action chuẩn xác (phân biệt hàng sep và hàng thuộc tính, không kẹt bước 11)
 * - Tách biệt rule Hairpin NAT và rule WAN masquerade mặc định của router:
 *     + Khi chỉ có rule mặc định router và lưu xong Bước 15, Hairpin NAT KHÔNG tự động pass
 *     + Điểm chỉ đạt 50%, nút Nộp bài không sáng sớm, tooltip Bước 16 hiển thị tiếp tục
 * - Step-gating: bước trước đúng thì mới qua bước sau
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
assert.ok(lesson.instructions.some(txt => txt.includes('NAT Port')), 'Hướng dẫn bài học phải có Phần 1: NAT Port');
assert.ok(lesson.instructions.some(txt => txt.includes('Hairpin NAT')), 'Hướng dẫn bài học phải có Phần 2: Hairpin NAT');
assert.ok(lesson.instructions.some(txt => txt.includes('192.168.1.10') && txt.includes('8080')), 'Hướng dẫn phải chứa IP 192.168.1.10 và port 8080');
assert.ok(lesson.instructions.some(txt => txt.includes('Camera')), 'Hướng dẫn phải chứa ghi chú Camera');
console.log('✔ Metadata và hướng dẫn bài 6 đầy đủ 2 phần chuẩn Việt Tuấn.');

console.log('\n--- TEST 2: KIỂM TRA 24 BƯỚC TOOLTIPS TUẦN TỰ ---');
const tooltips = sandbox.window.TOOLTIPS_MIKROTIK_HEXS['mikrotik_hexs-bai6'];
assert.ok(Array.isArray(tooltips), 'Danh sách tooltips phải là mảng');
console.log(`- Tổng số tooltips: ${tooltips.length}`);

// Kiểm tra nút Login không bị nhầm text
const loginBtnTooltip = tooltips.find(t => t.selector && t.selector.includes('Login'));
assert.ok(loginBtnTooltip, 'Có tooltip cho nút Login');
assert.equal(loginBtnTooltip.text, 'Nhấn Login', 'Nút login phải có nhãn "Nhấn Login", không bị nhầm "Nhập admin"');

const stepTexts = tooltips.map(t => t.text);

// Phần 1: Bước 1 đến Bước 15
assert.ok(stepTexts.includes('Bước 1: Chọn menu WebFig'), 'Có Bước 1: Chọn menu WebFig');
assert.ok(stepTexts.includes('Bước 2: Chọn menu IP'), 'Có Bước 2: Chọn menu IP');
assert.ok(stepTexts.includes('Bước 3: Chọn mục Firewall'), 'Có Bước 3: Chọn mục Firewall');
assert.ok(stepTexts.includes('Bước 4: Chọn tab NAT'), 'Có Bước 4: Chọn tab NAT');
assert.ok(stepTexts.includes('Bước 5: Chọn Add New để tạo rule NAT mở cổng Camera'), 'Có Bước 5: Chọn Add New');
assert.ok(stepTexts.includes('Bước 6: Nhập Comment: Camera'), 'Có Bước 6: Nhập Comment: Camera');
assert.ok(stepTexts.includes('Bước 7: Chọn Chain: dstnat'), 'Có Bước 7: Chọn Chain: dstnat');

const stepChain = tooltips.find(t => t.text === 'Bước 7: Chọn Chain: dstnat');
assert.equal(stepChain.position, 'bottom', 'Bước 7 Chọn Chain phải có position: bottom để không che dấu xổ chọn v');

assert.ok(stepTexts.some(t => t.includes('Bước 8:') && t.includes('Protocol')), 'Có Bước 8: Protocol');
assert.ok(stepTexts.some(t => t.includes('Bước 9:') && t.includes('Dst. Port')), 'Có Bước 9: Dst. Port');
assert.ok(stepTexts.some(t => t.includes('Bước 10:') && t.includes('In. Interface')), 'Có Bước 10: In. Interface');
assert.ok(stepTexts.includes('Bước 11: Nhấn khối Action để mở rộng tùy chọn Action'), 'Có Bước 11: Mở khối Action');
assert.ok(stepTexts.includes('Bước 12: Chọn Action: dst-nat'), 'Có Bước 12: Chọn Action: dst-nat');
assert.ok(stepTexts.some(t => t.includes('Bước 13:') && t.includes('To Addresses')), 'Có Bước 13: To Addresses');
assert.ok(stepTexts.some(t => t.includes('Bước 14:') && t.includes('To Ports')), 'Có Bước 14: To Ports');
assert.ok(stepTexts.includes('Bước 15: Nhấn OK để lưu rule NAT Port'), 'Có Bước 15: Nhấn OK lưu Phần 1');

// Phần 2: Bước 16 đến Bước 23
assert.ok(stepTexts.includes('Bước 16: Tiếp tục nhấp Add New để tạo rule thứ 2'), 'Có Bước 16: Tiếp tục nhấp Add New để tạo rule thứ 2');
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

const step16 = tooltips.find(t => t.text.includes('Bước 16:'));
assert.ok(step16.selector.includes('#ftc-mk6-btn-add-nat'), 'Bước 16 dùng ID tĩnh #ftc-mk6-btn-add-nat');
assert.ok(!step16.selector.includes('text:Add New'), 'Bước 16 không dùng text:Add New');
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

// Trạng thái 5: KIỂM TRA CHỐNG NHẬN NHẦM RULE MASQUERADE MẶC ĐỊNH CỦA ROUTER MIKROTIK (ftel: masquerade có sẵn Src 192.168.1.0/24)
sandbox.window.mkBai6Reset();
// Giả lập bảng NAT thực tế sau Bước 15: có dòng #0 mặc định ftel: masquerade (Src 192.168.1.0/24, Dst rỗng) và dòng #1 Camera (dst-nat 8080)
sandbox.window._FTC_MK6_DS_NAT = [
  { chain: 'srcnat', action: 'masquerade', src: '192.168.1.0/24', dst: '', raw: '- D 0 ftel: masquerade srcnat nat rule added by default configuration masquerade srcnat 192.168.1.0/24' },
  { chain: 'dstnat', action: 'dst-nat', src: '', dst: '', raw: '- D 1 Camera dst-nat dstnat tcp 8080 pppoe-out1' }
];
// Chỉ mới xong Phần 1 (bước 15 nhấn OK)
sandbox.window._FTC_MK6_RULE_PORT_SAVED = true;
let resDefaultRouterRule = customGrading([]);
assert.equal(resDefaultRouterRule.passed, false, 'Rule ftel: masquerade mặc định (có Src 192.168.1.0/24) KHÔNG ĐƯỢC làm Hairpin NAT passed!');
assert.equal(resDefaultRouterRule.score, 50, 'Điểm sau bước 15 chỉ được là 50%');
assert.equal(resDefaultRouterRule.passedCount, 1, 'Chỉ 1/2 tiêu chí đạt');

// Kiểm tra hàm mkBai6Part2Xong: phải trả về false khi chỉ có rule mặc định ftel: masquerade
const step16MockDoc = {
  location: { hash: '#IP:Firewall.NAT' },
  querySelectorAll: () => [],
  querySelector: () => null
};
assert.equal(sandbox.window.mkBai6Part2Xong(step16MockDoc), false, 'mkBai6Part2Xong phải trả về false khi chưa tạo Hairpin NAT tới Dst 192.168.1.10');

// Kiểm tra tooltip Bước 16 (Add New tạo rule Hairpin NAT) PHẢI HIỂN THỊ
assert.equal(step16.condition(step16MockDoc), true, 'Bước 16 phải hiển thị sau khi hoàn thành Phần 1 (Bước 15 nhấn OK)');
console.log('✔ Chống nhận nhầm rule mặc định ftel: masquerade (Src 192.168.1.0/24): Bước 15 xong chỉ đạt 50%, nút Nộp bài không sáng sớm, Bước 16 hiển thị tiếp tục!');

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

console.log('\n--- TEST 6: MÔ PHỎNG DOM COMBOVIEW CỦA WEBFIG CHO COMMENT VÀ CHAIN ---');
const step6 = tooltips.find(t => t.text.includes('Bước 6:'));
const step7 = tooltips.find(t => t.text.includes('Bước 7:') && t.text.includes('dstnat'));
const step8 = tooltips.find(t => t.text.includes('Bước 8:') && t.text.includes('Mở khóa ô Protocol'));
assert.ok(step6 && step7 && step8, 'Tìm thấy bước 6, bước 7 và bước 8');

// Mock DOM với Comment và Chain
const mockTrComment = {
  querySelectorAll: (sel) => {
    if (sel.includes('checkbox')) return [];
    if (sel.includes('input') || sel.includes('textarea')) {
      return [{ tagName: 'INPUT', value: 'Camera', type: 'text', style: {}, disabled: false }];
    }
    return [];
  },
  querySelector: (sel) => {
    if (sel.includes('checkbox')) return null;
    if (sel.includes('td.label') || sel.includes('th') || sel.includes('td:first-child')) {
      return { textContent: 'Comment' };
    }
    if (sel.includes('input') || sel.includes('textarea')) {
      return { tagName: 'INPUT', value: 'Camera', type: 'text', style: {}, disabled: false };
    }
    return null;
  }
};

const mockTrChain = {
  querySelectorAll: (sel) => {
    if (sel.includes('checkbox')) return [];
    if (sel.includes('input') && sel.includes('select')) {
      return [
        { tagName: 'SELECT', selectedIndex: -1, value: '', options: [] },
        { tagName: 'INPUT', value: 'dstnat', type: 'text', style: {}, disabled: false }
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
    if (sel.includes('checkbox')) return null;
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
      return { src: 'down.svg' };
    }
    return null;
  }
};

const mockDoc = {
  location: { hash: '#IP:Firewall.NAT.*' },
  querySelectorAll: (sel) => {
    if (sel === 'tr') return [mockTrComment, mockTrChain, mockTrProto];
    return [];
  },
  querySelector: () => null
};

// Khi Comment = 'Camera': Bước 6 chuyển sang false
const step6Result = step6.condition(mockDoc);
assert.equal(step6Result, false, 'Bước 6 condition phải trả về false khi Comment đã là Camera');

// Khi Chain = 'dstnat': Bước 7 chuyển sang false, Bước 8 hiển thị mở khóa Protocol
const step7Result = step7.condition(mockDoc);
assert.equal(step7Result, false, 'Bước 7 condition phải trả về false khi Chain đã là dstnat');

const step8Result = step8.condition(mockDoc);
assert.equal(step8Result, true, 'Bước 8 condition phải trả về true khi Chain = dstnat và Protocol bị khóa');
console.log('✔ Mô phỏng ComboView WebFig: Bước 6 (Comment) chuyển sang Bước 7 (Chain), rồi sang Bước 8 (Protocol) mượt mà.');

console.log('\n--- TEST 7: KIỂM TRA PHÂN BIỆT HÀNG SEPARATOR VÀ HÀNG ACTION (CHỐNG KẸT BƯỚC 11) ---');
const step11 = tooltips.find(t => t.text.includes('Bước 11:'));
const step12 = tooltips.find(t => t.text.includes('Bước 12:'));
assert.ok(step11 && step12, 'Tìm thấy bước 11 và bước 12');

// Mock hàng Separator Action
const mockTrSepAction = {
  querySelectorAll: (sel) => {
    if (sel.includes('td.sep')) return [{ textContent: 'Action' }];
    return [];
  },
  querySelector: (sel) => {
    if (sel.includes('td.sep')) return { textContent: 'Action' };
    if (sel.includes('td:first-child')) return { textContent: 'Action' };
    return null;
  }
};

// Mock hàng thuộc tính Action (có select)
const mockActionSelect = {
  tagName: 'SELECT',
  selectedIndex: 0,
  value: 'accept',
  options: [{ text: 'accept', value: 'accept' }, { text: 'dst-nat', value: 'dst-nat' }],
  offsetParent: {} // Đang hiển thị
};

const mockTrPropAction = {
  querySelectorAll: (sel) => {
    if (sel.includes('select')) return [mockActionSelect];
    return [];
  },
  querySelector: (sel) => {
    if (sel.includes('td.sep')) return null;
    if (sel.includes('td.label') || sel.includes('th') || sel.includes('td:first-child')) {
      return { textContent: 'Action' };
    }
    if (sel.includes('select')) return mockActionSelect;
    return null;
  }
};

const mockTrInIf = {
  querySelectorAll: () => [],
  querySelector: (sel) => {
    if (sel.includes('td.label') || sel.includes('th') || sel.includes('td:first-child')) {
      return { textContent: 'In. Interface' };
    }
    if (sel.includes('select') || sel.includes('input')) {
      return { value: 'pppoe-out1' };
    }
    return null;
  }
};

const mockTrDstPort = {
  querySelectorAll: () => [],
  querySelector: (sel) => {
    if (sel.includes('td.label') || sel.includes('th') || sel.includes('td:first-child')) {
      return { textContent: 'Dst. Port' };
    }
    if (sel.includes('input')) return { value: '8080' };
    return null;
  }
};

// Khi Action block đã mở (có cả dòng Sep và dòng Thuộc tính Action):
const mockDocActionOpen = {
  location: { hash: '#IP:Firewall.NAT.*' },
  querySelectorAll: (sel) => {
    if (sel === 'tr') return [mockTrDstPort, mockTrInIf, mockTrSepAction, mockTrPropAction];
    return [];
  },
  querySelector: () => null
};

// Bước 11 phải trả về false (vì khối Action đã mở)
assert.equal(step11.condition(mockDocActionOpen), false, 'Bước 11 không hiển thị khi Action đã mở');

// Bước 12 phải trả về true (vì Action hiện tại là accept, chưa chọn dst-nat)
assert.equal(step12.condition(mockDocActionOpen), true, 'Bước 12 phải hiển thị để KTV chọn Action dst-nat');

// Khi KTV chọn Action là dst-nat:
mockActionSelect.value = 'dst-nat';
mockActionSelect.options[0].text = 'dst-nat';
assert.equal(step12.condition(mockDocActionOpen), false, 'Bước 12 chuyển sang false khi đã chọn dst-nat');
console.log('✔ Phân biệt hàng Action: Chống kẹt hoàn toàn ở Bước 11, chuyển bước sang Bước 12 mượt mà!');

console.log('\n--- TEST 8: KIỂM TRA SELECTOR NÚT OK BƯỚC 15 & BƯỚC 23 (CHỐNG TRỎ NHẦM RESET COUNTERS) ---');
const step15 = tooltips.find(t => t.text.includes('Bước 15:'));
const step23 = tooltips.find(t => t.text.includes('Bước 23:'));
assert.ok(step15 && step23, 'Tìm thấy Bước 15 và Bước 23');
assert.ok(!step15.selector.split(',').map(s => s.trim()).includes('a.button'), 'Bước 15 KHÔNG ĐƯỢC dùng selector chung a.button gây trỏ nhầm vào Reset Counters');
assert.ok(!step23.selector.split(',').map(s => s.trim()).includes('a.button'), 'Bước 23 KHÔNG ĐƯỢC dùng selector chung a.button gây trỏ nhầm vào Reset Counters');
assert.ok(step15.selector.includes('#ftc-mk6-btn-ok'), 'Bước 15 phải dùng #ftc-mk6-btn-ok');
assert.ok(step23.selector.includes('#ftc-mk6-btn-ok'), 'Bước 23 phải dùng #ftc-mk6-btn-ok');

const mockBtnResetCounters = { textContent: 'Reset Counters', id: '', setAttribute: () => {} };
const mockBtnOk = { textContent: 'OK', id: '', attrs: {}, setAttribute: function (k, v) { this.attrs[k] = v; } };
const mockDocButtons = {
  location: { hash: '#IP:Firewall.NAT.new' },
  querySelectorAll: (sel) => {
    if (sel.includes('a.button')) return [mockBtnResetCounters, mockBtnOk];
    return [];
  },
  querySelector: () => null,
  getElementById: (id) => (mockBtnOk.id === id ? mockBtnOk : null)
};
sandbox.window.mkBai6CaiTheoDoi(mockDocButtons);
assert.equal(mockBtnResetCounters.id, '', 'Nút Reset Counters KHÔNG ĐƯỢC gắn id ftc-mk6-btn-ok');
assert.equal(mockBtnOk.id, 'ftc-mk6-btn-ok', 'Nút OK phải được gắn đúng id ftc-mk6-btn-ok');
console.log('✔ Bước 15 và Bước 23 trỏ chính xác 100% vào nút OK, không bao giờ trỏ nhầm vào Reset Counters!');

console.log('\n--- TEST 9: KIỂM TRA ĐẦY ĐỦ 8 THÔNG SỐ PHẦN 1, 6 THÔNG SỐ PHẦN 2 & LUỒNG NHẢY RA BẢNG NAT ---');
sandbox.window.mkBai6Reset();
// 9.1: Kiểm tra hàm mkBai6FormPortDayDu (8 thông số Phần 1)
const snapPortThieu = {
  comment: 'Camera', chain: 'dstnat',
  protocol: '6 (tcp)', protoBat: true,
  dstPort: '8080', dstPortBat: true,
  inIf: 'pppoe-out1', inIfBat: true,
  action: 'dst-nat',
  toAddresses: '192.168.1.10', toAddrBat: true,
  toPorts: '', toPortsBat: false // Thiếu To Ports
};
assert.equal(sandbox.window.mkBai6FormPortDayDu(snapPortThieu), false, 'Thiếu To Ports 8080 thì mkBai6FormPortDayDu phải trả về false');

const snapPortDu = Object.assign({}, snapPortThieu, { toPorts: '8080', toPortsBat: true });
assert.equal(sandbox.window.mkBai6FormPortDayDu(snapPortDu), true, 'Đủ 8 thông số Phần 1 thì mkBai6FormPortDayDu phải trả về true');

// 9.2: Kiểm tra hàm mkBai6FormHairpinDayDu (6 thông số Phần 2)
const snapHairpinThieu = {
  chain: 'srcnat',
  srcAddr: '192.168.1.0/24', srcAddrBat: true,
  dstAddr: '', dstAddrBat: false, // Thiếu Dst. Address
  protocol: '6 (tcp)', protoBat: true,
  dstPort: '8080', dstPortBat: true,
  action: 'masquerade'
};
assert.equal(sandbox.window.mkBai6FormHairpinDayDu(snapHairpinThieu), false, 'Thiếu Dst. Address 192.168.1.10 thì mkBai6FormHairpinDayDu phải trả về false');

const snapHairpinDu = Object.assign({}, snapHairpinThieu, { dstAddr: '192.168.1.10', dstAddrBat: true });
assert.equal(sandbox.window.mkBai6FormHairpinDayDu(snapHairpinDu), true, 'Đủ 6 thông số Phần 2 thì mkBai6FormHairpinDayDu phải trả về true');

// 9.3: Mô phỏng xong Phần 1 nhấn OK nhảy ra trang bảng NAT (#IP:Firewall.NAT)
sandbox.window.mkBai6Reset();
sandbox.window._FTC_MK6_CHUP_PORT = snapPortDu;
const mockRowDefault = {
  querySelector: () => null,
  querySelectorAll: () => ['', 'D', '0', 'ftel: masquer...', 'masquera', 'srcnat', '192.168.1.0/', '', '', '', '', '', '', '', ''].map(t => ({ textContent: t }))
};
const mockRowPort = {
  querySelector: () => null,
  querySelectorAll: () => ['', 'D', '1', 'Camera', 'dst-nat', 'dstnat', '', '', '', '', 'tcp', '', '8080', '', 'pppoe-...'].map(t => ({ textContent: t }))
};
const mockDocNatAfterPart1 = {
  location: { hash: '#IP:Firewall.NAT' },
  querySelectorAll: (sel) => (sel === 'tr' ? [mockRowDefault, mockRowPort] : []),
  querySelector: () => null
};
const resAfterPart1OnNat = customGrading([mockDocNatAfterPart1]);
assert.equal(resAfterPart1OnNat.passed, false, 'Mới xong Phần 1 ngoài bảng NAT thì nút Nộp bài chưa được sáng (passed = false)');
assert.equal(resAfterPart1OnNat.score, 50, 'Xong Phần 1 đạt 50%');
assert.equal(resAfterPart1OnNat.trangHienTaiDat, true, 'trangHienTaiDat = true để không báo lỗi đỏ sau khi lưu Phần 1');
assert.equal(resAfterPart1OnNat.daVaoTrangCuoi, false, 'daVaoTrangCuoi = false để chờ làm tiếp Phần 2');
assert.equal(step16.condition(mockDocNatAfterPart1), true, 'Trên bảng NAT sau Phần 1 phải hiện ngay Bước 16: Tiếp tục nhấp Add New để tạo rule thứ 2');

// 9.4: Khi đang ở trong hộp thoại tạo rule Phần 2 (#IP:Firewall.NAT.new), nút Nộp bài CHƯA được sáng
sandbox.window._FTC_MK6_CHUP_HAIRPIN = snapHairpinDu;
const mockDocInDialogPart2 = {
  location: { hash: '#IP:Firewall.NAT.new' },
  querySelectorAll: () => [],
  querySelector: () => null
};
const resWhileInDialog2 = customGrading([mockDocInDialogPart2]);
assert.equal(resWhileInDialog2.passed, false, 'Khi đang ở trong form Add New Phần 2 (chưa nhảy ra bảng NAT), nút Nộp bài chưa được sáng');

// 9.5: Khi nhấn OK Phần 2 và nhảy ra trang bảng NAT (#IP:Firewall.NAT) có đủ 2 rule (Rule 1 Camera + Rule 2 Hairpin NAT)
const mockRowHairpin = {
  querySelector: () => null,
  querySelectorAll: () => ['', 'D', '2', '', 'masquerade', 'srcnat', '192.168.1.0/24', '192.168.1.10', '', '', 'tcp', '', '8080', '', ''].map(t => ({ textContent: t }))
};
const mockDocNatAfterPart2 = {
  location: { hash: '#IP:Firewall.NAT' },
  querySelectorAll: (sel) => (sel === 'tr' ? [mockRowDefault, mockRowPort, mockRowHairpin] : []),
  querySelector: () => null
};
const resAfterPart2OnNat = customGrading([mockDocNatAfterPart2]);
assert.equal(resAfterPart2OnNat.passed, true, 'Khi nhảy ra bảng NAT có đủ cả 2 rule (NAT Port + Hairpin NAT), nút Nộp bài sáng lên (passed = true)');
assert.equal(resAfterPart2OnNat.score, 100, 'Điểm đạt 100%');
assert.equal(resAfterPart2OnNat.daVaoTrangCuoi, true, 'daVaoTrangCuoi = true');

// 9.6: Kiểm tra cơ chế tự động chuyển hash về #IP:Firewall.NAT khi nhấn OK trong onSimSave
const mockSimWin = {
  location: { hash: '#IP:Firewall.NAT.new' },
  document: {
    querySelectorAll: () => [],
    querySelector: () => null
  },
  setTimeout: (fn, delay) => { fn(); }
};
lesson.onSimSave(mockSimWin);
assert.equal(mockSimWin.location.hash, '#IP:Firewall.NAT', 'onSimSave phải tự động chuyển hash về #IP:Firewall.NAT khi lưu trong hộp thoại');
console.log('✔ Kiểm tra đủ 8 thông số Phần 1, 6 thông số Phần 2, tự động chuyển hash ra bảng NAT kích hoạt Bước 16 & nút Nộp bài hoàn hảo!');

console.log('\n--- TEST 10: KIỂM TRA BƯỚC 17 MỞ KHÓA SRC. ADDRESS KHI VÀO FORM PHẦN 2 (CHAIN ĐÃ MẶC ĐỊNH SRCNAT) ---');
const step17Nut = tooltips.find(t => t.text.includes('Bước 17:') && t.text.includes('Mở khóa'));
const step17Inp = tooltips.find(t => t.text.includes('Bước 17:') && t.text.includes('Nhập'));
assert.ok(step17Nut && step17Inp, 'Tìm thấy Bước 17 (Mở khóa và Nhập)');

// Khi KTV vừa bấm Add New vào form Phần 2 (Chain mặc định là srcnat, ô Src. Address đang khóa)
sandbox.window.mkBai6Reset();
sandbox.window._FTC_MK6_RULE_PORT_SAVED = true; // Phần 1 đã xong
const mockTrChainP2 = {
  querySelectorAll: (sel) => {
    if (sel.includes('input') || sel.includes('select')) {
      return [{ tagName: 'INPUT', value: 'srcnat', type: 'text', style: {}, disabled: false }];
    }
    return [];
  },
  querySelector: (sel) => {
    if (sel.includes('td.label') || sel.includes('th') || sel.includes('td:first-child')) {
      return { textContent: 'Chain' };
    }
    if (sel.includes('input')) {
      return { tagName: 'INPUT', value: 'srcnat', type: 'text', style: {}, disabled: false };
    }
    return null;
  }
};
const mockTrSrcP2 = {
  querySelectorAll: () => [],
  querySelector: (sel) => {
    if (sel.includes('td.label') || sel.includes('th') || sel.includes('td:first-child')) {
      return { textContent: 'Src. Address' };
    }
    if (sel.includes('td.extra a.sbtn img') || sel.includes('img')) {
      return { src: 'down.svg' }; // Khóa
    }
    return null;
  }
};
const mockDocPart2New = {
  location: { hash: '#IP:Firewall.NAT.new' },
  querySelectorAll: (sel) => (sel === 'tr' ? [mockTrChainP2, mockTrSrcP2] : []),
  querySelector: () => null
};

// Bước 17 Mở khóa ô Src. Address PHẢI hiển thị ngay lập tức (không bị kẹt ở Chain)!
assert.equal(step17Nut.condition(mockDocPart2New), true, 'Bước 17 (Mở khóa ô Src. Address) phải hiển thị ngay khi vừa mở form Phần 2');
assert.equal(step17Inp.condition(mockDocPart2New), false, 'Bước 17 (Nhập) chưa hiển thị khi chưa mở khóa');

console.log('✔ Bước 17 mở khóa Src. Address hiển thị ngay khi mở form Phần 2, giải phóng hoàn toàn tình trạng kẹt Chain!');

console.log('\n================================================================');
console.log('TẤT CẢ CÁC BÀI KIỂM THỬ BÀI 6 NAT PORT (23 BƯỚC) ĐỀU ĐẠT 100%!');
console.log('================================================================');
