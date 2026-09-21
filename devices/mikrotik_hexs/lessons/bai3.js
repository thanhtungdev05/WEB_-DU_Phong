/**
 * devices/mikrotik_hexs/lessons/bai3.js
 * Bài 3: Cấu hình Bind IP to MAC — MikroTik hEX S
 *
 * Đề bài (9 bước tooltip do anh Huynn tự làm — xem tooltips/bai3.js): vào
 * IP > DHCP Server > Leases, mở dòng máy PC1 (192.168.1.249, đang Dynamic),
 * bấm "Make Static" để gán cố định IP theo MAC, rồi đặt Comment = "Server 1"
 * và Apply/OK để lưu.
 *
 * ĐÁP ÁN — đo THẬT trên giả lập 2026-09-19 (đúng ảnh anh Huynn gửi): mọi giá
 * trị hiển thị trên trang chi tiết lease sau khi Make Static là ĐÚNG, đổi
 * khác đi là SAI — riêng ô Comment là đề bài (học viên tự nhập "Server 1")
 * và việc "đã Make Static" là yêu cầu cốt lõi của cả bài.
 *
 * KIẾN TRÚC: giống Bài 1/4 (xem ghi chú ở lessons/bai4.js) — WebFig là SPA
 * dùng chung 1 document suốt phiên, trang chi tiết TỰ ĐÓNG sau khi OK nên
 * phải chụp giá trị trong `onSimSave`. "Make Static" là lệnh `doit` (không
 * phải Apply/OK) nên KHÔNG tự set `_ftcIsSaved` — phải tự đọc từ DOM xem nút
 * "Make Static" còn hiển thị hay không (còn hiện = chưa bấm, đã ẩn = đã bấm).
 */

window.DEVICE_MIKROTIK_HEXS_LESSONS = window.DEVICE_MIKROTIK_HEXS_LESSONS || [];

/** Đang là trang chi tiết ĐÚNG lease của PC1 (192.168.1.249)? */
function mkBai3LaLeasePC1(doc) {
  try {
    if (typeof mkBai3OChiTietLease !== 'function' || !mkBai3OChiTietLease(doc)) return false;
    for (const el of doc.querySelectorAll('h1, h2, h3, div, span, td')) {
      if (el.textContent && el.textContent.indexOf('192.168.1.249') !== -1 && el.offsetParent !== null) return true;
    }
  } catch (e) {}
  return false;
}

/** Tìm hàng <tr> theo nhãn chữ ở cột trái. */
function mkBai3HangTheoNhan(doc, nhan) {
  try {
    for (const tr of doc.querySelectorAll('tr')) {
      const lb = tr.querySelector('td.label');
      if (lb && lb.textContent.trim() === nhan) return tr;
    }
  } catch (e) {}
  return null;
}

/**
 * Bảng giá trị chuẩn trên trang chi tiết lease (SAU khi Make Static) — đo
 * thật 2026-09-19, khớp đúng ảnh anh Huynn gửi. Hàng "Address" có 2 ô
 * (select rỗng + input giá trị thật) giống mẫu Bài 2 nên dùng `idx: 1`.
 */
var MK_BAI3_CHUAN = [
  { nhan: 'Comment', kieu: 'chu', idx: 0, dung: 'Server 1', deBai: true, ten: 'Comment: Server 1' },
  { nhan: 'Enabled', kieu: 'tich', dung: true, ten: 'Enabled: giữ nguyên (có tích)' },
  { nhan: 'Address', kieu: 'chu', idx: 1, dung: '192.168.1.249', ten: 'Address: giữ nguyên 192.168.1.249' },
  { nhan: 'MAC Address', kieu: 'chu', idx: 0, dung: '00:50:79:66:68:00', ten: 'MAC Address: giữ nguyên 00:50:79:66:68:00' },
  { nhan: 'Use Src. MAC Address', kieu: 'tich', dung: false, ten: 'Use Src. MAC Address: giữ nguyên (không tích)' },
  { nhan: 'Client ID', kieu: 'chu', idx: 0, dung: '1:0:50:79:66:68:0', ten: 'Client ID: giữ nguyên 1:0:50:79:66:68:0' },
  { nhan: 'Server', kieu: 'chon', idx: 0, dung: 'LAN-DHCP-Server', ten: 'Server: giữ nguyên LAN-DHCP-Server' },
  { nhan: 'Lease Time', kieu: 'chu', idx: 0, dung: '00:00:00', ten: 'Lease Time: giữ nguyên' },
  { nhan: 'Block Access', kieu: 'tich', dung: false, ten: 'Block Access: giữ nguyên (không tích)' },
  { nhan: 'Allow Dual Stack Queue', kieu: 'tich', dung: true, ten: 'Allow Dual Stack Queue: giữ nguyên (có tích)' },
  { nhan: 'Always Broadcast', kieu: 'tich', dung: false, ten: 'Always Broadcast: giữ nguyên (không tích)' },
  { nhan: 'DHCP Option Set', kieu: 'chu', idx: 0, dung: '', ten: 'DHCP Option Set: giữ nguyên (để trống)' },
  { nhan: 'Rate Limit', kieu: 'chu', idx: 0, dung: '', ten: 'Rate Limit: giữ nguyên (để trống)' },
  { nhan: 'Routes', kieu: 'chu', idx: 0, dung: '', ten: 'Routes: giữ nguyên (để trống)' },
  { nhan: 'Insert Queue Before', kieu: 'chon', idx: 0, dung: 'first', ten: 'Insert Queue Before: giữ nguyên (first)' }
];

