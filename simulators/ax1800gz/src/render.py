#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
BO RENDER DU LIEU DONG — ONT AX1800GZ (ZTE F6600)
=================================================
Thay the cac tham so XML trong reference/data bang du lieu
tu kho cau hinh trung tam (config_store.py).
"""
import os
import re
from xml.sax.saxutils import escape as xml_escape

try:
    from .config_store import KHO
except ImportError:
    from config_store import KHO

_HERE = os.path.dirname(os.path.abspath(__file__))
_REF_DATA = os.path.abspath(os.path.join(_HERE, "..", "reference", "data"))
_REF_VIEWS = os.path.abspath(os.path.join(_HERE, "..", "reference", "views"))


def _replace_para_in_instance(inst_xml, para_name, new_value):
    escaped = xml_escape(str(new_value if new_value is not None else ""))
    pattern = rf'(<ParaName>{re.escape(para_name)}</ParaName>\s*<ParaValue>)[^<]*(</ParaValue>)'
    if re.search(pattern, inst_xml):
        return re.sub(pattern, lambda m: f"{m.group(1)}{escaped}{m.group(2)}", inst_xml)
    return inst_xml


def _update_instance_by_inst_id(xml, obj_tag, inst_id, updates):
    obj_pattern = rf'(<{re.escape(obj_tag)}>)(.*?)(</{re.escape(obj_tag)}>)'
    m_obj = re.search(obj_pattern, xml, flags=re.DOTALL)
    if not m_obj:
        return xml
    obj_body = m_obj.group(2)

    def repl_inst(m_inst):
        inst_content = m_inst.group(0)
        if f"<ParaName>_InstID</ParaName><ParaValue>{inst_id}</ParaValue>" not in inst_content:
            return inst_content
        for k, v in updates.items():
            inst_content = _replace_para_in_instance(inst_content, k, v)
        return inst_content

    new_body = re.sub(r'<Instance>.*?</Instance>', repl_inst, obj_body, flags=re.DOTALL)
    return xml[:m_obj.start(2)] + new_body + xml[m_obj.end(2):]


def render_wan_internet_data(xml):
    instances = KHO.doc("wan_instances", [])
    inst_xml_parts = []
    for item in instances:
        if not isinstance(item, dict):
            continue
        paras = []
        for k, v in item.items():
            paras.append(f"<ParaName>{xml_escape(str(k))}</ParaName><ParaValue>{xml_escape(str(v))}</ParaValue>")
        inst_xml_parts.append("<Instance>" + "".join(paras) + "</Instance>")
    wan_block = "<ID_WAN_COMFIG>" + "".join(inst_xml_parts) + "</ID_WAN_COMFIG>"
    if "<ID_WAN_COMFIG>" in xml:
        xml = re.sub(r'<ID_WAN_COMFIG>.*?</ID_WAN_COMFIG>', lambda _: "<ID_WAN_COMFIG>" + "".join(inst_xml_parts) + "</ID_WAN_COMFIG>", xml, flags=re.DOTALL)
        xml = re.sub(r'<encode>[^<]*</encode>', '', xml)
    elif "<encode>" in xml:
        xml = re.sub(r'<encode>[^<]*</encode>', lambda _: wan_block, xml)
    else:
        xml = xml.replace("</ajax_response_xml_root>", wan_block + "</ajax_response_xml_root>")
    return xml


def render_dmz_data(xml):
    dmz_en = KHO.doc("dmz.enable", "0")
    dmz_ip = KHO.doc("dmz.ip", "192.168.1.100")
    xml = _replace_para_in_instance(xml, "Enable", dmz_en)
    xml = _replace_para_in_instance(xml, "InternalClient", dmz_ip)
    return xml


def render_wlan_ssid_data(xml):
    xml = re.sub(r'<encode>[^<]*</encode>', '', xml)
    # AP1 (SSID1 - 2.4GHz)
    xml = _update_instance_by_inst_id(xml, "OBJ_WLANAP_ID", "DEV.WIFI.AP1", {
        "Enable": KHO.doc("wlan24.enable", "1"),
        "ESSID": KHO.doc("wlan24.ssid", "FPT_AX1800GZ_2.4G"),
        "ESSIDHideEnable": KHO.doc("wlan24.hide", "0"),
        "BeaconType": KHO.doc("wlan24.beacon_type", "11i"),
        "11iEncryptType": KHO.doc("wlan24.encrypt_11i", "AESEncryption"),
        "WPAEncryptType": KHO.doc("wlan24.encrypt_wpa", "AESEncryption"),
    })
    xml = _update_instance_by_inst_id(xml, "OBJ_WLANPSK_ID", "DEV.WIFI.AP1.PSK1", {
        "KeyPassphrase": KHO.doc("wlan24.password", "fpttelecom@2026"),
    })
    # AP2 (SSID2 - 2.4GHz IoT)
    xml = _update_instance_by_inst_id(xml, "OBJ_WLANAP_ID", "DEV.WIFI.AP2", {
        "Enable": KHO.doc("wlan24_ssid2.enable", "0"),
        "ESSID": KHO.doc("wlan24_ssid2.ssid", "SSID2"),
        "ESSIDHideEnable": KHO.doc("wlan24_ssid2.hide", "0"),
        "BeaconType": KHO.doc("wlan24_ssid2.beacon_type", "11i"),
        "11iEncryptType": KHO.doc("wlan24_ssid2.encrypt_11i", "AESEncryption"),
        "WPAEncryptType": KHO.doc("wlan24_ssid2.encrypt_wpa", "TKIPandAESEncryption"),
    })
    xml = _update_instance_by_inst_id(xml, "OBJ_WLANPSK_ID", "DEV.WIFI.AP2.PSK1", {
        "KeyPassphrase": KHO.doc("wlan24_ssid2.password", "fpttelecom@2026"),
    })
    # AP5 (SSID5 - 5GHz)
    xml = _update_instance_by_inst_id(xml, "OBJ_WLANAP_ID", "DEV.WIFI.AP5", {
        "Enable": KHO.doc("wlan5.enable", "1"),
        "ESSID": KHO.doc("wlan5.ssid", "FPT_AX1800GZ_5G"),
        "ESSIDHideEnable": KHO.doc("wlan5.hide", "0"),
        "BeaconType": KHO.doc("wlan5.beacon_type", "WPAand11i"),
        "11iEncryptType": KHO.doc("wlan5.encrypt_11i", "TKIPandAESEncryption"),
        "WPAEncryptType": KHO.doc("wlan5.encrypt_wpa", "TKIPandAESEncryption"),
    })
    xml = _update_instance_by_inst_id(xml, "OBJ_WLANPSK_ID", "DEV.WIFI.AP5.PSK1", {
        "KeyPassphrase": KHO.doc("wlan5.password", "fpttelecom@2026"),
    })
    return xml


def render_lan_dhcp_data(xml):
    xml = re.sub(r'<encode>[^<]*</encode>', '', xml)
    ip = KHO.doc("lan.ip", "192.168.1.1")
    mask = KHO.doc("lan.mask", "255.255.255.0")
    dhcp_en = KHO.doc("lan.dhcp_enable", "1")
    dhcp_start = KHO.doc("lan.dhcp_start", "192.168.1.2")
    dhcp_end = KHO.doc("lan.dhcp_end", "192.168.1.254")
    lease = KHO.doc("lan.lease_time", "86400")
    dns_src = KHO.doc("lan.dns_source", "0")
    dns1 = KHO.doc("lan.dns1", "192.168.1.1")
    dns2 = KHO.doc("lan.dns2", "0.0.0.0")

    xml = _update_instance_by_inst_id(xml, "OBJ_Br0AndDhcpsHosCfg_ID", "IGD", {
        "IPAddr": ip,
        "SubMask": mask,
        "SubnetMask": mask,
        "ServerEnable": dhcp_en,
        "MinAddress": dhcp_start,
        "MaxAddress": dhcp_end,
        "LeaseTime": lease,
        "DnsServerSource": dns_src,
        "DNSServer1": dns1,
        "DNSServer2": dns2,
    })
    return xml


def render_portforwarding_data(xml):
    rules = KHO.doc("port_forwarding", [])
    inst_parts = []
    for item in rules:
        if not isinstance(item, dict):
            continue
        paras = []
        for k, v in item.items():
            paras.append(f"<ParaName>{xml_escape(str(k))}</ParaName><ParaValue>{xml_escape(str(v))}</ParaValue>")
        inst_parts.append("<Instance>" + "".join(paras) + "</Instance>")
    block = "<OBJ_FWPM_ID>" + "".join(inst_parts) + "</OBJ_FWPM_ID>"
    if "<OBJ_FWPM_ID>" in xml:
        xml = re.sub(r'<OBJ_FWPM_ID>.*?</OBJ_FWPM_ID>', lambda _: block, xml, flags=re.DOTALL)
    else:
        xml = xml.replace("</ajax_response_xml_root>", block + "</ajax_response_xml_root>")
    return xml


def render_devmgr_status(xml):
    sw_ver = KHO.doc("system.software_ver", "V9.0.11P2N15B")
    xml = _replace_para_in_instance(xml, "SoftwareVer", sw_ver)
    return xml


RENDER_MAP = {
    "wan_internet_lua.lua": render_wan_internet_data,
    "firewall_dmz_lua.lua": render_dmz_data,
    "firewall_portforwarding_lua.lua": render_portforwarding_data,
    "wlan_wlansssidconf_lua.lua": render_wlan_ssid_data,
    "Localnet_LanMgrIpv4_DHCPBasicCfg_lua.lua": render_lan_dhcp_data,
    "devmgr_statusmgr_lua.lua": render_devmgr_status
}


def render_data(dtag):
    filename = dtag
    filepath = os.path.join(_REF_DATA, filename)
    if not os.path.exists(filepath):
        for ext in ['.lua', '.xml']:
            if os.path.exists(filepath + ext):
                filepath = filepath + ext
                break
        else:
            return None

    with open(filepath, "r", encoding="utf-8", errors="ignore") as f:
        content = f.read()

    fn = RENDER_MAP.get(dtag)
    if fn:
        content = fn(content)
    if "<encode>" in content:
        content = re.sub(r'<encode>[^<]*</encode>', '', content)
    return content


def render_view(tag):
    filename = f"{tag}.html" if not tag.endswith(".html") else tag
    filepath = os.path.join(_REF_VIEWS, filename)
    if not os.path.exists(filepath):
        return None
    with open(filepath, "r", encoding="utf-8", errors="ignore") as f:
        return f.read()
