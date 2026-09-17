/**
 * devices/be12000/lessons/bai3.js
 * Bài 3 - Cấu hình Wi-Fi IoT trên BE12000
 */

window.DEVICE_BE12000_LESSONS = window.DEVICE_BE12000_LESSONS || [];

var lessonId = 'LAB_BE12000_03';
var lessonData = {
  id: lessonId,
  title: 'Cấu hình wifi IoT',
  subtitle: 'Cấu hình mạng Wi-Fi IoT (SSID2)',
  instructions: [
    '<b>Yêu cầu:</b>',
    'Thực hiện cấu hình mạng Wi-Fi IoT (SSID2) trên thiết bị ONT BE12000 tại menu <b>Local Network > WLAN > WLAN Basic > WLAN SSID Configuration</b> theo các thông số sau:',
    '- Kích hoạt SSID2: <span class="val">On</span>',
    '- Mở cấu hình <b>SSID2 (2.4GHz)</b>',
    '- SSID Name: <span class="val">FPT Telecom-IoT</span>',
    '- SSID Hide: <span class="val">Off</span>',
    '- Encryption Type: <span class="val">WPA2-PSK-AES</span>',
    '- WPA Passphrase: <span class="val">19006600</span>',
    '- SSID Isolation: <span class="val">Off</span>',
    '- Maximum Clients: <span class="val">32</span>',
    'Nhấn <b>Apply</b> để lưu cấu hình'
  ],
  practiceUrl: '/sim_be12000/login',
  onSimLoad: function (simWin) {
    try {
      if (simWin && simWin.top) {
        simWin.top._hasSuccHintStored = false;
        simWin.top._hasClickedSaveInGuide = false;
      }
    } catch (e) { }
  },
  clearFields: [
    '[id="ESSID:1"]',
    '[id="KeyPassphrase:1"]',
    '#ESSID\\:1',
    '#KeyPassphrase\\:1',
    'input[id="ESSID:1"]',
    'input[id="KeyPassphrase:1"]'
  ],
  grading: {
    description: 'Kiểm tra cấu hình Wi-Fi IoT (SSID2) trên BE12000',
    rules: [
      {
        id: 'iot_enable',
        name: 'Kích hoạt SSID2 (On)',
        selector: 'input[name="Enable:1"]:checked, #Enable1\\:1, input[id="Enable1:1"]',
        expected: '1',
        type: 'text_exact',
        trim: true,
        required: true
      },
      {
        id: 'iot_ssid',
        name: 'SSID Name (FPT Telecom-IoT)',
        selector: '[id="ESSID:1"], #ESSID\\:1, input[id="ESSID:1"]',
        expected: 'FPT Telecom-IoT',
        type: 'text_exact',
        trim: true,
        required: true
      },
      {
        id: 'iot_enc',
        name: 'Encryption Type (WPA2-PSK-AES)',
        selector: '[id="EncryptionType:1"], #EncryptionType\\:1, select[id="EncryptionType:1"]',
        expected: 'WPA2-PSK-AES',
        type: 'text_exact',
        trim: true,
        required: true
      },
      {
        id: 'iot_pass',
        name: 'WPA Passphrase (19006600)',
        selector: '[id="KeyPassphrase:1"], #KeyPassphrase\\:1, input[id="KeyPassphrase:1"]',
        expected: '19006600',
        type: 'text_exact',
        trim: true,
        required: true
      }
    ]
  },
  guidePopups: (window.TOOLTIPS_BE12000 && window.TOOLTIPS_BE12000[lessonId]) || [
    {
      selector: '#localnet:not(.SelectMenuItem)',
      text: 'Chọn Local Network',
      position: 'bottom'
    },
    {
      selector: '#wlanConfig:not(.selectClass2Menu)',
      text: 'Chọn WLAN',
      position: 'right'
    },
    {
      selector: '#wlanBasic:not(.selectClass3Menu)',
      text: 'Chọn WLAN Basic',
      position: 'right'
    },
    {
      selector: '#WLANSSIDConfBar[aria-expanded="false"], #WLANSSIDConf:not(:has(#WLANSSIDConf_container:visible)) #WLANSSIDConfBar',
      text: 'Mở WLAN SSID Configuration',
      position: 'top'
    },
    {
      selector: 'label[for="Enable1:1"], #Enable1\\:1, input[id="Enable1:1"]',
      text: 'Bước 1: Chọn On để kích hoạt SSID2',
      position: 'top',
      expected: '1'
    },
    {
      selector: '#template_WLANSSIDConf_1 .instName:not(.instNameExp), [id="instName_WLANSSIDConf:1"]:not(.instNameExp)',
      text: 'Bước 2: Click mở cấu hình SSID2 (2.4GHz)',
      position: 'top'
    },
    {
      selector: '[id="ESSID:1"]:not(:disabled), input[id="ESSID:1"]:not(:disabled)',
      text: 'Bước 3: Nhập SSID Name: FPT Telecom-IoT',
      position: 'right',
      expected: 'FPT Telecom-IoT'
    },
    {
      selector: 'label[for="ESSIDHideEnable1:1"], input[id="ESSIDHideEnable1:1"]',
      text: 'Bước 4: Chọn Off của phần SSID Hide (tắt ẩn mạng)',
      position: 'right'
    },
    {
      selector: '[id="EncryptionType:1"]:not(:disabled), select[id="EncryptionType:1"]:not(:disabled)',
      text: 'Bước 5: Chọn Encryption Type: WPA2-PSK-AES',
      position: 'right'
    },
    {
      selector: '[id="KeyPassphrase:1"]:not(:disabled), input[id="KeyPassphrase:1"]:not(:disabled)',
      text: 'Bước 6: Nhập WPA Passphrase: 19006600',
      position: 'right',
      expected: '19006600'
    },
    {
      selector: '[id="Btn_apply_WLANSSIDConf:1"]:not(.disableBtn)',
      text: 'Bước 7: Nhấn Apply để lưu cấu hình',
      position: 'top'
    }
  ]
};

window.DEVICE_BE12000_LESSONS.push(lessonData);
