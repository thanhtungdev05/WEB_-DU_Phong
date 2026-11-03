/**
 * devices/mikrotik_hexs/lessons/bai5.js
 * Bài 5: Cấu hình Policy Routing — MikroTik hEX S
 *
 * Cấu hình Policy Based Routing (PBR) 2-PC / 2-WAN chuẩn thực tế theo 3 phần:
 *   Phần 1: Routing > Tables: Tạo 2 bảng định tuyến ra-wan1 và ra-wan2 (tích chọn FIB).
 *   Phần 2: IP > Firewall > Mangle: Tạo 2 luật prerouting đánh dấu lưu lượng:
 *       • PC1 (192.168.1.100) -> New Routing Mark: ra-wan1
 *       • PC2 (192.168.1.101) -> New Routing Mark: ra-wan2
 *   Phần 3: IP > Routes: Tạo 2 Default Route (Dst. Address 0.0.0.0/0):
 *       • Gateway pppoe-out1 (hoặc 1.1.1.1) trỏ vào bảng ra-wan1
 *       • Gateway pppoe-out2 (hoặc 2.2.2.2) trỏ vào bảng ra-wan2
 */

window.DEVICE_MIKROTIK_HEXS_LESSONS = window.DEVICE_MIKROTIK_HEXS_LESSONS || [];

function mkBai5DocHash(doc) {
  try {
    const w = (doc && doc.defaultView) || window;
    return (w.location && w.location.hash) || (doc && doc.location && doc.location.hash) || '';
  } catch (e) { return ''; }
}

function mkBai5CacDong(doc, soOToiThieu) {
  const ds = [];
  try {
    for (const tr of doc.querySelectorAll('tr')) {
      if (tr.querySelector('th')) continue;
      const tds = tr.querySelectorAll('td');
      if (tds.length >= soOToiThieu) {
        ds.push(Array.from(tds).map(function (t) { return (t.textContent || '').trim(); }));
      }
    }
  } catch (e) { }
  return ds;
}

function mkBai5ChupBang(doc) {
  return mkBai5CacDong(doc, 3).map(function (o) {
    return {
      comment: o[2] || '',
      ten: (o[2] || o[3] || '').trim(),
      fib: (o[3] || o[4] || '').toLowerCase(),
      raw: o.join(' ')
    };
  }).filter(function (x) { return x.ten; });
}

function mkBai5ChupTuyen(doc) {
  return mkBai5CacDong(doc, 5).map(function (o) {
    return {
      dst: o[2] || o[3] || '',
      gateway: (o[3] || o[4] || '').trim(),
      distance: o[4] || o[5] || '',
      bang: (o[5] || o[6] || '').trim(),
      raw: o.join(' ')
    };
  }).filter(function (x) { return x.gateway; });
}

function mkBai5ChupMangle(doc) {
  return mkBai5CacDong(doc, 6).map(function (o) {
    return {
      action: (o[4] || '').toLowerCase(),
      chain: (o[5] || '').toLowerCase(),
      src: (o[6] || '').trim(),
      raw: o.join(' ')
    };
  }).filter(function (x) { return x.action; });
}

function mkBai5DocTruongForm(doc, nhan) {
  try {
    const nhanLower = nhan.toLowerCase();
    for (const tr of doc.querySelectorAll('tr')) {
      const lb = tr.querySelector('td.label, th, td:first-child');
      if (lb && lb.textContent.trim().toLowerCase() === nhanLower) {
        const o = tr.querySelector('input, select, textarea');
        if (!o) return null;
        let gt;
        if (o.type === 'checkbox') gt = o.checked ? 'yes' : 'no';
        else if (o.tagName === 'SELECT') {
          const op = o.options[o.selectedIndex];
          gt = op ? op.text.trim() : (o.value || '').trim();
        } else {
          gt = (o.value || '').trim();
        }
        return { gt: gt, batLen: !o.disabled };
      }
    }
  } catch (e) { }
  return null;
}

