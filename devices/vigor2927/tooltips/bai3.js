/**
 * devices/vigor2927/tooltips/bai3.js — Tooltip Hướng dẫn cho Bài 3: Cấu hình Bind IP to MAC
 */

if (!window.TOOLTIPS_VIGOR2927) window.TOOLTIPS_VIGOR2927 = {};

function isVigor2927Bai3Added(doc) {
  if (!doc) return false;
  try {
    var win = doc.defaultView || doc.parentWindow;
    if (win && Array.isArray(win.aryIpBindMac) && win.aryIpBindMac.length > 0) {
      for (var i = 0; i < win.aryIpBindMac.length; i++) {
        var item = win.aryIpBindMac[i];
        if (item && item[0] === '192.168.1.100') return true;
      }
    }
    var slt = doc.querySelector('select[name="sltIpMac"]');
    if (slt && slt.options) {
      for (var j = 0; j < slt.options.length; j++) {
        var txt = slt.options[j].text || slt.options[j].innerText || '';
        if (txt.includes('192.168.1.100')) return true;
      }
    }
    if (doc._ftcLastAddIp === '192.168.1.100' || (window._ftcLastAddIp === '192.168.1.100' && (doc._ftcHasClickedAdd || window._ftcHasClickedAdd))) {
      return true;
    }
  } catch(e) {}
  return false;
}

window.TOOLTIPS_VIGOR2927['vg2927-bai3'] = [
  {
    selector: '#menu-lan:not(.open) .menu-text, #menu-lan:not(.open)',
    text: 'Bước 1: chọn LAN',
    position: 'bottom'
  },
  {
    selector: '#sub-lan:not(.hidden) #menu-lan-ipbmac .menu-text, #sub-lan:not(.hidden) #menu-lan-ipbmac',
    text: 'Bước 2: chọn Blind IP to MAC',
    position: 'bottom',
    hideOnPage: 'ipbmac'
  },
  {
    selector: '#lbl-ipbmac-disable, b:contains("Disable")',
    text: 'Bước 3: chọn Enable',
    position: 'right',
    offsetX: 8,
    condition: function(doc) { return !isVigor2927Bai3Added(doc); }
  },
  {
    selector: '#txt-ipbmac-ip, input[name="sIpAddress"]',
    text: 'Bước 4: nhập địa chỉ IP và MAC muốn cố định<br>ví dụ IP Address 192.168.1.100<br>MAC Address AA-BB-CC-DD-EE-FF<br>==>chọn Add để lưu',
    position: 'top',
    condition: function(doc) { return !isVigor2927Bai3Added(doc); }
  },
  {
    selector: '#btn-ipbmac-ok, input[name="btnOk"], input[value="OK"]',
    text: 'Bước 5: chọn OK',
    position: 'top',
    condition: function(doc) { return isVigor2927Bai3Added(doc); }
  }
];
