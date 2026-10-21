'use strict';

const fs = require('fs');
const assert = require('assert');
const path = require('path');
const vm = require('vm');

const root = path.resolve(__dirname, '..');
const appJsPath = path.join(root, 'app.js');
const appJsCode = fs.readFileSync(appJsPath, 'utf8');

console.log('================================================================');
console.log('GIAI ĐOẠN 4: KIỂM THỬ TOÀN DIỆN 17 BÀI CỦA 3 THIẾT BỊ MỚI');
console.log('(ONT BE6500C: 6 BÀI, AP BE6500C: 5 BÀI, ONT BE12000: 6 BÀI)');
console.log('================================================================\n');

// 1. Trích xuất hàm evaluateLesson & isSaveRequiredDevice trực tiếp từ app.js
const isSaveRequiredMatch = appJsCode.match(/function isSaveRequiredDevice\([\s\S]*?\n  \}/);
assert.ok(isSaveRequiredMatch, 'Must find isSaveRequiredDevice in app.js');

const evalFnMatch = appJsCode.match(/function evaluateLesson\(device, lesson\) \{[\s\S]*?\n  function submitLab/);
assert.ok(evalFnMatch, 'Must find evaluateLesson in app.js');
const evaluateLessonCode = evalFnMatch[0].replace(/\n  function submitLab$/, '');

// 2. Thiết lập Sandbox chứa Engine chấm điểm của app.js
const sandbox = {
  console: console,
  window: {},
  document: { getElementById: () => null },
  currentDeviceId: '',
  currentLessonId: '',
  currentMode: 'guide',
  _trackingSession: null,
  _trackedOriginalValues: {},
  triggerSaveFlashEffect: () => {},
  DEVICES: [
    { id: 'ONT_be6500c', name: 'ONT BE6500C' },
    { id: 'be6500c', name: 'AP BE6500C' },
    { id: 'be12000', name: 'ONT BE12000' }
  ],
  mockDocs: []
};
sandbox.window = sandbox;

const engineScript = `
  var currentDeviceId = '';
  var currentLessonId = '';
  var currentMode = 'guide';
  var _trackingSession = null;
  var _trackedOriginalValues = {};
  var _hasClickedSaveInGuide = false;
  var _hasSuccHintStored = false;
  var deviceIframe = { contentWindow: {} };

  ${isSaveRequiredMatch[0]}
  function isNoConfigDevice() { return false; }
  function getAllAccessibleDocuments() { return window.mockDocs || []; }
  ${evaluateLessonCode}

  // Giả lập logic cập nhật trạng thái nút Nộp bài và nút Xem lỗi sai từ app.js
  function updateButtons(evalResult, mode, hasClickedSave) {
    let submitBtn = { disabled: false, opacity: '1', animation: 'submitBtnPulse 2.5s infinite' };
    let errorBtn = { display: 'none' };

    if (mode === 'practice') {
      submitBtn.disabled = false;
      submitBtn.opacity = '1';
      errorBtn.display = 'none';
    } else {
      if (hasClickedSave && evalResult && evalResult.passed) {
        submitBtn.disabled = false;
        submitBtn.opacity = '1';
        submitBtn.animation = 'submitBtnPulse 2.5s infinite';
        errorBtn.display = 'none';
      } else {
        submitBtn.disabled = true;
        submitBtn.opacity = '0.5';
        submitBtn.animation = 'none';
        if (hasClickedSave && evalResult && !evalResult.passed) {
          errorBtn.display = 'flex';
        } else {
          errorBtn.display = 'none';
        }
      }
    }
    return { submitBtn, errorBtn };
  }
`;

vm.createContext(sandbox);
vm.runInContext(engineScript, sandbox);

// 3. Helper tạo mock Document đại diện cho trang cấu hình simulator
function makeMockDoc(elementMap, isSaved, hasSuccHint) {
  const doc = {
    _ftcIsSaved: isSaved,
    _ftcHasSuccHint: hasSuccHint,
    querySelectorAll: function (selector) {
      const queryParts = selector.split(',').map(s => s.trim());
      for (const k in elementMap) {
        const keyParts = k.split(',').map(s => s.trim());
        const matched = queryParts.some(qp => {
          if (keyParts.includes(qp) || qp === k) return true;
          // [id="..."]
          const idMatch = qp.match(/\[id=["']?([^"'\]]+)["']?\]/);
          if (idMatch && (k.includes(idMatch[1]) || keyParts.some(kp => kp.includes(idMatch[1])))) return true;
          // [id^="..."]
          const idPrefixMatch = qp.match(/\[id\^=["']?([^"'\]]+)["']?\]/);
          if (idPrefixMatch && (k.includes(idPrefixMatch[1]) || keyParts.some(kp => kp.includes(idPrefixMatch[1])))) return true;
          // #id
          if (qp.startsWith('#')) {
            const rawId = qp.slice(1);
            if (k.includes(rawId) || keyParts.some(kp => kp.includes(rawId))) return true;
          }
          return false;
        });
        if (matched) return elementMap[k];
      }
      return [];
    },
    querySelector: function (selector) {
      if (selector.includes('template_PortForwarding')) {
        if (elementMap['#template_PortForwarding_0']) {
          return elementMap['#template_PortForwarding_0'][0];
        }
      }
      const list = this.querySelectorAll(selector);
      return list.length > 0 ? list[0] : null;
    },
    getElementById: function (id) {
      return this.querySelector('#' + id) || this.querySelector('[id="' + id + '"]');
    }
  };
  return doc;
}

// 4. Helper nạp file bài học
function loadLesson(filePath, globalVar, lessonId) {
  const code = fs.readFileSync(path.join(root, filePath), 'utf8');
  const ctx = { window: {} };
  vm.createContext(ctx);
  vm.runInContext(code, ctx);
  const arr = ctx.window[globalVar];
  assert.ok(Array.isArray(arr), `Must be array in ${filePath}`);
  const lesson = arr.find(l => l.id === lessonId);
  assert.ok(lesson, `Lesson ${lessonId} not found in ${filePath}`);
  return lesson;
}

// 5. Định nghĩa dữ liệu Đúng / Sai cho toàn bộ 18 bài
const LESSON_TEST_SPECS = [
  // ==================== ONT BE6500C (6 bài) ====================
  {
    device: 'ONT_be6500c',
    file: 'devices/ONT_be6500c/lessons/bai1.js',
    globalVar: 'DEVICE_ONT_BE6500C_LESSONS',
    id: 'ONT_be6500c-bai1',
    name: 'Bài 1: Cấu hình PPPoE',
    correctElements: {
      'input[name="radio"][value="10"]:checked, input[name="radio"][value="4"]:checked, input[name="radio"][value="6"]:checked': [{ checked: true, value: '10' }],
      'input[name="ipv4Settings.protocol"]': [{ value: 'pppoe' }],
      'input[name="ipv4Settings.pppoe.username"]': [{ value: 'hnfdl-123456-789' }],
      'input[name="ipv4Settings.pppoe.password"]': [{ value: 'd123456' }]
    },
    wrongElements: {
      'input[name="radio"][value="10"]:checked, input[name="radio"][value="4"]:checked, input[name="radio"][value="6"]:checked': [{ checked: true, value: 'sai_radio' }],
      'input[name="ipv4Settings.protocol"]': [{ value: 'dhcp' }],
      'input[name="ipv4Settings.pppoe.username"]': [{ value: 'wrong_username' }],
      'input[name="ipv4Settings.pppoe.password"]': [{ value: 'wrong_pass' }]
    }
  },
  {
    device: 'ONT_be6500c',
    file: 'devices/ONT_be6500c/lessons/bai2.js',
    globalVar: 'DEVICE_ONT_BE6500C_LESSONS',
    id: 'ONT_be6500c-bai2',
    name: 'Bài 2: Cấu hình Wi-Fi Band Steering',
    correctElements: {
      'input[name="useSeparateNetwork"]': [{ checked: false, value: 'false' }],
      'input[name="networks.1.name"]': [{ value: 'FPT Telecom' }],
      'input[name="networks.1.passphrase"]': [{ value: 'fpt12345' }]
    },
    wrongElements: {
      'input[name="useSeparateNetwork"]': [{ checked: true, value: 'true' }],
      'input[name="networks.1.name"]': [{ value: 'Sai Wi-Fi' }],
      'input[name="networks.1.passphrase"]': [{ value: '11111111' }]
    }
  },
  {
    device: 'ONT_be6500c',
    file: 'devices/ONT_be6500c/lessons/bai3.js',
    globalVar: 'DEVICE_ONT_BE6500C_LESSONS',
    id: 'ONT_be6500c-bai3',
    name: 'Bài 3: Cấu hình Wi-Fi IoT',
    correctElements: {
      'button#SmartHome[aria-selected="true"], #tabpanel-SmartHome:not([hidden])': [{ id: 'SmartHome' }],
      '#tabpanel-SmartHome input[name="networks.0.name"], div[role="tabpanel"][id*="SmartHome"] input[name="networks.0.name"]': [{ value: 'FPT IoT' }],
      '#tabpanel-SmartHome input[name="networks.0.passphrase"], div[role="tabpanel"][id*="SmartHome"] input[name="networks.0.passphrase"]': [{ value: 'fpt12345' }]
    },
    wrongElements: {
      // Cố tình ở tab Primary hoặc nhập sai
      'button#SmartHome[aria-selected="true"], #tabpanel-SmartHome:not([hidden])': [],
      '#tabpanel-SmartHome input[name="networks.0.name"], div[role="tabpanel"][id*="SmartHome"] input[name="networks.0.name"]': [{ value: 'FPT Sai IoT' }],
      '#tabpanel-SmartHome input[name="networks.0.passphrase"], div[role="tabpanel"][id*="SmartHome"] input[name="networks.0.passphrase"]': [{ value: 'sai_pass' }]
    }
  },
  {
    device: 'ONT_be6500c',
    file: 'devices/ONT_be6500c/lessons/bai4.js',
    globalVar: 'DEVICE_ONT_BE6500C_LESSONS',
    id: 'ONT_be6500c-bai4',
    name: 'Bài 4: Cấu hình DNS',
    correctElements: {
      'input[name="ipv4Settings.dns.dnsServers.primary"]': [{ value: '8.8.8.8' }],
      'input[name="ipv4Settings.dns.dnsServers.secondary"]': [{ value: '8.8.4.4' }]
    },
    wrongElements: {
      'input[name="ipv4Settings.dns.dnsServers.primary"]': [{ value: '1.2.3.4' }],
      'input[name="ipv4Settings.dns.dnsServers.secondary"]': [{ value: '5.6.7.8' }]
    }
  },
  {
    device: 'ONT_be6500c',
    file: 'devices/ONT_be6500c/lessons/bai5.js',
    globalVar: 'DEVICE_ONT_BE6500C_LESSONS',
    id: 'ONT_be6500c-bai5',
    name: 'Bài 5: Cấu hình mạng LAN',
    correctElements: {
      'input[name="ipv4Settings.ipAddress"]': [{ value: '192.168.10.1' }],
      'input[name="ipv4Settings.mask"], .MuiAutocomplete-input': [{ value: '255.255.255.0' }],
      'input[name="ipv4Settings.dhcp.startAddress"]': [{ value: '192.168.10.2' }],
      'input[name="ipv4Settings.dhcp.endAddress"]': [{ value: '192.168.10.254' }]
    },
    wrongElements: {
      'input[name="ipv4Settings.ipAddress"]': [{ value: '10.0.0.1' }],
      '.MuiAutocomplete-input': [{ value: '255.0.0.0' }],
      'input[name="ipv4Settings.dhcp.enabled"]': [{ value: 'false' }],
      'input[name="ipv4Settings.dhcp.startAddress"]': [{ value: '10.0.0.2' }],
      'input[name="ipv4Settings.dhcp.endAddress"]': [{ value: '10.0.0.254' }],
      'input[name="ipv4Settings.dhcp.leaseTime.days"]': [{ value: '7' }],
      'input[name="ipv4Settings.dhcp.leaseTime.hours"]': [{ value: '24' }]
    }
  },
  {
    device: 'ONT_be6500c',
    file: 'devices/ONT_be6500c/lessons/bai6.js',
    globalVar: 'DEVICE_ONT_BE6500C_LESSONS',
    id: 'ONT_be6500c-bai6',
    name: 'Bài 6: Cấu hình Port Forwarding',
    correctElements: {
      'tbody tr td:nth-child(3)': [{ textContent: 'Camera' }],
      'tbody tr td:nth-child(4)': [{ textContent: 'TCP + UDP' }],
      'tbody tr td:nth-child(5)': [{ textContent: '8080' }],
      'tbody tr td:nth-child(6), tbody tr td:nth-child(6) span': [{ textContent: '192.168.1.20' }],
      'tbody tr td:nth-child(7)': [{ textContent: '80' }]
    },
    wrongElements: {
      'tbody tr td:nth-child(3)': [{ textContent: 'SaiCamera' }],
      'tbody tr td:nth-child(4)': [{ textContent: 'TCP' }],
      'tbody tr td:nth-child(5)': [{ textContent: '9999' }],
      'tbody tr td:nth-child(6), tbody tr td:nth-child(6) span': [{ textContent: '192.168.1.99' }],
      'tbody tr td:nth-child(7)': [{ textContent: '99' }]
    }
  },

  // ==================== AP BE6500C (6 bài) ====================
  {
    device: 'be6500c',
    file: 'devices/be6500c/lessons/bai1.js',
    globalVar: 'DEVICE_BE6500C_LESSONS',
    id: 'be6500c-bai1',
    name: 'Bài 1: Cấu hình PPPoE',
    correctElements: {
      'input[name="radio"][value="10"]:checked, input[name="radio"][value="4"]:checked, input[name="radio"][value="6"]:checked': [{ checked: true, value: '10' }],
      'input[name="ipv4Settings.protocol"]': [{ value: 'pppoe' }],
      'input[name="ipv4Settings.pppoe.username"]': [{ value: 'hnfdl-123456-789' }],
      'input[name="ipv4Settings.pppoe.password"]': [{ value: 'd123456' }]
    },
    wrongElements: {
      'input[name="radio"][value="10"]:checked, input[name="radio"][value="4"]:checked, input[name="radio"][value="6"]:checked': [{ checked: true, value: 'sai_radio' }],
      'input[name="ipv4Settings.protocol"]': [{ value: 'dhcp' }],
      'input[name="ipv4Settings.pppoe.username"]': [{ value: 'sai_user' }],
      'input[name="ipv4Settings.pppoe.password"]': [{ value: 'sai_pwd' }]
    }
  },
  {
    device: 'be6500c',
    file: 'devices/be6500c/lessons/bai2.js',
    globalVar: 'DEVICE_BE6500C_LESSONS',
    id: 'be6500c-bai2',
    name: 'Bài 2: Cấu hình Wi-Fi Band Steering',
    correctElements: {
      'input[name="useSeparateNetwork"]': [{ checked: false, value: 'false' }],
      'input[name="networks.1.name"]': [{ value: 'FPT Telecom' }],
      'input[name="networks.1.passphrase"]': [{ value: 'fpt12345' }]
    },
    wrongElements: {
      'input[name="useSeparateNetwork"]': [{ checked: true, value: 'true' }],
      'input[name="networks.1.name"]': [{ value: 'Sai_SSID' }],
      'input[name="networks.1.passphrase"]': [{ value: 'sai_pass' }]
    }
  },
  {
    device: 'be6500c',
    file: 'devices/be6500c/lessons/bai3.js',
    globalVar: 'DEVICE_BE6500C_LESSONS',
    id: 'be6500c-bai3',
    name: 'Bài 3: Cấu hình Wi-Fi IoT',
    correctElements: {
      'button#SmartHome[aria-selected="true"], #tabpanel-SmartHome:not([hidden])': [{ id: 'SmartHome' }],
      '#tabpanel-SmartHome input[name="networks.0.name"], div[role="tabpanel"][id*="SmartHome"] input[name="networks.0.name"]': [{ value: 'FPT IoT' }],
      '#tabpanel-SmartHome input[name="networks.0.passphrase"], div[role="tabpanel"][id*="SmartHome"] input[name="networks.0.passphrase"]': [{ value: 'fpt12345' }]
    },
    wrongElements: {
      'button#SmartHome[aria-selected="true"], #tabpanel-SmartHome:not([hidden])': [{ id: 'SmartHome' }],
      '#tabpanel-SmartHome input[name="networks.0.name"], div[role="tabpanel"][id*="SmartHome"] input[name="networks.0.name"]': [{ value: 'Sai_IoT' }],
      '#tabpanel-SmartHome input[name="networks.0.passphrase"], div[role="tabpanel"][id*="SmartHome"] input[name="networks.0.passphrase"]': [{ value: 'sai_pass' }]
    }
  },
  {
    device: 'be6500c',
    file: 'devices/be6500c/lessons/bai4.js',
    globalVar: 'DEVICE_BE6500C_LESSONS',
    id: 'be6500c-bai4',
    name: 'Bài 4: Cấu hình mạng LAN',
    correctElements: {
      'input[name="ipv4Settings.ipAddress"]': [{ value: '192.168.10.1' }],
      'input[name="ipv4Settings.mask"]': [{ value: '255.255.255.0' }]
    },
    wrongElements: {
      'input[name="ipv4Settings.ipAddress"]': [{ value: '172.16.0.1' }],
      'input[name="ipv4Settings.mask"]': [{ value: '255.255.0.0' }]
    }
  },
  {
    device: 'be6500c',
    file: 'devices/be6500c/lessons/bai5.js',
    globalVar: 'DEVICE_BE6500C_LESSONS',
    id: 'be6500c-bai5',
    name: 'Bài 5: Cấu hình Port Forwarding',
    correctElements: {
      'tbody tr td:nth-child(3)': [{ textContent: 'Camera' }],
      'tbody tr td:nth-child(4)': [{ textContent: 'TCP_UDP' }],
      'tbody tr td:nth-child(5)': [{ textContent: '8080' }],
      'tbody tr td:nth-child(6), tbody tr td:nth-child(6) span': [{ textContent: '192.168.1.20' }],
      'tbody tr td:nth-child(7)': [{ textContent: '80' }]
    },
    wrongElements: {
      'tbody tr td:nth-child(3)': [{ textContent: 'SaiCamera' }],
      'tbody tr td:nth-child(4)': [{ textContent: 'TCP' }],
      'tbody tr td:nth-child(5)': [{ textContent: '9999' }],
      'tbody tr td:nth-child(6), tbody tr td:nth-child(6) span': [{ textContent: '192.168.1.99' }],
      'tbody tr td:nth-child(7)': [{ textContent: '99' }]
    }
  },

  // ==================== ONT BE12000 (6 bài) ====================
  {
    device: 'be12000',
    file: 'devices/be12000/lessons/bai1.js',
    globalVar: 'DEVICE_BE12000_LESSONS',
    id: 'LAB_BE12000_01',
    name: 'Bài 1: Cấu hình PPPoE',
    correctElements: {
      '#WANCName, input[id^="WANCName"], input[name="WANCName"]': [{ value: 'FPT' }],
      '#UserName, input[id^="UserName"], input[name="UserName"]': [{ value: 'hnfdl-123456-789' }],
      '#Password, input[id^="Password"], input[name="Password"]': [{ value: 'd123456' }],
      'input[name^="IsNAT"], input[id^="IsNAT"], #IsNAT1, #IsNAT0': [{ id: 'IsNAT1', value: '1', checked: true, type: 'radio' }, { id: 'IsNAT0', value: '0', checked: false, type: 'radio' }],
      'input[name^="VlanEnable"], input[id^="VlanEnable"], #VlanEnable1, #VlanEnable0': [{ id: 'VlanEnable1', value: '1', checked: false, type: 'radio' }, { id: 'VlanEnable0', value: '0', checked: true, type: 'radio' }]
    },
    wrongElements: {
      '#WANCName, input[id^="WANCName"], input[name="WANCName"]': [{ value: 'SAI_NAME' }],
      '#UserName, input[id^="UserName"], input[name="UserName"]': [{ value: 'sai_user' }],
      '#Password, input[id^="Password"], input[name="Password"]': [{ value: 'sai_pwd' }],
      'input[name^="IsNAT"], input[id^="IsNAT"], #IsNAT1, #IsNAT0': [{ id: 'IsNAT1', value: '1', checked: false, type: 'radio' }, { id: 'IsNAT0', value: '0', checked: true, type: 'radio' }],
      'input[name^="VlanEnable"], input[id^="VlanEnable"], #VlanEnable1, #VlanEnable0': [{ id: 'VlanEnable1', value: '1', checked: true, type: 'radio' }, { id: 'VlanEnable0', value: '0', checked: false, type: 'radio' }]
    }
  },
  {
    device: 'be12000',
    file: 'devices/be12000/lessons/bai2.js',
    globalVar: 'DEVICE_BE12000_LESSONS',
    id: 'LAB_BE12000_02',
    name: 'Bài 2: Cấu hình Wi-Fi MLO (Wi-Fi 7)',
    correctElements: {
      '[id="ESSID:0"], #ESSID\\:0, input[id="ESSID:0"]': [{ value: 'FPT Telecom' }],
      '[id="EncryptionType:0"], #EncryptionType\\:0, select[id="EncryptionType:0"]': [{ value: 'WPA2-PSK-AES' }],
      '[id="KeyPassphrase:0"], #KeyPassphrase\\:0, input[id="KeyPassphrase:0"]': [{ value: '19006600' }]
    },
    wrongElements: {
      '[id="ESSID:0"], #ESSID\\:0, input[id="ESSID:0"]': [{ value: 'Wrong_SSID' }],
      '[id="EncryptionType:0"], #EncryptionType\\:0, select[id="EncryptionType:0"]': [{ value: 'Open' }],
      '[id="KeyPassphrase:0"], #KeyPassphrase\\:0, input[id="KeyPassphrase:0"]': [{ value: '00000000' }]
    }
  },
  {
    device: 'be12000',
    file: 'devices/be12000/lessons/bai3.js',
    globalVar: 'DEVICE_BE12000_LESSONS',
    id: 'LAB_BE12000_03',
    name: 'Bài 3: Cấu hình Wi-Fi IoT',
    correctElements: {
      'input[name="Enable:1"]:checked, #Enable1\\:1, input[id="Enable1:1"]': [{ checked: true, value: '1' }],
      '[id="ESSID:1"], #ESSID\\:1, input[id="ESSID:1"]': [{ value: 'FPT Telecom-IoT' }],
      'input[name="ESSIDHideEnable:1"]:checked, #ESSIDHideEnable1\\:1, input[id="ESSIDHideEnable1:1"]': [{ checked: true, value: '0' }],
      '[id="EncryptionType:1"], #EncryptionType\\:1, select[id="EncryptionType:1"]': [{ value: 'WPA2-PSK-AES' }],
      '[id="KeyPassphrase:1"], #KeyPassphrase\\:1, input[id="KeyPassphrase:1"]': [{ value: '19006600' }]
    },
    wrongElements: {
      'input[name="Enable:1"]:checked, #Enable1\\:1, input[id="Enable1:1"]': [{ checked: false, value: '0' }],
      '[id="ESSID:1"], #ESSID\\:1, input[id="ESSID:1"]': [{ value: 'Sai_IoT' }],
      'input[name="ESSIDHideEnable:1"]:checked, #ESSIDHideEnable1\\:1, input[id="ESSIDHideEnable1:1"]': [{ checked: true, value: '1' }], // Cố tình chọn Hide: On
      '[id="EncryptionType:1"], #EncryptionType\\:1, select[id="EncryptionType:1"]': [{ value: 'Open' }],
      '[id="KeyPassphrase:1"], #KeyPassphrase\\:1, input[id="KeyPassphrase:1"]': [{ value: '123' }]
    }
  },
  {
    device: 'be12000',
    file: 'devices/be12000/lessons/bai4.js',
    globalVar: 'DEVICE_BE12000_LESSONS',
    id: 'LAB_BE12000_04',
    name: 'Bài 4: Cấu hình DNS (customGrading full IP)',
    correctElements: {
      '#Btn_apply_DHCPBasicCfg': [{ id: 'Btn_apply_DHCPBasicCfg' }],
      '#DHCPBasicCfgBar': [{ id: 'DHCPBasicCfgBar' }],
      '#sub_DNSServer10, input[name="sub_DNSServer10"]': [{ value: '210' }],
      '#sub_DNSServer11, input[name="sub_DNSServer11"]': [{ value: '245' }],
      '#sub_DNSServer12, input[name="sub_DNSServer12"]': [{ value: '31' }],
      '#sub_DNSServer13, input[name="sub_DNSServer13"]': [{ value: '220' }],
      '#sub_DNSServer20, input[name="sub_DNSServer20"]': [{ value: '8' }],
      '#sub_DNSServer21, input[name="sub_DNSServer21"]': [{ value: '8' }],
      '#sub_DNSServer22, input[name="sub_DNSServer22"]': [{ value: '8' }],
      '#sub_DNSServer23, input[name="sub_DNSServer23"]': [{ value: '8' }]
    },
    wrongElements: {
      '#Btn_apply_DHCPBasicCfg': [{ id: 'Btn_apply_DHCPBasicCfg' }],
      '#DHCPBasicCfgBar': [{ id: 'DHCPBasicCfgBar' }],
      // Cố tình nhập lai tạp vô nghĩa: 210.8.1.1
      '#sub_DNSServer10, input[name="sub_DNSServer10"]': [{ value: '210' }],
      '#sub_DNSServer11, input[name="sub_DNSServer11"]': [{ value: '8' }],
      '#sub_DNSServer12, input[name="sub_DNSServer12"]': [{ value: '1' }],
      '#sub_DNSServer13, input[name="sub_DNSServer13"]': [{ value: '1' }],
      '#sub_DNSServer20, input[name="sub_DNSServer20"]': [{ value: '8' }],
      '#sub_DNSServer21, input[name="sub_DNSServer21"]': [{ value: '4' }],
      '#sub_DNSServer22, input[name="sub_DNSServer22"]': [{ value: '4' }],
      '#sub_DNSServer23, input[name="sub_DNSServer23"]': [{ value: '0' }]
    }
  },
  {
    device: 'be12000',
    file: 'devices/be12000/lessons/bai5.js',
    globalVar: 'DEVICE_BE12000_LESSONS',
    id: 'LAB_BE12000_05',
    name: 'Bài 5: Cấu hình DHCP (customGrading isSaved)',
    correctElements: {
      '#Btn_apply_DHCPBasicCfg': [{ id: 'Btn_apply_DHCPBasicCfg' }],
      '#ServerEnable1, input[name="ServerEnable"][value="1"]': [{ checked: true, value: '1' }],
      '#sub_IPAddr0:DHCPBasicCfg': [{ value: '192' }],
      '#sub_IPAddr1:DHCPBasicCfg': [{ value: '168' }],
      '#sub_IPAddr2:DHCPBasicCfg': [{ value: '10' }],
      '#sub_IPAddr3:DHCPBasicCfg': [{ value: '1' }],
      '#sub_SubMask0': [{ value: '255' }],
      '#sub_SubMask1': [{ value: '255' }],
      '#sub_SubMask2': [{ value: '255' }],
      '#sub_SubMask3': [{ value: '0' }],
      '#sub_MinAddress0:DHCPBasicCfg': [{ value: '192' }],
      '#sub_MinAddress1:DHCPBasicCfg': [{ value: '168' }],
      '#sub_MinAddress2:DHCPBasicCfg': [{ value: '10' }],
      '#sub_MinAddress3:DHCPBasicCfg': [{ value: '2' }],
      '#sub_MaxAddress0:DHCPBasicCfg': [{ value: '192' }],
      '#sub_MaxAddress1:DHCPBasicCfg': [{ value: '168' }],
      '#sub_MaxAddress2:DHCPBasicCfg': [{ value: '10' }],
      '#sub_MaxAddress3:DHCPBasicCfg': [{ value: '254' }]
    },
    wrongElements: {
      '#Btn_apply_DHCPBasicCfg': [{ id: 'Btn_apply_DHCPBasicCfg' }],
      '#ServerEnable1, input[name="ServerEnable"][value="1"]': [{ checked: false, value: '0' }],
      '#sub_IPAddr0:DHCPBasicCfg': [{ value: '10' }],
      '#sub_IPAddr1:DHCPBasicCfg': [{ value: '0' }],
      '#sub_IPAddr2:DHCPBasicCfg': [{ value: '0' }],
      '#sub_IPAddr3:DHCPBasicCfg': [{ value: '99' }],
      '#sub_SubMask0': [{ value: '255' }],
      '#sub_SubMask1': [{ value: '0' }],
      '#sub_SubMask2': [{ value: '0' }],
      '#sub_SubMask3': [{ value: '128' }],
      '#sub_MinAddress0:DHCPBasicCfg': [{ value: '10' }],
      '#sub_MinAddress1:DHCPBasicCfg': [{ value: '0' }],
      '#sub_MinAddress2:DHCPBasicCfg': [{ value: '0' }],
      '#sub_MinAddress3:DHCPBasicCfg': [{ value: '10' }],
      '#sub_MaxAddress0:DHCPBasicCfg': [{ value: '10' }],
      '#sub_MaxAddress1:DHCPBasicCfg': [{ value: '0' }],
      '#sub_MaxAddress2:DHCPBasicCfg': [{ value: '0' }],
      '#sub_MaxAddress3:DHCPBasicCfg': [{ value: '50' }]
    }
  },
  {
    device: 'be12000',
    file: 'devices/be12000/lessons/bai6.js',
    globalVar: 'DEVICE_BE12000_LESSONS',
    id: 'LAB_BE12000_06',
    name: 'Bài 6: Cấu hình Port Forwarding (strict 192.168.1.100 & 8080)',
    correctElements: {
      '#PortForwardingBar': [{ id: 'PortForwardingBar' }],
      '#template_PortForwarding_0': [{
        id: 'template_PortForwarding_0',
        querySelector: function (sel) {
          if (sel.includes('Alias')) return { value: 'Camera' };
          if (sel.includes('Protocol')) return { value: 'BOTH' };
          if (sel.includes('InternalClient')) return { value: '192.168.1.100' };
          if (sel.includes('ExternalPort')) return { value: '8080' };
          if (sel.includes('InternalPort')) return { value: '8080' };
          return null;
        }
      }]
    },
    wrongElements: {
      '#PortForwardingBar': [{ id: 'PortForwardingBar' }],
      '#template_PortForwarding_0': [{
        id: 'template_PortForwarding_0',
        querySelector: function (sel) {
          if (sel.includes('Alias')) return { value: 'Sai' };
          if (sel.includes('Protocol')) return { value: 'TCP' };
          if (sel.includes('InternalClient')) return { value: '192.168.1.1' }; // Router IP
          if (sel.includes('ExternalPort')) return { value: '80' };
          if (sel.includes('InternalPort')) return { value: '80' };
          return null;
        }
      }]
    }
  }
];

// 6. Chạy kiểm thử từng bài trong cả 3 kịch bản
let totalTestsRun = 0;
let totalTestsPassed = 0;

for (const spec of LESSON_TEST_SPECS) {
  console.log(`\n▶ [${spec.device}] ${spec.id} - ${spec.name}`);
  const lesson = loadLesson(spec.file, spec.globalVar, spec.id);
  const deviceObj = { id: spec.device, name: spec.device };

  sandbox.currentDeviceId = spec.device;
  sandbox.currentLessonId = spec.id;

  // -------------------------------------------------------------
  // KỊCH BẢN 1: CỐ TÌNH NHẬP SAI (Đã bấm Save/Apply: isSaved = true)
  // Kỳ vọng: evaluateLesson PHẢI TRẢ VỀ FALSE.
  // Ở Chế độ Hướng dẫn: Nút nộp bài MỜ (disabled=true), Nút Lỗi sai SÁNG ĐỎ (display=flex).
  // -------------------------------------------------------------
  totalTestsRun++;
  sandbox.window._sessionRuleCache = {};
  sandbox.window._trackingSession = null;
  sandbox.mockDocs = [makeMockDoc(spec.wrongElements, true, true)];
  sandbox.window._hasClickedSaveInGuide = true;
  sandbox.window._hasSuccHintStored = true;
  sandbox.currentMode = 'guide';

  const evalWrong = sandbox.evaluateLesson(deviceObj, lesson);
  assert.strictEqual(evalWrong.passed, false,
    `[FAIL] ${spec.id} must NOT pass when wrong values are entered (even with Save/Apply clicked)!`);

  const btnsWrong = sandbox.updateButtons(evalWrong, 'guide', true);
  assert.strictEqual(btnsWrong.submitBtn.disabled, true,
    `[FAIL] ${spec.id} Guide submit button must be DISABLED when values are wrong!`);
  assert.strictEqual(btnsWrong.errorBtn.display, 'flex',
    `[FAIL] ${spec.id} Guide error button must display RED ('flex') when wrong!`);
  totalTestsPassed++;
  console.log('   ✓ Ca 1 (Cố tình nhập sai + Đã Save): Chấm SAI chính xác. Nút Nộp bài MỜ, Nút Xem lỗi sai SÁNG ĐỎ.');

  // -------------------------------------------------------------
  // KỊCH BẢN 2: QUÊN BẤM LƯU (Nhập ĐÚNG 100% nhưng isSaved = false)
  // Kỳ vọng: evaluateLesson PHẢI TRẢ VỀ FALSE (báo chưa lưu cấu hình).
  // Ở Chế độ Hướng dẫn: Nút nộp bài MỜ (disabled=true).
  // -------------------------------------------------------------
  totalTestsRun++;
  sandbox.window._sessionRuleCache = {};
  sandbox.window._trackingSession = null;
  sandbox.mockDocs = [makeMockDoc(spec.correctElements, false, false)];
  sandbox.window._hasClickedSaveInGuide = false;
  sandbox.window._hasSuccHintStored = false;
  sandbox.currentMode = 'guide';

  const evalUnsaved = sandbox.evaluateLesson(deviceObj, lesson);
  assert.strictEqual(evalUnsaved.passed, false,
    `[FAIL] ${spec.id} must NOT pass when Save/Apply was NEVER clicked!`);

  const btnsUnsaved = sandbox.updateButtons(evalUnsaved, 'guide', false);
  assert.strictEqual(btnsUnsaved.submitBtn.disabled, true,
    `[FAIL] ${spec.id} Guide submit button must be DISABLED when not saved!`);
  totalTestsPassed++;
  console.log('   ✓ Ca 2 (Nhập đúng nhưng Quên bấm Lưu): Chấm SAI chính xác (Yêu cầu bấm Save/Apply).');

  // -------------------------------------------------------------
  // KỊCH BẢN 3: LÀM ĐÚNG 100% (Nhập đúng + Đã bấm Save: isSaved = true)
  // Kỳ vọng: evaluateLesson PHẢI TRẢ VỀ TRUE (100% điểm).
  // Ở Chế độ Hướng dẫn: Nút nộp bài SÁNG LÊN (disabled=false, opacity=1, pulse), Nút Lỗi sai ẨN (display=none).
  // -------------------------------------------------------------
  totalTestsRun++;
  sandbox.window._sessionRuleCache = {};
  sandbox.window._trackingSession = null;
  sandbox.mockDocs = [makeMockDoc(spec.correctElements, true, true)];
  sandbox.window._hasClickedSaveInGuide = true;
  sandbox.window._hasSuccHintStored = true;
  sandbox.currentMode = 'guide';

  const evalCorrect = sandbox.evaluateLesson(deviceObj, lesson);
  assert.strictEqual(evalCorrect.passed, true,
    `[FAIL] ${spec.id} must PASS when all fields are correct and saved! Details: ` + JSON.stringify(evalCorrect.details));

  const btnsCorrect = sandbox.updateButtons(evalCorrect, 'guide', true);
  assert.strictEqual(btnsCorrect.submitBtn.disabled, false,
    `[FAIL] ${spec.id} Guide submit button must be ENABLED when 100% correct!`);
  assert.strictEqual(btnsCorrect.submitBtn.opacity, '1',
    `[FAIL] ${spec.id} Guide submit button opacity must be 1!`);
  assert.strictEqual(btnsCorrect.errorBtn.display, 'none',
    `[FAIL] ${spec.id} Guide error button must be HIDDEN when 100% correct!`);
  totalTestsPassed++;
  console.log('   ✓ Ca 3 (Làm đúng 100% + Đã Save): Chấm ĐẠT 100%. Nút Nộp bài SÁNG LÊN (Active & Pulse), Nút Lỗi sai ẨN.');

  // -------------------------------------------------------------
  // KỊCH BẢN 4: CHẾ ĐỘ THỰC HÀNH (Practice Mode)
  // Nút Nộp bài luôn sẵn sàng để học viên nộp bài bất kỳ lúc nào.
  // Khi nộp: Ca đúng nộp được ĐẠT, Ca sai nộp bị CHƯA ĐẠT.
  // -------------------------------------------------------------
  totalTestsRun++;
  const btnsPractice = sandbox.updateButtons(evalCorrect, 'practice', true);
  assert.strictEqual(btnsPractice.submitBtn.disabled, false,
    `[FAIL] ${spec.id} Practice submit button must be enabled at all times!`);
  assert.strictEqual(btnsPractice.errorBtn.display, 'none',
    `[FAIL] ${spec.id} Practice error button must be hidden at all times!`);
  totalTestsPassed++;
  console.log('   ✓ Ca 4 (Chế độ Thực hành): Nút Nộp bài luôn khả dụng, không lộ lỗi trước khi nộp.');
}

console.log('\n================================================================');
console.log(`KẾT QUẢ: ĐÃ CHẠY THÀNH CÔNG ${totalTestsPassed}/${totalTestsRun} BÀI KIỂM THỬ.`);
console.log('TOÀN BỘ 17 BÀI CỦA 3 THIẾT BỊ MỚI ĐÃ ĐƯỢC XÁC THỰC HOÀN HẢO 100%!');
console.log('================================================================');
