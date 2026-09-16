'use strict';

const fs = require('fs');
const assert = require('assert');
const path = require('path');
const vm = require('vm');

const root = path.resolve(__dirname, '..');

// 1. Verify simulators/sim_ac1000f/www2/cgi-bin/home_lan.asp has autoSyncDHCP and default HTML
const lanHtml = fs.readFileSync(path.join(root, 'simulators/sim_ac1000f/www2/cgi-bin/home_lan.asp'), 'latin1');
assert.ok(lanHtml.includes('autoSyncDHCP()'), 'home_lan.asp must have autoSyncDHCP function');
assert.ok(lanHtml.includes('oninput="autoSyncDHCP();"'), 'home_lan.asp must call autoSyncDHCP on input');
assert.ok(lanHtml.includes('VALUE="192.168.1.1"'), 'home_lan.asp must have initial default IP 192.168.1.1');
assert.ok(lanHtml.includes('NAME="dhcp_LeaseTime" SIZE="6" MAXLENGTH="6" VALUE="86400"'), 'home_lan.asp must prefill Lease Time with 86400');

// 2. Verify autoSyncDHCP correctly converts 192.168.10.1 to 192.168.10.2 and 192.168.10.254
{
  const dom = {
    document: {
      uiViewLanForm: {
        uiViewIPAddr: { value: '192.168.1.1' },
        StartIp: { value: '192.168.1.2' },
        EndIp: { value: '192.168.1.254' },
        PoolSize: { value: '253' }
      }
    },
    alert: () => {}
  };

  const start = lanHtml.indexOf('function autoSyncDHCP()');
  const end = lanHtml.indexOf('function blockStartIP()');
  const code = lanHtml.substring(start, end);

  vm.createContext(dom);
  vm.runInContext(code, dom);

  dom.document.uiViewLanForm.uiViewIPAddr.value = '192.168.10.1';
  dom.autoSyncDHCP();

  assert.strictEqual(dom.document.uiViewLanForm.StartIp.value, '192.168.10.2', 'StartIp must auto-sync to 192.168.10.2');
  assert.strictEqual(dom.document.uiViewLanForm.EndIp.value, '192.168.10.254', 'EndIp must auto-sync to 192.168.10.254');
}

// 3. Verify devices/ac1000f/lessons/bai5.js
const bai5Code = fs.readFileSync(path.join(root, 'devices/ac1000f/lessons/bai5.js'), 'utf8');
const context = { window: {} };
vm.createContext(context);
vm.runInContext(bai5Code, context);

const lessons = context.window.DEVICE_AC1000F_LESSONS;
assert.ok(Array.isArray(lessons), 'DEVICE_AC1000F_LESSONS must be an array');
const bai5 = lessons.find(l => l.id === 'LAB_AC1000F_05');
assert.ok(bai5, 'LAB_AC1000F_05 must exist');
assert.ok(!bai5.clearFields || !bai5.clearFields.includes('input[name="dhcp_LeaseTime"]'), 'Lease Time must not be cleared');

// Test grading logic with fake doc
{
  const fakeDoc = {
    URL: 'http://localhost:8080/sim_ac1000f/cgi-bin/home_lan.asp',
    querySelector(selector) {
      if (selector === 'input[name="uiViewIPAddr"]') return { value: '192.168.10.1' };
      if (selector === 'input[name="uiViewNetMask"]') return { value: '255.255.255.0' };
      if (selector === 'input[name="dhcpTypeRadio"]:checked') return { value: '1' };
      if (selector === 'input[name="StartIp"]') return { value: '192.168.10.2' };
      if (selector === 'input[name="EndIp"]') return { value: '192.168.10.254' };
      if (selector === 'input[name="dhcp_LeaseTime"]') return { value: '86400' };
      return null;
    }
  };

  const res = bai5.grading.customGrading([fakeDoc]);
  assert.strictEqual(res.passed, true, 'Custom grading should pass with 192.168.10.1 and 86400');
  assert.strictEqual(res.score, 100, 'Score must be 100');
}

// 4. Verify devices/ac1000f/tooltips/bai5.js
const tooltipsCode = fs.readFileSync(path.join(root, 'devices/ac1000f/tooltips/bai5.js'), 'utf8');
const ttContext = { window: {} };
vm.createContext(ttContext);
vm.runInContext(tooltipsCode, ttContext);

const tooltips = ttContext.window.TOOLTIPS_AC1000F['LAB_AC1000F_05'];
assert.ok(Array.isArray(tooltips), 'tooltips array must exist');

const ttIp = tooltips.find(t => t.selector.includes('uiViewIPAddr'));
assert.ok(ttIp, 'Must have tooltip for uiViewIPAddr');
assert.strictEqual(ttIp.expected, '192.168.10.1', 'Tooltip expected must be 192.168.10.1');
assert.ok(ttIp.text.includes('192.168.10.1'), 'Tooltip text must mention 192.168.10.1');

const ttLease = tooltips.find(t => t.selector.includes('dhcp_LeaseTime'));
assert.ok(ttLease, 'Must have tooltip for dhcp_LeaseTime');
assert.strictEqual(ttLease.expected, '86400', 'Tooltip expected must be 86400');
assert.ok(ttLease.text.includes('86400'), 'Tooltip text must mention 86400');

console.log('ALL ONT AC1000F DHCP (BAI 5) TESTS PASSED SUCCESSFULLY!');
