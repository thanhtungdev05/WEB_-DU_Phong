/**
 * devices/ONT_be6500c/lessons/bai5.js
 */
window.DEVICE_ONT_BE6500C_LESSONS = window.DEVICE_ONT_BE6500C_LESSONS || [];
window.DEVICE_ONT_BE6500C_LESSONS.push({
  id: 'ONT_be6500c-bai5',
  title: 'Cấu hình DHCP',
  subtitle: 'Cấu hình DHCP',
  instructions: [
    "<b>Yêu cầu:</b>",
    "Thực hiện cấu hình IPv4 LAN theo các thông số dưới đây:",
    "- IP Address (Gateway): <span class=\"val\">192.168.10.1</span>",
    "- Subnet Mask: <span class=\"val\">255.255.255.0</span>"
  ],
  practiceUrl: '/sim_ONT_be6500c/advanced__lan.html',
  clearFields: [],
  grading: {
    description: 'Kiểm tra bài 5',
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
      },
      {
        "id": "lan_dhcp_start",
        "name": "Start IP Address",
        "selector": "input[name=\"ipv4Settings.dhcp.startAddress\"]",
        "expected": "192.168.10.2",
        "type": "text_exact",
        "trim": true,
        "required": true
      },
      {
        "id": "lan_dhcp_end",
        "name": "End IP Address",
        "selector": "input[name=\"ipv4Settings.dhcp.endAddress\"]",
        "expected": "192.168.10.254",
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
      "text": "Bước 3: Đổi IP Address thành 192.168.10.1",
      "position": "right",
      "expected": "192.168.10.1",
      "urlIncludes": "advanced__lan"
    },
    {
      "selector": "input[name=\"ipv4Settings.mask\"], .MuiAutocomplete-input",
      "text": "Bước 4: Kiểm tra Subnet Mask là 255.255.255.0",
      "position": "right",
      "expected": "255.255.255.0",
      "urlIncludes": "advanced__lan"
    },
    {
      "selector": "button.alternative-layout--submit, .formActionButton.submit, button:contains(\"Save\")",
      "text": "Bước 5: Chọn Save để lưu cấu hình",
      "position": "bottom",
      "urlIncludes": "advanced__lan"
    }
  ]
});
