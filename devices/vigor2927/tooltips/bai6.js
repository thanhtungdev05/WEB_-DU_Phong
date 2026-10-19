/**
 * devices/vigor2927/tooltips/bai6.js — Tooltip Hướng dẫn cho Bài 6: Cấu hình Load Balancing
 */

if (!window.TOOLTIPS_VIGOR2927) window.TOOLTIPS_VIGOR2927 = {};

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
    condition: function(doc) {
      return !isVigor2927Bai6ModeDone(doc);
    }
  },
  {
    selector: '.ldbn select[name="iBwLBMode"], select[name="iBwLBMode"]',
    text: 'Bước 4: chọn According to Line Speed',
    position: 'right',
    page: 'mwangen1',
    condition: function(doc) {
      return isVigor2927Bai6ModeDone(doc) && !isVigor2927Bai6LineSpeedDone(doc);
    }
  },
  {
    selector: 'input[name="btnOk"], input[value="OK"]',
    text: 'Bước 5: chọn OK để lưu cấu hình, sau đó cấu hình tiếp WAN1 và WAN2.',
    position: 'top',
    page: 'mwangen1',
    condition: function(doc) {
      return isVigor2927Bai6ModeDone(doc) && isVigor2927Bai6LineSpeedDone(doc) && !isVigor2927Bai6OverviewSaved(doc);
    }
  },
  /* Chuyển tiếp sang WAN1 trên trang General Setup */
  {
    selector: 'a[href*="gotoWanSet(1)"]',
    text: 'Bước 6: chọn WAN1',
    position: 'right',
    page: 'mwangen1',
    condition: function(doc) {
      return isVigor2927Bai6OverviewSaved(doc) && !isVigor2927Bai6Wan1Saved(doc);
    }
  },
  /* Trang WAN1 (doc/mwangen.htm) — dùng 'mwangen.htm' (có đuôi .htm) để KHÔNG bị trùng
     với trang tổng 'mwangen1.htm' (so khớp theo chuỗi con: "mwangen.htm" không nằm
     trong "mwangen1.htm" vì có số 1 chen giữa). */
  {
    selector: 'input[name="sBwWanDisName"]',
    text: 'Bước 7: nhập ISP-1',
    position: 'right',
    page: 'mwangen.htm',
    condition: function(doc) {
      return !isVigor2927Bai6Wan1NameDone(doc);
    }
  },
  {
    selector: 'select[name="uilBwLBInRateUnit"]',
    text: 'Bước 8: nhập 80 Mbps',
    position: 'right',
    page: 'mwangen.htm',
    condition: function(doc) {
      return isVigor2927Bai6Wan1NameDone(doc) && !isVigor2927Bai6Wan1InDone(doc);
    }
  },
  {
    selector: 'select[name="uilBwLBOutRateUnit"]',
    text: 'Bước 9: nhập 80 Mbps',
    position: 'right',
    page: 'mwangen.htm',
    condition: function(doc) {
      return isVigor2927Bai6Wan1NameDone(doc) && isVigor2927Bai6Wan1InDone(doc) && !isVigor2927Bai6Wan1OutDone(doc);
    }
  },
  {
    selector: 'input[name="submit"], input[value="OK"]',
    text: 'Bước 10: chọn OK',
    position: 'top',
    page: 'mwangen.htm',
    condition: function(doc) {
      return isVigor2927Bai6Wan1NameDone(doc) && isVigor2927Bai6Wan1InDone(doc) && isVigor2927Bai6Wan1OutDone(doc) && !doc._ftcIsSaved;
    }
  },
  /* Khi lưu xong WAN1, router quay lại General Setup -> điều hướng sang WAN2 */
  {
    selector: 'a[href*="gotoWanSet(2)"]',
    text: 'Bước 11: chọn WAN2',
    position: 'right',
    page: 'mwangen1',
    condition: function(doc) {
      return isVigor2927Bai6OverviewSaved(doc) && isVigor2927Bai6Wan1Saved(doc) && !isVigor2927Bai6Wan2Saved(doc);
    }
  },
  /* Trang WAN2 — phục vụ qua _pages/wan_03.html, KHÔNG có tên file .htm riêng biệt trên URL
     (server trả thẳng nội dung tại chính URL POST, không redirect) — URL frame lúc đó là
     ".../cgi-bin/wan.cgi". Trong phạm vi Bài 6, đây là trang DUY NHẤT có "wan.cgi" trong URL
     (General Setup và WAN1 đều bị app.js chặn submit thật nên không bao giờ điều hướng tới
     URL này), nên dùng "wan.cgi" làm chuỗi lọc là an toàn, không lẫn sang 2 trang kia. */
  {
    selector: 'input[name="sBwWanDisName"]',
    text: 'Bước 12: nhập ISP-2',
    position: 'right',
    page: 'wan.cgi',
    condition: function(doc) {
      return !isVigor2927Bai6Wan2NameDone(doc);
    }
  },
  {
    selector: 'select[name="uilBwLBInRateUnit"]',
    text: 'Bước 13: nhập 80 Mbps',
    position: 'right',
    page: 'wan.cgi',
    condition: function(doc) {
      return isVigor2927Bai6Wan2NameDone(doc) && !isVigor2927Bai6Wan2InDone(doc);
    }
  },
  {
    selector: 'select[name="uilBwLBOutRateUnit"]',
    text: 'Bước 14: nhập 80 Mbps',
    position: 'right',
    page: 'wan.cgi',
    condition: function(doc) {
      return isVigor2927Bai6Wan2NameDone(doc) && isVigor2927Bai6Wan2InDone(doc) && !isVigor2927Bai6Wan2OutDone(doc);
    }
  },
  {
    selector: 'input[name="submit"], input[value="OK"]',
    text: 'Bước 15: chọn OK',
    position: 'top',
    page: 'wan.cgi',
    condition: function(doc) {
      return isVigor2927Bai6Wan2NameDone(doc) && isVigor2927Bai6Wan2InDone(doc) && isVigor2927Bai6Wan2OutDone(doc) && !doc._ftcIsSaved;
    }
  }
];
