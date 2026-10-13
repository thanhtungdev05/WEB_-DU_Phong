/**
 * devices/mikrotik_hexs/tooltips/bai2.js — Tooltip Hướng dẫn Bài 2: Cấu hình giới hạn băng thông
 */

if (!window.TOOLTIPS_MIKROTIK_HEXS) window.TOOLTIPS_MIKROTIK_HEXS = {};

/** Đang ở màn hình đăng nhập RouterOS? */
function mkBai2ManDangNhap(doc) {
  try {
    return !!(doc.querySelector('input#name') && doc.querySelector('input#password'));
  } catch (e) { return false; }
}

function mkBai2Hash(doc) {
  try { return (doc.location && doc.location.hash) || ''; } catch (e) { return ''; }
}

/** Đang ở màn hình Quick Set (chưa bấm WebFig)? */
function mkBai2OQuickSet(doc) {
  try {
    if (mkBai2ManDangNhap(doc)) return false;
    const h = mkBai2Hash(doc);
    if (h.indexOf('Quick') !== -1 || h === '' || h === '#') return true;
    const qsItem = doc.getElementById('id_Quick_Set');
    if (qsItem && (qsItem.classList.contains('opened') || qsItem.classList.contains('active'))) return true;
    const btnWebFig = doc.getElementById('id_WebFig');
    if (btnWebFig && !btnWebFig.classList.contains('opened')) return true;
    const aQueues = doc.querySelector('#id_Queues, a#id_Queues, #menu a[href*="Queues"]');
    if (!aQueues || aQueues.offsetParent === null) return true;
  } catch (e) {}
  return false;
}

/** Đang ở trang chi tiết tạo/sửa Simple Queue (Hình 5, có nhãn "Max Limit" trong bảng cấu hình)? */
function mkBai2OTrangNewQueue(doc) {
  try {
    for (const tr of doc.querySelectorAll('tr')) {
      const lb = tr.querySelector('td.label');
      if (lb && lb.textContent.trim() === 'Max Limit') return true;
    }
  } catch (e) { }
  return false;
}

/** Đang ở trang danh sách Simple Queues (Hình 4, chưa mở New Simple Queue)? */
function mkBai2OTrangDanhSachQueues(doc) {
  try {
    if (mkBai2OTrangNewQueue(doc)) return false;
    const h = mkBai2Hash(doc);
    // Hash của WebFig khi bấm Queues: #Queues hoặc #Queues.Simple_Queues...
    if (h.indexOf('Queues') !== -1) return true;
    // Hoặc kiểm tra tiêu đề/tab Simple Queues trong trang
    for (const el of doc.querySelectorAll('li, a, span, th, td')) {
      const t = el.textContent.trim();
      if (t === 'Simple Queues' && el.offsetParent !== null) return true;
      if (t === 'Upload Max Limit' && el.offsetParent !== null) return true;
    }
  } catch (e) { }
  return false;
}

/** Gắn id động cho các ô nhập trong trang New Simple Queue */
function mkBai2CaiTheoDoi(doc) {
  try {
    const trs = doc.querySelectorAll('tr');
    for (const tr of trs) {
      const lb = tr.querySelector('td.label');
      const text = lb ? lb.textContent.trim() : '';
      if (text === 'Name') {
        const inp = tr.querySelector('input');
        if (inp && !inp.id) inp.id = 'ftc-mk2-name';
      } else if (text === 'Target') {
        if (!lb.id) lb.id = 'ftc-mk2-target-lbl';
        const span = lb.querySelector('span');
        if (span && !span.id) span.id = 'ftc-mk2-target';
        const inp = tr.querySelector('input[type="text"], input:not([type="button"]):not([type="submit"])');
        if (inp && !inp.id) inp.id = 'ftc-mk2-target-inp';
        const btn = tr.querySelector('a.sbtn');
        if (btn && !btn.id) btn.id = 'ftc-mk2-target-btn';
      } else if (text === 'Max Limit') {
        const inps = tr.querySelectorAll('input');
        if (inps.length >= 1 && inps[0].id !== 'ftc-mk2-upload-limit') {
          if (!inps[0].id) inps[0].id = 'ftc-mk2-upload-limit';
        }
        if (inps.length >= 2 && inps[1].id !== 'ftc-mk2-download-limit') {
          if (!inps[1].id) inps[1].id = 'ftc-mk2-download-limit';
        }
      }
    }
  } catch (e) { }
}

