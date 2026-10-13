/**
 * devices/mikrotik_hexs/lessons/bai4.js
 * Bài 4: Cấu hình DHCP — MikroTik hEX S
 *
 * Đề bài KHÔNG có phần NAT (đính chính 2026-09-18, anh Huynn xác nhận qua ảnh
 * chụp thiết bị thật ở hệ cũ cổng 5504) — chỉ gồm 2 phần cấu hình:
 *   1. DHCP Server > Networks: Address 192.168.10.0/24, Gateway 192.168.10.1
 *   2. IP > Addresses (bridge-LAN): Address 192.168.10.1/24, Network 192.168.10.0
 * Nguồn: 16_authen_log_old/modules/R_MIKROTIK/hint/hint_lan_based.html (bước 6-12 cũ).
 *
 * KIẾN TRÚC (giống Bài 1 — xem ghi chú chi tiết ở lessons/bai1.js):
 * WebFig là SPA dùng chung 1 document/window suốt phiên, mỗi trang chi tiết TỰ
 * ĐÓNG sau khi bấm OK. Khác Bài 1 ở chỗ Bài 4 có 2 TRANG CẤU HÌNH RIÊNG BIỆT
 * (Networks + Addresses) — vì cùng 1 document nên KHÔNG dùng `doc._ftcIsSaved`
 * để phân biệt "trang nào đã lưu" (cờ đó dùng chung cho cả document, lưu trang
 * này xong vẫn còn true khi sang trang kia). Phải tự quản lý 2 cờ riêng:
 *   window._FTC_MK_BAI4_NETWORKS_SAVED / _ADDRESSES_SAVED
 */

window.DEVICE_MIKROTIK_HEXS_LESSONS = window.DEVICE_MIKROTIK_HEXS_LESSONS || [];

/** Tìm hàng <tr> theo nhãn chữ ở cột trái. */
function mkBai4HangTheoNhan(doc, nhan) {
  try {
    for (const tr of doc.querySelectorAll('tr')) {
      const lb = tr.querySelector('td.label');
      if (lb && lb.textContent.trim() === nhan) return tr;
    }
  } catch (e) {}
  return null;
}

function mkBai4OTheoNhan(doc, nhan) {
  const tr = mkBai4HangTheoNhan(doc, nhan);
  return tr ? tr.querySelector('td.value input, td.value select') : null;
}

/** Đang là trang chi tiết Networks (có nhãn Netmask)? */
function mkBai4LaTrangNetworks(doc) { return !!mkBai4HangTheoNhan(doc, 'Netmask'); }
/** Đang là trang chi tiết Addresses (có Network, không có Netmask)? */
function mkBai4LaTrangAddresses(doc) {
  return !!mkBai4HangTheoNhan(doc, 'Network') && !mkBai4HangTheoNhan(doc, 'Netmask');
}

/**
 * Bảng giá trị chuẩn — đã ĐO THẬT trên giả lập sau khi gọi /ftc_dat_lai?bai=4
 * (xoá lớp phủ, trả về đúng gốc thiết bị). Không có tiêu chí "DHCP Option Set":
 * lúc đo ô <select> này trả về giá trị rỗng/không rõ, không đủ tin cậy để chấm.
 */
var MK_BAI4_CHUAN_NETWORKS = [
  { nhan: 'Address', kieu: 'chu', dung: '192.168.10.0/24', deBai: true, ten: '[Networks] Address: 192.168.10.0/24' },
  { nhan: 'Gateway', kieu: 'chu', dung: '192.168.10.1', deBai: true, ten: '[Networks] Gateway: 192.168.10.1' },
  { nhan: 'Netmask', kieu: 'chu', dung: '0', ten: '[Networks] Netmask: giữ nguyên 0' },
  { nhan: 'No DNS', kieu: 'tich', dung: false, ten: '[Networks] No DNS: giữ nguyên (không tích)' },
  { nhan: 'DNS Servers', idx: 0, kieu: 'chu', dung: '8.8.8.8', ten: '[Networks] DNS Servers: giữ nguyên 8.8.8.8' },
  { nhan: 'DNS Servers', idx: 1, kieu: 'chu', dung: '8.8.4.4', ten: '[Networks] DNS Servers: giữ nguyên 8.8.4.4' },
  { nhan: 'Domain', kieu: 'chu', dung: '', ten: '[Networks] Domain: giữ nguyên (để trống)' },
  { nhan: 'Next Server', kieu: 'chu', dung: '0.0.0.0', ten: '[Networks] Next Server: giữ nguyên 0.0.0.0' },
  { nhan: 'Boot File Name', kieu: 'chu', dung: '', ten: '[Networks] Boot File Name: giữ nguyên (để trống)' }
];

