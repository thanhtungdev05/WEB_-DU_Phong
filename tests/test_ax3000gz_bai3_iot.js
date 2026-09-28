'use strict';

const fs = require('fs');
const assert = require('assert');
const path = require('path');
const vm = require('vm');

const root = path.resolve(__dirname, '..');

// 1. Verify files exist and can be loaded
const bai3Path = path.join(root, 'devices/ax3000gz/lessons/bai3.js');
const tooltipPath = path.join(root, 'devices/ax3000gz/tooltips/bai3.js');
const modalPath = path.join(root, 'simulators/sim_ax3000gz/www/luci-static/modal.js');
const dataPath = path.join(root, 'devices/ax3000gz/data.js');
const portalPath = path.join(root, 'portal.html');

const bai3Content = fs.readFileSync(bai3Path, 'utf8');
const tooltipContent = fs.readFileSync(tooltipPath, 'utf8');
const modalContent = fs.readFileSync(modalPath, 'utf8');
const dataContent = fs.readFileSync(dataPath, 'utf8');
const portalContent = fs.readFileSync(portalPath, 'utf8');

// 2. Verify modal.js sets ssidIndex and handles saving to table row
assert.ok(modalContent.includes('hop.dataset.ssidIndex = String(ssidIndex);'), 'modal.js must set dataset.ssidIndex');
assert.ok(modalContent.includes('modal_field_ssid_index'), 'modal.js must include hidden modal_field_ssid_index');
assert.ok(modalContent.includes('saved-ssid-index'), 'modal.js must create .saved-ssid-index on table row');
assert.ok(modalContent.includes('saved-ssid-val'), 'modal.js must create .saved-ssid-val on table row');
assert.ok(modalContent.includes('saved-key-val'), 'modal.js must create .saved-key-val on table row');

// 3. Verify portal.html includes updated cachebuster
assert.ok(portalContent.includes('devices/ax3000gz/lessons/bai3.js?v='), 'portal.html must have cachebuster for bai3.js');
assert.ok(portalContent.includes('devices/ax3000gz/tooltips/bai3.js?v='), 'portal.html must have cachebuster for tooltips/bai3.js');

// 4. Verify context evaluation
const context = {
  window: {},
  document: {},
  console: console
};
context.window = context;
vm.createContext(context);

// Load lesson and tooltips
vm.runInContext(bai3Content, context);
vm.runInContext(tooltipContent, context);
vm.runInContext(dataContent, context);

const lessons = context.window.DEVICE_AX3000GZ_LESSONS;
assert.ok(Array.isArray(lessons), 'DEVICE_AX3000GZ_LESSONS must be an array');
const bai3 = lessons.find(l => l.id === 'LAB_AX3000GZ_03');
assert.ok(bai3, 'LAB_AX3000GZ_03 must exist');

// Check instructions
assert.ok(bai3.instructions.some(i => i.includes('FPT IoT')), 'Instructions must explicitly require FPT IoT');
assert.ok(bai3.instructions.some(i => i.includes('fptiot123')), 'Instructions must explicitly require fptiot123');

// Check rules
const rules = bai3.grading.rules;
assert.ok(Array.isArray(rules) && rules.length === 3, 'Must have 3 rules: SSID index, SSID name, and WPA key');

const ruleIndex = rules.find(r => r.id === 'wlan_ssid_index');
const ruleSsid = rules.find(r => r.id === 'wlan_ssid_iot');
const ruleKey = rules.find(r => r.id === 'wlan_key_iot');

assert.ok(ruleIndex, 'wlan_ssid_index rule must exist');
assert.equal(ruleIndex.expected, '2', 'wlan_ssid_index expected value must be 2');
assert.ok(ruleSsid, 'wlan_ssid_iot rule must exist');
assert.equal(ruleSsid.expected, 'FPT IoT', 'wlan_ssid_iot expected value must be FPT IoT');
assert.ok(ruleKey, 'wlan_key_iot rule must exist');
assert.equal(ruleKey.expected, 'fptiot123', 'wlan_key_iot expected value must be fptiot123');

