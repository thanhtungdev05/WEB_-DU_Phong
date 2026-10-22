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


_RAW_STATE_DATA: dict | None = None
_RAW_TEMPLATES: dict[str, str] = {}
_RAW_STATIC_LEGACY: set[str] = set()
_RAW_INTERNET_STATUS: dict[str, list[dict]] = {}
_RAW_GENERIC_TEMPLATES: dict[str, str] = {}
_RAW_GENERIC_VALUES: dict[str, list[dict]] = {}
_RAW_CACHE_LOCK = threading.Lock()


def _ensure_raw_cache():
    global _RAW_STATE_DATA, _RAW_TEMPLATES, _RAW_STATIC_LEGACY
    global _RAW_INTERNET_STATUS, _RAW_GENERIC_TEMPLATES, _RAW_GENERIC_VALUES
    if _RAW_STATE_DATA is not None:
        return
    with _RAW_CACHE_LOCK:
        if _RAW_STATE_DATA is not None:
            return
        with open(STATE_FILE, encoding="utf-8") as fh:
            _RAW_STATE_DATA = json.load(fh)

        for endpoint, filename in INTERNET_STATUS_FILES.items():
            file_path = os.path.join(API_DIR, filename)
            res = _load_xml_template(file_path)
            if res is None:
                try:
                    with open(file_path, encoding="utf-8", errors="replace") as fh:
                        _RAW_TEMPLATES[endpoint] = fh.read()
                    _RAW_STATIC_LEGACY.add(endpoint)
                except OSError:
                    pass
                continue
            template_text, pairs = res
            _RAW_TEMPLATES[endpoint] = template_text
            _RAW_INTERNET_STATUS[endpoint] = pairs

        if os.path.isdir(API_DIR):
            for fname in os.listdir(API_DIR):
                if not fname.endswith(".xml"):
                    continue
                tag = fname[:-4]
                if tag in INTERNET_STATUS_FILES:
                    continue
                fpath = os.path.join(API_DIR, fname)
                res = _load_xml_template(fpath)
                if res is None:
                    try:
                        with open(fpath, encoding="utf-8", errors="replace") as fh:
                            _RAW_GENERIC_TEMPLATES[tag] = fh.read()
                    except OSError:
                        pass
                    continue
                template_text, pairs = res
                _RAW_GENERIC_TEMPLATES[tag] = template_text
                _RAW_GENERIC_VALUES[tag] = pairs


class ConfigStore:
    def __init__(self, path: str = STATE_FILE):
        self.path = path
        self._lock = threading.RLock()
        _ensure_raw_cache()
        self._templates: dict[str, str] = {}
        self._static_legacy: set[str] = set()
        self._generic_templates: dict[str, str] = {}
        self._generic_values: dict[str, list[dict]] = {}
        self.reset()

    def reset(self) -> None:
        """Trả store về đúng trạng thái như khi khởi động server.

        Dùng cho endpoint /api/reset khi đổi bài học: sao chép nhanh từ RAM cache
        để không gây nghẽn đĩa khi nhiều KTV đồng thời reset.
        """
        _ensure_raw_cache()
        with self._lock:
            self._data = copy.deepcopy(_RAW_STATE_DATA)
            self._templates = dict(_RAW_TEMPLATES)
            self._static_legacy = set(_RAW_STATIC_LEGACY)
            self._generic_templates = dict(_RAW_GENERIC_TEMPLATES)
            self._generic_values = {k: copy.deepcopy(v) for k, v in _RAW_GENERIC_VALUES.items()}
            self._data["internet_status"] = {k: copy.deepcopy(v) for k, v in _RAW_INTERNET_STATUS.items()}

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
        if key not in _USER_STORES:
            _USER_STORES[key] = ConfigStore()
        store = _USER_STORES[key]
    store.reset()


class _StoreProxy:
    def __getattr__(self, name):
        return getattr(get_user_store(), name)


STORE = _StoreProxy()

