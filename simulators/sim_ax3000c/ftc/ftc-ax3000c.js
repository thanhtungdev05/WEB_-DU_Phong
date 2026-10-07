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
  try {
    if (location.href.indexOf('logout=1') !== -1) {
      sessionStorage.clear();
      localStorage.clear();
    }
  } catch (e) {}

  // 0. Cache-bust chunk-82690506 de buoc trinh duyet tai dung ban moi co el-input thay vi cache cu
  try {
    var origCreateElement = document.createElement;
    document.createElement = function (tagName) {
      var el = origCreateElement.apply(this, arguments);
      if (el && String(tagName).toLowerCase() === 'script') {
        var origSetAttr = el.setAttribute;
        el.setAttribute = function (name, val) {
          if (name === 'src' && typeof val === 'string' && val.indexOf('chunk-82690506') !== -1 && val.indexOf('v=') === -1) {
            val += (val.indexOf('?') === -1 ? '?' : '&') + 'v=input_v3';
          }
          return origSetAttr.call(this, name, val);
        };
        try {
          var desc = Object.getOwnPropertyDescriptor(HTMLScriptElement.prototype, 'src');
          Object.defineProperty(el, 'src', {
            get: function () {
              return (desc && desc.get) ? desc.get.call(this) : this.getAttribute('src');
            },
            set: function (val) {
              if (typeof val === 'string' && val.indexOf('chunk-82690506') !== -1 && val.indexOf('v=') === -1) {
                val += (val.indexOf('?') === -1 ? '?' : '&') + 'v=input_v3';
              }
              if (desc && desc.set) {
                desc.set.call(this, val);
              } else {
                origSetAttr.call(this, 'src', val);
              }
            },
            configurable: true
          });
        } catch (e) {}
      }
      return el;
    };
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
    try {
      if (window.parent && window.parent !== window && typeof window.parent.onSimulatorSave === 'function') {
        window.parent.onSimulatorSave(window);
      }
    } catch (e) {}
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
    } catch (e) {}
  }
  setInterval(ganNhan, 300);
  document.addEventListener('DOMContentLoaded', ganNhan);

  // Vue Router (hash mode) doi route bang pushState -> khong co 'hashchange'; do route dinh ky
  var routeCu = routeHienTai();
  function doRoute() {
    var r = routeHienTai();
    if (r !== routeCu) { routeCu = r; capNhatTheoRoute(); }
  }
  window.addEventListener('hashchange', doRoute);
  window.addEventListener('popstate', doRoute);
  setInterval(doRoute, 250);
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
})();
