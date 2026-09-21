/**
 * devices/mikrotik_hexs/tooltips/bai4.js — Tooltip Hướng dẫn Bài 4: Cấu hình DHCP
 *
 * Đề bài KHÔNG có phần NAT (đính chính 2026-09-18, anh Huynn xác nhận qua ảnh
 * chụp thiết bị thật) — chỉ gồm 2 phần: DHCP Server > Networks, và IP > Addresses.
 * Đánh số tooltip lại từ Bước 1 theo yêu cầu anh Huynn.
 *
 * Cùng lối kiến trúc với Bài 1 (xem ghi chú ở tooltips/bai1.js): WebFig là SPA,
 * ô nhập không có name/id nên phải gắn id động; dùng `text:<chuỗi>`/`condition`
 * để chuyển bước; hash URL để phân biệt trang.
 */

if (!window.TOOLTIPS_MIKROTIK_HEXS) window.TOOLTIPS_MIKROTIK_HEXS = {};

/** Đang ở màn hình đăng nhập RouterOS? */
function mkBai4ManDangNhap(doc) {
  try {
    return !!(doc.querySelector('input#name') && doc.querySelector('input#password'));
  } catch (e) { return false; }
}

function mkBai4Hash(doc) {
  try { return (doc.location && doc.location.hash) || ''; } catch (e) { return ''; }
}

/**
 * Chữ "chuoi" (vd. "DHCP Server") có đang HIỂN THỊ trên trang không?
 * Menu con "IP" mặc định đóng nên "DHCP Server" chỉ hiện sau khi bấm "IP" —
 * phải kiểm tra riêng, không dùng chung TreeWalker của app.js vì nếu không
 * tìm thấy chữ thật (đang ẩn), nó có thể khớp nhầm vào chính nội dung bong
 * bóng tooltip cũ (đã sửa ở app.js) — hàm này bỏ qua bong bóng để chắc chắn.
 */
function mkBai4CoTextHienThi(doc, chuoi) {
  try {
    for (const el of doc.querySelectorAll('*')) {
      if (el.childElementCount !== 0) continue;
      if (el.closest('.ftc-guide-bubble')) continue;
      if (el.textContent.trim() !== chuoi) continue;
      if (el.offsetParent !== null) return true;
    }
  } catch (e) { }
  return false;
}

/** Có hàng nhãn "nhan" đang hiển thị trên trang không? */
function mkBai4CoNhan(doc, nhan) {
  try {
    for (const tr of doc.querySelectorAll('tr')) {
      const lb = tr.querySelector('td.label');
      if (lb && lb.textContent.trim() === nhan) return tr.getBoundingClientRect().height > 0;
    }
  } catch (e) { }
  return false;
}

/** Trang chi tiết 1 rule Networks (duy nhất có nhãn "Netmask"). */
function mkBai4OChiTietNetworks(doc) { return mkBai4CoNhan(doc, 'Netmask'); }

/** Trang chi tiết 1 item Addresses (có nhãn "Network", không có "Netmask"). */
function mkBai4OChiTietAddresses(doc) {
  return mkBai4CoNhan(doc, 'Network') && !mkBai4CoNhan(doc, 'Netmask');
}

/**
 * Hash thật đo được (2026-09-18): bấm tab "Networks" ĐỔI HASH thành
 * '#IP:DHCP_Server.Networks' (không giữ nguyên '#IP:DHCP_Server' như tưởng
 * ban đầu) — WebFig coi việc chuyển tab cũng là một điều hướng con.
 */
/** Đang ở trang DHCP Server, tab DHCP mặc định (chưa bấm Networks)? */
function mkBai4OTabDHCPMacDinh(doc) { return mkBai4Hash(doc) === '#IP:DHCP_Server'; }

/** Đang ở tab "Networks" của trang DHCP Server (danh sách, chưa mở chi tiết)? */
function mkBai4OTabNetworks(doc) {
  return mkBai4Hash(doc) === '#IP:DHCP_Server.Networks' && !mkBai4OChiTietNetworks(doc);
}

/** Đang ở trang danh sách Addresses (chưa mở chi tiết item nào)? */
function mkBai4OTrangDanhSachAddresses(doc) {
  return mkBai4Hash(doc) === '#IP:Addresses' && !mkBai4OChiTietAddresses(doc);
}

/**
 * Networks ĐÃ LƯU ĐÚNG đáp án chưa (2026-09-19, theo yêu cầu anh Huynn)?
 * Trước đây chỉ kiểm tra "đã lưu" (bấm Apply/OK) mà KHÔNG kiểm tra lưu ĐÚNG
 * hay sai — nên nếu anh cố tình lưu sai Gateway, tooltip vẫn cho qua trang
 * Addresses (Bước 8) như thể đã làm đúng. Đúng ý anh: sai ở trang nào thì
 * phải sửa xong ở đúng trang đó mới được đi tiếp — nên đổi sang kiểm tra
 * bản chụp giá trị đã lưu (`window._FTC_MK_BAI4.networks`, do lessons/bai4.js
 * ghi trong `onSimSave`) có khớp đúng đáp án hay chưa.
 */
function mkBai4NetworksDaDung() {
  try {
    if (!window._FTC_MK_BAI4_NETWORKS_SAVED) return false;
    var b = window._FTC_MK_BAI4 && window._FTC_MK_BAI4.networks;
    if (!b) return false;
    // Dùng CHUNG bảng tiêu chí với phần chấm điểm (lessons/bai4.js) để
    // "trang Networks hết lỗi" ở tooltip và ở bảng "Xem lỗi sai" luôn khớp
    // nhau — kể cả các tiêu chí giữ nguyên mặc định (vd No DNS). Nếu vì lý
    // do nào đó chưa nạp được bảng đó thì tối thiểu kiểm 2 ô đề bài.
    if (typeof MK_BAI4_CHUAN_NETWORKS === 'undefined'
      || typeof mkBai4SoSanh !== 'function' || typeof mkBai4KhoaMuc !== 'function') {
      return b['Address'] === '192.168.10.0/24' && b['Gateway'] === '192.168.10.1';
    }
    return MK_BAI4_CHUAN_NETWORKS.every(function (muc) {
      return mkBai4SoSanh(muc, b[mkBai4KhoaMuc(muc)]);
    });
  } catch (e) { return false; }
}

