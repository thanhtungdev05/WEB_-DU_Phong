#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""Authentic DrayTek Vigor2927 fallback, Dual-Band, LTE, Objects, VPN, Diagnostics & Sub-Doc pages.

Phuc vu cac endpoint thieu / rong / loi / map nham trong capture ban dau
voi giao dien chuan style.min.css, header printLogo/subTitle, va luu cau hinh
theo tung phien KTV trong vg_config_store.
"""
import html as _html
import render as _render


def _esc(val):
    return _html.escape("" if val is None else str(val), quote=True)


def _chk(cond):
    return " checked" if cond else ""


def _sel(cur, val):
    return " selected" if str(cur) == str(val) else ""


def _store_key(path, fid):
    return f"extra:{path.lower()}:{fid or '0'}"


def _render_vigor_page(
    parent_cat,
    title,
    action,
    fid,
    hidden_fields,
    body_html,
    notes=None,
    saved=False,
    read_only=False,
    extra_buttons="",
):
    hidden_html = f'<input type="hidden" name="fid" value="{_esc(fid)}">'
    for hk, hv in (hidden_fields or {}).items():
        hidden_html += f'<input type="hidden" name="{_esc(hk)}" value="{_esc(hv)}">'
    hidden_html += '<input type="hidden" name="webchange" value="1">'
    hidden_html += '<input type="hidden" name="sFormAuthStr" value="K8sEXFc1TfxSlPA">'

    note_html = ""
    if notes:
        rows = "".join(f'<tr><td width="16">{i}.</td><td>{_esc(n)}</td></tr>' for i, n in enumerate(notes, 1))
        note_html = (
            '<br><table class="tbnote" align="center" width="100%" cellspacing="2" cellpadding="2" border="0">'
            '<tr><td colspan="2"><b>Note:</b></td></tr>'
            f'{rows}</table>'
        )

    saved_banner = (
        '<div id="vg-saved-banner" style="margin:6px 0 8px;padding:6px 10px;'
        'background:#e8f5e9;border:1px solid #43a047;color:#1b5e20;font-weight:bold;border-radius:3px">'
        'Settings saved successfully!</div>'
        if saved else ""
    )

    if read_only:
        btn_row = (
            '<br><table align="center" border="0"><tr><td>'
            '<input class="btnw" type="button" value="Refresh" onclick="window.location.reload()">'
            f'{extra_buttons}'
            '</td></tr></table>'
        )
    else:
        btn_row = (
            '<br><table align="center" border="0"><tr><td>'
            '<input class="btnw" type="submit" name="btnOk" value="OK"> &nbsp;&nbsp; '
            '<input class="btnw" type="button" value="Cancel" onclick="window.location.reload()">'
            f'{extra_buttons}'
            '</td></tr></table>'
        )

    flag_val = "4" if saved else "0"
    saved_js = (
        "document._ftcIsSaved=true;window._ftcIsSaved=true;"
        "try{if(parent){parent._ftcIsSaved=true;parent._hasClickedSaveInGuide=true;}}catch(e){}"
        if saved else ""
    )

    raw_html = (
        '<!DOCTYPE html><html ng-app="myApp" ng-controller="TranslateCtrl"><head>'
        '<meta charset="UTF-8">'
        f'<title>{_esc(title)}</title>'
        '<script src="/js/gettext.min.js?094907"></script>'
        '<link href="/style.min.css?094907" rel="stylesheet" type="text/css">'
        '<script src="/js/webchange.js?094907"></script>'
        '<style>.vg-sec{width:100%;border-collapse:collapse;margin-top:4px}'
        '.vg-sec td,.vg-sec th{padding:5px 8px;font-size:12px}'
        '.vg-lbl{width:38%;font-weight:bold;background:#f4f6f9}'
        '.vg-hdr{background:#666;color:#fff;font-weight:bold;text-align:center}'
        '.vg-badge-ok{color:#1b5e20;font-weight:bold}'
        '.vg-badge-warn{color:#b45309;font-weight:bold}</style>'
        '</head><body class="ng-cloak">'
        '<table align="center" border="0" cellpadding="0" cellspacing="0" width="750"><tr><td>'
        f'<b parent="{_esc(parent_cat)}" sub-title translate>{_esc(title)}</b><hr>'
        f'{saved_banner}'
        f'<form action="{_esc(action)}" method="POST" name="frm1">'
        f'{hidden_html}'
        f'{body_html}'
        f'{btn_row}'
        '</form>'
        f'{note_html}'
        '</td></tr></table>'
        '<script>'
        'var bg=(window.__vgRoot?window.__vgRoot():parent);'
        'try{bg.ACTION_STATUS=-1;bg.iActionStatusFlag="' + flag_val + '";bg.iFwUpgradeState="0";'
        'if(bg.act_sta&&bg.act_sta.damage_alert)bg.act_sta.damage_alert();}catch(e){}'
        f'{saved_js}'
        '</script></body></html>'
    )
    return _render.inject_iframe_shim(raw_html)


def _select_html(name, cur, options):
    opts = "".join(f'<option value="{_esc(v)}"{_sel(cur, v)}>{_esc(lbl)}</option>' for v, lbl in options)
    return f'<select name="{_esc(name)}">{opts}</select>'


# ---------------------------------------------------------------------------
# Wireless 5GHz (dualwl.cgi) & 2.4GHz WDS / Station Control (fid=2047, 2101)
# ---------------------------------------------------------------------------

def _dualwl_defaults(fid):
    f = str(fid)
    if f == "0":
        return {
            "enWlan": "1",
            "mode": "11ax_ac_n_a",
            "channel": "36",
            "ssid1": "DrayTek-5G",
            "enSsid1": "1",
            "hide1": "0",
            "iso1": "0",
            "ssid2": "DrayTek-5G_Guest",
            "enSsid2": "0",
            "subnet": "LAN1",
        }
    if f == "2":
        return {"ssidIdx": "1", "secMode": "WPA2_WPA3", "encMode": "AES", "psk": "DrayTek5G@2026", "rekey": "3600"}
    if f == "4":
        return {"enAcl": "0", "aclPolicy": "white", "isoLan": "0", "mac1": "AA:BB:CC:11:22:33", "cmt1": "Office-AP"}
    if f == "6":
        return {"enWps": "1", "wpsMode": "PBC", "pin": "12345670"}
    if f in ("7", "2047"):
        return {
            "wdsMode": "disable",
            "phyMode": "HTMIX" if f == "2047" else "VHT",
            "peerMac1": "",
            "peerMac2": "",
            "wdsSec": "NONE",
            "wdsKey": "",
        }
    if f == "10":
        return {"bw": "80", "txPower": "100", "beacon": "100", "dtim": "1", "rts": "2347", "frag": "2346", "muMimo": "1"}
    if f in ("14", "2101"):
        return {"enStaCtl": "0", "maxSta": "64", "connTime": "0", "reconnTime": "60"}
    if f == "16":
        return {"enBw": "0", "autoAdj": "0", "upLimit": "100", "downLimit": "300"}
    return {}


def _build_dualwl_body(fid, cfg, band="5 GHz"):
    f = str(fid)
    is_24 = band == "2.4 GHz"
    if f == "0":
        ch_opts = "".join(
            f'<option value="{v}"{_sel(cfg.get("channel"), v)}>{lbl}</option>'
            for v, lbl in [
                ("0", "Auto"), ("36", "Channel 36, 5180MHz"), ("40", "Channel 40, 5200MHz"),
                ("44", "Channel 44, 5220MHz"), ("48", "Channel 48, 5240MHz"),
                ("149", "Channel 149, 5745MHz"), ("153", "Channel 153, 5765MHz"),
                ("157", "Channel 157, 5785MHz"), ("161", "Channel 161, 5805MHz"),
            ]
        )
        m_opts = "".join(
            f'<option value="{v}"{_sel(cfg.get("mode"), v)}>{lbl}</option>'
            for v, lbl in [
                ("11ax_ac_n_a", "11a/n/ac/ax Mixed"),
                ("11ac_n_a", "11a/n/ac Mixed"),
                ("11n_a", "11a/n Mixed"),
                ("11a", "11a Only"),
            ]
        )
        return (
            '<table class="vg-sec" border="1" bordercolor="#ccc">'
            f'<tr><td colspan="2"><input type="checkbox" name="enWlan" value="1"{_chk(cfg.get("enWlan") == "1")}> <b>Enable Wireless LAN (5 GHz)</b></td></tr>'
            f'<tr><td class="vg-lbl">Mode</td><td><select name="mode">{m_opts}</select></td></tr>'
            f'<tr><td class="vg-lbl">Channel</td><td><select name="channel">{ch_opts}</select></td></tr>'
            '</table><br>'
            '<table class="vg-sec" border="1" bordercolor="#ccc">'
            '<tr class="vg-hdr"><td>Index</td><td>Enable</td><td>SSID</td><td>Hide SSID</td><td>Isolate Member</td><td>Subnet</td></tr>'
            f'<tr><td align="center">1</td><td align="center"><input type="checkbox" name="enSsid1" value="1"{_chk(cfg.get("enSsid1") == "1")}></td>'
            f'<td><input type="text" name="ssid1" value="{_esc(cfg.get("ssid1"))}" maxlength="32"></td>'
            f'<td align="center"><input type="checkbox" name="hide1" value="1"{_chk(cfg.get("hide1") == "1")}></td>'
            f'<td align="center"><input type="checkbox" name="iso1" value="1"{_chk(cfg.get("iso1") == "1")}></td>'
            f'<td><select name="subnet"><option value="LAN1"{_sel(cfg.get("subnet"), "LAN1")}>LAN1</option>'
            f'<option value="LAN2"{_sel(cfg.get("subnet"), "LAN2")}>LAN2</option></select></td></tr>'
            f'<tr><td align="center">2</td><td align="center"><input type="checkbox" name="enSsid2" value="1"{_chk(cfg.get("enSsid2") == "1")}></td>'
            f'<td><input type="text" name="ssid2" value="{_esc(cfg.get("ssid2"))}" maxlength="32"></td>'
            '<td align="center">-</td><td align="center">-</td><td>LAN2</td></tr>'
            '</table>'
        )
    if f == "2":
        sec_opts = "".join(
            f'<option value="{v}"{_sel(cfg.get("secMode"), v)}>{lbl}</option>'
            for v, lbl in [
                ("Disable", "Disable"),
                ("WPA2_PSK", "WPA2/PSK"),
                ("WPA3_SAE", "WPA3/SAE"),
                ("WPA2_WPA3", "Mixed(WPA2+WPA3)/PSK"),
                ("WPA2_8021X", "WPA2/802.1X"),
            ]
        )
        return (
            '<table class="vg-sec" border="1" bordercolor="#ccc">'
            f'<tr><td class="vg-lbl">SSID Profile</td><td><select name="ssidIdx">'
            f'<option value="1"{_sel(cfg.get("ssidIdx"), "1")}>SSID 1 (DrayTek-5G)</option>'
            f'<option value="2"{_sel(cfg.get("ssidIdx"), "2")}>SSID 2 (DrayTek-5G_Guest)</option></select></td></tr>'
            f'<tr><td class="vg-lbl">Mode</td><td><select name="secMode">{sec_opts}</select></td></tr>'
            f'<tr><td class="vg-lbl">Encryption Mode</td><td><select name="encMode"><option value="AES"{_sel(cfg.get("encMode"), "AES")}>AES (CCMP)</option><option value="TKIP_AES"{_sel(cfg.get("encMode"), "TKIP_AES")}>TKIP / AES</option></select></td></tr>'
            f'<tr><td class="vg-lbl">Pass Phrase (PSK)</td><td><input type="text" name="psk" value="{_esc(cfg.get("psk"))}" size="32" maxlength="63"> (8~63 ASCII)</td></tr>'
            f'<tr><td class="vg-lbl">Key Renewal Interval</td><td><input type="text" name="rekey" value="{_esc(cfg.get("rekey"))}" size="6"> seconds</td></tr>'
            '</table>'
        )
    if f == "4":
        return (
            '<table class="vg-sec" border="1" bordercolor="#ccc">'
            f'<tr><td class="vg-lbl">Activate MAC Address Filter</td><td><input type="checkbox" name="enAcl" value="1"{_chk(cfg.get("enAcl") == "1")}> Enable</td></tr>'
            f'<tr><td class="vg-lbl">Policy</td><td><select name="aclPolicy"><option value="white"{_sel(cfg.get("aclPolicy"), "white")}>White List (Allow)</option><option value="black"{_sel(cfg.get("aclPolicy"), "black")}>Black List (Block)</option></select></td></tr>'
            f'<tr><td class="vg-lbl">Isolate WLAN from LAN</td><td><input type="checkbox" name="isoLan" value="1"{_chk(cfg.get("isoLan") == "1")}> Enable</td></tr>'
            f'<tr><td class="vg-lbl">MAC Entry 1</td><td><input type="text" name="mac1" value="{_esc(cfg.get("mac1"))}" size="20"> Comment: <input type="text" name="cmt1" value="{_esc(cfg.get("cmt1"))}" size="14"></td></tr>'
            '</table>'
        )
    if f == "6":
        return (
            '<table class="vg-sec" border="1" bordercolor="#ccc">'
            f'<tr><td class="vg-lbl">Enable WPS</td><td><input type="checkbox" name="enWps" value="1"{_chk(cfg.get("enWps") == "1")}> Enable</td></tr>'
            f'<tr><td class="vg-lbl">WPS Mode</td><td><label><input type="radio" name="wpsMode" value="PBC"{_chk(cfg.get("wpsMode") == "PBC")}> Push Button (PBC)</label> &nbsp; '
            f'<label><input type="radio" name="wpsMode" value="PIN"{_chk(cfg.get("wpsMode") == "PIN")}> PIN Code</label></td></tr>'
            f'<tr><td class="vg-lbl">Router WPS PIN</td><td><input type="text" name="pin" value="{_esc(cfg.get("pin"))}" size="12" maxlength="8"></td></tr>'
            '<tr><td class="vg-lbl">WPS Status</td><td>Configured (5 GHz Ready)</td></tr>'
            '</table>'
        )
    if f in ("7", "2047"):
        phy_opts = (
            [("HTMIX", "11b/g/n Mixed"), ("N", "11n Only"), ("BG", "11b/g Mixed")]
            if is_24 else
            [("VHT", "VHT (802.11ac)"), ("HTMIX", "HTMIX (802.11n)")]
        )
        return (
            '<table class="vg-sec" border="1" bordercolor="#ccc">'
            f'<tr><td class="vg-lbl">WDS Mode ({_esc(band)})</td><td><select name="wdsMode"><option value="disable"{_sel(cfg.get("wdsMode"), "disable")}>Disable</option>'
            f'<option value="bridge"{_sel(cfg.get("wdsMode"), "bridge")}>Bridge</option><option value="repeater"{_sel(cfg.get("wdsMode"), "repeater")}>Repeater</option></select></td></tr>'
            f'<tr><td class="vg-lbl">PHY Mode</td><td>{_select_html("phyMode", cfg.get("phyMode"), phy_opts)}</td></tr>'
            f'<tr><td class="vg-lbl">Peer MAC Address 1</td><td><input type="text" name="peerMac1" value="{_esc(cfg.get("peerMac1"))}" placeholder="00:1D:AA:xx:xx:xx" size="22"></td></tr>'
            f'<tr><td class="vg-lbl">Peer MAC Address 2</td><td><input type="text" name="peerMac2" value="{_esc(cfg.get("peerMac2"))}" size="22"></td></tr>'
            f'<tr><td class="vg-lbl">Security</td><td><select name="wdsSec"><option value="NONE"{_sel(cfg.get("wdsSec"), "NONE")}>Disable</option><option value="AES"{_sel(cfg.get("wdsSec"), "AES")}>WPA2/AES</option></select> Key: <input type="text" name="wdsKey" value="{_esc(cfg.get("wdsKey"))}" size="18"></td></tr>'
            '</table>'
        )
    if f == "10":
        return (
            '<table class="vg-sec" border="1" bordercolor="#ccc">'
            f'<tr><td class="vg-lbl">Channel Bandwidth</td><td><select name="bw">'
            f'<option value="20"{_sel(cfg.get("bw"), "20")}>20 MHz</option>'
            f'<option value="40"{_sel(cfg.get("bw"), "40")}>20/40 MHz</option>'
            f'<option value="80"{_sel(cfg.get("bw"), "80")}>Auto 20/40/80 MHz</option>'
            f'<option value="160"{_sel(cfg.get("bw"), "160")}>160 MHz</option></select></td></tr>'
            f'<tr><td class="vg-lbl">TX Power</td><td><select name="txPower">'
            f'<option value="100"{_sel(cfg.get("txPower"), "100")}>100%</option>'
            f'<option value="80"{_sel(cfg.get("txPower"), "80")}>80%</option>'
            f'<option value="60"{_sel(cfg.get("txPower"), "60")}>60%</option>'
            f'<option value="40"{_sel(cfg.get("txPower"), "40")}>40%</option></select></td></tr>'
            f'<tr><td class="vg-lbl">Beacon Interval</td><td><input type="text" name="beacon" value="{_esc(cfg.get("beacon"))}" size="6"> ms (20~1000)</td></tr>'
            f'<tr><td class="vg-lbl">DTIM Period</td><td><input type="text" name="dtim" value="{_esc(cfg.get("dtim"))}" size="6"> (1~255)</td></tr>'
            f'<tr><td class="vg-lbl">RTS / Fragmentation Threshold</td><td><input type="text" name="rts" value="{_esc(cfg.get("rts"))}" size="6"> / <input type="text" name="frag" value="{_esc(cfg.get("frag"))}" size="6"></td></tr>'
            f'<tr><td class="vg-lbl">MU-MIMO / OFDMA</td><td><input type="checkbox" name="muMimo" value="1"{_chk(cfg.get("muMimo") == "1")}> Enable</td></tr>'
            '</table>'
        )
    if f == "13":
        return (
            '<table class="vg-sec" border="1" bordercolor="#ccc">'
            '<tr class="vg-hdr"><td>Index</td><td>MAC Address</td><td>SSID</td><td>Rate / RSSI</td><td>Status</td></tr>'
            '<tr><td align="center">1</td><td>74:56:3C:88:1A:22</td><td>DrayTek-5G</td><td>866 Mbps / -48 dBm</td><td>Associated</td></tr>'
            '</table>'
        )
    if f in ("14", "2101"):
        sample_ssid = "DrayTek-2.4G" if is_24 else "DrayTek-5G"
        sample_rate = "144 Mbps / -52 dBm" if is_24 else "866 Mbps / -48 dBm"
        return (
            '<table class="vg-sec" border="1" bordercolor="#ccc">'
            f'<tr><td class="vg-lbl">Enable Station Control ({_esc(band)})</td><td><input type="checkbox" name="enStaCtl" value="1"{_chk(cfg.get("enStaCtl") == "1")}> Enable</td></tr>'
            f'<tr><td class="vg-lbl">Max Associated Stations</td><td><input type="text" name="maxSta" value="{_esc(cfg.get("maxSta"))}" size="6"></td></tr>'
            f'<tr><td class="vg-lbl">Connection / Reconnection Time</td><td><input type="text" name="connTime" value="{_esc(cfg.get("connTime"))}" size="6"> min / <input type="text" name="reconnTime" value="{_esc(cfg.get("reconnTime"))}" size="6"> min</td></tr>'
            '</table><br>'
            '<table class="vg-sec" border="1" bordercolor="#ccc">'
            '<tr class="vg-hdr"><td>Index</td><td>MAC Address</td><td>SSID</td><td>Rate / RSSI</td><td>Status</td></tr>'
            f'<tr><td align="center">1</td><td>74:56:3C:88:1A:22</td><td>{_esc(sample_ssid)}</td><td>{_esc(sample_rate)}</td><td>Associated</td></tr>'
            '</table>'
        )
    if f == "16":
        return (
            '<table class="vg-sec" border="1" bordercolor="#ccc">'
            f'<tr><td class="vg-lbl">Per-Station Bandwidth Limit</td><td><input type="checkbox" name="enBw" value="1"{_chk(cfg.get("enBw") == "1")}> Enable</td></tr>'
            f'<tr><td class="vg-lbl">Auto Adjustment</td><td><input type="checkbox" name="autoAdj" value="1"{_chk(cfg.get("autoAdj") == "1")}> Enable</td></tr>'
            f'<tr><td class="vg-lbl">Upload / Download Limit (Mbps)</td><td><input type="text" name="upLimit" value="{_esc(cfg.get("upLimit"))}" size="6"> / <input type="text" name="downLimit" value="{_esc(cfg.get("downLimit"))}" size="6"> Mbps</td></tr>'
            '</table>'
        )
    return (
        '<table class="vg-sec" border="1" bordercolor="#ccc">'
        '<tr class="vg-hdr"><td>Index</td><td>SSID</td><td>BSSID</td><td>Channel</td><td>Mode</td><td>Signal</td><td>Security</td></tr>'
        '<tr><td align="center">1</td><td>DrayTek-5G</td><td>00:1D:AA:29:27:05</td><td align="center">36</td><td>11a/n/ac/ax</td><td>92% (-45 dBm)</td><td>WPA2/PSK</td></tr>'
        '<tr><td align="center">2</td><td>FPT-Office-5G</td><td>C8:54:4B:12:90:1A</td><td align="center">149</td><td>11a/n/ac/ax</td><td>74% (-61 dBm)</td><td>WPA2/WPA3</td></tr>'
        '</table>'
    )


# ---------------------------------------------------------------------------
# Authentic Handlers for Missing / Broken / Wrong-Catchall Vigor2927 Pages
# ---------------------------------------------------------------------------

def _load_cfg(config_store, path, fid, defaults):
    cfg = dict(defaults)
    stored = config_store.lay(_store_key(path, fid), "fields")
    if isinstance(stored, dict):
        cfg.update(stored)
    return cfg


def _render_v2x00_extra(fid, params, config_store, saved):
    p = "/cgi-bin/v2x00.cgi"
    if fid == "2047":
        cfg = _load_cfg(config_store, p, fid, _dualwl_defaults("2047"))
        return _render_vigor_page(
            "Wireless LAN (2.4 GHz)", "WDS Settings", p, "2047", {},
            _build_dualwl_body("2047", cfg, band="2.4 GHz"),
            notes=["Peer MAC settings for 2.4 GHz WDS Bridge / Repeater mode."],
            saved=saved,
        )
    if fid == "2101":
        cfg = _load_cfg(config_store, p, fid, _dualwl_defaults("2101"))
        return _render_vigor_page(
            "Wireless LAN (2.4 GHz)", "Station Control", p, "2101", {},
            _build_dualwl_body("2101", cfg, band="2.4 GHz"),
            saved=saved,
        )
    if fid == "2049":
        cfg = _load_cfg(config_store, p, fid, {"enAi": "1", "aiMode": "Detect_Block"})
        body = (
            '<table class="vg-sec" border="1" bordercolor="#ccc">'
            f'<tr><td class="vg-lbl">Enable Anti-Intrusion / DoS Protection</td><td><input type="checkbox" name="enAi" value="1"{_chk(cfg.get("enAi") == "1")}> Enable</td></tr>'
            f'<tr><td class="vg-lbl">Protection Mode</td><td>{_select_html("aiMode", cfg.get("aiMode"), [("Detect_Block", "Detect and Block"), ("Log_Only", "Log Only")])}</td></tr>'
            '<tr><td class="vg-lbl">SYN / UDP / ICMP Flood Threshold</td><td>Default Vigor Defense Profile Active</td></tr>'
            '</table>'
        )
        return _render_vigor_page("Firewall", "Defense Setup - Anti-Intrusion", p, "2049", {}, body, saved=saved)

    if fid == "104":
        cfg = _load_cfg(config_store, p, fid, {"en": "1", "mode": "PPPoE", "mtu": "1492", "nat": "1"})
        body = (
            '<table class="vg-sec" border="1" bordercolor="#ccc">'
            f'<tr><td class="vg-lbl">Enable WAN Profile</td><td><input type="checkbox" name="en" value="1"{_chk(cfg.get("en") == "1")}> Enable</td></tr>'
            f'<tr><td class="vg-lbl">Access Mode</td><td>{_select_html("mode", cfg.get("mode"), [("PPPoE", "PPPoE"), ("DHCP", "DHCP"), ("Static", "Static IP"), ("PPTP", "PPTP / L2TP")])}</td></tr>'
            f'<tr><td class="vg-lbl">MTU Size</td><td><input type="text" name="mtu" value="{_esc(cfg.get("mtu"))}" size="8"></td></tr>'
            f'<tr><td class="vg-lbl">NAT Mode</td><td><input type="checkbox" name="nat" value="1"{_chk(cfg.get("nat") == "1")}> Enable Hardware NAT</td></tr>'
            '</table>'
        )
        return _render_vigor_page("WAN", "Internet Access Setup", p, "104", {"iAct": "1"}, body, saved=saved)

    if fid == "2030":
        cfg = _load_cfg(config_store, p, fid, {
            "wanIdx": "WAN1", "enPppoe": "1", "svcName": "", "user": "", "pwd": "",
            "mtu": "1492", "connMode": "always", "fixedIp": "0", "ipAddr": "",
        })
        body = (
            '<table class="vg-sec" border="1" bordercolor="#ccc">'
            f'<tr><td class="vg-lbl">WAN Interface</td><td>{_select_html("wanIdx", cfg.get("wanIdx"), [("WAN1", "WAN1"), ("WAN2", "WAN2")])}</td></tr>'
            f'<tr><td class="vg-lbl">PPPoE / PPPoA Client</td><td><input type="checkbox" name="enPppoe" value="1"{_chk(cfg.get("enPppoe") == "1")}> Enable</td></tr>'
            f'<tr><td class="vg-lbl">Service Name</td><td><input type="text" name="svcName" value="{_esc(cfg.get("svcName"))}" size="28"></td></tr>'
            f'<tr><td class="vg-lbl">Username</td><td><input type="text" name="user" value="{_esc(cfg.get("user"))}" size="28"></td></tr>'
            f'<tr><td class="vg-lbl">Password</td><td><input type="password" name="pwd" value="{_esc(cfg.get("pwd"))}" size="28"></td></tr>'
            f'<tr><td class="vg-lbl">MTU Size</td><td><input type="text" name="mtu" value="{_esc(cfg.get("mtu"))}" size="8"> (default 1492)</td></tr>'
            f'<tr><td class="vg-lbl">Connection Mode</td><td>{_select_html("connMode", cfg.get("connMode"), [("always", "Always On"), ("demand", "Dial on Demand")])}</td></tr>'
            f'<tr><td class="vg-lbl">Fixed IP</td><td><input type="checkbox" name="fixedIp" value="1"{_chk(cfg.get("fixedIp") == "1")}> Yes &nbsp; '
            f'IP: <input type="text" name="ipAddr" value="{_esc(cfg.get("ipAddr"))}" size="16"></td></tr>'
            '</table>'
        )
        return _render_vigor_page("Internet Access", "PPPoE / PPPoA", p, "2030", {}, body, saved=saved)

    if fid == "2031":
        cfg = _load_cfg(config_store, p, fid, {
            "wanIdx": "WAN1", "enIp": "1", "ipMode": "dhcp", "ip": "192.168.100.2",
            "mask": "255.255.255.0", "gw": "192.168.100.1", "dns1": "8.8.8.8", "dns2": "1.1.1.1", "macClone": "",
        })
        body = (
            '<table class="vg-sec" border="1" bordercolor="#ccc">'
            f'<tr><td class="vg-lbl">WAN Interface</td><td>{_select_html("wanIdx", cfg.get("wanIdx"), [("WAN1", "WAN1"), ("WAN2", "WAN2")])}</td></tr>'
            f'<tr><td class="vg-lbl">Static or Dynamic IP</td><td><input type="checkbox" name="enIp" value="1"{_chk(cfg.get("enIp") == "1")}> Enable</td></tr>'
            f'<tr><td class="vg-lbl">Addressing Mode</td><td><label><input type="radio" name="ipMode" value="dhcp"{_chk(cfg.get("ipMode") == "dhcp")}> Obtain an IP address automatically (DHCP)</label><br>'
            f'<label><input type="radio" name="ipMode" value="static"{_chk(cfg.get("ipMode") == "static")}> Specify an IP address</label></td></tr>'
            f'<tr><td class="vg-lbl">IP Address / Subnet Mask</td><td><input type="text" name="ip" value="{_esc(cfg.get("ip"))}" size="16"> / <input type="text" name="mask" value="{_esc(cfg.get("mask"))}" size="16"></td></tr>'
            f'<tr><td class="vg-lbl">Gateway IP Address</td><td><input type="text" name="gw" value="{_esc(cfg.get("gw"))}" size="16"></td></tr>'
            f'<tr><td class="vg-lbl">Primary / Secondary DNS</td><td><input type="text" name="dns1" value="{_esc(cfg.get("dns1"))}" size="16"> / <input type="text" name="dns2" value="{_esc(cfg.get("dns2"))}" size="16"></td></tr>'
            f'<tr><td class="vg-lbl">MAC Address Spoofing</td><td><input type="text" name="macClone" value="{_esc(cfg.get("macClone"))}" size="20" placeholder="00:1D:AA:xx:xx:xx"></td></tr>'
            '</table>'
        )
        return _render_vigor_page("Internet Access", "Static or Dynamic IP", p, "2031", {}, body, saved=saved)

    if fid == "2032":
        cfg = _load_cfg(config_store, p, fid, {
            "wanIdx": "WAN1", "en": "0", "proto": "PPTP", "srvIp": "", "user": "", "pwd": "", "ipMode": "dhcp",
        })
        body = (
            '<table class="vg-sec" border="1" bordercolor="#ccc">'
            f'<tr><td class="vg-lbl">Enable PPTP / L2TP</td><td><input type="checkbox" name="en" value="1"{_chk(cfg.get("en") == "1")}> Enable</td></tr>'
            f'<tr><td class="vg-lbl">Protocol</td><td>{_select_html("proto", cfg.get("proto"), [("PPTP", "PPTP"), ("L2TP", "L2TP")])}</td></tr>'
            f'<tr><td class="vg-lbl">Server IP / Hostname</td><td><input type="text" name="srvIp" value="{_esc(cfg.get("srvIp"))}" size="28"></td></tr>'
            f'<tr><td class="vg-lbl">Username / Password</td><td><input type="text" name="user" value="{_esc(cfg.get("user"))}" size="18"> / <input type="password" name="pwd" value="{_esc(cfg.get("pwd"))}" size="18"></td></tr>'
            f'<tr><td class="vg-lbl">WAN Addressing</td><td>{_select_html("ipMode", cfg.get("ipMode"), [("dhcp", "Dynamic (DHCP)"), ("static", "Static IP")])}</td></tr>'
            '</table>'
        )
        return _render_vigor_page("Internet Access", "PPTP/L2TP", p, "2032", {}, body, saved=saved)

    if fid == "2011":
        cfg = _load_cfg(config_store, p, fid, {"en": "0", "ispName": "Vigor ISP", "dialNum": "*99#", "apn": "v-internet", "user": "", "idle": "300"})
        body = (
            '<table class="vg-sec" border="1" bordercolor="#ccc">'
            f'<tr><td class="vg-lbl">Enable ISP Profile</td><td><input type="checkbox" name="en" value="1"{_chk(cfg.get("en") == "1")}> Enable</td></tr>'
            f'<tr><td class="vg-lbl">ISP Name</td><td><input type="text" name="ispName" value="{_esc(cfg.get("ispName"))}" size="24"></td></tr>'
            f'<tr><td class="vg-lbl">Dial Number / APN</td><td><input type="text" name="dialNum" value="{_esc(cfg.get("dialNum"))}" size="12"> / <input type="text" name="apn" value="{_esc(cfg.get("apn"))}" size="18"></td></tr>'
            f'<tr><td class="vg-lbl">Username</td><td><input type="text" name="user" value="{_esc(cfg.get("user"))}" size="22"></td></tr>'
            f'<tr><td class="vg-lbl">Idle Timeout (sec)</td><td><input type="text" name="idle" value="{_esc(cfg.get("idle"))}" size="8"></td></tr>'
            '</table>'
        )
        return _render_vigor_page("USB Modem", "Dialing to a Single ISP", p, "2011", {}, body, saved=saved)

    if fid == "3002":
        cfg = _load_cfg(config_store, p, fid, {"en": "0", "portalTitle": "Guest Wi-Fi", "ssid": "DrayTek-Guest", "timeout": "60", "redirect": "https://www.draytek.com/"})
        body = (
            '<table class="vg-sec" border="1" bordercolor="#ccc">'
            f'<tr><td class="vg-lbl">Enable Guest Hotspot</td><td><input type="checkbox" name="en" value="1"{_chk(cfg.get("en") == "1")}> Enable</td></tr>'
            f'<tr><td class="vg-lbl">Portal Title</td><td><input type="text" name="portalTitle" value="{_esc(cfg.get("portalTitle"))}" size="28"></td></tr>'
            f'<tr><td class="vg-lbl">Bound SSID / VLAN</td><td><input type="text" name="ssid" value="{_esc(cfg.get("ssid"))}" size="24"></td></tr>'
            f'<tr><td class="vg-lbl">Session Timeout (min)</td><td><input type="text" name="timeout" value="{_esc(cfg.get("timeout"))}" size="8"></td></tr>'
            f'<tr><td class="vg-lbl">Landing Redirect URL</td><td><input type="text" name="redirect" value="{_esc(cfg.get("redirect"))}" size="36"></td></tr>'
            '</table>'
        )
        return _render_vigor_page("Hotspot Web Portal", "Guest Hotspot", p, "3002", {}, body, saved=saved)

    if fid == "2034":
        cfg = _load_cfg(config_store, p, fid, {"en": "0", "wanIdx": "WAN1", "prioHigh": "70", "prioMed": "20", "prioLow": "10"})
        body = (
            '<table class="vg-sec" border="1" bordercolor="#ccc">'
            f'<tr><td class="vg-lbl">Enable Application QoS</td><td><input type="checkbox" name="en" value="1"{_chk(cfg.get("en") == "1")}> Enable</td></tr>'
            f'<tr><td class="vg-lbl">Target Interface</td><td>{_select_html("wanIdx", cfg.get("wanIdx"), [("WAN1", "WAN1"), ("WAN2", "WAN2"), ("ALL", "All WANs")])}</td></tr>'
            f'<tr><td class="vg-lbl">High / Medium / Low Ratio (%)</td><td><input type="text" name="prioHigh" value="{_esc(cfg.get("prioHigh"))}" size="4">% / '
            f'<input type="text" name="prioMed" value="{_esc(cfg.get("prioMed"))}" size="4">% / '
            f'<input type="text" name="prioLow" value="{_esc(cfg.get("prioLow"))}" size="4">%</td></tr>'
            '<tr><td class="vg-lbl">Detailed Class Rules</td><td>Configured via Bandwidth Management &gt;&gt; Quality of Service</td></tr>'
            '</table>'
        )
        return _render_vigor_page("Applications", "Quality of Service", p, "2034", {}, body, saved=saved)

    if fid == "2211":
        cfg = _load_cfg(config_store, p, fid, {"en": "1", "txInt": "30", "hold": "4", "lldpMed": "1"})
        body = (
            '<table class="vg-sec" border="1" bordercolor="#ccc">'
            f'<tr><td class="vg-lbl">Enable LLDP</td><td><input type="checkbox" name="en" value="1"{_chk(cfg.get("en") == "1")}> Enable Link Layer Discovery Protocol</td></tr>'
            f'<tr><td class="vg-lbl">Transmit Interval (sec)</td><td><input type="text" name="txInt" value="{_esc(cfg.get("txInt"))}" size="6"> (5~32768)</td></tr>'
            f'<tr><td class="vg-lbl">Hold Multiplier</td><td><input type="text" name="hold" value="{_esc(cfg.get("hold"))}" size="6"> (2~10)</td></tr>'
            f'<tr><td class="vg-lbl">LLDP-MED TLV</td><td><input type="checkbox" name="lldpMed" value="1"{_chk(cfg.get("lldpMed") == "1")}> Enable</td></tr>'
            '</table><br>'
            '<table class="vg-sec" border="1" bordercolor="#ccc">'
            '<tr class="vg-hdr"><td>Local Port</td><td>Chassis ID</td><td>Remote Port</td><td>System Name</td><td>Capabilities</td></tr>'
            '<tr><td align="center">P1</td><td>00:1D:AA:55:10:01</td><td>Gi1/0/24</td><td>VigorSwitch-P2280x</td><td>Bridge, PoE</td></tr>'
            '</table>'
        )
        return _render_vigor_page("Applications", "LLDP", p, "2211", {}, body, saved=saved)

    if fid == "1224":
        body = (
            '<table class="vg-sec" border="1" bordercolor="#ccc">'
            '<tr class="vg-hdr"><td>Index</td><td>Root CA Subject</td><td>Issuer</td><td>Key Usage</td><td>Status</td><td>Valid Until</td></tr>'
            '<tr><td align="center">1</td><td>DrayTek Trusted Root CA</td><td>DrayTek Corp.</td><td>Certificate Sign, CRL</td><td class="vg-badge-ok">Valid</td><td>2036-12-31</td></tr>'
            '<tr><td align="center">2</td><td>ISRG Root X1</td><td>Internet Security Research Group</td><td>Server Auth</td><td class="vg-badge-ok">Valid</td><td>2035-06-04</td></tr>'
            '<tr><td align="center">3</td><td>DigiCert Global Root G2</td><td>DigiCert Inc</td><td>Server Auth</td><td class="vg-badge-ok">Valid</td><td>2038-01-15</td></tr>'
            '</table><br>'
            '<table class="vg-sec" border="1" bordercolor="#ccc">'
            '<tr><td class="vg-lbl">Import Trusted RootCA (PEM/DER)</td><td><input type="file" name="rootCaFile"> '
            '<input class="btnw" type="button" value="Import" onclick="alert(\'Trusted RootCA verification ready.\')"></td></tr>'
            '</table>'
        )
        return _render_vigor_page(
            "Certificate Management", "Trusted RootCA", p, "1224", {}, body,
            notes=["Pre-installed and imported Trusted Root CA certificates used for HTTPS & VPN peer verification."],
            read_only=True,
        )

    if fid == "2199":
        cfg = _load_cfg(config_store, p, fid, {"en": "0", "wanIf": "WAN1", "vlanId": "35", "igmpProxy": "1"})
        body = (
            '<table class="vg-sec" border="1" bordercolor="#ccc">'
            f'<tr><td class="vg-lbl">Enable IPTV / T-Home Support</td><td><input type="checkbox" name="en" value="1"{_chk(cfg.get("en") == "1")}> Enable</td></tr>'
            f'<tr><td class="vg-lbl">WAN Interface</td><td>{_select_html("wanIf", cfg.get("wanIf"), [("WAN1", "WAN1"), ("WAN2", "WAN2")])}</td></tr>'
            f'<tr><td class="vg-lbl">IPTV VLAN Tag ID</td><td><input type="text" name="vlanId" value="{_esc(cfg.get("vlanId"))}" size="8"> (0 = Untagged)</td></tr>'
            f'<tr><td class="vg-lbl">IGMP Snooping &amp; Proxy</td><td><input type="checkbox" name="igmpProxy" value="1"{_chk(cfg.get("igmpProxy") == "1")}> Enable</td></tr>'
            '</table>'
        )
        return _render_vigor_page("Wizards", "IPTV Wizard", p, "2199", {}, body, saved=saved)

    if fid == "227":
        cfg = _load_cfg(config_store, p, fid, {"algo": "SHA256", "minLen": "8", "complexity": "1"})
        body = (
            '<table class="vg-sec" border="1" bordercolor="#ccc">'
            f'<tr><td class="vg-lbl">Password Storage Algorithm</td><td>{_select_html("algo", cfg.get("algo"), [("SHA256", "SHA-256 (Recommended)"), ("MD5", "MD5"), ("PBKDF2", "PBKDF2-HMAC-SHA256")])}</td></tr>'
            f'<tr><td class="vg-lbl">Minimum Password Length</td><td><input type="text" name="minLen" value="{_esc(cfg.get("minLen"))}" size="6"> characters</td></tr>'
            f'<tr><td class="vg-lbl">Enforce Password Complexity</td><td><input type="checkbox" name="complexity" value="1"{_chk(cfg.get("complexity") == "1")}> Require upper/lower/numeric characters</td></tr>'
            '</table>'
        )
        return _render_vigor_page("System Maintenance", "Password Encryption", p, "227", {}, body, saved=saved)

    if fid == "2072":
        cfg = _load_cfg(config_store, p, fid, {"activeSlot": "1", "desc1": "Primary Office Config", "desc2": "Failover Lab Backup"})
        body = (
            '<table class="vg-sec" border="1" bordercolor="#ccc">'
            '<tr class="vg-hdr"><td>Slot</td><td>Profile Name</td><td>Last Modified</td><td>Status</td></tr>'
            f'<tr><td align="center"><input type="radio" name="activeSlot" value="1"{_chk(cfg.get("activeSlot") == "1")}> 1</td>'
            f'<td><input type="text" name="desc1" value="{_esc(cfg.get("desc1"))}" size="26"></td><td>2026-01-15 09:30</td><td class="vg-badge-ok">Boot Default</td></tr>'
            f'<tr><td align="center"><input type="radio" name="activeSlot" value="2"{_chk(cfg.get("activeSlot") == "2")}> 2</td>'
            f'<td><input type="text" name="desc2" value="{_esc(cfg.get("desc2"))}" size="26"></td><td>2026-01-15 10:12</td><td>Standby</td></tr>'
            '</table>'
        )
        return _render_vigor_page("System Maintenance", "Multiple Configuration", p, "2072", {"sAct": "showpage"}, body, saved=saved)

    if fid == "2226":
        body = (
            '<table class="vg-sec" border="1" bordercolor="#ccc">'
            '<tr><td class="vg-lbl">Router Model</td><td>Vigor2927 Series</td></tr>'
            '<tr><td class="vg-lbl">Current Firmware Version</td><td>4.4.5.1_BT</td></tr>'
            '<tr><td class="vg-lbl">Modem / DSL Code Version</td><td>Ethernet WAN Build (Standard)</td></tr>'
            '<tr><td class="vg-lbl">Select Modem Code File</td><td><input type="file" name="modemFw"> '
            '<input class="btnw" type="button" value="Upgrade" onclick="alert(\'Please select a valid modem firmware image.\')"></td></tr>'
            '</table>'
        )
        return _render_vigor_page("System Maintenance", "Modem Code Upgrade", p, "2226", {}, body, read_only=True)

    if fid == "3004":
        cfg = _load_cfg(config_store, p, fid, {"fmt": "encrypted", "incCert": "1", "pwd": ""})
        body = (
            '<table class="vg-sec" border="1" bordercolor="#ccc">'
            f'<tr><td class="vg-lbl">Export Format</td><td>{_select_html("fmt", cfg.get("fmt"), [("encrypted", "Encrypted Config (.cfg)"), ("plaintext", "Plain Text Config (.txt)")])}</td></tr>'
            f'<tr><td class="vg-lbl">Include X.509 Certificates</td><td><input type="checkbox" name="incCert" value="1"{_chk(cfg.get("incCert") == "1")}> Include Local &amp; Trusted CA Certificates</td></tr>'
            f'<tr><td class="vg-lbl">Archive Password (optional)</td><td><input type="password" name="pwd" value="{_esc(cfg.get("pwd"))}" size="24"></td></tr>'
            '<tr><td class="vg-lbl">Download File</td><td><input class="btnw" type="button" value="Export Config" onclick="alert(\'Configuration export package vigor2927_backup.cfg prepared.\')"></td></tr>'
            '</table>'
        )
        return _render_vigor_page("System Maintenance", "Configuration Export", p, "3004", {}, body, saved=saved)

    if fid == "2314":
        body = (
            '<table class="vg-sec" border="1" bordercolor="#ccc">'
            '<tr class="vg-hdr"><td>Index</td><td>MAC Address</td><td>Port</td><td>VLAN ID</td><td>Type</td><td>Aging (sec)</td></tr>'
            '<tr><td align="center">1</td><td>00-1D-AA-29-27-01</td><td align="center">CPU</td><td align="center">1</td><td>Static</td><td align="center">-</td></tr>'
            '<tr><td align="center">2</td><td>B4-2E-99-41-A8-10</td><td align="center">P1</td><td align="center">1</td><td>Dynamic</td><td align="center">285</td></tr>'
            '<tr><td align="center">3</td><td>74-56-3C-88-1A-22</td><td align="center">P2</td><td align="center">10</td><td>Dynamic</td><td align="center">292</td></tr>'
            '<tr><td align="center">4</td><td>C8-54-4B-12-90-1A</td><td align="center">P4</td><td align="center">1</td><td>Dynamic</td><td align="center">274</td></tr>'
            '</table>'
        )
        return _render_vigor_page("Diagnostics", "MAC Address Table", p, "2314", {}, body, read_only=True)

    if fid == "2356":
        body = (
            '<table class="vg-sec" border="1" bordercolor="#ccc">'
            '<tr><td class="vg-lbl">DSL / Physical Link Status</td><td>Standby (Ethernet WAN Router)</td></tr>'
            '<tr><td class="vg-lbl">WAN1 / WAN2 PHY Speed</td><td>1000 Mbps / Full Duplex (RJ-45 GbE)</td></tr>'
            '<tr><td class="vg-lbl">Downstream / Upstream SNR Margin</td><td>N/A (No internal xDSL modem)</td></tr>'
            '<tr><td class="vg-lbl">CRC / FEC Error Counters</td><td>0 / 0</td></tr>'
            '</table>'
        )
        return _render_vigor_page("Diagnostics", "DSL Status", p, "2356", {}, body, read_only=True)

    if fid == "2565":
        cfg = _load_cfg(config_store, p, fid, {"iface": "WAN1", "proto": "ALL", "hostFilter": "", "maxPkt": "2000"})
        body = (
            '<table class="vg-sec" border="1" bordercolor="#ccc">'
            f'<tr><td class="vg-lbl">Capture Interface</td><td>{_select_html("iface", cfg.get("iface"), [("WAN1", "WAN1 (GigabitEthernet)"), ("WAN2", "WAN2 (GigabitEthernet)"), ("LAN1", "LAN1 (br0)")])}</td></tr>'
            f'<tr><td class="vg-lbl">Protocol Filter</td><td>{_select_html("proto", cfg.get("proto"), [("ALL", "All Protocols"), ("TCP", "TCP Only"), ("UDP", "UDP Only"), ("ICMP", "ICMP / Ping")])}</td></tr>'
            f'<tr><td class="vg-lbl">Host IP Filter (optional)</td><td><input type="text" name="hostFilter" value="{_esc(cfg.get("hostFilter"))}" size="22" placeholder="192.168.1.10"></td></tr>'
            f'<tr><td class="vg-lbl">Max Packet Count</td><td><input type="text" name="maxPkt" value="{_esc(cfg.get("maxPkt"))}" size="8"> (100~10000)</td></tr>'
            '<tr><td class="vg-lbl">Capture Control</td><td><span class="vg-badge-ok">Ready</span> &nbsp; '
            '<input class="btnw" type="button" value="Download PCAP" onclick="alert(\'Captured buffer vigor2927_capture.pcap ready.\')"></td></tr>'
            '</table>'
        )
        return _render_vigor_page("Diagnostics", "Packet Capture", p, "2565", {"sProfileAct": "showpage"}, body, saved=saved)

    if fid == "4047":
        body = (
            '<table class="vg-sec" border="1" bordercolor="#ccc">'
            '<tr><td class="vg-lbl">Diagnostic Trace Log Status</td><td>Buffered (12.4 KB ready)</td></tr>'
            '<tr><td class="vg-lbl">Log Preview</td><td><pre style="margin:0;font-size:11px">[SYS] Vigor2927 kernel ready\n[WAN] WAN1 GbE link monitoring active\n[LAN] DHCPv4 server running on 192.168.1.1/24</pre></td></tr>'
            '<tr><td class="vg-lbl">Export Diagnostic Archive</td><td><input class="btnw" type="button" value="Download DTI Log" onclick="alert(\'DTI diagnostic log archive downloaded.\')"></td></tr>'
            '</table>'
        )
        return _render_vigor_page("Diagnostics", "DTI log download", p, "4047", {}, body, read_only=True)

    return None


def _render_lte_extra(fid, params, config_store, saved):
    p = "/cgi-bin/cgilte.cgi"
    if fid == "0":
        cfg = _load_cfg(config_store, p, "0", {"enCmd": "1", "allowReboot": "1", "allowStatus": "1", "authNum": "+84"})
        body = (
            '<table class="vg-sec" border="1" bordercolor="#ccc">'
            f'<tr><td class="vg-lbl">Enable SMS Router Commands</td><td><input type="checkbox" name="enCmd" value="1"{_chk(cfg.get("enCmd") == "1")}> Enable</td></tr>'
            f'<tr><td class="vg-lbl">Authorized Sender Prefix</td><td><input type="text" name="authNum" value="{_esc(cfg.get("authNum"))}" size="20"></td></tr>'
            f'<tr><td class="vg-lbl">Allowed Commands</td><td>'
            f'<label><input type="checkbox" name="allowReboot" value="1"{_chk(cfg.get("allowReboot") == "1")}> reboot / reconnect wan</label><br>'
            f'<label><input type="checkbox" name="allowStatus" value="1"{_chk(cfg.get("allowStatus") == "1")}> get status / ipinfo</label></td></tr>'
            '</table>'
        )
        return _render_vigor_page("LTE", "Router Commands", p, "0", {}, body, saved=saved)
    if fid == "4":
        body = (
            '<table class="vg-sec" border="1" bordercolor="#ccc">'
            '<tr class="vg-hdr"><td>Index</td><td>Sender</td><td>Received Time</td><td>Message Content</td><td>Status</td></tr>'
            '<tr><td align="center">1</td><td>CarrierInfo</td><td>2026-01-02 00:18:10</td><td>Your LTE data package is active (4G+ Ready).</td><td>Read</td></tr>'
            '<tr><td align="center">2</td><td>+84901234567</td><td>2026-01-02 00:21:04</td><td>status</td><td>Processed</td></tr>'
            '</table>'
        )
        return _render_vigor_page("LTE", "SMS Inbox", p, "4", {"iAct": "0", "iMode": "0"}, body, read_only=True)
    if fid == "2":
        cfg = _load_cfg(config_store, p, "2", {"modemIdx": "USB", "toNum": "", "msg": "Vigor2927 Test SMS", "encoding": "GSM7"})
        body = (
            '<table class="vg-sec" border="1" bordercolor="#ccc">'
            f'<tr><td class="vg-lbl">LTE Interface</td><td>{_select_html("modemIdx", cfg.get("modemIdx"), [("USB", "USB LTE Dongle"), ("SIM1", "Internal SIM 1")])}</td></tr>'
            f'<tr><td class="vg-lbl">Recipient Phone Number</td><td><input type="text" name="toNum" value="{_esc(cfg.get("toNum"))}" size="24" placeholder="+84..."></td></tr>'
            f'<tr><td class="vg-lbl">Encoding</td><td>{_select_html("encoding", cfg.get("encoding"), [("GSM7", "7-bit ASCII / GSM"), ("UCS2", "Unicode (UCS-2)")])}</td></tr>'
            f'<tr><td class="vg-lbl">SMS Content</td><td><textarea name="msg" rows="4" cols="44">{_esc(cfg.get("msg"))}</textarea></td></tr>'
            '</table>'
        )
        return _render_vigor_page("LTE", "Send SMS", p, "2", {}, body, saved=saved)
    if fid == "17":
        cfg = _load_cfg(config_store, p, "17", {"enGps": "0", "nmeaFwd": "0", "srvIp": "", "srvPort": "9000"})
        body = (
            '<table class="vg-sec" border="1" bordercolor="#ccc">'
            f'<tr><td class="vg-lbl">Enable LTE GPS Receiver</td><td><input type="checkbox" name="enGps" value="1"{_chk(cfg.get("enGps") == "1")}> Enable</td></tr>'
            '<tr><td class="vg-lbl">Fix Status / Satellites</td><td>Standby (0 Satellites — No LTE GPS Module Attached)</td></tr>'
            '<tr><td class="vg-lbl">Latitude / Longitude</td><td>--- / ---</td></tr>'
            f'<tr><td class="vg-lbl">NMEA Data Forwarding</td><td><input type="checkbox" name="nmeaFwd" value="1"{_chk(cfg.get("nmeaFwd") == "1")}> Enable &nbsp; Server: '
            f'<input type="text" name="srvIp" value="{_esc(cfg.get("srvIp"))}" size="16">:<input type="text" name="srvPort" value="{_esc(cfg.get("srvPort"))}" size="6"></td></tr>'
            '</table>'
        )
        return _render_vigor_page("LTE", "GPS", p, "17", {}, body, saved=saved)
    return None


def _render_misc_cgi_extra(pl, fid, params, config_store, saved):
    if pl == "/cgi-bin/func.cgi" and fid == "11":
        body = (
            '<table class="vg-sec" border="1" bordercolor="#ccc">'
            '<tr class="vg-hdr"><td>Interface</td><td>Mode</td><td>Status</td><td>IP Address</td><td>Gateway</td></tr>'
            '<tr><td>WAN1</td><td>DHCP / PPPoE</td><td>Up (1000M Full)</td><td>103.160.88.12</td><td>103.160.88.1</td></tr>'
            '<tr><td>WAN2</td><td>Failover Standby</td><td>Standby</td><td>0.0.0.0</td><td>0.0.0.0</td></tr>'
            '</table>'
        )
        return _render_vigor_page("WAN", "WAN Failover / Load-Balance Monitor", pl, "11", {}, body, read_only=True)

    if pl == "/cgi-bin/ospf.cgi":
        cfg = _load_cfg(config_store, pl, "0", {"enOspf": "0", "routerId": "192.168.1.1", "areaId": "0.0.0.0"})
        body = (
            '<table class="vg-sec" border="1" bordercolor="#ccc">'
            f'<tr><td class="vg-lbl">Enable OSPF Routing</td><td><input type="checkbox" name="enOspf" value="1"{_chk(cfg.get("enOspf") == "1")}> Enable</td></tr>'
            f'<tr><td class="vg-lbl">Router ID</td><td><input type="text" name="routerId" value="{_esc(cfg.get("routerId"))}"></td></tr>'
            f'<tr><td class="vg-lbl">Area ID</td><td><input type="text" name="areaId" value="{_esc(cfg.get("areaId"))}"></td></tr>'
            '</table>'
        )
        return _render_vigor_page("Routing", "OSPF Setup", pl, "0", {}, body, saved=saved)

    if pl == "/cgi-bin/wizanti.cgi":
        cfg = _load_cfg(config_store, pl, "0", {"enSvc": "1"})
        body = (
            '<table class="vg-sec" border="1" bordercolor="#ccc">'
            f'<tr><td class="vg-lbl">Activate Web Content &amp; Anti-Intrusion Filter</td><td><input type="checkbox" name="enSvc" value="1"{_chk(cfg.get("enSvc") == "1")}> Enable</td></tr>'
            '<tr><td class="vg-lbl">Profile Status</td><td>Standard CSM Service Profile Ready</td></tr>'
            '</table>'
        )
        return _render_vigor_page("Wizards", "Service Activation Wizard", pl, "0", {}, body, saved=saved)

    if pl == "/cgi-bin/fwuser.cgi" and fid == "9":
        cfg = _load_cfg(config_store, pl, "9", {"en": "0", "svcName": "DrayTek-PPPoE", "acName": "Vigor2927", "startIp": "192.168.10.10", "cnt": "50", "auth": "CHAP"})
        body = (
            '<table class="vg-sec" border="1" bordercolor="#ccc">'
            f'<tr><td class="vg-lbl">Enable PPPoE Server</td><td><input type="checkbox" name="en" value="1"{_chk(cfg.get("en") == "1")}> Enable</td></tr>'
            f'<tr><td class="vg-lbl">Service Name / AC Name</td><td><input type="text" name="svcName" value="{_esc(cfg.get("svcName"))}" size="18"> / <input type="text" name="acName" value="{_esc(cfg.get("acName"))}" size="18"></td></tr>'
            f'<tr><td class="vg-lbl">Client IP Pool Start / Count</td><td><input type="text" name="startIp" value="{_esc(cfg.get("startIp"))}" size="16"> / <input type="text" name="cnt" value="{_esc(cfg.get("cnt"))}" size="6"></td></tr>'
            f'<tr><td class="vg-lbl">Authentication Method</td><td>{_select_html("auth", cfg.get("auth"), [("PAP_CHAP", "PAP / CHAP"), ("CHAP", "CHAP"), ("MSCHAPV2", "MS-CHAPv2")])}</td></tr>'
            '</table>'
        )
        return _render_vigor_page("LAN", "PPPoE Server", pl, "9", {"iAct": "0"}, body, saved=saved)

    if pl == "/cgi-bin/fwuser.cgi" and fid == "10":
        body = (
            '<table class="vg-sec" border="1" bordercolor="#ccc">'
            '<tr class="vg-hdr"><td>Index</td><td>Username</td><td>Assigned IP</td><td>Peer MAC</td><td>Online Time</td><td>TX / RX (KB)</td></tr>'
            '<tr><td align="center" colspan="6" style="color:#666">No active PPPoE server client sessions.</td></tr>'
            '</table>'
        )
        return _render_vigor_page("User Management", "PPPoE User Online Status", pl, "10", {"iUserStauts": "1", "iPageIdx": "1"}, body, read_only=True)

    if pl == "/cgi-bin/fwuser.cgi" and fid == "6":
        return _render_vigor_page(
            "User Management", "User Login Status", pl, "6", {},
            '<table class="vg-sec" border="1" bordercolor="#ccc"><tr><td class="vg-lbl">Session Status</td><td class="vg-badge-ok">Authenticated</td></tr></table>',
            read_only=True,
        )

    if pl == "/cgi-bin/cgiswm.cgi" and fid == "38":
        cfg = _load_cfg(config_store, pl, "38", {"mac1": "00:1D:AA:10:20:30", "sw1": "VigorSwitch-01", "port1": "Port 8", "vlan1": "10"})
        body = (
            '<table class="vg-sec" border="1" bordercolor="#ccc">'
            '<tr class="vg-hdr"><td>Index</td><td>Device MAC</td><td>Managed Switch</td><td>Port</td><td>VLAN ID</td></tr>'
            f'<tr><td align="center">1</td><td><input type="text" name="mac1" value="{_esc(cfg.get("mac1"))}" size="20"></td>'
            f'<td><input type="text" name="sw1" value="{_esc(cfg.get("sw1"))}" size="18"></td>'
            f'<td><input type="text" name="port1" value="{_esc(cfg.get("port1"))}" size="10"></td>'
            f'<td><input type="text" name="vlan1" value="{_esc(cfg.get("vlan1"))}" size="6"></td></tr>'
            '</table>'
        )
        return _render_vigor_page("Applications", "MAC Mapping", pl, "38", {}, body, saved=saved)

    if pl == "/cgi-bin/wvlantbl.cgi":
        body = (
            '<table class="vg-sec" border="1" bordercolor="#ccc">'
            '<tr class="vg-hdr"><td>Index</td><td>MAC Address</td><td>IP Address</td><td>VLAN Group</td><td>Band</td><td>RSSI</td><td>Online Time</td></tr>'
            '<tr><td align="center">1</td><td>74-56-3C-88-1A-22</td><td>192.168.10.25</td><td>W_VLAN0</td><td>5 GHz</td><td>-48 dBm</td><td>00:14:22</td></tr>'
            '<tr><td align="center">2</td><td>AC-BC-32-77-91-04</td><td>192.168.20.14</td><td>W_VLAN1</td><td>2.4 GHz</td><td>-56 dBm</td><td>00:08:45</td></tr>'
            '</table>'
        )
        return _render_vigor_page("Diagnostics", "Wireless VLAN Online Station Table", pl, "0", {}, body, read_only=True)

    if pl in ("/cgi-bin/csmim.cgi", "/cgi-bin/csmp2p.cgi", "/cgi-bin/csmmisc.cgi"):
        meta = {
            "/cgi-bin/csmim.cgi": ("IM Object", ["Facebook Messenger", "Skype", "Telegram", "LINE", "WhatsApp", "Viber"]),
            "/cgi-bin/csmp2p.cgi": ("P2P Object", ["BitTorrent", "eDonkey / eMule", "Gnutella", "FastTrack / Kazaa"]),
            "/cgi-bin/csmmisc.cgi": ("Misc Object", ["YouTube Streaming", "HTTP File Transfer", "SSH / Remote Tunnel", "SIP VoIP"]),
        }
        title, items = meta[pl]
        defaults = {"profName": f"{title.split()[0]}_Default", **{f"chk{i}": "1" for i in range(len(items))}}
        cfg = _load_cfg(config_store, pl, fid, defaults)
        rows = "".join(
            f'<tr><td class="vg-lbl">{_esc(lbl)}</td><td><input type="checkbox" name="chk{i}" value="1"{_chk(cfg.get(f"chk{i}") == "1")}> Block / Match Protocol</td></tr>'
            for i, lbl in enumerate(items)
        )
        body = (
            '<table class="vg-sec" border="1" bordercolor="#ccc">'
            f'<tr><td class="vg-lbl">Profile Name</td><td><input type="text" name="profName" value="{_esc(cfg.get("profName"))}" size="24"></td></tr>'
            f'{rows}</table>'
        )
        return _render_vigor_page("Objects Setting", title, pl, fid, {"sProfileAct": "showpage"}, body, saved=saved)

    if pl in ("/cgi-bin/service.cgi", "/cgi-bin/sslapp.cgi"):
        is_web = pl == "/cgi-bin/service.cgi"
        title = "SSL Web Proxy" if is_web else "SSL Application"
        cfg = _load_cfg(config_store, pl, fid, {
            "en1": "1",
            "name1": "Intranet-Portal" if is_web else "Office-RDP",
            "target1": "https://192.168.1.50" if is_web else "192.168.1.20:3389",
        })
        body = (
            '<table class="vg-sec" border="1" bordercolor="#ccc">'
            '<tr class="vg-hdr"><td>Index</td><td>Enable</td><td>Profile Name</td><td>Internal Resource / Port</td></tr>'
            f'<tr><td align="center">1</td><td align="center"><input type="checkbox" name="en1" value="1"{_chk(cfg.get("en1") == "1")}></td>'
            f'<td><input type="text" name="name1" value="{_esc(cfg.get("name1"))}" size="20"></td>'
            f'<td><input type="text" name="target1" value="{_esc(cfg.get("target1"))}" size="28"></td></tr>'
            '</table>'
        )
        return _render_vigor_page("SSL VPN", title, pl, fid, {"act": "showtable"}, body, saved=saved)

    if pl == "/cgi-bin/cgipoe.cgi":
        if fid == "5":
            body = (
                '<table class="vg-sec" border="1" bordercolor="#ccc">'
                '<tr class="vg-hdr"><td>Port</td><td>PoE Status</td><td>Class</td><td>Power (W)</td><td>Voltage (V)</td></tr>'
                '<tr><td align="center">P1</td><td>Inactive (Non-PoE Router Port)</td><td>-</td><td>0.0 W</td><td>0.0 V</td></tr>'
                '<tr><td align="center">P2</td><td>Inactive (Non-PoE Router Port)</td><td>-</td><td>0.0 W</td><td>0.0 V</td></tr>'
                '</table>'
            )
            return _render_vigor_page("PoE", "Status", pl, "5", {}, body, read_only=True)
        if fid == "6":
            cfg = _load_cfg(config_store, pl, "6", {"enCheck": "0", "pingIp": "192.168.1.254", "interval": "60"})
            body = (
                '<table class="vg-sec" border="1" bordercolor="#ccc">'
                f'<tr><td class="vg-lbl">Enable PoE Device Ping Check</td><td><input type="checkbox" name="enCheck" value="1"{_chk(cfg.get("enCheck") == "1")}> Enable</td></tr>'
                f'<tr><td class="vg-lbl">Target PD IP</td><td><input type="text" name="pingIp" value="{_esc(cfg.get("pingIp"))}" size="18"></td></tr>'
                f'<tr><td class="vg-lbl">Check Interval (sec)</td><td><input type="text" name="interval" value="{_esc(cfg.get("interval"))}" size="6"></td></tr>'
                '</table>'
            )
            return _render_vigor_page("PoE", "Device Check", pl, "6", {}, body, saved=saved)
        cfg = _load_cfg(config_store, pl, "0", {"budget": "60", "mode": "802.3at"})
        body = (
            '<table class="vg-sec" border="1" bordercolor="#ccc">'
            f'<tr><td class="vg-lbl">Total PoE Power Budget (W)</td><td><input type="text" name="budget" value="{_esc(cfg.get("budget"))}" size="6"> W</td></tr>'
            f'<tr><td class="vg-lbl">Standard Mode</td><td>{_select_html("mode", cfg.get("mode"), [("802.3af", "IEEE 802.3af"), ("802.3at", "IEEE 802.3at (PoE+)")])}</td></tr>'
            '</table>'
        )
        return _render_vigor_page("PoE", "General Setup", pl, "0", {}, body, saved=saved)

    if pl in ("/cgi-bin/ipfcls.cgi", "/cgi-bin/ipfeds.cgi"):
        is_eds = pl == "/cgi-bin/ipfeds.cgi"
        title = "Data Filter Setup" if is_eds else "Filter Set Details"
        cfg = _load_cfg(config_store, pl, fid, {"en": "1", "action": "Pass Immediately", "log": "0"})
        body = (
            '<table class="vg-sec" border="1" bordercolor="#ccc">'
            f'<tr><td class="vg-lbl">Check to enable rule</td><td><input type="checkbox" name="en" value="1"{_chk(cfg.get("en") == "1")}> Enable</td></tr>'
            f'<tr><td class="vg-lbl">Filter Action</td><td>{_select_html("action", cfg.get("action"), [("Pass Immediately", "Pass Immediately"), ("Block Immediately", "Block Immediately"), ("Pass If No Further Match", "Pass If No Further Match")])}</td></tr>'
            f'<tr><td class="vg-lbl">Syslog</td><td><input type="checkbox" name="log" value="1"{_chk(cfg.get("log") == "1")}> Enable Logging</td></tr>'
            '</table>'
        )
        return _render_vigor_page("Firewall", title, pl, fid, {}, body, saved=saved)

    if pl == "/cgi-bin/cntrobj.cgi" and params.get("sCnObjAct") == "showitem":
        cfg = _load_cfg(config_store, pl, "item", {"name": "VN-Local", "country": "VN (Viet Nam)"})
        body = (
            '<table class="vg-sec" border="1" bordercolor="#ccc">'
            f'<tr><td class="vg-lbl">Object Name</td><td><input type="text" name="name" value="{_esc(cfg.get("name"))}" size="24"></td></tr>'
            f'<tr><td class="vg-lbl">Selected Country</td><td><input type="text" name="country" value="{_esc(cfg.get("country"))}" size="24"></td></tr>'
            '</table>'
        )
        return _render_vigor_page("Objects Setting", "Country Object Profile", pl, fid, {"sCnObjAct": "showitem"}, body, saved=saved)

    return None


# Registry of supported save endpoints so save_extra_cgi & render_extra_cgi stay aligned
_EXTRA_V2X00_FIDS = {
    "104", "227", "1224", "2011", "2030", "2031", "2032", "2034", "2047",
    "2049", "2072", "2101", "2199", "2211", "2226", "2314", "2356", "2565",
    "3002", "3004", "4047",
}
_EXTRA_LTE_FIDS = {"0", "2", "4", "17"}
_EXTRA_CGIS = {
    "/cgi-bin/dualwl.cgi",
    "/cgi-bin/ospf.cgi",
    "/cgi-bin/wizanti.cgi",
    "/cgi-bin/csmim.cgi",
    "/cgi-bin/csmp2p.cgi",
    "/cgi-bin/csmmisc.cgi",
    "/cgi-bin/service.cgi",
    "/cgi-bin/sslapp.cgi",
    "/cgi-bin/cgipoe.cgi",
    "/cgi-bin/ipfcls.cgi",
    "/cgi-bin/ipfeds.cgi",
}


def save_extra_cgi(path, params, config_store):
    pl = path.lower()
    fid = str(params.get("fid", "0"))
    key = _store_key(pl, fid)
    defaults = _dualwl_defaults(fid) if pl == "/cgi-bin/dualwl.cgi" or (pl == "/cgi-bin/v2x00.cgi" and fid in ("2047", "2101")) else None
    if defaults is not None:
        merged = dict(defaults)
        for k in defaults:
            if k in params:
                merged[k] = params[k]
            elif k.startswith("en") or k in ("hide1", "iso1", "isoLan", "muMimo", "apsd", "txop", "autoAdj"):
                merged[k] = "0"
        config_store.dat(key, "fields", merged)
        return True
    if (
        (pl == "/cgi-bin/v2x00.cgi" and fid in _EXTRA_V2X00_FIDS and (fid != "104" or params.get("iAct") == "1"))
        or (pl == "/cgi-bin/cgilte.cgi" and fid in _EXTRA_LTE_FIDS)
        or (pl == "/cgi-bin/fwuser.cgi" and fid == "9")
        or (pl == "/cgi-bin/cgiswm.cgi" and fid == "38")
        or (pl == "/cgi-bin/cntrobj.cgi" and params.get("sCnObjAct") == "showitem")
        or (pl == "/cgi-bin/ipfeds.cgi" and ("action" in params or params.get("webchange") == "1"))
        or (pl in _EXTRA_CGIS and pl != "/cgi-bin/ipfeds.cgi")
    ):
        saved_map = {k: v for k, v in params.items() if k not in ("sFormAuthStr",)}
        # Normalize boolean checkboxes that were unchecked on submit
        for cb in ("en", "enPppoe", "enIp", "nat", "fixedIp", "igmpProxy", "complexity", "incCert", "lldpMed", "enCmd", "allowReboot", "allowStatus", "enGps", "nmeaFwd", "enCheck", "en1", "log", "enOspf", "enSvc", "enAi"):
            if cb not in saved_map:
                saved_map[cb] = "0"
        if pl in ("/cgi-bin/csmim.cgi", "/cgi-bin/csmp2p.cgi", "/cgi-bin/csmmisc.cgi"):
            for i in range(6):
                if f"chk{i}" not in saved_map:
                    saved_map[f"chk{i}"] = "0"
        store_fid = "item" if (pl == "/cgi-bin/cntrobj.cgi" and params.get("sCnObjAct") == "showitem") else fid
        config_store.dat(_store_key(pl, store_fid), "fields", saved_map)
        return True
    return False


def render_extra_cgi(path, params, config_store, saved=False):
    pl = path.lower()
    fid = str(params.get("fid", "0"))
    key = _store_key(pl, fid)

    if pl == "/cgi-bin/dualwl.cgi":
        titles = {
            "0": ("Wireless LAN (5 GHz)", "General Setup"),
            "2": ("Wireless LAN (5 GHz)", "Security Settings"),
            "4": ("Wireless LAN (5 GHz)", "Access Control"),
            "6": ("Wireless LAN (5 GHz)", "WPS"),
            "7": ("Wireless LAN (5 GHz)", "WDS Settings"),
            "10": ("Wireless LAN (5 GHz)", "Advanced Setting"),
            "12": ("Wireless LAN (5 GHz)", "AP Discovery"),
            "13": ("Wireless LAN (5 GHz)", "Station List"),
            "14": ("Wireless LAN (5 GHz)", "Station Control"),
            "16": ("Wireless LAN (5 GHz)", "Bandwidth Management"),
        }
        cat, title = titles.get(fid, ("Wireless LAN (5 GHz)", "General Setup"))
        cfg = dict(_dualwl_defaults(fid))
        stored = config_store.lay(key, "fields")
        if isinstance(stored, dict):
            cfg.update(stored)
        return _render_vigor_page(
            cat, title, "/cgi-bin/dualwl.cgi", fid, {}, _build_dualwl_body(fid, cfg, band="5 GHz"),
            notes=["Settings apply to the 5 GHz Dual-Band radio on Vigor2927ac/ax."],
            saved=saved,
            read_only=(fid in ("12", "13")),
        )

    if pl == "/cgi-bin/v2x00.cgi" and fid in _EXTRA_V2X00_FIDS:
        # Handle iAct=1 only when explicitly requested on fid=104 (otherwise defer if bare)
        if fid == "104" and params.get("iAct") != "1":
            return None
        if fid == "2049" or (fid != "104"):
            return _render_v2x00_extra(fid, params, config_store, saved)

    if pl == "/cgi-bin/cgilte.cgi" and "fid" in params and fid in _EXTRA_LTE_FIDS:
        return _render_lte_extra(fid, params, config_store, saved)

    res = _render_misc_cgi_extra(pl, fid, params, config_store, saved)
    if res is not None:
        return res

    return None


# ---------------------------------------------------------------------------
# Sub-Dialogs & Missing Internal .htm / .sht Handlers
# ---------------------------------------------------------------------------

_SUB_DOC_SPECS = {
    "xcaimport.htm": ("Certificate Management", "Import Trusted CA Certificate", "Select a PEM/DER CA certificate file to import into Vigor2927 Trusted CA store."),
    "xlocaimport.htm": ("Certificate Management", "Import Local Certificate", "Select a Local Certificate (.pem/.p12) and private key bundle to import."),
    "xcacfok.htm": ("Certificate Management", "Certificate Status", "Trusted CA Certificate operation completed successfully."),
    "xlocfok.htm": ("Certificate Management", "Certificate Status", "Local Certificate imported successfully."),
    "xlocfnok.htm": ("Certificate Management", "Certificate Notice", "Please verify the certificate format (X.509 PEM/PKCS#12) before importing."),
    "xgcerhlr.htm": ("Certificate Management", "Certificate Handler", "Certificate archive handler ready."),
    "cfghlr.htm": ("System Maintenance", "Configuration Backup Handler", "Configuration backup / restoration handler ready."),
    "frmupcheckfw.htm": ("System Maintenance", "Firmware Upgrade Check", "Current Firmware: Vigor2927 4.4.5.1_BT (Build Oct 23 2024). Image ready for verification."),
    "succ_fup.htm": ("System Maintenance", "Firmware Upgrade", "Firmware image uploaded and verified successfully."),
    "fail_fup.htm": ("System Maintenance", "Firmware Upgrade", "No valid .all/.rst firmware image was selected."),
    "openvpnok.htm": ("VPN and Remote Access", "OpenVPN Configuration", "OpenVPN server & client configuration updated."),
    "openvpnhlr.htm": ("VPN and Remote Access", "OpenVPN Certificate Handler", "OpenVPN X.509 handler ready."),
    "openvpnfail.htm": ("VPN and Remote Access", "OpenVPN Notice", "OpenVPN certificate operation cancelled or no file chosen."),
    "wg_gencfg.htm": ("VPN and Remote Access", "WireGuard Client Config", "WireGuard peer QR code & tunnel configuration block ready for export."),
    "pskey.htm": ("VPN and Remote Access", "Pre-Shared Key Setup", "IPsec / VPN Pre-Shared Key generator ready."),
    "wds.htm": ("Wireless LAN", "WDS Note", "WDS Bridge/Repeater connects peer APs using the same channel and security key."),
    "ftpuserfolder.htm": ("USB Application", "USB Folder Access", "Select USB directory permissions (Read Only / Read & Write) for FTP/SMB users."),
    "aswiz1.htm": ("Wizards", "Auto Setup Wizard - Step 1", "Select WAN connection mode (PPPoE / DHCP / Static IP) to begin guided setup."),
    "aswiz2.htm": ("Wizards", "Auto Setup Wizard - Step 2", "Confirm DNS and Wi-Fi SSID/password settings to complete wizard."),
    "isdn.sht": ("ISDN", "ISDN General Setup", "ISDN S0 interface is not installed on Ethernet WAN Vigor2927 models."),
    "ipfedradv.htm": ("Firewall", "Advanced Filter Rule Settings", "Configure MAC / Country / Schedule / Direction bindings for this filter rule."),
    "advdirtion.htm": ("NAT", "Advanced Direction Settings", "Configure inbound/outbound NAT translation direction."),
    "qosipedt.htm": ("Bandwidth Management", "QoS Class IP Edit", "Specify local/remote IP ranges and service ports mapped to this QoS class."),
    "apdeviceauth.htm": ("Central Management", "AP Device Authorization", "Authorize pending VigorAP devices discovered on the LAN."),
    "apdevicestat.htm": ("Central Management", "AP Device Status", "Detailed radio, client count, CPU load, and channel utilization for managed APs."),
    "aploadblcch.htm": ("Central Management", "AP Channel Load Balance", "Balance client associations across 2.4 GHz and 5 GHz radios."),
    "appeclone.htm": ("CSM", "Clone APP Enforcement Profile", "Select source and destination APP Enforcement profile slots to copy."),
    "enetedit.htm": ("LAN", "LAN Subnet Port Mapping Edit", "Assign P1-P4 / LAN VLAN ports to the selected LAN subnet."),
    "lansubedt.htm": ("LAN", "LAN Subnet Advanced Edit", "Configure secondary subnet IP, DHCP pool, and routing mode."),
    "ipfipedt.htm": ("Firewall", "Filter IP Address Edit", "Select IP Object, IP Group, or custom IPv4 subnet mask for filter match."),
    "ipfstedt.htm": ("Firewall", "Filter Service Type Edit", "Select Service Type Object or TCP/UDP port range for filter match."),
    "swmdevacc.htm": ("Central Management", "Switch Device Account", "Configure VigorSwitch HTTP/HTTPS management credentials."),
    "extdevacc.htm": ("Central Management", "External Device Settings", "Manage non-DrayTek SNMP / ping-monitored external network devices."),
    "preferredlteband.htm": ("LTE", "Preferred LTE Frequency Band", "Select preferred 4G/LTE carrier bands (B1/B3/B7/B8/B20/B28/B38/B40/B41)."),
    "schedule.sht": ("Applications", "Schedule Object Selection", "Bind up to 4 time schedules to control when this rule is active."),
    "strobjslt.htm": ("Objects Setting", "String Object Selector", "Select configured String Objects to apply to URL/DNS/Keyword filters."),
    "mesh_wiz2.htm": ("Mesh", "Mesh Setup Wizard - Step 2", "Scan and add Mesh Nodes within wireless range to form a VigorMesh group."),
    "wiz245wirlss2.htm": ("Wizards", "Wireless Wizard - Step 2", "Confirm 2.4 GHz & 5 GHz SSID names and WPA2/WPA3 passphrases."),
    "wizvoip2.htm": ("Wizards", "VoIP Wizard - Step 2", "Review SIP registrar domain, outbound proxy, and FXS port bindings."),
    "wlapply.htm": ("Wireless LAN", "Applying Wireless Settings", "Wireless configuration settings have been applied to the radio interface."),
    "wlclone.htm": ("Wireless LAN", "Clone Wireless Settings", "Copy SSID/Security settings between 2.4 GHz and 5 GHz profiles."),
    "wlroamingnote.htm": ("Wireless LAN", "Assisted Roaming Note", "AP-Assisted Client Roaming disconnects weak RSSI stations to encourage fast roaming."),
    "wlguestwifivoda.htm": ("Wireless LAN", "Guest Wi-Fi Isolation", "Guest Wi-Fi traffic is isolated from internal LAN subnets."),
    "hslogp1_link.htm": ("Hotspot Web Portal", "Hotspot External Portal Link", "Configure external Captive Portal landing page URL and shared secret."),
    "constructerr.htm": ("Wizards", "Service Activation Wizard", "CSM Service Activation profile ready. Standard Web Content & Anti-Intrusion licenses can be managed via MyVigor."),
}


def render_sub_doc(rel_path, config_store=None):
    name = rel_path.replace("\\", "/").split("/")[-1].lower()
    if name in _SUB_DOC_SPECS:
        cat, title, desc = _SUB_DOC_SPECS[name]
        body = (
            '<table class="vg-sec" border="1" bordercolor="#ccc">'
            f'<tr><td class="vg-lbl">Information</td><td>{_esc(desc)}</td></tr>'
            '<tr><td class="vg-lbl">Device</td><td>DrayTek Vigor2927 Series</td></tr>'
            '</table>'
        )
        return _render_vigor_page(
            cat, title, "/index.htm", "0", {}, body,
            read_only=True,
            extra_buttons=' &nbsp; <input class="btnw" type="button" value="Back" onclick="history.back()">',
        )
    return None
