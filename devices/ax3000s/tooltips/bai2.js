/**
 * devices/ax3000s/tooltips/bai2.js — Tooltip Hướng dẫn cho Bài 2: Cấu hình WIFI
 */

if (!window.TOOLTIPS_AX3000S) window.TOOLTIPS_AX3000S = {};

window.TOOLTIPS_AX3000S['LAB_AX3000S_02'] = [
  // Bước 1: Chọn menu WLAN (Nếu ở trang khác, điều hướng vào WLAN)
  {
    selector: "#Sky_WLAN li, #Sky_WLAN span, #Sky_WLAN, #nav-layer1 a[href*='/wlan'] li, a[href*='/wlan'] span, a[href*='/wlan']",
    text: 'Bước 1: Chọn WLAN',
    position: 'bottom',
    hideOnPage: 'wlan'
  },

  // Bước 2: Nhập Primary SSID: FPT Telecom (Luôn hiển thị trên trang cấu hình Wi-Fi)
  {
    selector: '#Txt_SSID',
    text: 'Bước 2: Nhập Primary SSID: FPT Telecom',
    position: 'right',
    page: 'wlanBasicSetting2g',
    expected: 'FPT Telecom'
  },

  // Bước 3: Nhập WPA Passphrase: 19006600 (Luôn hiển thị trên trang cấu hình Wi-Fi)
  {
    selector: '#Pwd_WpaPsk',
    text: 'Bước 3: Nhập WPA Passphrase: 19006600',
    position: 'right',
    page: 'wlanBasicSetting2g',
    expected: '19006600'
  },

  // Bước 4: Chọn Bandwidth: 20Mhz
  {
    selector: '#Sel_BandWidth',
    text: 'Bước 4: Chọn Bandwidth: 20Mhz',
    position: 'right',
    page: 'wlanBasicSetting2g',
    expected: '20Mhz'
  },

  // Bước 5: Nhấn Save & Apply để lưu cấu hình Wi-Fi (Luôn hiển thị trên trang cấu hình Wi-Fi)
  {
    selector: '#button_apply',
    text: 'Bước 5: Nhấn Save & Apply để lưu cấu hình',
    position: 'top',
    page: 'wlanBasicSetting2g'
  }
];
