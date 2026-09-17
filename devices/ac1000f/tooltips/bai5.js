/**
 * devices/ac1000f/tooltips/bai5.js — Tooltip Hướng dẫn cho Bài 5: Cấu hình DHCP
 */

if (!window.TOOLTIPS_AC1000F) window.TOOLTIPS_AC1000F = {};

window.TOOLTIPS_AC1000F['LAB_AC1000F_05'] = [
  // Bước 1: Chọn tab Network
  {
    selector: 'a[onclick*="change_bg2"]',
    text: 'Bước 1: Chọn tab Network',
    position: 'top',
    hideOnPage: 'home_lan.asp'
  },
  // Bước 2: Chọn LAN
  {
    selector: 'a[href*="home_lan.asp"]',
    text: 'Bước 2: Chọn LAN',
    position: 'bottom',
    hideOnPage: 'home_lan.asp'
  },
  // Bước 3: IP Address
  {
    page: 'home_lan.asp',
    selector: 'input[name="uiViewIPAddr"]',
    text: 'Bước 3: IP Address nhập 192.168.10.1',
    position: 'right',
    expected: '192.168.10.1'
  },
  // Bước 4: IP Subnet Mask
  {
    page: 'home_lan.asp',
    selector: 'input[name="uiViewNetMask"]',
    text: 'Bước 4: IP Subnet Mask kiểm tra 255.255.255.0',
    position: 'right',
    expected: '255.255.255.0'
  },
  // Bước 5: Đảm bảo chọn Enable ở mục DHCP
  {
    page: 'home_lan.asp',
    selector: 'input[name="dhcpTypeRadio"][value="1"], input[name="dhcpTypeRadio"]',
    text: 'Bước 5: Chọn Enable cho DHCP Server',
    position: 'top'
  },
  // Bước 6: Start IP
  {
    page: 'home_lan.asp',
    selector: 'input[name="StartIp"]',
    text: 'Bước 6: Start IP nhập 192.168.10.2',
    position: 'right',
    expected: '192.168.10.2'
  },
  // Bước 7: End IP
  {
    page: 'home_lan.asp',
    selector: 'input[name="EndIp"]',
    text: 'Bước 7: End IP nhập 192.168.10.254',
    position: 'right',
    expected: '192.168.10.254'
  },
  // Bước 8: Lease Time
  {
    page: 'home_lan.asp',
    selector: 'input[name="dhcp_LeaseTime"], input[name="leaseTime"]',
    text: 'Bước 8: Lease Time nhập 86400',
    position: 'bottom',
    expected: '86400'
  },
  // Bước 9: Chọn SAVE
  {
    page: 'home_lan.asp',
    selector: 'input[name="SaveBtn"], input[value="Save"], input[name="save"], #save, #btnSave',
    text: 'Bước 9: Chọn Save để lưu cấu hình',
    position: 'right'
  }
];
