/* Noi Wi-Fi >> General (ca 3 tab: Primary/Guest/SmartHome) vao config_store
   that qua API /api/v1/data/ssids -- dung DUNG dinh dang da xac nhan tu
   reference/har/wifi_general_apply.har (2026-08-10).

   File nay dung CHUNG cho 4 trang tinh: wifi__general.html, __t0 (Primary),
   __t1 (Guest), __t2 (SmartHome) -- moi file chi render DUY NHAT 1 tabpanel
   dang active (khop voi cach MUI lazy-mount tab that: tabpanel khong active
   khong co form ben trong, xac nhan bang cach doi chieu do dai noi dung 3
   tabpanel trong tung file reference/source/*.html). Script tu nhan biet
   dang o tab nao qua thuoc tinh 'hidden' tren <div role="tabpanel">.

   Anh xa 2 CHE DO da xac nhan tu ban chup that (reference/source/
   wifi__general__t1.html, __t2.html) va tu spec/seed_wifi.json:
   - Primary, Guest: CHE DO GOP (useSeparateNetwork=false) -- chi 1 bo field
     networks.1.* dai dien ca 2 radio, PATCH ca 2 id (2.4G+5G) cung gia tri.
   - SmartHome: CHE DO TACH (useSeparateNetwork=true) -- 2 bo field rieng
     networks.0.* (2.4G) va networks.1.* (5G), PATCH rieng tung id.

   CHUA wire: doi trang thai o cong tac "Use separate network" (useSeparateNetwork)
   -- khong co HAR nao ghi lai luc bam doi cong tac nay nen KHONG doan hanh vi,
   xem ISSUES.md. Gia tri checked/unchecked hien tai la nguyen ban chup that
   (tinh, khong dong bo lai tu config_store).

   LUU Y nut Save/cancel: markup that chi xac nhan chup duoc tren tab Primary
   (reference/source/wifi_general_co_nut_save.html). Ap dung lai y nguyen cho
   Guest/SmartHome vi cung 1 component form-action-button dung chung toan app
   (thay class giong nhau o moi noi da chup) -- CHUA co anh chup rieng tung
   tab luc dang hien thanh Save de xac nhan 100%, xem ISSUES.md. */
