/**
 * devices/vigor2927/lessons/bai1.js
 * Bài 1: Cấu hình PPPoE
 */

window.DEVICE_VIGOR2927_LESSONS = window.DEVICE_VIGOR2927_LESSONS || [];

window.DEVICE_VIGOR2927_LESSONS.push({
  id: 'vg2927-bai1',
  title: 'Cấu hình PPPoE',
  subtitle: 'Cấu hình PPPoE',
  instructions: [
    '<b>Yêu cầu:</b>',
    'Đăng nhập vào thiết bị và kiểm tra cấu hình WAN PPPoE.',
    '- Username: <span class="val">admin</span>',
    '- Password: <span class="val">admin</span>',
  ],
  practiceUrl: '/sim_vigor2927/weblogin.htm',
  grading: {
    description: 'Kiểm tra đăng nhập và truy cập cấu hình PPPoE trên Vigor2927',
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
      text: 'Sau khi đăng nhập, vào mục WAN để kiểm tra cấu hình PPPoE',
      position: 'right'
    }
  ]
});