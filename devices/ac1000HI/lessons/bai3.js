/**
 * devices/ac1000hi/lessons/bai3.js
 * Bài 3: Cấu hình wifi IoT trên ONT AC1000HI
 */

window.DEVICE_AC1000HI_LESSONS = window.DEVICE_AC1000HI_LESSONS || [];

var index = window.DEVICE_AC1000HI_LESSONS.findIndex(function (l) { return l.id === 'LAB_AC1000HI_03'; });
var lessonObj = {
  id: 'LAB_AC1000HI_03',
  title: 'Bài 3 - Cấu hình wifi IoT',
  subtitle: 'Cấu hình wifi IoT',
  instructions: [
    '<b>Yêu cầu:</b>',
    '- SSID Index: <span class="val">2</span>',
    '- SSID Name: <span class="val">FPT Telecom_IoT</span>',
    '- WPA Key: <span class="val">fpt12345</span>'
  ],
  practiceUrl: '/sim_ac1000HI/cgi-bin/index.asp?page=home_wireless.asp',
  // Clear old wifi localStorage when starting a new session (on login page only)
  onSimLoad: function (iframeWindow) {
    try {
      var loc = (iframeWindow.location.href || '').toLowerCase();
      if (loc.indexOf('home_wireless') === -1) {
        localStorage.removeItem('ftc_sim_wifi24');
        localStorage.removeItem('ftc_sim_wifi5g');
      }
    } catch (e) { }
  },

  // CSS selectors for fields to clear at session start
  clearFields: [
    'input[name="ESSID"]',
    'input[name="PreSharedKey1"]',
    'input[name="PreSharedKey2"]',
    'input[name="PreSharedKey3"]'
  ],


  grading: {
    description: 'Kiểm tra cấu hình SSID Index 2 (IoT) trên 2.4G',
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

      for (var i = 0; i < allDocs.length; i++) {
        try {
          var url = allDocs[i].URL.toLowerCase();
          if (url.indexOf('home_wireless.asp') !== -1) {
            data24 = _captureFormData(allDocs[i]);
          }
        } catch (e) { }
      }

      var allDetails = [];
      var totalRules = 0, passedRules = 0;

      function g(data, name) {
        return data && data[name] ? String(data[name]).trim() : '';
      }

      function getKey(data) {
        if (!data) return '';
        var auth = g(data, 'WEP_Selection');
        if (auth === 'WPA2PSK') return g(data, 'PreSharedKey1');
        if (auth === 'WPAPSK') return g(data, 'PreSharedKey2');
        if (auth === 'WPAPSKWPA2PSK') return g(data, 'PreSharedKey3');
        return g(data, 'PreSharedKey3') || g(data, 'PreSharedKey2') || g(data, 'PreSharedKey1') || g(data, 'PreSharedKey');
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

      if (data24) {
        var ssidIndex = g(data24, 'SSID_INDEX');
        var ssidIndexDisplay = ssidIndex === '1' ? 'SSID Index 2' : (ssidIndex === '0' ? 'SSID Index 1' : ('Index ' + ssidIndex));
        addRule('1', 'Chọn SSID Index 2', 'SSID Index 2', ssidIndexDisplay, (ssidIndex === '1' || ssidIndex === '2') && is24Saved);

        var ssidName = g(data24, 'ESSID') || g(data24, 'ssid');
        addRule('2', 'SSID Name (IoT)', 'FPT Telecom_IoT', ssidName, ssidName === 'FPT Telecom_IoT' && is24Saved);

        var key = getKey(data24);
        addRule('3', 'WPA Key (IoT)', 'fpt12345', key, key === 'fpt12345' && is24Saved);

        if (!is24Saved) {
          totalRules++;
          allDetails.push({ id: 'hint_save', name: '⚠ Chưa lưu cấu hình', expected: 'Bấm Save & Apply để lưu', actual: 'Chưa lưu', passed: false, _isHint: true });
        }
      } else {
        totalRules++;
        allDetails.push({ id: 'hint_save', name: '⚠ Chưa cấu hình Wi-Fi IoT', expected: 'Vào Wireless 2.4G → chọn SSID 2 → cấu hình → bấm Save', actual: 'Chưa cấu hình', passed: false, _isHint: true });
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

if (index !== -1) {
  window.DEVICE_AC1000HI_LESSONS[index] = lessonObj;
} else {
  window.DEVICE_AC1000HI_LESSONS.push(lessonObj);
}


