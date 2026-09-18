/**
 * devices/vigor2927/lessons/bai6.js
 * Bài 6: Cấu hình định tuyến Failover và Load Balancing trên DrayTek Vigor2927
 *
 * ĐẶC THÙ CỦA BÀI NÀY (khác Bài 1-5): cấu hình trải qua 3 TRANG khác nhau
 *   Trang 1: WAN >> General Setup  (doc/mwangen1.htm)  -> bấm OK: ở lại trang (giống thiết bị thật)
 *   Trang 2: WAN1 (doc/mwangen.htm)                    -> bấm OK: quay về General Setup (giống thiết bị thật)
 *   Trang 3: WAN2 (_pages/wan_03.html qua wan.cgi)     -> bấm OK: lưu tại chỗ (giống 2 trang trên),
 *                                                          học viên TỰ bấm nút "Nộp bài & Chấm điểm"
 *                                                          ở toolbar để kết thúc bài (không tự động)
 *
 * Vì mỗi lần điều hướng, trình duyệt HỦY DOM của trang trước, nên KHÔNG thể đợi tới lúc
 * nộp bài rồi mới đọc giá trị của 3 trang. Giải pháp: chụp lại ("snapshot") giá trị của
 * từng trang NGAY LÚC bấm OK trên chính trang đó, lưu vào kho ở tầng window của portal
 * (window không bị tải lại khi iframe con điều hướng), rồi chấm gộp từ kho này.
 */

window.DEVICE_VIGOR2927_LESSONS = window.DEVICE_VIGOR2927_LESSONS || [];

/* ══════════════════════════════════════════════════════════════════════════
   BẢNG ĐÁP ÁN — CHỈ CẦN SỬA GIÁ TRỊ Ở ĐÂY KHI ĐỔI YÊU CẦU ĐỀ BÀI
   ══════════════════════════════════════════════════════════════════════════ */
/* Tên hiển thị của droplist "Load Balance Weights" — dùng chung cho cả đề bài lẫn bảng chấm */
var VG2927_BAI6_TEN_WEIGHTS = {
  '0': 'Custom',
  '1': 'Bandwidth-Based',
  '2': 'Quality-Based',
  '3': 'Reliability-Based'
};

/* Tên hiển thị của droplist "Link Condition Detection > Mode" */
var VG2927_BAI6_TEN_DETECT = {
  '0': 'Disable',
  '1': 'Ping Detect',
  '2': 'Http Detect'
};

var VG2927_BAI6_DAPAN = {
  overview: {
    lbBased: '1',    // Mode: 1 = Session Based, 0 = IP Based
    lbMode: '0',     // Line Speed: 0 = According to Line Speed, 1 = Auto Detect
    lbWeights: '1'   // Load Balance Weights: xem VG2927_BAI6_TEN_WEIGHTS ở trên
  },
  wan1: {
    enable: '1',            // Enable: Yes
    displayName: 'ISP-1',
    downKbps: 80000,        // Line Speed DownLink, tính theo Kbps
    upKbps: 80000,          // Line Speed UpLink, tính theo Kbps
    detectMode: '0',        // Link Condition Detection Mode: xem VG2927_BAI6_TEN_DETECT
    actMode: '0'            // Active Mode: 0 = Always On, 1 = Backup
  },
  wan2: {
    enable: '1',
    displayName: 'ISP-2',
    downKbps: 80000,
    upKbps: 80000,
    detectMode: '0',        // Link Condition Detection Mode: xem VG2927_BAI6_TEN_DETECT
    actMode: '0'
  }
};

/* Quy đổi giá trị Line Speed về Kbps để so sánh.
   Ô nhập có kèm droplist đơn vị: '0' = Kbps, '1' = Mbps.
   Nhờ vậy học viên nhập "80000 + Kbps" hay "80 + Mbps" đều được chấp nhận (tương đương nhau). */
function vg2927Bai6ToKbps(val, unit) {
  var n = parseInt(String(val).trim(), 10);
  if (isNaN(n)) return NaN;
  return (String(unit) === '0') ? n : n * 1000;
}

/* ══════════════════════════════════════════════════════════════════════════
   KHO LƯU TRẠNG THÁI 3 TRANG (sống ở window của portal, không mất khi iframe đổi trang)
   ══════════════════════════════════════════════════════════════════════════ */
function vg2927Bai6Store() {
  if (!window._FTC_VG2927_BAI6) {
    window._FTC_VG2927_BAI6 = { overview: null, wan1: null, wan2: null };
  }
  return window._FTC_VG2927_BAI6;
}

function vg2927Bai6Reset() {
  window._FTC_VG2927_BAI6 = { overview: null, wan1: null, wan2: null };
  window._FTC_VG2927_BAI6_LASTPAGE = null;
  window._FTC_VG2927_BAI6_SCOPE = null;
}

/* Có nên ẩn nút "⚠️ Xem lỗi sai" không?
   Chỉ hiện khi học viên THỰC SỰ làm sai ở một trang ĐÃ bấm OK. Các trang chưa tới lượt làm
   thì không tính là lỗi. (app.js quyết định hiện nút này dựa trên kết quả chấm GỘP cả 3 trang,
   nên nếu để nguyên thì mới làm xong trang 1 đã thấy nút báo lỗi — vô lý với học viên.) */
