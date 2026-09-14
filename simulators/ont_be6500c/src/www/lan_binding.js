/* Trang Advanced >> LAN. BA tab: General (usage=LAN, __t0/trang goc),
   Guest LAN (usage=Guest, __t2), Reserved IP (bang_binding.js lo rieng,
   __t1 -- o day chi dong bo hien/an nut tab thu 3, khong dong nap form).
   Module RIENG, khong dung api_binding.js chung -- trang nay co bien doi
   HINH DANG du lieu qua lai (API phang <-> form long nhau) va GHI HAI
   resource nhu system__general/wifi__general.

   ================= HOP DONG DA DOC TU MA GOC (GD4 phan 3, 2026-08-13) =====
   Xem chi tiet: spec/pages/advanced__lan.json muc _doc_tay_gd4_2026-08-13
   (doc tay ham Ue()/Fs()/Us() trong index-ZQ6T7f31.js).

   GET  interfaces/configurations -> loc ban ghi usage===USAGE ('LAN' hoac
        'Guest' -- CUNG mot cau truc du lieu, xac nhan doi chieu 2026-08-18)
   GET  dhcp/servers              -> loc ban ghi interfaceId===<id o tren>
   PATCH interfaces/configurations [{...ban_ghi_goc, ipv4Settings:{ipAddress,
         mask}, ipv6Settings:{enabled, [neu enabled] protocol:'dhcpv6',
         prefix, slaacEnabled, ulaPrefix}}]
   PATCH dhcp/servers [{...ban_ghi_goc, ipv4Settings:{enabled, autoDnsEnabled:
         true, dnsServers:[], [neu enabled] startAddress,endAddress,
         leaseTime(giay)}, ipv6Settings:{enabled, [neu ipv6.enabled&&day&&
         mode==='Stateful'] startSuffix,endSuffix,autoDnsEnabled:true,
         dnsServers:[]}}]
   LUON PATCH ca hai resource (ma goc co toi uu bo qua neu khong doi o
   interfaces/configurations, nhung config_store.ghi() la merge idempotent
   nen PATCH lai khong hai gi -- don gian hoa giong system__general).

   Truong DNS (autoDnsEnabled/dnsServers) TON TAI trong defaultValues/schema
   nhung KHONG CO O NHAP tren giao dien (doi chieu HTML that: khong co JSX
   nao render, chi co chu "Dynamic DNS" cua menu). => luon co dinh
   autoDnsEnabled:true, dnsServers:[] -- giong truong CLIENT tu them cua
   Static Routing (ipVersion).

   ============ Guest LAN (do that 2026-08-18) ============
   anh Huynn bat "Wi-Fi Guest Network" (trang wifi__general tab Guest) roi
   chup lai trang nay: reference/source/advanced__lan__t2.html +
   reference/har/advanced__lan_guest_bat.har. Xac nhan: tab thu 3 "Guest
   LAN" xuat hien, DUNG VI TRI GIUA General va Reserved IP; du lieu field
   GIONG HET cau truc tab General (chi khac gia tri: 192.168.5.0/24,
   DHCP4 .100-.249 thue 4h, DHCP6 suffix 2..3e8, IPv6 Stateful/PD Auto).
   Ban ghi interfaces/configurations tuong ung co id='guest', usage='Guest',
   enabled=true luc chup.

   CHUA CO BANG CHUNG ve co che GHI: khong thay request PATCH nao toi
   interfaces/configurations trong HAR luc bat Wi-Fi Guest Network (chi co
   PATCH toi 'ssids'/'easyMesh') -- 2 anh chup truoc/sau chi cho thay
   TRANG THAI cuoi cung trung khop, khong chung minh duoc co che. Vi vay o
   day CHI dong bo HIEN/AN nut tab thu 3 theo gia tri DOC duoc qua GET
   interfaces/configurations (khong bia PATCH lien ket giua 2 trang). Da
   ghi ISSUES.md, hoi anh Huynn neu can chup them HAR luc bam nut Wi-Fi
   Guest de xac dinh co che that. */