function mkBai5ChupTheoTrang(doc) {
  try {
    const h = mkBai5DocHash(doc);
    if (h.indexOf('#Routing:Tables') === 0 && h.indexOf('#Routing:Tables.') !== 0) {
      const ds = mkBai5ChupBang(doc);
      if (ds.length) {
        window._FTC_MK5_DS_BANG = ds;
        if (ds.some(function (b) { return b.ten === 'ra-wan1' || b.ten === 'ISP1'; })) {
          window._FTC_MK5_BANG1_SAVED = true;
        }
        if (ds.some(function (b) { return b.ten === 'ra-wan2'; })) {
          window._FTC_MK5_BANG2_SAVED = true;
        }
      }
    } else if (h.indexOf('#IP:Routes') === 0 && h.indexOf('#IP:Routes.') !== 0) {
      const ds = mkBai5ChupTuyen(doc);
      if (ds.length) {
        window._FTC_MK5_DS_TUYEN = ds;
        if (ds.some(function (t) {
          const gw = (t.gateway || '').toLowerCase();
          const bang = (t.bang || '').toLowerCase();
          return (gw.includes('pppoe-out1') || gw.includes('1.1.1.1') || gw.includes('ether1')) &&
            (bang.includes('ra-wan1') || bang.includes('isp1'));
        })) {
          window._FTC_MK5_ROUTE1_SAVED = true;
        }
        if (ds.some(function (t) {
          const gw = (t.gateway || '').toLowerCase();
          const bang = (t.bang || '').toLowerCase();
          return (gw.includes('pppoe-out2') || gw.includes('2.2.2.2') || gw.includes('ether2')) &&
            bang.includes('ra-wan2');
        })) {
          window._FTC_MK5_ROUTE2_SAVED = true;
        }
      }
    } else if (h.indexOf('#IP:Firewall.Mangle') === 0 && h.indexOf('#IP:Firewall.Mangle.') !== 0) {
      const ds = mkBai5ChupMangle(doc);
      if (ds.length) {
        window._FTC_MK5_DS_MANGLE = ds;
        if (ds.some(function (m) {
          const raw = (m.raw || '').toLowerCase();
          return (m.src === '192.168.1.100' || raw.includes('192.168.1.100')) &&
            (raw.includes('ra-wan1') || raw.includes('isp1') || m.action.includes('mark'));
        })) {
          window._FTC_MK5_MANGLE1_SAVED = true;
        }
        if (ds.some(function (m) {
          const raw = (m.raw || '').toLowerCase();
          return (m.src === '192.168.1.101' || raw.includes('192.168.1.101')) &&
            (raw.includes('ra-wan2') || m.action.includes('mark'));
        })) {
          window._FTC_MK5_MANGLE2_SAVED = true;
        }
      }
    }
  } catch (e) { }
}

if (typeof window !== 'undefined' && !window._ftcMoXemAnh) {
  window._ftcMoXemAnh = function (src) {
    try {
      let modal = document.getElementById('ftc-image-lightbox');
      if (!modal) {
        modal = document.createElement('div');
        modal.id = 'ftc-image-lightbox';
        modal.style.cssText = 'display:none;position:fixed;top:0;left:0;width:100vw;height:100vh;background:rgba(15,23,42,0.86);backdrop-filter:blur(5px);-webkit-backdrop-filter:blur(5px);z-index:999999;align-items:center;justify-content:center;cursor:zoom-out;padding:16px;box-sizing:border-box;';
        modal.innerHTML = '<div style="position:relative;max-width:95vw;max-height:95vh;display:flex;align-items:center;justify-content:center;">' +
          '<img id="ftc-image-lightbox-img" src="" alt="Sơ đồ chi tiết" style="max-width:100%;max-height:92vh;border-radius:12px;box-shadow:0 25px 60px rgba(0,0,0,0.5);border:2px solid rgba(255,255,255,0.25);cursor:default;" onclick="event.stopPropagation()">' +
          '<button type="button" style="position:absolute;top:-14px;right:-14px;width:34px;height:34px;border-radius:50%;background:#ef4444;color:#fff;border:2px solid #fff;font-size:16px;font-weight:bold;cursor:pointer;display:flex;align-items:center;justify-content:center;box-shadow:0 4px 14px rgba(0,0,0,0.4);line-height:1;" title="Đóng (Esc)">✕</button>' +
          '</div>';
        modal.onclick = function () { modal.style.display = 'none'; };
        const closeBtn = modal.querySelector('button');
        if (closeBtn) closeBtn.onclick = function () { modal.style.display = 'none'; };
        document.addEventListener('keydown', function (e) {
          if (e.key === 'Escape' && modal.style.display === 'flex') modal.style.display = 'none';
        });
        document.body.appendChild(modal);
      }
      const img = modal.querySelector('#ftc-image-lightbox-img');
      if (img) img.src = src;
      modal.style.display = 'flex';
    } catch (e) { }
  };
}

