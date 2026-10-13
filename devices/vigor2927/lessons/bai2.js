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
    '<b>Yêu cầu cấu hình giới hạn băng thông trên DrayTek Vigor2927:</b>',
    '- <b>Giới hạn mặc định:</b>',
    '&nbsp;&nbsp;+ Tốc độ gửi (TX Limit): <span class="val">20 Mbps</span>',
    '&nbsp;&nbsp;+ Tốc độ tải (RX Limit): <span class="val">25 Mbps</span>',
    '- <b>Trong đó giới hạn theo dải IP cụ thể (từ <span class="val">192.168.1.10</span> đến <span class="val">192.168.1.20</span>):</b>',
    '&nbsp;&nbsp;+ Mỗi địa chỉ IP trong dải này được áp dụng mức giới hạn riêng biệt:',
    '&nbsp;&nbsp;&nbsp;&nbsp;• Tốc độ gửi (TX Limit): <span class="val">20 Mbps</span>',
    '&nbsp;&nbsp;&nbsp;&nbsp;• Tốc độ tải (RX Limit): <span class="val">25 Mbps</span>'
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
    customGrading: function (allDocs) {
      let docLimit = null;
      for (const d of allDocs) {
        try {
          if (d.querySelector('input[name="sIpBandwDefTx"]') || d.querySelector('#custlsttb0') || (d.location && d.location.href.includes('ipbandw.htm'))) {
            docLimit = d;
            break;
          }
        } catch (e) { }
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
      position: 'bottom',
      hideOnPage: 'ipbandw'
    },
    {
      selector: '#sub-bandwidth:not(.hidden) #menu-bandwidth-limit .menu-text, #sub-bandwidth:not(.hidden) #menu-bandwidth-limit',
      text: 'Bước 2: chọn Bandwidth Limit',
      position: 'bottom',
      hideOnPage: 'ipbandw'
    },
    {
      selector: '#lbl-bandwidth-disable, input[name="sIpBandwEnable"][value="0"] ~ b, text:Disable',
      text: 'Bước 3: chọn Enable',
      position: 'right',
      offsetX: 8,
      condition: function (doc) {
        if (!doc) return false;
        var en = doc.querySelector('input[name="sIpBandwEnable"]:checked');
        return !(en && en.value === '1');
      }
    },
    {
      selector: '#opt-bandwidth-tx-limit, input[name="sIpBandwDefTx"]',
      text: 'Bước 4: nhập giới hạn tốc độ truyền (TX Limit) mặc định cho tất cả thiết bị là 20 Mbps',
      position: 'bottom',
      condition: function (doc) {
        if (!doc) return false;
        var en = doc.querySelector('input[name="sIpBandwEnable"]:checked');
        var tx = doc.querySelector('input[name="sIpBandwDefTx"]');
        var txU = doc.querySelector('select[name="iDefTx"]');
        var isEn = !!(en && en.value === '1');
        var txVal = tx ? (tx.value || '').trim() : '';
        var u = txU ? txU.value : '1';
        return isEn && !(txVal === '20' && (u === '1' || u === 'Mbps'));
      }
    },
    {
      selector: '#opt-bandwidth-rx-limit, input[name="sIpBandwDefRx"]',
      text: 'Bước 5: nhập giới hạn tốc độ nhận (RX Limit) mặc định cho tất cả thiết bị là 25 Mbps',
      position: 'top',
      condition: function (doc) {
        if (!doc) return false;
        var en = doc.querySelector('input[name="sIpBandwEnable"]:checked');
        var tx = doc.querySelector('input[name="sIpBandwDefTx"]');
        var rx = doc.querySelector('input[name="sIpBandwDefRx"]');
        var txU = doc.querySelector('select[name="iDefTx"]');
        var rxU = doc.querySelector('select[name="iDefRx"]');
        var isEn = !!(en && en.value === '1');
        var txVal = tx ? (tx.value || '').trim() : '';
        var rxVal = rx ? (rx.value || '').trim() : '';
        var tu = txU ? txU.value : '1';
        var ru = rxU ? rxU.value : '1';
        var isTxDone = (txVal === '20' && (tu === '1' || tu === 'Mbps'));
        return isEn && isTxDone && !(rxVal === '25' && (ru === '1' || ru === 'Mbps'));
      }
    },
    {
      selector: 'input[name="sIpBandwFrom"]',
      text: 'Bước 6: nhập Start IP: 192.168.1.10',
      position: 'top',
      condition: function (doc) {
        if (!doc) return false;
        var tx = doc.querySelector('input[name="sIpBandwDefTx"]');
        var rx = doc.querySelector('input[name="sIpBandwDefRx"]');
        var txU = doc.querySelector('select[name="iDefTx"]');
        var rxU = doc.querySelector('select[name="iDefRx"]');
        var tu = txU ? txU.value : '1';
        var ru = rxU ? rxU.value : '1';
        var isDefDone = (tx && (tx.value || '').trim() === '20' && (tu === '1' || tu === 'Mbps')) &&
                        (rx && (rx.value || '').trim() === '25' && (ru === '1' || ru === 'Mbps'));
        var fromEl = doc.querySelector('input[name="sIpBandwFrom"]');
        var fromVal = fromEl ? (fromEl.value || '').trim() : '';
        var win = doc.defaultView || doc.parentWindow;
        var isAdded = (win && Array.isArray(win.aryIpBandw) && win.aryIpBandw.length > 0 && win.aryIpBandw.some(function (r) { return r && (r[0] === '192.168.1.10' || r[1] === '192.168.1.20'); })) ||
                      !!doc._ftcHasClickedAdd || !!window._ftcHasClickedAdd;
        return isDefDone && !isAdded && (fromVal !== '192.168.1.10');
      }
    },
    {
      selector: 'input[name="sIpBandwTo"]',
      text: 'Bước 7: nhập End IP: 192.168.1.20',
      position: 'top',
      condition: function (doc) {
        if (!doc) return false;
        var fromEl = doc.querySelector('input[name="sIpBandwFrom"]');
        var toEl = doc.querySelector('input[name="sIpBandwTo"]');
        var fromVal = fromEl ? (fromEl.value || '').trim() : '';
        var toVal = toEl ? (toEl.value || '').trim() : '';
        var win = doc.defaultView || doc.parentWindow;
        var isAdded = (win && Array.isArray(win.aryIpBandw) && win.aryIpBandw.length > 0 && win.aryIpBandw.some(function (r) { return r && (r[0] === '192.168.1.10' || r[1] === '192.168.1.20'); })) ||
                      !!doc._ftcHasClickedAdd || !!window._ftcHasClickedAdd;
        return !isAdded && (fromVal === '192.168.1.10') && (toVal !== '192.168.1.20');
      }
    },
    {
      selector: 'input[name="sIpBandwShrd"][value="N"]',
      text: 'Bước 8: chọn Each (mỗi IP trong dải đều sử dụng tối đa băng thông quy định)',
      position: 'right',
      condition: function (doc) {
        if (!doc) return false;
        var fromEl = doc.querySelector('input[name="sIpBandwFrom"]');
        var toEl = doc.querySelector('input[name="sIpBandwTo"]');
        var txEl = doc.querySelector('input[name="sIpBandwTx"]');
        var fromVal = fromEl ? (fromEl.value || '').trim() : '';
        var toVal = toEl ? (toEl.value || '').trim() : '';
        var txVal = txEl ? (txEl.value || '').trim() : '';
        var win = doc.defaultView || doc.parentWindow;
        var isAdded = (win && Array.isArray(win.aryIpBandw) && win.aryIpBandw.length > 0 && win.aryIpBandw.some(function (r) { return r && (r[0] === '192.168.1.10' || r[1] === '192.168.1.20'); })) ||
                      !!doc._ftcHasClickedAdd || !!window._ftcHasClickedAdd;
        if (isAdded || fromVal !== '192.168.1.10' || toVal !== '192.168.1.20') return false;
        if (!doc._ftcEachHooked) {
          doc._ftcEachHooked = true;
          var eachRadio = doc.querySelector('input[name="sIpBandwShrd"][value="N"]');
          if (eachRadio) {
            eachRadio.addEventListener('click', function () { doc._ftcEachConfirmed = true; });
            eachRadio.addEventListener('change', function () { doc._ftcEachConfirmed = true; });
          }
          if (txEl) {
            txEl.addEventListener('focus', function () { doc._ftcEachConfirmed = true; });
            txEl.addEventListener('input', function () { doc._ftcEachConfirmed = true; });
          }
        }
        if (doc._ftcEachConfirmed || txVal === '20') return false;
        return true;
      }
    },
    {
      selector: 'input[name="sIpBandwTx"]',
      text: 'Bước 9: nhập TX Limit cho dải IP: 20 Mbps',
      position: 'bottom',
      condition: function (doc) {
        if (!doc) return false;
        var fromEl = doc.querySelector('input[name="sIpBandwFrom"]');
        var toEl = doc.querySelector('input[name="sIpBandwTo"]');
        var txEl = doc.querySelector('input[name="sIpBandwTx"]');
        var fromVal = fromEl ? (fromEl.value || '').trim() : '';
        var toVal = toEl ? (toEl.value || '').trim() : '';
        var txVal = txEl ? (txEl.value || '').trim() : '';
        var win = doc.defaultView || doc.parentWindow;
        var isAdded = (win && Array.isArray(win.aryIpBandw) && win.aryIpBandw.length > 0 && win.aryIpBandw.some(function (r) { return r && (r[0] === '192.168.1.10' || r[1] === '192.168.1.20'); })) ||
                      !!doc._ftcHasClickedAdd || !!window._ftcHasClickedAdd;
        if (isAdded || fromVal !== '192.168.1.10' || toVal !== '192.168.1.20') return false;
        return (doc._ftcEachConfirmed || txVal !== '') && (txVal !== '20');
      }
    },
    {
      selector: 'input[name="sIpBandwRx"]',
      text: 'Bước 10: nhập RX Limit cho dải IP: 25 Mbps',
      position: 'bottom',
      condition: function (doc) {
        if (!doc) return false;
        var fromEl = doc.querySelector('input[name="sIpBandwFrom"]');
        var toEl = doc.querySelector('input[name="sIpBandwTo"]');
        var txEl = doc.querySelector('input[name="sIpBandwTx"]');
        var rxEl = doc.querySelector('input[name="sIpBandwRx"]');
        var fromVal = fromEl ? (fromEl.value || '').trim() : '';
        var toVal = toEl ? (toEl.value || '').trim() : '';
        var txVal = txEl ? (txEl.value || '').trim() : '';
        var rxVal = rxEl ? (rxEl.value || '').trim() : '';
        var win = doc.defaultView || doc.parentWindow;
        var isAdded = (win && Array.isArray(win.aryIpBandw) && win.aryIpBandw.length > 0 && win.aryIpBandw.some(function (r) { return r && (r[0] === '192.168.1.10' || r[1] === '192.168.1.20'); })) ||
                      !!doc._ftcHasClickedAdd || !!window._ftcHasClickedAdd;
        if (isAdded || fromVal !== '192.168.1.10' || toVal !== '192.168.1.20') return false;
        return (txVal === '20') && (rxVal !== '25');
      }
    },
    {
      selector: 'input[name="btnAdd"]',
      text: 'Bước 11: chọn Add để thêm dải IP vào danh sách Limitation List',
      position: 'top',
      condition: function (doc) {
        if (!doc) return false;
        var fromEl = doc.querySelector('input[name="sIpBandwFrom"]');
        var toEl = doc.querySelector('input[name="sIpBandwTo"]');
        var txEl = doc.querySelector('input[name="sIpBandwTx"]');
        var rxEl = doc.querySelector('input[name="sIpBandwRx"]');
        var fromVal = fromEl ? (fromEl.value || '').trim() : '';
        var toVal = toEl ? (toEl.value || '').trim() : '';
        var txVal = txEl ? (txEl.value || '').trim() : '';
        var rxVal = rxEl ? (rxEl.value || '').trim() : '';
        var win = doc.defaultView || doc.parentWindow;
        var isAdded = (win && Array.isArray(win.aryIpBandw) && win.aryIpBandw.length > 0 && win.aryIpBandw.some(function (r) { return r && (r[0] === '192.168.1.10' || r[1] === '192.168.1.20'); })) ||
                      !!doc._ftcHasClickedAdd || !!window._ftcHasClickedAdd;
        if (isAdded || fromVal !== '192.168.1.10' || toVal !== '192.168.1.20') return false;
        return (txVal === '20') && (rxVal === '25');
      }
    },
    {
      selector: 'select[name="nSch1"]',
      text: 'Bước 12: Time Schedule giữ nguyên mặc định là None',
      position: 'bottom',
      condition: function (doc) {
        if (!doc) return false;
        var win = doc.defaultView || doc.parentWindow;
        var isAdded = (win && Array.isArray(win.aryIpBandw) && win.aryIpBandw.length > 0 && win.aryIpBandw.some(function (r) { return r && (r[0] === '192.168.1.10' || r[1] === '192.168.1.20'); })) ||
                      !!doc._ftcHasClickedAdd || !!window._ftcHasClickedAdd;
        return isAdded && !doc._ftcIsSaved;
      }
    },
    {
      selector: 'input[name="btnOk"], input[value="OK"]',
      text: 'Bước 13: chọn OK để lưu cấu hình',
      position: 'top',
      condition: function (doc) {
        if (!doc) return false;
        var win = doc.defaultView || doc.parentWindow;
        var isAdded = (win && Array.isArray(win.aryIpBandw) && win.aryIpBandw.length > 0 && win.aryIpBandw.some(function (r) { return r && (r[0] === '192.168.1.10' || r[1] === '192.168.1.20'); })) ||
                      !!doc._ftcHasClickedAdd || !!window._ftcHasClickedAdd;
        return isAdded && !doc._ftcIsSaved;
      }
    }
  ]
});
