#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
KHO CAU HINH TRUNG TAM — ONT AX1800GZ (ZTE F6600)
================================================
Nguyen tac (CLAUDE.md muc 2.5):
  Moi trang doc va ghi thong qua MOT kho cau hinh duy nhat.
  Luu ben vung ra dia (config.json) de song qua cac lan khoi dong lai.
"""
import os
import json

_HERE = os.path.dirname(os.path.abspath(__file__))
TEP_LUU_MAC_DINH = os.path.join(_HERE, "config.json")

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
            "UserName": "sgfdl-000000-000",
            "Password": "123456",
            "AuthType": "PAP,CHAP,MS-CHAP",
            "ConnTrigger": "AlwaysOn",
            "IpMode": "Both",
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
        "encrypt_11i": "AESEncryption",
        "encrypt_wpa": "AESEncryption"
    },
    "wlan24_ssid2": {
        "enable": "0",
        "ssid": "SSID2",
        "hide": "0",
        "security": "WPA2-PSK-AES",
        "password": "fpttelecom@2026",
        "beacon_type": "11i",
        "encrypt_11i": "AESEncryption",
        "encrypt_wpa": "TKIPandAESEncryption"
    },
    "wlan5": {
        "enable": "1",
        "ssid": "FPT_AX1800GZ_5G",
        "hide": "0",
        "security": "WPA2-PSK",
        "password": "fpttelecom@2026",
        "beacon_type": "WPAand11i",
        "encrypt_11i": "TKIPandAESEncryption",
        "encrypt_wpa": "TKIPandAESEncryption"
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
        self.du_lieu = {}
        self.nap()

    def nap(self):
        if os.path.exists(self.tep_luu):
            try:
                with open(self.tep_luu, "r", encoding="utf-8") as f:
                    loaded = json.load(f)
                if isinstance(loaded, dict):
                    base = json.loads(json.dumps(CAU_HINH_GOC))
                    for k, v in loaded.items():
                        if isinstance(v, dict) and isinstance(base.get(k), dict):
                            base[k].update(v)
                        else:
                            base[k] = v
                    self.du_lieu = base
                    return
            except Exception:
                pass
        self.khoi_phuc_xuat_xuong()

    def khoi_phuc_xuat_xuong(self):
        self.du_lieu = json.loads(json.dumps(CAU_HINH_GOC))
        self.luu()

    def luu(self):
        try:
            with open(self.tep_luu, "w", encoding="utf-8") as f:
                json.dump(self.du_lieu, f, ensure_ascii=False, indent=2)
        except Exception as e:
            print(f"Loi ghi kho cau hinh: {e}")

    def doc(self, duong_dan, mac_dinh=None):
        khoang = self.du_lieu
        cac_khoa = duong_dan.split(".")
        for k in cac_khoa:
            if isinstance(khoang, dict) and k in khoang:
                khoang = khoang[k]
            else:
                return mac_dinh
        return khoang

    def ghi(self, duong_dan, gia_tri):
        khoang = self.du_lieu
        cac_khoa = duong_dan.split(".")
        for k in cac_khoa[:-1]:
            if k not in khoang or not isinstance(khoang[k], dict):
                khoang[k] = {}
            khoang = khoang[k]
        khoang[cac_khoa[-1]] = gia_tri
        self.luu()


KHO = KhoCauHinh()
