/**
 * devices/vigor2927/tooltips/bai2.js — Tooltip Hướng dẫn cho Bài 2: Cấu hình giới hạn băng thông
 */

if (!window.TOOLTIPS_VIGOR2927) window.TOOLTIPS_VIGOR2927 = {};

function isVigor2927Bai2EnableDone(doc) {
  if (!doc) return false;
  var en = doc.querySelector('input[name="sIpBandwEnable"]:checked');
  return !!(en && en.value === '1');
}

function isVigor2927Bai2DefTxDone(doc) {
  if (!doc) return false;
  var tx = doc.querySelector('input[name="sIpBandwDefTx"]');
  var txU = doc.querySelector('select[name="iDefTx"]');
  var txVal = tx ? (tx.value || '').trim() : '';
  var u = txU ? txU.value : '1';
  return (txVal === '20' && (u === '1' || u === 'Mbps'));
}

function isVigor2927Bai2DefRxDone(doc) {
  if (!doc) return false;
  var rx = doc.querySelector('input[name="sIpBandwDefRx"]');
  var rxU = doc.querySelector('select[name="iDefRx"]');
  var rxVal = rx ? (rx.value || '').trim() : '';
  var u = rxU ? rxU.value : '1';
  return (rxVal === '25' && (u === '1' || u === 'Mbps'));
}

function isVigor2927Bai2LimitDone(doc) {
  return isVigor2927Bai2EnableDone(doc) && isVigor2927Bai2DefTxDone(doc) && isVigor2927Bai2DefRxDone(doc);
}

function isVigor2927Bai2Added(doc) {
  if (!doc) return false;
  try {
    var win = doc.defaultView || doc.parentWindow;
    if (win && Array.isArray(win.aryIpBandw) && win.aryIpBandw.length > 0) {
      for (var i = 0; i < win.aryIpBandw.length; i++) {
        var r = win.aryIpBandw[i];
        if (r && (r[0] === '192.168.1.10' || r[1] === '192.168.1.20')) return true;
      }
    }
    var rows = doc.querySelectorAll('#custlsttb0 tr');
    for (var j = 0; j < rows.length; j++) {
      if (rows[j].textContent.includes('192.168.1.10')) return true;
    }
    if (doc._ftcHasClickedAdd || (win && win._ftcHasClickedAdd) || window._ftcHasClickedAdd) return true;
  } catch (e) {}
  return false;
}

function getVigor2927InputVal(doc, name) {
  if (!doc) return '';
  var el = doc.querySelector('input[name="' + name + '"]');
  return el ? (el.value || '').trim() : '';
}

function hookVigor2927EachEvents(doc) {
  if (!doc || doc._ftcEachHooked) return;
  doc._ftcEachHooked = true;
  var eachRadio = doc.querySelector('input[name="sIpBandwShrd"][value="N"]');
  if (eachRadio && typeof eachRadio.addEventListener === 'function') {
    eachRadio.addEventListener('click', function() { doc._ftcEachConfirmed = true; });
    eachRadio.addEventListener('change', function() { doc._ftcEachConfirmed = true; });
  }
  var txInput = doc.querySelector('input[name="sIpBandwTx"]');
  if (txInput && typeof txInput.addEventListener === 'function') {
    txInput.addEventListener('focus', function() { doc._ftcEachConfirmed = true; });
    txInput.addEventListener('input', function() { doc._ftcEachConfirmed = true; });
    txInput.addEventListener('change', function() { doc._ftcEachConfirmed = true; });
  }
}

