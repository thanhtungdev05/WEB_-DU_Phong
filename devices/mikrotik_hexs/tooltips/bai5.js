/**
 * devices/mikrotik_hexs/tooltips/bai5.js — Tooltip Hướng dẫn Bài 5: Cấu hình Policy Routing
 *
 * Chuỗi 21 bước tuần tự chuẩn thực tế theo video hướng dẫn Router MikroTik (PBR - Policy Based Routing):
 *   Phần 1: Routing > Tables (Bước 1 ➔ 6): Tạo bảng định tuyến ISP1, tích chọn FIB.
 *   Phần 2: IP > Routes (Bước 7 ➔ 12): Tạo Default Route Gateway 1.1.1.1 qua bảng ISP1.
 *   Phần 3: IP > Firewall > Mangle (Bước 13 ➔ 21): Tạo luật prerouting đánh dấu lưu lượng LAN 192.168.1.0/24 qua ISP1.
 *
 * NGUYÊN TẮC BẤT BIẾN:
 * 1. Chuyển bước nghiêm ngặt: bước trước cấu hình xong nhập đúng thì mới chuyển sang bước sau.
 * 2. An toàn DOM tuyệt đối: không ghi đè innerHTML/textContent của WebFig, chỉ gắn ID phụ khi chưa có ID.
 * 3. Vị trí hiển thị rõ ràng, không che khuất ô nhập liệu hay nút bấm.
 */

if (!window.TOOLTIPS_MIKROTIK_HEXS) window.TOOLTIPS_MIKROTIK_HEXS = {};

/* ───────────────────────── Hàm bổ trợ nhận diện DOM ───────────────────────── */

function mkBai5ManDangNhap(doc) {
  try {
    return !!(doc.querySelector('input#name') && doc.querySelector('input#password'));
  } catch (e) { return false; }
}

function mkBai5DocHash(doc) {
  try {
    const w = (doc && doc.defaultView) || window;
    return (w.location && w.location.hash) || (doc && doc.location && doc.location.hash) || '';
  } catch (e) { return ''; }
}

function mkBai5Hang(doc, nhan) {
  try {
    const nhanLower = nhan.toLowerCase();
    for (const tr of doc.querySelectorAll('tr')) {
      const lb = tr.querySelector('td.label');
      if (lb && lb.textContent.trim().toLowerCase() === nhanLower) return tr;
    }
  } catch (e) {}
  return null;
}

function mkBai5MenuConHien(doc, ten) {
  try {
    const tenLower = ten.toLowerCase();
    for (const a of doc.querySelectorAll('#menu a, li a')) {
      if (a.closest('.ftc-guide-bubble')) continue;
      if ((a.textContent || '').trim().toLowerCase() === tenLower && a.offsetParent !== null) {
        return true;
      }
    }
  } catch (e) {}
  return false;
}

function mkBai5OTables(doc) { return mkBai5DocHash(doc) === '#Routing:Tables'; }
function mkBai5OHopThoaiBang(doc) { return mkBai5DocHash(doc).indexOf('#Routing:Tables.') === 0; }
function mkBai5ORoutes(doc) { return mkBai5DocHash(doc) === '#IP:Routes'; }
function mkBai5OHopThoaiTuyen(doc) { return mkBai5DocHash(doc).indexOf('#IP:Routes.') === 0; }
function mkBai5OFirewall(doc) { return mkBai5DocHash(doc).indexOf('#IP:Firewall') === 0; }
function mkBai5OMangle(doc) {
  const h = mkBai5DocHash(doc);
  if (h.indexOf('#IP:Firewall.Mangle') === 0 && !mkBai5OHopThoaiMangle(doc)) return true;
  try {
    const activeTab = doc.querySelector('#tabs a.active[href*="Mangle"], #tabs a.active');
    if (activeTab && (activeTab.textContent || '').trim().toLowerCase() === 'mangle') {
      return !mkBai5OHopThoaiMangle(doc);
    }
  } catch (e) {}
  return false;
}
function mkBai5OHopThoaiMangle(doc) { return mkBai5DocHash(doc).indexOf('#IP:Firewall.Mangle.') === 0; }

