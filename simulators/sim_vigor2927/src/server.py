#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
Gia lap DrayTek Vigor2927 - dung TRANG THAT crawl tu thiet bi (192.168.1.1).
Kien truc: trang login = Vue SPA (weblogin.htm); sau dang nhap = frameset co dien
(index.htm gom header/menu/act_sta + main). Noi dung o /cgi-bin/*.cgi?fid=N...

Dinh tuyen thong minh: bo tham so phien sFormAuthStr, khop ban ghi trong
_routes.json theo tap tham so dieu huong (fid, iInetWanIdx, iAct, sAct...).
Xu ly ca dieu huong POST (nhieu trang DrayTek bam dong bang -> form.submit()).

Chay: python server.py [port]   (mac dinh 8080)
Dang nhap: user + password bat ky, chi can KHONG RONG.
"""
import os, sys, json, socket, re
from http.server import BaseHTTPRequestHandler, ThreadingHTTPServer
from urllib.parse import urlparse, unquote, parse_qs

PORT = int(sys.argv[1]) if len(sys.argv) > 1 else 8080
BASE = os.path.dirname(os.path.abspath(__file__))
WWW = os.path.join(BASE, "www")
ROUTES_FILE = os.path.join(WWW, "_routes.json")

# ---------------------------------------------------------------- CO CHE THAY DAN
# Bo giai doan: tung nhom menu duoc dung lai tu reference/source/ qua render.py.
# Trang DA DUNG  -> phuc vu theo DUNG duong dan goc (/doc/enet1.htm), du lieu tu config_store.
# Trang CHUA DUNG -> giu nguyen ban cu trong www/_pages/ qua _routes.json.
# Khi nhom cuoi cung xong thi _pages/ khong con duoc dung toi nua.
sys.path.insert(0, BASE)
import vg_config_store as config_store, render

SPEC = os.path.normpath(os.path.join(BASE, "..", "spec"))
DA_DUNG_FILE = os.path.join(BASE, "da_dung.json")

_cache = {"mt_map": 0, "url2goc": {}, "mt_dung": 0, "da_dung": set()}


def _khoa_url(path, params):
    q = sorted((k, v) for k, v in params.items() if k != "sFormAuthStr")
    return path + "?" + "&".join(f"{k}={v}" for k, v in q)


def url_sang_goc():
    """Danh sach (method, path_thuong, tham_so_dict, trang_goc) lay tu spec/cgi-map.json."""
    p = os.path.join(SPEC, "cgi-map.json")
    try:
        m = os.path.getmtime(p)
    except OSError:
        return _cache["url2goc"]
    if m != _cache["mt_map"]:
        ds = []
        for c in json.load(open(p, encoding="utf-8"))["endpoints"]:
            if c.get("trang_dich"):
                u = urlparse(c["url_chuan"])
                pr = {k: v[0] for k, v in parse_qs(u.query).items() if k != "sFormAuthStr"}
                ds.append((c.get("method", "GET"), u.path.lower(), pr, c["trang_dich"],
                           c.get("status", 302), c.get("content_type")))
        _cache.update(mt_map=m, url2goc=ds)
    return _cache["url2goc"]


def da_dung():
    """Danh sach trang goc DA duoc dung lai. Trong file nay = chua dung trang nao."""
    try:
        m = os.path.getmtime(DA_DUNG_FILE)
    except OSError:
        return set()
    if m != _cache["mt_dung"]:
        with open(DA_DUNG_FILE, "r", encoding="utf-8") as f:
            d = json.load(f)
        _cache.update(mt_dung=m, da_dung=set(d.get("trang", [])))
    return _cache["da_dung"]


# Tham so QUYET DINH trang nao duoc mo (khac voi tham so du lieu cua form).
# Voi POST, `fid` nam trong body chu khong o query -> phai loc ra roi moi tra duoc.
THAM_SO_DIEU_HUONG = ("fid", "iAct", "sAct", "iPageIdx", "iProfileIdx", "opmode",
                      "iInetWanIdx", "sProfileAct", "type", "iOpt", "option",
                      "iPRToPage", "ag", "showdetail", "iCert", "pageap", "iActive")


def tim_trang_goc(method, path, params):
    """(method, URL) -> trang goc trong reference/source/, hoac None.

    Khop nhu find_page: MOI tham so cua ban ghi deu phai co trong request voi
    gia tri bang nhau; ban ghi nao nhieu tham so nhat thi thang. Can thiet vi
    POST gui kem ca tram tham so du lieu, trong khi ban ghi chi ghi fid/iAct.

    LOC THEO METHOD (sua loi 2026-08-08): truoc day ham nay gop chung ban ghi
    GET va POST cua cung mot duong dan. Voi .cgi da nang dung chung cho nhieu
    trang (v2x00.cgi, wan.cgi, qos.cgi...), MOI ban ghi POST hau nhu luon co
    tap tham so RONG (fid nam trong body, extract_har.py cu khong nhung gia
    tri vao url_chuan) — nen MOI POST deu "khop" voi ban ghi RONG dau tien tim
    thay, kem theo do bi dieu huong sai sang trang khac hoan toan. Da sua
    extract_har.py de nhung gia tri fid/iAct... that vao url_chuan cua ban ghi
    POST; o day chi con can dam bao KHONG so ban ghi GET voi ban ghi POST.
    """
    pl = path.lower()
    tot, tot_n = (None, None, None), -1
    for rm, rpath, rpr, goc, st, ct in url_sang_goc():
        if rm != method or rpath != pl:
            continue
        if all(params.get(k) == v for k, v in rpr.items()) and len(rpr) > tot_n:
            tot, tot_n = (goc, st, ct), len(rpr)
    return tot

CT = {
    ".htm": "text/html; charset=utf-8", ".html": "text/html; charset=utf-8",
    ".cgi": "text/html; charset=utf-8",
    # .cgi tra DU LIEU (certificatedata/usbweb/websyslog) — thiet bi that
    # tra application/x-javascript; xem reference/har/.
    "_cgi_js": "application/x-javascript",
    ".css": "text/css", ".js": "application/javascript",
    ".png": "image/png", ".gif": "image/gif", ".jpg": "image/jpeg",
    ".jpeg": "image/jpeg", ".ico": "image/x-icon", ".svg": "image/svg+xml",
    ".woff": "font/woff", ".woff2": "font/woff2", ".ttf": "font/ttf",
    ".otf": "font/otf", ".eot": "application/vnd.ms-fontobject",
    ".json": "application/json",
}

FRAME_PAGES = {"header.htm", "l_m.htm", "menu.htm", "act_sta.htm", "empty.htm"}

# Mot so .cgi KHONG tra trang ma tra DU LIEU cho trang khac nap bang
# <script src=...>. Thiet bi that tra application/x-javascript (xem reference/har/).
# Neu tra text/html va them <!DOCTYPE html> o dau thi script LOI CU PHAP ngay
# dong 1 -> moi bien du lieu thanh undefined -> bang do JS dung se rong,
# thieu cot, thieu khoi. Day chinh la nguyen nhan loi nhom Certificate Management.
# KHONG dung danh sach cung nua. Cung mot .cgi vua co the tra TRANG vua tra DU LIEU,
# phan biet bang THAM SO chu khong bang duong dan:
#     /cgi-bin/arp.cgi         -> 302 -> doc/iparptbl.sht   (TRANG)
#     /cgi-bin/arp.cgi?fid=1   -> 200 application/json      (DU LIEU)
#     /cgi-bin/hotspot.cgi?fid=0 -> 302 -> doc/hsportal1.htm (TRANG)
# Vi vay lay Content-Type tu chinh hop dong trong spec/cgi-map.json (ghi tu HAR).
def kieu_noi_dung(duong_dan, ct_hop_dong=None):
    if ct_hop_dong:
        return ct_hop_dong
    dd = "/" + duong_dan.lstrip("/")
    return CT.get(os.path.splitext(dd)[1].lower(), "text/html; charset=utf-8")

# Nap _routes.json va tu dong nap lai khi file doi (theo mtime)
_routes_cache = {"mtime": 0, "data": {}, "parsed": []}


def get_routes():
    try:
        m = os.path.getmtime(ROUTES_FILE)
    except OSError:
        return _routes_cache["data"], _routes_cache["parsed"]
    if m != _routes_cache["mtime"]:
        data = json.load(open(ROUTES_FILE, encoding="utf-8"))
        parsed = []
        for key, f in data.items():
            if "?" in key:
                path, q = key.split("?", 1)
                params = dict(x.split("=", 1) for x in q.split("&") if "=" in x)
            else:
                path, params = key, {}
            parsed.append((path, params, f))
        _routes_cache.update(mtime=m, data=data, parsed=parsed)
    return _routes_cache["data"], _routes_cache["parsed"]


def find_page(path, params):
    """Tim trang phu hop nhat: cung path, va MOI tham so cua route deu co
    trong request voi gia tri bang nhau. Uu tien route nhieu tham so nhat."""
    data, parsed = get_routes()
    # bo sFormAuthStr khoi request params
    params = {k: v for k, v in params.items() if k != "sFormAuthStr"}
    best, best_n = None, -1
    for rpath, rparams, f in parsed:
        if rpath != path:
            continue
        ok = all(params.get(k) == v for k, v in rparams.items())
        if ok and len(rparams) > best_n:
            best, best_n = f, len(rparams)
    return best


class H(BaseHTTPRequestHandler):
    def _send(self, data, ctype, code=200):
        if isinstance(data, str):
            data = data.encode("utf-8")
        if "text/html" in ctype and (b"translate" in data or b"{{" in data):
            data = re.sub(rb'\{\{\s*[\x27\x22]([^\x27\x22]+)[\x27\x22]\s*\|\s*translate\s*\}\}', rb'\1', data)
            data = re.sub(rb'option\s*\{\{num\}\}', rb'option', data)
        self.send_response(code)
        self.send_header("Content-Type", ctype)
        self.send_header("Content-Length", str(len(data)))
        self.send_header("Cache-Control", "no-store, no-cache, must-revalidate, max-age=0")
        if getattr(self, "_need_set_vg_cookie", False):
            self.send_header("Set-Cookie", f"vg_session={self._generated_vg_id}; Path=/; SameSite=Lax")
            self._need_set_vg_cookie = False
        self.end_headers()
        try:
            self.wfile.write(data)
        except (BrokenPipeError, ConnectionResetError):
            pass

    def _client_id(self):
        hdr = (self.headers.get("X-KTV-Session-ID", "") or "").strip()
        if hdr:
            return hdr
        if "?_ktv=" in getattr(self, "path", "") or "&_ktv=" in getattr(self, "path", ""):
            try:
                q = parse_qs(urlparse(self.path).query)
                if "_ktv" in q and q["_ktv"][0]:
                    return q["_ktv"][0].strip()
            except Exception:
                pass
        cookie_raw = self.headers.get("Cookie", "")
        for part in cookie_raw.split(";"):
            part = part.strip()
            if part.startswith("ftc_session=") or part.startswith("PHPSESSID=") or part.startswith("ktv_client_id=") or part.startswith("vg_session="):
                return part.split("=", 1)[1]
        ref = self.headers.get("Referer", "")
        if ref and "_ktv=" in ref:
            try:
                q = parse_qs(urlparse(ref).query)
                if "_ktv" in q and q["_ktv"][0]:
                    return q["_ktv"][0].strip()
            except Exception:
                pass
        if not hasattr(self, "_generated_vg_id"):
            import uuid
            self._generated_vg_id = f"ktv_vg_{uuid.uuid4().hex[:16]}"
            self._need_set_vg_cookie = True
        return self._generated_vg_id

    def _redirect(self, to):
        self.send_response(302)
        self.send_header("Location", to)
        self.send_header("Content-Length", "0")
        if getattr(self, "_need_set_vg_cookie", False):
            self.send_header("Set-Cookie", f"vg_session={self._generated_vg_id}; Path=/; SameSite=Lax")
            self._need_set_vg_cookie = False
        self.end_headers()

    def _file(self, rel, params=None):
        f = os.path.join(WWW, rel.lstrip("/"))
        if os.path.isfile(f):
            ext = os.path.splitext(f)[1].lower()
            with open(f, "rb") as fh:
                data = fh.read()
            rl = rel.lstrip("/").replace("\\", "/")
            if rl.startswith("doc/") or rl.startswith("_pages/"):
                try:
                    txt = data.decode("utf-8")
                    enc = "utf-8"
                except UnicodeDecodeError:
                    txt = data.decode("latin-1")
                    enc = "latin-1"
                txt = render.sua_top_thanh_parent(txt)
                txt = render.bat_tab_ipv6(txt)
                txt = render.sua_getStrObj(txt)
                if "ipbandw.htm" in rl:
                    txt = render.sua_ipbandw_add(txt)
                if "ipbmac.htm" in rl:
                    txt = render.sua_ipbmac_add(txt)
                if "ENET.SHT" in rl or "enet.sht" in rl.lower() or "lan_dt_1.html" in rl:
                    txt = render.sua_enet_sht(txt)
                if "p2_188.html" in rl:
                    txt = render.sua_policyrt_detail(txt, params.get("iPRIdx") if params else None)
                data = txt.encode(enc, "replace")
            self._send(data, CT.get(ext, "application/octet-stream"))
            return True
        return False

    def _flat(self, qs):
        return {k: v[0] for k, v in parse_qs(qs, keep_blank_values=True).items()}

    def _log(self, nguon, path, chi_tiet=""):
        print(f"  [{nguon:9}] {self.command:4} {path[:64]:64} {chi_tiet}", flush=True)

    def _phuc_vu_moi(self, goc, path):
        """Phuc vu trang DA DUNG: lay ban goc + gia tri tu config_store."""
        data, tk = render.render(goc)
        if data is None:
            return False
        self._log("MOI", path, f"-> {goc}  (bien {tk['bien']}, input {tk['input']})")
        self._send(data, kieu_noi_dung(goc))
        return True

    def _ghi_qua_ajax_get(self, path, params):
        """Mot so trang (String Object Add/Edit) KHONG ghi cau hinh qua POST
        302 nhu da so .cgi khac, ma dung AngularJS $http.get() goi thang
        .cgi va doc JSON tra ve — vi du:
            GET /cgi-bin/striobj.cgi?sAct=1&sString=...  -> 200 [1]
        Khong khop duoc voi co che tim_trang_goc() thong thuong (tham so
        sString la DU LIEU nguoi dung go, khong phai dieu huong co dinh nhu
        fid — url_chuan cua tung lan chup se moi lan mot khac).
        Tra None neu path/params nay khong thuoc dien nay (de _serve_cgi lo).

        Bang chung: reference/har/Buoi_11_strobjadd_ok.har — CHI co sAct=1
        (Add). sAct=3 (Edit-Save) / sAct=4 (Clear) CHUA co bang chung response
        that (xem ISSUES.md 2026-08-08) — KHONG tu bia, tra None de roi ve
        duong thuong (se ra 404, giong tinh trang chua co hop dong).
        """
        if path != "/cgi-bin/striobj.cgi" or params.get("sAct") != "1":
            return None
        trang = "doc/stringobj.htm"
        mang = list(config_store.lay(trang, "stringvalue") or [])
        for idx, v in enumerate(mang):
            if not v:
                mang[idx] = params.get("sString", "")
                config_store.dat(trang, "stringvalue", mang)
                break
        return b"[1]"

    def _xu_ly_post_ipbmac(self, params):
        """Xu ly luu cau hinh Bind IP to MAC (fid=126):
        Chuyen doi tham so tu form sIpBndMac sang chuoi NVRAM sIpBindMac de render.
        """
        raw_bind = params.get("sIpBndMac", "")
        enable = str(params.get("sIpBndMacEnable", "0")) == "1"
        strict = str(params.get("sIpBndMacStrict", "0")) == "1"
        en_str = "ON" if enable else "OFF"
        st_str = "ON" if strict else "OFF"

        header = f"##ip bind mac function is turned {en_str}##ip bind mac function is STRICT {st_str}##Show all IP Bind MAC entries."

        entries = []
        for line in raw_bind.strip().splitlines():
            line = line.strip()
            if not line:
                continue
            m = re.match(r'^(\S+)\s+([0-9A-Fa-f:-]+)(?:\s+"([^"]*)")?', line)
            if m:
                ip = m.group(1)
                mac = m.group(2).upper().replace(":", "-")
                cmt = m.group(3) or ""
                entries.append(f"##IP : {ip} bind MAC : {mac} HOST ID : --- Comment : {cmt}")

        full_str = header + "".join(entries)
        config_store.dat("doc/ipbmac.htm", "sIpBindMac", full_str)
        config_store.dat("doc/ipbmac.htm", "sIpBndMacEnable", 1 if enable else 0)
        config_store.dat("doc/ipbmac.htm", "sIpBndMacStrict", 1 if strict else 0)

    def _xu_ly_post_ipbandw(self, params):
        """Xu ly luu cau hinh Bandwidth Limit (doc/ipbandw.htm, fid=302):
        Dong bo Enable (sIpBandwFlag), TX/RX mac dinh va mang Limitation List aryIpBandw.
        """
        en = str(params.get("sIpBandwEnable", "")).strip()
        flag = int(config_store.lay("doc/ipbandw.htm", "sIpBandwFlag") or 8192)
        if en == "1":
            flag = flag | 1
        elif en == "0":
            flag = flag & ~1
        config_store.dat("doc/ipbandw.htm", "sIpBandwFlag", flag)

        def_tx_str = params.get("sIpBandwDefTx")
        if def_tx_str and str(def_tx_str).isdigit():
            tx_val = int(def_tx_str)
            tx_u = int(params.get("iDefTx", 1) or 1)
            config_store.dat("doc/ipbandw.htm", "sIpBandwDefTx", tx_val | 0x8000 if tx_u == 1 else tx_val)

        def_rx_str = params.get("sIpBandwDefRx")
        if def_rx_str and str(def_rx_str).isdigit():
            rx_val = int(def_rx_str)
            rx_u = int(params.get("iDefRx", 1) or 1)
            config_store.dat("doc/ipbandw.htm", "sIpBandwDefRx", rx_val | 0x8000 if rx_u == 1 else rx_val)

        ary = [["", "", 0, 0, "N"] for _ in range(20)]
        found_idx = 0
        for i in range(20):
            val = params.get(f"sIpBandwidth{i}", "").strip()
            if not val:
                continue
            parts = val.split()
            if len(parts) >= 3 and "-" in parts[0]:
                ipf, ipt = parts[0].split("-", 1)
                try:
                    tx = int(parts[1])
                except ValueError:
                    tx = 20 | 0x8000
                try:
                    rx = int(parts[2])
                except ValueError:
                    rx = 25 | 0x8000
                shrd = "Y" if (len(parts) >= 4 and parts[3].lower() == "shared") else "N"
                ary[found_idx] = [ipf, ipt, tx, rx, shrd]
                found_idx += 1

        if found_idx == 0:
            ipf = params.get("sIpBandwFrom", "").strip()
            ipt = params.get("sIpBandwTo", "").strip()
            if ipf and ipt:
                try:
                    tx_v = int(params.get("sIpBandwTx", 20) or 20)
                except ValueError:
                    tx_v = 20
                tx_u = int(params.get("iProfTx", 1) or 1)
                try:
                    rx_v = int(params.get("sIpBandwRx", 25) or 25)
                except ValueError:
                    rx_v = 25
                rx_u = int(params.get("iProfRx", 1) or 1)
                shrd = params.get("sIpBandwShrd", "N").strip().upper()
                if shrd not in ("Y", "N"):
                    shrd = "N"
                ary[0] = [ipf, ipt, tx_v | 0x8000 if tx_u == 1 else tx_v, rx_v | 0x8000 if rx_u == 1 else rx_v, shrd]

        config_store.dat("doc/ipbandw.htm", "aryIpBandw", ary)
        config_store.dat("doc/ipbandw.htm", "_ftcIsSaved", 1)

    def _xu_ly_post_enet(self, params):
        """Xu ly luu cau hinh DHCP / LAN 1 (doc/ENET.SHT, enet.cgi)."""
        lan_ip = params.get("sLanIp")
        if lan_ip:
            ary_ip = config_store.lay("doc/ENET.SHT", "aryLanIp")
            if isinstance(ary_ip, list) and ary_ip:
                ary_ip[0] = lan_ip
                config_store.dat("doc/ENET.SHT", "aryLanIp", ary_ip)
            ary_als = config_store.lay("doc/enet1.htm", "aryLanAlsIp")
            if isinstance(ary_als, list) and ary_als:
                ary_als[0] = lan_ip
                config_store.dat("doc/enet1.htm", "aryLanAlsIp", ary_als)
            config_store.dat("doc/ENET.SHT", "sLanIp", lan_ip)

        mask = params.get("sLanMask")
        if mask:
            config_store.dat("doc/ENET.SHT", "sLanMask", mask)

        dhcp = params.get("sDHCP")
        if dhcp is not None:
            config_store.dat("doc/ENET.SHT", "sDHCP", str(dhcp))

        for k in ("sDHCPStIP", "iDHCPNo", "sDHCPGwIP", "sDHCPLsTime", "iRIPLAN", "sDNSPri", "sDNSSnd"):
            if k in params:
                config_store.dat("doc/ENET.SHT", k, params[k])

        if "chkrmclnts" in params:
            config_store.dat("doc/ENET.SHT", "chkrmclnts", 1 if params.get("chkrmclnts") in ("1", 1, True, "on") else 0)

    def _serve_cgi(self, path, params, method="GET"):
        # DrayTek Object String polling (fid=4048): thiet bi that tra ve chuoi ket thuc bang -1 khi het du lieu.
        # Tra ve ngay -1 de ngan vong lap polling vo tan (gay spam [CU] POST -> _pages/page_195.html).
        if path.lower() == "/cgi-bin/v2x00.cgi" and str(params.get("fid")) == "4048":
            self._log("DULIEU", path, "-> fid=4048 Object String (-1)")
            return self._send(b"-1", "text/plain")

        goc, st, ct = tim_trang_goc(method, path, params)

        # 0) Hop dong ghi status=200 => day la DU LIEU (JSON/JS/text), khong phai trang.
        #    Phuc vu thang tu ban goc voi dung Content-Type. KHONG lay ban cu trong
        #    _pages/ vi ban do bi chen <!DOCTYPE html> o dau file, lam hong script.
        if goc and st == 200 and not goc.startswith("doc/"):
            if render.co_trang(goc):
                data, _ = render.render(goc)
                self._log("DULIEU", path, f"-> {goc} ({len(data)}B, {ct})")
                return self._send(data, kieu_noi_dung(goc, ct))

        # 1) Uu tien ban MOI neu trang nay da duoc dung lai
        if goc and goc in da_dung() and render.co_trang(goc):
            # HOP DONG 2.4: thiet bi that tra 302 kem Location cho cac .cgi trang.
            # Phai giu dung 302, vi URL cuoi cung tren thanh dia chi quyet dinh
            # cach trinh duyet giai DUONG DAN TUONG DOI trong trang
            # (vd XBakRest.htm co <frame src=XgCert.HTM> -> phai thanh /doc/XgCert.HTM).
            # Tra thang 200 tai /cgi-bin/... se lam moi duong dan tuong doi tro sai cho.
            if st == 302:
                self._log("302", path, f"-> /{goc}")
                return self._redirect("/" + goc)
            if self._phuc_vu_moi(goc, path):
                return True

        # 2) Fallback: ban CU trong www/_pages/ qua _routes.json
        page = find_page(path, params)
        if page:
            self._log("CU", path, f"-> {page}")
            return self._file(page, params)
        page = find_page(path, {})
        if page:
            self._log("CU", path, f"-> {page} (khop path tran)")
            return self._file(page)
        self._log("RONG", path, "khong co ban ghi")
        return self._send("", "text/html; charset=utf-8")

    def do_GET(self):
        config_store.dat_nguoi_dung_hien_tai(self._client_id())
        u = urlparse(self.path)
        p = unquote(u.path)

        if p in ("/", "/index.html", "/weblogin.htm", "/wlogin.htm"):
            return self._file("weblogin.htm")

        # FRAMESET va cac FRAME KHUNG: uu tien ban goc trong reference/source/.
        # Ban cu www/index.htm bi NHIEM tien ich trinh duyet (ng-scope, data-yd-,
        # plasmo-csui) va phinh 25KB — ma day la nen cua MOI trang.
        if p in ("/index.htm", "/main.htm"):
            if "index.htm" in da_dung() and render.co_trang("index.htm"):
                if self._phuc_vu_moi("index.htm", p):
                    return
            return self._file("index.htm")
        if p in ("/api/reset", "/resetsession"):
            config_store.dat_lai_factory(self._client_id())
            data = b'{"status":"ok","message":"Vigor2927 state reset"}'
            self.send_response(200)
            self._cors()
            self.send_header("Content-Type", "application/json")
            self.send_header("Content-Length", str(len(data)))
            self.end_headers()
            self.wfile.write(data)
            return
        if "logout" in p.lower():
            uid = self._client_id()
            config_store.USER_CONFIGS.pop(uid, None)
            return self._redirect("/")
        if p.lstrip("/") in FRAME_PAGES:
            rel = p.lstrip("/")
            if rel in da_dung() and render.co_trang(rel):
                if self._phuc_vu_moi(rel, p):
                    return
            return self._file(rel)
        if p.endswith(".cgi"):
            params = self._flat(u.query)
            kq = self._ghi_qua_ajax_get(p, params)
            if kq is not None:
                self._log("GHI-JSON", p, f"-> {kq}")
                return self._send(kq, "application/json")
            return self._serve_cgi(p, params)

        # Trang goc truy cap thang theo DUNG duong dan that (/doc/enet1.htm, /doc/cf1.HTM)
        rel = p.lstrip("/")
        if rel in da_dung() and render.co_trang(rel):
            if self._phuc_vu_moi(rel, p):
                return

        if self._file(p):
            return
        # Chua co ban cu nhung CO ban goc -> van phuc vu duoc
        if render.co_trang(rel):
            return self._phuc_vu_moi(rel, p)
        return self._send(b"Not found: " + p.encode(), "text/plain", 404)

    def _cors(self):
        self.send_header("Access-Control-Allow-Origin", "*")
        self.send_header("Access-Control-Allow-Headers", "*")
        self.send_header("Access-Control-Allow-Methods", "POST, GET, OPTIONS")

    def do_OPTIONS(self):
        self.send_response(204)
        self._cors()
        self.end_headers()

    def do_POST(self):
        config_store.dat_nguoi_dung_hien_tai(self._client_id())
        u = urlparse(self.path)
        p = unquote(u.path)
        # doc body
        try:
            n = int(self.headers.get("Content-Length", 0))
        except ValueError:
            n = 0
        body = self.rfile.read(n).decode("utf-8", "ignore") if n else ""
        params = self._flat(u.query)
        params.update(self._flat(body))

        if p in ("/api/reset", "/resetsession"):
            config_store.dat_lai_factory(self._client_id())
            data = b'{"status":"ok","message":"Vigor2927 state reset"}'
            self.send_response(200)
            self._cors()
            self.send_header("Content-Type", "application/json")
            self.send_header("Content-Length", str(len(data)))
            self.end_headers()
            self.wfile.write(data)
            return

        # Bo thu thap tich hop (thay collector.py rieng): POST /save?name=X&ext=Y
        # Ghi vao captures_new/ de dung khi can crawl lai tu thiet bi that.
        # Bang chung goc da duyet nam o ../reference/ (chi doc, xem CLAUDE.md 2.3).
        if p == "/save":
            name = re.sub(r"[^A-Za-z0-9_.-]", "_", params.get("name", "noname"))
            ext = re.sub(r"[^A-Za-z0-9]", "", params.get("ext", "txt"))[:8] or "txt"
            cap = os.path.join(BASE, "captures_new")
            os.makedirs(cap, exist_ok=True)
            with open(os.path.join(cap, f"{name}.{ext}"), "w", encoding="utf-8") as fh:
                fh.write(body)
            data = b"OK"
            self.send_response(200)
            self._cors()
            self.send_header("Content-Type", "text/plain")
            self.send_header("Content-Length", str(len(data)))
            self.end_headers()
            try:
                self.wfile.write(data)
            except (BrokenPipeError, ConnectionResetError):
                pass
            return

        if "wlogin" in p:
            return self._redirect("/index.htm")

        if p.endswith(".cgi"):
            # Dac biet: General Setup WAN (fid=101) luu tren mwangen1.htm, thiet bi that tra 302 ve lai mwangen1.htm
            if p == "/cgi-bin/wan.cgi" and params.get("fid") == "101":
                self._log("302", p, "-> /doc/mwangen1.htm (General Setup)")
                return self._redirect("/doc/mwangen1.htm")
            if p.lower() == "/cgi-bin/v2x00.cgi" and str(params.get("fid")) == "4048":
                self._log("DULIEU", p, "-> fid=4048 Object String (-1)")
                return self._send(b"-1", "text/plain")
            if p.lower() == "/cgi-bin/v2x00.cgi" and str(params.get("fid")) in ("4042", "4044"):
                self._log("302", p, "-> Policy Routing (fid=4042/4044)")
                return self._redirect("/cgi-bin/v2x00.cgi?fid=4041&iAct=1&iModeWizAdv=1")

            goc, _st, _ct = tim_trang_goc("POST", p, params)
            # POST co GHI cau hinh khi mang co `webchange` (DrayTek dung co nay
            # de danh dau form Apply/Save, xem spec/cgi-map.json).
            is_ipbmac = (goc == "doc/ipbmac.htm" or params.get("fid") == "126")
            is_enet = (p == "/cgi-bin/enet.cgi" or (goc == "doc/ENET.SHT" and str(params.get("webchange")) == "1"))
            is_ipbandw = (goc == "doc/ipbandw.htm" or str(params.get("fid")) == "302")
            if (params.get("webchange") or is_ipbmac or is_enet or is_ipbandw) and (goc or is_enet or is_ipbandw):
                if is_enet and not goc:
                    goc = "doc/ENET.SHT"
                if not goc and is_ipbandw:
                    goc = "doc/ipbandw.htm"
                if goc == "doc/ipbmac.htm":
                    self._xu_ly_post_ipbmac(params)
                elif is_enet:
                    self._xu_ly_post_enet(params)
                elif is_ipbandw:
                    self._xu_ly_post_ipbandw(params)
                n = config_store.ghi_post(p, params, goc)
                self._log("GHI", p, f"-> config_store: {n} gia tri  (trang {goc})")
                # Hop dong 2.4: thiet bi that tra 302 kem Location tro sang trang dich
                red_path = "/" + goc
                if is_enet:
                    red_path += "?save_success=1"
                return self._redirect(red_path)
            # Dieu huong POST (bam dong bang -> form.submit): phuc vu dung trang
            return self._serve_cgi(p, params, method="POST")

        # Form Apply/Save khac: bao thanh cong, khong ghi cau hinh
        return self._redirect(self.headers.get("Referer") or "/index.htm")

    def log_message(self, *a):
        pass          # log chi tiet da in o _log(), khong can dong mac dinh cua thu vien


class DualStack(ThreadingHTTPServer):
    address_family = socket.AF_INET6
    daemon_threads = True

    def server_bind(self):
        try:
            self.socket.setsockopt(socket.IPPROTO_IPV6, socket.IPV6_V6ONLY, 0)
        except (AttributeError, OSError):
            pass
        super().server_bind()


def make(port):
    try:
        return DualStack(("::", port), H)
    except OSError:
        s = ThreadingHTTPServer(("0.0.0.0", port), H)
        s.daemon_threads = True
        return s


if __name__ == "__main__":
    srv = make(PORT)
    data, _ = get_routes()
    print("=" * 60)
    print("  Gia lap DrayTek Vigor2927 - tu thiet bi that")
    print(f"  Mo trinh duyet: http://localhost:{PORT}/")
    print(f"  So trang cau hinh: {len(data)}")
    print("  Dang nhap: user + password bat ky (khong rong)")
    print("  Ctrl+C de dung")
    print("=" * 60)
    try:
        srv.serve_forever()
    except KeyboardInterrupt:
        print("\nDa dung.")
