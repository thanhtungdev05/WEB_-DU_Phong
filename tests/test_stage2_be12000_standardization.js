/**
 * tests/test_stage2_be12000_standardization.js
 * Test suite verifying standardization of BE12000 (Labs 3, 4, 5, 6)
 */

const assert = require('assert');
const fs = require('fs');
const path = require('path');
const vm = require('vm');

console.log('--- RUNNING BE12000 STANDARDIZATION TESTS (STAGE 2) ---');

// Helper to create a DOM element mock
function createMockElement(tag, attrs = {}) {
  const el = {
    tagName: tag.toUpperCase(),
    id: attrs.id || '',
    name: attrs.name || '',
    type: attrs.type || 'text',
    value: attrs.value !== undefined ? attrs.value : '',
    checked: Boolean(attrs.checked),
    classList: {
      contains: (cls) => (attrs.className || '').split(' ').includes(cls)
    },
    getAttribute: (attr) => attrs[attr] || null,
    querySelector: () => null,
    querySelectorAll: () => []
  };
  return el;
}

// Helper to create a Document mock
function createMockDocument(elements = [], isSaved = true) {
  const doc = {
    _ftcIsSaved: isSaved,
    location: { search: isSaved ? '?save_success=1' : '' },
    elements: elements,
    getElementById: function (id) {
      return this.elements.find(e => e.id === id) || null;
    },
    querySelector: function (selector) {
      const all = this.querySelectorAll(selector);
      return all.length > 0 ? all[0] : null;
    },
    querySelectorAll: function (selector) {
      return this.elements.filter(e => {
        // Simple mock matching for tests
        if (selector.includes('#' + e.id) || selector.includes(`[id="${e.id}"]`)) return true;
        if (selector.includes('[id^="') && e.id) {
          const match = selector.match(/\[id\^="([^"]+)"\]/);
          if (match && e.id.startsWith(match[1])) return true;
        }
        if (e.id && selector.includes(e.id.replace(/:/g, '\\:'))) return true;
        if (e.name && selector.includes(`[name="${e.name}"]`)) return true;
        if (selector.includes(':checked') && e.checked) {
          if (selector.includes(`name="${e.name}"`)) return true;
        }
        if (selector.includes('div[id^="template_PortForwarding"]') && e.id && e.id.startsWith('template_PortForwarding')) return true;
        return false;
      });
    }
  };
  return doc;
}

// Sandbox context setup
const context = {
  window: {},
  document: {},
  console: console
};
context.window.top = context.window;
vm.createContext(context);

// Load files
const basePath = path.join(__dirname, '..');
function loadScript(relPath) {
  const code = fs.readFileSync(path.join(basePath, relPath), 'utf8');
  vm.runInContext(code, context);
}

// 1. Load BE12000 tooltips & lessons
loadScript('devices/be12000/tooltips/bai3.js');
loadScript('devices/be12000/tooltips/bai4.js');
loadScript('devices/be12000/tooltips/bai5.js');
loadScript('devices/be12000/tooltips/bai6.js');
loadScript('devices/be12000/lessons/bai3.js');
loadScript('devices/be12000/lessons/bai4.js');
loadScript('devices/be12000/lessons/bai5.js');
loadScript('devices/be12000/lessons/bai6.js');

const lessons = context.window.DEVICE_BE12000_LESSONS;
const tooltips = context.window.TOOLTIPS_BE12000;

const bai3 = lessons.find(l => l.id === 'LAB_BE12000_03');
const bai4 = lessons.find(l => l.id === 'LAB_BE12000_04');
const bai5 = lessons.find(l => l.id === 'LAB_BE12000_05');
const bai6 = lessons.find(l => l.id === 'LAB_BE12000_06');

// ==========================================
// TEST 1: Bài 4 (DNS) - 4 Octet Tooltips & Full IP Grading
// ==========================================
console.log('Test 1: BE12000 Bài 4 (DNS)...');
const bai4Tooltips = tooltips['LAB_BE12000_04'];
assert.ok(bai4Tooltips, 'Bài 4 tooltips must exist');
// Check all 4 octets present for DNS 1 and DNS 2
assert.ok(bai4Tooltips.some(t => t.selector.includes('sub_SerIPAddress13')), 'Tooltip must cover DNS 1 octet 3');
assert.ok(bai4Tooltips.some(t => t.selector.includes('sub_SerIPAddress23')), 'Tooltip must cover DNS 2 octet 3');
assert.ok(bai4Tooltips.some(t => t.selector.includes('Btn_apply_LocalDnsServer')), 'Tooltip must cover Apply button');
assert.strictEqual(bai4Tooltips.length, 6, 'Bài 4 tooltips should have 6 items (3 nav + 2 editable DNS fields + 1 apply)');

