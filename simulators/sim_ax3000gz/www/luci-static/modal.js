/* Hop thoai (modal) cho ban gia lap AX3000GZV3.
   Tren thiet bi that, bam Add/Edit se mo mot hop thoai do JavaScript sinh ra
   -> ban chup tinh khong the co san. Dinh nghia cac truong duoc boc tu CHINH
   MA NGUON view cua thiet bi bang boc_modal.py (xem chu thich trong file do),
   nen ten truong, nhan, mo ta, placeholder, danh sach chon va thu tu deu that.
   Dung dung lop CSS goc cua LuCI de nhin y het. */
(function () {
  var DEFS = null, FIRSTCHILD = {}, GIATRI = {};

  function el(tag, cls, noiDung) {
    var e = document.createElement(tag);
    if (cls) e.className = cls;
    if (noiDung !== undefined) e.innerHTML = noiDung;
    return e;
  }

  /* mot dong: nhan ben trai + o nhap ben phai + dong mo ta (co icon '?') */
  function dong(t, oNhap) {
    var d = el('div', 'cbi-value');
    if (t.ten) {
      d.dataset.name = t.ten;
      d.id = 'cbi-modal-' + t.ten;
    }
    d.appendChild(el('label', 'cbi-value-title', t.nhan || ''));
    var f = el('div', 'cbi-value-field');
    f.appendChild(oNhap);
    if (t.mota) f.appendChild(el('div', 'cbi-value-description', t.mota));
    d.appendChild(f);
    return d;
  }

  function oChon(t, gt, them) {
    var s = el('select', 'cbi-input-select');
    /* Mot so danh sach duoc noi them luc chay tuy theo ngu canh. Vd Band Width:
       ma nguon khai bao Auto/20/40, nhung neu Mode la ac/ax thi view them
       80MHz va 160MHz. Cac muc them do khai trong gia-tri-that.json. */
    (t.chon || []).concat((them || []).map(function (x) {
      return (typeof x === 'string') ? { v: x, n: x } : x;
    })).forEach(function (c) {
      var o = document.createElement('option');
      o.value = c.v; o.textContent = c.n;
      s.appendChild(o);
    });
    var v = (gt !== undefined && gt !== null) ? gt : t.macdinh;
    if (v !== undefined) {
      /* LuCI: neu gia tri hien tai khong nam trong danh sach thi van hien no
         (them mot muc moi). Vd Mode cua 2.4G la 'Mixed (802.11b/g/n/ax)'
         trong khi ma nguon chi khai bao 'IEEE 802.11ax Only'. */
      var co = false;
      for (var i = 0; i < s.options.length; i++) if (s.options[i].value === v) co = true;
      if (!co) {
        var o2 = document.createElement('option');
        o2.value = v; o2.textContent = v;
        s.insertBefore(o2, s.firstChild);
      }
      s.value = v;
    }
    return s;
  }

  function oRadio(t) {   // ListValue dang radio (widget='radio'), vd On/Off
    var w = el('span');
    var groupName = 'r_' + Math.random().toString(36).slice(2, 7);
    (t.chon || []).forEach(function (c, i) {
      var lb = el('label'); lb.style.marginRight = '14px';
      var r = document.createElement('input');
      r.type = 'radio'; r.name = groupName;
      r.className = 'cbi-input-radio'; r.value = c.v;
      if (t.macdinh !== undefined ? c.v === t.macdinh : i === 0) r.checked = true;
      lb.appendChild(r); lb.appendChild(document.createTextNode(' ' + c.n));
      w.appendChild(lb);
    });
    return w;
  }

  function oNgay() {  // Everyday + 7 thu, giong thiet bi
    var w = el('div');
    var all = el('label', '', '');
    var ca = document.createElement('input');
    ca.type = 'checkbox'; ca.className = 'cbi-input-checkbox'; ca.value = 'ALL';
    all.appendChild(ca); all.appendChild(document.createTextNode(' Everyday'));
    w.appendChild(all);
    var hang = el('div'); hang.style.marginTop = '10px';
    var valMap = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
    ['Sun.', 'Mon.', 'Tues.', 'Wed.', 'Thur.', 'Fri.', 'Sat.'].forEach(function (t, i) {
      var lb = el('label'); lb.style.marginRight = '12px';
      if (i === 0 || i === 6) lb.style.color = '#d33';   // Sun. va Sat. mau do nhu that
      var c = document.createElement('input');
      c.type = 'checkbox'; c.className = 'cbi-input-checkbox'; c.value = valMap[i];
      lb.appendChild(c); lb.appendChild(document.createTextNode(' ' + t));
      hang.appendChild(lb);
    });
    w.appendChild(hang);
    ca.addEventListener('change', function () {
      hang.querySelectorAll('input').forEach(function (x) { x.checked = ca.checked; });
    });
    return w;
  }

  function oThoiLuong() {  // 00 h 00 min ~ 00 h 00 min
    var w = el('span');
    function so(max) {
      var s = el('select', 'cbi-input-select');
      s.style.width = 'auto'; s.style.marginRight = '4px';
      for (var i = 0; i <= max; i++) {
        var o = document.createElement('option');
        o.textContent = ('0' + i).slice(-2); s.appendChild(o);
      }
      return s;
    }
    w.appendChild(so(23)); w.appendChild(document.createTextNode('h '));
    w.appendChild(so(59)); w.appendChild(document.createTextNode('min  ~  '));
    w.appendChild(so(23)); w.appendChild(document.createTextNode('h '));
    w.appendChild(so(59)); w.appendChild(document.createTextNode('min'));
    return w;
  }

  /* O mat khau + nut hien/an, giong het cac trang cua thiet bi */
  function oMatKhau(gt) {
    var g = el('div', 'control-group');
    var i = document.createElement('input');
    i.type = 'password'; i.className = 'cbi-input-password';
    if (gt !== undefined && gt !== null) i.value = gt;
    var b = el('button', 'cbi-button cbi-button-neutral', '&#8727;');
    b.title = 'Reveal/hide password';
    b.setAttribute('aria-label', 'Reveal/hide password');
    b.addEventListener('click', function (e) {
      e.preventDefault();
      i.type = (i.type === 'password') ? 'text' : 'password';
    });
    g.appendChild(i); g.appendChild(b);
    return g;
  }

  function oWidget(t, gt, them) {
    var w;
    if (t.ten === 'week_days' || t.ten === 'weekdays') w = oNgay();
    else if (t.ten === 'TimeRange') w = oThoiLuong();
    else if (t.kieu === 'Flag') {
      w = document.createElement('input');
      w.type = 'checkbox'; w.className = 'cbi-input-checkbox';
      var f = (gt !== undefined && gt !== null) ? gt : t.macdinh;
      if (f === '1' || f === 1 || f === true) w.checked = true;
    }
    else if (t.kieu === 'ListValue') {
      // ZTE hien On/Off bang radio; cac danh sach khac dung select
      var chon = (t.chon || []).map(function (c) { return c.n; }).join('/');
      w = (chon === 'On/Off' || chon === 'Off/On') ? oRadio(t) : oChon(t, gt, them);
    }
    else if (/pass|passphrase|^key$/i.test(t.ten || '')) w = oMatKhau(gt);
    else {
      w = document.createElement('input');
      w.type = 'text'; w.className = 'cbi-input-text';
      if (t.goiy) w.placeholder = t.goiy;
      if (gt !== undefined && gt !== null) w.value = gt;
      // rmempty=false => truong bat buoc; LuCI to vien do
      if (t.batbuoc) w.style.borderColor = '#d33';
    }
    
    if (t.ten && w && typeof w.setAttribute === 'function') {
      w.dataset.name = t.ten;
      w.id = 'modal_field_' + t.ten;
    }

    // o.readonly=true trong ma nguon -> thiet bi hien o bi khoa, chu xam
    if (t.khoa) {
      [].concat(w.tagName ? [w] : [], [].slice.call(w.querySelectorAll ? w.querySelectorAll('input,select') : []))
        .forEach(function (x) { if (x.tagName === 'INPUT' || x.tagName === 'SELECT') x.disabled = true; });
      w.style.opacity = '';
    }
    return w;
  }

  /* Gia tri dang chay cua mot dong trong bang.
     Hop thoai Edit tren thiet bi hien so lieu that (lay qua ubus luc chay),
     ban chup tinh khong co -> luu rieng trong gia-tri-that.json (do tay). */
  function giaTriDong(khoaTrang, dn, chiSo) {
    var b = GIATRI[khoaTrang];
    if (!b) return {};
    var ds = b[dn.tieuDe] || b[dn.muc];
    if (!ds || chiSo == null || !ds[chiSo]) return {};
    return ds[chiSo];
  }

  function moModal(dn, gt, rowIdx, b) {
    gt = gt || {};
    var ov = document.getElementById('modal_overlay');
    if (!ov) return;
    // 'cbi-modal' la lop thiet bi that dung: CSS goc cho max-width 900px,
    // con '.modal' tran chi 600px -> hop bi hep, chu bi xuong dong.
    var hop = ov.querySelector('.modal') || el('div', 'modal cbi-modal');
    hop.className = 'modal cbi-modal';
    hop.innerHTML = '';
    hop.appendChild(el('h4', '', dn.tieuDe || dn.muc || ''));

    var ssidIndex = null;
    if (rowIdx !== null && rowIdx !== undefined) {
      ssidIndex = rowIdx + 1;
    } else if (b) {
      var trEl = b.closest('tr, .tr');
      if (trEl && trEl.id) {
        var m = trEl.id.match(/WLANSSID(\d+)/i);
        if (m) ssidIndex = parseInt(m[1], 10) + 1;
      }
    }

    if (ssidIndex !== null) {
      hop.dataset.ssidIndex = String(ssidIndex);
      ov.dataset.ssidIndex = String(ssidIndex);
      var wWin = window.parent || window;
      wWin.__currentEditingSSIDIndex = ssidIndex;

      var hiddenIndexInput = el('input');
      hiddenIndexInput.type = 'hidden';
      hiddenIndexInput.id = 'modal_field_ssid_index';
      hiddenIndexInput.name = 'modal_field_ssid_index';
      hiddenIndexInput.value = String(ssidIndex);
      hop.appendChild(hiddenIndexInput);
    } else {
      delete hop.dataset.ssidIndex;
      delete ov.dataset.ssidIndex;
    }

    var tabs = dn.tabs || [];
    var than = el('div', 'cbi-section');

    function ve(tabId) {
      than.innerHTML = '';
      dn.truong.forEach(function (t) {
        if (tabId !== null && t.tab && t.tab !== tabId) return;
        var val = gt[t.ten];
        var parentWin = window.parent;
        if (parentWin && parentWin._currentLesson && Array.isArray(parentWin._currentLesson.clearFields)) {
          var selector1 = '[id="modal_field_' + t.ten + '"]';
          var selector2 = '[id="modal_field_' + t.ten + '"] input';
          if (parentWin._currentLesson.clearFields.indexOf(selector1) >= 0 || parentWin._currentLesson.clearFields.indexOf(selector2) >= 0) {
            val = '';
          }
        }
        than.appendChild(dong(t, oWidget(t, val, (gt._chonThem || {})[t.ten])));
      });
    }

    if (tabs.length) {
      var ul = el('ul', 'cbi-tabmenu');
      tabs.forEach(function (tb, i) {
        var li = el('li', i === 0 ? 'cbi-tab' : 'cbi-tab-disabled');
        var a = el('a', '', tb.ten); a.href = '#';
        a.addEventListener('click', function (e) {
          e.preventDefault();
          [].slice.call(ul.children).forEach(function (x) { x.className = 'cbi-tab-disabled'; });
          li.className = 'cbi-tab';
          ve(tb.id);
        });
        li.appendChild(a); ul.appendChild(li);
      });
      hop.appendChild(ul);
      ve(tabs[0].id);
    } else {
      ve(null);
    }
    hop.appendChild(than);

    var hd = el('div', 'cbi-page-actions');
    var huy = el('button', 'cbi-button cbi-button-reset', 'Cancel');
    var ap = el('button', 'cbi-button cbi-button-save', 'Apply');
    huy.style.cssFloat = 'left';
    huy.addEventListener('click', dongModal);
    ap.addEventListener('click', function () {
      var msgId = 'fakeModalSaveMsg';
      var oldMsg = document.getElementById(msgId);
      if (oldMsg) oldMsg.remove();
      
      var msg = document.createElement('span');
      msg.id = msgId;
      msg.style.color = '#15803d';
      msg.style.fontWeight = 'bold';
      msg.style.fontSize = '13px';
      msg.style.marginLeft = '10px';
      msg.style.verticalAlign = 'middle';
      msg.innerHTML = '✔ Saved successfully!';
      ap.parentNode.insertBefore(msg, ap.nextSibling);

      var ssidVal = (document.getElementById('modal_field_SSID') || {}).value || '';
      var keyInput = document.getElementById('modal_field_KeyPassphrase');
      var keyVal = (keyInput && keyInput.querySelector) ? (keyInput.querySelector('input') || {}).value || '' : '';

      // Lưu trữ trạng thái vào đúng dòng tr trong table (để phân biệt chính xác SSID1 vs SSID2 kể cả sau khi đóng modal)
      var tr = b ? b.closest('tr, .tr') : null;
      if (!tr && ssidIndex !== null) {
        tr = document.getElementById('cbi-json-WLANSSID' + (ssidIndex - 1));
      }
      if (tr) {
        tr.dataset.savedSsid = ssidVal;
        tr.dataset.savedKey = keyVal;
        if (ssidIndex !== null) tr.dataset.ssidIndex = String(ssidIndex);

        var hIndex = tr.querySelector('.saved-ssid-index');
        if (!hIndex) {
          hIndex = el('input');
          hIndex.type = 'hidden';
          hIndex.className = 'saved-ssid-index';
          tr.appendChild(hIndex);
        }
        hIndex.value = ssidIndex !== null ? String(ssidIndex) : '';

        var hSsid = tr.querySelector('.saved-ssid-val');
        if (!hSsid) {
          hSsid = el('input');
          hSsid.type = 'hidden';
          hSsid.className = 'saved-ssid-val';
          tr.appendChild(hSsid);
        }
        hSsid.value = ssidVal;

        var hKey = tr.querySelector('.saved-key-val');
        if (!hKey) {
          hKey = el('input');
          hKey.type = 'hidden';
          hKey.className = 'saved-key-val';
          tr.appendChild(hKey);
        }
        hKey.value = keyVal;
      }
      
      var w = window.parent || window;
      if (w.onSimulatorSave) {
        try {
          w.onSimulatorSave(window, dn.tieuDe, ssidIndex);
        } catch (e) {}
      }
      
      setTimeout(function () {
        if (msg && msg.parentNode) msg.parentNode.removeChild(msg);
        dongModal();
      }, 1000);
    });
    hd.appendChild(huy); hd.appendChild(ap);
    hop.appendChild(hd);

    if (!hop.parentNode) ov.appendChild(hop);
    ov.style.display = 'flex';
    ov.classList.add('active');
    document.body.classList.add('modal-overlay-active');
  }

  function dongModal() {
    var ov = document.getElementById('modal_overlay');
    if (!ov) return;
    ov.style.display = 'none';
    ov.classList.remove('active');
    document.body.classList.remove('modal-overlay-active');
  }
  window.__dongModal = dongModal;

  /* Tim tieu de muc gan nhat PHIA TREN mot nut -> biet nut thuoc muc nao.
     Can cho cac trang co nhieu nut Add (Filter Criteria 3, Routing 2).
     Duyet theo THU TU DOM, khong dung toa do: muc bi gap co display:none
     nen rect.top = 0 -> chon sai modal.
     Quet ca h2/h3/h4/legend vi ten section (vd 'Static IPv4 Routes') nam o
     the h2, con h3 chi la ten cua ca trang ('Routing'). */
  function mucCuaNut(b) {
    var ds = [].slice.call(document.querySelectorAll(
      'h2, h3, h4, legend, button, input[type=button]'));
    var ten = null;
    for (var i = 0; i < ds.length; i++) {
      if (ds[i] === b) break;
      if (/^(H2|H3|H4|LEGEND)$/.test(ds[i].tagName))
        ten = (ds[i].textContent || '').replace(/[▼▶]/g, '').trim();
    }
    return ten;
  }

  /* URL nhom (vd /admin/localnetwork/lan) duoc server tra ve noi dung cua
     trang con dau tien (/admin/localnetwork/lan/dhcpv4_status). Dinh nghia
     modal luu theo TEN TRANG CON, nen phai giai tiep bang firstchild,
     neu khong nut Add tren cac trang nhom se khong co phan ung. */
  function khoa() {
    var p = '/' + (location.pathname.split('/cgi-bin/luci/')[1] || '')
      .replace(/\?.*$/, '').replace(/\/+$/, '');
    for (var i = 0; i < 5; i++) {
      var k = p.replace(/^\//, '').replace(/\//g, '__');
      if (DEFS && DEFS[k]) return k;
      var tiep = FIRSTCHILD[p];
      if (!tiep || tiep === p) break;
      p = tiep;
    }
    return p.replace(/^\//, '').replace(/\//g, '__');
  }

  /* Nut Edit thuoc dong thu may trong bang cua no? */
  function chiSoDong(b) {
    var tr = b.closest('tr, .tr');
    if (!tr) return null;
    var bang = tr.closest('table, .table');
    if (!bang) return null;
    var ds = [].slice.call(bang.querySelectorAll('tr, .tr'))
      .filter(function (x) { return x.querySelector('button, input[type=button]'); });
    var i = ds.indexOf(tr);
    return i < 0 ? null : i;
  }

  function gan() {
    var kt = khoa();
    var ds = DEFS && DEFS[kt];
    if (!ds) return 0;
    if (!Array.isArray(ds)) ds = [ds];
    var n = 0;
    document.querySelectorAll('button, input[type=button]').forEach(function (b) {
      var t = (b.textContent || b.value || '').trim();
      if (!/^(Add|Edit|Modify)$/i.test(t)) return;
      b.addEventListener('click', function (e) {
        e.preventDefault();
        var w = window.parent || window;
        w._hasClickedSaveInGuide = false;
        
        var dn = ds[0];
        if (ds.length > 1) {
          var muc = mucCuaNut(b);
          /* Khop bang CA hai ten: 'muc' (ten section, vd 'Static IPv4 Routes')
             VA 'tieuDe' (ten form.Map, vd 'IP Filter'). Nhieu view khong dat
             ten section - chi dua vao 'muc' thi moi nut deu mo cung mot hop. */
          for (var i = 0; i < ds.length && muc; i++) {
            var a = ds[i].muc, c = ds[i].tieuDe;
            if ((a && muc.indexOf(a) >= 0) || (c && muc.indexOf(c) >= 0)) { dn = ds[i]; break; }
          }
        }
        // Add = tao moi (khong co gia tri); Edit = sua dong dang co
        var rowIdx = chiSoDong(b);
        var gt = /^(Edit|Modify)$/i.test(t) ? giaTriDong(kt, dn, rowIdx) : {};
        moModal(dn, gt, rowIdx, b);
      });
      n++;
    });
    return n;
  }

  function chay() {
    var style = document.createElement('style');
    style.innerHTML = '\
      #modal_overlay > .modal.cbi-modal {\
        margin: 1.5em auto !important;\
        padding: 0.8em 1.2em 0.6em !important;\
        max-width: 650px !important;\
      }\
      #modal_overlay > .modal.cbi-modal .cbi-value {\
        margin-bottom: 10px !important;\
      }\
      #modal_overlay > .modal.cbi-modal h4 {\
        margin-top: 0 !important;\
        margin-bottom: 12px !important;\
        line-height: 1.2 !important;\
      }\
    ';
    document.head.appendChild(style);

    Promise.all([
      fetch('/modal-defs.json').then(function (r) { return r.json(); }),
      window.__FIRSTCHILD ||
      fetch('/firstchild.json').then(function (r) { return r.json(); }).catch(function () { return {}; }),
      // dat duoi /luci-static/ de server phuc vu duoc ngay, khong can khoi dong lai
      fetch('/luci-static/gia-tri-that.json').then(function (r) { return r.json(); })
        .catch(function () { return {}; })
    ]).then(function (kq) {
      DEFS = kq[0]; FIRSTCHILD = kq[1] || {}; GIATRI = kq[2] || {};
      var n = gan(); if (n) console.log('[modal] da gan ' + n + ' nut');
    }).catch(function () { });
  }
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', chay);
  else chay();
})();
