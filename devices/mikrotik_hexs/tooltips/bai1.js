/**
 * devices/mikrotik_hexs/tooltips/bai1.js — Tooltip Hướng dẫn Bài 1: Cấu hình PPPoE
 *
 * Chuỗi 9 bước tuần tự chuẩn thực tế theo sơ đồ Cấu hình PPPoE trên MikroTik hEX S:
 *   - Đăng nhập (Bước 1 ➔ 2)
 *   - Mở WebFig, vào PPP, mở pppoe-out1, mở Dial Out (Bước 3 ➔ 6)
 *   - Nhập User, Password (Bước 7 ➔ 8)
 *   - Lưu cấu hình: Apply -> OK (Bước 9)
 */

if (!window.TOOLTIPS_MIKROTIK_HEXS) window.TOOLTIPS_MIKROTIK_HEXS = {};

/** Đang ở màn hình đăng nhập RouterOS? */
function mkBai1ManDangNhap(doc) {
  try {
    return !!(doc.querySelector('input#name') && doc.querySelector('input#password'));
  } catch (e) { return false; }
}

/** Đang ở màn hình Quick Set (chưa bấm WebFig)? */
function mkBai1OQuickSet(doc) {
  try {
    if (mkBai1ManDangNhap(doc)) return false;
    const h = mkBai1Hash(doc);
    if (h.indexOf('Quick') !== -1 || h === '' || h === '#') return true;
    const qsItem = doc.getElementById('id_Quick_Set');
    if (qsItem && (qsItem.classList.contains('opened') || qsItem.classList.contains('active'))) return true;
    const btnWebFig = doc.getElementById('id_WebFig');
    if (btnWebFig && !btnWebFig.classList.contains('opened')) return true;
    const aPPP = doc.querySelector('#menu a#id_PPP, a#id_PPP, #menu a[href="#PPP"]');
    if (!aPPP || aPPP.offsetParent === null) return true;
  } catch (e) {}
  return false;
}

/** Đang ở trang chi tiết một interface? (trang này có hàng nhãn "Name") */
function mkBai1OTrangChiTiet(doc) {
  try {
    for (const tr of doc.querySelectorAll('tr')) {
      const lb = tr.querySelector('td.label');
      if (lb && lb.textContent.trim() === 'Name') return true;
    }
  } catch (e) { }
  return false;
}

function mkBai1Hash(doc) {
  try { return (doc.location && doc.location.hash) || ''; } catch (e) { return ''; }
}

function mkBai1OTrangDanhSachPPP(doc) {
  return mkBai1Hash(doc) === '#PPP';
}

/** Tự động gắn ID cho 2 ô User/Password ngay khi mở Dial Out */
function mkBai1CaiTheoDoi(doc) {
  try {
    for (const tr of doc.querySelectorAll('tr')) {
      const lb = tr.querySelector('td.label');
      const text = lb ? lb.textContent.trim() : '';
      if (text === 'User') {
        const inp = tr.querySelector('input');
        if (inp && !inp.id) inp.id = 'ftc-mk-user';
      } else if (text === 'Password') {
        const inp = tr.querySelector('input');
        if (inp && !inp.id) inp.id = 'ftc-mk-pass';
      }
    }
  } catch (e) { }
}

/** Mục "Dial Out" đã mở rộng chưa? (mở rồi mới có hàng nhãn "User") */
function mkBai1DialOutDaMo(doc) {
  try {
    mkBai1CaiTheoDoi(doc);
    for (const tr of doc.querySelectorAll('tr')) {
      const lb = tr.querySelector('td.label');
      if (lb && lb.textContent.trim() === 'User') {
        return tr.getBoundingClientRect().height > 0;
      }
    }
  } catch (e) { }
  return false;
}

window.TOOLTIPS_MIKROTIK_HEXS['mikrotik_hexs-bai1'] = [
  // ── Màn hình đăng nhập ─────────────────────────────────────────────
  {
    selector: 'input#name',
    text: 'Nhập admin',
    position: 'right',
    condition: function (doc) { return mkBai1ManDangNhap(doc); }
  },
  {
    selector: 'input[value="Login"], input[type="button"][value="Login"]',
    text: 'Nhấn Login',
    position: 'right',
    condition: function (doc) { return mkBai1ManDangNhap(doc); }
  },

  // ── Các bước cấu hình ──────────────────────────────────────────────
  {
    selector: '#id_WebFig, a#id_WebFig, text:WebFig',
    text: 'Bước 1: chọn WebFig',
    position: 'bottom',
    condition: function (doc) {
      return !mkBai1ManDangNhap(doc) && mkBai1OQuickSet(doc);
    }
  },
  {
    selector: '#menu a#id_PPP, a#id_PPP, #id_PPP, #menu a[href="#PPP"], #menu li:has-text("PPP")',
    text: 'Bước 2: chọn PPP',
    position: 'right',
    condition: function (doc) {
      return !mkBai1ManDangNhap(doc) && !mkBai1OQuickSet(doc)
        && !mkBai1OTrangChiTiet(doc) && !mkBai1OTrangDanhSachPPP(doc);
    }
  },
  {
    selector: 'text:pppoe-out1',
    text: 'Bước 3: nhấn đúp vào dòng pppoe-out1',
    position: 'right',
    condition: function (doc) {
      return !mkBai1OTrangChiTiet(doc) && mkBai1OTrangDanhSachPPP(doc);
    }
  },
  {
    selector: 'text:Dial Out',
    text: 'Bước 4: nhấn Dial Out để mở rộng',
    position: 'right',
    condition: function (doc) {
      return mkBai1OTrangChiTiet(doc) && !mkBai1DialOutDaMo(doc);
    }
  },
  {
    selector: '#ftc-mk-user, tr:has-text("User") input',
    text: 'Bước 5: nhập sgfdl-211208-218',
    position: 'right',
    condition: function (doc) { return mkBai1DialOutDaMo(doc); }
  },
  {
    selector: '#ftc-mk-pass, tr:has-text("Password") input',
    text: 'Bước 6: nhập ftc1234',
    position: 'right',
    condition: function (doc) { return mkBai1DialOutDaMo(doc); }
  },
  {
    selector: 'input[value="Apply"], input[type="button"][value="Apply"], a.button:has-text("Apply"), text:Apply',
    text: 'Bước 7: Nhấn Apply để lưu cấu hình',
    position: 'bottom',
    condition: function (doc) {
      return mkBai1DialOutDaMo(doc) && !window._FTC_MK_BAI1_APPLIED;
    }
  },
  {
    selector: 'input[value="OK"], input[type="button"][value="OK"], a.button:has-text("OK"), text:OK',
    text: 'Bước 8: Nhấn OK để đóng cửa sổ',
    position: 'bottom',
    condition: function (doc) {
      return mkBai1DialOutDaMo(doc) && !!window._FTC_MK_BAI1_APPLIED;
    }
  }
];
