'use strict';

const assert = require('assert');
const fs = require('fs');
const path = require('path');
const vm = require('vm');

console.log('================================================================');
console.log('KIỂM THỬ ĐẶC TẢ BÀI 5 AP BE6500C: LAN IP CÓ SẴN & AUTO-SYNC DHCP');
console.log('================================================================\n');

const root = path.resolve(__dirname, '..');

// 1. Kiểm tra bai5.js
const bai5Code = fs.readFileSync(path.join(root, 'devices/be6500c/lessons/bai5.js'), 'utf8');
const mockWindow = { DEVICE_BE6500C_LESSONS: [] };
const fn = new Function('window', bai5Code);
fn(mockWindow);
const bai5 = mockWindow.DEVICE_BE6500C_LESSONS.find(l => l.id === 'be6500c-bai5');
assert.ok(bai5, 'Bài 5 be6500c-bai5 phải tồn tại');

// 1.1. clearFields không được xóa IP và Mask của Router
assert.ok(Array.isArray(bai5.clearFields) && bai5.clearFields.length === 0,
  'clearFields phải là mảng rỗng để giữ nguyên IP và Subnet Mask có sẵn của Router');

// 1.2. Hướng dẫn, Tooltip Bước 3 và Luật chấm điểm phải yêu cầu đổi sang 192.168.10.1
assert.ok(bai5.instructions.some(i => i.includes('192.168.10.1')), 'Instructions phải yêu cầu 192.168.10.1');
const step3 = bai5.guidePopups.find(p => p.selector && p.selector.includes('ipv4Settings.ipAddress'));
assert.ok(step3 && step3.text.includes('192.168.10.1') && step3.expected === '192.168.10.1',
  'Tooltip Bước 3 phải hướng dẫn và mong đợi 192.168.10.1');
const lanIpRule = bai5.grading.rules.find(r => r.id === 'lan_ip');
assert.ok(lanIpRule && lanIpRule.expected === '192.168.10.1',
  'Luật chấm điểm lan_ip phải mong đợi 192.168.10.1');
// 1.3. allowedSelectors phải bao gồm DHCP Start IP và End IP để không bị Auto-Baseline bắt lỗi thao tác thừa
assert.ok(bai5.allowedSelectors.includes('input[name="ipv4Settings.dhcp.startAddress"]'), 'allowedSelectors phải chứa dhcp.startAddress');
assert.ok(bai5.allowedSelectors.includes('input[name="ipv4Settings.dhcp.endAddress"]'), 'allowedSelectors phải chứa dhcp.endAddress');
assert.ok(bai5.grading.allowedSelectors.includes('input[name="ipv4Settings.dhcp.startAddress"]'), 'grading.allowedSelectors phải chứa dhcp.startAddress');
assert.ok(bai5.grading.allowedSelectors.includes('input[name="ipv4Settings.dhcp.endAddress"]'), 'grading.allowedSelectors phải chứa dhcp.endAddress');
console.log('✔ Test 1: clearFields là mảng rỗng, đề bài & Tooltip Bước 3 & grading rule mong đợi 192.168.10.1, allowedSelectors chứa DHCP Start/End IP.');

// 2. Kiểm tra giao diện HTML của simulator sim_ONT_be6500c (dùng cho AP BE6500C)
const simHtml = fs.readFileSync(path.join(root, 'simulators/sim_ONT_be6500c/src/www/advanced__lan.html'), 'utf8');
assert.ok(simHtml.includes('name="ipv4Settings.ipAddress" type="text" class="MuiInputBase-input MuiOutlinedInput-input css-1x5jdmq" value="192.168.1.1"'),
  'HTML phải có sẵn IP Address mặc định 192.168.1.1');
assert.ok(simHtml.includes('name="ipv4Settings.mask" type="text" class="MuiInputBase-input MuiOutlinedInput-input MuiInputBase-inputAdornedEnd MuiAutocomplete-input MuiAutocomplete-inputFocused css-1uvydh2" aria-autocomplete="list" aria-expanded="false" autocapitalize="none" spellcheck="false" role="combobox" value="255.255.255.0"'),
  'HTML phải có sẵn Subnet Mask mặc định 255.255.255.0');
