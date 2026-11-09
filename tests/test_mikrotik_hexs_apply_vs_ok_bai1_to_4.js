/**
 * tests/test_mikrotik_hexs_apply_vs_ok_bai1_to_4.js
 * Kiểm thử chi tiết yêu cầu:
 * "Bài 1, 2, 3, 4 của Router MikroTik khi bấm Apply thì nút nộp bài & chấm điểm
 * KHÔNG sáng lên, chỉ khi bấm nút OK thì nút nộp bài & chấm điểm mới sáng xanh lên"
 */

const assert = require('assert');
const fs = require('fs');
const path = require('path');
const vm = require('vm');

const ROOT_DIR = path.resolve(__dirname, '..');

// 1. Tạo môi trường DOM giả lập mô phỏng portal và app.js
const appJsCode = fs.readFileSync(path.join(ROOT_DIR, 'app.js'), 'utf8');
const bai1Code = fs.readFileSync(path.join(ROOT_DIR, 'devices/mikrotik_hexs/lessons/bai1.js'), 'utf8');
const bai2Code = fs.readFileSync(path.join(ROOT_DIR, 'devices/mikrotik_hexs/lessons/bai2.js'), 'utf8');
const bai3Code = fs.readFileSync(path.join(ROOT_DIR, 'devices/mikrotik_hexs/lessons/bai3.js'), 'utf8');
const bai4Code = fs.readFileSync(path.join(ROOT_DIR, 'devices/mikrotik_hexs/lessons/bai4.js'), 'utf8');

function taoSandbox() {
  const elements = {};
  function makeEl(id) {
    return {
      id: id,
      style: {},
      disabled: false,
      classList: {
        contains: () => false,
        add: () => {},
        remove: () => {}
      },
      querySelectorAll: () => [],
      querySelector: () => null
    };
  }

  const btnSubmitLab = makeEl('btn-submit-lab');
  const btnGuideErrors = makeEl('btn-guide-errors');

  const sandbox = {
    window: {
      ftcLayCheDo: () => 'guide'
    },
    document: {
      getElementById: (id) => {
        if (id === 'btn-submit-lab') return btnSubmitLab;
        if (id === 'btn-guide-errors') return btnGuideErrors;
        return null;
      },
      querySelectorAll: () => [],
      querySelector: () => null,
      addEventListener: () => {}
    },
    setInterval: () => 1,
    setTimeout: (fn) => { fn(); return 1; },
    console: console
  };
  sandbox.window = sandbox;
  sandbox.ftcLayCheDo = () => 'guide';
  vm.createContext(sandbox);
  return { sandbox, btnSubmitLab, btnGuideErrors };
}

console.log('================================================================');
console.log('KIỂM THỬ: APPLY KHÔNG SÁNG NÚT NỘP BÀI - CHỈ OK MỚI SÁNG (BÀI 1-4)');
console.log('================================================================\n');

