#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
KHO CAU HINH TRUNG TAM — INTERNET HUB AC1000CV2
==============================================
Nguyen tac 2.5:
  Moi trang doc va ghi thong qua MOT kho cau hinh duy nhat.
  Luu ben vung ra dia (config.json) de song qua cac lan khoi dong lai.
"""
import os
import json

_HERE = os.path.dirname(os.path.abspath(__file__))
TEP_LUU_MAC_DINH = os.path.join(_HERE, "config.json")

# Cau hinh goc ban dau do duoc tu thiet bi that
CAU_HINH_GOC = {
    "auth": {
        "admin": "admin"
    },
    "system": {
        "dev_name": "G-97RG6W",
        "dev_id": "FPTT19a0107e",
        "hw_ver": "01",
        "sw_ver": "R4.2.23.109",
        "desc": "G-97RG6W",
        "mac": "A4:81:7A:75:C1:6E",
        "workMode": "0",
        "wifi_button": "0",
        "lan_mtu": "1500",
        "uptime": 0
    },
    "lan": {
        "ip": "192.168.10.1",
        "mask": "255.255.255.0",
        "dhcp_enable": "1",
        "dhcp_start": "192.168.10.2",
        "dhcp_end": "192.168.10.254",
        "dhcp_lease": "86400",
        "dns_overwrite": "0",
        "dns_primary": "",
        "dns_secondary": ""
    },
    "wifi24": {
        "enable": "1",
        "ssid": "FPT_Telecom_2.4G",
        "channel": "auto",
        "security": "WPA2-PSK",
        "password": "",
        "hidden": "0"
    },
    "wifi5": {
        "enable": "1",
        "ssid": "FPT_Telecom_5G",
        "channel": "auto",
        "security": "WPA2-PSK",
        "password": "",
        "hidden": "0"
    },
    "dmz": {
        "enable": "0",
        "dest_ip": "192.168.1.100"
    },
    "ddns": {
        "enable": "0",
        "provider": "dyndns",
        "username": "",
        "password": "",
        "hostname": ""
    },
    "portfwd": {
        "rules": []
    },
    "firewall": {
        "enable": "1",
        "spi_enable": "1",
        "dos_enable": "1"
    },
    "wan": {
        "ppp_user": "fpt",
        "ppp_pass": "08ypih%&*%^#T()#$&E%SUCG6uy$E&"
    },
    "wifi_iot": {
        "ssid": "FPT Telecom-C16E-SSID2",
        "enable": "0",
        "password": ""
    }
}

import copy
import threading

_KHO_LOCK = threading.RLock()
_KHO_CTX = threading.local()


class KhoCauHinh:
    def __init__(self, tep_luu=TEP_LUU_MAC_DINH):
        self.tep_luu = tep_luu
        self._kho_theo_ktv = {}
        self._khoa = _KHO_LOCK
        self._nap_mau_goc()

    def _nap_mau_goc(self):
        if os.path.exists(self.tep_luu):
            try:
                with open(self.tep_luu, "r", encoding="utf-8") as f:
                    self._mau_goc = json.load(f)
                    return
            except Exception:
                pass
        self._mau_goc = json.loads(json.dumps(CAU_HINH_GOC))

    def bind(self, key):
        """Gắn phiên KTV hiện tại vào ngữ cảnh luồng."""
        _KHO_CTX.key = key or "default"
        return self.current_key()

    def current_key(self):
        return getattr(_KHO_CTX, "key", "default")

    def _lay_du_lieu_ktv(self, key=None):
        session_key = key or self.current_key()
        with self._khoa:
            if session_key not in self._kho_theo_ktv:
                self._kho_theo_ktv[session_key] = copy.deepcopy(self._mau_goc)
            return self._kho_theo_ktv[session_key]

    @property
    def du_lieu(self):
        return self._lay_du_lieu_ktv()

    @du_lieu.setter
    def du_lieu(self, val):
        session_key = self.current_key()
        with self._khoa:
            self._kho_theo_ktv[session_key] = val

    def doc(self, khoa, mac_dinh=None, key=None):
        session_key = key or self.current_key()
        cac_cap = khoa.split(".")
        cur = self._lay_du_lieu_ktv(session_key)
        for c in cac_cap:
            if isinstance(cur, dict) and c in cur:
                cur = cur[c]
            else:
                return mac_dinh
        return cur

    def ghi(self, khoa, gia_tri, key=None):
        session_key = key or self.current_key()
        cac_cap = khoa.split(".")
        with self._khoa:
            cur = self._lay_du_lieu_ktv(session_key)
            for c in cac_cap[:-1]:
                if c not in cur or not isinstance(cur[c], dict):
                    cur[c] = {}
                cur = cur[c]
            cur[cac_cap[-1]] = gia_tri

    def dat_lai(self, key=None):
        session_key = key or self.current_key()
        with self._khoa:
            self._kho_theo_ktv[session_key] = copy.deepcopy(self._mau_goc)

    def xoa_phien(self, key=None):
        session_key = key or self.current_key()
        with self._khoa:
            self._kho_theo_ktv.pop(session_key, None)


KHO = KhoCauHinh()
