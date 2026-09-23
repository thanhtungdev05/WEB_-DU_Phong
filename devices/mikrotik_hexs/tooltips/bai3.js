/**
 * devices/mikrotik_hexs/tooltips/bai3.js — Tooltip Hướng dẫn Bài 3: Cấu hình Bind IP to MAC
 */

if (!window.TOOLTIPS_MIKROTIK_HEXS) window.TOOLTIPS_MIKROTIK_HEXS = {};

/** Đang ở màn hình đăng nhập RouterOS? */
function mkBai3ManDangNhap(doc) {
  try {
    return !!(doc.querySelector('input#name') && doc.querySelector('input#password'));
  } catch (e) { return false; }
}

function mkBai3Hash(doc) {
  try { return (doc.location && doc.location.hash) || ''; } catch (e) { return ''; }
}

/** Chữ "chuoi" có đang HIỂN THỊ trên trang không (bỏ qua bong bóng tooltip)? */
function mkBai3CoTextHienThi(doc, chuoi) {
  try {
    for (const el of doc.querySelectorAll('*')) {
      if (el.childElementCount !== 0) continue;
      if (el.closest('.ftc-guide-bubble')) continue;
      if (el.textContent.trim() !== chuoi) continue;
      if (el.offsetParent !== null) return true;
    }
  } catch (e) { }
  return false;
}

/** Đang ở trang DHCP Server nói chung? */
function mkBai3OTrangDHCPServer(doc) {
  try {
    var h = mkBai3Hash(doc);
    if (h.indexOf('DHCP_Server') !== -1) return true;
    const a = doc.querySelector('a[href*="DHCP_Server.Leases"]');
    if (a && a.offsetParent !== null) return true;
  } catch (e) { }
  return false;
}

/** Đang ở tab DHCP mặc định của trang DHCP Server (Hình 1)? */
function mkBai3OTabDHCP(doc) {
  try {
    var h = mkBai3Hash(doc);
    return h === '#IP:DHCP_Server' || (h.indexOf('DHCP_Server') !== -1 && h.indexOf('.Leases') === -1);
  } catch (e) { return false; }
}

/** Đang ở trang danh sách Leases (Hình 2 & Hình 4)? */
function mkBai3OTabLeases(doc) {
  try {
    var h = mkBai3Hash(doc);
    return h === '#IP:DHCP_Server.Leases';
  } catch (e) { return false; }
}

/** Đang ở trang chi tiết DHCP Lease (Hình 3 & Hình 5)? */
function mkBai3OChiTietLease(doc) {
  try {
    var h = mkBai3Hash(doc);
    if (h.indexOf('#IP:DHCP_Server.Leases.') !== -1) return true;
    for (const el of doc.querySelectorAll('h1, h2, h3, div, span, td')) {
      if (el.textContent && el.textContent.includes('DHCP Lease <') && el.offsetParent !== null) return true;
    }
  } catch (e) { }
  return false;
}

/** Dòng PC1 trong bảng Leases còn là Dynamic (có cờ 'D' ở ô thứ 2) (Hình 2)? */
function mkBai3DongPC1LaDynamic(doc) {
  try {
    const rows = doc.querySelectorAll('table.tbl tbody tr, table tr');
    for (const tr of rows) {
      if (tr.textContent.includes('192.168.1.249') || tr.textContent.includes('PC1')) {
        const tds = tr.querySelectorAll('td');
        if (tds.length > 1) {
          const flag = (tds[1].textContent || '').trim();
          if (flag.includes('D')) return true;
        }
      }
    }
  } catch (e) { }
  return false;
}

/** Trang chi tiết có nút "Make Static" (Hình 3)? */
function mkBai3ChiTietCoMakeStatic(doc) {
  try {
    for (const a of doc.querySelectorAll('a.button, a, button, input')) {
      if ((a.textContent || a.value || '').trim() === 'Make Static' && a.offsetParent !== null) return true;
    }
  } catch (e) { }
  return false;
}

/** Trang chi tiết đã Make Static, có nút Apply/OK và ô nhập Comment (Hình 5)? */
function mkBai3OTrangEditStatic(doc) {
  try {
    if (!mkBai3OChiTietLease(doc)) return false;
    if (mkBai3ChiTietCoMakeStatic(doc)) return false;
    for (const a of doc.querySelectorAll('a.button, a, button, input')) {
      const t = (a.textContent || a.value || '').trim();
      if (t === 'OK' || t === 'Apply') return true;
    }
  } catch (e) { }
  return false;
}

/** Gắn ID động cho các phần tử theo dõi trong Bài 3 */
function mkBai3CaiTheoDoi(doc) {
  try {
    // 1. Gắn ID cho ô Comment dòng PC1 trong bảng Leases (Hình 4)
    const rows = doc.querySelectorAll('table.tbl tbody tr, table tr');
    for (const tr of rows) {
      if (tr.textContent.includes('192.168.1.249') || tr.textContent.includes('PC1')) {
        const tds = tr.querySelectorAll('td');
        if (tds.length > 2 && tds[2].id !== 'ftc-mk3-comment-cell') {
          if (!tds[2].id) tds[2].id = 'ftc-mk3-comment-cell';
        }
      }
    }

    // 2. Gắn ID cho ô textarea Comment trong form chi tiết (Hình 5)
    const trs = doc.querySelectorAll('tr');
    for (const tr of trs) {
      const lb = tr.querySelector('td.label');
      if (lb && lb.textContent.trim() === 'Comment') {
        const inp = tr.querySelector('input, textarea');
        if (inp && inp.id !== 'ftc-mk3-comment-input') {
          if (!inp.id) inp.id = 'ftc-mk3-comment-input';
        }
      }
    }
  } catch (e) { }
}

