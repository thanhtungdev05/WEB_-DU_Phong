/**
 * devices/ac1000hi/lessons/bai3.js
 * Bài 3: Cấu hình wifi IoT trên ONT AC1000HI
 */

window.DEVICE_AC1000HI_LESSONS = window.DEVICE_AC1000HI_LESSONS || [];

var index = window.DEVICE_AC1000HI_LESSONS.findIndex(function(l) { return l.id === 'LAB_AC1000HI_03'; });
var lessonObj = {
  id: 'LAB_AC1000HI_03',
  title: 'Bài 3 - Cấu hình wifi IoT',
  subtitle: 'Cấu hình wifi IoT',
  instructions: [
    '<b>Yêu cầu:</b>',
    'Thực hiện cấu hình mạng Wi-Fi IoT (băng tần 2.4G) theo các thông số dưới đây:',
    '- SSID Index: <span class="val">2</span>',
    '- SSID Name: <span class="val">FPT Telecom_IoT</span>',
    '- WPA Key: <span class="val">fpt12345</span>',
    '<br><b>Cách làm:</b>',
    '1. Vào Wireless 2.4G > Chọn SSID index 2',
    '2. Đặt tên và mật khẩu theo yêu cầu > bấm <b>Save & Apply</b>'
  ],
  practiceUrl: '/sim_ac1000HI/cgi-bin/index.asp?page=home_wireless.asp',
    // Clear old wifi localStorage when starting a new session (on login page only)
    onSimLoad: function(iframeWindow) {
      try {
        var loc = (iframeWindow.location.href || '').toLowerCase();
        if (loc.indexOf('home_wireless') === -1) {
          localStorage.removeItem('ftc_sim_wifi24');
          localStorage.removeItem('ftc_sim_wifi5g');
        }
      } catch(e) {}
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
    customGrading: function(allDocs) {
      function fetchHTML(url) {
        try {
          var req = new XMLHttpRequest();
          req.open('GET', url, false);
          req.send(null);
          if (req.status === 200) {
            var parser = new DOMParser();
            return parser.parseFromString(req.responseText, 'text/html');
          }
        } catch(e) {}
        return null;
      }
      
      var doc24 = fetchHTML('/sim_ac1000HI/cgi-bin/home_wireless.asp?_=' + new Date().getTime());
      
      function getVal(doc, selector) {
        if (!doc) return '';
        var el = doc.querySelector(selector);
        return el ? el.value.trim() : '';
      }
      
      var rules = [
        { id: '1', name: 'Chọn SSID Index 2', expected: '1', actual: getVal(doc24, 'select[name="SSID_INDEX"]') },
        { id: '2', name: 'SSID Name (IoT)', expected: 'FPT Telecom_IoT', actual: getVal(doc24, 'input[name="ESSID"]') },
        { id: '3', name: 'WPA Key (IoT)', expected: 'fpt12345', actual: getVal(doc24, 'input[name="PreSharedKey2"]') }
      ];

      var passedCount = 0;
      var details = [];
      rules.forEach(function(r) {
        var actualVal = (r.actual || '').toString().trim();
        var expectVal = (r.expected || '').toString().trim();
        var isMatch = (actualVal === expectVal);
        
        if (isMatch) passedCount++;
        
        var displayActual = actualVal;
        var displayExpected = expectVal;
        if (r.id === '1') {
           displayActual = actualVal === '1' ? 'SSID Index 2' : (actualVal === '0' ? 'SSID Index 1' : actualVal);
           displayExpected = 'SSID Index 2';
        }

        details.push({
          id: r.id,
          name: r.name,
          expected: displayExpected,
          actual: displayActual || '(Trống)',
          passed: isMatch
        });
      });
      return {
        passed: passedCount === rules.length,
        score: Math.round((passedCount / rules.length) * 100),
        passedCount: passedCount,
        totalRules: rules.length,
        details: details
      };
    }
  }
};

if (index !== -1) {
  window.DEVICE_AC1000HI_LESSONS[index] = lessonObj;
} else {
  window.DEVICE_AC1000HI_LESSONS.push(lessonObj);
}


