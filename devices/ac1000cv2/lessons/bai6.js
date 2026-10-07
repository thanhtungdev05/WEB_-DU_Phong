/**
 * devices/ac1000cv2/lessons/bai6.js
 * Bài 6: Cấu hình Port Forwarding trên AC1000C V2 (theo chuẩn ONT AC1000F)
 */

window.DEVICE_AC1000CV2_LESSONS = window.DEVICE_AC1000CV2_LESSONS || [];

var index = window.DEVICE_AC1000CV2_LESSONS.findIndex(function (l) { return l.id === 'ac1000cv2-bai6' || l.id === 'LAB_AC1000CV2_06'; });
var lessonObj = {
  id: 'ac1000cv2-bai6',
  title: 'Bài 6 - Cấu hình Port Forwarding',
  subtitle: 'Cấu hình Port Forwarding',
  instructions: [
    '<b>Yêu cầu:</b>',
    'Truy cập trang Port Forwarding (menu <b>Security Setup > Port Forwarding</b>), mở cổng dịch vụ cho máy chủ nội bộ:',
    '- Local IP Address (IP máy chủ): <span class="val">192.168.1.254</span>',
    '- Local Port (Cổng nội bộ): <span class="val">3389</span>',
    '- Protocol: <span class="val">TCP</span>',
    '- WAN Start Port (Cổng ngoài bắt đầu): <span class="val">3389</span>',
    '- WAN End Port (Cổng ngoài kết thúc): <span class="val">3389</span>'
  ],
  practiceUrl: '/sim_ac1000cv2/portfwd.html',
  clearFields: [
    'input[name="portfwd_lanip"]',
    '#portfwd_lanip',
    'input[name="portfwd_lanport"]',
    '#portfwd_lanport',
    'input[name="portfwd_wanstart"]',
    '#portfwd_wanstart',
    'input[name="portfwd_wanend"]',
    '#portfwd_wanend'
  ],
  grading: {
    description: 'Kiểm tra thông số cấu hình Port Forwarding & Ràng buộc cổng dịch vụ',
    rules: [
      {
        id: 'pf_lanip',
        name: 'Local IP Address',
        selector: 'input[name="portfwd_lanip"], #portfwd_lanip',
        expected: '192.168.1.254',
        type: 'text_exact',
        trim: true,
        required: true
      },
      {
        id: 'pf_lanport',
        name: 'Local Port',
        selector: 'input[name="portfwd_lanport"], #portfwd_lanport',
        expected: '3389',
        type: 'text_exact',
        trim: true,
        required: true
      },
      {
        id: 'pf_wanstart',
        name: 'WAN Start Port',
        selector: 'input[name="portfwd_wanstart"], #portfwd_wanstart',
        expected: '3389',
        type: 'text_exact',
        trim: true,
        required: true
      },
      {
        id: 'pf_wanend',
        name: 'WAN End Port',
        selector: 'input[name="portfwd_wanend"], #portfwd_wanend',
        expected: '3389',
        type: 'text_exact',
        trim: true,
        required: true
      },
      {
        id: 'pf_protocol',
        name: 'Giao thức Protocol',
        selector: 'select[name="protocol"], #protocol',
        expected: '1',
        displayExpected: 'TCP',
        type: 'text_exact',
        trim: true,
        required: true
      }
    ],

    customGrading: function (allDocs) {
      var cache = window._sessionRuleCache || {};
      var trackingCache = (window._trackingSession && window._trackingSession.ruleCache) ? window._trackingSession.ruleCache : {};

      var domState = {};
      var outOfScopeErrors = [];

      for (var i = 0; i < allDocs.length; i++) {
        try {
          var d = allDocs[i];
          var p = (d.location && d.location.pathname) ? d.location.pathname.toLowerCase() : '';
          var isSavedDoc = Boolean(d._ftcIsSaved || (window._hasClickedSaveInGuide && d._ftcIsSaved !== false));

          if (p.indexOf('portfwd') !== -1) {
            var ipEl = d.querySelector('input[name="portfwd_lanip"], #portfwd_lanip');
            var lpEl = d.querySelector('input[name="portfwd_lanport"], #portfwd_lanport');
            var wsEl = d.querySelector('input[name="portfwd_wanstart"], #portfwd_wanstart');
            var weEl = d.querySelector('input[name="portfwd_wanend"], #portfwd_wanend');
            var prEl = d.querySelector('select[name="protocol"], #protocol');
            var appSelEl = d.querySelector('#portfwd_sel, select[name="portfwd_sel"]');

            if (ipEl) domState['pf_lanip'] = { val: (ipEl.value || '').trim(), isSaved: isSavedDoc };
            if (lpEl) domState['pf_lanport'] = { val: (lpEl.value || '').trim(), isSaved: isSavedDoc };
            if (wsEl) domState['pf_wanstart'] = { val: (wsEl.value || '').trim(), isSaved: isSavedDoc };
            if (weEl) domState['pf_wanend'] = { val: (weEl.value || '').trim(), isSaved: isSavedDoc };
            if (prEl) domState['pf_protocol'] = { val: (prEl.value || '').trim(), isSaved: isSavedDoc };

            // ── Kiểm tra ràng buộc bất biến: Không được chọn Application profile có sẵn ──
            if (appSelEl && appSelEl.value !== '-1' && appSelEl.value !== '') {
              var appText = appSelEl.options && appSelEl.selectedIndex >= 0 ? appSelEl.options[appSelEl.selectedIndex].text : appSelEl.value;
              outOfScopeErrors.push({
                id: 'err_portfwd_preset',
                name: 'Thao tác ngoài phạm vi: Chế độ Port Forwarding',
                expected: 'Customer Setting (Tự cấu hình)',
                actual: appText,
                passed: false,
                message: 'Phải tự cấu hình cổng dịch vụ thủ công theo đề bài, không được chọn ứng dụng có sẵn'
              });
            }

            // Kiểm tra logic WAN Start Port <= WAN End Port
            var startPortNum = parseInt(wsEl ? wsEl.value : '', 10);
            var endPortNum = parseInt(weEl ? weEl.value : '', 10);
            if (!isNaN(startPortNum) && !isNaN(endPortNum) && startPortNum > endPortNum) {
              outOfScopeErrors.push({
                id: 'err_port_range_invalid',
                name: 'Ràng buộc logic: Dải cổng WAN',
                expected: 'Start Port <= End Port (3389 <= 3389)',
                actual: 'Start: ' + startPortNum + ' > End: ' + endPortNum,
                passed: false,
                message: 'Cổng ngoài bắt đầu không được lớn hơn cổng ngoài kết thúc'
              });
            }
          }
        } catch (e) { }
      }

      function evaluateCriteria(ruleId, ruleName, expectedVal, displayExpected) {
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

        var isMatch = (actualVal === expectedVal);
        var passed = isMatch && isSaved;

        var expText = displayExpected || expectedVal;
        var actText = actualVal || '';
        if (ruleId === 'pf_protocol') {
          if (actualVal === '1') actText = 'TCP';
          else if (actualVal === '2') actText = 'UDP';
          else if (actualVal === '3') actText = 'Both';
        }

        var msg = '';
        if (passed) {
          msg = 'Chính xác';
        } else if (!actualVal) {
          actText = '(Chưa nhập / Chưa tìm thấy)';
          msg = 'Chưa cấu hình';
        } else if (!isSaved) {
          actText = actText + ' (Chưa lưu)';
          msg = 'Chưa bấm Apply để lưu cấu hình';
        } else {
          msg = 'Mong muốn: "' + expText + '", Thực tế: "' + actText + '"';
        }

        return {
          id: ruleId,
          name: ruleName,
          expected: expText,
          actual: actText,
          passed: passed,
          message: msg
        };
      }

      var details = [];
      var passedCount = 0;

      // 1. Local IP Address: 192.168.1.254
      var r1 = evaluateCriteria('pf_lanip', 'Local IP Address', '192.168.1.254');
      if (r1.passed) passedCount++;
      details.push(r1);

      // 2. Local Port: 3389
      var r2 = evaluateCriteria('pf_lanport', 'Local Port', '3389');
      if (r2.passed) passedCount++;
      details.push(r2);

      // 3. WAN Start Port: 3389
      var r3 = evaluateCriteria('pf_wanstart', 'WAN Start Port', '3389');
      if (r3.passed) passedCount++;
      details.push(r3);

      // 4. WAN End Port: 3389
      var r4 = evaluateCriteria('pf_wanend', 'WAN End Port', '3389');
      if (r4.passed) passedCount++;
      details.push(r4);

      // 5. Protocol: TCP (value 1)
      var r5 = evaluateCriteria('pf_protocol', 'Giao thức Protocol', '1', 'TCP');
      if (r5.passed) passedCount++;
      details.push(r5);

      // Bổ sung các lỗi can thiệp ngoài phạm vi vào danh sách details
      if (outOfScopeErrors.length > 0) {
        outOfScopeErrors.forEach(function (err) {
          details.push(err);
        });
      }

      var totalRules = 5 + outOfScopeErrors.length;
      var allPassed = (passedCount === 5) && (outOfScopeErrors.length === 0);
      var score = allPassed ? 100 : Math.round((passedCount / totalRules) * 100);

      var isPortfwdDocSaved = Boolean(
        (domState['pf_lanip'] && domState['pf_lanip'].isSaved) ||
        (cache['pf_lanip'] && cache['pf_lanip'].isSaved)
      );

      return {
        passed: allPassed,
        score: score,
        passedCount: passedCount,
        totalRules: totalRules,
        details: details,
        daVaoTrangCuoi: isPortfwdDocSaved,
        trangHienTaiDat: !isPortfwdDocSaved || allPassed
      };
    }
  }
};

if (index !== -1) {
  window.DEVICE_AC1000CV2_LESSONS[index] = lessonObj;
} else {
  window.DEVICE_AC1000CV2_LESSONS.push(lessonObj);
}
