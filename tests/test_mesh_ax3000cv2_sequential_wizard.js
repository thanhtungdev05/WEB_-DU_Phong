/**
 * tests/test_mesh_ax3000cv2_sequential_wizard.js
 * Contract test verifying the Live Sequential Validation Wizard for Bài 7 (LAB_AX3000CV2_07).
 */

const fs = require('fs');
const path = require('path');
const assert = require('assert');

// 1. Verify canvas.js exports window.studioState and notifyParentTopologyChanged
const canvasCode = fs.readFileSync(path.join(__dirname, '../js/mesh-lab/canvas.js'), 'utf8');
assert(canvasCode.includes('window.studioState = studioState;'), 'canvas.js must attach studioState to window');
assert(canvasCode.includes('function notifyParentTopologyChanged()'), 'canvas.js must define notifyParentTopologyChanged()');
assert(canvasCode.includes('FTC_CANVAS_TOPOLOGY_CHANGED'), 'canvas.js must post FTC_CANVAS_TOPOLOGY_CHANGED message');

// 2. Load devices/ax3000c/tooltips/bai7.js in mock environment
const bai7Code = fs.readFileSync(path.join(__dirname, '../devices/ax3000c/tooltips/bai7.js'), 'utf8');

// Assert NO sub-step numbering (no 1.1, 1.2, 2.1...)
assert(!bai7Code.includes('Bước 1.1'), 'Must not have Bước 1.1');
assert(!bai7Code.includes('Bước 1.2'), 'Must not have Bước 1.2');
assert(!bai7Code.includes('Bước 2.1'), 'Must not have Bước 2.1');
assert(!bai7Code.includes('Bước 2.5'), 'Must not have Bước 2.5');

// Assert FW 0.5.3 exact field labels support
assert(bai7Code.includes('Connection Type'), 'Must support Connection Type label for WAN Protocol');
assert(bai7Code.includes('Passphrase'), 'Must support Passphrase label for Wi-Fi Password');
assert(bai7Code.includes('Use separate SSID'), 'Must support Use separate SSID switch label');

const mockWindow = {
  TOOLTIPS_AX3000C: {},
  FTC_AX3000C: {
    o: nhan => `.el-form-item[data-ftc-nhan="${nhan}"] input`,
    nut: chu => `.el-main button[data-ftc-nut="${chu}"]`
  }
};

const fn = new Function('window', 'document', bai7Code);
fn(mockWindow, {});

const T = mockWindow.TOOLTIPS_AX3000C;
assert(typeof T.getMeshBai7LiveStep === 'function', 'getMeshBai7LiveStep must be exported');

// Mock DOM elements helper
function createMockDoc(hash, selectors) {
  return {
    location: { hash },
    querySelector: sel => {
      const parts = sel.split(',').map(s => s.trim());
      for (const p of parts) {
        if (selectors[p]) return selectors[p];
      }
      return null;
    },
    querySelectorAll: sel => {
      const parts = sel.split(',').map(s => s.trim());
      const res = [];
      for (const p of parts) {
        if (selectors[p]) res.push(selectors[p]);
      }
      return res;
    }
  };
}

// 3. Test Easymesh Phase
{
  // Outside easymesh page
  const docMenu = createMockDoc('#/network/lan', {});
  const resMenu = T.getMeshBai7LiveStep(docMenu, 'easymesh');
  assert.strictEqual(resMenu.length, 1);
  assert(resMenu[0].text.includes('Bước 4'), 'Should show Bước 4 menu step');

  // On easymesh, switch disabled
  const swOff = { classList: { contains: () => false }, querySelector: () => null };
  const docSwOff = createMockDoc('#/network/easymesh', {
    '.el-form-item[data-ftc-nhan="Enabled"] .el-switch': swOff
  });
  const resSwOff = T.getMeshBai7LiveStep(docSwOff, 'easymesh');
  assert.strictEqual(resSwOff.length, 1);
  assert(resSwOff[0].text.includes('Bước 5'), 'Should show Bước 5 Enabled switch');

  // Switch enabled, role Agent
  const swOn = { classList: { contains: c => c === 'is-checked' }, querySelector: () => null };
  const roleAgent = { value: 'Agent' };
  const docRoleAgent = createMockDoc('#/network/easymesh', {
    '.el-form-item[data-ftc-nhan="Enabled"] .el-switch': swOn,
    '.el-form-item[data-ftc-nhan="MeshRole"] input': roleAgent
  });
  const resRoleAgent = T.getMeshBai7LiveStep(docRoleAgent, 'easymesh');
  assert.strictEqual(resRoleAgent.length, 1);
  assert(resRoleAgent[0].text.includes('Bước 6'), 'Should show Bước 6 MeshRole Controller');

  // Role Controller -> Apply button
  const roleController = { value: 'Controller' };
  const docController = createMockDoc('#/network/easymesh', {
    '.el-form-item[data-ftc-nhan="Enabled"] .el-switch': swOn,
    '.el-form-item[data-ftc-nhan="MeshRole"] input': roleController
  });
  const resController = T.getMeshBai7LiveStep(docController, 'easymesh');
  assert.strictEqual(resController.length, 1);
  assert(resController[0].text.includes('Bước 7'), 'Should show Bước 7 Apply');
}

