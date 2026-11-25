    // 3. STUDIO STATE
    let studioState = {
      nodes: [],
      links: [],
      pduList: [],
      selectedNodeId: null,
      selectedLinkId: null,
      currentTool: 'select',
      currentCableType: 'AUTO',
      workspaceMode: 'logical',
      simEngineMode: 'realtime',
      showPortLabels: true,
      wireStartNodeId: null,
      wireStartPortId: null,
      wireMousePos: null,
      pduStartNodeId: null,
      activePduEnvelope: null,
      activeDeviceWindowNodeId: null,
      chassisZoom: 1.0,
      labElapsedOffset: 0,
      labStartEpoch: Date.now(),
      physics: {
        panelOpen: false,
        oltTxDbm: 3.5,
        splitterRatio: '1:32',
        fiberLengthKm: 1.5,
        fiberFaultDb: 0,
        wallMaterial: 'brick20'
      }
    };
    window.studioState = studioState;

    function notifyParentTopologyChanged() {
      window.studioState = studioState;
      try {
        if (window.parent && window.parent !== window) {
          window.parent.postMessage({
            type: 'FTC_CANVAS_TOPOLOGY_CHANGED',
            nodeCount: (studioState.nodes || []).length,
            linkCount: (studioState.links || []).length
          }, '*');
        }
      } catch (e) {}
    }
    window.notifyParentTopologyChanged = notifyParentTopologyChanged;

    // 4. CLEAN HORIZONTAL ALIGNED PRESETS (7 SCENARIOS ACROSS ALL 16 SIMULATORS)
    function loadPresetTopology(presetKey) {
      studioState.nodes = [];
      studioState.links = [];
      studioState.pduList = [];
      studioState.gradedResult = null;
      nodeCounter = 1;
      linkCounter = 1;
      window.studioState = studioState;
      notifyParentTopologyChanged();

      const midY = 175;
      if (presetKey === 'p3_mesh' || presetKey === 'zte_wifi7' || presetKey === 'p3_mesh_ax3000cv2' || presetKey === 'p3_mesh_ax3000gzv2' || presetKey === 'p3_mesh_ax3000hv2' || presetKey === 'p3_mesh_ax1800gz' || presetKey === 'p3_mesh_ax3000s' || presetKey === 'p3_mesh_zte') {
        studioState.currentScenario = (presetKey === 'zte_wifi7') ? 'p3_mesh' : presetKey;
        showToast('📶 Phần: Cấu Hình MESH WIFI — Hãy kéo thả đúng cặp thiết bị của bài cấu hình từ kệ bên dưới lên Canvas!');
      } else if (presetKey === 'p3_dhcp') {
        studioState.currentScenario = 'p3_dhcp';
        showToast('🌐 Phần: Cấu Hình DHCP — Hãy kéo 1 ONT và 1 AP lên Canvas và cắm LAN ➔ WAN!');
      } else if (presetKey === 'p3_bridge') {
        studioState.currentScenario = 'p3_bridge';
        showToast('🌉 Phần: Cấu Hình BRIDGE — Hãy kéo 1 ONT và 1 AP lên Canvas (tắt DHCP AP - 0 DHCP)!');
      } else if (presetKey === 'p3_static') {
        studioState.currentScenario = 'p3_static';
        showToast('📌 Phần: Cấu Hình STATIC — Hãy kéo 1 ONT và 1 AP lên Canvas (đặt IP .2-.9, tắt DHCP AP)!');
      } else if (presetKey === 'be6500c_wifi7') {
        spawnNode('olt_cloud', 95, midY, 'FPT_OLT_GPON');
        spawnNode('ont_be6500c', 395, midY, 'ONT_BE6500C');
        spawnNode('be6500c', 715, midY, 'AP_BE6500C');
        spawnNode('phone_ktv', 1020, midY, 'Phone_WiFi7');

        createLink('node-1', 'OPT_GPON', 'node-2', 'PON_GPON', 'FIBER_SC', 2500);
        createLink('node-2', 'LAN1_25GE', 'node-3', 'WAN_25GE', 'ETH_CAT6A', 2500);
        createLink('node-3', 'WIFI7', 'node-4', 'WLAN0', 'WIFI_MESH', 2400);

        showToast('🔥 Đã nạp mẫu: Combo Wi-Fi 7 BE6500C (ONT BE6500C + AP BE6500C 2.5GE)');
      } else if (presetKey === 'wifi6_gpon') {
        spawnNode('olt_cloud', 95, midY, 'FPT_OLT_GPON');
        spawnNode('ax3000gz_v2', 395, midY, 'ONT_AX3000GZ_V2');
        spawnNode('ax3000c', 715, midY, 'AP_AX3000C');
        spawnNode('laptop_pc', 1020, midY, 'Laptop_KTV');

        createLink('node-1', 'OPT_GPON', 'node-2', 'PON_GPON', 'FIBER_SC', 2500);
        createLink('node-2', 'LAN1_1GE', 'node-3', 'WAN_1GE', 'ETH_CAT6A', 1000);
        createLink('node-3', 'WIFI6', 'node-4', 'WLAN0', 'WIFI_MESH', 1200);

        showToast('📶 Đã nạp mẫu: Wi-Fi 6 GPON (AX3000GZ V2 + AX3000C)');
      } else if (presetKey === 'mikrotik_enterprise') {
        spawnNode('olt_cloud', 75, midY, 'FPT_OLT_Core');
        spawnNode('ac1000f', 325, midY, 'Bridge_AC1000F');
        spawnNode('mikrotik_hexs', 585, midY, 'MikroTik_hEX_S');
        spawnNode('switch_2960', 840, midY, 'Switch_2.5G');
        spawnNode('laptop_pc', 1075, midY, 'Admin_Laptop');

        createLink('node-1', 'OPT_GPON', 'node-2', 'PON', 'FIBER_SC', 2500);
        createLink('node-2', 'LAN1', 'node-3', 'ether1', 'ETH_CAT6A', 1000);
        createLink('node-3', 'ether2', 'node-4', 'Gi0_1', 'ETH_CAT6A', 1000);
        createLink('node-4', 'Gi0_2', 'node-5', 'ETH0', 'ETH_CAT6A', 2500);

        showToast('🛠️ Đã nạp mẫu: Doanh Nghiệp MikroTik (Bridge AC1000F + MikroTik hEX S + Switch)');
      } else if (presetKey === 'sme_enterprise') {
        spawnNode('olt_cloud', 95, midY, 'FPT_OLT_Core');
        spawnNode('ac1000hi', 395, midY, 'Bridge_AC1000Hi');
        spawnNode('vigor2927', 715, midY, 'Router_Vigor2927');
        spawnNode('laptop_pc', 1020, midY, 'Admin_PC');

        createLink('node-1', 'OPT_GPON', 'node-2', 'PON', 'FIBER_SC', 2500);
        createLink('node-2', 'LAN1', 'node-3', 'WAN1', 'ETH_CAT6A', 1000);
        createLink('node-3', 'LAN1', 'node-4', 'ETH0', 'ETH_CAT6A', 1000);

        showToast('🏢 Đã nạp mẫu: Doanh Nghiệp DrayTek (Bridge AC1000Hi + Vigor 2927)');
      } else if (presetKey === 'wifi5_family') {
        spawnNode('olt_cloud', 95, midY, 'FPT_OLT_GPON');
        spawnNode('ac1000z', 395, midY, 'ONT_AC1000Z');
        spawnNode('ac1000cv2', 715, midY, 'Hub_AC1000C_V2');
        spawnNode('fpt_playbox', 1020, midY, 'FPT_Play_Box_4K');

        createLink('node-1', 'OPT_GPON', 'node-2', 'PON', 'FIBER_SC', 2500);
        createLink('node-2', 'LAN1', 'node-3', 'LAN1', 'ETH_CAT6A', 1000);
        createLink('node-3', 'LAN2', 'node-4', 'ETH0', 'ETH_CAT6A', 1000);

        showToast('🏠 Đã nạp mẫu: Gia Đình Wi-Fi 5 (ONT AC1000Z + AC1000C V2 + FPT Play Box)');
      } else {
        showToast('📄 Canvas Trống — Kéo thả bất kỳ thiết bị nào từ kệ 21 thiết bị bên dưới!');
      }

      if (typeof populatePalette === 'function') {
        populatePalette();
      }
      renderPduScenarioTable();
      propagateFirmwareStateAcrossLinks(false);
      renderCanvas();
      clampNodesInsideCanvasViewport();
      syncZteBackend();
    }

    // Nạp cặp thiết bị mẫu chuẩn kỹ thuật cho từng kịch bản Phase 3 khi KTV bấm '⚡ Mẫu Gợi Ý'
    function loadSamplePresetPair(scenarioKey) {
      const sk = scenarioKey || studioState.currentScenario || 'p3_mesh';
      studioState.nodes = [];
      studioState.links = [];
      studioState.pduList = [];
      studioState.gradedResult = null;
      nodeCounter = 1;
      linkCounter = 1;
      window.studioState = studioState;
      notifyParentTopologyChanged();

      const midY = 175;
      if (sk === 'p3_mesh') {
        studioState.currentScenario = 'p3_mesh';
        spawnNode('olt_cloud', 95, midY, 'FPT_OLT_Core');
        spawnNode('ax3000hv2', 395, midY, 'ONT_AX3000HV2');
        spawnNode('ax3000c', 715, midY, 'AP_AX3000CV2');
        spawnNode('phone_ktv', 1020, midY, 'Smartphone_KTV');

        createLink('node-1', 'OPT_GPON', 'node-2', 'PON_GPON', 'FIBER_SC', 2500);
        // AX3000HV2 với AX3000Cv2: Cắm LAN ➔ LAN theo HDCV chuẩn FPT
        createLink('node-2', 'LAN1_1GE', 'node-3', 'LAN1', 'ETH_CAT6A', 1000);
        createLink('node-3', 'WIFI6', 'node-4', 'WLAN0', 'WIFI_MESH', 1200);

        showToast('⚡ Đã nạp mẫu Phần: Cấu Hình MESH WIFI (AX3000HV2 + AX3000Cv2, LAN-LAN)');
      } else if (sk === 'p3_mesh_ax3000cv2') {
        studioState.currentScenario = 'p3_mesh';
        const ctrl = spawnNode('ax3000c', 320, midY, 'AX3000CV2_Controller');
        const ag = spawnNode('ax3000c', 670, midY, 'AX3000CV2_Agent');
        spawnNode('laptop_pc', 990, midY, 'Laptop_KTV');

        if (ctrl) {
          ctrl.ip = '192.168.100.1';
          ctrl.meshRole = 'Controller';
          if (!ctrl.firmwareConfig) ctrl.firmwareConfig = {};
          ctrl.firmwareConfig.lanIp = '192.168.100.1';
          ctrl.firmwareConfig.meshRole = 'Controller';
          ctrl.firmwareConfig.meshEnabled = true;
        }
        if (ag) {
          ag.ip = '192.168.100.200';
          ag.meshRole = 'Agent';
          if (!ag.firmwareConfig) ag.firmwareConfig = {};
          ag.firmwareConfig.lanIp = '192.168.100.200';
          ag.firmwareConfig.meshRole = 'Agent';
        }

        // AX3000C V2 ↔ AX3000C V2: Cắm LAN1 ➔ LAN1 theo HDCV chuẩn FPT (Trang 12 & 16)
        createLink('node-1', 'LAN1_1GE', 'node-2', 'LAN1_1GE', 'ETH_CAT6A', 1000);
        createLink('node-2', 'LAN2_1GE', 'node-3', 'ETH0', 'ETH_CAT6A', 1000);

        showToast('⚡ Đã nạp mẫu Phần: Cấu Hình MESH WIFI (AX3000C V2 ↔ AX3000C V2, LAN-LAN)');
      } else if (sk === 'p3_mesh_ax3000gzv2') {
        studioState.currentScenario = 'p3_mesh';
        spawnNode('olt_cloud', 95, midY, 'FPT_OLT_GPON');
        const ont = spawnNode('ax3000gz_v2', 395, midY, 'ONT_AX3000GZ_V2');
        const ap = spawnNode('ax3000c', 715, midY, 'AP_AX3000CV2');
        spawnNode('laptop_pc', 1020, midY, 'Laptop_KTV');

        if (ont) {
          ont.ip = '192.168.1.1';
          ont.meshRole = 'Controller';
        }
        if (ap) {
          ap.ip = '192.168.1.200';
          ap.meshRole = 'Agent';
          if (!ap.firmwareConfig) ap.firmwareConfig = {};
          ap.firmwareConfig.lanIp = '192.168.1.200';
          ap.firmwareConfig.meshRole = 'Agent';
        }

        createLink('node-1', 'OPT_GPON', 'node-2', 'PON_GPON', 'FIBER_SC', 2500);
        // AX3000GZ V2 ↔ AX3000C V2: Cắm LAN ➔ LAN (khuyên dùng) theo HDCV chuẩn FPT
        createLink('node-2', 'LAN1_1GE', 'node-3', 'LAN1_1GE', 'ETH_CAT6A', 1000);
        createLink('node-3', 'WIFI6', 'node-4', 'WLAN0', 'WIFI_MESH', 1200);

        showToast('⚡ Đã nạp mẫu Phần: Cấu Hình MESH WIFI (AX3000GZ V2 ↔ AX3000C V2, LAN-LAN)');
      } else if (sk === 'p3_dhcp') {
        studioState.currentScenario = 'p3_dhcp';
        spawnNode('olt_cloud', 95, midY, 'FPT_OLT_Core');
        spawnNode('ax3000gz_v2', 395, midY, 'ONT_AX3000GZ_V2');
        const ap = spawnNode('ax3000c', 715, midY, 'Router_Branch_AP');
        spawnNode('laptop_pc', 1020, midY, 'Laptop_Branch_Client');

        createLink('node-1', 'OPT_GPON', 'node-2', 'PON', 'FIBER_SC', 2500);
        // LAN ONT ➔ WAN AP (Router nhánh)
        createLink('node-2', 'LAN1_1GE', 'node-3', 'WAN_1GE', 'ETH_CAT6A', 1000);
        createLink('node-3', 'LAN2', 'node-4', 'ETH0', 'ETH_CAT6A', 1000);

        if (ap) {
          ap.opMode = 'router';
          ap.category = 'router';
          ap.ip = '192.168.10.1';
          if (!ap.firmwareConfig) ap.firmwareConfig = {};
          ap.firmwareConfig.lanIp = '192.168.10.1';
          ap.firmwareConfig.dhcpStart = '192.168.10.10';
          ap.firmwareConfig.dhcpEnd = '192.168.10.254';
          ap.firmwareConfig.dhcpEnable = '1';
          ap.firmwareConfig.opMode = 'router';
        }

        showToast('⚡ Đã nạp mẫu Phần: Cấu Hình DHCP (LAN-WAN, Subnet 192.168.10.1)');
      } else if (sk === 'p3_bridge') {
        studioState.currentScenario = 'p3_bridge';
        spawnNode('olt_cloud', 95, midY, 'FPT_OLT_Core');
        spawnNode('ax3000gz_v2', 395, midY, 'ONT_AX3000GZ_V2');
        const ap = spawnNode('ax3000c', 715, midY, 'AP_Bridge_L2');
        spawnNode('phone_ktv', 1020, midY, 'Smartphone_KTV');

        createLink('node-1', 'OPT_GPON', 'node-2', 'PON', 'FIBER_SC', 2500);
        // LAN ONT ➔ LAN AP (Switch L2 thuần túy)
        createLink('node-2', 'LAN1_1GE', 'node-3', 'LAN1', 'ETH_CAT6A', 1000);
        createLink('node-3', 'WIFI6', 'node-4', 'WLAN0', 'WIFI_MESH', 1200);

        if (ap) {
          ap.opMode = 'bridge';
          ap.category = 'ap';
          ap.ip = '192.168.1.100';
          if (!ap.firmwareConfig) ap.firmwareConfig = {};
          ap.firmwareConfig.lanIp = '192.168.1.100';
          ap.firmwareConfig.dhcpEnable = '0'; // 0 DHCP!
          ap.firmwareConfig.opMode = 'bridge';
        }

        showToast('⚡ Đã nạp mẫu Phần: Cấu Hình BRIDGE (LAN-LAN, 0 DHCP)');
      } else if (sk === 'p3_static') {
        studioState.currentScenario = 'p3_static';
        spawnNode('olt_cloud', 95, midY, 'FPT_OLT_Core');
        const ont = spawnNode('ax3000gz_v2', 395, midY, 'ONT_AX3000GZ_V2');
        const ap = spawnNode('ax3000s', 715, midY, 'AP_AX3000S_Static');
        spawnNode('laptop_pc', 1020, midY, 'Laptop_Client_DHCP');

        createLink('node-1', 'OPT_GPON', 'node-2', 'PON', 'FIBER_SC', 2500);
        // LAN ONT ➔ LAN AP
        createLink('node-2', 'LAN1_1GE', 'node-3', 'LAN1', 'ETH_CAT6A', 1000);
        createLink('node-3', 'LAN2', 'node-4', 'ETH0', 'ETH_CAT6A', 1000);

        if (ont) {
          if (!ont.firmwareConfig) ont.firmwareConfig = {};
          ont.firmwareConfig.lanIp = '192.168.1.1';
          ont.firmwareConfig.dhcpStart = '192.168.1.10'; // Tách dải DHCP từ .10!
          ont.firmwareConfig.dhcpEnd = '192.168.1.254';
          ont.firmwareConfig.dhcpEnable = '1';
        }
        if (ap) {
          ap.ip = '192.168.1.2'; // IP tĩnh .2-.9!
          ap.category = 'ap';
          ap.opMode = 'ap';
          if (!ap.firmwareConfig) ap.firmwareConfig = {};
          ap.firmwareConfig.lanIp = '192.168.1.2';
          ap.firmwareConfig.dhcpEnable = '0'; // 0 DHCP!
          ap.firmwareConfig.opMode = 'ap';
        }

        showToast('⚡ Đã nạp mẫu Phần: Cấu Hình STATIC (IP 192.168.1.2, 0 DHCP, ONT Pool .10-.254)');
      }

      if (typeof populatePalette === 'function') {
        populatePalette();
      }
      renderPduScenarioTable();
      propagateFirmwareStateAcrossLinks(false);
      renderCanvas();
      clampNodesInsideCanvasViewport();
      syncZteBackend();
    }
    window.loadSamplePresetPair = loadSamplePresetPair;

    function spawnNode(catalogKey, x, y, customName = null) {
      const dev = FPT_CATALOG[catalogKey];
      if (!dev) return null;
      const idx = nodeCounter++;
      const isHv2 = catalogKey === 'ax3000hv2';
      const isAx3000c = catalogKey === 'ax3000c';
      const existingNodes = studioState.nodes || [];
      const hasGatewayOrRouter = existingNodes.some(n => n.category === 'gateway' || n.category === 'router');
      const existingAx3000cCount = existingNodes.filter(n => n.catalogKey === 'ax3000c').length;

      let assignedIp = dev.defaultIp;
      let defaultMeshRole = dev.category === 'gateway' ? 'Controller' : 'Agent';
      const isPortalMeshLesson = Boolean(window._isEmbeddedPortalLesson);
      if (isAx3000c && !hasGatewayOrRouter) {
        if (existingAx3000cCount === 0) {
          assignedIp = '192.168.100.1';
          defaultMeshRole = isPortalMeshLesson ? 'Agent' : 'Controller';
        } else {
          assignedIp = `192.168.100.${199 + existingAx3000cCount}`;
          defaultMeshRole = 'Agent';
        }
      }

      // Derive a unique MAC per spawned node so same-model Mesh pairs never collide in topology tables
      const usedMacs = new Set(existingNodes.map(n => String(n.mac || '').toUpperCase()));
      let assignedMac = (dev.macBase || `94:87:E0:00:00:${String(idx).padStart(2, '0')}`).toUpperCase();
      if (usedMacs.has(assignedMac)) {
        if (isAx3000c) {
          let step = existingAx3000cCount;
          do {
            assignedMac = `5C:1A:6F:C3:A2:${((0x60 + step) & 0xFF).toString(16).toUpperCase().padStart(2, '0')}`;
            step++;
          } while (usedMacs.has(assignedMac));
        } else {
          const parts = assignedMac.split(':');
          let last = parseInt(parts[5] || '1', 16);
          if (Number.isNaN(last)) last = idx;
          let tries = 0;
          while (usedMacs.has(assignedMac) && tries < 250) {
            last = (last + 1) & 0xFF;
            parts[5] = last.toString(16).toUpperCase().padStart(2, '0');
            assignedMac = parts.join(':');
            tries++;
          }
        }
      }

      const defaultSsid = isHv2
        ? 'FPT Telecom-1691'
        : (isAx3000c
          ? 'FPT Telecom-0A91'
          : ((document.getElementById('cfg-wifi-ssid') && document.getElementById('cfg-wifi-ssid').value) || 'FPT_Telecom_WiFi7'));
      const defaultKey = isHv2
        ? '24BA7659'
        : (isAx3000c
          ? '24c1e15f'
          : ((document.getElementById('cfg-wifi-key') && document.getElementById('cfg-wifi-key').value) || '12345678'));
      const defaultSec = (isHv2 || isAx3000c) ? 'WPA2-PSK' : 'WPA3-SAE / WPA2-PSK';
      const defaultBw = dev.series === 'wifi7' ? '320MHz' : (dev.series === 'wifi6' ? '160MHz' : '80MHz');
      const node = {
        id: 'node-' + idx,
        catalogKey: catalogKey,
        name: customName || `${dev.model}_${idx}`,
        model: dev.model,
        svgType: dev.svgType,
        category: dev.category,
        role: dev.role,
        roleLabel: dev.roleLabel,
        meshRole: defaultMeshRole,
        ip: assignedIp,
        mac: assignedMac,
        x: x,
        y: y,
        power: true,
        wpsActive: false,
        requireExplicitMeshMode: isPortalMeshLesson,
        firmwareConfig: {
          hasKtvCustomConfig: false,
          requireExplicitMeshMode: isPortalMeshLesson,
          initialDefaultSsid: defaultSsid,
          initialDefaultIp: assignedIp,
          ssid: defaultSsid,
          ssid5g: defaultSsid,
          wpaKey: defaultKey,
          password: defaultKey,
          password5g: defaultKey,
          securityMode: defaultSec,
          security2g: defaultSec,
          security5g: defaultSec,
          channel: 'Auto (Ch.36 / 149)',
          bandwidth: defaultBw,
          wifiEnabled: true,
          meshRole: defaultMeshRole,
          meshEnabled: true,
          lanIp: assignedIp,
          subnetMask: '255.255.255.0',
          wanMode: dev.category === 'gateway' ? 'PPPoE (VLAN 35)' : (dev.category === 'ap' ? (defaultMeshRole === 'Controller' ? 'EasyMesh Controller / PPPoE' : 'EasyMesh Agent / DHCP') : 'DHCP Client'),
          dhcpEnabled: dev.category === 'gateway' || defaultMeshRole === 'Controller',
          customFieldMap: {}
        },
        linkedReceivedState: {
          syncedAt: null,
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
          hasKtvCustomFromUpstream: false,
          assignedWanIp: null,
          gatewayIp: null,
          opticalRxDbm: null,
          opticalState: null,
          wifiRssiDbm: null,
          neighbors: []
        }
      };
      if (typeof initNodeNetworkStack === 'function') {
        initNodeNetworkStack(node, dev);
      }
      studioState.nodes.push(node);
      window.studioState = studioState;
      window.__grading4StepDirty = true;
      notifyParentTopologyChanged();
      return node;
    }

    function createLink(srcId, srcPort, tgtId, tgtPort, cableType, speed = 1000) {
      window.__grading4StepDirty = true;
      studioState.links = studioState.links.filter(l =>
        !((l.srcId === srcId && l.srcPort === srcPort) ||
          (l.tgtId === srcId && l.tgtPort === srcPort) ||
          (l.srcId === tgtId && l.srcPort === tgtPort) ||
          (l.tgtId === tgtId && l.tgtPort === tgtPort))
      );
      const link = {
        id: 'link-' + (linkCounter++),
        srcId: srcId,
        srcPort: srcPort,
        tgtId: tgtId,
        tgtPort: tgtPort,
        cableType: cableType,
        speed: speed
      };
      studioState.links.push(link);
      const sNode = studioState.nodes.find(n => n.id === srcId);
      const tNode = studioState.nodes.find(n => n.id === tgtId);
      if (sNode && sNode.networkStack && sNode.networkStack.interfaces && sNode.networkStack.interfaces[srcPort]) {
        sNode.networkStack.interfaces[srcPort].operUp = true;
        sNode.networkStack.interfaces[srcPort].speedMbps = speed;
      }
      if (tNode && tNode.networkStack && tNode.networkStack.interfaces && tNode.networkStack.interfaces[tgtPort]) {
        tNode.networkStack.interfaces[tgtPort].operUp = true;
        tNode.networkStack.interfaces[tgtPort].speedMbps = speed;
      }
      // Automatically propagate Device A's configuration across the newly plugged cable to Device B
      if (typeof propagateFirmwareStateAcrossLinks === 'function') {
        propagateFirmwareStateAcrossLinks(true);
      }
      if (typeof scheduleAutoCrossDeviceSync === 'function') {
        scheduleAutoCrossDeviceSync('cable_plugged', 120, false);
      }
      notifyParentTopologyChanged();
      return link;
    }

    // 5. CLEAN CISCO PACKET TRACER STRAIGHT-LINE & ICON RENDERING
    function renderCanvas() {
      window.studioState = studioState;
      renderSvgWires();
      renderNodes();
      updateHudTelemetry();
      updateNs3PhysicsPanelUi();
      updateFloatingHud();
      notifyParentTopologyChanged();
    }

    // Dynamic Floating Scenario HUD: Nhận diện thời gian thực cặp thiết bị & cổng cắm trên Canvas
    function updateFloatingHud() {
      const hud = document.getElementById('scenario-floating-hud');
      if (!hud) return;

      const nodes = studioState.nodes || [];
      const links = studioState.links || [];

      // 1. Tìm node ONT chính / Controller chính (ưu tiên gateway -> router -> AX3000C Controller -> non-infra)
      const ont = nodes.find(n => n.category === 'gateway' || n.role === 'master' || (n.model && n.model.toUpperCase().includes('ONT')) || ['ax3000gz_v2', 'be12000', 'ont_be6500c', 'ac1000z', 'ax1800gz', 'ax3000gz', 'ax3000hv2'].includes(n.catalogKey)) ||
                  nodes.find(n => n.catalogKey === 'ax3000c' && String(n.meshRole || (n.firmwareConfig && n.firmwareConfig.meshRole) || '').toLowerCase() === 'controller') ||
                  nodes.find(n => n.category !== 'client' && n.category !== 'core' && n.category !== 'infra' && n.role !== 'core');

      // 2. Tìm node AP phụ
      const ap = nodes.find(n => (n.category === 'ap' || n.category === 'router' || n.role === 'slave' || ['ax3000c', 'ax3000s', 'be15000', 'be6500c', 'vigor2927', 'mikrotik_hexs', 'ac1000cv2'].includes(n.catalogKey)) && n !== ont);

      const valOnt = document.getElementById('hud-val-ont');
      if (valOnt) {
        if (ont) {
          valOnt.textContent = `${ont.name || ont.model} (${ont.ip || '192.168.1.1'})`;
          valOnt.className = 'hud-val';
        } else {
          valOnt.textContent = 'Chưa kéo thiết bị';
          valOnt.className = 'hud-val empty';
        }
      }

      const valAp = document.getElementById('hud-val-ap');
      if (valAp) {
        if (ap) {
          valAp.textContent = `${ap.name || ap.model} (${ap.ip || '192.168.1.x'})`;
          valAp.className = 'hud-val';
        } else {
          valAp.textContent = 'Chưa kéo thiết bị';
          valAp.className = 'hud-val empty';
        }
      }

      const wireBox = document.getElementById('hud-dev-wire');
      const wireIcon = document.getElementById('hud-wire-icon');
      const wireLbl = document.getElementById('hud-wire-label');
      if (wireBox && wireIcon && wireLbl) {
        if (ont && ap) {
          const link = links.find(l => (l.srcId === ont.id && l.tgtId === ap.id) || (l.srcId === ap.id && l.tgtId === ont.id));
          if (link) {
            const ontPort = (link.srcId === ont.id ? link.srcPort : link.tgtPort) || '';
            const apPort = (link.srcId === ont.id ? link.tgtPort : link.srcPort) || '';
            const isOntLan = ontPort.toUpperCase().includes('LAN') || ontPort.toUpperCase().includes('ETH');
            const isApWan = apPort.toUpperCase().includes('WAN') || apPort.toUpperCase().includes('ETHER1');
            const isApLan = apPort.toUpperCase().includes('LAN') || apPort.toUpperCase().includes('ETHER2');
            const pairStr = `${ontPort || 'LAN'} ➔ ${apPort || 'Port'} (${isApWan ? 'LAN-WAN' : isApLan ? 'LAN-LAN' : 'Khác'})`;

            wireBox.className = 'hud-dev-wire';
            wireIcon.textContent = '🟢';
            wireLbl.textContent = pairStr;
          } else {
            wireBox.className = 'hud-dev-wire unconnected';
            wireIcon.textContent = '🔌';
            wireLbl.textContent = 'Chưa cắm cáp';
          }
        } else {
          wireBox.className = 'hud-dev-wire unconnected';
          wireIcon.textContent = '🔌';
          wireLbl.textContent = 'Chưa có cặp ONT-AP';
        }
      }
    }
    window.updateFloatingHud = updateFloatingHud;

    function getPortShortLabel(node, portId) {
      const cat = FPT_CATALOG[node.catalogKey];
      if (!cat || !cat.ports) return portId;
      const p = cat.ports.find(item => item.id === portId);
      return p ? (p.short || p.name) : portId;
    }

    function drawCiscoLinkLight(svg, x, y, state) {
      if (state === 'up') {
        const tri = document.createElementNS('http://www.w3.org/2000/svg', 'polygon');
        tri.setAttribute('points', `${x},${y - 7} ${x - 6.5},${y + 5} ${x + 6.5},${y + 5}`);
        tri.setAttribute('fill', '#22c55e');
        tri.setAttribute('stroke', '#ffffff');
        tri.setAttribute('stroke-width', '1.6');
        svg.appendChild(tri);
      } else if (state === 'bottleneck') {
        const dot = document.createElementNS('http://www.w3.org/2000/svg', 'circle');
        dot.setAttribute('cx', x);
        dot.setAttribute('cy', y);
        dot.setAttribute('r', '5.8');
        dot.setAttribute('fill', '#f59e0b');
        dot.setAttribute('stroke', '#ffffff');
        dot.setAttribute('stroke-width', '1.6');
        svg.appendChild(dot);
      } else {
        const tri = document.createElementNS('http://www.w3.org/2000/svg', 'polygon');
        tri.setAttribute('points', `${x},${y + 7} ${x - 6.5},${y - 5} ${x + 6.5},${y - 5}`);
        tri.setAttribute('fill', '#ef4444');
        tri.setAttribute('stroke', '#ffffff');
        tri.setAttribute('stroke-width', '1.6');
        svg.appendChild(tri);
      }
    }

    function renderPortEndpointPill(svg, x, y, labelText, borderColor) {
      const g = document.createElementNS('http://www.w3.org/2000/svg', 'g');
      const w = Math.max(46, labelText.length * 5.8 + 12);
      const rect = document.createElementNS('http://www.w3.org/2000/svg', 'rect');
      rect.setAttribute('x', x - w / 2);
      rect.setAttribute('y', y - 8.5);
      rect.setAttribute('width', w);
      rect.setAttribute('height', '16');
      rect.setAttribute('rx', '4');
      rect.setAttribute('fill', 'var(--bg-canvas)');
      rect.setAttribute('stroke', borderColor || '#64748b');
      rect.setAttribute('stroke-width', '1.2');

      const txt = document.createElementNS('http://www.w3.org/2000/svg', 'text');
      txt.setAttribute('x', x);
      txt.setAttribute('y', y + 2.5);
      txt.setAttribute('text-anchor', 'middle');
      txt.setAttribute('fill', 'var(--text-node)');
      txt.setAttribute('class', 'port-tag-pill');
      txt.textContent = labelText;

      g.appendChild(rect);
      g.appendChild(txt);
      svg.appendChild(g);
    }

    function renderSvgWires() {
      const svg = document.getElementById('canvas-svg');
      if (!svg) return;
      const defs = svg.querySelector('defs');
      svg.innerHTML = '';
      if (defs) svg.appendChild(defs);

      // Subtle Wi-Fi Coverage Halo
      studioState.nodes.forEach(node => {
        if (!node.power) return;
        if (node.category === 'gateway' || node.category === 'ap') {
          const halo = document.createElementNS('http://www.w3.org/2000/svg', 'circle');
          halo.setAttribute('cx', node.x + 68);
          halo.setAttribute('cy', node.y + 38);
          halo.setAttribute('r', node.category === 'gateway' ? '145' : '130');
          halo.setAttribute('fill', node.category === 'gateway' ? 'url(#wifi-halo-master)' : 'url(#wifi-halo-slave)');
          svg.appendChild(halo);
        }
      });

      // Straight Center-to-Center Cables (Authentic Cisco Packet Tracer Style)
      studioState.links.forEach(l => {
        const srcNode = studioState.nodes.find(n => n.id === l.srcId);
        const tgtNode = studioState.nodes.find(n => n.id === l.tgtId);
        if (!srcNode || !tgtNode) return;

        // Center of each device icon box (width=136 -> centerX=68, icon centerY=38)
        const cx1 = srcNode.x + 68;
        const cy1 = srcNode.y + 38;
        const cx2 = tgtNode.x + 68;
        const cy2 = tgtNode.y + 38;

        const pathData = `M ${cx1} ${cy1} L ${cx2} ${cy2}`;
        const bothPowered = srcNode.power && tgtNode.power;

        let wireClass = 'svg-cable eth-optimal';
        let speedText = `${l.speed >= 1000 ? (l.speed / 1000) + 'G' : l.speed + 'M'}`;
        let linkLightState = 'up';

        if (!bothPowered) {
          wireClass = 'svg-cable down';
          speedText = 'DOWN';
          linkLightState = 'down';
        } else if (l.cableType === 'FIBER_SC') {
          const pon = calculateOpticalPonMetrics();
          const basePonLabel = l.speed >= 10000 ? '10G PON' : '2.5G PON';
          if (pon.state === 'O1_LOS') {
            wireClass = 'svg-cable down';
            speedText = `LOS ${pon.rxDbm.toFixed(1)}dBm 🚨`;
            linkLightState = 'down';
          } else if (pon.state === 'O5_WARN') {
            wireClass = 'svg-cable eth-bottleneck';
            speedText = `Suy hao ${pon.rxDbm.toFixed(1)}dBm ⚠️`;
            linkLightState = 'bottleneck';
          } else {
            wireClass = 'svg-cable fiber';
            speedText = `${basePonLabel} (${pon.rxDbm.toFixed(1)}dBm)`;
            linkLightState = 'up';
          }
        } else if (l.cableType === 'WIFI_MESH') {
          const wf = calculateWifiLinkPhysics(srcNode, tgtNode);
          l.speed = wf.phyRateMbps;
          if (wf.qualityState === 'down') {
            wireClass = 'svg-cable down';
            speedText = `Mất sóng ${wf.rssiDbm}dBm 🚨`;
            linkLightState = 'down';
          } else if (wf.qualityState === 'bottleneck') {
            wireClass = 'svg-cable eth-bottleneck';
            speedText = `Wi-Fi ${wf.rssiDbm}dBm (${wf.phyRateMbps}M) ⚠️`;
            linkLightState = 'bottleneck';
          } else {
            wireClass = 'svg-cable wifi-mesh';
            const rateStr = wf.phyRateMbps >= 1000 ? (wf.phyRateMbps / 1000).toFixed(1) + 'G' : wf.phyRateMbps + 'M';
            speedText = `MLO ${wf.rssiDbm}dBm (${rateStr})`;
            linkLightState = 'up';
          }
        } else {
          const isZteBackhaul = (srcNode.catalogKey === 'be12000' && tgtNode.catalogKey === 'be15000') ||
                                (srcNode.catalogKey === 'be15000' && tgtNode.catalogKey === 'be12000');
          if ((isZteBackhaul && l.speed < 2500) || l.cableType === 'ETH_CAT5E') {
            wireClass = 'svg-cable eth-bottleneck';
            speedText = '1G Nghẽn ⚠️';
            linkLightState = 'bottleneck';
          } else {
            wireClass = 'svg-cable eth-optimal';
            speedText = l.speed >= 2500 ? '2.5G CAT6A' : '1G LAN';
          }
        }

        const onCableClick = (e) => {
          e.stopPropagation();
          if (studioState.currentTool === 'delete') {
            studioState.selectedLinkId = l.id;
            unplugSelectedCable();
          } else {
            openCableInspector(l.id);
          }
        };

        // Live Graded Cable Glow Underlay (Green for Correct Port Pairing, Red Dashed for Incorrect)
        if (studioState.gradedResult && studioState.gradedResult.mini_topology) {
          const mt = studioState.gradedResult.mini_topology;
          if (mt.ont && mt.ap && ((l.srcId === mt.ont.id && l.tgtId === mt.ap.id) || (l.srcId === mt.ap.id && l.tgtId === mt.ont.id))) {
            const isCorrect = mt.cable && mt.cable.is_correct;
            const gradeGlow = document.createElementNS('http://www.w3.org/2000/svg', 'path');
            gradeGlow.setAttribute('d', pathData);
            gradeGlow.setAttribute('stroke', isCorrect ? '#10b981' : '#ef4444');
            gradeGlow.setAttribute('stroke-width', '10');
            gradeGlow.setAttribute('opacity', isCorrect ? '0.7' : '0.85');
            gradeGlow.setAttribute('fill', 'none');
            gradeGlow.setAttribute('stroke-linecap', 'round');
            if (!isCorrect) {
              gradeGlow.setAttribute('stroke-dasharray', '10, 6');
            }
            svg.appendChild(gradeGlow);
          }
        }

        // High-contrast Halo Underlay Path (makes cable stand out & easy to click)
        const hitPath = document.createElementNS('http://www.w3.org/2000/svg', 'path');
        hitPath.setAttribute('d', pathData);
        hitPath.setAttribute('class', 'svg-cable-hit');
        hitPath.onclick = onCableClick;
        svg.appendChild(hitPath);

        // Main Cable Path
        const path = document.createElementNS('http://www.w3.org/2000/svg', 'path');
        path.setAttribute('d', pathData);
        path.setAttribute('class', wireClass);
        path.onclick = onCableClick;
        svg.appendChild(path);

        // Animated flow dot
        if (bothPowered && linkLightState !== 'down') {
          const circle = document.createElementNS('http://www.w3.org/2000/svg', 'circle');
          circle.setAttribute('r', '3.5');
          circle.setAttribute('fill', l.cableType === 'FIBER_SC' ? '#f97316' : (l.cableType === 'WIFI_MESH' ? '#a855f7' : '#22c55e'));
          circle.setAttribute('stroke', '#ffffff');
          circle.setAttribute('stroke-width', '1');
          const anim = document.createElementNS('http://www.w3.org/2000/svg', 'animateMotion');
          anim.setAttribute('path', pathData);
          anim.setAttribute('dur', l.speed >= 2500 ? '1.3s' : '2.3s');
          anim.setAttribute('repeatCount', 'indefinite');
          circle.appendChild(anim);
          svg.appendChild(circle);
        }

        // Calculate unit vector along the cable to place Link Lights (▲/●/▼) outside the icon boxes
        const vx = cx2 - cx1;
        const vy = cy2 - cy1;
        const dist = Math.hypot(vx, vy) || 1;
        const ux = vx / dist;
        const uy = vy / dist;

        const offsetDist = Math.min(58, dist * 0.26);
        const lx1 = cx1 + ux * offsetDist;
        const ly1 = cy1 + uy * offsetDist;
        const lx2 = cx2 - ux * offsetDist;
        const ly2 = cy2 - uy * offsetDist;

        drawCiscoLinkLight(svg, lx1, ly1, linkLightState);
        drawCiscoLinkLight(svg, lx2, ly2, linkLightState);

        const strokeCol = !bothPowered ? '#ef4444' : (linkLightState === 'bottleneck' ? '#f59e0b' : (l.cableType === 'FIBER_SC' ? '#ea580c' : (l.cableType === 'WIFI_MESH' ? '#7c3aed' : '#2563eb')));

        // High-contrast Pill-backed Port Labels next to Link Lights
        if (studioState.showPortLabels && dist > 140) {
          renderPortEndpointPill(svg, lx1 + ux * 20, ly1 - 16, getPortShortLabel(srcNode, l.srcPort), strokeCol);
          renderPortEndpointPill(svg, lx2 - ux * 20, ly2 - 16, getPortShortLabel(tgtNode, l.tgtPort), strokeCol);
        }

        // Compact Speed Pill in the Midpoint of the Cable
        const mx = (cx1 + cx2) / 2;
        const my = (cy1 + cy2) / 2;
        const gPill = document.createElementNS('http://www.w3.org/2000/svg', 'g');
        gPill.setAttribute('class', 'cable-label-pill');
        gPill.onclick = onCableClick;

        const pillW = Math.max(72, speedText.length * 6.6 + 16);
        const rect = document.createElementNS('http://www.w3.org/2000/svg', 'rect');
        rect.setAttribute('x', mx - (pillW / 2));
        rect.setAttribute('y', my - 10);
        rect.setAttribute('width', pillW);
        rect.setAttribute('height', '20');
        rect.setAttribute('rx', '10');
        rect.setAttribute('fill', 'var(--bg-canvas)');
        rect.setAttribute('stroke', strokeCol);
        rect.setAttribute('stroke-width', '1.6');

        const text = document.createElementNS('http://www.w3.org/2000/svg', 'text');
        text.setAttribute('x', mx);
        text.setAttribute('y', my + 3.5);
        text.setAttribute('fill', strokeCol);
        text.setAttribute('font-size', '9.5');
        text.setAttribute('font-family', 'JetBrains Mono, monospace');
        text.setAttribute('font-weight', '700');
        text.setAttribute('text-anchor', 'middle');
        text.textContent = speedText;

        gPill.appendChild(rect);
        gPill.appendChild(text);
        svg.appendChild(gPill);
      });

      // Live Cisco Packet Tracer Rubber-Band Cable Line Following Mouse During Wiring
      if (studioState.currentTool === 'wire' && studioState.wireStartNodeId && studioState.wireMousePos) {
        const srcNode = studioState.nodes.find(n => n.id === studioState.wireStartNodeId);
        if (srcNode) {
          const cx1 = srcNode.x + 68;
          const cy1 = srcNode.y + 38;
          const mx = studioState.wireMousePos.x;
          const my = studioState.wireMousePos.y;

          let rbColor = '#2563eb';
          let rbDash = '8, 5';
          if (studioState.currentCableType === 'AUTO') { rbColor = '#f59e0b'; rbDash = '10, 5'; }
          else if (studioState.currentCableType === 'FIBER_SC') { rbColor = '#f97316'; rbDash = 'none'; }
          else if (studioState.currentCableType === 'ETH_CAT5E') { rbColor = '#eab308'; rbDash = '8, 4'; }
          else if (studioState.currentCableType === 'WIFI_MESH') { rbColor = '#a855f7'; rbDash = '6, 5'; }

          const rbHalo = document.createElementNS('http://www.w3.org/2000/svg', 'line');
          rbHalo.setAttribute('x1', cx1);
          rbHalo.setAttribute('y1', cy1);
          rbHalo.setAttribute('x2', mx);
          rbHalo.setAttribute('y2', my);
          rbHalo.setAttribute('stroke', '#ffffff');
          rbHalo.setAttribute('stroke-width', '7');
          rbHalo.setAttribute('stroke-linecap', 'round');
          rbHalo.setAttribute('opacity', '0.75');
          svg.appendChild(rbHalo);

          const rbLine = document.createElementNS('http://www.w3.org/2000/svg', 'line');
          rbLine.setAttribute('x1', cx1);
          rbLine.setAttribute('y1', cy1);
          rbLine.setAttribute('x2', mx);
          rbLine.setAttribute('y2', my);
          rbLine.setAttribute('stroke', rbColor);
          rbLine.setAttribute('stroke-width', '3.8');
          rbLine.setAttribute('stroke-linecap', 'round');
          if (rbDash !== 'none') rbLine.setAttribute('stroke-dasharray', rbDash);
          svg.appendChild(rbLine);

          // Connector Plug Icon at Cursor Tip
          const plugCircle = document.createElementNS('http://www.w3.org/2000/svg', 'circle');
          plugCircle.setAttribute('cx', mx);
          plugCircle.setAttribute('cy', my);
          plugCircle.setAttribute('r', '7');
          plugCircle.setAttribute('fill', rbColor);
          plugCircle.setAttribute('stroke', '#ffffff');
          plugCircle.setAttribute('stroke-width', '2');
          svg.appendChild(plugCircle);

          // Floating Tag near Cursor Showing Source Port
          const srcPortText = studioState.wireStartPortId
            ? `${srcNode.name} [${getPortShortLabel(srcNode, studioState.wireStartPortId)}] ➔ Click thiết bị đích`
            : `⚡ ${srcNode.name} (Auto) ➔ Click thiết bị đích`;
          const tagW = srcPortText.length * 5.8 + 20;
          const tagRect = document.createElementNS('http://www.w3.org/2000/svg', 'rect');
          tagRect.setAttribute('x', mx + 12);
          tagRect.setAttribute('y', my - 24);
          tagRect.setAttribute('width', tagW);
          tagRect.setAttribute('height', '20');
          tagRect.setAttribute('rx', '5');
          tagRect.setAttribute('fill', '#0f172a');
          tagRect.setAttribute('stroke', rbColor);
          tagRect.setAttribute('stroke-width', '1.5');
          svg.appendChild(tagRect);

          const tagTxt = document.createElementNS('http://www.w3.org/2000/svg', 'text');
          tagTxt.setAttribute('x', mx + 22);
          tagTxt.setAttribute('y', my - 10.5);
          tagTxt.setAttribute('fill', '#f8fafc');
          tagTxt.setAttribute('font-size', '9.5');
          tagTxt.setAttribute('font-family', 'JetBrains Mono, monospace');
          tagTxt.setAttribute('font-weight', '700');
          tagTxt.textContent = srcPortText;
          svg.appendChild(tagTxt);
        }
      }

      // Flying / Step-by-Step Simple PDU Envelope (✉️ Clickable to open OSI 7-Layer & Wireshark Inspector!)
      if (studioState.activePduEnvelope) {
        const env = studioState.activePduEnvelope;
        const gEnv = document.createElementNS('http://www.w3.org/2000/svg', 'g');
        gEnv.style.cursor = 'pointer';
        gEnv.onclick = (e) => {
          e.stopPropagation();
          if (env.pduId) openPduInspectorModal(env.pduId, env.hopIndex || 0);
        };

        const pathData = `M ${env.x1} ${env.y1} L ${env.x2} ${env.y2}`;
        const isArp = env.protocol === 'ARP';
        const isReply = env.protocol === 'ICMP_REPLY';
        const fillCol = !env.success ? '#fecaca' : (isArp ? '#fde68a' : (isReply ? '#a5f3fc' : '#fef08a'));
        const strokeCol = !env.success ? '#dc2626' : (isArp ? '#d97706' : (isReply ? '#0284c7' : '#16a34a'));

        const rect = document.createElementNS('http://www.w3.org/2000/svg', 'rect');
        rect.setAttribute('x', '-15');
        rect.setAttribute('y', '-10');
        rect.setAttribute('width', '30');
        rect.setAttribute('height', '20');
        rect.setAttribute('rx', '3.5');
        rect.setAttribute('fill', fillCol);
        rect.setAttribute('stroke', strokeCol);
        rect.setAttribute('stroke-width', '2.2');

        const flap = document.createElementNS('http://www.w3.org/2000/svg', 'polyline');
        flap.setAttribute('points', '-14,-9 0,2 14,-9');
        flap.setAttribute('fill', 'none');
        flap.setAttribute('stroke', strokeCol);
        flap.setAttribute('stroke-width', '1.8');

        const badgeTxt = document.createElementNS('http://www.w3.org/2000/svg', 'text');
        badgeTxt.setAttribute('x', '0');
        badgeTxt.setAttribute('y', '-14');
        badgeTxt.setAttribute('text-anchor', 'middle');
        badgeTxt.setAttribute('fill', strokeCol);
        badgeTxt.setAttribute('font-size', '9.5');
        badgeTxt.setAttribute('font-family', 'JetBrains Mono, monospace');
        badgeTxt.setAttribute('font-weight', '800');
        badgeTxt.textContent = env.label || (isArp ? 'ARP' : 'ICMP');

        const anim = document.createElementNS('http://www.w3.org/2000/svg', 'animateMotion');
        anim.setAttribute('path', pathData);
        anim.setAttribute('dur', env.dur || '0.55s');
        anim.setAttribute('fill', 'freeze');

        gEnv.appendChild(rect);
        gEnv.appendChild(flap);
        gEnv.appendChild(badgeTxt);
        gEnv.appendChild(anim);
        svg.appendChild(gEnv);
      }
    }

    function updateCanvasQuickGuideBanner() {
      const guideEl = document.querySelector('.canvas-quick-guide');
      if (!guideEl) return;
      if (!guideEl.dataset.defaultHtml) {
        guideEl.dataset.defaultHtml = guideEl.innerHTML;
      }
      if (studioState.currentTool === 'wire') {
        guideEl.classList.add('wiring-active-banner');
        if (studioState.wireStartNodeId) {
          const srcNode = studioState.nodes.find(n => n.id === studioState.wireStartNodeId);
          const srcName = srcNode ? srcNode.name : studioState.wireStartNodeId;
          const portLabel = studioState.wireStartPortId || 'Auto';
          guideEl.innerHTML = `<span>⚡ Đang cầm đầu dây từ <b>${srcName} [${portLabel}]</b> ➔ Hãy chạm vào <b>Thiết bị thứ 2</b> để cắm dây!</span>`;
        } else {
          guideEl.innerHTML = `<span>🔌 Chế độ nối cáp đang bật ➔ Hãy chạm vào <b>Thiết bị 1</b> trên sơ đồ để chọn cổng cắm cáp!</span>`;
        }
        return;
      }
      guideEl.classList.remove('wiring-active-banner');
      if (window.innerWidth <= 640) {
        guideEl.innerHTML = `<span>📌 <b>1:</b> Chạm kệ dưới thêm 2 thiết bị • <b>2:</b> Bấm <b>⚙️ Mở</b> cấu hình • <b>3:</b> Bấm <b>🔌 Cáp</b> nối dây • <b>4:</b> Nộp bài</span>`;
      } else {
        guideEl.innerHTML = guideEl.dataset.defaultHtml;
      }
    }

    function autoSeparateOverlappingNodes() {
      if (activeDragNode || activeTouchDrag) return false;
      const nodes = studioState.nodes || [];
      if (nodes.length < 2) return false;
      const canvas = document.getElementById('net-canvas');
      const z = getCanvasZoom();
      const cw = canvas && canvas.clientWidth > 0 ? (canvas.clientWidth / z) : (window.innerWidth / z);
      const ch = canvas && canvas.clientHeight > 0 ? (canvas.clientHeight / z) : Math.max(220, (window.innerHeight / z) - 140);
      if (cw < 200) return false;

      let hasOverlap = false;
      for (let i = 0; i < nodes.length && !hasOverlap; i++) {
        for (let j = i + 1; j < nodes.length; j++) {
          if (Math.hypot((nodes[i].x || 0) - (nodes[j].x || 0), (nodes[i].y || 0) - (nodes[j].y || 0)) < 88) {
            hasOverlap = true;
            break;
          }
        }
      }
      if (!hasOverlap) return false;

      const leftX = cw <= 560
        ? Math.max(14, Math.round(cw * 0.21) - 46)
        : Math.max(40, Math.round(cw * 0.30) - 55);
      const rightX = cw <= 560
        ? Math.max(leftX + 145, Math.min(cw - 108, Math.round(cw * 0.79) - 52))
        : Math.min(cw - 130, Math.round(cw * 0.70) - 55);
      const baseRowY = Math.max(56, Math.min(ch - 110, Math.round(ch * (nodes.length > 2 ? 0.26 : 0.36)) - 40));
      const stepY = 114;

      const slots = [];
      for (let row = 0; row < 5; row++) {
        const y = Math.max(48, Math.min(ch - 102, baseRowY + row * stepY));
        slots.push({ x: leftX, y });
        slots.push({ x: rightX, y });
      }

      nodes.forEach((n, idx) => {
        const collidesWithPrev = nodes.slice(0, idx).some(prev => Math.hypot((prev.x || 0) - (n.x || 0), (prev.y || 0) - (n.y || 0)) < 88);
        if (idx === 0 && nodes.slice(1).some(other => Math.hypot((other.x || 0) - (n.x || 0), (other.y || 0) - (n.y || 0)) < 88)) {
          n.x = slots[0].x;
          n.y = slots[0].y;
          return;
        }
        if (!collidesWithPrev) return;
        const freeSlot = slots.find(s => !nodes.slice(0, idx).some(prev => Math.hypot((prev.x || 0) - s.x, (prev.y || 0) - s.y) < 88));
        if (freeSlot) {
          n.x = freeSlot.x;
          n.y = freeSlot.y;
        }
      });
      return true;
    }

    function renderNodes() {
      const container = document.getElementById('canvas-nodes');
      if (!container) return;
      if (autoSeparateOverlappingNodes()) {
        renderSvgWires();
      }
      container.innerHTML = '';
      updateCanvasQuickGuideBanner();
      if (typeof renderMobileDevQuickbars === 'function') {
        renderMobileDevQuickbars();
      }

      studioState.nodes.forEach(node => {
        const el = document.createElement('div');
        el.id = node.id;
        el.dataset.nodeId = node.id;
        el.dataset.catalogKey = node.catalogKey || '';
        const isWiringSrc = studioState.wireStartNodeId === node.id;
        const isWiringTargetHint = Boolean(studioState.currentTool === 'wire' && studioState.wireStartNodeId && studioState.wireStartNodeId !== node.id);
        el.className = `canvas-node node-device ${node.category} ${node.id === studioState.selectedNodeId ? 'selected' : ''} ${isWiringSrc ? 'wiring-source' : ''} ${isWiringTargetHint ? 'wiring-target-hint' : ''} ${!node.power ? 'power-off' : ''}`;
        el.style.left = node.x + 'px';
        el.style.top = node.y + 'px';

        el.onmousedown = (e) => {
          if (e.target.closest('.nq-btn')) return;
          if (studioState.currentTool === 'wire') {
            e.stopPropagation();
            handleWireToolNodeClick(node.id, e);
            return;
          }
          if (studioState.currentTool === 'pdu') {
            e.stopPropagation();
            handlePduToolNodeClick(node.id);
            return;
          }
          if (studioState.currentTool === 'delete') {
            e.stopPropagation();
            deleteNode(node.id);
            return;
          }
          startNodeDrag(node.id, e);
        };

        el.addEventListener('touchstart', (e) => {
          if (e.target.closest('.nq-btn')) return;
          if (!e.touches || e.touches.length !== 1) return;
          startNodeTouchInteraction(node.id, el, e);
        }, { passive: false });

        el.oncontextmenu = (e) => {
          if (window.innerWidth <= 900 || (typeof navigator !== 'undefined' && navigator.maxTouchPoints > 0)) {
            e.preventDefault();
          }
        };

        el.ondblclick = () => { openDeviceWindow(node.id); };

        const devCatalog = FPT_CATALOG[node.catalogKey] || {};
        const portsList = devCatalog.ports || [];

        let hoverRowsHtml = '';
        portsList.forEach(p => {
          const link = studioState.links.find(l =>
            (l.srcId === node.id && l.srcPort === p.id) ||
            (l.tgtId === node.id && l.tgtPort === p.id)
          );
          const isUp = !!link && node.power;
          hoverRowsHtml += `
            <tr>
              <td>${p.short || p.id}</td>
              <td style="color:${isUp ? '#4ade80' : '#f87171'};font-weight:700;">${isUp ? '▲ Up' : '▼ Down'}</td>
              <td>${isUp ? (link.speed >= 1000 ? (link.speed/1000)+'G' : link.speed+'M') : 'Auto'}</td>
              <td>${node.mac}</td>
            </tr>
          `;
        });

        let gradedBadgeHtml = '';
        if (studioState.gradedResult && studioState.gradedResult.mini_topology) {
          const mt = studioState.gradedResult.mini_topology;
          if (mt.ont && mt.ont.id === node.id) {
            gradedBadgeHtml = `<span class="node-graded-badge ont">ONT Controller [${mt.ont.ip}]</span>`;
          } else if (mt.ap && mt.ap.id === node.id) {
            const isPass = studioState.gradedResult.passed;
            gradedBadgeHtml = `<span class="node-graded-badge ap ${isPass ? 'pass' : 'fail'}">${mt.ap.name} [${isPass ? '✅ Đạt' : '⚠️ Sửa'}]</span>`;
          }
        }

        let hv2LedHtml = '';
        if (node.catalogKey === 'ax3000hv2') {
          const pwrOn = node.power !== false;
          const meshOn = pwrOn && !(node.firmwareConfig && node.firmwareConfig.meshEnabled === false);
          const dotOn = 'background:#22c55e;box-shadow:0 0 6px #22c55e;';
          const dotOff = 'background:#475569;box-shadow:none;';
          hv2LedHtml = `
            <div style="display:flex;align-items:center;justify-content:center;gap:7px;margin-top:3px;padding:2px 6px;border-radius:5px;background:rgba(15,23,42,0.82);border:1px solid rgba(148,163,184,0.28);font-size:8.5px;font-family:var(--font-mono);color:#cbd5e1;" title="${meshOn ? 'Đèn MESH đang SÁNG (Enable Mesh)' : 'Đèn MESH đang TẮT (Disable Mesh)'}">
              <span style="display:inline-flex;align-items:center;gap:2px;"><i style="width:6px;height:6px;border-radius:50%;display:inline-block;${pwrOn ? dotOn : dotOff}"></i>2.4G</span>
              <span style="display:inline-flex;align-items:center;gap:2px;"><i style="width:6px;height:6px;border-radius:50%;display:inline-block;${pwrOn ? dotOn : dotOff}"></i>5G</span>
              <span style="display:inline-flex;align-items:center;gap:2px;font-weight:700;color:${meshOn ? '#4ade80' : '#94a3b8'};"><i style="width:6px;height:6px;border-radius:50%;display:inline-block;${meshOn ? dotOn : dotOff}"></i>MESH</span>
            </div>
          `;
        }

        el.innerHTML = `
          ${gradedBadgeHtml}
          <!-- Hover Quick Actions Bar -->
          <div class="node-quick-bar">
            <button class="nq-btn" onclick="event.stopPropagation(); startWiringFromNode('${node.id}', event)" title="Chọn cổng cắm cáp (Cisco Packet Tracer style)">🔌 Cáp</button>
            <button class="nq-btn" onclick="event.stopPropagation(); openDeviceWindow('${node.id}')" title="Mở cấu hình">⚙️ Mở</button>
            <button class="nq-btn del" onclick="event.stopPropagation(); deleteNode('${node.id}')" title="Xóa">✕</button>
          </div>

          <!-- Cisco Style Hardware SVG / Real Image Figure -->
          <div class="node-svg-figure">
            <span class="node-pwr-dot ${node.power ? '' : 'off'}" title="${node.power ? 'Nguồn 12V: BẬT' : 'Nguồn 12V: TẮT'}"></span>
            ${getDeviceSvgGraphic(devCatalog || node.svgType, node.power)}
          </div>

          <!-- Clean 2-Line Caption Below Icon -->
          <div class="node-caption">
            <span class="node-name" title="${node.name}">${node.name}</span>
            <span class="node-ip-sub">${node.ip}</span>
          </div>
          ${hv2LedHtml}

          <!-- Hover Port Status Inspection Table -->
          <div class="cpt-hover-card">
            <div class="cpt-hover-title">
              <span>${devCatalog.model || node.model} (${node.roleLabel})</span>
              <span>${node.ip}</span>
            </div>
            <table class="cpt-hover-table">
              <thead><tr><th>Port</th><th>Link</th><th>Speed</th><th>MAC Address</th></tr></thead>
              <tbody>${hoverRowsHtml}</tbody>
            </table>
          </div>
        `;

        container.appendChild(el);
      });
    }

    // 6. DRAG, CISCO PORT CONTEXT POPUP, LIVE RUBBER-BAND WIRING & AUTO-CONNECT (⚡)
    let activeDragNode = null;
    let dragOffset = { x: 0, y: 0 };

    function getCanvasZoom() {
      const z = parseFloat(window.__canvasZoom || 1.0);
      return (z > 0.1 && z < 5.0) ? z : 1.0;
    }

    function startNodeDrag(nodeId, e) {
      closeCiscoPortPopup();
      activeDragNode = studioState.nodes.find(n => n.id === nodeId);
      if (!activeDragNode) return;
      studioState.selectedNodeId = nodeId;
      const z = getCanvasZoom();
      dragOffset.x = (e.clientX / z) - activeDragNode.x;
      dragOffset.y = (e.clientY / z) - activeDragNode.y;
      window.addEventListener('mousemove', onNodeMouseMove);
      window.addEventListener('mouseup', onNodeMouseUp);
    }

    function onNodeMouseMove(e) {
      if (!activeDragNode) return;
      const z = getCanvasZoom();
      const canvas = document.getElementById('net-canvas');
      const maxW = canvas ? (canvas.clientWidth / z) : (window.innerWidth / z);
      const maxH = canvas ? (canvas.clientHeight / z) : ((window.innerHeight / z) - 100);
      activeDragNode.x = Math.max(8, Math.min(Math.max(8, maxW - 115), (e.clientX / z) - dragOffset.x));
      activeDragNode.y = Math.max(36, Math.min(Math.max(36, maxH - 102), (e.clientY / z) - dragOffset.y));
      renderCanvas();
    }

    function onNodeMouseUp() {
      activeDragNode = null;
      window.removeEventListener('mousemove', onNodeMouseMove);
      window.removeEventListener('mouseup', onNodeMouseUp);
    }

    // Hỗ trợ cảm ứng ngón tay (Touch Drag & Tap) mượt 60fps trên iPhone X / Android không hủy DOM giữa chừng
    let activeTouchDrag = null;
    let lastTouchTapInfo = { nodeId: null, time: 0 };

    function startNodeTouchInteraction(nodeId, nodeEl, e) {
      const t = e.touches[0];
      if (!t) return;
      const node = studioState.nodes.find(n => n.id === nodeId);
      if (!node) return;
      if (e.cancelable) e.preventDefault();
      e.stopPropagation();
      const z = getCanvasZoom();
      activeTouchDrag = {
        node: node,
        el: nodeEl,
        startClientX: t.clientX,
        startClientY: t.clientY,
        offsetX: (t.clientX / z) - node.x,
        offsetY: (t.clientY / z) - node.y,
        moved: false
      };
      window.addEventListener('touchmove', onNodeTouchMove, { passive: false });
      window.addEventListener('touchend', onNodeTouchEnd, { passive: false });
      window.addEventListener('touchcancel', onNodeTouchEnd, { passive: false });
    }

    function onNodeTouchMove(e) {
      if (!activeTouchDrag || !e.touches || !e.touches[0]) return;
      if (studioState.currentTool === 'select' && e.cancelable) {
        e.preventDefault();
      }
      const t = e.touches[0];
      const dist = Math.hypot(t.clientX - activeTouchDrag.startClientX, t.clientY - activeTouchDrag.startClientY);
      if (!activeTouchDrag.moved && dist < 5) return;
      if (studioState.currentTool !== 'select') return;
      if (!activeTouchDrag.moved) {
        activeTouchDrag.moved = true;
        closeCiscoPortPopup();
        studioState.selectedNodeId = activeTouchDrag.node.id;
      }
      const z = getCanvasZoom();
      const canvas = document.getElementById('net-canvas');
      const maxW = canvas ? (canvas.clientWidth / z) : (window.innerWidth / z);
      const maxH = canvas ? (canvas.clientHeight / z) : ((window.innerHeight / z) - 100);
      activeTouchDrag.node.x = Math.max(8, Math.min(Math.max(8, maxW - 110), (t.clientX / z) - activeTouchDrag.offsetX));
      activeTouchDrag.node.y = Math.max(36, Math.min(Math.max(36, maxH - 98), (t.clientY / z) - activeTouchDrag.offsetY));
      if (activeTouchDrag.el) {
        activeTouchDrag.el.style.left = activeTouchDrag.node.x + 'px';
        activeTouchDrag.el.style.top = activeTouchDrag.node.y + 'px';
      }
      renderSvgWires();
    }

    function onNodeTouchEnd(e) {
      window.removeEventListener('touchmove', onNodeTouchMove);
      window.removeEventListener('touchend', onNodeTouchEnd);
      window.removeEventListener('touchcancel', onNodeTouchEnd);
      if (!activeTouchDrag) return;
      const dragInfo = activeTouchDrag;
      activeTouchDrag = null;

      if (dragInfo.moved) {
        renderCanvas();
        return;
      }

      // Chạm 1 lần (Tap không kéo)
      if (e && e.cancelable) e.preventDefault();
      const nodeId = dragInfo.node.id;
      if (studioState.currentTool === 'wire') {
        handleWireToolNodeClick(nodeId, e);
        return;
      }
      if (studioState.currentTool === 'pdu') {
        handlePduToolNodeClick(nodeId);
        return;
      }
      if (studioState.currentTool === 'delete') {
        deleteNode(nodeId);
        return;
      }

      const now = Date.now();
      if (lastTouchTapInfo.nodeId === nodeId && (now - lastTouchTapInfo.time) < 340) {
        lastTouchTapInfo = { nodeId: null, time: 0 };
        openDeviceWindow(nodeId);
        return;
      }
      lastTouchTapInfo = { nodeId: nodeId, time: now };
      studioState.selectedNodeId = nodeId;
      renderCanvas();
    }

    function handleCanvasMouseMove(e) {
      if (studioState.currentTool === 'wire' && studioState.wireStartNodeId) {
        const canvas = document.getElementById('net-canvas');
        if (!canvas) return;
        const rect = canvas.getBoundingClientRect();
        const z = getCanvasZoom();
        studioState.wireMousePos = {
          x: (e.clientX - rect.left) / z,
          y: (e.clientY - rect.top) / z
        };
        renderSvgWires();
      }
    }

    function handleCanvasBgClick(e) {
      if (e.target.closest('.node-device') || e.target.closest('.cpt-port-popup-menu') || e.target.closest('.cable-label-pill')) {
        return;
      }
      closeCiscoPortPopup();
      if (studioState.currentTool === 'wire' && studioState.wireStartNodeId) {
        studioState.wireStartNodeId = null;
        studioState.wireStartPortId = null;
        studioState.wireMousePos = null;
        renderCanvas();
        showToast('🔌 Đã hủy kéo dây hiện tại. Click thiết bị nguồn để bắt đầu lại.');
      }
    }

    function setWorkspaceMode(mode) {
      studioState.workspaceMode = mode;
      document.getElementById('ws-tab-logical').classList.toggle('active', mode === 'logical');
      document.getElementById('ws-tab-physical').classList.toggle('active', mode === 'physical');
      document.getElementById('net-canvas').classList.toggle('physical-mode', mode === 'physical');
      toggleNs3PhysicsPanel(mode === 'physical');
      renderCanvas();
    }

    function togglePortLabels() {
      studioState.showPortLabels = !studioState.showPortLabels;
      document.getElementById('btn-toggle-port-labels').classList.toggle('active', studioState.showPortLabels);
      renderCanvas();
    }

    function clearActiveToolButtons() {
      [
        'tool-select', 'tool-auto-wire', 'tool-pdu', 'tool-delete',
        'cable-btn-ETH_CAT6A', 'cable-btn-ETH_CAT5E', 'cable-btn-FIBER_SC', 'cable-btn-WIFI_MESH'
      ].forEach(id => {
        const btn = document.getElementById(id);
        if (btn) btn.classList.remove('active');
      });
    }

    function setStudioTool(tool) {
      studioState.currentTool = tool;
      studioState.wireStartNodeId = null;
      studioState.wireStartPortId = null;
      studioState.wireMousePos = null;
      studioState.pduStartNodeId = null;
      document.body.classList.toggle('wiring-active', tool === 'wire');
      closeCiscoPortPopup();
      clearActiveToolButtons();
      const btn = document.getElementById('tool-' + tool);
      if (btn) btn.classList.add('active');

      const canvas = document.getElementById('net-canvas');
      if (canvas) {
        canvas.style.cursor = (tool === 'pdu' || tool === 'wire') ? 'crosshair' : (tool === 'delete' ? 'not-allowed' : 'default');
      }
      if (tool === 'pdu') showToast('✉️ Click thiết bị nguồn (Source) rồi click thiết bị đích (Destination) để bắn gói Ping!');
      renderCanvas();
    }

    function setCableMode(cableType) {
      studioState.currentTool = 'wire';
      studioState.currentCableType = cableType;
      studioState.wireStartNodeId = null;
      studioState.wireStartPortId = null;
      studioState.wireMousePos = null;
      document.body.classList.add('wiring-active');
      closeCiscoPortPopup();
      clearActiveToolButtons();

      const sel = document.getElementById('cable-type-select');
      if (sel) sel.value = cableType;

      if (cableType === 'AUTO') {
        const autoBtn = document.getElementById('tool-auto-wire');
        if (autoBtn) autoBtn.classList.add('active');
        showToast('⚡ Auto-Connect (Cisco Style): Click Thiết bị 1 ➔ Kéo dây sang Thiết bị 2 để tự động chọn cổng tối ưu!');
      } else {
        const cBtn = document.getElementById('cable-btn-' + cableType);
        if (cBtn) cBtn.classList.add('active');
        const labelMap = {
          'ETH_CAT6A': 'Cáp thẳng CAT.6A (10G/2.5G)',
          'ETH_CAT5E': 'Cáp đồng CAT.5e (Giới hạn 1Gbps)',
          'FIBER_SC': 'Cáp quang SC/APC (PON)',
          'WIFI_MESH': 'Sóng Wi-Fi 7 MLO'
        };
        showToast(`🔌 Đã chọn ${labelMap[cableType] || cableType}: Click vào Thiết bị 1 để bung Menu Chọn Cổng ngay cạnh thiết bị!`);
      }
      const canvas = document.getElementById('net-canvas');
      if (canvas) canvas.style.cursor = 'crosshair';
      renderCanvas();
    }

    function startWiringFromNode(nodeId, e) {
      if (studioState.currentTool !== 'wire' || studioState.currentCableType === 'AUTO') {
        setCableMode('ETH_CAT6A');
      }
      openCiscoPortPopup(nodeId);
    }

    function handleWireToolNodeClick(nodeId, e) {
      // Case 1: Auto-Connect (⚡) mode — no port popup needed, immediate rubber-band & auto port matching
      if (studioState.currentCableType === 'AUTO') {
        if (!studioState.wireStartNodeId) {
          studioState.wireStartNodeId = nodeId;
          studioState.wireStartPortId = null;
          const src = studioState.nodes.find(n => n.id === nodeId);
          if (src) studioState.wireMousePos = { x: src.x + 68, y: src.y + 38 };
          renderCanvas();
          showToast(`⚡ Đang kéo cáp từ ${src ? src.name : nodeId} ➔ Click vào thiết bị đích để cắm dây tự động!`);
          return;
        }
        if (studioState.wireStartNodeId === nodeId) {
          studioState.wireStartNodeId = null;
          studioState.wireMousePos = null;
          renderCanvas();
          return;
        }
        const srcId = studioState.wireStartNodeId;
        studioState.wireStartNodeId = null;
        studioState.wireMousePos = null;
        autoConnectTwoNodes(srcId, nodeId);
        setStudioTool('select');
        return;
      }

      // Case 2: Manual Cable Type (CAT.6A, CAT.5e, Fiber, Wi-Fi) — Authentic Cisco Floating Port Context Menu right next to the clicked device!
      openCiscoPortPopup(nodeId);
    }

    function openCiscoPortPopup(nodeId) {
      const node = studioState.nodes.find(n => n.id === nodeId);
      if (!node) return;
      const dev = FPT_CATALOG[node.catalogKey];
      if (!dev || !dev.ports) return;

      const popup = document.getElementById('cpt-port-popup');
      const titleEl = document.getElementById('cpt-port-popup-title');
      const listEl = document.getElementById('cpt-port-popup-list');
      if (!popup || !titleEl || !listEl) return;

      const isTargetSelection = !!(studioState.wireStartNodeId && studioState.wireStartNodeId !== nodeId && studioState.wireStartPortId);
      titleEl.textContent = isTargetSelection
        ? `🔌 BƯỚC 2/2: CẮM VÀO ${node.name}`
        : `🔌 BƯỚC 1/2: CHỌN CỔNG — ${node.name}`;

      listEl.innerHTML = '';
      if (isTargetSelection) {
        const candidates = (studioState.nodes || []).filter(n => n.id !== studioState.wireStartNodeId && n.category !== 'core');
        if (candidates.length > 1) {
          const switchRow = document.createElement('div');
          switchRow.style.cssText = 'display:flex;align-items:center;gap:4px;padding:4px 4px 6px;border-bottom:1px solid #1e293b;overflow-x:auto;';
          candidates.forEach(cand => {
            const pill = document.createElement('button');
            pill.type = 'button';
            const isCur = cand.id === node.id;
            pill.style.cssText = `padding:4px 8px;border-radius:4px;font-size:10.5px;font-weight:700;cursor:pointer;white-space:nowrap;border:1px solid ${isCur ? '#38bdf8' : '#334155'};background:${isCur ? '#0284c7' : '#1e293b'};color:${isCur ? '#fff' : '#cbd5e1'};`;
            pill.textContent = `➔ ${cand.name}`;
            pill.onclick = (ev) => {
              ev.stopPropagation();
              openCiscoPortPopup(cand.id);
            };
            switchRow.appendChild(pill);
          });
          listEl.appendChild(switchRow);
        }
      }
      dev.ports.forEach(p => {
        if (window._isEmbeddedPortalLesson && p.type !== 'eth') return;
        const existingLink = studioState.links.find(l =>
          (l.srcId === node.id && l.srcPort === p.id) ||
          (l.tgtId === node.id && l.tgtPort === p.id)
        );
        const item = document.createElement('div');
        item.className = 'cpt-port-popup-item';
        item.dataset.portId = p.id;

        const jackIcon = p.type === 'fiber' ? '🟢' : (p.type === 'wifi' ? '🟣' : (p.speed >= 10000 ? '🟨' : (p.speed >= 2500 ? '🟦' : '⬜')));
        const spdLabel = p.speed >= 1000 ? `${p.speed / 1000}G` : `${p.speed}M`;
        const statusBadge = existingLink
          ? `<span class="cpt-port-popup-badge" style="color:#fbbf24;">Đang cắm (Đổi)</span>`
          : `<span class="cpt-port-popup-badge" style="color:#4ade80;">${spdLabel} • Trống</span>`;

        item.innerHTML = `
          <div class="cpt-port-popup-left">
            <span class="cpt-port-jack-icon" style="border-color:${p.color || '#64748b'};">${jackIcon}</span>
            <span>${p.name}</span>
          </div>
          ${statusBadge}
        `;

        item.onclick = (ev) => {
          ev.stopPropagation();
          onCiscoPortPopupItemClick(node.id, p);
        };
        listEl.appendChild(item);
      });

      // Position floating menu right next to the device icon (clamped within canvas)
      const canvas = document.getElementById('net-canvas');
      const maxLeft = canvas ? (canvas.clientWidth - 235) : 950;
      const maxTop = canvas ? (canvas.clientHeight - 190) : 400;
      popup.style.left = Math.max(12, Math.min(maxLeft, node.x + 122)) + 'px';
      popup.style.top = Math.max(12, Math.min(maxTop, node.y - 4)) + 'px';
      popup.style.display = 'block';
    }

    function closeCiscoPortPopup() {
      const popup = document.getElementById('cpt-port-popup');
      if (popup) popup.style.display = 'none';
    }

    function onCiscoPortPopupItemClick(nodeId, portObj) {
      closeCiscoPortPopup();
      const clickedNode = studioState.nodes.find(n => n.id === nodeId);
      if (!clickedNode) return;

      // Step 1: Selecting the Source Port on Device 1 -> Start Rubber-Band Wire!
      if (!studioState.wireStartNodeId || studioState.wireStartNodeId === nodeId || !studioState.wireStartPortId) {
        studioState.wireStartNodeId = nodeId;
        studioState.wireStartPortId = portObj.id;
        studioState.wireMousePos = { x: clickedNode.x + 68, y: clickedNode.y + 38 };

        // Auto-adjust cable media if user picked a Fiber or Wi-Fi port
        if (portObj.type === 'fiber' && studioState.currentCableType !== 'FIBER_SC') {
          studioState.currentCableType = 'FIBER_SC';
        } else if (portObj.type === 'wifi' && studioState.currentCableType !== 'WIFI_MESH') {
          studioState.currentCableType = 'WIFI_MESH';
        }

        renderCanvas();
        const isMobileTouchView = Boolean(
          window.innerWidth <= 900 ||
          window.innerHeight <= 500 ||
          (typeof navigator !== 'undefined' && navigator.maxTouchPoints > 0)
        );
        const otherTargets = (studioState.nodes || []).filter(n => n.id !== nodeId && n.category !== 'core');
        if (isMobileTouchView && otherTargets.length >= 1) {
          setTimeout(() => {
            openCiscoPortPopup(otherTargets[0].id);
          }, 60);
          showToast(`🔌 Bước 2/2: Chọn cổng cắm vào ${otherTargets[0].name} bên dưới để hoàn tất nối cáp!`);
          return;
        }
        showToast(`🔌 Đã cắm đầu dây vào ${clickedNode.name} [${portObj.short || portObj.name}] ➔ Di chuột kéo dây tới thiết bị thứ 2!`);
        return;
      }

      // Step 2: Selecting the Destination Port on Device 2 -> Complete Connection!
      const srcNode = studioState.nodes.find(n => n.id === studioState.wireStartNodeId);
      if (!srcNode) return;
      const srcDev = FPT_CATALOG[srcNode.catalogKey];
      const srcPortObj = srcDev.ports.find(p => p.id === studioState.wireStartPortId) || srcDev.ports[0];

      let negotiatedSpeed = Math.min(srcPortObj.speed || 1000, portObj.speed || 1000);
      let finalCableType = studioState.currentCableType;
      if (srcPortObj.type === 'fiber' || portObj.type === 'fiber') {
        finalCableType = 'FIBER_SC';
      } else if (srcPortObj.type === 'wifi' || portObj.type === 'wifi') {
        finalCableType = 'WIFI_MESH';
      } else if (finalCableType === 'ETH_CAT5E' && negotiatedSpeed > 1000) {
        negotiatedSpeed = 1000;
      } else if (finalCableType === 'AUTO') {
        finalCableType = 'ETH_CAT6A';
      }

      createLink(
        srcNode.id,
        srcPortObj.id,
        clickedNode.id,
        portObj.id,
        finalCableType,
        negotiatedSpeed
      );

      studioState.wireStartNodeId = null;
      studioState.wireStartPortId = null;
      studioState.wireMousePos = null;
      setStudioTool('select');
      renderCanvas();
      showToast(`✅ Đã đấu nối thành công: ${srcNode.name} [${srcPortObj.short}] ↔ ${clickedNode.name} [${portObj.short}] (${negotiatedSpeed >= 1000 ? (negotiatedSpeed/1000)+' Gbps' : negotiatedSpeed+' Mbps'})`);
      syncZteBackend();
    }

    function autoConnectTwoNodes(srcId, tgtId) {
      const srcNode = studioState.nodes.find(n => n.id === srcId);
      const tgtNode = studioState.nodes.find(n => n.id === tgtId);
      if (!srcNode || !tgtNode) return;
      const srcCat = FPT_CATALOG[srcNode.catalogKey];
      const tgtCat = FPT_CATALOG[tgtNode.catalogKey];

      const f1 = srcCat.ports.find(p => p.type === 'fiber');
      const f2 = tgtCat.ports.find(p => p.type === 'fiber');
      if (f1 && f2 && (srcNode.category === 'infra' || tgtNode.category === 'infra')) {
        const spd = Math.min(f1.speed, f2.speed);
        createLink(srcId, f1.id, tgtId, f2.id, 'FIBER_SC', spd);
        renderCanvas();
        showToast(`⚡ Đã nối cáp quang ${srcNode.name} [${f1.short}] ↔ ${tgtNode.name} [${f2.short}]`);
        syncZteBackend();
        return;
      }

      const srcLanPorts = srcCat.ports.filter(p => p.type === 'eth' && String(p.id || '').toUpperCase().includes('LAN')).sort((a, b) => b.speed - a.speed);
      const isZteTarget = tgtNode.catalogKey === 'be15000';
      const tgtPreferredPorts = tgtCat.ports.filter(p => {
        if (p.type !== 'eth') return false;
        const pid = String(p.id || '').toUpperCase();
        return isZteTarget ? pid.includes('WAN') : pid.includes('LAN');
      }).sort((a, b) => b.speed - a.speed);

      const eth1 = srcLanPorts[0] || srcCat.ports.filter(p => p.type === 'eth').sort((a, b) => b.speed - a.speed)[0];
      const eth2 = tgtPreferredPorts[0] || tgtCat.ports.filter(p => p.type === 'eth').sort((a, b) => b.speed - a.speed)[0];
      if (eth1 && eth2) {
        const spd = Math.min(eth1.speed, eth2.speed);
        createLink(srcId, eth1.id, tgtId, eth2.id, 'ETH_CAT6A', spd);
        renderCanvas();
        showToast(`⚡ Đã nối cáp CAT.6A chuẩn FPT ${srcNode.name} [${eth1.short}] ↔ ${tgtNode.name} [${eth2.short}]`);
        syncZteBackend();
        return;
      }

      const w1 = srcCat.ports.find(p => p.type === 'wifi') || srcCat.ports[0];
      const w2 = tgtCat.ports.find(p => p.type === 'wifi') || tgtCat.ports[0];
      createLink(srcId, w1.id, tgtId, w2.id, 'WIFI_MESH', Math.min(w1.speed, w2.speed));
      renderCanvas();
      showToast(`⚡ Đã kết nối Wi-Fi MLO ${srcNode.name} ↔ ${tgtNode.name}`);
      syncZteBackend();
    }

    // 8. PORT SELECTOR & CABLE INSPECTOR MODALS
    let pendingConnection = { srcId: null, tgtId: null, srcPort: null, tgtPort: null };

    function openPortSelectorModal(srcId, tgtId) {
      const srcNode = studioState.nodes.find(n => n.id === srcId);
      const tgtNode = studioState.nodes.find(n => n.id === tgtId);
      if (!srcNode || !tgtNode) return;
      const srcCatalog = FPT_CATALOG[srcNode.catalogKey];
      const tgtCatalog = FPT_CATALOG[tgtNode.catalogKey];

      const defSrcLan = srcCatalog.ports.find(p => p.type === 'eth' && String(p.id || '').toUpperCase().includes('LAN'));
      const isZteTgt = tgtNode.catalogKey === 'be15000';
      const defTgtPort = tgtCatalog.ports.find(p => p.type === 'eth' && String(p.id || '').toUpperCase().includes(isZteTgt ? 'WAN' : 'LAN'));
      pendingConnection = {
        srcId: srcId,
        tgtId: tgtId,
        srcPort: defSrcLan ? defSrcLan.id : (srcCatalog.ports[1] ? srcCatalog.ports[1].id : srcCatalog.ports[0].id),
        tgtPort: defTgtPort ? defTgtPort.id : tgtCatalog.ports[0].id
      };

      document.getElementById('wire-src-name').textContent = srcNode.name;
      document.getElementById('wire-tgt-name').textContent = tgtNode.name;
      document.getElementById('col-title-a').textContent = `CỔNG TRÊN ${srcNode.name}:`;
      document.getElementById('col-title-b').textContent = `CỔNG TRÊN ${tgtNode.name}:`;

      renderPortRadioList('ports-list-a', srcCatalog.ports, pendingConnection.srcPort, pId => { pendingConnection.srcPort = pId; });
      renderPortRadioList('ports-list-b', tgtCatalog.ports, pendingConnection.tgtPort, pId => { pendingConnection.tgtPort = pId; });
      document.getElementById('port-selector-modal').style.display = 'flex';
    }

    function renderPortRadioList(containerId, ports, selectedPortId, onSelect) {
      const container = document.getElementById(containerId);
      container.innerHTML = '';
      ports.forEach(p => {
        const item = document.createElement('div');
        item.className = 'port-radio-item ' + (p.id === selectedPortId ? 'selected' : '');
        item.innerHTML = `
          <div>
            <div style="font-weight:700;color:#f8fafc;">${p.name}</div>
            <div style="font-size:9px;color:#94a3b8;">${p.type.toUpperCase()} • ${p.speed >= 1000 ? (p.speed/1000)+' Gbps' : p.speed+' Mbps'}</div>
          </div>
          ${p.tag ? `<span style="font-size:8.5px;color:#38bdf8;background:rgba(56,189,248,0.14);padding:2px 5px;border-radius:3px;font-weight:700;">${p.tag}</span>` : ''}
        `;
        item.onclick = () => {
          container.querySelectorAll('.port-radio-item').forEach(el => el.classList.remove('selected'));
          item.classList.add('selected');
          onSelect(p.id);
        };
        container.appendChild(item);
      });
    }

    function confirmCableConnection() {
      if (!pendingConnection.srcId || !pendingConnection.tgtId) return;
      const srcNode = studioState.nodes.find(n => n.id === pendingConnection.srcId);
      const tgtNode = studioState.nodes.find(n => n.id === pendingConnection.tgtId);
      const srcDev = FPT_CATALOG[srcNode.catalogKey];
      const tgtDev = FPT_CATALOG[tgtNode.catalogKey];

      const p1 = srcDev.ports.find(p => p.id === pendingConnection.srcPort);
      const p2 = tgtDev.ports.find(p => p.id === pendingConnection.tgtPort);
      let negotiatedSpeed = Math.min(p1 ? p1.speed : 1000, p2 ? p2.speed : 1000);
      if (studioState.currentCableType === 'ETH_CAT5E' && negotiatedSpeed > 1000) negotiatedSpeed = 1000;

      createLink(
        pendingConnection.srcId,
        pendingConnection.srcPort,
        pendingConnection.tgtId,
        pendingConnection.tgtPort,
        studioState.currentCableType === 'AUTO' ? 'ETH_CAT6A' : studioState.currentCableType,
        negotiatedSpeed
      );
      closePortSelectorModal();
      renderCanvas();
      scheduleAutoCrossDeviceSync('cable_connect', 40, false);
      showToast(`🔌 Đã nối & Tự động đồng bộ cấu hình: ${srcNode.name} [${p1.short}] ➔ ${tgtNode.name} [${p2.short}]`);
      syncZteBackend();
    }

    function closePortSelectorModal() {
      document.getElementById('port-selector-modal').style.display = 'none';
      setStudioTool('select');
    }

    function openCableInspector(linkId) {
      const link = studioState.links.find(l => l.id === linkId);
      if (!link) return;
      studioState.selectedLinkId = linkId;
      const srcNode = studioState.nodes.find(n => n.id === link.srcId);
      const tgtNode = studioState.nodes.find(n => n.id === link.tgtId);

      document.getElementById('insp-cable-title').textContent = `${srcNode.name} [${link.srcPort}] ↔ ${tgtNode.name} [${link.tgtPort}]`;
      document.getElementById('insp-cable-type').textContent = `Loại kết nối: ${link.cableType}`;
      document.getElementById('insp-cable-speed').textContent = link.speed >= 1000 ? (link.speed/1000)+' Gbps' : link.speed+' Mbps';

      if (link.cableType === 'FIBER_SC') {
        const pon = calculateOpticalPonMetrics();
        document.getElementById('insp-cable-note').innerHTML =
          `🔦 <b>Phân tích Quang PON (ns-3 Optical Model):</b><br>` +
          `• Bộ chia OLT: <b>${pon.splitterRatio} (-${pon.splitterLossDb} dB)</b> | Chiều dài: <b>${pon.fiberLengthKm} km (-${pon.fiberDistLossDb} dB)</b><br>` +
          `• Công suất thu tại ONT (Rx Power): <b>${pon.rxDbm.toFixed(2)} dBm</b> ➔ <b>${pon.stateLabel}</b>`;
      } else if (link.cableType === 'WIFI_MESH') {
        const wf = calculateWifiLinkPhysics(srcNode, tgtNode);
        document.getElementById('insp-cable-note').innerHTML =
          `📶 <b>Phân tích Sóng Wi-Fi (ns-3 COST-231 Multi-Wall):</b><br>` +
          `• Khoảng cách: <b>${wf.distMeters}m</b> | Xuyên qua: <b>${wf.wallsCrossed} vách ngăn (${wf.wallMaterialName}) = -${wf.totalWallLossDb} dB</b><br>` +
          `• Cường độ thu RSSI: <b>${wf.rssiDbm} dBm</b> ➔ Băng tần: <b>${wf.bandLabel} (${wf.phyRateMbps} Mbps)</b>`;
      } else {
        document.getElementById('insp-cable-note').innerHTML = link.speed >= 2500
          ? '✅ <b>Link UP (▲ Xanh lá):</b> Đấu nối chuẩn tối ưu Multi-Gig, không bị nghẽn băng thông.'
          : '⚠️ <b>Cảnh báo Nghẽn 1Gbps (● Cam):</b> Đang cắm vào cổng 1GE hoặc dùng cáp CAT.5e. Hãy chuyển sang cổng <b>LAN 1 (10GE)</b> ↔ <b>WAN (2.5GE)</b>!';
      }
      document.getElementById('cable-inspector-modal').style.display = 'flex';
    }

    function unplugSelectedCable() {
      if (!studioState.selectedLinkId) return;
      window.__grading4StepDirty = true;
      studioState.links = studioState.links.filter(l => l.id !== studioState.selectedLinkId);
      closeCableInspectorModal();
      propagateFirmwareStateAcrossLinks(true);
      renderCanvas();
      scheduleAutoCrossDeviceSync('cable_unplug', 40, false);
      showToast('✂️ Đã rút dây cáp — Tự động ngắt liên kết cấu hình trên thiết bị đích!');
      syncZteBackend();
    }

    function closeCableInspectorModal() {
      document.getElementById('cable-inspector-modal').style.display = 'none';
    }

    function deleteNode(nodeId) {
      window.__grading4StepDirty = true;
      studioState.nodes = studioState.nodes.filter(n => n.id !== nodeId);
      studioState.links = studioState.links.filter(l => l.srcId !== nodeId && l.tgtId !== nodeId);
      propagateFirmwareStateAcrossLinks(true);
      renderCanvas();
      scheduleAutoCrossDeviceSync('node_delete', 40, false);
      showToast('🗑️ Đã xóa thiết bị');
      syncZteBackend();
    }

    // 9. BOTTOM DEVICE SHELF & SMART NON-OVERLAPPING MOBILE PLACEMENT
    function getRecommendedPaletteKeys() {
      const sk = (typeof getCurrentScenarioKey === 'function')
        ? getCurrentScenarioKey()
        : (window._embeddedPortalScenario || studioState.currentScenario || '');
      const map = {
        p3_mesh_ax3000cv2: ['ax3000c'],
        p3_mesh_ax3000gzv2: ['ax3000gz_v2', 'ax3000c'],
        p3_mesh_ax3000hv2: ['ax3000hv2', 'ax3000c'],
        p3_mesh: ['ax3000hv2', 'ax3000c'],
        p3_mesh_ax1800gz: ['ax1800gz', 'ax3000c'],
        p3_mesh_ax3000s: ['ax3000s', 'ax3000c'],
        p3_mesh_zte: ['be12000', 'be15000']
      };
      if (map[sk]) return map[sk];
      if (window._embeddedPortalDeviceId && FPT_CATALOG[window._embeddedPortalDeviceId]) {
        return [window._embeddedPortalDeviceId, 'ax3000c'];
      }
      return [];
    }

    function computeSmartSpawnPosition() {
      const canvas = document.getElementById('net-canvas');
      const z = getCanvasZoom();
      const cw = canvas && canvas.clientWidth > 0 ? (canvas.clientWidth / z) : (window.innerWidth / z);
      const ch = canvas && canvas.clientHeight > 0 ? (canvas.clientHeight / z) : Math.max(220, (window.innerHeight / z) - 140);
      const existing = studioState.nodes || [];

      let candidates = [];
      if (cw <= 560) {
        // Màn hình dọc điện thoại (vd Mobile X 375px): Trạm 1 bên trái, Trạm 2 bên phải cách nhau ~205px (đủ vẽ dây cáp & nhãn cổng rõ nét, tuyệt đối không chồng đè)
        const leftX = Math.max(14, Math.round(cw * 0.21) - 46);
        const rightX = Math.max(leftX + 145, Math.min(cw - 108, Math.round(cw * 0.79) - 52));
        const row1Y = Math.max(58, Math.min(ch - 110, Math.round(ch * 0.34) - 42));
        const row2Y = Math.max(row1Y + 112, Math.min(ch - 104, Math.round(ch * 0.68) - 42));
        candidates = [
          { x: leftX, y: row1Y },
          { x: rightX, y: row1Y },
          { x: leftX, y: row2Y },
          { x: rightX, y: row2Y }
        ];
      } else if (ch <= 460) {
        // Màn hình xoay ngang điện thoại (vd Mobile X 812x375)
        const midY = Math.max(44, Math.min(ch - 104, Math.round(ch * 0.44) - 40));
        candidates = [
          { x: Math.max(24, Math.round(cw * 0.28) - 52), y: midY },
          { x: Math.min(cw - 120, Math.round(cw * 0.72) - 52), y: midY },
          { x: Math.max(24, Math.round(cw * 0.50) - 52), y: midY }
        ];
      } else {
        // Máy tính / Tablet rộng: Trạm 1 trái, Trạm 2 phải cân đối
        const midY = Math.max(85, Math.min(ch - 120, Math.round(ch * 0.42) - 45));
        candidates = [
          { x: Math.max(60, Math.round(cw * 0.34) - 55), y: midY },
          { x: Math.min(cw - 140, Math.round(cw * 0.66) - 55), y: midY },
          { x: Math.max(60, Math.round(cw * 0.50) - 55), y: Math.min(ch - 115, midY + 135) }
        ];
      }

      for (let i = 0; i < candidates.length; i++) {
        const c = candidates[i];
        const occupied = existing.some(n => Math.hypot((n.x || 0) - c.x, (n.y || 0) - c.y) < 95);
        if (!occupied) return c;
      }

      const fallbackIdx = existing.length;
      return {
        x: Math.max(16, Math.min(cw - 115, 28 + ((fallbackIdx * 130) % Math.max(140, cw - 135)))),
        y: Math.max(56, Math.min(ch - 106, 70 + (Math.floor(fallbackIdx / 2) * 110) % Math.max(110, ch - 140)))
      };
    }

    function clampNodesInsideCanvasViewport() {
      const canvas = document.getElementById('net-canvas');
      if (!canvas || canvas.clientWidth <= 0 || canvas.clientHeight <= 0) return;
      const z = getCanvasZoom();
      const maxW = canvas.clientWidth / z;
      const maxH = canvas.clientHeight / z;
      let changed = false;
      (studioState.nodes || []).forEach((n, idx) => {
        const clampedX = Math.max(10, Math.min(Math.max(10, maxW - 110), n.x));
        const clampedY = Math.max(42, Math.min(Math.max(42, maxH - 102), n.y));
        if (clampedX !== n.x || clampedY !== n.y) {
          n.x = clampedX;
          n.y = clampedY;
          changed = true;
        }
      });
      // Nếu xoay từ ngang sang dọc làm 2 thiết bị bị dồn trùng vị trí ở mép phải, tự tách sang trái/phải
      if (studioState.nodes && studioState.nodes.length === 2) {
        const n0 = studioState.nodes[0];
        const n1 = studioState.nodes[1];
        if (Math.hypot(n0.x - n1.x, n0.y - n1.y) < 80 && maxW >= 260) {
          n0.x = Math.max(14, Math.round(maxW * 0.21) - 46);
          n1.x = Math.min(maxW - 108, Math.round(maxW * 0.79) - 52);
          changed = true;
        }
      }
      updateCanvasQuickGuideBanner();
      if (changed) renderCanvas();
    }

    window.toggleMobileBottomDock = function() {
      const collapsed = document.body.classList.toggle('mobile-dock-collapsed');
      const btn = document.getElementById('mobile-dock-toggle-btn');
      if (btn) {
        btn.textContent = collapsed ? '▴ Mở kệ thiết bị' : '▾ Thu gọn kệ thiết bị';
      }
      setTimeout(clampNodesInsideCanvasViewport, 60);
    };

    window.addEventListener('resize', () => {
      clampNodesInsideCanvasViewport();
      if (typeof applyMobileWebGuiScale === 'function') {
        applyMobileWebGuiScale(1);
        applyMobileWebGuiScale(2);
      }
    });

    function populatePalette() {
      const shelf = document.getElementById('palette-shelf');
      if (!shelf) return;
      shelf.innerHTML = '';
      const hiddenInPortalEmbed = {
        olt_cloud: 1,
        switch_2960: 1,
        laptop_pc: 1,
        phone_ktv: 1,
        fpt_playbox: 1,
        vigor2927: 1,
        mikrotik_hexs: 1
      };
      const recommendedKeys = getRecommendedPaletteKeys();
      const recommendedSet = new Set(recommendedKeys);
      const orderedKeys = Object.keys(FPT_CATALOG).sort((a, b) => {
        const ia = recommendedKeys.indexOf(a);
        const ib = recommendedKeys.indexOf(b);
        if (ia !== -1 && ib !== -1) return ia - ib;
        if (ia !== -1) return -1;
        if (ib !== -1) return 1;
        return 0;
      });
      orderedKeys.forEach(k => {
        if (window._isEmbeddedPortalLesson && hiddenInPortalEmbed[k]) return;
        const dev = FPT_CATALOG[k];
        const isRec = recommendedSet.has(k);
        const item = document.createElement('div');
        item.className = 'palette-item' + (isRec ? ' palette-item-recommended' : '');
        item.draggable = true;
        item.setAttribute('data-key', k);
        item.setAttribute('data-device', k);
        item.ondragstart = e => { e.dataTransfer.setData('text/plain', k); };
        item.onclick = () => {
          const pos = computeSmartSpawnPosition();
          spawnNode(k, pos.x, pos.y);
          renderCanvas();
          syncZteBackend();
          showToast(`➕ Đã thêm ${dev.name}`);
        };
        item.innerHTML = `
          <div class="palette-item-icon-box">${getDeviceSvgGraphic(dev, true)}</div>
          <div>
            <span class="palette-item-name">${dev.model}${isRec ? ' ⭐' : ''}</span>
            <span class="palette-item-sub">${isRec ? 'Chạm để thêm' : dev.roleLabel}</span>
          </div>
        `;
        shelf.appendChild(item);
      });
      shelf.scrollLeft = 0;
    }

    function filterPalette(cat, ev) {
      document.querySelectorAll('.palette-tab-btn').forEach(b => b.classList.remove('active'));
      if (ev && ev.currentTarget) ev.currentTarget.classList.add('active');
      document.querySelectorAll('.palette-item').forEach(el => {
        const dev = FPT_CATALOG[el.getAttribute('data-key')];
        if (!dev) return;
        const match = (cat === 'all') || (dev.category === cat) || (dev.series === cat);
        el.style.display = match ? 'flex' : 'none';
      });
    }

    function handleCanvasDragOver(e) { e.preventDefault(); e.dataTransfer.dropEffect = 'copy'; }
    function handleCanvasDrop(e) {
      e.preventDefault();
      const k = e.dataTransfer.getData('text/plain');
      if (!k || !FPT_CATALOG[k]) return;
      const rect = document.getElementById('net-canvas').getBoundingClientRect();
      const z = getCanvasZoom();
      spawnNode(k, Math.max(10, ((e.clientX - rect.left) / z) - 65), Math.max(10, ((e.clientY - rect.top) / z) - 40));
      renderCanvas();
      syncZteBackend();
    }


window.loadPhase3Scenario = loadPresetTopology;
