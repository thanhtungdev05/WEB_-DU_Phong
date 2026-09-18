/**
 * devices/ax3000gz/tooltips/bai5.js 
 * Tooltip chỉ dẫn cho Bài 5: Cấu hình DHCP trên AX3000GZ
 */
window.TOOLTIPS_AX3000GZ = window.TOOLTIPS_AX3000GZ || {};

window.TOOLTIPS_AX3000GZ['LAB_AX3000GZ_05'] = [
  {
    selector: '#topmenu a[href*="localnetwork"]',
    text: 'Chọn Local Network',
    position: 'bottom',
    hideOnPage: 'localnetwork'
  },
  {
    selector: '#sidebarmenu a[href*="/localnetwork/lan"]',
    text: 'Chọn LAN',
    position: 'right',
    page: 'localnetwork',
    hideOnPage: 'lan'
  },
  {
    selector: '#cbi-network h3',
    text: 'Chọn DHCP Server',
    position: 'right',
    page: 'lan'
  },
  {
    selector: 'label[for="widget.cbid.network.lan.ignore.0"] + span, [id="widget.cbid.network.lan.ignore.0"]',
    text: 'Bước 1: Chọn Enable: On',
    position: 'right',
    page: 'lan'
  },
  {
    selector: '[id="widget.cbid.network.lan.ipaddr"]',
    text: 'Bước 2: Nhập LAN IP Address: 192.168.10.1',
    position: 'right',
    page: 'lan'
  },
  {
    selector: '.cbi-page-actions .cbi-button-save',
    text: 'Bước 3: Chọn Apply để lưu cấu hình',
    position: 'top',
    page: 'lan'
  }
];
