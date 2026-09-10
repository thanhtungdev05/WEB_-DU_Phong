/* Trang Wi-Fi ▸ General -- module RIENG, khong dung api_binding.js chung.

   Vi sao tach rieng: trang nay co bon thu ma bang noi chung khong dien ta
   duoc, deu doc tu ma goc index-Bzvp9ziO.js va DO THAT tren thiet bi
   (reference/source/hop_dong_ghi_wifi.json):

     1. Loc SSID theo LOAI cua tab dang mo (Primary / Guest / SmartHome)
     2. Che do GOP: mot bo o nhap ap cho CA HAI ban ghi (2.4G va 5G)
     3. Ghi HAI resource TUAN TU: ssids truoc, easyMesh sau
        (khac System Settings -- ben do song song)
     4. Suy dien WPA23T: che do gop, neu 2.4G la WPA2-Personal va 5G la
        WPA3-Personal-Transition thi hien 5G thanh WPA23T (gia tri gia,
        khong ton tai trong du lieu)

   THAN PATCH -- da do that, khong suy doan:
     PATCH api/v1/data/ssids
       [{id, enabled, name, securityMode, passphrase, broadcastEnabled}, ...]
       Dung SAU khoa nay. KHONG gui radio/type/status/securityModesSupported.
     PATCH api/v1/data/easyMesh
       {enabled: true, ssidTypesConfigurations: [{type, separatedSsid}]}
       enabled luon true (hang so trong ma goc).

   CANH BAO cho nguoi doc sau: doc ma goc thoi thi de ket luan NHAM rang
   che do gop bi loi (o nhap ghi networks.1 nhung Be() doc t[0]). Da do
   that va KHONG co loi -- xem muc _doc_ma_gay_hieu_nham trong
   hop_dong_ghi_wifi.json. */
