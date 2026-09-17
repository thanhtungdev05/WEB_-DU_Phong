const API_BASE_URL = '/api/index.php';

let sessions = [];
let deviceCatalog = [];
let technicianCatalog = [];
let trainingAssignments = [];
let classMemberships = [];
let dashboardReport = null;
let technicianByIdentity = new Map();
let technicianCatalogAuthoritative = false;
let instructorSearchTimer = null;
let reportExportReturnFocus = null;
let reportExportBusy = false;
let activeToastTimer = null;
let rosterEditReturnFocus = null;
let dashboardLoadRequest = null;
let deviceSubModalReturnFocus = null;
let learnerDetailReturnIdentity = '';

const formatNumber = new Intl.NumberFormat('vi-VN');
const LEARNER_TABLE_PAGE_SIZE = 4;
const LEARNER_HISTORY_PAGE_SIZE = 6;

const now = new Date();
const currentMonthFirst = new Date(now.getFullYear(), now.getMonth(), 1);
const fmtDate = d => `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;

const state = {
    currentUser: null,
    isAdmin: false,
    canExportReports: false,
    startDate: fmtDate(currentMonthFirst),
    endDate: fmtDate(now),
    tempStartDate: '',
    tempEndDate: '',
    calendarMonth: new Date(now.getFullYear(), now.getMonth(), 1),

    hourlyStartDate: '',
    hourlyEndDate: '',
    hourlyTempStartDate: '',
    hourlyTempEndDate: '',
    hourlyCalendarMonth: new Date(now.getFullYear(), now.getMonth(), 1),
    hourlyCalendarFocusDate: fmtDate(now),

    selectedLearner: '',

    // Real-time table filters & sort
    realtimeTimeSortDir: 'desc',
    realtimeSelectedKtvs: new Set(),
    realtimeSelectedModes: new Set(['Thực hành', 'Hướng dẫn']),
    realtimeSelectedDevices: new Set(),
    realtimeSelectedStatuses: new Set(['Đạt', 'Chưa đạt', 'Chưa có kết quả', 'Không đánh giá']),
    realtimeSearchKtv: '',
    realtimeSearchDevice: '',
    realtimeSearchLab: '',
    realtimePage: 1,
    realtimeSelectedLabs: new Set(),
    realtimeLabsTouched: false,

    // Instructor class progress workspace
    instructorClasses: [],
    instructorClassesLoaded: false,
    instructorActiveClassId: '',
    instructorSelectedDevices: null,
    instructorSearchKtv: '',
    instructorCompletionFilter: 'all',
    instructorImportMembers: [],
    instructorImportFileName: '',
    instructorWorkspaceBound: false,
    assignmentsLoaded: false,

    // Class Matrix state
    classMatrixSelectedClass: '',
    classMatrixSelectedDevices: null,
    classOverviewSearch: '',
    classOverviewSelectedClasses: null,
    classMatrixKtvSearch: '',
    classMatrixSelectedKtvs: null,
    classMatrixProgressFilter: null,
    classMatrixPersonnelSort: 'name_asc',
    classMatrixPersonnelSortDirection: 'asc',
    classMatrixDeviceStatSearch: '',
    classMatrixDeviceStatSort: 'completed_desc',
    classOverviewSort: 'name',
    classOverviewSortDirection: 'asc',

    // Learner table filters & sort
    learnerSelectedKtvs: new Set(),
    learnerSelectedDevices: new Set(),
    learnerSelectedLabs: new Set(),
    learnerSearchKtv: '',
    learnerSelectedEmails: new Set(),
    learnerEmailsTouched: false,
    learnerSelectedRegions: new Set(),
    learnerRegionsTouched: false,
    learnerTablePage: 1,
    learnerDetailPage: 1,
    sessionsSort: { key: 'lastDateTimeMs', direction: 'desc' },

    // Learner Detail popup filters & sort
    detailTimeSortDir: 'desc',
    detailDurationSortDir: 'desc',
    detailSortKey: 'time',
    detailSelectedModes: new Set(['Thực hành', 'Hướng dẫn']),
    detailSelectedDevices: new Set(),
    detailDevicesTouched: false,
    detailSelectedStatuses: new Set(['Đạt', 'Chưa đạt', 'Chưa có kết quả', 'Không đánh giá']),
    detailSearchDevice: '',
    detailSelectedLabs: new Set(),
    detailLabsTouched: false,
    detailSearchLab: '',

    detailReportExpandedRegions: new Set(['TDDT', 'TNMT']),
    branchMatrixRegionCode: '',
    branchMatrixUnitCode: '',
    regionUsageYear: now.getFullYear(),
    overviewSelectedRegion: '',
    overviewMonthlyExpanded: false,

    filtersBound: false,
    popoversInitialized: false,
    dataSourceLabel: 'Đang đồng bộ dữ liệu vận hành',
    dashboardDataLoaded: false,
    dashboardReportStatus: 'loading',
    lastSuccessfulRefreshAt: null,

    // Roster (Quản lý KTV) — Admin
    rosterTab: 'list',
    rosterItems: [],
    rosterRegions: [],
    rosterRegionsLoaded: false,
    rosterStats: null,
    rosterPage: 1,
    rosterTotal: 0,
    rosterStatusFilter: ['active'],
    rosterColumnFilters: {
        employeeId: null,
        name: null,
        email: null,
        jobTitle: null,
        region: null,
        branch: null,
        className: null
    },
    rosterFilterFacets: {
        employeeIds: [],
        names: [],
        emails: [],
        jobTitles: [],
        regions: [],
        branches: [],
        classes: []
    },
    rosterHistoryItems: [],
    rosterPreviewData: null,
    rosterImportFile: null,
    rosterImportBatchId: '',
    rosterImportBusy: false,
    rosterLoaded: false,
    rosterHistoryLoaded: false,
    rosterEditEmployeeId: '',
    rosterInitialized: false,
    rosterRequestSequence: 0,
    rosterHistoryRequestSequence: 0,

    // Training class registration and assignment management
    classTab: 'list',
    classItems: [],
    classCatalog: { members: [], devices: [] },
    classSelectedMembers: new Set(),
    classPendingMembers: new Map(),
    classSelectedDevices: new Set(),
    classMemberSearch: '',
    classEditingId: '',
    classEditingUpdatedAt: '',
    classLoaded: false,
    classCatalogLoaded: false,
    classInitialized: false,
    classMemberImportFile: null,
    classMemberImportPreview: null,
    classMemberImportBusy: false,
    classFinalPreviewReady: false,
    classSortKey: 'startDate',
    classSortDirection: 'desc',
    classCodeFilter: null,
    classNameFilter: null,
    classStatusFilter: null,
};

const els = {
    sessionsBody: document.getElementById('sessionsBody'),
    learnerTableMeta: document.getElementById('learnerTableMeta'),
    detailReportHead: document.getElementById('detailReportHead'),
    detailReportBody: document.getElementById('detailReportBody'),
    detailReportFoot: document.getElementById('detailReportFoot'),
    branchMatrixCard: document.getElementById('branchMatrixCard'),
    branchMatrixTitle: document.getElementById('branchMatrixTitle'),
    branchMatrixHead: document.getElementById('branchMatrixHead'),
    branchMatrixBody: document.getElementById('branchMatrixBody'),
    branchMatrixFoot: document.getElementById('branchMatrixFoot'),
    branchKtvMatrixCard: document.getElementById('branchKtvMatrixCard'),
    branchKtvMatrixTitle: document.getElementById('branchKtvMatrixTitle'),
    branchKtvMatrixHead: document.getElementById('branchKtvMatrixHead'),
    branchKtvMatrixBody: document.getElementById('branchKtvMatrixBody'),
    branchKtvMatrixFoot: document.getElementById('branchKtvMatrixFoot'),
    sessionCountBadge: document.getElementById('sessionCountBadge'),
    learnerDetailCard: document.getElementById('learnerDetailCard'),
    learnerDetailTitle: document.getElementById('learnerDetailTitle'),
    learnerDetailSubtitle: document.getElementById('learnerDetailSubtitle'),
    detailTotalSessions: document.getElementById('detailTotalSessions'),
    detailTotalSessionsSub: document.getElementById('detailTotalSessionsSub'),
    detailUniqueLabs: document.getElementById('detailUniqueLabs'),
    detailUniqueDevices: document.getElementById('detailUniqueDevices'),
    detailLastTime: document.getElementById('detailLastTime'),
    learnerHistoryBody: document.getElementById('learnerHistoryBody'),
    learnerHistoryMeta: document.getElementById('learnerHistoryMeta'),
    learnerDetailClose: document.getElementById('learnerDetailClose')
};

function parseDate(value) {
    if (!value) return new Date(0);
    if (value instanceof Date) return isNaN(value.getTime()) ? new Date(0) : value;
    const str = String(value).trim();
    if (str.includes('-')) {
        const parts = str.split('T')[0].split('-').map(Number);
        if (parts.length === 3 && !parts.some(isNaN)) {
            return new Date(parts[0], parts[1] - 1, parts[2]);
        }
    }
    if (str.includes('/')) {
        const parts = str.split('/');
        if (parts.length === 3) {
            if (parts[0].length === 4) {
                return new Date(Number(parts[0]), Number(parts[1]) - 1, Number(parts[2]));
            }
            return new Date(Number(parts[2]), Number(parts[1]) - 1, Number(parts[0]));
        }
    }
    const d = new Date(str);
    return isNaN(d.getTime()) ? new Date(0) : d;
}

function toDateKey(date) {
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
}

function getMonthBounds(monthValue) {
    const match = /^(\d{4})-(\d{2})$/.exec(monthValue || '');
    if (!match) return null;
    const year = Number(match[1]);
    const monthIndex = Number(match[2]) - 1;
    if (monthIndex < 0 || monthIndex > 11) return null;
    return {
        start: toDateKey(new Date(year, monthIndex, 1)),
        end: toDateKey(new Date(year, monthIndex + 1, 0)),
        year,
        monthIndex
    };
}

function isFullCalendarMonth(startValue, endValue) {
    if (!startValue || !endValue) return false;
    const start = parseDate(startValue);
    const end = parseDate(endValue);
    if (Number.isNaN(start.getTime()) || Number.isNaN(end.getTime())) return false;
    return start.getDate() === 1
        && start.getFullYear() === end.getFullYear()
        && start.getMonth() === end.getMonth()
        && end.getDate() === new Date(end.getFullYear(), end.getMonth() + 1, 0).getDate();
}

function formatDate(value) {
    if (!value) return 'Chưa chọn';
    return parseDate(value).toLocaleDateString('vi-VN');
}

function formatDateTime(dateValue, timeValue) {
    if (!dateValue) return 'Chưa chọn';
    const dateFormatted = parseDate(dateValue).toLocaleDateString('vi-VN');
    return timeValue ? `${dateFormatted} ${timeValue}` : dateFormatted;
}

function escapeHTML(value) {
    return String(value ?? '').replace(/[&<>"']/g, (char) => ({
        '&': '&amp;',
        '<': '&lt;',
        '>': '&gt;',
        '"': '&quot;',
        "'": '&#039;'
    }[char]));
}

function safeStorageGet(key) {
    try {
        return window.localStorage.getItem(key);
    } catch (error) {
        return null;
    }
}

function safeStorageSet(key, value) {
    try {
        window.localStorage.setItem(key, value);
    } catch (error) {
        // Storage có thể bị vô hiệu hóa bởi chính sách trình duyệt; giao diện vẫn hoạt động bình thường.
    }
}

function showToast(message, type = 'info', duration = 4200) {
    const region = document.getElementById('toastRegion');
    if (!region || !message) return;
    window.clearTimeout(activeToastTimer);
    region.setAttribute('aria-live', type === 'error' ? 'assertive' : 'polite');

    const toast = document.createElement('div');
    toast.className = `dashboard-toast is-${type}`;
    toast.setAttribute('role', type === 'error' ? 'alert' : 'status');
    const icon = document.createElement('span');
    icon.className = 'dashboard-toast-icon';
    icon.setAttribute('aria-hidden', 'true');
    icon.textContent = type === 'success' ? '✓' : (type === 'error' ? '!' : 'i');
    const copy = document.createElement('span');
    copy.className = 'dashboard-toast-copy';
    copy.textContent = message;
    const close = document.createElement('button');
    close.type = 'button';
    close.className = 'dashboard-toast-close';
    close.setAttribute('aria-label', 'Đóng thông báo');
    close.textContent = '×';
    close.addEventListener('click', () => toast.remove());
    toast.append(icon, copy, close);
    region.replaceChildren(toast);

    requestAnimationFrame(() => toast.classList.add('is-visible'));
    activeToastTimer = window.setTimeout(() => {
        toast.classList.remove('is-visible');
        window.setTimeout(() => toast.remove(), 180);
    }, duration);
}

function getFocusableElements(container) {
    if (!container) return [];
    return [...container.querySelectorAll(
        'a[href], button:not([disabled]), input:not([disabled]):not([type="hidden"]), select:not([disabled]), textarea:not([disabled]), [tabindex]:not([tabindex="-1"])'
    )].filter(element => !element.hidden && element.offsetParent !== null);
}

function trapDialogFocus(event, container) {
    if (event.key !== 'Tab' || !container) return;
    const focusable = getFocusableElements(container);
    if (!focusable.length) {
        event.preventDefault();
        container.focus();
        return;
    }
    const first = focusable[0];
    const last = focusable[focusable.length - 1];
    if (event.shiftKey && document.activeElement === first) {
        event.preventDefault();
        last.focus();
    } else if (!event.shiftKey && document.activeElement === last) {
        event.preventDefault();
        first.focus();
    }
}

function getStatusClass(status) {
    if (status === 'Đạt' || status === 'Hoàn thành') return 'status-done';
    if (status === 'Chưa đạt') return 'status-risk';
    if (status === 'Chưa có kết quả') return 'status-running';
    if (status === 'Không đánh giá') return 'status-ungraded';
    return 'status-notstarted';
}

function formatCompactList(values, limit = 2) {
    const sorted = [...values].sort((a, b) => a.localeCompare(b, 'vi'));
    const visible = sorted.slice(0, limit).join(', ');
    return sorted.length > limit ? `${visible} +${sorted.length - limit}` : visible;
}

function sessionTimestampMs(item) {
    const base = item?.date ? parseDate(item.date).getTime() : 0;
    return (Number.isFinite(base) ? base : 0) + (item?.time ? parseTimeMs(item.time) : 0);
}

function getLatestSession(rows) {
    return [...rows].sort((a, b) => sessionTimestampMs(b) - sessionTimestampMs(a))[0];
}

function getDateFilteredSessions() {
    return sessions.filter(item => {
        if (!item.date) return false;
        const date = parseDate(item.date);
        if (isNaN(date.getTime()) || date.getTime() === 0) return false;

        if (state.startDate) {
            const start = parseDate(state.startDate);
            start.setHours(0, 0, 0, 0);
            if (date < start) return false;
        }

        if (state.endDate) {
            const end = parseDate(state.endDate);
            end.setHours(23, 59, 59, 999);
            if (date > end) return false;
        }

        return true;
    });
}

function compareValues(a, b, direction) {
    const aVal = a ?? '';
    const bVal = b ?? '';
    let result;
    if (typeof aVal === 'number' && typeof bVal === 'number') {
        result = aVal - bVal;
    } else {
        result = String(aVal).localeCompare(String(bVal), 'vi');
    }
    return direction === 'asc' ? result : -result;
}

function sortRows(rows, sortState) {
    return [...rows].sort((a, b) => compareValues(a[sortState.key], b[sortState.key], sortState.direction));
}

function renderSortMarks() {
    document.querySelectorAll('.sort-button').forEach(button => {
        const table = button.dataset.table;
        const header = button.closest('th');
        if (table === 'realtime') {
            const mark = button.querySelector('.sort-mark');
            if (mark) mark.textContent = state.realtimeTimeSortDir === 'asc' ? '↑' : '↓';
            if (header) header.setAttribute('aria-sort', state.realtimeTimeSortDir === 'asc' ? 'ascending' : 'descending');
            return;
        }
        const sortState = state.sessionsSort;
        const mark = button.querySelector('.sort-mark');
        if (mark) {
            const isActive = sortState.key === button.dataset.key;
            mark.textContent = isActive ? (sortState.direction === 'asc' ? '↑' : '↓') : '↕';
            button.classList.toggle('is-sorted', isActive);
            if (header) header.setAttribute('aria-sort', isActive ? (sortState.direction === 'asc' ? 'ascending' : 'descending') : 'none');
        }
    });

    const timeMark = document.querySelector('#detailTimeSort .sort-mark');
    if (timeMark) timeMark.textContent = state.detailSortKey === 'time' ? (state.detailTimeSortDir === 'asc' ? '↑' : '↓') : '↕';
    document.getElementById('detailTimeSort')?.closest('th')?.setAttribute(
        'aria-sort',
        state.detailSortKey === 'time' ? (state.detailTimeSortDir === 'asc' ? 'ascending' : 'descending') : 'none'
    );
    const durMark = document.querySelector('#detailDurationSort .sort-mark');
    if (durMark) durMark.textContent = state.detailSortKey === 'duration' ? (state.detailDurationSortDir === 'asc' ? '↑' : '↓') : '↕';
    document.getElementById('detailDurationSort')?.closest('th')?.setAttribute(
        'aria-sort',
        state.detailSortKey === 'duration' ? (state.detailDurationSortDir === 'asc' ? 'ascending' : 'descending') : 'none'
    );
}

function getKpiComparisonPeriods() {
    if (state.startDate || state.endDate) {
        const currentStart = parseDate(state.startDate || state.endDate);
        const currentEnd = parseDate(state.endDate || state.startDate);

        if (isFullCalendarMonth(state.startDate, state.endDate)) {
            const year = currentStart.getFullYear();
            const month = currentStart.getMonth();
            const previousMonth = new Date(year, month - 1, 1);
            return {
                currentStart: state.startDate,
                currentEnd: state.endDate,
                previousStart: toDateKey(previousMonth),
                previousEnd: toDateKey(new Date(year, month, 0)),
                currentLabel: `Tháng ${String(month + 1).padStart(2, '0')}/${year}`,
                previousLabel: `tháng ${String(previousMonth.getMonth() + 1).padStart(2, '0')}/${previousMonth.getFullYear()}`
            };
        }

        const periodLengthMs = Math.max(0, currentEnd.getTime() - currentStart.getTime());
        const previousEnd = new Date(currentStart);
        previousEnd.setDate(previousEnd.getDate() - 1);
        const previousStart = new Date(previousEnd.getTime() - periodLengthMs);

        return {
            currentStart: toDateKey(currentStart),
            currentEnd: toDateKey(currentEnd),
            previousStart: toDateKey(previousStart),
            previousEnd: toDateKey(previousEnd),
            currentLabel: `${formatDate(currentStart)} - ${formatDate(currentEnd)}`,
            previousLabel: 'kỳ liền trước'
        };
    }

    const today = new Date();
    const year = today.getFullYear();
    const month = today.getMonth();
    return {
        currentStart: toDateKey(new Date(year, month, 1)),
        currentEnd: toDateKey(new Date(year, month + 1, 0)),
        previousStart: toDateKey(new Date(year, month - 1, 1)),
        previousEnd: toDateKey(new Date(year, month, 0)),
        currentLabel: `Tháng ${String(month + 1).padStart(2, '0')}/${year}`,
        previousLabel: 'tháng trước'
    };
}

const MIN_DURATION_SAMPLE_COUNT = 30;
const MIN_DURATION_COVERAGE_RATE = 10;

function mapReportMetrics(metric) {
    const practiceAttempts = Number(metric?.submitted_attempt_count ?? metric?.practice_attempts) || 0;
    const rateEligibleAttempts = Number(metric?.rate_eligible_attempt_count ?? metric?.graded_count) || 0;
    const passedEligibleAttempts = Number(metric?.passed_eligible_attempt_count ?? metric?.passed_count) || 0;
    const legacyIncompleteAttempts = Number(metric?.legacy_incomplete_attempt_count) || 0;
    const durationKnown = Number(metric?.duration_known_count) || 0;
    const durationCoverage = metric?.duration_coverage_rate === null || metric?.duration_coverage_rate === undefined
        ? (practiceAttempts ? Math.round((durationKnown / practiceAttempts) * 1000) / 10 : null)
        : Number(metric.duration_coverage_rate);
    const durationReliable = durationKnown >= MIN_DURATION_SAMPLE_COUNT
        && durationCoverage !== null
        && durationCoverage >= MIN_DURATION_COVERAGE_RATE;

    return {
        assigned: Number(metric?.assigned_count) || 0,
        graded: Number(metric?.graded_count) || 0,
        passed: Number(metric?.passed_count) || 0,
        submittedAttempts: practiceAttempts,
        rateEligibleAttempts,
        passedEligibleAttempts,
        legacyIncompleteAttempts,
        activityCompleted: Number(metric?.activity_completed_count) || 0,
        ungradedCompleted: Number(metric?.ungraded_completed_count) || 0,
        totalSessions: practiceAttempts,
        guideSessions: Number(metric?.guide_attempts) || 0,
        learners: Number(metric?.participating_technicians) || 0,
        completed: Number(metric?.completed_count) || 0,
        rate: metric?.completion_rate === null || metric?.completion_rate === undefined
            ? null
            : Number(metric.completion_rate),
        passRate: metric?.pass_rate === null || metric?.pass_rate === undefined
            ? null
            : Number(metric.pass_rate),
        firstTryRate: metric?.first_try_rate === null || metric?.first_try_rate === undefined
            ? null
            : Number(metric.first_try_rate),
        avgDuration: durationReliable && metric?.avg_duration_sec !== null && metric?.avg_duration_sec !== undefined
            ? Number(metric.avg_duration_sec)
            : null,
        durationKnown,
        durationAttempts: practiceAttempts,
        durationCoverage,
        durationReliable
    };
}

function dashboardReportMatchesSelectedPeriod() {
    const periods = getKpiComparisonPeriods();
    const reportPeriod = dashboardReport?.meta?.period;
    return reportPeriod?.from === periods.currentStart && reportPeriod?.to === periods.currentEnd;
}

function renderKpis() {
    const periods = getKpiComparisonPeriods();
    const definitions = [
        { key: 'totalSessions', valueId: 'kpiSessions', comparisonId: 'kpiSessionsComparison', contextId: 'kpiSessionsContext', type: 'count', unit: 'phiên' },
        { key: 'guideSessions', valueId: 'kpiGuideSessions', comparisonId: 'kpiGuideSessionsComparison', contextId: 'kpiGuideSessionsContext', type: 'count', unit: 'lượt' },
        { key: 'learners', valueId: 'kpiLearners', comparisonId: 'kpiLearnersComparison', contextId: 'kpiLearnersContext', type: 'count', unit: 'KTV' },
        { key: 'passRate', valueId: 'kpiPassRate', comparisonId: 'kpiPassRateComparison', contextId: 'kpiPassRateContext', type: 'rate', unit: '%' }
    ];

    const reportMatchesPeriod = dashboardReportMatchesSelectedPeriod();
    const authoritativeSummary = reportMatchesPeriod ? dashboardReport?.summary : null;
    if (!authoritativeSummary) {
        const message = state.dashboardReportStatus === 'loading'
            ? 'Đang tải dữ liệu báo cáo tổng hợp'
            : 'Không có dữ liệu báo cáo tổng hợp cho kỳ đã chọn';
        definitions.forEach(definition => {
            const valueElement = document.getElementById(definition.valueId);
            const comparisonElement = document.getElementById(definition.comparisonId);
            const contextElement = document.getElementById(definition.contextId);
            if (valueElement) valueElement.textContent = '—';
            if (comparisonElement) comparisonElement.replaceChildren();
            if (contextElement) contextElement.textContent = message;
        });
        renderDashboardDataNotice(null);
        return;
    }

    const currentMetrics = mapReportMetrics(authoritativeSummary.current);
    const previousMetrics = mapReportMetrics(authoritativeSummary.previous);
    const lifetimeMetrics = mapReportMetrics(authoritativeSummary.lifetime);

    const formatMetric = (value, definition) => {
        if (value === null || value === undefined) return '—';
        if (definition.type === 'rate') return `${value}%`;
        if (definition.type === 'duration') return formatDuration(value);
        return formatNumber.format(value);
    };

    const formatDecimal = value => Number(value).toLocaleString('vi-VN', { maximumFractionDigits: 1 });

    definitions.forEach(definition => {
        const currentValue = currentMetrics[definition.key];
        const previousValue = previousMetrics[definition.key];
        const lifetimeValue = lifetimeMetrics[definition.key];
        const comparable = currentValue !== null && previousValue !== null;
        const difference = comparable ? Math.round((currentValue - previousValue) * 10) / 10 : null;
        const valueElement = document.getElementById(definition.valueId);
        const comparisonElement = document.getElementById(definition.comparisonId);
        const contextElement = document.getElementById(definition.contextId);

        if (valueElement) valueElement.textContent = formatMetric(currentValue, definition);

        if (comparisonElement) {
            let comparisonClass = 'neutral';
            let changeText = 'Không đổi';
            let arrow = '•';

            if (difference === null) {
                changeText = 'Chưa đủ mẫu số';
            } else if (difference !== 0) {
                comparisonClass = difference > 0 ? 'positive' : 'negative';
                arrow = difference > 0 ? '↑' : '↓';

                if (definition.type === 'rate') {
                    changeText = `${formatDecimal(Math.abs(difference))} điểm %`;
                } else if (definition.type === 'duration') {
                    changeText = formatDuration(Math.abs(difference));
                } else {
                    if (previousValue === 0) {
                        changeText = `${formatNumber.format(Math.abs(difference))} (kỳ trước: 0)`;
                    } else {
                        const percentChange = Math.round((difference / previousValue) * 100);
                        changeText = `${formatNumber.format(Math.abs(difference))} (${percentChange > 0 ? '+' : ''}${percentChange}%)`;
                    }
                }
            }

            comparisonElement.className = `kpi-comparison ${comparisonClass}`;
            comparisonElement.innerHTML = `
                <span class="kpi-delta">${arrow} ${changeText}</span>
                <span class="kpi-comparison-label">so với ${periods.previousLabel}</span>
            `;
        }

        if (contextElement) {
            if (definition.key === 'passRate') {
                contextElement.textContent = `${periods.currentLabel} • ${formatNumber.format(currentMetrics.passedEligibleAttempts)}/${formatNumber.format(currentMetrics.rateEligibleAttempts)} lượt đủ dữ liệu đạt`;
            } else if (definition.key === 'totalSessions') {
                contextElement.textContent = `${periods.currentLabel} • ${formatNumber.format(currentMetrics.rateEligibleAttempts)} đủ dữ liệu đánh giá • ${formatNumber.format(currentMetrics.legacyIncompleteAttempts)} thiếu chuỗi lịch sử`;
            } else {
                contextElement.textContent = `${periods.currentLabel} • Lũy kế ${formatMetric(lifetimeValue, definition)}${definition.type === 'count' ? ` ${definition.unit}` : ''}`;
            }
        }
    });

    renderDashboardDataNotice(currentMetrics);
}

function renderDashboardDataNotice(currentMetrics) {
    const notice = document.getElementById('dashboardDataNotice');
    if (!notice) return;

    const messages = [];
    if (state.dashboardReportStatus === 'stale') {
        messages.push('Báo cáo tổng hợp chưa cập nhật được; hệ thống đang giữ bản dữ liệu thành công gần nhất.');
    } else if (state.dashboardReportStatus === 'unavailable') {
        messages.push('Không tải được báo cáo tổng hợp; các chỉ số được để trống để tránh hiển thị sai nghiệp vụ.');
    }
    const unassignedRegions = currentMetrics ? (dashboardReport?.matrix?.rows || []).filter(row => {
        const region = row?.region || {};
        return !region.region_id || ['UNASSIGNED', 'FTC'].includes(String(region.code || region.region_code || '').toUpperCase());
    }) : [];
    const unassignedPopulationPairs = unassignedRegions.reduce(
        (sum, row) => sum + Number(row?.total?.population_count || 0),
        0
    );
    if (unassignedPopulationPairs > 0) {
        messages.push(`${formatNumber.format(unassignedPopulationPairs)} cặp KTV–bài chưa có khu vực đang được tạm gom vào “FTC”; khi KTV được cập nhật đơn vị, báo cáo sẽ tự chuyển sang khu vực tương ứng.`);
    }
    if (currentMetrics && currentMetrics.ungradedCompleted > 0) {
        messages.push(`${formatNumber.format(currentMetrics.ungradedCompleted)} lượt thực hành đã hoàn thành thao tác nhưng chưa có kết quả đánh giá; các lượt này chưa được tính là đạt chuẩn.`);
    }
    const incompleteAttempts = Number(dashboardReport?.matrix?.data_quality?.legacy_incomplete_attempt_count ?? dashboardReport?.matrix?.data_quality?.incomplete_attempt_count) || 0;
    if (incompleteAttempts > 0) {
        messages.push(`${formatNumber.format(incompleteAttempts)} lượt lịch sử thiếu chuỗi lần làm không được dùng để tính tỷ lệ phiên đạt; lượt có kết quả đạt vẫn được giữ làm bằng chứng hoàn thành bài.`);
    }

    notice.hidden = messages.length === 0;
    notice.replaceChildren();
    if (!messages.length) return;

    const icon = document.createElement('span');
    icon.className = 'dashboard-data-notice-icon';
    icon.setAttribute('aria-hidden', 'true');
    icon.textContent = '!';
    const content = document.createElement('div');
    const title = document.createElement('strong');
    title.textContent = state.dashboardReportStatus === 'ready'
        ? 'Cần hoàn thiện dữ liệu trước khi dùng báo cáo chính thức'
        : 'Trạng thái dữ liệu báo cáo';
    const list = document.createElement('ul');
    messages.forEach(message => {
        const item = document.createElement('li');
        item.textContent = message;
        list.appendChild(item);
    });
    content.append(title, list);
    notice.append(icon, content);
}

function buildLearnerSummaries(rows) {
    const map = new Map();
    rows.forEach(item => {
        if (!map.has(item.learner)) {
            map.set(item.learner, {
                learner: item.learner,
                rows: [],
                devices: new Set(),
                labs: new Set(),
                modes: new Set()
            });
        }
        const summary = map.get(item.learner);
        summary.rows.push(item);
        summary.devices.add(item.device);
        summary.labs.add(item.lab);
        if (item.mode) summary.modes.add(item.mode);
    });

    return [...map.values()].map(item => {
        const latest = getLatestSession(item.rows);
        const practiceRows = item.rows.filter(row => row.mode === 'Thực hành' || row.mode === 'practice');
        const rateEligibleRows = practiceRows.filter(hasCompleteAttemptEvidence);
        const completed = rateEligibleRows.filter(isSuccessfulSession).length;
        const modesArray = [...item.modes];
        const primaryMode = modesArray.length === 1 ? modesArray[0] : (latest?.mode || 'Thực hành');
        return {
            learner: item.learner,
            region: item.rows[0]?.region || getLearnerRegion(item.learner),
            total: item.rows.length,
            devicesCount: item.devices.size,
            labsCount: item.labs.size,
            devicesLabel: formatCompactList(item.devices),
            labsLabel: formatCompactList(item.labs),
            mode: primaryMode,
            modesLabel: formatCompactList(item.modes.size ? item.modes : new Set(['Thực hành'])),
            status: latest?.status || 'N/A',
            lastDate: latest?.date || '',
            lastTime: latest?.time || '',
            lastDateTimeMs: latest ? sessionTimestampMs(latest) : 0,
            lastDateTimeFormatted: formatDateTime(latest?.date, latest?.time),
            lastAction: latest?.lastAction || 'N/A',
            latestDuration: latest?.duration ?? null,
            passRate: rateEligibleRows.length ? Math.round((completed / rateEligibleRows.length) * 100) : null
        };
    });
}

function renderSessions(rows) {
    let filteredRows = rows.filter(item => (
        state.learnerSelectedKtvs.has(item.learner)
        && state.learnerSelectedEmails.has(item.learner)
        && state.learnerSelectedDevices.has(item.device)
        && state.learnerSelectedLabs.has(item.lab)
        && state.learnerSelectedRegions.has(item.region)
    ));
    const learnerKeyword = state.learnerSearchKtv.trim().toLocaleLowerCase('vi');
    if (learnerKeyword) {
        filteredRows = filteredRows.filter(item => {
            const haystack = `${item.learner} ${getLearnerName(item.learner)}`.toLocaleLowerCase('vi');
            return haystack.includes(learnerKeyword);
        });
    }

    const summaries = buildLearnerSummaries(filteredRows);
    const sorted = sortRows(summaries, state.sessionsSort);

    if (els.sessionCountBadge) els.sessionCountBadge.textContent = `${summaries.length} KTV / ${filteredRows.length} phiên`;

    if (!sorted.length) {
        if (els.sessionsBody) els.sessionsBody.innerHTML = '<tr><td colspan="7" class="empty">Không có KTV phù hợp với bộ lọc.</td></tr>';
        if (els.learnerTableMeta) els.learnerTableMeta.innerHTML = '';
        return;
    }
    const pageData = getPageSlice(sorted, state.learnerTablePage, LEARNER_TABLE_PAGE_SIZE);
    state.learnerTablePage = pageData.currentPage;
    if (els.sessionsBody) {
        els.sessionsBody.innerHTML = pageData.rows.map(item => `
            <tr class="clickable-row ${state.selectedLearner === item.learner ? 'active' : ''}">
                <td>
                    <button type="button" class="learner-link" data-open-learner data-learner="${escapeHTML(item.learner)}" title="Mở chi tiết ${escapeHTML(item.learner)}">${escapeHTML(getLearnerName(item.learner))}</button>
                    <div class="item-sub">${item.passRate === null ? 'Chưa có phiên thực hành' : `${item.passRate}% phiên thực hành đạt`}</div>
                </td>
                <td>${escapeHTML(item.learner)}</td>
                <td>${escapeHTML(item.region)}</td>
                <td><strong>${item.total}</strong></td>
                <td>${escapeHTML(item.devicesLabel)}</td>
                <td>${escapeHTML(item.labsLabel)}</td>
                <td>
                    <div><strong>${escapeHTML(item.lastDateTimeFormatted)}</strong></div>
                    <div class="item-sub">Thời gian phiên gần nhất: ${formatDuration(item.latestDuration)}</div>
                </td>
            </tr>
        `).join('');
        els.sessionsBody.querySelectorAll('[data-open-learner]').forEach(button => {
            const openLearner = () => {
                const nextLearner = button.getAttribute('data-learner');
                if (state.selectedLearner !== nextLearner) resetLearnerDetailFilters();
                learnerDetailReturnIdentity = nextLearner;
                state.selectedLearner = nextLearner;
                renderAll();
            };
            button.addEventListener('click', openLearner);
        });
    }
    renderLearnerTableMeta(pageData);
}

function getPageSlice(rows, page, pageSize) {
    const totalPages = Math.max(1, Math.ceil(rows.length / pageSize));
    const currentPage = Math.min(Math.max(1, page), totalPages);
    const start = (currentPage - 1) * pageSize;
    const end = Math.min(start + pageSize, rows.length);
    return {
        rows: rows.slice(start, end),
        currentPage,
        totalPages,
        totalRows: rows.length,
        start,
        end
    };
}

function renderLearnerTableMeta(pageData) {
    if (!els.learnerTableMeta) return;
    if (!pageData.totalRows) {
        els.learnerTableMeta.innerHTML = '';
        return;
    }
    els.learnerTableMeta.innerHTML = `
        <span>Hiển thị ${pageData.start + 1}-${pageData.end} / ${pageData.totalRows} KTV</span>
        <span class="table-page-controls">
            <button type="button" class="table-page-btn" data-learner-table-page="prev" ${pageData.currentPage <= 1 ? 'disabled' : ''}>Trước</button>
            <span>Trang ${pageData.currentPage}/${pageData.totalPages}</span>
            <button type="button" class="table-page-btn" data-learner-table-page="next" ${pageData.currentPage >= pageData.totalPages ? 'disabled' : ''}>Sau</button>
        </span>
    `;
    els.learnerTableMeta.querySelectorAll('[data-learner-table-page]').forEach(button => {
        button.addEventListener('click', (event) => {
            event.stopPropagation();
            const action = button.dataset.learnerTablePage;
            state.learnerTablePage += action === 'next' ? 1 : -1;
            renderAll();
        });
    });
}

function renderLearnerHistoryMeta(pageData, totalHistoryRows = pageData.totalRows) {
    if (!els.learnerHistoryMeta) return;
    if (!totalHistoryRows) {
        els.learnerHistoryMeta.innerHTML = '';
        return;
    }

    const isFiltered = pageData.totalRows !== totalHistoryRows;
    const rangeText = pageData.totalRows
        ? `Dòng ${pageData.start + 1}-${pageData.end}`
        : '';
    const summaryText = isFiltered
        ? `Đang hiển thị ${pageData.totalRows}/${totalHistoryRows} phiên theo bộ lọc${rangeText ? ` • ${rangeText}` : ''}`
        : `Hiển thị ${pageData.start + 1}-${pageData.end} / ${pageData.totalRows} phiên`;
    const pagination = pageData.totalRows ? `
        <span class="table-page-controls">
            <button type="button" class="table-page-btn" data-learner-page="prev" ${pageData.currentPage <= 1 ? 'disabled' : ''}>Trước</button>
            <span>Trang ${pageData.currentPage}/${pageData.totalPages}</span>
            <button type="button" class="table-page-btn" data-learner-page="next" ${pageData.currentPage >= pageData.totalPages ? 'disabled' : ''}>Sau</button>
        </span>
    ` : '';
    els.learnerHistoryMeta.innerHTML = `
        <span>${summaryText}</span>
        ${pagination}
    `;
    els.learnerHistoryMeta.querySelectorAll('[data-learner-page]').forEach(button => {
        button.addEventListener('click', (event) => {
            event.stopPropagation();
            const action = button.dataset.learnerPage;
            state.learnerDetailPage += action === 'next' ? 1 : -1;
            renderAll();
        });
    });
}

function hideLearnerDetail() {
    const returnIdentity = state.selectedLearner || learnerDetailReturnIdentity;
    state.selectedLearner = '';
    state.learnerDetailPage = 1;
    document.body.classList.remove('detail-open');
    els.learnerDetailCard?.classList.remove('visible');
    els.learnerDetailCard?.setAttribute('aria-hidden', 'true');
    state.currentLearnerRows = null;
    document.getElementById('learnerDeviceDonut')?.replaceChildren();
    document.getElementById('learnerDeviceLegend')?.replaceChildren();
    learnerDetailReturnIdentity = '';
    if (returnIdentity) {
        window.requestAnimationFrame(() => {
            [...(els.sessionsBody?.querySelectorAll('[data-open-learner]') || [])]
                .find(button => button.dataset.learner === returnIdentity)
                ?.focus({ preventScroll: true });
        });
    }
}

function renderOverviewMonthlyTrend(rows) {
    const card = document.getElementById('overviewMonthlyCard');
    const container = document.getElementById('overviewMonthlyTrend');
    const summary = document.getElementById('overviewMonthlySummary');
    const scope = document.getElementById('overviewMonthlyScope');
    const trigger = document.getElementById('overviewSessionsDrilldown');
    if (!container || !card) return;

    card.hidden = !state.overviewMonthlyExpanded;
    trigger?.setAttribute('aria-expanded', String(state.overviewMonthlyExpanded));
    if (!state.overviewMonthlyExpanded) return;

    container.classList.remove('is-empty');

    const selectedDate = state.startDate ? parseDate(state.startDate) : now;
    const selectedKey = `${selectedDate.getFullYear()}-${selectedDate.getMonth()}`;
    const reportYear = state.regionUsageYear || selectedDate.getFullYear();
    const today = new Date();
    const selectedRegion = state.overviewSelectedRegion;
    const availableRegions = new Set(getRegionUsageSeries(reportYear).map(item => item.region));
    if (selectedRegion && !availableRegions.has(selectedRegion)) state.overviewSelectedRegion = '';
    const effectiveRegion = state.overviewSelectedRegion;
    if (scope) scope.textContent = effectiveRegion || 'Tất cả khu vực';

    const monthlySessions = new Map();
    const monthlyPassedSessions = new Map();
    const monthlyEligibleSessions = new Map();
    const monthlyIncompleteSessions = new Map();
    rows.forEach(session => {
        const date = parseDate(session.date);
        if (date.getTime() <= 0 || date.getFullYear() !== reportYear) return;
        if (session.mode !== 'Thực hành' && session.mode !== 'practice') return;
        if (effectiveRegion && getLearnerRegion(session.learner) !== effectiveRegion) return;
        const monthIndex = date.getMonth();
        monthlySessions.set(monthIndex, (monthlySessions.get(monthIndex) || 0) + 1);
        if (isRateEligiblePracticeSession(session)) {
            monthlyEligibleSessions.set(monthIndex, (monthlyEligibleSessions.get(monthIndex) || 0) + 1);
        } else if (!hasCompleteAttemptEvidence(session)) {
            monthlyIncompleteSessions.set(monthIndex, (monthlyIncompleteSessions.get(monthIndex) || 0) + 1);
        }
        if (isRateEligiblePracticeSession(session) && isSuccessfulSession(session)) {
            monthlyPassedSessions.set(monthIndex, (monthlyPassedSessions.get(monthIndex) || 0) + 1);
        }
    });

    const periods = Array.from({ length: 12 }, (_, index) => {
        const date = new Date(reportYear, index, 1);
        return {
            date,
            key: `${date.getFullYear()}-${date.getMonth()}`,
            label: `${String(date.getMonth() + 1).padStart(2, '0')}/${date.getFullYear()}`,
            shortLabel: `T${String(date.getMonth() + 1).padStart(2, '0')}`,
            isFuture: date > new Date(today.getFullYear(), today.getMonth(), 1),
            totalSessions: monthlySessions.get(index) || 0,
            eligibleSessions: monthlyEligibleSessions.get(index) || 0,
            incompleteSessions: monthlyIncompleteSessions.get(index) || 0,
            passedSessions: monthlyPassedSessions.get(index) || 0
        };
    });

    if (periods.every(period => period.totalSessions === 0)) {
        container.classList.add('is-empty');
        container.innerHTML = `<div class="empty">Không có lượt thực hành của ${escapeHTML(effectiveRegion || 'toàn hệ thống')} trong năm ${reportYear}.</div>`;
        if (summary) summary.innerHTML = '';
        return;
    }

    const maxSessions = Math.max(...periods.map(period => period.totalSessions), 1);
    container.innerHTML = periods.map(period => {
        const height = period.totalSessions ? Math.max(12, Math.round((period.totalSessions / maxSessions) * 100)) : 0;
        const isSelected = period.key === selectedKey;
        return `
            <div class="ktv-month-column ${isSelected ? 'selected' : ''} ${period.isFuture ? 'future' : ''}" title="${period.label}: ${period.totalSessions} lượt phát sinh, ${period.eligibleSessions} lượt đủ dữ liệu, ${period.incompleteSessions} lượt thiếu lịch sử, ${period.passedSessions} lượt đủ dữ liệu đạt">
                <strong>${period.totalSessions}</strong>
                <div class="ktv-month-bar-track">
                    <div class="ktv-month-bar" style="height: ${height}%;"></div>
                </div>
                <span class="ktv-month-label">${period.shortLabel}</span>
                <span class="ktv-month-rate">${period.eligibleSessions} đủ dữ liệu</span>
            </div>
        `;
    }).join('');

    const matchedIndex = periods.findIndex(period => period.key === selectedKey);
    const selectedIndex = matchedIndex >= 0 ? matchedIndex : periods.length - 1;
    const currentPeriod = periods[selectedIndex] || periods[Math.min(today.getMonth(), periods.length - 1)];
    let previousPeriod = periods[selectedIndex - 1];
    if (!previousPeriod) {
        const previousDate = new Date(reportYear, 0, 1);
        previousDate.setMonth(previousDate.getMonth() - 1);
        const previousSessions = rows.filter(session => {
            const date = parseDate(session.date);
            return date.getFullYear() === previousDate.getFullYear()
                && date.getMonth() === previousDate.getMonth()
                && isPracticeSession(session)
                && (!effectiveRegion || getLearnerRegion(session.learner) === effectiveRegion);
        });
        previousPeriod = {
            totalSessions: previousSessions.length,
            eligibleSessions: previousSessions.filter(isRateEligiblePracticeSession).length,
            incompleteSessions: previousSessions.filter(session => !hasCompleteAttemptEvidence(session)).length,
            passedSessions: previousSessions.filter(session => isRateEligiblePracticeSession(session) && isSuccessfulSession(session)).length
        };
    }
    const difference = currentPeriod.totalSessions - previousPeriod.totalSessions;
    const changeClass = difference > 0 ? 'positive' : (difference < 0 ? 'negative' : 'neutral');
    const changeText = difference === 0 ? 'Không đổi' : `${difference > 0 ? '↑' : '↓'} ${Math.abs(difference)} lượt`;
    if (summary) {
        summary.className = `ktv-monthly-summary ${changeClass}`;
        summary.innerHTML = `
            <strong>${currentPeriod.label}</strong>
            <span>${changeText} so với tháng trước · ${currentPeriod.eligibleSessions} đủ dữ liệu · ${currentPeriod.incompleteSessions} thiếu lịch sử</span>
        `;
    }
}

function renderLearnerDetail(rows) {
    if (!state.selectedLearner) {
        els.learnerDetailCard?.classList.remove('visible');
        els.learnerDetailCard?.setAttribute('aria-hidden', 'true');
        document.body.classList.remove('detail-open');
        if (els.learnerHistoryMeta) els.learnerHistoryMeta.innerHTML = '';
        return;
    }

    const wasVisible = els.learnerDetailCard?.classList.contains('visible');
    const allLearnerRows = rows.filter(item => item.learner === state.selectedLearner);

    if (!allLearnerRows.length) {
        els.learnerDetailCard?.classList.remove('visible');
        els.learnerDetailCard?.setAttribute('aria-hidden', 'true');
        document.body.classList.remove('detail-open');
        if (els.learnerHistoryMeta) els.learnerHistoryMeta.innerHTML = '';
        return;
    }

    const ktvDevices = [...new Set(allLearnerRows.map(item => item.device))].sort();
    if (state.detailSelectedDevices.size === 0 && !state.detailDevicesTouched) {
        state.detailSelectedDevices = new Set(ktvDevices);
    }
    populatePopoverOptions('detailDeviceOptions', ktvDevices, state.detailSelectedDevices, () => { state.detailDevicesTouched = true; }, state.detailSearchDevice);

    const ktvLabs = [...new Set(allLearnerRows.map(item => item.lab))].sort((a, b) => a.localeCompare(b, 'vi'));
    if (state.detailSelectedLabs.size === 0 && !state.detailLabsTouched) {
        state.detailSelectedLabs = new Set(ktvLabs);
    }
    populatePopoverOptions('detailLabOptions', ktvLabs, state.detailSelectedLabs, () => { state.detailLabsTouched = true; }, state.detailSearchLab);

    let filteredHistory = [...allLearnerRows];
    filteredHistory = filteredHistory.filter(item => state.detailSelectedModes.has(item.mode || 'Thực hành'));
    filteredHistory = filteredHistory.filter(item => state.detailSelectedDevices.has(item.device));
    filteredHistory = filteredHistory.filter(item => state.detailSelectedLabs.has(item.lab));
    filteredHistory = filteredHistory.filter(item => state.detailSelectedStatuses.has(item.status));

    if (state.detailSortKey === 'duration') {
        filteredHistory.sort((a, b) => {
            const durA = Number(a.duration) || 0;
            const durB = Number(b.duration) || 0;
            return state.detailDurationSortDir === 'asc' ? durA - durB : durB - durA;
        });
    } else {
        filteredHistory.sort((a, b) => {
            const timeA = parseDate(a.date).getTime() + (a.time ? parseTimeMs(a.time) : 0);
            const timeB = parseDate(b.date).getTime() + (b.time ? parseTimeMs(b.time) : 0);
            return state.detailTimeSortDir === 'asc' ? timeA - timeB : timeB - timeA;
        });
    }

    const normalizeAssignmentPart = value => String(value || '').trim().toLocaleLowerCase('vi');
    const assignmentKey = (device, lab) => `${normalizeAssignmentPart(device)}\u001f${normalizeAssignmentPart(lab)}`;
    const learnerAssignments = trainingAssignments.filter(item => item.learner === state.selectedLearner);
    const assignedLabKeys = new Set(learnerAssignments.map(item => assignmentKey(item.device, item.lab)));
    const assignedDevices = new Set(learnerAssignments.map(item => normalizeAssignmentPart(item.device)).filter(Boolean));
    const assignedPracticeRows = allLearnerRows.filter(item =>
        item.mode === 'Thực hành' && assignedLabKeys.has(assignmentKey(item.device, item.lab))
    );
    const practicedAssignedLabs = new Set(assignedPracticeRows.map(item => assignmentKey(item.device, item.lab)));
    const practicedAssignedDevices = new Set(assignedPracticeRows.map(item => normalizeAssignmentPart(item.device)).filter(Boolean));
    const latest = getLatestSession(allLearnerRows);

    const guideSessionsCount = allLearnerRows.filter(item => item.mode === 'Hướng dẫn').length;
    const practiceSessionsCount = allLearnerRows.filter(item => item.mode === 'Thực hành').length;

    if (els.learnerDetailTitle) els.learnerDetailTitle.textContent = getLearnerName(state.selectedLearner);
    if (els.learnerDetailSubtitle) els.learnerDetailSubtitle.textContent = `${allLearnerRows[0]?.region || getLearnerRegion(state.selectedLearner)} • ${state.selectedLearner} • ${allLearnerRows.length} phiên hoạt động trong toàn bộ lịch sử.`;
    if (els.detailTotalSessions) els.detailTotalSessions.textContent = allLearnerRows.length;
    if (els.detailTotalSessionsSub) {
        els.detailTotalSessionsSub.innerHTML = `
            <div>${practiceSessionsCount} Thực hành</div>
            <div>${guideSessionsCount} Hướng dẫn</div>
        `;
    }
    if (els.detailUniqueLabs) {
        els.detailUniqueLabs.textContent = state.assignmentsLoaded
            ? `${practicedAssignedLabs.size} / ${assignedLabKeys.size}`
            : '— / —';
    }
    if (els.detailUniqueDevices) {
        els.detailUniqueDevices.textContent = state.assignmentsLoaded
            ? `${practicedAssignedDevices.size} / ${assignedDevices.size}`
            : '— / —';
    }
    if (els.detailLastTime) els.detailLastTime.textContent = latest ? formatDateTime(latest.date, latest.time) : 'N/A';
    renderDeviceDonutChart(allLearnerRows);
    renderHourlyBarChart(allLearnerRows);

    // Đánh số thứ tự lượt thực hành theo trình tự thời gian cho từng bài lab
    const attemptCounters = new Map();
    const sortedChronological = [...allLearnerRows].sort((a, b) => {
        return (a.startedAtMs || 0) - (b.startedAtMs || 0)
            || String(a.sessionId || '').localeCompare(String(b.sessionId || ''));
    });
    sortedChronological.forEach(s => {
        if (s.mode !== 'Thực hành') return;
        const key = `${s.device}\u001f${s.lab}`;
        const count = (attemptCounters.get(key) || 0) + 1;
        attemptCounters.set(key, count);
        s._attemptNumber = Number(s.practiceAttemptNo) || count;
    });

    const pageData = getPageSlice(filteredHistory, state.learnerDetailPage, LEARNER_HISTORY_PAGE_SIZE);
    state.learnerDetailPage = pageData.currentPage;
    if (els.learnerHistoryBody) {
        if (!pageData.rows.length) {
            els.learnerHistoryBody.innerHTML = '<tr><td colspan="6" class="empty">Không có phiên phù hợp với bộ lọc trong nhật ký.</td></tr>';
        } else {
            els.learnerHistoryBody.innerHTML = pageData.rows.map(item => `
                <tr>
                    <td>
                        <div><strong>${escapeHTML(formatDateTime(item.date, item.time))}</strong></div>
                    </td>
                    <td><span class="mode-pill ${item.mode === 'Hướng dẫn' ? 'mode-guide' : 'mode-practice'}">${escapeHTML(item.mode || 'Thực hành')}</span></td>
                    <td>${escapeHTML(item.device)}</td>
                    <td>
                        <div>${escapeHTML(item.lab)}</div>
                        <div style="font-size: 11px; color: var(--muted); margin-top: 2px;">${item.mode === 'Thực hành' ? `Lần thực hành ${item._attemptNumber || item.practiceAttemptNo || 1}` : 'Lượt hướng dẫn'}</div>
                    </td>
                    <td><span class="status-pill ${getStatusClass(item.status)}">${escapeHTML(item.status)}</span></td>
                    <td>${formatDuration(item.duration)}</td>
                </tr>
            `).join('');
        }
    }
    renderLearnerHistoryMeta(pageData, allLearnerRows.length);
    els.learnerDetailCard?.classList.add('visible');
    els.learnerDetailCard?.setAttribute('aria-hidden', 'false');
    document.body.classList.add('detail-open');
    if (!wasVisible) window.requestAnimationFrame(() => els.learnerDetailClose?.focus());
}

function sameDay(a, b) {
    return a && b && toDateKey(a) === toDateKey(b);
}

function renderHourlyCalendar() {
    const monthSelect = document.getElementById('hourlyMonthSelect');
    const yearSelect = document.getElementById('hourlyYearSelect');
    const startText = document.getElementById('hourlyStartText');
    const endText = document.getElementById('hourlyEndText');
    const daysContainer = document.getElementById('hourlyDays');
    if (!daysContainer) return;

    if (monthSelect && !monthSelect.children.length) {
        monthSelect.innerHTML = Array.from({ length: 12 }, (_, index) => `<option value="${index}">Tháng ${index + 1}</option>`).join('');
    }
    if (yearSelect && !yearSelect.children.length) {
        const y = new Date().getFullYear();
        yearSelect.innerHTML = [y - 1, y, y + 1].map(year => `<option value="${year}">${year}</option>`).join('');
    }

    const month = state.hourlyCalendarMonth.getMonth();
    const year = state.hourlyCalendarMonth.getFullYear();

    if (monthSelect) monthSelect.value = month;
    if (yearSelect) yearSelect.value = year;
    if (startText) startText.textContent = formatDate(state.hourlyTempStartDate);
    if (endText) endText.textContent = formatDate(state.hourlyTempEndDate);

    const firstOfMonth = new Date(year, month, 1);
    const mondayOffset = (firstOfMonth.getDay() + 6) % 7;
    const gridStart = new Date(year, month, 1 - mondayOffset);
    const todayKey = fmtDate(new Date());
    const focusKey = state.hourlyCalendarFocusDate || todayKey;
    const days = [];
    for (let i = 0; i < 42; i += 1) {
        const day = new Date(gridStart);
        day.setDate(gridStart.getDate() + i);
        const key = toDateKey(day);
        const selectedStart = state.hourlyTempStartDate ? parseDate(state.hourlyTempStartDate) : null;
        const selectedEnd = state.hourlyTempEndDate ? parseDate(state.hourlyTempEndDate) : null;
        const inRange = selectedStart && selectedEnd && day >= selectedStart && day <= selectedEnd;
        const isSelected = sameDay(day, selectedStart) || sameDay(day, selectedEnd);
        const fullDateLabel = day.toLocaleDateString('vi-VN', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' });
        days.push(`
            <button type="button" role="gridcell" class="date-day ${day.getMonth() !== month ? 'outside' : ''} ${inRange ? 'in-range' : ''} ${isSelected ? 'selected' : ''}" data-hourly-date="${key}"
                tabindex="${key === focusKey ? '0' : '-1'}" aria-label="${escapeHTML(fullDateLabel)}" aria-selected="${isSelected ? 'true' : 'false'}" ${key === todayKey ? 'aria-current="date"' : ''}>
                ${day.getDate()}
            </button>
        `);
    }
    daysContainer.innerHTML = days.join('');
    daysContainer.querySelectorAll('[data-hourly-date]').forEach(button => {
        button.addEventListener('click', (e) => {
            e.stopPropagation();
            const selected = button.dataset.hourlyDate;
            if (!state.hourlyTempStartDate || (state.hourlyTempStartDate && state.hourlyTempEndDate)) {
                state.hourlyTempStartDate = selected;
                state.hourlyTempEndDate = '';
            } else if (parseDate(selected) < parseDate(state.hourlyTempStartDate)) {
                state.hourlyTempEndDate = state.hourlyTempStartDate;
                state.hourlyTempStartDate = selected;
            } else {
                state.hourlyTempEndDate = selected;
            }
            state.hourlyCalendarFocusDate = selected;
            renderHourlyCalendar();
            document.querySelector(`[data-hourly-date="${selected}"]`)?.focus();
        });
        button.addEventListener('keydown', event => {
            const offsets = { ArrowLeft: -1, ArrowRight: 1, ArrowUp: -7, ArrowDown: 7 };
            let nextDate = parseDate(button.dataset.hourlyDate);
            if (Object.hasOwn(offsets, event.key)) {
                nextDate.setDate(nextDate.getDate() + offsets[event.key]);
            } else if (event.key === 'PageUp' || event.key === 'PageDown') {
                nextDate.setMonth(nextDate.getMonth() + (event.key === 'PageUp' ? -1 : 1));
            } else if (event.key === 'Home' || event.key === 'End') {
                const weekday = (nextDate.getDay() + 6) % 7;
                nextDate.setDate(nextDate.getDate() + (event.key === 'Home' ? -weekday : 6 - weekday));
            } else {
                return;
            }
            event.preventDefault();
            const nextKey = fmtDate(nextDate);
            state.hourlyCalendarFocusDate = nextKey;
            state.hourlyCalendarMonth = new Date(nextDate.getFullYear(), nextDate.getMonth(), 1);
            renderHourlyCalendar();
            document.querySelector(`[data-hourly-date="${nextKey}"]`)?.focus();
        });
    });
}

function initHourlyDatePicker() {
    const picker = document.getElementById('hourlyDatePicker');
    const trigger = document.getElementById('hourlyDateTrigger');
    const panel = document.getElementById('hourlyDatePanel');
    const prevMonth = document.getElementById('hourlyPrevMonth');
    const nextMonth = document.getElementById('hourlyNextMonth');
    const monthSelect = document.getElementById('hourlyMonthSelect');
    const yearSelect = document.getElementById('hourlyYearSelect');
    const applyBtn = document.getElementById('hourlyApplyDate');
    const clearBtn = document.getElementById('hourlyClearDate');

    const closeHourlyPanel = ({ restoreFocus = false } = {}) => {
        picker?.classList.remove('open');
        trigger?.setAttribute('aria-expanded', 'false');
        if (restoreFocus) trigger?.focus();
    };

    renderHourlyCalendar();

    trigger?.addEventListener('click', (e) => {
        e.stopPropagation();
        state.hourlyTempStartDate = state.hourlyStartDate;
        state.hourlyTempEndDate = state.hourlyEndDate;
        state.hourlyCalendarFocusDate = state.hourlyStartDate || fmtDate(new Date());
        renderHourlyCalendar();
        const willOpen = !picker?.classList.contains('open');
        picker?.classList.toggle('open', willOpen);
        trigger.setAttribute('aria-expanded', String(willOpen));
        if (willOpen) {
            window.requestAnimationFrame(() => {
                const focusDay = document.querySelector(`[data-hourly-date="${state.hourlyCalendarFocusDate}"]`);
                if (focusDay) focusDay.focus();
                else panel?.focus();
            });
        }
    });

    panel?.addEventListener('click', (e) => e.stopPropagation());
    panel?.addEventListener('keydown', event => {
        if (event.key === 'Escape') {
            event.preventDefault();
            event.stopPropagation();
            closeHourlyPanel({ restoreFocus: true });
            return;
        }
        trapDialogFocus(event, panel);
    });

    prevMonth?.addEventListener('click', (e) => {
        e.stopPropagation();
        state.hourlyCalendarMonth.setMonth(state.hourlyCalendarMonth.getMonth() - 1);
        state.hourlyCalendarFocusDate = fmtDate(state.hourlyCalendarMonth);
        renderHourlyCalendar();
    });

    nextMonth?.addEventListener('click', (e) => {
        e.stopPropagation();
        state.hourlyCalendarMonth.setMonth(state.hourlyCalendarMonth.getMonth() + 1);
        state.hourlyCalendarFocusDate = fmtDate(state.hourlyCalendarMonth);
        renderHourlyCalendar();
    });

    monthSelect?.addEventListener('change', (e) => {
        state.hourlyCalendarMonth.setMonth(parseInt(e.target.value, 10));
        state.hourlyCalendarFocusDate = fmtDate(state.hourlyCalendarMonth);
        renderHourlyCalendar();
    });

    yearSelect?.addEventListener('change', (e) => {
        state.hourlyCalendarMonth.setFullYear(parseInt(e.target.value, 10));
        state.hourlyCalendarFocusDate = fmtDate(state.hourlyCalendarMonth);
        renderHourlyCalendar();
    });

    applyBtn?.addEventListener('click', (e) => {
        e.stopPropagation();
        state.hourlyStartDate = state.hourlyTempStartDate;
        state.hourlyEndDate = state.hourlyTempEndDate;
        closeHourlyPanel({ restoreFocus: true });
        if (state.currentLearnerRows) {
            renderHourlyBarChart(state.currentLearnerRows);
        }
    });

    clearBtn?.addEventListener('click', (e) => {
        e.stopPropagation();
        state.hourlyStartDate = '';
        state.hourlyEndDate = '';
        state.hourlyTempStartDate = '';
        state.hourlyTempEndDate = '';
        renderHourlyCalendar();
        closeHourlyPanel({ restoreFocus: true });
        if (state.currentLearnerRows) {
            renderHourlyBarChart(state.currentLearnerRows);
        }
    });

    document.addEventListener('click', () => {
        closeHourlyPanel();
    });
}

function renderHourlyBarChart(learnerRows) {
    const container = document.getElementById('hourlyBarChartContainer');
    const dateText = document.getElementById('hourlyDateText');
    if (!container) return;

    state.currentLearnerRows = learnerRows;

    if (dateText) {
        if (state.hourlyStartDate && state.hourlyEndDate) {
            dateText.textContent = `${formatDate(state.hourlyStartDate)} - ${formatDate(state.hourlyEndDate)}`;
        } else if (state.hourlyStartDate) {
            dateText.textContent = `Từ ${formatDate(state.hourlyStartDate)}`;
        } else if (state.hourlyEndDate) {
            dateText.textContent = `Đến ${formatDate(state.hourlyEndDate)}`;
        } else {
            dateText.textContent = 'Tất cả thời gian';
        }
    }

    let filteredRows = learnerRows;
    if (state.hourlyStartDate || state.hourlyEndDate) {
        filteredRows = learnerRows.filter(item => {
            const date = parseDate(item.date);
            const start = state.hourlyStartDate ? parseDate(state.hourlyStartDate) : null;
            const end = state.hourlyEndDate ? parseDate(state.hourlyEndDate) : null;
            if (start && date < start) return false;
            if (end && date > end) return false;
            return true;
        });
    }

    const slots = [
        { label: '00:00 - 02:00', shortLabel: '00h', start: 0, end: 2, count: 0 },
        { label: '02:00 - 04:00', shortLabel: '02h', start: 2, end: 4, count: 0 },
        { label: '04:00 - 06:00', shortLabel: '04h', start: 4, end: 6, count: 0 },
        { label: '06:00 - 08:00', shortLabel: '06h', start: 6, end: 8, count: 0 },
        { label: '08:00 - 10:00', shortLabel: '08h', start: 8, end: 10, count: 0 },
        { label: '10:00 - 12:00', shortLabel: '10h', start: 10, end: 12, count: 0 },
        { label: '12:00 - 14:00', shortLabel: '12h', start: 12, end: 14, count: 0 },
        { label: '14:00 - 16:00', shortLabel: '14h', start: 14, end: 16, count: 0 },
        { label: '16:00 - 18:00', shortLabel: '16h', start: 16, end: 18, count: 0 },
        { label: '18:00 - 20:00', shortLabel: '18h', start: 18, end: 20, count: 0 },
        { label: '20:00 - 22:00', shortLabel: '20h', start: 20, end: 22, count: 0 },
        { label: '22:00 - 24:00', shortLabel: '22h', start: 22, end: 24, count: 0 }
    ];

    filteredRows.forEach(item => {
        let hour = 8;
        if (item.time) {
            const parts = item.time.split(':');
            hour = parseInt(parts[0], 10);
            if (isNaN(hour)) hour = 8;
        }
        const slot = slots.find(s => hour >= s.start && hour < s.end);
        if (slot) slot.count++;
    });

    if (!filteredRows.length) {
        container.innerHTML = '<div class="empty" style="padding: 24px; font-size: 12px;">Không có dữ liệu trong khoảng thời gian đã chọn.</div>';
        return;
    }

    const maxVal = Math.max(...slots.map(s => s.count), 1);

    const svgBars = slots.map((slot, idx) => {
        const x = 24 + idx * 25;
        const height = slot.count > 0 ? Math.max(Math.round((slot.count / maxVal) * 85), 8) : 2;
        const y = 115 - height;
        const HOURLY_BAR_COLORS = ['#e33f86', '#cf438f', '#aa4eac', '#7654c7', '#5d70d5', '#3aaed1'];
        const barColor = slot.count > 0 ? HOURLY_BAR_COLORS[idx % HOURLY_BAR_COLORS.length] : '#e4e7ec';

        return `
            <g class="bar-group">
                <title>${slot.label}: ${slot.count} lần làm bài</title>
                <rect x="${x}" y="${y}" width="16" height="${height}" rx="3" fill="${barColor}" class="bar-rect" />
                ${slot.count > 0 ? `<text x="${x + 8}" y="${y - 4}" text-anchor="middle" font-size="9.5" font-weight="700" fill="#1e293b">${slot.count}</text>` : ''}
                <text x="${x + 8}" y="132" text-anchor="middle" font-size="9.5" font-weight="600" fill="#64748b">${slot.shortLabel}</text>
            </g>
        `;
    }).join('');

    container.innerHTML = `
        <svg viewBox="0 0 330 145" width="100%" height="145" style="overflow: visible;">
            <line x1="20" y1="30" x2="325" y2="30" stroke="#f1f5f9" stroke-width="1" />
            <line x1="20" y1="72" x2="325" y2="72" stroke="#f1f5f9" stroke-width="1" />
            <line x1="20" y1="115" x2="325" y2="115" stroke="#e2e8f0" stroke-width="1.5" />

            <text x="15" y="34" text-anchor="end" font-size="9" font-weight="600" fill="#94a3b8">${maxVal}</text>
            <text x="15" y="76" text-anchor="end" font-size="9" font-weight="600" fill="#94a3b8">${Math.round(maxVal / 2)}</text>
            <text x="15" y="119" text-anchor="end" font-size="9" font-weight="600" fill="#94a3b8">0</text>

            ${svgBars}
        </svg>
    `;
}

function aggregateBy(rows, key) {
    const map = new Map();
    rows.forEach(item => {
        if (!map.has(item[key])) {
            map.set(item[key], { name: item[key], sessions: 0, rateSessions: 0, completed: 0, duration: 0, durationCount: 0 });
        }
        const row = map.get(item[key]);
        row.sessions += 1;
        if ((item.mode === 'Thực hành' || item.mode === 'practice') && hasCompleteAttemptEvidence(item)) {
            row.rateSessions += 1;
            row.completed += isSuccessfulSession(item) ? 1 : 0;
        }
        if (Number(item.duration) > 0) {
            row.duration += Number(item.duration);
            row.durationCount += 1;
        }
    });
    return [...map.values()].map(item => ({
        ...item,
        completion: item.rateSessions ? Math.round((item.completed / item.rateSessions) * 100) : null,
        avgDuration: item.durationCount ? Math.round(item.duration / item.durationCount) : null
    }));
}

let BASE_REGION_CATALOG = [];

let REGION_CATALOG = [];
let REGION_FILTER_OPTIONS = [];

async function fetchAndBuildRegionCatalog() {
    try {
        const response = await fetch(`${API_BASE_URL}/roster/regions`);
        if (!response.ok) return;
        const payload = await response.json();
        const items = payload.data?.items || [];
        const groupMap = new Map();
        items.forEach(item => {
            const group = String(item.dashboard_group || '').trim();
            const regionCode = String(item.region_code || item.regionCode || '').trim();
            const regionName = String(item.region_name || item.regionName || '').trim();
            const label = regionName || regionCode;
            if (!group && !label) return;
            if (group && group.toLocaleLowerCase('vi') !== label.toLocaleLowerCase('vi')) {
                if (!groupMap.has(group)) groupMap.set(group, new Set());
                if (label) groupMap.get(group).add(label);
            } else if (label) {
                if (!groupMap.has(label)) groupMap.set(label, new Set());
            }
        });
        const catalog = [];
        groupMap.forEach((children, code) => {
            if (children.size > 0) {
                catalog.push({ code, children: [...children].sort((a, b) => a.localeCompare(b, 'vi')) });
            } else {
                catalog.push({ code });
            }
        });
        catalog.sort((a, b) => a.code.localeCompare(b.code, 'vi'));
        BASE_REGION_CATALOG = catalog;
        catalog.filter(region => region.children?.length).forEach(region => {
            state.detailReportExpandedRegions.add(region.code);
        });
        REGION_CATALOG = BASE_REGION_CATALOG.map(region => ({
            ...region,
            children: region.children ? [...region.children] : undefined
        }));
        REGION_FILTER_OPTIONS = REGION_CATALOG.flatMap(region => region.children || [region.code]);
    } catch (error) {
        console.warn('Không tải được vùng từ database.', error);
    }
}

function getLearnerRegion(learner) {
    const key = String(learner || '').trim().toLowerCase();
    return technicianByIdentity.get(key)?.dashboardRegion || 'FTC';
}

function normalizeRegionName(region, learner) {
    const value = String(region || '').trim();
    if (!value) return getLearnerRegion(learner);
    const directMatch = REGION_FILTER_OPTIONS.find(option => option.toLowerCase() === value.toLowerCase());
    return directMatch || value;
}

function getDetailReportDeviceGroups(rows) {
    const groups = [];
    const groupMap = new Map();

    const ensureGroup = (deviceName) => {
        const name = deviceName || 'Thiết bị chưa xác định';
        if (!groupMap.has(name)) {
            const group = { device: name, labs: [] };
            groupMap.set(name, group);
            groups.push(group);
        }
        return groupMap.get(name);
    };

    deviceCatalog.forEach(device => {
        const group = ensureGroup(device.device || device.device_name || device.model);
        (device.labs || []).forEach(lab => {
            if (lab && !group.labs.includes(lab)) group.labs.push(lab);
        });
    });

    rows.forEach(item => {
        const group = ensureGroup(item.device);
        if (item.lab && !group.labs.includes(item.lab)) group.labs.push(item.lab);
    });

    return groups.filter(group => group.labs.length > 0);
}

function detailReportCellKey(region, device, lab) {
    return `${region}\u001f${device}\u001f${lab}`;
}

function aggregateAuthoritativeMetrics(metrics = []) {
    const result = { population_count: 0, attempted_count: 0, completed_count: 0, attempt_count: 0 };
    metrics.forEach(metric => {
        Object.keys(result).forEach(key => { result[key] += Number(metric?.[key]) || 0; });
    });
    result.completion_rate = result.population_count
        ? Math.round((result.completed_count / result.population_count) * 1000) / 10
        : null;
    return result;
}

function aggregateAuthoritativeRows(rows = [], columns = []) {
    return {
        cells: Object.fromEntries(columns.map(column => [
            column.labId,
            aggregateAuthoritativeMetrics(rows.map(row => row.cells?.[column.labId]))
        ])),
        total: aggregateAuthoritativeMetrics(rows.map(row => row.total))
    };
}

function buildAuthoritativeRegionRows(reportRows = [], columns = []) {
    const remaining = new Set(reportRows);
    const normalized = value => String(value || '').trim().toLocaleLowerCase('vi');
    const matchesRegion = (row, values) => {
        const region = row.region || {};
        const candidates = [region.name, region.region_name, region.code, region.region_code].map(normalized);
        return values.some(value => candidates.includes(normalized(value)));
    };
    const result = [];
    const emptyRow = region => ({
        region,
        cells: Object.fromEntries(columns.map(column => [column.labId, aggregateAuthoritativeMetrics([])])),
        total: aggregateAuthoritativeMetrics([])
    });

    REGION_CATALOG.forEach(region => {
        const children = region.children || [];
        if (children.length) {
            const matched = reportRows.filter(row => {
                const group = normalized(row.region?.dashboard_group);
                return group === normalized(region.code) || matchesRegion(row, children);
            });
            matched.forEach(row => remaining.delete(row));
            const aggregate = matched.length
                ? aggregateAuthoritativeRows(matched, columns)
                : emptyRow({ code: region.code, name: region.code });
            result.push({
                region: { code: region.code, name: region.code },
                ...aggregate,
                isParent: true,
                isExpanded: state.detailReportExpandedRegions.has(region.code)
            });
            if (state.detailReportExpandedRegions.has(region.code)) {
                children.forEach(child => {
                    const childRows = matched.filter(row => matchesRegion(row, [child]));
                    result.push({
                        ...(childRows.length
                            ? aggregateAuthoritativeRows(childRows, columns)
                            : emptyRow({ code: child, name: child })),
                        region: { ...(childRows[0]?.region || {}), code: childRows[0]?.region?.code || child, name: child },
                        isChild: true
                    });
                });
            }
            return;
        }

        const matched = reportRows.filter(row => matchesRegion(row, [region.code]));
        matched.forEach(row => remaining.delete(row));
        result.push(matched.length ? {
            region: matched[0].region || { code: region.code, name: region.code },
            ...aggregateAuthoritativeRows(matched, columns)
        } : emptyRow({ code: region.code, name: region.code }));
    });

    [...remaining]
        .sort((a, b) => String(a.region?.name || '').localeCompare(String(b.region?.name || ''), 'vi'))
        .forEach(row => result.push(row));
    return result;
}

function reportMatrixHeader(groups, columns, firstLabel, lastLabel) {
    return `
        <tr class="report-device-header-row">
            <th class="report-region-head" rowspan="2" scope="col"><strong>${escapeHTML(firstLabel)}</strong></th>
            ${groups.map((group, index) => `<th class="report-device-group report-device-tone-${index % 5}" colspan="${(group.labs || []).length}" scope="colgroup">${escapeHTML(group.device?.name || group.device_name || '')}<span>${(group.labs || []).length} bài lab</span></th>`).join('')}
            <th class="report-summary-head" rowspan="2" scope="col">${escapeHTML(lastLabel)}</th>
        </tr>
        <tr class="report-lab-header-row">${columns.map(column => `<th class="report-lab-head report-device-tone-${column.groupIndex % 5} ${column.isFirst ? 'group-start' : ''} ${column.isLast ? 'group-end' : ''}" scope="col" title="${escapeHTML(`${column.device} • ${column.lab}`)}">${escapeHTML(column.lab)}</th>`).join('')}</tr>`;
}

function renderBranchReportDrilldown(reportMatrix, groups, columns, completionCell) {
    const drilldownRegions = reportMatrix.branch_drilldown?.regions || [];
    const selectedRegion = drilldownRegions.find(item => String(item.region?.code || '') === state.branchMatrixRegionCode);
    if (!selectedRegion) {
        state.branchMatrixRegionCode = '';
        state.branchMatrixUnitCode = '';
        if (els.branchMatrixCard) els.branchMatrixCard.hidden = true;
        if (els.branchKtvMatrixCard) els.branchKtvMatrixCard.hidden = true;
        return;
    }

    const branches = selectedRegion.branches || [];
    els.branchMatrixCard.hidden = false;
    els.branchMatrixTitle.textContent = `Chi nhánh thuộc ${selectedRegion.region?.name || selectedRegion.region?.code || ''}`;
    els.branchMatrixHead.innerHTML = reportMatrixHeader(groups, columns, 'Chi nhánh', 'Tổng');
    els.branchMatrixBody.innerHTML = branches.map(branch => `
        <tr class="branch-report-row ${String(branch.unit_code) === state.branchMatrixUnitCode ? 'is-selected' : ''}">
            <th class="report-region-cell" scope="row"><button type="button" class="branch-report-open" data-branch-unit-code="${escapeHTML(branch.unit_code)}">${escapeHTML(branch.name || branch.unit_code)}</button></th>
            ${columns.map(column => completionCell(branch.cells?.[column.labId], column.isFirst ? 'group-start' : '')).join('')}
            ${completionCell(branch.total, 'report-row-total', true)}
        </tr>`).join('') || `<tr><td colspan="${columns.length + 2}" class="empty">Khu vực này chưa có chi nhánh trong danh mục tổ chức.</td></tr>`;
    const branchAggregate = aggregateAuthoritativeRows(branches, columns);
    els.branchMatrixFoot.innerHTML = `<tr><th class="report-region-cell report-grand-label" scope="row">Tổng khu vực</th>${columns.map(column => completionCell(branchAggregate.cells?.[column.labId], column.isFirst ? 'group-start' : '')).join('')}${completionCell(branchAggregate.total, 'report-row-total report-grand-total', true)}</tr>`;

    els.branchMatrixBody.querySelectorAll('[data-branch-unit-code]').forEach(button => {
        button.addEventListener('click', () => {
            state.branchMatrixUnitCode = button.dataset.branchUnitCode || '';
            renderBranchReportDrilldown(reportMatrix, groups, columns, completionCell);
            els.branchKtvMatrixTitle?.focus({ preventScroll: true });
            els.branchKtvMatrixCard?.scrollIntoView({ behavior: 'smooth', block: 'start' });
        });
    });

    const selectedBranch = branches.find(item => String(item.unit_code || '') === state.branchMatrixUnitCode);
    if (!selectedBranch) {
        state.branchMatrixUnitCode = '';
        els.branchKtvMatrixCard.hidden = true;
        return;
    }

    const technicians = selectedBranch.technicians || [];
    const passMetricCell = (cell = {}, extraClass = '') => {
        const passes = Number(cell.passed_eligible_attempt_count ?? cell.pass_count) || 0;
        const attempts = Number(cell.rate_eligible_attempt_count ?? cell.attempt_count) || 0;
        const submittedAttempts = Number(cell.submitted_attempt_count ?? attempts) || 0;
        const incompleteAttempts = Number(cell.legacy_incomplete_attempt_count ?? cell.incomplete_attempt_count) || 0;
        const rate = attempts ? Math.round((passes / attempts) * 1000) / 10 : null;
        const cssClass = rate === null ? 'report-cell-zero' : (rate >= 80 ? 'report-cell-high' : (rate >= 50 ? 'report-cell-medium' : 'report-cell-low'));
        const qualityNote = `; ${submittedAttempts} lượt phát sinh; ${incompleteAttempts} lượt thiếu chuỗi lịch sử không tính vào tỷ lệ`;
        return `<td class="report-metric-cell ${cssClass} ${extraClass}" title="${escapeHTML(`${passes} lượt đạt / ${attempts} lượt đủ dữ liệu đánh giá${qualityNote}`)}"><strong>${passes}/${attempts}</strong><span>${rate === null ? '—' : `${rate}%`}</span></td>`;
    };
    els.branchKtvMatrixCard.hidden = false;
    els.branchKtvMatrixTitle.textContent = `KTV thuộc chi nhánh ${selectedBranch.name || selectedBranch.unit_code}`;
    els.branchKtvMatrixHead.innerHTML = `
        <tr class="report-device-header-row">
            <th class="ktv-stt-head" rowspan="2" scope="col">STT</th>
            <th class="ktv-code-head" rowspan="2" scope="col">Mã NV</th>
            <th class="ktv-info-head" rowspan="2" scope="col">Kỹ thuật viên</th>
            ${groups.map((group, index) => `<th class="report-device-group report-device-tone-${index % 5}" colspan="${(group.labs || []).length}" scope="colgroup">${escapeHTML(group.device?.name || group.device_name || '')}<span>${(group.labs || []).length} bài lab</span></th>`).join('')}
            <th class="ktv-total-head" rowspan="2" scope="col">Đạt / lượt đủ dữ liệu</th>
            <th class="ktv-rate-head" rowspan="2" scope="col">Tỷ lệ</th>
        </tr>
        <tr class="report-lab-header-row">${columns.map(column => `<th class="report-lab-head report-device-tone-${column.groupIndex % 5} ${column.isFirst ? 'group-start' : ''}" scope="col">${escapeHTML(column.lab)}</th>`).join('')}</tr>`;
    els.branchKtvMatrixBody.innerHTML = technicians.map((technician, index) => {
        const totalAttempts = Number(technician.total?.rate_eligible_attempt_count ?? technician.total?.attempt_count) || 0;
        const totalPasses = Number(technician.total?.passed_eligible_attempt_count ?? technician.total?.pass_count) || 0;
        const totalRate = totalAttempts ? Math.round((totalPasses / totalAttempts) * 1000) / 10 : null;
        const totalClass = totalRate === null ? 'report-cell-zero' : (totalRate >= 80 ? 'report-cell-high' : (totalRate >= 50 ? 'report-cell-medium' : 'report-cell-low'));
        return `
        <tr>
            <td class="ktv-stt-cell">${index + 1}</td>
            <td class="ktv-code-cell">${escapeHTML(technician.employee_id || '—')}</td>
            <th class="ktv-info-cell" scope="row"><div class="ktv-info-wrap"><span class="ktv-info-name">${escapeHTML(technician.display_name || technician.email || 'Chưa có tên')}</span><div class="ktv-info-meta"><span>${escapeHTML(technician.email || '')}</span></div></div></th>
            ${columns.map(column => passMetricCell(technician.cells?.[column.labId], column.isFirst ? 'group-start' : '')).join('')}
            <td class="ktv-total-cell ${totalClass}"><strong>${totalPasses}/${totalAttempts}</strong></td>
            <td class="ktv-rate-cell ${totalClass}">${totalRate === null ? '—' : `${totalRate}%`}</td>
        </tr>`;
    }).join('') || `<tr><td colspan="${columns.length + 5}" class="empty">Chi nhánh này chưa có KTV đang hoạt động.</td></tr>`;
    const technicianTotals = Object.fromEntries(columns.map(column => [column.labId, { pass_count: 0, attempt_count: 0, submitted_attempt_count: 0, incomplete_attempt_count: 0 }]));
    const overall = { pass_count: 0, attempt_count: 0, submitted_attempt_count: 0, incomplete_attempt_count: 0 };
    technicians.forEach(technician => {
        columns.forEach(column => {
            technicianTotals[column.labId].pass_count += Number(technician.cells?.[column.labId]?.pass_count) || 0;
            technicianTotals[column.labId].attempt_count += Number(technician.cells?.[column.labId]?.attempt_count) || 0;
            technicianTotals[column.labId].submitted_attempt_count += Number(technician.cells?.[column.labId]?.submitted_attempt_count) || 0;
            technicianTotals[column.labId].incomplete_attempt_count += Number(technician.cells?.[column.labId]?.incomplete_attempt_count) || 0;
        });
        overall.pass_count += Number(technician.total?.pass_count) || 0;
        overall.attempt_count += Number(technician.total?.attempt_count) || 0;
        overall.submitted_attempt_count += Number(technician.total?.submitted_attempt_count) || 0;
        overall.incomplete_attempt_count += Number(technician.total?.incomplete_attempt_count) || 0;
    });
    const overallRate = overall.attempt_count ? Math.round((overall.pass_count / overall.attempt_count) * 1000) / 10 : null;
    els.branchKtvMatrixFoot.innerHTML = `<tr><td class="ktv-footer-stt" aria-hidden="true"></td><td class="ktv-footer-code" aria-hidden="true"></td><th class="ktv-footer-label" scope="row">Tổng chi nhánh</th>${columns.map(column => passMetricCell(technicianTotals[column.labId], column.isFirst ? 'group-start' : '')).join('')}<td class="ktv-footer-total"><strong>${overall.pass_count}/${overall.attempt_count}</strong></td><td class="ktv-footer-rate">${overallRate === null ? '—' : `${overallRate}%`}</td></tr>`;
}

function renderAuthoritativeDetailedReport(reportMatrix) {
    if (!els.detailReportHead || !els.detailReportBody || !els.detailReportFoot) return;
    const groups = reportMatrix.device_groups || [];
    const qualityNote = document.getElementById('detailReportDataQuality');
    if (qualityNote) {
        const incompleteAttempts = Number(reportMatrix.data_quality?.legacy_incomplete_attempt_count ?? reportMatrix.data_quality?.incomplete_attempt_count) || 0;
        qualityNote.hidden = false;
        qualityNote.textContent = `Phạm vi gồm toàn bộ KTV đang hoạt động × toàn bộ bài lab đang hoạt động theo khu vực/chi nhánh hiện tại; phiên thực hành không cần có assignment.${incompleteAttempts ? ` ${formatNumber.format(incompleteAttempts)} lượt lịch sử thiếu chuỗi lần làm vẫn được dùng làm bằng chứng hoàn thành khi có kết quả đạt, nhưng không tính vào tỷ lệ phiên đạt.` : ''}`;
    }
    const columns = groups.flatMap((group, groupIndex) => (group.labs || []).map((lab, labIndex) => ({
        device: group.device?.name || group.device?.device_name || group.device_name || '',
        deviceId: group.device?.device_id || group.device_id || '',
        lab: lab.name || lab.lab_name || '',
        labId: lab.lab_id || '',
        groupIndex,
        isFirst: labIndex === 0,
        isLast: labIndex === group.labs.length - 1
    })));
    const metricCell = (cell = {}, extraClass = '', aggregate = false) => {
        const population = Number(cell.population_count) || 0;
        const completed = Number(cell.completed_count) || 0;
        const rate = cell.completion_rate === null || cell.completion_rate === undefined
            ? null
            : Number(cell.completion_rate);
        if (!population || rate === null) {
            return `<td class="report-metric-cell report-cell-zero ${extraClass}" title="Không có KTV đang hoạt động trong phạm vi"><strong>—</strong><span aria-hidden="true">&nbsp;</span></td>`;
        }
        const cssClass = rate >= 80 ? 'report-cell-high' : (rate >= 50 ? 'report-cell-medium' : 'report-cell-low');
        const attempted = Number(cell.attempted_count) || 0;
        const submittedAttempts = Number(cell.submitted_attempt_count ?? cell.attempt_count) || 0;
        const eligibleAttempts = Number(cell.rate_eligible_attempt_count ?? cell.attempt_count) || 0;
        const incompleteAttempts = Number(cell.legacy_incomplete_attempt_count ?? cell.incomplete_attempt_count) || 0;
        const unit = aggregate ? 'cặp KTV–bài' : 'KTV';
        return `<td class="report-metric-cell ${cssClass} ${extraClass}" title="${escapeHTML(`${completed}/${population} ${unit} đã đạt • ${attempted} ${unit} có lượt đủ dữ liệu • ${submittedAttempts} lượt phát sinh • ${eligibleAttempts} lượt đủ dữ liệu đánh giá • ${incompleteAttempts} lượt thiếu chuỗi lịch sử`)}"><strong>${completed}/${population}</strong><span>${rate}%</span></td>`;
    };
    els.detailReportHead.innerHTML = reportMatrixHeader(groups, columns, 'Khu vực / CN', 'Tổng');
    const visibleRows = buildAuthoritativeRegionRows(reportMatrix.rows || [], columns);
    const drilldownRegions = reportMatrix.branch_drilldown?.regions || [];
    const normalizeRegionLabel = value => String(value || '').trim().toLocaleLowerCase('vi');
    const visibleRegionCount = visibleRows.filter(row => !row.isParent).length;
    els.detailReportBody.innerHTML = visibleRows.map(row => {
        const region = row.region || {};
        const regionName = region.name || region.region_name || region.code || region.region_code || '';
        const locationLabel = regionName;
        const rowClass = row.isParent ? 'report-region-parent' : (row.isChild ? 'report-region-child' : '');
        const regionCode = String(region.code || region.region_code || '');
        const drilldownRegion = row.isParent ? null : drilldownRegions.find(item => {
            const candidate = item.region || {};
            return String(candidate.code || '') === regionCode
                || normalizeRegionLabel(candidate.name) === normalizeRegionLabel(regionName);
        });
        const drilldownRegionCode = String(drilldownRegion?.region?.code || '');
        const regionLabel = row.isParent
            ? `<button type="button" class="report-region-toggle" data-report-region-toggle="${escapeHTML(regionName)}" aria-expanded="${row.isExpanded}"><span>${row.isExpanded ? '▾' : '▸'}</span>${escapeHTML(regionName)}</button>`
            : (drilldownRegion
                ? `<button type="button" class="report-region-label report-region-open" data-branch-region-code="${escapeHTML(drilldownRegionCode)}">${row.isChild ? '<span class="report-region-bullet">•</span>' : '<span class="report-region-spacer"></span>'}${escapeHTML(locationLabel)}</button>`
                : `<div class="report-region-label">${row.isChild ? '<span class="report-region-bullet">•</span>' : '<span class="report-region-spacer"></span>'}${escapeHTML(locationLabel)}</div>`);
        return `<tr class="${rowClass} ${drilldownRegionCode === state.branchMatrixRegionCode ? 'is-selected' : ''}"><th class="report-region-cell" scope="row">${regionLabel}</th>${columns.map(column => metricCell(row.cells?.[column.labId], column.isFirst ? 'group-start' : '')).join('')}${metricCell(row.total, 'report-row-total', true)}</tr>`;
    }).join('') || `<tr><td colspan="${columns.length + 2}" class="empty">Không có KTV đang hoạt động trong danh mục khu vực.</td></tr>`;
    const grand = reportMatrix.grand_total || {};
    els.detailReportFoot.innerHTML = `<tr><th class="report-region-cell report-grand-label" scope="row">Tổng hệ thống</th>${columns.map(column => metricCell(grand.cells?.[column.labId], column.isFirst ? 'group-start' : '')).join('')}${metricCell(grand.total || grand, 'report-row-total report-grand-total', true)}</tr>`;
    const summaryValues = {
        detailReportPeriod: dashboardReport?.meta?.period?.label || getRangeLabel(),
        detailReportSessions: formatNumber.format(Number(grand.total?.submitted_attempt_count ?? grand.submitted_attempt_count ?? grand.total?.attempt_count ?? grand.attempt_count) || 0),
        detailReportEligibleSessions: formatNumber.format(Number(grand.total?.rate_eligible_attempt_count ?? grand.rate_eligible_attempt_count ?? grand.total?.attempt_count ?? grand.attempt_count) || 0),
        detailReportIncompleteSessions: formatNumber.format(Number(grand.total?.legacy_incomplete_attempt_count ?? grand.legacy_incomplete_attempt_count ?? grand.total?.incomplete_attempt_count ?? grand.incomplete_attempt_count) || 0),
        detailReportRegions: formatNumber.format(visibleRegionCount),
        detailReportLabs: formatNumber.format(columns.length),
        detailReportCompletion: grand.total?.completion_rate === null || grand.completion_rate === null
            ? '—'
            : `${Number(grand.total?.completion_rate ?? grand.completion_rate) || 0}%`
    };
    Object.entries(summaryValues).forEach(([id, value]) => {
        const element = document.getElementById(id);
        if (element) element.textContent = value;
    });
    els.detailReportBody.querySelectorAll('[data-report-region-toggle]').forEach(button => {
        button.addEventListener('click', () => {
            const region = button.dataset.reportRegionToggle;
            if (state.detailReportExpandedRegions.has(region)) state.detailReportExpandedRegions.delete(region);
            else state.detailReportExpandedRegions.add(region);
            renderAuthoritativeDetailedReport(reportMatrix);
        });
    });
    els.detailReportBody.querySelectorAll('[data-branch-region-code]').forEach(button => {
        button.addEventListener('click', () => {
            state.branchMatrixRegionCode = button.dataset.branchRegionCode || '';
            state.branchMatrixUnitCode = '';
            renderAuthoritativeDetailedReport(reportMatrix);
            els.branchMatrixTitle?.focus({ preventScroll: true });
            els.branchMatrixCard?.scrollIntoView({ behavior: 'smooth', block: 'start' });
        });
    });
    renderBranchReportDrilldown(reportMatrix, groups, columns, metricCell);
    const branchClose = document.getElementById('branchMatrixClose');
    if (branchClose) branchClose.onclick = () => {
        state.branchMatrixRegionCode = '';
        state.branchMatrixUnitCode = '';
        renderAuthoritativeDetailedReport(reportMatrix);
    };
    const technicianClose = document.getElementById('branchKtvMatrixClose');
    if (technicianClose) technicianClose.onclick = () => {
        state.branchMatrixUnitCode = '';
        renderBranchReportDrilldown(reportMatrix, groups, columns, metricCell);
    };
}

function resetLearnerDetailFilters() {
    state.detailSelectedModes = new Set(['Thực hành', 'Hướng dẫn']);
    state.detailSelectedDevices = new Set();
    state.detailDevicesTouched = false;
    state.detailSelectedLabs = new Set();
    state.detailLabsTouched = false;
    state.detailSelectedStatuses = new Set(['Đạt', 'Chưa đạt', 'Chưa có kết quả', 'Không đánh giá']);
    state.detailSearchDevice = '';
    state.detailSearchLab = '';
    state.learnerDetailPage = 1;

    document.querySelectorAll('#detailModeOptions input[type="checkbox"], #detailStatusOptions input[type="checkbox"]')
        .forEach(checkbox => { checkbox.checked = true; });
    ['detailDeviceSearch', 'detailLabSearch'].forEach(id => {
        const input = document.getElementById(id);
        if (input) input.value = '';
    });
}

function buildDetailReportIndex(rows) {
    const index = new Map();
    rows.forEach(item => {
        const region = item.region || getLearnerRegion(item.learner);
        const key = detailReportCellKey(region, item.device, item.lab);
        if (!index.has(key)) index.set(key, { attempts: 0, learners: new Set(), completedLearners: new Set(), duration: 0 });
        const cell = index.get(key);
        cell.attempts += 1;
        cell.learners.add(item.learner);
        if (isSuccessfulSession(item)) cell.completedLearners.add(item.learner);
        cell.duration += Number(item.duration) || 0;
    });
    return index;
}

function getDetailReportEligibleLearners(regionKeys) {
    const regions = new Set(regionKeys);
    return new Set(technicianCatalog
        .filter(item => !item.isTerminated && item.email && regions.has(item.dashboardRegion))
        .map(item => item.email));
}

function getDetailReportCell(index, regionKeys, column) {
    const eligibleLearners = getDetailReportEligibleLearners(regionKeys);
    const result = { attempts: 0, learners: new Set(), completedLearners: new Set(), duration: 0 };
    regionKeys.forEach(region => {
        const cell = index.get(detailReportCellKey(region, column.device, column.lab));
        if (!cell) return;
        result.attempts += cell.attempts;
        cell.learners.forEach(learner => result.learners.add(learner));
        cell.completedLearners.forEach(learner => result.completedLearners.add(learner));
        result.duration += cell.duration;
    });
    result.eligible = eligibleLearners.size;
    result.attempted = result.learners.size;
    result.completed = result.completedLearners.size;
    result.rate = result.eligible ? Math.round((result.completed / result.eligible) * 100) : null;
    result.avgDuration = result.attempts ? Math.round(result.duration / result.attempts) : 0;
    return result;
}

function getDetailReportTotal(index, regionKeys, columns) {
    const eligibleLearners = getDetailReportEligibleLearners(regionKeys);
    const result = { attempts: 0, attempted: 0, completed: 0, eligible: eligibleLearners.size * columns.length, duration: 0, isAggregate: true };
    columns.forEach(column => {
        const cell = getDetailReportCell(index, regionKeys, column);
        result.attempts += cell.attempts;
        result.attempted += cell.attempted;
        result.completed += cell.completed;
        result.duration += cell.duration;
    });
    result.rate = result.eligible ? Math.round((result.completed / result.eligible) * 100) : null;
    result.avgDuration = result.attempts ? Math.round(result.duration / result.attempts) : 0;
    return result;
}

function getDetailReportCellClass(cell) {
    if (cell.rate === null || !cell.attempts) return 'report-cell-zero';
    if (cell.rate >= 80) return 'report-cell-high';
    if (cell.rate >= 50) return 'report-cell-medium';
    return 'report-cell-low';
}

function renderDetailReportMetricCell(cell, extraClass = '') {
    if (!cell.eligible) return `<td class="report-metric-cell report-cell-zero ${extraClass}" title="Không có KTV trong phạm vi này"><strong>—</strong><span>N/A</span></td>`;
    if (!cell.attempts) return `<td class="report-metric-cell report-cell-zero ${extraClass}" title="Chưa có KTV thực hiện trong khoảng lọc"><strong>—</strong><span>Chưa có dữ liệu</span></td>`;
    const coverageUnit = cell.isAggregate ? 'lượt KTV-lab' : 'KTV';
    const title = `${cell.completed}/${cell.eligible} ${coverageUnit} hoàn thành • ${cell.attempted} ${coverageUnit} đã làm • ${cell.attempts} phiên • Trung bình ${formatDuration(cell.avgDuration)}`;
    return `
        <td class="report-metric-cell ${getDetailReportCellClass(cell)} ${extraClass}" title="${escapeHTML(title)}">
            <strong>${formatNumber.format(cell.completed)}/${formatNumber.format(cell.eligible)}</strong>
            <span>${cell.rate}%</span>
        </td>
    `;
}

function renderDetailedReport(rows) {
    if (!els.detailReportHead || !els.detailReportBody || !els.detailReportFoot) return;
    if (dashboardReport?.matrix && dashboardReportMatchesSelectedPeriod()) {
        renderAuthoritativeDetailedReport(dashboardReport.matrix);
        const qualityNote = document.getElementById('detailReportDataQuality');
        if (qualityNote && state.dashboardReportStatus === 'stale') {
            qualityNote.hidden = false;
            qualityNote.textContent = 'Đang hiển thị bản báo cáo thành công gần nhất đúng với kỳ đã chọn; dữ liệu mới chưa đồng bộ được.';
        }
        return;
    }
    const columns = Math.max(1, (deviceCatalog || []).reduce((sum, device) => sum + (device.labs || []).length, 0));
    els.detailReportHead.innerHTML = '';
    els.detailReportFoot.innerHTML = '';
    els.detailReportBody.innerHTML = `<tr><td colspan="${columns + 2}" class="empty">Không tải được báo cáo KTV theo khu vực cho kỳ đã chọn.</td></tr>`;
    const qualityNote = document.getElementById('detailReportDataQuality');
    if (qualityNote) {
        qualityNote.hidden = false;
        qualityNote.textContent = 'Không thể tải danh mục KTV đang hoạt động và phiên thực hành cho kỳ này; các chỉ số được để trống để tránh gây hiểu nhầm.';
    }
    ['detailReportSessions', 'detailReportEligibleSessions', 'detailReportIncompleteSessions', 'detailReportRegions', 'detailReportLabs', 'detailReportCompletion'].forEach(id => {
        const element = document.getElementById(id);
        if (element) element.textContent = '—';
    });
}

const REGION_USAGE_COLORS = [
    '#2f6fed', '#e43f86', '#12a594', '#8b5cf6', '#f59e0b', '#0ea5e9',
    '#ef5da8', '#22a06b', '#6366f1', '#d97706', '#0891b2', '#c026d3'
];

function getRegionUsageYears() {
    const years = new Set([now.getFullYear()]);
    sessions.forEach(session => {
        const date = parseDate(session.date);
        if (date.getTime() > 0) years.add(date.getFullYear());
    });
    return [...years].sort((left, right) => right - left);
}

function isPracticeSession(session) {
    return session?.mode === 'Thực hành' || session?.mode === 'practice';
}

function getRegionUsageSeries(year) {
    const headcountByRegion = new Map();
    technicianCatalog
        .filter(technician => !technician.isTerminated && (technician.email || technician.employeeId))
        .forEach(technician => {
            const region = technician.dashboardRegion || 'FTC';
            headcountByRegion.set(region, (headcountByRegion.get(region) || 0) + 1);
        });

    const practiceSessionsByRegionMonth = new Map();
    const passedLearnersByRegionMonth = new Map();

    sessions.forEach(session => {
        const date = parseDate(session.date);
        if (date.getTime() <= 0 || date.getFullYear() !== year) return;
        const region = getLearnerRegion(session.learner);
        if (!headcountByRegion.has(region)) {
            headcountByRegion.set(region, 0);
        }
        const monthIndex = date.getMonth();
        const bucketKey = `${region}\u001f${monthIndex}`;
        const learnerIdentity = String(session.learner || session.technicianId || '').trim().toLowerCase();
        if (!learnerIdentity) return;

        if (!isPracticeSession(session)) return;
        practiceSessionsByRegionMonth.set(bucketKey, (practiceSessionsByRegionMonth.get(bucketKey) || 0) + 1);
        if (!isSuccessfulSession(session)) return;
        if (!passedLearnersByRegionMonth.has(bucketKey)) passedLearnersByRegionMonth.set(bucketKey, new Set());
        passedLearnersByRegionMonth.get(bucketKey).add(learnerIdentity);
    });

    const currentYear = now.getFullYear();
    const observedMonthCount = year < currentYear ? 12 : (year === currentYear ? now.getMonth() + 1 : 0);
    return [...headcountByRegion.entries()]
        .sort(([left], [right]) => left.localeCompare(right, 'vi', { numeric: true, sensitivity: 'base' }))
        .map(([region, headcount], colorIndex) => {
            const months = Array.from({ length: 12 }, (_, monthIndex) => {
                if (monthIndex >= observedMonthCount) return null;
                const bucketKey = `${region}\u001f${monthIndex}`;
                const practiceSessions = practiceSessionsByRegionMonth.get(bucketKey) || 0;
                const passedLearners = passedLearnersByRegionMonth.get(bucketKey)?.size || 0;
                return {
                    month: monthIndex + 1,
                    practiceSessions,
                    passedLearners,
                    headcount,
                    rate: headcount > 0
                        ? Math.round((passedLearners / headcount) * 1000) / 10
                        : 0
                };
            });
            const observedMonths = months.filter(Boolean);
            const practiceSessions = observedMonths.reduce((sum, month) => sum + month.practiceSessions, 0);
            const sessionsPerKtv = headcount > 0
                ? Math.round((practiceSessions / headcount) * 10) / 10
                : 0;
            return {
                region,
                headcount,
                color: REGION_USAGE_COLORS[colorIndex % REGION_USAGE_COLORS.length],
                months,
                practiceSessions,
                sessionsPerKtv
            };
        })
        .filter(item => item.headcount > 0);
}

function selectOverviewRegion(region, { revealTrend = true, focusTrend = false } = {}) {
    state.overviewSelectedRegion = region || '';
    if (revealTrend) state.overviewMonthlyExpanded = true;
    renderRegionUsageChart();
    renderOverviewMonthlyTrend(sessions);
    if (focusTrend && state.overviewMonthlyExpanded) {
        window.requestAnimationFrame(() => {
            document.getElementById('overviewMonthlyCard')?.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
        });
    }
}

function renderRegionRaceChart(series) {
    const container = document.getElementById('regionRaceChart');
    const reset = document.getElementById('overviewRegionReset');
    if (!container || !reset) return;

    const ranked = [...series].sort((left, right) => (
        right.sessionsPerKtv - left.sessionsPerKtv
        || right.practiceSessions - left.practiceSessions
        || left.region.localeCompare(right.region, 'vi')
    ));
    const maxRate = Math.max(1, ...ranked.map(item => item.sessionsPerKtv));
    reset.classList.toggle('is-selected', !state.overviewSelectedRegion);
    reset.setAttribute('aria-pressed', String(!state.overviewSelectedRegion));

    if (!ranked.length) {
        container.innerHTML = '<div class="region-race-empty">Chưa có dữ liệu khu vực.</div>';
        return;
    }

    container.innerHTML = ranked.map((item, index) => {
        const width = item.sessionsPerKtv > 0 ? Math.max(4, (item.sessionsPerKtv / maxRate) * 100) : 0;
        const selected = state.overviewSelectedRegion === item.region;
        return `
            <button type="button" class="region-race-row ${selected ? 'is-selected' : ''}"
                data-overview-region="${escapeHTML(item.region)}" aria-pressed="${selected}">
                <span class="region-race-rank">${index + 1}</span>
                <span class="region-race-content">
                    <span class="region-race-label"><strong>${escapeHTML(item.region)}</strong><small>${item.practiceSessions} lượt / ${item.headcount} KTV</small></span>
                    <span class="region-race-track"><i style="width:${width.toFixed(1)}%; --race-color:${item.color}"></i></span>
                </span>
                <strong class="region-race-value">${item.sessionsPerKtv.toFixed(1)}</strong>
            </button>
        `;
    }).join('');

    container.querySelectorAll('[data-overview-region]').forEach(button => {
        button.addEventListener('click', () => selectOverviewRegion(button.dataset.overviewRegion, { focusTrend: true }));
    });
}

function renderRegionUsageChart() {
    const container = document.getElementById('regionUsageChart');
    const legend = document.getElementById('regionUsageLegend');
    const insights = document.getElementById('regionUsageInsights');
    const yearSelect = document.getElementById('regionUsageYear');
    const tooltip = document.getElementById('regionUsageTooltip');
    const periodNote = document.getElementById('regionUsagePeriodNote');
    if (!container || !legend || !insights || !yearSelect || !tooltip) return;

    const years = getRegionUsageYears();
    if (!years.includes(state.regionUsageYear)) state.regionUsageYear = years[0] || now.getFullYear();
    const yearOptions = years.map(year => `<option value="${year}">${year}</option>`).join('');
    if (yearSelect.innerHTML !== yearOptions) yearSelect.innerHTML = yearOptions;
    yearSelect.value = String(state.regionUsageYear);
    const selectedReportYear = state.startDate ? parseDate(state.startDate).getFullYear() : state.regionUsageYear;
    if (periodNote) {
        const mismatch = selectedReportYear !== state.regionUsageYear
            ? ` Khác kỳ báo cáo đang chọn (${selectedReportYear}).`
            : '';
        periodNote.textContent = `Toàn năm ${state.regionUsageYear}; quy về cơ cấu KTV/khu vực hiện tại.${mismatch}`;
    }

    const series = getRegionUsageSeries(state.regionUsageYear);
    if (!series.length) {
        container.innerHTML = '<div class="region-usage-empty">Chưa có danh mục nhân sự theo khu vực để tính tỷ lệ.</div>';
        legend.innerHTML = '';
        insights.innerHTML = '';
        renderRegionRaceChart([]);
        return;
    }

    if (state.overviewSelectedRegion && !series.some(item => item.region === state.overviewSelectedRegion)) {
        state.overviewSelectedRegion = '';
    }
    renderRegionRaceChart(series);

    const yMax = 100;
    const yTicks = [0, 25, 50, 75, 100];

    const width = 1080;
    const height = 410;
    const plot = { left: 68, right: 26, top: 26, bottom: 58 };
    const plotWidth = width - plot.left - plot.right;
    const plotHeight = height - plot.top - plot.bottom;
    const xAt = monthIndex => plot.left + (plotWidth * monthIndex / 11);
    const yAt = rate => plot.top + plotHeight - (Math.min(rate, yMax) / yMax * plotHeight);
    const selectedMonthIndex = selectedReportYear === state.regionUsageYear && state.startDate
        ? parseDate(state.startDate).getMonth()
        : -1;

    const grid = yTicks.map(value => {
        const y = yAt(value);
        return `
            <line x1="${plot.left}" y1="${y}" x2="${width - plot.right}" y2="${y}" class="region-usage-grid-line" />
            <text x="${plot.left - 13}" y="${y + 4}" text-anchor="end" class="region-usage-axis-label">${value}%</text>
        `;
    }).join('');
    const monthLabels = Array.from({ length: 12 }, (_, monthIndex) => `
        <text x="${xAt(monthIndex)}" y="${height - 22}" text-anchor="middle" class="region-usage-month-label ${monthIndex === selectedMonthIndex ? 'is-selected' : ''}">Th ${monthIndex + 1}</text>
    `).join('');
    const lines = series.map((item, seriesIndex) => {
        const points = item.months
            .map((point, monthIndex) => point ? { ...point, x: xAt(monthIndex), y: yAt(point.rate) } : null)
            .filter(Boolean);
        const path = points.map((point, index) => `${index ? 'L' : 'M'} ${point.x.toFixed(1)} ${point.y.toFixed(1)}`).join(' ');
        const circles = points.map(point => `
            <circle class="region-usage-point ${point.month - 1 === selectedMonthIndex ? 'is-selected-month' : ''}" cx="${point.x}" cy="${point.y}" r="${point.month - 1 === selectedMonthIndex ? '6' : '4.5'}" tabindex="0"
                data-region="${escapeHTML(item.region)}" data-month="${point.month}" data-rate="${point.rate.toFixed(1)}"
                data-sessions="${point.practiceSessions}" data-passed-learners="${point.passedLearners}"
                data-headcount="${item.headcount}"
                aria-label="${escapeHTML(`${item.region}, tháng ${point.month}: ${point.rate.toFixed(1)}%, ${point.passedLearners} trên ${item.headcount} KTV có lượt đạt`)}">
                <title>${escapeHTML(`${item.region} • Tháng ${point.month}: ${point.rate.toFixed(1)}% (${point.passedLearners}/${item.headcount} KTV có ít nhất 1 phiên đạt)`)}</title>
            </circle>
        `).join('');
        return `
            <g class="region-usage-series" data-series-region="${escapeHTML(item.region)}" style="--series-color:${item.color}; --series-order:${seriesIndex}">
                <path d="${path}" class="region-usage-line" />
                ${circles}
            </g>
        `;
    }).join('');

    container.innerHTML = `
        <svg class="region-usage-svg" viewBox="0 0 ${width} ${height}" role="img" aria-labelledby="regionUsageSvgTitle regionUsageSvgDesc">
            <title id="regionUsageSvgTitle">Tỷ lệ KTV thực hành đạt theo khu vực năm ${state.regionUsageYear}</title>
            <desc id="regionUsageSvgDesc">Biểu đồ đường gồm ${series.length} khu vực, trục ngang là 12 tháng và trục dọc là tỷ lệ KTV có ít nhất một lượt thực hành đạt trên tổng số KTV khu vực.</desc>
            <text x="18" y="${plot.top + plotHeight / 2}" text-anchor="middle" class="region-usage-y-title" transform="rotate(-90 18 ${plot.top + plotHeight / 2})">KTV thực hành đạt (%)</text>
            ${grid}
            ${monthLabels}
            ${lines}
        </svg>
    `;

    const focusMonthIndex = selectedMonthIndex >= 0
        ? selectedMonthIndex
        : Math.max(0, Math.min(11, state.regionUsageYear === now.getFullYear() ? now.getMonth() : 11));
    const rankedForMonth = [...series].sort((left, right) => (
        (right.months[focusMonthIndex]?.rate || 0) - (left.months[focusMonthIndex]?.rate || 0)
    ));
    const highest = rankedForMonth[0];
    const totalHeadcount = series.reduce((sum, item) => sum + item.headcount, 0);
    const totalPassedLearners = series.reduce((sum, item) => sum + (item.months[focusMonthIndex]?.passedLearners || 0), 0);
    const systemRate = totalHeadcount ? Math.round((totalPassedLearners / totalHeadcount) * 1000) / 10 : 0;
    insights.innerHTML = `
        <article><span>Cao nhất · Tháng ${focusMonthIndex + 1}</span><strong>${highest ? escapeHTML(highest.region) : '—'}</strong><small>${highest ? `${(highest.months[focusMonthIndex]?.rate || 0).toFixed(1)}% KTV thực hành đạt` : 'Chưa có khu vực hợp lệ'}</small></article>
        <article><span>Toàn hệ thống · Tháng ${focusMonthIndex + 1}</span><strong>${systemRate.toFixed(1)}%</strong><small>${totalPassedLearners}/${totalHeadcount} KTV thực hành đạt</small></article>
    `;
    legend.innerHTML = series.map(item => `
        <button type="button" class="region-usage-legend-item ${state.overviewSelectedRegion === item.region ? 'is-selected' : ''}"
            data-legend-region="${escapeHTML(item.region)}" aria-pressed="${state.overviewSelectedRegion === item.region}">
            <i style="--legend-color:${item.color}"></i>
            <span>${escapeHTML(item.region)}</span>
            <small>${(item.months[focusMonthIndex]?.rate || 0).toFixed(1)}%</small>
        </button>
    `).join('');

    const setSeriesFocus = region => {
        container.querySelectorAll('.region-usage-series').forEach(group => {
            group.classList.toggle('is-muted', Boolean(region) && group.dataset.seriesRegion !== region);
            group.classList.toggle('is-focused', Boolean(region) && group.dataset.seriesRegion === region);
        });
    };
    legend.querySelectorAll('[data-legend-region]').forEach(button => {
        button.addEventListener('mouseenter', () => setSeriesFocus(button.dataset.legendRegion));
        button.addEventListener('mouseleave', () => setSeriesFocus(''));
        button.addEventListener('focus', () => setSeriesFocus(button.dataset.legendRegion));
        button.addEventListener('blur', () => setSeriesFocus(''));
        button.addEventListener('click', () => selectOverviewRegion(button.dataset.legendRegion, { focusTrend: true }));
    });

    const showTooltip = (point, event) => {
        tooltip.innerHTML = `<strong>${escapeHTML(point.dataset.region)} · Tháng ${point.dataset.month}</strong><span>${point.dataset.rate}%</span><small>${point.dataset.passedLearners}/${point.dataset.headcount} KTV có lượt đạt · ${point.dataset.sessions} phiên thực hành</small>`;
        tooltip.hidden = false;
        const chartRect = container.getBoundingClientRect();
        const pointRect = point.getBoundingClientRect();
        const clientX = event?.clientX || (pointRect.left + pointRect.width / 2);
        const clientY = event?.clientY || pointRect.top;
        const left = Math.max(10, Math.min(chartRect.width - tooltip.offsetWidth - 10, clientX - chartRect.left + 12));
        const top = Math.max(8, clientY - chartRect.top - tooltip.offsetHeight - 12);
        tooltip.style.left = `${left}px`;
        tooltip.style.top = `${top}px`;
        setSeriesFocus(point.dataset.region);
    };
    container.querySelectorAll('.region-usage-point').forEach(point => {
        point.addEventListener('mouseenter', event => showTooltip(point, event));
        point.addEventListener('mousemove', event => showTooltip(point, event));
        point.addEventListener('mouseleave', () => { tooltip.hidden = true; setSeriesFocus(''); });
        point.addEventListener('focus', event => showTooltip(point, event));
        point.addEventListener('blur', () => { tooltip.hidden = true; setSeriesFocus(''); });
        point.addEventListener('click', () => selectOverviewRegion(point.dataset.region, { focusTrend: true }));
    });
}

function initRegionUsageChart() {
    document.getElementById('regionUsageYear')?.addEventListener('change', event => {
        state.regionUsageYear = Number(event.target.value) || now.getFullYear();
        renderRegionUsageChart();
        renderOverviewMonthlyTrend(sessions);
    });
    document.getElementById('overviewSessionsDrilldown')?.addEventListener('click', () => {
        state.overviewMonthlyExpanded = true;
        renderOverviewMonthlyTrend(sessions);
        window.requestAnimationFrame(() => {
            document.getElementById('overviewMonthlyCard')?.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
        });
    });
    document.getElementById('overviewMonthlyClose')?.addEventListener('click', () => {
        state.overviewMonthlyExpanded = false;
        renderOverviewMonthlyTrend(sessions);
        document.getElementById('overviewSessionsDrilldown')?.focus({ preventScroll: true });
    });
    document.getElementById('overviewRegionReset')?.addEventListener('click', () => {
        selectOverviewRegion('', { revealTrend: state.overviewMonthlyExpanded });
    });
}

function getRangeLabel() {
    if (isFullCalendarMonth(state.startDate, state.endDate)) {
        const date = parseDate(state.startDate);
        return `Tháng ${String(date.getMonth() + 1).padStart(2, '0')}/${date.getFullYear()}`;
    }
    if (state.startDate && state.endDate) return `${formatDate(state.startDate)} - ${formatDate(state.endDate)}`;
    if (state.startDate) return `Từ ${formatDate(state.startDate)}`;
    if (state.endDate) return `Đến ${formatDate(state.endDate)}`;
    const today = new Date();
    return `Tháng ${String(today.getMonth() + 1).padStart(2, '0')}/${today.getFullYear()}`;
}

function updateRangeText(rows) {
    const label = getRangeLabel();
    const dateRangeText = document.getElementById('dateRangeText');
    if (dateRangeText) dateRangeText.textContent = label;
}

function statusToVietnamese(status) {
    const map = {
        completed: 'Chưa có kết quả',
        failed: 'Chưa đạt'
    };
    return map[status] || status || '';
}

function getSessionDisplayStatus(rawStatus, mode, isPassed) {
    if (mode === 'Hướng dẫn' || mode === 'guide') return 'Không đánh giá';
    if (isPassed === true) return 'Đạt';
    if (rawStatus === 'failed' || isPassed === false) return 'Chưa đạt';
    if (rawStatus === 'completed' || rawStatus === 'Hoàn thành') return 'Chưa có kết quả';
    return statusToVietnamese(rawStatus);
}

function dateOnly(value) {
    if (!value) return '';
    const date = new Date(value);
    if (Number.isNaN(date.getTime())) return String(value).slice(0, 10);
    return toDateKey(date);
}

function timeOnly(value) {
    if (!value) return '';
    const date = new Date(value);
    if (Number.isNaN(date.getTime())) {
        const match = String(value).match(/T(\d{2}:\d{2})/);
        return match?.[1] || '';
    }
    return `${String(date.getHours()).padStart(2, '0')}:${String(date.getMinutes()).padStart(2, '0')}`;
}

function formatDuration(seconds) {
    if (seconds === null || seconds === undefined || seconds === '') return '—';
    const total = Math.max(0, Math.round(Number(seconds) || 0));
    if (total < 60) return `${total} giây`;
    const minutes = Math.floor(total / 60);
    const rem = total % 60;
    return rem ? `${minutes} phút ${rem} giây` : `${minutes} phút`;
}

let learnerNameMap = new Map();

function normalizeTechnicianCatalog(apiTechnicians = []) {
    return apiTechnicians.map(item => ({
        userId: item.user_id || item.userId || item.id || '',
        employeeId: item.employee_id || item.employeeId || '',
        email: String(item.email || '').trim().toLowerCase(),
        displayName: item.display_name || item.displayName || item.email || 'KTV chưa xác định',
        jobTitle: item.job_title || item.jobTitle || '',
        classCode: item.class_code || item.classCode || '',
        className: item.class_name || item.className || item.class_code || item.classCode || '',
        unitCode: item.unit_code || item.unitCode || '',
        unitName: item.unit_name || item.unitName || '',
        regionId: item.region_id || item.regionId || '',
        regionCode: item.region_code || item.regionCode || '',
        regionName: item.region_name || item.regionName || item.dashboard_region || item.dashboardRegion || 'FTC',
        branchName: item.branch_name || item.branchName || '',
        dashboardRegion: item.dashboard_region || item.dashboardRegion || item.region_name || item.regionName || 'FTC',
        locationAssigned: Boolean(item.location_assigned ?? item.locationAssigned ?? item.region_id ?? item.regionId),
        isTerminated: Boolean(item.is_terminated ?? item.isTerminated)
    }));
}

function normalizeTrainingAssignments(apiAssignments = []) {
    return apiAssignments.map(item => ({
        learner: String(item.email || item.learner || '').trim().toLowerCase(),
        classCode: item.class_code || item.classCode || '',
        className: item.class_name || item.className || item.class_code || item.classCode || '',
        device: item.device_name || item.deviceName || item.device || 'N/A',
        lab: item.lab_name || item.labName || item.lab || 'N/A',
        status: item.status || 'assigned',
        completed: item.status === 'passed' || Boolean(item.passed),
        completedAt: item.completed_at || item.completedAt || null,
        firstPassAttemptNo: item.first_pass_attempt_no == null
            ? null
            : Number(item.first_pass_attempt_no)
    }));
}

function rebuildTechnicianIndex() {
    technicianByIdentity = new Map();
    REGION_CATALOG = BASE_REGION_CATALOG.map(region => ({
        ...region,
        children: region.children ? [...region.children] : undefined
    }));
    REGION_FILTER_OPTIONS = REGION_CATALOG.flatMap(region => region.children || [region.code]);
    technicianCatalog.forEach(item => {
        [item.email, item.employeeId, item.userId].filter(Boolean).forEach(identity => {
            technicianByIdentity.set(String(identity).trim().toLowerCase(), item);
        });
    });
    const dynamicRegions = [...new Set(technicianCatalog.map(item => item.dashboardRegion).filter(Boolean))]
        .sort((a, b) => a.localeCompare(b, 'vi'));
    dynamicRegions.forEach(region => {
        if (REGION_FILTER_OPTIONS.includes(region)) return;
        REGION_CATALOG.push({ code: region });
        REGION_FILTER_OPTIONS.push(region);
    });
}

function rebuildLearnerNameMap() {
    learnerNameMap = new Map();
    technicianCatalog.forEach(item => {
        if (item.email) learnerNameMap.set(item.email, item.displayName || item.email);
    });
    sessions.forEach(item => {
        if (!item.learner || learnerNameMap.has(item.learner)) return;
        learnerNameMap.set(item.learner, item.technicianName || item.learner);
    });
}

function getLearnerName(learner) {
    return learnerNameMap.get(learner) || learner || 'KTV chưa xác định';
}

function normalizeActionText(item) {
    return item?.latest_action?.message || item?.latest_action?.action || item?.last_action || 'N/A';
}

function mapApiSessions(apiSessions = []) {
    return apiSessions
        .filter(item => item.status === 'completed' || item.status === 'failed')
        .map(item => {
        const learner = item.technician?.email || item.email || item.technician?.full_name || item.full_name || item.technician_id || 'Unknown';
        const technician = technicianByIdentity.get(String(item.technician_id || '').trim().toLowerCase())
            || technicianByIdentity.get(String(item.email || '').trim().toLowerCase());
        const isPassed = item.is_passed === null || item.is_passed === undefined
            ? null
            : item.is_passed === true || item.is_passed === 1
                || ['1', 't', 'true', 'yes'].includes(String(item.is_passed).trim().toLowerCase());
        return {
            sessionId: item.session_id,
            technicianId: item.technician_id || item.technician?.technician_id,
            technicianName: technician?.displayName || item.technician?.full_name || item.full_name || '',
            date: dateOnly(item.started_at),
            time: timeOnly(item.started_at),
            startedAtMs: item.started_at ? new Date(item.started_at).getTime() : 0,
            learner,
            region: normalizeRegionName(technician?.regionName || item.region_name || item.region || item.technician?.region, learner),
            classCode: technician?.classCode || item.class_code || '',
            assignmentClassCodes: Array.isArray(item.assignment_class_codes)
                ? [...new Set(item.assignment_class_codes.map(String).filter(Boolean))]
                : [],
            jobTitle: technician?.jobTitle || item.job_title || '',
            unitCode: technician?.unitCode || item.unit_code || '',
            unitName: technician?.unitName || item.unit_name || '',
            branchName: technician?.branchName || item.branch_name || '',
            deviceId: item.device_id || item.device?.device_id || null,
            device: item.device?.device_name || item.device_name || item.device_id || 'N/A',
            lab: item.lab?.lab_name || item.lab_name || item.lab_id || 'N/A',
            skill: item.skill?.skill_name || item.skill?.skill_id || item.lab?.lab_name || item.lab_name || 'N/A',
            mode: item.mode || 'Thực hành',
            rawStatus: item.status,
            status: getSessionDisplayStatus(item.status, item.mode || 'Thực hành', isPassed),
            duration: item.duration_sec === null || item.duration_sec === undefined
                ? null
                : Number(item.duration_sec),
            isPassed,
            firstTry: item.completed_first_try === null || item.completed_first_try === undefined
                ? null
                : item.completed_first_try === true || item.completed_first_try === 1
                    || ['1', 't', 'true', 'yes'].includes(String(item.completed_first_try).trim().toLowerCase()),
            practiceAttemptNo: item.practice_attempt_no === null || item.practice_attempt_no === undefined
                ? null
                : Number(item.practice_attempt_no),
            attemptSequenceComplete: item.attempt_sequence_complete === null || item.attempt_sequence_complete === undefined
                ? true
                : item.attempt_sequence_complete === true || item.attempt_sequence_complete === 1
                    || ['1', 't', 'true', 'yes'].includes(String(item.attempt_sequence_complete).trim().toLowerCase()),
            lastAction: normalizeActionText(item)
        };
        });
}

function buildDeviceCatalog(devices = [], labs = []) {
    const labsByDevice = new Map();
    labs.forEach(lab => {
        if (!labsByDevice.has(lab.device_id)) labsByDevice.set(lab.device_id, []);
        labsByDevice.get(lab.device_id).push(lab.lab_name);
    });
    return devices.map(device => {
        const deviceLabs = (labsByDevice.get(device.device_id) || []).filter(Boolean);
        return {
            ...device,
            device: device.device_name || device.model || device.device_id,
            totalLabs: deviceLabs.length,
            labs: deviceLabs
        };
    });
}

function setDataSourceLabel(text) {
    state.dataSourceLabel = text;
    const el = document.getElementById('dataSourceLabel');
    if (el) el.textContent = text;
}

function formatDashboardSyncDetail(date = new Date()) {
    return `Cập nhật lúc ${date.toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit', second: '2-digit' })}`;
}

function setDashboardSyncState(status = 'ready', detail = '') {
    const sync = document.getElementById('dashboardSyncStatus');
    const title = document.getElementById('dashboardSyncTitle');
    const detailEl = document.getElementById('dashboardSyncDetail');
    const sidebarDot = document.getElementById('sidebarStatusDot');
    const titles = {
        syncing: 'Đang đồng bộ',
        ready: 'Dữ liệu mới nhất',
        stale: 'Đang dùng dữ liệu gần nhất',
        offline: 'Mất kết nối'
    };
    if (sync) sync.className = `dashboard-sync-status is-${status}`;
    if (title) title.textContent = titles[status] || titles.ready;
    if (detailEl) detailEl.textContent = detail || (state.lastSuccessfulRefreshAt
        ? formatDashboardSyncDetail(state.lastSuccessfulRefreshAt)
        : 'Chưa có dữ liệu đồng bộ');
    if (sidebarDot) sidebarDot.className = `sidebar-status-dot is-${status}`;
}

function setRefreshButtonBusy(busy) {
    const button = document.getElementById('refreshDashboardBtn');
    if (!button) return;
    button.disabled = busy;
    button.classList.toggle('is-busy', busy);
    button.setAttribute('aria-label', busy ? 'Đang làm mới dữ liệu' : 'Làm mới dữ liệu');
}

function setDashboardLoading(visible, message = '') {
    const el = document.getElementById('dashboardLoading');
    if (el) {
        el.hidden = !visible;
        el.setAttribute('aria-hidden', String(!visible));
        const copy = el.querySelector('.dashboard-loading-text');
        if (copy && message) copy.textContent = message;
    }
    document.getElementById('appPage')?.setAttribute('aria-busy', String(visible));
}

let dashboardPollTimer = null;
let dashboardRefreshInFlight = false;
let lastDashboardSignature = '';
let lastDashboardVersion = '';
let dashboardReportRequestSequence = 0;
const DASHBOARD_POLL_INTERVAL_MS = 30000;

function dashboardReportQuery() {
    const periods = getKpiComparisonPeriods();
    return new URLSearchParams({
        from: periods.currentStart,
        to: periods.currentEnd,
        compare_from: periods.previousStart,
        compare_to: periods.previousEnd,
        cohort: 'assigned_as_of_period_end',
        include_branch_drilldown: activeDashboardView === 'analytics' ? '1' : '0'
    });
}

async function fetchDashboardReport(query = dashboardReportQuery()) {
    const response = await fetch(`${API_BASE_URL}/dashboard/report?${query}`);
    if (!response.ok) throw new Error(`API báo cáo trả về HTTP ${response.status}`);
    const payload = await response.json();
    return payload.data || null;
}

async function fetchDashboardVersion() {
    const response = await fetch(`${API_BASE_URL}/dashboard/version`);
    if (!response.ok) throw new Error(`API phiên bản dashboard trả về HTTP ${response.status}`);
    const payload = await response.json();
    return String(payload.data?.data_version || '');
}

async function reloadDashboardReport() {
    const requestSequence = ++dashboardReportRequestSequence;
    state.dashboardReportStatus = 'loading';
    renderAll();
    try {
        const report = await fetchDashboardReport();
        if (requestSequence !== dashboardReportRequestSequence) return;
        dashboardReport = report;
        state.dashboardReportStatus = 'ready';
        renderAll();
    } catch (error) {
        console.warn('Không tải được báo cáo dashboard theo kỳ.', error);
        if (requestSequence !== dashboardReportRequestSequence) return;
        state.dashboardReportStatus = dashboardReport ? 'stale' : 'unavailable';
        renderAll();
    }
}

function buildDashboardSignature(data) {
    const list = data.sessions || [];
    const technicians = data.technicians || [];
    const first = list[0];
    const last = list[list.length - 1];
    const latestTechnicianUpdate = technicians.reduce((latest, item) => {
        const value = item.updated_at || item.updatedAt || '';
        return value > latest ? value : latest;
    }, '');
    const completedCount = list.filter(item => item.status === 'completed').length;
    const knownFirstTryCount = list.filter(item => item.completed_first_try !== null && item.completed_first_try !== undefined).length;
    const firstTryCount = list.filter(item => item.completed_first_try === true).length;
    const completeAttemptEvidenceCount = list.filter(item => item.attempt_sequence_complete !== false).length;
    return [
        list.length,
        first?.session_id || '',
        first?.started_at || '',
        last?.session_id || '',
        last?.started_at || '',
        (data.devices || []).length,
        technicians.length,
        latestTechnicianUpdate,
        completedCount,
        knownFirstTryCount,
        firstTryCount,
        completeAttemptEvidenceCount,
        data.data_version || '',
        data.report_meta?.data_version || ''
    ].join('|');
}

async function fetchDashboardData(versionHint = '') {
    const allParams = new URLSearchParams();
    // Assignment rows are required by class reports and KTV detail metrics.
    // Once loaded, refresh them together with the rest of the dashboard data.
    const assignmentsRequested = state.assignmentsLoaded
        || ['instructors', 'class_matrix', 'analytics', 'technicians'].includes(activeDashboardView);
    allParams.set('include_assignments', assignmentsRequested ? '1' : '0');
    const reportRequest = fetch(`${API_BASE_URL}/dashboard/report?${dashboardReportQuery()}`).then(async response => {
        if (!response.ok) throw new Error(`API báo cáo trả về HTTP ${response.status}`);
        return (await response.json()).data || null;
    });
    const versionRequest = versionHint
        ? Promise.resolve(versionHint)
        : fetchDashboardVersion();
    const regionCatalogPromise = fetchAndBuildRegionCatalog();
    const optionalRequests = Promise.allSettled([reportRequest, versionRequest]);
    const response = await fetch(`${API_BASE_URL}/dashboard/all?${allParams}`);
    if (!response.ok) throw new Error(`API dữ liệu chi tiết trả về HTTP ${response.status}`);
    const [payload, [reportResult, versionResult]] = await Promise.all([response.json(), optionalRequests]);
    const data = payload.data || {};
    if (assignmentsRequested && data.assignments_available !== true) {
        throw new Error('Dữ liệu phân lớp hiện không khả dụng.');
    }
    const report = reportResult.status === 'fulfilled' ? reportResult.value : dashboardReport;
    const reportStatus = reportResult.status === 'fulfilled' ? 'ready' : (report ? 'stale' : 'unavailable');
    const version = versionResult.status === 'fulfilled' ? String(versionResult.value || '') : String(versionHint || lastDashboardVersion || '');
    if (reportResult.status === 'rejected') console.warn('Không đồng bộ được báo cáo tổng hợp; giữ dữ liệu gần nhất.', reportResult.reason);
    if (versionResult.status === 'rejected') console.warn('Không đọc được phiên bản dữ liệu dashboard.', versionResult.reason);
    await regionCatalogPromise;
    const techniciansAuthoritative = Array.isArray(data.technicians);
    const technicians = normalizeTechnicianCatalog(techniciansAuthoritative ? data.technicians : []);
    technicianCatalog = technicians;
    technicianCatalogAuthoritative = techniciansAuthoritative;
    rebuildTechnicianIndex();
    return {
        sessions: mapApiSessions(data.sessions || []),
        deviceCatalog: (Array.isArray(data.devices) && Array.isArray(data.labs))
            ? buildDeviceCatalog(data.devices, data.labs)
            : [],
        technicians,
        techniciansAuthoritative,
        assignments: normalizeTrainingAssignments(data.assignments || []),
        classMemberships: normalizeClassMemberships(data.class_memberships || []),
        assignmentsRequested,
        assignmentsAvailable: data.assignments_available === true,
        report,
        reportStatus,
        version,
        raw: { ...data, data_version: version, report_meta: report?.meta || null }
    };
}

function applyDashboardData(data) {
    sessions = data.sessions;
    deviceCatalog = data.deviceCatalog;
    technicianCatalog = data.technicians || [];
    if (data.assignmentsRequested && data.assignmentsAvailable) {
        trainingAssignments = data.assignments || [];
        classMemberships = data.classMemberships || [];
        state.assignmentsLoaded = true;
    }
    if (data.report !== undefined) dashboardReport = data.report;
    state.dashboardReportStatus = data.reportStatus || (dashboardReport ? 'ready' : 'unavailable');
    technicianCatalogAuthoritative = Boolean(data.techniciansAuthoritative);
    state.dashboardDataLoaded = true;
    normalizeSessionDeviceNames();
    rebuildTechnicianIndex();
    rebuildLearnerNameMap();
}

function normalizeSessionDeviceNames() {
    if (!deviceCatalog.length || !sessions.length) return;
    const deviceIdToName = new Map();
    deviceCatalog.forEach(d => {
        if (d.device_id) deviceIdToName.set(String(d.device_id).toLowerCase(), d.device || d.device_name);
    });
    const fallbackMap = new Map();
    const canonicalNames = deviceCatalog.map(d => d.device || d.device_name).filter(Boolean);
    canonicalNames.forEach(name => { fallbackMap.set(name.toLowerCase(), name); });
    const junkPatterns = ['hệ thống lab', 'router mikrotik', 'internet hub', 'ont'];
    sessions.forEach(s => {
        if (s.deviceId) {
            const canonical = deviceIdToName.get(String(s.deviceId).toLowerCase());
            if (canonical) { s.device = canonical; return; }
        }
        const lower = (s.device || '').toLowerCase().trim();
        if (!lower || lower === 'n/a' || junkPatterns.some(p => lower.includes(p))) {
            const matched = canonicalNames.find(c => lower.includes(c.toLowerCase()));
            if (matched) { s.device = matched; return; }
        }
        const directMatch = fallbackMap.get(lower);
        if (directMatch) s.device = directMatch;
    });
}

function getCanonicalDeviceList() {
    if (deviceCatalog.length) {
        return deviceCatalog.map(d => d.device || d.device_name).filter(Boolean).sort();
    }
    return [...new Set(sessions.map(item => item.device))].sort();
}

function isSuccessfulSession(item) {
    return (item?.mode === 'Thực hành' || item?.mode === 'practice') && item?.isPassed === true;
}

function hasCompleteAttemptEvidence(item) {
    return item?.attemptSequenceComplete !== false;
}

function isRateEligiblePracticeSession(item) {
    return hasCompleteAttemptEvidence(item) && item?.isPassed !== null && item?.isPassed !== undefined;
}

function getCanonicalLabList() {
    if (deviceCatalog.length) {
        return [...new Set(deviceCatalog.flatMap(device => device.labs || []).filter(Boolean))]
            .sort((a, b) => a.localeCompare(b, 'vi'));
    }
    return [...new Set(sessions.map(item => item.lab).filter(Boolean))]
        .sort((a, b) => a.localeCompare(b, 'vi'));
}

function mergeUntouchedFilterSets(allKtvs, allDevices, allLabs, allRegions) {
    if (!state.realtimeKtvsTouched) state.realtimeSelectedKtvs = new Set(allKtvs);
    if (!state.learnerKtvsTouched) state.learnerSelectedKtvs = new Set(allKtvs);
    if (!state.learnerEmailsTouched) state.learnerSelectedEmails = new Set(allKtvs);
    if (!state.learnerRegionsTouched) state.learnerSelectedRegions = new Set(allRegions);
    if (!state.learnerDevicesTouched) state.learnerSelectedDevices = new Set(allDevices);
    if (!state.learnerLabsTouched) state.learnerSelectedLabs = new Set(allLabs);
    if (!state.realtimeDevicesTouched) state.realtimeSelectedDevices = new Set(allDevices);
    if (!state.realtimeLabsTouched) state.realtimeSelectedLabs = new Set(allLabs);
}

function mergeDefaultClassLearners() {
    const defaultClass = state.instructorClasses.find(item => item.id === 'class-default');
    if (!defaultClass) return;
    const learners = getInstructorLearners();
    if (!learners.length) return;
    const merged = [...new Set([...(defaultClass.members || []), ...learners])].sort((a, b) => a.localeCompare(b, 'vi'));
    if (merged.length !== defaultClass.members.length) {
        defaultClass.members = merged;
        saveInstructorClasses();
    }
}

function refreshFilterOptionLists() {
    const allKtvs = [...new Set(sessions.map(item => item.learner))].sort();
    const allDevices = getCanonicalDeviceList();
    const allLabs = getCanonicalLabList();
    const allRegions = [...new Set(sessions.map(item => item.region))].sort((a, b) => a.localeCompare(b, 'vi'));
    const universes = state.popoverUniverses;
    if (universes) {
        universes.allKtvs.splice(0, universes.allKtvs.length, ...allKtvs);
        universes.allDevices.splice(0, universes.allDevices.length, ...allDevices);
        universes.allLabs.splice(0, universes.allLabs.length, ...allLabs);
        universes.allRegions.splice(0, universes.allRegions.length, ...allRegions);
    }
    populatePopoverOptions('realtimeKtvOptions', allKtvs, state.realtimeSelectedKtvs, () => { state.realtimeKtvsTouched = true; }, state.realtimeSearchKtv, getLearnerName);
    populatePopoverOptions('realtimeDeviceOptions', allDevices, state.realtimeSelectedDevices, () => { state.realtimeDevicesTouched = true; }, state.realtimeSearchDevice);
    populatePopoverOptions('realtimeLabOptions', allLabs, state.realtimeSelectedLabs, () => { state.realtimeLabsTouched = true; }, state.realtimeSearchLab);
    populatePopoverOptions('learnerKtvOptions', allKtvs, state.learnerSelectedKtvs, () => { state.learnerKtvsTouched = true; }, state.learnerSearchKtv, getLearnerName);
    populatePopoverOptions('learnerEmailOptions', allKtvs, state.learnerSelectedEmails, () => { state.learnerEmailsTouched = true; });
    populatePopoverOptions('learnerRegionOptions', allRegions, state.learnerSelectedRegions, () => { state.learnerRegionsTouched = true; });
    populatePopoverOptions('learnerDeviceOptions', allDevices, state.learnerSelectedDevices, () => { state.learnerDevicesTouched = true; });
    populatePopoverOptions('learnerLabOptions', allLabs, state.learnerSelectedLabs, () => { state.learnerLabsTouched = true; });
}

async function refreshDashboardData({ force = false, announce = false } = {}) {
    if (activeDashboardView === 'roster' && !force) return false;
    if (dashboardRefreshInFlight || (document.hidden && !force)) return false;
    dashboardRefreshInFlight = true;
    setRefreshButtonBusy(true);
    setDashboardSyncState('syncing', 'Đang kiểm tra dữ liệu mới nhất');
    try {
        let version = '';
        try {
            version = await fetchDashboardVersion();
        } catch (error) {
            console.warn('Không đọc được phiên bản dashboard; tiếp tục đồng bộ dữ liệu chính.', error);
        }
        if (!force && version !== '' && version === lastDashboardVersion) {
            state.lastSuccessfulRefreshAt = new Date();
            setDashboardSyncState('ready');
            return false;
        }
        const data = await fetchDashboardData(version);
        const previousReportStatus = state.dashboardReportStatus;
        state.dashboardReportStatus = data.reportStatus || (data.report ? 'ready' : 'unavailable');
        const signature = buildDashboardSignature(data.raw);
        if (!force && signature === lastDashboardSignature) {
            state.lastSuccessfulRefreshAt = new Date();
            setDashboardSyncState('ready');
            if (previousReportStatus !== state.dashboardReportStatus) renderAll();
            return false;
        }
        lastDashboardSignature = signature;
        lastDashboardVersion = data.version || version;
        applyDashboardData(data);
        const allKtvs = [...new Set(sessions.map(item => item.learner))].sort();
        const allDevices = getCanonicalDeviceList();
        const allLabs = getCanonicalLabList();
        const allRegions = [...new Set(sessions.map(item => item.region))].sort((a, b) => a.localeCompare(b, 'vi'));
        mergeUntouchedFilterSets(allKtvs, allDevices, allLabs, allRegions);
        refreshFilterOptionLists();
        mergeDefaultClassLearners();
        renderAll();
        state.lastSuccessfulRefreshAt = new Date();
        setDashboardSyncState('ready');
        if (announce) showToast('Dashboard đã được cập nhật với dữ liệu mới nhất.', 'success');
        return true;
    } catch (error) {
        console.warn('Đồng bộ dashboard thất bại; giữ dữ liệu gần nhất.', error);
        setDashboardSyncState(navigator.onLine ? 'stale' : 'offline', state.lastSuccessfulRefreshAt
            ? formatDashboardSyncDetail(state.lastSuccessfulRefreshAt)
            : 'Không thể kết nối tới máy chủ');
        if (announce) showToast('Không thể làm mới dữ liệu. Dashboard vẫn giữ bản gần nhất.', 'error');
        return false;
    } finally {
        dashboardRefreshInFlight = false;
        setRefreshButtonBusy(false);
    }
}

function startDashboardPolling() {
    if (dashboardPollTimer) return;
    dashboardPollTimer = setInterval(refreshDashboardData, DASHBOARD_POLL_INTERVAL_MS);
}

async function loadDashboardFromApi() {
    if (dashboardLoadRequest) return dashboardLoadRequest;
    dashboardLoadRequest = (async () => {
        setDashboardLoading(!state.dashboardDataLoaded, 'Đang đồng bộ dữ liệu dashboard...');
        setDashboardSyncState('syncing', 'Đang tải dữ liệu vận hành');
        try {
            setDataSourceLabel('Đang đồng bộ dữ liệu vận hành');
            renderAll();

            const data = await fetchDashboardData();
            lastDashboardSignature = buildDashboardSignature(data.raw);
            lastDashboardVersion = data.version || '';
            applyDashboardData(data);

            state.selectedLearner = '';
            state.learnerTablePage = 1;
            state.learnerDetailPage = 1;
            state.lastSuccessfulRefreshAt = new Date();
            setDataSourceLabel('Dữ liệu vận hành đã đồng bộ');
            setDashboardSyncState('ready');
            mergeUntouchedFilterSets(
                [...new Set(sessions.map(item => item.learner))].sort(),
                getCanonicalDeviceList(),
                getCanonicalLabList(),
                [...new Set(sessions.map(item => item.region))].sort((a, b) => a.localeCompare(b, 'vi'))
            );
            initFilters();
            initPopovers();
            renderAll();
            return true;
        } catch (error) {
            console.warn('Không kết nối được dữ liệu dashboard.', error);
            if (!state.dashboardDataLoaded) {
                sessions = [];
                deviceCatalog = [];
                technicianCatalog = [];
                trainingAssignments = [];
                dashboardReport = null;
                state.dashboardReportStatus = 'unavailable';
                technicianCatalogAuthoritative = false;
                rebuildTechnicianIndex();
                rebuildLearnerNameMap();
            }
            setDataSourceLabel('Không thể đồng bộ dữ liệu');
            setDashboardSyncState(navigator.onLine ? 'stale' : 'offline', 'Không thể kết nối tới máy chủ');
            initFilters();
            initPopovers();
            renderAll();
            return false;
        } finally {
            setDashboardLoading(false);
            dashboardLoadRequest = null;
            startDashboardPolling();
        }
    })();
    return dashboardLoadRequest;
}

async function guardDashboardAdmin() {
    let response;
    try {
        response = await fetch(`${API_BASE_URL}/auth/session`);
    } catch (error) {
        console.warn('Không thể xác minh phiên quản trị.', error);
        setDataSourceLabel('Không thể xác minh phiên quản trị');
        setDashboardLoading(false);
        return false;
    }
    const user = response.ok ? (await response.json().catch(() => null))?.user : null;
    const role = String(user?.role || '').toUpperCase();
    const isAdmin = Boolean(user && (user.isAdmin ?? user.is_admin ?? user.permissions?.admin ?? ['ADMIN', 'DEV'].includes(role)));
    if (!isAdmin) {
        window.location.replace(`${window.location.origin}/`);
        return false;
    }
    state.currentUser = user;
    state.isAdmin = true;
    state.canExportReports = Boolean(
        user.canExportReports
        ?? user.can_export_reports
        ?? user.permissions?.exportReports
        ?? user.permissions?.export_reports
        ?? role === 'DEV'
    );
    applyReportExportPermission();
    return true;
}

function applyReportExportPermission() {
    const button = document.getElementById('exportBtn');
    if (!button) return;
    button.hidden = !state.canExportReports;
    button.disabled = !state.canExportReports;
    button.setAttribute('aria-hidden', state.canExportReports ? 'false' : 'true');
}

function ensureReportExportAllowed() {
    if (state.canExportReports) return true;
    showToast('Chỉ tài khoản có role DEV mới được xuất báo cáo.', 'error');
    return false;
}

async function loadInitialDashboardData() {
    if (!(await guardDashboardAdmin())) return;
    if (activeDashboardView === 'roster') {
        setDataSourceLabel('Hồ sơ KTV từ cơ sở dữ liệu');
        await loadRosterList();
        setDashboardLoading(false);
        return;
    }
    await loadDashboardFromApi();

    const requestedLearner = new URLSearchParams(window.location.search).get('learner');
    if (activeDashboardView === 'technicians' && requestedLearner && sessions.some(item => item.learner === requestedLearner)) {
        state.selectedLearner = requestedLearner;
        state.learnerDetailPage = 1;
        renderAll();
    }

}

function initFilters() {
    if (state.filtersBound) return;
    state.filtersBound = true;

}

let suppressFilterRender = false;
let deferredFilterCallback = null;
let headerFilterSequence = 0;

function getHeaderFilterDropdown(wrapper) {
    return wrapper?._floatingDropdown
        || wrapper?._headerFilterDropdown
        || wrapper?.querySelector('.popover-dropdown');
}

function snapshotHeaderFilterDraft(wrapper) {
    const dropdown = getHeaderFilterDropdown(wrapper);
    if (!dropdown) return;
    wrapper._headerFilterSnapshot = new Map(
        [...dropdown.querySelectorAll('.popover-option input[type="checkbox"]')]
            .map(checkbox => [checkbox, checkbox.checked])
    );
    wrapper._headerFilterDirty = false;
}

function restoreHeaderFilterDraft(wrapper) {
    if (!wrapper?._headerFilterSnapshot || !wrapper._headerFilterDirty) return;
    wrapper._headerFilterSnapshot.forEach((checked, checkbox) => {
        if (checkbox.isConnected) checkbox.checked = checked;
    });
    wrapper._headerFilterDirty = false;
}

function closeHeaderFilterPopover(wrapper, { restoreFocus = false, discardDraft = true } = {}) {
    if (!wrapper) return;
    const trigger = wrapper.querySelector('.popover-trigger-btn, .select-popover-btn, .compact-trigger');
    const dropdown = getHeaderFilterDropdown(wrapper);
    if (discardDraft) restoreHeaderFilterDraft(wrapper);
    wrapper.classList.remove('open');
    dropdown?.classList.remove('open');
    trigger?.setAttribute('aria-expanded', 'false');
    if (restoreFocus) trigger?.focus();
}

function openHeaderFilterPopover(wrapper) {
    if (!wrapper) return;
    document.querySelectorAll('.header-filter-popover.open').forEach(openWrapper => {
        if (openWrapper !== wrapper) closeHeaderFilterPopover(openWrapper);
    });
    snapshotHeaderFilterDraft(wrapper);
    wrapper.classList.add('open');
    positionHeaderFilterDropdown(wrapper, true);
    const dropdown = getHeaderFilterDropdown(wrapper);
    window.requestAnimationFrame(() => {
        const target = dropdown?.querySelector('.header-filter-search, input:not([disabled]), button:not([disabled])');
        target?.focus();
    });
}

function enhanceHeaderFilterPopovers(root = document) {
    root.querySelectorAll('thead .popover-filter-wrapper').forEach(wrapper => {
        if (wrapper.closest('#rosterListPanel')) return;
        if (wrapper.classList.contains('ktv-header-filter')) return;
        const trigger = wrapper.querySelector('.popover-trigger-btn');
        const dropdown = wrapper.querySelector('.popover-dropdown');
        if (!trigger || !dropdown || dropdown.dataset.headerFilterEnhanced === 'true') return;

        dropdown.dataset.headerFilterEnhanced = 'true';
        dropdown.classList.add('header-filter-menu');
        wrapper.classList.add('header-filter-popover');
        wrapper._headerFilterDropdown = dropdown;
        if (!dropdown.id) dropdown.id = `headerFilterMenu${++headerFilterSequence}`;
        dropdown.setAttribute('role', 'dialog');
        dropdown.setAttribute('aria-modal', 'false');
        dropdown.setAttribute('aria-label', `Bộ lọc ${trigger.textContent.trim() || 'bảng dữ liệu'}`);
        trigger.setAttribute('aria-haspopup', 'dialog');
        trigger.setAttribute('aria-expanded', 'false');
        trigger.setAttribute('aria-controls', dropdown.id);

        const commandRow = document.createElement('div');
        commandRow.className = 'header-filter-command-row';
        commandRow.innerHTML = `
            <button type="button" data-filter-command="all">Chọn tất cả</button>
            <button type="button" data-filter-command="none">Bỏ chọn</button>
        `;
        dropdown.prepend(commandRow);

        let searchInput = dropdown.querySelector('.popover-search');
        if (!searchInput) {
            searchInput = document.createElement('input');
            searchInput.type = 'text';
            searchInput.className = 'popover-search header-filter-search';
            searchInput.placeholder = 'Tìm giá trị...';
            commandRow.insertAdjacentElement('afterend', searchInput);
        }
        searchInput.setAttribute('aria-label', `Tìm trong ${dropdown.getAttribute('aria-label').toLocaleLowerCase('vi')}`);

        searchInput.addEventListener('input', event => {
            event.stopImmediatePropagation();
            const keyword = searchInput.value.trim().toLocaleLowerCase('vi');
            dropdown.querySelectorAll('.popover-option').forEach(option => {
                option.hidden = keyword && !option.textContent.toLocaleLowerCase('vi').includes(keyword);
            });
        }, { capture: true });

        dropdown.addEventListener('change', event => {
            if (dropdown._committingFilterDraft || !event.target.matches('.popover-option input[type="checkbox"]')) return;
            event.stopImmediatePropagation();
            wrapper._headerFilterDirty = true;
        }, { capture: true });

        const updateVisibleCheckboxes = (checked) => {
            const checkboxes = [...dropdown.querySelectorAll('.popover-option:not([hidden]) input[type="checkbox"]')];
            checkboxes.forEach(checkbox => {
                checkbox.checked = checked;
            });
            wrapper._headerFilterDirty = true;
        };

        commandRow.querySelector('[data-filter-command="all"]')?.addEventListener('click', () => updateVisibleCheckboxes(true));
        commandRow.querySelector('[data-filter-command="none"]')?.addEventListener('click', () => updateVisibleCheckboxes(false));

        let footer = dropdown.querySelector('.popover-footer');
        if (!footer) {
            footer = document.createElement('div');
            footer.className = 'popover-footer';
            dropdown.appendChild(footer);
        }
        footer.classList.add('header-filter-footer');
        footer.querySelectorAll('.popover-btn-clear').forEach(clearButton => {
            clearButton.addEventListener('click', event => {
                event.preventDefault();
                event.stopImmediatePropagation();
                searchInput.value = '';
                dropdown.querySelectorAll('.popover-option').forEach(option => { option.hidden = false; });
                dropdown.querySelectorAll('.popover-option input[type="checkbox"]').forEach(checkbox => {
                    checkbox.checked = true;
                });
                wrapper._headerFilterDirty = true;
            }, { capture: true });
        });
        const applyButton = document.createElement('button');
        applyButton.type = 'button';
        applyButton.className = 'header-filter-apply';
        applyButton.textContent = 'Áp dụng';
        applyButton.addEventListener('click', () => {
            const snapshot = wrapper._headerFilterSnapshot || new Map();
            const changedCheckboxes = [...dropdown.querySelectorAll('.popover-option input[type="checkbox"]')]
                .filter(checkbox => snapshot.get(checkbox) !== checkbox.checked);
            suppressFilterRender = true;
            deferredFilterCallback = null;
            dropdown._committingFilterDraft = true;
            try {
                changedCheckboxes.forEach(checkbox => {
                    checkbox.dispatchEvent(new Event('change', { bubbles: true }));
                });
            } finally {
                dropdown._committingFilterDraft = false;
                suppressFilterRender = false;
            }
            const callback = deferredFilterCallback;
            deferredFilterCallback = null;
            snapshotHeaderFilterDraft(wrapper);
            closeHeaderFilterPopover(wrapper, { restoreFocus: true, discardDraft: false });
            state.realtimePage = 1;
            state.learnerTablePage = 1;
            state.learnerDetailPage = 1;
            if (callback) callback();
            renderAll();
        });
        footer.appendChild(applyButton);
        dropdown.addEventListener('keydown', event => {
            if (event.key === 'Escape') {
                event.preventDefault();
                event.stopPropagation();
                closeHeaderFilterPopover(wrapper, { restoreFocus: true });
                return;
            }
            trapDialogFocus(event, dropdown);
        });
    });
}

function positionHeaderFilterDropdown(wrapper, shouldOpen) {
    const trigger = wrapper.querySelector('.popover-trigger-btn, .select-popover-btn, .compact-trigger');
    const dropdown = wrapper._floatingDropdown
        || wrapper._headerFilterDropdown
        || wrapper.querySelector('.popover-dropdown');
    if (!trigger || !dropdown) return;
    wrapper._floatingDropdown = dropdown;

    if (!shouldOpen) {
        dropdown.classList.remove('open');
        trigger.setAttribute('aria-expanded', 'false');
        return;
    }

    const rect = trigger.getBoundingClientRect();
    if (rect.bottom < 0 || rect.top > window.innerHeight) {
        wrapper.classList.remove('open');
        dropdown.classList.remove('open');
        trigger.setAttribute('aria-expanded', 'false');
        return;
    }

    dropdown.classList.add('header-filter-floating', 'open');
    dropdown.style.visibility = 'hidden';
    if (dropdown.parentElement !== document.body) document.body.appendChild(dropdown);

    const dropdownRect = dropdown.getBoundingClientRect();
    const panelWidth = dropdownRect.width || 318;
    const panelHeight = dropdownRect.height || 320;
    const left = Math.max(12, Math.min(window.innerWidth - panelWidth - 12, rect.left));
    const spaceBelow = window.innerHeight - rect.bottom - 12;
    const openAbove = spaceBelow < panelHeight && rect.top > panelHeight + 12;
    const top = openAbove ? rect.top - panelHeight - 7 : rect.bottom + 7;

    dropdown.style.left = `${left}px`;
    dropdown.style.top = `${Math.max(12, Math.min(window.innerHeight - panelHeight - 12, top))}px`;
    dropdown.style.visibility = 'visible';
    trigger.setAttribute('aria-expanded', 'true');
}

let floatingFilterFrame = 0;
function refreshOpenFilterDropdowns() {
    if (floatingFilterFrame) return;
    floatingFilterFrame = requestAnimationFrame(() => {
        floatingFilterFrame = 0;
        document.querySelectorAll('.popover-filter-wrapper.open').forEach(wrapper => {
            positionHeaderFilterDropdown(wrapper, true);
        });
    });
}

window.addEventListener('resize', refreshOpenFilterDropdowns);
window.addEventListener('scroll', (event) => {
    const target = event.target;
    if (target instanceof Element && target.closest('.popover-dropdown.open')) return;
    refreshOpenFilterDropdowns();
}, true);

function initPopovers() {
    if (state.popoversInitialized) {
        refreshFilterOptionLists();
        return;
    }
    state.popoversInitialized = true;
    const allKtvs = [...new Set(sessions.map(item => item.learner))].sort();
    const allDevices = getCanonicalDeviceList();
    const allLabs = getCanonicalLabList();
    const allRegions = [...new Set(sessions.map(item => item.region))].sort((a, b) => a.localeCompare(b, 'vi'));
    state.popoverUniverses = { allKtvs, allDevices, allLabs, allRegions };
    let learnerSearchTimer = null;
    let detailDeviceSearchTimer = null;
    let detailLabSearchTimer = null;

    // Fill sets with all items by default on initial load
    if (state.realtimeSelectedKtvs.size === 0 && !state.realtimeKtvsTouched) {
        state.realtimeSelectedKtvs = new Set(allKtvs);
    }
    if (state.realtimeSelectedLabs.size === 0 && !state.realtimeLabsTouched) {
        state.realtimeSelectedLabs = new Set(allLabs);
    }
    if (state.learnerSelectedKtvs.size === 0 && !state.learnerKtvsTouched) {
        state.learnerSelectedKtvs = new Set(allKtvs);
    }
    if (state.learnerSelectedEmails.size === 0 && !state.learnerEmailsTouched) {
        state.learnerSelectedEmails = new Set(allKtvs);
    }
    if (state.learnerSelectedRegions.size === 0 && !state.learnerRegionsTouched) {
        state.learnerSelectedRegions = new Set(allRegions);
    }
    if (state.learnerSelectedDevices.size === 0 && !state.learnerDevicesTouched) {
        state.learnerSelectedDevices = new Set(allDevices);
    }
    if (state.learnerSelectedLabs.size === 0 && !state.learnerLabsTouched) {
        state.learnerSelectedLabs = new Set(allLabs);
    }
    if (state.realtimeSelectedDevices.size === 0 && !state.realtimeDevicesTouched) {
        state.realtimeSelectedDevices = new Set(allDevices);
    }
    // 1. Realtime KTV Popover
    populatePopoverOptions('realtimeKtvOptions', allKtvs, state.realtimeSelectedKtvs, () => { state.realtimeKtvsTouched = true; }, state.realtimeSearchKtv, getLearnerName);
    document.getElementById('realtimeKtvSearch')?.addEventListener('input', (e) => {
        state.realtimeSearchKtv = e.target.value;
        populatePopoverOptions('realtimeKtvOptions', allKtvs, state.realtimeSelectedKtvs, () => { state.realtimeKtvsTouched = true; }, state.realtimeSearchKtv, getLearnerName);
    });
    document.getElementById('realtimeKtvClear')?.addEventListener('click', (e) => {
        e.stopPropagation();
        state.realtimeSelectedKtvs = new Set(allKtvs);
        state.realtimeKtvsTouched = false;
        state.realtimeSearchKtv = '';
        const searchInput = document.getElementById('realtimeKtvSearch');
        if (searchInput) searchInput.value = '';
        populatePopoverOptions('realtimeKtvOptions', allKtvs, state.realtimeSelectedKtvs, () => { state.realtimeKtvsTouched = true; }, undefined, getLearnerName);
        renderAll();
    });

    // 2. Realtime Mode Popover
    document.querySelectorAll('#realtimeModeOptions input[type="checkbox"]').forEach(chk => {
        chk.addEventListener('change', () => {
            if (chk.checked) {
                state.realtimeSelectedModes.add(chk.value);
            } else {
                state.realtimeSelectedModes.delete(chk.value);
            }
            state.realtimePage = 1;
            if (!suppressFilterRender) renderAll();
        });
    });
    document.getElementById('realtimeModeClear')?.addEventListener('click', (e) => {
        e.stopPropagation();
        state.realtimeSelectedModes = new Set(['Thực hành', 'Hướng dẫn']);
        document.querySelectorAll('#realtimeModeOptions input[type="checkbox"]').forEach(chk => chk.checked = true);
        renderAll();
    });

    // 3. Realtime Device Popover
    populatePopoverOptions('realtimeDeviceOptions', allDevices, state.realtimeSelectedDevices, () => { state.realtimeDevicesTouched = true; }, state.realtimeSearchDevice);
    document.getElementById('realtimeDeviceSearch')?.addEventListener('input', (e) => {
        state.realtimeSearchDevice = e.target.value;
        populatePopoverOptions('realtimeDeviceOptions', allDevices, state.realtimeSelectedDevices, () => { state.realtimeDevicesTouched = true; }, state.realtimeSearchDevice);
    });
    document.getElementById('realtimeDeviceClear')?.addEventListener('click', (e) => {
        e.stopPropagation();
        state.realtimeSelectedDevices = new Set(allDevices);
        state.realtimeDevicesTouched = false;
        state.realtimeSearchDevice = '';
        const searchInput = document.getElementById('realtimeDeviceSearch');
        if (searchInput) searchInput.value = '';
        populatePopoverOptions('realtimeDeviceOptions', allDevices, state.realtimeSelectedDevices, () => { state.realtimeDevicesTouched = true; });
        renderAll();
    });

    // 4. Realtime Lab Popover
    populatePopoverOptions('realtimeLabOptions', allLabs, state.realtimeSelectedLabs, () => { state.realtimeLabsTouched = true; }, state.realtimeSearchLab);
    document.getElementById('realtimeLabClear')?.addEventListener('click', (e) => {
        e.stopPropagation();
        state.realtimeSelectedLabs = new Set(allLabs);
        state.realtimeLabsTouched = false;
        state.realtimeSearchLab = '';
        const searchInput = document.querySelector('#realtimeLabDropdown .header-filter-search');
        if (searchInput) searchInput.value = '';
        populatePopoverOptions('realtimeLabOptions', allLabs, state.realtimeSelectedLabs, () => { state.realtimeLabsTouched = true; });
        renderAll();
    });

    // 5. Realtime Status Popover
    document.querySelectorAll('#realtimeStatusOptions input[type="checkbox"]').forEach(chk => {
        chk.addEventListener('change', () => {
            if (chk.checked) {
                state.realtimeSelectedStatuses.add(chk.value);
            } else {
                state.realtimeSelectedStatuses.delete(chk.value);
            }
            state.realtimePage = 1;
            if (!suppressFilterRender) renderAll();
        });
    });
    document.getElementById('realtimeStatusClear')?.addEventListener('click', (e) => {
        e.stopPropagation();
        state.realtimeSelectedStatuses = new Set(['Đạt', 'Chưa đạt', 'Chưa có kết quả', 'Không đánh giá']);
        document.querySelectorAll('#realtimeStatusOptions input[type="checkbox"]').forEach(chk => chk.checked = true);
        renderAll();
    });

    // 5. Learner table header filters
    populatePopoverOptions('learnerKtvOptions', allKtvs, state.learnerSelectedKtvs, () => {
        state.learnerKtvsTouched = true;
        updatePopoverTriggerLabels();
    }, state.learnerSearchKtv, getLearnerName);
    populatePopoverOptions('learnerEmailOptions', allKtvs, state.learnerSelectedEmails, () => {
        state.learnerEmailsTouched = true;
        updatePopoverTriggerLabels();
    });
    populatePopoverOptions('learnerRegionOptions', allRegions, state.learnerSelectedRegions, () => {
        state.learnerRegionsTouched = true;
        updatePopoverTriggerLabels();
    });
    populatePopoverOptions('learnerDeviceOptions', allDevices, state.learnerSelectedDevices, () => {
        state.learnerDevicesTouched = true;
        updatePopoverTriggerLabels();
    });
    populatePopoverOptions('learnerLabOptions', allLabs, state.learnerSelectedLabs, () => {
        state.learnerLabsTouched = true;
        updatePopoverTriggerLabels();
    });
    document.getElementById('learnerKtvSearch')?.addEventListener('input', (e) => {
        state.learnerSearchKtv = e.target.value;
        state.learnerTablePage = 1;
        window.clearTimeout(learnerSearchTimer);
        learnerSearchTimer = window.setTimeout(renderAll, 180);
    });
    const repopulateLearnerFilters = () => {
        populatePopoverOptions('learnerKtvOptions', allKtvs, state.learnerSelectedKtvs, () => { state.learnerKtvsTouched = true; }, undefined, getLearnerName);
        populatePopoverOptions('learnerEmailOptions', allKtvs, state.learnerSelectedEmails, () => { state.learnerEmailsTouched = true; });
        populatePopoverOptions('learnerRegionOptions', allRegions, state.learnerSelectedRegions, () => { state.learnerRegionsTouched = true; });
        populatePopoverOptions('learnerDeviceOptions', allDevices, state.learnerSelectedDevices, () => { state.learnerDevicesTouched = true; });
        populatePopoverOptions('learnerLabOptions', allLabs, state.learnerSelectedLabs, () => { state.learnerLabsTouched = true; });
    };
    const clearHeaderSearch = (wrapperId) => {
        const searchInput = document.querySelector(`#${wrapperId} .header-filter-search`)
            || document.getElementById(wrapperId)?._floatingDropdown?.querySelector('.header-filter-search');
        if (searchInput) searchInput.value = '';
    };
    const resetLearnerFilters = () => {
        state.learnerSelectedKtvs = new Set(allKtvs);
        state.learnerSelectedEmails = new Set(allKtvs);
        state.learnerSelectedRegions = new Set(allRegions);
        state.learnerSelectedDevices = new Set(allDevices);
        state.learnerSelectedLabs = new Set(allLabs);
        state.learnerKtvsTouched = false;
        state.learnerEmailsTouched = false;
        state.learnerRegionsTouched = false;
        state.learnerDevicesTouched = false;
        state.learnerLabsTouched = false;
        state.learnerSearchKtv = '';
        state.learnerTablePage = 1;
        const searchInput = document.getElementById('learnerKtvSearch');
        if (searchInput) searchInput.value = '';
        clearHeaderSearch('learnerKtvPopoverWrapper');
        clearHeaderSearch('learnerEmailPopoverWrapper');
        clearHeaderSearch('learnerRegionPopoverWrapper');
        clearHeaderSearch('learnerDevicePopoverWrapper');
        clearHeaderSearch('learnerLabPopoverWrapper');
        repopulateLearnerFilters();
        renderAll();
    };
    document.getElementById('learnerKtvClear')?.addEventListener('click', (e) => {
        e.stopPropagation();
        state.learnerSelectedKtvs = new Set(allKtvs);
        state.learnerKtvsTouched = false;
        clearHeaderSearch('learnerKtvPopoverWrapper');
        repopulateLearnerFilters();
        renderAll();
    });
    document.getElementById('learnerEmailClear')?.addEventListener('click', (e) => {
        e.stopPropagation();
        state.learnerSelectedEmails = new Set(allKtvs);
        state.learnerEmailsTouched = false;
        clearHeaderSearch('learnerEmailPopoverWrapper');
        repopulateLearnerFilters();
        renderAll();
    });
    document.getElementById('learnerRegionClear')?.addEventListener('click', (e) => {
        e.stopPropagation();
        state.learnerSelectedRegions = new Set(allRegions);
        state.learnerRegionsTouched = false;
        clearHeaderSearch('learnerRegionPopoverWrapper');
        repopulateLearnerFilters();
        renderAll();
    });
    document.getElementById('learnerDeviceClear')?.addEventListener('click', (e) => {
        e.stopPropagation();
        state.learnerSelectedDevices = new Set(allDevices);
        state.learnerDevicesTouched = false;
        clearHeaderSearch('learnerDevicePopoverWrapper');
        repopulateLearnerFilters();
        renderAll();
    });
    document.getElementById('learnerLabClear')?.addEventListener('click', (e) => {
        e.stopPropagation();
        state.learnerSelectedLabs = new Set(allLabs);
        state.learnerLabsTouched = false;
        clearHeaderSearch('learnerLabPopoverWrapper');
        repopulateLearnerFilters();
        renderAll();
    });
    document.getElementById('learnerFilterReset')?.addEventListener('click', resetLearnerFilters);

    // 6. Learner Detail Mode Popover
    document.querySelectorAll('#detailModeOptions input[type="checkbox"]').forEach(chk => {
        chk.addEventListener('change', () => {
            if (chk.checked) {
                state.detailSelectedModes.add(chk.value);
            } else {
                state.detailSelectedModes.delete(chk.value);
            }
            state.learnerDetailPage = 1;
            if (!suppressFilterRender) renderAll();
        });
    });
    document.getElementById('detailModeClear')?.addEventListener('click', (e) => {
        e.stopPropagation();
        state.detailSelectedModes = new Set(['Thực hành', 'Hướng dẫn']);
        document.querySelectorAll('#detailModeOptions input[type="checkbox"]').forEach(chk => chk.checked = true);
        renderAll();
    });

    // 7. Learner Detail Device Search
    document.getElementById('detailDeviceSearch')?.addEventListener('input', (e) => {
        state.detailSearchDevice = e.target.value;
        window.clearTimeout(detailDeviceSearchTimer);
        detailDeviceSearchTimer = window.setTimeout(renderAll, 180);
    });
    document.getElementById('detailDeviceClear')?.addEventListener('click', (e) => {
        e.stopPropagation();
        state.detailDevicesTouched = false;
        state.detailSelectedDevices.clear();
        state.detailSearchDevice = '';
        const searchInput = document.getElementById('detailDeviceSearch');
        if (searchInput) searchInput.value = '';
        renderAll();
    });

    // 8. Learner Detail Lab Search
    document.getElementById('detailLabSearch')?.addEventListener('input', (e) => {
        state.detailSearchLab = e.target.value;
        window.clearTimeout(detailLabSearchTimer);
        detailLabSearchTimer = window.setTimeout(renderAll, 180);
    });
    document.getElementById('detailLabClear')?.addEventListener('click', (e) => {
        e.stopPropagation();
        state.detailLabsTouched = false;
        state.detailSelectedLabs.clear();
        state.detailSearchLab = '';
        const searchInput = document.getElementById('detailLabSearch');
        if (searchInput) searchInput.value = '';
        renderAll();
    });

    // 9. Learner Detail Status Popover
    document.querySelectorAll('#detailStatusOptions input[type="checkbox"]').forEach(chk => {
        chk.addEventListener('change', () => {
            if (chk.checked) {
                state.detailSelectedStatuses.add(chk.value);
            } else {
                state.detailSelectedStatuses.delete(chk.value);
            }
            state.learnerDetailPage = 1;
            if (!suppressFilterRender) renderAll();
        });
    });
    document.getElementById('detailStatusClear')?.addEventListener('click', (e) => {
        e.stopPropagation();
        state.detailSelectedStatuses = new Set(['Đạt', 'Chưa đạt', 'Chưa có kết quả', 'Không đánh giá']);
        document.querySelectorAll('#detailStatusOptions input[type="checkbox"]').forEach(chk => chk.checked = true);
        renderAll();
    });

    // Bind triggers toggle
    document.querySelectorAll('.popover-filter-wrapper').forEach(wrapper => {
        const btn = wrapper.querySelector('.popover-trigger-btn, .select-popover-btn, .compact-trigger');
        btn?.addEventListener('click', (e) => {
            e.stopPropagation();
            const isOpen = wrapper.classList.contains('open');
            document.querySelectorAll('.popover-filter-wrapper').forEach(w => {
                if (w.classList.contains('header-filter-popover')) closeHeaderFilterPopover(w);
                else {
                    w.classList.remove('open');
                    w.querySelector('.popover-trigger-btn')?.setAttribute('aria-expanded', 'false');
                    positionHeaderFilterDropdown(w, false);
                }
            });
            if (!isOpen) {
                if (wrapper.classList.contains('header-filter-popover')) openHeaderFilterPopover(wrapper);
                else {
                    wrapper.classList.add('open');
                    btn.setAttribute('aria-expanded', 'true');
                    positionHeaderFilterDropdown(wrapper, true);
                }
            }
        });
        wrapper.querySelector('.popover-dropdown')?.addEventListener('click', (e) => {
            e.stopPropagation();
        });
    });

    document.addEventListener('click', () => {
        document.querySelectorAll('.popover-filter-wrapper').forEach(w => {
            if (w.classList.contains('header-filter-popover')) closeHeaderFilterPopover(w);
            else {
                w.classList.remove('open');
                w.querySelector('.popover-trigger-btn')?.setAttribute('aria-expanded', 'false');
                positionHeaderFilterDropdown(w, false);
            }
        });
    });

    enhanceHeaderFilterPopovers();
}

function renderRealtimeSubmissions(dateSessions) {
    const tbody = document.getElementById('realtimeSubmissionsBody');
    const meta = document.getElementById('realtimeSubmissionsMeta');
    const badge = document.getElementById('realtimeSubmissionBadge');
    if (!tbody) return;

    let filtered = dateSessions.filter(item => item.status !== 'Chưa thực hiện');

    // Filter by KTV popover
    filtered = filtered.filter(item => state.realtimeSelectedKtvs.has(item.learner));
    // Filter by Mode popover
    filtered = filtered.filter(item => state.realtimeSelectedModes.has(item.mode || 'Thực hành'));
    // Filter by Device popover
    filtered = filtered.filter(item => state.realtimeSelectedDevices.has(item.device));
    // Filter by Lab popover
    filtered = filtered.filter(item => state.realtimeSelectedLabs.has(item.lab));
    // Filter by Status popover
    filtered = filtered.filter(item => state.realtimeSelectedStatuses.has(item.status));

    // Sort by Date & Time
    filtered.sort((a, b) => {
        const timeA = parseDate(a.date).getTime() + (a.time ? parseTimeMs(a.time) : 0);
        const timeB = parseDate(b.date).getTime() + (b.time ? parseTimeMs(b.time) : 0);
        return state.realtimeTimeSortDir === 'asc' ? timeA - timeB : timeB - timeA;
    });

    if (badge) badge.textContent = `${filtered.length} bài nộp`;

    if (!filtered.length) {
        tbody.innerHTML = '<tr><td colspan="6" class="empty">Không có bài nộp nào phù hợp với bộ lọc.</td></tr>';
        if (meta) meta.innerHTML = '';
        return;
    }

    const pageSize = 5;
    const pageData = getPageSlice(filtered, state.realtimePage, pageSize);
    state.realtimePage = pageData.currentPage;

    tbody.innerHTML = pageData.rows.map(item => `
        <tr>
            <td><strong>${escapeHTML(formatDateTime(item.date, item.time))}</strong></td>
            <td><div class="learner-link" title="${escapeHTML(item.learner)}">${escapeHTML(getLearnerName(item.learner))}</div></td>
            <td><span class="mode-pill ${item.mode === 'Hướng dẫn' ? 'mode-guide' : 'mode-practice'}">${escapeHTML(item.mode || 'Thực hành')}</span></td>
            <td>${escapeHTML(item.device)}</td>
            <td>${escapeHTML(item.lab)}</td>
            <td><span class="status-pill ${getStatusClass(item.status)}">${escapeHTML(item.status)}</span></td>
        </tr>
    `).join('');

    if (meta) {
        meta.innerHTML = `
            <span>Hiển thị ${pageData.start + 1}-${pageData.end} / ${pageData.totalRows} bài nộp</span>
            <span class="table-page-controls">
                <button type="button" class="table-page-btn" data-realtime-page="prev" ${pageData.currentPage <= 1 ? 'disabled' : ''}>Trước</button>
                <span>Trang ${pageData.currentPage}/${pageData.totalPages}</span>
                <button type="button" class="table-page-btn" data-realtime-page="next" ${pageData.currentPage >= pageData.totalPages ? 'disabled' : ''}>Sau</button>
            </span>
        `;
        meta.querySelectorAll('[data-realtime-page]').forEach(button => {
            button.addEventListener('click', (event) => {
                event.stopPropagation();
                const action = button.dataset.realtimePage;
                state.realtimePage += action === 'next' ? 1 : -1;
                renderAll();
            });
        });
    }
}

function parseTimeMs(timeStr) {
    if (!timeStr) return 0;
    const parts = timeStr.split(':').map(Number);
    if (parts.length < 2 || parts.some(isNaN)) return 0;
    return (parts[0] * 3600 + parts[1] * 60) * 1000;
}


function getInstructorLearners() {
    const rosterLearners = technicianCatalog
        .filter(item => !item.isTerminated && item.email)
        .map(item => item.email);
    return [...new Set([...rosterLearners, ...sessions.map(item => item.learner).filter(Boolean)])]
        .sort((a, b) => a.localeCompare(b, 'vi'));
}

function getDatabaseInstructorClasses() {
    const classes = new Map();
    if (state.assignmentsLoaded) {
        const rosterSource = classMemberships.length ? classMemberships : trainingAssignments;
        rosterSource.forEach(item => {
            if (!item.classCode || !item.learner) return;
            if (!classes.has(item.classCode)) {
                classes.set(item.classCode, {
                    code: item.classCode,
                    name: item.className || item.classCode,
                    members: []
                });
            }
            classes.get(item.classCode).members.push(item.learner);
        });
    } else {
    technicianCatalog
        .filter(item => !item.isTerminated && item.email)
        .forEach(item => {
            const classCode = item.classCode || '';
            const key = classCode || '__unassigned__';
            if (!classes.has(key)) {
                classes.set(key, {
                    code: classCode,
                    name: item.className || classCode || 'Chưa xếp lớp',
                    members: []
                });
            }
            classes.get(key).members.push(item.email);
        });
    }
    return [...classes.entries()]
        .sort(([, left], [, right]) => left.name.localeCompare(right.name, 'vi'))
        .map(([key, item]) => ({
            id: `db-class-${key}`,
            code: item.code,
            name: item.name,
            members: [...new Set(item.members)].sort((a, b) => a.localeCompare(b, 'vi')),
            source: 'database'
        }));
}

function normalizeInstructorSearchText(value) {
    return String(value || '')
        .trim()
        .toLocaleLowerCase('vi')
        .normalize('NFD')
        .replace(/[\u0300-\u036f]/g, '')
        .replace(/đ/g, 'd');
}

function getInstructorLabNumber(label) {
    const match = String(label || '').match(/(?:^|\s)bài\s*0*(\d+)/i);
    return match ? Number(match[1]) : Number.POSITIVE_INFINITY;
}

function compareInstructorLabels(left, right) {
    const leftNumber = getInstructorLabNumber(left);
    const rightNumber = getInstructorLabNumber(right);
    if (leftNumber !== rightNumber) return leftNumber - rightNumber;
    return String(left || '').localeCompare(String(right || ''), 'vi', { numeric: true, sensitivity: 'base' });
}

function sortInstructorDeviceGroups(groups) {
    const deviceOrder = new Map();
    const labOrderByDevice = new Map();
    deviceCatalog.forEach((item, deviceIndex) => {
        const deviceName = item.device || item.device_name || item.model || '';
        if (!deviceName || deviceOrder.has(deviceName)) return;
        deviceOrder.set(deviceName, deviceIndex);
        labOrderByDevice.set(deviceName, new Map((item.labs || []).map((lab, labIndex) => [lab, labIndex])));
    });

    const rank = (map, key) => map?.has(key) ? map.get(key) : Number.POSITIVE_INFINITY;
    return groups
        .map(group => {
            const labOrder = labOrderByDevice.get(group.device);
            const labs = [...group.labs].sort((left, right) => {
                const leftRank = rank(labOrder, left);
                const rightRank = rank(labOrder, right);
                if (leftRank !== rightRank) return leftRank - rightRank;
                return compareInstructorLabels(left, right);
            });
            return { ...group, labs };
        })
        .sort((left, right) => {
            const leftRank = rank(deviceOrder, left.device);
            const rightRank = rank(deviceOrder, right.device);
            if (leftRank !== rightRank) return leftRank - rightRank;
            return left.device.localeCompare(right.device, 'vi', { numeric: true, sensitivity: 'base' });
        });
}

function getInstructorDeviceGroups(selectedClass = null, { includeAllActive = false } = {}) {
    const groups = [];
    const groupMap = new Map();
    const ensureGroup = (deviceName) => {
        const name = deviceName || 'Thiết bị chưa xác định';
        if (!groupMap.has(name)) {
            const group = { device: name, labs: [] };
            groupMap.set(name, group);
            groups.push(group);
        }
        return groupMap.get(name);
    };

    if (state.assignmentsLoaded && !includeAllActive) {
        const members = new Set(selectedClass?.members || []);
        trainingAssignments
            .filter(item => !selectedClass || (item.classCode === selectedClass.code && members.has(item.learner)))
            .forEach(item => {
                const group = ensureGroup(item.device);
                if (item.lab && !group.labs.includes(item.lab)) group.labs.push(item.lab);
            });
        return sortInstructorDeviceGroups(groups.filter(group => group.labs.length));
    }

    // dashboard/all only exposes active devices and active labs. The KTV-by-class
    // report requests this complete catalog regardless of class assignments.
    deviceCatalog.forEach(item => {
        const group = ensureGroup(item.device || item.device_name || item.model);
        (item.labs || []).forEach(lab => {
            if (lab && !group.labs.includes(lab)) group.labs.push(lab);
        });
    });
    if (groups.length) return sortInstructorDeviceGroups(groups);

    // Compatibility fallback for an installation whose catalog tables have not
    // been initialized yet.
    sessions.forEach(item => {
        const group = ensureGroup(item.device);
        if (item.lab && !group.labs.includes(item.lab)) group.labs.push(item.lab);
    });
    return sortInstructorDeviceGroups(groups.filter(group => group.labs.length));
}

function saveInstructorClasses() {
    // Class membership is authoritative in the employee database. Never persist
    // a competing roster in browser storage.
}

const searchableFilterSelectIds = [
    'instructorClassSelect',
    'instructorDeviceSelect',
    'rosterEmployeeIdFilter',
    'rosterNameFilter',
    'rosterEmailFilter',
    'rosterJobTitleFilter',
    'rosterRegionFilter',
    'rosterBranchFilter',
    'rosterClassFilter',
    'rosterStatusFilter',
    'classCodeFilter',
    'classNameFilter',
    'classStatusFilter'
];

const multiSelectFilterIds = new Set([
    'instructorDeviceSelect',
    'rosterEmployeeIdFilter',
    'rosterNameFilter',
    'rosterEmailFilter',
    'rosterJobTitleFilter',
    'rosterRegionFilter',
    'rosterBranchFilter',
    'rosterClassFilter',
    'rosterStatusFilter',
    'classCodeFilter',
    'classNameFilter',
    'classStatusFilter'
]);

const TABLE_COLUMN_WIDTH_STORAGE_KEY = 'ftc-dashboard-column-widths-v1';
const TABLE_COLUMN_MIN_WIDTH = 56;
const TABLE_COLUMN_MAX_WIDTH = 640;

function getDashboardTableKey(table) {
    if (table.id) return `id:${table.id}`;
    const scope = table.closest('[data-page-view], [id]');
    const scopeName = scope?.dataset?.pageView || scope?.id || 'dashboard';
    const scopeTables = [...(scope || document).querySelectorAll('table')];
    return `${scopeName}:table-${Math.max(0, scopeTables.indexOf(table))}`;
}

function normalizeClassMemberships(apiMemberships = []) {
    return apiMemberships
        .map(item => ({
            learner: String(item.email || item.learner || '').trim().toLowerCase(),
            classCode: item.class_code || item.classCode || '',
            className: item.class_name || item.className || item.class_code || item.classCode || ''
        }))
        .filter(item => item.learner && item.classCode);
}

function readDashboardColumnWidths() {
    try {
        const parsed = JSON.parse(window.localStorage.getItem(TABLE_COLUMN_WIDTH_STORAGE_KEY) || '{}');
        return parsed && typeof parsed === 'object' ? parsed : {};
    } catch (error) {
        return {};
    }
}

function writeDashboardColumnWidth(table, columnIndex, width) {
    try {
        const allWidths = readDashboardColumnWidths();
        const tableKey = getDashboardTableKey(table);
        if (!allWidths[tableKey]) allWidths[tableKey] = {};
        if (width === null) delete allWidths[tableKey][columnIndex];
        else allWidths[tableKey][columnIndex] = width;
        if (!Object.keys(allWidths[tableKey]).length) delete allWidths[tableKey];
        window.localStorage.setItem(TABLE_COLUMN_WIDTH_STORAGE_KEY, JSON.stringify(allWidths));
    } catch (error) {
        // Resizing remains available when browser storage is disabled.
    }
}

function getTableCellPlacements(table) {
    const grid = [];
    const placements = new Map();
    [...table.rows].forEach((row, rowIndex) => {
        if (!grid[rowIndex]) grid[rowIndex] = [];
        let columnIndex = 0;
        [...row.cells].forEach(cell => {
            while (grid[rowIndex][columnIndex]) columnIndex += 1;
            const columnSpan = Math.max(1, cell.colSpan || 1);
            const rowSpan = Math.max(1, cell.rowSpan || 1);
            placements.set(cell, { columnIndex, columnSpan });
            for (let rowOffset = 0; rowOffset < rowSpan; rowOffset += 1) {
                if (!grid[rowIndex + rowOffset]) grid[rowIndex + rowOffset] = [];
                for (let columnOffset = 0; columnOffset < columnSpan; columnOffset += 1) {
                    grid[rowIndex + rowOffset][columnIndex + columnOffset] = cell;
                }
            }
            columnIndex += columnSpan;
        });
    });
    return placements;
}

function getTableLeafCount(placements) {
    return Math.max(0, ...[...placements.values()].map(item => item.columnIndex + item.columnSpan));
}

function getColumnWidthVariable(table, columnIndex, leafCount) {
    if (table.matches('.class-matrix-table')) {
        if (columnIndex === 0) return '--ktv-stt-width';
        if (columnIndex === 1) return '--ktv-code-width';
        if (columnIndex === 2) return '--ktv-info-width';
        if (columnIndex === leafCount - 2) return '--ktv-total-width';
        if (columnIndex === leafCount - 1) return '--ktv-rate-width';
        return '';
    }
    if (table.matches('.instructor-progress-table')) {
        if (columnIndex === 0) return '--instructor-index-width';
        if (columnIndex === leafCount - 2) return '--instructor-total-width';
        if (columnIndex === leafCount - 1) return '--instructor-rate-width';
    }
    return '';
}

function applyDashboardColumnWidth(table, columnIndex, width) {
    const placements = getTableCellPlacements(table);
    const normalizedWidth = Math.max(TABLE_COLUMN_MIN_WIDTH, Math.min(TABLE_COLUMN_MAX_WIDTH, Math.round(width)));
    placements.forEach((placement, cell) => {
        if (placement.columnIndex !== columnIndex || placement.columnSpan !== 1) return;
        cell.style.setProperty('width', `${normalizedWidth}px`, 'important');
        cell.style.setProperty('min-width', `${normalizedWidth}px`, 'important');
        cell.style.setProperty('max-width', `${normalizedWidth}px`, 'important');
    });
    const variable = getColumnWidthVariable(table, columnIndex, getTableLeafCount(placements));
    if (variable) table.style.setProperty(variable, `${normalizedWidth}px`);
    return normalizedWidth;
}

function resetDashboardColumnWidth(table, columnIndex) {
    const placements = getTableCellPlacements(table);
    placements.forEach((placement, cell) => {
        if (placement.columnIndex !== columnIndex || placement.columnSpan !== 1) return;
        cell.style.removeProperty('width');
        cell.style.removeProperty('min-width');
        cell.style.removeProperty('max-width');
    });
    const variable = getColumnWidthVariable(table, columnIndex, getTableLeafCount(placements));
    if (variable) table.style.removeProperty(variable);
    writeDashboardColumnWidth(table, columnIndex, null);
}

function startDashboardColumnResize(event, table, header, columnIndex) {
    if (event.button !== 0) return;
    event.preventDefault();
    event.stopPropagation();
    const startX = event.clientX;
    const startWidth = header.getBoundingClientRect().width;
    const pointerId = event.pointerId;
    document.body.classList.add('table-column-resizing');
    event.currentTarget.setPointerCapture?.(pointerId);
    const move = moveEvent => {
        if (moveEvent.pointerId === pointerId) {
            applyDashboardColumnWidth(table, columnIndex, startWidth + moveEvent.clientX - startX);
        }
    };
    const finish = endEvent => {
        if (endEvent.pointerId !== pointerId) return;
        document.removeEventListener('pointermove', move);
        document.removeEventListener('pointerup', finish);
        document.removeEventListener('pointercancel', finish);
        document.body.classList.remove('table-column-resizing');
        writeDashboardColumnWidth(table, columnIndex, Math.round(header.getBoundingClientRect().width));
    };
    document.addEventListener('pointermove', move);
    document.addEventListener('pointerup', finish);
    document.addEventListener('pointercancel', finish);
}

function syncDashboardTableColumnResizers(table) {
    if (!table.tHead) return;
    const placements = getTableCellPlacements(table);
    const headerByColumn = new Map();
    [...table.tHead.querySelectorAll('th')].forEach(header => {
        const placement = placements.get(header);
        if (placement?.columnSpan === 1) headerByColumn.set(placement.columnIndex, header);
    });
    const storedWidths = readDashboardColumnWidths()[getDashboardTableKey(table)] || {};
    headerByColumn.forEach((header, columnIndex) => {
        header.classList.add('column-resizable');
        header.dataset.resizeColumnIndex = String(columnIndex);
        let handle = [...header.children].find(child => child.matches?.('.column-resize-handle'));
        if (!handle) {
            const label = header.textContent.replace(/\s+/g, ' ').trim() || `cột ${columnIndex + 1}`;
            handle = document.createElement('button');
            handle.type = 'button';
            handle.className = 'column-resize-handle';
            handle.setAttribute('aria-label', `Điều chỉnh độ rộng cột ${label}`);
            handle.title = 'Kéo để đổi độ rộng; nhấp đúp để đặt lại';
            handle.addEventListener('pointerdown', event => startDashboardColumnResize(event, table, header, columnIndex));
            handle.addEventListener('dblclick', event => {
                event.preventDefault();
                event.stopPropagation();
                resetDashboardColumnWidth(table, columnIndex);
            });
            handle.addEventListener('keydown', event => {
                if (!['ArrowLeft', 'ArrowRight', 'Home'].includes(event.key)) return;
                event.preventDefault();
                event.stopPropagation();
                if (event.key === 'Home') {
                    resetDashboardColumnWidth(table, columnIndex);
                    return;
                }
                const step = event.shiftKey ? 32 : 12;
                const direction = event.key === 'ArrowRight' ? 1 : -1;
                const width = applyDashboardColumnWidth(table, columnIndex, header.getBoundingClientRect().width + step * direction);
                writeDashboardColumnWidth(table, columnIndex, width);
            });
            header.appendChild(handle);
        }
        const storedWidth = Number(storedWidths[columnIndex]);
        if (Number.isFinite(storedWidth)) applyDashboardColumnWidth(table, columnIndex, storedWidth);
    });
}

function enhanceDashboardTables(root = document) {
    const tables = new Set();
    if (root.matches?.('table')) {
        tables.add(root);
    } else {
        (root.querySelectorAll?.('table') || []).forEach(table => tables.add(table));
        const ancestor = root.closest?.('table');
        if (ancestor) tables.add(ancestor);
    }
    tables.forEach(table => {
        // Re-running the resizer sync on every pass re-attaches handles and re-applies
        // stored widths after the header/body are re-rendered by filtering or sorting.
        syncDashboardTableColumnResizers(table);
        if (table.dataset.unifiedTable === 'true') return;
        table.dataset.unifiedTable = 'true';
        // The class matrix owns fixed/sticky column widths. Applying the generic
        // table rules here expands STT and breaks sticky offsets while scrolling.
        if (!table.matches('.class-matrix-table')) table.classList.add('unified-data-table');

        const existingScroll = table.closest(
            '.unified-table-scroll, .detail-report-scroll, .instructor-progress-scroll, .roster-table-wrapper, .learner-history'
        );
        if (existingScroll) {
            existingScroll.classList.add('unified-table-scroll');
            return;
        }

        const wrapper = document.createElement('div');
        wrapper.className = 'unified-table-scroll';
        wrapper.tabIndex = 0;
        wrapper.setAttribute('role', 'region');
        wrapper.setAttribute('aria-label', table.getAttribute('aria-label') || 'Bảng dữ liệu có thể cuộn ngang');
        table.before(wrapper);
        wrapper.appendChild(table);
    });
}

function enhanceSearchableFilterSelect(select) {
    if (!select || select.dataset.searchableEnhanced === 'true') return;
    select.dataset.searchableEnhanced = 'true';
    select.classList.add('searchable-select-source');
    const isMultiple = multiSelectFilterIds.has(select.id);

    const wrapper = document.createElement('div');
    wrapper.className = `searchable-select${isMultiple ? ' searchable-select-multiple' : ''}`;
    const isHeaderFilter = Boolean(select.closest('.admin-header-filter'));
    if (isHeaderFilter) wrapper.classList.add('admin-header-searchable-select');
    wrapper.innerHTML = `
        <button type="button" class="searchable-select-trigger" aria-haspopup="listbox" aria-expanded="false">
            <span class="searchable-select-value"></span>
            <span class="searchable-select-chevron" aria-hidden="true"></span>
        </button>
        <div class="searchable-select-popover" role="dialog" hidden>
            ${isMultiple ? `
                <div class="searchable-select-command-row">
                    <button type="button" data-select-command="all">Chọn tất cả</button>
                    <button type="button" data-select-command="none">Bỏ chọn</button>
                </div>
            ` : ''}
            <label class="searchable-select-search-wrap">
                <span class="sr-only">Tìm giá trị</span>
                <input type="search" class="searchable-select-search" placeholder="Tìm giá trị..." autocomplete="off">
            </label>
            <div class="searchable-select-options" role="listbox"${isMultiple ? ' aria-multiselectable="true"' : ''}></div>
            <div class="searchable-select-empty" hidden>Không tìm thấy giá trị phù hợp</div>
            ${isMultiple ? `
                <div class="searchable-select-footer">
                    <button type="button" class="searchable-select-clear">Xóa lọc</button>
                    <button type="button" class="searchable-select-apply">Áp dụng</button>
                </div>
            ` : ''}
        </div>
    `;
    select.insertAdjacentElement('afterend', wrapper);

    const trigger = wrapper.querySelector('.searchable-select-trigger');
    const valueNode = wrapper.querySelector('.searchable-select-value');
    const popover = wrapper.querySelector('.searchable-select-popover');
    const search = wrapper.querySelector('.searchable-select-search');
    const optionsNode = wrapper.querySelector('.searchable-select-options');
    const emptyNode = wrapper.querySelector('.searchable-select-empty');
    const label = select.getAttribute('aria-label') || 'Chọn giá trị';
    let draftValues = new Set();
    wrapper._searchablePopover = popover;
    trigger.setAttribute('aria-label', label);

    if (isHeaderFilter) {
        popover.classList.add('admin-header-searchable-popover');
        document.body.appendChild(popover);
    }

    const positionPopover = () => {
        if (!isHeaderFilter || popover.hidden) return;
        const rect = trigger.getBoundingClientRect();
        const width = Math.min(330, window.innerWidth - 24);
        popover.style.width = `${width}px`;
        const measuredHeight = popover.getBoundingClientRect().height || 420;
        const left = Math.max(12, Math.min(window.innerWidth - width - 12, rect.left));
        const openAbove = window.innerHeight - rect.bottom < measuredHeight + 12 && rect.top > measuredHeight + 12;
        const top = openAbove ? rect.top - measuredHeight - 7 : rect.bottom + 7;
        popover.style.left = `${left}px`;
        popover.style.top = `${Math.max(12, Math.min(window.innerHeight - measuredHeight - 12, top))}px`;
    };

    const close = ({ restoreFocus = false } = {}) => {
        wrapper.classList.remove('open');
        trigger.setAttribute('aria-expanded', 'false');
        popover.hidden = true;
        if (restoreFocus) trigger.focus();
    };

    const getAvailableOptions = () => [...select.options].filter(option => option.value && !option.disabled);

    const renderMultipleOptions = () => {
        const availableOptions = getAvailableOptions();
        const validValues = new Set(availableOptions.map(option => option.value));
        draftValues = new Set([...draftValues].filter(value => validValues.has(value)));
        optionsNode.innerHTML = '';

        const allLabel = select.options[0]?.textContent?.trim() || 'Tất cả giá trị';
        const allOption = document.createElement('label');
        allOption.className = 'searchable-select-option searchable-select-check-option searchable-select-all-option';
        allOption.dataset.searchText = allLabel.toLocaleLowerCase('vi');
        allOption.innerHTML = `<input type="checkbox"><span>${escapeHTML(allLabel)}</span>`;
        const allCheckbox = allOption.querySelector('input');
        allCheckbox.checked = availableOptions.length > 0 && draftValues.size === availableOptions.length;
        allCheckbox.indeterminate = draftValues.size > 0 && draftValues.size < availableOptions.length;
        allCheckbox.addEventListener('change', () => {
            draftValues = allCheckbox.checked
                ? new Set(availableOptions.map(option => option.value))
                : new Set();
            renderMultipleOptions();
            search.dispatchEvent(new Event('input'));
        });
        optionsNode.appendChild(allOption);

        availableOptions.forEach(option => {
            const optionLabel = document.createElement('label');
            optionLabel.className = 'searchable-select-option searchable-select-check-option';
            optionLabel.dataset.value = option.value;
            optionLabel.dataset.searchText = option.textContent.toLocaleLowerCase('vi');
            optionLabel.innerHTML = `<input type="checkbox"><span>${escapeHTML(option.textContent)}</span>`;
            const checkbox = optionLabel.querySelector('input');
            checkbox.checked = draftValues.has(option.value);
            checkbox.addEventListener('change', () => {
                if (checkbox.checked) draftValues.add(option.value);
                else draftValues.delete(option.value);
                renderMultipleOptions();
                search.dispatchEvent(new Event('input'));
            });
            optionsNode.appendChild(optionLabel);
        });
    };

    const sync = () => {
        trigger.disabled = select.disabled;
        const availableOptions = getAvailableOptions();
        if (isMultiple) {
            const availableValues = new Set(availableOptions.map(option => option.value));
            const appliedValues = Array.isArray(select._selectedValues)
                ? select._selectedValues.filter(value => availableValues.has(value))
                : availableOptions.map(option => option.value);
            draftValues = new Set(appliedValues);
            if (appliedValues.length === availableOptions.length && availableOptions.length) {
                valueNode.textContent = select.options[0]?.textContent?.trim() || 'Tất cả giá trị';
            } else if (appliedValues.length === 1) {
                valueNode.textContent = availableOptions.find(option => option.value === appliedValues[0])?.textContent || label;
            } else {
                valueNode.textContent = `${appliedValues.length} giá trị`;
            }
            renderMultipleOptions();
            search.dispatchEvent(new Event('input'));
            return;
        }

        const selected = select.options[select.selectedIndex];
        valueNode.textContent = selected?.textContent?.trim() || label;
        optionsNode.innerHTML = '';
        [...select.options].forEach(option => {
            const optionButton = document.createElement('button');
            optionButton.type = 'button';
            optionButton.className = 'searchable-select-option';
            optionButton.dataset.value = option.value;
            optionButton.textContent = option.textContent;
            optionButton.disabled = option.disabled;
            optionButton.setAttribute('role', 'option');
            optionButton.setAttribute('aria-selected', String(option.selected));
            if (option.selected) optionButton.classList.add('selected');
            optionButton.addEventListener('click', () => {
                select.value = option.value;
                select.dispatchEvent(new Event('change', { bubbles: true }));
                sync();
                close({ restoreFocus: true });
            });
            optionsNode.appendChild(optionButton);
        });
        search.dispatchEvent(new Event('input'));
    };

    const selectAllVisible = checked => {
        const visibleValues = [...optionsNode.querySelectorAll('.searchable-select-check-option[data-value]:not([hidden])')]
            .map(option => option.dataset.value);
        visibleValues.forEach(value => {
            if (checked) draftValues.add(value);
            else draftValues.delete(value);
        });
        renderMultipleOptions();
        search.dispatchEvent(new Event('input'));
    };

    wrapper.querySelector('[data-select-command="all"]')?.addEventListener('click', () => selectAllVisible(true));
    wrapper.querySelector('[data-select-command="none"]')?.addEventListener('click', () => selectAllVisible(false));
    wrapper.querySelector('.searchable-select-clear')?.addEventListener('click', () => {
        draftValues = new Set(getAvailableOptions().map(option => option.value));
        search.value = '';
        renderMultipleOptions();
        search.dispatchEvent(new Event('input'));
    });
    wrapper.querySelector('.searchable-select-apply')?.addEventListener('click', () => {
        select._selectedValues = [...draftValues];
        select.value = select._selectedValues[0] || '';
        select.dispatchEvent(new Event('change', { bubbles: true }));
        sync();
        close({ restoreFocus: true });
    });

    trigger.addEventListener('click', event => {
        event.stopPropagation();
        const shouldOpen = !wrapper.classList.contains('open');
        document.querySelectorAll('.searchable-select.open').forEach(openSelect => {
            if (openSelect !== wrapper) {
                openSelect.classList.remove('open');
                openSelect.querySelector('.searchable-select-trigger')?.setAttribute('aria-expanded', 'false');
                const openPopover = openSelect._searchablePopover || openSelect.querySelector('.searchable-select-popover');
                if (openPopover) openPopover.hidden = true;
            }
        });
        if (!shouldOpen) {
            close();
            return;
        }
        sync();
        wrapper.classList.add('open');
        trigger.setAttribute('aria-expanded', 'true');
        popover.hidden = false;
        positionPopover();
        search.value = '';
        search.dispatchEvent(new Event('input'));
        window.requestAnimationFrame(() => search.focus());
    });

    search.addEventListener('input', () => {
        const keyword = search.value.trim().toLocaleLowerCase('vi');
        let visibleCount = 0;
        optionsNode.querySelectorAll('.searchable-select-option').forEach(option => {
            const searchText = option.dataset.searchText || option.textContent.toLocaleLowerCase('vi');
            const matches = !keyword || searchText.includes(keyword);
            option.hidden = !matches;
            if (matches) visibleCount += 1;
        });
        emptyNode.hidden = visibleCount !== 0;
    });
    popover.addEventListener('click', event => event.stopPropagation());
    popover.addEventListener('keydown', event => {
        if (event.key === 'Escape') {
            event.preventDefault();
            close({ restoreFocus: true });
        }
    });
    select.addEventListener('change', sync);
    select.addEventListener('searchable-sync', sync);
    new MutationObserver(sync).observe(select, { childList: true, subtree: true, attributes: true });
    if (isHeaderFilter) {
        window.addEventListener('resize', positionPopover);
        window.addEventListener('scroll', positionPopover, true);
    }
    sync();
}

function initUnifiedDashboardControls() {
    enhanceDashboardTables();
    searchableFilterSelectIds.forEach(id => enhanceSearchableFilterSelect(document.getElementById(id)));

    const observer = new MutationObserver(mutations => {
        mutations.forEach(mutation => mutation.addedNodes.forEach(node => {
            if (node.nodeType === Node.ELEMENT_NODE) enhanceDashboardTables(node);
        }));
    });
    observer.observe(document.body, { childList: true, subtree: true });

    document.addEventListener('click', () => {
        document.querySelectorAll('.searchable-select.open').forEach(wrapper => {
            wrapper.classList.remove('open');
            wrapper.querySelector('.searchable-select-trigger')?.setAttribute('aria-expanded', 'false');
            const popover = wrapper._searchablePopover || wrapper.querySelector('.searchable-select-popover');
            if (popover) popover.hidden = true;
        });
    });
}

function initializeInstructorClasses() {
    const databaseClasses = getDatabaseInstructorClasses();
    state.instructorClasses = (state.assignmentsLoaded || technicianCatalogAuthoritative) ? databaseClasses : [];
    state.instructorClassesLoaded = true;

    if (!state.instructorClasses.some(item => item.id === state.instructorActiveClassId)) {
        state.instructorActiveClassId = state.instructorClasses[0]?.id || '';
    }
}

function getInstructorClassProgress(selectedClass, selectedGroups) {
    if (state.assignmentsLoaded) {
        const selectedMembers = new Set(selectedClass?.members || []);
        const assignmentByLearnerLab = new Map();
        trainingAssignments
            .filter(item => item.classCode === selectedClass?.code && selectedMembers.has(item.learner))
            .forEach(item => assignmentByLearnerLab.set(`${item.learner}\u001f${item.device}\u001f${item.lab}`, item));
        return (selectedClass?.members || []).map(learner => {
            const deviceResults = selectedGroups.map(group => {
                const labResults = group.labs.map(lab => {
                    const assignment = assignmentByLearnerLab.get(`${learner}\u001f${group.device}\u001f${lab}`);
                    return { lab, assigned: Boolean(assignment), completed: Boolean(assignment?.completed) };
                });
                const assignedResults = labResults.filter(item => item.assigned);
                const completed = assignedResults.filter(item => item.completed).length;
                const total = assignedResults.length;
                return { device: group.device, labResults, completed, total, rate: total ? Math.round((completed / total) * 100) : null };
            });
            const completed = deviceResults.reduce((sum, item) => sum + item.completed, 0);
            const total = deviceResults.reduce((sum, item) => sum + item.total, 0);
            return { learner, deviceResults, completed, total, rate: total ? Math.round((completed / total) * 100) : null };
        });
    }
    const rowsByLearner = new Map();
    sessions.forEach(item => {
        if (item.mode === 'Hướng dẫn') return;
        if (!rowsByLearner.has(item.learner)) rowsByLearner.set(item.learner, []);
        rowsByLearner.get(item.learner).push(item);
    });

    return (selectedClass?.members || []).map(learner => {
        const learnerSessions = rowsByLearner.get(learner) || [];
        const deviceResults = selectedGroups.map(group => {
            const completedLabs = new Set(
                learnerSessions
                    .filter(item => item.device === group.device && isSuccessfulSession(item))
                    .map(item => item.lab)
            );
            const labResults = group.labs.map(lab => ({ lab, completed: completedLabs.has(lab) }));
            const completed = labResults.filter(item => item.completed).length;
            const total = group.labs.length;
            return { device: group.device, labResults, completed, total, rate: total ? Math.round((completed / total) * 100) : 0 };
        });
        const completed = deviceResults.reduce((sum, item) => sum + item.completed, 0);
        const total = deviceResults.reduce((sum, item) => sum + item.total, 0);
        return {
            learner,
            deviceResults,
            completed,
            total,
            rate: total ? Math.round((completed / total) * 100) : 0
        };
    });
}

function getInstructorLabCellClass(completed, assigned = true) {
    if (!assigned) return 'instructor-progress-unassigned';
    return completed ? 'instructor-progress-complete' : 'instructor-progress-pending';
}

function getInstructorRateClass(rate) {
    if (rate >= 80) return 'instructor-rate-high';
    if (rate >= 50) return 'instructor-rate-medium';
    return 'instructor-rate-low';
}

function getInstructorCompletionStatus(row) {
    if (!row.total || row.rate === null) return 'unassigned';
    if (row.completed >= row.total) return 'completed';
    if (row.completed > 0) return 'in_progress';
    return 'not_started';
}

function filterInstructorProgressRows(rows) {
    const search = normalizeInstructorSearchText(state.instructorSearchKtv);
    return rows
        .filter(row => {
            const technician = technicianByIdentity.get(String(row.learner || '').trim().toLowerCase());
            const searchable = normalizeInstructorSearchText([
                getLearnerName(row.learner),
                row.learner,
                technician?.employeeId
            ].filter(Boolean).join(' '));
            const matchesSearch = !search || searchable.includes(search);
            const status = getInstructorCompletionStatus(row);
            const matchesStatus = state.instructorCompletionFilter === 'all' || status === state.instructorCompletionFilter;
            return matchesSearch && matchesStatus;
        })
        .sort((left, right) => {
            const byName = getLearnerName(left.learner).localeCompare(getLearnerName(right.learner), 'vi', { numeric: true, sensitivity: 'base' });
            return byName || left.learner.localeCompare(right.learner, 'vi', { numeric: true, sensitivity: 'base' });
        });
}

function renderInstructorLabHeader(label) {
    const text = String(label || '');
    const match = text.match(/^(Bài\s*\d+)\s*[:.\-–]?\s*(.*)$/i);
    if (!match) return `<span class="instructor-lab-name">${escapeHTML(text)}</span>`;
    return `
        <span class="instructor-lab-order">${escapeHTML(match[1])}</span>
        ${match[2] ? `<span class="instructor-lab-name">${escapeHTML(match[2])}</span>` : ''}
    `;
}

function renderInstructorLearner(learner) {
    const name = getLearnerName(learner);
    const technician = technicianByIdentity.get(String(learner || '').trim().toLowerCase());
    const showEmail = normalizeInstructorSearchText(name) !== normalizeInstructorSearchText(learner);
    return `
        <span class="instructor-progress-learner-name">${escapeHTML(name)}</span>
        ${showEmail ? `<span class="instructor-progress-learner-email">${escapeHTML(learner)}</span>` : ''}
        ${technician?.employeeId ? `<span class="instructor-progress-learner-id">Mã NV: ${escapeHTML(technician.employeeId)}</span>` : ''}
    `;
}

function renderInstructorClassProgress() {
    const classSelect = document.getElementById('instructorClassSelect');
    const deviceSelect = document.getElementById('instructorDeviceSelect');
    const head = document.getElementById('instructorProgressHead');
    const body = document.getElementById('instructorProgressBody');
    const foot = document.getElementById('instructorProgressFoot');
    const summary = document.getElementById('instructorProgressSummary');
    const scroll = document.getElementById('instructorProgressScroll');
    const scrollHint = document.getElementById('instructorProgressScrollHint');
    const empty = document.getElementById('instructorProgressEmpty');
    const searchInput = document.getElementById('instructorKtvSearch');
    const completionFilter = document.getElementById('instructorCompletionFilter');
    const filterReset = document.getElementById('instructorProgressFilterReset');
    const filterMeta = document.getElementById('instructorProgressFilterMeta');
    if (!classSelect || !deviceSelect || !head || !body || !foot || !summary || !scroll || !empty) return;

    if (searchInput && searchInput.value !== state.instructorSearchKtv) searchInput.value = state.instructorSearchKtv;
    if (completionFilter) completionFilter.value = state.instructorCompletionFilter;

    initializeInstructorClasses();
    if (state.instructorActiveClassId && !state.instructorClasses.some(item => item.id === state.instructorActiveClassId)) {
        state.instructorActiveClassId = state.instructorClasses[0]?.id || '';
    }

    classSelect.innerHTML = state.instructorClasses.length
        ? state.instructorClasses.map(item => `<option value="${escapeHTML(item.id)}">${escapeHTML(item.name)} · ${item.members.length} KTV</option>`).join('')
        : '<option value="">Chưa có lớp học</option>';
    classSelect.value = state.instructorActiveClassId;
    classSelect.disabled = !state.instructorClasses.length;

    const selectedClass = state.instructorClasses.find(item => item.id === state.instructorActiveClassId);
    if (searchInput) searchInput.disabled = !selectedClass;
    if (completionFilter) completionFilter.disabled = !selectedClass;
    const allGroups = getInstructorDeviceGroups(selectedClass);
    const availableDevices = allGroups.map(item => item.device);
    if (state.instructorSelectedDevices === null) state.instructorSelectedDevices = [...availableDevices];
    state.instructorSelectedDevices = state.instructorSelectedDevices.filter(device => availableDevices.includes(device));
    deviceSelect.innerHTML = '<option value="">Tất cả thiết bị</option>' + allGroups
        .map(item => `<option value="${escapeHTML(item.device)}">${escapeHTML(item.device)}</option>`)
        .join('');
    deviceSelect._selectedValues = [...state.instructorSelectedDevices];
    deviceSelect.value = state.instructorSelectedDevices[0] || '';

    const deleteButton = document.getElementById('instructorClassDelete');
    if (deleteButton) deleteButton.disabled = !state.instructorClasses.length || selectedClass?.source === 'database';

    if (!selectedClass) {
        head.innerHTML = '';
        body.innerHTML = '';
        foot.innerHTML = '';
        summary.innerHTML = '';
        if (filterMeta) filterMeta.textContent = '';
        if (filterReset) filterReset.hidden = true;
        scroll.hidden = true;
        if (scrollHint) scrollHint.hidden = true;
        empty.hidden = false;
        empty.textContent = technicianCatalogAuthoritative
            ? 'Chưa có lớp học trong hồ sơ nhân viên trên cơ sở dữ liệu.'
            : 'Chưa có lớp học.';
        return;
    }

    const selectedGroups = allGroups.filter(item => state.instructorSelectedDevices.includes(item.device));
    const allProgressRows = getInstructorClassProgress(selectedClass, selectedGroups);
    const progressRows = filterInstructorProgressRows(allProgressRows);
    const completed = progressRows.reduce((sum, item) => sum + item.completed, 0);
    const total = progressRows.reduce((sum, item) => sum + item.total, 0);
    const rate = total ? Math.round((completed / total) * 100) : null;

    const columns = selectedGroups.flatMap((group, groupIndex) => group.labs.map((lab, labIndex) => ({
        device: group.device,
        lab,
        groupIndex,
        isFirst: labIndex === 0
    })));

    const filtersActive = Boolean(state.instructorSearchKtv.trim()) || state.instructorCompletionFilter !== 'all';
    if (filterReset) filterReset.hidden = !filtersActive;
    if (filterMeta) {
        filterMeta.textContent = filtersActive
            ? `Đang hiển thị ${progressRows.length}/${allProgressRows.length} KTV`
            : `${allProgressRows.length} KTV trong lớp`;
    }

    summary.innerHTML = `
        <span class="instructor-summary-chip"><strong>${progressRows.length}${filtersActive ? `/${allProgressRows.length}` : ''}</strong> KTV</span>
        <span class="instructor-summary-chip"><strong>${selectedGroups.length}</strong> thiết bị</span>
        <span class="instructor-summary-chip"><strong>${columns.length}</strong> bài lab</span>
        <span class="instructor-summary-chip"><strong>${completed}/${total}</strong> bài đạt</span>
        <span class="instructor-summary-chip"><strong>${rate === null ? '—' : `${rate}%`}</strong> hoàn thành</span>
    `;

    head.innerHTML = `
        <tr class="instructor-progress-group-row">
            <th class="instructor-progress-index" rowspan="2" scope="col">STT</th>
            <th class="instructor-progress-email" rowspan="2" scope="col">KTV</th>
            ${selectedGroups.map((group, index) => `
                <th class="instructor-progress-device instructor-progress-group instructor-progress-tone-${index % 5}" colspan="${group.labs.length}" scope="colgroup">
                    ${escapeHTML(group.device)}
                    <span>${group.labs.length} bài lab</span>
                </th>
            `).join('')}
            <th class="instructor-progress-total" rowspan="2" scope="col">Đã đạt</th>
            <th class="instructor-progress-rate" rowspan="2" scope="col">Tỷ lệ</th>
        </tr>
        <tr class="instructor-progress-lab-row">
            ${columns.map(column => `
                <th class="instructor-progress-lab instructor-progress-lab-tone-${column.groupIndex % 5} ${column.isFirst ? 'group-start' : ''}" scope="col" title="${escapeHTML(`${column.device} • ${column.lab}`)}">${renderInstructorLabHeader(column.lab)}</th>
            `).join('')}
        </tr>
    `;
    body.innerHTML = progressRows.length ? progressRows.map((row, index) => `
        <tr>
            <td class="instructor-progress-index">${index + 1}</td>
            <th class="instructor-progress-email" scope="row" title="${escapeHTML(row.learner)}">${renderInstructorLearner(row.learner)}</th>
            ${row.deviceResults.flatMap(item => item.labResults.map(lab => `
                <td class="instructor-progress-lab instructor-lab-cell ${getInstructorLabCellClass(lab.completed, lab.assigned !== false)}" title="${escapeHTML(`${item.device} • ${lab.lab}: ${lab.assigned === false ? 'Chưa phân công' : (lab.completed ? 'Đã đạt' : 'Chưa đạt')}`)}">
                    ${lab.assigned === false ? '—' : (lab.completed ? '✓' : '○')}
                </td>
            `)).join('')}
            <td class="instructor-progress-total">${row.completed}/${row.total}</td>
            <td class="instructor-progress-rate ${getInstructorRateClass(row.rate || 0)}">${row.rate === null ? '—' : `${row.rate}%`}</td>
        </tr>
    `).join('') : `
        <tr>
            <td class="instructor-progress-filter-empty" colspan="${columns.length + 4}">
                Không có KTV phù hợp với tìm kiếm hoặc trạng thái đã chọn.
            </td>
        </tr>
    `;

    if (progressRows.length) {
        const columnTotals = columns.map((column, columnIndex) => progressRows.reduce((result, row) => {
            const lab = row.deviceResults.flatMap(item => item.labResults)[columnIndex];
            if (lab && lab.assigned !== false) result.assigned++;
            if (lab?.completed) result.completed++;
            return result;
        }, { assigned: 0, completed: 0 }));
        foot.innerHTML = `
            <tr>
                <th class="instructor-progress-index instructor-progress-grand-index" scope="row">Σ</th>
                <th class="instructor-progress-email instructor-progress-grand-label" scope="row">Tổng ${progressRows.length} KTV</th>
                ${columnTotals.map((item, index) => {
                    const columnRate = item.assigned ? Math.round((item.completed / item.assigned) * 100) : null;
                    return `
                        <td class="instructor-progress-lab instructor-progress-column-total ${columns[index].isFirst ? 'group-start' : ''}" title="${escapeHTML(`${columns[index].device} • ${columns[index].lab}: ${item.completed}/${item.assigned} KTV hoàn thành`)}">
                            <strong>${item.assigned ? `${item.completed}/${item.assigned}` : '—'}</strong>
                            ${columnRate === null ? '' : `<small>${columnRate}%</small>`}
                        </td>
                    `;
                }).join('')}
                <td class="instructor-progress-total">${completed}/${total}</td>
                <td class="instructor-progress-rate ${getInstructorRateClass(rate || 0)}">${rate === null ? '—' : `${rate}%`}</td>
            </tr>
        `;
    } else {
        foot.innerHTML = '';
    }

    scroll.hidden = false;
    if (scrollHint) scrollHint.hidden = false;
    empty.hidden = true;
}

function setInstructorFeedback(message, type = '') {
    const feedback = document.getElementById('instructorClassFeedback');
    if (!feedback) return;
    feedback.textContent = message;
    feedback.className = `instructor-class-feedback${type ? ` is-${type}` : ''}`;
}

function createInstructorClass() {
    const input = document.getElementById('instructorClassName');
    const name = input?.value.trim() || '';
    if (!name) {
        setInstructorFeedback('Vui lòng nhập tên lớp trước khi tạo.', 'error');
        input?.focus();
        return;
    }
    if (state.instructorClasses.some(item => item.name.toLowerCase() === name.toLowerCase())) {
        setInstructorFeedback('Tên lớp đã tồn tại. Vui lòng chọn tên khác.', 'error');
        return;
    }
    const members = state.instructorImportMembers.length ? state.instructorImportMembers : getInstructorLearners();
    if (!members.length) {
        setInstructorFeedback('Không có KTV để thêm vào lớp.', 'error');
        return;
    }
    const newClass = { id: `class-${Date.now()}`, name, members: [...new Set(members)] };
    state.instructorClasses.push(newClass);
    state.instructorActiveClassId = newClass.id;
    state.instructorImportMembers = [];
    state.instructorImportFileName = '';
    if (input) input.value = '';
    const fileInput = document.getElementById('instructorClassFile');
    if (fileInput) fileInput.value = '';
    saveInstructorClasses();
    setInstructorFeedback(`Đã tạo lớp “${name}” với ${newClass.members.length} KTV.`, 'success');
    renderInstructorClassProgress();
}

function parseInstructorCsv(text) {
    const emails = String(text || '').match(/[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}/gi) || [];
    return [...new Set(emails.map(item => item.trim().toLowerCase()))];
}

async function handleInstructorClassFile(file) {
    if (!file) return;
    state.instructorImportFileName = file.name;
    const extension = file.name.split('.').pop()?.toLowerCase();
    if (!['csv', 'txt'].includes(extension)) {
        state.instructorImportMembers = [];
        setInstructorFeedback('Bản dashboard hiện đọc trực tiếp file CSV. Với Excel, hãy lưu thành CSV trước khi nhập.', 'error');
        return;
    }
    try {
        const emails = parseInstructorCsv(await file.text());
        state.instructorImportMembers = emails;
        if (!emails.length) {
            setInstructorFeedback(`Không tìm thấy email hợp lệ trong “${file.name}”.`, 'error');
            return;
        }
        setInstructorFeedback(`Đã đọc ${emails.length} email từ “${file.name}”. Nhập tên lớp và chọn “Tạo lớp”.`, 'success');
    } catch (error) {
        state.instructorImportMembers = [];
        setInstructorFeedback('Không thể đọc file đã chọn. Vui lòng kiểm tra lại định dạng CSV.', 'error');
    }
}

function initInstructorWorkspace() {
    if (state.instructorWorkspaceBound) return;
    state.instructorWorkspaceBound = true;
    document.getElementById('instructorClassFileButton')?.addEventListener('click', () => {
        document.getElementById('instructorClassFile')?.click();
    });
    document.getElementById('instructorClassFile')?.addEventListener('change', event => {
        handleInstructorClassFile(event.target.files?.[0]);
    });
    document.getElementById('instructorClassCreate')?.addEventListener('click', createInstructorClass);
    document.getElementById('instructorClassName')?.addEventListener('keydown', event => {
        if (event.key === 'Enter') createInstructorClass();
    });
    document.getElementById('instructorClassSelect')?.addEventListener('change', event => {
        state.instructorActiveClassId = event.target.value;
        renderInstructorClassProgress();
    });
    document.getElementById('instructorDeviceSelect')?.addEventListener('change', event => {
        state.instructorSelectedDevices = [...(event.target._selectedValues || [])];
        renderInstructorClassProgress();
    });
    document.getElementById('instructorKtvSearch')?.addEventListener('input', event => {
        state.instructorSearchKtv = event.target.value;
        window.clearTimeout(instructorSearchTimer);
        instructorSearchTimer = window.setTimeout(renderInstructorClassProgress, 160);
    });
    document.getElementById('instructorCompletionFilter')?.addEventListener('change', event => {
        state.instructorCompletionFilter = event.target.value;
        renderInstructorClassProgress();
    });
    document.getElementById('instructorProgressFilterReset')?.addEventListener('click', () => {
        state.instructorSearchKtv = '';
        state.instructorCompletionFilter = 'all';
        renderInstructorClassProgress();
        document.getElementById('instructorKtvSearch')?.focus();
    });
    document.getElementById('instructorClassDelete')?.addEventListener('click', () => {
        const selectedClass = state.instructorClasses.find(item => item.id === state.instructorActiveClassId);
        if (!selectedClass || !window.confirm(`Xóa lớp “${selectedClass.name}”?`)) return;
        state.instructorClasses = state.instructorClasses.filter(item => item.id !== selectedClass.id);
        state.instructorActiveClassId = state.instructorClasses[0]?.id || '';
        saveInstructorClasses();
        setInstructorFeedback(`Đã xóa lớp “${selectedClass.name}”.`, 'success');
        renderInstructorClassProgress();
    });
}

/* ============================================================
   Báo cáo Ma trận Thực hành KTV theo Lớp học
   ============================================================ */

function getClassMatrixData() {
    initializeInstructorClasses();

    let classes = state.instructorClasses || [];
    if (!classes.length) classes = getDatabaseInstructorClasses();
    const allClassLearners = state.assignmentsLoaded
        ? [...new Set(classes.flatMap(item => item.members || []))]
        : getInstructorLearners();

    if (!state.classMatrixSelectedClass) state.classMatrixSelectedClass = 'all';

    let selectedClass = classes.find(c => c.id === state.classMatrixSelectedClass) || null;
    if (!selectedClass && state.classMatrixSelectedClass !== 'all' && classes.length) {
        selectedClass = classes[0];
        state.classMatrixSelectedClass = selectedClass.id;
    }
    const learners = selectedClass ? (selectedClass.members || []) : allClassLearners;

    // A class drill-down must follow its current assignment scope. The overview
    // still needs the active catalog so it can aggregate every class/device.
    const allGroups = selectedClass
        ? getInstructorDeviceGroups(selectedClass)
        : getInstructorDeviceGroups(null, { includeAllActive: true });
    const availableDevices = allGroups.map(group => group.device);
    const selectedDeviceNames = state.classMatrixSelectedDevices === null
        ? [...availableDevices]
        : state.classMatrixSelectedDevices.filter(device => availableDevices.includes(device));
    if (state.classMatrixSelectedDevices !== null) state.classMatrixSelectedDevices = selectedDeviceNames;
    const selectedGroups = allGroups.filter(group =>
        selectedDeviceNames.includes(group.device) && group.labs.length
    );

    const columns = selectedGroups.flatMap((group, groupIndex) => (group.labs || []).map((lab, labIndex) => ({
        device: group.device,
        lab,
        groupIndex,
        isFirst: labIndex === 0,
        isLast: labIndex === group.labs.length - 1
    })));
    const overviewColumns = allGroups.flatMap(group => (group.labs || []).map(lab => ({
        device: group.device,
        lab
    })));

    const mappedLearners = learners.map(email => {
        const tech = technicianByIdentity.get(String(email).toLowerCase());
        const name = tech?.displayName || getLearnerName(email) || email;
        const code = tech?.employeeId || '';
        const region = tech?.dashboardRegion || getLearnerRegion(email) || '';
        const classCode = tech?.classCode || selectedClass?.code || '';
        const className = tech?.className || selectedClass?.name || '';
        return { email, tech, name, code, region, classCode, className };
    });

    const availableKtvIds = new Set(mappedLearners.map(learner => learner.email));
    if (state.classMatrixSelectedKtvs instanceof Set) {
        state.classMatrixSelectedKtvs = new Set(
            [...state.classMatrixSelectedKtvs].filter(email => availableKtvIds.has(email))
        );
    }
    const searchedLearners = state.classMatrixSelectedKtvs === null
        ? mappedLearners
        : mappedLearners.filter(learner => state.classMatrixSelectedKtvs.has(learner.email));

    const sessionsByCell = new Map();
    sessions.forEach(s => {
        if (s.mode !== 'Thực hành' && s.mode !== 'practice') return;
        const learnerKey = String(s.learner || '').toLowerCase();
        const cellKey = `${learnerKey}\u001f${s.device}\u001f${s.lab}`;
        if (!sessionsByCell.has(cellKey)) sessionsByCell.set(cellKey, []);
        sessionsByCell.get(cellKey).push(s);
    });
    const classSessionsForCell = (classCode, learner, device, lab) => (
        sessionsByCell.get(`${String(learner).toLowerCase()}\u001f${device}\u001f${lab}`) || []
    ).filter(session => session.assignmentClassCodes.includes(classCode));

    const activeDeviceNames = new Set(allGroups.map(group => group.device));
    const assignmentsByClass = new Map();
    const assignmentByCell = new Map();
    trainingAssignments.forEach(assignment => {
        if (!assignment.classCode || !activeDeviceNames.has(assignment.device)) return;
        if (!assignmentsByClass.has(assignment.classCode)) assignmentsByClass.set(assignment.classCode, []);
        assignmentsByClass.get(assignment.classCode).push(assignment);
        assignmentByCell.set(
            `${assignment.classCode}\u001f${String(assignment.learner).toLowerCase()}\u001f${assignment.device}\u001f${assignment.lab}`,
            assignment
        );
    });

    const selectedClassAssignments = selectedClass ? (assignmentsByClass.get(selectedClass.code) || []) : [];
    const selectedAssignmentsByLearner = new Map();
    selectedClassAssignments.forEach(assignment => {
        const learner = String(assignment.learner).toLowerCase();
        if (!selectedAssignmentsByLearner.has(learner)) selectedAssignmentsByLearner.set(learner, new Map());
        selectedAssignmentsByLearner.get(learner).set(`${assignment.device}\u001f${assignment.lab}`, assignment);
    });

    const candidateRows = searchedLearners.map(l => {
        const learnerKey = l.email.toLowerCase();
        let ktvCompleted = 0;
        let ktvAssigned = 0;
        let ktvAttempts = 0;
        let ktvSubmittedAttempts = 0;
        let ktvIncompleteAttempts = 0;

        const cells = columns.map(col => {
            const labSessions = selectedClass
                ? classSessionsForCell(selectedClass.code, learnerKey, col.device, col.lab)
                : [];
            const rateEligibleSessions = labSessions.filter(isRateEligiblePracticeSession);
            const attempts = rateEligibleSessions.length;
            const submittedAttempts = labSessions.length;
            const legacyIncompleteAttempts = labSessions.filter(session => !hasCompleteAttemptEvidence(session)).length;
            const passCount = rateEligibleSessions.filter(session => session.isPassed === true).length;
            const assignment = selectedClass
                ? assignmentByCell.get(`${selectedClass.code}\u001f${learnerKey}\u001f${col.device}\u001f${col.lab}`)
                : null;
            const isAssigned = Boolean(assignment);
            const assignmentCompleted = Boolean(assignment?.completed);
            if (isAssigned) ktvAssigned += 1;
            if (assignmentCompleted) ktvCompleted += 1;
            ktvAttempts += attempts;
            ktvSubmittedAttempts += submittedAttempts;
            ktvIncompleteAttempts += legacyIncompleteAttempts;

            return {
                device: col.device,
                lab: col.lab,
                assigned: isAssigned,
                completed: assignmentCompleted,
                attempts,
                submittedAttempts,
                legacyIncompleteAttempts,
                passCount,
                lastSession: labSessions[labSessions.length - 1] || null
            };
        });

        const rate = ktvAssigned > 0 ? Math.round((ktvCompleted / ktvAssigned) * 100) : null;
        const allAssignments = [...(selectedAssignmentsByLearner.get(learnerKey)?.values() || [])];
        const allAssignedCount = allAssignments.length;
        const allCompletedCount = allAssignments.filter(assignment => assignment.completed).length;

        return {
            ...l,
            cells,
            completed: ktvCompleted,
            assigned: ktvAssigned,
            allCompleted: allCompletedCount,
            allAssigned: allAssignedCount,
            fullyCompleted: allAssignedCount > 0 && allCompletedCount === allAssignedCount,
            attempts: ktvAttempts,
            submittedAttempts: ktvSubmittedAttempts,
            legacyIncompleteAttempts: ktvIncompleteAttempts,
            rate,
            progressKey: `${ktvCompleted}/${ktvAssigned}`
        };
    });

    const progressOptions = [...new Map(candidateRows.map(row => [row.progressKey, {
        value: row.progressKey,
        completed: row.completed,
        assigned: row.assigned
    }])).values()].sort((left, right) =>
        right.completed - left.completed || right.assigned - left.assigned
    );
    const validProgressValues = new Set(progressOptions.map(option => option.value));
    if (state.classMatrixProgressFilter instanceof Set) {
        state.classMatrixProgressFilter = new Set(
            [...state.classMatrixProgressFilter].filter(value => validProgressValues.has(value))
        );
    }
    let rows = state.classMatrixProgressFilter === null
        ? candidateRows
        : candidateRows.filter(row => state.classMatrixProgressFilter.has(row.progressKey));

    const sortKey = state.classMatrixPersonnelSort;
    const sortDir = state.classMatrixPersonnelSortDirection === 'asc' ? 1 : -1;
    const sortByRate = sortKey === 'completion_rate_asc';
    rows = [...rows].sort((left, right) => {
        let cmp;
        if (sortByRate) {
            cmp = (left.rate ?? -1) - (right.rate ?? -1);
        } else if (sortKey === 'code_asc') {
            cmp = formatClassEmployeeId(left.code).localeCompare(formatClassEmployeeId(right.code), 'vi', { numeric: true });
        } else {
            cmp = left.name.localeCompare(right.name, 'vi');
        }
        if (cmp === 0) cmp = left.name.localeCompare(right.name, 'vi');
        return cmp * sortDir;
    });

    const labStats = new Map(columns.map(col => [
        `${col.device}\u001f${col.lab}`,
        { assigned: 0, completed: 0, passes: 0, attempts: 0, submittedAttempts: 0, legacyIncompleteAttempts: 0 }
    ]));
    rows.forEach(row => row.cells.forEach(cell => {
        const stat = labStats.get(`${cell.device}\u001f${cell.lab}`);
        if (!stat) return;
        if (cell.assigned) stat.assigned += 1;
        if (cell.completed) stat.completed += 1;
        stat.passes += cell.passCount;
        stat.attempts += cell.attempts;
        stat.submittedAttempts += cell.submittedAttempts;
        stat.legacyIncompleteAttempts += cell.legacyIncompleteAttempts;
    }));

    const totalClassAttempts = rows.reduce((sum, row) => sum + row.attempts, 0);
    const totalClassSubmittedAttempts = rows.reduce((sum, row) => sum + row.submittedAttempts, 0);
    const totalClassIncompleteAttempts = rows.reduce((sum, row) => sum + row.legacyIncompleteAttempts, 0);
    const totalAssignedAll = rows.reduce((s, r) => s + r.assigned, 0);
    const totalCompletedAll = rows.reduce((s, r) => s + r.completed, 0);
    const assignmentCompletionRate = totalAssignedAll
        ? Math.round((totalCompletedAll / totalAssignedAll) * 100)
        : 0;
    const fullyCompletedPeople = rows.filter(row => row.fullyCompleted).length;
    let overallRate = rows.length ? Math.round((fullyCompletedPeople / rows.length) * 100) : 0;

    const availableClassIds = new Set(classes.map(item => item.id));
    if (state.classOverviewSelectedClasses instanceof Set) {
        state.classOverviewSelectedClasses = new Set(
            [...state.classOverviewSelectedClasses].filter(classId => availableClassIds.has(classId))
        );
    }
    let summaryRows = classes
        .filter(item => state.classOverviewSelectedClasses === null || state.classOverviewSelectedClasses.has(item.id))
        .map(item => {
            const members = [...new Set(item.members || [])];
            const classAssignments = assignmentsByClass.get(item.code) || [];
            const progressByMember = new Map(members.map(email => [String(email).toLowerCase(), new Map()]));
            classAssignments.forEach(assignment => {
                const learner = String(assignment.learner).toLowerCase();
                if (!progressByMember.has(learner)) return;
                progressByMember.get(learner).set(`${assignment.device}\u001f${assignment.lab}`, assignment);
            });
            const fullyCompletedCount = [...progressByMember.values()].filter(progress => {
                const assignments = [...progress.values()];
                return assignments.length > 0 && assignments.every(assignment => assignment.completed);
            }).length;
            const assignedDevices = new Set(classAssignments.map(assignment => assignment.device));
            const classLabSessions = members.flatMap(email => overviewColumns.flatMap(column =>
                classSessionsForCell(item.code, email, column.device, column.lab)
            ));
            const submittedAttempts = classLabSessions.length;
            const attempts = classLabSessions.filter(isRateEligiblePracticeSession).length;
            const legacyIncompleteAttempts = classLabSessions.filter(session => !hasCompleteAttemptEvidence(session)).length;
            return {
                ...item,
                memberCount: members.length,
                deviceCount: assignedDevices.size,
                fullyCompletedCount,
                attempts,
                submittedAttempts,
                legacyIncompleteAttempts,
                rate: members.length ? Math.round((fullyCompletedCount / members.length) * 100) : null
            };
        });
    const overviewSortKey = state.classOverviewSort;
    const overviewSortDirection = state.classOverviewSortDirection === 'asc' ? 1 : -1;
    summaryRows = [...summaryRows].sort((left, right) => {
        if (overviewSortKey === 'name') return left.name.localeCompare(right.name, 'vi') * overviewSortDirection;
        const leftValue = Number(left[overviewSortKey]) || 0;
        const rightValue = Number(right[overviewSortKey]) || 0;
        return (leftValue - rightValue) * overviewSortDirection || left.name.localeCompare(right.name, 'vi');
    });

    const scopedClasses = selectedClass ? [selectedClass] : classes;
    const scopedMembers = selectedClass
        ? rows.map(row => String(row.email).toLowerCase())
        : [...new Set(scopedClasses.flatMap(item => item.members || []).map(email => String(email).toLowerCase()))];
    const scopedClassCodes = new Set(scopedClasses.map(item => item.code));
    const scopedAssignments = [...assignmentsByClass.entries()]
        .filter(([classCode]) => scopedClassCodes.has(classCode))
        .flatMap(([, classAssignments]) => classAssignments);
    const deviceStats = allGroups.map(group => {
        const deviceAssignments = scopedAssignments.filter(assignment => assignment.device === group.device);
        const progressByMember = new Map(scopedMembers.map(email => [email, []]));
        deviceAssignments.forEach(assignment => {
            const learnerAssignments = progressByMember.get(String(assignment.learner).toLowerCase());
            if (learnerAssignments) learnerAssignments.push(assignment);
        });
        const completedPeople = [...progressByMember.values()].filter(assignments =>
            assignments.length > 0 && assignments.every(assignment => assignment.completed)
        ).length;
        return {
            device: group.device,
            assignedLabs: new Set(deviceAssignments.map(assignment => assignment.lab)).size,
            completedPeople,
            totalPeople: progressByMember.size
        };
    });

    if (!selectedClass) {
        const totalPeople = summaryRows.reduce((sum, row) => sum + row.memberCount, 0);
        const completedPeople = summaryRows.reduce((sum, row) => sum + row.fullyCompletedCount, 0);
        overallRate = totalPeople ? Math.round((completedPeople / totalPeople) * 100) : 0;
    }

    return {
        classes,
        selectedClass,
        allGroups,
        selectedGroups,
        selectedDeviceNames,
        columns,
        ktvOptions: mappedLearners,
        rows,
        filteredCount: rows.length,
        totalKtv: mappedLearners.length,
        allLearnersCount: allClassLearners.length,
        totalSessions: totalClassAttempts,
        totalSubmittedSessions: totalClassSubmittedAttempts,
        totalIncompleteSessions: totalClassIncompleteAttempts,
        totalAssignedAll,
        totalCompletedAll,
        assignmentCompletionRate,
        overallRate,
        fullyCompletedPeople,
        labStats,
        progressOptions,
        deviceStats,
        summaryRows,
        isOverview: state.classMatrixSelectedClass === 'all'
    };
}

function selectClassMatrixClass(classId) {
    state.classMatrixKtvSearch = '';
    state.classMatrixSelectedKtvs = null;
    state.classMatrixProgressFilter = null;
    state.classMatrixSelectedClass = classId;
    state.classMatrixSelectedDevices = null;
    renderClassMatrixReport();
    if (classId !== 'all') focusClassMatrixDetail();
}

function focusClassMatrixDetail() {
    window.requestAnimationFrame(() => {
        const card = document.getElementById('classDetailCard');
        const title = document.getElementById('classMatrixTableTitle');
        if (!card || card.hidden) return;
        title?.focus({ preventScroll: true });
        const reduceMotion = window.matchMedia?.('(prefers-reduced-motion: reduce)').matches;
        card.scrollIntoView({ behavior: reduceMotion ? 'auto' : 'smooth', block: 'start' });
    });
}

function focusClassMatrixTable() {
    window.requestAnimationFrame(() => {
        const tableScroll = document.getElementById('classMatrixScroll');
        if (!tableScroll || tableScroll.hidden) return;
        const reduceMotion = window.matchMedia?.('(prefers-reduced-motion: reduce)').matches;
        tableScroll.scrollIntoView({ behavior: reduceMotion ? 'auto' : 'smooth', block: 'start' });
        tableScroll.focus({ preventScroll: true });
    });
}

function formatClassEmployeeId(value) {
    const code = String(value || '').trim();
    if (/^\d+$/.test(code)) return code.padStart(8, '0').slice(-8);
    return code.slice(0, 8);
}

function renderClassOverview(data) {
    const head = document.getElementById('classOverviewHead');
    const body = document.getElementById('classOverviewBody');
    const foot = document.getElementById('classOverviewFoot');
    const scroll = document.getElementById('classOverviewScroll');
    const empty = document.getElementById('classOverviewEmpty');
    if (!head || !body || !foot) return;

    const classFilterSearch = state.classOverviewSearch.trim().toLocaleLowerCase('vi');
    const selectedClassIds = state.classOverviewSelectedClasses;
    const classFilterOptions = [...data.classes]
        .sort((left, right) => left.name.localeCompare(right.name, 'vi'))
        .map(item => {
            const searchText = `${item.name} ${item.code || ''}`.toLocaleLowerCase('vi');
            return `<label class="popover-option" ${classFilterSearch && !searchText.includes(classFilterSearch) ? 'hidden' : ''}>
                <input type="checkbox" value="${escapeHTML(item.id)}" ${selectedClassIds === null || selectedClassIds.has(item.id) ? 'checked' : ''}>
                <span><strong>${escapeHTML(item.name)}</strong>${item.code ? `<small>${escapeHTML(item.code)}</small>` : ''}</span>
            </label>`;
        }).join('');

    const sortHeader = (label, key) => {
        const active = state.classOverviewSort === key;
        const mark = active ? (state.classOverviewSortDirection === 'asc' ? '↑' : '↓') : '↕';
        return `<button type="button" class="class-overview-sort ${active ? 'is-sorted' : ''}" data-class-overview-sort="${key}">
            ${label}<span aria-hidden="true">${mark}</span>
        </button>`;
    };
    head.innerHTML = `<tr>
        <th scope="col" aria-sort="${state.classOverviewSort === 'name' ? (state.classOverviewSortDirection === 'asc' ? 'ascending' : 'descending') : 'none'}">
            <div class="class-overview-head-wrap">
                ${sortHeader('Lớp học', 'name')}
                <div class="ktv-header-filter ${state.classOverviewSelectedClasses !== null ? 'has-value' : ''}" id="classOverviewFilterWrapper">
                    <button type="button" class="popover-trigger-btn" id="classOverviewFilterTrigger" aria-label="Lọc theo tên hoặc mã lớp" aria-expanded="false"></button>
                    <div class="popover-dropdown header-filter-menu class-column-filter" role="dialog" aria-label="Lọc lớp học">
                        <div class="header-filter-command-row">
                            <button type="button" id="classOverviewFilterAll">Chọn tất cả</button>
                            <button type="button" id="classOverviewFilterNone">Bỏ chọn</button>
                        </div>
                        <input type="search" class="popover-search" id="classOverviewFilterInput" value="${escapeHTML(state.classOverviewSearch)}" placeholder="Tìm tên hoặc mã lớp..." autocomplete="off" aria-label="Tìm lớp học">
                        <div class="popover-options class-checklist-options" id="classOverviewFilterOptions">${classFilterOptions || '<span class="popover-empty">Chưa có lớp học.</span>'}</div>
                        <div class="popover-footer header-filter-footer">
                            <button type="button" class="popover-btn-clear" id="classOverviewFilterClear">Xóa lọc</button>
                            <button type="button" class="popover-btn-apply header-filter-apply" id="classOverviewFilterApply">Áp dụng</button>
                        </div>
                    </div>
                </div>
            </div>
        </th>
        <th scope="col">${sortHeader('Số KTV', 'memberCount')}</th>
        <th scope="col">${sortHeader('Thiết bị đã giao', 'deviceCount')}</th>
        <th scope="col">${sortHeader('Lượt phát sinh', 'submittedAttempts')}</th>
        <th scope="col">${sortHeader('Lượt đủ dữ liệu', 'attempts')}</th>
        <th scope="col">${sortHeader('Thiếu dữ liệu lịch sử', 'legacyIncompleteAttempts')}</th>
        <th scope="col">${sortHeader('KTV hoàn thành', 'fullyCompletedCount')}</th>
        <th scope="col">${sortHeader('Tỷ lệ hoàn thành', 'rate')}</th>
        <th scope="col"><span class="sr-only">Thao tác</span></th>
    </tr>`;
    bindClassOverviewControls();

    body.innerHTML = data.summaryRows.map(row => {
        const isSelected = row.id === state.classMatrixSelectedClass;
        return `<tr class="class-overview-row ${isSelected ? 'is-selected' : ''}" data-class-id="${escapeHTML(row.id)}">
            <th class="class-overview-name-cell" scope="row">
                <button type="button" class="class-overview-link class-overview-open" data-class-id="${escapeHTML(row.id)}" ${isSelected ? 'aria-current="true"' : ''}>
                    <strong>${escapeHTML(row.name)}</strong>
                    <span>${escapeHTML(row.code || 'Chưa có mã lớp')}</span>
                </button>
            </th>
            <td class="class-overview-number">${formatNumber.format(row.memberCount)}</td>
            <td class="class-overview-number">${formatNumber.format(row.deviceCount)}</td>
            <td class="class-overview-number">${formatNumber.format(row.submittedAttempts)}</td>
            <td class="class-overview-number">${formatNumber.format(row.attempts)}</td>
            <td class="class-overview-number">${formatNumber.format(row.legacyIncompleteAttempts)}</td>
            <td class="class-overview-achieved">
                <button type="button" class="class-overview-completion class-overview-open" data-class-id="${escapeHTML(row.id)}" aria-label="Xem ${row.fullyCompletedCount} trên ${row.memberCount} KTV hoàn thành lớp ${escapeHTML(row.name)}">
                    <strong>${row.fullyCompletedCount}/${row.memberCount}</strong><span>KTV</span>
                </button>
            </td>
            <td class="class-overview-progress-cell">
                <div class="class-overview-progress" title="${escapeHTML(`${row.fullyCompletedCount}/${row.memberCount} KTV hoàn thành tất cả bài được giao`)}">
                    <div class="class-overview-progress-track" aria-hidden="true"><span style="width:${row.rate || 0}%"></span></div>
                    <strong>${row.rate === null ? '—' : `${row.rate}%`}</strong>
                </div>
            </td>
            <td class="class-overview-action-cell">
                <button type="button" class="class-overview-action class-overview-open" data-class-id="${escapeHTML(row.id)}" ${isSelected ? 'aria-current="true"' : ''}>
                    ${isSelected ? 'Đang xem' : 'Xem chi tiết'}<span aria-hidden="true">→</span>
                </button>
            </td>
        </tr>`;
    }).join('');

    const classPeople = data.summaryRows.reduce((sum, row) => sum + row.memberCount, 0);
    const assignedDeviceCount = data.summaryRows.reduce((sum, row) => sum + row.deviceCount, 0);
    const totalSubmittedAttempts = data.summaryRows.reduce((sum, row) => sum + row.submittedAttempts, 0);
    const totalAttempts = data.summaryRows.reduce((sum, row) => sum + row.attempts, 0);
    const totalIncompleteAttempts = data.summaryRows.reduce((sum, row) => sum + row.legacyIncompleteAttempts, 0);
    const completedPeople = data.summaryRows.reduce((sum, row) => sum + row.fullyCompletedCount, 0);
    const overallRate = classPeople ? Math.round((completedPeople / classPeople) * 100) : null;
    foot.innerHTML = `<tr>
        <th scope="row">Tổng</th>
        <td>${formatNumber.format(classPeople)}</td>
        <td>${formatNumber.format(assignedDeviceCount)}</td>
        <td>${formatNumber.format(totalSubmittedAttempts)}</td>
        <td>${formatNumber.format(totalAttempts)}</td>
        <td>${formatNumber.format(totalIncompleteAttempts)}</td>
        <td><strong>${completedPeople}/${classPeople}</strong></td>
        <td><strong>${overallRate === null ? '—' : `${overallRate}%`}</strong></td>
        <td></td>
    </tr>`;

    const hasRows = data.summaryRows.length > 0;
    if (scroll) scroll.hidden = !hasRows;
    if (empty) {
        empty.hidden = hasRows;
        empty.textContent = state.classOverviewSelectedClasses !== null
            ? 'Không có lớp nào thuộc bộ lọc đã chọn.'
            : 'Chưa có lớp học để tổng hợp.';
    }
    body.querySelectorAll('.class-overview-open').forEach(element => {
        element.addEventListener('click', () => {
            selectClassMatrixClass(element.dataset.classId);
        });
    });
}

function closeClassHeaderPopovers(except = null) {
    document.querySelectorAll('#classMatrix .ktv-header-filter.open').forEach(wrapper => {
        if (wrapper === except) return;
        const dropdown = wrapper._floatingDropdown || wrapper.querySelector('.popover-dropdown');
        wrapper.classList.remove('open');
        wrapper.querySelector('[aria-expanded]')?.setAttribute('aria-expanded', 'false');
        dropdown?.classList.remove('open', 'class-header-filter-floating');
        dropdown?.removeAttribute('style');
        if (dropdown && wrapper.isConnected && dropdown.parentElement !== wrapper) wrapper.appendChild(dropdown);
    });
}

function positionClassHeaderPopover(wrapper, trigger) {
    const dropdown = wrapper?._floatingDropdown || wrapper?.querySelector('.popover-dropdown');
    if (!dropdown || !trigger) return;
    wrapper._floatingDropdown = dropdown;
    const triggerRect = trigger.getBoundingClientRect();
    if (triggerRect.bottom < 0 || triggerRect.top > window.innerHeight) {
        closeClassHeaderPopovers();
        return;
    }
    dropdown.classList.add('class-header-filter-floating', 'open');
    dropdown.style.visibility = 'hidden';
    if (dropdown.parentElement !== document.body) document.body.appendChild(dropdown);
    const dropdownRect = dropdown.getBoundingClientRect();
    const width = dropdownRect.width || 230;
    const height = dropdownRect.height || 180;
    const left = Math.max(8, Math.min(triggerRect.left, window.innerWidth - width - 8));
    const below = triggerRect.bottom + 6;
    const top = below + height <= window.innerHeight - 8
        ? below
        : Math.max(8, triggerRect.top - height - 6);
    dropdown.style.left = `${left}px`;
    dropdown.style.top = `${top}px`;
    dropdown.style.visibility = 'visible';
}

function toggleClassHeaderPopover(wrapper, trigger) {
    const shouldOpen = !wrapper.classList.contains('open');
    closeClassHeaderPopovers(shouldOpen ? wrapper : null);
    wrapper.classList.toggle('open', shouldOpen);
    trigger.setAttribute('aria-expanded', String(shouldOpen));
    if (shouldOpen) {
        positionClassHeaderPopover(wrapper, trigger);
        const dropdown = wrapper._floatingDropdown;
        window.requestAnimationFrame(() => dropdown?.querySelector('input, [role="menuitem"]')?.focus({ preventScroll: true }));
    }
}

function ensureClassPopoverDismissal() {
    if (window._classPopoverDismissalBound) return;
    window._classPopoverDismissalBound = true;
    document.addEventListener('click', event => {
        document.querySelectorAll('#classMatrix .ktv-header-filter.open').forEach(wrapper => {
            if (!wrapper.contains(event.target)) closeClassHeaderPopovers();
        });
    });
    const refreshOpenPopover = event => {
        if (event?.target instanceof Element && event.target.closest('.class-header-filter-floating')) return;
        document.querySelectorAll('#classMatrix .ktv-header-filter.open').forEach(wrapper => {
            const trigger = wrapper.querySelector('[aria-expanded]');
            if (trigger) positionClassHeaderPopover(wrapper, trigger);
        });
    };
    window.addEventListener('resize', refreshOpenPopover);
    document.addEventListener('scroll', refreshOpenPopover, true);
    document.addEventListener('keydown', event => {
        if (event.key === 'Escape') closeClassHeaderPopovers();
    });
}

function bindClassChecklistFilter({
    wrapperId,
    triggerId,
    inputId,
    optionsId,
    applyId,
    clearId,
    selectAllId,
    selectNoneId,
    selectionStateKey,
    searchStateKey
}) {
    const wrapper = document.getElementById(wrapperId);
    const trigger = document.getElementById(triggerId);
    const input = document.getElementById(inputId);
    const options = document.getElementById(optionsId);
    const apply = document.getElementById(applyId);
    const clear = document.getElementById(clearId);
    const selectAll = document.getElementById(selectAllId);
    const selectNone = document.getElementById(selectNoneId);
    if (!wrapper || !trigger || !input || !options) return;
    ensureClassPopoverDismissal();
    trigger.addEventListener('click', event => {
        event.stopPropagation();
        if (!wrapper.classList.contains('open')) syncChecklistDraft();
        toggleClassHeaderPopover(wrapper, trigger);
    });
    wrapper.querySelector('.popover-dropdown')?.addEventListener('click', event => event.stopPropagation());
    const filterVisibleOptions = () => {
        const keyword = input.value.trim().toLocaleLowerCase('vi');
        options.querySelectorAll('.popover-option').forEach(option => {
            option.hidden = Boolean(keyword && !option.textContent.toLocaleLowerCase('vi').includes(keyword));
        });
    };
    input.addEventListener('input', () => {
        filterVisibleOptions();
    });
    const syncChecklistDraft = () => {
        const selectedValues = state[selectionStateKey];
        input.value = state[searchStateKey] || '';
        options.querySelectorAll('input[type="checkbox"]').forEach(checkbox => {
            checkbox.checked = selectedValues === null || selectedValues.has(checkbox.value);
        });
        filterVisibleOptions();
    };
    const setVisibleOptions = checked => {
        options.querySelectorAll('.popover-option:not([hidden]) input[type="checkbox"]').forEach(checkbox => {
            checkbox.checked = checked;
        });
    };
    selectAll?.addEventListener('click', () => setVisibleOptions(true));
    selectNone?.addEventListener('click', () => setVisibleOptions(false));
    const applyFilter = () => {
        const checkboxes = [...options.querySelectorAll('input[type="checkbox"]')];
        const checkedValues = checkboxes.filter(checkbox => checkbox.checked).map(checkbox => checkbox.value);
        state[selectionStateKey] = checkedValues.length === checkboxes.length
            ? null
            : new Set(checkedValues);
        state[searchStateKey] = input.value;
        closeClassHeaderPopovers();
        renderClassMatrixReport();
    };
    apply?.addEventListener('click', applyFilter);
    input.addEventListener('keydown', event => {
        if (event.key === 'Enter') {
            event.preventDefault();
            applyFilter();
        }
    });
    clear?.addEventListener('click', event => {
        event.preventDefault();
        input.value = '';
        options.querySelectorAll('.popover-option').forEach(option => { option.hidden = false; });
        options.querySelectorAll('input[type="checkbox"]').forEach(checkbox => { checkbox.checked = true; });
        input.focus({ preventScroll: true });
    });
}

function bindClassOverviewControls() {
    document.querySelectorAll('[data-class-overview-sort]').forEach(button => {
        const active = state.classOverviewSort === button.dataset.classOverviewSort;
        button.closest('th')?.setAttribute('aria-sort', active
            ? (state.classOverviewSortDirection === 'asc' ? 'ascending' : 'descending')
            : 'none');
        button.addEventListener('click', () => {
            const key = button.dataset.classOverviewSort;
            if (state.classOverviewSort === key) {
                state.classOverviewSortDirection = state.classOverviewSortDirection === 'asc' ? 'desc' : 'asc';
            } else {
                state.classOverviewSort = key;
                state.classOverviewSortDirection = key === 'name' ? 'asc' : 'desc';
            }
            renderClassMatrixReport();
        });
    });
    bindClassChecklistFilter({
        wrapperId: 'classOverviewFilterWrapper',
        triggerId: 'classOverviewFilterTrigger',
        inputId: 'classOverviewFilterInput',
        optionsId: 'classOverviewFilterOptions',
        applyId: 'classOverviewFilterApply',
        clearId: 'classOverviewFilterClear',
        selectAllId: 'classOverviewFilterAll',
        selectNoneId: 'classOverviewFilterNone',
        selectionStateKey: 'classOverviewSelectedClasses',
        searchStateKey: 'classOverviewSearch'
    });
}

function bindClassKtvFilterMenu() {
    bindClassChecklistFilter({
        wrapperId: 'classKtvFilterWrapper',
        triggerId: 'classKtvFilterTrigger',
        inputId: 'classKtvFilterInput',
        optionsId: 'classKtvFilterOptions',
        applyId: 'classKtvFilterApply',
        clearId: 'classKtvFilterClear',
        selectAllId: 'classKtvFilterAll',
        selectNoneId: 'classKtvFilterNone',
        selectionStateKey: 'classMatrixSelectedKtvs',
        searchStateKey: 'classMatrixKtvSearch'
    });
}

function renderClassMatrixReport() {
    closeClassHeaderPopovers();
    const head = document.getElementById('classMatrixHead');
    const body = document.getElementById('classMatrixBody');
    const foot = document.getElementById('classMatrixFoot');
    const emptyEl = document.getElementById('classMatrixEmpty');
    const scrollEl = document.getElementById('classMatrixScroll');
    const overviewCard = document.getElementById('classOverviewCard');
    const detailCard = document.getElementById('classDetailCard');
    const deviceProgressList = document.getElementById('classDeviceProgressList');
    if (!head || !body || !foot) return;

    const data = getClassMatrixData();
    if (overviewCard) overviewCard.hidden = false;
    if (detailCard) detailCard.hidden = data.isOverview;

    const deviceStatSearch = document.getElementById('classDeviceStatSearch');
    if (deviceStatSearch && deviceStatSearch.value !== state.classMatrixDeviceStatSearch) {
        deviceStatSearch.value = state.classMatrixDeviceStatSearch;
    }
    const deviceSortLabels = {
        completed_desc: 'Hoàn thành nhiều nhất',
        rate_desc: 'Tỷ lệ cao nhất',
        name_asc: 'Tên thiết bị A–Z'
    };
    const deviceSortLabel = document.getElementById('classDeviceStatSortLabel');
    if (deviceSortLabel) deviceSortLabel.textContent = deviceSortLabels[state.classMatrixDeviceStatSort] || deviceSortLabels.completed_desc;
    document.querySelectorAll('[data-device-stat-sort]').forEach(option => {
        option.classList.toggle('is-selected', option.dataset.deviceStatSort === state.classMatrixDeviceStatSort);
    });
    const deviceReset = document.getElementById('classDeviceReset');
    if (deviceReset) deviceReset.hidden = data.selectedDeviceNames.length === data.allGroups.length;

    if (deviceProgressList) {
        const deviceSearch = state.classMatrixDeviceStatSearch.trim().toLocaleLowerCase('vi');
        const visibleDeviceStats = data.deviceStats
            .filter(item => item.assignedLabs > 0 && (!deviceSearch || item.device.toLocaleLowerCase('vi').includes(deviceSearch)))
            .sort((left, right) => {
                if (state.classMatrixDeviceStatSort === 'name_asc') return left.device.localeCompare(right.device, 'vi');
                if (state.classMatrixDeviceStatSort === 'rate_desc') {
                    const leftRate = left.totalPeople ? left.completedPeople / left.totalPeople : -1;
                    const rightRate = right.totalPeople ? right.completedPeople / right.totalPeople : -1;
                    return rightRate - leftRate || left.device.localeCompare(right.device, 'vi');
                }
                return right.completedPeople - left.completedPeople || left.device.localeCompare(right.device, 'vi');
            });
        deviceProgressList.innerHTML = visibleDeviceStats.map(item => `
            <button type="button" class="class-device-progress-item ${data.selectedDeviceNames.length === 1 && data.selectedDeviceNames[0] === item.device ? 'is-selected' : ''}"
                data-class-device-stat="${escapeHTML(item.device)}" ${data.isOverview ? 'disabled' : ''}
                aria-label="${escapeHTML(`${item.device}: ${item.completedPeople} trên ${item.totalPeople} KTV hoàn thành. ${data.isOverview ? 'Chọn lớp trước khi xem chi tiết.' : 'Lọc bảng nhân sự theo thiết bị này.'}`)}"
                title="${escapeHTML(`${item.completedPeople}/${item.totalPeople} KTV hoàn thành toàn bộ ${item.assignedLabs} bài được giao trên ${item.device}`)}">
                <span>${escapeHTML(item.device)}</span>
                <strong>${item.completedPeople}/${item.totalPeople}</strong>
                <small>${item.assignedLabs} bài được giao</small>
            </button>
        `).join('') || '<span class="class-device-progress-empty">Không có thiết bị phù hợp trong phạm vi lớp.</span>';
        deviceProgressList.querySelectorAll('[data-class-device-stat]').forEach(button => {
            button.addEventListener('click', () => {
                const device = button.dataset.classDeviceStat;
                state.classMatrixSelectedDevices = [device];
                renderClassMatrixReport();
                focusClassMatrixTable();
            });
        });
    }

    // Update the two interactive completion insights.
    const setEl = (id, val) => {
        const el = document.getElementById(id);
        if (el) el.textContent = val;
    };
    const personnelTotal = data.isOverview
        ? data.summaryRows.reduce((sum, row) => sum + row.memberCount, 0)
        : data.filteredCount;
    const personnelCompleted = data.isOverview
        ? data.summaryRows.reduce((sum, row) => sum + row.fullyCompletedCount, 0)
        : data.fullyCompletedPeople;
    const personnelRate = personnelTotal ? Math.round((personnelCompleted / personnelTotal) * 100) : 0;
    setEl('classPersonnelCompleted', `${personnelCompleted}/${personnelTotal}`);
    setEl('classPersonnelRate', `${personnelRate}%`);
    setEl('classPersonnelScope', data.selectedClass?.name || 'Tất cả lớp');
    const personnelSummary = document.getElementById('classPersonnelSummaryOpen');
    if (personnelSummary) personnelSummary.setAttribute(
        'aria-label',
        `${personnelCompleted} trên ${personnelTotal} KTV hoàn thành tất cả bài được giao. ${data.isOverview ? 'Chuyển đến bảng chọn lớp.' : 'Xem chi tiết nhân sự.'}`
    );
    const personnelProgress = document.getElementById('classPersonnelProgress');
    if (personnelProgress) personnelProgress.style.width = `${personnelRate}%`;
    renderClassOverview(data);
    if (data.isOverview) return;

    // Title
    const titleEl = document.getElementById('classMatrixTableTitle');
    if (titleEl) {
        const className = data.selectedClass?.name || 'Tất cả lớp học';
        titleEl.textContent = `Chi tiết lớp — ${className}`;
    }

    if (!data.totalKtv) {
        head.innerHTML = '';
        body.innerHTML = '';
        foot.innerHTML = '';
        if (scrollEl) scrollEl.hidden = true;
        if (emptyEl) {
            emptyEl.hidden = false;
            emptyEl.textContent = 'Chưa có KTV trong lớp này.';
        }
        return;
    }

    if (scrollEl) scrollEl.hidden = false;
    if (emptyEl) {
        emptyEl.hidden = data.rows.length > 0;
        emptyEl.textContent = state.classMatrixSelectedKtvs !== null
            ? 'Không có KTV nào thuộc bộ lọc đã chọn.'
            : state.classMatrixProgressFilter !== null
            ? 'Không có nhân sự phù hợp với mức tiến độ đã chọn.'
            : 'Không có dữ liệu phù hợp.';
    }

    const ktvFilterSearch = state.classMatrixKtvSearch.trim().toLocaleLowerCase('vi');
    const selectedKtvIds = state.classMatrixSelectedKtvs;
    const ktvFilterOptions = [...data.ktvOptions]
        .sort((left, right) => left.name.localeCompare(right.name, 'vi'))
        .map(learner => {
            const searchText = `${learner.name} ${learner.email} ${learner.code || ''}`.toLocaleLowerCase('vi');
            return `<label class="popover-option" ${ktvFilterSearch && !searchText.includes(ktvFilterSearch) ? 'hidden' : ''}>
                <input type="checkbox" value="${escapeHTML(learner.email)}" ${selectedKtvIds === null || selectedKtvIds.has(learner.email) ? 'checked' : ''}>
                <span><strong>${escapeHTML(learner.name)}</strong><small>${escapeHTML(formatClassEmployeeId(learner.code) || learner.email)}</small></span>
            </label>`;
        }).join('');

    // Render thead
    head.innerHTML = `
        <tr class="report-device-header-row">
            <th class="ktv-stt-head" scope="col" rowspan="2">STT</th>
            <th class="ktv-code-head" scope="col" rowspan="2">Mã NV</th>
            <th class="ktv-info-head" scope="col" rowspan="2">
                <div class="class-overview-head-wrap">
                    <span class="ktv-header-label">Kỹ thuật viên</span>
                    <div class="ktv-header-filter ${state.classMatrixSelectedKtvs !== null ? 'has-value' : ''}" id="classKtvFilterWrapper">
                        <button type="button" class="popover-trigger-btn" id="classKtvFilterTrigger"
                            aria-label="Lọc kỹ thuật viên theo tên, email hoặc mã nhân viên" aria-expanded="false"></button>
                        <div class="popover-dropdown header-filter-menu class-column-filter" role="dialog" aria-label="Lọc kỹ thuật viên">
                            <div class="header-filter-command-row">
                                <button type="button" id="classKtvFilterAll">Chọn tất cả</button>
                                <button type="button" id="classKtvFilterNone">Bỏ chọn</button>
                            </div>
                            <input type="search" class="popover-search" id="classKtvFilterInput"
                                value="${escapeHTML(state.classMatrixKtvSearch)}" placeholder="Tìm tên, email hoặc mã NV..." autocomplete="off" aria-label="Tìm kỹ thuật viên">
                            <div class="popover-options class-checklist-options" id="classKtvFilterOptions">${ktvFilterOptions || '<span class="popover-empty">Chưa có KTV.</span>'}</div>
                            <div class="popover-footer header-filter-footer">
                                <button type="button" class="popover-btn-clear" id="classKtvFilterClear">Xóa lọc</button>
                                <button type="button" class="popover-btn-apply header-filter-apply" id="classKtvFilterApply">Áp dụng</button>
                            </div>
                        </div>
                    </div>
                </div>
            </th>
            ${data.selectedGroups.map((group, index) => `
                <th class="report-device-group report-device-tone-${index % 5}" scope="colgroup" colspan="${(group.labs || []).length}">
                    ${escapeHTML(group.device)}
                    <span>${(group.labs || []).length} bài lab</span>
                </th>
            `).join('')}
            <th class="ktv-total-head" scope="col" rowspan="2">
                <div class="ktv-total-header-wrap">
                    <span class="ktv-header-label">Bài đạt / được giao</span>
                    <div class="popover-filter-wrapper ktv-header-filter ${state.classMatrixProgressFilter !== null ? 'has-value' : ''}" id="classProgressFilterWrapper">
                        <button type="button" class="popover-trigger-btn" id="classProgressFilterTrigger"
                            aria-label="Lọc theo tiến độ nhân sự" aria-haspopup="dialog" aria-expanded="false"></button>
                        <div class="popover-dropdown header-filter-menu" id="classProgressFilterDropdown">
                            <div class="header-filter-command-row">
                                <button type="button" id="classProgressFilterAll">Chọn tất cả</button>
                                <button type="button" id="classProgressFilterNone">Bỏ chọn</button>
                            </div>
                            <div class="popover-options ktv-filter-options" id="classProgressFilterOptions"></div>
                            <div class="popover-footer header-filter-footer">
                                <button type="button" class="popover-btn-clear" id="classProgressFilterClear">Xóa lọc</button>
                                <button type="button" class="header-filter-apply" id="classProgressFilterApply">Áp dụng</button>
                            </div>
                        </div>
                    </div>
                </div>
            </th>
            <th class="ktv-rate-head" scope="col" rowspan="2">
                <button type="button" class="ktv-header-sort" id="classMatrixRateSort"
                    data-matrix-sort="completion_rate_asc" aria-sort="none">
                    Tỷ lệ <span class="sort-mark"></span>
                </button>
            </th>
        </tr>
        <tr class="report-lab-header-row">
            ${data.columns.map(col => `
                <th class="report-lab-head report-device-tone-${col.groupIndex % 5} ${col.isFirst ? 'group-start' : ''} ${col.isLast ? 'group-end' : ''}" scope="col" title="${escapeHTML(`${col.device} • ${col.lab}`)}">
                    ${escapeHTML(col.lab)}
                </th>
            `).join('')}
        </tr>
    `;

    renderClassMatrixSortMarks();
    renderClassProgressFilterMenu(data);

    // Render tbody
    body.innerHTML = data.rows.map((row, index) => {
        const rateClass = row.rate === null ? 'report-cell-zero' : (row.rate >= 80 ? 'report-cell-high' : (row.rate >= 50 ? 'report-cell-medium' : 'report-cell-low'));
        return `
            <tr>
                <td class="ktv-stt-cell">${index + 1}</td>
                <td class="ktv-code-cell" title="${escapeHTML(row.code || 'Chưa có mã nhân viên')}">${escapeHTML(formatClassEmployeeId(row.code) || '—')}</td>
                <th class="ktv-info-cell" scope="row" title="${escapeHTML(`${row.name} (${row.email})`)}">
                    <div class="ktv-info-wrap">
                        <div class="ktv-info-top">
                            <span class="ktv-info-name">${escapeHTML(row.name)}</span>
                            ${row.region ? `<span class="ktv-info-badge">${escapeHTML(row.region)}</span>` : ''}
                        </div>
                        <div class="ktv-info-meta">
                            <span>${escapeHTML(row.email)}</span>
                        </div>
                    </div>
                </th>
                ${row.cells.map(cell => {
                    const passRate = cell.attempts ? Math.round((cell.passCount / cell.attempts) * 100) : null;
                    const cellClass = passRate === null ? 'report-cell-zero' : (passRate >= 80 ? 'report-cell-high' : (passRate >= 50 ? 'report-cell-medium' : 'report-cell-low'));
                    const tooltip = `${row.name} • ${cell.device} • ${cell.lab}: ${cell.passCount}/${cell.attempts} lượt đủ dữ liệu đạt • ${cell.submittedAttempts} lượt phát sinh • ${cell.legacyIncompleteAttempts} lượt thiếu chuỗi lịch sử`;
                    return `<td class="report-metric-cell ${cellClass}" title="${escapeHTML(tooltip)}"><strong>${cell.passCount}/${cell.attempts}</strong></td>`;
                }).join('')}
                <td class="ktv-total-cell ${rateClass}">
                    <strong>${row.completed}/${row.assigned}</strong>
                </td>
                <td class="ktv-rate-cell ${rateClass}">
                    ${row.rate === null ? '—' : `${row.rate}%`}
                </td>
            </tr>
        `;
    }).join('');

    // Render tfoot
    foot.innerHTML = `
        <tr>
            <td class="ktv-footer-stt" aria-hidden="true"></td>
            <td class="ktv-footer-code" aria-hidden="true"></td>
            <th class="ktv-footer-label" scope="row">Tổng</th>
            ${data.columns.map(col => {
                const colKey = `${col.device}\u001f${col.lab}`;
                const stat = data.labStats.get(colKey) || { assigned: 0, completed: 0, attempts: 0, submittedAttempts: 0, legacyIncompleteAttempts: 0 };
                const rate = stat.assigned > 0 ? Math.round((stat.completed / stat.assigned) * 100) : null;
                const cellClass = rate === null ? 'report-cell-zero' : (rate >= 80 ? 'report-cell-high' : (rate >= 50 ? 'report-cell-medium' : 'report-cell-low'));
                const tooltip = `${stat.completed}/${stat.assigned} KTV được giao đã hoàn thành • ${stat.submittedAttempts} lượt phát sinh • ${stat.attempts} lượt đủ dữ liệu • ${stat.legacyIncompleteAttempts} lượt thiếu chuỗi lịch sử`;
                return `
                    <td class="report-metric-cell ${cellClass} ${col.isFirst ? 'group-start' : ''}" title="${escapeHTML(tooltip)}">
                        <strong>${stat.completed}/${stat.assigned}</strong>
                    </td>
                `;
            }).join('')}
            <td class="ktv-footer-total report-row-total">
                <strong>${data.totalCompletedAll}/${data.totalAssignedAll}</strong>
            </td>
            <td class="ktv-footer-rate report-grand-total">
                <strong>${data.assignmentCompletionRate}%</strong>
            </td>
        </tr>
    `;

    // Bind horizontal wheel scroll
    if (scrollEl && scrollEl.dataset.wheelBound !== 'true') {
        scrollEl.dataset.wheelBound = 'true';
        scrollEl.addEventListener('wheel', (event) => {
            if (!event.shiftKey || Math.abs(event.deltaY) < Math.abs(event.deltaX)) return;
            event.preventDefault();
            scrollEl.scrollLeft += event.deltaY;
        }, { passive: false });
    }

    bindClassMatrixSortButtons();
    bindClassKtvFilterMenu();
    bindClassProgressFilterMenu();
}

function renderClassMatrixSortMarks() {
    document.querySelectorAll('#classMatrix .ktv-header-sort').forEach(button => {
        const mark = button.querySelector('.sort-mark');
        const header = button.closest('th');
        const isActive = state.classMatrixPersonnelSort === button.dataset.matrixSort;
        mark.textContent = isActive ? (state.classMatrixPersonnelSortDirection === 'asc' ? '↑' : '↓') : '↕';
        button.classList.toggle('is-sorted', isActive);
        if (header) header.setAttribute('aria-sort', isActive ? (state.classMatrixPersonnelSortDirection === 'asc' ? 'ascending' : 'descending') : 'none');
    });
}

function renderClassProgressFilterMenu(data) {
    const optionsEl = document.getElementById('classProgressFilterOptions');
    if (!optionsEl) return;
    const options = (data.progressOptions || [])
        .map(o => ({ value: o.value, label: `${o.completed}/${o.assigned} bài hoàn thành` }));
    const selectedValues = state.classMatrixProgressFilter;
    optionsEl.innerHTML = options.map(option => `
        <label class="popover-option">
            <input type="checkbox" value="${escapeHTML(option.value)}" ${selectedValues === null || selectedValues.has(option.value) ? 'checked' : ''}>
            ${escapeHTML(option.label)}
        </label>
    `).join('') || '<span class="popover-empty">Chưa có mức tiến độ để lọc.</span>';
}

function bindClassMatrixSortButtons() {
    document.querySelectorAll('#classMatrix .ktv-header-sort').forEach(button => {
        if (button.dataset.matrixSortBound === 'true') return;
        button.dataset.matrixSortBound = 'true';
        button.addEventListener('click', () => bindClassMatrixSortButtonClick(button));
    });
}

function bindClassMatrixSortButtonClick(button) {
    const target = button.dataset.matrixSort;
    if (state.classMatrixPersonnelSort === target) {
        state.classMatrixPersonnelSortDirection = state.classMatrixPersonnelSortDirection === 'asc' ? 'desc' : 'asc';
    } else {
        state.classMatrixPersonnelSort = target;
        state.classMatrixPersonnelSortDirection = target === 'name_asc' ? 'asc' : 'desc';
    }
    renderClassMatrixReport();
}

function bindClassProgressFilterMenu() {
    if (!document.getElementById('classProgressFilterWrapper')) return;
    const wrapper = document.querySelector('#classProgressFilterWrapper');
    const trigger = document.getElementById('classProgressFilterTrigger');
    const optionsEl = document.getElementById('classProgressFilterOptions');
    const clearBtn = document.getElementById('classProgressFilterClear');
    const applyBtn = document.getElementById('classProgressFilterApply');
    const selectAllBtn = document.getElementById('classProgressFilterAll');
    const selectNoneBtn = document.getElementById('classProgressFilterNone');
    if (!wrapper || !trigger) return;
    ensureClassPopoverDismissal();
    if (wrapper.dataset.ktvFilterBound === 'true') return;
    wrapper.dataset.ktvFilterBound = 'true';

    trigger.addEventListener('click', (e) => {
        e.stopPropagation();
        toggleClassHeaderPopover(wrapper, trigger);
    });
    wrapper.querySelector('.popover-dropdown')?.addEventListener('click', event => event.stopPropagation());
    const setAllOptions = checked => {
        optionsEl?.querySelectorAll('input[type="checkbox"]').forEach(checkbox => {
            checkbox.checked = checked;
        });
    };
    selectAllBtn?.addEventListener('click', () => setAllOptions(true));
    selectNoneBtn?.addEventListener('click', () => setAllOptions(false));
    clearBtn?.addEventListener('click', (e) => {
        e.preventDefault();
        setAllOptions(true);
    });
    applyBtn?.addEventListener('click', () => {
        const checkboxes = [...(optionsEl?.querySelectorAll('input[type="checkbox"]') || [])];
        const checkedValues = checkboxes.filter(checkbox => checkbox.checked).map(checkbox => checkbox.value);
        state.classMatrixProgressFilter = checkedValues.length === checkboxes.length
            ? null
            : new Set(checkedValues);
        closeClassHeaderPopovers();
        renderClassMatrixReport();
    });
}

function bindClassDeviceStatSortMenu() {
    const wrapper = document.getElementById('classDeviceStatSortWrapper');
    const trigger = document.getElementById('classDeviceStatSortTrigger');
    if (!wrapper || !trigger) return;
    ensureClassPopoverDismissal();
    trigger.addEventListener('click', event => {
        event.stopPropagation();
        toggleClassHeaderPopover(wrapper, trigger);
    });
    wrapper.querySelector('.popover-dropdown')?.addEventListener('click', event => event.stopPropagation());
    wrapper.querySelectorAll('[data-device-stat-sort]').forEach(option => {
        option.addEventListener('click', () => {
            state.classMatrixDeviceStatSort = option.dataset.deviceStatSort;
            closeClassHeaderPopovers();
            renderClassMatrixReport();
        });
    });
}

function initClassMatrix() {
    document.getElementById('classOverviewBack')?.addEventListener('click', () => {
        selectClassMatrixClass('all');
    });
    document.getElementById('classPersonnelSummaryOpen')?.addEventListener('click', () => {
        if (state.classMatrixSelectedClass === 'all') {
            const overview = document.getElementById('classOverviewCard');
            overview?.scrollIntoView({ behavior: 'smooth', block: 'start' });
            overview?.querySelector('.class-overview-open')?.focus({ preventScroll: true });
            return;
        }
        focusClassMatrixTable();
    });
    document.getElementById('classDeviceStatSearch')?.addEventListener('input', (e) => {
        state.classMatrixDeviceStatSearch = e.target.value;
        renderClassMatrixReport();
    });
    document.getElementById('classDeviceReset')?.addEventListener('click', () => {
        state.classMatrixSelectedDevices = null;
        renderClassMatrixReport();
    });
    bindClassDeviceStatSortMenu();
    // Matrix view toggle buttons (tab switch between Region matrix & KTV Class matrix)
    document.querySelectorAll('[data-matrix-tab-target]').forEach(btn => {
        btn.addEventListener('click', (e) => {
            e.preventDefault();
            const target = btn.dataset.matrixTabTarget;
            switchDashboardView(target);
        });
    });
}

function renderAll() {
    const dateSessions = getDateFilteredSessions();

    if (activeDashboardView === 'overview') {
        renderKpis();
        renderRegionUsageChart();
        renderOverviewMonthlyTrend(sessions);
        updateRangeText(dateSessions);
    } else if (activeDashboardView === 'instructors') {
        renderInstructorClassProgress();
        renderRealtimeSubmissions(dateSessions);
        updateRangeText(dateSessions);
    } else if (activeDashboardView === 'analytics') {
        renderDetailedReport(dateSessions.filter(item => item.mode === 'Thực hành'));
    } else if (activeDashboardView === 'class_matrix') {
        renderClassMatrixReport();
    } else if (activeDashboardView === 'technicians') {
        renderSessions(sessions);
        renderLearnerDetail(sessions);
        updatePopoverTriggerLabels();
        updateRangeText(dateSessions);
    }
    renderSortMarks();
    enhanceHeaderFilterPopovers();
}

function updatePopoverTriggerLabels() {
    const allKtvs = [...new Set(sessions.map(item => item.learner))].sort();
    const allDevices = getCanonicalDeviceList();
    const allLabs = getCanonicalLabList();
    const allRegions = [...new Set(sessions.map(item => item.region))].sort((a, b) => a.localeCompare(b, 'vi'));
    const learnerReset = document.getElementById('learnerFilterReset');
    const selectedLearners = state.learnerSelectedKtvs.size;
    const ktvFiltered = selectedLearners !== allKtvs.length;
    const emailFiltered = state.learnerSelectedEmails.size !== allKtvs.length;
    const regionFiltered = state.learnerSelectedRegions.size !== allRegions.length;
    const deviceFiltered = state.learnerSelectedDevices.size !== allDevices.length;
    const labFiltered = state.learnerSelectedLabs.size !== allLabs.length;
    document.getElementById('learnerKtvPopoverWrapper')?.classList.toggle('has-filter', ktvFiltered);
    document.getElementById('learnerEmailPopoverWrapper')?.classList.toggle('has-filter', emailFiltered);
    document.getElementById('learnerRegionPopoverWrapper')?.classList.toggle('has-filter', regionFiltered);
    document.getElementById('learnerDevicePopoverWrapper')?.classList.toggle('has-filter', deviceFiltered);
    document.getElementById('learnerLabPopoverWrapper')?.classList.toggle('has-filter', labFiltered);
    if (learnerReset) learnerReset.hidden = !ktvFiltered && !emailFiltered && !regionFiltered && !deviceFiltered && !labFiltered && !state.learnerSearchKtv.trim();

}

function initSort() {
    document.querySelectorAll('.sort-button').forEach(button => {
        button.addEventListener('click', () => {
            if (button.id === 'realtimeTimeSort') {
                state.realtimeTimeSortDir = state.realtimeTimeSortDir === 'asc' ? 'desc' : 'asc';
                state.realtimePage = 1;
                renderAll();
                return;
            }
            if (button.id === 'detailTimeSort') {
                state.detailSortKey = 'time';
                state.detailTimeSortDir = state.detailTimeSortDir === 'asc' ? 'desc' : 'asc';
                state.learnerDetailPage = 1;
                renderAll();
                return;
            }
            if (button.id === 'detailDurationSort') {
                state.detailSortKey = 'duration';
                state.detailDurationSortDir = state.detailDurationSortDir === 'asc' ? 'desc' : 'asc';
                state.learnerDetailPage = 1;
                renderAll();
                return;
            }
            const sortState = state.sessionsSort;
            if (sortState.key === button.dataset.key) {
                sortState.direction = sortState.direction === 'asc' ? 'desc' : 'asc';
            } else {
                sortState.key = button.dataset.key;
                sortState.direction = ['total', 'lastDateTimeMs'].includes(button.dataset.key) ? 'desc' : 'asc';
            }
            if (button.dataset.table === 'sessions') state.learnerTablePage = 1;
            renderAll();
        });
    });
}

function populateCalendarSelects() {
    const monthSelect = document.getElementById('dateRangeMonthSelect');
    const yearSelect = document.getElementById('dateRangeYearSelect');
    if (monthSelect) {
        monthSelect.innerHTML = Array.from({ length: 12 }, (_, index) => `<option value="${index}">Tháng ${index + 1}</option>`).join('');
    }
    if (yearSelect) {
        const y = new Date().getFullYear();
        yearSelect.innerHTML = [y - 1, y, y + 1].map(year => `<option value="${year}">${year}</option>`).join('');
    }
}

function renderCalendar() {
    const monthSelect = document.getElementById('dateRangeMonthSelect');
    const yearSelect = document.getElementById('dateRangeYearSelect');
    const startText = document.getElementById('dateRangeStartText');
    const endText = document.getElementById('dateRangeEndText');

    const month = state.calendarMonth.getMonth();
    const year = state.calendarMonth.getFullYear();

    if (monthSelect) monthSelect.value = month;
    if (yearSelect) yearSelect.value = year;
    if (startText) startText.textContent = formatDate(state.tempStartDate);
    if (endText) endText.textContent = formatDate(state.tempEndDate);

    const firstOfMonth = new Date(year, month, 1);
    const mondayOffset = (firstOfMonth.getDay() + 6) % 7;
    const gridStart = new Date(year, month, 1 - mondayOffset);
    const days = [];
    for (let i = 0; i < 42; i += 1) {
        const day = new Date(gridStart);
        day.setDate(gridStart.getDate() + i);
        const key = toDateKey(day);
        const selectedStart = state.tempStartDate ? parseDate(state.tempStartDate) : null;
        const selectedEnd = state.tempEndDate ? parseDate(state.tempEndDate) : null;
        const inRange = selectedStart && selectedEnd && day >= selectedStart && day <= selectedEnd;
        const isSelected = sameDay(day, selectedStart) || sameDay(day, selectedEnd);
        days.push(`
            <button type="button" class="date-day ${day.getMonth() !== month ? 'outside' : ''} ${inRange ? 'in-range' : ''} ${isSelected ? 'selected' : ''}" data-date="${key}">
                ${day.getDate()}
            </button>
        `);
    }
    const daysContainer = document.getElementById('dateRangeDays');
    if (daysContainer) {
        daysContainer.innerHTML = days.join('');
        daysContainer.querySelectorAll('.date-day').forEach(button => {
            button.addEventListener('click', () => {
                const selected = button.dataset.date;
                if (!state.tempStartDate || (state.tempStartDate && state.tempEndDate)) {
                    state.tempStartDate = selected;
                    state.tempEndDate = '';
                } else if (parseDate(selected) < parseDate(state.tempStartDate)) {
                    state.tempEndDate = state.tempStartDate;
                    state.tempStartDate = selected;
                } else {
                    state.tempEndDate = selected;
                }
                renderCalendar();
            });
        });
    }
}

function initDateRangePicker() {
    const monthInput = document.getElementById('overviewMonthSelect');
    if (monthInput) {
        const today = new Date();
        const trigger = document.getElementById('overviewMonthTrigger');
        const label = document.getElementById('overviewMonthLabel');
        const panel = document.getElementById('overviewMonthPanel');
        const yearSelect = document.getElementById('overviewYearSelect');
        const monthGrid = document.getElementById('overviewMonthGrid');
        const currentMonthButton = document.getElementById('overviewMonthToday');

        if (panel) {
            panel.classList.add('portal');
            document.body.appendChild(panel);
        }

        const positionMonthPanel = () => {
            if (!trigger || !panel) return;
            const rect = trigger.getBoundingClientRect();
            const panelWidth = 288;
            const left = Math.max(12, Math.min(window.innerWidth - panelWidth - 12, rect.right - panelWidth));
            panel.style.top = `${rect.bottom + 12}px`;
            panel.style.left = `${left}px`;
        };

        const applySelectedMonth = (year, monthIndex, closePanel = true) => {
            monthInput.value = `${year}-${String(monthIndex + 1).padStart(2, '0')}`;
            const bounds = getMonthBounds(monthInput.value);
            if (!bounds) return;
            state.startDate = bounds.start;
            state.endDate = bounds.end;
            state.tempStartDate = bounds.start;
            state.tempEndDate = bounds.end;
            state.calendarMonth = new Date(bounds.year, bounds.monthIndex, 1);
            state.regionUsageYear = bounds.year;
            state.dashboardReportStatus = 'loading';
            state.learnerTablePage = 1;
            state.learnerDetailPage = 1;
            state.realtimePage = 1;
            if (label) label.textContent = `${String(monthIndex + 1).padStart(2, '0')}/${year}`;
            if (yearSelect) yearSelect.value = String(year);
            if (closePanel) {
                panel?.classList.remove('open');
                trigger?.setAttribute('aria-expanded', 'false');
                trigger?.focus();
            }
            renderMonthGrid(year);
            renderAll();
            if (dashboardReport || sessions.length) reloadDashboardReport();
        };

        const renderMonthGrid = (year = Number(yearSelect?.value) || today.getFullYear()) => {
            if (!monthGrid) return;
            const selectedBounds = getMonthBounds(monthInput.value);
            monthGrid.innerHTML = Array.from({ length: 12 }, (_, monthIndex) => {
                const isFuture = year > today.getFullYear()
                    || (year === today.getFullYear() && monthIndex > today.getMonth());
                const isSelected = selectedBounds?.year === year && selectedBounds?.monthIndex === monthIndex;
                return `<button type="button" class="overview-month-option ${isSelected ? 'selected' : ''}" data-report-month="${monthIndex}" aria-label="Tháng ${monthIndex + 1} năm ${year}" aria-pressed="${isSelected ? 'true' : 'false'}" ${isFuture ? 'disabled' : ''}>Th ${monthIndex + 1}</button>`;
            }).join('');
            monthGrid.querySelectorAll('[data-report-month]').forEach(button => {
                button.addEventListener('click', () => {
                    applySelectedMonth(year, Number(button.dataset.reportMonth));
                });
            });
        };

        if (yearSelect) {
            yearSelect.innerHTML = Array.from({ length: 3 }, (_, index) => today.getFullYear() - 2 + index)
                .map(year => `<option value="${year}">${year}</option>`)
                .join('');
            yearSelect.value = String(today.getFullYear());
            yearSelect.addEventListener('change', () => renderMonthGrid(Number(yearSelect.value)));
        }

        trigger?.addEventListener('click', (event) => {
            event.stopPropagation();
            const willOpen = !panel?.classList.contains('open');
            panel?.classList.toggle('open', willOpen);
            trigger.setAttribute('aria-expanded', String(willOpen));
            if (willOpen) {
                positionMonthPanel();
                renderMonthGrid(Number(yearSelect?.value) || today.getFullYear());
                window.requestAnimationFrame(() => {
                    const selectedMonth = monthGrid?.querySelector('[aria-pressed="true"]');
                    if (selectedMonth) selectedMonth.focus();
                    else yearSelect?.focus();
                });
            }
        });
        panel?.addEventListener('click', event => event.stopPropagation());
        panel?.addEventListener('keydown', event => {
            if (event.key === 'Escape') {
                event.preventDefault();
                event.stopPropagation();
                panel.classList.remove('open');
                trigger?.setAttribute('aria-expanded', 'false');
                trigger?.focus();
                return;
            }
            trapDialogFocus(event, panel);
        });
        currentMonthButton?.addEventListener('click', () => applySelectedMonth(today.getFullYear(), today.getMonth()));
        document.addEventListener('click', () => {
            panel?.classList.remove('open');
            trigger?.setAttribute('aria-expanded', 'false');
        });
        document.addEventListener('keydown', event => {
            if (event.key === 'Escape' && panel?.classList.contains('open')) {
                event.preventDefault();
                panel?.classList.remove('open');
                trigger?.setAttribute('aria-expanded', 'false');
                trigger?.focus();
            }
        });
        window.addEventListener('resize', () => {
            if (panel?.classList.contains('open')) positionMonthPanel();
        });
        window.addEventListener('scroll', () => {
            if (panel?.classList.contains('open')) positionMonthPanel();
        }, true);

        applySelectedMonth(today.getFullYear(), today.getMonth(), false);
        return;
    }

    populateCalendarSelects();
    renderCalendar();
    const picker = document.getElementById('dateRangePicker');
    const panel = document.getElementById('dateRangePanel');

    document.getElementById('dateRangeTrigger')?.addEventListener('click', (event) => {
        event.stopPropagation();
        state.tempStartDate = state.startDate;
        state.tempEndDate = state.endDate;
        renderCalendar();
        picker?.classList.toggle('open');
    });

    panel?.addEventListener('click', (event) => {
        event.stopPropagation();
    });

    document.getElementById('dateRangePrev')?.addEventListener('click', (e) => {
        e.stopPropagation();
        state.calendarMonth.setMonth(state.calendarMonth.getMonth() - 1);
        renderCalendar();
    });

    document.getElementById('dateRangeNext')?.addEventListener('click', (e) => {
        e.stopPropagation();
        state.calendarMonth.setMonth(state.calendarMonth.getMonth() + 1);
        renderCalendar();
    });

    document.getElementById('dateRangeMonthSelect')?.addEventListener('change', (event) => {
        state.calendarMonth.setMonth(Number(event.target.value));
        renderCalendar();
    });

    document.getElementById('dateRangeYearSelect')?.addEventListener('change', (event) => {
        state.calendarMonth.setFullYear(Number(event.target.value));
        renderCalendar();
    });

    document.getElementById('dateRangeApply')?.addEventListener('click', (e) => {
        e.stopPropagation();
        state.startDate = state.tempStartDate;
        state.endDate = state.tempEndDate || state.tempStartDate;
        if (state.startDate) state.regionUsageYear = parseDate(state.startDate).getFullYear();
        state.dashboardReportStatus = 'loading';
        state.learnerTablePage = 1;
        state.learnerDetailPage = 1;
        state.realtimePage = 1;
        picker?.classList.remove('open');
        renderAll();
        if (dashboardReport || sessions.length) reloadDashboardReport();
    });

    document.getElementById('dateRangeClear')?.addEventListener('click', (e) => {
        e.stopPropagation();
        const nowClear = new Date();
        const first = new Date(nowClear.getFullYear(), nowClear.getMonth(), 1);
        const last = new Date(nowClear.getFullYear(), nowClear.getMonth() + 1, 0);
        state.tempStartDate = fmtDate(first);
        state.tempEndDate = fmtDate(last);
        state.startDate = fmtDate(first);
        state.endDate = fmtDate(last);
        state.regionUsageYear = nowClear.getFullYear();
        state.dashboardReportStatus = 'loading';
        state.learnerTablePage = 1;
        state.learnerDetailPage = 1;
        state.realtimePage = 1;
        picker?.classList.remove('open');
        renderCalendar();
        renderAll();
        if (dashboardReport || sessions.length) reloadDashboardReport();
    });

    document.addEventListener('click', (event) => {
        if (picker && !picker.contains(event.target)) picker.classList.remove('open');
    });
}

const REPORT_EXPORT_TEMPLATE_VERSION = 'FTC-XLSX-1.0';
const REPORT_EXPORT_DEFAULT_BY_VIEW = {
    overview: 'activity',
    technicians: 'activity',
    analytics: 'region',
    instructors: 'class_matrix',
    class_matrix: 'class_matrix',
    roster: 'roster'
};

function getDefaultReportExportType() {
    return REPORT_EXPORT_DEFAULT_BY_VIEW[activeDashboardView] || 'activity';
}

function normalizeReportFilenamePart(value, fallback = 'bao_cao') {
    const normalized = String(value || '')
        .replace(/đ/g, 'd')
        .replace(/Đ/g, 'D')
        .normalize('NFD')
        .replace(/[\u0300-\u036f]/g, '')
        .replace(/[^a-zA-Z0-9]+/g, '_')
        .replace(/^_+|_+$/g, '')
        .replace(/_+/g, '_')
        .slice(0, 72);
    return normalized || fallback;
}

function buildReportFilename(prefix, scope = '') {
    const timestamp = new Date();
    const timePart = `${String(timestamp.getHours()).padStart(2, '0')}${String(timestamp.getMinutes()).padStart(2, '0')}`;
    const safePrefix = normalizeReportFilenamePart(prefix, 'FTC_Bao_cao');
    const safeScope = scope ? `_${normalizeReportFilenamePart(scope, '')}` : '';
    return `${safePrefix}${safeScope}_${fmtDate(timestamp)}_${timePart}.xlsx`;
}

function triggerReportDownload(blob, filename) {
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = filename;
    link.style.display = 'none';
    document.body.appendChild(link);
    link.click();
    link.remove();
    window.setTimeout(() => URL.revokeObjectURL(url), 1500);
}

function buildReportExportPayload(type, descriptor) {
    const base = {
        type,
        version: REPORT_EXPORT_TEMPLATE_VERSION,
        filename: descriptor.filename,
        period: descriptor.period,
        scope: descriptor.scope
    };
    if (type === 'roster') {
        return {
            ...base,
            filters: {
                status: state.rosterStatusFilter,
                ...state.rosterColumnFilters
            }
        };
    }
    if (!Array.isArray(descriptor.rows) || !descriptor.rows.length) {
        throw new Error('Không có dữ liệu phù hợp để xuất báo cáo.');
    }
    if (!Array.isArray(descriptor.headers) || !descriptor.headers.length) {
        throw new Error('Báo cáo chưa có cột dữ liệu để xuất.');
    }
    return {
        ...base,
        metadata: descriptor.metadata || [],
        headers: descriptor.headers,
        columnTypes: descriptor.columnTypes || descriptor.headers.map(() => 'text'),
        rows: descriptor.rows
    };
}

async function downloadXlsxReport(type, descriptor) {
    const response = await fetch(`${API_BASE_URL}/reports/export`, {
        method: 'POST',
        credentials: 'same-origin',
        headers: {
            'Accept': 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
            'Content-Type': 'application/json'
        },
        body: JSON.stringify(buildReportExportPayload(type, descriptor))
    });
    if (!response.ok) throw new Error(await getReportResponseError(response));

    const blob = await response.blob();
    if (!blob.size) throw new Error('Máy chủ trả về file Excel rỗng.');
    const signature = new Uint8Array(await blob.slice(0, 4).arrayBuffer());
    if (signature.length !== 4 || signature[0] !== 0x50 || signature[1] !== 0x4B
        || signature[2] !== 0x03 || signature[3] !== 0x04) {
        throw new Error('File tải về không phải là workbook Excel hợp lệ.');
    }

    const filename = getResponseDownloadFilename(response, descriptor.filename);
    triggerReportDownload(blob, filename);
    return filename;
}

function getTechnicianFilteredExportRows() {
    let rows = [...sessions];
    const applySetFilter = (set, touched, getValue) => {
        if (!touched && !set.size) return;
        rows = rows.filter(item => set.has(getValue(item)));
    };
    applySetFilter(state.learnerSelectedKtvs, state.learnerKtvsTouched, item => item.learner);
    applySetFilter(state.learnerSelectedEmails, state.learnerEmailsTouched, item => item.learner);
    applySetFilter(state.learnerSelectedRegions, state.learnerRegionsTouched, item => item.region);
    applySetFilter(state.learnerSelectedDevices, state.learnerDevicesTouched, item => item.device);
    applySetFilter(state.learnerSelectedLabs, state.learnerLabsTouched, item => item.lab);
    const keyword = state.learnerSearchKtv.trim().toLocaleLowerCase('vi');
    if (keyword) {
        rows = rows.filter(item => `${getLearnerName(item.learner)} ${item.learner}`.toLocaleLowerCase('vi').includes(keyword));
    }
    return rows;
}

function buildActivityReportDescriptor() {
    const sourceRows = activeDashboardView === 'technicians'
        ? getTechnicianFilteredExportRows()
        : getDateFilteredSessions();
    const orderedRows = [...sourceRows].sort((left, right) => sessionTimestampMs(right) - sessionTimestampMs(left));
    const period = activeDashboardView === 'technicians' ? 'Dữ liệu lũy kế' : getRangeLabel();
    const scope = activeDashboardView === 'technicians'
        ? 'Các bộ lọc đang áp dụng tại trang Thống kê kỹ thuật viên'
        : 'Tất cả phiên hoạt động trong kỳ đã chọn';
    return {
        type: 'activity',
        title: 'FTC - BÁO CÁO CHI TIẾT HOẠT ĐỘNG KTV',
        period,
        scope,
        filename: buildReportFilename('FTC_Chi_tiet_hoat_dong_KTV'),
        countLabel: `${formatNumber.format(orderedRows.length)} phiên hoạt động`,
        available: orderedRows.length > 0,
        metadata: [
            ['Quy ước thời lượng', 'Giây và định dạng đọc nhanh'],
            ['Thứ tự dữ liệu', 'Mới nhất đến cũ nhất']
        ],
        headers: [
            'STT', 'Ngày', 'Giờ', 'Mã phiên', 'Mã NV', 'Họ và tên', 'Email', 'Vị trí',
            'Khu vực / Chi nhánh', 'Chi nhánh', 'Đơn vị', 'Lớp', 'Thiết bị', 'Bài lab', 'Kỹ năng',
            'Chế độ', 'Kết quả', 'Hoàn thành lần đầu', 'Thời lượng (giây)',
            'Thời lượng', 'Hành động cuối'
        ],
        columnTypes: [
            'integer', 'date', 'time', 'text', 'text', 'text', 'text', 'text',
            'text', 'text', 'text', 'text', 'text', 'text', 'text', 'text',
            'text', 'text', 'integer', 'text', 'text'
        ],
        rows: orderedRows.map((row, index) => {
            const technician = technicianByIdentity.get(String(row.learner || '').trim().toLowerCase())
                || technicianByIdentity.get(String(row.technicianId || '').trim().toLowerCase());
            const email = technician?.email || (String(row.learner || '').includes('@') ? row.learner : '');
            return [
                index + 1,
                row.date || '',
                row.time || '',
                row.sessionId || '',
                technician?.employeeId || row.technicianId || '',
                technician?.displayName || row.technicianName || getLearnerName(row.learner),
                email,
                technician?.jobTitle || row.jobTitle || '',
                technician?.dashboardRegion || row.region || '',
                technician?.branchName || row.branchName || '',
                technician?.unitName || row.unitName || row.unitCode || '',
                technician?.className || technician?.classCode || row.classCode || '',
                row.device || '',
                row.lab || '',
                row.skill || '',
                row.mode || '',
                row.status || 'Chưa có kết quả',
                row.firstTry === true ? 'Có' : (row.firstTry === false ? 'Không' : ''),
                row.duration ?? '',
                row.duration === null || row.duration === undefined ? '' : formatDuration(row.duration),
                row.lastAction || ''
            ];
        })
    };
}

function formatAuthoritativeRegionMetric(cell = {}) {
    const population = Number(cell.population_count) || 0;
    if (!population) return '—';
    const completed = Number(cell.completed_count) || 0;
    const submittedAttempts = Number(cell.submitted_attempt_count ?? cell.attempt_count) || 0;
    const eligibleAttempts = Number(cell.rate_eligible_attempt_count ?? cell.attempt_count) || 0;
    const incompleteAttempts = Number(cell.legacy_incomplete_attempt_count ?? cell.incomplete_attempt_count) || 0;
    const rate = cell.completion_rate === null || cell.completion_rate === undefined
        ? Math.round((completed / population) * 100)
        : Number(cell.completion_rate);
    return `${completed}/${population} (${rate}%) · phát sinh ${submittedAttempts} · đủ dữ liệu ${eligibleAttempts} · thiếu lịch sử ${incompleteAttempts}`;
}

function buildAuthoritativeRegionReportDescriptor(matrix) {
    const groups = matrix.device_groups || [];
    const columns = groups.flatMap(group => (group.labs || []).map(lab => ({
        device: group.device?.name || group.device?.device_name || group.device_name || '',
        lab: lab.name || lab.lab_name || '',
        labId: lab.lab_id || ''
    })));
    const rows = (matrix.rows || []).map((row, index) => {
        const region = row.region || {};
        const regionName = region.name || region.region_name || region.code || region.region_code || '';
        const location = regionName;
        return [
            index + 1,
            location,
            ...columns.map(column => formatAuthoritativeRegionMetric(row.cells?.[column.labId])),
            formatAuthoritativeRegionMetric(row.total)
        ];
    });
    return {
        type: 'region',
        title: 'FTC - BÁO CÁO TIẾN ĐỘ THỰC HÀNH THEO CHI NHÁNH',
        period: dashboardReport?.meta?.period?.label || getRangeLabel(),
        scope: 'Kết quả theo khu vực, thiết bị và bài lab',
        filename: buildReportFilename('FTC_Tien_do_theo_chi_nhanh'),
        countLabel: `${formatNumber.format(rows.length)} khu vực · ${formatNumber.format(columns.length)} bài lab`,
        available: rows.length > 0 && columns.length > 0,
        metadata: [
            ['Phạm vi', 'Toàn bộ KTV đang hoạt động theo khu vực hiện tại; không yêu cầu assignment'],
            ['Quy ước ô dữ liệu', 'KTV đã đạt/tổng KTV khu vực (tỷ lệ) · lượt phát sinh · lượt đủ dữ liệu đánh giá · lượt thiếu dữ liệu lịch sử']
        ],
        headers: ['STT', 'Khu vực / Chi nhánh', ...columns.map(column => `${column.device} - ${column.lab}`), 'Tổng khu vực'],
        columnTypes: ['integer', 'text', ...columns.map(() => 'text'), 'text'],
        rows
    };
}

function buildRegionReportDescriptor() {
    if (dashboardReport?.matrix && dashboardReportMatchesSelectedPeriod()) {
        return buildAuthoritativeRegionReportDescriptor(dashboardReport.matrix);
    }
    return {
        type: 'region',
        title: 'FTC - BÁO CÁO TIẾN ĐỘ THỰC HÀNH THEO CHI NHÁNH',
        period: getRangeLabel(),
        scope: 'Không tải được dữ liệu KTV và phiên thực hành theo khu vực',
        filename: buildReportFilename('FTC_Tien_do_theo_chi_nhanh'),
        countLabel: 'Chưa thể lập báo cáo chính xác',
        available: false,
        metadata: [['Trạng thái', 'Không xuất tỷ lệ khi không tải được danh mục KTV đang hoạt động']],
        headers: [],
        columnTypes: [],
        rows: []
    };
}

function buildClassMatrixReportDescriptor() {
    const data = getClassMatrixData();
    const classLabel = data.selectedClass?.name || (state.classMatrixSelectedClass === 'all' ? 'Tất cả lớp' : 'Chưa xếp lớp');
    const deviceLabel = data.selectedGroups.length === data.allGroups.length
        ? 'Tất cả thiết bị'
        : (data.selectedGroups.map(group => group.device).join(', ') || 'Không chọn thiết bị');
    const filterLabel = data.isOverview && state.classOverviewSelectedClasses !== null
        ? ` · Đã lọc ${data.summaryRows.length}/${data.classes.length} lớp`
        : (!data.isOverview && state.classMatrixSelectedKtvs !== null
            ? ` · Đã lọc ${state.classMatrixSelectedKtvs.size}/${data.totalKtv} KTV`
            : '');
    const scope = `${classLabel} · ${deviceLabel}${filterLabel}`;
    if (data.isOverview) {
        return {
            type: 'class_matrix',
            title: 'FTC - BÁO CÁO TỔNG HỢP TẤT CẢ LỚP',
            period: 'Dữ liệu lũy kế',
            scope,
            filename: buildReportFilename('FTC_Tong_hop_tat_ca_lop'),
            countLabel: `${formatNumber.format(data.summaryRows.length)} lớp`,
            available: data.summaryRows.length > 0,
            metadata: [
                ['Thiết bị', deviceLabel],
                ['KTV hoàn thành', 'KTV hoàn thành tất cả bài lab được giao'],
                ['Tỷ lệ hoàn thành', 'KTV hoàn thành tất cả bài được giao / Tổng KTV của lớp']
            ],
            headers: ['STT', 'Mã lớp', 'Tên lớp', 'Số KTV', 'Thiết bị đã giao', 'Lượt phát sinh', 'Lượt đủ dữ liệu', 'Thiếu dữ liệu lịch sử', 'KTV hoàn thành', 'Tỷ lệ hoàn thành'],
            columnTypes: ['integer', 'text', 'text', 'integer', 'integer', 'integer', 'integer', 'integer', 'text', 'percent'],
            rows: data.summaryRows.map((row, index) => [
                index + 1,
                row.code || '',
                row.name || '',
                row.memberCount,
                row.deviceCount,
                row.submittedAttempts,
                row.attempts,
                row.legacyIncompleteAttempts,
                `${row.fullyCompletedCount}/${row.memberCount}`,
                row.rate === null ? '' : row.rate / 100
            ])
        };
    }
    return {
        type: 'class_matrix',
        title: 'FTC - BÁO CÁO TIẾN ĐỘ KTV THEO LỚP',
        period: 'Dữ liệu lũy kế',
        scope,
        filename: buildReportFilename('FTC_Tien_do_KTV_theo_lop', classLabel),
        countLabel: `${formatNumber.format(data.rows.length)} KTV · ${formatNumber.format(data.columns.length)} bài lab`,
        available: data.rows.length > 0 && data.columns.length > 0,
        metadata: [
            ['Lớp học', classLabel],
            ['Thiết bị', deviceLabel],
            ['Tiến độ tổng', `${data.totalCompletedAll}/${data.totalAssignedAll} (${data.assignmentCompletionRate}%)`],
            ['Tổng lượt phát sinh', data.totalSubmittedSessions],
            ['Lượt đủ dữ liệu đánh giá', data.totalSessions],
            ['Thiếu dữ liệu lịch sử', data.totalIncompleteSessions],
            ['Quy ước ô dữ liệu', 'Số lượt Đạt / Số lượt đủ dữ liệu đánh giá; lượt thiếu chuỗi lịch sử không tính vào tỷ lệ']
        ],
        headers: [
            'STT', 'Mã NV', 'Họ và tên', 'Email', 'Khu vực / Chi nhánh', 'Lớp học',
            ...data.columns.map(column => `${column.device} - ${column.lab}`),
            'Bài đã đạt', 'Bài trong phạm vi', 'Tỷ lệ hoàn thành (%)', 'Lượt phát sinh', 'Lượt đủ dữ liệu', 'Thiếu dữ liệu lịch sử'
        ],
        columnTypes: [
            'integer', 'text', 'text', 'text', 'text', 'text',
            ...data.columns.map(() => 'text'),
            'integer', 'integer', 'percent', 'integer', 'integer', 'integer'
        ],
        rows: data.rows.map((row, index) => [
            index + 1,
            row.code || '',
            row.name || '',
            row.email || '',
            row.region || '',
            row.className || row.classCode || classLabel,
            ...row.cells.map(cell => `${cell.passCount}/${cell.attempts}`),
            row.completed,
            row.assigned,
            row.rate === null || row.rate === undefined ? '' : row.rate / 100,
            row.submittedAttempts,
            row.attempts,
            row.legacyIncompleteAttempts
        ])
    };
}

function getRosterExportScope() {
    const statusLabels = { active: 'Đang công tác', terminated: 'Đã nghỉ', all: 'Tất cả trạng thái' };
    const selectedStatuses = state.rosterStatusFilter;
    const status = !Array.isArray(selectedStatuses)
        ? statusLabels.all
        : (selectedStatuses.length
            ? selectedStatuses.map(value => statusLabels[value] || value).join(', ')
            : 'Không chọn trạng thái nào');
    const filterLabels = {
        employeeId: 'Mã NV',
        name: 'Họ tên',
        email: 'Email',
        jobTitle: 'Vị trí',
        region: 'Khu vực',
        branch: 'Chi nhánh',
        className: 'Lớp'
    };
    const activeFilters = Object.entries(state.rosterColumnFilters)
        .filter(([, value]) => Array.isArray(value))
        .map(([key, value]) => `${filterLabels[key]}: ${value.length ? value.join(', ') : 'Không chọn giá trị nào'}`);
    return [status, ...activeFilters].join(' · ');
}

function getRosterReportPreview() {
    return {
        type: 'roster',
        period: 'Tại thời điểm xuất',
        scope: getRosterExportScope(),
        filename: buildReportFilename('FTC_Danh_sach_KTV'),
        countLabel: state.rosterLoaded ? `${formatNumber.format(state.rosterTotal)} hồ sơ KTV` : 'Toàn bộ kết quả phù hợp',
        available: true
    };
}

function getReportExportPreview(type) {
    if (type === 'region') return buildRegionReportDescriptor();
    if (type === 'class_matrix') return buildClassMatrixReportDescriptor();
    if (type === 'roster') return getRosterReportPreview();
    return buildActivityReportDescriptor();
}

async function ensureTrainingAssignmentsLoaded({ force = false } = {}) {
    if (state.assignmentsLoaded && !force) return trainingAssignments;
    const response = await fetch(`${API_BASE_URL}/dashboard/all?include_assignments=1`);
    if (!response.ok) throw new Error(`API tiến độ lớp trả về HTTP ${response.status}`);
    const payload = await response.json();
    const data = payload.data || {};
    if (data.assignments_available !== true) {
        throw new Error('Dữ liệu phân lớp hiện không khả dụng.');
    }
    trainingAssignments = normalizeTrainingAssignments(data.assignments || []);
    classMemberships = normalizeClassMemberships(data.class_memberships || []);
    state.assignmentsLoaded = true;
    initializeInstructorClasses();
    if (['instructors', 'class_matrix', 'analytics', 'technicians'].includes(activeDashboardView)) renderAll();
    return trainingAssignments;
}

async function refreshAssignmentsForClassExport() {
    return ensureTrainingAssignmentsLoaded({ force: true });
}

function getResponseDownloadFilename(response, fallback) {
    const disposition = response.headers.get('Content-Disposition') || '';
    const utf8Match = disposition.match(/filename\*=UTF-8''([^;]+)/i);
    if (utf8Match) {
        try { return decodeURIComponent(utf8Match[1]); } catch (error) { /* use fallback below */ }
    }
    const plainMatch = disposition.match(/filename="?([^";]+)"?/i);
    return plainMatch?.[1] || fallback;
}

async function getReportResponseError(response) {
    const payload = await response.clone().json().catch(() => null);
    return payload?.error?.message || payload?.message || `Yêu cầu xuất báo cáo thất bại (HTTP ${response.status}).`;
}

function getSelectedReportExportType() {
    return document.querySelector('input[name="reportExportType"]:checked')?.value || getDefaultReportExportType();
}

function setReportExportStatus(message = '', type = 'info') {
    const status = document.getElementById('reportExportStatus');
    if (!status) return;
    status.hidden = !message;
    status.textContent = message;
    status.classList.toggle('is-error', type === 'error');
    status.classList.toggle('is-info', type === 'info');
}

function setReportExportBusy(busy) {
    reportExportBusy = busy;
    const download = document.getElementById('reportExportDownload');
    const close = document.getElementById('reportExportClose');
    const cancel = document.getElementById('reportExportCancel');
    document.querySelectorAll('input[name="reportExportType"]').forEach(input => { input.disabled = busy; });
    document.querySelectorAll('.report-export-option').forEach(option => option.classList.toggle('is-disabled', busy));
    if (download) {
        download.disabled = busy;
        download.classList.toggle('is-busy', busy);
        const label = download.querySelector('span');
        if (label) label.textContent = busy ? 'Đang tạo file…' : 'Tải báo cáo';
    }
    if (close) close.disabled = busy;
    if (cancel) cancel.disabled = busy;
}

function updateReportExportDialog() {
    const type = getSelectedReportExportType();
    document.querySelectorAll('.report-export-option').forEach(option => {
        option.classList.toggle('is-selected', option.dataset.reportOption === type);
    });
    let preview;
    try {
        preview = getReportExportPreview(type);
    } catch (error) {
        preview = { period: '—', scope: 'Không thể đọc bộ lọc hiện tại', countLabel: 'Không có dữ liệu', filename: 'FTC_Bao_cao.xlsx', available: false };
    }
    const values = {
        reportExportPeriod: preview.period,
        reportExportScope: preview.scope,
        reportExportCount: preview.countLabel,
        reportExportFilename: preview.filename
    };
    Object.entries(values).forEach(([id, value]) => {
        const element = document.getElementById(id);
        if (element) element.textContent = value || '—';
    });
    const download = document.getElementById('reportExportDownload');
    if (download && !reportExportBusy) download.disabled = preview.available === false;
}

function openReportExportDialog() {
    if (!ensureReportExportAllowed()) return;
    const backdrop = document.getElementById('reportExportBackdrop');
    if (!backdrop) return;
    reportExportReturnFocus = document.activeElement;
    const defaultType = getDefaultReportExportType();
    const input = document.querySelector(`input[name="reportExportType"][value="${defaultType}"]`)
        || document.querySelector('input[name="reportExportType"]');
    if (input) input.checked = true;
    setReportExportStatus();
    setReportExportBusy(false);
    updateReportExportDialog();
    backdrop.hidden = false;
    backdrop.setAttribute('aria-hidden', 'false');
    document.body.classList.add('report-export-open');
    window.setTimeout(() => document.getElementById('reportExportClose')?.focus(), 0);
}

function closeReportExportDialog() {
    if (reportExportBusy) return;
    const backdrop = document.getElementById('reportExportBackdrop');
    if (!backdrop || backdrop.hidden) return;
    backdrop.hidden = true;
    backdrop.setAttribute('aria-hidden', 'true');
    document.body.classList.remove('report-export-open');
    if (reportExportReturnFocus instanceof HTMLElement) reportExportReturnFocus.focus();
    reportExportReturnFocus = null;
}

async function handleReportExportDownload() {
    if (reportExportBusy || !ensureReportExportAllowed()) return;
    const type = getSelectedReportExportType();
    setReportExportBusy(true);
    setReportExportStatus(type === 'class_matrix' ? 'Đang đồng bộ dữ liệu lớp mới nhất…' : 'Đang chuẩn bị file báo cáo…', 'info');
    try {
        if (type === 'class_matrix') await refreshAssignmentsForClassExport();
        const descriptor = getReportExportPreview(type);
        const filename = await downloadXlsxReport(type, descriptor);
        setReportExportStatus(`Đã tạo “${filename}”. Trình duyệt đang tải file xuống.`, 'success');
    } catch (error) {
        console.error('Không thể xuất báo cáo.', error);
        setReportExportStatus(error?.message || 'Không thể tạo báo cáo. Vui lòng thử lại.', 'error');
    } finally {
        setReportExportBusy(false);
        updateReportExportDialog();
    }
}

function initReportExport() {
    document.getElementById('exportBtn')?.addEventListener('click', openReportExportDialog);
    document.getElementById('reportExportClose')?.addEventListener('click', closeReportExportDialog);
    document.getElementById('reportExportCancel')?.addEventListener('click', closeReportExportDialog);
    document.getElementById('reportExportDownload')?.addEventListener('click', handleReportExportDownload);
    document.querySelectorAll('input[name="reportExportType"]').forEach(input => {
        input.addEventListener('change', () => {
            setReportExportStatus();
            updateReportExportDialog();
        });
    });
    document.getElementById('reportExportBackdrop')?.addEventListener('click', event => {
        if (event.target === event.currentTarget) closeReportExportDialog();
    });
    document.addEventListener('keydown', event => {
        const backdrop = document.getElementById('reportExportBackdrop');
        if (backdrop?.hidden) return;
        if (event.key === 'Escape') {
            event.preventDefault();
            closeReportExportDialog();
            return;
        }
        trapDialogFocus(event, backdrop.querySelector('.report-export-dialog'));
    });
}

const DONUT_COLORS = ['#e43f86', '#7953c7', '#39b8da', '#f5a623', '#3dcc72', '#a55bb5'];

function renderDeviceDonutChart(rows) {
    const donutContainer = document.getElementById('learnerDeviceDonut');
    const legendContainer = document.getElementById('learnerDeviceLegend');
    if (!donutContainer || !legendContainer) return;

    const items = aggregateBy(rows, 'device').sort((a, b) => b.sessions - a.sessions);
    const totalSessions = rows.length;

    if (!items.length || !totalSessions) {
        donutContainer.innerHTML = '<div class="empty">Không có dữ liệu.</div>';
        legendContainer.innerHTML = '';
        return;
    }

    const R = 60;
    const C = 2 * Math.PI * R;
    let accumulatedOffset = 0;

    const svgPaths = items.map((item, index) => {
        const color = DONUT_COLORS[index % DONUT_COLORS.length];
        const percent = item.sessions / totalSessions;
        const dashArray = `${percent * C} ${C - percent * C}`;
        const strokeOffset = -accumulatedOffset;
        accumulatedOffset += percent * C;

        return `
            <circle class="donut-segment"
                cx="80" cy="80" r="${R}"
                fill="none"
                stroke="${color}"
                stroke-width="18"
                stroke-dasharray="${dashArray}"
                stroke-dashoffset="${strokeOffset}"
                data-device="${escapeHTML(item.name)}"
                data-sessions="${item.sessions}"
                data-percent="${Math.round(percent * 100)}%"
            />
        `;
    }).join('');

    donutContainer.innerHTML = `
        <svg viewBox="0 0 160 160" aria-hidden="true" focusable="false">
            ${svgPaths}
        </svg>
        <div class="donut-center-text">
            <span class="donut-center-val">${totalSessions}</span>
            <span class="donut-center-lbl">bài đã làm</span>
        </div>
    `;

    legendContainer.innerHTML = items.map((item, index) => {
        const color = DONUT_COLORS[index % DONUT_COLORS.length];
        const percent = Math.round((item.sessions / totalSessions) * 100);
        return `
            <button type="button" class="legend-item" data-device="${escapeHTML(item.name)}" title="Mở chi tiết bài làm">
                <div class="legend-label-group">
                    <span class="legend-dot" style="background: ${color};"></span>
                    <span class="legend-name">${escapeHTML(item.name)}</span>
                </div>
                <span class="legend-val">${item.sessions} bài (${percent}%)</span>
            </button>
        `;
    }).join('');

    const tooltip = document.getElementById('donutTooltip');
    const updateTooltip = (e, text) => {
        if (!tooltip) return;
        tooltip.textContent = text;
        tooltip.style.display = 'block';
        tooltip.style.left = `${e.clientX}px`;
        tooltip.style.top = `${e.clientY}px`;
    };
    const hideTooltip = () => {
        if (tooltip) tooltip.style.display = 'none';
    };

    donutContainer.querySelectorAll('.donut-segment').forEach(seg => {
        const device = seg.dataset.device;
        const sessionsCount = seg.dataset.sessions;
        const pct = seg.dataset.percent;
        seg.addEventListener('mousemove', (e) => updateTooltip(e, `${device}: ${sessionsCount} bài đã làm (${pct})`));
        seg.addEventListener('mouseleave', hideTooltip);
        seg.addEventListener('click', () => {
            hideTooltip();
            openDeviceSubModal(device, rows);
        });
    });

    legendContainer.querySelectorAll('.legend-item').forEach(item => {
        const device = item.dataset.device;
        item.addEventListener('click', () => openDeviceSubModal(device, rows));
    });
}

let currentSubModalData = {
    deviceName: '',
    allLabsList: [],
    activeFilter: 'all'
};

function openDeviceSubModal(deviceName, rows) {
    const modal = document.getElementById('deviceSubModal');
    const title = document.getElementById('subModalDeviceTitle');
    const subtitle = document.getElementById('subModalDeviceSubtitle');
    if (!modal) return;

    deviceSubModalReturnFocus = document.activeElement;
    const catalogItem = deviceCatalog.find(d => d.device === deviceName || d.device_name === deviceName || d.model === deviceName);
    const assignedLabs = catalogItem?.labs || [];
    const deviceSessions = rows.filter(item => item.device === deviceName);

    const labMap = new Map();

    assignedLabs.forEach(labName => {
        labMap.set(labName, {
            labName,
            sessions: []
        });
    });

    deviceSessions.forEach(session => {
        if (!labMap.has(session.lab)) {
            labMap.set(session.lab, {
                labName: session.lab,
                sessions: []
            });
        }
        const entry = labMap.get(session.lab);
        entry.sessions.push(session);
    });

    const allLabsList = [...labMap.values()].map(entry => {
        const guideCount = entry.sessions.filter(s => s.mode === 'Hướng dẫn').length;
        const practiceCount = entry.sessions.filter(s => s.mode === 'Thực hành').length;
        const totalCount = entry.sessions.length;

        let modeText = '';
        if (guideCount > 0 && practiceCount > 0) {
            modeText = `${guideCount} lần Hướng dẫn, ${practiceCount} lần Thực hành`;
        } else if (guideCount > 0) {
            modeText = `${guideCount} lần Hướng dẫn`;
        } else if (practiceCount > 0) {
            modeText = `${practiceCount} lần Thực hành`;
        } else {
            modeText = 'Chưa làm';
        }

        // Tính thứ tự lượt thực hành đạt chuẩn hoàn thành
        const sortedSessions = [...entry.sessions].sort((a, b) => {
            const timeA = parseDate(a.date).getTime() + (a.time ? parseTimeMs(a.time) : 0);
            const timeB = parseDate(b.date).getTime() + (b.time ? parseTimeMs(b.time) : 0);
            return timeA - timeB;
        });
        const practiceSessions = sortedSessions.filter(s => s.mode === 'Thực hành');
        const passIndex = practiceSessions.findIndex(isSuccessfulSession);
        const firstPassSession = passIndex !== -1 ? practiceSessions[passIndex] : null;
        const firstPassAttemptNo = firstPassSession
            ? (Number(firstPassSession.practiceAttemptNo) || passIndex + 1)
            : null;

        if (!totalCount) {
            return {
                ...entry,
                statusCategory: 'not_started',
                statusLabel: 'Chưa làm',
                badgeClass: 'status-notstarted',
                totalCount: 0,
                guideCount: 0,
                practiceCount: 0,
                firstPassAttemptNo: null,
                modeText: 'Chưa làm',
                lastDateTimeStr: 'N/A',
                lastDuration: '0 giây'
            };
        }
        const latest = [...entry.sessions].sort((a, b) => parseDate(b.date) - parseDate(a.date))[0];
        const isDone = entry.sessions.some(isSuccessfulSession);
        const hasUngradedCompletion = entry.sessions.some(session => session.status === 'Chưa có kết quả');
        const statusCategory = isDone ? 'done' : 'pending';
        const statusLabel = isDone ? 'Đã đạt' : (hasUngradedCompletion ? 'Chưa có kết quả' : 'Chưa đạt');
        const badgeClass = getStatusClass(statusLabel);
        const lastDateTimeStr = formatDateTime(latest.date, latest.time);
        const lastDuration = formatDuration(latest.duration);

        return {
            ...entry,
            latestSession: latest,
            statusCategory,
            statusLabel,
            badgeClass,
            totalCount,
            guideCount,
            practiceCount,
            firstPassAttemptNo,
            hasUngradedCompletion,
            modeText,
            lastDateTimeStr,
            lastDuration
        };
    });

    const totalLabsCount = allLabsList.length;
    const doneCount = allLabsList.filter(item => item.statusCategory === 'done').length;
    const pendingCount = allLabsList.filter(item => item.statusCategory === 'pending').length;
    const notStartedCount = allLabsList.filter(item => item.statusCategory === 'not_started').length;

    if (title) title.textContent = `Thiết bị — ${deviceName}`;
    if (subtitle) subtitle.textContent = `${totalLabsCount} bài lab trong quy trình của thiết bị ${deviceName}`;

    const totalLabsEl = document.getElementById('subModalTotalLabs');
    const completedCountEl = document.getElementById('subModalCompletedCount');
    const uncompletedCountEl = document.getElementById('subModalUncompletedCount');
    const unattemptedCountEl = document.getElementById('subModalUnattemptedCount');

    if (totalLabsEl) totalLabsEl.textContent = `${totalLabsCount} bài`;
    if (completedCountEl) completedCountEl.textContent = `${doneCount} bài`;
    if (uncompletedCountEl) uncompletedCountEl.textContent = `${pendingCount} bài`;
    if (unattemptedCountEl) unattemptedCountEl.textContent = `${notStartedCount} bài`;

    const cntAll = document.getElementById('cntAll');
    const cntDone = document.getElementById('cntDone');
    const cntPending = document.getElementById('cntPending');
    const cntNotStarted = document.getElementById('cntNotStarted');

    if (cntAll) cntAll.textContent = totalLabsCount;
    if (cntDone) cntDone.textContent = doneCount;
    if (cntPending) cntPending.textContent = pendingCount;
    if (cntNotStarted) cntNotStarted.textContent = notStartedCount;

    currentSubModalData = {
        deviceName,
        allLabsList,
        activeFilter: 'all'
    };

    document.querySelectorAll('.sub-filter-btn').forEach(btn => {
        const isActive = btn.dataset.subFilter === 'all';
        btn.classList.toggle('active', isActive);
        btn.setAttribute('aria-pressed', String(isActive));
    });

    renderSubModalLabList('all');

    modal.classList.add('visible');
    modal.setAttribute('aria-hidden', 'false');
    document.body.classList.add('modal-open');
    window.setTimeout(() => document.getElementById('subModalClose')?.focus(), 0);
}

function closeDeviceSubModal() {
    const modal = document.getElementById('deviceSubModal');
    if (!modal?.classList.contains('visible')) return;
    modal.classList.remove('visible');
    modal.setAttribute('aria-hidden', 'true');
    document.body.classList.remove('modal-open');
    currentSubModalData = { deviceName: '', allLabsList: [], activeFilter: 'all' };
    document.getElementById('subModalLabList')?.replaceChildren();
    if (deviceSubModalReturnFocus instanceof HTMLElement) deviceSubModalReturnFocus.focus();
    deviceSubModalReturnFocus = null;
}

function renderSubModalLabList(filter) {
    const listEl = document.getElementById('subModalLabList');
    if (!listEl) return;

    let filtered = currentSubModalData.allLabsList || [];
    if (filter === 'done') {
        filtered = filtered.filter(item => item.statusCategory === 'done');
    } else if (filter === 'pending') {
        filtered = filtered.filter(item => item.statusCategory === 'pending');
    } else if (filter === 'not_started') {
        filtered = filtered.filter(item => item.statusCategory === 'not_started');
    }

    if (!filtered.length) {
        listEl.innerHTML = '<div class="empty">Không có bài lab nào phù hợp với bộ lọc.</div>';
        return;
    }

    listEl.innerHTML = filtered.map(item => {
        if (item.statusCategory === 'not_started') {
            return `
                <div class="sub-modal-item">
                    <div class="sub-modal-item-top">
                        <div class="sub-modal-item-title">${escapeHTML(item.labName)}</div>
                        <span class="status-pill status-notstarted">Chưa làm</span>
                    </div>
                    <div class="sub-modal-item-grid2x2">
                        <div class="sub-modal-cell">Gần nhất: <strong>Chưa làm</strong></div>
                        <div class="sub-modal-cell">Kết quả: <strong>Chưa có phiên làm bài</strong></div>
                        <div class="sub-modal-cell">Thực hành: <strong>0 lượt</strong></div>
                        <div class="sub-modal-cell">Hướng dẫn: <strong>0 lượt</strong></div>
                    </div>
                </div>
            `;
        }
        if (item.statusCategory === 'done') {
            const passDetail = item.firstPassAttemptNo === 1 
                ? 'Đạt ngay lần thực hành 1' 
                : (item.firstPassAttemptNo > 1 ? `Đạt ở lần thực hành thứ ${item.firstPassAttemptNo}` : 'Đã đạt');
            return `
                <div class="sub-modal-item">
                    <div class="sub-modal-item-top">
                        <div class="sub-modal-item-title">${escapeHTML(item.labName)}</div>
                        <span class="status-pill ${item.badgeClass}">${escapeHTML(item.statusLabel)}</span>
                    </div>
                    <div class="sub-modal-item-grid2x2">
                        <div class="sub-modal-cell">Gần nhất: <strong>${escapeHTML(item.lastDateTimeStr)}</strong> (${item.lastDuration})</div>
                        <div class="sub-modal-cell">Kết quả: <strong>${passDetail}</strong></div>
                        <div class="sub-modal-cell">Thực hành: <strong>${item.practiceCount} lượt</strong></div>
                        <div class="sub-modal-cell">Hướng dẫn: <strong>${item.guideCount} lượt</strong></div>
                    </div>
                </div>
            `;
        }
        return `
            <div class="sub-modal-item">
                <div class="sub-modal-item-top">
                    <div class="sub-modal-item-title">${escapeHTML(item.labName)}</div>
                    <span class="status-pill ${item.badgeClass}">${escapeHTML(item.statusLabel)}</span>
                </div>
                <div class="sub-modal-item-grid2x2">
                    <div class="sub-modal-cell">Gần nhất: <strong>${escapeHTML(item.lastDateTimeStr)}</strong> (${item.lastDuration})</div>
                    <div class="sub-modal-cell">Kết quả: <strong>${item.hasUngradedCompletion ? 'Đã nộp, chưa có kết quả chấm' : `Chưa đạt sau ${item.practiceCount} lượt thực hành`}</strong></div>
                    <div class="sub-modal-cell">Thực hành: <strong>${item.practiceCount} lượt</strong></div>
                    <div class="sub-modal-cell">Hướng dẫn: <strong>${item.guideCount} lượt</strong></div>
                </div>
            </div>
        `;
    }).join('');
}

function initSubModalEvents() {
    const modal = document.getElementById('deviceSubModal');
    const closeBtn = document.getElementById('subModalClose');
    if (closeBtn) {
        closeBtn.addEventListener('click', closeDeviceSubModal);
    }

    document.querySelectorAll('.sub-filter-btn').forEach(btn => {
        btn.addEventListener('click', () => {
            document.querySelectorAll('.sub-filter-btn').forEach(b => {
                b.classList.remove('active');
                b.setAttribute('aria-pressed', 'false');
            });
            btn.classList.add('active');
            btn.setAttribute('aria-pressed', 'true');
            const filter = btn.dataset.subFilter;
            renderSubModalLabList(filter);
        });
    });

    document.addEventListener('keydown', (event) => {
        if (!modal?.classList.contains('visible')) return;
        if (event.key === 'Escape') {
            event.preventDefault();
            closeDeviceSubModal();
            return;
        }
        trapDialogFocus(event, modal.querySelector('.sub-modal-card'));
    });
    modal?.addEventListener('click', (event) => {
        if (event.target === modal) {
            event.stopPropagation();
            closeDeviceSubModal();
        }
    });
}

function initEvents() {
    els.learnerDetailClose?.addEventListener('click', () => {
        hideLearnerDetail();
        renderAll();
    });

    document.addEventListener('keydown', (event) => {
        if (event.defaultPrevented || !document.body.classList.contains('detail-open')) return;
        if (document.getElementById('deviceSubModal')?.classList.contains('visible')) return;
        if (event.key === 'Escape') {
            event.preventDefault();
            hideLearnerDetail();
            renderAll();
            return;
        }
        trapDialogFocus(event, els.learnerDetailCard);
    });

    document.addEventListener('click', (event) => {
        if (!document.body.classList.contains('detail-open')) return;
        const path = event.composedPath();
        const insideCard = path.some(el => el.classList?.contains('learner-detail-card') || el.classList?.contains('sub-modal-backdrop') || el.classList?.contains('sub-modal-card') || el.getAttribute?.('data-learner'));
        if (insideCard) return;
        hideLearnerDetail();
        renderAll();
    });
}

function populatePopoverOptions(containerId, values, selectedSet, onCheckChange, searchVal = '', labelFn = null) {
    const container = document.getElementById(containerId);
    if (!container) return;

    const labelOf = (val) => (labelFn ? labelFn(val) : val);
    const filteredValues = searchVal
        ? values.filter(v => String(labelOf(v)).toLowerCase().includes(searchVal.toLowerCase()))
        : values;

    if (!filteredValues.length) {
        container.innerHTML = '<div class="popover-empty">Không tìm thấy giá trị phù hợp.</div>';
        return;
    }

    container.innerHTML = filteredValues.map(val => {
        const checked = selectedSet.has(val) ? 'checked' : '';
        return `
            <label class="popover-option">
                <input type="checkbox" value="${escapeHTML(val)}" ${checked}>
                <span>${escapeHTML(labelOf(val))}</span>
            </label>
        `;
    }).join('');

    container.querySelectorAll('input[type="checkbox"]').forEach(checkbox => {
        checkbox.addEventListener('change', (e) => {
            if (e.target.checked) {
                selectedSet.add(e.target.value);
            } else {
                selectedSet.delete(e.target.value);
            }
            if (typeof onCheckChange === 'function') {
                if (suppressFilterRender) deferredFilterCallback = onCheckChange;
                else onCheckChange();
            }
            if (!suppressFilterRender) {
                state.realtimePage = 1;
                state.learnerTablePage = 1;
                state.learnerDetailPage = 1;
                renderAll();
            }
        });
    });
}

function filterSessionsByDate(startStr, endStr) {
    return sessions.filter(item => {
        if (!item.date) return false;
        const date = parseDate(item.date);
        if (isNaN(date.getTime()) || date.getTime() === 0) return false;

        if (startStr) {
            const start = parseDate(startStr);
            start.setHours(0, 0, 0, 0);
            if (date < start) return false;
        }

        if (endStr) {
            const end = parseDate(endStr);
            end.setHours(23, 59, 59, 999);
            if (date > end) return false;
        }

        return true;
    });
}

const DASHBOARD_VIEWS = {
    overview: {
        eyebrow: 'Tổng quan',
        title: 'Tổng quan thực hành KTV',
        subtitle: 'Hoạt động và kết quả thực hành trong tháng'
    },
    instructors: {
        eyebrow: 'Đào tạo',
        title: 'Theo dõi lớp học',
        subtitle: 'Tiến độ lớp và các bài nộp gần đây'
    },
    analytics: {
        eyebrow: 'Báo cáo vận hành',
        title: 'Báo cáo theo khu vực',
        subtitle: 'Kết quả thực hành theo khu vực, chi nhánh và bài lab'
    },
    class_matrix: {
        eyebrow: 'Báo cáo đào tạo',
        title: 'Báo cáo KTV theo lớp',
        subtitle: 'Tiến độ thực hành của từng KTV trong lớp'
    },
    technicians: {
        eyebrow: 'Tra cứu',
        title: 'Tra cứu KTV',
        subtitle: 'Lịch sử, thiết bị và kết quả thực hành của từng KTV'
    },
    roster: {
        eyebrow: 'Quản trị nhân sự',
        title: 'Quản lý KTV',
        subtitle: 'Quản lý hồ sơ và cập nhật danh sách từ Excel'
    },
    classes: {
        eyebrow: 'Quản trị đào tạo',
        title: 'Quản lý lớp',
        subtitle: 'Tạo lớp, chọn KTV và giao thiết bị thực hành'
    },
};

let activeDashboardView = 'overview';

function switchDashboardView(viewName, { updateHistory = true, focusHeading = true } = {}) {
    if (!Object.hasOwn(DASHBOARD_VIEWS, viewName)) return;
    document.querySelectorAll('.header-filter-popover.open').forEach(wrapper => closeHeaderFilterPopover(wrapper));
    activeDashboardView = viewName;
    if (updateHistory) {
        const url = new URL(window.location.href);
        if (url.searchParams.get('view') !== viewName) {
            url.searchParams.set('view', viewName);
            window.history.pushState({}, '', url.toString());
        }
    }

    const masterContainer = document.querySelector('.dashboard-master-container');
    const masterViews = new Set(['overview', 'instructors', 'analytics', 'class_matrix']);
    if (masterContainer) masterContainer.hidden = !masterViews.has(activeDashboardView);

    document.querySelectorAll('.dashboard-page-view').forEach(section => {
        section.hidden = section.dataset.pageView !== activeDashboardView;
    });

    const viewCopy = DASHBOARD_VIEWS[activeDashboardView];
    const eyebrow = document.getElementById('pageEyebrow');
    const title = document.getElementById('pageTitle');
    const subtitle = document.getElementById('pageSubtitle');
    if (eyebrow) eyebrow.textContent = viewCopy.eyebrow;
    if (title) title.textContent = viewCopy.title;
    if (subtitle) subtitle.textContent = viewCopy.subtitle;
    document.title = `${viewCopy.title} | FTC`;

    document.querySelectorAll('.sidebar-link[data-dashboard-view]').forEach(link => {
        const isActive = link.dataset.dashboardView === activeDashboardView;
        link.classList.toggle('active', isActive);
        if (isActive) link.setAttribute('aria-current', 'page');
        else link.removeAttribute('aria-current');
    });

    // Update matrix tab toggle buttons active state
    document.querySelectorAll('[data-matrix-tab-target]').forEach(btn => {
        const isActive = btn.dataset.matrixTabTarget === activeDashboardView;
        btn.classList.toggle('active', isActive);
        btn.setAttribute('aria-pressed', String(isActive));
    });

    renderAll();
    if (activeDashboardView === 'analytics'
        && state.dashboardDataLoaded
        && dashboardReport?.meta?.includes_branch_drilldown !== true
        && state.dashboardReportStatus !== 'loading') {
        reloadDashboardReport();
    }
    if (activeDashboardView === 'roster') {
        setDataSourceLabel('Hồ sơ KTV từ cơ sở dữ liệu');
        if (!state.rosterLoaded) loadRosterList();
    } else if (activeDashboardView === 'classes') {
        setDataSourceLabel('Lớp học và bài giao từ cơ sở dữ liệu');
        loadTrainingClasses();
    } else if (state.isAdmin) {
        setDataSourceLabel(state.dashboardDataLoaded ? 'Dữ liệu vận hành đã đồng bộ' : 'Đang đồng bộ dữ liệu vận hành');
        if (!state.dashboardDataLoaded) {
            loadDashboardFromApi().then(() => {
                if (['instructors', 'class_matrix', 'analytics', 'technicians'].includes(activeDashboardView) && !state.assignmentsLoaded) {
                    ensureTrainingAssignmentsLoaded().catch(error => {
                        console.warn('Không đồng bộ được tiến độ lớp.', error);
                        showToast('Chưa thể đồng bộ dữ liệu tiến độ lớp.', 'error');
                    });
                }
            });
        } else if (['instructors', 'class_matrix', 'analytics', 'technicians'].includes(activeDashboardView) && !state.assignmentsLoaded) {
            ensureTrainingAssignmentsLoaded().catch(error => {
                console.warn('Không đồng bộ được tiến độ lớp.', error);
                showToast('Chưa thể đồng bộ dữ liệu tiến độ lớp.', 'error');
            });
        }
    }
    if (focusHeading) window.requestAnimationFrame(() => document.getElementById('pageTitle')?.focus({ preventScroll: true }));
}

function initDashboardViewRouting() {
    let requestedView = new URLSearchParams(window.location.search).get('view') || 'overview';
    if (requestedView === 'instructors') requestedView = 'class_matrix';
    activeDashboardView = Object.hasOwn(DASHBOARD_VIEWS, requestedView) ? requestedView : 'overview';

    const masterContainer = document.querySelector('.dashboard-master-container');
    const masterViews = new Set(['overview', 'analytics', 'class_matrix']);
    if (masterContainer) masterContainer.hidden = !masterViews.has(activeDashboardView);

    document.querySelectorAll('.dashboard-page-view').forEach(section => {
        section.hidden = section.dataset.pageView !== activeDashboardView;
    });

    const viewCopy = DASHBOARD_VIEWS[activeDashboardView];
    const eyebrow = document.getElementById('pageEyebrow');
    const title = document.getElementById('pageTitle');
    const subtitle = document.getElementById('pageSubtitle');
    if (eyebrow) eyebrow.textContent = viewCopy.eyebrow;
    if (title) title.textContent = viewCopy.title;
    if (subtitle) subtitle.textContent = viewCopy.subtitle;
    document.title = `${viewCopy.title} | FTC`;

    document.querySelectorAll('.sidebar-link[data-dashboard-view]').forEach(link => {
        const isActive = link.dataset.dashboardView === activeDashboardView;
        link.classList.toggle('active', isActive);
        if (isActive) link.setAttribute('aria-current', 'page');
        else link.removeAttribute('aria-current');

        link.addEventListener('click', (e) => {
            e.preventDefault();
            const view = link.dataset.dashboardView;
            if (view) switchDashboardView(view);
        });
    });

    document.querySelectorAll('[data-matrix-tab-target]').forEach(btn => {
        const isActive = btn.dataset.matrixTabTarget === activeDashboardView;
        btn.classList.toggle('active', isActive);
        btn.setAttribute('aria-pressed', String(isActive));
    });

    window.addEventListener('popstate', () => {
        const currentView = new URLSearchParams(window.location.search).get('view') || 'overview';
        if (Object.hasOwn(DASHBOARD_VIEWS, currentView) && currentView !== activeDashboardView) {
            switchDashboardView(currentView, { updateHistory: false, focusHeading: true });
        }
    });
}

function initSidebarNavigation() {
    const page = document.getElementById('appPage');
    const toggle = document.getElementById('sidebarToggle');

    const prefersCollapsed = safeStorageGet('ftc-dashboard-sidebar-collapsed') === 'true';
    if (prefersCollapsed && window.matchMedia('(min-width: 961px)').matches) {
        page?.classList.add('sidebar-collapsed');
        toggle?.setAttribute('aria-expanded', 'false');
        toggle?.setAttribute('aria-label', 'Mở rộng thanh điều hướng');
    }

    toggle?.addEventListener('click', () => {
        const collapsed = page?.classList.toggle('sidebar-collapsed') || false;
        toggle.setAttribute('aria-expanded', String(!collapsed));
        toggle.setAttribute('aria-label', collapsed ? 'Mở rộng thanh điều hướng' : 'Thu gọn thanh điều hướng');
        safeStorageSet('ftc-dashboard-sidebar-collapsed', String(collapsed));
    });
}

function initDashboardExperience() {
    document.getElementById('refreshDashboardBtn')?.addEventListener('click', async () => {
        if (activeDashboardView === 'classes') {
            setRefreshButtonBusy(true);
            const succeeded = await loadTrainingClasses();
            setRefreshButtonBusy(false);
            showToast(succeeded ? 'Danh sách lớp đã được cập nhật.' : 'Không thể làm mới danh sách lớp.', succeeded ? 'success' : 'error');
            return;
        }
        if (activeDashboardView === 'roster') {
            setRefreshButtonBusy(true);
            const succeeded = await loadRosterList();
            if (state.rosterTab === 'history') await loadRosterHistory();
            setRefreshButtonBusy(false);
            showToast(succeeded ? 'Danh sách KTV đã được cập nhật.' : 'Không thể làm mới danh sách KTV.', succeeded ? 'success' : 'error');
            return;
        }
        if (!state.dashboardDataLoaded) {
            const succeeded = await loadDashboardFromApi();
            showToast(succeeded ? 'Dashboard đã được cập nhật.' : 'Không thể tải dữ liệu dashboard.', succeeded ? 'success' : 'error');
            return;
        }
        await refreshDashboardData({ force: true, announce: true });
    });

    window.addEventListener('offline', () => {
        setDashboardSyncState('offline', state.lastSuccessfulRefreshAt
            ? formatDashboardSyncDetail(state.lastSuccessfulRefreshAt)
            : 'Thiết bị đang ngoại tuyến');
    });
    window.addEventListener('online', () => {
        setDashboardSyncState('syncing', 'Đã có kết nối, đang đồng bộ lại');
        if (activeDashboardView === 'roster') loadRosterList();
        else if (activeDashboardView === 'classes') loadTrainingClasses();
        else if (state.dashboardDataLoaded) refreshDashboardData({ force: true });
        else if (state.isAdmin) loadDashboardFromApi();
    });
    document.addEventListener('visibilitychange', () => {
        if (!document.hidden && state.dashboardDataLoaded && !['roster', 'classes'].includes(activeDashboardView)) refreshDashboardData();
    });
}

/* ============================================================
   Roster (Quản lý KTV) — Admin
   ============================================================ */

function updateManagementSortIndicators(selector, activeKey, direction, dataKey) {
    document.querySelectorAll(selector).forEach(button => {
        const isSorted = button.dataset[dataKey] === activeKey;
        const mark = button.querySelector('.sort-mark');
        button.classList.toggle('is-sorted', isSorted);
        button.closest('th')?.setAttribute('aria-sort', isSorted
            ? (direction === 'asc' ? 'ascending' : 'descending')
            : 'none');
        if (mark) mark.textContent = isSorted ? (direction === 'asc' ? '↑' : '↓') : '';
    });
}

function activateRosterTab(tabName, { focus = false } = {}) {
    state.rosterTab = tabName;
    const tabs = [...document.querySelectorAll('[data-roster-tab]')];
    tabs.forEach(tab => {
        const isActive = tab.dataset.rosterTab === tabName;
        tab.classList.toggle('active', isActive);
        tab.setAttribute('aria-selected', String(isActive));
        tab.tabIndex = isActive ? 0 : -1;
        if (isActive && focus) tab.focus();
    });
    const panels = {
        list: document.getElementById('rosterListPanel'),
        import: document.getElementById('rosterImportPanel'),
        history: document.getElementById('rosterHistoryPanel')
    };
    Object.entries(panels).forEach(([name, panel]) => {
        if (panel) panel.hidden = name !== tabName;
    });
    if (tabName === 'list' && !state.rosterLoaded) loadRosterList();
    if (tabName === 'history' && !state.rosterHistoryLoaded) loadRosterHistory();
}

const rosterColumnFilterConfig = [
    { id: 'rosterEmployeeIdFilter', key: 'employeeId', facet: 'employeeIds', allLabel: 'Tất cả mã NV' },
    { id: 'rosterNameFilter', key: 'name', facet: 'names', allLabel: 'Tất cả họ tên' },
    { id: 'rosterEmailFilter', key: 'email', facet: 'emails', allLabel: 'Tất cả email' },
    { id: 'rosterJobTitleFilter', key: 'jobTitle', facet: 'jobTitles', allLabel: 'Tất cả vị trí' },
    { id: 'rosterRegionFilter', key: 'region', facet: 'regions', allLabel: 'Tất cả khu vực' },
    { id: 'rosterBranchFilter', key: 'branch', facet: 'branches', allLabel: 'Tất cả chi nhánh' },
    { id: 'rosterClassFilter', key: 'className', facet: 'classes', allLabel: 'Tất cả lớp' }
];

function getAdminFilterSelection(select) {
    if (!select) return null;
    const availableValues = [...select.options].filter(option => option.value && !option.disabled).map(option => option.value);
    const selectedValues = Array.isArray(select._selectedValues)
        ? select._selectedValues.filter(value => availableValues.includes(value))
        : (select.value && select.value !== 'all' ? [select.value] : availableValues);
    return selectedValues.length === availableValues.length ? null : selectedValues;
}

function updateAdminHeaderFilterState(select) {
    const wrapper = select?.closest('.admin-header-filter');
    if (!wrapper || !select) return;
    const selectedValues = getAdminFilterSelection(select);
    const isActive = Array.isArray(selectedValues);
    wrapper.classList.toggle('has-value', isActive);
    wrapper.title = isActive
        ? `${select.getAttribute('aria-label')}: ${selectedValues.length ? selectedValues.join(', ') : 'Không chọn giá trị nào'}`
        : (select.getAttribute('aria-label') || 'Lọc dữ liệu');
}

function populateAdminFilterSelect(id, values, allLabel, selectedValue = null) {
    const select = document.getElementById(id);
    if (!select) return;
    const normalizedValues = [...new Set((values || []).map(value => String(value || '').trim()).filter(Boolean))]
        .sort((left, right) => left.localeCompare(right, 'vi', { numeric: true, sensitivity: 'base' }));
    select.replaceChildren(new Option(allLabel, ''));
    normalizedValues.forEach(value => select.add(new Option(value, value)));
    const requestedValues = Array.isArray(selectedValue)
        ? selectedValue
        : (selectedValue && selectedValue !== 'all' ? [selectedValue] : normalizedValues);
    select._selectedValues = requestedValues.filter(value => normalizedValues.includes(value));
    select.value = select._selectedValues[0] || '';
    select.dispatchEvent(new Event('searchable-sync'));
    updateAdminHeaderFilterState(select);
}

function syncStaticAdminFilterSelect(id, selectedValue = null) {
    const select = document.getElementById(id);
    if (!select) return;
    const availableValues = [...select.options].filter(option => option.value && !option.disabled).map(option => option.value);
    const requestedValues = Array.isArray(selectedValue) ? selectedValue : availableValues;
    select._selectedValues = requestedValues.filter(value => availableValues.includes(value));
    select.value = select._selectedValues[0] || '';
    select.dispatchEvent(new Event('searchable-sync'));
    updateAdminHeaderFilterState(select);
}

function renderRosterFilterFacets() {
    rosterColumnFilterConfig.forEach(config => {
        populateAdminFilterSelect(
            config.id,
            state.rosterFilterFacets[config.facet],
            config.allLabel,
            state.rosterColumnFilters[config.key]
        );
    });
    syncStaticAdminFilterSelect('rosterStatusFilter', state.rosterStatusFilter);
}

const EMPTY_FILTER_SENTINEL = '__FTC_NONE_SELECTED__';

function appendFilterSelection(params, key, selection) {
    if (!Array.isArray(selection)) return;
    const values = selection.length ? selection : [EMPTY_FILTER_SENTINEL];
    values.forEach(value => params.append(`${key}[]`, value));
}

function appendRosterFilters(params) {
    appendFilterSelection(params, 'status', state.rosterStatusFilter);
    Object.entries(state.rosterColumnFilters).forEach(([key, value]) => {
        appendFilterSelection(params, key, value);
    });
    return params;
}

function initRoster() {
    if (state.rosterInitialized) return;
    state.rosterInitialized = true;

    document.querySelectorAll('[data-roster-tab]').forEach(btn => {
        btn.addEventListener('click', () => activateRosterTab(btn.dataset.rosterTab));
        btn.addEventListener('keydown', event => {
            const tabs = [...document.querySelectorAll('[data-roster-tab]')];
            const currentIndex = tabs.indexOf(btn);
            let nextIndex = currentIndex;
            if (event.key === 'ArrowRight') nextIndex = (currentIndex + 1) % tabs.length;
            else if (event.key === 'ArrowLeft') nextIndex = (currentIndex - 1 + tabs.length) % tabs.length;
            else if (event.key === 'Home') nextIndex = 0;
            else if (event.key === 'End') nextIndex = tabs.length - 1;
            else return;
            event.preventDefault();
            activateRosterTab(tabs[nextIndex].dataset.rosterTab, { focus: true });
        });
    });

    document.getElementById('rosterStatusFilter')?.addEventListener('change', e => {
        state.rosterStatusFilter = getAdminFilterSelection(e.target);
        updateAdminHeaderFilterState(e.target);
        state.rosterPage = 1;
        loadRosterList();
    });

    rosterColumnFilterConfig.forEach(config => {
        document.getElementById(config.id)?.addEventListener('change', event => {
            state.rosterColumnFilters[config.key] = getAdminFilterSelection(event.target);
            updateAdminHeaderFilterState(event.target);
            state.rosterPage = 1;
            loadRosterList();
        });
    });

    const uploadZone = document.getElementById('rosterUploadZone');
    const fileInput = document.getElementById('rosterFileInput');
    if (uploadZone && fileInput) {
        uploadZone.addEventListener('dragover', e => { e.preventDefault(); uploadZone.classList.add('dragover'); });
        uploadZone.addEventListener('dragleave', () => uploadZone.classList.remove('dragover'));
        uploadZone.addEventListener('drop', e => {
            e.preventDefault();
            uploadZone.classList.remove('dragover');
            const file = e.dataTransfer?.files?.[0];
            if (file) handleRosterFile(file);
        });
        document.getElementById('rosterFileBtn')?.addEventListener('click', () => fileInput.click());
        fileInput.addEventListener('change', () => {
            if (fileInput.files?.[0]) handleRosterFile(fileInput.files[0]);
        });
    }

    document.getElementById('rosterConfirmImportBtn')?.addEventListener('click', confirmRosterImport);
    document.getElementById('rosterCancelImportBtn')?.addEventListener('click', cancelRosterImport);

    document.getElementById('rosterEditClose')?.addEventListener('click', closeRosterEdit);
    document.getElementById('rosterEditCancelBtn')?.addEventListener('click', closeRosterEdit);
    document.getElementById('rosterEditBackdrop')?.addEventListener('click', e => {
        if (e.target === e.currentTarget) closeRosterEdit();
    });
    document.getElementById('rosterEditBackdrop')?.addEventListener('keydown', event => {
        if (event.key === 'Escape') {
            event.preventDefault();
            closeRosterEdit();
            return;
        }
        trapDialogFocus(event, document.getElementById('rosterEditDialog'));
    });
    document.getElementById('rosterEditForm')?.addEventListener('submit', submitRosterEdit);
    document.getElementById('rosterEditRegionId')?.addEventListener('change', updateRosterEditBranch);

    document.getElementById('rosterTableBody')?.addEventListener('click', e => {
        if (e.target.closest('[data-roster-retry]')) {
            loadRosterList();
            return;
        }
        const btn = e.target.closest('.roster-edit-btn');
        if (btn?.dataset.employeeId) openRosterEdit(btn.dataset.employeeId);
    });

    document.getElementById('rosterPagination')?.addEventListener('click', e => {
        const btn = e.target.closest('.roster-page-btn');
        if (btn && !btn.disabled && btn.dataset.page) rosterGoPage(Number(btn.dataset.page));
    });
}

function rosterFilterQuerystring() {
    return appendRosterFilters(new URLSearchParams()).toString();
}

async function loadRosterList() {
    const requestSequence = ++state.rosterRequestSequence;
    state.rosterLoaded = false;
    const tbody = document.getElementById('rosterTableBody');
    if (tbody) {
        tbody.setAttribute('aria-busy', 'true');
        tbody.innerHTML = '<tr class="table-loading-row"><td colspan="9"><div class="table-state"><span class="table-state-spinner" aria-hidden="true"></span><span>Đang tải danh sách KTV…</span></div></td></tr>';
    }
    if (activeDashboardView === 'roster') setDashboardSyncState('syncing', 'Đang tải hồ sơ KTV');
    try {
        const params = appendRosterFilters(new URLSearchParams());
        params.set('page', String(state.rosterPage));
        const resp = await fetch(`${API_BASE_URL}/roster/list?${params}`);
        if (!resp.ok) {
            let detail = '';
            try {
                const body = await resp.json();
                detail = body?.error?.message || body?.message || resp.statusText || '';
            } catch (_e) { /* ignore */ }
            const err = new Error(`Failed to load roster: HTTP ${resp.status}`);
            err.status = resp.status;
            err.serverMessage = detail;
            throw err;
        }
        const json = await resp.json();
        if (requestSequence !== state.rosterRequestSequence) return false;
        const data = json.data || {};
        state.rosterItems = data.items || [];
        state.rosterStats = data.stats || null;
        state.rosterTotal = data.total || 0;
        state.rosterFilterFacets = data.facets || state.rosterFilterFacets;
        state.rosterLoaded = true;
        renderRosterList();
        if (activeDashboardView === 'roster') {
            state.lastSuccessfulRefreshAt = new Date();
            setDashboardSyncState('ready');
        }
        return true;
    } catch (err) {
        if (requestSequence !== state.rosterRequestSequence) return false;
        console.error('loadRosterList error:', err);
        const status = err?.status;
        const hint = status === 401 || status === 403
            ? 'Bạn không có quyền xem danh sách KTV.'
            : (status === 500 ? 'Máy chủ báo lỗi khi xử lý yêu cầu.' : 'Vui lòng kiểm tra kết nối và thử lại.');
        if (tbody) {
            tbody.innerHTML = `<tr><td colspan="9"><div class="table-state is-error"><strong>Không tải được danh sách KTV</strong><span>${escapeHTML(hint)}${status ? ` (HTTP ${status})` : ''}</span><button type="button" class="button secondary" data-roster-retry>Thử lại</button></div></td></tr>`;
        }
        if (activeDashboardView === 'roster') setDashboardSyncState(navigator.onLine ? 'stale' : 'offline', 'Không thể tải hồ sơ KTV');
        return false;
    } finally {
        if (requestSequence === state.rosterRequestSequence) tbody?.removeAttribute('aria-busy');
    }
}

async function loadRosterRegions() {
    if (state.rosterRegionsLoaded) return;
    const resp = await fetch(`${API_BASE_URL}/roster/regions`);
    if (!resp.ok) throw new Error('Không tải được danh mục khu vực.');
    const json = await resp.json();
    state.rosterRegions = json.data?.items || [];
    state.rosterRegionsLoaded = true;
}

function renderRosterRegionOptions(selectedRegionId = '') {
    const select = document.getElementById('rosterEditRegionId');
    if (!select) return;
    const options = state.rosterRegions.map(region => {
        const id = region.unit_id || region.unitId || '';
        const name = region.region_name || region.regionName || region.region_code || region.regionCode || '';
        const branch = region.unit_name || region.unitName || region.branch_name || region.branchName || 'Chưa có chi nhánh';
        const code = region.region_code || region.regionCode || '';
        const label = `${branch} · ${name}${code ? ` (${code})` : ''}`;
        return `<option value="${escapeHTML(id)}">${escapeHTML(label)}</option>`;
    }).join('');
    select.innerHTML = '<option value="">FTC</option>' + options;
    select.value = selectedRegionId || '';
}

function updateRosterEditBranch() {
    const unitId = document.getElementById('rosterEditRegionId')?.value || '';
    const region = state.rosterRegions.find(item => (item.unit_id || item.unitId) === unitId);
    const branchInput = document.getElementById('rosterEditBranchName');
    const unitCodeInput = document.getElementById('rosterEditUnitCode');
    const unitNameInput = document.getElementById('rosterEditUnitName');
    if (branchInput) branchInput.value = region?.unit_name || region?.unitName || region?.branch_name || region?.branchName || '';
    if (unitCodeInput) unitCodeInput.value = region?.unit_code || region?.unitCode || '';
    if (unitNameInput) unitNameInput.value = region?.unit_name || region?.unitName || '';
}

function renderRosterList() {
    renderRosterFilterFacets();
    renderRosterTableBody();
    renderRosterPagination();
}

function renderRosterTableBody() {
    const tbody = document.getElementById('rosterTableBody');
    if (!tbody) return;
    if (!state.rosterItems.length) {
        tbody.innerHTML = '<tr><td colspan="9"><div class="table-state"><strong>Không tìm thấy hồ sơ KTV</strong><span>Hãy thử thay đổi các bộ lọc ở tiêu đề cột.</span></div></td></tr>';
        return;
    }
    tbody.innerHTML = state.rosterItems.map(item => {
        const terminated = item.is_terminated || item.isTerminated;
        const badge = terminated ? '<span class="badge-terminated">Đã nghỉ</span>' : '<span class="badge-active">Đang công tác</span>';
        const rawEmployeeId = item.employee_id || item.employeeId || '';
        const eid = escapeHTML(rawEmployeeId);
        const employeeCell = eid || '<span title="Có thể bổ sung qua lần import hồ sơ nhân sự sau">Chưa cập nhật</span>';
        const region = escapeHTML(item.region_name || item.regionName || item.dashboard_region || item.dashboardRegion || 'FTC');
        const branch = escapeHTML(item.branch_name || item.branchName || '—');
        const editButton = rawEmployeeId
            ? `<button type="button" class="button secondary roster-edit-btn" data-employee-id="${eid}" aria-label="Sửa hồ sơ ${escapeHTML(item.display_name || item.displayName || rawEmployeeId)}">Sửa</button>`
            : '<button type="button" class="button secondary roster-edit-btn" title="Bổ sung mã nhân viên bằng chức năng import hồ sơ" disabled>Chờ MNV</button>';
        return `<tr>
            <td>${employeeCell}</td>
            <td>${escapeHTML(item.display_name || item.displayName || '')}</td>
            <td>${escapeHTML(item.email || '')}</td>
            <td>${escapeHTML(item.job_title || item.jobTitle || '')}</td>
            <td>${region}</td>
            <td>${branch}</td>
            <td>${escapeHTML(item.class_name || item.className || 'Chưa xếp lớp')}</td>
            <td>${badge}</td>
            <td>${editButton}</td>
        </tr>`;
    }).join('');
}

function renderRosterPagination() {
    const el = document.getElementById('rosterPagination');
    if (!el) return;
    const totalPages = Math.max(1, Math.ceil(state.rosterTotal / 50));
    el.innerHTML = `
        <span>Trang ${state.rosterPage} / ${totalPages} — ${formatNumber.format(state.rosterTotal)} kết quả</span>
        <div class="roster-pagination-btns">
            <button type="button" class="roster-page-btn" data-page="${state.rosterPage - 1}" aria-label="Trang trước" ${state.rosterPage <= 1 ? 'disabled' : ''}>Trước</button>
            <button type="button" class="roster-page-btn" data-page="${state.rosterPage + 1}" aria-label="Trang sau" ${state.rosterPage >= totalPages ? 'disabled' : ''}>Sau</button>
        </div>
    `;
}

function rosterGoPage(page) {
    state.rosterPage = page;
    loadRosterList();
}

/* --- Import --- */

function handleRosterFile(file) {
    if (!file.name.toLowerCase().endsWith('.xlsx')) {
        showToast('Vui lòng chọn đúng file Excel định dạng .xlsx.', 'error');
        return;
    }
    state.rosterImportFile = file;
    state.rosterPreviewData = null;
    const info = document.getElementById('rosterFileInfo');
    if (info) {
        info.hidden = false;
        info.textContent = `${file.name} (${(file.size / 1024).toFixed(1)} KB)`;
    }
    document.getElementById('rosterPreview').hidden = true;
    document.getElementById('rosterImportResult').hidden = true;
    document.getElementById('rosterImportActions').hidden = false;
    const importButton = document.getElementById('rosterConfirmImportBtn');
    if (importButton) {
        importButton.disabled = true;
        importButton.textContent = 'Đang kiểm tra file...';
    }
    doRosterPreview(file);
}

async function doRosterPreview(file) {
    const formData = new FormData();
    formData.append('file', file);
    formData.append('dry_run', 'true');
    try {
        const resp = await fetch(`${API_BASE_URL}/roster/import`, { method: 'POST', body: formData });
        const json = await resp.json().catch(() => ({}));
        if (!resp.ok) throw new Error(json.error?.message || `Kiểm tra file thất bại (HTTP ${resp.status})`);
        if (state.rosterImportFile !== file) return;
        const data = json.data || {};
        state.rosterPreviewData = data;
        renderRosterPreview(data);
        const importButton = document.getElementById('rosterConfirmImportBtn');
        if (importButton) {
            const canImport = data.canImport !== false
                && data.can_import !== false
                && Number(data.totalRows || data.total_rows || 0) > 0
                && Number(data.error_count || data.errorCount || 0) === 0;
            importButton.disabled = !canImport;
            importButton.textContent = canImport ? 'Nhập danh sách KTV' : 'File chưa hợp lệ';
        }
    } catch (err) {
        if (state.rosterImportFile !== file) return;
        state.rosterPreviewData = null;
        console.error('Roster preview error:', err);
        renderRosterPreviewFailure(err.message || String(err));
        const importButton = document.getElementById('rosterConfirmImportBtn');
        if (importButton) {
            importButton.disabled = true;
            importButton.textContent = 'Không thể nhập';
        }
    }
}

function renderRosterPreviewFailure(message) {
    const container = document.getElementById('rosterPreview');
    if (!container) return;
    container.hidden = false;

    document.getElementById('rosterPreviewStats')?.replaceChildren();
    document.getElementById('rosterPreviewChanges')?.replaceChildren();
    const errorsEl = document.getElementById('rosterPreviewErrors');
    if (errorsEl) {
        errorsEl.hidden = false;
        errorsEl.classList.add('is-visible');
        errorsEl.innerHTML = `<h4>Không thể đọc file</h4><p>${escapeHTML(message)}</p>`;
    }
}

function renderRosterPreview(data) {
    const container = document.getElementById('rosterPreview');
    if (!container) return;
    container.hidden = false;

    const statsEl = document.getElementById('rosterPreviewStats');
    if (statsEl) {
        const isDelta = (data.importMode || data.import_mode) === 'delta';
        const activeRows = Number(data.activeRows || data.active_rows || 0);
        const terminationRows = Number(data.terminationRows || data.termination_rows || 0);
        const modeLabel = isDelta
            ? `Theo sheet: ${activeRows} KTV, ${terminationRows} Nghỉ việc`
            : 'Đồng bộ toàn bộ danh sách';
        statsEl.innerHTML = `
            <span class="roster-preview-stat">${escapeHTML(modeLabel)}</span>
            <span class="roster-preview-stat stat-insert">Thêm mới: ${data.inserted || 0}</span>
            <span class="roster-preview-stat stat-update">Cập nhật: ${data.updated || 0}</span>
            <span class="roster-preview-stat stat-terminate">Nghỉ việc: ${data.terminated || 0}</span>
            <span class="roster-preview-stat stat-reactivate">Khôi phục: ${data.reactivated || 0}</span>
            <span class="roster-preview-stat stat-error">Lỗi: ${data.error_count || data.errorCount || 0}</span>
        `;
    }

    const errorsEl = document.getElementById('rosterPreviewErrors');
    if (errorsEl) {
        const errors = data.errors || [];
        errorsEl.classList.toggle('is-visible', errors.length > 0);
        if (errors.length) {
            errorsEl.hidden = false;
            errorsEl.innerHTML = `<h4>Lỗi (${errors.length})</h4><ul>${errors.map(e => {
                const location = e.sheet
                    ? `Sheet ${escapeHTML(e.sheet)}, dòng ${escapeHTML(e.row || '?')}`
                    : `Dòng ${escapeHTML(e.row || '?')}`;
                return `<li>${location}: ${escapeHTML(e.message || '')}</li>`;
            }).join('')}</ul>`;
        } else {
            errorsEl.hidden = true;
        }
    }

    const changesEl = document.getElementById('rosterPreviewChanges');
    if (changesEl) {
        let html = '';
        const changes = data.changes || {};
        [['inserted', 'Thêm mới', 'stat-insert'], ['updated', 'Cập nhật', 'stat-update'], ['terminated', 'Nghỉ việc', 'stat-terminate'], ['reactivated', 'Khôi phục', 'stat-reactivate']].forEach(([key, label, cls]) => {
            const items = changes[key] || [];
            if (!items.length) return;
            html += `<div class="roster-change-group"><h4 class="roster-preview-stat ${cls}">${label} (${items.length})</h4><table><thead><tr><th>Mã NV</th><th>Tên</th><th>Email</th><th>Khu vực</th><th>Chi nhánh</th></tr></thead><tbody>${items.map(i => `<tr><td>${escapeHTML(i.employee_id || '')}</td><td>${escapeHTML(i.display_name || '')}</td><td>${escapeHTML(i.email || '')}</td><td>${escapeHTML(i.region || '')}</td><td>${escapeHTML(i.branch || '')}</td></tr>`).join('')}</tbody></table></div>`;
        });
        changesEl.innerHTML = html || '<p class="roster-preview-empty">Không có thay đổi nào.</p>';
    }
}

async function confirmRosterImport() {
    if (state.rosterImportBusy || !state.rosterImportFile) return;
    const data = state.rosterPreviewData;
    if (!data) {
        showToast('Vui lòng đợi hệ thống kiểm tra file xong trước khi nhập.', 'info');
        return;
    }
    if ((data.error_count || data.errorCount || 0) > 0) {
        showToast('File còn lỗi dữ liệu. Vui lòng sửa các dòng được đánh dấu trước khi nhập.', 'error');
        return;
    }
    if (data.canImport === false || data.can_import === false || Number(data.totalRows || data.total_rows || 0) <= 0) {
        showToast('File không có dòng KTV hợp lệ để nhập.', 'error');
        return;
    }
    const terminationCount = Number(data.terminated || 0);
    if (terminationCount > 0) {
        const explicitTermination = (data.terminationMode || data.termination_mode) === 'explicit';
        const warning = explicitTermination
            ? `${terminationCount} KTV trong sheet “Nghỉ việc” sẽ được đánh dấu Đã nghỉ.`
            : `${terminationCount} KTV không còn trong danh sách đầy đủ sẽ được đánh dấu Đã nghỉ.`;
        const confirmed = window.confirm(
            `Cảnh báo: ${warning} Bạn có chắc muốn tiếp tục?`
        );
        if (!confirmed) return;
    }
    state.rosterImportBusy = true;
    let importSucceeded = false;
    const btn = document.getElementById('rosterConfirmImportBtn');
    if (btn) { btn.disabled = true; btn.textContent = 'Đang nhập...'; }

    const formData = new FormData();
    formData.append('file', state.rosterImportFile);
    if (data.batch_id || data.batchId) formData.append('batch_id', data.batch_id || data.batchId);
    if (terminationCount > 0) formData.append('confirm_termination', 'true');
    try {
        const resp = await fetch(`${API_BASE_URL}/roster/import`, { method: 'POST', body: formData });
        const json = await resp.json();
        if (!resp.ok) {
            const errData = json.error || {};
            showRosterResult(errData.message || 'Nhập dữ liệu thất bại.', false, errData.details);
        } else {
            const result = json.data || {};
            importSucceeded = true;
            const batchId = result.batch_id || result.batchId || '';
            showRosterResult(
                `Đã thêm ${result.inserted || 0}, cập nhật ${result.updated || 0}, đánh dấu nghỉ ${result.terminated || 0} và khôi phục ${result.reactivated || 0} KTV.${batchId ? ` Mã đợt: ${batchId}.` : ''}`,
                true
            );
            state.rosterLoaded = false;
            state.rosterHistoryLoaded = false;
            // Import happens while the roster tab is active. A normal refresh is
            // intentionally skipped on that tab, so force it to keep every
            // dashboard view in sync with the newly committed KTV locations.
            await Promise.allSettled([
                loadRosterList(),
                loadRosterHistory(),
                refreshDashboardData({ force: true })
            ]);
        }
    } catch (err) {
        showRosterResult('Lỗi khi nhập dữ liệu: ' + err.message, false);
    } finally {
        state.rosterImportBusy = false;
        if (btn) {
            btn.disabled = importSucceeded;
            btn.textContent = importSucceeded ? 'Đã nhập' : 'Nhập danh sách KTV';
        }
        if (importSucceeded) {
            state.rosterImportFile = null;
            const fileInput = document.getElementById('rosterFileInput');
            if (fileInput) fileInput.value = '';
        }
    }
}

function showRosterResult(message, success, details) {
    const el = document.getElementById('rosterImportResult');
    if (!el) return;
    el.hidden = false;
    el.className = 'roster-import-result ' + (success ? 'result-success' : 'result-error');
    el.setAttribute('role', success ? 'status' : 'alert');
    el.setAttribute('aria-live', success ? 'polite' : 'assertive');

    const title = success ? 'Nhập dữ liệu thành công' : 'Nhập dữ liệu không thành công';
    const icon = success ? '✓' : '!';
    let html = `
        <div class="roster-import-result-icon" aria-hidden="true">${icon}</div>
        <div class="roster-import-result-content">
            <h3>${title}</h3>
            <p>${escapeHTML(message)}</p>
    `;
    if (details && details.length) {
        html += '<ul class="roster-import-result-details">';
        details.forEach(d => { html += `<li>${escapeHTML(d.message || d)}</li>`; });
        html += '</ul>';
    }
    if (success) {
        html += '<p class="roster-import-result-hint">Kiểm tra lại tại Danh sách KTV hoặc Lịch sử nhập.</p>';
    }
    html += '</div>';
    el.innerHTML = html;

    window.requestAnimationFrame(() => {
        const reduceMotion = window.matchMedia?.('(prefers-reduced-motion: reduce)').matches;
        el.scrollIntoView({ behavior: reduceMotion ? 'auto' : 'smooth', block: 'center' });
        el.focus({ preventScroll: true });
    });
}

function cancelRosterImport() {
    state.rosterImportFile = null;
    state.rosterPreviewData = null;
    const info = document.getElementById('rosterFileInfo');
    if (info) info.hidden = true;
    document.getElementById('rosterPreview').hidden = true;
    document.getElementById('rosterImportResult').hidden = true;
    document.getElementById('rosterImportActions').hidden = true;
    document.getElementById('rosterFileInput').value = '';
    const importButton = document.getElementById('rosterConfirmImportBtn');
    if (importButton) {
        importButton.disabled = true;
        importButton.textContent = 'Nhập danh sách KTV';
    }
}

/* --- History --- */

async function loadRosterHistory() {
    const requestSequence = ++state.rosterHistoryRequestSequence;
    const tbody = document.getElementById('rosterHistoryBody');
    const emptyEl = document.getElementById('rosterHistoryEmpty');
    tbody?.setAttribute('aria-busy', 'true');
    if (emptyEl) {
        emptyEl.hidden = false;
        emptyEl.innerHTML = '<span class="table-state-spinner" aria-hidden="true"></span><span>Đang tải lịch sử nhập…</span>';
    }
    try {
        const resp = await fetch(`${API_BASE_URL}/roster/history`);
        if (!resp.ok) throw new Error('Failed to load history');
        const json = await resp.json();
        if (requestSequence !== state.rosterHistoryRequestSequence) return false;
        state.rosterHistoryItems = (json.data || {}).items || [];
        state.rosterHistoryLoaded = true;
        renderRosterHistory();
        return true;
    } catch (err) {
        if (requestSequence !== state.rosterHistoryRequestSequence) return false;
        console.error('loadRosterHistory error:', err);
        if (tbody) tbody.innerHTML = '';
        if (emptyEl) {
            emptyEl.hidden = false;
            emptyEl.innerHTML = '<strong>Không tải được lịch sử nhập</strong><button type="button" class="button secondary" data-roster-history-retry>Thử lại</button>';
            emptyEl.querySelector('[data-roster-history-retry]')?.addEventListener('click', loadRosterHistory, { once: true });
        }
        return false;
    } finally {
        if (requestSequence === state.rosterHistoryRequestSequence) tbody?.removeAttribute('aria-busy');
    }
}

function renderRosterHistory() {
    const tbody = document.getElementById('rosterHistoryBody');
    const emptyEl = document.getElementById('rosterHistoryEmpty');
    if (!tbody) return;
    if (!state.rosterHistoryItems.length) {
        tbody.innerHTML = '';
        if (emptyEl) {
            emptyEl.hidden = false;
            emptyEl.textContent = 'Chưa có lịch sử nhập nào.';
        }
        return;
    }
    if (emptyEl) emptyEl.hidden = true;
    tbody.innerHTML = state.rosterHistoryItems.map(item => {
        const dt = item.importedAt || item.imported_at;
        const dateStr = dt ? new Date(dt).toLocaleString('vi-VN') : '-';
        return `<tr>
            <td><code>${escapeHTML(item.batchId || item.batch_id || '')}</code></td>
            <td>${escapeHTML(item.fileName || item.file_name || '')}</td>
            <td>${escapeHTML(item.importedByName || item.imported_by_name || item.importedByEmail || '-')}</td>
            <td>${formatNumber.format(Number(item.totalRows || item.total_rows || 0))}</td>
            <td class="roster-value-success">${formatNumber.format(Number(item.inserted || 0))}</td>
            <td class="roster-value-info">${formatNumber.format(Number(item.updated || 0))}</td>
            <td class="roster-value-danger">${formatNumber.format(Number(item.terminated || 0))}</td>
            <td class="roster-value-warning">${formatNumber.format(Number(item.reactivated || 0))}</td>
            <td>${formatNumber.format(Number(item.errorCount || item.error_count || 0))}</td>
            <td>${dateStr}</td>
        </tr>`;
    }).join('');
}

/* --- Edit KTV --- */

async function openRosterEdit(employeeId) {
    const item = state.rosterItems.find(i => (i.employee_id || i.employeeId) === employeeId);
    if (!item) return;
    try {
        await loadRosterRegions();
    } catch (err) {
        showToast(err.message || 'Không tải được danh mục khu vực.', 'error');
        return;
    }
    rosterEditReturnFocus = document.activeElement;
    state.rosterEditEmployeeId = employeeId;
    document.getElementById('rosterEditSubtitle').textContent = employeeId + ' — ' + (item.display_name || item.displayName || '');
    document.getElementById('rosterEditEmployeeId').value = employeeId;
    document.getElementById('rosterEditDisplayName').value = item.display_name || item.displayName || '';
    document.getElementById('rosterEditEmail').value = item.email || '';
    document.getElementById('rosterEditJobTitle').value = item.job_title || item.jobTitle || '';
    renderRosterRegionOptions(item.unit_id || item.unitId || '');
    updateRosterEditBranch();
    document.getElementById('rosterEditUnitCode').value = item.unit_code || item.unitCode || '';
    document.getElementById('rosterEditUnitName').value = item.unit_name || item.unitName || '';
    document.getElementById('rosterEditClassCode').value = item.class_code || item.classCode || '';
    document.getElementById('rosterEditTerminated').value = (item.is_terminated || item.isTerminated) ? '1' : '0';
    const backdrop = document.getElementById('rosterEditBackdrop');
    if (backdrop) {
        backdrop.hidden = false;
        backdrop.classList.add('visible');
        backdrop.setAttribute('aria-hidden', 'false');
        document.body.classList.add('modal-open');
        window.setTimeout(() => document.getElementById('rosterEditDisplayName')?.focus(), 0);
    }
}

function closeRosterEdit() {
    const backdrop = document.getElementById('rosterEditBackdrop');
    if (backdrop) { backdrop.hidden = true; backdrop.classList.remove('visible'); backdrop.setAttribute('aria-hidden', 'true'); }
    document.body.classList.remove('modal-open');
    state.rosterEditEmployeeId = '';
    if (rosterEditReturnFocus instanceof HTMLElement) rosterEditReturnFocus.focus();
    rosterEditReturnFocus = null;
}

async function submitRosterEdit(e) {
    e.preventDefault();
    const employeeId = state.rosterEditEmployeeId;
    if (!employeeId) return;
    const payload = {
        display_name: document.getElementById('rosterEditDisplayName').value.trim(),
        email: document.getElementById('rosterEditEmail').value.trim(),
        job_title: document.getElementById('rosterEditJobTitle').value.trim() || null,
        unit_id: document.getElementById('rosterEditRegionId').value || null,
        class_code: document.getElementById('rosterEditClassCode').value.trim() || null,
        is_terminated: document.getElementById('rosterEditTerminated').value === '1',
    };
    try {
        const resp = await fetch(`${API_BASE_URL}/roster/${encodeURIComponent(employeeId)}`, {
            method: 'PATCH',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(payload),
        });
        if (!resp.ok) {
            const err = await resp.json().catch(() => ({}));
            showToast(err.error?.message || 'Cập nhật hồ sơ thất bại.', 'error');
            return;
        }
        closeRosterEdit();
        state.rosterLoaded = false;
        await Promise.allSettled([
            loadRosterList(),
            refreshDashboardData({ force: true })
        ]);
        showToast('Đã cập nhật hồ sơ KTV.', 'success');
    } catch (err) {
        showToast(`Không thể cập nhật hồ sơ: ${err.message}`, 'error');
    }
}

/* ============================================================
   Training classes and assignments — Admin
   ============================================================ */

function activateClassTab(tabName) {
    state.classTab = tabName;
    document.querySelectorAll('[data-class-tab]').forEach(button => {
        const active = button.dataset.classTab === tabName;
        button.classList.toggle('active', active);
        button.setAttribute('aria-selected', String(active));
        button.tabIndex = active ? 0 : -1;
    });
    const panels = {
        list: document.getElementById('classListPanel'),
        create: document.getElementById('classCreatePanel')
    };
    Object.entries(panels).forEach(([name, panel]) => {
        if (panel) panel.hidden = name !== tabName;
    });
    if (tabName === 'list') loadTrainingClasses();
    if (tabName === 'create') loadTrainingClassCatalog();
}

function classDateLabel(value) {
    if (!value) return 'Không giới hạn';
    const parts = String(value).slice(0, 10).split('-');
    return parts.length === 3 ? `${parts[2]}/${parts[1]}/${parts[0]}` : value;
}

function classStatusLabel(status) {
    return ({ planned: 'Sắp hiệu lực', active: 'Đang hiệu lực', completed: 'Đã kết thúc', archived: 'Đã lưu trữ' })[status] || status;
}

function sortedTrainingClasses(items) {
    const valueFor = (item, key) => ({
        startDate: item.start_date || '',
        members: Number(item.member_count || 0),
        devices: Number(item.device_count || 0)
    })[key];
    const direction = state.classSortDirection === 'asc' ? 1 : -1;
    const matchesFilter = (selection, value) => !Array.isArray(selection) || selection.includes(String(value || ''));
    const filteredItems = items.filter(item => (
        matchesFilter(state.classCodeFilter, item.class_code)
        && matchesFilter(state.classNameFilter, item.class_name)
        && matchesFilter(state.classStatusFilter, item.status)
    ));
    return [...filteredItems].sort((left, right) => {
        const leftValue = valueFor(left, state.classSortKey);
        const rightValue = valueFor(right, state.classSortKey);
        const compared = typeof leftValue === 'number' && typeof rightValue === 'number'
            ? leftValue - rightValue
            : String(leftValue).localeCompare(String(rightValue), 'vi', { numeric: true, sensitivity: 'base' });
        return compared === 0
            ? String(left.class_code || '').localeCompare(String(right.class_code || ''), 'vi', { numeric: true })
            : compared * direction;
    });
}

async function loadTrainingClasses() {
    const body = document.getElementById('classTableBody');
    if (body) body.innerHTML = '<tr><td colspan="7">Đang tải danh sách lớp...</td></tr>';
    try {
        const response = await fetch(`${API_BASE_URL}/classes`, { credentials: 'include' });
        const json = await response.json().catch(() => ({}));
        if (!response.ok) throw new Error(json.error?.message || `HTTP ${response.status}`);
        state.classItems = json.items || [];
        state.classLoaded = true;
        renderTrainingClasses();
        return true;
    } catch (error) {
        console.error('Class list error:', error);
        if (body) body.innerHTML = `<tr><td colspan="7">${escapeHTML(error.message || 'Không thể tải danh sách lớp.')}</td></tr>`;
        return false;
    }
}

function renderTrainingClasses() {
    const body = document.getElementById('classTableBody');
    const empty = document.getElementById('classListEmpty');
    if (!body) return;
    const allItems = state.classItems || [];
    populateAdminFilterSelect(
        'classCodeFilter',
        allItems.map(item => item.class_code),
        'Tất cả mã lớp',
        state.classCodeFilter
    );
    populateAdminFilterSelect(
        'classNameFilter',
        allItems.map(item => item.class_name),
        'Tất cả tên lớp',
        state.classNameFilter
    );
    const items = sortedTrainingClasses(allItems);
    updateManagementSortIndicators('[data-class-sort]', state.classSortKey, state.classSortDirection, 'classSort');
    syncStaticAdminFilterSelect('classStatusFilter', state.classStatusFilter);
    body.innerHTML = items.map(item => `
        <tr>
            <td><strong>${escapeHTML(item.class_code || '')}</strong></td>
            <td>${escapeHTML(item.class_name || '')}</td>
            <td>${escapeHTML(classDateLabel(item.start_date))}</td>
            <td>${escapeHTML(classStatusLabel(item.status || ''))}</td>
            <td>${Number(item.member_count || 0)}</td>
            <td>${Number(item.device_count || 0)}</td>
            <td><button type="button" class="button secondary class-edit-btn" data-edit-class-id="${escapeHTML(item.class_id || '')}" aria-label="Chỉnh sửa lớp ${escapeHTML(item.class_code || '')}">Sửa</button></td>
        </tr>
    `).join('');
    if (empty) {
        empty.textContent = !Array.isArray(state.classStatusFilter)
            && !Array.isArray(state.classCodeFilter)
            && !Array.isArray(state.classNameFilter)
            ? 'Chưa có lớp học nào.'
            : 'Không có lớp học phù hợp với bộ lọc đã chọn.';
        empty.hidden = items.length > 0;
    }
}

function resetTrainingClassForm() {
    state.classEditingId = '';
    state.classEditingUpdatedAt = '';
    state.classSelectedMembers.clear();
    state.classPendingMembers.clear();
    state.classSelectedDevices.clear();
    document.getElementById('classCreateForm')?.reset();
    const from = document.getElementById('classValidFrom');
    if (from) { from.disabled = false; from.removeAttribute('title'); }
    const title = document.getElementById('classFormTitle');
    const submit = document.getElementById('classCreateBtn');
    const cancel = document.getElementById('classEditCancelBtn');
    const tab = document.querySelector('[data-class-tab="create"]');
    if (title) title.textContent = 'Đăng ký lớp mới';
    if (submit) submit.textContent = 'Tạo lớp và giao bài';
    if (cancel) cancel.hidden = true;
    if (tab) tab.textContent = 'Đăng ký lớp mới';
    const info = document.getElementById('classMemberFileInfo');
    if (info) { info.hidden = true; info.textContent = ''; }
    const fileInput = document.getElementById('classMemberFileInput');
    if (fileInput) fileInput.value = '';
    updateTrainingClassSummary();
}

async function openTrainingClassEditor(classId) {
    if (!classId) return;
    const [catalogLoaded, response] = await Promise.all([
        loadTrainingClassCatalog(),
        fetch(`${API_BASE_URL}/classes/${encodeURIComponent(classId)}`, { credentials: 'include' })
    ]);
    const json = await response.json().catch(() => ({}));
    if (!catalogLoaded || !response.ok) {
        throw new Error(json.error?.message || `Không thể tải lớp (HTTP ${response.status})`);
    }
    const item = json.item || {};
    state.classEditingId = String(item.class_id || classId);
    state.classEditingUpdatedAt = String(item.updated_at || '');
    state.classPendingMembers.clear();
    const availableMemberIds = new Set(
        (state.classCatalog.members || []).map(member => String(member.user_id || '')).filter(Boolean)
    );
    state.classSelectedMembers = new Set(
        (item.members || [])
            .map(member => String(member.user_id || ''))
            .filter(userId => userId && availableMemberIds.has(userId))
    );
    const unavailableMemberCount = Math.max(0, (item.members || []).length - state.classSelectedMembers.size);
    state.classSelectedDevices = new Set((item.devices || []).map(device => String(device.device_id || '')).filter(Boolean));
    const name = document.getElementById('className');
    const from = document.getElementById('classValidFrom');
    if (name) name.value = item.class_name || '';
    if (from) from.value = String(item.start_date || '').slice(0, 10);
    if (from) {
        from.disabled = String(item.start_date || '').slice(0, 10) <= toDateKey(new Date());
        if (from.disabled) from.title = 'Không thể đổi ngày bắt đầu sau khi lớp đã có hiệu lực.';
        else from.removeAttribute('title');
    }
    const title = document.getElementById('classFormTitle');
    const submit = document.getElementById('classCreateBtn');
    const cancel = document.getElementById('classEditCancelBtn');
    const tab = document.querySelector('[data-class-tab="create"]');
    if (title) title.textContent = `Chỉnh sửa lớp ${item.class_code || ''}`;
    if (submit) submit.textContent = 'Lưu thay đổi';
    if (cancel) cancel.hidden = false;
    if (tab) tab.textContent = 'Chỉnh sửa lớp';
    updateTrainingClassSummary();
    activateClassTab('create');
    if (unavailableMemberCount) {
        showToast(`${unavailableMemberCount} KTV đã ngừng hoạt động không được đưa vào danh sách chỉnh sửa.`, 'info');
    }
    window.setTimeout(() => name?.focus(), 0);
}

let classConfigModalReturnFocus = null;

async function loadTrainingClassCatalog() {
    if (state.classCatalogLoaded) {
        return true;
    }
    try {
        const response = await fetch(`${API_BASE_URL}/classes/catalog`, { credentials: 'include' });
        const json = await response.json().catch(() => ({}));
        if (!response.ok) throw new Error(json.error?.message || `HTTP ${response.status}`);
        state.classCatalog = json.data || { members: [], devices: [] };
        state.classCatalogLoaded = true;
        return true;
    } catch (error) {
        showToast(`Không thể tải danh mục tạo lớp: ${error.message}`, 'error');
        return false;
    }
}

function classDraftIsValid() {
    const name = document.getElementById('className')?.value.trim() || '';
    const validFrom = document.getElementById('classValidFrom')?.value || '';
    return name.length > 0 && name.length <= 200 && validFrom !== '';
}

function updateTrainingClassSummary() {
    const totalMembers = state.classSelectedMembers.size + state.classPendingMembers.size;
    const totalDevices = state.classSelectedDevices.size;

    const summaryMemberCount = document.getElementById('classSummaryMemberCount');
    const summaryMemberSub = document.getElementById('classSummaryMemberSub');
    const summaryDeviceCount = document.getElementById('classSummaryDeviceCount');
    const summaryDeviceSub = document.getElementById('classSummaryDeviceSub');

    if (summaryMemberCount) {
        summaryMemberCount.textContent = `${totalMembers} KTV`;
    }
    if (summaryMemberSub) {
        if (totalMembers === 0) {
            summaryMemberSub.textContent = 'Chưa chọn KTV nào';
        } else {
            const parts = [];
            if (state.classSelectedMembers.size > 0) parts.push(`${state.classSelectedMembers.size} KTV có sẵn`);
            if (state.classPendingMembers.size > 0) parts.push(`${state.classPendingMembers.size} KTV mới từ file`);
            summaryMemberSub.textContent = parts.join(' · ');
        }
    }

    if (summaryDeviceCount) {
        summaryDeviceCount.textContent = `${totalDevices} thiết bị`;
    }
    if (summaryDeviceSub) {
        summaryDeviceSub.textContent = totalDevices === 0 ? 'Chưa chọn thiết bị nào' : `Đã chọn ${totalDevices} thiết bị đào tạo`;
    }

    const modalMemberCount = document.getElementById('classModalMemberCount');
    const modalDeviceCount = document.getElementById('classModalDeviceCount');
    if (modalMemberCount) modalMemberCount.textContent = String(totalMembers);
    if (modalDeviceCount) modalDeviceCount.textContent = String(totalDevices);
}

async function openClassConfigModal() {
    await loadTrainingClassCatalog();
    renderClassModalMembers();
    renderClassModalDevices();
    updateTrainingClassSummary();

    const modal = document.getElementById('classConfigModal');
    if (!modal) return;
    classConfigModalReturnFocus = document.activeElement;
    modal.hidden = false;
    modal.classList.add('visible');
    modal.setAttribute('aria-hidden', 'false');
    document.body.classList.add('modal-open');

    const searchInput = document.getElementById('classKtvSearchInput');
    if (searchInput) {
        searchInput.value = '';
        const dropdown = document.getElementById('classKtvSearchDropdown');
        if (dropdown) dropdown.hidden = true;
        window.setTimeout(() => searchInput.focus(), 50);
    }
}

function closeClassConfigModal() {
    const modal = document.getElementById('classConfigModal');
    if (!modal) return;
    modal.hidden = true;
    modal.classList.remove('visible');
    modal.setAttribute('aria-hidden', 'true');
    document.body.classList.remove('modal-open');
    updateTrainingClassSummary();
    if (classConfigModalReturnFocus instanceof HTMLElement) classConfigModalReturnFocus.focus();
    classConfigModalReturnFocus = null;
}

function renderClassModalMembers() {
    const listEl = document.getElementById('classSelectedMembersList');
    const emptyEl = document.getElementById('classSelectedMembersEmpty');
    if (!listEl) return;

    const existingMembers = (state.classCatalog.members || []).filter(member =>
        state.classSelectedMembers.has(String(member.user_id || ''))
    );
    const pendingMembers = [...state.classPendingMembers.values()];
    const totalCount = existingMembers.length + pendingMembers.length;

    if (emptyEl) emptyEl.hidden = totalCount > 0;

    let html = '';

    existingMembers.forEach(member => {
        const id = String(member.user_id || '');
        html += `
            <div class="class-member-row">
                <div class="class-member-row-info">
                    <div class="class-member-row-name-wrap">
                        <span class="class-member-row-name">${escapeHTML(member.display_name || member.email || 'KTV')}</span>
                        <span class="badge-member badge-existing">Đã có</span>
                    </div>
                    <span class="class-member-row-sub">${escapeHTML(member.employee_id || '—')} · ${escapeHTML(member.email || '')}</span>
                </div>
                <button type="button" class="class-member-remove-btn" data-remove-existing-member="${escapeHTML(id)}" title="Xóa khỏi lớp" aria-label="Xóa ${escapeHTML(member.display_name || 'KTV')}">×</button>
            </div>
        `;
    });

    pendingMembers.forEach(member => {
        const empId = String(member.employee_id || '');
        html += `
            <div class="class-member-row">
                <div class="class-member-row-info">
                    <div class="class-member-row-name-wrap">
                        <span class="class-member-row-name">${escapeHTML(member.display_name || member.email || 'KTV mới')}</span>
                        <span class="badge-member badge-pending">KTV mới (từ file)</span>
                    </div>
                    <span class="class-member-row-sub">${escapeHTML(member.employee_id || '—')} · ${escapeHTML(member.email || '')}</span>
                </div>
                <button type="button" class="class-member-remove-btn" data-remove-pending-member="${escapeHTML(empId)}" title="Xóa khỏi lớp" aria-label="Xóa ${escapeHTML(member.display_name || 'KTV mới')}">×</button>
            </div>
        `;
    });

    listEl.innerHTML = html;
}

function renderClassModalDevices() {
    const listEl = document.getElementById('classModalDeviceList');
    if (!listEl) return;

    const devices = state.classCatalog.devices || [];
    if (devices.length === 0) {
        listEl.innerHTML = '<p class="class-selected-members-empty">Chưa có thiết bị nào trong danh mục.</p>';
        return;
    }

    listEl.innerHTML = devices.map(device => {
        const id = String(device.device_id || '');
        const isChecked = state.classSelectedDevices.has(id);
        return `
            <label class="class-device-item">
                <input type="checkbox" data-modal-device="${escapeHTML(id)}" ${isChecked ? 'checked' : ''}>
                <div class="class-device-item-info">
                    <strong>${escapeHTML(device.device_name || id)}</strong>
                    <small>${escapeHTML(id)}${device.model ? ` · ${escapeHTML(device.model)}` : ''}</small>
                </div>
            </label>
        `;
    }).join('');
}

function handleKtvSearchInput(event) {
    const query = (event.target.value || '').trim().toLowerCase();
    const dropdown = document.getElementById('classKtvSearchDropdown');
    if (!dropdown) return;

    if (!query) {
        dropdown.hidden = true;
        dropdown.innerHTML = '';
        return;
    }

    const allMembers = state.classCatalog.members || [];
    const filtered = allMembers.filter(member => {
        const id = String(member.user_id || '');
        if (state.classSelectedMembers.has(id)) return false;
        const empId = String(member.employee_id || '').toLowerCase();
        const name = String(member.display_name || '').toLowerCase();
        const email = String(member.email || '').toLowerCase();
        return empId.includes(query) || name.includes(query) || email.includes(query);
    });

    const top5 = filtered.slice(0, 5);

    if (top5.length === 0) {
        dropdown.innerHTML = '<div class="class-ktv-dropdown-empty">Không tìm thấy KTV phù hợp.</div>';
        dropdown.hidden = false;
        return;
    }

    dropdown.innerHTML = top5.map(member => {
        const id = String(member.user_id || '');
        return `
            <div class="class-ktv-dropdown-item" data-add-ktv-id="${escapeHTML(id)}" tabindex="0" role="button">
                <div class="class-ktv-item-left">
                    <span class="class-ktv-item-name">${escapeHTML(member.display_name || member.email || 'KTV')}</span>
                    <span class="class-ktv-item-sub">${escapeHTML(member.employee_id || '—')} · ${escapeHTML(member.email || '')}</span>
                </div>
                <span class="class-ktv-item-add">+ Thêm</span>
            </div>
        `;
    }).join('');

    dropdown.hidden = false;
}

function addKtvToClass(userId) {
    if (!userId) return;
    state.classSelectedMembers.add(userId);
    renderClassModalMembers();
    updateTrainingClassSummary();

    const searchInput = document.getElementById('classKtvSearchInput');
    const dropdown = document.getElementById('classKtvSearchDropdown');
    if (searchInput) {
        searchInput.value = '';
        searchInput.focus();
    }
    if (dropdown) {
        dropdown.hidden = true;
        dropdown.innerHTML = '';
    }
}

async function previewClassMembers(file) {
    if (!classDraftIsValid()) {
        showToast('Nhập tên lớp và ngày hiệu lực hợp lệ trước khi chọn file KTV.', 'error');
        return;
    }
    if (!file?.name?.toLowerCase().endsWith('.xlsx')) {
        showToast('Vui lòng chọn file KTV định dạng .xlsx.', 'error');
        return;
    }
    if (file.size > 8 * 1024 * 1024) {
        showToast('File KTV không được vượt quá 8 MB.', 'error');
        return;
    }
    state.classMemberImportFile = file;
    state.classMemberImportBusy = true;
    const info = document.getElementById('classMemberFileInfo');
    if (info) { info.hidden = false; info.textContent = `${file.name} (${(file.size / 1024).toFixed(1)} KB) — đang kiểm tra...`; }
    const form = new FormData();
    form.append('file', file);
    form.append('class_name', document.getElementById('className')?.value.trim() || '');
    form.append('valid_from', document.getElementById('classValidFrom')?.value || '');
    try {
        const response = await fetch(`${API_BASE_URL}/classes/members/preview`, { method: 'POST', credentials: 'include', body: form });
        const json = await response.json().catch(() => ({}));
        if (!response.ok) throw new Error(json.error?.message || `HTTP ${response.status}`);
        const data = json.data || {};
        if (data.errors && data.errors.length > 0) {
            const firstError = data.errors[0];
            const msg = firstError ? `Dòng ${firstError.row || '?'}: ${firstError.message || 'Dữ liệu không hợp lệ'}` : 'File KTV có lỗi.';
            if (info) info.textContent = `${file.name} — file có lỗi, chưa nạp được KTV nào. Kiểm tra lại file.`;
            showToast(`File KTV không hợp lệ: ${msg}`, 'error');
            return;
        }
        (data.members || []).forEach(member => {
            if (member.action === 'create') {
                state.classPendingMembers.set(String(member.employee_id || ''), {
                    employee_id: member.employee_id,
                    display_name: member.display_name,
                    email: member.email,
                });
            } else if (member.user_id) {
                state.classSelectedMembers.add(String(member.user_id));
            }
        });
        const total = (data.members || []).length;
        if (info) info.textContent = `${file.name} (${(file.size / 1024).toFixed(1)} KB) — Đã nạp ${total} KTV`;
        showToast(`Đã đọc thành công ${total} KTV từ file. Hãy kiểm tra thành viên và chọn thiết bị.`, 'success');
        await openClassConfigModal();
    } catch (error) {
        if (info) info.textContent = `${file.name} — không đọc được file. Hãy thử lại.`;
        showToast(`Không thể đọc file KTV: ${error.message}`, 'error');
    } finally {
        state.classMemberImportBusy = false;
        updateTrainingClassSummary();
    }
}

async function submitTrainingClass(event) {
    event.preventDefault();
    const name = document.getElementById('className')?.value.trim() || '';
    const validFrom = document.getElementById('classValidFrom')?.value || '';
    const editing = Boolean(state.classEditingId);
    const totalMembers = state.classSelectedMembers.size + state.classPendingMembers.size;
    const totalDevices = state.classSelectedDevices.size;

    if (!name || !validFrom) {
        showToast('Vui lòng nhập tên lớp và ngày hiệu lực.', 'error');
        return;
    }
    if (!totalMembers) {
        showToast('Vui lòng thêm ít nhất một KTV vào lớp (qua tìm kiếm hoặc chọn file KTV).', 'error');
        return;
    }
    if (!totalDevices) {
        showToast('Vui lòng chọn ít nhất một thiết bị được giao cho lớp.', 'error');
        return;
    }
    const button = document.getElementById('classCreateBtn');
    if (button) { button.disabled = true; button.textContent = editing ? 'Đang lưu...' : 'Đang tạo lớp...'; }
    try {
        const endpoint = editing
            ? `${API_BASE_URL}/classes/${encodeURIComponent(state.classEditingId)}`
            : `${API_BASE_URL}/classes`;
        const response = await fetch(endpoint, {
            method: editing ? 'PATCH' : 'POST',
            credentials: 'include',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                className: name,
                validFrom,
                memberUserIds: [...state.classSelectedMembers],
                memberImports: [...state.classPendingMembers.values()],
                deviceIds: [...state.classSelectedDevices],
                ...(editing ? { expectedUpdatedAt: state.classEditingUpdatedAt } : {})
            })
        });
        const json = await response.json().catch(() => ({}));
        if (!response.ok) throw new Error(json.error?.message || `HTTP ${response.status}`);
        const code = json.item?.class_code || '';
        showToast(editing ? `Đã cập nhật lớp ${code}.` : `Đã tạo lớp ${code} và giao bài thành công.`, 'success');
        resetTrainingClassForm();
        state.classLoaded = false;
        await loadTrainingClasses();
        await Promise.allSettled([
            loadRosterList(),
            refreshDashboardData({ force: true }),
            ensureTrainingAssignmentsLoaded({ force: true })
        ]);
        activateClassTab('list');
    } catch (error) {
        showToast(`${editing ? 'Không thể cập nhật lớp' : 'Không thể tạo lớp'}: ${error.message}`, 'error');
    } finally {
        if (button) {
            button.disabled = false;
            button.textContent = state.classEditingId ? 'Lưu thay đổi' : 'Tạo lớp và giao bài';
        }
    }
}

function initTrainingClasses() {
    if (state.classInitialized) return;
    state.classInitialized = true;
    document.querySelectorAll('[data-class-tab]').forEach(button => button.addEventListener('click', () => {
        if (button.dataset.classTab === 'create' && state.classTab !== 'create') resetTrainingClassForm();
        activateClassTab(button.dataset.classTab);
    }));

    document.querySelectorAll('[data-class-sort]').forEach(button => {
        button.addEventListener('click', () => {
            const key = button.dataset.classSort;
            state.classSortDirection = state.classSortKey === key && state.classSortDirection === 'asc'
                ? 'desc'
                : 'asc';
            state.classSortKey = key;
            renderTrainingClasses();
        });
    });
    updateManagementSortIndicators('[data-class-sort]', state.classSortKey, state.classSortDirection, 'classSort');

    document.getElementById('classStatusFilter')?.addEventListener('change', event => {
        state.classStatusFilter = getAdminFilterSelection(event.target);
        updateAdminHeaderFilterState(event.target);
        renderTrainingClasses();
    });
    [
        ['classCodeFilter', 'classCodeFilter'],
        ['classNameFilter', 'classNameFilter']
    ].forEach(([id, stateKey]) => {
        document.getElementById(id)?.addEventListener('change', event => {
            state[stateKey] = getAdminFilterSelection(event.target);
            updateAdminHeaderFilterState(event.target);
            renderTrainingClasses();
        });
    });

    document.getElementById('classTableBody')?.addEventListener('click', event => {
        const button = event.target.closest('[data-edit-class-id]');
        if (!button) return;
        openTrainingClassEditor(button.dataset.editClassId).catch(error => {
            showToast(`Không thể mở lớp để chỉnh sửa: ${error.message}`, 'error');
        });
    });

    document.getElementById('classEditCancelBtn')?.addEventListener('click', () => {
        resetTrainingClassForm();
        activateClassTab('list');
    });

    document.getElementById('classOpenConfigModalBtn')?.addEventListener('click', () => {
        openClassConfigModal();
    });
    document.getElementById('classSummaryEditBtn')?.addEventListener('click', () => {
        openClassConfigModal();
    });

    document.getElementById('classConfigModalClose')?.addEventListener('click', closeClassConfigModal);
    document.getElementById('classConfigModalCancelBtn')?.addEventListener('click', closeClassConfigModal);
    document.getElementById('classConfigModalSaveBtn')?.addEventListener('click', closeClassConfigModal);

    document.getElementById('classConfigModal')?.addEventListener('click', event => {
        if (event.target === document.getElementById('classConfigModal')) {
            closeClassConfigModal();
        }
    });

    const ktvSearchInput = document.getElementById('classKtvSearchInput');
    ktvSearchInput?.addEventListener('input', handleKtvSearchInput);

    document.getElementById('classKtvSearchDropdown')?.addEventListener('click', event => {
        const item = event.target.closest('[data-add-ktv-id]');
        if (item) {
            addKtvToClass(item.dataset.addKtvId);
        }
    });

    document.addEventListener('click', event => {
        const searchBox = event.target.closest('.class-ktv-search-box');
        if (!searchBox) {
            const dropdown = document.getElementById('classKtvSearchDropdown');
            if (dropdown) dropdown.hidden = true;
        }
    });

    document.getElementById('classSelectedMembersList')?.addEventListener('click', event => {
        const removeExisting = event.target.closest('[data-remove-existing-member]');
        if (removeExisting) {
            const id = removeExisting.dataset.removeExistingMember;
            state.classSelectedMembers.delete(id);
            renderClassModalMembers();
            updateTrainingClassSummary();
            return;
        }
        const removePending = event.target.closest('[data-remove-pending-member]');
        if (removePending) {
            const empId = removePending.dataset.removePendingMember;
            state.classPendingMembers.delete(empId);
            renderClassModalMembers();
            updateTrainingClassSummary();
        }
    });

    document.getElementById('classModalClearMembersBtn')?.addEventListener('click', () => {
        state.classSelectedMembers.clear();
        state.classPendingMembers.clear();
        renderClassModalMembers();
        updateTrainingClassSummary();
    });

    document.getElementById('classModalDeviceList')?.addEventListener('change', event => {
        const id = event.target?.dataset?.modalDevice;
        if (!id) return;
        if (event.target.checked) {
            state.classSelectedDevices.add(id);
        } else {
            state.classSelectedDevices.delete(id);
        }
        updateTrainingClassSummary();
    });

    document.getElementById('classModalSelectAllDevicesBtn')?.addEventListener('click', () => {
        (state.classCatalog.devices || []).forEach(d => {
            if (d.device_id) state.classSelectedDevices.add(String(d.device_id));
        });
        renderClassModalDevices();
        updateTrainingClassSummary();
    });
    document.getElementById('classModalDeselectAllDevicesBtn')?.addEventListener('click', () => {
        state.classSelectedDevices.clear();
        renderClassModalDevices();
        updateTrainingClassSummary();
    });

    document.getElementById('classCreateForm')?.addEventListener('submit', submitTrainingClass);

    const memberFileInput = document.getElementById('classMemberFileInput');
    document.getElementById('classMemberFileBtn')?.addEventListener('click', () => {
        if (!classDraftIsValid()) {
            document.getElementById('classCreateForm')?.reportValidity();
            showToast('Hãy nhập tên lớp và ngày hiệu lực trước khi chọn file KTV.', 'error');
            return;
        }
        memberFileInput?.click();
    });
    memberFileInput?.addEventListener('change', () => {
        if (memberFileInput.files?.[0]) previewClassMembers(memberFileInput.files[0]);
    });

    updateTrainingClassSummary();
}


// ── Theme Manager (Light, Dark, System) ──────────────────────────
function initThemeManager() {
    const THEME_STORAGE_KEY = 'ftc_dashboard_theme';
    const VALID_THEME_SETTINGS = new Set(['light', 'dark', 'system']);
    const THEME_COLORS = { light: '#f3f6fb', dark: '#111a2e' };
    const switcher = document.getElementById('themeSwitcher');
    const themeColorMeta = document.querySelector('meta[name="theme-color"]');
    const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)');
    let currentSetting = 'system';

    function normalizeThemeSetting(value) {
        return VALID_THEME_SETTINGS.has(value) ? value : 'system';
    }

    function getSavedThemeSetting() {
        try {
            return normalizeThemeSetting(localStorage.getItem(THEME_STORAGE_KEY));
        } catch (e) {
            return 'system';
        }
    }

    function applyTheme(requestedSetting, { persist = false } = {}) {
        const setting = normalizeThemeSetting(requestedSetting);
        const prefersDark = mediaQuery.matches;
        const resolvedTheme = setting === 'system' ? (prefersDark ? 'dark' : 'light') : setting;
        currentSetting = setting;

        document.documentElement.dataset.theme = resolvedTheme;
        document.documentElement.dataset.themeSetting = setting;
        document.documentElement.style.colorScheme = resolvedTheme;
        if (themeColorMeta) themeColorMeta.content = THEME_COLORS[resolvedTheme];

        if (persist) {
            try {
                localStorage.setItem(THEME_STORAGE_KEY, setting);
            } catch (e) { /* Keep the selected theme for this page session. */ }
        }

        if (switcher) {
            switcher.querySelectorAll('.theme-btn').forEach(btn => {
                const val = btn.getAttribute('data-theme-value');
                const isActive = val === setting;
                btn.classList.toggle('active', isActive);
                btn.setAttribute('aria-pressed', String(isActive));
            });
        }

        window.dispatchEvent(new CustomEvent('ftc:themechange', {
            detail: { setting, resolvedTheme }
        }));
    }

    applyTheme(getSavedThemeSetting());

    if (switcher) {
        switcher.querySelectorAll('.theme-btn').forEach(btn => {
            btn.addEventListener('click', () => {
                const targetTheme = btn.getAttribute('data-theme-value');
                if (VALID_THEME_SETTINGS.has(targetTheme)) {
                    applyTheme(targetTheme, { persist: true });
                }
            });
        });
    }

    const handleSystemThemeChange = () => {
        if (currentSetting === 'system') applyTheme('system');
    };

    try {
        mediaQuery.addEventListener('change', handleSystemThemeChange);
    } catch (e) {
        if (typeof mediaQuery.addListener === 'function') {
            mediaQuery.addListener(handleSystemThemeChange);
        }
    }

    window.addEventListener('storage', event => {
        if (event.key === THEME_STORAGE_KEY) {
            applyTheme(normalizeThemeSetting(event.newValue));
        }
    });
}

document.addEventListener('DOMContentLoaded', () => {
    initThemeManager();
    initDashboardViewRouting();
    initSidebarNavigation();
    initDashboardExperience();
    initFilters();
    initSort();
    initDateRangePicker();
    initHourlyDatePicker();
    initReportExport();
    initInstructorWorkspace();
    initClassMatrix();
    initRegionUsageChart();
    initRoster();
    initTrainingClasses();
    initUnifiedDashboardControls();
    initEvents();
    initSubModalEvents();
    loadInitialDashboardData();
});
