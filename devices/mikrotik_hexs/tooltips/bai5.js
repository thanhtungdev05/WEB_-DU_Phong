/**
 * devices/mikrotik_hexs/tooltips/bai5.js — Tooltip Hướng dẫn Bài 5: Cấu hình DNS
 *
 * Các bước thực hiện:
 * - Bước 1: chọn WebFig — khi vừa đăng nhập xong ở màn hình Quick Set
 * - Bước 2: chọn IP — trỏ vào IP menu trái
 * - Bước 3: chọn DNS — trỏ vào DNS trong menu xổ xuống
 * - Bước 4: Nhấn nút ▲ bên phải để xoá lần lượt từng máy chủ Cloudflare:
 *   (1.1.1.1 -> 1.0.0.1 -> 2606:4700:4700::1111 -> 2606:4700:4700::1001)
 * - Bước 5: chọn Apply để lưu — chỉ hiện ra khi đã xoá xong toàn bộ 4 máy chủ trên
 */

if (!window.TOOLTIPS_MIKROTIK_HEXS) window.TOOLTIPS_MIKROTIK_HEXS = {};

/** Đang ở màn hình đăng nhập RouterOS? */
function mkBai5ManDangNhap(doc) {
  try {
    return !!(doc.querySelector('input#name') && doc.querySelector('input#password'));
  } catch (e) { return false; }
}

function mkBai5Hash(doc) {
  try { return (doc.location && doc.location.hash) || ''; } catch (e) { return ''; }
}

/** Đang ở màn hình Quick Set (chưa bấm WebFig)? */
function mkBai5OQuickSet(doc) {
  try {
    if (mkBai5ManDangNhap(doc)) return false;
    const h = mkBai5Hash(doc);
    if (h.indexOf('Quick') !== -1 || h === '' || h === '#') return true;
    const qsItem = doc.getElementById('id_Quick_Set');
    if (qsItem && (qsItem.classList.contains('opened') || qsItem.classList.contains('active'))) return true;
    const btnWebFig = doc.getElementById('id_WebFig');
    if (btnWebFig && !btnWebFig.classList.contains('opened')) return true;
    const aIP = doc.querySelector('#menu a#id_IP, a#id_IP, #menu a[href*="IP"]');
    if (!aIP || aIP.offsetParent === null) return true;
  } catch (e) {}
  return false;
}

/** Kiểm tra text có hiển thị trên màn hình không (bỏ qua bong bóng tooltip) */
function mkBai5CoTextHienThi(doc, chuoi) {
  try {
    for (const el of doc.querySelectorAll('a, span, p, div, td, b, li')) {
      if (el.closest('.ftc-guide-bubble')) continue;
      const t = (el.textContent || '').trim();
      if (t === chuoi || (chuoi.length >= 3 && t.includes(chuoi))) {
        if (el.offsetParent !== null) return true;
      }
    }
  } catch (e) { }
  return false;
}

/** Menu IP đã được click mở? */
function mkBai5MenuIPDaMo(doc) {
  try {
    const ip = doc.querySelector('li#IP');
    if (ip && ip.classList.contains('activegroup')) return true;
    const dnsItems = Array.from(doc.querySelectorAll('#menu a, #menu li')).filter(el => {
      if (el.closest('.ftc-guide-bubble')) return false;
      return (el.textContent || '').trim() === 'DNS' && el.offsetParent !== null;
    });
    return dnsItems.length > 0;
  } catch (e) { }
  return false;
}

/** Đang ở trang Cấu hình DNS? */
function mkBai5OTrangDNS(doc) {
  try {
    const win = doc.defaultView || window;
    const h = (win.location.hash || '');
    if (h.includes('#IP:DNS') || h.includes('#IP.DNS')) return true;
    const trs = Array.from(doc.querySelectorAll('tr'));
    return trs.some(tr => tr.textContent.includes('Servers') && tr.textContent.includes('Allow Remote Requests'));
  } catch (e) { }
  return false;
}

/** 4 máy chủ Cloudflare mà đề bài yêu cầu xoá, theo đúng thứ tự trên trang. */
var MK_BAI5_CAN_XOA = [
  '1.1.1.1',
  '1.0.0.1',
  '2606:4700:4700::1111',
  '2606:4700:4700::1001'
];

/** Lấy máy chủ Cloudflare đầu tiên còn lại trên trang cần xoá */
function mkBai5ServerHienTaiCanXoa(doc) {
  try {
    for (const tr of doc.querySelectorAll('tr')) {
      const lb = tr.querySelector('td.label');
      if (!lb || lb.textContent.trim() !== 'Servers') continue;
      const os = Array.from(tr.querySelectorAll('input'));
      for (let i = 0; i < os.length; i++) {
        const val = (os[i].value || '').trim();
        if (MK_BAI5_CAN_XOA.indexOf(val) !== -1) {
          return val;
        }
      }
      break;
    }
  } catch (e) { }
  return null;
}

/** Còn máy chủ nào trong danh sách cần xoá chưa xoá không? */
function mkBai5ConCanXoa(doc) {
  return mkBai5ServerHienTaiCanXoa(doc) !== null;
}

/**
 * Gắn ID động `#ftc-mk5-triangle-3` cho nút tam giác `▲` (xoá dòng) của máy
 * chủ ĐẦU TIÊN CÒN LẠI trong danh sách cần xoá.
 */
