/* Noi cac o nhap tren trang vao kho cau hinh trung tam (config_store) qua
   dung API that /api/v1/data/<resource>.

   Bang noi nam trong /binding_data.js (sinh tu spec/binding.json boi
   src/tao_binding.py). Moi anh xa trong do deu CO BANG CHUNG: duoc suy ra
   bang cach doi chieu 3 nguon do truc tiep tren thiet bi that -- trang nao
   goi API nao, gia tri that cua tung o nhap, va noi dung that cua tung
   endpoint. O nao mo ho (nhieu duong dan cung khop) thi KHONG noi, de
   nguyen gia tri tinh cua ban chup -- xem spec/binding.json muc _mo_ho.

   Trang Wi-Fi General KHONG dung file nay: no co logic rieng
   (wifi_api.js) vi cach ghi ssids theo nhom 2.4G+5G da duoc xac nhan
   rieng bang HAR that.

   ========================= PHAN GHI (PATCH) =========================
   Chi hien thanh Save khi form co thay doi VA resource that su cho ghi
   (doi chieu window.__METHODS -- trich tu ma goc, xem spec/api_methods.json).
   Resource chi doc thi khong bao gio hien nut, dung nhu thiet bi that.

   Hinh dang body -- theo 2 mau DA CO BANG CHUNG:
     1. Resource dang OBJECT (firewall, upnp, time, ext/timer/*...):
        gui object long theo dung duong dan cua o. Vd o
        'dosDefense.tcpFlood.rate' -> {dosDefense:{tcpFlood:{rate: ...}}}.
        Server gop nong theo khoa (config_store.ghi).
     2. Resource dang MANG (dmz/configurations, ddns/configurations,
        interfaces/configurations, radios...): gui MOT MANG cac phan tu,
        moi phan tu kem 'id'. Bang chung: ma goc trang DMZ lam
        setDmzConfiguration({payload:[{...form, id: banGhi.id}]}), va HAR
        that cua ssids cung gui nguyen mang cac ban ghi kem id.

   CHUA XAC NHAN: hai mau tren lay tu 2 truong hop cu the (DMZ + ssids) roi
   ap cho cac resource cung kieu. Method thi da doi chieu ma goc nen chac,
   nhung HINH DANG BODY cua tung resource chua co HAR rieng -- xem
   ISSUES.md muc cung ngay. */
