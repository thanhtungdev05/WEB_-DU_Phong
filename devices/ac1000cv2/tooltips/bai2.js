/**
 * devices/ac1000cv2/tooltips/bai2.js — Tooltip Hướng dẫn cho Bài 2: Cấu hình Wi-Fi 2.4G & 5G
 *
 * Thiết kế tuần tự (Step-by-Step) nghiêm ngặt:
 * Mỗi thời điểm CHỈ HIỂN THỊ DUY NHẤT 1 TOOLTIP để không gây khó chịu cho người dùng.
 * Phân chia theo 4 trang:
 * 1. wifissid.html (2.4G SSID) -> Bước 1 (nhập), Bước 2 (Apply), Bước 3 (chuyển Security 2.4G)
 * 2. wifisecu.html (2.4G Security) -> Bước 4 (nhập), Bước 5 (Apply), Bước 6 (chuyển SSID 5G)
 * 3. wifi5ssid.html (5G SSID) -> Bước 7 (nhập), Bước 8 (Apply), Bước 9 (chuyển Security 5G)
 * 4. wifi5secu.html (5G Security) -> Bước 10 (nhập), Bước 11 (Apply), Bước 12 (Hoàn thành)
 */

if (!window.TOOLTIPS_AC1000CV2) window.TOOLTIPS_AC1000CV2 = {};

function getAc1000cV2DocPath(doc) {
  try {
    return (doc && doc.location && doc.location.pathname) ? doc.location.pathname.toLowerCase() : '';
  } catch (e) {
    return '';
  }
}

function isAc1000cV2Saved(doc, ruleId, currentVal) {
  if (doc && doc._ftcIsSaved) return true;
  var cache = window._sessionRuleCache || {};
  if (cache[ruleId] && cache[ruleId].isSaved) {
    if (currentVal) {
      return (cache[ruleId].actualValue === currentVal);
    }
    return true;
  }
  return false;
}

