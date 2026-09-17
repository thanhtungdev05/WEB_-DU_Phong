/**
 * devices/ac1000f/tooltips/bai1.js — Tooltip Hướng dẫn cho Bài 1: Cấu hình PPPoE
 */

if (!window.TOOLTIPS_AC1000F) window.TOOLTIPS_AC1000F = {};

window.TOOLTIPS_AC1000F['LAB_AC1000F_01'] = [
  // Bước 1: Nút chọn Network ở Menu trên cùng
  {
    selector: 'a[onclick*="change_bg2"]',
    text: 'Bước 1: Chọn tab Network',
    position: 'top',
    hideOnPage: 'home_wan.asp'
  },
  // Bước 2: Nút chọn Internet ở Menu bên trái
  {
    selector: 'a[href*="home_wan"]',
    text: 'Bước 2: Chọn Internet',
    position: 'top',
    hideOnPage: 'home_wan.asp'
  },
  // Bước 3: Ô nhập PPPoE Username
  {
    page: 'home_wan.asp',
    selector: 'input[name="wan_PPPUsername"], input[name="pppUserName"], input[name="username"], #username',
    text: 'Bước 3: Nhập Username (VD: sgfdl-210208-218)',
    position: 'right',
    expected: 'sgfdl-210208-218'
  },
  // Bước 4: Ô nhập PPPoE Password
  {
    page: 'home_wan.asp',
    selector: 'input[name="wan_PPPPassword"], input[name="pppPassword"], input[name="password"], #password',
    text: 'Bước 4: Nhập Password (VD: fpt12345)',
    position: 'right',
    expected: 'fpt12345'
  },
  // Bước 5: Nút Save
  {
    page: 'home_wan.asp',
    selector: 'input[name="SaveBtn"], input[value="Save"], input[name="save"], #save, #btnSave',
    text: 'Bước 5: Chọn Save để lưu cấu hình',
    position: 'right'
  }
];
