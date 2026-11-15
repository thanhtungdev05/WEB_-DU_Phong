#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""Per-(ktv_id, node_id) simulator backend adapters, A -> B sync, and workspace store.

Provides:
- Strict validation for node IDs and session keys to prevent path traversal or
  session collisions when multiple identical simulator models share the canvas.
- Unified read/write/reset backend adapters for all 16 hardware simulators.
- Topology propagation enforcing Router-mode WAN-only provisioning vs AP/Mesh
  Agent full LAN/DHCP/DNS/Wi-Fi/Topology sync.
- Per-KTV workspace persistence (memory + disk JSON) for F5 browser reload.
"""

from __future__ import annotations

import contextlib
import copy
import importlib
import ipaddress
import json
import os
from pathlib import Path
import re
import socket
import struct
import sys
import threading
import time
from typing import Any

ALL_SIM_IDS = (
    "sim_ac1000f",
    "sim_ax3000c",
    "sim_ax3000gz",
    "sim_ax3000gz_v2",
    "sim_ax3000hv2",
    "sim_ax3000s",
    "sim_be12000",
    "sim_be15000",
    "sim_ac1000HI",
    "sim_vigor2927",
    "sim_be6500c",
    "sim_ONT_be6500c",
    "sim_mikrotik_hexs",
    "sim_ac1000cv2",
    "sim_ac1000z",
    "sim_ax1800gz",
)

ROUTER_DEFAULT_SIM_IDS = frozenset({"sim_vigor2927", "sim_mikrotik_hexs"})
GATEWAY_DEFAULT_SIM_IDS = frozenset({
    "sim_be12000",
    "sim_be15000",
    "sim_ONT_be6500c",
    "sim_ac1000f",
    "sim_ax3000gz",
    "sim_ax3000gz_v2",
    "sim_ac1000HI",
    "sim_ac1000z",
    "sim_ax1800gz",
})

_SAFE_ID_RE = re.compile(r"^[A-Za-z0-9_-]{1,64}$")
_BASE_DIR = Path(__file__).resolve().parent
_WORKSPACE_DIR = _BASE_DIR / "data" / "mesh_lab_workspaces"
_WORKSPACE_TTL_SEC = 14 * 86400

_ADAPTER_LOCK = threading.RLock()
_WORKSPACE_LOCK = threading.RLock()

_WORKSPACES: dict[str, dict[str, Any]] = {}
_NODE_META: dict[tuple[str, str], dict[str, Any]] = {}


# ---------------------------------------------------------------------------
# Identity / Validation Helpers
# ---------------------------------------------------------------------------

def is_valid_node_id(node_id: str | None) -> bool:
    return bool(isinstance(node_id, str) and _SAFE_ID_RE.match(node_id))


def sanitize_base_ktv_id(raw_ktv_id: str | None) -> str:
    s = str(raw_ktv_id or "").strip()
    if "__mn_" in s:
        s = s.split("__mn_", 1)[0]
    cleaned = "".join(c for c in s if c.isalnum() or c in ("-", "_"))[:64]
    return cleaned or "default"


def make_node_session_key(base_ktv_id: str, node_id: str | None) -> str:
    safe_base = sanitize_base_ktv_id(base_ktv_id)
    if not node_id:
        return safe_base
    if not is_valid_node_id(node_id):
        raise ValueError(f"Invalid node_id: {node_id!r}")
    return f"{safe_base}__mn_{node_id}"


# ---------------------------------------------------------------------------
# IPv4 / Subnet Helpers
# ---------------------------------------------------------------------------

def _is_ipv4(val: Any) -> bool:
    if not isinstance(val, str):
        return False
    try:
        ipaddress.IPv4Address(val.strip())
        return True
    except Exception:
        return False


def _ip_to_le_u32(ip_str: str) -> int:
    return struct.unpack("<I", socket.inet_aton(ip_str.strip()))[0]


def _le_u32_to_ip(val: int) -> str:
    return socket.inet_ntoa(struct.pack("<I", int(val) & 0xFFFFFFFF))


def _ip_network(ip_str: str, mask_str: str) -> ipaddress.IPv4Network:
    try:
        return ipaddress.IPv4Network(f"{ip_str.strip()}/{mask_str.strip()}", strict=False)
    except Exception:
        return ipaddress.IPv4Network("192.168.1.0/24")


def _same_subnet(ip_a: str, ip_b: str, mask_str: str) -> bool:
    if not (_is_ipv4(ip_a) and _is_ipv4(ip_b)):
        return False
    try:
        net_a = _ip_network(ip_a, mask_str)
        return ipaddress.IPv4Address(ip_b.strip()) in net_a
    except Exception:
        return False


def _derive_subnet_ip(gw_ip: str, mask_str: str, host_slot: int, existing_ip: str = "") -> str:
    """Return an IP inside gw_ip's subnet without colliding with gw_ip."""
    net = _ip_network(gw_ip, mask_str)
    gw_addr = ipaddress.IPv4Address(gw_ip.strip()) if _is_ipv4(gw_ip) else ipaddress.IPv4Address("192.168.1.1")
    if _is_ipv4(existing_ip):
        cand = ipaddress.IPv4Address(existing_ip.strip())
        if cand in net and cand != gw_addr and cand != net.network_address and cand != net.broadcast_address:
            return str(cand)
    net_int = int(net.network_address)
    bcast_int = int(net.broadcast_address)
    offset = max(2, min(250, host_slot + 1))
    for step in range(offset, 252):
        cand_int = net_int + step
        if net_int < cand_int < bcast_int and cand_int != int(gw_addr):
            return str(ipaddress.IPv4Address(cand_int))
    for cand_int in range(net_int + 2, bcast_int):
        if cand_int != int(gw_addr):
            return str(ipaddress.IPv4Address(cand_int))
    return str(gw_addr)


def _derive_pool_bounds(gw_ip: str, mask_str: str, start_ip: str = "", end_ip: str = "") -> tuple[str, str]:
    net = _ip_network(gw_ip, mask_str)
    base_prefix = ".".join(str(net.network_address).split(".")[:3])
    s_ip = start_ip.strip() if _same_subnet(gw_ip, start_ip, mask_str) else f"{base_prefix}.100"
    e_ip = end_ip.strip() if _same_subnet(gw_ip, end_ip, mask_str) else f"{base_prefix}.200"
    return s_ip, e_ip


def _pool_size(start_ip: str, end_ip: str, default: int = 100) -> int:
    if not (_is_ipv4(start_ip) and _is_ipv4(end_ip)):
        return default
    diff = int(ipaddress.IPv4Address(end_ip.strip())) - int(ipaddress.IPv4Address(start_ip.strip())) + 1
    return max(1, min(253, diff))


def _end_ip_from_pool_size(start_ip: str, pool_size: Any) -> str:
    if not _is_ipv4(start_ip):
        return ""
    try:
        cnt = max(1, min(253, int(pool_size)))
        start_int = int(ipaddress.IPv4Address(start_ip.strip()))
        end_int = min((start_int & 0xFFFFFF00) + 254, start_int + cnt - 1)
        return str(ipaddress.IPv4Address(end_int))
    except Exception:
        return ""


def _parse_int(val: Any, default: int = 0) -> int:
    try:
        return int(str(val).strip())
    except Exception:
        return default


# ---------------------------------------------------------------------------
# Security / Bandwidth Normalization Helpers
# ---------------------------------------------------------------------------

def _normalize_security(sec: str | None) -> str:
    s = str(sec or "").strip().lower()
    if not s or "wpa2" in s and "wpa3" in s or "sae" in s and "psk" in s or "transition" in s:
        return "WPA2/WPA3-PSK"
    if "wpa3" in s or "sae" in s:
        return "WPA3-SAE"
    if "open" in s or "none" in s:
        return "Open"
    if "wpa2" in s or "11i" in s or "psk2" in s or "aes" in s:
        return "WPA2-PSK"
    return str(sec or "WPA2/WPA3-PSK")


def _normalize_bandwidth(bw: str | None) -> str:
    s = str(bw or "").strip().upper()
    for val in ("320", "160", "80", "40", "20"):
        if val in s:
            return f"{val}MHz"
    if "AUTO" in s:
        return "Auto"
    return "80MHz"


def _normalize_channel(ch: Any) -> str:
    s = str(ch or "").strip()
    if not s or s.lower() == "auto":
        return "auto"
    return s


def _zte_sec_tuple(security: str) -> dict[str, str]:
    s = _normalize_security(security)
    if s == "WPA3-SAE":
        return {
            "BeaconType": "WPA3",
            "11iEncryptType": "AESEncryption",
            "11iAuthMode": "SAEAuthentication",
            "WPA3AuthMode": "SAEAuthentication",
            "WPA3EncryptType": "AESEncryption",
        }
    if s == "WPA2/WPA3-PSK":
        return {
            "BeaconType": "11i",
            "11iEncryptType": "AESEncryption",
            "11iAuthMode": "PSKAuthentication",
            "WPA3AuthMode": "SAEAuthentication",
            "WPA3EncryptType": "AESEncryption",
        }
    if s == "Open":
        return {
            "BeaconType": "None",
            "11iEncryptType": "None",
            "11iAuthMode": "None",
            "WPA3AuthMode": "None",
            "WPA3EncryptType": "None",
        }
    return {
        "BeaconType": "11i",
        "11iEncryptType": "AESEncryption",
        "11iAuthMode": "PSKAuthentication",
        "WPA3AuthMode": "None",
        "WPA3EncryptType": "None",
    }


def _openwrt_htmode(bw: str, is_5g: bool) -> str:
    norm = _normalize_bandwidth(bw)
    if "160" in norm:
        return "HE160" if is_5g else "HT40"
    if "80" in norm:
        return "HE80" if is_5g else "HT40"
    if "40" in norm:
        return "HE40" if is_5g else "HT40"
    return "HE20" if is_5g else "HT20"


# ---------------------------------------------------------------------------
# Normalized Config / Role Classification
# ---------------------------------------------------------------------------

def is_router_mode_node(node: dict[str, Any] | None) -> bool:
    """Return True if node operates as a standalone L3 Router rather than AP/Bridge."""
    if not isinstance(node, dict):
        return False
    fw = node.get("firmwareConfig") if isinstance(node.get("firmwareConfig"), dict) else {}
    explicit_mode = str(
        node.get("opMode")
        or fw.get("opMode")
        or node.get("mode")
        or ""
    ).strip().lower()
    mesh_role = str(node.get("meshRole") or fw.get("meshRole") or "").strip().lower()

    if explicit_mode in ("ap", "agent", "mesh_agent", "mesh", "bridge", "repeater", "extender"):
        return False
    if mesh_role in ("agent", "ap", "bridge", "extender", "repeater"):
        return False
    if explicit_mode in ("router", "gateway", "nat_router"):
        return True

    sim_id = str(node.get("simId") or node.get("sim_id") or "").strip()
    cat = str(node.get("category") or node.get("role") or "").strip().lower()
    if sim_id in ROUTER_DEFAULT_SIM_IDS or cat == "router":
        return True
    return False


def normalize_cfg(raw: dict[str, Any] | None = None) -> dict[str, Any]:
    """Normalize arbitrary node config/firmwareConfig into unified snake/camel contract."""
    src = dict(raw or {})
    lan_ip = str(src.get("lanIp") or src.get("lan_ip") or src.get("ip") or "192.168.1.1").strip() or "192.168.1.1"
    netmask = str(src.get("netmask") or src.get("subnetMask") or src.get("subnet_mask") or "255.255.255.0").strip() or "255.255.255.0"
    dhcp_start_raw = str(src.get("dhcpStart") or src.get("dhcpStartIp") or src.get("dhcp_start") or "").strip()
    dhcp_end_raw = str(src.get("dhcpEnd") or src.get("dhcpEndIp") or src.get("dhcp_end") or "").strip()
    dhcp_start, dhcp_end = _derive_pool_bounds(lan_ip, netmask, dhcp_start_raw, dhcp_end_raw)

    dhcp_raw = src.get("dhcpEnable") if "dhcpEnable" in src else src.get("dhcp_enable", True)
    if isinstance(dhcp_raw, str):
        dhcp_en = dhcp_raw.strip().lower() not in ("0", "false", "no", "off")
    else:
        dhcp_en = bool(dhcp_raw)

    ssid = str(src.get("ssid") or "FPT_Telecom_WiFi7").strip() or "FPT_Telecom_WiFi7"
    ssid5g = str(src.get("ssid5g") or ssid).strip() or ssid
    password = str(src.get("password") or src.get("wpaKey") or src.get("key") or "12345678")
    dns1 = str(src.get("dns1") or src.get("primaryDns") or src.get("primary_dns") or "8.8.8.8").strip() or lan_ip
    dns2 = str(src.get("dns2") or src.get("secondaryDns") or src.get("secondary_dns") or "8.8.4.4").strip() or "8.8.4.4"
    gateway_ip = str(src.get("gatewayIp") or src.get("gateway_ip") or lan_ip).strip() or lan_ip

    mesh_nodes = src.get("meshNodes") if isinstance(src.get("meshNodes"), list) else (
        src.get("slaves") if isinstance(src.get("slaves"), list) else []
    )
    clients = src.get("clients") if isinstance(src.get("clients"), list) else []

    return {
        "ssid": ssid,
        "ssid5g": ssid5g,
        "password": password,
        "security": _normalize_security(src.get("security") or src.get("securityMode")),
        "channel": _normalize_channel(src.get("channel") or src.get("channel24")),
        "channel5g": _normalize_channel(src.get("channel5g") or src.get("channel") or "36"),
        "bandwidth": _normalize_bandwidth(src.get("bandwidth") or src.get("bandWidth")),
        "lanIp": lan_ip,
        "gatewayIp": gateway_ip,
        "netmask": netmask,
        "dhcpEnable": dhcp_en,
        "dhcpStart": dhcp_start,
        "dhcpEnd": dhcp_end,
        "dhcpLease": str(src.get("dhcpLease") or src.get("leaseTime") or src.get("lease_time") or "86400"),
        "dns1": dns1,
        "dns2": dns2,
        "meshRole": str(src.get("meshRole") or "Controller"),
        "opMode": str(src.get("opMode") or ""),
        "wanIp": str(src.get("wanIp") or src.get("wan_ip") or "").strip(),
        "wanMask": str(src.get("wanMask") or src.get("wan_mask") or netmask).strip(),
        "wanGateway": str(src.get("wanGateway") or src.get("wan_gateway") or "").strip(),
        "wanDns1": str(src.get("wanDns1") or src.get("wan_dns1") or "").strip(),
        "wanDns2": str(src.get("wanDns2") or src.get("wan_dns2") or "").strip(),
        "meshNodes": copy.deepcopy(mesh_nodes),
        "clients": copy.deepcopy(clients),
    }


