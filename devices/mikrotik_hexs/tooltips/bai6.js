/**
 * devices/mikrotik_hexs/tooltips/bai6.js — Tooltip Hướng dẫn Bài 6: Cân bằng tải (Load Balancing) bằng PCC
 *
 * ĐỀ BÀI (anh Huynn chốt 2026-09-20): dùng CẢ HAI đường WAN CÙNG LÚC. Thiết bị
 * thật (router FPT) đang chạy PCC — Per Connection Classifier: mỗi kết nối mới
 * được băm theo cặp (IP nguồn, IP đích) rồi chia 2, dư 0 đi WAN1, dư 1 đi WAN2.
 * Trên máy đã có sẵn bảng to_WAN1/to_WAN2 + tuyến + 4 luật mark routing; hàm đặt
 * lại XOÁ 2 luật PCC gốc (id 8, 9) để học viên TỰ TẠO LẠI đúng y bản gốc:
 *
 *   Luật 1: chain prerouting, In. Interface bridge-LAN, Connection Mark no-mark,
 *           PCC both addresses : 2/0, Dst. Address Type !local,
 *           Action mark connection, New Connection Mark WAN1_conn
 *   Luật 2: y hệt, PCC 2/1, New Connection Mark WAN2_conn
 *   Rồi KÉO cả hai lên TRÊN luật "mark routing" đầu tiên (luật phân loại phải
 *   chạy trước luật gắn bảng định tuyến — thứ tự firewall là nghĩa của cấu hình).
 *
 * 26 BƯỚC — SỐ BƯỚC TĂNG LIÊN TỤC, KHÔNG LẶP (anh Huynn chốt 2026-09-20: lặp số
 * làm học viên nhầm với bước đã làm):
 *   B1  chọn IP            B2  chọn Firewall        B3  chọn thẻ Mangle
 *   Luật 1 (nhóm WAN1) — B4…B14:
 *     B4  Add New              B5  In. Interface → bridge-LAN
 *     B6  Connection Mark (sẵn no-mark)              B7  mở khối Advanced
 *     B8  PCC → both addresses, 2, 0                B9  mở khối Extra
 *     B10 Dst. Address Type → mở khoá, phủ định, thêm mục, local
 *     B11 mở khối Action       B12 Action: mark connection
 *     B13 New Connection Mark: WAN1_conn             B14 OK
 *   Luật 2 (nhóm WAN2) — B15…B25: y hệt, PCC 2/1, WAN2_conn
 *   B26 kéo cả 2 luật PCC lên trên luật mark routing đầu tiên
 *
 * ═══ BỐN CẠM BẪY GIAO DIỆN — ĐO THẬT, tooltip bắt buộc phải dạy ═══
 *  1. Ô TUỲ CHỌN BỊ KHOÁ (nút ▼ bên trái) — giống Bài 7.
 *  2. KHỐI GẬP: General / Advanced / Extra / Action / Statistics. Tiêu đề khối
 *     nằm trong `<thead class="folded">` (KHÔNG phải tbody). PCC ở khối
 *     **Advanced**, Dst. Address Type ở khối **Extra**, Action ở khối **Action**.
 *  3. NÚT PHỦ ĐỊNH `<a class="not">` (ảnh not.svg ↔ not-checked.svg) đứng giữa
 *     nút mở khoá và ô giá trị. Dst. Address Type cần `!local`.
 *  4. DANH SÁCH NHIỀU GIÁ TRỊ: Dst. Address Type sau khi mở khoá vẫn CHƯA có ô
 *     chọn — phải bấm nút ▼ THỨ HAI (thêm mục) thì ô chọn mới xuất hiện.
 *
 * ═══ BẢN ĐỒ HASH ═══  #IP:Firewall → #IP:Firewall.Mangle → #IP:Firewall.Mangle.new
 * Mở menu bên trái KHÔNG đổi hash.
 *
 * `text` PHẢI là chuỗi (app.js: bubble.innerHTML = pop.text) → bước có 2 biến thể
 * tách làm 2 mục. CHỈ gắn id vào phần tử CHƯA có id (memory.md 2.74).
 */

