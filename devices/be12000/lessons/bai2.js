/**
 * devices/be12000/lessons/bai2.js
 * Bài 2 - Cấu hình Wi-Fi trên BE12000
 */

window.DEVICE_BE12000_LESSONS = window.DEVICE_BE12000_LESSONS || [];

var lessonId = 'LAB_BE12000_02';
var lessonData = {
  id: lessonId,
  title: 'Cấu hình wifi',
  subtitle: 'Cấu hình Wi-Fi MLO (Wi-Fi 7)',
  instructions: [
    '<b>Yêu cầu:</b>',
    'Thực hiện cấu hình mạng Wi-Fi tại menu <b>Local Network > WLAN > WLAN Basic > WLAN SSID Configuration</b> theo các thông số sau:',
    '- SSID Name: <span class="val">FPT Telecom</span>',
    '- Encryption Type: <span class="val">WPA2-PSK-AES</span> (hoặc WPA3)',
    '- WPA Passphrase: <span class="val">19006600</span>',
    'Nhấn <b>Apply</b> để lưu cấu hình Wi-Fi.'
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
    '[id="ESSID:0"]',
    '[id="KeyPassphrase:0"]',
    '#ESSID\\:0',
    '#KeyPassphrase\\:0',
    'input[id="ESSID:0"]',
    'input[id="KeyPassphrase:0"]'
  ],
  grading: {
    description: 'Kiểm tra cấu hình Wi-Fi MLO đồng bộ trên BE12000',
    rules: [
      {
        id: 'wifi_ssid_24',
        name: 'SSID Name 2.4GHz (SSID1)',
        selector: '[id="ESSID:0"], #ESSID\\:0, input[id="ESSID:0"]',
        expected: 'FPT Telecom',
        type: 'text_exact',
        trim: true,
        required: true
      },
      {
        id: 'wifi_enc_24',
        name: 'Encryption Type 2.4GHz',
        selector: '[id="EncryptionType:0"], #EncryptionType\\:0, select[id="EncryptionType:0"]',
        expected: 'WPA2-PSK-AES, WPA3-SAE, WPA2/WPA3-SAE',
        type: 'any_of',
        trim: true,
        required: true
      },
      {
        id: 'wifi_pass_24',
        name: 'WPA Passphrase 2.4GHz (SSID1)',
        selector: '[id="KeyPassphrase:0"], #KeyPassphrase\\:0, input[id="KeyPassphrase:0"]',
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
