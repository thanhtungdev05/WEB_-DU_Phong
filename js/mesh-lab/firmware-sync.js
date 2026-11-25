    // 3-LAYER HYBRID CROSS-DEVICE FIRMWARE SYNCHRONIZATION ENGINE (A -> CABLE -> B)
    // ZERO-CLICK REAL-TIME AUTO-SYNC & PRIORITY CUSTOM OVERRIDE STORE
    // ════════════════════════════════════════════════════════════════
    let _autoSyncDebounceTimer = null;
    let _fwSavedDebounceTimer = null;
    let _lastBackendSavedAt = 0;

    function getNodeSimId(node) {
      if (!node) return '';
      if (node.simId) return String(node.simId);
      const dev = (typeof FPT_CATALOG !== 'undefined' && FPT_CATALOG) ? FPT_CATALOG[node.catalogKey] : null;
      return (dev && dev.folder) ? String(dev.folder) : '';
    }

    function isRouterModeNode(node) {
      if (!node) return false;
      const fw = (node.firmwareConfig && typeof node.firmwareConfig === 'object') ? node.firmwareConfig : {};
      const explicitMode = String(node.opMode || fw.opMode || node.mode || '').trim().toLowerCase();
      const meshRole = String(node.meshRole || fw.meshRole || '').trim().toLowerCase();
      if (['ap', 'agent', 'mesh_agent', 'mesh', 'bridge', 'repeater', 'extender'].includes(explicitMode)) return false;
      if (['agent', 'ap', 'bridge', 'extender', 'repeater'].includes(meshRole)) return false;
      if (['router', 'gateway', 'nat_router'].includes(explicitMode)) return true;
      const simId = getNodeSimId(node);
      const cat = String(node.category || node.role || '').trim().toLowerCase();
      return simId === 'sim_vigor2927' || simId === 'sim_mikrotik_hexs' || cat === 'router';
    }

    function normalizeFirmwareConfigFields(cfg, fallbackIp = '192.168.1.1') {
      const target = (cfg && typeof cfg === 'object') ? cfg : {};
      const lanIp = String(target.lanIp || target.lan_ip || fallbackIp || '192.168.1.1').trim() || '192.168.1.1';
      const prefix = /^\d{1,3}(\.\d{1,3}){3}$/.test(lanIp) ? lanIp.split('.').slice(0, 3).join('.') : '192.168.1';
      const mask = String(target.subnetMask || target.netmask || target.subnet_mask || '255.255.255.0').trim() || '255.255.255.0';
      const rawStart = String(target.dhcpStart || target.dhcpStartIp || target.dhcp_start || '').trim();
      const rawEnd = String(target.dhcpEnd || target.dhcpEndIp || target.dhcp_end || '').trim();
      const startIp = /^\d{1,3}(\.\d{1,3}){3}$/.test(rawStart) ? rawStart : `${prefix}.100`;
      const endIp = /^\d{1,3}(\.\d{1,3}){3}$/.test(rawEnd) ? rawEnd : `${prefix}.200`;
      const pass = String(target.wpaKey || target.password || '12345678');
      const dns1 = String(target.primaryDns || target.dns1 || target.primary_dns || lanIp).trim() || lanIp;
      const dns2 = String(target.secondaryDns || target.dns2 || target.secondary_dns || '8.8.8.8').trim();
      const lease = String(target.leaseTime || target.dhcpLease || target.lease_time || '86400').trim() || '86400';

      target.lanIp = lanIp;
      target.netmask = mask;
      target.subnetMask = mask;
      target.dhcpStart = startIp;
      target.dhcpStartIp = startIp;
      target.dhcpEnd = endIp;
      target.dhcpEndIp = endIp;
      target.wpaKey = pass;
      target.password = pass;
      target.primaryDns = dns1;
      target.dns1 = dns1;
      target.secondaryDns = dns2;
      target.dns2 = dns2;
      target.leaseTime = lease;
      target.dhcpLease = lease;
      if (!target.securityMode) target.securityMode = 'WPA3-SAE / WPA2-PSK';
      if (!target.channel) target.channel = 'Auto (Ch.36 / 149)';
      if (!target.bandwidth) target.bandwidth = '320MHz';
      if (!target.customFieldMap || typeof target.customFieldMap !== 'object') target.customFieldMap = {};
      return target;
    }

    function buildScopedMeshApiUrl(path) {
      const ktvParam = (typeof getMeshLabKtvParam === 'function') ? getMeshLabKtvParam() : '';
      if (!ktvParam) return path;
      const sep = path.includes('?') ? '&' : '?';
      return `${path}${sep}_ktv=${encodeURIComponent(ktvParam)}`;
    }

    function serializeNodeForBackend(n) {
      const fw = normalizeFirmwareConfigFields(Object.assign({}, n.firmwareConfig || {}), n.ip);
      const simId = getNodeSimId(n);
      return {
        id: n.id,
        catalogKey: n.catalogKey,
        simId: simId,
        name: n.name,
        model: n.model,
        category: n.category,
        role: n.role,
        roleLabel: n.roleLabel,
        ip: n.ip,
        mac: n.mac,
        x: n.x,
        y: n.y,
        power: n.power !== false,
        opMode: n.opMode || fw.opMode || '',
        meshRole: n.meshRole || fw.meshRole || '',
        requireExplicitMeshMode: Boolean(n.requireExplicitMeshMode || fw.requireExplicitMeshMode || window._isEmbeddedPortalLesson),
        hasInternet: !!n.hasInternet,
        isGateway: !!n.isGateway,
        firmwareConfig: fw
      };
    }

    function serializeLinkForBackend(l) {
      return {
        id: l.id,
        srcId: l.srcId,
        srcPort: l.srcPort,
        tgtId: l.tgtId,
        tgtPort: l.tgtPort,
        fromNodeId: l.srcId,
        toNodeId: l.tgtId,
        fromPort: l.srcPort,
        toPort: l.tgtPort,
        cableType: l.cableType,
        speed: l.speed,
        speedMbps: l.speed
      };
    }

    function applyBackendConfigsToNodes(nodeConfigs, syncModes) {
      if (!nodeConfigs || typeof nodeConfigs !== 'object') return;
      studioState.nodes.forEach(n => {
        const backendCfg = nodeConfigs[n.id];
        if (!backendCfg || typeof backendCfg !== 'object') return;
        if (!n.firmwareConfig) n.firmwareConfig = {};
        Object.assign(n.firmwareConfig, backendCfg);
        normalizeFirmwareConfigFields(n.firmwareConfig, backendCfg.lanIp || n.ip);
        if (n.category !== 'core' && backendCfg.lanIp && /^\d{1,3}(\.\d{1,3}){3}$/.test(backendCfg.lanIp)) {
          n.ip = backendCfg.lanIp;
        }
        if (backendCfg.opMode) n.opMode = backendCfg.opMode;
        if (backendCfg.meshRole) n.meshRole = backendCfg.meshRole;
        const sm = syncModes && syncModes[n.id];
        if (n.linkedReceivedState && sm) {
          n.linkedReceivedState.syncMode = sm;
          if (backendCfg.wanIp) n.linkedReceivedState.assignedWanIp = backendCfg.wanIp;
          if (backendCfg.wanGateway) n.linkedReceivedState.gatewayIp = backendCfg.wanGateway;
          if (backendCfg.ssid) n.linkedReceivedState.syncedSsid = backendCfg.ssid;
          if (backendCfg.password || backendCfg.wpaKey) n.linkedReceivedState.syncedWpaKey = backendCfg.password || backendCfg.wpaKey;
        }
        if (typeof updateNodeNetworkStackFromConfig === 'function') {
          updateNodeNetworkStackFromConfig(n);
        }
      });
    }

    function markTopologyPendingSync() {
      const btnMain = document.getElementById('btn-apply-fw-sync');
      const btnGui = document.getElementById('btn-webgui-apply-sync');
      if (btnMain) btnMain.classList.add('pending-sync-pulse');
      if (btnGui) btnGui.classList.add('pending-sync-pulse');
    }

    function clearTopologyPendingSync() {
      const btnMain = document.getElementById('btn-apply-fw-sync');
      const btnGui = document.getElementById('btn-webgui-apply-sync');
      if (btnMain) btnMain.classList.remove('pending-sync-pulse');
      if (btnGui) btnGui.classList.remove('pending-sync-pulse');
    }

    // Debounced Zero-Click Auto-Sync Scheduler
    function scheduleAutoCrossDeviceSync(reason = 'live_edit', delayMs = 260, showNotification = true) {
      markTopologyPendingSync();
      clearTimeout(_autoSyncDebounceTimer);
      _autoSyncDebounceTimer = setTimeout(() => {
        triggerAutoCrossDeviceSync(showNotification, reason);
      }, delayMs);
    }

    function toggleFwLinkSyncOverlay(slot = 1) {
      const ov = getSlotEl('fw-link-sync-overlay', slot);
      if (!ov) return;
      if (ov.style.display === 'none') {
        ov.style.display = 'flex';
        ov.classList.remove('minimized', 'collapsed');
      } else {
        const isMin = !ov.classList.contains('minimized');
        ov.classList.toggle('minimized', isMin);
        ov.classList.toggle('collapsed', isMin);
      }
      const btn = getSlotEl('fw-link-sync-toggle-btn', slot);
      if (btn) {
        btn.textContent = ov.classList.contains('minimized') ? '▢' : '—';
      }
    }

    function closeFwLinkSyncOverlay(slot = 1) {
      const ov = getSlotEl('fw-link-sync-overlay', slot);
      if (ov) ov.style.display = 'none';
    }

    function updateWebGuiLivePhyBar(node, dev, slot = 1) {
      const phyEl = getSlotEl('webgui-phy-status', slot);
      const simEl = getSlotEl('webgui-sim-badge', slot);
      if (!phyEl || !simEl) return;

      simEl.textContent = `🍪 Active Sim: ${dev.folder || 'native'}`;

      const nodeLinks = studioState.links.filter(l => l.srcId === node.id || l.tgtId === node.id);
      const fiberLink = nodeLinks.find(l => l.cableType === 'FIBER_SC');
      const ethLinks = nodeLinks.filter(l => l.cableType === 'ETH_CAT6A' || l.cableType === 'ETH_CAT5E');
      const pon = calculateOpticalPonMetrics();

      const hasFiberPort = (dev.ports || []).some(p => p.type === 'fiber');
      let ponStatus = '';
      if (hasFiberPort) {
        ponStatus = (fiberLink && node.power && pon.state !== 'O1_LOS')
          ? `🟢 Quang PON: UP (${pon.rxDbm.toFixed(1)} dBm • ${fiberLink.speed >= 10000 ? '10G XGS-PON' : '2.5G GPON'})`
          : `🔴 Quang PON: LOS (Đứt cáp / ${pon.rxDbm.toFixed(1)} dBm)`;
      } else {
        ponStatus = `🔵 Chế độ: ${dev.roleLabel}`;
      }

      const ethStatus = ethLinks.length > 0 && node.power
        ? `🟢 Cổng LAN/WAN: ${ethLinks.length} cổng UP (${Math.max(...ethLinks.map(e => e.speed)) >= 2500 ? '2.5 Gbps' : '1 Gbps'})`
        : `⚪ Cổng LAN/WAN: Chưa cắm dây`;

      phyEl.innerHTML = `${ponStatus} &nbsp;•&nbsp; ${ethStatus}`;
    }

    function isLoginPageDoc(doc) {
      if (!doc) return false;
      const url = String((doc.location && doc.location.href) || doc.URL || '').toLowerCase();
      if (/(login_page|login\.asp|login\.html|unauth_root|weblogin|wlogin|#\/login)/.test(url)) return true;
      if (doc.querySelector('#Frm_Username, #Frm_Password, #username, #luci_username, #loginBtn, #login_btn, form#login, input[name="LoginName"], input[name="XRanID"]')) {
        return true;
      }
      if (doc.querySelector('input[id*="ssid" i], input[name*="ssid" i], input[placeholder*="ssid" i], [data-ftc-nhan*="ssid" i], [data-ftc-nhan*="passphrase" i]')) {
        return false;
      }
      const pw = doc.querySelector('input[type="password"]');
      if (pw && !doc.querySelector('#KeyPassphrase, #Frm_KeyPassphrase, #HiddenKeyPass, #VisibleKeyPass, #PreSharedKey1, #PreSharedKey, #wpa_key, #pskValue, #security_wpa_key, input[id*="wpa" i], input[id*="psk" i], input[id*="passphrase" i], input[name*="passphrase" i]')) {
        const bodyTxt = (doc.body && doc.body.textContent || '').toLowerCase();
        if (!bodyTxt.includes('ssid') && !bodyTxt.includes('wi-fi') && !bodyTxt.includes('wifi') && !bodyTxt.includes('wireless') && !bodyTxt.includes('wlan')) return true;
      }
      return false;
    }

    function bindBridgeToDoc(targetDoc, node) {
      if (!targetDoc || !targetDoc.body) return;
      if (targetDoc.body.tagName === 'FRAMESET' || targetDoc.querySelectorAll('frame').length > 0) {
        targetDoc.querySelectorAll('frame').forEach((frm) => {
          if (!frm.dataset.fptFrameHooked) {
            frm.dataset.fptFrameHooked = '1';
            frm.addEventListener('load', () => {
              try {
                const childDoc = frm.contentDocument || (frm.contentWindow && frm.contentWindow.document);
                if (childDoc) bindBridgeToDoc(childDoc, node);
              } catch (_) {}
            });
          }
          try {
            const childDoc = frm.contentDocument || (frm.contentWindow && frm.contentWindow.document);
            if (childDoc && childDoc.body && childDoc.readyState === 'complete') {
              bindBridgeToDoc(childDoc, node);
            }
          } catch (_) {}
        });
        return;
      }
      injectLinkedStateIntoFirmwareDom(targetDoc, node);

      // Attach MutationObserver so dynamic forms (Vue in AX3000C, loadView in AX3000S, WebFig in MikroTik, etc.)
      // get synced state injected as soon as inputs render into the DOM
      if (targetDoc.defaultView && targetDoc.defaultView.MutationObserver && !targetDoc.__fptObserverAttached) {
        targetDoc.__fptObserverAttached = true;
        let _moTimer = null;
        const mo = new targetDoc.defaultView.MutationObserver(() => {
          clearTimeout(_moTimer);
          _moTimer = setTimeout(() => {
            try { injectLinkedStateIntoFirmwareDom(targetDoc, node); } catch (_) {}
          }, 60);
        });
        try { mo.observe(targetDoc.body, { childList: true, subtree: true }); } catch (_) {}
      }

      if (targetDoc.body.dataset.fptBridgeAttached === '1') return;
      targetDoc.body.dataset.fptBridgeAttached = '1';

      const handleLiveDomChange = (ev) => {
        const targetEl = ev && ev.target;
        if (!targetEl) return;
        if (node && node.catalogKey === 'ax3000hv2') return;
        const extracted = extractConfigFromFirmwareDom(targetDoc, node, targetEl);
        if (extracted.length > 0 || (targetEl.tagName === 'INPUT' || targetEl.tagName === 'SELECT')) {
          scheduleAutoCrossDeviceSync('firmware_input', 260, extracted.length > 0);
        }
      };

      targetDoc.addEventListener('input', handleLiveDomChange, true);
      targetDoc.addEventListener('change', handleLiveDomChange, true);

      targetDoc.addEventListener('click', (ev) => {
        if (node && node.catalogKey === 'ax3000hv2') return;
        const t = ev.target;
        if (!t) return;
        const txt = ((t.textContent || t.value || '') + '').toLowerCase();
        if (
          t.tagName === 'BUTTON' ||
          t.type === 'submit' ||
          t.type === 'button' ||
          txt.includes('save') ||
          txt.includes('apply') ||
          txt.includes('lưu') ||
          txt.includes('cập nhật') ||
          txt.includes('ok')
        ) {
          extractConfigFromFirmwareDom(targetDoc, node, null);
          scheduleAutoCrossDeviceSync('native_save_btn', 80, true);
        }
      }, true);
    }

    function attachWebGuiTwoWayBridge(iframe, node) {
      try {
        const doc = (iframe && iframe.nodeType === 9) ? iframe : (iframe.contentDocument || (iframe.contentWindow && iframe.contentWindow.document));
        if (!doc) return;
        const dev = FPT_CATALOG[node.catalogKey];
        if (dev && dev.folder && !node.simId) {
          node.simId = dev.folder;
        }
        // 1. FIRST: Force-overwrite any static HTML defaults with KTV's custom overrides / Device A's synced config
        propagateFirmwareStateAcrossLinks(true);

        bindBridgeToDoc(doc, node);
        renderFwLinkSyncOverlay(node);

        // 2. Real-time Zero-Click Listener: Whenever KTV types or changes any input/select on Device A,
        // immediately capture the override and propagate it across connected cables to Device B!
        const handleLiveDomChange = (ev) => {
          const targetEl = ev && ev.target;
          if (!targetEl) return;
          // AX3000HV2 persists full 2.4G/5G Host SSID via real ASP POST Save -> backend sync
          if (node && node.catalogKey === 'ax3000hv2') return;
          const extracted = extractConfigFromFirmwareDom(iframe, node, targetEl);
          if (extracted.length > 0 || (targetEl.tagName === 'INPUT' || targetEl.tagName === 'SELECT')) {
            scheduleAutoCrossDeviceSync('firmware_input', 260, extracted.length > 0);
          }
        };

        doc.addEventListener('input', handleLiveDomChange, true);
        doc.addEventListener('change', handleLiveDomChange, true);

        // 3. Also listen for native Save/Apply button clicks inside the simulator Web GUI for instant 0ms sync
        doc.addEventListener('click', (ev) => {
          if (node && node.catalogKey === 'ax3000hv2') return;
          const t = ev.target;
          if (!t) return;
          const txt = ((t.textContent || t.value || '') + '').toLowerCase();
          if (
            t.tagName === 'BUTTON' ||
            t.type === 'submit' ||
            t.type === 'button' ||
            txt.includes('save') ||
            txt.includes('apply') ||
            txt.includes('lưu') ||
            txt.includes('cập nhật') ||
            txt.includes('ok')
          ) {
            extractConfigFromFirmwareDom(iframe, node, null);
            scheduleAutoCrossDeviceSync('native_save_btn', 60, true);
          }
        }, true);
      } catch (_) {}
    }

    // Helper: Check if an input is a 4-octet split IP box (e.g. sub_IPAddr0:DHCPBasicCfg, class="ip", maxlength="3")
    function isOctetSplitInput(el) {
      if (!el) return false;
      const id = (el.id || el.name || '');
      if (id.startsWith('sub_') || (el.classList && (el.classList.contains('ip') || el.classList.contains('mac')))) return true;
      const ml = parseInt(el.getAttribute('maxlength') || '0', 10);
      return ml > 0 && ml <= 3;
    }

    // Helper: Read a 4-octet split IPv4 address from ZTE / Router Firmware DOM
    function readOctetIpFromDoc(doc, prefix, suffix = '') {
      if (!doc) return '';
      const parts = [];
      for (let i = 0; i < 4; i++) {
        const el = doc.getElementById(`${prefix}${i}${suffix}`) || (suffix ? doc.getElementById(`${prefix}${i}`) : null);
        if (!el) return '';
        const v = (el.value || '').trim();
        if (!/^\d{1,3}$/.test(v)) return '';
        const num = parseInt(v, 10);
        if (num < 0 || num > 255) return '';
        parts.push(String(num));
      }
      return parts.join('.');
    }

    // Helper: Write a full IPv4 address into 4 separate octet input boxes in Firmware DOM
    function writeOctetIpToDoc(doc, prefix, suffix, ipStr, hiddenIds = []) {
      if (!doc || !ipStr || typeof ipStr !== 'string') return;
      const parts = ipStr.trim().split('.');
      if (parts.length !== 4 || !parts.every(p => /^\d{1,3}$/.test(p) && parseInt(p, 10) <= 255)) return;
      for (let i = 0; i < 4; i++) {
        const el = doc.getElementById(`${prefix}${i}${suffix}`) || (suffix ? doc.getElementById(`${prefix}${i}`) : null);
        if (el && doc.activeElement !== el) {
          el.value = parts[i];
          el.style.boxShadow = '0 0 0 2px rgba(16, 185, 129, 0.45)';
        }
      }
      hiddenIds.forEach(hid => {
        const hEl = doc.getElementById(hid);
        if (hEl) hEl.value = parts.join('.');
      });
    }

    // Layer 1: Extract KTV's custom configuration from Device A's Firmware DOM (Priority Custom Override Store)
    function extractConfigFromFirmwareDom(iframe, node, changedElement = null) {
      const updatedFields = [];
      if (!node) return updatedFields;
      if (
        window._isEmbeddedPortalLesson ||
        node.catalogKey === 'ax3000c' ||
        node.catalogKey === 'ax3000hv2' ||
        node.catalogKey === 'ax3000gz_v2' ||
        node.catalogKey === 'ax1800gz' ||
        node.catalogKey === 'be12000' ||
        node.catalogKey === 'ax3000s' ||
        node.catalogKey === 'ax3000gz' ||
        node.catalogKey === 'ac1000z' ||
        node.catalogKey === 'ont_be6500c' ||
        node.catalogKey === 'be6500c'
      ) {
        return updatedFields;
      }
      if (!node.firmwareConfig) {
        node.firmwareConfig = normalizeFirmwareConfigFields({
          hasKtvCustomConfig: false,
          initialDefaultSsid: 'FPT_Telecom_WiFi7',
          initialDefaultIp: node.ip,
          ssid: 'FPT_Telecom_WiFi7',
          wpaKey: '12345678',
          securityMode: 'WPA3-SAE / WPA2-PSK',
          channel: 'Auto (Ch.36 / 149)',
          bandwidth: '320MHz',
          wifiEnabled: true,
          lanIp: node.ip,
          subnetMask: '255.255.255.0',
          dhcpStart: '192.168.1.2',
          dhcpStartIp: '192.168.1.2',
          dhcpEnd: '192.168.1.254',
          dhcpEndIp: '192.168.1.254',
          primaryDns: '192.168.1.1',
          secondaryDns: '0.0.0.0',
          leaseTime: '86400',
          dhcpEnable: '1',
          ispDns: '0',
          customFieldMap: {}
        }, node.ip);
      } else {
        normalizeFirmwareConfigFields(node.firmwareConfig, node.ip);
      }

      const gatewayNode = studioState.nodes.find(n => n.category === 'gateway' && n.power) ||
                          studioState.nodes.find(n => n.category === 'gateway');

      try {
        const topDoc = iframe && ((iframe.nodeType === 9) ? iframe : (iframe.contentDocument || (iframe.contentWindow && iframe.contentWindow.document)));
        if (!topDoc) return updatedFields;
        if (typeof isLoginPageDoc === 'function' && isLoginPageDoc(topDoc)) return updatedFields;

        const docsToSearch = [topDoc];
        if (topDoc.querySelectorAll && topDoc.querySelectorAll('frame').length > 0) {
          topDoc.querySelectorAll('frame').forEach(frm => {
            try {
              const childDoc = frm.contentDocument || (frm.contentWindow && frm.contentWindow.document);
              if (childDoc && childDoc.body && !isLoginPageDoc(childDoc)) docsToSearch.push(childDoc);
            } catch (_) {}
          });
        }

        const isButtonInput = (el) => {
          if (!el) return false;
          const t = String(el.type || '').toLowerCase();
          const tag = String(el.tagName || '').toUpperCase();
          return tag === 'BUTTON' || (tag === 'INPUT' && (t === 'button' || t === 'submit' || t === 'reset'));
        };
        const findInDocs = (sel) => {
          if (changedElement && changedElement.matches && !isButtonInput(changedElement)) {
            try { if (changedElement.matches(sel)) return changedElement; } catch (_) {}
          }
          for (const d of docsToSearch) {
            try {
              const all = d.querySelectorAll(sel);
              for (const el of all) {
                if (isButtonInput(el)) continue;
                if (el && el.value && el.value.trim().length > 0) return el;
              }
              for (const el of all) {
                if (!isButtonInput(el)) return el;
              }
            } catch (_) {}
          }
          return null;
        };

        // Record arbitrary input/select change in customFieldMap so switching subpages on Device A never resets KTV's edits
        if (changedElement && (changedElement.tagName === 'INPUT' || changedElement.tagName === 'SELECT' || changedElement.tagName === 'TEXTAREA')) {
          const fieldKey = changedElement.id || changedElement.name;
          if (fieldKey && !fieldKey.toLowerCase().includes('login') && !fieldKey.toLowerCase().includes('user')) {
            if (!isOctetSplitInput(changedElement) || /^\d{1,3}$/.test((changedElement.value || '').trim())) {
              const val = changedElement.type === 'checkbox' ? changedElement.checked : changedElement.value;
              node.firmwareConfig.customFieldMap[fieldKey] = val;
              node.firmwareConfig.hasKtvCustomConfig = true;
            }
          }
        }

        // 1. Extract SSID (from explicit changedElement or known SSID selectors)
        const ssidSelectors = [
          '#Txt_SSID', '#SSID', '#essid', '#wlan_ssid', '#Frm_SSID', '#ssid_2g', '#ssid_5g',
          'input[name*="ssid" i]', 'input[id*="ssid" i]', 'input[placeholder*="SSID" i]',
          '[data-ftc-nhan*="SSID" i] input', '[data-ftc-nhan*="Wi-Fi" i] input',
          '[name="cbid.wireless.default_radio0.ssid"]', '[name="cbid.wireless.default_radio1.ssid"]',
          '[name="wlSsid"]', '[name="wlanSsid"]', '[name="2G_SSID"]', '[name="5G_SSID"]',
          'input[id*="wlSsid" i]', 'input[id*="wlanSsid" i]', '#wifi_ssid', '#wireless_ssid'
        ];
        for (const sel of ssidSelectors) {
          const el = findInDocs(sel);
          if (el && el.value && el.value.trim().length >= 2) {
            const newSsid = el.value.trim();
            if (node.firmwareConfig.ssid !== newSsid) {
              node.firmwareConfig.ssid = newSsid;
              node.firmwareConfig.hasKtvCustomConfig = true;
              if (gatewayNode && gatewayNode.id === node.id && gatewayNode.firmwareConfig) {
                gatewayNode.firmwareConfig.ssid = newSsid;
                gatewayNode.firmwareConfig.hasKtvCustomConfig = true;
              }
              updatedFields.push(`SSID="${newSsid}"`);
            }
            const cfgSsid = document.getElementById('cfg-wifi-ssid');
            if (cfgSsid && cfgSsid.value !== newSsid) cfgSsid.value = newSsid;
            break;
          }
        }

        // 2. Extract WPA Password / Key / Passphrase
        const keySelectors = [
          '#Pwd_WpaPsk', '#wpa_key', '#pskValue', '#KeyPassphrase', '#Frm_KeyPassphrase',
          '#HiddenKeyPass', '#VisibleKeyPass', '#PreSharedKey1', '#PreSharedKey',
          '#security_wpa_key', 'input[id*="security_wpa_key" i]', 'input[name*="security_wpa_key" i]',
          'input[id*="HiddenKeyPass" i]', 'input[id*="VisibleKeyPass" i]', 'input[id*="KeyPassphrase" i]',
          'input[name*="KeyPassphrase" i]',
          'input[name*="passphrase" i]', 'input[id*="passphrase" i]', 'input[placeholder*="passphrase" i]',
          'input[name*="keypass" i]', 'input[id*="keypass" i]',
          'input[name*="preshared" i]', 'input[id*="preshared" i]',
          'input[id*="wpa" i]', 'input[id*="psk" i]',
          'input[name*="wpa_key" i]', 'input[name*="wpakey" i]',
          '[name="cbid.wireless.default_radio0.key"]', '[name="cbid.wireless.default_radio1.key"]',
          '[data-ftc-nhan*="Passphrase" i] input', '[data-ftc-nhan*="Mật khẩu" i] input', '[data-ftc-nhan*="WPA" i] input',
          '#wifi_password', '#wireless_password',
          'input[placeholder*="mật khẩu" i]', 'input[placeholder*="password" i]',
          'input[name*="password" i]:not([type="hidden"])'
        ];
        for (const sel of keySelectors) {
          const el = findInDocs(sel);
          if (el && el.value && el.value.trim().length >= 4) {
            const elId = (el.id || el.name || '').toLowerCase();
            if (elId.includes('login') || elId.includes('admin') || elId.includes('oldpass') || elId.includes('newpass') || elId.includes('luci_username')) continue;
            const newKey = el.value.trim();
            if (node.firmwareConfig.wpaKey !== newKey) {
              node.firmwareConfig.wpaKey = newKey;
              node.firmwareConfig.hasKtvCustomConfig = true;
              node.firmwareConfig.password = newKey;
              if (gatewayNode && gatewayNode.id === node.id && gatewayNode.firmwareConfig) {
                gatewayNode.firmwareConfig.wpaKey = newKey;
                gatewayNode.firmwareConfig.password = newKey;
                gatewayNode.firmwareConfig.hasKtvCustomConfig = true;
              }
              updatedFields.push(`WPA-Key="${newKey}"`);
            }
            const cfgKey = document.getElementById('cfg-wifi-key');
            if (cfgKey && cfgKey.value !== newKey) cfgKey.value = newKey;
            break;
          }
        }

        // 3. Extract 4-octet split IPv4 & DHCP Server parameters (ZTE BE12000Z / BE15000Z lanMgrIpv4.html)
        let octLanIp = '', octMask = '', octDhcpStart = '', octDhcpEnd = '', octDns1 = '', octDns2 = '';
        for (const d of docsToSearch) {
          if (!octLanIp) octLanIp = readOctetIpFromDoc(d, 'sub_IPAddr', ':DHCPBasicCfg');
          if (!octMask) octMask = readOctetIpFromDoc(d, 'sub_SubMask', '');
          if (!octDhcpStart) octDhcpStart = readOctetIpFromDoc(d, 'sub_MinAddress', ':DHCPBasicCfg');
          if (!octDhcpEnd) octDhcpEnd = readOctetIpFromDoc(d, 'sub_MaxAddress', ':DHCPBasicCfg');
          if (!octDns1) octDns1 = readOctetIpFromDoc(d, 'sub_DNSServer1', '');
          if (!octDns2) octDns2 = readOctetIpFromDoc(d, 'sub_DNSServer2', '');
        }

        if (octLanIp && node.ip !== octLanIp) {
          node.ip = octLanIp;
          node.firmwareConfig.lanIp = octLanIp;
          node.firmwareConfig.hasKtvCustomConfig = true;
          if (gatewayNode && node.id === gatewayNode.id && gatewayNode.firmwareConfig) {
            gatewayNode.ip = octLanIp;
            gatewayNode.firmwareConfig.lanIp = octLanIp;
          }
          const cfgIp = document.getElementById('cfg-node-ip');
          if (cfgIp) cfgIp.value = octLanIp;
          const winIp = document.getElementById('win-dev-ip');
          if (winIp) winIp.textContent = `[${octLanIp}]`;
          updatedFields.push(`LAN-IP=${octLanIp}`);
        }
        if (octMask && node.firmwareConfig.subnetMask !== octMask) {
          node.firmwareConfig.subnetMask = octMask;
          node.firmwareConfig.netmask = octMask;
          node.firmwareConfig.hasKtvCustomConfig = true;
          if (gatewayNode && gatewayNode.id === node.id && gatewayNode.firmwareConfig) { gatewayNode.firmwareConfig.subnetMask = octMask; gatewayNode.firmwareConfig.netmask = octMask; }
          const cfgMask = document.getElementById('cfg-node-mask');
          if (cfgMask) cfgMask.value = octMask;
          updatedFields.push(`Mask=${octMask}`);
        }
        if (octDhcpStart && node.firmwareConfig.dhcpStart !== octDhcpStart) {
          node.firmwareConfig.dhcpStart = octDhcpStart;
          node.firmwareConfig.dhcpStartIp = octDhcpStart;
          node.firmwareConfig.hasKtvCustomConfig = true;
          if (gatewayNode && gatewayNode.id === node.id && gatewayNode.firmwareConfig) { gatewayNode.firmwareConfig.dhcpStart = octDhcpStart; gatewayNode.firmwareConfig.dhcpStartIp = octDhcpStart; }
          updatedFields.push(`DHCP-Start=${octDhcpStart}`);
        }
        if (octDhcpEnd && node.firmwareConfig.dhcpEnd !== octDhcpEnd) {
          node.firmwareConfig.dhcpEnd = octDhcpEnd;
          node.firmwareConfig.dhcpEndIp = octDhcpEnd;
          node.firmwareConfig.hasKtvCustomConfig = true;
          if (gatewayNode && gatewayNode.id === node.id && gatewayNode.firmwareConfig) { gatewayNode.firmwareConfig.dhcpEnd = octDhcpEnd; gatewayNode.firmwareConfig.dhcpEndIp = octDhcpEnd; }
          updatedFields.push(`DHCP-End=${octDhcpEnd}`);
        }
        if (octDns1 && node.firmwareConfig.primaryDns !== octDns1) {
          node.firmwareConfig.primaryDns = octDns1;
          node.firmwareConfig.dns1 = octDns1;
          node.firmwareConfig.hasKtvCustomConfig = true;
          if (gatewayNode && gatewayNode.id === node.id && gatewayNode.firmwareConfig) { gatewayNode.firmwareConfig.primaryDns = octDns1; gatewayNode.firmwareConfig.dns1 = octDns1; }
          updatedFields.push(`DNS1=${octDns1}`);
        }
        if (octDns2 && node.firmwareConfig.secondaryDns !== octDns2) {
          node.firmwareConfig.secondaryDns = octDns2;
          node.firmwareConfig.dns2 = octDns2;
          node.firmwareConfig.hasKtvCustomConfig = true;
          if (gatewayNode && gatewayNode.id === node.id && gatewayNode.firmwareConfig) { gatewayNode.firmwareConfig.secondaryDns = octDns2; gatewayNode.firmwareConfig.dns2 = octDns2; }
          updatedFields.push(`DNS2=${octDns2}`);
        }

        const leaseEl = findInDocs('#LeaseTimeSelfDefine, #LeaseTime, #dhcpLeasedTime');
        if (leaseEl && leaseEl.value && /^\d+$/.test(leaseEl.value.trim())) {
          const newLease = leaseEl.value.trim();
          if (node.firmwareConfig.leaseTime !== newLease) {
            node.firmwareConfig.leaseTime = newLease;
            node.firmwareConfig.hasKtvCustomConfig = true;
            node.firmwareConfig.dhcpLease = newLease;
            if (gatewayNode && gatewayNode.id === node.id && gatewayNode.firmwareConfig) { gatewayNode.firmwareConfig.leaseTime = newLease; gatewayNode.firmwareConfig.dhcpLease = newLease; }
            updatedFields.push(`Lease=${newLease}s`);
          }
        }

        const srvEn0 = findInDocs('#ServerEnable0, #dhcpSrvType1, input[name="dhcpSrvType"][value="0"], input[name="dhcp_enable"][value="0"]');
        const srvEn1 = findInDocs('#ServerEnable1, #dhcpSrvType2, input[name="dhcpSrvType"][value="1"], input[name="dhcp_enable"][value="1"]');
        if (srvEn0 || srvEn1) {
          const srvVal = (srvEn0 && srvEn0.checked) ? '0' : '1';
          if (node.firmwareConfig.dhcpEnable !== srvVal) {
            node.firmwareConfig.dhcpEnable = srvVal;
            node.firmwareConfig.hasKtvCustomConfig = true;
            if (gatewayNode && gatewayNode.id === node.id && gatewayNode.firmwareConfig) gatewayNode.firmwareConfig.dhcpEnable = srvVal;
            updatedFields.push(`DHCP=${srvVal === '1' ? 'ON' : 'OFF'}`);
          }
        }

        const isp0 = findInDocs('#DnsServerSource0');
        const isp1 = findInDocs('#DnsServerSource1');
        if (isp0 || isp1) {
          const ispVal = (isp1 && isp1.checked) ? '1' : '0';
          if (node.firmwareConfig.ispDns !== ispVal) {
            node.firmwareConfig.ispDns = ispVal;
            node.firmwareConfig.hasKtvCustomConfig = true;
            if (gatewayNode && gatewayNode.id === node.id && gatewayNode.firmwareConfig) gatewayNode.firmwareConfig.ispDns = ispVal;
          }
        }

        // 4. Extract single-input LAN / Management IPv4 (non-octet fields only)
        const ipSelectors = [
          '#ethIpAddress', '#lan_ip', '#ipaddr', '#Frm_LanIp', 'input[name*="lan_ip" i]', 'input[id*="lanip" i]',
          'input[name="cbid.network.lan.ipaddr"]', 'input[name="ip"]', 'input[id="ip"]',
          'input[name="lan_ipaddr"]', 'input[id="lan_ipaddr"]', 'input[name="ipaddr"]'
        ];
        for (const sel of ipSelectors) {
          const el = findInDocs(sel);
          if (el && !isOctetSplitInput(el) && el.value && /^\d{1,3}(\.\d{1,3}){3}$/.test(el.value.trim())) {
            const newIp = el.value.trim();
            if (node.ip !== newIp) {
              node.ip = newIp;
              node.firmwareConfig.lanIp = newIp;
              node.firmwareConfig.hasKtvCustomConfig = true;
              const cfgIp = document.getElementById('cfg-node-ip');
              if (cfgIp) cfgIp.value = newIp;
              const winIp = document.getElementById('win-dev-ip');
              if (winIp) winIp.textContent = `[${newIp}]`;
              updatedFields.push(`IP=${newIp}`);
            }
            break;
          }
        }

        // 5. Extract single-input Subnet Mask (non-octet fields only)
        const maskSelectors = [
          '#ethSubnetMask', '#netmask', '#subnet_mask', '#Frm_SubMask', 'input[name="cbid.network.lan.netmask"]',
          'input[name="netmask"]', 'input[id="netmask"]', 'input[name*="mask" i]',
          'input[name="lan_netmask"]', 'input[id="lan_netmask"]'
        ];
        for (const sel of maskSelectors) {
          const el = findInDocs(sel);
          if (el && !isOctetSplitInput(el) && el.value && /^\d{1,3}(\.\d{1,3}){3}$/.test(el.value.trim())) {
            const newMask = el.value.trim();
            if (node.firmwareConfig.subnetMask !== newMask) {
              node.firmwareConfig.subnetMask = newMask;
              node.firmwareConfig.hasKtvCustomConfig = true;
              const cfgMask = document.getElementById('cfg-node-mask');
              if (cfgMask) cfgMask.value = newMask;
              updatedFields.push(`Mask=${newMask}`);
            }
            break;
          }
        }

        // 5. Extract Wi-Fi Channel & Bandwidth & Security Mode
        const chSelectors = ['select[id*="channel" i]', 'select[name*="channel" i]', '#Channel', '#wlan_channel'];
        for (const sel of chSelectors) {
          const el = doc.querySelector(sel);
          if (el && el.value) {
            const chText = (el.options && el.options[el.selectedIndex]) ? el.options[el.selectedIndex].text : el.value;
            if (node.firmwareConfig.channel !== chText) {
              node.firmwareConfig.channel = chText;
              node.firmwareConfig.hasKtvCustomConfig = true;
              if (gatewayNode && gatewayNode.id === node.id && gatewayNode.firmwareConfig) gatewayNode.firmwareConfig.channel = chText;
              updatedFields.push(`Channel=${chText}`);
            }
            break;
          }
        }

        const bwSelectors = ['select[id*="bw" i]', 'select[id*="bandwidth" i]', 'select[name*="bandwidth" i]', '#BandWidth'];
        for (const sel of bwSelectors) {
          const el = doc.querySelector(sel);
          if (el && el.value) {
            const bwText = (el.options && el.options[el.selectedIndex]) ? el.options[el.selectedIndex].text : el.value;
            if (node.firmwareConfig.bandwidth !== bwText) {
              node.firmwareConfig.bandwidth = bwText;
              node.firmwareConfig.hasKtvCustomConfig = true;
              if (gatewayNode && gatewayNode.id === node.id && gatewayNode.firmwareConfig) gatewayNode.firmwareConfig.bandwidth = bwText;
              updatedFields.push(`BW=${bwText}`);
            }
            break;
          }
        }

        // 6. Extract Hostname / Device Name
        const hostSelectors = ['#hostname', '#dev_name', '#Frm_HostName', 'input[id*="hostname" i]'];
        for (const sel of hostSelectors) {
          const el = doc.querySelector(sel);
          if (el && el.value && el.value.trim().length >= 2) {
            const newHost = el.value.trim();
            if (node.name !== newHost) {
              node.name = newHost;
              node.firmwareConfig.hasKtvCustomConfig = true;
              const cfgName = document.getElementById('cfg-node-name');
              if (cfgName) cfgName.value = newHost;
              updatedFields.push(`Name="${newHost}"`);
            }
            break;
          }
        }

        // 7. Extract Security Mode & single-input DHCP bounds if present
        const secSelectors = ['#SecurityMode', 'select[id*="security" i]', 'select[name*="security" i]', 'select[id*="auth" i]', 'select[id*="encrypt" i]'];
        for (const sel of secSelectors) {
          const el = doc.querySelector(sel);
          if (el && el.value) {
            const secText = (el.options && el.options[el.selectedIndex]) ? el.options[el.selectedIndex].text : el.value;
            if (secText && node.firmwareConfig.securityMode !== secText) {
              node.firmwareConfig.securityMode = secText;
              node.firmwareConfig.hasKtvCustomConfig = true;
              if (gatewayNode && gatewayNode.id === node.id && gatewayNode.firmwareConfig) gatewayNode.firmwareConfig.securityMode = secText;
              updatedFields.push(`Sec=${secText}`);
            }
            break;
          }
        }
        const singleStartEl = doc.querySelector('#dhcp_start, input[name*="dhcp_start" i], input[id*="dhcp_start" i]');
        if (singleStartEl && !isOctetSplitInput(singleStartEl) && singleStartEl.value && /^\d{1,3}(\.\d{1,3}){3}$/.test(singleStartEl.value.trim())) {
          const sVal = singleStartEl.value.trim();
          if (node.firmwareConfig.dhcpStart !== sVal) {
            node.firmwareConfig.dhcpStart = sVal;
            node.firmwareConfig.dhcpStartIp = sVal;
            node.firmwareConfig.hasKtvCustomConfig = true;
            updatedFields.push(`DHCP-Start=${sVal}`);
          }
        }
        const singleEndEl = doc.querySelector('#dhcp_end, input[name*="dhcp_end" i], input[id*="dhcp_end" i]');
        if (singleEndEl && !isOctetSplitInput(singleEndEl) && singleEndEl.value && /^\d{1,3}(\.\d{1,3}){3}$/.test(singleEndEl.value.trim())) {
          const eVal = singleEndEl.value.trim();
          if (node.firmwareConfig.dhcpEnd !== eVal) {
            node.firmwareConfig.dhcpEnd = eVal;
            node.firmwareConfig.dhcpEndIp = eVal;
            node.firmwareConfig.hasKtvCustomConfig = true;
            updatedFields.push(`DHCP-End=${eVal}`);
          }
        }
      } catch (_) {}
      return updatedFields;
    }

    // Layer 2: Propagate Firmware state (pre-existing or KTV custom override) from Device A across active cables to Device B
    function propagateFirmwareStateAcrossLinks(readdressSubnet = true) {
      const pon = calculateOpticalPonMetrics();
      const cfgSsidEl = document.getElementById('cfg-wifi-ssid');
      const cfgKeyEl = document.getElementById('cfg-wifi-key');
      const globalSsid = (cfgSsidEl && cfgSsidEl.value.trim()) || 'FPT_Telecom_WiFi7';
      const globalKey = (cfgKeyEl && cfgKeyEl.value.trim()) || '12345678';
      const nowTime = new Date().toLocaleTimeString('vi-VN', { hour12: false });

      studioState.nodes.forEach(n => {
        if (!n.simId) n.simId = getNodeSimId(n);
        if (!n.firmwareConfig) {
          n.firmwareConfig = normalizeFirmwareConfigFields({
            hasKtvCustomConfig: false,
            initialDefaultSsid: globalSsid,
            initialDefaultIp: n.ip,
            ssid: globalSsid,
            wpaKey: globalKey,
            securityMode: 'WPA3-SAE / WPA2-PSK',
            channel: 'Auto (Ch.36 / 149)',
            bandwidth: '320MHz',
            wifiEnabled: true,
            lanIp: n.ip,
            subnetMask: '255.255.255.0',
            customFieldMap: {}
          }, n.ip);
        } else {
          normalizeFirmwareConfigFields(n.firmwareConfig, n.ip);
        }
        n.linkedReceivedState = {
          syncedAt: nowTime,
          syncMode: isRouterModeNode(n) ? 'router_standalone' : 'standalone',
          upstreamSourceName: null,
          upstreamSourceIp: null,
          upstreamSourceMac: null,
          upstreamPort: null,
          localPort: null,
          cableType: null,
          negotiatedSpeed: 0,
          syncedSsid: null,
          syncedWpaKey: null,
          syncedSecurityMode: null,
          syncedChannel: null,
          syncedBandwidth: null,
          syncedSubnetMask: null,
          syncedDhcpStart: null,
          syncedDhcpEnd: null,
          syncedPrimaryDns: null,
          syncedSecondaryDns: null,
          syncedLeaseTime: null,
          syncedDhcpEnable: null,
          syncedIspDns: null,
          hasKtvCustomFromUpstream: false,
          assignedWanIp: null,
          gatewayIp: null,
          opticalRxDbm: null,
          opticalState: null,
          wifiRssiDbm: null,
          neighbors: []
        };
      });

      const isLinkOperational = (link) => {
        const s = studioState.nodes.find(n => n.id === link.srcId);
        const t = studioState.nodes.find(n => n.id === link.tgtId);
        if (!s || !t || !s.power || !t.power) return false;
        if (link.cableType === 'FIBER_SC' && pon.state === 'O1_LOS') return false;
        if (link.cableType === 'WIFI_MESH') {
          const wf = calculateWifiLinkPhysics(s, t);
          if (wf.qualityState === 'down') return false;
        }
        return true;
      };

      studioState.links.forEach(link => {
        const s = studioState.nodes.find(n => n.id === link.srcId);
        const t = studioState.nodes.find(n => n.id === link.tgtId);
        if (!s || !t) return;
        const up = isLinkOperational(link);
        let signalInfo = `${link.speed >= 1000 ? (link.speed / 1000) + ' Gbps' : link.speed + ' Mbps'}`;
        if (link.cableType === 'FIBER_SC') {
          signalInfo = `Quang ${pon.rxDbm.toFixed(1)} dBm (${pon.stateLabel})`;
        } else if (link.cableType === 'WIFI_MESH') {
          const wf = calculateWifiLinkPhysics(s, t);
          signalInfo = `Wi-Fi ${wf.rssiDbm} dBm (${wf.phyRateMbps} Mbps)`;
        }

        s.linkedReceivedState.neighbors.push({
          id: t.id, name: t.name, model: t.model, ip: t.ip, mac: t.mac, category: t.category,
          localPort: link.srcPort, peerPort: link.tgtPort, cableType: link.cableType, speed: link.speed, linkUp: up, signalStr: signalInfo
        });
        t.linkedReceivedState.neighbors.push({
          id: s.id, name: s.name, model: s.model, ip: s.ip, mac: s.mac, category: s.category,
          localPort: link.tgtPort, peerPort: link.srcPort, cableType: link.cableType, speed: link.speed, linkUp: up, signalStr: signalInfo
        });
      });

      function isInfraCoreNode(n) {
        return !!(n && (n.category === 'core' || n.category === 'infra' || n.role === 'core'));
      }

      function nodeHasWanUplink(n) {
        if (!n) return false;
        return (studioState.links || []).some(l => {
          if (!isLinkOperational(l)) return false;
          const isSrc = l.srcId === n.id;
          const isTgt = l.tgtId === n.id;
          if (!isSrc && !isTgt) return false;
          const myPort = String(isSrc ? l.srcPort : l.tgtPort || '').toUpperCase();
          if (!myPort.includes('WAN')) return false;
          const peer = studioState.nodes.find(x => x.id === (isSrc ? l.tgtId : l.srcId));
          return !!(peer && (isInfraCoreNode(peer) || peer.category === 'gateway' || peer.category === 'router'));
        });
      }

      function findPrimaryGatewayNode() {
        return studioState.nodes.find(n => n.category === 'gateway' && n.power) ||
               studioState.nodes.find(n => n.category === 'gateway') ||
               studioState.nodes.find(n => n.category === 'router' && n.power) ||
               studioState.nodes.find(n => n.catalogKey === 'ax3000c' && n.power && nodeHasWanUplink(n)) ||
               studioState.nodes.find(n => n.catalogKey === 'ax3000c' && n.power && String(n.meshRole || (n.firmwareConfig && n.firmwareConfig.meshRole) || '').toLowerCase() === 'controller') ||
               studioState.nodes.find(n => !isInfraCoreNode(n) && n.category !== 'client' && n.power);
      }

      const gatewayNode = findPrimaryGatewayNode();
      const gwCfg = normalizeFirmwareConfigFields(Object.assign({}, (gatewayNode && gatewayNode.firmwareConfig) || {}), (gatewayNode && gatewayNode.ip) || '192.168.1.1');
      if (gatewayNode) {
        if (gatewayNode.catalogKey === 'ax3000c' && gatewayNode.ip === '192.168.1.200' && !gwCfg.hasKtvCustomConfig) {
          gatewayNode.ip = '192.168.100.1';
          gwCfg.lanIp = '192.168.100.1';
        }
        gatewayNode.firmwareConfig = gwCfg;
        gatewayNode.linkedReceivedState.syncMode = 'source';
      }
      const isKtvCustom = !!gwCfg.hasKtvCustomConfig;
      const gwIp = (gatewayNode && gatewayNode.ip) || gwCfg.lanIp || '192.168.1.1';

      // OLT -> Gateway / Controller optical or WAN uplink
      studioState.links.forEach(link => {
        if (!isLinkOperational(link)) return;
        const s = studioState.nodes.find(n => n.id === link.srcId);
        const t = studioState.nodes.find(n => n.id === link.tgtId);
        if (!s || !t) return;
        if (isInfraCoreNode(s) || isInfraCoreNode(t)) {
          const oltNode = isInfraCoreNode(s) ? s : t;
          const ontNode = isInfraCoreNode(s) ? t : s;
          const oltPort = isInfraCoreNode(s) ? link.srcPort : link.tgtPort;
          const ontPort = isInfraCoreNode(s) ? link.tgtPort : link.srcPort;
          const oCfg = normalizeFirmwareConfigFields(ontNode.firmwareConfig, ontNode.ip);
          ontNode.linkedReceivedState.upstreamSourceName = oltNode.name;
          ontNode.linkedReceivedState.upstreamSourceIp = oltNode.ip;
          ontNode.linkedReceivedState.upstreamSourceMac = oltNode.mac;
          ontNode.linkedReceivedState.upstreamPort = oltPort;
          ontNode.linkedReceivedState.localPort = ontPort;
          ontNode.linkedReceivedState.cableType = link.cableType;
          ontNode.linkedReceivedState.negotiatedSpeed = link.speed;
          ontNode.linkedReceivedState.opticalRxDbm = link.cableType === 'FIBER_SC' ? pon.rxDbm : null;
          ontNode.linkedReceivedState.opticalState = link.cableType === 'FIBER_SC' ? pon.stateLabel : null;
          ontNode.linkedReceivedState.assignedWanIp = '100.64.108.24 (PPPoE VLAN 35)';
          ontNode.linkedReceivedState.gatewayIp = oltNode.ip;
          ontNode.linkedReceivedState.syncedSsid = oCfg.ssid;
          ontNode.linkedReceivedState.syncedWpaKey = oCfg.wpaKey;
          ontNode.linkedReceivedState.syncedSecurityMode = oCfg.securityMode;
          ontNode.linkedReceivedState.syncedChannel = oCfg.channel;
          ontNode.linkedReceivedState.syncedBandwidth = oCfg.bandwidth;
          ontNode.linkedReceivedState.syncedSubnetMask = oCfg.subnetMask;
          ontNode.linkedReceivedState.syncedDhcpStart = oCfg.dhcpStart;
          ontNode.linkedReceivedState.syncedDhcpEnd = oCfg.dhcpEnd;
          ontNode.linkedReceivedState.syncedPrimaryDns = oCfg.primaryDns;
          ontNode.linkedReceivedState.syncedSecondaryDns = oCfg.secondaryDns;
          ontNode.linkedReceivedState.syncedLeaseTime = oCfg.leaseTime;
          ontNode.linkedReceivedState.syncedDhcpEnable = oCfg.dhcpEnable !== undefined ? oCfg.dhcpEnable : '1';
          ontNode.linkedReceivedState.syncedIspDns = oCfg.ispDns !== undefined ? oCfg.ispDns : '0';
          ontNode.linkedReceivedState.hasKtvCustomFromUpstream = !!oCfg.hasKtvCustomConfig;
        }
      });

      let syncedPairsCount = 0;
      if (gatewayNode && gatewayNode.power) {
        const visited = new Set([gatewayNode.id]);
        studioState.nodes.filter(isInfraCoreNode).forEach(c => visited.add(c.id));
        const allocatedIps = new Set([gwIp]);
        const queue = [gatewayNode];
        let hostOffset = 2;

        while (queue.length > 0) {
          const curr = queue.shift();
          const parentCfg = normalizeFirmwareConfigFields(Object.assign({}, curr.firmwareConfig || {}), curr.ip);
          const parentIp = parentCfg.lanIp || curr.ip;
          const parentPrefix = /^\d+\.\d+\.\d+\.\d+$/.test(parentIp) ? parentIp.split('.').slice(0, 3).join('.') : '192.168.1';
          const activeLinks = studioState.links.filter(l =>
            (l.srcId === curr.id || l.tgtId === curr.id) && isLinkOperational(l)
          );

          activeLinks.forEach(link => {
            const peerId = link.srcId === curr.id ? link.tgtId : link.srcId;
            if (visited.has(peerId)) return;
            const peer = studioState.nodes.find(n => n.id === peerId);
            if (!peer || isInfraCoreNode(peer)) return;
            visited.add(peerId);

            const currPort = link.srcId === curr.id ? link.srcPort : link.tgtPort;
            const peerPort = link.srcId === curr.id ? link.tgtPort : link.srcPort;
            const isWifiLink = link.cableType === 'WIFI_MESH';
            const isCv2Pair = (curr.catalogKey === 'ax3000c' && peer.catalogKey === 'ax3000c' && peer.category === 'ap');
            const isHv2Cv2Pair = (curr.catalogKey === 'ax3000hv2' && peer.catalogKey === 'ax3000c' && peer.category === 'ap');
            const wrongWanPort = !isWifiLink && (
              (isHv2Cv2Pair && String(peerPort || '').toUpperCase().includes('WAN')) ||
              (isCv2Pair && (String(peerPort || '').toUpperCase().includes('WAN') || String(currPort || '').toUpperCase().includes('WAN')))
            );
            const meshDisabledOnParent = (curr.catalogKey === 'ax3000hv2' || curr.catalogKey === 'ax3000c') &&
              curr.firmwareConfig && curr.firmwareConfig.meshEnabled === false;
            const treatAsRouterWan = ((isHv2Cv2Pair || isCv2Pair) ? false : isRouterModeNode(peer)) || wrongWanPort || meshDisabledOnParent;

            if (treatAsRouterWan) {
              // Router A -> Router B (Router mode): ONLY provision WAN from parentCfg; preserve Router B's own LAN & SSID!
              const ownCfg = normalizeFirmwareConfigFields(peer.firmwareConfig, peer.ip);
              let wanIp = ownCfg.wanIp;
              const wanValid = wanIp && /^\d+\.\d+\.\d+\.\d+$/.test(wanIp) &&
                wanIp.startsWith(parentPrefix + '.') && wanIp !== parentIp && !allocatedIps.has(wanIp);
              if (!wanValid) {
                let candidateOct = 2;
                while (allocatedIps.has(`${parentPrefix}.${candidateOct}`) || `${parentPrefix}.${candidateOct}` === parentIp) {
                  candidateOct++;
                }
                wanIp = `${parentPrefix}.${candidateOct}`;
              }
              allocatedIps.add(wanIp);

              ownCfg.wanIp = wanIp;
              ownCfg.wanMask = parentCfg.subnetMask;
              ownCfg.wanGateway = parentIp;
              ownCfg.wanDns1 = parentCfg.primaryDns || parentIp;
              ownCfg.wanDns2 = parentCfg.secondaryDns || '0.0.0.0';

              // User requirement (Scenario 2): When AP receives DHCP from ONT, to avoid subnet collision (192.168.1.1 on both WAN & LAN),
              // AP's internal LAN must automatically shift to 192.168.10.1!
              if (!ownCfg.lanIp || ownCfg.lanIp.startsWith(parentPrefix + '.') || ownCfg.lanIp === '192.168.1.1') {
                ownCfg.lanIp = '192.168.10.1';
                ownCfg.subnetMask = '255.255.255.0';
                ownCfg.dhcpStart = '192.168.10.10';
                ownCfg.dhcpEnd = '192.168.10.254';
                ownCfg.dhcpEnable = '1';
                peer.ip = '192.168.10.1';
              }

              peer.linkedReceivedState.syncMode = 'router_wan';
              peer.linkedReceivedState.upstreamSourceName = curr.name;
              peer.linkedReceivedState.upstreamSourceIp = curr.ip;
              peer.linkedReceivedState.upstreamSourceMac = curr.mac;
              peer.linkedReceivedState.upstreamPort = currPort;
              peer.linkedReceivedState.localPort = peerPort;
              peer.linkedReceivedState.cableType = link.cableType;
              peer.linkedReceivedState.negotiatedSpeed = link.speed;
              peer.linkedReceivedState.assignedWanIp = wanIp;
              peer.linkedReceivedState.gatewayIp = parentIp;
              peer.linkedReceivedState.syncedSsid = ownCfg.ssid;
              peer.linkedReceivedState.syncedWpaKey = ownCfg.wpaKey;
              peer.linkedReceivedState.syncedSecurityMode = ownCfg.securityMode;
              peer.linkedReceivedState.syncedChannel = ownCfg.channel;
              peer.linkedReceivedState.syncedBandwidth = ownCfg.bandwidth;
              peer.linkedReceivedState.syncedSubnetMask = ownCfg.subnetMask;
              peer.linkedReceivedState.syncedDhcpStart = ownCfg.dhcpStart;
              peer.linkedReceivedState.syncedDhcpEnd = ownCfg.dhcpEnd;
              peer.linkedReceivedState.syncedPrimaryDns = ownCfg.primaryDns;
              peer.linkedReceivedState.syncedSecondaryDns = ownCfg.secondaryDns;
              peer.linkedReceivedState.syncedLeaseTime = ownCfg.leaseTime;
              peer.linkedReceivedState.syncedDhcpEnable = ownCfg.dhcpEnable !== undefined ? ownCfg.dhcpEnable : '1';
              peer.linkedReceivedState.syncedIspDns = ownCfg.ispDns !== undefined ? ownCfg.ispDns : '0';
              peer.linkedReceivedState.hasKtvCustomFromUpstream = false;
            } else {
              // AP Mesh / Switch / Repeater / Client: full LAN, DHCP, DNS, Wi-Fi inheritance from upstream parentCfg
              if (readdressSubnet && parentPrefix && /^\d+\.\d+\.\d+$/.test(parentPrefix) && peer.category !== 'core') {
                const peerParts = (peer.ip || '').split('.');
                let lastOctet = parseInt(peerParts[3], 10);
                let candIp = (lastOctet && lastOctet > 1) ? `${parentPrefix}.${lastOctet}` : '';
                if (!candIp || candIp === parentIp || allocatedIps.has(candIp)) {
                  if (peer.category === 'client') {
                    lastOctet = 10 + hostOffset++;
                  } else if (peer.category === 'ap') {
                    lastOctet = 100;
                    while (allocatedIps.has(`${parentPrefix}.${lastOctet}`) || `${parentPrefix}.${lastOctet}` === parentIp) lastOctet++;
                  } else {
                    lastOctet = hostOffset++;
                  }
                  while (allocatedIps.has(`${parentPrefix}.${lastOctet}`) || `${parentPrefix}.${lastOctet}` === parentIp) lastOctet++;
                  candIp = `${parentPrefix}.${lastOctet}`;
                }
                allocatedIps.add(candIp);
                peer.ip = candIp;
                peer.firmwareConfig.lanIp = candIp;
              }

              peer.firmwareConfig.ssid = parentCfg.ssid;
              peer.firmwareConfig.ssid5g = parentCfg.ssid5g || parentCfg.ssid;
              peer.firmwareConfig.wpaKey = parentCfg.wpaKey;
              peer.firmwareConfig.password = parentCfg.wpaKey;
              peer.firmwareConfig.password5g = parentCfg.password5g || parentCfg.wpaKey;
              peer.firmwareConfig.securityMode = parentCfg.securityMode;
              peer.firmwareConfig.security2g = parentCfg.security2g || parentCfg.securityMode;
              peer.firmwareConfig.security5g = parentCfg.security5g || parentCfg.securityMode;
              if (parentCfg.hideSsid2g !== undefined) peer.firmwareConfig.hideSsid2g = parentCfg.hideSsid2g;
              if (parentCfg.hideSsid5g !== undefined) peer.firmwareConfig.hideSsid5g = parentCfg.hideSsid5g;
              if (parentCfg.vapDiffMode !== undefined) peer.firmwareConfig.vapDiffMode = parentCfg.vapDiffMode;
              if (parentCfg.wifi2gDisabled !== undefined) peer.firmwareConfig.wifi2gDisabled = parentCfg.wifi2gDisabled;
              if (parentCfg.wifi5gDisabled !== undefined) peer.firmwareConfig.wifi5gDisabled = parentCfg.wifi5gDisabled;
              if (peer.category === 'ap') {
                peer.meshRole = 'Agent';
                peer.firmwareConfig.meshRole = 'Agent';
              }
              peer.firmwareConfig.channel = parentCfg.channel;
              peer.firmwareConfig.bandwidth = parentCfg.bandwidth;
              peer.firmwareConfig.subnetMask = parentCfg.subnetMask;
              peer.firmwareConfig.netmask = parentCfg.subnetMask;
              peer.firmwareConfig.dhcpStart = parentCfg.dhcpStart;
              peer.firmwareConfig.dhcpStartIp = parentCfg.dhcpStart;
              peer.firmwareConfig.dhcpEnd = parentCfg.dhcpEnd;
              peer.firmwareConfig.dhcpEndIp = parentCfg.dhcpEnd;
              peer.firmwareConfig.primaryDns = parentCfg.primaryDns;
              peer.firmwareConfig.dns1 = parentCfg.primaryDns;
              peer.firmwareConfig.secondaryDns = parentCfg.secondaryDns;
              peer.firmwareConfig.dns2 = parentCfg.secondaryDns;
              peer.firmwareConfig.leaseTime = parentCfg.leaseTime;
              peer.firmwareConfig.dhcpLease = parentCfg.leaseTime;
              peer.firmwareConfig.dhcpEnable = parentCfg.dhcpEnable !== undefined ? parentCfg.dhcpEnable : '1';
              peer.firmwareConfig.ispDns = parentCfg.ispDns !== undefined ? parentCfg.ispDns : '0';
              peer.firmwareConfig.hasKtvCustomConfig = isKtvCustom || !!parentCfg.hasKtvCustomConfig;

              peer.linkedReceivedState.syncMode = (peer.category === 'client') ? 'client' : 'ap_mesh';
              peer.linkedReceivedState.upstreamSourceName = curr.name;
              peer.linkedReceivedState.upstreamSourceIp = curr.ip;
              peer.linkedReceivedState.upstreamSourceMac = curr.mac;
              peer.linkedReceivedState.upstreamPort = currPort;
              peer.linkedReceivedState.localPort = peerPort;
              peer.linkedReceivedState.cableType = link.cableType;
              peer.linkedReceivedState.negotiatedSpeed = link.speed;
              peer.linkedReceivedState.syncedSsid = parentCfg.ssid;
              peer.linkedReceivedState.syncedWpaKey = parentCfg.wpaKey;
              peer.linkedReceivedState.syncedSecurityMode = parentCfg.securityMode;
              peer.linkedReceivedState.syncedChannel = parentCfg.channel;
              peer.linkedReceivedState.syncedBandwidth = parentCfg.bandwidth;
              peer.linkedReceivedState.syncedSubnetMask = parentCfg.subnetMask;
              peer.linkedReceivedState.syncedDhcpStart = parentCfg.dhcpStart;
              peer.linkedReceivedState.syncedDhcpEnd = parentCfg.dhcpEnd;
              peer.linkedReceivedState.syncedPrimaryDns = parentCfg.primaryDns;
              peer.linkedReceivedState.syncedSecondaryDns = parentCfg.secondaryDns;
              peer.linkedReceivedState.syncedLeaseTime = parentCfg.leaseTime;
              peer.linkedReceivedState.syncedDhcpEnable = peer.firmwareConfig.dhcpEnable;
              peer.linkedReceivedState.syncedIspDns = peer.firmwareConfig.ispDns;
              peer.linkedReceivedState.hasKtvCustomFromUpstream = isKtvCustom || !!parentCfg.hasKtvCustomConfig;
              peer.linkedReceivedState.assignedWanIp = peer.ip;
              peer.linkedReceivedState.gatewayIp = parentIp;
            }

            if (link.cableType === 'WIFI_MESH') {
              const wf = calculateWifiLinkPhysics(curr, peer);
              peer.linkedReceivedState.wifiRssiDbm = wf.rssiDbm;
              peer.linkedReceivedState.negotiatedSpeed = wf.phyRateMbps;
            }

            if (typeof updateNodeNetworkStackFromConfig === 'function') {
              updateNodeNetworkStackFromConfig(peer);
            }
            syncedPairsCount++;
            queue.push(peer);
          });
        }
      }

      const ribbonTxt = document.getElementById('auto-sync-ribbon-text');
      if (ribbonTxt) {
        ribbonTxt.textContent = isKtvCustom
          ? `Auto-Sync (A➔B): Đã áp dụng cấu hình KTV (${syncedPairsCount} liên kết)`
          : `Auto-Sync Cáp (A➔B): BẬT (${syncedPairsCount} liên kết)`;
      }

      return syncedPairsCount;
    }

    // Layer 3A: Force DOM & Text Overwrite inside Firmware B (and preserve custom overrides on Firmware A)
    function injectLinkedStateIntoFirmwareDom(iframe, node) {
      if (!iframe || !node || !node.linkedReceivedState) return;
      try {
        const doc = (iframe && iframe.nodeType === 9) ? iframe : (iframe.contentDocument || (iframe.contentWindow && iframe.contentWindow.document));
        if (!doc) return;
        if (doc.querySelectorAll && doc.querySelectorAll('frame').length > 0) {
          doc.querySelectorAll('frame').forEach(frm => {
            try {
              const childDoc = frm.contentDocument || (frm.contentWindow && frm.contentWindow.document);
              if (childDoc && childDoc.body && !isLoginPageDoc(childDoc)) {
                injectLinkedStateIntoFirmwareDom(childDoc, node);
              }
            } catch (_) {}
          });
        }
        if (!doc.body || doc.body.tagName === 'FRAMESET' || isLoginPageDoc(doc)) return;

        const st = node.linkedReceivedState;
        const cfg = node.firmwareConfig || {};
        const effectiveSsid = st.syncedSsid || cfg.ssid || 'FPT_Telecom_WiFi7';
        const effectiveKey = st.syncedWpaKey || cfg.wpaKey || '12345678';
        const effectiveMask = st.syncedSubnetMask || cfg.subnetMask || '255.255.255.0';
        const effectiveGw = st.gatewayIp || node.ip;
        const gwPrefix = effectiveGw.split('.').slice(0, 3).join('.');
        const effectiveDhcpStart = st.syncedDhcpStart || cfg.dhcpStart || `${gwPrefix}.2`;
        const effectiveDhcpEnd = st.syncedDhcpEnd || cfg.dhcpEnd || `${gwPrefix}.254`;
        const effectivePrimaryDns = st.syncedPrimaryDns || cfg.primaryDns || effectiveGw;
        const effectiveSecondaryDns = st.syncedSecondaryDns || cfg.secondaryDns || '0.0.0.0';
        const effectiveLeaseTime = st.syncedLeaseTime || cfg.leaseTime || '86400';

        // AX3000HV2 and AX3000Cv2 render authoritative per-band 2.4G/5G Host SSID state directly
        // from their Python backends (server2.py & ubus wifi_get); never clobber their inputs with
        // single-band DOM heuristics.
        const isButtonInput = (el) => {
          if (!el) return false;
          const t = String(el.type || '').toLowerCase();
          const tag = String(el.tagName || '').toUpperCase();
          return tag === 'BUTTON' || (tag === 'INPUT' && (t === 'button' || t === 'submit' || t === 'reset'));
        };
        const skipDomInputOverwrite = (
          node.catalogKey === 'ax3000hv2' ||
          node.catalogKey === 'ax3000c' ||
          node.catalogKey === 'ax3000gz_v2' ||
          node.catalogKey === 'ax3000gz' ||
          node.catalogKey === 'ax3000s' ||
          node.catalogKey === 'ax1800gz'
        );

        // 0. Restore any customFieldMap entries edited by KTV on this device so static HTML never resets them
        if (!skipDomInputOverwrite && cfg.customFieldMap && typeof cfg.customFieldMap === 'object') {
          Object.keys(cfg.customFieldMap).forEach(fieldKey => {
            const customVal = cfg.customFieldMap[fieldKey];
            const el = doc.getElementById(fieldKey) || doc.querySelector(`[name="${fieldKey}"]`);
            if (el) {
              if (isOctetSplitInput(el) && !/^\d{1,3}$/.test(String(customVal || '').trim())) return;
              if (el.type === 'checkbox') el.checked = !!customVal;
              else if (doc.activeElement !== el) el.value = customVal;
            }
          });
        }

        // 1. Force-overwrite SSID inputs inside Firmware DOM
        if (!skipDomInputOverwrite) {
        const ssidSelectors = [
          '#Txt_SSID', '#SSID', '#essid', '#wlan_ssid', '#Frm_SSID', '#ssid_2g', '#ssid_5g',
          'input[name*="ssid" i]', 'input[id*="ssid" i]', 'input[placeholder*="SSID" i]',
          '[data-ftc-nhan*="SSID" i] input', '[data-ftc-nhan*="Wi-Fi" i] input',
          '[name="cbid.wireless.default_radio0.ssid"]', '[name="cbid.wireless.default_radio1.ssid"]',
          '[name="wlSsid"]', '[name="wlanSsid"]', '[name="2G_SSID"]', '[name="5G_SSID"]',
          'input[id*="wlSsid" i]', 'input[id*="wlanSsid" i]', '#wifi_ssid', '#wireless_ssid'
        ];
        ssidSelectors.forEach(sel => {
          doc.querySelectorAll(sel).forEach(el => {
            if (el && el.tagName === 'INPUT' && !isButtonInput(el) && el.type !== 'checkbox' && el.type !== 'radio') {
              if (doc.activeElement !== el && el.value !== effectiveSsid) {
                el.value = effectiveSsid;
                try {
                  el.dispatchEvent(new Event('input', { bubbles: true }));
                  el.dispatchEvent(new Event('change', { bubbles: true }));
                } catch (_) {}
              }
              el.style.boxShadow = '0 0 0 2px rgba(16, 185, 129, 0.5)';
              el.title = `Đồng bộ tự động từ ${st.upstreamSourceName || node.name}: SSID=${effectiveSsid}`;
            }
          });
        });

        // 2. Force-overwrite WPA Password / Passphrase inputs inside Firmware DOM
        const keySelectors = [
          '#Pwd_WpaPsk', '#wpa_key', '#pskValue', '#KeyPassphrase', '#Frm_KeyPassphrase',
          '#HiddenKeyPass', '#VisibleKeyPass', '#PreSharedKey1', '#PreSharedKey',
          '#security_wpa_key', 'input[id*="security_wpa_key" i]', 'input[name*="security_wpa_key" i]',
          'input[id*="HiddenKeyPass" i]', 'input[id*="VisibleKeyPass" i]', 'input[id*="KeyPassphrase" i]',
          'input[name*="KeyPassphrase" i]',
          'input[name*="passphrase" i]', 'input[id*="passphrase" i]', 'input[placeholder*="passphrase" i]',
          'input[name*="keypass" i]', 'input[id*="keypass" i]',
          'input[name*="preshared" i]', 'input[id*="preshared" i]',
          'input[id*="wpa" i]', 'input[id*="psk" i]',
          'input[name*="wpa_key" i]', 'input[name*="wpakey" i]',
          '[name="cbid.wireless.default_radio0.key"]', '[name="cbid.wireless.default_radio1.key"]',
          '[data-ftc-nhan*="Passphrase" i] input', '[data-ftc-nhan*="Mật khẩu" i] input', '[data-ftc-nhan*="WPA" i] input',
          '#wifi_password', '#wireless_password',
          'input[placeholder*="mật khẩu" i]', 'input[placeholder*="password" i]',
          'input[name*="password" i]:not([type="hidden"])'
        ];
        keySelectors.forEach(sel => {
          doc.querySelectorAll(sel).forEach(el => {
            if (el && el.tagName === 'INPUT' && !isButtonInput(el) && (el.type === 'text' || el.type === 'password' || el.type === 'hidden')) {
              const idLower = (el.id || el.name || '').toLowerCase();
              if (!idLower.includes('login') && !idLower.includes('admin') && !idLower.includes('oldpass') && !idLower.includes('newpass') && !idLower.includes('luci_username') && doc.activeElement !== el) {
                if (el.value !== effectiveKey) {
                  el.value = effectiveKey;
                  try {
                    el.dispatchEvent(new Event('input', { bubbles: true }));
                    el.dispatchEvent(new Event('change', { bubbles: true }));
                  } catch (_) {}
                }
                if (el.type !== 'hidden') {
                  el.style.boxShadow = '0 0 0 2px rgba(16, 185, 129, 0.45)';
                  el.title = `Đồng bộ tự động từ ${st.upstreamSourceName || node.name}: WPA-Key=${effectiveKey}`;
                }
              }
            }
          });
        });

        // 3A. Force-overwrite 4-octet split IPv4 & DHCP Server inputs (ZTE BE12000Z / BE15000Z lanMgrIpv4.html)
        const targetLanIpForDhcpForm = (st.upstreamSourceName && st.syncMode !== 'router_wan') ? effectiveGw : node.ip;
        writeOctetIpToDoc(doc, 'sub_IPAddr', ':DHCPBasicCfg', targetLanIpForDhcpForm, ['IPAddr:DHCPBasicCfg', 'IF_URL_HOST']);
        writeOctetIpToDoc(doc, 'sub_SubMask', '', effectiveMask, ['SubMask', 'SubnetMask']);
        writeOctetIpToDoc(doc, 'sub_MinAddress', ':DHCPBasicCfg', effectiveDhcpStart, ['MinAddress:DHCPBasicCfg']);
        writeOctetIpToDoc(doc, 'sub_MaxAddress', ':DHCPBasicCfg', effectiveDhcpEnd, ['MaxAddress:DHCPBasicCfg']);
        writeOctetIpToDoc(doc, 'sub_DNSServer1', '', effectivePrimaryDns, ['DNSServer1']);
        writeOctetIpToDoc(doc, 'sub_DNSServer2', '', effectiveSecondaryDns, ['DNSServer2']);

        const leaseEl = doc.getElementById('LeaseTimeSelfDefine');
        if (leaseEl && doc.activeElement !== leaseEl) leaseEl.value = effectiveLeaseTime;
        const hiddenLeaseEl = doc.getElementById('LeaseTime');
        if (hiddenLeaseEl) hiddenLeaseEl.value = effectiveLeaseTime;

        // 3B. Force-overwrite single-input LAN / WAN IP, Subnet Mask, and Default Gateway inputs (non-octet fields only!)
        const ipSelectors = [
          '#ethIpAddress', '#lan_ip', '#ipaddr', '#Frm_LanIp', 'input[name*="lan_ip" i]', 'input[id*="lanip" i]',
          'input[name="cbid.network.lan.ipaddr"]', 'input[name="ip"]', 'input[id="ip"]',
          'input[name="lan_ipaddr"]', 'input[id="lan_ipaddr"]', 'input[name="ipaddr"]'
        ];
        ipSelectors.forEach(sel => {
          doc.querySelectorAll(sel).forEach(el => {
            if (el && el.tagName === 'INPUT' && !isOctetSplitInput(el) && doc.activeElement !== el) {
              el.value = node.ip;
              el.style.boxShadow = '0 0 0 2px rgba(56, 189, 248, 0.5)';
            }
          });
        });

        const maskSelectors = [
          '#ethSubnetMask', '#netmask', '#subnet_mask', '#Frm_SubMask', 'input[name="cbid.network.lan.netmask"]',
          'input[name="netmask"]', 'input[id="netmask"]', 'input[name*="mask" i]',
          'input[name="lan_netmask"]', 'input[id="lan_netmask"]'
        ];
        maskSelectors.forEach(sel => {
          doc.querySelectorAll(sel).forEach(el => {
            if (el && el.tagName === 'INPUT' && !isOctetSplitInput(el) && doc.activeElement !== el) {
              el.value = effectiveMask;
            }
          });
        });

        // 3C. Single DHCP fields & DHCP server enable radio buttons
        const effectiveDhcpEnable = st.syncedDhcpEnable !== null && st.syncedDhcpEnable !== undefined ? String(st.syncedDhcpEnable) : String(cfg.dhcpEnable !== undefined ? cfg.dhcpEnable : '1');
        const radDhcpDis = doc.getElementById('dhcpSrvType1') || doc.querySelector('input[name="dhcpSrvType"][value="0"]') || doc.querySelector('input[name="dhcp_enable"][value="0"]');
        const radDhcpEn = doc.getElementById('dhcpSrvType2') || doc.querySelector('input[name="dhcpSrvType"][value="1"]') || doc.querySelector('input[name="dhcp_enable"][value="1"]');
        if (effectiveDhcpEnable === '0') {
          if (radDhcpDis) radDhcpDis.checked = true;
          if (radDhcpEn) radDhcpEn.checked = false;
        } else if (effectiveDhcpEnable === '1') {
          if (radDhcpEn) radDhcpEn.checked = true;
          if (radDhcpDis) radDhcpDis.checked = false;
        }

        doc.querySelectorAll('#dhcpEthStart, #dhcp_start, input[name*="dhcp_start" i], input[id*="dhcp_start" i]').forEach(el => {
          if (el && !isOctetSplitInput(el) && doc.activeElement !== el) el.value = effectiveDhcpStart;
        });
        doc.querySelectorAll('#dhcpEthEnd, #dhcp_end, input[name*="dhcp_end" i], input[id*="dhcp_end" i]').forEach(el => {
          if (el && !isOctetSplitInput(el) && doc.activeElement !== el) el.value = effectiveDhcpEnd;
        });
        doc.querySelectorAll('#dnsPrimary, #dns1, input[name*="primary_dns" i]').forEach(el => {
          if (el && !isOctetSplitInput(el) && doc.activeElement !== el) el.value = effectivePrimaryDns;
        });
        doc.querySelectorAll('#dnsSecondary, #dns2, input[name*="secondary_dns" i]').forEach(el => {
          if (el && !isOctetSplitInput(el) && doc.activeElement !== el) el.value = effectiveSecondaryDns;
        });
        doc.querySelectorAll('#dhcpLeasedTime').forEach(el => {
          if (el && doc.activeElement !== el) el.value = effectiveLeaseTime;
        });

        // 3D. Force-overwrite WAN IP inputs if in router_wan mode
        if (st.assignedWanIp) {
          const rawWan = st.assignedWanIp.split(' ')[0];
          const wanSelectors = [
            '#wan_ip', '#wanip', 'input[name*="wan_ip" i]', 'input[id*="wanip" i]',
            'input[name="cbid.network.wan.ipaddr"]', 'input[name="wan_ipaddr"]', 'input[id="wan_ipaddr"]'
          ];
          wanSelectors.forEach(sel => {
            doc.querySelectorAll(sel).forEach(el => {
              if (el && el.tagName === 'INPUT' && !isOctetSplitInput(el) && doc.activeElement !== el) {
                el.value = rawWan;
                el.style.boxShadow = '0 0 0 2px rgba(245, 158, 11, 0.5)';
              }
            });
          });
        }

        const gwSelectors = [
          '#gateway', '#def_gw', '#default_gateway', 'input[name*="gateway" i]', 'input[id*="gateway" i]'
        ];
        gwSelectors.forEach(sel => {
          doc.querySelectorAll(sel).forEach(el => {
            if (el && el.tagName === 'INPUT' && !isOctetSplitInput(el) && doc.activeElement !== el) {
              el.value = effectiveGw;
              el.style.boxShadow = '0 0 0 2px rgba(56, 189, 248, 0.45)';
            }
          });
        });

        // 4. Force-overwrite static text nodes in Status / Overview / Topology tables so pre-existing HTML defaults
        // (such as H6701Q_99A2, ZTE_WIFI7, FPT_Telecom, or old 192.168.1.x IPs) change to KTV's new configuration!
        const isZteMeshDemo = (node.catalogKey === 'be12000' || node.catalogKey === 'be15000');
        const firstApNeighbor = st.neighbors.find(nb => nb.category === 'ap' || nb.category === 'switch');
        const walker = doc.createTreeWalker(doc.body, NodeFilter.SHOW_TEXT, null, false);
        let txtNode;
        while ((txtNode = walker.nextNode())) {
          const parentTag = txtNode.parentNode && txtNode.parentNode.tagName;
          if (parentTag === 'SCRIPT' || parentTag === 'STYLE' || (txtNode.parentNode && txtNode.parentNode.id === 'fpt-injected-fw-banner')) {
            continue;
          }
          let val = txtNode.nodeValue;
          if (!val || !val.trim()) continue;
          let changed = false;

          if (firstApNeighbor && val.includes('H6701Q_99A2')) {
            val = val.replace(/H6701Q_99A2/g, `${firstApNeighbor.name} (${firstApNeighbor.ip})`);
            changed = true;
          }
          // Replace pre-existing static default SSIDs in status tables with KTV's new SSID
          const staticDefaultSsids = [
            'FPT_BE12000_WIFI7', 'FPT_Telecom_WiFi7', 'ZTE_WIFI7_5G', 'ZTE_2.4G', 'ZTE_5G',
            'FPT-Telecom-A34C', 'FPT_AX3000S', 'FPT_AX3000C', 'FPT_AC1000F', 'FPT_Vigor2927',
            'FPT_MikroTik', 'FPT_BE6500C', 'FPT_AX1800GZ', 'FPT_AC1000Z', cfg.initialDefaultSsid
          ].filter(Boolean);
          for (const oldSsid of staticDefaultSsids) {
            if (oldSsid !== effectiveSsid && val.includes(oldSsid)) {
              val = val.split(oldSsid).join(effectiveSsid);
              changed = true;
            }
          }
          // Replace pre-existing default IP on this device if KTV re-addressed the subnet
          if (cfg.initialDefaultIp && cfg.initialDefaultIp !== node.ip && val.includes(cfg.initialDefaultIp)) {
            val = val.split(cfg.initialDefaultIp).join(node.ip);
            changed = true;
          }
          if (changed) {
            txtNode.nodeValue = val;
          }
        }
        } // end if (!skipDomInputOverwrite)

        // 5. Inject or update the live hardware link status banner inside the Firmware iframe top area
        // Skip injecting inside <frame> children of a <frameset> (e.g. AX3000HV2 header/nav/main frames)
        // because a fixed-height header frame gets clipped and hides top navigation tabs like "Network".
        const isFramesetChild = !!(
          doc.defaultView &&
          doc.defaultView.frameElement &&
          String(doc.defaultView.frameElement.tagName || '').toUpperCase() === 'FRAME'
        );
        let banner = doc.getElementById('fpt-injected-fw-banner');
        if (isFramesetChild || window._isEmbeddedPortalLesson) {
          if (banner && banner.parentNode) banner.parentNode.removeChild(banner);
          return;
        }
        if (!banner) {
          banner = doc.createElement('div');
          banner.id = 'fpt-injected-fw-banner';
          banner.style.cssText = 'background:linear-gradient(90deg,#064e3b,#0f172a);color:#ecfdf5;padding:6px 14px;font-family:Segoe UI,sans-serif;font-size:11.5px;border-bottom:2px solid #10b981;display:flex;align-items:center;justify-content:space-between;gap:10px;z-index:9999;position:relative;';
          doc.body.insertBefore(banner, doc.body.firstChild);
        }

        const customTag = (st.hasKtvCustomFromUpstream || cfg.hasKtvCustomConfig)
          ? `<span style="background:#f59e0b;color:#0f172a;font-weight:800;padding:1px 6px;border-radius:4px;font-size:9.5px;margin-left:6px;">✨ ĐÃ GHI ĐÈ THEO CẤU HÌNH KTV</span>`
          : '';

        if (st.upstreamSourceName) {
          const speedStr = st.negotiatedSpeed >= 1000 ? (st.negotiatedSpeed / 1000) + ' Gbps' : st.negotiatedSpeed + ' Mbps';
          const phyExtra = st.opticalRxDbm !== null
            ? ` • Quang Rx: <b>${st.opticalRxDbm.toFixed(2)} dBm</b>`
            : (st.wifiRssiDbm !== null ? ` • Sóng RSSI: <b>${st.wifiRssiDbm} dBm</b>` : '');
          banner.innerHTML = `
            <div>
              🟢 <b>TỰ ĐỘNG ĐỒNG BỘ QUA DÂY CÁP (${st.upstreamSourceName} [${st.upstreamPort}] ➔ ${node.name} [${st.localPort}]):</b>
              SSID: <b style="color:#34d399;">${effectiveSsid}</b> •
              IP mới: <b style="color:#38bdf8;">${node.ip}</b> (GW: ${st.gatewayIp || '—'}) •
              Tốc độ: <b>${speedStr}</b>${phyExtra}${customTag}
            </div>
            <span style="font-size:10px;background:rgba(16,185,129,0.25);padding:2px 7px;border-radius:4px;border:1px solid #34d399;white-space:nowrap;">⚡ Auto-Synced ${st.syncedAt || ''}</span>
          `;
        } else if (st.neighbors.length > 0) {
          const upCount = st.neighbors.filter(n => n.linkUp).length;
          banner.innerHTML = `
            <div>
              🔵 <b>THIẾT BỊ NGUỒN A (${node.name} — ${node.ip}):</b>
              SSID: <b style="color:#34d399;">${effectiveSsid}</b> •
              Tự động truyền sang <b>${upCount}/${st.neighbors.length}</b> thiết bị B đang nối dây cáp${customTag}
            </div>
            <span style="font-size:10px;background:rgba(56,189,248,0.2);padding:2px 7px;border-radius:4px;border:1px solid #38bdf8;">🟢 Auto-Sync Active</span>
          `;
        } else {
          banner.innerHTML = `
            <div style="color:#fca5a5;">
              🔴 <b>CHƯA CẮM DÂY CÁP (STANDALONE / LINK DOWN):</b> Thiết bị <b>${node.name}</b> hiện chưa nhận tín hiệu từ thiết bị nguồn.
            </div>
            <span style="font-size:10px;background:rgba(239,68,68,0.25);padding:2px 7px;border-radius:4px;border:1px solid #ef4444;">No Link</span>
          `;
        }
      } catch (_) {}
    }

    // Layer 3B: Render the floating Cross-Device Link Synchronization Overlay Card (#fw-link-sync-overlay)
    function renderFwLinkSyncOverlay(node, slot = 1) {
      if (window._isEmbeddedPortalLesson) {
        const ov = getSlotEl('fw-link-sync-overlay', slot);
        if (ov) ov.style.display = 'none';
        return;
      }
      const bodyEl = getSlotEl('fw-link-sync-body', slot);
      const titleEl = getSlotEl('fw-link-sync-title', slot);
      if (!bodyEl || !node) return;

      const st = node.linkedReceivedState || { neighbors: [] };
      const cfg = node.firmwareConfig || {};
      const effectiveSsid = st.syncedSsid || cfg.ssid || 'FPT_Telecom_WiFi7';
      const effectiveBw = st.syncedBandwidth || cfg.bandwidth || '320MHz';
      const isCustom = !!(st.hasKtvCustomFromUpstream || cfg.hasKtvCustomConfig);

      if (titleEl) {
        titleEl.textContent = `🔗 Liên Kết Tự Động: ${node.name} (${node.ip})`;
      }

      const customBadge = isCustom
        ? `<div style="margin-bottom:4px;padding:2px 6px;background:rgba(245,158,11,0.18);border:1px solid #f59e0b;border-radius:4px;color:#fcd34d;font-size:9.5px;font-weight:800;">✨ Đang áp dụng thông số tùy chỉnh của KTV từ Thiết bị A</div>`
        : '';

      const upstreamHtml = st.upstreamSourceName
        ? (st.syncMode === 'router_wan'
          ? `
          <div style="margin-bottom:6px;padding:5px 7px;background:rgba(245,158,11,0.12);border:1px solid rgba(245,158,11,0.45);border-radius:6px;">
            <div style="font-weight:800;color:#fbbf24;font-size:10px;margin-bottom:3px;">🛣️ ROUTER ĐỘC LẬP — CHỈ NHẬN WAN TỪ A (A ➔ B)</div>
            <div class="fw-sync-kv"><span>Thiết bị A (Upstream):</span><span class="val">${st.upstreamSourceName} (${st.upstreamSourceIp})</span></div>
            <div class="fw-sync-kv"><span>WAN IP / WAN GW:</span><span class="val good">${st.assignedWanIp || cfg.wanIp || '—'} / GW ${st.gatewayIp || '—'}</span></div>
            <div class="fw-sync-kv"><span>LAN & SSID riêng (giữ nguyên):</span><span class="val">${node.ip} • ${effectiveSsid}</span></div>
          </div>
        `
          : `
          <div style="margin-bottom:6px;padding:5px 7px;background:rgba(16,185,129,0.12);border:1px solid rgba(16,185,129,0.35);border-radius:6px;">
            <div style="font-weight:800;color:#34d399;font-size:10px;margin-bottom:3px;">📥 TỰ ĐỘNG NHẬN TỪ THIẾT BỊ A (A ➔ B)</div>
            ${customBadge}
            <div class="fw-sync-kv"><span>Thiết bị A (Nguồn):</span><span class="val">${st.upstreamSourceName} (${st.upstreamSourceIp})</span></div>
            <div class="fw-sync-kv"><span>Cổng đấu nối:</span><span class="val good">${st.upstreamPort} ➔ ${st.localPort} (${st.negotiatedSpeed >= 1000 ? (st.negotiatedSpeed/1000)+'G' : st.negotiatedSpeed+'M'})</span></div>
            <div class="fw-sync-kv"><span>SSID đồng bộ:</span><span class="val good">${effectiveSsid} (${effectiveBw})</span></div>
            <div class="fw-sync-kv"><span>IP / Default GW:</span><span class="val">${node.ip} / GW ${st.gatewayIp || '—'}</span></div>
            ${st.opticalRxDbm !== null ? `<div class="fw-sync-kv"><span>Công suất Quang Rx:</span><span class="val ${st.opticalRxDbm < -27 ? 'warn' : 'good'}">${st.opticalRxDbm.toFixed(2)} dBm (${st.opticalState})</span></div>` : ''}
            ${st.wifiRssiDbm !== null ? `<div class="fw-sync-kv"><span>Cường độ Wi-Fi RSSI:</span><span class="val">${st.wifiRssiDbm} dBm</span></div>` : ''}
          </div>
        `)
        : `
          <div style="margin-bottom:6px;padding:5px 7px;background:rgba(56,189,248,0.1);border:1px solid rgba(56,189,248,0.3);border-radius:6px;">
            <div style="font-weight:800;color:#38bdf8;font-size:10px;margin-bottom:2px;">📡 THIẾT BỊ NGUỒN A: ${node.roleLabel.toUpperCase()}</div>
            ${customBadge}
            <div class="fw-sync-kv"><span>IP Quản trị (LAN):</span><span class="val">${node.ip}</span></div>
            <div class="fw-sync-kv"><span>SSID đang phát:</span><span class="val good">${effectiveSsid} (${effectiveBw})</span></div>
          </div>
        `;

      const neighborsRows = (st.neighbors && st.neighbors.length > 0)
        ? st.neighbors.map(nb => `
            <div class="fw-sync-kv">
              <span>${nb.linkUp ? '🟢' : '🔴'} <b>${nb.localPort}</b> ↔ ${nb.name}:</span>
              <span class="val ${nb.linkUp ? 'good' : 'bad'}">${nb.ip} (${nb.signalStr})</span>
            </div>
          `).join('')
        : `<div style="color:#94a3b8;font-size:9.5px;padding:3px 0;">Chưa có dây cáp nào cắm vào thiết bị này.</div>`;

      bodyEl.innerHTML = `
        ${upstreamHtml}
        <div style="font-weight:800;color:#cbd5e1;font-size:9.5px;margin:4px 0 2px;">🔌 DANH SÁCH CỔNG & THIẾT BỊ KẾT NỐI (${(st.neighbors || []).length}):</div>
        ${neighborsRows}
      `;
    }

    // Layer 3C: Push live canvas topology & synced parameters to Python backend across all 16 simulators
    async function syncTopologyNodesToBackend(sourceNodeId = null, preferBackendSource = false) {
      const cfgSsid = document.getElementById('cfg-wifi-ssid');
      const cfgKey = document.getElementById('cfg-wifi-key');
      const gwNode = studioState.nodes.find(n => n.category === 'gateway' && n.power) ||
                     studioState.nodes.find(n => n.category === 'gateway') ||
                     studioState.nodes.find(n => n.category === 'router' && n.power) ||
                     studioState.nodes.find(n => n.catalogKey === 'ax3000c' && n.power && String(n.meshRole || (n.firmwareConfig && n.firmwareConfig.meshRole) || '').toLowerCase() === 'controller') ||
                     studioState.nodes.find(n => n.catalogKey === 'ax3000c' && n.power);
      const fwCfg = normalizeFirmwareConfigFields(Object.assign({}, (gwNode && gwNode.firmwareConfig) || {}), (gwNode && gwNode.ip) || '192.168.1.1');
      const ssid = fwCfg.ssid || (cfgSsid && cfgSsid.value.trim()) || 'FPT_Telecom_WiFi7';
      const key = fwCfg.wpaKey || (cfgKey && cfgKey.value.trim()) || '12345678';
      const gwIp = (gwNode && gwNode.ip) || fwCfg.lanIp || '192.168.1.1';

      const slaves = studioState.nodes
        .filter(n => (n.category === 'ap' || n.category === 'switch' || n.category === 'router') && n.id !== (gwNode && gwNode.id) && n.power && n.linkedReceivedState && n.linkedReceivedState.upstreamSourceName)
        .map(n => ({
          nodeId: n.id,
          name: n.name,
          model: n.model,
          mac: n.mac,
          ip: n.ip,
          backhaul: n.linkedReceivedState.cableType === 'WIFI_MESH' ? 'Wi-Fi (MLO)' : 'Ethernet',
          speed_mbps: n.linkedReceivedState.negotiatedSpeed || 2500,
          rssi: n.linkedReceivedState.wifiRssiDbm || -25,
          upstream_port: n.linkedReceivedState.upstreamPort,
          local_port: n.linkedReceivedState.localPort
        }));

      const clients = studioState.nodes
        .filter(n => n.category === 'client' && n.power && n.linkedReceivedState && n.linkedReceivedState.upstreamSourceName)
        .map(n => ({
          nodeId: n.id,
          name: n.name,
          mac: n.mac,
          ip: n.ip,
          band: n.linkedReceivedState.cableType === 'WIFI_MESH' ? '5GHz + 6GHz (MLO)' : 'LAN Ethernet',
          rssi: n.linkedReceivedState.wifiRssiDbm || -42,
          rate_mbps: n.linkedReceivedState.negotiatedSpeed || 2400,
          connected_to: n.linkedReceivedState.upstreamSourceName
        }));

      const lanConfig = {
        lan_ip: fwCfg.lanIp || gwIp,
        subnet_mask: fwCfg.subnetMask || '255.255.255.0',
        dhcp_start: fwCfg.dhcpStart || fwCfg.dhcpStartIp || '',
        dhcp_end: fwCfg.dhcpEnd || fwCfg.dhcpEndIp || '',
        primary_dns: fwCfg.primaryDns || '',
        secondary_dns: fwCfg.secondaryDns || '',
        lease_time: fwCfg.leaseTime || '86400',
        dhcp_enable: fwCfg.dhcpEnable !== undefined ? fwCfg.dhcpEnable : '1',
        isp_dns: fwCfg.ispDns !== undefined ? fwCfg.ispDns : '0'
      };

      const serializedNodes = studioState.nodes.map(serializeNodeForBackend);
      const serializedLinks = studioState.links.map(serializeLinkForBackend);

      try {
        window.__grading4StepDirty = true;
        const res = await fetch(buildScopedMeshApiUrl('/api/mesh-lab/sync-topology'), {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'X-Mesh-Portal-Lab': window._embeddedPortalLabId || ''
          },
          body: JSON.stringify({
            scenario: (typeof getCurrentScenarioKey === 'function') ? getCurrentScenarioKey() : 'p3_mesh',
            lab_id: window._embeddedPortalLabId || '',
            ssid: ssid,
            key: key,
            security: fwCfg.securityMode || 'WPA3-SAE / WPA2-PSK',
            channel: fwCfg.channel || 'Auto (Ch.36 / 149)',
            bandwidth: fwCfg.bandwidth || '320MHz',
            gateway_ip: gwIp,
            lan_config: lanConfig,
            slaves: slaves,
            clients: clients,
            nodes: serializedNodes,
            links: serializedLinks,
            source_node_id: sourceNodeId || (gwNode && gwNode.id) || null,
            prefer_backend_source: !!preferBackendSource
          })
        });
        if (res.ok) {
          backendZteState = await res.json();
          if (backendZteState && backendZteState.grading_4step) {
            window.__lastGrading4Step = backendZteState.grading_4step;
            window.__grading4StepDirty = false;
          }
          if (backendZteState && backendZteState.adapter_sync && backendZteState.adapter_sync.node_configs) {
            applyBackendConfigsToNodes(backendZteState.adapter_sync.node_configs, backendZteState.adapter_sync.sync_modes);
          }
          if (typeof scheduleSaveWorkspace === 'function') {
            scheduleSaveWorkspace();
          }
          fetchMissions();
        }
      } catch (_) {}
    }

    // Master Zero-Click Auto-Sync Execution (also aliased as triggerManualCrossDeviceSync for API compatibility)
    async function triggerAutoCrossDeviceSync(showNotification = false, reason = 'auto') {
      const activeNode = studioState.nodes.find(n => n.id === studioState.activeDeviceWindowNodeId);
      const iframe = document.getElementById('device-sim-iframe');

      let extracted = [];
      if (reason === 'firmware_input' || reason === 'native_save_btn' || reason === 'manual') {
        extracted = extractConfigFromFirmwareDom(iframe, activeNode, null);
      }

      const syncedCount = propagateFirmwareStateAcrossLinks(true);

      await syncTopologyNodesToBackend(activeNode ? activeNode.id : null, false);
      await syncZteBackend();

      renderCanvas();
      [1, 2].forEach(slot => {
        const sNodeId = (studioState.activeWindowSlots && studioState.activeWindowSlots[slot]) || (slot === 1 ? studioState.activeDeviceWindowNodeId : null);
        if (!sNodeId) return;
        const sNode = studioState.nodes.find(n => n.id === sNodeId);
        if (!sNode) return;
        const dev = FPT_CATALOG[sNode.catalogKey];
        if (dev) updateWebGuiLivePhyBar(sNode, dev, slot);
        const winIp = getSlotEl('win-dev-ip', slot);
        if (winIp) winIp.textContent = `[${sNode.ip}]`;
        const sIframe = getSlotEl('device-sim-iframe', slot);
        if (sIframe) injectLinkedStateIntoFirmwareDom(sIframe, sNode);
        renderFwLinkSyncOverlay(sNode, slot);
      });
      clearTopologyPendingSync();

      if (showNotification) {
        const gwNode = studioState.nodes.find(n => n.category === 'gateway') || activeNode;
        const ssid = (gwNode && gwNode.firmwareConfig && gwNode.firmwareConfig.ssid) || 'FPT_Telecom_WiFi7';
        const extraStr = extracted.length > 0 ? ` (${extracted.join(', ')})` : '';
        showToast(`⚡ [Auto-Sync A ➔ B]: Đã tự động truyền cấu hình mới${extraStr} • SSID="${ssid}" sang ${syncedCount} thiết bị kết nối!`, 3200);
      }
    }

    async function triggerManualCrossDeviceSync(showNotification = true) {
      return triggerAutoCrossDeviceSync(showNotification, 'manual');
    }

    function syncFromWebGuiIframe(manualTrigger = false) {
      triggerAutoCrossDeviceSync(manualTrigger, 'manual');
    }

    // Live auto-sync when KTV types in the Config tab inputs (#cfg-node-name, #cfg-node-ip, #cfg-wifi-ssid, #cfg-wifi-key)
    function handleConfigTabLiveEdit(slot = 1) {
      const nodeId = (studioState.activeWindowSlots && studioState.activeWindowSlots[slot]) || studioState.activeDeviceWindowNodeId;
      const node = studioState.nodes.find(n => n.id === nodeId);
      const nameEl = getSlotEl('cfg-node-name', slot);
      const ipEl = getSlotEl('cfg-node-ip', slot);
      const maskEl = getSlotEl('cfg-node-mask', slot);
      const ssidEl = getSlotEl('cfg-wifi-ssid', slot);
      const keyEl = getSlotEl('cfg-wifi-key', slot);

      if (node) {
        if (!node.firmwareConfig) node.firmwareConfig = { customFieldMap: {} };
        if (nameEl && nameEl.value.trim().length >= 2) {
          node.name = nameEl.value.trim();
          node.firmwareConfig.hasKtvCustomConfig = true;
        }
        if (ipEl && /^\d{1,3}(\.\d{1,3}){3}$/.test(ipEl.value.trim())) {
          node.ip = ipEl.value.trim();
          node.firmwareConfig.lanIp = node.ip;
          node.firmwareConfig.hasKtvCustomConfig = true;
        }
        if (maskEl && /^\d{1,3}(\.\d{1,3}){3}$/.test(maskEl.value.trim())) {
          node.firmwareConfig.subnetMask = maskEl.value.trim();
          node.firmwareConfig.netmask = maskEl.value.trim();
          node.firmwareConfig.hasKtvCustomConfig = true;
        }
        if (ssidEl && ssidEl.value.trim().length >= 2) {
          const newSsid = ssidEl.value.trim();
          const prevSsid = node.firmwareConfig.ssid;
          node.firmwareConfig.ssid = newSsid;
          if (!node.firmwareConfig.ssid5g || node.firmwareConfig.ssid5g === prevSsid) {
            node.firmwareConfig.ssid5g = newSsid;
          }
          node.firmwareConfig.hasKtvCustomConfig = true;
        }
        if (keyEl && keyEl.value.trim().length >= 4) {
          const newKey = keyEl.value.trim();
          const prevKey = node.firmwareConfig.password || node.firmwareConfig.wpaKey;
          node.firmwareConfig.wpaKey = newKey;
          node.firmwareConfig.password = newKey;
          if (!node.firmwareConfig.password5g || node.firmwareConfig.password5g === prevKey) {
            node.firmwareConfig.password5g = newKey;
          }
          node.firmwareConfig.hasKtvCustomConfig = true;
        }
        normalizeFirmwareConfigFields(node.firmwareConfig, node.ip);
      }

      const gwNode = studioState.nodes.find(n => n.category === 'gateway') || node;
      if (gwNode && node && (gwNode.id === node.id || !isRouterModeNode(node))) {
        if (!gwNode.firmwareConfig) gwNode.firmwareConfig = { customFieldMap: {} };
        if (ssidEl && ssidEl.value.trim().length >= 2) {
          const newSsid = ssidEl.value.trim();
          const prevSsid = gwNode.firmwareConfig.ssid;
          gwNode.firmwareConfig.ssid = newSsid;
          if (!gwNode.firmwareConfig.ssid5g || gwNode.firmwareConfig.ssid5g === prevSsid) {
            gwNode.firmwareConfig.ssid5g = newSsid;
          }
          gwNode.firmwareConfig.hasKtvCustomConfig = true;
        }
        if (keyEl && keyEl.value.trim().length >= 4) {
          const newKey = keyEl.value.trim();
          const prevKey = gwNode.firmwareConfig.password || gwNode.firmwareConfig.wpaKey;
          gwNode.firmwareConfig.wpaKey = newKey;
          gwNode.firmwareConfig.password = newKey;
          if (!gwNode.firmwareConfig.password5g || gwNode.firmwareConfig.password5g === prevKey) {
            gwNode.firmwareConfig.password5g = newKey;
          }
          gwNode.firmwareConfig.hasKtvCustomConfig = true;
        }
        normalizeFirmwareConfigFields(gwNode.firmwareConfig, gwNode.ip);
      }

      if (typeof updateNodeNetworkStackFromConfig === 'function') {
        if (node) updateNodeNetworkStackFromConfig(node);
        if (gwNode && gwNode !== node) updateNodeNetworkStackFromConfig(gwNode);
      }
      if (typeof scheduleSaveWorkspace === 'function') {
        scheduleSaveWorkspace();
      }
      scheduleAutoCrossDeviceSync('config_tab', 250, true);
    }

    function renderPhysicalPortsRack(node, dev, slot = 1) {
      const rack = getSlotEl('phys-ports-list', slot);
      rack.innerHTML = '';
      dev.ports.forEach(p => {
        const activeLink = studioState.links.find(l =>
          (l.srcId === node.id && l.srcPort === p.id) ||
          (l.tgtId === node.id && l.tgtPort === p.id)
        );
        const isConnected = !!activeLink;
        const isBottleneck = activeLink && activeLink.speed < 2500 && node.catalogKey === 'be12000' && p.id.startsWith('LAN');
        const card = document.createElement('div');
        card.className = `physical-port-card ${isConnected ? (isBottleneck ? 'bottleneck' : 'connected') : ''}`;
        card.innerHTML = `
          <div style="display:flex;align-items:center;justify-content:space-between;">
            <span style="font-weight:700;font-size:10.5px;color:#f8fafc;">${p.name}</span>
            <span style="font-size:8px;font-family:var(--font-mono);color:${p.color};font-weight:700;">${p.type.toUpperCase()}</span>
          </div>
          <div style="font-size:9.5px;color:#94a3b8;">
            ${isConnected ? `▲ UP (${activeLink.speed >= 1000 ? (activeLink.speed/1000)+' Gbps' : activeLink.speed+' Mbps'})` : '▼ DOWN (Trống)'}
          </div>
          ${isConnected ? `<button class="tool-btn" style="padding:2px 5px;font-size:8.5px;margin-top:3px;" onclick="event.stopPropagation(); unplugPortCable('${node.id}', '${p.id}', ${slot})">✂️ Rút Cáp</button>` : ''}
        `;
        rack.appendChild(card);
      });
    }

    function unplugPortCable(nodeId, portId, slot = 1) {
      studioState.links.filter(l =>
        (l.srcId === nodeId && l.srcPort === portId) ||
        (l.tgtId === nodeId && l.tgtPort === portId)
      ).forEach(l => {
        const otherId = l.srcId === nodeId ? l.tgtId : l.srcId;
        const otherPort = l.srcId === nodeId ? l.tgtPort : l.srcPort;
        const otherNode = studioState.nodes.find(n => n.id === otherId);
        if (otherNode && otherNode.networkStack && otherNode.networkStack.interfaces && otherNode.networkStack.interfaces[otherPort]) {
          otherNode.networkStack.interfaces[otherPort].operUp = false;
        }
      });
      const thisNode = studioState.nodes.find(n => n.id === nodeId);
      if (thisNode && thisNode.networkStack && thisNode.networkStack.interfaces && thisNode.networkStack.interfaces[portId]) {
        thisNode.networkStack.interfaces[portId].operUp = false;
      }
      studioState.links = studioState.links.filter(l =>
        !(l.srcId === nodeId && l.srcPort === portId) &&
        !(l.tgtId === nodeId && l.tgtPort === portId)
      );
      propagateFirmwareStateAcrossLinks(true);
      renderCanvas();
      openDeviceWindow(nodeId, 'physical', slot);
      scheduleAutoCrossDeviceSync('unplug_port', 40, false);
      syncZteBackend();
    }

    function switchDeviceWindowTab(tabKey, slot = 1) {
      ['physical', 'config', 'desktop', 'webgui', 'cli'].forEach(k => {
        const btn = getSlotEl('tab-btn-' + k, slot);
        const view = getSlotEl('view-tab-' + k, slot);
        if (btn) btn.classList.toggle('active', k === tabKey);
        if (view) view.classList.toggle('active', k === tabKey);
      });
      const zoomPills = getSlotEl('mobile-zoom-pills', slot);
      if (zoomPills) {
        zoomPills.style.display = (tabKey === 'webgui') ? 'inline-flex' : 'none';
      }
      if (tabKey === 'webgui') {
        const nodeId = (studioState.activeWindowSlots && studioState.activeWindowSlots[slot]) || studioState.activeDeviceWindowNodeId;
        const activeNode = studioState.nodes.find(n => n.id === nodeId);
        const iframe = getSlotEl('device-sim-iframe', slot);
        if (activeNode) {
          propagateFirmwareStateAcrossLinks(true);
          if (iframe) injectLinkedStateIntoFirmwareDom(iframe, activeNode);
          renderFwLinkSyncOverlay(activeNode, slot);
        }
        if (typeof applyMobileWebGuiScale === 'function') {
          requestAnimationFrame(() => applyMobileWebGuiScale(slot));
        }
      }
      if (typeof notifyParentTopologyChanged === 'function') {
        notifyParentTopologyChanged();
      }
    }

    function applyNodeConfigChanges(slot = 1) {
      handleConfigTabLiveEdit(slot);
    }

    async function saveWifiConfigToBackend(slot = 1) {
      handleConfigTabLiveEdit(slot);
      await triggerAutoCrossDeviceSync(true, 'config_save');
    }

    async function toggleDevicePowerAction(slot = 1) {
      const nodeId = (studioState.activeWindowSlots && studioState.activeWindowSlots[slot]) || studioState.activeDeviceWindowNodeId;
      const node = studioState.nodes.find(n => n.id === nodeId);
      if (!node) return;
      node.power = !node.power;
      try {
        if (node.catalogKey === 'be12000') {
          await fetch('/api/mesh-lab/ont-power', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ power: node.power }) });
        } else if (node.catalogKey === 'be15000') {
          await fetch('/api/mesh-lab/power', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ power: node.power }) });
        }
      } catch (_) {}
      propagateFirmwareStateAcrossLinks(true);
      openDeviceWindow(node.id, 'physical', slot);
      renderCanvas();
      scheduleAutoCrossDeviceSync('power_toggle', 40, false);
      syncZteBackend();
    }

    async function triggerDeviceWpsAction(slot = 1) {
      const nodeId = (studioState.activeWindowSlots && studioState.activeWindowSlots[slot]) || studioState.activeDeviceWindowNodeId;
      const node = studioState.nodes.find(n => n.id === nodeId);
      if (!node) return;
      node.wpsActive = true;
      renderRearChassisSvg(node, FPT_CATALOG[node.catalogKey], slot);
      renderCanvas();
      showToast(`🔘 Đang ghép cặp WPS EasyMesh trên ${node.name}...`);
      try { await fetch('/api/mesh-lab/wps', { method: 'POST' }); } catch (_) {}
      setTimeout(() => { node.wpsActive = false; renderCanvas(); }, 3500);
      syncZteBackend();
    }

    function reloadDeviceIframe(slot = 1) {
      const iframe = getSlotEl('device-sim-iframe', slot);
      if (iframe) iframe.src = iframe.src;
    }
    function openSimInNewTab(slot = 1) {
      const iframe = getSlotEl('device-sim-iframe', slot);
      if (!iframe) return;
      let targetUrl = '';
      try {
        const href = iframe.contentWindow && iframe.contentWindow.location && iframe.contentWindow.location.href;
        if (href && href !== 'about:blank' && href.startsWith(window.location.origin)) {
          targetUrl = href;
        }
      } catch (_) {}
      if (!targetUrl && iframe.src && iframe.src !== 'about:blank') {
        targetUrl = iframe.src;
      }
      if (targetUrl) window.open(targetUrl, '_blank');
    }
    function toggleMinimizeDeviceWindow(slot = 1) {
      const win = getSlotEl('cisco-device-window', slot);
      if (!win) return;
      win.classList.remove('maximized', 'split-left', 'split-right');
      win.classList.toggle('minimized');
      if (Number(slot) === 2) win.classList.add('window-slot-2');
    }
    function toggleCompactDeviceWindow(slot = 1) {
      const win = getSlotEl('cisco-device-window', slot);
      if (!win) return;
      win.classList.remove('minimized', 'maximized', 'split-left', 'split-right');
      win.classList.toggle('compact');
    }
    function toggleMaximizeWindow(slot = 1) {
      const win = getSlotEl('cisco-device-window', slot);
      if (!win) return;
      win.classList.remove('minimized', 'compact', 'split-left', 'split-right');
      win.classList.toggle('maximized');
    }
    function closeDeviceWindow(slot = 1) {
      if (slot === 'all') {
        const w1 = document.getElementById('cisco-device-window');
        const w2 = document.getElementById('cisco-device-window-2');
        if (w1) { w1.style.display = 'none'; w1.classList.remove('split-left'); }
        if (w2) { w2.style.display = 'none'; w2.classList.remove('split-right'); }
        if (window.studioState) {
          studioState.activeWindowSlots = { 1: null, 2: null };
          studioState.activeDeviceWindowNodeId = null;
        }
        if (typeof notifyParentTopologyChanged === 'function') notifyParentTopologyChanged();
        return;
      }
      const win = getSlotEl('cisco-device-window', slot);
      if (win) {
        win.style.display = 'none';
        win.classList.remove('split-left', 'split-right');
      }
      if (window.studioState && studioState.activeWindowSlots) {
        studioState.activeWindowSlots[slot] = null;
        if (studioState.activeDeviceWindowNodeId === studioState.activeWindowSlots[slot]) {
          studioState.activeDeviceWindowNodeId = studioState.activeWindowSlots[Number(slot) === 1 ? 2 : 1];
        }
      }
      if (typeof notifyParentTopologyChanged === 'function') notifyParentTopologyChanged();
    }

    function toggleDualDeviceSplitView() {
      const win1 = document.getElementById('cisco-device-window');
      const win2 = document.getElementById('cisco-device-window-2');
      if (!win1 || !win2) return;

      const isAlreadySplit = win1.classList.contains('split-left') && win2.classList.contains('split-right') && win1.style.display === 'flex' && win2.style.display === 'flex';

      if (isAlreadySplit) {
        win1.classList.remove('split-left');
        win2.classList.remove('split-right');
        if (typeof applyMobileWebGuiScale === 'function') {
          requestAnimationFrame(() => { applyMobileWebGuiScale(1); applyMobileWebGuiScale(2); });
        }
        showToast('🗗 Đã hoàn tác chế độ chia đôi màn hình 50/50');
        return;
      }

      // Ensure Window 1 has a node
      let node1Id = studioState.activeWindowSlots ? studioState.activeWindowSlots[1] : null;
      if (!node1Id || win1.style.display === 'none') {
        const firstNode = studioState.nodes.find(n => n.category !== 'client') || studioState.nodes[0];
        if (firstNode) {
          openDeviceWindow(firstNode.id, 'webgui', 1);
          node1Id = firstNode.id;
        }
      }

      // Ensure Window 2 has a different node
      let node2Id = studioState.activeWindowSlots ? studioState.activeWindowSlots[2] : null;
      if (!node2Id || node2Id === node1Id || win2.style.display === 'none') {
        let candidate = null;
        if (node1Id) {
          const link = studioState.links.find(l => l.srcId === node1Id || l.tgtId === node1Id);
          if (link) {
            const otherId = link.srcId === node1Id ? link.tgtId : link.srcId;
            candidate = studioState.nodes.find(n => n.id === otherId);
          }
        }
        if (!candidate) {
          candidate = studioState.nodes.find(n => n.id !== node1Id);
        }
        if (candidate) {
          openDeviceWindow(candidate.id, 'webgui', 2);
          node2Id = candidate.id;
        }
      }

      win1.classList.remove('minimized', 'maximized', 'compact');
      win2.classList.remove('minimized', 'maximized', 'compact');
      win1.classList.add('split-left');
      win2.classList.add('split-right');
      win1.style.display = 'flex';
      win2.style.display = 'flex';
      if (typeof renderMobileDevQuickbars === 'function') renderMobileDevQuickbars();
      if (typeof applyMobileWebGuiScale === 'function') {
        requestAnimationFrame(() => { applyMobileWebGuiScale(1); applyMobileWebGuiScale(2); });
      }

      showToast('⚡ Đã xếp 2 cửa sổ song song (50/50) để đối soát & cấu hình Mesh trực tiếp!');
    }
    window.toggleDualDeviceSplitView = toggleDualDeviceSplitView;

    // Listen for live per-node configuration saves inside /mesh-node/<node_id>/<sim_id> iframes
    (function initMeshNodePostMessageListener() {
      async function handleIframeBackendSaved(nodeId, explicitSimId) {
        const srcNode = studioState.nodes.find(n => String(n.id) === String(nodeId));
        if (!srcNode) return;
        const simId = explicitSimId || getNodeSimId(srcNode);
        if (!simId) return;

        try {
          const url = buildScopedMeshApiUrl(
            `/api/mesh-lab/node-config?node_id=${encodeURIComponent(srcNode.id)}&sim_id=${encodeURIComponent(simId)}`
          );
          const res = await fetch(url, { cache: 'no-store' });
          if (res.ok) {
            const payload = await res.json();
            if (payload && payload.config && typeof payload.config === 'object') {
              if (!srcNode.firmwareConfig) srcNode.firmwareConfig = {};
              Object.assign(srcNode.firmwareConfig, payload.config);
              srcNode.firmwareConfig.hasKtvCustomConfig = true;
              normalizeFirmwareConfigFields(srcNode.firmwareConfig, payload.config.lanIp || srcNode.ip);
              if (srcNode.category !== 'core' && payload.config.lanIp && /^\d{1,3}(\.\d{1,3}){3}$/.test(payload.config.lanIp)) {
                srcNode.ip = payload.config.lanIp;
              }
              if (payload.config.opMode) srcNode.opMode = payload.config.opMode;
              if (payload.config.meshRole) srcNode.meshRole = payload.config.meshRole;
              if (typeof updateNodeNetworkStackFromConfig === 'function') {
                updateNodeNetworkStackFromConfig(srcNode);
              }
            }
          }
        } catch (_) {}

        propagateFirmwareStateAcrossLinks(true);
        await syncTopologyNodesToBackend(srcNode.id, true);
        renderCanvas();
        try {
          if (window.parent && window.parent !== window) {
            window.parent.postMessage({
              type: 'FTC_MESH_LAB_SAVED',
              nodeId: srcNode.id,
              simId: simId,
              grading: window.__lastGrading4Step || null,
              ts: Date.now()
            }, window.location.origin);
          }
        } catch (_) {}

        if ((simId === 'sim_ax3000hv2' || simId === 'sim_ax3000c') && typeof showToast === 'function') {
          const syncModes = backendZteState && backendZteState.adapter_sync && backendZteState.adapter_sync.sync_modes;
          const syncedAgents = syncModes
            ? studioState.nodes.filter(n => n.id !== srcNode.id && syncModes[n.id] === 'ap_mesh').map(n => n.name)
            : [];
          const afw = srcNode.firmwareConfig || {};
          if (simId === 'sim_ax3000c' && afw.meshEnabled === false) {
            showToast(`🔀 Đã tắt EasyMesh trên ${srcNode.name} — ngắt đồng bộ Mesh tới Agent`, 3200);
          } else if (syncedAgents.length > 0 && afw.ssid) {
            const s5 = (afw.ssid5g && afw.ssid5g !== afw.ssid) ? ` / 5G: ${afw.ssid5g}` : '';
            showToast(`⚡ Đã đồng bộ Host SSID ("${afw.ssid}"${s5}) từ ${srcNode.name} ➔ ${syncedAgents.join(', ')}`, 3200);
          }
        }

        [1, 2].forEach(slot => {
          const sNodeId = (studioState.activeWindowSlots && studioState.activeWindowSlots[slot]) || (slot === 1 ? studioState.activeDeviceWindowNodeId : null);
          if (!sNodeId) return;
          const sNode = studioState.nodes.find(n => n.id === sNodeId);
          if (!sNode) return;
          const dev = FPT_CATALOG[sNode.catalogKey];
          if (dev) updateWebGuiLivePhyBar(sNode, dev, slot);
          const winIp = getSlotEl('win-dev-ip', slot);
          if (winIp) winIp.textContent = `[${sNode.ip}]`;
          if (sNode.id === srcNode.id) {
            const cfgIp = getSlotEl('cfg-node-ip', slot);
            const cfgMask = getSlotEl('cfg-node-mask', slot);
            const cfgSsid = getSlotEl('cfg-wifi-ssid', slot);
            const cfgKey = getSlotEl('cfg-wifi-key', slot);
            const afw = sNode.firmwareConfig || {};
            if (cfgIp) cfgIp.value = sNode.ip;
            if (cfgMask && afw.subnetMask) cfgMask.value = afw.subnetMask;
            if (cfgSsid && afw.ssid) cfgSsid.value = afw.ssid;
            if (cfgKey && (afw.wpaKey || afw.password)) cfgKey.value = afw.wpaKey || afw.password;
          }
          const sIframe = getSlotEl('device-sim-iframe', slot);
          if (sIframe && sNode.id !== srcNode.id) {
            injectLinkedStateIntoFirmwareDom(sIframe, sNode);
          }
          renderFwLinkSyncOverlay(sNode, slot);
        });
      }

      window.addEventListener('message', function(ev) {
        if (ev.origin !== window.location.origin) return;
        const msg = ev.data;
        if (!msg || typeof msg !== 'object') return;
        if (msg.type !== 'fpt_mesh_fw_saved' && msg.type !== 'FTC_SAVE_SUCCESS') return;
        const iframe1 = document.getElementById('device-sim-iframe');
        const iframe2 = document.getElementById('device-sim-iframe-2');
        let targetNodeId = msg.nodeId;
        if (!targetNodeId && ev.source) {
          try {
            if (iframe1 && iframe1.contentWindow === ev.source) targetNodeId = iframe1.dataset && iframe1.dataset.loadedNodeId;
            else if (iframe2 && iframe2.contentWindow === ev.source) targetNodeId = iframe2.dataset && iframe2.dataset.loadedNodeId;
          } catch (_) {}
        }
        if (!targetNodeId) {
          targetNodeId = (iframe1 && iframe1.dataset && iframe1.dataset.loadedNodeId) || studioState.activeDeviceWindowNodeId;
        }
        if (!targetNodeId) return;

        const targetNode = studioState.nodes.find(n => n.id === targetNodeId);
        if (targetNode && msg.type === 'FTC_SAVE_SUCCESS' && msg.data && typeof msg.data === 'object') {
          if (!targetNode.firmwareConfig) targetNode.firmwareConfig = {};
          const d = msg.data;
          if (d.ssid) targetNode.firmwareConfig.ssid = String(d.ssid).trim();
          if (d.ssid5g) targetNode.firmwareConfig.ssid5g = String(d.ssid5g).trim();
          if (d.password) {
            targetNode.firmwareConfig.wpaKey = String(d.password).trim();
            targetNode.firmwareConfig.password = String(d.password).trim();
          }
          if (d.password5g) {
            targetNode.firmwareConfig.password5g = String(d.password5g).trim();
          }
          if (d.authMode2g) {
            targetNode.firmwareConfig.security2g = String(d.authMode2g).trim();
            targetNode.firmwareConfig.securityMode = String(d.authMode2g).trim();
          }
          if (d.authMode5g) {
            targetNode.firmwareConfig.security5g = String(d.authMode5g).trim();
          }
          if (d.hideSsid2g !== undefined) {
            targetNode.firmwareConfig.hideSsid2g = Boolean(d.hideSsid2g);
          }
          if (d.hideSsid5g !== undefined) {
            targetNode.firmwareConfig.hideSsid5g = Boolean(d.hideSsid5g);
          }
          if (d.bandwidth) targetNode.firmwareConfig.bandwidth = String(d.bandwidth).trim();
          if (d.ip) {
            targetNode.firmwareConfig.lanIp = String(d.ip).trim();
            targetNode.ip = String(d.ip).trim();
          }
          if (d.mask) targetNode.firmwareConfig.subnetMask = String(d.mask).trim();
          if (d.dhcpmode !== undefined) targetNode.firmwareConfig.dhcpEnable = (String(d.dhcpmode) === '1' || d.dhcpmode === 1) ? '1' : '0';
          if (d.start) targetNode.firmwareConfig.dhcpStart = String(d.start).trim();
          if (d.end) targetNode.firmwareConfig.dhcpEnd = String(d.end).trim();
          if (d.lease) targetNode.firmwareConfig.leaseTime = String(d.lease).trim();
          if (d.meshEnabled !== undefined) {
            targetNode.firmwareConfig.meshEnabled = Boolean(d.meshEnabled);
          }
          targetNode.firmwareConfig.hasKtvCustomConfig = true;
        }

        clearTimeout(_autoSyncDebounceTimer);
        clearTimeout(_fwSavedDebounceTimer);
        _lastBackendSavedAt = Date.now();
        _fwSavedDebounceTimer = setTimeout(() => {
          handleIframeBackendSaved(targetNodeId, msg.simId || '');
        }, 120);
      });
    })();

    (function initWindowDraggable() {
      function makeDraggable(winId, titlebarId, slotNum) {
        const win = document.getElementById(winId);
        const titlebar = document.getElementById(titlebarId);
        if (!win || !titlebar) return;
        let isDragging = false, startX = 0, startY = 0, initLeft = 0, initTop = 0;
        titlebar.addEventListener('mousedown', e => {
          if (e.target.closest('.cisco-win-btn') || win.classList.contains('maximized')) return;
          isDragging = true; startX = e.clientX; startY = e.clientY;
          win.classList.remove('split-left', 'split-right');
          const rect = win.getBoundingClientRect();
          win.style.transform = 'none'; win.style.left = rect.left + 'px'; win.style.top = rect.top + 'px';
          initLeft = rect.left; initTop = rect.top; win.dataset.dragged = 'true';
          bringWindowToFront(slotNum);
          e.preventDefault();
        });
        window.addEventListener('mousemove', e => {
          if (!isDragging) return;
          win.style.left = Math.max(10, Math.min(window.innerWidth - 150, initLeft + (e.clientX - startX))) + 'px';
          win.style.top = Math.max(10, Math.min(window.innerHeight - 60, initTop + (e.clientY - startY))) + 'px';
        });
        window.addEventListener('mouseup', () => { isDragging = false; });
      }

      makeDraggable('cisco-device-window', 'cisco-win-titlebar', 1);
      makeDraggable('cisco-device-window-2', 'cisco-win-titlebar-2', 2);
    })();

    window.addEventListener('keydown', e => {
      if (e.target.tagName === 'INPUT' || e.target.tagName === 'TEXTAREA') return;
      const k = e.key.toLowerCase();
      if (e.key === 'Escape') {
        closeDeviceWindow('all'); closePortSelectorModal(); closeCableInspectorModal(); closeMissionsModal(); closeGradeModal(); closePduInspectorModal(); closeCiscoPortPopup(); closeContainerlabModal();
        setStudioTool('select');
      } else if (k === 'v') setStudioTool('select');
      else if (k === 'c') setCableMode('AUTO');
      else if (k === 'p') setStudioTool('pdu');
      else if (k === 'd') setStudioTool('delete');
    });

