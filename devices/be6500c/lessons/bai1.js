/**
 * devices/be6500c/lessons/bai1.js
 */
window.DEVICE_BE6500C_LESSONS = window.DEVICE_BE6500C_LESSONS || [];

window.DEVICE_BE6500C_LESSONS.push({
  id: 'be6500c-bai1',
  title: 'Cấu hình PPPoE',
  subtitle: 'Cấu hình PPPoE',
  instructions: [
    '<b>Yêu cầu:</b>',
    'Cấu hình kết nối mạng PPPoE cho thiết bị:',
    '- Username: <span class="val">hnfdl-123456-789</span>',
    '- Password: <span class="val">d123456</span>',
  ],
  practiceUrl: '/sim_be6500c/advanced__wan.html',
  clearFields: ['input[name="ipv4Settings.pppoe.username"]', 'input[name="ipv4Settings.pppoe.password"]'],
  grading: {
    description: 'Kiểm tra cấu hình PPPoE',
    rules: [

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
  guidePopups: [
    {
      "selector": ".MuiTypography-subtitle2:contains(\"Advanced\"), svg[data-testid=\"TuneTwoToneIcon\"], svg[data-testid=\"TuneOutlinedIcon\"]",
      "text": "Chọn Advanced",
      "position": "right"
    },
    {
      "selector": ".MuiTypography-subtitle1:contains(\"IPv4 Connection Type\")",
      "text": "Chọn IPv4 Connection Type",
      "position": "top"
    },
    {
      "selector": "div[id*=\"ipv4Settings.protocol\"]",
      "text": "Chọn PPPoE của phần Connection Type",
      "position": "right"
    },
    {
      "selector": "input[name=\"ipv4Settings.pppoe.username\"]",
      "text": "Bước 1: nhập hnfdl-123456-789",
      "position": "right"
    },
    {
      "selector": "input[name=\"ipv4Settings.pppoe.password\"]",
      "text": "Bước 2: nhập d123456",
      "position": "right"
    },
    {
      "selector": "body:has(input[name=\"ipv4Settings.pppoe.username\"]) button.alternative-layout--submit",
      "text": "Bước 3 chọn Save để lưu cấu hình nút Save chiếu vào Nút nộp bài hoặc nút Xem lỗi sai",
      "position": "right"
    }
  ]
});
