/**
 * devices/vigor2927/tooltips/bai5.js — Tooltip Hướng dẫn cho Bài 5: Cấu hình DNS
 */

if (!window.TOOLTIPS_VIGOR2927) window.TOOLTIPS_VIGOR2927 = {};

window.TOOLTIPS_VIGOR2927['vg2927-bai5'] = [
  {
    selector: '#menu-lan:not(.open) .menu-text, #menu-lan:not(.open)',
    text: 'Bước 1: Chọn LAN',
    position: 'bottom',
    hideOnPage: 'enet1|sht'
  },
  {
    selector: '#sub-lan:not(.hidden) #menu-lan-general .menu-text, #sub-lan:not(.hidden) #menu-lan-general',
    text: 'Bước 2: chọn General Setup',
    position: 'bottom',
    hideOnPage: 'enet1|sht'
  },
  {
    selector: '#lan1 input[name="btnDtPage0"], input[name="btnDtPage0"], #lan1 input[value="Details Page"]',
    text: 'Bước 3: chọn Details Page',
    position: 'top',
    hideOnPage: 'sht'
  },
  {
    selector: 'b:contains("DNS Server IP Address"), text:DNS Server IP Address',
    text: 'Bước 4: nhập DNS của công ty và google, ví dụ:<br>- Primary IP Address: 210.245.31.220<br>- Secondary IP Address: 8.8.8.8',
    position: 'top',
    page: 'sht'
  },
  {
    selector: 'input[name="btnOK"], input[value="OK"]',
    text: 'Bước 5: chọn OK',
    position: 'top',
    page: 'sht'
  }
];


