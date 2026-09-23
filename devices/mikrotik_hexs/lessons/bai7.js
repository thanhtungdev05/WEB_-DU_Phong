/**
 * devices/mikrotik_hexs/lessons/bai7.js
 * Bài 7: Cấu hình Policy Routing — MikroTik hEX S
 *
 * ĐỀ BÀI (anh Huynn chốt 2026-09-20): thiết bị ảo KHÔNG nối ISP thật, nên bài
 * GIẢ ĐỊNH hai nhà mạng — ISP1 = FPT (IP WAN 1.1.1.1), ISP2 = VNPT (IP WAN
 * 2.2.2.2). Học viên tạo 2 bảng định tuyến, 4 tuyến mặc định (mỗi bảng 1 đường
 * chính + 1 đường dự phòng), rồi ép toàn bộ lưu lượng LAN 192.168.1.0/24 đi ra
 * hướng FPT.
 *
 * ═══ NGUỒN DỮ LIỆU CHẤM ĐIỂM — ĐO THẬT 2026-09-20, KHÔNG ĐOÁN ═══
 * Bài này chấm chủ yếu từ **BA TRANG DANH SÁCH** (chắc hơn chụp hộp thoại: giá
 * trị trên danh sách là thứ thiết bị ĐÃ LƯU THẬT). Bản đồ cột đo được:
 *   Routing > Tables        tds[2]=Comment  tds[3]=Name   tds[4]=FIB
 *   IP > Routes             tds[3]=Dst.Address  tds[4]=Gateway
 *                           tds[5]=Distance     tds[6]=Routing Table
 *   IP > Firewall > Mangle  tds[4]=Action  tds[5]=Chain  tds[6]=Src. Address
 *
 * ⚠️ HAI THỨ KHÔNG CÓ CỘT TRÊN DANH SÁCH — buộc phải chụp lúc bấm OK:
 *   1. **New Routing Mark** của luật Mangle (bảng Mangle không có cột này).
 *   2. **Check Gateway** của tuyến (bảng Routes không có cột này).
 * Với Check Gateway, thứ cần chấm KHÔNG phải giá trị mà là **đã MỞ KHOÁ chưa**:
 * ô còn khoá (`disabled`) thì tuy DOM vẫn đọc ra `ping` nhưng giá trị KHÔNG
 * được gửi xuống thiết bị. Nên chụp `!o.disabled && giá trị === 'ping'`.
 * (Cột `Distance` thì MAY MẮN có trên danh sách: để trống = học viên quên mở
 * khoá, `1` = đã mở và đã lưu — nên tiêu chí đó chấm thẳng từ danh sách.)
 *
 * ═══ VÌ SAO PHẢI CHỤP LIÊN TỤC ═══
 * WebFig là SPA dùng chung MỘT document: đang mở hộp thoại thì bảng danh sách
 * biến mất, đang ở trang Mangle thì không còn thấy bảng Tables. Nên `onSimLoad`
 * chạy một nhịp 500ms, hễ học viên ĐANG Ở trang danh sách nào thì chụp ngay
 * trang đó vào `window._FTC_MK7_DS_*`. Lúc chấm thì dùng bản chụp mới nhất.
 *
 * ═══ CHẤM THEO TỪNG TRANG Ở CHẾ ĐỘ HƯỚNG DẪN ═══
 * Bài có 3 trang nên theo đúng nguyên tắc anh Huynn chốt ở Bài 4: ở Hướng dẫn
 * CHỈ báo lỗi của TRANG ĐANG LÀM (`trangHienTaiDat`), không lôi lỗi của trang
 * chưa mở ra. Thực hành thì luôn chấm đủ cả 26 tiêu chí.
 */

window.DEVICE_MIKROTIK_HEXS_LESSONS = window.DEVICE_MIKROTIK_HEXS_LESSONS || [];

/* ─────────────────────── Đọc 3 trang danh sách ─────────────────────── */

function mkBai7DocHash(doc) {
  try {
    const w = doc.defaultView || window;
    return (w.location && w.location.hash) || '';
  } catch (e) { return ''; }
}

