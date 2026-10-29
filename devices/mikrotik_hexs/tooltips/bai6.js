/**
 * devices/mikrotik_hexs/tooltips/bai6.js — Tooltip Hướng dẫn Bài 6: Cấu hình NAT Port & Hairpin NAT
 *
 * Chuỗi 23 bước tuần tự chuẩn thực tế theo tài liệu kỹ thuật Việt Tuấn:
 *   Phần 1: Cấu hình NAT Port Camera (Bước 1 ➔ 14):
 *       • Mở cổng 8080 cho Camera nội bộ 192.168.1.10 đi qua cổng WAN (pppoe-out1).
 *       • Chain: dstnat, Protocol: 6 (tcp), Dst. Port: 8080, In. Interface: pppoe-out1.
 *       • Action: dst-nat, To Addresses: 192.168.1.10, To Ports: 8080.
 *   Phần 2: Cấu hình Hairpin NAT (Bước 15 ➔ 23):
 *       • Cho phép client LAN 192.168.1.0/24 truy cập Camera nội bộ bằng IP WAN / DDNS.
 *       • Chain: srcnat, Src. Address: 192.168.1.0/24, Dst. Address: 192.168.1.10.
 *       • Protocol: 6 (tcp), Dst. Port: 8080.
 *       • Action: masquerade.
 *
 * NGUYÊN TẮC:
 * 1. Chuyển bước nghiêm ngặt: bước trước hoàn tất mới hiển thị bước sau.
 * 2. An toàn DOM tuyệt đối: không dùng text:Add New / text:OK để chống giật lag và reflow.
 * 3. Gán ID tĩnh độc nhất cho nút Add New và các ô nhập liệu.
 */

if (!window.TOOLTIPS_MIKROTIK_HEXS) window.TOOLTIPS_MIKROTIK_HEXS = {};

/* ───────────────────────── Nhận diện trạng thái DOM ───────────────────────── */

function mkBai6ManDangNhap(doc) {
  try {
    return !!(doc.querySelector('input#name') && doc.querySelector('input#password'));
  } catch (e) { return false; }
}

function mkBai6Hash(doc) {
  try {
    const w = (doc && doc.defaultView) || window;
    return (w.location && w.location.hash) || (doc && doc.location && doc.location.hash) || '';
  } catch (e) { return ''; }
}

function mkBai6Hang(doc, nhan) {
  try {
    const nhanLower = nhan.toLowerCase();
    for (const tr of doc.querySelectorAll('tr')) {
      const lb = tr.querySelector('td.label, th, td:first-child');
      if (lb && lb.textContent.trim().toLowerCase() === nhanLower) return tr;
    }
  } catch (e) {}
  return null;
}

function mkBai6MenuConHien(doc, ten) {
  try {
    const tenLower = ten.toLowerCase();
    for (const a of doc.querySelectorAll('#menu a, li a')) {
      if (a.closest('.ftc-guide-bubble')) continue;
      if ((a.textContent || '').trim().toLowerCase() === tenLower && a.offsetParent !== null) return true;
    }
  } catch (e) {}
  return false;
}

function mkBai6OQuickSet(doc) {
  try {
    if (mkBai6ManDangNhap(doc)) return false;
    const h = mkBai6Hash(doc);
    if (h.indexOf('Quick') !== -1 || h === '' || h === '#') return true;
    const qsItem = doc.getElementById('id_Quick_Set');
    if (qsItem && (qsItem.classList.contains('opened') || qsItem.classList.contains('active'))) return true;
    const btnWebFig = doc.getElementById('id_WebFig');
    if (btnWebFig && !btnWebFig.classList.contains('opened')) return true;
    const aIP = doc.querySelector('#menu a#id_IP, a#id_IP, #menu a[href*="IP"]');
    if (!aIP || aIP.offsetParent === null) return true;
  } catch (e) {}
  return false;
}

