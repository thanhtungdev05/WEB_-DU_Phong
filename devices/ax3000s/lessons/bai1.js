/**
 * devices/ax3000s/lessons/bai1.js
 * Bài 1: Cấu hình PPPoE trên AX3000S
 */

window.DEVICE_AX3000S_LESSONS = window.DEVICE_AX3000S_LESSONS || [];

var lessonObj = {
  id: 'LAB_AX3000S_01',
  title: 'Cấu hình PPPoE',
  subtitle: 'Cấu hình PPPoE',
  instructions: [
    '<b>Yêu cầu:</b>',
    '- Username: <span class="val">hnfdl-123456-789</span>',
    '- Password: <span class="val">d123456</span>'
  ],
  practiceUrl: '/sim_ax3000s/app.html#wancfg',
  clearFields: [
    'input[name="userName"]',
    'input[name="uPsd"]'
  ],
  grading: {
    description: 'Kiểm tra WAN Configuration trên AX3000S',
    rules: [
      {
        id: 'ppp_user',
        name: 'PPPoE Username',
        selector: 'input[name="userName"], #userName',
        expected: 'hnfdl-123456-789',
        type: 'text_exact',
        trim: true,
        required: true
      },
      {
        id: 'ppp_pwd',
        name: 'PPPoE Password',
        selector: 'input[name="uPsd"], #uPsd',
        expected: 'd123456',
        type: 'text_exact',
        trim: true,
        required: true
      }
    ]
  },
  guidePopups: (window.TOOLTIPS_AX3000S && window.TOOLTIPS_AX3000S['LAB_AX3000S_01']) || []
};

var idx = window.DEVICE_AX3000S_LESSONS.findIndex(function (l) { return l.id === 'LAB_AX3000S_01'; });
if (idx >= 0) {
  window.DEVICE_AX3000S_LESSONS[idx] = lessonObj;
} else {
  window.DEVICE_AX3000S_LESSONS.push(lessonObj);
}
