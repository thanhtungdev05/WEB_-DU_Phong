/* Trang Advanced >> WAN. Module RIENG.

   ============ HOP DONG DA DOC TU MA GOC + DO TREN THIET BI THAT ============
   Dac ta day du: spec/pages/advanced__wan.json muc _doc_tay_gd4_2026-08-13
   (doc tay index-D_2ztGgf.js: Ht/He/ht/St/xt/Ne).
   Markup cac nhanh an: reference/source/do_nhanh_an_wan.json (chup that
   2026-08-13, co cai bo chan ghi, KHONG bam Save, thiet bi ve nguyen trang).

   Diem KHAC han cac trang truoc:
     - MOT tab gom NHIEU ban ghi interfaces/configurations (wan + wan6),
       ghi ca hai trong MOT lan PATCH (khong phai hai lan nhu system__general).
     - ipVersion (4/6/10) KHONG co trong du lieu -- SUY RA tu enabled cua
       hai ban ghi, va khi ghi thi quyet dinh ban ghi nao enabled.
     - Bon nhanh giao dien khong co trong ban chup tinh, phai tu dung tu
       markup that da chup rieng (xem MAU_* duoi day).

   Tab: ma goc chi them tab neu co ban ghi mang usage do. Kho hien tai chi
   co usage='Internet' -> dung 1 tab, khop ban chup.

   Tab 'Backup': CHAN KY THUAT VINH VIEN (xac nhan 2026-08-18, xem
   ISSUES.md). Da doc ky ca chunk trang WAN lan chunk Home Overview --
   CA HAI deu CHI hien tab/panel Backup NEU DA CO SAN ban ghi
   usage='Backup', khong co nut/hanh dong nao trong toan bo giao dien
   web de TAO ban ghi do. Khong phai chua lam -- giong home/topology,
   home/wizard. */
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
  if (tenTep() !== 'advanced__wan') return;

  var USAGE = 'Internet';       // tab duy nhat co bang chung
  var BAN_GHI = [];             // cac ban ghi interfaces/configurations cua usage nay
  var G4 = null, G6 = null;     // ban ghi co ipv4Settings / ipv6Settings
  var dangNap = false, dangGhi = false, thanhSave = null;

  function o(ten) { return document.querySelector('[name="' + CSS.escape(ten) + '"]'); }
  function giaTri(ten) { var el = o(ten); return el ? el.value : ''; }
  function datGiaTri(ten, v) {
    var el = o(ten);
    if (el) el.value = (v === undefined || v === null) ? '' : String(v);
  }
  function batTat(ten) { var el = o(ten); return !!(el && el.checked); }
  function datBatTat(ten, v) { var el = o(ten); if (el) el.checked = !!v; }

  function baoLoi(msg) {
    console.error('[wan_binding] ' + msg);
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

  function esc(s) {
    return String(s == null ? '' : s).replace(/[&<>"]/g, function (c) {
      return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c];
    });
  }

  /* ================== MAU MARKUP -- CHEP TU BAN CHUP THAT ==================
     Xem do_nhanh_an_wan.json. Chi thay ID/nhan/ten, khong doi lop nao. */

  var LOP_NHAN_RONG = 'MuiFormLabel-root MuiInputLabel-root MuiInputLabel-formControl '
    + 'MuiInputLabel-animated MuiInputLabel-sizeMedium MuiInputLabel-outlined '
    + 'MuiFormLabel-colorPrimary MuiInputLabel-root MuiInputLabel-formControl '
    + 'MuiInputLabel-animated MuiInputLabel-sizeMedium MuiInputLabel-outlined css-4mi22k';
  var LOP_NHAN_CO_CHU = 'MuiFormLabel-root MuiInputLabel-root MuiInputLabel-formControl '
    + 'MuiInputLabel-animated MuiInputLabel-shrink MuiInputLabel-sizeMedium '
    + 'MuiInputLabel-outlined MuiFormLabel-colorPrimary MuiFormLabel-filled '
    + 'MuiInputLabel-root MuiInputLabel-formControl MuiInputLabel-animated '
    + 'MuiInputLabel-shrink MuiInputLabel-sizeMedium MuiInputLabel-outlined css-1sqw6hd';

  /* O van ban chuan (mau: ipv4Settings.pppoe.username da chup nguyen van) */
  function oVanBan(ten, nhan, giaTriBanDau, goiY) {
    var id = 'sim-' + ten.replace(/\W/g, '-');
    var coChu = !!giaTriBanDau;
    return '<div class="MuiFormControl-root MuiTextField-root css-5p9558">'
      + '<label class="' + (coChu ? LOP_NHAN_CO_CHU : LOP_NHAN_RONG) + '" data-shrink="'
      + (coChu ? 'true' : 'false') + '" for="' + id + '" id="' + id + '-label">'
      + esc(nhan) + '</label>'
      + '<div class="MuiInputBase-root MuiOutlinedInput-root MuiInputBase-colorPrimary '
      + 'MuiInputBase-formControl css-j9o3g1">'
      + '<input aria-invalid="false"' + (goiY ? ' aria-describedby="' + id + '-helper-text"' : '')
      + ' id="' + id + '" name="' + esc(ten) + '" type="text" '
      + 'class="MuiInputBase-input MuiOutlinedInput-input css-1x5jdmq" value="'
      + esc(giaTriBanDau || '') + '">'
      + '<fieldset aria-hidden="true" class="MuiOutlinedInput-notchedOutline css-igs3ac">'
      + '<legend class="' + (coChu ? 'css-14lo706' : 'css-yjsfm1') + '"><span>'
      + esc(nhan) + '</span></legend></fieldset></div>'
      + (goiY
        ? '<p class="MuiFormHelperText-root MuiFormHelperText-sizeMedium '
          + 'MuiFormHelperText-contained css-1mqlc81" id="' + id + '-helper-text">'
          + '<span class="normal css-3wogm7">' + esc(goiY) + '</span></p>'
        : '')
      + '</div>';
  }

  /* O VLAN ID (mau chup nguyen van -- khac o thuong: co lop manualInputs,
     css-136zr73, type=number, nhan luon o trang thai shrink) */
  function oVlanId(giaTriBanDau) {
    var id = 'sim-vlan-id';
    return '<div class="MuiFormControl-root MuiTextField-root manualInputs css-136zr73">'
      + '<label class="' + LOP_NHAN_CO_CHU + '" data-shrink="true" for="' + id
      + '" id="' + id + '-label">VLAN ID</label>'
      + '<div class="MuiInputBase-root MuiOutlinedInput-root MuiInputBase-colorPrimary '
      + 'MuiInputBase-formControl css-j9o3g1">'
      + '<input aria-invalid="false" aria-describedby="' + id + '-helper-text" id="' + id
      + '" name="vlan.id" type="number" max="4094" min="1" maxlength="4" '
      + 'class="MuiInputBase-input MuiOutlinedInput-input css-1x5jdmq" value="'
      + esc(giaTriBanDau == null ? '0' : giaTriBanDau) + '">'
      + '<fieldset aria-hidden="true" class="MuiOutlinedInput-notchedOutline css-igs3ac">'
      + '<legend class="css-14lo706"><span>VLAN ID</span></legend></fieldset></div>'
      + '<p class="MuiFormHelperText-root MuiFormHelperText-sizeMedium '
      + 'MuiFormHelperText-contained MuiFormHelperText-filled css-1mqlc81" id="'
      + id + '-helper-text"><span class="normal css-3wogm7">Range: 1 to 4094.</span></p>'
      + '</div>';
  }

  /* Nhom radio Automatic/Manual -- NHAN BAN tu nhom co san tren trang
     (nhom DNS cua IPv6). Da do that: nhom DNS IPv4, DNS IPv6 va VLAN
     dung Y HET mot cau truc (css-i44wyl / css-1h7anqn). */
  function nhomRadioAutoManual(nhomMau, danhDau) {
    var moi = nhomMau.cloneNode(true);
    moi.setAttribute('data-sim-nhom', danhDau);
    moi.querySelectorAll('input').forEach(function (inp) {
      inp.removeAttribute('id');
      inp.checked = false;
    });
    moi.querySelectorAll('.PrivateSwitchBase-root').forEach(function (b) {
      while (b.classList.contains('Mui-checked')) b.classList.remove('Mui-checked');
    });
    return moi;
  }

  function nhomMauAutoManual() {
    var ds = [].slice.call(document.querySelectorAll(
      '.MuiFormGroup-root.MuiRadioGroup-root:not(.MuiRadioGroup-row)'));
    return ds.filter(function (g) {
      var v = [].slice.call(g.querySelectorAll('input')).map(function (i) { return i.value; });
      return v.length === 2 && v[0] === 'auto' && v[1] === 'manual';
    })[0] || null;
  }

  /* ---------------------------------------------- dinh vi cac khoi tren trang */

  function theTheoNhan(chu) {
    var hs = [].slice.call(document.querySelectorAll('#root h6'));
    for (var i = 0; i < hs.length; i++) {
      if (hs[i].textContent.trim() === chu) return hs[i];
    }
    return null;
  }
  /* Stack NGAY BEN TRONG chua tieu de (vd stack cua rieng muc "DNS"). */
  function khoiTheoNhan(chu) {
    var h = theTheoNhan(chu);
    return h ? h.closest('.MuiStack-root') : null;
  }
  /* "The" (card) bao ca mot khoi lon -- component ge trong ma goc la mot
     <div class="css-..."> KHONG phai MuiStack. Vd the cua IPv6 gom CA muc
     "IPv6 Connection Type" LAN muc "DNS" cua no.
     Phai neo vao day, khong neo vao khoiTheoNhan() -- vi muc DNS la stack
     ANH EM cua stack tieu de, khong nam trong no (loi da bat 2026-08-13). */
  function theCua(chu) {
    var n = theTheoNhan(chu);
    while (n) {
      n = n.parentElement;
      if (!n || n.id === 'root') return null;
      if (!n.classList.contains('MuiStack-root') && /(^| )css-/.test(n.className || '')) return n;
    }
    return null;
  }
  /* ============ QUAN LY RADIO: vi sao phai tu quan trang thai ============
     MOI nhom radio tren trang deu dung name="radio" (dung nhu ban chup that
     -- MUI khong dat name rieng, react-hook-form moi la cho giu ten truong).
     Tren thiet bi that React kiem soat thuoc tinh 'checked' cua tung o nen
     cac nhom VAN doc lap. Trang TINH thi khong: trinh duyet gom moi input
     radio CUNG TEN trong cung mot form thanh MOT nhom -> chon o nhom nay
     lam BUNG o nhom kia.

     Loi da bat duoc 2026-08-13: nap() dat dns6='manual' roi dat ipVersion
     ='10' -> lenh sau lam bung dns6, ket qua ca ba nhom deu trong.

     Da thu cach "tu nho lua chon tung nhom roi ap lai tat ca": KHONG AN
     THUA, vi trinh duyet cuong che tinh duy nhat NGAY LUC GAN -- gan o
     nhom sau lap tuc bung o nhom truoc, nen sau vong lap chi con nhom
     cuoi cung duoc chon.

     Cach sua that su: doi 'name' thanh duy nhat cho tung nhom, NHUNG CHI
     TRONG DOM LUC CHAY. File HTML phuc vu van giu nguyen name="radio" y
     het ban chup (bang chung khong bi dung toi), va ten goc duoc luu lai
     o thuoc tinh data-name-goc. Day cung la cach interact.js da lam voi
     thuoc tinh 'value' cua cong tac. Ghi ro trong ISSUES.md. */
  var TT_RADIO = {};   // {ipver:'10', dns4:'manual', dns6:'manual', vlan:'manual'}

  /* Tach ten radio theo tung nhom de cac nhom doc lap (xem chu thich tren) */
  function tachTenRadio() {
    ['ipver', 'dns4', 'dns6', 'vlan'].forEach(function (k) {
      var g = (k === 'ipver') ? document.querySelector('.MuiFormGroup-root.MuiRadioGroup-row')
        : document.querySelector('[data-sim-nhom="' + k + '"]');
      if (!g) return;
      g.querySelectorAll('input[type="radio"]').forEach(function (i) {
        if (!i.hasAttribute('data-name-goc')) {
          i.setAttribute('data-name-goc', i.getAttribute('name') || 'radio');
        }
        i.setAttribute('name', 'radio-' + k);
      });
    });
  }

  function nhomIpVersion() {
    return document.querySelector('.MuiFormGroup-root.MuiRadioGroup-row');
  }
  function nhomTheoKhoa(k) {
    return (k === 'ipver') ? nhomIpVersion()
      : document.querySelector('[data-sim-nhom="' + k + '"]');
  }
  function khoaCuaInput(inp) {
    var g = inp.closest('.MuiFormGroup-root');
    if (!g) return null;
    if (g.classList.contains('MuiRadioGroup-row')) return 'ipver';
    return g.getAttribute('data-sim-nhom');
  }
  function apLaiRadio() {
    Object.keys(TT_RADIO).forEach(function (k) {
      var g = nhomTheoKhoa(k);
      if (!g) return;
      g.querySelectorAll('input').forEach(function (i) {
        i.checked = (i.value === TT_RADIO[k]);
      });
    });
    if (window.__simSync) window.__simSync();
  }
  function datRadio(k, v) { TT_RADIO[k] = v; apLaiRadio(); }
  function docRadio(k) { return TT_RADIO[k] || 'auto'; }

  function ipVersionDangChon() { return TT_RADIO.ipver || '10'; }
  function datIpVersion(v) { datRadio('ipver', v); }

  /* ------------------------------------------------------------- an / hien */

  function ipv4DangBat() {
    var v = ipVersionDangChon();
    return v === '4' || v === '10';
  }
  function ipv6DangBat() {
    var v = ipVersionDangChon();
    return v === '6' || v === '10';
  }

  function apDungAnHien() {
    var p4 = giaTri('ipv4Settings.protocol') || 'dhcp';
    var p6 = giaTri('ipv6Settings.protocol') || 'dhcpv6';

    // 1. Khoi IPv4 / IPv6 an theo ipVersion
    var theV4 = theCua('IPv4 Connection Type');
    var theV6 = theCua('IPv6 Connection Type');
    if (theV4) theV4.style.display = ipv4DangBat() ? '' : 'none';
    if (theV6) theV6.style.display = ipv6DangBat() ? '' : 'none';

    // 2. Trong khoi IPv4: PPPoE / Static
    ['ipv4Settings.pppoe.username', 'ipv4Settings.pppoe.password'].forEach(function (n) {
      var el = o(n);
      if (el) el.closest('.MuiFormControl-root').style.display = (p4 === 'pppoe') ? '' : 'none';
    });
    ['ipv4Settings.ipAddress', 'ipv4Settings.mask', 'ipv4Settings.gateway'].forEach(function (n) {
      var el = o(n);
      if (el) el.closest('.MuiFormControl-root').style.display = (p4 === 'static') ? '' : 'none';
    });

    // 3. Trong khoi IPv6: Static
    ['ipv6Settings.ipAddress', 'ipv6Settings.gateway', 'ipv6Settings.prefix'].forEach(function (n) {
      var el = o(n);
      if (el) el.closest('.MuiFormControl-root').style.display = (p6 === 'static') ? '' : 'none';
    });

    // 4. DNS: radio auto/manual AN khi protocol === 'static'; o nhap hien khi manual
    [['4', p4], ['6', p6]].forEach(function (c) {
      var nhom = document.querySelector('[data-sim-nhom="dns' + c[0] + '"]');
      if (nhom) {
        nhom.closest('.MuiFormControl-root').style.display = (c[1] !== 'static') ? '' : 'none';
      }
      var man = docRadio('dns' + c[0]) === 'manual' || c[1] === 'static';
      ['primary', 'secondary'].forEach(function (k) {
        var el = o('ipv' + c[0] + 'Settings.dns.dnsServers.' + k);
        if (el) el.closest('.MuiFormControl-root').style.display = man ? '' : 'none';
      });
    });

    // 5. VLAN
    var vlanBat = batTat('vlan.enabled');
    var nhomVlan = document.querySelector('[data-sim-nhom="vlan"]');
    if (nhomVlan) {
      nhomVlan.closest('.MuiFormControl-root').style.display =
        (vlanBat && ipv4DangBat() && p4 === 'dhcp') ? '' : 'none';
    }
    var oId = o('vlan.id');
    if (oId) {
      oId.closest('.MuiFormControl-root').style.display =
        (vlanBat && docRadio('vlan') === 'manual') ? '' : 'none';
    }

    if (window.__simSync) window.__simSync();
  }

  /* ------------------------------------------------------ dung cac nhanh thieu */

  /* Khoi con chua tieu de "DNS" ben trong mot THE (card) */
  function khoiDNSTrong(the) {
    if (!the) return null;
    var hs = [].slice.call(the.querySelectorAll('h6'));
    for (var i = 0; i < hs.length; i++) {
      if (hs[i].textContent.trim() === 'DNS') return hs[i].closest('.MuiStack-root');
    }
    return null;
  }

  function dungCacNhanhThieu() {
    var mauRadio = nhomMauAutoManual();
    var bocMau = mauRadio ? mauRadio.closest('.MuiFormControl-root') : null;
    var theV4 = theCua('IPv4 Connection Type');
    var theV6 = theCua('IPv6 Connection Type');

    /* --- B1. Danh dau cac nhom radio DNS CO SAN truoc (phai lam TRUOC khi
       nhan ban them nhom moi, neu khong se lan lon). Ban chup chi co nhom
       cua IPv6 (nhom IPv4 bi an vi protocol='static'). */
    var khoiDns4 = khoiDNSTrong(theV4);
    var khoiDns6 = khoiDNSTrong(theV6);
    [].slice.call(document.querySelectorAll(
      '.MuiFormGroup-root.MuiRadioGroup-root:not(.MuiRadioGroup-row)'
    )).forEach(function (g) {
      if (g.hasAttribute('data-sim-nhom')) return;
      if (khoiDns6 && khoiDns6.contains(g)) g.setAttribute('data-sim-nhom', 'dns6');
      else if (khoiDns4 && khoiDns4.contains(g)) g.setAttribute('data-sim-nhom', 'dns4');
    });

    function themNhomRadio(vaoDau, danhDau, chenDauKhoi) {
      if (!vaoDau || !mauRadio || !bocMau) return;
      if (document.querySelector('[data-sim-nhom="' + danhDau + '"]')) return;
      var boc = bocMau.cloneNode(false);
      boc.appendChild(nhomRadioAutoManual(mauRadio, danhDau));
      if (chenDauKhoi && vaoDau.children.length > 1) {
        vaoDau.insertBefore(boc, vaoDau.children[1]);   // ngay sau tieu de
      } else {
        vaoDau.appendChild(boc);
      }
    }

    // --- B2. khoi IPv4: them 2 o PPPoE (chen TRUOC nhom o Static)
    if (theV4 && !o('ipv4Settings.pppoe.username')) {
      var neo4 = o('ipv4Settings.ipAddress');
      var chen4 = neo4 ? neo4.closest('.MuiFormControl-root') : null;
      var tam = document.createElement('div');
      tam.innerHTML = oVanBan('ipv4Settings.pppoe.username', 'PPP Username', '')
        + oVanBan('ipv4Settings.pppoe.password', 'PPP Password', '');
      var dich4 = chen4 ? chen4.parentNode : khoiTheoNhan('IPv4 Connection Type');
      while (tam.firstChild) {
        if (chen4) dich4.insertBefore(tam.firstChild, chen4);
        else dich4.appendChild(tam.firstChild);
      }
    }

    // --- B3. khoi IPv6: them 3 o Static (chen ngay sau o Connection Type)
    if (theV6 && !o('ipv6Settings.ipAddress')) {
      var tam6 = document.createElement('div');
      tam6.innerHTML = oVanBan('ipv6Settings.ipAddress', 'IPv6 WAN Address', '')
        + oVanBan('ipv6Settings.gateway', 'IPv6 Gateway Address', '')
        + oVanBan('ipv6Settings.prefix', 'Custom Delegated IPv6-Prefix', '',
                  'e.g., 2001:0db8:85a3::/64');
      var neoSel = document.getElementById('mui-component-select-ipv6Settings.protocol');
      var sauSel = neoSel ? neoSel.closest('.MuiFormControl-root') : null;
      while (tam6.firstChild) {
        var n = tam6.firstChild;
        if (sauSel && sauSel.parentNode) { sauSel.parentNode.insertBefore(n, sauSel.nextSibling); sauSel = n; }
        else khoiTheoNhan('IPv6 Connection Type').appendChild(n);
      }
    }

    // --- B4. nhom radio DNS cua IPv4 (ban chup khong co vi protocol='static')
    themNhomRadio(khoiDns4, 'dns4', true);

    // --- B5. VLAN: nhom radio autoDetection + o VLAN ID
    var khoiVlan = khoiTheoNhan('VLAN');
    if (khoiVlan) {
      themNhomRadio(khoiVlan, 'vlan', false);
      if (!o('vlan.id')) {
        var tamId = document.createElement('div');
        tamId.innerHTML = oVlanId('0');
        khoiVlan.appendChild(tamId.firstChild);
      }
    }
  }

  /* --------------------------------------------------------------- o chon */

  function noiCacOChon() {
    var s4 = document.getElementById('mui-component-select-ipv4Settings.protocol');
    var i4 = o('ipv4Settings.protocol');
    if (s4 && i4) {
      window.__noiOChon(s4, i4, [
        { gt: 'dhcp', chu: 'DHCP' },
        { gt: 'pppoe', chu: 'PPPoE' },
        { gt: 'static', chu: 'Static' }
      ], function () { apDungAnHien(); rangBuocLienDong('ipv4Settings.protocol'); });
    }
    var s6 = document.getElementById('mui-component-select-ipv6Settings.protocol');
    var i6 = o('ipv6Settings.protocol');
    if (s6 && i6) {
      window.__noiOChon(s6, i6, function () {
        // Tuy chon 'Static' bi vo hieu khi IPv4 dang bat va chay PPPoE
        var khoa = ipv4DangBat() && giaTri('ipv4Settings.protocol') === 'pppoe';
        return [
          { gt: 'dhcpv6', chu: 'DHCPv6 (Stateful)' },
          { gt: 'slaac', chu: 'DHCPv6 (Stateless)' },
          { gt: 'static', chu: 'Static', voHieu: khoa }
        ];
      }, function () { apDungAnHien(); rangBuocLienDong('ipv6Settings.protocol'); });
    }
  }

  /* ----------------------------------------------- rang buoc lien dong (ma goc) */

  function rangBuocLienDong(nguon) {
    var p4 = giaTri('ipv4Settings.protocol');
    var p6 = giaTri('ipv6Settings.protocol');

    // protocol -> static ma DNS dang auto thi ep sang manual
    if (nguon === 'ipv4Settings.protocol' && p4 === 'static' && docRadio('dns4') === 'auto') {
      datRadio('dns4', 'manual');
    }
    if (nguon === 'ipv6Settings.protocol' && p6 === 'static' && docRadio('dns6') === 'auto') {
      datRadio('dns6', 'manual');
    }
    // IPv4 chay PPPoE thi khong cho IPv6 Static
    if (ipv4DangBat() && p4 === 'pppoe' && ipv6DangBat() && p6 === 'static') {
      datGiaTri('ipv6Settings.protocol', 'dhcpv6');
      var s6 = document.getElementById('mui-component-select-ipv6Settings.protocol');
      if (s6) s6.textContent = 'DHCPv6 (Stateful)';
    }
    // VLAN auto chi hop le khi IPv4 bat + DHCP
    if ((!ipv4DangBat() || p4 !== 'dhcp') && docRadio('vlan') === 'auto') {
      datRadio('vlan', 'manual');
    }
    apLaiRadio();
    apDungAnHien();
  }

  /* ------------------------------------------------------------- nap du lieu */

  function nap() {
    dangNap = true;
    return fetch('/api/v1/data/interfaces/configurations', { cache: 'no-store' })
      .then(function (r) { return r.ok ? r.json() : []; })
      .then(function (ds) {
        BAN_GHI = (ds || []).filter(function (x) { return x.usage === USAGE; });
        G4 = BAN_GHI.filter(function (x) { return x.ipv4Settings; })[0] || null;
        G6 = BAN_GHI.filter(function (x) { return x.ipv6Settings; })[0] || null;
        if (!G4 && !G6) { baoLoi('Khong tim thay ban ghi WAN trong kho cau hinh.'); return; }

        var mocVlan = (G4 || G6).vlan || {};
        var mtu = (G4 || G6).mtu;
        datGiaTri('mtu', mtu);
        datBatTat('vlan.enabled', !!mocVlan.enabled);
        datRadio('vlan', mocVlan.autoDetectionEnabled ? 'auto' : 'manual');
        datGiaTri('vlan.id', mocVlan.id == null ? 0 : mocVlan.id);

        if (G4) {
          var s4 = G4.ipv4Settings || {};
          datGiaTri('ipv4Settings.protocol', s4.protocol);
          var hs4 = document.getElementById('mui-component-select-ipv4Settings.protocol');
          if (hs4) hs4.textContent = { dhcp: 'DHCP', pppoe: 'PPPoE', static: 'Static' }[s4.protocol] || '';
          datGiaTri('ipv4Settings.ipAddress', s4.ipAddress);
          datGiaTri('ipv4Settings.mask', s4.mask);
          datGiaTri('ipv4Settings.gateway', s4.gateway);
          datGiaTri('ipv4Settings.pppoe.username', (s4.pppoe || {}).username);
          datGiaTri('ipv4Settings.pppoe.password', (s4.pppoe || {}).password);
          datRadio('dns4', G4.autoDnsEnabled ? 'auto' : 'manual');
          datGiaTri('ipv4Settings.dns.dnsServers.primary', (G4.dnsServers || [])[0] || '');
          datGiaTri('ipv4Settings.dns.dnsServers.secondary', (G4.dnsServers || [])[1] || '');
        }
        if (G6) {
          var s6 = G6.ipv6Settings || {};
          // slaacEnabled + protocol='dhcpv6' -> hien thi la 'slaac'
          var pr6 = (s6.slaacEnabled && s6.protocol === 'dhcpv6') ? 'slaac' : s6.protocol;
          datGiaTri('ipv6Settings.protocol', pr6);
          var hs6 = document.getElementById('mui-component-select-ipv6Settings.protocol');
          if (hs6) {
            hs6.textContent = { dhcpv6: 'DHCPv6 (Stateful)', slaac: 'DHCPv6 (Stateless)', 'static': 'Static' }[pr6] || '';
          }
          datGiaTri('ipv6Settings.ipAddress', s6.ipAddress);
          datGiaTri('ipv6Settings.gateway', s6.gateway);
          datGiaTri('ipv6Settings.prefix', s6.prefix);
          datRadio('dns6', G6.autoDnsEnabled ? 'auto' : 'manual');
          datGiaTri('ipv6Settings.dns.dnsServers.primary', (G6.dnsServers || [])[0] || '');
          datGiaTri('ipv6Settings.dns.dnsServers.secondary', (G6.dnsServers || [])[1] || '');
        }

        // ipVersion SUY RA tu enabled cua hai ban ghi (dung ma goc)
        var b4 = !!(G4 && G4.enabled), b6 = !!(G6 && G6.enabled);
        datIpVersion(b4 && !b6 ? '4' : (!b4 && b6 ? '6' : '10'));

        if (window.__simSync) window.__simSync();
        apDungAnHien();
        console.log('[wan_binding] da nap ' + BAN_GHI.length + ' ban ghi usage=' + USAGE);
      })
      .catch(function (e) { console.error('[wan_binding] nap that bai:', e); })
      .then(function () { setTimeout(function () { dangNap = false; }, 0); });
  }

  /* ------------------------------------------------------------- ghi (Save) */

  function thanVlan() {
    var bat = batTat('vlan.enabled');
    var che = docRadio('vlan');
    return {
      enabled: bat,
      autoDetectionEnabled: che === 'auto',
      id: (bat && che === 'manual') ? Number(giaTri('vlan.id') || 0) : 0
    };
  }

  function dungThan() {
    var mtu = Number(giaTri('mtu') || 1500);
    var vlan = thanVlan();
    var Q = ipv4DangBat(), Z = ipv6DangBat();
    var p4 = giaTri('ipv4Settings.protocol');
    var p6 = giaTri('ipv6Settings.protocol');
    var dns4Auto = docRadio('dns4') === 'auto';
    var dns6Auto = docRadio('dns6') === 'auto';

    return BAN_GHI.map(function (bg) {
      if (bg.ipv4Settings && Q) {
        return {
          mtu: mtu, name: bg.id, id: bg.id, usage: USAGE, vlan: vlan, enabled: true,
          devices: bg.devices,
          ipv4Settings: {
            protocol: p4,
            mask: p4 === 'static' ? giaTri('ipv4Settings.mask') : '',
            pppoe: {
              username: p4 === 'pppoe' ? giaTri('ipv4Settings.pppoe.username') : '',
              password: p4 === 'pppoe' ? giaTri('ipv4Settings.pppoe.password') : ''
            },
            ipAddress: p4 === 'static' ? giaTri('ipv4Settings.ipAddress') : '',
            gateway: p4 === 'static' ? giaTri('ipv4Settings.gateway') : ''
          },
          autoDnsEnabled: dns4Auto,
          dnsServers: dns4Auto ? [] : [
            giaTri('ipv4Settings.dns.dnsServers.primary'),
            giaTri('ipv4Settings.dns.dnsServers.secondary')
          ]
        };
      }
      if (bg.ipv6Settings) {
        if (Z) {
          return {
            mtu: mtu, name: bg.id, id: bg.id, usage: USAGE, vlan: vlan, enabled: true,
            devices: bg.devices,
            ipv6Settings: {
              enabled: true,
              protocol: p6 === 'slaac' ? 'dhcpv6' : p6,
              prefix: p6 === 'static' ? giaTri('ipv6Settings.prefix') : '',
              ipAddress: p6 === 'static' ? giaTri('ipv6Settings.ipAddress') : '',
              gateway: p6 === 'static' ? giaTri('ipv6Settings.gateway') : '',
              slaacEnabled: p6 === 'slaac'
            },
            autoDnsEnabled: dns6Auto,
            dnsServers: dns6Auto ? [] : [
              giaTri('ipv6Settings.dns.dnsServers.primary'),
              giaTri('ipv6Settings.dns.dnsServers.secondary')
            ]
          };
        }
        var tat = JSON.parse(JSON.stringify(bg));
        tat.ipv6Settings.enabled = false;
        tat.enabled = false;
        tat.mtu = mtu;
        tat.vlan = vlan;
        return tat;
      }
      var giu = JSON.parse(JSON.stringify(bg));
      giu.enabled = false;
      giu.mtu = mtu;
      giu.vlan = vlan;
      return giu;
    });
  }

  function luu() {
    if (dangGhi || !BAN_GHI.length) return Promise.resolve();
    var p4 = giaTri('ipv4Settings.protocol');
    if (ipv4DangBat() && p4 === 'pppoe'
        && (!giaTri('ipv4Settings.pppoe.username') || !giaTri('ipv4Settings.pppoe.password'))) {
      baoLoi('PPP Username / PPP Password khong duoc de trong.');
      return Promise.resolve();
    }
    dangGhi = true;
    return fetch('/api/v1/data/interfaces/configurations', {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(dungThan())
    }).then(function (r) {
      if (!r.ok) throw new Error('HTTP ' + r.status);
      return nap();
    }).then(function () {
      return new Promise(function (ok) { setTimeout(function () { dangGhi = false; ok(); }, 0); });
    }, function (e) {
      dangGhi = false;
      baoLoi('Changes saving failed, please try again.  (' + e.message + ')');
    });
  }

  /* --------------------------------------------------- thanh Save/Cancel
     GD6 (2026-08-14), SUA LAI ket luan sai: KHONG phai "LUON HIEN". Da
     kiem truc tiep tren thiet bi that (192.168.1.1): trang WAN nap len
     KHONG co thanh Save/Cancel, bam doi radio IPv4&IPv6 -> IPv4 thi
     thanh moi hien ra. Ket luan cu "Xe/actions nam ngoai moi dieu kien"
     doc dung cau truc JSX (component luon duoc RENDER) nhung bo sot lop
     CSS dieu khien display:none/flex theo isDirty cua react-hook-form
     -- CUNG mot loai nham lan da sua o hop thoai Add New (xem GD6 nhom
     Network, dialog_data.js). Sua: bo goi hienThanhSave() vo dieu kien
     trong batDau(), chi goi trong theoDoi() luc nguoi dung THAT SU sua. */
  function hienThanhSave() {
    if (thanhSave) return;
    var neo = document.querySelector('#tabpanel-Internet form.css-1w5zf2q')
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
    if (!vung || vung.__wanTheoDoi) return;
    vung.__wanTheoDoi = true;
    ['input', 'change', 'click'].forEach(function (loai) {
      vung.addEventListener(loai, function (e) {
        if (dangNap || dangGhi) return;
        if (thanhSave && thanhSave.contains(e.target)) return;
        // Nguoi dung bam mot o radio: ghi nhan lua chon cua DUNG nhom do
        // roi ap lai toan bo (xem chu thich o TT_RADIO -- moi nhom deu
        // dung chung name="radio" nen phai tu quan).
        var t = e.target;
        if (t && t.tagName === 'INPUT' && t.type === 'radio') {
          var k = khoaCuaInput(t);
          if (k) TT_RADIO[k] = t.value;
        }

        // Tự cập nhật Gateway = 3 octet đầu của IP + .254
        if (t && t.tagName === 'INPUT' && (t.name === 'ipv4Settings.ipAddress' || t.name === 'ipv4Settings.mask')) {
          var ipVal = giaTri('ipv4Settings.ipAddress');
          var parts = (ipVal || '').split('.');
          if (parts.length === 4 && parts[0] && parts[1] && parts[2]) {
            datGiaTri('ipv4Settings.gateway', parts[0] + '.' + parts[1] + '.' + parts[2] + '.254');
          }
        }

        hienThanhSave();
        setTimeout(function () {
          if (typeof apDungAnHien === 'function') apDungAnHien();
          if (typeof rangBuocLienDong === 'function') rangBuocLienDong('su-kien');
        }, 0);
      });
    });
  }

  function batDau() {
    dungCacNhanhThieu();
    tachTenRadio();
    noiCacOChon();
    nap().then(function () {
      theoDoi();
    });
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', batDau);
  } else {
    batDau();
  }
})();
