/** Sáu bài thực hành AX3000GZ V2, tương ứng bộ bài chuẩn của AX3000GZ. */
(function () {
  'use strict';

  const lessons = window.DEVICE_AX3000GZ_V2_LESSONS = window.DEVICE_AX3000GZ_V2_LESSONS || [];
  const tooltips = window.TOOLTIPS_AX3000GZ_V2 || {};

  function rule(id, name, selector, expected, type = 'text_exact') {
    return { id, name, selector, expected, type, trim: true, required: true };
  }

  function register(definition) {
    const current = lessons.findIndex(item => item.id === definition.id);
    if (current !== -1) lessons.splice(current, 1);
    definition.guidePopups = tooltips[definition.id] || [];
    lessons.push(definition);
  }

  register({
    id: 'LAB_AX3000GZ_V2_01',
    title: 'Bài 1 - Cấu hình WAN PPPoE',
    subtitle: 'Cấu hình tài khoản Internet trên interface internet_tr069',
    instructions: [
      '<b>Yêu cầu:</b>',
      'Chỉ chỉnh sửa interface <span class="val">internet_tr069</span>, không xóa hoặc tạo interface khác.',
      '- Username: <span class="val">sgfdl-123456-789</span>',
      '- Password: <span class="val">fpt12345</span>',
      '- Các thông số còn lại giữ mặc định.'
    ],
    practiceUrl: '/sim_ax3000gz_v2/?_type=menuView&_tag=ethWanConfig',
    clearFields: ['[id="UserName:0"]', '[id="Password:0"]'],
    grading: { description: 'Kiểm tra tài khoản PPPoE', rules: [
      rule('pppoe_user', 'Username', '[id="UserName:0"]', 'sgfdl-123456-789'),
      rule('pppoe_password', 'Password', '[id="Password:0"]', 'fpt12345')
    ]}
  });

  register({
    id: 'LAB_AX3000GZ_V2_02',
    title: 'Bài 2 - Cấu hình Wi-Fi',
    subtitle: 'Đặt SSID và mật khẩu cho SSID chính 2.4 GHz',
    instructions: [
      '<b>Yêu cầu:</b>',
      '- SSID Name: <span class="val">FPT Telecom</span>',
      '- WPA Passphrase: <span class="val">Fptwifi123</span>',
      '- Các thông số còn lại giữ mặc định.'
    ],
    practiceUrl: '/sim_ax3000gz_v2/?_type=menuView&_tag=wlanBasic',
    clearFields: ['[id="ESSID:0"]', '[id="HiddenKeyPass:0"]'],
    grading: { description: 'Kiểm tra SSID chính và mật khẩu Wi-Fi', rules: [
      rule('wifi_ssid', 'SSID Name', '[id="ESSID:0"]', 'FPT Telecom'),
      rule('wifi_password', 'WPA Passphrase', '[id="HiddenKeyPass:0"]', 'Fptwifi123')
    ]}
  });

  register({
    id: 'LAB_AX3000GZ_V2_03',
    title: 'Bài 3 - Cấu hình Wi-Fi IoT',
    subtitle: 'Cấu hình SSID IoT trên băng tần 2.4 GHz',
    instructions: [
      '<b>Yêu cầu:</b>',
      '- Chọn SSID4 (2.4 GHz - IoT)',
      '- SSID Name: <span class="val">FPT IoT</span>',
      '- Encryption Type: <span class="val">WPA2-PSK-AES</span>',
      '- WPA Passphrase: <span class="val">Fptiot123</span>'
    ],
    practiceUrl: '/sim_ax3000gz_v2/?_type=menuView&_tag=wlanBasic',
    clearFields: ['[id="ESSID:3"]', '[id="HiddenKeyPass:3"]'],
    grading: { description: 'Kiểm tra SSID IoT và bảo mật Wi-Fi', rules: [
      rule('iot_ssid', 'SSID Name', '[id="ESSID:3"]', 'FPT IoT'),
      rule('iot_security', 'Encryption Type', '[id="EncryptionType:3"]', 'WPA2-PSK-AES'),
      rule('iot_password', 'WPA Passphrase', '[id="HiddenKeyPass:3"]', 'Fptiot123')
    ]}
  });

  register({
    id: 'LAB_AX3000GZ_V2_04',
    title: 'Bài 4 - Cấu hình DNS',
    subtitle: 'Cấu hình máy chủ DNS cục bộ cho mạng LAN',
    instructions: [
      '<b>Yêu cầu:</b>',
      '- DNS Server 1: <span class="val">8.8.8.8</span>',
      '- DNS Server 2: <span class="val">8.8.4.4</span>'
    ],
    practiceUrl: '/sim_ax3000gz_v2/?_type=menuView&_tag=dns',
    clearFields: ['[id^="sub_SerIPAddress1"]', '[id^="sub_SerIPAddress2"]'],
    grading: { description: 'Kiểm tra hai địa chỉ DNS', rules: [
      rule('dns1_1', 'DNS Server 1 - ô 1', '#sub_SerIPAddress10', '8'),
      rule('dns1_2', 'DNS Server 1 - ô 2', '#sub_SerIPAddress11', '8'),
      rule('dns1_3', 'DNS Server 1 - ô 3', '#sub_SerIPAddress12', '8'),
      rule('dns1_4', 'DNS Server 1 - ô 4', '#sub_SerIPAddress13', '8'),
      rule('dns2_1', 'DNS Server 2 - ô 1', '#sub_SerIPAddress20', '8'),
      rule('dns2_2', 'DNS Server 2 - ô 2', '#sub_SerIPAddress21', '8'),
      rule('dns2_3', 'DNS Server 2 - ô 3', '#sub_SerIPAddress22', '4'),
      rule('dns2_4', 'DNS Server 2 - ô 4', '#sub_SerIPAddress23', '4')
    ]}
  });

  register({
    id: 'LAB_AX3000GZ_V2_05',
    title: 'Bài 5 - Cấu hình DHCP',
    subtitle: 'Đổi địa chỉ LAN và dải cấp phát DHCP của ONT',
    instructions: [
      '<b>Yêu cầu:</b>',
      '- LAN IP Address: <span class="val">192.168.10.1</span>',
      '- Subnet Mask: <span class="val">255.255.255.0</span>',
      '- DHCP Start IP Address: <span class="val">192.168.10.2</span>',
      '- DHCP End IP Address: <span class="val">192.168.10.254</span>'
    ],
    practiceUrl: '/sim_ax3000gz_v2/?_type=menuView&_tag=lanMgrIpv4',
    clearFields: [
      '[id="sub_IPAddr0:DHCPBasicCfg"]', '[id="sub_IPAddr1:DHCPBasicCfg"]',
      '[id="sub_IPAddr2:DHCPBasicCfg"]', '[id="sub_IPAddr3:DHCPBasicCfg"]',
      '#sub_SubMask0', '#sub_SubMask1', '#sub_SubMask2', '#sub_SubMask3',
      '[id="sub_MinAddress0:DHCPBasicCfg"]', '[id="sub_MinAddress1:DHCPBasicCfg"]',
      '[id="sub_MinAddress2:DHCPBasicCfg"]', '[id="sub_MinAddress3:DHCPBasicCfg"]',
      '[id="sub_MaxAddress0:DHCPBasicCfg"]', '[id="sub_MaxAddress1:DHCPBasicCfg"]',
      '[id="sub_MaxAddress2:DHCPBasicCfg"]', '[id="sub_MaxAddress3:DHCPBasicCfg"]'
    ],
    grading: { description: 'Kiểm tra LAN IP, subnet và dải cấp phát DHCP', rules: [
      rule('lan_ip_1', 'LAN IP - ô 1', '[id="sub_IPAddr0:DHCPBasicCfg"]', '192'),
      rule('lan_ip_2', 'LAN IP - ô 2', '[id="sub_IPAddr1:DHCPBasicCfg"]', '168'),
      rule('lan_ip_3', 'LAN IP - ô 3', '[id="sub_IPAddr2:DHCPBasicCfg"]', '10'),
      rule('lan_ip_4', 'LAN IP - ô 4', '[id="sub_IPAddr3:DHCPBasicCfg"]', '1'),
      rule('subnet_1', 'Subnet Mask - ô 1', '#sub_SubMask0', '255'),
      rule('subnet_2', 'Subnet Mask - ô 2', '#sub_SubMask1', '255'),
      rule('subnet_3', 'Subnet Mask - ô 3', '#sub_SubMask2', '255'),
      rule('subnet_4', 'Subnet Mask - ô 4', '#sub_SubMask3', '0'),
      rule('dhcp_start_1', 'DHCP Start IP - ô 1', '[id="sub_MinAddress0:DHCPBasicCfg"]', '192'),
      rule('dhcp_start_2', 'DHCP Start IP - ô 2', '[id="sub_MinAddress1:DHCPBasicCfg"]', '168'),
      rule('dhcp_start_3', 'DHCP Start IP - ô 3', '[id="sub_MinAddress2:DHCPBasicCfg"]', '10'),
      rule('dhcp_start_4', 'DHCP Start IP - ô 4', '[id="sub_MinAddress3:DHCPBasicCfg"]', '2'),
      rule('dhcp_end_1', 'DHCP End IP - ô 1', '[id="sub_MaxAddress0:DHCPBasicCfg"]', '192'),
      rule('dhcp_end_2', 'DHCP End IP - ô 2', '[id="sub_MaxAddress1:DHCPBasicCfg"]', '168'),
      rule('dhcp_end_3', 'DHCP End IP - ô 3', '[id="sub_MaxAddress2:DHCPBasicCfg"]', '10'),
      rule('dhcp_end_4', 'DHCP End IP - ô 4', '[id="sub_MaxAddress3:DHCPBasicCfg"]', '254')
    ]}
  });

  register({
    id: 'LAB_AX3000GZ_V2_06',
    title: 'Bài 6 - Cấu hình Port Forwarding',
    subtitle: 'Mở cổng mẫu cho thiết bị trong mạng LAN',
    instructions: [
      '<b>Yêu cầu:</b>',
      '- Name: <span class="val">FPT Telecom</span>',
      '- WAN Connection: <span class="val">internet_tr069</span>',
      '- Protocol: <span class="val">TCP And UDP</span>',
      '- LAN Host: <span class="val">192.168.1.254</span>',
      '- WAN Port (Start / End): <span class="val">8080 / 8080</span>',
      '- LAN Host Port (Start / End): <span class="val">8080 / 8080</span>'
    ],
    practiceUrl: '/sim_ax3000gz_v2/?_type=menuView&_tag=portForwarding',
    clearFields: ['[id^="Alias"]', '[id^="InternalClient"]', '[id^="ExternalPort"]', '[id^="InternalPort"]'],
    grading: { description: 'Kiểm tra Port Forwarding', rules: [
      rule('pf_name', 'Name', '[id^="Alias"]', 'FPT Telecom'),
      rule('pf_wan_connection', 'WAN Connection', '[id^="S_Interface"]', 'DEV.IP.IF3'),
      rule('pf_protocol', 'Protocol', '[id^="Protocol"]', 'BOTH'),
      rule('pf_lan_host', 'LAN Host', '[id^="InternalClient"]', '192.168.1.254'),
      rule('pf_wan_port', 'WAN Port', '[id^="ExternalPort"]:not([id*="EndRange"])', '8080'),
      rule('pf_wan_port_end', 'WAN Port End', '[id^="ExternalPortEndRange"]', '8080'),
      rule('pf_lan_port', 'LAN Host Port', '[id^="InternalPort"]:not([id*="EndRange"])', '8080'),
      rule('pf_lan_port_end', 'LAN Host Port End', '[id^="InternalPortEndRange"]', '8080')
    ]}
  });
})();
