# -*- coding: utf-8 -*-
"""
TAC DONG LEN CAY UCI cua cac loi goi ghi — AX3000CV2 (OS 0.5.3)
================================================================

Moi trang ghi qua data_repo.* / alg / aei-route / ssh / easymesh tren thiet bi that
DONG THOI sua tep /etc/config/*. Module nay tai hien dung phan do de `uci get` va tep
Backup doi theo (CLAUDE.md muc 2.5 — sua trang A thi trang B doi theo).

BANG CHUNG: reference/api/hop_dong_uci_nhom11.json (do that 2026-09-25, anh Huynn cho
phep: moi loai set 1 lan roi tra ve; chup Backup truoc/sau, so tung dong etc/config).

QUY TAC CHUNG (do that, dung cho moi ham): option doi gia tri / option moi -> CHUYEN
XUONG CUOI section; giu gia tri -> giu cho; '' -> xoa option. Nhieu option cung doi thi
xuong cuoi theo THU TU GHI cua tung ham (ghi ro o tung ham ben duoi).

Moi ham chi tai hien DUNG nhung truong da do. Truong chua do: KHONG dong vao uci (ghi ro).
"""
import json

import ax3000c_uci as U


def _b(v):
    """true/'1'/1 -> '1'; con lai -> '0' (do that: moi co boolean ghi '1'/'0')."""
    if isinstance(v, str):
        return "1" if v.strip().lower() in ("1", "true") else "0"
    return "1" if v else "0"


class _Goi:
    """Mot config dang sua dang danh sach section (uci.tu_cay)."""

    def __init__(self, cay_cfg):
        self.ds = U.tu_cay(cay_cfg or {})
        self.doi = False

    def ten(self):
        return U.ten_cac_section(self.ds)

    def theo_ten(self, ten):
        for t, s in zip(self.ten(), self.ds):
            if t == ten:
                return s
        return None

    def an_danh(self, loai, thu_tu):
        """Section an danh thu `thu_tu` (0,1,...) cung kieu."""
        l = [s for s in self.ds if s["name"] is None and s["type"] == loai]
        return l[thu_tu] if thu_tu < len(l) else None

    def theo_option(self, loai, k, v):
        for s in self.ds:
            if s["type"] == loai and any(o[0] == k and o[1] == v for o in s["opts"]):
                return s
        return None

    def dat(self, sec, k, v):
        if sec is not None and U.dat_option(sec, k, v):
            self.doi = True

    def them(self, loai, ten, opts):
        self.ds.append({"type": loai, "name": ten, "opts": [[k, v] for k, v in opts if v not in (None, "")]})
        self.doi = True

    def xoa(self, sec):
        if sec is not None and sec in self.ds:
            self.ds.remove(sec)
            self.doi = True

    def cay(self):
        return U.thanh_cay(self.ds)


class TacDong:
    """Gom cac config bi sua trong mot loi goi; ghi mot lan qua ham ghi cua may chu."""

    def __init__(self, cay_uci):
        self.cay = cay_uci
        self.goi = {}

    def g(self, cfg):
        if cfg not in self.goi:
            self.goi[cfg] = _Goi(self.cay.get(cfg))
        return self.goi[cfg]

    def ket_qua(self):
        for cfg, gi in self.goi.items():
            if gi.doi:
                self.cay[cfg] = gi.cay()
        return any(gi.doi for gi in self.goi.values())


# ---------------------------------------------------------------- tung ham

def upnpd_set(td, ts):
    """upnpd_set {config:{enabled}} -> upnpd 'config' enabled (do: upnp_tat/upnp_bat)."""
    c = (ts.get("config") or {})
    if "enabled" in c:
        g = td.g("upnpd")
        g.dat(g.theo_ten("config"), "enabled", _b(c["enabled"]))


def dmz_set(td, ts):
    """dmz_set {dmz_v4:{enabled,dest_ip}} -> firewall redirect 'dmz_v4'; thu tu ghi enabled, dest_ip (do: dmz_ca_hai)."""
    d = ts.get("dmz_v4") or {}
    g = td.g("firewall")
    s = g.theo_ten("dmz_v4")
    if "enabled" in d:
        g.dat(s, "enabled", _b(d["enabled"]))
    if "dest_ip" in d:
        g.dat(s, "dest_ip", d["dest_ip"])


