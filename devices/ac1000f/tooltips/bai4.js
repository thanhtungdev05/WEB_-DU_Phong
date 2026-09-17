/**
 * devices/ac1000f/tooltips/bai4.js — Tooltip Hướng dẫn cho Bài 4: Cấu hình DNS
 */

if (!window.TOOLTIPS_AC1000F) window.TOOLTIPS_AC1000F = {};

window.TOOLTIPS_AC1000F['LAB_AC1000F_04'] = [
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
  // Bước 3: Đảm bảo chọn DNS Relay là Manually
  {
    page: 'home_lan.asp',
    selector: 'select[name="dnsTypeRadio"], select[name="dnsRelay"]',
    text: 'Bước 3: Chọn Manually ở DNS Relay',
    position: 'right'
  },
  // Bước 4: Nhập Primary DNS
  {
    page: 'home_lan.asp',
    selector: 'input[name="PrimaryDns"], input[name="PrimaryDNS"]',
    text: 'Bước 4: Nhập Primary DNS (VD: 8.8.8.8)',
    position: 'right',
    expected: '8.8.8.8'
  },
  // Bước 5: Nhập Secondary DNS
  {
    page: 'home_lan.asp',
    selector: 'input[name="SecondDns"], input[name="SecondaryDNS"]',
    text: 'Bước 5: Nhập Secondary DNS (VD: 8.8.4.4)',
    position: 'right',
    expected: '8.8.4.4'
  },
  // Bước 6: Chọn SAVE
  {
    page: 'home_lan.asp',
    selector: 'input[name="SaveBtn"], input[value="Save"], input[name="save"], #save, #btnSave',
    text: 'Bước 6: Chọn Save để lưu cấu hình',
    position: 'right'
  }
];
