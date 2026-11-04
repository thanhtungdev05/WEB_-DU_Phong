#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
BOM DU LIEU DONG VAO TRANG GOC â€” ONT AC1000HI
==============================================

Muc dich (muc 4 CLAUDE.md goc â€” "Trang thai"):
  File HTML trong src/www/ la BAN GOC NGUYEN VAN tai tu thiet bi that, trong
  do co san so lieu cua lan chup do (vd Serial FPTH22800025, uptime 54 phut).
  Neu cu phuc vu nguyen si thi moi trang la mot anh chup CHET â€” sua o trang A
  khong lam trang B doi theo, khong dat muc 4.

  Module nay giai quyet bang cach: KHONG SUA FILE GOC, chi thay gia tri
  ngay luc phuc vu (on-the-fly), lay tu config_store.

Nguyen tac thay the:
  - Bam theo NHAN hien thi hoac ten input (name) roi thay o gia tri.
  - Chi thay dung nhung o DA CO BANG CHUNG trong reference/. Khong bia them o
    nao. O nao chua do duoc thi de nguyen gia tri goc va ghi vao ISSUES.md.
"""
import json
import re
import time

try:
    from . import config_store as kho
except ImportError:
    import config_store as kho

# Moc thoi gian khoi dong server â€” dung de tinh uptime tang dan.
_LUC_KHOI_DONG = time.time()


def _uptime():
    """Tra ve (days, hours, minutes) tinh tu luc server chay."""
    giay = int(time.time() - _LUC_KHOI_DONG)
    return giay // 86400, (giay % 86400) // 3600, (giay % 3600) // 60


# --------------------------------------------------------------------------
# CAC HAM TIEN ICH THAY THE DOM ON-THE-FLY
# --------------------------------------------------------------------------

def _thay_value_theo_name(html, ten_o, gia_tri):
    """
    Thay thuoc tinh VALUE cua mot the <input> tim theo DUNG NAME.
    Ho tro ca truong hop value co dau nhay va khong co dau nhay.
    """
    mau_nhay = re.compile(
        r'(<input\b[^>]*\bname\s*=\s*(?:["\']' + re.escape(ten_o) + r'["\']|' + re.escape(ten_o) + r'(?=[\s>]))[^>]*?\bvalue\s*=\s*)'
        r'(["\'])(.*?)\2',
        re.I | re.S,
    )
    if mau_nhay.search(html):
        return mau_nhay.sub(lambda m: m.group(1) + m.group(2) + str(gia_tri) + m.group(2), html, count=1), True

    mau_khong_nhay = re.compile(
        r'(<input\b[^>]*\bname\s*=\s*(?:["\']' + re.escape(ten_o) + r'["\']|' + re.escape(ten_o) + r'(?=[\s>]))[^>]*?\bvalue\s*=\s*)'
        r'([^"\'\s>]+)',
        re.I | re.S,
    )
    if mau_khong_nhay.search(html):
        return mau_khong_nhay.sub(lambda m: m.group(1) + '"' + str(gia_tri) + '"', html, count=1), True

    return html, False


def _thay_radio_theo_name(html, ten_radio, gia_tri_chon):
    """
    Tim moi the <input ... name="ten_radio" ... type="radio">,
    go bo checked, va them checked vao nut co value == gia_tri_chon.
    """
    chon = str(gia_tri_chon).lower()
    mau = re.compile(
        r'<input\b[^>]*\bname\s*=\s*(?:["\']' + re.escape(ten_radio) + r'["\']|' + re.escape(ten_radio) + r'(?=[\s>]))[^>]*>',
        re.I
    )

    def _doi(m):
        the = m.group(0)
        if not re.search(r'\btype\s*=\s*["\']?radio\b', the, re.I):
            return the
        vm = re.search(r'\bvalue\s*=\s*["\']?([^"\'\s>]+)', the, re.I)
        val = vm.group(1) if vm else ""
        the_clean = re.sub(r'\s+checked\b', '', the, flags=re.I)
        if val.lower() == chon:
            the_clean = the_clean.rstrip('>').rstrip() + ' checked>'
        return the_clean

    return mau.sub(_doi, html)


def _thay_checkbox_theo_name(html, ten_cb, bat_tat):
    """
    Tim the <input ... name="ten_cb" ... type="checkbox">,
    them hoac go bo checked.
    """
    bat = str(bat_tat).lower() in ("1", "true", "yes", "on")
    mau = re.compile(
        r'<input\b[^>]*\bname\s*=\s*(?:["\']' + re.escape(ten_cb) + r'["\']|' + re.escape(ten_cb) + r'(?=[\s>]))[^>]*>',
        re.I
    )

    def _doi(m):
        the = m.group(0)
        the_clean = re.sub(r'\s+checked\b', '', the, flags=re.I)
        if bat:
            the_clean = the_clean.rstrip('>').rstrip() + ' checked>'
        return the_clean

    return mau.sub(_doi, html)


def _thay_select_theo_name(html, ten_select, gia_tri_chon):
    """
    Tim khoi <select name="ten_select">...</select>,
    go bo selected o tat ca option, them selected vao option co value == gia_tri_chon
    (hoac text content == gia_tri_chon neu khong khop value).
    """
    chon = str(gia_tri_chon)
    mau = re.compile(
        r'(<select\b[^>]*\bname\s*=\s*(?:["\']' + re.escape(ten_select) + r'["\']|' + re.escape(ten_select) + r'(?=[\s>]))[^>]*>)(.*?)(</select>)',
        re.I | re.S
    )
    m = mau.search(html)
    if not m:
        return html

    start_tag, body, end_tag = m.group(1), m.group(2), m.group(3)
    body_clean = re.sub(r'(<option\b[^>]*)\s+selected\b([^>]*>)', r'\1\2', body, flags=re.I)

    # KHOP CHINH XAC gia tri (co dau nhay hoac ranh gioi khoang trang/'>'), KHONG duoc khop
    # nham tien to â€” vd chon="TCP" tung bi khop nham vao value="TCP/UDP" (dung dau tien trong
    # HTML) vi thieu ranh gioi cuoi. Phat hien 2026-08-22 luc noi QOS Rule (adv_qos.asp) â€” sua
    # chung cho moi trang dung ham nay, khong chi rieng cho QOS Rule.
    opt_mau = re.compile(
        r'(<option\b[^>]*\bvalue\s*=\s*(?:"' + re.escape(chon) + r'"|\'' + re.escape(chon) + r'\'|'
        + re.escape(chon) + r'(?=[\s>]))[^>]*>)', re.I)
    if opt_mau.search(body_clean):
        body_new = opt_mau.sub(lambda opt: opt.group(1).rstrip('>').rstrip() + ' selected>', body_clean, count=1)
    else:
        opt_text_mau = re.compile(r'(<option\b[^>]*>)([^<]*?' + re.escape(chon) + r'[^<]*?)(?=<option|</select|$)', re.I | re.S)
        if opt_text_mau.search(body_clean):
            body_new = opt_text_mau.sub(lambda opt: opt.group(1).rstrip('>').rstrip() + ' selected>' + opt.group(2), body_clean, count=1)
        else:
            body_new = body_clean

    return html[:m.start()] + start_tag + body_new + end_tag + html[m.end():]


def _thay_o_sau_nhan(html, nhan, gia_tri_moi):
    """
    Tim mot hang <tr> co o nhan la 
