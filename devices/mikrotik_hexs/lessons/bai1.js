/**
 * devices/mikrotik_hexs/lessons/bai1.js
 * Bài 1: Cấu hình PPPoE — MikroTik hEX S
 *
 * Nguồn đề bài: bản lab cũ của FPT (16_authen_log_old/modules/R_MIKROTIK),
 * giá trị User/Password do anh Huynn chốt lại ngày 2026-09-18.
 * User đã sửa lại thành sgfdl-211208-218 theo yêu cầu anh Huynn 2026-09-23
 * (giống đúng đáp án User của Bài 1 Vigor2927 — cùng một bài "Cấu hình PPPoE").
 * Password vẫn là 'ftc1234' — KHÁC với Vigor2927 ('12345678'), nhưng đây là
 * CÓ CHỦ ĐÍCH: anh Huynn xác nhận (2026-09-23) giữ nguyên, là đáp án RIÊNG
 * của MikroTik, không đồng bộ theo Vigor2927.
 *
 * CÁCH ĐỌC GIÁ TRỊ (khác hẳn DrayTek): WebFig không đặt name/id cho ô nhập,
 * mọi ô đều nằm trong <td class="value">, cùng hàng <tr> với <td class="label">
 * chứa tên trường. Vì vậy phải dò theo NHÃN CHỮ — xem mkBai1DocTheoNhan().
 */

window.DEVICE_MIKROTIK_HEXS_LESSONS = window.DEVICE_MIKROTIK_HEXS_LESSONS || [];

/** Đáp án bài lab (User sửa lại 2026-09-23 theo anh Huynn — xem chú thích đầu file). */
var MK_BAI1_DAP_AN = { user: 'sgfdl-211208-218', pass: 'ftc1234' };

/**
 * BẢNG GIÁ TRỊ CHUẨN của trang chi tiết pppoe-out1.
 * Quy ước dự án: mọi giá trị có sẵn khi mở trang đều là ĐÚNG, học viên đổi là SAI
 * (trừ 2 ô User/Password là phần phải làm). Toàn bộ giá trị dưới đây đã ĐO THẬT
 * trên giả lập sau khi gọi /ftc_dat_lai?bai=1 (xoá lớp phủ, trả về gốc thiết bị).
 *   kieu: 'chu'    -> so sánh chuỗi ô text
 *         'chon'   -> so sánh nhãn mục đang chọn của <select>
 *         'tich'   -> so sánh trạng thái tick của checkbox
 *         'nhieu'  -> nhiều checkbox cùng một nhãn (hàng Allow)
 */
var MK_BAI1_CHUAN = [
  { nhan: 'User',                  kieu: 'chu',   dung: 'sgfdl-211208-218', deBai: true,
    ten: 'User: sgfdl-211208-218' },
  { nhan: 'Password',              kieu: 'chu',   dung: 'ftc1234',        deBai: true,
    ten: 'Password: ftc1234' },
  { nhan: 'Enabled',               kieu: 'tich',  dung: true,   ten: 'Enabled: giữ nguyên (có tích)' },
  { nhan: 'Name',                  kieu: 'chu',   dung: 'pppoe-out1', ten: 'Name: giữ nguyên pppoe-out1' },
  { nhan: 'Max MTU',               kieu: 'chu',   dung: '1480', ten: 'Max MTU: giữ nguyên 1480' },
  { nhan: 'Max MRU',               kieu: 'chu',   dung: '1480', ten: 'Max MRU: giữ nguyên 1480' },
  { nhan: 'MRRU',                  kieu: 'chu',   dung: '1614', ten: 'MRRU: giữ nguyên 1614' },
  { nhan: 'Interfaces',            kieu: 'chon',  dung: 'ether1', ten: 'Interfaces: giữ nguyên ether1' },
  { nhan: 'Service',               kieu: 'chu',   dung: '',     ten: 'Service: giữ nguyên (để trống)' },
  { nhan: 'AC Name',               kieu: 'chu',   dung: '',     ten: 'AC Name: giữ nguyên (để trống)' },
  { nhan: 'Host Uniq',             kieu: 'chu',   dung: '',     ten: 'Host Uniq: giữ nguyên (để trống)' },
  { nhan: 'Profile',               kieu: 'chon',  dung: 'default', ten: 'Profile: giữ nguyên default' },
  { nhan: 'Keepalive Timeout',     kieu: 'chu',   dung: '10',   ten: 'Keepalive Timeout: giữ nguyên 10' },
  { nhan: 'Dial On Demand',        kieu: 'tich',  dung: false,  ten: 'Dial On Demand: giữ nguyên (không tích)' },
  { nhan: 'Use Peer DNS',          kieu: 'tich',  dung: true,   ten: 'Use Peer DNS: giữ nguyên (có tích)' },
  { nhan: 'Add Default Route',     kieu: 'tich',  dung: false,  ten: 'Add Default Route: giữ nguyên (không tích)' },
  { nhan: 'Default Route Distance',kieu: 'chu',   dung: '1',    ten: 'Default Route Distance: giữ nguyên 1' },
  { nhan: 'Allow',                 kieu: 'nhieu', dung: [false, false, true, true],
    ten: 'Allow: giữ nguyên (chỉ tích chap và pap)' }
];

