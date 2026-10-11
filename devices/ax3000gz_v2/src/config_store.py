#!/usr/bin/env python3
"""Kho trạng thái trung tâm cho AX3000GZ_V2.

Hai lớp template:
  - INTERNET_STATUS_FILES  : các trang đã có từ phiên đầu (giữ để tương thích).
  - _generic_templates      : tất cả các file XML còn lại trong www/api/*.xml.
    Mỗi template lưu danh sách {name, value} theo đúng thứ tự xuất hiện trong XML.
    Khi serve, hàm tái sinh XML bằng cách thay ParaValue theo thứ tự — giữ nguyên cấu trúc XML gốc.
"""
from __future__ import annotations

import copy
import json
import os
import re
import threading


HERE = os.path.dirname(os.path.abspath(__file__))
STATE_FILE = os.path.join(HERE, "state.json")
API_DIR = os.path.join(HERE, "www", "api")

INTERNET_STATUS_FILES = {
    "optical_info_lua.lua": "optical_info.xml",
    "wan_internetstatus_lua.lua": "wan_internetstatus.xml",
    "tunnel_4in6_status_lua.lua": "tunnel_4in6_status.xml",
    "l2tp_lua.lua": "l2tp.xml",
    "firewall_conntrack_lua.lua": "firewall_conntrack.xml",
    "status_lan_info_lua.lua": "status_lan_info.xml",
    "wlan_wlanstatus_lua.lua": "wlan_wlanstatus.xml",
    "wlan_client_stat_lua.lua": "wlan_client_stat.xml",
    "accessdev_landevs_lua.lua": "accessdev_landevs.xml",
}

PAIR = re.compile(
    r"(<ParaName>(?P<name>.*?)</ParaName><ParaValue>)(?P<value>.*?)(</ParaValue>)"
)


def _load_xml_template(path: str) -> tuple[str, list[dict]] | None:
    """Đọc file XML, trả về (raw_text, [{name, value},...]) hoặc None nếu không có pair."""
    try:
        with open(path, encoding="utf-8", errors="replace") as fh:
            text = fh.read()
    except OSError:
        return None
    pairs = [{"name": m.group("name"), "value": m.group("value")}
             for m in PAIR.finditer(text)]
    if not pairs:
        return None
    return text, pairs


