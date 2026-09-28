#!/usr/bin/env python3
"""Synchronize public web asset cache keys with their file contents.

The historical filename is kept because deployment scripts already call it.
"""

from __future__ import annotations

import argparse
import hashlib
import re
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
DOCUMENTS = (
    ROOT / "index.html",
    ROOT / "portal.html",
    ROOT / "personal-dashboard.html",
    ROOT / "login" / "index.html",
    ROOT / "dashboard-authen" / "index.html",
)
ASSET_PATTERN = re.compile(
    r'(?P<prefix>\b(?:src|href)=")'
    r'(?P<path>(?!https?://|//|#)[^"?]+\.(?:css|js|png|jpe?g|svg|webp|avif|woff2?))'
    r'(?:\?v=[^"&]+)?'
    r'(?P<suffix>")'
)


def content_version(path: Path) -> str:
    return hashlib.sha256(path.read_bytes()).hexdigest()[:16]


def resolve_asset(document: Path, url_path: str) -> Path:
    if url_path.startswith("/"):
        return ROOT / url_path.lstrip("/")
    return document.parent / url_path


def synchronized_html(document: Path, source: str) -> tuple[str, list[str]]:
    missing: list[str] = []

    def replace(match: re.Match[str]) -> str:
        relative_path = match.group("path")
        asset_path = resolve_asset(document, relative_path).resolve()
        try:
            asset_path.relative_to(ROOT.resolve())
        except ValueError:
            missing.append(relative_path)
            return match.group(0)
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

    stale_documents: list[Path] = []
    missing_assets: list[str] = []
    updates: list[tuple[Path, str]] = []
    for document in DOCUMENTS:
        source = document.read_text(encoding="utf-8")
        updated, missing = synchronized_html(document, source)
        missing_assets.extend(f"{document.relative_to(ROOT)}: {item}" for item in missing)
        if updated != source:
            stale_documents.append(document)
            updates.append((document, updated))

    if missing_assets:
        print("Missing public assets: " + ", ".join(sorted(set(missing_assets))))
        return 2
    if not stale_documents:
        print("Public web asset versions are synchronized.")
        return 0
    if args.check:
        names = ", ".join(str(path.relative_to(ROOT)) for path in stale_documents)
        print(f"Stale asset versions in {names}; run scripts/sync_portal_asset_versions.py")
        return 1

    for document, updated in updates:
        document.write_text(updated, encoding="utf-8", newline="\n")
    names = ", ".join(str(path.relative_to(ROOT)) for path in stale_documents)
    print(f"Updated content-hash asset versions in: {names}")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
