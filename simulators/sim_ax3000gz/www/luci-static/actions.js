/* Hanh vi cho cac nut con lai cua ban gia lap AX3000GZV3.
   Ban chup tinh da bo het JavaScript nen moi nut deu "chet".
   Nhung nut nao co the tai lap TRUNG THUC thi lam that (Refresh, Remove,
   chon file...); nhung nut tac dong len phan cung/mang thi bao ro day la
   ban gia lap - KHONG bia ket qua gia de tranh day hoc sai. */
(function () {

  function nhan(b) {
    var t = (b.textContent || b.value || '').replace(/\s+/g, ' ').trim();
    if (!t) t = b.getAttribute('title') || '';
    return t;
  }

  function bao(tieuDe, noiDung) {
    alert(tieuDe + '\n\n' + noiDung + '\n\n(Ban gia lap giao dien - khong tac dong len thiet bi that)');
  }

  function xoaDong(b) {
    var tr = b.closest('tr, .tr');
    if (tr) { tr.remove(); return true; }
    var d = b.closest('.cbi-section-table-row, .cbi-value');
    if (d) { d.remove(); return true; }
    return false;
  }

  var XU_LY = [
    // --- lam that ---
    [/^Refresh$/i, function () { location.reload(); }],
    [/^Remove$/i, function (b) {
      if (!xoaDong(b)) bao('Remove', 'Khong tim thay dong de xoa.');
    }],
    [/^Select a file$/i, function () {
      var f = document.createElement('input');
      f.type = 'file';
      f.addEventListener('change', function () {
        if (f.files && f.files[0]) bao('Da chon tep', f.files[0].name);
      });
      f.click();
    }],

    // --- bao ro la gia lap ---
    [/^Scan/i, function (b) {
      bao(nhan(b), 'Tren thiet bi that: quet cac mang Wi-Fi xung quanh roi liet ke SSID, kenh, cuong do song.');
    }],
    [/^(Nslookup|Ping|Traceroute)$/i, function (b) {
      bao(nhan(b), 'Tren thiet bi that: chay lenh chan doan va in ket qua vao o ben duoi.');
    }],
    [/^(Enable|Disable|Restart)$/i, function (b) {
      bao(nhan(b), 'Tren thiet bi that: thay doi trang thai radio Wi-Fi.');
    }],
    [/^(Start|Stop)$/i, function (b) {
      bao(nhan(b), 'Tren thiet bi that: bat dau / dung tien trinh thu thap thong tin chan doan.');
    }],
    [/^Download/i, function (b) {
      bao(nhan(b), 'Tren thiet bi that: tai tep ve may (nhat ky, goi chan doan hoac tai lieu huong dan).');
    }],
    [/^Save$/i, function (b) {
      bao(nhan(b), 'Tren thiet bi that: luu cau hinh nhat ky.');
    }],
    [/^Reset$/i, function (b) {
      bao(nhan(b), 'Tren thiet bi that: xoa toan bo nhat ky da luu.');
    }],
    [/^Apply$/i, function (b) {
      var w = window.parent || window;
      if (w.onSimulatorSave) {
        try {
          w.onSimulatorSave(window);
        } catch (e) {}
      }
      
      var msgId = 'fakeSaveMsg';
      var oldMsg = document.getElementById(msgId);
      if (oldMsg) oldMsg.remove();
      
      var msg = document.createElement('span');
      msg.id = msgId;
      msg.style.color = '#15803d';
      msg.style.fontWeight = 'bold';
      msg.style.fontSize = '13px';
      msg.style.marginLeft = '10px';
      msg.style.verticalAlign = 'middle';
      msg.innerHTML = '✔ Saved successfully!';
      
      b.parentNode.insertBefore(msg, b.nextSibling);
      
      setTimeout(function () {
        if (msg && msg.parentNode) msg.parentNode.removeChild(msg);
      }, 3000);
    }],
    [/^Hardware Diagnosis$/i, function (b) {
      bao(nhan(b), 'Tren thiet bi that: chay kiem tra phan cung va bao ket qua.');
    }]
  ];

  function gan() {
    var n = 0;
    document.querySelectorAll('button, input[type=button], input[type=submit]').forEach(function (b) {
      if (b.__act) return;
      var t = nhan(b);
      // bo qua cac nut da co hanh vi tu script khac
      if (/^(Add|Edit|Modify|Cancel)$/i.test(t)) return;
      if (/Reveal\/hide password/i.test(b.getAttribute('title') || '')) return;
      for (var i = 0; i < XU_LY.length; i++) {
        if (XU_LY[i][0].test(t)) {
          b.__act = true;
          b.addEventListener('click', function (e) { e.preventDefault(); XU_LY[i][1](b); });
          n++;
          break;
        }
      }
    });
    return n;
  }

  function khoiTaoDhcpAutoUpdate() {
    var ipInput = document.getElementById('widget.cbid.network.lan.ipaddr') || document.querySelector('input[name="cbid.network.lan.ipaddr"]');
    var startInput = document.getElementById('widget.cbid.network.lan.start') || document.querySelector('input[name="cbid.network.lan.start"]');
    var endInput = document.getElementById('widget.cbid.network.lan.end') || document.querySelector('input[name="cbid.network.lan.end"]');

    if (!ipInput || !startInput || !endInput) return;

    function capNhatDhcp() {
      var val = (ipInput.value || '').trim();
      var m = val.match(/^(\d{1,3}\.\d{1,3}\.\d{1,3})\.(\d{1,3})$/);
      if (m) {
        var prefix = m[1];
        startInput.value = prefix + '.2';
        endInput.value = prefix + '.254';
        startInput.dispatchEvent(new Event('input', { bubbles: true }));
        startInput.dispatchEvent(new Event('change', { bubbles: true }));
        endInput.dispatchEvent(new Event('input', { bubbles: true }));
        endInput.dispatchEvent(new Event('change', { bubbles: true }));
      }
    }

    ipInput.addEventListener('input', capNhatDhcp);
    ipInput.addEventListener('change', capNhatDhcp);
  }

  function chay() {
    var n = gan();
    if (n) console.log('[actions] da gan ' + n + ' nut');
    khoiTaoDhcpAutoUpdate();
  }
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', chay);
  else chay();
})();
