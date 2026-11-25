    // 1. CISCO PACKET TRACER VECTOR SVG ICON LIBRARY & REAL DEVICE IMAGE SUPPORT
    function getDeviceSvgGraphic(svgTypeOrDev, isPowered = true) {
      let dev = null;
      let svgType = svgTypeOrDev;
      if (typeof svgTypeOrDev === 'object' && svgTypeOrDev !== null) {
        dev = svgTypeOrDev;
        svgType = dev.svgType;
      } else if (typeof svgTypeOrDev === 'string' && typeof FPT_CATALOG !== 'undefined' && FPT_CATALOG[svgTypeOrDev]) {
        dev = FPT_CATALOG[svgTypeOrDev];
        svgType = dev.svgType;
      }

      if (dev && dev.realImage) {
        const offStyle = isPowered ? '' : 'filter: grayscale(1) opacity(0.35);';
        return `<img src="${dev.realImage}" alt="${dev.model || 'Device'}" class="device-real-img" style="${offStyle}">`;
      }

      const ledColor = isPowered ? '#22c55e' : '#ef4444';
      const waveColor = isPowered ? '#38bdf8' : '#475569';
      switch (svgType) {
        case 'ont_wifi7':
          return `<svg viewBox="0 0 68 48" fill="none">
            <line x1="12" y1="22" x2="8" y2="4" stroke="#475569" stroke-width="2.5" stroke-linecap="round"/>
            <line x1="25" y1="20" x2="23" y2="2" stroke="#475569" stroke-width="2.5" stroke-linecap="round"/>
            <line x1="43" y1="20" x2="45" y2="2" stroke="#475569" stroke-width="2.5" stroke-linecap="round"/>
            <line x1="56" y1="22" x2="60" y2="4" stroke="#475569" stroke-width="2.5" stroke-linecap="round"/>
            <polygon points="10,22 58,22 64,30 4,30" fill="#1e293b" stroke="#3b82f6" stroke-width="1.3"/>
            <line x1="26" y1="26" x2="42" y2="26" stroke="#38bdf8" stroke-width="1.4"/>
            <line x1="34" y1="23.5" x2="34" y2="28.5" stroke="#38bdf8" stroke-width="1.4"/>
            <rect x="4" y="30" width="60" height="13" rx="2.5" fill="#0f172a" stroke="#334155" stroke-width="1.4"/>
            <circle cx="12" cy="36.5" r="2" fill="${ledColor}"/>
            <circle cx="19" cy="36.5" r="2" fill="${ledColor}"/>
            <circle cx="26" cy="36.5" r="2" fill="${isPowered ? '#f59e0b' : '#475569'}"/>
            <circle cx="33" cy="36.5" r="2" fill="${isPowered ? '#38bdf8' : '#475569'}"/>
            <circle cx="40" cy="36.5" r="2" fill="${isPowered ? '#a855f7' : '#475569'}"/>
            <text x="53" y="39" fill="#f8fafc" font-size="6.5" font-weight="800" font-family="monospace" text-anchor="middle">10G</text>
          </svg>`;

        case 'ap_mesh':
          return `<svg viewBox="0 0 68 48" fill="none">
            <path d="M18 14 A18 18 0 0 1 50 14" stroke="${waveColor}" stroke-width="1.8" stroke-linecap="round" stroke-dasharray="2 2"/>
            <path d="M24 19 A11 11 0 0 1 44 19" stroke="#a855f7" stroke-width="1.8" stroke-linecap="round"/>
            <rect x="20" y="14" width="28" height="29" rx="5" fill="#1e293b" stroke="#8b5cf6" stroke-width="1.5"/>
            <line x1="25" y1="22" x2="43" y2="22" stroke="#334155" stroke-width="1.2"/>
            <line x1="25" y1="26" x2="43" y2="26" stroke="#334155" stroke-width="1.2"/>
            <circle cx="34" cy="35" r="3.2" fill="${ledColor}"/>
            <text x="34" y="11" fill="#c084fc" font-size="6.5" font-weight="800" font-family="monospace" text-anchor="middle">MESH 7</text>
          </svg>`;

        case 'ont_gpon':
          return `<svg viewBox="0 0 68 48" fill="none">
            <line x1="16" y1="22" x2="12" y2="5" stroke="#475569" stroke-width="2.5" stroke-linecap="round"/>
            <line x1="52" y1="22" x2="56" y2="5" stroke="#475569" stroke-width="2.5" stroke-linecap="round"/>
            <polygon points="10,22 58,22 63,30 5,30" fill="#1e293b" stroke="#0284c7" stroke-width="1.3"/>
            <rect x="5" y="30" width="58" height="12" rx="2" fill="#0f172a" stroke="#334155" stroke-width="1.3"/>
            <circle cx="14" cy="36" r="2" fill="${ledColor}"/>
            <circle cx="22" cy="36" r="2" fill="${ledColor}"/>
            <circle cx="30" cy="36" r="2" fill="${isPowered ? '#38bdf8' : '#475569'}"/>
            <text x="48" y="38.5" fill="#38bdf8" font-size="6.5" font-weight="800" font-family="monospace" text-anchor="middle">GPON</text>
          </svg>`;

        case 'router_enterprise':
          return `<svg viewBox="0 0 68 48" fill="none">
            <ellipse cx="34" cy="18" rx="24" ry="8" fill="#1e293b" stroke="#049fd9" stroke-width="1.5"/>
            <path d="M10 18 v14 c0 4.5 10.7 8 24 8 s24 -3.5 24 -8 v-14" fill="#0f172a" stroke="#049fd9" stroke-width="1.5"/>
            <line x1="22" y1="18" x2="46" y2="18" stroke="#38bdf8" stroke-width="1.6"/>
            <line x1="34" y1="13" x2="34" y2="23" stroke="#38bdf8" stroke-width="1.6"/>
            <circle cx="20" cy="29" r="2" fill="${ledColor}"/>
            <rect x="28" y="26" width="6" height="5" fill="#f59e0b"/>
            <rect x="36" y="26" width="6" height="5" fill="#0284c7"/>
            <rect x="44" y="26" width="6" height="5" fill="#64748b"/>
          </svg>`;

        case 'switch_l2':
          return `<svg viewBox="0 0 68 48" fill="none">
            <polygon points="10,16 58,16 64,25 4,25" fill="#1e293b" stroke="#0ea5e9" stroke-width="1.3"/>
            <line x1="20" y1="19" x2="46" y2="19" stroke="#38bdf8" stroke-width="1.4"/>
            <line x1="22" y1="22" x2="48" y2="22" stroke="#38bdf8" stroke-width="1.4"/>
            <rect x="4" y="25" width="60" height="14" rx="2" fill="#0f172a" stroke="#334155" stroke-width="1.4"/>
            <circle cx="10" cy="32" r="1.8" fill="${ledColor}"/>
            <rect x="16" y="29" width="5" height="6" fill="#38bdf8"/>
            <rect x="23" y="29" width="5" height="6" fill="#38bdf8"/>
            <rect x="30" y="29" width="5" height="6" fill="#38bdf8"/>
            <rect x="37" y="29" width="5" height="6" fill="#38bdf8"/>
            <rect x="44" y="29" width="5" height="6" fill="#64748b"/>
            <rect x="51" y="29" width="6" height="6" fill="#f59e0b"/>
          </svg>`;

        case 'olt_core':
          return `<svg viewBox="0 0 68 48" fill="none">
            <path d="M18 35 H52 A10 10 0 0 0 54 16 A13 13 0 0 0 29 11 A11 11 0 0 0 14 23 A8 8 0 0 0 18 35 Z" fill="#1e293b" stroke="#f97316" stroke-width="1.6"/>
            <circle cx="24" cy="25" r="2.2" fill="${ledColor}"/>
            <text x="39" y="27" fill="#fb923c" font-size="7.5" font-weight="800" font-family="monospace" text-anchor="middle">OLT 10G</text>
          </svg>`;

        case 'phone_client':
          return `<svg viewBox="0 0 68 48" fill="none">
            <rect x="22" y="5" width="24" height="38" rx="4" fill="#0f172a" stroke="#10b981" stroke-width="1.6"/>
            <rect x="25" y="9" width="18" height="27" rx="1.5" fill="${isPowered ? '#064e3b' : '#1e293b'}"/>
            <path d="M29 22 a7 7 0 0 1 10 0 M31 25 a4 4 0 0 1 6 0" stroke="#34d399" stroke-width="1.5" stroke-linecap="round"/>
            <circle cx="34" cy="39.5" r="1.5" fill="#94a3b8"/>
          </svg>`;

        case 'laptop_client':
          return `<svg viewBox="0 0 68 48" fill="none">
            <rect x="15" y="8" width="38" height="24" rx="2.5" fill="#0f172a" stroke="#38bdf8" stroke-width="1.5"/>
            <rect x="18" y="11" width="32" height="18" fill="${isPowered ? '#0c4a6e' : '#1e293b'}"/>
            <text x="34" y="22" fill="#38bdf8" font-size="6.5" font-family="monospace" font-weight="700" text-anchor="middle">C:\&gt; ping</text>
            <polygon points="10,32 58,32 63,39 5,39" fill="#334155" stroke="#64748b" stroke-width="1.2"/>
          </svg>`;

        case 'ont_be6500c':
          return `<svg viewBox="0 0 68 48" fill="none">
            <path d="M16 14 A19 19 0 0 1 52 14" stroke="${waveColor}" stroke-width="1.6" stroke-dasharray="2 2"/>
            <rect x="14" y="12" width="40" height="30" rx="5" fill="#0f172a" stroke="#06b6d4" stroke-width="1.6"/>
            <line x1="20" y1="20" x2="48" y2="20" stroke="#1e293b" stroke-width="1.4"/>
            <circle cx="23" cy="31" r="2.2" fill="${ledColor}"/>
            <circle cx="31" cy="31" r="2.2" fill="${isPowered ? '#38bdf8' : '#475569'}"/>
            <circle cx="39" cy="31" r="2.2" fill="${isPowered ? '#f59e0b' : '#475569'}"/>
            <text x="34" y="18" fill="#22d3ee" font-size="6.2" font-weight="800" font-family="monospace" text-anchor="middle">WIFI 7 • 2.5G</text>
          </svg>`;

        case 'router_mikrotik':
          return `<svg viewBox="0 0 68 48" fill="none">
            <polygon points="9,15 59,15 64,24 4,24" fill="#334155" stroke="#38bdf8" stroke-width="1.3"/>
            <text x="34" y="21.5" fill="#f8fafc" font-size="6.2" font-weight="800" font-family="monospace" text-anchor="middle">MikroTik hEX S</text>
            <rect x="4" y="24" width="60" height="15" rx="2" fill="#0f172a" stroke="#64748b" stroke-width="1.4"/>
            <circle cx="9" cy="31.5" r="1.8" fill="${ledColor}"/>
            <rect x="14" y="28" width="6" height="7" fill="#10b981" stroke="#059669" stroke-width="0.8"/>
            <rect x="23" y="28.5" width="6" height="6" fill="#f59e0b"/>
            <rect x="30.5" y="28.5" width="6" height="6" fill="#0284c7"/>
            <rect x="38" y="28.5" width="6" height="6" fill="#0284c7"/>
            <rect x="45.5" y="28.5" width="6" height="6" fill="#0284c7"/>
            <rect x="53" y="28.5" width="6" height="6" fill="#ef4444"/>
          </svg>`;

        case 'iptv_box':
          return `<svg viewBox="0 0 68 48" fill="none">
            <rect x="12" y="7" width="44" height="24" rx="2.5" fill="#0f172a" stroke="#f97316" stroke-width="1.5"/>
            <rect x="15" y="10" width="38" height="18" fill="${isPowered ? '#431407' : '#1e293b'}"/>
            <text x="34" y="21" fill="#fb923c" font-size="6.5" font-family="monospace" font-weight="800" text-anchor="middle">FPT PLAY 4K</text>
            <rect x="20" y="34" width="28" height="7" rx="2" fill="#1e293b" stroke="#64748b" stroke-width="1.2"/>
            <circle cx="25" cy="37.5" r="1.5" fill="${ledColor}"/>
          </svg>`;

        default:
          return `<svg viewBox="0 0 68 48"><rect x="10" y="12" width="48" height="24" rx="4" fill="#1e293b" stroke="#38bdf8"/></svg>`;
      }
    }

    // 2. FULL 21-DEVICE CATALOG (16 REAL SIMULATORS FROM run_all.py + INFRA/CLIENTS)
    const FPT_CATALOG = {
      // ── NHÓM 1: WI-FI 7 & XGS-PON (4 THIẾT BỊ THẬT) ──────────────────
      'be12000': {
        key: 'be12000',
        realImage: '/assets/devices/be12000.png?v=1',
        folder: 'sim_be12000',
        name: 'ONT ZXHN BE12000Z',
        model: 'BE12000Z',
        svgType: 'ont_wifi7',
        category: 'gateway',
        series: 'wifi7',
        role: 'master',
        roleLabel: 'WIFI7 ONT',
        icon: '🖥️',
        defaultIp: '192.168.1.1',
        macBase: '94:87:E0:AA:BB:01',
        loginUrl: '/sim_be12000/login',
        simUrl: '/sim_be12000/login',
        subPages: [
          { label: '🔐 Đăng Nhập', url: '/sim_be12000/login', displayUrl: 'http://192.168.1.1/login' },
          { label: '🏠 Dashboard', url: '/sim_be12000/?autologin=1', displayUrl: 'http://192.168.1.1/' },
          { label: '🕸️ Sơ Đồ EasyMesh', url: '/sim_be12000/?autologin=1&view=mmTopology', displayUrl: 'http://192.168.1.1/admin/mmTopology' },
          { label: '📶 Wi-Fi 7 MLO', url: '/sim_be12000/?autologin=1&view=WLANMLO', displayUrl: 'http://192.168.1.1/admin/WLANMLO' },
          { label: '📡 Cài Đặt SSID', url: '/sim_be12000/?autologin=1&view=wlanBasic', displayUrl: 'http://192.168.1.1/admin/wlanBasic' },
          { label: '🌐 WAN/LAN', url: '/sim_be12000/?autologin=1&view=ethWanConfig', displayUrl: 'http://192.168.1.1/admin/ethWanConfig' },
          { label: '💡 Quang PON', url: '/sim_be12000/?autologin=1&view=ponopticalinfo', displayUrl: 'http://192.168.1.1/admin/ponopticalinfo' },
          { label: '🔍 Ping/Tracert', url: '/sim_be12000/?autologin=1&view=networkDiag', displayUrl: 'http://192.168.1.1/admin/networkDiag' }
        ],
        ports: [
          { id: 'PON_10G', short: 'PON', name: 'PON (10G XGS-PON)', type: 'fiber', speed: 10000, color: '#f97316', vlan: '35' },
          { id: 'LAN1_10GE', short: 'LAN1(10G)', name: 'LAN 1 (10GE)', type: 'eth', speed: 10000, color: '#f59e0b', tag: '⚡ Tối ưu', vlan: '1' },
          { id: 'LAN2_1GE', short: 'LAN2(1G)', name: 'LAN 2 (1GE)', type: 'eth', speed: 1000, color: '#64748b', vlan: '1' },
          { id: 'LAN3_1GE', short: 'LAN3(1G)', name: 'LAN 3 (1GE)', type: 'eth', speed: 1000, color: '#64748b', vlan: '1' },
          { id: 'LAN4_1GE', short: 'LAN4(1G)', name: 'LAN 4 (1GE)', type: 'eth', speed: 1000, color: '#64748b', vlan: '1' },
          { id: 'WIFI7', short: 'Wi-Fi7', name: 'Wi-Fi 7 MLO', type: 'wifi', speed: 2400, color: '#8b5cf6', vlan: 'WLAN' }
        ]
      },
      'be15000': {
        key: 'be15000',
        realImage: '/assets/devices/be15000.png?v=1',
        folder: 'sim_be15000',
        name: 'AP ZXHN BE15000Z',
        model: 'BE15000Z',
        svgType: 'ap_mesh',
        category: 'ap',
        series: 'wifi7',
        role: 'slave',
        roleLabel: 'WIFI7 MESH',
        icon: '📡',
        defaultIp: '192.168.1.100',
        macBase: 'AA:BB:CC:00:00:15',
        loginUrl: '/sim_be15000/login',
        simUrl: '/sim_be15000/login',
        subPages: [
          { label: '🔐 Đăng Nhập AP', url: '/sim_be15000/login', displayUrl: 'http://192.168.1.100/login' },
          { label: '📊 Trạng Thái AP', url: '/sim_be15000/pages/localNetStatus.html', displayUrl: 'http://192.168.1.100/status' },
          { label: '📶 Wi-Fi 7 MLO', url: '/sim_be15000/pages/wlanmlo.html', displayUrl: 'http://192.168.1.100/wlan_mlo' },
          { label: '🔘 Ghép Cặp WPS', url: '/sim_be15000/pages/wps.html', displayUrl: 'http://192.168.1.100/wps' },
          { label: '🔍 Chẩn Đoán', url: '/sim_be15000/pages/networkDiag.html', displayUrl: 'http://192.168.1.100/diag' }
        ],
        ports: [
          { id: 'WAN_25GE', short: 'WAN(2.5G)', name: 'WAN (2.5GE)', type: 'eth', speed: 2500, color: '#0284c7', tag: '⚡ Cổng chính', vlan: '1' },
          { id: 'LAN_1GE', short: 'LAN(1G)', name: 'LAN (1GE)', type: 'eth', speed: 1000, color: '#64748b', vlan: '1' },
          { id: 'WIFI7', short: 'Wi-Fi7', name: 'Wi-Fi 7 MLO', type: 'wifi', speed: 2400, color: '#8b5cf6', vlan: 'WLAN' }
        ]
      },
      'ont_be6500c': {
        key: 'ont_be6500c',
        realImage: '/assets/devices/ont_be6500c.png?v=1',
        folder: 'sim_ONT_be6500c',
        name: 'ONT Wi-Fi 7 BE6500C',
        model: 'ONT BE6500C',
        svgType: 'ont_be6500c',
        category: 'gateway',
        series: 'wifi7',
        role: 'master',
        roleLabel: 'WIFI7 ONT',
        icon: '🖥️',
        defaultIp: '192.168.1.1',
        macBase: '94:87:E0:65:00:01',
        loginUrl: '/sim_ONT_be6500c/login.html',
        simUrl: '/sim_ONT_be6500c/login.html',
        subPages: [
          { label: '🔐 Đăng Nhập ONT BE6500C', url: '/sim_ONT_be6500c/login.html', displayUrl: 'http://192.168.1.1/login.html' },
          { label: '🏠 Tổng Quan', url: '/sim_ONT_be6500c/home__overview.html', displayUrl: 'http://192.168.1.1/home__overview.html' },
          { label: '🕸️ Sơ Đồ Topology', url: '/sim_ONT_be6500c/home__topology.html', displayUrl: 'http://192.168.1.1/home__topology.html' },
          { label: '📶 Cài Đặt Wi-Fi', url: '/sim_ONT_be6500c/wifi__general.html', displayUrl: 'http://192.168.1.1/wifi__general.html' },
          { label: '🌐 Cấu Hình WAN', url: '/sim_ONT_be6500c/advanced__wan.html', displayUrl: 'http://192.168.1.1/advanced__wan.html' },
          { label: '🔗 LAN & DHCP', url: '/sim_ONT_be6500c/advanced__lan.html', displayUrl: 'http://192.168.1.1/advanced__lan.html' },
          { label: '🔍 Chẩn Đoán', url: '/sim_ONT_be6500c/network__diagnostics.html', displayUrl: 'http://192.168.1.1/network__diagnostics.html' }
        ],
        ports: [
          { id: 'PON_GPON', short: 'PON', name: 'PON (2.5G GPON)', type: 'fiber', speed: 2500, color: '#f97316', vlan: '35' },
          { id: 'LAN1_25GE', short: 'LAN1(2.5G)', name: 'LAN 1 (2.5GE)', type: 'eth', speed: 2500, color: '#f59e0b', tag: '⚡ 2.5G', vlan: '1' },
          { id: 'LAN2_1GE', short: 'LAN2(1G)', name: 'LAN 2 (1GE)', type: 'eth', speed: 1000, color: '#64748b', vlan: '1' },
          { id: 'LAN3_1GE', short: 'LAN3(1G)', name: 'LAN 3 (1GE)', type: 'eth', speed: 1000, color: '#64748b', vlan: '1' },
          { id: 'WIFI7', short: 'Wi-Fi7', name: 'Wi-Fi 7 MLO', type: 'wifi', speed: 2400, color: '#8b5cf6', vlan: 'WLAN' }
        ]
      },
      'be6500c': {
        key: 'be6500c',
        realImage: '/assets/devices/be6500c.png?v=1',
        folder: 'sim_be6500c',
        name: 'AP Mesh Wi-Fi 7 BE6500C',
        model: 'AP BE6500C',
        svgType: 'ap_mesh',
        category: 'ap',
        series: 'wifi7',
        role: 'slave',
        roleLabel: 'WIFI7 AGENT',
        icon: '📡',
        defaultIp: '192.168.1.102',
        macBase: 'AA:BB:CC:65:00:02',
        loginUrl: '/sim_be6500c/login.html',
        simUrl: '/sim_be6500c/login.html',
        subPages: [
          { label: '🔐 Đăng Nhập AP BE6500C', url: '/sim_be6500c/login.html', displayUrl: 'http://192.168.1.102/login.html' },
          { label: '🏠 Tổng Quan', url: '/sim_be6500c/home__overview.html', displayUrl: 'http://192.168.1.102/home__overview.html' },
          { label: '🕸️ Sơ Đồ Topology', url: '/sim_be6500c/home__topology.html', displayUrl: 'http://192.168.1.102/home__topology.html' },
          { label: '📶 Cài Đặt Wi-Fi', url: '/sim_be6500c/wifi__general.html', displayUrl: 'http://192.168.1.102/wifi__general.html' },
          { label: '⚙️ Wi-Fi Nâng Cao', url: '/sim_be6500c/wifi__advanced.html', displayUrl: 'http://192.168.1.102/wifi__advanced.html' },
          { label: '🔗 Cấu Hình LAN', url: '/sim_be6500c/advanced__lan.html', displayUrl: 'http://192.168.1.102/advanced__lan.html' },
          { label: '🔍 Chẩn Đoán', url: '/sim_be6500c/network__diagnostics.html', displayUrl: 'http://192.168.1.102/network__diagnostics.html' }
        ],
        ports: [
          { id: 'WAN_25GE', short: 'WAN(2.5G)', name: 'WAN (2.5GE)', type: 'eth', speed: 2500, color: '#0284c7', tag: '⚡ 2.5G', vlan: '1' },
          { id: 'LAN1_1GE', short: 'LAN1(1G)', name: 'LAN 1 (1GE)', type: 'eth', speed: 1000, color: '#64748b', vlan: '1' },
          { id: 'WIFI7', short: 'Wi-Fi7', name: 'Wi-Fi 7 MLO', type: 'wifi', speed: 2400, color: '#8b5cf6', vlan: 'WLAN' }
        ]
      },

      // ── NHÓM 2: WI-FI 6 GPON & MESH (6 THIẾT BỊ THẬT) ────────────────
      'ax3000gz': {
        key: 'ax3000gz',
        folder: 'sim_ax3000gz',
        name: 'ONT ZXHN AX3000GZ',
        model: 'AX3000GZ',
        realImage: '/assets/devices/ax3000gz.png?v=1',
        svgType: 'ont_gpon',
        category: 'gateway',
        series: 'wifi6',
        role: 'master',
        roleLabel: 'WIFI6 ONT',
        icon: '🖥️',
        defaultIp: '192.168.1.1',
        macBase: '94:87:E0:11:22:01',
        loginUrl: '/sim_ax3000gz/cgi-bin/luci/login',
        simUrl: '/sim_ax3000gz/cgi-bin/luci/login',
        subPages: [
          { label: '🔐 Đăng Nhập', url: '/sim_ax3000gz/cgi-bin/luci/login', displayUrl: 'http://192.168.1.1/login' },
          { label: '🏠 Dashboard', url: '/sim_ax3000gz/cgi-bin/luci/admin/home', displayUrl: 'http://192.168.1.1/cgi-bin/luci/admin/home' },
          { label: '🕸️ EasyMesh', url: '/sim_ax3000gz/cgi-bin/luci/admin/localnetwork/WLAN/mesh', displayUrl: 'http://192.168.1.1/admin/localnetwork/WLAN/mesh' },
          { label: '📶 Cài Đặt Wi-Fi', url: '/sim_ax3000gz/cgi-bin/luci/admin/localnetwork/WLAN/WLANbasic', displayUrl: 'http://192.168.1.1/admin/localnetwork/WLAN/WLANbasic' },
          { label: '🌐 Cấu Hình WAN', url: '/sim_ax3000gz/cgi-bin/luci/admin/internet/wan/interface', displayUrl: 'http://192.168.1.1/admin/internet/wan/interface' },
          { label: '🔗 Trạng Thái LAN', url: '/sim_ax3000gz/cgi-bin/luci/admin/localnetwork/status', displayUrl: 'http://192.168.1.1/admin/localnetwork/status' },
          { label: '💡 Quang PON', url: '/sim_ax3000gz/cgi-bin/luci/admin/internet/status/poninform', displayUrl: 'http://192.168.1.1/admin/internet/status/poninform' },
          { label: '🔍 Ping/Tracert', url: '/sim_ax3000gz/cgi-bin/luci/admin/management/diag/diagnostics', displayUrl: 'http://192.168.1.1/admin/management/diag/diagnostics' }
        ],
        ports: [
          { id: 'PON_GPON', short: 'PON', name: 'PON (GPON)', type: 'fiber', speed: 2500, color: '#f97316', vlan: '35' },
          { id: 'LAN1_1GE', short: 'LAN1', name: 'LAN 1 (1GE)', type: 'eth', speed: 1000, color: '#0284c7', vlan: '1' },
          { id: 'LAN2_1GE', short: 'LAN2', name: 'LAN 2 (1GE)', type: 'eth', speed: 1000, color: '#64748b', vlan: '1' },
          { id: 'LAN3_1GE', short: 'LAN3', name: 'LAN 3 (1GE)', type: 'eth', speed: 1000, color: '#64748b', vlan: '1' },
          { id: 'WIFI6', short: 'Wi-Fi6', name: 'Wi-Fi 6 (160MHz)', type: 'wifi', speed: 1200, color: '#8b5cf6', vlan: 'WLAN' }
        ]
      },
      'ax3000gz_v2': {
        key: 'ax3000gz_v2',
        folder: 'sim_ax3000gz_v2',
        name: 'ONT AX3000GZ V2 (F6201B)',
        model: 'AX3000GZ V2',
        realImage: '/assets/devices/ax3000gz_v2.png?v=1',
        svgType: 'ont_gpon',
        category: 'gateway',
        series: 'wifi6',
        role: 'master',
        roleLabel: 'ZTE F6201B',
        icon: '🖥️',
        defaultIp: '192.168.1.1',
        macBase: '94:87:E0:62:01:B2',
        loginUrl: '/sim_ax3000gz_v2/',
        simUrl: '/sim_ax3000gz_v2/',
        subPages: [
          { label: '🔐 Đăng Nhập F6201B', url: '/sim_ax3000gz_v2/', displayUrl: 'http://192.168.1.1/login' },
          { label: '🏠 Dashboard', url: '/sim_ax3000gz_v2/?autologin=1', displayUrl: 'http://192.168.1.1/' },
          { label: '🕸️ Sơ Đồ EasyMesh', url: '/sim_ax3000gz_v2/?autologin=1&view=mmTopology', displayUrl: 'http://192.168.1.1/admin/mmTopology' },
          { label: '📶 Cài Đặt Wi-Fi', url: '/sim_ax3000gz_v2/?autologin=1&view=wlanBasic', displayUrl: 'http://192.168.1.1/admin/wlanBasic' },
          { label: '🌐 Cấu Hình WAN', url: '/sim_ax3000gz_v2/?autologin=1&view=ethWanConfig', displayUrl: 'http://192.168.1.1/admin/ethWanConfig' },
          { label: '🔗 LAN / DHCP', url: '/sim_ax3000gz_v2/?autologin=1&view=lanMgrIpv4', displayUrl: 'http://192.168.1.1/admin/lanMgrIpv4' },
          { label: '💡 Quang PON', url: '/sim_ax3000gz_v2/?autologin=1&view=ponopticalinfo', displayUrl: 'http://192.168.1.1/admin/ponopticalinfo' },
          { label: '🔍 Chẩn Đoán', url: '/sim_ax3000gz_v2/?autologin=1&view=networkDiag', displayUrl: 'http://192.168.1.1/admin/networkDiag' }
        ],
        ports: [
          { id: 'PON_GPON', short: 'PON', name: 'PON (GPON)', type: 'fiber', speed: 2500, color: '#f97316', vlan: '35' },
          { id: 'LAN1_1GE', short: 'LAN1', name: 'LAN 1 (1GE)', type: 'eth', speed: 1000, color: '#0284c7', vlan: '1' },
          { id: 'LAN2_1GE', short: 'LAN2', name: 'LAN 2 (1GE)', type: 'eth', speed: 1000, color: '#64748b', vlan: '1' },
          { id: 'LAN3_1GE', short: 'LAN3', name: 'LAN 3 (1GE)', type: 'eth', speed: 1000, color: '#64748b', vlan: '1' },
          { id: 'WIFI6', short: 'Wi-Fi6', name: 'Wi-Fi 6 AX3000', type: 'wifi', speed: 1200, color: '#8b5cf6', vlan: 'WLAN' }
        ]
      },
      'ax3000hv2': {
        key: 'ax3000hv2',
        folder: 'sim_ax3000hv2',
        name: 'ONT AX3000HV2',
        model: 'AX3000HV2',
        realImage: '/assets/devices/ax3000hv2.png?v=2',
        svgType: 'ont_gpon',
        category: 'gateway',
        series: 'wifi6',
        role: 'master',
        roleLabel: 'WIFI6 ONT',
        icon: '🖥️',
        defaultIp: '192.168.1.1',
        macBase: '20:BE:B4:0B:16:91',
        loginUrl: '/sim_ax3000hv2/cgi-bin/login.asp',
        simUrl: '/sim_ax3000hv2/cgi-bin/login.asp',
        subPages: [
          { label: '🔐 Đăng Nhập AX3000HV2', url: '/sim_ax3000hv2/cgi-bin/login.asp', displayUrl: 'http://192.168.1.1/cgi-bin/login.asp' },
          { label: '📊 Device Info (FW)', url: '/sim_ax3000hv2/cgi-bin/index.asp?page=status_deviceinfo.asp', displayUrl: 'http://192.168.1.1/cgi-bin/status_deviceinfo.asp' },
          { label: '🕸️ Mesh Setting', url: '/sim_ax3000hv2/cgi-bin/index.asp?page=mesh_basic_setting.asp', displayUrl: 'http://192.168.1.1/cgi-bin/mesh_basic_setting.asp' },
          { label: '🗺️ Mesh Topology', url: '/sim_ax3000hv2/cgi-bin/index.asp?page=mesh_topo.asp', displayUrl: 'http://192.168.1.1/cgi-bin/mesh_topo.asp' },
          { label: '📶 Host SSID (2.4G & 5G)', url: '/sim_ax3000hv2/cgi-bin/index.asp?page=wifi_basic.asp', displayUrl: 'http://192.168.1.1/cgi-bin/wifi_basic.asp' },
          { label: '🔗 Cấu Hình LAN', url: '/sim_ax3000hv2/cgi-bin/index.asp?page=home_lan.asp', displayUrl: 'http://192.168.1.1/cgi-bin/home_lan.asp' },
          { label: '🌐 Cấu Hình WAN', url: '/sim_ax3000hv2/cgi-bin/index.asp?page=home_wan.asp', displayUrl: 'http://192.168.1.1/cgi-bin/home_wan.asp' }
        ],
        ports: [
          { id: 'PON_GPON', short: 'PON', name: 'PON (GPON)', type: 'fiber', speed: 2500, color: '#f97316', vlan: '35' },
          { id: 'LAN1_1GE', short: 'LAN1', name: 'LAN 1 (1GE)', type: 'eth', speed: 1000, color: '#0284c7', vlan: '1' },
          { id: 'LAN2_1GE', short: 'LAN2', name: 'LAN 2 (1GE)', type: 'eth', speed: 1000, color: '#0284c7', vlan: '1' },
          { id: 'LAN3_1GE', short: 'LAN3', name: 'LAN 3 (1GE)', type: 'eth', speed: 1000, color: '#64748b', vlan: '1' },
          { id: 'LAN4_STB', short: 'STB', name: 'STB / LAN 4 (1GE)', type: 'eth', speed: 1000, color: '#64748b', vlan: '1' },
          { id: 'WIFI6', short: 'Wi-Fi6', name: 'Wi-Fi 6', type: 'wifi', speed: 1200, color: '#8b5cf6', vlan: 'WLAN' }
        ]
      },
      'ax3000s': {
        key: 'ax3000s',
        folder: 'sim_ax3000s',
        name: 'ONT AX3000S',
        model: 'AX3000S',
        realImage: '/assets/devices/ax3000s.png?v=1',
        svgType: 'ont_gpon',
        category: 'gateway',
        series: 'wifi6',
        role: 'master',
        roleLabel: 'WIFI6 ONT',
        icon: '🖥️',
        defaultIp: '192.168.1.1',
        macBase: '94:87:E0:30:00:5S',
        loginUrl: '/sim_ax3000s/login.html',
        simUrl: '/sim_ax3000s/login.html',
        subPages: [
          { label: '🔐 Đăng Nhập AX3000S', url: '/sim_ax3000s/login.html', displayUrl: 'http://192.168.1.1/login.html' },
          { label: '🏠 Thiết Bị (Status)', url: '/sim_ax3000s/app.html?view=devinfo', displayUrl: 'http://192.168.1.1/admin/status/overview' },
          { label: '🕸️ Mesh Wi-Fi', url: '/sim_ax3000s/app.html?view=wlanMesh', displayUrl: 'http://192.168.1.1/admin/network/wlanMesh' },
          { label: '📶 Wi-Fi 2.4GHz', url: '/sim_ax3000s/app.html?view=wlanBasicSetting2g', displayUrl: 'http://192.168.1.1/admin/network/wlan2g' },
          { label: '📡 Wi-Fi 5GHz', url: '/sim_ax3000s/app.html?view=wlanBasicSetting5g', displayUrl: 'http://192.168.1.1/admin/network/wlan5g' },
          { label: '🌐 Cấu Hình WAN', url: '/sim_ax3000s/app.html?view=wancfg', displayUrl: 'http://192.168.1.1/admin/network/wan' },
          { label: '🔗 LAN / DHCP', url: '/sim_ax3000s/app.html?view=lancfgv4', displayUrl: 'http://192.168.1.1/admin/network/lan' },
          { label: '🔍 Ping Test', url: '/sim_ax3000s/app.html?view=pingtest', displayUrl: 'http://192.168.1.1/admin/diag/pingtest' }
        ],
        ports: [
          { id: 'PON_GPON', short: 'PON', name: 'PON (GPON)', type: 'fiber', speed: 2500, color: '#f97316', vlan: '35' },
          { id: 'LAN1_1GE', short: 'LAN1', name: 'LAN 1 (1GE)', type: 'eth', speed: 1000, color: '#0284c7', vlan: '1' },
          { id: 'LAN2_1GE', short: 'LAN2', name: 'LAN 2 (1GE)', type: 'eth', speed: 1000, color: '#64748b', vlan: '1' },
          { id: 'WIFI6', short: 'Wi-Fi6', name: 'Wi-Fi 6', type: 'wifi', speed: 1200, color: '#8b5cf6', vlan: 'WLAN' }
        ]
      },
      'ax1800gz': {
        key: 'ax1800gz',
        folder: 'sim_ax1800gz',
        name: 'ONT AX1800GZ (ZTE F6600)',
        model: 'AX1800GZ',
        realImage: '/assets/devices/ax1800gz.png?v=1',
        svgType: 'ont_gpon',
        category: 'gateway',
        series: 'wifi6',
        role: 'master',
        roleLabel: 'ZTE F6600',
        icon: '🖥️',
        defaultIp: '192.168.1.1',
        macBase: '94:87:E0:66:00:18',
        loginUrl: '/sim_ax1800gz/login?logout=1',
        simUrl: '/sim_ax1800gz/login?logout=1',
        subPages: [
          { label: '🔐 Đăng Nhập F6600', url: '/sim_ax1800gz/login?logout=1', displayUrl: 'http://192.168.1.1/login' },
          { label: '🏠 Dashboard', url: '/sim_ax1800gz/?autologin=1', displayUrl: 'http://192.168.1.1/' },
          { label: '🕸️ Sơ Đồ EasyMesh', url: '/sim_ax1800gz/?autologin=1&view=mmTopology', displayUrl: 'http://192.168.1.1/admin/mmTopology' },
          { label: '📶 Cài Đặt Wi-Fi', url: '/sim_ax1800gz/?autologin=1&view=wlanBasic', displayUrl: 'http://192.168.1.1/admin/wlanBasic' },
          { label: '🌐 Cấu Hình WAN', url: '/sim_ax1800gz/?autologin=1&view=ethWanConfig', displayUrl: 'http://192.168.1.1/admin/ethWanConfig' },
          { label: '🔗 LAN / DHCP', url: '/sim_ax1800gz/?autologin=1&view=lanMgrIpv4', displayUrl: 'http://192.168.1.1/admin/lanMgrIpv4' },
          { label: '💡 Quang PON', url: '/sim_ax1800gz/?autologin=1&view=ponopticalinfo', displayUrl: 'http://192.168.1.1/admin/ponopticalinfo' },
          { label: '🔍 Chẩn Đoán', url: '/sim_ax1800gz/?autologin=1&view=networkDiag', displayUrl: 'http://192.168.1.1/admin/networkDiag' }
        ],
        ports: [
          { id: 'PON_GPON', short: 'PON', name: 'PON (GPON)', type: 'fiber', speed: 2500, color: '#f97316', vlan: '35' },
          { id: 'LAN1_1GE', short: 'LAN1', name: 'LAN 1 (1GE)', type: 'eth', speed: 1000, color: '#0284c7', vlan: '1' },
          { id: 'LAN2_1GE', short: 'LAN2', name: 'LAN 2 (1GE)', type: 'eth', speed: 1000, color: '#64748b', vlan: '1' },
          { id: 'WIFI6', short: 'Wi-Fi6', name: 'Wi-Fi 6 AX1800', type: 'wifi', speed: 1000, color: '#8b5cf6', vlan: 'WLAN' }
        ]
      },
      'ax3000c': {
        key: 'ax3000c',
        folder: 'sim_ax3000c',
        name: 'AP ZXHN AX3000C V2',
        model: 'AX3000C',
        realImage: '/assets/devices/ax3000c.png?v=2',
        svgType: 'ap_mesh',
        category: 'ap',
        series: 'wifi6',
        role: 'slave',
        roleLabel: 'WIFI6 MESH',
        icon: '📡',
        defaultIp: '192.168.1.200',
        macBase: '94:F7:17:24:0A:90',
        loginUrl: '/sim_ax3000c/#/login',
        simUrl: '/sim_ax3000c/#/login',
        subPages: [
          { label: '🔐 Đăng Nhập', url: '/sim_ax3000c/#/login', displayUrl: 'http://192.168.100.1/login' },
          { label: '🏠 Tổng Quan LAN', url: '/sim_ax3000c/?autologin=1#/status/lanstatus', displayUrl: 'http://192.168.100.1/#/status/lanstatus' },
          { label: '🌐 Thiết Bị & Mạng', url: '/sim_ax3000c/?autologin=1#/status/topology', displayUrl: 'http://192.168.100.1/#/status/topology' },
          { label: '🕸️ Sơ Đồ EasyMesh', url: '/sim_ax3000c/?autologin=1#/status/easymeshtopo', displayUrl: 'http://192.168.100.1/#/status/easymeshtopo' },
          { label: '📶 Cài Đặt Wi-Fi', url: '/sim_ax3000c/?autologin=1#/network/wifi', displayUrl: 'http://192.168.100.1/#/network/wifi' },
          { label: '🔀 Cấu Hình EasyMesh', url: '/sim_ax3000c/?autologin=1#/network/easymesh', displayUrl: 'http://192.168.100.1/#/network/easymesh' },
          { label: '🌍 Cấu Hình WAN', url: '/sim_ax3000c/?autologin=1#/network/wan', displayUrl: 'http://192.168.100.1/#/network/wan' },
          { label: '🔗 Cấu Hình LAN', url: '/sim_ax3000c/?autologin=1#/network/lan', displayUrl: 'http://192.168.100.1/#/network/lan' },
          { label: '🔍 Chẩn Đoán', url: '/sim_ax3000c/?autologin=1#/network/diagnostics', displayUrl: 'http://192.168.100.1/#/network/diagnostics' }
        ],
        ports: [
          { id: 'WAN_1GE', short: 'WAN', name: 'WAN (1GE)', type: 'eth', speed: 1000, color: '#0284c7', vlan: '1' },
          { id: 'LAN1_1GE', short: 'LAN1', name: 'LAN 1 (1GE)', type: 'eth', speed: 1000, color: '#64748b', vlan: '1' },
          { id: 'LAN2_1GE', short: 'LAN2', name: 'LAN 2 (1GE)', type: 'eth', speed: 1000, color: '#64748b', vlan: '1' },
          { id: 'LAN3_1GE', short: 'LAN3', name: 'LAN 3 (1GE)', type: 'eth', speed: 1000, color: '#64748b', vlan: '1' },
          { id: 'WIFI6', short: 'Wi-Fi6', name: 'Wi-Fi 6', type: 'wifi', speed: 1200, color: '#8b5cf6', vlan: 'WLAN' }
        ]
      },

      // ── NHÓM 3: WI-FI 5 AC1000 SERIES (4 THIẾT BỊ THẬT) ───────────────
      'ac1000f': {
        key: 'ac1000f',
        realImage: '/assets/devices/ac1000f.png?v=1',
        folder: 'sim_ac1000f',
        name: 'ONT AC1000F',
        model: 'AC1000F',
        svgType: 'ont_gpon',
        category: 'gateway',
        series: 'wifi5',
        role: 'master',
        roleLabel: 'BRIDGE/ONT',
        icon: '🖥️',
        defaultIp: '192.168.1.1',
        macBase: '94:87:E0:AC:10:0F',
        loginUrl: '/sim_ac1000f/cgi-bin/login.asp',
        simUrl: '/sim_ac1000f/cgi-bin/login.asp',
        subPages: [
          { label: '🔐 Đăng Nhập AC1000F', url: '/sim_ac1000f/cgi-bin/login.asp', displayUrl: 'http://192.168.1.1/login.asp' },
          { label: '🏠 Tổng Quan', url: '/sim_ac1000f/cgi-bin/index.asp', displayUrl: 'http://192.168.1.1/cgi-bin/index.asp' },
          { label: '📶 Wi-Fi 2.4GHz', url: '/sim_ac1000f/cgi-bin/index.asp?page=home_wireless.asp', displayUrl: 'http://192.168.1.1/cgi-bin/home_wireless.asp' },
          { label: '📡 Wi-Fi 5GHz', url: '/sim_ac1000f/cgi-bin/index.asp?page=home_wireless_5g.asp', displayUrl: 'http://192.168.1.1/cgi-bin/home_wireless_5g.asp' },
          { label: '🌐 Cấu Hình WAN', url: '/sim_ac1000f/cgi-bin/index.asp?page=home_wan.asp', displayUrl: 'http://192.168.1.1/cgi-bin/home_wan.asp' },
          { label: '🔗 Cấu Hình LAN', url: '/sim_ac1000f/cgi-bin/index.asp?page=home_lan.asp', displayUrl: 'http://192.168.1.1/cgi-bin/home_lan.asp' }
        ],
        ports: [
          { id: 'PON', short: 'PON', name: 'PON (GPON)', type: 'fiber', speed: 2500, color: '#f97316', vlan: '35' },
          { id: 'LAN1', short: 'LAN1', name: 'LAN 1 (1GE)', type: 'eth', speed: 1000, color: '#0284c7', vlan: '1' },
          { id: 'LAN2', short: 'LAN2', name: 'LAN 2 (1GE)', type: 'eth', speed: 1000, color: '#64748b', vlan: '1' },
          { id: 'WIFI5', short: 'Wi-Fi5', name: 'Wi-Fi 5 AC1000', type: 'wifi', speed: 867, color: '#8b5cf6', vlan: 'WLAN' }
        ]
      },
      'ac1000hi': {
        key: 'ac1000hi',
        realImage: '/assets/devices/ac1000hi.png?v=1',
        folder: 'sim_ac1000HI',
        name: 'ONT AC1000Hi',
        model: 'AC1000Hi',
        svgType: 'ont_gpon',
        category: 'gateway',
        series: 'wifi5',
        role: 'master',
        roleLabel: 'WIFI5 ONT',
        icon: '🖥️',
        defaultIp: '192.168.1.1',
        macBase: '94:87:E0:AC:10:H1',
        loginUrl: '/sim_ac1000HI/cgi-bin/login.asp',
        simUrl: '/sim_ac1000HI/cgi-bin/login.asp',
        subPages: [
          { label: '🔐 Đăng Nhập AC1000Hi', url: '/sim_ac1000HI/cgi-bin/login.asp', displayUrl: 'http://192.168.1.1/cgi-bin/login.asp' },
          { label: '🏠 Tổng Quan', url: '/sim_ac1000HI/cgi-bin/index.asp?autologin=1', displayUrl: 'http://192.168.1.1/cgi-bin/index.asp' },
          { label: '📶 Wi-Fi 2.4GHz', url: '/sim_ac1000HI/cgi-bin/index.asp?autologin=1&page=home_wireless.asp', displayUrl: 'http://192.168.1.1/cgi-bin/home_wireless.asp' },
          { label: '📡 Wi-Fi 5GHz', url: '/sim_ac1000HI/cgi-bin/index.asp?autologin=1&page=home_wireless_5g.asp', displayUrl: 'http://192.168.1.1/cgi-bin/home_wireless_5g.asp' },
          { label: '🌐 Cấu Hình WAN', url: '/sim_ac1000HI/cgi-bin/index.asp?autologin=1&page=home_wan.asp', displayUrl: 'http://192.168.1.1/cgi-bin/home_wan.asp' },
          { label: '🔗 Cấu Hình LAN', url: '/sim_ac1000HI/cgi-bin/index.asp?autologin=1&page=home_lan.asp', displayUrl: 'http://192.168.1.1/cgi-bin/home_lan.asp' }
        ],
        ports: [
          { id: 'PON', short: 'PON', name: 'PON (GPON)', type: 'fiber', speed: 2500, color: '#f97316', vlan: '35' },
          { id: 'LAN1', short: 'LAN1', name: 'LAN 1 (1GE)', type: 'eth', speed: 1000, color: '#0284c7', vlan: '1' },
          { id: 'LAN2', short: 'LAN2', name: 'LAN 2 (1GE)', type: 'eth', speed: 1000, color: '#64748b', vlan: '1' },
          { id: 'WIFI5', short: 'Wi-Fi5', name: 'Wi-Fi 5 AC1000', type: 'wifi', speed: 867, color: '#8b5cf6', vlan: 'WLAN' }
        ]
      },
      'ac1000z': {
        key: 'ac1000z',
        realImage: '/assets/devices/ac1000z.png?v=1',
        folder: 'sim_ac1000z',
        name: 'ONT AC1000Z (ZTE F671Y)',
        model: 'AC1000Z',
        svgType: 'ont_gpon',
        category: 'gateway',
        series: 'wifi5',
        role: 'master',
        roleLabel: 'ZTE F671Y',
        icon: '🖥️',
        defaultIp: '192.168.1.1',
        macBase: '94:87:E0:67:1Y:01',
        loginUrl: '/sim_ac1000z/',
        simUrl: '/sim_ac1000z/',
        subPages: [
          { label: '🔐 Đăng Nhập F671Y', url: '/sim_ac1000z/', displayUrl: 'http://192.168.1.1/login' },
          { label: '🏠 Dashboard', url: '/sim_ac1000z/?autologin=1', displayUrl: 'http://192.168.1.1/' },
          { label: '📶 Cài Đặt Wi-Fi', url: '/sim_ac1000z/?autologin=1&view=wlanBasic', displayUrl: 'http://192.168.1.1/admin/wlanBasic' },
          { label: '🌐 Cấu Hình WAN', url: '/sim_ac1000z/?autologin=1&view=ethWanConfig', displayUrl: 'http://192.168.1.1/admin/ethWanConfig' },
          { label: '🔗 LAN / DHCP', url: '/sim_ac1000z/?autologin=1&view=lanMgrIpv4', displayUrl: 'http://192.168.1.1/admin/lanMgrIpv4' },
          { label: '💡 Quang PON', url: '/sim_ac1000z/?autologin=1&view=ponopticalinfo', displayUrl: 'http://192.168.1.1/admin/ponopticalinfo' },
          { label: '🔍 Chẩn Đoán', url: '/sim_ac1000z/?autologin=1&view=networkDiag', displayUrl: 'http://192.168.1.1/admin/networkDiag' }
        ],
        ports: [
          { id: 'PON', short: 'PON', name: 'PON (GPON)', type: 'fiber', speed: 2500, color: '#f97316', vlan: '35' },
          { id: 'LAN1', short: 'LAN1', name: 'LAN 1 (1GE)', type: 'eth', speed: 1000, color: '#0284c7', vlan: '1' },
          { id: 'LAN2', short: 'LAN2', name: 'LAN 2 (1GE)', type: 'eth', speed: 1000, color: '#64748b', vlan: '1' },
          { id: 'WIFI5', short: 'Wi-Fi5', name: 'Wi-Fi 5 AC1000', type: 'wifi', speed: 867, color: '#8b5cf6', vlan: 'WLAN' }
        ]
      },
      'ac1000cv2': {
        key: 'ac1000cv2',
        realImage: '/assets/devices/ac1000cv2.png?v=1',
        folder: 'sim_ac1000cv2',
        name: 'ONT/Hub AC1000C V2',
        model: 'AC1000C V2',
        svgType: 'ap_mesh',
        category: 'ap',
        series: 'wifi5',
        role: 'slave',
        roleLabel: 'G-97RG6W',
        icon: '📡',
        defaultIp: '192.168.1.250',
        macBase: '94:87:E0:97:6W:02',
        loginUrl: '/sim_ac1000cv2/login.html',
        simUrl: '/sim_ac1000cv2/login.html',
        subPages: [
          { label: '🔐 Đăng Nhập AC1000C V2', url: '/sim_ac1000cv2/login.html', displayUrl: 'http://192.168.1.250/login.html' },
          { label: '🏠 Tổng Quan', url: '/sim_ac1000cv2/index.html?autologin=1', displayUrl: 'http://192.168.1.250/index.html' },
          { label: '📶 Wi-Fi 2.4GHz', url: '/sim_ac1000cv2/index.html?autologin=1&page=wifibasic.html', displayUrl: 'http://192.168.1.250/wifibasic.html' },
          { label: '📡 Wi-Fi 5GHz', url: '/sim_ac1000cv2/index.html?autologin=1&page=wifi5basic.html', displayUrl: 'http://192.168.1.250/wifi5basic.html' },
          { label: '🌐 Cấu Hình WAN', url: '/sim_ac1000cv2/index.html?autologin=1&page=wan.html', displayUrl: 'http://192.168.1.250/wan.html' },
          { label: '🔗 Cấu Hình LAN', url: '/sim_ac1000cv2/index.html?autologin=1&page=lan.html', displayUrl: 'http://192.168.1.250/lan.html' },
          { label: '🔍 Ping Test', url: '/sim_ac1000cv2/index.html?autologin=1&page=ping.html', displayUrl: 'http://192.168.1.250/ping.html' }
        ],
        ports: [
          { id: 'PON', short: 'PON', name: 'PON (GPON)', type: 'fiber', speed: 2500, color: '#f97316', vlan: '35' },
          { id: 'LAN1', short: 'LAN1', name: 'LAN 1 / WAN (1GE)', type: 'eth', speed: 1000, color: '#0284c7', vlan: '1' },
          { id: 'LAN2', short: 'LAN2', name: 'LAN 2 (1GE)', type: 'eth', speed: 1000, color: '#64748b', vlan: '1' },
          { id: 'WIFI5', short: 'Wi-Fi5', name: 'Wi-Fi 5 AC1000', type: 'wifi', speed: 867, color: '#8b5cf6', vlan: 'WLAN' }
        ]
      },

      // ── NHÓM 4: ROUTER DOANH NGHIỆP SMB & HẠ TẦNG LÕI (4 THIẾT BỊ) ────
      'mikrotik_hexs': {
        key: 'mikrotik_hexs',
        realImage: '/assets/devices/mikrotik_hexs.png?v=1',
        folder: 'sim_mikrotik_hexs',
        name: 'Router MikroTik hEX S',
        model: 'MikroTik hEX S',
        svgType: 'router_mikrotik',
        category: 'gateway',
        series: 'enterprise',
        role: 'master',
        roleLabel: 'ROUTEROS',
        icon: '🛠️',
        defaultIp: '192.168.88.1',
        macBase: 'B8:69:F4:76:00:01',
        loginUrl: '/sim_mikrotik_hexs/index.html',
        simUrl: '/sim_mikrotik_hexs/index.html',
        subPages: [
          { label: '🔐 Đăng Nhập RouterOS', url: '/sim_mikrotik_hexs/index.html', displayUrl: 'http://192.168.88.1/' },
          { label: '🛠️ WebFig Quick Set', url: '/sim_mikrotik_hexs/webfig/?autologin=1#Quick_Set', displayUrl: 'http://192.168.88.1/webfig/#Quick_Set' },
          { label: '🔌 Interfaces', url: '/sim_mikrotik_hexs/webfig/?autologin=1#Interfaces', displayUrl: 'http://192.168.88.1/webfig/#Interfaces' },
          { label: '🔗 Bridge & VLAN', url: '/sim_mikrotik_hexs/webfig/?autologin=1#Bridge', displayUrl: 'http://192.168.88.1/webfig/#Bridge' },
          { label: '🌐 IP Addresses', url: '/sim_mikrotik_hexs/webfig/?autologin=1#IP:Addresses', displayUrl: 'http://192.168.88.1/webfig/#IP:Addresses' },
          { label: '📋 DHCP Server', url: '/sim_mikrotik_hexs/webfig/?autologin=1#IP:DHCP_Server', displayUrl: 'http://192.168.88.1/webfig/#IP:DHCP_Server' },
          { label: '🗺️ IP Routes', url: '/sim_mikrotik_hexs/webfig/?autologin=1#IP:Routes', displayUrl: 'http://192.168.88.1/webfig/#IP:Routes' },
          { label: '🔥 Firewall NAT', url: '/sim_mikrotik_hexs/webfig/?autologin=1#IP:Firewall.NAT', displayUrl: 'http://192.168.88.1/webfig/#IP:Firewall.NAT' }
        ],
        ports: [
          { id: 'sfp1', short: 'sfp1', name: 'SFP1 Optical (1.25G)', type: 'fiber', speed: 1000, color: '#10b981', vlan: 'WAN' },
          { id: 'ether1', short: 'ether1', name: 'ether1 (WAN / PoE-In)', type: 'eth', speed: 1000, color: '#f59e0b', tag: '⚡ WAN1', vlan: 'WAN' },
          { id: 'ether2', short: 'ether2', name: 'ether2 (LAN Bridge)', type: 'eth', speed: 1000, color: '#0284c7', vlan: '88' },
          { id: 'ether3', short: 'ether3', name: 'ether3 (LAN Bridge)', type: 'eth', speed: 1000, color: '#0284c7', vlan: '88' },
          { id: 'ether4', short: 'ether4', name: 'ether4 (LAN Bridge)', type: 'eth', speed: 1000, color: '#0284c7', vlan: '88' },
          { id: 'ether5', short: 'ether5', name: 'ether5 (PoE-Out)', type: 'eth', speed: 1000, color: '#ef4444', vlan: '88' }
        ]
      },
      'vigor2927': {
        key: 'vigor2927',
        realImage: '/assets/devices/vigor2927.png?v=1',
        folder: 'sim_vigor2927',
        name: 'DrayTek Vigor 2927',
        model: 'Vigor 2927',
        svgType: 'router_enterprise',
        category: 'gateway',
        series: 'enterprise',
        role: 'master',
        roleLabel: 'DUAL-WAN',
        icon: '🏢',
        defaultIp: '192.168.1.1',
        macBase: '00:1D:AA:88:29:27',
        loginUrl: '/sim_vigor2927/weblogin.htm',
        simUrl: '/sim_vigor2927/weblogin.htm',
        subPages: [
          { label: '🔐 Đăng Nhập Vigor', url: '/sim_vigor2927/weblogin.htm', displayUrl: 'http://192.168.1.1/weblogin.htm' },
          { label: '🏠 Dashboard Vigor', url: '/sim_vigor2927/index.htm', displayUrl: 'http://192.168.1.1/index.htm' },
          { label: '🌐 WAN Internet', url: '/sim_vigor2927/index.htm?main=%2Fcgi-bin%2Fwan.cgi%3Ffid%3D104', displayUrl: 'http://192.168.1.1/cgi-bin/wan.cgi?fid=104' },
          { label: '🔗 LAN General Setup', url: '/sim_vigor2927/index.htm?main=%2Fcgi-bin%2Fv2x00.cgi%3Ffid%3D2001', displayUrl: 'http://192.168.1.1/cgi-bin/v2x00.cgi?fid=2001' },
          { label: '📶 Wireless LAN', url: '/sim_vigor2927/index.htm?main=%2Fcgi-bin%2Fdualwl.cgi%3Ffid%3D0', displayUrl: 'http://192.168.1.1/cgi-bin/dualwl.cgi?fid=0' },
          { label: '🕸️ VigorMesh Setup', url: '/sim_vigor2927/index.htm?main=%2Fcgi-bin%2Fcgimesh.cgi%3Ffid%3D4', displayUrl: 'http://192.168.1.1/cgi-bin/cgimesh.cgi?fid=4' },
          { label: '🗺️ Routing Table', url: '/sim_vigor2927/index.htm?main=%2Fcgi-bin%2Fiprt.cgi', displayUrl: 'http://192.168.1.1/cgi-bin/iprt.cgi' },
          { label: '🔍 Ping Diagnostics', url: '/sim_vigor2927/index.htm?main=%2Fcgi-bin%2Fv2x00.cgi%3Ffid%3D2095', displayUrl: 'http://192.168.1.1/cgi-bin/v2x00.cgi?fid=2095' }
        ],
        ports: [
          { id: 'WAN1', short: 'WAN1', name: 'WAN 1 (GbE)', type: 'eth', speed: 1000, color: '#f59e0b', tag: '⚡ WAN1', vlan: 'WAN' },
          { id: 'WAN2', short: 'WAN2', name: 'WAN 2 (GbE)', type: 'eth', speed: 1000, color: '#0284c7', tag: '⚡ WAN2', vlan: 'WAN' },
          { id: 'LAN1', short: 'LAN1', name: 'LAN 1 (GbE)', type: 'eth', speed: 1000, color: '#64748b', vlan: '1' },
          { id: 'LAN2', short: 'LAN2', name: 'LAN 2 (GbE)', type: 'eth', speed: 1000, color: '#64748b', vlan: '1' }
        ]
      },
      'switch_2960': {
        key: 'switch_2960',
        name: 'Switch Multi-Gig 2.5G',
        model: 'SW-5P-2.5GE',
        svgType: 'switch_l2',
        category: 'infra',
        series: 'enterprise',
        role: 'core',
        roleLabel: 'SWITCH L2',
        icon: '🔀',
        defaultIp: '192.168.1.2',
        macBase: '00:0C:29:SW:25:01',
        simUrl: null,
        ports: [
          { id: 'Gi0_1', short: 'Te0/1', name: 'Port 1 Uplink (10GE)', type: 'eth', speed: 10000, color: '#f59e0b', vlan: 'Trunk' },
          { id: 'Gi0_2', short: 'Tw0/2', name: 'Port 2 (2.5GE)', type: 'eth', speed: 2500, color: '#0284c7', vlan: '1' },
          { id: 'Gi0_3', short: 'Tw0/3', name: 'Port 3 (2.5GE)', type: 'eth', speed: 2500, color: '#0284c7', vlan: '1' },
          { id: 'Gi0_4', short: 'Tw0/4', name: 'Port 4 (2.5GE)', type: 'eth', speed: 2500, color: '#0284c7', vlan: '1' }
        ]
      },
      'olt_cloud': {
        key: 'olt_cloud',
        name: 'FPT Optical Core OLT',
        model: 'OLT_XGSPON',
        svgType: 'olt_core',
        category: 'infra',
        series: 'enterprise',
        role: 'core',
        roleLabel: 'CORE OLT',
        icon: '🌐',
        defaultIp: '10.0.0.1',
        macBase: '00:FP:T0:00:00:01',
        simUrl: null,
        ports: [
          { id: 'OPT_XGSPON', short: 'XGS-PON', name: 'XGS-PON (10G)', type: 'fiber', speed: 10000, color: '#f97316', vlan: 'Core' },
          { id: 'OPT_GPON', short: 'GPON', name: 'GPON (2.5G)', type: 'fiber', speed: 2500, color: '#ea580c', vlan: 'Core' }
        ]
      },

      // ── NHÓM 5: THIẾT BỊ ĐẦU CUỐI KHÁCH HÀNG / KTV (3 THIẾT BỊ) ──────
      'phone_ktv': {
        key: 'phone_ktv',
        name: 'Smartphone KTV',
        model: 'Phone_WiFi7',
        svgType: 'phone_client',
        category: 'client',
        series: 'client',
        role: 'client',
        roleLabel: 'CLIENT',
        icon: '📱',
        defaultIp: '192.168.1.150',
        macBase: '34:E1:2D:88:99:AA',
        simUrl: null,
        ports: [
          { id: 'WLAN0', short: 'WLAN0', name: 'Wi-Fi 7 Client', type: 'wifi', speed: 2400, color: '#8b5cf6', vlan: 'WLAN' }
        ]
      },
      'laptop_pc': {
        key: 'laptop_pc',
        name: 'Laptop Kỹ Thuật Viên',
        model: 'Laptop_KTV',
        svgType: 'laptop_client',
        category: 'client',
        series: 'client',
        role: 'client',
        roleLabel: 'CLIENT',
        icon: '💻',
        defaultIp: '192.168.1.155',
        macBase: '50:EB:F6:12:90:CC',
        simUrl: null,
        ports: [
          { id: 'ETH0', short: 'ETH0', name: 'Ethernet RJ-45 (2.5G)', type: 'eth', speed: 2500, color: '#0284c7', vlan: '1' },
          { id: 'WLAN0', short: 'WLAN0', name: 'Wi-Fi Client', type: 'wifi', speed: 1200, color: '#8b5cf6', vlan: 'WLAN' }
        ]
      },
      'fpt_playbox': {
        key: 'fpt_playbox',
        name: 'FPT Play Box 4K (IPTV)',
        model: 'FPT_Play_4K',
        svgType: 'iptv_box',
        category: 'client',
        series: 'client',
        role: 'client',
        roleLabel: 'IPTV BOX',
        icon: '📺',
        defaultIp: '192.168.1.180',
        macBase: 'F8:E4:3B:4K:TV:01',
        simUrl: null,
        ports: [
          { id: 'ETH0', short: 'ETH0', name: 'LAN IPTV (1000M)', type: 'eth', speed: 1000, color: '#f97316', vlan: '36' },
          { id: 'WLAN0', short: 'WLAN0', name: 'Wi-Fi 6 IPTV', type: 'wifi', speed: 1200, color: '#8b5cf6', vlan: 'WLAN' }
        ]
      }
    };

