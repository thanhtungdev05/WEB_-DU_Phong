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

    function updateSystemUsageUI(data) {
        if (!data || !data.storage) return;

        const storage = data.storage;
        const isFallback = data.activeTier === 'fallback';
        const usagePct = storage.usagePercent || 0;
        const sizeMb = storage.databaseSizeMb || 0;
        const limitMb = storage.neonLimitMb || 512;
        const status = storage.status || 'OK';

        // Summary Trigger
        const dot = document.getElementById('systemStatusDot');
        const label = document.getElementById('systemUsageTier');
        const tierBadge = document.getElementById('systemTierBadge');

        if (dot) {
            dot.className = 'system-status-indicator' + 
                (status === 'CRITICAL' ? ' is-critical' : status === 'WARNING' ? ' is-warning' : '');
        }

        if (label) {
            const tierName = isFallback ? 'Dự phòng' : 'Chính';
            label.textContent = `DB ${tierName}: ${sizeMb} MB (${usagePct}%)`;
        }

        if (tierBadge) {
            tierBadge.textContent = isFallback ? 'Neon Dự phòng' : 'Neon Chính';
            tierBadge.className = 'system-tier-badge' + (isFallback ? ' is-fallback' : '');
        }

        // Popover detail
        const storageText = document.getElementById('systemStorageText');
        const storageProgress = document.getElementById('systemStorageProgress');
        const storageStatusText = document.getElementById('systemStorageStatusText');
        const sessionCount = document.getElementById('systemSessionCount');

        if (storageText) {
            storageText.textContent = `${sizeMb} MB / ${limitMb} MB (${usagePct}%)`;
        }

        if (storageProgress) {
            storageProgress.style.width = Math.min(100, Math.max(2, usagePct)) + '%';
            storageProgress.className = 'system-progress-fill' +
                (status === 'CRITICAL' ? ' is-critical' : status === 'WARNING' ? ' is-warning' : '');
        }

        if (storageStatusText) {
            if (status === 'CRITICAL') {
                storageStatusText.textContent = 'Trạng thái: Nguy hiểm (> 92%) - Sắp chạm giới hạn!';
                storageStatusText.style.color = '#ef4444';
            } else if (status === 'WARNING') {
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
    }

    function initSystemUsageMonitor() {
        const trigger = document.getElementById('systemUsageTrigger');
        const popover = document.getElementById('systemUsagePopover');
        const refreshBtn = document.getElementById('systemRefreshUsageBtn');
        const cleanupBtn = document.getElementById('systemCleanupBtn');

        if (!trigger || !popover) return;

        // Toggle popover
        trigger.addEventListener('click', (e) => {
            e.stopPropagation();
            const isHidden = popover.hasAttribute('hidden');
            if (isHidden) {
                popover.removeAttribute('hidden');
                trigger.setAttribute('aria-expanded', 'true');
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
            const data = await fetchSystemUsageData();
            if (data) {
                updateSystemUsageUI(data);
                if (typeof window.showToast === 'function') {
                    window.showToast('Thông số tài nguyên đã được cập nhật.', 'success');
                }
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
                    const refreshed = await fetchSystemUsageData();
                    if (refreshed) updateSystemUsageUI(refreshed);
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

        // Tải dữ liệu ban đầu
        fetchSystemUsageData().then(data => {
            if (data) updateSystemUsageUI(data);
        });

        // Tự động cập nhật mỗi 5 phút khi tab đang mở
        setInterval(async () => {
            if (document.visibilityState === 'visible') {
                const data = await fetchSystemUsageData();
                if (data) updateSystemUsageUI(data);
            }
        }, 5 * 60 * 1000);
    }

    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', initSystemUsageMonitor);
    } else {
        initSystemUsageMonitor();
    }
})();
