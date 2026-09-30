#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
KHO CAU HINH TRUNG TAM — AX3000CV2 (OS 0.5.3)
==============================================

Dong vai NVRAM cua thiet bi. MOI trang doc/ghi qua day, khong trang nao
duoc giu gia tri rieng (CLAUDE.md muc 2.5 — vi pham la loi nghiem trong
nhat cua du an).

NGUON GOC CUA MOI GIA TRI MAC DINH TRONG FILE NAY:
    reference/api/khung_that_7_bai_lab.json
tuc khung JSON THAT do duoc tu thiet bi that 192.168.100.1 ngay 2026-09-22
bang cach goi /ubus voi sid that. Khong co gia tri nao tu nghi ra.

Trang thai nguoi dung sua duoc luu ra `cau_hinh.json` de song qua khoi
dong lai — giong thiet bi that.
"""
import json
import os
import threading
import time

_HERE = os.path.dirname(os.path.abspath(__file__))
TEP_LUU = os.path.join(_HERE, "cau_hinh.json")
TEP_GOC = os.path.join(_HERE, "..", "reference", "api", "khung_that_7_bai_lab.json")
THU_MUC_BACKUP = os.path.join(_HERE, "..", "reference", "backup")
KHOA_CAY_UCI = "uci.cay_cau_hinh"

import sys  # noqa: E402
sys.path.insert(0, os.path.join(_HERE, "..", "..", "..", "shared", "python"))
import ax3000c_uci as _uci  # noqa: E402

_BACKUP_CACHE = {}


def doc_backup_that():
    """
    Tep Backup THAT (anh Huynn tai tu thiet bi 2026-09-25, Generate archive) trong
    reference/backup/ — nhan dien bang dau gzip, khong phu thuoc ten tep.
    Tra ve {"gz": bytes, "tar": bytes, "muc": [{ten, dau(512 byte), noi_dung, mtime, loai}]}
    hoac None neu chua co tep.
    """
    if "v" in _BACKUP_CACHE:
        return _BACKUP_CACHE["v"]
    import gzip
    ra = None
    if os.path.isdir(THU_MUC_BACKUP):
        for ten in sorted(os.listdir(THU_MUC_BACKUP), key=lambda t: (not t.endswith(".tar.gz"), t)):
            p = os.path.join(THU_MUC_BACKUP, ten)
            with open(p, "rb") as f:
                gz = f.read()
            if gz[:2] != b"\x1f\x8b":
                continue
            tar = gzip.decompress(gz)
            muc, o = [], 0
            while o + 512 <= len(tar) and tar[o]:
                dau = tar[o:o + 512]
                ten_m = dau[:100].rstrip(b"\0").decode("utf-8")
                co = int(dau[124:136].rstrip(b"\0 ") or b"0", 8)
                muc.append({"ten": ten_m, "dau": dau, "noi_dung": tar[o + 512:o + 512 + co],
                            "mtime": int(dau[136:148].rstrip(b"\0 "), 8),
                            "loai": chr(dau[156]) if dau[156] else "0"})
                o += 512 + (co + 511) // 512 * 512
            ra = {"gz": gz, "tar": tar, "muc": muc, "tep": ten}
            break
    _BACKUP_CACHE["v"] = ra
    return ra


def cay_uci_tu_backup():
    """
    {config: cay 'uci get'} dung tu cac tep etc/config/* trong Backup that
    (shared/python/uci.py — quy tac dat ten section da kiem khop 5/5 config do bang
    uci get). Bo qua tep khong phai cu phap uci (pppoe, rtty, openssl rong...) -> cay rong.
    """
    bk = doc_backup_that()
    ra = {}
    for m in (bk or {}).get("muc", []):
        if m["ten"].startswith("etc/config/") and m["loai"] == "0":
            # Tep khong phai cu phap uci (vd rtty) -> cay rong: thiet bi tra
            # {"values":{}} cho config duoc phep doc (do that: rtty).
            ds = _uci.doc(m["noi_dung"].decode("utf-8", "surrogateescape"))
            ra[m["ten"][11:]] = _uci.thanh_cay(ds)
    return ra


def _nap_khung_goc():
    """
    Doc khung THAT tu reference/ lam gia tri xuat phat.

    Co tinh KHONG hardcode lai o day: neu sau nay thu duoc khung moi tu
    thiet bi, chi can thay tep reference la kho doi theo — khong phai sua ma.

    Nap TAT CA tep khung_that_*.json trong reference/api/ chu khong chi mot:
    ban dau chi nap khung cua 7 bai lab, mo ban gia lap len thi trang Home
    bao "No Data" va footer trong — vi thieu webinfo.system / system.board /
    webinfo.devices. Nay gom het lai, them tep moi la tu dong duoc nap.
    """
    ra = {}
    thu_muc = os.path.dirname(TEP_GOC)
    # Nap ban quet rong TRUOC, cac tep khung_that_* chuyen de nap SAU de de len:
    # tep chuyen de duoc thu ky hon cho tung trang, uu tien cao hon.
    thu_tu = sorted(os.listdir(thu_muc), key=lambda t: (t.startswith("khung_that_"), t))
    for ten in thu_tu:
        # quet_doc_59_api.json: 52 khung DOC thu duoc bang cach goi thang
        # tung loi goi /ubus rut ra tu bundle (xem ISSUES 2026-09-22).
        # hop_dong_ghi_*.json: cac nhanh cau hinh MOI chi lo ra khi doc lai sau
        # mot lan Apply that (do co su dong y cua anh Huynn, 2026-09-24).
        if ten != "quet_doc_59_api.json" and not (
                (ten.startswith("khung_that_") or ten.startswith("hop_dong_ghi_"))
                and ten.endswith(".json")):
            continue
        with open(os.path.join(thu_muc, ten), encoding="utf-8") as f:
            d = json.load(f)
        for khoa, kq in d.get("khung", {}).items():
            # kq co dang [ma_loi, du_lieu]; chi lay khi ma_loi == 0
            if isinstance(kq, list) and len(kq) > 1 and kq[0] == 0:
                # Cung mot khoa xuat hien o NHIEU tep (vi du cay cigext: tep WAN
                # va tep LAN moi tep do mot nhanh) -> GOP SAU, khong ghi de.
                # Ghi de thi tep nap sau xoa sach nhanh cua tep nap truoc.
                if isinstance(ra.get(khoa), dict) and isinstance(kq[1], dict):
                    ra[khoa] = _tron_sau(ra[khoa], kq[1])
                else:
                    ra[khoa] = kq[1]
    # 2026-09-25: cac config uci con lai lay tu tep Backup THAT (reference/backup).
    # Config da co khung "uci get" do truc tiep (ddns, system, upnpd, 2 Timer) GIU
    # khung do (la trang thai goc truoc cac lan do; Backup chup SAU nen co dau vet).
    cay = ra.setdefault(KHOA_CAY_UCI, {})
    for cfg, c in cay_uci_tu_backup().items():
        cay.setdefault(cfg, c)
    # 2026-09-26: moi khung *_get la ham cua tep uci (do that — uci_doc_nguoc.py, UR1). Khung
    # goc gom tu nhieu lan do khac thoi diem (vd dmz_get dest_ip '' do TRUOC nhom 2, trong khi
    # tep firewall trong Backup da co dest_ip .109 — thiet bi luc chup Backup tra .109) ->
    # dung lai tu cay uci cho nhat quan.
    import ax3000c_uci_doc_nguoc as _N
    for khoa, moi in _N.khung_tu_uci(cay, ra.get).items():
        ra[khoa] = moi
    return ra


class KhoCauHinh:
    """
    Kho duy nhat. Khoa = 'doi_tuong.ham_get' dung y het ten API that,
    vi du 'data_repo.weboui.wan_get'. Lam vay thi khong phai dich ten,
    va khi doc ma nguon se thay ngay khoa nao ung voi loi goi nao.
    """

    def __init__(self, tu_dia=True, goc=None):
        self._khoa = threading.RLock()
        self._tu_dia = bool(tu_dia)
        self._goc = goc if goc is not None else _nap_khung_goc()
        # Các giá trị gốc chỉ được đọc qua doc(), luôn trả về bản sao sâu. Dùng
        # shallow copy ở cấp khóa giúp hàng nghìn KTV chia sẻ dữ liệu firmware
        # bất biến và chỉ tốn RAM cho những khóa họ thực sự thay đổi.
        self._du_lieu = dict(self._goc)
        if self._tu_dia:
            self._nap()

    # ---- doc/ghi ----------------------------------------------------

    def doc(self, khoa):
        with self._khoa:
            v = self._du_lieu.get(khoa)
            return json.loads(json.dumps(v)) if v is not None else None

    def ghi(self, khoa, gia_tri):
        """Ghi de toan bo gia tri cua mot khoa, roi luu xuong dia."""
        with self._khoa:
            self._du_lieu[khoa] = json.loads(json.dumps(gia_tri))
            self._luu()

    def gop(self, khoa, phan):
        """
        Tron `phan` vao gia tri dang co (gop sau, theo tung cap).

        Dung cho cac loi goi *_set chi gui phan thay doi. Thiet bi that
        cung xu su vay — khong xoa truong khong duoc nhac toi.
        """
        with self._khoa:
            hien = self._du_lieu.get(khoa)
            if isinstance(hien, dict) and isinstance(phan, dict):
                self._du_lieu[khoa] = _tron_sau(hien, phan)
            else:
                self._du_lieu[khoa] = json.loads(json.dumps(phan))
            self._luu()
            return self.doc(khoa)

    def dat_lai(self):
        """Ve lai dung khung that ban dau (dung cho phep kiem)."""
        with self._khoa:
            self._du_lieu = dict(self._goc)
            self._luu()

    def cac_khoa(self):
        with self._khoa:
            return sorted(self._du_lieu.keys())

    # ---- luu xuong dia ----------------------------------------------

    def _luu(self):
        if not self._tu_dia:
            return
        try:
            with open(TEP_LUU, "w", encoding="utf-8") as f:
                json.dump(self._du_lieu, f, ensure_ascii=False, indent=1)
        except Exception:
            pass  # kho luu khong duoc thi van chay tiep, chi mat tinh ben

    def _nap(self):
        if not self._tu_dia:
            return
        if not os.path.exists(TEP_LUU):
            return
        try:
            with open(TEP_LUU, encoding="utf-8") as f:
                luu = json.load(f)
            if isinstance(luu, dict):
                self._du_lieu.update(luu)
        except Exception:
            pass
        # Kho luu tu truoc khi co tep Backup that chi co 5 config uci -> bo sung
        # cac config con thieu tu goc (khong dung vao config nguoi dung da sua).
        cay = self._du_lieu.get(KHOA_CAY_UCI)
        if isinstance(cay, dict):
            for cfg, c in self._goc.get(KHOA_CAY_UCI, {}).items():
                cay.setdefault(cfg, json.loads(json.dumps(c)))


def _tron_sau(a, b):
    """Tron b vao a theo tung cap, tra ve dict moi."""
    ra = json.loads(json.dumps(a))
    for k, v in b.items():
        if isinstance(v, dict) and isinstance(ra.get(k), dict):
            ra[k] = _tron_sau(ra[k], v)
        else:
            ra[k] = json.loads(json.dumps(v))
    return ra


_KHO_LOCK = threading.RLock()
_KHO_THEO_KTV = {}
_KHO_LAST_SEEN = {}
_KHO_CONTEXT = threading.local()
_KHO_TTL_SECONDS = 6 * 60 * 60
_KHO_GOC = KhoCauHinh(tu_dia=False)


def _kho_cua_ktv(key):
    """Lấy kho cấu hình RAM riêng của một phiên Portal và dọn phiên quá hạn."""
    now = time.time()
    with _KHO_LOCK:
        stale = [session_key for session_key, seen_at in _KHO_LAST_SEEN.items()
                 if now - seen_at > _KHO_TTL_SECONDS]
        for session_key in stale:
            _KHO_THEO_KTV.pop(session_key, None)
            _KHO_LAST_SEEN.pop(session_key, None)
        if key not in _KHO_THEO_KTV:
            _KHO_THEO_KTV[key] = KhoCauHinh(tu_dia=False, goc=_KHO_GOC._goc)
        _KHO_LAST_SEEN[key] = now
        return _KHO_THEO_KTV[key]


class _KhoTheoKTV:
    """Proxy tương thích để code firmware tiếp tục dùng biến toàn cục ``KHO``."""

    def bind(self, key):
        _KHO_CONTEXT.key = key or "anonymous"
        return _kho_cua_ktv(_KHO_CONTEXT.key)

    def current_key(self):
        return getattr(_KHO_CONTEXT, "key", "anonymous")

    def reset(self, key=None):
        session_key = key or self.current_key()
        with _KHO_LOCK:
            _KHO_THEO_KTV.pop(session_key, None)
            _KHO_LAST_SEEN.pop(session_key, None)
        return self.bind(session_key)

    def _current(self):
        return _kho_cua_ktv(self.current_key())

    def __getattr__(self, name):
        return getattr(self._current(), name)


KHO = _KhoTheoKTV()