(function () {
  var ID = {
    Primary: { mode: 'gop', ids24: '04:d6:88:8d:52:61', ids5: '04:d6:88:8d:52:69' },
    Guest: { mode: 'gop', ids24: '04:d6:88:8d:52:62', ids5: '04:d6:88:8d:52:6a' },
    SmartHome: { mode: 'tach', ids24: '04:d6:88:8d:52:63', ids5: '04:d6:88:8d:52:6b' }
  };

  function tabDangHien() {
    var el = document.querySelector('[role="tabpanel"]:not([hidden])');
    if (!el) return null;
    var m = /^tabpanel-(.+)$/.exec(el.id || '');
    return m ? m[1] : null;
  }

  function $(name) { return document.querySelector('[name="' + name + '"]'); }

  function napMotBo(i, ds, id) {
    var s = ds.find(function (x) { return x.id === id; });
    if (!s) return;
    var f;
    if ((f = $('networks.' + i + '.name'))) f.value = window.__daNapLanDau ? s.name : '';
    if ((f = $('networks.' + i + '.passphrase'))) f.value = window.__daNapLanDau ? s.passphrase : '';
    if ((f = $('networks.' + i + '.securityMode'))) f.value = s.securityMode;
    var cb;
    if ((cb = $('networks.' + i + '.broadcastEnabled'))) cb.checked = !!s.broadcastEnabled;
    if ((cb = $('networks.' + i + '.enabled'))) cb.checked = !!s.enabled;
  }

  function napTuStore() {
    var tab = tabDangHien();
    var cfg = tab && ID[tab];
    if (!cfg) { console.warn('[wifi_api] khong nhan dien duoc tab dang hien'); return; }
    fetch('/api/v1/data/ssids').then(function (r) { return r.json(); }).then(function (ds) {
      if (cfg.mode === 'gop') {
        napMotBo(1, ds, cfg.ids24);
      } else {
        napMotBo(0, ds, cfg.ids24);
        napMotBo(1, ds, cfg.ids5);
      }
      window.__daNapLanDau = true;
      if (window.__simSync) window.__simSync();
      console.log('[wifi_api] da nap gia tri that tu config_store, tab=' + tab);
      themNutThat(); // Hien nut save ngay tu dau do field da bi lam rong
    }).catch(function (e) { console.error('[wifi_api] loi nap GET ssids', e); });
  }

  function docMotBo(i) {
    return {
      name: $('networks.' + i + '.name') ? $('networks.' + i + '.name').value : '',
      passphrase: $('networks.' + i + '.passphrase') ? $('networks.' + i + '.passphrase').value : '',
      securityMode: $('networks.' + i + '.securityMode') ? $('networks.' + i + '.securityMode').value : undefined,
      broadcastEnabled: $('networks.' + i + '.broadcastEnabled') ? $('networks.' + i + '.broadcastEnabled').checked : true,
      enabled: $('networks.' + i + '.enabled') ? $('networks.' + i + '.enabled').checked : true
    };
  }

  /* Hop thoai xac nhan TRUOC khi ap dung -- markup + CSS lay nguyen tu
     thiet bi that 2026-08-10 (reference/source/dialog_confirm_full.html,
     css_dialog_confirm.css). Tren thiet bi that, bam Save o trang Wi-Fi
     LUON hien hop thoai nay truoc; chi khi bam Continue moi thuc su goi
     PATCH. Bam CANCEL thi dong hop thoai, thanh Save VAN CON (thay doi
     chua bi huy) -- da kiem chung tren thiet bi that. */
  function hoiXacNhan(khiDongY) {
    var d = document.createElement('div');
    d.setAttribute('role', 'presentation');
    d.className = 'MuiDialog-root MuiModal-root css-126xj0f';
    d.innerHTML =
      '<div aria-hidden="true" class="MuiBackdrop-root MuiModal-backdrop css-919eu4" style="opacity: 1; transition: opacity 225ms cubic-bezier(0.4, 0, 0.2, 1);"></div>' +
      '<div tabindex="0" data-testid="sentinelStart"></div>' +
      '<div class="MuiDialog-container MuiDialog-scrollPaper css-16u656j" role="presentation" tabindex="-1" style="opacity: 1; transition: opacity 225ms cubic-bezier(0.4, 0, 0.2, 1);">' +
      '<div class="MuiPaper-root MuiPaper-elevation MuiPaper-rounded MuiPaper-elevation24 MuiDialog-paper MuiDialog-paperScrollPaper MuiDialog-paperWidthSm MuiDialog-paperFullWidth css-1um5ogo" role="dialog" aria-labelledby="dlg-xacnhan">' +
      '<h2 class="MuiTypography-root MuiTypography-h6 MuiDialogTitle-root css-1hftikr" id="dlg-xacnhan">Before we continue...</h2>' +
      '<div class="MuiDialogContent-root css-19i32em"><p class="MuiTypography-root MuiDialogContentText-root MuiTypography-body1 MuiDialogContentText-root css-1vl1q01">To apply changes, Wi-Fi will restart and Wi-Fi-connected devices will briefly lose connection for a few seconds.</p></div>' +
      '<div class="MuiDialogActions-root MuiDialogActions-spacing css-kvke90">' +
      '<button class="MuiButtonBase-root MuiButton-root MuiButton-text MuiButton-textPrimary MuiButton-sizeMedium MuiButton-textSizeMedium MuiButton-colorPrimary MuiButton-root MuiButton-text MuiButton-textPrimary MuiButton-sizeMedium MuiButton-textSizeMedium MuiButton-colorPrimary css-bbmok2 dlg-huy" tabindex="0" type="button">CANCEL<span class="MuiTouchRipple-root css-w0pj6f"></span></button>' +
      '<button class="MuiButtonBase-root MuiButton-root MuiButton-text MuiButton-textPrimary MuiButton-sizeMedium MuiButton-textSizeMedium MuiButton-colorPrimary MuiButton-root MuiButton-text MuiButton-textPrimary MuiButton-sizeMedium MuiButton-textSizeMedium MuiButton-colorPrimary css-bbmok2 dlg-tieptuc" tabindex="0" type="button">Continue<span class="MuiTouchRipple-root css-w0pj6f"></span></button>' +
      '</div></div></div><div tabindex="0" data-testid="sentinelEnd"></div>';
    document.body.appendChild(d);
    function dong() { if (d.parentNode) d.parentNode.removeChild(d); }
    d.querySelector('.dlg-huy').addEventListener('click', dong);
    d.querySelector('.dlg-tieptuc').addEventListener('click', function () {
      dong();
      khiDongY();
    });
  }

  function luu() {
    luuThat();
  }

  function luuThat() {
    var tab = tabDangHien();
    var cfg = tab && ID[tab];
    if (!cfg) return;
    var body;
    if (cfg.mode === 'gop') {
      var v = docMotBo(1);
      body = [
        { id: cfg.ids24, name: v.name, passphrase: v.passphrase, broadcastEnabled: v.broadcastEnabled, enabled: v.enabled, securityMode: v.securityMode, radio: '2.4G' },
        { id: cfg.ids5, name: v.name, passphrase: v.passphrase, broadcastEnabled: v.broadcastEnabled, enabled: v.enabled, securityMode: v.securityMode, radio: '5G' }
      ];
    } else {
      var v24 = docMotBo(0), v5 = docMotBo(1);
      body = [
        { id: cfg.ids24, name: v24.name, passphrase: v24.passphrase, broadcastEnabled: v24.broadcastEnabled, enabled: v24.enabled, securityMode: v24.securityMode, radio: '2.4G' },
        { id: cfg.ids5, name: v5.name, passphrase: v5.passphrase, broadcastEnabled: v5.broadcastEnabled, enabled: v5.enabled, securityMode: v5.securityMode, radio: '5G' }
      ];
    }
    fetch('/api/v1/data/ssids', {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body)
    }).then(function (r) { return r.json(); }).then(function () {
      goThanhNut();      // luu xong -> khong con thay doi -> thanh nut bien mat
      alert('Da luu vao config_store that. Sang trang khac roi quay lai se thay dung gia tri moi.');
      if (window.parent && window.parent.onSimulatorSave) {
        try { window.parent.onSimulatorSave(window); } catch(e){}
      }
    }).catch(function (e) {
      alert('Loi khi luu: ' + e);
    });
  }

  /* Markup THAT, chup tu reference/source/wifi_general_co_nut_save.html
     (2026-08-10) -- luc form dang co thay doi chua Apply nen thanh nut
     Save/cancel that hien ra. Giu nguyen class/cau truc goc, chi gan
     them addEventListener.

     CSS that cua khoi nay nam trong /css_nut_save.css -- lay truc tiep tu
     CSSOM thiet bi that 2026-08-10 (Emotion sinh CSS luc chay nen cac lop
     css-den97n / css-g28vy7 / css-rrm59m / css-1acoyi9 / css-1i7o5xq
     KHONG co trong emotion.css da chup truoc do; thieu chung thi nut
     hien ra tho va vong xoay loading quay mai vi thieu dung quy tac
     .css-1i7o5xq{display:none}).

     HANH VI THAT: thanh Save/cancel CHI ton tai trong DOM khi form co
     thay doi chua luu; luc khong co thay doi thi React khong render no
     (da kiem chung: doi 1 o -> nut xuat hien; bam cancel -> nut bien mat
     khoi DOM). Nen o day cung chi chen khi co thay doi, va go han di khi
     Save/cancel xong -- khong dung CSS an/hien. */
  var _thanh = null;

  function goThanhNut() {
    if (_thanh && _thanh.parentNode) _thanh.parentNode.removeChild(_thanh);
    _thanh = null;
  }

  function themNutThat() {
    if (_thanh) return;
    var form = document.querySelector('form.css-1w5zf2q');
    if (!form) return;
    var wrap = document.createElement('div');
    wrap.className = 'MuiStack-root alternative-layout css-den97n';
    wrap.innerHTML =
      '<button class="MuiButtonBase-root MuiButton-root MuiButton-contained MuiButton-containedPrimary MuiButton-sizeMedium MuiButton-containedSizeMedium MuiButton-colorPrimary MuiButton-root MuiButton-contained MuiButton-containedPrimary MuiButton-sizeMedium MuiButton-containedSizeMedium MuiButton-colorPrimary formActionButton submit alternative-layout alternative-layout--submit css-g28vy7" tabindex="0" type="button">' +
      '<span class="MuiBox-root css-rrm59m">Save</span>' +
      '<span class="MuiCircularProgress-root MuiCircularProgress-indeterminate MuiCircularProgress-colorPrimary css-1i7o5xq" role="progressbar" style="width: 16px; height: 16px;"><svg class="MuiCircularProgress-svg css-13o7eu2" viewBox="22 22 44 44"><circle class="MuiCircularProgress-circle MuiCircularProgress-circleIndeterminate css-14891ef" cx="44" cy="44" r="20.2" fill="none" stroke-width="3.6"></circle></svg></span>' +
      '<span class="MuiTouchRipple-root css-w0pj6f"></span></button>' +
      '<button class="MuiButtonBase-root MuiButton-root MuiButton-text MuiButton-textPrimary MuiButton-sizeMedium MuiButton-textSizeMedium MuiButton-colorPrimary MuiButton-root MuiButton-text MuiButton-textPrimary MuiButton-sizeMedium MuiButton-textSizeMedium MuiButton-colorPrimary formActionButton cancel alternative-layout css-1acoyi9" tabindex="0" type="button">cancel<span class="MuiTouchRipple-root css-w0pj6f"></span></button>';
    form.appendChild(wrap);
    _thanh = wrap;
    wrap.querySelector('.submit').addEventListener('click', luu);
    wrap.querySelector('.cancel').addEventListener('click', function () {
      napTuStore();      // nap lai gia tri dang luu -> form het "co thay doi"
      goThanhNut();
    });
  }

  /* Theo doi thay doi form de hien/an thanh nut giong thiet bi that. */
  function theoDoiThayDoi() {
    var form = document.querySelector('form.css-1w5zf2q');
    if (!form) return;
    ['input', 'change'].forEach(function (loai) {
      form.addEventListener(loai, function (e) {
        if (_thanh && _thanh.contains(e.target)) return;   // bam chinh nut
        themNutThat();
      });
    });
  }

  function init() {
    napTuStore();
    theoDoiThayDoi();
  }
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', init);
  else init();
})();
