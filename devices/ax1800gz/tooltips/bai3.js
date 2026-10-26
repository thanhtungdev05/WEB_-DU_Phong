/**
 * devices/ax1800gz/tooltips/bai3.js
 * Tooltips cho Bài 3: Cấu hình Wi-Fi IoT trên ONT AX1800GZ
 */

if (!window.TOOLTIPS_AX1800GZ) window.TOOLTIPS_AX1800GZ = {};

window.TOOLTIPS_AX1800GZ['LAB_AX1800GZ_03'] = [
  {
    selector: '#localnet:not(.SelectMenuItem)',
    text: 'Bước 1: Chọn Local Network',
    position: 'bottom'
  },
  {
    selector: '#wlanConfig:not(.selectClass2Menu)',
    text: 'Bước 2: Chọn WLAN',
    position: 'right'
  },
  {
    selector: '#wlanBasic:not(.selectClass3Menu)',
    text: 'Bước 3: Chọn WLAN Basic',
    position: 'right'
  },
  {
    selector: '#WLANSSIDConfBar[aria-expanded="false"], #WLANSSIDConf:not(:has(#WLANSSIDConf_container:visible)) #WLANSSIDConfBar',
    text: 'Bước 4: Mở WLAN SSID Configuration',
    position: 'top'
  },
  {
    selector: 'label[for="Enable1:1"], #Enable1\\:1, input[id="Enable1:1"]',
    text: 'Bước 5: Chọn On để kích hoạt SSID2',
    position: 'top',
    expected: '1'
  },
  {
    selector: '#template_WLANSSIDConf_1 .instName:not(.instNameExp), [id="instName_WLANSSIDConf:1"]:not(.instNameExp)',
    text: 'Bước 6: Click mở cấu hình SSID2 (2.4GHz)',
    position: 'top'
  },
  {
    selector: '[id="ESSID:1"]:not(:disabled), input[id="ESSID:1"]:not(:disabled)',
    text: 'Bước 7: Nhập SSID Name: FPT Telecom-IoT',
    position: 'right',
    expected: 'FPT Telecom-IoT'
  },
  {
    selector: 'label[for="ESSIDHideEnable1:1"], input[id="ESSIDHideEnable1:1"]',
    text: 'Bước 8: Chọn Off của phần SSID Hide (tắt ẩn mạng)',
    position: 'right',
    expected: '0'
  },
  {
    selector: '[id="EncryptionType:1"]:not(:disabled), select[id="EncryptionType:1"]:not(:disabled)',
    text: 'Bước 9: Chọn Encryption Type: WPA2-PSK-AES',
    position: 'right'
  },
  {
    selector: '[id="KeyPassphrase:1"]:not(:disabled), input[id="KeyPassphrase:1"]:not(:disabled)',
    text: 'Bước 10: Nhập WPA Passphrase: 19006600',
    position: 'right',
    expected: '19006600'
  },
  {
    selector: '[id="Btn_apply_WLANSSIDConf:1"]:not(.disableBtn)',
    text: 'Bước 11: Nhấn Apply để lưu cấu hình',
    position: 'top'
  }
];
