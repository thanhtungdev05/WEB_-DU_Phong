import re
import unittest
from pathlib import Path


ROOT = Path(__file__).resolve().parents[1]


class TrainingClassAssignmentContractTests(unittest.TestCase):
    def test_migration_allows_multiple_classes_and_uses_sequence(self):
        sql = (ROOT / "api" / "migrations" / "033_training_class_assignment_management.sql").read_text(encoding="utf-8")
        self.assertIn("CREATE SEQUENCE IF NOT EXISTS training_class_code_seq", sql)
        self.assertIn("DROP INDEX IF EXISTS idx_class_enrollments_one_current_class", sql)
        self.assertRegex(sql, r"ON class_enrollments \(class_id, user_id\)")

    def test_migration_restores_tables_removed_by_cleanup_025(self):
        cleanup = (ROOT / "api" / "migrations" / "025_cleanup_obsolete_lms_tables.sql").read_text(encoding="utf-8")
        migration = (ROOT / "api" / "migrations" / "033_training_class_assignment_management.sql").read_text(encoding="utf-8")
        removed_tables = re.findall(r"DROP TABLE IF EXISTS ([a-z_]+)", cleanup)
        required = {
            "curricula",
            "curriculum_labs",
            "training_classes",
            "class_enrollments",
            "lab_assignments",
        }
        self.assertTrue(required.issubset(set(removed_tables)))
        for table in required:
            with self.subTest(table=table):
                self.assertIn(f"CREATE TABLE IF NOT EXISTS {table}", migration)
        self.assertLess(
            migration.index("CREATE TABLE IF NOT EXISTS training_classes"),
            migration.index("FROM training_classes;"),
        )

    def test_class_routes_require_admin_and_learning_requires_user(self):
        api = (ROOT / "api" / "index.php").read_text(encoding="utf-8")
        class_handler = re.search(r"function handle_training_classes\(.*?\n}\n\nfunction handle_learning", api, re.S)
        self.assertIsNotNone(class_handler)
        self.assertIn("require_admin()", class_handler.group(0))
        learning_handler = re.search(r"function handle_learning\(.*?\n}", api, re.S)
        self.assertIsNotNone(learning_handler)
        self.assertIn("require_user()", learning_handler.group(0))

    def test_tracking_accepts_active_catalog_labs_without_assignment(self):
        tracking = (ROOT / "api" / "lib" / "tracking_handler.php").read_text(encoding="utf-8")
        self.assertNotIn("training_class_user_has_lab", tracking)
        self.assertNotIn("tracking/not-assigned", tracking)
        self.assertGreaterEqual(tracking.count("lab.is_active = TRUE"), 2)
        self.assertGreaterEqual(tracking.count("device.is_active = TRUE"), 2)
        self.assertIn("if ((string)$existingTimer['status'] === 'in_progress')", tracking)
        self.assertRegex(tracking, re.compile(r"UPDATE timer_sessions.*?status = :status", re.S))

    def test_tracking_updates_every_overlapping_effective_assignment(self):
        tracking = (ROOT / "api" / "lib" / "tracking_handler.php").read_text(encoding="utf-8")
        sync = re.search(
            r"function sync_tracking_attempt\(.*?\n}\n\nfunction reserve_tracking_timer_start",
            tracking,
            re.S,
        )
        self.assertIsNotNone(sync)
        self.assertIn("$assignments = $lookup->fetchAll()", sync.group(0))
        self.assertIn("foreach ($assignments as $assignment)", sync.group(0))
        self.assertNotIn("LIMIT 1", sync.group(0))
        self.assertIn("FOR UPDATE OF assignment", sync.group(0))
        self.assertIn("enrollment.is_mock = FALSE", sync.group(0))
        self.assertIn("training.status IN ('planned', 'active')", sync.group(0))
        self.assertIn("class_assignment.status IN ('assigned', 'active')", sync.group(0))
        self.assertIn("class_assignment.assigned_at <= NOW()", sync.group(0))
        self.assertIn("first_try_evidence IS DISTINCT FROM 'derived_complete'", sync.group(0))

    def test_timer_sessions_link_to_every_effective_assignment(self):
        migration = (ROOT / "api" / "migrations" / "034_link_timer_sessions_to_assignments.sql").read_text(encoding="utf-8")
        tracking = (ROOT / "api" / "lib" / "tracking_handler.php").read_text(encoding="utf-8")
        api = (ROOT / "api" / "index.php").read_text(encoding="utf-8")

        self.assertIn("CREATE TABLE IF NOT EXISTS timer_session_assignment_links", migration)
        self.assertIn("PRIMARY KEY (timer_session_id, assignment_id)", migration)
        self.assertIn("ON CONFLICT (timer_session_id, assignment_id) DO NOTHING", migration)
        self.assertIn("'historical_effective'", migration)
        self.assertIn("INSERT INTO timer_session_assignment_links", tracking)
        self.assertIn("'live_sync'", tracking)
        self.assertIn("timer_session_assignment_links link", api)
        self.assertIn("assignment_class_codes", api)

    def test_dashboard_counts_only_explicit_assignment_pairs(self):
        api = (ROOT / "api" / "index.php").read_text(encoding="utf-8")
        report = (ROOT / "api" / "lib" / "dashboard_report.php").read_text(encoding="utf-8")
        timer_scope = re.search(r"\$timerSql = 'SELECT.*?\$timerParams", api, re.S)
        technician_scope = re.search(r"SELECT directory\.\*,.*?->fetchAll\(\);", api, re.S)
        self.assertIsNotNone(timer_scope)
        self.assertIsNotNone(technician_scope)
        for scope in (timer_scope.group(0), technician_scope.group(0), report):
            self.assertNotIn("job_title =", scope)
            self.assertNotIn("employee_source LIKE", scope)
        self.assertIn("JOIN v_ktv_directory roster", report)
        self.assertIn("FROM lab_assignments assignment", report)
        self.assertIn("JOIN class_enrollments enrollment", report)
        self.assertIn("SELECT (SELECT COUNT(*) FROM cohort_pairs) AS assigned_count", report)
        self.assertNotIn("(SELECT COUNT(*) FROM eligible) * (SELECT COUNT(*) FROM active_labs)", report)
        self.assertIn("'cohort' => 'assigned_as_of_period_end'", report)

    def test_new_assignments_snapshot_class_or_current_user_region(self):
        library = (ROOT / "api" / "lib" / "training_classes.php").read_text(encoding="utf-8")
        self.assertGreaterEqual(
            library.count("class_assignment.due_at, 'assigned', roster.region_id, roster.unit_id"),
            2,
        )

    def test_class_creation_refreshes_roster_report_and_dashboard_version(self):
        api = (ROOT / "api" / "index.php").read_text(encoding="utf-8")
        dashboard = (ROOT / "dashboard-authen" / "js" / "app.js").read_text(encoding="utf-8")
        revision_migration = (ROOT / "api" / "migrations" / "047_dashboard_transfer_guard.sql").read_text(encoding="utf-8")

        self.assertIn("function roster_assigned_class_join_sql", api)
        self.assertIn("STRING_AGG(DISTINCT training.class_code", api)
        self.assertIn("assigned_class.assigned_class_code", api)
        for table in ("training_classes", "class_enrollments", "class_lab_assignments", "lab_assignments"):
            self.assertIn(f"'{table}'", revision_migration)
        self.assertIn("'timer_session_assignment_links'", revision_migration)
        self.assertIn("FROM dashboard_revision_seq", api)
        self.assertIn("data_version: version", dashboard)
        self.assertRegex(
            dashboard,
            re.compile(r"loadTrainingClasses\(\).*?loadRosterList\(\).*?refreshDashboardData\(\{ force: true \}\)", re.S),
        )

    def test_existing_classes_can_be_edited_without_deleting_history(self):
        api = (ROOT / "api" / "index.php").read_text(encoding="utf-8")
        library = (ROOT / "api" / "lib" / "training_classes.php").read_text(encoding="utf-8")
        html = (ROOT / "dashboard-authen" / "index.html").read_text(encoding="utf-8")
        dashboard = (ROOT / "dashboard-authen" / "js" / "app.js").read_text(encoding="utf-8")

        self.assertIn("function training_class_update", library)
        self.assertIn("FOR UPDATE", library)
        self.assertIn("expectedUpdatedAt", dashboard)
        self.assertIn("'class-conflict'", library)
        self.assertIn("status = 'withdrawn'", library)
        self.assertIn("THEN 'cancelled' ELSE 'closed'", library)
        self.assertIn("THEN 'waived' ELSE", library)
        self.assertIn("GREATEST(assignment.assigned_at", library)
        self.assertIn("individual.status <> 'passed'", library)
        self.assertNotIn("DELETE FROM class_enrollments", library)
        self.assertNotIn("DELETE FROM class_lab_assignments", library)
        self.assertRegex(api, re.compile(r"\$method === 'PATCH'.*?training_class_update", re.S))
        self.assertIn('data-edit-class-id=', dashboard)
        self.assertNotIn('id="classValidTo"', html)
        self.assertIn('id="classEditCancelBtn"', html)
        self.assertNotIn("'validTo'", library)
        self.assertNotIn('end_date', library)

    def test_result_modal_waits_for_tracking_save(self):
        portal = (ROOT / "app.js").read_text(encoding="utf-8")
        self.assertIn("if (trackingSaveInFlight) return;", portal)
        self.assertRegex(
            portal,
            re.compile(
                r"const savePromise = sendTrackingTimer.*?Promise\.resolve\(savePromise\)\.finally.*?showGradingModal",
                re.S,
            ),
        )

    def test_reports_only_include_submitted_sessions(self):
        api = (ROOT / "api" / "index.php").read_text(encoding="utf-8")
        report = (ROOT / "api" / "lib" / "dashboard_report.php").read_text(encoding="utf-8")
        library = (ROOT / "api" / "lib" / "training_classes.php").read_text(encoding="utf-8")
        personal_html = (ROOT / "personal-dashboard.html").read_text(encoding="utf-8")
        personal_js = (ROOT / "assets" / "personal-dashboard.js").read_text(encoding="utf-8")

        self.assertIn("timer.status IN (\\'completed\\', \\'failed\\')", api)
        self.assertIn("timer.status IN ('completed', 'failed')", report)
        self.assertIn("s.status IN ('completed', 'failed')", library)
        self.assertNotIn('option value="in_progress"', personal_html)
        self.assertNotIn('option value="abandoned"', personal_html)
        self.assertIn("s.status === 'completed' || s.status === 'failed'", personal_js)
        self.assertNotIn("<th>Trạng thái</th>", personal_html)
        self.assertIn('option value="ungraded"', personal_html)
        self.assertIn("Chưa có kết quả", personal_js)

    def test_learning_catalog_is_full_active_catalog_for_every_user(self):
        library = (ROOT / "api" / "lib" / "training_classes.php").read_text(encoding="utf-8")
        catalog = re.search(
            r"function training_class_learning_catalog\(.*?\n}\n\nfunction training_class_import_header",
            library,
            re.S,
        )
        self.assertIsNotNone(catalog)
        self.assertIn("FROM device_catalog device", catalog.group(0))
        self.assertIn("JOIN lab_catalog lab", catalog.group(0))
        self.assertIn("device.is_active = TRUE AND lab.is_active = TRUE", catalog.group(0))
        self.assertNotIn("class_enrollments", catalog.group(0))
        self.assertNotIn("lab_assignments", catalog.group(0))

    def test_portal_uses_server_active_catalog(self):
        portal = (ROOT / "app.js").read_text(encoding="utf-8")
        self.assertIn("/api/index.php/learning/catalog", portal)
        self.assertIn("_catalogDeviceIds", portal)
        self.assertIn("_catalogLabIds", portal)
        self.assertNotIn("_allowedDeviceIds", portal)
        self.assertNotIn("_allowedLabIds", portal)

    def test_class_member_import_is_previewed_inside_create_tab(self):
        html = (ROOT / "dashboard-authen" / "index.html").read_text(encoding="utf-8")
        javascript = (ROOT / "dashboard-authen" / "js" / "app.js").read_text(encoding="utf-8")
        api = (ROOT / "api" / "index.php").read_text(encoding="utf-8")
        library = (ROOT / "api" / "lib" / "training_classes.php").read_text(encoding="utf-8")
        self.assertNotIn('data-class-tab="import"', html)
        self.assertNotIn('id="classImportPanel"', html)
        self.assertIn('id="classMemberFileBtn"', html)
        self.assertNotIn('id="classMemberFileBtn" disabled', html)
        self.assertIn('Đặt tên cho lớp mới (Ví dụ: BDG01, HNI01, ...)', html)
        self.assertIn('id="classConfigModal"', html)
        self.assertIn('id="classKtvSearchInput"', html)
        self.assertIn('id="classKtvSearchDropdown"', html)
        self.assertIn('id="classOpenConfigModalBtn"', html)
        self.assertIn('id="classCreateBtn"', html)
        self.assertIn("/classes/members/preview", javascript)
        self.assertIn("memberImports", javascript)
        self.assertIn("openClassConfigModal", javascript)
        self.assertIn("handle_training_class_member_preview", api)
        self.assertIn("parse_training_class_members_xlsx", library)
        self.assertIn("'action'=>'create'", library)
        self.assertIn("'action'=>'existing'", library)
        self.assertIn("'class-member-import'", library)
        self.assertRegex(library, re.compile(r"INSERT INTO users \(.*?'KTV'", re.S))

    def test_local_bypass_actor_does_not_break_foreign_keys(self):
        library = (ROOT / "api" / "lib" / "training_classes.php").read_text(encoding="utf-8")
        self.assertIn("function training_class_actor_user_id", library)
        self.assertIn("'created_by' => training_class_actor_user_id($pdo, $actor)", library)

    def test_personal_dashboard_endpoint_and_portal_integration(self):
        api = (ROOT / "api" / "index.php").read_text(encoding="utf-8")
        library = (ROOT / "api" / "lib" / "training_classes.php").read_text(encoding="utf-8")
        portal = (ROOT / "portal.html").read_text(encoding="utf-8")
        dashboard_html = (ROOT / "personal-dashboard.html").read_text(encoding="utf-8")
        dashboard_js = (ROOT / "assets" / "personal-dashboard.js").read_text(encoding="utf-8")
        example_env = (ROOT / ".env.example").read_text(encoding="utf-8")

        self.assertIn("training_class_personal_dashboard_payload", api)
        self.assertIn("personal-dashboard", api)
        self.assertIn("function training_class_personal_dashboard_payload", library)
        self.assertIn("submitted_practice_sessions_count", library)
        self.assertIn("rate_eligible_practice_sessions_count", library)
        self.assertIn("legacy_incomplete_practice_sessions_count", library)
        self.assertIn("s.attempt_sequence_complete IS TRUE", library)
        self.assertGreaterEqual(library.count("JOIN lab_catalog l ON l.lab_id = s.lab_id AND l.is_active = TRUE"), 3)
        self.assertIn("official_attempt_count", library)
        self.assertIn("has_completion_pass", library)
        self.assertIn("historical_passed_sessions_count", library)
        self.assertIn("practice_duration_coverage_percent", library)
        self.assertIn("env_int('PERSONAL_DASHBOARD_SESSION_LIMIT', 100, 24, 500)", library)
        self.assertIn("LIMIT CAST(:session_history_limit AS INTEGER)", library)
        self.assertIn("PERSONAL_DASHBOARD_SESSION_LIMIT=100", example_env)
        self.assertIn('id="btn-personal-dashboard"', portal)
        self.assertIn('href="/personal-dashboard.html"', portal)
        self.assertIn('id="btn-goto-practice"', dashboard_html)
        self.assertIn("/api/index.php/learning/personal-dashboard", dashboard_js)
        self.assertIn("'/login/index.html?redirect='", dashboard_js)
        self.assertIn("window.location.href = '/login/index.html';", dashboard_js)
        self.assertNotIn("'/login/?redirect='", dashboard_js)
        self.assertNotIn("stats.submitted_practice_sessions_count", dashboard_js)
        self.assertNotIn("stats.legacy_incomplete_practice_sessions_count", dashboard_js)
        self.assertIn("${passedSessions}/${gradedSessions} lượt đạt", dashboard_js)
        self.assertIn("historicalPassedSessions", dashboard_js)
        self.assertIn("20260918-recorded-practice-v4", dashboard_html)
        self.assertIn('/assets/logoFPT.png?v=20260924-fpt-telecom', dashboard_html)


if __name__ == "__main__":
    unittest.main()
