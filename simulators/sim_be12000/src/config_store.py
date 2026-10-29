#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""config_store — NVRAM ao cua BE12000.

Day la NGUON SU THAT DUY NHAT cua ban gia lap. Moi trang doc va ghi qua day.
Khong trang nao duoc hardcode gia tri (CLAUDE.md muc 3.1).

Mo hinh du lieu bam theo dung hinh dang XML ma thiet bi that tra ve:

    OBJ_<TEN>_ID  ->  danh sach Instance  ->  cac cap ParaName/ParaValue co THU TU

Thu tu tham so quan trong: response phai giu dung thu tu nhu thiet bi that.

Khong dung bien toan cuc. Moi thuc the (instance thiet bi ao) tao mot doi tuong
ConfigStore rieng voi duong dan state rieng -> chay song song duoc kieu GNS3.
"""
import json
import os
import shutil
import threading
import time

# Nhung tham so KHONG phai cau hinh ma la gia tri DONG, sinh lai moi lan doc.
# Bang chung: CurrentLocalTime khac nhau giua hai lan chup
#   sntp_data     -> 1970-01-01T02:37:57
#   sntp_lua.lua  -> 1970-01-01T02:09:16
# Thiet bi that chua dong bo duoc NTP nen dong ho dem tu 1970-01-01 theo uptime.
TRUONG_DONG = {
    ("OBJ_SNTP_ID", "CurrentLocalTime"),
}

_FACTORY_CACHE = None
_FACTORY_LOCK = threading.Lock()


def _get_factory_data(duong_dan_factory):
    global _FACTORY_CACHE
    if _FACTORY_CACHE is None:
        with _FACTORY_LOCK:
            if _FACTORY_CACHE is None:
                with open(duong_dan_factory, "r", encoding="utf-8") as f:
                    _FACTORY_CACHE = json.load(f)
    return _FACTORY_CACHE


class ConfigStore:

    def __init__(self, duong_dan_state, duong_dan_factory):
        """duong_dan_state: file JSON luu trang thai hien tai cua thuc the nay.
        duong_dan_factory: cau hinh xuat xuong, sinh tu bang chung that."""
        self.duong_dan_state = duong_dan_state
        self.duong_dan_factory = duong_dan_factory
        self._khoa = threading.RLock()
        self._khoi_dong = time.time()
        self._nap()

    # ---------- gia tri dong ----------

    def uptime_giay(self):
        return int(time.time() - self._khoi_dong)

    def _gia_tri_dong(self, ten_obj, ten_para, gia_tri_luu):
        """Sinh gia tri cho cac truong dong. Truong khac tra nguyen gia tri da luu."""
        if (ten_obj, ten_para) == ("OBJ_SNTP_ID", "CurrentLocalTime"):
            return time.strftime("%Y-%m-%dT%H:%M:%S", time.gmtime(self.uptime_giay()))
        return gia_tri_luu

    # ---------- nap / luu ----------

    def _nap(self):
        import copy
        if os.path.exists(self.duong_dan_state):
            try:
                with open(self.duong_dan_state, "r", encoding="utf-8") as f:
                    self._state = json.load(f)
            except Exception:
                self._state = copy.deepcopy(_get_factory_data(self.duong_dan_factory))
        else:
            self._state = copy.deepcopy(_get_factory_data(self.duong_dan_factory))
        self._state.setdefault("jsonDataTags", {})
        self._hop_nhat_factory()

    def _hop_nhat_factory(self):
        """Bo sung dataTag / doi tuong MOI tu factory vao state cu.

        Ly do phai co (loi da mac 2026-08-03): khi bo sung bang chung moi thi
        factory.json co them dataTag, nhung file state cua nguoi dung tao truoc do
        van thieu -> server tra 404 cho tag do. Nguoi dung khong biet phai xoa state.

        Chi BO SUNG cai con thieu. Tuyet doi khong ghi de gia tri nguoi dung da doi.
        """
        with open(self.duong_dan_factory, "r", encoding="utf-8") as f:
            factory = json.load(f)

        them_tag, them_obj, them_para = [], [], []
        them_khoa_meta = []

        for tag, muc in factory.get("dataTags", {}).items():
            if tag not in self._state.setdefault("dataTags", {}):
                self._state["dataTags"][tag] = muc
                them_tag.append(tag)
                continue
            # dataTag da co san — bo sung cac KHOA META con thieu (renderOrder,
            # scalarTags, ghiRutGon, v.v.) ma KHONG dung o giai doan cau hinh
            # nguoi dung, de tranh phai xoa state moi khi bo sung bang chung
            # cau truc moi (giong loi da mac voi dataTag/objects/para).
            cu_tag = self._state["dataTags"][tag]
            for khoa, gia_tri in muc.items():
                if khoa in ("objects", "paraOrder"):
                    continue  # da co co che rieng, khong dung cho o day
                if khoa not in cu_tag:
                    cu_tag[khoa] = gia_tri
                    them_khoa_meta.append("%s.%s" % (tag, khoa))

        for ten_obj, muc in factory.get("objects", {}).items():
            cu = self._state.setdefault("objects", {}).get(ten_obj)
            if cu is None:
                self._state["objects"][ten_obj] = muc
                them_obj.append(ten_obj)
                continue
            for ten_para in muc.get("paraOrder", []):
                if ten_para not in cu.setdefault("paraOrder", []):
                    cu["paraOrder"].append(ten_para)
            for i, inst_f in enumerate(muc.get("instances", [])):
                if i >= len(cu.setdefault("instances", [])):
                    cu["instances"].append(dict(inst_f))
                    continue
                for ten_para, gia_tri in inst_f.items():
                    if ten_para not in cu["instances"][i]:
                        cu["instances"][i][ten_para] = gia_tri
                        them_para.append("%s.%s" % (ten_obj, ten_para))
            # bo sung cac KHOA META khac cua object (vd "danhSach", "paraOrderGhiChu")
            # con thieu o state cu — cung ly do voi them_khoa_meta cua dataTags o
            # duoi: bang chung/co che moi them vao factory sau nay khong duoc tu
            # dong co mat trong state nguoi dung da tao truoc do. Bang chung
            # (2026-08-06): "danhSach" moi them cho OBJ_FWSC_ID/OBJ_FWSCv6_ID.
            for khoa, gia_tri in muc.items():
                if khoa in ("objects", "paraOrder", "instances"):
                    continue
                if khoa not in cu:
                    cu[khoa] = gia_tri
                    them_khoa_meta.append("objects.%s.%s" % (ten_obj, khoa))

        them_json = []
        for tag, muc in factory.get("jsonDataTags", {}).items():
            if tag not in self._state.setdefault("jsonDataTags", {}):
                self._state["jsonDataTags"][tag] = muc
                them_json.append(tag)

        # jsonThoDataTags (2026-08-06, topo_lua.lua/mmTopology): cung nhanh
        # bo sung nhu jsonDataTags o tren, tranh lap lai loi "loi da mac
        # 2026-08-03" cho nhanh JSON THO moi them.
        them_json_tho = []
        for tag, muc in factory.get("jsonThoDataTags", {}).items():
            if tag not in self._state.setdefault("jsonThoDataTags", {}):
                self._state["jsonThoDataTags"][tag] = muc
                them_json_tho.append(tag)

        if them_tag or them_obj or them_para or them_json or them_json_tho or them_khoa_meta:
            self.luu()
            print("  [store] bo sung tu factory: %d dataTag, %d doi tuong, %d tham so, "
                  "%d dataTag-json, %d dataTag-json-tho, %d khoa meta"
                  % (len(them_tag), len(them_obj), len(them_para), len(them_json),
                     len(them_json_tho), len(them_khoa_meta)))
            if them_tag:
                print("  [store] dataTag moi: %s" % ", ".join(sorted(them_tag)))
            if them_json:
                print("  [store] dataTag-json moi: %s" % ", ".join(sorted(them_json)))
            if them_json_tho:
                print("  [store] dataTag-json-tho moi: %s" % ", ".join(sorted(them_json_tho)))
            if them_khoa_meta:
                print("  [store] khoa meta bo sung: %s" % ", ".join(sorted(them_khoa_meta)))

    def luu(self):
        """Duy tri trang thai an toan trong RAM theo phien KTV, khong lam nghen I/O dia."""
        pass

    def khoi_phuc_xuat_xuong(self):
        """Restore Default cua thiet bi that tu RAM cache cuc nhanh."""
        import copy
        with self._khoa:
            self._state = copy.deepcopy(_get_factory_data(self.duong_dan_factory))
            self._state.setdefault("jsonDataTags", {})

    # ---------- tra cuu ----------

    def co_data_tag(self, data_tag):
        return data_tag in self._state["dataTags"] or data_tag in self._state.get("jsonDataTags", {})

    def dinh_dang(self, data_tag):
        """Vai dataTag tra ve JSON thay vi XML (bang chung: wlan_mlo_model.lua,
        reference/vantay/WLANMLO.menudata.0-0.json - than JSON, khong phai XML).

        "json_tho": mot nhanh KHAC voi "json" o tren — bang chung
        (reference/source/data/topo_lua.lua, topo_lua.lua/mmTopology) cho
        thay response la JSON THO, KHONG theo khuon {IF_ERRORID,...}
        cua json_cho(): {"slave":[...],"master":{...},"ad":{"MGET_INST_NUM":0}}.
        Khong ep vao khuon json_cho() vi se bia them truong IF_ERROR* ma
        thiet bi that khong tra. Dung json_tho_cho() rieng, tra nguyen van
        noi dung da luu trong jsonThoDataTags."""
        if data_tag in self._state.get("jsonThoDataTags", {}):
            return "json_tho"
        if data_tag in self._state.get("jsonDataTags", {}):
            return "json"
        muc_tag = self._state["dataTags"].get(data_tag) or {}
        if muc_tag.get("dinhDangDoc") == "duong_dan_tho":
            # dms_querydir_lua.lua (2026-08-07, reference/har/dms-querydir.har):
            # response KHONG phai XML/JSON, la VAN BAN THUAN dang
            # "<duong_dan_da_di_qua>|<ten_con_1>/<ten_con_2>/.../" (client tu
            # parse bang split "/" — xem views/dms.html ham showPath()/showFile()).
            # Day la NGOAI LE THU 3 ve dinh dang (sau xml/json), rieng cho
            # dataTag nay, khong anh huong dinh_dang() cua dataTag khac.
            return "duong_dan_tho"
        return "xml"

    def duong_dan_tho_cho(self, data_tag, tham_so):
        """Response van ban thuan cho dataTag duyet thu muc (vd DMS).

        Bang chung DUY NHAT (2026-08-07, reference/har/dms-querydir.har):
        request "querydir=/mnt/" -> response "/mnt/|" (echo lai chinh xac
        duong dan da gui, KHONG co ten thu muc/file con nao sau dau "|" —
        vi thiet bi that KHONG co USB/luu tru nao cam vao, nhat quan voi
        OBJ_USBDEV_ID rong o usb_homepage_lua.lua). CHUA CO bang chung cho
        truong hop CO thu muc con thuc su (chua tung thay may that co USB) —
        KHONG bia danh sach thu muc, chi echo lai duong dan + "|" rong.
        tham_so["thamSoDuongDan"] (mac dinh "querydir") chi ten tham so URL
        chua duong dan can echo.
        """
        muc_tag = self._state["dataTags"].get(data_tag) or {}
        ten_tso = muc_tag.get("thamSoDuongDan", "querydir")
        duong_dan = (tham_so or {}).get(ten_tso, "")
        return duong_dan + "|"

    def la_tai_file_rong(self, data_tag):
        """True neu dataTag nay la endpoint TAI FILE (Content-Disposition
        download qua POST multipart/form-data — KHAC hoan toan hop dong
        menuData XML chuan) MA bang chung that cho thay noi dung file RONG.

        Bang chung (2026-08-07, reference/har/logmgr-downloads.har, entry 33
        va 44 — do_download_syslog.lua/do_download_wifilog.lua): request la
        multipart/form-data (KHONG co _sessionTOKEN, chi co TOKEN_DOWNLOAD/
        TOKEN_WIFILOG_DOWNLOAD rieng cua form), response THAT co
        Content-Length: 0, Content-Type: application/octet-stream; (RONG
        HOAN TOAN) — vi thiet bi that hien khong co log nao de tai (SysLogEnable=0).
        Nhat quan voi trang thai "chua co du lieu that" cua thiet bi dang mo
        phong. do_download_seclog.lua CHUA co bang chung (chua bam thu) nen
        KHONG duoc dua vao day — van tra 404 nhu cu, xem missing-evidence.md.
        """
        muc_tag = self._state["dataTags"].get(data_tag) or {}
        return muc_tag.get("dinhDangGhi") == "tai_file_rong"

    def hanh_dong_theo_buoc(self, data_tag):
        """Vai dataTag co QUY TRINH 2 BUOC voi 2 gia tri IF_ACTION khac nhau,
        moi buoc ghi/khong ghi va tra dang response RIENG — khac han da so
        dataTag (1 IF_ACTION="Apply" duy nhat, ghi xong tra ve dang co dinh).

        Bang chung (2026-08-06, reference/vantay/IPv6Switch-apply.that.post.json,
        anh Huynn tu tay xac nhan cho phep test that vi thao tac nay lam
        THIET BI THAT REBOOT): trang IPv6 Switch (ipv6_enable_lua.lua) khi bam
        Apply, JS gui LIEN TIEP 2 request CUNG dataTag, KHAC _sessionTOKEN
        giua chung LA KHONG DOI (token chi xoay o buoc THAT SU ghi):
          1. IF_ACTION=Apply — CHUA ghi gi vao NVRAM (chi la buoc xac nhan/
             kiem tra truoc khi hoi "Are you sure to go ahead?"). Response
             dang xac_nhan_trong (INSTIDENTITY=echo _InstID, khong _InstID,
             khong du lieu object).
          2. IF_ACTION=Restart — THAT SU ghi IPv6EnableSet moi, kich hoat
             reboot thiet bi. Response dang day_du_gioi_han (header PARAM,
             TYPE,STR,ID, KHONG INSTIDENTITY, KHONG _InstID, CHI du lieu
             object OBJ_IPGLOBAL_ID).

        Cau hinh trong dataTags[tag]["hanhDongTheoBuoc"] = {
            "<IF_ACTION>": {"ghi": bool, "dang": "<ghiDangKieu>"}, ...
        }. Neu IF_ACTION gui len KHONG co trong bang nay (hoac dataTag
        khong khai bao truong nay), dung nhanh xu ly mac dinh (ghi 1 lan,
        1 dang response co dinh) nhu moi dataTag khac — KHONG anh huong gi
        den 70+ dataTag da co truoc do.
        """
        muc_tag = self._state["dataTags"].get(data_tag) or {}
        return muc_tag.get("hanhDongTheoBuoc")

    def json_tho_cho(self, data_tag):
        """Response JSON THO (khong boc IF_ERROR*) cho cac dataTag ngoai le.

        Bang chung: reference/source/data/topo_lua.lua (Topology, mmTopology),
        chup nguyen ban tu thiet bi that:
            {"slave":[],"master":{"SoftwareVer":"V3.0.12P2N2",...
             "MacAddr":"aa:bb:cc:00:00:02" (da sanitize, trung placeholder
             dung o ethWanStatus),"instID":"MESH.CONTROLLER",...},
             "ad":{"MGET_INST_NUM":0}}
        Chi 1 mau bang chung, khong co topo phu (mesh) that de doi chieu —
        gia dinh "slave":[] va cac truong khac giu nguyen khi khong co thiet
        bi mesh nao khac, ghi ISSUES neu sai."""
        import json as _json
        muc = self._state.get("jsonThoDataTags", {}).get(data_tag) or {}
        return _json.dumps(muc.get("raw", {}), ensure_ascii=False)

    def doi_tuong_cua(self, data_tag):
        """Danh sach ten OBJ ma mot dataTag tra ve."""
        muc = self._state["dataTags"].get(data_tag)
        return list(muc["objects"]) if muc else []

    def thu_tu_para(self, data_tag, ten_obj):
        """Tap truong + thu tu ma RIENG dataTag nay tra ve cho doi tuong do.

        Quan trong: moi dataTag chi tra ve mot TAP CON tham so cua doi tuong.
        Vi du OBJ_FWLEVEL_ID:
          firewall_config_lua.lua   -> _InstID, Enable, Level
          firewall_homepage_lua.lua -> _InstID, Level, AntiAttack
        Tra thua truong la sai hop dong voi thiet bi that.
        """
        muc = self._state["dataTags"].get(data_tag) or {}
        rieng = (muc.get("paraOrder") or {}).get(ten_obj)
        if rieng:
            return list(rieng)
        obj = self._state["objects"].get(ten_obj) or {}
        return list(obj.get("paraOrder") or [])

    def instances(self, ten_obj):
        obj = self._state["objects"].get(ten_obj)
        return obj["instances"] if obj else []

    def doc(self, ten_obj, ten_para, inst=0, mac_dinh=None):
        ds = self.instances(ten_obj)
        if inst >= len(ds):
            return mac_dinh
        return ds[inst].get(ten_para, mac_dinh)

    # ---------- ghi ----------

    def chi_so_ghi_mac_dinh(self, ten_obj, tham_so):
        """Chon INDEX instance de ghi trong NHANH GHI MAC DINH (dataTag KHONG
        khai bao danhSach/chiSo — vi du OBJ_PORT_BINDING_ID: dataTag chi co 1
        IF_ACTION=Apply duy nhat, KHONG _InstID, KHONG Delete/Create, nhung
        object co NHIEU instance (2026-08-07, len 2 khi bo sung l2tp_internet).
        Request that CHI dinh danh instance can sua qua 1 TRUONG RIENG cua
        chinh object (WANViewName), khong phai qua co che danh-sach/_InstID
        chuan — vi vay KHONG dung la_doi_tuong_danh_sach() (co che do doi ca
        dinh dang response GHI sang "rut_gon", SAI voi bang chung that cua
        dataTag nay la "xac_nhan_trong").

        Neu objects[ten_obj]["chonTheoTruong"] = "<ten_truong>" duoc khai bao,
        tim instance co gia tri truong do khop voi tham_so.get(ten_truong).
        KHONG khai bao (mac dinh moi object khac) -> tra ve 0, giu NGUYEN
        HANH VI CU cho toan bo dataTag da xac minh truoc do.

        Bang chung: reference/har/portbinding.har entry 3/5 — 2 request Apply
        lien tiep, MOI request chi gui WANViewName+LANViewName (khong _InstID),
        gia tri WANViewName khac nhau (DEV.IP.IF2 roi DEV.IP.IF3) ung voi 2
        Instance khac nhau trong OBJ_PORT_BINDING_ID."""
        obj = self._state["objects"].get(ten_obj) or {}
        ten_truong = obj.get("chonTheoTruong")
        if not ten_truong:
            return 0
        gia_tri_can_tim = (tham_so or {}).get(ten_truong)
        if gia_tri_can_tim is None:
            return 0
        for i, muc in enumerate(self.instances(ten_obj)):
            if muc.get(ten_truong) == gia_tri_can_tim:
                return i
        return 0

    def ghi(self, ten_obj, cap_gia_tri, inst=0):
        """Ghi nhieu tham so cho mot instance. Tra ve danh sach truong THAT SU doi.

        Chi ghi de tham so DA TON TAI trong doi tuong. Tham so la thi bo qua va
        bao ve, vi khong co bang chung thiet bi that chap nhan no (NT-1).
        """
        with self._khoa:
            obj = self._state["objects"].get(ten_obj)
            if obj is None:
                return [], list(cap_gia_tri.keys())
            while len(obj["instances"]) <= inst:
                obj["instances"].append({})
            muc = obj["instances"][inst]

            da_doi, khong_biet = [], []
            for ten, gia_tri in cap_gia_tri.items():
                if (ten_obj, ten) in TRUONG_DONG:
                    continue                     # truong dong, khong luu
                if ten not in muc:
                    khong_biet.append(ten)
                    continue
                if muc[ten] != gia_tri:
                    muc[ten] = gia_tri
                    da_doi.append(ten)
            return da_doi, khong_biet

    # ---------- doi tuong KIEU DANH SACH (them/xoa item, vd Local Service Control) ----------
    # Bang chung (2026-08-06): reference/vantay/LocalServiceCtrl-apply.that.post.json,
    # LocalServiceCtrl-delete.that.post.json, LocalServiceCtrlV6-apply2.that.post.json,
    # LocalServiceCtrlV6-delete.that.post.json — tu lai (self-drive) thiet bi that theo
    # cho phep cua anh Huynn (2026-08-06). Nguoi dung bam "Create New Item", gui
    # _InstID=-1, server TU SINH _InstID moi dang "IGD.FWSc.FWSC<n>" (vd FWSC1 khi
    # danh sach dang rong, FWSC2 khi da co 1 item). Xoa gui _InstID that (khong phai -1)
    # voi IF_ACTION=Delete.
    #
    # GIA DINH (CHUA CO BANG CHUNG, ghi missing-evidence.md): n = so instance HIEN CO
    # trong danh sach + 1 (dua tren do dai danh sach, khong phai bo dem rieng biet ton
    # tai qua cac lan xoa) — chi kiem chung duoc voi danh sach tu rong tang dan (FWSC1
    # roi FWSC2), CHUA thu nghiem lai "tao - xoa - tao lai" de biet co cap phat lai
    # FWSC1 hay nhay len FWSC3. Danh dau object nay bang
    # self._state["objects"][ten_obj]["danhSach"] = {"tienToId": "IGD.FWSc.FWSC"}.

    def la_doi_tuong_danh_sach(self, ten_obj):
        obj = self._state["objects"].get(ten_obj) or {}
        return obj.get("danhSach")

    def truong_id_danh_sach(self, ten_obj):
        """Ten truong dung lam ID cho doi tuong KIEU DANH SACH. Mac dinh
        "_InstID" (OBJ_FWSC_ID, OBJ_FWSCv6_ID, OBJ_FWPM_ID — Local Service
        Control, Port Forwarding). Bang chung (2026-08-06,
        reference/vantay/PortTrigger-apply.that.post.json,
        PortTrigger-delete.that.post.json): OBJ_FWPT_ID (Port Trigger) dung
        ten TRUONG DAY DU tien to doi tuong "OBJ_FWPT_ID._OBJ_InstID" thay vi
        "_InstID" — ca trong request LAN response echo
        (<OBJ_FWPT_ID._OBJ_InstID>IGD.FWPT1</OBJ_FWPT_ID._OBJ_InstID> khi
        Apply, rong khi Delete). Cung dang truong day du da gap o
        OBJ_RIPNG_ID (route_ripng_m.lua). Khai bao qua
        danhSach.truongId; khong khai bao thi mac dinh "_InstID"."""
        obj = self._state["objects"].get(ten_obj) or {}
        danh_sach = obj.get("danhSach") or {}
        return danh_sach.get("truongId", "_InstID")

    def la_doi_tuong_chi_so(self, ten_obj):
        """Doi tuong KIEU 'sua nhieu instance CO SAN trong 1 POST duy nhat, dung hau
        to _<n>' (khac voi danhSach o tren la THEM/XOA item). Bang chung (2026-08-06):
        reference/vantay/RemoteServicePortCtrl-apply2.that.post.json — Remote Service
        Port Control gui 1 form voi 5 dong co san (_InstNum=5, _InstID_0.._InstID_4,
        ServPort_0..ServPort_4), khong co nut them/xoa dong."""
        obj = self._state["objects"].get(ten_obj) or {}
        return obj.get("danhSachChiSo")

    def chi_so_theo_instid(self, ten_obj, inst_id_value):
        truong_id = self.truong_id_danh_sach(ten_obj)
        for i, muc in enumerate(self.instances(ten_obj)):
            if muc.get(truong_id) == inst_id_value:
                return i
        return None

    def tao_instance_moi(self, ten_obj, cap_gia_tri):
        """Them 1 instance moi vao danh sach, tu sinh ID (truong ID xac dinh
        qua truong_id_danh_sach()). Tra ve gia tri ID moi (hoac None neu
        object khong phai kieu danh sach)."""
        with self._khoa:
            obj = self._state["objects"].get(ten_obj)
            danh_sach = (obj or {}).get("danhSach")
            if obj is None or not danh_sach:
                return None
            obj.setdefault("instances", [])
            so_hien_tai = len(obj["instances"])
            moi_id = "%s%d" % (danh_sach.get("tienToId", ""), so_hien_tai + 1)
            truong_id = danh_sach.get("truongId", "_InstID")
            thu_tu = obj.get("paraOrder") or []
            muc_moi = {ten: "" for ten in thu_tu}
            for ten, gia_tri in cap_gia_tri.items():
                if ten in muc_moi:
                    muc_moi[ten] = gia_tri
            muc_moi[truong_id] = moi_id  # ID luon la gia tri tu sinh, khong bi cap_gia_tri ghi de
            obj["instances"].append(muc_moi)
            return moi_id

    def ghi_theo_instid(self, ten_obj, inst_id_value, cap_gia_tri):
        """Sua 1 instance CO SAN trong danh sach, tim theo _InstID (khong phai vi
        tri). CHUA CO BANG CHUNG rieng cho truong hop sua (chi co bang chung tao moi
        va xoa) — suy luan hop ly tu cung 1 endpoint/dang response, ghi
        missing-evidence.md."""
        idx = self.chi_so_theo_instid(ten_obj, inst_id_value)
        if idx is None:
            return [], list(cap_gia_tri.keys())
        return self.ghi(ten_obj, cap_gia_tri, inst=idx)

    def xoa_instance(self, ten_obj, inst_id_value):
        """Xoa 1 instance theo _InstID. Tra ve True neu xoa duoc."""
        with self._khoa:
            obj = self._state["objects"].get(ten_obj)
            if obj is None:
                return False
            idx = self.chi_so_theo_instid(ten_obj, inst_id_value)
            if idx is None:
                return False
            obj["instances"].pop(idx)
            return True

    # ---------- doc/ghi doi tuong dataTag KIEU JSON (rieng, xem dinh_dang()) ----------
    # jsonDataTags co CAY LUU TRU RIENG voi dataTags/objects (XML) o tren —
    # KHONG dung chung ghi()/doi_tuong_cua(). Phat hien 2026-08-05 (ban 23):
    # multicast_model.lua (Multicast on Wi-Fi) la dataTag JSON DAU TIEN co
    # nut Apply — truoc do jsonDataTags chi dung de DOC (WLANMLO).

    def doi_tuong_json_cua(self, data_tag):
        """Danh sach ten object cua 1 dataTag KIEU JSON."""
        muc = self._state.get("jsonDataTags", {}).get(data_tag) or {}
        return list(muc.get("objects", {}))

    def ghi_json(self, data_tag, ten_obj, cap_gia_tri, inst=0):
        """Ghi vao 1 object cua dataTag KIEU JSON. Cung luat bao ve nhu
        ghi(): chi ghi de tham so DA TON TAI, tham so la thi bo qua."""
        with self._khoa:
            muc = self._state.get("jsonDataTags", {}).get(data_tag)
            if muc is None:
                return [], list(cap_gia_tri.keys())
            obj = muc.get("objects", {}).get(ten_obj)
            if obj is None:
                return [], list(cap_gia_tri.keys())
            while len(obj.setdefault("instances", [])) <= inst:
                obj["instances"].append({})
            hang = obj["instances"][inst]
            da_doi, khong_biet = [], []
            for ten, gia_tri in cap_gia_tri.items():
                if ten not in hang:
                    khong_biet.append(ten)
                    continue
                if hang[ten] != gia_tri:
                    hang[ten] = gia_tri
                    da_doi.append(ten)
            return da_doi, khong_biet

    # ---------- sinh XML dung hop dong ----------

    def xml_cho(self, data_tag, ma_loi=None, the_them_sau_header=None,
                danh_sach_doi_tuong=None):
        """Dung response XML y het thiet bi that.

        Thanh cong:  IF_ERRORSTR=SUCC, IF_ERRORID=0
        Loi phien :  IF_ERRORSTR=SessionTimeout

        the_them_sau_header: chuoi XML them vao NGAY SAU khoi IF_ERROR* va
        TRUOC cac khoi doi tuong — dung cho response GHI (xem
        xml_ghi_thanhcong()), KHONG dung cho GET binh thuong.

        danh_sach_doi_tuong: neu co, GHI DE danh sach ten object se sinh
        (thay vi dung renderOrder/doi_tuong_cua() mac dinh cua dataTag) —
        dung rieng cho response GHI cua wlan_wlanbasicadconf_lua.lua (xem
        xml_ghi_thanhcong(), dang "day_du_gioi_han").

        LUU Y VE KHAI BAO "<?xml version=\"1.0\"?>" VA XUONG DONG (2026-08-05):
        bang chung MAU THUAN nhau giua cac file that trong
        reference/source/data/ — wan_internet_lua.lua (loi SessionTimeout)
        CO khai bao xml + xuong dong/thut le; sntp_lua.lua va
        energy_config_lua.lua (thanh cong) KHONG co khai bao, KHONG xuong
        dong, 1 dong duy nhat. Chua ro day la khac biet that giua 2 nhanh
        loi/thanh cong, hay chi la khac cach cong cu chup lai file (vd xem
        "raw response" trong DevTools co the tu dong pretty-print XML).
        VI KHONG CHAC CHAN, giu nguyen hanh vi CU (co khai bao + xuong dong)
        cho nhanh LOI (dung nguyen ban wan_internet_lua.lua), CHI sua nhanh
        THANH CONG (bo khai bao, 1 dong) vi co 2 mau bang chung THANH CONG
        dong nhat voi nhau. Neu sau nay co bang chung ro rang hon cho nhanh
        loi, phai sua lai va ghi vao missing-evidence.md.
        """
        if ma_loi:
            p = ['<?xml version="1.0"?>', "<ajax_response_xml_root>"]
            p.append("<IF_ERRORSTR>%s</IF_ERRORSTR>" % ma_loi)
            p.append("<IF_ERRORPARAM>SUCC</IF_ERRORPARAM>")
            p.append("<IF_ERRORTYPE>SUCC</IF_ERRORTYPE>")
            p.append("</ajax_response_xml_root>")
            return "\n".join(p)

        p = ["<ajax_response_xml_root>"]
        p.append("<IF_ERRORPARAM>SUCC</IF_ERRORPARAM>")
        p.append("<IF_ERRORTYPE>SUCC</IF_ERRORTYPE>")
        p.append("<IF_ERRORSTR>SUCC</IF_ERRORSTR>")
        p.append("<IF_ERRORID>0</IF_ERRORID>")
        if the_them_sau_header:
            p.append(the_them_sau_header)

        # LUU Y (2026-08-04): dataTags[...].get("encodeAfterObj") ghi lai vi tri
        # the <encode> quan sat duoc tren thiet bi that (vd DHCPBasicCfg), nhung
        # CHUA duoc sinh lai o day. Da thu sinh lai va PHAT HIEN: client giai ma
        # bang crypto-js voi 1 khoa ma ta chua co bang chung suy ra duoc (khong
        # tinh/tim thay trong cac file JS da chep) -> ciphertext that chup lai bi
        # coi la "Malformed UTF-8 data" khi giai ma sai khoa, nem exception lam
        # TRANG CA form (ke ca truong khong ma hoa). Vi vay CO CHU Y khong sinh
        # the <encode> de tranh loi nang hon la thieu 1 buoc giai ma. Xem
        # missing-evidence.md muc [2026-08-04] ve khoa ma hoa DHCPBasicCfg.

        # NGOAI LE: mot vai dataTag tra ve THE VO HUONG (khong OBJ_, khong Instance)
        # xen giua cac khoi OBJ, vi du wwan_pin_lua.lua:
        #   <DongleStatus>Dev_FAILURE</DongleStatus><OBJ_WWANPINCFG_ID>...
        # va wan_3gLTE_config_lua.lua CHI co the vo huong, khong OBJ nao:
        #   <DongleStatus>...</DongleStatus><DevType>...</DevType><DongleType>...</DongleType>
        # Ghi thu tu tra ve trong dataTags[...].renderOrder (["scalar:X", "obj:OBJ_Y_ID", ...]).
        # Neu khong co renderOrder (da so dataTag) thi giu hanh vi cu: chi lap qua doi_tuong_cua().
        muc_tag = self._state["dataTags"].get(data_tag) or {}
        thu_tu_sinh = muc_tag.get("renderOrder")
        scalar_tags = muc_tag.get("scalarTags") or {}

        if danh_sach_doi_tuong is not None:
            for ten_obj in danh_sach_doi_tuong:
                self._sinh_khoi_obj(p, data_tag, ten_obj)
        elif thu_tu_sinh:
            for muc_lenh in thu_tu_sinh:
                loai, ten = muc_lenh.split(":", 1)
                if loai == "scalar":
                    p.append("<%s>%s</%s>" % (ten, _thoat(scalar_tags.get(ten, "")), ten))
                else:
                    self._sinh_khoi_obj(p, data_tag, ten)
        else:
            for ten_obj in self.doi_tuong_cua(data_tag):
                self._sinh_khoi_obj(p, data_tag, ten_obj)

        p.append("</ajax_response_xml_root>")
        # Luon noi khong khoang trang — khong co bang chung nao cho thay
        # response that co xuong dong giua cac the (xem sntp_lua.lua,
        # energy_config_lua.lua trong reference/source/data/).
        return "".join(p)

    def _sinh_khoi_obj(self, p, data_tag, ten_obj, danh_sach_instance=None,
                        danh_sach_truong=None):
        """Sinh khoi <ten_obj><Instance>...</Instance></ten_obj>, them vao list p.

        MAC DINH: gop TAT CA instance vao 1 khoi <ten_obj> duy nhat (nhieu
        <Instance> long nhau) — dung cho da so dataTag da co bang chung.

        NGOAI LE (2026-08-05, phat hien tu OBJ_WPS_ID/wlan_wps_lua.lua,
        WPS-WlanWps2G-apply.that.post.json): mot so object tren thiet bi
        that phat NHIEU khoi <ten_obj> RIENG BIET, moi khoi CHI co 1
        <Instance> — khong phai 1 khoi voi nhieu Instance long nhau. Bang
        chung: GET va Apply cua wlan_wps_lua.lua deu tra ve
        "<OBJ_WPS_ID><Instance>AP1.WPS</Instance></OBJ_WPS_ID><OBJ_WPS_ID>
        <Instance>AP5.WPS</Instance></OBJ_WPS_ID><OBJ_WPS_ID><Instance>
        AP5.WPS</Instance></OBJ_WPS_ID>" (3 khoi rieng, ke ca gia tri AP5.WPS
        bi lap 2 lan trong NVRAM that). Dung
        self._state["objects"][ten_obj]["bocRiengTungInstance"] = true de
        chon dang nay theo TUNG object — CHI dat khi co bang chung rieng,
        khong doan cho object khac.

        danh_sach_instance: neu co, GHI DE danh sach instance se sinh (thay
        vi dung self.instances(ten_obj) day du) — dung cho response GHI cua
        wlan_wps_lua.lua, noi Apply CHI echo LAI 1 instance vua ghi (khong
        phai ca 3 instance nhu GET). Xem xml_ghi_thanhcong(), dang
        "day_du_co_instidentity".

        danh_sach_truong: neu co, GHI DE tap truong se echo (thay vi
        thu_tu_para(data_tag, ten_obj) day du) — dung cho response GHI cua
        log_syslogmgr2_lua.lua (LogManagement-apply.that.post.json,
        2026-08-05): Apply CHI echo 1 truong duy nhat (logStr) trong khi GET
        cung dataTag/object nay tra ve du 4 truong. Dat trong
        dataTags[tag]["truongGhiRieng"][ten_obj] = ["logStr"].
        """
        thu_tu = danh_sach_truong if danh_sach_truong is not None else self.thu_tu_para(data_tag, ten_obj)
        obj_dinh_nghia = self._state["objects"].get(ten_obj) or {}
        boc_rieng = obj_dinh_nghia.get("bocRiengTungInstance", False)
        ds_instance = (danh_sach_instance if danh_sach_instance is not None
                       else self.instances(ten_obj))

        if boc_rieng:
            for muc in ds_instance:
                p.append("<%s>" % ten_obj)
                p.append("<Instance>")
                for ten_para in thu_tu:
                    if ten_para in muc:
                        gia_tri = self._gia_tri_dong(ten_obj, ten_para, muc[ten_para])
                        p.append("<ParaName>%s</ParaName><ParaValue>%s</ParaValue>"
                                 % (ten_para, _thoat(gia_tri)))
                p.append("</Instance>")
                p.append("</%s>" % ten_obj)
            return

        p.append("<%s>" % ten_obj)
        for muc in ds_instance:
            p.append("<Instance>")
            for ten_para in thu_tu:
                if ten_para in muc:
                    gia_tri = self._gia_tri_dong(ten_obj, ten_para, muc[ten_para])
                    p.append("<ParaName>%s</ParaName><ParaValue>%s</ParaValue>"
                             % (ten_para, _thoat(gia_tri)))
            p.append("</Instance>")
        p.append("</%s>" % ten_obj)

    def xml_ghi_thanhcong(self, data_tag, tham_so, ghi_de_dang=None, truong_id_the=None):
        """Dinh dang XML cho PHAN HOI GHI (Apply/Save) THANH CONG.

        QUAN TRONG (2026-08-05, ban 21): dinh dang response GHI KHONG
        GIONG NHAU giua cac dataTag — moi lua backend that co ve tu xu ly
        rieng. Da co 3 mau bang chung THAT, CA BA KHAC NHAU:

          1. sntp_lua.lua (SNTP, sntp-apply.har, Giai doan 0):
             KHONG INSTIDENTITY, CO the _InstID (echo), CO du lieu doi
             tuong DAY DU nhu GET, thu tu header PARAM,TYPE,STR,ID.
                <ajax_response_xml_root><IF_ERRORPARAM>SUCC</IF_ERRORPARAM>
                <IF_ERRORTYPE>SUCC</IF_ERRORTYPE><IF_ERRORSTR>SUCC</IF_ERRORSTR>
                <IF_ERRORID>0</IF_ERRORID><_InstID>IGD</_InstID>
                <OBJ_SNTP_ID>...(day du)...</OBJ_SNTP_ID></ajax_response_xml_root>

          2. energy_config_lua.lua (EnergyMode, EnergyMode-apply.that.post.json):
             CO INSTIDENTITY (echo _InstID), CO the _InstID (echo), KHONG
             du lieu doi tuong, thu tu header ID,TYPE,STR,PARAM.
                <ajax_response_xml_root><INSTIDENTITY>IGD</INSTIDENTITY>
                <IF_ERRORID>0</IF_ERRORID><IF_ERRORTYPE>SUCC</IF_ERRORTYPE>
                <IF_ERRORSTR>SUCC</IF_ERRORSTR><IF_ERRORPARAM>SUCC</IF_ERRORPARAM>
                <_InstID>IGD</_InstID></ajax_response_xml_root>

          3. portbinding_lua.lua (Port Binding, PortBinding-apply.that.post.json):
             CO INSTIDENTITY (ECHO _InstID gui len — co the RONG neu request
             khong gui _InstID, hoac CO GIA TRI neu co gui, xem PortLocate
             ben duoi), KHONG the _InstID, KHONG du lieu doi tuong, thu tu
             header ID,TYPE,STR,PARAM (giong EnergyMode).
                <ajax_response_xml_root><INSTIDENTITY></INSTIDENTITY>
                <IF_ERRORID>0</IF_ERRORID><IF_ERRORTYPE>SUCC</IF_ERRORTYPE>
                <IF_ERRORSTR>SUCC</IF_ERRORSTR><IF_ERRORPARAM>SUCC</IF_ERRORPARAM>
                </ajax_response_xml_root>

             Xac nhan them (2026-08-05, Internet_PortLocate_lua.lua/
             poninfo_loid_lua.lua/poninfo_sn_lua.lua): CUNG dang nay nhung
             INSTIDENTITY CO GIA TRI ("IGD", echo _InstID=IGD da gui).
                <ajax_response_xml_root><INSTIDENTITY>IGD</INSTIDENTITY>
                <IF_ERRORID>0</IF_ERRORID><IF_ERRORTYPE>SUCC</IF_ERRORTYPE>
                <IF_ERRORSTR>SUCC</IF_ERRORSTR><IF_ERRORPARAM>SUCC</IF_ERRORPARAM>
                </ajax_response_xml_root>

             PHAN BAC gia thuyet "luon echo" (2026-08-05,
             firewall_filterglobal_lua.lua, Filter Criteria): dataTag nay
             GUI _InstID=IGD nhung response INSTIDENTITY RONG — chung minh
             KHONG co cong thuc chung "echo" cho ca dang xac_nhan_trong,
             moi dataTag phai duoc xac dinh RIENG la echo hay luon rong qua
             `dataTags[tag]["instidentity"]` ("echo" mac dinh hoac "rong").

        KHONG THE suy ra 1 quy tac chung dung cho moi dataTag tu cac mau
        nay — moi dataTag PHAI duoc kiem bang bang chung rieng truoc khi
        coi la muc 4. Dung truong dataTags[tag]["ghiDangKieu"] (chuoi) de
        chon dang, mac dinh "day_du" (mau 1 — SNTP) vi la dang GAN NHAT
        voi GET (it kha nang bi lech nhat neu chua co bang chung rieng).
        Cac dang da biet (2026-08-05, ban 24): "day_du" (1), "rut_gon"
        (2, EnergyMode — co the theThemSauRutGon), "xac_nhan_trong"
        (3, PortBinding — voi truong con `instidentity` = "echo"/"rong"/
        "tu_truong:<ten_truong>"), "day_du_gioi_han" (4, WlanBasicAdvanced2G
        — header kieu day_du nhung CHI echo mot danh sach object rieng qua
        `doiTuongGhiRieng`), "day_du_co_instidentity" (5 — moi, WPS: header
        kieu rut_gon/xac_nhan_trong (INSTIDENTITY dau, KHONG _InstID) NHUNG
        CO du lieu object DAY DU nhu GET; cung dung truong con
        `instidentity`, mac dinh doi_tuong_cua() cho danh sach object hoac
        `doiTuongGhiRieng` neu can han che).
        Neu gap dataTag co TAP HOP the khac han cac dang nay (vd thieu/thua
        INSTIDENTITY hoac _InstID, co/khong co du lieu khac voi cac mau),
        PHAI them nhanh moi va ghi missing-evidence.md.

        QUYET DINH CHINH SACH (2026-08-05, ban 23, xac nhan voi anh Huynn):
        THU TU cac the header (IF_ERRORID/IF_ERRORTYPE/IF_ERRORSTR/
        IF_ERRORPARAM) giua cac mau bang chung THAT khac nhau moi lan
        (SNTP: PARAM,TYPE,STR,ID; EnergyMode/PortBinding: ID,TYPE,STR,PARAM;
        IGMP (multicast_igmpwan_lua.lua): ID,PARAM,TYPE,STR). Vi XML la cay
        the co TEN, khong phai vi tri — client (jQuery tim theo ten the qua
        $(xml).find()/text()) KHONG bi anh huong boi thu tu anh em. Vi vay
        THU TU CAC THE HEADER duoc coi la khac biet CHAP NHAN (tuong tu tien
        le "form-action redact" da dung cho so DOM), KHONG can khop chinh
        xac tung dataTag — chi can dung TAP HOP the (co mat/vang mat) +
        gia tri + co/khong co du lieu doi tuong theo 1 trong 3 dang tren.
        ghi_de_dang: neu co, DUNG dang nay THAY VI dataTags[tag]["ghiDangKieu"] tinh —
        danh cho truong hop 1 dataTag CO NHIEU dang response GHI khac nhau tuy
        IF_ACTION (vd danh sach: Apply tra "rut_gon", Delete tra "xoa_gon" — xem
        dispatch.menu_data_ghi()), khong the chon dang co dinh qua 1 truong tinh.
        truong_id_the: TEN THE XML dung de echo ID (mac dinh "_InstID"). Bang
        chung (2026-08-06, PortTrigger-apply/delete.that.post.json): OBJ_FWPT_ID
        (Port Trigger) echo qua the <OBJ_FWPT_ID._OBJ_InstID> thay vi <_InstID> —
        xem config_store.truong_id_danh_sach(). dispatch.menu_data_ghi() truyen
        gia tri nay khi goi cho doi tuong KIEU DANH SACH.
        """
        ten_the_id = truong_id_the or "_InstID"
        inst_id = tham_so.get(ten_the_id, "")
        muc_tag = self._state["dataTags"].get(data_tag) or {}
        dang = ghi_de_dang if ghi_de_dang is not None else muc_tag.get("ghiDangKieu", "day_du")

        if dang == "rut_gon":
            # EnergyMode: xac nhan ngan CO INSTIDENTITY + _InstID, khong du lieu.
            # Bien the (2026-08-05, wan_internet_lua.lua, EthWanConfig-apply.that.post.json):
            # CUNG dang rut_gon nhung co THEM cac the KHONG chuan sau _InstID -
            # vd <wantype>pppoe</wantype><wantype>pppoe</wantype><Status>2</Status>
            # <encode>UserName,Password</encode> (that su lap lai <wantype> 2 lan,
            # khong phai loi capture). Dung dataTags[tag]["theThemSauRutGon"]
            # (chuoi XML dung san, chua tien to/chua) de chen nguyen van truoc
            # the dong </ajax_response_xml_root> — CHI dat gia tri nay khi co
            # bang chung that rieng cho dataTag do, khong doan.
            p = ["<ajax_response_xml_root>",
                 "<INSTIDENTITY>%s</INSTIDENTITY>" % _thoat(inst_id),
                 "<IF_ERRORID>0</IF_ERRORID>",
                 "<IF_ERRORTYPE>SUCC</IF_ERRORTYPE>",
                 "<IF_ERRORSTR>SUCC</IF_ERRORSTR>",
                 "<IF_ERRORPARAM>SUCC</IF_ERRORPARAM>",
                 "<%s>%s</%s>" % (ten_the_id, _thoat(inst_id), ten_the_id)]
            the_them = muc_tag.get("theThemSauRutGon")
            if the_them:
                p.append(the_them)
            p.append("</ajax_response_xml_root>")
            return "".join(p)

        if dang == "xoa_gon":
            # Xoa 1 item khoi danh sach (vd Local Service Control Delete). Bang chung
            # (2026-08-06): reference/vantay/LocalServiceCtrl-delete.that.post.json,
            # LocalServiceCtrlV6-delete.that.post.json, PortForwarding-delete.that.post.json
            # — KHONG INSTIDENTITY, KHONG du lieu doi tuong (khac han
            # "day_du"/"rut_gon"/"xac_nhan_trong" da biet truoc do), CO the ID nhung LUON
            # RONG (khong echo id vua xoa), thu tu header PARAM,TYPE,STR,ID. Bang chung
            # rieng cho ten the ID khac "_InstID" (2026-08-06):
            # reference/vantay/PortTrigger-delete.that.post.json — OBJ_FWPT_ID echo qua
            # <OBJ_FWPT_ID._OBJ_InstID></OBJ_FWPT_ID._OBJ_InstID> (van rong), thu tu header
            # ID,PARAM,TYPE,STR (thu tu the header khac nhau duoc coi la chap nhan, xem
            # ghi chu chinh sach o dau ham nay).
            p = ["<ajax_response_xml_root>",
                 "<IF_ERRORPARAM>SUCC</IF_ERRORPARAM>",
                 "<IF_ERRORTYPE>SUCC</IF_ERRORTYPE>",
                 "<IF_ERRORSTR>SUCC</IF_ERRORSTR>",
                 "<IF_ERRORID>0</IF_ERRORID>",
                 "<%s></%s>" % (ten_the_id, ten_the_id),
                 "</ajax_response_xml_root>"]
            return "".join(p)

        if dang == "xac_nhan_trong":
            # PortBinding/PortLocate/PonLoid/PonSn: xac nhan ngan CO
            # INSTIDENTITY, KHONG _InstID, khong du lieu. GIA TRI ben trong
            # INSTIDENTITY khong theo 1 quy tac chung: co dataTag ECHO
            # _InstID da gui (PortLocate/PonLoid/PonSn: gui IGD -> tra ve
            # IGD), co dataTag LUON RONG bat ke gui gi (firewall_filterglobal_lua.lua:
            # gui _InstID=IGD nhung tra ve RONG - bang chung Firewall Filter
            # Criteria 2026-08-05, phan bac gia thuyet "luon echo" dat ra o
            # ban 23). Dung dataTags[tag]["instidentity"] = "echo" (mac dinh,
            # an toan cho cac mau _InstID rong da biet - echo rong = rong)
            # hoac "rong" (luon rong, bat ke gui gi) de chon dung theo bang
            # chung TUNG dataTag.
            #
            # Bien the them (2026-08-05, wlan_wlanbasiconoff_lua.lua,
            # WlanBasicOnOff-apply.that.post.json): form co NHIEU bo tham so
            # danh cho nhieu radio (_InstID_0/_InstID_1/_InstID_2) CONG VOI 1
            # _InstID top-level rieng — INSTIDENTITY tra ve LAI KHONG PHAI
            # echo _InstID top-level ma la gia tri cua bo tham so CUOI CUNG
            # (_InstID_2). Dung dataTags[tag]["instidentity"] =
            # "tu_truong:<ten_truong>" (vd "tu_truong:_InstID_2") de doc gia
            # tri tu 1 truong KHAC trong tham_so thay vi _InstID mac dinh.
            ttri = muc_tag.get("instidentity", "echo")
            if ttri == "rong":
                instidentity = ""
            elif isinstance(ttri, str) and ttri.startswith("tu_truong:"):
                instidentity = tham_so.get(ttri[len("tu_truong:"):], "")
            else:
                instidentity = inst_id
            p = ["<ajax_response_xml_root>",
                 "<INSTIDENTITY>%s</INSTIDENTITY>" % _thoat(instidentity),
                 "<IF_ERRORID>0</IF_ERRORID>",
                 "<IF_ERRORTYPE>SUCC</IF_ERRORTYPE>",
                 "<IF_ERRORSTR>SUCC</IF_ERRORSTR>",
                 "<IF_ERRORPARAM>SUCC</IF_ERRORPARAM>",
                 "</ajax_response_xml_root>"]
            return "".join(p)

        if dang == "day_du_co_instidentity":
            # wlan_wps_lua.lua (WPS Apply 2.4GHz, WPS-WlanWps2G-apply.that.post.json,
            # 2026-08-05): dang MOI thu 6 — KET HOP du lieu object DAY DU
            # (nhu GET, dung danh sach mac dinh doi_tuong_cua() hoac
            # doiTuongGhiRieng neu co han che) VOI mot the INSTIDENTITY o
            # dau (giong rut_gon/xac_nhan_trong), NHUNG KHONG co the
            # _InstID rieng biet. Gia tri INSTIDENTITY o day KHONG PHAI
            # luon la _InstID top-level: form WPS gui ca _InstID=DEV.WIFI.RD1
            # (radio) LAN SSID_InstID=DEV.WIFI.AP1.WPS (SSID) — response
            # echo SSID_InstID, khong phai _InstID. Dung field
            # dataTags[tag]["instidentity"] = "tu_truong:SSID_InstID" giong
            # co che da dung o dang xac_nhan_trong.
            #
            # LOC INSTANCE (2026-08-05, cung bang chung WPS): voi object co
            # co gio bocRiengTungInstance=true (vd OBJ_WPS_ID), Apply CHI
            # echo LAI 1 instance co _InstID == instidentity (khong phai ca
            # 3 instance nhu khi GET). Object KHONG co co gio nay
            # (OBJ_WLANSETTING_ID) van echo DAY DU nhu binh thuong — bang
            # chung: response Apply van co ca 3 radio 2.4/5/6GHz.
            ttri = muc_tag.get("instidentity", "echo")
            if ttri == "rong":
                instidentity = ""
            elif isinstance(ttri, str) and ttri.startswith("tu_truong:"):
                instidentity = tham_so.get(ttri[len("tu_truong:"):], "")
            else:
                instidentity = inst_id
            p = ["<ajax_response_xml_root>",
                 "<INSTIDENTITY>%s</INSTIDENTITY>" % _thoat(instidentity),
                 "<IF_ERRORID>0</IF_ERRORID>",
                 "<IF_ERRORTYPE>SUCC</IF_ERRORTYPE>",
                 "<IF_ERRORSTR>SUCC</IF_ERRORSTR>",
                 "<IF_ERRORPARAM>SUCC</IF_ERRORPARAM>"]
            danh_sach = muc_tag.get("doiTuongGhiRieng")
            ds_ten_obj = danh_sach if danh_sach is not None else self.doi_tuong_cua(data_tag)
            truong_rieng = muc_tag.get("truongGhiRieng") or {}
            for ten_obj in ds_ten_obj:
                obj_dinh_nghia = self._state["objects"].get(ten_obj) or {}
                ds_truong = truong_rieng.get(ten_obj)
                if obj_dinh_nghia.get("bocRiengTungInstance"):
                    # CHI lay INSTANCE DAU TIEN khop instidentity, du co the co
                    # NHIEU instance trung _InstID trong NVRAM (bang chung that:
                    # OBJ_WPS_ID co 2 instance DEV.WIFI.AP5.WPS trung nhau — GET
                    # echo CA HAI (dung voi bocRiengTungInstance goc), nhung Apply
                    # 5GHz (WPS-WlanWps5G-apply.that.post.json, phat hien lai khi
                    # chay golden-test 2026-08-05) CHI echo LAI 1 khoi duy nhat,
                    # khac voi GET. Khong doan thay the — cat [:1] la cach doc
                    # duoc tu bang chung ma khong bia them quy tac.
                    ds_inst = [i for i in self.instances(ten_obj)
                               if i.get("_InstID") == instidentity][:1]
                    self._sinh_khoi_obj(p, data_tag, ten_obj, danh_sach_instance=ds_inst,
                                         danh_sach_truong=ds_truong)
                else:
                    self._sinh_khoi_obj(p, data_tag, ten_obj, danh_sach_truong=ds_truong)
            p.append("</ajax_response_xml_root>")
            return "".join(p)

        if dang == "toi_gian":
            # updownload_prevent_ctl.lua (2026-08-07, kiem tra co duoc phep
            # upload/download hay khong, dung tren logMgr/firmwareUpgr/usrCfgMgr):
            # dang MOI thu 8 — CHI header thanh cong 4 the (PARAM,TYPE,STR,ID),
            # KHONG INSTIDENTITY, KHONG _InstID, KHONG du lieu object. Khac
            # "xac_nhan_trong" (luon co INSTIDENTITY) va "day_du" (luon co
            # _InstID) - day la dang TOI GIAN NHAT tung gap. Bang chung:
            # reference/har/logmgr-downloads.har entry 32 (POST) VA entry 43
            # (GET, cung dataTag nhung goi qua menuData DOC binh thuong —
            # ca 2 CHIEU cho CUNG 1 chuoi byte). Xac nhan: dataTag nay CO
            # doi tuong rong (objects: []) nen xml_cho() mac dinh (nhanh GET)
            # da tra dung y het chuoi nay — dang nay ton tai de menu_data_ghi()
            # (POST) khong tu them <_InstID> nhu mac dinh "day_du".
            return self.xml_cho(data_tag)

        if dang == "day_du_gioi_han":
            # wlan_wlanbasicadconf_lua.lua (WlanBasicAdvanced2G-apply.that.post.json,
            # 2026-08-05): dang RIENG, KHAC han cac dang khac — thu tu header
            # theo kieu day_du (PARAM,TYPE,STR,ID), KHONG INSTIDENTITY, KHONG
            # the _InstID, va CHI echo object OBJ_WLANMLO_ID (trang thai MLO —
            # KHONG PHAI object cua chinh dataTag nay, co le la hanh vi phu
            # cua firmware that khi kiem tra MLO sau khi doi radio). Danh sach
            # object can echo dat trong dataTags[tag]["doiTuongGhiRieng"].
            danh_sach = muc_tag.get("doiTuongGhiRieng") or []
            return self.xml_cho(data_tag, danh_sach_doi_tuong=danh_sach)

        if dang == "day_du_co_instidentity_va_instid":
            # dhcp6s_dhcpserver_lua.lua (LanMgrIpv6-DHCPv6Server-apply.that.post.json,
            # 2026-08-05): dang MOI thu 7 — CO CA BA: <INSTIDENTITY> dau tien,
            # <_InstID> ngay sau header loi (echo top-level _InstID), VA du lieu
            # object DAY DU (mac dinh doi_tuong_cua() hoac doiTuongGhiRieng neu
            # can han che). INSTIDENTITY o day KHONG PHAI echo top-level _InstID
            # (DEV.DHCP6SPool1) ma la mot truong KHAC gui kem (_InstID_DNS=IGD) —
            # dung dataTags[tag]["instidentity"] = "tu_truong:_InstID_DNS" giong
            # co che tu_truong da dung o cac dang khac.
            ttri = muc_tag.get("instidentity", "echo")
            if ttri == "rong":
                instidentity = ""
            elif isinstance(ttri, str) and ttri.startswith("tu_truong:"):
                instidentity = tham_so.get(ttri[len("tu_truong:"):], "")
            else:
                instidentity = inst_id
            p = ["<ajax_response_xml_root>",
                 "<INSTIDENTITY>%s</INSTIDENTITY>" % _thoat(instidentity),
                 "<IF_ERRORID>0</IF_ERRORID>",
                 "<IF_ERRORTYPE>SUCC</IF_ERRORTYPE>",
                 "<IF_ERRORSTR>SUCC</IF_ERRORSTR>",
                 "<IF_ERRORPARAM>SUCC</IF_ERRORPARAM>",
                 "<_InstID>%s</_InstID>" % _thoat(inst_id)]
            danh_sach = muc_tag.get("doiTuongGhiRieng")
            ds_ten_obj = danh_sach if danh_sach is not None else self.doi_tuong_cua(data_tag)
            for ten_obj in ds_ten_obj:
                self._sinh_khoi_obj(p, data_tag, ten_obj)
            p.append("</ajax_response_xml_root>")
            return "".join(p)

        # "day_du" (mac dinh, bang chung SNTP): day du nhu GET + the ID
        # chen sau header.
        return self.xml_cho(
            data_tag,
            the_them_sau_header="<%s>%s</%s>" % (ten_the_id, _thoat(inst_id), ten_the_id))

    def json_cho(self, data_tag, ma_loi=None):
        """Sinh response JSON cho cac dataTag THAN JSON (ngoai le, khong phai da so).

        Bang chung: reference/vantay/WLANMLO.menudata.0-0.json chup tu thiet bi that
        khi mo tab MLO tra ve than JSON (KHONG boc trong ajax_response_xml_root):
            {"IF_ERRORID":0,"OBJ_WLANMLO_ID":{"Instance":[{"MloEnable":"0"}]},
             "IF_ERRORTYPE":"SUCC","IF_ERRORSTR":"SUCC","IF_ERRORPARAM":"SUCC"}
        Giu dung thu tu khoa da quan sat duoc.
        CHUA CO bang chung dinh dang loi (SessionTimeout) cho nhanh JSON nay —
        gia dinh chi doi IF_ERRORSTR, ghi trong missing-evidence.md."""
        import json as _json
        muc = self._state.get("jsonDataTags", {}).get(data_tag) or {}
        ket_qua = {"IF_ERRORID": 0}
        for ten_obj, than in muc.get("objects", {}).items():
            ket_qua[ten_obj] = {"Instance": [dict(i) for i in than.get("instances", [])]}
        ket_qua["IF_ERRORTYPE"] = "SUCC"
        ket_qua["IF_ERRORSTR"] = ma_loi or "SUCC"
        ket_qua["IF_ERRORPARAM"] = "SUCC"
        return _json.dumps(ket_qua, ensure_ascii=False)

    def json_ghi_thanhcong(self, data_tag):
        """Response GHI (Apply) THANH CONG cho dataTag KIEU JSON.

        Bang chung: reference/vantay/IgmpWLANCONF-apply.that.post.json
        (Multicast on Wi-Fi, multicast_model.lua, 2026-08-05) — response
        CHI co 4 truong loi, KHONG echo lai du lieu doi tuong (khac voi
        json_cho() dung cho GET):
            {"IF_ERRORPARAM":"SUCC","IF_ERRORTYPE":"SUCC","IF_ERRORSTR":"SUCC",
             "IF_ERRORID":0}
        Moi co 1 mau bang chung — neu dataTag JSON khac co Apply ma dinh
        dang khac thi phai sua lai, ghi missing-evidence.md."""
        import json as _json
        return _json.dumps({
            "IF_ERRORPARAM": "SUCC", "IF_ERRORTYPE": "SUCC",
            "IF_ERRORSTR": "SUCC", "IF_ERRORID": 0,
        }, ensure_ascii=False)


def _thoat(gia_tri):
    s = "" if gia_tri is None else str(gia_tri)
    return (s.replace("&", "&amp;").replace("<", "&lt;").replace(">", "&gt;"))