function mkBai6OFirewall(doc) { return mkBai6Hash(doc).indexOf('#IP:Firewall') === 0; }

function mkBai6ONAT(doc) {
  const h = mkBai6Hash(doc);
  if (h.indexOf('#IP:Firewall.NAT') === 0 && !mkBai6OHopThoaiNAT(doc)) return true;
  try {
    const activeTab = doc.querySelector('#tabs a.active[href*="NAT"], #tabs a.active');
    if (activeTab && (activeTab.textContent || '').trim().toLowerCase() === 'nat') {
      return !mkBai6OHopThoaiNAT(doc);
    }
  } catch (e) {}
  return false;
}

function mkBai6OHopThoaiNAT(doc) { return mkBai6Hash(doc).indexOf('#IP:Firewall.NAT.') === 0; }

function mkBai6DaMoKhoa(doc, nhan) {
  const tr = mkBai6Hang(doc, nhan);
  if (!tr) return false;
  try {
    const img = tr.querySelector('td.extra a.sbtn img, a.sbtn img, td.extra img');
    if (img && img.src) {
      if (img.src.indexOf('up.svg') !== -1) return true;
      if (img.src.indexOf('down.svg') !== -1) return false;
    }
    const os = tr.querySelectorAll('input, select, textarea');
    for (const o of os) {
      if (!o.disabled && o.style.visibility !== 'hidden' && o.offsetParent !== null) return true;
    }
    const o = tr.querySelector('input, select, textarea');
    return !!(o && !o.disabled && o.style.visibility !== 'hidden');
  } catch (e) {}
  return false;
}

function mkBai6GiaTri(doc, nhan) {
  const tr = mkBai6Hang(doc, nhan);
  if (!tr) return '';
  try {
    const chk = tr.querySelector('input[type="checkbox"]');
    if (chk) return chk.checked ? 'yes' : 'no';

    // 1. Nếu có Combobox của WebFig (span.cbox input)
    const cboxInp = tr.querySelector('span.cbox input, .cbox input');
    if (cboxInp && (cboxInp.value || '').trim() !== '') {
      return cboxInp.value.trim();
    }

    // 2. Tìm input text/number có giá trị
    for (const inp of tr.querySelectorAll('input:not([type="checkbox"]):not([type="button"]):not([type="submit"])')) {
      const v = (inp.value || '').trim();
      if (v !== '') return v;
    }

    // 3. Tìm select có option được chọn
    for (const sel of tr.querySelectorAll('select')) {
      if (sel.selectedIndex >= 0 && sel.options && sel.options[sel.selectedIndex]) {
        const txt = (sel.options[sel.selectedIndex].text || '').trim();
        if (txt !== '') return txt;
        const val = (sel.options[sel.selectedIndex].value || '').trim();
        if (val !== '') return val;
      }
      if ((sel.value || '').trim() !== '') return sel.value.trim();
    }

    // 4. Nếu có input nhưng rỗng
    const firstInp = tr.querySelector('input:not([type="checkbox"]):not([type="button"]):not([type="submit"])');
    if (firstInp) return (firstInp.value || '').trim();

    // 5. Textarea
    const ta = tr.querySelector('textarea');
    if (ta) return (ta.value || '').trim();
  } catch (e) {}
  return '';
}

function mkBai6KhoiActionDaMo(doc) {
  const tr = mkBai6Hang(doc, 'Action');
  if (!tr) return false;
  try {
    const sel = tr.querySelector('select, input');
    return !!(sel && sel.offsetParent !== null);
  } catch (e) {}
  return false;
}

function mkBai6Part1Xong(doc) {
  if (window._FTC_MK6_RULE_PORT_SAVED) return true;
  const ds = window._FTC_MK6_DS_NAT || [];
  return ds.some(function (r) {
    return (r.chain === 'dstnat' || r.action === 'dst-nat') && (r.raw.includes('192.168.1.10') || r.raw.includes('8080'));
  });
}

