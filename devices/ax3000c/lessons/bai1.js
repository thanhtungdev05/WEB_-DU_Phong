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
    try {
      var iframe = document.getElementById('device-iframe') || document.getElementById('deviceIframe');
      var doc = iframe && (iframe.contentDocument || (iframe.contentWindow && iframe.contentWindow.document));
      if (doc) {
        doc.querySelectorAll('.el-form-item').forEach(function (fi) {
          var l = fi.querySelector('.el-form-item__label');
          var txt = l ? l.textContent.trim() : '';
          if (txt.includes('PPP Username') || txt.includes('PPP Password')) {
            var inp = fi.querySelector('input');
            if (inp && !inp._ftcUserModified && inp !== doc.activeElement && inp.value === 'fpt') {
              inp.value = '';
              inp.dispatchEvent(new (doc.defaultView || window).Event('input', { bubbles: true }));
            }
          }
        });
      }
    } catch (e) { }
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
