/**
 * devices/ax3000gz/tooltips/bai6.js
 * Tooltip chỉ dẫn cho Bài 6: Cấu hình Port Forwarding trên AX3000GZ
 */
if (!window.TOOLTIPS_AX3000GZ) window.TOOLTIPS_AX3000GZ = {};

window.TOOLTIPS_AX3000GZ['LAB_AX3000GZ_06'] = [
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
    selector: '.tabs a[href*="forwards"]',
    text: 'Bước 3: Chọn tab Port Forwards',
    position: 'bottom',
    page: 'security',
    hideOnPage: 'forwards'
  },
  {
    selector: '.cbi-button-add',
    text: 'Bước 4: Bấm Add để thêm Port Forwarding',
    position: 'top',
    page: 'forwards'
  },
  {
    selector: '[id="modal_field_name"]',
    text: 'Bước 5: Nhập Name: FPT Telecom',
    position: 'right',
    page: 'forwards'
  },
  {
    selector: '[id="modal_field_enabled"] label:nth-child(2)',
    text: 'Bước 6: Chọn Enable: On',
    position: 'right',
    page: 'forwards'
  },
  {
    selector: '[id="modal_field_proto"]',
    text: 'Bước 7: Chọn Protocol: TCP/UDP',
    position: 'right',
    page: 'forwards'
  },
  {
    selector: '[id="modal_field_src_ip"]',
    text: 'Bước 8: Nhập WAN Host IP Address: 0.0.0.0/0',
    position: 'right',
    page: 'forwards'
  },
  {
    selector: '[id="modal_field_dest_ip"]',
    text: 'Bước 9: Nhập LAN Host: 192.168.1.254',
    position: 'right',
    page: 'forwards'
  },
  {
    selector: '[id="modal_field_src_dport"]',
    text: 'Bước 10: Nhập WAN Port: 8080',
    position: 'right',
    page: 'forwards'
  },
  {
    selector: '[id="modal_field_dest_port"]',
    text: 'Bước 11: Nhập LAN Host Port: 8080',
    position: 'right',
    page: 'forwards'
  },
  {
    selector: '#modal_overlay .cbi-button-save, .modal .cbi-button-save',
    text: 'Bước 12: Chọn Apply để lưu',
    position: 'bottom',
    page: 'forwards'
  }
];
