/** Hướng dẫn từng bước tuần tự cho sáu bài AX3000GZ V2 (ZTE F6201B). */
(function () {
  'use strict';

  const store = window.TOOLTIPS_AX3000GZ_V2 = window.TOOLTIPS_AX3000GZ_V2 || {};

  function val(doc, sel) {
    const el = doc && doc.querySelector ? doc.querySelector(sel) : null;
    return (el && el.value ? el.value : '').trim();
  }

  function isVisible(doc, sel) {
    const el = doc && doc.querySelector ? doc.querySelector(sel) : null;
    if (!el) return false;
    if (el.offsetParent !== null) return true;
    const style = doc.defaultView && doc.defaultView.getComputedStyle ? doc.defaultView.getComputedStyle(el) : null;
    return Boolean(style && style.display !== 'none' && style.visibility !== 'hidden');
  }

  function step(selector, text, position = 'right', condition = null) {
    return { selector, text, position, condition };
  }

  // ── Màn hình Đăng Nhập ──
  store._common_login = [
    step('#Frm_Username', 'Bước 1: Nhập tên đăng nhập: admin', 'right', function (doc) {
      return val(doc, '#Frm_Username') !== 'admin';
    }),
    step('#Frm_Password', 'Bước 2: Nhập mật khẩu: admin', 'right', function (doc) {
      return val(doc, '#Frm_Username') === 'admin' && val(doc, '#Frm_Password') !== 'admin';
    }),
    step('#LoginId', 'Bước 3: Chọn Login để đăng nhập', 'bottom', function (doc) {
      return val(doc, '#Frm_Username') === 'admin' && val(doc, '#Frm_Password') === 'admin';
    })
  ];

  // ── Bài 1: Cấu hình WAN PPPoE ──
  store.LAB_AX3000GZ_V2_01 = [
    step('#internet', 'Bước 1: Chọn Internet', 'bottom', function (doc) {
      return !isVisible(doc, '#internetConfig') && !isVisible(doc, '#ethWanConfig') && !isVisible(doc, '[id^="instName_Internet"]');
    }),
    step('#internetConfig', 'Bước 2: Chọn WAN', 'right', function (doc) {
      return isVisible(doc, '#internetConfig') && !isVisible(doc, '#ethWanConfig') && !isVisible(doc, '[id^="instName_Internet"]');
    }),
    step('#ethWanConfig', 'Bước 3: Chọn WAN', 'right', function (doc) {
      return isVisible(doc, '#ethWanConfig') && !isVisible(doc, '[id^="instName_Internet"]');
    }),
    step('[id^="instName_Internet"]', 'Bước 4: Mở cấu hình internet_tr069', 'right', function (doc) {
      return isVisible(doc, '[id^="instName_Internet"]') && !isVisible(doc, '[id^="UserName"]');
    }),
    step('[id^="UserName"]', 'Bước 5: Nhập Username: sgfdl-123456-789', 'right', function (doc) {
      return isVisible(doc, '[id^="UserName"]') && val(doc, '[id^="UserName"]') !== 'sgfdl-123456-789' && !doc._ftcIsSaved;
    }),
    step('[id^="Password"]', 'Bước 6: Nhập Password: fpt12345', 'right', function (doc) {
      return isVisible(doc, '[id^="Password"]') && val(doc, '[id^="UserName"]') === 'sgfdl-123456-789' && val(doc, '[id^="Password"]') !== 'fpt12345' && !doc._ftcIsSaved;
    }),
    step('[id^="Btn_apply_internet"]', 'Bước 7: Chọn Apply', 'top', function (doc) {
      return val(doc, '[id^="UserName"]') === 'sgfdl-123456-789' && val(doc, '[id^="Password"]') === 'fpt12345' && !doc._ftcIsSaved;
    })
  ];

  // ── Bài 2: Cấu hình Wi-Fi 2.4 GHz ──
  store.LAB_AX3000GZ_V2_02 = [
    step('#localnet', 'Bước 1: Chọn Local Network', 'bottom', function (doc) {
      return !isVisible(doc, '#wlanConfig') && !isVisible(doc, '#wlanBasic') && !isVisible(doc, '#WLANSSIDConfBar');
    }),
    step('#wlanConfig', 'Bước 2: Chọn WLAN', 'right', function (doc) {
      return isVisible(doc, '#wlanConfig') && !isVisible(doc, '#wlanBasic') && !isVisible(doc, '#WLANSSIDConfBar');
    }),
    step('#wlanBasic', 'Bước 3: Chọn WLAN Basic', 'right', function (doc) {
      return isVisible(doc, '#wlanBasic') && !isVisible(doc, '#WLANSSIDConfBar');
    }),
    step('#WLANSSIDConfBar', 'Bước 4: Mở WLAN SSID Configuration', 'right', function (doc) {
      return isVisible(doc, '#WLANSSIDConfBar') && !isVisible(doc, '[id="instName_WLANSSIDConf:0"]');
    }),
    step('[id="instName_WLANSSIDConf:0"]', 'Bước 5: Mở SSID1 băng tần 2.4 GHz', 'right', function (doc) {
      return isVisible(doc, '[id="instName_WLANSSIDConf:0"]') && !isVisible(doc, '[id="ESSID:0"]');
    }),
    step('[id="ESSID:0"]', 'Bước 6: Nhập SSID Name: FPT Telecom', 'right', function (doc) {
      return isVisible(doc, '[id="ESSID:0"]') && val(doc, '[id="ESSID:0"]') !== 'FPT Telecom' && !doc._ftcIsSaved;
    }),
    step('[id="EncryptionType:0"]', 'Bước 7: Chọn WPA2-PSK-AES', 'right', function (doc) {
      return val(doc, '[id="ESSID:0"]') === 'FPT Telecom' && val(doc, '[id="EncryptionType:0"]') !== 'WPA2-PSK-AES' && !doc._ftcIsSaved;
    }),
    step('[id="HiddenKeyPass:0"]', 'Bước 8: Nhập WPA Passphrase: Fptwifi123', 'right', function (doc) {
      return val(doc, '[id="ESSID:0"]') === 'FPT Telecom' && val(doc, '[id="EncryptionType:0"]') === 'WPA2-PSK-AES' && val(doc, '[id="HiddenKeyPass:0"]') !== 'Fptwifi123' && !doc._ftcIsSaved;
    }),
    step('[id="Btn_apply_WLANSSIDConf:0"]', 'Bước 9: Chọn Apply', 'top', function (doc) {
      return val(doc, '[id="ESSID:0"]') === 'FPT Telecom' && val(doc, '[id="EncryptionType:0"]') === 'WPA2-PSK-AES' && val(doc, '[id="HiddenKeyPass:0"]') === 'Fptwifi123' && !doc._ftcIsSaved;
    })
  ];

  // ── Bài 3: Cấu hình Wi-Fi IoT ──
  store.LAB_AX3000GZ_V2_03 = [
    step('#localnet', 'Bước 1: Chọn Local Network', 'bottom', function (doc) {
      return !isVisible(doc, '#wlanConfig') && !isVisible(doc, '#wlanBasic') && !isVisible(doc, '#WLANSSIDConfBar');
    }),
    step('#wlanConfig', 'Bước 2: Chọn WLAN', 'right', function (doc) {
      return isVisible(doc, '#wlanConfig') && !isVisible(doc, '#wlanBasic') && !isVisible(doc, '#WLANSSIDConfBar');
    }),
    step('#wlanBasic', 'Bước 3: Chọn WLAN Basic', 'right', function (doc) {
      return isVisible(doc, '#wlanBasic') && !isVisible(doc, '#WLANSSIDConfBar');
    }),
    step('#WLANSSIDConfBar', 'Bước 4: Mở WLAN SSID Configuration', 'right', function (doc) {
      return isVisible(doc, '#WLANSSIDConfBar') && !isVisible(doc, '[id="instName_WLANSSIDConf:3"]');
    }),
    step('[id="instName_WLANSSIDConf:3"]', 'Bước 5: Mở SSID4 băng tần 2.4 GHz (IoT)', 'right', function (doc) {
      return isVisible(doc, '[id="instName_WLANSSIDConf:3"]') && !isVisible(doc, '[id="ESSID:3"]');
    }),
    step('[id="ESSID:3"]', 'Bước 6: Nhập SSID Name: FPT IoT', 'right', function (doc) {
      return isVisible(doc, '[id="ESSID:3"]') && val(doc, '[id="ESSID:3"]') !== 'FPT IoT' && !doc._ftcIsSaved;
    }),
    step('[id="EncryptionType:3"]', 'Bước 7: Chọn WPA2-PSK-AES', 'right', function (doc) {
      return val(doc, '[id="ESSID:3"]') === 'FPT IoT' && val(doc, '[id="EncryptionType:3"]') !== 'WPA2-PSK-AES' && !doc._ftcIsSaved;
    }),
    step('[id="HiddenKeyPass:3"]', 'Bước 8: Nhập WPA Passphrase: Fptiot123', 'right', function (doc) {
      return val(doc, '[id="ESSID:3"]') === 'FPT IoT' && val(doc, '[id="EncryptionType:3"]') === 'WPA2-PSK-AES' && val(doc, '[id="HiddenKeyPass:3"]') !== 'Fptiot123' && !doc._ftcIsSaved;
    }),
    step('[id="Btn_apply_WLANSSIDConf:3"]', 'Bước 9: Chọn Apply', 'top', function (doc) {
      return val(doc, '[id="ESSID:3"]') === 'FPT IoT' && val(doc, '[id="EncryptionType:3"]') === 'WPA2-PSK-AES' && val(doc, '[id="HiddenKeyPass:3"]') === 'Fptiot123' && !doc._ftcIsSaved;
    })
  ];

  // ── Bài 4: Cấu hình DNS ──
  store.LAB_AX3000GZ_V2_04 = [
    step('#localnet', 'Bước 1: Chọn Local Network', 'bottom', function (doc) {
      return !isVisible(doc, '#dns') && !isVisible(doc, '#LocalDnsServerBar');
    }),
    step('#dns', 'Bước 2: Chọn DNS', 'right', function (doc) {
      return isVisible(doc, '#dns') && !isVisible(doc, '#LocalDnsServerBar');
    }),
    step('#LocalDnsServerBar', 'Bước 3: Mở Local DNS Server', 'right', function (doc) {
      return isVisible(doc, '#LocalDnsServerBar') && !isVisible(doc, '#sub_SerIPAddress10');
    }),
    step('#sub_SerIPAddress10', 'Bước 4: Nhập DNS Server 1: 8.8.8.8', 'right', function (doc) {
      const dns1Done = val(doc, '#sub_SerIPAddress10') === '8' && val(doc, '#sub_SerIPAddress11') === '8' && val(doc, '#sub_SerIPAddress12') === '8' && val(doc, '#sub_SerIPAddress13') === '8';
      return isVisible(doc, '#sub_SerIPAddress10') && !dns1Done && !doc._ftcIsSaved;
    }),
    step('#sub_SerIPAddress20', 'Bước 5: Nhập DNS Server 2: 8.8.4.4', 'right', function (doc) {
      const dns1Done = val(doc, '#sub_SerIPAddress10') === '8' && val(doc, '#sub_SerIPAddress11') === '8' && val(doc, '#sub_SerIPAddress12') === '8' && val(doc, '#sub_SerIPAddress13') === '8';
      const dns2Done = val(doc, '#sub_SerIPAddress20') === '8' && val(doc, '#sub_SerIPAddress21') === '8' && val(doc, '#sub_SerIPAddress22') === '4' && val(doc, '#sub_SerIPAddress23') === '4';
      return dns1Done && !dns2Done && !doc._ftcIsSaved;
    }),
    step('#Btn_apply_LocalDnsServer', 'Bước 6: Chọn Apply', 'top', function (doc) {
      const dns1Done = val(doc, '#sub_SerIPAddress10') === '8' && val(doc, '#sub_SerIPAddress11') === '8' && val(doc, '#sub_SerIPAddress12') === '8' && val(doc, '#sub_SerIPAddress13') === '8';
      const dns2Done = val(doc, '#sub_SerIPAddress20') === '8' && val(doc, '#sub_SerIPAddress21') === '8' && val(doc, '#sub_SerIPAddress22') === '4' && val(doc, '#sub_SerIPAddress23') === '4';
      return dns1Done && dns2Done && !doc._ftcIsSaved;
    })
  ];

  // ── Bài 5: Cấu hình DHCP ──
  store.LAB_AX3000GZ_V2_05 = [
    step('#localnet', 'Bước 1: Chọn Local Network', 'bottom', function (doc) {
      return !isVisible(doc, '#lanConfig') && !isVisible(doc, '#lanMgrIpv4') && !isVisible(doc, '#DHCPBasicCfgBar');
    }),
    step('#lanConfig', 'Bước 2: Chọn LAN', 'right', function (doc) {
      return isVisible(doc, '#lanConfig') && !isVisible(doc, '#lanMgrIpv4') && !isVisible(doc, '#DHCPBasicCfgBar');
    }),
    step('#lanMgrIpv4', 'Bước 3: Chọn IPv4', 'right', function (doc) {
      return isVisible(doc, '#lanMgrIpv4') && !isVisible(doc, '#DHCPBasicCfgBar');
    }),
    step('#DHCPBasicCfgBar', 'Bước 4: Mở DHCP Server', 'right', function (doc) {
      return isVisible(doc, '#DHCPBasicCfgBar') && !isVisible(doc, '#ServerEnable1');
    }),
    step('#ServerEnable1', 'Bước 5: Chọn DHCP Server: On', 'right', function (doc) {
      const el = doc.querySelector ? doc.querySelector('#ServerEnable1') : null;
      return isVisible(doc, '#ServerEnable1') && (!el || !el.checked) && !doc._ftcIsSaved;
    }),
    step('[id="sub_IPAddr0:DHCPBasicCfg"]', 'Bước 6: Nhập LAN IP Address: 192.168.10.1', 'right', function (doc) {
      const el = doc.querySelector ? doc.querySelector('#ServerEnable1') : null;
      const onDone = Boolean(el && el.checked);
      const ipDone = val(doc, '[id="sub_IPAddr0:DHCPBasicCfg"]') === '192' && val(doc, '[id="sub_IPAddr1:DHCPBasicCfg"]') === '168' && val(doc, '[id="sub_IPAddr2:DHCPBasicCfg"]') === '10' && val(doc, '[id="sub_IPAddr3:DHCPBasicCfg"]') === '1';
      return onDone && !ipDone && !doc._ftcIsSaved;
    }),
    step('#Btn_apply_DHCPBasicCfg', 'Bước 7: Chọn Apply', 'top', function (doc) {
      const el = doc.querySelector ? doc.querySelector('#ServerEnable1') : null;
      const onDone = Boolean(el && el.checked);
      const ipDone = val(doc, '[id="sub_IPAddr0:DHCPBasicCfg"]') === '192' && val(doc, '[id="sub_IPAddr1:DHCPBasicCfg"]') === '168' && val(doc, '[id="sub_IPAddr2:DHCPBasicCfg"]') === '10' && val(doc, '[id="sub_IPAddr3:DHCPBasicCfg"]') === '1';
      return onDone && ipDone && !doc._ftcIsSaved;
    })
  ];

  // ── Bài 6: Cấu hình Port Forwarding ──
  store.LAB_AX3000GZ_V2_06 = [
    step('#internet', 'Bước 1: Chọn Internet', 'bottom', function (doc) {
      return !isVisible(doc, '#security') && !isVisible(doc, '#portForwarding') && !isVisible(doc, '#addInstBar_PortForwarding');
    }),
    step('#security', 'Bước 2: Chọn Security', 'right', function (doc) {
      return isVisible(doc, '#security') && !isVisible(doc, '#portForwarding') && !isVisible(doc, '#addInstBar_PortForwarding');
    }),
    step('#portForwarding', 'Bước 3: Chọn Port Forwarding', 'right', function (doc) {
      return isVisible(doc, '#portForwarding') && !isVisible(doc, '#addInstBar_PortForwarding');
    }),
    step('#addInstBar_PortForwarding', 'Bước 4: Chọn Create New Item', 'right', function (doc) {
      return isVisible(doc, '#addInstBar_PortForwarding') && !isVisible(doc, '[id^="Alias"]');
    }),
    step('[id^="Alias"]', 'Bước 5: Nhập Name: FPT Telecom', 'right', function (doc) {
      return isVisible(doc, '[id^="Alias"]') && val(doc, '[id^="Alias"]') !== 'FPT Telecom' && !doc._ftcIsSaved;
    }),
    step('[id^="Protocol"]', 'Bước 6: Chọn TCP And UDP', 'right', function (doc) {
      return val(doc, '[id^="Alias"]') === 'FPT Telecom' && val(doc, '[id^="Protocol"]') !== 'BOTH' && !doc._ftcIsSaved;
    }),
    step('[id^="InternalClient"]', 'Bước 7: Nhập LAN Host: 192.168.1.254', 'right', function (doc) {
      return val(doc, '[id^="Alias"]') === 'FPT Telecom' && val(doc, '[id^="Protocol"]') === 'BOTH' && val(doc, '[id^="InternalClient"]') !== '192.168.1.254' && !doc._ftcIsSaved;
    }),
    step('[id^="ExternalPort"]:not([id*="EndRange"])', 'Bước 8: Nhập WAN Port: 8080', 'right', function (doc) {
      return val(doc, '[id^="Alias"]') === 'FPT Telecom' && val(doc, '[id^="Protocol"]') === 'BOTH' && val(doc, '[id^="InternalClient"]') === '192.168.1.254' && val(doc, '[id^="ExternalPort"]:not([id*="EndRange"])') !== '8080' && !doc._ftcIsSaved;
    }),
    step('[id^="InternalPort"]:not([id*="EndRange"])', 'Bước 9: Nhập LAN Host Port: 8080', 'right', function (doc) {
      return val(doc, '[id^="Alias"]') === 'FPT Telecom' && val(doc, '[id^="Protocol"]') === 'BOTH' && val(doc, '[id^="InternalClient"]') === '192.168.1.254' && val(doc, '[id^="ExternalPort"]:not([id*="EndRange"])') === '8080' && val(doc, '[id^="InternalPort"]:not([id*="EndRange"])') !== '8080' && !doc._ftcIsSaved;
    }),
    step('[id^="Btn_apply_PortForwarding"]', 'Bước 10: Chọn Apply', 'top', function (doc) {
      return val(doc, '[id^="Alias"]') === 'FPT Telecom' && val(doc, '[id^="Protocol"]') === 'BOTH' && val(doc, '[id^="InternalClient"]') === '192.168.1.254' && val(doc, '[id^="ExternalPort"]:not([id*="EndRange"])') === '8080' && val(doc, '[id^="InternalPort"]:not([id*="EndRange"])') === '8080' && !doc._ftcIsSaved;
    })
  ];
})();
