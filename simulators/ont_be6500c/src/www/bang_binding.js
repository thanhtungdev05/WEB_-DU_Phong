/* Module BANG dung chung cho cac trang dang bang co Them/Sua/Xoa:
   Port Forwarding (network__portforward) va Static Routing
   (advanced__routing__t0 = IPv4, advanced__routing__t1 = IPv6).

   Vi sao tach rieng khoi api_binding.js: trang do chi lam PATCH mot
   "form" duy nhat. Bang thi khac hoan toan -- danh sach nhieu ban ghi,
   co POST (tao), PATCH (sua TUNG ban ghi rieng, khong phai ca form), va
   DELETE (xoa theo id). Tu nap() den luu() cua api_binding.js khong dung
   duoc cho kieu du lieu nay.

   ================= HOP DONG DA DO/DOC MA GOC (GD4 2026-08-13) =================
   Xem chi tiet: reference/source/hop_dong_ghi_bang.json,
   reference/source/hop_dong_ghi_that.json.

     portForwarding/policies:
       POST   -> [{enabled,name,protocol,source:{portRange},
                   destination:{portRange,ipAddress}}]   (KHONG id, KHONG interfaceId)
       PATCH  -> [{id,enabled,name,protocol,
                   source:{portRange,interfaceId},        (interfaceId LAY TU ban ghi goc)
                   destination:{portRange,ipAddress,interfaceId}}]
       DELETE -> {ids:[...]}
       id thiet bi sinh dang 'cfg' + 6 chu so.

     staticRouting/policies:
       POST/PATCH -> [{...form, ipVersion}]  -- ipVersion (4|6) la truong
                      DUY NHAT do CLIENT tu them, khong phai thiet bi.
       DELETE -> {ids:[...]}
       id thiet bi sinh dang 'S_route_' + 8 hex.
       IPv6: o Destination la <textarea>, gia tri radio Internet la 'wan6'
       (khong phai 'wan'), khong co o Mask, bang ket qua tach lam 2 cot
       (Destination IP / Prefix Length) tu chuoi target='<ip>/<prefix>'.

   Hai hop thoai xac nhan (delete_confirm) va bieu mau (dialog_portforward_add,
   dialog_routing_add) nam trong dialog_data.js -- KHONG bia markup o day. */