var bai2_popups = [
  // ── DẪN ĐƯỜNG BAN ĐẦU (Nếu ở trang khác như devinfo.html, wifibasic.html) ──
  {
    selector: '#main_menu #mm2 a, #mm2 a, li.m1_wireless a, a[href*="wifibasic.html"]',
    text: 'Bước 1: Chọn menu Wireless Setup',
    position: 'bottom',
    hideOnPage: 'wifissid.html',
    condition: function (doc) {
      var p = getAc1000cV2DocPath(doc);
      var isKnown = (p.indexOf('wifissid') !== -1 || p.indexOf('wifisecu') !== -1 || p.indexOf('wifi5ssid') !== -1 || p.indexOf('wifi5secu') !== -1);
      return !isKnown && !doc.querySelector('#sub_menu a[href*="wifissid.html"]');
    }
  },
  {
    selector: '#sub_menu a[href*="wifissid.html"], #wifissid a',
    text: 'Bước 1: Chọn mục SSID (2.4GHz) ở menu bên trái',
    position: 'right',
    hideOnPage: 'wifissid.html',
    condition: function (doc) {
      var p = getAc1000cV2DocPath(doc);
      var isKnown = (p.indexOf('wifissid') !== -1 || p.indexOf('wifisecu') !== -1 || p.indexOf('wifi5ssid') !== -1 || p.indexOf('wifi5secu') !== -1);
      return !isKnown && !!doc.querySelector('#sub_menu a[href*="wifissid.html"]');
    }
  },

  // ── PHẦN 1: WI-FI 2.4GHz SSID (wifissid.html) ──
  // Bước 1: Nhập SSID 2.4G
  {
    page: 'wifissid.html',
    selector: 'input[name="ssid_network_name"], #ssid_network_name',
    text: 'Bước 1: Nhập tên Wi-Fi 2.4GHz: FPT Telecom',
    position: 'right',
    expected: 'FPT Telecom',
    condition: function (doc) {
      var p = getAc1000cV2DocPath(doc);
      if (p.indexOf('wifissid') === -1) return false;
      var el = doc.querySelector('#ssid_network_name, input[name="ssid_network_name"]');
      var val = el ? (el.value || '').trim() : '';
      var isTyped = (val === 'FPT Telecom');
      var isSaved = isAc1000cV2Saved(doc, 'wifi24_ssid', val);
      return !isTyped && !isSaved;
    }
  },
  // Bước 2: Bấm Apply lưu SSID 2.4G
  {
    page: 'wifissid.html',
    selector: '#btn_apply, a#btn_apply, .cfgstep a.btn',
    text: 'Bước 2: Nhấn Apply để lưu tên Wi-Fi 2.4GHz',
    position: 'top',
    condition: function (doc) {
      var p = getAc1000cV2DocPath(doc);
      if (p.indexOf('wifissid') === -1) return false;
      var el = doc.querySelector('#ssid_network_name, input[name="ssid_network_name"]');
      var val = el ? (el.value || '').trim() : '';
      var isTyped = (val === 'FPT Telecom');
      var isSaved = isAc1000cV2Saved(doc, 'wifi24_ssid', val);
      return isTyped && !isSaved;
    }
  },
  // Bước 3: Chuyển sang mục Security 2.4GHz
  {
    page: 'wifissid.html',
    selector: '#sub_menu a[href*="wifisecu.html"], #sub_menu #wifisecu a',
    text: 'Bước 3: Chọn mục Security (2.4GHz) ở menu bên trái để đổi mật khẩu',
    position: 'right',
    condition: function (doc) {
      var p = getAc1000cV2DocPath(doc);
      if (p.indexOf('wifissid') === -1) return false;
      var el = doc.querySelector('#ssid_network_name, input[name="ssid_network_name"]');
      var val = el ? (el.value || '').trim() : '';
      var isSaved = isAc1000cV2Saved(doc, 'wifi24_ssid', val);
      return isSaved;
    }
  },

  // ── PHẦN 2: WI-FI 2.4GHz SECURITY (wifisecu.html) ──
  // Bước 4: Nhập Passphrase 2.4G
  {
    page: 'wifisecu.html',
    selector: '#security_wpa_key, input[name="security_wpa_key"]',
    text: 'Bước 4: Nhập Security Passphrase: 19006600',
    position: 'right',
    expected: '19006600',
    condition: function (doc) {
      var p = getAc1000cV2DocPath(doc);
      if (p.indexOf('wifisecu') === -1) return false;
      var el = doc.querySelector('#security_wpa_key, input[name="security_wpa_key"]');
      var val = el ? (el.value || '').trim() : '';
      var isTyped = (val === '19006600');
      var isSaved = isAc1000cV2Saved(doc, 'wifi24_key', val);
      return !isTyped && !isSaved;
    }
  },
  // Bước 5: Bấm Apply lưu Passphrase 2.4G
  {
    page: 'wifisecu.html',
    selector: '#btn_apply2, a#btn_apply2, #security_wpa a.btn',
    text: 'Bước 5: Nhấn Apply để lưu mật khẩu Wi-Fi 2.4GHz',
    position: 'top',
    condition: function (doc) {
      var p = getAc1000cV2DocPath(doc);
      if (p.indexOf('wifisecu') === -1) return false;
      var el = doc.querySelector('#security_wpa_key, input[name="security_wpa_key"]');
      var val = el ? (el.value || '').trim() : '';
      var isTyped = (val === '19006600');
      var isSaved = isAc1000cV2Saved(doc, 'wifi24_key', val);
      return isTyped && !isSaved;
    }
  },
  // Bước 6: Chuyển sang menu 5GHz SSID
  {
    page: 'wifisecu.html',
    selector: '#sub_menu a[href*="wifi5ssid.html"], #sub_menu #wifi5ssid a',
    text: 'Bước 6: Chọn mục SSID (5GHz) ở menu bên trái',
    position: 'right',
    condition: function (doc) {
      var p = getAc1000cV2DocPath(doc);
      if (p.indexOf('wifisecu') === -1) return false;
      var el = doc.querySelector('#security_wpa_key, input[name="security_wpa_key"]');
      var val = el ? (el.value || '').trim() : '';
      var isSaved = isAc1000cV2Saved(doc, 'wifi24_key', val);
      return isSaved;
    }
  },

  // ── PHẦN 3: WI-FI 5GHz SSID (wifi5ssid.html) ──
  // Bước 7: Nhập SSID 5G
  {
    page: 'wifi5ssid.html',
    selector: 'input[name="ssid_network_name"], #ssid_network_name',
    text: 'Bước 7: Nhập tên Wi-Fi 5GHz: FPT Telecom',
    position: 'right',
    expected: 'FPT Telecom',
    condition: function (doc) {
      var p = getAc1000cV2DocPath(doc);
      if (p.indexOf('wifi5ssid') === -1) return false;
      var el = doc.querySelector('#ssid_network_name, input[name="ssid_network_name"]');
      var val = el ? (el.value || '').trim() : '';
      var isTyped = (val === 'FPT Telecom');
      var isSaved = isAc1000cV2Saved(doc, 'wifi5_ssid', val);
      return !isTyped && !isSaved;
    }
  },
  // Bước 8: Bấm Apply lưu SSID 5G
  {
    page: 'wifi5ssid.html',
    selector: '#btn_apply, a#btn_apply, .cfgstep a.btn',
    text: 'Bước 8: Nhấn Apply để lưu tên Wi-Fi 5GHz',
    position: 'top',
    condition: function (doc) {
      var p = getAc1000cV2DocPath(doc);
      if (p.indexOf('wifi5ssid') === -1) return false;
      var el = doc.querySelector('#ssid_network_name, input[name="ssid_network_name"]');
      var val = el ? (el.value || '').trim() : '';
      var isTyped = (val === 'FPT Telecom');
      var isSaved = isAc1000cV2Saved(doc, 'wifi5_ssid', val);
      return isTyped && !isSaved;
    }
  },
  // Bước 9: Chuyển sang menu Security 5GHz
  {
    page: 'wifi5ssid.html',
    selector: '#sub_menu a[href*="wifi5secu.html"], #sub_menu #wifi5secu a',
    text: 'Bước 9: Chọn mục Security (5GHz) ở menu bên trái',
    position: 'right',
    condition: function (doc) {
      var p = getAc1000cV2DocPath(doc);
      if (p.indexOf('wifi5ssid') === -1) return false;
      var el = doc.querySelector('#ssid_network_name, input[name="ssid_network_name"]');
      var val = el ? (el.value || '').trim() : '';
      var isSaved = isAc1000cV2Saved(doc, 'wifi5_ssid', val);
      return isSaved;
    }
  },

  // ── PHẦN 4: WI-FI 5GHz SECURITY (wifi5secu.html) ──
  // Bước 10: Nhập Passphrase 5G
  {
    page: 'wifi5secu.html',
    selector: '#security_wpa_key, input[name="security_wpa_key"]',
    text: 'Bước 10: Nhập Security Passphrase 5GHz: 19006600',
    position: 'right',
    expected: '19006600',
    condition: function (doc) {
      var p = getAc1000cV2DocPath(doc);
      if (p.indexOf('wifi5secu') === -1) return false;
      var el = doc.querySelector('#security_wpa_key, input[name="security_wpa_key"]');
      var val = el ? (el.value || '').trim() : '';
      var isTyped = (val === '19006600');
      var isSaved = isAc1000cV2Saved(doc, 'wifi5_key', val);
      return !isTyped && !isSaved;
    }
  },
  // Bước 11: Bấm Apply lưu Passphrase 5G
  {
    page: 'wifi5secu.html',
    selector: '#btn_apply2, a#btn_apply2, #security_wpa a.btn',
    text: 'Bước 11: Nhấn Apply để lưu mật khẩu Wi-Fi 5GHz',
    position: 'top',
    condition: function (doc) {
      var p = getAc1000cV2DocPath(doc);
      if (p.indexOf('wifi5secu') === -1) return false;
      var el = doc.querySelector('#security_wpa_key, input[name="security_wpa_key"]');
      var val = el ? (el.value || '').trim() : '';
      var isTyped = (val === '19006600');
      var isSaved = isAc1000cV2Saved(doc, 'wifi5_key', val);
      return isTyped && !isSaved;
    }
  },
  // Bước 12: Đã lưu thành công cả 2 băng tần
  {
    page: 'wifi5secu.html',
    selector: '#btn_apply2, a#btn_apply2, #security_wpa a.btn, #ftc-ac1000cv2-save-status',
    text: 'Bước 12: Đã cấu hình xong 2 băng tần! Nhấn Nộp bài & Chấm điểm ở góc trên để hoàn thành.',
    position: 'top',
    condition: function (doc) {
      var p = getAc1000cV2DocPath(doc);
      if (p.indexOf('wifi5secu') === -1) return false;
      var el = doc.querySelector('#security_wpa_key, input[name="security_wpa_key"]');
      var val = el ? (el.value || '').trim() : '';
      var isSaved = isAc1000cV2Saved(doc, 'wifi5_key', val);
      return isSaved;
    }
  }
];

window.TOOLTIPS_AC1000CV2['ac1000cv2-bai2'] = bai2_popups;
window.TOOLTIPS_AC1000CV2['LAB_AC1000CV2_02'] = bai2_popups;

if (window.DEVICE_AC1000CV2_LESSONS) {
  var targetLesson = window.DEVICE_AC1000CV2_LESSONS.find(function(l) { return l.id === 'ac1000cv2-bai2' || l.id === 'LAB_AC1000CV2_02'; });
  if (targetLesson) targetLesson.guidePopups = bai2_popups;
}
