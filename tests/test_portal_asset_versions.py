import hashlib
import re
import sys
import unittest
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]


class PortalAssetVersionTests(unittest.TestCase):
    @classmethod
    def setUpClass(cls):
        cls.portal = (ROOT / "portal.html").read_text(encoding="utf-8")

    def test_local_assets_use_content_hash_versions(self):
        assets = re.findall(
            r'\b(?:src|href)="((?!https?://|//|#)[^"?]+\.(?:css|js|png|svg|webp|woff2?))\?v=([^"&]+)"',
            self.portal,
        )
        self.assertGreater(len(assets), 100)
        for relative_path, actual_version in assets:
            asset_path = ROOT / relative_path.lstrip("/")
            self.assertTrue(asset_path.is_file(), f"Missing portal asset: {relative_path}")
            expected_version = hashlib.sha256(asset_path.read_bytes()).hexdigest()[:16]
            self.assertEqual(actual_version, expected_version, f"Stale cache key for {relative_path}")

    def test_every_public_entrypoint_uses_content_hash_versions(self):
        documents = (
            ROOT / "index.html",
            ROOT / "portal.html",
            ROOT / "personal-dashboard.html",
            ROOT / "login" / "index.html",
            ROOT / "dashboard-authen" / "index.html",
        )
        pattern = re.compile(
            r'\b(?:src|href)="((?!https?://|//|#)[^"?]+\.(?:css|js|png|jpe?g|svg|webp|avif|woff2?))\?v=([^"&]+)"'
        )
        for document in documents:
            html = document.read_text(encoding="utf-8")
            local_assets = pattern.findall(html)
            self.assertTrue(local_assets, f"No versioned assets found in {document.relative_to(ROOT)}")
            for url_path, actual_version in local_assets:
                asset_path = (ROOT / url_path.lstrip("/")) if url_path.startswith("/") else (document.parent / url_path)
                self.assertTrue(asset_path.is_file(), f"Missing public asset: {url_path}")
                expected_version = hashlib.sha256(asset_path.read_bytes()).hexdigest()[:16]
                self.assertEqual(actual_version, expected_version, f"Stale cache key for {url_path}")

            unversioned = re.findall(
                r'\b(?:src|href)="((?!https?://|//|#)[^"?]+\.(?:css|js|png|jpe?g|svg|webp|avif|woff2?))"',
                html,
            )
            self.assertEqual(unversioned, [], f"Unversioned assets in {document.relative_to(ROOT)}")

    def test_ax3000gz_dependency_order_is_stable(self):
        common = self.portal.index("devices/ax3000gz/tooltips/common_login.js")
        last_tooltip = self.portal.index("devices/ax3000gz/tooltips/bai6.js")
        first_lesson = self.portal.index("devices/ax3000gz/lessons/bai1.js")
        last_lesson = self.portal.index("devices/ax3000gz/lessons/bai6.js")
        data = self.portal.index("devices/ax3000gz/data.js")
        self.assertLess(common, last_tooltip)
        self.assertLess(last_tooltip, first_lesson)
        self.assertLess(first_lesson, last_lesson)
        self.assertLess(last_lesson, data)


class CatalogFingerprintTests(unittest.TestCase):
    """Catalog lấy từ PostgreSQL qua api/migrations/*.sql.

    Portal gắn fingerprint vào URL /learning/catalog để URL đổi khi
    catalog đổi, nhờ đó browser không dùng lại entry cache cũ (mặc định
    6 tiếng) sau mỗi lần deploy có thêm/sửa thiết bị.
    """

    @classmethod
    def setUpClass(cls):
        sys.path.insert(0, str(ROOT / "scripts"))
        import sync_portal_asset_versions as sync

        cls.sync = sync
        cls.portal = (ROOT / "portal.html").read_text(encoding="utf-8")
        cls.app = (ROOT / "app.js").read_text(encoding="utf-8")

    def test_portal_publishes_fingerprint_and_app_uses_it(self):
        expected = self.sync.catalog_fingerprint()
        found = re.search(r'window\.CATALOG_FINGERPRINT\s*=\s*"([a-f0-9]+)"', self.portal)
        self.assertIsNotNone(found, "portal.html must publish window.CATALOG_FINGERPRINT")
        self.assertEqual(found.group(1), expected, "Stale CATALOG_FINGERPRINT in portal.html")

        fetch_call = re.search(r"const url = '/api/index\.php/learning/catalog\?v='[^\n]*", self.app)
        self.assertIsNotNone(fetch_call, "app.js must build a versioned catalog URL")
        self.assertIn("catalogCacheKey()", fetch_call.group(0))
        self.assertIn("window.CATALOG_FINGERPRINT", self.app)

    def test_fingerprint_changes_when_catalog_migration_changes(self):
        baseline = self.sync.catalog_fingerprint()
        probe = ROOT / "api" / "migrations" / "zz_fingerprint_contract_probe.sql"
        probe.write_text("-- transient probe\n", encoding="utf-8", newline="\n")
        try:
            self.assertNotEqual(
                self.sync.catalog_fingerprint(),
                baseline,
                "Adding a migration must change the catalog fingerprint",
            )
        finally:
            probe.unlink()
        self.assertEqual(self.sync.catalog_fingerprint(), baseline)

    def test_sync_check_detects_stale_fingerprint(self):
        stale = self.portal.replace(
            re.search(r'window\.CATALOG_FINGERPRINT\s*=\s*"[a-f0-9]*"', self.portal).group(0),
            'window.CATALOG_FINGERPRINT="0000000000000000"',
        )
        self.assertNotEqual(
            stale,
            self.portal,
            "Replacing the fingerprint must change the document",
        )
        rewritten = self.sync.synchronized_fingerprint(stale, self.sync.catalog_fingerprint())
        self.assertIn(
            f'window.CATALOG_FINGERPRINT="{self.sync.catalog_fingerprint()}"',
            rewritten,
        )


if __name__ == "__main__":
    unittest.main()
