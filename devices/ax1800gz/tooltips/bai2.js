/**
 * devices/ax1800gz/tooltips/bai2.js
 * Tooltips cho Bài 2: Cấu hình Wi-Fi (WLAN Basic) trên ONT AX1800GZ
 */

if (!window.TOOLTIPS_AX1800GZ) window.TOOLTIPS_AX1800GZ = {};

window.TOOLTIPS_AX1800GZ['LAB_AX1800GZ_02'] = [
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
    selector: '#WLANSSIDConfBar:not(.collapsibleBarExp), #WLANSSIDConfBar[aria-expanded="false"]',
    text: 'Bước 4: Mở WLAN SSID Configuration',
    position: 'top'
  },
  {
    selector: '#template_WLANSSIDConf_0 .instName:not(.instNameExp), [id="instName_WLANSSIDConf:0"]:not(.instNameExp)',
    text: 'Bước 5: Mở cấu hình SSID1',
    position: 'top'
  },
  {
    selector: '[id="ESSID:0"]:not(:disabled), input[id="ESSID:0"]:not(:disabled)',
    text: 'Bước 6: Nhập SSID Name: FPT Telecom',
    position: 'right',
    expected: 'FPT Telecom',
    condition: function (doc) {
      const el = doc.querySelector('[id="ESSID:0"]:not(:disabled), input[id="ESSID:0"]:not(:disabled)');
      return !el || el.value.trim() !== 'FPT Telecom';
    }
  },
  {
    selector: '[id="EncryptionType:0"]:not(:disabled), select[id="EncryptionType:0"]:not(:disabled)',
    text: 'Bước 7: Chọn Encryption Type: WPA2-PSK(TKIP/AES)/WPA3(SAE)',
    position: 'right',
    expected: 'WPA2/WPA3-SAE',
    condition: function (doc) {
      const ssid = doc.querySelector('[id="ESSID:0"]:not(:disabled), input[id="ESSID:0"]:not(:disabled)');
      const enc = doc.querySelector('[id="EncryptionType:0"]:not(:disabled), select[id="EncryptionType:0"]:not(:disabled)');
      return (ssid && ssid.value.trim() === 'FPT Telecom') &&
             (!enc || (enc.value !== 'WPA2/WPA3-SAE' && enc.value !== 'WPA2-PSK(TKIP/AES)/WPA3(SAE)'));
    }
  },
  {
    selector: '[id="KeyPassphrase:0"]:not(:disabled), input[id="KeyPassphrase:0"]:not(:disabled)',
    text: 'Bước 8: Nhập WPA Passphrase: 19006600',
    position: 'right',
    expected: '19006600',
    condition: function (doc) {
      const ssid = doc.querySelector('[id="ESSID:0"]:not(:disabled), input[id="ESSID:0"]:not(:disabled)');
      const enc = doc.querySelector('[id="EncryptionType:0"]:not(:disabled), select[id="EncryptionType:0"]:not(:disabled)');
      const pass = doc.querySelector('[id="KeyPassphrase:0"]:not(:disabled), input[id="KeyPassphrase:0"]:not(:disabled)');
      const isEncMatch = enc && (enc.value === 'WPA2/WPA3-SAE' || enc.value === 'WPA2-PSK(TKIP/AES)/WPA3(SAE)');
      return (ssid && ssid.value.trim() === 'FPT Telecom') && isEncMatch && (!pass || pass.value.trim() !== '19006600');
    }
  },
  {
    selector: '[id="Btn_apply_WLANSSIDConf:0"]:not(.disableBtn)',
    text: 'Bước 9: Nhấn Apply để lưu cấu hình Wi-Fi',
    position: 'top',
    condition: function (doc) {
      const ssid = doc.querySelector('[id="ESSID:0"]:not(:disabled), input[id="ESSID:0"]:not(:disabled)');
      const enc = doc.querySelector('[id="EncryptionType:0"]:not(:disabled), select[id="EncryptionType:0"]:not(:disabled)');
      const pass = doc.querySelector('[id="KeyPassphrase:0"]:not(:disabled), input[id="KeyPassphrase:0"]:not(:disabled)');
      const isEncMatch = enc && (enc.value === 'WPA2/WPA3-SAE' || enc.value === 'WPA2-PSK(TKIP/AES)/WPA3(SAE)');
      return !!(ssid && ssid.value.trim() === 'FPT Telecom' && isEncMatch && pass && pass.value.trim() === '19006600');
    }
  }
];
