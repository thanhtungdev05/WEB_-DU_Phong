/**
 * devices/mikrotik_hexs/lessons/bai5.js
 * Bài 5: Cấu hình DNS — MikroTik hEX S
 *
 * Đề bài (4 bước tooltip do anh Huynn tự làm — xem tooltips/bai5.js): vào
 * IP > DNS, XOÁ BỚT 4 máy chủ DNS của Cloudflare khỏi danh sách "Servers"
 * (1.1.1.1, 1.0.0.1, 2606:4700:4700::1111, 2606:4700:4700::1001), chỉ giữ lại
 * 4 máy chủ của Google, rồi bấm Apply để lưu.
 *
 * ĐÁP ÁN — đo THẬT trên giả lập 2026-09-19 (đúng ảnh anh Huynn gửi): danh sách
 * Servers gốc của thiết bị có ĐỦ 8 mục (4 IPv4 + 4 IPv6); sau bài học chỉ còn
 * 4 mục Google. Mọi ô còn lại trên trang là mặc định của thiết bị, đổi khác đi
 * là SAI.
 *
 * KIẾN TRÚC — khác Bài 3/4 ở một điểm quan trọng:
 *   - Đây là trang MỤC ĐƠN (scalar `[14,2]`), KHÔNG phải bảng. Trang chỉ có
 *     nút **Apply** (không có OK/Cancel) và **KHÔNG tự đóng** sau khi lưu, nên
 *     `customGrading` đọc thẳng DOM đang mở được. Vẫn giữ bản chụp trong
 *     `onSimSave` làm phương án dự phòng, y như Bài 2/3, phòng khi học viên
 *     chuyển sang trang khác trước lúc nộp bài.
 *   - Cách XOÁ một mục trong danh sách nhiều giá trị của WebFig: bấm nút tam
 *     giác `▲` (`img src="up.svg"`) ở BÊN PHẢI dòng đó — ĐO THẬT: bấm nút thứ
 *     3 thì đúng dòng thứ 3 biến mất, danh sách còn 7. (Nút `▼` `down.svg` bên
 *     trái là menu chọn, không xoá.)
 *   - Kho cấu hình MikroTik LƯU BỀN nên bắt buộc có `/ftc_dat_lai?bai=5` (xoá
 *     lớp phủ scalar `[14,2]`), nếu không học viên sau vào đã thấy 4 máy chủ
 *     bị xoá sẵn, không còn gì để làm — đúng vết xe đã đổ ở Bài 3.
 */

window.DEVICE_MIKROTIK_HEXS_LESSONS = window.DEVICE_MIKROTIK_HEXS_LESSONS || [];

/** Tìm hàng <tr> theo nhãn chữ ở cột trái (khớp CHÍNH XÁC để không nhầm
 *  "Servers" với "Dynamic Servers" hay "Use DoH Server"). */
function mkBai5HangTheoNhan(doc, nhan) {
  try {
    for (const tr of doc.querySelectorAll('tr')) {
      const lb = tr.querySelector('td.label');
      if (lb && lb.textContent.trim() === nhan) return tr;
    }
  } catch (e) {}
  return null;
}

/** Đọc danh sách máy chủ DNS đang có trong hàng "Servers". */
function mkBai5DocDanhSachServers(doc) {
  const tr = mkBai5HangTheoNhan(doc, 'Servers');
  if (!tr) return null;
  try {
    return Array.from(tr.querySelectorAll('input'))
      .map(function (o) { return (o.value || '').trim(); })
      .filter(function (v) { return v !== ''; });
  } catch (e) {}
  return null;
}

/** 4 máy chủ Cloudflare phải XOÁ (đề bài). */
var MK_BAI5_PHAI_XOA = [
  '1.1.1.1',
  '1.0.0.1',
  '2606:4700:4700::1111',
  '2606:4700:4700::1001'
];

