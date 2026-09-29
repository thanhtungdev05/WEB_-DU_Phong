# -*- coding: utf-8 -*-
"""
CHIEU DOC NGUOC: cay uci (/etc/config/*) -> khung tra ve cua cac ham *_get — AX3000CV2 (OS 0.5.3)
=================================================================================================

Tren thiet bi that cac ham data_repo.*_get / alg get / aei-route get / ssh get / easymesh get
DOC TU tep /etc/config. Khi nap tep Backup (Upload archive -> oui.system backup_restore) tep
config bi thay ca loat, nen moi trang phai doi theo (CLAUDE.md muc 2.5).

Module nay chi dung NGUOC DUNG nhung cap (truong trang <-> option uci) da DO THAT theo chieu
ghi (uci_tac_dong.py, hop_dong_uci_nhom11.json + nhom12.json). Truong khong co cap da do
(country_code, MeshRole/MeshBand/MeshBSS, mat khau SSH, lan_get/wan_get, ...) -> GIU NGUYEN
gia tri dang co trong kho — khong suy.

Kiem (tools/kiem_may_chu.py nhom UR):
  - UR1: nguoc(cay uci cua tep Backup that) -> khung trung FNV cac khung do tren THIET BI THAT
    o CUNG trang thai (khung_that_nhom10_backup.json 'doc_lai_sau_cam_lai_day').
  - UR2: sau MOI buoc phat lai nhom 11 + 12a, nguoc(cay uci) == khung ma cac ham ghi da cap nhat.
Kieu gia tri (bool/so/chuoi) lay theo khung dang co (do that: moi khung giu kieu co dinh).
"""
import copy


def _sec(cfg, ten):
    return (cfg or {}).get(ten) if isinstance((cfg or {}).get(ten), dict) else None


def _theo_loai(cfg, loai):
    return [s for _, s in sorted((cfg or {}).items(), key=lambda kv: kv[1].get(".index", 0))
            if isinstance(s, dict) and s.get(".type") == loai]


def _an_danh(cfg, loai, i):
    l = [s for s in _theo_loai(cfg, loai) if s.get(".anonymous")]
    return l[i] if i < len(l) else None


def _theo_option(cfg, loai, k, v):
    return next((s for s in _theo_loai(cfg, loai) if s.get(k) == v), None)


def _kieu(mau, v):
    """Ep chuoi uci `v` ve kieu cua gia tri mau (bool / int / chuoi)."""
    if v is None:
        return mau
    if isinstance(mau, bool):
        return str(v) == "1"
    if isinstance(mau, int):
        try:
            return int(str(v))
        except ValueError:
            return mau
    return v


def _dat(d, k, v):
    """Dat d[k] = v theo kieu cu; v None -> giu nguyen."""
    if v is not None and k in d:
        d[k] = _kieu(d[k], v)


# ---------------------------------------------------------------- tung khung

_IFACE = {("host", "2G"): 0, ("host", "5G"): 1, ("guest", "2G"): 2, ("guest", "5G"): 3}
_IFACE_TEN = {("specific", "2G"): "specific2", ("specific", "5G"): "specific5"}
_THIET_BI = {"2G": "wifi0", "5G": "wifi1"}


def _iface(w, muc, bt):
    if (muc, bt) in _IFACE_TEN:
        return _sec(w, _IFACE_TEN[(muc, bt)])
    if (muc, bt) in _IFACE:
        return _an_danh(w, "wifi-iface", _IFACE[(muc, bt)])
    return None


def wifi_get(cay, k):
    """wifi-iface: disabled, vap_diff_mode (thieu = '0' — do wifi_host0: them '0' khi ghi), ssid, encryption, sae, key."""
    w = cay.get("wireless")
    for muc, bang in k.items():
        for bt, f in (bang or {}).items():
            s = _iface(w, muc, bt)
            if s is None:
                continue
            for t in ("disabled", "vap_diff_mode", "ssid", "encryption", "sae", "key"):
                v = s.get(t)
                if v is None and t == "vap_diff_mode":
                    v = "0"
                _dat(f, t, v)


def wifiadv_get(cay, k):
    """wifi-device: disabled(nguoc)->enabled, hwmode, htmode, channel, beacon_int, rts, dtim_period; iface host: wmm, beamforming, mu_mimo."""
    w = cay.get("wireless")
    for bt, a in (k.get("adv") or {}).items():
        dv = _sec(w, _THIET_BI.get(bt, ""))
        if dv is None:
            continue
        if dv.get("disabled") is not None:
            _dat(a, "enabled", "0" if dv["disabled"] == "1" else "1")
        for t, o in (("hwmode", "hwmode"), ("htmode", "htmode"), ("channel", "channel"),
                     ("intercal_beacon", "beacon_int"), ("rts", "rts"), ("intercal_dtim", "dtim_period")):
            _dat(a, t, dv.get(o))
        h = _iface(w, "host", bt) or {}
        for t in ("wmm", "beamforming", "mu_mimo"):
            _dat(a, t, h.get(t))


