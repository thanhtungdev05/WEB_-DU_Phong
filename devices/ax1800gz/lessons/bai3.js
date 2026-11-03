/**
 * devices/ax1800gz/lessons/bai3.js
 * Bài 3 - Cấu hình Wi-Fi IoT trên AX1800GZ
 */

window.DEVICE_AX1800GZ_LESSONS = window.DEVICE_AX1800GZ_LESSONS || [];

var lessonId = 'LAB_AX1800GZ_03';
var lessonData = {
  id: lessonId,
  title: 'Cấu hình wifi IoT',
  subtitle: 'Cấu hình mạng Wi-Fi IoT (SSID4)',
  instructions: [
    '<b>Yêu cầu:</b>',
    '- SSID Name: <span class="val">FPT Telecom-IoT</span>',
    '- Encryption Type: <span class="val">WPA2-PSK-AES</span>',
    '- WPA Passphrase: <span class="val">19006600</span>'
  ],
  practiceUrl: '/sim_ax1800gz/login',
  onSimLoad: function (simWin) {
    try {
      if (simWin && simWin.top) {
        simWin.top._hasSuccHintStored = false;
        simWin.top._hasClickedSaveInGuide = false;
      }
    } catch (e) { }
  },
  clearFields: [
    '[id="ESSID:3"]',
    '[id="KeyPassphrase:3"]',
    '#ESSID\\:3',
    '#KeyPassphrase\\:3',
    'input[id="ESSID:3"]',
    'input[id="KeyPassphrase:3"]'
  ],
  grading: {
    description: 'Kiểm tra cấu hình Wi-Fi IoT (SSID4) trên AX1800GZ',
    rules: [
      {
        id: 'iot_enable',
        name: 'Kích hoạt SSID4 (On)',
        selector: 'input[name="Enable:3"]:checked, #Enable1\\:3, input[id="Enable1:3"]',
        expected: '1',
        type: 'text_exact',
        trim: true,
        required: true
      },
      {
        id: 'iot_ssid',
        name: 'SSID Name (FPT Telecom-IoT)',
        selector: '[id="ESSID:3"], #ESSID\\:3, input[id="ESSID:3"]',
        expected: 'FPT Telecom-IoT',
        type: 'text_exact',
        trim: true,
        required: true
      },
      {
        id: 'iot_hide',
        name: 'SSID Hide (Off)',
        selector: 'input[name="ESSIDHideEnable:3"]:checked, #ESSIDHideEnable1\\:3, input[id="ESSIDHideEnable1:3"]',
        expected: '0',
        displayExpected: 'Off',
        type: 'text_exact',
        trim: true,
        required: true
      },
      {
        id: 'iot_enc',
        name: 'Encryption Type (WPA2-PSK-AES)',
        selector: '[id="EncryptionType:3"], #EncryptionType\\:3, select[id="EncryptionType:3"]',
        expected: 'WPA2-PSK-AES',
        type: 'text_exact',
        trim: true,
        required: true
      },
      {
        id: 'iot_pass',
        name: 'WPA Passphrase (19006600)',
        selector: '[id="KeyPassphrase:3"], #KeyPassphrase\\:3, input[id="KeyPassphrase:3"]',
        expected: '19006600',
        type: 'text_exact',
        trim: true,
        required: true
      }
    ]
  },
  guidePopups: (window.TOOLTIPS_AX1800GZ && window.TOOLTIPS_AX1800GZ[lessonId]) || []
};

var idx = window.DEVICE_AX1800GZ_LESSONS.findIndex(function (l) { return l.id === lessonId; });
if (idx >= 0) {
  window.DEVICE_AX1800GZ_LESSONS[idx] = lessonData;
} else {
  window.DEVICE_AX1800GZ_LESSONS.push(lessonData);
}
