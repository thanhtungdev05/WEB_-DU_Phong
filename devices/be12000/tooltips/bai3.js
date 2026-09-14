/**
 * devices/be12000/tooltips/bai3.js
 * Tooltips cho Bài 3: Cấu hình Wi-Fi IoT trên ONT BE12000
 */

if (!window.TOOLTIPS_BE12000) window.TOOLTIPS_BE12000 = {};

window.TOOLTIPS_BE12000['LAB_BE12000_03'] = [
  {
    selector: '#localnet:not(.SelectMenuItem)',
    text: 'Chọn Local Network',
    position: 'bottom'
  },
  {
    selector: '#wlanConfig:not(.selectClass2Menu)',
    text: 'Chọn WLAN',
    position: 'right'
  },
  {
    selector: '#wlanBasic:not(.selectClass3Menu)',
    text: 'Chọn WLAN Basic',
    position: 'right'
  },
  {
    selector: '#WLANSSIDConfBar[aria-expanded="false"], #WLANSSIDConf:not(:has(#WLANSSIDConf_container:visible)) #WLANSSIDConfBar',
    text: 'Mở WLAN SSID Configuration',
    position: 'top'
  },
  {
    selector: 'label[for="Enable1:1"], #Enable1\\:1, input[id="Enable1:1"]',
    text: 'Bước 1: Chọn On để kích hoạt SSID2',
    position: 'top',
    expected: '1'
  },
  {
    selector: '#template_WLANSSIDConf_1 .instName:not(.instNameExp), [id="instName_WLANSSIDConf:1"]:not(.instNameExp)',
    text: 'Bước 2: Click mở cấu hình SSID2 (2.4GHz)',
    position: 'top'
  },
  {
    selector: '[id="ESSID:1"]:not(:disabled), input[id="ESSID:1"]:not(:disabled)',
    text: 'Bước 3: Nhập SSID Name: FPT Telecom-IoT',
    position: 'right',
    expected: 'FPT Telecom-IoT'
  },
  {
    selector: 'label[for="ESSIDHideEnable1:1"], input[id="ESSIDHideEnable1:1"]',
    text: 'Bước 4: Chọn Off của phần SSID Hide (tắt ẩn mạng)',
    position: 'right'
  },
  {
    selector: '[id="EncryptionType:1"]:not(:disabled), select[id="EncryptionType:1"]:not(:disabled)',
    text: 'Bước 5: Chọn Encryption Type: WPA2-PSK-AES',
    position: 'right'
  },
  {
    selector: '[id="KeyPassphrase:1"]:not(:disabled), input[id="KeyPassphrase:1"]:not(:disabled)',
    text: 'Bước 6: Nhập WPA Passphrase: 19006600',
    position: 'right',
    expected: '19006600'
  },
  {
    selector: '[id="Btn_apply_WLANSSIDConf:1"]:not(.disableBtn)',
    text: 'Bước 7: Nhấn Apply để lưu cấu hình',
    position: 'top'
  }
];
