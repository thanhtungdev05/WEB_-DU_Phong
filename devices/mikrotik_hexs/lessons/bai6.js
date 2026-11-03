/**
 * devices/mikrotik_hexs/lessons/bai6.js
 * Bài 6: Cấu hình NAT Port & Hairpin NAT — MikroTik hEX S
 *
 * Chuẩn thực tế theo tài liệu kỹ thuật Việt Tuấn (NAT Port + Hairpin NAT):
 *   Phần 1: Cấu hình NAT Port (Port Forwarding):
 *       • Nhập ghi chú Comment: Camera để quản lý rule mở port.
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

var MK_BAI6_PORT_COMMENT = 'Camera';
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
      if (tr.querySelector('td.sep, th.sep')) continue;
      const lb = tr.querySelector('td.label, th, td:first-child');
      if (lb && lb.textContent.trim().toLowerCase() === nhanLower) {
        if (tr.querySelector('input, select, textarea, span.cbox, .cbox')) return tr;
      }
    }
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
    if (chk && (chk.type === 'checkbox' || chk.checked !== undefined)) {
      if (chk.type === 'checkbox') return { gt: chk.checked ? 'yes' : 'no', batLen: !chk.disabled };
    }

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

    const ta = tr.querySelector('textarea');
    if (ta) return { gt: (ta.value || '').trim(), batLen: !ta.disabled };
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
          comment: textArr[3] || '',
          action: (textArr[4] || '').toLowerCase(),
          chain: (textArr[5] || '').toLowerCase(),
          src: textArr[6] || '',
          dst: textArr[7] || '',
          proto: (textArr[10] || '').toLowerCase(),
          dstPort: textArr[12] || '',
          inIf: (textArr[14] || '').toLowerCase(),
          raw: textArr.join(' ')
        });
      }
    }
  } catch (e) {}
  return ds;
}

function mkBai6ChupFormNAT(doc) {
  const comment = mkBai6DocO(doc, 'Comment');
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
    comment: comment ? comment.gt : '',
    commentBat: comment ? comment.batLen : false,
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

function mkBai6FormPortDayDu(snap) {
  if (!snap) return false;
  const cmtOk = (snap.comment || '').trim().toLowerCase() === 'camera';
  const chainOk = (snap.chain || '').trim().toLowerCase() === 'dstnat';
  const protoVal = (snap.protocol || '').trim().toLowerCase();
  const protoOk = !!snap.protoBat && (protoVal.indexOf('tcp') !== -1 || protoVal === '6');
  const dstPortOk = !!snap.dstPortBat && (snap.dstPort || '').trim() === '8080';
  const inIfVal = (snap.inIf || '').trim().toLowerCase();
  const inIfOk = !!snap.inIfBat && (inIfVal === 'pppoe-out1' || inIfVal === 'ether1' || inIfVal.indexOf('pppoe') !== -1);
  const actionOk = (snap.action || '').trim().toLowerCase() === 'dst-nat';
  const toAddrOk = !!snap.toAddrBat && (snap.toAddresses || '').trim() === '192.168.1.10';
  const toPortsOk = !!snap.toPortsBat && (snap.toPorts || '').trim() === '8080';
  return cmtOk && chainOk && protoOk && dstPortOk && inIfOk && actionOk && toAddrOk && toPortsOk;
}

function mkBai6FormHairpinDayDu(snap) {
  if (!snap) return false;
  const chainOk = (snap.chain || '').trim().toLowerCase() === 'srcnat';
  const srcOk = !!snap.srcAddrBat && (snap.srcAddr || '').trim() === '192.168.1.0/24';
  const dstOk = !!snap.dstAddrBat && (snap.dstAddr || '').trim() === '192.168.1.10';
  const protoVal = (snap.protocol || '').trim().toLowerCase();
  const protoOk = !!snap.protoBat && (protoVal.indexOf('tcp') !== -1 || protoVal === '6');
  const dstPortOk = !!snap.dstPortBat && (snap.dstPort || '').trim() === '8080';
  const actionOk = (snap.action || '').trim().toLowerCase().indexOf('masquera') !== -1;
  return chainOk && srcOk && dstOk && protoOk && dstPortOk && actionOk;
}

function mkBai6LaRulePort(r) {
  if (!r) return false;
  const rawLower = (r.raw || '').toLowerCase();
  if (rawLower.includes('ftel:') || rawLower.includes('default configuration') || rawLower.includes('defconf')) {
    return false;
  }
  if (window._FTC_MK6_CHUP_PORT && !mkBai6FormPortDayDu(window._FTC_MK6_CHUP_PORT)) {
    return false;
  }
  const laDstnat = r.chain === 'dstnat' || rawLower.includes('dstnat');
  const laActionDstNat = (r.action || '').includes('dst-nat') || rawLower.includes('dst-nat');
  const coComment = (r.comment || '').trim().toLowerCase() === 'camera' || rawLower.includes('camera') || rawLower.includes('to-addresses=192.168.1.10');
  const coProto = (r.proto || '').includes('tcp') || rawLower.includes('tcp') || rawLower.includes('to-addresses=192.168.1.10');
  const coPort = r.dstPort === '8080' || rawLower.includes('8080');
  const coInIf = (r.inIf || '').includes('pppoe') || (r.inIf || '').includes('ether1') || rawLower.includes('pppoe') || rawLower.includes('ether1') || rawLower.includes('to-addresses=192.168.1.10');
  return laDstnat && laActionDstNat && coComment && coProto && coPort && coInIf;
}

function mkBai6LaRuleHairpin(r) {
  if (!r) return false;
  const rawLower = (r.raw || '').toLowerCase();
  // Loại trừ tuyệt đối rule NAT mặc định của router FPT (ftel: masquerade...)
  if (rawLower.includes('ftel:') || rawLower.includes('default configuration') || rawLower.includes('defconf')) {
    return false;
  }
  if (window._FTC_MK6_CHUP_HAIRPIN && !mkBai6FormHairpinDayDu(window._FTC_MK6_CHUP_HAIRPIN)) {
    return false;
  }
  const laSrcnat = r.chain === 'srcnat' || rawLower.includes('srcnat');
  const laMasq = (r.action || '').includes('masquera') || rawLower.includes('masquera');
  const coSrcLan = (r.src || '').includes('192.168.1.0') || rawLower.includes('192.168.1.0');
  const coDstCam = (r.dst || '').includes('192.168.1.1') || rawLower.includes('192.168.1.10');
  const coProto = (r.proto || '').includes('tcp') || rawLower.includes('tcp') || rawLower.includes('src-address=192.168.1.0/24');
  const coPort = r.dstPort === '8080' || rawLower.includes('8080') || rawLower.includes('src-address=192.168.1.0/24');
  return laSrcnat && laMasq && coSrcLan && coDstCam && coProto && coPort;
}

function mkBai6ChupTheoTrang(doc) {
  try {
    const h = mkBai6DocHash(doc);
    if (h.indexOf('#IP:Firewall.NAT') === 0 && h.indexOf('#IP:Firewall.NAT.') !== 0) {
      const ds = mkBai6ChupDanhSachNAT(doc);
      if (ds.length) {
        window._FTC_MK6_DS_NAT = ds;
        // Phần 1: Rule NAT Port mở port 8080 cho Camera 192.168.1.10 hiển thị trên bảng NAT
        if (ds.some(mkBai6LaRulePort)) {
          window._FTC_MK6_RULE_PORT_SAVED = true;
        }
        // Phần 2: Rule Hairpin NAT hiển thị trên bảng NAT (loại trừ rule ftel: mặc định)
        if (ds.some(mkBai6LaRuleHairpin)) {
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
    '<b>Yêu cầu thực hiện:</b>',
    '<b>Phần 1: NAT Port</b>',
    'Mở cổng TCP 8080 để thiết bị ngoài Internet truy cập được Camera <span class="val">192.168.1.10:8080</span> qua IP WAN:8080 của router.',
    '<b>Phần 2: Hairpin NAT</b>',
    'Cho phép thiết bị trong mạng LAN <span class="val">192.168.1.0/24</span> truy cập Camera bằng cùng địa chỉ IP WAN:8080.'
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

      const h = doc ? mkBai6DocHash(doc) : '';
      const dangOHopThoai = h.indexOf('#IP:Firewall.NAT.') === 0;

      const dsNat = window._FTC_MK6_DS_NAT || [];
      const portSaved = !!window._FTC_MK6_RULE_PORT_SAVED;
      const hairpinSaved = !!window._FTC_MK6_RULE_HAIRPIN_SAVED;

      const details = [];

      // Tiêu chí 1: NAT Port Camera 192.168.1.10:8080 (đầy đủ 8 thông số và đã nhảy ra bảng NAT)
      const timPort = dsNat.find(mkBai6LaRulePort);
      const portDat = portSaved || !!timPort;
      details.push({
        id: 'mk6_rule_port',
        name: 'Phần 1: NAT Port Camera (dst-nat 8080 -> 192.168.1.10:8080)',
        expected: 'Comment Camera, Chain dstnat, Protocol 6 (tcp), Dst. Port 8080, In. Interface pppoe-out1, Action dst-nat, To Addresses 192.168.1.10, To Ports 8080',
        actual: portDat ? 'Đã tạo rule NAT Port Camera' : (timPort ? 'Chain: ' + timPort.chain + ', Action: ' + timPort.action : 'Chưa tạo đủ thông số rule NAT Port'),
        passed: portDat,
        message: portDat ? 'Chính xác' : 'Cần vào IP > Firewall > NAT tạo rule dstnat (Comment Camera, Protocol 6 (tcp), Dst. Port 8080, In. Interface pppoe-out1, Action dst-nat, To Addresses 192.168.1.10, To Ports 8080) và nhấn OK ra trang NAT'
      });

      // Tiêu chí 2: Hairpin NAT cho 192.168.1.0/24 -> 192.168.1.10:8080 (đầy đủ 6 thông số và đã nhảy ra bảng NAT)
      const timHairpin = dsNat.find(mkBai6LaRuleHairpin);
      const hairpinDat = hairpinSaved || !!timHairpin;
      details.push({
        id: 'mk6_rule_hairpin',
        name: 'Phần 2: Hairpin NAT (srcnat 192.168.1.0/24 -> 192.168.1.10:8080 Action masquerade)',
        expected: 'Chain srcnat, Src. Address 192.168.1.0/24, Dst. Address 192.168.1.10, Protocol 6 (tcp), Dst. Port 8080, Action masquerade',
        actual: hairpinDat ? 'Đã tạo rule Hairpin NAT' : (timHairpin ? 'Chain: ' + timHairpin.chain + ', Action: ' + timHairpin.action : 'Chưa tạo đủ thông số rule Hairpin NAT'),
        passed: hairpinDat,
        message: hairpinDat ? 'Chính xác' : 'Cần tạo rule srcnat masquerade (Src 192.168.1.0/24, Dst 192.168.1.10, Protocol 6 (tcp), Dst. Port 8080) và nhấn OK ra trang NAT'
      });

      const soDung = details.filter(function (d) { return d.passed; }).length;
      // Chỉ cho phép hoàn thành cả bài (nút Nộp bài sáng lên) khi đã nhảy ra trang bảng NAT (#IP:Firewall.NAT) có đủ cả 2 phần
      const datCaBai = (soDung === details.length) && !dangOHopThoai;

      const phan1HopLe = portDat || mkBai6FormPortDayDu(window._FTC_MK6_CHUP_PORT);
      const phan2ChuaLoi = !window._FTC_MK6_CHUP_HAIRPIN || mkBai6FormHairpinDayDu(window._FTC_MK6_CHUP_HAIRPIN);
      const trangHienTaiDat = datCaBai ? true : (phan1HopLe && phan2ChuaLoi);
      const daVaoTrangCuoi = datCaBai ? true : false;

      return {
        passed: datCaBai,
        score: datCaBai ? 100 : Math.min(90, Math.round((soDung / details.length) * 100)),
        passedCount: soDung,
        totalRules: details.length,
        details: details,
        trangHienTaiDat: trangHienTaiDat,
        daVaoTrangCuoi: daVaoTrangCuoi
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
              if (live) {
                window._FTC_MK6_NAT_LIVE = live;
                if (live.chain.toLowerCase() === 'dstnat' && mkBai6FormPortDayDu(live)) {
                  window._FTC_MK6_CHUP_PORT = live;
                }
                if (live.chain.toLowerCase() === 'srcnat' && mkBai6FormHairpinDayDu(live)) {
                  window._FTC_MK6_CHUP_HAIRPIN = live;
                }
              }
            }
          } catch (e) {}
        }, 250);

        const batNutLuu = function (e) {
          try {
            let el = e.target;
            while (el && el !== simWin.document) {
              const txt = (el.textContent || el.value || '').trim().toLowerCase();
              if (el.tagName === 'A' && txt.match(/^(ok|apply)$/)) {
                if (simWin._ftcMkBai6DangLuu) break;
                simWin._ftcMkBai6DangLuu = true;
                simWin.setTimeout(function () { simWin._ftcMkBai6DangLuu = false; }, 600);

                const d = simWin.document;
                if (d) {
                  d._ftcIsSaved = true;
                  window._hasClickedSaveInGuide = true;
                  window._FTC_MK6_NAT_SAVED = true;
                  const snap = mkBai6ChupFormNAT(d) || window._FTC_MK6_NAT_LIVE;
                  if (snap) {
                    if (snap.chain.toLowerCase() === 'dstnat') {
                      window._FTC_MK6_CHUP_PORT = snap;
                    } else if (snap.chain.toLowerCase() === 'srcnat') {
                      window._FTC_MK6_CHUP_HAIRPIN = snap;
                    }
                  }

                  // Tự động đóng hộp thoại quay về trang bảng NAT (#IP:Firewall.NAT) khi nhấn OK
                  if (txt === 'ok') {
                    simWin.setTimeout(function () {
                      try {
                        const curH = (simWin.location && simWin.location.hash) || '';
                        if (curH.indexOf('#IP:Firewall.NAT.') === 0 || curH === '#IP:Firewall.NAT.new') {
                          if (typeof simWin.openContent === 'function') {
                            simWin.openContent('#IP:Firewall.NAT');
                          } else {
                            simWin.location.hash = '#IP:Firewall.NAT';
                          }
                        }
                      } catch (eh) {}
                    }, 140);
                  }

                  // Khi WebFig nhảy từ form Add New ra trang bảng NAT (#IP:Firewall.NAT), quét bảng NAT và kích hoạt ngay Tooltip bước tiếp theo / nút Nộp bài
                  const capNhatSauKhiLuu = function () {
                    try {
                      if (simWin.document) {
                        if (typeof mkBai6CaiTheoDoi === 'function') mkBai6CaiTheoDoi(simWin.document);
                        mkBai6ChupTheoTrang(simWin.document);
                      }
                      window.postMessage({ type: 'REQUEST_GUIDE_POPUPS' }, '*');
                      if (typeof window.onSimulatorSave === 'function') window.onSimulatorSave(simWin);
                    } catch (e2) {}
                  };
                  simWin.setTimeout(capNhatSauKhiLuu, 160);
                  simWin.setTimeout(capNhatSauKhiLuu, 320);
                  simWin.setTimeout(capNhatSauKhiLuu, 600);
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
        if (snap.chain.toLowerCase() === 'dstnat') {
          window._FTC_MK6_CHUP_PORT = snap;
        } else if (snap.chain.toLowerCase() === 'srcnat') {
          window._FTC_MK6_CHUP_HAIRPIN = snap;
        }
      }
      try {
        const curH = (simWin.location && simWin.location.hash) || '';
        if (curH.indexOf('#IP:Firewall.NAT.') === 0 || curH === '#IP:Firewall.NAT.new') {
          simWin.setTimeout(function () {
            try {
              if (typeof simWin.openContent === 'function') {
                simWin.openContent('#IP:Firewall.NAT');
              } else {
                simWin.location.hash = '#IP:Firewall.NAT';
              }
            } catch (e2) {}
          }, 140);
        }
      } catch (eHash) {}
      if (doc) mkBai6ChupTheoTrang(doc);
    } catch (e) {}
  },

  guidePopups: (window.TOOLTIPS_MIKROTIK_HEXS
                && window.TOOLTIPS_MIKROTIK_HEXS['mikrotik_hexs-bai6']) || []
});
