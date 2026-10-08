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

function isVigor2927Bai3Enabled(doc) {
  if (!doc) return false;
  var en = doc.querySelector('input[name="sIpBndMacEnable"]:checked');
  return !!(en && en.value === '1');
}

function isVigor2927Bai3MacMatch(val) {
  if (!val) return false;
  var cleaned = String(val).replace(/[-:]/g, '').trim().toUpperCase();
  return cleaned === 'AABBCCDDEEFF';
}

function getVigor2927InputVal(doc, name) {
  if (!doc) return '';
  var el = doc.querySelector('input[name="' + name + '"]');
  return el ? (el.value || '').trim() : '';
}

window.TOOLTIPS_VIGOR2927['vg2927-bai3'] = [
  {
    selector: '#menu-lan:not(.open) .menu-text, #menu-lan:not(.open)',
    text: 'Bước 1: chọn LAN',
    position: 'bottom',
    hideOnPage: 'ipbmac'
  },
  {
    selector: '#sub-lan:not(.hidden) #menu-lan-ipbmac .menu-text, #sub-lan:not(.hidden) #menu-lan-ipbmac',
    text: 'Bước 2: chọn Bind IP to MAC',
    position: 'bottom',
    hideOnPage: 'ipbmac'
  },
  {
    selector: '#lbl-ipbmac-disable, input[name="sIpBndMacEnable"][value="0"] ~ b, text:Disable, input[name="sIpBndMacEnable"][value="1"]',
    text: 'Bước 3: chọn Enable',
    position: 'right',
    offsetX: 8,
    condition: function(doc) {
      return !isVigor2927Bai3Added(doc) && !isVigor2927Bai3Enabled(doc);
    }
  },
  {
    selector: '#txt-ipbmac-ip, input[name="sIpAddress"]',
    text: 'Bước 4: nhập IP Address: 192.168.1.100',
    position: 'top',
    condition: function(doc) {
      return isVigor2927Bai3Enabled(doc) && !isVigor2927Bai3Added(doc) && (getVigor2927InputVal(doc, 'sIpAddress') !== '192.168.1.100');
    }
  },
  {
    selector: 'input[name="txtMac"]',
    text: 'Bước 5: nhập MAC Address: AA-BB-CC-DD-EE-FF',
    position: 'top',
    condition: function(doc) {
      return isVigor2927Bai3Enabled(doc) && !isVigor2927Bai3Added(doc) &&
        (getVigor2927InputVal(doc, 'sIpAddress') === '192.168.1.100') &&
        !isVigor2927Bai3MacMatch(getVigor2927InputVal(doc, 'txtMac'));
    }
  },
  {
    selector: 'input[name="btnAdd"], input[value="Add"]',
    text: 'Bước 6: chọn Add để thêm vào danh sách IP Bind List',
    position: 'top',
    condition: function(doc) {
      return isVigor2927Bai3Enabled(doc) && !isVigor2927Bai3Added(doc) &&
        (getVigor2927InputVal(doc, 'sIpAddress') === '192.168.1.100') &&
        isVigor2927Bai3MacMatch(getVigor2927InputVal(doc, 'txtMac'));
    }
  },
  {
    selector: '#btn-ipbmac-ok, input[name="btnOk"], input[value="OK"]',
    text: 'Bước 7: chọn OK để lưu cấu hình',
    position: 'top',
    condition: function(doc) {
      return isVigor2927Bai3Added(doc) && !doc._ftcIsSaved;
    }
  }
];
