/**
 * devices/mikrotik_hexs/lessons/bai6.js
 * Bài 6: Cân bằng tải (Load Balancing) 2 WAN bằng PCC — MikroTik hEX S
 *
 * ĐỀ BÀI (anh Huynn chốt 2026-09-20): dùng CẢ HAI đường WAN CÙNG LÚC. Router thật
 * đang chạy PCC — mỗi kết nối băm theo (IP nguồn, IP đích), chia 2, dư 0 đi WAN1,
 * dư 1 đi WAN2. Hàm đặt lại xoá 2 luật PCC gốc (id 8, 9) để học viên TỰ TẠO LẠI
 * đúng y bản gốc, rồi KÉO lên trên luật mark routing. Bảng to_WAN1/to_WAN2, tuyến
 * và 4 luật mark routing giữ nguyên để học viên thấy toàn cảnh.
 *
 * ═══ NGUỒN DỮ LIỆU CHẤM ═══
 *  - Trang danh sách Mangle (đã lưu thật): Action [4], Chain [5], In. Interface [14]
 *    và VỊ TRÍ (#) → tiêu chí "đã tạo", "thứ tự".
 *  - KHÔNG có cột trên danh sách: Connection Mark, PCC, Dst. Address Type (+phủ
 *    định), New Connection Mark → chụp lúc bấm OK (`onSimSave`), khoá theo PHẦN DƯ
 *    của PCC (0 → luật WAN1, 1 → luật WAN2).
 *  - Với ô tuỳ chọn, chụp `!disabled` (còn khoá thì giá trị KHÔNG được gửi đi).
 *
 * Bài MỘT TRANG nhưng có 3 CHẶNG (luật 1 → luật 2 → sắp xếp): ở Hướng dẫn chỉ báo
 * lỗi của chặng đang làm (`trangHienTaiDat`), Thực hành chấm đủ 17 tiêu chí.
 */

window.DEVICE_MIKROTIK_HEXS_LESSONS = window.DEVICE_MIKROTIK_HEXS_LESSONS || [];

function mkBai6DocHashL(doc) {
  try { const w = doc.defaultView || window; return (w.location && w.location.hash) || ''; }
  catch (e) { return ''; }
}
function mkBai6HangL(doc, nhan) {
  try {
    for (const tr of doc.querySelectorAll('tr')) {
      const lb = tr.querySelector('td.label');
      if (lb && lb.textContent.trim() === nhan) return tr;
    }
  } catch (e) {}
  return null;
}
/** {gt, batLen, phuDinh} của ô thứ `thu` trong hàng. */
function mkBai6DocOL(doc, nhan, thu) {
  const tr = mkBai6HangL(doc, nhan);
  if (!tr) return null;
  try {
    const os = tr.querySelectorAll('input, select, textarea');
    const o = os[thu || 0];
    const notImg = (function () { const a = tr.querySelector('a.not, a.not_disabled'); const i = a && a.querySelector('img'); return i ? (i.getAttribute('src') || '') : ''; })();
    const phuDinh = /not-checked\.svg/.test(notImg);
    if (!o) return { gt: null, batLen: false, phuDinh: phuDinh };
    let gt;
    if (o.tagName === 'SELECT') { const op = o.options[o.selectedIndex]; gt = op ? op.text.trim() : ''; }
    else gt = (o.value || '').trim();
    return { gt: gt, batLen: !o.disabled, phuDinh: phuDinh };
  } catch (e) {}
  return null;
}

/** Chụp danh sách Mangle → [{vt, action, chain, inIf}] */
function mkBai6ChupDanhSach(doc) {
  const ds = [];
  try {
    for (const tr of doc.querySelectorAll('tr')) {
      if (tr.querySelector('th')) continue;
      const tds = tr.querySelectorAll('td');
      if (tds.length < 20) continue;
      ds.push({ vt: parseInt(tds[2].textContent.trim(), 10),
                action: tds[4].textContent.trim(), chain: tds[5].textContent.trim(),
                inIf: tds[14].textContent.trim() });
    }
  } catch (e) {}
  return ds;
}
function mkBai6ChupTheoTrang(doc) {
  try {
    if (mkBai6DocHashL(doc) === '#IP:Firewall.Mangle') {
      const d = mkBai6ChupDanhSach(doc);
      if (d.length) window._FTC_MK6_DS = d;
    }
  } catch (e) {}
}

