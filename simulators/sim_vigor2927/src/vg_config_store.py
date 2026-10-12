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
"""
import json, os, threading, copy

BASE = os.path.dirname(os.path.abspath(__file__))
FILE = os.path.join(BASE, "config.json")

_khoa = threading.RLock()
_SESSION_CTX = threading.local()
USER_CONFIGS = {}
_cfg = None
_mtime = 0


def dat_nguoi_dung_hien_tai(user_key):
    """Ghi nho user_key cua thread hien tai de phan lap state."""
    _SESSION_CTX.user_key = user_key


def lay_nguoi_dung_hien_tai():
    return getattr(_SESSION_CTX, "user_key", None)


def _nap(bat_buoc=False, user_key=None):
    """Nap config.json, ho tro state rieng cho tung user/phien."""
    if user_key is None:
        user_key = lay_nguoi_dung_hien_tai()

    global _cfg, _mtime
    with _khoa:
        try:
            mt = os.path.getmtime(FILE)
        except OSError:
            mt = 0
        if _cfg is None or bat_buoc or mt != _mtime:
            if os.path.exists(FILE):
                with open(FILE, encoding="utf-8") as f:
                    _cfg = json.load(f)
            else:
                _cfg = {"_meta": {}, "pages": {}, "post_endpoints": {}}
            _mtime = mt

        if user_key:
            if user_key not in USER_CONFIGS or bat_buoc:
                USER_CONFIGS[user_key] = copy.deepcopy(_cfg)
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
    return copy.deepcopy(c["pages"].get(duong_dan_goc, {"vars": {}, "inputs": {}}))


def lay(duong_dan_goc, ten, mac_dinh=None):
    """Mot gia tri theo TEN THAT. Tim trong vars truoc, roi den inputs."""
    p = _nap()["pages"].get(duong_dan_goc)
    if not p:
        return mac_dinh
    if ten in p.get("vars", {}):
        return copy.deepcopy(p["vars"][ten])
    if ten in p.get("inputs", {}):
        return copy.deepcopy(p["inputs"][ten])
    return mac_dinh


def tim(ten):
    """Tim mot ten tren MOI trang. Tra [(duong_dan_trang, gia_tri), ...].

    Dung de kiem tra tinh nhat quan: cung mot ten xuat hien o nhieu trang thi
    phai cung gia tri — day la co so cua muc do 4.
    """
    kq = []
    for dd, p in _nap()["pages"].items():
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
    """Dat mot gia tri, lan truyen sang cac trang khac CO CUNG TEN VA CUNG GIA TRI CU.

    Vi sao phai cung gia tri cu: mot so ten khong phai cau hinh NVRAM ma la bien
    cuc bo cua trang — ro nhat la `myUrl` (duong dan trang chi tiet), moi trang
    mot gia tri khac han:
        doc/XLoCf1.HTM -> /doc/XLoCfMn.htm
        doc/snmp.htm   -> /cgi-bin/snmp.cgi?...
    Lan truyen mu quang se GHI DE va lam hong dieu huong cua trang khac.
    Nguoc lai, ten dung chung that su (sPresetModel='2927' o 19 trang,
    sLTEmodulename='LTE' o 29 trang) deu co cung gia tri cu -> lan truyen dung.
    """
    with _khoa:
        c = _nap()
        p = c["pages"].setdefault(duong_dan_goc, {"vars": {}, "inputs": {}})
        kho, cu = _lay_tho(p, ten)
        kho = kho or "inputs"
        p.setdefault(kho, {})[ten] = gia_tri
        lan = 0
        for dd, q in c["pages"].items():
            if dd == duong_dan_goc:
                continue
            k2, cu2 = _lay_tho(q, ten)
            if k2 is not None and cu is not None and cu2 == cu:
                q[k2][ten] = gia_tri
                lan += 1
        _ghi()
        return lan


def ghi_post(duong_dan_cgi, tham_so, trang_goc=None):
    """Ghi mot lan POST vao kho.

    tham_so: dict {ten_that: gia_tri} lay nguyen tu form, DA bo sFormAuthStr.
    trang_goc: trang dich cua POST — chi ghi cac ten THUOC trang do, roi lan tiep.
    Tra ve so gia tri thuc su duoc ghi vao cac trang.
    """
    BO = {"sFormAuthStr", "webchange", "submit"}
    n = 0
    with _khoa:
        c = _nap()
        trang = c["pages"].get(trang_goc or "", {})
        for ten, gt in tham_so.items():
            if ten in BO:
                continue
            kho, cu = _lay_tho(trang, ten)
            if kho is None:
                continue                      # ten khong thuoc trang nay -> bo qua
            moi = int(gt) if isinstance(cu, int) and str(gt).lstrip("-").isdigit() else gt
            trang[kho][ten] = moi
            n += 1
            # lan sang trang khac co cung ten VA cung gia tri cu (xem giai thich o dat())
            for dd, p in c["pages"].items():
                if p is trang:
                    continue
                k2, cu2 = _lay_tho(p, ten)
                if k2 is not None and cu2 == cu:
                    p[k2][ten] = moi
                    n += 1
        # Luu nguyen ban lan POST gan nhat de doi chieu khi go loi
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



if __name__ == "__main__":
    c = _nap()
    print("config.json:", c["_meta"])
    print("so trang:", len(c["pages"]))
    print("vi du doc/enet1.htm > aryLanDhcp =", lay("doc/enet1.htm", "aryLanDhcp"))
    print("ten 'aryLanDhcp' xuat hien o", len(tim("aryLanDhcp")), "trang")
