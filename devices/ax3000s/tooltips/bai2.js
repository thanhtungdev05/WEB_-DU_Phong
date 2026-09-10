/**
 * devices/ax3000s/tooltips/bai2.js — Tooltip Hướng dẫn cho Bài 2: Cấu hình WIFI
 */

if (!window.TOOLTIPS_AX3000S) window.TOOLTIPS_AX3000S = {};

window.TOOLTIPS_AX3000S['LAB_AX3000S_02'] = [
  // Chọn WLAN
  {
    selector: "a[href*='/wlan'], #Sky_WLAN span, #Sky_WLAN",
    text: 'Bước 1: Chọn WLAN',
    position: 'bottom',
    hideOnPage: 'wlan'
  },
  // Chọn WLAN 2.4G
  {
    selector: "a[href*='/wlanBasicSetting2g'], #layer2-leaf-wlangband .dt, #layer2-leaf-wlangband",
    text: 'Bước 2: Chọn WLAN 2.4G',
    position: 'right',
    hideOnPage: 'wlanBasicSetting2g'
  },
  // Chọn Wi-Fi Basic Settings (2.4G)
  {
    selector: '#layer2-leaf-wlangband #Sky_Basic_Settings li, #layer2-leaf-wlangband #Sky_Basic_Settings',
    text: 'Bước 3: Chọn Wi-Fi Basic Settings (2.4G)',
    position: 'right',
    hideOnPage: 'wlanBasicSetting2g'
  },
  // Bước 1: Nhập Primary SSID: FPT Telecom
  {
    selector: '#Txt_SSID',
    text: 'Bước 4: Nhập Primary SSID: FPT Telecom',
    position: 'right',
    page: 'wlanBasicSetting2g',
    expected: 'FPT Telecom'
  },
  // Bước 2: Nhập WPA Passphrase: 19006600
  {
    selector: '#Pwd_WpaPsk',
    text: 'Bước 5: Nhập WPA Passphrase: 19006600',
    position: 'right',
    page: 'wlanBasicSetting2g',
    expected: '19006600'
  },
  // Chọn Bandwidth: 20Mhz
  {
    selector: '#Sel_BandWidth',
    text: 'Bước 6: Chọn Bandwidth: 20Mhz',
    position: 'right',
    page: 'wlanBasicSetting2g',
    expected: '20Mhz'
  },
  // Bước 3: nhấn Save Để lưu cấu hình Phần WLAN 2.4G
  {
    selector: '#button_apply',
    text: 'Bước 7: nhấn Save Để lưu cấu hình Phần WLAN 2.4G',
    position: 'top',
    page: 'wlanBasicSetting2g'
  },
  // Sau đó Chọn WLAN 5G
  {
    selector: "a[href*='/wlanBasicSetting5g'], #layer2-leaf-wlanaband .dt, #layer2-leaf-wlanaband",
    text: 'Bước 8 (Làm sau Bước 7): Chọn WLAN 5G',
    position: 'right',
    page: 'wlanBasicSetting2g'
  },
  // Chọn Wi-Fi Basic Settings (5G)
  {
    selector: '#layer2-leaf-wlanaband #Sky_Basic_Settings li, #layer2-leaf-wlanaband #Sky_Basic_Settings',
    text: 'Bước 9: Chọn Wi-Fi Basic Settings (5G)',
    position: 'right',
    page: 'wlanBasicSetting2g'
  },
  // Bước 4 Xem Primary SSID của phần 5G
  {
    selector: '#Txt_SSID',
    text: 'Bước 10: Xem Primary SSID của phần 5G: có dữ liệu giống Primary SSID của phần 2.4G',
    position: 'right',
    page: 'wlanBasicSetting5g'
  },
  // Bước 5 Xem WPA Passphrase của phần 5G
  {
    selector: '#Pwd_WpaPsk',
    text: 'Bước 11: Xem WPA Passphrase của phần 5G: có dữ liệu giống WPA Passphrase của phần 2.4G',
    position: 'right',
    page: 'wlanBasicSetting5g'
  },
  // Bước 6 Bấm Save để lưu cấu hình
  {
    selector: '#button_apply',
    text: 'Bước 12: Bấm Save để lưu cấu hình',
    position: 'top',
    page: 'wlanBasicSetting5g'
  }
];
