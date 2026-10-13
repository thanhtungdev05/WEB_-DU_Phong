/**
 * devices/mikrotik_hexs/lessons/bai2.js
 * Bài 2: Cấu hình giới hạn băng thông (Simple Queue) — MikroTik hEX S
 *
 * Đề bài: Queues > Add New, tạo 1 Simple Queue giới hạn băng thông cho dải
 * LAN 192.168.1.0/24 — Name `under_5M`, Target `192.168.1.0/24`,
 * Max Limit: Target Upload `2M`, Target Download `5M`.
 *
 * ĐÁP ÁN LẤY TỪ 2 ẢNH anh Huynn gửi 2026-09-19 — anh chốt: mọi giá trị hiển
 * thị trong các ô trên 2 ảnh đó là ĐÚNG, khác đi là SAI. **Nút Apply là nút
 * kiểm tra** (WebFig giữ trang mở sau khi Apply nên vẫn đọc được giá trị).
 *
 * KIẾN TRÚC: giống Bài 1/Bài 4 (xem ghi chú ở lessons/bai4.js) — WebFig là
 * SPA, ô nhập không có name/id nên phải dò theo nhãn chữ ở `td.label` rồi lấy
 * ô nhập trong cùng hàng.
 *
 * KHÁC Bài 4 ở 2 điểm quan trọng (đã đo thật 2026-09-19):
 *  1. Bài này chỉ có MỘT trang cấu hình nên KHÔNG cần cơ chế chấm-theo-trang
 *     (`trangHienTaiDat`) như Bài 4 — chấm thẳng toàn bộ tiêu chí.
 *  2. Đây là thao tác THÊM DÒNG MỚI (Add New) chứ không phải sửa dòng có sẵn:
 *     bấm Apply sinh lệnh 0xfe0005 lên đường dẫn 20/9. Vì kho cấu hình lưu
 *     bền, phải gọi `/ftc_dat_lai?bai=2` mỗi lượt mở bài để xoá queue của
 *     lượt trước (nếu không, học viên sau vào đã thấy bài làm sẵn).
 *
 * Hàng "Max Limit"/"Burst ..." có 2 ô: ô Target Upload nằm trong `td.tvalue`,
 * ô Target Download nằm trong `td.value` — nên phải lấy theo THỨ TỰ ô nhập
 * trong cả hàng (`input[type=text]`), không lọc theo class ô.
 * Hàng "Target"/"Dst." là danh sách nhiều giá trị: mặc định Target CHƯA có ô
 * nhập nào (phải bấm mũi tên mới thêm), còn Dst. có sẵn ô `0.0.0.0/0`.
 */

window.DEVICE_MIKROTIK_HEXS_LESSONS = window.DEVICE_MIKROTIK_HEXS_LESSONS || [];

/** Tìm hàng <tr> theo nhãn chữ ở cột trái. */
function mkBai2HangTheoNhan(doc, nhan) {
  try {
    for (const tr of doc.querySelectorAll('tr')) {
      const lb = tr.querySelector('td.label');
      if (lb && lb.textContent.trim() === nhan) return tr;
    }
  } catch (e) {}
  return null;
}

/** Đang ở trang chi tiết Simple Queue (chỉ trang này mới có nhãn "Max Limit")? */
function mkBai2LaTrangQueue(doc) {
  return !!mkBai2HangTheoNhan(doc, 'Max Limit');
}

/**
 * Bảng giá trị chuẩn — ĐO THẬT trên giả lập 2026-09-19 (giá trị mặc định khi
 * vừa bấm Add New) và đối chiếu 2 ảnh anh Huynn gửi.
 * `deBai: true` = ô học viên phải tự nhập; còn lại là "giữ nguyên mặc định".
 */
