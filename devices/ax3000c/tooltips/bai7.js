/**
 * devices/ax3000c/tooltips/bai7.js — Tooltip Hướng dẫn cho Bài 7: Cấu hình Mesh wifi (AX3000CV2, firmware 0.5.3)
 * Trang Network >> Wi-Fi >> Easymesh (#/network/easymesh). Bài bắt đầu ở MeshRole = Agent
 * (ftc-dat-bai?bai=7); học viên đổi sang Controller rồi Apply.
 */

if (!window.TOOLTIPS_AX3000C) window.TOOLTIPS_AX3000C = {};

(function (F) {
  window.TOOLTIPS_AX3000C['LAB_AX3000CV2_07'] = F.menu('Wi-Fi', 'Easymesh', 'network/easymesh', 'WIFI').concat([
    {
      selector: '.el-form-item[data-ftc-nhan="Enabled"] .el-switch',
      text: 'Bước 4: Kiểm tra Enabled đang bật',
      position: 'right',
      page: 'network/easymesh'
    },
    {
      selector: F.o('MeshRole'),
      text: 'Bước 5: Chọn MeshRole là Controller',
      position: 'right',
      page: 'network/easymesh'
    },
    {
      selector: F.nut('Apply'),
      text: 'Bước 6: Chọn Apply',
      position: 'left',
      page: 'network/easymesh'
    }
  ]);
})(window.FTC_AX3000C);