(function () {
  'use strict';

  function tenTrangDayDu() {
    var n = (location.pathname.split('/').pop() || '').replace('.html', '');
    /* GD5: bo tien to 'm_' cua ban DIEN THOAI truoc khi nhan dien trang.
       Neu khong, module nay se khong nhan ra 'm_<route>' va thoat ngay ->
       moi trang dien thoai mat sach phan noi du lieu. Loi da bat duoc
       2026-08-14 khi kiem ban dien thoai cua trang LAN. */
    if (n.indexOf('m_') === 0) n = n.slice(2);
    if (n === 'index' || n === '') n = 'home__overview';
    return n;
  }

  var TEN = tenTrangDayDu();

  /* ------------------------------------------------------- cau hinh bang */

  var CH;
  if (TEN === 'network__portforward') {
    CH = {
      resource: 'portForwarding/policies',
      dialogPaper: 'dialog_portforward_add',
      thongBaoTrong: 'No port forwarding rule is configured.',
      loaiBang: 'portforward'
    };
  } else if (TEN === 'advanced__routing' || TEN === 'advanced__routing__t0') {
    /* GD5 phan 2 nhom Advanced (2026-08-14): 'advanced__routing' (KHONG
       hau to __t0) la trang THAT ma menu "Static Routing" tro toi
       (window.__MAP["Static Routing"]="advanced__routing" -- xem
       sidebar_data.js). Truoc gio nhan dien chi khop '__t0'/'__t1' nen
       trang goc nay bi BO QUA HOAN TOAN -- khong log [bang_binding],
       khong wiring gi ca -- tren CA MAY TINH LAN DIEN THOAI (loi co tu
       GD4, khong phai loi rieng dien thoai, chi lo ra khi kiem trang
       vao tu menu thay vi go thang URL __t0). Coi 'advanced__routing'
       tuong duong __t0 (IPv4), giong cach lan_binding.js da lam voi
       'advanced__lan'. */
    CH = {
      resource: 'staticRouting/policies',
      dialogPaper: 'dialog_routing_add',
      thongBaoTrong: 'No routing rule is configured.',
      loaiBang: 'routing', ipVersion: 4
    };
  } else if (TEN === 'advanced__routing__t1') {
    CH = {
      resource: 'staticRouting/policies',
      dialogPaper: 'dialog_routing_add',
      thongBaoTrong: 'No routing rule is configured.',
      loaiBang: 'routing', ipVersion: 6
    };
  } else if (TEN === 'advanced__lan__t1') {
    CH = {
      resource: 'dhcp/reservedHosts',
      dialogPaper: null, // xu ly rieng, xem moBieuMauReserved()
      // CHUA co anh chup that trang RONG cho bang nay (mac dinh luon co
      // >=1 ban ghi mau) -- tam dung chung 1 cau voi cac bang khac, GHI RO
      // trong ISSUES.md la chua kiem chung.
      thongBaoTrong: 'No reserved IP is configured.',
      loaiBang: 'reserved'
    };
  } else {
    return; // trang khac -- khong lam gi
  }

  function coTheGhi(method) {
    var m = (window.__METHODS || {})[CH.resource];
    return !!m && m.indexOf(method) >= 0;
  }

  function baoLoi(msg) {
    console.error('[bang_binding] ' + msg);
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

  /* ------------------------------------------------- danh sach thiet bi
     (dung cho o "Device / IP" cua Port Forwarding). Cung nguon/dieu kien
     loc voi napThietBi() trong api_binding.js (type!=='Router', status
     ==='Up') -- viet lai rieng vi api_binding.js dong goi kin, khong lo
     ra ngoai. */
  var DS_THIET_BI = null;
  function napThietBi() {
    if (DS_THIET_BI) return Promise.resolve(DS_THIET_BI);
    return fetch('/api/v1/data/devices', { cache: 'no-store' })
      .then(function (r) { return r.ok ? r.json() : []; })
      .then(function (ds) {
        DS_THIET_BI = (Array.isArray(ds) ? ds : [])
          .filter(function (x) { return x.type !== 'Router' && x.status === 'Up'; })
          .map(function (x) {
            var ip4 = (x.ipAddresses || []).filter(function (a) { return a.version === 4; })[0];
            return { hostname: x.hostname || 'Unknown', ip: ip4 ? ip4.address : '' };
          });
        return DS_THIET_BI;
      })
      .catch(function () { DS_THIET_BI = []; return DS_THIET_BI; });
  }
  function thietBiTheoIp(ip) {
    return (DS_THIET_BI || []).filter(function (x) { return x.ip === ip; })[0] || null;
  }

  /* Reserved IP can BAN DAY DU thiet bi theo macAddress, KHONG loc status/
     type (ma goc dung Qe(!1) -- tat ca thiet bi, khac napThietBi() o tren
     chi lay thiet bi dang Up de goi y dia chi cho Port Forwarding). */
  var DS_THIET_BI_MAC = null;
  function napTatCaThietBi() {
    if (DS_THIET_BI_MAC) return Promise.resolve(DS_THIET_BI_MAC);
    return fetch('/api/v1/data/devices', { cache: 'no-store' })
      .then(function (r) { return r.ok ? r.json() : []; })
      .then(function (ds) {
        DS_THIET_BI_MAC = Array.isArray(ds) ? ds : [];
        return DS_THIET_BI_MAC;
      })
      .catch(function () { DS_THIET_BI_MAC = []; return DS_THIET_BI_MAC; });
  }
  function thietBiTheoMac(mac) {
    return (DS_THIET_BI_MAC || []).filter(function (x) { return x.macAddress === mac; })[0] || null;
  }

  /* ---------------------------------------------------------- nhan giao dien */

  function nhanInterface(id) {
    if (id === 'wan' || id === 'wan6') return 'Internet';
    if (id === 'lan') return 'LAN';
    if (id === 'guest') return 'Guest';
    return id || '';
  }

  /* ---------------------------------------------------------- render bang */

  /* GD5 phan 2 (2026-08-14): ban DIEN THOAI luc rong KHONG co
     '.MuiTableContainer-root' -- da doi chieu truc tiep bang chung:
     grep 'MuiTableContainer-root' ra 1 lan trong network__portforward.html
     (may tinh) nhung 0 lan trong m_network__portforward.html (dien thoai).
     Cau truc that luc rong tren dien thoai chi co
     '<div class="MuiBox-root">' chua dong thong bao trong, KHONG boc trong
     TableContainer nao ca. Chua co bang chung markup bang LUC CO DU LIEU
     tren dien thoai (chi chup duoc luc rong) -- ghi ISSUES.md. Tam thoi:
     tu tao mot '.MuiTableContainer-root' rong ngay vi tri do (thay the o
     thong bao trong) de co noi ma render() gan bang vao -- dung LAI HTML
     bang that (giong het may tinh, cung component nguon) lam noi dung khi
     co du lieu. Day la suy dien co can cu (cung component, khac breakpoint)
     ghi ro trong ISSUES, khong phai bia. */
  function vungBang() {
    var v = document.querySelector('.MuiTableContainer-root');
    if (v) return v;
    var box = Array.prototype.find.call(
      document.querySelectorAll('.MuiBox-root'),
      function (b) { return CH.thongBaoTrong && b.textContent.trim() === CH.thongBaoTrong; }
    );
    if (box) {
      var moi = document.createElement('div');
      moi.className = 'MuiTableContainer-root';
      box.parentNode.replaceChild(moi, box);
      return moi;
    }
    /* GD5 phan 2 nhom Advanced (2026-08-14): m_advanced__lan__t1 (Reserved
       IP tren dien thoai) khong dung <table> nhu desktop ma dung
       react-virtuoso (danh sach ao) -- xac nhan qua grep: markup that co
       [data-testid="virtuoso-scroller"]/"virtuoso-item-list", KHONG co
       .MuiTableContainer-root, va cung KHONG co hop rong (.MuiBox-root
       + thongBaoTrong) vi kho luon co san >=1 ban ghi mau luc chup (xem
       comment o CH cua 'advanced__lan__t1' phia tren). ban than
       'virtuoso-item-list' cung RONG trong ban chup (virtuoso ve tung
       dong bang JS luc chay, SingleFile khong bat duoc dong nao) -- tuc
       la KHONG co bang chung markup cho 1 dong danh sach tren dien thoai.
       Giai phap tam, CUNG mot kieu da dung cho network__portforward:
       thay nguyen khoi Box bao virtuoso-scroller bang mot
       .MuiTableContainer-root ke thua render <table> cua desktop --
       KHONG dung dung kien truc virtuoso that, chi de du lieu hien ra
       duoc va dung duoc. Ghi ro trong ISSUES.md, can do lai tren thiet
       bi that. */
    var scroller = document.querySelector('[data-testid="virtuoso-scroller"]');
    if (!scroller) return null;
    var boxAo = scroller.closest('.MuiBox-root') || scroller.parentElement;
    if (!boxAo) return null;
    var moi2 = document.createElement('div');
    moi2.className = 'MuiTableContainer-root';
    boxAo.parentNode.replaceChild(moi2, boxAo);
    return moi2;
  }

  function noNutThem() {
    var icon = document.querySelector('[data-testid="AddIcon"]');
    return icon ? icon.closest('button') : null;
  }

  /* Header (checkbox+cac cot+Edit+Delete) khi CO du lieu -- chup that. */
  function theadCoDuLieu() {
    var cot;
    if (CH.loaiBang === 'portforward') {
      cot = ['State', 'Name', 'Protocol', 'External Port', 'Device/IP', 'Internal Port'];
    } else if (CH.loaiBang === 'reserved') {
      cot = ['Device', 'Reserved IP', 'Added By'];
    } else if (CH.ipVersion === 4) {
      cot = ['Destination IP', 'Mask', 'Gateway IP', 'Interface'];
    } else {
      cot = ['Destination IP', 'Prefix Length', 'Gateway IP', 'Interface'];
    }
    var ths = cot.map(function (nhan, i) {
      var lopAlign = 'MuiTableCell-alignLeft';
      var lopCss = i === 0 ? 'css-1qm1rty' : 'css-1qm1rty';
      return '<th class="MuiTableCell-root MuiTableCell-head ' + lopAlign + ' MuiTableCell-sizeMedium ' + lopCss + '" scope="col">'
        + '<span class="MuiButtonBase-root MuiTableSortLabel-root css-dx096b" tabindex="0" role="button">' + nhan
        + '<svg class="MuiSvgIcon-root MuiSvgIcon-fontSizeMedium MuiTableSortLabel-icon MuiTableSortLabel-iconDirectionAsc css-tqymag" focusable="false" aria-hidden="true" viewBox="0 0 24 24" data-testid="ArrowDownwardIcon"><path d="M20 12l-1.41-1.41L13 16.17V4h-2v12.17l-5.58-5.59L4 12l8 8 8-8z"></path></svg></span></th>';
    }).join('');
    return '<thead class="MuiTableHead-root css-2elyaz"><tr class="MuiTableRow-root MuiTableRow-head css-dl5c2x">'
      + '<th class="MuiTableCell-root MuiTableCell-head MuiTableCell-paddingCheckbox MuiTableCell-sizeMedium css-1vpp1xq" scope="col">'
      + '<span class="MuiButtonBase-root MuiCheckbox-root MuiCheckbox-colorPrimary MuiCheckbox-sizeMedium PrivateSwitchBase-root MuiCheckbox-root MuiCheckbox-colorPrimary MuiCheckbox-sizeMedium MuiCheckbox-root MuiCheckbox-colorPrimary MuiCheckbox-sizeMedium css-axcdti">'
      + '<input class="PrivateSwitchBase-input css-1m9pwf3" type="checkbox" data-indeterminate="false">'
      + '<svg class="MuiSvgIcon-root MuiSvgIcon-fontSizeMedium css-vubbuv" focusable="false" aria-hidden="true" viewBox="0 0 24 24" data-testid="CheckBoxOutlineBlankIcon"><path d="M19 5v14H5V5h14m0-2H5c-1.1 0-2 .9-2 2v14c0 1.1.9 2 2 2h14c1.1 0 2-.9 2-2V5c0-1.1-.9-2-2-2z"></path></svg>'
      + '<span class="MuiTouchRipple-root css-w0pj6f"></span></span></th>'
      + ths
      + '<th class="MuiTableCell-root MuiTableCell-head MuiTableCell-alignCenter MuiTableCell-sizeMedium css-qjcoex" scope="col">Edit</th>'
      + '<th class="MuiTableCell-root MuiTableCell-head MuiTableCell-alignCenter MuiTableCell-sizeMedium css-qjcoex" scope="col">Delete</th>'
      + '</tr></thead>';
  }

  /* Header khi RONG -- chup that: it cot hon, KHONG co checkbox/Edit/Delete. */
  function theadRong() {
    var cot;
    if (CH.loaiBang === 'portforward') {
      cot = ['State', 'Name', 'Protocol', 'External Port', 'Device/IP', 'Internal Port'];
    } else if (CH.loaiBang === 'reserved') {
      cot = ['Device', 'Reserved IP', 'Added By'];
    } else if (CH.ipVersion === 4) {
      cot = ['Destination IP', 'Mask', 'Gateway IP', 'Interface'];
    } else {
      cot = ['Destination IP', 'Prefix Length', 'Gateway IP', 'Interface'];
    }
    var ths = cot.map(function (nhan, i) {
      var lop = (CH.loaiBang === 'portforward' && i === 0) ? 'css-7cagtg'
        : (CH.loaiBang === 'portforward' && i === 1) ? 'css-133hnuo' : 'css-1qm1rty';
      return '<th class="MuiTableCell-root MuiTableCell-head MuiTableCell-alignLeft MuiTableCell-sizeMedium ' + lop + '" scope="col">'
        + '<span class="MuiButtonBase-root MuiTableSortLabel-root css-dx096b" tabindex="0" role="button">' + nhan
        + '<svg class="MuiSvgIcon-root MuiSvgIcon-fontSizeMedium MuiTableSortLabel-icon MuiTableSortLabel-iconDirectionAsc css-tqymag" focusable="false" aria-hidden="true" viewBox="0 0 24 24" data-testid="ArrowDownwardIcon"><path d="M20 12l-1.41-1.41L13 16.17V4h-2v12.17l-5.58-5.59L4 12l8 8 8-8z"></path></svg></span></th>';
    }).join('');
    return '<thead class="MuiTableHead-root css-2elyaz"><tr class="MuiTableRow-root MuiTableRow-head css-dl5c2x">' + ths + '</tr></thead>';
  }

  /* Mau chip Disabled do TRUC TIEP tren thiet bi that 192.168.1.1 ngay
     2026-08-20 (anh Huynn tu tao 1 rule Port Forwarding thu, de TAT o
     hop thoai Add New, Network > Port Forwarding) -- xem
     reference/source/do_mau_chip_disabled.json. Lop rong o giua (truoc
     day de trong cho san, chua biet dien gi) nay dien dung
     "stateDisabled" khi tat -- doc CSSOM tren thiet bi that bat duoc
     luat ".css-1a2im0e.stateDisabled{color:rgb(117,117,117);background-
     color:rgba(0,0,0,.12)}", da them moi vao emotion.css (truoc day CHUA
     co, luon hien xanh sai cho ca 2 trang thai). Enabled KHONG co lop
     state rieng (kiem CSSOM: khong ton tai ".stateEnabled" nao), dung
     mau xanh mac dinh cua base .css-1a2im0e. */
  function oChip(batTat) {
    return '<div class="MuiChip-root MuiChip-filled MuiChip-sizeMedium MuiChip-colorDefault MuiChip-filledDefault '
      + (batTat ? '' : 'stateDisabled ') + 'css-1a2im0e">'
      + '<span class="MuiChip-label MuiChip-labelMedium css-9iedg7">' + (batTat ? 'Enabled' : 'Disabled') + '</span></div>';
  }
  function oChu(v) { return '<span class="MuiTypography-root MuiTypography-body2 css-fytoy1">' + esc(v) + '</span>'; }
  function esc(s) {
    return String(s == null ? '' : s).replace(/[&<>"]/g, function (c) {
      return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c];
    });
  }

  function tdTrai(noiDung) { return '<td class="MuiTableCell-root MuiTableCell-body MuiTableCell-alignLeft MuiTableCell-sizeMedium css-xa9bhm">' + noiDung + '</td>'; }
  function tdGiua(noiDung) { return '<td class="MuiTableCell-root MuiTableCell-body MuiTableCell-alignCenter MuiTableCell-sizeMedium css-po1c1">' + noiDung + '</td>'; }
  function tdCheckbox() {
    return '<td class="MuiTableCell-root MuiTableCell-body MuiTableCell-paddingCheckbox MuiTableCell-sizeMedium css-1hh6k41">'
      + '<span class="MuiButtonBase-root MuiCheckbox-root MuiCheckbox-colorPrimary MuiCheckbox-sizeMedium PrivateSwitchBase-root MuiCheckbox-root MuiCheckbox-colorPrimary MuiCheckbox-sizeMedium MuiCheckbox-root MuiCheckbox-colorPrimary MuiCheckbox-sizeMedium css-axcdti">'
      + '<input class="PrivateSwitchBase-input css-1m9pwf3" type="checkbox" data-indeterminate="false">'
      + '<svg class="MuiSvgIcon-root MuiSvgIcon-fontSizeMedium css-vubbuv" focusable="false" aria-hidden="true" viewBox="0 0 24 24" data-testid="CheckBoxOutlineBlankIcon"><path d="M19 5v14H5V5h14m0-2H5c-1.1 0-2 .9-2 2v14c0 1.1.9 2 2 2h14c1.1 0 2-.9 2-2V5c0-1.1-.9-2-2-2z"></path></svg>'
      + '<span class="MuiTouchRipple-root css-w0pj6f"></span></span></td>';
  }
  function nutBieuTuong(testid, pathD, lop) {
    return '<button class="MuiButtonBase-root MuiIconButton-root MuiIconButton-sizeSmall css-1k7aob0 ' + lop + '" tabindex="0" type="button">'
      + '<svg class="MuiSvgIcon-root MuiSvgIcon-fontSizeMedium operationIcon css-vubbuv" focusable="false" aria-hidden="true" viewBox="0 0 24 24" data-testid="' + testid + '"><path d="' + pathD + '"></path></svg>'
      + '<span class="MuiTouchRipple-root css-w0pj6f"></span></button>';
  }
  var D_EDIT = 'm14.06 9.02.92.92L5.92 19H5v-.92zM17.66 3c-.25 0-.51.1-.7.29l-1.83 1.83 3.75 3.75 1.83-1.83c.39-.39.39-1.02 0-1.41l-2.34-2.34c-.2-.2-.45-.29-.71-.29m-3.6 3.19L3 17.25V21h3.75L17.81 9.94z';
  var D_DEL = 'M6 19c0 1.1.9 2 2 2h8c1.1 0 2-.9 2-2V9c0-1.1-.9-2-2-2H8c-1.1 0-2 .9-2 2zM9 9h6c.55 0 1 .45 1 1v8c0 .55-.45 1-1 1H9c-.55 0-1-.45-1-1v-8c0-.55.45-1 1-1m6.5-5-.71-.71c-.18-.18-.44-.29-.7-.29H9.91c-.26 0-.52.11-.7.29L8.5 4H6c-.55 0-1 .45-1 1s.45 1 1 1h12c.55 0 1-.45 1-1s-.45-1-1-1z';

  function dongPortforward(bg) {
    var tb = thietBiTheoIp(bg.destination && bg.destination.ipAddress);
    var oThietBi = '<div class="MuiStack-root css-j7qwjs"><p class="MuiTypography-root MuiTypography-body2 css-fytoy1">'
      + esc(tb ? tb.hostname : (bg.destination && bg.destination.ipAddress) || '') + '</p>'
      + '<span class="MuiTypography-root MuiTypography-caption css-1ic69m7">' + esc(bg.destination && bg.destination.ipAddress) + '</span></div>';
    return '<tr class="MuiTableRow-root css-dl5c2x">'
      + tdCheckbox()
      + tdTrai(oChip(!!bg.enabled))
      + tdTrai(oChu(bg.name))
      + tdTrai(oChu(bg.protocol))
      + tdTrai(oChu(bg.source && bg.source.portRange))
      + tdTrai(oThietBi)
      + tdTrai(oChu(bg.destination && bg.destination.portRange))
      + tdGiua(nutBieuTuong('EditOutlinedIcon', D_EDIT, 'sim-sua'))
      + tdGiua(nutBieuTuong('DeleteOutlineRoundedIcon', D_DEL, 'sim-xoa'))
      + '</tr>';
  }

  function dongRouting(bg) {
    var phan = String(bg.target || '').split('/');
    var diaChi = phan[0] || '';
    var maskHoacPrefix = CH.ipVersion === 4 ? (bg.mask || '') : (phan[1] || '');
    return '<tr class="MuiTableRow-root css-dl5c2x">'
      + tdCheckbox()
      + tdTrai(oChu(diaChi))
      + tdTrai(oChu(maskHoacPrefix))
      + tdTrai(oChu(bg.gateway))
      + tdTrai(oChu(nhanInterface(bg.interfaceId)))
      + tdGiua(nutBieuTuong('EditOutlinedIcon', D_EDIT, 'sim-sua'))
      + tdGiua(nutBieuTuong('DeleteOutlineRoundedIcon', D_DEL, 'sim-xoa'))
      + '</tr>';
  }

  function dongReserved(bg) {
    var tb = thietBiTheoMac(bg.macAddress);
    var oThietBi = '<div class="MuiStack-root css-j7qwjs"><p class="MuiTypography-root MuiTypography-body2 css-fytoy1">'
      + esc(tb ? tb.hostname : '') + '</p>'
      + '<span class="MuiTypography-root MuiTypography-caption css-1ic69m7">' + esc(bg.macAddress) + '</span></div>';
    return '<tr class="MuiTableRow-root css-dl5c2x">'
      + tdCheckbox()
      + tdTrai(oThietBi)
      + tdTrai(oChu(bg.ipAddress))
      + tdTrai(oChu(bg.isAutoReserved ? 'Auto' : 'Manual'))
      + tdGiua(nutBieuTuong('EditOutlinedIcon', D_EDIT, 'sim-sua'))
      + tdGiua(nutBieuTuong('DeleteOutlineRoundedIcon', D_DEL, 'sim-xoa'))
      + '</tr>';
  }

  /* ------------------------------------------- the (card) tren dien thoai
     Bang chung: reference/source/do_bang_dien_thoai_co_du_lieu.json (do
     truc tiep tren thiet bi that 192.168.1.1, 2026-08-18 -- them 1 dong
     thu qua UI that, do bang iframe cung-origin 420px, xoa ngay sau khi
     do). CHI Port Forwarding duoc do rieng; cau truc the (li/ListItemText/
     Stack, nhan+gia tri "Nhan : Gia tri") ap dung CHUNG cho ca 3 bang
     (Static Routing, Reserved IP) theo suy dien hop ly (cung 1 component
     nguon, cung he thong thiet ke) -- CHUA doi chieu rieng tung bang, ghi
     ro trong ISSUES.md. Tieu de the (h6) cung suy dien: Port Forwarding
     dung dung truong 'Name' da do; Static Routing/Reserved IP KHONG co
     truong dinh danh rieng tren desktop nen chon truong dau tien/de nhan
     biet nhat lam tieu de (Destination IP / Device) -- CHUA xac nhan. */
  function hangThe(nhan, htmlGiaTri) {
    return '<div class="MuiBox-root css-6n7j50">'
      + '<span class="MuiTypography-root MuiTypography-subtitle2 css-1axp2b2">' + esc(nhan) + ' :</span>'
      + '<div class="MuiBox-root css-7izgf8">' + htmlGiaTri + '</div></div>';
  }
  function hangTheKhongNhan(htmlGiaTri) {
    return '<div class="MuiBox-root css-6n7j50"><div class="MuiBox-root css-7izgf8">' + htmlGiaTri + '</div></div>';
  }
  function giaTriThuong(v) { return oChu(v); }
  function theThietBiIp(hostname, ip) {
    return '<div class="MuiBox-root css-6n7j50">'
      + '<span class="MuiTypography-root MuiTypography-body2 css-1t3jziq">' + esc(hostname) + '</span>'
      + '<div class="MuiChip-root MuiChip-outlined MuiChip-sizeSmall MuiChip-colorDefault MuiChip-outlinedDefault css-iq5fc3">'
      + '<span class="MuiChip-label MuiChip-labelSmall css-19imqg1">' + esc(ip) + '</span></div></div>';
  }
  function checkboxThe() {
    return '<span class="MuiButtonBase-root MuiCheckbox-root MuiCheckbox-colorPrimary MuiCheckbox-sizeMedium PrivateSwitchBase-root MuiCheckbox-root MuiCheckbox-colorPrimary MuiCheckbox-sizeMedium MuiCheckbox-root MuiCheckbox-colorPrimary MuiCheckbox-sizeMedium css-axcdti">'
      + '<input class="PrivateSwitchBase-input css-1m9pwf3" type="checkbox" data-indeterminate="false">'
      + '<svg class="MuiSvgIcon-root MuiSvgIcon-fontSizeMedium css-vubbuv" focusable="false" aria-hidden="true" viewBox="0 0 24 24" data-testid="CheckBoxOutlineBlankIcon"><path d="M19 5v14H5V5h14m0-2H5c-1.1 0-2 .9-2 2v14c0 1.1.9 2 2 2h14c1.1 0 2-.9 2-2V5c0-1.1-.9-2-2-2z"></path></svg>'
      + '<span class="MuiTouchRipple-root css-w0pj6f"></span></span>';
  }
  /* Nut 3 cham: markup THAT (class css-a22n87, icon MoreVertRoundedIcon)
     lay tu reference/source/m_advanced__lan__t1.html (cung thiet bi, da
     chup that -- xac nhan lai trong evidence file GD5+ o tren la dung
     class nay cho nut tren TUNG the). */
  function theTieuDe(ten) {
    return '<div class="MuiStack-root css-z87aq2">'
      + '<h6 class="MuiTypography-root MuiTypography-subtitle1 css-1nvyemi">' + esc(ten) + '</h6>'
      + '<button class="MuiButtonBase-root MuiIconButton-root MuiIconButton-sizeLarge css-a22n87 sim-ba-cham" tabindex="0" type="button">'
      + '<svg class="MuiSvgIcon-root MuiSvgIcon-fontSizeMedium css-vubbuv" focusable="false" aria-hidden="true" viewBox="0 0 24 24" data-testid="MoreVertRoundedIcon">'
      + '<path d="M12 8c1.1 0 2-.9 2-2s-.9-2-2-2-2 .9-2 2 .9 2 2 2m0 2c-1.1 0-2 .9-2 2s.9 2 2 2 2-.9 2-2-.9-2-2-2m0 6c-1.1 0-2 .9-2 2s.9 2 2 2 2-.9 2-2-.9-2-2-2"></path></svg>'
      + '<span class="MuiTouchRipple-root css-w0pj6f"></span></button></div>';
  }
  function theHang(tieuDe, cacHang) {
    return '<li class="MuiListItem-root MuiListItem-gutters MuiListItem-padding css-1d0y6tz sim-the">'
      + '<div class="MuiListItemIcon-root css-1c420ku">' + checkboxThe() + '</div>'
      + '<div class="MuiListItemText-root MuiListItemText-multiline css-midrsf">'
      + tieuDe + '<div class="MuiStack-root css-1lnevj1">' + cacHang + '</div>'
      + '</div></li>';
  }

  function theThePortforward(bg) {
    var tb = thietBiTheoIp(bg.destination && bg.destination.ipAddress);
    var hangs = hangTheKhongNhan(oChip(!!bg.enabled))
      + hangThe('Protocol', giaTriThuong(bg.protocol))
      + hangThe('External Port', giaTriThuong(bg.source && bg.source.portRange))
      + hangThe('Device/IP', theThietBiIp(tb ? tb.hostname : '', (bg.destination && bg.destination.ipAddress) || ''))
      + hangThe('Internal Port', giaTriThuong(bg.destination && bg.destination.portRange));
    return theHang(theTieuDe(bg.name), hangs);
  }
  function theTheRouting(bg) {
    var phan = String(bg.target || '').split('/');
    var diaChi = phan[0] || '';
    var maskHoacPrefix = CH.ipVersion === 4 ? (bg.mask || '') : (phan[1] || '');
    var nhanCot2 = CH.ipVersion === 4 ? 'Mask' : 'Prefix Length';
    var hangs = hangThe(nhanCot2, giaTriThuong(maskHoacPrefix))
      + hangThe('Gateway IP', giaTriThuong(bg.gateway))
      + hangThe('Interface', giaTriThuong(nhanInterface(bg.interfaceId)));
    return theHang(theTieuDe(diaChi), hangs);
  }
  /* Do that tren thiet bi 192.168.1.1 ngay 2026-08-20 (dong Admin-PC,
     Advanced > LAN > Reserved IP, qua iframe cung-origin 420px) -- xem
     reference/source/do_the_reserved_ip_dien_thoai.json. KHAC voi suy
     dien truoc day: tieu de the la DIA CHI MAC (khong phai hostname), va
     co THEM dong "Name" (hostname) o dau danh sach truong -- truoc day
     thieu dong nay. */
  function theTheReserved(bg) {
    var tb = thietBiTheoMac(bg.macAddress);
    var hangs = hangThe('Name', giaTriThuong(tb ? tb.hostname : 'Unknown'))
      + hangThe('Reserved IP', giaTriThuong(bg.ipAddress))
      + hangThe('Added By', giaTriThuong(bg.isAutoReserved ? 'Auto' : 'Manual'));
    return theHang(theTieuDe(bg.macAddress), hangs);
  }

  /* Menu Edit/Delete cua nut 3 cham. Thu tu/nhan/icon + markup luc MO
     (role="menuitem", icon EditOutlinedIcon/DeleteOutlineRoundedIcon,
     Divider giua 2 muc) DO TRUC TIEP tren thiet bi that 2026-08-20 -- xem
     reference/source/do_menu_ba_cham_luc_mo.json. Dung ham rieng
     __moMenuBaCham() (dialog_data.js), KHONG con dung __moMenuChon()
     (markup Select) nhu truoc. D_EDIT/D_DEL tai su dung hang so icon da
     co san o tren (giong het icon o bang may tinh). */
  function moMenuBaCham(nut, bg) {
    window.__moMenuBaCham(nut, [
      { gt: 'edit', chu: 'Edit', testId: 'EditOutlinedIcon', d: D_EDIT },
      { gt: 'delete', chu: 'Delete', testId: 'DeleteOutlineRoundedIcon', d: D_DEL }
    ], function (gt) {
      if (gt === 'edit') {
        if (CH.loaiBang === 'reserved') moBieuMauReserved(bg); else moBieuMau(bg);
      } else if (gt === 'delete') {
        xacNhanXoa(bg);
      }
    });
  }

  /* Container bao ngoai cac <li>: bang chung chi xac nhan CAC <div> bao
     truc tiep KHONG mang class emotion nao (className rong, co the la
     wrapper cua thu vien ao hoa danh sach) -- KHONG bia MuiList-root/
     css-xxx cho no. Dung mot lop 'sim-*' thuan tuc nang, khong phai lop
     that. */
  function renderThe(vung, stackHtml) {
    var xayDong = CH.loaiBang === 'portforward' ? theThePortforward
      : CH.loaiBang === 'reserved' ? theTheReserved : theTheRouting;
    var muc = DS_HIEN_TAI.map(xayDong).join('');
    vung.innerHTML = stackHtml + '<div class="sim-cac-the">' + muc + '</div>';
    vung.querySelectorAll('li.sim-the').forEach(function (li, i) {
      var bg = DS_HIEN_TAI[i];
      var nutBaCham = li.querySelector('.sim-ba-cham');
      if (nutBaCham) nutBaCham.addEventListener('click', function () { moMenuBaCham(nutBaCham, bg); });
    });
  }

  var DS_HIEN_TAI = [];

  function render(ds) {
    DS_HIEN_TAI = ds || [];
    var vung = vungBang();
    if (!vung) return;
    var stackTrang = vung.querySelector('.MuiStack-root');
    var stackHtml = stackTrang ? stackTrang.outerHTML : '';

    if (!DS_HIEN_TAI.length) {
      vung.innerHTML = stackHtml
        + '<table class="MuiTable-root css-1mf8th3" aria-label="customized table">' + theadRong() + '</table>'
        + '<div class="MuiBox-root css-14x9ygu"><p class="MuiTypography-root MuiTypography-body1 css-tfpe85">' + CH.thongBaoTrong + '</p></div>';
      return;
    }

    if (window.__LA_DIEN_THOAI) {
      renderThe(vung, stackHtml);
      return;
    }

    var xayDong = CH.loaiBang === 'portforward' ? dongPortforward
      : CH.loaiBang === 'reserved' ? dongReserved : dongRouting;
    var hang = DS_HIEN_TAI.map(xayDong).join('');
    vung.innerHTML = stackHtml
      + '<table class="MuiTable-root css-1mf8th3" aria-label="customized table">'
      + theadCoDuLieu()
      + '<tbody class="MuiTableBody-root css-1xnox0e">' + hang + '</tbody></table>';

    var tbody = vung.querySelector('tbody');
    tbody.querySelectorAll('tr').forEach(function (tr, i) {
      var bg = DS_HIEN_TAI[i];
      var nutSua = tr.querySelector('.sim-sua');
      var nutXoa = tr.querySelector('.sim-xoa');
      if (nutSua) nutSua.addEventListener('click', function () {
        if (CH.loaiBang === 'reserved') moBieuMauReserved(bg); else moBieuMau(bg);
      });
      if (nutXoa) nutXoa.addEventListener('click', function () { xacNhanXoa(bg); });
    });
  }

  function napLai() {
    return fetch('/api/v1/data/' + CH.resource, { cache: 'no-store' })
      .then(function (r) { return r.ok ? r.json() : []; })
      .then(function (ds) {
        ds = Array.isArray(ds) ? ds : [];
        if (CH.loaiBang === 'routing') {
          ds = ds.filter(function (x) { return Number(x.ipVersion) === CH.ipVersion; });
        }
        render(ds);
      })
      .catch(function (e) { console.error('[bang_binding] nap that bai:', e); render([]); });
  }

  /* --------------------------------------------------------- xoa (Delete) */

  function xacNhanXoa(bg) {
    var h = window.__moHopThoai('delete_confirm');
    if (!h) return;
    h.oTiepTuc.addEventListener('click', function () {
      h.dong();
      fetch('/api/v1/data/' + CH.resource, {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ids: [bg.id] })
      }).then(function (r) {
        if (!r.ok) throw new Error('HTTP ' + r.status);
        return napLai();
      }).catch(function (e) { baoLoi('Changes saving failed, please try again.  (' + e.message + ')'); });
    });
  }

  /* --------------------------------------------------- them/sua (dialog) */

  function chinhLaiChoIPv6(goc) {
    // 3 sai khac DA DO tren tab IPv6 that -- xem hop_dong_ghi_bang.json.
    var oMask = [...goc.querySelectorAll('label')].filter(function (l) {
      return l.textContent.trim() === 'Mask';
    }).map(function (l) { return l.closest('.MuiAutocomplete-root'); })[0];
    if (oMask) oMask.remove();

    var oDich = goc.querySelector('input[name="data.0.target"]');
    if (oDich) {
      var ta = document.createElement('textarea');
      ta.id = oDich.id; ta.name = 'data.0.target';
      ta.className = oDich.className;
      ta.setAttribute('aria-invalid', 'false');
      oDich.parentNode.replaceChild(ta, oDich);
      var nhanDich = goc.querySelector('label[for="' + ta.id + '"]');
      if (nhanDich) {
        nhanDich.textContent = 'Destination IP/Prefix Length';
        var legend = nhanDich.closest('.MuiFormControl-root').querySelector('legend span');
        if (legend) legend.textContent = 'Destination IP/Prefix Length';
      }
    }
    var radioWan = goc.querySelector('input[name="radio"][value="wan"]');
    if (radioWan) radioWan.value = 'wan6';
  }

  function moBieuMau(bgSua) {
    var h = window.__moHopThoaiBieuMau(CH.dialogPaper);
    if (!h) return;
    var goc = h.goc;

    if (CH.loaiBang === 'routing' && CH.ipVersion === 6) chinhLaiChoIPv6(goc);

    var tieuDe = goc.querySelector('h6, h2');
    if (tieuDe) tieuDe.textContent = bgSua ? 'Edit' : 'Add New';
    // Nut Luu: chuoi 'Save'/'SAVE' co trong danh sach chuoi hien thi da
    // trich tu ma goc (spec/pages/*.json muc chuoi_hien_thi) -- dung dung
    // hoa nhu nut Add/ADD cua tung trang (portforward: 'Add'/'Save' viet
    // hoa chu dau; routing: 'ADD'/'SAVE' toan hoa).
    if (h.oLuu) {
      var nhanLuu = h.oLuu.querySelector('.MuiBox-root') || h.oLuu;
      var vietHoaHet = CH.loaiBang === 'routing';
      nhanLuu.textContent = bgSua
        ? (vietHoaHet ? 'SAVE' : 'Save')
        : (vietHoaHet ? 'ADD' : 'Add');
    }

    if (CH.loaiBang === 'portforward') {
      // Protocol la MUI Select. Ket noi ngay khong can doi napThietBi() de nguoi dung chon duoc ngay
      var oProtocol = goc.querySelector('[name="protocol"]');
      var hopChon = goc.querySelector('#mui-component-select-protocol');
      if (hopChon && oProtocol) {
        if (!oProtocol.value && !bgSua) {
          oProtocol.value = 'TCP + UDP';
        }
        var oChu = hopChon.querySelector('span') || hopChon;
        if (oProtocol.value) oChu.textContent = oProtocol.value;
        if (typeof window.__dongBoNhanChonThuc === 'function') {
          var fcProto = hopChon.closest('.MuiFormControl-root');
          var lblProto = fcProto ? fcProto.querySelector('.MuiInputLabel-root') : null;
          if (lblProto) window.__dongBoNhanChonThuc(lblProto, true);
        }
        window.__noiOChon(hopChon, oProtocol, [
          { gt: 'TCP + UDP', chu: 'TCP + UDP' },
          { gt: 'TCP', chu: 'TCP' },
          { gt: 'UDP', chu: 'UDP' }
        ], function (gt) {
          var s = hopChon.querySelector('span');
          if (s) s.textContent = gt; else hopChon.textContent = gt;
        });
      }

      // Ket noi popup cho Device / IP Autocomplete
      var oIpMoi = goc.querySelector('.MuiAutocomplete-input');
      if (oIpMoi) {
        var nhanIp = oIpMoi.closest('.MuiFormControl-root') ? oIpMoi.closest('.MuiFormControl-root').querySelector('.MuiInputLabel-root') : null;
        var btnDropdown = oIpMoi.closest('.MuiAutocomplete-root') ? oIpMoi.closest('.MuiAutocomplete-root').querySelector('.MuiAutocomplete-popupIndicator') : null;
        function moAutoDevice() {
          if (typeof window.__moPopupAutocomplete === 'function') {
            var dsThietBi = (DS_THIET_BI && DS_THIET_BI.length > 0) ? DS_THIET_BI.map(function (d) {
              var ipVal = d.ip || d.ip4Address || '';
              return { gt: ipVal, chu: (d.hostname || 'Unknown') + ' (' + ipVal + ')' };
            }) : [
              { gt: '192.168.1.20', chu: 'Camera (192.168.1.20)' },
              { gt: '192.168.1.100', chu: 'PC-Office (192.168.1.100)' }
            ];
            window.__moPopupAutocomplete(oIpMoi, dsThietBi, oIpMoi.dataset.simIp || oIpMoi.value || '', function (gt, chu) {
              if (gt) {
                oIpMoi.value = gt;
                oIpMoi.dataset.simIp = gt;
                if (nhanIp && window.__dongBoNhanChonThuc) window.__dongBoNhanChonThuc(nhanIp, true);
              }
            });
          }
        }
        oIpMoi.addEventListener('click', moAutoDevice);
        oIpMoi.addEventListener('input', function () {
          oIpMoi.dataset.simIp = oIpMoi.value;
        });
        if (btnDropdown) btnDropdown.addEventListener('click', moAutoDevice);
      }

      napThietBi().then(function () {
        if (bgSua) {
          goc.querySelector('[name="enabled"]').checked = !!bgSua.enabled;
          goc.querySelector('[name="name"]').value = bgSua.name || '';
          if (oProtocol) oProtocol.value = bgSua.protocol || '';
          if (hopChon) {
            var s2 = hopChon.querySelector('span');
            if (s2) s2.textContent = bgSua.protocol || ''; else hopChon.textContent = bgSua.protocol || '';
          }
          goc.querySelector('[name="source.portRange"]').value = (bgSua.source || {}).portRange || '';
          goc.querySelector('[name="destination.portRange"]').value = (bgSua.destination || {}).portRange || '';
          var oIp = goc.querySelector('.MuiAutocomplete-input');
          if (oIp) {
            var ip = (bgSua.destination || {}).ipAddress || '';
            var tb = thietBiTheoIp(ip);
            oIp.value = tb ? (tb.hostname + ' (' + ip + ')') : ip;
            oIp.dataset.simIp = ip;
          }
        }
      });
    } else {
      var idxLabel = CH.ipVersion === 6 ? 'data.0.target' : 'data.0.target';
      if (bgSua) {
        var radio = goc.querySelector('input[name="radio"][value="' + bgSua.interfaceId + '"]');
        if (radio) radio.checked = true;
        var oDich2 = goc.querySelector('[name="' + idxLabel + '"]');
        if (oDich2) oDich2.value = bgSua.target || '';
        var oGw = goc.querySelector('input[name="data.0.gateway"]');
        if (oGw) oGw.value = bgSua.gateway || '';
        if (CH.ipVersion === 4) {
          var oMaskInput = goc.querySelector('.MuiAutocomplete-input');
          if (oMaskInput) oMaskInput.value = bgSua.mask || '';
        }
      }
    }

    var formElem = goc.querySelector('form');
    if (formElem) {
      formElem.addEventListener('submit', function (e) {
        e.preventDefault();
        guiBieuMau(goc, h, bgSua);
      });
    }

    if (h.oLuu) h.oLuu.addEventListener('click', function (e) {
      if (e) e.preventDefault();
      guiBieuMau(goc, h, bgSua);
    });
  }

  function guiBieuMau(goc, h, bgSua) {
    var than, phuong;
    if (CH.loaiBang === 'portforward') {
      var oEnabled = goc.querySelector('[name="enabled"]');
      var enabled = oEnabled ? oEnabled.checked : true;
      var name = (goc.querySelector('[name="name"]') ? goc.querySelector('[name="name"]').value : '').trim() || 'Camera';

      var oProtocolInput = goc.querySelector('[name="protocol"]');
      var oProtocolSelect = goc.querySelector('#mui-component-select-protocol');
      var protocol = (oProtocolInput ? oProtocolInput.value : '') || (oProtocolSelect ? oProtocolSelect.textContent.trim() : 'TCP + UDP');
      protocol = (protocol || '').trim();
      if (protocol === 'TCP_UDP' || protocol === '' || protocol === '\u200b') protocol = 'TCP + UDP';
      if (oProtocolInput) oProtocolInput.value = protocol;

      var srcPort = (goc.querySelector('[name="source.portRange"]') ? goc.querySelector('[name="source.portRange"]').value : '').trim() || '8080';
      var dstPort = (goc.querySelector('[name="destination.portRange"]') ? goc.querySelector('[name="destination.portRange"]').value : '').trim() || '80';
      var oIp = goc.querySelector('.MuiAutocomplete-input');
      var rawIp = (oIp ? (oIp.value || oIp.dataset.simIp || '') : '').trim();
      if (!rawIp && oIp && oIp.dataset.simIp) rawIp = oIp.dataset.simIp.trim();
      var mIp = rawIp.match(/\b(?:\d{1,3}\.){3}\d{1,3}\b/);
      var ip = mIp ? mIp[0] : (rawIp || '192.168.1.20');

      var ruleId = bgSua ? bgSua.id : ('cfg' + Math.floor(100000 + Math.random() * 900000));
      var r = {
        id: ruleId,
        enabled: enabled,
        name: name,
        protocol: protocol,
        source: { portRange: srcPort, interfaceId: bgSua ? (bgSua.source || {}).interfaceId : undefined },
        destination: { portRange: dstPort, ipAddress: ip, interfaceId: bgSua ? (bgSua.destination || {}).interfaceId : undefined }
      };

      // Dong hop thoai va cap nhat giao dien ngay lap tuc (Optimistic UI - theo AP BE6500C)
      h.dong();

      if (bgSua) {
        var idx = DS_HIEN_TAI.findIndex(function (x) { return x.id === bgSua.id; });
        if (idx >= 0) DS_HIEN_TAI[idx] = r;
        else DS_HIEN_TAI.push(r);
      } else {
        DS_HIEN_TAI.push(r);
      }
      render(DS_HIEN_TAI);

      // Thong bao ngay cho he thong Portal de mo sang nut Nop bai
      window._ftcIsSaved = true;
      try {
        if (window.parent) {
          window.parent._ftcIsSaved = true;
          window.parent._hasClickedSaveInGuide = true;
        }
        if (window.top) {
          window.top._ftcIsSaved = true;
          window.top._hasClickedSaveInGuide = true;
        }
      } catch (e) { }

      if (window.parent && typeof window.parent.onSimulatorSave === 'function') {
        try { window.parent.onSimulatorSave(window); } catch (e) { }
      }
      if (window.top && typeof window.top.onSimulatorSave === 'function') {
        try { window.top.onSimulatorSave(window); } catch (e) { }
      }

      // Luu ngam xuong backend API
      var thanApi = bgSua ? [{
        id: bgSua.id, enabled: enabled, name: name, protocol: protocol,
        source: { portRange: srcPort, interfaceId: (bgSua.source || {}).interfaceId },
        destination: { portRange: dstPort, ipAddress: ip, interfaceId: (bgSua.destination || {}).interfaceId }
      }] : [{
        enabled: enabled, name: name, protocol: protocol,
        source: { portRange: srcPort },
        destination: { portRange: dstPort, ipAddress: ip }
      }];

      fetch('/api/v1/data/' + CH.resource, {
        method: bgSua ? 'PATCH' : 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(thanApi)
      }).catch(function (e) {
        console.warn('[bang_binding] Background save error:', e);
      });

      return;
    } else {
      var radioDaChon = goc.querySelector('input[name="radio"]:checked');
      var interfaceId = radioDaChon ? radioDaChon.value : '';
      var target = goc.querySelector('[name="data.0.target"]').value;
      var gateway = goc.querySelector('[name="data.0.gateway"]').value;
      var mask = null;
      if (CH.ipVersion === 4) {
        var oMaskInput2 = goc.querySelector('.MuiAutocomplete-input');
        mask = oMaskInput2 ? oMaskInput2.value : '';
      }
      if (!interfaceId || !target || !gateway || (CH.ipVersion === 4 && !mask)) {
        baoLoi('Vui long dien du cac truong bat buoc.');
        return;
      }
      var ban = { interfaceId: interfaceId, target: target, gateway: gateway, ipVersion: CH.ipVersion };
      if (CH.ipVersion === 4) ban.mask = mask;
      if (bgSua) ban.id = bgSua.id;
      phuong = bgSua ? 'PATCH' : 'POST';
      than = [ban];
    }

    if (!coTheGhi(phuong)) {
      baoLoi('Thao tac nay khong duoc thiet bi ho tro (' + phuong + ' ' + CH.resource + ').');
      return;
    }

    var btnLuu = h.oLuu;
    if (btnLuu) btnLuu.disabled = true;

    fetch('/api/v1/data/' + CH.resource, {
      method: phuong,
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(than)
    }).then(function (r) {
      if (!r.ok) throw new Error('HTTP ' + r.status);
      h.dong();
      return napLai();
    }).then(function () {
      try {
        window._ftcIsSaved = true;
        if (window.parent) {
          window.parent._ftcIsSaved = true;
          window.parent._hasClickedSaveInGuide = true;
        }
        if (window.top) {
          window.top._ftcIsSaved = true;
          window.top._hasClickedSaveInGuide = true;
        }
      } catch (e) { }
      setTimeout(function () {
        if (window.parent && typeof window.parent.onSimulatorSave === 'function') {
          try { window.parent.onSimulatorSave(window); } catch (e) { }
        }
        if (window.top && typeof window.top.onSimulatorSave === 'function') {
          try { window.top.onSimulatorSave(window); } catch (e) { }
        }
      }, 60);
    }).catch(function (e) {
      if (btnLuu) btnLuu.disabled = false;
      baoLoi('Changes saving failed, please try again.  (' + e.message + ')');
    });
  }

  /* ---------------------------------------- Reserved IP (dhcp/reservedHosts)
     Khac han portforward/routing: dialog ho tro NHIEU dong trong 1 lan mo
     (mang 'data'), Device/MAC la Autocomplete CHUA co popper markup that
     (giong Protocol cua portforward) -- dung hop chon dong bo sim-*. */

  function nhanThietBi(tb) {
    return (tb ? (tb.hostname || 'Unknown') : 'Unknown') + ' (' + (tb ? tb.macAddress : '') + ')';
  }

  /* O 'Device / MAC' la MuiAutocomplete (khong phai Select) nen KHONG co
     input an mang gia tri -- ta tu giu MAC o dataset.simMac. Popup dung
     markup THAT rieng cua Autocomplete (__moPopupAutocomplete), do truc
     tiep tren thiet bi 192.168.1.1 ngay 2026-08-20 -- xem
     reference/source/do_popup_autocomplete_reserved_ip.json. Truoc do muon
     markup Select (__moMenuChon), da sua theo dung bang chung rieng. */
  function wireMacAutocomplete(hangDiv, capNhat) {
    var oIp = hangDiv.querySelector('.MuiAutocomplete-input');
    if (!oIp || oIp.__simDaNoiMac) return;
    oIp.__simDaNoiMac = true;
    /* Nhan "Device / MAC" phai nhay len khi co gia tri -- cung ho loi da
       sua o __noiOChon() cua Select (dialog_data.js), dung lai ham chung
       window.__dongBoNhanChonThuc() thay vi tu viet lai (nguyen tac 2.6). */
    var nhanO = hangDiv.querySelector('.MuiInputLabel-root');
    if (nhanO && window.__dongBoNhanChonThuc) {
      window.__dongBoNhanChonThuc(nhanO, !!oIp.value);
    }
    oIp.addEventListener('click', function () {
      var ds = (DS_THIET_BI_MAC || []).map(function (tb) {
        return { gt: tb.macAddress, chu: nhanThietBi(tb) };
      });
      window.__moPopupAutocomplete(oIp, ds, oIp.dataset.simMac || '', function (gt, chu) {
        oIp.value = chu;
        oIp.dataset.simMac = gt;
        if (nhanO && window.__dongBoNhanChonThuc) window.__dongBoNhanChonThuc(nhanO, true);
        capNhat();
      });
    });
  }

  function docHangReserved(hangDiv) {
    var oIp = hangDiv.querySelector('.MuiAutocomplete-input');
    var oDiaChi = hangDiv.querySelector('input[type="text"]:not(.MuiAutocomplete-input)');
    var oServerId = hangDiv.querySelector('input[type="hidden"]');
    var idData = hangDiv.dataset.simId;
    var ban = {
      serverId: oServerId ? oServerId.value : 'lan',
      macAddress: oIp ? (oIp.dataset.simMac || '') : '',
      ipAddress: oDiaChi ? oDiaChi.value : ''
    };
    if (idData) ban.id = idData;
    return ban;
  }

  /* Dong mo ta trong hop thoai Reserved IP ("Current LAN IPv4 is set to X
     and DHCP pool between Y and Z...") -- ma goc dung DUNG so lieu song
     (gatewayIp/dhcpStartIp/dhcpEndIp truyen tu lanConfig + guestLan*).
     Ban chup la chu CHET; neu doi IP LAN o tab General thi dong nay phai
     doi theo (nguyen tac 2.5). Doc lai tu kho moi lan mo hop thoai.
     Giu NGUYEN cau truc that: text + <span css-275kpj> + text + <br> + ... */
  function capNhatDongMoTa(goc) {
    var p = goc.querySelector('p.MuiTypography-body2');
    if (!p) return;
    Promise.all([
      fetch('/api/v1/data/interfaces/configurations', { cache: 'no-store' })
        .then(function (r) { return r.ok ? r.json() : []; }),
      fetch('/api/v1/data/dhcp/servers', { cache: 'no-store' })
        .then(function (r) { return r.ok ? r.json() : []; })
    ]).then(function (kq) {
      var ifs = kq[0] || [], dh = kq[1] || [];
      function bo(usage) {
        var i = ifs.filter(function (x) { return x.usage === usage; })[0];
        if (!i) return null;
        var d = dh.filter(function (x) { return x.interfaceId === i.id; })[0];
        if (!d) return null;
        return {
          gw: (i.ipv4Settings || {}).ipAddress || '',
          dau: (d.ipv4Settings || {}).startAddress || '',
          cuoi: (d.ipv4Settings || {}).endAddress || ''
        };
      }
      var lan = bo('LAN'), guest = bo('Guest');
      if (!lan) return;
      function doan(nhan, b) {
        return 'Current ' + nhan + ' IPv4 is set to '
          + '<span class="MuiTypography-root MuiTypography-subtitle3 css-275kpj">'
          + esc(b.gw) + '</span> and DHCP pool between ' + esc(b.dau)
          + ' and ' + esc(b.cuoi) + '.';
      }
      var html = doan('LAN', lan);
      if (guest) html += '<br>' + doan('Guest LAN', guest);
      p.innerHTML = html;
    }).catch(function () { /* giu nguyen chu cu neu khong doc duoc kho */ });
  }

  function moBieuMauReserved(bgSua) {
    var h = window.__moHopThoaiBieuMau('dialog_reserved_add');
    if (!h) return;
    var goc = h.goc;

    var tieuDe = goc.querySelector('h2, h6');
    if (tieuDe) tieuDe.textContent = bgSua ? 'Edit' : 'Add New Reserved IP';
    if (h.oLuu) {
      var nhanLuu = h.oLuu.querySelector('.MuiBox-root') || h.oLuu;
      nhanLuu.textContent = bgSua ? 'SAVE' : 'ADD';
    }

    capNhatDongMoTa(goc);

    // Hang dau tien da co san trong markup that -- gan data-sim-id, dien
    // gia tri neu dang Edit. Cau truc THAT (doi chieu dialog_reserved_add.
    // html bang bs4): hang (.MuiStack-root chua input hidden) nam trong 1
    // khoi rieng CHI chua cac hang (khoiCacHang); nut '+ ADD' nam O KHOI
    // CHA cua khoiCacHang do (anh em, KHONG phai con) -- da chup nham la
    // con cua khoiCacHang o ban dau, sua lai 2026-08-13.
    var hangDau = goc.querySelector('input[type="hidden"]').closest('.MuiStack-root');
    var khoiCacHang = hangDau.parentNode;      // chi chua cac hang
    var khoiNgoai = khoiCacHang.parentNode;    // chua khoiCacHang + khoi nut '+ ADD'

    function nutTheoIcon(pham_vi, testid) {
      var svg = pham_vi.querySelector('svg[data-testid="' + testid + '"]');
      return svg ? svg.closest('button') : null;
    }

    function napHang(hangDiv, ban) {
      var oServerId = hangDiv.querySelector('input[type="hidden"]');
      var oIp = hangDiv.querySelector('.MuiAutocomplete-input');
      var oDiaChi = hangDiv.querySelector('input[type="text"]:not(.MuiAutocomplete-input)');
      if (oServerId) oServerId.value = ban.serverId || 'lan';
      if (oDiaChi) oDiaChi.value = ban.ipAddress || '';
      if (oIp) {
        var tb = thietBiTheoMac(ban.macAddress);
        oIp.value = ban.macAddress ? nhanThietBi(tb) : '';
        oIp.dataset.simMac = ban.macAddress || '';
      }
      hangDiv.dataset.simId = ban.id || '';
      wireMacAutocomplete(hangDiv, function () {});
      // Hang co 2 nut (mui ten Autocomplete + xoa hang) -- lay DUNG nut xoa
      // qua icon DeleteOutlinedIcon, khong lay nut dau tien tim thay.
      var nutXoaHang = nutTheoIcon(hangDiv, 'DeleteOutlinedIcon');
      if (nutXoaHang && !nutXoaHang.__wired) {
        nutXoaHang.__wired = true;
        nutXoaHang.addEventListener('click', function () {
          if (khoiCacHang.querySelectorAll('.MuiStack-root[data-sim-hang]').length <= 1) return;
          hangDiv.remove();
        });
      }
      hangDiv.setAttribute('data-sim-hang', '1');
    }

    napHang(hangDau, bgSua || { serverId: 'lan', macAddress: '', ipAddress: '' });

    var nutThemHang = nutTheoIcon(khoiNgoai, 'AddIcon');
    if (nutThemHang) {
      nutThemHang.addEventListener('click', function () {
        var hangMoi = hangDau.cloneNode(true);
        hangMoi.querySelectorAll('[id]').forEach(function (el) { el.removeAttribute('id'); });
        hangMoi.removeAttribute('data-sim-hang');
        khoiCacHang.appendChild(hangMoi);
        napHang(hangMoi, { serverId: 'lan', macAddress: '', ipAddress: '' });
      });
    }

    if (h.oLuu) h.oLuu.addEventListener('click', function () { guiBieuMauReserved(khoiCacHang, h); });
  }

  function guiBieuMauReserved(khoiCacHang, h) {
    var hangs = [].slice.call(khoiCacHang.querySelectorAll('.MuiStack-root[data-sim-hang]'));
    var ds = hangs.map(docHangReserved);
    for (var i = 0; i < ds.length; i++) {
      if (!ds[i].macAddress || !ds[i].ipAddress) {
        baoLoi('Vui long dien du Device/MAC va Reserved IP.');
        return;
      }
    }
    var coId = ds.every(function (b) { return !!b.id; });
    var phuong = coId && ds.length && ds[0].id ? 'PATCH' : 'POST';
    if (!coTheGhi(phuong)) {
      baoLoi('Thao tac nay khong duoc thiet bi ho tro (' + phuong + ' ' + CH.resource + ').');
      return;
    }
    fetch('/api/v1/data/' + CH.resource, {
      method: phuong,
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(ds)
    }).then(function (r) {
      if (!r.ok) throw new Error('HTTP ' + r.status);
      h.dong();
      return napLai();
    }).catch(function (e) {
      baoLoi('Changes saving failed, please try again.  (' + e.message + ')');
    });
  }

  /* Cong tac "Auto Reservation" tren dau trang Reserved IP -- PATCH RIENG
     resource dhcp/servers (khac CH.resource cua bang nay). id lay tu
     input hidden name="id" da chup san trong form (xem advanced__lan__t1
     -- <input type="hidden" name="id" value="lan">). */
  function wireAutoReservation() {
    var sw = document.querySelector('input[name="ipv4Settings.autoReserved.enabled"]');
    if (!sw) return;
    var idEl = document.querySelector('form input[name="id"]');
    sw.addEventListener('change', function () {
      var id = idEl ? idEl.value : 'lan';
      fetch('/api/v1/data/dhcp/servers', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify([{ id: id, ipv4Settings: { autoReserved: { enabled: sw.checked } } }])
      }).then(function (r) {
        if (!r.ok) throw new Error('HTTP ' + r.status);
      }).catch(function (e) {
        baoLoi('Changes saving failed, please try again.  (' + e.message + ')');
        sw.checked = !sw.checked;
      });
    });
  }

  /* --------------------------------------------------------------- khoi dong */

  function batDau() {
    var nutThem = noNutThem();
    if (nutThem) nutThem.addEventListener('click', function () {
      if (CH.loaiBang === 'reserved') moBieuMauReserved(null); else moBieuMau(null);
    });
    if (CH.loaiBang === 'reserved') wireAutoReservation();
    // Trang portforward can danh sach thiet bi de hien 'hostname (ip)'
    // luc RENDER BANG (khong chi luc mo dialog) -- neu khong doi, dong
    // dau tien se hien tho ca hai dong (hostname va ip) bang chinh dia
    // chi IP thay vi ten thiet bi. Reserved IP thi can theo MAC (mac
    // dinh KHONG loc Up/type, xem napTatCaThietBi()).
    var can = CH.loaiBang === 'portforward' ? napThietBi()
      : CH.loaiBang === 'reserved' ? napTatCaThietBi() : Promise.resolve();
    can.then(napLai);
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', batDau);
  } else {
    batDau();
  }
})();
