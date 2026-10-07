/**
 * devices/ac1000cv2/lessons/bai4.js
 * Bài 4: Cấu hình DNS thủ công trên Internet Hub AC1000C V2 (theo chuẩn ONT AC1000F)
 */

window.DEVICE_AC1000CV2_LESSONS = window.DEVICE_AC1000CV2_LESSONS || [];

var index = window.DEVICE_AC1000CV2_LESSONS.findIndex(function (l) { return l.id === 'ac1000cv2-bai4' || l.id === 'LAB_AC1000CV2_04'; });
var lessonObj = {
  id: 'ac1000cv2-bai4',
  title: 'Bài 4 - Cấu hình DNS',
  subtitle: 'Cấu hình DNS',
  instructions: [
    '<b>Yêu cầu:</b> Thiết lập thông số DNS thủ công (Manually) trên cổng LAN:',
    '- Primary DNS: <span class="val">8.8.8.8</span>',
    '- Secondary DNS: <span class="val">8.8.4.4</span>'
  ],
  practiceUrl: '/sim_ac1000cv2/lan.html',
  onSimLoad: function (iframeWindow) {
    try {
      if (iframeWindow && iframeWindow.document) {
        var doc = iframeWindow.document;
        var pPath = (doc.location && doc.location.pathname) ? doc.location.pathname.toLowerCase() : '';
        var cache = window._sessionRuleCache || {};

        if (pPath.indexOf('lan') !== -1) {
          var ovwrt0 = doc.querySelector('#dns_ovwrt0, input[name="dns_overwrite"][value="1"]');
          var p1 = doc.querySelector('#dns_primary, input[name="dns_primary"]');
          var p2 = doc.querySelector('#dns_secondary, input[name="dns_secondary"]');

          if (cache['dns_primary'] && cache['dns_primary'].isSaved) {
            if (ovwrt0) {
              ovwrt0.checked = true;
              var row1 = doc.getElementById('primary_dns');
              var row2 = doc.getElementById('secondary_dns');
              if (row1) row1.style.display = '';
              if (row2) row2.style.display = '';
            }
            if (p1 && cache['dns_primary'].actualValue) p1.value = cache['dns_primary'].actualValue;
            if (p2 && cache['dns_secondary'] && cache['dns_secondary'].actualValue) p2.value = cache['dns_secondary'].actualValue;
            doc._ftcIsSaved = true;
          }
        }

        if (!doc._ftcInputResetAttached) {
          doc._ftcInputResetAttached = true;
          doc.addEventListener('input', function (e) {
            var t = e.target;
            if (t && (t.id === 'dns_primary' || t.name === 'dns_primary' || t.id === 'dns_secondary' || t.name === 'dns_secondary')) {
              doc._ftcIsSaved = false;
            }
          }, true);
          doc.addEventListener('change', function (e) {
            var t = e.target;
            if (t && (t.name === 'dns_overwrite' || t.id === 'dns_ovwrt0' || t.id === 'dns_ovwrt1')) {
              doc._ftcIsSaved = false;
            }
          }, true);
        }
      }
    } catch (e) { }
  },
  clearFields: [
    'input[name="dns_primary"]',
    '#dns_primary',
    'input[name="dns_secondary"]',
    '#dns_secondary'
  ],
  customClear: function () {
    try {
      var iframe = document.getElementById('device-iframe');
      if (iframe && iframe.contentWindow) {
        var doc = iframe.contentWindow.document;
        var pPath = (doc && doc.location && doc.location.pathname) ? doc.location.pathname.toLowerCase() : '';
        var cache = window._sessionRuleCache || {};

        if (pPath.indexOf('lan') !== -1 && (!cache['dns_primary'] || !cache['dns_primary'].isSaved)) {
          var p1 = doc.querySelector('#dns_primary, input[name="dns_primary"]');
          var p2 = doc.querySelector('#dns_secondary, input[name="dns_secondary"]');
          var ovwrt1 = doc.querySelector('#dns_ovwrt1, input[name="dns_overwrite"][value="0"]');
          var row1 = doc.getElementById('primary_dns');
          var row2 = doc.getElementById('secondary_dns');

          if (p1) p1.value = '';
          if (p2) p2.value = '';
          if (ovwrt1) ovwrt1.checked = true;
          if (row1) row1.style.display = 'none';
          if (row2) row2.style.display = 'none';
        }
      }
    } catch (e) { }
  },
  grading: {
    description: 'Kiểm tra thông số cấu hình DNS Server thủ công (DNS Overwrite, Primary DNS, Secondary DNS)',
    rules: [
      {
        id: 'dns_overwrite',
        name: 'Trạng thái DNS Overwrite Enable',
        selector: '#dns_ovwrt0, input[name="dns_overwrite"][value="1"]',
        expected: '1',
        displayExpected: 'Enable',
        type: 'radio_checked',
        required: true
      },
      {
        id: 'dns_primary',
        name: 'Primary DNS',
        selector: '#dns_primary, input[name="dns_primary"]',
        expected: '8.8.8.8',
        type: 'text_exact',
        trim: true,
        required: true
      },
      {
        id: 'dns_secondary',
        name: 'Secondary DNS',
        selector: '#dns_secondary, input[name="dns_secondary"]',
        expected: '8.8.4.4',
        type: 'text_exact',
        trim: true,
        required: true
      }
    ],

    customGrading: function (allDocs) {
      var cache = window._sessionRuleCache || {};
      var trackingCache = (window._trackingSession && window._trackingSession.ruleCache) ? window._trackingSession.ruleCache : {};

      var domState = {};
      var outOfScopeErrors = [];

      for (var i = 0; i < allDocs.length; i++) {
        try {
          var d = allDocs[i];
          var p = (d.location && d.location.pathname) ? d.location.pathname.toLowerCase() : '';
          var isSavedDoc = Boolean(d._ftcIsSaved || (window._hasClickedSaveInGuide && d._ftcIsSaved !== false));

          if (p.indexOf('lan') !== -1) {
            var ovwrt0 = d.querySelector('#dns_ovwrt0, input[name="dns_overwrite"][value="1"]');
            var p1 = d.querySelector('#dns_primary, input[name="dns_primary"]');
            var p2 = d.querySelector('#dns_secondary, input[name="dns_secondary"]');

            var ipEl = d.querySelector('#lan_ip, input[name="lan_ip"]');
            var dhcpDis = d.querySelector('#dhcp_enable1, input[name="dhcp_enable"][value="0"]');

            if (ovwrt0) {
              domState['dns_overwrite'] = { val: ovwrt0.checked ? '1' : '0', isSaved: isSavedDoc };
            }
            if (p1) {
              domState['dns_primary'] = { val: (p1.value || '').trim(), isSaved: isSavedDoc };
            }
            if (p2) {
              domState['dns_secondary'] = { val: (p2.value || '').trim(), isSaved: isSavedDoc };
            }

            // ── Kiểm tra ràng buộc bất biến: Không được đổi IP LAN hoặc tắt DHCP trong bài DNS ──
            if (ipEl && ipEl.value && ipEl.value.trim() !== '192.168.10.1' && ipEl.value.trim() !== '') {
              outOfScopeErrors.push({
                id: 'err_tamper_lan_ip',
                name: 'Thao tác ngoài phạm vi: Địa chỉ IP LAN',
                expected: '192.168.10.1 (Giữ nguyên)',
                actual: ipEl.value.trim(),
                passed: false,
                message: 'Không được thay đổi địa chỉ IP LAN trong bài cấu hình DNS'
              });
            }

            if (dhcpDis && dhcpDis.checked) {
              outOfScopeErrors.push({
                id: 'err_tamper_dhcp_dis',
                name: 'Thao tác ngoài phạm vi: Dịch vụ DHCP Server',
                expected: 'Enable (Giữ nguyên)',
                actual: 'Disable',
                passed: false,
                message: 'Cố tình tắt DHCP Server trong bài cấu hình DNS'
              });
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
          if (ruleId === 'dns_overwrite') {
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

      // 1. DNS Overwrite: Enable
      var r1 = evaluateCriteria('dns_overwrite', 'Trạng thái DNS Overwrite Enable', 'Enable', function (v) {
        return v === '1' || v === 'true';
      });
      if (r1.passed) passedCount++;
      details.push(r1);

      // 2. Primary DNS: 8.8.8.8
      var r2 = evaluateCriteria('dns_primary', 'Primary DNS', '8.8.8.8', function (v) {
        return v === '8.8.8.8';
      });
      if (r2.passed) passedCount++;
      details.push(r2);

      // 3. Secondary DNS: 8.8.4.4
      var r3 = evaluateCriteria('dns_secondary', 'Secondary DNS', '8.8.4.4', function (v) {
        return v === '8.8.4.4';
      });
      if (r3.passed) passedCount++;
      details.push(r3);

      // Bổ sung các lỗi can thiệp ngoài phạm vi vào danh sách details
      if (outOfScopeErrors.length > 0) {
        outOfScopeErrors.forEach(function (err) {
          details.push(err);
        });
      }

      var totalRules = 3 + outOfScopeErrors.length;
      var allPassed = (passedCount === 3) && (outOfScopeErrors.length === 0);
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
        (cache['dns_primary'] && cache['dns_primary'].isSaved)
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