/** Tìm hàng <tr> theo nhãn chữ ở cột trái. */
function mkBai1HangTheoNhan(doc, nhan) {
  try {
    for (const tr of doc.querySelectorAll('tr')) {
      const lb = tr.querySelector('td.label');
      if (lb && lb.textContent.trim() === nhan) return tr;
    }
  } catch (e) {}
  return null;
}

/** Tìm ô nhập theo nhãn chữ bên trái cùng hàng. */
function mkBai1OTheoNhan(doc, nhan) {
  const tr = mkBai1HangTheoNhan(doc, nhan);
  return tr ? tr.querySelector('td.value input, td.value select') : null;
}

/** Đọc giá trị ô nhập theo nhãn chữ, trả về chuỗi đã cắt khoảng trắng. */
function mkBai1DocTheoNhan(doc, nhan) {
  const o = mkBai1OTheoNhan(doc, nhan);
  return o ? (o.value || '').trim() : null;
}

/** Đọc giá trị một trường theo đúng kiểu đã khai báo trong MK_BAI1_CHUAN. */
function mkBai1DocTruong(doc, muc) {
  const tr = mkBai1HangTheoNhan(doc, muc.nhan);
  if (!tr) return null;
  if (muc.kieu === 'nhieu') {
    const os = tr.querySelectorAll('td.value input[type="checkbox"]');
    if (!os.length) return null;
    return Array.prototype.map.call(os, function (o) { return !!o.checked; });
  }
  const o = tr.querySelector('td.value input, td.value select');
  if (!o) return null;
  if (muc.kieu === 'tich') return !!o.checked;
  if (muc.kieu === 'chon') {
    const op = o.options ? o.options[o.selectedIndex] : null;
    return op ? op.text.trim() : (o.value || '').trim();
  }
  return (o.value || '').trim();
}

/** Chụp lại toàn bộ trường của trang (dùng lúc bấm OK, trước khi trang đóng). */
function mkBai1ChupTatCa(doc) {
  const ban = {};
  let coGiaTri = false;
  MK_BAI1_CHUAN.forEach(function (muc) {
    const gt = mkBai1DocTruong(doc, muc);
    ban[muc.nhan] = gt;
    if (gt !== null) coGiaTri = true;
  });
  return coGiaTri ? ban : null;
}

/** So sánh giá trị đọc được với giá trị chuẩn. */
function mkBai1SoSanh(muc, gt) {
  if (gt === null || gt === undefined) return false;
  if (muc.kieu === 'nhieu') {
    if (!Array.isArray(gt) || gt.length !== muc.dung.length) return false;
    return muc.dung.every(function (v, i) { return gt[i] === v; });
  }
  return gt === muc.dung;
}

