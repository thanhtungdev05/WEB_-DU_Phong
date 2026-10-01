/**
 * devices/ax3000gz/tooltips/bai4.js
 * Tooltip chỉ dẫn cho Bài 4: Cấu hình DNS trên AX3000GZ
 */
if (!window.TOOLTIPS_AX3000GZ) window.TOOLTIPS_AX3000GZ = {};

window.TOOLTIPS_AX3000GZ['LAB_AX3000GZ_04'] = [
  {
    selector: '#topmenu a[href*="localnetwork"]',
    text: 'Bước 1: Chọn Local Network',
    position: 'bottom',
    hideOnPage: 'localnetwork'
  },
  {
    selector: '#sidebarmenu a[href*="/localnetwork/lan"]',
    text: 'Bước 2: Chọn LAN',
    position: 'right',
    page: 'localnetwork',
    hideOnPage: 'lan'
  },
  {
    selector: '#cbi-network h3',
    text: 'Bước 3: Chọn DHCP Server',
    position: 'right',
    page: 'lan'
  },
  {
    selector: '[id="widget.cbid.network.lan.Primary_DNS"]',
    text: 'Bước 4: Nhập Primary DNS: 8.8.8.8',
    position: 'right',
    page: 'lan'
  },
  {
    selector: '[id="widget.cbid.network.lan.Secondary_DNS"]',
    text: 'Bước 5: Nhập Secondary DNS: 8.8.4.4',
    position: 'right',
    page: 'lan'
  },
  {
    selector: '.cbi-page-actions .cbi-button-save',
    text: 'Bước 6: Chọn Apply để lưu cấu hình',
    position: 'top',
    page: 'lan'
  }
];
