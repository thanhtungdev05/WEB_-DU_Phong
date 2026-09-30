/**
 * devices/ac1000hi/tooltips/bai4.js
 */

if (!window.TOOLTIPS_AC1000HI) window.TOOLTIPS_AC1000HI = {};

window.TOOLTIPS_AC1000HI['LAB_AC1000HI_04'] = [
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
    selector: 'input[name="dnsTypeRadio"][value="1"]',
    text: 'Bước 3: Chọn Manually',
    position: 'top'
  },
  {
    page: 'home_lan.asp',
    selector: 'input[name="PrimaryDns"]',
    text: 'Bước 4: Nhập Primary DNS (8.8.8.8)',
    position: 'right',
    expected: '8.8.8.8'
  },
  {
    page: 'home_lan.asp',
    selector: 'input[name="SecondDns"]',
    text: 'Bước 5: Nhập Secondary DNS (8.8.4.4)',
    position: 'right',
    expected: '8.8.4.4'
  },
  {
    page: 'home_lan.asp',
    selector: 'input[name="SaveBtn"], input[value="Apply/Save"], input[name="save"], .button1, input[value="Save"]',
    text: 'Bước 6: Chọn Save để lưu cấu hình',
    position: 'top'
  }
];
