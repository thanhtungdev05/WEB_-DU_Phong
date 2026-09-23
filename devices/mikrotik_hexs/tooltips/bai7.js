/**
 * devices/mikrotik_hexs/tooltips/bai7.js — Tooltip Hướng dẫn Bài 7: Cấu hình Policy Routing
 *
 * ĐỀ BÀI (anh Huynn chốt 2026-09-20): thiết bị ảo không nối ISP thật nên GIẢ ĐỊNH
 * hai nhà mạng — ISP1 = FPT (IP WAN 1.1.1.1) và ISP2 = VNPT (IP WAN 2.2.2.2).
 * Tạo 2 bảng định tuyến + 2 tuyến mặc định, rồi ép toàn bộ lưu lượng LAN
 * 192.168.1.0/24 đi ra hướng FPT.
 *
 * 23 BƯỚC. Số bước LẶP LẠI cho mục thứ hai (bảng ISP2, tuyến 2.2.2.2) — chỉ đổi
 * giá trị trong chữ tooltip, nên mỗi bước có biến thể được tách thành HAI mục
 * với điều kiện loại trừ nhau:
 *   A. Routing > Tables        B1  chọn Routing
 *                              B2  chọn Tables
 *                              B3  chọn Add New
 *                              B4  nhập Comment/Name + tích FIB  (FPT-ISP1 → VNPT-ISP2)
 *                              B5  chọn OK để lưu
 *   B. IP > Routes             B6  chọn IP
 *                              B7  chọn Routes
 *                              B8  chọn Add New
 *                              B9  nhập Dst. Address 0.0.0.0/0
 *                              B10 nhập Gateway                  (1.1.1.1 → 2.2.2.2)
 *                              B11 mở khoá Check Gateway → ping
 *                              B12 mở khoá Distance → 1
 *                              B13 chọn Routing Table            (ISP1 → ISP2)
 *                              B14 chọn OK để lưu
 *   C. IP > Firewall > Mangle  B15 chọn IP
 *                              B16 chọn Firewall
 *                              B17 chọn thẻ Mangle
 *                              B18 chọn Add New
 *                              B19 mở khoá Src. Address → 192.168.1.0/24
 *                              B20 mở khối Action
 *                              B21 chọn Action = mark routing
 *                              B22 chọn New Routing Mark = ISP1
 *                              B23 chọn OK để lưu
 *
 * ═══ HAI CẠM BẪY GIAO DIỆN — ĐO THẬT 2026-09-20, tooltip BẮT BUỘC phải dạy ═══
 *  1. Ô TUỲ CHỌN BỊ KHOÁ: `Check Gateway`, `Distance` (hộp thoại Route) và
 *     `Src. Address` (hộp thoại Mangle) hiện ra dạng `<select|input disabled>`
 *     kèm một nút `<a class="sbtn"><img src="down.svg"></a>` bên trái. PHẢI bấm
 *     nút đó (ảnh đổi thành `up.svg`) thì ô mới bật lên nhập/chọn được. Không
 *     dạy bước này thì học viên đứng hình, tưởng giao diện hỏng.
 *  2. KHỐI GẬP: hộp thoại Mangle chia thành các khối General / Advanced / Extra /
 *     Action / Statistics bằng hàng tiêu đề `<td class="sep">`. Khối **Action**
 *     mặc định BỊ GẬP (`<tbody class="folded">`) nên ô Action và New Routing Mark
 *     không nhìn thấy — phải bấm tiêu đề "Action" để mở ra. Đây chính là cái anh
 *     Huynn gọi là "thẻ Action" trong kịch bản.
 *
 * ═══ BẢN ĐỒ HASH (đo thật) — nhận diện trạng thái, chắc hơn dò chữ ═══
 *   #Interface                  vừa đăng nhập xong
 *   #Routing:Tables             danh sách bảng định tuyến
 *   #Routing:Tables.Tables.new  hộp thoại thêm bảng
 *   #IP:Routes                  danh sách tuyến
 *   #IP:Routes.Routes.new       hộp thoại thêm tuyến
 *   #IP:Firewall                trang Firewall (đang ở thẻ Filter Rules)
 *   #IP:Firewall.Mangle         thẻ Mangle
 *   #IP:Firewall.Mangle.new     hộp thoại thêm luật Mangle
 * LƯU Ý: MỞ MENU bên trái KHÔNG đổi hash (vẫn `#Interface`) — nên bước 2/7/16
 * phải dò theo menu con đang hiện, không dò theo hash.
 *
 * ═══ LƯU Ý KỸ THUẬT ═══
 *  - `text` PHẢI là chuỗi: app.js làm `bubble.innerHTML = pop.text`. Truyền hàm
 *    vào là màn hình in ra mã nguồn của hàm. Vì vậy các bước có 2 biến thể
 *    (ISP1/ISP2) được tách làm 2 mục, điều kiện loại trừ nhau.
 *  - Gắn ID theo NHÃN của hàng, KHÔNG theo vị trí: WebFig dựng lại bảng sau mỗi
 *    thao tác nên bám chỉ số là sai (đã trả giá ở Bài 5 — xem memory.md 2.71).
 */