def _to_frontend_contract(cfg: dict[str, Any]) -> dict[str, Any]:
    """Return merged camelCase keys matching both firmwareConfig and backend readback."""
    c = normalize_cfg(cfg)
    c["wpaKey"] = c["password"]
    c["subnetMask"] = c["netmask"]
    c["dhcpStartIp"] = c["dhcpStart"]
    c["dhcpEndIp"] = c["dhcpEnd"]
    c["leaseTime"] = c["dhcpLease"]
    c["primaryDns"] = c["dns1"]
    c["secondaryDns"] = c["dns2"]
    return c


# ---------------------------------------------------------------------------
# Simulator Module Resolution
# ---------------------------------------------------------------------------

def _get_sim_module(sim_id: str):
    run_all_mod = sys.modules.get("run_all")
    if run_all_mod is None:
        run_all_mod = importlib.import_module("run_all")
    handler_cls = getattr(run_all_mod, "SIM_HANDLERS", {}).get(sim_id)
    if handler_cls is None:
        return None
    return sys.modules.get(handler_cls.__module__) or importlib.import_module(handler_cls.__module__)


def _meta_get(sim_id: str, session_key: str) -> dict[str, Any]:
    return dict(_NODE_META.get((sim_id, session_key), {}))


def _meta_set(sim_id: str, session_key: str, cfg: dict[str, Any], patch_only: dict[str, Any] | None = None) -> None:
    cur = _NODE_META.setdefault((sim_id, session_key), {})
    if patch_only is not None:
        cur.update(copy.deepcopy(patch_only))
    else:
        for k in (
            "security", "channel", "channel5g", "bandwidth", "gatewayIp",
            "opMode", "meshRole", "wanIp", "wanMask", "wanGateway", "wanDns1",
            "wanDns2", "meshNodes", "clients", "ssid5g", "password",
        ):
            if k in cfg:
                cur[k] = copy.deepcopy(cfg[k])


# ---------------------------------------------------------------------------
# Shared Helpers for Specific Simulator Families
# ---------------------------------------------------------------------------

def _get_zte_xml_store(mod, session_key: str):
    cs_mod = sys.modules[mod.STORE.__module__]
    cs_mod.bind_user(session_key)
    return cs_mod, cs_mod.get_user_store(session_key)


def _zte_xml_tag_items(store, tag: str) -> list[dict[str, Any]]:
    real_tag = store._resolve_tag(tag) if hasattr(store, "_resolve_tag") else tag
    if hasattr(store, "_generic_values"):
        return store._generic_values.get(real_tag, [])
    if hasattr(store, "_values"):
        return store._values.get(real_tag, [])
    return []


def _zte_xml_read_inst(store, tag: str, target_inst_id: str) -> dict[str, str]:
    items = _zte_xml_tag_items(store, tag)
    cur = None
    out: dict[str, str] = {}
    for item in items:
        if item.get("name") == "_InstID":
            cur = item.get("value")
            if out and cur != target_inst_id:
                break
        if cur == target_inst_id:
            out[item["name"]] = str(item.get("value", ""))
    return out


def _zte_xml_write_inst(store, tag: str, target_inst_id: str, fields: dict[str, Any]) -> bool:
    items = _zte_xml_tag_items(store, tag)
    cur = None
    updated = False
    with store._lock:
        for item in items:
            if item.get("name") == "_InstID":
                cur = item.get("value")
            if cur == target_inst_id and item["name"] in fields:
                item["value"] = str(fields[item["name"]])
                updated = True
    return updated


def _ensure_be12000_user_sim(mod, session_key: str) -> dict[str, Any]:
    with mod._SIM_LOCK:
        if session_key not in mod._USER_SIMS:
            raw_safe = "".join(c for c in session_key if c.isalnum() or c in ("-", "_")) or "default"
            if len(raw_safe) > 40:
                import hashlib
                safe_id = raw_safe[:22] + "_" + hashlib.sha1(session_key.encode("utf-8")).hexdigest()[:12]
            else:
                safe_id = raw_safe
            state_dir = os.path.join(mod.THU_MUC, "state")
            os.makedirs(state_dir, exist_ok=True)
            user_state_file = os.path.join(state_dir, f"user-{safe_id}.json")
            store = mod.ConfigStore(user_state_file, mod.FACTORY)
            session = mod.Session("admin", "admin")
            disp = mod.Dispatcher(mod.THU_MUC, store, session, mod._CGI_MAP_OBJ)
            mod._USER_SIMS[session_key] = {
                "store": store,
                "session": session,
                "disp": disp,
                "chi_tiet": False,
                "last_active": time.time(),
                "state_file": user_state_file,
            }
        sim = mod._USER_SIMS[session_key]
        sim["last_active"] = time.time()
        return sim


# ---------------------------------------------------------------------------
# All 16 Simulator Adapters (Read + Write + Reset)
# ---------------------------------------------------------------------------

def _be12000_get_inst(store, ten_obj: str, inst_id: str | None = None) -> dict[str, Any]:
    insts = store.instances(ten_obj) if hasattr(store, "instances") else []
    if inst_id is not None and hasattr(store, "chi_so_theo_instid"):
        idx = store.chi_so_theo_instid(ten_obj, inst_id)
        if idx is not None and 0 <= idx < len(insts):
            return dict(insts[idx])
    return dict(insts[0]) if insts else {}


def _be12000_set_inst(store, ten_obj: str, inst_id: str | None, fields: dict[str, Any]) -> None:
    idx = None
    if inst_id is not None and hasattr(store, "chi_so_theo_instid"):
        idx = store.chi_so_theo_instid(ten_obj, inst_id)
    if idx is not None:
        store.ghi(ten_obj, fields, inst=idx)
    else:
        store.ghi(ten_obj, fields, inst=0)


def _write_be12000(mod, session_key: str, cfg: dict[str, Any], mode: str) -> None:
    sim = _ensure_be12000_user_sim(mod, session_key)
    store = sim["store"]
    if mode == "router_wan":
        _be12000_set_inst(store, "ID_WAN_COMFIG", None, {
            "IPAddress": cfg["wanIp"],
            "SubnetMask": cfg["wanMask"],
            "GateWay": cfg["wanGateway"],
            "DNS1": cfg["wanDns1"],
            "DNS2": cfg["wanDns2"],
            "TransType": "DHCP",
            "mode": "route",
        })
        store.luu()
        _meta_set("sim_be12000", session_key, cfg, {
            "wanIp": cfg["wanIp"], "wanMask": cfg["wanMask"], "wanGateway": cfg["wanGateway"],
            "wanDns1": cfg["wanDns1"], "wanDns2": cfg["wanDns2"], "opMode": cfg.get("opMode") or "router",
        })
        return

    _be12000_set_inst(store, "OBJ_Br0AndDhcpsHosCfg_ID", "IGD", {
        "IPAddr": cfg["lanIp"],
        "SubMask": cfg["netmask"],
        "SubnetMask": cfg["netmask"],
        "ServerEnable": "1" if cfg["dhcpEnable"] else "0",
        "MinAddress": cfg["dhcpStart"],
        "MaxAddress": cfg["dhcpEnd"],
        "LeaseTime": cfg["dhcpLease"],
        "DNSServer1": cfg["dns1"],
        "DNSServer2": cfg["dns2"],
        "DnsServerSource": "1",
    })
    _be12000_set_inst(store, "OBJ_LANDNS_ID", "IGD", {"Ipv4DnsOrigin": "0", "IPv4AssignLANIP": "0"})
    sec_fields = _zte_sec_tuple(cfg["security"])
    for ap_id, band_ssid in (("DEV.WIFI.AP1", cfg["ssid"]), ("DEV.WIFI.AP5", cfg["ssid5g"]), ("DEV.WIFI.AP9", cfg["ssid5g"])):
        _be12000_set_inst(store, "OBJ_WLANAP_ID", ap_id, {"Enable": "1", "ESSID": band_ssid, **sec_fields})
    for psk_id in ("DEV.WIFI.AP1.PSK1", "DEV.WIFI.AP5.PSK1", "DEV.WIFI.AP9.PSK1"):
        _be12000_set_inst(store, "OBJ_WLANPSK_ID", psk_id, {"KeyPassphrase": cfg["password"]})
    auto_ch = "1" if cfg["channel"].lower() == "auto" else "0"
    _be12000_set_inst(store, "OBJ_WLANSETTING_ID", "DEV.WIFI.RD1", {
        "Channel": "1" if auto_ch == "1" else cfg["channel"],
        "AutoChannelEnabled": auto_ch,
        "BandWidth": cfg["bandwidth"] if cfg["bandwidth"] in ("20MHz", "40MHz", "Auto") else "20MHz",
    })
    _be12000_set_inst(store, "OBJ_WLANSETTING_ID", "DEV.WIFI.RD2", {
        "Channel": "36" if auto_ch == "1" else cfg["channel5g"],
        "AutoChannelEnabled": auto_ch,
        "BandWidth": cfg["bandwidth"],
    })
    if hasattr(store, "cap_nhat_topology_mesh"):
        store.cap_nhat_topology_mesh(cfg["meshNodes"], cfg["clients"], {
            "lan_ip": cfg["lanIp"], "subnet_mask": cfg["netmask"],
            "dhcp_start": cfg["dhcpStart"], "dhcp_end": cfg["dhcpEnd"],
            "primary_dns": cfg["dns1"], "secondary_dns": cfg["dns2"],
            "lease_time": cfg["dhcpLease"], "dhcp_enable": "1" if cfg["dhcpEnable"] else "0",
        })
    store.luu()
    _meta_set("sim_be12000", session_key, cfg)


def _read_be12000(mod, session_key: str) -> dict[str, Any]:
    sim = _ensure_be12000_user_sim(mod, session_key)
    store = sim["store"]
    meta = _meta_get("sim_be12000", session_key)
    br = _be12000_get_inst(store, "OBJ_Br0AndDhcpsHosCfg_ID", "IGD")
    ap1 = _be12000_get_inst(store, "OBJ_WLANAP_ID", "DEV.WIFI.AP1")
    ap5 = _be12000_get_inst(store, "OBJ_WLANAP_ID", "DEV.WIFI.AP5")
    psk1 = _be12000_get_inst(store, "OBJ_WLANPSK_ID", "DEV.WIFI.AP1.PSK1")
    rd2 = _be12000_get_inst(store, "OBJ_WLANSETTING_ID", "DEV.WIFI.RD2")
    wan0 = _be12000_get_inst(store, "ID_WAN_COMFIG", None)
    beacon = ap1.get("BeaconType") or "WPAand11i"
    sec = meta.get("security") or ("WPA3-SAE" if "WPA3" in beacon else ("Open" if beacon == "None" else "WPA2/WPA3-PSK"))
    raw = {
        "ssid": ap1.get("ESSID") or "ZTE_2.4G_DEMO01",
        "ssid5g": ap5.get("ESSID") or ap1.get("ESSID") or "ZTE_5G_DEMO01",
        "password": meta.get("password") or psk1.get("KeyPassphrase") or "12345678",
        "security": sec,
        "channel": meta.get("channel") or ("auto" if rd2.get("AutoChannelEnabled") == "1" else rd2.get("Channel", "auto")),
        "bandwidth": meta.get("bandwidth") or rd2.get("BandWidth") or "80MHz",
        "lanIp": br.get("IPAddr") or "192.168.1.1",
        "netmask": br.get("SubMask") or br.get("SubnetMask") or "255.255.255.0",
        "dhcpEnable": br.get("ServerEnable", "1") != "0",
        "dhcpStart": br.get("MinAddress") or "192.168.1.2",
        "dhcpEnd": br.get("MaxAddress") or "192.168.1.254",
        "dhcpLease": br.get("LeaseTime") or "86400",
        "dns1": br.get("DNSServer1") or "192.168.1.1",
        "dns2": br.get("DNSServer2") or "0.0.0.0",
        "wanIp": wan0.get("IPAddress") or "",
        "wanMask": wan0.get("SubnetMask") or "",
        "wanGateway": wan0.get("GateWay") or "",
        "wanDns1": wan0.get("DNS1") or "",
        "wanDns2": wan0.get("DNS2") or "",
        **meta,
    }
    return _to_frontend_contract(raw)


def _write_be15000(mod, session_key: str, cfg: dict[str, Any], mode: str) -> None:
    import mesh_zte_engine
    if mode == "router_wan":
        st = mesh_zte_engine._st_for(session_key)
        st["wan_ip"] = cfg["wanIp"]
        st["wan_mask"] = cfg["wanMask"]
        st["wan_gateway"] = cfg["wanGateway"]
        st["wan_dns1"] = cfg["wanDns1"]
        st["wan_dns2"] = cfg["wanDns2"]
        _meta_set("sim_be15000", session_key, cfg, {
            "wanIp": cfg["wanIp"], "wanMask": cfg["wanMask"], "wanGateway": cfg["wanGateway"],
            "wanDns1": cfg["wanDns1"], "wanDns2": cfg["wanDns2"], "opMode": cfg.get("opMode") or "router",
        })
        return

    mesh_zte_engine.sync_topology_nodes(
        slaves=cfg["meshNodes"],
        clients=cfg["clients"],
        ssid=cfg["ssid"],
        key=cfg["password"],
        security=cfg["security"],
        channel=cfg["channel"],
        bandwidth=cfg["bandwidth"],
        gateway_ip=cfg.get("gatewayIp") or cfg["lanIp"],
        lan_config={
            "lan_ip": cfg["lanIp"],
            "ap_lan_ip": cfg["lanIp"],
            "subnet_mask": cfg["netmask"],
            "dhcp_start": cfg["dhcpStart"],
            "dhcp_end": cfg["dhcpEnd"],
            "primary_dns": cfg["dns1"],
            "secondary_dns": cfg["dns2"],
            "lease_time": cfg["dhcpLease"],
            "dhcp_enable": "1" if cfg["dhcpEnable"] else "0",
            "isp_dns": "0",
        },
        session_id=session_key,
    )
    _meta_set("sim_be15000", session_key, cfg)