han`, roi thay noi dung o <td> KE TIEP.
    """
    mau = re.compile(
        r'(<td[^>]*class="tabdata"[^>]*>\s*(?:<font[^>]*>)?\s*'
        + re.escape(nhan)
        + r'\s*(?:</font>)?\s*</td>\s*<td[^>]*class="tabdata"[^>]*>)'
        r'(\s*)(.*?)(\s*)'
        r'(</td>)',
        re.S | re.I,
    )
    if not mau.search(html):
        return html, False
    return mau.sub(
        lambda m: m.group(1) + m.group(2) + str(gia_tri_moi) + m.group(4) + m.group(5),
        html, count=1), True


def _thay_tableData(html, cac_dong):
    """
    Thay nguyen khoi `var tableData = [ ... ];` bang danh sach dong moi.
    """
    moi = "var tableData = [\n" + ",\n".join(cac_dong) + "\n\n];"
    return re.sub(r"var\s+tableData\s*=\s*\[.*?\];", moi, html,
                  count=1, flags=re.S)


def _thay_mang_bang(html, ten_bien, cac_dong):
    """
    Thay nguyen khoi `var <ten_bien> = [ ... ];` bang danh sach dong moi.
    Tong quat hoa cua _thay_tableData de dung cho cac ten bien khac
    (vd tableData1) â€” regex neo bang \\s*= ngay sau ten nen KHONG khop
    nham "tableData1" khi thay "tableData".
    """
    moi = f"var {ten_bien} = [\n" + ",\n".join(cac_dong) + "\n];"
    return re.sub(r"var\s+" + re.escape(ten_bien) + r"\s*=\s*\[.*?\];",
                  lambda m: moi, html, count=1, flags=re.S)


# ==========================================================================
# NHOM STATUS
# ==========================================================================

BAN_DO_DEVICEINFO = [
    ("Working Mode",     "device.working_mode"),
    ("Serial Number",    "device.serial_number"),
    ("Model",            "device.model"),
    ("Software Version", "device.software_version"),
    ("Hardware Version", "device.hardware_version"),
    ("RAM Size",         "device.ram_size"),
    ("Mem Usage",        "device.mem_usage"),
    ("CPU Usage",        "device.cpu_usage"),
    ("NAT Session",      "device.nat_session"),
    ("MAC Address",      "device.mac_address"),
    ("GPON Link Status", "gpon.link_status"),
    ("ONU State",        "gpon.onu_state"),
]


def bom_status_deviceinfo(html):
    """Bom toan bo so lieu Device Info tu kho cau hinh vao trang goc."""
    for nhan, khoa in BAN_DO_DEVICEINFO:
        gt = kho.doc(khoa)
        if gt is not None:
            html, _ = _thay_o_sau_nhan(html, nhan, gt)

    d, h, m = _uptime()
    html, _ = _thay_o_sau_nhan(
        html, "Device Up Time", f"\n{d} Days \n{h} Hours \n{m} Minutes\n")
    return html


def bom_status_statistics(html):
    """Status > Statistics â€” 10 o so lieu goi/byte."""
    ban_do = [
        ("Transmit Frames",            "statistics.transmit_frames"),
        ("Transmit Multicast Frames",  "statistics.transmit_multicast_frames"),
        ("Transmit total Bytes",       "statistics.transmit_total_bytes"),
        ("Transmit Collision",         "statistics.transmit_collision"),
        ("Transmit Error Frames",      "statistics.transmit_error_frames"),
        ("Receive Frames",             "statistics.receive_frames"),
        ("Receive Multicast Frame",    "statistics.receive_multicast_frame"),
        ("Receive total Bytes",        "statistics.receive_total_bytes"),
        ("Receive CRC Errors",         "statistics.receive_crc_errors"),
        ("Receive Under-size Frames",  "statistics.receive_under_size_frames"),
    ]
    for nhan, khoa in ban_do:
        gt = kho.doc(khoa)
        if gt is None:
            continue
        mau = re.compile(
            r"(<td class=['\"]tabdata['\"]>(?:&nbsp;)*\s*"
            + re.escape(nhan)
            + r"\s*</td>\s*<td class=['\"]tabdata['\"]>\s*<div align=['\"]center['\"]>)"
            r"(.*?)"
            r"(</div>)",
            re.S | re.I,
        )
        html = mau.sub(lambda m: m.group(1) + str(gt) + m.group(3), html, count=1)
    return html


def bom_ethernet_status(html):
    """Status > Ethernet Status â€” bang 4 cong."""
    cong = kho.doc("ethernet_ports") or []
    dong = []
    for c in cong:
        dong.append('        ["{p}", "{a}","{s}","{g}","{n}"]'.format(
            p=c.get("port", ""), a=c.get("admin_state", ""),
            s=c.get("speed", ""), g=c.get("sent", ""), n=c.get("received", "")))
    return _thay_tableData(html, dong)


def bom_devicetable(html):
    """Status > Device Table â€” danh sach thiet bi dang ket noi."""
    ds = kho.doc("device_table") or []
    tong = kho.doc("device_table_so_dong") or 4
    dong = []
    for i in range(tong):
        if i < len(ds):
            t = ds[i]
            dong.append(
                '        ["{i}", "{ten}","{ip}","{mac}","{loai}","{ngay}" + "days " + "<br />" + "{gio}"]'.format(
                    i=i + 1, ten=t.get("ten", "N/A"), ip=t.get("ip", "N/A"),
                    mac=t.get("mac", "N/A"), loai=t.get("loai", "N/A"),
                    ngay=t.get("ngay", "N/A"), gio=t.get("gio", "N/A")))
        else:
            dong.append(
                '        ["{i}", "N/A","N/A","N/A","N/A","N/A" + "days " + "<br />" + "N/A"]'.format(i=i + 1))
    return _thay_tableData(html, dong)


def bom_wireless_signal(html):
    """Status > Wireless Signal â€” danh sach may dang noi Wi-Fi kem cuong do song."""
    ds = kho.doc("wireless_clients") or []
    n = kho.doc("wireless_so_dong") or 12

    ten = [t.get("ten", "") for t in ds] + [""] * (n - len(ds))
    ip = [t.get("ip", "") for t in ds] + [""] * (n - len(ds))
    mac = [[t.get("mac", ""), "", t.get("rssi1", ""), t.get("rssi2", "")]
           for t in ds] + [["", "", "", ""]] * (n - len(ds))

    tiem = (
        "\n/* Du lieu bom tu kho cau hinh (config_store.wireless_clients) */\n"
        "var hostNameTable2 = " + json.dumps(ten) + ";\n"
        "var IPTable2 = " + json.dumps(ip) + ";\n"
        "var wifiMacTabData = " + json.dumps(mac) + ";\n"
    )
    return html.replace("getHostNameAndIPTable();",
                        tiem + "getHostNameAndIPTable();", 1)


def bom_status_log(html):
    """Status > System Log â€” nhat ky he thong."""
    lt = kho.doc("status_log.log_text")
    if lt is not None:
        html = re.sub(r'(<TEXTAREA NAME="AlphaLogDisplay"[^>]*>)(.*?)(</TEXTAREA>)',
                      r'\1' + str(lt) + r'\3', html, flags=re.I | re.S)
    return html


# ==========================================================================
# NHOM NETWORK
# ==========================================================================

def bom_home_lan(html):
    """Network > LAN â€” bom cau hinh LAN + DHCP + bang lease tu kho."""
    lan = kho.doc("lan") or {}
    KHONG_THAY_VALUE = {"dnsTypeRadio", "dhcpTypeRadio"}

    for ten_o, gt in lan.items():
        if ten_o in KHONG_THAY_VALUE:
            continue
        html, _ = _thay_value_theo_name(html, ten_o, gt)

    if "dnsTypeRadio" in lan:
        html = _thay_radio_theo_name(html, "dnsTypeRadio", lan["dnsTypeRadio"])

    if "dhcpTypeRadio" in lan:
        html = _thay_radio_theo_name(html, "dhcpTypeRadio", lan["dhcpTypeRadio"])

    ds = kho.doc("dhcp_leases") or []
    dong = []
    for i, t in enumerate(ds, 1):
        dong.append('\t["{i}", "{ten}","{ip}","{mac}","{ngay}" + "days " + "{gio}"]'.format(
            i=i, ten=t.get("ten", ""), ip=t.get("ip", ""), mac=t.get("mac", ""),
            ngay=t.get("ngay", ""), gio=t.get("gio", "")))
    if dong:
        html = re.sub(r"var\s+tableData\s*=\s*\[.*?\];",
                      "var tableData = [\n" + ",\n".join(dong) + "\n];",
                      html, count=1, flags=re.S)
    return html


def bom_home_wireless(html):
    """Network > Wireless 2.4G (/cgi-bin/home_wireless.asp)."""
    cfg = kho.doc("home_wireless") or {}
    RADIOS = {"wlan_APenable", "multicastState", "ESSID_Enable_Selection",
              "ESSID_HIDE_Selection", "WMM_Selection", "UseWPS_Selection",
              "WPSMode_Selection", "DefWEPKey3", "DefWEPKey4", "WLAN_FltActive"}
    SELECTS = {"WirelessMode", "TxPower", "WLANChannelBandwidth", "WLANExtensionChannel",
               "WLANGuardInterval", "WLANMCS", "SSID_INDEX", "WEP_Selection",
               "WEP_TypeSelection1", "WEP_TypeSelection2", "TKIP_Selection4",
               "TKIP_Selection5", "TKIP_Selection6", "TxStream_Action", "RxStream_Action"}

    for k, v in cfg.items():
        if k in RADIOS:
            html = _thay_radio_theo_name(html, k, v)
        elif k in SELECTS:
            html = _thay_select_theo_name(html, k, v)
        else:
            html, _ = _thay_value_theo_name(html, k, v)
    return html


def bom_home_wireless_5g(html):
    """Network > Wireless 5G (/cgi-bin/home_wireless_5g.asp)."""
    cfg = kho.doc("home_wireless_5g") or {}
    RADIOS = {"wlan_APenable", "multicastState", "ESSID_Enable_Selection",
              "ESSID_HIDE_Selection", "WMM_Selection", "UseWPS_Selection",
              "WPSMode_Selection", "DefWEPKey3", "DefWEPKey4", "WLAN_FltActive"}
    SELECTS = {"WirelessMode", "TxPower", "WLANChannelBandwidth", "WLANExtensionChannel",
               "WLANGuardInterval", "WLan11acVHTChannelBandwidth", "WLan11acVHTGuardInterval",
               "SSID_INDEX", "WEP_Selection", "WEP_TypeSelection1", "WEP_TypeSelection2",
               "TKIP_Selection4", "TKIP_Selection5", "TKIP_Selection6", "TxStream_Action", "RxStream_Action"}

    for k, v in cfg.items():
        if k in RADIOS:
            html = _thay_radio_theo_name(html, k, v)
        elif k in SELECTS:
            html = _thay_select_theo_name(html, k, v)
        else:
            html, _ = _thay_value_theo_name(html, k, v)
    return html


def bom_home_wan(html):
    """Network > Internet / WAN (/cgi-bin/home_wan.asp)."""
    cfg = kho.doc("home_wan") or {}
    RADIOS = {"wan_VCStatus", "wanTypeRadio", "wan_dot1q", "wan_NAT", "wan_ConnectSelect",
              "wan_PPPGetIP", "dnsTypeRadio", "WAN_DefaultRoute0", "WAN_DefaultRoute1",
              "WAN_DefaultRoute2", "wan_IGMP0", "wan_IGMP1", "wan_IGMP2", "wan_MLD0",
              "wan_MLD1", "wan_MLD2", "wan_IPTV", "wan_ipv6_IPTV", "DynIPv6EnableRadio",
              "PPPIPv6PDRadio0", "PPPIPv6PDRadio2", "PPPIPv6ModeRadio", "DSLITEEnableRadio0",
              "DSLITEEnableRadio1", "DSLITEEnableRadio2", "DSLITEModeRadio0", "DSLITEModeRadio2",
              "pppoe_relay", "EDNSMode", "wan_BridgeInterface0", "wan_BridgeInterface1", "wan_BridgeInterface2"}
    SELECTS = {"wan_TransMode", "wan_VC", "ipVerRadio", "wan_NAT0", "wan_NAT1", "wan_NAT2",
               "wan_RIP0", "wan_RIP1", "wan_RIP2", "wan_RIP_Dir0", "wan_RIP_Dir1", "wan_RIP_Dir2"}

    for k, v in cfg.items():
        if k in RADIOS:
            html = _thay_radio_theo_name(html, k, v)
        elif k in SELECTS:
            html = _thay_select_theo_name(html, k, v)
        else:
            html, _ = _thay_value_theo_name(html, k, v)
    return html


# ==========================================================================
# NHOM MAINTENANCE
# ==========================================================================

def bom_tools_time(html):
    """Maintenance > Time Zone (/cgi-bin/tools_time.asp)."""
    cfg = kho.doc("tools_time") or {}
    if "uiViewdateToolsTZ" in cfg:
        html = _thay_select_theo_name(html, "uiViewdateToolsTZ", cfg["uiViewdateToolsTZ"])
    if "uiViewSyncWith" in cfg:
        html = _thay_select_theo_name(html, "uiViewSyncWith", cfg["uiViewSyncWith"])
    if "uiViewdateDS" in cfg:
        html = _thay_radio_theo_name(html, "uiViewdateDS", cfg["uiViewdateDS"])

    for ten in ("uiViewSNTPServer", "uiViewSNTPServer2", "uiTimezoneType"):
        if ten in cfg:
            html, _ = _thay_value_theo_name(html, ten, cfg[ten])
    return html


def bom_tools_admin(html):
    """Maintenance > Administration (/cgi-bin/tools_admin.asp)."""
    cfg = kho.doc("tools_admin") or {}
    for k, v in cfg.items():
        html, _ = _thay_value_theo_name(html, k, v)
    return html


def bom_tools_wifitimer(html):
    """Maintenance > WiFi Timer (/cgi-bin/tools_wifitimer.asp)."""
    cfg = kho.doc("tools_wifitimer") or {}
    if "wifitimer_enable" in cfg:
        html = _thay_radio_theo_name(html, "wifitimer_enable", cfg["wifitimer_enable"])

    for ngay in ("mon", "tue", "wed", "thu", "fri", "sat", "sun"):
        if ngay in cfg:
            html = _thay_checkbox_theo_name(html, ngay, cfg[ngay])
        if f"{ngay}_value" in cfg:
            html, _ = _thay_value_theo_name(html, f"{ngay}_value", cfg[f"{ngay}_value"])

    for ten in ("starttime", "endtime", "saveFlag"):
        if ten in cfg:
            html, _ = _thay_value_theo_name(html, ten, cfg[ten])
    return html


def bom_tools_reboottimer(html):
    """Maintenance > Reboot Timer (/cgi-bin/tools_reboottimer.asp)."""
    cfg = kho.doc("tools_reboottimer") or {}
    if "reboottimer_enable" in cfg:
        html = _thay_radio_theo_name(html, "reboottimer_enable", cfg["reboottimer_enable"])

    for ngay in ("mon", "tue", "wed", "thu", "fri", "sat", "sun"):
        if ngay in cfg:
            html = _thay_checkbox_theo_name(html, ngay, cfg[ngay])
        if f"{ngay}_value" in cfg:
            html, _ = _thay_value_theo_name(html, f"{ngay}_value", cfg[f"{ngay}_value"])

    for ten in ("time", "saveFlag"):
        if ten in cfg:
            html, _ = _thay_value_theo_name(html, ten, cfg[ten])
    return html


# ==========================================================================
# NHOM ACCESS
# ==========================================================================

def bom_access_upnp(html):
    """Access > UPnP (/cgi-bin/access_upnp.asp)."""
    cfg = kho.doc("access_upnp") or {}
    if "UPnP_active" in cfg:
        html = _thay_radio_theo_name(html, "UPnP_active", cfg["UPnP_active"])
    if "UPnP_auto" in cfg:
        html = _thay_radio_theo_name(html, "UPnP_auto", cfg["UPnP_auto"])
    if "SaveFlag" in cfg:
        html, _ = _thay_value_theo_name(html, "SaveFlag", cfg["SaveFlag"])
    return html


def bom_access_ddns(html):
    """Access > DDNS (/cgi-bin/access_ddns.asp)."""
    cfg = kho.doc("access_ddns") or {}
    if "Enable_DyDNS" in cfg:
        html = _thay_radio_theo_name(html, "Enable_DyDNS", cfg["Enable_DyDNS"])
    if "Enable_Wildcard" in cfg:
        html = _thay_radio_theo_name(html, "Enable_Wildcard", cfg["Enable_Wildcard"])
    if "ddns_ServerName" in cfg:
        html = _thay_select_theo_name(html, "ddns_ServerName", cfg["ddns_ServerName"])

    for ten in ("sysDNSHost", "sysDNSUser", "sysDNSPassword", "SaveFlag"):
        if ten in cfg:
            html, _ = _thay_value_theo_name(html, ten, cfg[ten])
    return html


def bom_access_auth(html):
    """Access > Auth (/cgi-bin/access_auth.asp)."""
    cfg = kho.doc("access_auth") or {}
    for k, v in cfg.items():
        html, _ = _thay_value_theo_name(html, k, v)
    return html


def bom_access_parentalControl(html):
    """Access > Parental Control (/cgi-bin/access_parentalControl.asp)."""
    cfg = kho.doc("access_parentalControl") or {}
    if "url_mode_select" in cfg:
        html = _thay_select_theo_name(html, "url_mode_select", cfg["url_mode_select"])
    return html


# ==========================================================================
# NHOM ADVANCED
# ==========================================================================

def bom_adv_firewall(html):
    """Advanced > Firewall (/cgi-bin/adv_firewall.asp)."""
    cfg = kho.doc("adv_firewall") or {}
    RADIOS = {"firewallEnable", "spiEnable", "wanAccessLanWebRadio", "telnetradio", "sshradio"}
    for k, v in cfg.items():
        if k in RADIOS:
            html = _thay_radio_theo_name(html, k, v)
        else:
            html, _ = _thay_value_theo_name(html, k, v)
    return html


def bom_adv_nat_alg_switch(html):
    """Advanced > ALG Switch (/cgi-bin/adv_nat_alg_switch.asp)."""
    cfg = kho.doc("adv_nat_alg_switch") or {}
    RADIOS = {"rtsp_active", "l2tp_active", "pptp_active", "ipsec_active",
              "sip_active", "h323_active", "ftp_active"}
    for k, v in cfg.items():
        if k in RADIOS:
            html = _thay_radio_theo_name(html, k, v)
        else:
            html, _ = _thay_value_theo_name(html, k, v)
    return html


SO_O_VIRTUAL_SERVER = 32  # dinh dang co dinh â€” dem ["1",...] .. ["32",...] trong reference
SO_O_PORT_TRIGGER = 8     # dinh dang co dinh â€” dem ["1",...] .. ["8",...] trong reference


def bom_adv_nat_top(html):
    """
    Advanced > NAT (/cgi-bin/adv_nat_top.asp va 2 URL anh em cung kho:
    adv_nat_top_VirtualServer.asp, adv_nat_top_PortTriggering.asp).
    """
    cfg = kho.doc("adv_nat_top") or {}
    if "dmz_active" in cfg:
        html = _thay_radio_theo_name(html, "dmz_active", cfg["dmz_active"])
    if "NATtyleChange" in cfg:
        html = _thay_select_theo_name(html, "NATtyleChange", cfg["NATtyleChange"])

    for ten in ("natFlag", "dmzHostIP", "service_num_flag", "dmzFlag", "saveFlag"):
        if ten in cfg:
            html, _ = _thay_value_theo_name(html, ten, cfg[ten])

    # DMZ â€” bang tom tat 1 dong (var tableData = [["Enable", ip, "0"]]).
    # Xac nhan bang HAR: cot [0] LUON la chuoi chu "Enable" bat ke dmz_active
    # dang Yes/No (thiet bi that KHONG doi thanh "Disable" â€” giu nguyen dung
    # nhu do duoc, khong "sua cho hop ly"). Client JS (showTableDMZ, keyIndex=1)
    # tu an dong neu cot [1] la "N/A"/""/"0.0.0.0"/"0" â€” server chi can dua
    # dung gia tri IP, khong can tu quyet dinh an/hien.
    dmz_ip = cfg.get("dmzHostIP") or "N/A"
    if dmz_ip == "":
        dmz_ip = "N/A"
    html = _thay_mang_bang(html, "tableData", [f'\t["Enable","{dmz_ip}","0"]'])

    # Virtual Server â€” mang co dinh 32 o (None = trong = "N/A"). Xac nhan
    # bang adv_table_actions.har + adv_table_actions_2.har: them = dien vao
    # o TRONG DAU TIEN, xoa = tra dung o do ve trong â€” KHONG don cac o khac.
    vs = cfg.get("virtual_servers") or []
    dong = []
    for i in range(SO_O_VIRTUAL_SERVER):
        r = vs[i] if i < len(vs) else None
        if r:
            dong.append(
                f'\t["{i + 1}", "{r.get("start_port", "N/A")}","{r.get("end_port", "N/A")}",'
                f'"{r.get("ip", "N/A")}","{r.get("local_sport", "N/A")}","{r.get("local_eport", "N/A")}","{i}"]'
            )
        else:
            dong.append(f'\t["{i + 1}", "N/A","N/A","N/A","N/A","N/A","{i}"]')
    html = _thay_mang_bang(html, "tableData1", dong)

    # Port Trigger â€” mang co dinh 8 o, cung co che voi Virtual Server.
    # Xac nhan bang adv_table_actions_2.har (TrigFlag=1 them, TrigFlag=2 xoa).
    pt = cfg.get("port_triggers") or []
    dong2 = []
    for i in range(SO_O_PORT_TRIGGER):
        r = pt[i] if i < len(pt) else None
        if r:
            dong2.append(
                f'\t["{i + 1}", "{r.get("app", "N/A")}","{r.get("trig_start", "N/A")}",'
                f'"{r.get("trig_end", "N/A")}","{r.get("trig_proto", "N/A")}",'
                f'"{r.get("open_start", "N/A")}","{r.get("open_end", "N/A")}",'
                f'"{r.get("open_proto", "N/A")}","{i}"]'
            )
        else:
            dong2.append(f'\t["{i + 1}", "N/A","N/A","N/A","N/A","N/A","N/A","N/A","{i}"]')
    html = _thay_mang_bang(html, "tableData2", dong2)
    return html


SO_O_QOS_BW = 10  # dinh dang co dinh â€” dem ["1",...] .. ["10",...] trong reference
SO_O_QOS_RULE = 16  # QOS Rule / Mapping Rule â€” dropdown QosRuleIndex 0-15, xac nhan bang adv_qos_rule.har


def _hien_qosRule_div(html, hien):
    """
    Bat/tat inline style cua <div id="qosRule">. Xac nhan bang adv_qos_rule.har:
    khi o dang xem co Active=Yes, server tra ve KHONG co "style=display:none"
    (div hien); Active=No (mac dinh/da xoa) thi co "style=display:none".
    """
    mau = re.compile(r'<div\s+id\s*=\s*["\']qosRule["\'][^>]*>', re.I)
    m = mau.search(html)
    if not m:
        return html
    the_moi = '<div id="qosRule">' if hien else '<div id="qosRule" style="display:none;">'
    return html[:m.start()] + the_moi + html[m.end():]


def bom_adv_qos(html):
    """Advanced > QoS (/cgi-bin/adv_qos.asp)."""
    cfg = kho.doc("adv_qos") or {}
    if "Qos_active" in cfg:
        html = _thay_radio_theo_name(html, "Qos_active", cfg["Qos_active"])
    if "Qosdrop" in cfg:
        html = _thay_radio_theo_name(html, "Qosdrop", cfg["Qosdrop"])
    if "Qosdiscipline" in cfg:
        html = _thay_radio_theo_name(html, "Qosdiscipline", cfg["Qosdiscipline"])

    for ten in ("QosWRRweight1", "QosWRRweight2", "QosWRRweight3", "QosWRRweight4", "qoSOptType", "addNum"):
        if ten in cfg:
            html, _ = _thay_value_theo_name(html, ten, cfg[ten])

    # Bang Bandwidth Control â€” mang co dinh 10 o (None = trong = "N/A").
    # MAC luu KHONG dau ':' (giong thiet bi that), JS boc lai bang
    # getMacWithColon() luc hien thi. Xac nhan bang HAR ca 2 dot (them va xoa).
    qr = cfg.get("qos_rules") or []
    dong = []
    for i in range(SO_O_QOS_BW):
        r = qr[i] if i < len(qr) else None
        if r:
            dong.append(
                f'\t["{i + 1}", "{r.get("desc", "N/A")}",getMacWithColon("{r.get("mac", "N/A")}"),'
                f'"{r.get("up", "N/A")}","{r.get("down", "N/A")}","{i}"]'
            )
        else:
            dong.append(f'\t["{i + 1}", "N/A",getMacWithColon("N/A"),"N/A","N/A","{i}"]')
    html = _thay_mang_bang(html, "tableData", dong)

    # QOS Rule / Mapping Rule â€” 16 o co dinh, luu RIENG theo QosRuleIndex (khong
    # phai "dien o trong dau tien" nhu Bandwidth Control â€” nguoi dung tu chon o
    # qua dropdown). Chi so dang xem la CON TRO ghi trong cfg["QosRuleIndex"]
    # (ten trung field that, tu dong cap nhat qua vong lap scalar chung o
    # ghi_tu_form() moi khi POST co mang theo). Xac nhan tan mat bang
    # adv_qos_rule.har: doi dropdown -> tu dong submit QOS_Flag=1 kem
    # QosRuleIndex moi -> response phan anh DUNG o do (rong neu chua luu gi).
    idx = _so_nguyen(cfg.get("QosRuleIndex"), 0)
    if not (0 <= idx < SO_O_QOS_RULE):
        idx = 0
    html = _thay_select_theo_name(html, "QosRuleIndex", str(idx))
    mr = cfg.get("qos_mapping_rules") or []
    o = mr[idx] if idx < len(mr) else None
    if o and o.get("active") == "Yes":
        # File goc da o dung trang thai mac dinh (Active=No, cac o rong, div
        # an) â€” CHI can ghi de khi o dang xem THAT SU co du lieu Active=Yes.
        html = _thay_radio_theo_name(html, "QosRuleActive", "Yes")
        html = _thay_select_theo_name(html, "QosApp", o.get("app", ""))
        html, _ = _thay_value_theo_name(html, "QosDestIpValue", o.get("dest_ip", ""))
        html, _ = _thay_value_theo_name(html, "QosDestMaskValue", o.get("dest_mask", ""))
        html, _ = _thay_value_theo_name(html, "QosDestPortValue1", o.get("dest_port1", ""))
        html, _ = _thay_value_theo_name(html, "QosDestPortValue2", o.get("dest_port2", ""))
        html, _ = _thay_value_theo_name(html, "QosSrcIpValue", o.get("src_ip", ""))
        html, _ = _thay_value_theo_name(html, "QosSrcMaskValue", o.get("src_mask", ""))
        html = _thay_select_theo_name(html, "QosProtocol", o.get("protocol", ""))
        html = _thay_select_theo_name(html, "QosConfigPriority", o.get("priority", ""))
        html = _hien_qosRule_div(html, True)
    return html


def _dong_static_route(idx, r):
    """
    1 dong bang Static Route. Dinh dang <tr> xac nhan tan mat bang
    adv_table_actions.har (POST toi adv_routing_table.asp, EditFlag=1):
    dong moi duoc CHEN O DAU bang (index 0), cac dong con lai lui xuong;
    dong "editable" (nguoi dung them) co nut Remove goi doDelete(idx),
    dong mac dinh cua thiet bi (3 dong seed) khong co nut gi (chi &nbsp;).
    """
    if r.get("editable"):
        o_edit = (
            '\n                                        <INPUT TYPE="button" class="button3" '
            f'NAME="RemoveBtn" VALUE="Remove" onClick="doDelete({idx});">\n                                        '
        )
    else:
        o_edit = '\n                                        \n                                                &nbsp;\n                                        '
    return (
        "\n                                <tr bgcolor=#FFFFFF height=30 id=tablebutton>\n"
        f"                        <td align=center class=tabdata>{idx}</td><td align=center class=tabdata>{r.get('dest', '')}</td>\n"
        f"                        <td align=center class=tabdata>{r.get('mask', '')}</td><td align=center class=tabdata>{r.get('gateway', '')}</td>\n"
        f"                        <td align=center class=tabdata>{r.get('metric', '0')}</td><td align=center class=tabdata>{r.get('interface', '')}</td>\n"
        '\n                                <td align=center class="topborderstyle">'
        f"{o_edit}"
        "\n                                </td>\n"
        "                                                <!--\n"
        f'                                                <td align=center class="topborderstyle"><IMG src=/cross.gif onmouseover=this.style.cursor=&apos;hand&apos; onClick=doDelete({idx});></td>\n'
        "                                                -->\n"
        "                        </tr>\n"
    )


def bom_adv_routing_table(html):
    """Advanced > Routing (/cgi-bin/adv_routing_table.asp)."""
    cfg = kho.doc("adv_routing_table") or {}
    if "Route_PVC_Index" in cfg:
        html = _thay_select_theo_name(html, "Route_PVC_Index", cfg["Route_PVC_Index"])
    for ten in ("Route_num", "user_def_num", "User_def", "RouteActive", "add_num"):
        if ten in cfg:
            html, _ = _thay_value_theo_name(html, ten, cfg[ten])

    # Bom danh sach static_routes vao bang <tr> â€” xem _dong_static_route()
    ds = cfg.get("static_routes") or []
    khoi = "".join(_dong_static_route(i, r) for i, r in enumerate(ds))
    html = re.sub(
        r'(<!--\s*<td align=center class="tablelisttitle">Drop </td>\s*-->\s*</tr>)'
        r'.*?'
        r'(</table>\s*</div><!--class=configstyle-->)',
        lambda m: m.group(1) + khoi + "\n                " + m.group(2),
        html, count=1, flags=re.S,
    )
    return html


# ==========================================================================
# CHIEU GHI â€” nhan POST tu form roi luu vao kho cau hinh
# ==========================================================================

# Duong dan trang  ->  (khoa goc trong kho, co hanh dong)
#
# "co" = ten truong HIDDEN ma JS goc dat =1 (hoac gia tri cu the) ngay truoc
# khi goi .submit() that (doc tan mat tu reference/html/*.asp.html, KHONG doan).
# "co": None nghia la DA DOC nhung trang do KHONG co truong co rieng â€” form
# chi goi document.<ten_form>.submit() thang, khong co co danh dau hanh dong
# (VD home_wireless/home_wireless_5g: doSave() chi set vai gia tri UI roi
# submit() thang, khong co "WlanSaveFlag" hay tuong tu).
#
# LUU Y: hien tai server.py CHUA doc "co" de validate â€” moi field trong
# BANG_GHI van duoc ghi qua ghi_tu_form() mien la ten khop khoa co san trong
# kho. "co" o day la tu lieu tra cuu + de dung cho buoc siet chat sau nay.
BANG_GHI = {
    # Network
    "/cgi-bin/home_lan.asp": {"khoa_goc": "lan", "co": None},
    "/cgi-bin/home_wireless.asp": {"khoa_goc": "home_wireless", "co": None},          # xac nhan: KHONG co co rieng (doSave() submit() thang)
    "/cgi-bin/home_wireless_5g.asp": {"khoa_goc": "home_wireless_5g", "co": None},    # xac nhan: KHONG co co rieng (doSave() submit() thang)
    "/cgi-bin/home_wan.asp": {"khoa_goc": "home_wan", "co": "wanSaveFlag"},           # xac nhan: form.wanSaveFlag.value=1 ngay truoc form.submit() (dong 1506)

    # Maintenance
    "/cgi-bin/tools_time.asp": {"khoa_goc": "tools_time", "co": "SaveTime"},          # xac nhan bang HAR that (tools_time_apply.har)
    "/cgi-bin/tools_admin.asp": {"khoa_goc": "tools_admin", "co": "adminFlag"},       # xac nhan: adminFlag.value=1 truoc submit
    "/cgi-bin/tools_wifitimer.asp": {"khoa_goc": "tools_wifitimer", "co": "saveFlag"},     # xac nhan: saveFlag.value=1 truoc submit
    "/cgi-bin/tools_reboottimer.asp": {"khoa_goc": "tools_reboottimer", "co": "saveFlag"}, # xac nhan: saveFlag.value=1 truoc submit

    # Access
    "/cgi-bin/access_upnp.asp": {"khoa_goc": "access_upnp", "co": "SaveFlag"},        # xac nhan: SaveFlag.value=1 truoc submit
    "/cgi-bin/access_ddns.asp": {"khoa_goc": "access_ddns", "co": "SaveFlag"},        # xac nhan: SaveFlag.value=1 truoc submit
    "/cgi-bin/access_auth.asp": {"khoa_goc": "access_auth", "co": "AuthFlag"},        # xac nhan: AuthFlag.value=1 truoc submit (thiet bi that TU KHOI DONG LAI sau khi luu trang nay â€” sim CHUA mo phong reboot, xem ISSUES.md)
    "/cgi-bin/access_parentalControl.asp": {"khoa_goc": "access_parentalControl", "co": "URLAddFlag"},  # xac nhan: them URL filter dat URLAddFlag=1 truoc submit (ham addURL()). CANH BAO: ham nay co dong "var urlenable='0'; if(urlenable=='0'){alert(...);return;}" â€” HANG SO CUNG, luon return truoc khi toi doan dat co â€” tren thiet bi that nut Add co the KHONG hoat dong duoc theo duong JS nay (loi/chua hoan thien firmware), can xac nhan bang thao tac that. Cac co khac cung trang (URLModeChangeFlag/URLModeModifyFlag/timerAddFlag) chua doc â€” xem ISSUES.md

    # Advanced
    "/cgi-bin/adv_firewall.asp": {"khoa_goc": "adv_firewall", "co": "fwFlag"},        # xac nhan: fwFlag.value=1 truoc submit
    "/cgi-bin/adv_nat_alg_switch.asp": {"khoa_goc": "adv_nat_alg_switch", "co": "algFlag"},  # xac nhan: algFlag.value=1 truoc submit
    "/cgi-bin/adv_nat_top.asp": {"khoa_goc": "adv_nat_top", "co": "dmzFlag"},         # xac nhan bang HAR (adv_table_actions_2.har): Luu DMZ dat dmzFlag=1 (ApplyDMZ()), Xoa DMZ dat dmzFlag=2 (doDelete()). Virtual Server va Port Trigger POST sang 2 URL rieng, xem 2 dong duoi
    "/cgi-bin/adv_nat_top_VirtualServer.asp": {"khoa_goc": "adv_nat_top", "co": "virsevFlag"},  # xac nhan bang HAR: virsevFlag=2 them (Add_virtualsvr()), virsevFlag=1 xoa (DeleteVirSer(j)). Dung CHUNG kho voi adv_nat_top
    "/cgi-bin/adv_nat_top_PortTriggering.asp": {"khoa_goc": "adv_nat_top", "co": "TrigFlag"},  # URL MOI phat hien qua HAR dot 2 â€” TrigFlag=1 them (addTrigRule()), TrigFlag=2 xoa (DeleteTrig(j)). Dung CHUNG kho voi adv_nat_top
    "/cgi-bin/adv_qos.asp": {"khoa_goc": "adv_qos", "co": "QOS_Flag"},                # xac nhan bang HAR: QOS_Flag=5+MacAddFlag=1 them Bandwidth Control (doAddRule()), QOS_Flag=4 luu Discipline Setting (onClickQosDiscipline()). Xoa Bandwidth Control (doDeleteRule) KHONG dung co nay ma dung delnum â€” xem BANG_GHI_BANG. QOS_Flag=0 luu / =2 xoa 1 o QOS Rule (Mapping Rule, 16 o co dinh theo QosRuleIndex) â€” xac nhan bang adv_qos_rule.har (2026-08-22), xem BANG_GHI_BANG. QOS_Flag=1 (doi dropdown QosRuleIndex) KHONG can dispatch rieng â€” con tro QosRuleIndex la field that, tu dong ghi qua vong lap scalar chung o duoi
    "/cgi-bin/adv_routing_table.asp": {"khoa_goc": "adv_routing_table", "co": "EditFlag"},  # xac nhan bang HAR: EditFlag=1 them Static Route (doSubmit()). Xoa (doDelete(i)) KHONG dung co nay ma dung delnum â€” xem BANG_GHI_BANG
}


def co_ghi(duong_dan):
    return duong_dan in BANG_GHI


def _dien_o_trong(ds, kich_thuoc, dong_moi):
    """
    Dien `dong_moi` vao O TRONG (None) dau tien trong mang co dinh
    `kich_thuoc` phan tu. Neu het cho thi khong them (thiet bi that da
    chan o JS truoc khi submit â€” vd "Maximal number of rules").
    """
    ds = list(ds) + [None] * max(0, kich_thuoc - len(ds))
    for i in range(kich_thuoc):
        if ds[i] is None:
            ds[i] = dong_moi
            return ds
    return ds


def _xoa_o(ds, kich_thuoc, idx):
    """Tra o thu `idx` ve trong (None) â€” KHONG don cac o con lai."""
    ds = list(ds) + [None] * max(0, kich_thuoc - len(ds))
    if 0 <= idx < kich_thuoc:
        ds[idx] = None
    return ds


def _so_nguyen(gt, mac_dinh=0):
    try:
        return int(gt)
    except (TypeError, ValueError):
        return mac_dinh


def _them_dong_virtual_server(goc, truong):
    """
    Advanced > NAT â€” them 1 dong Virtual Server. Mang co dinh 32 o, dien
    vao O TRONG DAU TIEN (xac nhan bang adv_table_actions.har +
    adv_table_actions_2.har â€” them lan 2 dien dung o thu 2, khong ghi de o 1).
    Truong nguon: start_port1, end_port1, Addr1, local_sport, local_eport.
    """
    ds = (kho.doc(goc) or {}).get("virtual_servers") or []
    ds = _dien_o_trong(ds, SO_O_VIRTUAL_SERVER, {
        "start_port": truong.get("start_port1", ""),
        "end_port": truong.get("end_port1", ""),
        "ip": truong.get("Addr1", ""),
        "local_sport": truong.get("local_sport", ""),
        "local_eport": truong.get("local_eport", ""),
    })
    kho.ghi(f"{goc}.virtual_servers", ds)


def _xoa_dong_virtual_server(goc, truong):
    """
    Advanced > NAT â€” xoa 1 dong Virtual Server. virsevFlag=1, editnum=j
    la CHI SO O can xoa (ham DeleteVirSer(j) trong JS goc). Xac nhan bang
    adv_table_actions_2.har: o do tra ve "N/A", cac o khac giu nguyen.
    """
    idx = _so_nguyen(truong.get("editnum"))
    ds = (kho.doc(goc) or {}).get("virtual_servers") or []
    ds = _xoa_o(ds, SO_O_VIRTUAL_SERVER, idx)
    kho.ghi(f"{goc}.virtual_servers", ds)


def _them_dong_port_trigger(goc, truong):
    """
    Advanced > NAT â€” them 1 dong Port Trigger (URL rieng
    adv_nat_top_PortTriggering.asp). Mang co dinh 8 o, dien vao O TRONG
    DAU TIEN. Xac nhan bang adv_table_actions_2.har (TrigFlag=1).
    """
    ds = (kho.doc(goc) or {}).get("port_triggers") or []
    ds = _dien_o_trong(ds, SO_O_PORT_TRIGGER, {
        "app": truong.get("PortTriggering_Applications", ""),
        "trig_start": truong.get("Trig_start_port", ""),
        "trig_end": truong.get("Trig_end_port", ""),
        "trig_proto": truong.get("Trig_PtclChoose", ""),
        "open_start": truong.get("Open_start_port", ""),
        "open_end": truong.get("Open_end_port", ""),
        "open_proto": truong.get("Open_PtclChange", ""),
    })
    kho.ghi(f"{goc}.port_triggers", ds)


def _xoa_dong_port_trigger(goc, truong):
    """
    Advanced > NAT â€” xoa 1 dong Port Trigger. TrigFlag=2, editTrigNum=j
    la chi so o can xoa (ham DeleteTrig(j)). Xac nhan bang
    adv_table_actions_2.har: o do tra ve "N/A" het 7 cot.
    """
    idx = _so_nguyen(truong.get("editTrigNum"))
    ds = (kho.doc(goc) or {}).get("port_triggers") or []
    ds = _xoa_o(ds, SO_O_PORT_TRIGGER, idx)
    kho.ghi(f"{goc}.port_triggers", ds)


def _luu_dmz(goc, truong):
    """
    Advanced > NAT â€” Luu/Bat DMZ (dmzFlag=1, ham ApplyDMZ()). Cac truong
    dmz_active/dmzHostIP DA duoc vong lap scalar chung ghi truoc do trong
    ghi_tu_form() (khop dung ten field that) â€” ham nay chi la tu lieu xac
    nhan "co" dmzFlag=1, KHONG can ghi lai gi them.
    """
    return


def _xoa_dmz(goc, truong):
    """
    Advanced > NAT â€” Xoa/Tat DMZ (dmzFlag=2, ham doDelete()). Xac nhan
    bang HAR (adv_table_actions_2.har): thiet bi THAT BUOC ep dmz_active
    ve "No" va dmzHostIP ve rong, BAT KE gia tri dmz_active gui len trong
    body (browser gui gia tri cu chua kip doi) â€” phai ghi de LAI sau vong
    lap scalar chung, khong tin theo body.
    """
    kho.ghi(f"{goc}.dmz_active", "No")
    kho.ghi(f"{goc}.dmzHostIP", "")


# PVC0 la PVC DUY NHAT that tren thiet bi (option PVC1/PVC2 bi comment trong
# reference/html/adv_routing_table.asp.html â€” thiet bi chi co 1 cong WAN).
# HAR xac nhan PVC0 -> hien thi ten interface "ppp0" (khop wanTypeRadio=2
# PPPoE trong kho home_wan). Khong bia them PVC nao khac.
BANG_PVC_INTERFACE = {"PVC0": "ppp0"}


def _them_dong_route(goc, truong):
    """
    Advanced > Routing â€” them 1 dong Static Route. CHEN O DAU danh sach
    (index 0), cac dong con lai LUI XUONG â€” khac han kieu "dien o trong"
    cua NAT/QoS o tren. Xac nhan rieng bang HAR cua chinh trang nay
    (adv_table_actions.har + adv_table_actions_2.har).
    Gateway hien "N/A" khi dung PVC gateway (Route_PVCGateway != "Yes"),
    nguoc lai lay tu staticGatewayIP â€” HAR chi xac nhan nhanh "No" (PVC),
    nhanh "Yes" (nhap tay) CHUA co bang chung, ghi vao ISSUES.md.
    """
    ds = list((kho.doc(goc) or {}).get("static_routes") or [])
    gateway = truong.get("staticGatewayIP", "N/A") if truong.get("Route_PVCGateway") == "Yes" else "N/A"
    ds.insert(0, {
        "dest": truong.get("staticDestIP", ""),
        "mask": truong.get("staticSubnetMask", ""),
        "gateway": gateway,
        "interface": BANG_PVC_INTERFACE.get(truong.get("Route_PVC_Index", ""), "N/A"),
        "metric": truong.get("staticMetric", "0"),
        "editable": True,
    })
    kho.ghi(f"{goc}.static_routes", ds)
    hien = kho.doc(goc) or {}
    kho.ghi(f"{goc}.Route_num", str(int(hien.get("Route_num", 3) or 3) + 1))
    kho.ghi(f"{goc}.user_def_num", str(int(hien.get("user_def_num", 0) or 0) + 1))
    kho.ghi(f"{goc}.add_num", str(int(hien.get("add_num", 0) or 0) + 1))


def _xoa_dong_route(goc, truong):
    """
    Advanced > Routing â€” xoa 1 dong Static Route. Ham doDelete(i) trong
    JS goc CHI dat delnum=i roi submit â€” KHONG dat EditFlag hay co nao
    khac (khac han NAT: NAT co virsevFlag rieng cho xoa, Routing thi
    khong). Xac nhan bang adv_table_actions_2.har: xoa dung dong da them
    (o vi tri 0, vi them luon chen dau), bang tro ve DUNG BYTE COUNT cua
    3 dong seed goc (25640 byte) â€” tuc la XOA THAT khoi danh sach (khac
    kieu "tra ve trong" cua NAT/QoS â€” Routing la list dong, khong phai
    mang co dinh).
    """
    idx = _so_nguyen(truong.get("delnum"))
    ds = list((kho.doc(goc) or {}).get("static_routes") or [])
    if 0 <= idx < len(ds):
        ds.pop(idx)
        kho.ghi(f"{goc}.static_routes", ds)
        hien = kho.doc(goc) or {}
        kho.ghi(f"{goc}.Route_num", str(max(0, int(hien.get("Route_num", 1) or 1) - 1)))
        kho.ghi(f"{goc}.user_def_num", str(max(0, int(hien.get("user_def_num", 1) or 1) - 1)))


def _them_dong_qos_bw(goc, truong):
    """
    Advanced > QoS â€” them 1 dong Bandwidth Control. Mang co dinh 10 o,
    dien vao O TRONG DAU TIEN (xac nhan bang adv_table_actions.har,
    QOS_Flag=5 + MacAddFlag=1, ham doAddRule()).
    MAC luu KHONG dau ':' dung theo truong
    QoS_Bandwidth_Control_Mac_WithOut_Colon that trong POST body.
    """
    ds = (kho.doc(goc) or {}).get("qos_rules") or []
    ds = _dien_o_trong(ds, SO_O_QOS_BW, {
        "desc": truong.get("QoS_Bandwidth_Control_Description", ""),
        "mac": truong.get("QoS_Bandwidth_Control_Mac_WithOut_Colon", ""),
        "up": truong.get("QoS_Bandwidth_Control_Up", ""),
        "down": truong.get("QoS_Bandwidth_Control_Down", ""),
    })
    kho.ghi(f"{goc}.qos_rules", ds)
    kho.ghi(f"{goc}.addNum", str(int((kho.doc(goc) or {}).get("addNum", 0) or 0) + 1))


def _xoa_dong_qos_bw(goc, truong):
    """
    Advanced > QoS â€” xoa 1 dong Bandwidth Control. Ham doDeleteRule(i)
    trong JS goc CHI dat delnum=i roi submit â€” KHONG dat QOS_Flag (giu
    nguyen mac dinh "0"). SUY LUAN tu JS + AP DUNG CUNG CO CHE da xac
    nhan bang HAR that o Routing (doDelete(i) hai ham y het cau truc) â€”
    rieng cho QoS Bandwidth Control CHUA co HAR truc tiep, xem ISSUES.md.
    """
    idx = _so_nguyen(truong.get("delnum"))
    ds = (kho.doc(goc) or {}).get("qos_rules") or []
    ds = _xoa_o(ds, SO_O_QOS_BW, idx)
    kho.ghi(f"{goc}.qos_rules", ds)


def _luu_qos_rule(goc, truong):
    """
    Advanced > QoS â€” luu 1 o QOS Rule / Mapping Rule. QOS_Flag=0, ham
    doAdd() (nut Add la TYPE=SUBMIT, submit truc tiep). 16 o LUU RIENG
    THEO CHI SO QosRuleIndex (nguoi dung tu chon o qua dropdown, khong
    phai "dien o trong dau tien" nhu Bandwidth Control).
    Xac nhan tan mat bang adv_qos_rule.har (entry 56 -> 69 -> 80, 2026-08-22):
    Add o index 0 (Active=Yes, App=IGMP, Dest 192.168.1.100/255.255.255.255,
    port 80~80, Src 192.168.1.50/255.255.255.255, Protocol=TCP, Queue=High)
    -> doi dropdown sang 1 (o rong, mac dinh) -> quay lai 0 -> response tra
    DUNG lai het du lieu vua luu, khong mat â€” chung minh moi o giu RIENG.
    CHI ghi cac truong DA XAC NHAN CO MAT trong POST body that. KHONG ghi
    QosSrcPortValue1/2 â€” HAR xac nhan 2 truong nay KHONG duoc gui len khi
    App=IGMP (JS tu vo hieu hoa vi IGMP khong dung port), chua co bang
    chung cho cac App khac â€” de trong, khong bia.
    """
    idx = _so_nguyen(truong.get("QosRuleIndex"), -1)
    if not (0 <= idx < SO_O_QOS_RULE):
        return
    ds = (kho.doc(goc) or {}).get("qos_mapping_rules") or []
    ds = list(ds) + [None] * max(0, SO_O_QOS_RULE - len(ds))
    ds[idx] = {
        "active": truong.get("QosRuleActive", "No"),
        "app": truong.get("QosApp", ""),
        "dest_ip": truong.get("QosDestIpValue", ""),
        "dest_mask": truong.get("QosDestMaskValue", ""),
        "dest_port1": truong.get("QosDestPortValue1", ""),
        "dest_port2": truong.get("QosDestPortValue2", ""),
        "src_ip": truong.get("QosSrcIpValue", ""),
        "src_mask": truong.get("QosSrcMaskValue", ""),
        "protocol": truong.get("QosProtocol", ""),
        "priority": truong.get("QosConfigPriority", ""),
    }
    kho.ghi(f"{goc}.qos_mapping_rules", ds)


def _xoa_qos_rule(goc, truong):
    """
    Advanced > QoS â€” xoa 1 o QOS Rule / Mapping Rule. QOS_Flag=2, ham
    doDel(). Xac nhan bang adv_qos_rule.har (entry 143): xoa dung o dang
    chon (QosRuleIndex), tra ve mac dinh (Active=No, cac o rong, div
    qosRule an lai) â€” EP ve mac dinh giong _xoa_dmz, KHONG doc theo body
    (body luc do van con du lieu cu do JS khong xoa form truoc khi submit).
    """
    idx = _so_nguyen(truong.get("QosRuleIndex"), -1)
    if not (0 <= idx < SO_O_QOS_RULE):
        return
    ds = (kho.doc(goc) or {}).get("qos_mapping_rules") or []
    ds = list(ds) + [None] * max(0, SO_O_QOS_RULE - len(ds))
    ds[idx] = None
    kho.ghi(f"{goc}.qos_mapping_rules", ds)


# Hanh dong "them/xoa 1 dong" cho cac trang dang bang â€” khong the ghi qua
# vong lap truong thuong cua ghi_tu_form() vi ten truong POST (Addr1,
# start_port1, delnum...) khong trung khoa co san trong kho (khoa la 1
# LIST/mang, khong phai field rieng). Moi URL co THE co NHIEU luat (them
# VA xoa), kiem tra lan luot theo thu tu, chi luat dau tien khop moi chay.
# "kieu":"co"     -> kich hoat khi truong[ten] == gia_tri
# "kieu":"delnum" -> kich hoat khi truong["delnum"] la chuoi KHONG RONG
#                    (Routing/QoS xoa dong khong dung co rieng, chi dua
#                    vao delnum â€” xac nhan tan mat tung truong hop, xem
#                    docstring cua tung ham xoa o tren)
BANG_GHI_BANG = {
    "/cgi-bin/adv_nat_top.asp": [
        {"kieu": "co", "ten": "dmzFlag", "gia_tri": "1", "ham": _luu_dmz},
        {"kieu": "co", "ten": "dmzFlag", "gia_tri": "2", "ham": _xoa_dmz},
    ],
    "/cgi-bin/adv_nat_top_VirtualServer.asp": [
        {"kieu": "co", "ten": "virsevFlag", "gia_tri": "2", "ham": _them_dong_virtual_server},
        {"kieu": "co", "ten": "virsevFlag", "gia_tri": "1", "ham": _xoa_dong_virtual_server},
    ],
    "/cgi-bin/adv_nat_top_PortTriggering.asp": [
        {"kieu": "co", "ten": "TrigFlag", "gia_tri": "1", "ham": _them_dong_port_trigger},
        {"kieu": "co", "ten": "TrigFlag", "gia_tri": "2", "ham": _xoa_dong_port_trigger},
    ],
    "/cgi-bin/adv_qos.asp": [
        # QOS_Flag=0/2 CHI la hanh dong QOS Rule THAT SU khi co kem QosRuleIndex â€”
        # "0" cung la GIA TRI MAC DINH cua truong QOS_Flag khi thiet bi gui request
        # cho hanh dong KHAC tren CUNG trang (vd xoa Bandwidth Control chi dua vao
        # delnum, khong dong QOS_Flag) â€” neu khop don thuan theo "co" se cuop mat
        # nhanh delnum ben duoi. Phat hien 2026-08-22 qua bai kiem O4d.
        {"kieu": "co_va_truong", "ten": "QOS_Flag", "gia_tri": "0", "truong_bat_buoc": "QosRuleIndex", "ham": _luu_qos_rule},
        {"kieu": "co", "ten": "QOS_Flag", "gia_tri": "5", "ham": _them_dong_qos_bw},
        {"kieu": "co_va_truong", "ten": "QOS_Flag", "gia_tri": "2", "truong_bat_buoc": "QosRuleIndex", "ham": _xoa_qos_rule},
        {"kieu": "delnum", "ham": _xoa_dong_qos_bw},
    ],
    "/cgi-bin/adv_routing_table.asp": [
        {"kieu": "co", "ten": "EditFlag", "gia_tri": "1", "ham": _them_dong_route},
        {"kieu": "delnum", "ham": _xoa_dong_route},
    ],
}


def ghi_tu_form(duong_dan, truong):
    """
    Luu cac truong form vao kho cau hinh.
    `truong` la dict {ten: gia_tri} da giai ma tu body urlencoded.
    """
    cfg = BANG_GHI[duong_dan]
    goc = cfg["khoa_goc"]
    hien_co = kho.doc(goc) or {}

    da_ghi, bo_qua = 0, []
    for ten, gt in truong.items():
        if ten in hien_co:
            kho.ghi(f"{goc}.{ten}", gt)
            da_ghi += 1
        else:
            bo_qua.append(ten)

    if bo_qua:
        print(f"  [ghi_tu_form] {duong_dan}: bo qua {len(bo_qua)} truong khong "
              f"co trong kho: {', '.join(bo_qua[:8])}"
              + (" ..." if len(bo_qua) > 8 else ""))

    for luat in BANG_GHI_BANG.get(duong_dan, []):
        if luat["kieu"] == "co":
            khop = truong.get(luat["ten"]) == luat["gia_tri"]
        elif luat["kieu"] == "co_va_truong":
            # Giong "co" nhung CON doi hoi 1 truong khac PHAI co mat (khong
            # rong) â€” dung khi gia tri co trung voi gia tri MAC DINH cua no
            # luc thiet bi gui request cho hanh dong KHAC tren cung trang
            # (xem chu thich o BANG_GHI_BANG, vd QOS_Flag=0).
            khop = (truong.get(luat["ten"]) == luat["gia_tri"]
                    and bool(truong.get(luat["truong_bat_buoc"])))
        else:
            khop = bool(truong.get("delnum"))
        if khop:
            luat["ham"](goc, truong)
            da_ghi += 1
            mo_ta = f"{luat['ten']}={luat['gia_tri']}" if luat["kieu"] == "co" else f"delnum={truong.get('delnum')}"
            print(f"  [ghi_tu_form] {duong_dan}: da chay hanh dong bang ({mo_ta})")
            break

    return da_ghi, bo_qua


# --------------------------------------------------------------------------
# Bang dieu phoi: duong dan  ->  ham bom
# --------------------------------------------------------------------------
BANG_BOM = {
    # Status
    "/cgi-bin/status_deviceinfo.asp": bom_status_deviceinfo,
    "/cgi-bin/status_statistics.asp": bom_status_statistics,
    "/cgi-bin/EthernetStatus.asp": bom_ethernet_status,
    "/cgi-bin/devicetable.asp": bom_devicetable,
    "/cgi-bin/wirelessSignal.asp": bom_wireless_signal,
    "/cgi-bin/status_log.cgi": bom_status_log,

    # Network
    "/cgi-bin/home_lan.asp": bom_home_lan,
    "/cgi-bin/home_wireless.asp": bom_home_wireless,
    "/cgi-bin/home_wireless_5g.asp": bom_home_wireless_5g,
    "/cgi-bin/home_wan.asp": bom_home_wan,

    # Maintenance
    "/cgi-bin/tools_time.asp": bom_tools_time,
    "/cgi-bin/tools_admin.asp": bom_tools_admin,
    "/cgi-bin/tools_wifitimer.asp": bom_tools_wifitimer,
    "/cgi-bin/tools_reboottimer.asp": bom_tools_reboottimer,

    # Access
    "/cgi-bin/access_upnp.asp": bom_access_upnp,
    "/cgi-bin/access_ddns.asp": bom_access_ddns,
    "/cgi-bin/access_auth.asp": bom_access_auth,
    "/cgi-bin/access_parentalControl.asp": bom_access_parentalControl,

    # Advanced
    "/cgi-bin/adv_firewall.asp": bom_adv_firewall,
    "/cgi-bin/adv_nat_alg_switch.asp": bom_adv_nat_alg_switch,
    "/cgi-bin/adv_nat_top.asp": bom_adv_nat_top,
    "/cgi-bin/adv_nat_top_VirtualServer.asp": bom_adv_nat_top,  # cung 1 trang, chi khac tab dang mo (xem BANG_GHI)
    "/cgi-bin/adv_nat_top_PortTriggering.asp": bom_adv_nat_top,  # cung 1 trang, chi khac tab dang mo (xem BANG_GHI)
    "/cgi-bin/adv_qos.asp": bom_adv_qos,
    "/cgi-bin/adv_routing_table.asp": bom_adv_routing_table,
}


def co_bom(duong_dan):
    return duong_dan in BANG_BOM


def bom(duong_dan, html):
    return BANG_BOM[duong_dan](html)


