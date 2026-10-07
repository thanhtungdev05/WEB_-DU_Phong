/**
 * devices/ax3000s/lessons/bai2.js
 * Bài 2: Cấu hình WIFI trên AX3000S
 */

window.DEVICE_AX3000S_LESSONS = window.DEVICE_AX3000S_LESSONS || [];

var lessonObj = {
  id: 'LAB_AX3000S_02',
  title: 'Cấu hình wifi',
  subtitle: 'Cấu hình wifi',
  instructions: [
    '<b>Yêu cầu:</b>',
    'Thực hiện cấu hình mạng Wi-Fi chính (Host) theo các thông số dưới đây:',
    '- SSID Name: <span class="val">FPT Telecom</span>',
    '- WPA Key: <span class="val">19006600</span>',
  ],
  practiceUrl: '/sim_ax3000s/app.html#wlanBasicSetting2g',
  clearFields: [
    '#Txt_SSID',
    '#Pwd_WpaPsk',
    'input[name="Txt_SSID"]',
    'input[name="Pwd_WpaPsk"]'
  ],
  grading: {
    description: 'Kiểm tra WLAN Basic Setting trên AX3000S',
    rules: [
      {
        id: 'wifi_ssid',
        name: 'Tên Wi-Fi (SSID)',
        selector: '#Txt_SSID, input[name="Txt_SSID"]',
        expected: 'FPT Telecom',
        type: 'text_exact',
        trim: true,
        required: true
      },
      {
        id: 'wifi_key',
        name: 'Mật khẩu Wi-Fi (WPA Key)',
        selector: '#Pwd_WpaPsk, input[name="Pwd_WpaPsk"]',
        expected: '19006600',
        type: 'text_exact',
        trim: true,
        required: true
      },
      {
        id: 'wifi_bw',
        name: 'Độ rộng kênh (Bandwidth)',
        selector: '#Sel_BandWidth, select[name="Sel_BandWidth"]',
        expected: '20Mhz',
        type: 'text_exact',
        trim: true,
        required: true
      }
    ]
  },
  guidePopups: (window.TOOLTIPS_AX3000S && window.TOOLTIPS_AX3000S['LAB_AX3000S_02']) || []
};

var idx = window.DEVICE_AX3000S_LESSONS.findIndex(function (l) { return l.id === 'LAB_AX3000S_02'; });
if (idx >= 0) {
  window.DEVICE_AX3000S_LESSONS[idx] = lessonObj;
} else {
  window.DEVICE_AX3000S_LESSONS.push(lessonObj);
}
