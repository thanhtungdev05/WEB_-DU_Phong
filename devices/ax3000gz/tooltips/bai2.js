/**
 * devices/ax3000gz/tooltips/bai2.js — Tooltip Hướng dẫn cho Bài 2: Cấu hình WiFi (AX3000GZ)
 */

if (!window.TOOLTIPS_AX3000GZ) window.TOOLTIPS_AX3000GZ = {};

window.TOOLTIPS_AX3000GZ['LAB_AX3000GZ_02'] = [
  {
    selector: '#topmenu a[href*="localnetwork"]',
    text: 'Bước 1: Chọn Local Network',
    position: 'bottom',
    hideOnPage: 'localnetwork'
  },
  {
    selector: '#sidebarmenu a[href*="/localnetwork/WLAN"]',
    text: 'Bước 2: Chọn WLAN',
    position: 'right',
    page: 'localnetwork',
    hideOnPage: 'wlan'
  },
  {
    selector: '#wlan_ssid_config_text',
    text: 'Bước 3: Chọn WLAN SSID Configuration',
    position: 'right',
    page: 'wlan'
  },
  {
    selector: '#cbi-json-WLANSSID0 .cbi-button-edit',
    text: 'Bước 4: Chọn Edit của SSID1(2.4G)',
    position: 'left',
    page: 'wlan'
  },
  {
    selector: '[id="modal_field_SSID"]',
    text: 'Bước 5: Nhập SSID Name: FPT Telecom',
    position: 'right',
    page: 'wlan'
  },
  {
    selector: '[id="modal_field_KeyPassphrase"] input',
    text: 'Bước 6: Nhập WPA Passphrase: fpt12345',
    position: 'right',
    page: 'wlan'
  },
  {
    selector: '#modal_overlay .cbi-button-save',
    text: 'Bước 7: Chọn Apply để lưu cấu hình.',
    position: 'top',
    page: 'wlan'
  }
];
