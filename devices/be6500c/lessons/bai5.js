/**
 * devices/ONT_be6500c/lessons/bai5.js
 */
window.DEVICE_BE6500C_LESSONS = window.DEVICE_BE6500C_LESSONS || [];
window.DEVICE_BE6500C_LESSONS.push({
  id: 'be6500c-bai5',
  title: 'Cấu hình mạng LAN',
  subtitle: 'Cấu hình mạng LAN',
  instructions: [
  "<b>Yêu cầu:</b>",
  "Thực hiện cấu hình IPv4 LAN theo các thông số dưới đây:",
  "- IP Address (Gateway): <span class=\"val\">192.168.1.1</span>",
  "- Subnet Mask: <span class=\"val\">255.255.255.0</span>"
],
  practiceUrl: '/sim_be6500c/advanced__lan.html',
  clearFields: ['input[name="ipv4Settings.ipAddress"]', 'input[name="ipv4Settings.mask"]'],
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
    "selector": "input[name=\"ipv4Settings.mask\"]",
    "expected": "255.255.255.0",
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
    "selector": ".MuiTypography-subtitle2:contains(\"LAN\")",
    "text": "Chọn LAN",
    "position": "right"
  },
  {
    "selector": "input[name=\"ipv4Settings.ipAddress\"]",
    "text": "Nhập IP Address VD: 192.168.1.1",
    "position": "right"
  },
  {
    "selector": "input[name=\"ipv4Settings.mask\"]",
    "text": "Nhập Subnet Mask VD: 255.255.255.0",
    "position": "right"
  },
  {
    "selector": "button:contains(\"Save\")",
    "text": "Chọn Save",
    "position": "right"
  }
]
});
