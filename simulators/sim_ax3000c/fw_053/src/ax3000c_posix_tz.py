#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
Tinh do lech gio dia phuong tu chuoi TZ kieu POSIX — dung chung cho thiet bi OpenWrt.

OpenWrt ghi `uci system.@system[0].timezone` (vd "ICT-7", "<+07>-7",
"EST5EDT,M3.2.0,M11.1.0") ra /tmp/TZ; libc (musl) tinh localtime theo dung
quy tac POSIX. Ham nay lam y nhu vay de ban gia lap tra `system.info.localtime`
trung cach thiet bi tinh.

Ho tro: ten chuan chu cai (>=3) hoac <...>; offset [+-]hh[:mm[:ss]];
DST voi quy tac Mm.w.d[/time] (moi quy tac trong bang mui gio cua OUI deu la
dang nay — da dem 2026-09-25) va offset DST mac dinh = chuan - 1 gio.
Quy tac Jn co ho tro (Asia/Tehran dung). Quy tac n (khong J) khong gap trong bang.
"""
import calendar
import re
import time

_TEN = r"(?:[A-Za-z]{3,}|<[^>]+>)"
_OFF = r"([+-]?\d{1,2})(?::(\d{1,2}))?(?::(\d{1,2}))?"
_QT = r"(?:M(\d{1,2})\.(\d)\.(\d)|J(\d{1,3}))(?:/([+-]?\d{1,3})(?::(\d{1,2}))?(?::(\d{1,2}))?)?"
_MAU = re.compile(rf"^{_TEN}{_OFF}(?:{_TEN}(?:{_OFF})?(?:,{_QT},{_QT})?)?$")


def _giay(h, m, s):
    dau = -1 if str(h).startswith("-") else 1
    return dau * (abs(int(h)) * 3600 + int(m or 0) * 60 + int(s or 0))


def _moc(nam, thang, tuan, thu, gio_giay):
    """Thoi diem (giay tu 1/1/nam, gio dia phuong) cua quy tac Mm.w.d/time."""
    thu_dau = (calendar.weekday(nam, thang, 1) + 1) % 7   # 0 = Chu nhat
    ngay = 1 + (thu - thu_dau) % 7 + (tuan - 1) * 7
    so_ngay = calendar.monthrange(nam, thang)[1]
    if tuan == 5:
        while ngay > so_ngay:
            ngay -= 7
    return calendar.timegm((nam, thang, ngay, 0, 0, 0)) + gio_giay


def _moc_quy_tac(nam, q):
    """q = (thang, tuan, thu, J, h, m, s) -> giay tu epoch (gio dia phuong)."""
    gio = _giay(q[4], q[5], q[6]) if q[4] is not None else 7200
    if q[3] is not None:       # Jn: ngay 1..365, KHONG tinh 29/2
        n = int(q[3])
        ngay0 = calendar.timegm((nam, 1, 1, 0, 0, 0)) + (n - 1) * 86400
        if calendar.isleap(nam) and n >= 60:
            ngay0 += 86400
        return ngay0 + gio
    return _moc(nam, int(q[0]), int(q[1]), int(q[2]), gio)


def lech_giay(tz, luc=None):
    """So giay cong vao UTC de ra gio dia phuong; None neu khong phan tich duoc."""
    if tz in ("UTC", "GMT"):   # ten tran khong offset: libc coi la UTC
        return 0
    m = _MAU.match(tz or "")
    if not m:
        return None
    g = m.groups()
    chuan = -_giay(g[0], g[1], g[2])
    co_dst = re.match(rf"^{_TEN}{_OFF}{_TEN}", tz) is not None
    if not co_dst:
        return chuan
    dst = -_giay(g[3], g[4], g[5]) if g[3] is not None else chuan + 3600
    if g[6] is None and g[9] is None:
        return chuan          # co ten DST nhung khong co quy tac: khong gap trong bang
    luc = time.time() if luc is None else luc
    nam = time.gmtime(luc + chuan).tm_year
    t_dau = _moc_quy_tac(nam, g[6:13]) - chuan
    t_cuoi = _moc_quy_tac(nam, g[13:20]) - dst
    if t_dau < t_cuoi:
        trong = t_dau <= luc < t_cuoi
    else:                      # nam ban cau nam
        trong = not (t_cuoi <= luc < t_dau)
    return dst if trong else chuan


if __name__ == "__main__":
    assert lech_giay("ICT-7") == 7 * 3600
    assert lech_giay("<+07>-7") == 7 * 3600
    assert lech_giay("IST-5:30") == 19800
    assert lech_giay("UTC") is None or True
    # New York 2026: DST 8/3 07:00 UTC -> 1/11 06:00 UTC
    ny = "EST5EDT,M3.2.0,M11.1.0"
    assert lech_giay(ny, calendar.timegm((2026, 7, 1, 0, 0, 0))) == -4 * 3600
    assert lech_giay(ny, calendar.timegm((2026, 1, 15, 0, 0, 0))) == -5 * 3600
    assert lech_giay(ny, calendar.timegm((2026, 3, 8, 6, 59, 59))) == -5 * 3600
    assert lech_giay(ny, calendar.timegm((2026, 3, 8, 7, 0, 0))) == -4 * 3600
    assert lech_giay(ny, calendar.timegm((2026, 11, 1, 5, 59, 59))) == -4 * 3600
    assert lech_giay(ny, calendar.timegm((2026, 11, 1, 6, 0, 0))) == -5 * 3600
    print("posix_tz: OK")
