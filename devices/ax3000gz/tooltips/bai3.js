/**
 * devices/ax3000gz/tooltips/bai3.js 
 * Tooltip chỉ dẫn cho Bài 3: Cấu hình WiFi IoT trên AX3000GZ
 */
window.TOOLTIPS_AX3000GZ = window.TOOLTIPS_AX3000GZ || {};

window.TOOLTIPS_AX3000GZ['LAB_AX3000GZ_03'] = [
  {
    selector: '#topmenu a[href*="localnetwork"]',
    text: 'Chọn Local Network',
    position: 'bottom',
    hideOnPage: 'localnetwork'
  },
  {
    selector: '#sidebarmenu a[href*="/localnetwork/WLAN"]',
    text: 'Chọn WLAN',
    position: 'right',
    hideOnPage: 'wlan'
  },
  {
    selector: '.tabs a[href*="WLANbasic"]',
    text: 'Chọn tab WLAN Basic',
    position: 'bottom',
    hideOnPage: 'wlanbasic'
  },
  {
    selector: '#wlan_ssid_config_text',
    text: 'Bước 1: Bấm vào "WLAN SSID Configuration" để mở rộng bảng cấu hình',
    position: 'right',
    page: 'wlan'
  },
  {
    selector: '#cbi-json-WLANSSID1 .cbi-button-edit',
    text: 'Bước 2: Chọn Edit ở dòng SSID2(2.4G)',
    position: 'left',
    page: 'wlan'
  },
  {
    selector: '[id="modal_field_SSID"]',
    text: 'Bước 3: Nhập SSID Name: FPT IoT',
    position: 'right',
    page: 'wlan'
  },
  {
    selector: '[id="modal_field_KeyPassphrase"] input',
    text: 'Bước 4: Nhập WPA Passphrase: fptiot123',
    position: 'right',
    page: 'wlan'
  },
  {
    selector: '#modal_overlay .cbi-button-save, .modal .cbi-button-save',
    text: 'Bước 5: Chọn Apply để lưu cấu hình',
    position: 'top',
    page: 'wlan'
  }
];
