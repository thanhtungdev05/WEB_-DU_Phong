/**
 * devices/vigor2927/tooltips.js — Danh sách Tooltip & Target Hướng dẫn cho Vigor2927
 */

if (!window.TOOLTIPS_VIGOR2927) window.TOOLTIPS_VIGOR2927 = {};

window.TOOLTIPS_VIGOR2927._common_login = [
  {
    selector: 'input.userpwd:not([type="password"])',
    text: 'Nhập admin',
    position: 'right'
  },
  {
    selector: 'input.userpwd[type="password"]',
    text: 'Nhập admin',
    position: 'right'
  },
  {
    selector: 'input.login',
    text: 'Bấm Đăng Nhập',
    position: 'bottom'
  }
];

window.TOOLTIPS_VIGOR2927['vg2927-bai1'] = [
  {
    selector: '#menu-wan:not(.open) .menu-text, #menu-wan:not(.open)',
    text: 'Bước 1: chọn WAN',
    position: 'bottom'
  },
  {
    selector: '#sub-wan:not(.hidden) #menu-wan-internet .menu-text, #sub-wan:not(.hidden) #menu-wan-internet',
    text: 'Bước 2: chọn Internet Access',
    position: 'bottom'
  },
  {
    selector: 'input[name="btnDtPage0"], input[value="Details Page"]',
    text: 'Bước 3: Chọn Details Page',
    position: 'top'
  },
  {
    selector: '#tab1.offtab, #tab1:not(.ontab)',
    text: 'Bước 4: chọn PPPoE',
    position: 'bottom'
  },
  {
    selector: '#lbl-pppoe-disable, input[name="PPPoE"][value="0"]',
    text: 'Bước 5: chọn Enable',
    position: 'right',
    expected: '1'
  },
  {
    selector: '#opt-pppoe-username, input[name="sDOutUser1"]',
    text: 'Bước 6: nhập sgfdl-211208-218',
    position: 'right',
    expected: 'sgfdl-211208-218'
  },
  {
    selector: '#opt-pppoe-password, input[name="sDOutPass1"]',
    text: 'Bước 7: nhập 12345678',
    position: 'right',
    expected: '12345678'
  },
  {
    selector: '#btn-pppoe-ok, input[name="submit"][value="OK"], input[type="submit"][value="OK"]',
    text: 'Bước 8: nhấn OK',
    position: 'top'
  }
];

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

window.TOOLTIPS_VIGOR2927['vg2927-bai4'] = [
  {
    selector: '#menu-lan:not(.open) .menu-text, #menu-lan:not(.open)',
    text: 'Bước 1: chọn LAN',
    position: 'bottom',
    hideOnPage: 'enet1|sht'
  },
  {
    selector: '#sub-lan:not(.hidden) #menu-lan-general .menu-text, #sub-lan:not(.hidden) #menu-lan-general',
    text: 'Bước 2: chọn General Setup',
    position: 'bottom',
    hideOnPage: 'enet1|sht'
  },
  {
    selector: '#lan1 input[name="btnDtPage0"], input[name="btnDtPage0"], #lan1 input[value="Details Page"]',
    text: 'Bước 3: chọn Details Page',
    position: 'top',
    hideOnPage: 'sht'
  },
  {
    selector: 'select[name="sLanMask"]',
    text: 'Bước 4: điền IP Address 192.168.100.1<br>chọn Subnet Mask 255.255.255.0',
    position: 'bottom',
    page: 'sht'
  },
  {
    selector: 'input[name="sDHCP"][value="1"] + translate, input[name="sDHCP"][value="1"]',
    text: 'Bước 5: chọn Enable Server<br>- Start IP Address: 192.168.100.10<br>- IP Pool Counts: 200<br>- Gateway IP Address: 192.168.100.1<br>- Lease Time: 86400',
    position: 'top',
    minTop: -4,
    offsetY: 3,
    page: 'sht'
  },
  {
    selector: 'input[name="btnOK"], input[value="OK"]',
    text: 'Bước 5: chọn OK',
    position: 'top',
    page: 'sht'
  }
];