var MK_BAI6_LUAT_CHUAN = [
  { du: '0', mark: 'WAN1_conn', ten: 'Luật PCC 2/0 (nhóm WAN1)' },
  { du: '1', mark: 'WAN2_conn', ten: 'Luật PCC 2/1 (nhóm WAN2)' }
];

window.DEVICE_MIKROTIK_HEXS_LESSONS.push({
  id: 'mikrotik_hexs-bai6',
  title: 'Cấu hình định tuyến Failover và Load Balancing',
  subtitle: 'Cân bằng tải 2 WAN bằng PCC',
  instructions: [
    '<b>Tình huống:</b>',
    'Router có 2 đường WAN (<b>pppoe-out1</b> = WAN1, <b>pppoe-out2</b> = WAN2). Đã có sẵn bảng định tuyến <span class="val">to_WAN1</span>/<span class="val">to_WAN2</span> và các luật <i>mark routing</i> gắn nhãn kết nối vào từng bảng.',
    'Nhiệm vụ: tạo 2 luật <b>PCC</b> (Per Connection Classifier) để <b>chia đôi kết nối từ LAN ra 2 WAN, dùng cả 2 đường cùng lúc</b>.',
    '<b>Yêu cầu:</b>',
    '- Username: <span class="val">admin</span> — Password: <span class="val">admin</span>',
    '- Vào <b>IP > Firewall > Mangle</b>, tạo 2 luật (Chain <span class="val">prerouting</span> giữ nguyên):',
    '&nbsp;&nbsp;• In. Interface <span class="val">bridge-LAN</span>, Connection Mark <span class="val">no-mark</span>, Dst. Address Type <span class="val">!local</span> (phủ định)',
    '&nbsp;&nbsp;• Luật 1: Per Connection Classifier <span class="val">both addresses : 2/0</span> → Action <span class="val">mark connection</span>, New Connection Mark <span class="val">WAN1_conn</span>',
    '&nbsp;&nbsp;• Luật 2: Per Connection Classifier <span class="val">both addresses : 2/1</span> → Action <span class="val">mark connection</span>, New Connection Mark <span class="val">WAN2_conn</span>',
    '- <b>Kéo 2 luật vừa tạo lên TRÊN luật mark routing đầu tiên</b> (luật phân loại phải chạy trước luật chọn đường).',
    '- Các thông số còn lại giữ nguyên mặc định, mỗi luật nhấn <b>OK</b> để lưu.'
  ],
  practiceUrl: '/sim_mikrotik_hexs/index.html',

  grading: {
    description: 'Kiểm tra 2 luật PCC cân bằng tải trên MikroTik hEX S',
    rules: [
      { id: 'pcc', name: 'Luật PCC', selector: 'tr', expected: 'mark connection', type: 'text_contains', required: true }
    ],
    customGrading: function (allDocs) {
      let doc = null;
      for (const d of allDocs) { try { if (mkBai6DocHashL(d)) { doc = d; break; } } catch (e) {} }
      if (doc) mkBai6ChupTheoTrang(doc);

      const ds = window._FTC_MK6_DS || null;
      const chup = window._FTC_MK6_CHUP || {};
      const CHUA_MO = '(chưa mở trang này)';
      const details = [];
      let changHienTai = 0;   // duoc gan truoc moi nhom tieu chi
      function muc(id, ten, canCo, dangCo, dat, loi) {
        return { chang: changHienTai, id: id, name: ten, expected: canCo, actual: dangCo,
                 passed: dat, message: loi };
      }

      const pcc = ds ? ds.filter(function (l) { return l.action === 'mark connection' && l.inIf === 'bridge-LAN'; }) : [];
      const mr = ds ? ds.filter(function (l) { return l.action === 'mark routing' && l.inIf === 'bridge-LAN'; }) : [];

      MK_BAI6_LUAT_CHUAN.forEach(function (chuan, i) {
        changHienTai = i + 1;
        const c = chup[chuan.du] || null;
        const daLuu = !!c && pcc.length >= i + 1;

        details.push(muc('mk6_luat_' + i, 'Đã tạo ' + chuan.ten + ' (mark connection trên bridge-LAN)',
          'Có trong danh sách Mangle',
          !ds ? CHUA_MO : (daLuu ? 'Đã có' : (c ? 'Đã bấm OK nhưng không thấy trong danh sách' : 'Chưa có')),
          daLuu,
          daLuu ? 'Chính xác' : (!ds ? 'Chưa mở IP > Firewall > Mangle nên không đọc được'
            : 'Chưa tạo luật PCC phần dư ' + chuan.du + ' (Action = mark connection, In. Interface = bridge-LAN)')));

        function tc(id, ten, canCo, doc_, dat, loiSai) {
          details.push(muc('mk6_' + id + '_' + i, chuan.ten + ': ' + ten, canCo,
            c ? doc_ : (ds ? '(chưa tạo luật)' : CHUA_MO), !!c && dat,
            (!!c && dat) ? 'Chính xác' : (!c ? 'Chưa tạo luật này, hoặc chưa nhấn OK để lưu' : loiSai)));
        }
        // Chain CÓ cột trên danh sách (giá trị đã lưu thật) -> chấm từ danh sách,
        // không dùng bản chụp (ô Chain trong hộp thoại là combo, đọc select dễ sai).
        const chainList = (pcc.length > i) ? pcc[i].chain : null;
        details.push(muc('mk6_chain_' + i, chuan.ten + ': Chain = prerouting', 'prerouting',
          !ds ? CHUA_MO : (chainList === null ? '(chưa có luật)' : chainList),
          chainList === 'prerouting',
          chainList === 'prerouting' ? 'Chính xác'
            : (!ds ? 'Chưa mở IP > Firewall > Mangle nên không đọc được'
              : (chainList === null ? 'Chưa tạo luật này' : 'Đây là giá trị mặc định, không được thay đổi'))));
        tc('inif', 'In. Interface = bridge-LAN', 'bridge-LAN',
          c && (c.inIfBat ? c.inIf : 'Còn khoá nên không được lưu'),
          !!c && c.inIfBat && c.inIf === 'bridge-LAN',
          (c && !c.inIfBat) ? 'Chưa bấm nút tam giác để mở khoá ô In. Interface' : 'Phải chọn bridge-LAN');
        tc('cm', 'Connection Mark = no-mark', 'no-mark',
          c && (c.cmBat ? c.cm : 'Còn khoá nên không được lưu'),
          !!c && c.cmBat && c.cm === 'no-mark',
          (c && !c.cmBat) ? 'Chưa bấm nút tam giác để mở khoá ô Connection Mark' : 'Phải là no-mark (chỉ phân loại kết nối chưa gắn nhãn)');
        tc('pcc', 'Per Connection Classifier = both addresses : 2/' + chuan.du, 'both addresses : 2/' + chuan.du,
          c && (c.pccBat ? (c.pccLoai + ' : ' + c.pccMau + '/' + c.pccDu) : 'Còn khoá nên không được lưu'),
          !!c && c.pccBat && c.pccLoai === 'both addresses' && c.pccMau === '2' && c.pccDu === chuan.du,
          (c && !c.pccBat) ? 'Chưa bấm nút tam giác để mở khoá ô Per Connection Classifier'
            : 'Phải là both addresses, mẫu số 2, phần dư ' + chuan.du);
        tc('dat', 'Dst. Address Type = !local (có phủ định)', '!local',
          c && (c.datBat ? ((c.datPhuDinh ? '!' : '') + (c.dat || '(chưa thêm mục)')) : 'Còn khoá nên không được lưu'),
          !!c && c.datBat && c.datPhuDinh && c.dat === 'local',
          (c && !c.datBat) ? 'Chưa bấm nút tam giác để mở khoá ô Dst. Address Type'
            : (c && !c.datPhuDinh) ? 'Chưa bật nút phủ định (phải là KHÔNG phải local)'
            : 'Phải thêm một mục và chọn local');
        tc('action', 'Action = mark connection', 'mark connection', c && c.action,
          !!c && c.action === 'mark connection', 'Phải chọn Action = mark connection');
        tc('ncm', 'New Connection Mark = ' + chuan.mark, chuan.mark, c && (c.ncm || '(để trống)'),
          !!c && c.ncm === chuan.mark, 'Phải chọn ' + chuan.mark + ' (nhớ bấm vào dòng Action để mở khối)');
      });

      // Thứ tự: cả 2 luật PCC phải nằm TRÊN luật mark routing đầu tiên trên bridge-LAN
      changHienTai = 3;
      const mocMR = mr.length ? Math.min.apply(null, mr.map(function (l) { return l.vt; })) : -1;
      const saiCho = (mocMR >= 0) ? pcc.filter(function (l) { return l.vt > mocMR; }).length : 0;
      const duHai = pcc.length >= 2;
      const thuTuDat = !!ds && duHai && saiCho === 0;
      details.push(muc('mk6_thutu', 'Cả 2 luật PCC nằm TRÊN luật "mark routing" đầu tiên',
        'Vị trí luật PCC < vị trí luật mark routing (#' + (mocMR >= 0 ? mocMR : '?') + ')',
        !ds ? CHUA_MO : (!duHai ? 'Mới có ' + pcc.length + '/2 luật PCC'
          : (saiCho ? saiCho + ' luật PCC còn nằm dưới' : 'Đúng thứ tự')),
        thuTuDat,
        thuTuDat ? 'Chính xác' : (!ds ? 'Chưa mở IP > Firewall > Mangle nên không đọc được'
          : (!duHai ? 'Chưa đủ 2 luật PCC'
            : 'Kéo luật PCC lên trên luật mark routing — luật phân loại phải chạy trước luật chọn đường'))));

      function dem(ds) { return ds.filter(function (d) { return d.passed; }).length; }
      const datCaBai = dem(details) === details.length;
      function ketQua(ds, themChang) {
        const r = {
          passed: datCaBai,
          score: Math.round((dem(details) / details.length) * 100),
          passedCount: dem(ds), totalRules: ds.length,
          details: ds.map(function (d) {
            return { id: d.id, name: d.name, expected: d.expected, actual: d.actual,
                     passed: d.passed, message: d.message };
          })
        };
        if (themChang !== undefined) r.trangHienTaiDat = themChang;
        return r;
      }

      /**
       * HƯỚNG DẪN — CHỈ BÁO LỖI CỦA CHẶNG ĐANG LÀM (anh Huynn nhắc 2026-09-20:
       * mới xong luật 1 mà "Xem lỗi sai" đã liệt kê luật 2 "chưa tạo" là sai
       * nguyên tắc "chỉ kiểm tra lỗi ở trang đang mở" của Bài 4). Bài này một
       * trang nhưng có 3 CHẶNG: luật 1 → luật 2 → sắp xếp. Chặng đang làm =
       * chặng ĐẦU TIÊN chưa sạch lỗi. Thực hành / đã đạt cả bài thì chấm đủ 17.
       */
      const laHuongDan = (typeof window.ftcLayCheDo === 'function')
        && window.ftcLayCheDo() === 'guide';
      if (!laHuongDan || datCaBai) return ketQua(details);
      // Chặng đang làm suy từ VIỆC HỌC VIÊN ĐANG LÀM, không phải "chặng đầu chưa
      // sạch" (cách đó vừa xong luật 1 sạch sẽ là lôi ngay luật 2 "chưa tạo" ra —
      // đúng lỗi anh Huynn chụp ảnh 2026-09-20):
      //   - chưa có luật PCC nào             → chặng 1
      //   - có 1 luật: còn lỗi → chặng 1; sạch và đang mở hộp thoại tạo luật
      //     mới → chặng 2; sạch và đang ở danh sách → vẫn chặng 1 (sạch → nút
      //     "Xem lỗi sai" tự ẩn, học viên đi tiếp)
      //   - có ≥2 luật: luật 1 còn lỗi → 1; luật 2 còn lỗi → 2; cả hai sạch → 3
      const loiChang = function (t) {
        return details.some(function (d) { return d.chang === t && !d.passed; });
      };
      const hopThoaiMo = !!doc && mkBai6DocHashL(doc).indexOf('#IP:Firewall.Mangle.') === 0;
      let chang;
      if (pcc.length === 0) chang = 1;
      else if (pcc.length === 1) chang = (hopThoaiMo && !loiChang(1)) ? 2 : 1;
      else chang = loiChang(1) ? 1 : (loiChang(2) ? 2 : 3);
      const dsChang = details.filter(function (d) { return d.chang === chang; });
      return ketQua(dsChang, dem(dsChang) === dsChang.length);
    }
  },

  onSimLoad: function (simWin) {
    try {
      const doc = simWin.document;
      if (doc && doc.querySelector('input#name') && doc.querySelector('input#password')) {
        window._FTC_MK6_DS = null;
        window._FTC_MK6_CHUP = {};
        window._FTC_MK6_SO_PCC = 0;
        window._FTC_MK6_SAI_CHO = 0;
        try { simWin.fetch('/sim_mikrotik_hexs/ftc_dat_lai?bai=6'); } catch (e) {}
      }
      if (!simWin._ftcMkBai6DangTheoDoi) {
        simWin._ftcMkBai6DangTheoDoi = true;
        simWin.setInterval(function () {
          try {
            if (typeof mkBai6Nhip === 'function') mkBai6Nhip(simWin.document);
            mkBai6ChupTheoTrang(simWin.document);
          } catch (e) {}
        }, 500);
      }
    } catch (e) {}
  },

  /** Chụp các ô KHÔNG có cột trên danh sách, ngay lúc bấm OK. Khoá theo phần dư PCC. */
  onSimSave: function (simWin) {
    try {
      const doc = simWin.document;
      if (mkBai6DocHashL(doc).indexOf('#IP:Firewall.Mangle.') !== 0) return;
      const ch0 = mkBai6DocOL(doc, 'Chain', 0), ch1 = mkBai6DocOL(doc, 'Chain', 1);
      const chain = ch0 ? { gt: (ch1 && ch1.gt) ? ch1.gt : ch0.gt } : null;
      const inIf = mkBai6DocOL(doc, 'In. Interface', 0);
      const cm0 = mkBai6DocOL(doc, 'Connection Mark', 0);
      const cm1 = mkBai6DocOL(doc, 'Connection Mark', 1);
      // Combo: chu that nam o o nhap (cm1) neu co, khong thi lay select (cm0)
      const cm = cm0 ? { gt: (cm1 && cm1.gt) ? cm1.gt : cm0.gt, batLen: cm0.batLen } : null;
      const p0 = mkBai6DocOL(doc, 'Per Connection Classifier', 0);
      const p1 = mkBai6DocOL(doc, 'Per Connection Classifier', 1);
      const p2 = mkBai6DocOL(doc, 'Per Connection Classifier', 2);
      const dat = mkBai6DocOL(doc, 'Dst. Address Type', 0);
      const act = mkBai6DocOL(doc, 'Action', 0);
      const n0 = mkBai6DocOL(doc, 'New Connection Mark', 0);
      const n1 = mkBai6DocOL(doc, 'New Connection Mark', 1);
      const ncm = (n1 && n1.gt) ? n1.gt : (n0 ? n0.gt : '');
      const du = (p0 && p0.batLen && p2) ? p2.gt : '';
      const ban = {
        chain: chain ? chain.gt : '',
        inIf: inIf ? inIf.gt : '', inIfBat: !!(inIf && inIf.batLen),
        cm: cm ? cm.gt : '', cmBat: !!(cm && cm.batLen),
        pccLoai: p0 ? p0.gt : '', pccMau: p1 ? p1.gt : '', pccDu: du, pccBat: !!(p0 && p0.batLen),
        dat: dat ? dat.gt : null, datBat: !!(dat && dat.batLen), datPhuDinh: !!(dat && dat.phuDinh),
        action: act ? act.gt : '', ncm: ncm
      };
      window._FTC_MK6_CHUP = window._FTC_MK6_CHUP || {};
      // Khoá = phần dư; chưa mở khoá PCC thì không biết thuộc luật nào -> xếp theo nhãn
      const khoa = du !== '' ? du : (ncm === 'WAN2_conn' ? '1' : '0');
      window._FTC_MK6_CHUP[khoa] = ban;
    } catch (e) {}
  },

  guidePopups: (window.TOOLTIPS_MIKROTIK_HEXS
                && window.TOOLTIPS_MIKROTIK_HEXS['mikrotik_hexs-bai6']) || []
});