var MK_BAI2_CHUAN = [
  { nhan: 'Enabled', kieu: 'tich', dung: true, ten: 'Enabled: giữ nguyên (có tích)' },
  { nhan: 'Comment', kieu: 'chu', idx: 0, dung: '', ten: 'Comment: giữ nguyên (để trống)' },
  { nhan: 'Name', kieu: 'chu', idx: 0, dung: 'under_5M', deBai: true, ten: 'Name: under_5M' },
  { nhan: 'Target', kieu: 'chu', idx: 0, dung: '192.168.1.0/24', deBai: true, ten: 'Target: 192.168.1.0/24' },
  { nhan: 'Dst.', kieu: 'chu', idx: 0, dung: '0.0.0.0/0', ten: 'Dst.: giữ nguyên 0.0.0.0/0' },
  { nhan: 'Max Limit', kieu: 'chu', idx: 0, dung: '2M', deBai: true, ten: 'Max Limit — Target Upload: 2M' },
  { nhan: 'Max Limit', kieu: 'chu', idx: 1, dung: '5M', deBai: true, ten: 'Max Limit — Target Download: 5M' },
  { nhan: 'Burst Limit', kieu: 'chu', idx: 0, dung: '0', ten: 'Burst Limit — Target Upload: giữ nguyên 0' },
  { nhan: 'Burst Limit', kieu: 'chu', idx: 1, dung: '0', ten: 'Burst Limit — Target Download: giữ nguyên 0' },
  { nhan: 'Burst Threshold', kieu: 'chu', idx: 0, dung: '0', ten: 'Burst Threshold — Target Upload: giữ nguyên 0' },
  { nhan: 'Burst Threshold', kieu: 'chu', idx: 1, dung: '0', ten: 'Burst Threshold — Target Download: giữ nguyên 0' },
  { nhan: 'Burst Time', kieu: 'chu', idx: 0, dung: '0', ten: 'Burst Time — Target Upload: giữ nguyên 0' },
  { nhan: 'Burst Time', kieu: 'chu', idx: 1, dung: '0', ten: 'Burst Time — Target Download: giữ nguyên 0' }
];

/** Đọc giá trị của một tiêu chí từ trang đang mở. */
function mkBai2DocTruong(doc, muc) {
  const tr = mkBai2HangTheoNhan(doc, muc.nhan);
  if (!tr) return null;
  if (muc.kieu === 'tich') {
    const o = tr.querySelector('input[type=checkbox]');
    return o ? !!o.checked : null;
  }
  // Chỉ lấy ô nhập chữ (bỏ qua <select> của hàng Target/Dst.)
  const os = tr.querySelectorAll('input[type=text], textarea');
  const o = os[muc.idx || 0];
  if (!o) return null;
  return (o.value || '').trim();
}

function mkBai2SoSanh(muc, gt) {
  if (gt === null || gt === undefined) return false;
  return gt === muc.dung;
}

function mkBai2ChuHoaGiaTri(muc, gt) {
  if (gt === null || gt === undefined) return '(chưa nhập)';
  if (muc.kieu === 'tich') return gt ? 'có tích' : 'không tích';
  return gt === '' ? '(để trống)' : String(gt);
}

/** Khoá duy nhất cho 1 tiêu chí — nhãn + chỉ số ô (Max Limit/Burst có 2 ô). */
function mkBai2KhoaMuc(muc) {
  return muc.nhan + '#' + (muc.idx || 0);
}

/** Chụp toàn bộ giá trị của trang ngay lúc bấm Apply/OK. */
function mkBai2ChupTatCa(doc) {
  const ban = {};
  let coGiaTri = false;
  MK_BAI2_CHUAN.forEach(function (muc) {
    const gt = mkBai2DocTruong(doc, muc);
    ban[mkBai2KhoaMuc(muc)] = gt;
    if (gt !== null) coGiaTri = true;
  });
  return coGiaTri ? ban : null;
}

