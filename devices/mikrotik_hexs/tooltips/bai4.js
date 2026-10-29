/**
 * devices/mikrotik_hexs/tooltips/bai4.js — Tooltip Hướng dẫn Bài 4: Cấu hình DHCP
 *
 * Chuỗi 17 bước chuẩn xác chia làm 3 phần theo thứ tự thực tế:
 *   Phần 1: Cấu hình IP Address (Ảnh 1 & 2 — Bước 1 ➔ 6)
 *   Phần 2: Cấu hình IP Pool (Ảnh 3 & 4 — Bước 7 ➔ 11)
 *   Phần 3: Cấu hình DHCP Server Networks (Ảnh 5 — Bước 12 ➔ 17)
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

/** Chữ "chuoi" có đang HIỂN THỊ trên trang không (bỏ qua bong bóng tooltip)? */
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

/** Trang chi tiết Networks (có nhãn "Netmask"). */
function mkBai4OChiTietNetworks(doc) { return mkBai4CoNhan(doc, 'Netmask'); }

/** Trang chi tiết Pool (có nhãn "Next Pool"). */
function mkBai4LaTrangPool(doc) { return mkBai4CoNhan(doc, 'Next Pool'); }

/** Trang chi tiết Addresses (có nhãn "Network", không có "Netmask" và không có "Next Pool"). */
function mkBai4OChiTietAddresses(doc) {
  return mkBai4CoNhan(doc, 'Network') && !mkBai4CoNhan(doc, 'Netmask') && !mkBai4CoNhan(doc, 'Next Pool');
}

/** Đang ở trang DHCP Server, tab DHCP mặc định (chưa bấm Networks)? */
function mkBai4OTabDHCPMacDinh(doc) { return mkBai4Hash(doc) === '#IP:DHCP_Server'; }

/** Đang ở tab "Networks" của trang DHCP Server (danh sách, chưa mở chi tiết)? */
function mkBai4OTabNetworks(doc) {
  return mkBai4Hash(doc) === '#IP:DHCP_Server.Networks' && !mkBai4OChiTietNetworks(doc);
}

/** Đang ở trang danh sách Addresses (chưa mở chi tiết item nào)? */
function mkBai4OTrangDanhSachAddresses(doc) {
  return mkBai4Hash(doc).startsWith('#IP:Addresses') && !mkBai4OChiTietAddresses(doc);
}

/** Đang ở trang danh sách IP Pool (chưa mở chi tiết pool nào)? */
function mkBai4OTrangDanhSachPool(doc) {
  return mkBai4Hash(doc).startsWith('#IP:Pool') && !mkBai4LaTrangPool(doc);
}

/** Phần 1 (Addresses) đã lưu đúng chưa? */
function mkBai4AddressesDaDung() {
  try {
    if (!window._FTC_MK_BAI4_ADDRESSES_SAVED) return false;
    const b = window._FTC_MK_BAI4 && window._FTC_MK_BAI4.addresses;
    if (!b) return false;
    return b['Address'] === '192.168.10.1/24' && b['Network'] === '192.168.10.0';
  } catch (e) { return false; }
}

/** Phần 2 (Pool) đã lưu đúng chưa? */
function mkBai4PoolDaDung() {
  try {
    if (!window._FTC_MK_BAI4_POOL_SAVED) return false;
    const b = window._FTC_MK_BAI4 && window._FTC_MK_BAI4.pool;
    if (!b) return false;
    return b['Addresses'] === '192.168.10.10-192.168.10.254';
  } catch (e) { return false; }
}

/** Phần 3 (Networks) đã lưu đúng chưa? */
function mkBai4NetworksDaDung() {
  try {
    if (!window._FTC_MK_BAI4_NETWORKS_SAVED) return false;
    const b = window._FTC_MK_BAI4 && window._FTC_MK_BAI4.networks;
    if (!b) return false;
    return b['Address'] === '192.168.10.0/24' && b['Gateway'] === '192.168.10.1';
  } catch (e) { return false; }
}