function mkBai6Part2Xong(doc) {
  if (window._FTC_MK6_RULE_HAIRPIN_SAVED) return true;
  const ds = window._FTC_MK6_DS_NAT || [];
  return ds.some(function (r) {
    return (r.chain === 'srcnat' || r.action === 'masquerade') && (r.src.includes('192.168.1.0') || r.dst.includes('192.168.1.10') || r.raw.includes('masquerade'));
  });
}

/* ───────────────────────── Gắn ID động ổn định ───────────────────────── */

function mkBai6DatId(el, id) {
  try { if (el && !el.id) el.id = id; } catch (e) {}
}

function mkBai6GanIdTheoNhan(doc, nhan, idO, idNut) {
  const tr = mkBai6Hang(doc, nhan);
  if (!tr) return;
  try {
    if (idNut) {
      const btn = tr.querySelector('td.extra a.sbtn, a.sbtn, td.extra a');
      if (btn) mkBai6DatId(btn, idNut);
    }
    if (idO) {
      const cboxInp = tr.querySelector('span.cbox input, .cbox input');
      if (cboxInp) {
        mkBai6DatId(cboxInp, idO);
      } else {
        const o = tr.querySelector('input:not([type="checkbox"]):not([type="button"]):not([type="submit"]), select');
        if (o) mkBai6DatId(o, idO);
      }
    }
  } catch (e) {}
}

function mkBai6CaiTheoDoi(doc) {
  try {
    if (!doc) return;

    mkBai6GanIdTheoNhan(doc, 'Chain', 'ftc-mk6-chain', null);
    mkBai6GanIdTheoNhan(doc, 'Src. Address', 'ftc-mk6-src', 'ftc-mk6-src-nut');
    mkBai6GanIdTheoNhan(doc, 'Dst. Address', 'ftc-mk6-dst', 'ftc-mk6-dst-nut');
    mkBai6GanIdTheoNhan(doc, 'Protocol', 'ftc-mk6-proto', 'ftc-mk6-proto-nut');
    mkBai6GanIdTheoNhan(doc, 'Dst. Port', 'ftc-mk6-dstport', 'ftc-mk6-dstport-nut');
    mkBai6GanIdTheoNhan(doc, 'In. Interface', 'ftc-mk6-inif', 'ftc-mk6-inif-nut');
    mkBai6GanIdTheoNhan(doc, 'Action', 'ftc-mk6-action', null);
    mkBai6GanIdTheoNhan(doc, 'To Addresses', 'ftc-mk6-toaddr', 'ftc-mk6-toaddr-nut');
    mkBai6GanIdTheoNhan(doc, 'To Ports', 'ftc-mk6-toports', 'ftc-mk6-toports-nut');

    for (const td of doc.querySelectorAll('td.sep')) {
      if ((td.textContent || '').trim().toLowerCase() === 'action') {
        mkBai6DatId(td.querySelector('span') || td, 'ftc-mk6-sep-action');
        break;
      }
    }

    for (const a of doc.querySelectorAll('a[href]')) {
      if (a.getAttribute('href') === '#IP:Firewall.NAT' && (a.textContent || '').trim().toLowerCase() === 'nat') {
        mkBai6DatId(a, 'ftc-mk6-the-nat');
        break;
      }
    }

    // Nút Add New trên trang NAT
    if (mkBai6ONAT(doc)) {
      const addBtns = doc.querySelectorAll('#toolbar a.button, ul.toolbar a.button, a.button');
      for (const btn of addBtns) {
        if ((btn.textContent || '').trim().toLowerCase() === 'add new') {
          if (!btn.id) btn.id = 'ftc-mk6-btn-add-nat';
          break;
        }
      }
    }
  } catch (e) {}
}

/* ───────────────────────── Danh sách 23 Tooltip ───────────────────────── */

