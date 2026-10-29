/**
 * devices/mikrotik_hexs/lessons/bai6.js
 * Bài 6: Cấu hình NAT Port & Hairpin NAT — MikroTik hEX S
 *
 * Chuẩn thực tế theo tài liệu kỹ thuật Việt Tuấn (NAT Port + Hairpin NAT):
 *   Phần 1: Cấu hình NAT Port (Port Forwarding):
 *       • Mở cổng dịch vụ Camera nội bộ (192.168.1.10:8080) ra ngoài Internet.
 *       • Chain: dstnat, Protocol: 6 (tcp), Dst. Port: 8080, In. Interface: pppoe-out1 (hoặc ether1).
 *       • Action: dst-nat, To Addresses: 192.168.1.10, To Ports: 8080.
 *   Phần 2: Cấu hình Hairpin NAT (NAT Loopback):
 *       • Giúp các thiết bị trong mạng LAN truy cập vào Camera qua IP WAN/tên miền.
 *       • Chain: srcnat, Src. Address: 192.168.1.0/24, Dst. Address: 192.168.1.10.
 *       • Protocol: 6 (tcp), Dst. Port: 8080.
 *       • Action: masquerade.
 */

window.DEVICE_MIKROTIK_HEXS_LESSONS = window.DEVICE_MIKROTIK_HEXS_LESSONS || [];

var MK_BAI6_PORT_CHAIN = 'dstnat';
var MK_BAI6_PORT_PROTO = '6 (tcp)';
var MK_BAI6_PORT_DSTPORT = '8080';
var MK_BAI6_PORT_INIF = 'pppoe-out1';
var MK_BAI6_PORT_ACTION = 'dst-nat';
var MK_BAI6_PORT_TOADDR = '192.168.1.10';
var MK_BAI6_PORT_TOPORTS = '8080';

var MK_BAI6_HAIRPIN_CHAIN = 'srcnat';
var MK_BAI6_HAIRPIN_SRCADDR = '192.168.1.0/24';
var MK_BAI6_HAIRPIN_DSTADDR = '192.168.1.10';
var MK_BAI6_HAIRPIN_PROTO = '6 (tcp)';
var MK_BAI6_HAIRPIN_DSTPORT = '8080';
var MK_BAI6_HAIRPIN_ACTION = 'masquerade';

function mkBai6DocHash(doc) {
  try {
    const w = (doc && doc.defaultView) || window;
    return (w.location && w.location.hash) || (doc && doc.location && doc.location.hash) || '';
  } catch (e) { return ''; }
}

function mkBai6HangTheoNhan(doc, nhan) {
  try {
    const nhanLower = nhan.toLowerCase();
    for (const tr of doc.querySelectorAll('tr')) {
      const lb = tr.querySelector('td.label, th, td:first-child');
      if (lb && lb.textContent.trim().toLowerCase() === nhanLower) return tr;
    }
  } catch (e) {}
  return null;
}

function mkBai6DocO(doc, nhan) {
  const tr = mkBai6HangTheoNhan(doc, nhan);
  if (!tr) return null;
  try {
    const chk = tr.querySelector('input[type="checkbox"]');
    if (chk) return { gt: chk.checked ? 'yes' : 'no', batLen: !chk.disabled };

    const cboxInp = tr.querySelector('span.cbox input, .cbox input');
    if (cboxInp && (cboxInp.value || '').trim() !== '') {
      return { gt: cboxInp.value.trim(), batLen: !cboxInp.disabled };
    }

    for (const inp of tr.querySelectorAll('input:not([type="checkbox"]):not([type="button"]):not([type="submit"])')) {
      const v = (inp.value || '').trim();
      if (v !== '') return { gt: v, batLen: !inp.disabled };
    }

    for (const sel of tr.querySelectorAll('select')) {
      if (sel.selectedIndex >= 0 && sel.options && sel.options[sel.selectedIndex]) {
        const txt = (sel.options[sel.selectedIndex].text || '').trim();
        if (txt !== '') return { gt: txt, batLen: !sel.disabled };
      }
      if ((sel.value || '').trim() !== '') return { gt: sel.value.trim(), batLen: !sel.disabled };
    }

    const firstInp = tr.querySelector('input:not([type="checkbox"]):not([type="button"]):not([type="submit"])');
    if (firstInp) return { gt: (firstInp.value || '').trim(), batLen: !firstInp.disabled };
  } catch (e) {}
  return null;
}