// Test Bài 4 customGrading with valid full IP (210.245.31.220 & 8.8.8.8) and isSaved = true
function createDnsDoc(dns1Octets, dns2Octets, isSaved) {
  const elements = [
    createMockElement('button', { id: 'Btn_apply_LocalDnsServer' }),
    createMockElement('input', { id: 'sub_SerIPAddress10', value: dns1Octets[0] }),
    createMockElement('input', { id: 'sub_SerIPAddress11', value: dns1Octets[1] }),
    createMockElement('input', { id: 'sub_SerIPAddress12', value: dns1Octets[2] }),
    createMockElement('input', { id: 'sub_SerIPAddress13', value: dns1Octets[3] }),
    createMockElement('input', { id: 'sub_SerIPAddress20', value: dns2Octets[0] }),
    createMockElement('input', { id: 'sub_SerIPAddress21', value: dns2Octets[1] }),
    createMockElement('input', { id: 'sub_SerIPAddress22', value: dns2Octets[2] }),
    createMockElement('input', { id: 'sub_SerIPAddress23', value: dns2Octets[3] })
  ];
  return createMockDocument(elements, isSaved);
}

const validDnsDoc = createDnsDoc(['210', '245', '31', '220'], ['8', '8', '8', '8'], true);
const resValidDns = bai4.grading.customGrading([validDnsDoc]);
assert.strictEqual(resValidDns.passed, true, 'Valid DNS configuration must pass');
assert.strictEqual(resValidDns.score, 100, 'Valid DNS score must be 100');

// Test Bài 4 with hybrid invalid IP (e.g. 210.8.1.1 - mixed octets that previously passed loose rules)
const hybridDnsDoc = createDnsDoc(['210', '8', '1', '1'], ['8', '8', '8', '8'], true);
const resHybridDns = bai4.grading.customGrading([hybridDnsDoc]);
assert.strictEqual(resHybridDns.passed, false, 'Hybrid invalid DNS 210.8.1.1 must FAIL');
assert.strictEqual(resHybridDns.details[0].passed, false, 'DNS 1 detail must be false for hybrid IP');

// Test Bài 4 with unapplied configuration
const unappliedDnsDoc = createDnsDoc(['210', '245', '31', '220'], ['8', '8', '8', '8'], false);
const resUnappliedDns = bai4.grading.customGrading([unappliedDnsDoc]);
assert.strictEqual(resUnappliedDns.passed, false, 'Unapplied DNS configuration must fail');
assert.ok(resUnappliedDns.details[0].actual.includes('(Chưa lưu)'), 'DNS detail actual must indicate (Chưa lưu)');
console.log('✓ Bài 4 (DNS) passed all assertions');

// ==========================================
// TEST 2: Bài 3 (Wi-Fi IoT) - SSID Hide: Off & Synced Instructions
// ==========================================
console.log('Test 2: BE12000 Bài 3 (Wi-Fi IoT)...');
// Instructions must NOT contain SSID Isolation or Maximum Clients
const instText = bai3.instructions.join(' ');
assert.ok(!instText.includes('SSID Isolation'), 'Instructions must not mention SSID Isolation');
assert.ok(!instText.includes('Maximum Clients'), 'Instructions must not mention Maximum Clients');
assert.ok(instText.includes('SSID Name'), 'Instructions must mention SSID Name');

// Rules must contain iot_hide
const hideRule = bai3.grading.rules.find(r => r.id === 'iot_hide');
assert.ok(hideRule, 'Rule iot_hide must exist');
assert.strictEqual(hideRule.expected, '0', 'iot_hide expected value must be 0 (Off)');
assert.ok(hideRule.selector.includes('ESSIDHideEnable1\\:1') || hideRule.selector.includes('ESSIDHideEnable:1'), 'iot_hide selector must target ESSIDHideEnable');

// Tooltip step 8 must have expected '0'
const bai3Tooltips = tooltips['LAB_BE12000_03'];
const step8 = bai3Tooltips.find(t => t.text && t.text.includes('Bước 8: Chọn Off của phần SSID Hide'));
assert.ok(step8, 'Tooltip Step 8 for SSID Hide must exist');
assert.strictEqual(step8.expected, '0', 'Tooltip Step 8 expected must be 0');
console.log('✓ Bài 3 (Wi-Fi IoT) passed all assertions');