window.TOOLTIPS_VIGOR2927['vg2927-bai5'] = [
  {
    selector: '#menu-lan:not(.open) .menu-text, #menu-lan:not(.open)',
    text: 'Bước 1: Chọn LAN',
    position: 'bottom',
    hideOnPage: 'enet1|sht'
  },
  {
    selector: '#sub-lan:not(.hidden) #menu-lan-general .menu-text, #sub-lan:not(.hidden) #menu-lan-general',
    text: 'Bước 2: chọn General Setup',
    position: 'bottom',
    hideOnPage: 'enet1|sht'
  },
  {
    selector: '#lan1 input[name="btnDtPage0"], input[name="btnDtPage0"], #lan1 input[value="Details Page"]',
    text: 'Bước 3: chọn Details Page',
    position: 'top',
    hideOnPage: 'sht'
  },
  {
    selector: 'b:contains("DNS Server IP Address"), text:DNS Server IP Address',
    text: 'Bước 4: nhập DNS của công ty và google, ví dụ:<br>- Primary IP Address: 210.245.31.220<br>- Secondary IP Address: 8.8.8.8',
    position: 'top',
    page: 'sht'
  },
  {
    selector: 'input[name="btnOK"], input[value="OK"]',
    text: 'Bước 5: chọn OK',
    position: 'top',
    page: 'sht'
  }
];

window.TOOLTIPS_VIGOR2927['vg2927-bai6'] = [
  {
    selector: '#menu-wan:not(.open) .menu-text, #menu-wan:not(.open)',
    text: 'Bước 1: chọn WAN',
    position: 'bottom',
    hideOnPage: 'mwangen1|mwangen'
  },
  {
    selector: '#sub-wan:not(.hidden) #menu-wan-general .menu-text, #sub-wan:not(.hidden) #menu-wan-general',
    text: 'Bước 2: chọn General Setup',
    position: 'bottom',
    hideOnPage: 'mwangen1|mwangen'
  },
  {
    selector: '.ldbn select[name="iBwLBBased"], select[name="iBwLBBased"]',
    text: 'Bước 3: chọn Session Based',
    position: 'right',
    page: 'mwangen1'
  },
  {
    selector: '.ldbn select[name="iBwLBMode"], select[name="iBwLBMode"]',
    text: 'Bước 4: chọn According to Line Speed',
    position: 'right',
    page: 'mwangen1'
  },
  {
    selector: 'input[name="btnOk"], input[value="OK"]',
    text: 'Bước 5: chọn OK để lưu cấu hình, sau đó cấu hình tiếp WAN1 và WAN2.',
    position: 'top',
    page: 'mwangen1'
  },
  /* Trang WAN1 (doc/mwangen.htm) — dùng 'mwangen.htm' (có đuôi .htm) để KHÔNG bị trùng
     với trang tổng 'mwangen1.htm' (so khớp theo chuỗi con: "mwangen.htm" không nằm
     trong "mwangen1.htm" vì có số 1 chen giữa). */
  {
    selector: 'input[name="sBwWanDisName"]',
    text: 'Bước 1: nhập ISP-1',
    position: 'right',
    page: 'mwangen.htm'
  },
  {
    selector: 'select[name="uilBwLBInRateUnit"]',
    text: 'Bước 2: nhập 80 Mbps',
    position: 'right',
    page: 'mwangen.htm'
  },
  {
    selector: 'select[name="uilBwLBOutRateUnit"]',
    text: 'Bước 3: nhập 80 Mbps',
    position: 'right',
    page: 'mwangen.htm'
  },
  {
    selector: 'input[name="submit"], input[value="OK"]',
    text: 'Bước 4: chọn OK',
    position: 'top',
    page: 'mwangen.htm'
  }
];

