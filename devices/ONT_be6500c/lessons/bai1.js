/**
 * devices/ONT_be6500c/lessons/bai1.js
 */
window.DEVICE_ONT_BE6500C_LESSONS = window.DEVICE_ONT_BE6500C_LESSONS || [];

window.DEVICE_ONT_BE6500C_LESSONS.push({
  id: 'ONT_be6500c-bai1',
  title: 'Cấu hình PPPoE',
  subtitle: 'Cấu hình PPPoE',
  instructions: [
    '<b>Yêu cầu:</b>',
    'Cấu hình kết nối mạng PPPoE cho thiết bị:',
    '- Username: <span class="val">hnfdl-123456-789</span>',
    '- Password: <span class="val">d123456</span>',
  ],
  practiceUrl: '/sim_ONT_be6500c/advanced__wan.html',
  clearFields: ['input[name="ipv4Settings.pppoe.username"]', 'input[name="ipv4Settings.pppoe.password"]'],
  grading: {
    description: 'Kiểm tra cấu hình PPPoE',
    allowedSelectors: [
      'div[id*="ipv4Settings.protocol"]',
      'input[name="ipv4Settings.protocol"]',
      'input[name="radio"]',
      'input[name="radio-dns4"]',
      'input[name="radio-dns6"]',
      '[data-sim-nhom="dns4"] input',
      '[data-sim-nhom="dns6"] input'
    ],
    rules: [
      {
        "id": "wan_protocol",
        "name": "Connection Type",
        "selector": "input[name=\"ipv4Settings.protocol\"]",
        "expected": "pppoe",
        "type": "text_exact",
        "trim": true,
        "required": true
      },
      {
        "id": "pppoe_user",
        "name": "Username",
        "selector": "input[name=\"ipv4Settings.pppoe.username\"]",
        "expected": "hnfdl-123456-789",
        "type": "text_exact",
        "trim": true,
        "required": true
      },
      {
        "id": "pppoe_pass",
        "name": "Password",
        "selector": "input[name=\"ipv4Settings.pppoe.password\"]",
        "expected": "d123456",
        "type": "text_exact",
        "trim": true,
        "required": true
      }
    ]
  },
  allowedSelectors: [
    'div[id*="ipv4Settings.protocol"]',
    'input[name="ipv4Settings.protocol"]',
    'input[name="radio"]',
    'input[name="radio-dns4"]',
    'input[name="radio-dns6"]',
    '[data-sim-nhom="dns4"] input',
    '[data-sim-nhom="dns6"] input'
  ],
  guidePopups: [
    {
      "selector": ".MuiTypography-subtitle2:contains(\"Advanced\"), svg[data-testid=\"TuneTwoToneIcon\"], svg[data-testid=\"TuneOutlinedIcon\"]",
      "text": "Bước 1: Chọn Advanced",
      "position": "right"
    },
    {
      "selector": ".MuiTypography-subtitle1:contains(\"IPv4 Connection Type\")",
      "text": "Bước 2: Chọn IPv4 Connection Type",
      "position": "top"
    },
    {
      "selector": "div[id*=\"ipv4Settings.protocol\"]",
      "text": "Bước 3: Chọn PPPoE của phần Connection Type",
      "position": "right"
    },
    {
      "selector": "input[name=\"ipv4Settings.pppoe.username\"]",
      "text": "Bước 4: Nhập Username: hnfdl-123456-789",
      "position": "right"
    },
    {
      "selector": "input[name=\"ipv4Settings.pppoe.password\"]",
      "text": "Bước 5: Nhập Password: d123456",
      "position": "right"
    },
    {
      "selector": "button.alternative-layout--submit, .formActionButton.submit, body:has(input[name=\"ipv4Settings.pppoe.username\"]) button.alternative-layout--submit",
      "text": "Bước 6: Chọn Save để lưu cấu hình",
      "position": "bottom"
    }
  ]
});
