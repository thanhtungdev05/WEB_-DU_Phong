/**
 * devices/ax3000c/tooltips/bai3.js — Tooltip Hướng dẫn cho Bài 3: Cấu hình WiFi IoT (AX3000C)
 */

if (!window.TOOLTIPS_AX3000C) window.TOOLTIPS_AX3000C = {};

window.TOOLTIPS_AX3000C['LAB_AX3000CV2_03'] = [
  // 1. Chọn Network ở Menu bên trái (chỉ hiện khi chưa ở trang Wi-Fi)
  {
    selector: '.el-submenu__title:contains("Network"), .el-submenu:contains("Network")',
    text: 'Chọn Network',
    position: 'right',
    hideOnPage: 'wifi'
  },
  // 2. Chọn WIFI ở Menu bên trái cấp 1 (chỉ hiện khi chưa ở trang Wi-Fi)
  {
    selector: '.el-submenu:contains("Network") .el-submenu__title:contains("Wi-Fi"), .el-submenu:contains("Network") .el-submenu__title:contains("WIFI")',
    text: 'Chọn WIFI',
    position: 'right',
    hideOnPage: 'wifi'
  },
  // 3. Chọn WIFI ở Submenu bên trái cấp 2 (chỉ hiện khi chưa ở trang Wi-Fi)
  {
    selector: '.el-menu-item:contains("Wi-Fi"), .el-menu-item:contains("WIFI"), .el-menu-item[index*="/network/wifi"]',
    text: 'Chọn WIFI',
    position: 'right',
    hideOnPage: 'wifi'
  },
  // Bước 1: Chọn tab Specific SSID (cho IoT)
  {
    selector: '.tab[data-t="specific"]',
    text: 'Bước 1: chọn tab Specific SSID',
    position: 'top',
    page: 'wifi'
  },
  // Bước 2: Đặt tên WIFI IoT (chỉ hiện khi đang ở tab Specific SSID)
  {
    selector: 'body[data-active-tab="specific"] .card .row input[type="text"], .tabs:has(.tab.active[data-t="specific"]) ~ .card .row input[type="text"]',
    text: 'Bước 2: đặt tên WIFI IoT ví dụ: FPT IoT',
    position: 'right',
    expected: 'FPT IoT',
    page: 'wifi'
  },
  // Bước 3: Đặt mật khẩu WIFI IoT (chỉ hiện khi đang ở tab Specific SSID)
  {
    selector: 'body[data-active-tab="specific"] .card #pp, .tabs:has(.tab.active[data-t="specific"]) ~ .card #pp',
    text: 'Bước 3: đặt mật khẩu WIFI IoT ví dụ: fptiot123',
    position: 'right',
    expected: 'fptiot123',
    page: 'wifi'
  },
  // Bước 4: Chọn Apply (chỉ hiện khi đang ở tab Specific SSID)
  {
    selector: 'body[data-active-tab="specific"] .actions button.apply, .tabs:has(.tab.active[data-t="specific"]) ~ .actions button.apply',
    text: 'Bước 4: chọn Apply để lưu cấu hình',
    position: 'bottom',
    page: 'wifi'
  }
];
