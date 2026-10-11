/* Cap nhat cac VUNG HIEN THI (text, khong phai o nhap) tu kho cau hinh
   trung tam, de sua o trang A thi trang B doi theo -- muc 4 cua du an.

   Bang noi o /display_data.js, sinh tu spec/display_binding.json. Moi anh
   xa deu co bang chung: doi chieu text THAT tren thiet bi that voi noi
   dung THAT cua API ma chinh trang do goi. Vung nao mo ho (nhieu resource
   khac nhau cung khop) thi KHONG dong vao, de nguyen ban chup.

   Dinh vi bang duong dan chi so con tinh tu #root (vd "1/0/2/0") -- lam
   duoc vi ban gia lap giu nguyen cau truc DOM cua ban chup that. Neu duong
   dan khong con dung (ban chup bi thay), script bo qua va bao ra console
   chu KHONG doan sang phan tu khac. */
(function () {
  function tenTrang() {
    var n = (location.pathname.split('/').pop() || 'index.html').replace('.html', '');
    if (n === 'index' || n === '') n = 'home__overview';
    return n.replace(/__t\d+$/, '');
  }

  function timNode(duong) {
    var cur = document.getElementById('root');
    if (!cur) return null;
    var phan = duong.split('/');
    for (var i = 0; i < phan.length; i++) {
      cur = cur.childNodes[Number(phan[i])];
      if (!cur) return null;
    }
    return cur.nodeType === 3 ? cur : null;
  }

  function docSau(o, duong) {
    var cur = o, re = /([^.[\]]+)|\[(\d+)\]/g, m;
    while ((m = re.exec(duong))) {
      if (cur == null) return undefined;
      cur = m[2] !== undefined ? cur[Number(m[2])] : cur[m[1]];
    }
    return cur;
  }

  function chay() {
    var BANG = (window.__DISPLAY || {})[tenTrang()];
    if (!BANG) return;

    var can = {};
    Object.keys(BANG).forEach(function (d) { can[BANG[d].resource] = 1; });

    Promise.all(Object.keys(can).map(function (r) {
      return fetch('/api/v1/data/' + r)
        .then(function (x) { return x.ok ? x.json() : null; })
        .then(function (d) { return [r, d]; })
        .catch(function () { return [r, null]; });
    })).then(function (cap) {
      var kho = {};
      cap.forEach(function (c) { kho[c[0]] = c[1]; });

      var da = 0, hong = 0;
      Object.keys(BANG).forEach(function (duong) {
        var b = BANG[duong];
        var node = timNode(duong);
        var gt = kho[b.resource] == null ? undefined : docSau(kho[b.resource], b.duong_dan);
        if (!node || gt === undefined || gt === null) { hong++; return; }
        node.nodeValue = String(gt);
        da++;
      });
      console.log('[display_binding] ' + tenTrang() + ': cap nhat ' + da + ' vung hien thi'
        + (hong ? ', ' + hong + ' vung bo qua (khong tim thay hoac thieu du lieu)' : ''));
    });
  }

  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', chay);
  else chay();
})();