def _read_be15000(mod, session_key: str) -> dict[str, Any]:
    import mesh_zte_engine
    st = mesh_zte_engine.get_state(session_id=session_key)
    meta = _meta_get("sim_be15000", session_key)
    raw = {
        "ssid": st.get("ap_synced_ssid") or st.get("ont_wifi_ssid") or "FPT_Telecom_WiFi7",
        "ssid5g": st.get("ap_synced_ssid") or st.get("ont_wifi_ssid") or "FPT_Telecom_WiFi7",
        "password": st.get("ap_synced_key") or st.get("ont_wifi_key") or "12345678",
        "security": st.get("ap_synced_security") or st.get("ont_wifi_security") or "WPA2/WPA3-PSK",
        "channel": st.get("ap_synced_channel") or st.get("ont_wifi_channel") or "auto",
        "bandwidth": st.get("ap_synced_bandwidth") or st.get("ont_wifi_bandwidth") or "80MHz",
        "lanIp": meta.get("lanIp") or st.get("ont_lan_ip") or "192.168.1.1",
        "netmask": st.get("ont_subnet_mask") or st.get("subnet_mask") or "255.255.255.0",
        "dhcpEnable": str(st.get("ont_dhcp_enable", st.get("dhcp_enable", "1"))) != "0",
        "dhcpStart": st.get("ont_dhcp_start") or st.get("dhcp_start") or "192.168.1.2",
        "dhcpEnd": st.get("ont_dhcp_end") or st.get("dhcp_end") or "192.168.1.254",
        "dhcpLease": str(st.get("ont_lease_time") or st.get("lease_time") or "86400"),
        "dns1": st.get("ont_primary_dns") or st.get("primary_dns") or "192.168.1.1",
        "dns2": st.get("ont_secondary_dns") or st.get("secondary_dns") or "8.8.8.8",
        "meshNodes": st.get("custom_slaves") or st.get("mesh_nodes") or [],
        "clients": st.get("custom_clients") or st.get("clients") or [],
        "wanIp": st.get("wan_ip") or meta.get("wanIp") or "",
        "wanGateway": st.get("wan_gateway") or meta.get("wanGateway") or "",
        "wanDns1": st.get("wan_dns1") or meta.get("wanDns1") or "",
        "wanDns2": st.get("wan_dns2") or meta.get("wanDns2") or "",
        **meta,
    }
    return _to_frontend_contract(raw)


def _write_ax3000s(mod, session_key: str, cfg: dict[str, Any], mode: str) -> None:
    if mode == "router_wan":
        mod.update_client_state(session_key, {
            "wan": {
                "ipaddr": cfg["wanIp"], "netmask": cfg["wanMask"],
                "gateway": cfg["wanGateway"], "dns1": cfg["wanDns1"], "dns2": cfg["wanDns2"],
            }
        })
        _meta_set("sim_ax3000s", session_key, cfg, {
            "wanIp": cfg["wanIp"], "wanMask": cfg["wanMask"], "wanGateway": cfg["wanGateway"],
            "wanDns1": cfg["wanDns1"], "wanDns2": cfg["wanDns2"], "opMode": cfg.get("opMode") or "router",
        })
        return

    st = mod.get_client_state(session_key)
    radios = copy.deepcopy(st.get("radios", []))
    for idx, r in enumerate(radios):
        r["ssid"] = cfg["ssid5g"] if idx > 0 else cfg["ssid"]
        r["password"] = cfg["password"]
        r["security"] = cfg["security"]
        r["channel"] = cfg["channel"] if idx == 0 else cfg["channel5g"]
        r["bandwidth"] = cfg["bandwidth"]
    mod.update_client_state(session_key, {
        "lan": {
            "ipaddr": cfg["lanIp"], "netmask": cfg["netmask"],
            "dhcp_enable": cfg["dhcpEnable"],
            "dhcp_start": cfg["dhcpStart"], "dhcp_end": cfg["dhcpEnd"],
            "dhcp_lease": _parse_int(cfg["dhcpLease"], 86400),
            "dns1": cfg["dns1"], "dns2": cfg["dns2"],
        },
        "radios": radios,
        "mesh": {"enable": True, "role": cfg["meshRole"], "nodes": cfg["meshNodes"]},
        "clients": cfg["clients"],
    })
    _meta_set("sim_ax3000s", session_key, cfg)


def _read_ax3000s(mod, session_key: str) -> dict[str, Any]:
    st = mod.get_client_state(session_key)
    meta = _meta_get("sim_ax3000s", session_key)
    lan = st.get("lan", {})
    wan = st.get("wan", {})
    radios = st.get("radios", [])
    r0 = radios[0] if len(radios) > 0 else {}
    r1 = radios[1] if len(radios) > 1 else r0
    mesh = st.get("mesh", {})
    raw = {
        "ssid": r0.get("ssid") or "FPT_AX3000S",
        "ssid5g": r1.get("ssid") or r0.get("ssid") or "FPT_AX3000S",
        "password": r0.get("password") or "12345678",
        "security": r0.get("security") or "WPA2/WPA3-PSK",
        "channel": r0.get("channel") or "auto",
        "bandwidth": r1.get("bandwidth") or r0.get("bandwidth") or "80MHz",
        "lanIp": lan.get("ipaddr") or "192.168.1.1",
        "netmask": lan.get("netmask") or "255.255.255.0",
        "dhcpEnable": lan.get("dhcp_enable", True),
        "dhcpStart": lan.get("dhcp_start") or "192.168.1.100",
        "dhcpEnd": lan.get("dhcp_end") or "192.168.1.200",
        "dhcpLease": str(lan.get("dhcp_lease") or "86400"),
        "dns1": lan.get("dns1") or "8.8.8.8",
        "dns2": lan.get("dns2") or "8.8.4.4",
        "wanIp": wan.get("ipaddr") or "",
        "wanMask": wan.get("netmask") or "",
        "wanGateway": wan.get("gateway") or "",
        "wanDns1": wan.get("dns1") or "",
        "wanDns2": wan.get("dns2") or "",
        "meshRole": mesh.get("role") or "Agent",
        "meshNodes": mesh.get("nodes") or [],
        "clients": st.get("clients") or [],
        **meta,
    }
    return _to_frontend_contract(raw)


def _write_ax3000gz(mod, session_key: str, cfg: dict[str, Any], mode: str) -> None:
    if mode == "router_wan":
        mod.update_client_state(session_key, {
            "wan": {
                "ipaddr": cfg["wanIp"], "netmask": cfg["wanMask"],
                "gateway": cfg["wanGateway"], "dns1": cfg["wanDns1"], "dns2": cfg["wanDns2"],
            }
        })
        _meta_set("sim_ax3000gz", session_key, cfg, {
            "wanIp": cfg["wanIp"], "wanMask": cfg["wanMask"], "wanGateway": cfg["wanGateway"],
            "wanDns1": cfg["wanDns1"], "wanDns2": cfg["wanDns2"], "opMode": cfg.get("opMode") or "router",
        })
        return

    enc = "sae-mixed" if "WPA3" in cfg["security"] else ("psk2+ccmp" if cfg["security"] != "Open" else "none")
    mod.update_client_state(session_key, {
        "lan": {
            "ipaddr": cfg["lanIp"], "netmask": cfg["netmask"],
            "dhcp_enable": cfg["dhcpEnable"],
            "start": cfg["dhcpStart"], "end": cfg["dhcpEnd"],
            "leasetime": str(cfg["dhcpLease"]),
            "Primary_DNS": cfg["dns1"], "Secondary_DNS": cfg["dns2"],
        },
        "wlan24": {
            "Enable": "1", "SSID": cfg["ssid"], "KeyPassphrase": cfg["password"],
            "encryption": enc, "Channel": cfg["channel"], "BandWidth": cfg["bandwidth"],
        },
        "wlan5": {
            "Enable": "1", "SSID": cfg["ssid5g"], "KeyPassphrase": cfg["password"],
            "encryption": enc, "Channel": cfg["channel5g"], "BandWidth": cfg["bandwidth"],
        },
        "mesh": {"enable": True, "role": cfg["meshRole"], "nodes": cfg["meshNodes"]},
        "clients": cfg["clients"],
    })
    _meta_set("sim_ax3000gz", session_key, cfg)


def _read_ax3000gz(mod, session_key: str) -> dict[str, Any]:
    st = mod.get_client_state(session_key)
    meta = _meta_get("sim_ax3000gz", session_key)
    lan = st.get("lan", {})
    wan = st.get("wan", {})
    w2 = st.get("wlan24", {})
    w5 = st.get("wlan5", {})
    mesh = st.get("mesh", {})
    raw = {
        "ssid": w2.get("SSID") or "FPT_AX3000GZ",
        "ssid5g": w5.get("SSID") or w2.get("SSID") or "FPT_AX3000GZ",
        "password": w2.get("KeyPassphrase") or "12345678",
        "security": _normalize_security(w2.get("encryption")),
        "channel": w2.get("Channel") or "auto",
        "bandwidth": w5.get("BandWidth") or w2.get("BandWidth") or "80MHz",
        "lanIp": lan.get("ipaddr") or "192.168.1.1",
        "netmask": lan.get("netmask") or "255.255.255.0",
        "dhcpEnable": lan.get("dhcp_enable", True),
        "dhcpStart": lan.get("start") or "192.168.1.100",
        "dhcpEnd": lan.get("end") or "192.168.1.200",
        "dhcpLease": str(lan.get("leasetime") or "86400"),
        "dns1": lan.get("Primary_DNS") or "8.8.8.8",
        "dns2": lan.get("Secondary_DNS") or "8.8.4.4",
        "wanIp": wan.get("ipaddr") or "",
        "wanMask": wan.get("netmask") or "",
        "wanGateway": wan.get("gateway") or "",
        "wanDns1": wan.get("dns1") or "",
        "wanDns2": wan.get("dns2") or "",
        "meshRole": mesh.get("role") or "Agent",
        "meshNodes": mesh.get("nodes") or [],
        "clients": st.get("clients") or [],
        **meta,
    }
    return _to_frontend_contract(raw)


def _write_zte_xml(sim_id: str, mod, session_key: str, cfg: dict[str, Any], mode: str) -> None:
    _, store = _get_zte_xml_store(mod, session_key)
    if mode == "router_wan":
        _zte_xml_write_inst(store, "wan_internet_lua.lua", "IGD.WD1.WCD1.WCPPP1", {
            "IPAddress": cfg["wanIp"], "SubnetMask": cfg["wanMask"],
            "GateWay": cfg["wanGateway"], "DNS1": cfg["wanDns1"], "DNS2": cfg["wanDns2"],
            "TransType": "DHCP", "wantype": "dhcp", "mode": "route",
        })
        _meta_set(sim_id, session_key, cfg, {
            "wanIp": cfg["wanIp"], "wanMask": cfg["wanMask"], "wanGateway": cfg["wanGateway"],
            "wanDns1": cfg["wanDns1"], "wanDns2": cfg["wanDns2"], "opMode": cfg.get("opMode") or "router",
        })
        return

    _zte_xml_write_inst(store, "Localnet_LanMgrIpv4_DHCPBasicCfg_lua.lua", "IGD", {
        "IPAddr": cfg["lanIp"], "SubMask": cfg["netmask"], "SubnetMask": cfg["netmask"],
        "ServerEnable": "1" if cfg["dhcpEnable"] else "0",
        "MinAddress": cfg["dhcpStart"], "MaxAddress": cfg["dhcpEnd"],
        "LeaseTime": cfg["dhcpLease"],
        "DNSServer1": cfg["dns1"], "DNSServer2": cfg["dns2"],
        "DnsServerSource": "1", "Ipv4DnsOrigin": "0",
    })
    store.update_values("dns_localdns_lua.lua", {
        "SerIPAddress1": cfg["dns1"], "SerIPAddress2": cfg["dns2"],
    })
    sec_fields = _zte_sec_tuple(cfg["security"])
    for ap_id, band_ssid in (("DEV.WIFI.AP1", cfg["ssid"]), ("DEV.WIFI.AP5", cfg["ssid5g"])):
        _zte_xml_write_inst(store, "wlan_wlansssidconf_lua.lua", ap_id, {"Enable": "1", "ESSID": band_ssid, **sec_fields})
    for psk_id in ("DEV.WIFI.AP1.PSK1", "DEV.WIFI.AP5.PSK1"):
        _zte_xml_write_inst(store, "wlan_wlansssidconf_lua.lua", psk_id, {"KeyPassphrase": cfg["password"]})
    _zte_xml_write_inst(store, "wlan_wlanbasicadconf_lua.lua", "DEV.WIFI.RD1", {
        "Channel": "Auto" if cfg["channel"] == "auto" else cfg["channel"],
        "BandWidth": "20MHz" if "80" in cfg["bandwidth"] or "160" in cfg["bandwidth"] else cfg["bandwidth"],
    })
    _zte_xml_write_inst(store, "wlan_wlanbasicadconf_lua.lua", "DEV.WIFI.RD2", {
        "Channel": "Auto" if cfg["channel"] == "auto" else cfg["channel5g"],
        "BandWidth": cfg["bandwidth"],
    })
    _meta_set(sim_id, session_key, cfg)


def _read_zte_xml(sim_id: str, mod, session_key: str) -> dict[str, Any]:
    _, store = _get_zte_xml_store(mod, session_key)
    meta = _meta_get(sim_id, session_key)
    lan = _zte_xml_read_inst(store, "Localnet_LanMgrIpv4_DHCPBasicCfg_lua.lua", "IGD")
    ap1 = _zte_xml_read_inst(store, "wlan_wlansssidconf_lua.lua", "DEV.WIFI.AP1")
    ap5 = _zte_xml_read_inst(store, "wlan_wlansssidconf_lua.lua", "DEV.WIFI.AP5")
    psk1 = _zte_xml_read_inst(store, "wlan_wlansssidconf_lua.lua", "DEV.WIFI.AP1.PSK1")
    rd2 = _zte_xml_read_inst(store, "wlan_wlanbasicadconf_lua.lua", "DEV.WIFI.RD2")
    wan = _zte_xml_read_inst(store, "wan_internet_lua.lua", "IGD.WD1.WCD1.WCPPP1")
    raw = {
        "ssid": ap1.get("ESSID") or "FPT-Telecom",
        "ssid5g": ap5.get("ESSID") or ap1.get("ESSID") or "FPT-Telecom",
        "password": meta.get("password") or psk1.get("KeyPassphrase") or "12345678",
        "security": meta.get("security") or _normalize_security(ap1.get("BeaconType")),
        "channel": meta.get("channel") or rd2.get("Channel") or "auto",
        "bandwidth": meta.get("bandwidth") or rd2.get("BandWidth") or "80MHz",
        "lanIp": lan.get("IPAddr") or "192.168.1.1",
        "netmask": lan.get("SubMask") or lan.get("SubnetMask") or "255.255.255.0",
        "dhcpEnable": lan.get("ServerEnable", "1") != "0",
        "dhcpStart": lan.get("MinAddress") or "192.168.1.2",
        "dhcpEnd": lan.get("MaxAddress") or "192.168.1.254",
        "dhcpLease": lan.get("LeaseTime") or "86400",
        "dns1": lan.get("DNSServer1") or "192.168.1.1",
        "dns2": lan.get("DNSServer2") or "0.0.0.0",
        "wanIp": wan.get("IPAddress") or "",
        "wanMask": wan.get("SubnetMask") or "",
        "wanGateway": wan.get("GateWay") or "",
        "wanDns1": wan.get("DNS1") or "",
        "wanDns2": wan.get("DNS2") or "",
        **meta,
    }
    return _to_frontend_contract(raw)


