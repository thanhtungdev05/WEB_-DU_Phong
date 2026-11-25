    // 12. BACKEND ZTE ENGINE SYNC & PORTAL MESH LESSON EMBED CONTEXT
    window.__canvasZoom = 1.0;
    window.setMeshZoomLevel = function(scale) {
      window.__canvasZoom = 1.0;
      document.body.style.zoom = 1.0;
      if (typeof renderCanvas === 'function') {
        renderCanvas();
      }
    };

    (function initEmbeddedPortalContext() {
      try {
        const sp = new URLSearchParams(window.location.search || '');
        window._isEmbeddedPortalLesson = (sp.get('embed') === '1' || Boolean(sp.get('lab')));
        window._embeddedPortalLabId = (sp.get('lab') || '').trim();
        window._embeddedPortalDeviceId = (sp.get('device') || '').trim();
        window._embeddedPortalScenario = (sp.get('scenario') || (window._embeddedPortalLabId === 'LAB_AX3000CV2_07' ? 'p3_mesh_ax3000cv2' : '')).trim();
        if (window._isEmbeddedPortalLesson) {
          document.body.classList.add('portal-lesson-embed');
          const topbar = document.querySelector('.lab-topbar');
          if (topbar) topbar.style.display = 'none';
          const sel = document.getElementById('preset-select');
          if (sel && window._embeddedPortalScenario) {
            sel.value = window._embeddedPortalScenario;
          }
          const cat6BtnSpan = document.querySelector('#cable-btn-ETH_CAT6A span');
          if (cat6BtnSpan) cat6BtnSpan.textContent = '🔌 Nối Cáp Mạng (LAN/WAN)';
          const autoBtnSpan = document.querySelector('#tool-auto-wire span');
          if (autoBtnSpan) autoBtnSpan.textContent = '⚡ Nối Dây Nhanh';
          const delBtnSpan = document.querySelector('#tool-delete span');
          if (delBtnSpan) delBtnSpan.textContent = '✂️ Xóa / Cắt Cáp';
        }
        window.__canvasZoom = 1.0;
        document.body.style.zoom = 1.0;
        try { localStorage.removeItem('ftc_mesh_zoom'); } catch (_) {}
      } catch (_) {}
    })();

    async function syncZteBackend() {
      const ontNode = studioState.nodes.find(n => n.catalogKey === 'be12000' && n.category === 'gateway') ||
                      studioState.nodes.find(n => n.catalogKey === 'be12000');
      const apNode = studioState.nodes.find(n => n.catalogKey === 'be15000');
      if (!ontNode || !apNode) {
        if (typeof syncTopologyNodesToBackend === 'function') {
          await syncTopologyNodesToBackend(null, true);
        } else {
          fetchMissions();
        }
        return;
      }

      const backhaulLink = studioState.links.find(l =>
        (l.srcId === ontNode.id && l.tgtId === apNode.id) ||
        (l.srcId === apNode.id && l.tgtId === ontNode.id)
      );

      const scopedUrl = (typeof buildScopedMeshApiUrl === 'function') ? buildScopedMeshApiUrl : (u => u);
      try {
        if (!backhaulLink) {
          const res = await fetch(scopedUrl('/api/mesh-lab/link'), { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ link_type: 'NONE' }) });
          if (res.ok) backendZteState = await res.json();
        } else if (backhaulLink.cableType === 'WIFI_MESH') {
          const res = await fetch(scopedUrl('/api/mesh-lab/link'), { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ link_type: 'WIFI' }) });
          if (res.ok) backendZteState = await res.json();
        } else {
          let ontPort = backhaulLink.srcId === ontNode.id ? backhaulLink.srcPort : backhaulLink.tgtPort;
          let apPort = backhaulLink.srcId === ontNode.id ? backhaulLink.tgtPort : backhaulLink.srcPort;
          if (apPort === 'LAN1_1GE') apPort = 'LAN_1GE';
          const cType = backhaulLink.cableType === 'ETH_CAT5E' ? 'CAT5E' : 'CAT6A';
          const res = await fetch(scopedUrl('/api/mesh-lab/connect-ports'), {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ ont_port: ontPort, ap_port: apPort, cable_type: cType })
          });
          if (res.ok) backendZteState = await res.json();
        }
        if (backendZteState && ontNode && !_isRestoringWorkspace) {
          if (!ontNode.firmwareConfig) ontNode.firmwareConfig = { customFieldMap: {} };
          let changedFromBackend = false;
          if (backendZteState.ont_lan_ip && backendZteState.ont_lan_ip !== '192.168.1.1' && ontNode.firmwareConfig.lanIp !== backendZteState.ont_lan_ip) {
            ontNode.ip = backendZteState.ont_lan_ip;
            ontNode.firmwareConfig.lanIp = backendZteState.ont_lan_ip;
            ontNode.firmwareConfig.hasKtvCustomConfig = true;
            changedFromBackend = true;
          }
          if (backendZteState.ont_dhcp_start && backendZteState.ont_dhcp_start !== '192.168.1.2' &&
              (ontNode.firmwareConfig.dhcpStartIp !== backendZteState.ont_dhcp_start || ontNode.firmwareConfig.dhcpStart !== backendZteState.ont_dhcp_start)) {
            ontNode.firmwareConfig.dhcpStartIp = backendZteState.ont_dhcp_start;
            ontNode.firmwareConfig.dhcpStart = backendZteState.ont_dhcp_start;
            ontNode.firmwareConfig.hasKtvCustomConfig = true;
            changedFromBackend = true;
          }
          if (backendZteState.ont_dhcp_end && backendZteState.ont_dhcp_end !== '192.168.1.254' &&
              (ontNode.firmwareConfig.dhcpEndIp !== backendZteState.ont_dhcp_end || ontNode.firmwareConfig.dhcpEnd !== backendZteState.ont_dhcp_end)) {
            ontNode.firmwareConfig.dhcpEndIp = backendZteState.ont_dhcp_end;
            ontNode.firmwareConfig.dhcpEnd = backendZteState.ont_dhcp_end;
            ontNode.firmwareConfig.hasKtvCustomConfig = true;
            changedFromBackend = true;
          }
          if (backendZteState.ont_primary_dns && (ontNode.firmwareConfig.primaryDns !== backendZteState.ont_primary_dns || ontNode.firmwareConfig.dns1 !== backendZteState.ont_primary_dns)) {
            ontNode.firmwareConfig.primaryDns = backendZteState.ont_primary_dns;
            ontNode.firmwareConfig.dns1 = backendZteState.ont_primary_dns;
            changedFromBackend = true;
          }
          if (backendZteState.ont_subnet_mask && (ontNode.firmwareConfig.subnetMask !== backendZteState.ont_subnet_mask || ontNode.firmwareConfig.netmask !== backendZteState.ont_subnet_mask)) {
            ontNode.firmwareConfig.subnetMask = backendZteState.ont_subnet_mask;
            ontNode.firmwareConfig.netmask = backendZteState.ont_subnet_mask;
            changedFromBackend = true;
          }
          if (typeof normalizeFirmwareConfigFields === 'function') {
            normalizeFirmwareConfigFields(ontNode.firmwareConfig, ontNode.ip);
          }
          if (changedFromBackend) {
            if (typeof updateNodeNetworkStackFromConfig === 'function') {
              updateNodeNetworkStackFromConfig(ontNode);
            }
            propagateFirmwareStateAcrossLinks(true);
            renderCanvas();
            const activeNode = studioState.nodes.find(n => n.id === studioState.activeDeviceWindowNodeId);
            const iframe = document.getElementById('device-sim-iframe');
            if (activeNode) {
              injectLinkedStateIntoFirmwareDom(iframe, activeNode);
              renderFwLinkSyncOverlay(activeNode);
            }
          }
        }
        updateHudTelemetry();
        fetchMissions();
      } catch (e) {}
    }

    function updateHudTelemetry() {
      const hudLink = document.getElementById('hud-link');
      const hudPing = document.getElementById('hud-ping');
      const hudSpeed = document.getElementById('hud-speed');
      const hudTraffic = document.getElementById('hud-traffic');
      const st = backendZteState;
      if (!st || !st.link_type) return;

      if (!st.ont_power || !st.ap_power) {
        hudLink.innerHTML = '<span class="hud-dot"></span> Mất nguồn'; hudLink.className = 'hud-chip bad';
        hudSpeed.innerHTML = '<span class="hud-dot"></span> 0 Mbps'; hudSpeed.className = 'hud-chip bad';
      } else if (st.link_type === 'ETH') {
        if (st.is_optimal_wiring) {
          hudLink.innerHTML = '<span class="hud-dot"></span> ETH 2.5G (Tối ưu)'; hudLink.className = 'hud-chip good';
          hudSpeed.innerHTML = '<span class="hud-dot"></span> 2.35 Gbps'; hudSpeed.className = 'hud-chip good';
        } else {
          hudLink.innerHTML = '<span class="hud-dot"></span> ETH 1G (Nghẽn)'; hudLink.className = 'hud-chip warn';
          hudSpeed.innerHTML = '<span class="hud-dot"></span> 940 Mbps'; hudSpeed.className = 'hud-chip warn';
        }
      } else if (st.link_type === 'WIFI') {
        hudLink.innerHTML = '<span class="hud-dot"></span> Wi-Fi MLO'; hudLink.className = 'hud-chip warn';
        hudSpeed.innerHTML = '<span class="hud-dot"></span> 1.15 Gbps'; hudSpeed.className = 'hud-chip good';
      } else {
        hudLink.innerHTML = '<span class="hud-dot"></span> Đứt cáp'; hudLink.className = 'hud-chip bad';
        hudSpeed.innerHTML = '<span class="hud-dot"></span> 0 Mbps'; hudSpeed.className = 'hud-chip bad';
      }

      hudPing.innerHTML = `<span class="hud-dot"></span> ${st.latency_ms < 900 ? `${st.latency_ms} ms` : 'Timeout'}`;
      hudPing.className = st.latency_ms < 5 ? 'hud-chip good' : 'hud-chip bad';
      hudTraffic.innerHTML = `<span class="hud-dot"></span> ${st.client_internet ? 'Online' : 'Offline'}`;
      hudTraffic.className = st.client_internet ? 'hud-chip good' : 'hud-chip bad';
    }

    // 13. MISSIONS & GRADING (PHASE 3 TECHNICAL STANDARDS & 4-STEP BINARY MESH GRADING)
    function getCurrentScenarioKey() {
      if (window._isEmbeddedPortalLesson && window._embeddedPortalScenario) {
        return window._embeddedPortalScenario;
      }
      const sel = document.getElementById('preset-select');
      const val = (sel && sel.value) || (typeof studioState !== 'undefined' && studioState.currentScenario) || 'p3_mesh';
      const valid = {
        p3_mesh: 1,
        p3_mesh_ax3000cv2: 1,
        p3_mesh_ax3000gzv2: 1,
        p3_mesh_ax3000hv2: 1,
        p3_mesh_ax1800gz: 1,
        p3_mesh_ax3000s: 1,
        p3_mesh_zte: 1,
        p3_dhcp: 1,
        p3_bridge: 1,
        p3_static: 1
      };
      return valid[val] ? val : 'p3_mesh';
    }

    function is4StepBinaryGradingScenario(scenarioKey) {
      const sk = String(scenarioKey || getCurrentScenarioKey() || '');
      return Boolean(window._isEmbeddedPortalLesson || window._embeddedPortalLabId || sk.startsWith('p3_mesh_'));
    }

    async function fetchMissions() {
      try {
        const scenario = getCurrentScenarioKey();
        const labId = window._embeddedPortalLabId || '';
        const gMode = is4StepBinaryGradingScenario(scenario) ? '4step' : '';
        const q = `/api/mesh-lab/missions?scenario=${encodeURIComponent(scenario)}&lab_id=${encodeURIComponent(labId)}&grading_mode=${encodeURIComponent(gMode)}`;
        const url = (typeof buildScopedMeshApiUrl === 'function') ? buildScopedMeshApiUrl(q) : q;
        const res = await fetch(url, {
          headers: { 'X-Mesh-Portal-Lab': labId }
        });
        if (!res.ok) return;
        const data = await res.json();
        const topCount = document.getElementById('topbar-mission-count');
        if (topCount) topCount.textContent = `${data.completed_count}/${data.total}`;
        const progText = document.getElementById('mission-progress-text');
        if (progText) progText.textContent = `${data.completed_count}/${data.total} (${data.progress_percent}%)`;

        if (data.scenario) {
          const badge = document.getElementById('scenario-badge');
          if (badge) badge.textContent = data.scenario.badge || 'BÀI THỰC HÀNH';
          const pair = document.getElementById('scenario-pair-text');
          if (pair) pair.textContent = 'Thiết bị: ' + (data.scenario.device_pair || 'ONT + AP');
          const summary = document.getElementById('scenario-summary-text');
          if (summary) summary.textContent = data.scenario.summary || '';
          const standard = document.getElementById('scenario-standard-text');
          if (standard) standard.innerHTML = '<b>Tiêu chuẩn kỹ thuật FPT:</b> ' + (data.scenario.standard || '');
          const title = document.getElementById('mission-modal-title');
          if (title) title.textContent = data.scenario.title || 'BÀI THỰC HÀNH KTV';
        }

        const list = document.getElementById('missions-list');
        if (list) {
          list.innerHTML = '';
          data.missions.forEach(m => {
            const item = document.createElement('div');
            item.style.cssText = `padding:8px 10px;background:${m.completed ? 'rgba(16,185,129,0.12)' : '#1e293b'};border:1px solid ${m.completed ? '#10b981' : '#334155'};border-radius:6px;display:flex;align-items:flex-start;gap:8px;`;
            item.innerHTML = `
              <span style="font-weight:700;color:${m.completed ? '#34d399' : '#94a3b8'};font-size:14px;line-height:1.2;">${m.completed ? '✓' : m.step}</span>
              <div style="flex:1;">
                <div style="font-weight:700;font-size:11.5px;color:#f8fafc;display:flex;align-items:center;justify-content:space-between;">
                  <span>${m.title}</span>
                  <span style="font-size:10px;color:${m.completed ? '#34d399' : '#94a3b8'};font-family:var(--font-mono);">${m.badge || ''}</span>
                </div>
                <div style="font-size:10.5px;color:#94a3b8;margin-top:2px;line-height:1.35;">${m.instruction}</div>
              </div>`;
            list.appendChild(item);
          });
        }
      } catch (e) {}
    }

    function openMissionsModal() { fetchMissions(); document.getElementById('missions-modal').style.display = 'flex'; }
    function closeMissionsModal() { document.getElementById('missions-modal').style.display = 'none'; }

    window.reloadCurrentScenarioPair = function() {
      const scenario = getCurrentScenarioKey();
      closeMissionsModal();
      if (typeof loadPresetTopology === 'function') {
        loadPresetTopology(scenario);
      }
    };

    document.getElementById('btn-grade-lab').addEventListener('click', async () => {
      try {
        const scenario = getCurrentScenarioKey();
        const labId = window._embeddedPortalLabId || '';
        const gMode = is4StepBinaryGradingScenario(scenario) ? '4step' : '';
        const wsPayload = (typeof studioState !== 'undefined') ? {
          nodes: studioState.nodes.map(n => (typeof serializeNodeForBackend === 'function') ? serializeNodeForBackend(n) : n),
          links: studioState.links.map(l => (typeof serializeLinkForBackend === 'function') ? serializeLinkForBackend(l) : l)
        } : null;
        const url = (typeof buildScopedMeshApiUrl === 'function') ? buildScopedMeshApiUrl('/api/mesh-lab/grade') : '/api/mesh-lab/grade';
        const res = await fetch(url, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'X-Mesh-Portal-Lab': labId
          },
          body: JSON.stringify({ scenario: scenario, lab_id: labId, grading_mode: gMode, workspace: wsPayload })
        });
        if (res.ok) {
          const gData = await res.json();
          if (gData && gData.grading_mode === '4step_binary') {
            window.__lastGrading4Step = gData;
            window.__grading4StepDirty = false;
          }
          renderGradingModal(gData);
        }
      } catch (e) {}
    });

    // Synchronous / Cached 4-Step Mesh Grading Bridge for Portal's evaluateLesson()
    window.evaluatePortalMeshLessonSync = function (labId, forceFresh = false) {
      const targetLabId = String(labId || window._embeddedPortalLabId || 'LAB_AX3000CV2_07').trim();
      const scenario = getCurrentScenarioKey();
      let parentForceFresh = false;
      try {
        parentForceFresh = Boolean(window.parent && window.parent._forceFreshMeshGrade);
      } catch (_) {}
      if (forceFresh || parentForceFresh || !window.__lastGrading4Step || window.__grading4StepDirty) {
        try {
          const wsPayload = (typeof studioState !== 'undefined') ? {
            nodes: studioState.nodes.map(n => (typeof serializeNodeForBackend === 'function') ? serializeNodeForBackend(n) : n),
            links: studioState.links.map(l => (typeof serializeLinkForBackend === 'function') ? serializeLinkForBackend(l) : l)
          } : { nodes: [], links: [] };
          const url = (typeof buildScopedMeshApiUrl === 'function') ? buildScopedMeshApiUrl('/api/mesh-lab/grade') : '/api/mesh-lab/grade';
          const xhr = new XMLHttpRequest();
          xhr.open('POST', url, false);
          xhr.setRequestHeader('Content-Type', 'application/json');
          xhr.setRequestHeader('X-Mesh-Portal-Lab', targetLabId);
          xhr.send(JSON.stringify({
            scenario: scenario,
            lab_id: targetLabId,
            grading_mode: '4step',
            workspace: wsPayload
          }));
          if (xhr.status >= 200 && xhr.status < 300 && xhr.responseText) {
            window.__lastGrading4Step = JSON.parse(xhr.responseText);
            window.__grading4StepDirty = false;
          }
        } catch (_) {}
      }
      const g4 = window.__lastGrading4Step;
      if (!g4 || !Array.isArray(g4.rules)) {
        return {
          gradable: true,
          passed: false,
          passedCount: 0,
          totalRules: 4,
          details: [{
            id: 'mesh_not_ready',
            name: 'Thiết bị trên Canvas',
            expected: 'Kéo thả đúng 2 thiết bị theo bài học lên Canvas',
            actual: 'Chưa kéo thiết bị lên Canvas',
            passed: false,
            message: 'Vui lòng kéo thả đúng thiết bị thuộc phần cấu hình đã chọn lên Canvas.'
          }]
        };
      }
      const rawDetails = (Array.isArray(g4.details) && g4.details.length > 0) ? g4.details : g4.rules;
      const details = rawDetails.map((d, idx) => ({
        id: d.id || ('mesh_step_' + (idx + 1)),
        name: d.name || d.label || ('Bước ' + (idx + 1)),
        label: d.label || d.name || ('Bước ' + (idx + 1)),
        expected: d.expected,
        actual: d.actual,
        passed: Boolean(d.passed),
        message: d.message || d.feedback || ''
      }));
      const passedCount = details.filter(d => d.passed).length;
      return {
        gradable: true,
        passed: Boolean(g4.passed),
        passedCount: passedCount,
        totalRules: details.length,
        details: details,
        status_label: g4.status_label || (g4.passed ? 'ĐẠT' : 'CHƯA ĐẠT'),
        device_pair_valid: g4.device_pair_valid !== false,
        device_pair_error: g4.device_pair_error || ''
      };
    };

    function renderGradingModal(data) {
      if (typeof studioState !== 'undefined') {
        studioState.gradedResult = data;
        if (typeof renderCanvas === 'function') renderCanvas();
      }

      const isBinary4Step = (data && data.grading_mode === '4step_binary');
      document.getElementById('grade-score').textContent = isBinary4Step
        ? (data.passed ? 'ĐẠT' : 'CHƯA ĐẠT')
        : (data.score + '/100');
      const statusText = document.getElementById('grade-status-text');
      statusText.textContent = data.passed ? '🎉 ĐẠT TIÊU CHUẨN KTV FPT' : '⚠️ CHƯA ĐẠT TIÊU CHUẨN';
      statusText.style.color = data.passed ? '#34d399' : '#f87171';
      const titleEl = document.getElementById('grade-scenario-title');
      if (titleEl && data.scenario_title) titleEl.textContent = data.scenario_title;
      const m = Math.floor(data.elapsed_seconds / 60), s = data.elapsed_seconds % 60;
      document.getElementById('grade-time-text').textContent = `Thời gian thực hiện: ${String(m).padStart(2,'0')}:${String(s).padStart(2,'0')}`;

      // 1. Render Mini Topology Card
      const cardEl = document.getElementById('grade-mini-topology-card');
      if (cardEl) {
        const mt = data.mini_topology;
        if (mt && mt.ont && mt.ap) {
          const isCablePass = mt.cable && mt.cable.is_correct;
          cardEl.innerHTML = `
            <div class="mt-node-box">
              <span class="mt-node-role">👑 CONTROLLER (CHÍNH)</span>
              <span class="mt-node-name">${mt.ont.name || mt.ont.model}</span>
              <span class="mt-node-ip">IP: ${mt.ont.ip} | Role: ${mt.ont.mesh_role || (mt.ont.dhcp_enable ? 'DHCP Bật' : 'Controller')}</span>
            </div>
            <div class="mt-wire-box">
              <span class="mt-wire-ports">${mt.cable.ont_port || 'Port'} ➔ ${mt.cable.ap_port || 'Port'}</span>
              <span class="mt-wire-status ${isCablePass ? 'pass' : 'fail'}">${isCablePass ? '✓ ĐÚNG CHUẨN FPT' : '⚠ SAI CỔNG CẮM'}</span>
              <span style="font-size:9.5px;color:#94a3b8;font-family:var(--font-mono);">${mt.cable.port_pair}</span>
            </div>
            <div class="mt-node-box">
              <span class="mt-node-role">📡 AGENT (PHỤ)</span>
              <span class="mt-node-name">${mt.ap.name || mt.ap.model}</span>
              <span class="mt-node-ip">IP: ${mt.ap.ip} | Role: ${mt.ap.mesh_role || (mt.ap.dhcp_enable ? 'DHCP Bật' : 'Agent')}</span>
            </div>
          `;
          cardEl.style.display = 'flex';
        } else {
          const errMsg = (data && data.device_pair_error)
            ? data.device_pair_error
            : 'CHƯA ĐỦ CẶP THIẾT BỊ: Hãy kéo đúng cặp thiết bị của bài học từ kệ thiết bị lên Canvas và cắm dây cáp!';
          cardEl.innerHTML = `
            <div style="width:100%;text-align:center;color:#f87171;padding:8px;font-size:12px;font-weight:700;">
              ⚠️ ${errMsg}
            </div>
          `;
          cardEl.style.display = 'flex';
        }
      }

      // 2. Render Checkpoint Chips
      const chipsEl = document.getElementById('grade-checkpoint-chips');
      if (chipsEl) {
        const chipLabels = isBinary4Step
          ? ['1️⃣ Mode Mesh', '2️⃣ PPPoE & Wi-Fi', '3️⃣ Đấu Nối Dây', '4️⃣ Topology Mesh']
          : ['🔌 Cáp Cổng', '⚙️ Chế Độ', '🌐 Lớp IP', '📡 DHCP', '📶 Sóng Wi-Fi'];
        let chipsHtml = '';
        (data.rules || []).forEach((r, idx) => {
          const lbl = chipLabels[idx] || r.name;
          const badgeRight = isBinary4Step
            ? (r.passed ? '✔ Đúng' : '✖ Sai')
            : `${r.points}/${r.max_points}đ`;
          chipsHtml += `
            <div class="checkpoint-chip ${r.passed ? 'pass' : 'fail'}">
              <span>${r.passed ? '✅' : '❌'} ${lbl}</span>
              <span class="chip-pts">${badgeRight}</span>
            </div>
          `;
        });
        chipsEl.innerHTML = chipsHtml;
      }

      // 3. Render Actionable Fix Box
      const actBox = document.getElementById('grade-actionable-box');
      if (actBox) {
        if (data.passed) {
          actBox.className = 'grade-actionable-box pass';
          actBox.innerHTML = `<b>🎉 KẾT QUẢ: ĐẠT</b><div style="margin-top:4px;">${data.actionable_fix || 'Đã thỏa mãn đầy đủ các quy chuẩn kỹ thuật đấu nối và dịch vụ mạng FPT Telecom.'}</div>`;
        } else {
          actBox.className = 'grade-actionable-box fail';
          const fixLines = (data.actionable_fix || 'Vui lòng kiểm tra lại cấu hình.')
            .split('\n')
            .map(line => `<div>${line}</div>`)
            .join('');
          actBox.innerHTML = `<b>🛠️ CHI TIẾT LỖI SAI CẦN KHẮC PHỤC:</b><div style="margin-top:4px;">${fixLines}</div>`;
        }
      }

      // 4. Render Rules List
      const listEl = document.getElementById('grade-rules-list');
      listEl.innerHTML = '';
      data.rules.forEach(r => {
        const rightStatus = isBinary4Step
          ? (r.passed ? '✔ Đúng' : '✖ Sai')
          : `${r.points}/${r.max_points}đ`;
        const item = document.createElement('div');
        item.style.cssText = `display:flex;flex-direction:column;padding:8px 10px;border-radius:6px;border:1px solid ${r.passed ? '#059669' : '#7f1d1d'};background:${r.passed ? 'rgba(16,185,129,0.08)' : 'rgba(239,68,68,0.08)'};gap:4px;`;
        item.innerHTML = `
          <div style="display:flex;align-items:center;justify-content:space-between;gap:8px;">
            <div style="display:flex;align-items:center;gap:6px;">
              <span>${r.passed ? '✅' : '❌'}</span>
              <span style="font-size:12px;font-weight:700;color:#f8fafc;">${r.name}</span>
            </div>
            <span style="font-size:11.5px;font-weight:800;font-family:var(--font-mono);color:${r.passed ? '#34d399' : '#f87171'}">${rightStatus}</span>
          </div>
          <div style="font-size:10.5px;color:#94a3b8;margin-left:22px;"><b>Yêu cầu:</b> ${r.expected}</div>
          <div style="font-size:10.5px;color:#94a3b8;margin-left:22px;"><b>Thực tế:</b> ${r.actual}</div>
          <div style="font-size:10.5px;color:${r.passed ? '#34d399' : '#fb7185'};margin-left:22px;line-height:1.35;border-top:1px dashed ${r.passed ? 'rgba(16,185,129,0.3)' : 'rgba(239,68,68,0.3)'};padding-top:3px;margin-top:2px;">
            💡 ${r.feedback || ''}
          </div>`;
        listEl.appendChild(item);
      });
      document.getElementById('grade-modal').style.display = 'flex';
    }

    function closeGradeModal() { document.getElementById('grade-modal').style.display = 'none'; }

    function openFptMatrixModal() {
      const m = document.getElementById('fpt-matrix-modal');
      if (m) m.style.display = 'flex';
    }
    function closeFptMatrixModal() {
      const m = document.getElementById('fpt-matrix-modal');
      if (m) m.style.display = 'none';
    }
    window.openFptMatrixModal = openFptMatrixModal;
    window.closeFptMatrixModal = closeFptMatrixModal;

    let _workspaceReady = false;
    let _isRestoringWorkspace = false;
    let _saveWorkspaceTimer = null;

    function getWorkspaceScopeId() {
      if (typeof getMeshLabKtvParam === 'function') {
        const q = getMeshLabKtvParam();
        if (q) return q.split('__mn_')[0];
      }
      try {
        const m = document.cookie.match(/(?:^|;\s*)ktv_client_id=([^;]+)/);
        if (m && m[1]) return decodeURIComponent(m[1]).split('__mn_')[0];
      } catch (_) {}
      return 'default';
    }

    function getWorkspaceCacheKey() {
      return 'fpt_mesh_ws_v1_' + getWorkspaceScopeId().replace(/[^A-Za-z0-9_-]/g, '_');
    }

    function buildWorkspacePayload() {
      return {
        nodes: studioState.nodes.map(n => (typeof serializeNodeForBackend === 'function') ? serializeNodeForBackend(n) : Object.assign({}, n)),
        links: studioState.links.map(l => (typeof serializeLinkForBackend === 'function') ? serializeLinkForBackend(l) : Object.assign({}, l)),
        pduList: Array.isArray(studioState.pduList) ? studioState.pduList.slice(0, 50) : [],
        activeDeviceWindowNodeId: studioState.activeDeviceWindowNodeId || null,
        ts: Date.now()
      };
    }

    async function saveWorkspaceNow(useBeacon = false) {
      if (!_workspaceReady || _isRestoringWorkspace) return;
      const payload = buildWorkspacePayload();
      const bodyStr = JSON.stringify(payload);
      try {
        localStorage.setItem(getWorkspaceCacheKey(), bodyStr);
      } catch (_) {}
      const url = (typeof buildScopedMeshApiUrl === 'function') ? buildScopedMeshApiUrl('/api/mesh-lab/workspace') : '/api/mesh-lab/workspace';
      try {
        if (useBeacon && navigator.sendBeacon) {
          navigator.sendBeacon(url, new Blob([bodyStr], { type: 'application/json' }));
          return;
        }
        await fetch(url, {
          method: 'POST',
          credentials: 'include',
          headers: { 'Content-Type': 'application/json' },
          body: bodyStr
        });
      } catch (_) {}
    }

    function scheduleSaveWorkspace(delayMs = 350) {
      if (!_workspaceReady || _isRestoringWorkspace) return;
      clearTimeout(_saveWorkspaceTimer);
      _saveWorkspaceTimer = setTimeout(() => {
        saveWorkspaceNow(false);
      }, delayMs);
    }

    async function tryLoadSavedWorkspace() {
      const url = (typeof buildScopedMeshApiUrl === 'function') ? buildScopedMeshApiUrl('/api/mesh-lab/workspace') : '/api/mesh-lab/workspace';
      try {
        const res = await fetch(url, { credentials: 'include', cache: 'no-store' });
        if (res.ok) {
          const data = await res.json();
          if (data && data.workspace && Array.isArray(data.workspace.nodes) && data.workspace.nodes.length > 0) {
            return data.workspace;
          }
          return null;
        }
      } catch (_) {}
      try {
        const cached = localStorage.getItem(getWorkspaceCacheKey());
        if (cached) {
          const parsed = JSON.parse(cached);
          if (parsed && Array.isArray(parsed.nodes) && parsed.nodes.length > 0) return parsed;
        }
      } catch (_) {}
      return null;
    }

    async function restoreWorkspaceFromBackend(ws) {
      if (!ws || !Array.isArray(ws.nodes) || ws.nodes.length === 0) return false;
      _isRestoringWorkspace = true;
      try {
        studioState.nodes = [];
        studioState.links = [];
        studioState.pduList = Array.isArray(ws.pduList) ? ws.pduList.slice(0, 50) : [];
        studioState.activeDeviceWindowNodeId = null;

        let maxNodeNum = 0;
        let maxLinkNum = 0;

        ws.nodes.forEach(rawN => {
          const dev = (typeof FPT_CATALOG !== 'undefined') ? FPT_CATALOG[rawN.catalogKey] : null;
          if (!dev) return;
          const mNum = String(rawN.id || '').match(/(\d+)$/);
          if (mNum) maxNodeNum = Math.max(maxNodeNum, parseInt(mNum[1], 10));

          const fwInit = Object.assign({
            hasKtvCustomConfig: false,
            initialDefaultSsid: 'FPT_Telecom_WiFi7',
            initialDefaultIp: dev.defaultIp,
            ssid: 'FPT_Telecom_WiFi7',
            wpaKey: '12345678',
            securityMode: 'WPA3-SAE / WPA2-PSK',
            channel: 'Auto (Ch.36 / 149)',
            bandwidth: dev.series === 'wifi7' ? '320MHz' : (dev.series === 'wifi6' ? '160MHz' : '80MHz'),
            wifiEnabled: true,
            lanIp: rawN.ip || dev.defaultIp,
            subnetMask: '255.255.255.0',
            wanMode: dev.category === 'gateway' ? 'PPPoE (VLAN 35)' : (dev.category === 'ap' ? 'EasyMesh Agent / DHCP' : 'DHCP Client'),
            dhcpEnabled: dev.category === 'gateway',
            customFieldMap: {}
          }, rawN.firmwareConfig || {});
          if (typeof normalizeFirmwareConfigFields === 'function') {
            normalizeFirmwareConfigFields(fwInit, rawN.ip || fwInit.lanIp || dev.defaultIp);
          }

          const node = {
            id: String(rawN.id || ('node-' + (++maxNodeNum))),
            catalogKey: rawN.catalogKey,
            simId: rawN.simId || dev.folder || '',
            name: rawN.name || dev.model,
            model: dev.model,
            svgType: dev.svgType,
            category: rawN.category || dev.category,
            role: rawN.role || dev.role,
            roleLabel: rawN.roleLabel || dev.roleLabel,
            ip: rawN.ip || fwInit.lanIp || dev.defaultIp,
            mac: rawN.mac || dev.macBase,
            x: typeof rawN.x === 'number' ? rawN.x : 300,
            y: typeof rawN.y === 'number' ? rawN.y : 175,
            power: rawN.power !== false,
            wpsActive: false,
            opMode: rawN.opMode || fwInit.opMode || '',
            meshRole: rawN.meshRole || fwInit.meshRole || '',
            hasInternet: !!rawN.hasInternet,
            isGateway: !!rawN.isGateway,
            firmwareConfig: fwInit,
            linkedReceivedState: { neighbors: [] }
          };

          if (typeof initNodeNetworkStack === 'function') {
            initNodeNetworkStack(node, dev);
          }
          if (typeof updateNodeNetworkStackFromConfig === 'function') {
            updateNodeNetworkStackFromConfig(node);
          }
          studioState.nodes.push(node);
        });

        (ws.links || []).forEach(rawL => {
          const srcId = rawL.srcId || rawL.fromNodeId;
          const tgtId = rawL.tgtId || rawL.toNodeId;
          const srcPort = rawL.srcPort || rawL.fromPort;
          const tgtPort = rawL.tgtPort || rawL.toPort;
          if (!srcId || !tgtId) return;
          const sNode = studioState.nodes.find(n => n.id === srcId);
          const tNode = studioState.nodes.find(n => n.id === tgtId);
          if (!sNode || !tNode) return;
          const lNum = String(rawL.id || '').match(/(\d+)$/);
          if (lNum) maxLinkNum = Math.max(maxLinkNum, parseInt(lNum[1], 10));
          const speed = rawL.speed || rawL.speedMbps || 1000;
          const link = {
            id: String(rawL.id || ('link-' + (++maxLinkNum))),
            srcId: srcId,
            srcPort: srcPort,
            tgtId: tgtId,
            tgtPort: tgtPort,
            cableType: rawL.cableType || 'ETH_CAT6A',
            speed: speed
          };
          studioState.links.push(link);
          if (sNode.networkStack && sNode.networkStack.interfaces && sNode.networkStack.interfaces[srcPort]) {
            sNode.networkStack.interfaces[srcPort].operUp = true;
            sNode.networkStack.interfaces[srcPort].speedMbps = speed;
          }
          if (tNode.networkStack && tNode.networkStack.interfaces && tNode.networkStack.interfaces[tgtPort]) {
            tNode.networkStack.interfaces[tgtPort].operUp = true;
            tNode.networkStack.interfaces[tgtPort].speedMbps = speed;
          }
        });

        nodeCounter = Math.max(nodeCounter, maxNodeNum + 1);
        linkCounter = Math.max(linkCounter, maxLinkNum + 1);

        if (typeof renderPduScenarioTable === 'function') renderPduScenarioTable();
        if (typeof propagateFirmwareStateAcrossLinks === 'function') propagateFirmwareStateAcrossLinks(true);
        renderCanvas();
        if (typeof showToast === 'function') {
          showToast('♻️ Đã khôi phục sơ đồ & cấu hình từ phiên làm việc trước F5!', 2600);
        }
        return true;
      } finally {
        _isRestoringWorkspace = false;
      }
    }

    function installWorkspaceAutosaveHooks() {
      if (typeof renderCanvas === 'function' && !renderCanvas.__fptAutosaveWrapped) {
        const origRenderCanvas = renderCanvas;
        renderCanvas = function() {
          const r = origRenderCanvas.apply(this, arguments);
          if (_workspaceReady && !_isRestoringWorkspace) {
            scheduleSaveWorkspace(400);
          }
          return r;
        };
        renderCanvas.__fptAutosaveWrapped = true;
      }
      if (typeof loadPresetTopology === 'function' && !loadPresetTopology.__fptAutosaveWrapped) {
        const origLoadPreset = loadPresetTopology;
        loadPresetTopology = function(presetKey) {
          const r = origLoadPreset.apply(this, arguments);
          if (_workspaceReady && !_isRestoringWorkspace) {
            scheduleSaveWorkspace(150);
            if (typeof syncTopologyNodesToBackend === 'function') {
              syncTopologyNodesToBackend(null, false);
            }
          }
          return r;
        };
        loadPresetTopology.__fptAutosaveWrapped = true;
      }
      window.addEventListener('beforeunload', () => {
        if (_saveWorkspaceTimer && _workspaceReady && !_isRestoringWorkspace) {
          clearTimeout(_saveWorkspaceTimer);
          saveWorkspaceNow(true);
        }
      });
    }

    document.getElementById('btn-reset-lab').addEventListener('click', async () => {
      if (confirm('Khôi phục lại bài Lab về trạng thái gốc?')) {
        _workspaceReady = false;
        clearTimeout(_saveWorkspaceTimer);
        try { localStorage.removeItem(getWorkspaceCacheKey()); } catch (_) {}
        try {
          const resetUrl = (typeof buildScopedMeshApiUrl === 'function') ? buildScopedMeshApiUrl('/api/mesh-lab/reset') : '/api/mesh-lab/reset';
          const nodesPayload = studioState.nodes.map(n => (typeof serializeNodeForBackend === 'function')
            ? serializeNodeForBackend(n)
            : { id: n.id, simId: (typeof getNodeSimId === 'function') ? getNodeSimId(n) : '' });
          await fetch(resetUrl, {
            method: 'POST',
            credentials: 'include',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ nodes: nodesPayload })
          });
        } catch (_) {}
        loadPresetTopology('p3_mesh');
        _workspaceReady = true;
        if (typeof syncTopologyNodesToBackend === 'function') {
          await syncTopologyNodesToBackend(null, false);
        }
        await saveWorkspaceNow(false);
      }
    });

    document.getElementById('btn-open-missions').addEventListener('click', openMissionsModal);

    // 14. RBAC SESSION GUARD
    async function initWorkspaceAfterAuth() {
      populatePalette();
      installWorkspaceAutosaveHooks();
      const targetInitialScenario = (window._isEmbeddedPortalLesson && window._embeddedPortalScenario)
        ? window._embeddedPortalScenario
        : 'p3_mesh';
      if (window._isEmbeddedPortalLesson) {
        try { localStorage.removeItem(getWorkspaceCacheKey()); } catch (_) {}
        loadPresetTopology(targetInitialScenario);
        _workspaceReady = true;
        if (typeof syncTopologyNodesToBackend === 'function') {
          await syncTopologyNodesToBackend(null, false);
        }
        await saveWorkspaceNow(false);
        setInterval(syncZteBackend, 4000);
        return;
      }
      const savedWs = await tryLoadSavedWorkspace();
      if (savedWs && await restoreWorkspaceFromBackend(savedWs)) {
        _workspaceReady = true;
        if (typeof syncTopologyNodesToBackend === 'function') {
          await syncTopologyNodesToBackend(null, false);
        }
      } else {
        loadPresetTopology(targetInitialScenario);
        _workspaceReady = true;
        if (typeof syncTopologyNodesToBackend === 'function') {
          await syncTopologyNodesToBackend(null, false);
        }
        await saveWorkspaceNow(false);
      }
      setInterval(syncZteBackend, 4000);
    }

    async function checkAccessAndInit() {
      initTheme();
      try {
        const res = await fetch('/api/index.php/auth/session', { credentials: 'include', cache: 'no-store' });
        if (res.status === 401) {
          if (window._isEmbeddedPortalLesson) {
            await initWorkspaceAfterAuth();
            return;
          }
          window.location.replace('/login/index.html?redirect=' + encodeURIComponent(window.location.pathname));
          return;
        }
        const data = await res.json().catch(() => ({}));
        const user = data && data.user;
        if (!user) {
          if (window._isEmbeddedPortalLesson) {
            await initWorkspaceAfterAuth();
            return;
          }
          window.location.replace('/login/index.html?redirect=' + encodeURIComponent(window.location.pathname));
          return;
        }
        const role = String(user.role || '').toUpperCase();
        const isAuthorized = role === 'DEV' || Boolean(window._isEmbeddedPortalLesson);
        if (!isAuthorized) {
          showAccessRestrictedScreen(user);
          return;
        }
        showAuthorizedBadge(user);
        await initWorkspaceAfterAuth();
      } catch (err) {
        await initWorkspaceAfterAuth();
      }
    }

    function showAccessRestrictedScreen(user) {
      const ribbon = document.querySelector('.studio-ribbon');
      const studio = document.querySelector('.studio-container');
      const restrictedScreen = document.getElementById('access-restricted-screen');
      if (ribbon) ribbon.style.display = 'none';
      if (studio) studio.style.display = 'none';
      if (restrictedScreen) {
        document.getElementById('restricted-user-name').textContent = user.displayName || user.display_name || user.email || 'Kỹ thuật viên';
        document.getElementById('restricted-user-role').textContent = user.roleName || user.role_name || user.role || 'KTV';
        document.getElementById('restricted-user-empid').textContent = user.employeeId || user.employee_id || 'Chưa định danh';
        restrictedScreen.style.display = 'flex';
      }
    }

    function showAuthorizedBadge(user) {
      const badge = document.getElementById('user-role-badge');
      if (badge) {
        badge.textContent = `🔑 ${String(user.role || '').toUpperCase()}`;
        badge.style.display = 'inline-flex';
      }
    }

    checkAccessAndInit();
