/* Bang Port Forwarding (Network >> Port Forwarding).

   CAI LAI THEO MA GOC: reference/source/assets_goc/index-DI-HX8N3.js.
   Nguyen van phan dung tung o cua mot dong:

     cot b = [State, Name, Protocol, External Port, Device/IP, Internal Port]
     fe    = [{value:"All", children:"TCP + UDP"},
              {value:"TCP", children:"TCP"},
              {value:"UDP", children:"UDP"}]
     $(ip) = devices.find(d => d.ip4Address === ip)?.hostname || "Unknown"

     State         : chip, label = r.enabled ? "Enabled" : "Disabled"
                     (them class 'stateDisabled' khi tat)
     Name          : r.name
     Protocol      : fe.find(x => x.value === r.protocol).children
                     -> luu y "All" hien ra la "TCP + UDP"
     External Port : r.source.portRange
     Device/IP     : hai dong -- <p> ten thiet bi $(ip), <span> chinh dia chi IP
     Internal Port : r.destination.portRange

   Schema ban ghi (mac dinh J trong ma goc):
     {enabled, name, protocol, source:{portRange},
      destination:{portRange, ipAddress}}

   MAU DONG: ban chup goc cua trang co <tbody> RONG vi thiet bi that chua co
   rule nao. Anh Huynn da tao 1 rule thu (TEST_XOA_SAU) roi chup lai
   (reference/source/portforward_co_rule.html) va xoa rule di ngay sau do --
   nho vay co MAU DONG THAT thay vi phai tu che markup. Mau luu o
   spec/mau_hang.json, nap qua /mau_hang_data.js. */
