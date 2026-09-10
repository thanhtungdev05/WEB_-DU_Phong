/**
 * devices/ax3000s/tooltips/bai6.js — Tooltip Hướng dẫn cho Bài 6: Cấu hình Port Forwarding
 */

if (!window.TOOLTIPS_AX3000S) window.TOOLTIPS_AX3000S = {};

window.TOOLTIPS_AX3000S['LAB_AX3000S_06'] = [
  // Chọn Advanced
  {
    selector: "a[href*='/advanced'], #Sky_Advanced span, #Sky_Advanced",
    text: 'Bước 1: Chọn Advanced',
    position: 'bottom',
    hideOnPage: 'advanced'
  },
  // Chọn NAT
  {
    selector: "a[href*='/portforward'], a[href*='/nat'], #layer2-leaf-nat .dt, #layer2-leaf-nat",
    text: 'Bước 2: Chọn NAT',
    position: 'right',
    hideOnPage: 'nat' // Hide when on any NAT subpage
  },
  // Chọn Port Forwarding
  {
    selector: "a[href*='/portforward'], #Sky_Port_Forwarding, #layer2-leaf-nat #Sky_Port_Forwarding",
    text: 'Bước 3: Chọn Port Forwarding',
    position: 'bottom',
    page: 'dmz' // Show this tooltip when user lands on dmz (default for NAT)
  },
  // Bước 1: Nhấn Add
  {
    selector: 'button[onclick="add_vircfg()"]',
    text: 'Bước 4: Nhấn Add',
    position: 'bottom',
    page: 'portforward'
  },
  // Bước 2: Tick Enable
  {
    selector: '#VirEnable',
    text: 'Bước 5: Tick Enable',
    position: 'top',
    page: 'portforward',
    expected: 'on'
  },
  // Bước 3: Tên dịch vụ (VD: NAT FPT)
  {
    selector: '#cusSrvName',
    text: 'Bước 6: Nhập Tên dịch vụ (VD: NAT FPT)',
    position: 'right',
    page: 'portforward',
    expected: 'NAT FPT'
  },
  // Bước 4: Nhập Internal IP 192.168.1.100
  {
    selector: '#sIp',
    text: 'Bước 7: Nhập Internal IP 192.168.1.100',
    position: 'right',
    page: 'portforward',
    expected: '192.168.1.100'
  },
  // Bước 5: Nhập giá trị 0 (Lease Duration)
  {
    selector: '#leasetime',
    text: 'Bước 8: Nhập giá trị 0',
    position: 'right',
    page: 'portforward',
    expected: '0'
  },
  // Bước 6: Chọn Protocol TCP/UDP
  {
    selector: '#Proto',
    text: 'Bước 9: Chọn Protocol TCP/UDP',
    position: 'right',
    page: 'portforward',
    expected: '0' // value for TCP/UDP is '0'
  },
  // Bước 7: External Port (WAN) 8080
  {
    selector: '#ex_port',
    text: 'Bước 10: Nhập External Port (WAN) 8080',
    position: 'right',
    page: 'portforward',
    expected: '8080'
  },
  // Bước 8: Internal Port (LAN) 8080
  {
    selector: '#in_port',
    text: 'Bước 11: Nhập Internal Port (LAN) 8080',
    position: 'right',
    page: 'portforward',
    expected: '8080'
  },
  // Bước 9: Nhấn Save & Apply
  {
    selector: '#addPortApply_btn',
    text: 'Bước 12: Nhấn Save & Apply',
    position: 'top',
    page: 'portforward'
  }
];
