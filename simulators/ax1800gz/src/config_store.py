#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
KHO CAU HINH TRUNG TAM — ONT AX1800GZ (ZTE F6600)
================================================
Nguyen tac (CLAUDE.md muc 2.5):
  Moi trang doc va ghi thong qua MOT kho cau hinh duy nhat.
  Ho tro co lap phien theo tung KTV (X-KTV-Session-ID / ktv_client_id) trong RAM.
"""
import copy
import json
import os
import threading
import time

_HERE = os.path.dirname(os.path.abspath(__file__))
TEP_LUU_MAC_DINH = os.path.join(_HERE, "config.json")
_KHO_LOCK = threading.RLock()
_KHO_CTX = threading.local()
_KHO_TTL_SECONDS = 1800
_MAX_KTV_SESSIONS = 3500

CAU_HINH_GOC = {
    "auth": {
        "admin": "admin"
    },
    "system": {
        "model": "F6600",
        "software_ver": "V9.0.11P2N15B",
        "hardware_ver": "V1.0",
        "serial": "ZTEGD1E1C72A",
        "oui": "C42728",
        "ver_date": "2024-03-20 09:50:01"
    },
    "wan_instances": [
        {
            "_InstID": "IGD.WD1.WCD1.WCPPP1",
            "WANCName": "internet_tr069",
            "Enable": "1",
            "mode": "route",
            "ServList": "3",
            "StrServList": "INTERNET_TR069",
            "linkMode": "PPP",
            "TransType": "PPPoE",
            "wantype": "pppoe",
            "uplink": "2",
            "pageType": "0",
            "MTU": "1492",
            "UserName": "",
            "Password": "",
            "AuthType": "PAP,CHAP,MS-CHAP",
            "ConnTrigger": "AlwaysOn",
            "IpMode": "IPv4",
            "IsNAT": "1",
            "VlanEnable": "0",
            "VLANID": "0",
            "Priority": "0",
            "IsDefGW": "1",
            "IsPD": "1",
            "IsSLAAC": "1",
            "IsGUA": "0",
            "IsPdAddr": "1",
            "IPv6AcquireMode": "Auto",
            "Unnumbered": "0",
            "EchoTime": "30",
            "EchoRetry": "3"
        }
    ],
    "lan": {
        "ip": "192.168.1.1",
        "mask": "255.255.255.0",
        "dhcp_enable": "1",
        "dhcp_start": "192.168.1.2",
        "dhcp_end": "192.168.1.254",
        "lease_time": "86400",
        "dns_source": "0",
        "dns1": "192.168.1.1",
        "dns2": "0.0.0.0"
    },
    "wlan24": {
        "enable": "1",
        "ssid": "FPT_AX1800GZ_2.4G",
        "hide": "0",
        "security": "WPA2-PSK-AES",
        "password": "fpttelecom@2026",
        "beacon_type": "11i",
        "auth_11i": "PSKAuthentication",
        "encrypt_11i": "AESEncryption",
        "auth_wpa": "PSKAuthentication",
        "encrypt_wpa": "AESEncryption",
        "auth_wpa3": "SAEAuthentication",
        "encrypt_wpa3": "AESEncryption"
    },
    "wlan24_ssid4": {
        "enable": "0",
        "ssid": "SSID4",
        "hide": "0",
        "security": "WPA2-PSK-AES",
        "password": "fpttelecom@2026",
        "beacon_type": "11i",
        "auth_11i": "PSKAuthentication",
        "encrypt_11i": "AESEncryption",
        "auth_wpa": "PSKAuthentication",
        "encrypt_wpa": "TKIPandAESEncryption",
        "auth_wpa3": "SAEAuthentication",
        "encrypt_wpa3": "AESEncryption"
    },
    "wlan24_ssid2": {
        "enable": "0",
        "ssid": "SSID2",
        "hide": "0",
        "security": "WPA2-PSK-AES",
        "password": "fpttelecom@2026",
        "beacon_type": "11i",
        "auth_11i": "PSKAuthentication",
        "encrypt_11i": "AESEncryption",
        "auth_wpa": "PSKAuthentication",
        "encrypt_wpa": "TKIPandAESEncryption",
        "auth_wpa3": "SAEAuthentication",
        "encrypt_wpa3": "AESEncryption"
    },
    "wlan5": {
        "enable": "1",
        "ssid": "FPT_AX1800GZ_5G",
        "hide": "0",
        "security": "WPA2-PSK-AES",
        "password": "fpttelecom@2026",
        "beacon_type": "11i",
        "auth_11i": "PSKAuthentication",
        "encrypt_11i": "AESEncryption",
        "auth_wpa": "PSKAuthentication",
        "encrypt_wpa": "AESEncryption",
        "auth_wpa3": "SAEAuthentication",
        "encrypt_wpa3": "AESEncryption"
    },
    "dmz": {
        "enable": "0",
        "ip": "192.168.1.100"
    },
    "port_forwarding": [],
    "firewall": {
        "level": "High",
        "anti_attack": "1"
    }
}


class KhoCauHinh:
    def __init__(self, tep_luu=TEP_LUU_MAC_DINH):
        self.tep_luu = tep_luu
        self._khoa = _KHO_LOCK
        self._kho_theo_ktv = {}
        self._last_seen = {}
        self._mau_goc = {}
        self.nap()

    def _nap_mau_goc(self):
        base = copy.deepcopy(CAU_HINH_GOC)
        if os.path.exists(self.tep_luu):
            try:
                with open(self.tep_luu, "r", encoding="utf-8") as f:
                    loaded = json.load(f)
                if isinstance(loaded, dict):
                    for k, v in loaded.items():
                        if isinstance(v, dict) and isinstance(base.get(k), dict):
                            base[k].update(copy.deepcopy(v))
                        else:
                            base[k] = copy.deepcopy(v)
            except Exception:
                pass
        self._mau_goc = base

    def bind(self, key):
        """Gắn phiên KTV hiện tại vào ngữ cảnh luồng."""
        _KHO_CTX.key = key or "default"
        return self.current_key()

    def current_key(self):
        return getattr(_KHO_CTX, "key", "default")

    def _don_phien_cu_unlocked(self, now):
        stale = [
            k for k, ts in list(self._last_seen.items())
            if k != "default" and (now - ts) > _KHO_TTL_SECONDS
        ]
        for k in stale:
            self._kho_theo_ktv.pop(k, None)
            self._last_seen.pop(k, None)
        if len(self._kho_theo_ktv) > _MAX_KTV_SESSIONS:
            sap_xep = sorted(
                ((k, ts) for k, ts in self._last_seen.items() if k != "default"),
                key=lambda x: x[1],
            )
            so_can_xoa = max(0, len(self._kho_theo_ktv) - _MAX_KTV_SESSIONS)
            for k, _ in sap_xep[:so_can_xoa]:
                self._kho_theo_ktv.pop(k, None)
                self._last_seen.pop(k, None)

    def _lay_du_lieu_ktv(self, key=None):
        session_key = key or self.current_key()
        now = time.time()
        with self._khoa:
            self._don_phien_cu_unlocked(now)
            if session_key not in self._kho_theo_ktv:
                self._kho_theo_ktv[session_key] = copy.deepcopy(self._mau_goc)
            self._last_seen[session_key] = now
            return self._kho_theo_ktv[session_key]

    @property
    def du_lieu(self):
        return self._lay_du_lieu_ktv()

    @du_lieu.setter
    def du_lieu(self, val):
        session_key = self.current_key()
        with self._khoa:
            self._kho_theo_ktv[session_key] = val
            self._last_seen[session_key] = time.time()

    def nap(self):
        with self._khoa:
            self._nap_mau_goc()
            session_key = self.current_key()
            self._kho_theo_ktv[session_key] = copy.deepcopy(self._mau_goc)
            self._last_seen[session_key] = time.time()

    def dat_lai(self, key=None):
        session_key = key or self.current_key()
        with self._khoa:
            self._kho_theo_ktv[session_key] = copy.deepcopy(self._mau_goc)
            self._last_seen[session_key] = time.time()

    def xoa_phien(self, key=None):
        session_key = key or self.current_key()
        with self._khoa:
            self._kho_theo_ktv.pop(session_key, None)
            self._last_seen.pop(session_key, None)

    def khoi_phuc_xuat_xuong(self, key=None):
        self.dat_lai(key=key)

    def luu(self):
        # Giữ tương thích ngược, trạng thái KTV được cô lập trên RAM
        pass

    def doc(self, duong_dan, mac_dinh=None, key=None):
        session_key = key or self.current_key()
        with self._khoa:
            khoang = self._lay_du_lieu_ktv(session_key)
            cac_khoa = duong_dan.split(".")
            for k in cac_khoa:
                if isinstance(khoang, dict) and k in khoang:
                    khoang = khoang[k]
                else:
                    return mac_dinh
            return copy.deepcopy(khoang) if isinstance(khoang, (dict, list)) else khoang

    def ghi(self, duong_dan, gia_tri, key=None):
        session_key = key or self.current_key()
        with self._khoa:
            khoang = self._lay_du_lieu_ktv(session_key)
            cac_khoa = duong_dan.split(".")
            for k in cac_khoa[:-1]:
                if k not in khoang or not isinstance(khoang[k], dict):
                    khoang[k] = {}
                khoang = khoang[k]
            khoang[cac_khoa[-1]] = copy.deepcopy(gia_tri) if isinstance(gia_tri, (dict, list)) else gia_tri


KHO = KhoCauHinh()