def _write_ax3000c(mod, session_key: str, cfg: dict[str, Any], mode: str) -> None:
    kho_mod = sys.modules.get("ax3000c_kho_cau_hinh") or importlib.import_module("simulators.sim_ax3000c.fw_053.src.ax3000c_kho_cau_hinh")
    k_bare = session_key.replace("cookie:", "")
    target_keys = (k_bare, "cookie:" + k_bare) if k_bare else (session_key,)
    for sk in target_keys:
        kho = kho_mod._kho_cua_ktv(sk)
        if mode == "router_wan":
            wan_doc = copy.deepcopy(kho.doc("data_repo.weboui.wan_get") or {"wan": {}})
            wan_sec = wan_doc.setdefault("wan", {})
            wan_sec["ipaddr"] = cfg["wanIp"]
            wan_sec["netmask"] = cfg["wanMask"]
            wan_sec["gateway"] = cfg["wanGateway"]
            wan_sec["proto"] = "dhcp"
            kho.ghi("data_repo.weboui.wan_get", wan_doc)
            _meta_set("sim_ax3000c", sk, cfg, {
                "wanIp": cfg["wanIp"], "wanMask": cfg["wanMask"], "wanGateway": cfg["wanGateway"],
                "wanDns1": cfg["wanDns1"], "wanDns2": cfg["wanDns2"], "opMode": cfg.get("opMode") or "router",
            })
            continue

        lan_doc = copy.deepcopy(kho.doc("data_repo.weboui.lan_get") or {"lan": {}})
        lan_sec = lan_doc.setdefault("lan", {})
        lan_sec["ipaddr"] = cfg["lanIp"]
        lan_sec["netmask"] = cfg["netmask"]
        lan_sec["startaddr"] = cfg["dhcpStart"]
        lan_sec["endaddr"] = cfg["dhcpEnd"]
        lan_sec["leasetime"] = str(cfg["dhcpLease"])
        lan_sec["dns1"] = cfg["dns1"]
        lan_sec["dns2"] = cfg["dns2"]
        kho.ghi("data_repo.weboui.lan_get", lan_doc)

        wifi_doc = copy.deepcopy(kho.doc("data_repo.weboui.wifi_get") or {"host": {"2G": {}, "5G": {}}})
        host = wifi_doc.setdefault("host", {})
        is_sae = "1" if "WPA3" in cfg["security"] else "0"
        enc = "none" if cfg["security"] == "Open" else "psk2+ccmp"
        for band, b_ssid in (("2G", cfg["ssid"]), ("5G", cfg["ssid5g"])):
            b = host.setdefault(band, {})
            b["disabled"] = False
            b["ssid"] = b_ssid
            b["key"] = cfg["password"]
            b["encryption"] = enc
            b["sae"] = is_sae
        kho.ghi("data_repo.weboui.wifi_get", wifi_doc)

        adv_doc = copy.deepcopy(kho.doc("data_repo.weboui.wifiadv_get") or {"adv": {"2G": {}, "5G": {}}})
        adv = adv_doc.setdefault("adv", {})
        for band, ch in (("2G", cfg["channel"]), ("5G", cfg["channel5g"])):
            b = adv.setdefault(band, {})
            b["channel"] = ch
            b["htmode"] = _openwrt_htmode(cfg["bandwidth"], band == "5G")
        kho.ghi("data_repo.weboui.wifiadv_get", adv_doc)

        kho.ghi("network.wireless.easymesh.get", {
            "MeshEnabled": True,
            "MeshRole": cfg["meshRole"],
            "MeshBand": "5G",
            "MeshBSS": f"{cfg['ssid']}BH",
        })

        if cfg["meshNodes"]:
            topo = {}
            for idx, sl in enumerate(cfg["meshNodes"]):
                mac = str(sl.get("mac") or f"94:F7:17:24:0A:{10 + idx:02X}")
                topo[mac] = {
                    "mapdevice": "true",
                    "ip": sl.get("ip") or "",
                    "hostname": sl.get("name") or f"AP-{idx + 1}",
                    "modelname": sl.get("model") or "Mesh-Node",
                    "backhaul": sl.get("backhaul") or "Ethernet",
                }
            kho.ghi("network.topology", topo)

        if cfg["clients"]:
            leases = [
                {
                    "expires": _parse_int(cfg["dhcpLease"], 86400),
                    "macaddr": c.get("mac") or "00:00:00:00:00:00",
                    "ipaddr": c.get("ip") or "",
                    "hostname": c.get("name") or "Client",
                }
                for c in cfg["clients"]
            ]
            arps = [
                {"device": "br-lan", "macaddr": c.get("mac") or "", "ipaddr": c.get("ip") or ""}
                for c in cfg["clients"]
            ]
            kho.ghi("oui.network.dhcp_leases", {"leases": leases})
            kho.ghi("oui.network.arp_table", {"entries": arps})

        _meta_set("sim_ax3000c", sk, cfg)


def _read_ax3000c(mod, session_key: str) -> dict[str, Any]:
    kho_mod = sys.modules.get("ax3000c_kho_cau_hinh") or importlib.import_module("simulators.sim_ax3000c.fw_053.src.ax3000c_kho_cau_hinh")
    k_bare = session_key.replace("cookie:", "")
    kho = kho_mod._kho_cua_ktv(k_bare)
    if not ((kho.doc("data_repo.weboui.wifi_get") or {}).get("host") or (kho.doc("data_repo.weboui.lan_get") or {}).get("lan")):
        kho_c = kho_mod._kho_cua_ktv("cookie:" + k_bare)
        if (kho_c.doc("data_repo.weboui.wifi_get") or {}).get("host") or (kho_c.doc("data_repo.weboui.lan_get") or {}).get("lan"):
            kho = kho_c
    meta = _meta_get("sim_ax3000c", k_bare) or _meta_get("sim_ax3000c", session_key)
    lan = (kho.doc("data_repo.weboui.lan_get") or {}).get("lan", {})
    wan = (kho.doc("data_repo.weboui.wan_get") or {}).get("wan", {})
    host = (kho.doc("data_repo.weboui.wifi_get") or {}).get("host", {})
    adv = (kho.doc("data_repo.weboui.wifiadv_get") or {}).get("adv", {})
    w2 = host.get("2G", {})
    w5 = host.get("5G", {})
    a5 = adv.get("5G", {})
    a2 = adv.get("2G", {})
    em = kho.doc("network.wireless.easymesh.get") or {}
    sec = "Open" if w2.get("encryption") == "none" else ("WPA2/WPA3-PSK" if str(w2.get("sae")) == "1" else "WPA2-PSK")
    raw = {
        "ssid": w2.get("ssid") or "FPT Telecom",
        "ssid5g": w5.get("ssid") or w2.get("ssid") or "FPT Telecom",
        "password": w2.get("key") or "12345678",
        "security": meta.get("security") or sec,
        "channel": str(a2.get("channel") or "auto"),
        "bandwidth": meta.get("bandwidth") or _normalize_bandwidth(a5.get("htmode") or a2.get("htmode")),
        "lanIp": lan.get("ipaddr") or "192.168.100.1",
        "netmask": lan.get("netmask") or "255.255.255.0",
        "dhcpStart": lan.get("startaddr") or "192.168.100.192",
        "dhcpEnd": lan.get("endaddr") or "192.168.101.183",
        "dhcpLease": str(lan.get("leasetime") or "86400"),
        "dns1": lan.get("dns1") or meta.get("dns1") or lan.get("ipaddr") or "192.168.100.1",
        "dns2": lan.get("dns2") or meta.get("dns2") or "8.8.8.8",
        "wanIp": wan.get("ipaddr") or "",
        "wanMask": wan.get("netmask") or "",
        "wanGateway": wan.get("gateway") or "",
        "meshRole": em.get("MeshRole") or "Agent",
        **meta,
    }
    return _to_frontend_contract(raw)


def _prplos_cs_module(sim_id: str, mod):
    if sim_id == "sim_be6500c":
        return sys.modules.get("simulators.sim_ONT_be6500c.src.config_store") or importlib.import_module("simulators.sim_ONT_be6500c.src.config_store")
    return sys.modules.get("simulators.ont_be6500c.src.config_store") or importlib.import_module("simulators.ont_be6500c.src.config_store")


def _write_prplos_be6500(sim_id: str, mod, session_key: str, cfg: dict[str, Any], mode: str) -> None:
    cs = _prplos_cs_module(sim_id, mod)
    cs.dat_nguoi_dung_hien_tai(session_key)
    ifaces = copy.deepcopy(cs.doc("interfaces/configurations") or [])

    if mode == "router_wan":
        updated_wan = False
        for iface in ifaces:
            iid = str(iface.get("id") or iface.get("name") or "").lower()
            if "wan" in iid:
                ipv4 = iface.setdefault("ipv4Settings", {})
                ipv4["ipAddress"] = cfg["wanIp"]
                ipv4["mask"] = cfg["wanMask"]
                ipv4["gateway"] = cfg["wanGateway"]
                ipv4["protocol"] = "dhcp"
                iface["dnsServers"] = [d for d in (cfg["wanDns1"], cfg["wanDns2"]) if d]
                updated_wan = True
        if not updated_wan:
            ifaces.append({
                "id": "wan", "name": "wan", "enabled": True,
                "dnsServers": [d for d in (cfg["wanDns1"], cfg["wanDns2"]) if d],
                "ipv4Settings": {
                    "ipAddress": cfg["wanIp"], "mask": cfg["wanMask"],
                    "gateway": cfg["wanGateway"], "protocol": "dhcp",
                },
            })
        cs.ghi("interfaces/configurations", ifaces)
        _meta_set(sim_id, session_key, cfg, {
            "wanIp": cfg["wanIp"], "wanMask": cfg["wanMask"], "wanGateway": cfg["wanGateway"],
            "wanDns1": cfg["wanDns1"], "wanDns2": cfg["wanDns2"], "opMode": cfg.get("opMode") or "router",
        })
        return

    sec_mode = "WPA3-Personal" if cfg["security"] == "WPA3-SAE" else (
        "None" if cfg["security"] == "Open" else "WPA3-Personal-Transition"
    )
    ssids = copy.deepcopy(cs.doc("ssids") or [])
    for item in ssids:
        radio = str(item.get("radio") or "")
        if item.get("isGuest") or "guest" in str(item.get("name", "")).lower():
            continue
        item["name"] = cfg["ssid"] if radio == "2.4G" else cfg["ssid5g"]
        item["passphrase"] = cfg["password"]
        item["securityMode"] = sec_mode
        item["enabled"] = True
    cs.ghi("ssids", ssids)

    radios = copy.deepcopy(cs.doc("radios") or [])
    is_auto = cfg["channel"].lower() == "auto"
    for r in radios:
        r["autoChannelEnabled"] = is_auto
        if not is_auto:
            ch_val = _parse_int(cfg["channel"] if r.get("band") == "2.4G" else cfg["channel5g"], 0)
            if ch_val:
                r["channel"] = ch_val
                r["channelInUse"] = ch_val
        r["bandwidth"] = "20MHz" if (r.get("band") == "2.4G" and "80" in cfg["bandwidth"]) else cfg["bandwidth"]
        r["bandwidthInUse"] = r["bandwidth"]
    cs.ghi("radios", radios)

    for iface in ifaces:
        if str(iface.get("id") or iface.get("name") or "").lower() == "lan":
            ipv4 = iface.setdefault("ipv4Settings", {})
            ipv4["ipAddress"] = cfg["lanIp"]
            ipv4["mask"] = cfg["netmask"]
            iface["dnsServers"] = [d for d in (cfg["dns1"], cfg["dns2"]) if d]
    cs.ghi("interfaces/configurations", ifaces)

    dhcps = copy.deepcopy(cs.doc("dhcp/servers") or [])
    for d in dhcps:
        if str(d.get("interfaceId") or "").lower() == "lan":
            ipv4 = d.setdefault("ipv4Settings", {})
            ipv4["enabled"] = cfg["dhcpEnable"]
            ipv4["startAddress"] = cfg["dhcpStart"]
            ipv4["endAddress"] = cfg["dhcpEnd"]
            ipv4["leaseTime"] = _parse_int(cfg["dhcpLease"], 86400)
            ipv4["dnsServers"] = [d_ip for d_ip in (cfg["dns1"], cfg["dns2"]) if d_ip]
            ipv4["autoDnsEnabled"] = False
    cs.ghi("dhcp/servers", dhcps)

    em = copy.deepcopy(cs.doc("easyMesh") or {})
    em["enabled"] = True
    em["role"] = cfg["meshRole"]
    cs.ghi("easyMesh", em)

    devs = copy.deepcopy(cs.doc("devices") or [])
    existing_macs = {d.get("macAddress"): i for i, d in enumerate(devs) if isinstance(d, dict)}
    for cl in cfg["clients"] + cfg["meshNodes"]:
        mac = cl.get("mac") or ""
        if not mac:
            continue
        rec = {
            "id": mac,
            "macAddress": mac,
            "hostName": cl.get("name") or "Mesh-Device",
            "ipv4Address": cl.get("ip") or "",
            "status": "Up",
            "interfaceType": cl.get("backhaul") or cl.get("band") or "Ethernet",
        }
        if mac in existing_macs:
            devs[existing_macs[mac]].update(rec)
        else:
            existing_macs[mac] = len(devs)
            devs.append(rec)
    if devs:
        cs.ghi("devices", devs)
    _meta_set(sim_id, session_key, cfg)


def _read_prplos_be6500(sim_id: str, mod, session_key: str) -> dict[str, Any]:
    cs = _prplos_cs_module(sim_id, mod)
    cs.dat_nguoi_dung_hien_tai(session_key)
    meta = _meta_get(sim_id, session_key)
    ssids = cs.doc("ssids") or []
    radios = cs.doc("radios") or []
    ifaces = cs.doc("interfaces/configurations") or []
    dhcps = cs.doc("dhcp/servers") or []
    em = cs.doc("easyMesh") or {}

    s2 = next((s for s in ssids if s.get("radio") == "2.4G"), ssids[0] if ssids else {})
    s5 = next((s for s in ssids if s.get("radio") == "5G"), s2)
    r5 = next((r for r in radios if r.get("band") == "5G"), radios[0] if radios else {})
    lan_if = next((i for i in ifaces if str(i.get("id") or i.get("name") or "").lower() == "lan"), {}).get("ipv4Settings", {})
    wan_obj = next((i for i in ifaces if "wan" in str(i.get("id") or i.get("name") or "").lower()), {})
    wan_if = wan_obj.get("ipv4Settings", {})
    dhcp_lan = next((d for d in dhcps if str(d.get("interfaceId") or "").lower() == "lan"), {}).get("ipv4Settings", {})
    dns_list = dhcp_lan.get("dnsServers") or []

    raw = {
        "ssid": s2.get("name") or "FPT Telecom",
        "ssid5g": s5.get("name") or s2.get("name") or "FPT Telecom",
        "password": s2.get("passphrase") or "12345678",
        "security": _normalize_security(s2.get("securityMode")),
        "channel": "auto" if r5.get("autoChannelEnabled", True) else str(r5.get("channel") or r5.get("channelInUse") or "auto"),
        "bandwidth": r5.get("bandwidth") or r5.get("bandwidthInUse") or "80MHz",
        "lanIp": lan_if.get("ipAddress") or "192.168.1.1",
        "netmask": lan_if.get("mask") or "255.255.255.0",
        "dhcpEnable": dhcp_lan.get("enabled", True),
        "dhcpStart": dhcp_lan.get("startAddress") or "192.168.1.2",
        "dhcpEnd": dhcp_lan.get("endAddress") or "192.168.1.254",
        "dhcpLease": str(dhcp_lan.get("leaseTime") or "86400"),
        "dns1": dns_list[0] if len(dns_list) > 0 else "192.168.1.1",
        "dns2": dns_list[1] if len(dns_list) > 1 else "8.8.8.8",
        "wanIp": wan_if.get("ipAddress") or "",
        "wanMask": wan_if.get("mask") or "",
        "wanGateway": wan_if.get("gateway") or "",
        "wanDns1": (wan_obj.get("dnsServers") or [""])[0] if wan_obj.get("dnsServers") else "",
        "meshRole": em.get("role") or "Agent",
        **meta,
    }
    return _to_frontend_contract(raw)


