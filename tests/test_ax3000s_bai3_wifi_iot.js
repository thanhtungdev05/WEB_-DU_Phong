'use strict';

const fs = require('fs');
const assert = require('assert');
const path = require('path');
const vm = require('vm');

const root = path.resolve(__dirname, '..');

// 1. Kiểm tra portal.html
const portalPath = path.join(root, 'portal.html');
const portalContent = fs.readFileSync(portalPath, 'utf8');
assert.ok(portalContent.includes('devices/ax3000s/tooltips/bai3.js?v='), 'portal.html must include bumped version of bai3 tooltips');
assert.ok(portalContent.includes('devices/ax3000s/lessons/bai3.js?v='), 'portal.html must include bumped version of bai3 lessons');

// 2. Kiểm tra wlanMapSettingAll.js
const wlanJsPath = path.join(root, 'simulators/sim_ax3000s/www/luci-static/resources/view/skgwfpt/wlanMapSettingAll.js');
const wlanJsContent = fs.readFileSync(wlanJsPath, 'utf8');

assert.ok(wlanJsContent.includes('if(!str||!str.trim()||str.trim()==="2.4G"||str.trim()==="5G"){return "";}'), 'ssid_set_suffix must not add suffix to empty or 2.4G/5G strings');
assert.ok(wlanJsContent.includes('if(index===2&&band==="2.4G")'), 'SelChange_Enable must handle index===2');
assert.ok(wlanJsContent.includes('setChecked("Chk_SsidEnable_5G_3",false);'), 'toggleCollapsible must keep 5G unchecked');

// 3. Load VM context
const context = {
  window: {},
  document: {},
  console: console
};
context.window = context;
vm.createContext(context);

const tooltipContent = fs.readFileSync(path.join(root, 'devices/ax3000s/tooltips/bai3.js'), 'utf8');
vm.runInContext(tooltipContent, context);

const lessonContent = fs.readFileSync(path.join(root, 'devices/ax3000s/lessons/bai3.js'), 'utf8');
vm.runInContext(lessonContent, context);

// 4. Kiểm tra Lesson Bai 3
const bai3 = context.window.DEVICE_AX3000S_LESSONS.find(l => l.id === 'LAB_AX3000S_03');
assert.ok(bai3, 'LAB_AX3000S_03 must exist');
assert.ok(bai3.instructions.some(i => i.includes('FPT Telecom-IoT')), 'SSID must be FPT Telecom-IoT');
assert.ok(bai3.instructions.some(i => i.includes('19006600')), 'Key must be 19006600');
assert.ok(!bai3.instructions.some(i => i.includes('Không cần tick Enable')), 'Instruction must not contain unnecessary action instructions');

assert.ok(bai3.clearFields.includes('#Txt_SSID_2G_3'), 'clearFields must include #Txt_SSID_2G_3');
assert.ok(bai3.clearFields.includes('#Pwd_WpaPsk_2G_3'), 'clearFields must include #Pwd_WpaPsk_2G_3');

assert.strictEqual(bai3.grading.rules.length, 5, 'Grading rules count must be 5');
const rBs = bai3.grading.rules.find(r => r.id === 'iot_bs');
assert.ok(rBs, 'Must check Band Steering off');
const rEnable2G = bai3.grading.rules.find(r => r.id === 'iot_enable_2g');
assert.ok(rEnable2G, 'Must check 2.4G enabled');
const rSsid = bai3.grading.rules.find(r => r.id === 'iot_ssid_2g');
assert.strictEqual(rSsid.expected, 'FPT Telecom-IoT');
const rKey = bai3.grading.rules.find(r => r.id === 'iot_key_2g');
assert.strictEqual(rKey.expected, '19006600');
const rDisable5G = bai3.grading.rules.find(r => r.id === 'iot_disable_5g');
assert.ok(rDisable5G, 'Must check 5G is not enabled');

// 5. Kiểm tra Tooltips Bai 3
const tip3 = context.window.TOOLTIPS_AX3000S['LAB_AX3000S_03'];
assert.strictEqual(tip3.length, 9, 'Tooltips length must be 9');

// Verify không có tooltip nào bắt buộc enable 5G
const enable5gTip = tip3.find(t => t.selector && t.selector.includes('Chk_SsidEnable_5G'));
assert.strictEqual(enable5gTip, undefined, 'Must NOT have any tooltip to enable 5G');

// Verify bước bật 2.4G là Bước 5
const enable2gTip = tip3.find(t => t.selector && t.selector.includes('Chk_SsidEnable_2G_3'));
assert.ok(enable2gTip.text.includes('Bước 5'), 'Enable 2.4G must be Bước 5');

// Verify bước SSID là Bước 6
const ssidTip = tip3.find(t => t.selector && t.selector.includes('Txt_SSID_2G_3'));
assert.ok(ssidTip.text.includes('Bước 6'), 'SSID must be Bước 6');

// Verify bước Password là Bước 7
const pwdTip = tip3.find(t => t.selector && t.selector.includes('Pwd_WpaPsk_2G_3'));
assert.ok(pwdTip.text.includes('Bước 7'), 'Password must be Bước 7');

// Verify bước Save là Bước 8
const saveTip = tip3.find(t => t.selector && t.selector.includes('BntClick_Apply(2)'));
assert.ok(saveTip.text.includes('Bước 8'), 'Save must be Bước 8');

console.log('ALL AX3000S BAI 3 WIFI IOT TESTS PASSED SUCCESSFULLY!');