if (!window.TOOLTIPS_MIKROTIK_HEXS) window.TOOLTIPS_MIKROTIK_HEXS = {};

/* ───────────────────────── Nhận diện trạng thái ───────────────────────── */

function mkBai7ManDangNhap(doc) {
  try {
    return !!(doc.querySelector('input#name') && doc.querySelector('input#password'));
  } catch (e) { return false; }
}

function mkBai7Hash(doc) {
  try {
    const w = doc.defaultView || window;
    return (w.location && w.location.hash) || '';
  } catch (e) { return ''; }
}

/** Hàng <tr> theo nhãn chữ ở cột trái (khớp CHÍNH XÁC để không nhầm nhãn con). */
function mkBai7Hang(doc, nhan) {
  try {
    for (const tr of doc.querySelectorAll('tr')) {
      const lb = tr.querySelector('td.label');
      if (lb && lb.textContent.trim() === nhan) return tr;
    }
  } catch (e) {}
  return null;
}

/** Có mục menu con tên `ten` đang hiện bên trái không? */
function mkBai7MenuConHien(doc, ten) {
  try {
    for (const a of doc.querySelectorAll('#menu a, li a')) {
      if (a.closest('.ftc-guide-bubble')) continue;
      if ((a.textContent || '').trim() === ten && a.offsetParent !== null) return true;
    }
  } catch (e) {}
  return false;
}

/** Tên các bảng định tuyến đang có (cột Name, chỉ số 3 — đo thật). */
function mkBai7TenCacBang(doc) {
  const ds = [];
  try {
    for (const tr of doc.querySelectorAll('tr')) {
      const tds = tr.querySelectorAll('td');
      if (tds.length > 3) {
        const t = (tds[3].textContent || '').trim();
        if (t) ds.push(t);
      }
    }
  } catch (e) {}
  return ds;
}

/**
 * BỐN tuyến phải tạo, THEO ĐÚNG THỨ TỰ làm bài.
 *
 * VÌ SAO MỖI BẢNG CÓ HAI TUYẾN (anh Huynn hỏi 2026-09-20 — xem memory.md 2.76):
 * `Distance` chỉ so sánh giữa các tuyến NẰM TRONG CÙNG MỘT BẢNG. Đặt distance
 * khác nhau ở hai bảng khác nhau thì KHÔNG tạo ra ưu tiên gì cả. Muốn thấy rõ
 * "ưu tiên FPT, FPT chết thì rớt sang VNPT" thì phải để CẢ HAI gateway trong
 * CÙNG một bảng với distance khác nhau — đúng như cấu hình thật của chính
 * thiết bị này (bảng `to_WAN1` = pppoe-out1 d1 + pppoe-out2 d2).
 * Nhờ vậy bước `Check Gateway = ping` mới có ý nghĩa: nó là thứ phát hiện
 * gateway chết để rớt sang tuyến dự phòng.
 */
var MK_BAI7_TUYEN = [
  { bang: 'ISP1', gw: '1.1.1.1', dist: '1', vaiTro: 'đường chính của bảng ISP1' },
  { bang: 'ISP1', gw: '2.2.2.2', dist: '2', vaiTro: 'đường dự phòng của bảng ISP1' },
  { bang: 'ISP2', gw: '2.2.2.2', dist: '1', vaiTro: 'đường chính của bảng ISP2' },
  { bang: 'ISP2', gw: '1.1.1.1', dist: '2', vaiTro: 'đường dự phòng của bảng ISP2' }
];

/** Các tuyến đang có, đủ cặp (bảng, gateway). Cột: tds[4]=Gateway, tds[6]=Routing Table. */
function mkBai7CacTuyenDayDu(doc) {
  const ds = [];
  try {
    for (const tr of doc.querySelectorAll('tr')) {
      if (tr.querySelector('th')) continue;
      const tds = tr.querySelectorAll('td');
      if (tds.length >= 9) {
        const gw = (tds[4].textContent || '').trim();
        const bang = (tds[6].textContent || '').trim();
        if (gw) ds.push({ gw: gw, bang: bang });
      }
    }
  } catch (e) {}
  return ds;
}

/** Đang làm tuyến thứ mấy (0..3)? Trả 4 nghĩa là xong cả 4. */
function mkBai7ChiSoTuyen() {
  const xong = window._FTC_MK7_TUYEN_XONG || [];
  for (let i = 0; i < MK_BAI7_TUYEN.length; i++) {
    if (!xong[i]) return i;
  }
  return MK_BAI7_TUYEN.length;
}
function mkBai7TuyenDangLam() {
  const i = mkBai7ChiSoTuyen();
  return i < MK_BAI7_TUYEN.length ? MK_BAI7_TUYEN[i] : null;
}
function mkBai7XongHetTuyen() { return mkBai7ChiSoTuyen() >= MK_BAI7_TUYEN.length; }

