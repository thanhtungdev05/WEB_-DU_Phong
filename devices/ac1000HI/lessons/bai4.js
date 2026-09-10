/**
 * devices/ac1000hi/lessons/bai4.js
 * Bài 4: Cấu hình DNS trên ONT AC1000HI
 */

window.DEVICE_AC1000HI_LESSONS = window.DEVICE_AC1000HI_LESSONS || [];

var index = window.DEVICE_AC1000HI_LESSONS.findIndex(function(l) { return l.id === 'LAB_AC1000HI_04'; });
var lessonObj = {
  id: 'LAB_AC1000HI_04',
  title: 'Bài 4 - Cấu hình DNS',
  subtitle: 'Cấu hình DNS',
  instructions: [
    '<b>Yêu cầu:</b> Thiết lập thông số DNS thủ công (Manually) trên cổng LAN:',
    '- Primary DNS: <span class="val">8.8.8.8</span>',
    '- Secondary DNS: <span class="val">8.8.4.4</span>',
    '<br><b>Cách làm:</b>',
    '1. Vào mục Advanced Setup > LAN',
    '2. Tìm mục DNS Relay chọn <b>Use User Discovered DNS Server Only</b> (hoặc cấu hình tùy chỉnh để mở ô nhập)',
    '3. Nhập <b>8.8.8.8</b> vào Primary DNS và <b>8.8.4.4</b> vào Secondary DNS',
    '4. Bấm <b>Apply/Save</b> để lưu cấu hình'
  ],
  practiceUrl: '/sim_ac1000HI/cgi-bin/index.asp?page=home_lan.asp',
  
  onSimLoad: function(iframeWindow) {
    try {
      var loc = (iframeWindow.location.href || '').toLowerCase();
      if (loc.indexOf('home_lan') === -1) {
        localStorage.removeItem('ftc_sim_dhcp');
      }
    } catch(e) {}
  },

  clearFields: [
    'input[name="PrimaryDns"]',
    'input[name="SecondDns"]'
  ],

  grading: {
    description: 'Kiểm tra thông số cấu hình DNS trên LAN',
    customGrading: function(allDocs) {
      // 1. Đọc từ localStorage để xem đã nhấn Save chưa
      var data = null;
      var isSaved = false;
      try {
        var raw = localStorage.getItem('ftc_sim_dhcp');
        if (raw) {
          data = JSON.parse(raw);
          isSaved = true;
        }
      } catch (e) { }

      // 2. Dự phòng lấy dữ liệu từ form hiện tại nếu có
      if (!isSaved) {
        for (var i = 0; i < allDocs.length; i++) {
          try {
            var url = allDocs[i].URL.toLowerCase();
            if (url.indexOf('home_lan.asp') !== -1) {
              var form = allDocs[i].uiViewLanForm || allDocs[i].forms[0];
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
      
      // dnsTypeRadio: "0" = Auto, "1" = Use User Discovered DNS
      var dnsRelay = g(data, 'dnsTypeRadio') === '1' ? 'Manually (User Discovered)' : 'Auto';

      var rules = [
        { id: '1', name: 'DNS Relay', expected: 'Manually', actual: g(data, 'dnsTypeRadio') === '1' ? 'Manually' : dnsRelay },
        { id: '2', name: 'Primary DNS', expected: '8.8.8.8', actual: g(data, 'PrimaryDns') },
        { id: '3', name: 'Secondary DNS', expected: '8.8.4.4', actual: g(data, 'SecondDns') }
      ];

      var passedCount = 0;
      var details = [];
      rules.forEach(function(r) {
        var actualVal = (r.actual || '').toString().trim();
        var expectVal = (r.expected || '').toString().trim();
        var isMatch = (actualVal.toLowerCase() === expectVal.toLowerCase());
        
        // Bắt buộc phải nhấn Save mới qua
        if (isMatch && isSaved) passedCount++;
        else isMatch = false;

        details.push({
          id: r.id,
          name: r.name,
          expected: r.expected,
          actual: r.actual || '(Trống)',
          passed: isMatch
        });
      });

      if (!isSaved) {
        details.push({
          id: 'hint', name: '⚠ Chưa lưu cấu hình', expected: 'Bấm Apply/Save để lưu cấu hình', actual: 'Chưa lưu', passed: false, _isHint: true
        });
      }

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


