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

      function moModalPortforward() {
        if (typeof window.__moHopThoaiBieuMau !== 'function') {
          console.warn('[portforward_binding] __moHopThoaiBieuMau khong ton tai');
          return;
        }
        var h = window.__moHopThoaiBieuMau('dialog_portforward_add');
        if (!h) return;
        var goc = h.goc;

        // Setup Protocol select dropdown
        var oProtocolInput = goc.querySelector('input[name="protocol"]');
        var hopChon = goc.querySelector('#mui-component-select-protocol');
        if (hopChon && oProtocolInput) {
          var oChu = hopChon.querySelector('span') || hopChon;
          if (oProtocolInput.value) oChu.textContent = oProtocolInput.value;
          if (typeof window.__noiOChon === 'function') {
            window.__noiOChon(hopChon, oProtocolInput, [
              { gt: 'TCP + UDP', chu: 'TCP + UDP' },
              { gt: 'TCP', chu: 'TCP' },
              { gt: 'UDP', chu: 'UDP' }
            ], function (gt) {
              var s = hopChon.querySelector('span');
              if (s) s.textContent = gt; else hopChon.textContent = gt;
            });
          }
        }

        // Setup Device / IP Autocomplete
        var oIp = goc.querySelector('.MuiAutocomplete-input');
        if (oIp) {
          var dsIP = (thietBi && thietBi.length > 0) ? thietBi.map(function(d) {
            return { gt: d.ip4Address, chu: (d.hostname || 'Unknown') + ' (' + d.ip4Address + ')' };
          }) : [
            { gt: '192.168.1.20', chu: 'Camera (192.168.1.20)' },
            { gt: '192.168.1.100', chu: 'PC-Office (192.168.1.100)' }
          ];
          var nhanO = oIp.closest('.MuiFormControl-root') ? oIp.closest('.MuiFormControl-root').querySelector('.MuiInputLabel-root') : null;

          if (typeof window.__moPopupAutocomplete === 'function') {
            var btnDropdown = oIp.closest('.MuiAutocomplete-root') ? oIp.closest('.MuiAutocomplete-root').querySelector('.MuiAutocomplete-popupIndicator') : null;
            function moAuto() {
              window.__moPopupAutocomplete(oIp, dsIP, oIp.dataset.simIp || oIp.value || '', function(gt, chu) {
                if (gt) {
                  oIp.value = gt;
                  oIp.dataset.simIp = gt;
                  if (nhanO && window.__dongBoNhanChonThuc) window.__dongBoNhanChonThuc(nhanO, true);
                }
              });
            }
            oIp.addEventListener('click', moAuto);
            if (btnDropdown) btnDropdown.addEventListener('click', moAuto);
          }
        }

        // Wire Save button (.dlg-luu)
        var btnLuu = goc.querySelector('.dlg-luu');
        if (btnLuu) {
          btnLuu.addEventListener('click', function() {
            var nameInput = goc.querySelector('input[name="name"]');
            var nameVal = (nameInput ? nameInput.value : '').trim();
            var protoVal = (oProtocolInput ? oProtocolInput.value : '') || (hopChon ? hopChon.textContent.trim() : 'TCP + UDP');
            if (protoVal === 'TCP_UDP') protoVal = 'TCP + UDP';
            var srcInput = goc.querySelector('input[name="source.portRange"]');
            var srcPort = (srcInput ? srcInput.value : '').trim();
            var ipVal = (oIp ? (oIp.dataset.simIp || oIp.value) : '').trim();
            var ipMatch = ipVal.match(/\b(?:\d{1,3}\.){3}\d{1,3}\b/);
            var cleanIp = ipMatch ? ipMatch[0] : ipVal;
            var dstInput = goc.querySelector('input[name="destination.portRange"]');
            var dstPort = (dstInput ? dstInput.value : '').trim();
            var oEnabled = goc.querySelector('input[name="enabled"]');
            var isEnabled = oEnabled ? oEnabled.checked : true;

            var r = {
              name: nameVal,
              protocol: protoVal,
              source: { portRange: srcPort },
              destination: {
                ipAddress: cleanIp,
                portRange: dstPort
              },
              enabled: isEnabled
            };

            var tb = layTbody(true);
            hienKhoiTrong(false);
            tb.appendChild(dungHang(mau, r, tenThietBi));

            // Persist to backend API
            fetch('/api/v1/data/portForwarding/policies', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify([r])
            }).catch(function() {});

            h.dong();

            // Notify parent / test runner
            if (window.parent && typeof window.parent.onSimulatorSave === 'function') {
              try { window.parent.onSimulatorSave(window); } catch (e) {}
            }
            if (window.top && typeof window.top.onSimulatorSave === 'function') {
              try { window.top.onSimulatorSave(window); } catch (e) {}
            }
            try {
              window._ftcIsSaved = true;
              if (window.parent) window.parent._ftcIsSaved = true;
              if (window.top) window.top._ftcIsSaved = true;
            } catch (e) {}
          });
        }
      }

      function wireAddButton() {
        var addBtn = Array.prototype.slice.call(document.querySelectorAll('button')).find(function(b) {
          return b.textContent.indexOf('Add New') >= 0;
        });
        if (addBtn && !addBtn.dataset.wired) {
          addBtn.dataset.wired = 'true';
          addBtn.addEventListener('click', moModalPortforward);
        }
      }

      wireAddButton();

      if (!ds.length) {
        if (tbody && tbody.parentNode) tbody.parentNode.removeChild(tbody);
        console.log('[portforward_binding] kho rong -> khong render tbody (giong that)');
        return;
      }
      tbody.innerHTML = '';
      ds.forEach(function (r) { tbody.appendChild(dungHang(mau, r, tenThietBi)); });
      console.log('[portforward_binding] hien ' + ds.length + ' rule tu kho');
    }).catch(function () {});
  }

  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', chay);
  else chay();
})();
