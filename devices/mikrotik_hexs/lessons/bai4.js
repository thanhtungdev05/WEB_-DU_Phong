/**
 * devices/mikrotik_hexs/lessons/bai4.js
 * Bài 4: Cấu hình DHCP — MikroTik hEX S
 *
 * Cấu hình đầy đủ 3 phần theo trình tự thực tế và ảnh chụp đánh dấu:
 *   Phần 1: IP > Addresses (bridge-LAN): Address 192.168.10.1/24, Network 192.168.10.0 (Bước 1 - 6)
 *   Phần 2: IP > Pool (dhcp-pool-lan): Addresses 192.168.10.10-192.168.10.254 (Bước 7 - 11)
 *   Phần 3: IP > DHCP Server > Networks: Address 192.168.10.0/24, Gateway 192.168.10.1 (Bước 12 - 17)
 *
 * KIẾN TRÚC & LƯU CẤU HÌNH:
 * WebFig là SPA đóng dialog ngay sau khi nhấn OK. Quản lý 3 cờ lưu riêng biệt:
 *   window._FTC_MK_BAI4_ADDRESSES_SAVED
 *   window._FTC_MK_BAI4_POOL_SAVED
 *   window._FTC_MK_BAI4_NETWORKS_SAVED
 * và bản chụp dữ liệu window._FTC_MK_BAI4 = { addresses, pool, networks }
 * được cập nhật liên tục (mỗi 300ms) + chụp ngay trên pointerdown/click vào OK/Apply.
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
function mkBai4LaTrangNetworks(doc) {
  return !!mkBai4HangTheoNhan(doc, 'Netmask');
}

/** Đang là trang chi tiết Pool (có nhãn Next Pool)? */
function mkBai4LaTrangPool(doc) {
  return !!mkBai4HangTheoNhan(doc, 'Next Pool');
}

/** Đang là trang chi tiết Addresses (có Network, không có Netmask và không có Next Pool)? */
function mkBai4LaTrangAddresses(doc) {
  return !!mkBai4HangTheoNhan(doc, 'Network') && !mkBai4HangTheoNhan(doc, 'Netmask') && !mkBai4HangTheoNhan(doc, 'Next Pool');
}

/**
 * Bảng giá trị chuẩn — đo thực tế trên giả lập MikroTik hEX S.
 */
var MK_BAI4_CHUAN_ADDRESSES = [
  { nhan: 'Enabled', kieu: 'tich', dung: true, ten: '[Addresses] Enabled: giữ nguyên (có tích)' },
  { nhan: 'Address', kieu: 'chu', dung: '192.168.10.1/24', deBai: true, ten: '[Addresses] Address: 192.168.10.1/24' },
  { nhan: 'Network', kieu: 'chu', dung: '192.168.10.0', deBai: true, ten: '[Addresses] Network: 192.168.10.0' },
  { nhan: 'Interface', kieu: 'chon', dung: 'bridge-LAN', ten: '[Addresses] Interface: giữ nguyên bridge-LAN' }
];

var MK_BAI4_CHUAN_POOL = [
  { nhan: 'Name', kieu: 'chu', dung: 'dhcp-pool-lan', ten: '[Pool] Name: giữ nguyên dhcp-pool-lan' },
  { nhan: 'Addresses', kieu: 'chu', dung: '192.168.10.10-192.168.10.254', deBai: true, ten: '[Pool] Addresses: 192.168.10.10-192.168.10.254' },
  { nhan: 'Next Pool', kieu: 'chon', dung: 'none', ten: '[Pool] Next Pool: giữ nguyên none' }
];

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

