/**
 * devices/ac1000hi/lessons/bai2.js
 * Bài 2: Cấu hình mạng Wi-Fi trên ONT AC1000HI
 */

window.DEVICE_AC1000HI_LESSONS = window.DEVICE_AC1000HI_LESSONS || [];

var index = window.DEVICE_AC1000HI_LESSONS.findIndex(function (l) { return l.id === 'LAB_AC1000HI_02'; });
var lessonObj = {
  id: 'LAB_AC1000HI_02',
  title: 'Bài 2 - Cấu hình Wi-Fi',
  subtitle: 'Cấu hình Wi-Fi',
  instructions: [
    '<b>Yêu cầu:</b>',
    'Cấu hình dùng cho cả 2 băng tần <b>2.4G</b> và <b>5G</b> theo thông số:',
    '- SSID Name: <span class="val">FPT Telecom-7EA8</span>',
    '- WPA Key: <span class="val">00032934</span>'
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
    description: 'Kiểm tra thông số cấu hình Wi-Fi 2.4G và 5G',

    customGrading: function (allDocs) {
      // ── 1. Đọc từ localStorage (chỉ ghi nhận đã lưu thực sự khi có trong storage) ──
      var data24 = null;
      var data5G = null;
      var is24Saved = false;
      var is5gSaved = false;
      try {
        var raw24 = localStorage.getItem('ftc_sim_wifi24');
        if (raw24) {
          data24 = JSON.parse(raw24);
          is24Saved = true;
        }
      } catch (e) { }
      try {
        var raw5g = localStorage.getItem('ftc_sim_wifi5g');
        if (raw5g) {
          data5G = JSON.parse(raw5g);
          is5gSaved = true;
        }
      } catch (e) { }

      // ── 2. Cập nhật thêm từ trang hiện tại đang mở trong iframe để hiển thị giá trị đang gõ ──
      for (var i = 0; i < allDocs.length; i++) {
        try {
          var url = allDocs[i].URL.toLowerCase();
          if (url.indexOf('home_wireless_5g.asp') !== -1) {
            data5G = _captureFormData(allDocs[i]);
          } else if (url.indexOf('home_wireless.asp') !== -1) {
            data24 = _captureFormData(allDocs[i]);
          }
        } catch (e) { }
      }

      var allDetails = [];
      var totalRules = 0, passedRules = 0;

      function g(data, name) {
        return data && data[name] ? String(data[name]).trim() : '';
      }

      // Lấy đúng mật khẩu theo chuẩn mã nguồn AC1000F
      function getKey(data) {
        if (!data) return '';
        var auth = g(data, 'WEP_Selection');
        if (auth === 'WPA2PSK') return g(data, 'PreSharedKey1');
        if (auth === 'WPAPSK') return g(data, 'PreSharedKey2');
        if (auth === 'WPAPSKWPA2PSK') return g(data, 'PreSharedKey3');
        // Mặc định giao diện FPT dùng mixed mode (PreSharedKey3)
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

      // ─── 2.4G ───
      allDetails.push({ id: '_h24', name: '━━ PHẦN 2.4G ━━', expected: '', actual: '', passed: true, message: '', _isHeader: true });
      if (data24) {
        var ap24 = g(data24, 'wlan_APenable');
        addRule('24_ap', '[2.4G] Radio', 'Enable', ap24 === '1' ? 'Enable' : 'Disable', ap24 === '1' && is24Saved);

        var ssid24 = g(data24, 'ESSID') || g(data24, 'ssid');
        addRule('24_ssid', '[2.4G] SSID Name', 'FPT Telecom-7EA8', ssid24, ssid24 === 'FPT Telecom-7EA8' && is24Saved);

        var key24 = getKey(data24);
        addRule('24_key', '[2.4G] WPA Passphrase', '00032934', key24, key24 === '00032934' && is24Saved);

        if (!is24Saved) {
          totalRules++;
          allDetails.push({ id: 'hint_24', name: '⚠ Chưa lưu cấu hình 2.4G', expected: 'Bấm Save & Apply để lưu cấu hình', actual: 'Chưa lưu', passed: false, _isHint: true });
        }
      } else {
        totalRules++;
        allDetails.push({ id: 'hint_24', name: '⚠ Chưa cấu hình 2.4G', expected: 'Vào Wireless 2.4G → cấu hình → bấm Save', actual: 'Chưa lưu', passed: false, _isHint: true });
      }

      // ─── 5G ───
      allDetails.push({ id: '_h5g', name: '━━ PHẦN 5G ━━', expected: '', actual: '', passed: true, message: '', _isHeader: true });
      if (data5G) {
        var ap5 = g(data5G, 'wlan_APenable');
        addRule('5g_ap', '[5G] Radio', 'Enable', ap5 === '1' ? 'Enable' : 'Disable', ap5 === '1' && is5gSaved);

        var ssid5 = g(data5G, 'ESSID') || g(data5G, 'ssid');
        addRule('5g_ssid', '[5G] SSID Name', 'FPT Telecom-7EA8', ssid5, ssid5 === 'FPT Telecom-7EA8' && is5gSaved);

        var key5 = getKey(data5G);
        addRule('5g_key', '[5G] WPA Passphrase', '00032934', key5, key5 === '00032934' && is5gSaved);

        if (!is5gSaved) {
          totalRules++;
          allDetails.push({ id: 'hint_5g', name: '⚠ Chưa lưu cấu hình 5G', expected: 'Bấm Save & Apply để lưu cấu hình', actual: 'Chưa lưu', passed: false, _isHint: true });
        }
      } else {
        totalRules++;
        allDetails.push({ id: 'hint_5g', name: '⚠ Chưa cấu hình 5G', expected: 'Vào Wireless 5G → cấu hình → bấm Save', actual: 'Chưa lưu', passed: false, _isHint: true });
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


