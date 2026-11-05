import re
import unittest
from pathlib import Path


ROOT = Path(__file__).resolve().parents[1]
MIGRATION = ROOT / 'api' / 'migrations' / '066_soc_org_unit_catalog.sql'
SEED_SCRIPT = ROOT / 'scripts' / 'seed_soc_ktv.php'
SOC_REGIONS = {'SOC', 'TSOC', 'PSOC'}


class SocCatalogMigrationTests(unittest.TestCase):
    @classmethod
    def setUpClass(cls):
        cls.sql = MIGRATION.read_text(encoding='utf-8')
        cls.script = SEED_SCRIPT.read_text(encoding='utf-8')
        source = cls.sql.split(
            'INSERT INTO soc_org_unit_source (unit_code, unit_name, region_code)\nVALUES\n',
            1,
        )[1].split(';', 1)[0]
        cls.units = re.findall(r"\('([^']+)', '([^']+)', '([^']+)'\)", source)

    def test_catalog_has_18_unique_units_in_three_soc_regions(self):
        self.assertEqual(len(self.units), 18)
        self.assertEqual(len({code for code, _name, _region in self.units}), 18)
        self.assertEqual({region for _code, _name, region in self.units}, SOC_REGIONS)
        self.assertTrue(all(code == name for code, name, _region in self.units))

    def test_unit_prefix_matches_region(self):
        for code, _name, region in self.units:
            with self.subTest(unit=code):
                expected = 'TSOC' if code.startswith('TSOC') else 'PSOC' if code.startswith('PSOC') else 'SOC'
                self.assertEqual(region, expected)

    def test_migration_is_additive_and_idempotent(self):
        self.assertIn('ON CONFLICT (region_code) DO UPDATE', self.sql)
        self.assertIn('ON CONFLICT (unit_code) DO UPDATE', self.sql)
        self.assertNotRegex(self.sql, r'(?im)^\s*(DELETE|DROP|TRUNCATE)\b')
        self.assertNotIn('is_active = FALSE', self.sql)
        self.assertNotRegex(self.sql, r'(?i)UPDATE\s+users|INSERT\s+INTO\s+users')

    def test_migration_contains_no_personal_data(self):
        self.assertNotRegex(self.sql, r'@[A-Za-z0-9-]+\.(com|net)')
        self.assertNotRegex(self.sql, r"'\d{8}'")

    def test_seed_script_is_add_only_dry_run_by_default_and_soc_scoped(self):
        self.assertIn("PHP_SAPI !== 'cli'", self.script)
        self.assertIn("array_key_exists('apply', $options)", self.script)
        self.assertIn("SOC_SEED_REGIONS = ['SOC', 'TSOC', 'PSOC']", self.script)
        self.assertIn('$pdo->rollBack();', self.script)
        self.assertNotRegex(self.script, r'(?i)UPDATE\s+users')
        self.assertNotIn('is_terminated = TRUE', self.script)


if __name__ == '__main__':
    unittest.main()
