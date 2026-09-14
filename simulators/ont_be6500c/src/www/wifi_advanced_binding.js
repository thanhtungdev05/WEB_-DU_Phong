/* Trang Wi-Fi ▸ Advanced -- module rieng.

   Hai tab, hai nghiep vu khac han:
     t0 "Radios" : sua bang tan/kenh tung radio, co nut Save
     t1 "Other"  : cong tac MLO, TU LUU ngay khi doi (khong co nut Save)

   Nguon: reference/source/assets_goc/index-CdFMqTaa.js

   THAN PATCH radios -- trich nguyen van tu ma goc:
     i.radios.map(A => {
       const {id, band, bandwidth, autoChannelEnabled, channel, dfsEnabled} = A;
       return {id, bandwidth, autoChannelEnabled,
               channel: autoChannelEnabled ? 0 : channel,
               ...(band === '5G' && {dfsEnabled})};
     })
   -> chi 4 khoa (5 khoa neu la 5G). KHONG gui band, possibleChannels,
      bandwidthSupported, stats...

   THAN PATCH easyMesh (tab Other) -- trich nguyen van:
     {enabled: form.mloEnabled ? true : easyMesh.enabled,
      ssidTypesConfigurations: easyMesh.ssidTypesConfigurations
        .filter(h => h.uiConfigurable)
        .map(h => ({type: h.type, mloEnabled: form.mloEnabled}))}

   Hai quy tac dan xuat, cung tu ma goc:
     - Luc NAP : neu autoChannelEnabled thi hien channel = 0 ("Auto")
     - Luc GHI : autoChannelEnabled = (channel === 0) */
