/**
 * devices/ax1800gz/lessons/bai2.js
 * Bài 2 - Cấu hình Wi-Fi trên AX1800GZ
 */

window.DEVICE_AX1800GZ_LESSONS = window.DEVICE_AX1800GZ_LESSONS || [];

var lessonId = 'LAB_AX1800GZ_02';
var lessonData = {
  id: lessonId,
  title: 'Cấu hình wifi',
  subtitle: 'Cấu hình Wi-Fi (Wi-Fi 6)',
  instructions: [
    '<b>Yêu cầu:</b>',
    '- SSID Name: <span class="val">FPT Telecom</span>',
    '- Encryption Type: <span class="val">WPA2-PSK-AES</span> (hoặc WPA3)',
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
    '[id="ESSID:0"]',
    '[id="KeyPassphrase:0"]',
    '[id="ESSID:4"]',
    '[id="KeyPassphrase:4"]',
    '#ESSID\\:0',
    '#KeyPassphrase\\:0',
    '#ESSID\\:4',
    '#KeyPassphrase\\:4',
    'input[id="ESSID:0"]',
    'input[id="KeyPassphrase:0"]',
    'input[id="ESSID:4"]',
    'input[id="KeyPassphrase:4"]'
  ],
  grading: {
    description: 'Kiểm tra cấu hình Wi-Fi (Wi-Fi 6) trên AX1800GZ',
    rules: [
      {
        id: 'wifi_ssid_24',
        name: 'SSID Name (SSID1)',
        selector: '[id="ESSID:0"], #ESSID\\:0, input[id="ESSID:0"]',
        expected: 'FPT Telecom',
        type: 'text_exact',
        trim: true,
        required: true
      },
      {
        id: 'wifi_enc_24',
        name: 'Encryption Type',
        selector: '[id="EncryptionType:0"], #EncryptionType\\:0, select[id="EncryptionType:0"]',
        expected: 'WPA2-PSK-AES, WPA3-SAE, WPA2/WPA3-SAE',
        type: 'any_of',
        trim: true,
        required: true
      },
      {
        id: 'wifi_pass_24',
        name: 'WPA Passphrase (SSID1)',
        selector: '[id="KeyPassphrase:0"], #KeyPassphrase\\:0, input[id="KeyPassphrase:0"]',
        expected: '19006600',
        type: 'text_exact',
        trim: true,
        required: true
      }
    ]
  },
  guidePopups: (window.TOOLTIPS_AX1800GZ && window.TOOLTIPS_AX1800GZ[lessonId]) || []
};

window.DEVICE_AX1800GZ_LESSONS.push(lessonData);
