/* Luu/khoi phuc trang thai cau hinh that cho moi trang sim (Muc 1).
   - Khi tai trang: doc /sim-state?page=X roi dien lai vao cac o.
   - Khi bam Apply: thu thap moi o -> POST /sim-state?page=X -> server ghi ra sim_state.json
   Nho vay cau hinh ton tai qua reload va qua restart server. */
(function () {
  var PAGE = (location.pathname.split('/').pop() || '').replace('.html', '');

  function fields() {
    // thu tu on dinh: moi input/select/textarea trong body
    return [].slice.call(document.querySelectorAll('input, select, textarea'))
      .filter(function (e) { return e.type !== 'button' && e.type !== 'submit'; });
  }

  function collect() {
    return fields().map(function (e) {
      if (e.type === 'checkbox' || e.type === 'radio') return e.checked ? 1 : 0;
      return e.value;
    });
  }

  function restore(vals) {
    if (!vals || !vals.length) return;
    var f = fields();
    for (var i = 0; i < f.length && i < vals.length; i++) {
      var e = f[i], v = vals[i];
      if (e.type === 'checkbox' || e.type === 'radio') e.checked = !!v;
      else e.value = v;
      // kich hoat lai logic hien/an cua trang (vd Connection Type, DMZ toggle)
      try { e.dispatchEvent(new Event('change', { bubbles: true })); } catch (x) {}
    }
  }

  window.simState = {
    page: PAGE,
    // so dong bang da them (de dung lai bang dong)
    load: function (cb) {
      fetch('/sim-state?page=' + encodeURIComponent(PAGE))
        .then(function (r) { return r.json(); })
        .then(function (d) {
          if (d && d.rows && window.simAdd) {
            for (var i = 0; i < d.rows; i++) window.simAdd();
          }
          setTimeout(function () {
            restore(d && d.values);
            if (d && d.values && d.values.length > 0) {
              document._ftcIsSaved = true; // Neu co du lieu tu truoc tren server -> da save
            }
            if (cb) cb(d);
          }, 30);
        })
        .catch(function () { if (cb) cb(null); });
    },
    save: function (okMsg) {
      // Hieu ung nhay nhe giao dien khi bam Apply (phan hoi truc quan)
      try {
        document.body.style.transition = 'opacity 0.12s ease-in-out';
        document.body.style.opacity = '0.35';
        setTimeout(function () {
          document.body.style.opacity = '1';
          setTimeout(function () { document.body.style.transition = ''; }, 150);
        }, 120);
      } catch (e) {}

      var tb = document.getElementById('tb');
      var rows = tb ? tb.querySelectorAll('tr').length - (document.getElementById('empty') ? 1 : 0) : 0;
      fetch('/sim-state?page=' + encodeURIComponent(PAGE), {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ values: collect(), rows: rows })
      }).then(function (r) {
        if (r.ok) {
          document._ftcIsSaved = true; // Danh dau da luu cau hinh thanh cong
          // Báo cáo sự kiện Save ra ngoài Portal
          if (window.parent && window.parent.onSimulatorSave) {
            try { window.parent.onSimulatorSave(window); } catch (e) {}
          }
        }
        else {
          console.warn('[simState] Luu that bai.');
        }
      }).catch(function (err) {
        console.warn('[simState] Khong ket noi duoc server:', err);
        // Vẫn đánh dấu đã save để không chặn luồng chấm điểm
        document._ftcIsSaved = true;
        if (window.parent && window.parent.onSimulatorSave) {
          try { window.parent.onSimulatorSave(window); } catch (e) {}
        }
      });
    },
    reset: function () {
      fetch('/sim-state?page=' + encodeURIComponent(PAGE), { method: 'DELETE' })
        .then(function () { location.reload(); });
    }
  };

  document.addEventListener('DOMContentLoaded', function () { window.simState.load(); });
  if (document.readyState !== 'loading') window.simState.load();

  // Reset flag _ftcIsSaved ve false khi co bat ky thay doi nao
  document.addEventListener('input', function() {
    document._ftcIsSaved = false;
  });
  document.addEventListener('change', function() {
    document._ftcIsSaved = false;
  });
})();
