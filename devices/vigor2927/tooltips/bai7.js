/**
 * devices/vigor2927/tooltips/bai7.js — Tooltip Hướng dẫn cho Bài 7: Cấu hình Policy Routing
 */

if (!window.TOOLTIPS_VIGOR2927) window.TOOLTIPS_VIGOR2927 = {};

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
      return isVigor2927Bai7EnableDone(doc) && isVigor2927Bai7CommentDone(doc) && isVigor2927Bai7SrcRangeDone(doc) && isVigor2927Bai7SrcStartDone(doc) && isVigor2927Bai7SrcEndDone(doc) && isVigor2927Bai7WanIfConfirmed(doc) && !isVigor2927Bai7FailoverDone(doc);
    }
  },
  {
    selector: 'select[name="failoverwan"]',
    text: 'Bước 11: chọn WAN2',
    position: 'right',
    page: 'v2x00.cgi',
    condition: function (doc) {
      return isVigor2927Bai7EnableDone(doc) && isVigor2927Bai7CommentDone(doc) && isVigor2927Bai7SrcRangeDone(doc) && isVigor2927Bai7SrcStartDone(doc) && isVigor2927Bai7SrcEndDone(doc) && isVigor2927Bai7WanIfConfirmed(doc) && isVigor2927Bai7FailoverDone(doc) && !isVigor2927Bai7FailoverWanDone(doc);
    }
  },
  {
    selector: '#image_option, td[onclick*="onClkMoreoption"]',
    text: 'Bước 12: click vào + Priority',
    position: 'right',
    page: 'v2x00.cgi',
    condition: function (doc) {
      return isVigor2927Bai7EnableDone(doc) && isVigor2927Bai7CommentDone(doc) && isVigor2927Bai7SrcRangeDone(doc) && isVigor2927Bai7SrcStartDone(doc) && isVigor2927Bai7SrcEndDone(doc) && isVigor2927Bai7WanIfConfirmed(doc) && isVigor2927Bai7FailoverDone(doc) && isVigor2927Bai7FailoverWanDone(doc) && !isVigor2927Bai7PriorityOpenDone(doc);
    }
  },
  {
    selector: '#idShow, input[name="sPriority"]',
    text: 'Bước 13: kéo hoặc nhập số 1',
    position: 'top',
    page: 'v2x00.cgi',
    condition: function (doc) {
      return isVigor2927Bai7EnableDone(doc) && isVigor2927Bai7CommentDone(doc) && isVigor2927Bai7SrcRangeDone(doc) && isVigor2927Bai7SrcStartDone(doc) && isVigor2927Bai7SrcEndDone(doc) && isVigor2927Bai7WanIfConfirmed(doc) && isVigor2927Bai7FailoverDone(doc) && isVigor2927Bai7FailoverWanDone(doc) && isVigor2927Bai7PriorityOpenDone(doc) && !isVigor2927Bai7PriorityValDone(doc);
    }
  },
  {
    selector: 'input[name="iPRFailback"]',
    text: 'Bước 14: check vào Failback',
    position: 'right',
    page: 'v2x00.cgi',
    condition: function (doc) {
      return isVigor2927Bai7EnableDone(doc) && isVigor2927Bai7CommentDone(doc) && isVigor2927Bai7SrcRangeDone(doc) && isVigor2927Bai7SrcStartDone(doc) && isVigor2927Bai7SrcEndDone(doc) && isVigor2927Bai7WanIfConfirmed(doc) && isVigor2927Bai7FailoverDone(doc) && isVigor2927Bai7FailoverWanDone(doc) && isVigor2927Bai7PriorityValDone(doc) && !isVigor2927Bai7FailbackDone(doc);
    }
  },
  {
    selector: 'input[name="btnOk"], input[value="OK"]',
    text: 'Bước 15: chọn OK để lưu cấu hình',
    position: 'bottom',
    page: 'v2x00.cgi',
    condition: function (doc) {
      return isVigor2927Bai7EnableDone(doc) && isVigor2927Bai7CommentDone(doc) && isVigor2927Bai7SrcRangeDone(doc) && isVigor2927Bai7SrcStartDone(doc) && isVigor2927Bai7SrcEndDone(doc) && isVigor2927Bai7WanIfConfirmed(doc) && isVigor2927Bai7FailoverDone(doc) && isVigor2927Bai7FailoverWanDone(doc) && isVigor2927Bai7PriorityValDone(doc) && isVigor2927Bai7FailbackDone(doc) && !isVigor2927Bai7Saved(doc);
    }
  }
];
