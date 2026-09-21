#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
KHO CAU HINH TRUNG TAM — dong vai NVRAM cua hEX S
==================================================

Muc dich (CLAUDE.md muc 2.5): MOI trang doc va ghi qua DUNG MOT kho. Bam Save
o trang nao thi kho doi, va moi trang lien quan phai phan anh thay doi do.

TRANG THAI BAN DAU khong bia: nap thang tu cac khung THAT da thu o
`src/du_lieu_goc/`. Kho chi la mot lop dat CHONG LEN cac khung do — duong dan
nao chua bi ghi thi tra ve nguyen khung goc, khong sai mot byte.

HOP DONG GHI — DO TREN THIET BI THAT ngay 2026-08-25, luu o
`reference/khung_ghi/` (xem `bang-ke.json` o do):

| Thao tac        | uff0007  | Tham so vao            | Khung tra ve                 |
|-----------------|----------|------------------------|------------------------------|
| Sua muc don     | 0xfe000e | cac truong doi         | ACK tran                     |
| Sua dong bang   | 0xfe0003 | ufe0001 + cac truong   | ACK tran                     |
| Them dong bang  | 0xfe0005 | cac truong (khong id)  | ACK + **ufe0001 = id moi**   |
| Xoa dong bang   | 0xfe0006 | ufe0001                | ACK tran                     |
| Doi thu tu dong | 0xfe0007 | ufe0001, ufe0005       | (chua do — xem ISSUES.md)    |

"ACK tran" = dung 4 the: Uff0001 (id phien), Uff0002 (duong dan),
uff0003 = 2, uff0006 (so hieu). Do duoc tu B/D/E__tl0.bin — deu 55 byte.
Rieng khung THEM (C__tl0.bin, 60 byte) co them ufe0001.

CHIEU DAY — day moi la loi cua muc 4:
Ngay sau khi ghi, thiet bi TU DAY doi tuong da doi xuong kenh cho dai cua
MOI phien dang `subscribe` (0xfe0012) duong dan do. Do duoc o
`B_identity_set__day0.bin` (78 byte):

    Uff0001 = [28]          <- id phien nhan
    Uff0002 = [24, 1]       <- duong dan bi doi
    0x0e    = False
    0x0c    = 'FPT'         <- GIA TRI MOI
    0x0d    = '7.14.3'
    uff0003 = 2
    uff0006 = 5124