function mkBai5CaiTheoDoi(doc) {
  try {
    const cu = doc.getElementById('ftc-mk5-triangle-3');
    let dich = null;
    for (const tr of doc.querySelectorAll('tr')) {
      const lb = tr.querySelector('td.label');
      if (!lb || lb.textContent.trim() !== 'Servers') continue;
      const os = Array.from(tr.querySelectorAll('input'));
      const upBtns = Array.from(tr.querySelectorAll('a.sbtn img[src*="up"], a.sbtn img[src*="up-gray"]'))
        .map(img => img.closest('a.sbtn')).filter(Boolean);
      for (let i = 0; i < os.length && i < upBtns.length; i++) {
        if (MK_BAI5_CAN_XOA.indexOf((os[i].value || '').trim()) !== -1) {
          dich = upBtns[i];
          break;
        }
      }
      break;
    }
    if (cu && cu !== dich) cu.id = '';
    if (dich && !dich.id) dich.id = 'ftc-mk5-triangle-3';
  } catch (e) { }
}

window.TOOLTIPS_MIKROTIK_HEXS['mikrotik_hexs-bai5'] = [
  // ── Màn hình đăng nhập ─────────────────────────────────────────────
  {
    selector: 'input#name',
    text: 'Nhập admin',
    position: 'right',
    condition: function (doc) { return mkBai5ManDangNhap(doc); }
  },
  {
    selector: 'input[value="Login"], input[type="button"][value="Login"]',
    text: 'Nhập admin',
    position: 'right',
    condition: function (doc) { return mkBai5ManDangNhap(doc); }
  },

  // ── Bước 1: chọn WebFig ───────────────────────────────────────────
  {
    selector: '#id_WebFig, a#id_WebFig, text:WebFig',
    text: 'Bước 1: chọn WebFig',
    position: 'bottom',
    condition: function (doc) {
      return !mkBai5ManDangNhap(doc) && mkBai5OQuickSet(doc);
    }
  },

  // ── Bước 2: chọn IP ───────────────────────────────────────────────
  {
    selector: 'li#IP span, text:IP',
    text: 'Bước 2: chọn IP',
    position: 'right',
    condition: function (doc) {
      return !mkBai5ManDangNhap(doc) && !mkBai5OQuickSet(doc) && !mkBai5MenuIPDaMo(doc) && !mkBai5OTrangDNS(doc);
    }
  },

  // ── Bước 3: chọn DNS ──────────────────────────────────────────────
  {
    selector: '#menu li:has-text("DNS"), li#IP li:has-text("DNS"), text:DNS',
    text: 'Bước 3: chọn DNS',
    position: 'right',
    condition: function (doc) {
      return !mkBai5ManDangNhap(doc) && !mkBai5OQuickSet(doc) && mkBai5MenuIPDaMo(doc) && !mkBai5OTrangDNS(doc);
    }
  },

  // ── Bước 4: Nhấn nút ▲ để xoá lần lượt từng máy chủ Cloudflare ────
  {
    selector: '#ftc-mk5-triangle-3, a.sbtn img[src*="up"], a.sbtn',
    text: 'Bước 4: Nhấn nút ▲ để xoá 1.1.1.1',
    position: 'right',
    condition: function (doc) {
      mkBai5CaiTheoDoi(doc);
      return !mkBai5ManDangNhap(doc) && mkBai5OTrangDNS(doc) && mkBai5ServerHienTaiCanXoa(doc) === '1.1.1.1';
    }
  },
  {
    selector: '#ftc-mk5-triangle-3, a.sbtn img[src*="up"], a.sbtn',
    text: 'Bước 4: Nhấn nút ▲ để xoá 1.0.0.1',
    position: 'right',
    condition: function (doc) {
      mkBai5CaiTheoDoi(doc);
      return !mkBai5ManDangNhap(doc) && mkBai5OTrangDNS(doc) && mkBai5ServerHienTaiCanXoa(doc) === '1.0.0.1';
    }
  },
  {
    selector: '#ftc-mk5-triangle-3, a.sbtn img[src*="up"], a.sbtn',
    text: 'Bước 4: Nhấn nút ▲ để xoá 2606:4700:4700::1111',
    position: 'right',
    condition: function (doc) {
      mkBai5CaiTheoDoi(doc);
      return !mkBai5ManDangNhap(doc) && mkBai5OTrangDNS(doc) && mkBai5ServerHienTaiCanXoa(doc) === '2606:4700:4700::1111';
    }
  },
  {
    selector: '#ftc-mk5-triangle-3, a.sbtn img[src*="up"], a.sbtn',
    text: 'Bước 4: Nhấn nút ▲ để xoá 2606:4700:4700::1001',
    position: 'right',
    condition: function (doc) {
      mkBai5CaiTheoDoi(doc);
      return !mkBai5ManDangNhap(doc) && mkBai5OTrangDNS(doc) && mkBai5ServerHienTaiCanXoa(doc) === '2606:4700:4700::1001';
    }
  },

  // ── Bước 5: chọn Apply để lưu (chỉ hiện khi đã xoá xong cả 4 máy chủ) ──
  {
    selector: 'a.button:has-text("Apply"), text:Apply',
    text: 'Bước 5: chọn Apply để lưu',
    position: 'left',
    condition: function (doc) {
      return !mkBai5ManDangNhap(doc) && mkBai5OTrangDNS(doc) && !mkBai5ConCanXoa(doc);
    }
  }
];
