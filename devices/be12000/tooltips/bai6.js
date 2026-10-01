/**
 * devices/be12000/tooltips/bai6.js
 * Tooltips cho Bài 6: Cấu hình Port Forwarding trên ONT BE12000
 */

if (!window.TOOLTIPS_BE12000) window.TOOLTIPS_BE12000 = {};

window.TOOLTIPS_BE12000['LAB_BE12000_06'] = [
  {
    selector: '#internet:not(.SelectMenuItem)',
    text: 'Bước 1: Chọn Internet',
    position: 'bottom'
  },
  {
    selector: '#security:not(.selectClass2Menu)',
    text: 'Bước 2: Chọn Security',
    position: 'bottom'
  },
  {
    selector: '#portForwarding:not(.selectClass3Menu)',
    text: 'Bước 3: Chọn Port Forwarding',
    position: 'bottom'
  },
  {
    selector: '[id="Alias:0"]:not(:disabled), div[id^="template_PortForwarding"]:not(#template_PortForwarding) [id^="Alias"]:not(:disabled)',
    text: 'Bước 4: Nhập Name: NAT FPT',
    position: 'right',
    expected: 'NAT FPT'
  },
  {
    selector: '[id="Protocol:0"]:not(:disabled), div[id^="template_PortForwarding"]:not(#template_PortForwarding) [id^="Protocol"]:not(:disabled)',
    text: 'Bước 5: Chọn Protocol: TCP, UDP hoặc TCP/UDP',
    position: 'right',
    expected: ['TCP', 'UDP', 'BOTH', 'TCP&UDP', 'TCP+UDP']
  },
  {
    selector: '[id="InternalClient:0"]:not(:disabled), div[id^="template_PortForwarding"]:not(#template_PortForwarding) [id^="InternalClient"]:not(:disabled)',
    text: 'Bước 6: Nhập LAN Host: 192.168.1.100',
    position: 'right',
    expected: '192.168.1.100'
  },
  {
    selector: '[id="ExternalPortEndRange:0"]:not(:disabled), div[id^="template_PortForwarding"]:not(#template_PortForwarding) [id^="ExternalPortEndRange"]:not(:disabled)',
    text: 'Bước 7: Nhập WAN Port: 8080 (chỉ vào ô cuối cùng)',
    position: 'right',
    expected: '8080'
  },
  {
    selector: '[id="InternalPortEndRange:0"]:not(:disabled), div[id^="template_PortForwarding"]:not(#template_PortForwarding) [id^="InternalPortEndRange"]:not(:disabled)',
    text: 'Bước 8: Nhập LAN Host Port: 8080 (chỉ vào ô cuối cùng)',
    position: 'right',
    expected: '8080'
  },
  {
    selector: '[id="Btn_apply_PortForwarding:0"]:not(.disableBtn), div[id^="template_PortForwarding"]:not(#template_PortForwarding) [id^="Btn_apply_PortForwarding"]:not(.disableBtn)',
    text: 'Bước 9: Nhấn Apply để lưu cấu hình',
    position: 'top'
  }
];
