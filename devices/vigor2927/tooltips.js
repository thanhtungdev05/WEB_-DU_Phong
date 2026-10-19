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
    text: 'Bước 7: nhập fpt12345',
    position: 'right',
    expected: 'fpt12345'
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
  } catch (e) { }
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
    eachRadio.addEventListener('click', function () { doc._ftcEachConfirmed = true; });
    eachRadio.addEventListener('change', function () { doc._ftcEachConfirmed = true; });
  }
  var txInput = doc.querySelector('input[name="sIpBandwTx"]');
  if (txInput && typeof txInput.addEventListener === 'function') {
    txInput.addEventListener('focus', function () { doc._ftcEachConfirmed = true; });
    txInput.addEventListener('input', function () { doc._ftcEachConfirmed = true; });
    txInput.addEventListener('change', function () { doc._ftcEachConfirmed = true; });
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
    condition: function (doc) { return !isVigor2927Bai2EnableDone(doc); }
  },
  {
    selector: '#opt-bandwidth-tx-limit, input[name="sIpBandwDefTx"]',
    text: 'Bước 4: nhập giới hạn tốc độ truyền (TX Limit) mặc định cho tất cả thiết bị là 20 Mbps',
    position: 'bottom',
    condition: function (doc) { return isVigor2927Bai2EnableDone(doc) && !isVigor2927Bai2DefTxDone(doc); }
  },
  {
    selector: '#opt-bandwidth-rx-limit, input[name="sIpBandwDefRx"]',
    text: 'Bước 5: nhập giới hạn tốc độ nhận (RX Limit) mặc định cho tất cả thiết bị là 25 Mbps',
    position: 'top',
    condition: function (doc) { return isVigor2927Bai2EnableDone(doc) && isVigor2927Bai2DefTxDone(doc) && !isVigor2927Bai2DefRxDone(doc); }
  },
  {
    selector: 'input[name="sIpBandwFrom"]',
    text: 'Bước 6: nhập Start IP: 192.168.1.10',
    position: 'top',
    condition: function (doc) {
      return isVigor2927Bai2LimitDone(doc) && !isVigor2927Bai2Added(doc) && (getVigor2927InputVal(doc, 'sIpBandwFrom') !== '192.168.1.10');
    }
  },
  {
    selector: 'input[name="sIpBandwTo"]',
    text: 'Bước 7: nhập End IP: 192.168.1.20',
    position: 'top',
    condition: function (doc) {
      return isVigor2927Bai2LimitDone(doc) && !isVigor2927Bai2Added(doc) &&
        (getVigor2927InputVal(doc, 'sIpBandwFrom') === '192.168.1.10') &&
        (getVigor2927InputVal(doc, 'sIpBandwTo') !== '192.168.1.20');
    }
  },
  {
    selector: 'input[name="sIpBandwShrd"][value="N"]',
    text: 'Bước 8: chọn Each (mỗi IP trong dải đều sử dụng tối đa băng thông quy định)',
    position: 'bottom',
    condition: function (doc) {
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
    condition: function (doc) {
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
    condition: function (doc) {
      if (!isVigor2927Bai2LimitDone(doc) || isVigor2927Bai2Added(doc)) return false;
      if (getVigor2927InputVal(doc, 'sIpBandwFrom') !== '192.168.1.10' || getVigor2927InputVal(doc, 'sIpBandwTo') !== '192.168.1.20') return false;
      return (getVigor2927InputVal(doc, 'sIpBandwTx') === '20') && (getVigor2927InputVal(doc, 'sIpBandwRx') !== '25');
    }
  },
  {
    selector: 'input[name="btnAdd"]',
    text: 'Bước 11: chọn Add để thêm dải IP vào danh sách Limitation List',
    position: 'top',
    condition: function (doc) {
      if (!isVigor2927Bai2LimitDone(doc) || isVigor2927Bai2Added(doc)) return false;
      if (getVigor2927InputVal(doc, 'sIpBandwFrom') !== '192.168.1.10' || getVigor2927InputVal(doc, 'sIpBandwTo') !== '192.168.1.20') return false;
      return (getVigor2927InputVal(doc, 'sIpBandwTx') === '20') && (getVigor2927InputVal(doc, 'sIpBandwRx') === '25');
    }
  },
  {
    selector: 'select[name="nSch1"]',
    text: 'Bước 12: Time Schedule giữ nguyên mặc định là None',
    position: 'bottom',
    condition: function (doc) {
      return isVigor2927Bai2LimitDone(doc) && isVigor2927Bai2Added(doc) && !doc._ftcIsSaved;
    }
  },
  {
    selector: 'input[name="btnOk"], input[value="OK"]',
    text: 'Bước 13: chọn OK để lưu cấu hình',
    position: 'top',
    condition: function (doc) {
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
  } catch (e) { }
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
    condition: function (doc) {
      return !isVigor2927Bai3Added(doc) && !isVigor2927Bai3Enabled(doc);
    }
  },
  {
    selector: '#txt-ipbmac-ip, input[name="sIpAddress"]',
    text: 'Bước 4: nhập IP Address: 192.168.1.100',
    position: 'top',
    condition: function (doc) {
      return isVigor2927Bai3Enabled(doc) && !isVigor2927Bai3Added(doc) && (getVigor2927InputVal(doc, 'sIpAddress') !== '192.168.1.100');
    }
  },
  {
    selector: 'input[name="txtMac"]',
    text: 'Bước 5: nhập MAC Address: AA-BB-CC-DD-EE-FF',
    position: 'top',
    condition: function (doc) {
      return isVigor2927Bai3Enabled(doc) && !isVigor2927Bai3Added(doc) &&
        (getVigor2927InputVal(doc, 'sIpAddress') === '192.168.1.100') &&
        !isVigor2927Bai3MacMatch(getVigor2927InputVal(doc, 'txtMac'));
    }
  },
  {
    selector: 'input[name="btnAdd"], input[value="Add"]',
    text: 'Bước 6: chọn Add để thêm vào danh sách IP Bind List',
    position: 'top',
    condition: function (doc) {
      return isVigor2927Bai3Enabled(doc) && !isVigor2927Bai3Added(doc) &&
        (getVigor2927InputVal(doc, 'sIpAddress') === '192.168.1.100') &&
        isVigor2927Bai3MacMatch(getVigor2927InputVal(doc, 'txtMac'));
    }
  },
  {
    selector: '#btn-ipbmac-ok, input[name="btnOk"], input[value="OK"]',
    text: 'Bước 7: chọn OK để lưu cấu hình',
    position: 'top',
    condition: function (doc) {
      return isVigor2927Bai3Added(doc) && !doc._ftcIsSaved;
    }
  }
];

window.TOOLTIPS_VIGOR2927['vg2927-bai4'] = [
  {
    selector: '#menu-lan:not(.open) .menu-text, #menu-lan:not(.open)',
    text: 'Bước 1: chọn LAN',
    position: 'bottom',
    hideOnPage: 'enet1|sht|enet'
  },
  {
    selector: '#sub-lan:not(.hidden) #menu-lan-general .menu-text, #sub-lan:not(.hidden) #menu-lan-general',
    text: 'Bước 2: chọn General Setup',
    position: 'bottom',
    hideOnPage: 'enet1|sht|enet'
  },
  {
    selector: '#lan1 input[name="btnDtPage0"], input[name="btnDtPage0"], #lan1 input[value="Details Page"]',
    text: 'Bước 3: chọn Details Page',
    position: 'top',
    hideOnPage: 'sht'
  },
  {
    selector: 'input[name="sLanIp"]',
    text: 'Bước 4: điền IP Address: 192.168.100.1',
    position: 'bottom',
    condition: function (doc) {
      if (typeof isVigor2927Bai4IpDone === 'function') return !isVigor2927Bai4IpDone(doc);
      var el = doc.querySelector('input[name="sLanIp"]');
      return !el || (el.value || '').trim() !== '192.168.100.1';
    }
  },
  {
    selector: 'select[name="sLanMask"]',
    text: 'Bước 5: chọn Subnet Mask: 255.255.255.0 / 24',
    position: 'bottom',
    condition: function (doc) {
      if (typeof isVigor2927Bai4IpDone === 'function' && typeof isVigor2927Bai4MaskDone === 'function') {
        return isVigor2927Bai4IpDone(doc) && !isVigor2927Bai4MaskDone(doc);
      }
      return true;
    }
  },
  {
    selector: 'input[name="sDHCP"][value="1"] + translate, input[name="sDHCP"][value="1"]',
    text: 'Bước 6: chọn Enable Server',
    position: 'top',
    minTop: -4,
    offsetY: 3,
    condition: function (doc) {
      if (typeof isVigor2927Bai4DhcpConfirmed === 'function') {
        return isVigor2927Bai4IpDone(doc) && isVigor2927Bai4MaskDone(doc) && !isVigor2927Bai4DhcpConfirmed(doc);
      }
      return true;
    }
  },
  {
    selector: 'input[name="sDHCPStIP"]',
    text: 'Bước 7: điền Start IP Address: 192.168.100.10',
    position: 'bottom',
    condition: function (doc) {
      if (typeof isVigor2927Bai4StartIpDone === 'function') {
        return isVigor2927Bai4IpDone(doc) && isVigor2927Bai4MaskDone(doc) && isVigor2927Bai4DhcpConfirmed(doc) && !isVigor2927Bai4StartIpDone(doc);
      }
      return true;
    }
  },
  {
    selector: 'input[name="iDHCPNo"]',
    text: 'Bước 8: điền IP Pool Counts: 200',
    position: 'bottom',
    condition: function (doc) {
      if (typeof isVigor2927Bai4PoolDone === 'function') {
        return isVigor2927Bai4StartIpDone(doc) && !isVigor2927Bai4PoolDone(doc);
      }
      return true;
    }
  },
  {
    selector: 'input[name="sDHCPGwIP"]',
    text: 'Bước 9: điền Gateway IP Address: 192.168.100.1',
    position: 'bottom',
    condition: function (doc) {
      if (typeof isVigor2927Bai4GwDone === 'function') {
        return isVigor2927Bai4StartIpDone(doc) && isVigor2927Bai4PoolDone(doc) && !isVigor2927Bai4GwDone(doc);
      }
      return true;
    }
  },
  {
    selector: 'input[name="sDHCPLsTime"]',
    text: 'Bước 10: điền Lease Time: 86400',
    position: 'bottom',
    condition: function (doc) {
      if (typeof isVigor2927Bai4LeaseDone === 'function') {
        return isVigor2927Bai4StartIpDone(doc) && isVigor2927Bai4PoolDone(doc) && isVigor2927Bai4GwDone(doc) && !isVigor2927Bai4LeaseDone(doc);
      }
      return true;
    }
  },
  {
    selector: 'input[name="btnOK"], input[value="OK"]',
    text: 'Bước 11: chọn OK để lưu cấu hình',
    position: 'top',
    condition: function (doc) {
      if (typeof isVigor2927Bai4AllInputsDone === 'function') {
        return isVigor2927Bai4AllInputsDone(doc) && !doc._ftcIsSaved;
      }
      return !doc._ftcIsSaved;
    }
  }
];

window.TOOLTIPS_VIGOR2927['vg2927-bai5'] = [
  {
    selector: '#menu-lan:not(.open) .menu-text, #menu-lan:not(.open)',
    text: 'Bước 1: chọn LAN',
    position: 'bottom',
    hideOnPage: 'enet1|sht|enet'
  },
  {
    selector: '#sub-lan:not(.hidden) #menu-lan-general .menu-text, #sub-lan:not(.hidden) #menu-lan-general',
    text: 'Bước 2: chọn General Setup',
    position: 'bottom',
    hideOnPage: 'enet1|sht|enet'
  },
  {
    selector: '#lan1 input[name="btnDtPage0"], input[name="btnDtPage0"], #lan1 input[value="Details Page"]',
    text: 'Bước 3: chọn Details Page',
    position: 'top',
    hideOnPage: 'sht'
  },
  {
    selector: 'input[name="sDNSPri"]',
    text: 'Bước 4: điền Primary IP Address: 210.245.31.220',
    position: 'bottom',
    condition: function (doc) {
      if (typeof isVigor2927Bai5PriDone === 'function') return !isVigor2927Bai5PriDone(doc);
      var el = doc.querySelector('input[name="sDNSPri"]');
      return !el || (el.value || '').trim() !== '210.245.31.220';
    }
  },
  {
    selector: 'input[name="sDNSSnd"]',
    text: 'Bước 5: điền Secondary IP Address: 8.8.8.8',
    position: 'bottom',
    condition: function (doc) {
      if (typeof isVigor2927Bai5PriDone === 'function' && typeof isVigor2927Bai5SndDone === 'function') {
        return isVigor2927Bai5PriDone(doc) && !isVigor2927Bai5SndDone(doc);
      }
      var pri = doc.querySelector('input[name="sDNSPri"]');
      var snd = doc.querySelector('input[name="sDNSSnd"]');
      return (pri && (pri.value || '').trim() === '210.245.31.220') && (!snd || (snd.value || '').trim() !== '8.8.8.8');
    }
  },
  {
    selector: 'input[name="btnOK"], input[value="OK"]',
    text: 'Bước 6: chọn OK để lưu cấu hình',
    position: 'top',
    condition: function (doc) {
      if (typeof isVigor2927Bai5PriDone === 'function' && typeof isVigor2927Bai5SndDone === 'function') {
        return isVigor2927Bai5PriDone(doc) && isVigor2927Bai5SndDone(doc) && !doc._ftcIsSaved;
      }
      var pri = doc.querySelector('input[name="sDNSPri"]');
      var snd = doc.querySelector('input[name="sDNSSnd"]');
      var ok = (pri && (pri.value || '').trim() === '210.245.31.220') && (snd && (snd.value || '').trim() === '8.8.8.8');
      return ok && !doc._ftcIsSaved;
    }
  }
];

function isVigor2927Bai6ModeDone(doc) {
  if (!doc) return false;
  var el = doc.querySelector('select[name="iBwLBBased"]');
  return el ? (el.value === '1') : false; // 1 = Session Based
}

function isVigor2927Bai6LineSpeedDone(doc) {
  if (!doc) return false;
  var el = doc.querySelector('select[name="iBwLBMode"]');
  return el ? (el.value === '0') : false; // 0 = According to Line Speed
}

function isVigor2927Bai6OverviewSaved(doc) {
  if (!doc) return false;
  var win = doc.defaultView || doc.parentWindow;
  var topWin = (win && win.top) ? win.top : ((typeof window !== 'undefined' && window.top) ? window.top : window);
  var store = (topWin && topWin._FTC_VG2927_BAI6) || (typeof window !== 'undefined' && window._FTC_VG2927_BAI6);
  if (store && store.overview) {
    if (typeof topWin.vg2927Bai6TrangDaDung === 'function') {
      return topWin.vg2927Bai6TrangDaDung(store, 'overview');
    }
    return store.overview.lbMode === '0' && store.overview.lbBased === '1';
  }
  return Boolean(doc._ftcIsSaved || (win && win._ftcIsSaved));
}

function isVigor2927Bai6Wan1Saved(doc) {
  if (!doc) return false;
  var win = doc.defaultView || doc.parentWindow;
  var topWin = (win && win.top) ? win.top : ((typeof window !== 'undefined' && window.top) ? window.top : window);
  var store = (topWin && topWin._FTC_VG2927_BAI6) || (typeof window !== 'undefined' && window._FTC_VG2927_BAI6);
  if (store && store.wan1) {
    if (typeof topWin.vg2927Bai6TrangDaDung === 'function') {
      return topWin.vg2927Bai6TrangDaDung(store, 'wan1');
    }
    return Boolean(store.wan1.displayName === 'ISP-1');
  }
  return Boolean(doc._ftcWan1Saved || (win && win._ftcWan1Saved));
}

function isVigor2927Bai6Wan2Saved(doc) {
  if (!doc) return false;
  var win = doc.defaultView || doc.parentWindow;
  var topWin = (win && win.top) ? win.top : ((typeof window !== 'undefined' && window.top) ? window.top : window);
  var store = (topWin && topWin._FTC_VG2927_BAI6) || (typeof window !== 'undefined' && window._FTC_VG2927_BAI6);
  if (store && store.wan2) {
    if (typeof topWin.vg2927Bai6TrangDaDung === 'function') {
      return topWin.vg2927Bai6TrangDaDung(store, 'wan2');
    }
    return Boolean(store.wan2.displayName === 'ISP-2');
  }
  return Boolean(doc._ftcWan2Saved || (win && win._ftcWan2Saved));
}

function isVigor2927Bai6Wan1NameDone(doc) {
  if (!doc) return false;
  var el = doc.querySelector('input[name="sBwWanDisName"]');
  return el ? (el.value || '').trim() === 'ISP-1' : false;
}

function isVigor2927Bai6Wan1InDone(doc) {
  if (!doc) return false;
  var vEl = doc.querySelector('input[name="uilBwLBInRate"]');
  var uEl = doc.querySelector('select[name="uilBwLBInRateUnit"]');
  var val = vEl ? (vEl.value || '').trim() : '';
  var unit = uEl ? uEl.value : '0';
  return (val === '80' && unit === '1') || (val === '80000' && unit === '0');
}

function isVigor2927Bai6Wan1OutDone(doc) {
  if (!doc) return false;
  var vEl = doc.querySelector('input[name="uilBwLBOutRate"]');
  var uEl = doc.querySelector('select[name="uilBwLBOutRateUnit"]');
  var val = vEl ? (vEl.value || '').trim() : '';
  var unit = uEl ? uEl.value : '0';
  return (val === '80' && unit === '1') || (val === '80000' && unit === '0');
}

function isVigor2927Bai6Wan2NameDone(doc) {
  if (!doc) return false;
  var el = doc.querySelector('input[name="sBwWanDisName"]');
  return el ? (el.value || '').trim() === 'ISP-2' : false;
}

function isVigor2927Bai6Wan2InDone(doc) {
  if (!doc) return false;
  var vEl = doc.querySelector('input[name="uilBwLBInRate"]');
  var uEl = doc.querySelector('select[name="uilBwLBInRateUnit"]');
  var val = vEl ? (vEl.value || '').trim() : '';
  var unit = uEl ? uEl.value : '0';
  return (val === '80' && unit === '1') || (val === '80000' && unit === '0');
}

function isVigor2927Bai6Wan2OutDone(doc) {
  if (!doc) return false;
  var vEl = doc.querySelector('input[name="uilBwLBOutRate"]');
  var uEl = doc.querySelector('select[name="uilBwLBOutRateUnit"]');
  var val = vEl ? (vEl.value || '').trim() : '';
  var unit = uEl ? uEl.value : '0';
  return (val === '80' && unit === '1') || (val === '80000' && unit === '0');
}

window.TOOLTIPS_VIGOR2927['vg2927-bai6'] = [
  {
    selector: '#menu-wan:not(.open) .menu-text, #menu-wan:not(.open)',
    text: 'Bước 1: chọn WAN',
    position: 'bottom',
    hideOnPage: 'mwangen1|mwangen|wan.cgi'
  },
  {
    selector: '#sub-wan:not(.hidden) #menu-wan-general .menu-text, #sub-wan:not(.hidden) #menu-wan-general',
    text: 'Bước 2: chọn General Setup',
    position: 'bottom',
    hideOnPage: 'mwangen1|mwangen|wan.cgi'
  },
  {
    selector: '.ldbn select[name="iBwLBBased"], select[name="iBwLBBased"]',
    text: 'Bước 3: chọn Session Based',
    position: 'right',
    page: 'mwangen1',
    condition: function (doc) {
      return !isVigor2927Bai6ModeDone(doc);
    }
  },
  {
    selector: '.ldbn select[name="iBwLBMode"], select[name="iBwLBMode"]',
    text: 'Bước 4: chọn According to Line Speed',
    position: 'right',
    page: 'mwangen1',
    condition: function (doc) {
      return isVigor2927Bai6ModeDone(doc) && !isVigor2927Bai6LineSpeedDone(doc);
    }
  },
  {
    selector: 'input[name="btnOk"], input[value="OK"]',
    text: 'Bước 5: chọn OK để lưu cấu hình, sau đó cấu hình tiếp WAN1 và WAN2.',
    position: 'top',
    page: 'mwangen1',
    condition: function (doc) {
      return isVigor2927Bai6ModeDone(doc) && isVigor2927Bai6LineSpeedDone(doc) && !isVigor2927Bai6OverviewSaved(doc);
    }
  },
  /* Chuyển tiếp sang WAN1 trên trang General Setup */
  {
    selector: 'a[href*="gotoWanSet(1)"]',
    text: 'Bước 6: chọn WAN1',
    position: 'right',
    page: 'mwangen1',
    condition: function (doc) {
      return isVigor2927Bai6OverviewSaved(doc) && !isVigor2927Bai6Wan1Saved(doc);
    }
  },
  /* Trang WAN1 (doc/mwangen.htm) */
  {
    selector: 'input[name="sBwWanDisName"]',
    text: 'Bước 7: nhập ISP-1',
    position: 'right',
    page: 'mwangen.htm',
    condition: function (doc) {
      return !isVigor2927Bai6Wan1NameDone(doc);
    }
  },
  {
    selector: 'select[name="uilBwLBInRateUnit"]',
    text: 'Bước 8: nhập 80 Mbps',
    position: 'right',
    page: 'mwangen.htm',
    condition: function (doc) {
      return isVigor2927Bai6Wan1NameDone(doc) && !isVigor2927Bai6Wan1InDone(doc);
    }
  },
  {
    selector: 'select[name="uilBwLBOutRateUnit"]',
    text: 'Bước 9: nhập 80 Mbps',
    position: 'right',
    page: 'mwangen.htm',
    condition: function (doc) {
      return isVigor2927Bai6Wan1NameDone(doc) && isVigor2927Bai6Wan1InDone(doc) && !isVigor2927Bai6Wan1OutDone(doc);
    }
  },
  {
    selector: 'input[name="submit"], input[value="OK"]',
    text: 'Bước 10: chọn OK',
    position: 'top',
    page: 'mwangen.htm',
    condition: function (doc) {
      return isVigor2927Bai6Wan1NameDone(doc) && isVigor2927Bai6Wan1InDone(doc) && isVigor2927Bai6Wan1OutDone(doc) && !doc._ftcIsSaved;
    }
  },
  /* Khi lưu xong WAN1, router quay lại General Setup -> điều hướng sang WAN2 */
  {
    selector: 'a[href*="gotoWanSet(2)"]',
    text: 'Bước 11: chọn WAN2',
    position: 'right',
    page: 'mwangen1',
    condition: function (doc) {
      return isVigor2927Bai6OverviewSaved(doc) && isVigor2927Bai6Wan1Saved(doc) && !isVigor2927Bai6Wan2Saved(doc);
    }
  },
  /* Trang WAN2 — phục vụ qua _pages/wan_03.html (wan.cgi) */
  {
    selector: 'input[name="sBwWanDisName"]',
    text: 'Bước 12: nhập ISP-2',
    position: 'right',
    page: 'wan.cgi',
    condition: function (doc) {
      return !isVigor2927Bai6Wan2NameDone(doc);
    }
  },
  {
    selector: 'select[name="uilBwLBInRateUnit"]',
    text: 'Bước 13: nhập 80 Mbps',
    position: 'right',
    page: 'wan.cgi',
    condition: function (doc) {
      return isVigor2927Bai6Wan2NameDone(doc) && !isVigor2927Bai6Wan2InDone(doc);
    }
  },
  {
    selector: 'select[name="uilBwLBOutRateUnit"]',
    text: 'Bước 14: nhập 80 Mbps',
    position: 'right',
    page: 'wan.cgi',
    condition: function (doc) {
      return isVigor2927Bai6Wan2NameDone(doc) && isVigor2927Bai6Wan2InDone(doc) && !isVigor2927Bai6Wan2OutDone(doc);
    }
  },
  {
    selector: 'input[name="submit"], input[value="OK"]',
    text: 'Bước 15: chọn OK',
    position: 'top',
    page: 'wan.cgi',
    condition: function (doc) {
      return isVigor2927Bai6Wan2NameDone(doc) && isVigor2927Bai6Wan2InDone(doc) && isVigor2927Bai6Wan2OutDone(doc) && !doc._ftcIsSaved;
    }
  }
];

function isVigor2927Bai7EnableDone(doc) {
  if (!doc) return false;
  var el = doc.querySelector('input[name="iPREnable"]');
  return el ? !!el.checked : false;
}

function isVigor2927Bai7CommentDone(doc) {
  if (!doc) return false;
  if (isVigor2927Bai7SrcRangeDone(doc)) return true;
  var el = doc.querySelector('input[name="comment"]');
  if (!el) return false;
  var val = (el.value || '').trim().toLowerCase();
  return val === 'ưu tiên wan 1' || val === 'wan 1' || val.includes('wan 1') || val.includes('ưu tiên');
}

function isVigor2927Bai7SrcRangeDone(doc) {
  if (!doc) return false;
  if (isVigor2927Bai7SrcStartDone(doc)) return true;
  var el = doc.querySelector('select[name="rdSIpAny"]');
  if (!el) return false;
  return (el.value === '1') || (el.options[el.selectedIndex] && el.options[el.selectedIndex].text.trim() === 'IP Range');
}

function isVigor2927Bai7SrcStartDone(doc) {
  if (!doc) return false;
  if (isVigor2927Bai7SrcEndDone(doc)) return true;
  var el = doc.querySelector('input[name="sPRSIpStart"]');
  return el ? (el.value || '').trim() === '192.168.1.100' : false;
}

function isVigor2927Bai7SrcEndDone(doc) {
  if (!doc) return false;
  if (isVigor2927Bai7WanIfConfirmed(doc)) return true;
  var el = doc.querySelector('input[name="iPRSIpCount"]');
  return el ? (el.value || '').trim() === '192.168.1.110' : false;
}

function hookVigor2927Bai7Interactions(doc) {
  if (!doc || doc._ftcBai7Hooked) return;
  doc._ftcBai7Hooked = true;

  var wanIfEl = doc.querySelector('select[name="multiwanWanIf"]');
  if (wanIfEl && typeof wanIfEl.addEventListener === 'function') {
    wanIfEl.addEventListener('click', function () { doc._ftcWanIfConfirmed = true; });
    wanIfEl.addEventListener('change', function () { doc._ftcWanIfConfirmed = true; });
    wanIfEl.addEventListener('focus', function () { doc._ftcWanIfConfirmed = true; });
  }

  var failoverEl = doc.querySelector('input[name="iPRFailover"]');
  if (failoverEl && typeof failoverEl.addEventListener === 'function') {
    failoverEl.addEventListener('click', function () {
      doc._ftcWanIfConfirmed = true;
    });
    failoverEl.addEventListener('change', function () {
      doc._ftcWanIfConfirmed = true;
    });
  }

  if (typeof doc.addEventListener === 'function') {
    doc.addEventListener('click', function (e) {
      var t = e.target;
      if (t && (t.id === 'image_option' || (t.closest && t.closest('td[onclick*="onClkMoreoption"], [onclick*="onClkMoreoption"]')))) {
        doc._ftcPriorityOpened = true;
      }
    }, true);
  }
}

function isVigor2927Bai7WanIfConfirmed(doc) {
  if (!doc) return false;
  hookVigor2927Bai7Interactions(doc);
  if (doc._ftcWanIfConfirmed) return true;
  if (isVigor2927Bai7FailoverDone(doc)) return true;
  return false;
}

function isVigor2927Bai7FailoverDone(doc) {
  if (!doc) return false;
  hookVigor2927Bai7Interactions(doc);
  if (isVigor2927Bai7FailoverWanDone(doc)) return true;
  var el = doc.querySelector('input[name="iPRFailover"]');
  return el ? !!el.checked : false;
}

function isVigor2927Bai7FailoverWanDone(doc) {
  if (!doc) return false;
  hookVigor2927Bai7Interactions(doc);
  if (isVigor2927Bai7PriorityValDone(doc)) return true;
  var el = doc.querySelector('select[name="failoverwan"]');
  if (!el) return false;
  if (el.value === '4') return true;
  var opt = el.options[el.selectedIndex];
  return opt ? (opt.text || '').trim().includes('WAN2') : false;
}

function isVigor2927Bai7PriorityValDone(doc) {
  if (!doc) return false;
  var el = doc.querySelector('input[name="sPriority"]');
  if (el) {
    var val = (el.value || '').trim();
    if (val === '1' || val === '0') return true;
  }
  return false;
}

function isVigor2927Bai7PriorityOpenDone(doc) {
  if (!doc) return false;
  hookVigor2927Bai7Interactions(doc);
  if (isVigor2927Bai7PriorityValDone(doc)) return true;
  if (doc._ftcPriorityOpened) return true;
  var img = doc.getElementById('image_option') || doc.querySelector('#image_option');
  if (img && img.src && img.src.indexOf('open.png') !== -1) return true;
  var win = doc.defaultView || doc.parentWindow;
  var parentWin = (win && win.parent) ? win.parent : win;
  var topWin = (win && win.top) ? win.top : win;
  if ((parentWin && parentWin.MoreOpen === 1) || (win && win.MoreOpen === 1) || (topWin && topWin.MoreOpen === 1)) return true;
  var tr = doc.querySelector('tr.option_detail');
  if (tr && tr.style && tr.style.display !== 'none' && (tr.offsetHeight > 0 || (tr.style.display !== '' && tr.style.display !== 'none'))) return true;
  return false;
}

function isVigor2927Bai7FailbackDone(doc) {
  if (!doc) return false;
  if (isVigor2927Bai7Saved(doc)) return true;
  var el = doc.querySelector('input[name="iPRFailback"]');
  return el ? !!el.checked : false;
}

function isVigor2927Bai7Saved(doc) {
  if (!doc) return false;
  var win = doc.defaultView || doc.parentWindow;
  var topWin = (win && win.top) ? win.top : ((typeof window !== 'undefined' && window.top) ? window.top : window);
  return Boolean(doc._ftcIsSaved || (win && win._ftcIsSaved) || (topWin && topWin._ftcIsSaved));
}

window.TOOLTIPS_VIGOR2927['vg2927-bai7'] = [
  {
    selector: '#menu-routing:not(.open) .menu-text, #menu-routing:not(.open)',
    text: 'Bước 1: chọn Routing',
    position: 'bottom',
    hideOnPage: 'policyrt1|v2x00.cgi'
  },
  {
    selector: '#sub-routing:not(.hidden) #menu-routing-policy .menu-text, #sub-routing:not(.hidden) #menu-routing-policy',
    text: 'Bước 2: chọn Load-Balance/Route Policy',
    position: 'bottom',
    hideOnPage: 'policyrt1|v2x00.cgi'
  },
  {
    selector: 'a[href*="gotoDetailSet(1)"], tr.row0 td:first-child a',
    text: 'Bước 3: chọn 1',
    position: 'right',
    page: 'policyrt1'
  },
  {
    selector: 'input[name="iPREnable"]',
    text: 'Bước 4: check vào Enable',
    position: 'right',
    page: 'v2x00.cgi',
    condition: function (doc) {
      return !isVigor2927Bai7EnableDone(doc);
    }
  },
  {
    selector: 'input[name="comment"]',
    text: 'Bước 5: nhập Ưu tiên Wan 1',
    position: 'top',
    page: 'v2x00.cgi',
    condition: function (doc) {
      return isVigor2927Bai7EnableDone(doc) && !isVigor2927Bai7CommentDone(doc);
    }
  },
  {
    selector: 'select[name="rdSIpAny"]',
    text: 'Bước 6: chọn IP Range',
    position: 'right',
    page: 'v2x00.cgi',
    condition: function (doc) {
      return isVigor2927Bai7EnableDone(doc) && isVigor2927Bai7CommentDone(doc) && !isVigor2927Bai7SrcRangeDone(doc);
    }
  },
  {
    selector: 'input[name="sPRSIpStart"]',
    text: 'Bước 7: nhập 192.168.1.100',
    position: 'bottom',
    page: 'v2x00.cgi',
    condition: function (doc) {
      return isVigor2927Bai7EnableDone(doc) && isVigor2927Bai7CommentDone(doc) && isVigor2927Bai7SrcRangeDone(doc) && !isVigor2927Bai7SrcStartDone(doc);
    }
  },
  {
    selector: 'input[name="iPRSIpCount"]',
    text: 'Bước 8: nhập 192.168.1.110',
    position: 'bottom',
    page: 'v2x00.cgi',
    condition: function (doc) {
      return isVigor2927Bai7EnableDone(doc) && isVigor2927Bai7CommentDone(doc) && isVigor2927Bai7SrcRangeDone(doc) && isVigor2927Bai7SrcStartDone(doc) && !isVigor2927Bai7SrcEndDone(doc);
    }
  },
  {
    selector: 'select[name="multiwanWanIf"]',
    text: 'Bước 9: Interface chính chọn WAN1',
    position: 'right',
    page: 'v2x00.cgi',
    condition: function (doc) {
      return isVigor2927Bai7EnableDone(doc) && isVigor2927Bai7CommentDone(doc) && isVigor2927Bai7SrcRangeDone(doc) && isVigor2927Bai7SrcStartDone(doc) && isVigor2927Bai7SrcEndDone(doc) && !isVigor2927Bai7WanIfConfirmed(doc);
    }
  },
  {
    selector: 'input[name="iPRFailover"]',
    text: 'Bước 10: check vào Failover to',
    position: 'right',
    page: 'v2x00.cgi',
    condition: function (doc) {
      return isVigor2927Bai7EnableDone(doc) && isVigor2927Bai7CommentDone(doc) && isVigor2927Bai7SrcRangeDone(doc) && isVigor2927Bai7SrcStartDone(doc) && isVigor2927Bai7SrcEndDone(doc) && !isVigor2927Bai7FailoverDone(doc);
    }
  },
  {
    selector: 'select[name="failoverwan"]',
    text: 'Bước 11: chọn WAN2',
    position: 'right',
    page: 'v2x00.cgi',
    condition: function (doc) {
      return isVigor2927Bai7EnableDone(doc) && isVigor2927Bai7CommentDone(doc) && isVigor2927Bai7SrcRangeDone(doc) && isVigor2927Bai7SrcStartDone(doc) && isVigor2927Bai7SrcEndDone(doc) && isVigor2927Bai7FailoverDone(doc) && !isVigor2927Bai7FailoverWanDone(doc);
    }
  },
  {
    selector: '#image_option, td[onclick*="onClkMoreoption"]',
    text: 'Bước 12: click vào + Priority',
    position: 'right',
    page: 'v2x00.cgi',
    condition: function (doc) {
      return isVigor2927Bai7EnableDone(doc) && isVigor2927Bai7CommentDone(doc) && isVigor2927Bai7SrcRangeDone(doc) && isVigor2927Bai7SrcStartDone(doc) && isVigor2927Bai7SrcEndDone(doc) && isVigor2927Bai7FailoverDone(doc) && isVigor2927Bai7FailoverWanDone(doc) && !isVigor2927Bai7PriorityOpenDone(doc);
    }
  },
  {
    selector: '#idShow, input[name="sPriority"]',
    text: 'Bước 13: kéo hoặc nhập số 1',
    position: 'top',
    page: 'v2x00.cgi',
    condition: function (doc) {
      return isVigor2927Bai7EnableDone(doc) && isVigor2927Bai7CommentDone(doc) && isVigor2927Bai7SrcRangeDone(doc) && isVigor2927Bai7SrcStartDone(doc) && isVigor2927Bai7SrcEndDone(doc) && isVigor2927Bai7FailoverDone(doc) && isVigor2927Bai7FailoverWanDone(doc) && isVigor2927Bai7PriorityOpenDone(doc) && !isVigor2927Bai7PriorityValDone(doc);
    }
  },
  {
    selector: 'input[name="iPRFailback"]',
    text: 'Bước 14: check vào Failback',
    position: 'right',
    page: 'v2x00.cgi',
    condition: function (doc) {
      return isVigor2927Bai7EnableDone(doc) && isVigor2927Bai7CommentDone(doc) && isVigor2927Bai7SrcRangeDone(doc) && isVigor2927Bai7SrcStartDone(doc) && isVigor2927Bai7SrcEndDone(doc) && isVigor2927Bai7FailoverDone(doc) && isVigor2927Bai7FailoverWanDone(doc) && isVigor2927Bai7PriorityValDone(doc) && !isVigor2927Bai7FailbackDone(doc);
    }
  },
  {
    selector: 'input[name="btnOk"], input[value="OK"]',
    text: 'Bước 15: chọn OK để lưu cấu hình',
    position: 'bottom',
    page: 'v2x00.cgi',
    condition: function (doc) {
      return isVigor2927Bai7EnableDone(doc) && isVigor2927Bai7CommentDone(doc) && isVigor2927Bai7SrcRangeDone(doc) && isVigor2927Bai7SrcStartDone(doc) && isVigor2927Bai7SrcEndDone(doc) && isVigor2927Bai7FailoverDone(doc) && isVigor2927Bai7FailoverWanDone(doc) && isVigor2927Bai7PriorityValDone(doc) && isVigor2927Bai7FailbackDone(doc) && !isVigor2927Bai7Saved(doc);
    }
  }
];