assert.ok(simHtml.includes('function wireDhcpAutoSync()'),
  'advanced__lan.html phải nhúng inline hàm wireDhcpAutoSync để chống cache trình duyệt 100%');
console.log('✔ Test 2: advanced__lan.html có sẵn IP 192.168.1.1, Subnet Mask 255.255.255.0 và nhúng inline wireDhcpAutoSync.');

// 3. Kiểm tra logic auto-sync DHCP trong interact.js
const interactJs = fs.readFileSync(path.join(root, 'simulators/sim_ONT_be6500c/src/www/interact.js'), 'utf8');
assert.ok(interactJs.includes('wireDhcpAutoSync'), 'interact.js phải định nghĩa wireDhcpAutoSync');
assert.ok(interactJs.includes("prefix + '.2'"), 'Phải cập nhật startAddress thành prefix + .2');
assert.ok(interactJs.includes("prefix + '.254'"), 'Phải cập nhật endAddress thành prefix + .254');
console.log('✔ Test 3: interact.js chứa hàm wireDhcpAutoSync tự động cập nhật dải DHCP.');

// 4. Mô phỏng chạy wireDhcpAutoSync trên mock DOM
{
  class MockElement {
    constructor(name, val = '') {
      this.name = name;
      this.value = val;
      this._attrs = { name, value: val };
    }
    matches(sel) {
      return sel.includes(this.name);
    }
    closest() {
      return null;
    }
    setAttribute(k, v) {
      this._attrs[k] = v;
      if (k === 'value') this.value = v;
    }
    getAttribute(k) {
      return this._attrs[k];
    }
  }

  const ipInput = new MockElement('ipv4Settings.ipAddress', '192.168.1.1');
  const startInput = new MockElement('ipv4Settings.dhcp.startAddress', '192.168.1.2');
  const endInput = new MockElement('ipv4Settings.dhcp.endAddress', '192.168.1.254');

  const listeners = {};
  const mockDoc = {
    createElement: () => ({ setAttribute: () => {}, appendChild: () => {} }),
    querySelectorAll: () => [],
    head: { appendChild: () => {} },
    addEventListener: (evt, handler, capture) => {
      listeners[evt] = listeners[evt] || [];
      listeners[evt].push(handler);
    },
    querySelector: (sel) => {
      if (sel.includes('ipAddress')) return ipInput;
      if (sel.includes('startAddress')) return startInput;
      if (sel.includes('endAddress')) return endInput;
      return null;
    }
  };
  ipInput.ownerDocument = mockDoc;

  // Thực thi interact.js trong sandbox
  const sandbox = {
    document: mockDoc,
    window: { matchMedia: () => ({ matches: false }) },
    console: console,
    Event: function (type) { this.type = type; }
  };
  vm.createContext(sandbox);
  vm.runInContext(interactJs, sandbox);

  // Kích hoạt đổi IP sang 192.168.10.1
  ipInput.value = '192.168.10.1';
  listeners['input'].forEach(fn => fn({ target: ipInput }));

  assert.strictEqual(startInput.value, '192.168.10.2', 'Start IP phải tự đổi thành 192.168.10.2');
  assert.strictEqual(endInput.value, '192.168.10.254', 'End IP phải tự đổi thành 192.168.10.254');
  console.log('✔ Test 4: Khi nhập 192.168.10.1, Start IP tự đổi thành 192.168.10.2 và End IP tự đổi thành 192.168.10.254.');

  // Thử đổi sang lớp mạng khác: 10.0.0.1
  ipInput.value = '10.0.0.1';
  listeners['input'].forEach(fn => fn({ target: ipInput }));
  assert.strictEqual(startInput.value, '10.0.0.2', 'Start IP phải tự đổi thành 10.0.0.2');
  assert.strictEqual(endInput.value, '10.0.0.254', 'End IP phải tự đổi thành 10.0.0.254');
  console.log('✔ Test 5: Khi nhập 10.0.0.1, Start IP tự đổi thành 10.0.0.2 và End IP tự đổi thành 10.0.0.254.');
}

console.log('\n================================================================');
console.log('TẤT CẢ KIỂM THỬ ĐẶC TẢ BÀI 5 AP BE6500C ĐÃ VƯỢT QUA 100%!');
console.log('================================================================');
