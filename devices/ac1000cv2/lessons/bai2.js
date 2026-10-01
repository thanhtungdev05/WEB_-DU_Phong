/**
 * devices/ac1000cv2/lessons/bai2.js
 * Bài 2: Cấu hình mạng Wi-Fi (2.4G & 5G) trên Internet Hub AC1000C V2 (theo chuẩn ONT AC1000F)
 */

window.DEVICE_AC1000CV2_LESSONS = window.DEVICE_AC1000CV2_LESSONS || [];

var index = window.DEVICE_AC1000CV2_LESSONS.findIndex(function (l) { return l.id === 'ac1000cv2-bai2' || l.id === 'LAB_AC1000CV2_02'; });
var lessonObj = {
  id: 'ac1000cv2-bai2',
  title: 'Bài 2 - Cấu hình Wi-Fi',
  subtitle: 'Cấu hình mạng không dây Wi-Fi 2.4GHz & 5GHz và Security Passphrase',
  instructions: [
    '<b>Yêu cầu:</b>',
    'Cấu hình đúng cho cả 2 băng tần <b>2.4G</b> và <b>5G</b> theo thông số:',
    '- SSID Name: <span class="val">FPT Telecom</span>',
    '- WPA Key: <span class="val">19006600</span>',
  ],
  practiceUrl: '/sim_ac1000cv2/wifissid.html',
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
            if (!el.value) el.value = cache['wifi5_ssid'].actualValue;
            doc._ftcIsSaved = true;
          }
        } else if (pPath.indexOf('wifissid') !== -1) {
          var el = doc.querySelector('#ssid_network_name, input[name="ssid_network_name"]');
          if (el && cache['wifi24_ssid']) {
            if (!el.value) el.value = cache['wifi24_ssid'].actualValue;
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
          if (el && (el.value === '19a0107e' || !cache['wifi24_key'])) el.value = '';
        }
        if (pPath.indexOf('wifi5secu') !== -1 && (!cache['wifi5_key'] || !cache['wifi5_key'].isSaved)) {
          var el = doc.querySelector('#security_wpa_key, input[name="security_wpa_key"]');
          if (el && (el.value === '19a0107e' || !cache['wifi5_key'])) el.value = '';
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

      for (var i = 0; i < allDocs.length; i++) {
        try {
          var d = allDocs[i];
          var p = (d.location && d.location.pathname) ? d.location.pathname.toLowerCase() : '';
          var isSavedDoc = Boolean(d._ftcIsSaved || (window._hasClickedSaveInGuide && d._ftcIsSaved !== false));

          if (p.indexOf('wifi5ssid') !== -1) {
            var el = d.querySelector('#ssid_network_name, input[name="ssid_network_name"]');
            var sEn = d.querySelector('#ssid_enable, input[name="ssid_state"][value="1"]');
            var sDis = d.querySelector('input[name="ssid_state"][value="0"]');
            var hideEl = d.querySelector('input[name="hide_ssid"]:checked');

            if (el) domState['wifi5_ssid'] = { val: (el.value || '').trim(), isSaved: isSavedDoc };
            if (sDis && sDis.checked) {
              outOfScopeErrors.push({
                id: 'err_wifi5_state',
                name: 'Thao tác ngoài phạm vi: [5G] Trạng thái Wi-Fi',
                expected: 'Enable',
                actual: 'Disable',
                passed: false,
                message: 'Cố tình tắt phát sóng Wi-Fi 5GHz ngoài yêu cầu bài học'
              });
            }
            if (hideEl && hideEl.value === '1') {
              outOfScopeErrors.push({
                id: 'err_wifi5_hide',
                name: 'Thao tác ngoài phạm vi: [5G] Ẩn SSID',
                expected: 'Hiện SSID',
                actual: 'Ẩn SSID (Hidden)',
                passed: false,
                message: 'Cố tình ẩn SSID Wi-Fi 5GHz'
              });
            }
          } else if (p.indexOf('wifissid') !== -1) {
            var el = d.querySelector('#ssid_network_name, input[name="ssid_network_name"]');
            var sDis = d.querySelector('input[name="ssid_state"][value="0"]');
            var hideEl = d.querySelector('input[name="hide_ssid"]:checked');

            if (el) domState['wifi24_ssid'] = { val: (el.value || '').trim(), isSaved: isSavedDoc };
            if (sDis && sDis.checked) {
              outOfScopeErrors.push({
                id: 'err_wifi24_state',
                name: 'Thao tác ngoài phạm vi: [2.4G] Trạng thái Wi-Fi',
                expected: 'Enable',
                actual: 'Disable',
                passed: false,
                message: 'Cố tình tắt phát sóng Wi-Fi 2.4GHz ngoài yêu cầu bài học'
              });
            }
            if (hideEl && hideEl.value === '1') {
              outOfScopeErrors.push({
                id: 'err_wifi24_hide',
                name: 'Thao tác ngoài phạm vi: [2.4G] Ẩn SSID',
                expected: 'Hiện SSID',
                actual: 'Ẩn SSID (Hidden)',
                passed: false,
                message: 'Cố tình ẩn SSID Wi-Fi 2.4GHz'
              });
            }
          }

          if (p.indexOf('wifi5secu') !== -1) {
            var el = d.querySelector('#security_wpa_key, input[name="security_wpa_key"]');
            var modeEl = d.querySelector('#security_mode, select[name="security_mode"]');
            if (el) domState['wifi5_key'] = { val: (el.value || '').trim(), isSaved: isSavedDoc };
            if (modeEl && (modeEl.value === '0' || modeEl.value === '4')) {
              outOfScopeErrors.push({
                id: 'err_wifi5_mode',
                name: 'Thao tác ngoài phạm vi: [5G] Chuẩn bảo mật',
                expected: 'WPA2-PSK (AES)',
                actual: modeEl.options && modeEl.selectedIndex >= 0 ? modeEl.options[modeEl.selectedIndex].text : modeEl.value,
                passed: false,
                message: 'Không được đổi chuẩn bảo mật Wi-Fi 5GHz sang Open (Không mật khẩu) hoặc WEP'
              });
            }
          } else if (p.indexOf('wifisecu') !== -1) {
            var el = d.querySelector('#security_wpa_key, input[name="security_wpa_key"]');
            var modeEl = d.querySelector('#security_mode, select[name="security_mode"]');
            if (el) domState['wifi24_key'] = { val: (el.value || '').trim(), isSaved: isSavedDoc };
            if (modeEl && (modeEl.value === '0' || modeEl.value === '4')) {
              outOfScopeErrors.push({
                id: 'err_wifi24_mode',
                name: 'Thao tác ngoài phạm vi: [2.4G] Chuẩn bảo mật',
                expected: 'WPA2-PSK (AES)',
                actual: modeEl.options && modeEl.selectedIndex >= 0 ? modeEl.options[modeEl.selectedIndex].text : modeEl.value,
                passed: false,
                message: 'Không được đổi chuẩn bảo mật Wi-Fi 2.4GHz sang Open (Không mật khẩu) hoặc WEP'
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
          // Nếu trong DOM chưa đánh dấu lưu nhưng cache đã lưu chính xác giá trị này
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
          message: msg
        };
      }

      var details = [];
      var passedCount = 0;

      // 1. [2.4G] SSID: Bắt buộc đúng 'FPT Telecom' (tuyệt đối không chấp nhận FTP Telecom)
      var r1 = evaluateCriteria('wifi24_ssid', '[2.4G] Tên mạng SSID', 'FPT Telecom', function (v) {
        return v === 'FPT Telecom';
      });
      if (r1.passed) passedCount++;
      details.push(r1);

      // 2. [2.4G] Security Passphrase: Bắt buộc đúng '19006600' (tuyệt đối không chấp nhận fpt12345)
      var r2 = evaluateCriteria('wifi24_key', '[2.4G] Security Passphrase', '19006600', function (v) {
        return v === '19006600';
      });
      if (r2.passed) passedCount++;
      details.push(r2);

      // 3. [5G] SSID: Bắt buộc đúng 'FPT Telecom' (tuyệt đối không chấp nhận FPT Telecom_5G hay FTP Telecom)
      var r3 = evaluateCriteria('wifi5_ssid', '[5G] Tên mạng SSID', 'FPT Telecom', function (v) {
        return v === 'FPT Telecom';
      });
      if (r3.passed) passedCount++;
      details.push(r3);

      // 4. [5G] Security Passphrase: Bắt buộc đúng '19006600'
      var r4 = evaluateCriteria('wifi5_key', '[5G] Security Passphrase', '19006600', function (v) {
        return v === '19006600';
      });
      if (r4.passed) passedCount++;
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

      var daVaoTrangCuoi = Boolean(finalApplyClicked);
      var trangHienTaiDat = !finalApplyClicked || allPassed;

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
