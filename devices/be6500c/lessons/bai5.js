/**
 * devices/be6500c/lessons/bai5.js
 */
window.DEVICE_BE6500C_LESSONS = window.DEVICE_BE6500C_LESSONS || [];
var bai5 = {
  id: 'be6500c-bai5',
  title: 'Cấu hình Port Forwarding',
  subtitle: 'Cấu hình Port Forwarding',
  instructions: [
    "<b>Yêu cầu:</b>",
    "Tạo 1 rule Port Forwarding:",
    "- Tên rule (Name): <span class=\"val\">Camera</span>",
    "- Giao thức (Protocol): <span class=\"val\">TCP_UDP</span>",
    "- External Port: <span class=\"val\">8080</span>",
    "- Internal IP: <span class=\"val\">192.168.1.20</span>",
    "- Internal Port: <span class=\"val\">80</span>"
  ],
  practiceUrl: '/sim_be6500c/network__portforward.html',
  clearFields: ['input[name="name"]', 'input[name="source.portRange"]', 'input[name="destination.portRange"]'],
  grading: {
    description: 'Kiểm tra bài 5',
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
        "selector": "tbody tr td:nth-child(6), tbody tr td:nth-child(6) span",
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
      "selector": ".MuiTypography-subtitle2:contains(\"Network\"), svg[data-testid=\"LanguageOutlinedIcon\"], svg[data-testid=\"LanguageTwoToneIcon\"], svg[data-testid=\"LanguageIcon\"]",
      "text": "Bước 1: Chọn Network",
      "position": "right"
    },
    {
      "selector": "li.MuiMenuItem-root:contains(\"Port Forwarding\"), .MuiTypography-root:contains(\"Port Forwarding\"), span:contains(\"Port Forwarding\"), p:contains(\"Port Forwarding\")",
      "text": "Bước 2: Chọn Port Forwarding",
      "position": "right"
    },
    {
      "selector": "button:contains(\"Add New\")",
      "text": "Bước 3: Thêm Rule mới",
      "position": "right"
    },
    {
      "selector": "input[name=\"name\"]",
      "text": "Bước 4: Nhập tên rule (VD: Camera)",
      "position": "right",
      "expected": "Camera"
    },
    {
      "selector": "#mui-component-select-protocol",
      "text": "Bước 5: Chọn Protocol (VD: TCP_UDP)",
      "position": "left",
      "expected": ["TCP_UDP", "TCP + UDP"]
    },
    {
      "selector": "input[name=\"source.portRange\"]",
      "text": "Bước 6: Nhập External Port (VD: 8080)",
      "position": "right",
      "expected": "8080"
    },
    {
      "selector": ".MuiAutocomplete-input",
      "text": "Bước 7: Nhập Internal IP (VD: 192.168.1.20)",
      "position": "left",
      "expected": "192.168.1.20"
    },
    {
      "selector": "input[name=\"destination.portRange\"]",
      "text": "Bước 8: Nhập Internal Port (VD: 80)",
      "position": "right",
      "expected": "80"
    },
    {
      "selector": "button.dlg-luu",
      "text": "Bước 9: Lưu cấu hình",
      "position": "bottom"
    }
  ]
};

var existingIndex = window.DEVICE_BE6500C_LESSONS.findIndex(function (l) { return l.id === 'be6500c-bai5'; });
if (existingIndex >= 0) {
  window.DEVICE_BE6500C_LESSONS[existingIndex] = bai5;
} else {
  window.DEVICE_BE6500C_LESSONS.push(bai5);
}