(function () {
  /* Tra ve bang noi cua trang. Uu tien khoa DAY DU (vd
     'system__general__t1') vi co nhung o chi ton tai o dung mot tab -- nhu
     tab Time Synchronization co 'ntp.servers.N.value'. Neu khong co khoa
     day du thi lui ve khoa goc (bo hau to __tN), vi da so tab dung chung
     mot bo o nhap. */
  function bangCuaTrang() {
    var B = window.__BINDING || {};
    var n = (location.pathname.split('/').pop() || 'index.html').replace('.html', '');
    if (n === 'index' || n === '') n = 'home__overview';
    var goc = n.replace(/__t\d+$/, '');
    if (B[n] && B[goc] && n !== goc) {
      var gop = {}, k;
      for (k in B[goc]) gop[k] = B[goc][k];
      for (k in B[n]) gop[k] = B[n][k];
      return gop;
    }
    return B[n] || B[goc];
  }

  function docSau(o, duong) {
    // 'dosDefense.tcpFlood.rate' hoac '[1].ipv4Settings.pppoe.username'
    var cur = o;
    var re = /([^.[\]]+)|\[(\d+)\]/g, m;
    while ((m = re.exec(duong))) {
      if (cur == null) return undefined;
      cur = m[2] !== undefined ? cur[Number(m[2])] : cur[m[1]];
    }
    return cur;
  }

  function datVaoO(el, gt) {
    if (gt === undefined || gt === null) return false;
    if (el.type === 'checkbox' || el.type === 'radio') el.checked = !!gt;
    else el.value = String(gt);
    return true;
  }

  function nap() {
    var BANG = bangCuaTrang();
    if (!BANG) return;

    var canTai = {};
    Object.keys(BANG).forEach(function (ten) { canTai[BANG[ten].resource] = 1; });

    Promise.all(Object.keys(canTai).map(function (r) {
      return fetch('/api/v1/data/' + r)
        .then(function (x) { return x.ok ? x.json() : null; })
        .then(function (d) { return [r, d]; })
        .catch(function () { return [r, null]; });
    })).then(function (cap) {
      var kho = {};
      cap.forEach(function (c) { kho[c[0]] = c[1]; });

      var da = 0, hong = 0;
      Object.keys(BANG).forEach(function (ten) {
        var b = BANG[ten];
        var el = document.querySelector('[name="' + ten + '"]');
        if (!el || kho[b.resource] == null) { hong++; return; }
        if (el._ftcUserModified) { da++; return; }
        if (datVaoO(el, docSau(kho[b.resource], b.duong_dan))) da++; else hong++;
      });
      if (window.__simSync) window.__simSync();
      khoLuc = kho;                 // giu de biet 'id' khi ghi mang
      console.log('[api_binding] nap ' + da + ' o tu kho cau hinh'
        + (hong ? ', ' + hong + ' o khong nap duoc' : ''));
      theoDoi(BANG);
    });
  }

  /* ------------------------------- GHI ------------------------------- */

  var khoLuc = {};       // ban sao du lieu vua doc, de lay 'id' cho mang
  var thanhSave = null;

  function docO(el) {
    if (el.type === 'checkbox' || el.type === 'radio') return el.checked;
    var v = el.value;
    if (v !== '' && !isNaN(Number(v)) && /^-?\d+(\.\d+)?$/.test(v)) return Number(v);
    return v;
  }

  /* Dat gia tri vao object long theo duong dan, tao nhanh con neu chua co.
     Tra ve chi so mang cap dau neu duong dan bat dau bang '[N]'. */
  function datSau(goc, duong, gt) {
    var phan = [], re = /([^.[\]]+)|\[(\d+)\]/g, m;
    while ((m = re.exec(duong))) phan.push(m[2] !== undefined ? Number(m[2]) : m[1]);
    var cur = goc;
    for (var i = 0; i < phan.length - 1; i++) {
      var k = phan[i];
      if (cur[k] === undefined || typeof cur[k] !== 'object') {
        cur[k] = (typeof phan[i + 1] === 'number') ? [] : {};
      }
      cur = cur[k];
    }
    cur[phan[phan.length - 1]] = gt;
  }

  function coTheGhi(resource) {
    var m = (window.__METHODS || {})[resource];
    return !m || m.indexOf('PATCH') >= 0;   // khong biet thi cho phep, biet thi theo ma goc
  }

  /* Co resource DOC mot duong, GHI mot duong khac. Vd hostname: doc tu
     'system/info' (chi doc) nhung ghi qua 'system' (ham setSystemInfo trong
     ma goc). Khai bao bang truong 'resource_ghi' trong
     spec/binding_thu_cong.json. */
  function resourceGhi(b) { return b.resource_ghi || b.resource; }

  function goThanhSave() {
    if (thanhSave && thanhSave.parentNode) thanhSave.parentNode.removeChild(thanhSave);
    thanhSave = null;
  }

  /* Markup thanh Save/cancel lay y tu ban chup that
     (reference/source/wifi_general_co_nut_save.html) -- component dung chung. */
  function hienThanhSave(BANG) {
    if (thanhSave) return;
    var form = document.querySelector('form');
    if (!form) return;
    var w = form.querySelector('[data-sim-save="1"]');
    if (!w) {
      w = document.createElement('div');
      w.className = 'MuiStack-root alternative-layout css-den97n';
      w.setAttribute('data-sim-save', '1');
      w.innerHTML =
        '<button class="MuiButtonBase-root MuiButton-root MuiButton-contained MuiButton-containedPrimary MuiButton-sizeMedium MuiButton-containedSizeMedium MuiButton-colorPrimary formActionButton submit alternative-layout alternative-layout--submit css-g28vy7" tabindex="0" type="button"><span class="MuiBox-root css-rrm59m">Save</span><span class="MuiTouchRipple-root css-w0pj6f"></span></button>' +
        '<button class="MuiButtonBase-root MuiButton-root MuiButton-text MuiButton-textPrimary MuiButton-sizeMedium MuiButton-textSizeMedium MuiButton-colorPrimary formActionButton cancel alternative-layout css-1acoyi9" tabindex="0" type="button">cancel<span class="MuiTouchRipple-root css-w0pj6f"></span></button>';
      form.appendChild(w);
    }
    thanhSave = w;
    var btnSubmit = w.querySelector('.submit');
    if (btnSubmit && !btnSubmit.__boundApiSave) {
      btnSubmit.__boundApiSave = true;
      btnSubmit.addEventListener('click', function () {
        try {
          if (window.top && window.top !== window) {
            window.top._hasClickedSaveInGuide = true;
          }
          if (window.parent && typeof window.parent.onSimulatorSave === 'function') {
            window.parent.onSimulatorSave(window);
          }
        } catch (e) { }
        luu(BANG);
      });
    }
    var btnCancel = w.querySelector('.cancel');
    if (btnCancel && !btnCancel.__boundApiCancel) {
      btnCancel.__boundApiCancel = true;
      btnCancel.addEventListener('click', function () { goThanhSave(); nap(); });
    }
  }

  function luu(BANG) {
    var theoResource = {};
    Object.keys(BANG).forEach(function (ten) {
      var b = BANG[ten];
      var el = document.querySelector('[name="' + ten + '"]');
      var rg = resourceGhi(b);
      if (!el || !coTheGhi(rg)) return;
      (theoResource[rg] = theoResource[rg] || [])
        .push({ duong_dan: b.duong_dan, gt: docO(el), resource_doc: b.resource });
    });

    // Bo sung dac biet cho o Subnet Mask tren trang advanced__lan
    var maskEl = document.querySelector('input[name="ipv4Settings.mask"], .MuiAutocomplete-input');
    if (maskEl && location.pathname.indexOf('advanced__lan') >= 0) {
      var rg = 'interfaces/configurations';
      var foundMask = (theoResource[rg] || []).some(function (item) {
        return item.duong_dan === '[0].ipv4Settings.mask';
      });
      if (!foundMask) {
        (theoResource[rg] = theoResource[rg] || []).push({
          duong_dan: '[0].ipv4Settings.mask',
          gt: maskEl.value || '255.255.255.0',
          resource_doc: rg
        });
      }
    }

    var viec = Object.keys(theoResource).map(function (r) {
      var r_doc = theoResource[r][0].resource_doc || r;
      var la_mang = Array.isArray(khoLuc[r_doc]);
      var than;
      if (la_mang) {
        // gom cac o theo chi so phan tu, moi phan tu kem 'id' (mau DMZ/ssids)
        var theoIdx = {};
        theoResource[r].forEach(function (x) {
          var m = /^\[(\d+)\]\.?(.*)$/.exec(x.duong_dan);
          if (!m) return;
          var i = Number(m[1]);
          theoIdx[i] = theoIdx[i] || {};
          datSau(theoIdx[i], m[2], x.gt);
        });
        than = Object.keys(theoIdx).map(function (i) {
          var pt = theoIdx[i];
          var goc = khoLuc[r_doc][Number(i)];
          if (goc && goc.id !== undefined) pt.id = goc.id;
          return pt;
        });
        if (!than.length) return null;
      } else {
        than = {};
        theoResource[r].forEach(function (x) { datSau(than, x.duong_dan, x.gt); });
      }
      return fetch('/api/v1/data/' + r, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(than)
      }).then(function (res) { return { r: r, ok: res.ok, ma: res.status }; });
    }).filter(Boolean);

    Promise.all(viec).then(function (kq) {
      var loi = kq.filter(function (x) { return !x.ok; });
      nap();
      if (window.parent && typeof window.parent.onSimulatorSave === 'function') {
        try { window.parent.onSimulatorSave(window); } catch(e){}
      } else if (window.top && typeof window.top.onSimulatorSave === 'function') {
        try { window.top.onSimulatorSave(window); } catch(e){}
      } else {
        if (loi.length) {
          alert('Co ' + loi.length + ' resource khong luu duoc: '
            + loi.map(function (x) { return x.r + ' (' + x.ma + ')'; }).join(', '));
        } else {
          alert('Da luu vao config_store that.');
        }
      }
    });
  }

  function theoDoi(BANG) {
    var form = document.querySelector('form');
    if (!form || form.__daTheoDoi) return;
    // chi theo doi khi co it nhat 1 resource cho ghi
    var coGhi = Object.keys(BANG).some(function (t) { return coTheGhi(resourceGhi(BANG[t])); });
    if (!coGhi) return;
    form.__daTheoDoi = true;
    hienThanhSave(BANG);
    ['input', 'change'].forEach(function (loai) {
      form.addEventListener(loai, function (e) {
        if (thanhSave && thanhSave.contains(e.target)) return;
        hienThanhSave(BANG);
      });
    });
  }

  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', nap);
  else nap();
})();
