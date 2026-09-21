/**
 * devices/vigor2927/lessons/bai3.js
 * Bài 3: Cấu hình Bind IP to MAC
 */

window.DEVICE_VIGOR2927_LESSONS = window.DEVICE_VIGOR2927_LESSONS || [];

window.DEVICE_VIGOR2927_LESSONS.push({
  id: 'vg2927-bai3',
  title: 'Cấu hình Bind IP to MAC',
  subtitle: 'Cấu hình Bind IP to MAC',
  instructions: [
    '<b>Yêu cầu:</b>',
    'Đăng nhập vào thiết bị và kiểm tra cấu hình Bind IP to MAC.',
    '- Username: <span class="val">admin</span>',
    '- Password: <span class="val">admin</span>',
  ],
  practiceUrl: '/sim_vigor2927/weblogin.htm',
  grading: {
    description: 'Kiểm tra đăng nhập và truy cập cấu hình Bind IP to MAC trên Vigor2927',
    rules: [
      {
        id: 'username',
        name: 'Tên đăng nhập',
        selector: 'input.userpwd:not([type="password"])',
        expected: 'admin',
        type: 'text_exact',
        trim: true,
        required: true
      },
      {
        id: 'password',
        name: 'Mật khẩu',
        selector: 'input.userpwd[type="password"]',
        expected: 'admin',
        type: 'text_exact',
        trim: true,
        required: true
      }
    ]
  },
  guidePopups: [
    {
      selector: 'input.userpwd:not([type="password"])',
      text: 'Nhập tên đăng nhập: admin',
      position: 'right'
    },
    {
      selector: 'input.userpwd[type="password"]',
      text: 'Nhập mật khẩu: admin',
      position: 'right'
    },
    {
      selector: 'input.login',
      text: 'Bấm Đăng Nhập',
      position: 'bottom'
    },
    {
      selector: '#menu',
      text: 'Sau khi đăng nhập, vào mục LAN để kiểm tra bảng Bind IP to MAC',
      position: 'right'
    }
  ]
});