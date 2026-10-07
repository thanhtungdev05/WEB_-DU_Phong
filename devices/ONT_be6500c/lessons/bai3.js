/**
 * devices/ONT_be6500c/lessons/bai3.js
 */
window.DEVICE_ONT_BE6500C_LESSONS = window.DEVICE_ONT_BE6500C_LESSONS || [];
window.DEVICE_ONT_BE6500C_LESSONS.push({
  id: 'ONT_be6500c-bai3',
  title: 'Cấu hình Wi-Fi IOT',
  subtitle: 'Cấu hình Wi-Fi IOT',
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
        "id": "iot_tab",
        "name": "Tab SMARTHOME NETWORK",
        "selector": "button#SmartHome[aria-selected=\"true\"], #tabpanel-SmartHome:not([hidden])",
        "expected": "true",
        "type": "element_exists",
        "required": true
      },
      {
        "id": "iot_ssid",
        "name": "Tên Wi-Fi IoT",
        "selector": "#tabpanel-SmartHome input[name=\"networks.0.name\"], div[role=\"tabpanel\"][id*=\"SmartHome\"] input[name=\"networks.0.name\"]",
        "expected": "FPT IoT",
        "type": "text_exact",
        "trim": true,
        "required": true
      },
      {
        "id": "iot_pass",
        "name": "Mật khẩu IoT",
        "selector": "#tabpanel-SmartHome input[name=\"networks.0.passphrase\"], div[role=\"tabpanel\"][id*=\"SmartHome\"] input[name=\"networks.0.passphrase\"]",
        "expected": "fpt12345",
        "type": "text_exact",
        "trim": true,
        "required": true
      }
    ]
  },
  guidePopups: [
    {
      "selector": ".MuiTypography-subtitle2:contains(\"Wi-Fi\"), svg[data-testid=\"WifiOutlinedIcon\"]",
      "text": "Bước 1: Chọn Wi-Fi",
      "position": "right"
    },
    {
      "selector": "li.MuiMenuItem-root:contains(\"General\"), .MuiTypography-root:contains(\"General\"), span:contains(\"General\"), .MuiBreadcrumbs-li:contains(\"General\")",
      "text": "Bước 2: Chọn General",
      "position": "right"
    },
    {
      "selector": "button[id=\"SmartHome\"]",
      "text": "Bước 3: Chuyển sang tab SMARTHOME NETWORK",
      "position": "bottom"
    },
    {
      "selector": "#tabpanel-SmartHome input[name=\"networks.0.name\"], input[name=\"networks.0.name\"]",
      "text": "Bước 4: Nhập tên Wi-Fi cho IoT (VD: FPT IoT)",
      "position": "right",
      "expected": "FPT IoT"
    },
    {
      "selector": "#tabpanel-SmartHome input[name=\"networks.0.passphrase\"], input[name=\"networks.0.passphrase\"]",
      "text": "Bước 5: Nhập mật khẩu cho IoT (VD: fpt12345)",
      "position": "right",
      "expected": "fpt12345"
    },
    {
      "selector": "button:contains(\"Save\"), button.alternative-layout--submit, .formActionButton.submit",
      "text": "Bước 6: Chọn Save để lưu cấu hình",
      "position": "bottom"
    }
  ]
});
