'use strict';

const fs = require('fs');
const assert = require('assert');
const path = require('path');
const vm = require('vm');

const root = path.resolve(__dirname, '..');

// 1. Files exist and read
const bai5Path = path.join(root, 'devices/ax3000s/lessons/bai5.js');
const tip5Path = path.join(root, 'devices/ax3000s/tooltips/bai5.js');
const backendPath = path.join(root, 'simulators/sim_ax3000s/www/sim/backend.js');
const lancfgJsPath = path.join(root, 'simulators/sim_ax3000s/www/luci-static/resources/view/skgwfpt/lancfgv4.js');
const portalPath = path.join(root, 'portal.html');
const appPath = path.join(root, 'app.js');

const bai5Content = fs.readFileSync(bai5Path, 'utf8');
const tip5Content = fs.readFileSync(tip5Path, 'utf8');
const backendContent = fs.readFileSync(backendPath, 'utf8');
const lancfgJsContent = fs.readFileSync(lancfgJsPath, 'utf8');
const portalContent = fs.readFileSync(portalPath, 'utf8');
const appContent = fs.readFileSync(appPath, 'utf8');

// 2. Check simulator backend: DHCP Server must be Enable by default (matches real AX3000S device)
assert.ok(
  backendContent.includes('dhcp_enable: 1'),
  'backend.js must initialize LAN.dhcp_enable to 1 (Enable) matching real AX3000S device'
);

// 3. Check lancfgv4.js: must prevent jumpTonew() external redirect
assert.ok(
  !lancfgJsContent.includes('window.location.href="http://"+newhost'),
  'lancfgv4.js must not break simulator iframe with external redirect'
);

// 4. Check cachebusters in portal.html
assert.ok(
  /devices\/ax3000s\/tooltips\/bai5\.js\?v=[a-f0-9]{16}/.test(portalContent),
  'portal.html must include cachebuster for bai5 tooltips'
);
assert.ok(
  /devices\/ax3000s\/lessons\/bai5\.js\?v=[a-f0-9]{16}/.test(portalContent),
  'portal.html must include cachebuster for bai5 lessons'
);

// 4b. Verify tooltip definitions: Step 6 (DHCP Enable) removed, 9 steps total
const tipCtx = { window: {} };
tipCtx.window = tipCtx;
vm.createContext(tipCtx);
vm.runInContext(tip5Content, tipCtx);
const tip5List = tipCtx.window.TOOLTIPS_AX3000S['LAB_AX3000S_05'];
assert.strictEqual(tip5List.length, 9, 'Bài 5 tooltips must have exactly 9 steps after removing DHCP Enable');
assert.ok(!tip5List.some(t => t.text.includes('Enable DHCP Server')), 'Tooltip for Enable DHCP Server must be removed');
assert.strictEqual(tip5List[5].text, 'Bước 6: Đặt Start IP 192.168.2.2', 'Step 6 must now be Start IP');
assert.strictEqual(tip5List[8].text, 'Bước 9: Nhấn Save & Apply', 'Step 9 must be Save & Apply');


// 5. Test VM execution of lesson rules and evaluation
const evalPart = appContent.slice(appContent.indexOf('function evaluateLesson'), appContent.indexOf('function submitLab'));
const isSaveReqPart = appContent.slice(appContent.indexOf('function isSaveRequiredDevice'), appContent.indexOf('function populateDeviceDropdown'));
const isNoConfigPart = appContent.slice(appContent.indexOf('function isNoConfigDevice'), appContent.indexOf('function isSaveRequiredDevice'));

const evalCtx = {
  console: console,
  window: {},
  document: { getElementById: () => null },
  currentDeviceId: 'ax3000s',
  currentLessonId: 'LAB_AX3000S_05',
  currentMode: 'guide',
  _trackingSession: null,
  DEVICES: [{ id: 'ax3000s', name: 'AX3000S' }],
  deviceIframe: { contentWindow: {} },
  getAllAccessibleDocuments: () => []
};
evalCtx.window = evalCtx;
vm.createContext(evalCtx);

vm.runInContext(isNoConfigPart, evalCtx);
vm.runInContext(isSaveReqPart, evalCtx);
vm.runInContext(evalPart, evalCtx);
vm.runInContext(bai5Content, evalCtx);

const bai5 = evalCtx.window.DEVICE_AX3000S_LESSONS.find(l => l.id === 'LAB_AX3000S_05');
assert.ok(bai5, 'LAB_AX3000S_05 must exist');
assert.strictEqual(bai5.grading.rules.length, 6, 'Must have 6 grading rules');

function createMockLanDoc(ip, mask, dhcpEnable, start, end, lease, isSaved) {
  const elements = {
    '#ethIpAddress': [{ value: ip, type: 'text' }],
    '#ethSubnetMask': [{ value: mask, type: 'text' }],
    '#dhcpSrvType2': [{ value: '1', checked: dhcpEnable, type: 'radio' }],
    '#dhcpEthStart': [{ value: start, type: 'text' }],
    '#dhcpEthEnd': [{ value: end, type: 'text' }],
    '#dhcpLeasedTime': [{ value: lease, type: 'select-one' }]
  };
  return {
    location: { href: 'http://localhost/lancfgv4' },
    _ftcIsSaved: isSaved,
    querySelectorAll: (sel) => elements[sel] || [],
    querySelector: (sel) => (elements[sel] && elements[sel][0]) || null
  };
}

// Case A: Correct values + Saved -> MUST PASS 100% (6/6 rules)
evalCtx.getAllAccessibleDocuments = () => [createMockLanDoc('192.168.2.1', '255.255.255.0', true, '192.168.2.2', '192.168.2.254', '120', true)];
evalCtx.window._hasClickedSaveInGuide = true;
const resCorrect = evalCtx.evaluateLesson({ id: 'ax3000s' }, bai5);
assert.strictEqual(resCorrect.passed, true, 'Configuring correct LAN & DHCP values with save must pass');
assert.strictEqual(resCorrect.passedCount, 6, 'All 6 rules must pass');

// Case B: Incorrect IP -> MUST FAIL
evalCtx.getAllAccessibleDocuments = () => [createMockLanDoc('192.168.1.1', '255.255.255.0', true, '192.168.1.2', '192.168.1.254', '120', true)];
const resWrongIp = evalCtx.evaluateLesson({ id: 'ax3000s' }, bai5);
assert.strictEqual(resWrongIp.passed, false, 'Wrong IP must fail');
const ipDetail = resWrongIp.details.find(d => d.id === 'lan_ip');
assert.strictEqual(ipDetail.passed, false, 'lan_ip rule must fail');

// Case C: Before Save -> MUST indicate unsaved
evalCtx.getAllAccessibleDocuments = () => [createMockLanDoc('192.168.2.1', '255.255.255.0', true, '192.168.2.2', '192.168.2.254', '120', false)];
evalCtx.window._hasClickedSaveInGuide = false;
const resUnsaved = evalCtx.evaluateLesson({ id: 'ax3000s' }, bai5);
assert.strictEqual(resUnsaved.passed, false, 'Unsaved configuration must fail');
assert.ok(resUnsaved.details.every(d => !d.passed), 'All rules must be marked unpassed before save');

console.log('ALL AX3000S BAI 5 DHCP TESTS PASSED SUCCESSFULLY!');
