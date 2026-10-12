/* Bang "LAN Status" tren trang Home >> Ethernet Status.

   CAI LAI DUNG THUAT TOAN GOC, doc tu
   reference/source/assets_goc/index-DujQ2vk8.js. Nguyen van:

     u = 2000                       // refreshInterval: goi lai moi 2 giay
     cot = ["Ethernet","Status","RX Rate","TX Rate","CRC"]
     d   = ["Disconnected","Connected"]
     w   = ["not show anything","Loop Detected"]

     K(status, phyRate, loopStatus):        // cot Status
       if (status === 0) return "Disconnected"
       a = "Connected/" + phyRate + "Mbps"
       if (loopStatus !== 0) a += "/Loop Detected"
       return a

     f(e):                                   // cot RX/TX Rate
       t = {...e, txRate:0, rxRate:0}
       o = mau_truoc[e.ifName]
       if (o && e.tx > o.tx) t.txRate = (e.tx - o.tx) / (u/1000)
       if (o && e.rx > o.rx) t.rxRate = (e.rx - o.rx) / (u/1000)
       mau_truoc[e.ifName] = {tx:e.tx, rx:e.rx}

     content RX = R(t.rxRate || 0)          // R = dinh dang toc do, co so 1000
     content TX = R(t.txRate || 0)
     content CRC = t.crc.toString()

   DIEU QUAN TRONG: RX/TX Rate KHONG phai tong so byte (`rx`,`tx`) ma la
   HIEU giua hai lan doc chia cho 2 giay. Lan doc dau tien chua co mau truoc
   nen LUON bang 0 -> thiet bi that hien "0 bps" du rx = 3.826.748. Neu
   hieu nham va do thang `rx` ra man hinh thi se sai hoan toan. Day cung la
   ly do cach "so gia tri de tim anh xa" khong bao gio bat duoc hai cot nay.

   DA XAC NHAN BANG LUU LUONG THAT (2026-08-11): anh Huynn cam day vao LAN2
   va mo video, man hinh thiet bi that hien "RX Rate 401.5 bps / TX Rate
   490.5 bps". Phan ".5" chinh la dau vet cua phep chia cho 2 giay
   (401.5 = 803/2). Cong thuc duoi day dung.

   FIRMWARE GHI SAI DON VI -- GIU NGUYEN, KHONG SUA: `rx`/`tx` la so BYTE,
   ma goc chia cho so giay roi in kem don vi "bps" (bit per second) nhung
   khong nhan 8. Tuc la con so thiet bi hien nho hon 8 lan so voi don vi no
   ghi. Theo nguyen tac "giong that la tren het", ban gia lap giu y nguyen
   cach tinh sai nay -- TUYET DOI khong tu nhan 8 cho "dung". */
(function () {
  var CHU_KY = 2000;                                  // u trong ma goc
  var DV_BIT = ['bps', 'Kbps', 'Mbps', 'Gbps', 'Tbps', 'Pbps'];
  var mauTruoc = {};                                  // c.current trong ma goc

  function R(v) {                                     // dinh dang toc do (1000)
    if (typeof v !== 'number' || v < 0) return '−';
    if (v === 0) return '0 bps';
    var i = Math.floor(Math.log(v) / Math.log(1000));
    i = Math.max(0, Math.min(i, DV_BIT.length - 1));
    return Number((v / Math.pow(1000, i)).toFixed(2)) + ' ' + DV_BIT[i];
  }

  function K(status, phyRate, loopStatus) {
    if (status === 0) return 'Disconnected';
    var a = 'Connected/' + phyRate + 'Mbps';
    if (loopStatus !== 0) a += '/Loop Detected';
    return a;
  }

  function tinhRate(e) {
    var t = { txRate: 0, rxRate: 0 };
    var o = mauTruoc[e.ifName];
    if (o && e.tx > o.tx) t.txRate = (e.tx - o.tx) / (CHU_KY / 1000);
    if (o && e.rx > o.rx) t.rxRate = (e.rx - o.rx) / (CHU_KY / 1000);
    mauTruoc[e.ifName] = { tx: e.tx, rx: e.rx };
    return t;
  }

  /* Tim hang trong bang theo ten cong (o dau tien), roi ghi 4 o con lai. */
  function ghiHang(ifName, cot) {
    var o = [].slice.call(document.querySelectorAll('td,th'))
      .find(function (x) { return (x.textContent || '').trim() === ifName; });
    if (!o) return false;
    var hang = o.closest('tr');
    if (!hang) return false;
    var os = hang.querySelectorAll('td');
    // thu tu cot goc: 0 Ethernet | 1 Status | 2 RX Rate | 3 TX Rate | 4 CRC
    for (var i = 1; i < Math.min(os.length, 5); i++) {
      if (cot[i] !== undefined) os[i].textContent = cot[i];
    }
    return true;
  }

  function capNhat() {
    fetch('/api/v1/data/ext/lanstatus')
      .then(function (r) { return r.ok ? r.json() : null; })
      .then(function (ds) {
        if (!Array.isArray(ds)) return;
        var da = 0;
        ds.forEach(function (e) {
          var t = tinhRate(e);
          var ok = ghiHang(e.ifName, [
            e.ifName,
            K(e.status, e.phyRate, e.loopStatus),
            R(t.rxRate || 0),
            R(t.txRate || 0),
            String(e.crc)
          ]);
          if (ok) da++;
        });
        console.log('[lanstatus_binding] cap nhat ' + da + '/' + ds.length + ' cong');
      })
      .catch(function () {});
  }

  function chay() {
    capNhat();
    // Ma goc dat refreshInterval = 2000ms -> gia lap cung poll dung nhip do,
    // nho vay cot RX/TX Rate hoat dong dung nguyen ly (hieu giua 2 lan doc).
    setInterval(capNhat, CHU_KY);
  }

  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', chay);
  else chay();
})();
