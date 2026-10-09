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
      return !isVigor2927Bai5PriDone(doc);
    }
  },
  {
    selector: 'input[name="sDNSSnd"]',
    text: 'Bước 5: điền Secondary IP Address: 8.8.8.8',
    position: 'bottom',
    condition: function(doc) {
      return isVigor2927Bai5PriDone(doc) && !isVigor2927Bai5SndDone(doc);
    }
  },
  {
    selector: 'input[name="btnOK"], input[value="OK"]',
    text: 'Bước 6: chọn OK để lưu cấu hình',
    position: 'top',
    condition: function(doc) {
      return isVigor2927Bai5PriDone(doc) && isVigor2927Bai5SndDone(doc) && !doc._ftcIsSaved;
    }
  }
];