(function () {
  var GIAO_THUC = { All: 'TCP + UDP', TCP: 'TCP', UDP: 'UDP' };

  function tenTrang() {
    var n = (location.pathname.split('/').pop() || '').replace('.html', '');
    return n.replace(/__t\d+$/, '');
  }
  if (tenTrang() !== 'network__portforward') return;

  function datText(goc, chon, gt) {
    var e = goc.querySelector(chon);
    if (e) e.textContent = gt;
  }

  function dungHang(mau, r, tenThietBi) {
    var d = document.createElement('tbody');
    d.innerHTML = mau;
    var tr = d.querySelector('tr');
    var o = tr.querySelectorAll('td');

    // o0: checkbox chon dong -- de nguyen, bo tick
    var cb = o[0] && o[0].querySelector('input[type="checkbox"]');
    if (cb) cb.checked = false;

    // o1: chip State
    var chip = o[1] && o[1].querySelector('.MuiChip-root');
    if (chip) {
      chip.classList.toggle('stateDisabled', !r.enabled);
      datText(o[1], '.MuiChip-label', r.enabled ? 'Enabled' : 'Disabled');
    }
    if (o[2]) o[2].textContent = r.name;
    if (o[3]) o[3].textContent = GIAO_THUC[r.protocol] || r.protocol;
    if (o[4]) o[4].textContent = (r.source || {}).portRange;

    // o5: <p> ten thiet bi, <span> dia chi IP
    var ip = (r.destination || {}).ipAddress || '';
    datText(o[5], 'p', tenThietBi(ip));
    datText(o[5], 'span', ip);

    if (o[6]) o[6].textContent = (r.destination || {}).portRange;
    // o7 Edit, o8 Delete: giu nguyen icon cua mau
    return tr;
  }

  /* Ban chup luc bang RONG KHONG co the <tbody> nao (React khong render
     tbody khi mang rong); ban chup luc co rule thi co
     <tbody class="MuiTableBody-root css-1xnox0e">. Nen phai tu tao tbody
     khi co du lieu, va go han di khi kho rong -- dung nhu thiet bi that. */
  function layTbody(tao) {
    var tb = document.querySelector('table tbody');
    if (tb || !tao) return tb;
    var bang = document.querySelector('table');
    if (!bang) return null;
    tb = document.createElement('tbody');
    tb.className = 'MuiTableBody-root css-1xnox0e';
    bang.appendChild(tb);
    return tb;
  }

  /* Khoi "No port forwarding rule is configured." chi ton tai khi bang
     RONG -- doi chieu 2 ban chup that: ban co rule
     (reference/source/portforward_co_rule.html) KHONG chua chuoi nay, ban
     rong thi co. Nen phai go han khoi do khi co du lieu, va tra lai khi
     kho rong. Giu lai trong bien de con dung lai duoc. */
  var khoiTrong = null, choKhoiTrong = null;

  function hienKhoiTrong(hien) {
    if (!khoiTrong) {
      var tw = document.createTreeWalker(document.getElementById('root') || document.body,
        NodeFilter.SHOW_TEXT), n;
      while ((n = tw.nextNode())) {
        if ((n.nodeValue || '').indexOf('No port forwarding rule') >= 0) {
          khoiTrong = n.parentElement && n.parentElement.parentElement;
          break;
        }
      }
      if (khoiTrong) choKhoiTrong = khoiTrong.parentNode;
    }
    if (!khoiTrong || !choKhoiTrong) return;
    var dangCo = khoiTrong.parentNode === choKhoiTrong;
    if (hien && !dangCo) choKhoiTrong.appendChild(khoiTrong);
    if (!hien && dangCo) choKhoiTrong.removeChild(khoiTrong);
  }

  function chay() {
    var mau = (window.__MAU_HANG || {}).portforward;
    if (!mau) return;

    Promise.all([
      fetch('/api/v1/data/portForwarding/policies').then(function (r) { return r.ok ? r.json() : null; }),
      fetch('/api/v1/data/devices').then(function (r) { return r.ok ? r.json() : []; })
    ]).then(function (kq) {
      var ds = kq[0], thietBi = kq[1] || [];
      if (!Array.isArray(ds)) return;

      function tenThietBi(ip) {
        var t = thietBi.find(function (d) { return d.ip4Address === ip; });
        return (t && t.hostname) || 'Unknown';
      }

      var tbody = layTbody(ds.length > 0);
      hienKhoiTrong(ds.length === 0);
      // Setup Add New modal
      var modal = document.getElementById('pf-modal');
      if (modal && !modal.dataset.bound) {
        modal.dataset.bound = 'true';
        var addBtn = Array.prototype.slice.call(document.querySelectorAll('button')).find(function(b) { return b.textContent.indexOf('Add New') >= 0; });
        if (addBtn) {
          addBtn.addEventListener('click', function() { modal.style.display = 'flex'; });
        }
        var btnHuy = modal.querySelector('.dlg-huy');
        if (btnHuy) {
          btnHuy.addEventListener('click', function() { modal.style.display = 'none'; });
        }
        var btnLuu = modal.querySelector('.dlg-luu');
        if (btnLuu) {
          btnLuu.addEventListener('click', function() {
            var r = {
              name: modal.querySelector('input[name="name"]').value,
              protocol: modal.querySelector('#mui-component-select-protocol').value,
              source: { portRange: modal.querySelector('input[name="source.portRange"]').value },
              destination: { 
                ipAddress: modal.querySelector('.MuiAutocomplete-input').value,
                portRange: modal.querySelector('input[name="destination.portRange"]').value 
              },
              enabled: true
            };
            var tb = layTbody(true);
            hienKhoiTrong(false);
            tb.appendChild(dungHang(mau, r, tenThietBi));
            modal.style.display = 'none';
          });
        }
      }
      if (!ds.length) {
        if (tbody && tbody.parentNode) tbody.parentNode.removeChild(tbody);
        console.log('[portforward_binding] kho rong -> khong render tbody (giong that)');
        return;
      }
      tbody.innerHTML = '';
      ds.forEach(function (r) { tbody.appendChild(dungHang(mau, r, tenThietBi)); });
      console.log('[portforward_binding] hien ' + ds.length + ' rule tu kho');

      // Setup Add New modal
      var modal = document.getElementById('pf-modal');
      if (modal) {
        var addBtn = Array.prototype.slice.call(document.querySelectorAll('button')).find(function(b) { return b.textContent.indexOf('Add New') >= 0; });
        if (addBtn) {
          addBtn.addEventListener('click', function() { modal.style.display = 'flex'; });
        }
        var btnHuy = modal.querySelector('.dlg-huy');
        if (btnHuy) {
          btnHuy.addEventListener('click', function() { modal.style.display = 'none'; });
        }
        var btnLuu = modal.querySelector('.dlg-luu');
        if (btnLuu) {
          btnLuu.addEventListener('click', function() {
            var r = {
              name: modal.querySelector('input[name="name"]').value,
              protocol: modal.querySelector('#mui-component-select-protocol').value,
              source: { portRange: modal.querySelector('input[name="source.portRange"]').value },
              destination: { 
                ipAddress: modal.querySelector('.MuiAutocomplete-input').value,
                portRange: modal.querySelector('input[name="destination.portRange"]').value 
              },
              enabled: true
            };
            var tb = layTbody(true);
            hienKhoiTrong(false);
            tb.appendChild(dungHang(mau, r, tenThietBi));
            modal.style.display = 'none';
          });
        }
      }
    }).catch(function () {});
  }

  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', chay);
  else chay();
})();
