/* Noi o nhap tren trang vao kho cau hinh trung tam qua dung API that
   /api/v1/data/<resource>.

   Bang noi o /binding_data.js (sinh tu spec/binding.json). KHAC voi ban
   AP-BE6500C: bang noi ben do suy ra bang cach doi chieu 3 nguon (co cho
   mo ho); ben nay lay tu DAC TA DOC MA GOC o GD3 nen tung dong deu truy
   duoc ve mot file JS goc cu the.

   ===================== HOP DONG GHI -- DO THAT =====================
   Do truc tiep tren thiet bi 192.168.1.1 ngay 2026-08-13, xem
   reference/source/hop_dong_ghi_that.json:

     PATCH  -> 200, than RONG (0 byte)     KHONG duoc doc than
     POST   -> 200, {"ids":["<id>"]}
     DELETE -> 200, than RONG              than gui len la {"ids":[...]}

   Vi PATCH khong tra du lieu, muon biet ket qua thi phai GET LAI. Ban dau
   du an doan PATCH tra ve doi tuong da cap nhat -- do la SAI.

   ==================== RESOURCE CHI DOC ====================
   Resource nao ma ma goc noi khong ho tro PATCH thi KHONG BAO GIO hien
   thanh Save (doi chieu window.__METHODS). Dung nhu thiet bi that. */
