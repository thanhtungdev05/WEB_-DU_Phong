/**
 * devices/ax3000s/lessons/bai3.js
 * Bài 3: Cấu hình WIFI IOT trên AX3000S
 */

window.DEVICE_AX3000S_LESSONS = window.DEVICE_AX3000S_LESSONS || [];

const lessonObj3 = {
  id: 'LAB_AX3000S_03',
  title: 'Cấu hình wifi IoT',
  subtitle: 'Cấu hình wifi IoT',
  instructions: [
    '<b>Yêu cầu:</b>',
    '- SSID Name: <span class="val">FPT Telecom-IoT</span>',
    '- WPA Key: <span class="val">19006600</span>',
    '- Bật băng tần 2.4GHz',
    '- Tắt băng tần 5GHz',
    '- Tắt Band Steering'
  ],
  practiceUrl: '/sim_ax3000s/app.html#wlanMapSettingAll',
  clearFields: [
    '#Txt_SSID_2G_3',
    'input[name="Txt_SSID_2G_3"]',
    '#Pwd_WpaPsk_2G_3',
    'input[name="Pwd_WpaPsk_2G_3"]'
  ],
  grading: {
    description: 'Kiểm tra cấu hình Wi-Fi IOT (Network 3) trên AX3000S',
    rules: [
      {
        id: 'iot_bs',
        name: 'Tắt Band Steering',
        selector: '#Chk_BandSteeringEnable_3',
        expected: ['false', 'off', 'OFF', ''],
        type: 'any_of',
        trim: true,
        required: true
      },
      {
        id: 'iot_enable_2g',
        name: 'Bật 2.4GHz',
        selector: '#Chk_SsidEnable_2G_3',
        expected: ['on', 'true', 'ON'],
        type: 'any_of',
        trim: true,
        required: true
      },
      {
        id: 'iot_ssid_2g',
        name: 'Tên Wi-Fi IoT (2.4GHz)',
        selector: '#Txt_SSID_2G_3',
        expected: 'FPT Telecom-IoT',
        type: 'text_exact',
        trim: true,
        required: true
      },
      {
        id: 'iot_key_2g',
        name: 'Mật khẩu Wi-Fi IoT (2.4GHz)',
        selector: '#Pwd_WpaPsk_2G_3',
        expected: '19006600',
        type: 'text_exact',
        trim: true,
        required: true
      },
      {
        id: 'iot_disable_5g',
        name: 'Không bật băng tần 5GHz',
        selector: '#Chk_SsidEnable_5G_3',
        expected: ['false', 'off', 'OFF', ''],
        type: 'any_of',
        trim: true,
        required: true
      }
    ]
  },
  guidePopups: (window.TOOLTIPS_AX3000S && window.TOOLTIPS_AX3000S['LAB_AX3000S_03']) || []
};

const existingIndex3 = window.DEVICE_AX3000S_LESSONS.findIndex(l => l.id === 'LAB_AX3000S_03');
if (existingIndex3 !== -1) {
  window.DEVICE_AX3000S_LESSONS[existingIndex3] = lessonObj3;
} else {
  window.DEVICE_AX3000S_LESSONS.push(lessonObj3);
}
