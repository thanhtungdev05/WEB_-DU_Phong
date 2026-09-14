/**
 * devices/ax3000c/tooltips/bai5.js — Tooltip Hướng dẫn cho Bài 5: Cấu hình DHCP (AX3000C)
 */

if (!window.TOOLTIPS_AX3000C) window.TOOLTIPS_AX3000C = {};

window.TOOLTIPS_AX3000C['LAB_AX3000CV2_05'] = [
  // 1. Chọn Network ở Menu bên trái (chỉ hiện khi chưa ở trang LAN)
  {
    selector: 'li.el-submenu:not(.is-opened):contains("Network") .el-submenu__title, .el-submenu__title:contains("Network")',
    text: 'Chọn Network',
    position: 'right',
    hideOnPage: 'lan'
  },
  // 2. Chọn LAN ở Menu bên trái cấp 1 (chỉ hiện khi chưa ở trang LAN)
  {
    selector: 'li.el-submenu.is-opened:contains("Network") li.el-submenu:not(.is-opened):contains("LAN") .el-submenu__title, .el-submenu:contains("Network") .el-submenu__title:contains("LAN")',
    text: 'Chọn LAN',
    position: 'right',
    hideOnPage: 'lan'
  },
  // 3. Chọn LAN ở Submenu bên trái cấp 2 (chỉ hiện khi chưa ở trang LAN)
  {
    selector: 'li.el-submenu.is-opened:contains("Network") li.el-submenu:not(.is-opened):contains("LAN") li.el-menu-item:contains("LAN"), .el-menu-item:contains("LAN")',
    text: 'Chọn LAN',
    position: 'right',
    hideOnPage: 'lan'
  },
  // Bước 1: Đặt IP cho Router ví dụ: 192.168.100.1 (chỉ hiện khi ở trang LAN)
  {
    selector: '#lanIp, .card .bd .row:nth-child(1) input',
    text: 'Bước 1: đặt IP cho Router ví dụ: 192.168.100.1',
    position: 'right',
    expected: '192.168.100.1',
    page: 'lan'
  },
  // Bước 2: Đặt Subnet mask ví dụ: 255.255.255.0 (chỉ hiện khi ở trang LAN)
  {
    selector: '.card .bd .row:nth-child(2) input',
    text: 'Bước 2: kiểm tra Subnet mask ví dụ: 255.255.255.0',
    position: 'right',
    expected: '255.255.255.0',
    page: 'lan'
  },
  // Bước 3: Kiểm tra IP bắt đầu tự nhảy thành 192.168.100.2 (chỉ hiện khi ở trang LAN)
  {
    selector: '#dhcpStart, .card .bd .row:nth-child(3) input',
    text: 'Bước 3: kiểm tra IP bắt đầu tự nhảy thành 192.168.100.2',
    position: 'right',
    expected: '192.168.100.2',
    page: 'lan'
  },
  // Bước 4: Kiểm tra IP kết thúc tự nhảy thành 192.168.100.249 (chỉ hiện khi ở trang LAN)
  {
    selector: '#dhcpEnd, .card .bd .row:nth-child(4) input',
    text: 'Bước 4: kiểm tra IP kết thúc tự nhảy thành 192.168.100.249',
    position: 'right',
    expected: '192.168.100.249',
    page: 'lan'
  },
  // Bước 5: Chọn Apply để lưu cấu hình (chỉ hiện khi ở trang LAN)
  {
    selector: 'button.apply, .actions button.apply, button[onclick*="save"], input[type="submit"]',
    text: 'Bước 5: chọn Apply',
    position: 'bottom',
    page: 'lan'
  }
];