// Check tooltips
assert.ok(context.window.TOOLTIPS_AX3000GZ['LAB_AX3000GZ_03'], 'TOOLTIPS_AX3000GZ[LAB_AX3000GZ_03] must exist');
assert.ok(context.window.TOOLTIPS_AX3000GZ['LAB_AX3000GZ_03'].length >= 5, 'Tooltips must contain step-by-step guidance');
assert.ok(context.window.TOOLTIPS_AX3000GZ['LAB_AX3000GZ_03'].some(t => t.text.includes('SSID2(2.4G)')), 'Tooltips must point to SSID2(2.4G)');

// 5. Simulate DOM evaluation logic from app.js evaluateLesson
function evaluateRulesOnFakeDoc(doc, rules) {
  let passedCount = 0;
  const results = [];
  for (const rule of rules) {
    const expectedVal = String(rule.expected).trim();
    const els = Array.from(doc.querySelectorAll(rule.selector));
    let isMatch = false;
    let actualValue = '';
    for (const candEl of els) {
      let candVal = (candEl.value !== undefined ? candEl.value : candEl.textContent || '').trim();
      if (candVal === expectedVal) {
        actualValue = candVal;
        isMatch = true;
        break;
      }
    }
    if (!isMatch && els.length > 0) {
      actualValue = (els[0].value !== undefined ? els[0].value : els[0].textContent || '').trim();
    }
    if (isMatch) passedCount++;
    results.push({ id: rule.id, isMatch, actualValue, expectedVal });
  }
  return { passed: passedCount === rules.length, passedCount, total: rules.length, results };
}

// Minimal fake DOM element generator
function createFakeDoc(htmlString) {
  // Simple regex-based selector matching for our specific test selectors
  return {
    querySelectorAll(selector) {
      const parts = selector.split(',').map(s => s.trim());
      const elements = [];
      for (const part of parts) {
        if (part === '#cbi-json-WLANSSID0 .saved-ssid-index' && htmlString.includes('class="saved-ssid-index" data-row="0"')) {
          const m = htmlString.match(/class="saved-ssid-index" data-row="0" value="([^"]*)"/);
          elements.push({ value: m ? m[1] : '' });
        }
        if (part === '#cbi-json-WLANSSID1 .saved-ssid-index' && htmlString.includes('class="saved-ssid-index" data-row="1"')) {
          const m = htmlString.match(/class="saved-ssid-index" data-row="1" value="([^"]*)"/);
          elements.push({ value: m ? m[1] : '' });
        }
        if (part === '[id="modal_field_ssid_index"]' && htmlString.includes('id="modal_field_ssid_index"')) {
          const m = htmlString.match(/id="modal_field_ssid_index"[^>]*value="([^"]*)"/);
          elements.push({ value: m ? m[1] : '' });
        }
        if (part === '#cbi-json-WLANSSID1 .saved-ssid-val' && htmlString.includes('class="saved-ssid-val" data-row="1"')) {
          const m = htmlString.match(/class="saved-ssid-val" data-row="1" value="([^"]*)"/);
          elements.push({ value: m ? m[1] : '' });
        }
        if (part === '#modal_overlay .modal[data-ssid-index="2"] [id="modal_field_SSID"]' && htmlString.includes('data-ssid-index="2"') && htmlString.includes('id="modal_field_SSID"')) {
          const m = htmlString.match(/id="modal_field_SSID"[^>]*value="([^"]*)"/);
          elements.push({ value: m ? m[1] : '' });
        }
        if (part === '#cbi-json-WLANSSID1 .saved-key-val' && htmlString.includes('class="saved-key-val" data-row="1"')) {
          const m = htmlString.match(/class="saved-key-val" data-row="1" value="([^"]*)"/);
          elements.push({ value: m ? m[1] : '' });
        }
        if (part === '#modal_overlay .modal[data-ssid-index="2"] [id="modal_field_KeyPassphrase"] input' && htmlString.includes('data-ssid-index="2"') && htmlString.includes('id="modal_field_KeyPassphrase"')) {
          const m = htmlString.match(/id="modal_field_KeyPassphrase"[^>]*>[\s\S]*?<input[^>]*value="([^"]*)"/);
          elements.push({ value: m ? m[1] : '' });
        }
      }
      return elements;
    }
  };
}

