/**
 * devices/ax3000c/tooltips/bai4.js — Tooltip Hướng dẫn cho Bài 4: Cấu hình DNS (AX3000C)
 */

if (!window.TOOLTIPS_AX3000C) window.TOOLTIPS_AX3000C = {};

window.TOOLTIPS_AX3000C['LAB_AX3000CV2_04'] = [
  // 1. Chọn Network ở Menu bên trái
  {
    selector: '.el-submenu[index="/network"]:not(.is-opened) .el-submenu__title, li.el-submenu:not(.is-opened) .el-submenu__title:contains("Network")',
    text: 'Chọn Network',
    position: 'right',
    hideOnPage: 'lan'
  },
  // 2. Chọn LAN ở Menu bên trái cấp 1
  {
    selector: 'li.el-submenu.is-opened:contains("Network") li.el-submenu:not(.is-opened):contains("LAN") .el-submenu__title',
    text: 'Chọn LAN',
    position: 'right',
    hideOnPage: 'lan'
  },
  // 3. Chọn LAN ở Submenu bên trái cấp 2
  {
    selector: 'li.el-submenu.is-opened:contains("Network") li.el-submenu.is-opened:contains("LAN") li.el-menu-item:contains("LAN"), li.el-submenu.is-opened:contains("Network") li.el-menu-item:contains("LAN")',
    text: 'Chọn LAN',
    position: 'right',
    hideOnPage: 'lan'
  },
  // Bước 1: chọn Enable của Define custom servers (chỉ hiện khi ở trang LAN)
  {
    selector: '.card .bd .row:nth-child(6) .ctrl, .row:has(.lbl:contains("Define custom servers")) select, .row:has(.lbl:contains("Define custom servers")) input',
    text: 'Bước 1: chọn Enable của Define custom servers',
    position: 'right',
    page: 'lan'
  },
  // Bước 2: nhập DNS Server 1 ví dụ: 210.245.31.220 (chỉ hiện khi ở trang LAN)
  {
    selector: '.card .bd .row:nth-child(7) input, .row:has(.lbl:contains("DNS Server 1")) input',
    text: 'Bước 2: nhập DNS Server 1 ví dụ: 210.245.31.220',
    position: 'right',
    page: 'lan'
  },
  // Bước 3: nhập DNS Server 2 ví dụ: 8.8.8.8 (chỉ hiện khi ở trang LAN)
  {
    selector: '.card .bd .row:nth-child(8) input, .row:has(.lbl:contains("DNS Server 2")) input',
    text: 'Bước 3: nhập DNS Server 2 ví dụ: 8.8.8.8',
    position: 'right',
    page: 'lan'
  },
  // Bước 4: chọn Apply (chỉ hiện khi ở trang LAN)
  {
    selector: 'button.apply, button.btn.apply, button[onclick*="save"], input[type="submit"]',
    text: 'Bước 4: chọn Apply',
    position: 'bottom',
    page: 'lan'
  }
];
