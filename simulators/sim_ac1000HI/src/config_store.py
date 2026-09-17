#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
KHO CAU HINH TRUNG TAM — ONT AC1000HI
======================================
Dong vai tro NVRAM cua thiet bi that (muc 2.5 CLAUDE.md goc).

MOI trang doc/ghi qua day, KHONG trang nao duoc hardcode gia tri rieng.
Sua o trang A thi trang B phai thay doi theo — day la nen mong cho viec
gia lap firmware sau nay.

GIA TRI MAC DINH (seed) lay TU THIET BI THAT, do ngay 2026-08-22:
  - Cac muc doc tu cac trang trong reference/html/*.asp.html
  - Khong bia bat ky gia tri nao; giu dung hop dong thiet bi.

Cach dung:
    import config_store as kho
    kho.doc("device.model")            -> "Internet Hub AC1000HI"
    kho.ghi("device.hostname", "abc")
    kho.dat_lai_factory()              -> ve dung seed ban dau
"""
import copy
import json
import os
import threading
import time

_HERE = os.path.dirname(os.path.abspath(__file__))
DUONG_DAN_STATE = os.path.join(_HERE, "state.json")

_khoa = threading.RLock()
_SESSION_CTX = threading.local()
ACTIVE_SESSIONS = {}
USER_STATES = {}


def dat_phien_hien_tai(session_id):
    """Ghi nho session_id cua thread hien tai de doc/ghi state phan lap."""
    _SESSION_CTX.sid = session_id


def lay_phien_hien_tai():
    return getattr(_SESSION_CTX, "sid", None)



# --------------------------------------------------------------------------
# SEED — do that tren thiet bi 2026-08-22
# --------------------------------------------------------------------------
SEED = {
    # ---- Trang Status > Device Info (/cgi-bin/status_deviceinfo.asp) ----
    "device": {
        "working_mode": "HGU",
        "serial_number": "FPTH22800025",
        "model": "Internet Hub AC1000HI",
        "software_version": "FT5.01.052e",
        "hardware_version": "V1.0",
        "up_time": "0 Days 0 Hours 22 Minutes",
        "ram_size": "238",
        "mem_usage": "21%",
        "cpu_usage": "2.87%(all); 1.25%(0); 7.74%(1); 2.30%(2); 0.18%(3)",
        "nat_session": "22",
        "mac_address": "10:39:4E:BF:EA:40",
    },
    "gpon": {
        "link_status": "down",
        "onu_state": "O1",
    },

    # ---- Tai khoan dang nhap ----
    # Thiet bi that KHONG cho doc mat khau ra ngoai. Ban gia lap dung cap
    # admin/admin de hoc vien dang nhap duoc; day KHONG phai mat khau that
    # cua thiet bi va duoc ghi ro trong tai lieu.
    "auth": {
        "username": "admin",
        "password": "admin",
        "login_times": "0",     # so lan go sai — trang login that nhung '0'
        "lock_cnt": "0",        # so lan bi khoa    — trang login that nhung '0'
    },

    # ---- Phien dang nhap (dong vai tro bang phien trong RAM cua firmware) ----
    "session": {
        "id_hien_tai": None,    # dat khi dang nhap thanh cong
    },

    # ---- Ngon ngu tren thanh header (o chon English/Vietnamese) ----
    "ui": {
        "language": "English",
    },

    # ======================================================================
    # NHOM STATUS — 5 trang con lai, seed do that 2026-08-22
    # ======================================================================

    # ---- Status > Statistics (/cgi-bin/status_statistics.asp) ----
    "statistics": {
        "transmit_frames": "20726",
        "transmit_multicast_frames": "3608",
        "transmit_total_bytes": "16883825",
        "transmit_collision": "0",
        "transmit_error_frames": "0",
        "receive_frames": "11701",
        "receive_multicast_frame": "564",
        "receive_total_bytes": "2685573",
        "receive_crc_errors": "0",
        "receive_under_size_frames": "0",
    },

    # ---- Status > Ethernet Status (/cgi-bin/EthernetStatus.asp) ----
    "ethernet_ports": [
        {"port": "1", "admin_state": "up",   "speed": "100", "sent": "20666", "received": "11661"},
        {"port": "2", "admin_state": "down", "speed": "0",   "sent": "0",     "received": "0"},
        {"port": "3", "admin_state": "down", "speed": "0",   "sent": "0",     "received": "0"},
        {"port": "4", "admin_state": "down", "speed": "0",   "sent": "0",     "received": "0"},
    ],

    # ---- Status > Device Table (/cgi-bin/devicetable.asp) ----
    "device_table": [
        {"ten": "Admin-PC", "ip": "192.168.1.2", "mac": "D8:43:AE:2E:65:45",
         "loai": "Ethernet", "ngay": "0", "gio": "23:31:13"},
    ],
    "device_table_so_dong": 4,

    # ---- Status > Wireless Signal (/cgi-bin/wirelessSignal.asp) ----
    "wireless_clients": [],
    "wireless_so_dong": 12,

    # ---- Status > System Log (/cgi-bin/status_log.cgi) ----
    "status_log": {
        "log_text": None,  # None = su dung log goc tu file
    },

    # ======================================================================
    # NHOM NETWORK
    # ======================================================================

    # ---- Network > LAN (/cgi-bin/home_lan.asp) ----
    "lan": {
        "uiViewIPAddr": "192.168.1.1",       # IP Address cua LAN
        "uiViewNetMask": "255.255.255.0",    # IP Subnet Mask
        "uiViewAliasIPAddr": "0.0.0.0",      # Alias IP (0.0.0.0 = tat)
        "StartIp": "192.168.1.2",            # DHCP: dia chi bat dau
        "PoolSize": "253",                   # DHCP: so dia chi trong dai
        "dhcp_LeaseTime": "86400",           # DHCP: thoi gian thue (giay)
        "dnsTypeRadio": "0",                 # 0 = Automatically, 1 = Manually
        "uiValidLifetimeRadvd": "7200",      # IPv6 RADVD valid lifetime
        "orgIP": "192.168.1.1",
        "tmpStartIp": "192.168.1.2",
        "tmpPoolCount": "253",
    },
    "dhcp_leases": [
        {"ten": "Admin-PC", "ip": "192.168.1.2", "mac": "D8:43:AE:2E:65:45",
         "ngay": "0", "gio": "23:31:11"},
    ],

    # ---- Network > Wireless 2.4G (/cgi-bin/home_wireless.asp) ----
    "home_wireless": {
        "wlan_APenable": "1",
        "WirelessMode": "9",
        "TxPower": "100",
        "WLANChannelBandwidth": "0",
        "WLANExtensionChannel": "1",
        "WLANGuardInterval": "0",
        "WLANMCS": "33",
        "SSID_INDEX": "0",
        "ESSID": "FPT",
        "ESSID_Enable_Selection": "1",
        "ESSID_HIDE_Selection": "0",
        "multicastState": "1",
        "WMM_Selection": "0",
        "UseWPS_Selection": "1",
        "WPSMode_Selection": "1",
        "WEP_Selection": "WPAPSKWPA2PSK",
        "WEP_TypeSelection1": "WEPAuto",
        "WEP_TypeSelection2": "WEPAuto",
        "TKIP_Selection4": "AES",
        "TKIP_Selection5": "AES",
        "TKIP_Selection6": "AES",
        "PreSharedKey1": "22800025",
        "PreSharedKey2": "22800025",
        "PreSharedKey3": "22800025",
        "WLAN_FltActive": "0",
        "TxStream_Action": "2",
        "RxStream_Action": "2",
        "CurrentChannel": "1",
        "BeaconInterval": "100",
        "RTSThreshold": "2347",
        "FragmentThreshold": "2346",
        "DTIM": "1",
        "maxStaNum": "31",
    },

    # ---- Network > Wireless 5G (/cgi-bin/home_wireless_5g.asp) ----
    "home_wireless_5g": {
        "wlan_APenable": "1",
        "WirelessMode": "14",
        "TxPower": "100",
        "WLANChannelBandwidth": "1",
        "WLANExtensionChannel": "1",
        "WLANGuardInterval": "0",
        "WLan11acVHTChannelBandwidth": "1",
        "WLan11acVHTGuardInterval": "0",
        "SSID_INDEX": "0",
        "ESSID": "FPT",
        "ESSID_Enable_Selection": "1",
        "ESSID_HIDE_Selection": "0",
        "multicastState": "1",
        "WMM_Selection": "1",
        "UseWPS_Selection": "1",
        "WPSMode_Selection": "1",
        "WEP_Selection": "WPAPSKWPA2PSK",
        "WEP_TypeSelection1": "WEPAuto",
        "WEP_TypeSelection2": "WEPAuto",
        "TKIP_Selection4": "AES",
        "TKIP_Selection5": "AES",
        "TKIP_Selection6": "AES",
        "PreSharedKey1": "22800025",
        "PreSharedKey2": "22800025",
        "PreSharedKey3": "22800025",
        "WLAN_FltActive": "0",
        "TxStream_Action": "2",
        "RxStream_Action": "2",
        "CurrentChannel": "36",
        "BeaconInterval": "100",
        "RTSThreshold": "2347",
        "FragmentThreshold": "2346",
        "DTIM": "1",
        "maxStaNum": "31",
    },

    # ---- Network > Internet / WAN (/cgi-bin/home_wan.asp) ----
    "home_wan": {
        "wan_TransMode": "Fiber",
        "wan_VC": "0",
        "wan_VCStatus": "Yes",
        "ipVerRadio": "IPv4/IPv6",
        "wanTypeRadio": "2",  # PPPoE
        "wan_dot1q": "No",
        "wan_vid": "0",
        "wan_8021q": "1",
        "disp_wan_8021q": "1",
        "wan_NAT": "Enable",
        "wan_NAT0": "Enable",
        "wan_NAT1": "Enable",
        "wan_NAT2": "Enable",
        "wan_RIP0": "RIP1",
        "wan_RIP1": "RIP1",
        "wan_RIP2": "RIP1",
        "wan_RIP_Dir0": "None",
        "wan_RIP_Dir1": "None",
        "wan_RIP_Dir2": "None",
        "wan_ConnectSelect": "Connect_Keep_Alive",
        "wan_PPPUsername": "fpt",
        "wan_PPPPassword": "fpt",
        "wan_PPPGetIP": "Dynamic",
        "dnsTypeRadio": "0",
        "WAN_DefaultRoute0": "Yes",
        "WAN_DefaultRoute1": "Yes",
        "WAN_DefaultRoute2": "Yes",
        "wan_IGMP0": "Yes",
        "wan_IGMP1": "Yes",
        "wan_IGMP2": "Yes",
        "wan_MLD0": "Yes",
        "wan_MLD1": "Yes",
        "wan_MLD2": "Yes",
        "wan_IPTV": "Yes",
        "wan_ipv6_IPTV": "Yes",
        "DynIPv6EnableRadio": "1",
        "PPPIPv6PDRadio0": "Yes",
        "PPPIPv6PDRadio2": "Yes",
        "PPPIPv6ModeRadio": "0",
        "DSLITEEnableRadio0": "No",
        "DSLITEEnableRadio1": "No",
        "DSLITEEnableRadio2": "No",
        "DSLITEModeRadio0": "0",
        "DSLITEModeRadio2": "0",
        "pppoe_relay": "No",
        "EDNSMode": "No",
        "wan_BridgeInterface0": "No",
        "wan_BridgeInterface1": "No",
        "wan_BridgeInterface2": "No",
        "DefaultWan_Active": "No",
        "DefaultWan_ISP": "3",
        "DefaultWan_IPVERSION": "IPv4",
        "DefaultDmz_Active": "No",
        "DefaultDmz_HostIP": "0.0.0.0",
    },

    # ======================================================================
    # NHOM MAINTENANCE
    # ======================================================================

    # ---- Maintenance > Time Zone (/cgi-bin/tools_time.asp) ----
    "tools_time": {
        "uiViewdateToolsTZ": "GMT+07:00",
        "uiViewSNTPServer": "vn.pool.ntp.org",
        "uiViewSNTPServer2": "asia.pool.ntp.org",
        "uiTimezoneType": "0",
        "uiViewSyncWith": "0",
        "uiViewdateDS": "Disable",
        "ntp2ServerFlag": "Yes",
        "ntp3ServerFlag": "N/A",
        "SaveTime": "1",
        "ToolsTimeSetFlag": "0",
        "uiRadioValue": "0",
        "uiClearPCSyncFlag": "0",
    },

    # ---- Maintenance > Administration (/cgi-bin/tools_admin.asp) ----
    "tools_admin": {
        "adminFlag": "0",
        "CurrentAccess": "0",
        "OrgPwd": "admin",
        "isPwdChanged": "0",
        "uiViewTools_Password": "",
        "uiViewTools_PasswordConfirm": "",
    },

    # ---- Maintenance > WiFi Timer (/cgi-bin/tools_wifitimer.asp) ----
    "tools_wifitimer": {
        "wifitimer_enable": "0",
        "starttime": "00",
        "endtime": "00",
        "mon": "0", "tue": "0", "wed": "0", "thu": "0", "fri": "0", "sat": "0", "sun": "0",
        "mon_value": "0", "tue_value": "0", "wed_value": "0", "thu_value": "0", "fri_value": "0", "sat_value": "0", "sun_value": "0",
        "saveFlag": "0",
    },

    # ---- Maintenance > Reboot Timer (/cgi-bin/tools_reboottimer.asp) ----
    "tools_reboottimer": {
        "reboottimer_enable": "0",
        "time": "00",
        "mon": "0", "tue": "0", "wed": "0", "thu": "0", "fri": "0", "sat": "0", "sun": "0",
        "mon_value": "0", "tue_value": "0", "wed_value": "0", "thu_value": "0", "fri_value": "0", "sat_value": "0", "sun_value": "0",
        "saveFlag": "0",
    },

    # ======================================================================
    # NHOM ACCESS
    # ======================================================================

    # ---- Access > UPnP (/cgi-bin/access_upnp.asp) ----
    "access_upnp": {
        "UPnP_active": "Yes",
        "UPnP_auto": "1",
        "SaveFlag": "0",
    },

    # ---- Access > DDNS (/cgi-bin/access_ddns.asp) ----
    "access_ddns": {
        "Enable_DyDNS": "No",
        "ddns_ServerName": "dyndns.org",
        "sysDNSHost": "",
        "sysDNSUser": "",
        "sysDNSPassword": "",
        "Enable_Wildcard": "No",
        "SaveFlag": "0",
    },

    # ---- Access > Auth (/cgi-bin/access_auth.asp) ----
    "access_auth": {
        "Auth_LOID": "mtk1111",
        "Auth_Password": "1111",
        "Auth_SN": "FPTH22800025",
        "Auth_PSW": "00000001",
        "AuthFlag": "0",
    },

    # ---- Access > Parental Control (/cgi-bin/access_parentalControl.asp) ----
    "access_parentalControl": {
        "url_mode_select": "0",
        "addURLNum": "0",
        "addTimerNum": "0",
        "url_filters": [],
        "mac_filters": [],
    },

    # ======================================================================
    # NHOM ADVANCED
    # ======================================================================

    # ---- Advanced > Firewall (/cgi-bin/adv_firewall.asp) ----
    "adv_firewall": {
        "firewallEnable": "0",
        "spiEnable": "0",
        "saveAccessflag": "0",
        "wanAccessLanWebRadio": "Disable",
        "telnetradio": "0",
        "sshradio": "Disable",
    },

    # ---- Advanced > ALG Switch (/cgi-bin/adv_nat_alg_switch.asp) ----
    "adv_nat_alg_switch": {
        "algFlag": "0",
        "rtsp_active": "on",
        "l2tp_active": "on",
        "pptp_active": "on",
        "ipsec_active": "on",
        "sip_active": "on",
        "h323_active": "on",
        "ftp_active": "on",
    },

    # ---- Advanced > NAT (/cgi-bin/adv_nat_top.asp) ----
    "adv_nat_top": {
        "natFlag": "1",
        "NATtyleChange": "1",
        "dmz_active": "No",
        "dmzHostIP": "",  # SUA 2026-08-22: ten cu "DMZ_Host_IP" SAI — form that dung name="dmzHostIP"
                          # (chu thuong), khong khop nen vong lap ghi scalar chung CHUA BAO GIO luu
                          # duoc truong nay, du STATUS.md tung ghi nham "muc 4". Xem ISSUES.md.
        "service_num_flag": "0",
        "dmzFlag": "0",
        "saveFlag": "0",
        "dmzdeactive": "No",
        "dmz_remove": "0",
        # virtual_servers/port_triggers: MANG 32/8 O CO DINH (khong phai list noi duoi) — HAR
        # adv_table_actions_2.har xac nhan them = dien vao o TRONG dau tien, xoa = tra dung o do ve
        # trong (None), KHONG don cac o con lai. None = "N/A" (o trong).
        "virtual_servers": [None] * 32,
        "port_triggers": [None] * 8,
    },

    # ---- Advanced > QoS (/cgi-bin/adv_qos.asp) ----
    "adv_qos": {
        "Qos_active": "No",
        "Qosdrop": "WRED",
        "Qosdiscipline": "WRR",
        "qoSOptType": "N/A",
        "QosWRRweight1": "8",
        "QosWRRweight2": "4",
        "QosWRRweight3": "2",
        "QosWRRweight4": "1",
        "addNum": "0",
        # 10 o co dinh (khong phai list noi duoi) — cung co che voi virtual_servers, xac nhan bang
        # adv_table_actions_2.har (them = dien o trong dau tien).
        "qos_rules": [None] * 10,
        # QOS Rule / Mapping Rule — xac nhan bang adv_qos_rule.har (2026-08-22, anh Huynn chup
        # theo huong dan rieng). "QosRuleIndex" la CON TRO dang xem (0-15), ten TRUNG voi field
        # that trong form nen duoc vong lap scalar chung tu dong ghi lai moi khi POST co mang
        # theo (moi request tren trang deu mang truong nay TRU khi khoi QOS Rule dang bi JS
        # disable — xem doDisableRule/fromSumToDeact trong JS goc). 16 o LUU RIENG THEO INDEX,
        # KHONG phai 1 o dung chung — xac nhan tan mat: Add o index 0 (Active=Yes, App=IGMP,
        # Dest 192.168.1.100/32, Src 192.168.1.50/32, port 80-80, Protocol=TCP, Queue=High) roi
        # doi dropdown sang 1 (rong/mac dinh) roi quay lai 0 — response tra DUNG lai du lieu da
        # luu o 0, khong bi mat. Delete (QOS_Flag=2) tra o do ve mac dinh (Active=No).
        "QosRuleIndex": "0",
        "qos_mapping_rules": [None] * 16,
    },

    # ---- Advanced > Routing (/cgi-bin/adv_routing_table.asp) ----
    "adv_routing_table": {
        "Route_PVC_Index": "0",
        "Route_num": "3",
        "user_def_num": "0",
        "add_num": "0",
        "User_def": "1",
        "RouteActive": "Yes",
        "static_routes": [
            {"dest": "192.168.1.0", "mask": "255.255.255.0", "gateway": "0.0.0.0", "interface": "br0", "metric": "0"},
            {"dest": "127.0.0.0", "mask": "255.255.0.0", "gateway": "0.0.0.0", "interface": "lo", "metric": "0"},  # SUA 2026-08-22: doc lai tan mat reference/html/adv_routing_table.asp.html dong 622-624 — ban ghi truoc do "255.0.0.0" la SAI, phat hien qua phep kiem doi byte O4e
            {"dest": "239.0.0.0", "mask": "255.0.0.0", "gateway": "0.0.0.0", "interface": "br0", "metric": "0"},  # xac nhan tan mat: reference/html/adv_routing_table.asp.html dong 639-641
        ],
    },
}


_state = None
_mtime = 0.0            # thoi diem sua file state.json ma ta da nap


def _nap(sid=None):
    """
    Nap kho tu dia hoac lay tu USER_STATES cua phien hien tai.
    """
    if sid is None:
        sid = lay_phien_hien_tai()
    if sid and sid in USER_STATES:
        return USER_STATES[sid]

    global _state, _mtime
    try:
        m = os.path.getmtime(DUONG_DAN_STATE)
    except OSError:
        m = 0.0
    if _state is not None and m == _mtime:
        return _state
    if m:
        try:
            with open(DUONG_DAN_STATE, encoding="utf-8") as f:
                cu = json.load(f)
            # BO SUNG KHOA MOI tu SEED vao state cu.
            if _bo_sung_khoa_thieu(cu, SEED):
                _state = cu
                _luu()
            else:
                _state = cu
                _mtime = m
            return _state
        except (OSError, ValueError):
            pass
    _state = copy.deepcopy(SEED)
    _luu()
    return _state


def _bo_sung_khoa_thieu(dich, mau):
    """Them cac khoa co trong `mau` ma `dich` chua co. Tra True neu co them."""
    co_them = False
    for k, v in mau.items():
        if k not in dich:
            dich[k] = copy.deepcopy(v)
            co_them = True
        elif isinstance(v, dict) and isinstance(dich.get(k), dict):
            if _bo_sung_khoa_thieu(dich[k], v):
                co_them = True
    return co_them


def _luu():
    global _mtime
    try:
        with open(DUONG_DAN_STATE, "w", encoding="utf-8") as f:
            json.dump(_state, f, ensure_ascii=False, indent=2)
        _mtime = os.path.getmtime(DUONG_DAN_STATE)
    except OSError:
        pass


def doc(duong_dan_khoa, mac_dinh=None, sid=None):
    """doc('device.model') -> gia tri, hoac mac_dinh neu khong co."""
    with _khoa:
        cur = _nap(sid=sid)
        for phan in duong_dan_khoa.split("."):
            if not isinstance(cur, dict) or phan not in cur:
                return mac_dinh
            cur = cur[phan]
        return cur


def ghi(duong_dan_khoa, gia_tri, sid=None):
    """ghi('device.hostname', 'x') — tao nhanh trung gian neu chua co."""
    with _khoa:
        s = sid or lay_phien_hien_tai()
        cur = _nap(sid=s)
        phan = duong_dan_khoa.split(".")
        for p in phan[:-1]:
            if p not in cur or not isinstance(cur[p], dict):
                cur[p] = {}
            cur = cur[p]
        cur[phan[-1]] = gia_tri
        if not s or s not in USER_STATES:
            _luu()
        return gia_tri


def tat_ca(sid=None):
    with _khoa:
        return copy.deepcopy(_nap(sid=sid))


def dat_lai_factory(sid=None):
    """Dua kho ve dung seed ban dau (dung khi day hoc xong mot buoi)."""
    global _state
    with _khoa:
        s = sid or lay_phien_hien_tai()
        if s and s in USER_STATES:
            USER_STATES[s] = copy.deepcopy(SEED)
            USER_STATES[s].setdefault("session", {})["id_hien_tai"] = s
            return USER_STATES[s]
        _state = copy.deepcopy(SEED)
        _luu()
        return _state


# --------------------------------------------------------------------------
# Phien dang nhap (Multi-session ho tro nhieu KTV hoc cung luc)
# --------------------------------------------------------------------------
def kiem_tra_dang_nhap(uid, psw):
    """Tra True neu dung cap tai khoan trong kho."""
    return uid == doc("auth.username") and psw == doc("auth.password")


def mo_phien(session_id):
    with _khoa:
        ACTIVE_SESSIONS[session_id] = {
            "created_at": time.time(),
            "last_seen": time.time(),
        }
        base = _nap(sid=None)
        USER_STATES[session_id] = copy.deepcopy(base)
        USER_STATES[session_id].setdefault("session", {})["id_hien_tai"] = session_id
        return session_id


def phien_hop_le(session_id):
    if not session_id:
        return False
    with _khoa:
        if session_id in ACTIVE_SESSIONS:
            ACTIVE_SESSIONS[session_id]["last_seen"] = time.time()
            return True
        return session_id == (_state.get("session", {}).get("id_hien_tai") if _state else None)


def dong_phien(session_id=None):
    with _khoa:
        s = session_id or lay_phien_hien_tai()
        if s:
            ACTIVE_SESSIONS.pop(s, None)
            USER_STATES.pop(s, None)
            if _state and _state.get("session", {}).get("id_hien_tai") == s:
                _state["session"]["id_hien_tai"] = None
        else:
            ACTIVE_SESSIONS.clear()
            USER_STATES.clear()
            if _state and "session" in _state:
                _state["session"]["id_hien_tai"] = None

