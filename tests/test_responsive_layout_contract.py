import hashlib
import re
import unittest
from pathlib import Path


ROOT = Path(__file__).resolve().parents[1]


class ResponsiveLayoutContractTests(unittest.TestCase):
    @classmethod
    def setUpClass(cls):
        cls.personal_html = (ROOT / "personal-dashboard.html").read_text(encoding="utf-8")
        cls.personal_css = (ROOT / "assets" / "personal-dashboard.css").read_text(encoding="utf-8")
        cls.portal_html = (ROOT / "portal.html").read_text(encoding="utf-8")
        cls.portal_css = (ROOT / "styles.css").read_text(encoding="utf-8")
        cls.portal_js = (ROOT / "app.js").read_text(encoding="utf-8")

    def test_primary_pages_use_device_viewport_and_safe_area(self):
        pages = (
            "index.html",
            "login/index.html",
            "personal-dashboard.html",
            "portal.html",
            "dashboard-authen/index.html",
        )
        for relative_path in pages:
            with self.subTest(page=relative_path):
                html = (ROOT / relative_path).read_text(encoding="utf-8")
                viewport = re.search(r'<meta\s+name="viewport"\s+content="([^"]+)"', html)
                self.assertIsNotNone(viewport)
                self.assertIn("width=device-width", viewport.group(1))
                self.assertIn("viewport-fit=cover", viewport.group(1))
                self.assertNotIn("width=1280", viewport.group(1))

    def test_personal_dashboard_has_mobile_header_and_content_breakpoints(self):
        self.assertIn("@media (max-width: 760px)", self.personal_css)
        self.assertIn("@media (max-width: 420px)", self.personal_css)
        self.assertIn("grid-template-columns: minmax(0, 1fr) auto auto", self.personal_css)
        self.assertIn("env(safe-area-inset-bottom)", self.personal_css)
        self.assertIn("min-width: 720px", self.personal_css)
        self.assertIn("-webkit-overflow-scrolling: touch", self.personal_css)
        self.assertIn('class="dash-brand-subtitle"', self.personal_html)
        self.assertIn('class="action-label action-label-practice"', self.personal_html)

    def test_portal_collapses_sidebar_on_compact_first_load(self):
        self.assertIn("window.matchMedia('(max-width: 600px)')", self.portal_js)
        self.assertIn("sidebar.classList.add('collapsed')", self.portal_js)
        self.assertIn("@media (max-width: 600px)", self.portal_css)
        self.assertIn("--sidebar-width: min(86vw, 320px)", self.portal_css)
        self.assertIn("max-height: calc(100dvh - env(safe-area-inset-top))", self.portal_css)

    def test_changed_assets_have_current_content_hashes(self):
        checks = (
            ("assets/personal-dashboard.css", self.personal_html),
            ("styles.css", self.portal_html),
            ("app.js", self.portal_html),
        )
        for relative_path, html in checks:
            with self.subTest(asset=relative_path):
                expected = hashlib.sha256((ROOT / relative_path).read_bytes()).hexdigest()[:16]
                self.assertIn(f'{relative_path}?v={expected}', html)


if __name__ == "__main__":
    unittest.main()