/** Đổi giá trị sang chữ để hiện trong bảng kết quả cho học viên dễ đọc. */
function mkBai1ChuHoaGiaTri(muc, gt) {
  if (gt === null || gt === undefined) return '(chưa mở mục chứa ô này)';
  if (muc.kieu === 'tich') return gt ? 'có tích' : 'không tích';
  if (muc.kieu === 'nhieu') {
    const ten = ['mschap2', 'mschap1', 'chap', 'pap'];
    const co = [];
    (gt || []).forEach(function (v, i) { if (v) co.push(ten[i] || ('#' + i)); });
    return co.length ? co.join(', ') : '(không tích ô nào)';
  }
  return gt === '' ? '(để trống)' : String(gt);
}

/**
 * Theo dõi nền: gắn id cho 2 ô User/Password ngay khi mục Dial Out được bung.
 * WebFig không đặt name/id cho ô nhập nên nếu không gắn thì tooltip Bước 4/5
 * chỉ trỏ được vào nhãn chữ, không trỏ được vào chính ô nhập.
 *
 * KHÔNG đặt lại giá trị mặc định ở đây: đã đo thực tế (2026-09-18) thấy WebFig
 * đồng bộ liên tục từ máy chủ và ghi đè lại sau ~4 giây. Việc đặt lại về
 * fpt/123 làm ở tầng máy chủ — xem onSimLoad gọi /ftc_dat_lai?bai=1.
 */
function mkBai1CaiTheoDoi(win) {
  try {
    if (win._ftcMkBai1DangTheoDoi) return;
    win._ftcMkBai1DangTheoDoi = true;
    win.setInterval(function () {
      try {
        const doc = win.document;
        const oUser = mkBai1OTheoNhan(doc, 'User');
        const oPass = mkBai1OTheoNhan(doc, 'Password');
        if (!oUser || !oPass) return;
        if (!oUser.id) oUser.id = 'ftc-mk-user';
        if (!oPass.id) oPass.id = 'ftc-mk-pass';
      } catch (e) {}
    }, 600);
  } catch (e) {}
}

