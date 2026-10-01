/**
 * devices/ax3000gz/tooltips/bai9.js — Tooltip Hướng dẫn cho Bài 9: Cấu hình Chặn MAC (AX3000GZ)
 */

if (!window.TOOLTIPS_AX3000GZ) window.TOOLTIPS_AX3000GZ = {};

window.TOOLTIPS_AX3000GZ['LAB_AX3000GZ_09'] = [
  {
    selector: '#topmenu a[href*="internet"]',
    text: 'Bước 1: Chọn Internet',
    position: 'bottom',
    hideOnPage: 'internet'
  },
  {
    selector: '#sidebarmenu a[href*="/internet/security"]',
    text: 'Bước 2: Chọn Security',
    position: 'right',
    page: 'internet',
    hideOnPage: 'security'
  },
  {
    selector: '.tabs a[href*="/security/filterCriteria"]',
    text: 'Bước 3: Chọn Filter Criteria',
    position: 'bottom',
    page: 'security',
    hideOnPage: 'filterCriteria'
  },
  {
    selector: '[id="view-container-1784602002206-bemo4"] h3',
    text: 'Bước 4: Chọn MAC Filter',
    position: 'top',
    page: 'filterCriteria'
  },
  {
    selector: '[id="view-container-1784602002206-bemo4"] .cbi-button-add',
    text: 'Bước 5: Chọn Add',
    position: 'right',
    page: 'filterCriteria'
  },
  {
    selector: '[id="modal_field_enabled"] label:last-child',
    text: 'Bước 6: Enable: Chọn On',
    position: 'right',
    page: 'filterCriteria'
  },
  {
    selector: '[id="modal_field_name"]',
    text: 'Bước 7: Nhập Name: Blacklist / Deny',
    position: 'right',
    page: 'filterCriteria'
  },
  {
    selector: '[id="modal_field_src_mac"]',
    text: 'Bước 8: Nhập Source MAC Address: AA:BB:CC:DD:EE:FF',
    position: 'right',
    page: 'filterCriteria'
  },
  {
    selector: '[id="modal_field_start_time"]',
    text: 'Bước 9: Nhập Start Time: 08:00:00 AM',
    position: 'right',
    page: 'filterCriteria'
  },
  {
    selector: '[id="modal_field_stop_time"]',
    text: 'Bước 10: Nhập End Time: 05:00:00 PM',
    position: 'right',
    page: 'filterCriteria'
  },
  {
    selector: '[id="modal_field_weekdays"]',
    text: 'Bước 11: Chọn ngày trong tuần (Tích chọn thứ 2, 3, 4, 5, 6)',
    position: 'bottom',
    page: 'filterCriteria'
  },
  {
    selector: '.modal .cbi-page-actions .cbi-button-save',
    text: 'Bước 12: Chọn Apply để lưu cấu hình',
    position: 'bottom',
    page: 'filterCriteria'
  }
];
