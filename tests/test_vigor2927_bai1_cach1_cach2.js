/**
 * tests/test_vigor2927_bai1_cach1_cach2.js
 * Kiểm tra Bài 1 DrayTek Vigor2927 (Cấu hình PPPoE) hỗ trợ cả Cách 1 và Cách 2:
 * - Cách 1: Giữ Access Mode = Static or Dynamic IP (iAccMode=2) -> bấm Details Page -> mở dp_01.html -> bấm tab PPPoE (#tab1.offtab) -> mở doc/inet4mwe.htm.
 * - Cách 2: Đổi Access Mode của WAN1 (select[name="iAccessMode0"]) sang PPPoE (iAccMode=1) -> bấm Details Page -> mở thẳng dp_00.html (tab PPPoE #tab1.ontab đã chọn sẵn, bỏ qua Bước 4, hiện từ Bước 5 -> Bước 8).
 * - Không hiển thị thêm tooltip ở select[name="iAccessMode0"] và không bắt lỗi thao tác thừa khi đổi select[name="iAccessMode0"].
 */

const fs = require('fs');
const path = require('path');
const vm = require('vm');
const assert = require('assert');

const root = path.resolve(__dirname, '..');

// 1. Nạp bài học và tooltips của Bài 1 Vigor2927
const tooltipsBai1Code = fs.readFileSync(path.join(root, 'devices/vigor2927/tooltips/bai1.js'), 'utf8');
const lessonBai1Code = fs.readFileSync(path.join(root, 'devices/vigor2927/lessons/bai1.js'), 'utf8');

const sandbox = {
  window: {
    TOOLTIPS_VIGOR2927: {},
    DEVICE_VIGOR2927_LESSONS: []
  }
};
sandbox.global = sandbox.window;
vm.createContext(sandbox);
vm.runInContext(tooltipsBai1Code, sandbox);
vm.runInContext(lessonBai1Code, sandbox);

const lesson = sandbox.window.DEVICE_VIGOR2927_LESSONS.find(l => l.id === 'vg2927-bai1');
assert.ok(lesson, 'Phải tìm thấy bài học vg2927-bai1');

// 2. Kiểm tra không thêm tooltip vào select[name="iAccessMode0"] nhưng có trong allowedSelectors
const popups = lesson.guidePopups;
assert.strictEqual(popups.length, 8, 'Danh sách guidePopups vẫn giữ nguyên 8 bước (không thêm tooltip cho Cách 2)');
const hasDropdownTooltip = popups.some(p => (p.selector || '').includes('iAccessMode0'));
assert.strictEqual(hasDropdownTooltip, false, 'Không được hiển thị tooltip trên select[name="iAccessMode0"]');

assert.ok(
  Array.isArray(lesson.allowedSelectors) && lesson.allowedSelectors.includes('select[name="iAccessMode0"]'),
  'lesson.allowedSelectors phải chứa select[name="iAccessMode0"] để không báo lỗi thao tác thừa ở Cách 2'
);
assert.ok(
  lesson.grading && Array.isArray(lesson.grading.allowedSelectors) && lesson.grading.allowedSelectors.includes('select[name="iAccessMode0"]'),
  'lesson.grading.allowedSelectors phải chứa select[name="iAccessMode0"]'
);

// 3. Kiểm tra định tuyến _routes.json và nội dung trang đích của Cách 1 (dp_01.html) & Cách 2 (dp_00.html)
const routes = JSON.parse(fs.readFileSync(path.join(root, 'simulators/sim_vigor2927/src/www/_routes.json'), 'utf8'));
assert.strictEqual(
  routes['/cgi-bin/wan.cgi?fid=105&iAccMode=2&iInetWanIdx=1'],
  '_pages/dp_01.html',
  'Cách 1 (iAccMode=2) phải trỏ tới _pages/dp_01.html'
);
assert.strictEqual(
  routes['/cgi-bin/wan.cgi?fid=105&iAccMode=1&iInetWanIdx=1'],
  '_pages/dp_00.html',
  'Cách 2 (iAccMode=1) phải trỏ tới _pages/dp_00.html'
);

const dp01Html = fs.readFileSync(path.join(root, 'simulators/sim_vigor2927/src/www/_pages/dp_01.html'), 'utf8');
const dp00Html = fs.readFileSync(path.join(root, 'simulators/sim_vigor2927/src/www/_pages/dp_00.html'), 'utf8');

// Ở Cách 1 (dp_01.html): #tab1 có class offtab -> Bước 4 (#tab1.offtab) sẽ hiện
assert.ok(dp01Html.includes('class=offtab id=tab1'), 'dp_01.html (Cách 1) phải có #tab1.offtab để hiện Bước 4');

// Ở Cách 2 (dp_00.html): #tab1 đã có class ontab -> Bước 4 (#tab1.offtab, #tab1:not(.ontab)) tự động được bỏ qua
assert.ok(dp00Html.includes('class=ontab id=tab1'), 'dp_00.html (Cách 2) phải có #tab1.ontab để tự động bỏ qua Bước 4');

// Kiểm tra dp_00.html có đầy đủ các phần tử cho Bước 5, 6, 7, 8 và chấm điểm
assert.ok(dp00Html.includes('id="opt-pppoe-enable"'), 'dp_00.html phải có #opt-pppoe-enable');
assert.ok(dp00Html.includes('id="lbl-pppoe-disable"'), 'dp_00.html phải có #lbl-pppoe-disable cho Bước 5');
assert.ok(dp00Html.includes('id="opt-pppoe-username"'), 'dp_00.html phải có #opt-pppoe-username cho Bước 6');
assert.ok(dp00Html.includes('id="opt-pppoe-password"'), 'dp_00.html phải có #opt-pppoe-password cho Bước 7');
assert.ok(dp00Html.includes('id="btn-pppoe-ok"'), 'dp_00.html phải có #btn-pppoe-ok cho Bước 8');

// Kiểm tra dp_00.html đã được đồng bộ script khởi tạo giống doc/inet4mwe.htm
assert.ok(dp00Html.includes('/js/gettext.min.js'), 'dp_00.html phải nạp /js/gettext.min.js');
assert.ok(dp00Html.includes('/js/webchange.js'), 'dp_00.html phải nạp /js/webchange.js');
assert.ok(
  dp00Html.includes("appeinitScript.text=document.getElementById('inet4mweinit').value;document.head.appendChild(appeinitScript);"),
  'dp_00.html phải nạp biến khởi tạo từ #inet4mweinit'
);
assert.ok(
  dp00Html.includes('initPage();') && dp00Html.includes('initPara();'),
  'dp_00.html phải gọi initPage() và initPara() khi trang tải xong'
);

console.log('PASSED: DrayTek Vigor2927 Bài 1 hỗ trợ đầy đủ cả Cách 1 và Cách 2 (không hiện thêm tooltip cho Cách 2)!');