if (!window.TOOLTIPS_MIKROTIK_HEXS) window.TOOLTIPS_MIKROTIK_HEXS = {};

/* ───────────────────────── Nhận diện trạng thái ───────────────────────── */

function mkBai6ManDangNhap(doc) {
  try {
    return !!(doc.querySelector('input#name') && doc.querySelector('input#password'));
  } catch (e) { return false; }
}
function mkBai6Hash(doc) {
  try { const w = doc.defaultView || window; return (w.location && w.location.hash) || ''; }
  catch (e) { return ''; }
}
function mkBai6Hang(doc, nhan) {
  try {
    for (const tr of doc.querySelectorAll('tr')) {
      const lb = tr.querySelector('td.label');
      if (lb && lb.textContent.trim() === nhan) return tr;
    }
  } catch (e) {}
  return null;
}
function mkBai6MenuConHien(doc, ten) {
  try {
    for (const a of doc.querySelectorAll('#menu a, li a')) {
      if (a.closest('.ftc-guide-bubble')) continue;
      if ((a.textContent || '').trim() === ten && a.offsetParent !== null) return true;
    }
  } catch (e) {}
  return false;
}
function mkBai6OFirewall(doc) { return mkBai6Hash(doc) === '#IP:Firewall'; }
function mkBai6OMangle(doc) { return mkBai6Hash(doc) === '#IP:Firewall.Mangle'; }
function mkBai6OHopThoai(doc) { return mkBai6Hash(doc).indexOf('#IP:Firewall.Mangle.') === 0; }

/** Ô đã mở khoá chưa (ô đầu tiên trong hàng không còn disabled)? */
function mkBai6DaMoKhoa(doc, nhan) {
  const tr = mkBai6Hang(doc, nhan);
  if (!tr) return false;
  try {
    const o = tr.querySelector('input, select, textarea');
    // Hàng danh sách nhiều giá trị (Dst. Address Type) khi chưa thêm mục thì
    // không có ô nào — nhận diện qua ảnh nút mở khoá (up.svg = đã mở).
    if (!o) {
      const img = tr.querySelector('a.sbtn img');
      return !!(img && /up\.svg/.test(img.getAttribute('src') || ''));
    }
    return !o.disabled;
  } catch (e) {}
  return false;
}
/** Nút phủ định của hàng đã bật chưa? (ảnh not-checked.svg) */
function mkBai6PhuDinhBat(doc, nhan) {
  const tr = mkBai6Hang(doc, nhan);
  if (!tr) return false;
  try {
    const a = tr.querySelector('a.not, a.not_disabled');
    const img = a && a.querySelector('img');
    return !!(img && /not-checked\.svg/.test(img.getAttribute('src') || ''));
  } catch (e) {}
  return false;
}
/** Giá trị ô thứ `thu` của hàng. */
function mkBai6GiaTri(doc, nhan, thu) {
  const tr = mkBai6Hang(doc, nhan);
  if (!tr) return null;
  try {
    const o = tr.querySelectorAll('input, select, textarea')[thu || 0];
    if (!o) return null;
    if (o.tagName === 'SELECT') { const op = o.options[o.selectedIndex]; return op ? op.text.trim() : ''; }
    return (o.value || '').trim();
  } catch (e) {}
  return null;
}
/**
 * Ô COMBO (select + ô nhập cạnh nhau: Connection Mark, New Connection Mark).
 * ĐO THẬT 2026-09-20: chọn một mục trong select thì WebFig CHÉP chữ sang ô
 * nhập rồi XOÁ chọn của select (selectedIndex = -1). Ở hộp thoại mở lần đầu
 * select có sẵn 'no-mark', nhưng từ hộp thoại thứ hai select trống. Vậy giá
 * trị THẬT = ô nhập nếu có chữ, không thì lấy select.
 */