/** Tìm ô nhập theo nhãn trong cùng hàng <tr> */
function mkBai4OTheoNhan(doc, nhan) {
  try {
    for (const tr of doc.querySelectorAll('tr')) {
      const lb = tr.querySelector('td.label');
      if (lb && lb.textContent.trim() === nhan) {
        return tr.querySelector('td.value input, td.value select');
      }
    }
  } catch (e) {}
  return null;
}

/** Tìm ô Address trong bảng danh sách Networks */
function mkBai4TimO_AddressDanhSachNetworks(doc) {
  try {
    for (const tbl of doc.querySelectorAll('table')) {
      const rows = tbl.querySelectorAll('tr');
      if (rows.length >= 2) {
        const oTieuDe = rows[0].querySelectorAll('td, th');
        let chiSo = -1;
        oTieuDe.forEach(function (o, i) { if (o.textContent.trim() === 'Address') chiSo = i; });
        if (chiSo !== -1 && rows[1]) {
          const oDuLieu = rows[1].querySelectorAll('td');
          if (oDuLieu[chiSo]) return oDuLieu[chiSo];
        }
      }
    }
  } catch (e) {}
  return null;
}

function mkBai4TimO_DanhSachAddresses(doc) {
  try {
    for (const tr of doc.querySelectorAll('tr')) {
      if (tr.textContent.includes('bridge-LAN')) {
        for (const td of tr.querySelectorAll('td')) {
          if (td.textContent.trim() === 'bridge-LAN') return td;
        }
        const tds = tr.querySelectorAll('td');
        if (tds.length > 0) return tds[tds.length - 1];
      }
    }
  } catch (e) {}
  return null;
}

function mkBai4TimO_DanhSachPool(doc) {
  try {
    for (const tr of doc.querySelectorAll('tr')) {
      if (tr.textContent.includes('dhcp-pool-lan')) {
        for (const td of tr.querySelectorAll('td')) {
          if (td.textContent.trim() === 'dhcp-pool-lan') return td;
        }
        const tds = tr.querySelectorAll('td');
        if (tds.length > 0) return tds[tds.length - 1];
      }
    }
  } catch (e) {}
  return null;
}