def alg_set(td, ts):
    """
    alg set -> alg 'config' (sip, ftp, h323, pptp, rtsp, tftp) + firewall include 'alg'
    (l2tp, ipsec). Do: tftp, ftp, l2tp lat tung cai (alg_*); ghi theo thu tu truong gui.
    """
    ga, gf = td.g("alg"), td.g("firewall")
    for k, v in ts.items():
        if k in ("sip", "ftp", "h323", "pptp", "rtsp", "tftp"):
            ga.dat(ga.theo_ten("config"), k, _b(v))
        elif k in ("l2tp", "ipsec"):
            gf.dat(gf.theo_ten("alg"), k, _b(v))


_FW_DDOS = [   # (truong trang, option ddos) — thu tu ghi = thu tu truong trang gui (do: fw_A)
    ("client_isolation", "client_isolation"),
    ("syn_defense", "tcpsynflood_detect"), ("syn_threshold", "tcpsynflood_rate"), ("syn_timeout", "tcpsynflood_timeout"),
    ("udp_defense", "udpflood_detect"), ("udp_threshold", "udpflood_rate"), ("udp_timeout", "udpflood_timeout"),
    ("icmp_defense", "icmpflood_detect"), ("icmp_threshold", "icmpflood_rate"), ("icmp_timeout", "icmpflood_timeout"),
    ("port_detection", "portscan_detect"), ("port_threshold", "portscan_rate"),
    ("block_ip", "block_ip"), ("block_tcp", "block_tcpflag_scan"), ("block_land", "block_land"),
    ("block_teardrop", "block_teardrop"), ("block_smurf", "block_smurf"), ("block_ping", "block_pingdeath"),
    ("block_traceroute", "block_tracert"), ("block_icmp", "block_icmpfrag"), ("block_syn", "block_synfrag"),
    ("block_unknownprotocol", "block_unknownproto"), ("block_fraggleattack", "block_fraggle"),
]
_FW_NGUONG = {"syn_threshold": "syn_defense", "syn_timeout": "syn_defense",
              "udp_threshold": "udp_defense", "udp_timeout": "udp_defense",
              "icmp_threshold": "icmp_defense", "icmp_timeout": "icmp_defense",
              "port_threshold": "port_detection"}