function vg2927Bai6NenAnNutLoi() {
  var store = vg2927Bai6Store();
  var daLam = ['overview', 'wan1', 'wan2'].filter(function (k) { return !!store[k]; });
  if (daLam.length === 0) return true;                 // chưa bấm OK trang nào -> chưa thể sai
  return daLam.every(function (k) {                    // các trang đã làm đều đúng -> không có lỗi
    return vg2927Bai6TrangDaDung(store, k);
  });
}

function vg2927Bai6ChinhNutLoi() {
  try {
    var lesson = window._currentLesson;
    if (!lesson || lesson.id !== 'vg2927-bai6') return;
    var btn = document.getElementById('btn-guide-errors');
    if (!btn) return;
    if (vg2927Bai6NenAnNutLoi() && btn.style.display !== 'none') {
      btn.style.display = 'none';
    }
  } catch (e) {}
}

/* Bắt sự kiện bấm nút "⚠️ Xem lỗi sai" ở pha capture — chạy TRƯỚC handler của app.js —
   để đánh dấu lần chấm kế tiếp chỉ soi riêng trang học viên vừa bấm OK.
   Đồng thời theo dõi nút bằng MutationObserver: mỗi khi app.js bật nút lên mà thực ra
   học viên chưa sai gì thì ẩn lại NGAY trong cùng nhịp render — nên không bị nháy. */
function vg2927Bai6HookNutXemLoi() {
  if (window._FTC_VG2927_BAI6_HOOKED) return;
  var btn = document.getElementById('btn-guide-errors');
  if (!btn) return;

  btn.addEventListener('click', function () {
    var lesson = window._currentLesson;
    if (!lesson || lesson.id !== 'vg2927-bai6') return;
    window._FTC_VG2927_BAI6_SCOPE = window._FTC_VG2927_BAI6_LASTPAGE || null;
  }, true);

  try {
    new MutationObserver(vg2927Bai6ChinhNutLoi)
      .observe(btn, { attributes: true, attributeFilter: ['style'] });
  } catch (e) {}

  window._FTC_VG2927_BAI6_HOOKED = true;
}

/* Nhận diện đang ở trang nào: 'overview' | 'wan1' | 'wan2' | null */
function vg2927Bai6WhichPage(win) {
  try {
    var doc = win.document;
    if (doc.getElementsByName('iBwLBMode').length > 0 && doc.getElementsByName('enchkwan0').length > 0) {
      return 'overview';
    }
    if (doc.getElementsByName('iBwWanEnable').length > 0) {
      var idx = String(win.iInetWanIdx);
      if (idx === '1') return 'wan1';
      if (idx === '2') return 'wan2';
    }
  } catch (e) {}
  return null;
}

function vg2927Bai6Val(doc, name) {
  var el = doc.getElementsByName(name)[0];
  return el ? String(el.value).trim() : '';
}

function vg2927Bai6Checked(doc, name) {
  var el = doc.getElementsByName(name)[0];
  return el ? !!el.checked : false;
}

/* Chụp giá trị trang General Setup */
function vg2927Bai6CaptureOverview(doc) {
  return {
    enWan1: vg2927Bai6Checked(doc, 'enchkwan0'),
    lbWan1: vg2927Bai6Checked(doc, 'ldbchken0'),
    enWan2: vg2927Bai6Checked(doc, 'enchkwan1'),
    lbWan2: vg2927Bai6Checked(doc, 'ldbchken1'),
    lbBased: vg2927Bai6Val(doc, 'iBwLBBased'),
    lbMode: vg2927Bai6Val(doc, 'iBwLBMode'),
    lbWeights: vg2927Bai6Val(doc, 'inBwLW'),
    savedAt: Date.now()
  };
}

/* Chụp giá trị trang chi tiết WAN1/WAN2.
   Ô hiển thị là uilBwLB*, ô ẩn (đã quy đổi Kbps) là ulBwLB* — ưu tiên ô hiển thị. */
function vg2927Bai6CaptureWan(doc) {
  function rate(visible, hidden) {
    var v = vg2927Bai6Val(doc, visible);
    if (v !== '' && v !== '0') return v;
    var h = vg2927Bai6Val(doc, hidden);
    return (h !== '' && h !== '0') ? h : v;
  }
  return {
    enable: vg2927Bai6Val(doc, 'iBwWanEnable'),
    displayName: vg2927Bai6Val(doc, 'sBwWanDisName'),
    actMode: vg2927Bai6Val(doc, 'iBwActMode'),
    loadBalance: vg2927Bai6Checked(doc, 'iLdBlnc'),
    detectMode: vg2927Bai6Val(doc, 'sNBMode'),
    downLink: rate('uilBwLBInRate', 'ulBwLBInRate'),
    downUnit: vg2927Bai6Val(doc, 'uilBwLBInRateUnit'),
    upLink: rate('uilBwLBOutRate', 'ulBwLBOutRate'),
    upUnit: vg2927Bai6Val(doc, 'uilBwLBOutRateUnit'),
    savedAt: Date.now()
  };
}