window.DEVICE_MIKROTIK_HEXS_LESSONS.push({
  id: 'mikrotik_hexs-bai5',
  title: 'Cấu hình Policy Routing',
  subtitle: 'Định tuyến địa chỉ IP theo chính sách (Policy Based Routing)',
  instructions: [
    '<div class="ftc-pbr-diagram-wrap" style="text-align:center;margin:2px 0 6px;">' +
    '<img src="assets/mikrotik_pbr_diagram.jpg?v=605646a08a1986a2" ' +
    'alt="Sơ đồ Bài thực hành Policy Based Routing (PBR)" ' +
    'style="max-width:100%;height:auto;border-radius:10px;box-shadow:0 3px 12px rgba(15,23,42,0.12);border:1px solid #e2e8f0;cursor:pointer;display:block;margin:0 auto;transition:transform 0.2s ease;" ' +
    'onmouseover="this.style.transform=\'scale(1.01)\'" onmouseout="this.style.transform=\'scale(1)\'" ' +
    'onclick="window._ftcMoXemAnh && window._ftcMoXemAnh(this.src)" ' +
    'title="Nhấp vào để phóng to toàn màn hình">' +
    '<div style="font-size:11.5px;color:#64748b;margin-top:6px;display:flex;align-items:center;justify-content:center;gap:4px;cursor:pointer;" onclick="window._ftcMoXemAnh && window._ftcMoXemAnh(\'assets/mikrotik_pbr_diagram.jpg?v=605646a08a1986a2\')">' +
    '<span>🔍</span> <i>Nhấp vào ảnh để phóng to toàn màn hình</i>' +
    '</div>' +
    '</div>',
  ],
  practiceUrl: '/sim_mikrotik_hexs/index.html',

  grading: {
    description: 'Kiểm tra Policy Routing 2-PC / 2-WAN (Routing Tables + Firewall Mangle + IP Routes) trên MikroTik hEX S',
    rules: [
      { id: 'mk5_bang', name: 'Tạo 2 bảng định tuyến ra-wan1 và ra-wan2 (tích chọn FIB)', selector: 'tr', expected: 'ra-wan1', type: 'text_contains', required: true },
      { id: 'mk5_mangle', name: 'Tạo 2 luật Mangle mark routing cho PC1 (192.168.1.100) và PC2 (192.168.1.101)', selector: 'tr', expected: '192.168.1.100', type: 'text_contains', required: true },
      { id: 'mk5_route', name: 'Tạo 2 Default Route ra 2 WAN qua bảng ra-wan1 và ra-wan2', selector: 'tr', expected: '0.0.0.0/0', type: 'text_contains', required: true }
    ],

    customGrading: function (allDocs) {
      let doc = null;
      for (const d of allDocs) {
        try {
          if (mkBai5DocHash(d)) { doc = d; break; }
        } catch (e) { }
      }
      if (doc) mkBai5ChupTheoTrang(doc);

      const h = doc ? mkBai5DocHash(doc) : '';
      const dangOHopThoai = h.indexOf('#Routing:Tables.') === 0 || h.indexOf('#IP:Routes.') === 0 || h.indexOf('#IP:Firewall.Mangle.') === 0;

      const dsBang = window._FTC_MK5_DS_BANG || [];
      const dsTuyen = window._FTC_MK5_DS_TUYEN || [];
      const dsMangle = window._FTC_MK5_DS_MANGLE || [];

      const b1Saved = !!window._FTC_MK5_BANG1_SAVED || dsBang.some(function (b) { return b.ten === 'ra-wan1' || b.ten === 'ISP1'; });
      const b2Saved = !!window._FTC_MK5_BANG2_SAVED || dsBang.some(function (b) { return b.ten === 'ra-wan2'; });
      const bangDat = b1Saved && b2Saved;

      const m1Saved = !!window._FTC_MK5_MANGLE1_SAVED || dsMangle.some(function (m) {
        const raw = (m.raw || '').toLowerCase();
        return (m.src === '192.168.1.100' || raw.includes('192.168.1.100')) &&
          (raw.includes('ra-wan1') || raw.includes('isp1') || m.action.includes('mark'));
      });
      const m2Saved = !!window._FTC_MK5_MANGLE2_SAVED || dsMangle.some(function (m) {
        const raw = (m.raw || '').toLowerCase();
        return (m.src === '192.168.1.101' || raw.includes('192.168.1.101')) &&
          (raw.includes('ra-wan2') || m.action.includes('mark'));
      });
      const mangleDat = m1Saved && m2Saved;

      const r1Saved = !!window._FTC_MK5_ROUTE1_SAVED || dsTuyen.some(function (t) {
        const gw = (t.gateway || '').toLowerCase();
        const bang = (t.bang || '').toLowerCase();
        return (gw.includes('pppoe-out1') || gw.includes('1.1.1.1') || gw.includes('ether1')) &&
          (bang.includes('ra-wan1') || bang.includes('isp1'));
      });
      const r2Saved = !!window._FTC_MK5_ROUTE2_SAVED || dsTuyen.some(function (t) {
        const gw = (t.gateway || '').toLowerCase();
        const bang = (t.bang || '').toLowerCase();
        return (gw.includes('pppoe-out2') || gw.includes('2.2.2.2') || gw.includes('ether2')) &&
          bang.includes('ra-wan2');
      });
      const routeDat = r1Saved && r2Saved;

      const details = [];

      // Tiêu chí 1: Routing Tables (ra-wan1 và ra-wan2 đều có FIB)
      details.push({
        id: 'mk5_rule_bang',
        name: 'Phần 1: Bảng định tuyến ra-wan1 và ra-wan2 (FIB đã bật)',
        expected: 'Tạo đủ 2 bảng: ra-wan1 và ra-wan2 (tích chọn FIB)',
        actual: bangDat ? 'Đã tạo đủ 2 bảng ra-wan1 và ra-wan2' : (b1Saved ? 'Mới tạo bảng ra-wan1, còn thiếu ra-wan2' : 'Chưa tạo đủ 2 bảng định tuyến'),
        passed: bangDat,
        message: bangDat ? 'Chính xác' : 'Cần vào Routing > Tables tạo 2 bảng ra-wan1 và ra-wan2, tích chọn ô FIB'
      });

      // Tiêu chí 2: Firewall Mangle (prerouting mark routing cho 2 PC)
      details.push({
        id: 'mk5_rule_mangle',
        name: 'Phần 2: Mangle Rule đánh dấu luồng cho PC1 (100) và PC2 (101)',
        expected: 'PC1 192.168.1.100 -> ra-wan1 | PC2 192.168.1.101 -> ra-wan2',
        actual: mangleDat ? 'Đã tạo đủ 2 luật Mangle cho PC1 và PC2' : (m1Saved ? 'Mới tạo luật cho PC1 (192.168.1.100), còn thiếu PC2' : 'Chưa tạo luật Mangle'),
        passed: mangleDat,
        message: mangleDat ? 'Chính xác' : 'Cần vào IP > Firewall > Mangle tạo 2 luật prerouting mark routing cho 192.168.1.100 (ra-wan1) và 192.168.1.101 (ra-wan2)'
      });

      // Tiêu chí 3: IP Routes (2 Default Route trỏ đúng 2 bảng)
      details.push({
        id: 'mk5_rule_route',
        name: 'Phần 3: Default Route 0.0.0.0/0 trỏ 2 bảng ra-wan1 và ra-wan2',
        expected: 'Gateway WAN1 trỏ ra-wan1 | Gateway WAN2 trỏ ra-wan2',
        actual: routeDat ? 'Đã tạo đủ 2 tuyến Default Route ra 2 WAN' : (r1Saved ? 'Mới tạo tuyến cho ra-wan1, còn thiếu ra-wan2' : 'Chưa tạo tuyến Route ra 2 WAN'),
        passed: routeDat,
        message: routeDat ? 'Chính xác' : 'Cần vào IP > Routes tạo 2 tuyến 0.0.0.0/0: pppoe-out1 vào ra-wan1 và pppoe-out2 vào ra-wan2'
      });

      const soDung = details.filter(function (d) { return d.passed; }).length;
      const datCaBai = (soDung === details.length) && !dangOHopThoai;

      return {
        passed: datCaBai,
        score: datCaBai ? 100 : Math.round((soDung / details.length) * 100),
        passedCount: soDung,
        totalRules: details.length,
        details: details,
        trangHienTaiDat: true,
        daVaoTrangCuoi: datCaBai
      };
    }
  },

  onSimLoad: function (simWin) {
    try {
      const doc = simWin.document;
      const laTrangLogin = doc && doc.querySelector('input#name') && doc.querySelector('input#password');
      const chuaKhoiTao = !window._FTC_MK5_BANG1_SAVED && !window._FTC_MK5_ROUTE1_SAVED && !window._FTC_MK5_MANGLE1_SAVED;

      if (laTrangLogin || chuaKhoiTao) {
        window._FTC_MK5_BANG1_SAVED = false;
        window._FTC_MK5_BANG2_SAVED = false;
        window._FTC_MK5_ROUTE1_SAVED = false;
        window._FTC_MK5_ROUTE2_SAVED = false;
        window._FTC_MK5_MANGLE1_SAVED = false;
        window._FTC_MK5_MANGLE2_SAVED = false;
        window._FTC_MK5_DS_BANG = null;
        window._FTC_MK5_DS_TUYEN = null;
        window._FTC_MK5_DS_MANGLE = null;
        try {
          const ktvId = (typeof window.getKtvClientId === 'function' ? window.getKtvClientId() : '') || 'ktv_default';
          simWin.fetch('/sim_mikrotik_hexs/ftc_dat_lai?bai=5&_ktv=' + encodeURIComponent(ktvId) + '&_t=' + Date.now());
        } catch (e) { }
      }

      if (!simWin._ftcMkBai5TheoDoiLuu) {
        simWin._ftcMkBai5TheoDoiLuu = true;

        simWin.setInterval(function () {
          try {
            const d = simWin.document;
            if (d) mkBai5ChupTheoTrang(d);
          } catch (e) { }
        }, 300);

        const batNutLuu = function (e) {
          try {
            const btn = e.target && e.target.closest && e.target.closest('a, button, input');
            if (!btn) return;
            const txt = (btn.textContent || btn.value || '').trim().toLowerCase();
            if (!/^(ok|apply)$/.test(txt)) return;

            const d = simWin.document;
            const h = mkBai5DocHash(d);
            if (h.indexOf('#Routing:Tables') === 0) {
              const nameField = mkBai5DocTruongForm(d, 'Name');
              if (nameField) {
                if (nameField.gt === 'ra-wan1' || nameField.gt === 'ISP1') window._FTC_MK5_BANG1_SAVED = true;
                if (nameField.gt === 'ra-wan2') window._FTC_MK5_BANG2_SAVED = true;
              }
              if (txt === 'ok') {
                simWin.setTimeout(function () {
                  try {
                    if (typeof simWin.openContent === 'function') simWin.openContent('#Routing:Tables');
                    else simWin.location.hash = '#Routing:Tables';
                  } catch (e2) { }
                }, 140);
              }
            } else if (h.indexOf('#IP:Routes') === 0) {
              const rtField = mkBai5DocTruongForm(d, 'Routing Table');
              if (rtField) {
                if (rtField.gt === 'ra-wan1' || rtField.gt === 'ISP1') window._FTC_MK5_ROUTE1_SAVED = true;
                if (rtField.gt === 'ra-wan2') window._FTC_MK5_ROUTE2_SAVED = true;
              }
              if (txt === 'ok') {
                simWin.setTimeout(function () {
                  try {
                    if (typeof simWin.openContent === 'function') simWin.openContent('#IP:Routes');
                    else simWin.location.hash = '#IP:Routes';
                  } catch (e2) { }
                }, 140);
              }
            } else if (h.indexOf('#IP:Firewall.Mangle') === 0) {
              const srcField = mkBai5DocTruongForm(d, 'Src. Address');
              const markField = mkBai5DocTruongForm(d, 'New Routing Mark');
              if (srcField) {
                if (srcField.gt === '192.168.1.100' || (markField && (markField.gt === 'ra-wan1' || markField.gt === 'ISP1'))) {
                  window._FTC_MK5_MANGLE1_SAVED = true;
                }
                if (srcField.gt === '192.168.1.101' || (markField && markField.gt === 'ra-wan2')) {
                  window._FTC_MK5_MANGLE2_SAVED = true;
                }
              }
              if (txt === 'ok') {
                simWin.setTimeout(function () {
                  try {
                    if (typeof simWin.openContent === 'function') simWin.openContent('#IP:Firewall.Mangle');
                    else simWin.location.hash = '#IP:Firewall.Mangle';
                  } catch (e2) { }
                }, 140);
              }
            }
          } catch (err) { }
        };

        try {
          simWin.document.addEventListener('pointerdown', batNutLuu, true);
          simWin.document.addEventListener('click', batNutLuu, true);
        } catch (err) { }
      }
    } catch (e) { }
  },

  guidePopups: (window.TOOLTIPS_MIKROTIK_HEXS
    && window.TOOLTIPS_MIKROTIK_HEXS['mikrotik_hexs-bai5']) || []
});

window.mkBai5Reset = function () {
  window._FTC_MK5_BANG_SAVED = false;
  window._FTC_MK5_ROUTE_SAVED = false;
  window._FTC_MK5_MANGLE_SAVED = false;
  window._FTC_MK5_BANG1_SAVED = false;
  window._FTC_MK5_BANG2_SAVED = false;
  window._FTC_MK5_ROUTE1_SAVED = false;
  window._FTC_MK5_ROUTE2_SAVED = false;
  window._FTC_MK5_MANGLE1_SAVED = false;
  window._FTC_MK5_MANGLE2_SAVED = false;
  window._FTC_MK5_DS_BANG = null;
  window._FTC_MK5_DS_TUYEN = null;
  window._FTC_MK5_DS_MANGLE = null;
};