Khong co goi day cho [20,35] vi luc do KHONG phien nao subscribe duong dan
ay. Tuc: thiet bi chi day cho ai da dang ky. Bo giai lap lam dung nhu vay.
"""
import json
import os
import threading

_HERE = os.path.dirname(os.path.abspath(__file__))
TEP_KHO = os.path.join(_HERE, "cau_hinh.json")

# The he thong — khong bao gio nam trong du lieu nguoi dung
T_PHIEN = 0xFF0001
T_DUONG_DAN = 0xFF0002
T_LOAI = 0xFF0003
T_SO_HIEU = 0xFF0006
T_ID = 0xFE0001
T_DS_DOI_TUONG = 0xFE0002

HE_THONG = {T_PHIEN, T_DUONG_DAN, T_LOAI, 0xFF0004, T_SO_HIEU, 0xFF0007,
            0xFF0008, 0xFE0003, 0xFE0004, 0xFE000C, 0xFE0015, 0xFE0018,
            0xFE0019, 0xFF001C}


class KhoCauHinh:
    """
    Luu thay doi theo tung duong dan lenh.

      scalar[duong_dan]  = {ten_the: (kieu, gia_tri)}      — muc don
      bang[duong_dan]    = {id: {ten_the: (kieu, gia_tri)}} — dong bang
      da_xoa[duong_dan]  = {id, ...}                        — dong bi xoa

    Duong dan nao KHONG co trong ba cai tren thi may chu phat lai khung goc.
    """

    def __init__(self, tu_dia=True):
        self.khoa = threading.RLock()
        self.scalar = {}
        self.bang = {}
        self.da_xoa = {}
        self.thu_tu = {}      # duong_dan -> [id, ...] thu tu hien tai
        if tu_dia:
            self.nap()

    # ---------------------------------------------------------------- doc

    def lop_phu_scalar(self, duong_dan):
        with self.khoa:
            return dict(self.scalar.get(tuple(duong_dan), {}))

    def lop_phu_bang(self, duong_dan):
        with self.khoa:
            dd = tuple(duong_dan)
            return (dict(self.bang.get(dd, {})), set(self.da_xoa.get(dd, ())))

    def co_thay_doi(self, duong_dan):
        dd = tuple(duong_dan)
        with self.khoa:
            return (dd in self.scalar or dd in self.bang or dd in self.da_xoa
                    or dd in self.thu_tu)

    # ---------------------------------------------------------------- ghi

    def dat_scalar(self, duong_dan, truong):
        """0xfe000e — sua muc don. Tra ve dict truong da doi (de day di)."""
        dd = tuple(duong_dan)
        with self.khoa:
            self.scalar.setdefault(dd, {}).update(truong)
        return dict(truong)

    def sua_dong(self, duong_dan, ma_dong, truong):
        """0xfe0003 — sua mot dong bang."""
        dd = tuple(duong_dan)
        with self.khoa:
            self.bang.setdefault(dd, {}).setdefault(ma_dong, {}).update(truong)
        return dict(truong)

    def them_dong(self, duong_dan, truong, id_lon_nhat_goc=0):
        """
        0xfe0005 — them dong. Tra ve id MOI.

        CACH THIET BI THAT CAP ID — do duoc, va KHONG nhu em doan luc dau:

          - Bang [20,35] dang RONG  -> dong dau tien nhan id = **1**
          - Bang [14,3]  dang RONG  -> dong dau tien nhan id = **2**, dong
            thu hai nhan **3**

        Tuc KHONG phai "id nho nhat con trong". Moi bang co mot bo dem RIENG,
        tang dan va **khong lui lai khi xoa** — [14,3] tra ve 2 nghia la truoc
        do da tung co mot dong mang id 1 roi bi xoa.

        Bo giai lap dung bo dem tang dan theo bang, khoi diem = id lon nhat
        tung thay (ke ca dong da xoa). Voi bang chua tung bi ghi thi khoi diem
        lay tu khung THAT. Cho nao chua du bang chung (bo dem cua thiet bi da
        chay toi dau truoc khi em do) thi khong the doan — xem ISSUES.md.
        """
        dd = tuple(duong_dan)
        with self.khoa:
            dang_co = set(self.bang.get(dd, {}))
            da_tung_xoa = set(self.da_xoa.get(dd, ()))
            moc = max([id_lon_nhat_goc] + list(dang_co) + list(da_tung_xoa) + [0])
            ma_moi = moc + 1
            self.bang.setdefault(dd, {})[ma_moi] = dict(truong)
            self.da_xoa.get(dd, set()).discard(ma_moi)
            self.thu_tu.setdefault(dd, []).append(ma_moi)
        return ma_moi

    def doi_cho(self, duong_dan, ma_dong, ma_dung_sau, ids_goc=None):
        """
        0xfe0007 — doi thu tu dong. DO THAT tren [14,3] ngay 2026-08-25:

          - `ufe0005` = id cua dong ma dong nay phai dung NGAY TRUOC
          - `ufe0005 = 0xffffffff` nghia la dua xuong CUOI danh sach
          - Khung tra ve la ACK tran 4 the, 55 byte — giong het lenh sua

        Doi chieu ma goc `ObjectMap.moveObjectAfter`: `req.ufe0005 = next.ufe0001`
        voi `next` la dong ke sau vi tri dich. Khop.

        `ids_goc` = danh sach id cua cac dong GOC (tu khung that) theo dung thu
        tu. Lan dau doi cho o mot bang thi `thu_tu` duoc "vat chat hoa" thanh
        THU TU DAY DU (goc + moi) de keo duoc CA DONG GOC — truoc day chi keo
        duoc dong hoc vien them, keo dong goc la bao "khong co doi tuong".
        """
        dd = tuple(duong_dan)
        with self.khoa:
            tt = self.thu_tu.get(dd)
            if ids_goc:
                da_xoa = self.da_xoa.get(dd, set())
                goc = [g for g in ids_goc if g not in da_xoa]
                if tt is None:
                    tt = goc
                elif any(g not in tt for g in goc):
                    # thu_tu kieu cu (chi chua dong moi): dong goc dung TRUOC,
                    # dong moi giu nguyen thu tu cua no o SAU — khop dung cach
                    # `_ap_bang` dang sap xep, nen khong doi vi tri hien thi.
                    tt = goc + [x for x in tt if x not in goc]
                self.thu_tu[dd] = tt
            if tt is None or ma_dong not in tt:
                return False
            tt.remove(ma_dong)
            if ma_dung_sau == 0xFFFFFFFF or ma_dung_sau not in tt:
                tt.append(ma_dong)
            else:
                tt.insert(tt.index(ma_dung_sau), ma_dong)
        return True

    def lop_phu_thu_tu(self, duong_dan):
        with self.khoa:
            return list(self.thu_tu.get(tuple(duong_dan), []))

    def xoa_dong(self, duong_dan, ma_dong):
        """0xfe0006 — xoa dong."""
        dd = tuple(duong_dan)
        with self.khoa:
            self.bang.get(dd, {}).pop(ma_dong, None)
            self.da_xoa.setdefault(dd, set()).add(ma_dong)
            if dd in self.thu_tu and ma_dong in self.thu_tu[dd]:
                self.thu_tu[dd].remove(ma_dong)

    # ------------------------------------------------------------- dia

    def _de_ghi(self):
        return {
            "scalar": {"-".join(map(str, k)): {str(a): list(v) for a, v in d.items()}
                       for k, d in self.scalar.items()},
            "bang": {"-".join(map(str, k)): {str(i): {str(a): list(v) for a, v in r.items()}
                                             for i, r in d.items()}
                     for k, d in self.bang.items()},
            "da_xoa": {"-".join(map(str, k)): sorted(v) for k, v in self.da_xoa.items()},
            "thu_tu": {"-".join(map(str, k)): list(v) for k, v in self.thu_tu.items()},
        }

    def luu(self):
        with self.khoa:
            tmp = TEP_KHO + ".tmp"
            with open(tmp, "w", encoding="utf-8") as f:
                json.dump(self._de_ghi(), f, indent=1, default=_json_an_toan)
            os.replace(tmp, TEP_KHO)

    def nap(self):
        if not os.path.exists(TEP_KHO):
            return
        try:
            d = json.load(open(TEP_KHO, encoding="utf-8"))
        except Exception:
            return
        with self.khoa:
            self.scalar = {_dd(k): {int(a): tuple(_giai_json(v)) for a, v in x.items()}
                           for k, x in d.get("scalar", {}).items()}
            self.bang = {_dd(k): {int(i): {int(a): tuple(_giai_json(v)) for a, v in r.items()}
                                  for i, r in x.items()}
                         for k, x in d.get("bang", {}).items()}
            self.da_xoa = {_dd(k): set(v) for k, v in d.get("da_xoa", {}).items()}
            self.thu_tu = {_dd(k): list(v) for k, v in d.get("thu_tu", {}).items()}

    def xoa_sach(self):
        """Dung cho bo kiem — dua kho ve rong."""
        with self.khoa:
            self.scalar.clear()
            self.bang.clear()
            self.da_xoa.clear()
            self.thu_tu.clear()
        if os.path.exists(TEP_KHO):
            os.remove(TEP_KHO)


def _dd(s):
    return tuple(int(x) for x in s.split("-"))


def _json_an_toan(o):
    if isinstance(o, bytes):
        return {"__byte__": o.decode("latin-1")}
    if isinstance(o, set):
        return sorted(o)
    raise TypeError(type(o))


def _giai_gt(gt):
    """
    Khoi phuc byte o MOI CAP khi nap tu JSON.

    LOI DA TRA GIA (2026-09-19, anh Huynn bao trang IP > DNS tra HTTP 500):
    luc GHI, `json.dump(default=_json_an_toan)` doi MOI gia tri byte thanh
    {"__byte__": ...} — ke ca byte nam SAU trong khung long nhau (kieu 0x28/
    0x29/0xa8, vd danh sach "Servers" cua trang DNS [14,2] chua dia chi IPv6
    16 byte). Nhung luc NAP thi ban cu chi doi NGUOC o CAP NGOAI CUNG, nen
    cac byte cap trong van la dict -> khi dung khung tra loi, `bytes(dict)`
    duyet qua KHOA cua dict (chuoi) va nem
    "TypeError: 'str' object cannot be interpreted as an integer"
    -> may chu tra 500 -> khung iframe bi da ve trang dang nhap cua portal.
    Ghi va nap PHAI doi xung: da de quy khi ghi thi cung phai de quy khi nap.
    """
    if isinstance(gt, dict):
        if "__byte__" in gt:
            return gt["__byte__"].encode("latin-1")
        return {k: _giai_gt(v) for k, v in gt.items()}
    if isinstance(gt, list):
        return [_giai_gt(x) for x in gt]
    return gt


def _giai_json(v):
    kieu, gt = v
    return (kieu, _giai_gt(gt))
