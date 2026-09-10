/**
 * devices/ax3000s/tooltips/bai5.js — Tooltip Hướng dẫn cho Bài 5: Cấu hình địa chỉ IP LAN
 */

if (!window.TOOLTIPS_AX3000S) window.TOOLTIPS_AX3000S = {};

window.TOOLTIPS_AX3000S['LAB_AX3000S_05'] = [
  // Chọn Network
  {
    selector: "a[href*='/network'], #Sky_Network span, #Sky_Network",
    text: 'Bước 1: Chọn Network',
    position: 'bottom',
    hideOnPage: 'network'
  },
  // Chọn LAN Configuration
  {
    selector: "a[href*='/lancfgv4'], #layer2-leaf-lancfg .dt, #layer2-leaf-lancfg",
    text: 'Bước 2: Chọn LAN Configuration',
    position: 'right',
    hideOnPage: 'lancfgv4'
  },
  // Bước 1: IPv4 Configuration
  {
    selector: '#Sky_IPv4_Configuration, #layer2-leaf-lancfg #Sky_IPv4_Configuration',
    text: 'Bước 3: IPv4 Configuration',
    position: 'top',
    page: 'lancfgv4'
  },
  // Bước 2: Nhập IP Address (Gateway) 192.168.1.1
  {
    selector: '#ethIpAddress',
    text: 'Bước 4: Nhập IP Address (Gateway) 192.168.1.1',
    position: 'right',
    page: 'lancfgv4',
    expected: '192.168.1.1'
  },
  // Bước 3: Nhập Subnet Mask 255.255.255.0
  {
    selector: '#ethSubnetMask',
    text: 'Bước 5: Nhập Subnet Mask 255.255.255.0',
    position: 'right',
    page: 'lancfgv4',
    expected: '255.255.255.0'
  },
  // Bước 4: Chọn Enable DHCP Server
  {
    selector: '#Sky_DHCP_Enable, label[for="dhcpSrvType2"]',
    text: 'Bước 6: Chọn Enable DHCP Server',
    position: 'top',
    page: 'lancfgv4',
    expected: '1' // radio value
  },
  // Bước 5: Đặt Start IP 192.168.1.2
  {
    selector: '#dhcpEthStart',
    text: 'Bước 7: Đặt Start IP 192.168.1.2',
    position: 'right',
    page: 'lancfgv4',
    expected: '192.168.1.2'
  },
  // Bước 6: Đặt End IP 192.168.1.254
  {
    selector: '#dhcpEthEnd',
    text: 'Bước 8: Đặt End IP 192.168.1.254',
    position: 'right',
    page: 'lancfgv4',
    expected: '192.168.1.254'
  },
  // Bước 7: Chọn Lease Time 2 minute
  {
    selector: '#dhcpLeasedTime',
    text: 'Bước 9: Chọn Lease Time 2 minute',
    position: 'right',
    page: 'lancfgv4',
    expected: '120' // 120 means 2 minutes in the select option
  },
  // Bước 8: Nhấn Save & Apply
  {
    selector: '#Sky_Apply',
    text: 'Bước 10: Nhấn Save & Apply',
    position: 'top',
    page: 'lancfgv4'
  }
];
