/**
 * devices/ac1000cv2/lessons/bai5.js
 * Bài 5: Cấu hình địa chỉ mạng LAN & DHCP trên Internet Hub AC1000C V2 (theo chuẩn ONT AC1000F)
 */

window.DEVICE_AC1000CV2_LESSONS = window.DEVICE_AC1000CV2_LESSONS || [];

var index = window.DEVICE_AC1000CV2_LESSONS.findIndex(function (l) { return l.id === 'ac1000cv2-bai5' || l.id === 'LAB_AC1000CV2_05'; });
var lessonObj = {
  id: 'ac1000cv2-bai5',
  title: 'Bài 5 - Cấu hình DHCP',
  subtitle: 'Cấu hình DHCP',
  instructions: [
    '<b>Yêu cầu:</b> Thực hiện thay đổi cấu hình DHCP trên thiết bị:',
    '- IP Address: <span class="val">192.168.1.1</span>',
    '- IP Subnet Mask: <span class="val">255.255.255.0</span>',
    '- DHCP Server: <span class="val">Enable</span>',
    '- Start IP: <span class="val">192.168.1.2</span>',
    '- End IP: <span class="val">192.168.1.254</span>',
    '- Lease Time: <span class="val">86400</span>'
  ],
  practiceUrl: '/sim_ac1000cv2/lan.html',
  onSimLoad: function (iframeWindow) {
    try {
      if (iframeWindow) {
        // Ngăn chặn popup alert trình duyệt làm gián đoạn KTV khi thay đổi subnet
        iframeWindow.alert = function (msg) {
          try { console.log('[Sim Alert Suppressed]:', msg); } catch (e) { }
        };
      }

      if (iframeWindow && iframeWindow.document) {
        var doc = iframeWindow.document;
        var pPath = (doc.location && doc.location.pathname) ? doc.location.pathname.toLowerCase() : '';
        var cache = window._sessionRuleCache || {};

        if (pPath.indexOf('lan') !== -1) {
          var ipEl = doc.querySelector('#lan_ip, input[name="lan_ip"]');
          var maskEl = doc.querySelector('#lan_mask, input[name="lan_mask"]');
          var dhcp0 = doc.querySelector('#dhcp_enable0, input[name="dhcp_enable"][value="1"]');
          var startEl = doc.querySelector('#start_ip, #startip, input[name="start_ip"], input[name="startip"]');
          var endEl = doc.querySelector('#end_ip, #endip, input[name="end_ip"], input[name="endip"]');

          if (cache['lan_ip'] && cache['lan_ip'].isSaved) {
            if (ipEl && cache['lan_ip'].actualValue) ipEl.value = cache['lan_ip'].actualValue;
            if (maskEl && cache['lan_mask'] && cache['lan_mask'].actualValue) maskEl.value = cache['lan_mask'].actualValue;
            if (dhcp0 && cache['dhcp_enable'] && cache['dhcp_enable'].actualValue === '1') dhcp0.checked = true;
            if (startEl && cache['dhcp_start'] && cache['dhcp_start'].actualValue) startEl.value = cache['dhcp_start'].actualValue;
            if (endEl && cache['dhcp_end'] && cache['dhcp_end'].actualValue) endEl.value = cache['dhcp_end'].actualValue;
            doc._ftcIsSaved = true;
          } else {
            // Mặc định ban đầu của thiết bị là 192.168.10.x
            if (ipEl && (!ipEl.value || ipEl.value === '192.168.1.1')) ipEl.value = '192.168.10.1';
            if (startEl && (!startEl.value || startEl.value === '192.168.1.2')) startEl.value = '192.168.10.2';
            if (endEl && (!endEl.value || endEl.value === '192.168.1.254')) endEl.value = '192.168.10.254';
          }
        }

        if (!doc._ftcInputResetAttached) {
          doc._ftcInputResetAttached = true;
          doc.addEventListener('input', function (e) {
            var t = e.target;
            if (t && (t.id === 'lan_ip' || t.name === 'lan_ip' || t.id === 'lan_mask' || t.name === 'lan_mask' ||
              t.id === 'start_ip' || t.name === 'start_ip' || t.id === 'end_ip' || t.name === 'end_ip' ||
              t.id === 'startip' || t.name === 'startip' || t.id === 'endip' || t.name === 'endip')) {
              doc._ftcIsSaved = false;
            }
          }, true);
          doc.addEventListener('change', function (e) {
            var t = e.target;
            if (t && (t.name === 'dhcp_enable' || t.id === 'dhcp_enable0' || t.id === 'dhcp_enable1')) {
              doc._ftcIsSaved = false;
            }
          }, true);
        }
      }
    } catch (e) { }
  },
  clearFields: [],
  customClear: function () {
    try {
      var iframe = document.getElementById('device-iframe');
      if (iframe && iframe.contentWindow) {
        var doc = iframe.contentWindow.document;
        var pPath = (doc && doc.location && doc.location.pathname) ? doc.location.pathname.toLowerCase() : '';
        var cache = window._sessionRuleCache || {};

        if (pPath.indexOf('lan') !== -1 && (!cache['lan_ip'] || !cache['lan_ip'].isSaved)) {
          var ipEl = doc.querySelector('#lan_ip, input[name="lan_ip"]');
          var maskEl = doc.querySelector('#lan_mask, input[name="lan_mask"]');
          var dhcp0 = doc.querySelector('#dhcp_enable0, input[name="dhcp_enable"][value="1"]');
          var startEl = doc.querySelector('#start_ip, #startip, input[name="start_ip"], input[name="startip"]');
          var endEl = doc.querySelector('#end_ip, #endip, input[name="end_ip"], input[name="endip"]');

          // Đặt lại các giá trị mặc định ban đầu của thiết bị (192.168.10.x)
          if (ipEl) ipEl.value = '192.168.10.1';
          if (maskEl) maskEl.value = '255.255.255.0';
          if (dhcp0) dhcp0.checked = true;
          if (startEl) startEl.value = '192.168.10.2';
          if (endEl) endEl.value = '192.168.10.254';
        }
      }
    } catch (e) { }
  },
  grading: {
    description: 'Kiểm tra thông số cấu hình LAN IP và dải DHCP IP (IP Address 192.168.1.1, Subnet Mask 255.255.255.0, DHCP Enable, Start IP 192.168.1.2, End IP 192.168.1.254)',
    rules: [
      {
        id: 'lan_ip',
        name: 'Địa chỉ IP LAN',
        selector: '#lan_ip, input[name="lan_ip"]',
        expected: '192.168.1.1',
        type: 'text_exact',
        trim: true,
        required: true
      },
      {
        id: 'lan_mask',
        name: 'Subnet Mask',
        selector: '#lan_mask, input[name="lan_mask"]',
        expected: '255.255.255.0',
        type: 'text_exact',
        trim: true,
        required: true
      },
      {
        id: 'dhcp_enable',
        name: 'Trạng thái DHCP Enable',
        selector: '#dhcp_enable0, input[name="dhcp_enable"][value="1"]',
        expected: '1',
        displayExpected: 'Enable',
        type: 'radio_checked',
        required: true
      },
      {
        id: 'dhcp_start',
        name: 'Start IP Pool',
        selector: '#start_ip, #startip, input[name="start_ip"], input[name="startip"]',
        expected: '192.168.1.2',
        type: 'text_exact',
        trim: true,
        required: true
      },
      {
        id: 'dhcp_end',
        name: 'End IP Pool',
        selector: '#end_ip, #endip, input[name="end_ip"], input[name="endip"]',
        expected: '192.168.1.254',
        type: 'text_exact',
        trim: true,
        required: true
      }
    ],

    customGrading: function (allDocs) {
      var cache = window._sessionRuleCache || {};
      var trackingCache = (window._trackingSession && window._trackingSession.ruleCache) ? window._trackingSession.ruleCache : {};

      var domState = {};
      for (var i = 0; i < allDocs.length; i++) {
        try {
          var d = allDocs[i];
          var p = (d.location && d.location.pathname) ? d.location.pathname.toLowerCase() : '';
          var isSavedDoc = Boolean(d._ftcIsSaved || (window._hasClickedSaveInGuide && d._ftcIsSaved !== false));

          if (p.indexOf('lan') !== -1) {
            var ipEl = d.querySelector('#lan_ip, input[name="lan_ip"]');
            var maskEl = d.querySelector('#lan_mask, input[name="lan_mask"]');
            var dhcp0 = d.querySelector('#dhcp_enable0, input[name="dhcp_enable"][value="1"]');
            var startEl = d.querySelector('#start_ip, #startip, input[name="start_ip"], input[name="startip"]');
            var endEl = d.querySelector('#end_ip, #endip, input[name="end_ip"], input[name="endip"]');

            if (ipEl) {
              domState['lan_ip'] = { val: (ipEl.value || '').trim(), isSaved: isSavedDoc };
            }
            if (maskEl) {
              domState['lan_mask'] = { val: (maskEl.value || '').trim(), isSaved: isSavedDoc };
            }
            if (dhcp0) {
              domState['dhcp_enable'] = { val: dhcp0.checked ? '1' : '0', isSaved: isSavedDoc };
            }
            if (startEl) {
              domState['dhcp_start'] = { val: (startEl.value || '').trim(), isSaved: isSavedDoc };
            }
            if (endEl) {
              domState['dhcp_end'] = { val: (endEl.value || '').trim(), isSaved: isSavedDoc };
            }
          }
        } catch (e) { }
      }

      function evaluateCriteria(ruleId, ruleName, expectedDisplay, validator) {
        var cached = cache[ruleId] || trackingCache[ruleId];
        var inDom = domState[ruleId];

        var actualVal = '';
        var isSaved = false;

        if (inDom) {
          actualVal = inDom.val;
          isSaved = inDom.isSaved;
          if (!isSaved && cached && cached.isSaved && cached.actualValue === actualVal) {
            isSaved = true;
          }
        } else if (cached) {
          actualVal = cached.actualValue || '';
          isSaved = Boolean(cached.isSaved);
        }

        var isValCorrect = validator(actualVal);
        var passed = isValCorrect && isSaved;

        var actualDisplay = actualVal || '';
        var msg = '';
        if (passed) {
          msg = 'Chính xác';
        } else if (!actualVal) {
          actualDisplay = '(Chưa chọn / Chưa nhập)';
          msg = 'Chưa cấu hình';
        } else if (!isSaved) {
          if (ruleId === 'dhcp_enable') {
            actualDisplay = (actualVal === '1' ? 'Enable' : 'Disable') + ' (Chưa lưu)';
          } else {
            actualDisplay = actualVal + ' (Chưa lưu)';
          }
          msg = 'Chưa bấm Save/Apply để lưu cấu hình';
        } else {
          msg = 'Mong muốn: "' + expectedDisplay + '", Thực tế: "' + actualVal + '"';
        }

        return {
          id: ruleId,
          name: ruleName,
          expected: expectedDisplay,
          actual: actualDisplay,
          passed: passed,
          message: msg
        };
      }

      var details = [];
      var passedCount = 0;
      var outOfScopeErrors = [];

      // ── Bắt lỗi thao tác ngoài phạm vi / sai logic mạng ──
      var actualLanIp = domState['lan_ip'] ? domState['lan_ip'].val : (cache['lan_ip'] ? cache['lan_ip'].actualValue : '');
      var actualStartIp = domState['dhcp_start'] ? domState['dhcp_start'].val : (cache['dhcp_start'] ? cache['dhcp_start'].actualValue : '');
      var actualEndIp = domState['dhcp_end'] ? domState['dhcp_end'].val : (cache['dhcp_end'] ? cache['dhcp_end'].actualValue : '');
      var actualDhcpEn = domState['dhcp_enable'] ? domState['dhcp_enable'].val : (cache['dhcp_enable'] ? cache['dhcp_enable'].actualValue : '');

      if (actualDhcpEn === '0') {
        outOfScopeErrors.push({
          id: 'err_dhcp_disabled',
          name: 'Thao tác ngoài phạm vi: Dịch vụ DHCP Server',
          expected: 'Enable',
          actual: 'Disable',
          passed: false,
          message: 'Cố tình tắt DHCP Server khi đề bài yêu cầu Enable'
        });
      }

      // Kiểm tra logic Start IP < End IP nếu cả hai đều có dạng IP
      if (actualStartIp && actualEndIp) {
        var startLastOctet = parseInt(actualStartIp.split('.').pop(), 10);
        var endLastOctet = parseInt(actualEndIp.split('.').pop(), 10);
        if (!isNaN(startLastOctet) && !isNaN(endLastOctet) && startLastOctet >= endLastOctet) {
          outOfScopeErrors.push({
            id: 'err_dhcp_range_invalid',
            name: 'Ràng buộc logic: Dải IP Pool',
            expected: 'Start IP < End IP (192.168.1.2 < 192.168.1.254)',
            actual: 'Start: ' + actualStartIp + ' >= End: ' + actualEndIp,
            passed: false,
            message: 'Dải IP DHCP không hợp lệ: Start IP phải nhỏ hơn End IP'
          });
        }
      }

      // 1. IP Address: Bắt buộc đúng 192.168.1.1 (tuyệt đối không chấp nhận mặc định 192.168.10.1)
      var r1 = evaluateCriteria('lan_ip', 'Địa chỉ IP LAN', '192.168.1.1', function (v) {
        return v === '192.168.1.1';
      });
      if (r1.passed) passedCount++;
      else if (actualLanIp === '192.168.10.1') {
        r1.message = 'Chưa đổi IP LAN sang 192.168.1.1 (vẫn giữ nguyên mặc định 192.168.10.1)';
      }
      details.push(r1);

      // 2. Subnet Mask: 255.255.255.0
      var r2 = evaluateCriteria('lan_mask', 'Subnet Mask', '255.255.255.0', function (v) {
        return v === '255.255.255.0';
      });
      if (r2.passed) passedCount++;
      details.push(r2);

      // 3. DHCP Enable: 1
      var r3 = evaluateCriteria('dhcp_enable', 'Trạng thái DHCP Enable', 'Enable', function (v) {
        return v === '1' || v === 'true';
      });
      if (r3.passed) passedCount++;
      details.push(r3);

      // 4. Start IP: Bắt buộc đúng 192.168.1.2 (tuyệt đối không chấp nhận 192.168.10.2)
      var r4 = evaluateCriteria('dhcp_start', 'Start IP Pool', '192.168.1.2', function (v) {
        return v === '192.168.1.2';
      });
      if (r4.passed) passedCount++;
      else if (actualStartIp === '192.168.10.2') {
        r4.message = 'Chưa đổi Start IP sang 192.168.1.2 (vẫn giữ nguyên mặc định 192.168.10.2)';
      }
      details.push(r4);

      // 5. End IP: Bắt buộc đúng 192.168.1.254 (tuyệt đối không chấp nhận 192.168.10.254)
      var r5 = evaluateCriteria('dhcp_end', 'End IP Pool', '192.168.1.254', function (v) {
        return v === '192.168.1.254';
      });
      if (r5.passed) passedCount++;
      else if (actualEndIp === '192.168.10.254') {
        r5.message = 'Chưa đổi End IP sang 192.168.1.254 (vẫn giữ nguyên mặc định 192.168.10.254)';
      }
      details.push(r5);

      // Bổ sung các lỗi can thiệp ngoài phạm vi vào danh sách details
      if (outOfScopeErrors.length > 0) {
        outOfScopeErrors.forEach(function (err) {
          details.push(err);
        });
      }

      var totalRules = 5 + outOfScopeErrors.length;
      var allPassed = (passedCount === 5) && (outOfScopeErrors.length === 0);
      var score = allPassed ? 100 : Math.round((passedCount / totalRules) * 100);

      var isLanDocSaved = false;
      for (var k = 0; k < allDocs.length; k++) {
        try {
          var docItem = allDocs[k];
          var pathItem = (docItem.location && docItem.location.pathname) ? docItem.location.pathname.toLowerCase() : '';
          if (pathItem.indexOf('lan') !== -1 && docItem._ftcIsSaved) {
            isLanDocSaved = true;
          }
        } catch (e) { }
      }

      var applyClicked = Boolean(
        isLanDocSaved ||
        (cache['lan_ip'] && cache['lan_ip'].isSaved)
      );

      var daVaoTrangCuoi = Boolean(applyClicked);
      var trangHienTaiDat = !applyClicked || allPassed;

      return {
        passed: allPassed,
        score: score,
        passedCount: passedCount,
        totalRules: totalRules,
        details: details,
        daVaoTrangCuoi: daVaoTrangCuoi,
        trangHienTaiDat: trangHienTaiDat
      };
    }
  }
};

if (index !== -1) {
  window.DEVICE_AC1000CV2_LESSONS[index] = lessonObj;
} else {
  window.DEVICE_AC1000CV2_LESSONS.push(lessonObj);
}