/** Lấy các ô <td> của những dòng dữ liệu (bỏ dòng tiêu đề / dòng tóm tắt). */
function mkBai7CacDong(doc, soOToiThieu) {
  const ds = [];
  try {
    for (const tr of doc.querySelectorAll('tr')) {
      if (tr.querySelector('th')) continue;
      const tds = tr.querySelectorAll('td');
      if (tds.length >= soOToiThieu) {
        ds.push(Array.from(tds).map(function (t) { return (t.textContent || '').trim(); }));
      }
    }
  } catch (e) {}
  return ds;
}

/** Chụp bảng Routing > Tables → [{comment, ten, fib}] */
function mkBai7ChupBang(doc) {
  return mkBai7CacDong(doc, 6).map(function (o) {
    return { comment: o[2], ten: o[3], fib: o[4] };
  }).filter(function (x) { return x.ten; });
}

/** Chụp bảng IP > Routes → [{dst, gateway, distance, bang}] */
function mkBai7ChupTuyen(doc) {
  return mkBai7CacDong(doc, 9).map(function (o) {
    return { dst: o[3], gateway: o[4], distance: o[5], bang: o[6] };
  }).filter(function (x) { return x.gateway; });
}

/** Chụp bảng IP > Firewall > Mangle → [{action, chain, src}] */
function mkBai7ChupMangle(doc) {
  return mkBai7CacDong(doc, 20).map(function (o) {
    return { action: o[4], chain: o[5], src: o[6] };
  }).filter(function (x) { return x.action; });
}

/**
 * Nhịp 500ms: hễ đang ở trang danh sách nào thì chụp trang đó. Bắt buộc, vì
 * lúc mở hộp thoại hoặc sang trang khác là không còn gì để đọc.
 */
function mkBai7ChupTheoTrang(doc) {
  try {
    const h = mkBai7DocHash(doc);
    if (h === '#Routing:Tables') {
      const d = mkBai7ChupBang(doc);
      if (d.length) window._FTC_MK7_DS_BANG = d;
    } else if (h === '#IP:Routes') {
      const d = mkBai7ChupTuyen(doc);
      if (d.length) window._FTC_MK7_DS_TUYEN = d;
    } else if (h === '#IP:Firewall.Mangle') {
      const d = mkBai7ChupMangle(doc);
      if (d.length) window._FTC_MK7_DS_MANGLE = d;
    }
  } catch (e) {}
}

/* ───────── Đọc giá trị trong hộp thoại (lúc bấm OK) ───────── */

function mkBai7HangTheoNhanL(doc, nhan) {
  try {
    for (const tr of doc.querySelectorAll('tr')) {
      const lb = tr.querySelector('td.label');
      if (lb && lb.textContent.trim() === nhan) return tr;
    }
  } catch (e) {}
  return null;
}

/** Trả về {gt, batLen} — `batLen` = ô đã MỞ KHOÁ (giá trị mới được gửi đi). */
function mkBai7DocO(doc, nhan) {
  const tr = mkBai7HangTheoNhanL(doc, nhan);
  if (!tr) return null;
  try {
    const o = tr.querySelector('input, select, textarea');
    if (!o) return null;
    let gt;
    if (o.tagName === 'SELECT') {
      const op = o.options[o.selectedIndex];
      gt = op ? op.text.trim() : '';
    } else if (o.type === 'checkbox') {
      gt = o.checked ? 'yes' : 'no';
    } else {
      gt = (o.value || '').trim();
    }
    return { gt: gt, batLen: !o.disabled };
  } catch (e) {}
  return null;
}

/* ───────────────────────── Bảng đáp án ───────────────────────── */

var MK_BAI7_BANG_CHUAN = [
  { ten: 'ISP1', comment: 'FPT' },
  { ten: 'ISP2', comment: 'VNPT' }
];

/**
 * BỐN tuyến phải tạo. Mỗi bảng có ĐƯỜNG CHÍNH (distance 1) và ĐƯỜNG DỰ PHÒNG
 * (distance 2).
 *
 * VÌ SAO (anh Huynn hỏi 2026-09-20 — xem memory.md mục 2.76): `Distance` chỉ so
 * sánh giữa các tuyến NẰM TRONG CÙNG MỘT BẢNG. Đặt distance khác nhau ở HAI
 * BẢNG khác nhau thì không tạo ra ưu tiên gì cả — hai tuyến đó không bao giờ
 * gặp nhau để so sánh. Muốn thấy rõ "ưu tiên FPT, FPT chết thì rớt sang VNPT"
 * thì phải để CẢ HAI gateway trong CÙNG một bảng, distance khác nhau — đúng
 * như cấu hình thật của chính thiết bị này (`to_WAN1` = pppoe-out1 d1 +
 * pppoe-out2 d2, `to_WAN2` = pppoe-out2 d1 + pppoe-out1 d2).
 *
 * ⚠️ NHẬN DIỆN theo CẶP (Routing Table, Gateway) — KHÔNG dùng riêng gateway làm
 * khoá nữa, vì từ nay mỗi gateway xuất hiện ở CẢ HAI bảng.
 */