def firewall_set(td, ts):
    """
    firewall_set — DO THAT tung truong (fw_A, fw_B, fw1_* trong hop_dong_uci_nhom11.json):
      spi_firewall -> ddos en_spi;  en_ddos = spi && dos_defense
      res_pings_from_lan -> rule 'Allow_LAN_Ping' + 'Allow_IPv6_LAN_Ping' target ACCEPT/REJECT
      res_pings_from_wan -> rule name 'Allow-Ping' + 'Allow-IPv6-Ping' target ACCEPT/REJECT
      defaults.forward + zone 'wan'.input = REJECT khi spi && dos && block_unknownprotocol, nguoc lai ACCEPT
      en_ddos tat -> KHONG ghi option ddos nao khac (fw_B: chi en_ddos doi)
      nguong/thoi gian chi ghi khi co detect tuong ung bat (fw_A_tra_ve: udp tat -> 151 giu nguyen)
    Nhom 12 (fw_spi_dos, fw_dos_unk, fw_spi_ping, fw_dos_nguong): spi tat VAN ghi res_pings va
    client_isolation; en_ddos tat thi nguong/block khong ghi — khop mo hinh.
    """
    g = td.g("firewall")
    dd = g.theo_ten("ddos")
    spi = _b(ts.get("spi_firewall", True)) == "1"
    dos = _b(ts.get("dos_defense", True)) == "1"
    unk = _b(ts.get("block_unknownprotocol", True)) == "1"
    thu_tu = list(ts.keys())
    viec = []   # (vi tri truong trong goi gui, ham ghi)
    if "spi_firewall" in ts:
        viec.append((thu_tu.index("spi_firewall"), lambda: g.dat(dd, "en_spi", _b(spi))))
    if "res_pings_from_lan" in ts:
        t = "ACCEPT" if _b(ts["res_pings_from_lan"]) == "1" else "REJECT"
        viec.append((thu_tu.index("res_pings_from_lan"), lambda t=t: (
            g.dat(g.theo_ten("Allow_LAN_Ping"), "target", t),
            g.dat(g.theo_ten("Allow_IPv6_LAN_Ping"), "target", t))))
    if "res_pings_from_wan" in ts:
        t = "ACCEPT" if _b(ts["res_pings_from_wan"]) == "1" else "REJECT"
        viec.append((thu_tu.index("res_pings_from_wan"), lambda t=t: (
            g.dat(g.theo_option("rule", "name", "Allow-Ping"), "target", t),
            g.dat(g.theo_option("rule", "name", "Allow-IPv6-Ping"), "target", t))))
    if "dos_defense" in ts or "spi_firewall" in ts:
        k = "dos_defense" if "dos_defense" in ts else "spi_firewall"
        viec.append((thu_tu.index(k) + 0.5, lambda: g.dat(dd, "en_ddos", _b(spi and dos))))
    if "client_isolation" in ts:
        # nhom 12 (fw_spi_ping): client_isolation ghi CA khi en_ddos tat
        viec.append((thu_tu.index("client_isolation"),
                     lambda: g.dat(dd, "client_isolation", _b(ts["client_isolation"]))))
    if spi and dos:
        for truong, opt in _FW_DDOS:
            if truong not in ts or truong == "client_isolation":
                continue
            bat = _FW_NGUONG.get(truong)
            if bat and _b(ts.get(bat)) != "1":
                continue
            v = ts[truong]
            gt = str(v) if bat else _b(v)
            viec.append((thu_tu.index(truong), lambda opt=opt, gt=gt: g.dat(dd, opt, gt)))
    for _, f in sorted(viec, key=lambda x: x[0]):
        f()
    chinh_sach = "REJECT" if (spi and dos and unk) else "ACCEPT"
    g.dat(next((s for s in g.ds if s["type"] == "defaults"), None), "forward", chinh_sach)
    g.dat(g.theo_option("zone", "name", "wan"), "input", chinh_sach)


# Wi-Fi: vi tri cac wifi-iface AN DANH (thu tu trong tep that): 0 host 2G, 1 host 5G,
# 2 guest 2G, 3 guest 5G; specific la section co ten 'specific2'/'specific5'.
_IFACE = {("host", "2G"): 0, ("host", "5G"): 1, ("guest", "2G"): 2, ("guest", "5G"): 3}
_IFACE_TEN = {("specific", "2G"): "specific2", ("specific", "5G"): "specific5"}


def _iface(g, muc, bt):
    if (muc, bt) in _IFACE_TEN:
        return g.theo_ten(_IFACE_TEN[(muc, bt)])
    if (muc, bt) in _IFACE:
        return g.an_danh("wifi-iface", _IFACE[(muc, bt)])
    return None


def wifi_set(td, ts):
    """
    wifi_set {host|guest|specific: {2G,5G,6G}} -> wireless wifi-iface; 6G bo qua (khong co).
    Thu tu ghi CO DINH: disabled, vap_diff_mode ('1'/'0'), ssid, encryption, sae, key.
    Do: wifi_host0 (them vap_diff_mode '0', ssid, key xuong cuoi), wifi_guest0, wifi_spec0.
    """
    g = td.g("wireless")
    for muc, bang in ts.items():
        if not isinstance(bang, dict):
            continue
        for bt, truong in bang.items():
            s = _iface(g, muc, bt)
            if s is None or not isinstance(truong, dict):
                continue
            # Thu tu ghi CO DINH (do: 5G gui key truoc ssid nhung thiet bi ghi ssid truoc key)
            for k in ("disabled", "vap_diff_mode", "ssid", "encryption", "sae", "key"):
                if k not in truong:
                    continue
                v = truong[k]
                g.dat(s, k, _b(v) if k in ("disabled", "vap_diff_mode") else str(v))


_THIET_BI = {"2G": "wifi0", "5G": "wifi1"}