def _write_ac1000f(mod, session_key: str, cfg: dict[str, Any], mode: str) -> None:
    st = mod.get_client_state(session_key)
    lock = getattr(mod, "_STATE_LOCK", contextlib.nullcontext())
    with lock:
        if mode == "router_wan":
            st["wan_ipaddr"] = cfg["wanIp"]
            st["wan_netmask"] = cfg["wanMask"]
            st["wan_gateway"] = cfg["wanGateway"]
            st["wan_dns1"] = cfg["wanDns1"]
            st["wan_dns2"] = cfg["wanDns2"]
            _meta_set("sim_ac1000f", session_key, cfg, {
                "wanIp": cfg["wanIp"], "wanMask": cfg["wanMask"], "wanGateway": cfg["wanGateway"],
                "wanDns1": cfg["wanDns1"], "wanDns2": cfg["wanDns2"], "opMode": cfg.get("opMode") or "router",
            })
            return

        st["ESSID"] = cfg["ssid"]
        st["PreSharedKey1"] = cfg["password"]
        st["uiViewIPAddr"] = cfg["lanIp"]
        st["uiViewNetMask"] = cfg["netmask"]
        st["dhcpTypeRadio"] = "1" if cfg["dhcpEnable"] else "0"
        st["StartIp"] = cfg["dhcpStart"]
        st["EndIp"] = cfg["dhcpEnd"]
        st["dhcp_LeaseTime"] = str(cfg["dhcpLease"])
        st["dnsTypeRadio"] = "1"
        st["PrimaryDns"] = cfg["dns1"]
        st["SecondDns"] = cfg["dns2"]
    _meta_set("sim_ac1000f", session_key, cfg)


def _read_ac1000f(mod, session_key: str) -> dict[str, Any]:
    st = mod.get_client_state(session_key)
    meta = _meta_get("sim_ac1000f", session_key)
    raw = {
        "ssid": st.get("ESSID") or "FPT_Telecom",
        "ssid5g": st.get("ESSID") or "FPT_Telecom",
        "password": st.get("PreSharedKey1") or "12345678",
        "lanIp": st.get("uiViewIPAddr") or "192.168.1.1",
        "netmask": st.get("uiViewNetMask") or "255.255.255.0",
        "dhcpEnable": st.get("dhcpTypeRadio", "1") != "0",
        "dhcpStart": st.get("StartIp") or "192.168.1.2",
        "dhcpEnd": st.get("EndIp") or "192.168.1.254",
        "dhcpLease": str(st.get("dhcp_LeaseTime") or "86400"),
        "dns1": st.get("PrimaryDns") or "192.168.1.1",
        "dns2": st.get("SecondDns") or "8.8.8.8",
        "wanIp": st.get("wan_ipaddr") or "",
        "wanGateway": st.get("wan_gateway") or "",
        **meta,
    }
    return _to_frontend_contract(raw)


def _write_ax3000hv2(mod, session_key: str, cfg: dict[str, Any], mode: str) -> None:
    st = mod.get_client_state(session_key)
    lock = getattr(mod, "_STATE_LOCK", contextlib.nullcontext())
    with lock:
        if mode == "router_wan":
            st["wan_ipaddr"] = cfg["wanIp"]
            st["wan_netmask"] = cfg["wanMask"]
            st["wan_gateway"] = cfg["wanGateway"]
            st["wan_dns1"] = cfg["wanDns1"]
            st["wan_dns2"] = cfg["wanDns2"]
            _meta_set("sim_ax3000hv2", session_key, cfg, {
                "wanIp": cfg["wanIp"], "wanMask": cfg["wanMask"], "wanGateway": cfg["wanGateway"],
                "wanDns1": cfg["wanDns1"], "wanDns2": cfg["wanDns2"], "opMode": cfg.get("opMode") or "router",
            })
            return

        st["ESSID"] = cfg["ssid"]
        st["ESSID_5g"] = cfg["ssid5g"]
        st["wifi5SSid_2G"] = cfg["ssid"]
        st["wifi5SSid_5G"] = cfg["ssid5g"]
        st["PreSharedKey"] = cfg["password"]
        st["PreSharedKey_5g"] = cfg["password"]
        st["wifi5Pwd_2G"] = cfg["password"]
        st["wifi5Pwd_5G"] = cfg["password"]
        st["uiViewIPAddr"] = cfg["lanIp"]
        st["uiViewNetMask"] = cfg["netmask"]
        st["StartIp"] = cfg["dhcpStart"]
        st["PoolSize"] = str(_pool_size(cfg["dhcpStart"], cfg["dhcpEnd"]))
        st["dhcp_LeaseTime"] = str(cfg["dhcpLease"])
        st["dnsTypeRadio"] = "1"
        st["PrimaryDns"] = cfg["dns1"]
        st["SecondDns"] = cfg["dns2"]
    _meta_set("sim_ax3000hv2", session_key, cfg)


def _read_ax3000hv2(mod, session_key: str) -> dict[str, Any]:
    st = mod.get_client_state(session_key)
    meta = _meta_get("sim_ax3000hv2", session_key)
    start_ip = st.get("StartIp") or "192.168.1.2"
    end_ip = _end_ip_from_pool_size(start_ip, st.get("PoolSize", 100)) or "192.168.1.200"
    raw = {
        "ssid": st.get("ESSID") or st.get("wifi5SSid_2G") or "FPT_Telecom",
        "ssid5g": st.get("ESSID_5g") or st.get("ESSID") or "FPT_Telecom",
        "password": st.get("PreSharedKey") or st.get("wifi5Pwd_2G") or "12345678",
        "lanIp": st.get("uiViewIPAddr") or "192.168.1.1",
        "netmask": st.get("uiViewNetMask") or "255.255.255.0",
        "dhcpStart": start_ip,
        "dhcpEnd": meta.get("dhcpEnd") or end_ip,
        "dhcpLease": str(st.get("dhcp_LeaseTime") or "86400"),
        "dns1": st.get("PrimaryDns") or "192.168.1.1",
        "dns2": st.get("SecondDns") or "8.8.8.8",
        "wanIp": st.get("wan_ipaddr") or "",
        "wanGateway": st.get("wan_gateway") or "",
        **meta,
    }
    return _to_frontend_contract(raw)


def _write_ac1000hi(mod, session_key: str, cfg: dict[str, Any], mode: str) -> None:
    kho = mod.kho
    kho.dat_phien_hien_tai(session_key)
    if mode == "router_wan":
        wan = copy.deepcopy(kho.doc("home_wan") or {})
        wan["wan_StaticIPAddr"] = cfg["wanIp"]
        wan["wan_StaticIPSubMask"] = cfg["wanMask"]
        wan["wan_StaticIPGateway"] = cfg["wanGateway"]
        wan["wan_PrimaryDns"] = cfg["wanDns1"]
        wan["wan_SecondaryDns"] = cfg["wanDns2"]
        kho.ghi("home_wan", wan)
        _meta_set("sim_ac1000HI", session_key, cfg, {
            "wanIp": cfg["wanIp"], "wanMask": cfg["wanMask"], "wanGateway": cfg["wanGateway"],
            "wanDns1": cfg["wanDns1"], "wanDns2": cfg["wanDns2"], "opMode": cfg.get("opMode") or "router",
        })
        return

    lan = copy.deepcopy(kho.doc("lan") or {})
    lan["uiViewIPAddr"] = cfg["lanIp"]
    lan["uiViewNetMask"] = cfg["netmask"]
    lan["dhcpTypeRadio"] = "1" if cfg["dhcpEnable"] else "0"
    lan["StartIp"] = cfg["dhcpStart"]
    lan["PoolSize"] = str(_pool_size(cfg["dhcpStart"], cfg["dhcpEnd"]))
    lan["dhcp_LeaseTime"] = str(cfg["dhcpLease"])
    lan["dnsTypeRadio"] = "1"
    lan["PrimaryDns"] = cfg["dns1"]
    lan["SecondDns"] = cfg["dns2"]
    kho.ghi("lan", lan)

    for section, band_ssid, ch_val in (
        ("home_wireless", cfg["ssid"], cfg["channel"]),
        ("home_wireless_5g", cfg["ssid5g"], cfg["channel5g"]),
    ):
        wl = copy.deepcopy(kho.doc(section) or {})
        wl["wlan_APenable"] = "1"
        wl["ESSID"] = band_ssid
        wl["PreSharedKey1"] = cfg["password"]
        wl["CurrentChannel"] = "0" if ch_val == "auto" else ch_val
        wl["WLANChannelBandwidth"] = "1" if "40" in cfg["bandwidth"] or "80" in cfg["bandwidth"] else "0"
        kho.ghi(section, wl)

    if cfg["clients"]:
        leases = [
            {"ten": c.get("name") or "Client", "ip": c.get("ip") or "", "mac": c.get("mac") or "", "ngay": "0", "gio": "23:59:59"}
            for c in cfg["clients"]
        ]
        kho.ghi("dhcp_leases", leases)
    _meta_set("sim_ac1000HI", session_key, cfg)


def _read_ac1000hi(mod, session_key: str) -> dict[str, Any]:
    kho = mod.kho
    kho.dat_phien_hien_tai(session_key)
    meta = _meta_get("sim_ac1000HI", session_key)
    lan = kho.doc("lan") or {}
    w2 = kho.doc("home_wireless") or {}
    w5 = kho.doc("home_wireless_5g") or {}
    wan = kho.doc("home_wan") or {}
    start_ip = lan.get("StartIp") or "192.168.1.2"
    end_ip = _end_ip_from_pool_size(start_ip, lan.get("PoolSize", 100)) or "192.168.1.200"
    raw = {
        "ssid": w2.get("ESSID") or "FPT",
        "ssid5g": w5.get("ESSID") or w2.get("ESSID") or "FPT",
        "password": w2.get("PreSharedKey1") or meta.get("password") or "12345678",
        "lanIp": lan.get("uiViewIPAddr") or "192.168.1.1",
        "netmask": lan.get("uiViewNetMask") or "255.255.255.0",
        "dhcpEnable": lan.get("dhcpTypeRadio", "1") != "0",
        "dhcpStart": start_ip,
        "dhcpEnd": end_ip,
        "dhcpLease": str(lan.get("dhcp_LeaseTime") or "86400"),
        "dns1": lan.get("PrimaryDns") or "192.168.1.1",
        "dns2": lan.get("SecondDns") or "8.8.8.8",
        "wanIp": wan.get("wan_StaticIPAddr") or "",
        "wanGateway": wan.get("wan_StaticIPGateway") or "",
        **meta,
    }
    return _to_frontend_contract(raw)


def _write_ac1000cv2(mod, session_key: str, cfg: dict[str, Any], mode: str) -> None:
    kho = mod.KHO
    kho.bind(session_key)
    if mode == "router_wan":
        wan = copy.deepcopy(kho.doc("wan") or {})
        wan["ip"] = cfg["wanIp"]
        wan["netmask"] = cfg["wanMask"]
        wan["gateway"] = cfg["wanGateway"]
        wan["dns1"] = cfg["wanDns1"]
        wan["dns2"] = cfg["wanDns2"]
        kho.ghi("wan", wan)
        _meta_set("sim_ac1000cv2", session_key, cfg, {
            "wanIp": cfg["wanIp"], "wanMask": cfg["wanMask"], "wanGateway": cfg["wanGateway"],
            "wanDns1": cfg["wanDns1"], "wanDns2": cfg["wanDns2"], "opMode": cfg.get("opMode") or "router",
        })
        return

    kho.ghi("lan", {
        "ip": cfg["lanIp"], "mask": cfg["netmask"],
        "dhcp_enable": "1" if cfg["dhcpEnable"] else "0",
        "dhcp_start": cfg["dhcpStart"], "dhcp_end": cfg["dhcpEnd"],
        "dhcp_lease": str(cfg["dhcpLease"]),
        "dns_overwrite": "1", "dns_primary": cfg["dns1"], "dns_secondary": cfg["dns2"],
    })
    for sect, band_ssid, ch in (("wifi24", cfg["ssid"], cfg["channel"]), ("wifi5", cfg["ssid5g"], cfg["channel5g"])):
        w = copy.deepcopy(kho.doc(sect) or {})
        w["enable"] = "1"
        w["ssid"] = band_ssid
        w["password"] = cfg["password"]
        w["security"] = cfg["security"]
        w["channel"] = ch
        kho.ghi(sect, w)
    _meta_set("sim_ac1000cv2", session_key, cfg)


def _read_ac1000cv2(mod, session_key: str) -> dict[str, Any]:
    kho = mod.KHO
    kho.bind(session_key)
    meta = _meta_get("sim_ac1000cv2", session_key)
    lan = kho.doc("lan") or {}
    w2 = kho.doc("wifi24") or {}
    w5 = kho.doc("wifi5") or {}
    wan = kho.doc("wan") or {}
    raw = {
        "ssid": w2.get("ssid") or "FPT_Telecom_2.4G",
        "ssid5g": w5.get("ssid") or w2.get("ssid") or "FPT_Telecom_5G",
        "password": w2.get("password") or "12345678",
        "security": _normalize_security(w2.get("security")),
        "channel": w2.get("channel") or "auto",
        "lanIp": lan.get("ip") or "192.168.10.1",
        "netmask": lan.get("mask") or "255.255.255.0",
        "dhcpEnable": lan.get("dhcp_enable", "1") != "0",
        "dhcpStart": lan.get("dhcp_start") or "192.168.10.2",
        "dhcpEnd": lan.get("dhcp_end") or "192.168.10.254",
        "dhcpLease": str(lan.get("dhcp_lease") or "86400"),
        "dns1": lan.get("dns_primary") or lan.get("ip") or "192.168.10.1",
        "dns2": lan.get("dns_secondary") or "8.8.8.8",
        "wanIp": wan.get("ip") or "",
        "wanGateway": wan.get("gateway") or "",
        **meta,
    }
    return _to_frontend_contract(raw)


