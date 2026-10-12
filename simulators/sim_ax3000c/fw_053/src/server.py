#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
MAY CHU GIA LAP — AX3000CV2 (OUI Vue SPA, OS 0.5.3)
====================================================

Chay:  python server.py [cong]     (mac dinh 8091)
Mo:    http://localhost:8091/

HAI VIEC MAY CHU NAY LAM
  1. Phuc vu nguyen xi 106 tep tinh da thu tu thiet bi that
     (reference/www/, ten tep da doi / thanh __ — xem _duong_dan_that()).
     KHONG sua mot byte nao cua bundle goc.
  2. Tra loi POST /ubus theo dung hop dong JSON-RPC 2.0 cua thiet bi that.

HOP DONG /ubus — DO THAT ngay 2026-09-22, xem reference/api/hop_dong_loi_ubus.json:
    yeu cau : {"jsonrpc":"2.0","id":N,"method":"call",
               "params":["<sid>","<doi_tuong>","<ham>",{<tham so>}]}
    thanh cong: {"jsonrpc":"2.0","id":N,"result":[0,<du lieu>]}
    that bai  : {"jsonrpc":"2.0","id":N,"error":{"code":<ma>,"message":"..."}}
                -32000 "Object not found"  — khong co doi tuong/ham
                -32002 "Access denied"     — co doi tuong nhung phien khong du quyen
    dang nhap dung sid toan 0: "00000000000000000000000000000000"
    sai mat khau la truong hop DUY NHAT tra "result":[6] chu khong phai "error"

CHU Y — sai cu (da sua 2026-09-22): ban dau em tra "result":[4] cho loi goi
la. Thiet bi that KHONG BAO GIO tra [4]; no tra khoi "error" cua JSON-RPC.
Do la bia hop dong, va bo kiem G1 cu con di xac nhan cai bia do la dung.

Quy tac khi phien KHONG hop le (do that):
    doi tuong bat dau bang "data_repo." -> -32000 (rpcd khong cho thay)
    moi doi tuong khac                  -> -32002 (thay nhung tu choi)

