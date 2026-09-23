from pathlib import Path
import unittest


ROOT = Path(__file__).resolve().parents[1]


class DegradedStartupContractTests(unittest.TestCase):
    @classmethod
    def setUpClass(cls):
        cls.entrypoint = (ROOT / 'docker-entrypoint.sh').read_text(encoding='utf-8')
        cls.dockerfile = (ROOT / 'Dockerfile').read_text(encoding='utf-8')
        cls.compose = (ROOT / 'docker-compose.prod.yml').read_text(encoding='utf-8')
        cls.api = (ROOT / 'api' / 'index.php').read_text(encoding='utf-8')
        cls.probe = (ROOT / 'api' / 'database_probe.php').read_text(encoding='utf-8')

    def test_database_outage_can_degrade_without_hiding_migration_errors(self):
        self.assertIn('ALLOW_START_WITHOUT_DATABASE="${ALLOW_START_WITHOUT_DATABASE:-1}"', self.entrypoint)
        self.assertIn('php api/database_probe.php', self.entrypoint)
        self.assertIn('starting in degraded mode', self.entrypoint)
        self.assertIn('migrations failed while the database is reachable; refusing to start', self.entrypoint)

    def test_database_probe_is_cli_only_and_checks_the_connection(self):
        self.assertIn("PHP_SAPI !== 'cli'", self.probe)
        self.assertIn('create_database_connection()', self.probe)
        self.assertIn("query('SELECT 1')", self.probe)
        self.assertIn('catch (PDOException $exception)', self.probe)
        self.assertIn("str_starts_with($sqlState, '08')", self.probe)
        self.assertIn('exit(2)', self.probe)

    def test_container_liveness_is_independent_from_database_readiness(self):
        self.assertIn("+ '/health/live'", self.dockerfile)
        self.assertIn("+ '/health/live'", self.compose)
        self.assertNotIn("+ '/api/health'", self.dockerfile)
        self.assertNotIn("+ '/api/health'", self.compose)

        # The existing API readiness endpoint must continue to validate PostgreSQL
        # and the migration ledger instead of falsely reporting the DB as healthy.
        self.assertIn("$pdo->query('SELECT 1')", self.api)
        self.assertIn("$schemaReady ? 200 : 503", self.api)


if __name__ == '__main__':
    unittest.main()
