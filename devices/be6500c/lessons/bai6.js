/**
 * devices/ONT_be6500c/lessons/bai6.js
 */
window.DEVICE_BE6500C_LESSONS = window.DEVICE_BE6500C_LESSONS || [];
window.DEVICE_BE6500C_LESSONS.push({
  id: 'be6500c-bai6',
  title: 'Cấu hình Port Forwarding',
  subtitle: 'Cấu hình Port Forwarding',
  instructions: [
    "<b>Yêu cầu:</b>",
    "Tạo 1 rule Port Forwarding:",
    "- Tên rule (Name): <span class=\"val\">Camera</span>",
    "- Giao thức (Protocol): <span class=\"val\">TCP_UDP</span> (hoặc TCP + UDP)",
    "- External Port: <span class=\"val\">8080</span>",
    "- Internal IP: <span class=\"val\">192.168.1.20</span>",
    "- Internal Port: <span class=\"val\">80</span>"
  ],
  practiceUrl: '/sim_be6500c/network__portforward.html',
  clearFields: ['input[name="name"]', 'input[name="source.portRange"]', 'input[name="destination.portRange"]'],
  grading: {
    description: 'Kiểm tra bài 6',
    rules: [
      {
        "id": "pf_name",
        "name": "Name",
        "selector": "tbody tr td:nth-child(3)",
        "expected": "Camera",
        "type": "case_insensitive",
        "trim": true,
        "required": true
      },
      {
        "id": "pf_protocol",
        "name": "Protocol",
        "selector": "tbody tr td:nth-child(4)",
        "expected": ["TCP_UDP", "TCP + UDP"],
        "type": "any_of",
        "trim": true,
        "required": true
      },
      {
        "id": "pf_ext_port",
        "name": "External Port",
        "selector": "tbody tr td:nth-child(5)",
        "expected": "8080",
        "type": "text_exact",
        "trim": true,
        "required": true
      },
      {
        "id": "pf_ip",
        "name": "Internal IP",
        "selector": "tbody tr td:nth-child(6) span",
        "expected": "192.168.1.20",
        "type": "contains",
        "trim": true,
        "required": true
      },
      {
        "id": "pf_int_port",
        "name": "Internal Port",
        "selector": "tbody tr td:nth-child(7)",
        "expected": "80",
        "type": "text_exact",
        "trim": true,
        "required": true
      }
    ]
  },
  guidePopups: [
    {
      "selector": ".MuiTypography-subtitle2:contains(\"Network\")",
      "text": "Chọn Network",
      "position": "right"
    },
    {
      "selector": ".MuiTypography-subtitle2:contains(\"Port Forwarding\")",
      "text": "Chọn Port Forwarding",
      "position": "right"
    },
    {
      "selector": "button:contains(\"Add New\")",
      "text": "Thêm Rule mới",
      "position": "right"
    },
    {
      "selector": "input[name=\"name\"]",
      "text": "Nhập tên rule",
      "position": "right"
    },
    {
      "selector": "#mui-component-select-protocol",
      "text": "Chọn Protocol",
      "position": "left"
    },
    {
      "selector": "input[name=\"source.portRange\"]",
      "text": "Nhập External Port",
      "position": "right"
    },
    {
      "selector": ".MuiAutocomplete-input",
      "text": "Nhập Internal IP",
      "position": "left"
    },
    {
      "selector": "input[name=\"destination.portRange\"]",
      "text": "Nhập Internal Port",
      "position": "right"
    },
    {
      "selector": "button.dlg-luu",
      "text": "Lưu cấu hình",
      "position": "right"
    }
  ]
});
