/** Hướng dẫn từng bước cho sáu bài AX3000GZ V2 (ZTE F6201B). */
(function () {
  'use strict';

  const store = window.TOOLTIPS_AX3000GZ_V2 = window.TOOLTIPS_AX3000GZ_V2 || {};
  const step = (selector, text, position = 'right') => ({ selector, text, position });

  store._common_login = [
    step('#Frm_Username', 'Nhập tên đăng nhập: admin'),
    step('#Frm_Password', 'Nhập mật khẩu: admin'),
    step('#LoginId', 'Chọn Login để đăng nhập', 'bottom')
  ];

  store.LAB_AX3000GZ_V2_01 = [
    step('#internet', 'Bước 1: Chọn Internet', 'bottom'),
    step('#internetConfig', 'Bước 2: Chọn WAN'),
    step('#ethWanConfig', 'Bước 3: Chọn WAN'),
    step('[id^="instName_Internet"]', 'Bước 4: Mở cấu hình internet_tr069'),
    step('[id^="UserName"]', 'Bước 5: Nhập Username: sgfdl-123456-789'),
    step('[id^="Password"]', 'Bước 6: Nhập Password: fpt12345'),
    step('[id^="Btn_apply_internet"]', 'Bước 7: Chọn Apply', 'top')
  ];

  store.LAB_AX3000GZ_V2_02 = [
    step('#localnet', 'Bước 1: Chọn Local Network', 'bottom'),
    step('#wlanConfig', 'Bước 2: Chọn WLAN'),
    step('#wlanBasic', 'Bước 3: Chọn WLAN Basic'),
    step('#WLANSSIDConfBar', 'Bước 4: Mở WLAN SSID Configuration'),
    step('[id="instName_WLANSSIDConf:0"]', 'Bước 5: Mở SSID1 băng tần 2.4 GHz'),
    step('[id="ESSID:0"]', 'Bước 6: Nhập SSID Name: FPT Telecom'),
    step('[id="EncryptionType:0"]', 'Bước 7: Chọn WPA2-PSK-AES'),
    step('[id="HiddenKeyPass:0"]', 'Bước 8: Nhập WPA Passphrase: Fptwifi123'),
    step('[id="Btn_apply_WLANSSIDConf:0"]', 'Bước 9: Chọn Apply', 'top')
  ];

  store.LAB_AX3000GZ_V2_03 = [
    step('#localnet', 'Bước 1: Chọn Local Network', 'bottom'),
    step('#wlanConfig', 'Bước 2: Chọn WLAN'),
    step('#wlanBasic', 'Bước 3: Chọn WLAN Basic'),
    step('#WLANSSIDConfBar', 'Bước 4: Mở WLAN SSID Configuration'),
    step('[id="instName_WLANSSIDConf:3"]', 'Bước 5: Mở SSID4 băng tần 2.4 GHz (IoT)'),
    step('[id="ESSID:3"]', 'Bước 6: Nhập SSID Name: FPT IoT'),
    step('[id="EncryptionType:3"]', 'Bước 7: Chọn WPA2-PSK-AES'),
    step('[id="HiddenKeyPass:3"]', 'Bước 8: Nhập WPA Passphrase: Fptiot123'),
    step('[id="Btn_apply_WLANSSIDConf:3"]', 'Bước 9: Chọn Apply', 'top')
  ];

  store.LAB_AX3000GZ_V2_04 = [
    step('#localnet', 'Bước 1: Chọn Local Network', 'bottom'),
    step('#dns', 'Bước 2: Chọn DNS'),
    step('#LocalDnsServerBar', 'Bước 3: Mở Local DNS Server'),
    step('#sub_SerIPAddress10', 'Bước 4: Nhập DNS Server 1: 8.8.8.8'),
    step('#sub_SerIPAddress20', 'Bước 5: Nhập DNS Server 2: 8.8.4.4'),
    step('#Btn_apply_LocalDnsServer', 'Bước 6: Chọn Apply', 'top')
  ];

  store.LAB_AX3000GZ_V2_05 = [
    step('#localnet', 'Bước 1: Chọn Local Network', 'bottom'),
    step('#lanConfig', 'Bước 2: Chọn LAN'),
    step('#lanMgrIpv4', 'Bước 3: Chọn IPv4'),
    step('#DHCPBasicCfgBar', 'Bước 4: Mở DHCP Server'),
    step('#ServerEnable1', 'Bước 5: Chọn DHCP Server: On'),
    step('[id="sub_IPAddr0:DHCPBasicCfg"]', 'Bước 6: Nhập LAN IP Address: 192.168.10.1'),
    step('#Btn_apply_DHCPBasicCfg', 'Bước 7: Chọn Apply', 'top')
  ];

  store.LAB_AX3000GZ_V2_06 = [
    step('#internet', 'Bước 1: Chọn Internet', 'bottom'),
    step('#security', 'Bước 2: Chọn Security'),
    step('#portForwarding', 'Bước 3: Chọn Port Forwarding'),
    step('#addInstBar_PortForwarding', 'Bước 4: Chọn Create New Item'),
    step('[id^="Alias"]', 'Bước 5: Nhập Name: FPT Telecom'),
    step('[id^="Protocol"]', 'Bước 6: Chọn TCP And UDP'),
    step('[id^="InternalClient"]', 'Bước 7: Nhập LAN Host: 192.168.1.254'),
    step('[id^="ExternalPort"]:not([id*="EndRange"])', 'Bước 8: Nhập WAN Port: 8080'),
    step('[id^="InternalPort"]:not([id*="EndRange"])', 'Bước 9: Nhập LAN Host Port: 8080'),
    step('[id^="Btn_apply_PortForwarding"]', 'Bước 10: Chọn Apply', 'top')
  ];
})();