(function () {
  'use strict';

  function tenTep() {
    var n = (location.pathname.split('/').pop() || '').replace('.html', '');
    /* GD5: bo tien to 'm_' cua ban DIEN THOAI truoc khi nhan dien trang.
       Neu khong, module nay se khong nhan ra 'm_<route>' va thoat ngay ->
       moi trang dien thoai mat sach phan noi du lieu. Loi da bat duoc
       2026-08-14 khi kiem ban dien thoai cua trang LAN. */
    if (n.indexOf('m_') === 0) n = n.slice(2);
    return n;
  }
  var TRANG = tenTep();
  var LA_TAB_GUEST = (TRANG === 'advanced__lan__t2');
  function laTrangForm() {
    return TRANG === 'advanced__lan' || TRANG === 'advanced__lan__t0' || LA_TAB_GUEST;
  }
  var LA_TAB_RESERVED = (TRANG === 'advanced__lan__t1');
  if (!laTrangForm() && !LA_TAB_RESERVED) return;

  // usage/tabpanel thay doi theo tab -- moi thu khac (ten truong, quy tac
  // an/hien, hop dong PATCH) GIONG HET giua General va Guest LAN.
  var USAGE = LA_TAB_GUEST ? 'Guest' : 'LAN';
  var TABPANEL_SEL = LA_TAB_GUEST ? '[id="tabpanel-Guest LAN"]' : '#tabpanel-General';

  var MASK_HOP_LE = ['255.255.255.0', '255.255.0.0']; // je -- doc tu ma goc

  var LAN = null;       // ban ghi interfaces/configurations usage=LAN
  var DHCP = null;      // ban ghi dhcp/servers tuong ung
  var dangNap = false;
  var dangGhi = false;
  var thanhSave = null;

  function o(ten) { return document.querySelector('[name="' + CSS.escape(ten) + '"]'); }
  function giaTri(ten) { var el = o(ten); return el ? el.value : ''; }
  function datGiaTri(ten, v) { var el = o(ten); if (el) el.value = (v === undefined || v === null) ? '' : String(v); }
  function batTat(ten) { var el = o(ten); return !!(el && el.checked); }
  function datBatTat(ten, v) { var el = o(ten); if (el) el.checked = !!v; }

  function baoLoi(msg) {
    console.error('[lan_binding] ' + msg);
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

  /* ------------------------------------------------------- MUI Select Mode
     Dung markup menu THAT (chup 2026-08-13, xem
     reference/source/do_nhanh_an_wan.json) qua window.__noiOChon() trong
     dialog_data.js. Truoc day o day dung hop chon tu che 'sim-chon-mode'
     vi chua chup duoc popup that -- da bo.

     CHU Y ve co danh dau: window.__noiOChon dung '__simDaNoi', KHONG dung
     '__wired' -- vi interact.js co wireSelects() chay TRUOC va da gan
     '__wired=true' cho MOI '.MuiSelect-select'. Trung ten co se lam o chon
     khong bam duoc (loi da bat duoc 2026-08-13). */
  function wireModeSelect() {
    var input = o('ipv6Settings.mode');
    var hienThi = document.getElementById('mui-component-select-ipv6Settings.mode');
    if (!input || !hienThi) return;
    window.__noiOChon(hienThi, input, [
      { gt: 'Stateful', chu: 'Stateful' },
      { gt: 'Stateless', chu: 'Stateless' }
    ], function () { apDungAnHien(); });
  }

  /* ------------------------------------------------------- Subnet Mask
     Autocomplete, KHONG co thuoc tinh name (giong o Mask cua Static
     Routing IPv4 -- xem bang_binding.js). Chi 1 Autocomplete tren trang. */
  function oMask() { return document.querySelector('.MuiAutocomplete-input'); }

  /* ------------------------------------------------------- PD Mode radio
     name="radio", gia tri 'auto'/'manual' -- interact.js (da sua GD4 phan
     2) khong con ghi de gia tri radio nen doc/ghi truc tiep an toan. */
  function pdMode() {
    var r = document.querySelector('input[name="radio"]:checked');
    return r ? r.value : 'auto';
  }
  function datPdMode(v) {
    var r = document.querySelector('input[name="radio"][value="' + v + '"]');
    if (r) r.checked = true;
  }

  /* Truong "Custom Delegated IPv6-Prefix" CHI xuat hien khi PD Mode=manual.
     GD4 phan 3 (2026-08-13) khong co bang chung (luc chup dang Automatic)
     nen phai SUY DIEN bang cach clone cau truc o "ULA IPv6-Prefix" cung
     trang. Da DO THAT tren thiet bi 192.168.1.1 ngay 2026-08-18 (chan moi
     ghi, bam radio Manual de React tu ve, khong bao gio bam Save -- xem
     reference/source/do_prefix_thu_cong_lan.json): name, nhan, thu tu
     trong Stack (SAU radio group), va margin-left 40px deu DUNG nhu da
     dung truoc do. Diem khac DUY NHAT voi ban clone: FormControl that
     mang lop rieng "css-9jxy54" (chi khac o ULA "css-5p9558" o margin-
     left, moi thu khac giong het) -- doi ten lop cho dung, khong doi
     hien thi vi margin da gan qua inline-style. */
  function dungOPrefixThuCong() {
    var el = o('ipv6Settings.pdMode.prefix');
    if (el) return el;
    var mauCha = document.querySelector('input[name="ipv6Settings.ula.prefix"]');
    if (!mauCha) return null;
    var khoiMau = mauCha.closest('.MuiFormControl-root');
    if (!khoiMau) return null;
    var khoiMoi = khoiMau.cloneNode(true);
    khoiMoi.classList.remove('css-5p9558');
    khoiMoi.classList.add('css-9jxy54');
    khoiMoi.classList.add('sim-pdmode-prefix-khoi');
    khoiMoi.style.marginLeft = '40px';
    var inp = khoiMoi.querySelector('input');
    inp.name = 'ipv6Settings.pdMode.prefix';
    inp.id = 'sim-pdmode-prefix';
    inp.value = '';
    inp.removeAttribute('disabled');
    var nhan = khoiMoi.querySelector('label');
    if (nhan) { nhan.textContent = 'Custom Delegated IPv6-Prefix'; nhan.setAttribute('for', inp.id); }
    var legend = khoiMoi.querySelector('legend span');
    if (legend) legend.textContent = 'Custom Delegated IPv6-Prefix';
    // Ma goc: prefix la SIBLING cua radio group, CUNG mot Stack spacing:1
    // (khong phai o ngoai) -- e.jsxs(A,{spacing:1,children:[radioGroup,
    // manual&&prefixField]}). Chen VAO TRONG chaRadio, khong ra ngoai.
    var khoiRadio = document.querySelector('input[name="radio"]');
    var chaRadio = khoiRadio && khoiRadio.closest('.MuiStack-root');
    if (chaRadio) chaRadio.appendChild(khoiMoi);
    return inp;
  }
  function xoaOPrefixThuCongNeuCo() {
    var khoi = document.querySelector('.sim-pdmode-prefix-khoi');
    if (khoi) khoi.remove();
  }

  /* ------------------------------------------------------- an/hien theo
     trang thai (mo phong dung cay JSX cua Fs()/Us() da doc tay). */
  function khoiCuaNhan(chuoi) {
    var els = document.querySelectorAll('h6.MuiTypography-subtitle1, h6.MuiTypography-root');
    for (var i = 0; i < els.length; i++) {
      if (els[i].textContent.trim() === chuoi) return els[i].closest('.MuiStack-root');
    }
    return null;
  }

  function apDungAnHien() {
    var ipv6Bat = batTat('ipv6Settings.enabled');
    var modeInput = o('ipv6Settings.mode');
    var modeGiaTri = modeInput ? modeInput.value : 'Stateful';
    var pd = pdMode();

    // Khoi "Mode" (ngay sau switch Enable LAN IPv6, trong cung khoi
    // "IPv6 Basics") -- an ca khoi select khi ipv6 tat.
    var khoiMode = document.getElementById('mui-component-select-ipv6Settings.mode');
    var khoiModeForm = khoiMode && khoiMode.closest('.MuiFormControl-root');
    if (khoiModeForm) khoiModeForm.style.display = ipv6Bat ? '' : 'none';

    var khoiPD = khoiCuaNhan('PD Mode');
    if (khoiPD) khoiPD.style.display = ipv6Bat ? '' : 'none';
    var khoiULA = khoiCuaNhan('ULA');
    if (khoiULA) khoiULA.style.display = ipv6Bat ? '' : 'none';
    var khoiDhcp6 = khoiCuaNhan('DHCP Server');
    // Co 2 khoi ten "DHCP Server" (IPv4 va IPv6) -- khoi IPv6 la khoi CUOI.
    var tatCaDhcp = [];
    document.querySelectorAll('h6').forEach(function (h) {
      if (h.textContent.trim() === 'DHCP Server') tatCaDhcp.push(h.closest('.MuiStack-root'));
    });
    var khoiDhcpV6 = tatCaDhcp[1];
    if (khoiDhcpV6) khoiDhcpV6.style.display = (ipv6Bat && modeGiaTri === 'Stateful') ? '' : 'none';

    // ULA prefix: khong an, chi khoa nhap khi ula.enabled=false.
    var oUla = o('ipv6Settings.ula.prefix');
    if (oUla) oUla.disabled = !batTat('ipv6Settings.ula.enabled');

    // PD Mode manual -> them/xoa o nhap Custom Delegated IPv6-Prefix.
    if (ipv6Bat && pd === 'manual') dungOPrefixThuCong();
    else xoaOPrefixThuCongNeuCo();

    // IPv4 DHCP Server: khoa Start/End/Lease khi tat (khong an khoi).
    var dhcp4Bat = batTat('ipv4Settings.dhcp.enabled');
    ['ipv4Settings.dhcp.startAddress', 'ipv4Settings.dhcp.endAddress',
      'ipv4Settings.dhcp.leaseTime.days', 'ipv4Settings.dhcp.leaseTime.hours'
    ].forEach(function (n) { var el = o(n); if (el) el.disabled = !dhcp4Bat; });

    // IPv6 DHCP Server: khoa Start/End Suffix khi tat.
    var dhcp6Bat = batTat('ipv6Settings.dhcp.enabled');
    ['ipv6Settings.dhcp.startSuffix', 'ipv6Settings.dhcp.endSuffix']
      .forEach(function (n) { var el = o(n); if (el) el.disabled = !dhcp6Bat; });
  }

  /* ------------------------------------------------------------- nap du lieu */
  function nap() {
    dangNap = true;
    return Promise.all([
      fetch('/api/v1/data/interfaces/configurations', { cache: 'no-store' })
        .then(function (r) { return r.ok ? r.json() : []; }),
      fetch('/api/v1/data/dhcp/servers', { cache: 'no-store' })
        .then(function (r) { return r.ok ? r.json() : []; })
    ]).then(function (kq) {
      var ifaces = kq[0] || [], dhcps = kq[1] || [];
      dongBoTabGuest(coBanGhiGuestBat(ifaces));
      LAN = ifaces.filter(function (x) { return x.usage === USAGE; })[0] || null;
      DHCP = LAN ? (dhcps.filter(function (x) { return x.interfaceId === LAN.id; })[0] || null) : null;
      if (!LAN || !DHCP) { baoLoi('Khong tim thay ban ghi ' + USAGE + ' trong kho cau hinh.'); return; }

      datGiaTri('ipv4Settings.ipAddress', LAN.ipv4Settings && LAN.ipv4Settings.ipAddress);
      var maskEl = oMask();
      if (maskEl) maskEl.value = (LAN.ipv4Settings && LAN.ipv4Settings.mask) || '';
      datBatTat('ipv4Settings.dhcp.enabled', DHCP.ipv4Settings && DHCP.ipv4Settings.enabled);
      datGiaTri('ipv4Settings.dhcp.startAddress', DHCP.ipv4Settings && DHCP.ipv4Settings.startAddress);
      datGiaTri('ipv4Settings.dhcp.endAddress', DHCP.ipv4Settings && DHCP.ipv4Settings.endAddress);
      var giayThue = (DHCP.ipv4Settings && DHCP.ipv4Settings.leaseTime) || 0;
      datGiaTri('ipv4Settings.dhcp.leaseTime.days', Math.floor(giayThue / 86400));
      datGiaTri('ipv4Settings.dhcp.leaseTime.hours', Math.floor((giayThue % 86400) / 3600));

      var ipv6 = LAN.ipv6Settings || {};
      datBatTat('ipv6Settings.enabled', ipv6.enabled);
      var modeInput = o('ipv6Settings.mode');
      var modeGiaTri = ipv6.slaacEnabled ? 'Stateless' : 'Stateful';
      if (modeInput) modeInput.value = modeGiaTri;
      var modeHienThi = document.getElementById('mui-component-select-ipv6Settings.mode');
      if (modeHienThi) modeHienThi.textContent = modeGiaTri;
      datPdMode(ipv6.prefix ? 'manual' : 'auto');
      if (ipv6.prefix) { var pf = dungOPrefixThuCong(); if (pf) pf.value = ipv6.prefix; }
      datBatTat('ipv6Settings.ula.enabled', !!ipv6.ulaPrefix);
      datGiaTri('ipv6Settings.ula.prefix', ipv6.ulaPrefix);

      var dhcp6 = DHCP.ipv6Settings || {};
      datBatTat('ipv6Settings.dhcp.enabled', dhcp6.enabled);
      datGiaTri('ipv6Settings.dhcp.startSuffix', dhcp6.startSuffix);
      datGiaTri('ipv6Settings.dhcp.endSuffix', dhcp6.endSuffix);

      if (window.__simSync) window.__simSync();
      apDungAnHien();
      console.log('[lan_binding] da nap LAN ' + LAN.id + ' / DHCP ' + DHCP.id);
    }).catch(function (e) {
      console.error('[lan_binding] nap that bai:', e);
    }).then(function () {
      setTimeout(function () { dangNap = false; }, 0);
    });
  }

  /* ------------------------------------------------------------- ghi (Save) */
  function thanInterfaces() {
    var ban = JSON.parse(JSON.stringify(LAN));
    ban.ipv4Settings = ban.ipv4Settings || {};
    ban.ipv4Settings.ipAddress = giaTri('ipv4Settings.ipAddress');
    var maskEl = oMask();
    ban.ipv4Settings.mask = maskEl ? maskEl.value : ban.ipv4Settings.mask;

    var ipv6Bat = batTat('ipv6Settings.enabled');
    ban.ipv6Settings = ban.ipv6Settings || {};
    ban.ipv6Settings.enabled = ipv6Bat;
    if (ipv6Bat) {
      var pd = pdMode();
      var modeInput = o('ipv6Settings.mode');
      var modeGiaTri = modeInput ? modeInput.value : 'Stateful';
      ban.ipv6Settings.protocol = 'dhcpv6';
      ban.ipv6Settings.prefix = (pd === 'manual') ? giaTri('ipv6Settings.pdMode.prefix') : '';
      ban.ipv6Settings.slaacEnabled = (modeGiaTri === 'Stateless');
      ban.ipv6Settings.ulaPrefix = batTat('ipv6Settings.ula.enabled') ? giaTri('ipv6Settings.ula.prefix') : '';
    }
    return ban;
  }

  function thanDhcp() {
    var ban = JSON.parse(JSON.stringify(DHCP));
    var dhcp4Bat = batTat('ipv4Settings.dhcp.enabled');
    ban.ipv4Settings = ban.ipv4Settings || {};
    ban.ipv4Settings.enabled = dhcp4Bat;
    // Truong DNS khong co o nhap tren giao dien -- LUON co dinh, doc tu ma goc.
    ban.ipv4Settings.autoDnsEnabled = true;
    ban.ipv4Settings.dnsServers = [];
    if (dhcp4Bat) {
      ban.ipv4Settings.startAddress = giaTri('ipv4Settings.dhcp.startAddress');
      ban.ipv4Settings.endAddress = giaTri('ipv4Settings.dhcp.endAddress');
      var ngay = Number(giaTri('ipv4Settings.dhcp.leaseTime.days')) || 0;
      var gio = Number(giaTri('ipv4Settings.dhcp.leaseTime.hours')) || 0;
      ban.ipv4Settings.leaseTime = gio * 3600 + ngay * 86400;
    }

    var ipv6Bat = batTat('ipv6Settings.enabled');
    var dhcp6Bat = batTat('ipv6Settings.dhcp.enabled');
    var modeInput = o('ipv6Settings.mode');
    var modeGiaTri = modeInput ? modeInput.value : 'Stateful';
    ban.ipv6Settings = ban.ipv6Settings || {};
    ban.ipv6Settings.enabled = dhcp6Bat;
    if (ipv6Bat && dhcp6Bat && modeGiaTri === 'Stateful') {
      ban.ipv6Settings.startSuffix = giaTri('ipv6Settings.dhcp.startSuffix');
      ban.ipv6Settings.endSuffix = giaTri('ipv6Settings.dhcp.endSuffix');
      ban.ipv6Settings.autoDnsEnabled = true;
      ban.ipv6Settings.dnsServers = [];
    }
    return ban;
  }

  function patch(res, than) {
    return fetch('/api/v1/data/' + res, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify([than])
    }).then(function (r) {
      if (!r.ok) throw new Error(res + ' -> HTTP ' + r.status);
    });
  }

  function luu() {
    if (dangGhi) return Promise.resolve();
    if (!LAN || !DHCP) return Promise.resolve();
    var maskEl = oMask();
    if (MASK_HOP_LE.indexOf(maskEl ? maskEl.value : '') < 0) {
      baoLoi('Subnet Mask khong hop le. Chon 255.255.255.0 hoac 255.255.0.0.');
      return Promise.resolve();
    }
    dangGhi = true;
    return patch('interfaces/configurations', thanInterfaces())
      .then(function () { return patch('dhcp/servers', thanDhcp()); })
      .then(function () { return nap(); })
      .then(function () {
        return new Promise(function (ok) { setTimeout(function () { dangGhi = false; ok(); }, 0); });
      }, function (e) {
        dangGhi = false;
        baoLoi('Changes saving failed, please try again.  (' + e.message + ')');
      });
  }

  /* ------------------------------------------------- thanh Save/Cancel
     GD6 (2026-08-14), SUA LAI ket luan sai cua phien 2026-08-13 (ghi
     "LUON HIEN... display:flex ca hai, ngay khi form CHUA doi gi").
     Kiem lai truc tiep tren thiet bi that (192.168.1.1, dieu khien
     Chrome): trang LAN nap len KHONG co thanh Save/Cancel; bam tat
     "Enable DHCP Server" thi thanh moi hien ra. Phep do cu nhieu kha
     nang khong that su o trang thai pristine (co the da lo sua truong
     nao do truoc khi doc getComputedStyle) -- CUNG mot loai nham lan da
     gap o hop thoai Add New (GD6 nhom Network) va o WAN (xem chu thich
     wan_binding.js). Vi tri/cau truc/class DOM giu nguyen (dung dung
     bang chung da do), chi bo phan "khi nao hien" la sai.

     Vi tri that: con CUOI cua <form class="css-1w5zf2q"> trong
     #tabpanel-General, ngay sau khoi noi dung .css-1rp9elp. Lop
     .css-den97n da co san position:fixed;bottom:0. Nut Save that co
     them vong xoay CircularProgress (an khi khong bam) -- giu nguyen
     cho dung cau truc.

     Cancel = reset ve gia tri da nap (ma goc: Y=()=>N(g), tuc reset(values)),
     KHONG phai an thanh di. */
  function hienThanhSave() {
    if (thanhSave) return;
    // Dung DUNG cho ma goc chen: con cuoi cua form trong tabpanel dang mo.
    // Tab Guest LAN CHUA co bang chung rieng cho markup thanh Save (luc
    // chup form con sach) -- dung LAI nguyen mau da do that o tab General
    // (cung form.css-1w5zf2q, cung co che react-hook-form isDirty dung
    // chung toan bo ung dung, xem dau file).
    var neo = document.querySelector(TABPANEL_SEL + ' form.css-1w5zf2q')
      || document.querySelector('form.css-1w5zf2q')
      || document.getElementById('root');
    if (!neo) return;
    var w = document.createElement('div');
    w.className = 'MuiStack-root alternative-layout css-den97n';
    w.setAttribute('data-sim-save', '1');
    w.innerHTML =
      '<button type="button" class="MuiButtonBase-root MuiButton-root '
      + 'MuiButton-contained MuiButton-containedPrimary MuiButton-sizeMedium '
      + 'MuiButton-containedSizeMedium MuiButton-colorPrimary MuiButton-root '
      + 'MuiButton-contained MuiButton-containedPrimary MuiButton-sizeMedium '
      + 'MuiButton-containedSizeMedium MuiButton-colorPrimary '
      + 'formActionButton submit alternative-layout '
      + 'alternative-layout--submit css-g28vy7" tabindex="0">'
      + '<span class="MuiBox-root css-rrm59m">Save</span>'
      + '<span class="MuiCircularProgress-root MuiCircularProgress-indeterminate '
      + 'MuiCircularProgress-colorPrimary css-1i7o5xq" role="progressbar" '
      + 'style="width: 16px; height: 16px;"><svg class="MuiCircularProgress-svg '
      + 'css-13o7eu2" viewBox="22 22 44 44"><circle class="MuiCircularProgress-circle '
      + 'MuiCircularProgress-circleIndeterminate css-14891ef" cx="44" cy="44" '
      + 'r="20.2" fill="none" stroke-width="3.6"></circle></svg></span>'
      + '<span class="MuiTouchRipple-root css-w0pj6f"></span></button>'
      + '<button type="button" class="MuiButtonBase-root MuiButton-root '
      + 'MuiButton-text MuiButton-textPrimary MuiButton-sizeMedium '
      + 'MuiButton-textSizeMedium MuiButton-colorPrimary MuiButton-root '
      + 'MuiButton-text MuiButton-textPrimary MuiButton-sizeMedium '
      + 'MuiButton-textSizeMedium MuiButton-colorPrimary '
      + 'formActionButton cancel alternative-layout css-1acoyi9" tabindex="0">'
      + 'Cancel<span class="MuiTouchRipple-root css-w0pj6f"></span></button>';
    neo.appendChild(w);
    thanhSave = w;
    w.querySelector('.submit').addEventListener('click', function () { luu(); });
    w.querySelector('.cancel').addEventListener('click', function () { nap(); });
  }

  function theoDoi() {
    var vung = document.getElementById('root');
    if (!vung || vung.__lanTheoDoi) return;
    vung.__lanTheoDoi = true;
    ['input', 'change', 'click'].forEach(function (loai) {
      vung.addEventListener(loai, function (e) {
        if (dangNap || dangGhi) return;
        if (thanhSave && thanhSave.contains(e.target)) return;
        hienThanhSave();
        apDungAnHien();
      });
    });
  }

  /* ------------------------------------------- Tab thu 3 "Guest LAN"
     Xem giai thich day du o dau file. Chay tren CA BA trang cua nhom LAN
     (General/Guest LAN/Reserved IP) de thanh tab luon nhat quan du vao
     tu trang nao. */
  function coBanGhiGuestBat(danhSachIface) {
    var ban = (danhSachIface || []).filter(function (x) { return x.usage === 'Guest'; })[0];
    return !!(ban && ban.enabled);
  }

  function taoNutTabGuest() {
    var b = document.createElement('button');
    b.className = 'MuiButtonBase-root MuiTab-root MuiTab-textColorPrimary css-1t4qb0c';
    b.type = 'button';
    b.setAttribute('role', 'tab');
    b.setAttribute('aria-selected', 'false');
    b.id = 'Guest LAN';
    b.tabIndex = -1;
    b.innerHTML = 'Guest LAN<span class="MuiTouchRipple-root css-w0pj6f"></span>';
    return b;
  }

  /* Sao lai RIENG logic dieu huong cua nav.js (go()/giuThamSo()) cho nut
     tu chen nay -- KHONG dung chung duoc vi hai ham do la closure noi bo
     cua nav.js, khong lo ra window (da doc lai nav.js 2026-08-18, xem
     ISSUES.md). Neu ban dien thoai chua co bien the nay (m_advanced__lan
     __t2.html chua co bang chung) thi bao giong het cach nav.js.wireTabs()
     bao cho tab chua chup, khong lam gi khac. */
  function diToiTrangLan(bienThe) {
    var f = bienThe;
    if (window.__LA_DIEN_THOAI) {
      var dsDT = window.__PAGES_DT || [];
      if (dsDT.indexOf(f) < 0) {
        alert('Tab "Guest LAN" chua duoc chup tu thiet bi that (ban dien thoai).');
        return;
      }
      f = 'm_' + f;
    }
    var q = (new URLSearchParams(location.search)).get('dt');
    var ts = (q === '0' || q === '1') ? ('?dt=' + q) : '';
    location.href = '/' + f + '.html' + ts;
  }

  function dongBoTabGuest(coGuest) {
    var tablist = document.querySelector('[role="tablist"]');
    if (!tablist) return;
    var nutGuest = document.getElementById('Guest LAN');
    if (coGuest && !nutGuest) {
      nutGuest = taoNutTabGuest();
      var nutReserved = document.getElementById('Reserved IP');
      if (nutReserved) tablist.insertBefore(nutGuest, nutReserved);
      else tablist.appendChild(nutGuest);
      nutGuest.style.cursor = 'pointer';
      nutGuest.addEventListener('click', function (e) {
        e.stopPropagation();
        diToiTrangLan('advanced__lan__t2');
      });
      if (LA_TAB_GUEST) {
        nutGuest.setAttribute('aria-selected', 'true');
        nutGuest.tabIndex = 0;
        nutGuest.classList.add('Mui-selected');
      }
    } else if (!coGuest && nutGuest && !LA_TAB_GUEST) {
      // Khong tu xoa nut khi DANG DUNG tren chinh trang Guest LAN (vao
      // truc tiep bang URL) -- tranh mo cut trang dang xem.
      nutGuest.remove();
    }
  }

  function batDau() {
    if (laTrangForm()) {
      wireModeSelect();
      nap().then(function () {
        theoDoi();
        hienThanhSave();
      });
    } else {
      // Reserved IP: bang_binding.js da lo form cua trang nay, o day CHI
      // dong bo hien/an nut tab thu 3.
      fetch('/api/v1/data/interfaces/configurations', { cache: 'no-store' })
        .then(function (r) { return r.ok ? r.json() : []; })
        .then(function (ds) { dongBoTabGuest(coBanGhiGuestBat(ds)); })
        .catch(function (e) { console.error('[lan_binding] dong bo tab Guest LAN that bai:', e); });
    }
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', batDau);
  } else {
    batDau();
  }
})();