var MK_BAI4_CHUAN_ADDRESSES = [
  { nhan: 'Enabled', kieu: 'tich', dung: true, ten: '[Addresses] Enabled: giữ nguyên (có tích)' },
  { nhan: 'Address', kieu: 'chu', dung: '192.168.10.1/24', deBai: true, ten: '[Addresses] Address: 192.168.10.1/24' },
  { nhan: 'Network', kieu: 'chu', dung: '192.168.10.0', deBai: true, ten: '[Addresses] Network: 192.168.10.0' },
  { nhan: 'Interface', kieu: 'chon', dung: 'bridge-LAN', ten: '[Addresses] Interface: giữ nguyên bridge-LAN' }
];

function mkBai4DocTruong(doc, muc) {
  const tr = mkBai4HangTheoNhan(doc, muc.nhan);
  if (!tr) return null;
  // Một số hàng (vd "DNS Servers") có NHIỀU ô nhập dùng chung 1 nhãn —
  // dùng muc.idx để chọn đúng ô thứ mấy trong hàng đó.
  const os = tr.querySelectorAll('td.value input, td.value select');
  const o = (typeof muc.idx === 'number') ? os[muc.idx] : os[0];
  if (!o) return null;
  if (muc.kieu === 'tich') return !!o.checked;
  if (muc.kieu === 'chon') {
    const op = o.options ? o.options[o.selectedIndex] : null;
    return op ? op.text.trim() : (o.value || '').trim();
  }
  return (o.value || '').trim();
}

function mkBai4SoSanh(muc, gt) {
  if (gt === null || gt === undefined) return false;
  return gt === muc.dung;
}

function mkBai4ChuHoaGiaTri(muc, gt) {
  if (gt === null || gt === undefined) return '(chưa mở trang này)';
  if (muc.kieu === 'tich') return gt ? 'có tích' : 'không tích';
  return gt === '' ? '(để trống)' : String(gt);
}

/**
 * Khoá duy nhất cho 1 tiêu chí — không dùng thẳng muc.nhan, vì một số hàng
 * (vd "DNS Servers") có NHIỀU tiêu chí cùng chia sẻ 1 nhãn (phân biệt bằng
 * muc.idx) — nếu chỉ khoá theo nhan thì bản chụp sẽ bị GHI ĐÈ lẫn nhau.
 */
function mkBai4KhoaMuc(muc) {
  return muc.nhan + (typeof muc.idx === 'number' ? '#' + muc.idx : '');
}

/** Chụp toàn bộ trường của 1 nhóm (Networks hoặc Addresses). */
function mkBai4ChupNhom(doc, dsChuan) {
  const ban = {};
  let coGiaTri = false;
  dsChuan.forEach(function (muc) {
    const gt = mkBai4DocTruong(doc, muc);
    ban[mkBai4KhoaMuc(muc)] = gt;
    if (gt !== null) coGiaTri = true;
  });
  return coGiaTri ? ban : null;
}

/**
 * Tìm ĐÚNG Ô "Address" (không phải cả dòng `<tr>`) trong bảng danh sách
 * "DHCP Server > Networks" — nhận diện qua VỊ TRÍ CỘT ở hàng tiêu đề (đúng 2
 * hàng: 1 tiêu đề + 1 dữ liệu; cột nào có chữ "Address" ở tiêu đề thì lấy ô
 * cùng chỉ số cột đó ở hàng dữ liệu), KHÔNG dựa vào nội dung hiển thị của ô
 * vì nội dung đó đổi ngay khi Apply (kể cả Apply SAI) — xem chú thích ở
 * `tooltips/bai4.js` (`mkBai4NetworksDaDung`, 2026-09-19, theo yêu cầu anh
 * Huynn: sai trang nào phải báo + sửa đúng tại trang đó, không cho qua bước
 * kế tiếp khi đang sai).
 *
 * ⚠️ Sửa lại 2026-09-19: bản đầu gắn id vào CẢ DÒNG `<tr>` — dòng kéo dài hết
 * chiều ngang bảng (kể cả các cột trống bên phải như WINS Servers/Next
 * Server) nên tooltip `position:'right'` bị tính lệch ra sát rìa phải màn
 * hình (anh Huynn chụp ảnh báo lại). Phải gắn vào đúng 1 ô `<td>` hẹp.
 */
