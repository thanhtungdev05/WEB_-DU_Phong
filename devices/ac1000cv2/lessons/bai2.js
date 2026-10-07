/**
 * devices/ac1000cv2/lessons/bai2.js
 * Bài 2: Cấu hình mạng Wi-Fi (2.4G & 5G) trên Internet Hub AC1000C V2 (theo chuẩn ONT AC1000F)
 */

window.DEVICE_AC1000CV2_LESSONS = window.DEVICE_AC1000CV2_LESSONS || [];

var index = window.DEVICE_AC1000CV2_LESSONS.findIndex(function (l) { return l.id === 'ac1000cv2-bai2' || l.id === 'LAB_AC1000CV2_02'; });
var lessonObj = {
  id: 'ac1000cv2-bai2',
  title: 'Bài 2 - Cấu hình Wi-Fi',
  subtitle: 'Cấu hình Wi-Fi',
  instructions: [
    '<b>Yêu cầu:</b>',
    'Cấu hình đúng cho cả 2 băng tần <b>2.4G</b> và <b>5G</b> theo thông số:',
    '- SSID Name: <span class="val">FPT Telecom</span>',
    '- WPA Key: <span class="val">19006600</span>',
  ],
  practiceUrl: '/sim_ac1000cv2/wifissid.html',
  allowedSelectors: [
    '#btn_apply',
    '#btn_apply1',
    '#btn_apply2',
    '#btn_apply3',
    'a#btn_apply',
    'a#btn_apply1',
    'a#btn_apply2',
    'a#btn_apply3',
    '.cfgstep a.btn',
    '#security_open a.btn',
    '#security_wpa a.btn',
    '#security_wep a.btn',
    '#encryption_wpa_type',
    'select[name="encryption_wpa_type"]',
    '#ssid_enable',
    '#ssid_broadcast_on',
    '#wmm_on',
    '#btn_refresh'
  ],
  onSimLoad: function (iframeWindow) {
    try {
      if (iframeWindow && iframeWindow.document) {
        var doc = iframeWindow.document;
        var pPath = (doc.location && doc.location.pathname) ? doc.location.pathname.toLowerCase() : '';
        var cache = window._sessionRuleCache || {};

        if (pPath.indexOf('wifissid') !== -1 && !cache['wifi5_key']) {
          window._ftcAc1000cv2FinalApplyClicked = false;
        }

        if (pPath.indexOf('wifi5ssid') !== -1) {
          var el = doc.querySelector('#ssid_network_name, input[name="ssid_network_name"]');
          if (el && cache['wifi5_ssid']) {
            if (!el.value || el.value.indexOf('FPT Telecom-') === 0 || el.value.indexOf('FPT_Telecom') === 0) {
              el.value = cache['wifi5_ssid'].actualValue;
            }
            doc._ftcIsSaved = true;
          }
        } else if (pPath.indexOf('wifissid') !== -1) {
          var el = doc.querySelector('#ssid_network_name, input[name="ssid_network_name"]');
          if (el && cache['wifi24_ssid']) {
            if (!el.value || el.value.indexOf('FPT Telecom-') === 0 || el.value.indexOf('FPT_Telecom') === 0) {
              el.value = cache['wifi24_ssid'].actualValue;
            }
            doc._ftcIsSaved = true;
          }
        }

        if (pPath.indexOf('wifi5secu') !== -1) {
          var el = doc.querySelector('#security_wpa_key, input[name="security_wpa_key"]');
          if (el) {
            if (cache['wifi5_key'] && cache['wifi5_key'].actualValue) {
              el.value = cache['wifi5_key'].actualValue;
              doc._ftcIsSaved = true;
            } else {
              el.value = '';
              doc._ftcIsSaved = false;
            }
          }
        } else if (pPath.indexOf('wifisecu') !== -1) {
          var el = doc.querySelector('#security_wpa_key, input[name="security_wpa_key"]');
          if (el) {
            if (cache['wifi24_key'] && cache['wifi24_key'].actualValue) {
              el.value = cache['wifi24_key'].actualValue;
              doc._ftcIsSaved = true;
            } else {
              el.value = '';
              doc._ftcIsSaved = false;
            }
          }
        }

        if (!doc._ftcInputResetAttached) {
          doc._ftcInputResetAttached = true;
          doc.addEventListener('input', function (e) {
            var t = e.target;
            if (t && (t.id === 'ssid_network_name' || t.name === 'ssid_network_name' || t.id === 'security_wpa_key' || t.name === 'security_wpa_key')) {
              doc._ftcIsSaved = false;
              if (pPath.indexOf('wifi5secu') !== -1) {
                window._ftcAc1000cv2FinalApplyClicked = false;
                if (cache['wifi5_key']) cache['wifi5_key'].isSaved = false;
              } else if (pPath.indexOf('wifisecu') !== -1) {
                if (cache['wifi24_key']) cache['wifi24_key'].isSaved = false;
              } else if (pPath.indexOf('wifi5ssid') !== -1) {
                if (cache['wifi5_ssid']) cache['wifi5_ssid'].isSaved = false;
              } else if (pPath.indexOf('wifissid') !== -1) {
                if (cache['wifi24_ssid']) cache['wifi24_ssid'].isSaved = false;
              }
            }
          }, true);
        }
      }
    } catch (e) { }
  },
  clearFields: [
    'input[name="ssid_network_name"]',
    '#ssid_network_name',
    'input[name="security_wpa_key"]',
    '#security_wpa_key'
  ],
  customClear: function () {
    try {
      var iframe = document.getElementById('device-iframe');
      if (iframe && iframe.contentWindow) {
        var doc = iframe.contentWindow.document;
        var pPath = (doc && doc.location && doc.location.pathname) ? doc.location.pathname.toLowerCase() : '';
        var cache = window._sessionRuleCache || {};
        if (pPath.indexOf('wifisecu') !== -1 && (!cache['wifi24_key'] || !cache['wifi24_key'].isSaved)) {
          var el = doc.querySelector('#security_wpa_key, input[name="security_wpa_key"]');
          if (el && (el.value === '19a0107e' || el.value === 'fpttelecom@2026' || el.value === '12345678' || !cache['wifi24_key'])) el.value = '';
        }
        if (pPath.indexOf('wifi5secu') !== -1 && (!cache['wifi5_key'] || !cache['wifi5_key'].isSaved)) {
          var el = doc.querySelector('#security_wpa_key, input[name="security_wpa_key"]');
          if (el && (el.value === '19a0107e' || el.value === 'fpttelecom@2026' || !cache['wifi5_key'])) el.value = '';
        }
      }
    } catch (e) { }
  },
  grading: {
    description: 'Kiểm tra thông số cấu hình Wi-Fi 2.4GHz & 5GHz (SSID & Security Passphrase)',
    rules: [
      {
        id: 'wifi24_ssid',
        name: '[2.4G] Tên mạng SSID',
        selector: '#ssid_network_name, input[name="ssid_network_name"]',
        expected: 'FPT Telecom',
        type: 'text_exact',
        trim: true,
        required: true
      },
      {
        id: 'wifi24_key',
        name: '[2.4G] Security Passphrase',
        selector: '#security_wpa_key, input[name="security_wpa_key"]',
        expected: '19006600',
        displayExpected: '19006600',
        type: 'text_exact',
        trim: true,
        required: true
      },
      {
        id: 'wifi5_ssid',
        name: '[5G] Tên mạng SSID',
        selector: '#ssid_network_name, input[name="ssid_network_name"]',
        expected: 'FPT Telecom',
        displayExpected: 'FPT Telecom',
        type: 'text_exact',
        trim: true,
        required: true
      },
      {
        id: 'wifi5_key',
        name: '[5G] Security Passphrase',
        selector: '#security_wpa_key, input[name="security_wpa_key"]',
        expected: '19006600',
        displayExpected: '19006600',
        type: 'text_exact',
        trim: true,
        required: true
      }
    ],

    customGrading: function (allDocs) {
      var cache = window._sessionRuleCache || {};
      var trackingCache = (window._trackingSession && window._trackingSession.ruleCache) ? window._trackingSession.ruleCache : {};

      // 1. Quét dữ liệu từ các frames đang hiển thị trong iframe
      var domState = {};
      var outOfScopeErrors = [];

      var curPath = '';
      for (var pIdx = 0; pIdx < allDocs.length; pIdx++) {
        try {
          var pDoc = allDocs[pIdx];
          var pName = (pDoc.location && pDoc.location.pathname) ? pDoc.location.pathname.toLowerCase() : '';
          if (pName.indexOf('wifi5secu') !== -1) { curPath = 'wifi5secu'; break; }
          if (pName.indexOf('wifi5ssid') !== -1) { curPath = 'wifi5ssid'; break; }
          if (pName.indexOf('wifisecu') !== -1) { curPath = 'wifisecu'; break; }
          if (pName.indexOf('wifissid') !== -1) { curPath = 'wifissid'; break; }
        } catch (e) { }
      }

      for (var i = 0; i < allDocs.length; i++) {
        try {
          var d = allDocs[i];
          var p = (d.location && d.location.pathname) ? d.location.pathname.toLowerCase() : '';
          var isSavedDoc = Boolean(d._ftcIsSaved || (window._hasClickedSaveInGuide && d._ftcIsSaved !== false));

          if (p.indexOf('wifi5ssid') !== -1) {
            var el = d.querySelector('#ssid_network_name, input[name="ssid_network_name"]');
            var sListEl = d.querySelector('#ssid_list, select[name="ssid_list"]');

            if (el) domState['wifi5_ssid'] = { val: (el.value || '').trim(), isSaved: isSavedDoc };
            if (sListEl && sListEl.value && sListEl.value !== '0' && sListEl.value !== 'SSID 1') {
              outOfScopeErrors.push({
                id: 'err_wifi5_ssid_idx',
                name: 'Thao tác ngoài phạm vi: [5G] Chọn sai SSID',
                expected: 'SSID 1',
                actual: 'SSID ' + (parseInt(sListEl.value, 10) + 1),
                passed: false,
                message: 'Bài 2 yêu cầu cấu hình SSID chính (SSID 1), không cấu hình sang SSID khác'
              });
            }
          } else if (p.indexOf('wifissid') !== -1) {
            var el = d.querySelector('#ssid_network_name, input[name="ssid_network_name"]');
            var sListEl = d.querySelector('#ssid_list, select[name="ssid_list"]');

            if (el) domState['wifi24_ssid'] = { val: (el.value || '').trim(), isSaved: isSavedDoc };
            if (sListEl && sListEl.value && sListEl.value !== '0' && sListEl.value !== 'SSID 1') {
              outOfScopeErrors.push({
                id: 'err_wifi24_ssid_idx',
                name: 'Thao tác ngoài phạm vi: [2.4G] Chọn sai SSID',
                expected: 'SSID 1',
                actual: 'SSID ' + (parseInt(sListEl.value, 10) + 1),
                passed: false,
                message: 'Bài 2 yêu cầu cấu hình SSID chính (SSID 1), không cấu hình sang SSID khác'
              });
            }
          }

          if (p.indexOf('wifi5secu') !== -1) {
            var el = d.querySelector('#security_wpa_key, input[name="security_wpa_key"]');
            var modeEl = d.querySelector('#select_security_mode, select[name="select_security_mode"], #security_mode, select[name="security_mode"]');
            if (el) domState['wifi5_key'] = { val: (el.value || '').trim(), isSaved: isSavedDoc };
            if (modeEl) {
              var modeVal = (modeEl.value || '').trim();
              var modeText = modeEl.options && modeEl.selectedIndex >= 0 ? modeEl.options[modeEl.selectedIndex].text : modeVal;
              var isUnsafe = (modeVal === '4' || modeVal === '5' || /open|wep/i.test(modeText));
              if (isUnsafe) {
                outOfScopeErrors.push({
                  id: 'err_wifi5_mode',
                  name: 'Thao tác ngoài phạm vi: [5G] Chuẩn bảo mật',
                  expected: 'WPA2-PSK (AES)',
                  actual: modeText || modeVal,
                  passed: false,
                  message: 'Không được đổi chuẩn bảo mật Wi-Fi 5GHz sang Open (Không mật khẩu) hoặc WEP'
                });
              }
            }
          } else if (p.indexOf('wifisecu') !== -1) {
            var el = d.querySelector('#security_wpa_key, input[name="security_wpa_key"]');
            var modeEl = d.querySelector('#select_security_mode, select[name="select_security_mode"], #security_mode, select[name="security_mode"]');
            if (el) domState['wifi24_key'] = { val: (el.value || '').trim(), isSaved: isSavedDoc };
            if (modeEl) {
              var modeVal = (modeEl.value || '').trim();
              var modeText = modeEl.options && modeEl.selectedIndex >= 0 ? modeEl.options[modeEl.selectedIndex].text : modeVal;
              var isUnsafe = (modeVal === '4' || modeVal === '5' || /open|wep/i.test(modeText));
              if (isUnsafe) {
                outOfScopeErrors.push({
                  id: 'err_wifi24_mode',
                  name: 'Thao tác ngoài phạm vi: [2.4G] Chuẩn bảo mật',
                  expected: 'WPA2-PSK (AES)',
                  actual: modeText || modeVal,
                  passed: false,
                  message: 'Không được đổi chuẩn bảo mật Wi-Fi 2.4GHz sang Open (Không mật khẩu) hoặc WEP'
                });
              }
            }
          }
        } catch (e) { }
      }

      function hasOosErr(id) {
        return outOfScopeErrors.some(function (e) { return e.id === id; });
      }

      // Đọc tiếp các lỗi ngoài phạm vi đã được lưu vết qua các bước/trang trước đó từ Cache
      var oos24 = cache['wifi24_out_of_scope'] || trackingCache['wifi24_out_of_scope'];
      if (oos24) {
        if (oos24.ssid_idx && oos24.ssid_idx !== '0' && oos24.ssid_idx !== 'SSID 1' && !hasOosErr('err_wifi24_ssid_idx')) {
          outOfScopeErrors.push({
            id: 'err_wifi24_ssid_idx',
            name: 'Thao tác ngoài phạm vi: [2.4G] Chọn sai SSID',
            expected: 'SSID 1',
            actual: 'SSID ' + (parseInt(oos24.ssid_idx, 10) + 1),
            passed: false,
            message: 'Bài 2 yêu cầu cấu hình SSID chính (SSID 1), không cấu hình sang SSID khác'
          });
        }
      }

      var sec24 = cache['wifi24_sec_mode'] || trackingCache['wifi24_sec_mode'];
      if (sec24 && sec24.isUnsafe && !hasOosErr('err_wifi24_mode')) {
        outOfScopeErrors.push({
          id: 'err_wifi24_mode',
          name: 'Thao tác ngoài phạm vi: [2.4G] Chuẩn bảo mật',
          expected: 'WPA2-PSK (AES)',
          actual: sec24.modeText || sec24.modeVal,
          passed: false,
          message: 'Không được đổi chuẩn bảo mật Wi-Fi 2.4GHz sang Open (Không mật khẩu) hoặc WEP'
        });
      }

      var oos5 = cache['wifi5_out_of_scope'] || trackingCache['wifi5_out_of_scope'];
      if (oos5) {
        if (oos5.ssid_idx && oos5.ssid_idx !== '0' && oos5.ssid_idx !== 'SSID 1' && !hasOosErr('err_wifi5_ssid_idx')) {
          outOfScopeErrors.push({
            id: 'err_wifi5_ssid_idx',
            name: 'Thao tác ngoài phạm vi: [5G] Chọn sai SSID',
            expected: 'SSID 1',
            actual: 'SSID ' + (parseInt(oos5.ssid_idx, 10) + 1),
            passed: false,
            message: 'Bài 2 yêu cầu cấu hình SSID chính (SSID 1), không cấu hình sang SSID khác'
          });
        }
      }

      var sec5 = cache['wifi5_sec_mode'] || trackingCache['wifi5_sec_mode'];
      if (sec5 && sec5.isUnsafe && !hasOosErr('err_wifi5_mode')) {
        outOfScopeErrors.push({
          id: 'err_wifi5_mode',
          name: 'Thao tác ngoài phạm vi: [5G] Chuẩn bảo mật',
          expected: 'WPA2-PSK (AES)',
          actual: sec5.modeText || sec5.modeVal,
          passed: false,
          message: 'Không được đổi chuẩn bảo mật Wi-Fi 5GHz sang Open (Không mật khẩu) hoặc WEP'
        });
      }

      var isFinalStepDoc = false;
      var isFinalDocSaved = false;
      for (var k = 0; k < allDocs.length; k++) {
        try {
          var docItem = allDocs[k];
          var pathItem = (docItem.location && docItem.location.pathname) ? docItem.location.pathname.toLowerCase() : '';
          if (pathItem.indexOf('wifi5secu') !== -1) {
            isFinalStepDoc = true;
            if (docItem._ftcIsSaved) isFinalDocSaved = true;
          }
        } catch (e) { }
      }

      var finalApplyClicked = Boolean(
        window._ftcAc1000cv2FinalApplyClicked ||
        (isFinalStepDoc && isFinalDocSaved) ||
        (cache['wifi5_key'] && cache['wifi5_key'].isSaved)
      );

      var activeMode = (typeof currentMode !== 'undefined' ? currentMode : (window.currentMode || 'practice'));
      var isGuideInProgress = (activeMode === 'guide') && !finalApplyClicked;

      var step1Reached = true;
      var step2Reached = Boolean(domState['wifi24_key'] || (cache['wifi24_key'] && cache['wifi24_key'].isSaved) || curPath === 'wifisecu' || curPath === 'wifi5ssid' || curPath === 'wifi5secu' || finalApplyClicked);
      var step3Reached = Boolean(domState['wifi5_ssid'] || (cache['wifi5_ssid'] && cache['wifi5_ssid'].isSaved) || curPath === 'wifi5ssid' || curPath === 'wifi5secu' || finalApplyClicked);
      var step4Reached = Boolean(domState['wifi5_key'] || (cache['wifi5_key'] && cache['wifi5_key'].isSaved) || curPath === 'wifi5secu' || finalApplyClicked);

      function evaluateCriteria(ruleId, ruleName, expectedDisplay, isReached, validator) {
        var cached = cache[ruleId] || trackingCache[ruleId];
        var inDom = domState[ruleId];

        var actualVal = '';
        var isSaved = false;

        if (inDom) {
          actualVal = inDom.val;
          isSaved = inDom.isSaved;
          // Nếu trong DOM chưa đánh dấu lưu nhưng cache đã lưu chính xác giá trị này
          if (!isSaved && cached && cached.isSaved && cached.actualValue === actualVal) {
            isSaved = true;
          }
        } else if (cached) {
          actualVal = cached.actualValue || '';
          isSaved = Boolean(cached.isSaved);
        }

        // Trong chế độ Hướng dẫn: Nếu bước này chưa tới và chưa có giá trị -> Đang chờ thực hiện (không báo lỗi ❌)
        if (isGuideInProgress && !isReached && !actualVal) {
          return {
            id: ruleId,
            name: ruleName,
            expected: expectedDisplay,
            actual: '⏳ Đang chờ thực hiện',
            passed: true,
            isPending: true,
            message: 'Chưa thực hiện (Bước tiếp theo)'
          };
        }

        var isValCorrect = validator(actualVal);
        var passed = isValCorrect && isSaved;

        var actualDisplay = actualVal || '';
        var msg = '';
        if (passed) {
          msg = 'Chính xác';
        } else if (!actualVal) {
          actualDisplay = '(Chưa nhập / Chưa tìm thấy)';
          msg = 'Chưa cấu hình';
        } else if (!isSaved) {
          actualDisplay = actualVal + ' (Chưa lưu)';
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
          isPending: false,
          message: msg
        };
      }

      var details = [];
      var passedCount = 0;

      // 1. [2.4G] SSID: Bắt buộc đúng 'FPT Telecom' (tuyệt đối không chấp nhận FTP Telecom)
      var r1 = evaluateCriteria('wifi24_ssid', '[2.4G] Tên mạng SSID', 'FPT Telecom', step1Reached, function (v) {
        return v === 'FPT Telecom';
      });
      if (r1.passed && !r1.isPending) passedCount++;
      details.push(r1);

      // 2. [2.4G] Security Passphrase: Bắt buộc đúng '19006600'
      var r2 = evaluateCriteria('wifi24_key', '[2.4G] Security Passphrase', '19006600', step2Reached, function (v) {
        return v === '19006600';
      });
      if (r2.passed && !r2.isPending) passedCount++;
      details.push(r2);

      // 3. [5G] SSID: Bắt buộc đúng 'FPT Telecom'
      var r3 = evaluateCriteria('wifi5_ssid', '[5G] Tên mạng SSID', 'FPT Telecom', step3Reached, function (v) {
        return v === 'FPT Telecom';
      });
      if (r3.passed && !r3.isPending) passedCount++;
      details.push(r3);

      // 4. [5G] Security Passphrase: Bắt buộc đúng '19006600'
      var r4 = evaluateCriteria('wifi5_key', '[5G] Security Passphrase', '19006600', step4Reached, function (v) {
        return v === '19006600';
      });
      if (r4.passed && !r4.isPending) passedCount++;
      details.push(r4);

      // Bổ sung các lỗi can thiệp ngoài phạm vi vào danh sách details
      if (outOfScopeErrors.length > 0) {
        outOfScopeErrors.forEach(function (err) {
          details.push(err);
        });
      }

      var totalRules = 4 + outOfScopeErrors.length;
      var allPassed = (passedCount === 4) && (outOfScopeErrors.length === 0);
      var score = allPassed ? 100 : Math.round((passedCount / totalRules) * 100);

      var hasSavedError = (outOfScopeErrors.length > 0) ||
        Boolean(cache['wifi24_ssid'] && cache['wifi24_ssid'].isSaved && !r1.passed) ||
        Boolean(cache['wifi24_key'] && cache['wifi24_key'].isSaved && !r2.passed) ||
        Boolean(cache['wifi5_ssid'] && cache['wifi5_ssid'].isSaved && !r3.passed) ||
        Boolean(cache['wifi5_key'] && cache['wifi5_key'].isSaved && !r4.passed);

      var daVaoTrangCuoi = Boolean(finalApplyClicked);
      var trangHienTaiDat = !hasSavedError;

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