function mkBai3DocTruong(doc, muc) {
  const tr = mkBai3HangTheoNhan(doc, muc.nhan);
  if (!tr) return null;
  if (muc.kieu === 'tich') {
    const o = tr.querySelector('input[type=checkbox]');
    return o ? !!o.checked : null;
  }
  const os = tr.querySelectorAll('input, select, textarea');
  const o = os[muc.idx || 0];
  if (!o) return null;
  if (muc.kieu === 'chon') {
    const op = o.options ? o.options[o.selectedIndex] : null;
    return op && op.text ? op.text.trim() : (o.value || '').trim();
  }
  return (o.value || '').trim();
}

function mkBai3SoSanh(muc, gt) {
  if (gt === null || gt === undefined) return false;
  return gt === muc.dung;
}

function mkBai3ChuHoaGiaTri(muc, gt) {
  if (gt === null || gt === undefined) return '(chưa mở trang này)';
  if (muc.kieu === 'tich') return gt ? 'có tích' : 'không tích';
  return gt === '' ? '(để trống)' : String(gt);
}

/** Khoá duy nhất cho 1 tiêu chí (nhãn + chỉ số ô, phòng khi có nhãn trùng). */
function mkBai3KhoaMuc(muc) {
  return muc.nhan + '#' + (muc.idx || 0);
}

/** Chụp toàn bộ giá trị của trang chi tiết lease PC1 ngay lúc bấm Apply/OK. */
function mkBai3ChupTatCa(doc) {
  const ban = {};
  let coGiaTri = false;
  MK_BAI3_CHUAN.forEach(function (muc) {
    const gt = mkBai3DocTruong(doc, muc);
    ban[mkBai3KhoaMuc(muc)] = gt;
    if (gt !== null) coGiaTri = true;
  });
  return coGiaTri ? ban : null;
}

