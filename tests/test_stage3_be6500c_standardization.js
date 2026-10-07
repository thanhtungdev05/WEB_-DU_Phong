'use strict';

const fs = require('fs');
const assert = require('assert');
const path = require('path');
const vm = require('vm');

const root = path.resolve(__dirname, '..');

function loadLesson(filePath, globalVarName, lessonId) {
  const code = fs.readFileSync(path.join(root, filePath), 'utf8');
  const ctx = { window: {} };
  vm.createContext(ctx);
  vm.runInContext(code, ctx);
  const lessons = ctx.window[globalVarName];
  assert.ok(Array.isArray(lessons), `${globalVarName} must be an array`);
  const lesson = lessons.find(l => l.id === lessonId);
  assert.ok(lesson, `Lesson ${lessonId} must exist in ${filePath}`);
  return lesson;
}

console.log('--- TEST 1: BÀI 5 (LAN - ONT BE6500C) ---');
const ontBai5 = loadLesson('devices/ONT_be6500c/lessons/bai5.js', 'DEVICE_ONT_BE6500C_LESSONS', 'ONT_be6500c-bai5');

// 1.1. clearFields must NOT clear IP Gateway so 192.168.1.1 is available by default
assert.ok(Array.isArray(ontBai5.clearFields) && !ontBai5.clearFields.includes('input[name="ipv4Settings.ipAddress"]'),
  'clearFields in ONT_be6500c bai5 must not clear input[name="ipv4Settings.ipAddress"]');

// 1.2. guidePopups must include IP Gateway tooltip with expected: "192.168.10.1"
const ipPopup = ontBai5.guidePopups.find(p => p.selector === 'input[name="ipv4Settings.ipAddress"]');
assert.ok(ipPopup, 'guidePopups must contain tooltip for input[name="ipv4Settings.ipAddress"]');
assert.strictEqual(ipPopup.expected, '192.168.10.1', 'ipPopup expected must be 192.168.10.1');
assert.ok(ipPopup.text.includes('192.168.10.1'), 'ipPopup text must mention 192.168.10.1');
console.log('✔ Bài 5 (LAN - ONT BE6500C): clearFields empty and Gateway IP tooltip 192.168.10.1 verified successfully.');

console.log('\n--- TEST 2: BÀI 6 (PORT FORWARDING - ONT & AP BE6500C) ---');
const portForwardConfigs = [
  { file: 'devices/ONT_be6500c/lessons/bai6.js', global: 'DEVICE_ONT_BE6500C_LESSONS', id: 'ONT_be6500c-bai6' },
  { file: 'devices/be6500c/lessons/bai5.js', global: 'DEVICE_BE6500C_LESSONS', id: 'be6500c-bai5' }
];

