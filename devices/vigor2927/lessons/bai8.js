/**
 * devices/vigor2927/lessons/bai8.js
 * Bài 8: Cấu hình NAT Port (Port Redirection) trên DrayTek Vigor2927
 */

window.DEVICE_VIGOR2927_LESSONS = window.DEVICE_VIGOR2927_LESSONS || [];

window.DEVICE_VIGOR2927_LESSONS.push({
  id: 'vg2927-bai8',
  title: 'Cấu hình NAT Port',
  subtitle: 'Cấu hình mở cổng dịch vụ Camera (Port Redirection)',
  instructions: [
    '<b>Yêu cầu:</b>',
    'Cấu hình mở Port Redirection cho Camera nội bộ trên DrayTek Vigor2927:',
    '- Tên dịch vụ (Service Name): nhập <span class="val">Camera</span>.',
    '- Giao thức (Protocol): chọn <span class="val">TCP</span>.',
    '- Giao diện WAN (WAN Interface): chọn <span class="val">WAN1</span>.',
    '- Cổng công khai (Public Port): nhập <span class="val">8080</span>.',
    '- Địa chỉ IP máy chủ nội bộ (Private IP): nhập <span class="val">192.168.1.10</span>.',
    '- Cổng nội bộ (Private Port): nhập <span class="val">8080</span>.',
  ],
  practiceUrl: '/sim_vigor2927/weblogin.htm',
  allowedSelectors: [
    'input[name="sPSrvEnable"]',
    'select[name="sPSrvMode"]',
    'input[name="sPSrvSvcName"]',
    'select[name="sPSrvProto"]',
    'select[name="sltWanIfIdx"]',
    'select[name="sPSrvWANIP"]',
    'input[name="sPSrvPubPort"]',
    'select[name="sltSrcIP"]',
    'input[name="sPSrvPrvIp"]',
    'input[name="sPSrvPrvPort"]',
    'input[name="btnOk"]'
  ],
  grading: {
    description: 'Kiểm tra cấu hình NAT Port Redirection Vigor2927 (rule Index 1)',
    rules: [
      { id: 'nat_enable', name: 'Chọn Enable', selector: 'input[name="sPSrvEnable"]', expected: 'Checked', type: 'text_exact', required: true },
      { id: 'nat_mode', name: 'Chế độ (Mode)', selector: 'select[name="sPSrvMode"]', expected: 'Single', type: 'text_exact', required: true },
      { id: 'nat_svc_name', name: 'Tên dịch vụ (Service Name)', selector: 'input[name="sPSrvSvcName"]', expected: 'Camera', type: 'text_exact', required: true },
      { id: 'nat_protocol', name: 'Giao thức (Protocol)', selector: 'select[name="sPSrvProto"]', expected: 'TCP', type: 'text_exact', required: true },
      { id: 'nat_wan_if', name: 'Giao diện WAN (WAN Interface)', selector: 'select[name="sltWanIfIdx"]', expected: 'WAN1', type: 'text_exact', required: true },
      { id: 'nat_pub_port', name: 'Cổng công khai (Public Port)', selector: 'input[name="sPSrvPubPort"]', expected: '8080', type: 'text_exact', required: true },
      { id: 'nat_src_ip', name: 'Địa chỉ nguồn (Source IP)', selector: 'select[name="sltSrcIP"]', expected: 'Any', type: 'text_exact', required: true },
      { id: 'nat_prv_ip', name: 'IP máy chủ nội bộ (Private IP)', selector: 'input[name="sPSrvPrvIp"]', expected: '192.168.1.10', type: 'text_exact', required: true },
      { id: 'nat_prv_port', name: 'Cổng nội bộ (Private Port)', selector: 'input[name="sPSrvPrvPort"]', expected: '8080', type: 'text_exact', required: true }
    ],
    customGrading: function (allDocs) {
      let docRule = null;
      for (const d of allDocs) {
        try {
          if (d.querySelector('input[name="sPSrvSvcName"]') || d.querySelector('input[name="sPSrvEnable"]')) {
            docRule = d;
            break;
          }
        } catch (e) { }
      }

      const topWin = (typeof window !== 'undefined' && window.top) ? window.top : window;
      const store = (topWin && topWin._FTC_VG2927_BAI8) || (typeof window !== 'undefined' && window._FTC_VG2927_BAI8) || null;

      if (!docRule && (!store || !store.isSaved)) {
        return {
          passed: false,
          score: 0,
          passedCount: 0,
          totalRules: 9,
          details: [
            {
              id: 'not_on_page',
              name: 'Trang chi tiết Index No. 1 (NAT >> Port Redirection)',
              expected: 'Đã mở trang chi tiết Index No. 1 và bấm OK lưu cấu hình',
              actual: 'Chưa mở trang chi tiết hoặc chưa lưu cấu hình',
              passed: false,
              message: 'Vui lòng vào NAT >> Port Redirection rồi bấm vào số Index 1 để mở trang cấu hình và nhấn OK để lưu cấu hình'
            }
          ]
        };
      }

      const win = docRule ? (docRule.defaultView || docRule.parentWindow) : null;
      const isSaved = Boolean(
        (store && store.isSaved) ||
        (docRule && docRule._ftcIsSaved) ||
        (win && win._ftcIsSaved)
      );

      // 1. Enable
      let enableChecked = false;
      if (docRule) {
        const enableEl = docRule.querySelector('input[name="sPSrvEnable"]');
        enableChecked = enableEl ? !!enableEl.checked : false;
      } else if (store) {
        enableChecked = !!store.enable;
      }
      if (!enableChecked && store && store.isSaved && store.enable) {
        enableChecked = true;
      }
      const enablePassed = enableChecked && isSaved;

      // 2. Mode
      let actualMode = '';
      if (docRule) {
        const modeEl = docRule.querySelector('select[name="sPSrvMode"]');
        if (modeEl) {
          const opt = modeEl.options && modeEl.options[modeEl.selectedIndex];
          actualMode = opt ? (opt.text || opt.value || '').trim() : (modeEl.value || '').trim();
        }
      } else if (store) {
        actualMode = store.mode || '';
      }
      if (!actualMode && store && store.mode) {
        actualMode = store.mode || '';
      }
      const modePassed = (actualMode === 'Single' || actualMode === '0') && isSaved;

      // 3. Service Name
      let actualSvcName = '';
      if (docRule) {
        const svcNameEl = docRule.querySelector('input[name="sPSrvSvcName"]');
        actualSvcName = svcNameEl ? (svcNameEl.value || '').trim() : '';
      } else if (store) {
        actualSvcName = store.svcName || '';
      }
      if (!actualSvcName && store && store.isSaved && store.svcName) {
        actualSvcName = store.svcName || '';
      }
      const svcNamePassed = (actualSvcName.toUpperCase() === 'CAMERA') && isSaved;

      // 4. Protocol
      let actualProto = '';
      if (docRule) {
        const protoEl = docRule.querySelector('select[name="sPSrvProto"]');
        if (protoEl) {
          const opt = protoEl.options && protoEl.options[protoEl.selectedIndex];
          actualProto = opt ? (opt.text || opt.value || '').trim() : (protoEl.value || '').trim();
        }
      } else if (store) {
        actualProto = store.proto || '';
      }
      if (!actualProto && store && store.proto) {
        actualProto = store.proto || '';
      }
      const protoPassed = (actualProto === 'TCP' || actualProto === '6') && isSaved;

      // 5. WAN Interface
      let isWan1 = false;
      let actualWanIf = '';
      if (docRule) {
        const wanIfEl = docRule.querySelector('select[name="sltWanIfIdx"]');
        if (wanIfEl) {
          const opt = wanIfEl.options && wanIfEl.options[wanIfEl.selectedIndex];
          actualWanIf = opt ? (opt.text || opt.value || '').trim() : (wanIfEl.value || '').trim();
        }
        isWan1 = (actualWanIf.toUpperCase() === 'WAN1') || (wanIfEl && wanIfEl.value === '0');
      } else if (store) {
        actualWanIf = store.wanIf || '';
        isWan1 = (actualWanIf.toUpperCase() === 'WAN1') || (actualWanIf === '0');
      }
      if (!isWan1 && store && store.isSaved && store.wanIf) {
        actualWanIf = store.wanIf || '';
        isWan1 = (actualWanIf.toUpperCase() === 'WAN1') || (actualWanIf === '0');
      }
      const wanIfPassed = isWan1 && isSaved;

      // 6. Public Port
      let actualPubPort = '';
      if (docRule) {
        const pubPortEl = docRule.querySelector('input[name="sPSrvPubPort"]');
        actualPubPort = pubPortEl ? (pubPortEl.value || '').trim() : '';
      } else if (store) {
        actualPubPort = store.pubPort || '';
      }
      if ((!actualPubPort || actualPubPort === '0') && store && store.isSaved && store.pubPort) {
        actualPubPort = store.pubPort || '';
      }
      const pubPortPassed = (actualPubPort === '8080') && isSaved;

      // 7. Source IP
      let actualSrcIp = '';
      if (docRule) {
        const srcIpEl = docRule.querySelector('select[name="sltSrcIP"]');
        if (srcIpEl) {
          const opt = srcIpEl.options && srcIpEl.options[srcIpEl.selectedIndex];
          actualSrcIp = opt ? (opt.text || opt.value || '').trim() : (srcIpEl.value || '').trim();
        }
      } else if (store) {
        actualSrcIp = store.srcIp || '';
      }
      if (!actualSrcIp && store && store.srcIp) {
        actualSrcIp = store.srcIp || '';
      }
      const srcIpPassed = (actualSrcIp === 'Any' || actualSrcIp === '0') && isSaved;

      // 8. Private IP
      let actualPrvIp = '';
      if (docRule) {
        const prvIpEl = docRule.querySelector('input[name="sPSrvPrvIp"]');
        actualPrvIp = prvIpEl ? (prvIpEl.value || '').trim() : '';
      } else if (store) {
        actualPrvIp = store.prvIp || '';
      }
      if (!actualPrvIp && store && store.isSaved && store.prvIp) {
        actualPrvIp = store.prvIp || '';
      }
      const prvIpPassed = (actualPrvIp === '192.168.1.10') && isSaved;

      // 9. Private Port
      let actualPrvPort = '';
      if (docRule) {
        const prvPortEl = docRule.querySelector('input[name="sPSrvPrvPort"]');
        actualPrvPort = prvPortEl ? (prvPortEl.value || '').trim() : '';
      } else if (store) {
        actualPrvPort = store.prvPort || '';
      }
      if ((!actualPrvPort || actualPrvPort === '0') && store && store.isSaved && store.prvPort) {
        actualPrvPort = store.prvPort || '';
      }
      const prvPortPassed = (actualPrvPort === '8080') && isSaved;

      const details = [
        {
          id: 'nat_enable',
          name: 'Chọn Enable',
          expected: 'Đã tích chọn Enable',
          actual: enableChecked ? 'Đã tích chọn' : 'Chưa tích chọn',
          passed: enablePassed,
          message: enablePassed ? 'Chính xác' : (!enableChecked ? 'Chưa tích chọn Enable' : 'Chưa nhấn OK để lưu cấu hình')
        },
        {
          id: 'nat_mode',
          name: 'Chế độ (Mode)',
          expected: 'Single',
          actual: actualMode || 'Chưa chọn',
          passed: modePassed,
          message: modePassed ? 'Chính xác' : (actualMode !== 'Single' && actualMode !== '0' ? 'Mode phải là Single' : 'Chưa nhấn OK để lưu cấu hình')
        },
        {
          id: 'nat_svc_name',
          name: 'Tên dịch vụ (Service Name)',
          expected: 'Camera',
          actual: actualSvcName || '(để trống)',
          passed: svcNamePassed,
          message: svcNamePassed ? 'Chính xác' : (!actualSvcName ? 'Chưa nhập Service Name' : (actualSvcName.toUpperCase() !== 'CAMERA' ? 'Service Name phải là Camera' : 'Chưa nhấn OK để lưu cấu hình'))
        },
        {
          id: 'nat_protocol',
          name: 'Giao thức (Protocol)',
          expected: 'TCP',
          actual: actualProto || 'Chưa chọn',
          passed: protoPassed,
          message: protoPassed ? 'Chính xác' : (actualProto !== 'TCP' && actualProto !== '6' ? 'Protocol phải chọn TCP' : 'Chưa nhấn OK để lưu cấu hình')
        },
        {
          id: 'nat_wan_if',
          name: 'Giao diện WAN (WAN Interface)',
          expected: 'WAN1',
          actual: actualWanIf || 'Chưa chọn',
          passed: wanIfPassed,
          message: wanIfPassed ? 'Chính xác' : (!isWan1 ? 'WAN Interface phải chọn WAN1' : 'Chưa nhấn OK để lưu cấu hình')
        },
        {
          id: 'nat_pub_port',
          name: 'Cổng công khai (Public Port)',
          expected: '8080',
          actual: actualPubPort || '(để trống)',
          passed: pubPortPassed,
          message: pubPortPassed ? 'Chính xác' : (actualPubPort !== '8080' ? 'Public Port phải là 8080' : 'Chưa nhấn OK để lưu cấu hình')
        },
        {
          id: 'nat_src_ip',
          name: 'Địa chỉ nguồn (Source IP)',
          expected: 'Any',
          actual: actualSrcIp || 'Chưa chọn',
          passed: srcIpPassed,
          message: srcIpPassed ? 'Chính xác' : (actualSrcIp !== 'Any' && actualSrcIp !== '0' ? 'Source IP phải là Any' : 'Chưa nhấn OK để lưu cấu hình')
        },
        {
          id: 'nat_prv_ip',
          name: 'IP máy chủ nội bộ (Private IP)',
          expected: '192.168.1.10',
          actual: actualPrvIp || '(để trống)',
          passed: prvIpPassed,
          message: prvIpPassed ? 'Chính xác' : (actualPrvIp !== '192.168.1.10' ? 'Private IP phải là 192.168.1.10' : 'Chưa nhấn OK để lưu cấu hình')
        },
        {
          id: 'nat_prv_port',
          name: 'Cổng nội bộ (Private Port)',
          expected: '8080',
          actual: actualPrvPort || '(để trống)',
          passed: prvPortPassed,
          message: prvPortPassed ? 'Chính xác' : (actualPrvPort !== '8080' ? 'Private Port phải là 8080' : 'Chưa nhấn OK để lưu cấu hình')
        }
      ];

      const passedCount = details.filter(d => d.passed).length;
      const allPassed = passedCount === details.length;

      return {
        passed: allPassed,
        score: Math.round((passedCount / details.length) * 100),
        passedCount: passedCount,
        totalRules: details.length,
        details: details
      };
    }
  },
  guidePopups: (window.TOOLTIPS_VIGOR2927 && window.TOOLTIPS_VIGOR2927['vg2927-bai8']) || [
    {
      selector: '#menu-nat:not(.open) .menu-text, #menu-nat:not(.open)',
      text: 'Bước 1: chọn NAT',
      position: 'bottom',
      hideOnPage: 'page_042|p2_130|ipnat.cgi|ipnat'
    },
    {
      selector: '#sub-nat:not(.hidden) #menu-nat-port-redirection .menu-text, #sub-nat:not(.hidden) #menu-nat-port-redirection',
      text: 'Bước 2: chọn Port Redirection',
      position: 'bottom',
      hideOnPage: 'page_042|p2_130|ipnat.cgi|ipnat'
    },
    {
      selector: 'a[href*="gotoDetailSet(1)"], tr.row0 td:first-child a',
      text: 'Bước 3: chọn 1',
      position: 'right',
      page: 'page_042|deep_032|ipnatp1|fid=0',
      condition: function (doc) {
        if (!doc) return true;
        var topWin = (typeof window !== 'undefined' && window.top) ? window.top : window;
        var store = (topWin && topWin._FTC_VG2927_BAI8) || (typeof window !== 'undefined' && window._FTC_VG2927_BAI8);
        if (store && store.isSaved) return false;
        return !doc._ftcIsSaved;
      }
    },
    {
      selector: '#lbl-nat-enable, #chk-nat-enable, input[name="sPSrvEnable"]',
      text: 'Bước 4: check vào Enable',
      position: 'right',
      page: 'p2_130|ipnatp|fid=1',
      condition: function (doc) {
        if (!doc) return false;
        var el = doc.querySelector('input[name="sPSrvEnable"]');
        return !el || !el.checked;
      }
    },
    {
      selector: 'input[name="sPSrvSvcName"]',
      text: 'Bước 5: nhập Camera',
      position: 'right',
      page: 'p2_130|ipnatp|fid=1',
      condition: function (doc) {
        if (!doc) return false;
        var enEl = doc.querySelector('input[name="sPSrvEnable"]');
        var svcEl = doc.querySelector('input[name="sPSrvSvcName"]');
        var enDone = enEl && enEl.checked;
        var svcDone = svcEl && (svcEl.value || '').trim().toUpperCase() === 'CAMERA';
        return enDone && !svcDone;
      }
    },
    {
      selector: 'select[name="sltWanIfIdx"]',
      text: 'Bước 6: WAN Interface chọn WAN1',
      position: 'right',
      page: 'p2_130|ipnatp|fid=1',
      condition: function (doc) {
        if (!doc) return false;
        var enEl = doc.querySelector('input[name="sPSrvEnable"]');
        var svcEl = doc.querySelector('input[name="sPSrvSvcName"]');
        var wanIfEl = doc.querySelector('select[name="sltWanIfIdx"]');
        var enDone = enEl && enEl.checked;
        var svcDone = svcEl && (svcEl.value || '').trim().toUpperCase() === 'CAMERA';
        var opt = wanIfEl && wanIfEl.options && wanIfEl.options[wanIfEl.selectedIndex];
        var txt = opt ? (opt.text || opt.value || '').trim().toUpperCase() : (wanIfEl ? (wanIfEl.value || '').trim().toUpperCase() : '');
        var wanDone = txt === 'WAN1' || (wanIfEl && wanIfEl.value === '0');
        return enDone && svcDone && !wanDone;
      }
    },
    {
      selector: 'input[name="sPSrvPubPort"]',
      text: 'Bước 7: nhập 8080',
      position: 'right',
      page: 'p2_130|ipnatp|fid=1',
      condition: function (doc) {
        if (!doc) return false;
        var enEl = doc.querySelector('input[name="sPSrvEnable"]');
        var svcEl = doc.querySelector('input[name="sPSrvSvcName"]');
        var wanIfEl = doc.querySelector('select[name="sltWanIfIdx"]');
        var pubEl = doc.querySelector('input[name="sPSrvPubPort"]');
        var enDone = enEl && enEl.checked;
        var svcDone = svcEl && (svcEl.value || '').trim().toUpperCase() === 'CAMERA';
        var opt = wanIfEl && wanIfEl.options && wanIfEl.options[wanIfEl.selectedIndex];
        var txt = opt ? (opt.text || opt.value || '').trim().toUpperCase() : (wanIfEl ? (wanIfEl.value || '').trim().toUpperCase() : '');
        var wanDone = txt === 'WAN1' || (wanIfEl && wanIfEl.value === '0');
        var pubDone = pubEl && (pubEl.value || '').trim() === '8080';
        return enDone && svcDone && wanDone && !pubDone;
      }
    },
    {
      selector: 'input[name="sPSrvPrvIp"]',
      text: 'Bước 8: nhập 192.168.1.10',
      position: 'right',
      page: 'p2_130|ipnatp|fid=1',
      condition: function (doc) {
        if (!doc) return false;
        var enEl = doc.querySelector('input[name="sPSrvEnable"]');
        var svcEl = doc.querySelector('input[name="sPSrvSvcName"]');
        var wanIfEl = doc.querySelector('select[name="sltWanIfIdx"]');
        var pubEl = doc.querySelector('input[name="sPSrvPubPort"]');
        var prvIpEl = doc.querySelector('input[name="sPSrvPrvIp"]');
        var enDone = enEl && enEl.checked;
        var svcDone = svcEl && (svcEl.value || '').trim().toUpperCase() === 'CAMERA';
        var opt = wanIfEl && wanIfEl.options && wanIfEl.options[wanIfEl.selectedIndex];
        var txt = opt ? (opt.text || opt.value || '').trim().toUpperCase() : (wanIfEl ? (wanIfEl.value || '').trim().toUpperCase() : '');
        var wanDone = txt === 'WAN1' || (wanIfEl && wanIfEl.value === '0');
        var pubDone = pubEl && (pubEl.value || '').trim() === '8080';
        var prvIpDone = prvIpEl && (prvIpEl.value || '').trim() === '192.168.1.10';
        return enDone && svcDone && wanDone && pubDone && !prvIpDone;
      }
    },
    {
      selector: 'input[name="sPSrvPrvPort"]',
      text: 'Bước 9: nhập 8080',
      position: 'right',
      page: 'p2_130|ipnatp|fid=1',
      condition: function (doc) {
        if (!doc) return false;
        var enEl = doc.querySelector('input[name="sPSrvEnable"]');
        var svcEl = doc.querySelector('input[name="sPSrvSvcName"]');
        var wanIfEl = doc.querySelector('select[name="sltWanIfIdx"]');
        var pubEl = doc.querySelector('input[name="sPSrvPubPort"]');
        var prvIpEl = doc.querySelector('input[name="sPSrvPrvIp"]');
        var prvPortEl = doc.querySelector('input[name="sPSrvPrvPort"]');
        var enDone = enEl && enEl.checked;
        var svcDone = svcEl && (svcEl.value || '').trim().toUpperCase() === 'CAMERA';
        var opt = wanIfEl && wanIfEl.options && wanIfEl.options[wanIfEl.selectedIndex];
        var txt = opt ? (opt.text || opt.value || '').trim().toUpperCase() : (wanIfEl ? (wanIfEl.value || '').trim().toUpperCase() : '');
        var wanDone = txt === 'WAN1' || (wanIfEl && wanIfEl.value === '0');
        var pubDone = pubEl && (pubEl.value || '').trim() === '8080';
        var prvIpDone = prvIpEl && (prvIpEl.value || '').trim() === '192.168.1.10';
        var prvPortDone = prvPortEl && (prvPortEl.value || '').trim() === '8080';
        return enDone && svcDone && wanDone && pubDone && prvIpDone && !prvPortDone;
      }
    },
    {
      selector: '#btn-nat-ok, input[name="btnOk"], input[value="OK"]',
      text: 'Bước 10: chọn OK để lưu cấu hình',
      position: 'top',
      page: 'p2_130|ipnatp|fid=1',
      condition: function (doc) {
        if (!doc) return false;
        var enEl = doc.querySelector('input[name="sPSrvEnable"]');
        var svcEl = doc.querySelector('input[name="sPSrvSvcName"]');
        var wanIfEl = doc.querySelector('select[name="sltWanIfIdx"]');
        var pubEl = doc.querySelector('input[name="sPSrvPubPort"]');
        var prvIpEl = doc.querySelector('input[name="sPSrvPrvIp"]');
        var prvPortEl = doc.querySelector('input[name="sPSrvPrvPort"]');
        var opt = wanIfEl && wanIfEl.options && wanIfEl.options[wanIfEl.selectedIndex];
        var txt = opt ? (opt.text || opt.value || '').trim().toUpperCase() : (wanIfEl ? (wanIfEl.value || '').trim().toUpperCase() : '');
        var wanDone = txt === 'WAN1' || (wanIfEl && wanIfEl.value === '0');
        var allDone = enEl && enEl.checked &&
          svcEl && (svcEl.value || '').trim().toUpperCase() === 'CAMERA' &&
          wanDone &&
          pubEl && (pubEl.value || '').trim() === '8080' &&
          prvIpEl && (prvIpEl.value || '').trim() === '192.168.1.10' &&
          prvPortEl && (prvPortEl.value || '').trim() === '8080';
        var isSaved = Boolean(doc._ftcIsSaved);
        return allDone && !isSaved;
      }
    }
  ]
});
