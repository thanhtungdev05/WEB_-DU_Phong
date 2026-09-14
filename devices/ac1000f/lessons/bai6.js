/**
 * devices/ac1000f/lessons/bai6.js
 * Bài 6: Cấu hình Port Forwarding (Virtual Server) trên ONT AC1000F
 */

window.DEVICE_AC1000F_LESSONS = window.DEVICE_AC1000F_LESSONS || [];

var index = window.DEVICE_AC1000F_LESSONS.findIndex(function (l) { return l.id === 'LAB_AC1000F_06'; });
var lessonObj = {
  id: 'LAB_AC1000F_06',
  title: 'Cấu hình Port Forwarding',
  subtitle: 'Cấu hình Port Forwarding (Virtual Server)',
  instructions: [
    '<b>Yêu cầu:</b>',
    'Thực hiện cấu hình Mở Port trên thiết bị theo các thông số được cung cấp dưới đây:',
    '- Start External Port: <span class="val">3389</span>',
    '- End External Port: <span class="val">3389</span>',
    '- Local IP Address: <span class="val">192.168.1.254</span>',
    '- Start Internal Port: <span class="val">3389</span>',
    '- End Internal Port: <span class="val">3389</span>',
  ],
  practiceUrl: '/sim_ac1000f/cgi-bin/index.asp?page=adv_nat_top.asp',

  // Clear old localStorage khi bắt đầu phiên mới
  onSimLoad: function (iframeWindow) {
    try {
      var loc = (iframeWindow.location.href || '').toLowerCase();
      if (loc.indexOf('adv_nat_top') === -1) {
        localStorage.removeItem('ftc_sim_portfwd');
      }
    } catch (e) { }
  },

  clearFields: [
    'input[name="start_port1"]',
    'input[name="end_port1"]',
    'input[name="Addr1"]',
    'input[name="local_sport"]',
    'input[name="local_eport"]'
  ],

  grading: {
    description: 'Kiểm tra cấu hình Port Forwarding (Virtual Server)',
    customGrading: function (allDocs) {
      // 1. Đọc từ localStorage để xem đã nhấn Add chưa
      var data = null;
      var isSaved = false;
      try {
        var raw = localStorage.getItem('ftc_sim_portfwd');
        if (raw) {
          data = JSON.parse(raw);
          isSaved = true;
        }
      } catch (e) { }

      // 2. Kiểm tra trực tiếp bảng Virtual Server trong document
      for (var i = 0; i < allDocs.length; i++) {
        try {
          var doc = allDocs[i];
          var url = doc.URL.toLowerCase();
          if (url.indexOf('adv_nat_top.asp') !== -1) {
            var win = doc.defaultView || doc.parentWindow;
            if (win && win.tableData1) {
              for (var t = 0; t < win.tableData1.length; t++) {
                var row = win.tableData1[t];
                if (row && String(row[1]).trim() === '3389' &&
                  String(row[2]).trim() === '3389' &&
                  String(row[3]).trim() === '192.168.1.254' &&
                  String(row[4]).trim() === '3389' &&
                  String(row[5]).trim() === '3389') {
                  isSaved = true;
                  data = {
                    start_port1: row[1],
                    end_port1: row[2],
                    Addr1: row[3],
                    local_sport: row[4],
                    local_eport: row[5]
                  };
                  break;
                }
              }
            }

            // Dự phòng: lấy dữ liệu từ form hiện tại nếu chưa nhấn Add
            if (!data) {
              var form = doc.NAT_form || doc.forms[0];
              if (form) {
                data = {
                  start_port1: form.start_port1 ? form.start_port1.value : '',
                  end_port1: form.end_port1 ? form.end_port1.value : '',
                  Addr1: form.Addr1 ? form.Addr1.value : '',
                  local_sport: form.local_sport ? form.local_sport.value : '',
                  local_eport: form.local_eport ? form.local_eport.value : ''
                };
              }
            }
          }
        } catch (e) { }
      }

      function g(obj, key) {
        return obj && obj[key] ? String(obj[key]).trim() : '';
      }

      var actualStartExt = g(data, 'start_port1');
      var actualEndExt = g(data, 'end_port1');
      var actualIp = g(data, 'Addr1');
      var actualStartInt = g(data, 'local_sport');
      var actualEndInt = g(data, 'local_eport');

      var rules = [
        { id: '1', name: 'Start External Port', expected: '3389', actual: actualStartExt },
        { id: '2', name: 'End External Port', expected: '3389', actual: actualEndExt },
        { id: '3', name: 'Local IP Address', expected: '192.168.1.254', actual: actualIp },
        { id: '4', name: 'Start Internal Port', expected: '3389', actual: actualStartInt },
        { id: '5', name: 'End Internal Port', expected: '3389', actual: actualEndInt }
      ];

      var passedCount = 0;
      var details = [];
      rules.forEach(function (r) {
        var actualVal = (r.actual || '').toString().trim();
        var expectVal = (r.expected || '').toString().trim();
        var isMatch = (actualVal === expectVal);

        if (isMatch && isSaved) {
          passedCount++;
        } else {
          isMatch = false;
        }

        details.push({
          id: r.id,
          name: r.name,
          expected: r.expected,
          actual: r.actual || '(Trống)',
          passed: isMatch,
          message: isMatch ? 'Chính xác' : (actualVal ? ('Giá trị: ' + actualVal + (isSaved ? '' : ' (Chưa nhấn Add)')) : 'Chưa nhập')
        });
      });

      if (!isSaved) {
        details.push({
          id: 'hint',
          name: '⚠ Chưa lưu cấu hình',
          expected: 'Bấm Add để lưu cấu hình rule',
          actual: 'Chưa lưu',
          passed: false,
          _isHint: true
        });
      }

      var totalRules = rules.length;
      var score = Math.round((passedCount / totalRules) * 100);

      return {
        passed: passedCount === totalRules && isSaved,
        score: score,
        passedCount: passedCount,
        totalRules: totalRules,
        details: details
      };
    }
  }
};

if (index !== -1) {
  window.DEVICE_AC1000F_LESSONS[index] = lessonObj;
} else {
  window.DEVICE_AC1000F_LESSONS.push(lessonObj);
}
