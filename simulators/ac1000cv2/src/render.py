#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
BỘ RENDER TRANG ĐỘNG — INTERNET HUB AC1000CV2
============================================
Thay thế các biến JavaScript và phần tử HTML gốc bằng dữ liệu
từ kho cấu hình trung tâm (config_store.py).
"""
import os
import re
try:
    from .config_store import KHO
except ImportError:
    from config_store import KHO

_HERE = os.path.dirname(os.path.abspath(__file__))
_REF_HTML = os.path.abspath(os.path.join(_HERE, "..", "reference", "html"))


def render_devinfo(html):
    sys_cfg = KHO.doc("system", {})
    dev_name = sys_cfg.get("dev_name", "G-97RG6W")
    dev_id = sys_cfg.get("dev_id", "FPTT19a0107e")
    hw_ver = sys_cfg.get("hw_ver", "01")
    sw_ver = sys_cfg.get("sw_ver", "R4.2.23.109")
    desc = sys_cfg.get("desc", "G-97RG6W")
    mac = sys_cfg.get("mac", "A4:81:7A:75:C1:6E")
    work_mode = sys_cfg.get("workMode", "0")
    wifi_btn = sys_cfg.get("wifi_button", "0")

    html = re.sub(r'(?<!var )dev_id\s*=\s*"[^"]*";', f'dev_id = "{dev_id}";', html)
    html = re.sub(r'(?<!var )dev_name\s*=\s*"[^"]*";', f'dev_name = "{dev_name}";', html)
    html = re.sub(r'(?<!var )hw_ver\s*=\s*"[^"]*";', f'hw_ver = "{hw_ver}";', html)
    html = re.sub(r'(?<!var )sw_ver\s*=\s*"[^"]*";', f'sw_ver = "{sw_ver}";', html)
    html = re.sub(r'(?<!var )desc\s*=\s*"[^"]*";', f'desc = "{desc}";', html)
    html = re.sub(r'"mac":\s*"[0-9A-Fa-f:]+"', f'"mac":"{mac}"', html)
    html = re.sub(r'(?<!var )workMode\s*=\s*"?[0-9]"?;', f'workMode = "{work_mode}";', html)
    html = re.sub(r'(?<!var )wifi_button\s*=\s*[0-9];', f'wifi_button={wifi_btn};', html)
    return html


def render_wan(html):
    wan = KHO.doc("wan", {})
    user = wan.get("ppp_user", "fpt")
    pwd = wan.get("ppp_pass", "08ypih%&*%^#T()#$&E%SUCG6uy$E&")

    html = re.sub(r'"username"\s*:\s*"[^"]*"', f'"username":"{user}"', html)
    html = re.sub(r'"password"\s*:\s*"[^"]*"', f'"password":"{pwd}"', html)
    if user != "fpt":
        html = html.replace('id="ppp_user"', f'id="ppp_user" value="{user}"')
        html = html.replace('id="ppp_pass"', f'id="ppp_pass" value="{pwd}"')
    return html


def render_lan(html):
    lan = KHO.doc("lan", {})
    ip = lan.get("ip", "192.168.1.1")
    mask = lan.get("mask", "255.255.255.0")
    dhcp = lan.get("dhcp_enable", "1")
    start = lan.get("dhcp_start", "192.168.1.2")
    end = lan.get("dhcp_end", "192.168.1.254")
    dns_mode = lan.get("dns_overwrite", "0")
    dns1 = lan.get("dns_primary", "")
    dns2 = lan.get("dns_secondary", "")
    if dns1 == "0.0.0.0": dns1 = ""
    if dns2 == "0.0.0.0": dns2 = ""

    html = re.sub(r'(?<!var )lan_ip\s*=\s*"[^"]*";', f'lan_ip = "{ip}";', html)
    html = re.sub(r'(?<!var )lan_mask\s*=\s*"[^"]*";', f'lan_mask = "{mask}";', html)
    html = re.sub(r'(?<!var )dhcp_enable\s*=\s*[0-9];', f'dhcp_enable = {dhcp};', html)
    html = re.sub(r'"startip":\s*"[^"]*"', f'"startip":"{start}"', html)
    html = re.sub(r'"endip":\s*"[^"]*"', f'"endip":"{end}"', html)
    html = re.sub(r'dns_mode\s*=\s*[0-9];', f'dns_mode = {dns_mode};', html)
    html = re.sub(r'manual_dns1\s*=\s*"[^"]*";', f'manual_dns1 = "{dns1}";', html)
    html = re.sub(r'manual_dns2\s*=\s*"[^"]*";', f'manual_dns2 = "{dns2}";', html)

    if str(dns_mode) == "1":
        html = html.replace('id="dns_ovwrt0"', 'id="dns_ovwrt0" checked="checked"')
        html = html.replace('id="dns_ovwrt1" value="0" checked="checked"', 'id="dns_ovwrt1" value="0"')
        if dns1:
            html = html.replace('id="dns_primary"', f'id="dns_primary" value="{dns1}"')
        if dns2:
            html = html.replace('id="dns_secondary"', f'id="dns_secondary" value="{dns2}"')
        html = html.replace('id="primary_dns" style="display:none"', 'id="primary_dns"')
        html = html.replace('id="secondary_dns" style="display:none"', 'id="secondary_dns"')

    if ip:
        html = html.replace('id="lan_ip"', f'id="lan_ip" value="{ip}"')
    if mask != "255.255.255.0":
        html = html.replace('id="lan_mask"', f'id="lan_mask" value="{mask}"')
    if start:
        html = html.replace('id="start_ip"', f'id="start_ip" value="{start}"')
        html = html.replace('id="dhcp_start_ip"', f'id="dhcp_start_ip" value="{start}"')
        html = html.replace('id="startip"', f'id="startip" value="{start}"')
    if end:
        html = html.replace('id="end_ip"', f'id="end_ip" value="{end}"')
        html = html.replace('id="dhcp_end_ip"', f'id="dhcp_end_ip" value="{end}"')
        html = html.replace('id="endip"', f'id="endip" value="{end}"')
    return html


def render_wifissid(html):
    ssid0 = KHO.doc("wifi24.ssid", "FPT Telecom-C16E")
    enable0 = KHO.doc("wifi24.enable", "1")
    ssid1 = KHO.doc("wifi_iot.ssid", "FPT Telecom-C16E-SSID2")
    enable1 = KHO.doc("wifi_iot.enable", "0")
    last_idx = KHO.doc("wifi24.last_idx", "0")

    html = re.sub(r'ssid_network_name\[0\]\s*=\s*"[^"]*";', f'ssid_network_name[0]="{ssid0}";', html)
    html = re.sub(r'ssid_enable\[0\]\s*=\s*[0-9];', f'ssid_enable[0]={enable0};', html)
    html = re.sub(r'ssid_network_name\[1\]\s*=\s*"[^"]*";', f'ssid_network_name[1]="{ssid1}";', html)
    html = re.sub(r'ssid_enable\[1\]\s*=\s*[0-9];', f'ssid_enable[1]={enable1};', html)

    if str(last_idx) == "1":
        html = re.sub(r'SelectShow\(0\);', 'SelectShow(1);', html)
        html = html.replace('id="ssid_network_name"', f'id="ssid_network_name" value="{ssid1}"')
        if str(enable1) == "1":
            html = html.replace('id="ssid_enable" type="radio" value="1"', 'id="ssid_enable" type="radio" value="1" checked="checked"')
            html = html.replace('id="ssid_disable" type="radio" value="0" checked="checked"', 'id="ssid_disable" type="radio" value="0"')
    else:
        if ssid0 != "FPT Telecom-C16E":
            html = html.replace('id="ssid_network_name"', f'id="ssid_network_name" value="{ssid0}"')
    return html


def render_wifi5ssid(html):
    ssid = KHO.doc("wifi5.ssid", "FPT Telecom-C16E_5G")
    enable = KHO.doc("wifi5.enable", "1")
    html = re.sub(r'ssid_network_name\[0\]\s*=\s*"[^"]*";', f'ssid_network_name[0]="{ssid}";', html)
    html = re.sub(r'ssid_enable\[0\]\s*=\s*[0-9];', f'ssid_enable[0]={enable};', html)
    if ssid != "FPT Telecom-C16E_5G":
        html = html.replace('id="ssid_network_name"', f'id="ssid_network_name" value="{ssid}"')
    return html


def render_portfwd(html):
    pf = KHO.doc("portfwd", {})
    lanip = pf.get("lanip", "")
    lanport = pf.get("lanport", "")
    wanstart = pf.get("wanstart", "")
    wanend = pf.get("wanend", "")
    proto = pf.get("protocol", "1")

    if lanip and lanport:
        mapping_item = (
            f'{{"apporder": 0, "wan_port_start": "{wanstart or lanport}", '
            f'"wan_port_end": "{wanend or lanport}", "lan_port": "{lanport}", '
            f'"lan_ip": "{lanip}", "proto": "{proto}", "remote_ip": "null", '
            f'"hostname": "", "enable": "1"}}'
        )
        html = re.sub(r'"mapping_list"\s*:\s*\[\s*\]', f'"mapping_list": [{mapping_item}]', html)

    if lanip:
        html = html.replace('id="portfwd_lanip"', f'id="portfwd_lanip" value="{lanip}"')
    if lanport:
        html = html.replace('id="portfwd_lanport"', f'id="portfwd_lanport" value="{lanport}"')
    if wanstart:
        html = html.replace('id="portfwd_wanstart"', f'id="portfwd_wanstart" value="{wanstart}"')
    if wanend:
        html = html.replace('id="portfwd_wanend"', f'id="portfwd_wanend" value="{wanend}"')
    if proto:
        html = html.replace(f'<option value="{proto}">', f'<option value="{proto}" selected="selected">')

    return html


def render_dmz(html):
    enable = KHO.doc("dmz.enable", "0")
    dest_ip = KHO.doc("dmz.dest_ip", "0.0.0.0")
    html = re.sub(r'dmz_enable:\s*"[0-9]"', f'dmz_enable:"{enable}"', html)
    html = re.sub(r'dmz_ipaddr:\s*"[^"]*"', f'dmz_ipaddr:"{dest_ip}"', html)
    return html


def render_password(html):
    current_pwd = KHO.doc("auth.admin", "admin")
    html = re.sub(r'old_password\s*=\s*"[^"]*";', f'old_password = "{current_pwd}";', html)
    return html


def render_wifisecu(html):
    key = KHO.doc("wifi24.password", "")
    key_iot = KHO.doc("wifi_iot.password", "")
    if key in ("19a0107e", "fpttelecom@2026", "12345678"):
        key = ""
    if key_iot in ("19a0107e", "fpttelecom@2026", "12345678"):
        key_iot = ""
    html = re.sub(r'security_wpa_key\[0\]\s*=\s*"[^"]*";', f'security_wpa_key[0]="{key}";', html)
    html = re.sub(r'security_wpa_key\[1\]\s*=\s*"[^"]*";', f'security_wpa_key[1]="{key_iot}";', html)
    last_idx = KHO.doc("wifi24.last_idx", "0")
    if str(last_idx) == "1":
        html = re.sub(r'SelectShow\(ssid_list\[0\]\);', 'SelectShow(ssid_list[1]);', html)
        html = html.replace('id="security_wpa_key" type="text" value=""', f'id="security_wpa_key" type="text" value="{key_iot}"')
    else:
        html = html.replace('id="security_wpa_key" type="text" value=""', f'id="security_wpa_key" type="text" value="{key}"')
    return html


def render_wifi5secu(html):
    key = KHO.doc("wifi5.password", "")
    if key in ("19a0107e", "fpttelecom@2026"):
        key = ""
    html = re.sub(r'security_wpa_key\[0\]\s*=\s*"[^"]*";', f'security_wpa_key[0]="{key}";', html)
    html = html.replace('id="security_wpa_key" type="text" value=""', f'id="security_wpa_key" type="text" value="{key}"')
    return html


RENDER_MAP = {
    "devinfo.html": render_devinfo,
    "lan.html": render_lan,
    "wifissid.html": render_wifissid,
    "wifi5ssid.html": render_wifi5ssid,
    "wifisecu.html": render_wifisecu,
    "wifi5secu.html": render_wifi5secu,
    "dmz.html": render_dmz,
    "password.html": render_password,
    "wan.html": render_wan,
    "portfwd.html": render_portfwd
}


def render_page(filename):
    filepath = os.path.join(_REF_HTML, filename)
    if not os.path.exists(filepath):
        return None
    with open(filepath, "r", encoding="utf-8", errors="ignore") as f:
        content = f.read()

    fn = RENDER_MAP.get(filename)
    if fn:
        content = fn(content)
    return content
