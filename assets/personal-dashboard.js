/**
 * FTC NETWORK SIMULATOR - PERSONAL DASHBOARD FOR KTV
 * Logic for fetching data, rendering KPIs, device progress, interactive SVG charts,
 * and filtering/paginating session history.
 */

(function () {
  'use strict';

  let _dashboardData = null;
  let _filteredSessions = [];
  let _currentPage = 1;
  const PAGE_SIZE = 12;

  // DOM Elements
  const elLoading = document.getElementById('loading-state');
  const elContent = document.getElementById('dashboard-content');
  const elError = document.getElementById('error-state');
  const elErrorMessage = document.getElementById('error-message');

  // User elements
  const elUserName = document.getElementById('user-name');
  const elUserAvatar = document.getElementById('user-avatar');
  const elHeroTitle = document.getElementById('hero-greeting-title');
  const elHeroSubtitle = document.getElementById('hero-greeting-desc');
  const elTagEmployeeId = document.getElementById('tag-employee-id');
  const elTagClass = document.getElementById('tag-class-name');
  const elTagRegion = document.getElementById('tag-region');

  // Metric elements
  const elMetricCompletionVal = document.getElementById('metric-completion-val');
  const elMetricCompletionSub = document.getElementById('metric-completion-sub');
  const elMetricCompletionBar = document.getElementById('metric-completion-bar');

  const elMetricFirstTryVal = document.getElementById('metric-first-try-val');
  const elMetricFirstTrySub = document.getElementById('metric-first-try-sub');
  const elMetricFirstTryBar = document.getElementById('metric-first-try-bar');

  const elMetricPassRateVal = document.getElementById('metric-pass-rate-val');
  const elMetricPassRateSub = document.getElementById('metric-pass-rate-sub');
  const elMetricPassRateBar = document.getElementById('metric-pass-rate-bar');

  const elMetricTimeVal = document.getElementById('metric-time-val');
  const elMetricTimeSub = document.getElementById('metric-time-sub');
  const elMetricTimeBar = document.getElementById('metric-time-bar');

  // Donut elements
  const elDonutCircle = document.getElementById('donut-circle-progress');
  const elDonutPercent = document.getElementById('donut-percent-text');
  const elStatPassedCount = document.getElementById('stat-passed-count');
  const elStatInProgressCount = document.getElementById('stat-in-progress-count');
  const elStatUnstartedCount = document.getElementById('stat-unstarted-count');

  // Device & Sessions containers
  const elDeviceGrid = document.getElementById('device-progress-grid');
  const elSessionsBody = document.getElementById('sessions-table-body');
  const elSessionsCount = document.getElementById('sessions-total-count');
  const elSessionsPagination = document.getElementById('sessions-pagination');
  const elPageInfo = document.getElementById('page-info');
  const elBtnPrevPage = document.getElementById('btn-prev-page');
  const elBtnNextPage = document.getElementById('btn-next-page');

  // Filters
  const elFilterSearch = document.getElementById('filter-search');
  const elFilterMode = document.getElementById('filter-mode');
  const elFilterResult = document.getElementById('filter-result');
  const elFilterDevice = document.getElementById('filter-device');

  // Trend & Frequency Chart Elements & State
  const elTrendChartContainer = document.getElementById('trend-chart-container');
  const elTrendChartTitle = document.getElementById('trend-chart-title');
  const elTrendChartIcon = document.getElementById('trend-chart-icon');
  const elBtnChartResult = document.getElementById('btn-chart-result');
  const elBtnChartFrequency = document.getElementById('btn-chart-frequency');
  const elChartMonthSelect = document.getElementById('chart-month-select');

  let _chartMode = 'result'; // 'result' | 'frequency'
  let _selectedMonth = ''; // 'YYYY-MM'

  function init() {
    setupEventListeners();
    fetchDashboardData();
  }

  function setupEventListeners() {
    if (elFilterSearch) elFilterSearch.addEventListener('input', debounce(applySessionFilters, 250));
    if (elFilterMode) elFilterMode.addEventListener('change', applySessionFilters);
    if (elFilterResult) elFilterResult.addEventListener('change', applySessionFilters);
    if (elFilterDevice) elFilterDevice.addEventListener('change', applySessionFilters);

    if (elBtnPrevPage) {
      elBtnPrevPage.addEventListener('click', () => {
        if (_currentPage > 1) {
          _currentPage--;
          renderSessionsTable();
        }
      });
    }

    if (elBtnNextPage) {
      elBtnNextPage.addEventListener('click', () => {
        const totalPages = Math.ceil(_filteredSessions.length / PAGE_SIZE) || 1;
        if (_currentPage < totalPages) {
          _currentPage++;
          renderSessionsTable();
        }
      });
    }

    if (elBtnChartResult) {
      elBtnChartResult.addEventListener('click', () => {
        if (_chartMode === 'result') return;
        _chartMode = 'result';
        elBtnChartResult.classList.add('active');
        elBtnChartFrequency?.classList.remove('active');
        if (elChartMonthSelect) elChartMonthSelect.style.display = 'none';
        if (elTrendChartTitle) elTrendChartTitle.textContent = 'Xu hướng kết quả Đạt';
        if (elTrendChartIcon) {
          elTrendChartIcon.innerHTML = '<polyline points="22 12 18 12 15 21 9 3 6 12 2 12"></polyline>';
        }
        renderActiveChart();
      });
    }

    if (elBtnChartFrequency) {
      elBtnChartFrequency.addEventListener('click', () => {
        if (_chartMode === 'frequency') return;
        _chartMode = 'frequency';
        elBtnChartFrequency.classList.add('active');
        elBtnChartResult?.classList.remove('active');
        if (elChartMonthSelect) elChartMonthSelect.style.display = 'inline-block';
        if (elTrendChartTitle) elTrendChartTitle.textContent = 'Tần suất thực hiện theo ngày';
        if (elTrendChartIcon) {
          elTrendChartIcon.innerHTML = '<rect x="3" y="12" width="4" height="8" rx="1"></rect><rect x="10" y="8" width="4" height="12" rx="1"></rect><rect x="17" y="4" width="4" height="16" rx="1"></rect>';
        }
        renderActiveChart();
      });
    }

    if (elChartMonthSelect) {
      elChartMonthSelect.addEventListener('change', (e) => {
        _selectedMonth = e.target.value;
        renderActiveChart();
      });
    }

    window.addEventListener('resize', debounce(() => {
      renderActiveChart();
    }, 200));

    const btnLogout = document.getElementById('btn-logout');
    if (btnLogout) {
      btnLogout.addEventListener('click', handleLogout);
    }
  }

  function fetchDashboardData() {
    showLoading(true);
    fetch('/api/index.php/learning/personal-dashboard', {
      method: 'GET',
      credentials: 'include',
      headers: { 'Accept': 'application/json' }
    })
      .then(res => {
        if (res.status === 401) {
          window.location.href = '/login/?redirect=' + encodeURIComponent(window.location.pathname);
          return null;
        }
        if (!res.ok) {
          throw new Error(`HTTP ${res.status}`);
        }
        return res.json();
      })
      .then(data => {
        if (!data || !data.data) {
          throw new Error('Dữ liệu trả về không hợp lệ.');
        }
        _dashboardData = data.data;
        renderDashboard(_dashboardData);
        showLoading(false);
      })
      .catch(err => {
        console.error('[PersonalDashboard] Error loading dashboard:', err);
        showError('Không thể tải thông tin tiến độ cá nhân. Vui lòng thử lại sau.');
      });
  }

  function renderDashboard(data) {
    const user = data.user || {};
    const stats = data.stats || {};
    const classes = data.classes || [];
    const devices = data.device_progress || [];
    const sessions = data.sessions || [];
    const trend = data.trend || [];

    // 1. User info & Greeting
    const displayName = user.display_name || user.email || 'Kỹ thuật viên';
    if (elUserName) elUserName.textContent = displayName;
    if (elHeroTitle) elHeroTitle.textContent = `Xin chào, ${displayName}! 👋`;
    
    const initials = displayName.substring(0, 2).toUpperCase();
    if (elUserAvatar) elUserAvatar.textContent = initials;

    if (elTagEmployeeId) {
      elTagEmployeeId.innerHTML = `
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
          <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"></path>
          <circle cx="12" cy="7" r="4"></circle>
        </svg>
        <span>Mã KTV: <strong>${escapeHTML(user.employee_id || 'Chưa có')}</strong></span>
      `;
    }

    const activeClass = classes.length > 0 ? classes[0] : null;
    if (elTagClass) {
      const className = activeClass ? (activeClass.class_name || activeClass.class_code) : 'Tự do / Chưa gán lớp';
      elTagClass.innerHTML = `
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
          <path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20"></path>
          <path d="M6.5 2H20v20H6.5A2.5 2.5 0 0 1 4 19.5v-15A2.5 2.5 0 0 1 6.5 2z"></path>
        </svg>
        <span>Lớp: <strong>${escapeHTML(className)}</strong></span>
      `;
    }

    if (elTagRegion) {
      const regionName = user.region_name || user.unit_name || 'FTC Toàn quốc';
      elTagRegion.innerHTML = `
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
          <circle cx="12" cy="12" r="10"></circle>
          <path d="M12 2a14.5 14.5 0 0 0 0 20 14.5 14.5 0 0 0 0-20"></path>
          <path d="M2 12h20"></path>
        </svg>
        <span>Khu vực: <strong>${escapeHTML(regionName)}</strong></span>
      `;
    }

    // 2. Metrics Ribbon
    const completionPct = stats.completion_rate_percent || 0;
    if (elMetricCompletionVal) elMetricCompletionVal.textContent = `${completionPct}%`;
    if (elMetricCompletionSub) elMetricCompletionSub.textContent = `${stats.passed_labs || 0}/${stats.total_assigned_labs || 0} bài đạt`;
    if (elMetricCompletionBar) elMetricCompletionBar.style.width = `${Math.min(100, completionPct)}%`;

    const firstTryPct = stats.first_try_pass_rate_percent || 0;
    if (elMetricFirstTryVal) elMetricFirstTryVal.textContent = `${firstTryPct}%`;
    if (elMetricFirstTrySub) elMetricFirstTrySub.textContent = `Tỷ lệ đạt lần 1`;
    if (elMetricFirstTryBar) elMetricFirstTryBar.style.width = `${Math.min(100, firstTryPct)}%`;

    const passRate = stats.practice_pass_rate_percent || 0;
    const passedSessions = stats.passed_practice_sessions_count || 0;
    const gradedSessions = stats.graded_practice_sessions_count || 0;
    if (elMetricPassRateVal) elMetricPassRateVal.textContent = `${passRate}%`;
    if (elMetricPassRateSub) elMetricPassRateSub.textContent = `${passedSessions}/${gradedSessions} phiên Đạt`;
    if (elMetricPassRateBar) elMetricPassRateBar.style.width = `${Math.min(100, passRate)}%`;

    const durationSec = stats.total_practice_duration_sec || 0;
    const durFormatted = formatDurationHuman(durationSec);
    if (elMetricTimeVal) elMetricTimeVal.textContent = durFormatted.primary;
    if (elMetricTimeSub) elMetricTimeSub.textContent = durFormatted.secondary;
    if (elMetricTimeBar) elMetricTimeBar.style.width = `${Math.min(100, (durationSec / 7200) * 100)}%`;

    // 3. Donut Progress
    renderDonutProgress(completionPct, stats);

    // 4. Trend or Frequency Chart
    renderActiveChart();

    // 5. Device progress grid
    renderDeviceProgress(devices);

    // 6. Populate device filter dropdown
    populateDeviceFilter(devices);

    // 7. Render sessions table
    _filteredSessions = [...sessions];
    _currentPage = 1;
    renderSessionsTable();
  }

  function renderDonutProgress(percent, stats) {
    if (elDonutPercent) elDonutPercent.textContent = `${percent}%`;
    if (elDonutCircle) {
      const radius = 64;
      const circumference = 2 * Math.PI * radius;
      elDonutCircle.style.strokeDasharray = `${circumference} ${circumference}`;
      const offset = circumference - (percent / 100) * circumference;
      elDonutCircle.style.strokeDashoffset = offset;
    }

    if (elStatPassedCount) elStatPassedCount.textContent = `${stats.passed_labs || 0} bài`;
    if (elStatInProgressCount) elStatInProgressCount.textContent = `${stats.in_progress_labs || 0} bài`;
    if (elStatUnstartedCount) elStatUnstartedCount.textContent = `${stats.unstarted_labs || 0} bài`;
  }

  function getAvailableMonths(sessions) {
    const monthsSet = new Set();
    const now = new Date();
    monthsSet.add(`${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`);

    (sessions || []).forEach(s => {
      const timeStr = s.finished_at || s.started_at;
      if (timeStr) {
        const d = new Date(timeStr.replace(' ', 'T'));
        if (!isNaN(d.getTime())) {
          monthsSet.add(`${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`);
        }
      }
    });

    return Array.from(monthsSet).sort().reverse();
  }

  function renderActiveChart() {
    if (!_dashboardData) return;
    if (_chartMode === 'frequency') {
      renderMonthlyFrequencyChart(_selectedMonth);
    } else {
      renderTrendChart(_dashboardData.trend);
    }
  }

  function renderMonthlyFrequencyChart(selectedMonthStr) {
    if (!elTrendChartContainer) return;
    elTrendChartContainer.innerHTML = '';

    const sessions = _dashboardData?.sessions || [];
    const availableMonths = getAvailableMonths(sessions);
    if (!selectedMonthStr || !availableMonths.includes(selectedMonthStr)) {
      selectedMonthStr = availableMonths[0] || `${new Date().getFullYear()}-${String(new Date().getMonth() + 1).padStart(2, '0')}`;
    }
    _selectedMonth = selectedMonthStr;

    // Update month dropdown options if needed
    if (elChartMonthSelect) {
      const optionsHtml = availableMonths.map(m => {
        const [y, mon] = m.split('-');
        return `<option value="${m}" ${m === _selectedMonth ? 'selected' : ''}>Tháng ${mon}/${y}</option>`;
      }).join('');
      if (elChartMonthSelect.innerHTML !== optionsHtml) {
        elChartMonthSelect.innerHTML = optionsHtml;
      }
      elChartMonthSelect.value = _selectedMonth;
    }

    const [year, month] = _selectedMonth.split('-').map(Number);
    const totalDays = new Date(year, month, 0).getDate(); // 28 - 31

    // Initialize daily slots
    const daysData = Array.from({ length: totalDays }, (_, i) => ({
      day: i + 1,
      dateStr: `${year}-${String(month).padStart(2, '0')}-${String(i + 1).padStart(2, '0')}`,
      total: 0,
      practice: 0,
      guide: 0,
      passed: 0,
      duration_sec: 0
    }));

    // Aggregate sessions for this month
    sessions.forEach(sess => {
      const timeStr = sess.finished_at || sess.started_at;
      if (!timeStr) return;
      const dateObj = new Date(timeStr.replace(' ', 'T'));
      if (isNaN(dateObj.getTime())) return;
      if (dateObj.getFullYear() === year && (dateObj.getMonth() + 1) === month) {
        const d = dateObj.getDate();
        if (d >= 1 && d <= totalDays) {
          const item = daysData[d - 1];
          item.total++;
          const isPractice = sess.mode === 'Thực hành' || sess.mode === 'practice' || sess.session_type === 'practice';
          if (isPractice) {
            item.practice++;
            if (sess.is_passed === true || sess.status === 'Đạt' || sess.status === 'Hoàn thành') {
              item.passed++;
            }
          } else {
            item.guide++;
          }
          item.duration_sec += (sess.duration_sec || 0);
        }
      }
    });

    const totalMonthSessions = daysData.reduce((sum, d) => sum + d.total, 0);
    const totalMonthPractice = daysData.reduce((sum, d) => sum + d.practice, 0);
    const totalMonthGuide = daysData.reduce((sum, d) => sum + d.guide, 0);
    const totalMonthPassed = daysData.reduce((sum, d) => sum + d.passed, 0);

    const width = elTrendChartContainer.clientWidth || 680;
    const height = 220;
    const padding = { top: 25, right: 25, bottom: 35, left: 42 };
    const chartW = width - padding.left - padding.right;
    const chartH = height - padding.top - padding.bottom;

    const peakSessions = Math.max(0, ...daysData.map(d => d.total));
    const tickStep = peakSessions <= 4 ? 1 : (peakSessions <= 8 ? 2 : (peakSessions <= 16 ? 4 : Math.ceil(peakSessions / 4)));
    const yMax = Math.max(4, Math.ceil(peakSessions / tickStep) * tickStep);
    const yAt = val => padding.top + chartH - (val / yMax * chartH);

    // Y Grid lines
    let gridSvg = '';
    const yTicksCount = Math.round(yMax / tickStep);
    for (let i = 0; i <= yTicksCount; i++) {
      const val = i * tickStep;
      const y = yAt(val);
      gridSvg += `
        <line x1="${padding.left}" y1="${y}" x2="${width - padding.right}" y2="${y}" stroke="#e2e8f0" stroke-dasharray="3,3" stroke-width="1" />
        <text x="${padding.left - 8}" y="${y + 4}" font-size="11" font-weight="600" fill="#94a3b8" text-anchor="end">${val}</text>
      `;
    }

    // Y Axis Title
    const yTitleSvg = `
      <text x="14" y="${padding.top + chartH / 2}" font-size="10.5" font-weight="700" fill="#64748b" text-anchor="middle" transform="rotate(-90 14 ${padding.top + chartH / 2})">Lượt / ngày</text>
    `;

    // Columns / Bars
    const colStep = chartW / totalDays;
    const barW = Math.max(6, Math.min(15, colStep * 0.68));

    let barsSvg = '';
    let xLabelsSvg = '';

    daysData.forEach((d, idx) => {
      const x = padding.left + (idx + 0.5) * colStep;
      
      // X labels on days: 1, 5, 10, 15, 20, 25, totalDays
      const isLabeled = d.day === 1 || d.day % 5 === 0 || d.day === totalDays;
      if (isLabeled) {
        xLabelsSvg += `
          <text x="${x}" y="${height - 10}" font-size="11" font-weight="600" fill="#64748b" text-anchor="middle">${d.day}</text>
        `;
      }

      if (d.total > 0) {
        const barH = (d.total / yMax) * chartH;
        const barY = padding.top + chartH - barH;
        const tooltip = `Ngày ${d.day}/${String(month).padStart(2, '0')}/${year}: ${d.total} lượt (${d.practice} thực hành, ${d.guide} hướng dẫn)${d.passed > 0 ? ` • ${d.passed} bài đạt` : ''}`;
        
        barsSvg += `
          <g class="chart-freq-group" tabindex="0">
            <title>${escapeHTML(tooltip)}</title>
            <rect x="${x - barW / 2}" y="${barY}" width="${barW}" height="${barH}" rx="3" fill="url(#freqBarGrad)" class="chart-freq-bar" />
            <circle cx="${x}" cy="${barY}" r="3.5" fill="#4f46e5" stroke="#ffffff" stroke-width="1.5" />
            <text x="${x}" y="${barY - 6}" font-size="10.5" font-weight="700" fill="#4338ca" text-anchor="middle">${d.total}</text>
          </g>
        `;
      } else {
        barsSvg += `
          <circle cx="${x}" cy="${padding.top + chartH}" r="1.5" fill="#cbd5e1" opacity="0.6">
            <title>Ngày ${d.day}/${String(month).padStart(2, '0')}: 0 lượt</title>
          </circle>
        `;
      }
    });

    const summaryHtml = `
      <div style="display: flex; justify-content: space-between; align-items: center; margin-top: 10px; flex-wrap: wrap; gap: 8px;">
        <div class="chart-summary-chip">
          <span>📊 Tổng tháng ${String(month).padStart(2, '0')}/${year}:</span>
          <strong>${totalMonthSessions} lượt thực hiện</strong>
          <span>(${totalMonthPractice} thực hành, ${totalMonthGuide} hướng dẫn • ${totalMonthPassed} bài đạt)</span>
        </div>
        <div style="font-size: 11.5px; color: var(--text-muted);">
          Trục ngang: ngày 1 đến ${totalDays} trong tháng ${String(month).padStart(2, '0')}/${year}
        </div>
      </div>
    `;

    elTrendChartContainer.innerHTML = `
      <svg class="chart-svg" viewBox="0 0 ${width} ${height}" preserveAspectRatio="none">
        <defs>
          <linearGradient id="freqBarGrad" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stop-color="#4f46e5" />
            <stop offset="100%" stop-color="#818cf8" stop-opacity="0.8" />
          </linearGradient>
        </defs>
        ${gridSvg}
        ${yTitleSvg}
        ${barsSvg}
        ${xLabelsSvg}
      </svg>
      ${summaryHtml}
    `;
  }

  function renderTrendChart(trend) {
    if (!elTrendChartContainer) return;
    elTrendChartContainer.innerHTML = '';

    if (!trend || trend.length === 0) {
      elTrendChartContainer.innerHTML = `
        <div class="empty-state-box" style="padding: 20px;">
          <div class="empty-state-icon">📈</div>
          <div class="empty-state-text">Chưa có đủ dữ liệu hoạt động thực hành để vẽ biểu đồ.</div>
        </div>
      `;
      return;
    }

    // Take last 14 days
    const recentTrend = trend.slice(-14);
    const width = elTrendChartContainer.clientWidth || 680;
    const height = 220;
    const padding = { top: 20, right: 30, bottom: 35, left: 40 };
    const chartW = width - padding.left - padding.right;
    const chartH = height - padding.top - padding.bottom;

    // X scale
    const stepX = recentTrend.length > 1 ? chartW / (recentTrend.length - 1) : chartW / 2;

    // Tỷ lệ phiên Đạt theo ngày; chỉ tính các phiên thực hành đã có kết quả.
    const resultPoints = recentTrend.map((d, i) => {
      const x = padding.left + (recentTrend.length > 1 ? i * stepX : chartW / 2);
      const passRate = d.pass_rate_percent == null ? 0 : Number(d.pass_rate_percent);
      const y = padding.top + chartH - (passRate / 100) * chartH;
      return {
        x,
        y,
        date: d.date,
        passRate,
        passed: Number(d.passed_count) || 0,
        graded: Number(d.graded_count) || 0,
        practice: Number(d.practice_count) || 0,
        guide: Number(d.guide_count) || 0
      };
    });

    let pathD = '';
    let areaD = '';

    if (resultPoints.length === 1) {
      const p = resultPoints[0];
      pathD = `M ${padding.left} ${p.y} L ${padding.left + chartW} ${p.y}`;
      areaD = `M ${padding.left} ${p.y} L ${padding.left + chartW} ${p.y} L ${padding.left + chartW} ${padding.top + chartH} L ${padding.left} ${padding.top + chartH} Z`;
    } else {
      pathD = `M ${resultPoints[0].x} ${resultPoints[0].y}`;
      for (let i = 1; i < resultPoints.length; i++) {
        const prev = resultPoints[i - 1];
        const curr = resultPoints[i];
        const cpX1 = prev.x + (curr.x - prev.x) / 2;
        const cpY1 = prev.y;
        const cpX2 = prev.x + (curr.x - prev.x) / 2;
        const cpY2 = curr.y;
        pathD += ` C ${cpX1} ${cpY1}, ${cpX2} ${cpY2}, ${curr.x} ${curr.y}`;
      }
      areaD = `${pathD} L ${resultPoints[resultPoints.length - 1].x} ${padding.top + chartH} L ${resultPoints[0].x} ${padding.top + chartH} Z`;
    }

    // Grid lines (0, 25, 50, 75, 100)
    let gridSvg = '';
    [0, 25, 50, 75, 100].forEach(val => {
      const y = padding.top + chartH - (val / 100) * chartH;
      gridSvg += `
        <line x1="${padding.left}" y1="${y}" x2="${width - padding.right}" y2="${y}" stroke="#e2e8f0" stroke-dasharray="3,3" stroke-width="1" />
        <text x="${padding.left - 8}" y="${y + 4}" font-size="11" font-weight="600" fill="#94a3b8" text-anchor="end">${val}</text>
      `;
    });

    // X Labels
    let xLabelsSvg = '';
    resultPoints.forEach((p, idx) => {
      // Show every 2nd or 3rd label if many items
      const showLabel = recentTrend.length <= 7 || idx % Math.ceil(recentTrend.length / 7) === 0 || idx === recentTrend.length - 1;
      if (showLabel) {
        const parts = p.date.split('-');
        const dateStr = parts.length === 3 ? `${parts[2]}/${parts[1]}` : p.date;
        xLabelsSvg += `
          <text x="${p.x}" y="${height - 10}" font-size="11" font-weight="500" fill="#64748b" text-anchor="middle">${dateStr}</text>
        `;
      }
    });

    // Circles / Tooltip triggers
    let pointsSvg = '';
    resultPoints.forEach(p => {
      const tooltipText = `${p.date}: ${p.passed}/${p.graded} phiên Đạt (${p.passRate}%; ${p.practice} thực hành, ${p.guide} hướng dẫn)`;
      pointsSvg += `
        <circle cx="${p.x}" cy="${p.y}" r="4.5" fill="#4f46e5" stroke="#ffffff" stroke-width="2.5" class="chart-dot">
          <title>${escapeHTML(tooltipText)}</title>
        </circle>
      `;
    });

    elTrendChartContainer.innerHTML = `
      <svg class="chart-svg" viewBox="0 0 ${width} ${height}" preserveAspectRatio="none">
        <defs>
          <linearGradient id="resultAreaGradient" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stop-color="#4f46e5" stop-opacity="0.25"/>
            <stop offset="100%" stop-color="#4f46e5" stop-opacity="0.0"/>
          </linearGradient>
        </defs>
        ${gridSvg}
        <path d="${areaD}" fill="url(#resultAreaGradient)" />
        <path d="${pathD}" fill="none" stroke="#4f46e5" stroke-width="3" stroke-linecap="round" />
        ${pointsSvg}
        ${xLabelsSvg}
      </svg>
    `;
  }

  function renderDeviceProgress(devices) {
    if (!elDeviceGrid) return;
    elDeviceGrid.innerHTML = '';

    if (!devices || devices.length === 0) {
      elDeviceGrid.innerHTML = `
        <div class="empty-state-box" style="grid-column: 1 / -1;">
          <div class="empty-state-icon">📱</div>
          <div class="empty-state-text">Chưa có danh sách thiết bị nào được giao cho lớp của bạn.</div>
        </div>
      `;
      return;
    }

    devices.forEach(dev => {
      const card = document.createElement('div');
      card.className = 'device-card';

      const pct = dev.progress_percent || 0;
      let badgeClass = 'unstarted';
      let badgeLabel = 'Chưa bắt đầu';
      if (pct === 100) {
        badgeClass = 'complete';
        badgeLabel = '✓ Đã hoàn thành';
      } else if (pct > 0 || dev.in_progress_labs > 0) {
        badgeClass = 'in-progress';
        badgeLabel = `${dev.passed_labs}/${dev.total_labs} Bài`;
      }

      const labsHtml = (dev.labs || []).map(lab => {
        let iconClass = 'assigned';
        let iconSymbol = '○';
        let statusTitle = 'Chưa làm';
        if (lab.status === 'passed') {
          iconClass = 'passed';
          iconSymbol = '✓';
          statusTitle = 'Đã đạt';
        } else if (lab.status === 'in_progress') {
          iconClass = 'in_progress';
          iconSymbol = '⏳';
          statusTitle = 'Chưa đạt';
        }

        const attemptInfo = lab.first_pass_attempt_no
          ? `(Đạt lần ${lab.first_pass_attempt_no})`
          : '';

        return `
          <div class="lab-item-row">
            <div class="lab-left-info" title="${escapeHTML(lab.lab_name)}">
              <div class="lab-status-icon ${iconClass}" title="${statusTitle}">
                ${iconSymbol}
              </div>
              <span class="lab-title-text">${escapeHTML(lab.lab_name)}</span>
              ${attemptInfo ? `<span class="lab-attempt-tag">${attemptInfo}</span>` : ''}
            </div>
            <a class="btn-start-lab" href="/portal.html?device=${encodeURIComponent(dev.device_id)}&lab=${encodeURIComponent(lab.lab_id)}">
              Làm bài →
            </a>
          </div>
        `;
      }).join('');

      card.innerHTML = `
        <div class="device-card-header">
          <div class="device-title-wrap">
            <div class="device-icon-box">📶</div>
            <div>
              <div class="device-name">${escapeHTML(dev.device_name)}</div>
              <div style="font-size: 11.5px; color: var(--text-muted);">${escapeHTML(dev.model || dev.device_id)}</div>
            </div>
          </div>
          <span class="device-progress-badge ${badgeClass}">${badgeLabel}</span>
        </div>
        
        <div class="metric-progress-wrap" style="height: 6px;">
          <div class="metric-progress-bar ${pct === 100 ? 'emerald' : 'indigo'}" style="width: ${pct}%;"></div>
        </div>

        <div class="lab-checklist">
          ${labsHtml}
        </div>
      `;

      elDeviceGrid.appendChild(card);
    });
  }

  function populateDeviceFilter(devices) {
    if (!elFilterDevice) return;
    elFilterDevice.innerHTML = '<option value="all">Tất cả thiết bị</option>';
    devices.forEach(dev => {
      const opt = document.createElement('option');
      opt.value = dev.device_id;
      opt.textContent = dev.device_name;
      elFilterDevice.appendChild(opt);
    });
  }

  function applySessionFilters() {
    if (!_dashboardData) return;
    const allSessions = (_dashboardData.sessions || []).filter(s =>
      s.status === 'completed' || s.status === 'failed'
    );

    const search = (elFilterSearch ? elFilterSearch.value.trim().toLowerCase() : '');
    const mode = (elFilterMode ? elFilterMode.value : 'all');
    const result = (elFilterResult ? elFilterResult.value : 'all');
    const deviceId = (elFilterDevice ? elFilterDevice.value : 'all');

    _filteredSessions = allSessions.filter(s => {
      if (mode !== 'all') {
        const sMode = s.mode || (s.session_type === 'guide' ? 'Hướng dẫn' : 'Thực hành');
        if (mode === 'Thực hành' && sMode !== 'Thực hành') return false;
        if (mode === 'Hướng dẫn' && sMode !== 'Hướng dẫn') return false;
      }

      if (result !== 'all') {
        if (result === 'passed' && s.is_passed !== true) return false;
        if (result === 'failed' && s.status !== 'failed') return false;
        if (result === 'ungraded' && !((s.mode !== 'Hướng dẫn' && s.session_type !== 'guide') && s.status === 'completed' && s.is_passed == null)) return false;
        if (result === 'not_graded' && !(s.mode === 'Hướng dẫn' || s.session_type === 'guide')) return false;
      }

      if (deviceId !== 'all') {
        if (s.device_id !== deviceId) return false;
      }

      if (search) {
        const matchLab = (s.lab_name || '').toLowerCase().includes(search);
        const matchDev = (s.device_name || '').toLowerCase().includes(search);
        const matchId = String(s.id).includes(search);
        if (!matchLab && !matchDev && !matchId) return false;
      }

      return true;
    });

    _currentPage = 1;
    renderSessionsTable();
  }

  function renderSessionsTable() {
    if (!elSessionsBody) return;
    elSessionsBody.innerHTML = '';

    if (elSessionsCount) {
      elSessionsCount.textContent = `(${_filteredSessions.length} phiên)`;
    }

    if (_filteredSessions.length === 0) {
      elSessionsBody.innerHTML = `
        <tr>
          <td colspan="8" style="text-align: center; padding: 36px 16px; color: var(--text-muted);">
            <div style="font-size: 24px; margin-bottom: 8px;">🔍</div>
            <div>Không tìm thấy phiên thực hành nào phù hợp với bộ lọc.</div>
          </td>
        </tr>
      `;
      updatePaginationControls(0);
      return;
    }

    const totalPages = Math.ceil(_filteredSessions.length / PAGE_SIZE) || 1;
    const startIndex = (_currentPage - 1) * PAGE_SIZE;
    const pageItems = _filteredSessions.slice(startIndex, startIndex + PAGE_SIZE);

    pageItems.forEach(s => {
      const tr = document.createElement('tr');

      // Date format
      const dateStr = formatDateTime(s.finished_at || s.started_at);

      // Mode Badge
      const isGuide = s.mode === 'Hướng dẫn' || s.session_type === 'guide';
      const modeBadge = isGuide
        ? '<span class="badge-pill mode-guide">💡 Hướng dẫn</span>'
        : '<span class="badge-pill mode-practice">⚡ Thực hành</span>';

      // Result Badge
      let resultBadge = isGuide
        ? '<span class="badge-pill result-ungraded">Không đánh giá</span>'
        : '<span class="badge-pill result-ungraded">Chưa có kết quả</span>';
      if (s.is_passed === true) {
        resultBadge = '<span class="badge-pill result-passed">Đạt</span>';
      } else if (s.is_passed === false) {
        resultBadge = '<span class="badge-pill result-failed">Chưa đạt</span>';
      }

      // Duration
      const durStr = s.duration_sec ? formatSeconds(s.duration_sec) : '-';

      // Attempt
      const attemptStr = s.practice_attempt_no ? `#${s.practice_attempt_no}` : (isGuide ? 'Hướng dẫn' : '-');

      tr.innerHTML = `
        <td style="color: var(--text-secondary); font-size: 12.5px; white-space: nowrap;">${dateStr}</td>
        <td><strong>${escapeHTML(s.device_name || s.device_id || '—')}</strong></td>
        <td>${escapeHTML(s.lab_name || s.lab_id || '—')}</td>
        <td>${modeBadge}</td>
        <td>${resultBadge}</td>
        <td style="font-family: monospace; font-size: 12.5px;">${durStr}</td>
        <td style="color: var(--text-muted); text-align: center;">${attemptStr}</td>
      `;

      elSessionsBody.appendChild(tr);
    });

    updatePaginationControls(totalPages);
  }

  function updatePaginationControls(totalPages) {
    if (elPageInfo) {
      elPageInfo.textContent = totalPages > 0 ? `Trang ${_currentPage} / ${totalPages}` : 'Trang 0 / 0';
    }
    if (elBtnPrevPage) {
      elBtnPrevPage.disabled = _currentPage <= 1;
    }
    if (elBtnNextPage) {
      elBtnNextPage.disabled = _currentPage >= totalPages || totalPages === 0;
    }
  }

  function showLoading(show) {
    if (elLoading) elLoading.style.display = show ? 'flex' : 'none';
    if (elContent) elContent.style.display = show ? 'none' : 'flex';
    if (elError) elError.style.display = 'none';
  }

  function showError(msg) {
    if (elLoading) elLoading.style.display = 'none';
    if (elContent) elContent.style.display = 'none';
    if (elError) {
      elError.style.display = 'flex';
      if (elErrorMessage) elErrorMessage.textContent = msg;
    }
  }

  function handleLogout() {
    fetch('/api/index.php/auth/logout', {
      method: 'POST',
      credentials: 'include'
    }).finally(() => {
      window.location.href = '/login/';
    });
  }

  // ── Helper Utilities ───────────────────────────────────────────────

  function formatDateTime(isoStr) {
    if (!isoStr) return '—';
    try {
      const d = new Date(isoStr);
      if (isNaN(d.getTime())) return isoStr;
      const hh = String(d.getHours()).padStart(2, '0');
      const mm = String(d.getMinutes()).padStart(2, '0');
      const dd = String(d.getDate()).padStart(2, '0');
      const MM = String(d.getMonth() + 1).padStart(2, '0');
      const yyyy = d.getFullYear();
      return `${hh}:${mm} - ${dd}/${MM}/${yyyy}`;
    } catch {
      return isoStr;
    }
  }

  function formatSeconds(sec) {
    if (!sec || sec <= 0) return '00:00';
    const m = Math.floor(sec / 60);
    const s = sec % 60;
    const h = Math.floor(m / 60);
    if (h > 0) {
      return `${h}h ${String(m % 60).padStart(2, '0')}m`;
    }
    return `${String(m).padStart(2, '0')}m ${String(s).padStart(2, '0')}s`;
  }

  function formatDurationHuman(sec) {
    if (!sec || sec <= 0) return { primary: '0m', secondary: '0 phút thực hành' };
    const m = Math.floor(sec / 60);
    const h = Math.floor(m / 60);
    const remM = m % 60;
    if (h > 0) {
      return { primary: `${h}h ${remM}m`, secondary: `${m} phút tổng cộng` };
    }
    return { primary: `${m}m`, secondary: `${sec} giây thực hành` };
  }

  function escapeHTML(str) {
    if (str == null) return '';
    return String(str)
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&#039;');
  }

  function debounce(fn, delay) {
    let timer = null;
    return function (...args) {
      clearTimeout(timer);
      timer = setTimeout(() => fn.apply(this, args), delay);
    };
  }

  // Execute on DOM ready
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }

})();
