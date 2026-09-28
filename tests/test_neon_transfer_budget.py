import unittest
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]


class NeonTransferBudgetTests(unittest.TestCase):
    @classmethod
    def setUpClass(cls):
        cls.api = (ROOT / 'api' / 'index.php').read_text(encoding='utf-8')
        cls.dashboard = (ROOT / 'dashboard-authen' / 'js' / 'app.js').read_text(encoding='utf-8')
        cls.report = (ROOT / 'api' / 'lib' / 'dashboard_report.php').read_text(encoding='utf-8')
        cls.technicians = (ROOT / 'api' / 'lib' / 'dashboard_technicians.php').read_text(encoding='utf-8')
        cls.migration = (ROOT / 'api' / 'migrations' / '047_dashboard_transfer_guard.sql').read_text(encoding='utf-8')
        cls.sequence_migration = (ROOT / 'api' / 'migrations' / '048_dashboard_revision_sequence.sql').read_text(encoding='utf-8')
        cls.technician_index_migration = (ROOT / 'api' / 'migrations' / '050_dashboard_technician_pagination_indexes.sql').read_text(encoding='utf-8')
        cls.example_env = (ROOT / '.env.example').read_text(encoding='utf-8')
        cls.runtime = (ROOT / 'api' / 'lib' / 'runtime.php').read_text(encoding='utf-8')
        cls.session_handler = (ROOT / 'api' / 'lib' / 'PostgresSessionHandler.php').read_text(encoding='utf-8')

    def test_dashboard_refresh_is_version_gated_without_background_data_polling(self):
        self.assertNotIn('setInterval(refreshDashboardData', self.dashboard)
        self.assertIn('version === lastDashboardVersion', self.dashboard)
        self.assertNotIn('window.location.reload();', self.dashboard)

    def test_compact_report_aggregates_in_database_without_branch_person_rows(self):
        self.assertIn('function dashboard_report_region_summary_rows', self.report)
        self.assertIn('region_population AS (', self.report)
        self.assertIn('region_metrics AS (', self.report)
        self.assertRegex(
            self.report,
            r"(?s)if \(\$includeBranchDrilldown\).*?dashboard_report_branch_drilldown.*?else \{.*?dashboard_report_region_summary_rows",
        )

    def test_non_report_views_do_not_fetch_report_or_class_assignments(self):
        self.assertIn("function dashboardViewNeedsReport", self.dashboard)
        self.assertIn("viewName === 'overview' || viewName === 'analytics'", self.dashboard)
        self.assertIn("reportRequested = dashboardViewNeedsReport()", self.dashboard)
        self.assertEqual(
            self.dashboard.count("['instructors', 'class_matrix', 'analytics', 'technicians']"),
            1,
        )

    def test_detailed_session_export_requires_range_and_cursor_pagination(self):
        self.assertIn("'dashboard-range-required'", self.api)
        self.assertIn("env_int('DASHBOARD_MAX_RANGE_DAYS', 366, 1, 3660)", self.api)
        self.assertIn("'next_cursor' => $nextSessionCursor", self.api)
        self.assertIn("LIMIT ' . ($sessionLimit + 1)", self.api)
        self.assertIn('DASHBOARD_SESSION_PAGE_SIZE=500', self.example_env)

    def test_catalog_and_assignments_are_not_in_the_session_request(self):
        self.assertIn("$action === 'catalog'", self.api)
        self.assertIn("allParams.set('include_assignments', '0')", self.dashboard)
        self.assertIn("include_sessions: '0'", self.dashboard)
        self.assertIn('fetchDashboardCatalog({ includeTechnicians: technicianCatalogRequested })', self.dashboard)
        self.assertIn('function dashboardViewNeedsTechnicianCatalog', self.dashboard)
        self.assertIn('DASHBOARD_CATALOG_CACHE_SECONDS=21600', self.example_env)
        self.assertIn('function reloadDashboardSessionsForRange()', self.dashboard)
        self.assertIn('reloadDashboardSelectedRange();', self.dashboard)

    def test_raw_sessions_are_loaded_only_for_views_that_render_them(self):
        self.assertIn('function dashboardViewNeedsSessions', self.dashboard)
        self.assertIn("viewName === 'instructors'", self.dashboard)
        self.assertIn('const sessionsRequested = dashboardViewNeedsSessions()', self.dashboard)
        self.assertIn("allParams.set('include_sessions', sessionsRequested ? '1' : '0')", self.dashboard)
        self.assertIn('ensureDashboardSessionsLoaded()', self.dashboard)

    def test_technician_lookup_uses_server_pages_and_lazy_history(self):
        self.assertIn('function dashboard_technician_summary_page', self.technicians)
        self.assertIn('COUNT(*) OVER () AS matched_technicians', self.technicians)
        self.assertIn('function dashboard_technician_session_page', self.technicians)
        self.assertIn('/dashboard/technicians?', self.dashboard)
        self.assertIn('/dashboard/technician-sessions?', self.dashboard)
        self.assertIn('loadSelectedTechnicianHistory', self.dashboard)
        self.assertIn('DASHBOARD_TECHNICIAN_PAGE_SIZE=25', self.example_env)
        self.assertIn('idx_timer_sessions_dashboard_time', self.technician_index_migration)

    def test_overview_region_charts_use_compact_database_aggregates(self):
        self.assertIn('function dashboard_report_monthly_regions', self.report)
        self.assertIn("'monthly_regions' => $monthlyRegions", self.report)
        self.assertIn('dashboardReport?.monthly_regions', self.dashboard)

    def test_response_size_and_query_count_are_observed(self):
        self.assertIn("'response_bytes' => $responseBytes", self.api)
        self.assertIn("'database_queries' => $queryCount", self.api)
        self.assertIn("'budget_exceeded' =>", self.api)
        self.assertIn('DASHBOARD_MAX_RESPONSE_BYTES=2097152', self.example_env)
        self.assertIn('DASHBOARD_MAX_QUERY_COUNT=8', self.example_env)

    def test_get_sessions_avoid_touch_writes_and_duplicate_reads(self):
        self.assertIn("session_start($readOnly ? ['read_and_close' => true] : [])", self.api)
        self.assertIn("ini_set('session.gc_probability', '0')", self.api)
        self.assertIn('$this->validatedData = (string)$value;', self.session_handler)
        self.assertIn('$this->validatedId === $id', self.session_handler)

    def test_authorization_query_omits_large_iam_profile(self):
        auth_columns = self.api.split('const AUTH_USER_COLUMNS =', 1)[1].split(';', 1)[0]
        self.assertNotIn('iam_profile', auth_columns)
        self.assertIn('find_user_by_id($userId, true)', self.api)

    def test_pdo_query_counter_is_centralized(self):
        self.assertIn('final class ObservedPDO extends PDO', self.runtime)
        self.assertIn('observe_database_query();', self.runtime)

    def test_version_poll_reads_single_revision_row(self):
        self.assertIn('FROM dashboard_revision_seq', self.api)
        self.assertNotIn('(SELECT COUNT(*) FROM timer_sessions)', self.api)
        self.assertIn('FOR EACH STATEMENT EXECUTE FUNCTION bump_dashboard_revision()', self.migration)
        self.assertIn("'timer_sessions'", self.migration)
        self.assertIn("'lab_assignments'", self.migration)
        self.assertIn("nextval('dashboard_revision_seq')", self.sequence_migration)


if __name__ == '__main__':
    unittest.main()