window.DEVICE_MIKROTIK_HEXS_LESSONS.push({
  id: 'mikrotik_hexs-bai1',
  title: 'Cấu hình PPPoE',
  subtitle: 'Cấu hình quay số PPPoE trên MikroTik',
  instructions: [
    '<b>Yêu cầu:</b>',
    'Cấu hình quay số PPPoE trên router MikroTik hEX S',
    '<b>Mô hình:</b> SFU kết nối với Router qua cổng Ethernet1',
    '- Username: <span class="val">admin</span>',
    '- Password: <span class="val">admin</span>',
    '- Vào menu <b>PPP</b>, nhấn đúp vào giao diện <b>pppoe-out1</b>',
    '- Mở rộng mục <b>Dial Out</b>',
    '- User: <span class="val">sgfdl-211208-218</span>',
    '- Password: <span class="val">ftc1234</span>',
    '- Nhấn <b>OK</b> để lưu cấu hình'
  ],
  practiceUrl: '/sim_mikrotik_hexs/index.html',
  grading: {
    description: 'Kiểm tra cấu hình PPPoE Client trên MikroTik hEX S',
    rules: [
      {
        id: 'pppoe_user',
        name: 'User: sgfdl-211208-218',
        selector: '#ftc-mk-user',
        expected: 'sgfdl-211208-218',
        type: 'text_exact',
        required: true
      },
      {
        id: 'pppoe_pass',
        name: 'Password: ftc1234',
        selector: '#ftc-mk-pass',
        expected: 'ftc1234',
        type: 'text_exact',
        required: true
      }
    ],
    customGrading: function (allDocs) {
      // Tìm document đang mở trang chi tiết pppoe-out1 (trang này có hàng "Name")
      let doc = null;
      for (const d of allDocs) {
        try {
          if (mkBai1HangTheoNhan(d, 'Name')) { doc = d; break; }
        } catch (e) {}
      }

      // Bấm OK xong WebFig TỰ ĐÓNG trang chi tiết (quay về #PPP) nên lúc chấm
      // thường không còn DOM để đọc -> lấy bản chụp đã lưu trong onSimSave.
      const banChup = window._FTC_MK_BAI1 || null;

      if (!doc && !banChup) {
        return {
          passed: false, score: 0, passedCount: 0, totalRules: MK_BAI1_CHUAN.length,
          details: [{
            id: 'chua_mo_trang',
            name: 'Trang cấu hình pppoe-out1',
            expected: 'Đã mở trang chi tiết pppoe-out1',
            actual: 'Chưa mở',
            passed: false,
            message: 'Vui lòng vào menu PPP rồi nhấn đúp vào giao diện pppoe-out1'
          }]
        };
      }

      const daLuu = !!(banChup || (doc && doc._ftcIsSaved) || window._hasClickedSaveInGuide);

      const details = [];
      let soDung = 0;
      MK_BAI1_CHUAN.forEach(function (muc) {
        // Ưu tiên giá trị đang hiển thị; nếu trang đã đóng thì lấy bản chụp.
        let gt = doc ? mkBai1DocTruong(doc, muc) : null;
        if (gt === null && banChup) gt = banChup[muc.nhan];

        const dat = mkBai1SoSanh(muc, gt) && daLuu;
        if (dat) soDung++;

        let loi;
        if (dat) loi = 'Chính xác';
        else if (gt === null || gt === undefined) loi = 'Chưa mở mục chứa ô này nên không đọc được giá trị';
        else if (!daLuu) loi = 'Chưa nhấn OK để lưu cấu hình';
        else if (muc.deBai) loi = 'Giá trị không đúng yêu cầu đề bài';
        else loi = 'Đây là giá trị mặc định, không được thay đổi';

        details.push({
          id: 'mk_' + muc.nhan.replace(/[^A-Za-z0-9]/g, '_').toLowerCase(),
          name: muc.ten,
          expected: mkBai1ChuHoaGiaTri(muc, muc.dung),
          actual: mkBai1ChuHoaGiaTri(muc, gt),
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
   * Xoá bản chụp cũ khi học viên mở lại bài (đang ở màn đăng nhập), để lần làm
   * mới không ăn theo kết quả của lần trước.
   */
  onSimLoad: function (simWin) {
    try {
      const doc = simWin.document;
      if (doc && doc.querySelector('input#name') && doc.querySelector('input#password')) {
        // Đang ở màn đăng nhập = lượt làm bài mới: xoá bản chụp cũ và gọi máy
        // chủ đặt lại User/Password về mặc định fpt/123.
        // PHẢI đặt lại ở MÁY CHỦ, không đặt được bằng JS: WebFig đồng bộ liên
        // tục nên mọi thay đổi phía trình duyệt bị ghi đè lại sau ~4 giây
        // (đã đo thực tế 2026-09-18).
        window._FTC_MK_BAI1 = null;
        simWin._ftcMkBai1DaDatLai = false;
        try { simWin.fetch('/sim_mikrotik_hexs/ftc_dat_lai?bai=1'); } catch (e) {}
      }
      mkBai1CaiTheoDoi(simWin);
    } catch (e) {}
  },

  /**
   * Chụp lại User/Password NGAY LÚC bấm OK. Bắt buộc phải có: sau khi bấm OK,
   * WebFig tự đóng trang chi tiết và quay về danh sách #PPP, lúc chấm điểm sẽ
   * không còn ô nào để đọc nữa.
   */
  onSimSave: function (simWin) {
    try {
      const doc = simWin.document;
      const ban = mkBai1ChupTatCa(doc);
      if (ban) window._FTC_MK_BAI1 = ban;
    } catch (e) {}
  },

  guidePopups: (window.TOOLTIPS_MIKROTIK_HEXS
                && window.TOOLTIPS_MIKROTIK_HEXS['mikrotik_hexs-bai1']) || []
});
