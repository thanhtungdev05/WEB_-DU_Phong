/**
 * devices/vigor2927/lessons/bai3.js
 * Bài 3: Cấu hình Bind IP to MAC trên DrayTek Vigor2927
 */

window.DEVICE_VIGOR2927_LESSONS = window.DEVICE_VIGOR2927_LESSONS || [];

function isVigor2927Bai3Added(doc) {
  if (!doc) return false;
  try {
    var win = doc.defaultView || doc.parentWindow;
    if (win && Array.isArray(win.aryIpBindMac) && win.aryIpBindMac.length > 0) {
      for (var i = 0; i < win.aryIpBindMac.length; i++) {
        var item = win.aryIpBindMac[i];
        if (item && item[0] === '192.168.1.100') return true;
      }
    }
    var slt = doc.querySelector('select[name="sltIpMac"]');
    if (slt && slt.options) {
      for (var j = 0; j < slt.options.length; j++) {
        var txt = slt.options[j].text || slt.options[j].innerText || '';
        if (txt.includes('192.168.1.100')) return true;
      }
    }
    if (doc._ftcLastAddIp === '192.168.1.100' || (window._ftcLastAddIp === '192.168.1.100' && (doc._ftcHasClickedAdd || window._ftcHasClickedAdd))) {
      return true;
    }
  } catch (e) { }
  return false;
}

function isVigor2927Bai3Enabled(doc) {
  if (!doc) return false;
  var en = doc.querySelector('input[name="sIpBndMacEnable"]:checked');
  return !!(en && en.value === '1');
}

function isVigor2927Bai3MacMatch(val) {
  if (!val) return false;
  var cleaned = String(val).replace(/[-:]/g, '').trim().toUpperCase();
  return cleaned === 'AABBCCDDEEFF';
}

function getVigor2927InputVal(doc, name) {
  if (!doc) return '';
  var el = doc.querySelector('input[name="' + name + '"]');
  return el ? (el.value || '').trim() : '';
}