/** 4 máy chủ Google phải GIỮ LẠI (đề bài). */
var MK_BAI5_PHAI_GIU = [
  '8.8.8.8',
  '8.8.4.4',
  '2001:4860:4860::8888',
  '2001:4860:4860::8844'
];

/**
 * Các ô còn lại trên trang IP > DNS — ĐO THẬT 2026-09-19, khớp đúng ảnh anh
 * Huynn gửi. Tất cả đều là "giữ nguyên mặc định", đổi khác đi là SAI.
 *
 * CHỈ lấy các ô ĐANG HIỂN THỊ. Nhóm DoH (Verify DoH Certificate, DoH Max
 * Server Connections, DoH Max Concurrent Queries, DoH Timeout) bị WebFig ẩn
 * khi ô "Use DoH Server" còn trống — học viên không nhìn thấy thì không chấm.
 */
var MK_BAI5_CHUAN = [
  { nhan: 'Use DoH Server', kieu: 'chu', dung: '', ten: 'Use DoH Server: giữ nguyên (để trống)' },
  { nhan: 'Allow Remote Requests', kieu: 'tich', dung: true, ten: 'Allow Remote Requests: giữ nguyên (có tích)' },
  { nhan: 'Max UDP Packet Size', kieu: 'chu', dung: '4096', ten: 'Max UDP Packet Size: giữ nguyên 4096' },
  { nhan: 'Query Server Timeout', kieu: 'chu', dung: '2.000', ten: 'Query Server Timeout: giữ nguyên 2.000' },
  { nhan: 'Query Total Timeout', kieu: 'chu', dung: '10.000', ten: 'Query Total Timeout: giữ nguyên 10.000' },
  { nhan: 'Max. Concurrent Queries', kieu: 'chu', dung: '100', ten: 'Max. Concurrent Queries: giữ nguyên 100' },
  { nhan: 'Max. Concurrent TCP Sessions', kieu: 'chu', dung: '20', ten: 'Max. Concurrent TCP Sessions: giữ nguyên 20' },
  { nhan: 'Cache Size', kieu: 'chu', dung: '2048', ten: 'Cache Size: giữ nguyên 2048 KiB' },
  { nhan: 'Cache Max TTL', kieu: 'chu', dung: '7d 00:00:00', ten: 'Cache Max TTL: giữ nguyên 7d 00:00:00' }
];

function mkBai5DocTruong(doc, muc) {
  const tr = mkBai5HangTheoNhan(doc, muc.nhan);
  if (!tr) return null;
  try {
    if (muc.kieu === 'tich') {
      const o = tr.querySelector('input[type=checkbox]');
      return o ? !!o.checked : null;
    }
    const o = tr.querySelectorAll('input, select, textarea')[muc.idx || 0];
    if (!o) return null;
    return (o.value || '').trim();
  } catch (e) {}
  return null;
}

function mkBai5ChuHoaGiaTri(muc, gt) {
  if (gt === null || gt === undefined) return '(chưa mở trang này)';
  if (muc.kieu === 'tich') return gt ? 'có tích' : 'không tích';
  return gt === '' ? '(để trống)' : String(gt);
}

/** Chụp toàn bộ giá trị của trang DNS ngay lúc bấm Apply. */
function mkBai5ChupTatCa(doc) {
  const ban = { servers: mkBai5DocDanhSachServers(doc), o: {} };
  let coGiaTri = (ban.servers !== null);
  MK_BAI5_CHUAN.forEach(function (muc) {
    const gt = mkBai5DocTruong(doc, muc);
    ban.o[muc.nhan] = gt;
    if (gt !== null) coGiaTri = true;
  });
  return coGiaTri ? ban : null;
}

