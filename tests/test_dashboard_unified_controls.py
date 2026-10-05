import hashlib
import unittest
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]


class DashboardUnifiedControlsContractTests(unittest.TestCase):
    @classmethod
    def setUpClass(cls):
        cls.html = (ROOT / "dashboard-authen" / "index.html").read_text(encoding="utf-8")
        cls.css = (ROOT / "dashboard-authen" / "css" / "styles.css").read_text(encoding="utf-8")
        cls.professional_css = (ROOT / "dashboard-authen" / "css" / "dashboard-professional.css").read_text(encoding="utf-8")
        cls.javascript = (ROOT / "dashboard-authen" / "js" / "app.js").read_text(encoding="utf-8")

    def test_all_dashboard_tables_receive_non_wrapping_scroll_behavior(self):
        self.assertIn("function enhanceDashboardTables", self.javascript)
        self.assertIn("table.classList.add('unified-data-table')", self.javascript)
        self.assertIn("wrapper.className = 'unified-table-scroll'", self.javascript)
        self.assertIn("table-layout: auto !important", self.css)
        self.assertIn("white-space: nowrap !important", self.css)
        self.assertIn("overflow-x: auto", self.css)

    def test_checkbox_and_native_selects_do_not_use_browser_default_style(self):
        self.assertIn('input[type="checkbox"] {', self.css)
        self.assertIn("appearance: none", self.css)
        self.assertIn('input[type="checkbox"]:checked', self.css)
        self.assertIn("background: #e43f86", self.css)
        self.assertIn("select:not(.searchable-select-source)", self.css)

    def test_long_filter_selects_use_searchable_scrolling_popovers(self):
        for select_id in (
            "instructorClassSelect",
            "instructorDeviceSelect",
            "rosterEmployeeIdFilter",
            "rosterNameFilter",
            "rosterEmailFilter",
            "rosterJobTitleFilter",
            "rosterRegionFilter",
            "rosterBranchFilter",
            "rosterClassFilter",
            "rosterStatusFilter",
            "classCodeFilter",
            "classNameFilter",
            "classStatusFilter",
        ):
            self.assertIn(f"'{select_id}'", self.javascript)
        self.assertIn("function enhanceSearchableFilterSelect", self.javascript)
        self.assertIn('placeholder="Tìm giá trị..."', self.javascript)
        self.assertIn(".searchable-select-options", self.css)
        self.assertIn("max-height: 248px", self.css)
        self.assertIn("overflow-y: auto", self.css)

    def test_device_filters_are_searchable_checkbox_multiselects(self):
        self.assertIn("const multiSelectFilterIds = new Set", self.javascript)
        self.assertIn("'instructorDeviceSelect'", self.javascript)
        self.assertIn('aria-multiselectable="true"', self.javascript)
        self.assertIn('type="checkbox"', self.javascript)
        self.assertIn("searchable-select-apply", self.javascript)
        self.assertIn("searchable-select-clear", self.javascript)
        self.assertIn("searchable-select-check-option", self.css)

    def test_management_column_filters_reuse_staged_multiselect_behavior(self):
        for select_id in (
            "rosterEmployeeIdFilter",
            "rosterNameFilter",
            "rosterEmailFilter",
            "rosterJobTitleFilter",
            "rosterRegionFilter",
            "rosterBranchFilter",
            "rosterClassFilter",
            "rosterStatusFilter",
            "classCodeFilter",
            "classNameFilter",
            "classStatusFilter",
        ):
            self.assertIn(f"'{select_id}'", self.javascript)
        self.assertIn("Chọn tất cả", self.javascript)
        self.assertIn("Bỏ chọn", self.javascript)
        self.assertIn("Xóa lọc", self.javascript)
        self.assertIn("Áp dụng", self.javascript)
        self.assertIn("EMPTY_FILTER_SENTINEL", self.javascript)
        self.assertIn("admin-header-searchable-popover", self.css)
        self.assertNotIn('id="rosterSearchInput"', self.html)

    def test_apply_popovers_stage_checkbox_changes_before_rendering(self):
        self.assertIn("function snapshotHeaderFilterDraft", self.javascript)
        self.assertIn("function restoreHeaderFilterDraft", self.javascript)
        self.assertIn("wrapper._headerFilterDirty = true", self.javascript)
        self.assertIn("event.stopImmediatePropagation()", self.javascript)
        self.assertIn("dropdown._committingFilterDraft = true", self.javascript)
        self.assertIn("discardDraft: false", self.javascript)

    def test_region_charts_use_passed_people_and_sessions_per_headcount(self):
        for element_id in (
            "regionUsageChart",
            "regionUsageYear",
            "regionUsageInsights",
            "regionUsageLegend",
            "regionUsageTooltip",
            "regionUsagePeriodNote",
            "regionRaceChart",
            "overviewRegionReset",
            "overviewMonthlyCard",
            "overviewSessionsDrilldown",
        ):
            self.assertIn(f'id="{element_id}"', self.html)
        self.assertIn("function getRegionUsageSeries", self.javascript)
        self.assertIn("function isPracticeSession", self.javascript)
        self.assertIn("sessions.forEach(session =>", self.javascript)
        self.assertIn("passedLearnersByRegionMonth", self.javascript)
        self.assertIn("passedLearners / headcount", self.javascript)
        self.assertIn("practiceSessions / headcount", self.javascript)
        self.assertIn("function renderRegionRaceChart", self.javascript)
        self.assertIn("function selectOverviewRegion", self.javascript)
        self.assertIn(".filter(item => item.headcount > 0)", self.javascript)
        self.assertIn("KTV thực hành đạt (%)", self.javascript)
        self.assertIn("is-selected-month", self.javascript)
        self.assertIn("renderRegionUsageChart();", self.javascript)
        self.assertIn(".region-usage-line", self.css)
        self.assertIn(".region-usage-tooltip", self.css)
        self.assertIn(".region-race-row", self.professional_css)

        overview_start = self.html.index('id="overview"')
        kpi_grid = self.html.index('class="kpi-grid"', overview_start)
        region_chart = self.html.index('id="regionUsageChart"', overview_start)
        race_chart = self.html.index('id="regionRaceChart"', overview_start)
        monthly_trend = self.html.index('id="overviewMonthlyTrend"', overview_start)
        analytics_start = self.html.index('id="analytics"', overview_start)
        self.assertLess(kpi_grid, region_chart)
        self.assertLess(region_chart, race_chart)
        self.assertLess(region_chart, monthly_trend)
        self.assertLess(monthly_trend, analytics_start)
        self.assertEqual(self.html.count('id="regionUsageChart"'), 1)

    def test_session_status_filters_only_offer_submitted_outcomes(self):
        for container_id, clear_id in (
            ("realtimeStatusOptions", "realtimeStatusClear"),
            ("detailStatusOptions", "detailStatusClear"),
        ):
            start = self.html.index(f'id="{container_id}"')
            end = self.html.index(f'id="{clear_id}"', start)
            options = self.html[start:end]
            self.assertIn('value="Đạt"', options)
            self.assertIn('value="Chưa đạt"', options)
            self.assertIn('value="Chưa có kết quả"', options)
            self.assertIn('value="Không đánh giá"', options)
            self.assertNotIn('value="Đang làm"', options)
            self.assertNotIn('value="Đã dừng"', options)

    def test_kpis_are_grouped_and_never_use_local_fallback_formulas(self):
        self.assertIn('id="activityKpiGroupTitle"', self.html)
        self.assertNotIn('id="outcomeKpiGroupTitle"', self.html)
        for retained_kpi in ("kpiSessions", "kpiGuideSessions", "kpiLearners", "kpiPassRate"):
            self.assertIn(f'id="{retained_kpi}"', self.html)
        for removed_kpi in ("kpiAvgDuration", "kpiCompleted", "kpiCompletionRate", "kpiFirstTryRate"):
            self.assertNotIn(f'id="{removed_kpi}"', self.html)
        self.assertIn("dashboardReportStatus: 'loading'", self.javascript)
        self.assertIn("Không có dữ liệu báo cáo tổng hợp cho kỳ đã chọn", self.javascript)
        self.assertNotIn("function computeMetrics", self.javascript)

    def test_desktop_header_keeps_actions_inline_with_dashboard_title(self):
        self.assertIn("css/dashboard-professional.css?v=", self.html)
        self.assertIn("@media (max-width: 1180px) and (min-width: 961px)", self.professional_css)
        self.assertNotIn("@media (max-width: 1400px) and (min-width: 961px)", self.professional_css)

    def test_report_year_follows_the_selected_month(self):
        self.assertIn("state.regionUsageYear = startBounds.year", self.javascript)
        self.assertIn("Khác kỳ báo cáo đang chọn", self.javascript)
        self.assertIn("100%* là kỳ chỉ có dữ liệu đạt lịch sử", self.html)

    def test_overview_accepts_an_arbitrary_contiguous_month_range(self):
        for element_id in (
            "overviewMonthSummary",
            "overviewMonthApply",
            "overviewMonthCancel",
        ):
            self.assertIn(f'id="{element_id}"', self.html)
        self.assertIn("const applySelectedRange", self.javascript)
        self.assertIn("const normalizeMonthRange", self.javascript)
        self.assertIn("selectedMonth < draftStartMonth", self.javascript)
        self.assertIn("selectedMonth > draftEndMonth", self.javascript)
        self.assertIn("state.startDate = startBounds.start", self.javascript)
        self.assertIn("state.endDate = endBounds.end", self.javascript)
        self.assertIn("function isFullCalendarMonthRange", self.javascript)
        self.assertIn("currentStart.getMonth() - monthCount", self.javascript)
        self.assertIn("overview-month-option.in-range", self.css)
        self.assertIn(".overview-month-option.range-start", self.css)

    def test_overview_month_clicks_are_staged_until_apply(self):
        handler_start = self.javascript.index("monthGrid.querySelectorAll('[data-report-month]')")
        handler_end = self.javascript.index("if (yearSelect)", handler_start)
        month_click_handler = self.javascript[handler_start:handler_end]
        self.assertIn("renderMonthGrid(year)", month_click_handler)
        self.assertIn("updateDraftSummary()", month_click_handler)
        self.assertNotIn("applySelectedRange(", month_click_handler)
        self.assertNotIn("reloadDashboardSelectedRange()", month_click_handler)

    def test_overview_month_picker_supports_accumulated_multi_month_selection(self):
        self.assertIn("let draftSelectionStarted = false", self.javascript)
        self.assertIn("selectedMonth < draftStartMonth", self.javascript)
        self.assertIn("selectedMonth > draftEndMonth", self.javascript)
        self.assertIn("selectedMonthCount()", self.javascript)
        self.assertIn("Chọn một hoặc nhiều tháng liên tiếp", self.html)
        self.assertIn(
            "applyButton?.addEventListener('click', () => applySelectedRange(draftStartMonth, draftEndMonth))",
            self.javascript,
        )

    def test_class_report_uses_compact_master_detail_overview(self):
        overview = self.html.index('id="classOverviewCard"')
        detail = self.html.index('id="classDetailCard"')
        self.assertLess(overview, detail)
        for heading in (
            "Số KTV",
            "Thiết bị đã giao",
            "Lượt thực hành",
            "KTV hoàn thành",
            "Tỷ lệ hoàn thành",
        ):
            self.assertIn(heading, self.javascript)
        self.assertIn("class-overview-progress-track", self.javascript)
        self.assertIn("fullyCompletedCount", self.javascript)
        self.assertIn('classProgressFilterWrapper', self.javascript)
        self.assertIn('id="classProgressFilterApply"', self.javascript)
        self.assertIn('id="classProgressFilterAll"', self.javascript)
        self.assertIn('id="classProgressFilterNone"', self.javascript)
        self.assertIn('input type="checkbox" value=', self.javascript)
        self.assertNotIn('name="class-progress-filter"', self.javascript)
        self.assertIn('header-filter-footer', self.javascript)
        self.assertIn('header-filter-apply', self.javascript)
        self.assertIn('ktv-header-sort', self.javascript)
        self.assertIn('id="classPersonnelSummaryOpen"', self.html)
        self.assertIn('id="classDeviceProgressList"', self.html)
        self.assertIn('id="classDeviceStatSearch"', self.html)
        self.assertIn('id="classDeviceStatSortTrigger"', self.html)
        self.assertIn('id="classDeviceStatSortWrapper"', self.html)
        self.assertIn('data-device-stat-sort="completed_desc"', self.html)
        self.assertNotIn('id="classDeviceStatSort"', self.html)
        self.assertNotIn('id="classMatrixClassSelect"', self.html)
        self.assertNotIn('id="classMatrixDeviceSelect"', self.html)
        self.assertNotIn('id="classMatrixSearchInput"', self.html)
        self.assertIn('classOverviewFilterWrapper', self.javascript)
        self.assertIn('data-class-overview-sort', self.javascript)
        self.assertIn('classKtvFilterWrapper', self.javascript)
        self.assertIn('classOverviewSelectedClasses', self.javascript)
        self.assertIn('classMatrixSelectedKtvs', self.javascript)
        self.assertIn('function bindClassChecklistFilter', self.javascript)
        self.assertNotIn('function bindClassTextFilter', self.javascript)
        self.assertIn("document.body.appendChild(dropdown)", self.javascript)
        self.assertIn("class-header-filter-floating", self.javascript)
        self.assertIn("focus({ preventScroll: true })", self.javascript)
        self.assertIn(".popover-dropdown.class-header-filter-floating.header-filter-menu", self.css)
        self.assertIn(".class-header-filter-floating.header-filter-menu > .popover-options", self.css)
        self.assertIn("overflow-y: auto", self.css)
        self.assertIn("overflow: hidden", self.css)
        self.assertNotIn('id="classMatrixNameSort"', self.javascript)
        self.assertNotIn('id="classMatrixProgressFilter"', self.html)
        self.assertNotIn('id="classMatrixPersonnelSort"', self.html)
        for removed_kpi in (
            'classMatrixTotalSessions',
            'classMatrixTotalKtvs',
            'classMatrixTotalLabs',
            'classMatrixCompletionRate',
        ):
            self.assertNotIn(removed_kpi, self.html)
        self.assertIn("function formatClassEmployeeId", self.javascript)
        self.assertIn("--ktv-stt-width: 34px", self.css)
        self.assertIn("--ktv-code-width: 78px", self.css)
        self.assertIn("ktv-footer-stt", self.javascript)
        self.assertIn("ktv-footer-code", self.javascript)
        self.assertNotIn("classMatrixCompletionSort", self.javascript)
        self.assertIn("if (!table.matches('.class-matrix-table'))", self.javascript)
        self.assertIn("function focusClassMatrixDetail", self.javascript)
        self.assertIn("function focusClassMatrixTable", self.javascript)
        self.assertIn("scrollIntoView", self.javascript)
        self.assertIn(".class-overview-progress-track", self.css)
        self.assertIn(".class-overview-action", self.css)

    def test_class_overview_completion_rate_is_coloured_by_band(self):
        self.assertIn("function getClassRateLevel(rate)", self.javascript)
        for threshold in ("rate >= 80", "rate >= 50", "return 'zero'"):
            self.assertIn(threshold, self.javascript)
        self.assertIn("class-overview-progress is-${getClassRateLevel(row.rate)}", self.javascript)
        self.assertIn("class-overview-rate-total is-${getClassRateLevel(overallRate)}", self.javascript)
        # A fixed gradient would hide the band entirely: fill must come from a custom property.
        track_fill = self.css.split(".class-overview-progress-track span {", 1)[1].split("}", 1)[0]
        self.assertIn("background: var(--class-rate-fill)", track_fill)
        self.assertNotIn("gradient", track_fill)
        table_fill_override = self.css.split(
            "table.class-overview-table .class-overview-progress-track > span {", 1
        )[1].split("}", 1)[0]
        self.assertIn("display: block", table_fill_override)
        self.assertIn("max-width: none", table_fill_override)
        self.assertIn("color: var(--class-rate-text)", self.css)
        for level in ("high", "medium", "low", "zero"):
            self.assertIn(f".class-overview-progress.is-{level}", self.css)
            self.assertIn(f".class-overview-rate-total.is-{level}", self.css)
        # Fill colours must match the swatches in the shared completion legend.
        for swatch, level in (("legend-high", "high"), ("legend-medium", "medium"), ("legend-low", "low")):
            fill = self.css.split(f".class-overview-progress.is-{level} {{", 1)[1].split("}", 1)[0]
            legend = self.css.split(f".{swatch} {{", 1)[1].split("}", 1)[0].split("background:", 1)[1].strip().rstrip(";")
            self.assertIn(legend, fill, f"is-{level} fill must reuse the {swatch} swatch")
        self.assertIn('id="classOverviewLegend"', self.html)
        self.assertIn("legend-unassigned", self.html)
        self.assertIn("if (legend) legend.hidden = !hasRows", self.javascript)
        # Dark theme must keep the rate text readable on the dark surface.
        for level in ("high", "medium", "low", "zero"):
            self.assertIn(f':root[data-theme="dark"] .class-overview-progress.is-{level}', self.professional_css)

    def test_asset_version_prevents_stale_control_styles(self):
        styles_hash = hashlib.sha256((ROOT / "dashboard-authen" / "css" / "styles.css").read_bytes()).hexdigest()[:16]
        professional_hash = hashlib.sha256((ROOT / "dashboard-authen" / "css" / "dashboard-professional.css").read_bytes()).hexdigest()[:16]
        app_hash = hashlib.sha256((ROOT / "dashboard-authen" / "js" / "app.js").read_bytes()).hexdigest()[:16]
        self.assertIn(f"css/styles.css?v={styles_hash}", self.html)
        self.assertIn(f"css/dashboard-professional.css?v={professional_hash}", self.html)
        self.assertIn(f"js/app.js?v={app_hash}", self.html)

    def test_resizable_tables_use_stable_column_models(self):
        self.assertIn('id="technicianSessionsTable" data-resizable-columns="colgroup"', self.html)
        self.assertIn('id="realtimeSessionsTable" data-resizable-columns="colgroup"', self.html)
        self.assertIn('data-resizable-columns="legacy"', self.html)
        self.assertIn("ftc-dashboard-column-widths-v2", self.javascript)
        self.assertIn("function getDashboardColgroup", self.javascript)
        self.assertIn("function ensureDashboardColgroupLayout", self.javascript)
        self.assertIn("function resetDashboardTableColumnWidths", self.javascript)
        self.assertIn("if (!resizeMode) return;", self.javascript)
        self.assertIn('table[data-resizable-columns="colgroup"].column-widths-fixed', self.css)
        self.assertIn('data-resize-min-width="180"', self.html)
        self.assertIn('id="learnerColumnWidthReset"', self.html)

    def test_manual_refresh_is_in_place_and_version_gated(self):
        self.assertIn("await refreshDashboardData({ force: false, announce: true });", self.javascript)
        self.assertNotIn("window.location.reload();", self.javascript)
        self.assertIn("version === lastDashboardVersion", self.javascript)
        self.assertIn("Dữ liệu dashboard đã là phiên bản mới nhất.", self.javascript)

    def test_yellow_data_notices_are_visible_only_to_dev_role(self):
        self.assertEqual(self.html.count("data-dev-only-notice"), 2)
        self.assertIn("isDeveloper: false", self.javascript)
        self.assertIn("state.isDeveloper = role === 'DEV'", self.javascript)
        self.assertIn("function setDeveloperDiagnosticNotice", self.javascript)
        self.assertIn("if (!state.isDeveloper)", self.javascript)

    def test_each_dashboard_view_explains_its_data_scope(self):
        for copy in (
            "Trong tháng báo cáo đã chọn",
            "Tiến độ lũy kế; bài nộp trong kỳ báo cáo",
            "Phát sinh trong tháng/quý đã chọn; hoàn thành lũy kế đến cuối khoảng lọc",
            "Tiến độ lũy kế của từng KTV trong lớp",
            "Lịch sử, thiết bị và kết quả của từng KTV trong khoảng ngày đã chọn",
            "Dữ liệu hồ sơ hiện tại; cập nhật danh sách từ Excel",
            "Dữ liệu lớp hiện tại; chọn KTV và giao thiết bị",
        ):
            self.assertIn(copy, self.javascript)

    def test_session_modes_are_normalized_before_filters_run(self):
        self.assertIn("function normalizeSessionMode(mode)", self.javascript)
        self.assertIn("const normalizedMode = normalizeSessionMode(item.mode)", self.javascript)
        self.assertIn("mode: normalizedMode", self.javascript)

    def test_wrapped_desktop_topbar_actions_stay_right_aligned(self):
        breakpoint_start = self.professional_css.index("@media (max-width: 1180px) and (min-width: 961px)")
        breakpoint_end = self.professional_css.index("@media (max-width: 1280px)", breakpoint_start)
        breakpoint_css = self.professional_css[breakpoint_start:breakpoint_end]
        self.assertIn(".top-actions", breakpoint_css)
        self.assertIn("justify-content: flex-end", breakpoint_css)

    def test_dashboard_copy_is_short_consistent_and_user_friendly(self):
        for label in (
            "Hoạt động trong tháng",
            "Lượt hướng dẫn trong tháng",
            "Tỷ lệ thực hành đạt",
            "Tỷ lệ KTV thực hành đạt",
            "Biểu đồ thi đua giữa các khu vực",
            "Danh sách lớp học",
            "Lịch sử thực hành theo KTV",
            "Nhập từ Excel",
            "Lịch sử nhập",
            "Tổng hợp",
        ):
            self.assertIn(label, self.html)
        for old_label in (
            "Lượt xem hướng dẫn trong tháng",
            "Tỷ lệ KTV có thực hành đạt",
            "Biểu đồ đua giữa các khu vực",
            "Khu vực/CNx",
            "Lịch sử import",
            "Dashboard giám sát thực hành KTV",
        ):
            self.assertNotIn(old_label, self.html)
        self.assertIn("Nhập danh sách KTV", self.javascript)
        self.assertNotIn("Import danh sách KTV", self.javascript)
        self.assertIn("Lượt thực hành ghi nhận", self.html)
        self.assertIn("Gồm lượt hợp lệ và lượt đạt lịch sử.", self.html)
        self.assertIn("Lượt thực hành trong tháng/quý đã chọn; kết quả hoàn thành tính lũy kế đến cuối khoảng lọc.", self.html)
        self.assertIn('id="branchReportPeriodType"', self.html)
        self.assertIn('id="branchReportPeriodValue"', self.html)
        self.assertIn('id="branchReportYear"', self.html)
        self.assertIn('id="branchReportPeriodApply"', self.html)
        self.assertIn("Không phụ thuộc bộ lọc của tab Tổng quan", self.html)
        self.assertIn("Mỗi ô hiển thị lượt đạt / lượt thực hành.", self.html)
        self.assertNotIn("có đầy đủ kết quả và chuỗi lần làm", self.html)

    def test_all_views_share_a_compact_information_hierarchy(self):
        self.assertIn("Compact information hierarchy shared by every dashboard view", self.professional_css)
        self.assertIn(".panel-subtitle {", self.professional_css)
        self.assertIn("#analytics .detail-report-header", self.professional_css)
        self.assertIn("#classMatrix .detail-report-header", self.professional_css)
        self.assertIn(".instructor-class-manager {", self.professional_css)
        self.assertIn(".roster-panel {", self.professional_css)

    def test_region_matrix_rows_open_branch_and_ktv_drilldowns(self):
        for element_id in (
            "branchMatrixCard",
            "branchMatrixTitle",
            "branchMatrixHead",
            "branchMatrixBody",
            "branchMatrixFoot",
            "branchMatrixClose",
            "branchKtvMatrixCard",
            "branchKtvMatrixTitle",
            "branchKtvMatrixHead",
            "branchKtvMatrixBody",
            "branchKtvMatrixFoot",
            "branchKtvMatrixClose",
        ):
            self.assertEqual(self.html.count(f'id="{element_id}"'), 1)
        analytics_start = self.html.index('id="analytics"')
        self.assertIn('id="branchMatrixCard"', self.html)
        self.assertLess(self.html.index('id="branchMatrixCard"'), self.html.index('id="classMatrix"'))
        self.assertGreater(self.html.index('id="branchMatrixCard"'), analytics_start)
        self.assertLess(self.html.index('id="branchKtvMatrixCard"'), self.html.index('id="classMatrix"'))
        self.assertIn("branchMatrixRegionCode", self.javascript)
        self.assertIn("data-branch-region-code", self.javascript)
        self.assertIn("data-branch-unit-code", self.javascript)
        self.assertIn("function renderBranchReportDrilldown", self.javascript)
        self.assertIn("els.branchMatrixCard.hidden = false", self.javascript)
        self.assertIn("els.branchKtvMatrixCard.hidden = false", self.javascript)
        analytics_section = self.html[self.html.index('id="analytics"'):self.html.index('id="classMatrix"')]
        self.assertIn("tổng số KTV đang hoạt động", analytics_section)
        self.assertNotIn("số KTV được giao", analytics_section)
        ktv_matrix_start = analytics_section.index('id="branchKtvMatrixBody"')
        ktv_table = analytics_section[:analytics_section.index('</table>', ktv_matrix_start)]
        self.assertIn('class="detail-report-table class-matrix-table"', ktv_table)
        self.assertIn('class="detail-report-scroll class-matrix-scroll"', analytics_section)

    def test_matrix_reports_do_not_render_a_duplicate_page_surface(self):
        for selector in (
            "#analytics.detail-report-page > .detail-report-shell",
            "#classMatrix.detail-report-page > .detail-report-shell",
        ):
            self.assertIn(selector, self.professional_css)
        self.assertIn("background: transparent", self.professional_css)
        self.assertIn("box-shadow: none", self.professional_css)

    def test_shared_sort_listener_is_scoped_to_its_owned_tables(self):
        init_sort = self.javascript[
            self.javascript.index('function initSort()'):
            self.javascript.index('function populateCalendarSelects()', self.javascript.index('function initSort()'))
        ]
        self.assertNotIn("querySelectorAll('.sort-button')", init_sort)
        self.assertIn('.sort-button[data-table="realtime"]', init_sort)
        self.assertIn('.sort-button[data-table="sessions"]', init_sort)
        self.assertIn("'#detailTimeSort'", init_sort)
        self.assertIn("'#detailDurationSort'", init_sort)

    def test_all_sortable_headers_use_consistent_direction_marks(self):
        self.assertIn("isSorted ? (direction === 'asc' ? '↑' : '↓') : '↕'", self.javascript)
        self.assertNotIn('data-matrix-sort="name_asc"', self.javascript)
        self.assertNotIn('data-matrix-sort="code_asc"', self.javascript)
        self.assertIn('<th class="ktv-code-head" scope="col" rowspan="2">Mã NV</th>', self.javascript)
        self.assertIn('<span class="ktv-header-label">Kỹ thuật viên</span>', self.javascript)
        self.assertIn(
            "state.classMatrixPersonnelSortDirection = target === 'completion_rate_asc' ? 'desc' : 'asc';",
            self.javascript,
        )

    def test_class_progress_filter_discards_unapplied_draft(self):
        self.assertIn('function snapshotClassHeaderFilterDraft(wrapper)', self.javascript)
        self.assertIn('function restoreClassHeaderFilterDraft(wrapper)', self.javascript)
        self.assertIn('restoreClassHeaderFilterDraft(wrapper);', self.javascript)
        self.assertIn('snapshotClassHeaderFilterDraft(wrapper);', self.javascript)

    def test_instructor_reset_also_restores_every_device(self):
        reset_start = self.javascript.index(
            "document.getElementById('instructorProgressFilterReset')?.addEventListener"
        )
        reset_end = self.javascript.index("document.getElementById('instructorClassDelete')", reset_start)
        reset_handler = self.javascript[reset_start:reset_end]
        self.assertIn('state.instructorSelectedDevices = getInstructorDeviceGroups(selectedClass)', reset_handler)
        self.assertIn('deviceFilterActive', self.javascript)

    def test_class_matrix_percentage_stays_below_fraction(self):
        self.assertIn('class="report-metric-rate"', self.javascript)
        self.assertIn("`${passRate}%${cell.historicalPassCount", self.javascript)
        self.assertIn('#classMatrix .report-metric-cell > strong', self.professional_css)
        self.assertIn('#classMatrix .report-metric-cell > span', self.professional_css)


if __name__ == "__main__":
    unittest.main()
