/**
 * devices/vigor2927/tooltips/bai1.js — Tooltip Hướng dẫn cho Bài 1: Cấu hình PPPoE
 */

if (!window.TOOLTIPS_VIGOR2927) window.TOOLTIPS_VIGOR2927 = {};

window.TOOLTIPS_VIGOR2927['vg2927-bai1'] = [
  {
    selector: '#menu-wan:not(.open) .menu-text, #menu-wan:not(.open)',
    text: 'Bước 1: chọn WAN',
    position: 'bottom'
  },
  {
    selector: '#sub-wan:not(.hidden) #menu-wan-internet .menu-text, #sub-wan:not(.hidden) #menu-wan-internet',
    text: 'Bước 2: chọn Internet Access',
    position: 'bottom'
  },
  {
    selector: 'input[name="btnDtPage0"], input[value="Details Page"]',
    text: 'Bước 3: Chọn Details Page',
    position: 'top'
  },
  {
    selector: '#tab1.offtab, #tab1:not(.ontab)',
    text: 'Bước 4: chọn PPPoE',
    position: 'bottom'
  },
  {
    selector: '#lbl-pppoe-disable, input[name="PPPoE"][value="0"]',
    text: 'Bước 5: chọn Enable',
    position: 'right',
    expected: '1'
  },
  {
    selector: '#opt-pppoe-username, input[name="sDOutUser1"]',
    text: 'Bước 6: nhập sgfdl-211208-218',
    position: 'right',
    expected: 'sgfdl-211208-218'
  },
  {
    selector: '#opt-pppoe-password, input[name="sDOutPass1"]',
    text: 'Bước 7: nhập fpt12345',
    position: 'right',
    expected: 'fpt12345'
  },
  {
    selector: '#btn-pppoe-ok, input[name="submit"][value="OK"], input[type="submit"][value="OK"]',
    text: 'Bước 8: nhấn OK',
    position: 'top'
  }
];
