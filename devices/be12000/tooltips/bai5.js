/**
 * devices/be12000/tooltips/bai5.js
 * Tooltips cho Bài 5: Cấu hình DHCP trên ONT BE12000
 */

if (!window.TOOLTIPS_BE12000) window.TOOLTIPS_BE12000 = {};

window.TOOLTIPS_BE12000['LAB_BE12000_05'] = [
  {
    selector: '#localnet:not(.SelectMenuItem)',
    text: 'Bước 1: Chọn Local Network',
    position: 'bottom'
  },
  {
    selector: '#lanConfig:not(.selectClass2Menu)',
    text: 'Bước 2: Chọn LAN',
    position: 'bottom'
  },
  {
    selector: '#lanMgrIpv4:not(.selectClass3Menu)',
    text: 'Bước 3: Chọn IPv4',
    position: 'bottom'
  },
  {
    selector: '#DHCPBasicCfgBar[aria-expanded="false"], #DHCPBasicCfg:not(:has(#DHCPBasicCfg_container:visible)) #DHCPBasicCfgBar',
    text: 'Bước 4: Mở mục DHCP Server',
    position: 'right',
    targetWidth: 160
  },
  {
    selector: 'label[for="ServerEnable1"], #ServerEnable1',
    text: 'Bước 5: Chọn On để bật DHCP Server',
    position: 'top',
    condition: function(doc) {
      const el = doc.querySelector('#ServerEnable1');
      return !el || !el.checked;
    }
  },
  {
    selector: '[id="sub_IPAddr3:DHCPBasicCfg"]:not(:disabled), input[name="sub_IPAddr3:DHCPBasicCfg"]:not(:disabled)',
    text: 'Bước 6: Đổi LAN IP Address: Nhập 10 vào ô thứ 3 (để thành 192.168.10.1)',
    position: 'right',
    condition: function(doc) {
      const el = doc.querySelector('[id="sub_IPAddr2:DHCPBasicCfg"]');
      return !el || el.value.trim() !== '10';
    }
  },
  {
    selector: '#Btn_apply_DHCPBasicCfg:not(.disableBtn), [id="Btn_apply_DHCPBasicCfg"]:not(.disableBtn)',
    text: 'Bước 7: Nhấn Apply để lưu cấu hình DHCP',
    position: 'top'
  }
];
