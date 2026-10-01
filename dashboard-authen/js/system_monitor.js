/**
 * FTC Virtual Devices — System Resource Usage Monitor Widget
 * Giám sát trực quan dung lượng Neon DB và trạng thái Web Server Render.
 */
(function () {
    'use strict';

    async function fetchSystemUsageData() {
        try {
            const response = await fetch('/api/system/usage', {
                headers: { 'Accept': 'application/json' },
                cache: 'no-store',
            });
            if (!response.ok) return null;
            const result = await response.json();
            return result?.data || null;
        } catch (e) {
            console.debug('System usage fetch failed:', e);
            return null;
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
        const usagePct = storage.usagePercent || 0;
        const sizeMb = storage.databaseSizeMb || 0;
        const limitMb = storage.neonLimitMb || 512;
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
        const displayPct = neonActualMb != null
            ? Math.round((neonActualMb / limitMb) * 1000) / 10
            : usagePct;
        const displayStatus = neonActualMb != null ? system_usage_status_js(displayPct) : status;

        if (dot) {
            dot.className = 'system-status-indicator' +
                (displayStatus === 'CRITICAL' ? ' is-critical' : displayStatus === 'WARNING' ? ' is-warning' : '');
        }

        if (label) {
            const tierName = isFallback ? 'Dự phòng' : 'Chính';
            label.textContent = `DB ${tierName}: ${displayMb} MB (${displayPct}%)`;
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
            if (neonActualMb != null) {
                storageText.textContent = `${neonActualMb} MB / ${limitMb} MB (${displayPct}%)`;
            } else {
                storageText.textContent = `~${sizeMb} MB / ${limitMb} MB (${displayPct}%)`;
            }
        }

        updateProgress(storageProgress, displayPct, displayStatus);

        if (storageMeasurement) {
            if (storage.source === 'neon_management_api') {
                storageMeasurement.textContent = `Dung lượng thực tế tự động từ Neon API (Synthetic: ${neonActualMb} MB; ước tính PG: ${sizeMb} MB)`;
            } else if (storage.source === 'manual_neon_console') {
                storageMeasurement.textContent = `Số đo từ Neon Console (nhập tay: ${neonActualMb} MB; ước tính PG: ${sizeMb} MB)`;
            } else if (neonActualMb != null) {
                storageMeasurement.textContent = `Số đo thực tế: ${neonActualMb} MB; ước tính PG: ${sizeMb} MB`;
            } else {
                storageMeasurement.textContent = `Ước tính theo pg_database_size (~${sizeMb} MB) — cấu hình NEON_API_KEY để tự động đo`;
            }
        }

        if (storageStatusText) {
            if (displayStatus === 'CRITICAL') {
                storageStatusText.textContent = 'Trạng thái: Nguy hiểm (> 92%) - Sắp chạm giới hạn!';
                storageStatusText.style.color = '#ef4444';
            } else if (displayStatus === 'WARNING') {
                storageStatusText.textContent = 'Trạng thái: Cảnh báo (> 80%) - Cần dọn dẹp';
                storageStatusText.style.color = '#f59e0b';
            } else {
                storageStatusText.textContent = 'Trạng thái: An toàn (< 80%)';
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
                renderBandwidth.textContent = 'Tạm thời không lấy được';
            } else {
                renderBandwidth.textContent = `${bandwidth.usedGb || 0} / ${bandwidth.limitGb || '?'} GB (${bandwidth.usagePercent || 0}%)`;
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
                ? 'Giờ instance, build minutes và tổng quota workspace: xem Billing Render'
                : 'Thêm RENDER_API_KEY để lấy bandwidth, CPU và RAM; giờ/build vẫn xem Billing';
        }

        // Neon Compute hours
        const computeHours = data.computeHours || {};
        if (computeText) {
            if (computeHours.used != null) {
                const pct = Math.round((computeHours.used / computeHours.limit) * 1000) / 10;
                const srcBadge = computeHours.source === 'neon_management_api' ? ' (Tự động API)' : '';
                computeText.textContent = `${computeHours.used} / ${computeHours.limit} h (${pct}%)${srcBadge}`;
                const cStatus = pct >= 92 ? 'CRITICAL' : pct >= 80 ? 'WARNING' : 'OK';
                updateProgress(computeProgress, pct, cStatus);
            } else if (!computeHours.configured || !computeHours.limit) {
                computeText.textContent = 'Chưa cấu hình (thêm NEON_API_KEY hoặc NEON_COMPUTE_HOURS_USED)';
            } else {
                computeText.textContent = `? / ${computeHours.limit} h — cấu hình NEON_API_KEY để tự động đo`;
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