def wifiadv_set(td, ts):
    """
    wifiadv_set {adv:{2G,5G}} — DO THAT (adv_A):
      wifi-device: htmode, channel (+ acs_bkscanen '1' khi auto, '0' khi co dinh, ghi ngay sau
      channel), intercal_beacon -> beacon_int, rts, intercal_dtim -> dtim_period.
      iface host cung bang: thu tu ghi wmm, beamforming, mu_mimo; wmm 5G ghi CA iface guest 5G.
    Nhom 12: enabled -> wifi-device disabled, hwmode -> hwmode; wmm 2G ghi host + guest 2G (DA DO).
    Thu tu enabled/hwmode so voi htmode...: moi do tung truong rieng -> dat truoc htmode theo thu tu gui.
    CHUA DO: country_code (trang gui 'US', thiet bi giu 'US4') -> khong ghi uci.
    """
    g = td.g("wireless")
    for bt, a in (ts.get("adv") or {}).items():
        if bt not in _THIET_BI or not isinstance(a, dict):
            continue
        dv = g.theo_ten(_THIET_BI[bt])
        # nhom 12: enabled -> wifi-device disabled ('1' khi tat), hwmode -> hwmode (adv_en2g, adv_hw2g)
        if "enabled" in a:
            g.dat(dv, "disabled", "0" if _b(a["enabled"]) == "1" else "1")
        if "hwmode" in a:
            g.dat(dv, "hwmode", str(a["hwmode"]))
        for k in ("htmode", "channel", "intercal_beacon", "rts", "intercal_dtim"):
            if k not in a:
                continue
            if k == "channel":
                g.dat(dv, "channel", str(a[k]))
                g.dat(dv, "acs_bkscanen", "1" if str(a[k]) == "auto" else "0")
            else:
                g.dat(dv, {"intercal_beacon": "beacon_int", "intercal_dtim": "dtim_period"}.get(k, k), str(a[k]))
        host = _iface(g, "host", bt)
        guest = _iface(g, "guest", bt)
        if "wmm" in a:
            g.dat(host, "wmm", _b(a["wmm"]))
            g.dat(guest, "wmm", _b(a["wmm"]))
        for k in ("beamforming", "mu_mimo"):
            if k in a:
                g.dat(host, k, _b(a[k]))


def cigext_set(td, ts):
    """
    data_repo.cigext set {config:{section:{option: gia_tri}}} — ghi THANG uci (do: lan_dns_bat,
    lan_start_3, lan6_600, wan_user_test). Gia tri object -> list theo thu tu (dhcp_option,
    ra_flags, dns); object rong -> xoa list; '' -> xoa option. leasetime giu nguyen '720m'.
    """
    for cfg, secs in ts.items():
        if not isinstance(secs, dict):
            continue
        g = td.g(cfg)
        for sn, opts in secs.items():
            if not isinstance(opts, dict):
                continue
            s = g.theo_ten(sn)
            for k, v in opts.items():
                if isinstance(v, dict):
                    g.dat(s, k, [str(x) for x in v.values()])
                else:
                    g.dat(s, k, "" if v is None else str(v))


def systemlog_set(td, ts):
    """
    systemlog_set -> uci system (do: sl_doi/sl_tv). Thu tu ghi: conloglevel(level),
    log_remote(server_state), log_ip(server), log_port(port), log_proto(protocol); '' -> xoa.
    Quan sat them: vendor_log_file mat option cwmp_VendorFileLog_instance (TR-069 them lai sau
    khoi dong — tep Backup chup sau khoi dong van co) -> KHONG mo phong.
    """
    g = td.g("system")
    s = next((x for x in g.ds if x["type"] == "system"), None)
    for truong, opt in (("level", "conloglevel"), ("server_state", "log_remote"), ("server", "log_ip"),
                        ("port", "log_port"), ("protocol", "log_proto")):
        if truong in ts:
            g.dat(s, opt, "" if ts[truong] is None else str(ts[truong]))


_THU = ("Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun")


def speedtest_set(td, ts):
    """speedtest_set -> speedtest 'option': auto, sched(schedule), Mon..Sun (do: sp_doi/sp_tv)."""
    g = td.g("speedtest")
    s = g.theo_ten("option")
    for k, v in ts.items():
        if k == "auto" or k in _THU:
            g.dat(s, k, _b(v))
        elif k == "schedule":
            g.dat(s, "sched", str(v))


