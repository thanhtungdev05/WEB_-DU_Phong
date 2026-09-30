/**
 * devices/be12000/tooltips/bai4.js
 * Tooltips cho Bài 4: Cấu hình DNS trên ONT BE12000
 */

if (!window.TOOLTIPS_BE12000) window.TOOLTIPS_BE12000 = {};

window.TOOLTIPS_BE12000['LAB_BE12000_04'] = [
  {
    selector: '#localnet:not(.SelectMenuItem)',
    text: 'Bước 1: Chọn Local Network',
    position: 'bottom'
  },
  {
    selector: '#dns:not(.selectClass2Menu)',
    text: 'Bước 2: Chọn DNS',
    position: 'right'
  },
  {
    selector: '#LocalDnsServerBar[aria-expanded="false"], #LocalDnsServer:not(:has(#LocalDnsServer_container:visible)) #LocalDnsServerBar',
    text: 'Bước 3: Mở mục DNS',
    position: 'right',
    targetWidth: 65
  },
  {
    selector: '#sub_SerIPAddress13:not(:disabled), input[id="sub_SerIPAddress13"]:not(:disabled)',
    text: 'Bước 4: Nhập IPv4 DNS Server 1: 210.245.31.220 (hoặc 8.8.8.8)',
    position: 'right'
  },
  {
    selector: '#sub_SerIPAddress23:not(:disabled), input[id="sub_SerIPAddress23"]:not(:disabled)',
    text: 'Bước 5: Nhập IPv4 DNS Server 2: 8.8.8.8 (hoặc 8.8.4.4)',
    position: 'right'
  },
  {
    selector: '#Btn_apply_LocalDnsServer:not(.disableBtn), [id="Btn_apply_LocalDnsServer"]:not(.disableBtn)',
    text: 'Bước 6: Nhấn Apply để lưu cấu hình DNS',
    position: 'top'
  }
];