/* ══════════════════════════════════════════════════════════════════════════
   BỘ THEO DÕI CHẠY NỀN (cài 1 lần, sống trong window portal)
   Nhiệm vụ:
     1) Mở khoá 2 ô Line Speed trên trang WAN1/WAN2. Firmware khoá chúng bằng AngularJS
        (ng-disabled) theo cờ phần cứng của thiết bị lúc crawl. Vì bài học yêu cầu chọn
        "According to Line Speed" rồi nhập tốc độ cho từng WAN, nếu không mở khoá thì học
        viên không thao tác được. (Cùng tinh thần với việc bật cứng tab IPv6 — memory 2.16.)
     2) Phục hồi giá trị đã lưu khi học viên quay lại một trang đã cấu hình trước đó
        (do dự án chưa có đường ghi cấu hình WAN xuống config_store, mỗi lần tải lại
        trang sẽ trả về giá trị mặc định gốc).
   ══════════════════════════════════════════════════════════════════════════ */
function vg2927Bai6AllWindows(rootWin) {
  var list = [];
  (function walk(w) {
    try {
      if (!w || !w.document) return;
      list.push(w);
      for (var i = 0; i < w.frames.length; i++) {
        if (w.frames[i] && w.frames[i] !== w) walk(w.frames[i]);
      }
    } catch (e) {}
  })(rootWin);
  return list;
}

function vg2927Bai6UnlockLineSpeed(doc) {
  ['uilBwLBInRate', 'uilBwLBInRateUnit', 'uilBwLBOutRate', 'uilBwLBOutRateUnit'].forEach(function (n) {
    var el = doc.getElementsByName(n)[0];
    if (el && el.disabled) el.disabled = false;
  });
}

function vg2927Bai6RestoreOverview(doc, snap) {
  function setChk(name, on) {
    var el = doc.getElementsByName(name)[0];
    if (el) el.checked = !!on;
  }
  function setVal(name, v) {
    var el = doc.getElementsByName(name)[0];
    if (el && v !== '' && v !== undefined) el.value = v;
  }
  setChk('enchkwan0', snap.enWan1);
  setChk('ldbchken0', snap.lbWan1);
  setChk('enchkwan1', snap.enWan2);
  setChk('ldbchken1', snap.lbWan2);
  setVal('iBwLBBased', snap.lbBased);
  setVal('iBwLBMode', snap.lbMode);
  setVal('inBwLW', snap.lbWeights);
}

function vg2927Bai6RestoreWan(doc, snap) {
  function setVal(name, v) {
    var el = doc.getElementsByName(name)[0];
    if (el && v !== '' && v !== undefined) el.value = v;
  }
  setVal('iBwWanEnable', snap.enable);
  setVal('sBwWanDisName', snap.displayName);
  setVal('iBwActMode', snap.actMode);
  setVal('sNBMode', snap.detectMode);
  setVal('uilBwLBInRate', snap.downLink);
  setVal('uilBwLBInRateUnit', snap.downUnit);
  setVal('uilBwLBOutRate', snap.upLink);
  setVal('uilBwLBOutRateUnit', snap.upUnit);
  var lb = doc.getElementsByName('iLdBlnc')[0];
  if (lb) lb.checked = !!snap.loadBalance;
}

function vg2927Bai6InstallWatcher() {
  if (window._FTC_VG2927_BAI6_WATCH) return;
  window._FTC_VG2927_BAI6_WATCH = setInterval(function () {
    try {
      var lesson = window._currentLesson;
      if (!lesson || lesson.id !== 'vg2927-bai6') return;
      var frame = document.getElementById('device-iframe');
      if (!frame || !frame.contentWindow) return;

      vg2927Bai6ChinhNutLoi();

      var store = vg2927Bai6Store();
      vg2927Bai6AllWindows(frame.contentWindow).forEach(function (w) {
        var page = vg2927Bai6WhichPage(w);
        if (!page) return;
        var doc = w.document;

        if (page === 'wan1' || page === 'wan2') vg2927Bai6UnlockLineSpeed(doc);

        if (!doc._ftcBai6Restored) {
          doc._ftcBai6Restored = true;
          var snap = store[page];
          if (snap) {
            if (page === 'overview') vg2927Bai6RestoreOverview(doc, snap);
            else vg2927Bai6RestoreWan(doc, snap);
          }
        }
      });
    } catch (e) {}
  }, 600);
}

/* ══════════════════════════════════════════════════════════════════════════
   XÂY BẢNG TIÊU CHÍ CHO TỪNG TRANG
   Tách riêng ở đây để DÙNG CHUNG cho 2 việc: chấm điểm cuối bài (customGrading)
   và kiểm tra tại chỗ khi bấm OK ở một trang (onSimSave). Nhờ vậy điều kiện đáp án
   chỉ viết MỘT LẦN — đổi đáp án không sợ sót chỗ nào.
   ══════════════════════════════════════════════════════════════════════════ */
var VG2927_BAI6_CHUA_LUU = 'Chưa vào trang này hoặc chưa bấm OK để lưu';