class ConfigStore:
    def __init__(self, path: str = STATE_FILE):
        self.path = path
        self._lock = threading.RLock()
        with open(path, encoding="utf-8") as fh:
            self._data = json.load(fh)

        # ── Legacy: Internet Status templates (giữ nguyên cho tương thích) ──
        self._templates: dict[str, str] = {}
        self._static_legacy: set[str] = set()
        # ── Generic: tất cả file *.xml trong www/api/ ──
        self._generic_templates: dict[str, str] = {}    # tag → XML text
        self._generic_values: dict[str, list[dict]] = {}  # tag → [{name, value}]
        self._load_templates()

    def _load_templates(self) -> None:
        """Nạp template XML từ www/api/ (dùng lúc khởi động và khi reset)."""
        self._data["internet_status"] = {}
        for endpoint, filename in INTERNET_STATUS_FILES.items():
            file_path = os.path.join(API_DIR, filename)
            res = _load_xml_template(file_path)
            if res is None:
                # Endpoint chỉ gồm IF_ERROR* (không có ParaName/ParaValue):
                # trả nguyên văn XML tĩnh.
                try:
                    with open(file_path, encoding="utf-8",
                              errors="replace") as fh:
                        self._templates[endpoint] = fh.read()
                    self._static_legacy.add(endpoint)
                except OSError:
                    pass
                continue
            template_text, pairs = res
            self._templates[endpoint] = template_text
            self._data["internet_status"][endpoint] = pairs

        for fname in os.listdir(API_DIR):
            if not fname.endswith(".xml"):
                continue
            tag = fname[:-4]   # bỏ ".xml"
            # Nếu đã nạp trong INTERNET_STATUS_FILES → dùng legacy, không nạp lại
            if tag in INTERNET_STATUS_FILES:
                continue
            # Tránh nạp các file tên cũ không có .lua
            fpath = os.path.join(API_DIR, fname)
            res = _load_xml_template(fpath)
            if res is None:
                # File XML không có ParaName/ParaValue: nạp dạng static
                try:
                    with open(fpath, encoding="utf-8", errors="replace") as fh:
                        raw = fh.read()
                    self._generic_templates[tag] = raw
                except OSError:
                    pass
                continue
            template_text, pairs = res
            self._generic_templates[tag] = template_text
            self._generic_values[tag] = pairs

    def reset(self) -> None:
        """Trả store về đúng trạng thái như khi khởi động server.

        Dùng cho endpoint /api/reset khi đổi bài học: nạp lại state.json
        (bộ nhớ trạng thái chỉ mutate RAM nên file trên đĩa luôn là mặc định)
        và nạp lại toàn bộ template XML từ www/api/.
        """
        with self._lock:
            with open(self.path, encoding="utf-8") as fh:
                self._data = json.load(fh)
            self._templates.clear()
            self._static_legacy.clear()
            self._generic_templates.clear()
            self._generic_values.clear()
            self._load_templates()

    # ─────────────────────────────────────────
    # Public helpers
    # ─────────────────────────────────────────

    def snapshot(self) -> dict:
        with self._lock:
            return copy.deepcopy(self._data)

    def get(self, key: str, default=None):
        with self._lock:
            return copy.deepcopy(self._data.get(key, default))

    def update_section(self, key: str, fields: dict) -> None:
        with self._lock:
            section = self._data.setdefault(key, {})
            section.update(fields)

    def has_data(self, tag: str) -> bool:
        """True nếu ConfigStore có thể serve data cho endpoint này."""
        return (tag in self._templates
                or tag in self._generic_templates
                or tag in self._generic_values)

    # ─────────────────────────────────────────
    # Legacy method — Internet Status pages
    # ─────────────────────────────────────────

    def internet_status_xml(self, endpoint: str) -> bytes:
        with self._lock:
            if endpoint not in self._templates:
                # Endpoint không nạp được template (thiếu file): thử generic.
                payload = self.generic_data(endpoint)
                if payload is not None:
                    return payload
                return b"Not captured"
            if endpoint in self._static_legacy:
                return self._templates[endpoint].encode("utf-8")
            values = iter(self._data["internet_status"][endpoint])

            def replace(match):
                item = next(values)
                return match.group(1) + item["value"] + match.group(4)

            return PAIR.sub(replace, self._templates[endpoint]).encode("utf-8")

    def set_internet_status_value(self, endpoint: str, ordinal: int, value: str):
        with self._lock:
            self._data["internet_status"][endpoint][ordinal]["value"] = str(value)

    # ─────────────────────────────────────────
    # Generic method — tất cả trang còn lại
    # ─────────────────────────────────────────

    def generic_data(self, tag: str) -> bytes | None:
        """
        Tái sinh XML từ ConfigStore cho endpoint `tag`.
        Trả về None nếu tag không có trong store.
        """
        with self._lock:
            if tag in self._generic_values:
                values = iter(self._generic_values[tag])

                def replace(match):
                    item = next(values)
                    return match.group(1) + item["value"] + match.group(4)

                return PAIR.sub(replace, self._generic_templates[tag]).encode("utf-8")

            if tag in self._generic_templates:
                return self._generic_templates[tag].encode("utf-8")

            return None

    def update_values(self, tag: str, fields: dict[str, str]) -> bool:
        """
        Cập nhật các ParaValue trong ConfigStore từ dict {ParaName: ParaValue}.
        Trả về True nếu tìm được ít nhất 1 trường.
        """
        updated = False
        with self._lock:
            if tag in self._generic_values:
                for item in self._generic_values[tag]:
                    name = item["name"]
                    if name in fields:
                        item["value"] = fields[name]
                        updated = True
            # Cũng thử cập nhật legacy Internet Status
            if tag in self._data.get("internet_status", {}):
                for item in self._data["internet_status"][tag]:
                    name = item["name"]
                    if name in fields:
                        item["value"] = fields[name]
                        updated = True
        return updated

    def update_instance_values(self, tag: str, instance_index: int,
                               fields: dict[str, str]) -> bool:
        """Update ParaValue fields in one zero-based XML Instance."""
        updated = False
        current_instance = -1
        with self._lock:
            for item in self._generic_values.get(tag, []):
                if item["name"] == "_InstID":
                    current_instance += 1
                if current_instance == instance_index and item["name"] in fields:
                    item["value"] = fields[item["name"]]
                    updated = True
        return updated

    # ─────────────────────────────────────────
    # Home-page specific helpers (legacy)
    # ─────────────────────────────────────────

    def home_firewall_xml(self) -> bytes:
        h = self.get("home")
        from server import XML_OK, instance  # lazy import to avoid cycle
        return (XML_OK + "<OBJ_FWLEVEL_ID>" + instance([
            ("_InstID", "IGD"), ("Level", h["firewall_level"]),
            ("AntiAttack", h["anti_attack"]),
        ]) + "</OBJ_FWLEVEL_ID></ajax_response_xml_root>").encode()

    def home_wlan_xml(self) -> bytes:
        h = self.get("home")
        from server import XML_OK, instance
        return (XML_OK + "<OBJ_ACCESSDEV_ID></OBJ_ACCESSDEV_ID><OBJ_WLANRADIO_ID>" +
                instance([("RadioSwitch", h["wlan_radio_switch"])]) +
                "</OBJ_WLANRADIO_ID></ajax_response_xml_root>").encode()


_USER_STORES: dict[str, ConfigStore] = {}
_STORE_LOCK = threading.RLock()
_STORE_CTX = threading.local()


def bind_user(user_key: str):
    _STORE_CTX.key = user_key or "default"


def current_user_key() -> str:
    return getattr(_STORE_CTX, "key", "default")


def get_user_store(user_key: str | None = None) -> ConfigStore:
    key = user_key or current_user_key()
    with _STORE_LOCK:
        if key not in _USER_STORES:
            _USER_STORES[key] = ConfigStore()
        return _USER_STORES[key]


def reset_user_store(user_key: str | None = None) -> None:
    key = user_key or current_user_key()
    with _STORE_LOCK:
        if key in _USER_STORES:
            _USER_STORES[key].reset()
        else:
            _USER_STORES[key] = ConfigStore()


class _StoreProxy:
    def __getattr__(self, name):
        return getattr(get_user_store(), name)


STORE = _StoreProxy()