/** Gateway của các tuyến đang có (cột Gateway, chỉ số 4 — đo thật). */
function mkBai7CacGateway(doc) {
  const ds = [];
  try {
    for (const tr of doc.querySelectorAll('tr')) {
      const tds = tr.querySelectorAll('td');
      if (tds.length > 4) {
        const t = (tds[4].textContent || '').trim();
        if (t) ds.push(t);
      }
    }
  } catch (e) {}
  return ds;
}

/* Trạng thái từng trang */
function mkBai7OTables(doc) { return mkBai7Hash(doc) === '#Routing:Tables'; }
function mkBai7OHopThoaiBang(doc) { return mkBai7Hash(doc).indexOf('#Routing:Tables.') === 0; }
function mkBai7ORoutes(doc) { return mkBai7Hash(doc) === '#IP:Routes'; }
function mkBai7OHopThoaiTuyen(doc) { return mkBai7Hash(doc).indexOf('#IP:Routes.') === 0; }
function mkBai7OFirewall(doc) { return mkBai7Hash(doc) === '#IP:Firewall'; }
function mkBai7OMangle(doc) { return mkBai7Hash(doc) === '#IP:Firewall.Mangle'; }
function mkBai7OHopThoaiMangle(doc) { return mkBai7Hash(doc).indexOf('#IP:Firewall.Mangle.') === 0; }

/* ─────────── Gắn ID cho các phần tử cần trỏ tooltip vào ─────────── */

/**
 * ⚠️ QUY TẮC BẤT BIẾN — LỖI ĐÃ TRẢ GIÁ (2026-09-20):
 * CHỈ gắn id vào phần tử ĐANG KHÔNG CÓ id. TUYỆT ĐỐI không ghi đè id sẵn có,
 * vì đó là id của WebFig và WebFig tra cứu ngược lại bằng chính id đó.
 *
 * Chuyện đã xảy ra: trên trang Mangle, WebFig gán cho **nút "WebFig" ở thanh
 * trên** (`id="id_WebFig"`) thuộc tính `href = "#IP:Firewall.Mangle"`. Bộ dò
 * `a[href*="Firewall.Mangle"]` của bản đầu bắt trúng NÓ (đứng trước thẻ Mangle
 * thật trong DOM) và ghi đè id thành `ftc-mk7-the-mangle`. Ngay sau đó chính
 * WebFig chạy:
 *     if (hasMenu(cont)) { document.getElementById('id_WebFig').href = url; }
 * → trả về null → `TypeError: Cannot set properties of null (setting 'href')`
 * → mọi hộp thoại trên trang đó KHÔNG VẼ RA NỮA (bấm Add New chỉ đổi hash,
 * màn hình trống). Lỗi xảy ra ở CẢ chế độ Thực hành vì `onSimLoad` chạy ở cả
 * hai chế độ — nên trông như "thiết bị hỏng", rất dễ đổ oan cho máy chủ.
 */
function mkBai7DatId(el, id) {
  try {
    if (el && !el.id) el.id = id;
  } catch (e) {}
}

function mkBai7GanIdTheoNhan(doc, nhan, idO, idNut) {
  const tr = mkBai7Hang(doc, nhan);
  if (!tr) return;
  try {
    if (idO) mkBai7DatId(tr.querySelector('input, select, textarea'), idO);
    if (idNut) mkBai7DatId(tr.querySelector('a.sbtn'), idNut);
  } catch (e) {}
}

/**
 * Bọc RIÊNG phần chữ của một ô vào `<span>` để tooltip neo đúng vào CHỮ.
 *
 * VÌ SAO CẦN (anh Huynn góp ý 2026-09-20, đã đo lại):
 *  - Ô nhãn `Comment` rộng 144px nhưng chữ chỉ 59px và canh phải → neo vào cả ô
 *    thì bong bóng lệch khỏi chữ.
 *  - Hàng tiêu đề khối `Action` là `<td class="sep" colspan="20">` rộng **700px**
 *    → neo vào cả ô thì bong bóng văng ra tận mép phải, xa chữ "Action".
 *    (Đúng vết xe đã đổ ở Bài 4: neo vào cả `<tr>` làm tooltip bay ra mép màn
 *    hình — xem memory.md mục 2.61.)
 *  `<span>` co đúng bằng bề rộng chữ nên neo vào nó là trỏ trúng chữ.
 *
 * AN TOÀN: chỉ bọc khi ô CHỈ CHỨA CHỮ (không có ô nhập/nút/ảnh bên trong) để
 * không phá cấu trúc DOM của WebFig. `textContent` giữ nguyên nên mọi phép dò
 * theo chữ (kể cả của WebFig) vẫn đúng; click vào span vẫn nổi bọt lên ô cha
 * nên nút gập/mở khối `Action` vẫn bấm được như thường.
 */
