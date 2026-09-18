'use strict';

const fs = require('fs');
const assert = require('assert');
const path = require('path');
const vm = require('vm');

const root = path.resolve(__dirname, '..');

// 1. Verify ONT BE6500C bai5.js lesson structure
const ontBai5Code = fs.readFileSync(path.join(root, 'devices/ONT_be6500c/lessons/bai5.js'), 'utf8');
const ontContext = { window: {} };
vm.createContext(ontContext);
vm.runInContext(ontBai5Code, ontContext);

const ontLessons = ontContext.window.DEVICE_ONT_BE6500C_LESSONS;
assert.ok(Array.isArray(ontLessons), 'DEVICE_ONT_BE6500C_LESSONS must be an array');
const ontBai5 = ontLessons.find(l => l.id === 'ONT_be6500c-bai5');
assert.ok(ontBai5, 'ONT_be6500c-bai5 must exist');

// guidePopups must contain input[name="ipv4Settings.ipAddress"]
const ipPopup = ontBai5.guidePopups.find(p => p.selector && p.selector.includes('ipv4Settings.ipAddress'));
assert.ok(ipPopup, 'guidePopups must contain ipv4Settings.ipAddress tooltip');
assert.strictEqual(ipPopup.expected, '192.168.1.1', 'ipPopup expected value must be 192.168.1.1');

// clearFields must clear ipv4Settings.ipAddress
assert.ok(ontBai5.clearFields.includes('input[name="ipv4Settings.ipAddress"]'), 'clearFields must include ipv4Settings.ipAddress');

// Verify remaining guidePopups
const expectedPopups = [
  'Advanced',
  'LAN',
  'IP Address (Gateway)',
  'Subnet Mask',
  'DHCP Server',
  'Start IP Address',
  'End IP Address',
  'Lease time Day(s)',
  'Lease time Hour(s)',
  'Save'
];
expectedPopups.forEach(text => {
  const found = ontBai5.guidePopups.some(p => p.text.includes(text));
  assert.ok(found, 'guidePopups must contain popup for ' + text);
});

// 2. Verify portal.html cachebuster for bai5.js
const portalContent = fs.readFileSync(path.join(root, 'portal.html'), 'utf8');
assert.ok(/devices\/ONT_be6500c\/lessons\/bai5\.js\?v=202609\d+/.test(portalContent),
  'portal.html must have updated cachebuster for ONT BE6500C bai5.js');

console.log('ALL ONT BE6500C BAI 5 TESTS PASSED SUCCESSFULLY!');