window.DEVICE_VIGOR2927_LESSONS.push({
  id: 'vg2927-bai3',
  title: 'Cấu hình Bind IP to MAC',
  subtitle: 'Cấu hình Bind IP to MAC (Gán cố định IP theo MAC)',
  instructions: [
    '<b>Yêu cầu:</b>',
    'Thực hiện cấu hình Bind IP to MAC trên thiết bị theo các thông số dưới đây:',
    '- IP Address: <span class="val">192.168.1.100</span>',
    '- MAC Address: <span class="val">AA-BB-CC-DD-EE-FF</span>'
  ],
  practiceUrl: '/sim_vigor2927/weblogin.htm',
  grading: {
    description: 'Kiểm tra cấu hình Bind IP to MAC DrayTek Vigor2927',
    rules: [
      {
        id: 'ipbmac_enable',
        name: 'Chọn Enable',
        selector: 'input[name="sIpBndMacEnable"]:checked',
        expected: '1',
        type: 'text_exact',
        required: true
      },
      {
        id: 'ipbmac_ip_val',
        name: 'Địa chỉ IP: 192.168.1.100',
        selector: 'select[name="sltIpMac"]',
        expected: '192.168.1.100',
        type: 'text_exact',
        required: true
      },
      {
        id: 'ipbmac_mac_val',
        name: 'Địa chỉ MAC: AA-BB-CC-DD-EE-FF',
        selector: 'select[name="sltIpMac"]',
        expected: 'AA-BB-CC-DD-EE-FF',
        type: 'text_exact',
        required: true
      },
      {
        id: 'ipbmac_btn_add',
        name: 'Có nhấn nút Add (Thêm vào IP Bind List)',
        selector: 'input[name="btnAdd"]',
        expected: 'Đã thêm vào IP Bind List',
        type: 'text_exact',
        required: true
      },
      {
        id: 'ipbmac_strict_bind',
        name: 'Strict Bind (mặc định)',
        selector: 'input[name="sIpBndMacStrict"]',
        expected: 'Không chọn (Tắt)',
        type: 'text_exact',
        required: true
      },
      {
        id: 'ipbmac_mac_learn',
        name: 'Enable MAC Learning Time (mặc định)',
        selector: 'input[name="sMacLearnEnable"]',
        expected: 'Không chọn (Tắt)',
        type: 'text_exact',
        required: true
      }
    ],
    customGrading: function (allDocs) {
      let docIpbmac = null;
      for (const d of allDocs) {
        try {
          if (d.querySelector('input[name="sIpAddress"]') || (d.location && d.location.href.includes('ipbmac'))) {
            docIpbmac = d;
            break;
          }
        } catch (e) { }
      }

      if (!docIpbmac) {
        return {
          passed: false,
          score: 0,
          passedCount: 0,
          totalRules: 6,
          details: [
            {
              id: 'not_on_page',
              name: 'Trang cấu hình Bind IP to MAC',
              expected: 'Đã vào trang LAN >> Bind IP to MAC',
              actual: 'Chưa mở trang Bind IP to MAC',
              passed: false,
              message: 'Vui lòng truy cập LAN >> Bind IP to MAC để thực hiện cấu hình'
            }
          ]
        };
      }

      const win = docIpbmac.defaultView || docIpbmac.parentWindow;
      const topWin = (typeof window !== 'undefined' && window.top) ? window.top : window;

      // Nhận diện trạng thái lưu cấu hình: cờ DOM, cờ window của trang, hoặc cờ từ portal top window
      const isSaved = !!(
        docIpbmac._ftcIsSaved ||
        (win && win._ftcIsSaved) ||
        window._hasClickedSaveInGuide ||
        topWin._hasClickedSaveInGuide ||
        docIpbmac._ftcLastSaveInteraction
      );

      // 1. Tiêu chí Enable
      const enableEl = docIpbmac.querySelector('input[name="sIpBndMacEnable"]:checked');
      const enableVal = enableEl ? enableEl.value : '0';
      const enablePassed = (enableVal === '1') && isSaved;

      // 2, 3, 4: Tiêu chí IP, MAC, nút Add (IP Bind List)
      let hasAddedEntry = false;
      let foundIp = '';
      let foundMac = '';

      if (win && Array.isArray(win.aryIpBindMac) && win.aryIpBindMac.length > 0) {
        for (let i = 0; i < win.aryIpBindMac.length; i++) {
          const item = win.aryIpBindMac[i];
          if (item && (item[0] || item[1])) {
            hasAddedEntry = true;
            const ipCandidate = String(item[0] || '').trim();
            const macCandidate = String(item[1] || '').trim().replace(/:/g, '-').toUpperCase();
            if (ipCandidate === '192.168.1.100' || macCandidate === 'AA-BB-CC-DD-EE-FF') {
              foundIp = ipCandidate;
              foundMac = macCandidate;
              break;
            }
          }
        }
      }

      if (!foundIp || !foundMac) {
        const slt = docIpbmac.querySelector('select[name="sltIpMac"]');
        if (slt && slt.options && slt.options.length > 1) {
          hasAddedEntry = true;
          for (let j = 1; j < slt.options.length; j++) {
            const txt = (slt.options[j].text || slt.options[j].innerText || '').trim();
            if (txt.includes('192.168.1.100')) foundIp = '192.168.1.100';
            if (txt.includes('AA-BB-CC-DD-EE-FF') || txt.includes('AA:BB:CC:DD:EE:FF')) foundMac = 'AA-BB-CC-DD-EE-FF';
          }
        }
      }

      if (docIpbmac._ftcHasClickedAdd || window._ftcHasClickedAdd) {
        hasAddedEntry = true;
        if (!foundIp && (docIpbmac._ftcLastAddIp || window._ftcLastAddIp)) {
          foundIp = (docIpbmac._ftcLastAddIp || window._ftcLastAddIp).trim();
        }
        if (!foundMac && (docIpbmac._ftcLastAddMac || window._ftcLastAddMac)) {
          foundMac = (docIpbmac._ftcLastAddMac || window._ftcLastAddMac).trim().replace(/:/g, '-').toUpperCase();
        }
      }

      const ipPassed = (foundIp === '192.168.1.100') && isSaved;
      const macPassed = (foundMac === 'AA-BB-CC-DD-EE-FF') && isSaved;
      const addPassed = hasAddedEntry && isSaved;

      // 5. Strict Bind (mặc định không chọn)
      const strictEl = docIpbmac.querySelector('input[name="sIpBndMacStrict"]');
      const strictChecked = strictEl ? strictEl.checked : false;
      const strictPassed = (!strictChecked) && isSaved;

      // 6. MAC Learning Time (mặc định không chọn)
      const macLearnEl = docIpbmac.querySelector('input[name="sMacLearnEnable"]');
      const macLearnChecked = macLearnEl ? macLearnEl.checked : false;
      const macLearnPassed = (!macLearnChecked) && isSaved;

      const details = [
        {
          id: 'ipbmac_enable',
          name: 'Chọn Enable',
          expected: 'Enable',
          actual: enableVal === '1' ? 'Enable' : 'Disable',
          passed: enablePassed,
          message: !isSaved ? (enableVal === '1' ? 'Đã chọn Enable nhưng chưa bấm OK để lưu cấu hình' : 'Chưa chọn Enable (hiện đang là Disable)') : (enableVal === '1' ? 'Đã chọn Enable' : 'Chưa chọn Enable (hiện đang là Disable)')
        },
        {
          id: 'ipbmac_ip_val',
          name: 'Địa chỉ IP: 192.168.1.100',
          expected: '192.168.1.100',
          actual: foundIp || (docIpbmac.querySelector('input[name="sIpAddress"]') ? docIpbmac.querySelector('input[name="sIpAddress"]').value : 'Chưa nhập'),
          passed: ipPassed,
          message: !isSaved ? (foundIp === '192.168.1.100' ? 'Đã thêm IP 192.168.1.100 nhưng chưa bấm OK để lưu cấu hình' : 'IP chưa đúng hoặc chưa thêm vào IP Bind List') : (foundIp === '192.168.1.100' ? 'Đúng IP 192.168.1.100' : 'IP chưa đúng hoặc chưa thêm vào IP Bind List')
        },
        {
          id: 'ipbmac_mac_val',
          name: 'Địa chỉ MAC: AA-BB-CC-DD-EE-FF',
          expected: 'AA-BB-CC-DD-EE-FF',
          actual: foundMac || (docIpbmac.querySelector('input[name="txtMac"]') ? docIpbmac.querySelector('input[name="txtMac"]').value : 'Chưa nhập'),
          passed: macPassed,
          message: !isSaved ? (foundMac === 'AA-BB-CC-DD-EE-FF' ? 'Đã thêm MAC AA-BB-CC-DD-EE-FF nhưng chưa bấm OK để lưu cấu hình' : 'MAC chưa đúng hoặc chưa thêm vào IP Bind List') : (foundMac === 'AA-BB-CC-DD-EE-FF' ? 'Đúng MAC AA-BB-CC-DD-EE-FF' : 'MAC chưa đúng hoặc chưa thêm vào IP Bind List')
        },
        {
          id: 'ipbmac_btn_add',
          name: 'Có nhấn nút Add (Thêm vào IP Bind List)',
          expected: 'Đã thêm vào IP Bind List',
          actual: hasAddedEntry ? 'Đã thêm' : 'Chưa thêm',
          passed: addPassed,
          message: !isSaved ? (hasAddedEntry ? 'Đã thêm thiết bị vào danh sách nhưng chưa bấm OK để lưu cấu hình' : 'Chưa nhấn nút Add để thêm thiết bị vào IP Bind List') : (hasAddedEntry ? 'Đã thêm thiết bị vào danh sách' : 'Chưa nhấn nút Add để thêm thiết bị vào IP Bind List')
        },
        {
          id: 'ipbmac_strict_bind',
          name: 'Strict Bind (mặc định)',
          expected: 'Không chọn (Tắt)',
          actual: strictChecked ? 'Đang bật' : 'Không chọn (Tắt)',
          passed: strictPassed,
          message: !isSaved ? (strictChecked ? 'Đang chọn Strict Bind (yêu cầu giữ mặc định không chọn)' : 'Đúng mặc định (không chọn) nhưng cần bấm OK để hoàn tất lưu cấu hình') : (strictChecked ? 'Đang chọn Strict Bind (yêu cầu giữ mặc định không chọn)' : 'Đúng mặc định (không chọn)')
        },
        {
          id: 'ipbmac_mac_learn',
          name: 'Enable MAC Learning Time (mặc định)',
          expected: 'Không chọn (Tắt)',
          actual: macLearnChecked ? 'Đang bật' : 'Không chọn (Tắt)',
          passed: macLearnPassed,
          message: !isSaved ? (macLearnChecked ? 'Đang chọn MAC Learning Time (yêu cầu giữ mặc định không chọn)' : 'Đúng mặc định (không chọn) nhưng cần bấm OK để hoàn tất lưu cấu hình') : (macLearnChecked ? 'Đang chọn MAC Learning Time (yêu cầu giữ mặc định không chọn)' : 'Đúng mặc định (không chọn)')
        }
      ];

      const passedCount = details.filter(d => d.passed).length;
      const totalRules = details.length;
      const allPassed = (passedCount === totalRules) && isSaved;
      const score = (!isSaved) ? 0 : (allPassed ? 100 : Math.round((passedCount / totalRules) * 100));

      return {
        passed: allPassed,
        score: score,
        passedCount: passedCount,
        totalRules: totalRules,
        details: details
      };
    }
  },
  guidePopups: (window.TOOLTIPS_VIGOR2927 && window.TOOLTIPS_VIGOR2927['vg2927-bai3']) || [
    {
      selector: '#menu-lan:not(.open) .menu-text, #menu-lan:not(.open)',
      text: 'Bước 1: chọn LAN',
      position: 'bottom',
      hideOnPage: 'ipbmac'
    },
    {
      selector: '#sub-lan:not(.hidden) #menu-lan-ipbmac .menu-text, #sub-lan:not(.hidden) #menu-lan-ipbmac',
      text: 'Bước 2: chọn Bind IP to MAC',
      position: 'bottom',
      hideOnPage: 'ipbmac'
    },
    {
      selector: '#lbl-ipbmac-disable, input[name="sIpBndMacEnable"][value="0"] ~ b, text:Disable, input[name="sIpBndMacEnable"][value="1"]',
      text: 'Bước 3: chọn Enable',
      position: 'right',
      offsetX: 8,
      condition: function (doc) {
        return !isVigor2927Bai3Added(doc) && !isVigor2927Bai3Enabled(doc);
      }
    },
    {
      selector: '#txt-ipbmac-ip, input[name="sIpAddress"]',
      text: 'Bước 4: nhập IP Address: 192.168.1.100',
      position: 'top',
      condition: function (doc) {
        return isVigor2927Bai3Enabled(doc) && !isVigor2927Bai3Added(doc) && (getVigor2927InputVal(doc, 'sIpAddress') !== '192.168.1.100');
      }
    },
    {
      selector: 'input[name="txtMac"]',
      text: 'Bước 5: nhập MAC Address: AA-BB-CC-DD-EE-FF',
      position: 'top',
      condition: function (doc) {
        return isVigor2927Bai3Enabled(doc) && !isVigor2927Bai3Added(doc) &&
          (getVigor2927InputVal(doc, 'sIpAddress') === '192.168.1.100') &&
          !isVigor2927Bai3MacMatch(getVigor2927InputVal(doc, 'txtMac'));
      }
    },
    {
      selector: 'input[name="btnAdd"], input[value="Add"]',
      text: 'Bước 6: chọn Add để thêm vào danh sách IP Bind List',
      position: 'top',
      condition: function (doc) {
        return isVigor2927Bai3Enabled(doc) && !isVigor2927Bai3Added(doc) &&
          (getVigor2927InputVal(doc, 'sIpAddress') === '192.168.1.100') &&
          isVigor2927Bai3MacMatch(getVigor2927InputVal(doc, 'txtMac'));
      }
    },
    {
      selector: '#btn-ipbmac-ok, input[name="btnOk"], input[value="OK"]',
      text: 'Bước 7: chọn OK để lưu cấu hình',
      position: 'top',
      condition: function (doc) {
        return isVigor2927Bai3Added(doc) && !doc._ftcIsSaved;
      }
    }
  ]
});
