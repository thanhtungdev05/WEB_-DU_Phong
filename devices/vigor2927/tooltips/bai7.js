/**
 * devices/vigor2927/tooltips/bai7.js — Tooltip Hướng dẫn cho Bài 7: Cấu hình Policy Routing
 */

if (!window.TOOLTIPS_VIGOR2927) window.TOOLTIPS_VIGOR2927 = {};

window.TOOLTIPS_VIGOR2927['vg2927-bai7'] = [
  {
    selector: '#menu-routing:not(.open) .menu-text, #menu-routing:not(.open)',
    text: 'Bước 1: chọn Routing',
    position: 'bottom',
    hideOnPage: 'policyrt1|v2x00.cgi'
  },
  {
    selector: '#sub-routing:not(.hidden) #menu-routing-policy .menu-text, #sub-routing:not(.hidden) #menu-routing-policy',
    text: 'Bước 2: chọn Load-Balance/Route Policy',
    position: 'bottom',
    hideOnPage: 'policyrt1|v2x00.cgi'
  },
  {
    selector: 'a[href*="gotoDetailSet(1)"], tr.row0 td:first-child a',
    text: 'Bước 3: chọn 1',
    position: 'left',
    page: 'policyrt1'
  },
  {
    selector: 'input[name="iPREnable"]',
    text: 'Bước 4: check vào Enble',
    position: 'left',
    page: 'v2x00.cgi'
  },
  {
    selector: 'input[name="comment"]',
    text: 'Bước 5: nhập PC A',
    position: 'top',
    page: 'v2x00.cgi'
  },
  {
    selector: 'select[name="iPRProtocol"]',
    text: 'Bước 6: chọn TCP',
    position: 'right',
    page: 'v2x00.cgi'
  },
  {
    selector: 'select[name="rdSIpAny"]',
    text: 'Bước 7: chọn IP Range, ví dụ: 192.168.1.10 - 192.168.1.10',
    position: 'right',
    page: 'v2x00.cgi'
  },
  {
    selector: 'select[name="rdDIpAny"]',
    text: 'Bước 8: chọn IP Range, ví dụ: 11.11.11.11 - 11.11.11.11',
    position: 'right',
    page: 'v2x00.cgi'
  },
  {
    selector: 'select[name="rdDPortAny"]',
    text: 'Bước 9: chọn Dest Port Range, ví dụ: 8000 - 8000',
    position: 'right',
    page: 'v2x00.cgi'
  },
  {
    selector: '#dfgateway, td:contains("Default Gateway")',
    text: 'Bước 10: chọn Default Gateway',
    position: 'right',
    page: 'v2x00.cgi'
  },
  {
    selector: '#image_option',
    text: 'Bước 11: click vào +',
    position: 'left',
    page: 'v2x00.cgi'
  },
  {
    selector: '#idShow',
    text: 'Bước 12: kéo hoặc nhập số 200',
    position: 'top',
    page: 'v2x00.cgi'
  },
  {
    selector: 'input[name="btnOk"]',
    text: 'Bước 13: chọn OK',
    position: 'bottom',
    page: 'v2x00.cgi'
  }
];
