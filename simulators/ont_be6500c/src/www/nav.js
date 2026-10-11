/* Dieu huong cho ban gia lap ONT-BE6500C.
   Giao dien that dung React (khong co the <a href>), nen o day tu gan su kien:
   - Muc menu ben trai -> mo trang tuong ung
   - Tab trong trang   -> mo bien the da chup (<trang>__t<N>.html)
   Nhan dien theo chu hien tren muc menu / thu tu tab.
   CAU TRUC GIONG devices/be6500c/src/www/nav.js (da kiem chung) nhung
   khac o: nhom "Advanced" (ONT khong co Ethernet Status/Parental/Timer/
   System Log/Tech Support), va nut Reboot dung HOP THOAI THAT (xem
   dialog_data.js) thay vi chi alert. */
(function () {
  var MAP = window.__MAP || {};
  var GROUP = window.__GROUP || {};
  var PAGES = window.__PAGES || [];

  function txt(el) { return (el.textContent || '').replace(/\s+/g, ' ').trim(); }

  /* GD5: dang o ban dien thoai thi phai di sang file m_*, va phai GIU
     tham so ?dt= (che do ep) khi chuyen trang -- neu khong, trang moi se
     tinh lai theo be ngang cua so va nhay nguoc ve ban kia. */
  var DT = !!window.__LA_DIEN_THOAI;
  var TIEN_TO = 'm_';
  function giuThamSo() {
    var q = (new URLSearchParams(location.search)).get('dt');
    return (q === '0' || q === '1') ? ('?dt=' + q) : '';
  }
  function go(file) {
    var f = file;
    if (DT) {
      var dsDT = window.__PAGES_DT || [];
      // Ban dien thoai co the khong co bien the tab (vd Overview khong co
      // tab tren dien thoai) -> lui ve route goc.
      if (dsDT.indexOf(f) < 0) f = f.replace(/__t\d+$/, '');
      if (dsDT.indexOf(f) < 0) return;      // khong co ban dien thoai
      f = TIEN_TO + f;
    }
    var baseDir = location.pathname.substring(0, location.pathname.lastIndexOf('/') + 1);
    location.href = baseDir + f + '.html' + giuThamSo();
  }
  function has(file) { return PAGES.indexOf(file) >= 0; }

  function baseName() {
    var n = (location.pathname.split('/').pop() || '').replace('.html', '');
    if (n.indexOf(TIEN_TO) === 0) n = n.slice(TIEN_TO.length);
    return n.replace(/__t\d+$/, '');
  }



  function tenNhomHienTai() {
    var t = tenTrang().replace(/__t\d+$/, '');
    if (t === 'index' || t === '') return 'Home';
    var prefix = t.split('__')[0];
    var mapNhom = {
      'home': 'Home',
      'wifi': 'Wi-Fi',
      'network': 'Network',
      'security': 'Security',
      'system': 'System',
      'advanced': 'Advanced',
      'help': 'Help'
    };
    return mapNhom[prefix] || '';
  }

  /* Template collapse markup goc cho 6 nhom chuc nang */
  var CAT_TEMPLATES = {
    'Home': '<div class="MuiCollapse-root MuiCollapse-vertical MuiCollapse-hidden css-1ld0r7j" style="min-height: 0px; height: 0px; display: none;"><div class="MuiCollapse-wrapper MuiCollapse-vertical css-hboir5"><div class="MuiCollapse-wrapperInner MuiCollapse-vertical css-8atqhb"><li class="MuiButtonBase-root MuiMenuItem-root MuiMenuItem-gutters MuiMenuItem-root MuiMenuItem-gutters css-1oa4er1" tabindex="-1" role="menuitem"><p class="MuiTypography-root MuiTypography-body2 css-1t3jziq">Overview</p><span class="MuiTouchRipple-root css-w0pj6f"></span></li><li class="MuiButtonBase-root MuiMenuItem-root MuiMenuItem-gutters MuiMenuItem-root MuiMenuItem-gutters css-1oa4er1" tabindex="-1" role="menuitem"><p class="MuiTypography-root MuiTypography-body2 css-1t3jziq">Topology</p><span class="MuiTouchRipple-root css-w0pj6f"></span></li><li class="MuiButtonBase-root MuiMenuItem-root MuiMenuItem-gutters MuiMenuItem-root MuiMenuItem-gutters css-1oa4er1" tabindex="-1" role="menuitem"><p class="MuiTypography-root MuiTypography-body2 css-1t3jziq">Ethernet Status</p><span class="MuiTouchRipple-root css-w0pj6f"></span></li></div></div></div></div>',
    'Wi-Fi': '<div class="MuiCollapse-root MuiCollapse-vertical MuiCollapse-hidden css-1ld0r7j" style="min-height: 0px; height: 0px; display: none;"><div class="MuiCollapse-wrapper MuiCollapse-vertical css-hboir5"><div class="MuiCollapse-wrapperInner MuiCollapse-vertical css-8atqhb"><li class="MuiButtonBase-root MuiMenuItem-root MuiMenuItem-gutters MuiMenuItem-root MuiMenuItem-gutters css-1oa4er1" tabindex="-1" role="menuitem"><p class="MuiTypography-root MuiTypography-body2 css-1t3jziq">General</p><span class="MuiTouchRipple-root css-w0pj6f"></span></li><li class="MuiButtonBase-root MuiMenuItem-root MuiMenuItem-gutters MuiMenuItem-root MuiMenuItem-gutters css-1oa4er1" tabindex="-1" role="menuitem"><p class="MuiTypography-root MuiTypography-body2 css-1t3jziq">Advanced</p><span class="MuiTouchRipple-root css-w0pj6f"></span></li></div></div></div></div>',
    'Network': '<div class="MuiCollapse-root MuiCollapse-vertical MuiCollapse-hidden css-1ld0r7j" style="min-height: 0px; height: 0px; display: none;"><div class="MuiCollapse-wrapper MuiCollapse-vertical css-hboir5"><div class="MuiCollapse-wrapperInner MuiCollapse-vertical css-8atqhb"><li class="MuiButtonBase-root MuiMenuItem-root MuiMenuItem-gutters MuiMenuItem-root MuiMenuItem-gutters css-1oa4er1" tabindex="-1" role="menuitem"><p class="MuiTypography-root MuiTypography-body2 css-1t3jziq">Port Forwarding</p><span class="MuiTouchRipple-root css-w0pj6f"></span></li><li class="MuiButtonBase-root MuiMenuItem-root MuiMenuItem-gutters MuiMenuItem-root MuiMenuItem-gutters css-1oa4er1" tabindex="-1" role="menuitem"><p class="MuiTypography-root MuiTypography-body2 css-1t3jziq">Speed Test</p><span class="MuiTouchRipple-root css-w0pj6f"></span></li><li class="MuiButtonBase-root MuiMenuItem-root MuiMenuItem-gutters MuiMenuItem-root MuiMenuItem-gutters css-1oa4er1" tabindex="-1" role="menuitem"><p class="MuiTypography-root MuiTypography-body2 css-1t3jziq">Diagnostics</p><span class="MuiTouchRipple-root css-w0pj6f"></span></li></div></div></div></div>',
    'Security': '<div class="MuiCollapse-root MuiCollapse-vertical MuiCollapse-hidden css-1ld0r7j" style="min-height: 0px; height: 0px; display: none;"><div class="MuiCollapse-wrapper MuiCollapse-vertical css-hboir5"><div class="MuiCollapse-wrapperInner MuiCollapse-vertical css-8atqhb"><li class="MuiButtonBase-root MuiMenuItem-root MuiMenuItem-gutters MuiMenuItem-root MuiMenuItem-gutters css-1oa4er1" tabindex="-1" role="menuitem"><p class="MuiTypography-root MuiTypography-body2 css-1t3jziq">Firewall</p><span class="MuiTouchRipple-root css-w0pj6f"></span></li><li class="MuiButtonBase-root MuiMenuItem-root MuiMenuItem-gutters MuiMenuItem-root MuiMenuItem-gutters css-1oa4er1" tabindex="-1" role="menuitem"><p class="MuiTypography-root MuiTypography-body2 css-1t3jziq">Parental Control</p><span class="MuiTouchRipple-root css-w0pj6f"></span></li></div></div></div></div>',
    'System': '<div class="MuiCollapse-root MuiCollapse-vertical MuiCollapse-hidden css-1ld0r7j" style="min-height: 0px; height: 0px; display: none;"><div class="MuiCollapse-wrapper MuiCollapse-vertical css-hboir5"><div class="MuiCollapse-wrapperInner MuiCollapse-vertical css-8atqhb"><li class="MuiButtonBase-root MuiMenuItem-root MuiMenuItem-gutters MuiMenuItem-root MuiMenuItem-gutters css-1oa4er1" tabindex="-1" role="menuitem"><p class="MuiTypography-root MuiTypography-body2 css-1t3jziq">System Settings</p><span class="MuiTouchRipple-root css-w0pj6f"></span></li><li class="MuiButtonBase-root MuiMenuItem-root MuiMenuItem-gutters MuiMenuItem-root MuiMenuItem-gutters css-1oa4er1" tabindex="-1" role="menuitem"><p class="MuiTypography-root MuiTypography-body2 css-1t3jziq">Update &amp; Restore</p><span class="MuiTouchRipple-root css-w0pj6f"></span></li><li class="MuiButtonBase-root MuiMenuItem-root MuiMenuItem-gutters MuiMenuItem-root MuiMenuItem-gutters css-1oa4er1" tabindex="-1" role="menuitem"><p class="MuiTypography-root MuiTypography-body2 css-1t3jziq">User</p><span class="MuiTouchRipple-root css-w0pj6f"></span></li><li class="MuiButtonBase-root MuiMenuItem-root MuiMenuItem-gutters MuiMenuItem-root MuiMenuItem-gutters css-1oa4er1" tabindex="-1" role="menuitem"><p class="MuiTypography-root MuiTypography-body2 css-1t3jziq">Wi-Fi Timer</p><span class="MuiTouchRipple-root css-w0pj6f"></span></li><li class="MuiButtonBase-root MuiMenuItem-root MuiMenuItem-gutters MuiMenuItem-root MuiMenuItem-gutters css-1oa4er1" tabindex="-1" role="menuitem"><p class="MuiTypography-root MuiTypography-body2 css-1t3jziq">Reboot Timer</p><span class="MuiTouchRipple-root css-w0pj6f"></span></li><li class="MuiButtonBase-root MuiMenuItem-root MuiMenuItem-gutters MuiMenuItem-root MuiMenuItem-gutters css-1oa4er1" tabindex="-1" role="menuitem"><p class="MuiTypography-root MuiTypography-body2 css-1t3jziq">System Log</p><span class="MuiTouchRipple-root css-w0pj6f"></span></li><li class="MuiButtonBase-root MuiMenuItem-root MuiMenuItem-gutters MuiMenuItem-root MuiMenuItem-gutters css-1oa4er1" tabindex="-1" role="menuitem"><p class="MuiTypography-root MuiTypography-body2 css-1t3jziq">Tech Support Info</p><span class="MuiTouchRipple-root css-w0pj6f"></span></li></div></div></div></div>',
    'Advanced': '<div class="MuiCollapse-root MuiCollapse-vertical MuiCollapse-hidden css-1ld0r7j" style="min-height: 0px; height: 0px; display: none;"><div class="MuiCollapse-wrapper MuiCollapse-vertical css-hboir5"><div class="MuiCollapse-wrapperInner MuiCollapse-vertical css-8atqhb"><li class="MuiButtonBase-root MuiMenuItem-root MuiMenuItem-gutters MuiMenuItem-root MuiMenuItem-gutters css-1oa4er1" tabindex="-1" role="menuitem"><p class="MuiTypography-root MuiTypography-body2 css-1t3jziq">WAN</p><span class="MuiTouchRipple-root css-w0pj6f"></span></li><li class="MuiButtonBase-root MuiMenuItem-root MuiMenuItem-gutters MuiMenuItem-root MuiMenuItem-gutters css-1oa4er1" tabindex="-1" role="menuitem"><p class="MuiTypography-root MuiTypography-body2 css-1t3jziq">LAN</p><span class="MuiTouchRipple-root css-w0pj6f"></span></li><li class="MuiButtonBase-root MuiMenuItem-root MuiMenuItem-gutters MuiMenuItem-root MuiMenuItem-gutters css-1oa4er1" tabindex="-1" role="menuitem"><p class="MuiTypography-root MuiTypography-body2 css-1t3jziq">Dynamic DNS</p><span class="MuiTouchRipple-root css-w0pj6f"></span></li><li class="MuiButtonBase-root MuiMenuItem-root MuiMenuItem-gutters MuiMenuItem-root MuiMenuItem-gutters css-1oa4er1" tabindex="-1" role="menuitem"><p class="MuiTypography-root MuiTypography-body2 css-1t3jziq">Static Routing</p><span class="MuiTouchRipple-root css-w0pj6f"></span></li><li class="MuiButtonBase-root MuiMenuItem-root MuiMenuItem-gutters MuiMenuItem-root MuiMenuItem-gutters css-1oa4er1" tabindex="-1" role="menuitem"><p class="MuiTypography-root MuiTypography-body2 css-1t3jziq">DMZ</p><span class="MuiTouchRipple-root css-w0pj6f"></span></li><li class="MuiButtonBase-root MuiMenuItem-root MuiMenuItem-gutters MuiMenuItem-root MuiMenuItem-gutters css-1oa4er1" tabindex="-1" role="menuitem"><p class="MuiTypography-root MuiTypography-body2 css-1t3jziq">UPnP</p><span class="MuiTouchRipple-root css-w0pj6f"></span></li><li class="MuiButtonBase-root MuiMenuItem-root MuiMenuItem-gutters MuiMenuItem-root MuiMenuItem-gutters css-1oa4er1" tabindex="-1" role="menuitem"><p class="MuiTypography-root MuiTypography-body2 css-1t3jziq">TCPDump</p><span class="MuiTouchRipple-root css-w0pj6f"></span></li></div></div></div></div>'
  };

  /* Dam bao tat ca cac category deu co the collapse de co the dong/mo tai cho */
  function damBaoMuiCollapse(sb) {
    var container = sb.querySelector('.css-1eazcgd');
    if (!container) return;
    var boxes = container.children;
    for (var i = 0; i < boxes.length; i++) {
      var box = boxes[i];
      var hdr = box.querySelector('.css-1mtremo, .css-1fdfqlq');
      if (!hdr) continue;
      var t = txt(hdr);
      var collapse = box.querySelector('.MuiCollapse-root');
      if (!collapse && CAT_TEMPLATES[t]) {
        box.insertAdjacentHTML('beforeend', CAT_TEMPLATES[t]);
      }
    }
  }

  function moHopThoaiReboot() {
    if (!window.__moHopThoai) { alert('Reboot: ban gia lap khong khoi dong lai thiet bi that.'); return; }
    var h = window.__moHopThoai('reboot_confirm');
    if (!h) { alert('Reboot: ban gia lap khong khoi dong lai thiet bi that.'); return; }
    if (h.oTiepTuc) h.oTiepTuc.addEventListener('click', function () {
      h.dong();
      alert('Thiet bi that se chuyen sang man hinh "Equipment Restarting..." roi khoi dong lai.\n'
        + 'Ban gia lap khong co phan cung that de khoi dong lai.');
    });
  }

  /* ---------- 1. Menu ben trai ---------- */
  function wireMenu() {
    var sb = document.querySelector('.css-1nmx4e2');
    if (!sb) return 0;
    var n = 0;

    // 1. Uu tien cac dong submenu (li) de chuyen trang
    var lis = sb.querySelectorAll('li.MuiMenuItem-root, li[role="menuitem"], li');
    lis.forEach(function (li) {
      var t = txt(li);
      if (!t || t.length > 24) return;
      var target = null;
      var box = li.closest('.MuiBox-root');
      var headerText = box ? txt(box.querySelector('h6') || {}) : '';
      if (t === 'Advanced' && headerText === 'Wi-Fi') {
        target = 'wifi__advanced';
      } else if (t === 'Routing' || t === 'Static Routing') {
        target = 'advanced__routing';
      } else if (t === 'DDNS' || t === 'Dynamic DNS') {
        target = 'advanced__ddns';
      } else if (MAP[t]) {
        target = MAP[t];
      } else if (t === 'Ethernet Status') {
        target = 'home__lanstatus';
      }

      if (target) {
        li.style.cursor = 'pointer';
        var kids = li.querySelectorAll('*');
        for (var k = 0; k < kids.length; k++) { kids[k].style.cursor = 'pointer'; }
        li.addEventListener('click', function (e) {
          e.stopPropagation();
          go(target);
        });
        n++;
      }
    });

    // 2. Cac nhan nhom category (.css-1mtremo, .css-1fdfqlq) - Dong/mo tai cho (in-place accordion)
    var hdrs = sb.querySelectorAll('.css-1mtremo, .css-1fdfqlq');
    hdrs.forEach(function (hdr) {
      var t = txt(hdr);
      if (!t || t.length > 24) return;
      var box = hdr.closest('.MuiBox-root') || hdr.parentElement;
      var collapse = box ? box.querySelector('.MuiCollapse-root') : null;

      hdr.style.cursor = 'pointer';
      var kids = hdr.querySelectorAll('*');
      for (var k = 0; k < kids.length; k++) { kids[k].style.cursor = 'pointer'; }

      hdr.addEventListener('click', function (e) {
        e.stopPropagation();
        if (collapse) {
          var isHidden = collapse.style.display === 'none' || collapse.classList.contains('MuiCollapse-hidden');
          if (isHidden) {
            collapse.style.display = '';
            collapse.style.height = '';
            collapse.classList.remove('MuiCollapse-hidden');
            collapse.classList.add('MuiCollapse-entered');
            var icon = hdr.querySelector('svg');
            if (icon) {
              icon.classList.remove('categoryIcon');
              icon.classList.add('currentCategoryIcon');
            }
            var h6 = hdr.querySelector('h6');
            if (h6) {
              h6.classList.remove('css-1i4skbg');
              h6.classList.add('css-bznab9');
            }
          } else {
            collapse.style.display = 'none';
            collapse.classList.remove('MuiCollapse-entered');
            collapse.classList.add('MuiCollapse-hidden');
            if (t !== tenNhomHienTai()) {
              var icon = hdr.querySelector('svg');
              if (icon) {
                icon.classList.remove('currentCategoryIcon');
                icon.classList.add('categoryIcon');
              }
              var h6 = hdr.querySelector('h6');
              if (h6) {
                h6.classList.remove('css-bznab9');
                h6.classList.add('css-1i4skbg');
              }
            }
          }
          return;
        }
        if (t === 'Reboot') {
          moHopThoaiReboot();
          return;
        }
        if (t === 'Log out') {
          alert('Log out: ban gia lap khong co phien dang nhap.');
          return;
        }
        if (t === 'Help') {
          go('help');
          return;
        }
      });
      n++;
    });

    return n;
  }

  /* ---------- 2. Sidebar mo/thu theo RE CHUOT ----------
     Do truc tiep tren ONT-BE6500C that 2026-08-12 (xem
     reference/source/sidebar_2_trang_thai.json). Cung co che voi AP:
       - Mac dinh THU GON (52px). React gan onMouseEnter/onMouseLeave len
         .css-1hiau50 (doc tu __reactProps$). isExpand -> 160px.
       - Sidebar CHI hien tren 20/21 route -- home/wizard KHONG CO sidebar
         (luong toan man hinh, kiem chung 3/3 lan -- xem ISSUES.md
         2026-08-12). Ban gia lap KHONG dung trang home/wizard vi chua co
         bang chung noi dung that.

     Ban gia lap la HTML tinh, hoan doi giua HAI ban markup THAT da chup
     san (window.__SB_GON theo NHOM / window.__SB_MO theo TUNG TRANG,
     trong sidebar_data.js) -- khong phai an/hien bang CSS. */
  function tenTrang() {
    return (location.pathname.split('/').pop() || 'index.html').replace('.html', '');
  }

  // status/devices khong nam trong menu that nhung ban GON cua no GIONG
  // HET nhom 'home' (da doi chieu tung ky tu, xem tao_sidebar_data.py).
  var NHOM_DAC_BIET = { status__devices: 'home' };

  function khoaSidebar() {
    var t = tenTrang();
    if (t === 'index' || t === '') t = 'home__overview';
    var goc = t.replace(/__t\d+$/, '');
    var nhom = NHOM_DAC_BIET[goc] || (goc === 'help' ? 'help' : goc.split('__')[0]);
    return { mo: goc, gon: nhom };
  }

  function wireSidebarHover() {
    var GON = window.__SB_GON || {}, MO = window.__SB_MO || {};
    var k = khoaSidebar();
    if (!GON[k.gon] || !MO[k.mo]) {
      console.warn('[nav] thieu markup sidebar cho', k);
      return;
    }
    var oNgoai = document.querySelector('.css-1nmx4e2');
    if (!oNgoai) return;

    var hoverTimer = null;
    function datTrangThai(dangMo) {
      oNgoai.innerHTML = dangMo ? MO[k.mo] : GON[k.gon];
      if (dangMo) {
        damBaoMuiCollapse(oNgoai);
      }
      wireMenu();
    }

    /* Gan tren phan tu CHA .css-1nmx4e2 (khong phai .css-1hiau50 -- phan
       tu do bi THAY MOI moi lan doi trang thai, se mat chuoi mouseleave.
       Loi nay AP da mac va anh Huynn phat hien 2026-08-11.) */
    oNgoai.addEventListener('mouseenter', function () {
      if (hoverTimer) { clearTimeout(hoverTimer); hoverTimer = null; }
      datTrangThai(true);
    });
    oNgoai.addEventListener('mouseleave', function () {
      if (hoverTimer) clearTimeout(hoverTimer);
      hoverTimer = setTimeout(function () {
        datTrangThai(false);
      }, 200);
    });
    oNgoai.addEventListener('click', function () {
      var isExpanded = oNgoai.querySelector('.isExpand');
      if (!isExpanded) {
        if (hoverTimer) { clearTimeout(hoverTimer); hoverTimer = null; }
        datTrangThai(true);
      }
    });

    datTrangThai(false);
  }

  /* ---------- 3. Tab trong trang ---------- */
  function wireTabs() {
    var base = baseName();
    var tabs = document.querySelectorAll('[role="tab"]');
    var n = 0;
    for (var i = 0; i < tabs.length; i++) {
      (function (idx, el) {
        var variant = base + '__t' + idx;
        var target = has(variant) ? variant : (idx === 0 && has(base) ? base : null);
        el.style.cursor = 'pointer';
        el.addEventListener('click', function (e) {
          e.stopPropagation();
          if (target) go(target);
          else alert('Tab "' + txt(el) + '" chua duoc chup tu thiet bi that.');
        });
        if (target) n++;
      })(i, tabs[i]);
    }
    return n;
  }

  function init() {
    wireSidebarHover();
    var t = wireTabs();
    console.log('[nav] ONT-BE6500C: sidebar hover mo/thu, tab: ' + t + ' the');
  }
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', init);
  else init();
})();