def _write_ax1800gz(mod, session_key: str, cfg: dict[str, Any], mode: str) -> None:
    kho = mod.KHO
    kho.bind(session_key)
    if mode == "router_wan":
        wans = copy.deepcopy(kho.doc("wan_instances") or [{}])
        if not isinstance(wans, list) or not wans:
            wans = [{}]
        wans[0].update({
            "IPAddress": cfg["wanIp"], "SubnetMask": cfg["wanMask"],
            "GateWay": cfg["wanGateway"], "DNS1": cfg["wanDns1"], "DNS2": cfg["wanDns2"],
            "TransType": "DHCP", "wantype": "dhcp", "mode": "route",
        })
        kho.ghi("wan_instances", wans)
        _meta_set("sim_ax1800gz", session_key, cfg, {
            "wanIp": cfg["wanIp"], "wanMask": cfg["wanMask"], "wanGateway": cfg["wanGateway"],
            "wanDns1": cfg["wanDns1"], "wanDns2": cfg["wanDns2"], "opMode": cfg.get("opMode") or "router",
        })
        return

    kho.ghi("lan", {
        "ip": cfg["lanIp"], "mask": cfg["netmask"],
        "dhcp_enable": "1" if cfg["dhcpEnable"] else "0",
        "dhcp_start": cfg["dhcpStart"], "dhcp_end": cfg["dhcpEnd"],
        "lease_time": str(cfg["dhcpLease"]),
        "dns_source": "1", "dns1": cfg["dns1"], "dns2": cfg["dns2"],
    })
    sec_fields = _zte_sec_tuple(cfg["security"])
    for sect, band_ssid, ch in (("wlan24", cfg["ssid"], cfg["channel"]), ("wlan5", cfg["ssid5g"], cfg["channel5g"])):
        w = copy.deepcopy(kho.doc(sect) or {})
        w["enable"] = "1"
        w["ssid"] = band_ssid
        w["password"] = cfg["password"]
        w["security"] = cfg["security"]
        w["beacon_type"] = sec_fields["BeaconType"]
        w["auth_11i"] = sec_fields["11iAuthMode"]
        w["encrypt_11i"] = sec_fields["11iEncryptType"]
        w["channel"] = ch
        w["bandwidth"] = cfg["bandwidth"]
        kho.ghi(sect, w)
    _meta_set("sim_ax1800gz", session_key, cfg)


def _read_ax1800gz(mod, session_key: str) -> dict[str, Any]:
    kho = mod.KHO
    kho.bind(session_key)
    meta = _meta_get("sim_ax1800gz", session_key)
    lan = kho.doc("lan") or {}
    w2 = kho.doc("wlan24") or {}
    w5 = kho.doc("wlan5") or {}
    wans = kho.doc("wan_instances") or []
    w0 = wans[0] if isinstance(wans, list) and wans else {}
    raw = {
        "ssid": w2.get("ssid") or "FPT_AX1800GZ_2.4G",
        "ssid5g": w5.get("ssid") or w2.get("ssid") or "FPT_AX1800GZ_5G",
        "password": w2.get("password") or "12345678",
        "security": _normalize_security(w2.get("security")),
        "channel": w2.get("channel") or "auto",
        "bandwidth": w5.get("bandwidth") or w2.get("bandwidth") or "80MHz",
        "lanIp": lan.get("ip") or "192.168.1.1",
        "netmask": lan.get("mask") or "255.255.255.0",
        "dhcpEnable": lan.get("dhcp_enable", "1") != "0",
        "dhcpStart": lan.get("dhcp_start") or "192.168.1.2",
        "dhcpEnd": lan.get("dhcp_end") or "192.168.1.254",
        "dhcpLease": str(lan.get("lease_time") or "86400"),
        "dns1": lan.get("dns1") or "192.168.1.1",
        "dns2": lan.get("dns2") or "0.0.0.0",
        "wanIp": w0.get("IPAddress") or "",
        "wanGateway": w0.get("GateWay") or "",
        **meta,
    }
    return _to_frontend_contract(raw)


def _write_vigor2927(mod, session_key: str, cfg: dict[str, Any], mode: str) -> None:
    cs = mod.config_store
    cs.dat_nguoi_dung_hien_tai(session_key)
    if mode == "router_wan":
        # Router A -> Router B in Router mode: ONLY provision WAN1, never touch LAN or Wi-Fi!
        cs.dat("extra:/cgi-bin/v2x00.cgi:2031", "fields", {
            "wanIdx": "WAN1",
            "enIp": "1",
            "ipMode": "static" if cfg["wanIp"] else "dhcp",
            "ip": cfg["wanIp"],
            "mask": cfg["wanMask"],
            "gw": cfg["wanGateway"],
            "dns1": cfg["wanDns1"],
            "dns2": cfg["wanDns2"],
            "macClone": "",
        })
        _meta_set("sim_vigor2927", session_key, cfg, {
            "wanIp": cfg["wanIp"], "wanMask": cfg["wanMask"], "wanGateway": cfg["wanGateway"],
            "wanDns1": cfg["wanDns1"], "wanDns2": cfg["wanDns2"], "opMode": cfg.get("opMode") or "router",
        })
        return

    # AP/Bridge/Source mode on Vigor2927: update LAN1, DHCP Pool, DNS, and Dual-Band WLAN
    ary_ip = list(cs.lay("doc/ENET.SHT", "aryLanIp") or ["192.168.1.1"])
    ary_ip[0] = cfg["lanIp"]
    cs.dat("doc/ENET.SHT", "aryLanIp", ary_ip)
    ary_msk = list(cs.lay("doc/ENET.SHT", "aryLanMsk") or ["255.255.255.0"])
    ary_msk[0] = cfg["netmask"]
    cs.dat("doc/ENET.SHT", "aryLanMsk", ary_msk)
    ary_als = list(cs.lay("doc/enet1.htm", "aryLanAlsIp") or ["192.168.1.1"])
    ary_als[0] = cfg["lanIp"]
    cs.dat("doc/enet1.htm", "aryLanAlsIp", ary_als)
    ary_dhcp = list(cs.lay("doc/enet1.htm", "aryLanDhcp") or [1])
    ary_dhcp[0] = 1 if cfg["dhcpEnable"] else 0
    cs.dat("doc/enet1.htm", "aryLanDhcp", ary_dhcp)

    cs.dat("doc/ENET.SHT", "sLanIp", cfg["lanIp"])
    cs.dat("doc/ENET.SHT", "sLanMask", cfg["netmask"])
    cs.dat("doc/ENET.SHT", "sDHCP", "1" if cfg["dhcpEnable"] else "0")
    cs.dat("doc/ENET.SHT", "sDHCPStIP", cfg["dhcpStart"])
    cs.dat("doc/ENET.SHT", "iDHCPNo", str(_pool_size(cfg["dhcpStart"], cfg["dhcpEnd"])))
    cs.dat("doc/ENET.SHT", "sDHCPGwIP", cfg.get("gatewayIp") or cfg["lanIp"])
    cs.dat("doc/ENET.SHT", "sDHCPLsTime", str(cfg["dhcpLease"]))
    cs.dat("doc/ENET.SHT", "sDNSPri", cfg["dns1"])
    cs.dat("doc/ENET.SHT", "sDNSSnd", cfg["dns2"])

    for key_wl, s_val, ch_val in (
        ("extra:/cgi-bin/dualwl.cgi:0", cfg["ssid5g"], cfg["channel5g"]),
        ("extra:/cgi-bin/v2x00.cgi:2047", cfg["ssid"], cfg["channel"]),
    ):
        existing_wl = dict(cs.lay(key_wl, "fields") or {})
        existing_wl.update({"enWlan": "1", "ssid1": s_val, "channel": "0" if ch_val == "auto" else ch_val})
        cs.dat(key_wl, "fields", existing_wl)
    sec_norm = _normalize_security(cfg["security"])
    if sec_norm == "WPA3-SAE":
        sec_mode = "WPA3_SAE"
    elif "WPA3" in sec_norm:
        sec_mode = "WPA2_WPA3"
    elif sec_norm == "Open":
        sec_mode = "Disable"
    else:
        sec_mode = "WPA2_PSK"
    cs.dat("extra:/cgi-bin/dualwl.cgi:2", "fields", {
        "secMode": sec_mode, "encMode": "AES", "psk": cfg["password"],
    })
    _meta_set("sim_vigor2927", session_key, cfg)


def _read_vigor2927(mod, session_key: str) -> dict[str, Any]:
    cs = mod.config_store
    cs.dat_nguoi_dung_hien_tai(session_key)
    meta = _meta_get("sim_vigor2927", session_key)
    ary_ip = cs.lay("doc/ENET.SHT", "aryLanIp") or ["192.168.1.1"]
    lan_ip = cs.lay("doc/ENET.SHT", "sLanIp") or (ary_ip[0] if ary_ip else "192.168.1.1")
    ary_msk = cs.lay("doc/ENET.SHT", "aryLanMsk") or ["255.255.255.0"]
    netmask = cs.lay("doc/ENET.SHT", "sLanMask") or (ary_msk[0] if ary_msk else "255.255.255.0")
    start_ip = cs.lay("doc/ENET.SHT", "sDHCPStIP") or f"{'.'.join(str(lan_ip).split('.')[:3])}.10"
    pool_no = cs.lay("doc/ENET.SHT", "iDHCPNo") or "100"
    end_ip = _end_ip_from_pool_size(start_ip, pool_no) or f"{'.'.join(str(lan_ip).split('.')[:3])}.200"
    wan_2031 = cs.lay("extra:/cgi-bin/v2x00.cgi:2031", "fields") or {}
    wl5 = cs.lay("extra:/cgi-bin/dualwl.cgi:0", "fields") or {}
    wl2 = cs.lay("extra:/cgi-bin/v2x00.cgi:2047", "fields") or {}
    wl_sec = cs.lay("extra:/cgi-bin/dualwl.cgi:2", "fields") or {}
    raw = {
        "ssid": wl2.get("ssid1") or wl5.get("ssid1") or "Vigor2927_WiFi",
        "ssid5g": wl5.get("ssid1") or wl2.get("ssid1") or "Vigor2927_WiFi",
        "password": wl_sec.get("psk") or "12345678",
        "security": _normalize_security(wl_sec.get("secMode") or meta.get("security")),
        "lanIp": lan_ip,
        "netmask": netmask,
        "dhcpEnable": str(cs.lay("doc/ENET.SHT", "sDHCP") or "1") != "0",
        "dhcpStart": start_ip,
        "dhcpEnd": end_ip,
        "dhcpLease": str(cs.lay("doc/ENET.SHT", "sDHCPLsTime") or "86400"),
        "dns1": cs.lay("doc/ENET.SHT", "sDNSPri") or "8.8.8.8",
        "dns2": cs.lay("doc/ENET.SHT", "sDNSSnd") or "8.8.4.4",
        "wanIp": wan_2031.get("ip") or "",
        "wanMask": wan_2031.get("mask") or "",
        "wanGateway": wan_2031.get("gw") or "",
        "wanDns1": wan_2031.get("dns1") or "",
        "wanDns2": wan_2031.get("dns2") or "",
        **meta,
    }
    return _to_frontend_contract(raw)


def _mk_dns_scalar_val(dns_ips: list[str]) -> tuple[int, list[dict[str, Any]]]:
    entries = [
        {"the": [(1, 8, _ip_to_le_u32(d))], "dem": 0, "magic": True}
        for d in dns_ips
        if _is_ipv4(d)
    ]
    return (168, entries)


def _mk_read_tuple_val(entry: Any, default: Any = None) -> Any:
    if isinstance(entry, (tuple, list)) and len(entry) >= 2:
        return entry[1]
    return default


def _write_mikrotik(mod, session_key: str, cfg: dict[str, Any], mode: str) -> None:
    k_bare = session_key.replace("cookie:ktv_client_id:", "")
    target_keys = (k_bare, f"cookie:ktv_client_id:{k_bare}") if k_bare else (session_key,)
    for sk in target_keys:
        kho = mod._kho_cua_ktv(sk)
        if mode == "router_wan":
            # Router A -> MikroTik hEX S in Router mode: ONLY provision WAN (ether1, row 1) + upstream DNS!
            if _is_ipv4(cfg["wanIp"]):
                w_mask = cfg["wanMask"] if _is_ipv4(cfg["wanMask"]) else "255.255.255.0"
                w_net = str(_ip_network(cfg["wanIp"], w_mask).network_address)
                kho.sua_dong((20, 1), 1, {
                    1: (8, _ip_to_le_u32(cfg["wanIp"])),
                    2: (8, _ip_to_le_u32(w_net)),
                    3: (8, _ip_to_le_u32(w_mask)),
                })
            dns_ips = [d for d in (cfg["wanDns1"], cfg["wanDns2"]) if _is_ipv4(d)]
            if dns_ips:
                kho.dat_scalar((14, 2), {10: _mk_dns_scalar_val(dns_ips)})
            kho.luu()
            _meta_set("sim_mikrotik_hexs", sk, cfg, {
                "wanIp": cfg["wanIp"], "wanMask": cfg["wanMask"], "wanGateway": cfg["wanGateway"],
                "wanDns1": cfg["wanDns1"], "wanDns2": cfg["wanDns2"], "opMode": cfg.get("opMode") or "router",
            })
            continue

        # Bridge/AP or Router source mode: update bridge-LAN (row 2), DHCP pool (84,2), DHCP network (23,2), DNS (14,2)
        net_addr = str(_ip_network(cfg["lanIp"], cfg["netmask"]).network_address)
        kho.sua_dong((20, 1), 2, {
            1: (8, _ip_to_le_u32(cfg["lanIp"])),
            2: (8, _ip_to_le_u32(net_addr)),
            3: (8, _ip_to_le_u32(cfg["netmask"])),
        })
        if _is_ipv4(cfg["dhcpStart"]) and _is_ipv4(cfg["dhcpEnd"]):
            kho.sua_dong((84, 2), 1, {
                0xB: (136, [_ip_to_le_u32(cfg["dhcpStart"]), _ip_to_le_u32(cfg["dhcpEnd"])]),
            })
        dns_ips = [d for d in (cfg["dns1"], cfg["dns2"]) if _is_ipv4(d)]
        dns_list = [_ip_to_le_u32(d) for d in dns_ips]
        kho.sua_dong((23, 2), 1, {
            1: (8, _ip_to_le_u32(net_addr)),
            2: (8, _ip_to_le_u32(cfg["netmask"])),
            3: (136, [_ip_to_le_u32(cfg.get("gatewayIp") or cfg["lanIp"])]),
            4: (136, dns_list or [_ip_to_le_u32("8.8.8.8"), _ip_to_le_u32("8.8.4.4")]),
        })
        if dns_ips:
            kho.dat_scalar((14, 2), {10: _mk_dns_scalar_val(dns_ips)})
        kho.luu()
        _meta_set("sim_mikrotik_hexs", sk, cfg, {
            **cfg,
            "lanIp": cfg["lanIp"],
            "netmask": cfg["netmask"],
            "dhcpStart": cfg["dhcpStart"],
            "dhcpEnd": cfg["dhcpEnd"],
            "dns1": cfg["dns1"],
            "dns2": cfg["dns2"],
        })


