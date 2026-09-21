/**
 * devices/vigor2927/lessons/bai2.js
 * Bài 2: Cấu hình giới hạn băng thông
 */

window.DEVICE_VIGOR2927_LESSONS = window.DEVICE_VIGOR2927_LESSONS || [];

window.DEVICE_VIGOR2927_LESSONS.push({
  id: 'vg2927-bai2',
  title: 'Cấu hình giới hạn băng thông',
  subtitle: 'Cấu hình giới hạn băng thông',
  instructions: [
    '<b>Yêu cầu:</b>',
    'Đăng nhập vào thiết bị và kiểm tra cấu hình giới hạn băng thông.',
    '- Username: <span class="val">admin</span>',
    '- Password: <span class="val">admin</span>',
  ],
  practiceUrl: '/sim_vigor2927/weblogin.htm',
  grading: {
    description: 'Kiểm tra đăng nhập và truy cập cấu hình giới hạn băng thông trên Vigor2927',
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
      text: 'Sau khi đăng nhập, vào mục Bandwidth Management để kiểm tra giới hạn băng thông',
      position: 'right'
    }
  ]
});