function mkBai6ChupDanhSachNAT(doc) {
  const ds = [];
  try {
    for (const tr of doc.querySelectorAll('tr')) {
      if (tr.querySelector('th')) continue;
      const tds = tr.querySelectorAll('td');
      if (tds.length >= 8) {
        const textArr = Array.from(tds).map(function (t) { return (t.textContent || '').trim(); });
        ds.push({
          action: (textArr[4] || '').toLowerCase(),
          chain: (textArr[5] || '').toLowerCase(),
          src: textArr[6] || '',
          dst: textArr[7] || '',
          raw: textArr.join(' ')
        });
      }
    }
  } catch (e) {}
  return ds;
}

function mkBai6ChupFormNAT(doc) {
  const chain = mkBai6DocO(doc, 'Chain');
  const srcAddr = mkBai6DocO(doc, 'Src. Address');
  const dstAddr = mkBai6DocO(doc, 'Dst. Address');
  const proto = mkBai6DocO(doc, 'Protocol');
  const dstPort = mkBai6DocO(doc, 'Dst. Port');
  const inIf = mkBai6DocO(doc, 'In. Interface');
  const action = mkBai6DocO(doc, 'Action');
  const toAddr = mkBai6DocO(doc, 'To Addresses');
  const toPorts = mkBai6DocO(doc, 'To Ports');

  if (!chain && !action) return null;
  return {
    chain: chain ? chain.gt : '',
    srcAddr: srcAddr ? srcAddr.gt : '',
    srcAddrBat: srcAddr ? srcAddr.batLen : false,
    dstAddr: dstAddr ? dstAddr.gt : '',
    dstAddrBat: dstAddr ? dstAddr.batLen : false,
    protocol: proto ? proto.gt : '',
    protoBat: proto ? proto.batLen : false,
    dstPort: dstPort ? dstPort.gt : '',
    dstPortBat: dstPort ? dstPort.batLen : false,
    inIf: inIf ? inIf.gt : '',
    inIfBat: inIf ? inIf.batLen : false,
    action: action ? action.gt : '',
    toAddresses: toAddr ? toAddr.gt : '',
    toAddrBat: toAddr ? toAddr.batLen : false,
    toPorts: toPorts ? toPorts.gt : '',
    toPortsBat: toPorts ? toPorts.batLen : false
  };
}

function mkBai6ChupTheoTrang(doc) {
  try {
    const h = mkBai6DocHash(doc);
    if (h.indexOf('#IP:Firewall.NAT') === 0 && h.indexOf('#IP:Firewall.NAT.') !== 0) {
      const ds = mkBai6ChupDanhSachNAT(doc);
      if (ds.length) {
        window._FTC_MK6_DS_NAT = ds;
        if (ds.some(function (r) {
          return (r.chain === 'dstnat' || r.action === 'dst-nat') && (r.raw.includes('192.168.1.10') || r.raw.includes('8080'));
        })) {
          window._FTC_MK6_RULE_PORT_SAVED = true;
        }
        if (ds.some(function (r) {
          return (r.chain === 'srcnat' || r.action === 'masquerade') && (r.src.includes('192.168.1.0') || r.dst.includes('192.168.1.10') || r.raw.includes('masquerade'));
        })) {
          window._FTC_MK6_RULE_HAIRPIN_SAVED = true;
        }
      }
    }
  } catch (e) {}
}

window.mkBai6Reset = function () {
  window._FTC_MK6_NAT_SAVED = false;
  window._FTC_MK6_RULE_PORT_SAVED = false;
  window._FTC_MK6_RULE_HAIRPIN_SAVED = false;
  window._FTC_MK6_CHUP_PORT = null;
  window._FTC_MK6_CHUP_HAIRPIN = null;
  window._FTC_MK6_NAT_LIVE = null;
  window._FTC_MK6_DS_NAT = null;
};

/* ───────────────────────── Đăng ký bài học ───────────────────────── */