window.TOOLTIPS_MIKROTIK_HEXS['mikrotik_hexs-bai3'] = [
  // ── Màn hình đăng nhập (Hình 2) ───────────────────────────────────
  {
    selector: 'input#name',
    text: 'Nhập admin',
    position: 'right',
    condition: function (doc) { return mkBai3ManDangNhap(doc); }
  },
  {
    selector: 'input[value="Login"], input[type="button"][value="Login"]',
    text: 'Nhập admin',
    position: 'right',
    condition: function (doc) { return mkBai3ManDangNhap(doc); }
  },

  // ── Bước 1: chọn IP (Hình 3) ──────────────────────────────────────
  {
    selector: 'li#IP span, li#IP a, text:IP',
    text: 'Bước 1: chọn IP',
    position: 'right',
    condition: function (doc) {
      return !mkBai3ManDangNhap(doc) && !mkBai3OTrangDHCPServer(doc) && !mkBai3CoTextHienThi(doc, 'DHCP Server');
    }
  },

  // ── Bước 2: chọn DHCP Server (Hình 4) ─────────────────────────────
  {
    selector: 'text:DHCP Server',
    text: 'Bước 2: chọn DHCP Server',
    position: 'right',
    condition: function (doc) {
      return !mkBai3ManDangNhap(doc) && !mkBai3OTrangDHCPServer(doc) && mkBai3CoTextHienThi(doc, 'DHCP Server');
    }
  },

  // ── Bước 3: chọn Leases (Hình 1) ──────────────────────────────────
  {
    selector: 'a[href*="DHCP_Server.Leases"] span, a[href*="DHCP_Server.Leases"], text:Leases',
    text: 'Bước 3: chọn Leases',
    position: 'bottom',
    condition: function (doc) {
      return !mkBai3ManDangNhap(doc) && mkBai3OTabDHCP(doc);
    }
  },

  // ── Bước 4: chọn PC1 (Hình 2) ─────────────────────────────────────
  {
    selector: 'text:PC1, td:has-text("PC1")',
    text: 'Bước 4: chọn PC1',
    position: 'bottom',
    condition: function (doc) {
      return !mkBai3ManDangNhap(doc) && mkBai3OTabLeases(doc) && !mkBai3OChiTietLease(doc) && mkBai3DongPC1LaDynamic(doc);
    }
  },

  // ── Bước 5: chọn Make Static (Hình 3) ─────────────────────────────
  {
    selector: 'a.button:has-text("Make Static"), a:has-text("Make Static"), text:Make Static',
    text: 'Bước 5: chọn Make Static',
    position: 'bottom',
    condition: function (doc) {
      return !mkBai3ManDangNhap(doc) && mkBai3OChiTietLease(doc) && mkBai3ChiTietCoMakeStatic(doc);
    }
  },

  // ── Bước 6: chọn Close (Hình 3) ───────────────────────────────────
  {
    selector: 'a.button:has-text("Close"), a:has-text("Close"), text:Close',
    text: 'Bước 6: chọn Close',
    position: 'bottom',
    condition: function (doc) {
      return !mkBai3ManDangNhap(doc) && mkBai3OChiTietLease(doc) && mkBai3ChiTietCoMakeStatic(doc);
    }
  },

  // ── Bước 7: chọn ô texbox này (Hình 4) ───────────────────────────
  {
    selector: '#ftc-mk3-comment-cell, tr:has-text("192.168.1.249") td:nth-child(3), tr:has-text("PC1") td:nth-child(3), text:Server 1',
    text: 'Bước 7: chọn ô texbox này',
    position: 'bottom',
    condition: function (doc) {
      mkBai3CaiTheoDoi(doc);
      return !mkBai3ManDangNhap(doc) && mkBai3OTabLeases(doc) && !mkBai3OChiTietLease(doc) && !mkBai3DongPC1LaDynamic(doc);
    }
  },

  // ── Bước 8: nhập Server 1 (Hình 5) ────────────────────────────────
  {
    selector: '#ftc-mk3-comment-input, td.value textarea, td.value input[type="text"], textarea',
    text: 'Bước 8: nhập Server 1',
    position: 'bottom',
    condition: function (doc) {
      mkBai3CaiTheoDoi(doc);
      return !mkBai3ManDangNhap(doc) && mkBai3OTrangEditStatic(doc);
    }
  },

  // ── Bước 9: chọn Apply và OK để lưu (Hình 5) ──────────────────────
  {
    selector: 'a.button:has-text("Apply"), text:Apply',
    text: 'Bước 9: chọn Apply và OK để lưu',
    position: 'left',
    condition: function (doc) {
      return !mkBai3ManDangNhap(doc) && mkBai3OTrangEditStatic(doc);
    }
  }
];