function mkBai7BocChu(doc, el, id) {
  if (!el) return null;
  try {
    for (const c of el.children) {
      if (c.id === id) return c;          // đã bọc rồi
    }
    if (el.querySelector('input, select, textarea, a, img')) return null;
    const chu = (el.textContent || '').trim();
    if (!chu) return null;
    const sp = doc.createElement('span');
    sp.id = id;
    sp.textContent = chu;
    el.textContent = '';
    el.appendChild(sp);
    return sp;
  } catch (e) {}
  return null;
}

function mkBai7CaiTheoDoi(doc) {
  try {
    // Hộp thoại thêm BẢNG định tuyến
    mkBai7GanIdTheoNhan(doc, 'Comment', 'ftc-mk7-cmt');
    mkBai7GanIdTheoNhan(doc, 'Name', 'ftc-mk7-name');
    mkBai7GanIdTheoNhan(doc, 'FIB', 'ftc-mk7-fib');
    // Hộp thoại thêm TUYẾN
    mkBai7GanIdTheoNhan(doc, 'Dst. Address', 'ftc-mk7-dst');
    mkBai7GanIdTheoNhan(doc, 'Gateway', 'ftc-mk7-gw');
    mkBai7GanIdTheoNhan(doc, 'Check Gateway', 'ftc-mk7-cg', 'ftc-mk7-cg-nut');
    mkBai7GanIdTheoNhan(doc, 'Distance', 'ftc-mk7-dist', 'ftc-mk7-dist-nut');
    mkBai7GanIdTheoNhan(doc, 'Routing Table', 'ftc-mk7-rt');
    // Hộp thoại thêm luật MANGLE
    mkBai7GanIdTheoNhan(doc, 'Src. Address', 'ftc-mk7-src', 'ftc-mk7-src-nut');
    mkBai7GanIdTheoNhan(doc, 'Action', 'ftc-mk7-action');
    mkBai7GanIdTheoNhan(doc, 'New Routing Mark', 'ftc-mk7-mark');
    // Chữ "Comment" ở cột nhãn (hộp thoại thêm BẢNG) — tooltip Bước 4 trỏ vào
    // CHỮ này, không trỏ vào ô nhập, theo yêu cầu của anh Huynn.
    const trCmt = mkBai7Hang(doc, 'Comment');
    if (trCmt) mkBai7BocChu(doc, trCmt.querySelector('td.label'), 'ftc-mk7-cmt-nhan');

    // Hàng tiêu đề của khối "Action" (khối đang bị gập).
    // ĐO THẬT: ô này có sẵn cấu trúc `<div><img src="down.svg"> <span>Action</span></div>`
    // — tức WebFig ĐÃ bọc chữ trong `<span>` rồi, và span đó CHƯA có id. Vậy
    // chỉ cần mượn span có sẵn, KHÔNG cần (và không được) bọc lại: ô còn chứa
    // `<img>` mũi tên gập/mở nên `mkBai7BocChu` sẽ từ chối, mà bọc ép thì mất
    // luôn mũi tên đó.
    for (const td of doc.querySelectorAll('td.sep')) {
      if (td.textContent.trim() === 'Action') {
        mkBai7DatId(td, 'ftc-mk7-sep-action');
        mkBai7DatId(td.querySelector('span'), 'ftc-mk7-sep-action-chu');
        break;
      }
    }
    // Thẻ "Mangle" trên trang Firewall.
    // Dò CHẶT: đúng href, đúng chữ "Mangle", và CHƯA có id — nút "WebFig" ở
    // thanh trên cũng mang href này khi đang ở trang Mangle (xem mkBai7DatId).
    for (const a of doc.querySelectorAll('a[href]')) {
      if (a.id) continue;
      if (a.getAttribute('href') === '#IP:Firewall.Mangle'
          && (a.textContent || '').trim() === 'Mangle') {
        a.id = 'ftc-mk7-the-mangle';
        break;
      }
    }
  } catch (e) {}
}

/** Ô tuỳ chọn đã được MỞ KHOÁ chưa? (đọc thẳng thuộc tính disabled) */
function mkBai7DaMoKhoa(doc, nhan) {
  const tr = mkBai7Hang(doc, nhan);
  if (!tr) return false;
  try {
    const o = tr.querySelector('input, select, textarea');
    return !!(o && !o.disabled);
  } catch (e) {}
  return false;
}

/** Khối "Action" trong hộp thoại Mangle đã mở ra chưa? */
function mkBai7KhoiActionDaMo(doc) {
  const tr = mkBai7Hang(doc, 'Action');
  if (!tr) return false;
  try { return tr.offsetParent !== null; } catch (e) { return false; }
}