function mkBai6Combo(doc, nhan) {
  const t = mkBai6GiaTri(doc, nhan, 1);
  if (t) return t;
  const s = mkBai6GiaTri(doc, nhan, 0);
  return s || '';
}
/** Khối (thead) mang tên `ten` đang gập không? */
function mkBai6KhoiGap(doc, ten) {
  try {
    for (const td of doc.querySelectorAll('td.sep')) {
      if (td.textContent.trim() !== ten) continue;
      const kh = td.closest('thead');
      return !!(kh && kh.classList.contains('folded'));
    }
  } catch (e) {}
  return false;
}
/** Hàng mang nhãn đang nhìn thấy không? */
function mkBai6HangHien(doc, nhan) {
  const tr = mkBai6Hang(doc, nhan);
  try { return !!(tr && tr.offsetParent !== null); } catch (e) { return false; }
}

/* ───────── Đọc danh sách Mangle (trang danh sách) ───────── */

/** Các dòng luật: {vt, action, chain, inIf}. Cột đo thật: [2]=#, [4]=Action, [5]=Chain, [14]=In. Interface */
function mkBai6CacLuat(doc) {
  const ds = [];
  try {
    for (const tr of doc.querySelectorAll('tr')) {
      if (tr.querySelector('th')) continue;
      const tds = tr.querySelectorAll('td');
      if (tds.length < 20) continue;
      ds.push({ vt: parseInt(tds[2].textContent.trim(), 10),
                action: tds[4].textContent.trim(), chain: tds[5].textContent.trim(),
                inIf: tds[14].textContent.trim(), tr: tr });
    }
  } catch (e) {}
  return ds;
}
/** Luật PCC của học viên = mark connection trên bridge-LAN (2 luật gốc đã bị xoá lúc đặt lại). */
function mkBai6LuatPCC(ds) {
  return ds.filter(function (l) { return l.action === 'mark connection' && l.inIf === 'bridge-LAN'; });
}
/** Luật mark routing trên bridge-LAN (có sẵn) — luật PCC phải nằm TRÊN luật này. */
function mkBai6LuatMarkRouting(ds) {
  return ds.filter(function (l) { return l.action === 'mark routing' && l.inIf === 'bridge-LAN'; });
}

/* ─────────── Gắn ID + ghi nhớ tiến độ (chạy mỗi 500ms) ─────────── */

function mkBai6DatId(el, id) { try { if (el && !el.id) el.id = id; } catch (e) {} }

function mkBai6GanTheoNhan(doc, nhan, tienTo) {
  const tr = mkBai6Hang(doc, nhan);
  if (!tr) return;
  try {
    mkBai6DatId(tr.querySelector('a.sbtn'), tienTo + '-nut');            // nút mở khoá (▼ đầu tiên)
    mkBai6DatId(tr.querySelector('a.not, a.not_disabled'), tienTo + '-not');
    const os = tr.querySelectorAll('input, select, textarea');
    if (os[0]) mkBai6DatId(os[0], tienTo);
    if (os[1]) mkBai6DatId(os[1], tienTo + '-2');
    if (os[2]) mkBai6DatId(os[2], tienTo + '-3');
    const nuts = tr.querySelectorAll('a.sbtn');
    if (nuts.length >= 2) mkBai6DatId(nuts[nuts.length - 1], tienTo + '-them'); // ▼ thêm mục (danh sách)
  } catch (e) {}
}

