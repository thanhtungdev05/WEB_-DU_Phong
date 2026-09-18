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
    selector: '#sub_SerIPAddress10:not(:disabled), input[id="sub_SerIPAddress10"]:not(:disabled)',
    text: 'Bước 1: Nhập DNS Server 1 (Octet 1): 210',
    position: 'right',
    expected: ['210', '8', '1']
  },
  {
    selector: '#sub_SerIPAddress11:not(:disabled), input[id="sub_SerIPAddress11"]:not(:disabled)',
    text: 'Bước 2: Nhập DNS Server 1 (Octet 2): 245',
    position: 'right',
    expected: ['245', '8', '1']
  },
  {
    selector: '#sub_SerIPAddress12:not(:disabled), input[id="sub_SerIPAddress12"]:not(:disabled)',
    text: 'Bước 3: Nhập DNS Server 1 (Octet 3): 31',
    position: 'right',
    expected: ['31', '8', '1']
  },
  {
    selector: '#sub_SerIPAddress13:not(:disabled), input[id="sub_SerIPAddress13"]:not(:disabled)',
    text: 'Bước 4: Nhập DNS Server 1 (Octet 4): 220',
    position: 'right',
    expected: ['220', '221', '8', '1']
  },
  {
    selector: '#sub_SerIPAddress20:not(:disabled), input[id="sub_SerIPAddress20"]:not(:disabled)',
    text: 'Bước 5: Nhập DNS Server 2 (Octet 1): 8',
    position: 'right',
    expected: ['8', '1', '210']
  },
  {
    selector: '#sub_SerIPAddress21:not(:disabled), input[id="sub_SerIPAddress21"]:not(:disabled)',
    text: 'Bước 6: Nhập DNS Server 2 (Octet 2): 8',
    position: 'right',
    expected: ['8', '1', '245']
  },
  {
    selector: '#sub_SerIPAddress22:not(:disabled), input[id="sub_SerIPAddress22"]:not(:disabled)',
    text: 'Bước 7: Nhập DNS Server 2 (Octet 3): 8',
    position: 'right',
    expected: ['8', '4', '1', '31']
  },
  {
    selector: '#sub_SerIPAddress23:not(:disabled), input[id="sub_SerIPAddress23"]:not(:disabled)',
    text: 'Bước 8: Nhập DNS Server 2 (Octet 4): 8',
    position: 'right',
    expected: ['8', '4', '1', '221', '220']
  },
  {
    selector: '#Btn_apply_LocalDnsServer:not(.disableBtn), [id="Btn_apply_LocalDnsServer"]:not(.disableBtn)',
    text: 'Bước 9: Nhấn Apply để lưu cấu hình DNS',
    position: 'top'
  }
];
