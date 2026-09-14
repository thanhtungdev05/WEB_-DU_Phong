/**
 * devices/ac1000f/lessons/bai3.js
 * Bài 3: Cấu hình Wi-Fi IoT trên ONT AC1000F
 */

(function () {
  window.DEVICE_AC1000F_LESSONS = window.DEVICE_AC1000F_LESSONS || [];

  var index = window.DEVICE_AC1000F_LESSONS.findIndex(function (l) { return l.id === 'LAB_AC1000F_03'; });
  var lessonObj = {
    id: 'LAB_AC1000F_03',
    title: 'Cấu hình wifi IoT',
    subtitle: 'Cấu hình wifi IoT',
    instructions: [
      '<b>Yêu cầu:</b>',
      'Thực hiện cấu hình mạng Wi-Fi IoT trên băng tần <b>2.4G</b> theo các thông số dưới đây:',
      '- SSID Index: <span class="val">2</span>',
      '- SSID Name: <span class="val">FPT Telecom-7EA8</span>',
      '- WPA Key: <span class="val">00032934</span>'
    ],
    practiceUrl: '/sim_ac1000f/cgi-bin/index.asp?page=home_wireless.asp',

    // Xóa localStorage wifi cũ khi bắt đầu phiên mới
    onSimLoad: function (iframeWindow) {
      try {
        var loc = (iframeWindow.location.href || '').toLowerCase();
        if (loc.indexOf('home_wireless') === -1) {
          localStorage.removeItem('ftc_sim_wifi24');
        }
      } catch (e) { }
    },

    clearFields: [
      'input[name="ESSID"]',
      'input[name="PreSharedKey1"]',
      'input[name="PreSharedKey2"]',
      'input[name="PreSharedKey3"]'
    ],

    grading: {
      description: 'Kiểm tra cấu hình Wi-Fi IoT (SSID Index 2 trên 2.4G)',

      customGrading: function (allDocs) {
        var data24 = null;
        var is24Saved = false;
        try {
          var raw24 = localStorage.getItem('ftc_sim_wifi24');
          if (raw24) {
            data24 = JSON.parse(raw24);
            is24Saved = true;
          }
        } catch (e) { }

        // Kiểm tra trực tiếp document hiện tại
        for (var i = 0; i < allDocs.length; i++) {
          try {
            var url = allDocs[i].URL.toLowerCase();
            if (url.indexOf('home_wireless.asp') !== -1) {
              var liveData = _captureFormData(allDocs[i]);
              if (liveData) {
                if (!data24) data24 = liveData;
                else {
                  // Cập nhật giá trị đang chọn nếu có
                  if (liveData.SSID_INDEX !== undefined) data24.SSID_INDEX = liveData.SSID_INDEX;
                  if (liveData.ESSID) data24.ESSID = liveData.ESSID;
                }
              }
            }
          } catch (e) { }
        }

        var allDetails = [];
        var totalRules = 0, passedRules = 0;

        function g(data, name) {
          return data && data[name] !== undefined ? String(data[name]).trim() : '';
        }

        function getKey(data) {
          if (!data) return '';
          var auth = g(data, 'WEP_Selection');
          if (auth === 'WPA2PSK') return g(data, 'PreSharedKey1');
          if (auth === 'WPAPSK') return g(data, 'PreSharedKey2');
          if (auth === 'WPAPSKWPA2PSK') return g(data, 'PreSharedKey3');
          return g(data, 'PreSharedKey3') || g(data, 'PreSharedKey1') || g(data, 'PreSharedKey2') || g(data, 'PreSharedKey');
        }

        function addRule(id, name, expected, actual, passed) {
          totalRules++;
          if (passed) passedRules++;
          allDetails.push({
            id: id,
            name: name,
            expected: expected,
            actual: actual || '(Trống)',
            passed: passed,
            message: passed ? 'Chính xác' : 'Sai'
          });
        }

        allDetails.push({ id: '_h24', name: '━━ CẤU HÌNH WI-FI IoT (2.4G - SSID INDEX 2) ━━', expected: '', actual: '', passed: true, message: '', _isHeader: true });

        if (data24) {
          // 1. Kiểm tra SSID Index phải chọn là 2 (HTML option value="1")
          var ssidIdx = g(data24, 'SSID_INDEX');
          var isIndex2 = (ssidIdx === '1');
          var actualIndexDisplay = isIndex2 ? 'SSID Index 2' : (ssidIdx === '0' ? 'SSID Index 1' : (ssidIdx ? ('Index ' + ssidIdx) : 'Chưa chọn'));
          addRule('24_index', '[2.4G] SSID Index', 'SSID Index 2', actualIndexDisplay, isIndex2 && is24Saved);

          // 2. Radio Wi-Fi
          var ap24 = g(data24, 'wlan_APenable');
          addRule('24_ap', '[2.4G] Radio', 'Enable', ap24 === '1' ? 'Enable' : 'Disable', ap24 === '1' && is24Saved);

          // 3. Tên Wi-Fi IoT
          var ssid24 = g(data24, 'ESSID') || g(data24, 'ssid');
          var isSsidMatch = (ssid24 === 'FPT Telecom-7EA8' || ssid24 === 'FPT Telecom-7EA8_IoT');
          addRule('24_ssid', '[2.4G] SSID Name', 'FPT Telecom-7EA8', ssid24, isSsidMatch && is24Saved && isIndex2);

          // 4. Mật khẩu Wi-Fi IoT
          var key24 = getKey(data24);
          var isKeyMatch = (key24 === '00032934');
          addRule('24_key', '[2.4G] WPA Passphrase', '00032934', key24, isKeyMatch && is24Saved && isIndex2);

          if (!isIndex2) {
            allDetails.push({ id: 'hint_idx', name: '⚠ Chưa chọn đúng SSID Index 2', expected: 'Chọn SSID Index là 2 để tạo sóng IoT', actual: actualIndexDisplay, passed: false, _isHint: true });
          }

          if (!is24Saved) {
            allDetails.push({ id: 'hint_24', name: '⚠ Chưa lưu cấu hình', expected: 'Bấm Save & Apply để lưu cấu hình', actual: 'Chưa lưu', passed: false, _isHint: true });
          }
        } else {
          totalRules++;
          allDetails.push({ id: 'hint_24', name: '⚠ Chưa cấu hình Wi-Fi IoT', expected: 'Vào Wireless 2.4G → chọn SSID Index 2 → cấu hình → bấm Save', actual: 'Chưa lưu', passed: false, _isHint: true });
        }

        var score = totalRules === 0 ? 0 : Math.round((passedRules / totalRules) * 100);
        return {
          passed: passedRules > 0 && passedRules === totalRules,
          score: score,
          passedCount: passedRules,
          totalRules: totalRules,
          details: allDetails
        };
      }
    }
  };

  if (index !== -1) {
    window.DEVICE_AC1000F_LESSONS[index] = lessonObj;
  } else {
    window.DEVICE_AC1000F_LESSONS.push(lessonObj);
  }

  // Helper: lấy dữ liệu form từ một document
  function _captureFormData(doc) {
    try {
      var form = doc.WLAN || doc.forms[0];
      if (!form) return null;
      var data = {};
      for (var i = 0; i < form.elements.length; i++) {
        var el = form.elements[i];
        if (!el.name) continue;
        if (el.type === 'radio' || el.type === 'checkbox') {
          if (el.checked) data[el.name] = el.value;
        } else {
          data[el.name] = el.value;
        }
      }
      return data;
    } catch (e) { return null; }
  }

})();