// ── BÀI 1 ─────────────────────────────────────────────────────────────
console.log('--- TEST BÀI 1: Cấu hình PPPoE ---');
{
  const { sandbox } = taoSandbox();
  vm.runInContext(bai1Code, sandbox);
  const lesson = sandbox.window.DEVICE_MIKROTIK_HEXS_LESSONS.find(l => l.id === 'mikrotik_hexs-bai1');
  assert.ok(lesson, 'Bài 1 phải tồn tại');

  // Trường hợp 1: Nhấn Apply với cấu hình đúng
  sandbox.window._FTC_MK_BAI1_LIVE = {
    'User': 'sgfdl-211208-218',
    'Password': 'ftc1234',
    'Enabled': true,
    'Name': 'pppoe-out1',
    'Max MTU': '1480',
    'Max MRU': '1480',
    'MRRU': '1614',
    'Interfaces': 'ether1',
    'Service': '',
    'AC Name': '',
    'Host Uniq': '',
    'Profile': 'default',
    'Keepalive Timeout': '10',
    'Dial On Demand': false,
    'Use Peer DNS': true,
    'Add Default Route': false,
    'Default Route Distance': '1',
    'Allow': [false, false, true, true]
  };
  sandbox.window._FTC_MK_BAI1_APPLIED = true;
  sandbox.window._FTC_MK_BAI1_OK = false;
  sandbox.window._FTC_MK_BAI1 = null;

  let resApply = lesson.grading.customGrading([]);
  assert.equal(resApply.passed, false, 'Bài 1: Khi mới Apply thì passed PHẢI LÀ FALSE (chưa sáng nút Nộp bài)');
  assert.equal(resApply.daVaoTrangCuoi, false, 'Bài 1: daVaoTrangCuoi phải là false để ẩn nút lỗi');
  assert.equal(resApply.trangHienTaiDat, true, 'Bài 1: trangHienTaiDat phải là true vì đã nhập đúng');
  console.log('✔ Bài 1 khi Apply: passed=false, daVaoTrangCuoi=false, trangHienTaiDat=true -> Nút nộp bài KHÔNG sáng!');

  // Trường hợp 2: Nhấn OK
  sandbox.window._FTC_MK_BAI1_OK = true;
  sandbox.window._FTC_MK_BAI1 = Object.assign({}, sandbox.window._FTC_MK_BAI1_LIVE);

  let resOk = lesson.grading.customGrading([]);
  assert.equal(resOk.passed, true, 'Bài 1: Khi nhấn OK thì passed PHẢI LÀ TRUE (nút Nộp bài sáng xanh)');
  assert.equal(resOk.score, 100, 'Bài 1: Điểm phải là 100%');
  console.log('✔ Bài 1 khi OK: passed=true, score=100% -> Nút nộp bài SÁNG XANH!\n');
}

// ── BÀI 2 ─────────────────────────────────────────────────────────────
console.log('--- TEST BÀI 2: Cấu hình giới hạn băng thông (Simple Queue) ---');
{
  const { sandbox } = taoSandbox();
  vm.runInContext(bai2Code, sandbox);
  const lesson = sandbox.window.DEVICE_MIKROTIK_HEXS_LESSONS.find(l => l.id === 'mikrotik_hexs-bai2');
  assert.ok(lesson, 'Bài 2 phải tồn tại');

  // Trường hợp 1: Nhấn Apply
  sandbox.window._FTC_MK_BAI2_LIVE = {
    'Enabled#0': true,
    'Comment#0': '',
    'Name#0': 'under_5M',
    'Target#0': '192.168.1.0/24',
    'Dst.#0': '0.0.0.0/0',
    'Max Limit#0': '2M',
    'Max Limit#1': '5M',
    'Burst Limit#0': '0',
    'Burst Limit#1': '0',
    'Burst Threshold#0': '0',
    'Burst Threshold#1': '0',
    'Burst Time#0': '0',
    'Burst Time#1': '0'
  };
  sandbox.window._FTC_MK2_APPLIED = true;
  sandbox.window._FTC_MK_BAI2_OK = false;
  sandbox.window._FTC_MK_BAI2_SAVED = false;
  sandbox.window._FTC_MK_BAI2 = null;

  let resApply = lesson.grading.customGrading([]);
  assert.equal(resApply.passed, false, 'Bài 2: Khi mới Apply thì passed PHẢI LÀ FALSE (chưa sáng nút Nộp bài)');
  assert.equal(resApply.daVaoTrangCuoi, false, 'Bài 2: daVaoTrangCuoi phải là false để ẩn nút lỗi');
  assert.equal(resApply.trangHienTaiDat, true, 'Bài 2: trangHienTaiDat phải là true');
  console.log('✔ Bài 2 khi Apply: passed=false, daVaoTrangCuoi=false, trangHienTaiDat=true -> Nút nộp bài KHÔNG sáng!');

  // Trường hợp 2: Nhấn OK
  sandbox.window._FTC_MK_BAI2_OK = true;
  sandbox.window._FTC_MK_BAI2_SAVED = true;
  sandbox.window._FTC_MK_BAI2 = Object.assign({}, sandbox.window._FTC_MK_BAI2_LIVE);

  let resOk = lesson.grading.customGrading([]);
  assert.equal(resOk.passed, true, 'Bài 2: Khi nhấn OK thì passed PHẢI LÀ TRUE (nút Nộp bài sáng xanh)');
  assert.equal(resOk.score, 100, 'Bài 2: Điểm phải là 100%');
  console.log('✔ Bài 2 khi OK: passed=true, score=100% -> Nút nộp bài SÁNG XANH!\n');
}

