/**
 * devices/vigor2927/lessons/bai4.js
 * Bài 4: Cấu hình DHCP trên DrayTek Vigor2927
 */

window.DEVICE_VIGOR2927_LESSONS = window.DEVICE_VIGOR2927_LESSONS || [];

window.DEVICE_VIGOR2927_LESSONS.push({
  id: 'vg2927-bai4',
  title: 'Cấu hình DHCP',
  subtitle: 'Cấu hình dịch vụ DHCP Server',
  instructions: [
    '<b>Yêu cầu:</b>',
    '- IP Address: <span class="val">192.168.100.1</span>',
    '- Subnet Mask: <span class="val">255.255.255.0 / 24</span>',
    '- Start IP Address: <span class="val">192.168.100.10</span>',
    '- IP Pool Counts: <span class="val">200</span>',
    '- Gateway IP Address: <span class="val">192.168.100.1</span>',
    '- Lease Time: <span class="val">86400</span>'
  ],
  practiceUrl: '/sim_vigor2927/weblogin.htm',
  grading: {
    description: 'Kiểm tra cấu hình DHCP Vigor2927',
    rules: [
      {
        id: 'dhcp_lan_ip',
        name: 'Hàng IP Address: 192.168.100.1',
        selector: 'input[name="sLanIp"]',
        expected: '192.168.100.1',
        type: 'text_exact',
        required: true
      },
      {
        id: 'dhcp_lan_mask',
        name: 'Hàng Subnet Mask: 255.255.255.0/24',
        selector: 'select[name="sLanMask"]',
        expected: '255.255.255.0/24',
        type: 'text_exact',
        required: true
      },
      {
        id: 'dhcp_server_enable',
        name: 'Hàng Enable Server: Option Enable Server được chọn',
        selector: 'input[name="sDHCP"][value="1"]',
        expected: 'Enable Server (Bật)',
        type: 'text_exact',
        required: true
      },
      {
        id: 'dhcp_start_ip',
        name: 'Hàng Start IP Address: 192.168.100.10',
        selector: 'input[name="sDHCPStIP"]',
        expected: '192.168.100.10',
        type: 'text_exact',
        required: true
      },
      {
        id: 'dhcp_pool_counts',
        name: 'Hàng IP Pool Counts: 200',
        selector: 'input[name="iDHCPNo"]',
        expected: '200',
        type: 'text_exact',
        required: true
      },
      {
        id: 'dhcp_gateway_ip',
        name: 'Hàng Gateway IP Address: 192.168.100.1',
        selector: 'input[name="sDHCPGwIP"]',
        expected: '192.168.100.1',
        type: 'text_exact',
        required: true
      },
      {
        id: 'dhcp_lease_time',
        name: 'Hàng Lease Time: 86400',
        selector: 'input[name="sDHCPLsTime"]',
        expected: '86400',
        type: 'text_exact',
        required: true
      },
      {
        id: 'dhcp_rip',
        name: 'RIP Protocol Control giữ nguyên mặc định: Disable',
        selector: 'select[name="iRIPLAN"]',
        expected: 'Disable',
        type: 'text_exact',
        required: true
      },
      {
        id: 'dhcp_clear_lease',
        name: 'Clear DHCP lease for inactive clients giữ nguyên mặc định: Bật',
        selector: 'input[name="chkrmclnts"]',
        expected: 'Bật (checked)',
        type: 'text_exact',
        required: true
      },
      {
        id: 'dhcp_dns_primary',
        name: 'Primary IP Address (DNS) giữ nguyên mặc định: Trống',
        selector: 'input[name="sDNSPri"]',
        expected: '(trống)',
        type: 'text_exact',
        required: true
      },
      {
        id: 'dhcp_dns_secondary',
        name: 'Secondary IP Address (DNS) giữ nguyên mặc định: Trống',
        selector: 'input[name="sDNSSnd"]',
        expected: '(trống)',
        type: 'text_exact',
        required: true
      }
    ],
    customGrading: function (allDocs) {
      let docEnet = null;
      for (const d of allDocs) {
        try {
          if (d.querySelector('input[name="sLanIp"]') || (d.location && d.location.href.toLowerCase().includes('enet.sht'))) {
            docEnet = d;
            break;
          }
        } catch (e) { }
      }

      if (!docEnet) {
        return {
          passed: false,
          score: 0,
          passedCount: 0,
          totalRules: 11,
          details: [
            {
              id: 'not_on_page',
              name: 'Trang cấu hình LAN 1 TCP / IP and DHCP',
              expected: 'Đã vào trang LAN 1 Details Page',
              actual: 'Chưa mở trang Details Page',
              passed: false,
              message: 'Vui lòng nhấn Details Page tại hàng LAN 1 để thực hiện cấu hình'
            }
          ]
        };
      }

      const isSaved = !!docEnet._ftcIsSaved;

      // 1. IP Address
      const ipEl = docEnet.querySelector('input[name="sLanIp"]');
      const actualIp = ipEl ? ipEl.value.trim() : '';
      const ipPassed = (actualIp === '192.168.100.1') && isSaved;

      // 2. Subnet Mask
      const maskEl = docEnet.querySelector('select[name="sLanMask"]');
      let actualMask = '';
      let maskPassed = false;
      if (maskEl) {
        const opt = maskEl.options[maskEl.selectedIndex];
        actualMask = opt ? (opt.text || opt.value || '').trim() : maskEl.value.trim();
        if (maskEl.value === '255.255.255.0' || actualMask.includes('255.255.255.0')) {
          maskPassed = true;
        }
      }
      maskPassed = maskPassed && isSaved;

      // 3. Enable Server (sDHCP radio value = 1)
      const dhcpRadio = docEnet.querySelector('input[name="sDHCP"]:checked');
      const dhcpVal = dhcpRadio ? dhcpRadio.value : '';
      const dhcpPassed = (dhcpVal === '1') && isSaved;

      // 4. Start IP Address
      const startIpEl = docEnet.querySelector('input[name="sDHCPStIP"]');
      const actualStartIp = startIpEl ? startIpEl.value.trim() : '';
      const startIpPassed = (actualStartIp === '192.168.100.10') && isSaved;

      // 5. IP Pool Counts
      const poolEl = docEnet.querySelector('input[name="iDHCPNo"]');
      const actualPool = poolEl ? poolEl.value.trim() : '';
      const poolPassed = (actualPool === '200') && isSaved;

      // 6. Gateway IP Address
      const gwEl = docEnet.querySelector('input[name="sDHCPGwIP"]');
      const actualGw = gwEl ? gwEl.value.trim() : '';
      const gwPassed = (actualGw === '192.168.100.1') && isSaved;

      // 7. Lease Time
      const leaseEl = docEnet.querySelector('input[name="sDHCPLsTime"]');
      const actualLease = leaseEl ? leaseEl.value.trim() : '';
      const leasePassed = (actualLease === '86400') && isSaved;

      // 8-11. Cac gia tri mac dinh giu nguyen (tach rieng tung tieu chi de bao loi chinh xac)
      const ripEl = docEnet.querySelector('select[name="iRIPLAN"]');
      const ripVal = ripEl ? ripEl.value : '0';
      const ripPassed = (ripVal === '0') && isSaved;

      const chkrmEl = docEnet.querySelector('input[name="chkrmclnts"]');
      const chkrmVal = chkrmEl ? chkrmEl.checked : true;
      const clearLeasePassed = (chkrmVal === true) && isSaved;

      const dnsPriEl = docEnet.querySelector('input[name="sDNSPri"]');
      const dnsPriVal = dnsPriEl ? dnsPriEl.value.trim() : '';
      const dnsPriPassed = (dnsPriVal === '') && isSaved;

      const dnsSndEl = docEnet.querySelector('input[name="sDNSSnd"]');
      const dnsSndVal = dnsSndEl ? dnsSndEl.value.trim() : '';
      const dnsSndPassed = (dnsSndVal === '') && isSaved;

      const details = [
        {
          id: 'dhcp_lan_ip',
          name: 'Hàng IP Address: 192.168.100.1',
          expected: '192.168.100.1',
          actual: actualIp || '(trống)',
          passed: ipPassed,
          message: ipPassed ? 'Chính xác' : (!isSaved ? 'Chưa bấm OK để lưu cấu hình' : `Địa chỉ IP không đúng (đang là ${actualIp || 'trống'})`)
        },
        {
          id: 'dhcp_lan_mask',
          name: 'Hàng Subnet Mask: 255.255.255.0/24',
          expected: '255.255.255.0/24',
          actual: actualMask || '(trống)',
          passed: maskPassed,
          message: maskPassed ? 'Chính xác' : (!isSaved ? 'Chưa bấm OK để lưu cấu hình' : `Subnet Mask không đúng (đang là ${actualMask})`)
        },
        {
          id: 'dhcp_server_enable',
          name: 'Hàng Enable Server: Option Enable Server được chọn',
          expected: 'Enable Server (Bật)',
          actual: dhcpVal === '1' ? 'Enable Server' : (dhcpVal === '0' ? 'Disable' : (dhcpVal === '4' ? 'Relay Agent' : 'Chưa chọn')),
          passed: dhcpPassed,
          message: dhcpPassed ? 'Chính xác' : (!isSaved ? 'Chưa bấm OK để lưu cấu hình' : 'Chưa chọn Enable Server')
        },
        {
          id: 'dhcp_start_ip',
          name: 'Hàng Start IP Address: 192.168.100.10',
          expected: '192.168.100.10',
          actual: actualStartIp || '(trống)',
          passed: startIpPassed,
          message: startIpPassed ? 'Chính xác' : (!isSaved ? 'Chưa bấm OK để lưu cấu hình' : `Start IP Address không đúng (đang là ${actualStartIp || 'trống'})`)
        },
        {
          id: 'dhcp_pool_counts',
          name: 'Hàng IP Pool Counts: 200',
          expected: '200',
          actual: actualPool || '(trống)',
          passed: poolPassed,
          message: poolPassed ? 'Chính xác' : (!isSaved ? 'Chưa bấm OK để lưu cấu hình' : `IP Pool Counts không đúng (đang là ${actualPool || 'trống'})`)
        },
        {
          id: 'dhcp_gateway_ip',
          name: 'Hàng Gateway IP Address: 192.168.100.1',
          expected: '192.168.100.1',
          actual: actualGw || '(trống)',
          passed: gwPassed,
          message: gwPassed ? 'Chính xác' : (!isSaved ? 'Chưa bấm OK để lưu cấu hình' : `Gateway IP Address không đúng (đang là ${actualGw || 'trống'})`)
        },
        {
          id: 'dhcp_lease_time',
          name: 'Hàng Lease Time: 86400',
          expected: '86400',
          actual: actualLease || '(trống)',
          passed: leasePassed,
          message: leasePassed ? 'Chính xác' : (!isSaved ? 'Chưa bấm OK để lưu cấu hình' : `Lease Time không đúng (đang là ${actualLease || 'trống'})`)
        },
        {
          id: 'dhcp_rip',
          name: 'RIP Protocol Control giữ nguyên mặc định: Disable',
          expected: 'Disable',
          actual: ripVal === '0' ? 'Disable' : (ripVal === '1' ? 'Enable' : ripVal),
          passed: ripPassed,
          message: ripPassed ? 'Chính xác' : (!isSaved ? 'Chưa bấm OK để lưu cấu hình' : 'RIP Protocol Control đã bị đổi khỏi mặc định Disable')
        },
        {
          id: 'dhcp_clear_lease',
          name: 'Clear DHCP lease for inactive clients giữ nguyên mặc định: Bật',
          expected: 'Bật (checked)',
          actual: chkrmVal ? 'Bật (checked)' : 'Tắt (unchecked)',
          passed: clearLeasePassed,
          message: clearLeasePassed ? 'Chính xác' : (!isSaved ? 'Chưa bấm OK để lưu cấu hình' : 'Tùy chọn "Clear DHCP lease for inactive clients periodically" đã bị bỏ chọn')
        },
        {
          id: 'dhcp_dns_primary',
          name: 'Primary IP Address (DNS) giữ nguyên mặc định: Trống',
          expected: '(trống)',
          actual: dnsPriVal || '(trống)',
          passed: dnsPriPassed,
          message: dnsPriPassed ? 'Chính xác' : (!isSaved ? 'Chưa bấm OK để lưu cấu hình' : `Primary IP Address phải để trống (đang là ${dnsPriVal})`)
        },
        {
          id: 'dhcp_dns_secondary',
          name: 'Secondary IP Address (DNS) giữ nguyên mặc định: Trống',
          expected: '(trống)',
          actual: dnsSndVal || '(trống)',
          passed: dnsSndPassed,
          message: dnsSndPassed ? 'Chính xác' : (!isSaved ? 'Chưa bấm OK để lưu cấu hình' : `Secondary IP Address phải để trống (đang là ${dnsSndVal})`)
        }
      ];

      const totalRules = details.length;
      const passedCount = details.filter(d => d.passed).length;
      const score = Math.round((passedCount / totalRules) * 100);
      const passed = (passedCount === totalRules);

      return {
        passed: passed,
        score: score,
        passedCount: passedCount,
        totalRules: totalRules,
        details: details
      };
    }
  },
  guidePopups: (window.TOOLTIPS_VIGOR2927 && window.TOOLTIPS_VIGOR2927['vg2927-bai4']) || [
    {
      selector: '#menu-lan:not(.open) .menu-text, #menu-lan:not(.open)',
      text: 'Bước 1: chọn LAN',
      position: 'bottom',
      hideOnPage: 'enet1|sht'
    },
    {
      selector: '#sub-lan:not(.hidden) #menu-lan-general .menu-text, #sub-lan:not(.hidden) #menu-lan-general',
      text: 'Bước 2: chọn General Setup',
      position: 'bottom',
      hideOnPage: 'enet1|sht'
    },
    {
      selector: '#lan1 input[name="btnDtPage0"], input[name="btnDtPage0"], #lan1 input[value="Details Page"]',
      text: 'Bước 3: chọn Details Page',
      position: 'top',
      hideOnPage: 'sht'
    },
    {
      selector: 'select[name="sLanMask"]',
      text: 'Bước 4: điền IP Address 192.168.100.1<br>chọn Subnet Mask 255.255.255.0',
      position: 'bottom',
      page: 'sht'
    },
    {
      selector: 'input[name="sDHCP"][value="1"] + translate, input[name="sDHCP"][value="1"]',
      text: 'Bước 5: chọn Enable Server<br>- Start IP Address: 192.168.100.10<br>- IP Pool Counts: 200<br>- Gateway IP Address: 192.168.100.1<br>- Lease Time: 86400',
      position: 'top',
      minTop: -4,
      offsetY: 3,
      page: 'sht'
    },
    {
      selector: 'input[name="btnOK"], input[value="OK"]',
      text: 'Bước 5: chọn OK',
      position: 'top',
      page: 'sht'
    }
  ]
});