function mkBai6CaiTheoDoi(doc) {
  try {
    mkBai6GanTheoNhan(doc, 'In. Interface', 'ftc-mk6-inif');
    mkBai6GanTheoNhan(doc, 'Connection Mark', 'ftc-mk6-cm');
    mkBai6GanTheoNhan(doc, 'Per Connection Classifier', 'ftc-mk6-pcc');
    mkBai6GanTheoNhan(doc, 'Dst. Address Type', 'ftc-mk6-dat');
    mkBai6GanTheoNhan(doc, 'Action', 'ftc-mk6-action');
    mkBai6GanTheoNhan(doc, 'New Connection Mark', 'ftc-mk6-ncm');
    // Tiêu đề các khối — mượn <span> có sẵn trong td.sep (không bọc lại: ô còn <img>)
    for (const td of doc.querySelectorAll('td.sep')) {
      const t = td.textContent.trim();
      if (t === 'Advanced') mkBai6DatId(td.querySelector('span'), 'ftc-mk6-sep-advanced');
      else if (t === 'Extra') mkBai6DatId(td.querySelector('span'), 'ftc-mk6-sep-extra');
      else if (t === 'Action') mkBai6DatId(td.querySelector('span'), 'ftc-mk6-sep-action');
    }
    // Thẻ Mangle trên trang Firewall — dò chặt, không đụng nút "WebFig" (memory.md 2.74)
    for (const a of doc.querySelectorAll('a[href]')) {
      if (a.id) continue;
      if (a.getAttribute('href') === '#IP:Firewall.Mangle' && (a.textContent || '').trim() === 'Mangle') {
        a.id = 'ftc-mk6-the-mangle'; break;
      }
    }
    // Trang danh sách: đánh dấu luật PCC của học viên đang nằm SAI CHỖ (dưới luật mark routing)
    if (mkBai6OMangle(doc)) {
      const ds = mkBai6CacLuat(doc);
      const pcc = mkBai6LuatPCC(ds), mr = mkBai6LuatMarkRouting(ds);
      window._FTC_MK6_SO_PCC = pcc.length;
      const mocMR = mr.length ? Math.min.apply(null, mr.map(function (l) { return l.vt; })) : -1;
      window._FTC_MK6_SAI_CHO = (mocMR >= 0) ? pcc.filter(function (l) { return l.vt > mocMR; }).length : 0;
      const cu = doc.getElementById('ftc-mk6-luat-sai-cho');
      let dich = null;
      for (const l of pcc) { if (mocMR >= 0 && l.vt > mocMR) { dich = l.tr.querySelectorAll('td')[4]; break; } }
      if (cu && cu !== dich) cu.id = '';
      if (dich && !dich.id) dich.id = 'ftc-mk6-luat-sai-cho';
    }
  } catch (e) {}
}
function mkBai6Nhip(doc) { mkBai6CaiTheoDoi(doc); }

/** Đang làm luật thứ mấy (0 hoặc 1)? Nhớ từ lần cuối ở trang danh sách. */
function mkBai6ChiSoLuat() { return Math.min(window._FTC_MK6_SO_PCC || 0, 1); }
function mkBai6XongHaiLuat() { return (window._FTC_MK6_SO_PCC || 0) >= 2; }
function mkBai6XongSapXep() { return mkBai6XongHaiLuat() && (window._FTC_MK6_SAI_CHO || 0) === 0; }

/* ───────── Dựng tooltip cho TỪNG LUẬT với SỐ BƯỚC TĂNG LIÊN TỤC ───────── */

/**
 * Anh Huynn chốt (2026-09-20): số bước KHÔNG lặp lại. Luật 1 = Bước 4–14,
 * luật 2 = Bước 15–25, kéo thả = Bước 26. Lặp lại số (như "Bước 4" xuất hiện
 * hai lần) làm học viên nhầm với bước đã làm.
 *
 * Mỗi luật có 11 bước gốc (0..10); số bước thật = 4 + i*11 + gốc.
 * `text` PHẢI là chuỗi nên mỗi luật sinh ra một bộ tooltip riêng.
 */
var MK_BAI6_BUOC_MOI_LUAT = 11;
function mkBai6SoBuoc(i, goc) { return 4 + i * MK_BAI6_BUOC_MOI_LUAT + goc; }
var MK_BAI6_BUOC_KEO = mkBai6SoBuoc(2, 0);   // = 26