MOI GIA TRI TRA VE deu lay tu KHO CAU HINH, khong hardcode trong ham
(CLAUDE.md muc 2.5).
"""
import fnmatch
import json
import os
import random
import sys
import time
import uuid
from http.server import BaseHTTPRequestHandler, ThreadingHTTPServer

sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
from ax3000c_kho_cau_hinh import KHO  # noqa: E402
# md5-crypt dung chung (shared/python) — module crypt cua Python bi go tu 3.13
sys.path.insert(0, os.path.join(os.path.dirname(os.path.abspath(__file__)),
                                "..", "..", "..", "shared", "python"))
from ax3000c_md5crypt import md5crypt  # noqa: E402
from ax3000c_posix_tz import lech_giay  # noqa: E402

_HERE = os.path.dirname(os.path.abspath(__file__))
GOC_WWW = os.path.abspath(os.path.join(_HERE, "..", "reference", "www"))
GOC_API = os.path.abspath(os.path.join(_HERE, "..", "reference", "api"))

CONG = int(sys.argv[1]) if len(sys.argv) > 1 else 8091

SID_TRONG = "0" * 32
# Tai khoan THAT cua thiet bi sau khi anh Huynn reset (xem CLAUDE.md muc 1)
TAI_KHOAN = {"admin": "6455147589"}

_phien = {}          # sid -> {"user":..., "luc":...}
THOI_HAN_PHIEN = 300  # giay — DO THAT: "timeout":300 trong goi login + phep do het phien
_LUC_KHOI_DONG = time.time()

# ---- KHOI DONG LAI: DO THAT 2026-09-25 (reference/api/hop_dong_reboot_nhom8.json) ----
# system reboot -> [0] (199 ms) roi thiet bi SAP: moi ket noi loi (trinh duyet bao
# loi mang) toi ~93 s; 93 -> ~101,5 s may chu web song nhung /ubus tra -32000 cho
# MOI loi goi (rpcd chua nap du doi tuong); sau do binh thuong, moi phien cu mat
# (-32002). uptime sau khoi dong tinh tu ~22 s sau lenh reboot (do: 153 s luc ~175 s).
# Cau hinh KHONG doi (do: 4 khung doc trung fnv truoc/sau).
REBOOT_SAP_S = 93.0
REBOOT_CHUA_SAN_S = 101.5
REBOOT_GOC_UPTIME_S = 22.0
_REBOOT = {"luc": None}
_REBOOT_THEO_KTV = {}


# Khoa noi bo: md5-crypt (muoi rong) mat khau admin sau khi doi qua Change Password. Khong co -> mat khau goc.
KHOA_MK_ADMIN = "tk.admin_crypt"


def _mat_khau_dung(u, m):
    if not isinstance(m, str):
        return False
    luu = KHO.doc(KHOA_MK_ADMIN)
    if u == "admin" and luu:
        return md5crypt(m, "") == luu
    return TAI_KHOAN.get(u) == m


def _phien_song(sid):
    """Phien con song (va lam moi moc) — dung cho cgi-backup/cgi-upload."""
    ph = _phien.get(sid)
    if ph is None or time.time() - ph["luc"] > THOI_HAN_PHIEN:
        return False
    ph["luc"] = time.time()
    return True


def _goc_uptime(client_key=None):
    """Moc tinh uptime: luc chay server, hoac ~22 s sau lenh reboot gan nhat."""
    if client_key is None:
        try:
            client_key = KHO.current_key()
        except Exception:
            client_key = "anonymous"
    luc = _REBOOT_THEO_KTV.get(client_key)
    if luc is not None:
        return luc + REBOOT_GOC_UPTIME_S
    if _REBOOT["luc"] is not None:
        return _REBOOT["luc"] + REBOOT_GOC_UPTIME_S
    return _LUC_KHOI_DONG


def _pha_reboot(client_key=None):
    """'sap' | 'chua_san' | None theo thoi gian tu lenh reboot gan nhat."""
    if client_key is None:
        try:
            client_key = KHO.current_key()
        except Exception:
            client_key = "anonymous"
    luc = _REBOOT_THEO_KTV.get(client_key)
    if luc is None:
        return None
    d = time.time() - luc
    if d < REBOOT_SAP_S:
        return "sap"
    if d < REBOOT_CHUA_SAN_S:
        return "chua_san"
    return None

# DO THAT 2026-09-25 (Content-Type thiet bi tra cho tung loai tep):
#   html text/html · js text/javascript · css text/css · json application/json
#   svg image/svg+xml · png image/png · ico/ttf/woff application/octet-stream
# Truoc day em tu dien theo "chuan" (application/javascript, font/woff,
# image/x-icon, text/html; charset=utf-8) — KHAC thiet bi, la bia.
KIEU_MIME = {
    ".html": "text/html", ".js": "text/javascript",
    ".css": "text/css", ".json": "application/json", ".svg": "image/svg+xml",
    ".png": "image/png", ".ico": "application/octet-stream",
    ".woff": "application/octet-stream", ".ttf": "application/octet-stream",
}


def _ten_tep(duong_dan):
    """
    Doi duong dan URL thanh ten tep trong reference/www.

    Luc thu, dau '/' bi doi thanh '__' de ghi phang mot thu muc
    (thu_bang_chung.py khong cho ten co '/'). Day la phep doi nguoc.

    CHU Y — do that 2026-09-22, dung bo kiem A1 phat hien:
        '/'            -> SPA that, 7304 byte  (luu la __ROOT__index.html)
        '/index.html'  -> KHONG phai SPA! La trang chuyen huong 160 byte
                          <meta http-equiv=Refresh content="0;url=/">
    Hai duong dan nay tra NOI DUNG KHAC NHAU tren thiet bi that. Ban dau
    em map ca hai ve cung mot tep -> bo kiem bao lech sha256. Giu dung
    nhu thiet bi, khong gop lai cho "gon".
    """
    p = duong_dan.split("?")[0].split("#")[0]
    if p == "/":
        return "__ROOT__index.html"
    return p.lstrip("/").replace("/", "__")


def _nap_acl():
    """ACL that lay tu lan dang nhap that (khung login da luu)."""
    p = os.path.join(GOC_API, "acl_that.json")
    if os.path.exists(p):
        with open(p, encoding="utf-8") as f:
            return json.load(f)
    return {}


ACL = _nap_acl()


def _nap_menu():
    with open(os.path.join(GOC_API, "oui.ui__menu.json"), encoding="utf-8") as f:
        return json.load(f)


MENU = _nap_menu()


# ---------------------------------------------------------------- ubus

def _ket_qua(ma, du_lieu=None):
    return {"result": [ma] if du_lieu is None else [ma, du_lieu]}


def _loi(ma, loi_nhan):
    """Khoi 'error' cua JSON-RPC — dung hinh dang thiet bi that tra."""
    return {"error": {"code": ma, "message": loi_nhan}}


LOI_KHONG_THAY = (-32000, "Object not found")
LOI_TU_CHOI = (-32002, "Access denied")

# Khoa noi bo giu cay cau hinh ma data_repo.cigext doc/ghi. KHONG phai ten
# mot loi goi that — may chu tu choi neu ai goi thang toi no.
KHOA_CAY_CIGEXT = "data_repo.cigext.cay_cau_hinh"
# Khoa noi bo chua cac config UCI do that ({config: values}); khong phai API
KHOA_CAY_UCI = "uci.cay_cau_hinh"
# *_set cua data_repo DO THAT tra [0] tron (khong co {status})
SET_TRA_MA_TRON = {"speedtest_set"}
# Khoa noi bo: {config: epoch} luc gia lap ghi config do lan cuoi — dung lam
# mtime cua etc/config/<config> trong tep Backup (thiet bi that: mtime = luc commit).
KHOA_MTIME_UCI = "uci.cay_mtime"
# ACL uci cua phien admin (reference/api/acl_that.json, muc "uci")
try:
    with open(os.path.join(GOC_API, "acl_that.json"), encoding="utf-8") as _f:
        _ACL_UCI = json.load(_f).get("uci", {})
except Exception:
    _ACL_UCI = {}


# Khoa noi bo: {config: epoch} — Apply KHONG doi noi dung nhung thiet bi van ghi lai tep (mtime
# moi). DO THAT nhom 11 (hop_dong_uci_nhom11.json 'cham_mtime_khi_khong_doi'): dmz_set -> firewall,
# upnpd_set -> upnpd, cigext set -> moi config trong goi gui. (speedtest/easymesh -> crontab: xem
# _crontab_thay; systemlog_set -> vendor_log_file: KHONG mo phong, tep do khong co trong kho.)
KHOA_MTIME_CHAM = "uci.cay_mtime_cham"


def _cham_mtime(doi_tuong, ham, ts):
    cfgs = []
    if doi_tuong == "data_repo.weboui" and ham == "dmz_set":
        cfgs = ["firewall"]
    elif doi_tuong == "data_repo.weboui" and ham == "upnpd_set":
        cfgs = ["upnpd"]
    elif doi_tuong == "data_repo.cigext" and ham == "set":
        cfgs = [c for c in ts if isinstance(ts.get(c), dict)]
    if cfgs:
        ch = KHO.doc(KHOA_MTIME_CHAM) or {}
        for c in cfgs:
            ch[c] = int(time.time())
        KHO.ghi(KHOA_MTIME_CHAM, ch)


def _ghi_cay_uci(cay, luc=None):
    """Ghi cay uci vao kho; config nao doi noi dung thi ghi lai moc thoi gian (mac dinh: bay gio)."""
    cu = KHO.doc(KHOA_CAY_UCI) or {}
    mt = KHO.doc(KHOA_MTIME_UCI) or {}
    bay_gio = int(luc if luc is not None else time.time())
    for cfg in cay:
        if json.dumps(cay[cfg], sort_keys=False) != json.dumps(cu.get(cfg), sort_keys=False):
            mt[cfg] = bay_gio
    KHO.ghi(KHOA_CAY_UCI, cay)
    KHO.ghi(KHOA_MTIME_UCI, mt)


def _co_danh_sach(x):
    """True neu o bat ky tang nao cua x co mot danh sach (list)."""
    if isinstance(x, list):
        return True
    if isinstance(x, dict):
        return any(_co_danh_sach(v) for v in x.values())
    return False


TRA_VE_SET_THANH_CONG = {"status": True}   # do that: [0, {"status": true}]


def _chuan_hoa_ghi_cigext(ghi):
    """
    Bien doi yeu cau cigext.set thanh dang ma cigext.get se doc ve.

    DO THAT 2026-09-24 (reference/api/hop_dong_ghi_lab1_4_5.json), 3 lan Apply:
      - Tang THU 3 (config.section.option) ma gia tri la OBJECT thi thiet bi
        NOI cac gia tri bang dau cach, theo dung thu tu gui:
            dhcp.lan.dhcp_option {lan0:"6,8.8.8.8,8.8.4.4"} -> "6,8.8.8.8,8.8.4.4"
            network.wan6.dns     {dns1:a, dns2:b}          -> "a b"
            network.wan.dns      {}                        -> ""
      - Tang 1-2 la config/section: object rong (wan64:{}, lan6:{}, globals:{})
        KHONG xoa gi — wan64 van giu nguyen cac option cu.
      - dhcp.<section>.leasetime gui "720m" -> doc ve "720".
    """
    for cfg, sections in list(ghi.items()):
        if not isinstance(sections, dict):
            continue
        for sec, opts in list(sections.items()):
            if not isinstance(opts, dict):
                continue
            for opt, gt in list(opts.items()):
                if isinstance(gt, dict):
                    opts[opt] = " ".join(str(v) for v in gt.values())
            if cfg == "dhcp" and isinstance(opts.get("leasetime"), str) \
                    and opts["leasetime"].endswith("m"):
                opts["leasetime"] = opts["leasetime"][:-1]


# Cac trang BANG da DO hop dong ghi tren thiet bi that (2026-09-24).
#   ham_set -> (khoa doc trong kho, ten danh sach, THU TU KHOA khi doc ve)
# Thu tu khoa la cua THIET BI (khac thu tu trang gui) — do duoc, khong tu dat.
BANG_DA_DO = {
    # reference/api/hop_dong_ghi_lab1_4_5.json : them + xoa
    "dhcp_reservation_set": ("data_repo.weboui.dhcp_reservation_get", "host",
                             ["_idx", "mac", "ip"], ("cfg", "host", 0x04)),
    # reference/api/hop_dong_ghi_lab6_portfwd.json : them + SUA + xoa
    "portfwd_set": ("data_repo.weboui.portfwd_get", "redirect",
                    ["_idx", "enabled", "name", "proto", "src_dport",
                     "dest_port", "dest_ip"], ("cfg", "redirect", 0x30)),
    # reference/api/hop_dong_ghi_nhom4_advanced.json : them + xoa (2026-09-25)
    # _idx do thiet bi cap la SO THU TU ("1" khi bang rong) — khac cfg+6hex.
    "parentctrl_set": ("data_repo.weboui.parentctrl_get", "blocking_list",
                       ["_idx", "mac", "name", "enabled", "start", "stop", "weekdays"],
                       "so"),
    # KHONG co _idx ca hai chieu; del gui lai noi dung dong -> xoa theo noi dung
    "websitefilter_set": ("data_repo.weboui.websitefilter_get", "blocking_list",
                          ["website", "ip"], None),
}


def _ep_kieu_nhu_cu(cu, moi):
    """Ep gia tri moi ve KIEU cua gia tri dang luu (do that: '1'->true, 0->'0')."""
    if isinstance(cu, bool):
        if isinstance(moi, str):
            return moi.strip().lower() in ("1", "true")
        return bool(moi)
    if isinstance(cu, str) and not isinstance(moi, str):
        if isinstance(moi, bool):
            return "1" if moi else "0"
        return str(moi)
    return moi


def _ghi_wifi(ts):
    """
    data_repo.weboui.wifi_set — DO THAT 2026-09-24 (6 lan Apply, lab 2 + 3).
    Bang chung: reference/api/hop_dong_ghi_lab2_3_wifi.json

      - chi cap nhat nhung BANG TAN thiet bi CO (2G, 5G); nhanh 6G trang gui
        kem bi BO QUA — thiet bi nay khong co 6G, doc ve khong co 6G
      - moi gia tri ep ve kieu dang luu: vap_diff_mode "1" -> true, sae 0 -> "0"
      - truong khong gui (ssid/key khi tat) thi giu nguyen
    """
    khoa = "data_repo.weboui.wifi_get"
    hien = KHO.doc(khoa) or {}
    for muc, bang_tan in (ts or {}).items():
        if not isinstance(bang_tan, dict) or not isinstance(hien.get(muc), dict):
            continue
        for bt, truong in bang_tan.items():
            if bt not in hien[muc] or not isinstance(truong, dict):
                continue            # vi du 6G: thiet bi khong co -> bo qua
            cu = hien[muc][bt]
            for k, v in truong.items():
                cu[k] = _ep_kieu_nhu_cu(cu.get(k), v) if k in cu else v
    KHO.ghi(khoa, hien)


def _djb(chuoi):
    """djb hash (h = h*33 + c, goc 5381) — khop ten section an danh UCI da do."""
    h = 5381
    for c in chuoi.encode("utf-8"):
        h = (h * 33 + c) & 0xffffffff
    return h


def _ghi_bang(ham, ts):
    """
    Ghi mot trang BANG theo hop dong DO THAT.

    Trang gui DANH SACH THAY DOI, moi dong co _method add / update / del.
    Kieu _idx (DO THAT 2026-09-25, hop_dong_ghi_nhom9_bang.json):
      "cfg": ten section an danh UCI = "cfg" + 2 hex VI TRI section trong goi +
             4 hex (djb(kieu section) % 65536). Kiem bang so do: host -> fe63,
             redirect -> 3837. Ten TINH LAI moi lan doc: xoa dong dau thi dong sau
             DOI ten (cfg05fe63 -> cfg04fe63). Vi tri dong dau: dhcp 0x04, firewall 0x30.
      "so" : parental — so NHO NHAT con trong ("1","2"...; xoa 1 roi them -> dong
             moi lay "1" va dung DAU danh sach); danh sach xep theo so.
      None : website filter — khong co _idx, xoa theo noi dung.
    Ca lo thay doi duoc xu ly theo _idx LUC TRANG DOC (truoc khi danh lai ten).
    Doc ve: dung thu tu khoa cua thiet bi, bo _method, giu kieu gia tri.
    """
    khoa, ten_ds, thu_tu = BANG_DA_DO[ham][:3]
    kieu = BANG_DA_DO[ham][3] if len(BANG_DA_DO[ham]) > 3 else None
    kieu_idx = kieu[0] if isinstance(kieu, tuple) else kieu
    hien = KHO.doc(khoa) or {ten_ds: []}
    ds = list(hien.get(ten_ds) or [])

    def _xep(d):
        return {k: d[k] for k in thu_tu if k in d}

    def _noi_dung(d):
        return {k: v for k, v in d.items() if k not in ("_method", "_idx")}

    for dong in (ts.get(ten_ds) or []):
        pp = dong.get("_method")
        if kieu_idx is None:
            # Bang KHONG co _idx (Website Filtering): them = noi vao cuoi,
            # xoa = bo dong trung noi dung (do that 2026-09-25).
            if pp == "add":
                ds.append(_xep(_noi_dung(dong)))
            elif pp == "del":
                ds = [d for d in ds if _xep(d) != _xep(_noi_dung(dong))]
            continue
        if pp == "add":
            moi = _noi_dung(dong)
            if kieu_idx == "so":
                dung = {int(d["_idx"]) for d in ds if str(d.get("_idx", "")).isdigit()}
                n = 1
                while n in dung:
                    n += 1
                moi["_idx"] = str(n)
            else:
                moi["_idx"] = ""            # dat ten o buoc danh lai ben duoi
            ds.append(_xep(moi))
        elif pp == "update":
            for i, d in enumerate(ds):
                if d.get("_idx") and d.get("_idx") == dong.get("_idx"):
                    gop = dict(d)
                    gop.update({k: v for k, v in dong.items() if k != "_method"})
                    ds[i] = _xep(gop)
        elif pp == "del":
            ds = [d for d in ds if not (d.get("_idx") and d.get("_idx") == dong.get("_idx"))]
    if kieu_idx == "so":
        ds.sort(key=lambda d: int(d["_idx"]) if str(d.get("_idx", "")).isdigit() else 0)
    elif kieu_idx == "cfg":
        _, loai, dau = kieu
        for i, d in enumerate(ds):
            d["_idx"] = "cfg%02x%04x" % (dau + i, _djb(loai) % 65536)
            ds[i] = _xep(d)
    KHO.ghi(khoa, {ten_ds: ds})


# ---- Nhom 5: cong cu mang (Diagnostics) — PHAT LAI so do that ----
def _doc_json_neu_co(duong_dan):
    if not os.path.isfile(duong_dan):
        return {}
    with open(duong_dan, encoding="utf-8") as tep:
        return json.load(tep)


_TEP_N5 = os.path.join(GOC_API, "khung_that_nhom5_maintain.json")
N5 = _doc_json_neu_co(_TEP_N5)
_TEP_N5G = os.path.join(GOC_API, "hop_dong_ghi_nhom5_maintain.json")
_TEP_N9 = os.path.join(GOC_API, "khung_that_nhom9_diag.json")
N9 = _doc_json_neu_co(_TEP_N9)
N5G = _doc_json_neu_co(_TEP_N5G)
_N5_TT = {}   # trang thai chay tam thoi (speedtest dang chay, techsupport dang thu)


def _la_ipv4(s):
    p = s.split(".")
    return len(p) == 4 and all(x.isdigit() and 0 <= int(x) <= 255 for x in p)


import threading as _thr
# DO THAT 2026-09-25: 5 loi do cong cu trang Diagnostics gui cung luc nhung
# thiet bi tra lan luot moi ~5 s (1 muc moi o 7,9 / 12,9 / 17,9 / 22,9 / 27,9 s)
# -> thiet bi xu ly TUAN TU. Gia lap dung mot khoa chung de tai hien.
_KHOA_CONG_CU = _thr.Lock()


def _cong_cu_mang(ham, ten):
    with _KHOA_CONG_CU:
        return _cong_cu_mang_1(ham, ten)


def _cong_cu_mang_1(ham, ten):
    """
    Phat lai ket qua cong cu mang da do tren thiet bi that (2026-09-25):
      - ten "?" (trang do cong cu khi mo) -> dung khung that tung cong cu
      - (cong cu, ten) da do (ping openwrt.org / 192.168.100.1 / .109 / 8.8.8.8)
        -> dung khung that, cho dung thoi gian do
      - thiet bi KHONG co DNS (nslookup: no servers could be reached) -> moi
        ten mien: "<cong cu>: bad address '<ten>'" sau ~5 s; nslookup luon
        ";; connection timed out; no servers could be reached"
      - thiet bi KHONG co tuyen WAN -> ping IPv4 ngoai 192.168.100.0/24:
        "sendto: Network unreachable" ngay lap tuc (do voi 8.8.8.8)
      - con lai (IP LAN khac, traceroute toi IP, ping6 toi IP) CHUA DO -> -32000
    """
    cc = N5.get("cong_cu", {})
    tg = cc.get("thoi_gian_ms", {})
    # NHOM 9 (DO THAT 2026-09-25, khung_that_nhom9_diag.json): mau chinh xac truoc
    mau9 = (N9.get("do") or {}).get(ham, {}).get(ten)
    if mau9:
        time.sleep(mau9[0] / 1000.0)
        kq = mau9[1]
        return kq if isinstance(kq, dict) else _ket_qua(*kq)
    if ten == "?":
        time.sleep(tg.get("ten_mien_khong_phan_giai", 0) / 1000.0)
        return _ket_qua(*cc["do_cong_cu_ten_hoi_cham"][ham])
    if ham in cc and ten in cc[ham]:
        kq = cc[ham][ten]
        ms = (tg.get("ten_mien_khong_phan_giai") if "bad address" in json.dumps(kq)
              else tg.get("ping_ip_ngoai_lan") if "unreachable" in json.dumps(kq)
              else tg.get("ping_lan", 0))
        time.sleep((ms or 0) / 1000.0)
        return _ket_qua(*kq)
    # Quy tac rut tu mau nhom 9 (SUY RONG tu 1 mau moi loai, thay IP):
    lan4 = _la_ipv4(ten) and ten.startswith("192.168.100.")
    lan6 = ten.lower().startswith("fd00:db80::")
    if lan4 or lan6:
        mau_ip = "192.168.100.2" if lan4 else "fd00:db80::99"
        tu_than = ten in ("192.168.100.1", "fd00:db80::1")
        if ham in ("ping", "ping6") and ((ham == "ping") == lan4) and not tu_than:
            ms, kq = N9["do"][ham][mau_ip]
            time.sleep(ms / 1000.0)
            return _ket_qua(kq[0], {k: (v.replace(mau_ip, ten) if isinstance(v, str) else v)
                                    for k, v in kq[1].items()})
        if ham in ("traceroute", "traceroute6") and ((ham == "traceroute") == lan4) and not tu_than:
            ms, kq = N9["do"][ham][mau_ip]
            time.sleep(ms / 1000.0)
            return _ket_qua(kq[0], {k: (v.replace("to " + mau_ip + " (" + mau_ip + ")",
                                                  "to " + ten + " (" + ten + ")") if isinstance(v, str) else v)
                                    for k, v in kq[1].items()})
    if ham == "traceroute" and _la_ipv4(ten) and not ten.startswith("192.168.100."):
        ms, kq = N9["do"]["traceroute"]["8.8.8.8"]
        time.sleep(ms / 1000.0)
        return _ket_qua(0, {"stderr": kq[1]["stderr"].replace("8.8.8.8", ten), "code": 1})
    if ham == "nslookup":
        time.sleep(tg.get("ten_mien_khong_phan_giai", 0) / 1000.0)
        return _ket_qua(*cc["do_cong_cu_ten_hoi_cham"]["nslookup"])
    if not _la_ipv4(ten) and ":" not in ten:
        time.sleep(tg.get("ten_mien_khong_phan_giai", 0) / 1000.0)
        return _ket_qua(0, {"stderr": f"{ham}: bad address '{ten}'\n", "code": 1})
    if ham == "ping" and _la_ipv4(ten) and not ten.startswith("192.168.100."):
        time.sleep(tg.get("ping_ip_ngoai_lan", 0) / 1000.0)
        return _ket_qua(0, {"stdout": f"PING {ten} ({ten}): 56 data bytes\n",
                            "stderr": "ping: sendto: Network unreachable\n", "code": 1})
    return _loi(*LOI_KHONG_THAY)


def _ghi_system(ts):
    """
    data_repo.weboui.system_set — DO THAT 2026-09-25 (hop_dong_ghi_nhom7_system.json).

    Doi hostname tren thiet bi that thi CUNG LUC doi o:
      system_get.system, uci system (section .type=system), system.board,
      network.topology (muc cua chinh thiet bi), tieu de tab + trang Home
      (hai cho sau doc tu system.board — tu dong theo).
    uci: option DOI GIA TRI thi chuyen xuong CUOI section; gui lai gia tri cu
    thi giu nguyen cho (do: gui y nguyen -> fnv uci system khong doi).
    ntp.list -> uci system/ntp.server: anh xa SUY tu viec hai noi cung gia tri;
    CHUA do mot lan doi NTP that (ISSUES).
    """
    sg = KHO.doc("data_repo.weboui.system_get") or {}
    cay = KHO.doc(KHOA_CAY_UCI) or {}
    uci_sys = cay.get("system") or {}
    sec = next((s for s in uci_sys.values()
                if isinstance(s, dict) and s.get(".type") == "system"), None)

    moi = ts.get("system") if isinstance(ts.get("system"), dict) else {}
    cu_host = (sg.get("system") or {}).get("hostname")
    for k in ("hostname", "zonename", "timezone"):
        if k not in moi:
            continue
        v = moi[k]
        sg.setdefault("system", {})[k] = v
        if sec is not None and sec.get(k) != v:
            sec.pop(k, None)
            sec[k] = v
    if isinstance(ts.get("ntp"), dict) and isinstance(ts["ntp"].get("list"), list):
        sg.setdefault("ntp", {})["list"] = list(ts["ntp"]["list"])
        ntp = uci_sys.get("ntp")
        if isinstance(ntp, dict) and ntp.get("server") != ts["ntp"]["list"]:
            ntp.pop("server", None)
            ntp["server"] = list(ts["ntp"]["list"])
    KHO.ghi("data_repo.weboui.system_get", sg)
    _ghi_cay_uci(cay)

    host = (sg.get("system") or {}).get("hostname")
    if host and host != cu_host:
        bd = KHO.doc("system.board")
        if isinstance(bd, dict):
            bd["hostname"] = host
            KHO.ghi("system.board", bd)
        tp = KHO.doc("network.topology")
        if isinstance(tp, dict):
            for m in tp.values():
                if isinstance(m, dict) and m.get("hostname") == cu_host:
                    m["hostname"] = host
            KHO.ghi("network.topology", tp)


def _lech_mui_gio():
    """
    Giay lech so voi UTC, tinh tu uci system timezone theo quy tac POSIX TZ
    (shared/python/posix_tz.py — nhu musl tren thiet bi). Do that: 'ICT-7' -> +7 h.
    2026-09-25: ban cu chi nhan dang 'TEN[+-]gio'. Nhung trang System khi Apply
    gui timezone LAY TU BANG cua trang: 'Asia/Ho Chi Minh' -> '<+07>-7' (khong
    phai 'ICT-7' goc may) -> ban cu roi ve UTC, Local Time lech 7 gio. Nay doi
    chieu du 425 muc bang mui gio cua OUI voi libc: 0 lech.
    """
    cay = (KHO.doc(KHOA_CAY_UCI) or {}).get("system", {})
    for sec in cay.values():
        if isinstance(sec, dict) and sec.get(".type") == "system":
            v = lech_giay(sec.get("timezone", ""))
            if v is not None:
                return v
    return 0


# ---- LAN Status: PHAT LAI bo dem byte THAT (anh Huynn chon 2026-09-25) ----
# Trang status/lanstatus doc data_repo.weboui.lanstatus moi 2 giay va tu tinh
# toc do = (bo_dem_moi - bo_dem_cu)/2. Ban gia lap khong co cong vat ly nen
# khong co bo dem that. Cach da duoc duyet: ghi ~60 lan doc THAT cach 2 giay
# (reference/api/mau_that_lanstatus.json) roi phat lai VONG TRON cac GIA SO
# rx/tx do duoc, cong don len gia tri trong kho. Nhu vay:
#   - moi con so toc do hien tren trang deu la mot gia so THAT cua thiet bi;
#   - bo dem van tang dan (khong nhay lui) nhu bo dem that;
#   - cac truong khac (status, phyrate, crc, loopstatus) VAN LAY TU KHO.
# Gioi han da ghi ro: chuoi toc do lap lai sau mot vong mau (~2 phut).
TEP_MAU_LAN = os.path.join(GOC_API, "mau_that_lanstatus.json")
CHU_KY_MAU = 2.0   # giay — bang chu ky timer cua trang (time: 2e3)


def _nap_gia_so_lan():
    """{ifname: [(drx, dtx), ...]} tinh tu cac lan doc lien tiep cua mau that."""
    if not os.path.isfile(TEP_MAU_LAN):
        return {}
    with open(TEP_MAU_LAN, encoding="utf-8") as f:
        mau = json.load(f)["mau"]
    ds = [m["r"][1]["list"] for m in mau if isinstance(m.get("r"), list) and m["r"][0] == 0]
    gs = {}
    for truoc, sau in zip(ds, ds[1:]):
        cu = {c["ifname"]: c for c in truoc}
        for c in sau:
            p = cu.get(c["ifname"])
            if p is None:
                continue
            gs.setdefault(c["ifname"], []).append(
                (max(0, c["rx"] - p["rx"]), max(0, c["tx"] - p["tx"])))
    return gs


GIA_SO_LAN = _nap_gia_so_lan()


def _lanstatus_phat_lai():
    goc = json.loads(json.dumps(KHO.doc("data_repo.weboui.lanstatus") or {"list": []}))
    k = int((time.time() - _LUC_KHOI_DONG) / CHU_KY_MAU)
    for c in goc.get("list", []):
        gs = GIA_SO_LAN.get(c.get("ifname"))
        if not gs:
            continue
        vong, du = divmod(k, len(gs))
        tong_rx = sum(a for a, _ in gs)
        tong_tx = sum(b for _, b in gs)
        c["rx"] = c.get("rx", 0) + vong * tong_rx + sum(a for a, _ in gs[:du])
        c["tx"] = c.get("tx", 0) + vong * tong_tx + sum(b for _, b in gs[:du])
    return goc


def _loc_theo_ban_mau(cay, ban_mau):
    """
    Tra ve phan cua `cay` co hinh dang dung bang `ban_mau`.

    Khoa nao ban_mau hoi ma kho KHONG co thi BO QUA — khong lay gia tri mac
    dinh trong ban mau ra tra lai. Ban mau la mac dinh cua ma nguon, khong
    phai bang chung; tra no ra chinh la bia (CLAUDE.md muc 2.1). Trang nao
    thieu du lieu se lo ra ngay, dung hon la im lang bang mot so tu nghi.
    """
    if not isinstance(ban_mau, dict) or not isinstance(cay, dict):
        return {}
    ra = {}
    for k, v in ban_mau.items():
        if k not in cay:
            continue
        if isinstance(v, dict):
            ra[k] = _loc_theo_ban_mau(cay[k], v)
        else:
            ra[k] = cay[k]
    return ra


def _cigext_tu_uci(ban_mau, cay_cu):
    """
    data_repo.cigext get: tra ve CHINH hinh dang ban mau, gia tri lay tu uci.
    Quy tac doc (khop moi khung that da do — khung_that_cigext_{wan,lan,lan6}.json, UR1):
    list -> noi dau cach; option khong co -> ''; dhcp leasetime '720m' -> '720'.
    (config, section) KHONG co trong uci -> giu cach cu (loc cay cigext da do) — chua do.
    """
    import ax3000c_uci_doc_nguoc as _N
    uci = KHO.doc(KHOA_CAY_UCI) or {}
    ra = {}
    for cfg, secs in ban_mau.items():
        if not isinstance(secs, dict):
            continue
        for sn, opts in secs.items():
            s = (uci.get(cfg) or {}).get(sn)
            if not isinstance(s, dict) or not isinstance(opts, dict):
                cu = _loc_theo_ban_mau(cay_cu, {cfg: {sn: opts}}).get(cfg, {})
                if sn in cu:
                    ra.setdefault(cfg, {})[sn] = cu[sn]
                continue
            mot = {cfg: {sn: {o: "" for o in opts}}}
            _N.cigext_cay({cfg: {sn: s}}, mot)
            ra.setdefault(cfg, {})[sn] = mot[cfg][sn]
    return ra


def _dong_bo_khung_tu_uci():
    """
    Moi khung *_get = ham cua tep /etc/config (DO THAT: UR1 — 14 khung dung nguoc tu tep Backup
    trung FNV thiet bi; 2026-09-26: firewall_get sau set co nguong khi detect tat, dos tat, spi
    tat va cigext get sau upnpd_set deu doc tu uci). Goi sau moi lan ghi va sau khi nap Backup.
    """
    import ax3000c_uci_doc_nguoc as _N
    cay = KHO.doc(KHOA_CAY_UCI) or {}
    for khoa, moi in _N.khung_tu_uci(cay, KHO.doc).items():
        if json.dumps(moi) != json.dumps(KHO.doc(khoa)):
            KHO.ghi(khoa, moi)
    # hostname lan sang system.board / network.topology (nhu _ghi_system, do nhom 7)
    host = next((s.get("hostname") for s in (cay.get("system") or {}).values()
                 if isinstance(s, dict) and s.get(".type") == "system"), None)
    bd = KHO.doc("system.board")
    if host and isinstance(bd, dict) and bd.get("hostname") != host:
        cu = bd.get("hostname")
        bd["hostname"] = host
        KHO.ghi("system.board", bd)
        tp = KHO.doc("network.topology")
        if isinstance(tp, dict):
            for m in tp.values():
                if isinstance(m, dict) and m.get("hostname") == cu:
                    m["hostname"] = host
            KHO.ghi("network.topology", tp)


def _co_trong_acl(doi_tuong, ham):
    """
    Phien co duoc goi <doi_tuong>.<ham> khong? Tra theo ACL that.

    ACL that dung MAU KY TU DAI DIEN kieu fnmatch cua rpcd — vi du
    "oui.ui": ["*"], "uci": ["*"]. Ban dau em so khop chinh xac tung chu,
    nen hoi quyen oui.ui/* bi tra false -> ung dung tu dang xuat ngay sau
    khi dang nhap (vong lap ve trang login). Bo kiem B8/B9 khong bat duoc vi
    chi thu mot ham ghi ro ten. Nay dung fnmatch cho ca doi tuong lan ham.
    """
    for mau_dt, cac_ham in (ACL.get("ubus") or {}).items():
        if not fnmatch.fnmatchcase(doi_tuong, mau_dt):
            continue
        if any(fnmatch.fnmatchcase(ham, m) for m in (cac_ham or [])):
            return True
    return False


def _xu_ly_ubus(than):
    """
    Bo dieu phoi mot loi goi /ubus.

    Tra ve dict co dung MOT khoa: "result" hoac "error" — y het thiet bi that.
    """
    ps = than.get("params") or []
    if len(ps) < 3:
        return _loi(*LOI_KHONG_THAY)
    sid, doi_tuong, ham = ps[0], ps[1], ps[2]
    ts = ps[3] if len(ps) > 3 else {}

    # Pha "may chu web da song, rpcd chua san" sau reboot: moi loi goi -> -32000
    if _pha_reboot() == "chua_san":
        return _loi(*LOI_KHONG_THAY)

    # ---- dang nhap: sid toan 0 ----
    if doi_tuong == "session" and ham == "login":
        u, m = ts.get("username"), ts.get("password")
        # DO THAT 2026-09-25 (khung_that_nhom8_khung.json):
        #   user CO TON TAI ('admin') + sai/rong mat khau -> result [6]
        #   user khong ton tai / rong / thieu ('', 'root', 'assist', 'Admin', {})
        #     -> error -32002 "Access denied" (trang login goi login() rong luc mo trang)
        # Truoc day moi truong hop sai deu tra [6] — sai voi 5/6 truong hop do.
        if u not in TAI_KHOAN:
            return _loi(*LOI_TU_CHOI)
        if not _mat_khau_dung(u, m):
            return _ket_qua(6)
        moi = uuid.uuid4().hex
        _phien[moi] = {"user": u, "luc": time.time(), "client_key": KHO.current_key()}
        # DO THAT: khoa dung thu tu ubus_rpc_session, timeout, acls, data — KHONG co
        # "expires" (truoc day tu them "expires":300 — bia). Goi tin trung tung byte
        # (tru sid): 3916 ky tu, fnv 49f74fa3 khi thay sid bang "<SID>".
        return _ket_qua(0, {"ubus_rpc_session": moi, "timeout": 300,
                            "acls": ACL, "data": {"username": u}})

    # ---- HET PHIEN: DO THAT 2026-09-25 (khung_that_nhom8_khung.json) ----
    # Phien khong dung qua 300 s (dung 'timeout' tra ve luc login) thi het han;
    # moi loi goi bang sid lam moi moc. Do: nghi 280 s -> con song; nghi ~340 s va
    # 305 s -> -32002. Trang giu phien song nho heartbeat 15 s (session.access).
    ph = _phien.get(sid)
    if ph is not None:
        if time.time() - ph["luc"] > THOI_HAN_PHIEN:
            _phien.pop(sid, None)
        else:
            ph["luc"] = time.time()

    # ---- phien khong hop le ----
    # Do that: data_repo.* thi rpcd khong cho thay -> -32000;
    #          moi doi tuong khac thay nhung tu choi -> -32002.
    if sid not in _phien:
        if doi_tuong.startswith("data_repo."):
            return _loi(*LOI_KHONG_THAY)
        return _loi(*LOI_TU_CHOI)

    if doi_tuong == "session":
        if ham == "access":
            if ts.get("scope"):
                return _ket_qua(0, {"access": _co_trong_acl(ts.get("object", ""),
                                                            ts.get("function", ""))})
            return _ket_qua(0, ACL)
        if ham == "get":
            return _ket_qua(0, {"values": {"username": _phien[sid]["user"]}})
        if ham == "destroy":
            _phien.pop(sid, None)
            return _ket_qua(0)

    if doi_tuong == "system" and ham == "reboot":
        # Giữ hành vi reboot trong phạm vi thiết bị ảo của KTV hiện tại.
        # Không được làm mất phiên của các KTV khác đang dùng cùng tiến trình.
        client_key = KHO.current_key()
        _REBOOT_THEO_KTV[client_key] = time.time()
        for active_sid, active_session in list(_phien.items()):
            if active_session.get("client_key") == client_key:
                _phien.pop(active_sid, None)
        _TMP.clear()          # /tmp la tmpfs — mat khi khoi dong lai
        return _ket_qua(0)

    if doi_tuong == "oui.ui" and ham == "menu":
        return _ket_qua(0, {"menu": MENU})

    # oui.ui crypt {data} -> {crypt}: DO THAT 2026-09-25 (khung_that_nhom7_system.json)
    # md5-crypt "$1$" MUOI RONG, tat dinh. Trang Change Password / Remote Web goi
    # truoc khi *_set. Chi tinh toan, khong doi trang thai.
    if doi_tuong == "oui.ui" and ham == "crypt" and isinstance(ts, dict) \
            and isinstance(ts.get("data"), str):
        return _ket_qua(0, {"crypt": md5crypt(ts["data"], "")})
    # oui.ui/lang KHONG hardcode nua: thiet bi that tra {"lang":"auto"},
    # em tung ghi cung "en" — do la bia. Nay lay tu kho (quet_doc_59_api.json).

    if doi_tuong == "system" and ham == "info":
        # Lay NGUYEN khung that roi chi thay hai truong doi theo thoi gian.
        # Truoc day em tu go lai dict nay va QUEN khoi "memory" -> trang Home
        # hien "Memory Usage 100%". Khong go tay nua, luon lay tu kho.
        goc = KHO.doc("system.info") or {}
        goc = dict(goc)
        # localtime = epoch UTC + lech mui gio (DO 2026-09-25: ddns datetime la
        # UTC, localtime cung luc lech ~+7 h, khop timezone "ICT-7" trong uci
        # system). Lay do lech tu CHINH kho (uci system timezone), khong hardcode.
        goc["localtime"] = int(time.time()) + _lech_mui_gio()
        goc["uptime"] = int(time.time() - _goc_uptime())
        return _ket_qua(0, goc)

    # ---- data_repo.cigext: co che BAN MAU (do that 2026-09-24) ----
    # Trang network/wan (va cac trang cigext khac) KHONG goi *_get. Chung gui
    # mot BAN MAU liet ke dung nhung khoa can, thiet bi tra ve chinh hinh dang
    # do voi gia tri that. Goi voi {} thi tra {} — dung co che, khong phai loi.
    # Bang chung: reference/api/khung_that_cigext_wan.json
    if doi_tuong == "data_repo.cigext" and ham in ("get", "set"):
        cay = KHO.doc(KHOA_CAY_CIGEXT) or {}
        if ham == "get":
            # 2026-09-26: DO THAT cigext get DOC THANG uci (upnpd_set tat -> cigext get
            # {upnpd:{config:{enabled}}} tra '0' ngay). Truoc day doc cay rieng -> lech
            # khi trang khac sua cung config. Nay: (config, section) co trong uci -> doc uci.
            return _ket_qua(0, _cigext_tu_uci(ts if isinstance(ts, dict) else {}, cay))
        # set: ghi vao dung cay do — mot kho duy nhat (CLAUDE.md muc 2.5).
        # CHU Y: hinh dang tra ve cua cigext.set CHUA DUOC DO tren thiet bi that
        # (xem ISSUES). Tra [0] la suy doan, da ghi ro chu khong im lang.
        ghi = json.loads(json.dumps(ts)) if isinstance(ts, dict) else {}
        _chuan_hoa_ghi_cigext(ghi)
        KHO.gop(KHOA_CAY_CIGEXT, ghi)
        return _ket_qua(0, TRA_VE_SET_THANH_CONG)

    # ---- uci.get: DO THAT 2026-09-25 (reference/api/khung_that_uci.json) ----
    # $uci.load(config) cua app.js goi uci get {config}. Trang dung: network/ddns
    # (uci-form config=ddns) va home (zonename cho dong Local Time).
    # Config khong ton tai -> thiet bi tra "result":[6], KHONG phai khoi error.
    # Chieu GHI (uci set/add/delete/order/apply/confirm) CHUA DO -> roi xuong
    # nhanh "khong co bang chung" ben duoi (-32000), khong bia.
    if doi_tuong == "uci" and ham == "get":
        cay = KHO.doc(KHOA_CAY_UCI) or {}
        ts = ts if isinstance(ts, dict) else {}
        cfg, sec, opt = ts.get("config"), ts.get("section"), ts.get("option")
        if sec is not None:
            # DO THAT: {config, section, option} ton tai -> {"value": "<gia tri>"}
            # (ddns/myddns_ipv4/enabled -> {"value":"0"}). Cac bien the khac
            # (chi section, option khong ton tai) CHUA DO -> khong bia.
            v = ((cay.get(cfg) or {}).get(sec) or {}).get(opt) if opt else None
            if v is not None:
                return _ket_qua(0, {"value": v})
            return _loi(*LOI_KHONG_THAY)
        # 2026-09-25 (nhom 10): [6] la TU CHOI THEO ACL, khong chi "khong ton tai".
        # Do that: uhttpd/openvpn/collectd/dhcrelay/pppoe/openssl/ubootenv CO tep
        # trong Backup nhung uci get -> [6]; 14 config trong ACL uci (acl_that.json)
        # doc duoc — rtty (tep khong phai cu phap uci) -> {"values":{}}.
        if cfg in cay and "read" in (_ACL_UCI.get(cfg) or []):
            return _ket_qua(0, {"values": cay[cfg]})
        return _ket_qua(6)

    # ---- uci set / apply / confirm: DO THAT 2026-09-25 (hop_dong_ghi_nhom2_access.json)
    # set {config, section, values} -> [0]; moi option vua ghi CHUYEN XUONG CUOI
    # section (xac nhan bang tong FNV). Ghi thang vao kho: luong trang luon la
    # set -> apply -> confirm -> get, nen trang thai "cho apply" (staging) cua
    # uci khong lo ra — CHUA DO rieng, khong mo hinh.
    # uci add / delete / order CHUA DO -> roi xuong nhanh chan ben duoi.
    if doi_tuong == "uci" and ham == "set" and isinstance(ts, dict):
        cay = KHO.doc(KHOA_CAY_UCI) or {}
        sec = (cay.get(ts.get("config")) or {}).get(ts.get("section"))
        if isinstance(sec, dict) and isinstance(ts.get("values"), dict):
            truoc = json.dumps(sec)
            for k, v in ts["values"].items():
                # 2026-09-26: giu gia tri -> giu cho (quy tac uci set, nhom 11); truoc day
                # moi option gui toi deu bi chuyen xuong cuoi
                if sec.get(k) != v:
                    sec.pop(k, None)
                    sec[k] = v
            if json.dumps(sec) != truoc and ts.get("config") == "aeiWiFiTimer":
                _WT["cho_apply"] = True     # reload_config chi chay voi config DA DOI
            _ghi_cay_uci(cay)
            return _ket_qua(0)
        return _loi(*LOI_KHONG_THAY)
    if doi_tuong == "uci" and ham in ("apply", "confirm"):
        if ham == "apply" and _WT.pop("cho_apply", False):
            _wt_ap_dung()
        return _ket_qua(0)

    # ---- Backup / Restore: DO THAT 2026-09-25/26 (hop_dong_uci_nhom12.json upload_archive,
    # hop_dong_nhom13.json oui_system). Tep tai len nam o /tmp (bo nho, mat khi khoi dong lai).
    if doi_tuong == "oui.system" and ham == "drop_caches":
        return _ket_qua(0, {"status": True})
    if doi_tuong == "oui.system" and ham == "backup_clean":
        _TMP.pop("/tmp/backup.tar.gz", None)
        return _ket_qua(0)
    if doi_tuong == "oui.system" and ham == "backup_restore":
        return _backup_restore()

    # ---- ddns set / get: DO THAT 2026-09-25 ----
    # Trang LUON gui ddns set {enabled:"1"} sau khi uci-form apply xong.
    #   uci ddns dang bat -> thiet bi thu cap nhat; voi tai khoan mau tra
    #     {address:"", datetime:<epoch UTC>, status:"Fail"}; ddns get tra lai y vay
    #   uci ddns dang tat -> {status:"Success"}; ddns get tra {}
    # Ban gia lap khong goi duoc nha cung cap DDNS that nen luon ra "Fail" —
    # dung ket qua do duoc voi cau hinh hien co; tai khoan that CHUA DO.
    if doi_tuong == "ddns" and ham == "set":
        bat = ((KHO.doc(KHOA_CAY_UCI) or {}).get("ddns", {})
               .get("myddns_ipv4", {}).get("enabled")) == "1"
        if bat:
            st = {"address": "", "datetime": str(int(time.time())), "status": "Fail"}
            KHO.ghi("ddns.get", st)
            return _ket_qua(0, st)
        KHO.ghi("ddns.get", {})
        return _ket_qua(0, {"status": "Success"})

    # ---- Wi-Fi Advanced: DO THAT 2026-09-25 (hop_dong_ghi_nhom3.json) ----
    # Trang doi moi country_code "US*" thanh "US" khi hien thi va gui "US";
    # thiet bi nhan "US" van GIU "US4" khi doc lai. Chi mo hinh dung truong hop
    # do duoc (gui "US" khi dang "US*"); ma nuoc khac CHUA DO -> ghi nhu gui.
    if doi_tuong == "data_repo.weboui" and ham == "wifiadv_set" and isinstance(ts, dict):
        hien = KHO.doc("data_repo.weboui.wifiadv_get") or {"adv": {}}
        moi = json.loads(json.dumps(ts))
        for bt, gt in (moi.get("adv") or {}).items():
            cu = (hien.get("adv") or {}).get(bt) or {}
            if (gt.get("country_code") == "US"
                    and str(cu.get("country_code", "")).startswith("US")):
                gt["country_code"] = cu["country_code"]
        KHO.gop("data_repo.weboui.wifiadv_get", moi)
        return _ket_qua(0, TRA_VE_SET_THANH_CONG)

    # ---- Static Routing IPv4/IPv6: DO THAT 2026-09-25 (hop_dong_ghi_nhom4_advanced.json)
    # Trang gui TOAN BANG {data:[...]} (khong _method). Thiet bi luu nguyen,
    # rieng IPv4 them "Status":"true" vao CUOI moi dong; set tra toan bang sau ghi.
    if doi_tuong in ("aei-route", "aei-route6") and ham == "set" and isinstance(ts, dict):
        ds = []
        for d in (ts.get("data") or []):
            d = dict(d)
            if doi_tuong == "aei-route":
                # nhom 12 (rt_ngoai): gateway ngoai mang LAN -> "Status":"false"
                lan = ((KHO.doc(KHOA_CAY_UCI) or {}).get("network") or {}).get("lan")
                d.pop("Status", None)
                d["Status"] = "true" if uci_tac_dong.trong_lan(lan, d.get("Gateway")) else "false"
            ds.append(d)
        KHO.ghi(f"{doi_tuong}.get", {"data": ds})
        return _ket_qua(0, {"data": ds})

    # ---- ALG: DO THAT 2026-09-25 ----
    # Trang gui o vua bat/tat dang boolean, o khac chuoi "1"; thiet bi luu chuoi
    # "1"/"0" va tra ve TOAN BO trang thai sau ghi (theo thu tu khoa cua no).
    if doi_tuong == "alg" and ham == "set" and isinstance(ts, dict):
        hien = dict(KHO.doc("alg.get") or {})
        for k, v in ts.items():
            if k in hien:
                hien[k] = ("1" if v else "0") if isinstance(v, bool) else v
        KHO.ghi("alg.get", hien)
        return _ket_qua(0, hien)

    # ---- DMZ: dest_ip rong bi thiet bi tu choi (DO THAT) ----
    # dmz_set {dmz_v4:{dest_ip:""}} -> result [8, {status:false}], cau hinh giu
    # nguyen. Chi do truong hop rong; trang tu chan IP sai nen khong gui toi day.
    if (doi_tuong == "data_repo.weboui" and ham == "dmz_set" and isinstance(ts, dict)
            and (ts.get("dmz_v4") or {}).get("dest_ip") == ""):
        return _ket_qua(8, {"status": False})

    # ---- Nhom 5 Maintain: DO THAT 2026-09-25 (khung_that_nhom5_maintain.json) ----
    if f"{doi_tuong}.{ham}" in N5.get("khung_chi_ma", {}):
        return _ket_qua(0)          # vd speedtest.history -> result [0] tron
    if doi_tuong == "oui.network" and ham in ("ping", "ping6", "traceroute",
                                              "traceroute6", "nslookup"):
        return _cong_cu_mang(ham, (ts or {}).get("name", "") if isinstance(ts, dict) else "")
    if doi_tuong == "data_repo.weboui" and ham == "selftest":
        st = N5.get("selftest", {})
        if isinstance(ts, dict) and ts.get("ping_ip_enable") == "0":
            time.sleep(st.get("ms", 0) / 1000.0)
            return _ket_qua(*st["nhan"])
        return _loi(*LOI_KHONG_THAY)   # ping_ip_enable "1" CHUA DO

    # ---- Nhom 5: nut hanh dong DO THAT 2026-09-25 (hop_dong_ghi_nhom5_maintain.json)
    if doi_tuong == "speedtest" and ham == "start":
        # Thiet bi khong co DNS/WAN -> moi lan chay: res 1 ~2 s roi res 4 (do voi
        # URL khong phan giai). Trang thai res 4 duoc GIU sau lan chay (do that).
        _N5_TT["speedtest_bat_dau"] = time.time()
        return _ket_qua(0, {"status": True})
    if doi_tuong == "speedtest" and ham == "running" and _N5_TT.get("speedtest_bat_dau"):
        hd = N5G.get("speedtest", {}).get("running_sau_start", {})
        if time.time() - _N5_TT["speedtest_bat_dau"] < hd.get("res1_trong_ms", 0) / 1000.0:
            return _ket_qua(*hd["res1"])
        KHO.ghi("speedtest.running", hd["sau_do"][1])
        _N5_TT.pop("speedtest_bat_dau")
        return _ket_qua(*hd["sau_do"])
    if doi_tuong == "data_repo.weboui" and ham in ("tcpdump_start", "tcpdump_stop",
                                                   "tcpdump_save") and isinstance(ts, dict):
        td = N5G.get("tcpdump", {})
        if ham == "tcpdump_start":
            # do voi lan/10 goi: tra [0] khi bat du goi (~6,3 s); gia tri khac CHUA DO
            time.sleep(td.get("start", {}).get("ms", 0) / 1000.0)
            return _ket_qua(0)
        if ham == "tcpdump_stop":
            return _ket_qua(0)
        # save: {dumpfile:"/packet_<wanlanlist>.pcap"} (do voi lan). Tep that la
        # goi tin bat duoc tren LAN — khong co ban ghi, va thiet bi xoa ngay sau
        # stop (GET -> 404) nen gia lap cung 404.
        return _ket_qua(0, {"dumpfile": f"/packet_{ts.get('wanlanlist', '')}.pcap"})
    if doi_tuong == "data_repo.weboui" and ham == "techsupportinfo_collect":
        _N5_TT["ts_bat_dau"] = time.time()
        return _ket_qua(*N5G["techsupport"]["collect"]["nhan"])
    if doi_tuong == "data_repo.weboui" and ham == "techsupportinfo_get" and _N5_TT.get("ts_bat_dau"):
        t0 = _N5_TT["ts_bat_dau"]
        if time.time() - t0 < N5G["techsupport"]["thoi_gian_thu_s"]:
            return _ket_qua(*N5G["techsupport"]["get_dang_thu"])
        # Ten tep theo MAU do duoc: logpull-<MAC>_<seri>_<YYYYMMDD_HHMMSS gio thiet bi>.en
        # (MAC + seri lay tu chinh ten tep that; gio = localtime cua gia lap)
        tien_to = N5G["techsupport"]["get_xong"][1]["logfile"].rsplit("_", 2)[0]
        gio = time.strftime("%Y%m%d_%H%M%S", time.gmtime(time.time() + _lech_mui_gio()))
        kq = {"status": 0, "logfile": f"{tien_to}_{gio}.en"}
        KHO.ghi("data_repo.weboui.techsupportinfo_get", kq)
        _N5_TT.pop("ts_bat_dau")
        return _ket_qua(0, kq)

    # ---- LAN Status: phat lai gia so bo dem that (xem _lanstatus_phat_lai) ----
    if doi_tuong == "data_repo.weboui" and ham == "lanstatus" and GIA_SO_LAN:
        return _ket_qua(0, _lanstatus_phat_lai())

    # ---- Change Password: DO THAT 2026-09-26 (anh Huynn bam tay, hop_dong_nhom13.json 'doi_mat_khau') ----
    # oui.ui crypt {data} -> md5-crypt muoi rong; loginpwd_set {login:{password:<crypt>}} -> [0,{status:true}]
    # (159 ms); NGAY SAU DO MOI phien bi huy (loi goi ke tiep +0,6 s -> -32002); trang KHONG tu ve login.
    # Quy tac 12 ky tu / ky hieu / chu hoa la kiem O TRANG (ma trang goc), may chu khong kiem.
    if doi_tuong == "data_repo.weboui" and ham == "loginpwd_set" and isinstance(ts, dict):
        mk = (ts.get("login") or {}).get("password")
        if not isinstance(mk, str) or not mk:
            return _loi(*LOI_KHONG_THAY)      # goi thieu truong: CHUA DO
        KHO.ghi(KHOA_MK_ADMIN, mk)
        client_key = KHO.current_key()
        for active_sid, active_session in list(_phien.items()):
            if active_session.get("client_key") == client_key:
                _phien.pop(active_sid, None)
        return _ket_qua(0, TRA_VE_SET_THANH_CONG)

    # ---- Remote Web: DO THAT 2026-09-26 (anh Huynn bam tay, bat State '1') ----
    # remote-gui set {State, Username, Password:<crypt>, PlainPasswd} -> [0,{State,Username,Password:<PlainPasswd>}]
    # (687 ms) — tra MAT KHAU DANG CHU; get sau do y vay. Phien KHONG bi huy. Nhanh State '0': CHUA DO rieng
    # (cung ham, gia lap theo cung hinh dang). remotegui.get / webinfo.remoteGuiInfo co doi theo khong: CHUA DO.
    if doi_tuong == "remote-gui" and ham == "set" and isinstance(ts, dict):
        moi = {"State": ts.get("State", ""), "Username": ts.get("Username", ""), "Password": ts.get("PlainPasswd", "")}
        KHO.ghi("remote-gui.get", moi)
        return _ket_qua(0, moi)

    # ---- System: system_set DO THAT 2026-09-25 (hop_dong_ghi_nhom7_system.json) ----
    if doi_tuong == "data_repo.weboui" and ham == "system_set" and isinstance(ts, dict):
        _ghi_system(ts)
        return _ket_qua(0, TRA_VE_SET_THANH_CONG)

    # ---- Wi-Fi: hop dong ghi DA DO (lab 2 + 3) ----
    if doi_tuong == "data_repo.weboui" and ham == "wifi_set":
        _ghi_wifi(ts if isinstance(ts, dict) else {})
        return _ket_qua(0, TRA_VE_SET_THANH_CONG)

    # ---- Cac trang BANG da do hop dong ghi (Reserved IP, Port Forwarding) ----
    if doi_tuong == "data_repo.weboui" and ham in BANG_DA_DO:
        _ghi_bang(ham, ts if isinstance(ts, dict) else {})
        return _ket_qua(0, TRA_VE_SET_THANH_CONG)

    # ---- doc/ghi cau hinh: moi thu di qua KHO ----
    khoa = f"{doi_tuong}.{ham}"

    # Khoa noi bo cua kho, KHONG phai API that -> phai tu choi y nhu thiet bi
    if khoa in (KHOA_CAY_CIGEXT, KHOA_CAY_UCI, KHOA_MTIME_UCI, "tep.etc_crontabs_root",
                KHOA_MTIME_CHAM, "tep.ghi_de", "tk.admin_crypt"):
        return _loi(*LOI_KHONG_THAY)

    # chieu DOC: khoa co san trong kho
    gt = KHO.doc(khoa)
    if gt is not None:
        return _ket_qua(0, gt)

    # chieu GHI: <ten>_set ghi vao chinh khoa <ten>_get
    if ham.endswith("_set"):
        khoa_doc = f"{doi_tuong}.{ham[:-4]}_get"
        # CHAN ghi dang BANG khi chua do hop dong ghi (2026-09-24).
        # Cac trang bang (Reserved IP, Port Forwarding...) khong gui ca bang
        # moi, ma gui DANH SACH THAY DOI: moi dong mang _method add/update/del
        # va _idx. Gop sau vao kho se bien danh sach thay doi thanh du lieu
        # -> hong kho. Cach thiet bi cap _idx cho dong moi CHUA DO -> tu dat
        # la bia. Tra loi "khong ho tro" de trang bao "Configuration applied
        # fail" cho trung thuc, cho toi khi do duoc bang mot lan Apply that.
        if _co_danh_sach(ts):
            return _loi(*LOI_KHONG_THAY)
        if KHO.doc(khoa_doc) is not None:
            KHO.gop(khoa_doc, ts if isinstance(ts, dict) else {})
            # systemlog_set -> uci: uci_tac_dong.systemlog_set (nhom 11, du 5 option)
            # Moi *_set cua data_repo da do deu tra [0,{status:true}]
            # (wifi, portfwd, dhcp_reservation, cigext, upnpd, dmz). Truoc day
            # nhanh chung tra [0] tron — sai voi upnpd_set/dmz_set (do 2026-09-25).
            # 2026-09-25: speedtest_set do duoc tra [0] TRON -> quy tac chung
            # "moi data_repo *_set tra status:true" la SAI. Nay theo tung ham:
            #   [0,{status:true}] da do: upnpd, dmz, firewall, systemlog
            #   [0] tron da do       : speedtest
            #   ham chua do          : theo so dong (status:true) — GHI RO la suy rong
            if doi_tuong.startswith("data_repo."):
                if ham in SET_TRA_MA_TRON:
                    return _ket_qua(0)
                return _ket_qua(0, TRA_VE_SET_THANH_CONG)
            return _ket_qua(0)
    # easymesh set: DO THAT 6 mau (lab7 buoc 1-2, nhom 11 em_tat/em_bat/nc_mesh) — chi bat/tat
    # (MeshRole giu nguyen) thi thiet bi tra TRANG THAI TRUOC khi ghi. Doi vai tro (lab7 buoc
    # 3-4) tra trang thai moi (buoc 3 MeshBSS la) -> giu cach cu (tra trang thai moi).
    if doi_tuong == "network.wireless.easymesh" and ham == "set" and isinstance(ts, dict):
        truoc = KHO.doc("network.wireless.easymesh.get")
        if truoc is not None:
            KHO.gop("network.wireless.easymesh.get", ts)
            if ts.get("MeshRole", truoc.get("MeshRole")) == truoc.get("MeshRole"):
                return _ket_qua(0, truoc)
            return _ket_qua(0, KHO.doc("network.wireless.easymesh.get"))
    if ham == "set":
        khoa_doc = f"{doi_tuong}.get"
        if KHO.doc(khoa_doc) is not None:
            KHO.gop(khoa_doc, ts if isinstance(ts, dict) else {})
            return _ket_qua(0, KHO.doc(khoa_doc))

    # Chua co bang chung -> tra dung khoi error cua thiet bi that, khong bia du lieu
    return _loi(*LOI_KHONG_THAY)


# ---- NHOM 11: moi loi goi ghi -> cay uci (uci_tac_dong.py, do that) ----
import ax3000c_uci_tac_dong as uci_tac_dong  # noqa: E402

KHOA_CRONTAB = "tep.etc_crontabs_root"   # noi bo: noi dung + mtime etc/crontabs/root khi da doi


def _crontab_hien():
    """{noi_dung, mtime} cua etc/crontabs/root: kho neu da doi, khong thi lay tu tep Backup that."""
    from ax3000c_kho_cau_hinh import doc_backup_that
    hien = KHO.doc(KHOA_CRONTAB)
    if hien is None:
        bk = doc_backup_that()
        m = next((m for m in (bk or {}).get("muc", []) if m["ten"] == "etc/crontabs/root"), None)
        if m is None:
            return None
        hien = {"noi_dung": m["noi_dung"].decode("utf-8", "surrogateescape"), "mtime": m["mtime"]}
    return hien


def _crontab_thay(bo, them, luc=None, cham=False):
    """Bo cac dong thoa `bo`, noi `them` vao cuoi; ghi (mtime = luc) neu noi dung doi hoac cham=True."""
    hien = _crontab_hien()
    if hien is None:
        return
    dong = [d for d in hien["noi_dung"].split("\n") if d and not bo(d)] + list(them)
    nd = "\n".join(dong) + "\n"
    if nd != hien["noi_dung"] or cham:
        KHO.ghi(KHOA_CRONTAB, {"noi_dung": nd, "mtime": int(luc if luc is not None else time.time())})


def _crontab_speedtest(ts):
    """speedtest_set -> dong crontab root (do: sp_doi them, sp_tv xoa). Do nhom 11: Apply KHONG doi van
    'cham' mtime crontab (cham_mtime_khi_khong_doi)."""
    moi = uci_tac_dong.dong_crontab_speedtest(ts)
    _crontab_thay(lambda d: d.endswith("ubus call speedtest start"), [moi] if moi else [], cham=True)


# ---- Wi-Fi Timer: DO THAT 2026-09-26 (reference/api/hop_dong_nhom13.json 'wifi_timer') ----
# Ap dung (uci apply sau khi aeiWiFiTimer doi): viet lai 2 dong crontab + dat wireless disabled theo
# khung gio. Moi lan wireless doi (do timer HOAC cron) -> nap lai Wi-Fi ~74 s, cac lan nap XEP HANG
# noi tiep. Script timer giu KHOA toi khi lan nap cua chinh no xong; apply trong luc khoa: khoa het
# trong <= 21 s -> xu ly luc het khoa, con lai BO QUA. Mo hinh rut tu thoi gian 13 lan do, khop 13/13
# (T2e xu ly som hon that ~10 s). Co che ben trong KHONG doc duoc (script ngoai ACL).
WT_NAP_S = 74.0
WT_CHO_S = 21.0
_WT = {"khoa_den": 0.0, "nap_den": 0.0, "cho": None, "cron_moc": time.time()}


def _wt_nap_lai(luc):
    """Mot lan nap lai Wi-Fi bat dau tu `luc` (xep sau lan dang chay). Tra ve luc xong."""
    _WT["nap_den"] = max(luc, _WT["nap_den"]) + WT_NAP_S
    return _WT["nap_den"]


def _gio_thiet_bi(t):
    """(phut trong ngay, thu cron 0=CN) theo gio thiet bi luc epoch t."""
    g = time.gmtime(t + _lech_mui_gio())
    return g.tm_hour * 60 + g.tm_min, (g.tm_wday + 1) % 7


def _wt_xu_ly(luc):
    cay = KHO.doc(KHOA_CAY_UCI) or {}
    sec = uci_tac_dong.wifitimer_section(cay)
    _crontab_thay(uci_tac_dong.la_dong_wifitimer, uci_tac_dong.dong_crontab_wifitimer(sec), luc)
    phut, thu = _gio_thiet_bi(luc)
    if uci_tac_dong.dat_wireless_disabled(cay, uci_tac_dong.wifitimer_muon_tat(sec, phut, thu)):
        _ghi_cay_uci(cay, luc)
        _dong_bo_khung_tu_uci()
        _WT["khoa_den"] = _wt_nap_lai(luc)


def _wt_ap_dung():
    bay_gio = time.time()
    if bay_gio >= _WT["khoa_den"]:
        _wt_xu_ly(bay_gio)
    elif _WT["khoa_den"] - bay_gio <= WT_CHO_S:
        _WT["cho"] = _WT["khoa_den"]
    # else: bo qua (do T2b, T2c, T2g, E3)


def _cron_lan_cuoi(dong, tu, den):
    """Lan chay gan nhat (epoch, dung phut) cua dong cron wifi timer trong (tu, den]; None neu khong co."""
    p = dong.split()
    try:
        mm, hh = int(p[0]), int(p[1])
        ngay = {int(x) for x in p[4].split(",") if x != ""}
    except (ValueError, IndexError):
        return None
    lech = _lech_mui_gio()
    t = int((den + lech) // 60) * 60 - lech      # phut hien tai (gio thiet bi) ve epoch
    for _ in range(8 * 24 * 60):
        if t <= tu:
            return None
        g = time.gmtime(t + lech)
        if g.tm_min == mm and g.tm_hour == hh and (g.tm_wday + 1) % 7 in ngay:
            return t
        t -= 60
    return None


def _hen_gio_tick():
    """Chay tre (theo dung thu tu thoi gian) cac viec hen gio den han: Wi-Fi Timer bi hoan, cron Wi-Fi Timer."""
    bay_gio = time.time()
    viec = []
    if _WT["cho"] is not None and bay_gio >= _WT["cho"]:
        viec.append((_WT["cho"], None))
        _WT["cho"] = None
    tu, _WT["cron_moc"] = _WT["cron_moc"], bay_gio
    ct = KHO.doc(KHOA_CRONTAB)
    moi = None
    for d in (ct or {}).get("noi_dung", "").split("\n"):
        if uci_tac_dong.la_dong_wifitimer(d):
            t = _cron_lan_cuoi(d, tu, bay_gio)
            if t is not None and (moi is None or t > moi[0]):
                moi = (t, "0" if "disabled=0" in d else "1")
    if moi:
        viec.append(moi)
    for luc, v in sorted(viec, key=lambda x: x[0]):
        if v is None:
            _wt_xu_ly(luc)
            continue
        cay = KHO.doc(KHOA_CAY_UCI) or {}
        if uci_tac_dong.dat_wireless_disabled(cay, v):
            _ghi_cay_uci(cay, luc)
            _dong_bo_khung_tu_uci()
            _wt_nap_lai(luc)      # cron cung nap lai Wi-Fi (khong giu khoa script timer)


# ---- Upload archive / backup_restore (DO THAT, xem tren) ----
_TMP = {}   # /tmp cua thiet bi: {duong_dan: bytes}
KHOA_TEP = "tep.ghi_de"   # noi bo: {duong dan trong tar: {nd (latin-1), mtime, cay?}} sau khi nap Backup


def _backup_restore():
    """
    oui.system backup_restore = sysupgrade -r /tmp/backup.tar.gz (tar -xzf ra /):
      khong co tep  -> [0,{code:1, stderr:"Backup archive '/tmp/backup.tar.gz' not found.\\n"}]
      khong phai gzip -> code 1 "tar: invalid magic\\ntar: short read\\n"
      gzip nhung < 512 byte -> code 1 "tar: short read\\n"
      tep dung -> [0,{code:0}]; MOI tep trong tar ghi de NGAY (noi dung + mtime), truoc khi khoi dong lai
    Cac loi khac (tar hong giua chung, gzip hong) CHUA DO -> error -32000, khong bia stderr.
    """
    import gzip
    import io
    import tarfile
    import zlib
    b = _TMP.get("/tmp/backup.tar.gz")
    if b is None:
        return _ket_qua(0, {"code": 1, "stderr": "Backup archive '/tmp/backup.tar.gz' not found.\n"})
    if b[:2] != b"\x1f\x8b":
        return _ket_qua(0, {"code": 1, "stderr": "tar: invalid magic\ntar: short read\n"})
    try:
        raw = gzip.decompress(b)
    except (OSError, EOFError, zlib.error):
        return _loi(*LOI_KHONG_THAY)
    if len(raw) < 512:
        return _ket_qua(0, {"code": 1, "stderr": "tar: short read\n"})
    try:
        tf = tarfile.open(fileobj=io.BytesIO(raw), mode="r:")
        muc = [(m, tf.extractfile(m).read() if m.isfile() else None) for m in tf.getmembers()]
    except (tarfile.TarError, OSError):
        return _loi(*LOI_KHONG_THAY)
    _nap_tep_backup(muc)
    return _ket_qua(0, {"code": 0})


def _nap_tep_backup(muc):
    import ax3000c_uci as _uci
    cay = KHO.doc(KHOA_CAY_UCI) or {}
    mt = KHO.doc(KHOA_MTIME_UCI) or {}
    tep = KHO.doc(KHOA_TEP) or {}
    for m, nd in muc:
        if nd is None:
            continue
        ten = m.name.lstrip("./")
        o = {"nd": nd.decode("latin-1"), "mtime": int(m.mtime)}
        if ten.startswith("etc/config/"):
            cfg = ten[11:]
            try:
                cay[cfg] = _uci.thanh_cay(_uci.doc(nd.decode("utf-8", "surrogateescape")))
            except Exception:
                cay.pop(cfg, None)
            o["cay"] = json.dumps(cay.get(cfg))
            mt[cfg] = int(m.mtime)
        elif ten == "etc/crontabs/root":
            KHO.ghi(KHOA_CRONTAB, {"noi_dung": nd.decode("utf-8", "surrogateescape"), "mtime": int(m.mtime)})
        tep[ten] = o
    KHO.ghi(KHOA_CAY_UCI, cay)
    KHO.ghi(KHOA_MTIME_UCI, mt)
    KHO.ghi(KHOA_TEP, tep)
    KHO.ghi(KHOA_MTIME_CHAM, {})
    _dong_bo_khung_tu_uci()
    # DO THAT 2026-09-26: nap tep Backup goc (sau khi doi mat khau admin + bat Remote Web) -> khoi dong lai:
    # dang nhap bang mat khau GOC, remote-gui get {State:'0', Password:''}. Tep Backup cua gia lap luon mang
    # etc/shadow goc (chua mo phong shadow khi doi mat khau) -> nap tep co etc/shadow thi tra ve goc.
    if any(m.name.lstrip("./") == "etc/shadow" for m, _ in muc):
        KHO.ghi(KHOA_MK_ADMIN, None)
        KHO.ghi("remote-gui.get", KHO._goc.get("remote-gui.get"))


def _xu_ly_ubus_day_du(than):
    """
    _xu_ly_ubus + tac dong len cay uci (nhom 11). Loi goi ghi THANH CONG ([0,...]) thi
    ap uci_tac_dong.ap_dung; bang dhcp/portfwd lay lai _idx = ten section uci (tinh theo
    vi tri — dung quy tac do nhom 9, nay dung ca khi co section khac chen truoc).
    """
    _hen_gio_tick()
    goc = json.loads(json.dumps(than)) if isinstance(than, dict) else than
    kq = _xu_ly_ubus(than)
    p = (goc or {}).get("params") if isinstance(goc, dict) else None
    r = kq.get("result") if isinstance(kq, dict) else None
    if not (isinstance(p, list) and len(p) >= 3 and isinstance(r, list) and r and r[0] == 0):
        return kq
    doi_tuong, ham = p[1], p[2]
    ts = p[3] if len(p) > 3 and isinstance(p[3], dict) else {}
    cay = KHO.doc(KHOA_CAY_UCI) or {}
    doi = uci_tac_dong.ap_dung(cay, doi_tuong, ham, ts)
    if doi:
        _ghi_cay_uci(cay)
    else:
        _cham_mtime(doi_tuong, ham, ts)
    if doi or (doi_tuong == "uci" and ham == "set") or ham.endswith("_set") or ham == "set":
        # 2026-09-26: moi khung *_get doc tu uci (do that) -> dung lai sau moi lan ghi
        _dong_bo_khung_tu_uci()
    if doi_tuong == "network.wireless.easymesh" and ham == "set":
        _crontab_thay(lambda d: False, [], cham=True)   # do nhom 11: easymesh set cham crontab
    if doi_tuong == "data_repo.weboui" and ham in ("dhcp_reservation_set", "portfwd_set"):
        khoa, ten_ds = BANG_DA_DO[ham][0], BANG_DA_DO[ham][1]
        hien = KHO.doc(khoa) or {ten_ds: []}
        ten = uci_tac_dong.ten_bang(cay, ham) or []
        dong = hien.get(ten_ds) or []
        if len(ten) == len(dong):
            for d, t in zip(dong, ten):
                d["_idx"] = t
            KHO.ghi(khoa, hien)
    if doi_tuong == "data_repo.weboui" and ham == "speedtest_set":
        _crontab_speedtest(ts)
    return kq


# ---- BACKUP: sinh tep .tar.gz theo cau truc da do ----
TEP_BACKUP = os.path.join(GOC_API, "hop_dong_backup_nhom8.json")


def _uci_xuat(cay_cfg):
    """Xuat mot config uci ra dang tep /etc/config (option/list, gia tri trong '')."""
    def q(v):
        return "'" + str(v).replace("'", "'\\''") + "'"
    ra = ""
    for ten, sec in sorted(cay_cfg.items(), key=lambda kv: kv[1].get(".index", 0)):
        ra += "\nconfig " + sec.get(".type", "") + ("" if sec.get(".anonymous") else " " + q(ten)) + "\n"
        for k, v in sec.items():
            if k.startswith("."):
                continue
            if isinstance(v, list):
                for x in v:
                    ra += "\tlist " + k + " " + q(x) + "\n"
            else:
                ra += "\toption " + k + " " + q(v) + "\n"
    return ra.encode("utf-8")


def _dau_tar(dau, co, mtime):
    """Sua kich thuoc + mtime trong dau tar GNU THAT (512 byte) roi tinh lai checksum."""
    h = bytearray(dau)
    h[124:136] = b"%011o\0" % co
    h[136:148] = b"%011o\0" % mtime
    h[148:156] = b" " * 8
    h[148:156] = b"%06o\0 " % sum(h)
    return bytes(h)


def _tao_backup_that(bk):
    """
    2026-09-25 (nhom 10): Backup dung tu TEP THAT reference/backup (anh Huynn tai
    tu thiet bi). Moi muc giu NGUYEN dau tar GNU + noi dung that; rieng
    etc/config/<cfg> ma kho uci KHAC ban that thi xuat lai tu kho dung dinh dang
    "uci commit" (shared/python/uci.py, kiem 28/28 tep da commit trung byte),
    mtime = luc gia lap ghi config do (thiet bi that: mtime = luc commit).
    Tar khong doi so voi ban that -> tra NGUYEN tep gz that (trung tung byte);
    doi -> nen lai bang zlib: gzip cua busybox KHONG tai tao duoc trung byte
    (thu zlib muc 1-9: khong muc nao trung) — noi dung giai nen van dung.
    Muc nhay cam (shadow, khoa rieng...) tra dung noi dung that: anh Huynn chon.
    """
    import zlib
    from ax3000c_kho_cau_hinh import cay_uci_tu_backup
    import ax3000c_uci as _uci
    cay = KHO.doc(KHOA_CAY_UCI) or {}
    mt = KHO.doc(KHOA_MTIME_UCI) or {}
    cham = KHO.doc(KHOA_MTIME_CHAM) or {}
    tep = KHO.doc(KHOA_TEP) or {}     # tep da nap tu Upload archive (noi dung + mtime trong tar)
    goc = cay_uci_tu_backup()
    ra = bytearray()
    for m in bk["muc"]:
        dau, nd, mtime = m["dau"], m["noi_dung"], m["mtime"]
        o = tep.get(m["ten"])
        if o is not None and m["loai"] == "0":
            nd, mtime = o["nd"].encode("latin-1"), o["mtime"]
        if m["ten"].startswith("etc/config/") and m["loai"] == "0":
            cfg = m["ten"][11:]
            nen = o["cay"] if o is not None and "cay" in o else json.dumps(goc.get(cfg))
            if cfg in cay and json.dumps(cay[cfg]) != nen:
                nd = _uci.xuat(cay[cfg]).encode("utf-8", "surrogateescape")
                mtime = int(mt.get(cfg, mtime))
            if cfg in cham:          # Apply khong doi van ghi lai tep (do nhom 11)
                mtime = max(int(mtime), int(cham[cfg]))
        if m["ten"] == "etc/crontabs/root":
            ct = KHO.doc(KHOA_CRONTAB)
            if ct and (ct.get("noi_dung", "").encode("utf-8", "surrogateescape"), int(ct.get("mtime", mtime))) \
                    != (m["noi_dung"], m["mtime"]):
                nd = ct["noi_dung"].encode("utf-8", "surrogateescape")
                mtime = int(ct.get("mtime", mtime))
        if (nd, mtime) != (m["noi_dung"], m["mtime"]):
            dau = _dau_tar(dau, len(nd), int(mtime))
        ra += dau + nd + b"\0" * (-len(nd) % 512)
    ra += b"\0" * 1024
    raw = bytes(ra)
    if raw == bk["tar"]:
        return bk["gz"]
    nen = zlib.compressobj(9, zlib.DEFLATED, -15)
    than = nen.compress(raw) + nen.flush()
    return (b"\x1f\x8b\x08\x00\x00\x00\x00\x00\x00\x03" + than
            + (zlib.crc32(raw) & 0xffffffff).to_bytes(4, "little")
            + (len(raw) & 0xffffffff).to_bytes(4, "little"))


def _tao_backup():
    import io
    import tarfile
    import zlib
    from ax3000c_kho_cau_hinh import doc_backup_that
    bk = doc_backup_that()
    if bk is not None:
        gz = _tao_backup_that(bk)
        host = ((KHO.doc("data_repo.weboui.system_get") or {}).get("system") or {}).get("hostname", "")
        ngay = time.strftime("%Y-%m-%d", time.gmtime(time.time() + _lech_mui_gio()))
        return gz, f"backup-{host}-{ngay}.tar.gz"
    # Chua co tep Backup that -> cach cu (chi cau truc, noi dung suy rong)
    with open(TEP_BACKUP, encoding="utf-8") as f:
        muc = json.load(f)["tar"]["muc"]
    cay = KHO.doc(KHOA_CAY_UCI) or {}
    tb = io.BytesIO()
    with tarfile.open(fileobj=tb, mode="w", format=tarfile.USTAR_FORMAT) as tf:
        for duong, _co, mode, loai, mtime in muc:
            ti = tarfile.TarInfo(duong)
            ti.mode = int(mode, 8)
            ti.mtime = mtime
            ti.uname = ti.gname = "root"
            du_lieu = b""
            if duong.startswith("etc/config/") and duong[11:] in cay:
                du_lieu = _uci_xuat(cay[duong[11:]])
            if loai == "2":
                ti.type = tarfile.SYMTYPE     # dich lien ket: CHUA DO -> de rong
                tf.addfile(ti)
                continue
            ti.size = len(du_lieu)
            tf.addfile(ti, io.BytesIO(du_lieu))
    raw = tb.getvalue()
    # Dau gzip DO THAT: 1f8b 08 00 00000000 00 03 (mtime 0, XFL 0, OS 3=Unix)
    nen = zlib.compressobj(9, zlib.DEFLATED, -15)
    than = nen.compress(raw) + nen.flush()
    gz = (b"\x1f\x8b\x08\x00\x00\x00\x00\x00\x00\x03" + than
          + (zlib.crc32(raw) & 0xffffffff).to_bytes(4, "little")
          + (len(raw) & 0xffffffff).to_bytes(4, "little"))
    host = ((KHO.doc("data_repo.weboui.system_get") or {}).get("system") or {}).get("hostname", "")
    ngay = time.strftime("%Y-%m-%d", time.gmtime(time.time() + _lech_mui_gio()))
    return gz, f"backup-{host}-{ngay}.tar.gz"


# ---------------------------------------------------------------- HTTP

class H(BaseHTTPRequestHandler):
    server_version = "AX3000CV2-gialap"

    def _gui(self, ma, than, kieu="text/plain; charset=utf-8"):
        self.send_response(ma)
        self.send_header("Content-Type", kieu)
        self.send_header("Content-Length", str(len(than)))
        self.end_headers()
        self.wfile.write(than)

    def _dang_sap(self):
        # DO THAT: trong ~93 s sau reboot trinh duyet chi nhan loi mang (status 0)
        if _pha_reboot() == "sap":
            self.close_connection = True
            return True
        return False

    def do_GET(self):
        if self._dang_sap():
            return
        ten = _ten_tep(self.path)
        p = os.path.join(GOC_WWW, ten)
        if os.path.isfile(p):
            duoi = os.path.splitext(ten)[1].lower()
            with open(p, "rb") as f:
                b = f.read()
            return self._gui(200, b, KIEU_MIME.get(duoi, "application/octet-stream"))
        return self._404()

    def _backup(self):
        """
        POST /cgi-bin/cgi-backup — nut "Generate archive" (form sessionid=<sid>).
        DO THAT 2026-09-25 (hop_dong_backup_nhom8.json): 200, application/x-targz,
        attachment; filename="backup-<hostname>-<YYYY-MM-DD>.tar.gz"; tar 102 muc.
        Anh Huynn chon: ten/header/danh sach tep TRUNG that, NOI DUNG SINH TU KHO
        (chi cac config uci kho co cay day du; tep khac rong) — SUY RONG, ghi ro.
        Phien khong hop le: CHUA DO -> tra 404 (khuon da do).
        """
        from urllib.parse import parse_qs
        n = int(self.headers.get("Content-Length", 0))
        sid = (parse_qs(self.rfile.read(n).decode("utf-8", "replace")).get("sessionid") or [""])[0]
        if not _phien_song(sid):
            # DO THAT 2026-09-26 (hop_dong_nhom13.json): sid sai/rong -> 403 text/plain
            # "Backup permission denied\n" (truoc day tra 404 — suy doan, sai)
            return self._gui_cgi(403, b"Backup permission denied\n", "text/plain")
        b, ten = _tao_backup()
        self._gui_cgi(200, b, "application/x-targz",
                      [("Content-Disposition", f'attachment; filename="{ten}"')])

    def _gui_cgi(self, ma, than, kieu, them=()):
        """
        Tra loi cua cgi-io (cgi-backup/cgi-upload) DO THAT 2026-09-26: HTTP/1.1, Transfer-Encoding:
        chunked (khong Content-Length), Connection: Keep-Alive, Keep-Alive: timeout=20. Thu tu header
        do trinh duyet sap xep nen khong so duoc. Kich thuoc tung khoi chunked: khong do (trinh duyet
        khong thay) — dung khoi 4096 byte. Dong ket noi sau tra loi (khong giu song).
        """
        self.protocol_version = "HTTP/1.1"
        self.send_response(ma)
        for k, v in them:
            self.send_header(k, v)
        self.send_header("Content-Type", kieu)
        self.send_header("Transfer-Encoding", "chunked")
        self.send_header("Connection", "Keep-Alive")
        self.send_header("Keep-Alive", "timeout=20")
        self.end_headers()
        for i in range(0, len(than), 4096):
            k = than[i:i + 4096]
            self.wfile.write(b"%x\r\n" % len(k) + k + b"\r\n")
        self.wfile.write(b"0\r\n\r\n")
        self.close_connection = True

    def _upload(self):
        """
        POST /cgi-bin/cgi-upload (multipart: filename, sessionid, file) — cgi-io. DO THAT:
          sid sai/rong -> 200 {"message":"Upload permission denied","failure":[1,...]} (89 B)
          filename ngoai ACL file (chi /tmp/backup.tar.gz, /tmp/firmware.bin) -> "Access to path denied by ACL" (90 B)
          dung -> {size, checksum(md5), sha256sum} dung dinh dang tab/xuong dong da do.
        Do voi /tmp/backup.tar.gz; /tmp/firmware.bin cung chuong trinh cgi-io (ACL cho ghi) — nhan
        vao /tmp nhu nhau (buoc upgrade_test sau do KHONG mo phong).
        """
        import hashlib
        from email.parser import BytesParser
        n = int(self.headers.get("Content-Length", 0))
        than = self.rfile.read(n)
        msg = BytesParser().parsebytes(b"Content-Type: " + self.headers.get("Content-Type", "").encode()
                                       + b"\r\n\r\n" + than)
        f = {}
        for phan in (msg.get_payload() if msg.is_multipart() else []):
            ten = phan.get_param("name", header="content-disposition")
            f[ten] = phan.get_payload(decode=True) or b""
        sid = (f.get("sessionid") or b"").decode("utf-8", "replace")
        duong = (f.get("filename") or b"").decode("utf-8", "replace")
        if not _phien_song(sid):
            return self._gui_cgi(200, b'{\n\t"message": "Upload permission denied",\n\t"failure": '
                                      b'[ 1, "Operation not permitted" ]\n}\n', "text/plain")
        if duong not in ("/tmp/backup.tar.gz", "/tmp/firmware.bin"):
            return self._gui_cgi(200, b'{\n\t"message": "Access to path denied by ACL",\n\t"failure": '
                                      b'[ 0, "No error information" ]\n}\n', "text/plain")
        tep = f.get("file") or b""
        _TMP[duong] = tep
        tl = ('{\n\t"size": %d,\n\t"checksum": "%s",\n\t"sha256sum": "%s"\n}\n'
              % (len(tep), hashlib.md5(tep).hexdigest(), hashlib.sha256(tep).hexdigest()))
        return self._gui_cgi(200, tl.encode(), "text/plain")

    def _404(self):
        # DO THAT 2026-09-25: duong dan khong ton tai -> uhttpd tra 404 HTML
        # (82 byte cho /khongco_xyz.txt). Truoc day gia lap tra trang SPA 200
        # cho moi duong dan la — SAI. SPA dung hash route nen chi can "/".
        duong = self.path.split("?")[0].split("#")[0]
        than = (f"<h1>Not Found</h1>The requested URL {duong} "
                f"was not found on this server.").encode()
        return self._gui(404, than, "text/html")

    def do_POST(self):
        if self._dang_sap():
            return
        if self.path.split("?")[0] == "/cgi-bin/cgi-backup":
            return self._backup()
        if self.path.split("?")[0] == "/cgi-bin/cgi-upload":
            return self._upload()
        if self.path.split("?")[0] != "/ubus":
            # Truoc 2026-09-25 tra "chi ho tro /ubus" — chuoi TU DAT, khong co tren
            # thiet bi. Nay dung dung khuon 404 da do (do bang GET).
            return self._404()
        n = int(self.headers.get("Content-Length", 0))
        try:
            than = json.loads(self.rfile.read(n) or b"{}")
        except Exception:
            return self._gui(400, b"than khong phai JSON")

        nhieu = isinstance(than, list)
        cac = than if nhieu else [than]
        ra = []
        for t in cac:
            # _xu_ly_ubus tra ve dict co dung mot khoa "result" HOAC "error"
            kq = _xu_ly_ubus_day_du(t)
            mot = {"jsonrpc": "2.0", "id": t.get("id")}
            mot.update(kq)
            ra.append(mot)
        # DO THAT 2026-09-25: rpcd tra JSON GON (khong dau cach sau , va :), vd
        # system_get id 1 = 197 byte fnv cac7e3a5. Truoc day json.dumps mac dinh
        # them dau cach -> lech tung byte voi thiet bi (kiem theo byte: A5).
        # Ky tu >= 0x80: CHUA DO (chon UTF-8 tho, ghi ro trong ISSUES).
        b = json.dumps(ra if nhieu else ra[0], separators=(",", ":"),
                       ensure_ascii=False).encode("utf-8")
        return self._gui(200, b, "application/json")

    def log_message(self, *a):
        pass


def main():
    print("=" * 64)
    print("  GIA LAP AX3000CV2 (OUI Vue SPA, firmware 0.5.3)")
    print("=" * 64)
    print(f"  Mo trinh duyet : http://localhost:{CONG}/")
    print(f"  Dang nhap      : admin / 6455147589")
    print(f"  Tai nguyen tinh: {GOC_WWW}")
    print(f"  Kho cau hinh   : {len(KHO.cac_khoa())} khoa")
    for k in KHO.cac_khoa():
        print(f"      - {k}")
    print("=" * 64)
    # Kho luu tu phien truoc co the co khung *_get cu (truoc nhom 13) -> dung lai tu uci mot lan.
    _dong_bo_khung_tu_uci()
    ThreadingHTTPServer(("0.0.0.0", CONG), H).serve_forever()


if __name__ == "__main__":
    main()
