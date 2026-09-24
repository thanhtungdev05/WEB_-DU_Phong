/**
 * devices/ac1000hi/tooltips/bai5.js
 */

if (!window.TOOLTIPS_AC1000HI) window.TOOLTIPS_AC1000HI = {};

window.TOOLTIPS_AC1000HI['LAB_AC1000HI_05'] = [
  {
    selector: 'a[onclick*="change_basic"]',
    text: 'Bước 1: Chọn tab Network',
    position: 'top'
  },
  {
    selector: 'a[href*="home_lan.asp"]',
    text: 'Bước 2: Chọn LAN',
    position: 'top'
  },
  {
    page: 'home_lan.asp',
    selector: 'input[name="uiViewIPAddr"]',
    text: 'Bước 3: Đổi IP Address thành 192.168.10.1',
    position: 'right',
    expected: '192.168.10.1'
  },
  {
    page: 'home_lan.asp',
    selector: 'input[name="uiViewNetMask"]',
    text: 'Bước 4: Kiểm tra IP Subnet Mask (255.255.255.0)',
    position: 'right',
    expected: '255.255.255.0'
  },
  {
    page: 'home_lan.asp',
    selector: 'input[name="dhcpTypeRadio"][value="1"]',
    text: 'Bước 5: Chọn Enable DHCP',
    position: 'right'
  },
  {
    page: 'home_lan.asp',
    selector: 'input[name="StartIp"]',
    text: 'Bước 6: Nhập Start IP (192.168.10.2)',
    position: 'right',
    expected: '192.168.10.2'
  },
  {
    page: 'home_lan.asp',
    selector: 'input[name="PoolSize"]',
    text: 'Bước 7: Nhập IP Pool Count (253)',
    position: 'right',
    expected: '253'
  },
  {
    page: 'home_lan.asp',
    selector: 'input[name="dhcp_LeaseTime"]',
    text: 'Bước 8: Nhập Lease Time (86400)',
    position: 'right',
    expected: '86400'
  },
  {
    page: 'home_lan.asp',
    selector: 'input[name="SaveBtn"], input[value="Save"], input[name="save"], .button1',
    text: 'Bước 9: Cuộn xuống chọn Save để lưu cấu hình',
    position: 'right'
  }
];