window.TOOLTIPS_MIKROTIK_HEXS['mikrotik_hexs-bai2'] = [
  // ── Màn hình đăng nhập (Hình 2) ───────────────────────────────────
  {
    selector: 'input#name',
    text: 'Nhập admin',
    position: 'right',
    condition: function (doc) { return mkBai2ManDangNhap(doc); }
  },
  {
    selector: 'input[value="Login"], input[type="button"][value="Login"]',
    text: 'Nhập admin',
    position: 'right',
    condition: function (doc) { return mkBai2ManDangNhap(doc); }
  },

  // ── Bước 1: chọn WebFig ───────────────────────────────────────────
  {
    selector: '#id_WebFig, a#id_WebFig, text:WebFig',
    text: 'Bước 1: chọn WebFig',
    position: 'bottom',
    condition: function (doc) {
      return !mkBai2ManDangNhap(doc) && mkBai2OQuickSet(doc);
    }
  },

  // ── Bước 2: chọn Queues (Hình 3) ──────────────────────────────────
  {
    selector: '#id_Queues span, a#id_Queues, #id_Queues, text:Queues',
    text: 'Bước 2: chọn Queues',
    position: 'right',
    condition: function (doc) {
      return !mkBai2ManDangNhap(doc) && !mkBai2OQuickSet(doc)
        && !mkBai2OTrangDanhSachQueues(doc) && !mkBai2OTrangNewQueue(doc);
    }
  },

  // ── Bước 3: chọn Add New (Hình 4) ─────────────────────────────────
  {
    selector: 'a.button:has-text("Add New"), a[draggable="false"]:has-text("Add New"), text:Add New',
    text: 'Bước 3: chọn Add New',
    position: 'bottom',
    condition: function (doc) {
      return mkBai2OTrangDanhSachQueues(doc);
    }
  },

  // ── Bước 4: nhập under_5M (Hình 5) ────────────────────────────────
  {
    selector: '#ftc-mk2-name, tr:has-text("Name") input',
    text: 'Bước 4: nhập under_5M',
    position: 'right',
    condition: function (doc) {
      mkBai2CaiTheoDoi(doc);
      return mkBai2OTrangNewQueue(doc);
    }
  },

  // ── Bước 5: chọn Target<br>nhập 192.168.1.0/24 (Hình 5) ─────────
  {
    selector: '#ftc-mk2-target-inp, #ftc-mk2-target-btn, #ftc-mk2-target-lbl, #ftc-mk2-target, text:Target',
    text: 'Bước 5: chọn Target<br>nhập 192.168.1.0/24',
    position: 'left',
    condition: function (doc) {
      mkBai2CaiTheoDoi(doc);
      return mkBai2OTrangNewQueue(doc);
    }
  },

  // ── Bước 6: nhập 2M (Hình 5) ──────────────────────────────────────
  {
    selector: '#ftc-mk2-upload-limit, tr:has-text("Max Limit") td.tvalue input, tr:has-text("Max Limit") input',
    text: 'Bước 6: nhập 2M',
    position: 'bottom',
    condition: function (doc) {
      mkBai2CaiTheoDoi(doc);
      return mkBai2OTrangNewQueue(doc);
    }
  },

  // ── Bước 7: nhập 5M (Hình 5) ──────────────────────────────────────
  {
    selector: '#ftc-mk2-download-limit, tr:has-text("Max Limit") td.value input',
    text: 'Bước 7: nhập 5M',
    position: 'bottom',
    condition: function (doc) {
      mkBai2CaiTheoDoi(doc);
      return mkBai2OTrangNewQueue(doc);
    }
  },

  // ── Bước 8: nhấn Apply và OK để lưu (Hình 5) ─────────────────────
  {
    selector: 'text:OK',
    text: 'Bước 8: nhấn Apply và OK để lưu',
    position: 'top',
    condition: function (doc) {
      return mkBai2OTrangNewQueue(doc);
    }
  }
];
