#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
Kho cau hinh trung tam cho BE6500C (dong vai NVRAM).

Pham vi: 27 resource /api/v1/data/* da co bang chung THAT, thu truc tiep
tren thiet bi 192.168.1.1 ngay 2026-08-10 (xem spec/seed_api.json va
src/tao_seed_api.py). Duong dan nao KHONG nam trong seed thi server tra
501 kem loi nhac ro rang -- khong bia du lieu (nguyen tac 2.1 cua du an).

Ghi (PATCH): dinh dang da xac nhan tu HAR that
(reference/har/wifi_general_apply.har) cho 'ssids' -- client gui NGUYEN
mang cac ban ghi cung nhom, ghep theo 'id'. Cac resource dang MANG khac
dung chung quy tac ghep theo 'id' neu phan tu co 'id'; resource dang
OBJECT thi merge nong theo khoa. Day la SUY LUAN HOP LY tu 1 mau HAR duy
nhat, CHUA duoc xac nhan rieng cho tung resource -- xem ISSUES.md.
"""
import json
import os
import copy
import threading
import time

_BASE = os.path.dirname(os.path.abspath(__file__))
_SEED = os.path.join(_BASE, "..", "spec", "seed_api.json")
_SEED_CU = os.path.join(_BASE, "..", "spec", "seed_wifi.json")
_STATE_DIR = os.path.join(_BASE, "state")
_STATE_FILE = os.path.join(_STATE_DIR, "state.json")

_lock = threading.Lock()
_SESSION_CTX = threading.local()
_USER_CACHES = {}
_cache = None


def dat_nguoi_dung_hien_tai(user_key):
    """Ghi nho user_key cua thread hien tai de phan lap state."""
    _SESSION_CTX.user_key = user_key


def lay_nguoi_dung_hien_tai():
    return getattr(_SESSION_CTX, "user_key", None)


def _seed():
    """Doc gia tri khoi tao that. Uu tien seed_api.json (day du 27
    resource); neu chua co thi lui ve seed_wifi.json (ban cu, 2 resource)."""
    if os.path.exists(_SEED):
        with open(_SEED, encoding="utf-8") as f:
            return dict(json.load(f)["du_lieu"])
    with open(_SEED_CU, encoding="utf-8") as f:
        d = json.load(f)
    return {"ssids": d["ssids"], "easyMesh": d["easyMesh"]}


def _tai():
    user_key = lay_nguoi_dung_hien_tai()
    global _cache
    if _cache is None:
        os.makedirs(_STATE_DIR, exist_ok=True)
        if os.path.exists(_STATE_FILE):
            try:
                with open(_STATE_FILE, encoding="utf-8") as f:
                    _cache = json.load(f)
                # bo sung resource moi co trong seed ma state cu chua co
                for k, v in _seed().items():
                    _cache.setdefault(k, v)
            except Exception:
                _cache = _seed()
        else:
            _cache = _seed()
            _luu()

    if user_key:
        if user_key not in _USER_CACHES:
            _USER_CACHES[user_key] = copy.deepcopy(_cache)
        return _USER_CACHES[user_key]

    return _cache


def _luu():
    user_key = lay_nguoi_dung_hien_tai()
    if user_key and user_key in _USER_CACHES:
        return
    with open(_STATE_FILE, "w", encoding="utf-8") as f:
        json.dump(_cache, f, ensure_ascii=False, indent=1)


def co(resource):
    """Resource nay co bang chung that khong?"""
    with _lock:
        return resource in _tai()


def danh_sach():
    with _lock:
        return sorted(_tai().keys())


def doc(resource):
    """Doc mot resource. Rieng 'ext/logpull' la HANH DONG co thoi gian nen
    tra trang thai tinh theo thoi diem bat dau -- xem phan cuoi file."""
    with _lock:
        d = _tai()
        if resource == "ext/logpull":
            return _logpull_hien_tai(d.get(resource))
        return d.get(resource)


def ghi(resource, du_lieu_moi):
    """PATCH tong quat. Tra ve gia tri sau khi ghi, hoac None neu resource
    khong co bang chung."""
    with _lock:
        d = _tai()
        if resource not in d:
            return None
        hien = d[resource]

        if isinstance(hien, list) and isinstance(du_lieu_moi, list):
            if hien and isinstance(hien[0], dict) and "id" in hien[0]:
                theo_id = {x["id"]: x for x in hien if isinstance(x, dict) and "id" in x}
                them = []
                for moi in du_lieu_moi:
                    mid = moi.get("id") if isinstance(moi, dict) else None
                    if mid in theo_id:
                        theo_id[mid].update(moi)
                    else:
                        them.append(moi)
                d[resource] = list(theo_id.values()) + them
            else:
                d[resource] = du_lieu_moi
        elif isinstance(hien, dict) and isinstance(du_lieu_moi, dict):
            hien.update(du_lieu_moi)
        else:
            d[resource] = du_lieu_moi

        _luu()
        return d[resource]


# ---- giu tuong thich voi ma cu (wifi_api.js goi qua server.py) ----

def ghi_ssids(mang_moi):
    return ghi("ssids", mang_moi)


def ghi_easymesh(du_lieu_moi):
    return ghi("easyMesh", du_lieu_moi)


# ---- ext/logpull: hanh dong co THOI GIAN, khong phai du lieu tinh ----
#
# Ma goc (reference/source/assets_goc/index-DrfuHisf.js) doc 2 truong:
#   status=2001, hoac status=0 va logFile rong  -> DANG CHAY
#   status=0 va logFile co ten                  -> XONG
#   status=2002                                 -> LOI
# Sau khi bam nut, app hoi lai moi 2 giay (refreshInterval 2000).
#
# Ten file THAT lay tu thiet bi (reference/source/logpull_sau_khi_chay.json):
#   logcollection-04D6888D525F_FPTT25C0CADD_20260811_141735.en
#   = logcollection-<serialNumber>_<ma rieng>_<YYYYMMDD>_<HHMMSS>.en
# Phan <ma rieng> chua ro y nghia nen GIU NGUYEN tu bang chung, khong bia.
_LOGPULL_GIAY = 6          # gia lap thoi gian thu thap
_logpull_bat_dau = None


def bat_dau_logpull():
    """POST /api/v1/data/ext/logpull -- bat dau thu thap."""
    global _logpull_bat_dau
    with _lock:
        _logpull_bat_dau = time.time()
        d = _tai()
        d["ext/logpull"] = {"status": 2001, "logFile": ""}
        _luu()
        return d["ext/logpull"]


def _logpull_hien_tai(goc):
    """Tra trang thai ext/logpull theo thoi gian da troi."""
    if _logpull_bat_dau is None:
        return goc
    con = time.time() - _logpull_bat_dau
    if con < _LOGPULL_GIAY:
        return {"status": 2001, "logFile": ""}
    d = _tai()
    serial = (d.get("system/info") or {}).get("serialNumber", "UNKNOWN")
    t = time.localtime()
    ten = "logcollection-%s_FPTT25C0CADD_%s.en" % (
        serial, time.strftime("%Y%m%d_%H%M%S", t))
    return {"status": 0, "logFile": ten}


def xoa(resource, du_lieu):
    """DELETE -- ma goc co 8 resource ho tro (portForwarding/policies,
    staticRouting/policies, ext/parentalControl/policies, dhcp/reservedHosts,
    eapProfiles, access/http|ssh/connections, publicLan/*). Chung deu la
    danh sach ban ghi co 'id'.

    Chap nhan ca hai dang body: mang id ["pf1","pf2"] hoac mang ban ghi
    [{"id":"pf1"}, ...] -- chua co HAR xac nhan dang nao, nen nhan ca hai
    cho chac. Tra ve danh sach con lai, hoac None neu resource khong co.
    """
    with _lock:
        d = _tai()
        if resource not in d or not isinstance(d[resource], list):
            return None
        can_xoa = set()
        for x in (du_lieu or []):
            if isinstance(x, dict) and "id" in x:
                can_xoa.add(x["id"])
            elif isinstance(x, str):
                can_xoa.add(x)
        d[resource] = [b for b in d[resource]
                       if not (isinstance(b, dict) and b.get("id") in can_xoa)]
        _luu()
        return d[resource]


def them(resource, du_lieu):
    """POST -- them ban ghi moi vao danh sach. Neu ban ghi chua co 'id' thi
    tu sinh mot id de kho van nhat quan (thiet bi that tu sinh id, hinh dang
    id chua co bang chung nen dung tien to 'sim-')."""
    with _lock:
        d = _tai()
        if resource not in d or not isinstance(d[resource], list):
            return None
        moi = du_lieu if isinstance(du_lieu, list) else [du_lieu]
        for b in moi:
            if isinstance(b, dict):
                b.setdefault("id", "sim-%d" % (len(d[resource]) + 1))
                d[resource].append(b)
        _luu()
        return d[resource]


def dat_lai_factory():
    """Xoa state, quay ve dung seed that (dung cho test tay)."""
    global _cache
    user_key = lay_nguoi_dung_hien_tai()
    with _lock:
        if user_key:
            _USER_CACHES[user_key] = copy.deepcopy(_seed())
            return _USER_CACHES[user_key]
        _cache = _seed()
        _luu()
        return _cache