/** Giá trị đang có trong ô của hàng mang nhãn `nhan`. */
function mkBai7GiaTri(doc, nhan) {
  const tr = mkBai7Hang(doc, nhan);
  if (!tr) return null;
  try {
    const o = tr.querySelector('input, select, textarea');
    if (!o) return null;
    if (o.tagName === 'SELECT') {
      const op = o.options[o.selectedIndex];
      return op ? op.text.trim() : '';
    }
    return (o.value || '').trim();
  } catch (e) {}
  return null;
}

/* ─────── Ghi nhớ tiến độ: đang làm ISP1 hay ISP2? ─────── */

/**
 * BẮT BUỘC phải ghi nhớ khi CÒN Ở TRANG DANH SÁCH: lúc hộp thoại mở ra thì bảng
 * danh sách không còn trên màn hình để mà đếm nữa, nên không thể biết đang tạo
 * mục thứ nhất hay thứ hai.
 */
function mkBai7GhiNhoTienDo(doc) {
  try {
    if (mkBai7OTables(doc)) {
      const ten = mkBai7TenCacBang(doc);
      window._FTC_MK7_DA_CO_ISP1 = ten.indexOf('ISP1') !== -1;
      window._FTC_MK7_DA_CO_ISP2 = ten.indexOf('ISP2') !== -1;
    }
    if (mkBai7ORoutes(doc)) {
      // Nhan dien tuyen theo CAP (Routing Table, Gateway) — tu 2026-09-20 mot
      // gateway xuat hien o CA HAI bang nen khong con dung rieng gateway lam
      // khoa duoc nua.
      const dong = mkBai7CacTuyenDayDu(doc);
      window._FTC_MK7_TUYEN_XONG = MK_BAI7_TUYEN.map(function (m) {
        return dong.some(function (d) { return d.bang === m.bang && d.gw === m.gw; });
      });
    }
  } catch (e) {}
}

/** Gọi ở đầu MỌI `condition` — vừa gắn ID vừa cập nhật tiến độ. */
function mkBai7Nhip(doc) {
  mkBai7CaiTheoDoi(doc);
  mkBai7GhiNhoTienDo(doc);
}

function mkBai7DangLamBang2() { return !!window._FTC_MK7_DA_CO_ISP1; }


/* ─────── Hai hàm dựng tooltip lặp lại cho vòng 4 tuyến ─────── */

/**
 * Tooltip Bước 10 (nhập Gateway) cho tuyến thứ `i`.
 * Mỗi tuyến một chữ riêng, vì `text` BẮT BUỘC là chuỗi (app.js làm
 * `bubble.innerHTML = pop.text`; truyền hàm vào là in ra mã nguồn hàm).
 */
function MK_BAI7_TUYEN_TOOLTIP_GW(i, chu) {
  return {
    selector: '#ftc-mk7-gw',
    text: chu,
    position: 'right',
    condition: function (doc) {
      mkBai7Nhip(doc);
      if (mkBai7ChiSoTuyen() !== i) return false;
      const m = MK_BAI7_TUYEN[i];
      return mkBai7OHopThoaiTuyen(doc)
        && mkBai7GiaTri(doc, 'Dst. Address') === '0.0.0.0/0'
        && mkBai7GiaTri(doc, 'Gateway') !== m.gw;
    }
  };
}

/** Tooltip Bước 13 (chọn Routing Table) cho bảng `bang`. */
function MK_BAI7_TUYEN_TOOLTIP_BANG(bang, chu) {
  return {
    selector: '#ftc-mk7-rt',
    text: chu,
    position: 'right',
    condition: function (doc) {
      mkBai7Nhip(doc);
      const m = mkBai7TuyenDangLam();
      if (!m || m.bang !== bang) return false;
      return mkBai7OHopThoaiTuyen(doc)
        && mkBai7DaMoKhoa(doc, 'Distance')
        && mkBai7GiaTri(doc, 'Distance') === m.dist
        && mkBai7GiaTri(doc, 'Routing Table') !== m.bang;
    }
  };
}

/* ──────────────────────────── Danh sách tooltip ──────────────────────── */

