/** Hướng dẫn thao tác cho sáu bài AX3000GZ V2 (ZTE F6201B). */
(function () {
  'use strict';

  const store = window.TOOLTIPS_AX3000GZ_V2 = window.TOOLTIPS_AX3000GZ_V2 || {};

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
  store.LAB_AX3000GZ_V2_01 = [
    step('#internet', 'Bước 1: Chọn Internet', 'bottom', function (doc) {
      return !isVisible(doc, '#internetConfig') && !isVisible(doc, '#ethWanConfig') && !isVisible(doc, '[id="instName_Internet:0"]');
    }),
    step('#internetConfig', 'Bước 2: Chọn WAN', 'right', function (doc) {
      return isVisible(doc, '#internetConfig') && !isVisible(doc, '#ethWanConfig') && !isVisible(doc, '[id="instName_Internet:0"]');
    }),
    // Chọn WAN ở trên đã tải thẳng trang cấu hình; không tính ethWanConfig là thao tác thứ hai.
    step('[id="instName_Internet:0"]', 'Bước 3: Mở cấu hình internet_tr069', 'right', function (doc) {
      return isVisible(doc, '[id="instName_Internet:0"]') && !isVisible(doc, '[id="UserName:0"]');
    }),
    step('[id="UserName:0"]', 'Bước 4: Nhập Username: sgfdl-123456-789', 'right', visibleAndUnsaved('[id="UserName:0"]')),
    step('[id="Password:0"]', 'Bước 5: Nhập Password: fpt12345', 'right', visibleAndUnsaved('[id="Password:0"]')),
    step('[id="Btn_apply_internet:0"]', 'Bước 6: Chọn Apply', 'top', visibleAndUnsaved('[id="Btn_apply_internet:0"]'))
  ];

  // Bài 2: Cấu hình Wi-Fi 2.4 GHz
  store.LAB_AX3000GZ_V2_02 = [
    step('#localnet', 'Bước 1: Chọn Local Network', 'bottom', function (doc) {
      return !isVisible(doc, '#wlanConfig') && !isVisible(doc, '#wlanBasic') && !isVisible(doc, '#WLANSSIDConfBar');
    }),
    step('#wlanConfig', 'Bước 2: Chọn WLAN', 'right', function (doc) {
      return isVisible(doc, '#wlanConfig') && !isVisible(doc, '#wlanBasic') && !isVisible(doc, '#WLANSSIDConfBar');
    }),
    // WLAN tải thẳng WLAN Basic mặc định.
    step('#WLANSSIDConfBar', 'Bước 3: Mở WLAN SSID Configuration', 'right', function (doc) {
      return isVisible(doc, '#WLANSSIDConfBar') && !isVisible(doc, '[id="instName_WLANSSIDConf:0"]');
    }),
    step('[id="instName_WLANSSIDConf:0"]', 'Bước 4: Mở SSID1 băng tần 2.4 GHz', 'right', function (doc) {
      return isVisible(doc, '[id="instName_WLANSSIDConf:0"]') && !isVisible(doc, '[id="ESSID:0"]');
    }),
    step('[id="ESSID:0"]', 'Bước 5: Nhập SSID Name: FPT Telecom', 'right', visibleAndUnsaved('[id="ESSID:0"]')),
    step('[id="HiddenKeyPass:0"]', 'Bước 6: Nhập WPA Passphrase: Fptwifi123', 'right', visibleAndUnsaved('[id="HiddenKeyPass:0"]')),
    step('[id="Btn_apply_WLANSSIDConf:0"]', 'Bước 7: Chọn Apply', 'top', visibleAndUnsaved('[id="Btn_apply_WLANSSIDConf:0"]'))
  ];

  // Bài 3: Cấu hình Wi-Fi IoT
  store.LAB_AX3000GZ_V2_03 = [
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
    step('[id="HiddenKeyPass:3"]', 'Bước 7: Nhập WPA Passphrase: Fptiot123', 'right', visibleAndUnsaved('[id="HiddenKeyPass:3"]')),
    step('[id="Btn_apply_WLANSSIDConf:3"]', 'Bước 8: Chọn Apply', 'top', visibleAndUnsaved('[id="Btn_apply_WLANSSIDConf:3"]'))
  ];

  // Bài 4: Cấu hình DNS
  store.LAB_AX3000GZ_V2_04 = [
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
  store.LAB_AX3000GZ_V2_05 = [
    step('#localnet', 'Bước 1: Chọn Local Network', 'bottom', function (doc) {
      return !isVisible(doc, '#lanConfig') && !isVisible(doc, '#lanMgrIpv4') && !isVisible(doc, '#DHCPBasicCfgBar');
    }),
    step('#lanConfig', 'Bước 2: Chọn LAN', 'right', function (doc) {
      return isVisible(doc, '#lanConfig') && !isVisible(doc, '#lanMgrIpv4') && !isVisible(doc, '#DHCPBasicCfgBar');
    }),
    // LAN tải thẳng trang IPv4 mặc định.
    step('#DHCPBasicCfgBar', 'Bước 3: Mở DHCP Server', 'right', function (doc) {
      return isVisible(doc, '#DHCPBasicCfgBar') && !isVisible(doc, '[id="sub_IPAddr0:DHCPBasicCfg"]');
    }),
    step('[id="sub_IPAddr0:DHCPBasicCfg"]', 'Bước 4: Nhập LAN IP Address: 192.168.10.1', 'right', visibleAndUnsaved('[id="sub_IPAddr0:DHCPBasicCfg"]')),
    step('#sub_SubMask0', 'Bước 5: Nhập Subnet Mask: 255.255.255.0', 'right', visibleAndUnsaved('#sub_SubMask0')),
    step('[id="sub_MinAddress0:DHCPBasicCfg"]', 'Bước 6: Nhập DHCP Start IP Address: 192.168.10.2', 'right', visibleAndUnsaved('[id="sub_MinAddress0:DHCPBasicCfg"]')),
    step('[id="sub_MaxAddress0:DHCPBasicCfg"]', 'Bước 7: Nhập DHCP End IP Address: 192.168.10.254', 'right', visibleAndUnsaved('[id="sub_MaxAddress0:DHCPBasicCfg"]')),
    step('#Btn_apply_DHCPBasicCfg', 'Bước 8: Chọn Apply', 'top', visibleAndUnsaved('#Btn_apply_DHCPBasicCfg'))
  ];

  // Bài 6: Cấu hình Port Forwarding
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
    // Khi chưa có rule, trang Port Forwarding tự mở form New Item.
    step('[id^="Alias"]', 'Bước 4: Nhập Name: FPT Telecom', 'right', visibleAndUnsaved('[id^="Alias"]')),
    step('[id^="Protocol"]', 'Bước 5: Chọn Protocol: TCP And UDP', 'right', visibleAndUnsaved('[id^="Protocol"]')),
    step('[id^="S_Interface"]', 'Bước 6: Chọn WAN Connection: internet_tr069', 'right', visibleAndUnsaved('[id^="S_Interface"]')),
    step('[id^="InternalClient"]', 'Bước 7: Nhập LAN Host: 192.168.1.254', 'right', visibleAndUnsaved('[id^="InternalClient"]')),
    step('[id^="ExternalPort"]:not([id*="EndRange"])', 'Bước 8: Nhập WAN Port bắt đầu: 8080', 'right', visibleAndUnsaved('[id^="ExternalPort"]:not([id*="EndRange"])')),
    step('[id^="ExternalPortEndRange"]', 'Bước 9: Nhập WAN Port kết thúc: 8080', 'right', visibleAndUnsaved('[id^="ExternalPortEndRange"]')),
    step('[id^="InternalPort"]:not([id*="EndRange"])', 'Bước 10: Nhập LAN Host Port bắt đầu: 8080', 'right', visibleAndUnsaved('[id^="InternalPort"]:not([id*="EndRange"])')),
    step('[id^="InternalPortEndRange"]', 'Bước 11: Nhập LAN Host Port kết thúc: 8080', 'right', visibleAndUnsaved('[id^="InternalPortEndRange"]')),
    step('[id^="Btn_apply_PortForwarding"]', 'Bước 12: Chọn Apply', 'top', visibleAndUnsaved('[id^="Btn_apply_PortForwarding"]'))
  ];
})();
