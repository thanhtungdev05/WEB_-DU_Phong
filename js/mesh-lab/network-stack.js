/**
 * network-stack.js — Cisco Packet Tracer Virtual Network Stack (Phase 1)
 * FPT NetLab Studio — Autonomous Per-Node Stateful Layer 2/3 Protocol Stack
 * 
 * Provides discrete network state for every device on the canvas:
 * - Layer 1: Interfaces (Admin/Oper status, Speed, Duplex, MAC)
 * - Layer 2: MAC Address Table (CAM), VLAN 802.1Q (Access/Trunk), Port Security
 * - Layer 3: ARP Cache Table, Routing Table (FIB: Connected 'C', Static 'S', OSPF 'O')
 * - Layer 4/7: DHCP Server / Client DORA State, DNS Resolver, Access Control Lists (ACL)
 */

(function (root) {
  'use strict';

  // ── 1. MATHEMATICAL BITWISE IP UTILITIES ─────────────────────────────────
  function ipToLong(ipStr) {
    if (!ipStr || typeof ipStr !== 'string') return 0;
    const parts = ipStr.trim().split('.');
    if (parts.length !== 4) return 0;
    return (((parseInt(parts[0], 10) & 0xff) << 24) |
            ((parseInt(parts[1], 10) & 0xff) << 16) |
            ((parseInt(parts[2], 10) & 0xff) << 8)  |
             (parseInt(parts[3], 10) & 0xff)) >>> 0;
  }

  function longToIp(num) {
    num = num >>> 0;
    return [
      (num >>> 24) & 0xff,
      (num >>> 16) & 0xff,
      (num >>> 8) & 0xff,
       num & 0xff
    ].join('.');
  }

  function maskToCidr(maskStr) {
    const num = ipToLong(maskStr);
    let count = 0;
    for (let i = 31; i >= 0; i--) {
      if ((num >>> i) & 1) count++;
      else break;
    }
    return count;
  }

  function cidrToMask(cidr) {
    cidr = Math.max(0, Math.min(32, parseInt(cidr, 10) || 24));
    if (cidr === 0) return '0.0.0.0';
    const num = ((0xffffffff << (32 - cidr)) & 0xffffffff) >>> 0;
    return longToIp(num);
  }

  function isSameSubnet(ipA, ipB, mask) {
    const nA = ipToLong(ipA);
    const nB = ipToLong(ipB);
    const nM = ipToLong(mask || '255.255.255.0');
    return (nA & nM) === (nB & nM);
  }

  function calculateNetworkAddress(ipStr, maskStr) {
    return longToIp((ipToLong(ipStr) & ipToLong(maskStr)) >>> 0);
  }

  function calculateBroadcastAddress(ipStr, maskStr) {
    const net = ipToLong(ipStr) & ipToLong(maskStr);
    const hostPart = (~ipToLong(maskStr)) >>> 0;
    return longToIp((net | hostPart) >>> 0);
  }

  function generatePortMac(baseMac, portId) {
    if (!baseMac) return 'AA:BB:CC:00:00:01';
    const parts = baseMac.split(':');
    if (parts.length !== 6) return baseMac;
    let hash = 0;
    for (let i = 0; i < portId.length; i++) hash = (hash * 31 + portId.charCodeAt(i)) & 0xff;
    const lastByte = (parseInt(parts[5], 16) + hash) & 0xff;
    parts[5] = lastByte.toString(16).padStart(2, '0').toUpperCase();
    return parts.join(':');
  }

  // ── 2. VIRTUAL NETWORK STACK INITIALIZATION (PHASE 1) ────────────────────
  function initNodeNetworkStack(node, dev) {
    if (!node) return;
    if (!dev && typeof FPT_CATALOG !== 'undefined') {
      dev = FPT_CATALOG[node.catalogKey];
    }
    dev = dev || { ports: [], category: node.category || 'gateway', model: node.model || 'Device' };

    const isRouter = dev.category === 'gateway' || dev.category === 'olt' || node.catalogKey === 'mikrotik_hexs' || node.catalogKey === 'vigor2927';
    const isSwitch = dev.category === 'switch' || node.catalogKey === 'switch_2960';
    const isAp = dev.category === 'ap';
    const isClient = dev.category === 'client';

    const defaultIp = node.ip || dev.defaultIp || (isClient ? '192.168.1.150' : '192.168.1.1');
    const defaultMask = (node.firmwareConfig && node.firmwareConfig.subnetMask) || '255.255.255.0';
    const defaultGw = isClient || isAp ? '192.168.1.1' : (isRouter ? '100.64.35.1' : '');

    // Khởi tạo bảng cổng L1/L2
    const interfaces = {};
    (dev.ports || []).forEach(p => {
      const isWan = p.id.startsWith('WAN') || p.id.startsWith('PON') || p.id.startsWith('OPT');
      const isLan = p.id.startsWith('LAN') || p.id.startsWith('Fa') || p.id.startsWith('Gi') || p.id.startsWith('BR') || p.id.startsWith('WLAN') || p.id.startsWith('WIFI');
      
      let ifaceIp = '';
      let ifaceMask = '255.255.255.0';
      if (!isSwitch) {
        if (isLan || isClient) {
          ifaceIp = defaultIp;
          ifaceMask = defaultMask;
        } else if (isWan && node.linkedReceivedState && node.linkedReceivedState.assignedWanIp) {
          ifaceIp = node.linkedReceivedState.assignedWanIp;
        }
      }

      interfaces[p.id] = {
        id: p.id,
        name: p.name,
        short: p.short || p.id,
        type: p.type || 'eth', // 'eth', 'fiber', 'wifi'
        speedMbps: p.speed || 1000,
        adminUp: true,
        operUp: false,
        mac: generatePortMac(node.mac, p.id),
        ip: ifaceIp,
        mask: ifaceMask,
        mode: isSwitch ? 'access' : 'routed', // 'access' | 'trunk' | 'routed'
        vlan: p.vlan ? (parseInt(p.vlan, 10) || 1) : 1,
        nativeVlan: 1,
        allowedVlans: [1, 10, 20, 30, 35, 2500],
        portSecurity: {
          enabled: false,
          maxMac: 1,
          stickyMacs: [],
          violation: 'shutdown', // 'shutdown' | 'restrict' | 'protect'
          violated: false,
          violationCount: 0
        }
      };
    });

    // Cấu hình Bảng Định Tuyến L3 (FIB)
    const routingTable = [];
    if (!isSwitch && defaultIp && defaultIp !== '0.0.0.0') {
      const net = calculateNetworkAddress(defaultIp, defaultMask);
      routingTable.push({
        type: 'C', // Connected
        prefix: net,
        mask: defaultMask,
        gateway: '0.0.0.0',
        ifaceId: dev.ports && dev.ports[0] ? dev.ports[0].id : 'LAN1',
        metric: 0
      });
      if (defaultGw) {
        routingTable.push({
          type: 'S', // Default Static Route
          prefix: '0.0.0.0',
          mask: '0.0.0.0',
          gateway: defaultGw,
          ifaceId: isRouter ? 'WAN' : 'LAN1',
          metric: 1
        });
      }
    }

    // Cấu hình Dịch vụ DHCP Server
    const dhcpPools = {};
    if (isRouter) {
      const netNum = ipToLong(defaultIp);
      const startIp = longToIp((netNum & 0xffffff00) | 2);
      const endIp = longToIp((netNum & 0xffffff00) | 254);
      dhcpPools['default_pool'] = {
        network: calculateNetworkAddress(defaultIp, defaultMask),
        mask: defaultMask,
        startIp: (node.firmwareConfig && node.firmwareConfig.dhcpStartIp) || startIp,
        endIp: (node.firmwareConfig && node.firmwareConfig.dhcpEndIp) || endIp,
        gateway: defaultIp,
        dns1: (node.firmwareConfig && node.firmwareConfig.primaryDns) || defaultIp,
        dns2: (node.firmwareConfig && node.firmwareConfig.secondaryDns) || '0.0.0.0',
        leaseTime: parseInt((node.firmwareConfig && node.firmwareConfig.leaseTime) || '86400', 10),
        leases: {} // map of { [mac]: { ip, hostname, expiresAt } }
      };
    }

    // Khởi tạo hoàn chỉnh ngăn xếp mạng cho Node
    node.networkStack = {
      enabled: true,
      deviceType: dev.category,
      isRouter: isRouter,
      isSwitch: isSwitch,
      isClient: isClient,
      hostname: node.name,
      baseMac: node.mac,
      defaultGateway: defaultGw,
      dnsServers: [defaultIp, '8.8.8.8'],
      
      // Layer 1 / Layer 2 Interfaces
      interfaces: interfaces,

      // Layer 2 Switch CAM Table (Chỉ học trên Switch / Bridge)
      macAddressTable: [], // [ { mac, portId, vlan, ageSec, type: 'DYNAMIC'|'STATIC' } ]

      // Layer 3 ARP Cache Table (Phân giải IP -> MAC)
      arpTable: {}, // { [ip]: { mac, ifaceId, ageSec } }

      // Layer 3 Routing Table (FIB)
      routingTable: routingTable, // [ { type: 'C'|'S'|'O', prefix, mask, gateway, ifaceId, metric } ]

      // Layer 3/4 Access Control Lists (ACL Filters)
      accessControlLists: {}, // { [aclId]: [ { seq, action: 'permit'|'deny', proto, src, srcWildcard, dst, dstWildcard, dstPort } ] }

      // Layer 4/7 DHCP Server & Client State
      dhcpServer: {
        enabled: isRouter,
        pools: dhcpPools
      },
      dhcpClient: {
        enabled: isClient || isAp,
        status: 'bound',
        leasedIp: defaultIp,
        leasedMask: defaultMask,
        leasedGateway: defaultGw,
        leasedDns: defaultIp
      }
    };

    return node.networkStack;
  }

  // ── 3. REAL-TIME STACK SYNCHRONIZATION FROM FIRMWARE / CONFIG TAB ─────────
  function updateNodeNetworkStackFromConfig(node) {
    if (!node || !node.networkStack) return;
    const ns = node.networkStack;
    const newIp = (node.firmwareConfig && node.firmwareConfig.lanIp) || node.ip;
    const newMask = (node.firmwareConfig && node.firmwareConfig.subnetMask) || '255.255.255.0';

    ns.hostname = node.name;
    node.ip = newIp;

    // Cập nhật lại IP trên các cổng LAN / Routed interfaces
    Object.keys(ns.interfaces).forEach(portId => {
      const iface = ns.interfaces[portId];
      if (iface.mode === 'routed' || (!ns.isSwitch && (portId.startsWith('LAN') || portId.startsWith('BR') || portId.startsWith('WLAN')))) {
        iface.ip = newIp;
        iface.mask = newMask;
      }
    });

    // Cập nhật lại tuyến đường trực tiếp Connected 'C' trong Bảng Định Tuyến
    if (!ns.isSwitch && newIp && newIp !== '0.0.0.0') {
      const net = calculateNetworkAddress(newIp, newMask);
      ns.routingTable = ns.routingTable.filter(r => r.type !== 'C');
      ns.routingTable.unshift({
        type: 'C',
        prefix: net,
        mask: newMask,
        gateway: '0.0.0.0',
        ifaceId: Object.keys(ns.interfaces)[0] || 'LAN1',
        metric: 0
      });

      // Cập nhật lại dải DHCP pool nếu là Router
      if (ns.dhcpServer && ns.dhcpServer.pools && ns.dhcpServer.pools['default_pool']) {
        const p = ns.dhcpServer.pools['default_pool'];
        p.network = net;
        p.mask = newMask;
        p.gateway = newIp;
        p.startIp = (node.firmwareConfig && node.firmwareConfig.dhcpStartIp) || longToIp((ipToLong(newIp) & 0xffffff00) | 2);
        p.endIp = (node.firmwareConfig && node.firmwareConfig.dhcpEndIp) || longToIp((ipToLong(newIp) & 0xffffff00) | 254);
        p.dns1 = (node.firmwareConfig && node.firmwareConfig.primaryDns) || newIp;
      }
    }
  }

  // ── 4. CAM TABLE LEARNING & PORT SECURITY ENGINE ─────────────────────────
  function learnSourceMacOnSwitch(switchNode, portId, srcMac, vlan = 1) {
    if (!switchNode || !switchNode.networkStack || !switchNode.networkStack.isSwitch) return;
    const ns = switchNode.networkStack;
    const iface = ns.interfaces[portId];
    if (!iface || !iface.adminUp) return;

    // Kiểm tra Port Security
    if (iface.portSecurity && iface.portSecurity.enabled) {
      const ps = iface.portSecurity;
      if (ps.stickyMacs.length < ps.maxMac && !ps.stickyMacs.includes(srcMac)) {
        ps.stickyMacs.push(srcMac);
      } else if (!ps.stickyMacs.includes(srcMac)) {
        // Vi phạm an ninh Port Security!
        ps.violated = true;
        ps.violationCount = (ps.violationCount || 0) + 1;
        if (ps.violation === 'shutdown') {
          iface.adminUp = false;
          iface.operUp = false;
          if (!switchNode.portAdminDown) switchNode.portAdminDown = {};
          switchNode.portAdminDown[portId] = true;
          if (typeof showToast === 'function') {
            showToast(`🚨 [Port Security VIOLATION]: Cổng ${portId} trên ${switchNode.name} bị KHÓA (Shutdown) do phát hiện MAC lạ ${srcMac}!`, 4000);
          }
        }
        return false;
      }
    }

    // Học địa chỉ MAC vào CAM Table
    const existing = ns.macAddressTable.find(e => e.mac === srcMac && e.vlan === vlan);
    if (existing) {
      existing.portId = portId;
      existing.ageSec = 0;
    } else {
      ns.macAddressTable.push({
        mac: srcMac,
        portId: portId,
        vlan: vlan,
        ageSec: 0,
        type: 'DYNAMIC'
      });
      // Giới hạn CAM Table tối đa 128 bản ghi mô phỏng
      if (ns.macAddressTable.length > 128) ns.macAddressTable.shift();
    }
    return true;
  }

  // Xuất ra phạm vi toàn cục window
  root.initNodeNetworkStack = initNodeNetworkStack;
  root.updateNodeNetworkStackFromConfig = updateNodeNetworkStackFromConfig;
  root.learnSourceMacOnSwitch = learnSourceMacOnSwitch;
  root.ipToLong = ipToLong;
  root.longToIp = longToIp;
  root.maskToCidr = maskToCidr;
  root.cidrToMask = cidrToMask;
  root.isSameSubnet = isSameSubnet;
  root.calculateNetworkAddress = calculateNetworkAddress;
  root.calculateBroadcastAddress = calculateBroadcastAddress;
  root.generatePortMac = generatePortMac;

})(typeof window !== 'undefined' ? window : this);