window.DEVICE_MIKROTIK_HEXS_LESSONS.push({
  id: 'mikrotik_hexs-bai2',
  title: 'Cấu hình giới hạn băng thông',
  subtitle: 'Giới hạn băng thông bằng Simple Queue',
  instructions: [
    '<b>Yêu cầu:</b>',
    'Giới hạn băng thông cho dải LAN 192.168.1.0/24 bằng Simple Queue',
    '- Name: <span class="val">under_5M</span>',
    '- Target: <span class="val">192.168.1.0/24</span>',
    '- Max Limit — Target Upload: <span class="val">2M</span>, Target Download: <span class="val">5M</span>'
  ],
  practiceUrl: '/sim_mikrotik_hexs/index.html',
  grading: {
    description: 'Kiểm tra Simple Queue giới hạn băng thông trên MikroTik hEX S',
    rules: [
      { id: 'q_name', name: 'Name: under_5M', selector: '#ftc-mk2-name', expected: 'under_5M', type: 'text_exact', required: true },
      { id: 'q_upload', name: 'Max Limit — Target Upload: 2M', selector: '#ftc-mk2-upload-limit', expected: '2M', type: 'text_exact', required: true },
      { id: 'q_download', name: 'Max Limit — Target Download: 5M', selector: '#ftc-mk2-download-limit', expected: '5M', type: 'text_exact', required: true }
    ],
    customGrading: function (allDocs) {
      let doc = null;
      for (const d of allDocs) {
        try { if (!doc && mkBai2LaTrangQueue(d)) doc = d; } catch (e) {}
      }

      const banChup = window._FTC_MK_BAI2 || window._FTC_MK_BAI2_LIVE || null;
      const daLuu = !!(banChup || window._FTC_MK_BAI2_SAVED || (doc && doc._ftcIsSaved) || window._hasClickedSaveInGuide);

      const details = [];
      let soDung = 0;
      MK_BAI2_CHUAN.forEach(function (muc, idx) {
        let gt = doc ? mkBai2DocTruong(doc, muc) : null;
        if (gt === null && banChup) gt = banChup[mkBai2KhoaMuc(muc)];
        const dat = mkBai2SoSanh(muc, gt) && daLuu;
        if (dat) soDung++;

        let loi;
        if (dat) loi = 'Chính xác';
        else if (gt === null || gt === undefined) loi = 'Chưa mở trang cấu hình hoặc chưa nhập giá trị';
        else if (!daLuu) loi = 'Chưa nhấn Apply/OK để lưu cấu hình';
        else if (muc.deBai) loi = 'Giá trị không đúng yêu cầu đề bài';
        else loi = 'Đây là giá trị mặc định, không được thay đổi';

        details.push({
          id: 'mk2_' + idx,
          name: muc.ten,
          expected: mkBai2ChuHoaGiaTri(muc, muc.dung),
          actual: mkBai2ChuHoaGiaTri(muc, gt),
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

  /** Xoá bản chụp + xoá queue của lượt trước khi học viên mở lại bài. */
  onSimLoad: function (simWin) {
    try {
      const doc = simWin.document;
      if (doc && doc.querySelector('input#name') && doc.querySelector('input#password')) {
        window._FTC_MK_BAI2 = null;
        window._FTC_MK_BAI2_LIVE = null;
        window._FTC_MK_BAI2_SAVED = false;
        try { simWin.fetch('/sim_mikrotik_hexs/ftc_dat_lai?bai=2'); } catch (e) {}
      }
      // Gắn id động cho các ô để tooltip trỏ đúng (hàm ở tooltips/bai2.js).
      if (!simWin._ftcMkBai2DangTheoDoi) {
        simWin._ftcMkBai2DangTheoDoi = true;
        simWin.setInterval(function () {
          try {
            if (typeof mkBai2CaiTheoDoi === 'function') mkBai2CaiTheoDoi(simWin.document);
            const d = simWin.document;
            if (d && mkBai2LaTrangQueue(d)) {
              const live = mkBai2ChupTatCa(d);
              if (live) window._FTC_MK_BAI2_LIVE = live;
            }
          } catch (e) {}
        }, 400);

        // Bắt trực tiếp sự kiện click / pointerdown trên nút OK và Apply trong simWin
        const batNutLuu = function (e) {
          try {
            let el = e.target;
            while (el && el !== simWin.document) {
              if (el.tagName === 'A' && (el.textContent || '').trim().toLowerCase().match(/^(ok|apply)$/)) {
                const d = simWin.document;
                if (d) {
                  d._ftcIsSaved = true;
                  window._hasClickedSaveInGuide = true;
                  const snapshot = mkBai2ChupTatCa(d);
                  if (snapshot) {
                    window._FTC_MK_BAI2 = snapshot;
                    window._FTC_MK_BAI2_SAVED = true;
                  }
                }
                break;
              }
              el = el.parentNode;
            }
          } catch (ex) {}
        };
        simWin.document.addEventListener('pointerdown', batNutLuu, true);
        simWin.document.addEventListener('click', batNutLuu, true);
      }
    } catch (e) {}
  },

  /**
   * Chụp giá trị ngay lúc bấm Apply/OK — cả hai nút Apply và OK đều lưu cấu hình
   * và giữ dữ liệu đồng bộ cho việc chấm điểm.
   */
  onSimSave: function (simWin) {
    try {
      const doc = simWin.document;
      const ban = mkBai2ChupTatCa(doc) || window._FTC_MK_BAI2_LIVE;
      if (ban) {
        window._FTC_MK_BAI2 = ban;
        window._FTC_MK_BAI2_SAVED = true;
      } else if (mkBai2LaTrangQueue(doc)) {
        window._FTC_MK_BAI2_SAVED = true;
      }
    } catch (e) {}
  },

  guidePopups: (window.TOOLTIPS_MIKROTIK_HEXS
                && window.TOOLTIPS_MIKROTIK_HEXS['mikrotik_hexs-bai2']) || []
});
