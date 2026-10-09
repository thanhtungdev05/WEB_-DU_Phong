/**
 * devices/ac1000cv2/lessons/bai3.js
 * Bài 3: Cấu hình Wi-Fi phụ (IoT / Khách) trên Internet Hub AC1000C V2 (theo chuẩn ONT AC1000F)
 */

window.DEVICE_AC1000CV2_LESSONS = window.DEVICE_AC1000CV2_LESSONS || [];

var index = window.DEVICE_AC1000CV2_LESSONS.findIndex(function (l) { return l.id === 'ac1000cv2-bai3' || l.id === 'LAB_AC1000CV2_03'; });
var lessonObj = {
  id: 'ac1000cv2-bai3',
  title: 'Bài 3 - Cấu hình Wi-Fi IoT',
  subtitle: 'Cấu hình Wi-Fi IoT',
  instructions: [
    '<b>Yêu cầu:</b>',
    'Thực hiện cấu hình mạng Wi-Fi IoT trên băng tần <b>2.4G</b> theo các thông số dưới đây:',
    '- SSID Name: <span class="val">FPT IoT</span>',
    '- WPA Key: <span class="val">fptiot123</span>'
  ],
  practiceUrl: '/sim_ac1000cv2/wifissid.html',
  onSimLoad: function (iframeWindow) {
    try {
      if (iframeWindow && iframeWindow.document) {
        var doc = iframeWindow.document;
        var pPath = (doc.location && doc.location.pathname) ? doc.location.pathname.toLowerCase() : '';
        var cache = window._sessionRuleCache || {};

        if (pPath.indexOf('wifissid') !== -1 && !cache['wifi_iot_key']) {
          window._ftcAc1000cv2FinalApplyClicked = false;
        }

        if (pPath.indexOf('wifissid') !== -1) {
          var sList = doc.querySelector('#ssid_list, select[name="ssid_list"]');
          var sName = doc.querySelector('#ssid_network_name, input[name="ssid_network_name"]');
          var sEn = doc.querySelector('#ssid_enable, input[name="ssid_state"][value="1"]');

          if (cache['wifi_iot_ssid'] && cache['wifi_iot_ssid'].isSaved) {
            if (sList && sList.value !== '1') {
              sList.value = '1';
              if (typeof iframeWindow.select_ssid === 'function') {
                iframeWindow.select_ssid(1);
              }
            }
            if (sName) sName.value = cache['wifi_iot_ssid'].actualValue;
            if (sEn) sEn.checked = true;
            doc._ftcIsSaved = true;
          }
        } else if (pPath.indexOf('wifisecu') !== -1) {
          var sListSec = doc.querySelector('#ssid_list, select[name="ssid_list"]');
          var kEl = doc.querySelector('#security_wpa_key, input[name="security_wpa_key"]');

          if (cache['wifi_iot_key'] && cache['wifi_iot_key'].isSaved) {
            if (sListSec && sListSec.value !== '1') {
              sListSec.value = '1';
              if (typeof iframeWindow.SelectShow === 'function') {
                iframeWindow.SelectShow(1);
              }
            }
            if (kEl) kEl.value = cache['wifi_iot_key'].actualValue;
            doc._ftcIsSaved = true;
          } else if (kEl && (kEl.value === '19a0107e' || kEl.value === '12345678')) {
            kEl.value = '';
            doc._ftcIsSaved = false;
          }
        }

        if (!doc._ftcInputResetAttached) {
          doc._ftcInputResetAttached = true;
          doc.addEventListener('input', function (e) {
            var t = e.target;
            if (t && (t.id === 'ssid_network_name' || t.name === 'ssid_network_name' || t.id === 'security_wpa_key' || t.name === 'security_wpa_key')) {
              doc._ftcIsSaved = false;
              if (pPath.indexOf('wifisecu') !== -1) {
                window._ftcAc1000cv2FinalApplyClicked = false;
              }
            }
          }, true);
          doc.addEventListener('change', function (e) {
            var t = e.target;
            if (t && (t.id === 'ssid_list' || t.name === 'ssid_list' || t.id === 'ssid_enable' || t.id === 'ssid_disable')) {
              doc._ftcIsSaved = false;
              if (pPath.indexOf('wifisecu') !== -1) {
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

        if (pPath.indexOf('wifisecu') !== -1 && (!cache['wifi_iot_key'] || !cache['wifi_iot_key'].isSaved)) {
          var el = doc.querySelector('#security_wpa_key, input[name="security_wpa_key"]');
          if (el && (el.value === '19a0107e' || el.value === '12345678' || !cache['wifi_iot_key'])) {
            el.value = '';
          }
        }
      }
    } catch (e) { }
  },
  grading: {
    description: 'Kiểm tra thông số cấu hình Wi-Fi phụ SSID 2 (Tên mạng FPT Telecom-7EA8 & Mật khẩu 00032934)',
    rules: [
      {
        id: 'wifi_iot_index',
        name: 'Chọn SSID 2',
        selector: '#ssid_list, select[name="ssid_list"]',
        expected: '1',
        displayExpected: 'SSID 2',
        type: 'text_exact',
        required: true
      },
      {
        id: 'wifi_iot_enable',
        name: 'Trạng thái SSID Enable',
        selector: '#ssid_enable, input[name="ssid_state"][value="1"]',
        expected: '1',
        displayExpected: 'Enable',
        type: 'radio_checked',
        required: true
      },
      {
        id: 'wifi_iot_ssid',
        name: 'Tên Wi-Fi IoT (SSID 2)',
        selector: '#ssid_network_name, input[name="ssid_network_name"]',
        expected: 'FPT IoT',
        type: 'text_exact',
        trim: true,
        required: true
      },
      {
        id: 'wifi_iot_key',
        name: 'Security Passphrase (SSID 2)',
        selector: '#security_wpa_key, input[name="security_wpa_key"]',
        expected: 'fptiot123',
        displayExpected: 'fptiot123',
        type: 'text_exact',
        trim: true,
        required: true
      }
    ],

    customGrading: function (allDocs) {
      var cache = window._sessionRuleCache || {};
      var trackingCache = (window._trackingSession && window._trackingSession.ruleCache) ? window._trackingSession.ruleCache : {};

      // 1. Quét dữ liệu từ các frame đang hiển thị
      var domState = {};
      var outOfScopeErrors = [];

      for (var i = 0; i < allDocs.length; i++) {
        try {
          var d = allDocs[i];
          var p = (d.location && d.location.pathname) ? d.location.pathname.toLowerCase() : '';
          var isSavedDoc = Boolean(d._ftcIsSaved || (window._hasClickedSaveInGuide && d._ftcIsSaved !== false));

          if (p.indexOf('wifissid') !== -1) {
            var sList = d.querySelector('#ssid_list, select[name="ssid_list"]');
            var sEn = d.querySelector('#ssid_enable, input[name="ssid_state"][value="1"]');
            var sName = d.querySelector('#ssid_network_name, input[name="ssid_network_name"]');

            if (sList) {
              var sVal = (sList.value || '').trim();
              domState['wifi_iot_index'] = { val: sVal, isSaved: isSavedDoc };

              // ── Bắt lỗi KTV cấu hình nhầm hoặc đè vào SSID 1 (SSID chính) ──
              if (sVal === '0') {
                var curName = sName ? (sName.value || '').trim() : '';
                if (curName === 'FPT Telecom-7EA8' || curName === 'FPT Telecom-IoT') {
                  outOfScopeErrors.push({
                    id: 'err_tamper_ssid1',
                    name: 'Thao tác ngoài phạm vi: Sửa đè SSID 1',
                    expected: 'Cấu hình trên SSID 2',
                    actual: 'Đang cấu hình trên SSID 1',
                    passed: false,
                    message: 'Cố tình cấu hình sai vào SSID 1! Bài học yêu cầu chọn SSID 2 trước khi cấu hình'
                  });
                }
              }
            }
            if (sEn) {
              domState['wifi_iot_enable'] = { val: sEn.checked ? '1' : '0', isSaved: isSavedDoc };
            }
            if (sName) {
              domState['wifi_iot_ssid'] = { val: (sName.value || '').trim(), isSaved: isSavedDoc };
            }
          } else if (p.indexOf('wifisecu') !== -1) {
            var sListSec = d.querySelector('#ssid_list, select[name="ssid_list"]');
            var kEl = d.querySelector('#security_wpa_key, input[name="security_wpa_key"]');
            var modeEl = d.querySelector('#security_mode, select[name="security_mode"]');

            if (sListSec) {
              var sSecVal = (sListSec.value || '').trim();
              if (sSecVal === '1') {
                domState['wifi_iot_index'] = { val: '1', isSaved: isSavedDoc };
              } else if (sSecVal === '0') {
                // Đang chọn SSID 1 ở trang bảo mật
                var curKey = kEl ? (kEl.value || '').trim() : '';
                if (curKey === '00032934' || curKey === 'fpt12345') {
                  outOfScopeErrors.push({
                    id: 'err_tamper_key_ssid1',
                    name: 'Thao tác ngoài phạm vi: Đổi mật khẩu SSID 1',
                    expected: 'Đổi mật khẩu SSID 2',
                    actual: 'Đang đổi mật khẩu SSID 1',
                    passed: false,
                    message: 'Cố tình đổi mật khẩu của SSID 1! Hãy chọn SSID 2 trong danh sách để đặt mật khẩu'
                  });
                }
              }
            }
            if (kEl) {
              domState['wifi_iot_key'] = { val: (kEl.value || '').trim(), isSaved: isSavedDoc };
            }
            if (modeEl && (modeEl.value === '0' || modeEl.value === '4')) {
              outOfScopeErrors.push({
                id: 'err_iot_mode',
                name: 'Thao tác ngoài phạm vi: Chuẩn bảo mật SSID 2',
                expected: 'WPA2-PSK (AES)',
                actual: modeEl.options && modeEl.selectedIndex >= 0 ? modeEl.options[modeEl.selectedIndex].text : modeEl.value,
                passed: false,
                message: 'Không được tắt mật khẩu hoặc đổi chuẩn bảo mật sang Open/WEP'
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
          if (ruleId === 'wifi_iot_enable') {
            actualDisplay = (actualVal === '1' ? 'Enable' : 'Disable') + ' (Chưa lưu)';
          } else if (ruleId === 'wifi_iot_index') {
            actualDisplay = (actualVal === '1' ? 'SSID 2' : ('SSID ' + (parseInt(actualVal, 10) + 1))) + ' (Chưa lưu)';
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

      // 1. SSID Index: SSID 2 (value = '1')
      var r1 = evaluateCriteria('wifi_iot_index', 'Chọn SSID 2', 'SSID 2', function (v) {
        return v === '1' || v === 'SSID 2';
      });
      if (r1.passed) passedCount++;
      details.push(r1);

      // 2. SSID State: Enable (value = '1')
      var r2 = evaluateCriteria('wifi_iot_enable', 'Trạng thái SSID Enable', 'Enable', function (v) {
        return v === '1' || v === 'true';
      });
      if (r2.passed) passedCount++;
      details.push(r2);

      // 3. Tên Wi-Fi IoT: FPT Telecom-7EA8
      var r3 = evaluateCriteria('wifi_iot_ssid', 'Tên Wi-Fi IoT (SSID 2)', 'FPT Telecom-7EA8', function (v) {
        return v === 'FPT Telecom-7EA8';
      });
      if (r3.passed) passedCount++;
      details.push(r3);

      // 4. Mật khẩu Wi-Fi IoT: 00032934
      var r4 = evaluateCriteria('wifi_iot_key', 'Security Passphrase (SSID 2)', '00032934', function (v) {
        return v === '00032934';
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
          if (pathItem.indexOf('wifisecu') !== -1) {
            isFinalStepDoc = true;
            if (docItem._ftcIsSaved) isFinalDocSaved = true;
          }
        } catch (e) { }
      }

      var finalApplyClicked = Boolean(
        window._ftcAc1000cv2FinalApplyClicked ||
        (isFinalStepDoc && isFinalDocSaved) ||
        (cache['wifi_iot_key'] && cache['wifi_iot_key'].isSaved)
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
