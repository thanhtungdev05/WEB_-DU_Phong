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
    'Thực hiện cấu hình chính sách định tuyến (Policy Routing) trên DrayTek Vigor2927',
    '- Username: <span class="val">admin</span>',
    '- Password: <span class="val">admin</span>',
    '- Vào <b>Routing >> Load-Balance/Route Policy</b>, chọn rule <b>Index 1</b>',
    '- Enable: <span class="val">có tích chọn</span>',
    '- Comment: <span class="val">PC A</span>',
    '- Protocol: <span class="val">TCP</span>',
    '- Source: <span class="val">IP Range, 192.168.1.10 - 192.168.1.10</span>',
    '- Destination: <span class="val">IP Range, 11.11.11.11 - 11.11.11.11</span>',
    '- Destination Port: <span class="val">Dest Port Range, 8000 - 8000</span>',
    '- Interface: <span class="val">WAN / WAN1</span>',
    '- Gateway: <span class="val">Default Gateway</span>',
    '- Priority: <span class="val">200</span>',
    '- Nhấn <b>OK</b> để lưu cấu hình'
  ],
  practiceUrl: '/sim_vigor2927/weblogin.htm',
  grading: {
    description: 'Kiểm tra cấu hình Policy Routing Vigor2927 (rule Index 1)',
    rules: [
      { id: 'pr_enable', name: 'Enable: có tích chọn', selector: 'input[name="iPREnable"]', expected: 'Checked', type: 'text_exact', required: true },
      { id: 'pr_comment', name: 'Comment: PC A', selector: 'input[name="comment"]', expected: 'PC A', type: 'text_exact', required: true },
      { id: 'pr_protocol', name: 'Protocol: TCP', selector: 'select[name="iPRProtocol"]', expected: 'TCP', type: 'text_exact', required: true },
      { id: 'pr_src_mode', name: 'Source: IP Range', selector: 'select[name="rdSIpAny"]', expected: 'IP Range', type: 'text_exact', required: true },
      { id: 'pr_src_start', name: 'Source Start: 192.168.1.10', selector: 'input[name="sPRSIpStart"]', expected: '192.168.1.10', type: 'text_exact', required: true },
      { id: 'pr_src_end', name: 'Source End: 192.168.1.10', selector: 'input[name="iPRSIpCount"]', expected: '192.168.1.10', type: 'text_exact', required: true },
      { id: 'pr_dst_mode', name: 'Destination: IP Range', selector: 'select[name="rdDIpAny"]', expected: 'IP Range', type: 'text_exact', required: true },
      { id: 'pr_dst_start', name: 'Destination Start: 11.11.11.11', selector: 'input[name="sPRDIpStart"]', expected: '11.11.11.11', type: 'text_exact', required: true },
      { id: 'pr_dst_end', name: 'Destination End: 11.11.11.11', selector: 'input[name="iPRDIpCount"]', expected: '11.11.11.11', type: 'text_exact', required: true },
      { id: 'pr_dport_mode', name: 'Destination Port: Dest Port Range', selector: 'select[name="rdDPortAny"]', expected: 'Dest Port Range', type: 'text_exact', required: true },
      { id: 'pr_dport_start', name: 'Dest Port Start: 8000', selector: 'input[name="iPRDPortStart"]', expected: '8000', type: 'text_exact', required: true },
      { id: 'pr_dport_end', name: 'Dest Port End: 8000', selector: 'input[name="iPRDPortCount"]', expected: '8000', type: 'text_exact', required: true },
      { id: 'pr_iface_type', name: 'Interface: WAN', selector: 'select[name="interfaceType"]', expected: 'WAN', type: 'text_exact', required: true },
      { id: 'pr_iface_wan', name: 'Interface: WAN1', selector: 'select[name="multiwanWanIf"]', expected: 'WAN1', type: 'text_exact', required: true },
      { id: 'pr_gateway', name: 'Gateway: Default Gateway', selector: 'input[name="rdGWIp"]', expected: 'Default Gateway', type: 'text_exact', required: true },
      { id: 'pr_priority', name: 'Priority: 200', selector: 'input[name="sPriority"]', expected: '200', type: 'text_exact', required: true }
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
          totalRules: 16,
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

      const isSaved = !!docRule._ftcIsSaved;

      // 1. Enable
      const enableEl = docRule.querySelector('input[name="iPREnable"]');
      const enableChecked = enableEl ? !!enableEl.checked : false;
      const enablePassed = enableChecked && isSaved;

      // 2. Comment
      const commentEl = docRule.querySelector('input[name="comment"]');
      const actualComment = commentEl ? commentEl.value.trim() : '';
      const commentPassed = (actualComment === 'PC A') && isSaved;

      // 3. Protocol
      const protoEl = docRule.querySelector('select[name="iPRProtocol"]');
      let actualProto = '';
      if (protoEl) {
        const opt = protoEl.options[protoEl.selectedIndex];
        actualProto = opt ? (opt.text || '').trim() : '';
      }
      const protoPassed = (actualProto === 'TCP') && isSaved;

      // 4-6. Source
      const srcModeEl = docRule.querySelector('select[name="rdSIpAny"]');
      let actualSrcMode = '';
      if (srcModeEl) {
        const opt = srcModeEl.options[srcModeEl.selectedIndex];
        actualSrcMode = opt ? (opt.text || '').trim() : '';
      }
      const srcModePassed = (actualSrcMode === 'IP Range') && isSaved;
      const srcStartEl = docRule.querySelector('input[name="sPRSIpStart"]');
      const actualSrcStart = srcStartEl ? srcStartEl.value.trim() : '';
      const srcStartPassed = (actualSrcStart === '192.168.1.10') && isSaved;
      const srcEndEl = docRule.querySelector('input[name="iPRSIpCount"]');
      const actualSrcEnd = srcEndEl ? srcEndEl.value.trim() : '';
      const srcEndPassed = (actualSrcEnd === '192.168.1.10') && isSaved;

      // 7-9. Destination
      const dstModeEl = docRule.querySelector('select[name="rdDIpAny"]');
      let actualDstMode = '';
      if (dstModeEl) {
        const opt = dstModeEl.options[dstModeEl.selectedIndex];
        actualDstMode = opt ? (opt.text || '').trim() : '';
      }
      const dstModePassed = (actualDstMode === 'IP Range') && isSaved;
      const dstStartEl = docRule.querySelector('input[name="sPRDIpStart"]');
      const actualDstStart = dstStartEl ? dstStartEl.value.trim() : '';
      const dstStartPassed = (actualDstStart === '11.11.11.11') && isSaved;
      const dstEndEl = docRule.querySelector('input[name="iPRDIpCount"]');
      const actualDstEnd = dstEndEl ? dstEndEl.value.trim() : '';
      const dstEndPassed = (actualDstEnd === '11.11.11.11') && isSaved;

      // 10-12. Destination Port
      const dportModeEl = docRule.querySelector('select[name="rdDPortAny"]');
      let actualDportMode = '';
      if (dportModeEl) {
        const opt = dportModeEl.options[dportModeEl.selectedIndex];
        actualDportMode = opt ? (opt.text || '').trim() : '';
      }
      const dportModePassed = (actualDportMode === 'Dest Port Range') && isSaved;
      const dportStartEl = docRule.querySelector('input[name="iPRDPortStart"]');
      const actualDportStart = dportStartEl ? dportStartEl.value.trim() : '';
      const dportStartPassed = (actualDportStart === '8000') && isSaved;
      const dportEndEl = docRule.querySelector('input[name="iPRDPortCount"]');
      const actualDportEnd = dportEndEl ? dportEndEl.value.trim() : '';
      const dportEndPassed = (actualDportEnd === '8000') && isSaved;

      // 13. Interface (WAN)
      const ifaceTypeEl = docRule.querySelector('select[name="interfaceType"]');
      let actualIfaceType = '';
      if (ifaceTypeEl) {
        const opt = ifaceTypeEl.options[ifaceTypeEl.selectedIndex];
        actualIfaceType = opt ? (opt.text || '').trim() : '';
      }
      const ifaceTypePassed = (actualIfaceType === 'WAN') && isSaved;

      // 14. Interface (WAN1) — ô chọn WAN thật sự HIỂN THỊ trên màn hình là
      // select[name="multiwanWanIf"] (danh sách WAN1/WAN2/WAN5/WAN6).
      // KHÔNG dùng select[name="iPRWanIf1"]: ô đó bị Angular ẩn hoàn toàn
      // (nằm trong <tr> có class ng-hide) và luôn giữ giá trị mặc định LAN1,
      // nên chấm theo nó thì học viên chọn đúng vẫn bị báo sai.
      // Cũng KHÔNG dùng hidden field input[name="iPRWanIf"]: hàm gốc
      // onClkBtnOk() chỉ ghi vào đó khi dataCheck() pass, trong giả lập luôn rỗng.
      const ifaceWanEl = docRule.querySelector('select[name="multiwanWanIf"]');
      let actualIfaceWan = '';
      if (ifaceWanEl && ifaceWanEl.selectedIndex >= 0) {
        const opt = ifaceWanEl.options[ifaceWanEl.selectedIndex];
        actualIfaceWan = opt ? (opt.text || '').trim() : '';
      }
      const ifaceWanPassed = (actualIfaceWan === 'WAN1') && isSaved;

      // 15. Gateway
      const gwChecked = docRule.querySelector('input[name="rdGWIp"][value="0"]');
      const gwPassed = !!(gwChecked && gwChecked.checked) && isSaved;

      // 16. Priority (input được tạo động khi kéo thanh trượt Priority)
      const priorityEl = docRule.querySelector('input[name="sPriority"]');
      const actualPriority = priorityEl ? priorityEl.value.trim() : '';
      const priorityPassed = (actualPriority === '200') && isSaved;

      const details = [
        { id: 'pr_enable', name: 'Enable: có tích chọn', expected: 'Checked', actual: enableChecked ? 'Checked' : 'Chưa tích', passed: enablePassed, message: enablePassed ? 'Chính xác' : (!isSaved ? 'Chưa bấm OK để lưu cấu hình' : 'Chưa tích Enable') },
        { id: 'pr_comment', name: 'Comment: PC A', expected: 'PC A', actual: actualComment || '(trống)', passed: commentPassed, message: commentPassed ? 'Chính xác' : (!isSaved ? 'Chưa bấm OK để lưu cấu hình' : `Comment không đúng (đang là ${actualComment || 'trống'})`) },
        { id: 'pr_protocol', name: 'Protocol: TCP', expected: 'TCP', actual: actualProto || '(trống)', passed: protoPassed, message: protoPassed ? 'Chính xác' : (!isSaved ? 'Chưa bấm OK để lưu cấu hình' : `Protocol không đúng (đang là ${actualProto || 'trống'})`) },
        { id: 'pr_src_mode', name: 'Source: IP Range', expected: 'IP Range', actual: actualSrcMode || '(trống)', passed: srcModePassed, message: srcModePassed ? 'Chính xác' : (!isSaved ? 'Chưa bấm OK để lưu cấu hình' : `Source không đúng (đang là ${actualSrcMode || 'trống'})`) },
        { id: 'pr_src_start', name: 'Source Start: 192.168.1.10', expected: '192.168.1.10', actual: actualSrcStart || '(trống)', passed: srcStartPassed, message: srcStartPassed ? 'Chính xác' : (!isSaved ? 'Chưa bấm OK để lưu cấu hình' : `Source Start không đúng (đang là ${actualSrcStart || 'trống'})`) },
        { id: 'pr_src_end', name: 'Source End: 192.168.1.10', expected: '192.168.1.10', actual: actualSrcEnd || '(trống)', passed: srcEndPassed, message: srcEndPassed ? 'Chính xác' : (!isSaved ? 'Chưa bấm OK để lưu cấu hình' : `Source End không đúng (đang là ${actualSrcEnd || 'trống'})`) },
        { id: 'pr_dst_mode', name: 'Destination: IP Range', expected: 'IP Range', actual: actualDstMode || '(trống)', passed: dstModePassed, message: dstModePassed ? 'Chính xác' : (!isSaved ? 'Chưa bấm OK để lưu cấu hình' : `Destination không đúng (đang là ${actualDstMode || 'trống'})`) },
        { id: 'pr_dst_start', name: 'Destination Start: 11.11.11.11', expected: '11.11.11.11', actual: actualDstStart || '(trống)', passed: dstStartPassed, message: dstStartPassed ? 'Chính xác' : (!isSaved ? 'Chưa bấm OK để lưu cấu hình' : `Destination Start không đúng (đang là ${actualDstStart || 'trống'})`) },
        { id: 'pr_dst_end', name: 'Destination End: 11.11.11.11', expected: '11.11.11.11', actual: actualDstEnd || '(trống)', passed: dstEndPassed, message: dstEndPassed ? 'Chính xác' : (!isSaved ? 'Chưa bấm OK để lưu cấu hình' : `Destination End không đúng (đang là ${actualDstEnd || 'trống'})`) },
        { id: 'pr_dport_mode', name: 'Destination Port: Dest Port Range', expected: 'Dest Port Range', actual: actualDportMode || '(trống)', passed: dportModePassed, message: dportModePassed ? 'Chính xác' : (!isSaved ? 'Chưa bấm OK để lưu cấu hình' : `Destination Port không đúng (đang là ${actualDportMode || 'trống'})`) },
        { id: 'pr_dport_start', name: 'Dest Port Start: 8000', expected: '8000', actual: actualDportStart || '(trống)', passed: dportStartPassed, message: dportStartPassed ? 'Chính xác' : (!isSaved ? 'Chưa bấm OK để lưu cấu hình' : `Dest Port Start không đúng (đang là ${actualDportStart || 'trống'})`) },
        { id: 'pr_dport_end', name: 'Dest Port End: 8000', expected: '8000', actual: actualDportEnd || '(trống)', passed: dportEndPassed, message: dportEndPassed ? 'Chính xác' : (!isSaved ? 'Chưa bấm OK để lưu cấu hình' : `Dest Port End không đúng (đang là ${actualDportEnd || 'trống'})`) },
        { id: 'pr_iface_type', name: 'Interface: WAN', expected: 'WAN', actual: actualIfaceType || '(trống)', passed: ifaceTypePassed, message: ifaceTypePassed ? 'Chính xác' : (!isSaved ? 'Chưa bấm OK để lưu cấu hình' : `Interface không đúng (đang là ${actualIfaceType || 'trống'})`) },
        { id: 'pr_iface_wan', name: 'Interface: WAN1', expected: 'WAN1', actual: actualIfaceWan || '(trống)', passed: ifaceWanPassed, message: ifaceWanPassed ? 'Chính xác' : (!isSaved ? 'Chưa bấm OK để lưu cấu hình' : `Interface không đúng (đang là ${actualIfaceWan || 'trống'})`) },
        { id: 'pr_gateway', name: 'Gateway: Default Gateway', expected: 'Default Gateway', actual: (gwChecked && gwChecked.checked) ? 'Default Gateway' : 'Khác', passed: gwPassed, message: gwPassed ? 'Chính xác' : (!isSaved ? 'Chưa bấm OK để lưu cấu hình' : 'Gateway không đúng, cần chọn Default Gateway') },
        { id: 'pr_priority', name: 'Priority: 200', expected: '200', actual: actualPriority || '(chưa kéo thanh trượt)', passed: priorityPassed, message: priorityPassed ? 'Chính xác' : (!isSaved ? 'Chưa bấm OK để lưu cấu hình' : (actualPriority ? `Priority không đúng (đang là ${actualPriority})` : 'Chưa kéo thanh trượt Priority tới số 200')) }
      ];

      const passedList = [
        enablePassed, commentPassed, protoPassed,
        srcModePassed, srcStartPassed, srcEndPassed,
        dstModePassed, dstStartPassed, dstEndPassed,
        dportModePassed, dportStartPassed, dportEndPassed,
        ifaceTypePassed, ifaceWanPassed,
        gwPassed, priorityPassed
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
      position: 'left',
      page: 'policyrt1'
    },
    {
      selector: 'input[name="iPREnable"]',
      text: 'Bước 4: check vào Enble',
      position: 'left',
      page: 'v2x00.cgi'
    },
    {
      selector: 'input[name="comment"]',
      text: 'Bước 5: nhập PC A',
      position: 'top',
      page: 'v2x00.cgi'
    },
    {
      selector: 'select[name="iPRProtocol"]',
      text: 'Bước 6: chọn TCP',
      position: 'right',
      page: 'v2x00.cgi'
    },
    {
      selector: 'select[name="rdSIpAny"]',
      text: 'Bước 7: chọn IP Range, ví dụ: 192.168.1.10 - 192.168.1.10',
      position: 'right',
      page: 'v2x00.cgi'
    },
    {
      selector: 'select[name="rdDIpAny"]',
      text: 'Bước 8: chọn IP Range, ví dụ: 11.11.11.11 - 11.11.11.11',
      position: 'right',
      page: 'v2x00.cgi'
    },
    {
      selector: 'select[name="rdDPortAny"]',
      text: 'Bước 9: chọn Dest Port Range, ví dụ: 8000 - 8000',
      position: 'right',
      page: 'v2x00.cgi'
    },
    {
      selector: '#dfgateway, td:contains("Default Gateway")',
      text: 'Bước 10: chọn Default Gateway',
      position: 'right',
      page: 'v2x00.cgi'
    },
    {
      selector: '#image_option',
      text: 'Bước 11: click vào +',
      position: 'left',
      page: 'v2x00.cgi'
    },
    {
      selector: '#idShow',
      text: 'Bước 12: kéo hoặc nhập số 200',
      position: 'top',
      page: 'v2x00.cgi'
    },
    {
      selector: 'input[name="btnOk"]',
      text: 'Bước 13: chọn OK',
      position: 'bottom',
      page: 'v2x00.cgi'
    }
  ]
});
