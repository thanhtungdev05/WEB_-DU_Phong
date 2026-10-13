/**
 * FTC Virtual Devices — System Resource Usage Monitor Widget
 * Giám sát trực quan dung lượng Neon DB và trạng thái Web Server Render.
 */
(function () {
    'use strict';

    async function fetchSystemUsageData() {
        const controller = new AbortController();
        const timeoutId = window.setTimeout(() => controller.abort(), 15_000);
        try {
            const response = await fetch('/api/system/usage', {
                headers: { 'Accept': 'application/json' },
                cache: 'no-store',
                credentials: 'same-origin',
                signal: controller.signal,
            });
            if (!response.ok) {
                console.warn(`System usage request failed with HTTP ${response.status}.`);
                return null;
            }
            const result = await response.json();
            return result?.data || null;
        } catch (e) {
            console.debug('System usage fetch failed:', e);
            return null;
        } finally {
            window.clearTimeout(timeoutId);
        }
    }

    function formatBytes(bytes) {
        const value = Number(bytes) || 0;
        if (value >= 1024 ** 3) return `${(value / 1024 ** 3).toFixed(2)} GB`;
        if (value >= 1024 ** 2) return `${(value / 1024 ** 2).toFixed(0)} MB`;
        if (value >= 1024) return `${(value / 1024).toFixed(0)} KB`;
        return `${Math.round(value)} B`;
    }

    function system_usage_status_js(pct) {
        if (pct >= 92) return 'CRITICAL';
        if (pct >= 80) return 'WARNING';
        return 'OK';
    }

    function updateProgress(element, percent, status = 'OK') {
        if (!element) return;
        const normalized = Number.isFinite(Number(percent)) ? Number(percent) : 0;
        element.style.width = normalized > 0 ? `${Math.min(100, Math.max(2, normalized))}%` : '0';
        element.className = 'system-progress-fill' +
            (status === 'CRITICAL' ? ' is-critical' : status === 'WARNING' ? ' is-warning' : '');
    }

    function updateSystemUsageUI(data) {
        if (!data || !data.storage) return;

        const storage = data.storage;
        const isFallback = data.activeTier === 'fallback';
        const usagePct = storage.usagePercent == null ? null : Number(storage.usagePercent);
        const sizeMb = storage.databaseSizeMb || 0;
        const parsedLimitMb = Number(storage.neonLimitMb);
        const limitMb = Number.isFinite(parsedLimitMb) && parsedLimitMb > 0 ? parsedLimitMb : null;
        const status = storage.status || 'OK';
        const neonActualMb = storage.neonActualMb != null ? Number(storage.neonActualMb) : null;

        // Summary Trigger
        const dot = document.getElementById('systemStatusDot');
        const label = document.getElementById('systemUsageTier');
        const tierBadge = document.getElementById('systemTierBadge');
        const cutoverMode = document.getElementById('systemCutoverMode');
        const renderStatus = document.getElementById('systemRenderStatus');
        const renderDetail = document.getElementById('systemRenderDetail');

        // Ưu tiên hiển thị số thực từ Neon Console nếu có
        const displayMb = neonActualMb != null ? neonActualMb : sizeMb;
        const displayPct = neonActualMb != null && limitMb != null
            ? Math.round((neonActualMb / limitMb) * 1000) / 10
            : usagePct;
        const displayStatus = displayPct == null
            ? 'UNKNOWN'
            : (neonActualMb != null ? system_usage_status_js(displayPct) : status);

        if (dot) {
            dot.className = 'system-status-indicator' +
                (displayStatus === 'CRITICAL' ? ' is-critical' : displayStatus === 'WARNING' ? ' is-warning' : '');
        }

        if (label) {
            const tierName = isFallback ? 'Dự phòng' : 'Chính';
            label.textContent = displayPct == null
                ? `DB ${tierName}: ${displayMb} MB`
                : `DB ${tierName}: ${displayMb} MB (${displayPct}%)`;
        }

        if (tierBadge) {
            tierBadge.textContent = isFallback ? 'Fallback đang hoạt động' : 'Primary đang hoạt động';
            tierBadge.className = 'system-tier-badge' + (isFallback ? ' is-fallback' : '');
        }

        if (cutoverMode) {
            cutoverMode.textContent = data.standbyConfigured
                ? 'Standby đã cấu hình • Chuyển đổi có kiểm soát'
                : 'Chưa cấu hình standby';
        }

        if (renderStatus) {
            renderStatus.textContent = data.isRender ? 'Đang phục vụ' : 'Môi trường cục bộ';
        }

        if (renderDetail) {
            renderDetail.textContent = data.isRender
                ? (data.renderSelfPingEnabled
                    ? 'Self-health ping đang bật • Không phải cam kết uptime'
                    : 'Render health hoạt động • Self-health ping đang tắt')
                : 'Không chạy trên Render';
        }

        // Popover detail
        const storageText = document.getElementById('systemStorageText');
        const storageProgress = document.getElementById('systemStorageProgress');
        const storageStatusText = document.getElementById('systemStorageStatusText');
        const sessionCount = document.getElementById('systemSessionCount');
        const expiredSessionCount = document.getElementById('systemExpiredSessionCount');
        const storageMeasurement = document.getElementById('systemStorageMeasurement');
        const dbConnections = document.getElementById('systemDbConnections');
        const dbConnectionsProgress = document.getElementById('systemDbConnectionsProgress');
        const renderBandwidth = document.getElementById('systemRenderBandwidth');
        const renderBandwidthProgress = document.getElementById('systemRenderBandwidthProgress');
        const renderBandwidthPeriod = document.getElementById('systemRenderBandwidthPeriod');
        const renderCpu = document.getElementById('systemRenderCpu');
        const renderMemory = document.getElementById('systemRenderMemory');
        const renderBillingHint = document.getElementById('systemRenderBillingHint');
        const computeText = document.getElementById('systemComputeText');
        const computeProgress = document.getElementById('systemComputeProgress');
        const computeNote = document.getElementById('systemComputeNote');

        // Storage
        if (storageText) {
            if (limitMb != null && displayPct != null) {
                storageText.textContent = `${displayMb} MB / ${limitMb} MB (${displayPct}%)`;
            } else {
                storageText.textContent = `${displayMb} MB • quota chưa được API công bố`;
            }
        }

        updateProgress(storageProgress, displayPct, displayStatus);

        if (storageMeasurement) {
            if (storage.limitSource === 'neon_project_api') {
                storageMeasurement.textContent = `Dung lượng DB từ PostgreSQL • quota tự động từ Neon Project API`;
            } else if (storage.limitSource === 'not_configured') {
                storageMeasurement.textContent = `Dung lượng DB từ pg_database_size • chưa cấu hình NEON_API_KEY`;
            } else if (storage.limitSource === 'api_error') {
                storageMeasurement.textContent = `Dung lượng DB từ pg_database_size • chưa lấy được quota từ Neon API`;
            } else {
                storageMeasurement.textContent = `Dung lượng DB từ pg_database_size • Neon API không công bố quota cho project`;
            }
        }

        if (storageStatusText) {
            if (displayStatus === 'CRITICAL') {
                storageStatusText.textContent = 'Trạng thái: Nguy hiểm (> 92%) - Sắp chạm giới hạn!';
                storageStatusText.style.color = '#ef4444';
            } else if (displayStatus === 'WARNING') {
                storageStatusText.textContent = 'Trạng thái: Cảnh báo (> 80%) - Cần dọn dẹp';
                storageStatusText.style.color = '#f59e0b';
            } else if (displayStatus === 'OK') {
                storageStatusText.textContent = 'Trạng thái: An toàn (< 80%)';
                storageStatusText.style.color = '';
            } else {
                storageStatusText.textContent = 'Đã lấy dung lượng; chưa thể tính tỷ lệ vì API không công bố quota';
                storageStatusText.style.color = '';
            }
        }

        if (sessionCount && data.sessions) {
            sessionCount.textContent = `PHP: ${data.sessions.phpSessions || 0} • Django: ${data.sessions.djangoSessions || 0}`;
        }
        if (expiredSessionCount && data.sessions) {
            const expired = Number(data.sessions.php?.expired || 0) + Number(data.sessions.django?.expired || 0);
            expiredSessionCount.textContent = `Hết hạn chờ dọn: ${expired}`;
        }

        const connection = data.database?.connections;
        if (dbConnections) {
            dbConnections.textContent = connection?.limit
                ? `${connection.current || 0} / ${connection.limit} (${connection.usagePercent || 0}%)`
                : 'Không lấy được giới hạn';
        }
        updateProgress(dbConnectionsProgress, connection?.usagePercent, connection?.status);

        const dbTransferRow = document.getElementById('systemDbTransferRow');
        const dbTransferText = document.getElementById('systemDbTransferText');
        const netTransfer = data.database?.networkTransfer;
        if (dbTransferRow && dbTransferText) {
            if (netTransfer?.available && netTransfer.bytes > 0) {
                dbTransferText.textContent = formatBytes(netTransfer.bytes);
                dbTransferRow.style.display = 'flex';
            } else {
                dbTransferRow.style.display = 'none';
            }
        }

        // Render bandwidth + period
        const render = data.render || {};
        const bandwidth = render.bandwidth || {};
        if (renderBandwidth) {
            if (!render.configured) {
                renderBandwidth.textContent = 'Chưa cấu hình Render API';
            } else if (!bandwidth.available) {
                const errorCodes = Object.values(render.errors || {}).filter(Boolean);
                renderBandwidth.textContent = errorCodes.length
                    ? `Không lấy được (${[...new Set(errorCodes)].join(', ')})`
                    : 'Tạm thời không lấy được';
            } else {
                renderBandwidth.textContent = bandwidth.limitGb != null
                    ? `${bandwidth.usedGb || 0} / ${bandwidth.limitGb} GB (${bandwidth.usagePercent || 0}%)`
                    : `${bandwidth.usedGb || 0} GB đã dùng • quota xem Billing`;
            }
        }
        updateProgress(renderBandwidthProgress, bandwidth.usagePercent, bandwidth.status);

        if (renderBandwidthPeriod) {
            if (bandwidth.periodStart) {
                const from = new Date(bandwidth.periodStart);
                const to = new Date(from);
                to.setMonth(to.getMonth() + 1);
                to.setDate(0); // last day of month
                const fmt = (d) => `${String(d.getDate()).padStart(2,'0')}/${String(d.getMonth()+1).padStart(2,'0')}`;
                renderBandwidthPeriod.textContent = `Chu kỳ: ${fmt(from)} – ${fmt(to)}/${to.getFullYear()}`;
                renderBandwidthPeriod.hidden = false;
            } else {
                renderBandwidthPeriod.hidden = true;
            }
        }

        if (renderCpu) {
            renderCpu.textContent = render.cpu?.available
                ? `${render.cpu.usagePercent || 0}% / ${render.cpu.peakPercent || 0}%`
                : '-- / --';
        }
        if (renderMemory) {
            renderMemory.textContent = render.memory?.available
                ? `${formatBytes(render.memory.currentBytes)} / ${formatBytes(render.memory.peakLastHourBytes)} (${render.memory.usagePercent || 0}%)`
                : '-- / --';
        }
        if (renderBillingHint) {
            renderBillingHint.textContent = render.configured
                ? 'Render Metrics API không công bố quota workspace; giờ instance, build và quota xem Billing'
                : 'Thêm RENDER_API_KEY để lấy bandwidth, CPU và RAM; giờ/build vẫn xem Billing';
        }

        // Neon Compute hours
        const computeHours = data.computeHours || {};
        if (computeText) {
            if (computeHours.used != null) {
                if (computeHours.limit != null && Number(computeHours.limit) > 0) {
                    const pct = Math.round((computeHours.used / computeHours.limit) * 1000) / 10;
                    computeText.textContent = `${computeHours.used} / ${computeHours.limit} h (${pct}%) • API`;
                    const cStatus = pct >= 92 ? 'CRITICAL' : pct >= 80 ? 'WARNING' : 'OK';
                    updateProgress(computeProgress, pct, cStatus);
                } else {
                    computeText.textContent = `${computeHours.used} h đã dùng • quota chưa được API công bố`;
                    updateProgress(computeProgress, 0, 'UNKNOWN');
                }
            } else if (!computeHours.configured) {
                computeText.textContent = 'Chưa cấu hình NEON_API_KEY';
            } else {
                computeText.textContent = 'Chưa lấy được usage từ Neon API';
            }
        }
        if (computeNote) {
            computeNote.textContent = computeHours.note || 'Reset đầu tháng theo chu kỳ Neon.';
        }
    }

    function setSystemUsageUnavailable() {
        const label = document.getElementById('systemUsageTier');
        const tierBadge = document.getElementById('systemTierBadge');
        const statusText = document.getElementById('systemStorageStatusText');
        const progress = document.getElementById('systemStorageProgress');
        if (label) label.textContent = 'DB: Không lấy được trạng thái';
        if (tierBadge) {
            tierBadge.textContent = 'Không xác định';
            tierBadge.className = 'system-tier-badge';
        }
        if (statusText) {
            statusText.textContent = 'Không thể xác minh dung lượng database';
            statusText.style.color = '#ef4444';
        }
        if (progress) progress.style.width = '0';
    }

    function initSystemUsageMonitor() {
        const trigger = document.getElementById('systemUsageTrigger');
        const popover = document.getElementById('systemUsagePopover');
        const refreshBtn = document.getElementById('systemRefreshUsageBtn');
        const cleanupBtn = document.getElementById('systemCleanupBtn');

        if (!trigger || !popover) return;

        let dataLoaded = false;
        let autoRefreshTimer = null;

        async function loadData(force = false) {
            const data = await fetchSystemUsageData();
            if (data) {
                updateSystemUsageUI(data);
                dataLoaded = true;
            } else if (!dataLoaded || force) {
                setSystemUsageUnavailable();
            }
        }

        function startAutoRefresh() {
            if (autoRefreshTimer) return;
            autoRefreshTimer = setInterval(() => {
                if (document.visibilityState === 'visible' && !popover.hasAttribute('hidden')) {
                    loadData();
                }
            }, 5 * 60 * 1000);
        }

        // Toggle popover — lazy-load dữ liệu lần đầu khi mở
        // Populate the compact header status immediately. Opening the popover
        // reuses this result instead of leaving the header in a checking state.
        void loadData();

        trigger.addEventListener('click', (e) => {
            e.stopPropagation();
            const isHidden = popover.hasAttribute('hidden');
            if (isHidden) {
                popover.removeAttribute('hidden');
                trigger.setAttribute('aria-expanded', 'true');
                if (!dataLoaded) {
                    loadData();
                }
                startAutoRefresh();
            } else {
                popover.setAttribute('hidden', '');
                trigger.setAttribute('aria-expanded', 'false');
            }
        });

        // Close popover when clicking outside
        document.addEventListener('click', (e) => {
            if (!popover.contains(e.target) && !trigger.contains(e.target)) {
                popover.setAttribute('hidden', '');
                trigger.setAttribute('aria-expanded', 'false');
            }
        });

        // Close on Escape key
        document.addEventListener('keydown', (e) => {
            if (e.key === 'Escape' && !popover.hasAttribute('hidden')) {
                popover.setAttribute('hidden', '');
                trigger.setAttribute('aria-expanded', 'false');
            }
        });

        // Refresh button
        refreshBtn?.addEventListener('click', async () => {
            refreshBtn.disabled = true;
            refreshBtn.textContent = 'Đang tải...';
            await loadData(true);
            if (typeof window.showToast === 'function') {
                window.showToast('Thông số tài nguyên đã được cập nhật.', 'success');
            }
            refreshBtn.disabled = false;
            refreshBtn.textContent = 'Làm mới';
        });

        // Cleanup button
        cleanupBtn?.addEventListener('click', async () => {
            if (!confirm('Bạn có chắc chắn muốn dọn dẹp các session và log hết hạn ngay bây giờ?')) return;
            cleanupBtn.disabled = true;
            cleanupBtn.textContent = 'Đang dọn...';
            try {
                const resp = await fetch('/api/system/cleanup', {
                    method: 'POST',
                    headers: { 'Accept': 'application/json' },
                });
                const result = await resp.json();
                if (resp.ok && result?.data?.success) {
                    if (typeof window.showToast === 'function') {
                        window.showToast('Đã dọn dẹp thành công các session hết hạn!', 'success');
                    }
                    await loadData(true);
                } else {
                    if (typeof window.showToast === 'function') {
                        window.showToast('Không thể thực hiện dọn dẹp lúc này.', 'error');
                    }
                }
            } catch (e) {
                if (typeof window.showToast === 'function') {
                    window.showToast('Lỗi khi gửi yêu cầu dọn dẹp.', 'error');
                }
            } finally {
                cleanupBtn.disabled = false;
                cleanupBtn.textContent = 'Dọn session';
            }
        });
    }

    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', initSystemUsageMonitor);
    } else {
        initSystemUsageMonitor();
    }
})();
