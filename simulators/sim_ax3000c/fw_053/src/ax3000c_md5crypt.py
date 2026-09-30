#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
md5-crypt ($1$) thuần Python — dùng chung cho mọi thiết bị OpenWrt/OUI.

Lý do có tệp này: module `crypt` của Python bị gỡ từ 3.13, máy anh Huynn có thể
chạy bản mới. Thuật toán là md5-crypt chuẩn (Poul-Henning Kamp), không phụ thuộc
thư viện ngoài.

Đã đối chiếu với thiết bị thật AX3000CV2 (oui.ui crypt, đo 2026-09-25):
    md5crypt("Abcdefgh!234", "") == "$1$$FRurQi53/cpZJ57atMeRc1"
    md5crypt("", "")             == "$1$$qRPK7m23GJusamGpoGLby/"
"""
import hashlib

_ITOA64 = "./0123456789ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz"


def _to64(v, n):
    s = ""
    for _ in range(n):
        s += _ITOA64[v & 0x3f]
        v >>= 6
    return s


def md5crypt(mat_khau, muoi=""):
    pw = mat_khau.encode("utf-8")
    salt = muoi.encode("utf-8")[:8]
    magic = b"$1$"
    ctx = hashlib.md5(pw + magic + salt)
    fin = hashlib.md5(pw + salt + pw).digest()
    n = len(pw)
    while n > 0:
        ctx.update(fin[:min(16, n)])
        n -= 16
    i = len(pw)
    while i:
        ctx.update(b"\x00" if i & 1 else pw[:1])
        i >>= 1
    fin = ctx.digest()
    for i in range(1000):
        c = hashlib.md5()
        c.update(pw if i & 1 else fin)
        if i % 3:
            c.update(salt)
        if i % 7:
            c.update(pw)
        c.update(fin if i & 1 else pw)
        fin = c.digest()
    out = ""
    for a, b, cc in ((0, 6, 12), (1, 7, 13), (2, 8, 14), (3, 9, 15), (4, 10, 5)):
        out += _to64((fin[a] << 16) | (fin[b] << 8) | fin[cc], 4)
    out += _to64(fin[11], 2)
    return "$1$" + salt.decode("utf-8") + "$" + out


if __name__ == "__main__":
    assert md5crypt("Abcdefgh!234") == "$1$$FRurQi53/cpZJ57atMeRc1"
    assert md5crypt("") == "$1$$qRPK7m23GJusamGpoGLby/"
    print("md5crypt: 2/2 trung thiet bi that")
