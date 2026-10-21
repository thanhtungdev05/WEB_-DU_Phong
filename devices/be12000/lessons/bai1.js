/**
 * devices/be12000/lessons/bai1.js
 * Bài 1 - Cấu hình PPPoE trên BE12000
 */

window.DEVICE_BE12000_LESSONS = window.DEVICE_BE12000_LESSONS || [];

var lessonId = 'LAB_BE12000_01';
var lessonData = {
  id: lessonId,
  title: 'Cấu hình PPPoE',
  subtitle: 'Cấu hình PPPoE',
  instructions: [
    '<b>Yêu cầu:</b>',
    '- Connection Name: <span class="val">FPT</span>',
    '- Username: <span class="val">hnfdl-123456-789</span>',
    '- Password: <span class="val">d123456</span>',
  ],
  practiceUrl: '/sim_be12000/login',
  onSimLoad: function (simWin) {
    try {
      if (simWin && simWin.top) {
        simWin.top._hasSuccHintStored = false;
        simWin.top._hasClickedSaveInGuide = false;
      }
    } catch (e) { }
  },
  clearFields: [
    '#WANCName',
    'input[id^="WANCName"]',
    'input[name="WANCName"]',
    '#UserName',
    '#Password',
    'input[id^="UserName"]',
    'input[id^="Password"]',
    'input[name="UserName"]',
    'input[name="Password"]'
  ],
  allowedSelectors: [
    'input[name^="IsNAT"]',
    'input[name^="VlanEnable"]',
    'input[id^="IsNAT"]',
    'input[id^="VlanEnable"]',
    'input[name="IsNAT"]',
    'input[name="VlanEnable"]',
    '#IsNAT1',
    '#IsNAT0',
    '#VlanEnable1',
    '#VlanEnable0'
  ],
  grading: {
    description: 'Kiểm tra cấu hình PPPoE trên BE12000',
    rules: [
      {
        id: 'pppoe_cname',
        name: 'Connection Name',
        selector: '#WANCName, input[id^="WANCName"], input[name="WANCName"]',
        expected: 'FPT',
        type: 'text_exact',
        trim: true,
        required: true
      },
      {
        id: 'pppoe_user',
        name: 'PPPoE Username',
        selector: '#UserName, input[id^="UserName"], input[name="UserName"]',
        expected: 'hnfdl-123456-789',
        type: 'text_exact',
        trim: true,
        required: true
      },
      {
        id: 'pppoe_pwd',
        name: 'PPPoE Password',
        selector: '#Password, input[id^="Password"], input[name="Password"]',
        expected: 'd123456',
        type: 'text_exact',
        trim: true,
        required: true
      },
      {
        id: 'pppoe_nat',
        name: 'NAT',
        selector: 'input[name^="IsNAT"], input[id^="IsNAT"], #IsNAT1, #IsNAT0',
        expected: '1',
        displayExpected: 'On',
        valueLabels: { '1': 'On', '0': 'Off', 'true': 'On', 'false': 'Off' },
        type: 'text_exact',
        required: true
      },
      {
        id: 'pppoe_vlan',
        name: 'VLAN',
        selector: 'input[name^="VlanEnable"], input[id^="VlanEnable"], #VlanEnable1, #VlanEnable0',
        expected: '0',
        displayExpected: 'Off',
        valueLabels: { '1': 'On', '0': 'Off', 'true': 'On', 'false': 'Off' },
        type: 'text_exact',
        required: true
      }
    ]
  },
  guidePopups: (window.TOOLTIPS_BE12000 && window.TOOLTIPS_BE12000[lessonId]) || []
};

var idx = window.DEVICE_BE12000_LESSONS.findIndex(function (l) { return l.id === lessonId; });
if (idx >= 0) {
  window.DEVICE_BE12000_LESSONS[idx] = lessonData;
} else {
  window.DEVICE_BE12000_LESSONS.push(lessonData);
}
