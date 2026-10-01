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


class KhoCauHinh:
    def __init__(self, tep_luu=TEP_LUU_MAC_DINH):
        self.tep_luu = tep_luu
        self.du_lieu = {}
        self.nap()

    def nap(self):
        if os.path.exists(self.tep_luu):
            try:
                with open(self.tep_luu, "r", encoding="utf-8") as f:
                    self.du_lieu = json.load(f)
                    return
            except Exception:
                pass
        self.du_lieu = json.loads(json.dumps(CAU_HINH_GOC))
        self.luu()

    def luu(self):
        try:
            with open(self.tep_luu, "w", encoding="utf-8") as f:
                json.dump(self.du_lieu, f, ensure_ascii=False, indent=2)
        except Exception as e:
            print(f"Loi ghi file config: {e}")

    def doc(self, khoa, mac_dinh=None):
        cac_cap = khoa.split(".")
        cur = self.du_lieu
        for c in cac_cap:
            if isinstance(cur, dict) and c in cur:
                cur = cur[c]
            else:
                return mac_dinh
        return cur

    def ghi(self, khoa, gia_tri):
        cac_cap = khoa.split(".")
        cur = self.du_lieu
        for c in cac_cap[:-1]:
            if c not in cur or not isinstance(cur[c], dict):
                cur[c] = {}
            cur = cur[c]
        cur[cac_cap[-1]] = gia_tri
        self.luu()

    def dat_lai(self):
        self.du_lieu = json.loads(json.dumps(CAU_HINH_GOC))
        self.luu()


KHO = KhoCauHinh()
