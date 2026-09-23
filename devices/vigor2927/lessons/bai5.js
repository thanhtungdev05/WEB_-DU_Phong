/**
 * devices/vigor2927/lessons/bai5.js
 * Bài 5: Cấu hình DNS trên DrayTek Vigor2927
 */

window.DEVICE_VIGOR2927_LESSONS = window.DEVICE_VIGOR2927_LESSONS || [];

window.DEVICE_VIGOR2927_LESSONS.push({
  id: 'vg2927-bai5',
  title: 'Cấu hình DNS',
  subtitle: 'Cấu hình hệ thống phân giải tên miền (DNS)',
  instructions: [
    '<b>Yêu cầu:</b>',
    'Thực hiện cấu hình DNS Server trên thiết bị DrayTek Vigor2927:',
    '- Username: <span class="val">admin</span>',
    '- Password: <span class="val">admin</span>',
    '- Vào <b>LAN >> General Setup</b>, chọn <b>Details Page</b> của <b>LAN 1</b>',
    '- Primary IP Address: <span class="val">210.245.31.220</span>',
    '- Secondary IP Address: <span class="val">8.8.8.8</span>',
    '- Các thông số khác giữ nguyên giá trị mặc định ban đầu',
    '- Nhấn <b>OK</b> để lưu cấu hình'
  ],
  practiceUrl: '/sim_vigor2927/weblogin.htm',
  clearFields: [
    'input[name="sDNSPri"]',
    'input[name="sDNSSnd"]'
  ],
  grading: {
    description: 'Kiểm tra cấu hình DNS Vigor2927',
    rules: [
      {
        id: 'dns_primary',
        name: 'Hàng Primary IP Address: 210.245.31.220',
        selector: 'input[name="sDNSPri"]',
        expected: '210.245.31.220',
        type: 'text_exact',
        required: true
      },
      {
        id: 'dns_secondary',
        name: 'Hàng Secondary IP Address: 8.8.8.8',
        selector: 'input[name="sDNSSnd"]',
        expected: '8.8.8.8',
        type: 'text_exact',
        required: true
      },
      {
        id: 'dns_lan_ip',
        name: 'Hàng IP Address giữ nguyên mặc định: 192.168.1.1',
        selector: 'input[name="sLanIp"]',
        expected: '192.168.1.1',
        type: 'text_exact',
        required: true
      },
      {
        id: 'dns_lan_mask',
        name: 'Hàng Subnet Mask giữ nguyên mặc định: 255.255.255.0/24',
        selector: 'select[name="sLanMask"]',
        expected: '255.255.255.0',
        type: 'text_exact',
        required: true
      },
      {
        id: 'dns_rip',
        name: 'RIP Protocol Control giữ nguyên mặc định: Disable',
        selector: 'select[name="iRIPLAN"]',
        expected: 'Disable',
        type: 'text_exact',
        required: true
      },
      {
        id: 'dns_dhcp_enable',
        name: 'Hàng DHCP Server giữ nguyên mặc định: Enable Server',
        selector: 'input[name="sDHCP"][value="1"]',
        expected: 'Enable Server (Bật)',
        type: 'text_exact',
        required: true
      },
      {
        id: 'dns_start_ip',
        name: 'Hàng Start IP Address giữ nguyên mặc định: 192.168.1.10',
        selector: 'input[name="sDHCPStIP"]',
        expected: '192.168.1.10',
        type: 'text_exact',
        required: true
      },
      {
        id: 'dns_pool_counts',
        name: 'Hàng IP Pool Counts giữ nguyên mặc định: 200',
        selector: 'input[name="iDHCPNo"]',
        expected: '200',
        type: 'text_exact',
        required: true
      },
      {
        id: 'dns_gateway_ip',
        name: 'Hàng Gateway IP Address giữ nguyên mặc định: 192.168.1.1',
        selector: 'input[name="sDHCPGwIP"]',
        expected: '192.168.1.1',
        type: 'text_exact',
        required: true
      },
      {
        id: 'dns_lease_time',
        name: 'Hàng Lease Time giữ nguyên mặc định: 86400',
        selector: 'input[name="sDHCPLsTime"]',
        expected: '86400',
        type: 'text_exact',
        required: true
      },
      {
        id: 'dns_clear_lease',
        name: 'Clear DHCP lease for inactive clients giữ nguyên mặc định: Bật',
        selector: 'input[name="chkrmclnts"]',
        expected: 'Bật (checked)',
        type: 'text_exact',
        required: true
      }
    ],
    customGrading: function(allDocs) {
      let docEnet = null;
      for (const d of allDocs) {
        try {
          if (d.querySelector('input[name="sDNSPri"]') || (d.location && d.location.href.toLowerCase().includes('enet.sht'))) {
            docEnet = d;
            break;
          }
        } catch(e) {}
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

      // 1. Primary IP Address (DNS)
      const dnsPriEl = docEnet.querySelector('input[name="sDNSPri"]');
      const actualDnsPri = dnsPriEl ? dnsPriEl.value.trim() : '';
      const dnsPriPassed = (actualDnsPri === '210.245.31.220') && isSaved;

      // 2. Secondary IP Address (DNS)
      const dnsSndEl = docEnet.querySelector('input[name="sDNSSnd"]');
      const actualDnsSnd = dnsSndEl ? dnsSndEl.value.trim() : '';
      const dnsSndPassed = (actualDnsSnd === '8.8.8.8') && isSaved;

      // 3. IP Address (mặc định 192.168.1.1)
      const ipEl = docEnet.querySelector('input[name="sLanIp"]');
      const actualIp = ipEl ? ipEl.value.trim() : '';
      const ipPassed = (actualIp === '192.168.1.1') && isSaved;

      // 4. Subnet Mask (mặc định 255.255.255.0/24)
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

      // 5. RIP Protocol Control (mặc định Disable / '0')
      const ripEl = docEnet.querySelector('select[name="iRIPLAN"]');
      const ripVal = ripEl ? ripEl.value : '0';
      const ripPassed = (ripVal === '0') && isSaved;

      // 6. DHCP Server Enable (mặc định Enable Server / '1')
      const dhcpRadio = docEnet.querySelector('input[name="sDHCP"]:checked');
      const dhcpVal = dhcpRadio ? dhcpRadio.value : '';
      const dhcpPassed = (dhcpVal === '1') && isSaved;

      // 7. Start IP Address (mặc định 192.168.1.10)
      const startIpEl = docEnet.querySelector('input[name="sDHCPStIP"]');
      const actualStartIp = startIpEl ? startIpEl.value.trim() : '';
      const startIpPassed = (actualStartIp === '192.168.1.10') && isSaved;

      // 8. IP Pool Counts (mặc định 200)
      const poolEl = docEnet.querySelector('input[name="iDHCPNo"]');
      const actualPool = poolEl ? poolEl.value.trim() : '';
      const poolPassed = (actualPool === '200') && isSaved;

      // 9. Gateway IP Address (mặc định 192.168.1.1)
      const gwEl = docEnet.querySelector('input[name="sDHCPGwIP"]');
      const actualGw = gwEl ? gwEl.value.trim() : '';
      const gwPassed = (actualGw === '192.168.1.1') && isSaved;

      // 10. Lease Time (mặc định 86400)
      const leaseEl = docEnet.querySelector('input[name="sDHCPLsTime"]');
      const actualLease = leaseEl ? leaseEl.value.trim() : '';
      const leasePassed = (actualLease === '86400') && isSaved;

      // 11. Clear DHCP lease checkbox (mặc định Bật / true)
      const chkrmEl = docEnet.querySelector('input[name="chkrmclnts"]');
      const chkrmVal = chkrmEl ? chkrmEl.checked : true;
      const clearLeasePassed = (chkrmVal === true) && isSaved;

      const details = [
        {
          id: 'dns_primary',
          name: 'Hàng Primary IP Address: 210.245.31.220',
          expected: '210.245.31.220',
          actual: actualDnsPri || '(trống)',
          passed: dnsPriPassed,
          message: dnsPriPassed ? 'Chính xác' : (!isSaved ? 'Chưa bấm OK để lưu cấu hình' : `Primary IP Address không đúng (đang là ${actualDnsPri || 'trống'})`)
        },
        {
          id: 'dns_secondary',
          name: 'Hàng Secondary IP Address: 8.8.8.8',
          expected: '8.8.8.8',
          actual: actualDnsSnd || '(trống)',
          passed: dnsSndPassed,
          message: dnsSndPassed ? 'Chính xác' : (!isSaved ? 'Chưa bấm OK để lưu cấu hình' : `Secondary IP Address không đúng (đang là ${actualDnsSnd || 'trống'})`)
        },
        {
          id: 'dns_lan_ip',
          name: 'Hàng IP Address giữ nguyên mặc định: 192.168.1.1',
          expected: '192.168.1.1',
          actual: actualIp || '(trống)',
          passed: ipPassed,
          message: ipPassed ? 'Chính xác' : (!isSaved ? 'Chưa bấm OK để lưu cấu hình' : `Địa chỉ IP mặc định bị thay đổi (đang là ${actualIp || 'trống'})`)
        },
        {
          id: 'dns_lan_mask',
          name: 'Hàng Subnet Mask giữ nguyên mặc định: 255.255.255.0/24',
          expected: '255.255.255.0/24',
          actual: actualMask || '(trống)',
          passed: maskPassed,
          message: maskPassed ? 'Chính xác' : (!isSaved ? 'Chưa bấm OK để lưu cấu hình' : `Subnet Mask mặc định bị thay đổi (đang là ${actualMask})`)
        },
        {
          id: 'dns_rip',
          name: 'RIP Protocol Control giữ nguyên mặc định: Disable',
          expected: 'Disable',
          actual: ripVal === '0' ? 'Disable' : 'Enable',
          passed: ripPassed,
          message: ripPassed ? 'Chính xác' : (!isSaved ? 'Chưa bấm OK để lưu cấu hình' : 'RIP Protocol Control mặc định bị thay đổi')
        },
        {
          id: 'dns_dhcp_enable',
          name: 'Hàng DHCP Server giữ nguyên mặc định: Enable Server',
          expected: 'Enable Server (Bật)',
          actual: dhcpVal === '1' ? 'Enable Server' : (dhcpVal === '0' ? 'Disable' : (dhcpVal === '4' ? 'Relay Agent' : 'Chưa chọn')),
          passed: dhcpPassed,
          message: dhcpPassed ? 'Chính xác' : (!isSaved ? 'Chưa bấm OK để lưu cấu hình' : 'DHCP Server mặc định bị thay đổi')
        },
        {
          id: 'dns_start_ip',
          name: 'Hàng Start IP Address giữ nguyên mặc định: 192.168.1.10',
          expected: '192.168.1.10',
          actual: actualStartIp || '(trống)',
          passed: startIpPassed,
          message: startIpPassed ? 'Chính xác' : (!isSaved ? 'Chưa bấm OK để lưu cấu hình' : `Start IP Address mặc định bị thay đổi (đang là ${actualStartIp || 'trống'})`)
        },
        {
          id: 'dns_pool_counts',
          name: 'Hàng IP Pool Counts giữ nguyên mặc định: 200',
          expected: '200',
          actual: actualPool || '(trống)',
          passed: poolPassed,
          message: poolPassed ? 'Chính xác' : (!isSaved ? 'Chưa bấm OK để lưu cấu hình' : `IP Pool Counts mặc định bị thay đổi (đang là ${actualPool || 'trống'})`)
        },
        {
          id: 'dns_gateway_ip',
          name: 'Hàng Gateway IP Address giữ nguyên mặc định: 192.168.1.1',
          expected: '192.168.1.1',
          actual: actualGw || '(trống)',
          passed: gwPassed,
          message: gwPassed ? 'Chính xác' : (!isSaved ? 'Chưa bấm OK để lưu cấu hình' : `Gateway IP Address mặc định bị thay đổi (đang là ${actualGw || 'trống'})`)
        },
        {
          id: 'dns_lease_time',
          name: 'Hàng Lease Time giữ nguyên mặc định: 86400',
          expected: '86400',
          actual: actualLease || '(trống)',
          passed: leasePassed,
          message: leasePassed ? 'Chính xác' : (!isSaved ? 'Chưa bấm OK để lưu cấu hình' : `Lease Time mặc định bị thay đổi (đang là ${actualLease || 'trống'})`)
        },
        {
          id: 'dns_clear_lease',
          name: 'Clear DHCP lease for inactive clients giữ nguyên mặc định: Bật',
          expected: 'Bật (checked)',
          actual: chkrmVal ? 'Bật (checked)' : 'Tắt (unchecked)',
          passed: clearLeasePassed,
          message: clearLeasePassed ? 'Chính xác' : (!isSaved ? 'Chưa bấm OK để lưu cấu hình' : 'Clear DHCP lease for inactive clients mặc định bị thay đổi (bị bỏ chọn)')
        }
      ];

      const passedList = [
        dnsPriPassed,
        dnsSndPassed,
        ipPassed,
        maskPassed,
        ripPassed,
        dhcpPassed,
        startIpPassed,
        poolPassed,
        gwPassed,
        leasePassed,
        clearLeasePassed
      ];

      const passedCount = passedList.filter(Boolean).length;
      const totalRules = details.length;
      const score = Math.round((passedCount / totalRules) * 100);
      const allPassed = passedCount === totalRules && isSaved;

      return {
        passed: allPassed,
        score: score,
        passedCount: passedCount,
        totalRules: totalRules,
        details: details
      };
    }
  },
  guidePopups: (window.TOOLTIPS_VIGOR2927 && window.TOOLTIPS_VIGOR2927['vg2927-bai5']) || [
    {
      selector: '#menu-lan:not(.open) .menu-text, #menu-lan:not(.open)',
      text: 'Bước 1: Chọn LAN',
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
      selector: 'b:contains("DNS Server IP Address"), text:DNS Server IP Address',
      text: 'Bước 4: nhập DNS của công ty và google, ví dụ:<br>- Primary IP Address: 210.245.31.220<br>- Secondary IP Address: 8.8.8.8',
      position: 'top',
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
