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
    '- SSID Name: <span class="val">FPT Telecom-IoT</span>',
    '- Encryption Type: <span class="val">WPA2-PSK-AES</span>',
    '- WPA Passphrase: <span class="val">19006600</span>'
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
        id: 'iot_hide',
        name: 'SSID Hide (Off)',
        selector: 'input[name="ESSIDHideEnable:1"]:checked, #ESSIDHideEnable1\\:1, input[id="ESSIDHideEnable1:1"]',
        expected: '0',
        displayExpected: 'Off',
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
  guidePopups: (window.TOOLTIPS_BE12000 && window.TOOLTIPS_BE12000[lessonId]) || []
};

window.DEVICE_BE12000_LESSONS.push(lessonData);