window.DEVICE_MIKROTIK_HEXS_LESSONS.push({
  id: 'mikrotik_hexs-bai6',
  title: 'Cấu hình NAT Port & Hairpin NAT',
  subtitle: 'Mở cổng Camera và định tuyến quay vòng Hairpin NAT trên Router MikroTik',
  instructions: [
    '<b>Mục tiêu bài học:</b>',
    'Cấu hình mở cổng dịch vụ Camera nội bộ ra ngoài Internet và thiết lập Hairpin NAT theo tài liệu thực tế của Việt Tuấn:',
    '<b>Yêu cầu thực hiện 2 phần:</b>',
    '- Đăng nhập router với Username: <span class="val">admin</span>, Mật khẩu: (để trống).',
    '<b>Phần 1: Cấu hình NAT Port (Port Forwarding)</b>',
    '&nbsp;&nbsp;• Vào <b>IP > Firewall > NAT</b>, nhấp <b>Add New</b>.',
    '&nbsp;&nbsp;• Tab General: Chain <span class="val">dstnat</span>, mở khóa Protocol chọn <span class="val">6 (tcp)</span>, mở khóa Dst. Port nhập <span class="val">8080</span>, mở khóa In. Interface chọn <span class="val">pppoe-out1</span>.',
    '&nbsp;&nbsp;• Mở khối Action: Chọn Action <span class="val">dst-nat</span>, mở khóa To Addresses nhập <span class="val">192.168.1.10</span>, mở khóa To Ports nhập <span class="val">8080</span>.',
    '&nbsp;&nbsp;• Nhấn <b>OK</b> để lưu rule NAT Port.',
    '<b>Phần 2: Cấu hình Hairpin NAT (NAT Loopback)</b>',
    '&nbsp;&nbsp;• Tiếp tục nhấp <b>Add New</b> để tạo rule thứ 2.',
    '&nbsp;&nbsp;• Tab General: Chain <span class="val">srcnat</span>, mở khóa Src. Address nhập <span class="val">192.168.1.0/24</span>, mở khóa Dst. Address nhập <span class="val">192.168.1.10</span>, mở khóa Protocol chọn <span class="val">6 (tcp)</span>, mở khóa Dst. Port nhập <span class="val">8080</span>.',
    '&nbsp;&nbsp;• Mở khối Action: Chọn Action <span class="val">masquerade</span>.',
    '&nbsp;&nbsp;• Nhấn <b>OK</b> để hoàn tất.'
  ],
  practiceUrl: '/sim_mikrotik_hexs/index.html',

  grading: {
    description: 'Kiểm tra cấu hình NAT Port và Hairpin NAT trên MikroTik hEX S',
    rules: [
      { id: 'mk6_nat_port', name: 'Rule 1: NAT Port mở cổng 8080 cho Camera 192.168.1.10', selector: 'tr', expected: 'dst-nat', type: 'text_contains', required: true },
      { id: 'mk6_hairpin_nat', name: 'Rule 2: Hairpin NAT cho dải LAN 192.168.1.0/24', selector: 'tr', expected: 'masquerade', type: 'text_contains', required: true }
    ],

    customGrading: function (allDocs) {
      let doc = null;
      for (const d of allDocs) {
        try {
          if (mkBai6DocHash(d)) { doc = d; break; }
        } catch (e) {}
      }

      if (doc) {
        mkBai6ChupTheoTrang(doc);
        const live = mkBai6ChupFormNAT(doc);
        if (live) window._FTC_MK6_NAT_LIVE = live;
      }

      const dsNat = window._FTC_MK6_DS_NAT || [];
      const portSaved = !!window._FTC_MK6_RULE_PORT_SAVED;
      const hairpinSaved = !!window._FTC_MK6_RULE_HAIRPIN_SAVED;

      const details = [];

      // Tiêu chí 1: NAT Port Camera 192.168.1.10:8080
      const timPort = dsNat.find(function (r) {
        return (r.chain === 'dstnat' || r.action === 'dst-nat') && (r.raw.includes('192.168.1.10') || r.raw.includes('8080'));
      });
      const portDat = portSaved || !!timPort;
      details.push({
        id: 'mk6_rule_port',
        name: 'Phần 1: NAT Port Camera (dst-nat 8080 -> 192.168.1.10:8080)',
        expected: 'Chain dstnat, Protocol 6 (tcp), Dst. Port 8080, In. Interface pppoe-out1, Action dst-nat, To Addresses 192.168.1.10, To Ports 8080',
        actual: portDat ? 'Đã tạo rule NAT Port Camera' : (timPort ? 'Chain: ' + timPort.chain + ', Action: ' + timPort.action : 'Chưa tạo rule NAT Port'),
        passed: portDat,
        message: portDat ? 'Chính xác' : 'Cần vào IP > Firewall > NAT tạo rule dstnat mở port 8080 về 192.168.1.10'
      });

      // Tiêu chí 2: Hairpin NAT cho 192.168.1.0/24 -> 192.168.1.10:8080
      const timHairpin = dsNat.find(function (r) {
        return (r.chain === 'srcnat' || r.action === 'masquerade') && (r.src.includes('192.168.1.0') || r.dst.includes('192.168.1.10') || r.raw.includes('masquerade'));
      });
      const hairpinDat = hairpinSaved || !!timHairpin;
      details.push({
        id: 'mk6_rule_hairpin',
        name: 'Phần 2: Hairpin NAT (srcnat 192.168.1.0/24 -> 192.168.1.10:8080 Action masquerade)',
        expected: 'Chain srcnat, Src 192.168.1.0/24, Dst 192.168.1.10, Port 8080, Action masquerade',
        actual: hairpinDat ? 'Đã tạo rule Hairpin NAT' : (timHairpin ? 'Chain: ' + timHairpin.chain + ', Action: ' + timHairpin.action : 'Chưa tạo rule Hairpin NAT'),
        passed: hairpinDat,
        message: hairpinDat ? 'Chính xác' : 'Cần tạo rule srcnat masquerade cho dải 192.168.1.0/24 truy cập Server 192.168.1.10'
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
      if (doc && doc.querySelector('input#name') && doc.querySelector('input#password')) {
        if (typeof window.mkBai6Reset === 'function') window.mkBai6Reset();
        try {
          const ktvId = (window.currentUser && window.currentUser.username) || 'ktv_fpt';
          simWin.fetch('/sim_mikrotik_hexs/ftc_dat_lai?bai=6&_ktv=' + encodeURIComponent(ktvId) + '&_t=' + Date.now());
        } catch (e) {}
      }

      if (!simWin._ftcMkBai6DangTheoDoi) {
        simWin._ftcMkBai6DangTheoDoi = true;
        simWin.setInterval(function () {
          try {
            const d = simWin.document;
            if (d) {
              if (typeof mkBai6CaiTheoDoi === 'function') mkBai6CaiTheoDoi(d);
              mkBai6ChupTheoTrang(d);
              const live = mkBai6ChupFormNAT(d);
              if (live) window._FTC_MK6_NAT_LIVE = live;
            }
          } catch (e) {}
        }, 300);

        const batNutLuu = function (e) {
          try {
            let el = e.target;
            while (el && el !== simWin.document) {
              const txt = (el.textContent || el.value || '').trim().toLowerCase();
              if (el.tagName === 'A' && txt.match(/^(ok|apply)$/)) {
                const d = simWin.document;
                if (d) {
                  d._ftcIsSaved = true;
                  window._hasClickedSaveInGuide = true;
                  window._FTC_MK6_NAT_SAVED = true;
                  const snap = mkBai6ChupFormNAT(d);
                  if (snap) {
                    if (snap.chain.toLowerCase() === 'dstnat' || snap.action.toLowerCase() === 'dst-nat' || snap.toAddresses === '192.168.1.10') {
                      window._FTC_MK6_RULE_PORT_SAVED = true;
                      window._FTC_MK6_CHUP_PORT = snap;
                    }
                    if (snap.chain.toLowerCase() === 'srcnat' && (snap.action.toLowerCase() === 'masquerade' || snap.dstAddr === '192.168.1.10' || snap.srcAddr === '192.168.1.0/24')) {
                      window._FTC_MK6_RULE_HAIRPIN_SAVED = true;
                      window._FTC_MK6_CHUP_HAIRPIN = snap;
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

  onSimSave: function (simWin) {
    try {
      const doc = simWin.document;
      window._FTC_MK6_NAT_SAVED = true;
      const snap = mkBai6ChupFormNAT(doc) || window._FTC_MK6_NAT_LIVE;
      if (snap) {
        if (snap.chain.toLowerCase() === 'dstnat' || snap.action.toLowerCase() === 'dst-nat' || snap.toAddresses === '192.168.1.10') {
          window._FTC_MK6_RULE_PORT_SAVED = true;
          window._FTC_MK6_CHUP_PORT = snap;
        }
        if (snap.chain.toLowerCase() === 'srcnat' && (snap.action.toLowerCase() === 'masquerade' || snap.dstAddr === '192.168.1.10' || snap.srcAddr === '192.168.1.0/24')) {
          window._FTC_MK6_RULE_HAIRPIN_SAVED = true;
          window._FTC_MK6_CHUP_HAIRPIN = snap;
        }
      }
    } catch (e) {}
  },

  guidePopups: (window.TOOLTIPS_MIKROTIK_HEXS
                && window.TOOLTIPS_MIKROTIK_HEXS['mikrotik_hexs-bai6']) || []
});
