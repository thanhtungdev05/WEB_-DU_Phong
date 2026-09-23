/**
 * devices/vigor2927/tooltips/bai6.js — Tooltip Hướng dẫn cho Bài 6: Cấu hình định tuyến Failover và Load Balancing
 */

if (!window.TOOLTIPS_VIGOR2927) window.TOOLTIPS_VIGOR2927 = {};

window.TOOLTIPS_VIGOR2927['vg2927-bai6'] = [
  {
    selector: '#menu-wan:not(.open) .menu-text, #menu-wan:not(.open)',
    text: 'Bước 1: chọn WAN',
    position: 'bottom',
    hideOnPage: 'mwangen1|mwangen|wan.cgi'
  },
  {
    selector: '#sub-wan:not(.hidden) #menu-wan-general .menu-text, #sub-wan:not(.hidden) #menu-wan-general',
    text: 'Bước 2: chọn General Setup',
    position: 'bottom',
    hideOnPage: 'mwangen1|mwangen|wan.cgi'
  },
  {
    selector: '.ldbn select[name="iBwLBBased"], select[name="iBwLBBased"]',
    text: 'Bước 3: chọn Session Based',
    position: 'right',
    page: 'mwangen1'
  },
  {
    selector: '.ldbn select[name="iBwLBMode"], select[name="iBwLBMode"]',
    text: 'Bước 4: chọn According to Line Speed',
    position: 'right',
    page: 'mwangen1'
  },
  {
    selector: 'input[name="btnOk"], input[value="OK"]',
    text: 'Bước 5: chọn OK để lưu cấu hình, sau đó cấu hình tiếp WAN1 và WAN2.',
    position: 'top',
    page: 'mwangen1'
  },
  /* Trang WAN1 (doc/mwangen.htm) — dùng 'mwangen.htm' (có đuôi .htm) để KHÔNG bị trùng
     với trang tổng 'mwangen1.htm' (so khớp theo chuỗi con: "mwangen.htm" không nằm
     trong "mwangen1.htm" vì có số 1 chen giữa). */
  {
    selector: 'input[name="sBwWanDisName"]',
    text: 'Bước 1: nhập ISP-1',
    position: 'right',
    page: 'mwangen.htm'
  },
  {
    selector: 'select[name="uilBwLBInRateUnit"]',
    text: 'Bước 2: nhập 80 Mbps',
    position: 'right',
    page: 'mwangen.htm'
  },
  {
    selector: 'select[name="uilBwLBOutRateUnit"]',
    text: 'Bước 3: nhập 80 Mbps',
    position: 'right',
    page: 'mwangen.htm'
  },
  {
    selector: 'input[name="submit"], input[value="OK"]',
    text: 'Bước 4: chọn OK',
    position: 'top',
    page: 'mwangen.htm'
  },
  /* Trang WAN2 — phục vụ qua _pages/wan_03.html, KHÔNG có tên file .htm riêng biệt trên URL
     (server trả thẳng nội dung tại chính URL POST, không redirect) — URL frame lúc đó là
     ".../cgi-bin/wan.cgi". Trong phạm vi Bài 6, đây là trang DUY NHẤT có "wan.cgi" trong URL
     (General Setup và WAN1 đều bị app.js chặn submit thật nên không bao giờ điều hướng tới
     URL này), nên dùng "wan.cgi" làm chuỗi lọc là an toàn, không lẫn sang 2 trang kia. */
  {
    selector: 'input[name="sBwWanDisName"]',
    text: 'Bước 1: nhập ISP-2',
    position: 'right',
    page: 'wan.cgi'
  },
  {
    selector: 'select[name="uilBwLBInRateUnit"]',
    text: 'Bước 2: nhập 80 Mbps',
    position: 'right',
    page: 'wan.cgi'
  },
  {
    selector: 'select[name="uilBwLBOutRateUnit"]',
    text: 'Bước 3: nhập 80 Mbps',
    position: 'right',
    page: 'wan.cgi'
  },
  {
    selector: 'input[name="submit"], input[value="OK"]',
    text: 'Bước 4: chọn OK',
    position: 'top',
    page: 'wan.cgi'
  }
];