window.TOOLTIPS_MIKROTIK_HEXS['mikrotik_hexs-bai7'] = [
  // ── Màn hình đăng nhập ───────────────────────────────────────────────
  {
    selector: 'input#name',
    text: 'Nhập admin',
    position: 'right',
    condition: function (doc) { return mkBai7ManDangNhap(doc); }
  },
  {
    selector: 'input[value="Login"], input[type="button"][value="Login"]',
    text: 'Nhập admin',
    position: 'right',
    condition: function (doc) { return mkBai7ManDangNhap(doc); }
  },

  // ══════════════ PHẦN A — Tạo 2 bảng định tuyến ══════════════
  {
    selector: 'li#Routing span, text:Routing',
    text: 'Bước 1: chọn Routing',
    position: 'right',
    condition: function (doc) {
      mkBai7Nhip(doc);
      return !mkBai7ManDangNhap(doc) && !window._FTC_MK7_DA_CO_ISP2
        && !mkBai7MenuConHien(doc, 'Tables')
        && !mkBai7OTables(doc) && !mkBai7OHopThoaiBang(doc);
    }
  },
  {
    selector: '#id_Routing\\:Tables, text:Tables',
    text: 'Bước 2: chọn Tables',
    position: 'right',
    condition: function (doc) {
      mkBai7Nhip(doc);
      return !mkBai7ManDangNhap(doc) && !window._FTC_MK7_DA_CO_ISP2
        && mkBai7MenuConHien(doc, 'Tables')
        && !mkBai7OTables(doc) && !mkBai7OHopThoaiBang(doc);
    }
  },
  {
    selector: 'text:Add New',
    text: 'Bước 3: chọn Add New',
    position: 'bottom',
    condition: function (doc) {
      mkBai7Nhip(doc);
      return mkBai7OTables(doc) && !window._FTC_MK7_DA_CO_ISP2;
    }
  },
  // Bước 4 — biến thể BẢNG THỨ NHẤT (FPT / ISP1).
  // Anh Huynn yêu cầu (2026-09-20): nằm BÊN TRÁI và trỏ vào CHỮ "Comment"
  // (không trỏ vào ô nhập) — nên neo vào `#ftc-mk7-cmt-nhan` (span bọc chữ).
  {
    selector: '#ftc-mk7-cmt-nhan',
    text: 'Bước 4: nhập<br>- Comment: FPT<br>- Name: ISP1<br>- Tích vào ô FIB',
    position: 'left',
    condition: function (doc) {
      mkBai7Nhip(doc);
      return mkBai7OHopThoaiBang(doc) && !!mkBai7Hang(doc, 'FIB') && !mkBai7DangLamBang2();
    }
  },
  // Bước 4 — biến thể BẢNG THỨ HAI (VNPT / ISP2)
  {
    selector: '#ftc-mk7-cmt-nhan',
    text: 'Bước 4: nhập<br>- Comment: VNPT<br>- Name: ISP2<br>- Tích vào ô FIB',
    position: 'left',
    condition: function (doc) {
      mkBai7Nhip(doc);
      return mkBai7OHopThoaiBang(doc) && !!mkBai7Hang(doc, 'FIB') && mkBai7DangLamBang2();
    }
  },
  {
    selector: 'text:OK',
    text: 'Bước 5: chọn OK để lưu',
    position: 'left',
    condition: function (doc) {
      mkBai7Nhip(doc);
      return mkBai7OHopThoaiBang(doc) && !!mkBai7Hang(doc, 'FIB');
    }
  },

  // ══════════════ PHẦN B — Tạo 4 tuyến mặc định ══════════════
  // Mỗi bảng có HAI tuyến (đường chính distance 1 + đường dự phòng distance 2),
  // vì distance chỉ có tác dụng GIỮA CÁC TUYẾN TRONG CÙNG MỘT BẢNG.
  {
    selector: 'li#IP span, text:IP',
    text: 'Bước 6: chọn IP',
    position: 'right',
    condition: function (doc) {
      mkBai7Nhip(doc);
      return !mkBai7ManDangNhap(doc)
        && window._FTC_MK7_DA_CO_ISP2 && !mkBai7XongHetTuyen()
        && !mkBai7MenuConHien(doc, 'Routes')
        && !mkBai7ORoutes(doc) && !mkBai7OHopThoaiTuyen(doc);
    }
  },
  {
    selector: '#id_IP\:Routes, text:Routes',
    text: 'Bước 7: chọn Routes',
    position: 'right',
    condition: function (doc) {
      mkBai7Nhip(doc);
      return window._FTC_MK7_DA_CO_ISP2 && !mkBai7XongHetTuyen()
        && mkBai7MenuConHien(doc, 'Routes')
        && !mkBai7ORoutes(doc) && !mkBai7OHopThoaiTuyen(doc);
    }
  },
  {
    selector: 'text:Add New',
    text: 'Bước 8: chọn Add New',
    position: 'bottom',
    condition: function (doc) {
      mkBai7Nhip(doc);
      return mkBai7ORoutes(doc) && !mkBai7XongHetTuyen();
    }
  },
  {
    selector: '#ftc-mk7-dst',
    text: 'Bước 9: nhập Dst. Address: 0.0.0.0/0',
    position: 'right',
    condition: function (doc) {
      mkBai7Nhip(doc);
      return mkBai7OHopThoaiTuyen(doc) && mkBai7GiaTri(doc, 'Dst. Address') !== '0.0.0.0/0';
    }
  },

  // ── Bước 10: nhập Gateway — 4 biến thể, một cho mỗi tuyến ──
  MK_BAI7_TUYEN_TOOLTIP_GW(0, 'Bước 10: nhập Gateway: 1.1.1.1<br>(tuyến 1/4 — đường chính của bảng ISP1)'),
  MK_BAI7_TUYEN_TOOLTIP_GW(1, 'Bước 10: nhập Gateway: 2.2.2.2<br>(tuyến 2/4 — đường DỰ PHÒNG của bảng ISP1)'),
  MK_BAI7_TUYEN_TOOLTIP_GW(2, 'Bước 10: nhập Gateway: 2.2.2.2<br>(tuyến 3/4 — đường chính của bảng ISP2)'),
  MK_BAI7_TUYEN_TOOLTIP_GW(3, 'Bước 10: nhập Gateway: 1.1.1.1<br>(tuyến 4/4 — đường DỰ PHÒNG của bảng ISP2)'),

  // ── Bước 11: mở khoá Check Gateway (giá trị sẵn đã là ping) ──
  {
    selector: '#ftc-mk7-cg-nut',
    text: 'Bước 11: bấm nút này để mở ô Check Gateway<br>(giá trị sẵn có đã là ping)',
    position: 'right',
    condition: function (doc) {
      mkBai7Nhip(doc);
      return mkBai7OHopThoaiTuyen(doc) && !mkBai7DaMoKhoa(doc, 'Check Gateway');
    }
  },
  {
    selector: '#ftc-mk7-cg',
    text: 'Bước 11: chọn lại ping',
    position: 'right',
    condition: function (doc) {
      mkBai7Nhip(doc);
      return mkBai7OHopThoaiTuyen(doc) && mkBai7DaMoKhoa(doc, 'Check Gateway')
        && mkBai7GiaTri(doc, 'Check Gateway') !== 'ping';
    }
  },

  // ── Bước 12: mở khoá Distance, rồi đặt đúng độ ưu tiên ──
  {
    selector: '#ftc-mk7-dist-nut',
    text: 'Bước 12: bấm nút này để mở ô Distance<br>(giá trị sẵn có đã là 1)',
    position: 'right',
    condition: function (doc) {
      mkBai7Nhip(doc);
      const m = mkBai7TuyenDangLam();
      return !!m && m.dist === '1' && mkBai7OHopThoaiTuyen(doc)
        && mkBai7DaMoKhoa(doc, 'Check Gateway')
        && mkBai7GiaTri(doc, 'Check Gateway') === 'ping'
        && !mkBai7DaMoKhoa(doc, 'Distance');
    }
  },
  {
    selector: '#ftc-mk7-dist-nut',
    text: 'Bước 12: bấm nút này để mở ô Distance',
    position: 'right',
    condition: function (doc) {
      mkBai7Nhip(doc);
      const m = mkBai7TuyenDangLam();
      return !!m && m.dist === '2' && mkBai7OHopThoaiTuyen(doc)
        && mkBai7DaMoKhoa(doc, 'Check Gateway')
        && mkBai7GiaTri(doc, 'Check Gateway') === 'ping'
        && !mkBai7DaMoKhoa(doc, 'Distance');
    }
  },
  {
    selector: '#ftc-mk7-dist',
    text: 'Bước 12: nhập Distance: 2<br>(số càng lớn càng kém ưu tiên —<br>đây là đường dự phòng)',
    position: 'right',
    condition: function (doc) {
      mkBai7Nhip(doc);
      const m = mkBai7TuyenDangLam();
      return !!m && m.dist === '2' && mkBai7OHopThoaiTuyen(doc)
        && mkBai7DaMoKhoa(doc, 'Distance')
        && mkBai7GiaTri(doc, 'Distance') !== '2';
    }
  },
  {
    selector: '#ftc-mk7-dist',
    text: 'Bước 12: nhập lại 1',
    position: 'right',
    condition: function (doc) {
      mkBai7Nhip(doc);
      const m = mkBai7TuyenDangLam();
      return !!m && m.dist === '1' && mkBai7OHopThoaiTuyen(doc)
        && mkBai7DaMoKhoa(doc, 'Distance')
        && mkBai7GiaTri(doc, 'Distance') !== '1';
    }
  },

  // ── Bước 13: chọn Routing Table ──
  MK_BAI7_TUYEN_TOOLTIP_BANG('ISP1', 'Bước 13: chọn Routing Table: ISP1'),
  MK_BAI7_TUYEN_TOOLTIP_BANG('ISP2', 'Bước 13: chọn Routing Table: ISP2'),

  {
    selector: 'text:OK',
    text: 'Bước 14: chọn OK để lưu',
    position: 'left',
    condition: function (doc) {
      mkBai7Nhip(doc);
      const m = mkBai7TuyenDangLam();
      if (!m || !mkBai7OHopThoaiTuyen(doc)) return false;
      return mkBai7GiaTri(doc, 'Routing Table') === m.bang
        && mkBai7GiaTri(doc, 'Distance') === m.dist;
    }
  },

  // ══════════════ PHẦN C — Đánh dấu lưu lượng LAN ══════════════
  {
    selector: 'li#IP span, text:IP',
    text: 'Bước 15: chọn IP',
    position: 'right',
    condition: function (doc) {
      mkBai7Nhip(doc);
      return !mkBai7ManDangNhap(doc) && mkBai7XongHetTuyen()
        && !mkBai7MenuConHien(doc, 'Firewall')
        && !mkBai7OFirewall(doc) && !mkBai7OMangle(doc) && !mkBai7OHopThoaiMangle(doc);
    }
  },
  {
    selector: '#id_IP\\:Firewall, text:Firewall',
    text: 'Bước 16: chọn Firewall',
    position: 'right',
    condition: function (doc) {
      mkBai7Nhip(doc);
      return mkBai7XongHetTuyen() && mkBai7MenuConHien(doc, 'Firewall')
        && !mkBai7OFirewall(doc) && !mkBai7OMangle(doc) && !mkBai7OHopThoaiMangle(doc);
    }
  },
  {
    selector: '#ftc-mk7-the-mangle',
    text: 'Bước 17: chọn thẻ Mangle',
    position: 'bottom',
    condition: function (doc) {
      mkBai7Nhip(doc);
      return mkBai7OFirewall(doc);
    }
  },
  {
    selector: 'text:Add New',
    text: 'Bước 18: chọn Add New',
    position: 'bottom',
    condition: function (doc) {
      mkBai7Nhip(doc);
      return mkBai7OMangle(doc);
    }
  },
  {
    selector: '#ftc-mk7-src-nut',
    text: 'Bước 19: bấm nút này để mở ô Src. Address',
    position: 'right',
    condition: function (doc) {
      mkBai7Nhip(doc);
      return mkBai7OHopThoaiMangle(doc) && !mkBai7DaMoKhoa(doc, 'Src. Address');
    }
  },
  {
    selector: '#ftc-mk7-src',
    text: 'Bước 19: nhập 192.168.1.0/24<br>(dải mạng LAN đang có)',
    position: 'right',
    condition: function (doc) {
      mkBai7Nhip(doc);
      return mkBai7OHopThoaiMangle(doc) && mkBai7DaMoKhoa(doc, 'Src. Address')
        && mkBai7GiaTri(doc, 'Src. Address') !== '192.168.1.0/24';
    }
  },
  // Anh Huynn chốt (2026-09-20): nằm BÊN PHẢI và trỏ vào chữ "Action".
  // BẮT BUỘC neo vào span bọc chữ (`#ftc-mk7-sep-action-chu`), TUYỆT ĐỐI không
  // neo vào cả ô `td.sep` — ô đó colspan=20, rộng 700px, neo vào nó rồi đặt
  // 'right' thì bong bóng văng ra tận mép phải bảng, xa hẳn chữ (chính là chỗ
  // anh đã chê "nằm xa quá"). Neo vào span hẹp thì 'right' = sát ngay sau chữ.
  {
    selector: '#ftc-mk7-sep-action-chu',
    text: 'Bước 20: bấm vào dòng Action<br>để mở khối này ra',
    position: 'right',
    condition: function (doc) {
      mkBai7Nhip(doc);
      return mkBai7OHopThoaiMangle(doc)
        && mkBai7GiaTri(doc, 'Src. Address') === '192.168.1.0/24'
        && !mkBai7KhoiActionDaMo(doc);
    }
  },
  {
    selector: '#ftc-mk7-action',
    text: 'Bước 21: chọn Action: mark routing',
    position: 'right',
    condition: function (doc) {
      mkBai7Nhip(doc);
      return mkBai7OHopThoaiMangle(doc) && mkBai7KhoiActionDaMo(doc)
        && mkBai7GiaTri(doc, 'Action') !== 'mark routing';
    }
  },
  {
    selector: '#ftc-mk7-mark',
    text: 'Bước 22: chọn New Routing Mark: ISP1<br>(đẩy lưu lượng LAN đi hướng FPT)',
    position: 'right',
    condition: function (doc) {
      mkBai7Nhip(doc);
      return mkBai7OHopThoaiMangle(doc)
        && mkBai7GiaTri(doc, 'Action') === 'mark routing'
        && mkBai7GiaTri(doc, 'New Routing Mark') !== 'ISP1';
    }
  },
  {
    selector: 'text:OK',
    text: 'Bước 23: chọn OK để lưu',
    position: 'left',
    condition: function (doc) {
      mkBai7Nhip(doc);
      return mkBai7OHopThoaiMangle(doc)
        && mkBai7GiaTri(doc, 'New Routing Mark') === 'ISP1';
    }
  }
];
