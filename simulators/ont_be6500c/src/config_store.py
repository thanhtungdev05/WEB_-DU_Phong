#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
Kho cau hinh trung tam cho ONT-BE6500C (dong vai NVRAM).

39 resource /api/v1/data/* co bang chung THAT, thu truc tiep tren thiet bi
192.168.1.1 ngay 2026-08-11 (xem spec/seed_api.json va src/tao_seed_api.py).
Duong dan nao KHONG nam trong seed thi server tra 501 kem loi nhac ro --
khong bia du lieu (nguyen tac 2.1 cua du an).

GD4 (2026-08-13) -- MO DUONG GHI. Hop dong phan hoi khong con la suy doan:
da do TRUC TIEP tren thiet bi that, xem reference/source/hop_dong_ghi_that.json.
Sau moi phep do deu doc lai xac nhan da hoan tac, thiet bi ve nguyen trang.

Sau dieu do duoc va PHAI ton trong:

  1. PATCH  -> 200, than RONG (0 byte).  KHONG tra ve doi tuong da cap nhat.
  2. POST   -> 200, than {"ids": ["<id moi>"]}.  KHONG tra ve ban ghi.
  3. DELETE -> 200, than RONG.  Than GUI DI la {"ids":[...]}, khong phai mang.
  4. id do THIET BI sinh, dang 'cfg' + chuoi so (vd 'cfg303837').
  5. Thiet bi TU DIEN truong client khong gui (portForwarding: source.
     interfaceId='wan', destination.interfaceId='lan').
  6. Doc va ghi o HAI resource khac nhau: GET 'system/info' nhung PATCH
     'system'. GET thang 'system' thi thiet bi dong ket noi khong tra gi.

Vi (1)(2)(3), cac ham ghi()/xoa()/them() duoi day tra ve gia tri dung de
BAO THANH CONG cho server, con server moi la cho quyet dinh HINH DANG
phan hoi. Xem server.py.
"""
import json
import os
import random
import threading

_BASE = os.path.dirname(os.path.abspath(__file__))
_SEED = os.path.join(_BASE, "..", "spec", "seed_api.json")
# GD "System/User" (2026-08-18): kho RIENG cho kenh RPC /oui-rpc, KHAC voi
# _SEED (chi chua resource REST /api/v1/data/* that). Xem
# spec/seed_user_rpc.json va server.py ham _oui_rpc().
_SEED_RPC = os.path.join(_BASE, "..", "spec", "seed_user_rpc.json")
_STATE_DIR = os.path.join(_BASE, "state")
_STATE_FILE = os.path.join(_STATE_DIR, "state.json")

import copy
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
    with open(_SEED, encoding="utf-8") as f:
        d = dict(json.load(f)["du_lieu"])
    if os.path.exists(_SEED_RPC):
        with open(_SEED_RPC, encoding="utf-8") as f:
            d.update(json.load(f)["du_lieu"])
    return d


def _tai():
    user_key = lay_nguoi_dung_hien_tai()
    global _cache
    if _cache is None:
        os.makedirs(_STATE_DIR, exist_ok=True)
        if os.path.exists(_STATE_FILE):
            try:
                with open(_STATE_FILE, encoding="utf-8") as f:
                    _cache = json.load(f)
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
    """Resource nay co bang chung that khong? (co trong seed, ke ca gia
    tri None -- vi None cung la bang chung: 'khong lay duoc qua GET')."""
    with _lock:
        return resource in _tai()


def danh_sach():
    with _lock:
        return sorted(_tai().keys())


def doc(resource):
    with _lock:
        return _tai().get(resource)


# Truong thiet bi TU DIEN khi tao ban ghi moi, client khong gui len.
# Do truc tiep tren thiet bi that (xem hop_dong_ghi_that.json muc 5).
# CHI khai bao cho resource DA DO. Resource chua do thi khong bia them gi.
TRUONG_THIET_BI_TU_DIEN = {
    "portForwarding/policies": {
        "source": {"interfaceId": "wan"},
        "destination": {"interfaceId": "lan"},
    },
}


# Dinh dang id do THIET BI sinh -- KHAC NHAU tung resource, da do that:
#   portForwarding/policies  -> 'cfg303837'        (cfg + 6 chu so THAP PHAN)
#   staticRouting/policies   -> 'S_route_fd1a0d9d' (S_route_ + 8 hex)
#   dhcp/reservedHosts       -> 'cfg08fe63'         (cfg + 6 ky tu HEX -- suy tu
#                                ban ghi mau co san trong seed_api.json, KHAC
#                                dinh dang thap phan cua portForwarding; xem
#                                spec/pages/advanced__lan.json muc _doc_tay_gd4)
# Resource nao chua do thi dung mau chung 'cfg' + so va GHI RO o ISSUES.
DINH_DANG_ID = {
    "portForwarding/policies": lambda: "cfg%06d" % random.randint(0, 999999),
    "staticRouting/policies": lambda: "S_route_%08x" % random.randint(0, 0xFFFFFFFF),
    "dhcp/reservedHosts": lambda: "cfg%06x" % random.randint(0, 0xFFFFFF),
}


def _id_moi(resource):
    """Sinh id giong dinh dang THIET BI THAT dung. Quan trong vi giao dien
    co the hien id ra man hinh va dung no lam khoa xoa/sua.
    Ban nhap tam cua GD2 dung 'sim-1' -- da bo."""
    ham = DINH_DANG_ID.get(resource)
    if ham:
        return ham()
    return "cfg%06d" % random.randint(0, 999999)


def _hop_nhat_sau(dich, nguon):
    """Hop nhat long nhau: {'source':{'interfaceId':'wan'}} bo sung vao
    dich ma KHONG de len gia tri client da gui."""
    for k, v in nguon.items():
        if isinstance(v, dict):
            con = dich.setdefault(k, {})
            if isinstance(con, dict):
                _hop_nhat_sau(con, v)
        else:
            dich.setdefault(k, v)


# Khoa dinh danh cua phan tu trong mang. Thu theo thu tu nay.
KHOA_DINH_DANH = ("id", "type")


def _khoa_cua(ds):
    """Mang cac object deu co chung mot khoa dinh danh thi tra ve khoa do."""
    if not isinstance(ds, list) or not ds:
        return None
    if not all(isinstance(x, dict) for x in ds):
        return None
    for k in KHOA_DINH_DANH:
        if all(k in x for x in ds):
            return k
    return None


def _gop_mang_theo_khoa(hien, moi, khoa):
    """Gop mang theo khoa dinh danh: phan tu nao co trong `moi` thi CAP NHAT
    (giu cac truong `moi` khong nhac toi), phan tu nao khong nhac toi thi
    GIU NGUYEN, phan tu la thi them vao cuoi."""
    theo = {}
    thu_tu = []
    for x in hien:
        theo[x[khoa]] = dict(x)
        thu_tu.append(x[khoa])
    for x in moi:
        if not isinstance(x, dict) or khoa not in x:
            continue
        k = x[khoa]
        if k in theo:
            _gop_sau(theo[k], x)
        else:
            theo[k] = dict(x)
            thu_tu.append(k)
    return [theo[k] for k in thu_tu]


def _gop_sau(hien, moi):
    """Gop LONG NHAU mot object. Gap mang cac object co khoa dinh danh thi
    gop theo khoa thay vi thay ca mang.

    VI SAO CAN: trang Wi-Fi General luu bang cach PATCH 'easyMesh' voi
    ssidTypesConfigurations chi chua DUNG MOT loai (loai cua tab dang mo).
    Neu thay ca mang thi ba loai con lai bien mat, va cac khoa khac cua
    chinh loai do (uiConfigurable, mloEnabled, isBackhaul, isolated) cung
    mat theo -> lan sau mo trang se khong con tab nao.

    Da bat duoc dung loi nay khi kiem bang mat 2026-08-13.
    """
    for k, v in moi.items():
        cu = hien.get(k)
        if isinstance(cu, dict) and isinstance(v, dict):
            _gop_sau(cu, v)
        elif isinstance(cu, list) and isinstance(v, list):
            khoa = _khoa_cua(cu)
            if khoa and _khoa_cua(v) == khoa:
                hien[k] = _gop_mang_theo_khoa(cu, v, khoa)
            else:
                hien[k] = v
        else:
            hien[k] = v


def _dong_bo_noi_bo(d):
    """Mo phong cac he qua NOI BO cua firmware -- thu KHONG di qua HTTP.

    ================ GUEST WI-FI  ->  GUEST LAN INTERFACE ================
    Bang chung: reference/har/advanced__lan_guest_bat.har (2026-08-18).
    Doc ky dong thoi gian cua ca 100 request trong file:

      03:12:07.489  PATCH /api/v1/data/ssids     (bat SSID type=Guest)
      03:12:07.522  PATCH /api/v1/data/easyMesh  ({type:Guest,separatedSsid:true})
      03:12:20.673  GET   /api/v1/data/interfaces/configurations
                          -> ban ghi id='guest' DA CO enabled=true

    Trong TOAN BO file: **0 request ghi nao** toi interfaces/configurations
    (da loc PATCH/POST/PUT/DELETE, dem duoc 0). Truoc do seed ngay
    2026-08-11 co guest.enabled=false va ban chup advanced__lan__t0/__t1
    khong he co tab thu 3 -- xac nhan gia tri that su da doi tu false sang
    true trong khoang nay.

    => Ket luan: chinh FIRMWARE tu bat interface 'guest', khong phai trinh
    duyet goi len. Muon ban gia lap trung thuc o muc 4 thi kho cau hinh
    phai TU LAM viec do, dung nhu thiet bi that.

    -------- GIOI HAN CUA BANG CHUNG, ghi ro chu khong lam lo --------
    (a) Hai PATCH xay ra CACH NHAU 33 mili giay nen KHONG TACH duoc dieu
        kien nao moi la quyet dinh: chi can SSID Guest bat, hay phai co
        CA separatedSsid=true? O day chon dieu kien CHAT (VA ca hai) vi no
        khop DUNG trang thai da chung kien. Chon dieu kien long hon (chi
        can SSID) se la suy rong hon bang chung.
    (b) CHIEU TAT -- DA XAC NHAN 2026-08-18 truc tiep tren thiet bi that
        (anh Huynn thao tac, khong qua HAR): tat cong tac Enable o
        Wi-Fi > General > tab Guest, bam Save -> vao Advanced > LAN,
        tab "Guest LAN" BIEN MAT. Doi xung dung nhu ma da viet, khong
        con la suy dien. Da xoa dong "cho xac nhan" trong ISSUES.md.
    """
    ifaces = d.get("interfaces/configurations")
    ssids = d.get("ssids")
    mesh = d.get("easyMesh")
    if not isinstance(ifaces, list) or not isinstance(ssids, list):
        return
    if not isinstance(mesh, dict):
        return

    guest_wifi_bat = any(
        isinstance(s, dict) and s.get("type") == "Guest" and s.get("enabled")
        for s in ssids)
    guest_tach = any(
        isinstance(c, dict) and c.get("type") == "Guest" and c.get("separatedSsid")
        for c in (mesh.get("ssidTypesConfigurations") or []))

    nen_bat = bool(guest_wifi_bat and guest_tach)
    for b in ifaces:
        if isinstance(b, dict) and b.get("usage") == "Guest":
            b["enabled"] = nen_bat


def ghi(resource, du_lieu_moi):
    """PATCH. Tra True neu ghi duoc, None neu resource khong co trong kho.

    KHONG tra ve du lieu -- thiet bi that tra than RONG (do duoc, xem
    hop_dong_ghi_that.json muc 1). Tra du lieu ve la sai hop dong.
    """
    with _lock:
        d = _tai()
        if resource not in d:
            return None
        hien = d[resource]
        if isinstance(hien, list) and isinstance(du_lieu_moi, list):
            khoa = _khoa_cua(hien)
            if khoa and _khoa_cua(du_lieu_moi) == khoa:
                d[resource] = _gop_mang_theo_khoa(hien, du_lieu_moi, khoa)
            else:
                d[resource] = du_lieu_moi
        elif isinstance(hien, dict) and isinstance(du_lieu_moi, dict):
            _gop_sau(hien, du_lieu_moi)
        else:
            d[resource] = du_lieu_moi
        # He qua noi bo cua firmware (khong di qua HTTP) -- xem ham.
        _dong_bo_noi_bo(d)
        _luu()
        return True


def xoa(resource, du_lieu):
    """DELETE. Than gui len la {"ids": [...]} (do duoc tren thiet bi that),
    KHONG phai mang doi tuong. Van chap nhan ca hai dang cho chac.
    Tra True neu xoa duoc, None neu resource khong phai danh sach."""
    with _lock:
        d = _tai()
        if resource not in d or not isinstance(d[resource], list):
            return None
        can_xoa = set()
        if isinstance(du_lieu, dict):
            for i in du_lieu.get("ids", []):
                can_xoa.add(i)
        for x in (du_lieu if isinstance(du_lieu, list) else []):
            if isinstance(x, dict) and "id" in x:
                can_xoa.add(x["id"])
            elif isinstance(x, str):
                can_xoa.add(x)
        d[resource] = [b for b in d[resource]
                       if not (isinstance(b, dict) and b.get("id") in can_xoa)]
        _luu()
        return True


def them(resource, du_lieu):
    """POST. Tra DANH SACH ID vua sinh -- vi thiet bi that tra
    {"ids": [...]} (do duoc, xem hop_dong_ghi_that.json muc 2).
    Tra None neu resource khong phai danh sach."""
    with _lock:
        d = _tai()
        if resource not in d or not isinstance(d[resource], list):
            return None
        moi = du_lieu if isinstance(du_lieu, list) else [du_lieu]
        bo_sung = TRUONG_THIET_BI_TU_DIEN.get(resource)
        ids = []
        for b in moi:
            if not isinstance(b, dict):
                continue
            b = dict(b)
            if bo_sung:
                _hop_nhat_sau(b, bo_sung)
            b.setdefault("id", _id_moi(resource))
            d[resource].append(b)
            ids.append(b["id"])
        _luu()
        return ids


def dat_lai_factory():
    """Xoa state, quay ve dung seed that (dung cho test tay)."""
    global _cache
    user_key = lay_nguoi_dung_hien_tai()
    with _lock:
        if user_key and user_key in _USER_CACHES:
            _USER_CACHES[user_key] = copy.deepcopy(_seed())
            return _USER_CACHES[user_key]
        _cache = _seed()
        _luu()
        return _cache
