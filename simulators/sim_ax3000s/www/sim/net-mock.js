/* ==========================================================================
 *  NET-MOCK - Lớp chặn mạng cho bộ giả lập
 *  Bọc jQuery.ajax: các URL "ảo" (/ubus, /cgi-bin/...) được backend ảo trả lời;
 *  các URL còn lại (file .htm view, ảnh, css, js) đi qua ajax gốc như thường.
 *  Cần nạp SAU jquery và SAU backend.js.
 * ========================================================================== */
(function ($) {
  "use strict";
  if (!$ || !$.ajax) { console.error("[net-mock] jQuery chưa sẵn sàng"); return; }
  if (!window.SIM) { console.error("[net-mock] backend.js (SIM) chưa nạp"); return; }

  var _ajax = $.ajax;

  // Tạo đối tượng giống jqXHR để code gọi không lỗi (.done/.fail/.abort/...)
  function fakeXHR(data) {
    var jq = {
      readyState: 4, status: 200, responseText: (typeof data === "string" ? data : JSON.stringify(data)),
      statusText: "OK",
      done: function (cb) { cb && cb(data, "success", jq); return jq; },
      fail: function () { return jq; },
      always: function (cb) { cb && cb(jq, "success"); return jq; },
      then: function (cb) { cb && cb(data); return jq; },
      abort: function () { },
      getAllResponseHeaders: function () { return ""; },
      getResponseHeader: function () { return null; },
      setRequestHeader: function () { }
    };
    return jq;
  }

  // Chạy callback bất đồng bộ (giống mạng thật) rồi trả jqXHR giả
  function respond(opts, data) {
    var jq = fakeXHR(data);
    setTimeout(function () {
      try { if (typeof opts.success === "function") opts.success(data, "success", jq); }
      catch (e) { console.error("[net-mock] lỗi trong success:", e); }
      try { if (typeof opts.complete === "function") opts.complete(jq, "success"); } catch (e) { }
    }, 5);
    return jq;
  }

  // Phân tích body POST (chuỗi JSON hoặc object dạng form)
  function parseData(d) {
    if (!d) return null;
    if (typeof d === "object") return d;
    if (typeof d === "string") {
      var s = d.trim();
      if (s.charAt(0) === "{" || s.charAt(0) === "[") {
        try { return JSON.parse(s); } catch (e) { }
      }
      // form-encoded: a=b&c=d
      var o = {}, parts = s.split("&");
      for (var i = 0; i < parts.length; i++) {
        var kv = parts[i].split("=");
        o[decodeURIComponent(kv[0])] = decodeURIComponent(kv[1] || "");
      }
      return o;
    }
    return null;
  }

  function isVirtual(url) {
    return /\/ubus(\?|$)/.test(url) ||
      url.indexOf("/cgi-bin/cgi-exec") !== -1 ||
      url.indexOf("/cgi-bin/luci/admin/renew") !== -1 ||
      url.indexOf("/admin/translations") !== -1 ||
      url.indexOf("/translationssk") !== -1;
  }

  // Bọc $.ajax
  $.ajax = function (url, options) {
    if (typeof url === "object") { options = url; url = options.url; }
    options = options || {};
    options.url = url = url || options.url || "";

    if (!isVirtual(url)) {
      return _ajax.call($, url, options); // đi mạng thật (file tĩnh)
    }

    // ---- Định tuyến các endpoint ảo ----
    // /ubus : JSON-RPC ubus
    if (/\/ubus(\?|$)/.test(url)) {
      var req = parseData(options.data);
      var res = window.SIM.handleRpc(req);
      return respond(options, res);
    }

    // /cgi-bin/cgi-exec : chạy lệnh mô phỏng, trả text
    if (url.indexOf("/cgi-bin/cgi-exec") !== -1) {
      var body = parseData(options.data) || {};
      var text = window.SIM.handleCgiExec(body.command || "");
      return respond(options, text);
    }

    // /cgi-bin/luci/admin/renew : gia hạn phiên
    if (url.indexOf("/admin/renew") !== -1) {
      return respond(options, { ok: true });
    }

    // translations : trả rỗng -> nhãn hiển thị nguyên gốc (tiếng Anh)
    if (url.indexOf("/cgi-bin/cgi-exec") !== -1) {
      var cmd = (options && options.data && options.data.command) || "";
      var out = "[AX3000S] System log initialized\n[kernel] br-lan: link up\n[wifi] ra0 / rai0 AP started\n";
      if (cmd.indexOf("usage.log") !== -1) {
        var nowSec = Math.floor(Date.now() / 1000);
        out = [2, 1, 0].map(function (k) { return (nowSec - k * 30) + "," + (14 + k * 2) + "," + (38 + k); }).join("\n");
      }
      return respond(options, out);
    }

    if (url.indexOf("/cgi-bin/cgi-download") !== -1) {
      return respond(options, new Blob(["FPT AX3000S simulated diagnostic file\n"], { type: "text/plain" }));
    }

    if (url.indexOf("/translations") !== -1) {
      return respond(options, {});
    }

    return respond(options, {});
  };

  // Giữ các thuộc tính phụ của $.ajax (nếu có)
  for (var k in _ajax) { if (_ajax.hasOwnProperty(k)) $.ajax[k] = _ajax[k]; }

  console.log("[net-mock] Đã kích hoạt backend ảo cho /ubus và /cgi-bin/*");
})(window.jQuery);