function mkBai6TooltipChoLuat(i) {
  const du = String(i), mark = i === 0 ? 'WAN1_conn' : 'WAN2_conn';
  const B = function (goc) { return 'Bước ' + mkBai6SoBuoc(i, goc) + ': '; };
  const dangLuatNay = function () { return mkBai6ChiSoLuat() === i; };
  const pccDung = function (doc) {
    return mkBai6GiaTri(doc, 'Per Connection Classifier', 0) === 'both addresses'
      && mkBai6GiaTri(doc, 'Per Connection Classifier', 1) === '2'
      && mkBai6GiaTri(doc, 'Per Connection Classifier', 2) === du;
  };
  return [
    // ── Add New (trang danh sách) ──
    { selector: 'text:Add New',
      text: B(0) + 'chọn Add New<br>(tạo luật PCC thứ ' + (i + 1) + '/2 — nhóm WAN' + (i + 1) + ')',
      position: 'bottom',
      condition: function (doc) { mkBai6Nhip(doc); return mkBai6OMangle(doc) && (window._FTC_MK6_SO_PCC || 0) === i; } },

    // ── In. Interface ──
    { selector: '#ftc-mk6-inif-nut', text: B(1) + 'bấm nút này để mở ô In. Interface', position: 'right',
      condition: function (doc) { mkBai6Nhip(doc); return dangLuatNay() && mkBai6OHopThoai(doc) && !mkBai6DaMoKhoa(doc, 'In. Interface'); } },
    { selector: '#ftc-mk6-inif', text: B(1) + 'chọn bridge-LAN<br>(lưu lượng đi từ mạng LAN ra)', position: 'right',
      condition: function (doc) {
        mkBai6Nhip(doc);
        return dangLuatNay() && mkBai6OHopThoai(doc) && mkBai6DaMoKhoa(doc, 'In. Interface')
          && mkBai6GiaTri(doc, 'In. Interface', 0) !== 'bridge-LAN';
      } },

    // ── Connection Mark (sẵn no-mark) ──
    { selector: '#ftc-mk6-cm-nut',
      text: B(2) + 'bấm nút này để mở ô Connection Mark<br>(giá trị sẵn có đã là no-mark —<br>chỉ phân loại kết nối CHƯA được gắn nhãn)',
      position: 'right',
      condition: function (doc) {
        mkBai6Nhip(doc);
        return dangLuatNay() && mkBai6OHopThoai(doc) && mkBai6GiaTri(doc, 'In. Interface', 0) === 'bridge-LAN'
          && !mkBai6DaMoKhoa(doc, 'Connection Mark');
      } },
    { selector: '#ftc-mk6-cm', text: B(2) + 'chọn lại no-mark', position: 'right',
      condition: function (doc) {
        mkBai6Nhip(doc);
        return dangLuatNay() && mkBai6OHopThoai(doc) && mkBai6DaMoKhoa(doc, 'Connection Mark')
          && mkBai6Combo(doc, 'Connection Mark') !== 'no-mark';
      } },

    // ── mở khối Advanced ──
    { selector: '#ftc-mk6-sep-advanced', text: B(3) + 'bấm vào dòng Advanced<br>để mở khối này ra', position: 'right',
      condition: function (doc) {
        mkBai6Nhip(doc);
        return dangLuatNay() && mkBai6OHopThoai(doc) && mkBai6DaMoKhoa(doc, 'Connection Mark')
          && mkBai6Combo(doc, 'Connection Mark') === 'no-mark' && mkBai6KhoiGap(doc, 'Advanced');
      } },

    // ── PCC ──
    { selector: '#ftc-mk6-pcc-nut', text: B(4) + 'bấm nút này để mở ô<br>Per Connection Classifier', position: 'right',
      condition: function (doc) {
        mkBai6Nhip(doc);
        return dangLuatNay() && mkBai6OHopThoai(doc) && mkBai6HangHien(doc, 'Per Connection Classifier')
          && mkBai6Combo(doc, 'Connection Mark') === 'no-mark' && !mkBai6DaMoKhoa(doc, 'Per Connection Classifier');
      } },
    // Đặt 'top' — 'right' sẽ che ô nhập mẫu số ("2") ngay bên phải ô chọn (anh Huynn góp ý).
    { selector: '#ftc-mk6-pcc',
      text: B(4) + 'chọn both addresses, nhập 2 và ' + du + '<br>('
        + (i === 0 ? 'băm theo IP nguồn + IP đích, chia 2, lấy phần DƯ 0' : 'chia 2, lấy phần DƯ 1 — nửa kết nối còn lại') + ')',
      position: 'top',
      condition: function (doc) {
        mkBai6Nhip(doc);
        return dangLuatNay() && mkBai6OHopThoai(doc) && mkBai6DaMoKhoa(doc, 'Per Connection Classifier') && !pccDung(doc);
      } },

    // ── mở khối Extra ──
    { selector: '#ftc-mk6-sep-extra', text: B(5) + 'bấm vào dòng Extra<br>để mở khối này ra', position: 'right',
      condition: function (doc) {
        mkBai6Nhip(doc);
        return dangLuatNay() && mkBai6OHopThoai(doc) && mkBai6DaMoKhoa(doc, 'Per Connection Classifier')
          && pccDung(doc) && mkBai6KhoiGap(doc, 'Extra');
      } },

    // ── Dst. Address Type = !local (4 tooltip nối tiếp, cùng số bước) ──
    { selector: '#ftc-mk6-dat-nut', text: B(6) + 'bấm nút này để mở ô Dst. Address Type', position: 'right',
      condition: function (doc) {
        mkBai6Nhip(doc);
        return dangLuatNay() && mkBai6OHopThoai(doc) && mkBai6HangHien(doc, 'Dst. Address Type')
          && mkBai6DaMoKhoa(doc, 'Per Connection Classifier') && !mkBai6DaMoKhoa(doc, 'Dst. Address Type');
      } },
    { selector: '#ftc-mk6-dat-not',
      text: B(6) + 'bấm nút phủ định này<br>(để thành "KHÔNG phải local" —<br>không cân bằng tải lưu lượng gửi tới chính router)',
      position: 'right',
      condition: function (doc) {
        mkBai6Nhip(doc);
        return dangLuatNay() && mkBai6OHopThoai(doc) && mkBai6DaMoKhoa(doc, 'Dst. Address Type')
          && !mkBai6PhuDinhBat(doc, 'Dst. Address Type');
      } },
    { selector: '#ftc-mk6-dat-them', text: B(6) + 'bấm nút này để thêm một mục', position: 'right',
      condition: function (doc) {
        mkBai6Nhip(doc);
        return dangLuatNay() && mkBai6OHopThoai(doc) && mkBai6DaMoKhoa(doc, 'Dst. Address Type')
          && mkBai6PhuDinhBat(doc, 'Dst. Address Type') && mkBai6GiaTri(doc, 'Dst. Address Type', 0) === null;
      } },
    { selector: '#ftc-mk6-dat', text: B(6) + 'chọn local', position: 'right',
      condition: function (doc) {
        mkBai6Nhip(doc);
        return dangLuatNay() && mkBai6OHopThoai(doc) && mkBai6PhuDinhBat(doc, 'Dst. Address Type')
          && mkBai6GiaTri(doc, 'Dst. Address Type', 0) !== null
          && mkBai6GiaTri(doc, 'Dst. Address Type', 0) !== 'local';
      } },

    // ── mở khối Action ──
    { selector: '#ftc-mk6-sep-action', text: B(7) + 'bấm vào dòng Action<br>để mở khối này ra', position: 'right',
      condition: function (doc) {
        mkBai6Nhip(doc);
        return dangLuatNay() && mkBai6OHopThoai(doc) && mkBai6PhuDinhBat(doc, 'Dst. Address Type')
          && mkBai6GiaTri(doc, 'Dst. Address Type', 0) === 'local' && mkBai6KhoiGap(doc, 'Action');
      } },
    // ── Action ──
    { selector: '#ftc-mk6-action', text: B(8) + 'chọn Action: mark connection', position: 'right',
      condition: function (doc) {
        mkBai6Nhip(doc);
        return dangLuatNay() && mkBai6OHopThoai(doc) && mkBai6HangHien(doc, 'Action')
          && mkBai6GiaTri(doc, 'Dst. Address Type', 0) === 'local'
          && mkBai6GiaTri(doc, 'Action', 0) !== 'mark connection';
      } },
    // ── New Connection Mark ──
    { selector: '#ftc-mk6-ncm', text: B(9) + 'chọn New Connection Mark: ' + mark, position: 'right',
      condition: function (doc) {
        mkBai6Nhip(doc);
        return dangLuatNay() && mkBai6OHopThoai(doc)
          && mkBai6GiaTri(doc, 'Action', 0) === 'mark connection'
          && mkBai6Combo(doc, 'New Connection Mark') !== mark;
      } },
    // ── OK ──
    { selector: 'text:OK', text: B(10) + 'chọn OK để lưu', position: 'left',
      condition: function (doc) {
        mkBai6Nhip(doc);
        return dangLuatNay() && mkBai6OHopThoai(doc)
          && mkBai6GiaTri(doc, 'Action', 0) === 'mark connection'
          && mkBai6Combo(doc, 'New Connection Mark') === mark;
      } }
  ];
}

