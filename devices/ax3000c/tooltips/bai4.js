/**
 * devices/ax3000c/tooltips/bai4.js — Tooltip Hướng dẫn cho Bài 4: Cấu hình DNS (AX3000CV2, firmware 0.5.3)
 * Trang Network >> LAN >> LAN (#/network/lan). "Define custom servers" là radio Enable/Disable
 * (bản cũ là ô chọn); chọn Enable thì mới hiện DNS Server 1/2.
 */

if (!window.TOOLTIPS_AX3000C) window.TOOLTIPS_AX3000C = {};

(function (F) {
  window.TOOLTIPS_AX3000C['LAB_AX3000CV2_04'] = F.menu('LAN', 'LAN', 'network/lan').concat([
    {
      // Trỏ vào chữ Disable (radio thứ 2), bong bóng nằm bên phải nên không che chữ
      selector: '.el-form-item[data-ftc-nhan="Define custom servers"] .el-radio:last-of-type',
      text: 'Bước 1: chọn Enable',
      position: 'right',
      page: 'network/lan'
    },
    {
      selector: F.o('DNS Server 1'),
      text: 'Bước 2: nhập DNS Server 1<br>ví dụ: 210.245.31.220',
      position: 'right',
      page: 'network/lan'
    },
    {
      selector: F.o('DNS Server 2'),
      text: 'Bước 3: nhập DNS Server 2<br>ví dụ: 8.8.8.8',
      position: 'right',
      page: 'network/lan'
    },
    {
      selector: F.nut('Apply'),
      text: 'Bước 4: chọn Apply',
      position: 'left',
      page: 'network/lan'
    }
  ]);
})(window.FTC_AX3000C);
