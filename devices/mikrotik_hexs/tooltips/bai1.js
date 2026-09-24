/**
 * devices/mikrotik_hexs/tooltips/bai1.js — Tooltip Hướng dẫn Bài 1: Cấu hình PPPoE
 *
 * LƯU Ý VỀ SELECTOR (khác hẳn DrayTek Vigor2927):
 * Giao diện WebFig của MikroTik KHÔNG đặt name/id cho ô nhập. Vì vậy khi mở
 * trang chi tiết, lesson (bai1.js) sẽ tự GẮN ID cho 2 ô cần dùng:
 *     #ftc-mk-user  và  #ftc-mk-pass
 * nhờ đó tooltip Bước 4/5 trỏ thẳng vào Ô NHẬP (không phải nhãn chữ).
 * Các bước còn lại dùng cơ chế `text:<chuỗi>` của app.js (TreeWalker).
 *
 * Chuyển bước dùng `condition(doc)` đọc DOM/hash, KHÔNG dùng hideOnPage — vì
 * hash trang chi tiết (#PPP.Interface.9) có chứa luôn chuỗi "PPP" của trang
 * danh sách nên lọc theo URL sẽ nhầm giữa hai màn hình.
 */

if (!window.TOOLTIPS_MIKROTIK_HEXS) window.TOOLTIPS_MIKROTIK_HEXS = {};

/** Đang ở màn hình đăng nhập RouterOS? */
function mkBai1ManDangNhap(doc) {
  try {
    return !!(doc.querySelector('input#name') && doc.querySelector('input#password'));
  } catch (e) { return false; }
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

/**
 * Đang ở trang danh sách PPP?
 * KHÔNG dò theo dòng "pppoe-out1" trong bảng: trang Interface List cũng liệt kê
 * interface đó nên sẽ nhận nhầm. Phải xem hash URL của WebFig:
 *   #Interface        → danh sách Interface
 *   #PPP              → danh sách PPP        (đúng chỗ cần)
 *   #PPP.Interface.9  → trang chi tiết 1 interface
 */
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
    text: 'Nhập admin',
    position: 'right',
    condition: function (doc) { return mkBai1ManDangNhap(doc); }
  },

  // ── Các bước cấu hình ──────────────────────────────────────────────
  {
    selector: 'text:PPP',
    text: 'Bước 1: chọn PPP',
    position: 'right',
    condition: function (doc) {
      return !mkBai1ManDangNhap(doc) && !mkBai1OTrangChiTiet(doc)
        && !mkBai1OTrangDanhSachPPP(doc);
    }
  },
  {
    selector: 'text:pppoe-out1',
    text: 'Bước 2: nhấn đúp vào dòng pppoe-out1',
    position: 'right',
    condition: function (doc) {
      return !mkBai1OTrangChiTiet(doc) && mkBai1OTrangDanhSachPPP(doc);
    }
  },
  {
    selector: 'text:Dial Out',
    text: 'Bước 3: nhấn Dial Out để mở rộng',
    position: 'right',
    condition: function (doc) {
      return mkBai1OTrangChiTiet(doc) && !mkBai1DialOutDaMo(doc);
    }
  },
  {
    selector: '#ftc-mk-user, tr:has-text("User") input',
    text: 'Bước 4: nhập sgfdl-211208-218',
    position: 'right',
    condition: function (doc) { return mkBai1DialOutDaMo(doc); }
  },
  {
    selector: '#ftc-mk-pass, tr:has-text("Password") input',
    text: 'Bước 5: nhập ftc1234',
    position: 'right',
    condition: function (doc) { return mkBai1DialOutDaMo(doc); }
  },
  {
    // Dời sang phải để không che nút OK (anh Huynn yêu cầu 2026-09-18).
    selector: 'text:OK',
    text: 'Bước 6: nhấn Apply để lưu',
    position: 'left',
    offsetX: -120,
    condition: function (doc) { return mkBai1DialOutDaMo(doc); }
  }
];
