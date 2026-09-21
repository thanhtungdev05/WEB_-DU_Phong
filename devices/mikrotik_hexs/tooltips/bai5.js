/**
 * devices/mikrotik_hexs/tooltips/bai5.js — Tooltip Hướng dẫn Bài 5: Cấu hình DNS
 *
 * 9 bước / các bước thực hiện:
 * - Bước 1: chọn IP (Hình 1) — trỏ vào IP menu trái
 * - Bước 2: chọn DNS (Hình 2) — trỏ vào DNS trong menu xổ xuống
 * - Bước 3: chọn bỏ 1.1.1.1 và 1.0.0.1<br>2606:4700:4700::1111 và 2606:4700:4700::1001 (Hình 3) — trỏ vào hình tam giác đen thứ 3 đếm từ trên xuống
 * - Bước 4: chọn Apply để lưu (Hình 3) — nằm ngang bên trái và trỏ vào nút Apply
 */

if (!window.TOOLTIPS_MIKROTIK_HEXS) window.TOOLTIPS_MIKROTIK_HEXS = {};

/** Đang ở màn hình đăng nhập RouterOS? */
function mkBai5ManDangNhap(doc) {
  try {
    return !!(doc.querySelector('input#name') && doc.querySelector('input#password'));
  } catch (e) { return false; }
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

/** Menu IP đã được click mở (Hình 2)? */
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

/** Đang ở trang Cấu hình DNS (Hình 3)? */
function mkBai5OTrangDNS(doc) {
  try {
    const win = doc.defaultView || window;
    const h = (win.location.hash || '');
    if (h.includes('#IP:DNS')) return true;
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

/**
 * Gắn ID động `#ftc-mk5-triangle-3` cho nút tam giác `▲` (xoá dòng) của máy
 * chủ ĐẦU TIÊN CÒN LẠI trong danh sách cần xoá.
 *
 * LỖI ĐÃ TRÁNH (phát hiện khi đo thật 2026-09-19): bản đầu gắn cứng vào nút
 * thứ 3 đếm từ trên xuống. Đúng ở lần xoá đầu (dòng 3 = 1.1.1.1), nhưng WebFig
 * DỒN DÒNG sau mỗi lần xoá, nên xoá xong 1.1.1.1 và 1.0.0.1 thì "dòng thứ 3"
 * lại chính là 2001:4860:4860::8888 — máy chủ PHẢI GIỮ LẠI. Mũi tên sẽ chỉ học
 * viên xoá nhầm và bị chấm sai. Nay dò theo GIÁ TRỊ nên đúng suốt cả 4 lần.
 */
function mkBai5CaiTheoDoi(doc) {
  try {
    const cu = doc.getElementById('ftc-mk5-triangle-3');
    let dich = null;
    for (const tr of doc.querySelectorAll('tr')) {
      const lb = tr.querySelector('td.label');
      if (!lb || lb.textContent.trim() !== 'Servers') continue;
      const os = Array.from(tr.querySelectorAll('input'));
      const upBtns = Array.from(tr.querySelectorAll('a.sbtn img[src*="up"]'))
        .map(img => img.closest('a.sbtn'));
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

/** Còn máy chủ nào trong danh sách cần xoá chưa xoá không? */
function mkBai5ConCanXoa(doc) {
  try {
    for (const tr of doc.querySelectorAll('tr')) {
      const lb = tr.querySelector('td.label');
      if (!lb || lb.textContent.trim() !== 'Servers') continue;
      return Array.from(tr.querySelectorAll('input'))
        .some(o => MK_BAI5_CAN_XOA.indexOf((o.value || '').trim()) !== -1);
    }
  } catch (e) { }
  return false;
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

  // ── Bước 1: chọn IP (Hình 1) ───────────────────────────────────────
  {
    selector: 'li#IP span, text:IP',
    text: 'Bước 1: chọn IP',
    position: 'right',
    condition: function (doc) {
      return !mkBai5ManDangNhap(doc) && !mkBai5MenuIPDaMo(doc) && !mkBai5OTrangDNS(doc);
    }
  },

  // ── Bước 2: chọn DNS (Hình 2) ──────────────────────────────────────
  {
    selector: '#menu li:has-text("DNS"), li#IP li:has-text("DNS"), text:DNS',
    text: 'Bước 2: chọn DNS',
    position: 'right',
    condition: function (doc) {
      return !mkBai5ManDangNhap(doc) && mkBai5MenuIPDaMo(doc) && !mkBai5OTrangDNS(doc);
    }
  },

  // ── Bước 3: chọn bỏ 1.1.1.1 và 1.0.0.1... (Hình 3) ────────────────
  {
    selector: '#ftc-mk5-triangle-3, tr:has(td.label:has-text("Servers")) a.sbtn:has(img[src*="up"]):nth-of-type(3)',
    text: 'Bước 3: chọn bỏ<br>- 1.1.1.1<br>- 1.0.0.1<br>- 2606:4700:4700::1111<br>- 2606:4700:4700::1001',
    position: 'right',
    condition: function (doc) {
      mkBai5CaiTheoDoi(doc);
      // Xoá xong cả 4 máy chủ thì không còn gì để chỉ nữa — ẩn bước 3 đi,
      // chỉ còn bước 4 (Apply). Nếu vẫn hiện, mũi tên sẽ không có chỗ neo.
      return !mkBai5ManDangNhap(doc) && mkBai5OTrangDNS(doc) && mkBai5ConCanXoa(doc);
    }
  },

  // ── Bước 4: chọn Apply để lưu (Hình 3) ────────────────────────────
  {
    selector: 'a.button:has-text("Apply"), text:Apply',
    text: 'Bước 4: chọn Apply để lưu',
    position: 'left',
    condition: function (doc) {
      return !mkBai5ManDangNhap(doc) && mkBai5OTrangDNS(doc);
    }
  }
];
