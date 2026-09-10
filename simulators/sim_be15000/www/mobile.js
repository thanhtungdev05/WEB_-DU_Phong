/* Giao dien MOBILE cho ban gia lap H6701Q V3 (BE15000).
   Thiet bi that dung JS (script inline da bi strip) de doi menu sang dang
   "hamburger" khi man hinh hep. Lam lai CHINH XAC theo ma goc trich tu thiet bi:

   - Nguong: window.innerWidth <= 1020  (ham setMaxScreenWidth cua thiet bi = 1020).
   - Khi hep (handleMenuByRatio): an #mainNavigator (thanh nav tren cung), an
     #timeArea va hien #timeArea_footer, hien .more-menu-icon (nut hamburger).
   - Bam hamburger: hien #menu-container (drawer), dung cay menu vao #menu-results
     bang creatMenu -> ul.menu-list > li.menu-item.(firstMenu|secondMenu|threeMenu)
       > a[id]. Muc co con: class 'has-children' + div con (submenu/lastmenu).
   - Bam muc co con: bat/tat menu con. Bam muc la: dieu huong + dong drawer.
   - Bam #menu-close: dong drawer.
   CSS cho cac lop nay (.firstMenu/.menu-list/#menu-container...) da co san trong
   CSS goc da chup, nen chi can gan hanh vi. */
(function () {
  var BREAK = 1020;
  // dang o www/pages/<x>.html hay o www/login.html? (giong nav.js)
  var trongThuMucPages = /\/pages\//.test(location.pathname);

  function el(id) { return document.getElementById(id); }
  function q(sel) { return document.querySelector(sel); }
  function hienEl(e, mo) { if (e) e.style.display = mo ? '' : 'none'; }

  function narrow() { return window.innerWidth <= BREAK; }

  /* handleMenuByRatio: doi che do theo be rong */
  function apply() {
    var nav = el('mainNavigator');
    var ham = q('.more-menu-icon');
    var timeArea = el('timeArea');
    var timeFooter = el('timeArea_footer');
    if (narrow()) {
      hienEl(nav, false);
      hienEl(ham, true);
      hienEl(timeArea, false);
      hienEl(timeFooter, true);
    } else {
      hienEl(nav, true);
      hienEl(ham, false);
      hienEl(timeArea, true);
      hienEl(timeFooter, false);
      dongDrawer();
    }
  }

  function dongDrawer() { hienEl(el('menu-container'), false); }

  /* creatMenu: dung cay menu (giong ham goc) */
  function creatMenu(menuData, parent, level) {
    var ul = document.createElement('ul');
    ul.className = 'menu-list';
    menuData.forEach(function (item) {
      var li = document.createElement('li');
      li.className = 'menu-item ' +
        (level === 1 ? 'firstMenu' : level === 2 ? 'secondMenu' : 'threeMenu');
      var a = document.createElement('a');
      a.id = item.id; a.setAttribute('role', 'link'); a.setAttribute('tabindex', '0');
      a.textContent = item.name;
      li.appendChild(a);
      if (item.children && item.children.length) {
        li.classList.add('has-children');
        var sub = document.createElement('div');
        sub.className = (level === 2 ? 'lastmenu' : 'submenu');
        sub.style.display = 'none';
        creatMenu(item.children, sub, level + 1);
        li.appendChild(sub);
      } else {
        // muc la -> dieu huong toi trang
        li.__leaf = item.id;
      }
      ul.appendChild(li);
    });
    parent.appendChild(ul);
  }

  /* gan click cho cac muc menu trong drawer (uy quyen tu #menu-results) */
  function wireDrawerClicks() {
    var results = el('menu-results');
    if (!results || results.__wired) return;
    results.__wired = true;
    results.addEventListener('click', function (e) {
      var li = e.target.closest('li.menu-item');
      if (!li) return;
      e.stopPropagation();
      if (li.classList.contains('has-children')) {
        // bat/tat menu con truc tiep
        var sub = li.querySelector(':scope > .submenu, :scope > .lastmenu');
        if (sub) {
          var mo = sub.style.display !== 'none';
          sub.style.display = mo ? 'none' : '';
          li.classList.toggle('active', !mo);
        }
      } else if (li.__leaf) {
        // dieu huong (thay openLink) - duong dan tuong doi, xem ghi chu dau file
        location.href = trongThuMucPages ? (li.__leaf + '.html') : ('pages/' + li.__leaf + '.html');
        dongDrawer();
      }
    });
  }

  function moDrawer() {
    var cont = el('menu-container'), results = el('menu-results');
    if (!cont || !results) return;
    hienEl(cont, true);
    results.innerHTML = '';
    var tree = window.__MENU_TREE || [];
    creatMenu(tree, results, 1);
    wireDrawerClicks();
    var close = el('menu-close');
    if (close) close.focus();
  }

  function chay() {
    var ham = q('.more-menu-icon');
    if (ham && !ham.__wired) {
      ham.__wired = true;
      ham.addEventListener('click', moDrawer);
    }
    var close = el('menu-close');
    if (close && !close.__wired) {
      close.__wired = true;
      close.addEventListener('click', dongDrawer);
    }
    apply();
    window.addEventListener('resize', apply);
  }

  if (document.readyState === 'loading')
    document.addEventListener('DOMContentLoaded', chay);
  else chay();
})();