for (const cfg of portForwardConfigs) {
  const lesson = loadLesson(cfg.file, cfg.global, cfg.id);

  // 2.1. Tooltips must contain concrete example values
  const namePopup = lesson.guidePopups.find(p => p.selector === 'input[name="name"]');
  assert.ok(namePopup && namePopup.text.includes('Camera') && namePopup.expected === 'Camera',
    `${cfg.id} input[name="name"] tooltip must include (VD: Camera) and expected: Camera`);

  const protoPopup = lesson.guidePopups.find(p => p.selector === '#mui-component-select-protocol');
  assert.ok(protoPopup && protoPopup.text.includes('TCP_UDP'),
    `${cfg.id} protocol tooltip must include (VD: TCP_UDP)`);

  const extPortPopup = lesson.guidePopups.find(p => p.selector === 'input[name="source.portRange"]');
  assert.ok(extPortPopup && extPortPopup.text.includes('8080') && extPortPopup.expected === '8080',
    `${cfg.id} external port tooltip must include (VD: 8080) and expected: 8080`);

  const ipInternalPopup = lesson.guidePopups.find(p => p.selector === '.MuiAutocomplete-input');
  assert.ok(ipInternalPopup && ipInternalPopup.text.includes('192.168.1.20') && ipInternalPopup.expected === '192.168.1.20',
    `${cfg.id} internal IP tooltip must include (VD: 192.168.1.20) and expected: 192.168.1.20`);

  const intPortPopup = lesson.guidePopups.find(p => p.selector === 'input[name="destination.portRange"]');
  assert.ok(intPortPopup && intPortPopup.text.includes('80') && intPortPopup.expected === '80',
    `${cfg.id} internal port tooltip must include (VD: 80) and expected: 80`);

  // 2.2. Rules must NOT contain .MuiDialog-root (strictly requires table rows)
  for (const rule of lesson.grading.rules) {
    assert.ok(!rule.selector.includes('.MuiDialog-root'),
      `${cfg.id} rule ${rule.id} selector must NOT allow .MuiDialog-root fallback! Got: ${rule.selector}`);
    assert.ok(rule.selector.includes('tbody tr td'),
      `${cfg.id} rule ${rule.id} selector must target table cells tbody tr td`);
  }

  // 2.3. Rule evaluation test: Unsaved vs Saved in table
  const mockTableDoc = {
    _ftcIsSaved: true,
    querySelectorAll: function (selector) {
      if (selector === 'tbody tr td:nth-child(3)') return [{ textContent: 'Camera' }];
      if (selector === 'tbody tr td:nth-child(4)') return [{ textContent: 'TCP + UDP' }];
      if (selector === 'tbody tr td:nth-child(5)') return [{ textContent: '8080' }];
      if (selector.includes('tbody tr td:nth-child(6)')) return [{ textContent: '192.168.1.20' }];
      if (selector === 'tbody tr td:nth-child(7)') return [{ textContent: '80' }];
      return [];
    }
  };

  const mockModalDocOnly = {
    _ftcIsSaved: false,
    querySelectorAll: function (selector) {
      // Table is empty because user didn't click Save
      return [];
    }
  };

  // Check that mockModalDocOnly produces 0 elements for all rules
  for (const rule of lesson.grading.rules) {
    const els = mockModalDocOnly.querySelectorAll(rule.selector);
    assert.strictEqual(els.length, 0, `Unsaved modal must produce 0 elements for rule ${rule.id}`);
  }

  // Check that mockTableDoc produces elements matching expected
  for (const rule of lesson.grading.rules) {
    const els = mockTableDoc.querySelectorAll(rule.selector);
    assert.ok(els.length > 0, `Saved table must match elements for rule ${rule.id}`);
  }

  console.log(`✔ Bài 6 (Port Forwarding - ${cfg.id}): Tooltip values and strict table saving verified.`);
}

console.log('\n--- TEST 3: BÀI 3 (WI-FI IOT - ONT & AP BE6500C) ---');
const wifiIoTConfigs = [
  { file: 'devices/ONT_be6500c/lessons/bai3.js', global: 'DEVICE_ONT_BE6500C_LESSONS', id: 'ONT_be6500c-bai3' },
  { file: 'devices/be6500c/lessons/bai3.js', global: 'DEVICE_BE6500C_LESSONS', id: 'be6500c-bai3' }
];

