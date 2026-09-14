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

  /* ---------- 1. Menu ben trai ---------- */
  function menuItems() {
    var sb = document.querySelector('.css-1nmx4e2');
    if (!sb) return [];
    var out = [];
    var seen = new Set();

    // 1. Uu tien cac dong menu (li) day du hang de click toan bo dong
    var lis = sb.querySelectorAll('li.MuiMenuItem-root, li[role="menuitem"], li');
    for (var i = 0; i < lis.length; i++) {
      var li = lis[i], t = txt(li);
      if (t && t.length <= 24 && !seen.has(t)) {
        seen.add(t);
        out.push({ el: li, text: t, hasIcon: !!li.querySelector('svg') });
      }
    }

    // 2. Cac nhan nhom category (.css-1mtremo, .css-1fdfqlq)
    var cats = sb.querySelectorAll('.css-1mtremo, .css-1fdfqlq');
    for (var j = 0; j < cats.length; j++) {
      var cat = cats[j], tc = txt(cat);
      if (tc && tc.length <= 24 && !seen.has(tc)) {
        seen.add(tc);
        out.push({ el: cat, text: tc, hasIcon: !!cat.querySelector('svg') });
      }
    }

    // 3. Fallback cho cac the text con lai neu co
    if (out.length === 0) {
      var all = sb.querySelectorAll('div,li,span,p');
      for (var k = 0; k < all.length; k++) {
        var e = all[k], te = txt(e);
        if (!te || te.length > 24) continue;
        var kid = e.querySelector('div,li,span,p');
        if (kid && txt(kid) === te) continue;
        var row = e.closest('li, button') || e;
        if (!seen.has(te)) {
          seen.add(te);
          out.push({ el: row, text: te, hasIcon: !!row.querySelector('svg') });
        }
      }
    }
    return out;
  }

  /* Hop thoai Reboot: dung markup THAT (dialog_data.js). Sau khi bam
     "Reboot Now", ban gia lap KHONG khoi dong lai thiet bi that -- bao ro
     dieu do (giong cach techsupport_binding.js cua AP da lam, trung thuc
     ve gioi han cua ban gia lap). */
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

  function wireMenu() {
    var n = 0;
    menuItems().forEach(function (it) {
      var t = it.text, target = null;
      // "Advanced" trung ten: nhom cha /advanced (co icon) vs muc con
      // wifi/advanced (khong icon) -- phan biet giong het thiet bi that.
      if (t === 'Advanced') target = it.hasIcon ? GROUP['Advanced'] : 'wifi__advanced';
      else if (MAP[t]) target = MAP[t];
      else if (GROUP[t]) target = GROUP[t];
      else if (t === 'Reboot') {
        it.el.style.cursor = 'pointer';
        it.el.addEventListener('click', function (e) { e.stopPropagation(); moHopThoaiReboot(); });
        return;
      } else if (t === 'Log out') {
        it.el.style.cursor = 'pointer';
        it.el.addEventListener('click', function (e) {
          e.stopPropagation();
          alert('Log out: ban gia lap khong co phien dang nhap.');
        });
        return;
      }
      if (!target) return;
      it.el.style.cursor = 'pointer';
      // Dam bao moi phan tu con deu co cursor pointer
      var kids = it.el.querySelectorAll('*');
      for (var k = 0; k < kids.length; k++) {
        kids[k].style.cursor = 'pointer';
      }
      it.el.addEventListener('click', function (e) { e.stopPropagation(); go(target); });
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
