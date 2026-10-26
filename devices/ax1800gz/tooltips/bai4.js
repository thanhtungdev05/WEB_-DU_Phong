/**
 * devices/ax1800gz/tooltips/bai4.js
 * Tooltips cho Bài 4: Cấu hình DNS trên ONT AX1800GZ
 */

if (!window.TOOLTIPS_AX1800GZ) window.TOOLTIPS_AX1800GZ = {};

window.TOOLTIPS_AX1800GZ['LAB_AX1800GZ_04'] = [
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
    selector: '#sub_DNSServer13:not(:disabled), input[name="sub_DNSServer13"]:not(:disabled)',
    text: 'Bước 5: Nhập Primary DNS: 210.245.31.220 (hoặc 8.8.8.8)',
    position: 'right',
    condition: function (doc) {
      var parts = [];
      for (var j = 0; j < 4; j++) {
        var el = doc.querySelector('#sub_DNSServer1' + j) || doc.querySelector('input[name="sub_DNSServer1' + j + '"]');
        parts.push(el ? el.value.trim() : '');
      }
      var ip = parts.join('.');
      var valid = ['210.245.31.220', '210.245.31.221', '8.8.8.8', '1.1.1.1'];
      return valid.indexOf(ip) === -1;
    }
  },
  {
    selector: '#sub_DNSServer23:not(:disabled), input[name="sub_DNSServer23"]:not(:disabled)',
    text: 'Bước 6: Nhập Secondary DNS: 8.8.8.8 (hoặc 8.8.4.4)',
    position: 'right',
    condition: function (doc) {
      var p2 = [];
      for (var k = 0; k < 4; k++) {
        var el2 = doc.querySelector('#sub_DNSServer2' + k) || doc.querySelector('input[name="sub_DNSServer2' + k + '"]');
        p2.push(el2 ? el2.value.trim() : '');
      }
      var valid2 = ['8.8.8.8', '8.8.4.4', '210.245.31.221', '210.245.31.220', '1.1.1.1'];
      return valid2.indexOf(p2.join('.')) === -1;
    }
  },
  {
    selector: '#Btn_apply_DHCPBasicCfg:not(.disableBtn), [id="Btn_apply_DHCPBasicCfg"]:not(.disableBtn)',
    text: 'Bước 7: Nhấn Apply để lưu cấu hình DNS',
    position: 'top',
    condition: function (doc) {
      var p1 = [];
      for (var j = 0; j < 4; j++) {
        var el1 = doc.querySelector('#sub_DNSServer1' + j) || doc.querySelector('input[name="sub_DNSServer1' + j + '"]');
        p1.push(el1 ? el1.value.trim() : '');
      }
      var valid1 = ['210.245.31.220', '210.245.31.221', '8.8.8.8', '1.1.1.1'];
      if (valid1.indexOf(p1.join('.')) === -1) return false;

      var p2 = [];
      for (var k = 0; k < 4; k++) {
        var el2 = doc.querySelector('#sub_DNSServer2' + k) || doc.querySelector('input[name="sub_DNSServer2' + k + '"]');
        p2.push(el2 ? el2.value.trim() : '');
      }
      var valid2 = ['8.8.8.8', '8.8.4.4', '210.245.31.221', '210.245.31.220', '1.1.1.1'];
      if (valid2.indexOf(p2.join('.')) === -1) return false;

      var isSaved = Boolean(
        doc._ftcIsSaved ||
        (doc.location && doc.location.search && doc.location.search.includes('save_success=1')) ||
        (window.top && window.top._hasSuccHintStored) ||
        window._hasSuccHintStored
      );
      return !isSaved;
    }
  }
];