_FW_DDOS = [
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


def firewall_get(cay, k):
    """
    ddos: en_spi->spi_firewall, en_ddos->dos_defense, cac option ddos khac; rule Allow_LAN_Ping /
    'Allow-Ping' target ACCEPT -> res_pings_*. DO THAT 2026-09-26: get DOC TU uci — set nguong khi
    detect tat / block khi dos tat KHONG luu -> get tra gia tri cu (udp_tat_nguong, dos_tat_block).
    """
    f = cay.get("firewall")
    dd = _sec(f, "ddos") or {}
    _dat(k, "spi_firewall", dd.get("en_spi"))
    # DO THAT 2026-09-26 (spi_tat): spi tat -> en_ddos '0' -> get tra dos_defense false
    _dat(k, "dos_defense", dd.get("en_ddos"))
    lan = _sec(f, "Allow_LAN_Ping")
    if lan and lan.get("target"):
        _dat(k, "res_pings_from_lan", "1" if lan["target"] == "ACCEPT" else "0")
    wan = _theo_option(f, "rule", "name", "Allow-Ping")
    if wan and wan.get("target"):
        _dat(k, "res_pings_from_wan", "1" if wan["target"] == "ACCEPT" else "0")
    for t, o in _FW_DDOS:
        _dat(k, t, dd.get(o))


def dmz_get(cay, k):
    s = _sec(cay.get("firewall"), "dmz_v4") or {}
    d = k.get("dmz_v4")
    if isinstance(d, dict):
        _dat(d, "enabled", s.get("enabled"))
        d["dest_ip"] = s.get("dest_ip", "")


def upnpd_get(cay, k):
    s = _sec(cay.get("upnpd"), "config") or {}
    if isinstance(k.get("config"), dict):
        _dat(k["config"], "enabled", s.get("enabled"))


def alg_get(cay, k):
    a = _sec(cay.get("alg"), "config") or {}
    fa = _sec(cay.get("firewall"), "alg") or {}
    for t in list(k):
        _dat(k, t, (fa if t in ("l2tp", "ipsec") else a).get(t))


def speedtest_get(cay, k):
    s = _sec(cay.get("speedtest"), "option") or {}
    for t in ("auto", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"):
        _dat(k, t, s.get(t))
    _dat(k, "schedule", s.get("sched"))


def systemlog_get(cay, k):
    s = next(iter(_theo_loai(cay.get("system"), "system")), None) or {}
    for t, o in (("level", "conloglevel"), ("server_state", "log_remote"), ("server", "log_ip"),
                 ("port", "log_port"), ("protocol", "log_proto")):
        if t in k:
            # '' tren trang -> option bi XOA (do sl_doi/sl_tv) -> doc ve '' / 0
            v = s.get(o)
            k[t] = _kieu(k[t], v) if v is not None else ("" if isinstance(k[t], str) else k[t])


def system_get(cay, k):
    c = cay.get("system")
    s = next(iter(_theo_loai(c, "system")), None) or {}
    for t in ("hostname", "zonename", "timezone"):
        if isinstance(k.get("system"), dict):
            _dat(k["system"], t, s.get(t))
    ntp = _sec(c, "ntp") or {}
    if isinstance(k.get("ntp"), dict) and isinstance(ntp.get("server"), list):
        k["ntp"]["list"] = list(ntp["server"])


def ssh_get(cay, k):
    f = cay.get("firewall")
    for t, ten in (("LANState", "Reject-LAN-SSH"), ("WANState", "Reject-WAN-SSH")):
        r = _theo_option(f, "rule", "name", ten)
        if r and r.get("target"):
            k[t] = "1" if r["target"] == "ACCEPT" else "0"


def easymesh_get(cay, k):
    s = _sec(cay.get("ezmesh"), "config") or {}
    _dat(k, "MeshEnabled", s.get("Enable"))


def route_get(cay, k, v6):
    n = cay.get("network")
    ra = []
    for i, s in enumerate(_theo_loai(n, "route6" if v6 else "route")):
        d = {"index": str(i + 1), "Network": s.get("target", "")}
        if not v6:
            d["Netmask"] = s.get("netmask", "")
        d["Gateway"] = s.get("gateway", "")
        if not v6:
            d["Status"] = s.get("status", "")
        ra.append(d)
    k["data"] = ra


def _ten_an_danh(cfg):
    """{id(section): ten 'cfg..' theo vi tri} — dung quy tac uci.py (nhom 9)."""
    import ax3000c_uci as U
    ds = U.tu_cay(cfg or {})
    ten = U.ten_cac_section(ds)
    thu_tu = sorted((cfg or {}).values(), key=lambda s: s.get(".index", 0))
    return {id(s): t for s, t in zip(thu_tu, ten)}


def dhcp_reservation_get(cay, k):
    d = cay.get("dhcp")
    ten = _ten_an_danh(d)
    k["host"] = [{"_idx": ten[id(s)], "mac": s.get("mac", ""), "ip": s.get("ip", "")}
                 for s in _theo_loai(d, "host")]


def portfwd_get(cay, k):
    f = cay.get("firewall")
    ten = _ten_an_danh(f)
    cu = {r.get("_idx"): r for r in (k.get("redirect") or [])}
    ra = []
    for s in _theo_loai(f, "redirect"):
        if not s.get(".anonymous"):
            continue
        idx = ten[id(s)]
        mau = cu.get(idx) or {}
        d = {"_idx": idx}
        for t in ("enabled", "name", "proto", "src_dport", "dest_port", "dest_ip"):
            v = s.get(t, "")
            d[t] = _kieu(mau[t], v) if t in mau else (v == "1" if t == "enabled" else v)
        ra.append(d)
    k["redirect"] = ra


def parentctrl_get(cay, k):
    f = cay.get("firewall")
    cu = {r.get("_idx"): r for r in (k.get("blocking_list") or [])}
    ra = []
    for s in _theo_loai(f, "rule"):
        ten = s.get(".name", "")
        if s.get(".anonymous") or not ten.startswith("AEI_PC_"):
            continue
        idx = ten[7:]
        mau = cu.get(idx) or {}
        d = {"_idx": idx, "mac": s.get("src_mac", ""), "name": str(s.get("name", ""))[7:],
             "enabled": s.get("enabled", "0"), "start": s.get("start_time", ""),
             "stop": s.get("stop_time", ""), "weekdays": str(s.get("weekdays", "")).split()}
        if "enabled" in mau:
            d["enabled"] = _kieu(mau["enabled"], d["enabled"])
        ra.append(d)
    ra.sort(key=lambda d: int(d["_idx"]) if d["_idx"].isdigit() else 0)
    k["blocking_list"] = ra


def websitefilter_get(cay, k):
    """dnsmasq list ipset '/<site>/website_block_<s>' + firewall rule 'rule_block_<s>' src_ip."""
    dns = next(iter(_theo_loai(cay.get("dhcp"), "dnsmasq")), None) or {}
    f = cay.get("firewall")
    cu = {r.get("website"): r for r in (k.get("blocking_list") or [])}
    ra = []
    for m in dns.get("ipset") or []:
        p = m.split("/")
        if len(p) < 3 or not p[2].startswith("website_block_"):
            continue
        site = p[1]
        r = _sec(f, "rule_block_" + site.replace(".", "_"))
        if r is not None:
            ip = str(r.get("src_ip", "")).split()
        else:
            # ten co '-' (nhom 12 wf_ten): thiet bi khong tao rule -> IP chi con o kho (khong suy)
            ip = list((cu.get(site) or {}).get("ip") or [])
        ra.append({"website": site, "ip": ip})
    k["blocking_list"] = ra


def cigext_cay(cay, k):
    """Cay ban mau cigext: moi (config, section, option) dang co -> gia tri uci (list noi dau cach; thieu -> '')."""
    for cfg, secs in k.items():
        for sn, opts in (secs or {}).items():
            s = _sec(cay.get(cfg), sn)
            if s is None or not isinstance(opts, dict):
                continue
            for o in list(opts):
                v = s.get(o)
                if isinstance(v, list):
                    v = " ".join(v)
                if cfg == "dhcp" and o == "leasetime" and isinstance(v, str) and v.endswith("m"):
                    v = v[:-1]      # do that (lab 4/5): uci '720m' -> doc ve '720'
                opts[o] = "" if v is None else v


BANG = [
    ("data_repo.weboui.wifi_get", wifi_get),
    ("data_repo.weboui.wifiadv_get", wifiadv_get),
    ("data_repo.weboui.firewall_get", firewall_get),
    ("data_repo.weboui.dmz_get", dmz_get),
    ("data_repo.weboui.upnpd_get", upnpd_get),
    ("data_repo.weboui.speedtest_get", speedtest_get),
    ("data_repo.weboui.systemlog_get", systemlog_get),
    ("data_repo.weboui.system_get", system_get),
    ("data_repo.weboui.dhcp_reservation_get", dhcp_reservation_get),
    ("data_repo.weboui.portfwd_get", portfwd_get),
    ("data_repo.weboui.parentctrl_get", parentctrl_get),
    ("data_repo.weboui.websitefilter_get", websitefilter_get),
    ("alg.get", alg_get),
    ("ssh.get", ssh_get),
    ("network.wireless.easymesh.get", easymesh_get),
    ("aei-route.get", lambda c, k: route_get(c, k, False)),
    ("aei-route6.get", lambda c, k: route_get(c, k, True)),
    ("data_repo.cigext.cay_cau_hinh", cigext_cay),
]


def khung_tu_uci(cay, doc):
    """
    cay: {config: values} (dang 'uci get'); doc(khoa) -> khung hien tai trong kho.
    Tra ve {khoa: khung_moi} cho moi khoa co trong kho (ban sao, khong sua kho).
    """
    ra = {}
    for khoa, ham in BANG:
        hien = doc(khoa)
        if not isinstance(hien, dict):
            continue
        moi = copy.deepcopy(hien)
        ham(cay, moi)
        ra[khoa] = moi
    return ra
