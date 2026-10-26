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

function hookVigor2927Bai5Scroll(doc) {
  if (!doc) return;
  var pri = doc.querySelector ? doc.querySelector('input[name="sDNSPri"]') : null;
  var snd = doc.querySelector ? doc.querySelector('input[name="sDNSSnd"]') : null;
  var btn = doc.querySelector ? doc.querySelector('input[name="btnOK"], input[value="OK"]') : null;

  // Chỉ hook khi đã tìm thấy đầy đủ các trường trên trang lan_dt_1.html
  if (!pri || !snd || !btn) return;
  if (doc._ftcBai5ScrollHooked) return;
  doc._ftcBai5ScrollHooked = true;

  // Đảm bảo khi mới vào trang cấu hình LAN 1 (chưa bấm OK), cờ lưu cấu hình phải là false
  var hasSaveSuccessUrl = Boolean(doc.location && doc.location.search && doc.location.search.includes('save_success=1'));
  if (!doc._ftcIsSaved && !hasSaveSuccessUrl) {
    doc._ftcIsSaved = false;
    try {
      var win = doc.defaultView || doc.parentWindow;
      if (win) win._ftcIsSaved = false;
      var topWin = (typeof window !== 'undefined' && window.top) ? window.top : (doc.defaultView ? doc.defaultView.top : null);
      if (topWin) topWin._hasClickedSaveInGuide = false;
      if (typeof window !== 'undefined') window._hasClickedSaveInGuide = false;
      if (typeof parent !== 'undefined' && parent) parent._hasClickedSaveInGuide = false;
    } catch (e) { }
  }

  var triggerPortalPopups = function () {
    try {
      var topWin = doc.defaultView ? (doc.defaultView.top || doc.defaultView.parent) : null;
      if (topWin) {
        topWin.postMessage({ type: 'REQUEST_GUIDE_POPUPS' }, '*');
        if (typeof topWin.applyGuidePopups === 'function') {
          topWin.applyGuidePopups();
        }
      }
    } catch (e) { }
  };

  var checkAndScroll = function () {
    var priDone = (typeof isVigor2927Bai5PriDone === 'function') ? isVigor2927Bai5PriDone(doc) : (pri && (pri.value || '').trim() === '210.245.31.220');
    var sndDone = (typeof isVigor2927Bai5SndDone === 'function') ? isVigor2927Bai5SndDone(doc) : (snd && (snd.value || '').trim() === '8.8.8.8');
    if (priDone && sndDone && !doc._ftcIsSaved) {
      if (btn && typeof btn.scrollIntoView === 'function') {
        try {
          btn.scrollIntoView({ behavior: 'auto', block: 'center' });
        } catch (e) {
          btn.scrollIntoView();
        }
      }
      triggerPortalPopups();
      setTimeout(triggerPortalPopups, 80);
      setTimeout(triggerPortalPopups, 250);
    }
  };

  ['input', 'change', 'blur', 'keyup'].forEach(function (ev) {
    pri.addEventListener(ev, checkAndScroll);
    snd.addEventListener(ev, checkAndScroll);
  });

  ['input', 'change'].forEach(function (ev) {
    pri.addEventListener(ev, function () {
      var priDone = (typeof isVigor2927Bai5PriDone === 'function') ? isVigor2927Bai5PriDone(doc) : (pri && (pri.value || '').trim() === '210.245.31.220');
      if (doc._ftcIsSaved && !priDone) {
        doc._ftcIsSaved = false;
        try {
          var win = doc.defaultView || doc.parentWindow;
          if (win) win._ftcIsSaved = false;
          var topWin = (typeof window !== 'undefined' && window.top) ? window.top : (doc.defaultView ? doc.defaultView.top : null);
          if (topWin) topWin._hasClickedSaveInGuide = false;
          if (typeof window !== 'undefined') window._hasClickedSaveInGuide = false;
        } catch (e) { }
      }
    });
    snd.addEventListener(ev, function () {
      var sndDone = (typeof isVigor2927Bai5SndDone === 'function') ? isVigor2927Bai5SndDone(doc) : (snd && (snd.value || '').trim() === '8.8.8.8');
      if (doc._ftcIsSaved && !sndDone) {
        doc._ftcIsSaved = false;
        try {
          var win = doc.defaultView || doc.parentWindow;
          if (win) win._ftcIsSaved = false;
          var topWin = (typeof window !== 'undefined' && window.top) ? window.top : (doc.defaultView ? doc.defaultView.top : null);
          if (topWin) topWin._hasClickedSaveInGuide = false;
          if (typeof window !== 'undefined') window._hasClickedSaveInGuide = false;
        } catch (e) { }
      }
    });
  });

  btn.addEventListener('click', function () {
    doc._ftcIsSaved = true;
    try {
      var win = doc.defaultView || doc.parentWindow;
      if (win) win._ftcIsSaved = true;
      if (typeof window !== 'undefined') window._hasClickedSaveInGuide = true;
      if (typeof parent !== 'undefined' && parent) parent._hasClickedSaveInGuide = true;
      if (typeof top !== 'undefined' && top) top._hasClickedSaveInGuide = true;
      var topWin = (typeof window !== 'undefined' && window.top) ? window.top : (doc.defaultView ? doc.defaultView.top : null);
      if (topWin) {
        topWin._hasClickedSaveInGuide = true;
        if (typeof topWin.applyGuidePopups === 'function') {
          topWin.applyGuidePopups();
        }
      }
    } catch (e) { }
  });
}

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
      hookVigor2927Bai5Scroll(doc);
      if (typeof isVigor2927Bai5PriDone === 'function') return !isVigor2927Bai5PriDone(doc);
      var el = doc.querySelector ? doc.querySelector('input[name="sDNSPri"]') : null;
      return !el || (el.value || '').trim() !== '210.245.31.220';
    }
  },
  {
    selector: 'input[name="sDNSSnd"]',
    text: 'Bước 5: điền Secondary IP Address: 8.8.8.8',
    position: 'bottom',
    condition: function (doc) {
      hookVigor2927Bai5Scroll(doc);
      if (typeof isVigor2927Bai5PriDone === 'function' && typeof isVigor2927Bai5SndDone === 'function') {
        return isVigor2927Bai5PriDone(doc) && !isVigor2927Bai5SndDone(doc);
      }
      var pri = doc.querySelector ? doc.querySelector('input[name="sDNSPri"]') : null;
      var snd = doc.querySelector ? doc.querySelector('input[name="sDNSSnd"]') : null;
      return (pri && (pri.value || '').trim() === '210.245.31.220') && (!snd || (snd.value || '').trim() !== '8.8.8.8');
    }
  },
  {
    selector: 'input[name="btnOK"], input[value="OK"]',
    text: 'Bước 6: chọn OK để lưu cấu hình',
    position: 'top',
    condition: function (doc) {
      hookVigor2927Bai5Scroll(doc);
      var ok = false;
      if (typeof isVigor2927Bai5PriDone === 'function' && typeof isVigor2927Bai5SndDone === 'function') {
        ok = isVigor2927Bai5PriDone(doc) && isVigor2927Bai5SndDone(doc) && !doc._ftcIsSaved;
      } else {
        var pri = doc.querySelector ? doc.querySelector('input[name="sDNSPri"]') : null;
        var snd = doc.querySelector ? doc.querySelector('input[name="sDNSSnd"]') : null;
        ok = (pri && (pri.value || '').trim() === '210.245.31.220') && (snd && (snd.value || '').trim() === '8.8.8.8') && !doc._ftcIsSaved;
      }
      if (ok && doc) {
        var btn = doc.querySelector ? doc.querySelector('input[name="btnOK"], input[value="OK"]') : null;
        if (btn) {
          try {
            var win = doc.defaultView || window;
            var winH = win.innerHeight || (doc.documentElement && doc.documentElement.clientHeight) || 768;
            var rect = btn.getBoundingClientRect();
            if (rect.top > winH || rect.bottom < 0) {
              btn.scrollIntoView({ behavior: 'auto', block: 'center' });
            }
          } catch (e) {
            try { btn.scrollIntoView(); } catch (err) {}
          }
        }
      }
      return ok;
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
  hookVigor2927Bai7Interactions(doc);
  if (isVigor2927Bai7SrcEndDone(doc)) return true;
  var el = doc.querySelector('input[name="sPRSIpStart"]');
  return el ? (el.value || '').trim() === '192.168.1.100' : false;
}

function isVigor2927Bai7SrcEndDone(doc) {
  if (!doc) return false;
  hookVigor2927Bai7Interactions(doc);
  if (isVigor2927Bai7WanIfConfirmed(doc)) return true;
  var el = doc.querySelector('input[name="iPRSIpCount"]');
  return el ? (el.value || '').trim() === '192.168.1.110' : false;
}

function hookVigor2927Bai7Interactions(doc) {
  if (!doc) return;
  var srcStartEl = doc.querySelector ? doc.querySelector('input[name="sPRSIpStart"]') : null;
  var srcEndEl = doc.querySelector ? doc.querySelector('input[name="iPRSIpCount"]') : null;
  var wanIfEl = doc.querySelector ? doc.querySelector('select[name="multiwanWanIf"]') : null;
  var failoverEl = doc.querySelector ? doc.querySelector('input[name="iPRFailover"]') : null;

  if (doc._ftcBai7Hooked) return;
  if (!srcEndEl && !wanIfEl) return;
  doc._ftcBai7Hooked = true;

  var triggerPortalPopups = function () {
    try {
      var topWin = doc.defaultView ? (doc.defaultView.top || doc.defaultView.parent) : null;
      if (topWin) {
        topWin.postMessage({ type: 'REQUEST_GUIDE_POPUPS' }, '*');
        if (typeof topWin.applyGuidePopups === 'function') {
          topWin.applyGuidePopups();
        }
      }
    } catch (e) { }
  };

  var checkStep8AndScroll = function () {
    if (isVigor2927Bai7SrcStartDone(doc) && isVigor2927Bai7SrcEndDone(doc) && !isVigor2927Bai7WanIfConfirmed(doc)) {
      if (wanIfEl && typeof wanIfEl.scrollIntoView === 'function') {
        try {
          wanIfEl.scrollIntoView({ behavior: 'smooth', block: 'center' });
        } catch (e) {
          wanIfEl.scrollIntoView();
        }
      }
      triggerPortalPopups();
      setTimeout(triggerPortalPopups, 80);
      setTimeout(triggerPortalPopups, 250);
      setTimeout(triggerPortalPopups, 500);
    }
  };

  ['input', 'change', 'blur', 'keyup'].forEach(function (ev) {
    if (srcEndEl && typeof srcEndEl.addEventListener === 'function') {
      srcEndEl.addEventListener(ev, function () {
        checkStep8AndScroll();
      });
    }
    if (srcStartEl && typeof srcStartEl.addEventListener === 'function') {
      srcStartEl.addEventListener(ev, function () {
        triggerPortalPopups();
      });
    }
  });

  if (wanIfEl && typeof wanIfEl.addEventListener === 'function') {
    var confirmWanIf = function () {
      doc._ftcWanIfConfirmed = true;
      triggerPortalPopups();
      setTimeout(triggerPortalPopups, 80);
      setTimeout(triggerPortalPopups, 250);
    };
    wanIfEl.addEventListener('click', confirmWanIf);
    wanIfEl.addEventListener('change', confirmWanIf);
    wanIfEl.addEventListener('focus', confirmWanIf);
  }

  if (failoverEl && typeof failoverEl.addEventListener === 'function') {
    failoverEl.addEventListener('click', function () {
      doc._ftcWanIfConfirmed = true;
      triggerPortalPopups();
    });
    failoverEl.addEventListener('change', function () {
      doc._ftcWanIfConfirmed = true;
      triggerPortalPopups();
    });
  }

  if (typeof doc.addEventListener === 'function') {
    doc.addEventListener('click', function (e) {
      var t = e.target;
      if (t && (t.id === 'image_option' || (t.closest && t.closest('td[onclick*="onClkMoreoption"], [onclick*="onClkMoreoption"]')))) {
        doc._ftcPriorityOpened = true;
        triggerPortalPopups();
      }
    }, true);
  }

  var btnOk = doc.querySelector ? doc.querySelector('input[name="btnOk"], #upgradeforOK, input[value="OK"]') : null;
  if (btnOk && typeof btnOk.addEventListener === 'function') {
    btnOk.addEventListener('click', function () {
      doc._ftcIsSaved = true;
      try {
        var win = doc.defaultView || doc.parentWindow;
        if (win) win._ftcIsSaved = true;
        var topWin = (win && win.top) ? win.top : ((typeof window !== 'undefined' && window.top) ? window.top : window);
        if (topWin) {
          topWin._ftcIsSaved = true;
          topWin._hasClickedSaveInGuide = true;
        }
      } catch (e) { }
      triggerPortalPopups();
    });
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
  return Boolean(doc._ftcIsSaved || (win && win._ftcIsSaved) || (topWin && topWin._ftcIsSaved) || (topWin && topWin._hasClickedSaveInGuide));
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
    selector: '#lbl-route-enable, text:Enable, input[name="iPREnable"]',
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
    selector: '#lbl-route-failover, text:Failover to, input[name="iPRFailover"]',
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
    selector: '#lbl-route-priority, td[onclick*="onClkMoreoption"] b, text:Priority, #image_option',
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

window.vg2927Bai8Reset = function () {
  try {
    window._FTC_VG2927_BAI8 = null;
    window._ftcIsSaved = false;
    if (typeof window !== 'undefined' && window.top) {
      window.top._FTC_VG2927_BAI8 = null;
      window.top._ftcIsSaved = false;
      window.top._hasClickedSaveInGuide = false;
    }
    if (typeof parent !== 'undefined' && parent) {
      parent._FTC_VG2927_BAI8 = null;
      parent._ftcIsSaved = false;
      parent._hasClickedSaveInGuide = false;
    }
  } catch (e) { }
};

function syncVigor2927Bai8Table(doc) {
  if (!doc) return;
  var row0 = doc.querySelector ? doc.querySelector('tr.row0') : null;
  if (!row0) return;

  var win = doc.defaultView || doc.parentWindow;
  var topWin = (win && win.top) ? win.top : ((typeof window !== 'undefined' && window.top) ? window.top : window);
  var store = (topWin && topWin._FTC_VG2927_BAI8) || (typeof window !== 'undefined' && window._FTC_VG2927_BAI8) || (win && win._FTC_VG2927_BAI8) || (doc && doc._ftcBai8Snapshot);

  if (store && store.isSaved) {
    doc._ftcIsSaved = true;
    if (win) win._ftcIsSaved = true;
    if (topWin) {
      topWin._ftcIsSaved = true;
      topWin._hasClickedSaveInGuide = true;
    }

    var svc = store.svcName || 'Camera';
    var pubPort = store.pubPort || '8080';
    var prvIp = store.prvIp || '192.168.1.10';
    var proto = store.proto || 'TCP';
    var wanIf = store.wanIf || 'WAN1';
    var srcIp = store.srcIp || 'Any';

    try {
      if (win && Array.isArray(win.aryPtRedirect) && win.aryPtRedirect.length > 0) {
        win.aryPtRedirect[0] = [
          svc,
          prvIp,
          0,
          store.enable ? 1 : 0,
          parseInt(pubPort, 10) || 8080,
          0,
          proto === 'UDP' ? 17 : 6,
          srcIp
        ];
      }
    } catch (e) { }

    var tds = row0.querySelectorAll('td');
    if (tds && tds.length >= 9) {
      var chkEnable = tds[1].querySelector('input[type="checkbox"]');
      if (chkEnable) chkEnable.checked = true;
      tds[2].innerHTML = '&nbsp;' + svc;
      tds[3].innerHTML = '&nbsp;' + wanIf;
      tds[4].innerHTML = '&nbsp;' + proto;
      tds[5].innerHTML = '&nbsp;' + pubPort;
      tds[6].innerHTML = '&nbsp;' + srcIp;
      tds[7].innerHTML = '&nbsp;' + prvIp;
      var chkSelect = tds[8].querySelector('input[type="checkbox"]');
      if (chkSelect) chkSelect.checked = false;
    }
  } else {
    // Trạng thái phiên mới: Giữ nguyên mặc định xuất xưởng (trắng dòng 1)
    var tds = row0.querySelectorAll('td');
    if (tds && tds.length >= 9) {
      var chkEnable = tds[1].querySelector('input[type="checkbox"]');
      if (chkEnable && chkEnable.checked) chkEnable.checked = false;
      if (tds[2].innerText && tds[2].innerText.trim() === 'Camera') tds[2].innerHTML = '&nbsp;';
      if (tds[4].innerText && tds[4].innerText.trim() === 'TCP') tds[4].innerHTML = '&nbsp;';
      if (tds[5].innerText && tds[5].innerText.trim() === '8080') tds[5].innerHTML = '&nbsp;';
      if (tds[7].innerText && tds[7].innerText.trim() === '192.168.1.10') tds[7].innerHTML = '&nbsp;';
      var chkSelect = tds[8].querySelector('input[type="checkbox"]');
      if (chkSelect && chkSelect.checked) chkSelect.checked = false;
    }
  }
}

function hookVigor2927Bai8Interactions(doc) {
  if (!doc) return;
  syncVigor2927Bai8Table(doc);
  var enEl = doc.querySelector ? doc.querySelector('input[name="sPSrvEnable"]') : null;
  var modeEl = doc.querySelector ? doc.querySelector('select[name="sPSrvMode"]') : null;
  var svcEl = doc.querySelector ? doc.querySelector('input[name="sPSrvSvcName"]') : null;
  var protoEl = doc.querySelector ? doc.querySelector('select[name="sPSrvProto"]') : null;
  var wanIfEl = doc.querySelector ? doc.querySelector('select[name="sltWanIfIdx"]') : null;
  var pubPortEl = doc.querySelector ? doc.querySelector('input[name="sPSrvPubPort"]') : null;
  var srcIpEl = doc.querySelector ? doc.querySelector('select[name="sltSrcIP"]') : null;
  var prvIpEl = doc.querySelector ? doc.querySelector('input[name="sPSrvPrvIp"]') : null;
  var prvPortEl = doc.querySelector ? doc.querySelector('input[name="sPSrvPrvPort"]') : null;
  var btnOk = doc.querySelector ? doc.querySelector('input[name="btnOk"], #btn-nat-ok, input[value="OK"]') : null;

  if (!enEl && !svcEl && !pubPortEl) return;

  // Auto-Restore dữ liệu KTV đã lưu trước đó nếu quay lại trang
  try {
    var topWin = (typeof window !== 'undefined' && window.top) ? window.top : window;
    var store = (topWin && topWin._FTC_VG2927_BAI8) || (typeof window !== 'undefined' && window._FTC_VG2927_BAI8);
    if (store && store.isSaved) {
      if (enEl && !enEl.checked && store.enable) enEl.checked = true;
      if (svcEl && (!svcEl.value || svcEl.value === '') && store.svcName) svcEl.value = store.svcName;
      if (wanIfEl && store.wanIf) {
        if (store.wanIf === 'WAN1') wanIfEl.value = '0';
        else if (store.wanIf === 'ALL') wanIfEl.value = '6';
      }
      if (pubPortEl && (!pubPortEl.value || pubPortEl.value === '0') && store.pubPort) pubPortEl.value = store.pubPort;
      if (prvIpEl && (!prvIpEl.value || prvIpEl.value === '') && store.prvIp) prvIpEl.value = store.prvIp;
      if (prvPortEl && (!prvPortEl.value || prvPortEl.value === '0') && store.prvPort) prvPortEl.value = store.prvPort;
      doc._ftcIsSaved = true;
    }
  } catch (e) { }

  if (doc._ftcBai8Hooked) return;
  doc._ftcBai8Hooked = true;

  var triggerPortalPopups = function () {
    try {
      var topWin = doc.defaultView ? (doc.defaultView.top || doc.defaultView.parent) : null;
      if (topWin) {
        topWin.postMessage({ type: 'REQUEST_GUIDE_POPUPS' }, '*');
        if (typeof topWin.applyGuidePopups === 'function') {
          topWin.applyGuidePopups();
        }
      }
    } catch (e) { }
  };

  if (enEl && typeof enEl.addEventListener === 'function') {
    ['click', 'change'].forEach(function (ev) {
      enEl.addEventListener(ev, triggerPortalPopups);
    });
  }

  if (svcEl && typeof svcEl.addEventListener === 'function') {
    ['input', 'keyup', 'change', 'blur'].forEach(function (ev) {
      svcEl.addEventListener(ev, triggerPortalPopups);
    });
  }

  if (wanIfEl && typeof wanIfEl.addEventListener === 'function') {
    ['change', 'click'].forEach(function (ev) {
      wanIfEl.addEventListener(ev, triggerPortalPopups);
    });
  }

  if (pubPortEl && typeof pubPortEl.addEventListener === 'function') {
    ['input', 'keyup', 'change', 'blur'].forEach(function (ev) {
      pubPortEl.addEventListener(ev, triggerPortalPopups);
    });
  }

  if (prvIpEl && typeof prvIpEl.addEventListener === 'function') {
    ['input', 'keyup', 'change', 'blur'].forEach(function (ev) {
      prvIpEl.addEventListener(ev, triggerPortalPopups);
    });
  }

  if (prvPortEl && typeof prvPortEl.addEventListener === 'function') {
    ['input', 'keyup', 'change', 'blur'].forEach(function (ev) {
      prvPortEl.addEventListener(ev, triggerPortalPopups);
    });
  }

  if (btnOk && typeof btnOk.addEventListener === 'function') {
    btnOk.addEventListener('click', function () {
      if (!isVigor2927Bai8AllInputsDone(doc)) {
        triggerPortalPopups();
        return;
      }

      var snapshot = {
        enable: enEl ? !!enEl.checked : false,
        mode: modeEl ? (modeEl.options && modeEl.options[modeEl.selectedIndex] ? modeEl.options[modeEl.selectedIndex].text : modeEl.value) : 'Single',
        svcName: svcEl ? (svcEl.value || '').trim() : '',
        proto: protoEl ? (protoEl.options && protoEl.options[protoEl.selectedIndex] ? protoEl.options[protoEl.selectedIndex].text : protoEl.value) : 'TCP',
        wanIf: (function () {
          if (!wanIfEl) return 'WAN1';
          var opt = wanIfEl.options ? wanIfEl.options[wanIfEl.selectedIndex] : null;
          var txt = opt ? (opt.text || opt.value || '').trim() : (wanIfEl.value || '').trim();
          if (txt.toUpperCase() === 'WAN1' || wanIfEl.value === '0') return 'WAN1';
          return txt || wanIfEl.value || 'WAN1';
        })(),
        pubPort: pubPortEl ? (pubPortEl.value || '').trim() : '',
        srcIp: srcIpEl ? (srcIpEl.options && srcIpEl.options[srcIpEl.selectedIndex] ? srcIpEl.options[srcIpEl.selectedIndex].text : srcIpEl.value) : 'Any',
        prvIp: prvIpEl ? (prvIpEl.value || '').trim() : '',
        prvPort: prvPortEl ? (prvPortEl.value || '').trim() : '',
        isSaved: true,
        savedAt: Date.now()
      };

      doc._ftcIsSaved = true;
      doc._ftcBai8Snapshot = snapshot;
      try {
        var win = doc.defaultView || doc.parentWindow;
        if (win) {
          win._ftcIsSaved = true;
          win._ftcBai8Snapshot = snapshot;
        }
        var topWin = (win && win.top) ? win.top : ((typeof window !== 'undefined' && window.top) ? window.top : window);
        if (topWin) {
          topWin._ftcIsSaved = true;
          topWin._hasClickedSaveInGuide = true;
          topWin._FTC_VG2927_BAI8 = snapshot;
        }
        if (typeof window !== 'undefined') {
          window._FTC_VG2927_BAI8 = snapshot;
        }
      } catch (e) { }
      triggerPortalPopups();
      try {
        doc.location.href = '/cgi-bin/ipnat.cgi?fid=0&iPageIdx=1&save_success=1';
      } catch (e) { }
    });
  }
}

function isVigor2927Bai8EnableDone(doc) {
  if (!doc) return false;
  hookVigor2927Bai8Interactions(doc);
  var el = doc.querySelector('input[name="sPSrvEnable"]');
  return el ? !!el.checked : false;
}

function isVigor2927Bai8SvcDone(doc) {
  if (!doc) return false;
  hookVigor2927Bai8Interactions(doc);
  var el = doc.querySelector('input[name="sPSrvSvcName"]');
  return el ? (el.value || '').trim().toUpperCase() === 'CAMERA' : false;
}

function isVigor2927Bai8WanDone(doc) {
  if (!doc) return false;
  hookVigor2927Bai8Interactions(doc);
  var el = doc.querySelector('select[name="sltWanIfIdx"]');
  if (!el) return false;
  var opt = el.options && el.options[el.selectedIndex];
  var txt = opt ? (opt.text || opt.value || '').trim().toUpperCase() : (el.value || '').trim().toUpperCase();
  return txt === 'WAN1' || el.value === '0';
}

function isVigor2927Bai8PubPortDone(doc) {
  if (!doc) return false;
  hookVigor2927Bai8Interactions(doc);
  var el = doc.querySelector('input[name="sPSrvPubPort"]');
  return el ? (el.value || '').trim() === '8080' : false;
}

function isVigor2927Bai8PrvIpDone(doc) {
  if (!doc) return false;
  hookVigor2927Bai8Interactions(doc);
  var el = doc.querySelector('input[name="sPSrvPrvIp"]');
  return el ? (el.value || '').trim() === '192.168.1.10' : false;
}

function isVigor2927Bai8PrvPortDone(doc) {
  if (!doc) return false;
  hookVigor2927Bai8Interactions(doc);
  var el = doc.querySelector('input[name="sPSrvPrvPort"]');
  return el ? (el.value || '').trim() === '8080' : false;
}

function isVigor2927Bai8AllInputsDone(doc) {
  return isVigor2927Bai8EnableDone(doc) &&
         isVigor2927Bai8SvcDone(doc) &&
         isVigor2927Bai8WanDone(doc) &&
         isVigor2927Bai8PubPortDone(doc) &&
         isVigor2927Bai8PrvIpDone(doc) &&
         isVigor2927Bai8PrvPortDone(doc);
}

function isVigor2927Bai8Saved(doc) {
  if (!doc) return false;
  syncVigor2927Bai8Table(doc);
  var win = doc.defaultView || doc.parentWindow;
  var topWin = (win && win.top) ? win.top : ((typeof window !== 'undefined' && window.top) ? window.top : window);
  var store = (topWin && topWin._FTC_VG2927_BAI8) || (typeof window !== 'undefined' && window._FTC_VG2927_BAI8) || (win && win._FTC_VG2927_BAI8) || (doc && doc._ftcBai8Snapshot);
  if (store && store.isSaved) return true;
  return false;
}

window.TOOLTIPS_VIGOR2927['vg2927-bai8'] = [
  {
    selector: '#menu-nat:not(.open) .menu-text, #menu-nat:not(.open)',
    text: 'Bước 1: chọn NAT',
    position: 'bottom',
    hideOnPage: 'page_042|p2_130|ipnat.cgi|ipnat'
  },
  {
    selector: '#sub-nat:not(.hidden) #menu-nat-port-redirection .menu-text, #sub-nat:not(.hidden) #menu-nat-port-redirection',
    text: 'Bước 2: chọn Port Redirection',
    position: 'bottom',
    hideOnPage: 'page_042|p2_130|ipnat.cgi|ipnat'
  },
  {
    selector: 'a[href*="gotoDetailSet(1)"], tr.row0 td:first-child a',
    text: 'Bước 3: chọn 1',
    position: 'right',
    page: 'page_042|deep_032|ipnatp1|fid=0',
    condition: function (doc) {
      syncVigor2927Bai8Table(doc);
      return !isVigor2927Bai8Saved(doc);
    }
  },
  {
    selector: '#lbl-nat-enable, #chk-nat-enable, input[name="sPSrvEnable"]',
    text: 'Bước 4: check vào Enable',
    position: 'right',
    page: 'p2_130|ipnatp|fid=1',
    condition: function (doc) {
      return !isVigor2927Bai8EnableDone(doc);
    }
  },
  {
    selector: 'input[name="sPSrvSvcName"]',
    text: 'Bước 5: nhập Camera',
    position: 'right',
    page: 'p2_130|ipnatp|fid=1',
    condition: function (doc) {
      return isVigor2927Bai8EnableDone(doc) && !isVigor2927Bai8SvcDone(doc);
    }
  },
  {
    selector: 'select[name="sltWanIfIdx"]',
    text: 'Bước 6: WAN Interface chọn WAN1',
    position: 'right',
    page: 'p2_130|ipnatp|fid=1',
    condition: function (doc) {
      return isVigor2927Bai8EnableDone(doc) && isVigor2927Bai8SvcDone(doc) && !isVigor2927Bai8WanDone(doc);
    }
  },
  {
    selector: 'input[name="sPSrvPubPort"]',
    text: 'Bước 7: nhập 8080',
    position: 'right',
    page: 'p2_130|ipnatp|fid=1',
    condition: function (doc) {
      return isVigor2927Bai8EnableDone(doc) && isVigor2927Bai8SvcDone(doc) && isVigor2927Bai8WanDone(doc) && !isVigor2927Bai8PubPortDone(doc);
    }
  },
  {
    selector: 'input[name="sPSrvPrvIp"]',
    text: 'Bước 8: nhập 192.168.1.10',
    position: 'right',
    page: 'p2_130|ipnatp|fid=1',
    condition: function (doc) {
      return isVigor2927Bai8EnableDone(doc) && isVigor2927Bai8SvcDone(doc) && isVigor2927Bai8WanDone(doc) && isVigor2927Bai8PubPortDone(doc) && !isVigor2927Bai8PrvIpDone(doc);
    }
  },
  {
    selector: 'input[name="sPSrvPrvPort"]',
    text: 'Bước 9: nhập 8080',
    position: 'right',
    page: 'p2_130|ipnatp|fid=1',
    condition: function (doc) {
      return isVigor2927Bai8EnableDone(doc) && isVigor2927Bai8SvcDone(doc) && isVigor2927Bai8WanDone(doc) && isVigor2927Bai8PubPortDone(doc) && isVigor2927Bai8PrvIpDone(doc) && !isVigor2927Bai8PrvPortDone(doc);
    }
  },
  {
    selector: '#btn-nat-ok, input[name="btnOk"], input[value="OK"]',
    text: 'Bước 10: chọn OK để lưu cấu hình',
    position: 'top',
    page: 'p2_130|ipnatp|fid=1',
    condition: function (doc) {
      return isVigor2927Bai8AllInputsDone(doc) && !isVigor2927Bai8Saved(doc);
    }
  }
];