// ==========================================
// TEST 3: Bài 5 (DHCP) - isSaved Check in customGrading
// ==========================================
console.log('Test 3: BE12000 Bài 5 (DHCP)...');
function createDhcpDoc(isSaved) {
  const elements = [
    createMockElement('input', { id: 'Btn_apply_DHCPBasicCfg' }),
    createMockElement('input', { id: 'ServerEnable1', checked: true, value: '1' }),
    createMockElement('input', { id: 'sub_IPAddr0:DHCPBasicCfg', value: '192' }),
    createMockElement('input', { id: 'sub_IPAddr1:DHCPBasicCfg', value: '168' }),
    createMockElement('input', { id: 'sub_IPAddr2:DHCPBasicCfg', value: '10' }),
    createMockElement('input', { id: 'sub_IPAddr3:DHCPBasicCfg', value: '1' }),
    createMockElement('input', { id: 'sub_SubMask0', value: '255' }),
    createMockElement('input', { id: 'sub_SubMask1', value: '255' }),
    createMockElement('input', { id: 'sub_SubMask2', value: '255' }),
    createMockElement('input', { id: 'sub_SubMask3', value: '0' }),
    createMockElement('input', { id: 'sub_MinAddress0:DHCPBasicCfg', value: '192' }),
    createMockElement('input', { id: 'sub_MinAddress1:DHCPBasicCfg', value: '168' }),
    createMockElement('input', { id: 'sub_MinAddress2:DHCPBasicCfg', value: '10' }),
    createMockElement('input', { id: 'sub_MinAddress3:DHCPBasicCfg', value: '2' }),
    createMockElement('input', { id: 'sub_MaxAddress0:DHCPBasicCfg', value: '192' }),
    createMockElement('input', { id: 'sub_MaxAddress1:DHCPBasicCfg', value: '168' }),
    createMockElement('input', { id: 'sub_MaxAddress2:DHCPBasicCfg', value: '10' }),
    createMockElement('input', { id: 'sub_MaxAddress3:DHCPBasicCfg', value: '254' })
  ];
  return createMockDocument(elements, isSaved);
}

const savedDhcpDoc = createDhcpDoc(true);
const resSavedDhcp = bai5.grading.customGrading([savedDhcpDoc]);
assert.strictEqual(resSavedDhcp.passed, true, 'Saved DHCP configuration must pass');
assert.strictEqual(resSavedDhcp.score, 100, 'Saved DHCP score must be 100');

const unsavedDhcpDoc = createDhcpDoc(false);
const resUnsavedDhcp = bai5.grading.customGrading([unsavedDhcpDoc]);
assert.strictEqual(resUnsavedDhcp.passed, false, 'Unsaved DHCP configuration must fail');
assert.strictEqual(resUnsavedDhcp.score, 0, 'Unsaved DHCP score must be 0');
assert.ok(resUnsavedDhcp.details[0].actual.includes('(Chưa lưu)'), 'DHCP detail must indicate (Chưa lưu)');
console.log('✓ Bài 5 (DHCP) passed all assertions');

// ==========================================
// TEST 4: Bài 6 (Port Forwarding) - Remove WAN Host, Tighten LAN Host & Port 8080
// ==========================================
console.log('Test 4: BE12000 Bài 6 (Port Forwarding)...');
const bai6Tooltips = tooltips['LAB_BE12000_06'];
assert.ok(bai6Tooltips, 'Bài 6 tooltips must exist');
// Must NOT have WAN Host IP tooltip
assert.ok(!bai6Tooltips.some(t => t.selector.includes('sub_RemoteHostEndRange3')), 'Redundant WAN Host IP tooltip must be removed');
assert.ok(!bai6Tooltips.some(t => t.text && t.text.includes('WAN Host IP Address')), 'Tooltip text must not reference WAN Host IP');
// Step numbering in Option 1 should be 4 to 9 for form fields and apply
const stepTexts = bai6Tooltips.map(t => t.text);
assert.ok(stepTexts.some(t => t.includes('Bước 4: Nhập Name')), 'Step 4 must be Name');
assert.ok(stepTexts.some(t => t.includes('Bước 5: Chọn Protocol')), 'Step 5 must be Protocol');
assert.ok(stepTexts.some(t => t.includes('Bước 6: Nhập LAN Host: 192.168.1.100')), 'Step 6 must be LAN Host');
assert.ok(stepTexts.some(t => t.includes('Bước 7: Nhập WAN Port: 8080')), 'Step 7 must be WAN Port');
assert.ok(stepTexts.some(t => t.includes('Bước 8: Nhập LAN Host Port: 8080')), 'Step 8 must be LAN Host Port');
assert.ok(stepTexts.some(t => t.includes('Bước 9: Nhấn Apply')), 'Step 9 must be Apply');

