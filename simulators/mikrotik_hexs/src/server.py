#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
MAY CHU GIA LAP — MikroTik hEX S (RouterOS/WebFig 7.14.3)
==========================================================

CACH CHAY:
    python server.py            (mac dinh cong 8080)
    python server.py 9000
Roi mo trinh duyet vao  http://localhost:8080/

NGUYEN TAC (xem CLAUDE.md muc 4.1):
  - Tai nguyen tinh trong src/www/ phuc vu NGUYEN VAN, trung sha256 voi
    reference/. TUYET DOI khong sua master-min.js / .jg / curve255.js.
  - Moi khac biet nam o tang may chu: /jsproxy tra gi.

LUONG /jsproxy:
  1. Goi 40 byte bat dau bang 8 byte 0  -> BAT TAY (chua ma hoa):
     tra [id u32 BE][4 byte 0][khoa cong may chu 32 byte]
  2. Cac goi sau -> giai ma RC4, doc khung M2, dieu phoi theo duong dan lenh,
     tra khung M2 da ma hoa.

TRANG THAI HIEN TAI: phat lai khung tra loi THAT da thu tu thiet bi
(src/du_lieu_goc/), chi thay lai id phien va so hieu yeu cau. Day la MUC 3
(dung hop dong giao tiep). Muc 4 (kho cau hinh) se noi o GD4.
"""
import os
import struct
import sys
import threading
import time

sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
import m2                      # noqa: E402
import mat_ma                  # noqa: E402
import kho_cau_hinh            # noqa: E402

from http.server import BaseHTTPRequestHandler, ThreadingHTTPServer  # noqa: E402
from urllib.parse import unquote  # noqa: E402

_HERE = os.path.dirname(os.path.abspath(__file__))
WWW = os.path.join(_HERE, "www")
DU_LIEU = os.path.join(_HERE, "du_lieu_goc")
CONG = int(sys.argv[1]) if len(sys.argv) > 1 else 8080

# The he thong trong khung M2 (xac nhan tu ma goc + 46 khung that)
T_PHIEN = 0xFF0001     # mang u32 — [id phien]  (trong YEU CAU: duong dan)
T_DUONG_DAN = 0xFF0002  # mang u32 — duong dan lenh
T_LOAI = 0xFF0003      # u8
T_LENH = 0xFF0007      # u32 — ma lenh
T_SO_HIEU = 0xFF0006   # u32 — so hieu yeu cau, may chu vong lai
T_DU_LIEU = 0xFE0002   # mang khung con — cac dong du lieu
T_ID = 0xFE0001        # u8/u32 — id cua mot dong trong bang

# Ma lenh GHI — rut tu ma goc, da do that tren thiet bi 2026-08-25
L_SUA_MUC = 0xFE000E    # ObjectHolder.setObject
L_SUA_DONG = 0xFE0003   # ObjectMap.setObject (co ufe0001)
L_THEM_DONG = 0xFE0005  # ObjectMap.setObject (khong ufe0001)
L_XOA_DONG = 0xFE0006   # ObjectMap.removeObject
L_DOI_CHO = 0xFE0007    # ObjectMap.moveObjectAfter (ufe0005 = id dong ke sau)
LOI_KHONG_CO = 0xFE0004   # "object doesn't exist" — do that L1/L2
LOI_THIEU_TRUONG = 0xFE0006  # do that L3, kem sff0009 'name or regexp required'

L_BAT_DAU = 0xFE000F    # ObjectQuery.start  — cap id phien truy van
L_HUY_TV = 0xFE0011     # ObjectQuery.stop   — huy phien truy van

# TERMINAL — duong dan [76]. Ma lenh rut tu Terminal.prototype.* trong ma goc,
# da do that tren thiet bi 2026-08-25 (reference/khung_terminal/).
DD_TERMINAL = (76,)
L_TERM_MO = 0xA0065     # login : s7='vt102', u5=rong, u6=cao -> ACK + ufe0001
L_TERM_DONG = 0xA0066    # close : ufe0001
L_TERM_GO = 0xA0067      # input : r2=[byte], u3=so byte da nhan, ufe0001
L_TERM_CO = 0xA0068      # winch : u5/u6 khi doi kich thuoc cua so

# LENH HANH DONG (`doit`) — Doit.prototype.doit trong ma goc:
#     req = {...cac truong...}; req.Uff0001 = path; req.uff0007 = attrs.cmd
# `cmd` la so NHO (1,2,5,6,7,9...) rieng cho tung duong dan, KHONG phai ma
# lenh chung. Do that 2026-08-25 (reference/khung_doit/):
#   [82] cmd 1 Wake on LAN -> ACK tran 4 the, 51 byte
#   [138,1] cmd 1 WPS tren thiet bi khong co WiFi -> loi 0xfe0004
DOIT_CMD_TOI_DA = 0x100     # cmd cua doit luon la so nho; phan biet voi ma lenh

# Nhung viec KHONG duoc phep thi hanh — ke ca tren ban gia lap, vi hoc vien
# bam nham thi mat sach trang thai hoc tap. Tra dung khung ACK nhu that
# nhung KHONG dong vao kho. Ghi ro trong ISSUES.md.
DOIT_CHAN = {
    (24,): {5: "Reboot", 6: "Shutdown", 7: "Reset Configuration",
            9: "Confirm Reboot"},
    (67,): {2: "Restore"},
    (19, 3): {2: "Revoke certificate"},
}

L_DANG_KY = 0xFE0012    # subscribe
L_HUY_DANG_KY = 0xFE0013  # unsubscribe

KHO = kho_cau_hinh.KhoCauHinh()

MIME = {
    ".html": "text/html", ".js": "application/javascript", ".css": "text/css",
    ".png": "image/png", ".svg": "image/svg+xml", ".gif": "image/gif",
    ".jg": "text/plain", ".ttf": "font/ttf",
}

NHAT_KY = os.path.join(_HERE, "nhat_ky.log")
_khoa_ky = threading.Lock()


def _ghi(dong):
    """In ra man hinh VA ghi vao src/nhat_ky.log de tra cuu sau."""
    print("  " + dong)
    try:
        with _khoa_ky, open(NHAT_KY, "a", encoding="utf-8") as f:
            f.write(f"{time.strftime('%H:%M:%S')} {dong}\n")
    except Exception:
        pass


_khoa = threading.Lock()
_phien = {}          # id -> PhienMayChu
_id_ke_tiep = [7]    # thiet bi that cap id nho tang dan; bat dau tu 7


def _nap_du_lieu():
    """
    Nap khung tra loi that theo tung duong dan lenh.

    Hai kieu ten tep:
      <duong-dan>.bin            — tra loi mot lan
      <duong-dan>__p<N>.bin      — tra loi NHIEU TRANG, trang thu N (0,1,2...)

    VI SAO CO TRANG (2026-08-25): doc ObjectMap.prototype.getall trong
    master-min.js:
        else if((rep.ufe0003!=null || rep.mfe0015) && !me.block){
            if(rep.ufe0003!=null) req.ufe0003 = rep.ufe0003;
            post(req, onreply);          // <- XIN TRANG TIEP NGAY
        }
    Tuc khung nao con the 0xfe0003 (con tro trang) thi trinh duyet lap tuc
    hoi tiep. Phat lai TINH mai mot khung co con tro -> VONG LAP VO HAN,
    tab treo cung. Da vap that o [17] History, [3,4] Log, [123,2] Cloud.
    """
    kho, kho_trang, kho_map = {}, {}, {}
    if not os.path.isdir(DU_LIEU):
        return kho, kho_trang, kho_map
    for ten in os.listdir(DU_LIEU):
        if not ten.endswith(".bin"):
            continue
        goc = ten[:-4]
        if "__p" in goc:
            phan, so = goc.split("__p")
            duong_dan = tuple(int(x) for x in phan.split("-"))
            kho_trang.setdefault(duong_dan, {})[int(so)] = \
                open(os.path.join(DU_LIEU, ten), "rb").read()
        elif goc.endswith("__map"):
            duong_dan = tuple(int(x) for x in goc[:-5].split("-"))
            kho_map[duong_dan] = open(os.path.join(DU_LIEU, ten), "rb").read()
        else:
            duong_dan = tuple(int(x) for x in goc.split("-"))
            kho[duong_dan] = open(os.path.join(DU_LIEU, ten), "rb").read()
    # doi dict{so:byte} -> list theo thu tu trang
    kho_trang = {k: [v[i] for i in sorted(v)] for k, v in kho_trang.items()}
    return kho, kho_trang, kho_map


# KHO_MAP — tep `<duong-dan>__map.bin`
# ------------------------------------
# MOT duong dan co the tra ve HAI kieu khung khac han nhau, tuy LENH hoi:
#
#   0xfe000d (fetch / item) -> mot doi tuong don
#   0xfe0004 (getall / map) -> mot DAY dong
#
# `[24, 2]` la vi du: hoi kieu item thi ra thong tin may (RB760iGS, hEX S,
# mmips, 7.14.3); hoi kieu map thi ra **4 dong cpu0..cpu3**.
#
# Do la duong dan CPU ma trang Tools >> Profile dung de dung o chon:
#     values: {type:'pair', c:[
#        {type:'static', map:{'4294967293':'total','4294967294':'all'}},
#        {type:'dynamic', path:[24,2]} ]}
#
# Dot thu 2026-08-24 chi hoi moi duong dan MOT kieu (theo `kieu` trong
# spec/duong-dan-lenh.json), nen chi co ban item. Hau qua: o chon CPU tren
# ban gia lap chi co `all total`, trong khi thiet bi that co
# `all cpu0 cpu1 cpu2 cpu3 total`.
#
# **Bo doi chieu GIAO DIEN tim ra cho nay** — bo kiem may chu 92/92 khong he
# thay, vi khung item van dung tuyet doi. Dung nghia "phep do ket qua cuoi".
KHO_TRA_LOI, KHO_TRANG, KHO_MAP = _nap_du_lieu()

DU_LIEU_TV = os.path.join(_HERE, "du_lieu_query")


def _nap_query():
    """
    Nap cac khung THAT cua mot phien TRUY VAN (query) — Ping, Torch, Traceroute...

    CO CHE — do that tren hEX S 2026-08-25, khung goc o reference/khung_query/:

      1. Bam Start -> uff0007 = startcmd (Ping: 0xfe000f)
         Thiet bi tra ACK + **ufe0001 = id phien truy van**.
      2. May khach goi getall (0xfe0004) KEM ufe0001 = id do.
         MOI khung tra ve MOT dong ket qua, kem **ufe0003 = con tro**.
      3. May khach phai hoi TIEP NGAY kem con tro ay. Day chinh la co che
         "ket qua chay ve": dung y het co che phan trang cua History/Log.
      4. Khong hoi tiep -> thiet bi DONG phien; hoi lai bang id cu se bi
         loi 0xfe0004. Da do that: cho 1,2 giay la mat phien.
      5. Bam Stop -> uff0007 = cancelcmd (Ping: 0xfe0011) kem ufe0001.

    Thu muc: src/du_lieu_query/<duong-dan>/g0.bin, g1.bin, ...
    """
    kho = {}
    if not os.path.isdir(DU_LIEU_TV):
        return kho
    for ten in sorted(os.listdir(DU_LIEU_TV)):
        thu_muc = os.path.join(DU_LIEU_TV, ten)
        if not os.path.isdir(thu_muc):
            continue
        dd = tuple(int(x) for x in ten.split("-"))
        tep = sorted((f for f in os.listdir(thu_muc) if f.endswith(".bin")),
                     key=lambda f: int(f[1:-4]))
        kho[dd] = [open(os.path.join(thu_muc, f), "rb").read() for f in tep]
    return kho


KHO_QUERY = _nap_query()


def _nap_lenh_truy_van():
    """
    Bang startcmd / cancelcmd cua tung cong cu, boc tu cac tep .jg goc.

    KHONG duoc gia dinh moi cong cu dung 0xfe000f: Torch dung **0x1**,
    IP Scan **0x1**, RoMON Ping **0x7**, Latency Distribution **0xffffffff**.
    Da vap that: Torch bam Start khong ra gi vi may chu chi nhan 0xfe000f.
    """
    import json as _json
    p = os.path.join(_HERE, "..", "spec", "truy-van.json")
    if not os.path.exists(p):
        return {}
    return {tuple(int(x) for x in k.split("-")): v
            for k, v in _json.load(open(p, encoding="utf-8")).items()}


LENH_TRUY_VAN = _nap_lenh_truy_van()


def _nap_loi_truy_van():
    """
    Cong cu nao thiet bi TU CHOI ngay khi bam Start, va tu choi bang loi gi.

    DO THAT tren hEX S 2026-08-25 (reference/khung_query_loi/):

      [138,2] [138,3] [138,21]  0xfe0004  — may khong co radio WiFi
      [20,61]                   0xfe0004  — khong co modem LTE
      [135,8]                   0xfe0005  + "required parametrs missing"
                                            (loi chinh ta la CUA MikroTik)
      [127,2] [127,4]           0xfe0006  + "RoMON not running"

    TRUOC KHI CO BANG NAY bo giai lap tra ACK + id cho MOI cong cu — tuc bao
    "chay duoc" trong khi thiet bi that tu choi. Do la BIA, khong phai thieu
    du lieu. Bat duoc nho di do tung cai thay vi suy tu Ping.
    """
    import json as _json
    p = os.path.join(_HERE, "..", "spec", "truy-van-loi.json")
    if not os.path.exists(p):
        return {}
    ra = {}
    for k, v in _json.load(open(p, encoding="utf-8")).items():
        ra[tuple(int(x) for x in k.split("-"))] = (
            v.get("ma_loi"),
            v["mo_ta"].encode("latin-1") if v.get("mo_ta") else None)
    return ra


LOI_TRUY_VAN = _nap_loi_truy_van()

DU_LIEU_WIZARD = os.path.join(_HERE, "du_lieu_wizard")


def _nap_wizard():
    """
    Nap khung cua cac duong dan kieu `setup` (wizard nhieu buoc).

    CO CHE — do that tren hEX S 2026-08-28, khung goc o reference/khung_action/:

      Wizard KHAC han query. Khong co id phien, khong co con tro. May khach
      bam Next, thiet bi tra ve MOT khung mang hai the moi:

        0xfe000e = SO BUOC hien tai (2, 3, 4, ... 9)
        0xfe000f = TRANG THAI TICH LUY — mot ban tin M2 LONG NHAU chua moi
                   gia tri da nhap tu dau wizard toi gio, cong don dan.

      Vi du Hotspot Setup [63] tren hEX S:
        buoc 2: {0x0b: 16885952 (=192.168.1.1, little-endian), 0x01: 8, 0x0c: ...}
        buoc 3: them 0x0e (dai dia chi pool), 0x0d (Masquerade=True)
        buoc 4: them 0x49 (chung chi SSL)
        buoc 5: neu chon 'import other certificate' ma khong co khoa rieng thi
                thiet bi tra LOI THAT:
                "None of certificates has decrypted private key. ..."

    Thu muc: src/du_lieu_wizard/<duong-dan>/b0.bin, b1.bin, ...
    May chu phat lai dung day nay theo THU TU, dem theo PHIEN.

    GIOI HAN DA BIET (ghi ro trong ISSUES.md, KHONG bia):
      Chi thu duoc toi buoc 9. Buoc cuoi ("Create local HotSpot user") va
      buoc bam Next tren no — tuc buoc GHI CAU HINH THAT — CO Y khong thu,
      vi se tao Hotspot server that tren thiet bi cua anh Huynn.
    """
    kho = {}
    if not os.path.isdir(DU_LIEU_WIZARD):
        return kho
    for ten in sorted(os.listdir(DU_LIEU_WIZARD)):
        tm = os.path.join(DU_LIEU_WIZARD, ten)
        if not os.path.isdir(tm):
            continue
        dd = tuple(int(x) for x in ten.split("-"))
        kho[dd] = [open(os.path.join(tm, f), "rb").read()
                   for f in sorted(os.listdir(tm),
                                   key=lambda s: int(s[1:-4]))]
    return kho


KHO_WIZARD = _nap_wizard()

DU_LIEU_TERM = os.path.join(_HERE, "du_lieu_terminal")


def _nap_terminal():
    """
    Nap dau ra THAT cua Terminal RouterOS (byte VT102, con nguyen ma mau).

    HOP DONG — doc tu Terminal.prototype.* trong master-min.js, do that
    2026-08-25 (khung goc o reference/khung_terminal/):

      mo   : uff0007 = 0xa0065, s7='vt102', u5=rong, u6=cao
             -> ACK + ufe0001 = id terminal
      go   : uff0007 = 0xa0067, r2 = [byte go], u3 = so byte da nhan, ufe0001
      co   : uff0007 = 0xa0068, u5/u6 (doi kich thuoc cua so)
      dong : uff0007 = 0xa0066, ufe0001

    DAU RA KHONG nam trong khung tra loi. Thiet bi DAY ve tren duong dan [76]
    qua kenh cho dai; byte VT102 nam trong the r2 (0x000002). May khach dang
    ky bang `subscribers[[76]] = this` trong Terminal.listen().
    """
    kho = {}
    ml = os.path.join(DU_LIEU_TERM, "muc_luc.json")
    if not os.path.exists(ml):
        return kho
    import json as _json
    for lenh, ten in _json.load(open(ml, encoding="utf-8")).items():
        p = os.path.join(DU_LIEU_TERM, ten + ".bin")
        if os.path.exists(p):
            kho[lenh] = open(p, "rb").read()
    return kho


KHO_TERM = _nap_terminal()


def _the_thanh_dict(the):
    return {ten: gt for ten, kieu, gt in the}


# Khung `rosmode` trong tra loi dang nhap — DOC THANG tu sysres.rosmode cua
# thiet bi that (2026-08-24). U6d la BITMASK TINH NANG, ham hasFeature() doc
# no de quyet dinh menu nao hien: hasFeature(f) = !!(U6d[f>>5] & (1<<(f%32))).
# Sai bitmask nay -> cay menu khac thiet bi that. Khong duoc dat bua.
_ROSMODE = [
    (0x00006D, 0x88, [541594755, 2684373084, 0]),   # U6d — bitmask tinh nang
    (0x00000B, 0x00, False), (0x00000C, 0x01, True), (0x00000D, 0x01, True),
    (0x00000E, 0x01, True),  (0x00000F, 0x01, True), (0x000010, 0x01, True),
    (0x000011, 0x01, True),  (0x000012, 0x01, True), (0x000013, 0x01, True),
    (0x000014, 0x01, True),  (0x000015, 0x01, True), (0x000016, 0x01, True),
    (0x000017, 0x01, True),  (0x000018, 0x01, True), (0x000019, 0x01, True),
    (0x00001A, 0x01, True),  (0x00001B, 0x01, True), (0x00001C, 0x00, False),
    (0x000065, 0x00, False), (0x000066, 0x00, False),
    (0x000069, 0x09, 0), (0x00006A, 0x09, 4), (0x00006B, 0x09, 6),
    (0x00006C, 0x09, 3), (0x000064, 0x09, 0),
    (0x000068, 0x10, 4054740387507), (0x000067, 0x10, 55),
]


def _tra_loi_dang_nhap(so_hieu, ma_phien):
    """
    Tra loi cho lenh DANG NHAP.

    Hop dong doc TAN MAT tu ham doAuth() trong master-min.js:
        post({s1:user, s3:pwd}, function(rep){
          sysres.policy    = rep.uff000b;   // u32     the 0xff000b
          sysres.skin      = rep.sfe0009;   // chuoi   the 0xfe0009
          sysres.haspwd    = rep.b1c;       // bool    the 0x00001c
          sysres.arch      = rep.s11;       // chuoi   the 0x000011
          sysres.boardname = rep.s15;       // chuoi   the 0x000015
          sysres.board     = rep.s17;       // chuoi   the 0x000017
          sysres.defconf   = rep.b13;       // bool    the 0x000013
          sysres.expiredPwd= rep.b26;       // bool    the 0x000026
          sysres.rosmode   = rep.m28;       // khung   the 0x000028
        }, () => logout('Authentication failed...'))

    MOI GIA TRI DUOI DAY DOC THANG TU THIET BI THAT (2026-08-24): dang nhap
    that roi doc `sysres` trong trinh duyet. KHONG doan mot gia tri nao.

    Luc dau em DOAN 3 cho va SAI ca 3, ghi lai de doi sau khong lap:
      - policy: doan 0xFFFFFFFF (bat het) -> that ra 655358
      - skin  : doan rong                 -> that ra "default"
      - boardname / board: em de NGUOC NHAU. That ra boardname="RB760iGS"
        (ma san pham) va board="RBM"; "hEX S" la ten thuong goi, KHONG phai
        gia tri cua the nay.
    """
    return [
        (T_PHIEN, 0x88, [ma_phien]),
        (0xFF000B, 0x08, 655358),        # policy    — do that
        (0xFE0009, 0x21, b"default"),    # skin      — do that
        (0x00001C, 0x01, True),          # haspwd = 1
        (0x000011, 0x21, b"mmips"),      # arch      — do that
        (0x000015, 0x21, b"RB760iGS"),   # boardname — do that
        (0x000017, 0x21, b"RBM"),        # board     — do that
        (0x000013, 0x00, False),         # defconf = 0
        (0x000026, 0x00, False),         # expiredPwd = 0
        (0x000028, 0x29, {"magic": True, "the": _ROSMODE}),
        (T_LOAI, 0x09, 2),
        (T_SO_HIEU, 0x08, so_hieu),
    ]


def _tra_loi_cho(duong_dan, so_hieu, ma_phien, ph=None, co_con_tro=False,
                 lenh=None):
    """
    Dung khung tra loi cho mot duong dan lenh.
    Lay khung THAT da thu tu thiet bi roi thay lai id phien + so hieu.
    Chua co du lieu that -> tra khung rong dung dinh dang (khong bia noi dung).
    """
    # Duong dan [120] — SPA hoi ngay sau khi dang nhap:
    #   post({Uff0001:[120], uff0007:5}, rep => { sysres.qscaps = rep.u1||0; ... })
    # Gia tri that do duoc tren thiet bi: sysres.qscaps = 64.
    if list(duong_dan) == [120]:
        return [
            (T_PHIEN, 0x88, [ma_phien]),
            (T_DUONG_DAN, 0x88, [120]),
            (0x000001, 0x08, 64),          # qscaps — do that
            (T_LOAI, 0x09, 2),
            (T_SO_HIEU, 0x08, so_hieu),
        ]

    # Duong dan [24,1] — Identity.
    # 2026-08-25: DA CO KHUNG THAT. Goi thiet bi tu day xuong sau khi ghi
    # (reference/khung_ghi/B_identity_set__day0.bin) cho thay day du 3 truong:
    #     0x0c = 'FPT'      (Identity, dac ta roteros.jg id "sc")
    #     0x0d = '7.14.3'   (Version,  id "sd" — danh dau nonpublic nen giao
    #                        dien khong hien, nhung thiet bi VAN gui)
    #     0x0e = False
    # Truoc day em chi dat 0x0c va tu ghi "chua co bang chung cho 0x0d".
    # Gio co roi thi dat dung ca ba.
    if list(duong_dan) == [24, 1]:
        return _ap_kho(duong_dan, [
            (T_PHIEN, 0x88, [ma_phien]),
            (T_DUONG_DAN, 0x88, [24, 1]),
            (0x00000E, 0x00, False),
            (0x00000C, 0x21, b"FPT"),
            (0x00000D, 0x21, b"7.14.3"),
            (T_LOAI, 0x09, 2),
            (T_SO_HIEU, 0x08, so_hieu),
        ])

    # --- Duong dan tra loi NHIEU TRANG ---
    # Dem trang giu THEO PHIEN, khong tra theo gia tri con tro: co duong dan
    # (vi du [123,2]) tra ve cung mot con tro o moi trang nen tra theo gia tri
    # se lai lap vo han. Yeu cau KHONG co the 0xfe0003 nghia la bat dau lai.
    trang = KHO_TRANG.get(tuple(duong_dan))
    if trang is not None and ph is not None:
        khoa = tuple(duong_dan)
        i = (ph.trang.get(khoa, -1) + 1) if co_con_tro else 0
        if i >= len(trang):
            i = len(trang) - 1          # het trang -> giu trang cuoi (khong con tro)
        ph.trang[khoa] = i
        goc = trang[i]
    elif lenh == 0xFE0004 and tuple(duong_dan) in KHO_MAP:
        # Cung mot duong dan, hoi kieu MAP thi khung khac han kieu ITEM.
        # Xem chu thich o KHO_MAP.
        goc = KHO_MAP[tuple(duong_dan)]
    else:
        goc = KHO_TRA_LOI.get(tuple(duong_dan))
    if goc is None:
        return [
            (T_PHIEN, 0x88, [ma_phien]),
            (T_DUONG_DAN, 0x88, list(duong_dan)),
            (T_LOAI, 0x09, 2),
            (T_SO_HIEU, 0x08, so_hieu),
        ]
    kq = m2.giai_ma(goc)
    ra = []
    for ten, kieu, gt in kq["the"]:
        if ten == T_PHIEN:
            gt = [ma_phien]
        elif ten == T_SO_HIEU:
            gt = so_hieu
        ra.append((ten, kieu, gt))
    return _ap_kho(duong_dan, ra)


# ==========================================================================
# KHO CAU HINH — lop dat CHONG LEN khung goc
#
# Nguyen tac: duong dan nao CHUA bi ghi thi tra ve nguyen khung that, khong
# dong vao mot byte. Chi khi co thay doi trong kho moi vao sua.
# ==========================================================================

def _kieu_id(ma):
    return 0x09 if ma < 256 else 0x08


def _ap_kho(duong_dan, the):
    """Dat lop kho len danh sach the cua mot khung tra loi."""
    if not KHO.co_thay_doi(duong_dan):
        return the
    scalar = KHO.lop_phu_scalar(duong_dan)
    sua, xoa = KHO.lop_phu_bang(duong_dan)
    thu_tu = KHO.lop_phu_thu_tu(duong_dan)

    ra, da_dat, co_bang, so_dong = [], set(), False, None
    for ten, kieu, gt in the:
        if ten == T_DU_LIEU and isinstance(gt, list):
            co_bang = True
            moi_ds = _ap_bang(gt, sua, xoa, thu_tu)
            so_dong = len(moi_ds)
            ra.append((ten, kieu, moi_ds))
        elif ten in scalar:
            k, v = scalar[ten]
            ra.append((ten, k, v))
            da_dat.add(ten)
        else:
            ra.append((ten, kieu, gt))

    # Truong scalar moi (khung goc chua tung co) — chen truoc 2 the cuoi
    # (T_LOAI, T_SO_HIEU) de giu dung thu tu nhu thiet bi that.
    moi = [(t, k, v) for t, (k, v) in scalar.items() if t not in da_dat]
    if moi:
        cho = max(0, len(ra) - 2)
        ra = ra[:cho] + moi + ra[cho:]

    # Bang truoc do RONG (khung goc khong co the fe0002) ma gio co dong moi
    if not co_bang and sua:
        ds_moi = _ap_bang([], sua, xoa, thu_tu)
        so_dong = len(ds_moi)
        cho = max(0, len(ra) - 2)
        ra = ra[:cho] + [(T_DU_LIEU, 0xA8, ds_moi)] + ra[cho:]

    # ufe0019 = objCount. Trong MOI khung that da thu, gia tri nay luon bang
    # dung so dong ([20,3] 34/34, [13,1] 1/1, [20,35] 0/0). Quen cap nhat thi
    # giao dien hien "1 item out of 0" — da vap that 2026-08-25.
    if so_dong is not None:
        ra = [(t, (0x08 if t == 0xFE0019 else k), (so_dong if t == 0xFE0019 else v))
              for t, k, v in ra]
        if all(t != 0xFE0019 for t, k, v in ra):
            cho = max(0, len(ra) - 2)
            ra = ra[:cho] + [(0xFE0019, 0x08, so_dong)] + ra[cho:]
    return ra


def _ap_bang(ds_goc, sua, xoa, thu_tu=()):
    """
    Ghep dong goc + dong sua + dong them, bo dong da xoa.

    `thu_tu` la thu tu do lenh 0xfe0007 quyet dinh. Dong nao co trong
    `thu_tu` thi xep theo do; dong nao khong co (den tu khung goc, chua bi
    keo tha bao gio) thi giu nguyen vi tri tuong doi o cuoi.
    """
    ra, da_co = [], set()
    for m in ds_goc:
        cac = list(m.get("the", []))
        ma = next((v for t, k, v in cac if t == T_ID), None)
        da_co.add(ma)
        if ma in xoa:
            continue
        if ma in sua:
            th = dict(sua[ma])
            trong, dat = [], set()
            for t, k, v in cac:
                if t in th:
                    k2, v2 = th[t]
                    trong.append((t, k2, v2))
                    dat.add(t)
                else:
                    trong.append((t, k, v))
            trong += [(t, k2, v2) for t, (k2, v2) in th.items() if t not in dat]
            cac = trong
        ra.append({"the": cac})

    for ma, th in sorted(sua.items()):
        if ma in da_co or ma in xoa:
            continue
        ra.append({"the": [(T_ID, _kieu_id(ma), ma)]
                          + [(t, k, v) for t, (k, v) in th.items()]})

    if thu_tu:
        vt = {ma: i for i, ma in enumerate(thu_tu)}
        def khoa_sap(m):
            ma = next((v for t, k, v in m["the"] if t == T_ID), None)
            return (0, vt[ma]) if ma in vt else (1, 0)
        ra = sorted(ra, key=khoa_sap)
    return ra


def _id_lon_nhat_goc(duong_dan):
    """id lon nhat dang co trong khung THAT — de cap id moi khong dung."""
    goc = KHO_TRA_LOI.get(tuple(duong_dan))
    if goc is None:
        return 0
    lon = 0
    for ten, kieu, gt in m2.giai_ma(goc)["the"]:
        if ten == T_DU_LIEU and isinstance(gt, list):
            for m in gt:
                for t, k, v in m.get("the", []):
                    if t == T_ID and isinstance(v, int):
                        lon = max(lon, v)
    return lon


def _day_terminal(ph, ma_phien, byte_ra):
    """Day byte dau ra terminal ve may khach, dung khung nhu thiet bi that."""
    if byte_ra:
        ph.them_goi_day([(T_PHIEN, 0x88, [ma_phien]),
                         (T_DUONG_DAN, 0x88, list(DD_TERMINAL)),
                         (T_ID, 0x09, 0),
                         (T_LENH, 0x08, L_TERM_GO),
                         (0x000002, 0x30, byte_ra)])


DOIT_BIET = {(82,), (138, 1), (24,), (67,), (19, 3), (24, 25), (20, 106),
             (27, 53), (63,), (138, 11)}


def _xu_ly_doit(duong_dan, cmd, so_hieu, ma_phien):
    """
    Lenh HANH DONG (`doit`). Hop dong do that 2026-08-25:
      thanh cong -> ACK tran 4 the
      khong ho tro tren phan cung nay -> loi 0xfe0004

    Cac viec pha trang thai (Reboot/Shutdown/Reset/Restore/Revoke) nam trong
    DOIT_CHAN: tra ACK dung nhu thiet bi that nhung KHONG lam gi. Ban gia lap
    la de hoc, hoc vien bam nham khong duoc mat sach.
    """
    dd = tuple(duong_dan)
    ten = (DOIT_CHAN.get(dd) or {}).get(cmd)
    if ten:
        _ghi(f"[doit] CHAN '{ten}' ({'/'.join(map(str, dd))} cmd {cmd}) "
             f"— tra ACK nhung khong thi hanh")
        return _ack(duong_dan, so_hieu, ma_phien)
    # Nhung duong dan can phan cung khong co tren hEX S -> loi that
    if dd in {(138, 1), (138, 11), (20, 106)}:
        return _khung_loi(duong_dan, so_hieu, ma_phien, LOI_KHONG_CO)
    _ghi(f"[doit] {'/'.join(map(str, dd))} cmd {cmd} -> ACK")
    return _ack(duong_dan, so_hieu, ma_phien)


def _xu_ly_terminal(lenh, t, so_hieu, ma_phien, ph):
    """
    Bo dieu phoi Terminal.

    Bo giai lap PHAT LAI dau ra THAT da thu. Go lenh co trong kho thi ra dung
    ket qua that; go lenh khac thi tra dung thong bao loi that cua RouterOS
    ('bad command name ...'). KHONG bia ket qua cho lenh chua do.
    """
    if lenh == L_TERM_MO:
        ph.term_dem = b""
        _day_terminal(ph, ma_phien, KHO_TERM.get("__mo__", b""))
        _ghi("[terminal] mo phien")
        return _ack(DD_TERMINAL, so_hieu, ma_phien, 0)

    if lenh == L_TERM_DONG:
        ph.term_dem = b""
        _ghi("[terminal] dong phien")
        return _ack(DD_TERMINAL, so_hieu, ma_phien)

    if lenh == L_TERM_CO:
        return _ack(DD_TERMINAL, so_hieu, ma_phien)

    # go phim
    goc = t.get(0x000002) or b""
    dem = getattr(ph, "term_dem", b"") + bytes(goc)
    while b"\r" in dem:
        dong, dem = dem.split(b"\r", 1)
        cau = dong.decode("latin-1").strip()
        ra = KHO_TERM.get(cau)
        if ra is None:
            ra = KHO_TERM.get("__khong_biet__", b"")
        _ghi(f"[terminal] go: {cau!r} -> {len(ra)} byte")
        _day_terminal(ph, ma_phien, ra)
    ph.term_dem = dem
    return _ack(DD_TERMINAL, so_hieu, ma_phien)


def _xu_ly_wizard(duong_dan, so_hieu, ma_phien, ph):
    """
    Phat lai mot buoc wizard (duong dan kieu `setup`, vi du [63] Hotspot Setup).

    Dem buoc giu THEO PHIEN — giong het cach dem trang cua History/Log, va vi
    cung mot ly do: khung tra ve khong mang thong tin du de tra cuu, nen phai
    tu nho dang o buoc thu may.

    Het day khung that -> tra khung TRAN (khong co 0xfe000e). May khach hieu
    la wizard khong di tiep duoc. KHONG bia them buoc: xem chu thich
    _nap_wizard() ve ly do buoc cuoi cung co y khong duoc thu.
    """
    dd = tuple(duong_dan)
    day = KHO_WIZARD.get(dd) or []
    khoa = ("wizard", dd)
    i = ph.trang.get(khoa, -1) + 1
    if i >= len(day):
        _ghi(f"[wizard] {'/'.join(map(str, dd))} het khung that o buoc {i}")
        return [(T_PHIEN, 0x88, [ma_phien]), (T_DUONG_DAN, 0x88, list(dd)),
                (T_LOAI, 0x09, 2), (T_SO_HIEU, 0x08, so_hieu)]
    ph.trang[khoa] = i
    ra = []
    for ten, kieu, gt in m2.giai_ma(day[i])["the"]:
        if ten == T_PHIEN:
            gt = [ma_phien]
        elif ten == T_SO_HIEU:
            gt = so_hieu
        ra.append((ten, kieu, gt))
    _ghi(f"[wizard] {'/'.join(map(str, dd))} buoc {i}/{len(day) - 1}")
    return ra


_THE_HE_THONG_TV = {0xFF0001, 0xFF0002, 0xFF0003, 0xFF0004,
                    0xFF0006, 0xFF0007, 0xFF0008, 0xFE0003}


def _bo_qua_ack_dau(dd):
    """
    Tra ve chi so khung dau tien DUNG DE POLL cho duong dan `dd`.

    LY DO — do that 2026-08-28 khi noi [77] Ping Speed:
    Tren thiet bi that, bam Start tra ACK (co ufe0001 = id phien), roi lan
    poll DAU TIEN moi tra khung du lieu. Nhung khi thu bang chung, khung ACK
    ay cung duoc luu thanh g0 trong kho. May chu lai TU SINH ACK o
    L_BAT_DAU — nen neu poll bat dau tu g0 thi may khach nhan ACK HAI LAN,
    lech mot nhip so voi thiet bi that.

    Ra soat ca kho (khong chi [77]): 7 duong dan dinh loi nay —
      [24,25] Supout · [26] Traceroute · [29] Bandwidth · [29,2] Speed Test
      · [45,5] Torch · [49] Profile · [77] Ping Speed
    Con [22] Ping, [101,1] IP Scan, [27,15] PPPoE Scan thi g0 DA la du lieu
    that (co ufe0002), khong duoc bo qua.

    Nhan dien bang NOI DUNG khung chu khong bang danh sach cung: khung dau la
    ACK khi no CO ufe0001 va KHONG mang truong du lieu nao ngoai the he thong.
    Lam vay thi lan sau them cong cu moi khong phai nho sua danh sach.
    """
    day = KHO_QUERY.get(dd) or []
    if not day:
        return 0
    try:
        the = {a: c for a, k, c in m2.giai_ma(day[0])["the"]}
    except Exception:
        return 0
    if 0xFE0001 not in the:
        return 0
    con_lai = [k for k in the if k not in _THE_HE_THONG_TV and k != 0xFE0001]
    return 1 if not con_lai else 0


def _xu_ly_truy_van(duong_dan, lenh, t, so_hieu, ma_phien, ph):
    """
    Bo dieu phoi cho cac duong dan kieu `query` (Ping, Torch, Traceroute...).

    Xem chu thich day du o _nap_query(). Tom tat vong doi:
        start  -> ACK + ufe0001 = id
        getall -> mot dong + ufe0003 = con tro; hoi tiep bang con tro do
        cancel -> ACK tran; id thanh vo hieu

    Bo giai lap PHAT LAI dung day khung THAT da thu (Ping -> 127.0.0.1, thiet
    bi that tra 'no route to host'). Het day thi tra khung KHONG CON con tro,
    may khach hieu la xong va dung — khac thiet bi that o cho thiet bi chay
    mai den khi bam Stop. Ghi ro trong ISSUES.md, KHONG bia them dong.
    """
    dd = tuple(duong_dan)
    if lenh == L_BAT_DAU:
        # Thiet bi that tu choi ngay mot so cong cu — tra dung loi do
        if dd in LOI_TRUY_VAN:
            ma, mo = LOI_TRUY_VAN[dd]
            _ghi(f"[truy van] {'/'.join(map(str, dd))} -> thiet bi tu choi "
                 f"0x{ma:x}" + (f" '{mo.decode()}'" if mo else ""))
            return _khung_loi(duong_dan, so_hieu, ma_phien, ma, mo)
        with ph.dieu_kien_day:
            ph.tv_id_ke_tiep = getattr(ph, "tv_id_ke_tiep", 0) + 1
            ma = ph.tv_id_ke_tiep
            # BAT DAU tu khung nao? Xem _la_khung_ack() — 7 cong cu co khung
            # dau trong kho la ACK Start, ma may chu DA tu sinh ACK ngay duoi
            # day. Neu khong bo qua thi lan poll dau tra ACK LAN HAI: lech mot
            # nhip so voi thiet bi that. Do that 2026-08-28 tren [77].
            ph.truy_van[ma] = {"duong_dan": dd, "i": _bo_qua_ack_dau(dd)}
        _ghi(f"[truy van] BAT DAU {'/'.join(map(str, dd))} -> id {ma}")
        return _ack(duong_dan, so_hieu, ma_phien, ma)

    ma = t.get(T_ID)
    if lenh == L_HUY_TV:
        ph.truy_van.pop(ma, None)
        _ghi(f"[truy van] HUY {'/'.join(map(str, dd))} id {ma}")
        return _ack(duong_dan, so_hieu, ma_phien)

    # getall trong mot phien truy van
    tv = ph.truy_van.get(ma)
    if tv is None or tv["duong_dan"] != dd:
        # Thiet bi that tra dung loi nay khi id khong con — da do that
        return _khung_loi(duong_dan, so_hieu, ma_phien, LOI_KHONG_CO)

    day = KHO_QUERY.get(dd) or []
    i = tv["i"]
    if i >= len(day):
        # Het khung that -> tra khung RONG, KHONG con tro => may khach dung
        return [(T_PHIEN, 0x88, [ma_phien]), (T_DUONG_DAN, 0x88, list(dd)),
                (T_LOAI, 0x09, 2), (T_SO_HIEU, 0x08, so_hieu)]
    tv["i"] = i + 1
    ra = []
    for ten, kieu, gt in m2.giai_ma(day[i])["the"]:
        if ten == T_PHIEN:
            gt = [ma_phien]
        elif ten == T_SO_HIEU:
            gt = so_hieu
        ra.append((ten, kieu, gt))
    return ra


def _day_cho_cac_phien(duong_dan, truong, tru_phien=None):
    """
    Day doi tuong vua doi cho MOI phien dang dang ky duong dan nay.

    DO THAT (B_identity_set__day0.bin): goi day gom
        Uff0001 = [id phien nhan]     <- KHONG phai duong dan
        Uff0002 = [duong dan bi doi]
        ... cac truong da doi ...
        uff0003 = 2
        uff0006 = so hieu
    Luc do thiet bi KHONG day goi nao cho [20,35] vi khong phien nao dang ky
    duong dan ay — nen o day cung chi day cho ai da dang ky.
    """
    if not truong:
        return
    dd = tuple(duong_dan)
    with _khoa:
        cac = list(_phien.items())
    for ma, p in cac:
        if ma == tru_phien or dd not in p.dang_ky:
            continue
        p.them_goi_day([(T_PHIEN, 0x88, [ma]),
                        (T_DUONG_DAN, 0x88, list(dd))]
                       + [(t, k, v) for t, (k, v) in truong.items()])


def _khung_loi(duong_dan, so_hieu, ma_phien, ma_loi, mo_ta=None):
    """
    Khung LOI. DO THAT tren [14,3] ngay 2026-08-25
    (reference/khung_ghi/L1_*.bin 68 byte, L3_*.bin 96 byte):

        Uff0001 = [id phien]
        Uff0002 = [duong dan]
        uff0008 = MA LOI          <- 0xfe0004 "khong co doi tuong"
                                     0xfe0006 "thieu truong bat buoc"
        uff0003 = 2
        uff0004 = 2               <- CHI xuat hien o khung loi, khong co o ACK
        uff0006 = so hieu
        [sff0009 = mo ta chu]     <- chi co khi thiet bi co loi giai thich,
                                     vi du 'name or regexp required'
    """
    the = [(T_PHIEN, 0x88, [ma_phien]),
           (T_DUONG_DAN, 0x88, list(duong_dan)),
           (0xFF0008, 0x08, ma_loi),
           (T_LOAI, 0x09, 2),
           (0xFF0004, 0x09, 2),
           (T_SO_HIEU, 0x08, so_hieu)]
    if mo_ta is not None:
        the.append((0xFF0009, 0x21, mo_ta))
    return the


def _ack(duong_dan, so_hieu, ma_phien, ma_moi=None):
    """
    Khung tra loi cho mot thao tac GHI.

    DO THAT (reference/khung_ghi/): B/D/E__tl0.bin deu dung 4 the va 55 byte;
    rieng C__tl0.bin (them dong) co them ufe0001 = id moi, 60 byte.
    KHONG duoc them bot the nao khac.
    """
    the = [(T_PHIEN, 0x88, [ma_phien]),
           (T_DUONG_DAN, 0x88, list(duong_dan))]
    if ma_moi is not None:
        the.append((T_ID, _kieu_id(ma_moi), ma_moi))
    the += [(T_LOAI, 0x09, 2), (T_SO_HIEU, 0x08, so_hieu)]
    return the


def _xu_ly_ghi(duong_dan, lenh, cac_the, so_hieu, ma_phien):
    """
    Thi hanh mot lenh ghi len kho. Tra ve (the_tra_loi, truong_da_doi).

    `truong_da_doi` dung de DAY cho cac phien khac dang dang ky duong dan nay.
    """
    truong = {t: (k, v) for t, k, v in cac_the
              if t not in kho_cau_hinh.HE_THONG and t != T_ID}
    ma_dong = next((v for t, k, v in cac_the if t == T_ID), None)

    if lenh == L_SUA_MUC:
        KHO.dat_scalar(duong_dan, truong)
        day = truong
        tl = _ack(duong_dan, so_hieu, ma_phien)
    elif lenh == L_SUA_DONG:
        if not _co_dong(duong_dan, ma_dong):
            return _khung_loi(duong_dan, so_hieu, ma_phien, LOI_KHONG_CO), None
        KHO.sua_dong(duong_dan, ma_dong, truong)
        day = dict(truong)
        day[T_ID] = (_kieu_id(ma_dong), ma_dong)
        tl = _ack(duong_dan, so_hieu, ma_phien)
    elif lenh == L_THEM_DONG:
        ma_moi = KHO.them_dong(duong_dan, truong, _id_lon_nhat_goc(duong_dan))
        day = dict(truong)
        day[T_ID] = (_kieu_id(ma_moi), ma_moi)
        tl = _ack(duong_dan, so_hieu, ma_phien, ma_moi)
    elif lenh == L_XOA_DONG:
        if not _co_dong(duong_dan, ma_dong):
            return _khung_loi(duong_dan, so_hieu, ma_phien, LOI_KHONG_CO), None
        KHO.xoa_dong(duong_dan, ma_dong)
        # Ma goc: ObjectMap.remove dat obj.ufe0013 = 1 de danh dau da xoa
        day = {T_ID: (_kieu_id(ma_dong), ma_dong), 0xFE0013: (0x09, 1)}
        tl = _ack(duong_dan, so_hieu, ma_phien)
    elif lenh == L_DOI_CHO:
        ma_sau = next((v for t, k, v in cac_the if t == 0xFE0005), 0xFFFFFFFF)
        if not KHO.doi_cho(duong_dan, ma_dong, ma_sau):
            return _khung_loi(duong_dan, so_hieu, ma_phien, LOI_KHONG_CO), None
        day = None      # thiet bi that khong day gi cho lenh doi cho
        tl = _ack(duong_dan, so_hieu, ma_phien)
    else:
        return None, None
    KHO.luu()
    return tl, day


def _co_dong(duong_dan, ma_dong):
    """Dong `ma_dong` co ton tai khong (tinh ca khung goc lan kho)."""
    if ma_dong is None:
        return False
    sua, xoa = KHO.lop_phu_bang(duong_dan)
    if ma_dong in xoa:
        return False
    if ma_dong in sua:
        return True
    goc = KHO_TRA_LOI.get(tuple(duong_dan))
    if goc is None:
        return False
    for ten, kieu, gt in m2.giai_ma(goc)["the"]:
        if ten == T_DU_LIEU and isinstance(gt, list):
            for m in gt:
                if any(t == T_ID and v == ma_dong for t, k, v in m.get("the", [])):
                    return True
    return False


class H(BaseHTTPRequestHandler):
    protocol_version = "HTTP/1.1"
    server_version = "Mikrotik HttpProxy"
    sys_version = ""

    # ---------------------------------------------------------------- tinh
    def _tra(self, ma, than, kieu="text/html"):
        self.send_response(ma)
        self.send_header("Content-Type", kieu)
        self.send_header("Content-Length", str(len(than)))
        self.end_headers()
        try:
            self.wfile.write(than)
        except (BrokenPipeError, ConnectionResetError):
            pass

    def do_GET(self):
        p = self.path.split("?", 1)[0]
        if p == "/":
            p = "/index.html"
        elif p == "/webfig" or p == "/webfig/":
            p = "/webfig/index.html"
        # Menu ☰ cua WebFig co 8 muc; hai muc tro toi trang RIENG, khong phai
        # SPA. Do that 2026-08-28 tren hEX S:
        #     GET /graphs            -> 200 text/html 225 byte (goi /graph.css)
        #     GET /help/license.html -> 200 text/html 17 890 byte
        # `/graphs` KHONG co duoi tep nen phai anh xa tay, neu khong bang MIME
        # tra application/octet-stream va trinh duyet TAI VE thay vi hien.
        elif p == "/graphs" or p == "/graphs/":
            p = "/graphs.html"
        # `/files/` thiet bi that tra **403**, khong phai 404 — cung do that
        # cung dot. Tra 404 la sai hop dong.
        elif p.rstrip("/") == "/files":
            return self._tra(403, b"403 Forbidden", "text/html")

        # GET /jsproxy/?<uri da ma hoa> = ham fetchFile() trong master-min.js,
        # dung de tai tep phu (vd skins/default.json).
        # Ma goc: if(status==200) cb(text) else cb(null) — nen tra 404 la SPA
        # van chay tiep binh thuong, CHI CAN TRA LOI NGAY.
        # LOI DA MAC: truoc do em cho 20 giay roi moi tra 204 -> loadSkin()
        # khong goi duoc callback -> man hinh dung o chu "Loading".
        if p.startswith("/jsproxy"):
            # !!! PHAI GIAI MA CA GOI NAY, du sau do tra 404 !!!
            # fetchFile() dung Session.encryptURI(), ma ham do CUNG tieu thu
            # dong khoa RC4 chieu len VA tang txseq:
            #     var seq=this.txseq; this.txseq += str.length+8;
            #     return word2str(id)+word2str(seq)
            #            + txEnc.encrypt(str) + txEnc.encrypt(padding);
            # Neu may chu bo qua, dong khoa RC4 hai ben lech vinh vien va moi
            # goi POST sau do deu hong. Trieu chung trong nhat ky:
            #     [tep] GET /jsproxy/ -> 404
            #     [loi] goi co seq=606 nhung dang doi seq=580
            # (580 chinh la goi GET nay — no khong bao gio duoc tieu thu).
            #
            # Chuoi truy van: encodeURIComponent(decodeZeros(...)), tuc moi
            # BYTE thanh mot ky tu rồi ma hoa UTF-8. Giai nguoc: bo phan tram
            # -> chuoi -> lay ma tung ky tu lam byte.
            ten_tep = "(khong ro)"
            if "?" in self.path:
                try:
                    chuoi = unquote(self.path.split("?", 1)[1])
                    goi = bytes(ord(c) & 0xFF for c in chuoi)
                    ma_phien = struct.unpack(">I", goi[:4])[0]
                    ph = _phien.get(ma_phien)
                    if ph is not None:
                        _, _, tho = ph.giai_goi(goi)
                        ten_tep = tho.decode("utf-8", "replace")
                except Exception as e:
                    _ghi(f"[tep] GET khong giai duoc: {e}")
            _ghi(f"[tep] xin tep {ten_tep!r} -> 404 (khong co, SPA van chay tiep)")
            return self._tra(404, b"", "text/plain")

        duong_dan = os.path.normpath(os.path.join(WWW, p.lstrip("/")))
        if not duong_dan.startswith(WWW) or not os.path.isfile(duong_dan):
            return self._tra(404, b"404 Not Found", "text/plain")
        kieu = MIME.get(os.path.splitext(duong_dan)[1], "application/octet-stream")
        with open(duong_dan, "rb") as f:
            self._tra(200, f.read(), kieu)

    # ------------------------------------------------------------- jsproxy
    def do_POST(self):
        if self.path.split("?", 1)[0] != "/jsproxy":
            return self._tra(404, b"404 Not Found", "text/plain")

        n = int(self.headers.get("Content-Length", 0))
        goi = self.rfile.read(n)

        # --- Bat tay: 40 byte, 8 byte dau bang 0 ---
        if len(goi) == 40 and goi[:8] == b"\x00" * 8:
            khoa_cong_khach = goi[8:40]
            khoa_rieng = os.urandom(32)
            with _khoa:
                ma_phien = _id_ke_tiep[0]
                _id_ke_tiep[0] += 1
                _phien[ma_phien] = mat_ma.PhienMayChu(
                    ma_phien, khoa_rieng, khoa_cong_khach)
            than = (struct.pack(">I", ma_phien) + b"\x00" * 4
                    + mat_ma.khoa_cong(khoa_rieng))
            _ghi(f"[bat tay] cap id phien {ma_phien}")
            return self._tra(200, than, "msg")

        # --- Goi da ma hoa ---
        if len(goi) < 16:
            return self._tra(400, b"", "msg")
        ma_phien = struct.unpack(">I", goi[:4])[0]
        ph = _phien.get(ma_phien)
        if ph is None:
            _ghi(f"[loi] khong co phien {ma_phien}")
            return self._tra(400, b"", "msg")

        # giai_goi() tu cho den luot theo `seq` — xem chu thich trong mat_ma.py
        try:
            _, seq_goi, tho = ph.giai_goi(goi)
        except Exception as e:
            _ghi(f"[loi] giai goi that bai (phien {ma_phien}): {e}")
            return self._tra(400, b"", "msg")

        try:
            yc = m2.giai_ma_than(tho)
        except Exception as e:
            _ghi(f"[loi] doc khung M2 that bai: {e}")
            return self._tra(400, b"", "msg")

        t = _the_thanh_dict(yc["the"])
        so_hieu = t.get(T_SO_HIEU, 0)
        duong_dan = t.get(T_PHIEN) or []          # trong YEU CAU, ff0001 = duong dan
        lenh = t.get(T_LENH)

        # Lenh DANG NHAP nhan ra bang the 0x000001 (ten) + 0x000003 (mat khau),
        # va KHONG co duong dan — xem ham doAuth() trong master-min.js.
        la_dang_nhap = (0x000001 in t and 0x000003 in t and not duong_dan)

        # KENH CHO DAI: ham post_notification_request() gui yeu cau RONG
        # (chi co the Sff001c ma post() tu them). Thiet bi that GIU ket noi
        # den khi co du lieu moi. Neu tra loi ngay thi ham do tu goi lai
        # chinh no lien tuc -> trinh duyet quay vong khong nghi.
        # Nhan biet: khong duong dan, khong lenh, khong phai dang nhap.
        la_kenh_cho = (not duong_dan and lenh is None and not la_dang_nhap)

        if la_kenh_cho:
            # Cho toi 25 s xem co goi DAY nao khong. Co thi tra ngay — day
            # chinh la cach thiet bi that bao cho cac trang khac biet du lieu
            # vua doi (do that o reference/khung_ghi/*__day0.bin).
            the = ph.lay_goi_day(2, so_hieu)
            if the is None:
                the = [(T_PHIEN, 0x88, [ma_phien]), (T_LOAI, 0x09, 2),
                       (T_SO_HIEU, 0x08, so_hieu)]
        elif la_dang_nhap:
            _ghi(f"[dang nhap] tai khoan={t.get(0x000001, b'')!r}")
            the = _tra_loi_dang_nhap(so_hieu, ma_phien)
        else:
            mo_ta = "/".join(map(str, duong_dan)) or "(khong co duong dan)"
            _ghi(f"[yc] seq={seq_goi} duong_dan={mo_ta} lenh={lenh} "
                 f"so_hieu={so_hieu} ({len(yc['the'])} the)")
            if lenh == L_DANG_KY:
                ph.dang_ky.add(tuple(duong_dan))
            elif lenh == L_HUY_DANG_KY:
                ph.dang_ky.discard(tuple(duong_dan))

            tv = LENH_TRUY_VAN.get(tuple(duong_dan))
            if tv and lenh in (tv.get("start"), tv.get("cancel")):
                the = _xu_ly_truy_van(
                    duong_dan,
                    L_BAT_DAU if lenh == tv.get("start") else L_HUY_TV,
                    t, so_hieu, ma_phien, ph)
            # Cong cu kieu ACTION ([24,25] Supout, [29] Bandwidth, [29,2] Speed
            # Test, [27,53] Import .ovpn) HOI TIEN DO bang `pollcmd` RIENG cua
            # no, khong phai getall 0xfe0004. Do that 2026-08-28: Supout dung
            # 0xfe0010, Bandwidth/Speed Test dung 0x1, Import .ovpn dung 0x193.
            # Thieu nhanh nay thi bam Start xong thanh tien do dung im.
            elif tv and lenh == tv.get("poll") and T_ID in t:
                the = _xu_ly_truy_van(duong_dan, None, t, so_hieu, ma_phien, ph)
            elif tuple(duong_dan) in KHO_WIZARD and lenh is None:
                the = _xu_ly_wizard(duong_dan, so_hieu, ma_phien, ph)
            elif (lenh is not None and 0 < lenh < DOIT_CMD_TOI_DA
                    and tuple(duong_dan) in DOIT_BIET):
                the = _xu_ly_doit(duong_dan, lenh, so_hieu, ma_phien)
            elif lenh in (L_TERM_MO, L_TERM_DONG, L_TERM_GO, L_TERM_CO):
                the = _xu_ly_terminal(lenh, t, so_hieu, ma_phien, ph)
            elif lenh in (L_BAT_DAU, L_HUY_TV) or (
                    lenh is None or lenh == 0xFE0004) and (
                    tuple(duong_dan) in KHO_QUERY and T_ID in t):
                the = _xu_ly_truy_van(duong_dan, lenh, t, so_hieu, ma_phien, ph)
            elif lenh in (L_SUA_MUC, L_SUA_DONG, L_THEM_DONG, L_XOA_DONG,
                          L_DOI_CHO):
                the, day = _xu_ly_ghi(duong_dan, lenh, yc["the"], so_hieu, ma_phien)
                if day:
                    _day_cho_cac_phien(duong_dan, day, tru_phien=ma_phien)
                _ghi(f"[ghi] duong_dan={mo_ta} lenh=0x{lenh:x} "
                     f"-> {len(day) if day else 0} truong day di")
            else:
                # 0xfe0003 co trong YEU CAU = trinh duyet dang xin TRANG TIEP
                the = _tra_loi_cho(duong_dan, so_hieu, ma_phien, ph,
                                   co_con_tro=(0xFE0003 in t or 0xFE0015 in t),
                                   lenh=lenh)

        # QUAN TRONG — magic=False:
        # Than goi tra ve la MOT DAY khung, moi khung mo dau bang 2 BYTE DO DAI
        # (big-endian, TINH CA 2 byte do). Ham buffer2msgs() trong ma goc:
        #     len = (arr[pos]<<8)|arr[pos+1];
        #     arr[pos]=0x4d; arr[pos+1]=0x32;      // GHI DE thanh 'M2'
        #     buffer2msg(...); pos += len;
        # Tuc tren day KHONG BAO GIO co 'M2' o tang ngoai cung — chinh client
        # ghi de vao. Do la ly do cac khung em bat duoc luc truoc lai thay 'M2':
        # em bat SAU khi client da sua tai cho (lai dung cai bay do 1 lan nua).
        # Neu may chu gui 'M2' that thi client doc do dai = 0x4d32 = 19762 va
        # nem 'RangeError: Invalid typed array length: 19762'.
        # RIENG khung LONG NHAU thi VAN co 'M2' that (buffer2msg kiem
        # arr[0]==0x4d && arr[1]==0x32) — nen chi doi o tang ngoai cung.
        noi_dung = m2.dung_than(the, magic=False)
        with ph.khoa_gui:
            goi_ra = ph.dung_goi(noi_dung)
        return self._tra(200, goi_ra, "msg")

    def log_message(self, *a):
        pass


def main():
    try:
        if os.path.exists(NHAT_KY):
            os.remove(NHAT_KY)
    except Exception:
        pass
    print("=" * 64)
    print("  GIA LAP MikroTik hEX S — RouterOS/WebFig 7.14.3")
    print("=" * 64)
    print(f"  Dia chi   : http://localhost:{CONG}/")
    print(f"  Tai nguyen: {WWW}")
    print(f"  Du lieu   : {len(KHO_TRA_LOI)} duong dan lenh co du lieu that")
    print("  Dang nhap : admin / admin")
    print(f"  Nhat ky   : {NHAT_KY}")
    print("  (Ctrl+C de dung)")
    print("=" * 64)
    try:
        with ThreadingHTTPServer(("0.0.0.0", CONG), H) as srv:
            srv.serve_forever()
    except KeyboardInterrupt:
        print("\n  Dung.")


if __name__ == "__main__":
    main()
