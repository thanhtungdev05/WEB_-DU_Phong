#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""Lop noi AX3000CV2 firmware 0.5.3 vao he thong bai hoc FTC.

Ban gia lap firmware moi nam nguyen trong fw_053/ (server that + bang chung).
File nay KHONG sua logic cua no, chi bo sung nhung gi Portal can — giu dung
cac tinh nang ma ban cu (server.py, firmware 0.10.2) da co:
  - Dang nhap admin/admin (anh Huynn chon 2026-09-26; thiet bi that la 6455147589).
  - GET /sim-reset-session: huy moi phien + dua cau hinh ve mac dinh
    (nut Huong dan / Thuc hanh goi truoc khi mo trang login).
  - Trang "/" chen them /ftc-ax3000c.js: dat document._ftcIsSaved cho bo cham
    diem (thay cho sim-pages/state.js cua ban cu).

Chay rieng: python server_fw053.py [cong]   (mac dinh 8090)
"""
import gzip
import hashlib
import importlib.util
import json
import os
import re
import sys
import threading
import time
from collections.abc import MutableMapping
from http.server import ThreadingHTTPServer

_HERE = os.path.dirname(os.path.abspath(__file__))
_SRC = os.path.join(_HERE, "fw_053", "src")
if _SRC not in sys.path:
    sys.path.insert(0, _SRC)

# Nap server firmware moi theo duong dan tep, dat ten rieng de khong dung
# module 'server' cua thiet bi khac trong run_all.py.
_spec = importlib.util.spec_from_file_location("ax3000c_fw053_server", os.path.join(_SRC, "server.py"))
_goc = importlib.util.module_from_spec(_spec)
sys.modules["ax3000c_fw053_server"] = _goc
_spec.loader.exec_module(_goc)

PORT = int(sys.argv[1]) if len(sys.argv) > 1 and sys.argv[1].isdigit() else 8090

# Tai khoan hoc vien: admin/admin (Portal cung bat buoc admin/admin o trang login)
_goc.TAI_KHOAN.clear()
_goc.TAI_KHOAN["admin"] = "admin"

# Rut ngan thoi gian cho xuong muc toi thieu (khong do tre, lam nhanh nhat cho hoc vien)
_goc.REBOOT_SAP_S = 0.3
_goc.REBOOT_CHUA_SAN_S = 0.3
_goc.REBOOT_GOC_UPTIME_S = 0.0
#   - Giao dien: thay luc phuc vu tep, KHONG de tre hoac khoa mat na agent mode
THAY_JS = {
    "js__chunk-2d0b6e5b.9b4ab5b7.1726822665278.js": [  # WAN
        (b"checkNetworkStatus(2e4)", b"checkNetworkStatus(100)"),
        (b"checkNetworkStatus(3e3)", b"checkNetworkStatus(100)"),
        (b'loadingText:"WAN settings are unavailable currently in bridge agent mode."', b'loadingText:""'),
        (b'username:"fpt",password:"fpt"', b'username:"",password:""'),
    ],
    "js__chunk-7266f7c8.9b4ab5b7.1726822665278.js": [  # LAN
        (b"checkNetworkStatus(2e4)", b"checkNetworkStatus(100)"),
        (b"checkNetworkStatus(3e3)", b"checkNetworkStatus(100)"),
    ],
    "js__chunk-16271a96.9b4ab5b7.1726822665278.js": [  # LAN IPv6
        (b"checkNetworkStatus(2e4)", b"checkNetworkStatus(100)"),
        (b"checkNetworkStatus(3e3)", b"checkNetworkStatus(100)"),
    ],
    "js__chunk-2d237504.9b4ab5b7.1726822665278.js": [  # Wi-Fi
        (b"e.checkWIFiStatus(0)", b"e.loading=!1"),
        (b'attrs:{"element-loading-text":e.loadingText}', b'attrs:{"element-loading-text":""}'),
    ],
    "js__chunk-2d0c8817.9b4ab5b7.1726822665278.js": [  # Wi-Fi Advanced
        (b'attrs:{"element-loading-text":H.$t("Currently in agent mode, can not configure wifi parameters")}', b'attrs:{"element-loading-text":""}'),
    ],
    "js__chunk-82690506.9b4ab5b7.1726822665278.js": [  # Port Forwarding: Device/IP nhap tay + khong reload ca trang khi Apply
        (
            b'attrs:{prop:"dest_ip",label:"Device/IP"},scopedSlots:e._u([{key:"default",fn:function(t){return[r("el-select",{staticStyle:{width:"100%"},attrs:{filterable:"","allow-create":"",placeholder:"select"},model:{value:t.row.dest_ip,callback:function(r){e.$set(t.row,"dest_ip",r)},expression:"scope.row.dest_ip"}},e._l(e.leasesIPs,function(e){return r("el-option",{key:e[0],attrs:{label:e[1],value:e[0]}})}),1)]}}])',
            b'attrs:{prop:"dest_ip",label:"Device/IP"},scopedSlots:e._u([{key:"default",fn:function(t){return[r("el-input",{on:{input:e.forceUpdate},model:{value:t.row.dest_ip,callback:function(r){e.$set(t.row,"dest_ip",r)},expression:"scope.row.dest_ip"}})]}}])',
        ),
        (
            b'(location.reload(),e.$message.success(e.$t("Configuration has been applied")))',
            b'(e.deleteLine=[],e.deleteLines=[],e.getPortfwd(),e.$message.success(e.$t("Configuration has been applied")))',
        ),
    ],
    "js__chunk-3404a532.9b4ab5b7.1726822665278.js": [  # DHCP / Reserved IP: khong reload ca SPA khi Apply
        (
            b'(location.reload(),e.$message.success(e.$t("Configuration has been applied")))',
            b'(e.deleteLine=[],e.deleteLines=[],e.getDHCP(),e.$message.success(e.$t("Configuration has been applied")))',
        ),
    ],
    "js__chunk-13cd769e.9b4ab5b7.1726822665278.js": [  # Public LAN: khong reload ca SPA khi Apply
        (
            b'(t.$message.success(t.$t("Configuration has been applied")),location.reload())',
            b'(t.deleteLine=[],t.deleteLines=[],t.getData(),t.$message.success(t.$t("Configuration has been applied")))',
        ),
    ],
    "js__chunk-2d20fee3.9b4ab5b7.1726822665278.js": [  # Parental Control: khong reload ca SPA khi Apply
        (
            b'(location.reload(),e.$message.success(e.$t("Configuration has been applied")))',
            b'(e.deleteLine=[],e.deleteLines=[],e.getParental(),e.$message.success(e.$t("Configuration has been applied")))',
        ),
    ],
    "js__chunk-58926e63.9b4ab5b7.1726822665278.js": [  # Website Filter: khong reload ca SPA khi Apply
        (
            b'(location.reload(),e.$message.success(e.$t("Configuration has been applied")))',
            b'(e.deleteLine=[],e.deleteLines=[],e.getWebsite(),e.$message.success(e.$t("Configuration has been applied")))',
        ),
    ],
    "js__chunk-44bc1f1e.9b4ab5b7.1726822665278.js": [  # Login: khong ban 2 request /ubus thua luc mo trang + sua duong dan icon
        (
            b'created:function(){var e=this;this.$session.login().then(function(t){t?e.$session.updateACLs().then(function(){e.$router.push("/")}):e.login=!1}).catch(function(){e.login=!1}),this.$session.logout(),',
            b'created:function(){this.login=!1,this.$session.stopHeartbeat(),sessionStorage.removeItem("sid"),',
        ),
        (b'src:"/icons/wifi-icon.svg"', b'src:"/sim_ax3000c/icons/wifi-icon.svg"'),
        (b'"/icons/gf_logo.png"', b'"/sim_ax3000c/icons/gf_logo.png"'),
    ],
    "js__chunk-47368b9a.9b4ab5b7.1726822665278.js": [  # Layout: giam tan suat poll system.info tu 1s xuong 30s + sua duong dan icon
        (
            b'this.timerId=setInterval(function(){t.$system.getInfo().then(function(e){var s=e.release,n=e.localtime,o=e.uptime,a=new Date(1e3*n),i=a.toUTCString().split("GMT")[0];t.sysinfo={release:s.revision,localtime:i,uptime:"%t".format(o)}})},1e3)',
            b'(function(){var _u=function(){t.$system.getInfo().then(function(e){var s=e.release,n=e.localtime,o=e.uptime,a=new Date(1e3*n),i=a.toUTCString().split("GMT")[0];t.sysinfo={release:s.revision,localtime:i,uptime:"%t".format(o)}})};_u(),this.timerId=setInterval(_u,3e4)}).call(this)',
        ),
        (b'"/icons/', b'"/sim_ax3000c/icons/'),
    ],
    "js__chunk-b90fa57a.9b4ab5b7.1726822665278.js": [  # Home: giam tan suat poll tu 2s xuong 30s + chan reload + sua icon
        (
            b"timers:{update:{time:2e3,autostart:!0,immediate:!0,repeat:!0},update2:{time:2e4,autostart:!0,immediate:!0,repeat:!0}}",
            b"timers:{update:{time:3e4,autostart:!0,immediate:!0,repeat:!0},update2:{time:6e4,autostart:!0,immediate:!0,repeat:!0}}",
        ),
        (
            b"1==e.reload?window.location.reload():1==e.loading&&(e.loading=!1)",
            b"e.loading=!1,e.reload=!1",
        ),
        (b'"/icons/', b'"/sim_ax3000c/icons/'),
    ],
    "js__chunk-26c4d9fc.9b4ab5b7.1726822665278.js": [
        (b'"/icons/', b'"/sim_ax3000c/icons/'),
    ],
    "js__chunk-6b9124a9.9b4ab5b7.1726822665278.js": [
        (b'"/icons/', b'"/sim_ax3000c/icons/'),
    ],
    "js__chunk-2d2176af.9b4ab5b7.1726822665278.js": [  # EasyMesh legacy topology: xoa lenh break sai cu phap trong firmware goc
        (b"{e.loading=!1;break}", b"e.loading=!1"),
    ],
    "js__app.9b4ab5b7.1726822665278.js": [  # Reboot, Router anti-white-screen, Chunk retry, Vuex lang default, Ubus paths
        (b"window.setTimeout(o,5e3)}", b"window.setTimeout(o,200)}"),
        (b"window.setTimeout(o,2e3)}", b"window.setTimeout(o,200)}"),
        (b'void 0===t&&(t="/"),void 0===n&&(n=160);', b"void 0===t&&(t=location.pathname),void 0===n&&(n=1);"),
        (b'c.p="/"', b'c.p="/sim_ax3000c/"'),
        (
            b'function s(e){return"chunk-82690506"===e?c.p+"js/"+e+".9b4ab5b7.1726822665278.js?v=v21_clean_input":c.p+"js/"+({}[e]||e)+".9b4ab5b7.1726822665278.js"}',
            b'function s(e){return c.p+"js/"+({}[e]||e)+".9b4ab5b7.1726822665278.js?v=__FTC_ASSET_V__"}',
        ),
        (
            b'function s(e){return c.p+"js/"+({}[e]||e)+".9b4ab5b7.1726822665278.js"}',
            b'function s(e){return c.p+"js/"+({}[e]||e)+".9b4ab5b7.1726822665278.js?v=__FTC_ASSET_V__"}',
        ),
        (
            b'c.oe=function(e){throw console.error(e),e};',
            b'c._ce=c.e,c.e=function(e){return c._ce(e).catch(function(){return a[e]=void 0,r[e]=void 0,c._ce(e)})},c.oe=function(e){console.warn("[ChunkError]",e)};',
        ),
        (
            b'v.onError(function(e){if("MODULE_NOT_FOUND"!==e.code)throw e;v.push("/404")})',
            b'v.onError(function(e){console.warn("[Router]",e);if(e&&"MODULE_NOT_FOUND"===e.code)v.push("/404")})',
        ),
        (
            b'state:{menus:[],hostname:"",lang:""}',
            b'state:{menus:[],hostname:"",lang:"en"}',
        ),
        (
            b'logout:function(){var e=this;return new Promise(function(t){i["b"].call("session","destroy").then(function(){t()}).catch(function(){t()}),e.stopHeartbeat(),sessionStorage.removeItem("sid")})}',
            b'logout:function(){var e=this;return new Promise(function(t){var s=sessionStorage.getItem("sid");e.stopHeartbeat(),sessionStorage.removeItem("sid"),!s||s===a?t():i["b"].call("session","destroy").then(function(){t()}).catch(function(){t()})})}',
        ),
        (b'r.a.post("/ubus"', b'r.a.post("/sim_ax3000c/ubus"'),
        (b'.get("/i18n"', b'.get("/sim_ax3000c/i18n"'),
        (b'.get("/views/"', b'.get("/sim_ax3000c/views/"'),
        (b'"/icons/', b'"/sim_ax3000c/icons/'),
        (b"15e3", b"6e4"),
    ],
}

THAY_CSS = {
    "css__app.06c49f94.css": [
        (b"url(/icons/", b"url(/sim_ax3000c/icons/"),
        (
            b'font-family:Noto Sans;src:url(../fonts/NotoSans-Regular.2a1861cd.ttf) format("truetype")',
            b'font-family:Noto Sans;font-display:swap;src:url(../fonts/NotoSans-Regular.2a1861cd.ttf) format("truetype")',
        ),
        (
            b"body{font-family:Noto Sans;background-color:#fff}",
            b"body{font-family:'Noto Sans',-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,Arial,sans-serif;background-color:#fff}",
        ),
        (
            b".oui-filebrowser .selected{background-color:#cce8ff}",
            b".oui-filebrowser .selected{background-color:#cce8ff}"
            b".aside-footer-right{height:50px;line-height:50px;text-decoration:underline}"
            b".aside-footer-left{height:50px;line-height:50px;font-weight:400;font-size:14px;color:#8c8c8c;cursor:pointer}"
            b".aside-footer-left .logout{background-image:url(/sim_ax3000c/icons/log-out.svg);display:inline-block;width:16px;height:16px;background-repeat:no-repeat;margin-left:8px;margin-bottom:-4px}"
            b"@media(max-width:960px){"
            b"html,body,#app{max-width:100%;overflow-x:hidden}"
            b".login-fpt{display:flex;flex-direction:column;align-items:center;padding:16px}"
            b".login-fpt .el-col-12{width:100%!important;float:none}"
            b".login-fpt .el-col-12:first-child{display:none}"
            b".logo-fpt{display:block;width:auto!important;max-width:220px!important;height:auto!important;margin:16px auto 8px!important}"
            b".login-form{width:100%!important;max-width:420px!important;margin:0 auto!important}"
            b".el-main{padding:12px!important;overflow-x:auto!important;-webkit-overflow-scrolling:touch}"
            b".el-table,.el-form{max-width:100%!important;overflow-x:auto!important}"
            b"}",
        ),
    ],
}

TEP_FTC_JS = os.path.join(_HERE, "ftc", "ftc-ax3000c.js")
_ASSET_V_PLACEHOLDER = b"__FTC_ASSET_V__"


def _tinh_phien_ban_tai_nguyen():
    """Phien ban (16 hex) cua bo JS/CSS da va: doi khi bang va hoac tep firmware tham chieu doi.

    Ten tep goc (vd app.9b4ab5b7...js) la hash cua firmware CHUA va nen khong du de pha cache.
    Truoc 2026-11-12, index.html van tro ?v=v21_clean_input trong khi tep tra
    "immutable" 1 nam -> may da mo truoc ban va 10/11 tiep tuc chay app.js cu (trang man/giat).
    """
    h = hashlib.sha256(b"ax3000c-fw053-assets-v2\n")
    h.update(repr(sorted(THAY_JS.items())).encode("utf-8"))
    h.update(repr(sorted(THAY_CSS.items())).encode("utf-8"))
    try:
        for ten in sorted(os.listdir(_goc.GOC_WWW)):
            if ten.endswith((".js", ".css")):
                kich_thuoc = os.path.getsize(os.path.join(_goc.GOC_WWW, ten))
                h.update(ten.encode("utf-8") + b":" + str(kich_thuoc).encode("ascii") + b"\n")
    except OSError:
        pass
    return h.hexdigest()[:16]


def _tinh_phien_ban_ftc_js():
    try:
        with open(TEP_FTC_JS, "rb") as f:
            return hashlib.sha256(f.read().replace(b"\r\n", b"\n")).hexdigest()[:16]
    except OSError:
        return "0" * 16


ASSET_V = _tinh_phien_ban_tai_nguyen()
FTC_JS_V = _tinh_phien_ban_ftc_js()
THE_CHEN = b"<script src=/sim_ax3000c/ftc-ax3000c.js?v=" + FTC_JS_V.encode("ascii") + b"></script>"
CACHE_CO_PHIEN_BAN = "public, max-age=31536000, immutable"
# URL khong mang dung phien ban hien tai (chi app.js cu trong cache moi goi): luon hoi lai
# server (ETag -> 304). Khong dung "no-cache" vi run_all.py bo header do voi tep tinh.
CACHE_CHUA_PHIEN_BAN = "public, max-age=0, must-revalidate"
# Anh/font/icon cua firmware khong bi va va khong doi -> cache 7 ngay.
CACHE_TEP_TINH_KHAC = "public, max-age=604800"
_RE_TAI_NGUYEN_INDEX = re.compile(
    rb"((?:href|src)=/sim_ax3000c/(?:js|css)/[^\s>?]+\.(?:js|css))(?:\?v=[^\s>]*)?"
)
_PREPATCHED_CACHE = {}
_CACHE_LOCK = threading.RLock()
_GZIP_EXTS = {".html", ".js", ".css", ".json", ".svg", ".ttf", ".woff", ".ico"}


def _xoa_fpt_wan(kho_dict):
    if not isinstance(kho_dict, dict):
        return
    for khoa in (_goc.KHOA_CAY_UCI, _goc.KHOA_CAY_CIGEXT):
        c = kho_dict.get(khoa)
        if isinstance(c, dict) and "network" in c and isinstance(c["network"], dict):
            wan = c["network"].get("wan")
            if isinstance(wan, dict):
                if wan.get("username") == "fpt":
                    wan["username"] = ""
                if wan.get("password") == "fpt":
                    wan["password"] = ""

_xoa_fpt_wan(_goc.KHO._goc)
_xoa_fpt_wan(_goc.KHO._du_lieu)

# main() cua ban goc khong chay khi nap qua run_all.py -> dong bo khung tu uci mot lan o day
_goc._dong_bo_khung_tu_uci()
# Cap nhat luon vao _goc de moi phien KTV moi hoac reset deu ke thua khung da dong bo O(1)
_goc.KHO._goc.update(_goc.KHO._current()._du_lieu)


class _TemporaryFilesBySession(MutableMapping):
    """Bộ nhớ /tmp riêng theo phiên, tránh backup của KTV này rò sang KTV khác."""

    def __init__(self):
        self._lock = threading.RLock()
        self._stores = {}

    def _current(self):
        key = _goc.KHO.current_key()
        with self._lock:
            return self._stores.setdefault(key, {})

    def reset(self, key):
        with self._lock:
            self._stores.pop(key, None)

    def __getitem__(self, key):
        return self._current()[key]

    def __setitem__(self, key, value):
        self._current()[key] = value

    def __delitem__(self, key):
        del self._current()[key]

    def __iter__(self):
        return iter(tuple(self._current()))

    def __len__(self):
        return len(self._current())


_TMP_THEO_KTV = _TemporaryFilesBySession()
_goc._TMP = _TMP_THEO_KTV


def dat_lai_thiet_bi(client_key):
    """Chỉ hủy phiên và cấu hình của KTV hiện tại."""
    _goc.KHO.bind(client_key)
    for sid, session in list(_goc._phien.items()):
        if session.get("client_key") == client_key:
            _goc._phien.pop(sid, None)
    _TMP_THEO_KTV.reset(client_key)
    _goc._REBOOT_THEO_KTV.pop(client_key, None)
    _goc.KHO.reset(client_key)


def dat_trang_thai_bai(bai):
    """Trang thai xuat phat rieng cua tung bai Lab (goi tu onSimLoad cua bai hoc, luc dang o trang login).

    Ghi qua dung loi goi *set cua firmware (nhu bam Apply that) de uci va cac khung *_get
    di theo — khong sua thang kho.
      Bai 2 (Wi-Fi): Dam bao MeshRole = Controller de khong bao gio bi khoa.
      Bai 5 (DHCP): IP LAN 192.168.1.1, DHCP start 192.168.1.2 (nhu ban cu) — hoc vien doi
                    sang 192.168.100.1 thi firmware tu nhay dai DHCP (.2 -> .254).
      Bai 7 (Mesh): Enabled bat, MeshRole = Agent (anh Huynn chon) — hoc vien doi sang
                    Controller; giao dien Wi-Fi da duoc mo khoa hoan toan khong con bi treo."""
    if str(bai) not in ("2", "5", "7"):
        return False
    sid = "ftc" + os.urandom(13).hex()
    _goc._phien[sid] = {
        "user": "admin",
        "luc": time.time(),
        "client_key": _goc.KHO.current_key(),
    }

    def goi(doi_tuong, ham, ts):
        return _goc._xu_ly_ubus_day_du({"params": [sid, doi_tuong, ham, ts]}).get("result") or [1]

    try:
        if str(bai) == "2":
            hien = goi("network.wireless.easymesh", "get", {})
            ts = dict(hien[1]) if len(hien) > 1 and isinstance(hien[1], dict) else {}
            ts.update({"MeshRole": "Controller"})
            kq = goi("network.wireless.easymesh", "set", ts)
        elif str(bai) == "5":
            kq = goi("data_repo.cigext", "set", {"network": {"lan": {"ipaddr": "192.168.1.1"}},
                                                 "dhcp": {"lan": {"start": "192.168.1.2"}}})
        else:
            hien = goi("network.wireless.easymesh", "get", {})
            ts = dict(hien[1]) if len(hien) > 1 and isinstance(hien[1], dict) else {}
            ts.update({"MeshEnabled": True, "MeshRole": "Agent"})
            kq = goi("network.wireless.easymesh", "set", ts)
        return kq[0] == 0
    finally:
        _goc._phien.pop(sid, None)


def _dong_goi_cache(raw_bytes, allow_gzip=True):
    """Tao ban ghi cache kem ETag va ban nen Gzip san trong RAM."""
    etag = '"' + hashlib.sha1(raw_bytes).hexdigest()[:16] + '"'
    gz_bytes = None
    if allow_gzip and len(raw_bytes) >= 256:
        compressed = gzip.compress(raw_bytes, compresslevel=6)
        if len(compressed) < len(raw_bytes):
            gz_bytes = compressed
    return {"raw": raw_bytes, "gzip": gz_bytes, "etag": etag}


def _ten_tep_ftc(duong_dan):
    """Map ca /sim_ax3000c/... lan /... ve ten tep phang trong reference/www."""
    p = duong_dan.split("?")[0].split("#")[0]
    if p.startswith("/sim_ax3000c/"):
        p = p[len("/sim_ax3000c"):]
    return _goc._ten_tep(p)


def _lay_cache_tep(cache_key, builder_fn, allow_gzip=True):
    entry = _PREPATCHED_CACHE.get(cache_key)
    if entry is not None:
        return entry
    with _CACHE_LOCK:
        entry = _PREPATCHED_CACHE.get(cache_key)
        if entry is not None:
            return entry
        raw_bytes = builder_fn()
        if raw_bytes is None:
            return None
        entry = _dong_goi_cache(raw_bytes, allow_gzip=allow_gzip)
        _PREPATCHED_CACHE[cache_key] = entry
        return entry


def _doc_va_va_tep(ten):
    p_tep = os.path.join(_goc.GOC_WWW, ten)
    if not os.path.isfile(p_tep):
        return None
    duoi = os.path.splitext(ten)[1].lower()
    with open(p_tep, "rb") as f:
        data = f.read()
    if ten in THAY_JS:
        for cu, moi in THAY_JS[ten]:
            data = data.replace(cu, moi)
    if ten in THAY_CSS:
        for cu, moi in THAY_CSS[ten]:
            data = data.replace(cu, moi)
    if duoi in (".js", ".css"):
        data = data.replace(_ASSET_V_PLACEHOLDER, ASSET_V.encode("ascii"))
    return data


def _build_index_html():
    with open(os.path.join(_goc.GOC_WWW, "__ROOT__index.html"), "rb") as f:
        html = f.read()
    # Loai bo 87 the <link rel=prefetch> gay nghen mang va trang man tren di dong
    html = re.sub(rb"<link\b[^>]*\brel=prefetch\b[^>]*>", b"", html)
    # Rewrite asset paths sang namespace /sim_ax3000c/ de tranh 404 khi load qua Portal iframe
    html = html.replace(b"href=/css/", b"href=/sim_ax3000c/css/")
    html = html.replace(b"href=/js/", b"href=/sim_ax3000c/js/")
    html = html.replace(b"src=/js/", b"src=/sim_ax3000c/js/")
    html = html.replace(b"href=/icons/", b"href=/sim_ax3000c/icons/")
    html = html.replace(b"src=/icons/", b"src=/sim_ax3000c/icons/")
    html = html.replace(b"src=/img/", b"src=/sim_ax3000c/img/")
    # Thay favicon 192 KB trong iframe bang inline icon 0-byte de trang tai xong nhanh hon
    html = html.replace(b"<link rel=icon href=/logo-fpt.ico>", b'<link rel=icon href="data:,">')
    # Gan ?v=<ASSET_V> cho MOI tep JS/CSS -> index.html (no-cache) luon tro URL moi
    html = _RE_TAI_NGUYEN_INDEX.sub(lambda m: m.group(1) + b"?v=" + ASSET_V.encode("ascii"), html)
    # Man cho tuc thi 0ms trong luc trinh duyet tai va giai ma bundle Vue (tu bien mat khi Vue mount)
    html = html.replace(
        b"<div id=app></div>",
        b'<div id=app><div id=ftc-ax3000c-boot style="min-height:100vh;display:flex;align-items:center;'
        b'justify-content:center;font:14px/1.5 -apple-system,BlinkMacSystemFont,Segoe UI,Roboto,Arial,sans-serif;'
        b'color:#555;background:#fff">' + "\u0110ang t\u1ea3i giao di\u1ec7n thi\u1ebft b\u1ecb\u2026".encode("utf-8") + b'</div></div>',
        1,
    )
    # Chen TRUOC bundle de script chay truoc khi SPA doc sessionStorage
    html = html.replace(b"<script src=/sim_ax3000c/js/chunk-vendors", THE_CHEN + b"<script src=/sim_ax3000c/js/chunk-vendors", 1)
    html = html.replace(b"<script src=/js/chunk-vendors", THE_CHEN + b"<script src=/js/chunk-vendors", 1)
    return html


def _doc_ftc_js():
    with open(TEP_FTC_JS, "rb") as _f:
        return _f.read()


def _prewarm_tai_nguyen():
    """Nap va nen Gzip san cac tep cot loi trong RAM luc khoi dong de tranh nghen CPU khi dong KTV vao cung luc."""
    try:
        _lay_cache_tep("index_html", _build_index_html, allow_gzip=True)
        _lay_cache_tep("ftc_js", _doc_ftc_js, allow_gzip=True)
        cac_tep = (
            "css__app.06c49f94.css",
            "css__chunk-vendors.7705225a.css",
            "js__app.9b4ab5b7.1726822665278.js",
            "js__chunk-vendors.9b4ab5b7.1726822665278.js",
            "js__chunk-44bc1f1e.9b4ab5b7.1726822665278.js",
            "js__chunk-47368b9a.9b4ab5b7.1726822665278.js",
            "js__chunk-b90fa57a.9b4ab5b7.1726822665278.js",
            "js__chunk-2d0b6e5b.9b4ab5b7.1726822665278.js",
            "js__chunk-2d237504.9b4ab5b7.1726822665278.js",
            "js__chunk-2d0c8817.9b4ab5b7.1726822665278.js",
            "js__chunk-7266f7c8.9b4ab5b7.1726822665278.js",
            "js__chunk-82690506.9b4ab5b7.1726822665278.js",
            "js__chunk-2d0e5bff.9b4ab5b7.1726822665278.js",
        )
        for ten in cac_tep:
            duoi = os.path.splitext(ten)[1].lower()
            _lay_cache_tep("asset:" + ten, lambda t=ten: _doc_va_va_tep(t), allow_gzip=(duoi in _GZIP_EXTS))
    except Exception:
        pass


threading.Thread(target=_prewarm_tai_nguyen, daemon=True, name="ax3000c_prewarm").start()


class Handler(_goc.H):
    def _client_key(self):
        hdr = (self.headers.get("X-KTV-Session-ID", "") or "").strip()
        if hdr:
            return hdr
        if "?_ktv=" in getattr(self, "path", "") or "&_ktv=" in getattr(self, "path", ""):
            try:
                from urllib.parse import parse_qs, urlparse
                q = parse_qs(urlparse(self.path).query)
                if "_ktv" in q and q["_ktv"][0]:
                    return "cookie:" + q["_ktv"][0].strip()
            except Exception:
                pass
        cookie = self.headers.get("Cookie", "")
        match = re.search(
            r"(?:ftc_session|ax3000c_sid|PHPSESSID|ktv_client_id)=([a-zA-Z0-9_-]+)",
            cookie,
        )
        if match:
            return "cookie:" + match.group(1)
        ref = self.headers.get("Referer", "")
        if ref and "_ktv=" in ref:
            try:
                from urllib.parse import parse_qs, urlparse
                q = parse_qs(urlparse(ref).query)
                if "_ktv" in q and q["_ktv"][0]:
                    return "cookie:" + q["_ktv"][0].strip()
            except Exception:
                pass
        forwarded = (self.headers.get("X-FTC-Client-IP", "") or "").strip()
        if forwarded:
            return "ip:" + forwarded
        address = getattr(self, "client_address", None)
        return "ip:" + (str(address[0]) if address else "anonymous")

    def _bind_client(self):
        key = self._client_key()
        _goc.KHO.bind(key)
        return key

    def _cache_theo_phien_ban(self, phien_ban):
        """Chi URL mang dung ?v=<phien ban hien tai> moi duoc cache immutable."""
        from urllib.parse import parse_qs, urlparse
        try:
            v = (parse_qs(urlparse(self.path).query).get("v") or [""])[0]
        except Exception:
            v = ""
        return CACHE_CO_PHIEN_BAN if v == phien_ban else CACHE_CHUA_PHIEN_BAN

    def _chap_nhan_gzip(self):
        ae = self.headers.get("Accept-Encoding", "") or ""
        return "gzip" in ae.lower()

    def _gui(self, ma, than, kieu="text/plain; charset=utf-8"):
        """Ghi de _gui cua fw_053 de ho tro nen Gzip cho cac phan hoi /ubus lon."""
        extra = []
        if ma == 200 and len(than) >= 256 and self._chap_nhan_gzip():
            gz = gzip.compress(than, compresslevel=6)
            if len(gz) < len(than):
                than = gz
                extra.append(("Content-Encoding", "gzip"))
                extra.append(("Vary", "Accept-Encoding"))
        self.send_response(ma)
        self.send_header("Content-Type", kieu)
        self.send_header("Content-Length", str(len(than)))
        for k, v in extra:
            self.send_header(k, v)
        self.end_headers()
        self.wfile.write(than)

    def _gui_ftc(self, ma, than, kieu, them=(), cache_control="no-store", etag=None, gz_than=None):
        if isinstance(than, dict) and "raw" in than:
            etag = than.get("etag")
            gz_than = than.get("gzip")
            than = than["raw"]
        if ma == 200 and etag:
            inm = (self.headers.get("If-None-Match", "") or "").strip()
            if inm and (inm == etag or etag in [x.strip() for x in inm.split(",")]):
                self.send_response(304)
                self.send_header("ETag", etag)
                self.send_header("Cache-Control", cache_control)
                self.end_headers()
                return
        body = than
        extra_headers = list(them)
        if ma == 200 and self._chap_nhan_gzip():
            if gz_than is None and len(than) >= 256:
                compressed = gzip.compress(than, compresslevel=6)
                if len(compressed) < len(than):
                    gz_than = compressed
            if gz_than is not None:
                body = gz_than
                extra_headers.append(("Content-Encoding", "gzip"))
                extra_headers.append(("Vary", "Accept-Encoding"))
        self.send_response(ma)
        self.send_header("Content-Type", kieu)
        self.send_header("Content-Length", str(len(body)))
        self.send_header("Cache-Control", cache_control)
        if etag:
            self.send_header("ETag", etag)
        if "no-store" in cache_control or "no-cache" in cache_control:
            self.send_header("Pragma", "no-cache")
        for k, v in extra_headers:
            self.send_header(k, v)
        self.end_headers()
        self.wfile.write(body)

    def do_POST(self):
        client_key = self._bind_client()
        p = self.path.split("?")[0].split("#")[0]
        if p.rstrip("/") in ("/sim-reset-session", "/api/reset"):
            dat_lai_thiet_bi(client_key)
            return self._gui_ftc(200, b'{"ok":1}', "application/json",
                                 [("Access-Control-Allow-Origin", "*")])
        return super().do_POST()

    def do_GET(self):
        client_key = self._bind_client()
        p = self.path.split("?")[0].split("#")[0]
        if p.rstrip("/") in ("/sim-reset-session", "/api/reset"):
            dat_lai_thiet_bi(client_key)
            return self._gui_ftc(200, b'{"ok":1}', "application/json",
                                 [("Access-Control-Allow-Origin", "*")])
        if p == "/ftc-dat-bai":
            from urllib.parse import parse_qs
            bai = (parse_qs(self.path.split("?", 1)[1] if "?" in self.path else "").get("bai") or [""])[0]
            ok = dat_trang_thai_bai(bai)
            return self._gui_ftc(200, json.dumps({"ok": 1 if ok else 0}).encode(), "application/json")
        if p in ("/ftc-ax3000c.js", "/sim_ax3000c/ftc-ax3000c.js"):
            def _read_ftc_js():
                with open(TEP_FTC_JS, "rb") as _f:
                    return _f.read()

            entry = _lay_cache_tep("ftc_js", _read_ftc_js, allow_gzip=True)
            return self._gui_ftc(
                200,
                entry,
                "text/javascript",
                cache_control=self._cache_theo_phien_ban(FTC_JS_V),
            )
        if p in ("", "/") and not self._dang_sap():
            entry = _lay_cache_tep("index_html", _build_index_html, allow_gzip=True)
            from urllib.parse import parse_qs as _pqs
            _qs = _pqs(self.path.split("?", 1)[1] if "?" in self.path else "")
            if _qs.get("autologin", [None])[0] == "1":
                _auto_sid = "ftc" + os.urandom(13).hex()
                _goc._phien[_auto_sid] = {"user": "admin", "luc": time.time(), "client_key": client_key}
                _inj = f'<script>try{{sessionStorage.setItem("sid",{json.dumps(_auto_sid)});}}catch(e){{}}</script>'.encode("utf-8")
                _raw = entry["raw"].replace(b"<script src=", _inj + b"<script src=", 1)
                return self._gui_ftc(200, _raw, "text/html", cache_control="no-store")
            return self._gui_ftc(200, entry, "text/html", cache_control="no-cache, must-revalidate")
        ten = _ten_tep_ftc(self.path)
        if not self._dang_sap():
            p_tep = os.path.join(_goc.GOC_WWW, ten)
            if os.path.isfile(p_tep):
                duoi = os.path.splitext(ten)[1].lower()
                kieu = _goc.KIEU_MIME.get(duoi, "application/octet-stream")
                allow_gz = duoi in _GZIP_EXTS
                entry = _lay_cache_tep("asset:" + ten, lambda: _doc_va_va_tep(ten), allow_gzip=allow_gz)
                return self._gui_ftc(
                    200,
                    entry,
                    kieu,
                    cache_control=(
                        self._cache_theo_phien_ban(ASSET_V) if duoi in (".js", ".css")
                        else CACHE_TEP_TINH_KHAC
                    ),
                )
        return super().do_GET()

    def do_OPTIONS(self):
        self.send_response(200)
        self.send_header("Access-Control-Allow-Origin", "*")
        self.send_header("Access-Control-Allow-Methods", "GET, POST, OPTIONS")
        self.send_header("Access-Control-Allow-Headers", "*")
        self.send_header("Content-Length", "0")
        self.end_headers()

    def do_HEAD(self):
        self._bind_client()
        p = self.path.split("?")[0].split("#")[0]
        ok = (
            p.rstrip("/") in ("", "/sim-reset-session", "/api/reset")
            or p in ("/ftc-ax3000c.js", "/sim_ax3000c/ftc-ax3000c.js", "/ftc-dat-bai")
            or os.path.isfile(os.path.join(_goc.GOC_WWW, _ten_tep_ftc(self.path)))
        )
        self.send_response(200 if ok else 404)
        self.end_headers()


if __name__ == "__main__":
    print("AX3000CV2 (fw 0.5.3) + FTC: http://localhost:%d/   dang nhap admin / admin" % PORT)
    httpd = ThreadingHTTPServer(("0.0.0.0", PORT), Handler)
    httpd.daemon_threads = True
    try:
        httpd.serve_forever()
    except KeyboardInterrupt:
        print("\nstopped")
