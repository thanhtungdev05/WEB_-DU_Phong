/**
 * devices/ac1000cv2/tooltips/bai5.js — Tooltip Hướng dẫn cho Bài 5: Cấu hình DHCP
 * Hiển thị đồng thời toàn bộ các bước trên cùng giao diện (theo chuẩn Bài 1)
 */

if (!window.TOOLTIPS_AC1000CV2) window.TOOLTIPS_AC1000CV2 = {};

var bai5_popups = [
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
  // Đổi IP Address: 192.168.1.1 (đổi từ mặc định 192.168.10.1)
  {
    page: 'lan.html',
    selector: '#lan_ip, input[name="lan_ip"]',
    text: 'Bước 2: Đổi IP Address thành 192.168.1.1 (đổi số 10 thành 1)',
    position: 'right',
    expected: '192.168.1.1'
  },
  // Kiểm tra Subnet Mask: 255.255.255.0
  {
    page: 'lan.html',
    selector: '#lan_mask, input[name="lan_mask"]',
    text: 'Bước 3: Kiểm tra Subnet Mask: 255.255.255.0',
    position: 'right',
    expected: '255.255.255.0'
  },
  // Chọn Enable cho DHCP Server
  {
    page: 'lan.html',
    selector: '#dhcp_enable0, input[name="dhcp_enable"][value="1"]',
    text: 'Bước 4: Chọn Enable cho DHCP Server',
    position: 'top'
  },
  // Đổi Start IP Address: 192.168.1.2
  {
    page: 'lan.html',
    selector: '#start_ip, #startip, input[name="start_ip"], input[name="startip"]',
    text: 'Bước 5: Kiểm tra/Đổi Start IP thành 192.168.1.2',
    position: 'right',
    expected: '192.168.1.2'
  },
  // Đổi End IP Address: 192.168.1.254
  {
    page: 'lan.html',
    selector: '#end_ip, #endip, input[name="end_ip"], input[name="endip"]',
    text: 'Bước 6: Kiểm tra/Đổi End IP thành 192.168.1.254',
    position: 'bottom',
    expected: '192.168.1.254'
  },
  // Nhấn Apply để áp dụng cấu hình LAN & DHCP
  {
    page: 'lan.html',
    selector: '#btn_apply, a#btn_apply, .cfgstep a.btn',
    text: 'Bước 7: Nhấn Apply để áp dụng cấu hình LAN & DHCP',
    position: 'top'
  }
];

window.TOOLTIPS_AC1000CV2['ac1000cv2-bai5'] = bai5_popups;
window.TOOLTIPS_AC1000CV2['LAB_AC1000CV2_05'] = bai5_popups;

if (window.DEVICE_AC1000CV2_LESSONS) {
  var targetLesson = window.DEVICE_AC1000CV2_LESSONS.find(function (l) { return l.id === 'ac1000cv2-bai5' || l.id === 'LAB_AC1000CV2_05'; });
  if (targetLesson) targetLesson.guidePopups = bai5_popups;
}
