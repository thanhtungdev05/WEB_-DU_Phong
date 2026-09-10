/**
 * devices/ONT_be6500c/lessons/bai2.js
 */
window.DEVICE_ONT_BE6500C_LESSONS = window.DEVICE_ONT_BE6500C_LESSONS || [];
window.DEVICE_ONT_BE6500C_LESSONS.push({
  id: 'ONT_be6500c-bai2',
  title: 'Cấu hình mạng Wi-Fi (Gộp sóng Band Steering)',
  subtitle: 'Cấu hình mạng Wi-Fi (Gộp sóng Band Steering)',
  instructions: [
  "<b>Yêu cầu:</b>",
  "Kích hoạt Band Steering (Tắt Use separate network) và cấu hình:",
  "- SSID Name: <span class=\"val\">FPT Telecom</span>",
  "- WPA Key: <span class=\"val\">fpt12345</span>"
],
  practiceUrl: '/ont_be6500c/wifi__general.html',
  clearFields: ['input[name="networks.1.name"]', 'input[name="networks.1.passphrase"]'],
  grading: {
    description: 'Kiểm tra bài 2',
    rules: [
  {
    "id": "use_separate_network",
    "name": "Use separate network",
    "selector": "input[name=\"useSeparateNetwork\"]",
    "expected": "false",
    "type": "text_exact",
    "trim": true,
    "required": true
  },
  {
    "id": "wifi_ssid",
    "name": "SSID",
    "selector": "input[name=\"networks.1.name\"]",
    "expected": "FPT Telecom",
    "type": "text_exact",
    "trim": true,
    "required": true
  },
  {
    "id": "wifi_key",
    "name": "WPA Key",
    "selector": "input[name=\"networks.1.passphrase\"]",
    "expected": "fpt12345",
    "type": "text_exact",
    "trim": true,
    "required": true
  }
]
  },
  guidePopups: [
  {
    "selector": ".MuiTypography-subtitle2:contains(\"Wi-Fi\")",
    "text": "Bước 1: Chọn menu Wi-Fi",
    "position": "right"
  },
  {
    "selector": "input[name=\"useSeparateNetwork\"]",
    "text": "Bước 2: Tắt nút 'Use separate network' để kích hoạt gộp sóng (Band Steering)",
    "position": "top"
  },
  {
    "selector": "input[name=\"networks.1.name\"]",
    "text": "Bước 3: Nhập tên Wi-Fi, ví dụ: FPT Telecom",
    "position": "right"
  },
  {
    "selector": "input[name=\"networks.1.passphrase\"]",
    "text": "Bước 4: Nhập mật khẩu, ví dụ: fpt12345",
    "position": "right"
  },
  {
    "selector": "button:contains(\"Save\")",
    "text": "Bước 5: Nhấp chọn Save để lưu cấu hình",
    "position": "right"
  }
]
});
