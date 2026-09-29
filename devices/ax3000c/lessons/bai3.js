/**
 * devices/ax3000c/lessons/bai3.js
 * Bài 3: Cấu hình WiFi IoT trên AX3000CV2 (firmware 0.5.3) — tab Specific SSID
 * (anh Huynn chọn 2026-09-26; bản cũ làm ở Guest SSID). Ô SSID/Passphrase chỉ có khi
 * đã bật SSID Enabled, nên tiêu chí SSID/Passphrase cũng ngầm kiểm việc bật.
 */

window.DEVICE_AX3000C_LESSONS = window.DEVICE_AX3000C_LESSONS || [];

// Loại bỏ bài bị trùng nếu đang load lại (HMR/reload)
var idx = window.DEVICE_AX3000C_LESSONS.findIndex(function (l) { return l.id === 'LAB_AX3000CV2_03'; });
var lessonObj = {
  id: 'LAB_AX3000CV2_03',
  title: 'Cấu hình wifi IoT',
  subtitle: 'Cấu hình wifi IoT',
  instructions: [
    '<b>Yêu cầu:</b>',
    'Thực hiện cấu hình một mạng Wi-Fi riêng biệt dành riêng cho các thiết bị IoT (Smart Home, Camera, v.v.). Cấu hình các thông số mạng Wi-Fi IoT theo đúng yêu cầu dưới đây:',
    '- SSID Name: <span class="val">FPT IoT</span>',
    '- WPA Key: <span class="val">fptiot123</span>',
  ],
  practiceUrl: '/sim_ax3000c/#/network/wifi',
  // Chỉ xoá ô đầu (2G) — ô 5G của chế độ "Use separate SSID" phải giữ mật khẩu sẵn có (xem ftc_chung.js)
  customClear: function () {
    FTC_AX3000C.xoaO(['#pane-specificssid ' + FTC_AX3000C.o('SSID'), '#pane-specificssid ' + FTC_AX3000C.o('Passphrase')], true);
  },
  grading: {
    description: 'Kiểm tra SSID và WPA Key (dành cho IoT) trên AX3000CV2',
    rules: [
      {
        id: 'wifi_ssid',
        name: 'Tên Wi-Fi IoT (SSID)',
        selector: '#pane-specificssid ' + FTC_AX3000C.o('SSID'),
        expected: 'FPT IoT',
        type: 'text_exact',
        trim: true,
        required: true
      },
      {
        id: 'wifi_key',
        name: 'Mật khẩu Wi-Fi IoT (WPA Key)',
        selector: '#pane-specificssid ' + FTC_AX3000C.o('Passphrase'),
        expected: 'fptiot123',
        type: 'text_exact',
        trim: true,
        required: true
      }
    ]
  },
  guidePopups: window.TOOLTIPS_AX3000C['LAB_AX3000CV2_03']
};

if (idx !== -1) {
  window.DEVICE_AX3000C_LESSONS[idx] = lessonObj;
} else {
  window.DEVICE_AX3000C_LESSONS.push(lessonObj);
}