def _read_mikrotik(mod, session_key: str) -> dict[str, Any]:
    k_bare = session_key.replace("cookie:ktv_client_id:", "")
    kho = mod._kho_cua_ktv(k_bare)
    if not getattr(kho, "bang", {}).get((20, 1)):
        kho_c = mod._kho_cua_ktv(f"cookie:ktv_client_id:{k_bare}")
        if getattr(kho_c, "bang", {}).get((20, 1)):
            kho = kho_c
    meta = _meta_get("sim_mikrotik_hexs", k_bare) or _meta_get("sim_mikrotik_hexs", session_key)
    addr_bang = kho.bang.get((20, 1), {})
    wan_row = addr_bang.get(1, {})
    lan_row = addr_bang.get(2, {})
    pool_row = kho.bang.get((84, 2), {}).get(1, {})
    dns_sc = kho.scalar.get((14, 2), {})

    lan_ip_raw = _mk_read_tuple_val(lan_row.get(1))
    mask_raw = _mk_read_tuple_val(lan_row.get(3))
    lan_ip = _le_u32_to_ip(lan_ip_raw) if isinstance(lan_ip_raw, int) else (meta.get("lanIp") or "192.168.1.1")
    netmask = _le_u32_to_ip(mask_raw) if isinstance(mask_raw, int) else (meta.get("netmask") or "255.255.255.0")

    pool_range = _mk_read_tuple_val(pool_row.get(0xB), [])
    dhcp_start = _le_u32_to_ip(pool_range[0]) if len(pool_range) > 0 else (meta.get("dhcpStart") or "192.168.1.10")
    dhcp_end = _le_u32_to_ip(pool_range[1]) if len(pool_range) > 1 else (meta.get("dhcpEnd") or "192.168.1.254")

    dns_entries = _mk_read_tuple_val(dns_sc.get(10), [])
    dns_ips = []
    for entry in (dns_entries or []):
        for tag_id, _k, val in (entry.get("the") or []):
            if tag_id == 1 and isinstance(val, int):
                dns_ips.append(_le_u32_to_ip(val))
    dns1 = dns_ips[0] if len(dns_ips) > 0 else (meta.get("dns1") or "8.8.8.8")
    dns2 = dns_ips[1] if len(dns_ips) > 1 else (meta.get("dns2") or "8.8.4.4")

    wan_raw = _mk_read_tuple_val(wan_row.get(1))
    wan_ip = _le_u32_to_ip(wan_raw) if isinstance(wan_raw, int) else (meta.get("wanIp") or "10.253.254.10")

    raw = {
        "ssid": meta.get("ssid") or "MikroTik-Router",
        "ssid5g": meta.get("ssid5g") or "MikroTik-Router",
        "password": meta.get("password") or "12345678",
        "lanIp": lan_ip,
        "netmask": netmask,
        "dhcpStart": dhcp_start,
        "dhcpEnd": dhcp_end,
        "dns1": dns1,
        "dns2": dns2,
        "wanIp": wan_ip,
        **meta,
    }
    return _to_frontend_contract(raw)


_ADAPTER_TABLE = {
    "sim_be12000": (_write_be12000, _read_be12000),
    "sim_be15000": (_write_be15000, _read_be15000),
    "sim_ax3000s": (_write_ax3000s, _read_ax3000s),
    "sim_ax3000gz": (_write_ax3000gz, _read_ax3000gz),
    "sim_ax3000gz_v2": (
        lambda m, s, c, mode: _write_zte_xml("sim_ax3000gz_v2", m, s, c, mode),
        lambda m, s: _read_zte_xml("sim_ax3000gz_v2", m, s),
    ),
    "sim_ac1000z": (
        lambda m, s, c, mode: _write_zte_xml("sim_ac1000z", m, s, c, mode),
        lambda m, s: _read_zte_xml("sim_ac1000z", m, s),
    ),
    "sim_ax3000c": (_write_ax3000c, _read_ax3000c),
    "sim_be6500c": (
        lambda m, s, c, mode: _write_prplos_be6500("sim_be6500c", m, s, c, mode),
        lambda m, s: _read_prplos_be6500("sim_be6500c", m, s),
    ),
    "sim_ONT_be6500c": (
        lambda m, s, c, mode: _write_prplos_be6500("sim_ONT_be6500c", m, s, c, mode),
        lambda m, s: _read_prplos_be6500("sim_ONT_be6500c", m, s),
    ),
    "sim_ac1000f": (_write_ac1000f, _read_ac1000f),
    "sim_ax3000hv2": (_write_ax3000hv2, _read_ax3000hv2),
    "sim_ac1000HI": (_write_ac1000hi, _read_ac1000hi),
    "sim_ac1000cv2": (_write_ac1000cv2, _read_ac1000cv2),
    "sim_ax1800gz": (_write_ax1800gz, _read_ax1800gz),
    "sim_vigor2927": (_write_vigor2927, _read_vigor2927),
    "sim_mikrotik_hexs": (_write_mikrotik, _read_mikrotik),
}


def write_node_backend_config(
    sim_id: str,
    session_key: str,
    raw_cfg: dict[str, Any],
    mode: str = "ap_mesh",
) -> dict[str, Any]:
    """Persist configuration into the specific simulator's per-node Python store."""
    entry = _ADAPTER_TABLE.get(sim_id)
    if not entry:
        raise ValueError(f"Unsupported sim_id: {sim_id!r}")
    mod = _get_sim_module(sim_id)
    if mod is None:
        raise RuntimeError(f"Simulator module not loaded for {sim_id!r}")
    norm = normalize_cfg(raw_cfg)
    writer, _ = entry
    with _ADAPTER_LOCK:
        writer(mod, session_key, norm, mode)
    return _to_frontend_contract(norm)


def read_node_backend_config(
    sim_id: str,
    session_key: str,
    fallback_cfg: dict[str, Any] | None = None,
) -> dict[str, Any]:
    """Read live normalized configuration from a simulator's per-node Python store."""
    entry = _ADAPTER_TABLE.get(sim_id)
    if not entry:
        return _to_frontend_contract(fallback_cfg)
    mod = _get_sim_module(sim_id)
    if mod is None:
        return _to_frontend_contract(fallback_cfg)
    _, reader = entry
    with _ADAPTER_LOCK:
        return reader(mod, session_key)


def reset_node_backend(sim_id: str, session_key: str) -> None:
    """Reset one per-node simulator store back to factory defaults."""
    with _ADAPTER_LOCK:
        _NODE_META.pop((sim_id, session_key), None)
        mod = _get_sim_module(sim_id)
        if mod is None:
            return
        try:
            if sim_id == "sim_be12000":
                with mod._SIM_LOCK:
                    sim = mod._USER_SIMS.pop(session_key, None)
                    if sim and "store" in sim:
                        sim["store"].khoi_phuc_xuat_xuong()
            elif sim_id == "sim_be15000":
                import mesh_zte_engine
                mesh_zte_engine.reset_lab(session_id=session_key)
            elif sim_id in ("sim_ax3000s", "sim_ax3000gz"):
                mod.reset_client_state(session_key)
            elif sim_id in ("sim_ax3000gz_v2", "sim_ac1000z"):
                cs_mod = sys.modules[mod.STORE.__module__]
                if hasattr(cs_mod, "reset_user_store"):
                    cs_mod.reset_user_store(session_key)
                else:
                    cs_mod.bind_user(session_key)
                    cs_mod.get_user_store(session_key).reset()
            elif sim_id == "sim_ax3000c":
                kho_mod = sys.modules.get("ax3000c_kho_cau_hinh") or importlib.import_module("simulators.sim_ax3000c.fw_053.src.ax3000c_kho_cau_hinh")
                kho_mod._kho_cua_ktv(session_key).dat_lai() if hasattr(kho_mod._kho_cua_ktv(session_key), "dat_lai") else kho_mod._kho_cua_ktv(session_key).xoa_sach()
            elif sim_id in ("sim_be6500c", "sim_ONT_be6500c"):
                cs = _prplos_cs_module(sim_id, mod)
                cs.dat_nguoi_dung_hien_tai(session_key)
                cs.dat_lai_factory()
            elif sim_id in ("sim_ac1000f", "sim_ax3000hv2"):
                lock = getattr(mod, "_STATE_LOCK", contextlib.nullcontext())
                with lock:
                    if hasattr(mod, "_USER_STATES"):
                        mod._USER_STATES.pop(session_key, None)
            elif sim_id == "sim_ac1000HI":
                mod.kho.dat_phien_hien_tai(session_key)
                mod.kho.dat_lai_factory()
            elif sim_id in ("sim_ac1000cv2", "sim_ax1800gz"):
                if hasattr(mod.KHO, "xoa_phien"):
                    mod.KHO.xoa_phien(session_key)
                else:
                    mod.KHO.bind(session_key)
                    mod.KHO.dat_lai()
            elif sim_id == "sim_vigor2927":
                mod.config_store.dat_lai_factory(session_key)
            elif sim_id == "sim_mikrotik_hexs":
                mod._kho_cua_ktv(session_key).xoa_sach()
        except Exception:
            pass


# ---------------------------------------------------------------------------
# Graph / Topology Propagation (Gateway/Controller -> AP/Router B)
# ---------------------------------------------------------------------------

def _root_priority(node: dict[str, Any], source_node_id: str | None, order_idx: int) -> tuple:
    cat = str(node.get("category") or "").lower()
    fw = node.get("firmwareConfig") if isinstance(node.get("firmwareConfig"), dict) else {}
    sim_id = str(node.get("simId") or "").strip()
    op_mode = str(node.get("opMode") or fw.get("opMode") or "").lower()
    mesh_role = str(node.get("meshRole") or fw.get("meshRole") or "").lower()

    score = 0
    if node.get("hasInternet") or node.get("isGateway"):
        score += 100
    if cat == "gateway":
        score += 70
    elif cat == "router":
        score += 45
    elif cat == "ap":
        score += 15
    elif cat == "switch":
        score += 5
    elif cat == "client":
        score -= 200

    if op_mode in ("ap", "agent", "bridge", "repeater", "mesh_agent") or mesh_role in ("agent", "ap", "bridge"):
        score -= 80
    elif op_mode in ("router", "gateway") or mesh_role == "controller":
        score += 30
    elif sim_id in GATEWAY_DEFAULT_SIM_IDS and cat != "ap":
        score += 20

    if source_node_id and node.get("id") == source_node_id and cat != "client" and op_mode not in ("ap", "agent", "bridge"):
        score += 12
    return (score, -order_idx)


def _edge_info(link: dict[str, Any]) -> tuple[str, str, dict[str, Any]] | None:
    u = link.get("fromNodeId") or link.get("srcId") or link.get("a") or link.get("source")
    v = link.get("toNodeId") or link.get("tgtId") or link.get("b") or link.get("target")
    if not (u and v):
        return None
    if link.get("status") == "down":
        return None
    return str(u), str(v), link


