/**
 * devices/ac1000cv2/tooltips/bai3.js — Tooltip Hướng dẫn cho Bài 3: Cấu hình Wi-Fi phụ (IoT / Khách)
 *
 * Thiết kế tuần tự (Step-by-Step) nghiêm ngặt:
 * Mỗi thời điểm CHỈ HIỂN THỊ DUY NHẤT 1 TOOLTIP để không gây khó chịu cho người dùng.
 * Phân chia theo 2 trang:
 * 1. wifissid.html (SSID 2) -> Bước 1 (chọn SSID 2), Bước 2 (Enable), Bước 3 (nhập tên SSID), Bước 4 (Apply), Bước 5 (chuyển sang Security 2.4G)
 * 2. wifisecu.html (Security 2.4G) -> Bước 6 (chọn SSID 2), Bước 7 (nhập Passphrase), Bước 8 (Apply), Bước 9 (Hoàn thành)
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
    if (currentVal !== undefined && currentVal !== null) {
      return (cache[ruleId].actualValue === currentVal);
    }
    return true;
  }
  return false;
}

var bai3_popups = [
  // ── DẪN ĐƯỜNG BAN ĐẦU (Nếu ở trang khác như devinfo.html, wifibasic.html) ──
  {
    selector: '#main_menu #mm2 a, #mm2 a, li.m1_wireless a, a[href*="wifibasic.html"]',
    text: 'Bước 1: Chọn menu Wireless Setup',
    position: 'bottom',
    hideOnPage: 'wifissid.html',
    condition: function (doc) {
      var p = getAc1000cV2DocPath(doc);
      var isKnown = (p.indexOf('wifissid') !== -1 || p.indexOf('wifisecu') !== -1);
      return !isKnown && !doc.querySelector('#sub_menu a[href*="wifissid.html"]');
    }
  },
  {
    selector: '#sub_menu a[href*="wifissid.html"], #wifissid a',
    text: 'Bước 1: Chọn mục SSID ở menu bên trái',
    position: 'right',
    hideOnPage: 'wifissid.html',
    condition: function (doc) {
      var p = getAc1000cV2DocPath(doc);
      var isKnown = (p.indexOf('wifissid') !== -1 || p.indexOf('wifisecu') !== -1);
      return !isKnown && !!doc.querySelector('#sub_menu a[href*="wifissid.html"]');
    }
  },

  // ── PHẦN 1: WI-FI 2.4GHz SSID (wifissid.html) ──
  // Bước 1: Chọn SSID 2 trong danh sách
  {
    page: 'wifissid.html',
    selector: '#ssid_list, select[name="ssid_list"]',
    text: 'Bước 1: Chọn SSID 2 trong danh sách SSID',
    position: 'top',
    condition: function (doc) {
      var p = getAc1000cV2DocPath(doc);
      if (p.indexOf('wifissid') === -1) return false;
      var el = doc.querySelector('#ssid_list, select[name="ssid_list"]');
      var val = el ? String(el.value).trim() : '0';
      return val !== '1';
    }
  },
  // Bước 2: Tích chọn Enable SSID 2
  {
    page: 'wifissid.html',
    selector: '#ssid_enable, input[name="ssid_state"][value="1"]',
    text: 'Bước 2: Tích chọn Enable để kích hoạt SSID 2',
    position: 'top',
    condition: function (doc) {
      var p = getAc1000cV2DocPath(doc);
      if (p.indexOf('wifissid') === -1) return false;
      var sList = doc.querySelector('#ssid_list, select[name="ssid_list"]');
      if (!sList || String(sList.value).trim() !== '1') return false;
      var sEn = doc.querySelector('#ssid_enable, input[name="ssid_state"][value="1"]');
      return !sEn || !sEn.checked;
    }
  },
  // Bước 3: Nhập tên Wi-Fi IoT: FPT Telecom-7EA8
  {
    page: 'wifissid.html',
    selector: 'input[name="ssid_network_name"], #ssid_network_name',
    text: 'Bước 3: Nhập tên Wi-Fi IoT: FPT Telecom-7EA8',
    position: 'right',
    expected: 'FPT Telecom-7EA8',
    condition: function (doc) {
      var p = getAc1000cV2DocPath(doc);
      if (p.indexOf('wifissid') === -1) return false;
      var sList = doc.querySelector('#ssid_list, select[name="ssid_list"]');
      if (!sList || String(sList.value).trim() !== '1') return false;
      var sEn = doc.querySelector('#ssid_enable, input[name="ssid_state"][value="1"]');
      if (!sEn || !sEn.checked) return false;
      var sName = doc.querySelector('#ssid_network_name, input[name="ssid_network_name"]');
      var val = sName ? (sName.value || '').trim() : '';
      var isTyped = (val === 'FPT Telecom-7EA8');
      var isSaved = isAc1000cV2Saved(doc, 'wifi_iot_ssid', val);
      return !isTyped && !isSaved;
    }
  },
  // Bước 4: Nhấn Apply để lưu cấu hình SSID 2
  {
    page: 'wifissid.html',
    selector: '#btn_apply, a#btn_apply, .cfgstep a.btn',
    text: 'Bước 4: Nhấn Apply để lưu cấu hình SSID 2',
    position: 'top',
    condition: function (doc) {
      var p = getAc1000cV2DocPath(doc);
      if (p.indexOf('wifissid') === -1) return false;
      var sList = doc.querySelector('#ssid_list, select[name="ssid_list"]');
      if (!sList || String(sList.value).trim() !== '1') return false;
      var sEn = doc.querySelector('#ssid_enable, input[name="ssid_state"][value="1"]');
      if (!sEn || !sEn.checked) return false;
      var sName = doc.querySelector('#ssid_network_name, input[name="ssid_network_name"]');
      var val = sName ? (sName.value || '').trim() : '';
      var isTyped = (val === 'FPT Telecom-7EA8');
      var isSaved = isAc1000cV2Saved(doc, 'wifi_iot_ssid', val);
      return isTyped && !isSaved;
    }
  },
  // Bước 5: Chuyển sang mục Security 2.4GHz
  {
    page: 'wifissid.html',
    selector: '#sub_menu a[href*="wifisecu.html"], #sub_menu #wifisecu a',
    text: 'Bước 5: Chọn mục Security (2.4GHz) ở menu bên trái để đặt mật khẩu cho SSID 2',
    position: 'right',
    condition: function (doc) {
      var p = getAc1000cV2DocPath(doc);
      if (p.indexOf('wifissid') === -1) return false;
      var sName = doc.querySelector('#ssid_network_name, input[name="ssid_network_name"]');
      var val = sName ? (sName.value || '').trim() : '';
      var isSaved = isAc1000cV2Saved(doc, 'wifi_iot_ssid', val);
      return isSaved;
    }
  },

  // ── PHẦN 2: WI-FI 2.4GHz SECURITY (wifisecu.html) ──
  // Bước 6: Chọn SSID 2 trong danh sách SSID
  {
    page: 'wifisecu.html',
    selector: '#ssid_list, select[name="ssid_list"]',
    text: 'Bước 6: Chọn SSID 2 trong danh sách SSID',
    position: 'top',
    condition: function (doc) {
      var p = getAc1000cV2DocPath(doc);
      if (p.indexOf('wifisecu') === -1) return false;
      var el = doc.querySelector('#ssid_list, select[name="ssid_list"]');
      var val = el ? String(el.value).trim() : '0';
      return val !== '1';
    }
  },
  // Bước 7: Nhập Security Passphrase cho SSID 2
  {
    page: 'wifisecu.html',
    selector: '#security_wpa_key, input[name="security_wpa_key"]',
    text: 'Bước 7: Nhập Security Passphrase: 00032934',
    position: 'right',
    expected: '00032934',
    condition: function (doc) {
      var p = getAc1000cV2DocPath(doc);
      if (p.indexOf('wifisecu') === -1) return false;
      var sList = doc.querySelector('#ssid_list, select[name="ssid_list"]');
      if (!sList || String(sList.value).trim() !== '1') return false;
      var el = doc.querySelector('#security_wpa_key, input[name="security_wpa_key"]');
      var val = el ? (el.value || '').trim() : '';
      var isTyped = (val === '00032934');
      var isSaved = isAc1000cV2Saved(doc, 'wifi_iot_key', val);
      return !isTyped && !isSaved;
    }
  },
  // Bước 8: Nhấn Apply để lưu mật khẩu SSID 2
  {
    page: 'wifisecu.html',
    selector: '#btn_apply2, a#btn_apply2, #security_wpa a.btn',
    text: 'Bước 8: Nhấn Apply để lưu mật khẩu SSID 2',
    position: 'top',
    condition: function (doc) {
      var p = getAc1000cV2DocPath(doc);
      if (p.indexOf('wifisecu') === -1) return false;
      var sList = doc.querySelector('#ssid_list, select[name="ssid_list"]');
      if (!sList || String(sList.value).trim() !== '1') return false;
      var el = doc.querySelector('#security_wpa_key, input[name="security_wpa_key"]');
      var val = el ? (el.value || '').trim() : '';
      var isTyped = (val === '00032934');
      var isSaved = isAc1000cV2Saved(doc, 'wifi_iot_key', val);
      return isTyped && !isSaved;
    }
  },
  // Bước 9: Hoàn thành cấu hình Wi-Fi IoT
  {
    page: 'wifisecu.html',
    selector: '#btn_apply2, a#btn_apply2, #security_wpa a.btn, #ftc-ac1000cv2-save-status',
    text: 'Bước 9: Đã cấu hình xong Wi-Fi IoT! Nhấn Nộp bài & Chấm điểm ở góc trên để hoàn thành.',
    position: 'top',
    condition: function (doc) {
      var p = getAc1000cV2DocPath(doc);
      if (p.indexOf('wifisecu') === -1) return false;
      var el = doc.querySelector('#security_wpa_key, input[name="security_wpa_key"]');
      var val = el ? (el.value || '').trim() : '';
      var isSaved = isAc1000cV2Saved(doc, 'wifi_iot_key', val);
      return isSaved;
    }
  }
];

window.TOOLTIPS_AC1000CV2['ac1000cv2-bai3'] = bai3_popups;
window.TOOLTIPS_AC1000CV2['LAB_AC1000CV2_03'] = bai3_popups;

if (window.DEVICE_AC1000CV2_LESSONS) {
  var targetLesson = window.DEVICE_AC1000CV2_LESSONS.find(function(l) { return l.id === 'ac1000cv2-bai3' || l.id === 'LAB_AC1000CV2_03'; });
  if (targetLesson) targetLesson.guidePopups = bai3_popups;
}
