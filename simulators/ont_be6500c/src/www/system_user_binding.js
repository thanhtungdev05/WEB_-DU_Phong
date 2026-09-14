/* Trang System >> User. Module RIENG -- KHAC HAN moi trang khac trong
   thiet bi: khong di qua facade REST /api/v1/data/*, ma di qua kenh RPC
   rieng '/oui-rpc' (method="call", params=[sid,module,action,args]).

   ============ BANG CHUNG THAT (do 2026-08-18) ============
   - reference/har/system_user_doi_mk.har: anh Huynn doi mat khau THAT tren
     192.168.1.1, chup HAR. Xac nhan:
       user/get_users -> {result:{users:[{acl:"admin",username:"admin",
                                            id:"cfg042e84"}]}}
       user/change    -> goi voi {id,acl,password:<CHUOI THUONG, KHONG
                          ma hoa>} -> tra than RONG {}
     Sau khi doi, thiet bi that TU DONG logout + bat dang nhap lai bang
     mat khau moi. Trang '/login' NAM NGOAI PHAM VI du an tu GD0 (xem
     CLAUDE.md muc 1: bo 4 route ky thuat /login, /ext, /, *) -- ban gia
     lap KHONG mo phong buoc logout/dang-nhap-lai nay, CHI mo phong dung
     request/response cua chinh lenh doi mat khau. Ghi trong ISSUES.md.
   - [2026-08-18, cung ngay] DA DO TRUC TIEP DOM that qua Chrome MCP tren
     192.168.1.1#/system/user (go mat khau gia vao 2 o de kich hoat
     isDirty, thanh Save/Cancel hien ra, doc bang javascript_tool -- KHONG
     bam Save, khong gui request ghi that). Xac nhan markup nguyen mau
     mượn tu WAN la DUNG cho thanh phan nay (component dung chung toan bo
     ung dung, cung lop css-den97n/css-g28vy7/css-1acoyi9), TRU MOT cho
     thieu: nut Save that co THEM span MuiCircularProgress (an display:
     none luc nghi, hien khi dang gui) giua span text va span
     TouchRipple -- da bo sung. Thu tu DOM: Save TRUOC, Cancel SAU (container
     dung flex-direction:row-reverse nen Cancel hien BEN TRAI tren man
     hinh). Loi nay lap lai o 3 trang khac (WAN/Wi-Fi General/Wi-Fi
     Advanced) va da sua het mot luot -- xem STATUS.md. */
(function () {
  'use strict';

  function tenTep() {
    var n = (location.pathname.split('/').pop() || '').replace('.html', '');
    if (n.indexOf('m_') === 0) n = n.slice(2);
    return n;
  }
  if (tenTep() !== 'system__user') return;

  var NGUOI_DUNG = null;   // ban ghi {id,acl,username} lay tu user/get_users
  var dangGhi = false;
  var thanhSave = null;

  function baoLoi(msg) {
    console.error('[system_user_binding] ' + msg);
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

  function goiRpc(module, action, args) {
    // sid: thiet bi that dung sid cua phien dang nhap that. Ban gia lap
    // KHONG mo phong /login (ngoai pham vi) nen khong co sid thuc su --
    // gui chuoi rong, server.py khong doc/kiem sid.
    return fetch('/oui-rpc', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ method: 'call', params: ['', module, action, args || {}] })
    }).then(function (r) {
      if (!r.ok) throw new Error('HTTP ' + r.status);
      return r.json();
    });
  }

  function napNguoiDung() {
    return goiRpc('user', 'get_users', {}).then(function (kq) {
      var ds = (kq && kq.result && kq.result.users) || [];
      NGUOI_DUNG = ds[0] || null;
    }).catch(function (e) {
      console.error('[system_user_binding] nap nguoi dung that bai:', e);
    });
  }

  function oMatKhau() { return document.querySelector('input[name="password"]'); }
  function oXacNhan() { return document.querySelector('input[name="confirmPassword"]'); }

  /* ------------------------------------------- thanh Save/Cancel
     DA DO TRUC TIEP tren thiet bi that 2026-08-18 (xem ghi chu dau file). */
  function hienThanhSave() {
    if (thanhSave) return;
    var neo = document.querySelector('form.css-1w5zf2q') || document.getElementById('root');
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
    w.querySelector('.cancel').addEventListener('click', function () { xoaTrang(); });
  }

  function anThanhSave() {
    if (!thanhSave) return;
    thanhSave.remove();
    thanhSave = null;
  }

  function xoaTrang() {
    var mk = oMatKhau(), xn = oXacNhan();
    if (mk) mk.value = '';
    if (xn) xn.value = '';
  }

  function theoDoiThayDoi() {
    [oMatKhau(), oXacNhan()].forEach(function (el) {
      if (!el || el.__simDaNoi) return;
      el.__simDaNoi = true;
      el.addEventListener('input', function () {
        hienThanhSave();
      });
    });
  }

  function luu() {
    if (dangGhi) return;
    var mk = oMatKhau(), xn = oXacNhan();
    var matKhau = mk ? mk.value : '';
    var xacNhan = xn ? xn.value : '';
    // Thong diep loi LAY THAT tu ma goc (spec/pages/system__user.json muc
    // schema_kiem_tra/chuoi_hien_thi): "Password is required",
    // "Passwords do not match".
    if (!matKhau) { baoLoi('Password is required'); return; }
    if (matKhau !== xacNhan) { baoLoi('Passwords do not match'); return; }
    if (!NGUOI_DUNG) { baoLoi('Khong doc duoc thong tin nguoi dung tu kho cau hinh.'); return; }

    dangGhi = true;
    goiRpc('user', 'change', {
      id: NGUOI_DUNG.id, acl: NGUOI_DUNG.acl, password: matKhau
    }).then(function () {
      dangGhi = false;
      xoaTrang();
      // Thiet bi that: tu dong logout + bat dang nhap lai bang mat khau
      // moi (xem ghi chu dau file). Ban gia lap KHONG co /login nen
      // KHONG chuyen trang -- chi tra form ve trang thai sach, giong nhu
      // vua luu thanh cong.
    }).catch(function (e) {
      dangGhi = false;
      baoLoi('Changes saving failed, please try again.  (' + e.message + ')');
    });
  }

  function batDau() {
    napNguoiDung().then(function () {
      theoDoiThayDoi();
      hienThanhSave();
    });
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', batDau);
  } else {
    batDau();
  }
})();