function mkBai4TimO_AddressDanhSachNetworks(doc) {
  try {
    for (const tbl of doc.querySelectorAll('table')) {
      const rows = tbl.querySelectorAll('tr');
      if (rows.length !== 2) continue;
      const oTieuDe = rows[0].querySelectorAll('td, th');
      let chiSo = -1;
      oTieuDe.forEach(function (o, i) { if (o.textContent.trim() === 'Address') chiSo = i; });
      if (chiSo === -1) continue;
      const oDuLieu = rows[1].querySelectorAll('td');
      if (oDuLieu[chiSo]) return oDuLieu[chiSo];
    }
  } catch (e) {}
  return null;
}

/**
 * Theo dõi nền: gắn id cho 4 ô cần trỏ tooltip (Address/Gateway của Networks,
 * Address/Network của Addresses) — 2 trang dùng chung nhãn "Address" nên phải
 * gắn id riêng theo TỪNG TRANG mới phân biệt được, không thể chỉ dựa vào nhãn.
 * Đồng thời gắn id cho đúng Ô "Address" (không phải cả dòng) trong bảng danh
 * sách Networks (`#ftc-mk4-net-row`) để tooltip Bước 4 trỏ ổn định và ĐÚNG VỊ
 * TRÍ, không phụ thuộc chữ hiển thị trên dòng (chữ đó đổi ngay khi Apply).
 */
function mkBai4CaiTheoDoi(win) {
  try {
    if (win._ftcMkBai4DangTheoDoi) return;
    win._ftcMkBai4DangTheoDoi = true;
    win.setInterval(function () {
      try {
        const doc = win.document;
        if (mkBai4LaTrangNetworks(doc)) {
          const oA = mkBai4OTheoNhan(doc, 'Address');
          const oG = mkBai4OTheoNhan(doc, 'Gateway');
          if (oA && !oA.id) oA.id = 'ftc-mk4-net-address';
          if (oG && !oG.id) oG.id = 'ftc-mk4-net-gateway';
        } else if (mkBai4LaTrangAddresses(doc)) {
          const oA = mkBai4OTheoNhan(doc, 'Address');
          const oN = mkBai4OTheoNhan(doc, 'Network');
          if (oA && !oA.id) oA.id = 'ftc-mk4-addr-address';
          if (oN && !oN.id) oN.id = 'ftc-mk4-addr-network';
        } else {
          const oDiaChi = mkBai4TimO_AddressDanhSachNetworks(doc);
          if (oDiaChi && !oDiaChi.id) oDiaChi.id = 'ftc-mk4-net-row';
        }
      } catch (e) {}
    }, 600);
  } catch (e) {}
}

