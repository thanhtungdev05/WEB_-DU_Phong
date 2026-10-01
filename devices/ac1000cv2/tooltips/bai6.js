/**
 * devices/ac1000cv2/tooltips/bai6.js — Tooltip Hướng dẫn cho Bài 6: Cấu hình Port Forwarding
 * Hiển thị đồng thời toàn bộ các bước trên cùng giao diện (theo chuẩn Bài 1)
 */

if (!window.TOOLTIPS_AC1000CV2) window.TOOLTIPS_AC1000CV2 = {};

var bai6_popups = [
  // Bước 1: Dẫn đường menu Security Setup (nếu chưa vào trang Port Forwarding)
  {
    selector: '#main_menu #mm4 a, #mm4 a, li.m1_security a, a[href*="macfilter.html"]',
    text: 'Bước 1: Chọn menu Security Setup',
    position: 'bottom',
    hideOnPage: 'portfwd.html',
    condition: function (doc) {
      return !doc.querySelector('#sub_menu a[href*="portfwd.html"]');
    }
  },
  // Bước 2: Dẫn đường menu con Port Forwarding ở bên trái
  {
    selector: '#sub_menu a[href*="portfwd.html"], #sub_menu #portfwd a',
    text: 'Bước 2: Chọn mục Port Forwarding ở menu bên trái',
    position: 'right',
    hideOnPage: 'portfwd.html'
  },

  // ── CÁC BƯỚC TRÊN TRANG PORTFWD.HTML (Hiển thị đồng thời) ──
  // Nhập Local IP Address máy chủ
  {
    page: 'portfwd.html',
    selector: '#portfwd_lanip, input[name="portfwd_lanip"]',
    text: 'Bước 2: Nhập Local IP máy chủ (192.168.1.254)',
    position: 'right',
    expected: '192.168.1.254'
  },
  // Nhập Local Port
  {
    page: 'portfwd.html',
    selector: '#portfwd_lanport, input[name="portfwd_lanport"]',
    text: 'Bước 3: Nhập Local Port (3389)',
    position: 'right',
    expected: '3389'
  },
  // Chọn Protocol
  {
    page: 'portfwd.html',
    selector: '#protocol, select[name="protocol"]',
    text: 'Bước 4: Chọn Protocol (TCP)',
    position: 'right',
    expected: '1'
  },
  // Nhập WAN Start Port
  {
    page: 'portfwd.html',
    selector: '#portfwd_wanstart, input[name="portfwd_wanstart"]',
    text: 'Bước 5: Nhập WAN Start Port (3389)',
    position: 'right',
    expected: '3389'
  },
  // Nhập WAN End Port
  {
    page: 'portfwd.html',
    selector: '#portfwd_wanend, input[name="portfwd_wanend"]',
    text: 'Bước 6: Nhập WAN End Port (3389)',
    position: 'right',
    expected: '3389'
  },
  // Nhấn Apply để áp dụng cấu hình
  {
    page: 'portfwd.html',
    selector: '#btn_apply, a#btn_apply, input[value="Apply"], input[value="Save"], #apply',
    text: 'Bước 7: Nhấn Apply để áp dụng cấu hình',
    position: 'top'
  }
];

window.TOOLTIPS_AC1000CV2['ac1000cv2-bai6'] = bai6_popups;
window.TOOLTIPS_AC1000CV2['LAB_AC1000CV2_06'] = bai6_popups;

if (window.DEVICE_AC1000CV2_LESSONS) {
  var targetLesson = window.DEVICE_AC1000CV2_LESSONS.find(function (l) { return l.id === 'ac1000cv2-bai6' || l.id === 'LAB_AC1000CV2_06'; });
  if (targetLesson) targetLesson.guidePopups = bai6_popups;
}
