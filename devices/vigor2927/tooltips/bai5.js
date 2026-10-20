/**
 * devices/vigor2927/tooltips/bai5.js — Tooltip Hướng dẫn cho Bài 5: Cấu hình DNS
 */

if (!window.TOOLTIPS_VIGOR2927) window.TOOLTIPS_VIGOR2927 = {};

function isVigor2927Bai5PriDone(doc) {
  if (!doc) return false;
  var el = doc.querySelector('input[name="sDNSPri"]');
  return el ? (el.value || '').trim() === '210.245.31.220' : false;
}

function isVigor2927Bai5SndDone(doc) {
  if (!doc) return false;
  var el = doc.querySelector('input[name="sDNSSnd"]');
  return el ? (el.value || '').trim() === '8.8.8.8' : false;
}

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
    if (isVigor2927Bai5PriDone(doc) && isVigor2927Bai5SndDone(doc) && !doc._ftcIsSaved) {
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
      if (doc._ftcIsSaved && !isVigor2927Bai5PriDone(doc)) {
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
      if (doc._ftcIsSaved && !isVigor2927Bai5SndDone(doc)) {
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
    condition: function(doc) {
      hookVigor2927Bai5Scroll(doc);
      return !isVigor2927Bai5PriDone(doc);
    }
  },
  {
    selector: 'input[name="sDNSSnd"]',
    text: 'Bước 5: điền Secondary IP Address: 8.8.8.8',
    position: 'bottom',
    condition: function(doc) {
      hookVigor2927Bai5Scroll(doc);
      return isVigor2927Bai5PriDone(doc) && !isVigor2927Bai5SndDone(doc);
    }
  },
  {
    selector: 'input[name="btnOK"], input[value="OK"]',
    text: 'Bước 6: chọn OK để lưu cấu hình',
    position: 'top',
    condition: function(doc) {
      hookVigor2927Bai5Scroll(doc);
      var isReady = isVigor2927Bai5PriDone(doc) && isVigor2927Bai5SndDone(doc) && !doc._ftcIsSaved;
      if (isReady && doc) {
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
      return isReady;
    }
  }
];
