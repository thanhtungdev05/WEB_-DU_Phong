/**
 * devices/ONT_be6500c/lessons/bai3.js
 */
window.DEVICE_ONT_BE6500C_LESSONS = window.DEVICE_ONT_BE6500C_LESSONS || [];
window.DEVICE_ONT_BE6500C_LESSONS.push({
  id: 'ONT_be6500c-bai3',
  title: 'Cấu hình mạng Wi-Fi IOT',
  subtitle: 'Cấu hình mạng Wi-Fi IOT',
  instructions: [
  "<b>Yêu cầu:</b>",
  "Vào phần SMARTHOME NETWORK để cấu hình Wi-Fi IoT:",
  "- Tên Wi-Fi: <span class=\"val\">FPT IoT</span>",
  "- Mật khẩu: <span class=\"val\">fpt12345</span>"
],
  practiceUrl: '/sim_ONT_be6500c/wifi__general__t2.html',
  clearFields: ['input[name="networks.0.name"]', 'input[name="networks.0.passphrase"]'],
  grading: {
    description: 'Kiểm tra bài 3',
    rules: [
  {
    "id": "iot_ssid",
    "name": "Tên Wi-Fi IoT",
    "selector": "input[name=\"networks.0.name\"]",
    "expected": "FPT IoT",
    "type": "text_exact",
    "trim": true,
    "required": true
  },
  {
    "id": "iot_pass",
    "name": "Mật khẩu IoT",
    "selector": "input[name=\"networks.0.passphrase\"]",
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
    "text": "Chọn Wi-Fi",
    "position": "right"
  },
  {
    "selector": "button[id=\"SmartHome\"]",
    "text": "Chuyển sang tab SMARTHOME NETWORK",
    "position": "bottom"
  },
  {
    "selector": "input[name=\"networks.0.name\"]",
    "text": "Nhập tên Wi-Fi cho IoT",
    "position": "right"
  },
  {
    "selector": "input[name=\"networks.0.passphrase\"]",
    "text": "Nhập mật khẩu cho IoT",
    "position": "right"
  },
  {
    "selector": "button:contains(\"Save\")",
    "text": "Chọn Save",
    "position": "right"
  }
]
});
