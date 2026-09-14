/**
 * devices/ax3000c/tooltips/bai6.js — Tooltip Hướng dẫn cho Bài 6: Cấu hình Port Forwarding (AX3000C)
 */

if (!window.TOOLTIPS_AX3000C) window.TOOLTIPS_AX3000C = {};

window.TOOLTIPS_AX3000C['LAB_AX3000CV2_06'] = [
  // 1. Chọn Network ở Menu bên trái (chỉ hiện khi chưa ở trang Port Forwarding)
  {
    selector: 'li.el-submenu:not(.is-opened):contains("Network") .el-submenu__title, .el-submenu__title:contains("Network")',
    text: 'Chọn Network',
    position: 'right',
    hideOnPage: 'portfwd'
  },
  // 2. Chọn Access ở Menu bên trái cấp 1 (chỉ hiện khi chưa ở trang Port Forwarding)
  {
    selector: 'li.el-submenu.is-opened:contains("Network") li.el-submenu:not(.is-opened):contains("Access") .el-submenu__title, .el-submenu:contains("Network") .el-submenu__title:contains("Access")',
    text: 'Chọn Access',
    position: 'right',
    hideOnPage: 'portfwd'
  },
  // 3. Chọn Port Forwarding ở Submenu bên trái cấp 2 (chỉ hiện khi chưa ở trang Port Forwarding)
  {
    selector: 'li.el-submenu.is-opened:contains("Network") li.el-submenu.is-opened:contains("Access") li.el-menu-item:contains("Port"), .el-menu-item:contains("Port")',
    text: 'Chọn Port Forwarding',
    position: 'right',
    hideOnPage: 'portfwd'
  },
  // Bước 1: Chọn Add để thêm rule mới (chỉ hiện khi ở trang Port Forwarding)
  {
    selector: 'button[onclick*="simAdd"], .card .bd button:contains("Add"), button.btn-sm',
    text: 'Bước 1: chọn Add để thêm rule',
    position: 'left',
    page: 'portfwd'
  },
  // Bước 2: Nhập Rule Name ví dụ: Camera (so le bottom)
  {
    selector: 'table tr td:nth-child(1) input, input[placeholder*="rule name"]',
    text: 'Bước 2: nhập Rule name ví dụ: Camera',
    position: 'bottom',
    expected: 'Camera',
    page: 'portfwd'
  },
  // Bước 3: Chọn Protocol TCP+UDP (so le top)
  {
    selector: 'table tr td:nth-child(2) select',
    text: 'Bước 3: chọn Protocol TCP+UDP',
    position: 'top',
    expected: 'TCP+UDP',
    page: 'portfwd'
  },
  // Bước 4: Nhập External Port ví dụ: 8080 (so le bottom)
  {
    selector: 'table tr td:nth-child(3) input, input[placeholder*="8080"]',
    text: 'Bước 4: nhập External port ví dụ: 8080',
    position: 'bottom',
    expected: '8080',
    page: 'portfwd'
  },
  // Bước 5: Nhập Internal IP ví dụ: 192.168.100.55 (so le top)
  {
    selector: 'table tr td:nth-child(4) input, input[placeholder*="192.168.100"]',
    text: 'Bước 5: nhập Internal IP ví dụ: 192.168.100.55',
    position: 'top',
    expected: '192.168.100.55',
    page: 'portfwd'
  },
  // Bước 6: Nhập Internal Port ví dụ: 80 (so le bottom)
  {
    selector: 'table tr td:nth-child(5) input, input[placeholder*="80"]',
    text: 'Bước 6: nhập Internal port ví dụ: 80',
    position: 'bottom',
    expected: '80',
    page: 'portfwd'
  },
  // Bước 7: Chọn Apply để lưu cấu hình
  {
    selector: '.actions button.apply, button[onclick*="simState.save"], button.apply',
    text: 'Bước 7: chọn Apply để lưu cấu hình',
    position: 'bottom',
    page: 'portfwd'
  }
];