// 4. Test WAN PPPoE Phase (using 3-level menu Network -> WAN -> WAN and Connection Type)
{
  // Outside WAN page, Network closed -> Bước 8: Chọn Network
  const docWanMenu1 = createMockDoc('#/status/lanstatus', {});
  const resWanMenu1 = T.getMeshBai7LiveStep(docWanMenu1, 'wan');
  assert.strictEqual(resWanMenu1.length, 1);
  assert(resWanMenu1[0].text.includes('Bước 8'), 'Should show Bước 8 Chọn Network');
  assert(resWanMenu1[0].selector.includes('[data-ftc-menu="Network"]'), 'Should select Network menu');

  // Network opened, WAN submenu closed -> Bước 8: Chọn WAN (submenu)
  const docWanMenu2 = createMockDoc('#/status/lanstatus', {
    'li.el-submenu.is-opened > .el-submenu__title[data-ftc-menu="Network"]': {}
  });
  const resWanMenu2 = T.getMeshBai7LiveStep(docWanMenu2, 'wan');
  assert.strictEqual(resWanMenu2.length, 1);
  assert(resWanMenu2[0].text.includes('Bước 8'), 'Should show Bước 8 Chọn WAN submenu');

  // Network opened, WAN submenu opened -> Bước 8: Chọn WAN (leaf item)
  const docWanMenu3 = createMockDoc('#/status/lanstatus', {
    'li.el-submenu.is-opened > .el-submenu__title[data-ftc-menu="Network"]': {},
    'li.el-submenu.is-opened li.el-submenu.is-opened > .el-submenu__title[data-ftc-menu="WAN"]': {}
  });
  const resWanMenu3 = T.getMeshBai7LiveStep(docWanMenu3, 'wan');
  assert.strictEqual(resWanMenu3.length, 1);
  assert(resWanMenu3[0].text.includes('Bước 8'), 'Should show Bước 8 Chọn WAN leaf item');
  assert(resWanMenu3[0].selector.includes('li.el-menu-item[data-ftc-menu="WAN"]'), 'Should select WAN item');

  // Connection Type DHCP -> Bước 9
  const docProtoDhcp = createMockDoc('#/network/wan', {
    '.el-form-item[data-ftc-nhan="Connection Type"] input': { value: 'DHCP' }
  });
  const resProto = T.getMeshBai7LiveStep(docProtoDhcp, 'wan');
  assert.strictEqual(resProto.length, 1);
  assert(resProto[0].text.includes('Bước 9'), 'Should show Bước 9 Connection Type');

  // Username wrong -> Bước 10
  const docUserWrong = createMockDoc('#/network/wan', {
    '.el-form-item[data-ftc-nhan="Connection Type"] input': { value: 'PPPoE' },
    '.el-form-item[data-ftc-nhan="PPP Username"] input': { value: 'wrong-user' }
  });
  const resUser = T.getMeshBai7LiveStep(docUserWrong, 'wan');
  assert.strictEqual(resUser.length, 1);
  assert(resUser[0].text.includes('Bước 10'), 'Should show Bước 10 Username');

  // Password wrong -> Bước 11
  const docPassWrong = createMockDoc('#/network/wan', {
    '.el-form-item[data-ftc-nhan="Connection Type"] input': { value: 'PPPoE' },
    '.el-form-item[data-ftc-nhan="PPP Username"] input': { value: 'sgfdl-123456-789' },
    '.el-form-item[data-ftc-nhan="PPP Password"] input': { value: 'wrong-pass' }
  });
  const resPass = T.getMeshBai7LiveStep(docPassWrong, 'wan');
  assert.strictEqual(resPass.length, 1);
  assert(resPass[0].text.includes('Bước 11'), 'Should show Bước 11 Password');

  // All correct -> Bước 12 Apply
  const docWanOk = createMockDoc('#/network/wan', {
    '.el-form-item[data-ftc-nhan="Connection Type"] input': { value: 'PPPoE' },
    '.el-form-item[data-ftc-nhan="PPP Username"] input': { value: 'sgfdl-123456-789' },
    '.el-form-item[data-ftc-nhan="PPP Password"] input': { value: 'd123456' }
  });
  const resWanOk = T.getMeshBai7LiveStep(docWanOk, 'wan');
  assert.strictEqual(resWanOk.length, 1);
  assert(resWanOk[0].text.includes('Bước 12'), 'Should show Bước 12 Apply WAN');
}

