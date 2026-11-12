/* FTC — AX3000CV2 firmware 0.5.3: noi giao dien that cua firmware voi bo cham diem Portal.
   Thay cho sim-views.js + sim-pages/state.js cua ban cu (firmware 0.10.2).
   Khong dung vao component Vue, chi nghe /ubus va su kien DOM.

   1. URL co logout=1 (nut Huong dan / Thuc hanh) -> xoa storage de SPA ve trang login
      (giong sim-views.js cu).
   2. document._ftcIsSaved — Portal chi cham "Dat" khi trang da bam Apply thanh cong:
      - mot loi goi ghi (*_set / set) tren /ubus tra ma 0 -> true, nho theo route
        trong sessionStorage (song qua location.reload() cua trang Port Forwarding);
      - nguoi dung sua o nhap / doi lua chon -> false;
      - chuyen route -> lay lai trang thai da nho cua route do. */
(function () {
  // Lọc bỏ các dòng console.log gỡ lỗi nội bộ của firmware gốc để Console sạch đẹp
  try {
    var _origLog = console.log;
    console.log = function () {
      var a = arguments[0];
      if (typeof a === 'string') {
        if (a === 'AP-AX3000CV2' || a === 'router' || a === 'checkOUIStatus oui.ui success') return;
      } else if (a && typeof a === 'object') {
        if (a.mode === 'router') return;
        if (Array.isArray(a) && a.length > 0 && typeof a[0] === 'string' && a[0].indexOf('|') !== -1) return;
      }
      return _origLog.apply(console, arguments);
    };
  } catch (_) {}
  // Khiên chắn ngăn rò rỉ unhandled rejection từ các ubus polling ngầm (như update2 / assoclist)
  try {
    window.addEventListener('unhandledrejection', function (e) {
      try {
        var r = e && e.reason;
        if (r && (r.req || r.error || (r.error && r.error.code))) {
          e.preventDefault();
        }
      } catch (_) {}
    });
  } catch (_) {}

  try {
    var initHash = String(location.hash || '').toLowerCase();
    var isAutoLogin = location.href.indexOf('autologin=1') !== -1;
    var mT = /[?&]_t=([^&#]+)/.exec(location.search || '');
    var curTabT = mT ? mT[1] : '';
    var prevTabT = sessionStorage.getItem('ftc_ax3000c_tab_t') || '';
    var isNewLaunch = !!(curTabT && curTabT !== prevTabT);
    if (
      location.href.indexOf('logout=1') !== -1 || isNewLaunch || (!isAutoLogin && (
      initHash === '' ||
      initHash === '#' ||
      initHash === '#/' ||
      initHash.indexOf('#/login') === 0))
    ) {
      sessionStorage.removeItem('sid');
      if (location.href.indexOf('logout=1') !== -1 || isNewLaunch) {
        sessionStorage.removeItem('ftc_vua_luu');
        sessionStorage.removeItem('ftc_ax3000c_recover');
        for (var ki = sessionStorage.length - 1; ki >= 0; ki--) {
          var ks = sessionStorage.key(ki);
          if (ks && ks.indexOf('ftc_luu:') === 0) sessionStorage.removeItem(ks);
        }
        if (location.href.indexOf('logout=1') !== -1) {
          sessionStorage.clear();
          localStorage.clear();
        }
      }
    }
    if (curTabT) sessionStorage.setItem('ftc_ax3000c_tab_t', curTabT);
  } catch (e) {}

  var TIEN_TO = 'ftc_luu:';

  function routeHienTai() {
    return (location.hash || '').replace(/^#/, '').split('?')[0];
  }

  function capNhatTheoRoute() {
    var r = routeHienTai();
    var daLuu = false;
    try { daLuu = sessionStorage.getItem(TIEN_TO + r) === '1'; } catch (e) {}
    document._ftcIsSaved = daLuu;
  }

  function laLoiGoiGhi(than) {
    try {
      var ds = Array.isArray(than) ? than : [than];
      return ds.some(function (t) {
        var p = (t && t.params) || [];
        var ham = String(p[2] || '');
        return p[1] !== 'session' && (ham === 'set' || /_set$/.test(ham));
      });
    } catch (e) { return false; }
  }

  function thanhCong(chu) {
    try {
      var kq = JSON.parse(chu);
      var ds = Array.isArray(kq) ? kq : [kq];
      return ds.length > 0 && ds.every(function (k) {
        return k && Array.isArray(k.result) && k.result[0] === 0 &&
          !(k.result[1] && k.result[1].status === false);
      });
    } catch (e) { return false; }
  }

  function baoPortalDaLuu() {
    var notified = false;
    try {
      if (window.parent && window.parent !== window && typeof window.parent.onSimulatorSave === 'function') {
        window.parent.onSimulatorSave(window);
        notified = true;
      }
    } catch (e) {}
    if (!notified) {
      try {
        if (window.top && window.top !== window) {
          window.top.postMessage({ type: 'FTC_SAVE_SUCCESS', source: 'ax3000c' }, '*');
        }
      } catch (e) {}
    }
  }

  function daLuuXong() {
    try {
      sessionStorage.setItem(TIEN_TO + routeHienTai(), '1');
      sessionStorage.setItem('ftc_vua_luu', String(Date.now()));
    } catch (e) {}
    document._ftcIsSaved = true;
    baoPortalDaLuu();
  }

  // Firmware 0.5.3 TU TAI LAI TRANG sau khi Apply o mot so trang (vd Port Forwarding:
  // location.reload()). Document moi -> Portal tuong la trang chua bam luu va dat lai
  // _hasClickedSaveInGuide = false (khoa nut Nop bai). Ban cu khong tai lai nen khong vuong.
  // Tai lai ngay sau mot lan luu thanh cong -> danh dau _hasFtcSavedRouter (Portal bo qua
  // buoc dat lai) va bao lai Portal "da luu" khi trang da ve xong.
  try {
    var vuaLuu = +(sessionStorage.getItem('ftc_vua_luu') || 0);
    if (vuaLuu && Date.now() - vuaLuu < 20000) {
      sessionStorage.removeItem('ftc_vua_luu');
      document._hasFtcSavedRouter = true;
      setTimeout(baoPortalDaLuu, 2500);
    }
  } catch (e) {}

  var moGoc = XMLHttpRequest.prototype.open;
  var guiGoc = XMLHttpRequest.prototype.send;
  XMLHttpRequest.prototype.open = function (method, url) {
    this._ftcUrl = String(url || '');
    return moGoc.apply(this, arguments);
  };
  XMLHttpRequest.prototype.send = function (body) {
    var xhr = this;
    if (/\/ubus(\?|$)/.test(xhr._ftcUrl) && typeof body === 'string') {
      var than = null;
      try { than = JSON.parse(body); } catch (e) {}
      if (than && laLoiGoiGhi(than)) {
        xhr.addEventListener('load', function () {
          if (xhr.status === 200 && thanhCong(xhr.responseText)) daLuuXong();
        });
      }
    }
    return guiGoc.apply(this, arguments);
  };

  function boLuu() { document._ftcIsSaved = false; }
  document.addEventListener('input', boLuu, true);
  document.addEventListener('change', boLuu, true);
  // el-select / el-switch cua Element UI khong phat 'change' tren DOM khi chon
  document.addEventListener('click', function (e) {
    var t = e.target;
    if (t && t.closest && t.closest('.el-select-dropdown__item, .el-switch, .el-radio, .el-checkbox')) boLuu();
  }, true);

  // Bat loi "thao tac thua" cua Portal (app.js captureBeforeEdit) nho gia tri GOC cua tung o ngay
  // lan dau hoc vien cham vao o do. Voi radio thi no nho RIENG tung nut: bam Enable roi bam lai
  // Disable -> luc cham Disable thi nut nay dang tat -> Portal nho nham "goc = tat" -> bao sai du
  // da tra ve nhu cu (anh Huynn gap o Bai 1, 2026-09-28). Ban cu dung o chon nen khong gap.
  // Sua: cham vao BAT KY nut nao cua mot nhom radio thi chup goc cho CA NHOM, truoc Portal
  // (listener nay dang ky truoc nen chay truoc; Portal chi ghi khi o chua co gia tri goc).
  function chupGocNhomRadio(e) {
    if (!e.isTrusted) return;
    var t = e.target, nut = t && t.closest && t.closest('.el-radio');
    if (!nut) return;
    var nhom = nut.closest('.el-radio-group') || nut.closest('.el-form-item');
    if (!nhom) return;
    var goc = document._ftcOriginalValues || (document._ftcOriginalValues = {});
    nhom.querySelectorAll('input[type="radio"]').forEach(function (r) {
      if (!r.dataset.ftcId) r.dataset.ftcId = 'ftc_' + Math.random().toString(36).substr(2, 9);
      if (goc[r.dataset.ftcId] === undefined) goc[r.dataset.ftcId] = r.checked;
    });
  }
  document.addEventListener('mousedown', chupGocNhomRadio, true);
  document.addEventListener('focusin', chupGocNhomRadio, true);

  // 3. Gan nhan theo CHU hien tren giao dien de bai hoc (tooltip + cham diem) chon dung o bang
  //    CSS thuong — bo cham diem dung querySelector nen khong hieu :contains("PPP Username").
  //      .el-form-item            -> data-ftc-nhan="PPP Username"
  //      menu trai                -> data-ftc-menu="WAN"
  //      nut trong vung noi dung  -> data-ftc-nut="Apply"
  //      o trong bang (el-table)  -> data-ftc-cot="External port" (theo tieu de cot)
  //      cong tac co chu kem      -> data-ftc-cong-tac="Use separate SSID"
  function chu(e) { return (e && e.textContent || '').replace(/\s+/g, ' ').trim(); }
  function datNhan(e, ten, gt) { if (e.getAttribute(ten) !== gt) e.setAttribute(ten, gt); }
  function ganNhan() {
    try {
      document.querySelectorAll('.el-form-item').forEach(function (fi) {
        var l = fi.querySelector('.el-form-item__label');
        if (l) datNhan(fi, 'data-ftc-nhan', chu(l).replace(/^\*\s*/, '').replace(/:$/, ''));
      });
      document.querySelectorAll('.el-submenu__title, .el-menu-item').forEach(function (m) {
        datNhan(m, 'data-ftc-menu', chu(m));
      });
      document.querySelectorAll('.el-main button').forEach(function (b) { datNhan(b, 'data-ftc-nut', chu(b)); });
      // cong tac co chu ngay tren no (vd "Use separate SSID" o trang Wi-Fi) -> data-ftc-cong-tac
      document.querySelectorAll('.el-switch').forEach(function (s) {
        var l = s.querySelector('.el-switch__label');
        if (l && chu(l)) datNhan(s, 'data-ftc-cong-tac', chu(l));
      });
      document.querySelectorAll('.el-table').forEach(function (t) {
        var dau = Array.prototype.map.call(t.querySelectorAll('.el-table__header th'), chu);
        t.querySelectorAll('.el-table__body tr').forEach(function (tr) {
          Array.prototype.forEach.call(tr.children, function (td, i) { if (dau[i]) datNhan(td, 'data-ftc-cot', dau[i]); });
        });
      });
      // Xoa triet de gia tri mac dinh 'fpt' trong o PPP Username va PPP Password tren trang WAN
      var dsO = document.querySelectorAll('.el-form-item[data-ftc-nhan="PPP Username"] input, .el-form-item[data-ftc-nhan="PPP Password"] input');
      dsO.forEach(function (inp) {
        if (!inp._ftcBound) {
          inp._ftcBound = true;
          inp.addEventListener('input', function (ev) { if (ev.isTrusted) inp._ftcUserModified = true; });
        }
        if (!inp._ftcUserModified && inp !== document.activeElement && inp.value === 'fpt') {
          inp.value = '';
          inp.dispatchEvent(new Event('input', { bubbles: true }));
        }
      });
    } catch (e) {}
  }

  // Vue Router (hash mode) doi route bang pushState -> khong co 'hashchange'; do route dinh ky
  var routeCu = routeHienTai();
  function doRoute() {
    var r = routeHienTai();
    if (r !== routeCu) { routeCu = r; capNhatTheoRoute(); }
  }
  window.addEventListener('hashchange', doRoute);
  window.addEventListener('popstate', doRoute);
  // Bat pushState/replaceState de doi route duoc nhan NGAY (khong can do dinh ky 250ms).
  ['pushState', 'replaceState'].forEach(function (ten) {
    try {
      var gocHam = history[ten];
      if (typeof gocHam !== 'function') return;
      history[ten] = function () {
        var kq = gocHam.apply(this, arguments);
        try { doRoute(); } catch (e) {}
        return kq;
      };
    } catch (e) {}
  });
  capNhatTheoRoute();

  // 4. Triet tieu hoan toan man hinh cho / loading mask "Currently in agent mode" va khong de do tre
  function trietTieuLoadingTre() {
    try {
      var masks = document.querySelectorAll('.el-loading-mask');
      masks.forEach(function (m) {
        var txt = (m.textContent || '').toLowerCase();
        if (txt.indexOf('agent mode') !== -1 || txt.indexOf('currently in agent') !== -1 || txt.indexOf('parameters') !== -1) {
          m.style.setProperty('display', 'none', 'important');
          m.style.setProperty('pointer-events', 'none', 'important');
          if (m.parentNode) m.parentNode.removeChild(m);
        }
      });
      // Neu dang o route Wi-Fi, mo khoa Vue loading ngay lap tuc
      if (routeHienTai().indexOf('/network/wifi') !== -1) {
        var pane = document.querySelector('#pane-hostssid') || document.querySelector('.el-main');
        if (pane && pane.__vue__ && pane.__vue__.loading) {
          pane.__vue__.loading = false;
        }
      }
    } catch (e) {}
  }
  document.addEventListener('DOMContentLoaded', trietTieuLoadingTre);

  // 5. Bo lap lich DUY NHAT (2026-11-12) thay cho 3 vong setInterval 250-300ms (ganNhan, doRoute,
  //    trietTieuLoadingTre) chay lien tuc ca khi trang dung yen -> giat tren may yeu.
  //    - DOM doi (Vue ve lai, mo trang, hien mat na loading) -> quet sau QUET_TRE_MS (gom nhieu thay doi).
  //    - Du phong moi QUET_DU_PHONG_MS, tam dung khi tab bi an.
  //    - Chi theo doi childList/characterData: datNhan chi ghi thuoc tinh -> khong tu kich hoat lai.
  var QUET_TRE_MS = 120;
  var QUET_DU_PHONG_MS = 1500;
  var henQuet = 0;
  function quetNgay() {
    if (henQuet) { clearTimeout(henQuet); henQuet = 0; }
    doRoute();
    trietTieuLoadingTre();
    ganNhan();
    anThongBaoNeuDaVe();
  }
  function lichQuet() {
    if (!henQuet) henQuet = setTimeout(quetNgay, QUET_TRE_MS);
  }
  try {
    if (typeof MutationObserver === 'function') {
      new MutationObserver(lichQuet).observe(document.documentElement, {
        childList: true, subtree: true, characterData: true
      });
    }
  } catch (e) {}
  setInterval(function () { if (!document.hidden) quetNgay(); }, QUET_DU_PHONG_MS);
  document.addEventListener('visibilitychange', function () { if (!document.hidden) lichQuet(); });
  document.addEventListener('DOMContentLoaded', quetNgay);

  // 6. Tu phuc hoi khi #app bi trang (mang chap chon luc nap bundle/chunk).
  //    Truoc day: chi 1 lan, va location.replace(... + '#/login') khi URL chi khac phan hash thi
  //    KHONG tai lai trang -> co the dung trang mai. Nay:
  //    - Vue CHUA mount sau 3.5s (bundle loi) -> tai lai that (location.reload).
  //    - Vue DA mount nhung route chua ve (chunk dang tai tren mang yeu) -> cho them toi 15s, hien
  //      thong bao "Dang tai..." thay cho man trang, roi moi tai lai.
  //    - Toi da SO_LAN_CUU_TOI_DA lan moi phien; het luot -> bao KTV kiem tra mang, khong lap vo han.
  var KHOA_CUU = 'ftc_ax3000c_recover';
  var SO_LAN_CUU_TOI_DA = 3;
  var MOC_KIEM_MS = [3500, 8000, 15000];
  var ID_THONG_BAO = 'ftc-ax3000c-dang-tai';
  function appDaVe() {
    var appEl = document.getElementById('app');
    return !!(appEl && appEl.children.length > 0);
  }
  function hienThongBao(noiDung) {
    try {
      var o = document.getElementById(ID_THONG_BAO);
      if (!o) {
        o = document.createElement('div');
        o.id = ID_THONG_BAO;
        o.setAttribute('role', 'status');
        o.setAttribute('aria-live', 'polite');
        o.style.cssText = 'position:fixed;top:0;left:0;right:0;bottom:0;display:flex;align-items:center;' +
          'justify-content:center;padding:16px;text-align:center;font:14px/1.5 Arial,sans-serif;' +
          'color:#444;background:#fff;z-index:2147483647';
        (document.body || document.documentElement).appendChild(o);
      }
      o.textContent = noiDung;
    } catch (e) {}
  }
  function anThongBaoNeuDaVe() {
    if (!appDaVe()) return;
    var o = document.getElementById(ID_THONG_BAO);
    if (o && o.parentNode) o.parentNode.removeChild(o);
    try { sessionStorage.removeItem(KHOA_CUU); } catch (e) {}
  }
  function taiLaiDeCuu() {
    var n = 0;
    try { n = parseInt(sessionStorage.getItem(KHOA_CUU) || '0', 10) || 0; } catch (e) {}
    if (n >= SO_LAN_CUU_TOI_DA) {
      hienThongBao('Không tải được giao diện thiết bị. Vui lòng kiểm tra kết nối mạng rồi bấm F5.');
      return;
    }
    hienThongBao('Đang tải lại giao diện thiết bị…');
    try {
      sessionStorage.setItem(KHOA_CUU, String(n + 1));
      sessionStorage.removeItem('sid');
      history.replaceState(null, '', location.pathname + location.search + '#/login');
    } catch (e) {}
    location.reload();
  }
  function kiemTraTrang(lan) {
    try {
      if (appDaVe()) { anThongBaoNeuDaVe(); return; }
      var appEl = document.getElementById('app');
      var daMount = !!(appEl && appEl.__vue__);
      if (daMount && lan < MOC_KIEM_MS.length - 1) {
        hienThongBao('Đang tải giao diện thiết bị…');
        setTimeout(function () { kiemTraTrang(lan + 1); }, MOC_KIEM_MS[lan + 1] - MOC_KIEM_MS[lan]);
        return;
      }
      taiLaiDeCuu();
    } catch (e) {}
  }
  window.addEventListener('load', function () {
    setTimeout(function () { kiemTraTrang(0); }, MOC_KIEM_MS[0]);
  });
})();