window.DEVICE_MIKROTIK_HEXS_LESSONS.push({
  id: 'mikrotik_hexs-bai4',
  title: 'Cấu hình DHCP',
  subtitle: 'Cấu hình lớp mạng LAN và DHCP Server',
  instructions: [
    '<b>Yêu cầu:</b>',
    'Đổi lớp mạng LAN của router MikroTik hEX S sang 192.168.10.0/24',
    '- DHCP Server > Networks: Address <span class="val">192.168.10.0/24</span>, Gateway <span class="val">192.168.10.1</span>',
    '- IP > Addresses (bridge-LAN): Address <span class="val">192.168.10.1/24</span>, Network <span class="val">192.168.10.0</span>'
  ],
  practiceUrl: '/sim_mikrotik_hexs/index.html',
  grading: {
    description: 'Kiểm tra cấu hình DHCP/LAN Based trên MikroTik hEX S',
    rules: [
      { id: 'net_address', name: '[Networks] Address: 192.168.10.0/24', selector: '#ftc-mk4-net-address', expected: '192.168.10.0/24', type: 'text_exact', required: true },
      { id: 'net_gateway', name: '[Networks] Gateway: 192.168.10.1', selector: '#ftc-mk4-net-gateway', expected: '192.168.10.1', type: 'text_exact', required: true },
      { id: 'addr_address', name: '[Addresses] Address: 192.168.10.1/24', selector: '#ftc-mk4-addr-address', expected: '192.168.10.1/24', type: 'text_exact', required: true },
      { id: 'addr_network', name: '[Addresses] Network: 192.168.10.0', selector: '#ftc-mk4-addr-network', expected: '192.168.10.0', type: 'text_exact', required: true }
    ],
    customGrading: function (allDocs) {
      let docNet = null, docAddr = null;
      for (const d of allDocs) {
        try {
          if (!docNet && mkBai4LaTrangNetworks(d)) docNet = d;
          if (!docAddr && mkBai4LaTrangAddresses(d)) docAddr = d;
        } catch (e) {}
      }

      const banChup = window._FTC_MK_BAI4 || { networks: null, addresses: null };
      const netDaLuu = !!(window._FTC_MK_BAI4_NETWORKS_SAVED || (banChup && banChup.networks) || (docNet && docNet._ftcIsSaved));
      const addrDaLuu = !!(window._FTC_MK_BAI4_ADDRESSES_SAVED || (banChup && banChup.addresses) || (docAddr && docAddr._ftcIsSaved));

      function chamNhom(tienTo, dsChuan, doc, daLuu, banChupNhom) {
        return dsChuan.map(function (muc, idx) {
          let gt = doc ? mkBai4DocTruong(doc, muc) : null;
          if (gt === null && banChupNhom) gt = banChupNhom[mkBai4KhoaMuc(muc)];
          const dat = mkBai4SoSanh(muc, gt) && daLuu;

          let loi;
          if (dat) loi = 'Chính xác';
          else if (gt === null || gt === undefined) loi = 'Chưa mở trang này nên không đọc được giá trị';
          else if (!daLuu) loi = 'Chưa nhấn Apply/OK để lưu cấu hình';
          else if (muc.deBai) loi = 'Giá trị không đúng yêu cầu đề bài';
          else loi = 'Đây là giá trị mặc định, không được thay đổi';

          return {
            id: 'mk4_' + tienTo + '_' + idx,
            name: muc.ten,
            expected: mkBai4ChuHoaGiaTri(muc, muc.dung),
            actual: mkBai4ChuHoaGiaTri(muc, gt),
            passed: dat,
            message: loi
          };
        });
      }

      const chiTietNet = chamNhom('net', MK_BAI4_CHUAN_NETWORKS, docNet, netDaLuu, banChup.networks);
      const chiTietAddr = chamNhom('addr', MK_BAI4_CHUAN_ADDRESSES, docAddr, addrDaLuu, banChup.addresses);

      function dong(ds) { return ds.filter(function (d) { return d.passed; }).length; }
      const netDat = netDaLuu && dong(chiTietNet) === chiTietNet.length;
      const addrDat = addrDaLuu && dong(chiTietAddr) === chiTietAddr.length;
      const datCaBai = netDat && addrDat;

      function ketQua(ds, dat, themTrangHienTai) {
        const soDung = dong(ds);
        const r = {
          passed: dat,
          score: ds.length ? Math.round((soDung / ds.length) * 100) : 0,
          passedCount: soDung,
          totalRules: ds.length,
          details: ds
        };
        if (themTrangHienTai !== undefined) r.trangHienTaiDat = themTrangHienTai;
        return r;
      }

      /**
       * CHẾ ĐỘ HƯỚNG DẪN — CHỈ BÁO LỖI CỦA TRANG ĐANG LÀM (anh Huynn chốt
       * 2026-09-19): "Chỉ kiểm tra lỗi ở trang đang mở, không kiểm tra lỗi ở
       * tất cả trang. Khi trang đầu tiên không còn lỗi thì cho làm tiếp trang
       * tiếp theo; tại trang tiếp theo chỉ kiểm tra lỗi của trang đó."
       * Trước đây chấm cả 2 trang cùng lúc nên trang CHƯA MỞ luôn bị tính sai
       * (anh chụp ảnh: đang ở trang Networks mà bảng lỗi liệt kê 4 dòng
       * "[Addresses] ... (chưa mở trang này)").
       *
       * `trangHienTaiDat` là cờ RIÊNG cho `app.js` biết "trang đang làm đã
       * sạch lỗi chưa" để bật/tắt nút "Xem lỗi sai" — TÁCH BẠCH với `passed`
       * (vẫn là "cả bài đã đạt chưa") nên nút "Nộp bài" KHÔNG bị mở sớm khi
       * mới xong trang đầu. Bài nào không trả cờ này thì `app.js` giữ nguyên
       * hành vi cũ.
       *
       * Chấm ĐẦY ĐỦ cả bài khi: (a) chế độ Thực hành — học viên nộp bài lúc
       * nào cũng được nên phải chấm hết, không được bỏ sót trang chưa làm;
       * hoặc (b) đã đạt cả bài — để bảng điểm cuối liệt kê đủ 13 tiêu chí.
       */
      const laHuongDan = (typeof window.ftcLayCheDo === 'function')
        && window.ftcLayCheDo() === 'guide';
      if (!laHuongDan || datCaBai) {
        return ketQua(chiTietNet.concat(chiTietAddr), datCaBai);
      }

      const dangLamNet = !netDat;
      const dsTrang = dangLamNet ? chiTietNet : chiTietAddr;
      const daLuuTrang = dangLamNet ? netDaLuu : addrDaLuu;
      // Chưa bấm lưu trang này thì chưa có gì để bắt lỗi — coi như "chưa có
      // lỗi" để nút Xem lỗi sai không bật đỏ oan khi học viên vừa mới sang.
      const trangHienTaiDat = !daLuuTrang || dong(dsTrang) === dsTrang.length;
      return ketQua(dsTrang, false, trangHienTaiDat);
    }
  },

  /** Xoá bản chụp + đặt lại máy chủ khi học viên mở lại bài (màn đăng nhập). */
  onSimLoad: function (simWin) {
    try {
      const doc = simWin.document;
      if (doc && doc.querySelector('input#name') && doc.querySelector('input#password')) {
        window._FTC_MK_BAI4 = { networks: null, addresses: null };
        window._FTC_MK_BAI4_NETWORKS_SAVED = false;
        window._FTC_MK_BAI4_ADDRESSES_SAVED = false;
        try { simWin.fetch('/sim_mikrotik_hexs/ftc_dat_lai?bai=4'); } catch (e) {}
      }
      mkBai4CaiTheoDoi(simWin);

      if (!simWin._ftcMkBai4BatNutLuu) {
        simWin._ftcMkBai4BatNutLuu = true;

        simWin.setInterval(function () {
          try {
            const d = simWin.document;
            if (!window._FTC_MK_BAI4) window._FTC_MK_BAI4 = { networks: null, addresses: null };
            if (d && mkBai4LaTrangNetworks(d)) {
              const liveNet = mkBai4ChupNhom(d, MK_BAI4_CHUAN_NETWORKS);
              if (liveNet) window._FTC_MK_BAI4.networks = liveNet;
            } else if (d && mkBai4LaTrangAddresses(d)) {
              const liveAddr = mkBai4ChupNhom(d, MK_BAI4_CHUAN_ADDRESSES);
              if (liveAddr) window._FTC_MK_BAI4.addresses = liveAddr;
            }
          } catch (e) {}
        }, 400);

        const batNutLuu = function (e) {
          try {
            let el = e.target;
            while (el && el !== simWin.document) {
              if (el.tagName === 'A' && (el.textContent || '').trim().toLowerCase().match(/^(ok|apply)$/)) {
                const d = simWin.document;
                if (d) {
                  d._ftcIsSaved = true;
                  window._hasClickedSaveInGuide = true;
                  if (!window._FTC_MK_BAI4) window._FTC_MK_BAI4 = { networks: null, addresses: null };
                  if (mkBai4LaTrangNetworks(d)) {
                    const ban = mkBai4ChupNhom(d, MK_BAI4_CHUAN_NETWORKS);
                    if (ban) {
                      window._FTC_MK_BAI4.networks = ban;
                      window._FTC_MK_BAI4_NETWORKS_SAVED = true;
                    }
                  } else if (mkBai4LaTrangAddresses(d)) {
                    const ban = mkBai4ChupNhom(d, MK_BAI4_CHUAN_ADDRESSES);
                    if (ban) {
                      window._FTC_MK_BAI4.addresses = ban;
                      window._FTC_MK_BAI4_ADDRESSES_SAVED = true;
                    }
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
   * Chụp lại giá trị NGAY LÚC bấm OK/Apply.
   */
  onSimSave: function (simWin) {
    try {
      const doc = simWin.document;
      if (!window._FTC_MK_BAI4) window._FTC_MK_BAI4 = { networks: null, addresses: null };
      if (mkBai4LaTrangNetworks(doc)) {
        const ban = mkBai4ChupNhom(doc, MK_BAI4_CHUAN_NETWORKS);
        if (ban) { window._FTC_MK_BAI4.networks = ban; window._FTC_MK_BAI4_NETWORKS_SAVED = true; }
      } else if (mkBai4LaTrangAddresses(doc)) {
        const ban = mkBai4ChupNhom(doc, MK_BAI4_CHUAN_ADDRESSES);
        if (ban) { window._FTC_MK_BAI4.addresses = ban; window._FTC_MK_BAI4_ADDRESSES_SAVED = true; }
      }
      setTimeout(function () { window._ftcMkChanTooltip = false; }, 200);
    } catch (e) {}
  },

  guidePopups: (window.TOOLTIPS_MIKROTIK_HEXS
                && window.TOOLTIPS_MIKROTIK_HEXS['mikrotik_hexs-bai4']) || []
});
