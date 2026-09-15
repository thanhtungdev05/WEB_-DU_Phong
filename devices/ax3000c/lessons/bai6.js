/**
 * devices/ax3000c/lessons/bai6.js
 * Bài 6: Cấu hình Port Forwarding trên AX3000C
 */

window.DEVICE_AX3000C_LESSONS = window.DEVICE_AX3000C_LESSONS || [];

var idx = window.DEVICE_AX3000C_LESSONS.findIndex(function (l) { return l.id === 'LAB_AX3000CV2_06'; });
var lessonObj = {
  id: 'LAB_AX3000CV2_06',
  title: 'Cấu hình Port Forwarding',
  subtitle: 'Cấu hình Port Forwarding',
  instructions: [
    '<b>Yêu cầu:</b>',
    'Thực hiện cấu hình Mở Port trên thiết bị theo các thông số được cung cấp dưới đây.',
    '- Rule Name: <span class="val">Camera</span>',
    '- Protocol: <span class="val">TCP+UDP</span>',
    '- External Port: <span class="val">8080</span>',
    '- Internal IP: <span class="val">192.168.100.55</span>',
    '- Internal Port: <span class="val">80</span>'
  ],
  practiceUrl: '/sim_ax3000c/#/network/portfwd',
  grading: {
    description: 'Kiểm tra Port Forwarding Rules trên AX3000C',
    rules: [
      {
        id: 'rule_name',
        name: 'Rule Name',
        selector: 'table tr td:nth-child(1) input, input[placeholder*="rule name"]',
        expected: 'Camera',
        type: 'text_exact',
        trim: true,
        required: true
      },
      {
        id: 'protocol',
        name: 'Protocol',
        selector: 'table tr td:nth-child(2) select',
        expected: 'TCP+UDP',
        type: 'text_exact',
        trim: true,
        required: true
      },
      {
        id: 'ext_port',
        name: 'External Port',
        selector: 'table tr td:nth-child(3) input, input[placeholder*="8080"]',
        expected: '8080',
        type: 'text_exact',
        trim: true,
        required: true
      },
      {
        id: 'int_ip',
        name: 'Internal IP',
        selector: 'table tr td:nth-child(4) input, input[placeholder*="192.168.100"]',
        expected: '192.168.100.55',
        type: 'text_exact',
        trim: true,
        required: true
      },
      {
        id: 'int_port',
        name: 'Internal Port',
        selector: 'table tr td:nth-child(5) input, input[placeholder*="80"]',
        expected: '80',
        type: 'text_exact',
        trim: true,
        required: true
      }
    ]
  },
  guidePopups: (window.TOOLTIPS_AX3000C && window.TOOLTIPS_AX3000C['LAB_AX3000CV2_06']) ? window.TOOLTIPS_AX3000C['LAB_AX3000CV2_06'] : [
    {
      selector: 'li.el-submenu:not(.is-opened):contains("Network") .el-submenu__title, .el-submenu__title:contains("Network")',
      text: 'Chọn Network',
      position: 'right',
      hideOnPage: 'portfwd'
    },
    {
      selector: 'li.el-submenu.is-opened:contains("Network") li.el-submenu:not(.is-opened):contains("Access") .el-submenu__title, .el-submenu:contains("Network") .el-submenu__title:contains("Access")',
      text: 'Chọn Access',
      position: 'right',
      hideOnPage: 'portfwd'
    },
    {
      selector: 'li.el-submenu.is-opened:contains("Network") li.el-submenu.is-opened:contains("Access") li.el-menu-item:contains("Port"), .el-menu-item:contains("Port")',
      text: 'Chọn Port Forwarding',
      position: 'right',
      hideOnPage: 'portfwd'
    },
    {
      selector: 'button[onclick*="simAdd"], .card .bd button:contains("Add"), button.btn-sm',
      text: 'Bước 1: chọn Add để thêm rule',
      position: 'left',
      page: 'portfwd'
    },
    {
      selector: 'table tr td:nth-child(1) input, input[placeholder*="rule name"]',
      text: 'Bước 2: nhập Rule name ví dụ: Camera',
      position: 'bottom',
      page: 'portfwd'
    },
    {
      selector: 'table tr td:nth-child(2) select',
      text: 'Bước 3: chọn Protocol TCP+UDP',
      position: 'top',
      page: 'portfwd'
    },
    {
      selector: 'table tr td:nth-child(3) input, input[placeholder*="8080"]',
      text: 'Bước 4: nhập External port ví dụ: 8080',
      position: 'bottom',
      page: 'portfwd'
    },
    {
      selector: 'table tr td:nth-child(4) input, input[placeholder*="192.168.100"]',
      text: 'Bước 5: nhập Internal IP ví dụ: 192.168.100.55',
      position: 'top',
      page: 'portfwd'
    },
    {
      selector: 'table tr td:nth-child(5) input, input[placeholder*="80"]',
      text: 'Bước 6: nhập Internal port ví dụ: 80',
      position: 'bottom',
      page: 'portfwd'
    },
    {
      selector: '.actions button.apply, button[onclick*="simState.save"], button.apply',
      text: 'Bước 7: chọn Apply để lưu cấu hình',
      position: 'bottom',
      page: 'portfwd'
    }
  ]
};

if (idx !== -1) {
  window.DEVICE_AX3000C_LESSONS[idx] = lessonObj;
} else {
  window.DEVICE_AX3000C_LESSONS.push(lessonObj);
}