(function () {
  'use strict';

  var WPA23T = 'WPA23T';
  var WPA2 = 'WPA2-Personal';
  var WPA3T = 'WPA3-Personal-Transition';

  /* Do truc tiep tren thiet bi that 192.168.1.1 ngay 2026-08-18, mo
     dropdown "Security Mode" o ca 2 kien truc (gop bang tan / tach rieng
     tung bang) -- xem reference/source/do_security_mode_wifi.json. Truoc
     day o nay KHONG the bam mo duoc (chua tung noi __noiOChon/__moMenuChon
     -- ghi trong ISSUES.md 2026-08-14).

     CHE DO GOP (Primary, Guest khi chua tach) -- ca 3 tuy chon deu co
     markup THAT day du trong danh sach mo (item). Rieng o DONG (box, luc
     chua bam mo) chi co bang chung cho GIA TRI DANG CHON (WPA3T) -- 2 gia
     tri con lai CHUA CO BANG CHUNG rieng cho o dong, tam dung lai dung
     chu cua item (ghi ro trong ISSUES.md, khong duoc coi la da doi chieu
     pixel). */
  var CHON_SECURITY_GOP = [
    {
      gt: WPA3T, chip: 'Default', phan: ['WPA2/3', '(2.4GHz, 5GHz)'],
      boxCoBangChung: true, boxChip: 'Default',
      boxChu: 'WPA2/WPA3 (2.4GHz & 5GHz)'
    },
    {
      gt: WPA2, chip: null, phan: ['WPA2', '(2.4GHz, 5GHz)'],
      boxCoBangChung: false, boxChip: null, boxChu: 'WPA2 (2.4GHz, 5GHz)'
    },
    {
      gt: WPA23T, chip: null,
      phan: ['WPA2', '(2.4GHz)', 'WPA2/3', '(5GHz)'],
      boxCoBangChung: false, boxChip: null,
      boxChu: 'WPA2 (2.4GHz) WPA2/3 (5GHz)'
    }
  ];

  /* CHE DO TACH -- danh sach CO DINH, DUNG CHUNG cho moi band (2.4GHz,
     5GHz) va moi loai SSID (Primary/Guest/SmartHome) khi da tach rieng.

     Do lan dau 2026-08-14/18 tren tab SmartHome, dai 2.4GHz (5GHz dang
     tat luc do nen khong do duoc) -- xem
     reference/source/do_security_mode_wifi.json.

     [2026-08-18, cung ngay, do lan 2] Dieu khien Chrome MCP do THEM 2
     diem doc lap de kiem tra gia thuyet "danh sach khong phu thuoc
     band/loai": (a) tab PRIMARY, bat "Use separate network" (local,
     KHONG bam Save) -> hop 5GHz hien ra, dang BAT san -> mo dropdown ->
     DANH SACH GIONG HET (2 muc, cung data-value, cung lop css-x3whsd);
     (b) tab GUEST -- phat hien Guest tren thiet bi that DANG o che do
     tach that su (khong phai em tu bat) voi dai 2.4GHz dang BAT -> mo
     dropdown -> DANH SACH GIONG HET. Guest-5GHz va SmartHome-5GHz deu
     dang TAT nen o Select bi khoa (disabled), khong mo duoc -- dung
     hanh vi cu (khoa) cho ca hai, khong phai thieu bang chung.
     Xem reference/source/do_security_mode_wifi_tach_day_du.json.

     => 2 diem do doc lap (khac band, khac loai SSID) deu cho CUNG 1 ket
     qua -- du can cu de bo dieu kien "chi 2.4GHz" va dung CHUNG danh
     sach nay cho moi band/loai o che do tach. Khong con "gia tri gia
     doan" nao trong danh sach nay (chi 2 muc, ca 2 deu da do that o it
     nhat 1 trong 3 diem do).

     O day item va box hien CUNG mot chuoi (da xac nhan bang do that),
     nen dung chung 'chu' cho ca hai, khong can markup rieng nhu che do
     gop. Gia tri "WPA2-Personal" hien nguyen van ma khong dich sang ten
     than thien -- LA HANH VI THAT cua thiet bi, khong phai loi chup
     thieu, giu nguyen. */
  var CHON_SECURITY_TACH = [
    { gt: WPA2, chu: 'WPA2-Personal' },
    { gt: WPA3T, chu: 'WPA2/WPA3 Personal' }
  ];

  /* Tab nao ung voi loai SSID nao -- doc tu ban chup that:
     t0 = PRIMARY NETWORK, t1 = GUEST NETWORK, t2 = SMARTHOME NETWORK.
     Thu tu tab do easyMesh.ssidTypesConfigurations quyet dinh (loc
     uiConfigurable), nhung ban chup da xac nhan dung thu tu nay. */
  var TAB_LOAI = { t0: 'Primary', t1: 'Guest', t2: 'SmartHome' };

  var LOAI = null;         // loai SSID cua trang dang mo
  var SSIDS = null;        // cac ban ghi SSID cua loai do, giu nguyen thu tu
  var EASYMESH = null;
  var thanhSave = null;
  var dangNap = false;
  var dangGhi = false;

  function tenTep() {
    var n = (location.pathname.split('/').pop() || '').replace('.html', '');
    /* GD5: bo tien to 'm_' cua ban DIEN THOAI truoc khi nhan dien trang.
       Neu khong, module nay se khong nhan ra 'm_<route>' va thoat ngay ->
       moi trang dien thoai mat sach phan noi du lieu. Loi da bat duoc
       2026-08-14 khi kiem ban dien thoai cua trang LAN. */
    if (n.indexOf('m_') === 0) n = n.slice(2);
    return n;
  }

  function laTrangNay() {
    return /^wifi__general(__t\d+)?$/.test(tenTep());
  }

  function loaiCuaTrang() {
    var m = /__t(\d+)$/.exec(tenTep());
    return TAB_LOAI['t' + (m ? m[1] : '0')] || 'Primary';
  }

  function timO(ten) {
    return document.querySelector('[name="' + CSS.escape(ten) + '"]');
  }

  function baoLoi(msg) {
    console.error('[wifi_general] ' + msg);
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

  /* Cac chi so networks.N that su co tren trang nay. Che do gop chi co
     mot (chi so cua 5G); che do tach co day du. LOAI TRU khuon mau an
     (#khuon-mau-wifi-tach, xem apDungCheDoHopThiTach) -- neu khong se
     dem nham input CHUA duoc gan vao trang. */
  function cacChiSo() {
    var ds = [];
    document.querySelectorAll('#root [name^="networks."]').forEach(function (el) {
      if (el.closest('#khuon-mau-wifi-tach')) return;
      var m = /^networks\.(\d+)\./.exec(el.getAttribute('name'));
      if (m && ds.indexOf(Number(m[1])) < 0) ds.push(Number(m[1]));
    });
    return ds.sort(function (a, b) { return a - b; });
  }

  /* ============================================================
     TACH HOP 2.4GHz/5GHz cho Primary/Guest -- xem ghi chu chi tiet
     trong dung_trang.py (_chen_khuon_mau_wifi_tach) va ISSUES.md.

     Ban chup goc cua Primary/Guest CHI co 1 hop (che do GOP). Thiet
     bi that doi CLIENT-SIDE (khong tai trang) sang 2 hop rieng khi
     bam "Use separate network". Kien truc file-tinh khong tu
     tao/xoa hop duoc nen phai LAM BANG TAY o day, dung khuon mau da
     nhung san (an, #khuon-mau-wifi-tach) lay tu bang chung that cua
     SmartHome (__t2.html, da xac nhan cau truc giong het qua do
     truc tiep 2026-08-18).

     SmartHome (__t2) KHONG co khuon mau (dung_trang.py chi chen cho
     t0/t1) vi ban chup cua no DA la 2 hop that -- layKhuonMauTach()
     se tra ve false ngay va ham nay se KHONG dong gi den DOM cua
     no, an toan. */
  var oHopGopGoc = null;   // div bao ngoai .MuiAccordion-root goc (che do gop)
  var choHopCha = null;    // Stack cha chua hop
  var hopTach24 = null;    // node da CLONE tu khuon mau, chi gan 1 lan
  var hopTach5 = null;
  var dangHienTach = false;

  function khoiTaoThamChieuHop() {
    if (oHopGopGoc || choHopCha) return;
    var acc = document.querySelector('#root .MuiAccordion-root');
    if (!acc || !acc.parentElement || !acc.parentElement.parentElement) return;
    oHopGopGoc = acc.parentElement;
    choHopCha = oHopGopGoc.parentElement;
  }

  function layKhuonMauTach() {
    if (hopTach24 && hopTach5) return true;
    var m24 = document.getElementById('khuon-mau-wifi-24ghz');
    var m5 = document.getElementById('khuon-mau-wifi-5ghz');
    if (!m24 || !m5 || !m24.firstElementChild || !m5.firstElementChild) return false;
    hopTach24 = m24.firstElementChild.cloneNode(true);
    hopTach5 = m5.firstElementChild.cloneNode(true);
    return true;
  }

  function apDungCheDoHopThiTach(tach) {
    khoiTaoThamChieuHop();
    if (!oHopGopGoc || !choHopCha) return;
    if (tach === dangHienTach) return;
    if (tach) {
      if (!layKhuonMauTach()) return; // trang khong co khuon mau (vd SmartHome) -- khong lam gi
      if (oHopGopGoc.parentNode) oHopGopGoc.parentNode.removeChild(oHopGopGoc);
      choHopCha.appendChild(hopTach24);
      choHopCha.appendChild(hopTach5);
    } else {
      if (hopTach24 && hopTach24.parentNode) hopTach24.parentNode.removeChild(hopTach24);
      if (hopTach5 && hopTach5.parentNode) hopTach5.parentNode.removeChild(hopTach5);
      if (!oHopGopGoc.parentNode) choHopCha.appendChild(oHopGopGoc);
    }
    dangHienTach = tach;
  }

  function tachRieng() {
    if (!EASYMESH || !EASYMESH.ssidTypesConfigurations) return false;
    var c = EASYMESH.ssidTypesConfigurations.filter(function (x) {
      return x.type === LOAI;
    })[0];
    return !!(c && c.separatedSsid);
  }

  var TRUONG = ['enabled', 'name', 'securityMode', 'passphrase',
                'broadcastEnabled'];

  /* O DONG (box) cua che do GOP dung Stack + toi da 2 doan Typography --
     KHONG dung MuiChip nhu trong danh sach mo (da xac nhan bang do that:
     .css-fhxiwe bao ngoai, .css-v6shwc cho tu dau "Default" (neu co),
     .css-1ian9w8 cho phan con lai). */
  function capNhatBoxGop(oHienThi, gt) {
    var m = null;
    for (var i = 0; i < CHON_SECURITY_GOP.length; i++) {
      if (CHON_SECURITY_GOP[i].gt === gt) { m = CHON_SECURITY_GOP[i]; break; }
    }
    if (!m) { oHienThi.textContent = gt || ''; return; }
    var trong = '';
    if (m.boxChip) {
      trong += '<p class="MuiTypography-root MuiTypography-body1 css-v6shwc">'
        + m.boxChip + '</p>';
    }
    trong += '<p class="MuiTypography-root MuiTypography-body1 css-1ian9w8">'
      + m.boxChu + '</p>';
    oHienThi.innerHTML = '<div class="MuiStack-root css-fhxiwe">' + trong + '</div>';
    if (typeof dongBoNhanChon === 'function') dongBoNhanChon(oHienThi, !!gt);
  }

  /* Noi o "Security Mode" -- KHONG dung window.__noiOChon() chung vi che
     do GOP can markup rieng (chip + nhieu dong) o ca item lan box, khac
     moi Select khac trong du an. Che do TACH dung CHUNG 1 danh sach cho
     moi band/loai SSID -- da xac nhan bang 2 diem do doc lap (xem ghi
     chu cua CHON_SECURITY_TACH o tren), khong con gioi han rieng
     2.4GHz nua. */
  function noiSecurityMode(i, s, tach) {
    var oHienThi = document.getElementById(
      'mui-component-select-networks.' + i + '.securityMode');
    var oInput = timO('networks.' + i + '.securityMode');
    if (!oHienThi || !oInput) return;

    if (tach) {
      // __noiOChon tu ve lai chu hien thi = 'chu' cua muc dang chon --
      // dung ca luc nap dau lan sau Cancel vi no doc lai oInput.value moi
      // lan duoc goi (khong can goi rieng ham cap nhat).
      window.__noiOChon(oHienThi, oInput, CHON_SECURITY_TACH, null);
      var mTach = CHON_SECURITY_TACH.filter(function (x) {
        return x.gt === oInput.value;
      })[0];
      if (mTach) oHienThi.textContent = mTach.chu;
      return;
    }

    capNhatBoxGop(oHienThi, oInput.value);
    if (oHienThi.__simDaNoiSecurity) return;
    oHienThi.__simDaNoiSecurity = true;
    oHienThi.style.cursor = 'pointer';
    oHienThi.addEventListener('click', function () {
      window.__moMenuChon(oHienThi, CHON_SECURITY_GOP, oInput.value,
        function (gt) {
          oInput.value = gt;
          capNhatBoxGop(oHienThi, gt);
          oInput.dispatchEvent(new Event('change', { bubbles: true }));
        });
    });
  }

  /* Tach rieng khoi nap() de dung lai duoc ngay khi bam cong tac "Use
     separate network" (khong can doi fetch API -- SSIDS da co san trong
     bo nho tam tu lan nap() gan nhat). */
  function dienDuLieuVaoO(tach) {
    // Suy dien WPA23T -- chi o che do gop. Gia tri gia, khong co trong
    // du lieu; ma goc dat no vao ban ghi 5G de hien thi.
    var hienThi = (SSIDS || []).map(function (s) {
      var b = {};
      Object.keys(s).forEach(function (k) { b[k] = s[k]; });
      return b;
    });
    if (!tach) {
      var g24 = hienThi.filter(function (x) { return x.radio === '2.4G'; })[0];
      var g5 = hienThi.filter(function (x) { return x.radio === '5G'; })[0];
      if (g24 && g5 && g24.securityMode === WPA2 && g5.securityMode === WPA3T) {
        g5.securityMode = WPA23T;
      }
    }

    var da = 0, hong = [];
    cacChiSo().forEach(function (i) {
      var s = hienThi[i];
      if (!s) { hong.push('networks.' + i + ' (khong co SSID tuong ung)'); return; }
      TRUONG.forEach(function (t) {
        var el = timO('networks.' + i + '.' + t);
        if (!el) return;
        if (el.type === 'checkbox') el.checked = !!s[t];
        else {
          el.value = s[t] === undefined || s[t] === null ? '' : String(s[t]);
          if ((t === 'name' || t === 'passphrase') && !window.__daNapLanDau) el.value = ''; // Yêu cầu: rỗng ô textbox
        }
        da++;
      });
      noiSecurityMode(i, s, tach);
    });
    if (window.__simSync) window.__simSync();
    return { so: da, hong: hong };
  }

  function nap() {
    dangNap = true;
    return Promise.all([
      fetch('/api/v1/data/ssids', { cache: 'no-store' })
        .then(function (r) { return r.ok ? r.json() : []; }),
      fetch('/api/v1/data/easyMesh', { cache: 'no-store' })
        .then(function (r) { return r.ok ? r.json() : null; })
    ]).then(function (kq) {
      SSIDS = (kq[0] || []).filter(function (x) { return x.type === LOAI; });
      EASYMESH = kq[1];

      var tach = tachRieng();
      var oSep = timO('useSeparateNetwork');
      if (oSep) oSep.checked = tach;
      apDungCheDoHopThiTach(tach);

      var da = dienDuLieuVaoO(tach);
      window.__daNapLanDau = true;
      var hong = da.hong;
      console.log('[wifi_general] ' + LOAI + ': nap ' + da.so + ' o, '
        + SSIDS.length + ' SSID, che do '
        + (tach ? 'TACH' : 'GOP')
        + (hong.length ? ' | ' + hong.join(', ') : ''));
      hienThanhSave(); // Hien thi nut save do form da bi lam rong
    }).catch(function (e) {
      console.error('[wifi_general] nap that bai:', e);
    }).then(function () {
      setTimeout(function () { dangNap = false; }, 0);
    });
  }

  /* Dung than PATCH ssids -- theo dung ket qua DO THAT. */
  function thanSsids() {
    var tach = !!(timO('useSeparateNetwork') || {}).checked;
    var chiSo = cacChiSo();

    function docBo(i) {
      var b = {};
      TRUONG.forEach(function (t) {
        var el = timO('networks.' + i + '.' + t);
        if (!el) return;
        b[t] = (el.type === 'checkbox') ? el.checked : el.value;
      });
      return b;
    }

    if (tach) {
      // Moi ban ghi lay gia tri RIENG cua no.
      return chiSo.map(function (i) {
        var b = docBo(i);
        b.id = SSIDS[i] && SSIDS[i].id;
        return b;
      }).filter(function (b) { return b.id !== undefined; });
    }

    // Che do GOP: mot bo o nhap ap cho MOI ban ghi cua loai.
    var bo = docBo(chiSo[0]);
    return SSIDS.map(function (s) {
      var che = bo.securityMode;
      // WPA23T la gia tri gia -- tach ra theo bang tan, dung ma goc.
      if (che === WPA23T) che = (s.radio === '2.4G') ? WPA2 : WPA3T;
      var hoTro = (s.securityModesSupported || []).indexOf(che) >= 0;
      return {
        id: s.id,
        enabled: bo.enabled,
        name: bo.name,
        securityMode: hoTro ? che : (s.securityModesSupported || [che])[0],
        passphrase: bo.passphrase,
        broadcastEnabled: bo.broadcastEnabled
      };
    });
  }

  function thanEasyMesh() {
    return {
      enabled: true,        // hang so trong ma goc, khong lay tu form
      ssidTypesConfigurations: [{
        type: LOAI,
        separatedSsid: !!(timO('useSeparateNetwork') || {}).checked
      }]
    };
  }

  function patch(res, than) {
    return fetch('/api/v1/data/' + res, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(than)
    }).then(function (r) {
      if (!r.ok) throw new Error(res + ' -> HTTP ' + r.status);
      // Thiet bi that tra than RONG -- khong doc.
    });
  }

  function luu() {
    if (dangGhi) return Promise.resolve();
    dangGhi = true;
    // TUAN TU: ssids truoc, easyMesh sau. Da do that.
    return patch('ssids', thanSsids())
      .then(function () { return patch('easyMesh', thanEasyMesh()); })
      .then(function () { goThanhSave(); return nap(); })
      .then(function () {
        if (window.parent && window.parent.onSimulatorSave) {
          try { window.parent.onSimulatorSave(window); } catch(e){}
        }
        return new Promise(function (ok) {
          setTimeout(function () { dangGhi = false; ok(); }, 0);
        });
      }, function (e) {
        dangGhi = false;
        throw e;
      });
  }

  /* Hop thoai xac nhan truoc khi luu. Markup that da chup duoc, nam trong
     dialog_data.js duoi khoa 'wifi_save':
       "Before we continue..." / "To apply changes, Wi-Fi will restart and
        Wi-Fi-connected devices will briefly lose connection for a few
        seconds." / nut Cancel va Continue.
     Ham __moHopThoai(ten) tra {dong, oHuy, oTiepTuc} de tu noi su kien. */
  function ganLuu() {
    luu().catch(function (e) {
      baoLoi('Failed to save changes. Please try again later.  ('
        + e.message + ')');
    });
  }

  function hoiTruocKhiLuu() {
    // Không hiện thông báo xác nhận nữa, gọi thẳng hàm lưu cấu hình luôn
    return ganLuu();
  }

  function goThanhSave() {
    if (thanhSave && thanhSave.parentNode) {
      thanhSave.parentNode.removeChild(thanhSave);
    }
    thanhSave = null;
  }

  function hienThanhSave() {
    if (thanhSave) return;
    var neo = document.querySelector('#root form') || document.getElementById('root');
    if (!neo) return;
    var w = document.createElement('div');
    w.className = 'MuiStack-root alternative-layout css-den97n';
    w.setAttribute('data-sim-save', '1');
    /* Cau truc nut da doi chieu truc tiep tren thiet bi that (2026-08-18,
       trang System > User, cung component chia se cho toan bo ung dung --
       xem ISSUES.md/STATUS.md muc "system/user - thanh Save/Cancel"):
       DOM order la SAVE truoc, CANCEL sau (container .css-den97n dung
       flex-direction:row-reverse nen Cancel HIEN ben trai); nut Save co
       ba con span (text, CircularProgress an khi khong bam, TouchRipple);
       nut Cancel chi co text "Cancel" (chu C hoa) + TouchRipple; ca hai
       co tabindex="0" va day du danh sach lop MuiButton-* lap lai. */
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
    w.querySelector('.submit').addEventListener('click', hoiTruocKhiLuu);
    w.querySelector('.cancel').addEventListener('click', function () {
      goThanhSave(); nap();
    });
  }

  function theoDoi() {
    var vung = document.getElementById('root');
    if (!vung || vung.__wifiTheoDoi) return;
    vung.__wifiTheoDoi = true;
    ['input', 'change'].forEach(function (loai) {
      vung.addEventListener(loai, function (e) {
        if (dangNap || dangGhi) return;
        if (thanhSave && thanhSave.contains(e.target)) return;
        var n = e.target && e.target.getAttribute
          && e.target.getAttribute('name');
        if (!n) return;
        if (n !== 'useSeparateNetwork' && n.indexOf('networks.') !== 0) return;
        if (n === 'useSeparateNetwork') {
          // Thiet bi that doi hop 2.4GHz/5GHz NGAY luc bam, truoc ca khi
          // Save -- xem apDungCheDoHopThiTach(). Dung lai SSIDS da co san
          // trong bo nho tam, khong can goi lai API.
          apDungCheDoHopThiTach(!!e.target.checked);
          dienDuLieuVaoO(!!e.target.checked);
        }
        hienThanhSave();
      });
    });
  }

  function batDau() {
    if (!laTrangNay()) return;
    LOAI = loaiCuaTrang();
    nap().then(theoDoi);
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', batDau);
  } else {
    batDau();
  }
})();
