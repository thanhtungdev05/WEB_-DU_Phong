/**
 * devices/be6500c/lessons/bai4.js
 */
window.DEVICE_BE6500C_LESSONS = window.DEVICE_BE6500C_LESSONS || [];

var bai4 = {
  id: 'be6500c-bai4',
  title: 'Cấu hình DHCP',
  subtitle: 'Cấu hình DHCP',
  instructions: [
    "<b>Yêu cầu:</b>",
    "Thực hiện cấu hình IPv4 LAN theo các thông số dưới đây:",
    "- IP Address (Gateway): <span class=\"val\">192.168.10.1</span>",
    "- Subnet Mask: <span class=\"val\">255.255.255.0</span>"
  ],
  practiceUrl: '/sim_be6500c/advanced__lan.html',
  clearFields: [],
  allowedSelectors: [
    'input[name="ipv4Settings.ipAddress"]',
    'input[name="ipv4Settings.mask"]',
    'input[name="ipv4Settings.dhcp.startAddress"]',
    'input[name="ipv4Settings.dhcp.endAddress"]',
    'input[name*="dhcp.start"]',
    'input[name*="dhcp.end"]',
    '.MuiAutocomplete-input',
    '.MuiAutocomplete-clearIndicator',
    '.MuiAutocomplete-popupIndicator',
    '.MuiAutocomplete-option',
    '.MuiMenuItem-root',
    'button.alternative-layout--submit',
    '.formActionButton.submit',
    'button:contains("Save")'
  ],
  grading: {
    description: 'Kiểm tra bài 4',
    allowedSelectors: [
      'input[name="ipv4Settings.ipAddress"]',
      'input[name="ipv4Settings.mask"]',
      'input[name="ipv4Settings.dhcp.startAddress"]',
      'input[name="ipv4Settings.dhcp.endAddress"]',
      'input[name*="dhcp.start"]',
      'input[name*="dhcp.end"]',
      '.MuiAutocomplete-input',
      'button.alternative-layout--submit',
      '.formActionButton.submit',
      'button:contains("Save")'
    ],
    rules: [
      {
        "id": "lan_ip",
        "name": "IP Address",
        "selector": "input[name=\"ipv4Settings.ipAddress\"]",
        "expected": "192.168.10.1",
        "type": "text_exact",
        "trim": true,
        "required": true
      },
      {
        "id": "lan_mask",
        "name": "Subnet Mask",
        "selector": "input[name=\"ipv4Settings.mask\"], .MuiAutocomplete-input",
        "expected": "255.255.255.0",
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
      "selector": "li.MuiMenuItem-root:contains(\"LAN\"), .MuiTypography-root:contains(\"LAN\"), p:contains(\"LAN\")",
      "text": "Bước 2: Chọn LAN",
      "position": "right"
    },
    {
      "selector": "input[name=\"ipv4Settings.ipAddress\"]",
      "text": "Bước 3: Nhập IP Address là 192.168.10.1",
      "position": "right",
      "expected": "192.168.10.1"
    },
    {
      "selector": "input[name=\"ipv4Settings.mask\"], .MuiAutocomplete-input",
      "text": "Bước 4: Nhập Subnet Mask là 255.255.255.0",
      "position": "right",
      "expected": "255.255.255.0"
    },
    {
      "selector": "button.alternative-layout--submit, .formActionButton.submit, button:contains(\"Save\")",
      "text": "Bước 5: Chọn Save để lưu cấu hình",
      "position": "bottom"
    }
  ]
};

var existingIndex = window.DEVICE_BE6500C_LESSONS.findIndex(function (l) { return l.id === 'be6500c-bai4'; });
if (existingIndex >= 0) {
  window.DEVICE_BE6500C_LESSONS[existingIndex] = bai4;
} else {
  window.DEVICE_BE6500C_LESSONS.push(bai4);
}