function vg2927Bai6RowsOverview(store) {
  var gs = store.overview;
  var dapAn = VG2927_BAI6_DAPAN;
  var ra = [];
  function gsRow(id, name, expected, ok, actual) {
    ra.push({
      id: id, name: name, expected: expected,
      actual: gs ? actual : 'Chưa cấu hình',
      passed: !!(gs && ok),
      message: !gs ? VG2927_BAI6_CHUA_LUU : (ok ? 'Chính xác' : 'Chưa đúng yêu cầu đề bài')
    });
  }
  gsRow('gs_wan1_enable', '[General Setup] WAN1 — tick Enable', 'Có tick',
    gs && gs.enWan1, gs && gs.enWan1 ? 'Có tick' : 'Không tick');
  gsRow('gs_wan1_lb', '[General Setup] WAN1 — tick Load Balance', 'Có tick',
    gs && gs.lbWan1, gs && gs.lbWan1 ? 'Có tick' : 'Không tick');
  gsRow('gs_wan2_enable', '[General Setup] WAN2 — tick Enable', 'Có tick',
    gs && gs.enWan2, gs && gs.enWan2 ? 'Có tick' : 'Không tick');
  gsRow('gs_wan2_lb', '[General Setup] WAN2 — tick Load Balance', 'Có tick',
    gs && gs.lbWan2, gs && gs.lbWan2 ? 'Có tick' : 'Không tick');
  gsRow('gs_lb_based', '[General Setup] Mode: Session Based', 'Session Based',
    gs && gs.lbBased === dapAn.overview.lbBased,
    gs ? (gs.lbBased === '1' ? 'Session Based' : 'IP Based') : '');
  gsRow('gs_lb_mode', '[General Setup] Line Speed: According to Line Speed', 'According to Line Speed',
    gs && gs.lbMode === dapAn.overview.lbMode,
    gs ? (gs.lbMode === '0' ? 'According to Line Speed' : 'Auto Detect') : '');
  var tenWeightsDung = VG2927_BAI6_TEN_WEIGHTS[dapAn.overview.lbWeights];
  gsRow('gs_lb_weights', '[General Setup] Load Balance Weights: ' + tenWeightsDung, tenWeightsDung,
    gs && gs.lbWeights === dapAn.overview.lbWeights,
    gs ? (VG2927_BAI6_TEN_WEIGHTS[gs.lbWeights] || gs.lbWeights || '(trống)') : '');
  return ra;
}

function vg2927Bai6RowsWan(store, key, nhan) {
  var snap = store[key];
  var mong = VG2927_BAI6_DAPAN[key];
  var ra = [];

  function row(id, name, expected, ok, actual) {
    ra.push({
      id: id, name: name, expected: expected,
      actual: snap ? actual : 'Chưa cấu hình',
      passed: !!(snap && ok),
      message: !snap ? VG2927_BAI6_CHUA_LUU : (ok ? 'Chính xác' : 'Chưa đúng yêu cầu đề bài')
    });
  }

  row(key + '_enable', '[' + nhan + '] Enable: Yes', 'Yes',
    snap && snap.enable === mong.enable,
    snap ? (snap.enable === '1' ? 'Yes' : 'No') : '');

  row(key + '_name', '[' + nhan + '] Display Name: ' + mong.displayName, mong.displayName,
    snap && snap.displayName === mong.displayName,
    snap ? (snap.displayName || '(trống)') : '');

  /* Line Speed: quy đổi về Kbps rồi mới so sánh, nên nhập "80000 + Kbps"
     hay "80 + Mbps" đều được chấp nhận vì giá trị thực tế như nhau. */
  function dongLineSpeed(id, nhanO, giaTri, donVi, mongKbps) {
    var kbps = snap ? vg2927Bai6ToKbps(giaTri, donVi) : NaN;
    var hienThi = '';
    if (snap) {
      var don = (String(donVi) === '0') ? 'Kbps' : 'Mbps';
      hienThi = (giaTri === '' || giaTri === undefined) ? '(trống)' : (giaTri + ' ' + don);
      if (!isNaN(kbps) && don === 'Mbps') hienThi += ' (= ' + kbps + ' Kbps)';
    }
    row(id, '[' + nhan + '] Line Speed ' + nhanO, mongKbps + ' Kbps',
      snap && kbps === mongKbps, hienThi);
  }
  dongLineSpeed(key + '_downlink', 'DownLink',
    snap ? snap.downLink : '', snap ? snap.downUnit : '', mong.downKbps);
  dongLineSpeed(key + '_uplink', 'UpLink',
    snap ? snap.upLink : '', snap ? snap.upUnit : '', mong.upKbps);

  var tenDetectDung = VG2927_BAI6_TEN_DETECT[mong.detectMode];
  row(key + '_detect', '[' + nhan + '] Link Condition Detection: ' + tenDetectDung, tenDetectDung,
    snap && snap.detectMode === mong.detectMode,
    snap ? (VG2927_BAI6_TEN_DETECT[snap.detectMode] || snap.detectMode || '(trống)') : '');

  row(key + '_actmode', '[' + nhan + '] Active Mode: Always On', 'Always On',
    snap && snap.actMode === mong.actMode,
    snap ? (snap.actMode === '0' ? 'Always On' : 'Backup') : '');

  return ra;
}

/* Trang `key` đã cấu hình đúng toàn bộ chưa? */
function vg2927Bai6TrangDaDung(store, key) {
  var ds = (key === 'overview')
    ? vg2927Bai6RowsOverview(store)
    : vg2927Bai6RowsWan(store, key, key.toUpperCase());
  return ds.length > 0 && ds.every(function (d) { return d.passed; });
}

/* Hiện một dòng phản hồi ngay cạnh nút OK của trang thiết bị.
   Cần cho cả chế độ Thực hành — nơi nút "⚠️ Xem lỗi sai" trên thanh công cụ không hoạt động,
   nếu không học viên bấm OK mà trang đứng yên sẽ tưởng nút bị hỏng. */