(function () {
  'use strict';

  var RADIOS = null;
  var EASYMESH = null;
  var thanhSave = null;
  var dangNap = false;
  var dangGhi = false;

  function tenTep() {
    var n = (location.pathname.split('/').pop() || '').replace('.html', '');
    /* GD5: bo tien to 'm_' cua ban DIEN THOAI truoc khi nhan dien trang.
       Neu khong, module nay se khong nhan ra 'm_<route>' va thoat ngay ->
       moi trang dien thoai mat sach phan noi du lieu. Loi da bat duoc
       2026-08-14 khi kiem ban dien thoai cua trang LAN. */
    if (n.indexOf('m_') === 0) n = n.slice(2);
    return n;
  }
  function laTrangNay() {
    return /^wifi__advanced(__t\d+)?$/.test(tenTep());
  }
  function timO(ten) {
    return document.querySelector('[name="' + CSS.escape(ten) + '"]');
  }
  function baoLoi(msg) {
    console.error('[wifi_advanced] ' + msg);
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

  function coORadio() { return !!document.querySelector('#root [name^="radios."]'); }
  function coOMlo() { return !!timO('mloEnabled'); }

  function chiSoRadio() {
    var ds = [];
    document.querySelectorAll('#root [name^="radios."]').forEach(function (el) {
      var m = /^radios\.(\d+)\./.exec(el.getAttribute('name'));
      if (m && ds.indexOf(Number(m[1])) < 0) ds.push(Number(m[1]));
    });
    return ds.sort(function (a, b) { return a - b; });
  }

  function nap() {
    dangNap = true;
    return Promise.all([
      coORadio()
        ? fetch('/api/v1/data/radios', { cache: 'no-store' })
            .then(function (r) { return r.ok ? r.json() : []; })
        : Promise.resolve(null),
      coOMlo()
        ? fetch('/api/v1/data/easyMesh', { cache: 'no-store' })
            .then(function (r) { return r.ok ? r.json() : null; })
        : Promise.resolve(null)
    ]).then(function (kq) {
      RADIOS = kq[0];
      EASYMESH = kq[1];
      var da = 0;

      if (RADIOS) {
        chiSoRadio().forEach(function (i) {
          var r = RADIOS[i];
          if (!r) return;
          var bw = timO('radios.' + i + '.bandwidth');
          if (bw) { bw.value = r.bandwidth; da++; }
          var ch = timO('radios.' + i + '.channel');
          // Ma goc: autoChannelEnabled -> hien channel = 0 ("Auto")
          if (ch) { ch.value = String(r.autoChannelEnabled ? 0 : r.channel); da++; }
          var df = timO('radios.' + i + '.dfsEnabled');
          if (df) { df.checked = !!r.dfsEnabled; da++; }

          /* GD5 phan 2 nhom Wi-Fi (2026-08-14): hai o Select nay (Bandwidth,
             Channel) truoc gio CHUA TUNG duoc noi menu -- bang chung tinh
             chi chup dung 1 gia tri dang chon, khong co popup, nen chua ai
             goi __noiOChon() cho chung, o Select khong sổ ra duoc. Phat
             hien khi kiem dien thoai nhung loi nay co tren CA MAY TINH (moi
             trang deu dung chung ham nap() nay).
             Danh sach tuy chon LAY THAT tu API (radios[].bandwidthSupported
             / .possibleChannels), KHONG bia -- day la truong du lieu that
             tra ve tu thiet bi (xem STATUS.md GD4: 'giu truong khong gui
             len (possibleChannels)'), khong phai suy doan.
             Nhan hien thi: so sanh gia tri dang chon (vd '20MHz') voi chu
             dang ve tren o Select luc chup ('20') -> quy tac la BO hau to
             'MHz'; 'Auto' giu nguyen. Kenh: 0 -> 'Auto', con lai -> so. */
          if (bw && window.__noiOChon) {
            var oBw = document.getElementById('mui-component-select-radios.' + i + '.bandwidth');
            if (oBw) {
              var dsBw = (r.bandwidthSupported || []).map(function (v) {
                return { gt: v, chu: v.replace(/MHz$/, '') };
              });
              window.__noiOChon(oBw, bw, dsBw);
              oBw.textContent = bw.value.replace(/MHz$/, '');
            }
          }
          if (ch && window.__noiOChon) {
            var oCh = document.getElementById('mui-component-select-radios.' + i + '.channel');
            if (oCh) {
              var dsCh = [{ gt: '0', chu: 'Auto' }].concat(
                (r.possibleChannels || []).map(function (c) {
                  return { gt: String(c), chu: String(c) };
                })
              );
              window.__noiOChon(oCh, ch, dsCh);
              oCh.textContent = (ch.value === '0') ? 'Auto' : ch.value;
            }
          }
        });
      }

      if (EASYMESH) {
        var mlo = timO('mloEnabled');
        if (mlo) {
          // Ma goc: some(uiConfigurable && mloEnabled)
          mlo.checked = (EASYMESH.ssidTypesConfigurations || []).some(
            function (x) { return x.uiConfigurable && x.mloEnabled; });
          da++;
        }
      }

      if (window.__simSync) window.__simSync();
      console.log('[wifi_advanced] nap ' + da + ' o');
    }).catch(function (e) {
      console.error('[wifi_advanced] nap that bai:', e);
    }).then(function () {
      setTimeout(function () { dangNap = false; }, 0);
    });
  }

  function thanRadios() {
    return chiSoRadio().map(function (i) {
      var r = RADIOS[i];
      if (!r) return null;
      var bw = timO('radios.' + i + '.bandwidth');
      var ch = timO('radios.' + i + '.channel');
      var df = timO('radios.' + i + '.dfsEnabled');
      var kenh = ch ? Number(ch.value) : r.channel;
      var tuDong = (kenh === 0);        // ma goc: autoChannelEnabled = channel===0
      var b = {
        id: r.id,
        bandwidth: bw ? bw.value : r.bandwidth,
        autoChannelEnabled: tuDong,
        channel: tuDong ? 0 : kenh
      };
      // dfsEnabled CHI gui khi la bang 5G
      if (r.band === '5G') b.dfsEnabled = df ? df.checked : !!r.dfsEnabled;
      return b;
    }).filter(Boolean);
  }

  function thanEasyMesh() {
    var bat = !!(timO('mloEnabled') || {}).checked;
    return {
      enabled: bat ? true : (EASYMESH && EASYMESH.enabled),
      ssidTypesConfigurations: (EASYMESH.ssidTypesConfigurations || [])
        .filter(function (x) { return x.uiConfigurable; })
        .map(function (x) { return { type: x.type, mloEnabled: bat }; })
    };
  }

  function patch(res, than) {
    return fetch('/api/v1/data/' + res, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(than)
    }).then(function (r) {
      if (!r.ok) throw new Error(res + ' -> HTTP ' + r.status);
    });
  }

  function luu(res, than, thongBaoLoi) {
    if (dangGhi) return Promise.resolve();
    dangGhi = true;
    return patch(res, than)
      .then(function () { goThanhSave(); return nap(); })
      .then(function () {
        return new Promise(function (ok) {
          setTimeout(function () { dangGhi = false; ok(); }, 0);
        });
      }, function (e) {
        dangGhi = false;
        baoLoi(thongBaoLoi + '  (' + e.message + ')');
      });
  }

  function goThanhSave() {
    if (thanhSave && thanhSave.parentNode) {
      thanhSave.parentNode.removeChild(thanhSave);
    }
    thanhSave = null;
  }

  function hienThanhSave() {
    if (thanhSave) return;
    var neo = document.querySelector('#root form') || document.getElementById('root');
    if (!neo) return;
    var w = document.createElement('div');
    w.className = 'MuiStack-root alternative-layout css-den97n';
    w.setAttribute('data-sim-save', '1');
    /* Cau truc nut da doi chieu truc tiep tren thiet bi that (2026-08-18,
       trang System > User, cung component chia se cho toan bo ung dung --
       xem ISSUES.md/STATUS.md muc "system/user - thanh Save/Cancel"). */
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
    // Tab Radios cung hien hop thoai "Before we continue..." truoc khi luu.
    w.querySelector('.submit').addEventListener('click', function () {
      var hop = window.__moHopThoai && window.__moHopThoai('wifi_save');
      var chay = function () {
        luu('radios', thanRadios(),
            'Changes saving failed, please try again.');
      };
      if (!hop) return chay();
      if (hop.oTiepTuc) {
        hop.oTiepTuc.addEventListener('click', function () {
          hop.dong(); chay();
        });
      }
    });
    w.querySelector('.cancel').addEventListener('click', function () {
      nap();
    });
  }

  function theoDoi() {
    var vung = document.getElementById('root');
    if (!vung || vung.__wifiAdvTheoDoi) return;
    vung.__wifiAdvTheoDoi = true;
    ['input', 'change'].forEach(function (loai) {
      vung.addEventListener(loai, function (e) {
        if (dangNap || dangGhi) return;
        if (thanhSave && thanhSave.contains(e.target)) return;
        var n = e.target && e.target.getAttribute
          && e.target.getAttribute('name');
        if (!n) return;

        if (n === 'mloEnabled') {
          // Ma goc: watch -> submit ngay, KHONG co nut Save.
          var bat = !!e.target.checked;
          luu('easyMesh', thanEasyMesh(),
              'Changes saving failed, please try again.').then(function () {
            console.log('[wifi_advanced] '
              + (bat ? 'Enabled' : 'Disable') + ' MLO successfully.');
          });
          return;
        }
        if (n.indexOf('radios.') === 0) hienThanhSave();
      });
    });
  }

  function batDau() {
    if (!laTrangNay()) return;
    nap().then(function () {
      theoDoi();
      hienThanhSave();
    });
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', batDau);
  } else {
    batDau();
  }
})();
