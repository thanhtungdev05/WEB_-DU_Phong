/* ==========================================================================
 *  BACKEND AO - FPT Mesh Router AX3000S (gia lap)
 *  Mo phong lop ubus/rpcd + trang thai thiet bi, chay hoan toan trong trinh duyet.
 *  Khong co phan cung that: moi du lieu lay tu doi tuong trang thai ao ben duoi.
 * ========================================================================== */
(function (global) {
  "use strict";

  var BOOT_TIME = Date.now() - 3 * 3600 * 1000; // gia lap da bat may 3 gio

  /* ----- TRANG THAI THIET BI AO (chinh sua de tao bai tap khac nhau) ----- */
  var DEV = {
    model: "AX3000S",
    softver: "V2.0.4",
    hardver: "V2.0",
    sn: "FPTAX3000S24A00001",
    gponsn: "FPTB0A1B2C3",
    compile_time: "2023-08-08 10:00:00",
    key: "1234567890abcdef",
    web_user: "admin",
    wizard_init: 1,
    mac: "AC:9E:17:10:20:30",
    wan_mac: "AC:9E:17:10:20:39",
    onuType: null
  };

  var WAN = [
    {
      index: 1, GUIname: "INTERNET_R_VID33", proto: "dhcp",
      mac_addr: "AC:9E:17:10:20:38", v4_status: "up", v6_status: "down",
      v4_type: "dhcp", v6_type: "", IPStack: 1, ipv6rd: 0, dslitemode: 0,
      vlanmode: 2, vlanid: 33, vlanpri: 0, vlan: 33,
      ipaddr: "113.161.75.42", subnetmask: "255.255.255.0", netmask: "255.255.255.0",
      gateway: "113.161.75.1", v4_uptime: 10800,
      dns: "210.245.24.20 210.245.24.21", dns1: "210.245.24.20", dns2: "210.245.24.21",
      nat: 1, natenable: 1, connected: true,
      // --- field cho trang WAN Configuration ---
      networktype: "dhcp", connType: "dhcp", servicelist: "INTERNET_R", enable: 1, dial: 1,
      is_defaultroute: 1, is_defaultroute_v6: 0, mtu: 1500, portbind: "", bindPort: "", multivid: 0,
      dns1v6: "", dns2v6: "", gatewayv6: "", gua: "", prefix: "",
      pppoename: "", pppoepwd: "", PPPoEStaticIPEnable: 0
    },
    {
      index: 8, GUIname: "TR069_VOICE_VID11", proto: "dhcp",
      mac_addr: "AC:9E:17:10:20:39", v4_status: "up", v6_status: "down",
      v4_type: "dhcp", v6_type: "", IPStack: 1, ipv6rd: 0, dslitemode: 0,
      vlanmode: 2, vlanid: 11, vlanpri: 0, vlan: 11,
      ipaddr: "100.72.10.15", subnetmask: "255.255.255.0", netmask: "255.255.255.0",
      gateway: "100.72.10.1", v4_uptime: 10800,
      dns: "210.245.24.20", dns1: "210.245.24.20", dns2: "",
      nat: 0, natenable: 0, connected: true,
      // --- field cho trang WAN Configuration ---
      networktype: "dhcp", connType: "dhcp", servicelist: "TR069_VOICE", enable: 1, dial: 1,
      is_defaultroute: 0, is_defaultroute_v6: 0, mtu: 1500, portbind: "", bindPort: "", multivid: 0,
      dns1v6: "", dns2v6: "", gatewayv6: "", gua: "", prefix: "",
      pppoename: "", pppoepwd: "", PPPoEStaticIPEnable: 0
    }
  ];

  var LAN = {
    ipaddr: "192.168.1.1",
    netmask: "255.255.255.0",
    dhcp_enable: 1,
    dhcp_start: "192.168.1.2",
    dhcp_end: "192.168.1.254",
    dhcp_lease: 86400,
    dns1: "",
    dns2: ""
  };

  // Trang thai cong LAN vat ly (1 = co link). LAN1,2 dang cam; LAN3,4 trong
  var LAN_PORTS = [1, 1, 0, 0];

  var RADIOS = [
    {
      band: "2.4G", ifname: "ra0", enable: 1, ssid: "",
      password: "", channel: 0, channel_now: 6, bandwidth: "40Mhz",
      security: "WPA2/WPA3-PSK", hidden: 0, txpower: 100, femstatus: "2/2"
    },
    {
      band: "5G", ifname: "rai0", enable: 1, ssid: "",
      password: "", channel: 0, channel_now: 36, bandwidth: "80Mhz",
      security: "WPA2/WPA3-PSK", hidden: 0, txpower: 100, femstatus: "3/3"
    }
  ];

  var CLIENTS = [
    { hostname: "Laptop-GV", mac: "A4:B1:C2:D3:E4:01", ipv4: "192.168.1.101", ifname: "eth0", medium: "ethernet", band: "-", rssi: "-", online: 1 },
    { hostname: "iPhone-15", mac: "A4:B1:C2:D3:E4:02", ipv4: "192.168.1.102", ifname: "rai0", medium: "wifi", band: "5G", rssi: -48, online: 1 },
    { hostname: "SmartTV", mac: "A4:B1:C2:D3:E4:03", ipv4: "192.168.1.103", ifname: "ra0", medium: "wifi", band: "2.4G", rssi: -63, online: 1 }
  ];

  /* ----- KHO CAU HINH UCI AO (mot so trang doc/ghi qua ubus "uci") ----- */
  var UCI = {
    luci: {
      main: { ".type": "core", lang: "auto" },
      languages: { ".type": "languages", en: "English", vi: "Tieng Viet" }
    },
    system: {
      "@system[0]": { ".type": "system", hostname: "FPT-AX3000S", timezone: "ICT-7", zonename: "Asia/Ho Chi Minh" }
    },
    network: {
      lan: { ".type": "interface", proto: "static", ipaddr: LAN.ipaddr, netmask: LAN.netmask }
    }
  };

  /* ----- HAM TIEN ICH ----- */
  function uptimeSec() { return Math.floor((Date.now() - BOOT_TIME) / 1000); }

  function memInfo() {
    var total = 256 * 1024 * 1024;
    var used = Math.floor(total * (0.34 + Math.random() * 0.08));
    return { total: total, free: total - used, shared: 0, buffered: 8 * 1024 * 1024, available: total - used };
  }

  function cpuPercent() { return Math.floor(8 + Math.random() * 22); }
  function memPercent() { return Math.floor(34 + Math.random() * 12); }

  // Sinh /tmp/usage.log dang "timestamp,cpu,mem"
  function usageLog() {
    var out = [], now = Math.floor(Date.now() / 1000);
    for (var i = 60; i >= 0; i--) {
      out.push((now - i * 30) + "," + cpuPercent() + "," + memPercent());
    }
    return out.join("\n");
  }

  function staTotal() {
    return CLIENTS.filter(function (c) { return c.online; }).length;
  }

  // Cay topology mesh (chi co controller)
  function meshTopology() {
    var clientsArr = CLIENTS.map(function (c) {
      return { mac: c.mac, ipv4: c.ipv4, hostname: c.hostname, ifname: c.ifname, medium: c.medium };
    });
    var topo = {
      "topology information": [
        {
          role: 1, mac: DEV.mac, ipv4: LAN.ipaddr, medium: "ethernet",
          ETH_CLIENT: clientsArr.filter(function (c) { return c.medium === "ethernet"; }),
          RADIO: RADIOS.map(function (r) {
            return {
              ifname: r.ifname,
              VAP: [{ RADIO_CLIENT: clientsArr.filter(function (c) { return c.ifname === r.ifname; }) }]
            };
          })
        }
      ]
    };
    return { TopologyInfo: JSON.stringify(topo) };
  }

  /* ----- BO DINH TUYEN UBUS: khoa = "doi_tuong.method" ----- */
  var UBUS = {
    "session.get": function () { return { values: { username: DEV.web_user } }; },
    "session.access": function () { return { access: true }; },

    "rtweb.devinfo.get": function () {
      return {
        model: DEV.model, softver: DEV.softver, hardver: DEV.hardver,
        sn: DEV.sn, gponsn: DEV.gponsn, compile_time: DEV.compile_time,
        key: DEV.key, web_user: DEV.web_user, wizard_init: DEV.wizard_init,
        mac: DEV.mac, wan_mac: DEV.wan_mac,
        ram: "256MB", flash: "128MB"
      };
    },
    "rtweb.devinfo.sysinfo": function () {
      return { uptime: uptimeSec(), cpu: cpuPercent(), mem: memPercent(), ramsize: "256MB", romsize: "128MB" };
    },

    "system.info": function () {
      return { uptime: uptimeSec(), localtime: Math.floor(Date.now() / 1000), load: [0.15, 0.11, 0.08], memory: memInfo(), swap: { total: 0, free: 0 } };
    },
    "system.board": function () {
      return {
        kernel: "5.4.164", hostname: "FPT-AX3000S", system: "Airoha EN7561",
        model: "FPT Mesh Router " + DEV.model, board_name: "fpt,ax3000s",
        release: { distribution: "OpenWrt", version: "21.02", revision: "r-fpt", target: "airoha", description: "FPT Firmware " + DEV.softver }
      };
    },

    "gwweb.netstatus.getNetStatus": function () { return { status: WAN[0].connected ? 1 : 0 }; },
    "gwweb.wancfg.status": function () { return { wan: WAN }; },
    "gwweb.wancfg.getWanCfg": function () { return { wan: WAN }; },
    "gwweb.wancfg.internet_status": function () {
      var st = WAN[0].connected ? "up" : "down";
      return { status: st, v4status: st, v6status: st, ipaddr: WAN[0].ipaddr, index: WAN[0].index };
    },
    "gwweb.wancfg.phystatus": function () { return { phystatus: true, status: 1, link: "up", speed: 1000, duplex: 1 }; },
    "gwweb.pon.sfu.get_onuType": function () { return DEV.onuType ? { onuType: DEV.onuType } : null; },
    "gwweb.portinfo.show_portinfo": function () {
      return {
        portinfo: WAN.map(function (w) {
          return { index: w.index, iswan: 1, ispon: 0, name: w.GUIname, labelname: w.GUIname, status: w.v4_status };
        })
      };
    },

    // --- LAN Ethernet Info: MAC + thong ke + IPv6 LAN ---
    "network.device.status": function (a) {
      var name = a && a.name ? a.name : "br-lan";
      var mac = (name === "ae_wan") ? DEV.wan_mac : DEV.mac;
      return {
        macaddr: mac, mtu: 1500, up: true,
        statistics: {
          rx_bytes: 125829120, rx_packets: 456789, rx_errors: 0, rx_dropped: 0,
          tx_bytes: 89128960, tx_packets: 345678, tx_errors: 0, tx_dropped: 0
        }
      };
    },
    "rtweb.lanv6cfg.get": function () { return { lladdr6: "fe80::1", ip6addr: "fe80::1", enable: 1 }; },

    "rtweb.sta.getStaNum": function () { return { total: staTotal() }; },
    "rtweb.sta.getStaList": function () { return { sta: CLIENTS }; },

    "rtweb.lancfg.getLanCfg": function () {
      return {
        ipaddr: LAN.ipaddr, netmask: LAN.netmask, subnetmask: LAN.netmask,
        dhcp_enable: LAN.dhcp_enable, dhcp_start: LAN.dhcp_start,
        dhcp_end: LAN.dhcp_end, dhcp_lease: LAN.dhcp_lease,
        dns1: LAN.dns1, dns2: LAN.dns2
      };
    },
    "rtweb.lancfg.getLanStats": function () {
      return {
        "rtweb.lancfg": LAN_PORTS.map(function (v, i) {
          return {
            devname: "LAN" + (i + 1), status: v, duplex: v ? 1 : 0, speed: v ? "1000" : "0",
            rx_bytes: v ? 1024000 * (i + 1) : 0, rx_pkts: v ? 5120 * (i + 1) : 0, rx_err: 0, rx_drops: 0,
            tx_bytes: v ? 896000 * (i + 1) : 0, tx_pkts: v ? 4608 * (i + 1) : 0, tx_err: 0, tx_drops: 0
          };
        })
      };
    },
    "rtweb.lancfg.setLanCfg": function (a) {
      if (a) {
        if (a.ipaddr) LAN.ipaddr = a.ipaddr;
        if (a.netmask) LAN.netmask = a.netmask;
        if (a.dhcp_start) LAN.dhcp_start = a.dhcp_start;
        if (a.dhcp_end) LAN.dhcp_end = a.dhcp_end;
        if (typeof a.dhcp_enable !== "undefined") LAN.dhcp_enable = a.dhcp_enable;
      }
      return { result: "ok" };
    },

    "rtweb.dhcpserver.get": function () {
      return {
        enable: LAN.dhcp_enable, dhcpmode: LAN.dhcp_enable,
        start: LAN.dhcp_start, end: LAN.dhcp_end,
        // ten field ma trang LAN (lancfgv4) doc:
        startip: LAN.dhcp_start, endip: LAN.dhcp_end, leasetime: LAN.dhcp_lease,
        dnsmode: 0, pridns: LAN.dns1, secdns: LAN.dns2, relay: "",
        lease: LAN.dhcp_lease, gateway: LAN.ipaddr, dns: LAN.dns1,
        leases: CLIENTS.map(function (c) {
          return { hostname: c.hostname, mac: c.mac, ip: c.ipv4, expire: LAN.dhcp_lease };
        })
      };
    },
    "rtweb.staticip.getStaticIP": function () {
      return { staticip: { entries: [] } };
    },
    "rtweb.staticip.addStaticIP": function () { return { result: 0 }; },
    "rtweb.staticip.delStaticIP": function () { return { result: 0 }; },
    "rtweb.sta.getStaInfo": function () {
      // DMZ/Port Forward doc total + staDevices[].ipAddr/macAddr/hostName
      return {
        total: CLIENTS.length,
        staDevices: CLIENTS.map(function (c) {
          return {
            ipAddr: c.ipv4, macAddr: c.mac,
            hostName: c.hostname, hostname: c.hostname,
            ifname: c.ifname, meshrole: "controller",
            maxstrus: 0, maxstrds: 0
          };
        }),
        sta: CLIENTS
      };
    },
    "rtweb.dhcpserver.set": function (a) {
      if (a) {
        if (typeof a.dhcpmode !== "undefined") LAN.dhcp_enable = a.dhcpmode;
        if (a.startip) LAN.dhcp_start = a.startip;
        if (a.endip) LAN.dhcp_end = a.endip;
        if (a.leasetime) LAN.dhcp_lease = a.leasetime;
      }
      return { result: "ok" };
    },

    // wlanRadioGet: khong co band -> tra ca 2 radio (trang Device Info);
    // co band -> tra dung radio do lam radios[0] (trang WiFi 2.4G/5G).
    "rtweb.wifi.wlanRadioGet": function (a) {
      function radioObj(r) {
        return {
          band: r.band, enable: r.enable, ssid: r.ssid,
          transmitPower: r.txpower, netType: (r.band === "2.4G" ? "bgnax" : "anacax"),
          bandwidth: r.bandwidth, channel: r.channel, country: "VN",
          acsTime: 0, guardInterval: "Auto", ch_2G_20: 0,
          muofdmadl: 1, muofdmaul: 1, mumimodl: 1, mumimoul: 1,
          channel_now: r.channel_now, femstatus: r.femstatus
        };
      }
      var band = a && a.band;
      if (band) {
        var r = RADIOS.filter(function (x) { return x.band === band; })[0] || RADIOS[0];
        return { radios: [radioObj(r)] };
      }
      return { radios: RADIOS.map(radioObj) };
    },
    // wlanBasicGet: tra danh sach BSS (4 SSID) cua bang tuong ung
    "rtweb.wifi.wlanBasicGet": function (a) {
      var band = (a && a.band) || "2.4G";
      var r = RADIOS.filter(function (x) { return x.band === band; })[0] || RADIOS[0];
      return {
        bss: [0, 1, 2, 3].map(function (i) {
          return {
            enable: i === 0 ? 1 : 0,
            ssid: i === 0 ? r.ssid : "",
            password: i === 0 ? r.password : "",
            securityMode: i === 0 ? "WPA2-PSK/WPA3-SAE" : "Open System",
            encrypt: "AESEncryption", hide: r.hidden, acCtrlEN: 0, maxClient: 32, wmm: 1
          };
        })
      };
    },
    "rtweb.wifi.wlanInfoGet": function () { return { wificapability: "ax" }; },
    "rtweb.wifi.wlanMLOGet": function () { return { enable: 0 }; },
    "rtweb.wifi.wlanMeshGet": function () { return { enable: 0, role: "controller" }; },
    "rtweb.wifi.wlanBandSteeringGet": function () {
      return {
        cfg: [0, 1, 2, 3].map(function (i) {
          return {
            bandsteering_enable: i === 0 ? 1 : 0, // Enable Band Steering for primary SSID
            "2.4G": {
              enable: i > 0 ? 0 : 1,
              ssid: i === 0 ? RADIOS[0].ssid : (i === 1 ? "Guest WiFi" : (i === 2 ? "" : "Wi-Fi 4")),
              password: i === 0 ? RADIOS[0].password : (i === 2 ? "" : "12345678"),
              securityMode: "WPA2-PSK"
            },
            "5G": {
              enable: i > 0 ? 0 : 1,
              ssid: i === 0 ? RADIOS[1].ssid : (i === 1 ? "Guest WiFi" : (i === 2 ? "" : "Wi-Fi 4")),
              password: i === 0 ? RADIOS[1].password : (i === 2 ? "" : "12345678"),
              securityMode: "WPA2-PSK"
            }
          };
        })
      };
    },
    // Trang 5G doc them: wlanApClientGet (repeater) + wlanGlobalGet
    "rtweb.wifi.wlanApClientGet": function () { return { enable: 0, band: "5G", link: "disconnected" }; },
    "rtweb.wifi.wlanGlobalGet": function () { return { txbf: 1, dfs: 1, country: "VN" }; },
    "rtweb.wifi.wlanRadioSet": function (a) {
      if (a && a.radios && a.radios[0]) {
        var r = a.radios[0];
        var idx = (r.band === "5G") ? 1 : 0;
        if (typeof r.enable !== "undefined") RADIOS[idx].enable = r.enable;
        if (r.transmitPower) RADIOS[idx].txpower = r.transmitPower;
        if (r.bandwidth) RADIOS[idx].bandwidth = r.bandwidth;
        if (typeof r.channel !== "undefined") RADIOS[idx].channel = r.channel;
      }
      return { result: "ok" };
    },
    "rtweb.wifi.wlanBasicSet": function (a) {
      if (a && a.bss && a.bss[0]) {
        var b = a.bss[0];
        var is5G = (b.index === 15);
        var idx = is5G ? 1 : 0;
        if (b.ssid !== undefined) {
          RADIOS[idx].ssid = b.ssid;
          if (idx === 0) {
            RADIOS[1].ssid = b.ssid; // mirror to 5G
          }
        }
        if (b.hide !== undefined) RADIOS[idx].hidden = b.hide;
      }
      return { result: "ok" };
    },
    "rtweb.wifi.wlanBasicSet_encrypt": function (a) {
      if (a && a.bss && a.bss[0]) {
        var b = a.bss[0];
        var is5G = (b.index === 15);
        var idx = is5G ? 1 : 0;
        
        var clearPassword = b.password;
        if (clearPassword && typeof CryptoJS !== "undefined") {
          try {
            var key = CryptoJS.enc.Utf8.parse(DEV.key || "1234567890abcdef");
            var iv = CryptoJS.enc.Utf8.parse('0000000000000000');
            var decrypted = CryptoJS.AES.decrypt(clearPassword, key, {
              iv: iv,
              mode: CryptoJS.mode.CBC,
              padding: CryptoJS.pad.Pkcs7
            });
            var decryptedText = decrypted.toString(CryptoJS.enc.Utf8);
            if (decryptedText) {
              clearPassword = decryptedText;
            }
          } catch (e) {
            console.error("Loi giai ma password:", e);
          }
        }

        if (b.ssid !== undefined) {
          RADIOS[idx].ssid = b.ssid;
          if (idx === 0) {
            RADIOS[1].ssid = b.ssid; // mirror to 5G
          }
        }
        if (clearPassword !== undefined) {
          RADIOS[idx].password = clearPassword;
          if (idx === 0) {
            RADIOS[1].password = clearPassword; // mirror to 5G
          }
        }
        if (b.securityMode !== undefined) {
          RADIOS[idx].security = b.securityMode;
          if (idx === 0) {
            RADIOS[1].security = b.securityMode; // mirror to 5G
          }
        }
      }
      return { result: "ok" };
    },
    "rtweb.wifi.reload": function () { return { result: "ok" }; },
    // giu tuong thich handler cu
    "rtweb.wifi.getWlanBasic": function (a) {
      var band = a && a.band ? a.band : "2.4G";
      return RADIOS.filter(function (x) { return x.band === band; })[0] || RADIOS[0];
    },
    "rtweb.wifi.setWlanBasic": function () { return { result: "ok" }; },

    "diag.fem.get_2G_status": function () { return { status: RADIOS[0].femstatus }; },
    "diag.fem.get_5G_status": function () { return { status: RADIOS[1].femstatus }; },

    "basicControl.InfoSystem.get": function () {
      return { eventlog: { action_reboot: "Power on", last_reboot: "Power on" } };
    },

    "rtweb.mesh.MeshTopyGet": function () { return meshTopology(); },
    "rtweb.mesh.getMeshCfg": function () { return { enable: 1, role: "controller" }; },
    // Trang WLAN Mesh + get_wlan_info doc: enable, role (so), meshroleexchange
    "rtweb.mesh.wlanMeshGet": function () { return { enable: 1, role: 1, meshroleexchange: 0, staDevices: [] }; },

    // --- WAN Info: VPN + thong tin PON (che do Router: PON rong) ---
    "gwweb.vpn.info": function () { return { vpninfo: [] }; },
    "rtweb.poninfo.get_linkinfo": function () { return null; },
    "rtweb.poninfo.get_capsta": function () { return null; },
    "rtweb.poninfo.get_optinfo": function () { return null; },
    "rtweb.poninfo.get_txrxsta": function () { return null; },

    // --- WAN Config: danh sach cong LAN + co tinh nang ---
    // get_lanlist: trang WAN Config doc portlist.eth / .wlan2g / .wlan5g, moi phan tu co ifname
    "gwweb.portinfo.get_lanlist": function () {
      return {
        eth: [0, 1, 2, 3].map(function (i) { return { ifname: "eth" + i, name: "LAN" + (i + 1) }; }),
        wlan2g: [{ ifname: "ra0", name: "WLAN 2.4G" }],
        wlan5g: [{ ifname: "rai0", name: "WLAN 5G" }],
        lanlist: LAN_PORTS.map(function (v, i) { return { name: "LAN" + (i + 1), index: i + 1 }; })
      };
    },
    "skapi.feature.get": function () {
      return { ipv6: 1, vpn: 1, iptv: 1, ddns: 1, qos: 1, mesh: 1, ft_pppoe_static_ip_support: 0 };
    },

    "rtweb.system.setWizardFlag": function () { DEV.wizard_init = 1; return { result: "ok" }; },
    "rtweb.system.reboot": function () { return { result: "ok" }; },

    "uci.get": function (a) {
      if (!a) return {};
      var cfg = UCI[a.config];
      if (!cfg) return { value: null };
      if (a.section && a.option) { var s = cfg[a.section]; return { value: s ? s[a.option] : null }; }
      if (a.section) return { values: cfg[a.section] || {} };
      return { values: cfg };
    },
    "uci.set": function (a) {
      if (a && a.config && a.section && a.values) {
        UCI[a.config] = UCI[a.config] || {};
        UCI[a.config][a.section] = UCI[a.config][a.section] || {};
        for (var k in a.values) UCI[a.config][a.section][k] = a.values[k];
      }
      return { result: "ok" };
    },
    "uci.apply": function () { return { result: "ok" }; },
    "uci.commit": function () { return { result: "ok" }; },

    "rtweb.session.getForbid": function () { return { count: -1 }; }
  };

  /* ----- DISPATCH: goi mot method ubus, tra [code, payload] kieu LuCI/rpcd ----- */
  function dispatch(obj, method, args) {
    var key = obj + "." + method;
    var fn = UBUS[key];
    if (typeof fn === "function") {
      try {
        var data = fn(args || {});
        // Handler tra ve null => ubus "object not found"/khong co du lieu:
        // tra result = null (dung nhu thiet bi that, vi du get_onuType o che do Router).
        if (data === null) return null;
        return [0, data === undefined ? {} : data];
      } catch (e) {
        console.error("[ubus] loi khi xu ly", key, e);
        return [1, {}];
      }
    }
    // Chua co handler rieng: doan y dinh theo ten method.
    // Method GHI (set/add/del/start/stop/apply/edit...) -> tra "ok" de nut Luu chay tren MOI trang.
    if (/set|add|del|start|stop|apply|commit|edit|save|action|reboot|restore|destroy|login|logout|inform|control|modify|trigger|remove|clear|validate|renew|scan|do_|_set|_start|_stop/i.test(method)) {
      return [0, { result: "ok", status: 0, code: 0 }];
    }
    // Method DOC chua mo phong: tra rong (trang hien khung, khong sap)
    console.warn("[ubus] chua mo phong (doc):", key, args || {});
    return [0, {}];
  }

  /* ----- Xu ly JSON-RPC (mot loi goi hoac mang batch) ----- */
  function handleRpc(req) {
    function one(r) {
      var p = r.params || [];
      return { jsonrpc: "2.0", id: r.id, result: dispatch(p[1], p[2], p[3]) };
    }
    return Array.isArray(req) ? req.map(one) : one(req);
  }

  /* ----- Xu ly /cgi-bin/cgi-exec (mot vai lenh shell mo phong) ----- */
  function handleCgiExec(command) {
    if (!command) return "";
    if (command.indexOf("usage.log") !== -1) return usageLog();
    if (command.indexOf("uptime") !== -1) return "up " + Math.floor(uptimeSec() / 3600) + " hours";
    return "";
  }

  /* ----- Xuat API cho lop net-mock ----- */
  global.SIM = {
    DEV: DEV, WAN: WAN, LAN: LAN, RADIOS: RADIOS, CLIENTS: CLIENTS, UCI: UCI,
    UBUS: UBUS,
    handleRpc: handleRpc,
    handleCgiExec: handleCgiExec,
    dispatch: dispatch,
    register: function (key, fn) { UBUS[key] = fn; }
  };

})(window);
