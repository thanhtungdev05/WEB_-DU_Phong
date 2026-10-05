/**
 * devices/ax3000c/tooltips/bai5.js — Tooltip Hướng dẫn cho Bài 5: Cấu hình DHCP (AX3000CV2, firmware 0.5.3)
 * Trang Network >> LAN >> LAN (#/network/lan). Bài bắt đầu ở IP LAN 192.168.1.1 (ftc-dat-bai?bai=5);
 * sửa IP rồi rời ô thì firmware tự nhảy dải DHCP: .2 -> .254. Đáp án DHCP end là .249
 * (anh Huynn sửa lại 2026-09-26, trước đó chốt nhầm .254).
 */

if (!window.TOOLTIPS_AX3000C) window.TOOLTIPS_AX3000C = {};

(function (F) {
  window.TOOLTIPS_AX3000C['LAB_AX3000CV2_05'] = F.menu('LAN', 'LAN', 'network/lan').concat([
    {
      selector: F.o('Router LAN IPv4 Address'),
      text: 'Bước 1: nhập 192.168.10.1',
      position: 'right',
      page: 'network/lan'
    },
    {
      selector: F.o('Subnet mask'),
      text: 'Bước 2: nhập 255.255.255.0',
      position: 'right',
      page: 'network/lan'
    },
    {
      selector: F.o('DHCP start address'),
      text: 'Bước 3: nhập 192.168.10.2',
      position: 'right',
      page: 'network/lan'
    },
    {
      selector: F.o('DHCP end address'),
      text: 'Bước 4: nhập 192.168.10.254',
      position: 'right',
      page: 'network/lan'
    },
    {
      selector: F.nut('Apply'),
      text: 'Bước 5: chọn Apply',
      position: 'left',
      page: 'network/lan'
    }
  ]);
})(window.FTC_AX3000C);
