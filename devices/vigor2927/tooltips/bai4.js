/**
 * devices/vigor2927/tooltips/bai4.js — Tooltip Hướng dẫn cho Bài 4: Cấu hình DHCP
 */

if (!window.TOOLTIPS_VIGOR2927) window.TOOLTIPS_VIGOR2927 = {};

window.TOOLTIPS_VIGOR2927['vg2927-bai4'] = [
  {
    selector: '#menu-lan:not(.open) .menu-text, #menu-lan:not(.open)',
    text: 'Bước 1: chọn LAN',
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
    selector: 'select[name="sLanMask"]',
    text: 'Bước 4: điền IP Address 192.168.100.1<br>chọn Subnet Mask 255.255.255.0',
    position: 'bottom',
    page: 'sht'
  },
  {
    selector: 'input[name="sDHCP"][value="1"] + translate, input[name="sDHCP"][value="1"]',
    text: 'Bước 5: chọn Enable Server<br>- Start IP Address: 192.168.100.10<br>- IP Pool Counts: 200<br>- Gateway IP Address: 192.168.100.1<br>- Lease Time: 86400',
    position: 'top',
    minTop: -4,
    offsetY: 3,
    page: 'sht'
  },
  {
    selector: 'input[name="btnOK"], input[value="OK"]',
    text: 'Bước 5: chọn OK',
    position: 'top',
    page: 'sht'
  }
];