function vg2927Bai6BaoTrangThai(doc, ok, chu) {
  try {
    // app.js tự chèn dòng xanh "✔ Đã lưu cấu hình!" mỗi lần bấm OK. Khi trang đang SAI,
    // để nguyên dòng đó cạnh dòng báo lỗi đỏ sẽ mâu thuẫn -> xoá đi cho rõ ràng.
    if (!ok) {
      var cuaAppJs = doc.getElementById('ftc-save-status');
      if (cuaAppJs) cuaAppJs.textContent = '';
    }

    var el = doc.getElementById('ftc-bai6-status');
    if (!el) {
      el = doc.createElement('div');
      el.id = 'ftc-bai6-status';
      el.style.cssText = 'margin-top:10px; text-align:center; font-weight:bold; font-size:13px;';
      var nut = doc.getElementsByName('submit')[0] || doc.getElementsByName('btnOk')[0];
      var neo = nut ? (nut.closest('table') || nut.parentNode) : doc.body;
      if (neo && neo.parentNode) neo.parentNode.insertBefore(el, neo.nextSibling);
      else doc.body.appendChild(el);
    }
    el.style.color = ok ? '#15803d' : '#dc2626';
    el.textContent = chu;
  } catch (e) {}
}

/* ══════════════════════════════════════════════════════════════════════════
   BÀI HỌC
   ══════════════════════════════════════════════════════════════════════════ */
