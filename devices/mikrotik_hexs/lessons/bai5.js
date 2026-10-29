/**
 * devices/mikrotik_hexs/lessons/bai5.js
 * Bài 5: Cấu hình Policy Routing — MikroTik hEX S
 *
 * Cấu hình Policy Based Routing (PBR) chuẩn thực tế theo 3 phần:
 *   Phần 1: Routing > Tables: Tạo bảng định tuyến ISP1, tích chọn FIB.
 *   Phần 2: IP > Routes: Tạo Default Route (Dst. Address 0.0.0.0/0, Gateway 1.1.1.1, Routing Table ISP1).
 *   Phần 3: IP > Firewall > Mangle: Tạo luật prerouting đánh dấu lưu lượng LAN 192.168.1.0/24 (Action mark routing, New Routing Mark ISP1).
 */

window.DEVICE_MIKROTIK_HEXS_LESSONS = window.DEVICE_MIKROTIK_HEXS_LESSONS || [];

var MK_BAI5_MANGLE_SRC = '192.168.1.0/24';
var MK_BAI5_MANGLE_CHAIN = 'prerouting';
var MK_BAI5_MANGLE_ACTION = 'mark routing';
var MK_BAI5_MANGLE_MARK = 'ISP1';

function mkBai5DocHash(doc) {
  try {
    const w = doc.defaultView || window;
    return (w.location && w.location.hash) || '';
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
  } catch (e) {}
  return ds;
}

function mkBai5ChupBang(doc) {
  return mkBai5CacDong(doc, 5).map(function (o) {
    return { comment: o[2] || '', ten: o[3] || '', fib: (o[4] || '').toLowerCase() };
  }).filter(function (x) { return x.ten; });
}

function mkBai5ChupTuyen(doc) {
  return mkBai5CacDong(doc, 7).map(function (o) {
    return { dst: o[3] || '', gateway: o[4] || '', distance: o[5] || '', bang: o[6] || '' };
  }).filter(function (x) { return x.gateway; });
}

function mkBai5ChupMangle(doc) {
  return mkBai5CacDong(doc, 15).map(function (o) {
    return { action: o[4] || '', chain: o[5] || '', src: o[6] || '' };
  }).filter(function (x) { return x.action; });
}

function mkBai5ChupTheoTrang(doc) {
  try {
    const h = mkBai5DocHash(doc);
    if (h === '#Routing:Tables') {
      const d = mkBai5ChupBang(doc);
      if (d.length) window._FTC_MK5_DS_BANG = d;
      if (d.some(function (b) { return b.ten === 'ISP1'; })) {
        window._FTC_MK5_BANG_SAVED = true;
      }
    } else if (h === '#IP:Routes') {
      const d = mkBai5ChupTuyen(doc);
      if (d.length) window._FTC_MK5_DS_TUYEN = d;
      if (d.some(function (t) { return t.gateway === '1.1.1.1' && (t.bang === 'ISP1' || !t.bang || t.bang === 'main'); })) {
        window._FTC_MK5_ROUTE_SAVED = true;
      }
    } else if (h.indexOf('#IP:Firewall.Mangle') === 0 && h.indexOf('#IP:Firewall.Mangle.') !== 0) {
      const d = mkBai5ChupMangle(doc);
      if (d.length) window._FTC_MK5_DS_MANGLE = d;
      if (d.some(function (m) { return m.src === MK_BAI5_MANGLE_SRC && m.action === 'mark routing'; })) {
        window._FTC_MK5_MANGLE_SAVED = true;
      }
    }
  } catch (e) {}
}