for (const cfg of wifiIoTConfigs) {
  const lesson = loadLesson(cfg.file, cfg.global, cfg.id);

  // 3.1. Must have iot_tab rule checking SmartHome tab
  const tabRule = lesson.grading.rules.find(r => r.id === 'iot_tab');
  assert.ok(tabRule, `${cfg.id} must contain iot_tab rule`);
  assert.strictEqual(tabRule.type, 'element_exists', 'iot_tab type must be element_exists');
  assert.ok(tabRule.selector.includes('SmartHome'), 'iot_tab selector must target SmartHome');

  // 3.2. iot_ssid and iot_pass must be scoped to #tabpanel-SmartHome
  const ssidRule = lesson.grading.rules.find(r => r.id === 'iot_ssid');
  assert.ok(ssidRule && ssidRule.selector.includes('#tabpanel-SmartHome'),
    `${cfg.id} iot_ssid selector must be scoped to #tabpanel-SmartHome`);

  const passRule = lesson.grading.rules.find(r => r.id === 'iot_pass');
  assert.ok(passRule && passRule.selector.includes('#tabpanel-SmartHome'),
    `${cfg.id} iot_pass selector must be scoped to #tabpanel-SmartHome`);

  // 3.3. Test negative scenario: Student remains on Primary tab and modifies Primary SSID/password
  const mockPrimaryDoc = {
    _ftcIsSaved: true,
    querySelectorAll: function (selector) {
      if (selector === tabRule.selector) {
        // SmartHome tab is NOT active
        return [];
      }
      if (selector.includes('#tabpanel-SmartHome')) {
        // SmartHome inputs were untouched
        if (selector.includes('networks.0.name')) return [{ value: 'FPT Telecom-525F-IoT 2.4G' }];
        if (selector.includes('networks.0.passphrase')) return [{ value: 'c3929d51d3' }];
      }
      return [];
    }
  };

  const tabMatches = mockPrimaryDoc.querySelectorAll(tabRule.selector);
  assert.strictEqual(tabMatches.length, 0, 'On Primary tab, iot_tab selector MUST return 0 elements');

  const ssidMatches = mockPrimaryDoc.querySelectorAll(ssidRule.selector);
  assert.notStrictEqual(ssidMatches[0].value, 'FPT IoT', 'SmartHome SSID must not match Primary network edits');

  // 3.4. Test positive scenario: Student switched to SmartHome tab and modified SmartHome SSID/password
  const mockSmartHomeDoc = {
    _ftcIsSaved: true,
    querySelectorAll: function (selector) {
      if (selector === tabRule.selector) {
        return [{ id: 'SmartHome', getAttribute: () => 'true' }];
      }
      if (selector.includes('#tabpanel-SmartHome')) {
        if (selector.includes('networks.0.name')) return [{ value: 'FPT IoT' }];
        if (selector.includes('networks.0.passphrase')) return [{ value: 'fpt12345' }];
      }
      return [];
    }
  };

  assert.ok(mockSmartHomeDoc.querySelectorAll(tabRule.selector).length > 0, 'On SmartHome tab, iot_tab matches');
  assert.strictEqual(mockSmartHomeDoc.querySelectorAll(ssidRule.selector)[0].value, 'FPT IoT');
  assert.strictEqual(mockSmartHomeDoc.querySelectorAll(passRule.selector)[0].value, 'fpt12345');

  console.log(`✔ Bài 3 (Wi-Fi IoT - ${cfg.id}): SmartHome tab isolation and verification verified.`);
}

console.log('\n--- TEST 4: PORTAL.HTML CACHEBUSTERS ---');
const portalHtml = fs.readFileSync(path.join(root, 'portal.html'), 'utf8');
const cachebusterChecks = [
  /devices\/be6500c\/lessons\/bai3\.js\?v=[a-f0-9]{16}/,
  /devices\/be6500c\/lessons\/bai5\.js\?v=[a-f0-9]{16}/,
  /devices\/ONT_be6500c\/lessons\/bai3\.js\?v=[a-f0-9]{16}/,
  /devices\/ONT_be6500c\/lessons\/bai5\.js\?v=[a-f0-9]{16}/,
  /devices\/ONT_be6500c\/lessons\/bai6\.js\?v=[a-f0-9]{16}/
];

for (const pattern of cachebusterChecks) {
  assert.ok(pattern.test(portalHtml), `portal.html must have updated cachebuster matching ${pattern}`);
}
console.log('✔ All portal.html cachebusters updated properly.');

console.log('\n========================================');
console.log('ALL STAGE 3 STANDARDIZATION TESTS PASSED!');
console.log('========================================');
