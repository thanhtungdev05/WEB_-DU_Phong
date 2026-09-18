/**
 * devices/ax3000s/tooltips/bai2.js — Tooltip Hướng dẫn cho Bài 2: Cấu hình WIFI
 */

if (!window.TOOLTIPS_AX3000S) window.TOOLTIPS_AX3000S = {};

window.TOOLTIPS_AX3000S['LAB_AX3000S_02'] = [
  // Nếu ở trang khác, hướng dẫn điều hướng vào WLAN
  {
    selector: "#Sky_WLAN li, #Sky_WLAN span, #Sky_WLAN, a[href*='/wlan']",
    text: 'Chọn WLAN',
    position: 'bottom',
    hideOnPage: 'wlan'
  },
  {
    selector: "#layer2-leaf-wlangband .dt, #layer2-leaf-wlangband, a[href*='/wlanBasicSetting2g']",
    text: 'Chọn WLAN 2.4G',
    position: 'right',
    hideOnPage: 'wlanBasicSetting2g'
  },

  // --- PHẦN 1: CẤU HÌNH WLAN 2.4G ---
  // Bước 1: Nhập Primary SSID: FPT Telecom
  {
    selector: '#Txt_SSID',
    text: 'Bước 1: Nhập Primary SSID: FPT Telecom',
    position: 'right',
    page: 'wlanBasicSetting2g',
    expected: 'FPT Telecom',
    hideWhenSaved: true
  },
  // Bước 2: Nhập WPA Passphrase: 19006600
  {
    selector: '#Pwd_WpaPsk',
    text: 'Bước 2: Nhập WPA Passphrase: 19006600',
    position: 'right',
    page: 'wlanBasicSetting2g',
    expected: '19006600',
    hideWhenSaved: true
  },
  // Bước 3: Nhấn Save & Apply để lưu cấu hình 2.4G
  {
    selector: '#button_apply',
    text: 'Bước 3: Nhấn Save & Apply để lưu cấu hình 2.4G',
    position: 'top',
    page: 'wlanBasicSetting2g',
    hideWhenSaved: true
  },
  // Bước 4: Chọn menu WLAN 5G (chỉ hiện sau khi làm xong Bước 3)
  {
    selector: '#layer2-leaf-wlanaband .dt, #layer2-leaf-wlanaband',
    text: 'Bước 4: Chọn menu WLAN 5G',
    position: 'right',
    page: 'wlanBasicSetting2g',
    hideOnPage: 'wlanBasicSetting5g',
    requireSaved: true
  },

  // --- PHẦN 2: CẤU HÌNH WLAN 5G ---
  // Bước 5: Chọn mục Basic Settings của WLAN 5G
  {
    selector: '#layer2-leaf-wlanaband a[href*="wlanBasicSetting5g"], #layer2-leaf-wlanaband #Sky_Basic_Settings, #layer2-leaf-wlanaband .layer3-menu li:first-child',
    text: 'Bước 5: Chọn mục Basic Settings',
    position: 'right',
    hideOnPage: 'wlanBasicSetting5g',
    requireSaved: true
  },
  // Bước 6: Nhấn Save & Apply để lưu cấu hình 5G
  {
    selector: '#button_apply',
    text: 'Bước 6: Nhấn Save & Apply để lưu cấu hình 5G',
    position: 'top',
    page: 'wlanBasicSetting5g'
  }
];