window.DEVICE_VIGOR2927_LESSONS.push({
  id: 'vg2927-bai6',
  title: 'Cấu hình định tuyến Failover và Load Balancing',
  subtitle: 'Cấu hình Load Balancing & Route Failover',
  instructions: [
    '<b>Yêu cầu:</b>',
    'Thực hiện cấu hình cân bằng tải (Load Balancing) và dự phòng (Failover) trên DrayTek Vigor2927',
    '- Username: <span class="val">admin</span>',
    '- Password: <span class="val">admin</span>',
    '<b>Trang 1 — WAN >> General Setup:</b>',
    '- Bật <span class="val">Enable</span> và <span class="val">Load Balance</span> cho cả <b>WAN1</b> và <b>WAN2</b>',
    '- Mode: chọn <span class="val">Session Based</span>',
    '- Line Speed: chọn <span class="val">According to Line Speed</span>',
    '- Load Balance Weights: chọn <span class="val">' + VG2927_BAI6_TEN_WEIGHTS[VG2927_BAI6_DAPAN.overview.lbWeights] + '</span>',
    '- Nhấn <b>OK</b> (vẫn ở lại trang này), sau đó bấm vào <b>WAN1</b>',
    '<b>Trang 2 — WAN1:</b>',
    '- Enable: <span class="val">Yes</span>',
    '- Display Name: <span class="val">ISP-1</span>',
    '- Line Speed DownLink: <span class="val">80000</span> Kbps, UpLink: <span class="val">80000</span> Kbps <i>(nhớ chọn đơn vị Kbps; nhập 80 Mbps cũng được chấp nhận vì tương đương)</i>',
    '- Link Condition Detection — Mode: <span class="val">' + VG2927_BAI6_TEN_DETECT[VG2927_BAI6_DAPAN.wan1.detectMode] + '</span>',
    '- Active Mode: <span class="val">Always On</span>',
    '- Nhấn <b>OK</b> (tự quay về General Setup), sau đó bấm vào <b>WAN2</b>',
    '<b>Trang 3 — WAN2:</b>',
    '- Enable: <span class="val">Yes</span>',
    '- Display Name: <span class="val">ISP-2</span>',
    '- Line Speed DownLink: <span class="val">80000</span> Kbps, UpLink: <span class="val">80000</span> Kbps',
    '- Link Condition Detection — Mode: <span class="val">' + VG2927_BAI6_TEN_DETECT[VG2927_BAI6_DAPAN.wan2.detectMode] + '</span>',
    '- Active Mode: <span class="val">Always On</span>',
    '- Nhấn <b>OK</b> — đây là nút cuối cùng, hệ thống sẽ Nộp bài & Chấm điểm toàn bộ bài Lab'
  ],
  practiceUrl: '/sim_vigor2927/weblogin.htm',

  /* Đầu phiên (đang ở màn hình login) thì xoá kho trạng thái của lần làm trước */
  onSimLoad: function (rootWin) {
    try {
      var href = (rootWin && rootWin.location && rootWin.location.href)
        ? String(rootWin.location.href).toLowerCase() : '';
      if (href.indexOf('weblogin') !== -1) vg2927Bai6Reset();
    } catch (e) {}
    vg2927Bai6HookNutXemLoi();
    vg2927Bai6InstallWatcher();
  },

  /* Mỗi lần bấm OK trên BẤT KỲ trang nào trong 3 trang */
  onSimSave: function (simWin) {
    try {
      var page = vg2927Bai6WhichPage(simWin);
      if (!page) return;
      var doc = simWin.document;

      // Nút OK của trang WAN là <input type=submit> nên onSimulatorSave có thể bị gọi 2 lần
      // (một lần từ listener click, một lần từ listener submit) -> chặn trùng trong 1.5s.
      var now = Date.now();
      if (doc._ftcBai6LastSave && (now - doc._ftcBai6LastSave) < 1500) return;
      doc._ftcBai6LastSave = now;

      var store = vg2927Bai6Store();
      window._FTC_VG2927_BAI6_LASTPAGE = page;   // trang vừa bấm OK — dùng cho nút "Xem lỗi sai"

      if (page === 'overview') {
        store.overview = vg2927Bai6CaptureOverview(doc);
        // Giống thiết bị thật: luôn ở lại trang General Setup, chỉ báo trạng thái cho học viên biết
        if (vg2927Bai6TrangDaDung(store, 'overview')) {
          vg2927Bai6BaoTrangThai(doc, true, '✔ Đã lưu cấu hình General Setup. Bấm vào WAN1 để cấu hình tiếp.');
        } else {
          vg2927Bai6BaoTrangThai(doc, false,
            '⚠ Cấu hình trang General Setup chưa đúng — vui lòng kiểm tra và sửa lại, sau đó bấm OK lại.');
        }
        return;
      }

      if (page === 'wan1') {
        store.wan1 = vg2927Bai6CaptureWan(doc);

        // CÒN SAI thì Ở LẠI trang WAN1 để học viên sửa, không cho qua trang khác.
        if (!vg2927Bai6TrangDaDung(store, 'wan1')) {
          vg2927Bai6BaoTrangThai(doc, false,
            '⚠ Cấu hình WAN1 chưa đúng — vui lòng kiểm tra và sửa lại ngay trên trang này, sau đó bấm OK lại.');
          return;
        }

        // ĐÚNG HẾT: giống thiết bị thật — đóng trang WAN1, quay về General Setup
        vg2927Bai6BaoTrangThai(doc, true, '✔ Đã lưu cấu hình WAN1. Đang quay lại trang General Setup...');
        setTimeout(function () {
          try { simWin.location.href = '/sim_vigor2927/doc/mwangen1.htm'; } catch (e) {}
        }, 700);
        // Trang General Setup khi tải lại sẽ tự phát sinh sự kiện input/change lúc khởi tạo,
        // khiến app.js tắt cờ "vừa lưu" và khoá nút "⚠️ Xem lỗi sai". Bật lại khi trang đã ổn định.
        setTimeout(function () { window._hasClickedSaveInGuide = true; }, 1900);
        return;
      }

      if (page === 'wan2') {
        store.wan2 = vg2927Bai6CaptureWan(doc);

        // CÒN SAI thì Ở LẠI trang WAN2 để học viên sửa — y hệt General Setup và WAN1.
        if (!vg2927Bai6TrangDaDung(store, 'wan2')) {
          vg2927Bai6BaoTrangThai(doc, false,
            '⚠ Cấu hình WAN2 chưa đúng — vui lòng kiểm tra và sửa lại ngay trên trang này, sau đó bấm OK lại.');
          return;
        }

        // ĐÚNG HẾT: chỉ báo đã lưu xong, KHÔNG tự bấm hộ nút "Nộp bài & Chấm điểm" —
        // nút đó là của học viên, để họ tự quyết định lúc nào bấm nộp bài.
        // (app.js tự động mở khoá nút này khi phát hiện cả 3 trang đã đúng, không cần can thiệp thêm.)
        vg2927Bai6BaoTrangThai(doc, true,
          '✔ Đã lưu cấu hình WAN2. Bấm nút "Nộp bài & Chấm điểm" ở góc trên bên phải để hoàn tất bài Lab.');
      }
    } catch (e) {}
  },

  grading: {
    description: 'Kiểm tra cấu hình Failover & Load Balancing Vigor2927 (3 trang)',
    rules: [
      { id: 'gs_wan1_enable', name: '[General Setup] WAN1 — tick Enable', selector: 'input[name="enchkwan0"]', expected: 'Có tick', type: 'text_exact', required: true },
      { id: 'gs_wan1_lb', name: '[General Setup] WAN1 — tick Load Balance', selector: 'input[name="ldbchken0"]', expected: 'Có tick', type: 'text_exact', required: true },
      { id: 'gs_wan2_enable', name: '[General Setup] WAN2 — tick Enable', selector: 'input[name="enchkwan1"]', expected: 'Có tick', type: 'text_exact', required: true },
      { id: 'gs_wan2_lb', name: '[General Setup] WAN2 — tick Load Balance', selector: 'input[name="ldbchken1"]', expected: 'Có tick', type: 'text_exact', required: true },
      { id: 'gs_lb_based', name: '[General Setup] Mode: Session Based', selector: 'select[name="iBwLBBased"]', expected: 'Session Based', type: 'text_exact', required: true },
      { id: 'gs_lb_mode', name: '[General Setup] Line Speed: According to Line Speed', selector: 'select[name="iBwLBMode"]', expected: 'According to Line Speed', type: 'text_exact', required: true },
      { id: 'gs_lb_weights', name: '[General Setup] Load Balance Weights: ' + VG2927_BAI6_TEN_WEIGHTS[VG2927_BAI6_DAPAN.overview.lbWeights], selector: 'select[name="inBwLW"]', expected: VG2927_BAI6_TEN_WEIGHTS[VG2927_BAI6_DAPAN.overview.lbWeights], type: 'text_exact', required: true },
      { id: 'wan1_enable', name: '[WAN1] Enable: Yes', selector: 'select[name="iBwWanEnable"]', expected: 'Yes', type: 'text_exact', required: true },
      { id: 'wan1_name', name: '[WAN1] Display Name: ISP-1', selector: 'input[name="sBwWanDisName"]', expected: VG2927_BAI6_DAPAN.wan1.displayName, type: 'text_exact', required: true },
      { id: 'wan1_downlink', name: '[WAN1] Line Speed DownLink', selector: 'input[name="uilBwLBInRate"]', expected: VG2927_BAI6_DAPAN.wan1.downKbps + ' Kbps', type: 'text_exact', required: true },
      { id: 'wan1_uplink', name: '[WAN1] Line Speed UpLink', selector: 'input[name="uilBwLBOutRate"]', expected: VG2927_BAI6_DAPAN.wan1.upKbps + ' Kbps', type: 'text_exact', required: true },
      { id: 'wan1_detect', name: '[WAN1] Link Condition Detection: ' + VG2927_BAI6_TEN_DETECT[VG2927_BAI6_DAPAN.wan1.detectMode], selector: 'select[name="sNBMode"]', expected: VG2927_BAI6_TEN_DETECT[VG2927_BAI6_DAPAN.wan1.detectMode], type: 'text_exact', required: true },
      { id: 'wan1_actmode', name: '[WAN1] Active Mode: Always On', selector: 'select[name="iBwActMode"]', expected: 'Always On', type: 'text_exact', required: true },
      { id: 'wan2_enable', name: '[WAN2] Enable: Yes', selector: 'select[name="iBwWanEnable"]', expected: 'Yes', type: 'text_exact', required: true },
      { id: 'wan2_name', name: '[WAN2] Display Name: ISP-2', selector: 'input[name="sBwWanDisName"]', expected: VG2927_BAI6_DAPAN.wan2.displayName, type: 'text_exact', required: true },
      { id: 'wan2_downlink', name: '[WAN2] Line Speed DownLink', selector: 'input[name="uilBwLBInRate"]', expected: VG2927_BAI6_DAPAN.wan2.downKbps + ' Kbps', type: 'text_exact', required: true },
      { id: 'wan2_uplink', name: '[WAN2] Line Speed UpLink', selector: 'input[name="uilBwLBOutRate"]', expected: VG2927_BAI6_DAPAN.wan2.upKbps + ' Kbps', type: 'text_exact', required: true },
      { id: 'wan2_detect', name: '[WAN2] Link Condition Detection: ' + VG2927_BAI6_TEN_DETECT[VG2927_BAI6_DAPAN.wan2.detectMode], selector: 'select[name="sNBMode"]', expected: VG2927_BAI6_TEN_DETECT[VG2927_BAI6_DAPAN.wan2.detectMode], type: 'text_exact', required: true },
      { id: 'wan2_actmode', name: '[WAN2] Active Mode: Always On', selector: 'select[name="iBwActMode"]', expected: 'Always On', type: 'text_exact', required: true }
    ],

    customGrading: function () {
      var store = vg2927Bai6Store();

      /* Mỗi trang một mảng tiêu chí riêng, cuối hàm mới ghép lại theo phạm vi cần hiển thị */
      var rows = {
        overview: vg2927Bai6RowsOverview(store),
        wan1: vg2927Bai6RowsWan(store, 'wan1', 'WAN1'),
        wan2: vg2927Bai6RowsWan(store, 'wan2', 'WAN2')
      };

      var tatCa = rows.overview.concat(rows.wan1, rows.wan2);

      /* ── Phạm vi hiển thị ──────────────────────────────────────────────
         Bấm "⚠️ Xem lỗi sai" giữa chừng: CHỈ soi tiêu chí của trang học viên vừa
         bấm OK — không liệt kê các trang chưa tới lượt làm (tránh báo "Chưa cấu
         hình" hàng loạt gây hiểu nhầm là làm sai).
         Mọi lần gọi khác (nộp bài cuối, và các lần app.js tự đánh giá để quyết định
         mở/khoá nút "Nộp bài & Chấm điểm") vẫn chấm GỘP đủ cả 3 trang.
         Cờ dưới đây là loại "dùng một lần": đọc xong xoá ngay.              */
      var pham_vi = window._FTC_VG2927_BAI6_SCOPE;
      window._FTC_VG2927_BAI6_SCOPE = null;

      if (pham_vi && rows[pham_vi]) {
        var rieng = rows[pham_vi].slice();
        var soDung = rieng.filter(function (d) { return d.passed; }).length;
        var duTrang = !!(store.overview && store.wan1 && store.wan2);

        /* Trang này đã đúng hết -> không có gì để sửa ở đây. Nhưng phải nói rõ vì sao bài
           vẫn chưa xong: hoặc còn trang khác ĐANG SAI, hoặc còn trang CHƯA LÀM.
           Giữ passed = false để app.js không mở nhầm nút "Nộp bài & Chấm điểm". */
        if (soDung === rieng.length && !duTrang) {
          var TEN_TRANG = { overview: 'General Setup', wan1: 'WAN1', wan2: 'WAN2' };
          var trangSai = ['overview', 'wan1', 'wan2'].filter(function (k) {
            return store[k] && k !== pham_vi && !vg2927Bai6TrangDaDung(store, k);
          });

          if (trangSai.length > 0) {
            rieng.push({
              id: 'trang_khac_con_loi',
              name: '[Cần sửa] Trang khác đang có lỗi',
              expected: 'Cả 3 trang đều đúng',
              actual: 'Đang sai ở: ' + trangSai.map(function (k) { return TEN_TRANG[k]; }).join(', '),
              passed: false,
              message: 'Trang này đã đúng. Hãy quay lại trang ' +
                trangSai.map(function (k) { return TEN_TRANG[k]; }).join(', ') + ' để sửa.'
            });
          } else {
            var buocKeTiep = !store.wan1
              ? 'Bấm vào WAN1 trên bảng để cấu hình tiếp'
              : (!store.wan2 ? 'Bấm vào WAN2 trên bảng để cấu hình tiếp' : 'Quay lại hoàn tất các trang còn thiếu');
            rieng.push({
              id: 'buoc_ke_tiep',
              name: '[Bước tiếp theo] Hoàn tất cả 3 trang',
              expected: 'General Setup + WAN1 + WAN2',
              actual: 'Trang này đã cấu hình đúng',
              passed: false,
              message: buocKeTiep
            });
          }
        }

        var soDungRieng = rieng.filter(function (d) { return d.passed; }).length;
        return {
          passed: duTrang && soDungRieng === rieng.length,
          score: Math.round((soDungRieng / rieng.length) * 100),
          passedCount: soDungRieng,
          totalRules: rieng.length,
          details: rieng
        };
      }

      var totalRules = tatCa.length;
      var passedCount = tatCa.filter(function (d) { return d.passed; }).length;

      return {
        passed: passedCount === totalRules,
        score: Math.round((passedCount / totalRules) * 100),
        passedCount: passedCount,
        totalRules: totalRules,
        details: tatCa
      };
    }
  },

  guidePopups: (window.TOOLTIPS_VIGOR2927 && window.TOOLTIPS_VIGOR2927['vg2927-bai6']) || [
    {
      selector: '#menu-wan:not(.open) .menu-text, #menu-wan:not(.open)',
      text: 'Bước 1: chọn WAN',
      position: 'bottom',
      hideOnPage: 'mwangen1|mwangen|wan.cgi'
    },
    {
      selector: '#sub-wan:not(.hidden) #menu-wan-general .menu-text, #sub-wan:not(.hidden) #menu-wan-general',
      text: 'Bước 2: chọn General Setup',
      position: 'bottom',
      hideOnPage: 'mwangen1|mwangen|wan.cgi'
    },
    {
      selector: '.ldbn select[name="iBwLBBased"], select[name="iBwLBBased"]',
      text: 'Bước 3: chọn Session Based',
      position: 'right',
      page: 'mwangen1'
    },
    {
      selector: '.ldbn select[name="iBwLBMode"], select[name="iBwLBMode"]',
      text: 'Bước 4: chọn According to Line Speed',
      position: 'right',
      page: 'mwangen1'
    },
    {
      selector: 'input[name="btnOk"], input[value="OK"]',
      text: 'Bước 5: chọn OK để lưu cấu hình, sau đó cấu hình tiếp WAN1 và WAN2.',
      position: 'top',
      page: 'mwangen1'
    },
    /* Trang WAN1 (doc/mwangen.htm) — dùng 'mwangen.htm' (có đuôi .htm) để KHÔNG bị trùng
       với trang tổng 'mwangen1.htm' (so khớp theo chuỗi con: "mwangen.htm" không nằm
       trong "mwangen1.htm" vì có số 1 chen giữa). */
    {
      selector: 'input[name="sBwWanDisName"]',
      text: 'Bước 1: nhập ISP-1',
      position: 'right',
      page: 'mwangen.htm'
    },
    {
      selector: 'select[name="uilBwLBInRateUnit"]',
      text: 'Bước 2: nhập 80 Mbps',
      position: 'right',
      page: 'mwangen.htm'
    },
    {
      selector: 'select[name="uilBwLBOutRateUnit"]',
      text: 'Bước 3: nhập 80 Mbps',
      position: 'right',
      page: 'mwangen.htm'
    },
    {
      selector: 'input[name="submit"], input[value="OK"]',
      text: 'Bước 4: chọn OK',
      position: 'top',
      page: 'mwangen.htm'
    },
    /* Trang WAN2 — xem giải thích chi tiết trong devices/vigor2927/tooltips/bai6.js (file thực
       sự có tác dụng, nạp trước file này). "wan.cgi" là chuỗi duy nhất trong URL của trang WAN2
       trong phạm vi Bài 6, không lẫn với General Setup hay WAN1. */
    {
      selector: 'input[name="sBwWanDisName"]',
      text: 'Bước 1: nhập ISP-2',
      position: 'right',
      page: 'wan.cgi'
    },
    {
      selector: 'select[name="uilBwLBInRateUnit"]',
      text: 'Bước 2: nhập 80 Mbps',
      position: 'right',
      page: 'wan.cgi'
    },
    {
      selector: 'select[name="uilBwLBOutRateUnit"]',
      text: 'Bước 3: nhập 80 Mbps',
      position: 'right',
      page: 'wan.cgi'
    },
    {
      selector: 'input[name="submit"], input[value="OK"]',
      text: 'Bước 4: chọn OK',
      position: 'top',
      page: 'wan.cgi'
    }
  ]
});