function mkBai4CaiTheoDoi(doc) {
  try {
    if (!doc) return;
    if (mkBai4OChiTietAddresses(doc)) {
      const oA = mkBai4OTheoNhan(doc, 'Address');
      const oN = mkBai4OTheoNhan(doc, 'Network');
      if (oA && !oA.id) oA.id = 'ftc-mk4-addr-address';
      if (oN && !oN.id) oN.id = 'ftc-mk4-addr-network';
    } else if (mkBai4LaTrangPool(doc)) {
      const oA = mkBai4OTheoNhan(doc, 'Addresses');
      if (oA && !oA.id) oA.id = 'ftc-mk4-pool-addresses';
    } else if (mkBai4OChiTietNetworks(doc)) {
      const oA = mkBai4OTheoNhan(doc, 'Address');
      const oG = mkBai4OTheoNhan(doc, 'Gateway');
      if (oA && !oA.id) oA.id = 'ftc-mk4-net-address';
      if (oG && !oG.id) oG.id = 'ftc-mk4-net-gateway';
    } else if (mkBai4OTabNetworks(doc)) {
      const oDiaChi = mkBai4TimO_AddressDanhSachNetworks(doc);
      if (oDiaChi && !oDiaChi.id) oDiaChi.id = 'ftc-mk4-net-row';
    } else if (mkBai4OTrangDanhSachAddresses(doc)) {
      const oAddr = mkBai4TimO_DanhSachAddresses(doc);
      if (oAddr && !oAddr.id) oAddr.id = 'ftc-mk4-addr-row';
    } else if (mkBai4OTrangDanhSachPool(doc)) {
      const oPool = mkBai4TimO_DanhSachPool(doc);
      if (oPool && !oPool.id) oPool.id = 'ftc-mk4-pool-row';
    }
  } catch (e) {}
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
    text: 'Nhấn Login',
    position: 'right',
    condition: function (doc) { return mkBai4ManDangNhap(doc); }
  },

  // ── Phần 1: IP > Addresses (Ảnh 1 & 2 — Bước 1 ➔ 6) ────────────────
  {
    selector: 'text:IP',
    text: 'Bước 1: chọn IP',
    position: 'right',
    condition: function (doc) {
      mkBai4CaiTheoDoi(doc);
      return !mkBai4ManDangNhap(doc) && !mkBai4AddressesDaDung()
        && !mkBai4OTrangDanhSachAddresses(doc) && !mkBai4OChiTietAddresses(doc)
        && !mkBai4CoTextHienThi(doc, 'Addresses');
    }
  },
  {
    selector: 'text:Addresses',
    text: 'Bước 2: chọn Addresses',
    position: 'right',
    condition: function (doc) {
      mkBai4CaiTheoDoi(doc);
      return !mkBai4ManDangNhap(doc) && !mkBai4AddressesDaDung()
        && !mkBai4OTrangDanhSachAddresses(doc) && !mkBai4OChiTietAddresses(doc)
        && mkBai4CoTextHienThi(doc, 'Addresses');
    }
  },
  {
    selector: '#ftc-mk4-addr-row, text:bridge-LAN, tr:has-text("bridge-LAN") td',
    text: 'Bước 3: nhấn đúp vào dòng bridge-LAN',
    position: 'right',
    condition: function (doc) {
      mkBai4CaiTheoDoi(doc);
      return !mkBai4AddressesDaDung() && mkBai4OTrangDanhSachAddresses(doc);
    }
  },
  {
    selector: '#ftc-mk4-addr-address, tr:has-text("Address") input',
    text: 'Bước 4: nhập 192.168.10.1/24',
    position: 'right',
    condition: function (doc) {
      mkBai4CaiTheoDoi(doc);
      return !mkBai4AddressesDaDung() && mkBai4OChiTietAddresses(doc);
    }
  },
  {
    selector: '#ftc-mk4-addr-network, tr:has-text("Network") input',
    text: 'Bước 5: nhập 192.168.10.0',
    position: 'right',
    condition: function (doc) {
      mkBai4CaiTheoDoi(doc);
      return !mkBai4AddressesDaDung() && mkBai4OChiTietAddresses(doc);
    }
  },
  {
    selector: 'text:OK',
    text: 'Bước 6: nhấn Apply và OK để lưu',
    position: 'left',
    offsetX: -120,
    condition: function (doc) {
      mkBai4CaiTheoDoi(doc);
      return !mkBai4AddressesDaDung() && mkBai4OChiTietAddresses(doc);
    }
  },

  // ── Phần 2: IP > Pool (Ảnh 3 & 4 — Bước 7 ➔ 11) ───────────────────
  {
    selector: 'text:IP',
    text: 'Bước 7: chọn IP',
    position: 'right',
    condition: function (doc) {
      mkBai4CaiTheoDoi(doc);
      return !mkBai4ManDangNhap(doc) && mkBai4AddressesDaDung() && !mkBai4PoolDaDung()
        && !mkBai4OTrangDanhSachPool(doc) && !mkBai4LaTrangPool(doc)
        && !mkBai4CoTextHienThi(doc, 'Pool');
    }
  },
  {
    selector: 'text:Pool',
    text: 'Bước 8: chọn Pool',
    position: 'right',
    condition: function (doc) {
      mkBai4CaiTheoDoi(doc);
      return !mkBai4ManDangNhap(doc) && mkBai4AddressesDaDung() && !mkBai4PoolDaDung()
        && !mkBai4OTrangDanhSachPool(doc) && !mkBai4LaTrangPool(doc)
        && mkBai4CoTextHienThi(doc, 'Pool');
    }
  },
  {
    selector: '#ftc-mk4-pool-row, text:dhcp-pool-lan, tr:has-text("dhcp-pool-lan") td',
    text: 'Bước 9: nhấn đúp vào dòng dhcp-pool-lan',
    position: 'right',
    condition: function (doc) {
      mkBai4CaiTheoDoi(doc);
      return mkBai4AddressesDaDung() && !mkBai4PoolDaDung() && mkBai4OTrangDanhSachPool(doc);
    }
  },
  {
    selector: '#ftc-mk4-pool-addresses, tr:has-text("Addresses") input',
    text: 'Bước 10: sửa Addresses thành 192.168.10.10-192.168.10.254',
    position: 'right',
    condition: function (doc) {
      mkBai4CaiTheoDoi(doc);
      return mkBai4AddressesDaDung() && !mkBai4PoolDaDung() && mkBai4LaTrangPool(doc);
    }
  },
  {
    selector: 'text:OK',
    text: 'Bước 11: nhấn Apply và OK để lưu',
    position: 'left',
    offsetX: -120,
    condition: function (doc) {
      mkBai4CaiTheoDoi(doc);
      return mkBai4AddressesDaDung() && !mkBai4PoolDaDung() && mkBai4LaTrangPool(doc);
    }
  },

  // ── Phần 3: IP > DHCP Server > Networks (Ảnh 5 — Bước 12 ➔ 17) ─────
  {
    selector: 'text:IP',
    text: 'Bước 12: chọn IP',
    position: 'right',
    condition: function (doc) {
      mkBai4CaiTheoDoi(doc);
      return !mkBai4ManDangNhap(doc) && mkBai4AddressesDaDung() && mkBai4PoolDaDung() && !mkBai4NetworksDaDung()
        && !mkBai4OTabDHCPMacDinh(doc) && !mkBai4OTabNetworks(doc) && !mkBai4OChiTietNetworks(doc)
        && !mkBai4CoTextHienThi(doc, 'DHCP Server');
    }
  },
  {
    selector: 'text:DHCP Server',
    text: 'Bước 13: chọn DHCP Server',
    position: 'right',
    condition: function (doc) {
      mkBai4CaiTheoDoi(doc);
      return !mkBai4ManDangNhap(doc) && mkBai4AddressesDaDung() && mkBai4PoolDaDung() && !mkBai4NetworksDaDung()
        && !mkBai4OTabDHCPMacDinh(doc) && !mkBai4OTabNetworks(doc) && !mkBai4OChiTietNetworks(doc)
        && mkBai4CoTextHienThi(doc, 'DHCP Server');
    }
  },
  {
    selector: 'text:Networks',
    text: 'Bước 14: chọn tab Networks',
    position: 'bottom',
    condition: function (doc) {
      mkBai4CaiTheoDoi(doc);
      return mkBai4AddressesDaDung() && mkBai4PoolDaDung() && !mkBai4NetworksDaDung()
        && mkBai4OTabDHCPMacDinh(doc);
    }
  },
  {
    selector: '#ftc-mk4-net-row, text:192.168.1.0/24, tr:has-text("192.168.") td',
    text: 'Bước 14: nhấn đúp vào rule mạng',
    position: 'right',
    condition: function (doc) {
      mkBai4CaiTheoDoi(doc);
      return mkBai4AddressesDaDung() && mkBai4PoolDaDung() && !mkBai4NetworksDaDung()
        && mkBai4OTabNetworks(doc);
    }
  },
  {
    selector: '#ftc-mk4-net-address, tr:has-text("Address") input',
    text: 'Bước 15: nhập 192.168.10.0/24',
    position: 'right',
    condition: function (doc) {
      mkBai4CaiTheoDoi(doc);
      return mkBai4AddressesDaDung() && mkBai4PoolDaDung() && !mkBai4NetworksDaDung()
        && mkBai4OChiTietNetworks(doc);
    }
  },
  {
    selector: '#ftc-mk4-net-gateway, tr:has-text("Gateway") input',
    text: 'Bước 16: nhập 192.168.10.1',
    position: 'right',
    condition: function (doc) {
      mkBai4CaiTheoDoi(doc);
      return mkBai4AddressesDaDung() && mkBai4PoolDaDung() && !mkBai4NetworksDaDung()
        && mkBai4OChiTietNetworks(doc);
    }
  },
  {
    selector: 'text:OK',
    text: 'Bước 17: nhấn Apply và OK để lưu',
    position: 'left',
    offsetX: -120,
    condition: function (doc) {
      mkBai4CaiTheoDoi(doc);
      return mkBai4AddressesDaDung() && mkBai4PoolDaDung() && !mkBai4NetworksDaDung()
        && mkBai4OChiTietNetworks(doc);
    }
  }
];
