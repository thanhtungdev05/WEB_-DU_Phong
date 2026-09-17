/**
 * devices/ac1000f/lessons/bai4.js
 * Bài 4: Cấu hình DNS
 */

window.DEVICE_AC1000F_LESSONS = window.DEVICE_AC1000F_LESSONS || [];

var idx = window.DEVICE_AC1000F_LESSONS.findIndex(function (l) { return l.id === 'LAB_AC1000F_04'; });
var lesson = {
  id: 'LAB_AC1000F_04',
  title: 'Cấu hình DNS',
  subtitle: 'Cấu hình DNS',
  instructions: [
    '<b>Yêu cầu:</b> Thiết lập thông số DNS thủ công (Manually) trên cổng LAN:',
    '- Primary DNS: <span class="val">8.8.8.8</span>',
    '- Secondary DNS: <span class="val">8.8.4.4</span>'
  ],
  practiceUrl: '/sim_ac1000f/cgi-bin/index.asp?page=home_lan.asp',

  grading: {
    description: 'Kiểm tra thông số cấu hình DNS trên LAN',
    customGrading: function (allDocs) {
      var doc = null;
      for (var i = 0; i < allDocs.length; i++) {
        if (allDocs[i].URL.toLowerCase().indexOf('home_lan.asp') !== -1) {
          doc = allDocs[i];
          break;
        }
      }

      function getVal(selector) {
        if (!doc) return '';
        try {
          var el = doc.querySelector(selector);
          if (el) return el.value.trim();
        } catch (e) { }
        return '';
      }

      function getSelectText(selector) {
        if (!doc) return '';
        try {
          var el = doc.querySelector(selector);
          if (el && el.selectedIndex >= 0) return el.options[el.selectedIndex].text.trim();
        } catch (e) { }
        return '';
      }

      var dnsRelay = getSelectText('select[name="dnsTypeRadio"]');

      var rules = [
        { id: '1', name: 'DNS Relay', expected: 'Manually', actual: dnsRelay },
        { id: '2', name: 'Primary DNS', expected: '8.8.8.8', actual: getVal('input[name="PrimaryDns"]') },
        { id: '3', name: 'Secondary DNS', expected: '8.8.4.4', actual: getVal('input[name="SecondDns"]') }
      ];

      var passedCount = 0;
      var details = [];
      rules.forEach(function (r) {
        var actualVal = (r.actual || '').toString().trim();
        var expectVal = (r.expected || '').toString().trim();

        var isMatch = (actualVal.toLowerCase() === expectVal.toLowerCase());

        if (isMatch) passedCount++;
        details.push({
          id: r.id,
          name: r.name,
          expected: r.expected,
          actual: r.actual || '(Trống)',
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

if (idx !== -1) {
  window.DEVICE_AC1000F_LESSONS[idx] = lesson;
} else {
  window.DEVICE_AC1000F_LESSONS.push(lesson);
}
