/**
 * devices/vigor2927/lessons/bai7.js
 * Bài 7: Cấu hình Policy Routing
 */

window.DEVICE_VIGOR2927_LESSONS = window.DEVICE_VIGOR2927_LESSONS || [];

window.DEVICE_VIGOR2927_LESSONS.push({
  id: 'vg2927-bai7',
  title: 'Cấu hình Policy Routing',
  subtitle: 'Cấu hình Policy Routing',
  instructions: [
    '<b>Yêu cầu:</b>',
    'Đăng nhập vào thiết bị và kiểm tra cấu hình Policy Routing.',
    '- Username: <span class="val">admin</span>',
    '- Password: <span class="val">admin</span>',
  ],
  practiceUrl: '/sim_vigor2927/weblogin.htm',
  grading: {
    description: 'Kiểm tra đăng nhập và truy cập cấu hình Policy Routing trên Vigor2927',
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
      text: 'Sau khi đăng nhập, vào mục Routing > Policy Routing để kiểm tra quy tắc định tuyến',
      position: 'right'
    }
  ]
});