// 5. Test Wi-Fi Roaming Phase (using Use separate SSID and Passphrase)
{
  // Separate SSID checked -> Bước 14
  const sepOn = { classList: { contains: c => c === 'is-checked' }, querySelector: () => null };
  const docSepOn = createMockDoc('#/network/wifi', {
    '.el-switch[data-ftc-cong-tac="Use separate SSID"]': sepOn
  });
  const resSep = T.getMeshBai7LiveStep(docSepOn, 'wifi');
  assert.strictEqual(resSep.length, 1);
  assert(resSep[0].text.includes('Bước 14'), 'Should show Bước 14 Separate SSID off');

  // Separate SSID off, SSID wrong -> Bước 15
  const sepOff = { classList: { contains: () => false }, querySelector: () => null };
  const docSsidWrong = createMockDoc('#/network/wifi', {
    '.el-switch[data-ftc-cong-tac="Use separate SSID"]': sepOff,
    '#pane-hostssid .el-form-item[data-ftc-nhan="SSID"] input': { value: 'Wrong-SSID' }
  });
  const resSsid = T.getMeshBai7LiveStep(docSsidWrong, 'wifi');
  assert.strictEqual(resSsid.length, 1);
  assert(resSsid[0].text.includes('Bước 15'), 'Should show Bước 15 SSID FPT Telecom');

  // SSID correct, Passphrase wrong -> Bước 16
  const docWifiPassWrong = createMockDoc('#/network/wifi', {
    '.el-switch[data-ftc-cong-tac="Use separate SSID"]': sepOff,
    '#pane-hostssid .el-form-item[data-ftc-nhan="SSID"] input': { value: 'FPT Telecom' },
    '#pane-hostssid .el-form-item[data-ftc-nhan="Passphrase"] input': { value: '123' }
  });
  const resWifiPass = T.getMeshBai7LiveStep(docWifiPassWrong, 'wifi');
  assert.strictEqual(resWifiPass.length, 1);
  assert(resWifiPass[0].text.includes('Bước 16'), 'Should show Bước 16 Passphrase fpt12345');

  // All Wi-Fi correct -> Bước 17 Apply
  const docWifiOk = createMockDoc('#/network/wifi', {
    '.el-switch[data-ftc-cong-tac="Use separate SSID"]': sepOff,
    '#pane-hostssid .el-form-item[data-ftc-nhan="SSID"] input': { value: 'FPT Telecom' },
    '#pane-hostssid .el-form-item[data-ftc-nhan="Passphrase"] input': { value: 'fpt12345' }
  });
  const resWifiOk = T.getMeshBai7LiveStep(docWifiOk, 'wifi');
  assert.strictEqual(resWifiOk.length, 1);
  assert(resWifiOk[0].text.includes('Bước 17'), 'Should show Bước 17 Apply Wi-Fi');
}

// 6. Test Topology & Submit Phase
{
  const docTopo = createMockDoc('#/status/easymesh', {});
  const resTopo = T.getMeshBai7LiveStep(docTopo, 'topo');
  assert.strictEqual(resTopo.length, 1);
  assert(resTopo[0].text.includes('Bước 23'), 'Should show Bước 23 Submit');
  assert.strictEqual(resTopo[0].text, 'Bước 23: Kiểm tra Topology và bấm "Nộp bài & Chấm điểm"');
}

// 7. Verify concise tooltip wording in app.js for Bài 7
const appCode = fs.readFileSync(path.join(__dirname, '../app.js'), 'utf8');
assert(appCode.includes('Bước 1: Kéo AX3000CV2 thứ 1 (Controller) lên Canvas'), 'app.js must have concise Bước 1');
assert(appCode.includes('Bước 2: Kéo tiếp AX3000CV2 thứ 2 (Agent) lên Canvas'), 'app.js must have concise Bước 2');
assert(appCode.includes('Bước 3: Double-click hoặc bấm ⚙️ Mở'), 'app.js must have concise Bước 3');
assert(appCode.includes('Bước 18: Bấm "⬅ Quay lại Sơ đồ Canvas"'), 'app.js must have concise Bước 18');
assert(appCode.includes('Bước 19: Bấm chọn "🔌 Nối Cáp Mạng"'), 'app.js must have concise Bước 19');
assert(appCode.includes('Bước 20: Chọn cổng LAN 1 trên Trạm chính'), 'app.js must have concise Bước 20');
assert(appCode.includes('Bước 21: Chọn cổng LAN 1 trên Trạm phụ'), 'app.js must have concise Bước 21');
assert(appCode.includes('Bước 22: Double-click hoặc bấm ⚙️ Mở kiểm tra Topology'), 'app.js must have concise Bước 22');
assert(appCode.includes('Nhập Username: admin'), 'app.js must have reactive Login Username step');
assert(appCode.includes('Nhập Password: admin'), 'app.js must have reactive Login Password step');
assert(appCode.includes('Bấm Log In'), 'app.js must have reactive Login submit step');

console.log('✅ ALL SEQUENTIAL WIZARD TESTS (WITH CONNECTION TYPE & PASSPHRASE FIXES) PASSED SUCCESSFULLY!');
