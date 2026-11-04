/**
 * devices/mikrotik_hexs/tooltips/bai5.js — Tooltip Hướng dẫn Bài 5: Cấu hình Policy Routing
 *
 * Chuỗi 43 bước tuần tự chuẩn thực tế theo sơ đồ Policy Based Routing (PBR) 2-PC / 2-WAN:
 *   Phần 1: Routing > Tables (Bước 1 ➔ 10):
 *       - Tạo bảng ra-wan1 (fib: yes)
 *       - Tạo bảng ra-wan2 (fib: yes)
 *   Phần 2: IP > Firewall > Mangle (Bước 11 ➔ 29):
 *       - Tạo luật Mangle cho PC 1: Src. Address 192.168.1.100 -> New Routing Mark: ra-wan1 -> Apply -> OK
 *       - Tạo luật Mangle cho PC 2: Src. Address 192.168.1.101 -> New Routing Mark: ra-wan2 -> Apply -> OK
 *   Phần 3: IP > Routes (Bước 30 ➔ 43):
 *       - Tạo Default Route cho WAN 1: Dst. Address 0.0.0.0/0 -> Gateway %pppoe-out1 -> Routing Table: ra-wan1 -> Apply -> OK
 *       - Tạo Default Route cho WAN 2: Dst. Address 0.0.0.0/0 -> Gateway %pppoe-out2 -> Routing Table: ra-wan2 -> Apply -> OK
 *
 * NGUYÊN TẮC BẤT BIẾN:
 * 1. Chuyển bước nghiêm ngặt: bước trước cấu hình xong nhập đúng thì mới chuyển sang bước sau.
 * 2. An toàn DOM tuyệt đối: không ghi đè innerHTML/textContent của WebFig, chỉ gắn ID phụ khi chưa có ID.
 * 3. Chống sửa đè (Anti-overwrite): Sau khi lưu mục 1 (Bảng 1 / Mangle 1 / Route 1), bắt buộc quay về danh sách
 *    nhấn Add New rồi mới cấu hình mục 2, tuyệt đối không cho phép nhập đè lên form cũ.
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

function mkBai5GwHopLe1(gw) {
  if (!gw) return false;
  const s = gw.toLowerCase().trim();
  return s === '%pppoe-out1' || s === 'pppoe-out1';
}

function mkBai5GwHopLe2(gw) {
  if (!gw) return false;
  const s = gw.toLowerCase().trim();
  return s === '%pppoe-out2' || s === 'pppoe-out2';
}

function mkBai5Table1Xong(doc) {
  if (window._FTC_MK5_BANG1_SAVED) return true;
  const ds = window._FTC_MK5_DS_BANG || [];
  return ds.some(function (b) { return b.ten === 'ra-wan1' || b.ten === 'ISP1'; });
}

function mkBai5Table2Xong(doc) {
  if (window._FTC_MK5_BANG2_SAVED) return true;
  const ds = window._FTC_MK5_DS_BANG || [];
  return ds.some(function (b) { return b.ten === 'ra-wan2'; });
}

function mkBai5TablesXong(doc) {
  return mkBai5Table1Xong(doc) && mkBai5Table2Xong(doc);
}

function mkBai5Mangle1Xong(doc) {
  if (window._FTC_MK5_MANGLE1_SAVED) return true;
  const ds = window._FTC_MK5_DS_MANGLE || [];
  return ds.some(function (m) {
    const raw = (m.raw || '').toLowerCase();
    return (m.src === '192.168.1.100' || raw.includes('192.168.1.100')) &&
      (raw.includes('ra-wan1') || raw.includes('isp1') || m.action.includes('mark'));
  });
}

function mkBai5Mangle2Xong(doc) {
  if (window._FTC_MK5_MANGLE2_SAVED) return true;
  const ds = window._FTC_MK5_DS_MANGLE || [];
  return ds.some(function (m) {
    const raw = (m.raw || '').toLowerCase();
    return (m.src === '192.168.1.101' || raw.includes('192.168.1.101')) &&
      (raw.includes('ra-wan2') || m.action.includes('mark'));
  });
}

function mkBai5ManglesXong(doc) {
  return mkBai5Mangle1Xong(doc) && mkBai5Mangle2Xong(doc);
}

function mkBai5Route1Xong(doc) {
  if (window._FTC_MK5_ROUTE1_SAVED) return true;
  const ds = window._FTC_MK5_DS_TUYEN || [];
  return ds.some(function (t) {
    const gw = (t.gateway || '').toLowerCase();
    const bang = (t.bang || '').toLowerCase();
    return (gw.includes('pppoe-out1') || gw.includes('1.1.1.1') || gw.includes('ether1')) &&
      (bang.includes('ra-wan1') || bang.includes('isp1'));
  });
}

function mkBai5Route2Xong(doc) {
  if (window._FTC_MK5_ROUTE2_SAVED) return true;
  const ds = window._FTC_MK5_DS_TUYEN || [];
  return ds.some(function (t) {
    const gw = (t.gateway || '').toLowerCase();
    const bang = (t.bang || '').toLowerCase();
    return (gw.includes('pppoe-out2') || gw.includes('2.2.2.2') || gw.includes('ether2')) &&
      bang.includes('ra-wan2');
  });
}

function mkBai5RoutesXong(doc) {
  return mkBai5Route1Xong(doc) && mkBai5Route2Xong(doc);
}

function mkBai5CaiTheoDoi(doc) {
  try {
    if (!doc) return;

    // Nút Add New trên trang Tables
    if (mkBai5OTables(doc)) {
      const addBtns = doc.querySelectorAll('#toolbar a.button, ul.toolbar a.button, a.button');
      for (const btn of addBtns) {
        if ((btn.textContent || '').trim().toLowerCase() === 'add new') {
          if (!btn.id) btn.id = 'ftc-mk5-btn-add-table';
          break;
        }
      }
    }

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

    // Nút Add New trên trang Routes
    if (mkBai5ORoutes(doc)) {
      const addBtns = doc.querySelectorAll('#toolbar a.button, ul.toolbar a.button, a.button');
      for (const btn of addBtns) {
        if ((btn.textContent || '').trim().toLowerCase() === 'add new') {
          if (!btn.id) btn.id = 'ftc-mk5-btn-add-route';
          break;
        }
      }
    }

    // Hộp thoại thêm tuyến đường (Route)
    const trDst = mkBai5Hang(doc, 'Dst. Address');
    if (trDst) {
      const inp = trDst.querySelector('input');
      if (inp && !inp.id) inp.id = 'ftc-mk5-dst';
    }
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
  } catch (e) {}
}

/* ───────────────────────── Danh sách 43 Tooltip ───────────────────────── */

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

  // ══════════════ PHẦN 1: ROUTING > TABLES (Bước 1 ➔ 10) ══════════════
  {
    selector: 'li#Routing span, #menu a[href="#Routing"], #id_Routing, text:Routing',
    text: 'Bước 1: Chọn menu Routing',
    position: 'right',
    condition: function (doc) {
      mkBai5CaiTheoDoi(doc);
      return !mkBai5ManDangNhap(doc) && !mkBai5TablesXong(doc)
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
      return !mkBai5ManDangNhap(doc) && !mkBai5TablesXong(doc)
        && !mkBai5OTables(doc) && !mkBai5OHopThoaiBang(doc)
        && mkBai5MenuConHien(doc, 'Tables');
    }
  },
  // Bảng 1: ra-wan1
  {
    selector: '#ftc-mk5-btn-add-table, a.button:has-text("Add New"), a[href="#Routing:Tables.new"], text:Add New',
    text: 'Bước 3: Chọn Add New để tạo bảng định tuyến 1 (ra-wan1)',
    position: 'bottom',
    condition: function (doc) {
      mkBai5CaiTheoDoi(doc);
      return !mkBai5ManDangNhap(doc) && !mkBai5Table1Xong(doc) && mkBai5OTables(doc);
    }
  },
  {
    selector: '#ftc-mk5-name, tr:has-text("Name") input',
    text: 'Bước 4: Nhập Name: ra-wan1',
    position: 'right',
    condition: function (doc) {
      mkBai5CaiTheoDoi(doc);
      return mkBai5OHopThoaiBang(doc) && !mkBai5Table1Xong(doc) && mkBai5GiaTri(doc, 'Name') !== 'ra-wan1';
    }
  },
  {
    selector: '#ftc-mk5-fib, tr:has-text("FIB") input[type="checkbox"]',
    text: 'Bước 5: Tích chọn ô FIB',
    position: 'right',
    condition: function (doc) {
      mkBai5CaiTheoDoi(doc);
      return mkBai5OHopThoaiBang(doc) && !mkBai5Table1Xong(doc) && mkBai5GiaTri(doc, 'Name') === 'ra-wan1' && mkBai5GiaTri(doc, 'FIB') !== 'yes';
    }
  },
  {
    selector: 'input[value="OK"], input[type="button"][value="OK"], a.button:has-text("OK"), text:OK',
    text: 'Bước 6: Nhấn OK để lưu bảng ra-wan1',
    position: 'bottom',
    condition: function (doc) {
      mkBai5CaiTheoDoi(doc);
      return mkBai5OHopThoaiBang(doc) && !mkBai5Table1Xong(doc) && mkBai5GiaTri(doc, 'Name') === 'ra-wan1' && mkBai5GiaTri(doc, 'FIB') === 'yes';
    }
  },
  // Chống sửa đè: nếu bảng 1 đã lưu xong mà form cũ vẫn đang mở, hướng dẫn bấm Cancel
  {
    selector: 'input[value="Cancel"], input[type="button"][value="Cancel"], a.button:has-text("Cancel"), text:Cancel',
    text: 'Đã lưu bảng ra-wan1. Nhấn Cancel để quay lại danh sách bảng',
    position: 'bottom',
    condition: function (doc) {
      mkBai5CaiTheoDoi(doc);
      return mkBai5OHopThoaiBang(doc) && mkBai5Table1Xong(doc) && !mkBai5Table2Xong(doc) && mkBai5GiaTri(doc, 'Name') === 'ra-wan1';
    }
  },
  // Bảng 2: ra-wan2
  {
    selector: '#ftc-mk5-btn-add-table, a.button:has-text("Add New"), a[href="#Routing:Tables.new"], text:Add New',
    text: 'Bước 7: Tiếp tục chọn Add New để tạo bảng định tuyến 2 (ra-wan2)',
    position: 'bottom',
    condition: function (doc) {
      mkBai5CaiTheoDoi(doc);
      return !mkBai5ManDangNhap(doc) && mkBai5Table1Xong(doc) && !mkBai5Table2Xong(doc) && mkBai5OTables(doc);
    }
  },
  {
    selector: '#ftc-mk5-name, tr:has-text("Name") input',
    text: 'Bước 8: Nhập Name: ra-wan2',
    position: 'right',
    condition: function (doc) {
      mkBai5CaiTheoDoi(doc);
      return mkBai5OHopThoaiBang(doc) && mkBai5Table1Xong(doc) && !mkBai5Table2Xong(doc)
        && mkBai5GiaTri(doc, 'Name') !== 'ra-wan1'
        && mkBai5GiaTri(doc, 'Name') !== 'ra-wan2';
    }
  },
  {
    selector: '#ftc-mk5-fib, tr:has-text("FIB") input[type="checkbox"]',
    text: 'Bước 9: Tích chọn ô FIB',
    position: 'right',
    condition: function (doc) {
      mkBai5CaiTheoDoi(doc);
      return mkBai5OHopThoaiBang(doc) && mkBai5Table1Xong(doc) && !mkBai5Table2Xong(doc) && mkBai5GiaTri(doc, 'Name') === 'ra-wan2' && mkBai5GiaTri(doc, 'FIB') !== 'yes';
    }
  },
  {
    selector: 'input[value="OK"], input[type="button"][value="OK"], a.button:has-text("OK"), text:OK',
    text: 'Bước 10: Nhấn OK để lưu bảng ra-wan2',
    position: 'bottom',
    condition: function (doc) {
      mkBai5CaiTheoDoi(doc);
      return mkBai5OHopThoaiBang(doc) && mkBai5Table1Xong(doc) && !mkBai5Table2Xong(doc) && mkBai5GiaTri(doc, 'Name') === 'ra-wan2' && mkBai5GiaTri(doc, 'FIB') === 'yes';
    }
  },

  // ══════════════ PHẦN 2: IP > FIREWALL > MANGLE (Bước 11 ➔ 29) ════════
  {
    selector: 'li#IP span, #menu a[href="#IP"], #id_IP, text:IP',
    text: 'Bước 11: Chọn menu IP',
    position: 'right',
    condition: function (doc) {
      mkBai5CaiTheoDoi(doc);
      return mkBai5TablesXong(doc) && !mkBai5ManglesXong(doc)
        && !mkBai5OFirewall(doc) && !mkBai5MenuConHien(doc, 'Firewall');
    }
  },
  {
    selector: 'a[href="#IP:Firewall"], text:Firewall',
    text: 'Bước 12: Chọn mục Firewall',
    position: 'right',
    condition: function (doc) {
      mkBai5CaiTheoDoi(doc);
      return mkBai5TablesXong(doc) && !mkBai5ManglesXong(doc)
        && !mkBai5OFirewall(doc) && mkBai5MenuConHien(doc, 'Firewall');
    }
  },
  {
    selector: '#ftc-mk5-the-mangle, a[href="#IP:Firewall.Mangle"], text:Mangle',
    text: 'Bước 13: Chọn tab Mangle',
    position: 'bottom',
    condition: function (doc) {
      mkBai5CaiTheoDoi(doc);
      return mkBai5TablesXong(doc) && !mkBai5ManglesXong(doc)
        && mkBai5OFirewall(doc) && !mkBai5OMangle(doc) && !mkBai5OHopThoaiMangle(doc);
    }
  },

  // Mangle 1: PC 1 (192.168.1.100 -> ra-wan1)
  {
    selector: '#ftc-mk5-btn-add-mangle, #toolbar a.button:has-text("Add New"), a.button:has-text("Add New")',
    text: 'Bước 14: Chọn Add New để tạo luật Mangle cho PC 1',
    position: 'bottom',
    condition: function (doc) {
      mkBai5CaiTheoDoi(doc);
      return mkBai5TablesXong(doc) && !mkBai5Mangle1Xong(doc) && mkBai5OMangle(doc);
    }
  },
  {
    selector: '#ftc-mk5-src-btn, tr:has-text("Src. Address") a.sbtn',
    text: 'Bước 15: Bấm mở khóa ô Src. Address',
    position: 'left',
    condition: function (doc) {
      mkBai5CaiTheoDoi(doc);
      return mkBai5OHopThoaiMangle(doc) && !mkBai5Mangle1Xong(doc) && !mkBai5DaMoKhoa(doc, 'Src. Address');
    }
  },
  {
    selector: '#ftc-mk5-src, tr:has-text("Src. Address") input',
    text: 'Bước 16: Nhập Src. Address: 192.168.1.100',
    position: 'right',
    condition: function (doc) {
      mkBai5CaiTheoDoi(doc);
      return mkBai5OHopThoaiMangle(doc) && !mkBai5Mangle1Xong(doc) && mkBai5DaMoKhoa(doc, 'Src. Address') && mkBai5GiaTri(doc, 'Src. Address') !== '192.168.1.100';
    }
  },
  {
    selector: '#ftc-mk5-sep-action, td.sep:has-text("Action"), text:Action',
    text: 'Bước 17: Nhấn khối Action để mở rộng tùy chọn Action',
    position: 'bottom',
    condition: function (doc) {
      mkBai5CaiTheoDoi(doc);
      return mkBai5OHopThoaiMangle(doc) && !mkBai5Mangle1Xong(doc) && mkBai5GiaTri(doc, 'Src. Address') === '192.168.1.100' && !mkBai5KhoiActionDaMo(doc);
    }
  },
  {
    selector: '#ftc-mk5-action, tr:has-text("Action") select',
    text: 'Bước 18: Chọn Action: mark routing',
    position: 'right',
    condition: function (doc) {
      mkBai5CaiTheoDoi(doc);
      return mkBai5OHopThoaiMangle(doc) && !mkBai5Mangle1Xong(doc) && mkBai5GiaTri(doc, 'Src. Address') === '192.168.1.100'
        && mkBai5KhoiActionDaMo(doc) && mkBai5GiaTri(doc, 'Action') !== 'mark routing';
    }
  },
  {
    selector: '#ftc-mk5-mark, tr:has-text("New Routing Mark") input, tr:has-text("New Routing Mark") select',
    text: 'Bước 19: Chọn New Routing Mark: ra-wan1',
    position: 'right',
    condition: function (doc) {
      mkBai5CaiTheoDoi(doc);
      return mkBai5OHopThoaiMangle(doc) && !mkBai5Mangle1Xong(doc) && mkBai5GiaTri(doc, 'Src. Address') === '192.168.1.100'
        && mkBai5KhoiActionDaMo(doc) && mkBai5GiaTri(doc, 'Action') === 'mark routing'
        && mkBai5GiaTri(doc, 'New Routing Mark') !== 'ra-wan1' && mkBai5GiaTri(doc, 'New Routing Mark') !== 'ISP1';
    }
  },
  {
    selector: 'input[value="Apply"], input[type="button"][value="Apply"], a.button:has-text("Apply"), text:Apply',
    text: 'Bước 20: Nhấn Apply để lưu cấu hình luật PC 1',
    position: 'bottom',
    condition: function (doc) {
      mkBai5CaiTheoDoi(doc);
      return mkBai5OHopThoaiMangle(doc) && !mkBai5Mangle1Xong(doc) && mkBai5GiaTri(doc, 'Src. Address') === '192.168.1.100'
        && mkBai5KhoiActionDaMo(doc) && mkBai5GiaTri(doc, 'Action') === 'mark routing'
        && (mkBai5GiaTri(doc, 'New Routing Mark') === 'ra-wan1' || mkBai5GiaTri(doc, 'New Routing Mark') === 'ISP1')
        && !window._FTC_MK5_MANGLE1_APPLIED;
    }
  },
  {
    selector: 'input[value="OK"], input[type="button"][value="OK"], a.button:has-text("OK"), text:OK',
    text: 'Bước 21: Nhấn OK để đóng cửa sổ luật Mangle PC 1',
    position: 'bottom',
    condition: function (doc) {
      mkBai5CaiTheoDoi(doc);
      return mkBai5OHopThoaiMangle(doc) && !mkBai5Mangle1Xong(doc) && mkBai5GiaTri(doc, 'Src. Address') === '192.168.1.100'
        && mkBai5KhoiActionDaMo(doc) && mkBai5GiaTri(doc, 'Action') === 'mark routing'
        && (mkBai5GiaTri(doc, 'New Routing Mark') === 'ra-wan1' || mkBai5GiaTri(doc, 'New Routing Mark') === 'ISP1')
        && !!window._FTC_MK5_MANGLE1_APPLIED;
    }
  },
  // Chống sửa đè Mangle 1:
  {
    selector: 'input[value="Cancel"], input[type="button"][value="Cancel"], a.button:has-text("Cancel"), text:Cancel',
    text: 'Đã lưu Mangle PC 1. Nhấn Cancel để quay lại danh sách luật',
    position: 'bottom',
    condition: function (doc) {
      mkBai5CaiTheoDoi(doc);
      return mkBai5OHopThoaiMangle(doc) && mkBai5Mangle1Xong(doc) && !mkBai5Mangle2Xong(doc) && mkBai5GiaTri(doc, 'Src. Address') === '192.168.1.100';
    }
  },

  // Mangle 2: PC 2 (192.168.1.101 -> ra-wan2)
  {
    selector: '#ftc-mk5-btn-add-mangle, #toolbar a.button:has-text("Add New"), a.button:has-text("Add New")',
    text: 'Bước 22: Tiếp tục chọn Add New để tạo luật Mangle cho PC 2',
    position: 'bottom',
    condition: function (doc) {
      mkBai5CaiTheoDoi(doc);
      return mkBai5TablesXong(doc) && mkBai5Mangle1Xong(doc) && !mkBai5Mangle2Xong(doc) && mkBai5OMangle(doc);
    }
  },
  {
    selector: '#ftc-mk5-src-btn, tr:has-text("Src. Address") a.sbtn',
    text: 'Bước 23: Bấm mở khóa ô Src. Address',
    position: 'left',
    condition: function (doc) {
      mkBai5CaiTheoDoi(doc);
      return mkBai5OHopThoaiMangle(doc) && mkBai5Mangle1Xong(doc) && !mkBai5Mangle2Xong(doc)
        && mkBai5GiaTri(doc, 'Src. Address') !== '192.168.1.100'
        && !mkBai5DaMoKhoa(doc, 'Src. Address');
    }
  },
  {
    selector: '#ftc-mk5-src, tr:has-text("Src. Address") input',
    text: 'Bước 24: Nhập Src. Address: 192.168.1.101',
    position: 'right',
    condition: function (doc) {
      mkBai5CaiTheoDoi(doc);
      return mkBai5OHopThoaiMangle(doc) && mkBai5Mangle1Xong(doc) && !mkBai5Mangle2Xong(doc)
        && mkBai5GiaTri(doc, 'Src. Address') !== '192.168.1.100'
        && mkBai5DaMoKhoa(doc, 'Src. Address') && mkBai5GiaTri(doc, 'Src. Address') !== '192.168.1.101';
    }
  },
  {
    selector: '#ftc-mk5-sep-action, td.sep:has-text("Action"), text:Action',
    text: 'Bước 25: Nhấn khối Action để mở rộng tùy chọn Action',
    position: 'bottom',
    condition: function (doc) {
      mkBai5CaiTheoDoi(doc);
      return mkBai5OHopThoaiMangle(doc) && mkBai5Mangle1Xong(doc) && !mkBai5Mangle2Xong(doc) && mkBai5GiaTri(doc, 'Src. Address') === '192.168.1.101' && !mkBai5KhoiActionDaMo(doc);
    }
  },
  {
    selector: '#ftc-mk5-action, tr:has-text("Action") select',
    text: 'Bước 26: Chọn Action: mark routing',
    position: 'right',
    condition: function (doc) {
      mkBai5CaiTheoDoi(doc);
      return mkBai5OHopThoaiMangle(doc) && mkBai5Mangle1Xong(doc) && !mkBai5Mangle2Xong(doc) && mkBai5GiaTri(doc, 'Src. Address') === '192.168.1.101'
        && mkBai5KhoiActionDaMo(doc) && mkBai5GiaTri(doc, 'Action') !== 'mark routing';
    }
  },
  {
    selector: '#ftc-mk5-mark, tr:has-text("New Routing Mark") input, tr:has-text("New Routing Mark") select',
    text: 'Bước 27: Chọn New Routing Mark: ra-wan2',
    position: 'right',
    condition: function (doc) {
      mkBai5CaiTheoDoi(doc);
      return mkBai5OHopThoaiMangle(doc) && mkBai5Mangle1Xong(doc) && !mkBai5Mangle2Xong(doc) && mkBai5GiaTri(doc, 'Src. Address') === '192.168.1.101'
        && mkBai5KhoiActionDaMo(doc) && mkBai5GiaTri(doc, 'Action') === 'mark routing'
        && mkBai5GiaTri(doc, 'New Routing Mark') !== 'ra-wan2';
    }
  },
  {
    selector: 'input[value="Apply"], input[type="button"][value="Apply"], a.button:has-text("Apply"), text:Apply',
    text: 'Bước 28: Nhấn Apply để lưu cấu hình luật PC 2',
    position: 'bottom',
    condition: function (doc) {
      mkBai5CaiTheoDoi(doc);
      return mkBai5OHopThoaiMangle(doc) && mkBai5Mangle1Xong(doc) && !mkBai5Mangle2Xong(doc) && mkBai5GiaTri(doc, 'Src. Address') === '192.168.1.101'
        && mkBai5KhoiActionDaMo(doc) && mkBai5GiaTri(doc, 'Action') === 'mark routing'
        && mkBai5GiaTri(doc, 'New Routing Mark') === 'ra-wan2'
        && !window._FTC_MK5_MANGLE2_APPLIED;
    }
  },
  {
    selector: 'input[value="OK"], input[type="button"][value="OK"], a.button:has-text("OK"), text:OK',
    text: 'Bước 29: Nhấn OK để đóng cửa sổ luật Mangle PC 2',
    position: 'bottom',
    condition: function (doc) {
      mkBai5CaiTheoDoi(doc);
      return mkBai5OHopThoaiMangle(doc) && mkBai5Mangle1Xong(doc) && !mkBai5Mangle2Xong(doc) && mkBai5GiaTri(doc, 'Src. Address') === '192.168.1.101'
        && mkBai5KhoiActionDaMo(doc) && mkBai5GiaTri(doc, 'Action') === 'mark routing'
        && mkBai5GiaTri(doc, 'New Routing Mark') === 'ra-wan2'
        && !!window._FTC_MK5_MANGLE2_APPLIED;
    }
  },

  // ══════════════ PHẦN 3: IP > ROUTES (Bước 30 ➔ 43) ══════════════════
  {
    selector: 'li#IP span, #menu a[href="#IP"], #id_IP, text:IP',
    text: 'Bước 30: Chọn menu IP',
    position: 'right',
    condition: function (doc) {
      mkBai5CaiTheoDoi(doc);
      return mkBai5ManglesXong(doc) && !mkBai5RoutesXong(doc)
        && !mkBai5ORoutes(doc) && !mkBai5OHopThoaiTuyen(doc)
        && !mkBai5MenuConHien(doc, 'Routes');
    }
  },
  {
    selector: 'a[href="#IP:Routes"], text:Routes',
    text: 'Bước 31: Chọn mục Routes',
    position: 'right',
    condition: function (doc) {
      mkBai5CaiTheoDoi(doc);
      return mkBai5ManglesXong(doc) && !mkBai5RoutesXong(doc)
        && !mkBai5ORoutes(doc) && !mkBai5OHopThoaiTuyen(doc)
        && mkBai5MenuConHien(doc, 'Routes');
    }
  },
  // Tuyến 1: WAN 1 (%pppoe-out1 trỏ ra-wan1)
  {
    selector: '#ftc-mk5-btn-add-route, a.button:has-text("Add New"), a[href="#IP:Routes.new"], text:Add New',
    text: 'Bước 32: Chọn Add New để tạo tuyến đường cho WAN 1',
    position: 'bottom',
    condition: function (doc) {
      mkBai5CaiTheoDoi(doc);
      return mkBai5ManglesXong(doc) && !mkBai5Route1Xong(doc) && mkBai5ORoutes(doc);
    }
  },
  {
    selector: '#ftc-mk5-dst, tr:has-text("Dst. Address") input',
    text: 'Bước 33: Nhập Dst. Address: 0.0.0.0/0',
    position: 'right',
    condition: function (doc) {
      mkBai5CaiTheoDoi(doc);
      return mkBai5OHopThoaiTuyen(doc) && !mkBai5Route1Xong(doc) && mkBai5GiaTri(doc, 'Dst. Address') !== '0.0.0.0/0';
    }
  },
  {
    selector: '#ftc-mk5-gw, tr:has-text("Gateway") input',
    text: 'Bước 34: Nhập Gateway: %pppoe-out1',
    position: 'right',
    condition: function (doc) {
      mkBai5CaiTheoDoi(doc);
      return mkBai5OHopThoaiTuyen(doc) && !mkBai5Route1Xong(doc)
        && mkBai5GiaTri(doc, 'Dst. Address') === '0.0.0.0/0'
        && !mkBai5GwHopLe1(mkBai5GiaTri(doc, 'Gateway'));
    }
  },
  {
    selector: '#ftc-mk5-rt, tr:has-text("Routing Table") select',
    text: 'Bước 35: Chọn Routing Table: ra-wan1',
    position: 'right',
    condition: function (doc) {
      mkBai5CaiTheoDoi(doc);
      return mkBai5OHopThoaiTuyen(doc) && !mkBai5Route1Xong(doc)
        && mkBai5GiaTri(doc, 'Dst. Address') === '0.0.0.0/0'
        && mkBai5GwHopLe1(mkBai5GiaTri(doc, 'Gateway'))
        && mkBai5GiaTri(doc, 'Routing Table') !== 'ra-wan1' && mkBai5GiaTri(doc, 'Routing Table') !== 'ISP1';
    }
  },
  {
    selector: 'input[value="Apply"], input[type="button"][value="Apply"], a.button:has-text("Apply"), text:Apply',
    text: 'Bước 36: Nhấn Apply để lưu cấu hình tuyến WAN 1',
    position: 'bottom',
    condition: function (doc) {
      mkBai5CaiTheoDoi(doc);
      return mkBai5OHopThoaiTuyen(doc) && !mkBai5Route1Xong(doc)
        && mkBai5GiaTri(doc, 'Dst. Address') === '0.0.0.0/0'
        && mkBai5GwHopLe1(mkBai5GiaTri(doc, 'Gateway'))
        && (mkBai5GiaTri(doc, 'Routing Table') === 'ra-wan1' || mkBai5GiaTri(doc, 'Routing Table') === 'ISP1')
        && !window._FTC_MK5_ROUTE1_APPLIED;
    }
  },
  {
    selector: 'input[value="OK"], input[type="button"][value="OK"], a.button:has-text("OK"), text:OK',
    text: 'Bước 37: Nhấn OK để đóng cửa sổ tuyến WAN 1',
    position: 'bottom',
    condition: function (doc) {
      mkBai5CaiTheoDoi(doc);
      return mkBai5OHopThoaiTuyen(doc) && !mkBai5Route1Xong(doc)
        && mkBai5GiaTri(doc, 'Dst. Address') === '0.0.0.0/0'
        && mkBai5GwHopLe1(mkBai5GiaTri(doc, 'Gateway'))
        && (mkBai5GiaTri(doc, 'Routing Table') === 'ra-wan1' || mkBai5GiaTri(doc, 'Routing Table') === 'ISP1')
        && !!window._FTC_MK5_ROUTE1_APPLIED;
    }
  },
  // Chống sửa đè Route 1:
  {
    selector: 'input[value="Cancel"], input[type="button"][value="Cancel"], a.button:has-text("Cancel"), text:Cancel',
    text: 'Đã lưu Route WAN 1. Nhấn Cancel để quay lại danh sách tuyến',
    position: 'bottom',
    condition: function (doc) {
      mkBai5CaiTheoDoi(doc);
      return mkBai5OHopThoaiTuyen(doc) && mkBai5Route1Xong(doc) && !mkBai5Route2Xong(doc) && mkBai5GwHopLe1(mkBai5GiaTri(doc, 'Gateway'));
    }
  },

  // Tuyến 2: WAN 2 (%pppoe-out2 trỏ ra-wan2)
  {
    selector: '#ftc-mk5-btn-add-route, a.button:has-text("Add New"), a[href="#IP:Routes.new"], text:Add New',
    text: 'Bước 38: Tiếp tục chọn Add New để tạo tuyến đường cho WAN 2',
    position: 'bottom',
    condition: function (doc) {
      mkBai5CaiTheoDoi(doc);
      return mkBai5Route1Xong(doc) && !mkBai5Route2Xong(doc) && mkBai5ORoutes(doc);
    }
  },
  {
    selector: '#ftc-mk5-dst, tr:has-text("Dst. Address") input',
    text: 'Bước 39: Nhập Dst. Address: 0.0.0.0/0',
    position: 'right',
    condition: function (doc) {
      mkBai5CaiTheoDoi(doc);
      return mkBai5OHopThoaiTuyen(doc) && mkBai5Route1Xong(doc) && !mkBai5Route2Xong(doc)
        && !mkBai5GwHopLe1(mkBai5GiaTri(doc, 'Gateway'))
        && mkBai5GiaTri(doc, 'Dst. Address') !== '0.0.0.0/0';
    }
  },
  {
    selector: '#ftc-mk5-gw, tr:has-text("Gateway") input',
    text: 'Bước 40: Nhập Gateway: %pppoe-out2',
    position: 'right',
    condition: function (doc) {
      mkBai5CaiTheoDoi(doc);
      return mkBai5OHopThoaiTuyen(doc) && mkBai5Route1Xong(doc) && !mkBai5Route2Xong(doc)
        && mkBai5GiaTri(doc, 'Dst. Address') === '0.0.0.0/0'
        && !mkBai5GwHopLe1(mkBai5GiaTri(doc, 'Gateway'))
        && !mkBai5GwHopLe2(mkBai5GiaTri(doc, 'Gateway'));
    }
  },
  {
    selector: '#ftc-mk5-rt, tr:has-text("Routing Table") select',
    text: 'Bước 41: Chọn Routing Table: ra-wan2',
    position: 'right',
    condition: function (doc) {
      mkBai5CaiTheoDoi(doc);
      return mkBai5OHopThoaiTuyen(doc) && mkBai5Route1Xong(doc) && !mkBai5Route2Xong(doc)
        && mkBai5GiaTri(doc, 'Dst. Address') === '0.0.0.0/0'
        && mkBai5GwHopLe2(mkBai5GiaTri(doc, 'Gateway'))
        && mkBai5GiaTri(doc, 'Routing Table') !== 'ra-wan2';
    }
  },
  {
    selector: 'input[value="Apply"], input[type="button"][value="Apply"], a.button:has-text("Apply"), text:Apply',
    text: 'Bước 42: Nhấn Apply để lưu cấu hình tuyến WAN 2',
    position: 'bottom',
    condition: function (doc) {
      mkBai5CaiTheoDoi(doc);
      return mkBai5OHopThoaiTuyen(doc) && mkBai5Route1Xong(doc) && !mkBai5Route2Xong(doc)
        && mkBai5GiaTri(doc, 'Dst. Address') === '0.0.0.0/0'
        && mkBai5GwHopLe2(mkBai5GiaTri(doc, 'Gateway'))
        && mkBai5GiaTri(doc, 'Routing Table') === 'ra-wan2'
        && !window._FTC_MK5_ROUTE2_APPLIED;
    }
  },
  {
    selector: 'input[value="OK"], input[type="button"][value="OK"], a.button:has-text("OK"), text:OK',
    text: 'Bước 43: Nhấn OK để đóng cửa sổ tuyến WAN 2 và hoàn thành bài tập',
    position: 'bottom',
    condition: function (doc) {
      mkBai5CaiTheoDoi(doc);
      return mkBai5OHopThoaiTuyen(doc) && mkBai5Route1Xong(doc) && !mkBai5Route2Xong(doc)
        && mkBai5GiaTri(doc, 'Dst. Address') === '0.0.0.0/0'
        && mkBai5GwHopLe2(mkBai5GiaTri(doc, 'Gateway'))
        && mkBai5GiaTri(doc, 'Routing Table') === 'ra-wan2'
        && !!window._FTC_MK5_ROUTE2_APPLIED;
    }
  }
];