window.DEVICE_MIKROTIK_HEXS_LESSONS.push({
  id: 'mikrotik_hexs-bai3',
  title: 'Cấu hình Bind IP to MAC',
  subtitle: 'Gán cố định IP theo địa chỉ MAC',
  instructions: [
    '<b>Yêu cầu:</b>',
    'Gán cố định (Bind) địa chỉ IP theo MAC cho máy PC1 đang thuê DHCP động',
    '- Username: <span class="val">admin</span>',
    '- Password: <span class="val">admin</span>',
    '- Vào <b>IP > DHCP Server > Leases</b>, mở dòng máy <b>PC1 (192.168.1.249)</b>',
    '- Nhấn <b>Make Static</b> để gán cố định IP theo MAC, rồi <b>Close</b>',
    '- Mở lại dòng đó, đặt Comment: <span class="val">Server 1</span>',
    '- Các thông số còn lại giữ nguyên mặc định, sau đó nhấn <b>Apply</b> và <b>OK</b> để lưu.'
  ],
  practiceUrl: '/sim_mikrotik_hexs/index.html',
  grading: {
    description: 'Kiểm tra Bind IP to MAC (Make Static) cho PC1 trên MikroTik hEX S',
    rules: [
      { id: 'comment', name: 'Comment: Server 1', selector: '#ftc-mk3-comment-input', expected: 'Server 1', type: 'text_exact', required: true }
    ],
    customGrading: function (allDocs) {
      let doc = null;
      for (const d of allDocs) {
        try { if (mkBai3LaLeasePC1(d)) { doc = d; break; } } catch (e) {}
      }

      const banChup = window._FTC_MK_BAI3 || null;
      const daLuu = !!window._FTC_MK_BAI3_SAVED;

      if (!doc && !banChup) {
        const tong = MK_BAI3_CHUAN.length + 1;
        return {
          passed: false, score: 0, passedCount: 0, totalRules: tong,
          details: [{
            id: 'chua_mo_trang',
            name: 'Trang chi tiết Lease của PC1',
            expected: 'Đã mở dòng PC1 (192.168.1.249) trong IP > DHCP Server > Leases',
            actual: 'Chưa mở',
            passed: false,
            message: 'Vui lòng vào IP > DHCP Server > Leases, mở dòng 192.168.1.249 để bắt đầu'
          }]
        };
      }

      const daStatic = doc
        ? (typeof mkBai3ChiTietCoMakeStatic === 'function' ? !mkBai3ChiTietCoMakeStatic(doc) : null)
        : !!window._FTC_MK_BAI3_DA_STATIC;

      const details = [];
      let soDung = 0;

      const datStatic = daStatic === true && daLuu;
      if (datStatic) soDung++;
      details.push({
        id: 'mk3_static',
        name: 'Đã bấm "Make Static" trước khi lưu (lease không còn Dynamic)',
        expected: 'Đã Make Static',
        actual: daStatic === null ? '(không xác định)' : (daStatic ? 'Đã Make Static' : 'Còn là Dynamic'),
        passed: datStatic,
        message: datStatic ? 'Chính xác'
          : (!daLuu ? 'Chưa nhấn Apply/OK để lưu cấu hình' : 'Chưa bấm "Make Static" trước khi lưu')
      });

      MK_BAI3_CHUAN.forEach(function (muc, idx) {
        let gt = doc ? mkBai3DocTruong(doc, muc) : null;
        if (gt === null && banChup) gt = banChup[mkBai3KhoaMuc(muc)];
        const dat = mkBai3SoSanh(muc, gt) && daLuu;
        if (dat) soDung++;

        let loi;
        if (dat) loi = 'Chính xác';
        else if (gt === null || gt === undefined) loi = 'Chưa mở trang này nên không đọc được giá trị';
        else if (!daLuu) loi = 'Chưa nhấn Apply/OK để lưu cấu hình';
        else if (muc.deBai) loi = 'Giá trị không đúng yêu cầu đề bài';
        else loi = 'Đây là giá trị mặc định, không được thay đổi';

        details.push({
          id: 'mk3_' + idx,
          name: muc.ten,
          expected: mkBai3ChuHoaGiaTri(muc, muc.dung),
          actual: mkBai3ChuHoaGiaTri(muc, gt),
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
   * Đặt lại bảng DHCP Leases mỗi lượt mở bài. Bài này dùng tính năng "Make
   * Static" — thao tác đó ghi cờ `dynamic = false` vào kho, mà kho cấu hình
   * MikroTik LƯU BỀN, nên không đặt lại thì học viên sau vào đã thấy lease
   * thành static sẵn, không còn nút "Make Static" để bấm (đã vấp thật khi
   * kiểm thử 2026-09-19).
   */
  onSimLoad: function (simWin) {
    try {
      const doc = simWin.document;
      if (doc && doc.querySelector('input#name') && doc.querySelector('input#password')) {
        window._FTC_MK_BAI3 = null;
        window._FTC_MK_BAI3_SAVED = false;
        window._FTC_MK_BAI3_DA_STATIC = false;
        try { simWin.fetch('/sim_mikrotik_hexs/ftc_dat_lai?bai=3'); } catch (e) {}
      }
      if (!simWin._ftcMkBai3DangTheoDoi) {
        simWin._ftcMkBai3DangTheoDoi = true;
        simWin.setInterval(function () {
          try {
            if (typeof mkBai3CaiTheoDoi === 'function') {
              mkBai3CaiTheoDoi(simWin.document);
            }
          } catch (e) {}
        }, 500);
      }
    } catch (e) {}
  },

  /** Chụp giá trị NGAY LÚC bấm Apply/OK (trang chi tiết tự đóng ngay sau đó). */
  onSimSave: function (simWin) {
    try {
      const doc = simWin.document;
      if (!mkBai3LaLeasePC1(doc)) return;
      const ban = mkBai3ChupTatCa(doc);
      if (ban) {
        window._FTC_MK_BAI3 = ban;
        window._FTC_MK_BAI3_SAVED = true;
        window._FTC_MK_BAI3_DA_STATIC = (typeof mkBai3ChiTietCoMakeStatic === 'function')
          ? !mkBai3ChiTietCoMakeStatic(doc) : null;
      }
    } catch (e) {}
  },

  guidePopups: (window.TOOLTIPS_MIKROTIK_HEXS
                && window.TOOLTIPS_MIKROTIK_HEXS['mikrotik_hexs-bai3']) || []
});
