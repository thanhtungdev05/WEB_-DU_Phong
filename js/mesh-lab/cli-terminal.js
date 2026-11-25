    // 11. CLI DIAGNOSTIC TERMINAL — HIERARCHICAL MULTI-VENDOR CLI STATE MACHINE (PHASE 3)
    const cliSessions = {};

    function getCliVendorProfile(node) {
      if (!node) return 'ktv_shell';
      if (node.catalogKey === 'switch_2960' || node.catalogKey === 'olt_cloud') return 'cisco_ios';
      if (node.catalogKey === 'mikrotik_hexs') return 'mikrotik_ros';
      if (node.category === 'client') return 'ktv_shell';
      return 'zte_pon';
    }

    function getOrInitCliSession(node) {
      const id = node ? node.id : '_default';
      if (!cliSessions[id]) {
        const vendor = getCliVendorProfile(node);
        cliSessions[id] = {
          vendor: vendor,
          mode: vendor === 'zte_pon' ? 'priv' : 'user',
          activeIf: null,
          history: [],
          histIdx: -1,
          lastNodeId: id
        };
      }
      return cliSessions[id];
    }

    function getCliPromptString(node) {
      if (!node) return 'C:\\Users\\KTV_FPT>';
      const session = getOrInitCliSession(node);
      const vendor = getCliVendorProfile(node);
      const host = (node.name || 'Device').replace(/\s+/g, '_');

      if (vendor === 'mikrotik_ros') {
        return `[admin@${host}] >`;
      }
      if (vendor === 'ktv_shell') {
        return `C:\\Users\\KTV_FPT>`;
      }
      // cisco_ios & zte_pon hierarchical prompts
      if (session.mode === 'user') return `${host}>`;
      if (session.mode === 'priv') return `${host}#`;
      if (session.mode === 'config') return `${host}(config)#`;
      if (session.mode === 'config-if') return `${host}(config-if)#`;
      if (session.mode === 'config-vlan') return `${host}(config-vlan)#`;
      return `${host}#`;
    }

    function updateCliPromptDisplay(node, slot = null) {
      if (slot === 1 || slot === 2) {
        const promptEl = getSlotEl('cli-prompt-label', slot);
        if (promptEl && node) promptEl.textContent = getCliPromptString(node);
        return;
      }
      [1, 2].forEach(s => {
        const nid = (studioState.activeWindowSlots && studioState.activeWindowSlots[s]) || (s === 1 ? studioState.activeDeviceWindowNodeId : null);
        if (node && nid === node.id) {
          const promptEl = getSlotEl('cli-prompt-label', s);
          if (promptEl) promptEl.textContent = getCliPromptString(node);
        }
      });
    }

    function getCliVendorCatalog(vendor, mode) {
      if (vendor === 'cisco_ios') {
        const chips = [
          { label: '🔑 enable', cmd: 'enable' },
          { label: '📋 sh ip int br', cmd: 'show ip interface brief' },
          { label: '🔌 sh int status', cmd: 'show interfaces status' },
          { label: '🗂️ sh mac address-table', cmd: 'show mac address-table' },
          { label: '🏷️ sh vlan brief', cmd: 'show vlan brief' },
          { label: '⚙️ conf t', cmd: 'configure terminal' },
          { label: '📄 sh run', cmd: 'show running-config' }
        ];
        const cmds = mode === 'user'
          ? ['enable', 'show ip interface brief', 'show interfaces status', 'show mac address-table', 'show vlan brief', 'ping', 'traceroute', 'help', 'cls']
          : mode === 'priv'
          ? ['configure terminal', 'show ip interface brief', 'show interfaces status', 'show mac address-table', 'show vlan brief', 'show running-config', 'ping', 'traceroute', 'disable', 'cls']
          : mode === 'config'
          ? ['interface LAN1', 'interface LAN2', 'interface PON10G', 'hostname', 'exit', 'end', 'show ip interface brief']
          : ['shutdown', 'no shutdown', 'exit', 'end', 'show interfaces status'];
        return {
          badge: '🔵 CISCO IOS XE / SWITCH & OLT CLI STATE MACHINE (User ➔ Priv ➔ Config ➔ Interface)',
          badgeColor: '#38bdf8',
          banner: `Cisco IOS Software, C2960X / FPT Core Network OS, Version 15.2(4)E8\nCopyright (c) 1986-2026 by Cisco Systems, Inc. & FPT Telecom NetLab\nType "?" or "help" for context-sensitive help, Tab for autocomplete.\n`,
          chips,
          cmds
        };
      }
      if (vendor === 'mikrotik_ros') {
        const chips = [
          { label: '🔌 /interface print', cmd: '/interface print' },
          { label: '🌐 /ip address print', cmd: '/ip address print' },
          { label: '🛣️ /ip route print', cmd: '/ip route print' },
          { label: '📋 /ip arp print', cmd: '/ip arp print' },
          { label: '💻 /system resource print', cmd: '/system resource print' },
          { label: '📡 /ping 192.168.1.1', cmd: '/ping 192.168.1.1' }
        ];
        const cmds = [
          '/interface print', '/ip address print', '/ip route print', '/ip arp print',
          '/system resource print', '/ping 192.168.1.1', '/tool traceroute 8.8.8.8', 'help', 'clear'
        ];
        return {
          badge: '🟠 MIKROTIK ROUTEROS v7.14.2 (arm64 — RB760iGS hEX S Shell)',
          badgeColor: '#fb923c',
          banner: `  MMM      MMM       KKK                          TTTTTTTTTTT      KKK\n  MMMM    MMMM       KKK                          TTTTTTTTTTT      KKK\n  MMM MMMM MMM  III  KKK  KKK  RRRRRR     OOOOOO      TTT     III  KKK  KKK\n  MMM  MM  MMM  III  KKKKK     RRR  RRR  OOO  OOO     TTT     III  KKKKK\n  MMM      MMM  III  KKK KKK   RRRRRR    OOO  OOO     TTT     III  KKK KKK\n  MMM      MMM  III  KKK  KKK  RRR  RRR   OOOOOO      TTT     III  KKK  KKK\n\n  MikroTik RouterOS 7.14.2 (c) 1999-2026       https://www.mikrotik.com/\n  Press '?' for help, Tab for command completion.\n`,
          chips,
          cmds
        };
      }
      if (vendor === 'zte_pon') {
        const chips = [
          { label: '🔦 show pon optical-info', cmd: 'show pon optical-info' },
          { label: '🕸️ show easymesh topology', cmd: 'show easymesh topology' },
          { label: '📶 show wlan mlo-status', cmd: 'show wlan mlo-status' },
          { label: '📋 sh ip int br', cmd: 'show ip interface brief' },
          { label: '📡 ping 192.168.1.100', cmd: 'ping 192.168.1.100' },
          { label: '🚀 speedtest', cmd: 'speedtest' },
          { label: '⚙️ conf t', cmd: 'configure terminal' }
        ];
        const cmds = [
          'show pon optical-info', 'show easymesh topology', 'show wlan mlo-status',
          'show ip interface brief', 'show interfaces status', 'show mac address-table',
          'show running-config', 'set ssid ', 'configure terminal', 'interface ',
          'shutdown', 'no shutdown', 'ping 192.168.1.100', 'speedtest', 'arp -a', 'tracert 8.8.8.8', 'exit', 'end', 'clear'
        ];
        return {
          badge: '🟢 ZTE ZXROS / FPT TELECOM ONT & EASYMESH OS v9.0 (GPON / XGS-PON / Wi-Fi 7 MLO)',
          badgeColor: '#34d399',
          banner: `**********************************************************************\n*  ZTE ZXHN / FPT Telecom Multi-Service Optical & EasyMesh Gateway   *\n*  OS Version: ZXROS v9.0.2P4_FPT | IEEE 802.11be MLO & XGS-PON      *\n**********************************************************************\nType "?" for available commands, "show pon optical-info" to check fiber dBm.\n`,
          chips,
          cmds
        };
      }
      // Default: ktv_shell (Windows / KTV Client)
      const chips = [
        { label: '💻 ipconfig /all', cmd: 'ipconfig /all' },
        { label: '📡 ping 192.168.1.1', cmd: 'ping 192.168.1.1' },
        { label: '🚀 speedtest', cmd: 'speedtest' },
        { label: '📋 arp -a', cmd: 'arp -a' },
        { label: '🛣️ tracert 8.8.8.8', cmd: 'tracert 8.8.8.8' },
        { label: '📶 netsh wlan show interfaces', cmd: 'netsh wlan show interfaces' },
        { label: '🔍 nslookup fpt.vn', cmd: 'nslookup fpt.vn' }
      ];
      const cmds = [
        'ipconfig', 'ipconfig /all', 'ping 192.168.1.1', 'ping 192.168.1.100',
        'speedtest', 'arp -a', 'tracert 8.8.8.8', 'netsh wlan show interfaces',
        'nslookup fpt.vn', 'help', 'cls'
      ];
      return {
        badge: '🟣 FPT KTV DIAGNOSTIC SHELL (Windows 11 / Wi-Fi 7 Client Endpoint)',
        badgeColor: '#c084fc',
        banner: `Microsoft Windows [Version 10.0.22631.4169] — FPT Telecom KTV Field Diagnostic Console\n(c) FPT Telecom Corporation. Type "?" or "help" for diagnostic commands.\n`,
        chips,
        cmds
      };
    }

    function initCliForNode(node, forceReset = false, slot = 1) {
      if (!node) {
        const nid = (studioState.activeWindowSlots && studioState.activeWindowSlots[slot]) || studioState.activeDeviceWindowNodeId;
        node = studioState.nodes.find(n => n.id === nid) || studioState.nodes[0];
      }
      if (!node) return;
      const session = getOrInitCliSession(node);
      const vendor = getCliVendorProfile(node);
      session.vendor = vendor;

      const meta = getCliVendorCatalog(vendor, session.mode);
      const badgeEl = getSlotEl('cli-vendor-badge', slot);
      if (badgeEl) {
        badgeEl.textContent = `${meta.badge} • [${node.name} — ${node.ip}]`;
        badgeEl.style.color = meta.badgeColor;
      }

      const chipsBar = getSlotEl('cli-quick-chips-bar', slot);
      if (chipsBar) {
        chipsBar.innerHTML = meta.chips.map(c =>
          `<button class="subpage-chip-btn" onclick="execCliCmd('${c.cmd}', ${slot})">${c.label}</button>`
        ).join('');
      }

      const screen = getSlotEl('cisco-term-screen', slot);
      if (screen && (forceReset || screen.dataset.activeNodeId !== node.id)) {
        screen.textContent = meta.banner;
        screen.dataset.activeNodeId = node.id;
      }
      updateCliPromptDisplay(node, slot);
    }

    function clearCliScreen(slot = 1) {
      const nid = (studioState.activeWindowSlots && studioState.activeWindowSlots[slot]) || studioState.activeDeviceWindowNodeId;
      const node = studioState.nodes.find(n => n.id === nid) || studioState.nodes[0];
      initCliForNode(node, true, slot);
    }

    function buildCiscoShowIpRoute(node) {
      const ns = node.networkStack;
      const routes = (ns && ns.routingTable) || [];
      const lines = [
        'Codes: L - local, C - connected, S - static, R - RIP, M - mobile, B - BGP',
        '       D - EIGRP, EX - EIGRP external, O - OSPF, IA - OSPF inter area',
        '       N1 - OSPF NSSA external type 1, N2 - OSPF NSSA external type 2',
        '       E1 - OSPF external type 1, E2 - OSPF external type 2',
        '       i - IS-IS, su - IS-IS summary, L1 - IS-IS level-1, L2 - IS-IS level-2',
        '       ia - IS-IS inter area, * - candidate default, U - per-user static route',
        '       o - ODR, P - periodic downloaded static route, H - NHRP, l - LISP',
        '       a - application route',
        '       + - replicated route, % - next hop override',
        '',
        `Gateway of last resort is ${(ns && ns.defaultGateway) || 'not set'} to network 0.0.0.0`,
        ''
      ];
      if (routes.length === 0) {
        lines.push(`C    ${node.ip || '192.168.1.1'}/24 is directly connected, Vlan1`);
      } else {
        routes.forEach(r => {
          const typeCode = r.type === 'C' ? 'C   ' : (r.type === 'S' ? 'S   ' : 'O   ');
          if (r.type === 'C') {
            lines.push(`${typeCode} ${r.prefix}/${maskToCidr(r.mask || '255.255.255.0')} is directly connected, ${r.ifaceId || 'Vlan1'}`);
          } else {
            lines.push(`${typeCode} ${r.prefix}/${maskToCidr(r.mask || '255.255.255.0')} [1/0] via ${r.gateway}`);
          }
        });
      }
      return lines.join('\n');
    }

    function buildCiscoShowVlanBrief(node) {
      const ns = node.networkStack;
      const vlanDb = (ns && ns.vlanDb) || { 1: 'default', 35: 'FPT_INTERNET_PPPOE', 36: 'FPT_IPTV_MULTICAST' };
      const lines = [
        'VLAN Name                             Status    Ports',
        '---- -------------------------------- --------- -------------------------------'
      ];
      Object.keys(vlanDb).forEach(vid => {
        const vName = vlanDb[vid];
        const assignedPorts = [];
        if (ns && ns.interfaces) {
          Object.values(ns.interfaces).forEach(iface => {
            if (iface.mode === 'access' && iface.vlan === parseInt(vid, 10)) {
              assignedPorts.push(iface.short || iface.id);
            } else if (iface.mode === 'trunk' && iface.allowedVlans && iface.allowedVlans.includes(parseInt(vid, 10))) {
              assignedPorts.push((iface.short || iface.id) + '(T)');
            }
          });
        }
        lines.push(`${vid.padEnd(4)} ${(vName || 'VLAN' + vid).slice(0, 32).padEnd(32)} active    ${assignedPorts.join(', ') || 'unassigned'}`);
      });
      return lines.join('\n');
    }

    function buildCiscoShowPortSecurity(node, specificPort = null) {
      const ns = node.networkStack;
      const lines = [
        'Secure Port  MaxSecureAddr  CurrentAddr  SecurityViolation  Security Action',
        '-----------  -------------  -----------  -----------------  ---------------'
      ];
      if (ns && ns.interfaces) {
        Object.values(ns.interfaces).forEach(iface => {
          if (!specificPort || iface.id.toUpperCase() === specificPort.toUpperCase()) {
            const ps = iface.portSecurity || { enabled: false, maxMac: 1, stickyMacs: [], violation: 'shutdown', violationCount: 0 };
            const status = ps.enabled ? (ps.violated ? 'Shutdown(ERR)' : 'Enabled') : 'Disabled';
            lines.push(
              `${(iface.short || iface.id).padEnd(12)} ${String(ps.maxMac).padEnd(14)} ${String(ps.stickyMacs.length).padEnd(12)} ${String(ps.violationCount || 0).padEnd(18)} ${ps.violation.toUpperCase()}`
            );
          }
        });
      }
      return lines.join('\n');
    }

    function buildCiscoShowAccessLists(node) {
      const ns = node.networkStack;
      const acls = (ns && ns.accessControlLists) || {};
      const lines = [];
      if (Object.keys(acls).length === 0) {
        return 'No access lists configured on this device.\n';
      }
      Object.keys(acls).forEach(aclId => {
        lines.push(`Standard IP access list ${aclId}`);
        (acls[aclId] || []).forEach(r => {
          lines.push(`    ${r.seq || 10} ${r.action} ${r.proto || 'ip'} ${r.src} ${r.dst ? '➔ ' + r.dst : ''}`);
        });
      });
      return lines.join('\n');
    }

    function buildCiscoShowIpIntBrief(node) {
      const dev = FPT_CATALOG[node.catalogKey] || { ports: [] };
      const adminDown = node.portAdminDown || {};
      const lines = [
        'Interface              IP-Address      OK? Method Status                Protocol',
        '---------------------- --------------- --- ------ --------------------- --------'
      ];
      (dev.ports || []).forEach((p, idx) => {
        const link = studioState.links.find(l =>
          (l.srcId === node.id && l.srcPort === p.id) ||
          (l.tgtId === node.id && l.tgtPort === p.id)
        );
        const isDownAdmin = !!adminDown[p.id];
        const statusStr = isDownAdmin ? 'administratively down' : (link && node.power ? 'up' : 'down');
        const protoStr = (!isDownAdmin && link && node.power) ? 'up' : 'down';
        const ipCol = idx === 0 ? (node.ip || 'unassigned') : 'unassigned';
        lines.push(
          `${(p.id + ' (' + p.type.toUpperCase() + ')').padEnd(22)} ${ipCol.padEnd(15)} YES NVRAM  ${statusStr.padEnd(21)} ${protoStr}`
        );
      });
      lines.push(`${'Vlan1'.padEnd(22)} ${(node.ip || '192.168.1.1').padEnd(15)} YES NVRAM  ${(node.power ? 'up' : 'down').padEnd(21)} ${node.power ? 'up' : 'down'}`);
      return lines.join('\n');
    }

    function buildCiscoShowIntStatus(node) {
      const dev = FPT_CATALOG[node.catalogKey] || { ports: [] };
      const adminDown = node.portAdminDown || {};
      const lines = [
        'Port          Name               Status       Vlan       Duplex  Speed Type',
        '------------- ------------------ ------------ ---------- ------- ----- ------------'
      ];
      (dev.ports || []).forEach(p => {
        const link = studioState.links.find(l =>
          (l.srcId === node.id && l.srcPort === p.id) ||
          (l.tgtId === node.id && l.tgtPort === p.id)
        );
        const isDownAdmin = !!adminDown[p.id];
        const status = isDownAdmin ? 'disabled' : (link && node.power ? 'connected' : 'notconnect');
        const spd = link ? (link.speed >= 10000 ? 'a-10G' : link.speed >= 2500 ? 'a-2.5G' : 'a-1000') : 'auto';
        const vlan = p.type === 'pon' ? '35' : '1';
        lines.push(
          `${p.id.padEnd(13)} ${(p.short || p.name).slice(0, 18).padEnd(18)} ${status.padEnd(12)} ${vlan.padEnd(10)} a-full  ${spd.padEnd(5)} ${p.type.toUpperCase()}`
        );
      });
      return lines.join('\n');
    }

    function buildCiscoMacTable(node) {
      const lines = [
        '          Mac Address Table (Dynamic Learning from Live Topology)',
        '-------------------------------------------------------------------',
        'Vlan    Mac Address       Type        Ports      Neighbor Device',
        '----    -----------       --------    -----      ------------------'
      ];
      studioState.links.forEach(l => {
        if (l.srcId === node.id || l.tgtId === node.id) {
          const peerId = l.srcId === node.id ? l.tgtId : l.srcId;
          const localPort = l.srcId === node.id ? l.srcPort : l.tgtPort;
          const peer = studioState.nodes.find(n => n.id === peerId);
          if (peer) {
            const vlan = l.cableType === 'FIBER_SC' ? '35  ' : '1   ';
            lines.push(`${vlan}    ${(peer.mac || '00:11:22:33:44:55').padEnd(17)} DYNAMIC     ${localPort.padEnd(10)} ${peer.name} (${peer.ip})`);
          }
        }
      });
      if (lines.length === 4) {
        lines.push('   [No active neighbor MAC entries learned — connect cables first]');
      }
      return lines.join('\n');
    }

    function buildZtePonOpticalInfo(node) {
      const ontNode = (node.catalogKey === 'olt_cloud' || node.category === 'gateway')
        ? node
        : (studioState.nodes.find(n => n.category === 'gateway') || node);
      const pon = calculateOpticalPonMetrics();
      const hasOptical = pon.hasFiberLink && pon.state !== 'O1_LOS';
      const rxPower = pon.hasFiberLink
        ? `${pon.rxDbm.toFixed(2)} dBm (${pon.stateLabel} — Threshold -8.0 to -27.0 dBm)`
        : `-40.00 dBm (LOS — Loss of Optical Signal / Fiber Unplugged!)`;
      const txPower = pon.hasFiberLink ? '+2.45 dBm' : '-40.00 dBm (Laser Off)';
      const oltRx = pon.hasFiberLink ? `${(pon.rxDbm - 2.6).toFixed(2)} dBm` : '-40.00 dBm';
      const onuState = hasOptical
        ? `O5 (Operation State — Up & Authenticated)`
        : `O1 (Initial State — ${pon.hasFiberLink ? 'High Attenuation LOS < -30 dBm' : 'Fiber Unplugged'})`;

      return [
        `=== ZTE GPON / XGS-PON Optical Transceiver Diagnostics [${ontNode.name}] ===`,
        `  ONU Registration State  : ${onuState}`,
        `  Rx Optical Power (ONT)  : ${rxPower}`,
        `  Tx Optical Power (ONT)  : ${txPower}`,
        `  OLT Rx Power (Upstream) : ${oltRx}`,
        `  OLT Splitter Ratio      : ${pon.splitterRatio} (-${pon.splitterLossDb} dB)`,
        `  Fiber Distance & Fault  : ${pon.fiberLengthKm} km (-${pon.fiberDistLossDb} dB) | Connector/Bend Loss: ${pon.faultLossDb} dB`,
        `  Laser Bias Current      : ${pon.hasFiberLink ? '14.20 mA' : '0.00 mA'}`,
        `  Module Temperature      : 41.5 °C`,
        `  Supply Voltage          : ${ontNode.power ? '3.29 V' : '0.00 V'}`,
        `  Service VLAN / WAN      : VLAN 35 (PPPoE Routed) | SN: ZTEGC89A4F21`
      ].join('\n');
    }

    function buildEasyMeshTopologyOutput() {
      const controllers = studioState.nodes.filter(n => n.category === 'gateway');
      const agents = studioState.nodes.filter(n => n.category === 'ap');
      const clients = studioState.nodes.filter(n => n.category === 'client');
      const ssid = document.getElementById('cfg-wifi-ssid') ? document.getElementById('cfg-wifi-ssid').value : 'FPT_BE12000_WIFI7';

      const lines = [
        `=== IEEE 1905.1 EasyMesh R5 / Wi-Fi 7 MLO Topology Database ===`,
        `  Mesh Network SSID       : ${ssid}`,
        `  Controller Count        : ${controllers.length} | Agent Count: ${agents.length} | Active Stations: ${clients.length}`,
        `----------------------------------------------------------------------`
      ];
      controllers.forEach(c => {
        lines.push(`  [CONTROLLER] ${c.name} (${c.model}) | IP: ${c.ip} | MAC: ${c.mac} | Power: ${c.power ? 'ON' : 'OFF'}`);
      });
      agents.forEach(a => {
        const bhLink = studioState.links.find(l =>
          (l.srcId === a.id || l.tgtId === a.id) && l.cableType !== 'FIBER_SC'
        );
        const bhDesc = bhLink ? `${bhLink.cableType} (${bhLink.speed} Mbps)` : 'DISCONNECTED (Unplugged)';
        lines.push(`  ├── [AGENT]  ${a.name} (${a.model}) | IP: ${a.ip} | Backhaul: ${bhDesc}`);
      });
      clients.forEach(cl => {
        const clLink = studioState.links.find(l => l.srcId === cl.id || l.tgtId === cl.id);
        let clDesc = 'Unassociated';
        if (clLink) {
          const peerId = clLink.srcId === cl.id ? clLink.tgtId : clLink.srcId;
          const peer = studioState.nodes.find(n => n.id === peerId);
          if (clLink.cableType === 'WIFI_MESH' && peer) {
            const wf = calculateWifiLinkPhysics(peer, cl);
            clDesc = `${clLink.cableType} • RSSI: ${wf.rssiDbm} dBm (${wf.phyRateMbps} Mbps)`;
          } else {
            clDesc = `${clLink.cableType} (${clLink.speed} Mbps)`;
          }
        }
        lines.push(`      └── [STA] ${cl.name} | IP: ${cl.ip} | Link: ${clDesc}`);
      });
      return lines.join('\n');
    }

    function buildMikrotikOutput(cmdLower, node) {
      const dev = FPT_CATALOG[node.catalogKey] || { ports: [] };
      if (cmdLower.startsWith('/interface print') || cmdLower === 'interface print') {
        const lines = [
          'Flags: R - RUNNING; S - SLAVE',
          'Columns: NAME, TYPE, ACTUAL-MTU, L2MTU, MAC-ADDRESS',
          '#    NAME                  TYPE    ACTUAL-MTU  L2MTU  MAC-ADDRESS      '
        ];
        (dev.ports || []).forEach((p, idx) => {
          const hasLink = studioState.links.some(l =>
            (l.srcId === node.id && l.srcPort === p.id) ||
            (l.tgtId === node.id && l.tgtPort === p.id)
          );
          const flag = (hasLink && node.power) ? 'R ' : '  ';
          lines.push(`${String(idx).padEnd(2)} ${flag} ${p.name.padEnd(21)} ether         1500   1596  ${node.mac}`);
        });
        lines.push(`${String((dev.ports || []).length).padEnd(2)} R  bridge-lan            bridge        1500   1596  ${node.mac}`);
        return lines.join('\n');
      }
      if (cmdLower.startsWith('/ip address print') || cmdLower === 'ip address print') {
        return [
          'Flags: D - DYNAMIC',
          'Columns: ADDRESS, NETWORK, INTERFACE',
          '#   ADDRESS            NETWORK        INTERFACE ',
          `0   ${(node.ip || '192.168.88.1') + '/24'}   192.168.88.0   bridge-lan`,
          '1 D 100.64.35.182/32   10.0.0.1       pppoe-fpt-vlan35'
        ].join('\n');
      }
      if (cmdLower.startsWith('/ip route print') || cmdLower === 'ip route print') {
        return [
          'Flags: D - DYNAMIC; A - ACTIVE; c - CONNECT, s - STATIC',
          'Columns: DST-ADDRESS, GATEWAY, DISTANCE',
          '#     DST-ADDRESS       GATEWAY           DISTANCE',
          '0  As 0.0.0.0/0         pppoe-fpt-vlan35         1',
          `1  Ac 192.168.88.0/24   bridge-lan               0`,
          '2  Ac 192.168.1.0/24    ether1-wan               0'
        ].join('\n');
      }
      if (cmdLower.startsWith('/ip arp print') || cmdLower === 'ip arp print') {
        const lines = [
          'Flags: D - DYNAMIC; C - COMPLETE',
          'Columns: ADDRESS, MAC-ADDRESS, INTERFACE',
          '#    ADDRESS        MAC-ADDRESS        INTERFACE '
        ];
        studioState.nodes.forEach((n, idx) => {
          if (n.id !== node.id) {
            lines.push(`${String(idx).padEnd(2)} DC ${n.ip.padEnd(14)} ${n.mac}  bridge-lan`);
          }
        });
        return lines.join('\n');
      }
      if (cmdLower.startsWith('/system resource print') || cmdLower === 'system resource print') {
        return [
          '                   uptime: 4d12h38m19s',
          '                  version: 7.14.2 (stable)',
          '               build-time: 2026-05-14 11:24:00',
          '              free-memory: 214.5MiB',
          '             total-memory: 256.0MiB',
          '                      cpu: MIPS 1004Kc V2.15',
          '                cpu-count: 4',
          '            cpu-frequency: 880MHz',
          '                 cpu-load: 3%',
          '           free-hdd-space: 11.8MiB',
          '          total-hdd-space: 16.0MiB',
          '        architecture-name: mmips',
          '               board-name: hEX S (RB760iGS)',
          '                 platform: MikroTik'
        ].join('\n');
      }
      return null;
    }

    async function execCliCmd(rawCmd, slot = 1) {
      const cmd = (rawCmd || '').trim();
      if (!cmd) return;
      const nid = (studioState.activeWindowSlots && studioState.activeWindowSlots[slot]) || studioState.activeDeviceWindowNodeId;
      const node = studioState.nodes.find(n => n.id === nid) || studioState.nodes[0];
      const session = getOrInitCliSession(node);
      const vendor = getCliVendorProfile(node);

      if (session.history[session.history.length - 1] !== cmd) {
        session.history.push(cmd);
      }
      session.histIdx = session.history.length;

      const screen = getSlotEl('cisco-term-screen', slot);
      const promptStr = getCliPromptString(node);
      screen.textContent += `\n${promptStr} ${cmd}\n`;

      const cmdLower = cmd.toLowerCase();
      const parts = cmd.split(/\s+/);
      const action = parts[0].toLowerCase();

      try {
        // 1. Clear Screen
        if (action === 'cls' || action === 'clear') {
          clearCliScreen(slot);
          return;
        }

        // 2. Context-sensitive Help (? or help)
        if (action === '?' || action === 'help') {
          const meta = getCliVendorCatalog(vendor, session.mode);
          screen.textContent += `Available commands in current mode (${vendor.toUpperCase()} / ${session.mode.toUpperCase()}):\n`;
          meta.cmds.forEach(c => { screen.textContent += `  ${c}\n`; });
          screen.textContent += `Tip: Press [Tab] to autocomplete commands or [Up/Down] for command history.\n`;
          screen.scrollTop = screen.scrollHeight;
          return;
        }

        // 3. Hierarchical State Transitions (Cisco IOS & ZTE ZXROS)
        if (vendor === 'cisco_ios' || vendor === 'zte_pon') {
          if (cmdLower === 'enable' || cmdLower === 'en') {
            session.mode = 'priv';
            updateCliPromptDisplay(node);
            screen.scrollTop = screen.scrollHeight;
            return;
          }
          if (cmdLower === 'disable') {
            session.mode = 'user';
            session.activeIf = null;
            updateCliPromptDisplay(node);
            screen.scrollTop = screen.scrollHeight;
            return;
          }
          if (cmdLower === 'configure terminal' || cmdLower === 'conf t' || cmdLower === 'config t') {
            if (session.mode === 'user') {
              screen.textContent += `% Invalid input: Enter Privileged EXEC mode first ("enable").\n`;
            } else {
              session.mode = 'config';
              session.activeIf = null;
              screen.textContent += `Enter configuration commands, one per line. End with CNTL/Z or "end".\n`;
              updateCliPromptDisplay(node);
            }
            screen.scrollTop = screen.scrollHeight;
            return;
          }
          // Phase 3: VLAN Database Configuration (vlan <id>)
          if (action === 'vlan' && parts[1]) {
            if (session.mode !== 'config' && session.mode !== 'config-vlan') {
              screen.textContent += `% Enter global configuration mode ("conf t") first.\n`;
            } else {
              const vlanId = parseInt(parts[1], 10);
              if (isNaN(vlanId) || vlanId < 1 || vlanId > 4094) {
                screen.textContent += `% Invalid VLAN ID. Range is 1 to 4094.\n`;
              } else {
                session.mode = 'config-vlan';
                session.activeVlan = vlanId;
                if (!node.networkStack.vlanDb) {
                  node.networkStack.vlanDb = { 1: 'default', 35: 'FPT_INTERNET_PPPOE', 36: 'FPT_IPTV_MULTICAST' };
                }
                if (!node.networkStack.vlanDb[vlanId]) {
                  node.networkStack.vlanDb[vlanId] = `VLAN${vlanId}`;
                }
                screen.textContent += `% Created/Selected VLAN ${vlanId}\n`;
                updateCliPromptDisplay(node);
              }
            }
            screen.scrollTop = screen.scrollHeight;
            return;
          }

          // Phase 3: VLAN Naming (name <vlan_name> in config-vlan mode)
          if (action === 'name' && parts[1] && session.mode === 'config-vlan' && session.activeVlan) {
            const vName = parts.slice(1).join('_');
            if (!node.networkStack.vlanDb) node.networkStack.vlanDb = {};
            node.networkStack.vlanDb[session.activeVlan] = vName;
            screen.textContent += `% VLAN ${session.activeVlan} renamed to "${vName}"\n`;
            screen.scrollTop = screen.scrollHeight;
            return;
          }

          // Phase 3: Static Routing (ip route <prefix> <mask> <next-hop>)
          if (action === 'ip' && parts[1] === 'route' && parts[2] && parts[3] && parts[4]) {
            if (session.mode !== 'config') {
              screen.textContent += `% Enter global configuration mode ("conf t") first.\n`;
            } else {
              const prefix = parts[2];
              const mask = parts[3];
              const nextHop = parts[4];
              const ns = node.networkStack;
              if (ns && ns.routingTable) {
                ns.routingTable.push({
                  type: 'S',
                  prefix: prefix,
                  mask: mask,
                  gateway: nextHop,
                  ifaceId: 'WAN',
                  metric: 1
                });
                screen.textContent += `% Static route to ${prefix}/${mask} via ${nextHop} added.\n`;
              }
            }
            screen.scrollTop = screen.scrollHeight;
            return;
          }

          // Phase 3: Access Control List (access-list <id> {permit|deny} ...)
          if (action === 'access-list' && parts[1] && parts[2]) {
            if (session.mode !== 'config') {
              screen.textContent += `% Enter global configuration mode ("conf t") first.\n`;
            } else {
              const aclId = parts[1];
              const aclAction = parts[2].toLowerCase(); // permit or deny
              const proto = parts[3] ? parts[3].toLowerCase() : 'ip';
              const src = parts[4] || 'any';
              const dst = parts[5] || 'any';
              const ns = node.networkStack;
              if (ns) {
                if (!ns.accessControlLists) ns.accessControlLists = {};
                if (!ns.accessControlLists[aclId]) ns.accessControlLists[aclId] = [];
                const seq = (ns.accessControlLists[aclId].length + 1) * 10;
                ns.accessControlLists[aclId].push({
                  seq: seq,
                  action: aclAction,
                  proto: proto,
                  src: src,
                  dst: dst
                });
                screen.textContent += `% Access-list ${aclId} rule added: ${seq} ${aclAction} ${proto} ${src} ${dst}\n`;
              }
            }
            screen.scrollTop = screen.scrollHeight;
            return;
          }
          if ((action === 'interface' || action === 'int') && parts[1]) {
            if (session.mode !== 'config' && session.mode !== 'config-if') {
              screen.textContent += `% Enter global configuration mode ("conf t") before selecting an interface.\n`;
            } else {
              const reqPort = parts.slice(1).join('').toUpperCase();
              const dev = FPT_CATALOG[node.catalogKey] || { ports: [] };
              const matchedPort = (dev.ports || []).find(p =>
                p.id.toUpperCase() === reqPort || p.name.toUpperCase().includes(reqPort)
              ) || (dev.ports && dev.ports[0]);
              session.mode = 'config-if';
              session.activeIf = matchedPort ? matchedPort.id : parts[1].toUpperCase();
              screen.textContent += `% Configuring interface ${session.activeIf} on ${node.name}\n`;
              updateCliPromptDisplay(node);
            }
            screen.scrollTop = screen.scrollHeight;
            return;
          }
          if (cmdLower === 'shutdown' || cmdLower === 'shut') {
            if (session.mode === 'config-if' && session.activeIf) {
              node.portAdminDown = node.portAdminDown || {};
              node.portAdminDown[session.activeIf] = true;
              screen.textContent += `%LINK-5-CHANGED: Interface ${session.activeIf}, changed state to administratively down\n%LINEPROTO-5-UPDOWN: Line protocol on Interface ${session.activeIf}, changed state to down\n`;
              renderCanvas();
            } else {
              screen.textContent += `% Select an interface first: "conf t" -> "interface <port>".\n`;
            }
            screen.scrollTop = screen.scrollHeight;
            return;
          }
          if (cmdLower === 'no shutdown' || cmdLower === 'no shut') {
            if (session.mode === 'config-if' && session.activeIf) {
              node.portAdminDown = node.portAdminDown || {};
              node.portAdminDown[session.activeIf] = false;
              screen.textContent += `%LINK-3-UPDOWN: Interface ${session.activeIf}, changed state to up\n%LINEPROTO-5-UPDOWN: Line protocol on Interface ${session.activeIf}, changed state to up\n`;
              renderCanvas();
            } else {
              screen.textContent += `% Select an interface first: "conf t" -> "interface <port>".\n`;
            }
            screen.scrollTop = screen.scrollHeight;
            return;
          }
          // Phase 3: Switchport Mode & VLAN (switchport mode access / switchport mode trunk)
          if (cmdLower === 'switchport mode access' || (cmdLower.startsWith('switchport mode ') && parts[2] === 'access')) {
            if (session.mode === 'config-if' && session.activeIf && node.networkStack) {
              const iface = node.networkStack.interfaces[session.activeIf];
              if (iface) {
                iface.mode = 'access';
                screen.textContent += `% Interface ${session.activeIf} configured as switchport mode access.\n`;
              }
            } else {
              screen.textContent += `% Enter interface configuration mode ("conf t" -> "int <port>") first.\n`;
            }
            screen.scrollTop = screen.scrollHeight;
            return;
          }
          if (cmdLower === 'switchport mode trunk' || (cmdLower.startsWith('switchport mode ') && parts[2] === 'trunk')) {
            if (session.mode === 'config-if' && session.activeIf && node.networkStack) {
              const iface = node.networkStack.interfaces[session.activeIf];
              if (iface) {
                iface.mode = 'trunk';
                screen.textContent += `% Interface ${session.activeIf} configured as switchport mode trunk.\n`;
              }
            } else {
              screen.textContent += `% Enter interface configuration mode ("conf t" -> "int <port>") first.\n`;
            }
            screen.scrollTop = screen.scrollHeight;
            return;
          }

          if (cmdLower.startsWith('switchport access vlan ') && parts[3]) {
            if (session.mode === 'config-if' && session.activeIf && node.networkStack) {
              const iface = node.networkStack.interfaces[session.activeIf];
              const vid = parseInt(parts[3], 10);
              if (iface && !isNaN(vid)) {
                iface.mode = 'access';
                iface.vlan = vid;
                screen.textContent += `% Interface ${session.activeIf} assigned to VLAN ${vid}.\n`;
              }
            } else {
              screen.textContent += `% Enter interface configuration mode first.\n`;
            }
            screen.scrollTop = screen.scrollHeight;
            return;
          }

          // Phase 3: Port Security (switchport port-security ...)
          if (cmdLower.startsWith('switchport port-security')) {
            if (session.mode === 'config-if' && session.activeIf && node.networkStack) {
              const iface = node.networkStack.interfaces[session.activeIf];
              if (iface) {
                if (!iface.portSecurity) {
                  iface.portSecurity = { enabled: true, maxMac: 1, stickyMacs: [], violation: 'shutdown', violated: false };
                }
                if (parts.length === 2) {
                  iface.portSecurity.enabled = true;
                  screen.textContent += `% Port security enabled on ${session.activeIf}.\n`;
                } else if (parts[2] === 'maximum' && parts[3]) {
                  iface.portSecurity.maxMac = parseInt(parts[3], 10) || 1;
                  screen.textContent += `% Max secure MACs on ${session.activeIf} set to ${iface.portSecurity.maxMac}.\n`;
                } else if (cmdLower.startsWith('switchport port-security mac-address sticky') || (parts[2] === 'mac-address' && parts[3] === 'sticky')) {
                  if (parts[4]) {
                    iface.portSecurity.stickyMacs.push(parts[4].toUpperCase());
                  } else {
                    // Tự động gán MAC hiện tại của peer kết nối
                    const link = studioState.links.find(l => (l.srcId === node.id && l.srcPort === session.activeIf) || (l.tgtId === node.id && l.tgtPort === session.activeIf));
                    if (link) {
                      const peerId = link.srcId === node.id ? link.tgtId : link.srcId;
                      const peer = studioState.nodes.find(n => n.id === peerId);
                      if (peer && peer.mac) iface.portSecurity.stickyMacs.push(peer.mac);
                    }
                  }
                  screen.textContent += `% Sticky MAC configured on ${session.activeIf}: [${iface.portSecurity.stickyMacs.join(', ')}]\n`;
                } else if (parts[2] === 'violation' && parts[3]) {
                  iface.portSecurity.violation = parts[3].toLowerCase();
                  screen.textContent += `% Port security violation set to "${iface.portSecurity.violation}".\n`;
                }
              }
            } else {
              screen.textContent += `% Enter interface configuration mode first.\n`;
            }
            screen.scrollTop = screen.scrollHeight;
            return;
          }

          // Phase 3: IP Address Configuration on Interface (ip address <ip> <mask>)
          if (action === 'ip' && parts[1] === 'address' && parts[2] && parts[3]) {
            if (session.mode === 'config-if' && session.activeIf) {
              const newIp = parts[2];
              const newMask = parts[3];
              if (node.networkStack && node.networkStack.interfaces[session.activeIf]) {
                const iface = node.networkStack.interfaces[session.activeIf];
                iface.ip = newIp;
                iface.mask = newMask;
              }
              // Nếu là interface chính hoặc SVI, đồng bộ sang node.ip và Firmware DOM
              node.ip = newIp;
              if (!node.firmwareConfig) node.firmwareConfig = {};
              node.firmwareConfig.lanIp = newIp;
              node.firmwareConfig.subnetMask = newMask;
              if (typeof updateNodeNetworkStackFromConfig === 'function') {
                updateNodeNetworkStackFromConfig(node);
              }
              const cfgIpEl = document.getElementById('cfg-node-ip');
              if (cfgIpEl) cfgIpEl.value = newIp;
              const winIp = document.getElementById('win-dev-ip');
              if (winIp) winIp.textContent = `[${newIp}]`;
              const iframe = document.getElementById('device-sim-iframe');
              if (typeof injectLinkedStateIntoFirmwareDom === 'function') {
                injectLinkedStateIntoFirmwareDom(iframe, node);
              }
              renderCanvas();
              screen.textContent += `% IP address ${newIp} ${newMask} configured on ${session.activeIf}. Linked Firmware updated.\n`;
            } else {
              screen.textContent += `% Select an interface first ("int <port>") to assign an IP address.\n`;
            }
            screen.scrollTop = screen.scrollHeight;
            return;
          }
          if (action === 'hostname' && parts[1] && (session.mode === 'config' || session.mode === 'config-if')) {
            node.name = parts[1];
            document.getElementById('cfg-node-name').value = node.name;
            document.getElementById('win-dev-title').textContent = `${node.name} (${FPT_CATALOG[node.catalogKey].model})`;
            updateCliPromptDisplay(node);
            renderCanvas();
            screen.scrollTop = screen.scrollHeight;
            return;
          }
          if (cmdLower === 'exit') {
            if (session.mode === 'config-if') { session.mode = 'config'; session.activeIf = null; }
            else if (session.mode === 'config-vlan') { session.mode = 'config'; session.activeVlan = null; }
            else if (session.mode === 'config') { session.mode = 'priv'; }
            else if (session.mode === 'priv') { session.mode = 'user'; }
            updateCliPromptDisplay(node);
            screen.scrollTop = screen.scrollHeight;
            return;
          }
          if (cmdLower === 'end') {
            session.mode = 'priv';
            session.activeIf = null;
            screen.textContent += `%SYS-5-CONFIG_I: Configured from console by console\n`;
            updateCliPromptDisplay(node);
            screen.scrollTop = screen.scrollHeight;
            return;
          }

          // Cisco / ZTE Show Commands (Phase 3 Expanded)
          if (cmdLower === 'show ip route' || cmdLower === 'sh ip route') {
            screen.textContent += buildCiscoShowIpRoute(node) + '\n';
            screen.scrollTop = screen.scrollHeight;
            return;
          }
          if (cmdLower === 'show port-security' || cmdLower === 'sh port-security') {
            screen.textContent += buildCiscoShowPortSecurity(node) + '\n';
            screen.scrollTop = screen.scrollHeight;
            return;
          }
          if (cmdLower === 'show access-lists' || cmdLower === 'sh access-lists' || cmdLower === 'sh ip access-lists') {
            screen.textContent += buildCiscoShowAccessLists(node) + '\n';
            screen.scrollTop = screen.scrollHeight;
            return;
          }
          if (cmdLower === 'show ip interface brief' || cmdLower === 'sh ip int br') {
            screen.textContent += buildCiscoShowIpIntBrief(node) + '\n';
            screen.scrollTop = screen.scrollHeight;
            return;
          }
          if (cmdLower === 'show interfaces status' || cmdLower === 'sh int status') {
            screen.textContent += buildCiscoShowIntStatus(node) + '\n';
            screen.scrollTop = screen.scrollHeight;
            return;
          }
          if (cmdLower === 'show mac address-table' || cmdLower === 'sh mac address-table') {
            screen.textContent += buildCiscoMacTable(node) + '\n';
            screen.scrollTop = screen.scrollHeight;
            return;
          }
          if (cmdLower === 'show vlan brief' || cmdLower === 'sh vlan br' || cmdLower === 'sh vlan brief') {
            screen.textContent += buildCiscoShowVlanBrief(node) + '\n';
            screen.scrollTop = screen.scrollHeight;
            return;
          }
          if (cmdLower === 'show running-config' || cmdLower === 'sh run') {
            const ssid = document.getElementById('cfg-wifi-ssid') ? document.getElementById('cfg-wifi-ssid').value : 'FPT_BE12000_WIFI7';
            screen.textContent += [
              'Building configuration...',
              'Current configuration : 1482 bytes',
              '!',
              'version 15.2',
              `hostname ${node.name}`,
              '!',
              'vlan 35',
              ' name FPT_INTERNET_PPPOE',
              '!',
              `interface Vlan1`,
              ` ip address ${node.ip} 255.255.255.0`,
              ' no shutdown',
              '!',
              `wlan easymesh-profile 1`,
              ` ssid ${ssid}`,
              ` mlo-mode 2.4G+5G+6G-320MHz`,
              '!',
              'end'
            ].join('\n') + '\n';
            screen.scrollTop = screen.scrollHeight;
            return;
          }
        }

        // 4. ZTE PON & EasyMesh Specific Commands
        if (cmdLower === 'show pon optical-info' || cmdLower === 'show pon power') {
          screen.textContent += buildZtePonOpticalInfo(node) + '\n';
          screen.scrollTop = screen.scrollHeight;
          return;
        }
        if (cmdLower === 'show easymesh topology' || cmdLower === 'show mesh') {
          screen.textContent += buildEasyMeshTopologyOutput() + '\n';
          screen.scrollTop = screen.scrollHeight;
          return;
        }
        if (cmdLower === 'show wlan mlo-status') {
          const ssid = document.getElementById('cfg-wifi-ssid') ? document.getElementById('cfg-wifi-ssid').value : 'FPT_BE12000_WIFI7';
          screen.textContent += [
            `=== IEEE 802.11be Wi-Fi 7 Multi-Link Operation (MLO) Status ===`,
            `  Primary SSID           : ${ssid}`,
            `  Band 1 (2.4 GHz)       : Ch 6 (40 MHz)  | 4096-QAM | Tx Power: 20 dBm`,
            `  Band 2 (5 GHz High)    : Ch 149 (160 MHz)| 4096-QAM | DFS Ready`,
            `  Band 3 (6 GHz Ultra)   : Ch 37 (320 MHz) | MLO Aggregated PHY: 2882 Mbps`,
            `  WPA3-SAE Security      : Enabled (PMF Required)`
          ].join('\n') + '\n';
          screen.scrollTop = screen.scrollHeight;
          return;
        }
        if (cmdLower.startsWith('set ssid ') && parts[2]) {
          const newSsid = parts.slice(2).join('_');
          const ssidInput = document.getElementById('cfg-wifi-ssid');
          if (ssidInput) ssidInput.value = newSsid;
          await saveWifiConfigToBackend();
          screen.textContent += `[OK] Updated EasyMesh Controller & Agent SSID to "${newSsid}".\n`;
          screen.scrollTop = screen.scrollHeight;
          return;
        }

        // 5. MikroTik RouterOS Commands (Phase 3 Dynamic Configuration)
        if (vendor === 'mikrotik_ros' || cmdLower.startsWith('/')) {
          if (cmdLower.startsWith('/ip address add') || cmdLower.startsWith('ip address add')) {
            const addrMatch = cmd.match(/address=([0-9.]+)\/([0-9]+)/i);
            if (addrMatch) {
              const newIp = addrMatch[1];
              const cidr = parseInt(addrMatch[2], 10);
              const mask = typeof cidrToMask === 'function' ? cidrToMask(cidr) : '255.255.255.0';
              node.ip = newIp;
              if (node.networkStack) {
                node.networkStack.routingTable.unshift({
                  type: 'C',
                  prefix: calculateNetworkAddress(newIp, mask),
                  mask: mask,
                  gateway: '0.0.0.0',
                  ifaceId: 'ether1',
                  metric: 0
                });
              }
              screen.textContent += `[admin@MikroTik] > Added address ${newIp}/${cidr} to interface bridge-lan\n`;
              renderCanvas();
              screen.scrollTop = screen.scrollHeight;
              return;
            }
          }
          if (cmdLower.startsWith('/ip route add') || cmdLower.startsWith('ip route add')) {
            const dstMatch = cmd.match(/dst-address=([0-9.]+)\/([0-9]+)/i);
            const gwMatch = cmd.match(/gateway=([0-9.]+)/i);
            if (dstMatch && gwMatch) {
              const prefix = dstMatch[1];
              const cidr = parseInt(dstMatch[2], 10);
              const mask = typeof cidrToMask === 'function' ? cidrToMask(cidr) : '255.255.255.0';
              const gw = gwMatch[1];
              if (node.networkStack) {
                node.networkStack.routingTable.push({
                  type: 'S',
                  prefix: prefix,
                  mask: mask,
                  gateway: gw,
                  ifaceId: 'ether1',
                  metric: 1
                });
              }
              screen.textContent += `[admin@MikroTik] > Added static route to ${prefix}/${cidr} via ${gw}\n`;
              screen.scrollTop = screen.scrollHeight;
              return;
            }
          }
          const rosOut = buildMikrotikOutput(cmdLower, node);
          if (rosOut) {
            screen.textContent += rosOut + '\n';
            screen.scrollTop = screen.scrollHeight;
            return;
          }
        }

        // 6. Cross-Vendor Active Diagnostics (ping, speedtest, arp, tracert, ipconfig, netsh, nslookup)
        if (action === 'ping' || action === '/ping') {
          const targetIp = parts[1] || '192.168.1.1';
          const res = await fetch('/api/mesh-lab/ping', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ target: targetIp })
          });
          screen.textContent += (await res.json()).output + '\n';
        } else if (action === 'speedtest') {
          const res = await fetch('/api/mesh-lab/speedtest', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: '{}'
          });
          screen.textContent += (await res.json()).output + '\n';
        } else if (action === 'arp') {
          const res = await fetch('/api/mesh-lab/arp', { method: 'POST' });
          screen.textContent += (await res.json()).output + '\n';
        } else if (action === 'tracert' || action === 'traceroute' || cmdLower.startsWith('/tool traceroute')) {
          const targetIp = parts[parts.length - 1] && !parts[parts.length - 1].includes('traceroute') ? parts[parts.length - 1] : '8.8.8.8';
          const res = await fetch('/api/mesh-lab/traceroute', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ target: targetIp })
          });
          screen.textContent += (await res.json()).output + '\n';
        } else if (action === 'ipconfig') {
          const isAll = cmdLower.includes('/all');
          screen.textContent += [
            `Windows IP Configuration (${node ? node.name : 'KTV_Workstation'})`,
            `   Host Name . . . . . . . . . . . . : ${node ? node.name : 'KTV-FPT-PC'}`,
            `   Physical Address. . . . . . . . . : ${node ? node.mac : 'BC:24:11:88:0A:99'}`,
            `   DHCP Enabled. . . . . . . . . . . : Yes`,
            `   IPv4 Address. . . . . . . . . . . : ${node ? node.ip : '192.168.1.150'}(Preferred)`,
            `   Subnet Mask . . . . . . . . . . . : 255.255.255.0`,
            `   Default Gateway . . . . . . . . . : 192.168.1.1`,
            isAll ? `   DNS Servers . . . . . . . . . . . : 210.245.24.20 (FPT Primary DNS)\n                                       8.8.8.8 (Google Public DNS)` : ''
          ].filter(Boolean).join('\n') + '\n';
        } else if (cmdLower.startsWith('netsh wlan')) {
          const ssid = document.getElementById('cfg-wifi-ssid') ? document.getElementById('cfg-wifi-ssid').value : 'FPT_BE12000_WIFI7';
          screen.textContent += [
            `There is 1 interface on the system:`,
            `    Name                   : Wi-Fi 7 MLO Adapter (Intel BE200)`,
            `    State                  : connected`,
            `    SSID                   : ${ssid}`,
            `    Radio type             : 802.11be (Wi-Fi 7 Multi-Link Operation)`,
            `    Authentication         : WPA3-Personal (SAE)`,
            `    Receive rate (Mbps)    : 2402`,
            `    Transmit rate (Mbps)   : 2402`,
            `    Signal                 : 96% (-44 dBm)`
          ].join('\n') + '\n';
        } else if (action === 'nslookup') {
          const domain = parts[1] || 'fpt.vn';
          screen.textContent += [
            `Server:  dns.fpt.vn`,
            `Address:  210.245.24.20`,
            ``,
            `Non-authoritative answer:`,
            `Name:    ${domain}`,
            `Addresses:  2405:4802:1d02::1`,
            `          210.245.31.130`
          ].join('\n') + '\n';
        } else {
          screen.textContent += `% Unknown or incomplete command "${cmd}". Type "?" or "help" for available commands in ${vendor.toUpperCase()}.\n`;
        }
      } catch (e) {
        screen.textContent += `Error: ${e.message}\n`;
      }
      screen.scrollTop = screen.scrollHeight;
      fetchMissions();
    }

    function autocompleteCliInput(inputEl, slot = 1) {
      const val = inputEl.value;
      if (!val.trim()) return;
      const nid = (studioState.activeWindowSlots && studioState.activeWindowSlots[slot]) || studioState.activeDeviceWindowNodeId;
      const node = studioState.nodes.find(n => n.id === nid) || studioState.nodes[0];
      const session = getOrInitCliSession(node);
      const meta = getCliVendorCatalog(session.vendor, session.mode);
      const matches = meta.cmds.filter(c => c.toLowerCase().startsWith(val.trim().toLowerCase()));
      if (matches.length === 1) {
        inputEl.value = matches[0];
      } else if (matches.length > 1) {
        const screen = getSlotEl('cisco-term-screen', slot);
        if (screen) {
          screen.textContent += `\n${getCliPromptString(node)} ${val}\n  ${matches.join('    ')}\n`;
          screen.scrollTop = screen.scrollHeight;
        }
      }
    }

    function handleCliKey(e, slot = 1) {
      const nid = (studioState.activeWindowSlots && studioState.activeWindowSlots[slot]) || studioState.activeDeviceWindowNodeId;
      const node = studioState.nodes.find(n => n.id === nid) || studioState.nodes[0];
      const session = getOrInitCliSession(node);

      if (e.key === 'Enter' && e.target.value) {
        execCliCmd(e.target.value, slot);
        e.target.value = '';
      } else if (e.key === 'Tab') {
        e.preventDefault();
        autocompleteCliInput(e.target, slot);
      } else if (e.key === 'ArrowUp') {
        e.preventDefault();
        if (session.history.length > 0 && session.histIdx > 0) {
          session.histIdx--;
          e.target.value = session.history[session.histIdx] || '';
        }
      } else if (e.key === 'ArrowDown') {
        e.preventDefault();
        if (session.histIdx < session.history.length - 1) {
          session.histIdx++;
          e.target.value = session.history[session.histIdx] || '';
        } else {
          session.histIdx = session.history.length;
          e.target.value = '';
        }
      }
    }

