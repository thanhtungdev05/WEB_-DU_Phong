/**
 * devices/ax3000gz/tooltips/bai5.js — Tooltip Hướng dẫn cho Bài 8 - Cấu hình IGMP/Multicast (AX3000GZ)
 */

if (!window.TOOLTIPS_AX3000GZ) window.TOOLTIPS_AX3000GZ = {};

window.TOOLTIPS_AX3000GZ['LAB_AX3000GZ_08'] = [
  {
    selector: '#topmenu a[href*="internet"]',
    text: 'Bước 1: Chọn Internet',
    position: 'bottom',
    hideOnPage: 'internet'
  },
  {
    selector: '#sidebarmenu a[href*="/internet/multicast"]',
    text: 'Bước 2: Chọn Multicast',
    position: 'right',
    page: 'internet',
    hideOnPage: 'multicast'
  },
  {
    selector: '.tabs a[href*="multicastwifi"]',
    text: 'Bước 3: Chọn tab Multicast On Wi-Fi',
    position: 'right',
    page: 'multicast',
    hideOnPage: 'multicastwifi'
  },
  {
    selector: '[id="widget.cbid.json.multicastWifi.Enable.0"]',
    text: 'Bước 4: Enable: Chọn On',
    position: 'bottom',
    page: 'multicast'
  },
  {
    selector: '.cbi-page-actions .cbi-button-save',
    text: 'Bước 5: Chọn Apply để lưu cấu hình.',
    position: 'bottom',
    page: 'multicast'
  }
];