window.DEVICE_MIKROTIK_HEXS_LESSONS.push({
  id: 'mikrotik_hexs-bai5',
  title: 'Cấu hình DNS',
  subtitle: 'Cấu hình máy chủ phân giải tên miền',
  instructions: [
    '<b>Yêu cầu:</b>',
    'Rút gọn danh sách máy chủ DNS của router, chỉ dùng DNS của Google',
    '- Username: <span class="val">admin</span>',
    '- Password: <span class="val">admin</span>',
    '- Vào <b>IP > DNS</b>',
    '- Tại ô <b>Servers</b>, xoá 4 máy chủ: <span class="val">1.1.1.1</span>, <span class="val">1.0.0.1</span>, <span class="val">2606:4700:4700::1111</span>, <span class="val">2606:4700:4700::1001</span>',
    '- Giữ lại 4 máy chủ: <span class="val">8.8.8.8</span>, <span class="val">8.8.4.4</span>, <span class="val">2001:4860:4860::8888</span>, <span class="val">2001:4860:4860::8844</span>',
    '- Các thông số còn lại giữ nguyên mặc định, sau đó nhấn <b>Apply</b> để lưu.'
  ],
  practiceUrl: '/sim_mikrotik_hexs/index.html',
  grading: {
    description: 'Kiểm tra cấu hình DNS (danh sách Servers) trên MikroTik hEX S',
    rules: [
      { id: 'dns_servers', name: 'Danh sách máy chủ DNS', selector: 'tr', expected: '8.8.8.8', type: 'text_contains', required: true }
    ],
    customGrading: function (allDocs) {
      let doc = null;
      for (const d of allDocs) {
        try {
          if (typeof mkBai5OTrangDNS === 'function' && mkBai5OTrangDNS(d)) { doc = d; break; }
        } catch (e) {}
      }

      const banChup = window._FTC_MK_BAI5 || null;
      const daLuu = !!window._FTC_MK_BAI5_SAVED;

      if (!doc && !banChup) {
        const tong = MK_BAI5_CHUAN.length + MK_BAI5_PHAI_XOA.length + 1;
        return {
          passed: false, score: 0, passedCount: 0, totalRules: tong,
          details: [{
            id: 'chua_mo_trang',
            name: 'Trang cấu hình DNS',
            expected: 'Đã mở IP > DNS',
            actual: 'Chưa mở',
            passed: false,
            message: 'Vui lòng vào IP > DNS để bắt đầu làm bài'
          }]
        };
      }

      let dsServers = doc ? mkBai5DocDanhSachServers(doc) : null;
      if (dsServers === null && banChup) dsServers = banChup.servers;

      const details = [];
      let soDung = 0;

      // ── Tiêu chí đề bài 1–4: đã xoá đủ 4 máy chủ Cloudflare ──────────
      MK_BAI5_PHAI_XOA.forEach(function (ip, i) {
        const conSot = !!(dsServers && dsServers.indexOf(ip) !== -1);
        const dat = (dsServers !== null) && !conSot && daLuu;
        if (dat) soDung++;
        details.push({
          id: 'mk5_xoa_' + i,
          name: 'Đã xoá máy chủ DNS ' + ip,
          expected: 'Không còn trong danh sách Servers',
          actual: dsServers === null ? '(chưa mở trang này)' : (conSot ? 'Vẫn còn trong danh sách' : 'Đã xoá'),
          passed: dat,
          message: dat ? 'Chính xác'
            : (dsServers === null ? 'Chưa mở trang IP > DNS nên không đọc được danh sách'
              : (!daLuu ? 'Chưa nhấn Apply để lưu cấu hình'
                : 'Máy chủ này phải được xoá khỏi danh sách Servers'))
        });
      });

      // ── Tiêu chí đề bài 5: giữ lại đủ 4 máy chủ Google ──────────────
      const thieu = MK_BAI5_PHAI_GIU.filter(function (ip) {
        return !(dsServers && dsServers.indexOf(ip) !== -1);
      });
      const duGoogle = (dsServers !== null) && thieu.length === 0 && daLuu;
      if (duGoogle) soDung++;
      details.push({
        id: 'mk5_giu_google',
        name: 'Giữ lại đủ 4 máy chủ DNS của Google',
        expected: MK_BAI5_PHAI_GIU.join(', '),
        actual: dsServers === null ? '(chưa mở trang này)'
          : (dsServers.length ? dsServers.join(', ') : '(danh sách trống)'),
        passed: duGoogle,
        message: duGoogle ? 'Chính xác'
          : (dsServers === null ? 'Chưa mở trang IP > DNS nên không đọc được danh sách'
            : (!daLuu ? 'Chưa nhấn Apply để lưu cấu hình'
              : 'Thiếu/đã xoá nhầm máy chủ phải giữ lại: ' + thieu.join(', ')))
      });

      // ── Các ô còn lại: giữ nguyên mặc định ──────────────────────────
      MK_BAI5_CHUAN.forEach(function (muc, idx) {
        let gt = doc ? mkBai5DocTruong(doc, muc) : null;
        if ((gt === null || gt === undefined) && banChup) gt = banChup.o[muc.nhan];
        const dat = (gt !== null && gt !== undefined) && gt === muc.dung && daLuu;
        if (dat) soDung++;

        let loi;
        if (dat) loi = 'Chính xác';
        else if (gt === null || gt === undefined) loi = 'Chưa mở trang này nên không đọc được giá trị';
        else if (!daLuu) loi = 'Chưa nhấn Apply để lưu cấu hình';
        else loi = 'Đây là giá trị mặc định, không được thay đổi';

        details.push({
          id: 'mk5_' + idx,
          name: muc.ten,
          expected: mkBai5ChuHoaGiaTri(muc, muc.dung),
          actual: mkBai5ChuHoaGiaTri(muc, gt),
          passed: dat,
          message: loi
        });
      });

      const tong = details.length;
      return {
        passed: soDung === tong && daLuu,
        score: Math.round((soDung / tong) * 100),
        passedCount: soDung,
        totalRules: tong,
        details: details
      };
    }
  },

  /**
   * Đặt lại danh sách DNS Servers mỗi lượt mở bài — BẮT BUỘC, vì kho cấu hình
   * MikroTik lưu bền: học viên trước xoá 4 máy chủ rồi thì học viên sau vào
   * đã thấy danh sách rút gọn sẵn, không còn gì để làm (đã vấp thật ở Bài 3).
   */
  onSimLoad: function (simWin) {
    try {
      const doc = simWin.document;
      if (doc && doc.querySelector('input#name') && doc.querySelector('input#password')) {
        window._FTC_MK_BAI5 = null;
        window._FTC_MK_BAI5_SAVED = false;
        try { simWin.fetch('/sim_mikrotik_hexs/ftc_dat_lai?bai=5'); } catch (e) {}
      }
      if (!simWin._ftcMkBai5DangTheoDoi) {
        simWin._ftcMkBai5DangTheoDoi = true;
        simWin.setInterval(function () {
          try {
            if (typeof mkBai5CaiTheoDoi === 'function') {
              mkBai5CaiTheoDoi(simWin.document);
            }
          } catch (e) {}
        }, 500);
      }
    } catch (e) {}
  },

  /** Chụp giá trị NGAY LÚC bấm Apply (phòng khi học viên rời trang rồi mới nộp). */
  onSimSave: function (simWin) {
    try {
      const doc = simWin.document;
      if (typeof mkBai5OTrangDNS !== 'function' || !mkBai5OTrangDNS(doc)) return;
      const ban = mkBai5ChupTatCa(doc);
      if (ban) {
        window._FTC_MK_BAI5 = ban;
        window._FTC_MK_BAI5_SAVED = true;
      }
    } catch (e) {}
  },

  guidePopups: (window.TOOLTIPS_MIKROTIK_HEXS
                && window.TOOLTIPS_MIKROTIK_HEXS['mikrotik_hexs-bai5']) || []
});
