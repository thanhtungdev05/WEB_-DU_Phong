/**
 * devices/ONT_be6500c/lessons/bai5.js
 */
window.DEVICE_ONT_BE6500C_LESSONS = window.DEVICE_ONT_BE6500C_LESSONS || [];
window.DEVICE_ONT_BE6500C_LESSONS.push({
  id: 'ONT_be6500c-bai5',
  title: 'Cấu hình mạng LAN',
  subtitle: 'Cấu hình mạng LAN',
  instructions: [
    "<b>Yêu cầu:</b>",
    "Thực hiện cấu hình IPv4 LAN theo các thông số dưới đây:",
    "- IP Address (Gateway): <span class=\"val\">192.168.1.1</span>",
    "- Subnet Mask: <span class=\"val\">255.255.255.0</span>",
    "- Enable DHCP Server: <span class=\"val\">Bật (Enable)</span>",
    "- Start IP Address: <span class=\"val\">192.168.1.2</span>",
    "- End IP Address: <span class=\"val\">192.168.1.254</span>",
    "- Lease time - Day(s): <span class=\"val\">0</span>",
    "- Lease time - Hour(s): <span class=\"val\">12</span>"
  ],
  practiceUrl: '/ont_be6500c/advanced__lan.html',
  clearFields: [
    'input[name="ipv4Settings.ipAddress"]',
    '.MuiAutocomplete-input',
    'input[name="ipv4Settings.dhcp.startAddress"]',
    'input[name="ipv4Settings.dhcp.endAddress"]',
    'input[name="ipv4Settings.dhcp.leaseTime.days"]',
    'input[name="ipv4Settings.dhcp.leaseTime.hours"]'
  ],
  grading: {
    description: 'Kiểm tra bài 5',
    rules: [
      {
        "id": "lan_ip",
        "name": "IP Address",
        "selector": "input[name=\"ipv4Settings.ipAddress\"]",
        "expected": "192.168.1.1",
        "type": "text_exact",
        "trim": true,
        "required": true
      },
      {
        "id": "lan_mask",
        "name": "Subnet Mask",
        "selector": ".MuiAutocomplete-input",
        "expected": "255.255.255.0",
        "type": "text_exact",
        "trim": true,
        "required": true
      },
      {
        "id": "lan_dhcp_enabled",
        "name": "Enable DHCP Server",
        "selector": "input[name=\"ipv4Settings.dhcp.enabled\"]",
        "expected": "true",
        "type": "text_exact",
        "trim": true,
        "required": true
      },
      {
        "id": "lan_dhcp_start",
        "name": "Start IP Address",
        "selector": "input[name=\"ipv4Settings.dhcp.startAddress\"]",
        "expected": "192.168.1.2",
        "type": "text_exact",
        "trim": true,
        "required": true
      },
      {
        "id": "lan_dhcp_end",
        "name": "End IP Address",
        "selector": "input[name=\"ipv4Settings.dhcp.endAddress\"]",
        "expected": "192.168.1.254",
        "type": "text_exact",
        "trim": true,
        "required": true
      },
      {
        "id": "lan_dhcp_lease_days",
        "name": "Lease time - Day(s)",
        "selector": "input[name=\"ipv4Settings.dhcp.leaseTime.days\"]",
        "expected": "0",
        "type": "text_exact",
        "trim": true,
        "required": true
      },
      {
        "id": "lan_dhcp_lease_hours",
        "name": "Lease time - Hour(s)",
        "selector": "input[name=\"ipv4Settings.dhcp.leaseTime.hours\"]",
        "expected": "12",
        "type": "text_exact",
        "trim": true,
        "required": true
      }
    ]
  },
  guidePopups: [
    {
      "selector": ".MuiTypography-subtitle2:contains(\"Advanced\")",
      "text": "Chọn Advanced",
      "position": "right"
    },
    {
      "selector": "li.MuiMenuItem-root:contains(\"LAN\")",
      "text": "Chọn LAN",
      "position": "right"
    },
    {
      "selector": "input[name=\"ipv4Settings.ipAddress\"]",
      "text": "Nhập IP Address VD: 192.168.1.1",
      "position": "right"
    },
    {
      "selector": ".MuiAutocomplete-input",
      "text": "Nhập Subnet Mask VD: 255.255.255.0",
      "position": "right"
    },
    {
      "selector": "input[name=\"ipv4Settings.dhcp.enabled\"]",
      "text": "Đảm bảo đã Bật DHCP Server",
      "position": "left"
    },
    {
      "selector": "input[name=\"ipv4Settings.dhcp.startAddress\"]",
      "text": "Nhập Start IP Address VD: 192.168.1.2",
      "position": "left"
    },
    {
      "selector": "input[name=\"ipv4Settings.dhcp.endAddress\"]",
      "text": "Nhập End IP Address VD: 192.168.1.254",
      "position": "right"
    },
    {
      "selector": "input[name=\"ipv4Settings.dhcp.leaseTime.days\"]",
      "text": "Nhập Lease time Day(s) VD: 0",
      "position": "left"
    },
    {
      "selector": "input[name=\"ipv4Settings.dhcp.leaseTime.hours\"]",
      "text": "Nhập Lease time Hour(s) VD: 12",
      "position": "right"
    },
    {
      "selector": "button:contains(\"Save\")",
      "text": "Chọn Save",
      "position": "right"
    }
  ]
});
