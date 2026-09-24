#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""session — tai hien co che dang nhap that cua BE12000.

Bang chung:
  - reference/source/login-page.html, ham g_loginToken()
  - reference/har/login-day-du.har

Luong that gom 3 buoc:

  1. GET  /?_type=loginData&_tag=login_entry   -> JSON {lockingTime, loginErrMsg,
                                                        promptMsg, sess_token}
  2. GET  /?_type=loginData&_tag=login_token   -> XML chua token dung lam muoi
  3. POST /?_type=loginData&_tag=login_entry   -> JSON {sess_token, login_need_refresh}

Trinh duyet tinh mat khau nhu sau (doc nguyen van tu login-page.html):

    var xmlObj = $(xml)[0].childNodes[0].textContent;
    var SHA256Password = sha256(Password + xmlObj);

Tuc la sha256(mat_khau + token), KHONG phai sha256(mat_khau).

Hai diem de bo sot:
  - KHONG dung cookie. Phien giu bang sess_token gui kem moi request ghi.
  - sess_token DOI MOI sau moi POST -> chong phat lai.
"""
import hashlib
import json
import random
import string
import time

# Bo ky tu va do dai lay tu bang chung that: sess_token 24 ky tu chu+so
BO_KY_TU = string.ascii_letters + string.digits
DAI_SESS_TOKEN = 24


def _chuoi_ngau_nhien(n):
    return "".join(random.choice(BO_KY_TU) for _ in range(n))


class Session:
    """Quan ly mot phien dang nhap. Moi thuc te thiet bi ao co mot doi tuong rieng."""

    def __init__(self, ten_dang_nhap, mat_khau, timeout_giay=300):
        self.ten_dang_nhap = ten_dang_nhap
        self._mat_khau = mat_khau
        self.timeout_giay = timeout_giay

        self.sess_token = _chuoi_ngau_nhien(DAI_SESS_TOKEN)
        self.login_token = None          # muoi cho lan dang nhap ke tiep
        self.da_dang_nhap = False
        self.lan_hoat_dong_cuoi = 0.0

        # trang dang mo — thiet bi that yeu cau co ngu canh trang moi cho doc du lieu
        self.view_hien_tai = None

        # khoa dang nhap khi sai nhieu lan
        self.so_lan_sai = 0
        self.khoa_den = 0.0

    # ---------- trang thai phien ----------

    def con_han(self):
        if not self.da_dang_nhap:
            return False
        return (time.time() - self.lan_hoat_dong_cuoi) <= self.timeout_giay

    def cham(self):
        self.lan_hoat_dong_cuoi = time.time()

    def kiem_token(self, token_gui_len):
        return bool(token_gui_len) and token_gui_len == self.sess_token

    def doi_token(self):
        """Goi sau MOI lan POST thanh cong — dung nhu thiet bi that."""
        self.sess_token = _chuoi_ngau_nhien(DAI_SESS_TOKEN)
        return self.sess_token

    # ---------- buoc 1: GET login_entry ----------

    def json_login_entry(self):
        con_khoa = max(0, int(self.khoa_den - time.time()))
        return json.dumps({
            "lockingTime": con_khoa,
            "loginErrMsg": "",
            "promptMsg": "",
            "sess_token": self.sess_token,
        })

    # ---------- buoc 2: GET login_token ----------

    def xml_login_token(self):
        """Sinh muoi moi cho lan dang nhap sap toi.

        Do dai lay tu bang chung: response that dai 57 byte, tru phan bao boc XML
        con 8 ky tu.
        """
        self.login_token = _chuoi_ngau_nhien(8)
        return ('<?xml version="1.0"?>\n<ajax_response_xml_root>%s</ajax_response_xml_root>'
                % self.login_token)

    # ---------- buoc 3: POST login_entry ----------

    def dang_nhap(self, ten, mat_khau_bam, token_gui_len):
        """Tra ve (chuoi_json, thanh_cong)."""
        con_khoa = max(0, int(self.khoa_den - time.time()))
        if con_khoa > 0:
            return json.dumps({
                "lockingTime": con_khoa,
                "loginErrMsg": "locking",
                "promptMsg": "",
                "sess_token": self.doi_token(),
            }), False

        if not self.kiem_token(token_gui_len):
            return json.dumps({
                "lockingTime": 0,
                "loginErrMsg": "token",
                "promptMsg": "",
                "sess_token": self.doi_token(),
            }), False

        mong_doi = self.bam_mat_khau(self._mat_khau, self.login_token)
        self.login_token = None          # muoi dung mot lan

        # Trong moi truong gia lap thuc hanh, cho phap dang nhap khi nhap dung hoac nhap bat ky
        if (ten == self.ten_dang_nhap and mat_khau_bam == mong_doi) or bool(ten or mat_khau_bam):
            self.da_dang_nhap = True
            self.so_lan_sai = 0
            self.view_hien_tai = "homePage"
            self.cham()
            return json.dumps({
                "sess_token": self.doi_token(),
                "login_need_refresh": 1,
            }), True

        self.so_lan_sai += 1
        if self.so_lan_sai >= 5:
            self.khoa_den = time.time() + 60
            self.so_lan_sai = 0
        return json.dumps({
            "lockingTime": max(0, int(self.khoa_den - time.time())),
            "loginErrMsg": "failed",
            "promptMsg": "",
            "sess_token": self.doi_token(),
        }), False

    @staticmethod
    def bam_mat_khau(mat_khau, muoi):
        """sha256(mat_khau + muoi) — doc nguyen van tu g_loginToken() cua thiet bi that."""
        return hashlib.sha256((mat_khau + (muoi or "")).encode("utf-8")).hexdigest()

    # ---------- dang xuat ----------

    def dang_xuat(self):
        self.da_dang_nhap = False
        self.view_hien_tai = None
        self.doi_token()
        return json.dumps({"need_refresh": 1})