// TEST A: Student selects SSID 1, enters "FPT IoT" & "fptiot123", saves
const docSSID1Saved = createFakeDoc(`
  <tr id="cbi-json-WLANSSID0">
    <input type="hidden" class="saved-ssid-index" data-row="0" value="1" />
    <input type="hidden" class="saved-ssid-val" data-row="0" value="FPT IoT" />
    <input type="hidden" class="saved-key-val" data-row="0" value="fptiot123" />
  </tr>
  <tr id="cbi-json-WLANSSID1"></tr>
`);
const evalSSID1 = evaluateRulesOnFakeDoc(docSSID1Saved, rules);
assert.equal(evalSSID1.passed, false, 'Selecting and saving SSID1 MUST FAIL evaluation');
assert.equal(evalSSID1.results.find(r => r.id === 'wlan_ssid_index').isMatch, false, 'wlan_ssid_index must be false for SSID1');
console.log('✔ Test A passed: Configuring SSID1 fails grading as expected');

// TEST B: Student selects SSID 2, enters "FPT IoT" & "fptiot123", saves
const docSSID2Saved = createFakeDoc(`
  <tr id="cbi-json-WLANSSID0"></tr>
  <tr id="cbi-json-WLANSSID1">
    <input type="hidden" class="saved-ssid-index" data-row="1" value="2" />
    <input type="hidden" class="saved-ssid-val" data-row="1" value="FPT IoT" />
    <input type="hidden" class="saved-key-val" data-row="1" value="fptiot123" />
  </tr>
`);
const evalSSID2 = evaluateRulesOnFakeDoc(docSSID2Saved, rules);
assert.equal(evalSSID2.passed, true, 'Selecting and saving SSID2 MUST PASS evaluation');
assert.equal(evalSSID2.passedCount, 3, 'All 3 rules must pass for SSID2');
console.log('✔ Test B passed: Configuring SSID2 passes grading (3/3 rules met)');

// TEST C: Student currently in modal on SSID 1
const docSSID1ModalOpen = createFakeDoc(`
  <div id="modal_overlay">
    <div class="modal" data-ssid-index="1">
      <input id="modal_field_ssid_index" value="1" />
      <input id="modal_field_SSID" value="FPT IoT" />
      <div id="modal_field_KeyPassphrase"><input value="fptiot123" /></div>
    </div>
  </div>
`);
const evalSSID1Modal = evaluateRulesOnFakeDoc(docSSID1ModalOpen, rules);
assert.equal(evalSSID1Modal.passed, false, 'Modal open on SSID1 MUST FAIL evaluation');
console.log('✔ Test C passed: Modal open on SSID1 fails grading');

// TEST D: Student currently in modal on SSID 2
const docSSID2ModalOpen = createFakeDoc(`
  <div id="modal_overlay">
    <div class="modal" data-ssid-index="2">
      <input id="modal_field_ssid_index" value="2" />
      <input id="modal_field_SSID" value="FPT IoT" />
      <div id="modal_field_KeyPassphrase"><input value="fptiot123" /></div>
    </div>
  </div>
`);
const evalSSID2Modal = evaluateRulesOnFakeDoc(docSSID2ModalOpen, rules);
assert.equal(evalSSID2Modal.passed, true, 'Modal open on SSID2 MUST PASS evaluation');
console.log('✔ Test D passed: Modal open on SSID2 passes grading');

console.log('\nAll AX3000GZ Bài 3 verification tests passed successfully!');
