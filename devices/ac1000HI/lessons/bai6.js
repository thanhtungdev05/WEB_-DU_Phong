/**
 * devices/ac1000hi/lessons/bai6.js
 * Bài 6: Cấu hình Port Forwarding trên ONT AC1000HI
 */

window.DEVICE_AC1000HI_LESSONS = window.DEVICE_AC1000HI_LESSONS || [];

var index = window.DEVICE_AC1000HI_LESSONS.findIndex(function (l) { return l.id === 'LAB_AC1000HI_06'; });
var lessonObj = {
  id: 'LAB_AC1000HI_06',
  title: 'Bài 6 - Cấu hình Port Forwarding',
  subtitle: 'Cấu hình Port Forwarding',
  instructions: [
    '<b>Yêu cầu:</b>',
    'Thực hiện cấu hình Mở Port trên thiết bị theo các thông số được cung cấp dưới đây:',
    '- Start External Port: <span class="val">3389</span>',
    '- End External Port: <span class="val">3389</span>',
    '- IP Address: <span class="val">192.168.1.254</span>',
    '- Start Internal Port: <span class="val">3389</span>',
    '- End Internal Port: <span class="val">3389</span>'
  ],
  practiceUrl: '/sim_ac1000HI/cgi-bin/index.asp?page=adv_nat_top.asp',
  // Clear old localStorage when starting a new session
  onSimLoad: function (iframeWindow) {
    try {
      var loc = (iframeWindow.location.href || '').toLowerCase();
      if (loc.indexOf('adv_nat') === -1) {
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
      var data = null;
      var isSaved = false;

      // 1. Đọc từ localStorage
      try {
        var raw = localStorage.getItem('ftc_sim_portfwd');
        if (raw) {
          data = JSON.parse(raw);
          isSaved = true;
        }
      } catch (e) { }

      // 2. Kiểm tra từ bảng tableData1 hoặc cờ _ftcIsSaved của tài liệu
      for (var i = 0; i < allDocs.length; i++) {
        try {
          var d = allDocs[i];
          var win = d.defaultView || d.parentWindow;
          if (win && win.tableData1 && win.tableData1[0] && win.tableData1[0][1] && win.tableData1[0][1] !== 'N/A') {
            isSaved = true;
            if (!data) {
              data = {
                start_port1: win.tableData1[0][1],
                end_port1: win.tableData1[0][2],
                Addr1: win.tableData1[0][3],
                local_sport: win.tableData1[0][4],
                local_eport: win.tableData1[0][5]
              };
            }
          }
          if (d._ftcIsSaved) {
            isSaved = true;
          }
        } catch (e) { }
      }

      if (window._hasClickedSaveInGuide) {
        isSaved = true;
      }

      // 3. Dự phòng lấy dữ liệu trực tiếp từ form nếu chưa có data
      if (!data) {
        for (var i = 0; i < allDocs.length; i++) {
          try {
            var url = allDocs[i].URL.toLowerCase();
            if (url.indexOf('adv_nat') !== -1) {
              var form = allDocs[i].NAT_form || allDocs[i].forms[0];
              if (form) {
                data = {};
                for (var j = 0; j < form.elements.length; j++) {
                  var el = form.elements[j];
                  if (!el.name) continue;
                  if (el.type === 'radio' || el.type === 'checkbox') {
                    if (el.checked) data[el.name] = el.value;
                  } else {
                    data[el.name] = el.value;
                  }
                }
              }
            }
          } catch (e) { }
        }
      }

      function g(data, name) {
        return data && data[name] ? String(data[name]).trim() : '';
      }

      var actualStartExt = g(data, 'start_port1');
      var actualEndExt = g(data, 'end_port1');
      var actualIp = g(data, 'Addr1');
      var actualStartInt = g(data, 'local_sport');
      var actualEndInt = g(data, 'local_eport');

      var rules = [
        { id: '1', name: 'Start External Port', expected: '3389', actual: actualStartExt },
        { id: '2', name: 'End External Port', expected: '3389', actual: actualEndExt },
        { id: '3', name: 'IP Address', expected: '192.168.1.254', actual: actualIp },
        { id: '4', name: 'Start Internal Port', expected: '3389', actual: actualStartInt },
        { id: '5', name: 'End Internal Port', expected: '3389', actual: actualEndInt }
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

      var allFieldsMatched = (passedCount === rules.length);
      // Đạt yêu cầu nếu đã nhập đúng cả 5 trường thông số
      var passed = allFieldsMatched;

      if (!isSaved && !allFieldsMatched) {
        details.push({
          id: 'hint', name: '⚠ Thao tác lưu', expected: 'Bấm Add để lưu cấu hình', actual: 'Chưa lưu', passed: false, _isHint: true
        });
      }

      return {
        passed: passed,
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