(function () {
  'use strict';

  /* ---------------------------------------------------------- tien ich */

  function tenTrang() {
    var n = (location.pathname.split('/').pop() || 'index.html')
      .replace('.html', '');
    /* GD5: bo tien to 'm_' cua ban DIEN THOAI truoc khi nhan dien trang.
       Neu khong, module nay se khong nhan ra 'm_<route>' va thoat ngay ->
       moi trang dien thoai mat sach phan noi du lieu. Loi da bat duoc
       2026-08-14 khi kiem ban dien thoai cua trang LAN. */
    if (n.indexOf('m_') === 0) n = n.slice(2);
    if (n === 'index' || n === '') n = 'home__overview';
    return n.replace(/__t\d+$/, '');       // bo hau to tab
  }

  function docSau(o, duong) {
    var cur = o, re = /([^.[\]]+)|\[(\d+)\]/g, m;
    while ((m = re.exec(duong))) {
      if (cur == null) return undefined;
      cur = m[2] !== undefined ? cur[Number(m[2])] : cur[m[1]];
    }
    return cur;
  }

  function datSau(goc, duong, gt) {
    var phan = [], re = /([^.[\]]+)|\[(\d+)\]/g, m;
    while ((m = re.exec(duong))) {
      phan.push(m[2] !== undefined ? Number(m[2]) : m[1]);
    }
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

  /* Chuan hoa mo ta mot truong: cho phep viet gon dang chuoi. */
  function moTa(ten) {
    var v = CAU_HINH.truong[ten];
    return (typeof v === 'string') ? { duong_dan: v } : v;
  }

  /* Tim o nhap theo NHAN. Bat buoc cho MUI Autocomplete: da kiem tren DOM
     that -- the <input> cua no KHONG co thuoc tinh name (react-hook-form
     dieu khien qua Controller chu khong qua name). */
  function timTheoNhan(nhan) {
    var ds = document.querySelectorAll('#root .MuiFormControl-root');
    for (var i = 0; i < ds.length; i++) {
      var lb = ds[i].querySelector('label');
      if (lb && lb.textContent.trim() === nhan) {
        var inp = ds[i].querySelector('input:not([type="hidden"])');
        if (inp) return inp;
      }
    }
    return null;
  }

  function timO(ten) {
    var mt = moTa(ten);
    if (mt && mt.theo_nhan) return timTheoNhan(mt.theo_nhan);
    return document.querySelector('[name="' + CSS.escape(ten) + '"]');
  }

  /* Bao loi KHONG dung alert().
     Ly do 1 -- dung: thiet bi that khong bao gio dung alert, no dung
     Snackbar cua MUI (goc duoi trai, tu tat).
     Ly do 2 -- thuc te: alert() CHAN CUNG luong render. Ngay 2026-08-13
     dieu nay lam tab dong bang va moi lenh dieu khien Chrome deu het gio,
     tuong nham la vong lap vo tan. Mat kha lau moi tim ra. */
  function baoLoi(msg) {
    console.error('[api_binding] ' + msg);
    var cu = document.getElementById('sim-thong-bao');
    if (cu) cu.remove();
    var d = document.createElement('div');
    d.id = 'sim-thong-bao';
    d.textContent = msg;
    d.style.cssText = 'position:fixed;left:16px;bottom:16px;z-index:99999;'
      + 'max-width:420px;padding:12px 16px;border-radius:4px;'
      + 'background:#d32f2f;color:#fff;font:14px Inter,sans-serif;'
      + 'box-shadow:0 3px 8px rgba(0,0,0,.3)';
    document.body.appendChild(d);
    setTimeout(function () { if (d.parentNode) d.remove(); }, 6000);
  }

  /* Danh sach thiet bi de dung nhan hien thi -- nap mot lan.
     Ma goc (hook useDevices): bo type='Router', chi giu status='Up',
     nhan = `${hostname || 'Unknown'} (${dia chi IPv4})`. */
  var DS_THIET_BI = null;

  function napThietBi() {
    if (DS_THIET_BI) return Promise.resolve(DS_THIET_BI);
    return fetch('/api/v1/data/devices', { cache: 'no-store' })
      .then(function (r) { return r.ok ? r.json() : []; })
      .then(function (ds) {
        DS_THIET_BI = (Array.isArray(ds) ? ds : [])
          .filter(function (x) { return x.type !== 'Router' && x.status === 'Up'; })
          .map(function (x) {
            var ip4 = (x.ipAddresses || []).filter(function (a) {
              return a.version === 4;
            })[0];
            return {
              ip: ip4 ? ip4.address : '',
              nhan: (x.hostname || 'Unknown') + ' (' + (ip4 ? ip4.address : '') + ')'
            };
          });
        return DS_THIET_BI;
      })
      .catch(function () { DS_THIET_BI = []; return DS_THIET_BI; });
  }

  function nhanThietBi(ip) {
    var m = (DS_THIET_BI || []).filter(function (x) { return x.ip === ip; })[0];
    return m ? m.nhan : String(ip);
  }

  function datVaoO(el, gt, mt) {
    if (gt === undefined || gt === null) return false;
    if (el.type === 'checkbox' || el.type === 'radio') {
      el.checked = !!gt;
    } else if (mt && mt.rong_khi_falsy && !gt) {
      /* Ma goc dung `<gia tri>||""` khi dung defaultValues, nen gia tri 0
         hien thanh O RONG chu KHONG phai chuoi "0". Gap o 8 o rate/burst
         cua trang Security>>Firewall -- da xac nhan tren thiet bi that
         2026-08-18: API tra udpFlood.rate=0 nhung o tren man hinh rong.
         Chi bat cho truong nao khai ro co nay trong spec/binding.json. */
      el.value = '';
    } else if (mt && mt.hien_thi === 'nhan_thiet_bi') {
      // Nguoi dung THAY nhan, con gia tri that giu trong data-sim-gia-tri.
      el.dataset.simGiaTri = String(gt);
      el.value = nhanThietBi(gt);
    } else {
      el.value = String(gt);
    }
    return true;
  }

  function docO(el, mt) {
    if (el.type === 'checkbox' || el.type === 'radio') return el.checked;
    if (mt && mt.hien_thi === 'nhan_thiet_bi') {
      // Uu tien gia tri that; neu nguoi dung go tay thi lay nguyen chuoi.
      if (el.dataset.simGiaTri !== undefined) return el.dataset.simGiaTri;
      var m = (DS_THIET_BI || []).filter(function (x) {
        return x.nhan === el.value;
      })[0];
      return m ? m.ip : el.value;
    }
    var v = el.value;
    if (v !== '' && /^-?\d+(\.\d+)?$/.test(v)) return Number(v);
    return v;
  }

  /* Chon dung phan tu trong resource dang mang, theo dieu kien 'loc'.
     Vd DMZ: ma goc lam p.find(x => x.ipVersion === 4). */
  function locPhanTu(ds, dieuKien) {
    if (!Array.isArray(ds)) return null;
    var khoa = Object.keys(dieuKien);
    for (var i = 0; i < ds.length; i++) {
      var ok = true;
      for (var j = 0; j < khoa.length; j++) {
        if (ds[i][khoa[j]] !== dieuKien[khoa[j]]) { ok = false; break; }
      }
      if (ok) return ds[i];
    }
    return null;
  }

  /* GD5 phan 2 nhom System (2026-08-14): truong nao co 'tuy_chon' tinh
     (spec/binding.json) la MUI Select ma tu truoc gio api_binding.js chi
     dat '.value' len INPUT AN chu chua bao gio noi menu that -- giong het
     loi da bat o DDNS/Bandwidth/Channel (xem apDungPhuThuoc() ben tren),
     nhung lan nay phat hien tren Timezone (System > General). Danh sach
     tuy_chon lay THANG tu file hang so goc timezone-DtTaowKW.js (xem
     spec/binding.json), khong doan. */
  function noiChonTinh(mt, el) {
    if (!mt.tuy_chon || !window.__noiOChon) return;
    var boc = el.closest('.MuiFormControl-root');
    var oSelect = boc ? boc.querySelector('.MuiSelect-select') : null;
    if (!oSelect) return;
    var ds = mt.tuy_chon.map(function (t) { return { gt: t.value, chu: t.label }; });
    var dangChon = mt.tuy_chon.filter(function (t) { return t.value === el.value; })[0];
    if (dangChon) oSelect.textContent = dangChon.label;
    window.__noiOChon(oSelect, el, ds);
  }

  function coTheGhi(resource) {
    var m = (window.__METHODS || {})[resource];
    // Khong biet thi KHONG cho ghi -- tha khong hien nut con hon hien nut
    // roi gui request ma thiet bi that se tu choi.
    return !!m && m.indexOf('PATCH') >= 0;
  }

  /* ------------------------------------------------------------- trang */

  var CAU_HINH = null;      // muc trong __BINDING cua trang nay
  var thanhSave = null;

  /* CHOT CHONG DE QUY -- da vap 2026-08-13, treo trinh duyet.
     nap() dat lai gia tri vao o roi goi window.__simSync() cua interact.js;
     ham do phat lai su kien 'change' de lam song lai cong tac MUI. Su kien
     do lai kich hoat chinh bo theo doi ben duoi -> luu() -> nap() -> ...
     vong lap vo tan.
     Cung ho voi loi bo ghi tu ghi chinh no o GD1 (phinh 168 MB). Bai hoc:
     he nao vua NGHE su kien vua PHAT su kien thi phai co chot. */
  var dangNap = false;
  var dangGhi = false;      // chot thu hai: khoa suot ca chuoi luu -> nap
  var demGhi = 0;           // dem so lan luu trong mot cua so thoi gian
  var moDem = 0;
  var TAT_KHAN = false;     // cong tac ngat: loop thi TAT han, khong treo

  /* Neu trong 5 giay ma phai luu qua 15 lan thi chac chan la vong lap.
     Tat han va bao ro ra console con hon de trinh duyet treo cung -- lan
     dau gap loi nay (2026-08-13) tab bi dong bang, phai mo tab moi. */
  function quaNhieuLanGhi() {
    var t = Date.now();
    if (t - moDem > 5000) { moDem = t; demGhi = 0; }
    demGhi++;
    if (demGhi > 15) {
      TAT_KHAN = true;
      console.error('[api_binding] NGAT KHAN: phat hien vong lap ghi '
        + '(>15 lan/5s). Da tat tu dong luu de khong treo trinh duyet.');
      return true;
    }
    return false;
  }

  /* KHO[<ten_nguon>] = du lieu vua GET ve cua nguon do */
  var KHO = {};

  function nguonCua(ten) { return CAU_HINH.nguon[moTa(ten).nguon]; }

  function resourceGhiCua(ng) { return ng.resource_ghi || ng.resource; }

  /* Lay object chua cac truong, tuy theo 'dang' cua nguon */
  function gocDuLieu(ng, d) {
    if (ng.dang === 'mang_loc') return locPhanTu(d, ng.loc);
    if (ng.dang === 'mang_moi_phan_tu') {
      // Ma goc DDNS doc tu phan tu DAU TIEN.
      return Array.isArray(d) ? d[0] : null;
    }
    return d;
  }

  function nap() {
    dangNap = true;
    var tenNguon = Object.keys(CAU_HINH.nguon);
    return Promise.all(tenNguon.map(function (tn) {
      var r = CAU_HINH.nguon[tn].resource;
      return fetch('/api/v1/data/' + r, { cache: 'no-store' })
        .then(function (x) { return x.ok ? x.json() : null; })
        .then(function (v) { return [tn, v]; })
        .catch(function () { return [tn, null]; });
    })).then(function (cap) {
      KHO = {};
      cap.forEach(function (c) { KHO[c[0]] = c[1]; });

      var da = 0, hong = [];
      Object.keys(CAU_HINH.truong).forEach(function (ten) {
        var mt = moTa(ten);
        var ng = CAU_HINH.nguon[mt.nguon];
        var goc = gocDuLieu(ng, KHO[mt.nguon]);
        var el = timO(ten);
        if (!el) { hong.push(ten + ' (khong tim thay o)'); return; }
        if (goc == null) { hong.push(ten + ' (nguon rong)'); return; }
        if (datVaoO(el, docSau(goc, mt.duong_dan), mt)) {
          da++;
          noiChonTinh(mt, el);
        } else hong.push(ten + ' (kho khong co gia tri)');
      });
      apDungPhuThuoc();
      if (window.__simSync) window.__simSync();
      console.log('[api_binding] ' + tenTrang() + ': nap ' + da + '/'
        + Object.keys(CAU_HINH.truong).length + ' o'
        + (hong.length ? ' | chua nap: ' + hong.join(', ') : ''));
    })
      .catch(function (e) {
        console.error('[api_binding] nap that bai:', e);
      })
      .then(function () {
        // Mo chot SAU khi hang doi vi mo hien tai chay het, de moi su kien
        // 'change' do __simSync() phat ra deu roi vao luc dangNap con true.
        setTimeout(function () { dangNap = false; }, 0);
      });
  }

  /* Vd DMZ: o ipAddress bi tat khi cong tac enabled dang tat. */
  function apDungPhuThuoc() {
    var pt = CAU_HINH.phu_thuoc;
    if (!pt) return;
    Object.keys(pt).forEach(function (ten) {
      var el = timO(ten);
      var dk = timO(pt[ten].tat_khi_tat);
      if (!el || !dk) return;
      var bat = !!dk.checked;
      el.disabled = !bat;
      var boc = el.closest('.MuiFormControl-root, .MuiAutocomplete-root');
      if (boc) boc.classList.toggle('Mui-disabled', !bat);
      /* GD5 phan 2 nhom Advanced (2026-08-14): neu 'el' la INPUT AN cua
         MUI Select (vd 'dynamicServer' o DDNS) thi dat '.disabled' tren
         no KHONG co tac dung thi giac gi ca -- o hien thi that su la
         mot <div class="MuiSelect-select">, khong phai the <input>, nen
         khong co pseudo-class ':disabled' cua trinh duyet. Bang chung
         chup luc Enable dang TAT nen luon mang san 'aria-disabled=true'
         + khong co tabindex; truoc gio khong ai cap nhat lai hai thu do
         khi bat cong tac len -> o Select tro nen VE NHU van bi khoa du
         da mo, hoac VE NHU mo du dang khoa (tuy trang thai luc chup).
         Phat hien khi kiem m_advanced__ddns. */
      var oSelect = boc ? boc.querySelector('.MuiSelect-select') : null;
      if (oSelect) {
        oSelect.setAttribute('aria-disabled', bat ? 'false' : 'true');
        oSelect.classList.toggle('Mui-disabled', !bat);
        if (bat) oSelect.setAttribute('tabindex', '0');
        else oSelect.removeAttribute('tabindex');
      }
    });
  }

  /* --------------------------------------------------------------- ghi */

  /* Dung than PATCH cho MOT nguon. Tra ve null neu nguon do khong co
     truong nao (khong can gui). */
  function dungThan(tenNguon) {
    var ng = CAU_HINH.nguon[tenNguon];
    var than = {};
    var coTruong = false;
    Object.keys(CAU_HINH.truong).forEach(function (ten) {
      var mt = moTa(ten);
      if (mt.nguon !== tenNguon) return;
      var el = timO(ten);
      if (!el) return;
      datSau(than, mt.duong_dan, docO(el, mt));
      coTruong = true;
    });
    if (!coTruong) return null;

    // Cac khoa LUON gui kem du form khong co o nhap.
    // Vd System Settings: ma goc luon gui enabled:true cho resource 'time'.
    if (ng.them_khi_ghi) {
      Object.keys(ng.them_khi_ghi).forEach(function (k) {
        if (than[k] === undefined) than[k] = ng.them_khi_ghi[k];
      });
    }

    if (ng.dang === 'mang_loc') {
      // Ma goc DMZ: payload la MANG mot phan tu, kem id cua ban ghi goc.
      var goc = gocDuLieu(ng, KHO[tenNguon]);
      if (ng.gui_kem_id && goc && goc.id !== undefined) than.id = goc.id;
      return [than];
    }
    if (ng.dang === 'mang_moi_phan_tu') {
      // Ma goc DDNS: ap CUNG bo gia tri cho MOI phan tu, giu id tung phan tu.
      var ds = KHO[tenNguon];
      if (!Array.isArray(ds)) return null;
      return ds.map(function (pt) {
        var b = {};
        Object.keys(than).forEach(function (k) { b[k] = than[k]; });
        if (pt.id !== undefined) b.id = pt.id;
        return b;
      });
    }
    return than;
  }

  function luu() {
    if (TAT_KHAN) return Promise.resolve();
    if (dangGhi) return Promise.resolve();      // dang ghi roi, bo qua
    if (quaNhieuLanGhi()) return Promise.resolve();
    dangGhi = true;

    // Ma goc trang System Settings goi Promise.all([setSystemInfo, setTime])
    // -- hai PATCH SONG SONG. Lam dung nhu vay.
    var viec = Object.keys(CAU_HINH.nguon).map(function (tn) {
      var than = dungThan(tn);
      if (than === null) return null;
      var r = resourceGhiCua(CAU_HINH.nguon[tn]);
      return fetch('/api/v1/data/' + r, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(than)
      }).then(function (res) {
        // KHONG doc than: thiet bi that tra RONG. Chi xet ma HTTP.
        if (!res.ok) throw new Error(r + ' -> HTTP ' + res.status);
      });
    }).filter(Boolean);

    return Promise.all(viec).then(function () {
      goThanhSave();
      return nap();                 // muon biet ket qua thi phai GET LAI
    }).then(function () {
      return new Promise(function (ok) {
        setTimeout(function () { dangGhi = false; ok(); }, 0);
      });
    }, function (e) {
      dangGhi = false;
      throw e;
    });
  }

  /* ------------------------------------------------------- thanh Save */

  function goThanhSave() {
    if (thanhSave && thanhSave.parentNode) {
      thanhSave.parentNode.removeChild(thanhSave);
    }
    thanhSave = null;
  }

  function hienThanhSave() {
    if (thanhSave) return;
    var neo = document.querySelector('form') || document.querySelector('#root');
    if (!neo) return;
    var w = document.createElement('div');
    w.className = 'MuiStack-root alternative-layout css-den97n';
    w.setAttribute('data-sim-save', '1');
    w.innerHTML =
      '<button type="button" class="MuiButtonBase-root MuiButton-root '
      + 'MuiButton-contained MuiButton-containedPrimary MuiButton-sizeMedium '
      + 'formActionButton submit alternative-layout '
      + 'alternative-layout--submit css-g28vy7">'
      + '<span class="MuiBox-root css-rrm59m">'
      + (CAU_HINH.nhan_nut_luu || 'Save') + '</span></button>'
      + '<button type="button" class="MuiButtonBase-root MuiButton-root '
      + 'MuiButton-text MuiButton-textPrimary MuiButton-sizeMedium '
      + 'formActionButton cancel alternative-layout css-1acoyi9">cancel</button>';
    neo.appendChild(w);
    thanhSave = w;
    w.querySelector('.submit').addEventListener('click', function () {
      luu().catch(function (e) {
        var tb = (CAU_HINH.thong_bao || {}).loi
          || 'An error has occurred. Please try again.';
        baoLoi(tb + '  (' + e.message + ')');
      });
    });
    w.querySelector('.cancel').addEventListener('click', function () {
      nap();
    });
  }

  /* ------------------------------------------------------------ theo doi */

  function theoDoi() {
    var vung = document.querySelector('#root');
    if (!vung || vung.__daTheoDoi) return;
    vung.__daTheoDoi = true;

    var choGhi = Object.keys(CAU_HINH.nguon).every(function (tn) {
      return coTheGhi(resourceGhiCua(CAU_HINH.nguon[tn]));
    });

    ['input', 'change'].forEach(function (loai) {
      vung.addEventListener(loai, function (e) {
        // CHOT: bo qua moi su kien sinh ra trong luc dang nap lai gia tri.
        // Khong co dong nay thi nap() -> __simSync() -> 'change' -> luu()
        // -> nap() ... treo trinh duyet.
        if (TAT_KHAN || dangNap || dangGhi) return;
        if (thanhSave && thanhSave.contains(e.target)) return;
        // Khong the chi so theo e.target.name: o Autocomplete KHONG co name.
        // Phai doi chieu ca theo dinh danh phan tu.
        var la_o_cua_ta = Object.keys(CAU_HINH.truong).some(function (t) {
          return timO(t) === e.target;
        });
        if (!la_o_cua_ta) return;

        apDungPhuThuoc();
        if (!choGhi) return;

        if (CAU_HINH.tu_luu) {
          // Ma goc mot so trang luu NGAY khi doi, khong co nut Save.
          var daBat = !!e.target.checked;   // chot lai TRUOC khi nap lai
          luu().then(function () {
            var tb = CAU_HINH.thong_bao || {};
            var msg = daBat ? tb.thanh_cong_bat : tb.thanh_cong_tat;
            if (msg) console.log('[api_binding] ' + msg);
          }).catch(function (err) {
            baoLoi((CAU_HINH.thong_bao || {}).loi
              + '  (' + err.message + ')');
          });
        } else {
          hienThanhSave();
        }
      });
    });
  }

  function batDau() {
    var B = window.__BINDING || {};
    CAU_HINH = B[tenTrang()];
    if (!CAU_HINH) return;            // trang chua noi -- khong lam gi

    // Trang nao co o hien theo nhan thiet bi thi phai co danh sach thiet bi
    // TRUOC khi nap, neu khong se hien ra dia chi IP tho thay vi nhan.
    var canThietBi = Object.keys(CAU_HINH.truong).some(function (t) {
      return moTa(t).hien_thi === 'nhan_thiet_bi';
    });
    (canThietBi ? napThietBi() : Promise.resolve())
      .then(nap)
      .then(theoDoi)
      .then(hienThanhSave);
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', batDau);
  } else {
    batDau();
  }
})();
