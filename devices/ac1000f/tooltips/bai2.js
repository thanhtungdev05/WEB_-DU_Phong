/**
 * devices/ac1000f/tooltips/bai2.js — Tooltip Hướng dẫn cho Bài 2: Cấu hình mạng Wi-Fi
 */

if (!window.TOOLTIPS_AC1000F) window.TOOLTIPS_AC1000F = {};

window.TOOLTIPS_AC1000F['LAB_AC1000F_02'] = [
  // --- CHUNG ---
  {
    selector: 'a[onclick*="change_bg2"]',
    text: 'Bước 1: Chọn tab Network',
    position: 'top',
    hideOnPage: 'home_wireless.asp'
  },
  {
    selector: 'a[href*="home_wireless.asp"]',
    text: 'Bước 2: Chọn Wireless 2.4G',
    position: 'top',
    hideOnPage: 'home_wireless.asp'
  },

  // --- 2.4G (Chỉ hiện ở trang home_wireless.asp) ---
  {
    page: 'home_wireless.asp',
    selector: 'input[name="ESSID"], input[name="ssid"]',
    text: 'Bước 3: Nhập tên Wifi bạn muốn (VD: FPT Telecom)',
    position: 'right',
    expected: 'FPT Telecom'
  },
  {
    page: 'home_wireless.asp',
    selector: 'input[name="PreSharedKey1"], input[name="PreSharedKey2"], input[name="PreSharedKey3"], input[name*="PreSharedKey"]',
    text: 'Bước 4: Nhập mật khẩu bạn muốn (VD: 19006600)',
    position: 'right',
    expected: '19006600'
  },
  {
    page: 'home_wireless.asp',
    selector: 'input[name="SaveBtn"], input[value="Save"], input[name="save"], #save, #btnSave, .button1',
    text: 'Bước 5: Chọn Save & Apply cho 2.4G',
    position: 'right'
  },

  // --- 5G (Tiếp nối, menu luôn hiện) ---
  {
    selector: 'a[href*="home_wireless_5g.asp"]',
    text: 'Bước 6: Chọn sang Wireless 5G',
    position: 'bottom',
    hideOnPage: 'home_wireless_5g.asp'
  },

  // (Chỉ hiện ở trang home_wireless_5g.asp)
  {
    page: 'home_wireless_5g.asp',
    selector: 'input[name="ESSID"], input[name="ssid"]',
    text: 'Bước 7: Nhập tên Wifi 5G (VD: FPT Telecom)',
    position: 'right',
    expected: 'FPT Telecom'
  },
  {
    page: 'home_wireless_5g.asp',
    selector: 'input[name="PreSharedKey1"], input[name="PreSharedKey2"], input[name="PreSharedKey3"], input[name*="PreSharedKey"]',
    text: 'Bước 8: Nhập mật khẩu 5G (VD: 19006600)',
    position: 'right',
    expected: '19006600'
  },
  {
    page: 'home_wireless_5g.asp',
    selector: 'input[name="SaveBtn"], input[value="Save"], input[name="save"], #save, #btnSave, .button1',
    text: 'Bước 9: Chọn Save & Apply cho 5G',
    position: 'right'
  }
];