var MK_BAI7_TUYEN_CHUAN = [
  { bang: 'ISP1', gateway: '1.1.1.1', distance: '1', vaiTro: 'đường chính' },
  { bang: 'ISP1', gateway: '2.2.2.2', distance: '2', vaiTro: 'đường dự phòng' },
  { bang: 'ISP2', gateway: '2.2.2.2', distance: '1', vaiTro: 'đường chính' },
  { bang: 'ISP2', gateway: '1.1.1.1', distance: '2', vaiTro: 'đường dự phòng' }
];

var MK_BAI7_MANGLE_SRC = '192.168.1.0/24';
var MK_BAI7_MANGLE_CHAIN = 'prerouting';
var MK_BAI7_MANGLE_ACTION = 'mark routing';
var MK_BAI7_MANGLE_MARK = 'ISP1';

/** Trang đang làm, suy từ hash. */
function mkBai7TrangTheoHash(doc) {
  const h = mkBai7DocHash(doc);
  if (h.indexOf('#Routing:Tables') === 0) return 1;
  if (h.indexOf('#IP:Routes') === 0) return 2;
  if (h.indexOf('#IP:Firewall.Mangle') === 0) return 3;
  return 0;
}

window.DEVICE_MIKROTIK_HEXS_LESSONS.push({
  id: 'mikrotik_hexs-bai7',
  title: 'Cấu hình Policy Routing',
  subtitle: 'Định tuyến theo chính sách',
  instructions: [
    '<b>Tình huống:</b>',
    'Router đang đấu 2 nhà mạng: <b>ISP1 = FPT</b> (IP WAN <span class="val">1.1.1.1</span>) và <b>ISP2 = VNPT</b> (IP WAN <span class="val">2.2.2.2</span>).',
    'Nhân viên IT yêu cầu ép toàn bộ lưu lượng mạng LAN đi ra hướng <b>FPT</b>.',
    '<b>Yêu cầu:</b>',
    '- Username: <span class="val">admin</span>',
    '- Password: <span class="val">admin</span>',
    '<b>1) Vào Routing > Tables, tạo 2 bảng định tuyến (đều tích FIB):</b>',
    '&nbsp;&nbsp;• Comment: <span class="val">FPT</span> — Name: <span class="val">ISP1</span>',
    '&nbsp;&nbsp;• Comment: <span class="val">VNPT</span> — Name: <span class="val">ISP2</span>',
    '<b>2) Vào IP > Routes, tạo 4 tuyến mặc định</b> (Dst. Address <span class="val">0.0.0.0/0</span>, đều mở khoá Check Gateway <span class="val">ping</span>):',
    '&nbsp;&nbsp;<i>Mỗi bảng có 1 đường chính (Distance 1) và 1 đường dự phòng (Distance 2) — số càng nhỏ càng được ưu tiên:</i>',
    '&nbsp;&nbsp;• Bảng <span class="val">ISP1</span>: Gateway <span class="val">1.1.1.1</span> — Distance <span class="val">1</span> (chính)',
    '&nbsp;&nbsp;• Bảng <span class="val">ISP1</span>: Gateway <span class="val">2.2.2.2</span> — Distance <span class="val">2</span> (dự phòng)',
    '&nbsp;&nbsp;• Bảng <span class="val">ISP2</span>: Gateway <span class="val">2.2.2.2</span> — Distance <span class="val">1</span> (chính)',
    '&nbsp;&nbsp;• Bảng <span class="val">ISP2</span>: Gateway <span class="val">1.1.1.1</span> — Distance <span class="val">2</span> (dự phòng)',
    '<b>3) Vào IP > Firewall > Mangle, tạo luật đánh dấu lưu lượng LAN:</b>',
    '&nbsp;&nbsp;• Chain: <span class="val">prerouting</span> (giữ nguyên mặc định)',
    '&nbsp;&nbsp;• Src. Address: <span class="val">192.168.1.0/24</span>',
    '&nbsp;&nbsp;• Action: <span class="val">mark routing</span> — New Routing Mark: <span class="val">ISP1</span>',
    '- Các thông số còn lại giữ nguyên mặc định, mỗi mục nhấn <b>OK</b> để lưu.',
    '<b>Kết quả:</b> lưu lượng LAN bị đóng dấu <span class="val">ISP1</span> nên router tra bảng ISP1 — ưu tiên đi <b>FPT</b> (Distance 1), nếu FPT chết thì tự rớt sang <b>VNPT</b> (Distance 2).'
  ],
  practiceUrl: '/sim_mikrotik_hexs/index.html',

  grading: {
    description: 'Kiểm tra Policy Routing (bảng định tuyến + tuyến + luật Mangle) trên MikroTik hEX S',
    rules: [
      { id: 'mangle_src', name: 'Luật Mangle đánh dấu LAN', selector: 'tr', expected: MK_BAI7_MANGLE_SRC, type: 'text_contains', required: true }
    ],
    customGrading: function (allDocs) {
      // Tài liệu của thiết bị (để biết đang ở trang nào)
      let doc = null;
      for (const d of allDocs) {
        try {
          if (mkBai7DocHash(d)) { doc = d; break; }
        } catch (e) {}
      }
      if (doc) mkBai7ChupTheoTrang(doc);

      const dsBang = window._FTC_MK7_DS_BANG || null;
      const dsTuyen = window._FTC_MK7_DS_TUYEN || null;
      const dsMangle = window._FTC_MK7_DS_MANGLE || null;
      const chupTuyen = window._FTC_MK7_CHUP_TUYEN || {};   // gateway -> {checkGateway}
      const chupMangle = window._FTC_MK7_CHUP_MANGLE || null;

      const CHUA_MO = '(chưa mở trang này)';

      function muc(trang, id, ten, canCo, dangCo, dat, loi) {
        return { trang: trang, id: id, name: ten, expected: canCo, actual: dangCo,
                 passed: dat, message: loi };
      }

      const details = [];

      // ══════ TRANG 1 — Routing > Tables ══════
      MK_BAI7_BANG_CHUAN.forEach(function (chuan, i) {
        const tim = dsBang
          ? dsBang.filter(function (b) { return b.ten === chuan.ten; })[0]
          : null;
        const coBang = !!tim;
        details.push(muc(1, 'mk7_bang_' + i, 'Đã tạo bảng định tuyến tên ' + chuan.ten,
          'Có trong Routing > Tables',
          dsBang ? (coBang ? 'Đã có' : 'Chưa có') : CHUA_MO,
          coBang,
          coBang ? 'Chính xác'
            : (!dsBang ? 'Chưa mở Routing > Tables nên không đọc được'
              : 'Chưa tạo bảng có Name = ' + chuan.ten)));

        details.push(muc(1, 'mk7_bang_cmt_' + i, 'Bảng ' + chuan.ten + ': Comment = ' + chuan.comment,
          chuan.comment,
          tim ? (tim.comment || '(để trống)') : (dsBang ? '(chưa có bảng)' : CHUA_MO),
          !!tim && tim.comment === chuan.comment,
          (!!tim && tim.comment === chuan.comment) ? 'Chính xác'
            : (!dsBang ? 'Chưa mở Routing > Tables nên không đọc được'
              : (!tim ? 'Chưa tạo bảng ' + chuan.ten : 'Comment không đúng yêu cầu đề bài'))));

        details.push(muc(1, 'mk7_bang_fib_' + i, 'Bảng ' + chuan.ten + ': đã tích FIB',
          'yes',
          tim ? (tim.fib || '(không tích)') : (dsBang ? '(chưa có bảng)' : CHUA_MO),
          !!tim && tim.fib === 'yes',
          (!!tim && tim.fib === 'yes') ? 'Chính xác'
            : (!dsBang ? 'Chưa mở Routing > Tables nên không đọc được'
              : (!tim ? 'Chưa tạo bảng ' + chuan.ten : 'Chưa tích vào ô FIB'))));
      });

      // ══════ TRANG 2 — IP > Routes ══════
      MK_BAI7_TUYEN_CHUAN.forEach(function (chuan, i) {
        // Khoá nhận diện = CẶP (bảng, gateway)
        const tim = dsTuyen
          ? dsTuyen.filter(function (t) {
              return t.bang === chuan.bang && t.gateway === chuan.gateway;
            })[0]
          : null;
        const coTuyen = !!tim;
        const nhan = 'Bảng ' + chuan.bang + ' — ' + chuan.vaiTro
          + ' (Gateway ' + chuan.gateway + ')';

        details.push(muc(2, 'mk7_tuyen_' + i, 'Đã tạo tuyến: ' + nhan,
          'Có tuyến Gateway ' + chuan.gateway + ' trong bảng ' + chuan.bang,
          dsTuyen ? (coTuyen ? 'Đã có' : 'Chưa có') : CHUA_MO,
          coTuyen,
          coTuyen ? 'Chính xác'
            : (!dsTuyen ? 'Chưa mở IP > Routes nên không đọc được'
              : 'Chưa tạo tuyến Gateway ' + chuan.gateway
                + ' với Routing Table = ' + chuan.bang)));

        details.push(muc(2, 'mk7_tuyen_dst_' + i, nhan + ': Dst. Address = 0.0.0.0/0',
          '0.0.0.0/0',
          tim ? (tim.dst || '(để trống)') : (dsTuyen ? '(chưa có tuyến)' : CHUA_MO),
          !!tim && tim.dst === '0.0.0.0/0',
          (!!tim && tim.dst === '0.0.0.0/0') ? 'Chính xác'
            : (!dsTuyen ? 'Chưa mở IP > Routes nên không đọc được'
              : (!tim ? 'Chưa tạo tuyến này' : 'Tuyến mặc định phải là 0.0.0.0/0'))));

        details.push(muc(2, 'mk7_tuyen_dist_' + i,
          nhan + ': Distance = ' + chuan.distance,
          chuan.distance,
          tim ? (tim.distance || '(để trống — chưa mở khoá ô Distance)')
              : (dsTuyen ? '(chưa có tuyến)' : CHUA_MO),
          !!tim && tim.distance === chuan.distance,
          (!!tim && tim.distance === chuan.distance) ? 'Chính xác'
            : (!dsTuyen ? 'Chưa mở IP > Routes nên không đọc được'
              : (!tim ? 'Chưa tạo tuyến này'
                : (!tim.distance
                  ? 'Chưa bấm nút tam giác để mở khoá ô Distance nên giá trị không được lưu'
                  : 'Trong cùng một bảng, đường chính phải là 1 và đường dự phòng phải là 2')))));

        // Check Gateway KHÔNG có cột trên danh sách -> dùng bản chụp lúc bấm OK
        const khoa = chuan.bang + '|' + chuan.gateway;
        const cg = chupTuyen[khoa];
        const cgDat = !!cg && cg.batLen === true && cg.gt === 'ping';
        details.push(muc(2, 'mk7_tuyen_cg_' + i, nhan + ': đã mở khoá Check Gateway = ping',
          'Đã mở khoá, giá trị ping',
          cg ? (cg.batLen ? ('Đã mở khoá, giá trị ' + cg.gt)
                          : 'Còn khoá nên không được lưu')
             : (coTuyen ? '(không ghi nhận được)' : CHUA_MO),
          cgDat,
          cgDat ? 'Chính xác'
            : (!cg ? 'Chưa tạo tuyến này, hoặc chưa nhấn OK để lưu'
              : (!cg.batLen ? 'Chưa bấm nút tam giác để mở khoá ô Check Gateway'
                : 'Check Gateway phải là ping'))));
      });

      // ══════ TRANG 3 — IP > Firewall > Mangle ══════
      const luat = dsMangle
        ? dsMangle.filter(function (m) { return m.src === MK_BAI7_MANGLE_SRC; })[0]
        : null;
      const coLuat = !!luat;

      details.push(muc(3, 'mk7_mangle_src', 'Đã tạo luật Mangle cho LAN ' + MK_BAI7_MANGLE_SRC,
        'Có luật với Src. Address = ' + MK_BAI7_MANGLE_SRC,
        dsMangle ? (coLuat ? 'Đã có' : 'Chưa có') : CHUA_MO,
        coLuat,
        coLuat ? 'Chính xác'
          : (!dsMangle ? 'Chưa mở IP > Firewall > Mangle nên không đọc được'
            : 'Chưa tạo luật có Src. Address = ' + MK_BAI7_MANGLE_SRC
              + ' (nhớ bấm nút tam giác để mở khoá ô này)')));

      details.push(muc(3, 'mk7_mangle_chain', 'Luật Mangle: Chain = ' + MK_BAI7_MANGLE_CHAIN,
        MK_BAI7_MANGLE_CHAIN,
        luat ? luat.chain : (dsMangle ? '(chưa có luật)' : CHUA_MO),
        !!luat && luat.chain === MK_BAI7_MANGLE_CHAIN,
        (!!luat && luat.chain === MK_BAI7_MANGLE_CHAIN) ? 'Chính xác'
          : (!dsMangle ? 'Chưa mở IP > Firewall > Mangle nên không đọc được'
            : (!luat ? 'Chưa tạo luật này' : 'Đây là giá trị mặc định, không được thay đổi'))));

      details.push(muc(3, 'mk7_mangle_action', 'Luật Mangle: Action = ' + MK_BAI7_MANGLE_ACTION,
        MK_BAI7_MANGLE_ACTION,
        luat ? luat.action : (dsMangle ? '(chưa có luật)' : CHUA_MO),
        !!luat && luat.action === MK_BAI7_MANGLE_ACTION,
        (!!luat && luat.action === MK_BAI7_MANGLE_ACTION) ? 'Chính xác'
          : (!dsMangle ? 'Chưa mở IP > Firewall > Mangle nên không đọc được'
            : (!luat ? 'Chưa tạo luật này' : 'Phải chọn Action = ' + MK_BAI7_MANGLE_ACTION))));

      // New Routing Mark KHÔNG có cột trên danh sách -> dùng bản chụp lúc bấm OK
      const markDat = !!chupMangle && chupMangle.mark === MK_BAI7_MANGLE_MARK;
      details.push(muc(3, 'mk7_mangle_mark', 'Luật Mangle: New Routing Mark = ' + MK_BAI7_MANGLE_MARK,
        MK_BAI7_MANGLE_MARK,
        chupMangle ? (chupMangle.mark || '(để trống)') : (coLuat ? '(không ghi nhận được)' : CHUA_MO),
        markDat,
        markDat ? 'Chính xác'
          : (!chupMangle ? 'Chưa tạo luật Mangle, hoặc chưa nhấn OK để lưu'
            : 'Phải chọn New Routing Mark = ' + MK_BAI7_MANGLE_MARK
              + ' (nhớ bấm vào dòng Action để mở khối này ra)')));

      // ══════ Tổng hợp ══════
      function dem(ds) {
        return ds.filter(function (d) { return d.passed; }).length;
      }
      const datCaBai = dem(details) === details.length;

      function ketQua(ds, themTrangHienTai) {
        const r = {
          passed: datCaBai,
          score: Math.round((dem(details) / details.length) * 100),
          passedCount: dem(ds),
          totalRules: ds.length,
          details: ds.map(function (d) {
            return { id: d.id, name: d.name, expected: d.expected,
                     actual: d.actual, passed: d.passed, message: d.message };
          })
        };
        if (themTrangHienTai !== undefined) r.trangHienTaiDat = themTrangHienTai;
        return r;
      }

      /**
       * HƯỚNG DẪN — CHỈ BÁO LỖI CỦA TRANG ĐANG LÀM (nguyên tắc anh Huynn chốt
       * ở Bài 4, mục 2.61 memory.md). Thực hành, hoặc khi đã đạt cả bài, thì
       * chấm đủ 20 tiêu chí.
       */
      const laHuongDan = (typeof window.ftcLayCheDo === 'function')
        && window.ftcLayCheDo() === 'guide';
      if (!laHuongDan || datCaBai) {
        return ketQua(details);
      }

      // Trang đang mở; nếu đang ở chỗ khác (dashboard, menu...) thì lấy trang
      // ĐẦU TIÊN chưa xong — đó mới là trang học viên cần làm tiếp.
      let trang = doc ? mkBai7TrangTheoHash(doc) : 0;
      if (!trang) {
        trang = 1;
        for (let t = 1; t <= 3; t++) {
          const cua = details.filter(function (d) { return d.trang === t; });
          if (dem(cua) !== cua.length) { trang = t; break; }
        }
      }
      const dsTrang = details.filter(function (d) { return d.trang === trang; });
      const trangHienTaiDat = dem(dsTrang) === dsTrang.length;
      return ketQua(dsTrang, trangHienTaiDat);
    }
  },

  /**
   * Đặt lại 4 bảng mà bài này đụng tới mỗi lượt mở bài — BẮT BUỘC, vì kho cấu
   * hình MikroTik LƯU BỀN: không đặt lại thì học viên sau vào đã thấy bảng,
   * tuyến và luật Mangle có sẵn, không còn gì để làm.
   *
   * LỖI ĐÃ VẤP (2026-09-20): bản đầu của `/ftc_dat_lai?bai=7` QUÊN bảng Mangle
   * [20,7] nên mỗi lượt chạy lại chồng thêm một luật trùng y hệt (29 → 30 → 31
   * dòng). Nay đã xoá cả [44,20], [44,21], [44,18] và [20,7].
   */
  onSimLoad: function (simWin) {
    try {
      const doc = simWin.document;
      if (doc && doc.querySelector('input#name') && doc.querySelector('input#password')) {
        window._FTC_MK7_DA_CO_ISP1 = false;
        window._FTC_MK7_DA_CO_ISP2 = false;
        window._FTC_MK7_TUYEN_XONG = [];
        window._FTC_MK7_DS_BANG = null;
        window._FTC_MK7_DS_TUYEN = null;
        window._FTC_MK7_DS_MANGLE = null;
        window._FTC_MK7_CHUP_TUYEN = {};
        window._FTC_MK7_CHUP_MANGLE = null;
        try { simWin.fetch('/sim_mikrotik_hexs/ftc_dat_lai?bai=7'); } catch (e) {}
      }
      if (!simWin._ftcMkBai7DangTheoDoi) {
        simWin._ftcMkBai7DangTheoDoi = true;
        simWin.setInterval(function () {
          try {
            if (typeof mkBai7Nhip === 'function') mkBai7Nhip(simWin.document);
            mkBai7ChupTheoTrang(simWin.document);
          } catch (e) {}
        }, 500);
      }
    } catch (e) {}
  },

  /**
   * Chụp NGAY LÚC bấm OK hai thứ KHÔNG có cột trên bảng danh sách:
   *   - Check Gateway của tuyến (cần biết ô đã MỞ KHOÁ chưa),
   *   - New Routing Mark của luật Mangle.
   * Hộp thoại tự đóng ngay sau khi lưu nên không chụp lúc này là mất.
   */
  onSimSave: function (simWin) {
    try {
      const doc = simWin.document;
      const h = mkBai7DocHash(doc);

      if (h.indexOf('#IP:Routes.') === 0) {
        const gw = mkBai7DocO(doc, 'Gateway');
        const bang = mkBai7DocO(doc, 'Routing Table');
        const cg = mkBai7DocO(doc, 'Check Gateway');
        // KHOÁ = bảng|gateway. Từ 2026-09-20 mỗi gateway có mặt ở CẢ HAI bảng
        // nên dùng riêng gateway làm khoá là ghi đè lẫn nhau.
        if (gw && gw.gt && bang && bang.gt) {
          window._FTC_MK7_CHUP_TUYEN = window._FTC_MK7_CHUP_TUYEN || {};
          window._FTC_MK7_CHUP_TUYEN[bang.gt + '|' + gw.gt] = cg
            ? { gt: cg.gt, batLen: cg.batLen }
            : { gt: '', batLen: false };
        }
      } else if (h.indexOf('#IP:Firewall.Mangle.') === 0) {
        const src = mkBai7DocO(doc, 'Src. Address');
        const mark = mkBai7DocO(doc, 'New Routing Mark');
        window._FTC_MK7_CHUP_MANGLE = {
          src: src ? src.gt : '',
          srcBatLen: src ? src.batLen : false,
          mark: mark ? mark.gt : ''
        };
      }
    } catch (e) {}
  },

  guidePopups: (window.TOOLTIPS_MIKROTIK_HEXS
                && window.TOOLTIPS_MIKROTIK_HEXS['mikrotik_hexs-bai7']) || []
});
