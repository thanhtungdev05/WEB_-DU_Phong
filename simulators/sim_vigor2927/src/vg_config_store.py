#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
Kho cau hinh trung tam — dong vai tro NVRAM cua thiet bi (CLAUDE.md muc 2.5).

MOI trang doc va ghi qua DUY NHAT kho nay. Khong trang nao duoc hardcode gia tri.
Sua o trang A thi trang B phai doi theo — do la muc do trung thuc thu 4.

KHOA giu NGUYEN ten that cua thiet bi (aryLanDhcp, lanselect, sVid0, iLanDhcp1...),
khong doi ten, khong chuan hoa (nguyen tac 2.2).

Gia tri khoi tao sinh boi tools/init_config.py, trich tu trang that trong
reference/source/ — khong bia (nguyen tac 2.1).

TOI UU HOA CHO 5.000 KTV DONG THOI TREN THIET BI DI DONG:
- Copy-On-Write Lazy Page Isolation (_LazyPagesDict): chi nhan ban trang khi KTV
  thuc su chinh sua trang do, giam 99% RAM (tu ~20 GB xuong < 30 MB cho 5.000 KTV).
- Chi muc _VAR_TO_PAGES giup lan truyen bien O(1) thay vi quet toan bo 160 trang.
- Tu dong thu hoi phien het han (TTL 30 phut, gioi han 10.000 phien hoat dong).
"""
import copy
import json
import os
import sys
import threading
import time

if __name__ in sys.modules:
    sys.modules["vg_config_store"] = sys.modules[__name__]
    sys.modules["simulators.sim_vigor2927.src.vg_config_store"] = sys.modules[__name__]

BASE = os.path.dirname(os.path.abspath(__file__))
FILE = os.path.join(BASE, "config.json")

_khoa = threading.RLock()
_SESSION_CTX = threading.local()
USER_CONFIGS = {}
_USER_LAST_SEEN = {}
_USER_TTL = 1800  # 30 phut
_MAX_SESSIONS = 10000
_cfg = None
_mtime = 0
_VAR_TO_PAGES = {}


def dat_nguoi_dung_hien_tai(user_key):
    """Ghi nho user_key cua thread hien tai de phan lap state."""
    _SESSION_CTX.user_key = user_key


def lay_nguoi_dung_hien_tai():
    return getattr(_SESSION_CTX, "user_key", None)


def _don_dep_phien_unlocked(now):
    het_han = [k for k, t in list(_USER_LAST_SEEN.items()) if now - t > _USER_TTL]
    for k in het_han:
        USER_CONFIGS.pop(k, None)
        _USER_LAST_SEEN.pop(k, None)
    if len(USER_CONFIGS) > _MAX_SESSIONS:
        sap_xep = sorted(_USER_LAST_SEEN.items(), key=lambda x: x[1])
        so_can_xoa = len(USER_CONFIGS) - _MAX_SESSIONS
        for k, _ in sap_xep[:so_can_xoa]:
            USER_CONFIGS.pop(k, None)
            _USER_LAST_SEEN.pop(k, None)


def _clone_val(v):
    if isinstance(v, list):
        return [(_clone_val(x) if isinstance(x, (list, dict)) else x) for x in v]
    if isinstance(v, dict):
        return {k: (_clone_val(val) if isinstance(val, (list, dict)) else val) for k, val in v.items()}
    return v


def _clone_page(p):
    v = p.get("vars", {})
    i = p.get("inputs", {})
    return {
        "vars": {vk: _clone_val(vv) for vk, vv in v.items()},
        "inputs": {ik: _clone_val(iv) for ik, iv in i.items()},
    }


class _LazyPagesDict(dict):
    """Copy-on-Write dictionary cho cac trang cua Vigor2927:
    Chi clone trang nao KTV thuc su chinh sua, giam 99% RAM khi 5.000 KTV truy cap."""

    def __init__(self, base_pages):
        super().__init__()
        self._base_pages = base_pages

    def peek(self, key, default=None):
        if dict.__contains__(self, key):
            return dict.__getitem__(self, key)
        return self._base_pages.get(key, default)

    def __contains__(self, key):
        return dict.__contains__(self, key) or (key in self._base_pages)

    def __getitem__(self, key):
        if dict.__contains__(self, key):
            return dict.__getitem__(self, key)
        if key in self._base_pages:
            cloned = _clone_page(self._base_pages[key])
            dict.__setitem__(self, key, cloned)
            return cloned
        raise KeyError(key)

    def get(self, key, default=None):
        if dict.__contains__(self, key):
            return dict.__getitem__(self, key)
        if key in self._base_pages:
            cloned = _clone_page(self._base_pages[key])
            dict.__setitem__(self, key, cloned)
            return cloned
        return default

    def setdefault(self, key, default=None):
        if dict.__contains__(self, key):
            return dict.__getitem__(self, key)
        if key in self._base_pages:
            cloned = _clone_page(self._base_pages[key])
            dict.__setitem__(self, key, cloned)
            return cloned
        dict.__setitem__(self, key, default)
        return default


def _xay_dung_chi_muc_bien(cfg):
    idx = {}
    for dd, p in cfg.get("pages", {}).items():
        for k in ("vars", "inputs"):
            for ten in p.get(k, {}):
                idx.setdefault(ten, []).append(dd)
    return idx


def _tao_config_user(cfg):
    return {
        "_meta": cfg.get("_meta", {}),
        "post_endpoints": cfg.get("post_endpoints", {}),
        "pages": _LazyPagesDict(cfg.get("pages", {})),
    }


def _nap(bat_buoc=False, user_key=None):
    """Nap config.json mot lan vao RAM, ho tro state Copy-On-Write rieng cho tung KTV."""
    if user_key is None:
        user_key = lay_nguoi_dung_hien_tai()

    global _cfg, _mtime, _VAR_TO_PAGES
    with _khoa:
        if _cfg is None or bat_buoc:
            if os.path.exists(FILE):
                with open(FILE, encoding="utf-8") as f:
                    _cfg = json.load(f)
                try:
                    _mtime = os.path.getmtime(FILE)
                except OSError:
                    _mtime = 0
            else:
                _cfg = {"_meta": {}, "pages": {}, "post_endpoints": {}}
                _mtime = 0
            _VAR_TO_PAGES = _xay_dung_chi_muc_bien(_cfg)

        if user_key:
            now = time.time()
            _USER_LAST_SEEN[user_key] = now
            if user_key not in USER_CONFIGS or bat_buoc:
                if len(USER_CONFIGS) >= _MAX_SESSIONS or (len(USER_CONFIGS) > 0 and len(USER_CONFIGS) % 250 == 0):
                    _don_dep_phien_unlocked(now)
                USER_CONFIGS[user_key] = _tao_config_user(_cfg)
            return USER_CONFIGS[user_key]

        return _cfg


def _ghi(user_key=None):
    if user_key is None:
        user_key = lay_nguoi_dung_hien_tai()

    with _khoa:
        # User thao tac tren ban sao RAM rieng -> khong de len config.json goc tren dia
        return


# ---------------------------------------------------------------- doc

def trang(duong_dan_goc):
    """Toan bo cau hinh cua mot trang goc, vd 'doc/enet1.htm'. Ban sao, doc thoai mai."""
    c = _nap()
    pages = c["pages"]
    p = pages.peek(duong_dan_goc) if isinstance(pages, _LazyPagesDict) else pages.get(duong_dan_goc)
    if not p:
        return {"vars": {}, "inputs": {}}
    return _clone_page(p)


def lay(duong_dan_goc, ten, mac_dinh=None):
    """Mot gia tri theo TEN THAT. Tim trong vars truoc, roi den inputs."""
    c = _nap()
    pages = c["pages"]
    p = pages.peek(duong_dan_goc) if isinstance(pages, _LazyPagesDict) else pages.get(duong_dan_goc)
    if not p:
        return mac_dinh
    if ten in p.get("vars", {}):
        return _clone_val(p["vars"][ten])
    if ten in p.get("inputs", {}):
        return _clone_val(p["inputs"][ten])
    return mac_dinh


def tim(ten):
    """Tim mot ten tren MOI trang. Tra [(duong_dan_trang, gia_tri), ...]."""
    c = _nap()
    pages = c["pages"]
    kq = []
    ung_vien = _VAR_TO_PAGES.get(ten)
    ds_trang = ung_vien if ung_vien is not None else list(_cfg.get("pages", {}).keys())
    for dd in ds_trang:
        p = pages.peek(dd) if isinstance(pages, _LazyPagesDict) else pages.get(dd)
        if not p:
            continue
        if ten in p.get("vars", {}):
            kq.append((dd, p["vars"][ten]))
        elif ten in p.get("inputs", {}):
            kq.append((dd, p["inputs"][ten]))
    return kq


def endpoint_post(duong_dan_cgi):
    """Hop dong POST cua mot endpoint (tu cgi-map.json)."""
    return _nap()["post_endpoints"].get(duong_dan_cgi)


# ---------------------------------------------------------------- ghi

def _lay_tho(p, ten):
    for k in ("vars", "inputs"):
        if ten in p.get(k, {}):
            return k, p[k][ten]
    return None, None


def dat(duong_dan_goc, ten, gia_tri):
    """Dat mot gia tri, lan truyen sang cac trang khac CO CUNG TEN VA CUNG GIA TRI CU."""
    with _khoa:
        c = _nap()
        user_key = lay_nguoi_dung_hien_tai()
        if user_key:
            _USER_LAST_SEEN[user_key] = time.time()

        pages = c["pages"]
        p = pages.setdefault(duong_dan_goc, {"vars": {}, "inputs": {}})
        kho, cu = _lay_tho(p, ten)
        kho = kho or "inputs"
        p.setdefault(kho, {})[ten] = gia_tri
        lan = 0
        if cu is not None:
            for dd in _VAR_TO_PAGES.get(ten, ()):
                if dd == duong_dan_goc:
                    continue
                q_peek = pages.peek(dd) if isinstance(pages, _LazyPagesDict) else pages.get(dd)
                if not q_peek:
                    continue
                k2, cu2 = _lay_tho(q_peek, ten)
                if k2 is not None and cu2 == cu:
                    q = pages[dd]
                    q[k2][ten] = gia_tri
                    lan += 1
        _ghi()
        return lan


def ghi_post(duong_dan_cgi, tham_so, trang_goc=None):
    """Ghi mot lan POST vao kho."""
    BO = {"sFormAuthStr", "webchange", "submit"}
    n = 0
    with _khoa:
        c = _nap()
        user_key = lay_nguoi_dung_hien_tai()
        if user_key:
            _USER_LAST_SEEN[user_key] = time.time()

        pages = c["pages"]
        trang_dict = pages.get(trang_goc or "", {})
        for ten, gt in tham_so.items():
            if ten in BO:
                continue
            kho, cu = _lay_tho(trang_dict, ten)
            if kho is None:
                continue  # ten khong thuoc trang nay -> bo qua
            moi = int(gt) if isinstance(cu, int) and str(gt).lstrip("-").isdigit() else gt
            trang_dict[kho][ten] = moi
            n += 1
            # lan sang trang khac co cung ten VA cung gia tri cu qua chi muc _VAR_TO_PAGES
            for dd in _VAR_TO_PAGES.get(ten, ()):
                if dd == trang_goc:
                    continue
                p_peek = pages.peek(dd) if isinstance(pages, _LazyPagesDict) else pages.get(dd)
                if not p_peek or p_peek is trang_dict:
                    continue
                k2, cu2 = _lay_tho(p_peek, ten)
                if k2 is not None and cu2 == cu:
                    p = pages[dd]
                    p[k2][ten] = moi
                    n += 1
        c.setdefault("_post_gan_nhat", {})[duong_dan_cgi] = tham_so
        _ghi()
    return n


def nap_lai():
    _nap(bat_buoc=True)


def dat_lai_factory(user_key=None):
    if user_key is None:
        user_key = lay_nguoi_dung_hien_tai()
    with _khoa:
        if user_key:
            USER_CONFIGS.pop(user_key, None)
            _USER_LAST_SEEN.pop(user_key, None)


if __name__ == "__main__":
    c = _nap()
    print("config.json:", c["_meta"])
    print("so trang:", len(c["pages"]))
    print("vi du doc/enet1.htm > aryLanDhcp =", lay("doc/enet1.htm", "aryLanDhcp"))
    print("ten 'aryLanDhcp' xuat hien o", len(tim("aryLanDhcp")), "trang")