function mkBai5DaMoKhoa(doc, nhan) {
  const tr = mkBai5Hang(doc, nhan);
  if (!tr) return false;
  try {
    const o = tr.querySelector('input, select, textarea');
    return !!(o && !o.disabled);
  } catch (e) {}
  return false;
}

function mkBai5KhoiActionDaMo(doc) {
  const tr = mkBai5Hang(doc, 'Action');
  if (!tr) return false;
  try {
    const sel = tr.querySelector('select, input');
    return !!(sel && sel.offsetParent !== null);
  } catch (e) {}
  return false;
}

function mkBai5GiaTri(doc, nhan) {
  const tr = mkBai5Hang(doc, nhan);
  if (!tr) return null;
  try {
    const o = tr.querySelector('input, select, textarea');
    if (!o) return null;
    if (o.type === 'checkbox') return o.checked ? 'yes' : 'no';
    if (o.tagName === 'SELECT') {
      const op = o.options[o.selectedIndex];
      return op ? op.text.trim() : (o.value || '').trim();
    }
    return (o.value || '').trim();
  } catch (e) {}
  return null;
}

function mkBai5Part1Xong(doc) {
  if (window._FTC_MK5_BANG_SAVED) return true;
  const ds = window._FTC_MK5_DS_BANG || [];
  return ds.some(function (b) { return b.ten === 'ISP1'; });
}

function mkBai5Part2Xong(doc) {
  if (window._FTC_MK5_ROUTE_SAVED) return true;
  const ds = window._FTC_MK5_DS_TUYEN || [];
  return ds.some(function (t) { return t.gateway === '1.1.1.1'; });
}

function mkBai5Part3Xong(doc) {
  if (window._FTC_MK5_MANGLE_SAVED) return true;
  const ds = window._FTC_MK5_DS_MANGLE || [];
  return ds.some(function (m) { return m.src === '192.168.1.0/24' && m.action === 'mark routing'; });
}

function mkBai5CaiTheoDoi(doc) {
  try {
    if (!doc) return;

    // Hộp thoại thêm bảng định tuyến
    const trName = mkBai5Hang(doc, 'Name');
    if (trName) {
      const inp = trName.querySelector('input');
      if (inp && !inp.id) inp.id = 'ftc-mk5-name';
    }
    const trFib = mkBai5Hang(doc, 'FIB');
    if (trFib) {
      const chk = trFib.querySelector('input[type="checkbox"], input');
      if (chk && !chk.id) chk.id = 'ftc-mk5-fib';
    }

    // Hộp thoại thêm tuyến đường (Route)
    const trGw = mkBai5Hang(doc, 'Gateway');
    if (trGw) {
      const inp = trGw.querySelector('input');
      if (inp && !inp.id) inp.id = 'ftc-mk5-gw';
    }
    const trRt = mkBai5Hang(doc, 'Routing Table');
    if (trRt) {
      const sel = trRt.querySelector('select, input');
      if (sel && !sel.id) sel.id = 'ftc-mk5-rt';
    }

    // Hộp thoại thêm luật Mangle
    const trSrc = mkBai5Hang(doc, 'Src. Address');
    if (trSrc) {
      const inp = trSrc.querySelector('input');
      if (inp && !inp.id) inp.id = 'ftc-mk5-src';
      const btn = trSrc.querySelector('a.sbtn');
      if (btn && !btn.id) btn.id = 'ftc-mk5-src-btn';
    }
    const trAct = mkBai5Hang(doc, 'Action');
    if (trAct) {
      const sel = trAct.querySelector('select, input');
      if (sel && !sel.id) sel.id = 'ftc-mk5-action';
    }
    const trMark = mkBai5Hang(doc, 'New Routing Mark');
    if (trMark) {
      const sel = trMark.querySelector('select, input');
      if (sel && !sel.id) sel.id = 'ftc-mk5-mark';
    }

    // Khối Action trong Mangle (hàng tiêu đề td.sep)
    for (const td of doc.querySelectorAll('td.sep')) {
      if (td.textContent.trim().toLowerCase() === 'action') {
        if (!td.id) td.id = 'ftc-mk5-sep-action';
        break;
      }
    }

    // Tab Mangle trên trang Firewall
    for (const a of doc.querySelectorAll('a[href]')) {
      if (a.getAttribute('href') === '#IP:Firewall.Mangle' && a.textContent.trim().toLowerCase() === 'mangle') {
        if (!a.id) a.id = 'ftc-mk5-the-mangle';
        break;
      }
    }

    // Nút Add New trên trang Mangle
    if (mkBai5OMangle(doc)) {
      const addBtns = doc.querySelectorAll('#toolbar a.button, ul.toolbar a.button, a.button');
      for (const btn of addBtns) {
        if ((btn.textContent || '').trim().toLowerCase() === 'add new') {
          if (!btn.id) btn.id = 'ftc-mk5-btn-add-mangle';
          break;
        }
      }
    }
  } catch (e) {}
}

