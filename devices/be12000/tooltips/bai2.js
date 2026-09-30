/**
 * devices/be12000/tooltips/bai2.js
 * Tooltips cho Bài 2: Cấu hình Wi-Fi (WLAN Basic) trên ONT BE12000
 */

if (!window.TOOLTIPS_BE12000) window.TOOLTIPS_BE12000 = {};

window.TOOLTIPS_BE12000['LAB_BE12000_02'] = [
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
    selector: '#template_WLANSSIDConf_0 .instName:not(.instNameExp), [id="instName_WLANSSIDConf:0"]:not(.instNameExp)',
    text: 'Mở cấu hình SSID1 (2.4GHz)',
    position: 'top'
  },
  {
    selector: '[id="ESSID:0"]:not(:disabled), input[id="ESSID:0"]:not(:disabled)',
    text: 'Bước 1: Nhập SSID Name: FPT Telecom',
    position: 'right',
    expected: 'FPT Telecom'
  },
  {
    selector: '[id="EncryptionType:0"]:not(:disabled), select[id="EncryptionType:0"]:not(:disabled)',
    text: 'Bước 2: Chọn WPA2-PSK-AES hoặc WPA3',
    position: 'right'
  },
  {
    selector: '[id="KeyPassphrase:0"]:not(:disabled), input[id="KeyPassphrase:0"]:not(:disabled)',
    text: 'Bước 3: Nhập WPA Passphrase: 19006600',
    position: 'right',
    expected: '19006600'
  },
  {
    selector: '[id="Btn_apply_WLANSSIDConf:0"]:not(.disableBtn)',
    text: 'Bước 4: Nhấn Apply để lưu cấu hình Wi-Fi',
    position: 'top'
  }
];
