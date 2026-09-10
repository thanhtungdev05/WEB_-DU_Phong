/* Dieu huong cho ban gia lap H6701Q V3 (BE15000).
   App that la jQuery, nap noi dung tung trang qua AJAX (common_lib.js).
   Ban chup tinh da bo common_lib.js (neu de lai no se AJAX re-render, xoa
   mat noi dung da chup + hien loi vi khong co server that).

   Moi muc menu tren thiet bi co thuoc tinh `menupage` = id trang dich
   (class1 top category, class2, ca tab class3). Chi can bat click cac phan
   tu do va dieu huong toi trang tuong ung.

   Ban goc dung duong dan server /page/<id> va /login (server.py tu dinh
   tuyen). Khi nhung vao du an tinh, cac trang nam trong 2 thu muc khac nhau
   (login.html o www/, pages/*.html o www/pages/) nen phai tu xac dinh dang
   dung o dau de tinh duong dan TUONG DOI dung, thay vi dung '/' co dinh se
   tro ve goc du an va bao 404. */
(function () {
  // dang o www/pages/<x>.html hay o www/login.html?
  var trongThuMucPages = /\/pages\//.test(location.pathname);

  function di(id) {
    if (!id) return;
    location.href = trongThuMucPages ? (id + '.html') : ('pages/' + id + '.html');
  }
  function veLogin() {
    location.href = trongThuMucPages ? '../login.html' : 'login.html';
  }

  document.addEventListener('click', function (e) {
    // Logout truoc (co the khong co menupage)
    var t = e.target;
    if (t.id === 'logout' || (t.getAttribute && /LogOff/.test(t.getAttribute('onclick') || ''))) {
      // stopPropagation: phan tu goc co san onclick="LogOff()" nhung ham do
      // KHONG duoc dinh nghia o dau ca (rac tu ban chup) -> neu de lot xuong
      // bubble phase se nem ReferenceError. Chan tai day, tu dieu huong thay the.
      e.preventDefault(); e.stopPropagation(); veLogin(); return;
    }
    // tim phan tu gan nhat co menupage (hoac chinh no)
    var el = e.target;
    while (el && el !== document.body) {
      if (el.getAttribute && el.getAttribute('menupage')) {
        e.preventDefault();
        di(el.getAttribute('menupage'));
        return;
      }
      el = el.parentElement;
    }
  }, true);
})();
