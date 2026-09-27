/**
 * devices/ac1000hi/lessons/bai1.js
 * Bài 1: Cấu hình PPPoE trên ONT AC1000HI
 */

window.DEVICE_AC1000HI_LESSONS = window.DEVICE_AC1000HI_LESSONS || [];

var index = window.DEVICE_AC1000HI_LESSONS.findIndex(function(l) { return l.id === 'LAB_AC1000HI_01'; });
var lessonObj = {
  id: 'LAB_AC1000HI_01',
  title: 'Bài 1 - Cấu hình PPPoE',
  subtitle: 'Cấu hình PPPoE',
  instructions: [
    '<b>Yêu cầu:</b>',
    '- Username: <span class="val">hnfdl-123456-789</span>',
    '- Password: <span class="val">d123456</span>'
  ],
  practiceUrl: '/sim_ac1000HI/cgi-bin/index.asp?page=home_wan.asp',
  onSimLoad: function(iframeWindow) {
    try {
      var loc = (iframeWindow.location.href || '').toLowerCase();
      if (loc.indexOf('home_wan') === -1) {
        localStorage.removeItem('ftc_sim_wan');
      }
    } catch(e) {}
  },

  clearFields: [
    'input[name="wan_PPPUsername"]',
    'input[name="wan_PPPPassword"]'
  ],

  grading: {
    description: 'Kiểm tra thông số Username và Password PPPoE',
    rules: [
      {
        id: 'wan_user',
        name: 'Username',
        selector: 'input[name="wan_PPPUsername"]',
        expected: 'hnfdl-123456-789',
        type: 'text_exact',
        trim: true,
        required: true
      },
      {
        id: 'wan_pass',
        name: 'Password',
        selector: 'input[name="wan_PPPPassword"]',
        expected: 'd123456',
        type: 'text_exact',
        trim: true,
        required: true
      }
    ]
  },

  customClear: function() {
    var iframe = document.getElementById('deviceIframe');
    if (!iframe || !iframe.contentWindow || !iframe.contentWindow.document) return;
    var doc = iframe.contentWindow.document;

    // Liên tục quét xóa dữ liệu rác nếu có
    if (!doc._ftcClearIntervalStarted) {
      doc._ftcClearIntervalStarted = true;
      doc._clearedFields = {};
      setInterval(function() {
        var selectors = ['input[name="wan_PPPUsername"]', 'input[name="wan_PPPPassword"]'];
        selectors.forEach(function(sel) {
          var els = doc.querySelectorAll(sel);
          els.forEach(function(el) {
            if (!el._ftcHasInputListener) {
              el._ftcHasInputListener = true;
              el.addEventListener('input', function() { el._ftcUserModified = true; });
            }
            if (doc.activeElement !== el && el.value !== "" && !el._ftcUserModified) {
              el.value = "";
              doc._clearedFields[el.name] = true;
            }
          });
        });
      }, 200);
    }

    // Chặn Submit để kiểm tra giống BE12000
    if (!doc._ftcApplyInterceptorAttached) {
      doc._ftcApplyInterceptorAttached = true;
      doc.addEventListener('click', function (e) {
        if (e.target && (e.target.name === 'SaveBtn' || e.target.value === 'Save' || e.target.id === 'save')) {
          var errors = [];
          
          var getVal = function (selector) {
              var el = doc.querySelector(selector);
              return el ? el.value.trim() : "";
          };

          if (getVal('input[name="wan_PPPUsername"]') !== "hnfdl-123456-789") errors.push("Hàng Username cấu hình sai, phải là hnfdl-123456-789.");
          if (getVal('input[name="wan_PPPPassword"]') !== "d123456") errors.push("Hàng Password cấu hình sai, phải là d123456.");

          if (errors.length > 0) {
              alert("BẠN ĐÃ CẤU HÌNH SAI:\n\n" + errors.join("\n"));
              window._hasClickedSaveInGuide = false;
              e.preventDefault();
              e.stopPropagation();
          }
        }
      }, true);
    }
  }
};

if (index !== -1) {
  window.DEVICE_AC1000HI_LESSONS[index] = lessonObj;
} else {
  window.DEVICE_AC1000HI_LESSONS.push(lessonObj);
}