def dong_crontab_speedtest(ts):
    """
    Dong crontab root khi bat tu dong (do: '40 11 * * 1,2,3,4,5 ubus call speedtest start').
    So thu: Mon..Fri -> 1..5, Sat 6, Sun 0 (do nhom 11 + 12).
    """
    if _b(ts.get("auto")) != "1":
        return None
    hh, mm = (str(ts.get("schedule", "0:0")).split(":") + ["0"])[:2]
    so = [str({"Sun": 0}.get(t, i + 1)) for i, t in enumerate(_THU) if _b(ts.get(t)) == "1"]
    # nhom 12 (sp_ct '09:05' -> '05 09 * * 6,0'): giu NGUYEN chuoi (co so 0 dau); Sat 6, Sun 0 da do
    return f"{mm} {hh} * * {','.join(so)} ubus call speedtest start"


# ---- Wi-Fi Timer (DO THAT 2026-09-26, reference/api/hop_dong_nhom13.json 'wifi_timer') ----
_WT_LENH = ("uci set wireless.wifi0.disabled={v} && uci set wireless.wifi1.disabled={v} "
            "&& uci commit wireless && /sbin/wifi &")
_WT_NGAY = ("Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat")   # so cron 0..6


def wifitimer_section(cay_uci):
    return next((s for s in (cay_uci.get("aeiWiFiTimer") or {}).values()
                 if isinstance(s, dict) and s.get(".type") == "WiFiTimer"), None)


def _hm(chuoi):
    hh, mm = (str(chuoi or "").split(":") + ["0"])[:2]
    return hh, mm


def dong_crontab_wifitimer(sec):
    """Enable '1' -> [dong BAT luc StartTime, dong TAT luc EndTime]; ngay theo so Sun 0..Sat 6 tang dan; gio giu nguyen chuoi."""
    if not sec or sec.get("Enable") != "1":
        return []
    ngay = ",".join(str(i) for i, t in enumerate(_WT_NGAY) if sec.get(t) == "1")
    ra = []
    for k, v in (("StartTime", "0"), ("EndTime", "1")):
        hh, mm = _hm(sec.get(k))
        ra.append(f"{mm} {hh} * * {ngay} " + _WT_LENH.format(v=v))
    return ra


def la_dong_wifitimer(dong):
    return "uci set wireless.wifi0.disabled=" in dong and dong.endswith("/sbin/wifi &")


def wifitimer_muon_tat(sec, phut_trong_ngay, thu):
    """
    Trang thai 'disabled' mong muon luc ap dung: Enable '1' -> '0' khi Start <= gio < End VA hom nay
    nam trong ngay bat (do T1/T2/T2e/E2/E4/E5), nguoc lai '1'; Enable '0' -> '0' (do E1).
    Khung qua nua dem (Start > End): CHUA DO — coi la [Start, 24h) + [0, End).
    thu: 0=CN..6=T7 (so cron).
    """
    if not sec or sec.get("Enable") != "1":
        return "0"
    def phut(c):
        hh, mm = _hm(c)
        try:
            return int(hh) * 60 + int(mm)
        except ValueError:
            return -1
    a, b = phut(sec.get("StartTime")), phut(sec.get("EndTime"))
    trong = (a <= phut_trong_ngay < b) if a <= b else (phut_trong_ngay >= a or phut_trong_ngay < b)
    return "0" if (trong and sec.get(_WT_NGAY[thu]) == "1") else "1"


def dat_wireless_disabled(cay_uci, v):
    """uci set wireless.wifi0/wifi1.disabled=v (quy tac uci set). Tra True neu tep doi."""
    td = TacDong(cay_uci)
    g = td.g("wireless")
    for r in ("wifi0", "wifi1"):
        g.dat(g.theo_ten(r), "disabled", v)
    return td.ket_qua()


