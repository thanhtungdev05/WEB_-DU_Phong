import hashlib
import re
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


if __name__ == "__main__":
    unittest.main()
