import json
import re
import unittest
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]


class DashboardTechniciansContractTests(unittest.TestCase):
    @classmethod
    def setUpClass(cls):
        cls.api = (ROOT / 'api' / 'index.php').read_text(encoding='utf-8')
        cls.technicians_lib = (ROOT / 'api' / 'lib' / 'dashboard_technicians.php').read_text(encoding='utf-8')
        cls.dashboard_js = (ROOT / 'dashboard-authen' / 'js' / 'app.js').read_text(encoding='utf-8')

    def test_dashboard_routes_include_technicians_and_technician_sessions(self):
        self.assertIn("require_once __DIR__ . '/lib/dashboard_technicians.php';", self.api)
        self.assertIn("in_array($action, ['all', 'technicians', 'technician-sessions'], true)", self.api)
        self.assertIn("$action === 'technicians'", self.api)
        self.assertIn("$action === 'technician-sessions'", self.api)

    def test_technicians_endpoint_requires_admin_and_date_range(self):
        handler = self.api[self.api.index('function handle_dashboard('):]
        self.assertIn('require_admin();', handler)
        self.assertIn('dashboard-range-required', handler)
        self.assertIn('invalid-dashboard-filter', handler)
        self.assertIn('dashboard_technician_summary_page(', handler)
        self.assertIn('dashboard_technician_session_page(', handler)

    def test_technician_summary_sql_aggregates_server_side_with_window_totals(self):
        self.assertIn('function dashboard_technician_activity_cte(): string', self.technicians_lib)
        self.assertIn('function dashboard_technician_summary_page(', self.technicians_lib)
        self.assertIn('COUNT(*) OVER () AS matched_technicians', self.technicians_lib)
        self.assertIn('COALESCE(SUM(summary.total_sessions) OVER (), 0) AS matched_sessions', self.technicians_lib)
        self.assertIn('rate_eligible_count', self.technicians_lib)
        self.assertIn('passed_count', self.technicians_lib)
        self.assertIn('latest_duration_sec', self.technicians_lib)

    def test_technician_sessions_endpoint_uses_keyset_cursor_pagination(self):
        self.assertIn('function dashboard_technician_session_page(', self.technicians_lib)
        self.assertIn('(activity.occurred_at, activity.session_id) < (:cursor_started_at, CAST(:cursor_session_id AS BIGINT))', self.technicians_lib)
        self.assertIn('ORDER BY activity.occurred_at DESC, activity.session_id DESC', self.technicians_lib)
        self.assertIn("'has_more' => $result['has_more']", self.api)
        self.assertIn("'next_cursor' =>", self.api)

    def test_frontend_switches_technicians_to_server_side_summaries(self):
        self.assertIn('let technicianSummaries = [];', self.dashboard_js)
        self.assertIn('function buildTechnicianSummaryQuery()', self.dashboard_js)
        self.assertIn('async function reloadTechnicianSummaries(', self.dashboard_js)
        self.assertIn('function ensureTechnicianSummariesLoaded()', self.dashboard_js)
        self.assertIn('async function loadSelectedTechnicianHistory(', self.dashboard_js)
        self.assertIn('function renderTechnicianSummaryTable()', self.dashboard_js)

    def test_frontend_does_not_fetch_all_raw_sessions_for_technicians_view(self):
        self.assertRegex(
            self.dashboard_js,
            r"function dashboardViewNeedsSessions\(.*?\)\s*\{\s*return viewName === 'instructors';\s*\}",
        )
        self.assertIn("activeDashboardView === 'technicians'", self.dashboard_js)


if __name__ == '__main__':
    unittest.main()