def ssh_set(td, ts):
    """
    ssh set {WANState, LANState, Password} — DO THAT (ssh_lan/ssh_wan/ssh_tat):
      LAN '1' -> dropbear enable '1' + rule 'Reject-LAN-SSH' target ACCEPT; LAN '0' -> target REJECT
      WAN '1' -> rule 'Reject-WAN-SSH' target ACCEPT roi THEM enabled '1'; WAN '0' -> REJECT
      Tat SSH KHONG dua dropbear enable ve '0' (dau vet that, nhom 9 + 11).
    etc/shadow bi ghi lai (bam lai mat khau root, muoi ngau nhien) — KHONG mo phong.
    """
    gd, gf = td.g("dropbear"), td.g("firewall")
    lan, wan = _b(ts.get("LANState")), _b(ts.get("WANState"))
    if lan == "1" or wan == "1":
        gd.dat(gd.ds[0] if gd.ds else None, "enable", "1")
    if "LANState" in ts:
        gf.dat(gf.theo_option("rule", "name", "Reject-LAN-SSH"), "target", "ACCEPT" if lan == "1" else "REJECT")
    if "WANState" in ts:
        r = gf.theo_option("rule", "name", "Reject-WAN-SSH")
        gf.dat(r, "target", "ACCEPT" if wan == "1" else "REJECT")
        if wan == "1":
            gf.dat(r, "enabled", "1")


def easymesh_set(td, ts):
    """
    network.wireless.easymesh set {MeshEnabled} — DO THAT (em_tat/em_bat): '1'/'0' vao
    ezmesh 'config' Enable, mesh_app 'config' EnableDataElements, repacd 'repacd' Enable,
    repacd 'MAPConfig' Enable, wireless 'aeimap' map_enable, wsplcd 'config' HyFiSecurity.
    CHUA DO: doi MeshRole/MeshBand -> khong ghi uci.
    """
    if "MeshEnabled" not in ts:
        return
    v = _b(ts["MeshEnabled"])
    for cfg, sec, opt in (("ezmesh", "config", "Enable"), ("mesh_app", "config", "EnableDataElements"),
                          ("repacd", "repacd", "Enable"), ("repacd", "MAPConfig", "Enable"),
                          ("wireless", "aeimap", "map_enable"), ("wsplcd", "config", "HyFiSecurity")):
        g = td.g(cfg)
        g.dat(g.theo_ten(sec), opt, v)


def route_set(td, ts, v6):
    """
    aei-route(6) set {data:[...]} (ca bang) — DO THAT (rt_them/rt6_them): moi dong la mot
    section route/route6 NOI CUOI network; v4: target, netmask, gateway, interface 'lan',
    status 'true'; v6: interface 'wan6', target, gateway, status 'true'. data rong -> xoa het.
    Nhom 12: gateway NGOAI mang LAN -> interface 'wan' dung DAU, status 'false' (khi WAN khong co
    mang chua gateway — WAN dang mat ket noi luc do; WAN co IP chua do). Nhieu dong: noi theo thu tu.
    v6 gateway link-local fe80:: van wan6/true.
    """
    g = td.g("network")
    lan = g.theo_ten("lan")
    loai = "route6" if v6 else "route"
    for s in [s for s in g.ds if s["type"] == loai]:
        g.xoa(s)
    for d in ts.get("data") or []:
        if v6:
            g.them(loai, None, [("interface", "wan6"), ("target", d.get("Network")),
                                ("gateway", d.get("Gateway")), ("status", "true")])
        elif trong_lan(lan, d.get("Gateway")):
            g.them(loai, None, [("target", d.get("Network")), ("netmask", d.get("Netmask")),
                                ("gateway", d.get("Gateway")), ("interface", "lan"), ("status", "true")])
        else:
            # nhom 12 (rt_ngoai): gateway ngoai LAN -> interface 'wan' DAT TRUOC, status 'false'
            g.them(loai, None, [("interface", "wan"), ("target", d.get("Network")), ("netmask", d.get("Netmask")),
                                ("gateway", d.get("Gateway")), ("status", "false")])


def trong_lan(sec_lan, ip):
    """IPv4 `ip` co nam trong mang cua interface lan (ipaddr/netmask) khong."""
    def so(x):
        p = str(x or "").split(".")
        if len(p) != 4 or not all(t.isdigit() for t in p):
            return None
        return (int(p[0]) << 24) | (int(p[1]) << 16) | (int(p[2]) << 8) | int(p[3])
    o = dict((k, v) for k, v in (sec_lan or {}).get("opts", [])) if isinstance(sec_lan, dict) and "opts" in sec_lan \
        else (sec_lan or {})
    a, m, g = so(o.get("ipaddr")), so(o.get("netmask")), so(ip)
    return None not in (a, m, g) and (a & m) == (g & m)