window.TOOLTIPS_VIGOR2927['vg2927-bai2'] = [
  {
    selector: '#menu-bandwidth:not(.open) .menu-text, #menu-bandwidth:not(.open)',
    text: 'Bước 1: chọn Bandwidth Management',
    position: 'bottom',
    hideOnPage: 'ipbandw'
  },
  {
    selector: '#sub-bandwidth:not(.hidden) #menu-bandwidth-limit .menu-text, #sub-bandwidth:not(.hidden) #menu-bandwidth-limit',
    text: 'Bước 2: chọn Bandwidth Limit',
    position: 'bottom',
    hideOnPage: 'ipbandw'
  },
  {
    selector: '#lbl-bandwidth-disable, input[name="sIpBandwEnable"][value="0"] ~ b, text:Disable',
    text: 'Bước 3: chọn Enable',
    position: 'right',
    offsetX: 8,
    condition: function(doc) { return !isVigor2927Bai2EnableDone(doc); }
  },
  {
    selector: '#opt-bandwidth-tx-limit, input[name="sIpBandwDefTx"]',
    text: 'Bước 4: nhập giới hạn tốc độ truyền (TX Limit) mặc định cho tất cả thiết bị là 20 Mbps',
    position: 'bottom',
    condition: function(doc) { return isVigor2927Bai2EnableDone(doc) && !isVigor2927Bai2DefTxDone(doc); }
  },
  {
    selector: '#opt-bandwidth-rx-limit, input[name="sIpBandwDefRx"]',
    text: 'Bước 5: nhập giới hạn tốc độ nhận (RX Limit) mặc định cho tất cả thiết bị là 25 Mbps',
    position: 'top',
    condition: function(doc) { return isVigor2927Bai2EnableDone(doc) && isVigor2927Bai2DefTxDone(doc) && !isVigor2927Bai2DefRxDone(doc); }
  },
  {
    selector: 'input[name="sIpBandwFrom"]',
    text: 'Bước 6: nhập Start IP: 192.168.1.10',
    position: 'top',
    condition: function(doc) {
      return isVigor2927Bai2LimitDone(doc) && !isVigor2927Bai2Added(doc) && (getVigor2927InputVal(doc, 'sIpBandwFrom') !== '192.168.1.10');
    }
  },
  {
    selector: 'input[name="sIpBandwTo"]',
    text: 'Bước 7: nhập End IP: 192.168.1.20',
    position: 'top',
    condition: function(doc) {
      return isVigor2927Bai2LimitDone(doc) && !isVigor2927Bai2Added(doc) &&
        (getVigor2927InputVal(doc, 'sIpBandwFrom') === '192.168.1.10') &&
        (getVigor2927InputVal(doc, 'sIpBandwTo') !== '192.168.1.20');
    }
  },
  {
    selector: 'input[name="sIpBandwShrd"][value="N"]',
    text: 'Bước 8: chọn Each (mỗi IP trong dải đều sử dụng tối đa băng thông quy định)',
    position: 'left',
    condition: function(doc) {
      if (!isVigor2927Bai2LimitDone(doc) || isVigor2927Bai2Added(doc)) return false;
      if (getVigor2927InputVal(doc, 'sIpBandwFrom') !== '192.168.1.10' || getVigor2927InputVal(doc, 'sIpBandwTo') !== '192.168.1.20') return false;
      hookVigor2927EachEvents(doc);
      if (doc._ftcEachConfirmed || getVigor2927InputVal(doc, 'sIpBandwTx') === '20') return false;
      return true;
    }
  },
  {
    selector: 'input[name="sIpBandwTx"]',
    text: 'Bước 9: nhập TX Limit cho dải IP: 20 Mbps',
    position: 'bottom',
    condition: function(doc) {
      if (!isVigor2927Bai2LimitDone(doc) || isVigor2927Bai2Added(doc)) return false;
      if (getVigor2927InputVal(doc, 'sIpBandwFrom') !== '192.168.1.10' || getVigor2927InputVal(doc, 'sIpBandwTo') !== '192.168.1.20') return false;
      hookVigor2927EachEvents(doc);
      return (doc._ftcEachConfirmed || getVigor2927InputVal(doc, 'sIpBandwTx') !== '') && (getVigor2927InputVal(doc, 'sIpBandwTx') !== '20');
    }
  },
  {
    selector: 'input[name="sIpBandwRx"]',
    text: 'Bước 10: nhập RX Limit cho dải IP: 25 Mbps',
    position: 'bottom',
    condition: function(doc) {
      if (!isVigor2927Bai2LimitDone(doc) || isVigor2927Bai2Added(doc)) return false;
      if (getVigor2927InputVal(doc, 'sIpBandwFrom') !== '192.168.1.10' || getVigor2927InputVal(doc, 'sIpBandwTo') !== '192.168.1.20') return false;
      return (getVigor2927InputVal(doc, 'sIpBandwTx') === '20') && (getVigor2927InputVal(doc, 'sIpBandwRx') !== '25');
    }
  },
  {
    selector: 'input[name="btnAdd"]',
    text: 'Bước 11: chọn Add để thêm dải IP vào danh sách Limitation List',
    position: 'top',
    condition: function(doc) {
      if (!isVigor2927Bai2LimitDone(doc) || isVigor2927Bai2Added(doc)) return false;
      if (getVigor2927InputVal(doc, 'sIpBandwFrom') !== '192.168.1.10' || getVigor2927InputVal(doc, 'sIpBandwTo') !== '192.168.1.20') return false;
      return (getVigor2927InputVal(doc, 'sIpBandwTx') === '20') && (getVigor2927InputVal(doc, 'sIpBandwRx') === '25');
    }
  },
  {
    selector: 'select[name="nSch1"]',
    text: 'Bước 12: Time Schedule giữ nguyên mặc định là None',
    position: 'bottom',
    condition: function(doc) {
      return isVigor2927Bai2LimitDone(doc) && isVigor2927Bai2Added(doc) && !doc._ftcIsSaved;
    }
  },
  {
    selector: 'input[name="btnOk"], input[value="OK"]',
    text: 'Bước 13: chọn OK để lưu cấu hình',
    position: 'top',
    condition: function(doc) {
      return isVigor2927Bai2LimitDone(doc) && isVigor2927Bai2Added(doc) && !doc._ftcIsSaved;
    }
  }
];
