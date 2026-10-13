/**
 * devices/ax3000c/tooltips/bai2.js — Tooltip Hướng dẫn cho Bài 2: Cấu hình WiFi (AX3000CV2, firmware 0.5.3)
 * Trang Network >> Wi-Fi >> Wi-Fi (#/network/wifi), tab Host SSID (#tab-hostssid / #pane-hostssid).
 */

if (!window.TOOLTIPS_AX3000C) window.TOOLTIPS_AX3000C = {};

(function (F) {
  function dangOTabHost(doc) { return !!doc.querySelector('#tab-hostssid.is-active'); }

  window.TOOLTIPS_AX3000C['LAB_AX3000CV2_02'] = F.menu('Wi-Fi', 'Wi-Fi', 'network/wifi', 'WIFI', 'WIFI').concat([
    // Bước 4: chỉ hiện khi đang ở tab khác
    {
      selector: '#tab-hostssid:not(.is-active)',
      text: 'Bước 4: Cấu hình mạng Host SSID',
      position: 'top',
      page: 'network/wifi'
    },
    {
      selector: '#pane-hostssid ' + F.o('SSID'),
      text: 'Bước 5: Đặt tên WIFI VD: FPT Telecom',
      position: 'right',
      page: 'network/wifi'
    },
    {
      selector: '#pane-hostssid ' + F.o('Passphrase'),
      text: 'Bước 6: Đặt mật khẩu WIFI VD: fpt12345',
      position: 'right',
      page: 'network/wifi'
    },
    {
      selector: F.nut('Apply'),
      text: 'Bước 7: Chọn Apply',
      position: 'left',
      page: 'network/wifi',
      condition: dangOTabHost
    }
  ]);
})(window.FTC_AX3000C);
