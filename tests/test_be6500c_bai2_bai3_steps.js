const assert = require('assert');
const fs = require('fs');
const path = require('path');

console.log('================================================================');
console.log('KIỂM THỬ ĐẶC TẢ BÀI 2 & BÀI 3 AP BE6500C: GENERAL & STEPS FLOW');
console.log('================================================================\n');

const root = path.resolve(__dirname, '..');

// Helper load lesson
function loadLesson(relPath, id) {
  const code = fs.readFileSync(path.join(root, relPath), 'utf8');
  const mockWindow = { DEVICE_BE6500C_LESSONS: [] };
  const fn = new Function('window', code);
  fn(mockWindow);
  return mockWindow.DEVICE_BE6500C_LESSONS.find(l => l.id === id);
}

// 1. Kiểm tra Bài 2
const bai2 = loadLesson('devices/be6500c/lessons/bai2.js', 'be6500c-bai2');
assert.ok(bai2, 'Bài 2 AP BE6500C phải tồn tại');

console.log('--- TEST BÀI 2: be6500c-bai2 ---');
// Step 1: Chọn menu Wi-Fi
assert.strictEqual(bai2.guidePopups[0].text, 'Bước 1: Chọn menu Wi-Fi');
// Step 2: Chọn General (ĐÃ BỎ nút Use separate network)
assert.strictEqual(bai2.guidePopups[1].text, 'Bước 2: Chọn General');
assert.ok(bai2.guidePopups[1].selector.includes('General'), 'Selector Bước 2 phải trỏ vào General');
assert.ok(!bai2.guidePopups.some(p => p.selector.includes('useSeparateNetwork')),
  'Không được chứa popup trỏ vào Use separate network');
// Step 3: Nhập tên Wi-Fi
assert.strictEqual(bai2.guidePopups[2].text, 'Bước 3: Nhập tên Wi-Fi, ví dụ: FPT Telecom');
// Step 4: Nhập mật khẩu
assert.strictEqual(bai2.guidePopups[3].text, 'Bước 4: Nhập mật khẩu, ví dụ: fpt12345');
// Step 5: Save
assert.strictEqual(bai2.guidePopups[4].text, 'Bước 5: Nhấp chọn Save để lưu cấu hình');
assert.strictEqual(bai2.guidePopups.length, 5, 'Bài 2 phải có đúng 5 bước');
console.log('✔ Bài 2: Đã loại bỏ popup Use separate network và thêm bước chọn General chuẩn xác.');

// 2. Kiểm tra Bài 3
const bai3 = loadLesson('devices/be6500c/lessons/bai3.js', 'be6500c-bai3');
assert.ok(bai3, 'Bài 3 AP BE6500C phải tồn tại');

console.log('\n--- TEST BÀI 3: be6500c-bai3 ---');
// Step 1: Chọn Wi-Fi
assert.strictEqual(bai3.guidePopups[0].text, 'Bước 1: Chọn Wi-Fi');
// Step 2: Chọn General
assert.strictEqual(bai3.guidePopups[1].text, 'Bước 2: Chọn General');
assert.ok(bai3.guidePopups[1].selector.includes('General'), 'Selector Bước 2 phải trỏ vào General');
// Step 3: Chuyển sang tab SMARTHOME NETWORK
assert.strictEqual(bai3.guidePopups[2].text, 'Bước 3: Chuyển sang tab SMARTHOME NETWORK');
// Step 4: Nhập tên Wi-Fi cho IoT
assert.strictEqual(bai3.guidePopups[3].text, 'Bước 4: Nhập tên Wi-Fi cho IoT (VD: FPT IoT)');
// Step 5: Nhập mật khẩu cho IoT
assert.strictEqual(bai3.guidePopups[4].text, 'Bước 5: Nhập mật khẩu cho IoT (VD: fpt12345)');
// Step 6: Save
assert.strictEqual(bai3.guidePopups[5].text, 'Bước 6: Chọn Save để lưu cấu hình');
assert.strictEqual(bai3.guidePopups.length, 6, 'Bài 3 phải có đúng 6 bước');
console.log('✔ Bài 3: Đã thêm bước 2 Chọn General chuẩn xác.');

console.log('\n================================================================');
console.log('TẤT CẢ KIỂM THỬ ĐẶC TẢ BÀI 2 & 3 AP BE6500C ĐÃ VƯỢT QUA 100%!');
console.log('================================================================');
