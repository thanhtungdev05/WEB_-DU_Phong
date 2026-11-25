    // PHASE 4: NS-3 PHYSICAL LAYER ENGINE (OPTICAL PON ATTENUATION & WI-FI WALL PROPAGATION)
    function calculateOpticalPonMetrics() {
      const p = studioState.physics || { oltTxDbm: 3.5, splitterRatio: '1:32', fiberLengthKm: 1.5, fiberFaultDb: 0 };
      const splitterLossMap = { '1:32': 16.5, '1:64': 19.8, '1:128': 23.2 };
      const splitterLossDb = splitterLossMap[p.splitterRatio] || 16.5;
      const fiberDistLossDb = +(p.fiberLengthKm * 0.28 + 0.8).toFixed(2);
      const faultLossDb = Number(p.fiberFaultDb || 0);

      const fiberLink = studioState.links.find(l => l.cableType === 'FIBER_SC');
      let hasFiberLink = false;
      if (fiberLink) {
        const sNode = studioState.nodes.find(n => n.id === fiberLink.srcId);
        const tNode = studioState.nodes.find(n => n.id === fiberLink.tgtId);
        hasFiberLink = !!(sNode && tNode && sNode.power && tNode.power);
      }

      if (!hasFiberLink) {
        return {
          hasFiberLink: false,
          oltTxDbm: p.oltTxDbm,
          splitterRatio: p.splitterRatio,
          splitterLossDb,
          fiberLengthKm: p.fiberLengthKm,
          fiberDistLossDb,
          faultLossDb,
          rxDbm: -40.0,
          state: 'O1_LOS',
          stateLabel: '🔴 O1 LOS (Mất Quang)',
          speedFactor: 0
        };
      }

      const rxDbm = +(p.oltTxDbm - splitterLossDb - fiberDistLossDb - faultLossDb).toFixed(2);
      if (rxDbm < -30.0) {
        return {
          hasFiberLink: true,
          oltTxDbm: p.oltTxDbm,
          splitterRatio: p.splitterRatio,
          splitterLossDb,
          fiberLengthKm: p.fiberLengthKm,
          fiberDistLossDb,
          faultLossDb,
          rxDbm,
          state: 'O1_LOS',
          stateLabel: '🔴 Báo Đỏ LOS (< -30 dBm)',
          speedFactor: 0
        };
      }
      if (rxDbm < -27.0) {
        return {
          hasFiberLink: true,
          oltTxDbm: p.oltTxDbm,
          splitterRatio: p.splitterRatio,
          splitterLossDb,
          fiberLengthKm: p.fiberLengthKm,
          fiberDistLossDb,
          faultLossDb,
          rxDbm,
          state: 'O5_WARN',
          stateLabel: '🟡 Suy Hao Cao (BER Cảnh Báo)',
          speedFactor: 0.25
        };
      }
      return {
        hasFiberLink: true,
        oltTxDbm: p.oltTxDbm,
        splitterRatio: p.splitterRatio,
        splitterLossDb,
        fiberLengthKm: p.fiberLengthKm,
        fiberDistLossDb,
        faultLossDb,
        rxDbm,
        state: 'O5_NORMAL',
        stateLabel: '🟢 O5 Chuẩn Kỹ Thuật',
        speedFactor: 1.0
      };
    }

    function calculateWifiLinkPhysics(srcNode, tgtNode) {
      const p = studioState.physics || { wallMaterial: 'brick20' };
      const wallLossMap = { glass: 3, brick10: 8, brick20: 14, concrete: 22 };
      const wallNameMap = {
        glass: 'Vách kính (-3 dB)',
        brick10: 'Tường gạch 10cm (-8 dB)',
        brick20: 'Tường gạch 20cm (-14 dB)',
        concrete: 'Bê tông cốt thép (-22 dB)'
      };
      const wallLossPerUnit = wallLossMap[p.wallMaterial] || 14;

      const x1 = srcNode.x + 68, y1 = srcNode.y + 38;
      const x2 = tgtNode.x + 68, y2 = tgtNode.y + 38;
      const distPx = Math.hypot(x2 - x1, y2 - y1);
      const distMeters = Math.max(1.2, +(distPx / 45).toFixed(1));

      // Architectural Wall Boundaries on Floorplan (x=550 and x=890)
      const wallPlanes = [550, 890];
      let wallsCrossed = 0;
      const minX = Math.min(x1, x2), maxX = Math.max(x1, x2);
      wallPlanes.forEach(wx => {
        if (minX < wx && maxX > wx) wallsCrossed++;
      });

      const totalWallLossDb = wallsCrossed * wallLossPerUnit;
      const freeSpaceAndDistLoss = 37.5 + 24 * Math.log10(distMeters);
      const rssiDbm = Math.round(23.0 - (freeSpaceAndDistLoss + totalWallLossDb));

      let phyRateMbps = 2400;
      let bandLabel = '6GHz MLO';
      let qualityState = 'up';

      if (rssiDbm >= -58) {
        phyRateMbps = 2400;
        bandLabel = 'Wi-Fi 7 MLO (320MHz)';
        qualityState = 'up';
      } else if (rssiDbm >= -68) {
        phyRateMbps = 1200;
        bandLabel = 'Wi-Fi 6/7 (5GHz 160MHz)';
        qualityState = 'up';
      } else if (rssiDbm >= -77) {
        phyRateMbps = 360;
        bandLabel = `Xuyên ${wallsCrossed} tường (5G/2.4G)`;
        qualityState = 'bottleneck';
      } else if (rssiDbm >= -84) {
        phyRateMbps = 54;
        bandLabel = 'Sóng yếu 2.4GHz ⚠️';
        qualityState = 'bottleneck';
      } else {
        phyRateMbps = 0;
        bandLabel = 'Mất sóng (Dead Zone) 🚨';
        qualityState = 'down';
      }

      return {
        distMeters,
        wallsCrossed,
        wallMaterialName: wallNameMap[p.wallMaterial] || 'Tường gạch 20cm',
        totalWallLossDb,
        rssiDbm,
        phyRateMbps,
        bandLabel,
        qualityState
      };
    }

    function toggleNs3PhysicsPanel(forceState = null) {
      const panel = document.getElementById('ns3-physics-panel');
      const btn = document.getElementById('btn-toggle-physics-panel');
      if (!panel) return;
      studioState.physics.panelOpen = forceState !== null ? forceState : !studioState.physics.panelOpen;
      panel.classList.toggle('open', studioState.physics.panelOpen);
      if (btn) btn.classList.toggle('active', studioState.physics.panelOpen);
      updateNs3PhysicsPanelUi();
    }

    function applyNs3PhysicsConfig() {
      const spEl = document.getElementById('ns3-splitter-select');
      const kmEl = document.getElementById('ns3-fiber-km-select');
      const fltEl = document.getElementById('ns3-fiber-fault-select');
      const wallEl = document.getElementById('ns3-wall-material-select');

      if (spEl) studioState.physics.splitterRatio = spEl.value;
      if (kmEl) studioState.physics.fiberLengthKm = parseFloat(kmEl.value) || 1.5;
      if (fltEl) studioState.physics.fiberFaultDb = parseFloat(fltEl.value) || 0;
      if (wallEl) studioState.physics.wallMaterial = wallEl.value;

      renderCanvas();
      const pon = calculateOpticalPonMetrics();
      showToast(`🔬 [ns-3 Vật Lý]: Quang thu ONT = ${pon.rxDbm} dBm (${pon.stateLabel})`);
    }

    function updateNs3PhysicsPanelUi() {
      const pon = calculateOpticalPonMetrics();
      const ponBadge = document.getElementById('ns3-pon-status-badge');
      const ponMeter = document.getElementById('ns3-pon-rx-meter');
      const hudOpt = document.getElementById('hud-optical');
      const floorPon = document.getElementById('floor-pon-label');

      const col = pon.state === 'O5_NORMAL' ? '#4ade80' : (pon.state === 'O5_WARN' ? '#fbbf24' : '#f87171');
      if (ponBadge) {
        ponBadge.textContent = pon.stateLabel;
        ponBadge.style.color = col;
      }
      if (ponMeter) {
        ponMeter.textContent = `${pon.rxDbm.toFixed(2)} dBm (${pon.state === 'O5_NORMAL' ? 'PASS' : (pon.state === 'O5_WARN' ? 'SUY HAO CAO' : 'BÁO ĐỎ LOS')})`;
        ponMeter.style.color = col;
      }
      if (hudOpt) {
        hudOpt.innerHTML = `<span class="hud-dot"></span> PON: ${pon.rxDbm.toFixed(1)} dBm (${pon.state === 'O5_NORMAL' ? 'O5' : (pon.state === 'O5_WARN' ? 'Suy hao' : 'LOS')})`;
        hudOpt.className = 'hud-chip ' + (pon.state === 'O5_NORMAL' ? 'good' : (pon.state === 'O5_WARN' ? 'warn' : 'bad'));
      }
      if (floorPon) {
        floorPon.textContent = `XGS-PON/GPON • Rx: ${pon.rxDbm.toFixed(2)} dBm (${pon.stateLabel})`;
      }

      // Update Wi-Fi RSSI meter & Floorplan wall badges
      const wallLabelMap = {
        glass: '🪟 Vách kính (-3 dB/tường)',
        brick10: '🧱 Tường gạch 10cm (-8 dB/tường)',
        brick20: '🧱 Tường chịu lực 20cm (-14 dB/tường)',
        concrete: '🏢 Bê tông cốt thép (-22 dB/tường)'
      };
      const wText = wallLabelMap[studioState.physics.wallMaterial] || '🧱 Tường chịu lực 20cm (-14 dB)';
      const wb1 = document.getElementById('floor-wall-badge-1');
      const wb2 = document.getElementById('floor-wall-badge-2');
      if (wb1) wb1.textContent = wText;
      if (wb2) wb2.textContent = wText;

      const wifiMeter = document.getElementById('ns3-wifi-rssi-meter');
      if (wifiMeter) {
        const wifiLink = studioState.links.find(l => l.cableType === 'WIFI_MESH');
        if (wifiLink) {
          const sNode = studioState.nodes.find(n => n.id === wifiLink.srcId);
          const tNode = studioState.nodes.find(n => n.id === wifiLink.tgtId);
          if (sNode && tNode) {
            const wf = calculateWifiLinkPhysics(sNode, tNode);
            wifiMeter.textContent = `${wf.rssiDbm} dBm (${wf.wallsCrossed} tường) • ${wf.phyRateMbps} Mbps`;
            wifiMeter.style.color = wf.qualityState === 'up' ? '#38bdf8' : (wf.qualityState === 'bottleneck' ? '#fbbf24' : '#f87171');
          }
        } else {
          wifiMeter.textContent = 'Không có kết nối Wi-Fi đang hoạt động';
          wifiMeter.style.color = '#94a3b8';
        }
      }
    }

    let backendZteState = {};
    let nodeCounter = 1;
    let linkCounter = 1;
    let pduCounter = 1;

    function showToast(text, duration = 2800) {
      const t = document.getElementById('toast-box');
      if (!t) return;
      t.textContent = text;
      t.style.display = 'block';
      clearTimeout(t._timer);
      t._timer = setTimeout(() => { t.style.display = 'none'; }, duration);
    }

    function initTheme() {
      const saved = localStorage.getItem('fpt_studio_theme') || 'light';
      applyTheme(saved);
    }
    function toggleStudioTheme() {
      const isDark = document.body.classList.contains('dark-theme');
      applyTheme(isDark ? 'light' : 'dark');
    }
    function applyTheme(theme) {
      const isDark = (theme === 'dark');
      document.body.classList.toggle('dark-theme', isDark);
      try { localStorage.setItem('fpt_studio_theme', theme); } catch (e) {}
      const icon = document.getElementById('theme-toggle-icon');
      const text = document.getElementById('theme-toggle-text');
      if (icon) icon.textContent = isDark ? '☀️' : '🌙';
      if (text) text.textContent = isDark ? 'Sáng' : 'Tối';
      renderCanvas();
    }

