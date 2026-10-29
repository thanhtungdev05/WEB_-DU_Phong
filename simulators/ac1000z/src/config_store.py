#!/usr/bin/env python3
"""Kho trạng thái trung tâm cho AC1000Z (ZTE ZXHN F671Y).

Tất cả các file XML trong www/api/*.xml được nạp vào ConfigStore.
Mỗi template lưu danh sách {name, value} theo đúng thứ tự xuất hiện trong XML.
Khi serve, hàm tái sinh XML bằng cách thay ParaValue theo thứ tự — giữ nguyên cấu trúc XML gốc.
Hỗ trợ cô lập trạng thái theo phiên KTV (_USER_STORES) cho môi trường phòng thi/phòng lab NAT.
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

PAIR = re.compile(
    r"(<ParaName>(?P<name>.*?)</ParaName>\s*<ParaValue>)(?P<value>.*?)(</ParaValue>)"
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
_RAW_VALUES: dict[str, list[dict]] = {}
_RAW_CACHE_LOCK = threading.Lock()


def _ensure_raw_cache():
    global _RAW_STATE_DATA, _RAW_TEMPLATES, _RAW_VALUES
    if _RAW_STATE_DATA is not None:
        return
    with _RAW_CACHE_LOCK:
        if _RAW_STATE_DATA is not None:
            return
        with open(STATE_FILE, encoding="utf-8") as fh:
            _RAW_STATE_DATA = json.load(fh)
        if os.path.exists(API_DIR):
            for fname in os.listdir(API_DIR):
                if fname.endswith(".xml"):
                    tag = fname[:-4]
                elif fname.endswith(".lua"):
                    tag = fname
                else:
                    continue
                fpath = os.path.join(API_DIR, fname)
                res = _load_xml_template(fpath)
                if res is None:
                    try:
                        with open(fpath, encoding="utf-8", errors="replace") as fh:
                            _RAW_TEMPLATES[tag] = fh.read()
                    except OSError:
                        pass
                    continue
                template_text, pairs = res
                _RAW_TEMPLATES[tag] = template_text
                _RAW_VALUES[tag] = pairs


class ConfigStore:
    def __init__(self, path: str = STATE_FILE):
        self.path = path
        self._lock = threading.RLock()
        _ensure_raw_cache()
        self._templates: dict[str, str] = {}
        self._values: dict[str, list[dict]] = {}
        self.reset()

    def reset(self) -> None:
        """Đưa trạng thái về giá trị mặc định của firmware từ bộ nhớ RAM."""
        _ensure_raw_cache()
        with self._lock:
            self._data = copy.deepcopy(_RAW_STATE_DATA)
            self._templates = dict(_RAW_TEMPLATES)
            self._values = {k: copy.deepcopy(v) for k, v in _RAW_VALUES.items()}

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

    def _resolve_tag(self, tag: str) -> str | None:
        clean = tag.split("&")[0]
        candidates = [clean]
        if clean.endswith(".lua"):
            candidates.append(clean[:-4])
        else:
            candidates.append(clean + ".lua")
        for c in candidates:
            if c in self._templates or c in self._values:
                return c
        return None

    def has_data(self, tag: str) -> bool:
        return self._resolve_tag(tag) is not None

    def get_data(self, tag: str) -> bytes | None:
        """Tái sinh XML từ ConfigStore cho endpoint `tag`."""
        real_tag = self._resolve_tag(tag)
        if not real_tag:
            return None
        with self._lock:
            if real_tag in self._values:
                values = iter(self._values[real_tag])

                def replace(match):
                    item = next(values)
                    return match.group(1) + item["value"] + match.group(4)

                return PAIR.sub(replace, self._templates[real_tag]).encode("utf-8")

            if real_tag in self._templates:
                return self._templates[real_tag].encode("utf-8")

            return None

    def update_values(self, tag: str, fields: dict[str, str]) -> bool:
        """Cập nhật các ParaValue trong ConfigStore từ dict {ParaName: ParaValue}."""
        real_tag = self._resolve_tag(tag)
        if not real_tag:
            return False
        updated = False
        with self._lock:
            if real_tag in self._values:
                for item in self._values[real_tag]:
                    name = item["name"]
                    if name in fields:
                        item["value"] = str(fields[name])
                        updated = True
        return updated


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
