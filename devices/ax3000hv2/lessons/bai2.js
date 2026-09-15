/**
 * devices/ax3000hv2/lessons/bai2.js
 * Bài 2: Cấu hình Wi-Fi Host trên AX3000H v2
 */

window.DEVICE_AX3000HV2_LESSONS = window.DEVICE_AX3000HV2_LESSONS || [];

var lessonObj = {
  id: 'LAB_AX3000HV2_02',
  title: 'Cấu hình wifi',
  subtitle: 'Cấu hình wifi',
  instructions: [
    '<b>Yêu cầu:</b>',
    'Thực hiện cấu hình mạng Wi-Fi chính (Host) theo các thông số dưới đây:',
    '- <b>Wi-Fi 2.4GHz:</b>',
    '  + SSID Name: <span class="val">FPT Telecom</span>',
    '  + Security Passphrase: <span class="val">fpt12345</span>',
    '- <b>Wi-Fi 5GHz:</b>',
    '  + SSID Name: <span class="val">FPT Telecom</span>',
    '  + Security Passphrase: <span class="val">fpt12345</span>',
  ],
  practiceUrl: '/sim_ax3000hv2/cgi-bin/index.asp?page=wifi_basic.asp',
  clearFields: [
    'input[name="ESSID"]',
    'input[name="PreSharedKey"]',
    'input[name="ESSID_5g"]',
    'input[name="PreSharedKey_5g"]'
  ],
  grading: {
    description: 'Kiểm tra SSID Host và WPA Key trên AX3000Hv2 (cả 2.4GHz và 5GHz)',
    rules: [
      {
        id: 'host_ssid_2g',
        name: 'Tên Wi-Fi 2.4GHz (SSID)',
        selector: 'input[name="ESSID"]',
        expected: ['FPT Telecom', 'FTP Telecom'],
        type: 'any_of',
        trim: true,
        required: true
      },
      {
        id: 'host_key_2g',
        name: 'Mật khẩu Wi-Fi 2.4GHz',
        selector: 'input[name="PreSharedKey"]',
        expected: 'fpt12345',
        type: 'text_exact',
        trim: true,
        required: true
      },
      {
        id: 'host_ssid_5g',
        name: 'Tên Wi-Fi 5GHz (SSID)',
        selector: 'input[name="ESSID_5g"]',
        expected: ['FPT Telecom', 'FTP Telecom'],
        type: 'any_of',
        trim: true,
        required: true
      },
      {
        id: 'host_key_5g',
        name: 'Mật khẩu Wi-Fi 5GHz',
        selector: 'input[name="PreSharedKey_5g"]',
        expected: 'fpt12345',
        type: 'text_exact',
        trim: true,
        required: true
      }
    ]
  },
  guidePopups: []
};

var idx = window.DEVICE_AX3000HV2_LESSONS.findIndex(function(l) { return l.id === lessonObj.id; });
if (idx !== -1) {
  window.DEVICE_AX3000HV2_LESSONS[idx] = lessonObj;
} else {
  window.DEVICE_AX3000HV2_LESSONS.push(lessonObj);
}
