import re
import unittest
from pathlib import Path


ROOT = Path(__file__).resolve().parents[1]


class DashboardThemeContractTests(unittest.TestCase):
    @classmethod
    def setUpClass(cls):
        cls.html = (ROOT / "dashboard-authen" / "index.html").read_text(encoding="utf-8")
        cls.javascript = (ROOT / "dashboard-authen" / "js" / "app.js").read_text(encoding="utf-8")
        cls.legacy_css = (ROOT / "dashboard-authen" / "css" / "styles.css").read_text(encoding="utf-8")
        cls.theme_css = (ROOT / "dashboard-authen" / "css" / "dashboard-professional.css").read_text(encoding="utf-8")

    def test_prepaint_script_only_resolves_a_valid_theme(self):
        script = re.search(r"<head>.*?<script>(.*?)</script>", self.html, re.S)
        self.assertIsNotNone(script)
        source = script.group(1)
        self.assertIn("const VALID_THEMES = ['light', 'dark', 'system']", source)
        self.assertIn("document.documentElement.dataset.theme = resolved", source)
        self.assertNotIn("DOMContentLoaded", source)
        self.assertNotIn("localStorage.setItem", source)
        self.assertNotIn("addEventListener", source)

    def test_interactive_manager_persists_and_synchronizes_theme(self):
        self.assertEqual(self.javascript.count("function initThemeManager()"), 1)
        self.assertIn("VALID_THEME_SETTINGS.has(targetTheme)", self.javascript)
        self.assertIn("applyTheme(targetTheme, { persist: true })", self.javascript)
        self.assertIn("meta[name=\"theme-color\"]", self.javascript)
        self.assertIn("window.addEventListener('storage'", self.javascript)
        self.assertIn("new CustomEvent('ftc:themechange'", self.javascript)

    def test_switcher_is_accessible_and_has_all_modes(self):
        for value in ("light", "dark", "system"):
            self.assertRegex(
                self.html,
                rf'data-theme-value="{value}"[^>]+aria-pressed="(?:true|false)"',
            )

    def test_theme_css_has_one_authoritative_implementation(self):
        marker = "FTC DASHBOARD THEME SYSTEM: LIGHT, DARK & SYSTEM MODES"
        self.assertEqual(self.theme_css.count(marker), 1)
        self.assertNotIn(marker, self.legacy_css)
        self.assertNotIn(':root:not([data-theme="light"])', self.theme_css)

    def test_dark_mode_preserves_semantic_report_states(self):
        for selector in (
            "tbody td.report-cell-high",
            "tbody td.report-cell-medium",
            "tbody td.report-cell-low",
            "tbody td.report-cell-empty",
        ):
            self.assertIn(selector, self.theme_css)
        self.assertIn("@media (prefers-reduced-motion: reduce)", self.theme_css)

    def test_topbar_compacts_before_controls_can_cover_title(self):
        self.assertIn("@media (max-width: 1680px)", self.theme_css)
        self.assertIn(".app-main .brand > div:last-child", self.theme_css)
        self.assertIn("@media (max-width: 1400px) and (min-width: 961px)", self.theme_css)
        self.assertRegex(
            self.theme_css,
            r"\.app-main \.brand,\s*\.top-actions\s*\{\s*width: 100%;",
        )


if __name__ == "__main__":
    unittest.main()
