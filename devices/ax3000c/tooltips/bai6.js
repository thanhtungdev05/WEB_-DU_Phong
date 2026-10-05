/**
 * devices/ax3000c/tooltips/bai6.js — Tooltip Hướng dẫn cho Bài 6: Cấu hình Port Forwarding (AX3000CV2, firmware 0.5.3)
 * Trang Network >> Access >> Port Forwarding (#/network/portfwd). Bấm Add thêm dòng NGAY TRONG BẢNG.
 * Firmware 0.5.3 không có cột Rule Name (anh Huynn chọn bỏ, thay bằng tiêu chí Enable — học viên
 * tự bật vì dòng mới mặc định tắt).
 * Ô Device/IP là ô chọn từ danh sách thiết bị: đáp án là dòng Admin-PC (192.168.100.109).
 */

if (!window.TOOLTIPS_AX3000C) window.TOOLTIPS_AX3000C = {};

(function (F) {
  window.TOOLTIPS_AX3000C['LAB_AX3000CV2_06'] = F.menu('Access', 'Port Forwarding', 'network/portfwd').concat([
    {
      selector: F.nut('Add'),
      text: 'Bước 1: chọn Add để thêm rule',
      position: 'bottom',
      page: 'network/portfwd'
    },
    // Dòng mới do Add tạo có Enable TẮT (mã firmware: enabled undefined -> false) — học viên tự bật.
    // Đặt phía trên để không che nút Add; chỉ hiện khi công tắc còn tắt.
    {
      selector: '.el-table__body td[data-ftc-cot="Enable"] .el-switch:not(.is-checked)',
      text: 'Bước 2: Bật Enable',
      position: 'top',
      page: 'network/portfwd'
    },
    // Bước 3–6 cùng một hàng, trỏ thẳng vào ô (chữ đã ngắn nên không đè nhau)
    {
      selector: F.cot('Protocol'),
      text: 'Bước 3: chọn TCP+UDP',
      position: 'bottom',
      page: 'network/portfwd'
    },
    {
      selector: F.cot('External port'),
      text: 'Bước 4: nhập 8080',
      position: 'bottom',
      page: 'network/portfwd'
    },
    {
      selector: F.cot('Device/IP'),
      text: 'Bước 5: nhập 192.168.100.109',
      position: 'bottom',
      page: 'network/portfwd'
    },
    {
      selector: F.cot('Internal port'),
      text: 'Bước 6: nhập 80',
      position: 'bottom',
      page: 'network/portfwd'
    },
    {
      selector: F.nut('Apply'),
      text: 'Bước 7: chọn Apply',
      position: 'left',
      page: 'network/portfwd'
    }
  ]);
})(window.FTC_AX3000C);
