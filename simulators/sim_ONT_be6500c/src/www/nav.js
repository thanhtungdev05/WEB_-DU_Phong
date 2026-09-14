/* Dieu huong cho ban gia lap BE6500C.
   Giao dien that dung React (khong co the <a href>), nen o day tu gan su kien:
   - Muc menu ben trai -> mo trang tuong ung
   - Tab trong trang   -> mo bien the da chup (<trang>__t<N>.html)
   Nhan dien theo chu hien tren muc menu / thu tu tab. */
(function () {
  var MAP = window.__MAP || {};
  var GROUP = window.__GROUP || {};
  var PAGES = window.__PAGES || [];

  function txt(el) { return (el.textContent || '').replace(/\s+/g, ' ').trim(); }

  function go(file) {
    var baseDir = location.pathname.substring(0, location.pathname.lastIndexOf('/') + 1);
    location.href = baseDir + file + '.html' + location.search;
  }

  function has(file) { return PAGES.indexOf(file) >= 0; }

  // ten trang hien tai, bo hau to __tN
  function baseName() {
    var n = (location.pathname.split('/').pop() || '').replace('.html', '');
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

    var all = sb.querySelectorAll('div,li,span,p');
    for (var i = 0; i < all.length; i++) {
      var e = all[i], t = txt(e);
      if (!t || t.length > 24 || seen.has(t)) continue;
      var kid = e.querySelector('div,li,span,p');
      if (kid && txt(kid) === t) continue;
      seen.add(t);
      out.push({ el: e, text: t, hasIcon: !!e.querySelector('svg') });
    }
    return out;
  }

  function wireMenu() {
    var n = 0;
    menuItems().forEach(function (it) {
      var t = it.text, target = null;
      if (t === 'Advanced') target = it.hasIcon ? GROUP['Advanced'] : 'wifi__advanced';
      else if (MAP[t]) target = MAP[t];
      else if (GROUP[t]) target = GROUP[t];
      else if (t === 'Reboot' || t === 'Log out') {
        it.el.style.cursor = 'pointer';
        it.el.addEventListener('click', function (e) {
          e.stopPropagation();
          alert(t === 'Reboot'
            ? 'Reboot: ban gia lap khong khoi dong lai thiet bi that.'
            : 'Log out: ban gia lap khong co phien dang nhap.');
        });
        return;
      }
      if (!target) return;
      it.el.style.cursor = 'pointer';
      var kids = it.el.querySelectorAll('*');
      for (var k = 0; k < kids.length; k++) {
        kids[k].style.cursor = 'pointer';
      }
      it.el.addEventListener('click', function (e) { e.stopPropagation(); go(target); });
      n++;
    });
    return n;
  }

  /* ---------- 2b. Sidebar mo/thu theo RE CHUOT ---------- */
  function tenTrang() {
    return (location.pathname.split('/').pop() || 'index.html')
      .replace('.html', '');
  }

  function khoaSidebar() {
    var t = tenTrang();
    if (t === 'index' || t === '') t = 'home__overview';
    var goc = t.replace(/__t\d+$/, '');
    var nhom = goc === 'help' ? 'help' : goc.split('__')[0];
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
      wireMenu();   // gan lai click cho markup vua thay
    }

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

    datTrangThai(false);   // thiet bi that: mac dinh thu gon
  }

  /* ---------- 2. Tab trong trang ---------- */
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
    wireSidebarHover();   // tu goi wireMenu() sau moi lan doi markup
    var t = wireTabs();
    console.log('[nav] sidebar: hover mo/thu, tab: ' + t + ' the');
  }
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', init);
  else init();
})();
