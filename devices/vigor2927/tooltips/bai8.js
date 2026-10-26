/**
 * devices/vigor2927/tooltips/bai8.js — Tooltip Hướng dẫn cho Bài 8: Cấu hình NAT Port (Port Redirection)
 * Tinh gọn 9 bước tập trung đúng vào các thao tác KTV cần cấu hình.
 */

if (!window.TOOLTIPS_VIGOR2927) window.TOOLTIPS_VIGOR2927 = {};

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
