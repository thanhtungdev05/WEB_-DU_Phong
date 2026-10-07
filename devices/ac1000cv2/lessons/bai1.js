/**
 * devices/ac1000cv2/lessons/bai1.js
 * Bài 1: Cấu hình kết nối PPPoE trên Internet Hub AC1000C V2 (theo chuẩn ONT AC1000F)
 */

window.DEVICE_AC1000CV2_LESSONS = window.DEVICE_AC1000CV2_LESSONS || [];

var index = window.DEVICE_AC1000CV2_LESSONS.findIndex(function (l) { return l.id === 'ac1000cv2-bai1' || l.id === 'LAB_AC1000CV2_01'; });
var lessonObj = {
  id: 'ac1000cv2-bai1',
  title: 'Bài 1 - Cấu hình PPPoE',
  subtitle: 'Cấu hình PPPoE',
  instructions: [
    '<b>Yêu cầu:</b>',
    'Thực hiện cấu hình kết nối WAN Internet với giao thức <b>PPPoE</b> theo các thông số:',
    '- PPPoE Username: <span class="val">sgfdl-210208-218</span>',
    '- PPPoE Password: <span class="val">fpt12345</span>',
  ],
  practiceUrl: '/sim_ac1000cv2/wan.html',
  allowedSelectors: [
    '#wan_list',
    'select[name="wan_list"]',
    '#btn_apply',
    'input[value="Apply"]',
    '#apply',
    '#btn_refresh'
  ],
  onSimLoad: function (iframeWindow) {
    try {
      if (iframeWindow && iframeWindow.document) {
        const doc = iframeWindow.document;
        // Ver2.1 dùng MTU PPPoE 1492; đồng bộ giá trị hiển thị với grading.
        const mtuEl = doc.querySelector('#mtu, input[name="mtu"]');
        if (mtuEl && (!mtuEl.value || mtuEl.value === '1500')) {
          mtuEl.value = '1500';
        }

        if (window._hasClickedSaveInGuide && window._sessionRuleCache) {
          const userEl = doc.querySelector('#ppp_user, input[name="ppp_user"]');
          const passEl = doc.querySelector('#ppp_pass, input[name="ppp_pass"]');
          if (userEl && !userEl.value && window._sessionRuleCache['ppp_user']) {
            userEl.value = window._sessionRuleCache['ppp_user'].actualValue;
          }
          if (passEl && !passEl.value && window._sessionRuleCache['ppp_pass']) {
            passEl.value = window._sessionRuleCache['ppp_pass'].actualValue;
          }
          doc._ftcIsSaved = true;
        }

        if (!doc._ftcInputResetAttached) {
          doc._ftcInputResetAttached = true;
          doc.addEventListener('input', function (e) {
            var t = e.target;
            if (t && (t.id === 'ppp_user' || t.name === 'ppp_user' || t.id === 'ppp_pass' || t.name === 'ppp_pass')) {
              doc._ftcIsSaved = false;
            }
          }, true);
        }
      }
    } catch (e) { }
  },
  clearFields: [
    'input[name="ppp_user"]',
    '#ppp_user',
    'input[name="ppp_pass"]',
    '#ppp_pass'
  ],
  customClear: function () {
    try {
      var iframe = document.getElementById('device-iframe');
      if (iframe && iframe.contentWindow) {
        var doc = iframe.contentWindow.document;
        var pPath = (doc && doc.location && doc.location.pathname) ? doc.location.pathname.toLowerCase() : '';
        var cache = window._sessionRuleCache || {};

        if (pPath.indexOf('wan') !== -1 && (!cache['ppp_user'] || !cache['ppp_user'].isSaved)) {
          var uEl = doc.querySelector('#ppp_user, input[name="ppp_user"]');
          var pEl = doc.querySelector('#ppp_pass, input[name="ppp_pass"]');
          if (uEl && (uEl.value === 'fpt' || !cache['ppp_user'])) uEl.value = '';
          if (pEl && !cache['ppp_pass']) pEl.value = '';
        }
      }
    } catch (e) { }
  },
  grading: {
    description: 'Kiểm tra cấu hình tài khoản PPPoE WAN & Ràng buộc giao thức WAN',
    rules: [
      {
        id: 'ip_mode',
        name: 'Chế độ kết nối WAN (PPPoE)',
        selector: '#ip_mode, select[name="ip_mode"]',
        expected: '1',
        displayExpected: 'PPPoE',
        type: 'text_exact',
        required: true
      },
      {
        id: 'wan_en',
        name: 'Kích hoạt WAN Connection',
        selector: '#wan_en0, #wan_en1, input[name="wan_en"][value="1"]',
        expected: '1',
        displayExpected: 'Enable',
        type: 'radio_checked',
        required: true
      },
      {
        id: 'nat_en',
        name: 'Kích hoạt NAT',
        selector: '#nat0, #nat_en1, input[name="nat"][value="1"], input[name="nat_en"][value="1"]',
        expected: '1',
        displayExpected: 'Enable',
        type: 'radio_checked',
        required: true
      },
      {
        id: 'mtu',
        name: 'TCP MTU',
        selector: '#mtu, input[name="mtu"]',
        expected: '1500',
        type: 'text_exact',
        trim: true,
        required: true
      },
      {
        id: 'ppp_user',
        name: 'PPPoE Username',
        selector: 'input[name="ppp_user"], #ppp_user',
        expected: 'sgfdl-210208-218',
        type: 'text_exact',
        trim: true,
        required: true
      },
      {
        id: 'ppp_pass',
        name: 'PPPoE Password',
        selector: 'input[name="ppp_pass"], #ppp_pass',
        expected: 'fpt12345',
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

          if (p.indexOf('wan') !== -1) {
            var uEl = d.querySelector('input[name="ppp_user"], #ppp_user');
            var pEl = d.querySelector('input[name="ppp_pass"], #ppp_pass');
            var ipModeEl = d.querySelector('#ip_mode, select[name="ip_mode"]');
            var wanEnEl = d.querySelector('#wan_en0, input[name="wan_en"][value="1"], #wan_en1');
            var wanDisEl = d.querySelector('#wan_en1, input[name="wan_en"][value="0"]');
            var natEnEl = d.querySelector('#nat0, #nat_en1, input[name="nat"][value="1"], input[name="nat_en"][value="1"]');
            var natDisEl = d.querySelector('#nat1, input[name="nat"][value="0"]');
            var mtuEl = d.querySelector('#mtu, input[name="mtu"]');
            var vlanEnEl = d.querySelector('#vlan_en, input[name="vlan_en"]:checked');
            var dnsWrEl = d.querySelector('#dnswr0, input[name="dnswr"][value="1"]');

            if (uEl) domState['ppp_user'] = { val: (uEl.value || '').trim(), isSaved: isSavedDoc };
            if (pEl) domState['ppp_pass'] = { val: (pEl.value || '').trim(), isSaved: isSavedDoc };

            // ── Kiểm tra ràng buộc bất biến (Invariants) trên WAN ──
            // 1. IP Mode phải là PPPoE (value = '1')
            if (ipModeEl && ipModeEl.value !== '1') {
              var modeName = ipModeEl.options && ipModeEl.selectedIndex >= 0 ? ipModeEl.options[ipModeEl.selectedIndex].text : ipModeEl.value;
              outOfScopeErrors.push({
                id: 'err_wan_mode',
                name: 'Thao tác ngoài phạm vi: Giao thức WAN',
                expected: 'PPPoE',
                actual: modeName || ipModeEl.value,
                passed: false,
                message: 'Không được thay đổi giao thức kết nối WAN sang Bridge hoặc IPoE'
              });
            }

            // 2. WAN Connection Enable
            var isWanDisabled = false;
            if (wanDisEl && wanDisEl.checked && (!wanEnEl || !wanEnEl.checked)) {
              isWanDisabled = true;
            } else if (wanEnEl && wanEnEl.checked === false && (!wanDisEl || wanDisEl.checked)) {
              isWanDisabled = true;
            }
            if (isWanDisabled) {
              outOfScopeErrors.push({
                id: 'err_wan_en',
                name: 'Thao tác ngoài phạm vi: Trạng thái kết nối WAN',
                expected: 'Enable',
                actual: 'Disable',
                passed: false,
                message: 'Cố tình tắt kết nối WAN ngoài yêu cầu bài học'
              });
            }

            // 3. NAT Enable
            var isNatDisabled = false;
            if (natDisEl && natDisEl.checked && (!natEnEl || !natEnEl.checked)) {
              isNatDisabled = true;
            } else if (natEnEl && natEnEl.checked === false && (!natDisEl || natDisEl.checked)) {
              isNatDisabled = true;
            }
            if (isNatDisabled) {
              outOfScopeErrors.push({
                id: 'err_nat_en',
                name: 'Thao tác ngoài phạm vi: Trạng thái NAT',
                expected: 'Enable',
                actual: 'Disable',
                passed: false,
                message: 'Cố tình tắt tính năng NAT của đường truyền'
              });
            }

            // 4. TCP MTU (giữ đúng giá trị chuẩn Ver2.1)
            if (mtuEl && mtuEl.value && mtuEl.value.trim() !== '') {
              var curMtu = mtuEl.value.trim();
              if (curMtu !== '1500') {
                outOfScopeErrors.push({
                  id: 'err_mtu',
                  name: 'Thao tác ngoài phạm vi: TCP MTU',
                  expected: '1500',
                  actual: curMtu,
                  passed: false,
                  message: 'Cố tình thay đổi thông số MTU ngoài yêu cầu bài học'
                });
              }
            }

            // 5. VLAN (không được bật VLAN nếu không yêu cầu)
            if (vlanEnEl && (vlanEnEl.checked || vlanEnEl.value === '1')) {
              outOfScopeErrors.push({
                id: 'err_vlan_en',
                name: 'Thao tác ngoài phạm vi: VLAN Tagging',
                expected: 'Disable',
                actual: 'Enable',
                passed: false,
                message: 'Cố tình kích hoạt hoặc thay đổi VLAN ngoài yêu cầu bài học'
              });
            }

            // 6. DNS Overwrite (không được bật đè DNS trong bài PPPoE)
            if (dnsWrEl && dnsWrEl.checked) {
              outOfScopeErrors.push({
                id: 'err_dnswr',
                name: 'Thao tác ngoài phạm vi: DNS Overwrite',
                expected: 'Disable',
                actual: 'Enable',
                passed: false,
                message: 'Cố tình bật cấu hình đè DNS trong bài thực hành PPPoE'
              });
            }
          }
        } catch (e) { }
      }

      function evaluateCriteria(ruleId, ruleName, expectedVal) {
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

        var actualDisplay = actualVal || '';
        var msg = '';
        if (passed) {
          msg = 'Chính xác';
        } else if (!actualVal) {
          actualDisplay = '(Chưa nhập / Chưa tìm thấy)';
          msg = 'Chưa cấu hình';
        } else if (!isSaved) {
          actualDisplay = actualVal + ' (Chưa lưu)';
          msg = 'Chưa bấm Apply để lưu cấu hình';
        } else {
          msg = 'Mong muốn: "' + expectedVal + '", Thực tế: "' + actualVal + '"';
        }

        return {
          id: ruleId,
          name: ruleName,
          expected: expectedVal,
          actual: actualDisplay,
          passed: passed,
          message: msg
        };
      }

      var details = [];
      var passedCount = 0;

      // 1. PPPoE Username
      var r1 = evaluateCriteria('ppp_user', 'PPPoE Username', 'sgfdl-210208-218');
      if (r1.passed) passedCount++;
      details.push(r1);

      // 2. PPPoE Password
      var r2 = evaluateCriteria('ppp_pass', 'PPPoE Password', 'fpt12345');
      if (r2.passed) passedCount++;
      details.push(r2);

      // Bổ sung các lỗi can thiệp ngoài phạm vi vào danh sách details
      if (outOfScopeErrors.length > 0) {
        outOfScopeErrors.forEach(function (err) {
          details.push(err);
        });
      }

      var totalRules = 2 + outOfScopeErrors.length;
      var allPassed = (passedCount === 2) && (outOfScopeErrors.length === 0);
      var score = allPassed ? 100 : Math.round((passedCount / totalRules) * 100);

      var isWanDocSaved = Boolean(
        (domState['ppp_user'] && domState['ppp_user'].isSaved) ||
        (cache['ppp_user'] && cache['ppp_user'].isSaved)
      );

      return {
        passed: allPassed,
        score: score,
        passedCount: passedCount,
        totalRules: totalRules,
        details: details,
        daVaoTrangCuoi: isWanDocSaved,
        trangHienTaiDat: !isWanDocSaved || allPassed
      };
    }
  }
};

if (index !== -1) {
  window.DEVICE_AC1000CV2_LESSONS[index] = lessonObj;
} else {
  window.DEVICE_AC1000CV2_LESSONS.push(lessonObj);
}