window.TOOLTIPS_MIKROTIK_HEXS['mikrotik_hexs-bai4'] = [
  // ── Màn hình đăng nhập ─────────────────────────────────────────────
  {
    selector: 'input#name',
    text: 'Nhập admin',
    position: 'right',
    condition: function (doc) { return mkBai4ManDangNhap(doc); }
  },
  {
    selector: 'input[value="Login"], input[type="button"][value="Login"]',
    text: 'Nhập admin',
    position: 'right',
    condition: function (doc) { return mkBai4ManDangNhap(doc); }
  },

  // ── Phần 1: DHCP Server > Networks ─────────────────────────────────
  {
    // Menu con "IP" mặc định đóng khi vào WebFig (trang mặc định là
    // Interfaces > Interface List) nên phải hướng dẫn mở "IP" trước,
    // trước khi trỏ vào "DHCP Server" (nằm bên trong menu con đó).
    selector: 'text:IP',
    text: 'Bước 1: chọn IP',
    position: 'right',
    condition: function (doc) {
      return !mkBai4ManDangNhap(doc) && !mkBai4OTabDHCPMacDinh(doc) && !mkBai4OTabNetworks(doc) && !mkBai4OChiTietNetworks(doc)
        && !mkBai4OTrangDanhSachAddresses(doc) && !mkBai4OChiTietAddresses(doc)
        && !mkBai4CoTextHienThi(doc, 'DHCP Server');
    }
  },
  {
    selector: 'text:DHCP Server',
    text: 'Bước 2: chọn DHCP Server',
    position: 'right',
    condition: function (doc) {
      return !mkBai4ManDangNhap(doc) && !mkBai4OTabDHCPMacDinh(doc) && !mkBai4OTabNetworks(doc) && !mkBai4OChiTietNetworks(doc)
        && !mkBai4OTrangDanhSachAddresses(doc) && !mkBai4OChiTietAddresses(doc)
        && mkBai4CoTextHienThi(doc, 'DHCP Server');
    }
  },
  {
    selector: 'text:Networks',
    text: 'Bước 3: chọn tab Networks',
    position: 'right',
    condition: function (doc) { return mkBai4OTabDHCPMacDinh(doc); }
  },
  {
    // Chọn theo id gắn động (#ftc-mk4-net-row, gắn ở lessons/bai4.js), KHÔNG
    // chọn theo text:192.168.1.0/24 như trước — chữ đó chỉ đúng lúc đề bài
    // còn mặc định; ngay khi anh đã Apply (dù đúng hay SAI), dòng này hiển
    // thị giá trị vừa nhập nên chọn theo text cũ sẽ không còn khớp được nữa,
    // và tooltip nhắc "sửa lại" cũng cần hiện được cả khi đã lưu SAI.
    selector: '#ftc-mk4-net-row',
    text: 'Bước 4: nhấn đúp vào rule đầu tiên',
    position: 'right',
    condition: function (doc) {
      return mkBai4OTabNetworks(doc) && !mkBai4NetworksDaDung();
    }
  },
  {
    selector: '#ftc-mk4-net-address',
    text: 'Bước 5: nhập 192.168.10.0/24',
    position: 'right',
    condition: function (doc) { return mkBai4OChiTietNetworks(doc); }
  },
  {
    selector: '#ftc-mk4-net-gateway',
    text: 'Bước 6: nhập 192.168.10.1',
    position: 'right',
    condition: function (doc) { return mkBai4OChiTietNetworks(doc); }
  },
  {
    selector: 'text:OK',
    text: 'Bước 7: nhấn Apply và OK để lưu',
    position: 'left',
    offsetX: -120,
    condition: function (doc) { return mkBai4OChiTietNetworks(doc); }
  },

  // ── Phần 2: IP > Addresses ──────────────────────────────────────────
  {
    // Chỉ cho qua Addresses khi Networks đã lưu ĐÚNG đáp án (không chỉ "đã
    // lưu") — xem chú thích `mkBai4NetworksDaDung`.
    selector: 'text:Addresses',
    text: 'Bước 8: chọn Addresses',
    position: 'right',
    condition: function (doc) {
      return mkBai4OTabNetworks(doc) && mkBai4NetworksDaDung();
    }
  },
  {
    selector: 'text:bridge-LAN',
    text: 'Bước 9: nhấn đúp vào dòng bridge-LAN',
    position: 'right',
    condition: function (doc) { return mkBai4OTrangDanhSachAddresses(doc); }
  },
  {
    selector: '#ftc-mk4-addr-address',
    text: 'Bước 10: nhập 192.168.10.1/24',
    position: 'right',
    condition: function (doc) { return mkBai4OChiTietAddresses(doc); }
  },
  {
    selector: '#ftc-mk4-addr-network',
    text: 'Bước 11: nhập 192.168.10.0',
    position: 'right',
    condition: function (doc) { return mkBai4OChiTietAddresses(doc); }
  },
  {
    selector: 'text:OK',
    text: 'Bước 12: nhấn Apply và OK để lưu',
    position: 'left',
    offsetX: -120,
    condition: function (doc) { return mkBai4OChiTietAddresses(doc); }
  }
];
