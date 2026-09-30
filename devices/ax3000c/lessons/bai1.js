/**
 * devices/ax3000c/lessons/bai1.js
 * Bài 1: Cấu hình PPPoE trên AX3000CV2 (firmware 0.5.3 — giao diện Vue/Element UI thật)
 */

window.DEVICE_AX3000C_LESSONS = window.DEVICE_AX3000C_LESSONS || [];

window.DEVICE_AX3000C_LESSONS.push({
  id: 'LAB_AX3000CV2_01',
  title: 'Cấu hình PPPoE',
  subtitle: 'Cấu hình PPPoE',
  instructions: [
    '<b>Yêu cầu:</b>',
    'Thực hiện cấu hình kết nối WAN/Internet trên thiết bị và thiết lập kết nối PPPoE theo các thông số được cung cấp dưới đây:',
    '- Username: <span class="val">sgfdl-123456-789</span>',
    '- Password: <span class="val">d123456</span>',
  ],
  practiceUrl: '/sim_ax3000c/#/home',
  // Xoá trắng PPP Username/Password khi mở trang (ô Vue: xem FTC_AX3000C.xoaO)
  customClear: function () {
    FTC_AX3000C.xoaO([FTC_AX3000C.o('PPP Username'), FTC_AX3000C.o('PPP Password')]);
  },
  grading: {
    description: 'Kiểm tra cấu hình PPPoE trên AX3000CV2',
    rules: [
      {
        id: 'pppoe_user',
        name: 'PPPoE Username',
        selector: FTC_AX3000C.o('PPP Username'),
        expected: 'sgfdl-123456-789',
        type: 'text_exact',
        trim: true,
        required: true
      },
      {
        id: 'pppoe_pwd',
        name: 'PPPoE Password',
        selector: FTC_AX3000C.o('PPP Password'),
        expected: 'd123456',
        type: 'text_exact',
        trim: true,
        required: true
      }
    ]
  },
  guidePopups: window.TOOLTIPS_AX3000C['LAB_AX3000CV2_01']
});