/* ───────────────────────── Danh sách 21 Tooltip ───────────────────────── */

window.TOOLTIPS_MIKROTIK_HEXS['mikrotik_hexs-bai5'] = [
  // ── Màn hình đăng nhập RouterOS ─────────────────────────────────────
  {
    selector: 'input#name',
    text: 'Nhập admin',
    position: 'right',
    condition: function (doc) { return mkBai5ManDangNhap(doc); }
  },
  {
    selector: 'input[value="Login"], input[type="button"][value="Login"]',
    text: 'Nhấn Login',
    position: 'right',
    condition: function (doc) { return mkBai5ManDangNhap(doc); }
  },

  // ══════════════ PHẦN 1: ROUTING > TABLES (Bước 1 ➔ 6) ══════════════
  {
    selector: 'li#Routing span, #menu a[href="#Routing"], #id_Routing, text:Routing',
    text: 'Bước 1: Chọn menu Routing',
    position: 'right',
    condition: function (doc) {
      mkBai5CaiTheoDoi(doc);
      return !mkBai5ManDangNhap(doc) && !mkBai5Part1Xong(doc)
        && !mkBai5OTables(doc) && !mkBai5OHopThoaiBang(doc)
        && !mkBai5MenuConHien(doc, 'Tables');
    }
  },
  {
    selector: 'a[href="#Routing:Tables"], text:Tables',
    text: 'Bước 2: Chọn mục Tables',
    position: 'right',
    condition: function (doc) {
      mkBai5CaiTheoDoi(doc);
      return !mkBai5ManDangNhap(doc) && !mkBai5Part1Xong(doc)
        && !mkBai5OTables(doc) && !mkBai5OHopThoaiBang(doc)
        && mkBai5MenuConHien(doc, 'Tables');
    }
  },
  {
    selector: 'a.button:has-text("Add New"), a[href="#Routing:Tables.new"], text:Add New',
    text: 'Bước 3: Chọn Add New để tạo bảng định tuyến mới',
    position: 'bottom',
    condition: function (doc) {
      mkBai5CaiTheoDoi(doc);
      return !mkBai5ManDangNhap(doc) && !mkBai5Part1Xong(doc) && mkBai5OTables(doc);
    }
  },
  {
    selector: '#ftc-mk5-name, tr:has-text("Name") input',
    text: 'Bước 4: Nhập Name: ISP1',
    position: 'right',
    condition: function (doc) {
      mkBai5CaiTheoDoi(doc);
      return mkBai5OHopThoaiBang(doc) && mkBai5GiaTri(doc, 'Name') !== 'ISP1';
    }
  },
  {
    selector: '#ftc-mk5-fib, tr:has-text("FIB") input[type="checkbox"]',
    text: 'Bước 5: Tích chọn ô FIB',
    position: 'right',
    condition: function (doc) {
      mkBai5CaiTheoDoi(doc);
      return mkBai5OHopThoaiBang(doc) && mkBai5GiaTri(doc, 'Name') === 'ISP1' && mkBai5GiaTri(doc, 'FIB') !== 'yes';
    }
  },
  {
    selector: 'input[value="OK"], input[type="button"][value="OK"], a.button:has-text("OK"), text:OK',
    text: 'Bước 6: Nhấn OK để lưu bảng định tuyến ISP1',
    position: 'bottom',
    condition: function (doc) {
      mkBai5CaiTheoDoi(doc);
      return mkBai5OHopThoaiBang(doc) && mkBai5GiaTri(doc, 'Name') === 'ISP1' && mkBai5GiaTri(doc, 'FIB') === 'yes';
    }
  },

  // ══════════════ PHẦN 2: IP > ROUTES (Bước 7 ➔ 12) ══════════════════
  {
    selector: 'li#IP span, #menu a[href="#IP"], #id_IP, text:IP',
    text: 'Bước 7: Chọn menu IP',
    position: 'right',
    condition: function (doc) {
      mkBai5CaiTheoDoi(doc);
      return mkBai5Part1Xong(doc) && !mkBai5Part2Xong(doc)
        && !mkBai5ORoutes(doc) && !mkBai5OHopThoaiTuyen(doc)
        && !mkBai5MenuConHien(doc, 'Routes');
    }
  },
  {
    selector: 'a[href="#IP:Routes"], text:Routes',
    text: 'Bước 8: Chọn mục Routes',
    position: 'right',
    condition: function (doc) {
      mkBai5CaiTheoDoi(doc);
      return mkBai5Part1Xong(doc) && !mkBai5Part2Xong(doc)
        && !mkBai5ORoutes(doc) && !mkBai5OHopThoaiTuyen(doc)
        && mkBai5MenuConHien(doc, 'Routes');
    }
  },
  {
    selector: 'a.button:has-text("Add New"), a[href="#IP:Routes.new"], text:Add New',
    text: 'Bước 9: Chọn Add New để tạo tuyến đường mới',
    position: 'bottom',
    condition: function (doc) {
      mkBai5CaiTheoDoi(doc);
      return mkBai5Part1Xong(doc) && !mkBai5Part2Xong(doc) && mkBai5ORoutes(doc);
    }
  },
  {
    selector: '#ftc-mk5-gw, tr:has-text("Gateway") input',
    text: 'Bước 10: Nhập Gateway: 1.1.1.1',
    position: 'right',
    condition: function (doc) {
      mkBai5CaiTheoDoi(doc);
      return mkBai5OHopThoaiTuyen(doc) && mkBai5GiaTri(doc, 'Gateway') !== '1.1.1.1';
    }
  },
  {
    selector: '#ftc-mk5-rt, tr:has-text("Routing Table") select',
    text: 'Bước 11: Chọn Routing Table: ISP1',
    position: 'right',
    condition: function (doc) {
      mkBai5CaiTheoDoi(doc);
      return mkBai5OHopThoaiTuyen(doc) && mkBai5GiaTri(doc, 'Gateway') === '1.1.1.1' && mkBai5GiaTri(doc, 'Routing Table') !== 'ISP1';
    }
  },
  {
    selector: 'input[value="OK"], input[type="button"][value="OK"], a.button:has-text("OK"), text:OK',
    text: 'Bước 12: Nhấn OK để lưu tuyến đường',
    position: 'bottom',
    condition: function (doc) {
      mkBai5CaiTheoDoi(doc);
      return mkBai5OHopThoaiTuyen(doc) && mkBai5GiaTri(doc, 'Gateway') === '1.1.1.1' && mkBai5GiaTri(doc, 'Routing Table') === 'ISP1';
    }
  },

  // ══════════════ PHẦN 3: IP > FIREWALL > MANGLE (Bước 13 ➔ 21) ════════
  {
    selector: 'li#IP span, #menu a[href="#IP"], #id_IP, text:IP',
    text: 'Bước 13: Chọn menu IP',
    position: 'right',
    condition: function (doc) {
      mkBai5CaiTheoDoi(doc);
      return mkBai5Part2Xong(doc) && !mkBai5Part3Xong(doc)
        && !mkBai5OFirewall(doc) && !mkBai5MenuConHien(doc, 'Firewall');
    }
  },
  {
    selector: 'a[href="#IP:Firewall"], text:Firewall',
    text: 'Bước 14: Chọn mục Firewall',
    position: 'right',
    condition: function (doc) {
      mkBai5CaiTheoDoi(doc);
      return mkBai5Part2Xong(doc) && !mkBai5Part3Xong(doc)
        && !mkBai5OFirewall(doc) && mkBai5MenuConHien(doc, 'Firewall');
    }
  },
  {
    selector: '#ftc-mk5-the-mangle, a[href="#IP:Firewall.Mangle"], text:Mangle',
    text: 'Bước 15: Chọn tab Mangle',
    position: 'bottom',
    condition: function (doc) {
      mkBai5CaiTheoDoi(doc);
      return mkBai5Part2Xong(doc) && !mkBai5Part3Xong(doc)
        && mkBai5OFirewall(doc) && !mkBai5OMangle(doc) && !mkBai5OHopThoaiMangle(doc);
    }
  },
  {
    selector: '#ftc-mk5-btn-add-mangle, #toolbar a.button:has-text("Add New"), a.button:has-text("Add New")',
    text: 'Bước 16: Chọn Add New để tạo luật Mangle mới',
    position: 'bottom',
    condition: function (doc) {
      mkBai5CaiTheoDoi(doc);
      return mkBai5Part2Xong(doc) && !mkBai5Part3Xong(doc) && mkBai5OMangle(doc);
    }
  },
  {
    selector: '#ftc-mk5-src-btn, tr:has-text("Src. Address") a.sbtn',
    text: 'Bước 17: Bấm mở khóa ô Src. Address',
    position: 'left',
    condition: function (doc) {
      mkBai5CaiTheoDoi(doc);
      return mkBai5OHopThoaiMangle(doc) && !mkBai5DaMoKhoa(doc, 'Src. Address');
    }
  },
  {
    selector: '#ftc-mk5-src, tr:has-text("Src. Address") input',
    text: 'Bước 17: Nhập Src. Address: 192.168.1.0/24',
    position: 'right',
    condition: function (doc) {
      mkBai5CaiTheoDoi(doc);
      return mkBai5OHopThoaiMangle(doc) && mkBai5DaMoKhoa(doc, 'Src. Address') && mkBai5GiaTri(doc, 'Src. Address') !== '192.168.1.0/24';
    }
  },
  {
    selector: '#ftc-mk5-sep-action, td.sep:has-text("Action"), text:Action',
    text: 'Bước 18: Nhấn khối Action để mở rộng tùy chọn Action',
    position: 'bottom',
    condition: function (doc) {
      mkBai5CaiTheoDoi(doc);
      return mkBai5OHopThoaiMangle(doc) && mkBai5GiaTri(doc, 'Src. Address') === '192.168.1.0/24' && !mkBai5KhoiActionDaMo(doc);
    }
  },
  {
    selector: '#ftc-mk5-action, tr:has-text("Action") select',
    text: 'Bước 19: Chọn Action: mark routing',
    position: 'right',
    condition: function (doc) {
      mkBai5CaiTheoDoi(doc);
      return mkBai5OHopThoaiMangle(doc) && mkBai5GiaTri(doc, 'Src. Address') === '192.168.1.0/24'
        && mkBai5KhoiActionDaMo(doc) && mkBai5GiaTri(doc, 'Action') !== 'mark routing';
    }
  },
  {
    selector: '#ftc-mk5-mark, tr:has-text("New Routing Mark") input, tr:has-text("New Routing Mark") select',
    text: 'Bước 20: Chọn New Routing Mark: ISP1',
    position: 'right',
    condition: function (doc) {
      mkBai5CaiTheoDoi(doc);
      return mkBai5OHopThoaiMangle(doc) && mkBai5GiaTri(doc, 'Src. Address') === '192.168.1.0/24'
        && mkBai5KhoiActionDaMo(doc) && mkBai5GiaTri(doc, 'Action') === 'mark routing'
        && mkBai5GiaTri(doc, 'New Routing Mark') !== 'ISP1';
    }
  },
  {
    selector: 'input[value="OK"], input[type="button"][value="OK"], a.button:has-text("OK"), text:OK',
    text: 'Bước 21: Nhấn OK để lưu luật Mangle và hoàn thành bài tập',
    position: 'bottom',
    condition: function (doc) {
      mkBai5CaiTheoDoi(doc);
      return mkBai5OHopThoaiMangle(doc) && mkBai5GiaTri(doc, 'Src. Address') === '192.168.1.0/24'
        && mkBai5KhoiActionDaMo(doc) && mkBai5GiaTri(doc, 'Action') === 'mark routing'
        && mkBai5GiaTri(doc, 'New Routing Mark') === 'ISP1';
    }
  }
];
