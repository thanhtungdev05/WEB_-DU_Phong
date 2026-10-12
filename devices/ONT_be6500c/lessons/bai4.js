/**
 * devices/ONT_be6500c/lessons/bai4.js
 */
window.DEVICE_ONT_BE6500C_LESSONS = window.DEVICE_ONT_BE6500C_LESSONS || [];

window.DEVICE_ONT_BE6500C_LESSONS.push({
  id: 'ONT_be6500c-bai4',
  title: 'Cấu hình DNS',
  subtitle: 'Cấu hình DNS',
  instructions: [
    "<b>Yêu cầu:</b>",
    "Cấu hình DNS cho thiết bị:",
    "- Primary DNS: <span class=\"val\">8.8.8.8</span>",
    "- Secondary DNS: <span class=\"val\">8.8.4.4</span>"
  ],
  practiceUrl: '/sim_ONT_be6500c/advanced__wan.html',
  clearFields: ['input[name="ipv4Settings.dns.dnsServers.primary"]', 'input[name="ipv4Settings.dns.dnsServers.secondary"]'],
  allowedSelectors: [
    '[data-sim-nhom="dns4"] input',
    'input[name="radio-dns4"]',
    'input[name="radio"]',
    '[data-sim-nhom="dns6"] input',
    'input[name="radio-dns6"]'
  ],
  grading: {
    description: 'Kiểm tra bài 4',
    allowedSelectors: [
      '[data-sim-nhom="dns4"] input',
      'input[name="radio-dns4"]',
      'input[name="radio"]',
      '[data-sim-nhom="dns6"] input',
      'input[name="radio-dns6"]'
    ],
    rules: [
      {
        "id": "dns_1",
        "name": "Primary DNS",
        "selector": "input[name=\"ipv4Settings.dns.dnsServers.primary\"]",
        "expected": "8.8.8.8",
        "type": "text_exact",
        "trim": true,
        "required": true
      },
      {
        "id": "dns_2",
        "name": "Secondary DNS",
        "selector": "input[name=\"ipv4Settings.dns.dnsServers.secondary\"]",
        "expected": "8.8.4.4",
        "type": "text_exact",
        "trim": true,
        "required": true
      }
    ]
  },
  guidePopups: [
    {
      "selector": ".MuiTypography-subtitle2:contains(\"Advanced\"), svg[data-testid=\"TuneTwoToneIcon\"], svg[data-testid=\"TuneOutlinedIcon\"]",
      "text": "Bước 1: Chọn Advanced",
      "position": "right"
    },
    {
      "selector": "li.MuiMenuItem-root:contains(\"WAN\"), .MuiTypography-root:contains(\"WAN\"), p:contains(\"WAN\"), span:contains(\"WAN\")",
      "text": "Bước 2: Chọn WAN",
      "position": "right"
    },
    {
      "selector": "input[name=\"ipv4Settings.dns.dnsServers.primary\"]",
      "text": "Bước 3: Nhập Primary DNS là 8.8.8.8",
      "position": "right"
    },
    {
      "selector": "input[name=\"ipv4Settings.dns.dnsServers.secondary\"]",
      "text": "Bước 4: Nhập Secondary DNS là 8.8.4.4",
      "position": "right"
    },
    {
      "selector": "body:has(input[name=\"ipv4Settings.dns.dnsServers.primary\"]) button.alternative-layout--submit, button:contains(\"Save\")",
      "text": "Bước 5: Chọn Save để lưu cấu hình",
      "position": "bottom"
    }
  ]
});