def _ten_web(site):
    return str(site).replace(".", "_")


def bang_set(td, ham, ts):
    """
    Cac trang BANG. _idx cua dhcp/portfwd = TEN section uci luc trang doc (tinh theo vi tri).
      dhcp_reservation: them 'host' cuoi dhcp: dhcp_pool 'lan', mac, ip; sua: mac, ip
      portfwd: them 'redirect' cuoi firewall: reflection '1', src 'wan', dest 'lan',
               target 'DNAT', enabled, name, proto, src_dport, dest_port, dest_ip; sua: theo thu tu do
      parentctrl: rule 'AEI_PC_<_idx>': utc_time '1', src 'lan', dest 'wan', target 'REJECT',
               proto 'all', enabled, src_mac, start_time, stop_time, weekdays (noi dau cach),
               name 'AEI_PC_<ten>'
      websitefilter: dhcp dnsmasq THEM list ipset '/<site>/website_block_<s>'; firewall ipset
               'ipset_block_<s>' + rule 'rule_block_<s>' (s = site doi '.' -> '_')
    """
    ds_moi = ts.get("host") or ts.get("redirect") or ts.get("blocking_list") or []
    if ham == "dhcp_reservation_set":
        g = td.g("dhcp")
        ten = dict(zip(g.ten(), g.ds))
        for d in ds_moi:
            p = d.get("_method")
            if p == "add":
                g.them("host", None, [("dhcp_pool", "lan"), ("mac", d.get("mac")), ("ip", d.get("ip"))])
            elif p in ("update", "del"):
                s = ten.get(d.get("_idx"))
                if p == "del":
                    g.xoa(s)
                else:
                    for k in ("mac", "ip"):
                        if k in d:
                            g.dat(s, k, d[k])
    elif ham == "portfwd_set":
        g = td.g("firewall")
        ten = dict(zip(g.ten(), g.ds))
        thu_tu = ("enabled", "name", "proto", "src_dport", "dest_port", "dest_ip")
        for d in ds_moi:
            p = d.get("_method")
            gt = {k: (_b(d[k]) if k == "enabled" else str(d[k])) for k in thu_tu if k in d}
            if p == "add":
                g.them("redirect", None, [("reflection", "1"), ("src", "wan"), ("dest", "lan"),
                                          ("target", "DNAT")] + [(k, gt.get(k)) for k in thu_tu])
            elif p in ("update", "del"):
                s = ten.get(d.get("_idx"))
                if p == "del":
                    g.xoa(s)
                else:
                    for k in thu_tu:
                        if k in gt:
                            g.dat(s, k, gt[k])
    elif ham == "parentctrl_set":
        g = td.g("firewall")
        for d in ds_moi:
            p, idx = d.get("_method"), d.get("_idx")
            gt = [("enabled", _b(d.get("enabled"))), ("src_mac", d.get("mac")),
                  ("start_time", d.get("start")), ("stop_time", d.get("stop")),
                  ("weekdays", " ".join(d.get("weekdays") or [])), ("name", "AEI_PC_" + str(d.get("name", "")))]
            if p == "add":
                # _idx dong moi = so NHO NHAT con trong (do nhom 9) — khop ten section
                dung = {int(s["name"][7:]) for s in g.ds
                        if s["name"] and s["name"].startswith("AEI_PC_") and s["name"][7:].isdigit()}
                idx = 1
                while idx in dung:
                    idx += 1
                g.them("rule", "AEI_PC_" + str(idx), [("utc_time", "1"), ("src", "lan"), ("dest", "wan"),
                                                     ("target", "REJECT"), ("proto", "all")] + gt)
            elif p == "update":
                s = g.theo_ten("AEI_PC_" + str(idx))
                for k, v in gt:
                    g.dat(s, k, v)
            elif p == "del":
                g.xoa(g.theo_ten("AEI_PC_" + str(idx)))
    elif ham == "websitefilter_set":
        gd, gf = td.g("dhcp"), td.g("firewall")
        dns = next((s for s in gd.ds if s["type"] == "dnsmasq"), None)
        for d in ds_moi:
            site = str(d.get("website", ""))
            s = _ten_web(site)
            muc = f"/{site}/website_block_{s}"
            ips = d.get("ip") or []
            hop_le = all(c.isalnum() or c == "_" for c in s)
            if d.get("_method") == "add":
                cu = next((o for o in dns["opts"] if o[0] == "ipset"), None) if dns else None
                gd.dat(dns, "ipset", (list(cu[1]) if cu else []) + [muc])
                if not hop_le:
                    # nhom 12 (wf_ten 'sub-a.example.invalid'): ten co '-' -> thiet bi CHI them list
                    # ipset o dhcp, KHONG tao ipset/rule firewall (ten section uci khong hop le)
                    continue
                gf.them("ipset", "ipset_block_" + s, [("enabled", "1"), ("name", "website_block_" + s),
                                                    ("family", "ipv4"), ("storage", "hash"),
                                                    ("match", "dest_ip"), ("maxelem", "256")])
                gf.them("rule", "rule_block_" + s, [("enabled", "1"), ("name", "website_block_" + s),
                                                  ("family", "ipv4"), ("proto", "tcp"), ("src", "lan"),
                                                  ("dest", "wan"), ("src_ip", " ".join(ips)),
                                                  ("dest_port", "80 443"), ("ipset", "website_block_" + s),
                                                  ("target", "REJECT")])
            elif d.get("_method") == "del":
                cu = next((o for o in dns["opts"] if o[0] == "ipset"), None) if dns else None
                if cu:
                    con = [x for x in cu[1] if x != muc]
                    gd.dat(dns, "ipset", con)
                gf.xoa(gf.theo_ten("ipset_block_" + s))
                gf.xoa(gf.theo_ten("rule_block_" + s))