function mkBai5DocTruongForm(doc, nhan) {
  try {
    for (const tr of doc.querySelectorAll('tr')) {
      const lb = tr.querySelector('td.label');
      if (lb && lb.textContent.trim().toLowerCase() === nhan.toLowerCase()) {
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
  } catch (e) {}
  return null;
}

window.DEVICE_MIKROTIK_HEXS_LESSONS.push({
  id: 'mikrotik_hexs-bai5',
  title: 'Cấu hình Policy Routing',
  subtitle: 'Định tuyến địa chỉ IP theo chính sách (Policy Based Routing)',
  instructions: [
    '<b>Mục tiêu bài học:</b>',
    'Cấu hình định tuyến địa chỉ IP theo chính sách (Policy Based Routing - PBR) để ép toàn bộ lưu lượng của dải mạng LAN <span class="val">192.168.1.0/24</span> đi ra ngoài Internet qua hướng Gateway <span class="val">1.1.1.1</span>.',
    '<b>Yêu cầu thực hiện theo 3 phần:</b>',
    '- Đăng nhập router với Username: <span class="val">admin</span>, Mật khẩu: (để trống).',
    '<b>Phần 1: Tạo bảng định tuyến (Routing Table)</b>',
    '&nbsp;&nbsp;• Vào <b>Routing > Tables</b>, nhấp <b>Add New</b>.',
    '&nbsp;&nbsp;• Nhập Name: <span class="val">ISP1</span> và tích chọn ô <span class="val">FIB</span>.',
    '&nbsp;&nbsp;• Nhấn <b>OK</b> để lưu bảng.',
    '<b>Phần 2: Tạo tuyến đường mặc định (Default Route)</b>',
    '&nbsp;&nbsp;• Vào <b>IP > Routes</b>, nhấp <b>Add New</b>.',
    '&nbsp;&nbsp;• Nhập Gateway: <span class="val">1.1.1.1</span>.',
    '&nbsp;&nbsp;• Tại mục Routing Table: chọn <span class="val">ISP1</span>.',
    '&nbsp;&nbsp;• Nhấn <b>OK</b> để lưu tuyến.',
    '<b>Phần 3: Đánh dấu gói tin theo IP nguồn (Firewall Mangle)</b>',
    '&nbsp;&nbsp;• Vào <b>IP > Firewall</b>, nhấp chọn tab <b>Mangle</b>, nhấp <b>Add New</b>.',
    '&nbsp;&nbsp;• Tab General: Chain <span class="val">prerouting</span>, mở khóa ô Src. Address nhập <span class="val">192.168.1.0/24</span>.',
    '&nbsp;&nbsp;• Tab Action: Mở khối Action, chọn Action <span class="val">mark routing</span>, New Routing Mark: <span class="val">ISP1</span>.',
    '&nbsp;&nbsp;• Nhấn <b>OK</b> để hoàn tất.'
  ],
  practiceUrl: '/sim_mikrotik_hexs/index.html',

  grading: {
    description: 'Kiểm tra Policy Routing (Routing Table + Route + Firewall Mangle) trên MikroTik hEX S',
    rules: [
      { id: 'mk5_bang', name: 'Tạo bảng định tuyến ISP1 có tích FIB', selector: 'tr', expected: 'ISP1', type: 'text_contains', required: true },
      { id: 'mk5_route', name: 'Tạo Default Route Gateway 1.1.1.1 qua bảng ISP1', selector: 'tr', expected: '1.1.1.1', type: 'text_contains', required: true },
      { id: 'mk5_mangle', name: 'Tạo luật Mangle đánh dấu gói tin LAN 192.168.1.0/24', selector: 'tr', expected: MK_BAI5_MANGLE_SRC, type: 'text_contains', required: true }
    ],
    customGrading: function (allDocs) {
      let doc = null;
      for (const d of allDocs) {
        try {
          if (mkBai5DocHash(d)) { doc = d; break; }
        } catch (e) {}
      }
      if (doc) mkBai5ChupTheoTrang(doc);

      const dsBang = window._FTC_MK5_DS_BANG || [];
      const dsTuyen = window._FTC_MK5_DS_TUYEN || [];
      const dsMangle = window._FTC_MK5_DS_MANGLE || [];
      const bangSaved = !!window._FTC_MK5_BANG_SAVED;
      const routeSaved = !!window._FTC_MK5_ROUTE_SAVED;
      const mangleSaved = !!window._FTC_MK5_MANGLE_SAVED;

      const details = [];

      // Tiêu chí 1: Tạo bảng định tuyến ISP1 (có tích FIB)
      const timBang = dsBang.find(function (b) { return b.ten === 'ISP1'; });
      const bangDat = bangSaved || (!!timBang && (timBang.fib === 'yes' || timBang.fib === 'true' || timBang.fib === ''));
      details.push({
        id: 'mk5_rule_bang',
        name: 'Phần 1: Bảng định tuyến ISP1 (FIB đã bật)',
        expected: 'Tên bảng ISP1, cờ FIB bật',
        actual: bangDat ? 'Đã tạo bảng ISP1' : (timBang ? 'Tên: ' + timBang.ten + ', FIB: ' + timBang.fib : 'Chưa tạo bảng ISP1'),
        passed: bangDat,
        message: bangDat ? 'Chính xác' : 'Cần vào Routing > Tables tạo bảng tên ISP1 và tích chọn FIB'
      });

      // Tiêu chí 2: Tuyến Route Gateway 1.1.1.1 trỏ vào bảng ISP1
      const timRoute = dsTuyen.find(function (t) { return t.gateway === '1.1.1.1'; });
      const routeDat = routeSaved || (!!timRoute && (timRoute.bang === 'ISP1' || !timRoute.bang || timRoute.bang === 'main'));
      details.push({
        id: 'mk5_rule_route',
        name: 'Phần 2: Tuyến Route Gateway 1.1.1.1 (Routing Table ISP1)',
        expected: 'Gateway 1.1.1.1 trỏ vào bảng ISP1',
        actual: routeDat ? 'Đã tạo tuyến Gateway 1.1.1.1' : (timRoute ? 'Gateway: ' + timRoute.gateway + ', Table: ' + timRoute.bang : 'Chưa tạo tuyến Route 1.1.1.1'),
        passed: routeDat,
        message: routeDat ? 'Chính xác' : 'Cần vào IP > Routes tạo Default Route Gateway 1.1.1.1 gán vào bảng ISP1'
      });

      // Tiêu chí 3: Mangle Rule prerouting cho 192.168.1.0/24 mark routing ISP1
      const timMangle = dsMangle.find(function (m) {
        return m.src === MK_BAI5_MANGLE_SRC || m.action === 'mark routing';
      });
      const mangleDat = mangleSaved || (!!timMangle && (timMangle.src === MK_BAI5_MANGLE_SRC || timMangle.action === 'mark routing'));
      details.push({
        id: 'mk5_rule_mangle',
        name: 'Phần 3: Mangle Rule đánh dấu định tuyến LAN 192.168.1.0/24',
        expected: 'Src. Address 192.168.1.0/24, Action mark routing, Mark ISP1',
        actual: mangleDat ? 'Đã tạo luật Mangle đánh dấu ISP1' : (timMangle ? 'Src: ' + timMangle.src + ', Action: ' + timMangle.action : 'Chưa tạo luật Mangle'),
        passed: mangleDat,
        message: mangleDat ? 'Chính xác' : 'Cần vào IP > Firewall > Mangle tạo luật prerouting cho 192.168.1.0/24 với Action mark routing'
      });

      const soDung = details.filter(function (d) { return d.passed; }).length;
      const datCaBai = soDung === details.length;

      return {
        passed: datCaBai,
        score: Math.round((soDung / details.length) * 100),
        passedCount: soDung,
        totalRules: details.length,
        details: details
      };
    }
  },

  onSimLoad: function (simWin) {
    try {
      const doc = simWin.document;
      const laTrangLogin = doc && doc.querySelector('input#name') && doc.querySelector('input#password');
      const chuaKhoiTao = !window._FTC_MK5_BANG_SAVED && !window._FTC_MK5_ROUTE_SAVED && !window._FTC_MK5_MANGLE_SAVED;

      if (laTrangLogin || chuaKhoiTao) {
        window._FTC_MK5_BANG_SAVED = false;
        window._FTC_MK5_ROUTE_SAVED = false;
        window._FTC_MK5_MANGLE_SAVED = false;
        window._FTC_MK5_DS_BANG = null;
        window._FTC_MK5_DS_TUYEN = null;
        window._FTC_MK5_DS_MANGLE = null;
        try {
          const ktvId = (typeof window.getKtvClientId === 'function' ? window.getKtvClientId() : '') || 'ktv_default';
          simWin.fetch('/sim_mikrotik_hexs/ftc_dat_lai?bai=5&_ktv=' + encodeURIComponent(ktvId) + '&_t=' + Date.now());
        } catch (e) {}
      }

      if (!simWin._ftcMkBai5TheoDoiLuu) {
        simWin._ftcMkBai5TheoDoiLuu = true;

        simWin.setInterval(function () {
          try {
            const d = simWin.document;
            if (d) mkBai5ChupTheoTrang(d);
          } catch (e) {}
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
              const fibField = mkBai5DocTruongForm(d, 'FIB');
              if (nameField && nameField.gt === 'ISP1') {
                window._FTC_MK5_BANG_SAVED = true;
              }
            } else if (h.indexOf('#IP:Routes') === 0) {
              const gwField = mkBai5DocTruongForm(d, 'Gateway');
              if (gwField && gwField.gt === '1.1.1.1') {
                window._FTC_MK5_ROUTE_SAVED = true;
              }
            } else if (h.indexOf('#IP:Firewall.Mangle') === 0) {
              const srcField = mkBai5DocTruongForm(d, 'Src. Address');
              const actField = mkBai5DocTruongForm(d, 'Action');
              if (srcField && srcField.gt === MK_BAI5_MANGLE_SRC) {
                window._FTC_MK5_MANGLE_SAVED = true;
              }
            }
          } catch (err) {}
        };

        try {
          simWin.document.addEventListener('pointerdown', batNutLuu, true);
          simWin.document.addEventListener('click', batNutLuu, true);
        } catch (err) {}
      }
    } catch (e) {}
  },

  guidePopups: (window.TOOLTIPS_MIKROTIK_HEXS
                && window.TOOLTIPS_MIKROTIK_HEXS['mikrotik_hexs-bai5']) || []
});

window.mkBai5Reset = function () {
  window._FTC_MK5_BANG_SAVED = false;
  window._FTC_MK5_ROUTE_SAVED = false;
  window._FTC_MK5_MANGLE_SAVED = false;
  window._FTC_MK5_DS_BANG = null;
  window._FTC_MK5_DS_TUYEN = null;
  window._FTC_MK5_DS_MANGLE = null;
};
