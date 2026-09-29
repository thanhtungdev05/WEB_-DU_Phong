/**
 * devices/ax3000c/lessons/bai2.js
 * Bài 2: Cấu hình WiFi trên AX3000CV2 (firmware 0.5.3) — tab Host SSID
 */

window.DEVICE_AX3000C_LESSONS = window.DEVICE_AX3000C_LESSONS || [];

window.DEVICE_AX3000C_LESSONS.push({
  id: 'LAB_AX3000CV2_02',
  title: 'Cấu hình wifi',
  subtitle: 'Cấu hình wifi',
  instructions: [
    '<b>Yêu cầu:</b>',
    'Thực hiện cấu hình mạng Wi-Fi Band Steering trên thiết bị. Kích hoạt tính năng Band Steering và cấu hình các thông số mạng Wi-Fi theo đúng yêu cầu dưới đây:',
    '- SSID Name: <span class="val">FPT Telecom</span>',
    '- WPA Key: <span class="val">fpt12345</span>',
  ],
  practiceUrl: '/sim_ax3000c/#/network/wifi',
  onSimLoad: function (simWin) { FTC_AX3000C.datTrangThaiBai(simWin, 2); },
  // Chỉ xoá ô đầu (2G) — ô 5G của chế độ "Use separate SSID" phải giữ mật khẩu sẵn có (xem ftc_chung.js)
  customClear: function () {
    FTC_AX3000C.xoaO(['#pane-hostssid ' + FTC_AX3000C.o('SSID'), '#pane-hostssid ' + FTC_AX3000C.o('Passphrase')], true);
  },
  grading: {
    description: 'Kiểm tra SSID và WPA Key trên AX3000CV2',
    rules: [
      {
        id: 'wifi_ssid',
        name: 'Tên Wi-Fi (SSID)',
        selector: '#pane-hostssid ' + FTC_AX3000C.o('SSID'),
        expected: 'FPT Telecom',
        type: 'text_exact',
        trim: true,
        required: true
      },
      {
        id: 'wifi_key',
        name: 'Mật khẩu Wi-Fi (WPA Key)',
        selector: '#pane-hostssid ' + FTC_AX3000C.o('Passphrase'),
        expected: 'fpt12345',
        type: 'text_exact',
        trim: true,
        required: true
      },
      // Band Steering = 2G và 5G dùng chung SSID -> "Use separate SSID" phải TẮT (anh Huynn chốt
      // 2026-09-28: chỉ bài 2 bắt lỗi công tắc này, bài 3 Wi-Fi IoT thì không).
      // Công tắc bật -> "on", tắt -> "false" (cách bộ chấm đọc checkbox).
      {
        id: 'band_steering',
        name: 'Use separate SSID',
        selector: '#pane-hostssid .el-switch[data-ftc-cong-tac="Use separate SSID"] input',
        expected: 'false',
        valueLabels: { 'false': 'Tắt', 'on': 'Bật' },
        type: 'text_exact',
        trim: true,
        required: true
      }
    ]
  },
  guidePopups: window.TOOLTIPS_AX3000C['LAB_AX3000CV2_02']
});
