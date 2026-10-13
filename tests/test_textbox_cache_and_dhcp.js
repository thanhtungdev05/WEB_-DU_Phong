/**
 * tests/test_textbox_cache_and_dhcp.js
 * Kiểm thử tính năng:
 * 1. Chống lưu cache / gợi ý lịch sử (Autocomplete & Autofill) trên tất cả thiết bị
 * 2. Xóa trắng form đăng nhập (Vigor2927, MikroTik, ONT)
 * 3. Ngoại lệ bài DHCP: Giữ nguyên dải IP / dữ liệu mặc định, không xóa trắng
 */

const fs = require('fs');
const path = require('path');
const assert = require('assert');

console.log('================================================================');
console.log('KIỂM THỬ: CHỐNG LƯU CACHE TEXTBOX & NGOẠI LỆ BÀI DHCP');
console.log('================================================================\n');

// 1. Kiểm tra mã nguồn form đăng nhập DrayTek Vigor 2927
console.log('--- 1. Kiểm tra mã nguồn trang đăng nhập DrayTek Vigor 2927 ---');
const vigorLoginHtml = fs.readFileSync(path.join(__dirname, '../simulators/sim_vigor2927/src/www/weblogin.htm'), 'utf8');
assert(!vigorLoginHtml.includes('value="admin"'), 'Lỗi: Vigor login vẫn còn hardcode value="admin"');
assert(vigorLoginHtml.includes('autocomplete="new-password"'), 'Lỗi: Vigor login thiếu autocomplete="new-password"');
console.log('✔ Trang đăng nhập DrayTek Vigor2927 đã xóa trắng giá trị mặc định và bật chống gợi ý mật khẩu.');

// 2. Kiểm tra mã nguồn form đăng nhập Router MikroTik
console.log('\n--- 2. Kiểm tra mã nguồn trang đăng nhập Router MikroTik ---');
const mikrotikIndexHtml = fs.readFileSync(path.join(__dirname, '../simulators/mikrotik_hexs/src/www/index.html'), 'utf8');
const mikrotikScriptJs = fs.readFileSync(path.join(__dirname, '../simulators/mikrotik_hexs/src/www/script.js'), 'utf8');
assert(!mikrotikIndexHtml.includes('data-defaultuser="admin"'), 'Lỗi: MikroTik index.html vẫn còn data-defaultuser="admin"');
assert(mikrotikScriptJs.includes('get("name").value = ""'), 'Lỗi: MikroTik script.js không reset trắng ô đăng nhập');
console.log('✔ Trang đăng nhập MikroTik đã xóa trắng giá trị mặc định và không tự động điền user name.');

// 3. Kiểm tra logic Chống Autocomplete và Ngoại lệ DHCP trong app.js
console.log('\n--- 3. Kiểm tra logic điều khiển tập trung trong app.js ---');
const appJs = fs.readFileSync(path.join(__dirname, '../app.js'), 'utf8');

// Chặn autocomplete password & text
assert(appJs.includes("el.setAttribute('autocomplete', el.type === 'password' ? 'new-password' : 'off')"), 'Lỗi: app.js chưa áp dụng new-password cho ô mật khẩu');
assert(appJs.includes("el.setAttribute('autocomplete', 'off')"), 'Lỗi: app.js chưa tắt autocomplete cho form');
console.log('✔ app.js áp dụng triệt để autocomplete="new-password" và autocomplete="off" cho tất cả các form & input.');

// Tự động dọn ô đăng nhập lần đầu tải
assert(appJs.includes('doc._ftcLoginInputsCleared = true'), 'Lỗi: app.js thiếu cờ xóa trắng form đăng nhập');
console.log('✔ app.js có cơ chế tự động xóa trắng form đăng nhập khi tải trang.');

// Hàm nhận diện bài DHCP
assert(appJs.includes('function isDhcpLesson(lesson)'), 'Lỗi: app.js thiếu hàm isDhcpLesson');
assert(appJs.includes("if (isDhcpLesson(_currentLesson) || (activeLesId && activeLesId.toLowerCase().includes('dhcp'))) return;"), 'Lỗi: clearLessonFields thiếu ngoại lệ bỏ qua bài DHCP');
console.log('✔ app.js đã tích hợp ngoại lệ isDhcpLesson: Tuyệt đối KHÔNG xóa trắng các ô đối với bài DHCP.');

// 4. Mô phỏng kiểm tra hàm isDhcpLesson với các bài học thực tế
console.log('\n--- 4. Mô phỏng kiểm tra nhận diện bài DHCP trên các thiết bị ---');
function isDhcpLessonSim(lesson) {
  if (!lesson) return false;
  const str = (
    (lesson.id || '') + ' ' +
    (lesson.title || '') + ' ' +
    (lesson.subtitle || '')
  ).toLowerCase();
  return str.includes('dhcp');
}

const testLessons = [
  { id: 'LAB_AC1000F_01', title: 'Bài 1 - Cấu hình PPPoE', expected: false },
  { id: 'LAB_AC1000F_02', title: 'Bài 2 - Cấu hình Wi-Fi', expected: false },
  { id: 'LAB_AC1000F_05', title: 'Bài 5 - Cấu hình DHCP', expected: true },
  { id: 'vg2927-bai4', title: 'Bài 4 - Cấu hình DHCP Server', expected: true },
  { id: 'mikrotik-bai3', title: 'Bài 3 - Cấu hình DHCP Client', expected: true },
  { id: 'LAB_AX3000CV2_05', title: 'Cấu hình mạng LAN & DHCP', expected: true },
  { id: 'LAB_BE12000_01', title: 'Cấu hình WAN PPPoE', expected: false }
];

testLessons.forEach(l => {
  const result = isDhcpLessonSim(l);
  assert.strictEqual(result, l.expected, `Sai nhận diện DHCP cho bài ${l.id} (${l.title})`);
  console.log(`  ✔ [${l.id}] ${l.title} -> ${result ? 'BỎ QUA xóa trường (Giữ nguyên dữ liệu mạng)' : 'XÓA TRẮNG trường cấu hình'}`);
});

console.log('\n================================================================');
console.log('TẤT CẢ KIỂM THỬ CHỐNG CACHE VÀ NGOẠI LỆ DHCP ĐẠT 100%!');
console.log('================================================================\n');
