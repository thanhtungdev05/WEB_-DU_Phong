/**
 * devices/ac1000cv2/tooltips/bai1.js — Tooltip Hướng dẫn cho Bài 1: Cấu hình PPPoE
 */

if (!window.TOOLTIPS_AC1000CV2) window.TOOLTIPS_AC1000CV2 = {};

var bai1_popups = [
  // Bước 1: Dẫn đường menu Advanced Setup (chỉ hiện khi chưa vào trang WAN và chưa có submenu WAN)
  {
    selector: '#main_menu #mm3 a, #mm3 a, li.m1_advanced a, a[href*="lan.html"]',
    text: 'Bước 1: Chọn menu Advanced Setup',
    position: 'bottom',
    hideOnPage: 'wan.html',
    condition: function(doc) {
      return !doc.querySelector('#sub_menu a[href*="wan.html"]');
    }
  },
  // Bước 2: Dẫn đường menu con WAN ở bên trái (chỉ hiện khi menu con WAN đã xuất hiện)
  {
    selector: '#sub_menu a[href*="wan.html"], #sub_menu #wan a',
    text: 'Bước 2: Chọn WAN ở menu bên trái',
    position: 'right',
    hideOnPage: 'wan.html'
  },
  // Bước 3: Ô nhập PPPoE Username (trên trang wan.html)
  {
    page: 'wan.html',
    selector: 'input[name="ppp_user"], #ppp_user',
    text: 'Bước 3: Nhập Username (sgfdl-210208-218)',
    position: 'right',
    expected: 'sgfdl-210208-218'
  },
  // Bước 4: Ô nhập PPPoE Password
  {
    page: 'wan.html',
    selector: 'input[name="ppp_pass"], #ppp_pass',
    text: 'Bước 4: Nhập Password (fpt12345)',
    position: 'right',
    expected: 'fpt12345'
  },
  // Bước 5: Nút Apply / Save
  {
    page: 'wan.html',
    selector: '#btn_apply, a#btn_apply, input[value="Apply"], input[value="Save"], #apply',
    text: 'Bước 5: Nhấn Apply để lưu cấu hình WAN',
    position: 'top'
  }
];

window.TOOLTIPS_AC1000CV2['ac1000cv2-bai1'] = bai1_popups;
window.TOOLTIPS_AC1000CV2['LAB_AC1000CV2_01'] = bai1_popups;
