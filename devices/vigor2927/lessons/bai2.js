/**
 * devices/vigor2927/lessons/bai2.js
 * Bài 2: Cấu hình giới hạn băng thông trên DrayTek Vigor2927
 */

window.DEVICE_VIGOR2927_LESSONS = window.DEVICE_VIGOR2927_LESSONS || [];

window.DEVICE_VIGOR2927_LESSONS.push({
  id: 'vg2927-bai2',
  title: 'Cấu hình giới hạn băng thông',
  subtitle: 'Cấu hình giới hạn băng thông (Bandwidth Limit)',
  instructions: [
    '<b>Yêu cầu:</b>',
    'Thực hiện cấu hình giới hạn băng thông trên thiết bị DrayTek Vigor2927 theo các tiêu chí sau:',
    '- Kích hoạt Bandwidth Limit: chọn <span class="val">Enable</span>',
    '- Giới hạn mặc định: TX Limit: <span class="val">20 Mbps</span>, RX Limit: <span class="val">25 Mbps</span>',
    '- Thêm giới hạn dải IP cụ thể: Start IP: <span class="val">192.168.1.10</span>, End IP: <span class="val">192.168.1.20</span>',
    '- Chọn Option <span class="val">Each</span>, TX Limit: <span class="val">20 Mbps</span>, RX Limit: <span class="val">25 Mbps</span>',
    '- Nhấn nút <span class="val">Add</span> để lưu dải IP vào danh sách giới hạn',
    '- Giữ nguyên các giá trị mặc định của <span class="val">Auto-Adjustment</span>, <span class="val">Smart Bandwidth Limit</span> và <span class="val">Time Schedule</span> (không thay đổi)',
    '- Nhấn nút <span class="val">OK</span> để lưu cấu hình',
  ],
  practiceUrl: '/sim_vigor2927/weblogin.htm',
  grading: {
    description: 'Kiểm tra cấu hình giới hạn băng thông DrayTek Vigor2927',
    rules: [
      {
        id: 'bandwidth_enable',
        name: 'Chọn Enable',
        selector: 'input[name="sIpBandwEnable"]:checked',
        expected: '1',
        type: 'text_exact',
        required: true
      },
      {
        id: 'bandwidth_def_tx',
        name: 'TX Limit (mặc định): 20 Mbps',
        selector: 'input[name="sIpBandwDefTx"]',
        expected: '20',
        type: 'text_exact',
        required: true
      },
      {
        id: 'bandwidth_def_rx',
        name: 'RX Limit (mặc định): 25 Mbps',
        selector: 'input[name="sIpBandwDefRx"]',
        expected: '25',
        type: 'text_exact',
        required: true
      },
      {
        id: 'bandwidth_start_ip',
        name: 'Start IP: 192.168.1.10',
        selector: '#custlsttb0',
        expected: '192.168.1.10',
        type: 'text_exact',
        required: true
      },
      {
        id: 'bandwidth_end_ip',
        name: 'End IP: 192.168.1.20',
        selector: '#custlsttb0',
        expected: '192.168.1.20',
        type: 'text_exact',
        required: true
      },
      {
        id: 'bandwidth_opt_each',
        name: 'Chọn Option Each',
        selector: 'input[name="sIpBandwShrd"]:checked',
        expected: 'Each',
        type: 'text_exact',
        required: true
      },
      {
        id: 'bandwidth_entry_tx',
        name: 'TX Limit (dải IP): 20 Mbps',
        selector: '#custlsttb0',
        expected: '20 Mbps',
        type: 'text_exact',
        required: true
      },
      {
        id: 'bandwidth_entry_rx',
        name: 'RX Limit (dải IP): 25 Mbps',
        selector: '#custlsttb0',
        expected: '25 Mbps',
        type: 'text_exact',
        required: true
      },
      {
        id: 'bandwidth_btn_add',
        name: 'Có nhấn nút Add',
        selector: 'input[name="btnAdd"]',
        expected: 'Đã nhấn Add',
        type: 'text_exact',
        required: true
      },
      {
        id: 'bandwidth_auto_adjust',
        name: 'Auto-Adjustment (mặc định)',
        selector: 'input[name="chkBandwAuto"]',
        expected: 'Không chọn (Tắt)',
        type: 'text_exact',
        required: true
      },
      {
        id: 'bandwidth_smart_limit',
        name: 'Smart Bandwidth Limit (mặc định)',
        selector: 'input[name="iSmartEnable"]',
        expected: 'Không chọn (Tắt)',
        type: 'text_exact',
        required: true
      },
      {
        id: 'bandwidth_schedule',
        name: 'Time Schedule (mặc định)',
        selector: 'select[name="nSch1"]',
        expected: 'None (4 Profile)',
        type: 'text_exact',
        required: true
      }
    ],
    customGrading: function(allDocs) {
      let docLimit = null;
      for (const d of allDocs) {
        try {
          if (d.querySelector('input[name="sIpBandwDefTx"]') || d.querySelector('#custlsttb0') || (d.location && d.location.href.includes('ipbandw.htm'))) {
            docLimit = d;
            break;
          }
        } catch(e) {}
      }

      if (!docLimit) {
        return {
          passed: false,
          score: 0,
          passedCount: 0,
          totalRules: 12,
          details: [
            {
              id: 'not_on_page',
              name: 'Trang cấu hình Bandwidth Limit',
              expected: 'Đã vào trang Bandwidth Management >> Bandwidth Limit',
              actual: 'Chưa mở trang Bandwidth Limit',
              passed: false,
              message: 'Vui lòng truy cập Bandwidth Management >> Bandwidth Limit để thực hiện cấu hình'
            }
          ]
        };
      }

      const isSaved = !!docLimit._ftcIsSaved;
      const win = docLimit.defaultView || docLimit.parentWindow;

      // 1. Tiêu chí Enable
      const enableEl = docLimit.querySelector('input[name="sIpBandwEnable"]:checked');
      const enableVal = enableEl ? enableEl.value : '0';
      const enablePassed = (enableVal === '1') && isSaved;

      // 2. Tiêu chí TX Limit (mặc định): 20 Mbps
      const txEl = docLimit.querySelector('input[name="sIpBandwDefTx"]');
      const txUnitEl = docLimit.querySelector('select[name="iDefTx"]');
      const txVal = txEl ? txEl.value.trim() : '';
      const txUnit = txUnitEl ? txUnitEl.value : '1';
      const isTxUnitMbps = (txUnit === '1' || txUnit === 'Mbps');
      const txPassed = (txVal === '20') && isTxUnitMbps && isSaved;

      // 3. Tiêu chí RX Limit (mặc định): 25 Mbps
      const rxEl = docLimit.querySelector('input[name="sIpBandwDefRx"]');
      const rxUnitEl = docLimit.querySelector('select[name="iDefRx"]');
      const rxVal = rxEl ? rxEl.value.trim() : '';
      const rxUnit = rxUnitEl ? rxUnitEl.value : '1';
      const isRxUnitMbps = (rxUnit === '1' || rxUnit === 'Mbps');
      const rxPassed = (rxVal === '25') && isRxUnitMbps && isSaved;

      // 4, 5, 6, 7, 8, 9: Limitation List (Start IP, End IP, Option Each, TX Limit, RX Limit, Nút Add)
      let hasAddedEntry = false;
      let entryStartIp = '';
      let entryEndIp = '';
      let entryMode = ''; // 'Each' hoặc 'Shared'
      let entryTxVal = '';
      let entryTxUnit = '';
      let entryRxVal = '';
      let entryRxUnit = '';

      // Đọc từ mảng aryIpBandw trong window của simulator
      if (win && Array.isArray(win.aryIpBandw) && win.aryIpBandw.length > 0) {
        for (let i = 0; i < win.aryIpBandw.length; i++) {
          const rowData = win.aryIpBandw[i];
          if (rowData && (rowData[0] || rowData[1])) {
            hasAddedEntry = true;
            entryStartIp = String(rowData[0]).trim();
            entryEndIp = String(rowData[1]).trim();

            const rawTx = parseInt(rowData[2]) || 0;
            const rawRx = parseInt(rowData[3]) || 0;
            const isTxM = (rawTx & 0x8000) === 0x8000;
            const isRxM = (rawRx & 0x8000) === 0x8000;
            entryTxVal = String(rawTx & 0x7fff);
            entryTxUnit = isTxM ? 'Mbps' : 'Kbps';
            entryRxVal = String(rawRx & 0x7fff);
            entryRxUnit = isRxM ? 'Mbps' : 'Kbps';

            const shrd = String(rowData[4] || 'N').trim().toUpperCase();
            entryMode = (shrd === 'Y') ? 'Shared' : 'Each';

            if (entryStartIp === '192.168.1.10' && (entryEndIp === '192.168.1.20' || entryEndIp === '192.168.1.1.20')) {
              break;
            }
          }
        }
      }

      // Dự phòng kiểm tra từ bảng HTML #custlsttb0
      if (!hasAddedEntry) {
        const tableRows = docLimit.querySelectorAll('#custlsttb0 tbody tr, #custlsttb0 tr');
        tableRows.forEach(tr => {
          const cells = tr.querySelectorAll('td');
          if (cells.length >= 6) {
            const f = cells[1].textContent.trim();
            const t = cells[2].textContent.trim();
            const tx = cells[3].textContent.trim();
            const rx = cells[4].textContent.trim();
            const shrd = cells[5].textContent.trim();
            if (f && !f.toLowerCase().includes('no entries') && !f.toLowerCase().includes('index') && !f.toLowerCase().includes('start ip')) {
              hasAddedEntry = true;
              entryStartIp = f;
              entryEndIp = t;
              entryTxVal = tx.replace(/[MK]/gi, '').trim();
              entryTxUnit = tx.toUpperCase().includes('M') ? 'Mbps' : 'Kbps';
              entryRxVal = rx.replace(/[MK]/gi, '').trim();
              entryRxUnit = rx.toUpperCase().includes('M') ? 'Mbps' : 'Kbps';
              entryMode = shrd.toUpperCase() === 'Y' ? 'Shared' : 'Each';
            }
          }
        });
      }

      // Đọc giá trị từ các ô input trên form (hỗ trợ cả trường hợp chưa nhấn Add hoặc sau khi nhấn Add)
      const fromInput = docLimit.querySelector('input[name="sIpBandwFrom"]');
      const toInput = docLimit.querySelector('input[name="sIpBandwTo"]');
      const shrdInput = docLimit.querySelector('input[name="sIpBandwShrd"]:checked');
      const txInput = docLimit.querySelector('input[name="sIpBandwTx"]');
      const txUnitSelect = docLimit.querySelector('select[name="iProfTx"]');
      const rxInput = docLimit.querySelector('input[name="sIpBandwRx"]');
      const rxUnitSelect = docLimit.querySelector('select[name="iProfRx"]');

      const inputFromVal = fromInput ? fromInput.value.trim() : '';
      const inputToVal = toInput ? toInput.value.trim() : '';
      const inputModeVal = shrdInput ? (shrdInput.value === 'Y' ? 'Shared' : 'Each') : 'Each';
      const inputTxVal = txInput ? txInput.value.trim() : '';
      const inputTxUnit = (txUnitSelect && txUnitSelect.value === '0') ? 'Kbps' : 'Mbps';
      const inputRxVal = rxInput ? rxInput.value.trim() : '';
      const inputRxUnit = (rxUnitSelect && rxUnitSelect.value === '0') ? 'Kbps' : 'Mbps';

      // Kiểm tra thao tác đã bấm nút Add
      const hasClickedAdd = hasAddedEntry || 
                            !!docLimit._ftcHasClickedAdd || 
                            (win && !!win._ftcHasClickedAdd) || 
                            !!window._ftcHasClickedAdd;

      const finalStartIp = entryStartIp || docLimit._ftcLastAddFrom || (win && win._ftcLastAddFrom) || window._ftcLastAddFrom || inputFromVal;
      const finalEndIp = entryEndIp || docLimit._ftcLastAddTo || (win && win._ftcLastAddTo) || window._ftcLastAddTo || inputToVal;
      const finalMode = entryMode || docLimit._ftcLastAddMode || (win && win._ftcLastAddMode) || window._ftcLastAddMode || inputModeVal;
      const finalTxVal = entryTxVal || docLimit._ftcLastAddTx || (win && win._ftcLastAddTx) || window._ftcLastAddTx || inputTxVal;
      const finalTxUnit = entryTxUnit || docLimit._ftcLastAddTxUnit || (win && win._ftcLastAddTxUnit) || window._ftcLastAddTxUnit || inputTxUnit;
      const finalRxVal = entryRxVal || docLimit._ftcLastAddRx || (win && win._ftcLastAddRx) || window._ftcLastAddRx || inputRxVal;
      const finalRxUnit = entryRxUnit || docLimit._ftcLastAddRxUnit || (win && win._ftcLastAddRxUnit) || window._ftcLastAddRxUnit || inputRxUnit;

      const startIpPassed = hasClickedAdd && (finalStartIp === '192.168.1.10') && isSaved;
      const endIpPassed = hasClickedAdd && (finalEndIp === '192.168.1.20' || finalEndIp === '192.168.1.1.20') && isSaved;
      const modePassed = hasClickedAdd && (finalMode === 'Each' || finalMode === 'N') && isSaved;
      const entryTxPassed = hasClickedAdd && (finalTxVal === '20') && (finalTxUnit === 'Mbps' || finalTxUnit === '1') && isSaved;
      const entryRxPassed = hasClickedAdd && (finalRxVal === '25') && (finalRxUnit === 'Mbps' || finalRxUnit === '1') && isSaved;
      const addBtnPassed = hasClickedAdd && isSaved;

      // 10. Tiêu chí Auto-Adjustment (Mặc định không chọn / Tắt)
      const chkAuto = docLimit.querySelector('input[name="chkBandwAuto"]');
      const isAutoChecked = chkAuto ? chkAuto.checked : false;
      const autoAdjustPassed = (!isAutoChecked) && isSaved;

      // 11. Tiêu chí Smart Bandwidth Limit (Mặc định không chọn / Tắt & không sửa đổi)
      const chkSmart = docLimit.querySelector('input[name="iSmartEnable"]');
      const isSmartChecked = chkSmart ? chkSmart.checked : false;
      const smartTxEl = docLimit.querySelector('input[name="iSmartTx"]');
      const smartRxEl = docLimit.querySelector('input[name="iSmartRx"]');
      const smartTxVal = smartTxEl ? smartTxEl.value.trim() : '';
      const smartRxVal = smartRxEl ? smartRxEl.value.trim() : '';
      const hasSmartModified = isSmartChecked || (smartTxVal !== '' && smartTxVal !== '0') || (smartRxVal !== '' && smartRxVal !== '0');
      const smartLimitPassed = (!hasSmartModified) && isSaved;

      // 12. Tiêu chí Time Schedule (Mặc định 4 Profile đều là None / 0)
      const sch1 = docLimit.querySelector('select[name="nSch1"]');
      const sch2 = docLimit.querySelector('select[name="nSch2"]');
      const sch3 = docLimit.querySelector('select[name="nSch3"]');
      const sch4 = docLimit.querySelector('select[name="nSch4"]');
      const v1 = sch1 ? sch1.value : '0';
      const v2 = sch2 ? sch2.value : '0';
      const v3 = sch3 ? sch3.value : '0';
      const v4 = sch4 ? sch4.value : '0';
      const isScheduleDefault = (v1 === '0' && v2 === '0' && v3 === '0' && v4 === '0');
      const schedulePassed = isScheduleDefault && isSaved;

      const details = [
        {
          id: 'bandwidth_enable',
          name: 'Chọn Enable',
          expected: 'Enable',
          actual: !isSaved ? `${enableVal === '1' ? 'Enable' : 'Disable'} (Chưa lưu)` : (enableVal === '1' ? 'Enable' : 'Disable'),
          passed: enablePassed,
          message: enablePassed ? 'Chính xác' : (!isSaved ? 'Chưa nhấn OK để lưu cấu hình' : 'Mong muốn: "Enable", Thực tế: "Disable"')
        },
        {
          id: 'bandwidth_def_tx',
          name: 'TX Limit (mặc định): 20 Mbps',
          expected: '20 Mbps',
          actual: !isSaved ? `${txVal || 'Trống'} ${isTxUnitMbps ? 'Mbps' : 'Kbps'} (Chưa lưu)` : `${txVal || 'Trống'} ${isTxUnitMbps ? 'Mbps' : 'Kbps'}`,
          passed: txPassed,
          message: txPassed ? 'Chính xác' : (!isSaved ? 'Chưa nhấn OK để lưu cấu hình' : `Mong muốn: "20 Mbps", Thực tế: "${txVal || 'Trống'}"`)
        },
        {
          id: 'bandwidth_def_rx',
          name: 'RX Limit (mặc định): 25 Mbps',
          expected: '25 Mbps',
          actual: !isSaved ? `${rxVal || 'Trống'} ${isRxUnitMbps ? 'Mbps' : 'Kbps'} (Chưa lưu)` : `${rxVal || 'Trống'} ${isRxUnitMbps ? 'Mbps' : 'Kbps'}`,
          passed: rxPassed,
          message: rxPassed ? 'Chính xác' : (!isSaved ? 'Chưa nhấn OK để lưu cấu hình' : `Mong muốn: "25 Mbps", Thực tế: "${rxVal || 'Trống'}"`)
        },
        {
          id: 'bandwidth_start_ip',
          name: 'Start IP: 192.168.1.10',
          expected: '192.168.1.10',
          actual: !isSaved && finalStartIp ? `${finalStartIp} (Chưa lưu)` : (finalStartIp || '(Trống)'),
          passed: startIpPassed,
          message: startIpPassed ? 'Chính xác' : (!isSaved && hasClickedAdd && finalStartIp === '192.168.1.10' ? 'Chưa nhấn OK để lưu cấu hình' : `Mong muốn: "192.168.1.10", Thực tế: "${finalStartIp || '(Trống)'}"`)
        },
        {
          id: 'bandwidth_end_ip',
          name: 'End IP: 192.168.1.20',
          expected: '192.168.1.20',
          actual: !isSaved && finalEndIp ? `${finalEndIp} (Chưa lưu)` : (finalEndIp || '(Trống)'),
          passed: endIpPassed,
          message: endIpPassed ? 'Chính xác' : (!isSaved && hasClickedAdd && (finalEndIp === '192.168.1.20' || finalEndIp === '192.168.1.1.20') ? 'Chưa nhấn OK để lưu cấu hình' : `Mong muốn: "192.168.1.20", Thực tế: "${finalEndIp || '(Trống)'}"`)
        },
        {
          id: 'bandwidth_opt_each',
          name: 'Chọn Option Each',
          expected: 'Each',
          actual: !isSaved && finalMode ? `${finalMode} (Chưa lưu)` : (finalMode || '(Trống)'),
          passed: modePassed,
          message: modePassed ? 'Chính xác' : (!isSaved && hasClickedAdd && (finalMode === 'Each' || finalMode === 'N') ? 'Chưa nhấn OK để lưu cấu hình' : `Mong muốn: "Each", Thực tế: "${finalMode || '(Trống)'}"`)
        },
        {
          id: 'bandwidth_entry_tx',
          name: 'TX Limit (dải IP): 20 Mbps',
          expected: '20 Mbps',
          actual: !isSaved && finalTxVal ? `${finalTxVal} ${finalTxUnit} (Chưa lưu)` : (finalTxVal ? `${finalTxVal} ${finalTxUnit}` : '(Trống)'),
          passed: entryTxPassed,
          message: entryTxPassed ? 'Chính xác' : (!isSaved && hasClickedAdd && finalTxVal === '20' ? 'Chưa nhấn OK để lưu cấu hình' : `Mong muốn: "20 Mbps", Thực tế: "${finalTxVal ? `${finalTxVal} ${finalTxUnit}` : '(Trống)'}"`)
        },
        {
          id: 'bandwidth_entry_rx',
          name: 'RX Limit (dải IP): 25 Mbps',
          expected: '25 Mbps',
          actual: !isSaved && finalRxVal ? `${finalRxVal} ${finalRxUnit} (Chưa lưu)` : (finalRxVal ? `${finalRxVal} ${finalRxUnit}` : '(Trống)'),
          passed: entryRxPassed,
          message: entryRxPassed ? 'Chính xác' : (!isSaved && hasClickedAdd && finalRxVal === '25' ? 'Chưa nhấn OK để lưu cấu hình' : `Mong muốn: "25 Mbps", Thực tế: "${finalRxVal ? `${finalRxVal} ${finalRxUnit}` : '(Trống)'}"`)
        },
        {
          id: 'bandwidth_btn_add',
          name: 'Có nhấn nút Add',
          expected: 'Đã nhấn Add',
          actual: hasClickedAdd ? (isSaved ? 'Đã nhấn Add' : 'Đã nhấn Add (Chưa lưu)') : 'Chưa nhấn Add',
          passed: addBtnPassed,
          message: addBtnPassed ? 'Chính xác' : (!isSaved && hasClickedAdd ? 'Chưa nhấn OK để lưu cấu hình' : 'Cần nhấn nút Add để thêm dải IP vào danh sách')
        },
        {
          id: 'bandwidth_auto_adjust',
          name: 'Auto-Adjustment (mặc định)',
          expected: 'Không chọn (Tắt)',
          actual: !isSaved ? `${isAutoChecked ? 'Đang chọn' : 'Không chọn (Tắt)'} (Chưa lưu)` : (isAutoChecked ? 'Đang chọn' : 'Không chọn (Tắt)'),
          passed: autoAdjustPassed,
          message: autoAdjustPassed ? 'Chính xác' : (!isSaved ? 'Chưa nhấn OK để lưu cấu hình' : 'Mặc định không được chọn Auto-Adjustment')
        },
        {
          id: 'bandwidth_smart_limit',
          name: 'Smart Bandwidth Limit (mặc định)',
          expected: 'Không chọn (Tắt)',
          actual: !isSaved ? `${hasSmartModified ? 'Đã sửa đổi' : 'Không chọn (Tắt)'} (Chưa lưu)` : (hasSmartModified ? 'Đã sửa đổi' : 'Không chọn (Tắt)'),
          passed: smartLimitPassed,
          message: smartLimitPassed ? 'Chính xác' : (!isSaved ? 'Chưa nhấn OK để lưu cấu hình' : 'Mặc định không được chọn Smart Bandwidth Limit')
        },
        {
          id: 'bandwidth_schedule',
          name: 'Time Schedule (mặc định)',
          expected: 'None (4 Profile)',
          actual: !isSaved ? `${isScheduleDefault ? 'None (4 Profile)' : 'Đã thay đổi Profile'} (Chưa lưu)` : (isScheduleDefault ? 'None (4 Profile)' : 'Đã thay đổi Profile'),
          passed: schedulePassed,
          message: schedulePassed ? 'Chính xác' : (!isSaved ? 'Chưa nhấn OK để lưu cấu hình' : 'Mặc định cả 4 Schedule Profile đều phải là None')
        }
      ];

      const passedCount = (enablePassed ? 1 : 0) + 
                          (txPassed ? 1 : 0) + 
                          (rxPassed ? 1 : 0) + 
                          (startIpPassed ? 1 : 0) + 
                          (endIpPassed ? 1 : 0) + 
                          (modePassed ? 1 : 0) + 
                          (entryTxPassed ? 1 : 0) + 
                          (entryRxPassed ? 1 : 0) + 
                          (addBtnPassed ? 1 : 0) + 
                          (autoAdjustPassed ? 1 : 0) + 
                          (smartLimitPassed ? 1 : 0) + 
                          (schedulePassed ? 1 : 0);

      const totalRules = 12;
      const passed = (passedCount === totalRules) && isSaved;
      const score = Math.round((passedCount / totalRules) * 100);

      return {
        passed: passed,
        score: score,
        passedCount: passedCount,
        totalRules: totalRules,
        details: details
      };
    }
  },
  guidePopups: (window.TOOLTIPS_VIGOR2927 && window.TOOLTIPS_VIGOR2927['vg2927-bai2']) || [
    {
      selector: '#menu-bandwidth:not(.open) .menu-text, #menu-bandwidth:not(.open)',
      text: 'Bước 1: chọn Bandwidth Management',
      position: 'bottom'
    },
    {
      selector: '#sub-bandwidth:not(.hidden) #menu-bandwidth-limit .menu-text, #sub-bandwidth:not(.hidden) #menu-bandwidth-limit',
      text: 'Bước 2: chọn Bandwidth Limit',
      position: 'bottom'
    },
    {
      selector: '#lbl-bandwidth-disable, b:contains("Disable")',
      text: 'Bước 3: chọn Enable',
      position: 'right',
      offsetX: 8,
      condition: function(doc) {
        if (!doc) return false;
        var tx = doc.querySelector('input[name="sIpBandwDefTx"]');
        var rx = doc.querySelector('input[name="sIpBandwDefRx"]');
        var txU = doc.querySelector('select[name="iDefTx"]');
        var rxU = doc.querySelector('select[name="iDefRx"]');
        if (!tx || !rx) return false;
        var txVal = (tx.value || '').trim();
        var rxVal = (rx.value || '').trim();
        var tU = txU ? txU.value : '1';
        var rU = rxU ? rxU.value : '1';
        return !(txVal === '20' && rxVal === '25' && (tU === '1' || tU === 'Mbps') && (rU === '1' || rU === 'Mbps'));
      }
    },
    {
      selector: '#opt-bandwidth-tx-limit, input[name="sIpBandwDefTx"]',
      text: 'Bước 4: nhập giới hạn tốc độ truyền cho tất cả thiết bị, ví dụ 20 Mbps',
      position: 'bottom',
      condition: function(doc) {
        if (!doc) return false;
        var tx = doc.querySelector('input[name="sIpBandwDefTx"]');
        var rx = doc.querySelector('input[name="sIpBandwDefRx"]');
        var txU = doc.querySelector('select[name="iDefTx"]');
        var rxU = doc.querySelector('select[name="iDefRx"]');
        if (!tx || !rx) return false;
        var txVal = (tx.value || '').trim();
        var rxVal = (rx.value || '').trim();
        var tU = txU ? txU.value : '1';
        var rU = rxU ? rxU.value : '1';
        return !(txVal === '20' && rxVal === '25' && (tU === '1' || tU === 'Mbps') && (rU === '1' || rU === 'Mbps'));
      }
    },
    {
      selector: '#opt-bandwidth-rx-limit, input[name="sIpBandwDefRx"]',
      text: 'Bước 5: nhập giới hạn tốc độ nhận cho tất cả thiết bị, ví dụ 25 Mbps',
      position: 'top',
      condition: function(doc) {
        if (!doc) return false;
        var tx = doc.querySelector('input[name="sIpBandwDefTx"]');
        var rx = doc.querySelector('input[name="sIpBandwDefRx"]');
        var txU = doc.querySelector('select[name="iDefTx"]');
        var rxU = doc.querySelector('select[name="iDefRx"]');
        if (!tx || !rx) return false;
        var txVal = (tx.value || '').trim();
        var rxVal = (rx.value || '').trim();
        var tU = txU ? txU.value : '1';
        var rU = rxU ? rxU.value : '1';
        return !(txVal === '20' && rxVal === '25' && (tU === '1' || tU === 'Mbps') && (rU === '1' || rU === 'Mbps'));
      }
    },
    {
      selector: 'text:End IP',
      text: 'Bước 6: thay đổi băng thông cho một dãy hay một IP cụ thể (cao hơn hoặc thấp hơn)<br>ví dụ: điền vào Start IP: 192.168.1.10 và End IP: 192.168.1.20, đồng thời gán tốc độ TX,<br>ví dụ: 20 Mbps và RX, ví dụ: 25 Mbps cho thiết bị (hoặc dãy thiết bị) đó.<br>- Trong đó, “Each” là mỗi IP trong dãy đều được sử dụng tối đa băng thông quy định;<br>“Share” là tất cả IP trong dãy sử dụng tổng băng thông quy định. Ở đây chọn "Each"<br>==> Sau đó chọn Add để lưu',
      position: 'top',
      condition: function(doc) {
        if (!doc) return false;
        var tx = doc.querySelector('input[name="sIpBandwDefTx"]');
        var rx = doc.querySelector('input[name="sIpBandwDefRx"]');
        var txU = doc.querySelector('select[name="iDefTx"]');
        var rxU = doc.querySelector('select[name="iDefRx"]');
        if (!tx || !rx) return false;
        var txVal = (tx.value || '').trim();
        var rxVal = (rx.value || '').trim();
        var tU = txU ? txU.value : '1';
        var rU = rxU ? rxU.value : '1';
        return (txVal === '20' && rxVal === '25' && (tU === '1' || tU === 'Mbps') && (rU === '1' || rU === 'Mbps'));
      }
    },
    {
      selector: 'select[name="nSch1"]',
      text: 'Bước 7: Bạn có thể quy định thời gian để chức năng Bandwidth Limit<br>có hiệu lực bằng cách chỉnh Time Schedule. Ở đây chọn None.',
      position: 'bottom',
      condition: function(doc) {
        if (!doc) return false;
        var tx = doc.querySelector('input[name="sIpBandwDefTx"]');
        var rx = doc.querySelector('input[name="sIpBandwDefRx"]');
        var txU = doc.querySelector('select[name="iDefTx"]');
        var rxU = doc.querySelector('select[name="iDefRx"]');
        if (!tx || !rx) return false;
        var txVal = (tx.value || '').trim();
        var rxVal = (rx.value || '').trim();
        var tU = txU ? txU.value : '1';
        var rU = rxU ? rxU.value : '1';
        return (txVal === '20' && rxVal === '25' && (tU === '1' || tU === 'Mbps') && (rU === '1' || rU === 'Mbps'));
      }
    },
    {
      selector: 'input[name="btnOk"], input[value="OK"]',
      text: 'Bước 8: chọn OK',
      position: 'top',
      condition: function(doc) {
        if (!doc) return false;
        var tx = doc.querySelector('input[name="sIpBandwDefTx"]');
        var rx = doc.querySelector('input[name="sIpBandwDefRx"]');
        var txU = doc.querySelector('select[name="iDefTx"]');
        var rxU = doc.querySelector('select[name="iDefRx"]');
        if (!tx || !rx) return false;
        var txVal = (tx.value || '').trim();
        var rxVal = (rx.value || '').trim();
        var tU = txU ? txU.value : '1';
        var rU = rxU ? rxU.value : '1';
        return (txVal === '20' && rxVal === '25' && (tU === '1' || tU === 'Mbps') && (rU === '1' || rU === 'Mbps'));
      }
    }
  ]
});
