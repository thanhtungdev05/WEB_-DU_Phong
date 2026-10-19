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
  if (!doc || doc._ftcBai5ScrollHooked) return;
  doc._ftcBai5ScrollHooked = true;
  var pri = doc.querySelector ? doc.querySelector('input[name="sDNSPri"]') : null;
  var snd = doc.querySelector ? doc.querySelector('input[name="sDNSSnd"]') : null;
  var btn = doc.querySelector ? doc.querySelector('input[name="btnOK"], input[value="OK"]') : null;

  var checkAndScroll = function () {
    if (isVigor2927Bai5PriDone(doc) && isVigor2927Bai5SndDone(doc) && !doc._ftcIsSaved) {
      if (btn && typeof btn.scrollIntoView === 'function') {
        try {
          btn.scrollIntoView({ behavior: 'smooth', block: 'center' });
        } catch (e) {
          btn.scrollIntoView();
        }
      }
    }
  };

  if (pri && typeof pri.addEventListener === 'function') {
    pri.addEventListener('input', checkAndScroll);
    pri.addEventListener('change', checkAndScroll);
    pri.addEventListener('blur', checkAndScroll);
  }
  if (snd && typeof snd.addEventListener === 'function') {
    snd.addEventListener('input', checkAndScroll);
    snd.addEventListener('change', checkAndScroll);
    snd.addEventListener('blur', checkAndScroll);
  }
  if (btn && typeof btn.addEventListener === 'function') {
    btn.addEventListener('click', function () {
      doc._ftcIsSaved = true;
      try {
        var win = doc.defaultView || doc.parentWindow;
        if (win) win._ftcIsSaved = true;
        if (typeof window !== 'undefined') window._hasClickedSaveInGuide = true;
        if (typeof parent !== 'undefined' && parent) parent._hasClickedSaveInGuide = true;
        if (typeof top !== 'undefined' && top) top._hasClickedSaveInGuide = true;
      } catch (e) { }
    });
  }
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
      if (isReady && doc && !doc._ftcScrolledToOk) {
        doc._ftcScrolledToOk = true;
        var btn = doc.querySelector ? doc.querySelector('input[name="btnOK"], input[value="OK"]') : null;
        if (btn && typeof btn.scrollIntoView === 'function') {
          try {
            btn.scrollIntoView({ behavior: 'smooth', block: 'center' });
          } catch (e) {
            btn.scrollIntoView();
          }
        }
      }
      return isReady;
    }
  }
];