def sync_all_nodes_backend(
    base_ktv_id: str,
    nodes: list[dict[str, Any]],
    links: list[dict[str, Any]],
    source_node_id: str | None = None,
    prefer_backend_source: bool = False,
) -> dict[str, Any]:
    """Propagate upstream Gateway/Controller configs downstream across all links.

    Rules:
    - Gateway/Controller A -> AP Mesh / Switch / Client B: propagates SSID, key,
      security, channel/BW, LAN/DHCP pool, DNS, topology, and clients/ARP tables.
    - Router A -> Router B (running Router mode): ONLY provisions B's WAN IP,
      mask, gateway, and DNS; B keeps its own LAN subnet and Wi-Fi SSID/key.
    - All backend writes go strictly into per-(base_ktv_id, node_id) stores.
    """
    node_map: dict[str, dict[str, Any]] = {}
    node_order: list[str] = []
    for n in (nodes or []):
        nid = str(n.get("id") or "")
        if not nid or not is_valid_node_id(nid):
            continue
        node_map[nid] = n
        node_order.append(nid)

    adj: dict[str, list[tuple[str, dict[str, Any]]]] = {nid: [] for nid in node_map}
    for ln in (links or []):
        parsed = _edge_info(ln)
        if not parsed:
            continue
        u, v, raw_link = parsed
        if u in node_map and v in node_map:
            n_u, n_v = node_map[u], node_map[v]
            if n_u.get("power", True) is False or n_v.get("power", True) is False:
                continue
            adj[u].append((v, raw_link))
            adj[v].append((u, raw_link))

    visited: set[str] = set()
    node_configs: dict[str, dict[str, Any]] = {}
    sync_modes: dict[str, str] = {}
    synced_count = 0

    for root_candidate in node_order:
        if root_candidate in visited:
            continue
        # Collect connected component via BFS
        comp_ids: list[str] = []
        queue = [root_candidate]
        comp_seen = {root_candidate}
        while queue:
            cur = queue.pop(0)
            comp_ids.append(cur)
            for nxt, _ in adj.get(cur, []):
                if nxt not in comp_seen:
                    comp_seen.add(nxt)
                    queue.append(nxt)
        visited.update(comp_ids)

        if len(comp_ids) == 1:
            nid = comp_ids[0]
            n = node_map[nid]
            sim_id = str(n.get("simId") or "")
            if sim_id in _ADAPTER_TABLE:
                skey = make_node_session_key(base_ktv_id, nid)
                if prefer_backend_source and nid == source_node_id:
                    cfg = read_node_backend_config(sim_id, skey, n.get("firmwareConfig"))
                else:
                    fw = dict(n.get("firmwareConfig") or {})
                    if n.get("ip") and not fw.get("lanIp"):
                        fw["lanIp"] = n["ip"]
                    cfg = write_node_backend_config(sim_id, skey, fw, mode="ap_mesh")
                node_configs[nid] = cfg
                sync_modes[nid] = "standalone"
            continue

        # Choose component Root Gateway / Controller
        root_id = max(
            comp_ids,
            key=lambda cid: _root_priority(node_map[cid], source_node_id, node_order.index(cid)),
        )
        root_node = node_map[root_id]
        root_sim = str(root_node.get("simId") or "")
        root_skey = make_node_session_key(base_ktv_id, root_id)

        if prefer_backend_source and root_id == source_node_id and root_sim in _ADAPTER_TABLE:
            root_cfg = read_node_backend_config(root_sim, root_skey, root_node.get("firmwareConfig"))
        else:
            raw_root = dict(root_node.get("firmwareConfig") or {})
            if root_node.get("ip") and not raw_root.get("lanIp"):
                raw_root["lanIp"] = root_node["ip"]
            raw_root.setdefault("meshRole", "Controller")
            root_cfg = normalize_cfg(raw_root)

        # Build topology & client tables per component before writing stores
        slaves_list: list[dict[str, Any]] = []
        clients_list: list[dict[str, Any]] = []

        # Spanning BFS from root_id
        bfs_queue = [(root_id, None, None)]
        bfs_seen = {root_id}
        parent_of: dict[str, str] = {}
        edge_of: dict[str, dict[str, Any]] = {}
        bfs_order: list[str] = [root_id]
        while bfs_queue:
            cur_id, par_id, ln = bfs_queue.pop(0)
            if par_id is not None:
                parent_of[cur_id] = par_id
                edge_of[cur_id] = ln or {}
                bfs_order.append(cur_id)
            for nxt_id, nxt_link in adj.get(cur_id, []):
                if nxt_id not in bfs_seen:
                    bfs_seen.add(nxt_id)
                    bfs_queue.append((nxt_id, cur_id, nxt_link))

        # Assign per-parent host slot offsets and prepare downstream configs
        slot_by_parent: dict[str, int] = {}
        effective_cfg: dict[str, dict[str, Any]] = {root_id: _to_frontend_contract(root_cfg)}

        for nid in bfs_order[1:]:
            par_id = parent_of[nid]
            par_cfg = effective_cfg[par_id]
            child_node = node_map[nid]
            child_sim = str(child_node.get("simId") or "")
            child_cat = str(child_node.get("category") or "").lower()
            ln = edge_of.get(nid, {})
            slot = slot_by_parent.get(par_id, 0) + 1
            slot_by_parent[par_id] = slot

            is_wifi_link = str(ln.get("cableType") or ln.get("medium") or "").upper() in ("WIFI_MESH", "WIFI")
            backhaul = "Wi-Fi (MLO)" if is_wifi_link else "Ethernet"

            if child_cat == "client":
                cl_ip = _derive_subnet_ip(par_cfg["lanIp"], par_cfg["netmask"], slot + 50, str(child_node.get("ip") or ""))
                clients_list.append({
                    "nodeId": nid,
                    "name": child_node.get("name") or nid,
                    "mac": child_node.get("mac") or f"D8:43:AE:2E:65:{slot:02X}",
                    "ip": cl_ip,
                    "band": "5GHz + 6GHz (MLO)" if is_wifi_link else "LAN Ethernet",
                    "rssi": -42 if is_wifi_link else 0,
                    "rate_mbps": int(ln.get("speedMbps") or (2400 if is_wifi_link else 1000)),
                    "connected_to": node_map[par_id].get("name") or par_id,
                    "lease": par_cfg["dhcpLease"],
                })
                effective_cfg[nid] = {
                    "lanIp": cl_ip, "gatewayIp": par_cfg["lanIp"],
                    "netmask": par_cfg["netmask"], "dns1": par_cfg["dns1"], "dns2": par_cfg["dns2"],
                    "ssid": par_cfg["ssid"], "wanIp": cl_ip, "wanGateway": par_cfg["lanIp"],
                }
                sync_modes[nid] = "client"
                continue

            if is_router_mode_node(child_node):
                # Router A -> Router B (Router mode): ONLY provision WAN! Preserve B's own LAN & SSID.
                child_skey = make_node_session_key(base_ktv_id, nid) if child_sim in _ADAPTER_TABLE else ""
                backend_own = read_node_backend_config(child_sim, child_skey) if child_sim in _ADAPTER_TABLE else {}
                fw_own = child_node.get("firmwareConfig") if isinstance(child_node.get("firmwareConfig"), dict) else {}
                has_explicit_fw_lan_wifi = any(
                    bool(fw_own.get(k))
                    for k in ("ssid", "ssid5g", "lanIp", "dhcpStart", "dhcpStartIp", "dhcpEnd", "dhcpEndIp", "wpaKey", "password")
                )
                if prefer_backend_source and child_sim in _ADAPTER_TABLE:
                    b_own = normalize_cfg(backend_own)
                elif has_explicit_fw_lan_wifi:
                    merged_own = dict(backend_own)
                    fw_patch = dict(fw_own)
                    if fw_patch.get("ssid") and not fw_patch.get("ssid5g"):
                        fw_patch["ssid5g"] = fw_patch["ssid"]
                    if fw_patch.get("wpaKey") and not fw_patch.get("password"):
                        fw_patch["password"] = fw_patch["wpaKey"]
                    elif fw_patch.get("password") and not fw_patch.get("wpaKey"):
                        fw_patch["wpaKey"] = fw_patch["password"]
                    if fw_patch.get("primaryDns") and not fw_patch.get("dns1"):
                        fw_patch["dns1"] = fw_patch["primaryDns"]
                    if fw_patch.get("secondaryDns") and not fw_patch.get("dns2"):
                        fw_patch["dns2"] = fw_patch["secondaryDns"]
                    if fw_patch.get("subnetMask") and not fw_patch.get("netmask"):
                        fw_patch["netmask"] = fw_patch["subnetMask"]
                    if fw_patch.get("dhcpStartIp") and not fw_patch.get("dhcpStart"):
                        fw_patch["dhcpStart"] = fw_patch["dhcpStartIp"]
                    if fw_patch.get("dhcpEndIp") and not fw_patch.get("dhcpEnd"):
                        fw_patch["dhcpEnd"] = fw_patch["dhcpEndIp"]
                    if fw_patch.get("leaseTime") and not fw_patch.get("dhcpLease"):
                        fw_patch["dhcpLease"] = fw_patch["leaseTime"]
                    if fw_patch.get("securityMode") and not fw_patch.get("security"):
                        fw_patch["security"] = fw_patch["securityMode"]
                    merged_own.update(fw_patch)
                    b_own = normalize_cfg(merged_own)
                    if child_sim in _ADAPTER_TABLE:
                        seed_cfg = copy.deepcopy(b_own)
                        seed_cfg["meshNodes"] = []
                        seed_cfg["clients"] = []
                        write_node_backend_config(child_sim, child_skey, seed_cfg, mode="source")
                else:
                    b_own = normalize_cfg(backend_own)
                    if child_node.get("ip") and child_sim not in _ADAPTER_TABLE:
                        b_own["lanIp"] = str(child_node["ip"])
                        s0, e0 = _derive_pool_bounds(b_own["lanIp"], b_own["netmask"], b_own["dhcpStart"], b_own["dhcpEnd"])
                        b_own["dhcpStart"], b_own["dhcpEnd"] = s0, e0

                wan_ip = _derive_subnet_ip(par_cfg["lanIp"], par_cfg["netmask"], slot, b_own.get("wanIp") or "")
                b_own["wanIp"] = wan_ip
                b_own["wanMask"] = par_cfg["netmask"]
                b_own["wanGateway"] = par_cfg["lanIp"]
                b_own["wanDns1"] = par_cfg["dns1"] or par_cfg["lanIp"]
                b_own["wanDns2"] = par_cfg["dns2"]
                b_own["opMode"] = b_own.get("opMode") or "router"
                slaves_list.append({
                    "nodeId": nid,
                    "name": child_node.get("name") or nid,
                    "model": child_node.get("model") or child_sim or "Router",
                    "mac": child_node.get("mac") or f"94:F7:17:AA:00:{slot:02X}",
                    "ip": wan_ip,
                    "lanIp": b_own["lanIp"],
                    "role": "Router",
                    "backhaul": backhaul,
                    "speed_mbps": int(ln.get("speedMbps") or 1000),
                    "rssi": -25 if is_wifi_link else 0,
                    "upstream_port": str(ln.get("fromPort") or ""),
                    "local_port": str(ln.get("toPort") or "WAN"),
                })
                effective_cfg[nid] = _to_frontend_contract(b_own)
                sync_modes[nid] = "router_wan"
            else:
                # AP Mesh / Switch / Repeater B: full inheritance from upstream parent A
                mgmt_ip = _derive_subnet_ip(par_cfg["lanIp"], par_cfg["netmask"], slot, str(child_node.get("ip") or ""))
                b_cfg = copy.deepcopy(par_cfg)
                b_cfg["lanIp"] = mgmt_ip
                b_cfg["gatewayIp"] = par_cfg["lanIp"]
                b_cfg["meshRole"] = "Agent"
                b_cfg["opMode"] = str(
                    (child_node.get("firmwareConfig") or {}).get("opMode")
                    or child_node.get("opMode")
                    or "ap"
                )
                slaves_list.append({
                    "nodeId": nid,
                    "name": child_node.get("name") or nid,
                    "model": child_node.get("model") or child_sim or "AP",
                    "mac": child_node.get("mac") or f"94:F7:17:BB:00:{slot:02X}",
                    "ip": mgmt_ip,
                    "role": "Agent",
                    "backhaul": backhaul,
                    "speed_mbps": int(ln.get("speedMbps") or (2500 if not is_wifi_link else 2400)),
                    "rssi": -28 if is_wifi_link else 0,
                    "upstream_port": str(ln.get("fromPort") or ""),
                    "local_port": str(ln.get("toPort") or ""),
                })
                effective_cfg[nid] = _to_frontend_contract(b_cfg)
                sync_modes[nid] = "ap_mesh"

        # Inject complete component meshNodes & clients into root + all ap_mesh nodes and persist to backends
        for nid in bfs_order:
            n = node_map[nid]
            sim_id = str(n.get("simId") or "")
            mode = sync_modes.get(nid)
            cfg_out = effective_cfg[nid]
            if mode == "client":
                node_configs[nid] = cfg_out
                continue

            if nid == root_id or mode == "ap_mesh":
                cfg_out["meshNodes"] = copy.deepcopy(slaves_list)
                cfg_out["clients"] = copy.deepcopy(clients_list)
                if nid == root_id:
                    cfg_out["meshRole"] = "Controller"
                    sync_modes[nid] = "source"
                write_mode = "ap_mesh"
            else:
                # router_wan
                cfg_out["meshNodes"] = [s for s in slaves_list if s.get("nodeId") == nid]
                write_mode = "router_wan"

            if sim_id in _ADAPTER_TABLE:
                skey = make_node_session_key(base_ktv_id, nid)
                written = write_node_backend_config(sim_id, skey, cfg_out, mode=write_mode)
                node_configs[nid] = written
                synced_count += 1
            else:
                node_configs[nid] = cfg_out

    return {
        "status": "ok",
        "synced_count": synced_count,
        "sync_modes": sync_modes,
        "node_configs": node_configs,
    }


# ---------------------------------------------------------------------------
# Per-KTV Workspace Persistence (for F5 Refresh & Reset)
# ---------------------------------------------------------------------------

def _workspace_file(base_ktv_id: str) -> Path:
    safe = sanitize_base_ktv_id(base_ktv_id)
    return _WORKSPACE_DIR / f"ws-{safe}.json"


def _prune_workspaces_unlocked(now: float) -> None:
    stale = [
        k for k, v in _WORKSPACES.items()
        if now - float(v.get("updatedAt", now)) > _WORKSPACE_TTL_SEC
    ]
    for k in stale:
        _WORKSPACES.pop(k, None)


def get_workspace(base_ktv_id: str) -> dict[str, Any] | None:
    """Return previously saved mesh-lab workspace for this KTV, or None."""
    safe_ktv = sanitize_base_ktv_id(base_ktv_id)
    with _WORKSPACE_LOCK:
        _prune_workspaces_unlocked(time.time())
        if safe_ktv in _WORKSPACES:
            return copy.deepcopy(_WORKSPACES[safe_ktv])
        fpath = _workspace_file(safe_ktv)
        if fpath.exists():
            try:
                data = json.loads(fpath.read_text(encoding="utf-8"))
                if isinstance(data, dict) and isinstance(data.get("nodes"), list):
                    _WORKSPACES[safe_ktv] = data
                    return copy.deepcopy(data)
            except Exception:
                pass
    return None


def save_workspace(base_ktv_id: str, payload: dict[str, Any]) -> dict[str, Any]:
    """Persist per-KTV mesh-lab workspace to memory and disk."""
    safe_ktv = sanitize_base_ktv_id(base_ktv_id)
    nodes = payload.get("nodes") if isinstance(payload.get("nodes"), list) else []
    links = payload.get("links") if isinstance(payload.get("links"), list) else []
    doc = {
        "nodes": copy.deepcopy(nodes[:64]),
        "links": copy.deepcopy(links[:128]),
        "activeDeviceWindowNodeId": payload.get("activeDeviceWindowNodeId") or None,
        "topologyPendingSync": bool(payload.get("topologyPendingSync", False)),
        "topologyRevision": int(payload.get("topologyRevision", 0) or 0),
        "updatedAt": time.time(),
    }
    with _WORKSPACE_LOCK:
        _prune_workspaces_unlocked(doc["updatedAt"])
        _WORKSPACES[safe_ktv] = doc
        try:
            _WORKSPACE_DIR.mkdir(parents=True, exist_ok=True)
            _workspace_file(safe_ktv).write_text(
                json.dumps(doc, ensure_ascii=False, separators=(",", ":")),
                encoding="utf-8",
            )
        except Exception:
            pass
    return copy.deepcopy(doc)


def reset_workspace(base_ktv_id: str, extra_nodes: list[dict[str, Any]] | None = None) -> dict[str, Any]:
    """Clear KTV workspace and reset every node's simulator backend store."""
    safe_ktv = sanitize_base_ktv_id(base_ktv_id)
    targets: list[tuple[str, str]] = []
    with _WORKSPACE_LOCK:
        old = _WORKSPACES.pop(safe_ktv, None)
        fpath = _workspace_file(safe_ktv)
        if old is None and fpath.exists():
            try:
                old = json.loads(fpath.read_text(encoding="utf-8"))
            except Exception:
                old = None
        if fpath.exists():
            try:
                fpath.unlink()
            except Exception:
                pass

    for node_list in ((old or {}).get("nodes") or [], extra_nodes or []):
        for n in node_list:
            if not isinstance(n, dict):
                continue
            nid = n.get("id")
            sid = n.get("simId") or ""
            if is_valid_node_id(nid) and sid in _ADAPTER_TABLE:
                targets.append((sid, make_node_session_key(safe_ktv, nid)))

    # Also reset any cached _NODE_META entries belonging to this KTV
    prefix = f"{safe_ktv}__mn_"
    with _ADAPTER_LOCK:
        for sim_id, skey in list(_NODE_META.keys()):
            if skey == safe_ktv or skey.startswith(prefix):
                targets.append((sim_id, skey))

    seen = set()
    reset_count = 0
    for sim_id, skey in targets:
        pair = (sim_id, skey)
        if pair in seen:
            continue
        seen.add(pair)
        reset_node_backend(sim_id, skey)
        reset_count += 1

    return {"status": "ok", "reset_nodes": reset_count}
