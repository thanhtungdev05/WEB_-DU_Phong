/**
 * devices/ac1000cv2/tooltips/bai4.js — Tooltip Hướng dẫn cho Bài 4: Cấu hình DNS thủ công
 * Hiển thị đồng thời toàn bộ các bước trên cùng giao diện (theo chuẩn Bài 1)
 */

if (!window.TOOLTIPS_AC1000CV2) window.TOOLTIPS_AC1000CV2 = {};

var bai4_popups = [
  // Bước 1: Dẫn đường menu Advanced Setup (nếu chưa vào trang LAN)
  {
    selector: '#main_menu #mm3 a, #mm3 a, li.m1_advanced a, a[href*="lan.html"]',
    text: 'Bước 1: Chọn menu Advanced Setup',
    position: 'bottom',
    hideOnPage: 'lan.html',
    condition: function (doc) {
      return !doc.querySelector('#sub_menu a[href*="lan.html"]');
    }
  },
  // Bước 2: Dẫn đường menu con LAN ở bên trái
  {
    selector: '#sub_menu a[href*="lan.html"], #sub_menu #lan a, #lan a',
    text: 'Bước 2: Chọn mục LAN ở menu bên trái',
    position: 'right',
    hideOnPage: 'lan.html'
  },

  // ── CÁC BƯỚC TRÊN TRANG LAN.HTML (Hiển thị đồng thời) ──
  // Bật Enable DNS Overwrite
  {
    page: 'lan.html',
    selector: '#dns_ovwrt0, input[name="dns_overwrite"][value="1"]',
    text: 'Bước 2: Chọn Enable DNS Overwrite',
    position: 'top'
  },
  // Nhập Primary DNS: 8.8.8.8
  {
    page: 'lan.html',
    selector: '#dns_primary, input[name="dns_primary"]',
    text: 'Bước 3: Nhập Primary DNS (8.8.8.8)',
    position: 'right',
    expected: '8.8.8.8'
  },
  // Nhập Secondary DNS: 8.8.4.4
  {
    page: 'lan.html',
    selector: '#dns_secondary, input[name="dns_secondary"]',
    text: 'Bước 4: Nhập Secondary DNS (8.8.4.4)',
    position: 'right',
    expected: '8.8.4.4'
  },
  // Nhấn Apply để lưu cấu hình
  {
    page: 'lan.html',
    selector: '#btn_apply, a#btn_apply, .cfgstep a.btn',
    text: 'Bước 5: Nhấn Apply để lưu cấu hình DNS',
    position: 'top'
  }
];

window.TOOLTIPS_AC1000CV2['ac1000cv2-bai4'] = bai4_popups;
window.TOOLTIPS_AC1000CV2['LAB_AC1000CV2_04'] = bai4_popups;

if (window.DEVICE_AC1000CV2_LESSONS) {
  var targetLesson = window.DEVICE_AC1000CV2_LESSONS.find(function (l) { return l.id === 'ac1000cv2-bai4' || l.id === 'LAB_AC1000CV2_04'; });
  if (targetLesson) targetLesson.guidePopups = bai4_popups;
}
