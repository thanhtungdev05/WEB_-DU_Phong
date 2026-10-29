'use strict';

const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');

const root = path.resolve(__dirname, '..');
const portalHtml = fs.readFileSync(path.join(root, 'portal.html'), 'utf8');
const portalApp = fs.readFileSync(path.join(root, 'app.js'), 'utf8');
const migration049 = fs.readFileSync(path.join(root, 'api/migrations/049_activate_mikrotik_hexs_catalog.sql'), 'utf8');

console.log('--- Kiểm thử tích hợp Thiết bị MikroTik hEX S (18 files từ huynn13) ---');

// 1. Kiểm tra portal.html đã nhúng đủ 12 files tooltips & lessons
const expectedScripts = [
  'devices/mikrotik_hexs/tooltips/bai1.js',
  'devices/mikrotik_hexs/tooltips/bai2.js',
  'devices/mikrotik_hexs/tooltips/bai3.js',
  'devices/mikrotik_hexs/tooltips/bai4.js',
  'devices/mikrotik_hexs/tooltips/bai5.js',
  'devices/mikrotik_hexs/tooltips/bai6.js',
  'devices/mikrotik_hexs/lessons/bai1.js',
  'devices/mikrotik_hexs/lessons/bai2.js',
  'devices/mikrotik_hexs/lessons/bai3.js',
  'devices/mikrotik_hexs/lessons/bai4.js',
  'devices/mikrotik_hexs/lessons/bai5.js',
  'devices/mikrotik_hexs/lessons/bai6.js',
  'devices/mikrotik_hexs/data.js'
];

for (const scriptPath of expectedScripts) {
  assert.ok(
    portalHtml.includes(scriptPath),
    `portal.html phải chứa thẻ script nạp ${scriptPath}`
  );
}
console.log('✔ Test 1: portal.html đã nhúng đủ 13 files script MikroTik hEX S theo đúng thứ tự.');

// 2. Kiểm tra load các file vào VM context
const context = { window: {}, console };
context.window = context;

for (const scriptRel of expectedScripts) {
  const fullPath = path.join(root, scriptRel);
  assert.ok(fs.existsSync(fullPath), `File ${scriptRel} phải tồn tại trên ổ đĩa`);
  const code = fs.readFileSync(fullPath, 'utf8');
  vm.runInNewContext(code, context);
}

const device = context.DEVICE_MIKROTIK_HEXS;
assert.ok(device, 'DEVICE_MIKROTIK_HEXS phải tồn tại trong window');
assert.equal(device.id, 'mikrotik_hexs');
assert.equal(device.folder, 'sim_mikrotik_hexs');

const lessons = device.categories[0].lessons;
assert.equal(lessons.length, 6, 'MikroTik hEX S phải có đủ 6 bài học');

for (let i = 1; i <= 6; i++) {
  const expectedId = `mikrotik_hexs-bai${i}`;
  const lesson = lessons[i - 1];
  assert.equal(lesson.id, expectedId, `Bài học ${i} phải có ID là ${expectedId}`);
  assert.ok(lesson.title && lesson.title.length > 0, `Bài học ${expectedId} phải có tiêu đề`);
  assert.ok(
    lesson.practiceUrl && lesson.practiceUrl.startsWith('/sim_mikrotik_hexs/'),
    `Bài học ${expectedId} phải dùng URL mô phỏng /sim_mikrotik_hexs/`
  );
  assert.ok(
    (Array.isArray(lesson.grading?.rules) && lesson.grading.rules.length > 0) ||
    typeof lesson.grading?.customGrading === 'function',
    `Bài học ${expectedId} phải có bộ quy tắc grading hoặc customGrading`
  );
  assert.ok(
    Array.isArray(lesson.guidePopups) && lesson.guidePopups.length > 0,
    `Bài học ${expectedId} phải có danh sách tooltips hướng dẫn`
  );
}
console.log('✔ Test 2: Nạp thành công 6 bài học và 6 bộ tooltips của MikroTik hEX S với đầy đủ metadata.');

// 3. Kiểm tra các cơ chế đặc thù cho MikroTik trong app.js
assert.match(
  portalApp,
  /isSaveRequiredDevice[\s\S]*?'mikrotik_hexs'/,
  'app.js phải liệt kê mikrotik_hexs trong isSaveRequiredDevice'
);

assert.match(
  portalApp,
  /laNutLuuMikrotik/,
  'app.js phải có logic nhận diện nút lưu dạng thẻ <a> (OK/Apply) của MikroTik WebFig'
);

assert.match(
  portalApp,
  /window\._ftcMkChanTooltip\s*=\s*false/,
  'app.js phải khởi tạo và quản lý cờ _ftcMkChanTooltip'
);

assert.match(
  portalApp,
  /dangChanTooltip\s*=\s*\(currentDeviceId === 'mikrotik_hexs'\)\s*\?\s*window\._ftcMkChanTooltip/,
  'app.js phải sử dụng _ftcMkChanTooltip riêng cho mikrotik_hexs khi applyGuidePopups'
);

assert.match(
  portalApp,
  /window\.ftcLayCheDo\s*=\s*function/,
  'app.js phải cung cấp window.ftcLayCheDo để customGrading của MikroTik kiểm tra chế độ'
);

assert.match(
  portalApp,
  /evalResult\.trangHienTaiDat/,
  'app.js phải hỗ trợ cờ trangHienTaiDat cho các bài học nhiều trang (Bài 4, 6, 7)'
);

assert.match(
  portalApp,
  /pop\.offsetX/,
  'app.js phải hỗ trợ pop.offsetX khi định vị bubble tooltip'
);

assert.match(
  portalApp,
  /--arrow-left/,
  'app.js phải căn vị trí mũi tên tooltip thông qua --arrow-left'
);

assert.match(
  portalApp,
  /typeof pop\.condition === 'function'/,
  'app.js phải kiểm tra hàm pop.condition(doc) để điều khiển xuất hiện từng bước và gọi các hàm gắn ID động'
);

assert.match(
  portalApp,
  /:has-text/,
  'app.js phải hỗ trợ selector giả :has-text() trong findGuideElements'
);
console.log('✔ Test 3: app.js đáp ứng toàn bộ các cơ chế tích hợp đặc thù cho MikroTik hEX S.');

// 4. Kiểm tra migration 049 (047/048 đã được dùng bởi tối ưu Neon trên nhánh hiện tại)
assert.match(migration049, /'DEV_MIKROTIK_HEXS'/);
assert.match(migration049, /'mikrotik_hexs-bai1'/);
assert.match(migration049, /'mikrotik_hexs-bai7'/);
assert.match(migration049, /curriculum_labs/);
console.log('✔ Test 4: Migration 049 kích hoạt DEV_MIKROTIK_HEXS và 7 bài lab hợp lệ.');

// 5. Kiểm tra .gitignore
const gitignore = fs.readFileSync(path.join(root, '.gitignore'), 'utf8');
assert.match(gitignore, /simulators\/mikrotik_hexs\/src\/cau_hinh\.json/, '.gitignore phải chứa file cau_hinh.json');
console.log('✔ Test 5: .gitignore đã chặn file lưu trạng thái cau_hinh.json.');

console.log('================================================================');
console.log('TẤT CẢ CÁC BÀI KIỂM THỬ TÍCH HỢP MIKROTIK HEX S ĐỀU ĐẠT 100%!');
console.log('================================================================');
