/**
 * devices/be12000/tooltips/bai5.js
 * Tooltips cho Bài 5: Cấu hình DHCP trên ONT BE12000
 */

if (!window.TOOLTIPS_BE12000) window.TOOLTIPS_BE12000 = {};

window.TOOLTIPS_BE12000['LAB_BE12000_05'] = [
  {
    selector: '#localnet:not(.SelectMenuItem)',
    text: 'Chọn Local Network',
    position: 'bottom'
  },
  {
    selector: '#lanConfig:not(.selectClass2Menu)',
    text: 'Chọn LAN',
    position: 'bottom'
  },
  {
    selector: '#lanMgrIpv4:not(.selectClass3Menu)',
    text: 'Chọn IPv4',
    position: 'bottom'
  },
  {
    selector: '#DHCPBasicCfgBar[aria-expanded="false"], #DHCPBasicCfg:not(:has(#DHCPBasicCfg_container:visible)) #DHCPBasicCfgBar',
    text: 'Mở mục DHCP Server',
    position: 'top',
    offsetX: 120
  },
  {
    selector: 'label[for="ServerEnable1"], #ServerEnable1',
    text: 'Bước 1: Chọn On để bật DHCP Server',
    position: 'top'
  },
  {
    selector: '[id="sub_IPAddr3:DHCPBasicCfg"]:not(:disabled), input[name="sub_IPAddr3:DHCPBasicCfg"]:not(:disabled)',
    text: 'Bước 2: LAN IP Address: 192.168.1.1',
    position: 'right',
    expected: '1'
  },
  {
    selector: '#sub_SubMask3:not(:disabled), input[name="sub_SubMask3"]:not(:disabled)',
    text: 'Bước 3: Nhập Subnet Mask: 255.255.255.0',
    position: 'right',
    expected: '0'
  },
  {
    selector: '[id="sub_MinAddress3:DHCPBasicCfg"]:not(:disabled), input[name="sub_MinAddress3:DHCPBasicCfg"]:not(:disabled)',
    text: 'Bước 4: DHCP Start IP Address: 192.168.1.2',
    position: 'right',
    expected: '2'
  },
  {
    selector: '[id="sub_MaxAddress3:DHCPBasicCfg"]:not(:disabled), input[name="sub_MaxAddress3:DHCPBasicCfg"]:not(:disabled)',
    text: 'Bước 5: DHCP End IP Address: 192.168.1.254',
    position: 'right',
    expected: '254'
  },
  {
    selector: '#Btn_apply_DHCPBasicCfg:not(.disableBtn), [id="Btn_apply_DHCPBasicCfg"]:not(.disableBtn)',
    text: 'Bước 6: Nhấn Apply để lưu cấu hình DHCP',
    position: 'top'
  }
];
