/**
 * devices/ax3000gz/tooltips/bai1.js 
 * Tooltips cho Bài 1: Cấu hình PPPoE trên AX3000GZ
 */
if (!window.TOOLTIPS_AX3000GZ) window.TOOLTIPS_AX3000GZ = {};

window.TOOLTIPS_AX3000GZ['LAB_AX3000GZ_01'] = [
  {
    selector: '#topmenu a[href*="internet"]',
    text: 'Bước 1: Chọn Internet',
    position: 'bottom',
    page: 'home'
  },
  {
    selector: '#WANUrl, #sidebarmenu a[href*="/internet/wan"]',
    text: 'Bước 2: Chọn WAN',
    position: 'right',
    hideOnPage: 'wan'
  },
  {
    selector: '[id="widget.cbid.network.wan.username"], [name="cbid.network.wan.username"]',
    text: 'Bước 3: Nhập Username: sgfdl-123456-789',
    position: 'right',
    page: 'wan'
  },
  {
    selector: '[id="widget.cbid.network.wan.password"], [name="cbid.network.wan.password"]',
    text: 'Bước 4: Nhập Password: fpt12345',
    position: 'right',
    page: 'wan'
  },
  {
    selector: '.cbi-button-save',
    text: 'Bước 5: Chọn Apply',
    position: 'bottom',
    page: 'wan'
  }
];