def ap_dung(cay_uci, doi_tuong, ham, ts):
    """
    Ap tac dong cua mot loi goi ghi THANH CONG len cay uci (sua tai cho).
    Tra ve (co_doi, ghi_chu) — ghi_chu dung cho crontab speedtest.
    """
    td = TacDong(cay_uci)
    ts = ts if isinstance(ts, dict) else {}
    W = "data_repo.weboui"
    if doi_tuong == W and ham == "upnpd_set":
        upnpd_set(td, ts)
    elif doi_tuong == W and ham == "dmz_set":
        dmz_set(td, ts)
    elif doi_tuong == "alg" and ham == "set":
        alg_set(td, ts)
    elif doi_tuong == W and ham == "firewall_set":
        firewall_set(td, ts)
    elif doi_tuong == W and ham == "wifi_set":
        wifi_set(td, ts)
    elif doi_tuong == W and ham == "wifiadv_set":
        wifiadv_set(td, ts)
    elif doi_tuong == "data_repo.cigext" and ham == "set":
        cigext_set(td, ts)
    elif doi_tuong == W and ham == "systemlog_set":
        systemlog_set(td, ts)
    elif doi_tuong == W and ham == "speedtest_set":
        speedtest_set(td, ts)
    elif doi_tuong == "ssh" and ham == "set":
        ssh_set(td, ts)
    elif doi_tuong == "network.wireless.easymesh" and ham == "set":
        easymesh_set(td, ts)
    elif doi_tuong in ("aei-route", "aei-route6") and ham == "set":
        route_set(td, ts, doi_tuong == "aei-route6")
    elif doi_tuong == W and ham in ("dhcp_reservation_set", "portfwd_set", "parentctrl_set",
                                    "websitefilter_set"):
        bang_set(td, ham, ts)
    else:
        return False
    return td.ket_qua()


def ten_bang(cay_uci, ham):
    """Ten section uci cua cac dong bang dhcp/portfwd theo thu tu (lam _idx cho trang)."""
    if ham == "dhcp_reservation_set":
        g = _Goi(cay_uci.get("dhcp"))
        return [t for t, s in zip(g.ten(), g.ds) if s["type"] == "host"]
    if ham == "portfwd_set":
        g = _Goi(cay_uci.get("firewall"))
        return [t for t, s in zip(g.ten(), g.ds) if s["type"] == "redirect" and s["name"] is None]
    return None


__all__ = ["ap_dung", "ten_bang", "dong_crontab_speedtest", "json"]
