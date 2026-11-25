    // 13.5 PHASE 5: TOPOLOGY-AS-CODE (CONTAINERLAB YAML / .FPTLAB JSON) & KTV FAULT INJECTION SCENARIOS
    let activeFaultScenarioKey = null;

    function openContainerlabModal(defaultTab = 'faults') {
      refreshContainerlabCodeViews();
      switchContainerlabTab(defaultTab);
      document.getElementById('containerlab-modal').style.display = 'flex';
    }

    function closeContainerlabModal() {
      document.getElementById('containerlab-modal').style.display = 'none';
    }

    function switchContainerlabTab(tabKey) {
      refreshContainerlabCodeViews();
      ['faults', 'yaml', 'json'].forEach(k => {
        const btn = document.getElementById('clab-tab-btn-' + k);
        const view = document.getElementById('clab-view-' + k);
        if (btn) btn.classList.toggle('active', k === tabKey);
        if (view) view.style.display = (k === tabKey) ? 'flex' : 'none';
      });
    }

    function buildContainerlabYaml() {
      const pon = calculateOpticalPonMetrics();
      const ssidEl = document.getElementById('cfg-wifi-ssid');
      const ssid = ssidEl ? ssidEl.value : 'FPT_BE12000_WIFI7';

      const lines = [
        `# =====================================================================`,
        `# FPT NetLab Studio — Containerlab Topology-as-Code (.clab.yml)`,
        `# Generated at: ${new Date().toISOString()}`,
        `# Optical PON Rx: ${pon.rxDbm.toFixed(2)} dBm (${pon.state}) | SSID: ${ssid}`,
        `# =====================================================================`,
        `name: fpt-telecom-mesh-lab`,
        `prefix: fptlab`,
        ``,
        `mgmt:`,
        `  network: fpt_mgmt_net`,
        `  ipv4-subnet: 192.168.1.0/24`,
        ``,
        `topology:`,
        `  nodes:`
      ];

      studioState.nodes.forEach(n => {
        const dev = FPT_CATALOG[n.catalogKey] || {};
        const kind = (n.catalogKey === 'mikrotik_hexs')
          ? 'vr-ros'
          : (n.catalogKey === 'switch_2960' || n.catalogKey === 'olt_cloud')
          ? 'cisco_iol'
          : (n.category === 'client' ? 'linux' : 'fpt_zte_zxros');
        const img = dev.folder ? `fpt-netlab/${dev.folder}:latest` : `fpt-netlab/${n.catalogKey}:v8.2`;
        lines.push(`    ${n.name.replace(/\s+/g, '_')}:`);
        lines.push(`      kind: ${kind}`);
        lines.push(`      image: ${img}`);
        lines.push(`      mgmt-ipv4: ${n.ip}`);
        lines.push(`      labels:`);
        lines.push(`        fpt.model: "${n.model}"`);
        lines.push(`        fpt.mac: "${n.mac}"`);
        lines.push(`        fpt.power: "${n.power ? 'on' : 'off'}"`);
        lines.push(`        fpt.pos: "${Math.round(n.x)},${Math.round(n.y)}"`);
      });

      lines.push(``);
      lines.push(`  links:`);
      studioState.links.forEach(l => {
        const sNode = studioState.nodes.find(n => n.id === l.srcId);
        const tNode = studioState.nodes.find(n => n.id === l.tgtId);
        if (!sNode || !tNode) return;
        const sName = sNode.name.replace(/\s+/g, '_');
        const tName = tNode.name.replace(/\s+/g, '_');
        lines.push(`    - endpoints: ["${sName}:${l.srcPort}", "${tName}:${l.tgtPort}"]`);
        lines.push(`      vars:`);
        lines.push(`        media: "${l.cableType}"`);
        lines.push(`        speed_mbps: ${l.speed}`);
      });

      return lines.join('\n');
    }

    function buildFptLabJson() {
      const ssidEl = document.getElementById('cfg-wifi-ssid');
      const payload = {
        schema: 'fpt-netlab-v8.2',
        exportedAt: new Date().toISOString(),
        wifiSsid: ssidEl ? ssidEl.value : 'FPT_BE12000_WIFI7',
        physics: studioState.physics,
        nodes: studioState.nodes.map(n => ({
          id: n.id,
          catalogKey: n.catalogKey,
          name: n.name,
          model: n.model,
          svgType: n.svgType,
          category: n.category,
          role: n.role,
          roleLabel: n.roleLabel,
          ip: n.ip,
          mac: n.mac,
          x: Math.round(n.x),
          y: Math.round(n.y),
          power: n.power,
          portAdminDown: n.portAdminDown || {}
        })),
        links: studioState.links.map(l => ({
          id: l.id,
          srcId: l.srcId,
          srcPort: l.srcPort,
          tgtId: l.tgtId,
          tgtPort: l.tgtPort,
          cableType: l.cableType,
          speed: l.speed
        }))
      };
      return JSON.stringify(payload, null, 2);
    }

    function refreshContainerlabCodeViews() {
      const yEl = document.getElementById('clab-yaml-textarea');
      const jEl = document.getElementById('clab-json-textarea');
      if (yEl) yEl.value = buildContainerlabYaml();
      if (jEl) jEl.value = buildFptLabJson();
    }

    function copyTextFromEl(elId, toastMsg) {
      const el = document.getElementById(elId);
      if (!el) return;
      el.select();
      try {
        navigator.clipboard.writeText(el.value);
      } catch (_) {
        document.execCommand('copy');
      }
      showToast(`📋 ${toastMsg}`);
    }

    function downloadTopologyFile(format) {
      const isYaml = format === 'yaml';
      const content = isYaml ? buildContainerlabYaml() : buildFptLabJson();
      const filename = isYaml ? 'fpt-mesh-topology.clab.yml' : 'fpt-mesh-topology.fptlab.json';
      const blob = new Blob([content], { type: 'text/plain;charset=utf-8' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = filename;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
      showToast(`⬇️ Đã tải xuống file ${filename}!`);
    }

    function applyImportedTopologyObject(obj) {
      if (!obj || !Array.isArray(obj.nodes) || !Array.isArray(obj.links)) {
        showToast('❌ File sơ đồ không hợp lệ (thiếu danh sách nodes hoặc links)!');
        return false;
      }
      studioState.nodes = obj.nodes.map(n => {
        const nodeObj = {
          ...n,
          power: n.power !== undefined ? n.power : true,
          portAdminDown: n.portAdminDown || {}
        };
        if (typeof initNodeNetworkStack === 'function') {
          initNodeNetworkStack(nodeObj, typeof FPT_CATALOG !== 'undefined' ? FPT_CATALOG[nodeObj.catalogKey] : null);
        }
        return nodeObj;
      });
      studioState.links = obj.links.map(l => ({ ...l }));
      if (obj.physics) {
        studioState.physics = { ...studioState.physics, ...obj.physics };
      }
      if (obj.wifiSsid && document.getElementById('cfg-wifi-ssid')) {
        document.getElementById('cfg-wifi-ssid').value = obj.wifiSsid;
      }
      nodeCounter = studioState.nodes.length + 10;
      linkCounter = studioState.links.length + 10;
      renderCanvas();
      syncZteBackend();
      showToast(`✅ Đã nạp thành công sơ đồ (${studioState.nodes.length} thiết bị, ${studioState.links.length} kết nối)!`);
      return true;
    }

    function importTopologyFromTextarea() {
      const jEl = document.getElementById('clab-json-textarea');
      if (!jEl || !jEl.value.trim()) return;
      try {
        const parsed = JSON.parse(jEl.value);
        if (applyImportedTopologyObject(parsed)) {
          closeContainerlabModal();
        }
      } catch (e) {
        showToast(`❌ Lỗi cú pháp JSON: ${e.message}`);
      }
    }

    function handleFptLabFileUpload(event) {
      const file = event.target.files && event.target.files[0];
      if (!file) return;
      const reader = new FileReader();
      reader.onload = (ev) => {
        try {
          const parsed = JSON.parse(ev.target.result);
          if (applyImportedTopologyObject(parsed)) {
            refreshContainerlabCodeViews();
            closeContainerlabModal();
          }
        } catch (err) {
          showToast(`❌ Không thể đọc file .fptlab.json: ${err.message}`);
        }
      };
      reader.readAsText(file);
    }

    function loadTroubleshootingFaultScenario(faultKey) {
      activeFaultScenarioKey = faultKey;
      const banner = document.getElementById('fault-verify-banner');
      if (banner) banner.style.display = 'none';

      // Reset physics to clean baseline first
      studioState.physics.splitterRatio = '1:32';
      studioState.physics.fiberLengthKm = 1.5;
      studioState.physics.fiberFaultDb = 0;
      studioState.physics.wallMaterial = 'brick20';

      if (faultKey === 'fault_bottleneck_1g') {
        loadPresetTopology('zte_wifi7');
        // Replace optimal 2.5G link with 1G bottleneck link on LAN2_1GE + CAT.5e
        createLink('node-2', 'LAN2_1GE', 'node-3', 'WAN_25GE', 'ETH_CAT5E', 1000);
        renderCanvas();
        syncZteBackend();
        closeContainerlabModal();
        showToast('🛠️ [Đã nạp Pan 1]: Cáp Backhaul đang cắm nhầm cổng LAN2 (1G) bằng dây CAT.5e gây nghẽn 940Mbps!');
      } else if (faultKey === 'fault_optical_los') {
        loadPresetTopology('zte_wifi7');
        studioState.physics.fiberFaultDb = 16.0;
        const fltSel = document.getElementById('ns3-fiber-fault-select');
        if (fltSel) fltSel.value = '16.0';
        toggleNs3PhysicsPanel(true);
        renderCanvas();
        closeContainerlabModal();
        showToast('🚨 [Đã nạp Pan 2]: Báo Đỏ LOS (-34.9 dBm)! Hãy mở CLI gõ "show pon optical-info" hoặc chỉnh lại đầu Fast Connector trên bảng Vật Lý ns-3!');
      } else if (faultKey === 'fault_wall_deadzone') {
        loadPresetTopology('zte_wifi7');
        setWorkspaceMode('physical');
        studioState.physics.wallMaterial = 'concrete';
        const wSel = document.getElementById('ns3-wall-material-select');
        if (wSel) wSel.value = 'concrete';
        // Move AP to Living Room (x=420) and Phone far across 2 concrete walls (x=1060)
        const ap = studioState.nodes.find(n => n.id === 'node-3');
        const phone = studioState.nodes.find(n => n.id === 'node-4');
        if (ap) ap.x = 420;
        if (phone) phone.x = 1060;
        renderCanvas();
        closeContainerlabModal();
        showToast('🧱 [Đã nạp Pan 3]: Điện thoại ở phòng xa xuyên qua 2 vách bê tông cốt thép (-89 dBm Mất sóng)! Hãy kéo AP_BE15000Z sang phòng ngủ (x > 700)!');
      } else if (faultKey === 'fault_port_shutdown') {
        loadPresetTopology('mikrotik_enterprise');
        const sw = studioState.nodes.find(n => n.catalogKey === 'switch_2960');
        if (sw) {
          sw.portAdminDown = { 'Gi0_1': true };
        }
        renderCanvas();
        closeContainerlabModal();
        showToast('🔒 [Đã nạp Pan 4]: Cổng Gi0_1 trên Switch_2.5G đang bị "shutdown"! Hãy mở CLI Switch -> enable -> conf t -> int Gi0_1 -> no shutdown!');
      } else if (faultKey === 'fault_wrong_ssid_power') {
        loadPresetTopology('zte_wifi7');
        const ap = studioState.nodes.find(n => n.catalogKey === 'be15000');
        if (ap) ap.power = false;
        renderCanvas();
        syncZteBackend();
        closeContainerlabModal();
        showToast('🔌 [Đã nạp Pan 5]: AP_BE15000Z đang bị tắt nguồn 12V DC! Hãy double-click mở AP và bật nguồn 12V ON!');
      }
    }

    function verifyCurrentFaultResolved() {
      const banner = document.getElementById('fault-verify-banner');
      if (!banner) return;
      banner.style.display = 'block';

      const pon = calculateOpticalPonMetrics();
      const allPowered = studioState.nodes.every(n => n.power);
      const anyAdminDown = studioState.nodes.some(n =>
        n.portAdminDown && Object.values(n.portAdminDown).some(v => v === true)
      );
      const wifiLink = studioState.links.find(l => l.cableType === 'WIFI_MESH');
      let wifiOk = true;
      if (wifiLink) {
        const s = studioState.nodes.find(n => n.id === wifiLink.srcId);
        const t = studioState.nodes.find(n => n.id === wifiLink.tgtId);
        if (s && t && calculateWifiLinkPhysics(s, t).qualityState === 'down') {
          wifiOk = false;
        }
      }
      const zteBackhaul = studioState.links.find(l => {
        const s = studioState.nodes.find(n => n.id === l.srcId);
        const t = studioState.nodes.find(n => n.id === l.tgtId);
        return s && t && ((s.catalogKey === 'be12000' && t.catalogKey === 'be15000') || (s.catalogKey === 'be15000' && t.catalogKey === 'be12000'));
      });
      const backhaulBottleneck = zteBackhaul && (zteBackhaul.speed < 2500 || zteBackhaul.cableType === 'ETH_CAT5E');

      const issues = [];
      if (!allPowered) issues.push('Còn thiết bị đang tắt nguồn 12V DC.');
      if (pon.state === 'O1_LOS') issues.push(`Tuyến quang đang bị Báo Đỏ LOS (${pon.rxDbm.toFixed(1)} dBm < -30 dBm).`);
      if (anyAdminDown) issues.push('Còn cổng Switch đang bị khóa (administratively down — cần lệnh "no shutdown").');
      if (!wifiOk) issues.push('Thiết bị đầu cuối Wi-Fi đang nằm trong vùng mất sóng (Dead Zone < -84 dBm).');
      if (backhaulBottleneck) issues.push('Tuyến Backhaul giữa ONT và AP vẫn đang bị nghẽn 1Gbps (cần cáp CAT.6A cắm cổng LAN1 10GE ↔ WAN 2.5GE).');

      if (issues.length === 0) {
        banner.style.background = 'rgba(16, 185, 129, 0.18)';
        banner.style.border = '1px solid #10b981';
        banner.style.color = '#34d399';
        banner.innerHTML = `🎉 <b>XUẤT SẮC! Đã khắc phục triệt để Pan bệnh!</b> Toàn bộ tuyến Quang PON (${pon.rxDbm.toFixed(2)} dBm O5), Backhaul Multi-Gig và vùng phủ Wi-Fi đều đạt chuẩn 100%!`;
        showToast('🎉 Chúc mừng KTV! Bạn đã xử lý thành công Pan bệnh thực tế!');
      } else {
        banner.style.background = 'rgba(239, 68, 68, 0.16)';
        banner.style.border = '1px solid #ef4444';
        banner.style.color = '#fca5a5';
        banner.innerHTML = `⚠️ <b>Chưa khắc phục xong (${issues.length} lỗi tồn đọng):</b><br>• ` + issues.join('<br>• ');
      }
    }

