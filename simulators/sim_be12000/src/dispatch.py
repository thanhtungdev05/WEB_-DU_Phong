#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""dispatch — lop giao van cua BE12000.

Thiet bi that KHONG co file trang rieng. Moi thu di qua mot URL duy nhat la '/',
phan luong bang tham so _type va _tag:

    GET  /?_type=menuView&_tag=<viewTag>&Menu3Location=<n>   -> manh HTML cua trang
    GET  /?_type=menuData&_tag=<dataTag>                     -> XML du lieu
    POST /?_type=menuData&_tag=<dataTag>                     -> GHI, tra XML trang thai moi
    GET/POST /?_type=loginData&_tag=<entry>                  -> dang nhap / dang xuat
    GET/POST /?_type=hiddenData&_tag=<entry>                 -> doi ngon ngu, gio he thong

Hai hanh vi de bo sot, deu da xac minh tren thiet bi that:

  1. menuData YEU CAU NGU CANH TRANG. Goi menuData ma chua nap menuView cua trang
     chua no -> thiet bi tra <IF_ERRORSTR>SessionTimeout</IF_ERRORSTR>, HTTP van 200.
  2. GHI dung CHUNG endpoint voi DOC, phan biet bang HTTP method.
"""
import json
import os
import re

# ---- ban do dataTag -> viewTag duoc phep goi no (sinh tu spec/cgi-map.json) ----
# Nap luc chay de khong hardcode.

# index.html (khung SPA sau dang nhap) nhung "_sessionTmpToken" NGAY TRONG
# INLINE <script>, dang hex-escape moi ky tu (vd \x51\x42...). Bang chung:
# reference/source/index.html (chup 2026-08-03) co 2 dong gan gia tri nay,
# va khi so voi token that chup lai 2026-08-05 tren cung thiet bi thi KHAC
# nhau -> thiet bi that RENDER token nay o phia server moi lan phuc vu '/',
# khong phai gia tri tinh. Neu ta chi tra file tinh (nhu tai_nguyen() lam),
# _sessionTmpToken cua client se mai la gia tri cu tu luc chup HTML, khong
# bao gio khop voi session.sess_token dang song -> MOI Apply/POST deu bi
# tra SessionTimeout -> JS dung chung (index.html) tu dong lam
# top.location.href = top.location.href -> ca trang bi RELOAD VE HOME.
# Day la loi chan TOAN BO muc 4 cua du an, khong rieng trang nao.
#
# PHAT HIEN THEM (2026-08-05, xac minh bang thu nghiem that tren sim sau khi
# da sua index.html): MOI FILE views/<viewTag>.html CUNG co dong
# "_sessionTmpToken = "\x.." RIENG, chup cung luc voi HTML trang do tu thiet
# bi that (vd views/EnergyMode.html dong 486). menuView tra fragment HTML nay
# qua AJAX, jQuery .html() TU DONG CHAY LAI script nhung trong do -> GHI DE
# _sessionTmpToken vua duoc dat dung o index.html bang gia tri CU cua RIENG
# trang do. Da tai hien: bam Apply that tren EnergyMode van bi dieu huong ve
# Home dau da sua index.html, vi window._sessionTmpToken luc bam la gia tri
# cu chup san trong EnergyMode.html, khong phai token song. Vi vay menu_view()
# CUNG phai thay the nhu trang_chu(), khong rieng gi index.html.
# Xem missing-evidence.md ban 19.
_MAU_TOKEN_JS = re.compile(
    r'(_sessionTmpToken\s*=\s*")((?:\\x[0-9a-fA-F]{2})+)(")'
)


def _hex_escape(chuoi):
    return "".join("\\x%02x" % ord(c) for c in chuoi)


class Dispatcher:

    def __init__(self, thu_muc_src, store, session, ban_do_ngu_canh):
        self.src = thu_muc_src
        self.views = os.path.join(thu_muc_src, "views")
        self.www = os.path.join(thu_muc_src, "www")
        self.store = store
        self.session = session
        # {dataTag: set(viewTag duoc phep)}
        self.ngu_canh = ban_do_ngu_canh

    # ---------- menuView ----------

    def co_view(self, view_tag):
        return os.path.exists(self._duong_dan_view(view_tag))

    def _duong_dan_view(self, view_tag):
        if not re.fullmatch(r"[A-Za-z0-9_]+", view_tag or ""):
            return os.path.join(self.views, "__khong_hop_le__")
        return os.path.join(self.views, view_tag + ".html")

    def _thay_token_song(self, html, token_hien_tai):
        """Thay MOI cho xuat hien _sessionTmpToken=hex-escape trong html bang
        token dang song. Dung chung cho ca index.html (trang_chu) va tung
        fragment views/*.html (menu_view) — xem ghi chu bang chung o dau file."""
        the_moi = _hex_escape(token_hien_tai)
        html, _ = _MAU_TOKEN_JS.subn(
            lambda m: m.group(1) + the_moi + m.group(3), html)
        return html

    def trang_chu(self, token_hien_tai):
        """Tra ve (noi_dung, content_type) cho index.html, DA thay the
        _sessionTmpToken tinh bang token dang song cua session hien tai.

        Xem ghi chu o dinh file ve ly do can ham nay (khong phai chi la
        toi uu — thieu no thi moi Apply/POST tren TOAN BO trang deu that bai).
        """
        du_lieu, kieu = self.tai_nguyen("index.html")
        if du_lieu is None:
            return du_lieu, kieu
        html = self._thay_token_song(du_lieu.decode("utf-8"), token_hien_tai)
        return html.encode("utf-8"), kieu

    def menu_view(self, view_tag, token_hien_tai=None):
        """Tra ve (noi_dung, content_type, ma_http).

        token_hien_tai: BAT BUOC truyen vao (session.sess_token dang song) de
        thay the _sessionTmpToken cu chup san trong tung file views/*.html —
        neu khong, script nhung trong fragment se GHI DE token dung vua duoc
        dat o index.html bang gia tri cu, lam MOI Apply/POST tren trang do
        that bai. Xem ghi chu bang chung o dau file.
        """
        duong_dan = self._duong_dan_view(view_tag)
        if not os.path.exists(duong_dan):
            return self._trang_404(), "text/html; charset=utf-8", 404
        with open(duong_dan, "r", encoding="utf-8") as f:
            html = f.read()
        if token_hien_tai is not None:
            html = self._thay_token_song(html, token_hien_tai)
        # ghi nhan ngu canh: day chinh la trang dang mo
        self.session.view_hien_tai = view_tag
        return html, "text/html; charset=utf-8", 200

    # ---------- menuData: DOC ----------

    def menu_data_doc(self, data_tag, tham_so=None):
        if not self.store.co_data_tag(data_tag):
            return self._trang_404(), "text/html; charset=utf-8", 404

        # ngoai le thu 3: van ban thuan, khong XML/JSON (bang chung:
        # dms_querydir_lua.lua, xem config_store.duong_dan_tho_cho()).
        # tham_so o day la CAC THAM SO URL cua request GET (vd querydir=...),
        # KHAC voi tham_so trong menu_data_ghi (than POST) — chi dataTag khai
        # bao dinhDangDoc=="duong_dan_tho" moi dung nhanh nay, khong anh huong
        # dataTag khac.
        if self.store.dinh_dang(data_tag) == "duong_dan_tho":
            return (self.store.duong_dan_tho_cho(data_tag, tham_so or {}),
                    "text/plain; charset=utf-8", 200)

        # ngoai le: mot vai dataTag than JSON thay vi XML (bang chung: WLANMLO)
        if self.store.dinh_dang(data_tag) == "json":
            kieu = "application/json; charset=utf-8"
            if not self._dung_ngu_canh(data_tag):
                return self.store.json_cho(data_tag, ma_loi="SessionTimeout"), kieu, 200
            return self.store.json_cho(data_tag), kieu, 200

        # ngoai le khac: JSON THO khong boc IF_ERROR* (bang chung: topo_lua.lua)
        if self.store.dinh_dang(data_tag) == "json_tho":
            kieu = "application/json; charset=utf-8"
            # CHUA co bang chung dinh dang loi/SessionTimeout cho nhanh nay —
            # tam thoi khong chan theo ngu_canh de tranh bia dinh dang loi.
            return self.store.json_tho_cho(data_tag), kieu, 200

        if not self._dung_ngu_canh(data_tag):
            return (self.store.xml_cho(data_tag, ma_loi="SessionTimeout"),
                    "text/xml; charset=utf-8", 200)

        return self.store.xml_cho(data_tag), "text/xml; charset=utf-8", 200

    def _dung_ngu_canh(self, data_tag):
        """Thiet bi that chi tra du lieu khi trang chua dataTag do dang mo."""
        cho_phep = self.ngu_canh.get(data_tag)
        if not cho_phep:
            return True          # chua co bang chung rang buoc -> khong chan
        return self.session.view_hien_tai in cho_phep

    # ---------- menuData: GHI ----------

    def menu_data_ghi(self, data_tag, tham_so):
        """POST. Tra ve (noi_dung, content_type, ma_http, ghi_chu).

        Quy tac lay tu reference/har/sntp-apply.har:
          - bat buoc co IF_ACTION, _InstID, _sessionTOKEN
          - client gui TOAN BO truong cua form, ke ca truong an va ca hai nut
          - response la XML, tra ve luon trang thai MOI cua doi tuong
        """
        if not self.store.co_data_tag(data_tag):
            return self._trang_404(), "text/html; charset=utf-8", 404, "khong co dataTag"

        # ngoai le HOAN TOAN KHAC hop dong: endpoint TAI FILE (Content-Disposition
        # download), body la multipart/form-data (KHONG phai urlencoded, KHONG
        # co _sessionTOKEN — dung TOKEN_DOWNLOAD/TOKEN_WIFILOG_DOWNLOAD rieng
        # cua form thay the, xem missing-evidence.md [2026-08-07]). Phai xu ly
        # TRUOC buoc kiem _sessionTOKEN thong thuong vi truong do khong ton tai
        # trong request that. Bang chung that noi dung RONG (thiet bi chua co
        # log) — xem config_store.la_tai_file_rong().
        if self.store.la_tai_file_rong(data_tag):
            return b"", "application/octet-stream;", 200, "tai file (rong, dung bang chung that)"

        if not self.session.kiem_token(tham_so.get("_sessionTOKEN")):
            return (self.store.xml_cho(data_tag, ma_loi="SessionTimeout"),
                    "text/xml; charset=utf-8", 200, "token sai")

        bo_qua = {"IF_ACTION", "_InstID", "_sessionTOKEN"}
        gia_tri = {k: v for k, v in tham_so.items()
                   if k not in bo_qua and not k.startswith("Btn_")}

        # dataTag KIEU JSON co cay luu tru rieng (jsonDataTags), khong dung
        # chung doi_tuong_cua()/ghi()/xml_ghi_thanhcong() cua nhanh XML.
        # Bang chung: reference/vantay/IgmpWLANCONF-apply.that.post.json
        # (multicast_model.lua) - response la JSON thuan, khong boc trong
        # <ajax_response_xml_root>. Xem missing-evidence.md ban 23.
        if self.store.dinh_dang(data_tag) == "json":
            tat_ca_doi, tat_ca_la = [], []
            for ten_obj in self.store.doi_tuong_json_cua(data_tag):
                da_doi, khong_biet = self.store.ghi_json(data_tag, ten_obj, gia_tri)
                tat_ca_doi += ["%s.%s" % (ten_obj, x) for x in da_doi]
                tat_ca_la += khong_biet

            self.store.luu()
            self.session.doi_token()
            self.session.cham()

            ghi_chu = "doi: %s" % (", ".join(tat_ca_doi) or "khong co gi")
            if tat_ca_la:
                ghi_chu += " | tham so la: %s" % ", ".join(sorted(set(tat_ca_la)))
            return (self.store.json_ghi_thanhcong(data_tag),
                    "application/json; charset=utf-8", 200, ghi_chu)

        # doi tuong KIEU DANH SACH (them/xoa item qua "Create New Item"/thung rac) —
        # phai xu ly RIENG truoc nhanh ghi() thong thuong, vi _InstID=-1 (tao moi)
        # khong tuong ung instance nao co san de ghi (), va Delete khong duoc ghi() ho
        # tro. Bang chung: xem config_store.la_doi_tuong_danh_sach()/tao_instance_moi()/
        # xoa_instance() (2026-08-06, Local Service Control IPv4/IPv6).
        danh_sach_ten_obj = self.store.doi_tuong_cua(data_tag)
        if danh_sach_ten_obj and self.store.la_doi_tuong_danh_sach(danh_sach_ten_obj[0]):
            ten_obj = danh_sach_ten_obj[0]
            # truong_id: ten truong ID cua doi tuong nay — mac dinh "_InstID",
            # nhung mot so doi tuong (vd OBJ_FWPT_ID/Port Trigger) dung ten
            # DAY DU tien to doi tuong (vd "OBJ_FWPT_ID._OBJ_InstID"). Xem
            # config_store.truong_id_danh_sach() (2026-08-06).
            truong_id = self.store.truong_id_danh_sach(ten_obj)
            hanh_dong = tham_so.get("IF_ACTION", "")
            tham_so_moi = dict(tham_so)
            if hanh_dong == "Delete":
                da_xoa = self.store.xoa_instance(ten_obj, tham_so.get(truong_id, ""))
                self.store.luu()
                self.session.doi_token()
                self.session.cham()
                tham_so_moi[truong_id] = ""
                ghi_chu = "xoa instance %s: %s" % (
                    tham_so.get(truong_id, ""), "thanh cong" if da_xoa else "khong tim thay")
                return (self.store.xml_ghi_thanhcong(data_tag, tham_so_moi, ghi_de_dang="xoa_gon",
                                                       truong_id_the=truong_id),
                        "text/xml; charset=utf-8", 200, ghi_chu)

            thuoc_obj = {k: v for k, v in gia_tri.items()
                         if k in self.store.thu_tu_para(data_tag, ten_obj) and k != truong_id}
            inst_id_gui = tham_so.get(truong_id, "")
            if inst_id_gui == "-1":
                moi_id = self.store.tao_instance_moi(ten_obj, thuoc_obj)
                tham_so_moi[truong_id] = moi_id or ""
                ghi_chu = "tao instance moi: %s" % (moi_id or "that bai")
            else:
                da_doi, khong_biet = self.store.ghi_theo_instid(ten_obj, inst_id_gui, thuoc_obj)
                ghi_chu = "sua instance %s: doi %s" % (inst_id_gui, ", ".join(da_doi) or "khong co gi")
            self.store.luu()
            self.session.doi_token()
            self.session.cham()
            return (self.store.xml_ghi_thanhcong(data_tag, tham_so_moi, ghi_de_dang="rut_gon",
                                                   truong_id_the=truong_id),
                    "text/xml; charset=utf-8", 200, ghi_chu)

        # doi tuong KIEU CHI SO (sua NHIEU instance CO SAN trong 1 POST duy nhat,
        # dung hau to _<n> — vd Remote Service Port Control: _InstNum=5,
        # _InstID_0.._InstID_4, ServPort_0..ServPort_4). Bang chung: xem
        # config_store.la_doi_tuong_chi_so() (2026-08-06).
        if danh_sach_ten_obj and self.store.la_doi_tuong_chi_so(danh_sach_ten_obj[0]):
            ten_obj = danh_sach_ten_obj[0]
            thu_tu = self.store.thu_tu_para(data_tag, ten_obj)
            try:
                so_luong = int(tham_so.get("_InstNum", "0") or "0")
            except ValueError:
                so_luong = 0
            tong_doi = []
            for i in range(so_luong):
                inst_id_i = tham_so.get("_InstID_%d" % i, "")
                if not inst_id_i:
                    continue
                thuoc_obj = {}
                for truong in thu_tu:
                    if truong == "_InstID":
                        continue
                    khoa = "%s_%d" % (truong, i)
                    if khoa in tham_so:
                        thuoc_obj[truong] = tham_so[khoa]
                if thuoc_obj:
                    da_doi, _ = self.store.ghi_theo_instid(ten_obj, inst_id_i, thuoc_obj)
                    tong_doi += ["%s.%s" % (inst_id_i, x) for x in da_doi]
            self.store.luu()
            self.session.doi_token()
            self.session.cham()
            ghi_chu = "sua %d instance: %s" % (so_luong, ", ".join(tong_doi) or "khong co gi doi")
            return (self.store.xml_ghi_thanhcong(data_tag, tham_so, ghi_de_dang="xac_nhan_trong"),
                    "text/xml; charset=utf-8", 200, ghi_chu)

        # dataTag co QUY TRINH 2 BUOC (IF_ACTION khac nhau, moi buoc ghi/
        # khong ghi va dang response RIENG) — phai xu ly TRUOC nhanh ghi
        # 1-lan thong thuong. Bang chung: config_store.hanh_dong_theo_buoc()
        # (2026-08-06, IPv6 Switch — Apply khong ghi, Restart moi that su ghi
        # va kich hoat reboot thiet bi that).
        buoc_hanh_dong = self.store.hanh_dong_theo_buoc(data_tag)
        hanh_dong_hien_tai = tham_so.get("IF_ACTION", "")
        if buoc_hanh_dong and hanh_dong_hien_tai in buoc_hanh_dong:
            cau_hinh_buoc = buoc_hanh_dong[hanh_dong_hien_tai]
            tat_ca_doi, tat_ca_la = [], []
            if cau_hinh_buoc.get("ghi", True):
                for ten_obj in self.store.doi_tuong_cua(data_tag):
                    thuoc_obj = {k: v for k, v in gia_tri.items()
                                 if k in self.store.thu_tu_para(data_tag, ten_obj)}
                    if not thuoc_obj:
                        continue
                    da_doi, khong_biet = self.store.ghi(ten_obj, thuoc_obj)
                    tat_ca_doi += ["%s.%s" % (ten_obj, x) for x in da_doi]
                    tat_ca_la += khong_biet
                self.store.luu()
                # Token CHI xoay o buoc THAT SU ghi (bang chung: token giong
                # het nhau giua buoc Apply va Restart cua IPv6 Switch).
                self.session.doi_token()
            self.session.cham()
            ghi_chu = "buoc %s: %s" % (hanh_dong_hien_tai, ", ".join(tat_ca_doi) or "khong ghi")
            return (self.store.xml_ghi_thanhcong(data_tag, tham_so,
                                                   ghi_de_dang=cau_hinh_buoc.get("dang")),
                    "text/xml; charset=utf-8", 200, ghi_chu)

        tat_ca_doi, tat_ca_la = [], []
        for ten_obj in self.store.doi_tuong_cua(data_tag):
            thuoc_obj = {k: v for k, v in gia_tri.items()
                         if k in self.store.thu_tu_para(data_tag, ten_obj)}
            if not thuoc_obj:
                continue
            # Mac dinh ghi vao instance 0 (dung cho ~70 dataTag chi co 1
            # instance/khong can chon). Vai object CO NHIEU instance nhung
            # dataTag KHONG dung co che danh-sach chuan (khong _InstID, dinh
            # danh qua 1 truong rieng cua chinh object) - xem
            # config_store.chi_so_ghi_mac_dinh() (2026-08-07, OBJ_PORT_BINDING_ID).
            # Object khong khai bao "chonTheoTruong" van tra ve 0 nhu cu.
            vi_tri = self.store.chi_so_ghi_mac_dinh(ten_obj, tham_so)
            da_doi, khong_biet = self.store.ghi(ten_obj, thuoc_obj, inst=vi_tri)
            tat_ca_doi += ["%s.%s" % (ten_obj, x) for x in da_doi]
            tat_ca_la += khong_biet

        self.store.luu()
        self.session.doi_token()
        self.session.cham()

        ghi_chu = "doi: %s" % (", ".join(tat_ca_doi) or "khong co gi")
        if tat_ca_la:
            ghi_chu += " | tham so la: %s" % ", ".join(sorted(set(tat_ca_la)))
        # Response GHI thanh cong: dinh dang khac nhau tuy dataTag (KHONG co
        # quy tac chung), chon qua dataTags[tag]["ghiDangKieu"] du lieu.
        # Xem config_store.xml_ghi_thanhcong() de biet cac dang da biet.
        return (self.store.xml_ghi_thanhcong(data_tag, tham_so),
                "text/xml; charset=utf-8", 200, ghi_chu)

    # ---------- tai nguyen tinh ----------

    KIEU = {
        ".html": "text/html; charset=utf-8", ".htm": "text/html; charset=utf-8",
        ".css": "text/css", ".js": "application/javascript",
        ".png": "image/png", ".gif": "image/gif", ".jpg": "image/jpeg",
        ".svg": "image/svg+xml", ".ico": "image/x-icon", ".ttf": "font/ttf",
    }

    def tai_nguyen(self, duong_dan_url):
        an_toan = os.path.normpath(duong_dan_url.lstrip("/")).replace("\\", "/")
        if an_toan.startswith("..") or os.path.isabs(an_toan):
            return None, None
        thuc = os.path.join(self.www, *an_toan.split("/"))
        if not os.path.isfile(thuc):
            outer = os.path.join(os.path.dirname(self.src), "www", *an_toan.split("/"))
            if os.path.isfile(outer):
                thuc = outer
            else:
                return None, None
        with open(thuc, "rb") as f:
            du_lieu = f.read()
        kieu = self.KIEU.get(os.path.splitext(thuc)[1].lower(), "application/octet-stream")
        return du_lieu, kieu

    # ---------- 404 giong that ----------

    def _trang_404(self):
        return ("<html>\n    <head>\n        <title>404 Not Found</title>\n"
                "    </head>\n    <body>\n        <h1>404 Not Found</h1>\n"
                "    </body>\n</html>")


def nap_ban_do_ngu_canh(duong_dan_cgi_map):
    """Doc spec/cgi-map.json -> {dataTag: set(viewTag)}.

    Ban do nay sinh tu quan sat that: khi mo trang X thi trinh duyet goi dataTag nao.
    """
    if not os.path.exists(duong_dan_cgi_map):
        return {}
    with open(duong_dan_cgi_map, "r", encoding="utf-8") as f:
        cgi = json.load(f)
    ban_do = {}
    for _, muc in (cgi.get("dataTagsByRoute") or {}).items():
        view = muc.get("defaultViewTag")
        for tag in muc.get("observedDataTags") or []:
            ban_do.setdefault(tag, set()).add(view)
    return ban_do
