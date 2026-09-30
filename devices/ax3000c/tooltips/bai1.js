/**
 * devices/ax3000c/tooltips/bai1.js — Tooltip Hướng dẫn cho Bài 1: Cấu hình PPPoE (AX3000CV2, firmware 0.5.3)
 * Trang Network >> WAN >> WAN (#/network/wan). Selector theo nhãn data-ftc-* (xem ftc_chung.js).
 */

if (!window.TOOLTIPS_AX3000C) window.TOOLTIPS_AX3000C = {};

(function (F) {
  window.TOOLTIPS_AX3000C['LAB_AX3000CV2_01'] = F.menu('WAN', 'WAN', 'network/wan').concat([
    // Bước 1: Chọn PPPOE ở ô Connection Type (chỉ hiện khi đã vào trang WAN)
    {
      selector: F.o('Connection Type'),
      text: 'Bước 1: Chọn PPPOE',
      position: 'right',
      page: 'network/wan'
    },
    {
      selector: F.o('PPP Username'),
      text: 'Bước 2: nhập tên VD: sgfdl-123456-789',
      position: 'right',
      page: 'network/wan'
    },
    {
      selector: F.o('PPP Password'),
      text: 'Bước 3: Nhập mật khẩu VD: d123456',
      position: 'right',
      page: 'network/wan'
    },
    // Firmware 0.5.3 dùng nút Apply (bản cũ ghi "SAVE")
    {
      selector: F.nut('Apply'),
      text: 'Bước 4: Chọn Apply',
      position: 'left',
      page: 'network/wan'
    }
  ]);
})(window.FTC_AX3000C);