function mkBai4DocTruong(doc, muc) {
  const tr = mkBai4HangTheoNhan(doc, muc.nhan);
  if (!tr) return null;
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

function mkBai4KhoaMuc(muc) {
  return muc.nhan + (typeof muc.idx === 'number' ? '#' + muc.idx : '');
}

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

function mkBai4TimO_AddressDanhSachNetworks(doc) {
  try {
    for (const tbl of doc.querySelectorAll('table')) {
      const rows = tbl.querySelectorAll('tr');
      if (rows.length < 2) continue;
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

function mkBai4CaiTheoDoi(win) {
  try {
    if (win._ftcMkBai4DangTheoDoi) return;
    win._ftcMkBai4DangTheoDoi = true;
    win.setInterval(function () {
      try {
        const doc = win.document;
        if (!doc) return;
        if (mkBai4LaTrangAddresses(doc)) {
          const oA = mkBai4OTheoNhan(doc, 'Address');
          const oN = mkBai4OTheoNhan(doc, 'Network');
          if (oA && !oA.id) oA.id = 'ftc-mk4-addr-address';
          if (oN && !oN.id) oN.id = 'ftc-mk4-addr-network';
        } else if (mkBai4LaTrangPool(doc)) {
          const oA = mkBai4OTheoNhan(doc, 'Addresses');
          if (oA && !oA.id) oA.id = 'ftc-mk4-pool-addresses';
        } else if (mkBai4LaTrangNetworks(doc)) {
          const oA = mkBai4OTheoNhan(doc, 'Address');
          const oG = mkBai4OTheoNhan(doc, 'Gateway');
          if (oA && !oA.id) oA.id = 'ftc-mk4-net-address';
          if (oG && !oG.id) oG.id = 'ftc-mk4-net-gateway';
        } else {
          const oAddr = mkBai4TimO_DanhSachAddresses(doc);
          if (oAddr && !oAddr.id) oAddr.id = 'ftc-mk4-addr-row';
          const oPool = mkBai4TimO_DanhSachPool(doc);
          if (oPool && !oPool.id) oPool.id = 'ftc-mk4-pool-row';
          const oNet = mkBai4TimO_AddressDanhSachNetworks(doc);
          if (oNet && !oNet.id) oNet.id = 'ftc-mk4-net-row';
        }
      } catch (e) {}
    }, 300);
  } catch (e) {}
}

window.DEVICE_MIKROTIK_HEXS_LESSONS.push({
  id: 'mikrotik_hexs-bai4',
  title: 'Cấu hình DHCP',
  subtitle: 'Cấu hình lớp mạng LAN và DHCP Server',
  instructions: [
    '<b>Yêu cầu:</b>',
    'Đổi lớp mạng LAN của router MikroTik hEX S sang 192.168.10.0/24:',
    '- IP > Addresses (bridge-LAN): Address <span class="val">192.168.10.1/24</span>, Network <span class="val">192.168.10.0</span>',
    '- IP > Pool (dhcp-pool-lan): Addresses <span class="val">192.168.10.10-192.168.10.254</span>',
    '- IP > DHCP Server > Networks: Address <span class="val">192.168.10.0/24</span>, Gateway <span class="val">192.168.10.1</span>'
  ],
  practiceUrl: '/sim_mikrotik_hexs/index.html',
  grading: {
    description: 'Kiểm tra cấu hình DHCP/LAN trên MikroTik hEX S',
    rules: [
      { id: 'addr_address', name: '[Addresses] Address: 192.168.10.1/24', selector: '#ftc-mk4-addr-address', expected: '192.168.10.1/24', type: 'text_exact', required: true },
      { id: 'addr_network', name: '[Addresses] Network: 192.168.10.0', selector: '#ftc-mk4-addr-network', expected: '192.168.10.0', type: 'text_exact', required: true },
      { id: 'pool_addresses', name: '[Pool] Addresses: 192.168.10.10-192.168.10.254', selector: '#ftc-mk4-pool-addresses', expected: '192.168.10.10-192.168.10.254', type: 'text_exact', required: true },
      { id: 'net_address', name: '[Networks] Address: 192.168.10.0/24', selector: '#ftc-mk4-net-address', expected: '192.168.10.0/24', type: 'text_exact', required: true },
      { id: 'net_gateway', name: '[Networks] Gateway: 192.168.10.1', selector: '#ftc-mk4-net-gateway', expected: '192.168.10.1', type: 'text_exact', required: true }
    ],
    customGrading: function (allDocs) {
      let docAddr = null, docPool = null, docNet = null;
      for (const d of allDocs) {
        try {
          if (!docAddr && mkBai4LaTrangAddresses(d)) docAddr = d;
          if (!docPool && mkBai4LaTrangPool(d)) docPool = d;
          if (!docNet && mkBai4LaTrangNetworks(d)) docNet = d;
        } catch (e) {}
      }

      const banChup = window._FTC_MK_BAI4 || { addresses: null, pool: null, networks: null };
      const addrDaLuu = !!(window._FTC_MK_BAI4_ADDRESSES_SAVED || (banChup && banChup.addresses) || (docAddr && docAddr._ftcIsSaved));
      const poolDaLuu = !!(window._FTC_MK_BAI4_POOL_SAVED || (banChup && banChup.pool) || (docPool && docPool._ftcIsSaved));
      const netDaLuu = !!(window._FTC_MK_BAI4_NETWORKS_SAVED || (banChup && banChup.networks) || (docNet && docNet._ftcIsSaved));

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

      const chiTietAddr = chamNhom('addr', MK_BAI4_CHUAN_ADDRESSES, docAddr, addrDaLuu, banChup.addresses);
      const chiTietPool = chamNhom('pool', MK_BAI4_CHUAN_POOL, docPool, poolDaLuu, banChup.pool);
      const chiTietNet = chamNhom('net', MK_BAI4_CHUAN_NETWORKS, docNet, netDaLuu, banChup.networks);

      function dong(ds) { return ds.filter(function (d) { return d.passed; }).length; }
      const addrDat = addrDaLuu && dong(chiTietAddr) === chiTietAddr.length;
      const poolDat = poolDaLuu && dong(chiTietPool) === chiTietPool.length;
      const netDat = netDaLuu && dong(chiTietNet) === chiTietNet.length;
      const datCaBai = addrDat && poolDat && netDat;

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

      const laHuongDan = (typeof window.ftcLayCheDo === 'function')
        && window.ftcLayCheDo() === 'guide';
      if (!laHuongDan || datCaBai) {
        return ketQua(chiTietAddr.concat(chiTietPool, chiTietNet), datCaBai);
      }

      let dsTrang = chiTietAddr;
      let daLuuTrang = addrDaLuu;
      if (addrDat) {
        if (!poolDat) {
          dsTrang = chiTietPool;
          daLuuTrang = poolDaLuu;
        } else {
          dsTrang = chiTietNet;
          daLuuTrang = netDaLuu;
        }
      }

      const trangHienTaiDat = !daLuuTrang || dong(dsTrang) === dsTrang.length;
      return ketQua(dsTrang, false, trangHienTaiDat);
    }
  },

  /** Xoá bản chụp + đặt lại máy chủ khi học viên mở lại bài. */
  onSimLoad: function (simWin) {
    try {
      const doc = simWin.document;
      const laTrangLogin = doc && doc.querySelector('input#name') && doc.querySelector('input#password');
      const chuaKhoiTao = !window._FTC_MK_BAI4 || (!window._FTC_MK_BAI4_ADDRESSES_SAVED && !window._FTC_MK_BAI4_POOL_SAVED && !window._FTC_MK_BAI4_NETWORKS_SAVED);
      if (laTrangLogin || chuaKhoiTao) {
        window._FTC_MK_BAI4 = { addresses: null, pool: null, networks: null };
        window._FTC_MK_BAI4_ADDRESSES_SAVED = false;
        window._FTC_MK_BAI4_POOL_SAVED = false;
        window._FTC_MK_BAI4_NETWORKS_SAVED = false;
        try {
          const ktvId = (typeof window.getKtvClientId === 'function' ? window.getKtvClientId() : '') || 'ktv_default';
          simWin.fetch('/sim_mikrotik_hexs/ftc_dat_lai?bai=4&_ktv=' + encodeURIComponent(ktvId) + '&_t=' + Date.now());
        } catch (e) {}
      }
      mkBai4CaiTheoDoi(simWin);

      if (!simWin._ftcMkBai4BatNutLuu) {
        simWin._ftcMkBai4BatNutLuu = true;

        simWin.setInterval(function () {
          try {
            const d = simWin.document;
            if (!window._FTC_MK_BAI4) {
              window._FTC_MK_BAI4 = { addresses: null, pool: null, networks: null };
            }
            if (d && mkBai4LaTrangAddresses(d)) {
              const liveAddr = mkBai4ChupNhom(d, MK_BAI4_CHUAN_ADDRESSES);
              if (liveAddr) window._FTC_MK_BAI4.addresses = liveAddr;
            } else if (d && mkBai4LaTrangPool(d)) {
              const livePool = mkBai4ChupNhom(d, MK_BAI4_CHUAN_POOL);
              if (livePool) window._FTC_MK_BAI4.pool = livePool;
            } else if (d && mkBai4LaTrangNetworks(d)) {
              const liveNet = mkBai4ChupNhom(d, MK_BAI4_CHUAN_NETWORKS);
              if (liveNet) window._FTC_MK_BAI4.networks = liveNet;
            }
          } catch (e) {}
        }, 300);

        const batNutLuu = function (e) {
          try {
            const btn = e.target && e.target.closest && e.target.closest('a, button, input');
            if (!btn) return;
            const txt = (btn.textContent || btn.value || '').trim().toLowerCase();
            if (!/^(ok|apply)$/.test(txt)) return;

            const d = simWin.document;
            if (d) {
              d._ftcIsSaved = true;
              window._hasClickedSaveInGuide = true;
              if (!window._FTC_MK_BAI4) {
                window._FTC_MK_BAI4 = { addresses: null, pool: null, networks: null };
              }
              if (mkBai4LaTrangAddresses(d)) {
                const ban = mkBai4ChupNhom(d, MK_BAI4_CHUAN_ADDRESSES);
                if (ban) {
                  window._FTC_MK_BAI4.addresses = ban;
                  window._FTC_MK_BAI4_ADDRESSES_SAVED = true;
                }
              } else if (mkBai4LaTrangPool(d)) {
                const ban = mkBai4ChupNhom(d, MK_BAI4_CHUAN_POOL);
                if (ban) {
                  window._FTC_MK_BAI4.pool = ban;
                  window._FTC_MK_BAI4_POOL_SAVED = true;
                }
              } else if (mkBai4LaTrangNetworks(d)) {
                const ban = mkBai4ChupNhom(d, MK_BAI4_CHUAN_NETWORKS);
                if (ban) {
                  window._FTC_MK_BAI4.networks = ban;
                  window._FTC_MK_BAI4_NETWORKS_SAVED = true;
                }
              }
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
      if (!window._FTC_MK_BAI4) window._FTC_MK_BAI4 = { addresses: null, pool: null, networks: null };
      if (mkBai4LaTrangAddresses(doc)) {
        const ban = mkBai4ChupNhom(doc, MK_BAI4_CHUAN_ADDRESSES);
        if (ban) { window._FTC_MK_BAI4.addresses = ban; }
        window._FTC_MK_BAI4_ADDRESSES_SAVED = true;
      } else if (mkBai4LaTrangPool(doc)) {
        const ban = mkBai4ChupNhom(doc, MK_BAI4_CHUAN_POOL);
        if (ban) { window._FTC_MK_BAI4.pool = ban; }
        window._FTC_MK_BAI4_POOL_SAVED = true;
      } else if (mkBai4LaTrangNetworks(doc)) {
        const ban = mkBai4ChupNhom(doc, MK_BAI4_CHUAN_NETWORKS);
        if (ban) { window._FTC_MK_BAI4.networks = ban; }
        window._FTC_MK_BAI4_NETWORKS_SAVED = true;
      }
      setTimeout(function () { window._ftcMkChanTooltip = false; }, 200);
    } catch (e) {}
  },

  guidePopups: (window.TOOLTIPS_MIKROTIK_HEXS
                && window.TOOLTIPS_MIKROTIK_HEXS['mikrotik_hexs-bai4']) || []
});

window.mkBai4Reset = function () {
  window._FTC_MK_BAI4 = { addresses: null, pool: null, networks: null };
  window._FTC_MK_BAI4_ADDRESSES_SAVED = false;
  window._FTC_MK_BAI4_POOL_SAVED = false;
  window._FTC_MK_BAI4_NETWORKS_SAVED = false;
};

