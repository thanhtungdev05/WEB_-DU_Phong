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
    selector: 'label[for="Enable1:3"], #Enable1\\:3, input[id="Enable1:3"]',
    text: 'Bước 5: Chọn On để kích hoạt SSID4',
    position: 'top',
    condition: function (doc) {
      var enOn = doc.querySelector('input[name="Enable:3"][value="1"]:checked, #Enable1\\:3:checked');
      return !enOn;
    }
  },
  {
    selector: '#template_WLANSSIDConf_3 .instName:not(.instNameExp), [id="instName_WLANSSIDConf:3"]:not(.instNameExp)',
    text: 'Bước 6: Click mở cấu hình SSID4 (2.4GHz)',
    position: 'top',
    condition: function (doc) {
      var enOn = doc.querySelector('input[name="Enable:3"][value="1"]:checked, #Enable1\\:3:checked');
      if (!enOn) return false;
      var title = doc.querySelector('#template_WLANSSIDConf_3 .instName, [id="instName_WLANSSIDConf:3"]');
      return !title || !title.classList.contains('instNameExp');
    }
  },
  {
    selector: '[id="ESSID:3"]:not(:disabled), input[id="ESSID:3"]:not(:disabled)',
    text: 'Bước 7: Nhập SSID Name: FPT Telecom-IoT',
    position: 'right',
    condition: function (doc) {
      var title = doc.querySelector('#template_WLANSSIDConf_3 .instName, [id="instName_WLANSSIDConf:3"]');
      if (!title || !title.classList.contains('instNameExp')) return false;
      var el = doc.querySelector('[id="ESSID:3"], input[id="ESSID:3"]');
      return !el || el.value.trim() !== 'FPT Telecom-IoT';
    }
  },
  {
    selector: 'label[for="ESSIDHideEnable1:3"], input[id="ESSIDHideEnable1:3"]',
    text: 'Bước 8: Chọn Off của phần SSID Hide (tắt ẩn mạng)',
    position: 'right',
    condition: function (doc) {
      var ssid = doc.querySelector('[id="ESSID:3"], input[id="ESSID:3"]');
      if (!ssid || ssid.value.trim() !== 'FPT Telecom-IoT') return false;
      var hide = doc.querySelector('input[name="ESSIDHideEnable:3"]:checked, #ESSIDHideEnable1\\:3');
      return !hide || (hide.value !== '0' && hide.checked);
    }
  },
  {
    selector: '[id="EncryptionType:3"]:not(:disabled), select[id="EncryptionType:3"]:not(:disabled)',
    text: 'Bước 9: Chọn Encryption Type: WPA2-PSK-AES',
    position: 'right',
    condition: function (doc) {
      var ssid = doc.querySelector('[id="ESSID:3"], input[id="ESSID:3"]');
      if (!ssid || ssid.value.trim() !== 'FPT Telecom-IoT') return false;
      var enc = doc.querySelector('[id="EncryptionType:3"], select[id="EncryptionType:3"]');
      return !enc || enc.value !== 'WPA2-PSK-AES';
    }
  },
  {
    selector: '[id="KeyPassphrase:3"]:not(:disabled), input[id="KeyPassphrase:3"]:not(:disabled)',
    text: 'Bước 10: Nhập WPA Passphrase: 19006600',
    position: 'right',
    condition: function (doc) {
      var ssid = doc.querySelector('[id="ESSID:3"], input[id="ESSID:3"]');
      var enc = doc.querySelector('[id="EncryptionType:3"], select[id="EncryptionType:3"]');
      if (!ssid || ssid.value.trim() !== 'FPT Telecom-IoT') return false;
      if (!enc || enc.value !== 'WPA2-PSK-AES') return false;
      var pass = doc.querySelector('[id="KeyPassphrase:3"], input[id="KeyPassphrase:3"]');
      return !pass || pass.value.trim() !== '19006600';
    }
  },
  {
    selector: '[id="Btn_apply_WLANSSIDConf:3"]:not(.disableBtn)',
    text: 'Bước 11: Nhấn Apply để lưu cấu hình',
    position: 'top',
    condition: function (doc) {
      var ssid = doc.querySelector('[id="ESSID:3"], input[id="ESSID:3"]');
      var enc = doc.querySelector('[id="EncryptionType:3"], select[id="EncryptionType:3"]');
      var pass = doc.querySelector('[id="KeyPassphrase:3"], input[id="KeyPassphrase:3"]');
      var isSaved = Boolean(
        doc._ftcIsSaved ||
        (doc.location && doc.location.search && doc.location.search.includes('save_success=1')) ||
        (window.top && window.top._hasSuccHintStored) ||
        window._hasSuccHintStored
      );
      return !isSaved && !!(ssid && ssid.value.trim() === 'FPT Telecom-IoT' && enc && enc.value === 'WPA2-PSK-AES' && pass && pass.value.trim() === '19006600');
    }
  }
];
