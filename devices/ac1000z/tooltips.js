/** Hướng dẫn thao tác cho sáu bài AC1000Z (ZTE ZXHN F671Y). */
(function () {
  'use strict';

  const store = window.TOOLTIPS_AC1000Z = window.TOOLTIPS_AC1000Z || {};

  function val(doc, sel) {
    const el = doc && doc.querySelector ? doc.querySelector(sel) : null;
    return (el && el.value ? el.value : '').trim();
  }

  function isVisible(doc, sel) {
    const el = doc && doc.querySelector ? doc.querySelector(sel) : null;
    if (!el || !el.isConnected) return false;

    const view = doc.defaultView;
    let current = el;
    while (current && current.nodeType === 1) {
      const style = view && view.getComputedStyle ? view.getComputedStyle(current) : null;
      if (style && (style.display === 'none' || style.visibility === 'hidden' || style.visibility === 'collapse')) {
        return false;
      }
      current = current.parentElement;
    }

    if (typeof el.getClientRects === 'function' && el.getClientRects().length === 0) return false;
    if (typeof el.getBoundingClientRect === 'function') {
      const rect = el.getBoundingClientRect();
      return rect.width > 0 && rect.height > 0;
    }
    return el.offsetParent !== null;
  }

  function step(selector, text, position = 'right', condition = null) {
    return { selector, text, position, condition };
  }

  function visibleAndUnsaved(selector) {
    return function (doc) {
      return isVisible(doc, selector) && !doc._ftcIsSaved;
    };
  }

  // Đăng nhập là thao tác chuẩn bị, không tính vào số bước của bài lab.
  store._common_login = [
    step('#Frm_Username', 'Đăng nhập: Nhập tên đăng nhập admin', 'right', function (doc) {
      return val(doc, '#Frm_Username') !== 'admin';
    }),
    step('#Frm_Password', 'Đăng nhập: Nhập mật khẩu admin', 'right', function (doc) {
      return val(doc, '#Frm_Username') === 'admin' && val(doc, '#Frm_Password') !== 'admin';
    }),
    step('#LoginId', 'Đăng nhập: Chọn Login', 'bottom', function (doc) {
      return val(doc, '#Frm_Username') === 'admin' && val(doc, '#Frm_Password') === 'admin';
    })
  ];

  // Bài 1: Cấu hình WAN PPPoE
  store.LAB_AC1000Z_01 = [
    step('#internet', 'Bước 1: Chọn Internet', 'bottom', function (doc) {
      return !isVisible(doc, '#internetConfig') && !isVisible(doc, '#ethWanConfig') && !isVisible(doc, '[id="instName_Internet:0"]');
    }),
    step('#internetConfig', 'Bước 2: Chọn WAN', 'right', function (doc) {
      return isVisible(doc, '#internetConfig') && !isVisible(doc, '#ethWanConfig') && !isVisible(doc, '[id="instName_Internet:0"]');
    }),
    step('[id="instName_Internet:0"]', 'Bước 3: Mở cấu hình internet_tr069', 'right', function (doc) {
      return isVisible(doc, '[id="instName_Internet:0"]') && !isVisible(doc, '[id="UserName:0"]');
    }),
    step('[id="UserName:0"]', 'Bước 4: Nhập Username: sgfdl-123456-789', 'right', visibleAndUnsaved('[id="UserName:0"]')),
    step('[id="Password:0"]', 'Bước 5: Nhập Password: fpt12345', 'right', visibleAndUnsaved('[id="Password:0"]')),
    step('[id="Btn_apply_internet:0"]', 'Bước 6: Chọn Apply', 'top', visibleAndUnsaved('[id="Btn_apply_internet:0"]'))
  ];

  // Bài 2: Cấu hình Wi-Fi 2.4 GHz
  store.LAB_AC1000Z_02 = [
    step('#localnet', 'Bước 1: Chọn Local Network', 'bottom', function (doc) {
      return !isVisible(doc, '#wlanConfig') && !isVisible(doc, '#wlanBasic') && !isVisible(doc, '#WLANSSIDConfBar');
    }),
    step('#wlanConfig', 'Bước 2: Chọn WLAN', 'right', function (doc) {
      return isVisible(doc, '#wlanConfig') && !isVisible(doc, '#wlanBasic') && !isVisible(doc, '#WLANSSIDConfBar');
    }),
    step('#WLANSSIDConfBar', 'Bước 3: Mở WLAN SSID Configuration', 'right', function (doc) {
      return isVisible(doc, '#WLANSSIDConfBar') && !isVisible(doc, '[id="instName_WLANSSIDConf:0"]');
    }),
    step('[id="instName_WLANSSIDConf:0"]', 'Bước 4: Mở SSID1 băng tần 2.4 GHz', 'right', function (doc) {
      return isVisible(doc, '[id="instName_WLANSSIDConf:0"]') && !isVisible(doc, '[id="ESSID:0"]');
    }),
    step('[id="ESSID:0"]', 'Bước 5: Nhập SSID Name: FPT Telecom', 'right', visibleAndUnsaved('[id="ESSID:0"]')),
    step('[id="KeyPassphrase:0"], [id="HiddenKeyPass:0"]', 'Bước 6: Nhập WPA Passphrase: Fptwifi123', 'right', function (doc) {
      return (visibleAndUnsaved('[id="KeyPassphrase:0"]')(doc) || visibleAndUnsaved('[id="HiddenKeyPass:0"]')(doc));
    }),
    step('[id="Btn_apply_WLANSSIDConf:0"]', 'Bước 7: Chọn Apply', 'top', visibleAndUnsaved('[id="Btn_apply_WLANSSIDConf:0"]'))
  ];

  // Bài 3: Cấu hình Wi-Fi IoT
  store.LAB_AC1000Z_03 = [
    step('#localnet', 'Bước 1: Chọn Local Network', 'bottom', function (doc) {
      return !isVisible(doc, '#wlanConfig') && !isVisible(doc, '#wlanBasic') && !isVisible(doc, '#WLANSSIDConfBar');
    }),
    step('#wlanConfig', 'Bước 2: Chọn WLAN', 'right', function (doc) {
      return isVisible(doc, '#wlanConfig') && !isVisible(doc, '#wlanBasic') && !isVisible(doc, '#WLANSSIDConfBar');
    }),
    step('#WLANSSIDConfBar', 'Bước 3: Mở WLAN SSID Configuration', 'right', function (doc) {
      return isVisible(doc, '#WLANSSIDConfBar') && !isVisible(doc, '[id="instName_WLANSSIDConf:3"]');
    }),
    step('[id="instName_WLANSSIDConf:3"]', 'Bước 4: Mở SSID4 băng tần 2.4 GHz (IoT)', 'right', function (doc) {
      return isVisible(doc, '[id="instName_WLANSSIDConf:3"]') && !isVisible(doc, '[id="ESSID:3"]');
    }),
    step('[id="ESSID:3"]', 'Bước 5: Nhập SSID Name: FPT IoT', 'right', visibleAndUnsaved('[id="ESSID:3"]')),
    step('[id="EncryptionType:3"]', 'Bước 6: Chọn WPA2-PSK-AES', 'right', visibleAndUnsaved('[id="EncryptionType:3"]')),
    step('[id="KeyPassphrase:3"], [id="HiddenKeyPass:3"]', 'Bước 7: Nhập WPA Passphrase: Fptiot123', 'right', function (doc) {
      return (visibleAndUnsaved('[id="KeyPassphrase:3"]')(doc) || visibleAndUnsaved('[id="HiddenKeyPass:3"]')(doc));
    }),
    step('[id="Btn_apply_WLANSSIDConf:3"]', 'Bước 8: Chọn Apply', 'top', visibleAndUnsaved('[id="Btn_apply_WLANSSIDConf:3"]'))
  ];

  // Bài 4: Cấu hình DNS
  store.LAB_AC1000Z_04 = [
    step('#localnet', 'Bước 1: Chọn Local Network', 'bottom', function (doc) {
      return !isVisible(doc, '#lanConfig') && !isVisible(doc, '#lanMgrIpv4') && !isVisible(doc, '#DHCPBasicCfgBar');
    }),
    step('#lanConfig', 'Bước 2: Chọn LAN', 'right', function (doc) {
      return isVisible(doc, '#lanConfig') && !isVisible(doc, '#lanMgrIpv4') && !isVisible(doc, '#DHCPBasicCfgBar');
    }),
    step('#DHCPBasicCfgBar', 'Bước 3: Mở DHCP Server', 'right', function (doc) {
      return isVisible(doc, '#DHCPBasicCfgBar') && !isVisible(doc, '#sub_DNSServer10');
    }),
    step('#sub_DNSServer10', 'Bước 4: Nhập Primary DNS: 8.8.8.8', 'right', visibleAndUnsaved('#sub_DNSServer10')),
    step('#sub_DNSServer20', 'Bước 5: Nhập Secondary DNS: 8.8.4.4', 'right', visibleAndUnsaved('#sub_DNSServer20')),
    step('#Btn_apply_DHCPBasicCfg', 'Bước 6: Chọn Apply để lưu cấu hình', 'top', visibleAndUnsaved('#Btn_apply_DHCPBasicCfg'))
  ];

  // Bài 5: Cấu hình DHCP
  store.LAB_AC1000Z_05 = [
    step('#localnet', 'Bước 1: Chọn Local Network', 'bottom', function (doc) {
      return !isVisible(doc, '#lanConfig') && !isVisible(doc, '#lanMgrIpv4') && !isVisible(doc, '#DHCPBasicCfgBar');
    }),
    step('#lanConfig', 'Bước 2: Chọn LAN', 'right', function (doc) {
      return isVisible(doc, '#lanConfig') && !isVisible(doc, '#lanMgrIpv4') && !isVisible(doc, '#DHCPBasicCfgBar');
    }),
    step('#DHCPBasicCfgBar', 'Bước 3: Mở DHCP Server', 'right', function (doc) {
      return isVisible(doc, '#DHCPBasicCfgBar') && !isVisible(doc, '[id="sub_IPAddr0:DHCPBasicCfg"]');
    }),
    step('[id="sub_IPAddr0:DHCPBasicCfg"]', 'Bước 4: Nhập LAN IP: 192.168.10.1', 'right', visibleAndUnsaved('[id="sub_IPAddr0:DHCPBasicCfg"]')),
    step('#sub_SubMask0', 'Bước 5: Nhập Subnet Mask: 255.255.255.0', 'right', visibleAndUnsaved('#sub_SubMask0')),
    step('[id="sub_MinAddress0:DHCPBasicCfg"]', 'Bước 6: Nhập Start IP: 192.168.10.2', 'right', visibleAndUnsaved('[id="sub_MinAddress0:DHCPBasicCfg"]')),
    step('[id="sub_MaxAddress0:DHCPBasicCfg"]', 'Bước 7: Nhập End IP: 192.168.10.254', 'right', visibleAndUnsaved('[id="sub_MaxAddress0:DHCPBasicCfg"]')),
    step('#Btn_apply_DHCPBasicCfg', 'Bước 8: Chọn Apply', 'top', visibleAndUnsaved('#Btn_apply_DHCPBasicCfg'))
  ];

  // Bài 6: Cấu hình Port Forwarding
  store.LAB_AC1000Z_06 = [
    step('#internet', 'Bước 1: Chọn Internet', 'bottom', function (doc) {
      return !isVisible(doc, '#security') && !isVisible(doc, '#portForwarding') && !isVisible(doc, '#addInstBar_PortForwarding');
    }),
    step('#security', 'Bước 2: Chọn Security', 'right', function (doc) {
      return isVisible(doc, '#security') && !isVisible(doc, '#portForwarding') && !isVisible(doc, '#addInstBar_PortForwarding');
    }),
    step('#portForwarding', 'Bước 3: Chọn Port Forwarding', 'right', function (doc) {
      return isVisible(doc, '#portForwarding') && !isVisible(doc, '#addInstBar_PortForwarding');
    }),
    step('[id^="Alias"]', 'Bước 4: Nhập Name: FPT Telecom', 'right', visibleAndUnsaved('[id^="Alias"]')),
    step('[id^="Protocol"]', 'Bước 5: Chọn Protocol: TCP And UDP', 'right', visibleAndUnsaved('[id^="Protocol"]')),
    step('[id^="S_Interface"]', 'Bước 6: Chọn WAN: internet_tr069', 'right', visibleAndUnsaved('[id^="S_Interface"]')),
    step('[id^="InternalClient"]', 'Bước 7: Nhập LAN Host: 192.168.1.254', 'right', visibleAndUnsaved('[id^="InternalClient"]')),
    step('[id^="ExternalPort"]:not([id*="EndRange"])', 'Bước 8: Port đầu: 8080', 'right', visibleAndUnsaved('[id^="ExternalPort"]:not([id*="EndRange"])')),
    step('[id^="ExternalPortEndRange"]', 'Bước 9: Port cuối: 8080', 'right', visibleAndUnsaved('[id^="ExternalPortEndRange"]')),
    step('[id^="InternalPort"]:not([id*="EndRange"])', 'Bước 10: Port đầu: 8080', 'right', visibleAndUnsaved('[id^="InternalPort"]:not([id*="EndRange"])')),
    step('[id^="InternalPortEndRange"]', 'Bước 11: Port cuối: 8080', 'right', visibleAndUnsaved('[id^="InternalPortEndRange"]')),
    step('[id^="Btn_apply_PortForwarding"]', 'Bước 12: Chọn Apply', 'top', visibleAndUnsaved('[id^="Btn_apply_PortForwarding"]'))
  ];
})();
