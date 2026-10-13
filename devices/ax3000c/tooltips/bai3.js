/**
 * devices/ax3000c/tooltips/bai3.js — Tooltip Hướng dẫn cho Bài 3: Cấu hình WiFi IoT (AX3000CV2, firmware 0.5.3)
 * Firmware 0.5.3: mạng IoT là tab Specific SSID (tên mặc định "...-IOT", mặc định TẮT) —
 * anh Huynn chọn làm ở tab này (bản cũ làm ở Guest SSID). Phải bật SSID Enabled thì mới
 * hiện các ô SSID / Encryption / Passphrase.
 */

if (!window.TOOLTIPS_AX3000C) window.TOOLTIPS_AX3000C = {};

(function (F) {
  function dangOTabSpecific(doc) { return !!doc.querySelector('#tab-specificssid.is-active'); }

  window.TOOLTIPS_AX3000C['LAB_AX3000CV2_03'] = F.menu('Wi-Fi', 'Wi-Fi', 'network/wifi', 'WIFI', 'WIFI').concat([
    {
      selector: '#tab-specificssid:not(.is-active)',
      text: 'Bước 4: Cấu hình mạng Specific SSID (cho IoT)',
      position: 'top',
      page: 'network/wifi'
    },
    // Bước 5: chỉ hiện khi công tắc còn tắt
    {
      selector: '#pane-specificssid .el-form-item[data-ftc-nhan="SSID Enabled"] .el-switch:not(.is-checked)',
      text: 'Bước 5: Bật SSID Enabled',
      position: 'right',
      page: 'network/wifi'
    },
    {
      selector: '#pane-specificssid ' + F.o('SSID'),
      text: 'Bước 6: Đặt tên WIFI IoT VD: FPT IoT',
      position: 'right',
      page: 'network/wifi'
    },
    {
      selector: '#pane-specificssid ' + F.o('Passphrase'),
      text: 'Bước 7: Đặt mật khẩu WIFI IoT VD: fptiot123',
      position: 'right',
      page: 'network/wifi'
    },
    {
      selector: F.nut('Apply'),
      text: 'Bước 8: Chọn Apply',
      position: 'left',
      page: 'network/wifi',
      condition: dangOTabSpecific
    }
  ]);
})(window.FTC_AX3000C);
