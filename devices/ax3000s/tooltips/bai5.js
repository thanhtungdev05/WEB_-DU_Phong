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
    page: 'lancfgv4',
    condition: function(doc) {
      return !doc.querySelector('#ethIpAddress');
    }
  },
  // Bước 2: Nhập IP Address (Gateway) 192.168.2.1
  {
    selector: '#ethIpAddress',
    text: 'Bước 4: Nhập IP Address (Gateway) 192.168.2.1',
    position: 'right',
    page: 'lancfgv4',
    expected: '192.168.2.1'
  },
  // Bước 3: Nhập Subnet Mask 255.255.255.0
  {
    selector: '#ethSubnetMask',
    text: 'Bước 5: Nhập Subnet Mask 255.255.255.0',
    position: 'right',
    page: 'lancfgv4',
    expected: '255.255.255.0'
  },
  // Đặt Start IP 192.168.2.2
  {
    selector: '#dhcpEthStart',
    text: 'Bước 6: Đặt Start IP 192.168.2.2',
    position: 'right',
    page: 'lancfgv4',
    expected: '192.168.2.2'
  },
  // Đặt End IP 192.168.2.254
  {
    selector: '#dhcpEthEnd',
    text: 'Bước 7: Đặt End IP 192.168.2.254',
    position: 'right',
    page: 'lancfgv4',
    expected: '192.168.2.254'
  },
  // Chọn Lease Time 2 minute
  {
    selector: '#dhcpLeasedTime',
    text: 'Bước 8: Chọn Lease Time 2 minute',
    position: 'right',
    page: 'lancfgv4',
    expected: '120' // 120 means 2 minutes in the select option
  },
  // Nhấn Save & Apply
  {
    selector: '#Sky_Apply',
    text: 'Bước 9: Nhấn Save & Apply',
    position: 'top',
    page: 'lancfgv4'
  }
];