/* ──────────────────────────── Danh sách tooltip ──────────────────────── */

window.TOOLTIPS_MIKROTIK_HEXS['mikrotik_hexs-bai6'] = [
  { selector: 'input#name', text: 'Nhập admin', position: 'right',
    condition: function (doc) { return mkBai6ManDangNhap(doc); } },
  { selector: 'input[value="Login"], input[type="button"][value="Login"]', text: 'Nhập admin', position: 'right',
    condition: function (doc) { return mkBai6ManDangNhap(doc); } },

  // ── Điều hướng ──
  { selector: 'li#IP span, text:IP', text: 'Bước 1: chọn IP', position: 'right',
    condition: function (doc) {
      mkBai6Nhip(doc);
      return !mkBai6ManDangNhap(doc) && !mkBai6XongSapXep()
        && !mkBai6MenuConHien(doc, 'Firewall')
        && !mkBai6OFirewall(doc) && !mkBai6OMangle(doc) && !mkBai6OHopThoai(doc);
    } },
  { selector: '#id_IP\\:Firewall, text:Firewall', text: 'Bước 2: chọn Firewall', position: 'right',
    condition: function (doc) {
      mkBai6Nhip(doc);
      return !mkBai6ManDangNhap(doc) && !mkBai6XongSapXep() && mkBai6MenuConHien(doc, 'Firewall')
        && !mkBai6OFirewall(doc) && !mkBai6OMangle(doc) && !mkBai6OHopThoai(doc);
    } },
  { selector: '#ftc-mk6-the-mangle', text: 'Bước 3: chọn thẻ Mangle', position: 'bottom',
    condition: function (doc) { mkBai6Nhip(doc); return mkBai6OFirewall(doc); } }
]
  .concat(mkBai6TooltipChoLuat(0))     // Bước 4–14
  .concat(mkBai6TooltipChoLuat(1))     // Bước 15–25
  .concat([
    // ── Bước 26: kéo luật lên trên luật mark routing ──
    // ĐO THẬT: WebFig chèn luật NGAY DƯỚI hàng mà ta thả vào (moveObjectAfter).
    // Thả vào chính luật mark routing thì luật vẫn nằm DƯỚI -> phải thả vào
    // hàng ngay phía trên. Tooltip nói rõ cơ chế đó để học viên không kéo mãi.
    { selector: '#ftc-mk6-luat-sai-cho',
      text: 'Bước ' + MK_BAI6_BUOC_KEO + ': giữ chuột kéo luật này lên, thả vào<br>hàng NGAY TRÊN luật "mark routing" đầu tiên<br>(luật sẽ được chèn ngay dưới hàng bạn thả vào;<br>luật phân loại phải chạy trước luật chọn đường)',
      position: 'right',
      condition: function (doc) {
        mkBai6Nhip(doc);
        return mkBai6OMangle(doc) && mkBai6XongHaiLuat() && (window._FTC_MK6_SAI_CHO || 0) > 0;
      } }
  ]);
