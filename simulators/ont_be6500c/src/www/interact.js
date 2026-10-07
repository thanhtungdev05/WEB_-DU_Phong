/* Lam song lai cac dieu khien MUI trong ban gia lap tinh.
   Trang that chay React; ban chup lai chi co HTML nen moi thu "chet".
   Script nay xu ly CHUNG cho MOI trang:
     - Switch / Checkbox / Radio : dong bo lop Mui-checked
     - Accordion                 : dong / mo
     - Nut con mat mat khau      : hien / an mat khau
     - Select (MUI)              : mo danh sach chon neu da chup duoc options
*/
(function () {

  /* ---------- 1. Switch / Checkbox / Radio ---------- */
  /* Dong bo LAI TOAN BO tu trang thai that cua input.
     Khong dao trang thai, nen du su kien co ban 2 lan (input + label chuyen tiep)
     thi ket qua van dung. */
  /* Hinh ve cua CHECKBOX: MUI that chi render DUNG MOT <svg> -- icon o
     dang hien tai. Ban chup tinh vi vay chi co icon cua trang thai luc
     chup; bam vao khong doi hinh. Phai tu doi 'd' cua <path> + data-testid.
     Hai chuoi 'd' duoi day CHEP NGUYEN tu ban chup that
     (security__firewall.html co ca hai dang trong cung mot trang). */
  var D_HOP_TRONG = 'M19 5v14H5V5h14m0-2H5c-1.1 0-2 .9-2 2v14c0 1.1.9 2 2 2h14c1.1 0 2-.9 2-2V5c0-1.1-.9-2-2-2z';
  var D_HOP_TICK = 'M19 3H5c-1.11 0-2 .9-2 2v14c0 1.1.89 2 2 2h14c1.11 0 2-.9 2-2V5c0-1.1-.89-2-2-2zm-9 14l-5-5 1.41-1.41L10 14.17l7.59-7.59L19 8l-9 9z';

  function veLaiCheckbox(base, dangChon) {
    var svg = base.querySelector('svg[data-testid="CheckBoxOutlineBlankIcon"], '
      + 'svg[data-testid="CheckBoxIcon"]');
    if (!svg) return;   // hop kiem 3 trang thai (indeterminate) thi bo qua
    var p = svg.querySelector('path');
    if (!p) return;
    svg.setAttribute('data-testid', dangChon ? 'CheckBoxIcon' : 'CheckBoxOutlineBlankIcon');
    p.setAttribute('d', dangChon ? D_HOP_TICK : D_HOP_TRONG);
  }

  function syncAll() {
    document.querySelectorAll('.PrivateSwitchBase-root').forEach(function (base) {
      var inp = base.querySelector('input');
      if (!inp) return;
      if (inp.type === 'checkbox') veLaiCheckbox(base, inp.checked);
      if (inp.checked) {
        base.classList.add('Mui-checked');
        // CHI Switch/Checkbox (vd Enable) moi dung value="true"/"false" lam
        // TRANG THAI BAT/TAT. Radio (vd chon Interface LAN/Internet/Guest o
        // dialog Static Routing) dung value la CHUOI DINH DANH rieng
        // ('lan'/'wan'/'guest') -- KHONG duoc ghi de. Truoc day syncAll()
        // ghi de ca hai loai giong nhau, lam gia tri radio bien thanh
        // 'true' -- bat duoc khi kiem bang mat luc noi Static Routing
        // (GD4 2026-08-13), vi day la form DAU TIEN dung radio group.
        if (inp.type !== 'radio') inp.setAttribute('value', 'true');
      } else {
        // ban chup goc co the chua 'Mui-checked' lap nhieu lan -> xoa het
        while (base.classList.contains('Mui-checked')) base.classList.remove('Mui-checked');
        if (inp.type !== 'radio') inp.setAttribute('value', 'false');
      }
    });
  }
  /* Cong tac "Enable" TAT -> moi truong ben duoi mo di va khong bam duoc
     (giong het thiet bi that). Nut Enable la phan tu dau tien trong khoi,
     cac truong can khoa la cac phan tu dung sau no. */
  /* Dung DUNG class 'Mui-disabled' cua MUI, khong tu che do mo.
     CSS that cua thiet bi quy dinh:
       .MuiInputBase-input.Mui-disabled  -> chu VAN DAM rgba(0,0,0,.87)
       .css-xxx.Mui-disabled .MuiOutlinedInput-notchedOutline -> vien nhat .38
       .MuiFormControlLabel-label.Mui-disabled -> nhan xam .38
     Nho vay ket qua giong het thiet bi that. */
  var DIS = [
    '.MuiInputBase-root',        // -> lam nhat vien o
    '.MuiInputBase-input',       // -> giu chu dam
    '.MuiInputLabel-root',       // -> nhan noi tren vien o
    '.MuiFormLabel-root',
    '.MuiFormControlLabel-label',
    '.MuiFormHelperText-root',
    '.MuiSelect-select',
    '.MuiSelect-icon',
    '.MuiCheckbox-root',
    '.PrivateSwitchBase-root',
    '.MuiIconButton-root'
  ].join(', ');

  function applyEnableSections() {
    document.querySelectorAll('.PrivateSwitchBase-root input').forEach(function (inp) {
      var lbl = inp.closest('.MuiFormControlLabel-root');
      if (!lbl) return;
      if ((lbl.textContent || '').trim() !== 'Enable') return;

      var scope = lbl.closest('.MuiAccordionDetails-root') || lbl.parentElement;
      if (!scope) return;
      var off = !inp.checked;

      scope.querySelectorAll(DIS).forEach(function (el) {
        // khong dong den chinh nut Enable
        if (el === lbl || el.contains(lbl) || lbl.contains(el)) return;
        if (off) el.classList.add('Mui-disabled');
        else el.classList.remove('Mui-disabled');
      });

      // khoa nhap lieu that su
      scope.querySelectorAll('input, textarea, select').forEach(function (f) {
        if (f === inp) return;
        f.disabled = off;
      });
    });
  }

  /* Chi bo sung cac quy tac MUI thieu trong ban CSS tai ve
     (do luc chup khong co phan tu nao dang o trang thai do). */
  (function injectCss() {
    var st = document.createElement('style');
    st.textContent =
      '.MuiFormControl-root:not([style*="display: none"]):not([style*="display:none"]){position:relative !important;display:flex;flex-direction:column !important}' +
      '.MuiFormHelperText-root.Mui-disabled{color:rgba(0,0,0,.38)}' +
      '.MuiSelect-select.Mui-disabled,.MuiSelect-icon.Mui-disabled{color:rgba(0,0,0,.38);cursor:default}' +
      /* NHAN O SELECT VA O VAN BAN KHONG NHAY LEN -- dam bao luon shrink khi co gia tri hoac focus */
      '.MuiInputLabel-root.MuiInputLabel-shrink,.MuiInputLabel-root[data-shrink="true"],label.css-1sqw6hd{' +
      'transform:translate(14px,-9px) scale(0.75) !important;' +
      'transform-origin:top left !important;max-width:calc(133% - 32px) !important;' +
      'background:#fff !important;padding:0 4px !important;margin-left:-4px !important;z-index:2 !important;pointer-events:auto !important}' +
      '.MuiInputLabel-root[data-shrink="false"]:not(.Mui-focused):not(.MuiInputLabel-shrink),label.css-4mi22k:not(.Mui-focused):not(.MuiInputLabel-shrink){' +
      'transform:translate(14px,16px) scale(1) !important;background:transparent !important;pointer-events:none !important}' +
      /* CHAM GIUA CUA RADIO -- loi bat duoc 2026-08-13 khi kiem bang mat
         trang Advanced > LAN (PD Mode): DOM bao 'Manual' dang chon nhung
         cham van ve o 'Automatic'.
         Nguyen nhan: MUI xep chong 2 <svg> (vong tron + cham giua); cham
         giua an/hien bang 'transform: scale(0|1)' do lop Emotion quy dinh.
         Ban chup TINH nen moi radio bi DONG CUNG lop cua trang thai luc
         chup: .css-1u5ei5s = scale(1) (hien) cho cai dang chon,
         .css-1c4tzn = scale(0) (an) cho cac cai con lai. Doi class
         'Mui-checked' khong cuu duoc vi hai lop kia khong nhac gi den no.
         Sua bang cach ghi de theo DUNG ngu nghia cua MUI (do sau chon lop
         cao hon nen khong can !important). Chua CHUNG cho moi trang co
         radio: advanced__lan, advanced__wan, advanced__tcpdump va hop
         thoai Static Routing trong dialog_data.js. */
      '.PrivateSwitchBase-root svg[data-testid="RadioButtonCheckedIcon"]' +
      '{transform:scale(0)}' +
      '.PrivateSwitchBase-root.Mui-checked svg[data-testid="RadioButtonCheckedIcon"]' +
      '{transform:scale(1)}' +
      /* POPUP CUA MUI SELECT (window.__moMenuChon trong dialog_data.js) --
         loi bat duoc 2026-08-14 khi kiem m_network__portforward: bang chung
         'do_nhanh_an_wan.json' chi chup MARKUP (class) cua popup luc dang
         mo, KHONG chup CSSOM dang song. '.MuiList-root/.MuiMenuItem-root'
         DA CO gia tri THAT tu 2026-08-18 (do khi mo Security Mode o trang
         Wi-Fi, xem emotion.css: '.css-x3whsd'/'.css-r8u8y9') -- vi
         window.__moMenuChon gan cung 2 lop that do cho MOI popup nen chi
         con '.MuiPaper-root' (nen/bo goc/bong do cua khung popup) la CHUA
         co bang chung PIXEL-CHINH-XAC rieng cua thiet bi nay. Giu GIA TRI
         MAC DINH CHUAN cua thu vien MUI v5 CHI cho phan Paper, khoanh vung
         bang '[data-sim-menu]'. Ghi ro trong ISSUES.md. */
      '[data-sim-menu] .MuiPaper-root{background:#fff;color:rgba(0,0,0,.87);' +
      'border-radius:4px;overflow:auto;max-height:calc(100% - 96px);' +
      'box-shadow:0px 5px 5px -3px rgba(0,0,0,.2),0px 8px 10px 1px rgba(0,0,0,.14),0px 3px 14px 2px rgba(0,0,0,.12)}' +
      /* BANG (portforward/routing/reserved) TRAN KHUNG TREN DIEN THOAI --
         loi bat duoc 2026-08-14: emotion.css KHONG co luat overflow cho
         '.MuiTableContainer-root' (chua tung can, vi bang may tinh du
         rong). Day la mac dinh CHUAN cua MUI TableContainer (overflow-x:
         auto), giu lai lam nen an toan chung (khong anh huong may tinh vi
         du rong san).
         CAP NHAT 2026-08-18: da do duoc bang chung THAT luc CO du lieu
         tren dien thoai (reference/source/do_bang_dien_thoai_co_du_lieu.
         json, do qua iframe cung-origin tren thiet bi that). KHONG phai
         bang cuon ngang nhu suy doan truoc day -- thiet bi that dung
         DANH SACH THE (MuiList/ListItem). Da sua trong bang_binding.js
         (renderThe()). Luat overflow-x:auto o day gio CHI con dung cho
         truong hop bang RONG tren dien thoai (van la suy dien tam, xem
         vungBang() trong bang_binding.js) va cho ban may tinh. */
      '.MuiTableContainer-root{overflow-x:auto;max-width:100%}' +
      '.MuiTableContainer-root .MuiTableCell-root{white-space:nowrap}' +
      /* THE "Gateway"/"Internet" MO RONG O home__overview -- GD6 (2026-08-14),
         chup TRUC TIEP tren thiet bi that 192.168.1.1 (dieu khien Chrome,
         doc document.styleSheets luc dang mo). Ban chup tinh GD1 khong bao
         gio bat trang thai nay (icon 'ExpandMoreIcon' luon dong luc chup)
         nen '.css-hps7pf' (lop tuc thoi luc MO) khong co trong emotion.css --
         KHONG phai suy doan, day la nguyen van cssText doc duoc tu thiet bi
         that o trang thai dang mo. Trang thai DONG '.css-1fbsxje' da co san
         trong emotion.css (chup duoc vi la trang thai mac dinh). */
      '.css-hps7pf{height:auto;overflow:visible;' +
      'transition:height 300ms cubic-bezier(0.4,0,0.2,1);position:absolute;' +
      'top:calc(136px);left:0px;width:calc(200% + 24px);padding:16px 16px 12px;' +
      'background-color:rgb(255,255,255);border-radius:8px;' +
      'border-bottom:2px solid rgb(47,84,235);' +
      'box-shadow:rgba(189,189,189,.2) 0px 3px 3px -2px,' +
      'rgba(189,189,189,.14) 0px 3px 4px 0px,rgba(189,189,189,.12) 0px 1px 8px 0px;' +
      'cursor:default}' +
      '.css-hps7pf.Internet{left:auto;right:0px}';
    document.head.appendChild(st);
  })();

  window.__simSync = syncAll;

  // chay SAU khi trinh duyet xu ly xong hanh vi mac dinh cua label
  function later() { setTimeout(function () { syncAll(); applyEnableSections(); }, 0); }
  document.addEventListener('click', later, false);
  document.addEventListener('change', later, false);

  /* ---------- 2. Accordion dong/mo ---------- */
  function wireAccordions() {
    document.querySelectorAll('.MuiAccordionSummary-root').forEach(function (sum) {
      if (sum.__wired) return; sum.__wired = true;
      sum.style.cursor = 'pointer';
      sum.addEventListener('click', function () {
        var acc = sum.closest('.MuiAccordion-root') || sum.parentElement;
        if (!acc) return;
        var col = acc.querySelector('.MuiCollapse-root');
        var open = sum.className.indexOf('Mui-expanded') >= 0;
        if (open) {
          sum.className = sum.className.replace(/\s*Mui-expanded/g, '');
          if (col) { col.style.height = '0px'; col.style.overflow = 'hidden'; col.style.visibility = 'hidden'; }
        } else {
          sum.className += ' Mui-expanded';
          if (col) { col.style.height = 'auto'; col.style.overflow = 'visible'; col.style.visibility = 'visible'; }
        }
        var ic = sum.querySelector('.MuiAccordionSummary-expandIconWrapper');
        if (ic) ic.style.transform = open ? 'rotate(0deg)' : 'rotate(180deg)';
      });
    });
  }

  /* ---------- 2b. The Gateway/Internet o home__overview: bam mui ten de
     xem chi tiet ---------- */
  /* GD6 (2026-08-14) -- do truc tiep tren thiet bi that: day KHONG phai
     '.MuiAccordionSummary-root' (wireAccordions() o tren khong khop) ma la
     mot IconButton rieng dung canh mot '.MuiCollapse-root' anh em cung the
     .MuiCard-root. Bam lan 1: lop doi tu "...MuiCollapse-hidden css-1fbsxje"
     sang "...MuiCollapse-entered css-hps7pf" + style
     "min-height:0px;height:auto;transition-duration:300ms" + icon them lop
     'isActive' (da co san luat xoay 180deg trong emotion.css, ".css-
     gduqeb.isActive"). Bam lan 2: doi nguoc lai dung nhu markup tinh da
     chup. Ca hai chieu deu doc tu thiet bi that, khong doan. */
  function dongThe(col, svg) {
    col.className = col.className
      .replace(/\bMuiCollapse-entered\b/, 'MuiCollapse-hidden')
      .replace(/\bcss-hps7pf\b/, 'css-1fbsxje');
    col.setAttribute('style', 'min-height: 0px;');
    if (svg) svg.classList.remove('isActive');   // svg.className la SVGAnimatedString,
    //  KHONG phai chuoi -- phai dung classList, gan += se lang le vo tac dung
  }

  function moThe(col, svg) {
    col.className = col.className
      .replace(/\bMuiCollapse-hidden\b/, 'MuiCollapse-entered')
      .replace(/\bcss-1fbsxje\b/, 'css-hps7pf');
    col.setAttribute('style', 'min-height: 0px; height: auto; transition-duration: 300ms;');
    if (svg) svg.classList.add('isActive');
  }

  function wireCardCollapse() {
    document.querySelectorAll('svg[data-testid="ExpandMoreIcon"]').forEach(function (svg) {
      if (svg.closest('.MuiAccordionSummary-root')) return;   // wireAccordions() lo roi
      var btn = svg.closest('button');
      if (!btn || btn.__wiredCollapse) return;
      var card = btn.closest('.MuiCard-root') || btn.closest('.MuiPaper-root');
      var col = card && card.querySelector('.MuiCollapse-root');
      if (!col) return;
      btn.__wiredCollapse = true;
      btn.style.cursor = 'pointer';
      btn.addEventListener('click', function () {
        var dangMo = col.className.indexOf('MuiCollapse-entered') >= 0;
        if (dangMo) dongThe(col, svg); else moThe(col, svg);
      });
    });
  }

  /* GD6 (2026-08-14): trang bien the __t<N> (vd home__overview__t1.html) duoc
     nav.js dieu huong toi khi bam mot tab KHONG phai tab dau tien (vd LAN),
     nhung the Collapse cha van bi chup o trang thai DONG (MuiCollapse-hidden)
     -- nguoi dung bam LAN se thay NHU KHONG CO GI XAY RA vi noi dung dang an.
     Tren thiet bi that, tab WAN/LAN chi hien khi the DA MO san, nen bam LAN
     luc the dang mo van giu nguyen trang thai mo. Sua: neu mot Collapse dang
     DONG nhung ben trong co tablist ma tab DAU TIEN khong phai tab dang chon
     (aria-selected="true"), tuc trang nay dai dien cho trang thai "the da mo,
     dang xem tab khac tab mac dinh" -- tu mo no ngay luc nap trang, dung lai
     dung phep bien doi da xac minh o wireCardCollapse (khong doan gia tri moi). */
  function moTheTheoTabDaChon() {
    document.querySelectorAll('.MuiCollapse-root.MuiCollapse-hidden').forEach(function (col) {
      var tablist = col.querySelector('[role="tablist"]');
      if (!tablist) return;
      var tabs = tablist.querySelectorAll('[role="tab"]');
      if (!tabs.length) return;
      if (tabs[0].getAttribute('aria-selected') === 'true') return;   // tab mac dinh, giu nguyen
      var card = col.closest('.MuiCard-root') || col.closest('.MuiPaper-root');
      var svg = card && card.querySelector('svg[data-testid="ExpandMoreIcon"]');
      moThe(col, svg);
    });
  }

  /* ---------- 3. Nut hien/an mat khau ---------- */
  function wireEyes() {
    document.querySelectorAll('svg[data-testid="VisibilityIcon"], svg[data-testid="VisibilityOffIcon"]').forEach(function (svg) {
      var btn = svg.closest('button') || svg.parentElement;
      if (!btn || btn.__wired) return; btn.__wired = true;
      btn.style.cursor = 'pointer';
      btn.addEventListener('click', function () {
        var wrap = btn.closest('.MuiInputBase-root') || btn.parentElement.parentElement;
        var inp = wrap && wrap.querySelector('input');
        if (!inp) return;
        inp.type = (inp.type === 'password') ? 'text' : 'password';
      });
    });
  }

  /* ---------- 3b. Nhan cua o van ban (text/password) "nhay len" khi
     focus/co gia tri ---------- */
  /* Loi bat duoc GD6 (2026-08-14) khi kiem System > User: go mat khau
     moi vao o "New Password" (rong luc chup, dung MuiInputLabel-shrink
     lop RIENG cho tung trang thai) nhung nhan KHONG nhay len -- chu
     "New Password" (nhan) de thang len tren cham mat khau, chong chu
     nhau. Thiet bi that: bam VAO o (chi can focus, chua can go) la
     nhan nhay len ngay (do truc tiep tren 192.168.1.1 -- Mui-focused +
     MuiInputLabel-shrink xuat hien tuc thi). Day la hanh vi CHUAN cua
     MUI outlined TextField (label shrink khi focused HOAC filled),
     KHONG rieng gi trang nay -- moi o van ban RONG luc chup (vd PPPoE
     username/password o WAN, cac o them moi) deu cham loi nay vi ban
     chup tinh chi bat duoc DUNG MOT trang thai nhan. CSS can thiet DA
     CO SAN trong emotion.css (vd .css-myx23j.Mui-focused
     .MuiOutlinedInput-notchedOutline, .css-1sqw6hd.Mui-focused) --
     kiem chung o dau thay 'user': moi lop deu la lop that cua thiet bi,
     khong bia. Chi thieu JS dong bo, sua CHUNG mot lan cho moi trang. */
  function nhanCuaOVanBan(inp) {
    var wrap = inp.closest('.MuiFormControl-root') || inp.closest('.MuiTextField-root');
    if (!wrap) return null;
    if (wrap.querySelector('.MuiSelect-select')) return null;   // Select co co che rieng
    return wrap.querySelector('label.MuiInputLabel-root, label.MuiFormLabel-root');
  }
  function capNhatNhanOVanBan(inp, dangFocus) {
    var nhan = nhanCuaOVanBan(inp);
    if (!nhan) return;
    var wrap = inp.closest('.MuiFormControl-root') || inp.closest('.MuiTextField-root');
    var root = inp.closest('.MuiOutlinedInput-root, .MuiInputBase-root');
    var coGiaTri = !!(inp.value && String(inp.value).trim().length > 0);
    var nhay = dangFocus || coGiaTri;

    nhan.classList.toggle('MuiInputLabel-shrink', nhay);
    nhan.classList.toggle('MuiFormLabel-filled', coGiaTri);
    nhan.classList.toggle('Mui-focused', dangFocus);
    nhan.setAttribute('data-shrink', nhay ? 'true' : 'false');

    if (nhay) {
      nhan.classList.remove('css-4mi22k');
      nhan.classList.add('css-1sqw6hd');
    } else {
      nhan.classList.remove('css-1sqw6hd');
      nhan.classList.add('css-4mi22k');
    }

    if (wrap) {
      var leg = wrap.querySelector('fieldset legend');
      if (leg) {
        if (nhay) {
          leg.classList.remove('css-yjsfm1');
          leg.classList.add('css-14lo706');
        } else {
          leg.classList.remove('css-14lo706');
          leg.classList.add('css-yjsfm1');
        }
      }
    }

    if (root) root.classList.toggle('Mui-focused', dangFocus);
  }

  window.__capNhatNhan = function (inp) {
    if (inp) capNhatNhanOVanBan(inp, document.activeElement === inp);
  };

  function wireNhanOVanBan() {
    document.addEventListener('focusin', function (e) {
      var t = e.target;
      if (!t || !t.matches || !t.matches('input[type="text"], input[type="password"], '
        + 'input[type="email"], input[type="number"], input:not([type]), textarea')) return;
      capNhatNhanOVanBan(t, true);
    }, true);
    document.addEventListener('focusout', function (e) {
      var t = e.target;
      if (!t || !t.matches || !t.matches('input[type="text"], input[type="password"], '
        + 'input[type="email"], input[type="number"], input:not([type]), textarea')) return;
      capNhatNhanOVanBan(t, false);
    }, true);
    document.addEventListener('input', function (e) {
      var t = e.target;
      if (!t || !t.matches || !t.matches('input[type="text"], input[type="password"], '
        + 'input[type="email"], input[type="number"], input:not([type]), textarea')) return;
      capNhatNhanOVanBan(t, document.activeElement === t);
    }, true);
    document.addEventListener('change', function (e) {
      var t = e.target;
      if (!t || !t.matches || !t.matches('input[type="text"], input[type="password"], '
        + 'input[type="email"], input[type="number"], input:not([type]), textarea')) return;
      capNhatNhanOVanBan(t, document.activeElement === t);
    }, true);
    // dong bo ngay cac o da co gia tri san (vd sau khi trinh duyet tu dien lai)
    document.querySelectorAll('.MuiFormControl-root input[type="text"], '
      + '.MuiFormControl-root input[type="password"], .MuiFormControl-root textarea')
      .forEach(function (inp) { capNhatNhanOVanBan(inp, false); });
  }

  /* ---------- 4. Select: bao cho nguoi dung biet ---------- */
  function wireSelects() {
    document.querySelectorAll('.MuiSelect-select').forEach(function (s) {
      if (s.__wired) return; s.__wired = true;
      s.style.cursor = 'pointer';
      s.addEventListener('click', function () {
        if (!s.__warned) {
          s.__warned = true;
          console.log('[interact] Select "' + (s.textContent || '').trim() + '": danh sach lua chon chua duoc chup tu thiet bi that.');
        }
      });
    });
  }

  /* ---------- 5. Tu dong dong bo dai IP DHCP khi doi IP LAN ---------- */
  function wireDhcpAutoSync() {
    function xuLyDoiIp(target) {
      if (!target || !target.matches || !target.matches('input[name="ipv4Settings.ipAddress"]')) return;
      var doc = target.ownerDocument || document;
      var startInput = doc.querySelector('input[name="ipv4Settings.dhcp.startAddress"]');
      var endInput = doc.querySelector('input[name="ipv4Settings.dhcp.endAddress"]');
      if (!startInput || !endInput) return;

      var val = (target.value || '').trim();
      var m = val.match(/^(\d{1,3}\.\d{1,3}\.\d{1,3})\.(\d{1,3})$/);
      if (m) {
        var prefix = m[1];
        startInput.value = prefix + '.2';
        startInput.setAttribute('value', prefix + '.2');
        endInput.value = prefix + '.254';
        endInput.setAttribute('value', prefix + '.254');
        if (typeof capNhatNhanOVanBan === 'function') {
          capNhatNhanOVanBan(startInput, false);
          capNhatNhanOVanBan(endInput, false);
        }
      }
    }

    document.addEventListener('input', function (e) { xuLyDoiIp(e.target); }, true);
    document.addEventListener('change', function (e) { xuLyDoiIp(e.target); }, true);
  }

  function init() {
    // dong bo trang thai ban dau tu lop Mui-checked co san
    document.querySelectorAll('.PrivateSwitchBase-root').forEach(function (b) {
      var inp = b.querySelector('input');
      if (inp) inp.checked = b.className.indexOf('Mui-checked') >= 0;
    });
    syncAll(); applyEnableSections();
    wireAccordions(); wireCardCollapse(); moTheTheoTabDaChon(); wireEyes(); wireSelects();
    wireNhanOVanBan();
    wireDhcpAutoSync();
    var n = document.querySelectorAll('input[type=checkbox],input[type=radio]').length;
    console.log('[interact] ' + n + ' cong tac/hop kiem da hoat dong');
  }

  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', init);
  else init();
})();