// Rules tightening
const lanHostRule = bai6.grading.rules.find(r => r.id === 'lan_host');
assert.strictEqual(lanHostRule.expected, '192.168.1.100', 'lan_host rule expected must strictly be 192.168.1.100');
const wanPortRule = bai6.grading.rules.find(r => r.id === 'wan_port');
assert.strictEqual(wanPortRule.expected, '8080', 'wan_port rule expected must strictly be 8080');
const lanPortRule = bai6.grading.rules.find(r => r.id === 'lan_port');
assert.strictEqual(lanPortRule.expected, '8080', 'lan_port rule expected must strictly be 8080');

// customGrading testing
function createNatDoc(name, protocol, lanHost, wanPort, lanPort, isSaved) {
  const container = createMockElement('div', { id: 'template_PortForwarding_0' });
  const elements = [
    createMockElement('div', { id: 'PortForwardingBar' }),
    container,
    createMockElement('input', { id: 'Btn_apply_PortForwarding:0' }),
    createMockElement('input', { id: 'Alias:0', value: name }),
    createMockElement('select', { id: 'Protocol:0', value: protocol }),
    createMockElement('input', { id: 'InternalClient:0', value: lanHost }),
    createMockElement('input', { id: 'ExternalPort:0', value: wanPort }),
    createMockElement('input', { id: 'InternalPort:0', value: lanPort })
  ];
  container.querySelector = (sel) => {
    return elements.find(e => {
      if (sel.includes('Alias') && e.id && e.id.includes('Alias')) return e;
      if (sel.includes('Protocol') && e.id && e.id.includes('Protocol')) return e;
      if (sel.includes('InternalClient') && e.id && e.id.includes('InternalClient')) return e;
      if (sel.includes('ExternalPort') && e.id && e.id.includes('ExternalPort')) return e;
      if (sel.includes('InternalPort') && e.id && e.id.includes('InternalPort')) return e;
      return null;
    }) || null;
  };
  return createMockDocument(elements, isSaved);
}

// Valid NAT configuration
const validNatDoc = createNatDoc('NAT FPT', 'TCP', '192.168.1.100', '8080', '8080', true);
const resValidNat = bai6.grading.customGrading([validNatDoc]);
assert.strictEqual(resValidNat.passed, true, 'Strict valid NAT must pass');
assert.strictEqual(resValidNat.score, 100, 'Score must be 100');

// Invalid LAN Host = 192.168.1.1 (Router IP)
const routerIpNatDoc = createNatDoc('NAT FPT', 'TCP', '192.168.1.1', '8080', '8080', true);
const resRouterIpNat = bai6.grading.customGrading([routerIpNatDoc]);
assert.strictEqual(resRouterIpNat.passed, false, 'NAT with Router IP 192.168.1.1 must FAIL');
assert.strictEqual(resRouterIpNat.details[2].passed, false, 'LAN Host detail must fail');

// Invalid Port = 80 (should reject non-8080 port per strict 8080 requirement)
const non8080NatDoc = createNatDoc('NAT FPT', 'TCP', '192.168.1.100', '80', '8080', true);
const resNon8080Nat = bai6.grading.customGrading([non8080NatDoc]);
assert.strictEqual(resNon8080Nat.passed, false, 'NAT with port 80 must FAIL');

// Unsaved NAT
const unsavedNatDoc = createNatDoc('NAT FPT', 'TCP', '192.168.1.100', '8080', '8080', false);
const resUnsavedNat = bai6.grading.customGrading([unsavedNatDoc]);
assert.strictEqual(resUnsavedNat.passed, false, 'Unsaved NAT must fail');
assert.ok(resUnsavedNat.details[0].actual.includes('(Chưa lưu)'), 'Detail actual must indicate (Chưa lưu)');
console.log('✓ Bài 6 (Port Forwarding) passed all assertions');

console.log('\nALL STAGE 2 STANDARDIZATION TESTS PASSED 100%!');
