/**
 * devices/vigor2927/lessons/bai7.js
 * Bài 7: Cấu hình Policy Routing trên DrayTek Vigor2927
 */

window.DEVICE_VIGOR2927_LESSONS = window.DEVICE_VIGOR2927_LESSONS || [];

window.DEVICE_VIGOR2927_LESSONS.push({
  id: 'vg2927-bai7',
  title: 'Cấu hình Policy Routing',
  subtitle: 'Cấu hình định tuyến theo chính sách (Policy Route)',
  instructions: [
    '<b>Yêu cầu:</b>',
    'Cấu hình Policy Routing trên thiết bị DrayTek Vigor2927:',
    '- Tên gợi nhớ (Comment): nhập <span class="val">Ưu tiên Wan 1</span>',
    '- Dải IP áp dụng (Source): từ <span class="val">192.168.1.100</span> đến <span class="val">192.168.1.110</span>',
    '- Interface chính: ưu tiên sử dụng <span class="val">WAN1</span>',
    '- Dự phòng (Failover): chỉ chuyển sang <span class="val">WAN2</span> khi WAN1 gặp sự cố (chọn Failover to: WAN2)',
    '- Mức độ ưu tiên (Priority): đặt mức ưu tiên là <span class="val">1</span>',
    '- Khôi phục (Failback): tự động chuyển về ưu tiên WAN1 khi đường truyền khôi phục (tích chọn Failback)'
  ],
  practiceUrl: '/sim_vigor2927/weblogin.htm',
  allowedSelectors: [
    'input[name="rdGWIp"]',
    'input[name="sPRSGatewayIp"]'
  ],
  grading: {
    description: 'Kiểm tra cấu hình Policy Routing Vigor2927 (rule Index 1)',
    allowedSelectors: [
      'input[name="rdGWIp"]',
      'input[name="sPRSGatewayIp"]'
    ],
    rules: [
      { id: 'pr_enable', name: 'Enable: có tích chọn', selector: 'input[name="iPREnable"]', expected: 'Checked', type: 'text_exact', required: true },
      { id: 'pr_comment', name: 'Comment: Ưu tiên Wan 1', selector: 'input[name="comment"]', expected: 'Ưu tiên Wan 1', type: 'text_exact', required: true },
      { id: 'pr_src_mode', name: 'Source: IP Range', selector: 'select[name="rdSIpAny"]', expected: 'IP Range', type: 'text_exact', required: true },
      { id: 'pr_src_start', name: 'Source Start: 192.168.1.100', selector: 'input[name="sPRSIpStart"]', expected: '192.168.1.100', type: 'text_exact', required: true },
      { id: 'pr_src_end', name: 'Source End: 192.168.1.110', selector: 'input[name="iPRSIpCount"]', expected: '192.168.1.110', type: 'text_exact', required: true },
      { id: 'pr_iface_wan', name: 'Interface: WAN1', selector: 'select[name="multiwanWanIf"]', expected: 'WAN1', type: 'text_exact', required: true },
      { id: 'pr_failover', name: 'Failover to: có tích chọn', selector: 'input[name="iPRFailover"]', expected: 'Checked', type: 'text_exact', required: true },
      { id: 'pr_failover_wan', name: 'Failover Interface: WAN2', selector: 'select[name="failoverwan"]', expected: 'WAN2', type: 'text_exact', required: true },
      { id: 'pr_priority', name: 'Priority: 1', selector: 'input[name="sPriority"]', expected: '1', type: 'text_exact', required: true },
      { id: 'pr_failback', name: 'Failback: có tích chọn', selector: 'input[name="iPRFailback"]', expected: 'Checked', type: 'text_exact', required: true }
    ],
    customGrading: function(allDocs) {
      let docRule = null;
      for (const d of allDocs) {
        try {
          if (d.querySelector('input[name="iPREnable"]')) {
            docRule = d;
            break;
          }
        } catch(e) {}
      }

      if (!docRule) {
        return {
          passed: false,
          score: 0,
          passedCount: 0,
          totalRules: 10,
          details: [
            {
              id: 'not_on_page',
              name: 'Trang chi tiết rule Index 1 (Load-Balance/Route Policy)',
              expected: 'Đã mở trang chi tiết rule Index 1',
              actual: 'Chưa mở trang chi tiết',
              passed: false,
              message: 'Vui lòng vào Routing >> Load-Balance/Route Policy rồi bấm vào số Index 1 để mở trang cấu hình'
            }
          ]
        };
      }

      const win = docRule.defaultView || docRule.parentWindow;
      const topWin = (win && win.top) ? win.top : ((typeof window !== 'undefined' && window.top) ? window.top : window);
      const isSaved = Boolean(docRule._ftcIsSaved || (win && win._ftcIsSaved) || (topWin && topWin._ftcIsSaved));

      // 1. Enable
      const enableEl = docRule.querySelector('input[name="iPREnable"]');
      const enableChecked = enableEl ? !!enableEl.checked : false;
      const enablePassed = enableChecked && isSaved;

      // 2. Comment
      const commentEl = docRule.querySelector('input[name="comment"]');
      const actualComment = commentEl ? commentEl.value.trim() : '';
      const commentPassed = (actualComment === 'Ưu tiên Wan 1' || actualComment === 'Wan 1') && isSaved;

      // 3. Source Mode
      const srcModeEl = docRule.querySelector('select[name="rdSIpAny"]');
      let actualSrcMode = '';
      if (srcModeEl) {
        const opt = srcModeEl.options[srcModeEl.selectedIndex];
        actualSrcMode = opt ? (opt.text || '').trim() : '';
      }
      const srcModePassed = (actualSrcMode === 'IP Range' || (srcModeEl && srcModeEl.value === '1')) && isSaved;

      // 4. Source Start
      const srcStartEl = docRule.querySelector('input[name="sPRSIpStart"]');
      const actualSrcStart = srcStartEl ? srcStartEl.value.trim() : '';
      const srcStartPassed = (actualSrcStart === '192.168.1.100') && isSaved;

      // 5. Source End
      const srcEndEl = docRule.querySelector('input[name="iPRSIpCount"]');
      const actualSrcEnd = srcEndEl ? srcEndEl.value.trim() : '';
      const srcEndPassed = (actualSrcEnd === '192.168.1.110') && isSaved;

      // 6. Interface WAN1
      const ifaceWanEl = docRule.querySelector('select[name="multiwanWanIf"]');
      let actualIfaceWan = '';
      if (ifaceWanEl && ifaceWanEl.selectedIndex >= 0) {
        const opt = ifaceWanEl.options[ifaceWanEl.selectedIndex];
        actualIfaceWan = opt ? (opt.text || '').trim() : '';
      }
      const ifaceWanPassed = (actualIfaceWan === 'WAN1' || (ifaceWanEl && ifaceWanEl.value === '3')) && isSaved;

      // 7. Failover to
      const failoverEl = docRule.querySelector('input[name="iPRFailover"]');
      const failoverChecked = failoverEl ? !!failoverEl.checked : false;
      const failoverPassed = failoverChecked && isSaved;

      // 8. Failover WAN (WAN2)
      const failoverWanEl = docRule.querySelector('select[name="failoverwan"]');
      let actualFailoverWan = '';
      if (failoverWanEl && failoverWanEl.selectedIndex >= 0) {
        const opt = failoverWanEl.options[failoverWanEl.selectedIndex];
        actualFailoverWan = opt ? (opt.text || '').trim() : '';
      }
      const failoverWanPassed = (actualFailoverWan.includes('WAN2') || (failoverWanEl && failoverWanEl.value === '4')) && isSaved;

      // 9. Priority
      const priorityEl = docRule.querySelector('input[name="sPriority"]');
      const actualPriority = priorityEl ? priorityEl.value.trim() : '';
      const priorityPassed = (actualPriority === '1' || actualPriority === '0') && isSaved;

      // 10. Failback
      const failbackEl = docRule.querySelector('input[name="iPRFailback"]');
      const failbackChecked = failbackEl ? !!failbackEl.checked : false;
      const failbackPassed = failbackChecked && isSaved;

      const details = [
        { id: 'pr_enable', name: 'Enable: có tích chọn', expected: 'Checked', actual: enableChecked ? 'Checked' : 'Chưa tích', passed: enablePassed, message: enablePassed ? 'Chính xác' : (!isSaved ? 'Chưa bấm OK để lưu cấu hình' : 'Chưa tích Enable') },
        { id: 'pr_comment', name: 'Comment: Ưu tiên Wan 1', expected: 'Ưu tiên Wan 1', actual: actualComment || '(trống)', passed: commentPassed, message: commentPassed ? 'Chính xác' : (!isSaved ? 'Chưa bấm OK để lưu cấu hình' : `Comment không đúng (đang là ${actualComment || 'trống'})`) },
        { id: 'pr_src_mode', name: 'Source: IP Range', expected: 'IP Range', actual: actualSrcMode || '(trống)', passed: srcModePassed, message: srcModePassed ? 'Chính xác' : (!isSaved ? 'Chưa bấm OK để lưu cấu hình' : `Source không đúng (đang là ${actualSrcMode || 'trống'})`) },
        { id: 'pr_src_start', name: 'Source Start: 192.168.1.100', expected: '192.168.1.100', actual: actualSrcStart || '(trống)', passed: srcStartPassed, message: srcStartPassed ? 'Chính xác' : (!isSaved ? 'Chưa bấm OK để lưu cấu hình' : `Source Start không đúng (đang là ${actualSrcStart || 'trống'})`) },
        { id: 'pr_src_end', name: 'Source End: 192.168.1.110', expected: '192.168.1.110', actual: actualSrcEnd || '(trống)', passed: srcEndPassed, message: srcEndPassed ? 'Chính xác' : (!isSaved ? 'Chưa bấm OK để lưu cấu hình' : `Source End không đúng (đang là ${actualSrcEnd || 'trống'})`) },
        { id: 'pr_iface_wan', name: 'Interface: WAN1', expected: 'WAN1', actual: actualIfaceWan || '(trống)', passed: ifaceWanPassed, message: ifaceWanPassed ? 'Chính xác' : (!isSaved ? 'Chưa bấm OK để lưu cấu hình' : `Interface không đúng (đang là ${actualIfaceWan || 'trống'})`) },
        { id: 'pr_failover', name: 'Failover to: có tích chọn', expected: 'Checked', actual: failoverChecked ? 'Checked' : 'Chưa tích', passed: failoverPassed, message: failoverPassed ? 'Chính xác' : (!isSaved ? 'Chưa bấm OK để lưu cấu hình' : 'Chưa tích Failover to') },
        { id: 'pr_failover_wan', name: 'Failover Interface: WAN2', expected: 'WAN2', actual: actualFailoverWan || '(trống)', passed: failoverWanPassed, message: failoverWanPassed ? 'Chính xác' : (!isSaved ? 'Chưa bấm OK để lưu cấu hình' : `Failover Interface không đúng (đang là ${actualFailoverWan || 'trống'})`) },
        { id: 'pr_priority', name: 'Priority: 1', expected: '1', actual: actualPriority || '(chưa nhập/kéo)', passed: priorityPassed, message: priorityPassed ? 'Chính xác' : (!isSaved ? 'Chưa bấm OK để lưu cấu hình' : (actualPriority ? `Priority không đúng (đang là ${actualPriority})` : 'Chưa nhập hoặc kéo thanh trượt Priority tới 1')) },
        { id: 'pr_failback', name: 'Failback: có tích chọn', expected: 'Checked', actual: failbackChecked ? 'Checked' : 'Chưa tích', passed: failbackPassed, message: failbackPassed ? 'Chính xác' : (!isSaved ? 'Chưa bấm OK để lưu cấu hình' : 'Chưa tích chọn Failback') }
      ];

      const passedList = [
        enablePassed, commentPassed, srcModePassed,
        srcStartPassed, srcEndPassed, ifaceWanPassed,
        failoverPassed, failoverWanPassed,
        priorityPassed, failbackPassed
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
  guidePopups: (window.TOOLTIPS_VIGOR2927 && window.TOOLTIPS_VIGOR2927['vg2927-bai7']) || [
    {
      selector: '#menu-routing:not(.open) .menu-text, #menu-routing:not(.open)',
      text: 'Bước 1: chọn Routing',
      position: 'bottom',
      hideOnPage: 'policyrt1|v2x00.cgi'
    },
    {
      selector: '#sub-routing:not(.hidden) #menu-routing-policy .menu-text, #sub-routing:not(.hidden) #menu-routing-policy',
      text: 'Bước 2: chọn Load-Balance/Route Policy',
      position: 'bottom',
      hideOnPage: 'policyrt1|v2x00.cgi'
    },
    {
      selector: 'a[href*="gotoDetailSet(1)"], tr.row0 td:first-child a',
      text: 'Bước 3: chọn 1',
      position: 'right',
      page: 'policyrt1'
    },
    {
      selector: '#lbl-route-enable, text:Enable, input[name="iPREnable"]',
      text: 'Bước 4: check vào Enable',
      position: 'right',
      page: 'v2x00.cgi'
    },
    {
      selector: 'input[name="comment"]',
      text: 'Bước 5: nhập Ưu tiên Wan 1',
      position: 'top',
      page: 'v2x00.cgi'
    },
    {
      selector: 'select[name="rdSIpAny"]',
      text: 'Bước 6: chọn IP Range',
      position: 'right',
      page: 'v2x00.cgi'
    },
    {
      selector: 'input[name="sPRSIpStart"]',
      text: 'Bước 7: nhập 192.168.1.100',
      position: 'bottom',
      page: 'v2x00.cgi'
    },
    {
      selector: 'input[name="iPRSIpCount"]',
      text: 'Bước 8: nhập 192.168.1.110',
      position: 'bottom',
      page: 'v2x00.cgi'
    },
    {
      selector: 'select[name="multiwanWanIf"]',
      text: 'Bước 9: Interface chính chọn WAN1',
      position: 'right',
      page: 'v2x00.cgi'
    },
    {
      selector: '#lbl-route-failover, text:Failover to, input[name="iPRFailover"]',
      text: 'Bước 10: check vào Failover to',
      position: 'right',
      page: 'v2x00.cgi'
    },
    {
      selector: 'select[name="failoverwan"]',
      text: 'Bước 11: chọn WAN2',
      position: 'right',
      page: 'v2x00.cgi'
    },
    {
      selector: '#lbl-route-priority, td[onclick*="onClkMoreoption"] b, text:Priority, #image_option',
      text: 'Bước 12: click vào + Priority',
      position: 'right',
      page: 'v2x00.cgi'
    },
    {
      selector: '#idShow, input[name="sPriority"]',
      text: 'Bước 13: kéo hoặc nhập số 1',
      position: 'top',
      page: 'v2x00.cgi'
    },
    {
      selector: 'input[name="iPRFailback"]',
      text: 'Bước 14: check vào Failback',
      position: 'right',
      page: 'v2x00.cgi'
    },
    {
      selector: 'input[name="btnOk"], input[value="OK"]',
      text: 'Bước 15: chọn OK để lưu cấu hình',
      position: 'bottom',
      page: 'v2x00.cgi'
    }
  ]
});
