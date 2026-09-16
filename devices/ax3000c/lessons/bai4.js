/**
 * devices/ax3000c/lessons/bai4.js
 * Bài 4: Cấu hình DNS trên AX3000C
 */

window.DEVICE_AX3000C_LESSONS = window.DEVICE_AX3000C_LESSONS || [];

window.DEVICE_AX3000C_LESSONS.push({
  id: 'LAB_AX3000CV2_04',
  title: 'Cấu hình DNS',
  subtitle: 'Cấu hình DNS',
  instructions: [
    '<b>Yêu cầu:</b>',
    'Thực hiện cấu hình DNS trên thiết bị và cấu hình các máy chủ DNS theo yêu cầu sau:',
    '- DNS Server 1: <span class="val">210.245.31.220</span> (DNS của FPT)',
    '- DNS Server 2: <span class="val">8.8.8.8</span> (DNS của Google)',
  ],
  practiceUrl: '/sim_ax3000c/#/network/lan',
  clearFields: [
    '.card .bd .row:nth-child(6) select',
    '.card .bd .row:nth-child(7) input',
    '.card .bd .row:nth-child(8) input'
  ],
  grading: {
    description: 'Kiểm tra cấu hình DNS Server trên AX3000C',
    rules: [
      {
        id: 'dns_custom_enable',
        name: 'Define custom servers',
        selector: '.card .bd .row:nth-child(6) select',
        expected: 'Enable',
        type: 'text_exact',
        trim: true,
        required: true
      },
      {
        id: 'dns_server_1',
        name: 'DNS Server 1',
        selector: '.card .bd .row:nth-child(7) input',
        expected: '210.245.31.220',
        type: 'text_exact',
        trim: true,
        required: true
      },
      {
        id: 'dns_server_2',
        name: 'DNS Server 2',
        selector: '.card .bd .row:nth-child(8) input',
        expected: '8.8.8.8',
        type: 'text_exact',
        trim: true,
        required: true
      }
    ]
  },
  guidePopups: [
    {
      selector: '.el-submenu[index="/network"]:not(.is-opened) .el-submenu__title, li.el-submenu:not(.is-opened) .el-submenu__title:contains("Network")',
      text: 'Chọn Network',
      position: 'right',
      hideOnPage: 'lan'
    },
    {
      selector: 'li.el-submenu.is-opened li.el-submenu:not(.is-opened) .el-submenu__title:contains("LAN")',
      text: 'Chọn LAN',
      position: 'right',
      hideOnPage: 'lan'
    },
    {
      selector: 'li.el-submenu.is-opened li.el-submenu.is-opened li.el-menu-item:contains("LAN"), li.el-submenu.is-opened li.el-menu-item:contains("LAN")',
      text: 'Chọn LAN',
      position: 'right',
      hideOnPage: 'lan'
    },
    {
      selector: '.card .bd .row:nth-child(6) .ctrl, .row:has(.lbl:contains("Define custom servers")) select, .row:has(.lbl:contains("Define custom servers")) input',
      text: 'Bước 1: chọn Enable của Define custom servers',
      position: 'right',
      page: 'lan'
    },
    {
      selector: '.card .bd .row:nth-child(7) input, .row:has(.lbl:contains("DNS Server 1")) input',
      text: 'Bước 2: nhập DNS Server 1 ví dụ: 210.245.31.220',
      position: 'right',
      page: 'lan'
    },
    {
      selector: '.card .bd .row:nth-child(8) input, .row:has(.lbl:contains("DNS Server 2")) input',
      text: 'Bước 3: nhập DNS Server 2 ví dụ: 8.8.8.8',
      position: 'right',
      page: 'lan'
    },
    {
      selector: 'button.apply, button.btn.apply, button[onclick*="save"], input[type="submit"]',
      text: 'Bước 4: chọn Apply',
      position: 'bottom',
      page: 'lan'
    }
  ]
});
