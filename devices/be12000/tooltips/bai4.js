/**
 * devices/be12000/tooltips/bai4.js
 * Tooltips cho Bài 4: Cấu hình DNS trên ONT BE12000
 */

if (!window.TOOLTIPS_BE12000) window.TOOLTIPS_BE12000 = {};

window.TOOLTIPS_BE12000['LAB_BE12000_04'] = [
  {
    selector: '#localnet:not(.SelectMenuItem)',
    text: 'Chọn Local Network',
    position: 'bottom'
  },
  {
    selector: '#dns:not(.selectClass2Menu)',
    text: 'Chọn DNS',
    position: 'right'
  },
  {
    selector: '#LocalDnsServerBar[aria-expanded="false"], #LocalDnsServer:not(:has(#LocalDnsServer_container:visible)) #LocalDnsServerBar',
    text: 'Mở mục DNS',
    position: 'top'
  },
  {
    selector: '#sub_SerIPAddress13:not(:disabled), input[id="sub_SerIPAddress13"]:not(:disabled)',
    text: 'Bước 1: Nhập IPv4 DNS Server 1: 210.245.31.220',
    position: 'right',
    expected: ['220', '8', '1']
  },
  {
    selector: '#sub_SerIPAddress23:not(:disabled), input[id="sub_SerIPAddress23"]:not(:disabled)',
    text: 'Bước 2: Nhập IPv4 DNS Server 2: 8.8.8.8',
    position: 'right',
    expected: ['8', '4', '221']
  },
  {
    selector: '#Btn_apply_LocalDnsServer:not(.disableBtn), [id="Btn_apply_LocalDnsServer"]:not(.disableBtn)',
    text: 'Bước 3: Nhấn Apply để lưu cấu hình DNS',
    position: 'top'
  }
];