// ── BÀI 3 ─────────────────────────────────────────────────────────────
console.log('--- TEST BÀI 3: Cấu hình Bind IP to MAC ---');
{
  const { sandbox } = taoSandbox();
  vm.runInContext(bai3Code, sandbox);
  const lesson = sandbox.window.DEVICE_MIKROTIK_HEXS_LESSONS.find(l => l.id === 'mikrotik_hexs-bai3');
  assert.ok(lesson, 'Bài 3 phải tồn tại');

  // Trường hợp 1: Nhấn Apply
  sandbox.window._FTC_MK_BAI3_LIVE = {
    'Comment#0': 'Server 1',
    'Enabled#0': true,
    'Address#1': '192.168.1.249',
    'MAC Address#0': '00:50:79:66:68:00',
    'Use Src. MAC Address#0': false,
    'Client ID#0': '1:0:50:79:66:68:0',
    'Server#0': 'LAN-DHCP-Server',
    'Lease Time#0': '00:00:00',
    'Block Access#0': false,
    'Allow Dual Stack Queue#0': true,
    'Always Broadcast#0': false,
    'DHCP Option Set#0': '',
    'Rate Limit#0': '',
    'Routes#0': '',
    'Insert Queue Before#0': 'first'
  };
  sandbox.window._FTC_MK_BAI3_DA_STATIC = true;
  sandbox.window._FTC_MK3_APPLIED = true;
  sandbox.window._FTC_MK_BAI3_OK = false;
  sandbox.window._FTC_MK_BAI3_SAVED = false;
  sandbox.window._FTC_MK_BAI3 = null;

  let resApply = lesson.grading.customGrading([]);
  assert.equal(resApply.passed, false, 'Bài 3: Khi mới Apply thì passed PHẢI LÀ FALSE (chưa sáng nút Nộp bài)');
  assert.equal(resApply.daVaoTrangCuoi, false, 'Bài 3: daVaoTrangCuoi phải là false để ẩn nút lỗi');
  assert.equal(resApply.trangHienTaiDat, true, 'Bài 3: trangHienTaiDat phải là true');
  console.log('✔ Bài 3 khi Apply: passed=false, daVaoTrangCuoi=false, trangHienTaiDat=true -> Nút nộp bài KHÔNG sáng!');

  // Trường hợp 2: Nhấn OK
  sandbox.window._FTC_MK_BAI3_OK = true;
  sandbox.window._FTC_MK_BAI3_SAVED = true;
  sandbox.window._FTC_MK_BAI3 = Object.assign({}, sandbox.window._FTC_MK_BAI3_LIVE);

  let resOk = lesson.grading.customGrading([]);
  assert.equal(resOk.passed, true, 'Bài 3: Khi nhấn OK thì passed PHẢI LÀ TRUE (nút Nộp bài sáng xanh)');
  assert.equal(resOk.score, 100, 'Bài 3: Điểm phải là 100%');
  console.log('✔ Bài 3 khi OK: passed=true, score=100% -> Nút nộp bài SÁNG XANH!\n');
}

