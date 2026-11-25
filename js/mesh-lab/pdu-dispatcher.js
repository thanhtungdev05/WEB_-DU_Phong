    // 7. PHASE 2: DYNAMIC PDU DISPATCHER (OSI 7-LAYER STATEFUL NETWORK ENGINE)
    let arpResolvedCache = new Set();
    let activeSimPlayback = {
      pduId: null,
      hops: [],
      currentHopIdx: 0,
      autoPlayTimer: null
    };
    let activeInspectedPdu = { pduId: null, hopIdx: 0, tab: 'osi' };

    function handlePduToolNodeClick(nodeId) {
      if (!studioState.pduStartNodeId) {
        studioState.pduStartNodeId = nodeId;
        const src = studioState.nodes.find(n => n.id === nodeId);
        showToast(`✉️ Nguồn: ${src ? src.name : nodeId} ➔ Click thiết bị đích để bắn gói tin ARP/ICMP!`);
        return;
      }
      if (studioState.pduStartNodeId === nodeId) {
        studioState.pduStartNodeId = null;
        return;
      }
      const srcId = studioState.pduStartNodeId;
      studioState.pduStartNodeId = null;
      setStudioTool('select');
      executeSimplePdu(srcId, nodeId);
    }

    // ── L3 ROUTE & SUBNET EVALUATION (PHASE 2) ─────────────────────────────
    function evaluateL3PacketRoute(srcNode, dstIp) {
      if (!srcNode) return { error: 'NO_SRC', message: 'Nguồn không tồn tại.' };
      const ns = srcNode.networkStack;
      const srcIp = (ns && ns.interfaces && Object.values(ns.interfaces).find(i => i.ip)?.ip) || srcNode.ip;
      const srcMask = (srcNode.firmwareConfig && srcNode.firmwareConfig.subnetMask) || '255.255.255.0';

      // 1. Kiểm tra xem IP đích có nằm trực tiếp cùng mạng con với bất kỳ interface nào của srcNode không
      let isDirect = false;
      let directIfaceId = null;
      if (ns && ns.interfaces) {
        Object.values(ns.interfaces).forEach(iface => {
          if (iface.ip && typeof isSameSubnet === 'function' && isSameSubnet(iface.ip, dstIp, iface.mask || srcMask)) {
            isDirect = true;
            directIfaceId = iface.id;
          }
        });
      }
      if (!isDirect && typeof isSameSubnet === 'function' && isSameSubnet(srcIp, dstIp, srcMask)) {
        isDirect = true;
      }

      if (isDirect) {
        return { isDirect: true, nextHopIp: dstIp, ifaceId: directIfaceId || 'LAN1' };
      }

      // 2. Nếu khác mạng con, tra bảng Routing Table (FIB) theo chuẩn Longest Prefix Match (LPM)
      if (ns && ns.routingTable && ns.routingTable.length > 0) {
        let bestMatch = null;
        let bestCidr = -1;
        ns.routingTable.forEach(r => {
          if (typeof ipToLong === 'function' && typeof maskToCidr === 'function') {
            const dstNum = ipToLong(dstIp);
            const netNum = ipToLong(r.prefix);
            const maskNum = ipToLong(r.mask);
            if ((dstNum & maskNum) === (netNum & maskNum)) {
              const cidr = maskToCidr(r.mask);
              if (cidr > bestCidr) {
                bestCidr = cidr;
                bestMatch = r;
              }
            }
          }
        });

        if (bestMatch) {
          const nextHop = (bestMatch.gateway && bestMatch.gateway !== '0.0.0.0') ? bestMatch.gateway : dstIp;
          return { isDirect: false, nextHopIp: nextHop, ifaceId: bestMatch.ifaceId, route: bestMatch };
        }
      }

      // 3. Tra Default Gateway nếu có cấu hình
      const gw = (ns && ns.defaultGateway) || (srcNode.linkedReceivedState && srcNode.linkedReceivedState.gatewayIp);
      if (gw && gw !== '0.0.0.0') {
        return { isDirect: false, nextHopIp: gw, ifaceId: 'LAN1' };
      }

      // 4. Nếu không có route và không có gateway -> Lỗi L3
      return {
        error: 'NO_ROUTE',
        message: `❌ [ICMP Destination Net Unreachable]: ${srcNode.name} (${srcIp}) và thiết bị đích (${dstIp}) nằm ở 2 mạng con khác nhau, nhưng ${srcNode.name} chưa được cấu hình Default Gateway hoặc Routing Table!`
      };
    }

    // ── ACL FILTER MATCHING (PHASE 2) ──────────────────────────────────────
    function checkRouterAclFilter(routerNode, proto, srcIp, dstIp) {
      if (!routerNode || !routerNode.networkStack) return { allowed: true };
      const acls = routerNode.networkStack.accessControlLists || {};
      for (const aclId of Object.keys(acls)) {
        const rules = acls[aclId] || [];
        for (const rule of rules) {
          if (rule.proto === 'ip' || rule.proto === proto.toLowerCase()) {
            if (rule.action === 'deny') {
              return {
                allowed: false,
                reason: `⛔ [ACL Filter Denied]: Gói tin ${proto} từ ${srcIp} tới ${dstIp} bị chặn bởi Access-List [${aclId}] trên ${routerNode.name}!`
              };
            }
          }
        }
      }
      return { allowed: true };
    }

    // ── DYNAMIC L2/L3 TOPOLOGY HOP EVALUATOR ────────────────────────────────
    function findTopologyPathHops(startId, goalId) {
      const startNode = studioState.nodes.find(n => n.id === startId);
      const goalNode = studioState.nodes.find(n => n.id === goalId);
      if (!startNode || !goalNode || !startNode.power || !goalNode.power) return [];

      // Kiểm tra định tuyến L3 tại Host nguồn
      const routeCheck = evaluateL3PacketRoute(startNode, goalNode.ip);
      if (routeCheck.error) {
        return [];
      }

      const visited = new Set([startId]);
      const queue = [startId];
      const parentMap = new Map();

      while (queue.length > 0) {
        const curr = queue.shift();
        if (curr === goalId) {
          const hops = [];
          let stepNodeId = goalId;
          while (stepNodeId !== startId) {
            const info = parentMap.get(stepNodeId);
            const fromNode = studioState.nodes.find(n => n.id === info.fromId);
            const toNode = studioState.nodes.find(n => n.id === stepNodeId);
            const l = info.link;
            const outPort = l.srcId === info.fromId ? l.srcPort : l.tgtPort;
            const inPort = l.srcId === info.fromId ? l.tgtPort : l.srcPort;
            hops.unshift({
              fromNode,
              toNode,
              link: l,
              outPort,
              inPort
            });
            stepNodeId = info.fromId;
          }
          return hops;
        }

        studioState.links.forEach(l => {
          const nextId = l.srcId === curr ? l.tgtId : (l.tgtId === curr ? l.srcId : null);
          if (nextId && !visited.has(nextId)) {
            const currNode = studioState.nodes.find(n => n.id === curr);
            const nextNode = studioState.nodes.find(n => n.id === nextId);
            if (!currNode || !nextNode || !nextNode.power) return;

            const outPort = l.srcId === curr ? l.srcPort : l.tgtPort;
            const inPort = l.srcId === curr ? l.tgtPort : l.srcPort;

            // 1. Kiểm tra cổng administratively down hoặc port security vi phạm
            if ((currNode.portAdminDown && currNode.portAdminDown[outPort]) ||
                (nextNode.portAdminDown && nextNode.portAdminDown[inPort])) {
              return;
            }
            if (currNode.networkStack && currNode.networkStack.interfaces && currNode.networkStack.interfaces[outPort]) {
              const iface = currNode.networkStack.interfaces[outPort];
              if (!iface.adminUp || (iface.portSecurity && iface.portSecurity.violated)) return;
            }

            // 2. Kiểm tra cô lập VLAN 802.1Q trên Switch
            if (currNode.networkStack && currNode.networkStack.isSwitch) {
              const inIface = currNode.networkStack.interfaces[inPort];
              const outIface = currNode.networkStack.interfaces[outPort];
              if (inIface && outIface && inIface.mode === 'access' && outIface.mode === 'access' && inIface.vlan !== outIface.vlan) {
                return; // Khác VLAN trên Access port -> Bị cô lập
              }
            }

            // 3. Kiểm tra ns-3 Physical Layer (Optical LOS hoặc Wi-Fi Dead Zone)
            if (l.cableType === 'FIBER_SC') {
              const pon = calculateOpticalPonMetrics();
              if (pon.state === 'O1_LOS') return;
            } else if (l.cableType === 'WIFI_MESH') {
              const wf = calculateWifiLinkPhysics(currNode, nextNode);
              if (wf.qualityState === 'down') return;
            }

            visited.add(nextId);
            parentMap.set(nextId, { fromId: curr, link: l });
            queue.push(nextId);
          }
        });
      }
      return [];
    }

    function checkTopologyPathReachable(startId, goalId) {
      return findTopologyPathHops(startId, goalId).length > 0;
    }

    // ── BUILD PDU HOP EVENTS (PHASE 2 ENGINE) ──────────────────────────────
    function buildPduHopEvents(srcId, tgtId) {
      const srcNode = studioState.nodes.find(n => n.id === srcId);
      const tgtNode = studioState.nodes.find(n => n.id === tgtId);
      const events = [];

      if (!srcNode || !tgtNode) return events;

      // 1. Kiểm tra nguồn điện thiết bị
      if (!srcNode.power) {
        events.push({
          protocol: 'DROP',
          label: '✕ POWER OFF',
          fromNode: srcNode,
          toNode: tgtNode,
          outPort: 'NONE', inPort: 'NONE', speed: 0, cableType: 'NONE', ttl: 0,
          srcIp: srcNode.ip, dstIp: tgtNode.ip, srcMac: srcNode.mac, dstMac: '00:00:00:00:00:00',
          vlan: 'None', success: false,
          explanation: `❌ Gói tin bị hủy: Thiết bị nguồn ${srcNode.name} đang tắt nguồn 12V DC!`
        });
        return events;
      }
      if (!tgtNode.power) {
        events.push({
          protocol: 'DROP',
          label: '✕ POWER OFF',
          fromNode: srcNode,
          toNode: tgtNode,
          outPort: 'NONE', inPort: 'NONE', speed: 0, cableType: 'NONE', ttl: 0,
          srcIp: srcNode.ip, dstIp: tgtNode.ip, srcMac: srcNode.mac, dstMac: '00:00:00:00:00:00',
          vlan: 'None', success: false,
          explanation: `❌ Gói tin bị hủy: Thiết bị đích ${tgtNode.name} đang tắt nguồn 12V DC!`
        });
        return events;
      }

      // 2. Kiểm tra cấu hình IP & Subnetting L3 tại nguồn
      const routeCheck = evaluateL3PacketRoute(srcNode, tgtNode.ip);
      if (routeCheck.error) {
        events.push({
          protocol: 'DROP',
          label: '✕ NO ROUTE',
          fromNode: srcNode,
          toNode: tgtNode,
          outPort: 'NONE', inPort: 'NONE', speed: 0, cableType: 'NONE', ttl: 0,
          srcIp: srcNode.ip, dstIp: tgtNode.ip, srcMac: srcNode.mac, dstMac: '00:00:00:00:00:00',
          vlan: 'None', success: false,
          explanation: routeCheck.message
        });
        return events;
      }

      // 3. Tìm chặng vật lý và kiểm tra từng thiết bị trung gian
      const pathHops = findTopologyPathHops(srcId, tgtId);
      if (pathHops.length === 0) {
        events.push({
          protocol: 'DROP',
          label: '✕ DROP (L1/L2)',
          fromNode: srcNode,
          toNode: tgtNode,
          outPort: 'NONE', inPort: 'NONE', speed: 0, cableType: 'NONE', ttl: 64,
          srcIp: srcNode.ip, dstIp: tgtNode.ip, srcMac: srcNode.mac, dstMac: '00:00:00:00:00:00',
          vlan: 'None', success: false,
          explanation: `❌ Gói tin bị hủy (DROP) tại ${srcNode.name}: Không tìm thấy đường truyền hợp lệ tới ${tgtNode.name} (Cáp đứt, khác VLAN, vi phạm Port Security hoặc suy hao quang vượt ngưỡng).`
        });
        return events;
      }

      // 4. Kiểm tra Access-List trên các Router trung gian
      for (const h of pathHops) {
        if (h.fromNode.networkStack && h.fromNode.networkStack.isRouter) {
          const aclCheck = checkRouterAclFilter(h.fromNode, 'ICMP', srcNode.ip, tgtNode.ip);
          if (!aclCheck.allowed) {
            events.push({
              protocol: 'DROP',
              label: '⛔ ACL DROP',
              fromNode: h.fromNode,
              toNode: h.toNode,
              outPort: h.outPort, inPort: h.inPort, speed: h.link.speed, cableType: h.link.cableType, ttl: 64,
              srcIp: srcNode.ip, dstIp: tgtNode.ip, srcMac: h.fromNode.mac, dstMac: h.toNode.mac,
              vlan: 'None', success: false,
              explanation: aclCheck.reason
            });
            return events;
          }
        }
      }

      const arpKey = `${srcId}->${tgtId}`;
      const needsArp = !arpResolvedCache.has(arpKey);
      const firstHop = pathHops[0];

      // 5. Học MAC trên Switch & Gửi ARP Request/Reply (Chuẩn Cisco Packet Tracer)
      pathHops.forEach(h => {
        if (h.toNode.networkStack && h.toNode.networkStack.isSwitch && typeof learnSourceMacOnSwitch === 'function') {
          learnSourceMacOnSwitch(h.toNode, h.inPort, h.fromNode.mac, 1);
        }
      });

      if (needsArp) {
        events.push({
          protocol: 'ARP',
          label: 'ARP Req',
          fromNode: firstHop.fromNode,
          toNode: firstHop.toNode,
          outPort: firstHop.outPort,
          inPort: firstHop.inPort,
          speed: firstHop.link.speed,
          cableType: firstHop.link.cableType,
          ttl: 1,
          srcIp: srcNode.ip,
          dstIp: tgtNode.ip,
          srcMac: firstHop.fromNode.mac,
          dstMac: 'FF:FF:FF:FF:FF:FF (Broadcast)',
          vlan: '1',
          success: true,
          explanation: `📢 [ARP Request Broadcast]: ${firstHop.fromNode.name} chưa biết địa chỉ MAC của ${tgtNode.ip} nên phát quảng bá khung ARP (Dst MAC = FF:FF:FF:FF:FF:FF) ra cổng ${firstHop.outPort}.`
        });

        events.push({
          protocol: 'ARP',
          label: 'ARP Reply',
          fromNode: firstHop.toNode,
          toNode: firstHop.fromNode,
          outPort: firstHop.inPort,
          inPort: firstHop.outPort,
          speed: firstHop.link.speed,
          cableType: firstHop.link.cableType,
          ttl: 1,
          srcIp: firstHop.toNode.ip,
          dstIp: srcNode.ip,
          srcMac: firstHop.toNode.mac,
          dstMac: firstHop.fromNode.mac,
          vlan: '1',
          success: true,
          explanation: `✅ [ARP Reply Unicast]: ${firstHop.toNode.name} phản hồi địa chỉ MAC (${firstHop.toNode.mac}) về cho ${firstHop.fromNode.name}. Bảng ARP Cache đã được cập nhật!`
        });
        arpResolvedCache.add(arpKey);
      }

      // 6. Forward ICMP Echo Request Hops
      pathHops.forEach((h, idx) => {
        const isPonLink = h.link.cableType === 'FIBER_SC';
        const isWifiLink = h.link.cableType === 'WIFI_MESH';
        const isNatHop = isPonLink && (h.fromNode.category === 'gateway');
        const hopTtl = 64 - idx;

        events.push({
          protocol: 'ICMP',
          label: `ICMP Req (${idx + 1}/${pathHops.length})`,
          fromNode: h.fromNode,
          toNode: h.toNode,
          outPort: h.outPort,
          inPort: h.inPort,
          speed: h.link.speed,
          cableType: h.link.cableType,
          ttl: hopTtl,
          srcIp: isNatHop ? `100.64.25.108 (NAT từ ${srcNode.ip})` : srcNode.ip,
          dstIp: tgtNode.ip,
          srcMac: h.fromNode.mac,
          dstMac: h.toNode.mac,
          vlan: isPonLink ? '35 (FPT PPPoE/IPoE)' : (isWifiLink ? 'WLAN MLO' : '1 (Untagged)'),
          success: true,
          explanation: isNatHop
            ? `🌐 [Chặng ${idx + 1} — NAT & Đóng gói Quang PON VLAN 35]: Gateway ${h.fromNode.name} thực hiện NAT Masquerade đổi IP nguồn ${srcNode.ip} ➔ WAN IP, gắn nhãn 802.1Q VLAN 35 và phát tín hiệu quang qua cổng ${h.outPort} tới ${h.toNode.name}.`
            : `➡️ [Chặng ${idx + 1} — ICMP Echo Request]: Gói tin đi từ ${h.fromNode.name} [cổng ${h.outPort}] sang ${h.toNode.name} [cổng ${h.inPort}] với tốc độ ${h.link.speed >= 1000 ? (h.link.speed/1000)+' Gbps' : h.link.speed+' Mbps'} (TTL=${hopTtl}).`
        });
      });

      // 7. Return ICMP Echo Reply Hops
      const revHops = [...pathHops].reverse();
      revHops.forEach((h, idx) => {
        const hopTtl = 64 - idx;
        events.push({
          protocol: 'ICMP_REPLY',
          label: `ICMP Reply (${idx + 1}/${revHops.length})`,
          fromNode: h.toNode,
          toNode: h.fromNode,
          outPort: h.inPort,
          inPort: h.outPort,
          speed: h.link.speed,
          cableType: h.link.cableType,
          ttl: hopTtl,
          srcIp: tgtNode.ip,
          dstIp: srcNode.ip,
          srcMac: h.toNode.mac,
          dstMac: h.fromNode.mac,
          vlan: h.link.cableType === 'FIBER_SC' ? '35 (FPT PON)' : '1',
          success: true,
          explanation: `⬅️ [Chặng về ${idx + 1} — ICMP Echo Reply (Type 0)]: ${h.toNode.name} gửi gói phản hồi Ping ngược về ${h.fromNode.name} qua cổng ${h.inPort} ➔ ${h.outPort} (TTL=${hopTtl}).`
        });
      });

      return events;
    }

    async function executeSimplePdu(srcId, tgtId) {
      const srcNode = studioState.nodes.find(n => n.id === srcId);
      const tgtNode = studioState.nodes.find(n => n.id === tgtId);
      if (!srcNode || !tgtNode) return;

      const hopEvents = buildPduHopEvents(srcId, tgtId);
      const reachable = hopEvents.length > 0 && hopEvents[0].success;
      let pingMs = '1 ms';

      try {
        const res = await fetch('/api/mesh-lab/ping', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ target: tgtNode.ip || '192.168.1.1' })
        });
        if (res.ok) {
          const data = await res.json();
          if (data.avg_time_ms) pingMs = data.avg_time_ms + ' ms';
        }
      } catch (_) {}

      const newPduId = 'pdu-' + (pduCounter++);
      const hasArp = hopEvents.some(e => e.protocol === 'ARP');
      const pduRecord = {
        id: newPduId,
        srcId: srcId,
        tgtId: tgtId,
        srcName: srcNode.name,
        tgtName: tgtNode.name,
        protocol: hasArp ? 'ARP + ICMP' : 'ICMPv4',
        status: reachable ? 'Successful' : 'Failed',
        timeMs: reachable ? pingMs : 'Timeout',
        hops: hopEvents
      };

      studioState.pduList.unshift(pduRecord);
      renderPduScenarioTable();
      fetchMissions();

      // Setup active simulation playback state
      activeSimPlayback.pduId = newPduId;
      activeSimPlayback.hops = hopEvents;
      activeSimPlayback.currentHopIdx = 0;

      if (studioState.simEngineMode === 'simulation') {
        renderHopEnvelopeOnCanvas(newPduId, 0);
        showToast(`🔬 [Simulation Mode]: Đang dừng ở Chặng 1/${hopEvents.length}. Bấm [⏭ Hop] để đi từng bước hoặc click vào Phong bì ✉️ để mở OSI 7 Tầng!`);
      } else {
        animateRealtimeHopSequence(newPduId, hopEvents, reachable, srcNode.name, tgtNode.name, pingMs);
      }
    }

    function renderHopEnvelopeOnCanvas(pduId, hopIdx) {
      const pdu = studioState.pduList.find(p => p.id === pduId);
      if (!pdu || !pdu.hops || !pdu.hops[hopIdx]) return;
      const h = pdu.hops[hopIdx];
      studioState.activePduEnvelope = {
        pduId: pduId,
        hopIndex: hopIdx,
        protocol: h.protocol,
        label: `${h.label} [Click xem OSI]`,
        x1: h.fromNode.x + 68,
        y1: h.fromNode.y + 38,
        x2: h.toNode.x + 68,
        y2: h.toNode.y + 38,
        dur: '0.48s',
        success: h.success
      };
      renderCanvas();
    }

    function animateRealtimeHopSequence(pduId, hopEvents, reachable, srcName, tgtName, pingMs) {
      let idx = 0;
      function playNext() {
        if (idx >= hopEvents.length) {
          setTimeout(() => {
            if (studioState.simEngineMode === 'realtime') {
              studioState.activePduEnvelope = null;
              renderCanvas();
            }
          }, 450);
          showToast(reachable
            ? `✉️ Ping PDU (${srcName} ➔ ${tgtName}): Thành công qua ${hopEvents.length} chặng (${pingMs}) — Bấm [🔍 OSI] để mổ xẻ gói tin!`
            : `❌ Ping PDU (${srcName} ➔ ${tgtName}): Thất bại (Destination Unreachable)!`);
          return;
        }
        renderHopEnvelopeOnCanvas(pduId, idx);
        idx++;
        setTimeout(playNext, 480);
      }
      playNext();
    }

    function stepSimForward() {
      if (studioState.pduList.length === 0) {
        showToast('✉️ Hãy bắn ít nhất 1 gói Ping PDU trước!');
        return;
      }
      const pdu = studioState.pduList.find(p => p.id === activeSimPlayback.pduId) || studioState.pduList[0];
      activeSimPlayback.pduId = pdu.id;
      activeSimPlayback.hops = pdu.hops || [];
      if (activeSimPlayback.hops.length === 0) return;

      activeSimPlayback.currentHopIdx = (activeSimPlayback.currentHopIdx + 1) % activeSimPlayback.hops.length;
      const idx = activeSimPlayback.currentHopIdx;
      const h = activeSimPlayback.hops[idx];
      renderHopEnvelopeOnCanvas(pdu.id, idx);
      showToast(`⏭ [Hop ${idx + 1}/${activeSimPlayback.hops.length}] ${h.label}: ${h.fromNode.name} ➔ ${h.toNode.name} (Click phong bì để xem OSI)`);
    }

    function stepSimBackward() {
      if (studioState.pduList.length === 0) return;
      const pdu = studioState.pduList.find(p => p.id === activeSimPlayback.pduId) || studioState.pduList[0];
      activeSimPlayback.pduId = pdu.id;
      activeSimPlayback.hops = pdu.hops || [];
      if (activeSimPlayback.hops.length === 0) return;

      activeSimPlayback.currentHopIdx = (activeSimPlayback.currentHopIdx - 1 + activeSimPlayback.hops.length) % activeSimPlayback.hops.length;
      const idx = activeSimPlayback.currentHopIdx;
      const h = activeSimPlayback.hops[idx];
      renderHopEnvelopeOnCanvas(pdu.id, idx);
      showToast(`◀ [Hop ${idx + 1}/${activeSimPlayback.hops.length}] ${h.label}: ${h.fromNode.name} ➔ ${h.toNode.name}`);
    }

    function toggleSimAutoPlay() {
      const btn = document.getElementById('btn-sim-play');
      if (activeSimPlayback.autoPlayTimer) {
        clearInterval(activeSimPlayback.autoPlayTimer);
        activeSimPlayback.autoPlayTimer = null;
        if (btn) { btn.textContent = '▶ Play'; btn.classList.remove('active'); }
        return;
      }
      if (studioState.pduList.length === 0) {
        showToast('✉️ Hãy bắn 1 gói Ping PDU để chạy Simulation!');
        return;
      }
      setSimEngineMode('simulation');
      if (btn) { btn.textContent = '⏸ Pause'; btn.classList.add('active'); }
      activeSimPlayback.autoPlayTimer = setInterval(() => {
        stepSimForward();
      }, 950);
    }

    // CISCO PACKET TRACER PDU INSPECTOR MODAL (OSI 7 LAYERS + WIRESHARK + HEX DUMP)
    function openPduInspectorModal(pduId, hopIdx = 0) {
      let pdu = studioState.pduList.find(p => p.id === pduId) || studioState.pduList[0];
      if (!pdu) return;
      if (!pdu.hops || pdu.hops.length === 0) {
        pdu.hops = buildPduHopEvents(pdu.srcId, pdu.tgtId);
      }
      activeInspectedPdu = {
        pduId: pdu.id,
        hopIdx: Math.max(0, Math.min(hopIdx, pdu.hops.length - 1)),
        tab: activeInspectedPdu.tab || 'osi'
      };
      renderPduInspectorContent();
      document.getElementById('pdu-inspector-modal').style.display = 'flex';
    }

    function closePduInspectorModal() {
      document.getElementById('pdu-inspector-modal').style.display = 'none';
    }

    function stepPduInspectorHop(delta) {
      const pdu = studioState.pduList.find(p => p.id === activeInspectedPdu.pduId);
      if (!pdu || !pdu.hops || pdu.hops.length === 0) return;
      activeInspectedPdu.hopIdx = (activeInspectedPdu.hopIdx + delta + pdu.hops.length) % pdu.hops.length;
      renderHopEnvelopeOnCanvas(pdu.id, activeInspectedPdu.hopIdx);
      renderPduInspectorContent();
    }

    function switchPduInspectorTab(tabKey) {
      activeInspectedPdu.tab = tabKey;
      ['osi', 'wireshark', 'hex'].forEach(k => {
        const btn = document.getElementById('pdu-tab-btn-' + k);
        const view = document.getElementById('pdu-view-' + k);
        if (btn) btn.classList.toggle('active', k === tabKey);
        if (view) view.style.display = (k === tabKey) ? 'flex' : 'none';
      });
    }

    function renderPduInspectorContent() {
      const pdu = studioState.pduList.find(p => p.id === activeInspectedPdu.pduId);
      if (!pdu || !pdu.hops || pdu.hops.length === 0) return;
      const hop = pdu.hops[activeInspectedPdu.hopIdx];

      document.getElementById('pdu-insp-title').textContent =
        `PDU INSPECTOR • [${hop.label}] TẠI THIẾT BỊ: ${hop.fromNode.name} ➔ ${hop.toNode.name}`;

      // 1. Render Hop Stepper Chips
      const stepper = document.getElementById('pdu-hop-stepper-bar');
      stepper.innerHTML = pdu.hops.map((h, idx) => `
        <button class="pdu-hop-chip ${h.protocol === 'ARP' ? 'arp' : ''} ${idx === activeInspectedPdu.hopIdx ? 'active' : ''}"
                onclick="activeInspectedPdu.hopIdx=${idx}; renderHopEnvelopeOnCanvas('${pdu.id}', ${idx}); renderPduInspectorContent();">
          ${idx + 1}. ${h.label}: ${h.fromNode.name} ➔ ${h.toNode.name}
        </button>
      `).join('');

      // 2. Render OSI 7-Layer Inbound vs Outbound Columns
      document.getElementById('osi-in-port-badge').textContent = `In: ${hop.fromNode.name}`;
      document.getElementById('osi-out-port-badge').textContent = `Out: ${hop.outPort} ➔ ${hop.inPort}`;

      const isArp = hop.protocol === 'ARP';
      const isReply = hop.protocol === 'ICMP_REPLY';
      const l4Text = isArp
        ? 'ARP Frame (EtherType 0x0806 • Opcode: ' + (hop.label.includes('Req') ? '1 Request' : '2 Reply') + ')'
        : `ICMPv4 (Proto=1) • ${isReply ? 'Type 0 (Echo Reply)' : 'Type 8 (Echo Request)'} • Seq=1`;

      const inLayers = [
        { l: 'Layer 7', v: isArp ? '—' : 'ICMP Ping Probe ("FPT-NetLab-32B")', hi: false },
        { l: 'Layer 6', v: isArp ? '—' : 'Binary Data Representation', hi: false },
        { l: 'Layer 5', v: isArp ? '—' : 'ICMP Echo Session ID: 0x04F2', hi: false },
        { l: 'Layer 4', v: l4Text, hi: !isArp },
        { l: 'Layer 3', v: `Src IP: ${pdu.hops[0].srcIp} | Dst IP: ${hop.dstIp} | TTL=${Math.min(64, hop.ttl + 1)}`, hi: true },
        { l: 'Layer 2', v: `Ethernet II • Src MAC: ${hop.srcMac}`, hi: true },
        { l: 'Layer 1', v: `Internal Bus / Ingress Buffer (${hop.fromNode.model})`, hi: false }
      ];

      const outLayers = [
        { l: 'Layer 7', v: isArp ? '—' : 'ICMP Ping Probe ("FPT-NetLab-32B")', hi: false },
        { l: 'Layer 6', v: isArp ? '—' : 'Binary Data Representation', hi: false },
        { l: 'Layer 5', v: isArp ? '—' : 'ICMP Echo Session ID: 0x04F2', hi: false },
        { l: 'Layer 4', v: l4Text, hi: !isArp },
        { l: 'Layer 3', v: `Src IP: ${hop.srcIp} ➔ Dst IP: ${hop.dstIp} | TTL=${hop.ttl}`, hi: true },
        { l: 'Layer 2', v: `${hop.srcMac} ➔ ${hop.dstMac} | VLAN: ${hop.vlan}`, hi: true },
        { l: 'Layer 1', v: `Port ${hop.outPort} ➔ ${hop.inPort} (${hop.cableType} • ${hop.speed >= 1000 ? (hop.speed/1000)+' Gbps' : hop.speed+' Mbps'})`, hi: true }
      ];

      document.getElementById('osi-in-layers-list').innerHTML = inLayers.map(r => `
        <div class="osi-layer-row ${r.hi ? 'highlight' : ''}">
          <div class="osi-layer-num">${r.l}</div>
          <div class="osi-layer-val">${r.v}</div>
        </div>
      `).join('');

      document.getElementById('osi-out-layers-list').innerHTML = outLayers.map(r => `
        <div class="osi-layer-row ${r.hi ? 'highlight' : ''}">
          <div class="osi-layer-num">${r.l}</div>
          <div class="osi-layer-val">${r.v}</div>
        </div>
      `).join('');

      document.getElementById('osi-step-explanation').innerHTML = hop.explanation;

      // 3. Render Wireshark Frame Dissector Tree
      const wsTree = document.getElementById('pdu-wireshark-tree');
      wsTree.innerHTML = `
        <div class="ws-section">
          <div class="ws-sec-title">▼ Frame ${activeInspectedPdu.hopIdx + 1}: 74 bytes on wire (592 bits), Interface: ${hop.outPort} (${hop.cableType})</div>
          <div class="ws-sec-body">
            • Encapsulation type: ${hop.cableType === 'WIFI_MESH' ? 'IEEE 802.11be Wi-Fi 7 MLO Radiotap' : (hop.cableType === 'FIBER_SC' ? 'ITU-T XGS-PON / GPON GEM Frame' : 'Ethernet (1)')}<br>
            • Link Speed: ${hop.speed} Mbps | Arrival Time: +0.00${activeInspectedPdu.hopIdx + 1}s
          </div>
        </div>
        <div class="ws-section">
          <div class="ws-sec-title">▼ Data Link Layer (L2) — Src: ${hop.srcMac}, Dst: ${hop.dstMac}</div>
          <div class="ws-sec-body">
            • Destination MAC: <b>${hop.dstMac}</b><br>
            • Source MAC: <b>${hop.srcMac}</b><br>
            • 802.1Q VLAN Tag: <b>${hop.vlan}</b> | EtherType: ${isArp ? 'ARP (0x0806)' : 'IPv4 (0x0800)'}
          </div>
        </div>
        <div class="ws-section">
          <div class="ws-sec-title">▼ ${isArp ? 'Address Resolution Protocol (ARP)' : `Internet Protocol Version 4 (IPv4) — Src: ${hop.srcIp}, Dst: ${hop.dstIp}`}</div>
          <div class="ws-sec-body">
            ${isArp
              ? `• Hardware type: Ethernet (1) | Protocol type: IPv4 (0x0800)<br>• Sender MAC: ${hop.srcMac} | Sender IP: ${hop.srcIp}<br>• Target MAC: ${hop.dstMac} | Target IP: ${hop.dstIp}`
              : `• Version: 4 | Header Length: 20 bytes | Total Length: 60<br>• Identification: 0x4f2${activeInspectedPdu.hopIdx} | Flags: 0x02 (Don't Fragment)<br>• Time to Live (TTL): <b>${hop.ttl}</b> | Protocol: ICMP (1)<br>• Source Address: <b>${hop.srcIp}</b><br>• Destination Address: <b>${hop.dstIp}</b>`
            }
          </div>
        </div>
        ${!isArp ? `
        <div class="ws-section">
          <div class="ws-sec-title">▼ Internet Control Message Protocol (ICMPv4)</div>
          <div class="ws-sec-body">
            • Type: ${isReply ? '0 (Echo (ping) reply)' : '8 (Echo (ping) request)'} | Code: 0<br>
            • Checksum: 0x4d5a [correct] | Identifier (BE): 1266 (0x04f2) | Sequence Number: 1<br>
            • Data (32 bytes): <code>46 50 54 2d 4e 65 74 4c 61 62 2d 57 69 46 69 37 ... ("FPT-NetLab-WiFi7")</code>
          </div>
        </div>` : ''}
      `;

      // 4. Render Wireshark Hex Dump
      document.getElementById('pdu-wireshark-hex').textContent = buildWiresharkHexDump(hop);
      switchPduInspectorTab(activeInspectedPdu.tab);
    }

    function buildWiresharkHexDump(hop) {
      const macToHex = (m) => {
        const clean = (m || '00:00:00:00:00:00').split(' ')[0].replace(/[^0-9A-Fa-f]/g, '').padEnd(12, '0').slice(0, 12).toLowerCase();
        return clean.match(/.{1,2}/g).join(' ');
      };
      const ipToHex = (ipStr) => {
        const cleanIp = (ipStr || '192.168.1.1').match(/\d+\.\d+\.\d+\.\d+/);
        const parts = (cleanIp ? cleanIp[0] : '192.168.1.1').split('.').map(n => Math.min(255, parseInt(n, 10) || 0));
        return parts.map(b => b.toString(16).padStart(2, '0')).join(' ');
      };
      const dstM = macToHex(hop.dstMac);
      const srcM = macToHex(hop.srcMac);
      const sIp = ipToHex(hop.srcIp);
      const dIp = ipToHex(hop.dstIp);
      const ttlHex = Math.max(1, hop.ttl || 64).toString(16).padStart(2, '0');
      const ethType = hop.protocol === 'ARP' ? '08 06' : '08 00';
      const icmpType = hop.protocol === 'ICMP_REPLY' ? '00' : '08';

      return [
        `Offset  00 01 02 03 04 05 06 07  08 09 0a 0b 0c 0d 0e 0f   Decoded ASCII`,
        `------  -----------------------  -----------------------   ----------------`,
        `0000    ${dstM} ${srcM.slice(0, 5)}  ${srcM.slice(6)} ${ethType} 45 00   ..........E.`,
        `0010    00 3c 4f 21 40 00 ${ttlHex} 01  b6 58 ${sIp}   .<O!@....X....`,
        `0020    ${dIp} ${icmpType} 00 4d 5a  04 f2 00 01 46 50 54 2d   ......MZ....FPT-`,
        `0030    4e 65 74 4c 61 62 2d 57  69 46 69 37 2d 4d 4c 4f   NetLab-WiFi7-MLO`
      ].join('\n');
    }

    function renderPduScenarioTable() {
      const tbody = document.getElementById('pdu-scenario-tbody');
      if (!tbody) return;
      if (studioState.pduList.length === 0) {
        tbody.innerHTML = `<tr><td colspan="7" style="text-align:center;color:var(--text-node-sub);padding:8px;">Bấm [✉️ Ping PDU (P)] để kiểm tra thông mạng & phân tích gói tin OSI 7 tầng</td></tr>`;
        return;
      }
      tbody.innerHTML = studioState.pduList.map(p => `
        <tr>
          <td><button class="cpt-sim-btn" onclick="executeSimplePdu('${p.srcId}', '${p.tgtId}')" title="Bắn lại gói tin">▶</button></td>
          <td><span class="pdu-status-badge ${p.status === 'Successful' ? 'ok' : 'fail'}">${p.status}</span></td>
          <td>${p.srcName}</td>
          <td>${p.tgtName}</td>
          <td style="font-family:var(--font-mono);color:#38bdf8;font-weight:700;">${p.protocol || 'ICMPv4'} (${p.timeMs})</td>
          <td><button class="cpt-sim-btn" style="border-color:#38bdf8;color:#38bdf8;" onclick="openPduInspectorModal('${p.id}', 0)" title="Mở cửa sổ phân tích gói tin OSI 7 Tầng & Wireshark">🔍 OSI</button></td>
          <td><button class="cpt-sim-btn" onclick="deletePduRecord('${p.id}')">✕</button></td>
        </tr>
      `).join('');
    }

    function deletePduRecord(pduId) {
      studioState.pduList = studioState.pduList.filter(p => p.id !== pduId);
      renderPduScenarioTable();
    }

    function fastForwardTime() {
      studioState.labElapsedOffset += 30;
      updateLabTimerDisplay();
      syncZteBackend();
      showToast('⏩ Đã tua nhanh +30s (Hội tụ DHCP & EasyMesh)');
    }

    function powerCycleAllDevices() {
      arpResolvedCache.clear();
      studioState.nodes.forEach(n => { n.power = false; });
      renderCanvas();
      setTimeout(() => {
        studioState.nodes.forEach(n => { n.power = true; });
        renderCanvas();
        syncZteBackend();
        showToast('⚡ Đã khởi động lại toàn bộ thiết bị & xóa trắng bảng ARP Cache!');
      }, 750);
    }

    function setSimEngineMode(mode) {
      studioState.simEngineMode = mode;
      document.getElementById('sim-mode-realtime').classList.toggle('active', mode === 'realtime');
      document.getElementById('sim-mode-simulation').classList.toggle('active', mode === 'simulation');
      if (mode === 'realtime' && activeSimPlayback.autoPlayTimer) {
        toggleSimAutoPlay();
      }
      if (mode === 'simulation' && studioState.pduList.length > 0) {
        const firstPdu = studioState.pduList[0];
        if (!firstPdu.hops || firstPdu.hops.length === 0) {
          firstPdu.hops = buildPduHopEvents(firstPdu.srcId, firstPdu.tgtId);
        }
        activeSimPlayback.pduId = firstPdu.id;
        activeSimPlayback.hops = firstPdu.hops;
        activeSimPlayback.currentHopIdx = 0;
        renderHopEnvelopeOnCanvas(firstPdu.id, 0);
        showToast('🔬 Chế độ Simulation: Bấm [⏭ Hop] để xem gói tin đi từng chặng hoặc bấm [🔍 OSI] để mổ xẻ gói tin!');
      } else if (mode === 'realtime') {
        studioState.activePduEnvelope = null;
        renderCanvas();
      }
    }

    function updateLabTimerDisplay() {
      const el = document.getElementById('cpt-lab-timer');
      if (!el) return;
      const totalSec = Math.floor((Date.now() - studioState.labStartEpoch) / 1000) + studioState.labElapsedOffset;
      const hrs = String(Math.floor(totalSec / 3600)).padStart(2, '0');
      const mins = String(Math.floor((totalSec % 3600) / 60)).padStart(2, '0');
      const secs = String(totalSec % 60).padStart(2, '0');
      el.textContent = `${hrs}:${mins}:${secs}`;
    }
    setInterval(updateLabTimerDisplay, 1000);
