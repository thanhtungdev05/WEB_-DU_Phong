    // 10. CISCO PACKET TRACER FLOATING DEVICE WINDOW & REAR CHASSIS SVG
    function getSlotEl(id, slot = 1) {
      const elId = Number(slot) === 2 ? `${id}-2` : id;
      return document.getElementById(elId);
    }
    window.getSlotEl = getSlotEl;

    function bringWindowToFront(slot) {
      const s = Number(slot) === 2 ? 2 : 1;
      const w1 = document.getElementById('cisco-device-window');
      const w2 = document.getElementById('cisco-device-window-2');
      if (s === 2) {
        if (w2) w2.style.zIndex = '205';
        if (w1) w1.style.zIndex = '200';
        if (window.studioState) {
          studioState.lastFocusedSlot = 2;
          if (studioState.activeWindowSlots && studioState.activeWindowSlots[2]) {
            studioState.activeDeviceWindowNodeId = studioState.activeWindowSlots[2];
          }
        }
      } else {
        if (w1) w1.style.zIndex = '205';
        if (w2) w2.style.zIndex = '200';
        if (window.studioState) {
          studioState.lastFocusedSlot = 1;
          if (studioState.activeWindowSlots && studioState.activeWindowSlots[1]) {
            studioState.activeDeviceWindowNodeId = studioState.activeWindowSlots[1];
          }
        }
      }
    }
    window.bringWindowToFront = bringWindowToFront;

    function zoomChassis(delta, slot = 1) {
      studioState.chassisZoom = Math.max(0.75, Math.min(1.4, (studioState.chassisZoom || 1) + delta));
      const wrap = getSlotEl('phys-chassis-svg-wrap', slot);
      if (wrap) wrap.style.transform = `scale(${studioState.chassisZoom})`;
    }

    function renderRearChassisSvg(node, dev, slot = 1) {
      const wrap = getSlotEl('phys-chassis-svg-wrap', slot);
      if (!wrap) return;
      const isPwr = node.power;
      let portsSvg = '';
      let px = 190;

      (dev.ports || []).forEach(p => {
        const link = studioState.links.find(l =>
          (l.srcId === node.id && l.srcPort === p.id) ||
          (l.tgtId === node.id && l.tgtPort === p.id)
        );
        const isPlugged = !!link;
        const ledCol = (isPlugged && isPwr) ? '#22c55e' : '#334155';
        const actCol = (isPlugged && isPwr) ? '#f59e0b' : '#334155';

        if (p.type === 'fiber') {
          portsSvg += `
            <g transform="translate(${px}, 44)" style="cursor:pointer" onclick="openDevicePortQuickAction('${node.id}', '${p.id}', ${slot})">
              <rect x="0" y="0" width="52" height="42" rx="4" fill="#065f46" stroke="#10b981" stroke-width="2"/>
              <rect x="11" y="9" width="30" height="22" rx="2" fill="${isPlugged ? '#38bdf8' : '#022c22'}"/>
              <circle cx="9" cy="6" r="2.5" fill="${ledCol}"/>
              <text x="26" y="55" fill="#cbd5e1" font-size="8.5" font-weight="800" font-family="monospace" text-anchor="middle">${p.short || p.id}</text>
            </g>`;
          px += 68;
        } else if (p.type === 'eth') {
          const borderCol = p.speed >= 10000 ? '#f59e0b' : (p.speed >= 2500 ? '#0284c7' : '#64748b');
          portsSvg += `
            <g transform="translate(${px}, 44)" style="cursor:pointer" onclick="openDevicePortQuickAction('${node.id}', '${p.id}', ${slot})">
              <rect x="0" y="0" width="56" height="42" rx="4" fill="#1e293b" stroke="${borderCol}" stroke-width="2"/>
              <rect x="6" y="4" width="9" height="4.5" rx="1" fill="${ledCol}"/>
              <rect x="41" y="4" width="9" height="4.5" rx="1" fill="${actCol}"/>
              <rect x="10" y="12" width="36" height="23" rx="2" fill="${isPlugged ? '#2563eb' : '#090d16'}"/>
              <text x="28" y="55" fill="${p.speed >= 2500 ? '#facc15' : '#cbd5e1'}" font-size="8.5" font-weight="800" font-family="monospace" text-anchor="middle">${p.short || p.id}</text>
            </g>`;
          px += 70;
        }
      });

      const totalW = Math.max(620, px + 80);
      wrap.innerHTML = `
        <svg viewBox="0 0 ${totalW} 118" width="100%" height="118">
          <rect x="6" y="14" width="${totalW - 12}" height="92" rx="9" fill="#1e293b" stroke="#475569" stroke-width="2"/>
          <rect x="14" y="22" width="${totalW - 28}" height="76" rx="5" fill="#0f172a" stroke="#334155" stroke-width="1"/>
          <text x="26" y="35" fill="#64748b" font-size="9" font-weight="800" font-family="monospace">FPT HARDWARE • ${dev.name} (${node.ip})</text>
          <g transform="translate(28, 46)">
            <circle cx="18" cy="20" r="14" fill="#090d16" stroke="#64748b" stroke-width="2"/>
            <circle cx="18" cy="20" r="4.5" fill="${isPwr ? '#f59e0b' : '#475569'}"/>
            <text x="18" y="50" fill="#94a3b8" font-size="8" font-weight="700" font-family="monospace" text-anchor="middle">12V DC</text>
          </g>
          <g transform="translate(82, 44)" style="cursor:pointer" onclick="toggleDevicePowerAction(${slot})">
            <rect x="0" y="0" width="40" height="42" rx="5" fill="${isPwr ? '#064e3b' : '#7f1d1d'}" stroke="${isPwr ? '#10b981' : '#ef4444'}" stroke-width="2"/>
            <circle cx="20" cy="${isPwr ? '13' : '29'}" r="7.5" fill="${isPwr ? '#34d399' : '#fca5a5'}"/>
            <text x="20" y="55" fill="${isPwr ? '#34d399' : '#f87171'}" font-size="8" font-weight="800" font-family="monospace" text-anchor="middle">${isPwr ? 'ON' : 'OFF'}</text>
          </g>
          <g transform="translate(136, 48)" style="cursor:pointer" onclick="triggerDeviceWpsAction(${slot})">
            <circle cx="17" cy="17" r="14" fill="#1e1b4b" stroke="#8b5cf6" stroke-width="2"/>
            <circle cx="17" cy="17" r="7" fill="${node.wpsActive ? '#38bdf8' : '#7c3aed'}"/>
            <text x="17" y="49" fill="#c084fc" font-size="8" font-weight="800" font-family="monospace" text-anchor="middle">WPS</text>
          </g>
          ${portsSvg}
        </svg>`;
    }

    function openDevicePortQuickAction(nodeId, portId, slot = 1) {
      const link = studioState.links.find(l =>
        (l.srcId === nodeId && l.srcPort === portId) ||
        (l.tgtId === nodeId && l.tgtPort === portId)
      );
      if (link && confirm(`Rút dây cáp khỏi cổng ${portId}?`)) {
        unplugPortCable(nodeId, portId, slot);
      }
    }

    function getMeshLabKtvParam() {
      try {
        const sp = new URLSearchParams(window.location.search || '');
        const q = (sp.get('_ktv') || '').trim();
        if (q) return q;
      } catch (_) {}
      return '';
    }

    function buildMeshNodeUrl(node, dev, rawUrl) {
      if (!rawUrl || rawUrl === 'about:blank') return rawUrl;
      if (!node || !node.id || !dev) return rawUrl;
      const simFolder = node.simId || dev.folder || ('sim_' + dev.key);
      let rel = String(rawUrl).trim();
      let targetUrl = rel;
      if (!rel.startsWith('/mesh-node/')) {
        const prefix = '/' + simFolder + '/';
        if (rel.startsWith(prefix)) {
          rel = rel.slice(prefix.length);
        } else if (rel === '/' + simFolder) {
          rel = '';
        } else if (rel.startsWith('/')) {
          rel = rel.replace(/^\/+/, '');
        }
        targetUrl = `/mesh-node/${encodeURIComponent(node.id)}/${encodeURIComponent(simFolder)}/${rel}`;
      }
      const ktvParam = getMeshLabKtvParam();
      if (ktvParam) {
        try {
          const u = new URL(targetUrl, window.location.origin);
          if (!u.searchParams.has('_ktv')) {
            u.searchParams.set('_ktv', ktvParam);
          }
          return u.pathname + u.search + u.hash;
        } catch (_) {}
      }
      return targetUrl;
    }

    function openDeviceWindow(nodeId, forceTab = null, targetSlot = null) {
      const node = studioState.nodes.find(n => n.id === nodeId);
      if (!node) return;

      if (!studioState.activeWindowSlots) {
        studioState.activeWindowSlots = { 1: null, 2: null };
      }

      const win1 = document.getElementById('cisco-device-window');
      const win2 = document.getElementById('cisco-device-window-2');
      const win1Open = win1 && win1.style.display === 'flex';
      const win2Open = win2 && win2.style.display === 'flex';

      let slot = 1;
      if (targetSlot === 1 || targetSlot === 2) {
        slot = targetSlot;
      } else if (studioState.activeWindowSlots[1] === nodeId) {
        slot = 1;
      } else if (studioState.activeWindowSlots[2] === nodeId) {
        slot = 2;
      } else if (!win1Open) {
        slot = 1;
      } else if (!win2Open) {
        slot = 2;
      } else {
        // Both windows are already open: reuse the one that was NOT focused most recently
        slot = (studioState.lastFocusedSlot === 1) ? 2 : 1;
      }

      studioState.activeWindowSlots[slot] = nodeId;
      studioState.lastFocusedSlot = slot;
      studioState.activeDeviceWindowNodeId = nodeId;
      bringWindowToFront(slot);

      const dev = FPT_CATALOG[node.catalogKey];

      const devIconEl = getSlotEl('win-dev-icon', slot);
      if (devIconEl) devIconEl.innerHTML = getDeviceSvgGraphic(dev, node.power);
      const devTitleEl = getSlotEl('win-dev-title', slot);
      if (devTitleEl) devTitleEl.textContent = `${node.name} (${dev.model})`;
      const devIpEl = getSlotEl('win-dev-ip', slot);
      if (devIpEl) devIpEl.textContent = `[${node.ip}]`;
      const physModelEl = getSlotEl('phys-model-name', slot);
      if (physModelEl) physModelEl.textContent = `${dev.name} [${node.roleLabel}] — MAC: ${node.mac}`;

      const pwrBtn = getSlotEl('phys-btn-power', slot);
      if (pwrBtn) {
        pwrBtn.textContent = node.power ? '⚡ 12V BẬT' : '🔌 12V TẮT';
        pwrBtn.style.background = node.power ? '#064e3b' : '#7f1d1d';
        pwrBtn.style.borderColor = node.power ? '#10b981' : '#ef4444';
      }

      renderRearChassisSvg(node, dev, slot);
      renderPhysicalPortsRack(node, dev, slot);

      const cfgNameEl = getSlotEl('cfg-node-name', slot);
      if (cfgNameEl) cfgNameEl.value = node.name;
      const cfgIpEl = getSlotEl('cfg-node-ip', slot);
      if (cfgIpEl) cfgIpEl.value = node.ip;
      const cfgPortsEl = getSlotEl('cfg-sidebar-ports', slot);
      if (cfgPortsEl) {
        cfgPortsEl.innerHTML = (dev.ports || []).map(p => `<div class="cpt-cfg-nav-item">🔌 ${p.short || p.name}</div>`).join('');
      }

      const iframe = getSlotEl('device-sim-iframe', slot);
      const urlBar = getSlotEl('browser-url-bar', slot);
      const subpagesBar = getSlotEl('device-subpages-bar', slot);
      if (subpagesBar) subpagesBar.innerHTML = '';

      const simFolder = node.simId || dev.folder || ('sim_' + dev.key);
      node.simId = simFolder;
      updateWebGuiLivePhyBar(node, dev, slot);
      renderFwLinkSyncOverlay(node, slot);

      const navigateWebGuiSubPage = (spUrl, spDisplayUrl, forceReload) => {
        if (!iframe) return;
        const scopedUrl = buildMeshNodeUrl(node, dev, spUrl);
        const targetDisplay = spDisplayUrl || `http://${node.ip}${spUrl}`;
        const isLoginTarget = /(login_page|login\.asp|login\.html|weblogin|wlogin|#\/login|\/login(?:\?|$))/.test(spUrl) ||
          (spUrl.endsWith('/') && dev.key !== 'be12000' && dev.key !== 'be15000' && !spUrl.includes('autologin=1'));
        if (forceReload || isLoginTarget) {
          try {
            sessionStorage.removeItem('sid');
            sessionStorage.removeItem('name');
            sessionStorage.removeItem('password');
          } catch (_) {}
        }
        const wasSameLoadedNode = (iframe.dataset.loadedNodeId === String(node.id) && iframe.dataset.loadedKey === node.catalogKey);
        iframe.dataset.loadedNodeId = String(node.id);
        iframe.dataset.loadedKey = node.catalogKey;
        if (urlBar) urlBar.value = targetDisplay;

        // Handle same-page SPA hash switching (e.g. AX3000C Vue Router or MikroTik WebFig)
        try {
          const curHref = iframe.contentWindow && iframe.contentWindow.location ? iframe.contentWindow.location.href : '';
          if (!forceReload && wasSameLoadedNode && curHref && scopedUrl.includes('#')) {
            const curU = new URL(curHref, location.origin);
            const tgtU = new URL(scopedUrl, location.origin);
            if (curU.pathname === tgtU.pathname && curU.search === tgtU.search) {
              iframe.contentWindow.location.hash = tgtU.hash;
              setTimeout(() => attachWebGuiTwoWayBridge(iframe, node), 180);
              return;
            }
          }
        } catch (_) {}

        // Initial subPage navigation
        iframe.onload = () => { attachWebGuiTwoWayBridge(iframe, node); };
        iframe.src = scopedUrl;
      };

      const tabWebGuiBtn = getSlotEl('tab-btn-webgui', slot);
      if (dev.subPages && dev.subPages.length > 0) {
        if (subpagesBar) {
          subpagesBar.style.display = 'flex';
          dev.subPages.forEach((sp, idx) => {
            const chip = document.createElement('button');
            chip.className = 'subpage-chip-btn ' + (idx === 0 ? 'active' : '');
            chip.textContent = sp.label;
            chip.onclick = () => {
              subpagesBar.querySelectorAll('.subpage-chip-btn').forEach(b => b.classList.remove('active'));
              chip.classList.add('active');
              navigateWebGuiSubPage(sp.url, sp.displayUrl, false);
            };
            subpagesBar.appendChild(chip);
          });
        }
        const initialPage = dev.subPages[0];
        if (iframe && (!iframe.src || iframe.dataset.loadedNodeId !== String(node.id) || iframe.dataset.loadedKey !== node.catalogKey)) {
          navigateWebGuiSubPage(initialPage.url, initialPage.displayUrl || `http://${node.ip}/login`, true);
        } else if (iframe) {
          attachWebGuiTwoWayBridge(iframe, node);
        }
        if (tabWebGuiBtn) tabWebGuiBtn.style.display = 'inline-flex';
      } else {
        if (subpagesBar) subpagesBar.style.display = 'none';
        if (iframe) iframe.src = 'about:blank';
        if (tabWebGuiBtn) tabWebGuiBtn.style.display = 'none';
      }

      initCliForNode(node, false, slot);
      const defaultTab = (node.category === 'client')
        ? 'desktop'
        : ((window._isEmbeddedPortalLesson && dev.subPages && dev.subPages.length > 0) ? 'webgui' : 'physical');
      switchDeviceWindowTab(forceTab || defaultTab, slot);
      const win = getSlotEl('cisco-device-window', slot);
      if (win) {
        win.classList.remove('minimized');
        if (!win.dataset.dragged && !win.classList.contains('split-left') && !win.classList.contains('split-right')) {
          if (slot === 2) {
            win.style.top = '52%';
            win.style.left = '56%';
            win.style.transform = 'translate(-42%, -48%)';
          } else {
            win.style.top = '48%';
            win.style.left = '46%';
            win.style.transform = 'translate(-50%, -50%)';
          }
        }
        win.style.display = 'flex';
      }
      if (typeof notifyParentTopologyChanged === 'function') {
        notifyParentTopologyChanged();
      }
    }

    // Attach click-to-focus listeners for both windows
    if (typeof document !== 'undefined') {
      const attachFocusListeners = () => {
        const w1 = document.getElementById('cisco-device-window');
        const w2 = document.getElementById('cisco-device-window-2');
        if (w1) w1.addEventListener('mousedown', () => bringWindowToFront(1));
        if (w2) w2.addEventListener('mousedown', () => bringWindowToFront(2));
      };
      if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', attachFocusListeners);
      } else {
        attachFocusListeners();
      }
    }