window.TOOLTIPS_MIKROTIK_HEXS['mikrotik_hexs-bai6'] = [
  // ── Màn hình đăng nhập RouterOS ─────────────────────────────────────
  {
    selector: 'input#name',
    text: 'Nhập admin',
    position: 'right',
    condition: function (doc) { return mkBai6ManDangNhap(doc); }
  },
  {
    selector: 'input[value="Login"], input[type="button"][value="Login"]',
    text: 'Nhấn Login',
    position: 'right',
    condition: function (doc) { return mkBai6ManDangNhap(doc); }
  },

  // ══════════════ PHẦN 1: CẤU HÌNH NAT PORT CAMERA (Bước 1 ➔ 14) ════════
  {
    selector: '#id_WebFig, a#id_WebFig',
    text: 'Bước 1: Chọn menu WebFig',
    position: 'bottom',
    condition: function (doc) {
      mkBai6CaiTheoDoi(doc);
      return !mkBai6ManDangNhap(doc) && mkBai6OQuickSet(doc);
    }
  },
  {
    selector: 'li#IP span, #menu a[href="#IP"], #id_IP',
    text: 'Bước 2: Chọn menu IP',
    position: 'right',
    condition: function (doc) {
      mkBai6CaiTheoDoi(doc);
      return !mkBai6ManDangNhap(doc) && !mkBai6OQuickSet(doc) && !mkBai6Part1Xong(doc)
        && !mkBai6OFirewall(doc) && !mkBai6ONAT(doc) && !mkBai6OHopThoaiNAT(doc)
        && !mkBai6MenuConHien(doc, 'Firewall');
    }
  },
  {
    selector: 'a[href="#IP:Firewall"], #menu li:has-text("Firewall")',
    text: 'Bước 3: Chọn mục Firewall',
    position: 'right',
    condition: function (doc) {
      mkBai6CaiTheoDoi(doc);
      return !mkBai6ManDangNhap(doc) && !mkBai6OQuickSet(doc) && !mkBai6Part1Xong(doc)
        && !mkBai6OFirewall(doc) && !mkBai6ONAT(doc) && !mkBai6OHopThoaiNAT(doc)
        && mkBai6MenuConHien(doc, 'Firewall');
    }
  },
  {
    selector: '#ftc-mk6-the-nat, a[href="#IP:Firewall.NAT"]',
    text: 'Bước 4: Chọn tab NAT',
    position: 'bottom',
    condition: function (doc) {
      mkBai6CaiTheoDoi(doc);
      return !mkBai6ManDangNhap(doc) && !mkBai6Part1Xong(doc)
        && mkBai6OFirewall(doc) && !mkBai6ONAT(doc) && !mkBai6OHopThoaiNAT(doc);
    }
  },
  {
    selector: '#ftc-mk6-btn-add-nat, #toolbar a.button:has-text("Add New"), a.button:has-text("Add New")',
    text: 'Bước 5: Chọn Add New để tạo rule NAT mở cổng Camera',
    position: 'bottom',
    condition: function (doc) {
      mkBai6CaiTheoDoi(doc);
      return !mkBai6ManDangNhap(doc) && !mkBai6Part1Xong(doc) && mkBai6ONAT(doc);
    }
  },
  {
    selector: '#ftc-mk6-chain, tr:has-text("Chain") select, tr:has-text("Chain") input',
    text: 'Bước 6: Chọn Chain: dstnat',
    position: 'right',
    condition: function (doc) {
      mkBai6CaiTheoDoi(doc);
      return !mkBai6Part1Xong(doc) && mkBai6OHopThoaiNAT(doc)
        && mkBai6GiaTri(doc, 'Chain').toLowerCase() !== 'dstnat';
    }
  },
  {
    selector: '#ftc-mk6-proto-nut, tr:has-text("Protocol") a.sbtn',
    text: 'Bước 7: Mở khóa ô Protocol',
    position: 'left',
    condition: function (doc) {
      mkBai6CaiTheoDoi(doc);
      return !mkBai6Part1Xong(doc) && mkBai6OHopThoaiNAT(doc)
        && mkBai6GiaTri(doc, 'Chain').toLowerCase() === 'dstnat'
        && !mkBai6DaMoKhoa(doc, 'Protocol');
    }
  },
  {
    selector: '#ftc-mk6-proto, tr:has-text("Protocol") select',
    text: 'Bước 7: Chọn Protocol: 6 (tcp)',
    position: 'right',
    condition: function (doc) {
      mkBai6CaiTheoDoi(doc);
      return !mkBai6Part1Xong(doc) && mkBai6OHopThoaiNAT(doc)
        && mkBai6GiaTri(doc, 'Chain').toLowerCase() === 'dstnat'
        && mkBai6DaMoKhoa(doc, 'Protocol') && mkBai6GiaTri(doc, 'Protocol').indexOf('tcp') === -1;
    }
  },
  {
    selector: '#ftc-mk6-dstport-nut, tr:has-text("Dst. Port") a.sbtn',
    text: 'Bước 8: Mở khóa ô Dst. Port',
    position: 'left',
    condition: function (doc) {
      mkBai6CaiTheoDoi(doc);
      return !mkBai6Part1Xong(doc) && mkBai6OHopThoaiNAT(doc)
        && mkBai6DaMoKhoa(doc, 'Protocol')
        && !mkBai6DaMoKhoa(doc, 'Dst. Port');
    }
  },
  {
    selector: '#ftc-mk6-dstport, tr:has-text("Dst. Port") input',
    text: 'Bước 8: Nhập Dst. Port: 8080',
    position: 'right',
    condition: function (doc) {
      mkBai6CaiTheoDoi(doc);
      return !mkBai6Part1Xong(doc) && mkBai6OHopThoaiNAT(doc)
        && mkBai6DaMoKhoa(doc, 'Dst. Port') && mkBai6GiaTri(doc, 'Dst. Port') !== '8080';
    }
  },
  {
    selector: '#ftc-mk6-inif-nut, tr:has-text("In. Interface") a.sbtn',
    text: 'Bước 9: Mở khóa ô In. Interface',
    position: 'left',
    condition: function (doc) {
      mkBai6CaiTheoDoi(doc);
      return !mkBai6Part1Xong(doc) && mkBai6OHopThoaiNAT(doc)
        && mkBai6GiaTri(doc, 'Dst. Port') === '8080'
        && !mkBai6DaMoKhoa(doc, 'In. Interface');
    }
  },
  {
    selector: '#ftc-mk6-inif, tr:has-text("In. Interface") select',
    text: 'Bước 9: Chọn In. Interface: pppoe-out1',
    position: 'right',
    condition: function (doc) {
      mkBai6CaiTheoDoi(doc);
      const val = mkBai6GiaTri(doc, 'In. Interface');
      return !mkBai6Part1Xong(doc) && mkBai6OHopThoaiNAT(doc)
        && mkBai6GiaTri(doc, 'Dst. Port') === '8080'
        && mkBai6DaMoKhoa(doc, 'In. Interface')
        && val !== 'pppoe-out1' && val !== 'ether1';
    }
  },
  {
    selector: '#ftc-mk6-sep-action, td.sep:has-text("Action")',
    text: 'Bước 10: Nhấn khối Action để mở rộng tùy chọn Action',
    position: 'bottom',
    condition: function (doc) {
      mkBai6CaiTheoDoi(doc);
      const inIf = mkBai6GiaTri(doc, 'In. Interface');
      return !mkBai6Part1Xong(doc) && mkBai6OHopThoaiNAT(doc)
        && (inIf === 'pppoe-out1' || inIf === 'ether1')
        && !mkBai6KhoiActionDaMo(doc);
    }
  },
  {
    selector: '#ftc-mk6-action, tr:has-text("Action") select',
    text: 'Bước 11: Chọn Action: dst-nat',
    position: 'right',
    condition: function (doc) {
      mkBai6CaiTheoDoi(doc);
      const inIf = mkBai6GiaTri(doc, 'In. Interface');
      return !mkBai6Part1Xong(doc) && mkBai6OHopThoaiNAT(doc)
        && (inIf === 'pppoe-out1' || inIf === 'ether1')
        && mkBai6KhoiActionDaMo(doc)
        && mkBai6GiaTri(doc, 'Action').toLowerCase() !== 'dst-nat';
    }
  },
  {
    selector: '#ftc-mk6-toaddr-nut, tr:has-text("To Addresses") a.sbtn',
    text: 'Bước 12: Mở khóa ô To Addresses',
    position: 'left',
    condition: function (doc) {
      mkBai6CaiTheoDoi(doc);
      return !mkBai6Part1Xong(doc) && mkBai6OHopThoaiNAT(doc)
        && mkBai6KhoiActionDaMo(doc)
        && mkBai6GiaTri(doc, 'Action').toLowerCase() === 'dst-nat'
        && !mkBai6DaMoKhoa(doc, 'To Addresses');
    }
  },
  {
    selector: '#ftc-mk6-toaddr, tr:has-text("To Addresses") input',
    text: 'Bước 12: Nhập To Addresses: 192.168.1.10',
    position: 'right',
    condition: function (doc) {
      mkBai6CaiTheoDoi(doc);
      return !mkBai6Part1Xong(doc) && mkBai6OHopThoaiNAT(doc)
        && mkBai6KhoiActionDaMo(doc)
        && mkBai6GiaTri(doc, 'Action').toLowerCase() === 'dst-nat'
        && mkBai6DaMoKhoa(doc, 'To Addresses')
        && mkBai6GiaTri(doc, 'To Addresses') !== '192.168.1.10';
    }
  },
  {
    selector: '#ftc-mk6-toports-nut, tr:has-text("To Ports") a.sbtn',
    text: 'Bước 13: Mở khóa ô To Ports',
    position: 'left',
    condition: function (doc) {
      mkBai6CaiTheoDoi(doc);
      return !mkBai6Part1Xong(doc) && mkBai6OHopThoaiNAT(doc)
        && mkBai6GiaTri(doc, 'To Addresses') === '192.168.1.10'
        && !mkBai6DaMoKhoa(doc, 'To Ports');
    }
  },
  {
    selector: '#ftc-mk6-toports, tr:has-text("To Ports") input',
    text: 'Bước 13: Nhập To Ports: 8080',
    position: 'right',
    condition: function (doc) {
      mkBai6CaiTheoDoi(doc);
      return !mkBai6Part1Xong(doc) && mkBai6OHopThoaiNAT(doc)
        && mkBai6GiaTri(doc, 'To Addresses') === '192.168.1.10'
        && mkBai6DaMoKhoa(doc, 'To Ports')
        && mkBai6GiaTri(doc, 'To Ports') !== '8080';
    }
  },
  {
    selector: 'input[value="OK"], input[type="button"][value="OK"], a.button:has-text("OK")',
    text: 'Bước 14: Nhấn OK để lưu rule NAT Port',
    position: 'bottom',
    condition: function (doc) {
      mkBai6CaiTheoDoi(doc);
      return !mkBai6Part1Xong(doc) && mkBai6OHopThoaiNAT(doc)
        && mkBai6GiaTri(doc, 'To Addresses') === '192.168.1.10'
        && mkBai6GiaTri(doc, 'To Ports') === '8080';
    }
  },

  // ══════════════ PHẦN 2: CẤU HÌNH HAIRPIN NAT (Bước 15 ➔ 23) ═══════════
  {
    selector: '#ftc-mk6-btn-add-nat, #toolbar a.button:has-text("Add New"), a.button:has-text("Add New")',
    text: 'Bước 15: Chọn Add New để tạo rule Hairpin NAT',
    position: 'bottom',
    condition: function (doc) {
      mkBai6CaiTheoDoi(doc);
      return mkBai6Part1Xong(doc) && !mkBai6Part2Xong(doc) && mkBai6ONAT(doc);
    }
  },
  {
    selector: '#ftc-mk6-chain, tr:has-text("Chain") select, tr:has-text("Chain") input',
    text: 'Bước 16: Chọn Chain: srcnat',
    position: 'right',
    condition: function (doc) {
      mkBai6CaiTheoDoi(doc);
      return mkBai6Part1Xong(doc) && !mkBai6Part2Xong(doc) && mkBai6OHopThoaiNAT(doc)
        && mkBai6GiaTri(doc, 'Chain').toLowerCase() !== 'srcnat';
    }
  },
  {
    selector: '#ftc-mk6-src-nut, tr:has-text("Src. Address") a.sbtn',
    text: 'Bước 17: Mở khóa ô Src. Address',
    position: 'left',
    condition: function (doc) {
      mkBai6CaiTheoDoi(doc);
      return mkBai6Part1Xong(doc) && !mkBai6Part2Xong(doc) && mkBai6OHopThoaiNAT(doc)
        && mkBai6GiaTri(doc, 'Chain').toLowerCase() === 'srcnat'
        && !mkBai6DaMoKhoa(doc, 'Src. Address');
    }
  },
  {
    selector: '#ftc-mk6-src, tr:has-text("Src. Address") input',
    text: 'Bước 17: Nhập Src. Address: 192.168.1.0/24',
    position: 'right',
    condition: function (doc) {
      mkBai6CaiTheoDoi(doc);
      return mkBai6Part1Xong(doc) && !mkBai6Part2Xong(doc) && mkBai6OHopThoaiNAT(doc)
        && mkBai6GiaTri(doc, 'Chain').toLowerCase() === 'srcnat'
        && mkBai6DaMoKhoa(doc, 'Src. Address')
        && mkBai6GiaTri(doc, 'Src. Address') !== '192.168.1.0/24';
    }
  },
  {
    selector: '#ftc-mk6-dst-nut, tr:has-text("Dst. Address") a.sbtn',
    text: 'Bước 18: Mở khóa ô Dst. Address',
    position: 'left',
    condition: function (doc) {
      mkBai6CaiTheoDoi(doc);
      return mkBai6Part1Xong(doc) && !mkBai6Part2Xong(doc) && mkBai6OHopThoaiNAT(doc)
        && mkBai6GiaTri(doc, 'Src. Address') === '192.168.1.0/24'
        && !mkBai6DaMoKhoa(doc, 'Dst. Address');
    }
  },
  {
    selector: '#ftc-mk6-dst, tr:has-text("Dst. Address") input',
    text: 'Bước 18: Nhập Dst. Address: 192.168.1.10',
    position: 'right',
    condition: function (doc) {
      mkBai6CaiTheoDoi(doc);
      return mkBai6Part1Xong(doc) && !mkBai6Part2Xong(doc) && mkBai6OHopThoaiNAT(doc)
        && mkBai6GiaTri(doc, 'Src. Address') === '192.168.1.0/24'
        && mkBai6DaMoKhoa(doc, 'Dst. Address')
        && mkBai6GiaTri(doc, 'Dst. Address') !== '192.168.1.10';
    }
  },
  {
    selector: '#ftc-mk6-proto-nut, tr:has-text("Protocol") a.sbtn',
    text: 'Bước 19: Mở khóa ô Protocol',
    position: 'left',
    condition: function (doc) {
      mkBai6CaiTheoDoi(doc);
      return mkBai6Part1Xong(doc) && !mkBai6Part2Xong(doc) && mkBai6OHopThoaiNAT(doc)
        && mkBai6GiaTri(doc, 'Dst. Address') === '192.168.1.10'
        && !mkBai6DaMoKhoa(doc, 'Protocol');
    }
  },
  {
    selector: '#ftc-mk6-proto, tr:has-text("Protocol") select',
    text: 'Bước 19: Chọn Protocol: 6 (tcp)',
    position: 'right',
    condition: function (doc) {
      mkBai6CaiTheoDoi(doc);
      return mkBai6Part1Xong(doc) && !mkBai6Part2Xong(doc) && mkBai6OHopThoaiNAT(doc)
        && mkBai6GiaTri(doc, 'Dst. Address') === '192.168.1.10'
        && mkBai6DaMoKhoa(doc, 'Protocol')
        && mkBai6GiaTri(doc, 'Protocol').indexOf('tcp') === -1;
    }
  },
  {
    selector: '#ftc-mk6-dstport-nut, tr:has-text("Dst. Port") a.sbtn',
    text: 'Bước 20: Mở khóa ô Dst. Port',
    position: 'left',
    condition: function (doc) {
      mkBai6CaiTheoDoi(doc);
      return mkBai6Part1Xong(doc) && !mkBai6Part2Xong(doc) && mkBai6OHopThoaiNAT(doc)
        && mkBai6DaMoKhoa(doc, 'Protocol')
        && !mkBai6DaMoKhoa(doc, 'Dst. Port');
    }
  },
  {
    selector: '#ftc-mk6-dstport, tr:has-text("Dst. Port") input',
    text: 'Bước 20: Nhập Dst. Port: 8080',
    position: 'right',
    condition: function (doc) {
      mkBai6CaiTheoDoi(doc);
      return mkBai6Part1Xong(doc) && !mkBai6Part2Xong(doc) && mkBai6OHopThoaiNAT(doc)
        && mkBai6DaMoKhoa(doc, 'Dst. Port')
        && mkBai6GiaTri(doc, 'Dst. Port') !== '8080';
    }
  },
  {
    selector: '#ftc-mk6-sep-action, td.sep:has-text("Action")',
    text: 'Bước 21: Nhấn khối Action để mở rộng tùy chọn',
    position: 'bottom',
    condition: function (doc) {
      mkBai6CaiTheoDoi(doc);
      return mkBai6Part1Xong(doc) && !mkBai6Part2Xong(doc) && mkBai6OHopThoaiNAT(doc)
        && mkBai6GiaTri(doc, 'Dst. Port') === '8080'
        && !mkBai6KhoiActionDaMo(doc);
    }
  },
  {
    selector: '#ftc-mk6-action, tr:has-text("Action") select',
    text: 'Bước 22: Chọn Action: masquerade',
    position: 'right',
    condition: function (doc) {
      mkBai6CaiTheoDoi(doc);
      return mkBai6Part1Xong(doc) && !mkBai6Part2Xong(doc) && mkBai6OHopThoaiNAT(doc)
        && mkBai6KhoiActionDaMo(doc)
        && mkBai6GiaTri(doc, 'Dst. Port') === '8080'
        && mkBai6GiaTri(doc, 'Action').toLowerCase() !== 'masquerade';
    }
  },
  {
    selector: 'input[value="OK"], input[type="button"][value="OK"], a.button:has-text("OK")',
    text: 'Bước 23: Nhấn OK để lưu rule Hairpin NAT và hoàn thành bài tập',
    position: 'bottom',
    condition: function (doc) {
      mkBai6CaiTheoDoi(doc);
      return mkBai6Part1Xong(doc) && !mkBai6Part2Xong(doc) && mkBai6OHopThoaiNAT(doc)
        && mkBai6KhoiActionDaMo(doc)
        && mkBai6GiaTri(doc, 'Dst. Port') === '8080'
        && mkBai6GiaTri(doc, 'Action').toLowerCase() === 'masquerade';
    }
  }
];
