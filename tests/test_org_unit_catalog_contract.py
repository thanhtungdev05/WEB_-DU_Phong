import re
import unittest
from pathlib import Path


ROOT = Path(__file__).resolve().parents[1]
MIGRATION = ROOT / 'api' / 'migrations' / '040_org_unit_catalog.sql'


class OrgUnitCatalogContractTests(unittest.TestCase):
    @classmethod
    def setUpClass(cls):
        cls.sql = MIGRATION.read_text(encoding='utf-8')
        cls.api = (ROOT / 'api' / 'index.php').read_text(encoding='utf-8')
        cls.importer = (ROOT / 'api' / 'lib' / 'ktv_roster_import.php').read_text(encoding='utf-8')
        cls.reporting = (ROOT / 'api' / 'lib' / 'dashboard_report.php').read_text(encoding='utf-8')
        cls.dashboard = (ROOT / 'dashboard-authen' / 'js' / 'app.js').read_text(encoding='utf-8')
        cls.dashboard_html = (ROOT / 'dashboard-authen' / 'index.html').read_text(encoding='utf-8')

    def test_catalog_contains_exactly_205_unique_units_and_10_regions(self):
        source = self.sql.split(
            'INSERT INTO org_unit_catalog_source (unit_code, unit_name, region_code)\nVALUES\n',
            1,
        )[1].split(';', 1)[0]
        rows = re.findall(r"\('([^']+)', '([^']+)', '([^']+)'\)", source)
        self.assertEqual(len(rows), 205)
        self.assertEqual(len({row[0] for row in rows}), 205)
        self.assertEqual(len({row[2] for row in rows}), 10)
        self.assertTrue(all(code == name for code, name, _region in rows))

    def test_region_codes_keep_friendly_display_names(self):
        expected = {
            'PNCDNB': 'DNB', 'PNCHCM': 'HCM', 'PNCTDDT': 'TDDT - PNC',
            'PNCTNB': 'TNB', 'PNCTNMT': 'TNMT - PNC', 'TINDBB': 'DBB',
            'TINHNI': 'HNI', 'TINTBB': 'TBB', 'TINTDDT': 'TDDT - TIN',
            'TINTNMT': 'TNMT - TIN',
        }
        for code, name in expected.items():
            with self.subTest(code=code):
                self.assertIn(f"('{code}', '{name}'", self.sql)

    def test_migration_backfills_current_and_historical_locations(self):
        self.assertIn('ALTER TABLE users ADD COLUMN IF NOT EXISTS unit_id UUID', self.sql)
        self.assertIn('ALTER TABLE lab_assignments ADD COLUMN IF NOT EXISTS unit_id_snapshot UUID', self.sql)
        self.assertIn('assignment.unit_id_snapshot IS DISTINCT FROM roster.unit_id', self.sql)
        self.assertIn("WHERE roster.role = 'KTV'", self.sql)
        self.assertIn('CREATE OR REPLACE VIEW v_ktv_directory', self.sql)
        self.assertIn('unit.unit_name AS branch_name', self.sql)

    def test_import_and_api_only_accept_catalog_units(self):
        self.assertIn('function ktv_roster_resolve_unit', self.importer)
        self.assertIn('Unsupported unit code:', self.importer)
        self.assertNotIn('INSERT INTO regions (', self.importer)
        self.assertIn('FROM org_units unit', self.api)
        self.assertIn("'unitId' => $row['unit_id']", self.api)

    def test_historical_reporting_reads_unit_snapshot(self):
        self.assertIn('assignment_unit.unit_name', self.reporting)
        self.assertIn('assignment.unit_id_snapshot', self.reporting)
        self.assertIn("STRING_AGG(DISTINCT cohort.branch_name, ', '", self.reporting)
        self.assertNotRegex(self.reporting, r'GROUP BY[\s\S]*?cohort\.dashboard_group,\s*cohort\.branch_name,')

    def test_roster_editor_submits_catalog_unit_instead_of_free_text(self):
        self.assertIn("region.unit_id || region.unitId", self.dashboard)
        self.assertIn("unit_id: document.getElementById('rosterEditRegionId').value || null", self.dashboard)
        self.assertNotIn("unit_code: document.getElementById('rosterEditUnitCode')", self.dashboard)
        self.assertRegex(self.dashboard_html, r'id="rosterEditUnitCode"[^>]+readonly')
        self.assertRegex(self.dashboard_html, r'id="rosterEditUnitName"[^>]+readonly')


if __name__ == '__main__':
    unittest.main()
