#!/usr/bin/env python3
"""Synchronize portal asset cache keys with their file contents."""

from __future__ import annotations

import argparse
import hashlib
import re
from pathlib import Path


ROOT = Path(__file__).resolve().parents[1]
PORTAL = ROOT / "portal.html"
ASSET_PATTERN = re.compile(
    r'(?P<prefix>\b(?:src|href)=")'
    r'(?P<path>(?!https?://|//|#)[^"?]+\.(?:css|js|png|svg|webp|woff2?))'
    r'(?:\?v=[^"&]+)?'
    r'(?P<suffix>")'
)


def content_version(path: Path) -> str:
    return hashlib.sha256(path.read_bytes()).hexdigest()[:16]


def synchronized_html(source: str) -> tuple[str, list[str]]:
    missing: list[str] = []

    def replace(match: re.Match[str]) -> str:
        relative_path = match.group("path").lstrip("/")
        asset_path = ROOT / relative_path
        if not asset_path.is_file():
            missing.append(relative_path)
            return match.group(0)
        return (
            f'{match.group("prefix")}{match.group("path")}'
            f'?v={content_version(asset_path)}{match.group("suffix")}'
        )

    return ASSET_PATTERN.sub(replace, source), missing


def main() -> int:
    parser = argparse.ArgumentParser()
    parser.add_argument(
        "--check",
        action="store_true",
        help="fail instead of rewriting portal.html when cache keys are stale",
    )
    args = parser.parse_args()

    source = PORTAL.read_text(encoding="utf-8")
    updated, missing = synchronized_html(source)
    if missing:
        print("Missing portal assets: " + ", ".join(sorted(set(missing))))
        return 2
    if updated == source:
        print("Portal asset versions are synchronized.")
        return 0
    if args.check:
        print("portal.html contains stale asset versions; run scripts/sync_portal_asset_versions.py")
        return 1

    PORTAL.write_text(updated, encoding="utf-8", newline="\n")
    print("Updated portal.html asset versions from file content hashes.")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
