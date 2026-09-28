/* ==========================================================================
 *  BACKEND-EXT - Mo rong backend ao: cap du lieu cho cac method "get" con lai
 *  (firewall, filter, QoS, DDNS, TR-069, port forward, NTP, chan doan, WPS...).
 *  Cac method GHI (set/add/del...) da duoc dispatch tra "ok" tu dong.
 *  Nap SAU backend.js.
 * ========================================================================== */
(function () {
  "use strict";
  if (!window.SIM || !SIM.register) { console.error("[backend-ext] SIM chua san sang"); return; }
  var R = SIM.register;
  var CLIENTS = SIM.CLIENTS, LAN = SIM.LAN;

  /* ---------------- FIREWALL / SECURITY ---------------- */
  // getFwLevel: NESTED, level la SO (option chi co 0=Low, 2=High). Dung 0 (Low) de
  // Port Forwarding/DMZ khong bi chan va dropdown chon dung "Low".
  R("rtweb.firewall.getFwLevel", function () { return { firewalllevel: { level: 0 } }; });
  // Cac cai duoi doc PHANG (resArr.enable ...):
  R("rtweb.firewall.getAclCfg", function () { return { enable: 0, defaultAction: "accept", entries: [] }; });
  R("rtweb.firewall.getDMZCfg", function () { return { enable: 0, staip: "", wan_zone: "" }; });
  R("rtweb.firewall.getAlgCfg", function () {
    return {
      sipEnable: 1, h323Enable: 1, rtspEnable: 1, ftpEnable: 1,
      tftpEnable: 1, pptpEnable: 1, l2tpEnable: 1, ipsecEnable: 1
    };
  });
  R("rtweb.firewall.getFullConeNatCfg", function () { return { enable: 0 }; });
  R("rtweb.firewall.getUPnPCfg", function () { return { enable: 1, entries: [] }; });

  R("rtweb.macfilter.getMacFilter", function () { return { macfilter: { enable: 0, mode: "blacklist", entries: [] } }; });
  R("rtweb.urlfilter.getUrlFilter", function () { return { urlfilter: { enable: 0, mode: "blacklist", entries: [] } }; });
  R("rtweb.ipfilter.getIpFilterItem", function () { return { ipfilter: { entries: [] } }; });
  R("rtweb.ipfilter.getIpFilterBasic", function () { return { ipfilter: { enable: 0, defaultAction: "accept" } }; });

  /* ---------------- NAT / PORT FORWARD / VIRTUAL SERVER ---------------- */
    let virCfgState = [];
  let virCfgIdCounter = 1;
  R("gwweb.virserver.get", function () { return { vircfg: virCfgState }; });
  R("gwweb.virserver.add", function (param) { if(param) { param.idx = virCfgIdCounter++; virCfgState.push(param); } return {result:0}; });
  R("gwweb.virserver.delete", function (param) { if(param && param.idx) { virCfgState = virCfgState.filter(item => item.idx != param.idx); } return {result:0}; });
  R("gwweb.virserver.edit", function (param) { if(param && param.idx) { let idx = virCfgState.findIndex(item => item.idx == param.idx); if(idx !== -1) { virCfgState[idx] = Object.assign({}, virCfgState[idx], param); } } return {result:0}; });

  /* ---------------- STATIC ROUTE ---------------- */
  R("rtweb.staticroute.get_static_route", function () { return { route4_num: 0, route6_num: 0, route4: [], route6: [] }; });

  /* ---------------- WAN ACCESS ---------------- */
  // parse_result doc WanAccessJson=result.wanaccess la MANG (co the rong)
  R("rtweb.wanaccess.getWanAccess", function () { return { wanaccess: [] }; });

  /* ---------------- NTP / TIME ---------------- */
  R("rtweb.ntp.getNtp", function () {
    var d = new Date();
    return {
      enable: 1, dst: 0,
      time: d.toISOString().slice(0, 19).replace("T", " "),
      server1: "pool.ntp.org", server2: "time.google.com",
      server: ["pool.ntp.org", "time.google.com"],
      timezone: "ICT-7", zonename: "Asia/Ho Chi Minh"
    };
  });

  /* ---------------- DDNS ---------------- */
  R("rtweb.ddns.getCfg", function () { return { total: 0, ddns_list: [] }; });
  R("luci.ddns.get_services_status", function () { return {}; });

  /* ---------------- UPnP ---------------- */
  R("luci.upnp.get_status", function () { return { rules: [] }; });

  /* ---------------- TR-069 / ACS ---------------- */
  R("gwweb.tr069.get_acs_cfg", function () {
    return {
      Enable: 1, DataModel: "tr098", PeriodicEnable: true, PeriodicInterval: 43200,
      AcsUrl: "http://acs.fpt.vn:7547", AcsUser: "fpt", AcsPwd: "",
      SoapMessageDebugEnable: false,
      url: "http://acs.fpt.vn:7547", username: "fpt"
    };
  });
  R("gwweb.tr069.get_tr069_status", function () {
    return { status: "connected", ACSstatus: "connected", last_inform: "2026-07-14 19:00:00", last_session: "success" };
  });
  R("gwweb.tr069.get_stun_cfg", function () { return { enable: 0, server: "", port: 3478 }; });
  R("gwweb.tr069.get_acs_ssl_cfg", function () { return { validate: 0, KeyPassword: "" }; });

  /* ---------------- QoS ---------------- */
  R("gwweb.qos.qoscom_get", function () { return { enable: 0, qos_enable: 0, upbandwidth: 0, downbandwidth: 0 }; });
  R("gwweb.qos.qosclass_get", function () { return { qos_class: [], list: [], class: [] }; });
  R("gwweb.qos.qosapp_get", function () { return { qos_app: [], list: [], app: [] }; });
  R("gwweb.qos.qosflow_get", function () { return { qos_flow: [], list: [], flow: [] }; });
  // QosQueue[0].enable duoc doc truc tiep -> phai co mang khong rong
  R("gwweb.qos.qosqueue_get", function () {
    return { qos_queue: [0, 1, 2, 3, 4, 5, 6, 7].map(function (i) { return { enable: "0", id: i, weight: 0 }; }) };
  });
  R("gwweb.qos.qospolicer_get", function () { return { qos_policer: [], list: [], policer: [] }; });

  /* ---------------- SCHEDULE (bat/tat theo lich) ---------------- */
  R("gwweb.schedule.getSchedule", function () { return { schedule: { entries: [] } }; });

  /* ---------------- IPTV ---------------- */
  R("rtweb.iptv.getIptvInfo", function () { return { enable: 0, proxy_enable: false, wanname: "", mode: "bridge", vlan: 0, list: [] }; });

  /* ---------------- HIDDEN PAGE ---------------- */
  R("rtweb.hidepage.getCfg", function () { return { ssh: 0, telnet: 0, enable: 0 }; });

  /* ---------------- VPN ---------------- */
  R("gwweb.vpn.get", function () { return { vpncfg: [] }; });

  /* ---------------- ACCOUNT (SSH / TELNET) ---------------- */
  R("gwweb.account.get_ssh", function () { return { name: "admin", enable: 0, port: 22 }; });
  R("gwweb.account.get_telnet", function () { return { name: "admin", enable: 0, port: 23 }; });

  /* ---------------- CHAN DOAN (Diagnostics) ---------------- */
  R("diag.ping.ping_conf_get", function () { return { is_working: 0, Taskid: 1, host: "8.8.8.8", count: 4, size: 64, protocol: "ipv4", time: 4, status: "idle" }; });
  R("diag.ping.ping_result", function () { return { is_working: 0, status: "idle", result: "", output: "" }; });
  R("diag.tracert.tracert_conf_get", function () { return { is_working: 0, Taskid: 1, host: "8.8.8.8", maxhop: 30, protocol: "ipv4", status: "idle" }; });
  R("diag.tracert.tracert_result", function () { return { is_working: 0, status: "idle", result: "", output: "" }; });
  R("diag.dns.dns_conf_get", function () { return { is_working: 0, Taskid: 1, host: "google.com", time: 4, protocol: "ipv4", server: "8.8.8.8", status: "idle" }; });
  R("diag.dns.dns_result", function () { return { is_working: 0, status: "idle", result: "", output: "" }; });
  R("diag.speedtest.speedtest_status_get", function () { return { status: "idle" }; });
  R("diag.speedtest.speedtest_result_get", function () { return { download: 0, upload: 0, ping: 0, jitter: 0, status: "idle" }; });
  R("diag.speedtest.speedtest_urlcfg_get", function () { return { list: [] }; });
  R("diag.pktcap.pktcapture_res_get", function () { return { status: "idle", files: [] }; });
  R("diag.pktmirror.pktmirror_conf_get", function () { return { enable: 0, dst: "" }; });

  /* ---------------- WiFi mo rong ---------------- */
  R("rtweb.wifi.wlanWpsGet", function () { return { radios: [{ wpsEnable: 0, wpsMethods: "pbc", wpsStatus: "idle", pin: "12345670" }] }; });
  R("rtweb.wifi.wlanScanResultGet", function () { return { aplist: [], list: [], number2: 0, number5: 0 }; });
  // lanStaInfo doc result.bss (list station wifi); rong la an toan
  R("rtweb.wifi.wlanStaGet", function () { return { bss: [] }; });
  R("rtweb.wifi.wlanPSQLimitGet", function () { return { enable: 0, limit: 0 }; });
  R("rtweb.wifi.wlanBasicStat", function () { return {}; });
  R("rtweb.wifi.acl.getWlanAcl", function () { return { enable: 0, mode: "blacklist", list: [], staDevices: [] }; });

  /* ---------------- HE THONG (System Tools) ---------------- */
  R("rtweb.system.get_log_conf", function () { return { level: 6, enable: 0, remote: 0, server: "", port: 514 }; });
  R("rtweb.system.get_led_status", function () { return { enable: 1 }; });
  R("rtweb.system.get_schrestart", function () {
    return {
      Enable: 0, Hour: 3, Minute: 0,
      Monday: false, Tuesday: false, Wednesday: false, Thursday: false,
      Friday: false, Saturday: false, Sunday: false
    };
  });
  R("rtweb.system.get_schwifi_fpt", function () { return { enable: 0, wifitask: [], time_start: "23:00", time_end: "06:00" }; });
  R("rtweb.system.get_tmpfile", function () { return {}; });

  console.log("[backend-ext] Da nap them", 40, "method get (firewall, qos, ddns, tr069, chan doan...)");
})();