// ── BÀI 4 ─────────────────────────────────────────────────────────────
console.log('--- TEST BÀI 4: Cấu hình DHCP (Addresses + Pool + Networks) ---');
{
  const { sandbox } = taoSandbox();
  vm.runInContext(bai4Code, sandbox);
  const lesson = sandbox.window.DEVICE_MIKROTIK_HEXS_LESSONS.find(l => l.id === 'mikrotik_hexs-bai4');
  assert.ok(lesson, 'Bài 4 phải tồn tại');

  // Đã xong phần 1 và 2 đầy đủ (đã OK)
  sandbox.window._FTC_MK_BAI4 = {
    addresses: {
      'Enabled': true,
      'Address': '192.168.10.1/24',
      'Network': '192.168.10.0',
      'Interface': 'bridge-LAN'
    },
    pool: {
      'Name': 'dhcp-pool-lan',
      'Addresses': '192.168.10.10-192.168.10.254',
      'Next Pool': 'none'
    },
    networks: {
      'Address': '192.168.10.0/24',
      'Gateway': '192.168.10.1',
      'Netmask': '0',
      'No DNS': false,
      'DNS Servers#0': '8.8.8.8',
      'DNS Servers#1': '8.8.4.4',
      'Domain': '',
      'Next Server': '0.0.0.0',
      'Boot File Name': ''
    }
  };
  sandbox.window._FTC_MK_BAI4_ADDRESSES_OK = true;
  sandbox.window._FTC_MK_BAI4_ADDRESSES_SAVED = true;
  sandbox.window._FTC_MK_BAI4_POOL_OK = true;
  sandbox.window._FTC_MK_BAI4_POOL_SAVED = true;

  // Phần 3: Mới nhấn Apply (chưa OK)
  sandbox.window._FTC_MK4_NET_APPLIED = true;
  sandbox.window._FTC_MK_BAI4_NETWORKS_OK = false;
  sandbox.window._FTC_MK_BAI4_NETWORKS_SAVED = false;
  sandbox.window._ftcMkApplyOnly = true;

  let resApply = lesson.grading.customGrading([]);
  assert.equal(resApply.passed, false, 'Bài 4: Khi Networks mới Apply thì passed PHẢI LÀ FALSE (chưa sáng nút Nộp bài)');
  assert.equal(resApply.daVaoTrangCuoi, false, 'Bài 4: daVaoTrangCuoi phải là false để ẩn nút lỗi');
  assert.equal(resApply.trangHienTaiDat, true, 'Bài 4: trangHienTaiDat phải là true');
  console.log('✔ Bài 4 khi Networks mới Apply: passed=false, daVaoTrangCuoi=false, trangHienTaiDat=true -> Nút nộp bài KHÔNG sáng!');

  // Phần 3: Đã nhấn OK
  sandbox.window._FTC_MK_BAI4_NETWORKS_OK = true;
  sandbox.window._FTC_MK_BAI4_NETWORKS_SAVED = true;
  sandbox.window._ftcMkApplyOnly = false;

  let resOk = lesson.grading.customGrading([]);
  assert.equal(resOk.passed, true, 'Bài 4: Khi Networks đã OK thì passed PHẢI LÀ TRUE (nút Nộp bài sáng xanh)');
  assert.equal(resOk.score, 100, 'Bài 4: Điểm phải là 100%');
  console.log('✔ Bài 4 khi Networks đã OK: passed=true, score=100% -> Nút nộp bài SÁNG XANH!\n');
}

console.log('================================================================');
console.log('TẤT CẢ CÁC BÀI 1, 2, 3, 4 ĐỀU ĐẠT 100% YÊU CẦU:');
console.log(' - Khi bấm Apply: Nút Nộp bài & Chấm điểm KHÔNG sáng lên');
console.log(' - Chỉ khi bấm OK: Nút Nộp bài & Chấm điểm MỚI sáng xanh lên');
console.log('================================================================');
