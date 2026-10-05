/**
 * devices/ax3000c/ftc_chung.js — Hàm dùng chung cho các bài AX3000CV2 (firmware 0.5.3)
 *
 * Firmware 0.5.3 chạy giao diện Vue/Element UI THẬT (bản cũ 0.10.2 dùng trang HTML tự vẽ).
 * Script trong giả lập (simulators/sim_ax3000c/ftc/ftc-ax3000c.js) gắn nhãn theo chữ hiển thị:
 *   .el-form-item[data-ftc-nhan="PPP Username"]   ô cấu hình theo nhãn
 *   [data-ftc-menu="WAN"]                         mục menu trái
 *   .el-main button[data-ftc-nut="Apply"]         nút
 *   td[data-ftc-cot="External port"]              ô trong bảng theo tiêu đề cột
 * nên tooltip và chấm điểm chọn ô bằng CSS thường.
 */

window.FTC_AX3000C = window.FTC_AX3000C || {};

(function (F) {
  F.o = function (nhan) { return '.el-form-item[data-ftc-nhan="' + nhan + '"] input'; };
  F.nut = function (chu) { return '.el-main button[data-ftc-nut="' + chu + '"]'; };
  F.cot = function (cot) { return '.el-table__body td[data-ftc-cot="' + cot + '"] input'; };

  // 3 bước chọn menu trái: nhóm Network -> nhóm con -> mục trang
  F.menu = function (nhomCon, muc, trang, chuNhomCon, chuMuc) {
    return [
      {
        selector: 'li.el-submenu:not(.is-opened) > .el-submenu__title[data-ftc-menu="Network"]',
        text: 'Chọn Network',
        position: 'right',
        hideOnPage: trang
      },
      {
        selector: 'li.el-submenu.is-opened li.el-submenu:not(.is-opened) > .el-submenu__title[data-ftc-menu="' + nhomCon + '"]',
        text: 'Chọn ' + (chuNhomCon || nhomCon),
        position: 'right',
        hideOnPage: trang
      },
      {
        selector: 'li.el-submenu.is-opened li.el-submenu.is-opened li.el-menu-item[data-ftc-menu="' + muc + '"]',
        text: 'Chọn ' + (chuMuc || muc),
        position: 'right',
        hideOnPage: trang
      }
    ];
  };

  function tai_lieu() {
    try {
      const f = document.getElementById('device-iframe');
      return (f && f.contentWindow && f.contentWindow.document) ? [f.contentWindow.document] : [];
    } catch (e) { return []; }
  }

  // Xoá trắng ô el-input của Vue: phải phát 'input' để v-model cập nhật theo, nếu chỉ
  // gán value='' thì Vue vẫn giữ giá trị cũ và gửi đi khi bấm Apply. Mỗi ô chỉ xoá MỘT
  // lần (ô Vue vẽ lại là ô mới thì xoá lại); không đụng ô học viên đã sửa hoặc đang gõ.
  // chiODau = true: chỉ xoá ô KHỚP ĐẦU TIÊN của mỗi selector. Dùng cho trang Wi-Fi: bật "Use
  // separate SSID" thì tab có 2 bộ ô (2G rồi 5G) và firmware kiểm mật khẩu của CẢ HAI kể cả khi 5G
  // tắt -> xoá luôn ô 5G là Apply bị báo "Please input valid passphrase..." (anh Huynn gặp 2026-09-28).
  F.xoaO = function (selectors, chiODau) {
    tai_lieu().forEach(function (doc) {
      selectors.forEach(function (sel) {
        try {
          const ds = chiODau ? [doc.querySelector(sel)].filter(Boolean) : doc.querySelectorAll(sel);
          ds.forEach(function (el) {
            if (el._ftcDaXoa || el._ftcUserModified || el === doc.activeElement) return;
            el._ftcDaXoa = true;
            if (el.value === '') return;
            el.value = '';
            const win = doc.defaultView || window;
            el.dispatchEvent(new win.Event('input', { bubbles: true }));
          });
        } catch (e) { }
      });
    });
  };

  // Đặt trạng thái xuất phát riêng của bài (Bài 5, Bài 7) — gọi từ onSimLoad, chỉ một lần
  // mỗi lượt mở (lúc iframe đang ở trang login do nút Hướng dẫn/Thực hành mở).
  F.datTrangThaiBai = function (simWin, bai) {
    try {
      if (!simWin || simWin._ftcDaDatBai) return;
      const oLogin = String(simWin.location.href).indexOf('logout=1') !== -1 ||
        !!simWin.document.querySelector('.login-fpt');
      if (!oLogin) return;
      simWin._ftcDaDatBai = true;
      simWin.fetch('/sim_ax3000c/ftc-dat-bai?bai=' + bai, { cache: 'no-store' });
    } catch (e) { }
  };

  // Xử lý ô Device/IP cho Bài 6: Đảm bảo ô Device/IP luôn cho phép gõ trực tiếp 192.168.100.109,
  // xóa chữ 'select', ẩn mũi tên dropdown, và giữ giá trị khi chuyển sang ô khác (blur)
  F.xuLyPortfwdDeviceIp = function (simWin) {
    try {
      if (!simWin) return;
      const doc = simWin.document;
      if (!doc) return;
      const xuLy = function () {
        try {
          const cells = doc.querySelectorAll('td[data-ftc-cot="Device/IP"]');
          cells.forEach(function (td) {
            const input = td.querySelector('input');
            if (!input) return;
            if (input.placeholder === 'select') input.placeholder = '';
            const suf = td.querySelector('.el-input__suffix');
            if (suf && suf.style.display !== 'none') suf.style.display = 'none';

            if (!input._ftcPortalBound) {
              input._ftcPortalBound = true;
              input.addEventListener('input', function () {
                input._ftcLastVal = (input.value || '').trim();
              }, true);
              input.addEventListener('blur', function () {
                const v = (input.value || input._ftcLastVal || '').trim();
                if (v) {
                  input._ftcLastVal = v;
                  setTimeout(function () {
                    if (!input.value && input._ftcLastVal) {
                      input.value = input._ftcLastVal;
                    }
                  }, 60);
                }
              }, true);
            }

            if (!input.value && input._ftcLastVal) {
              input.value = input._ftcLastVal;
            }
          });
          doc.querySelectorAll('.el-select-dropdown').forEach(function (d) {
            var txt = d.textContent || '';
            if (txt.indexOf('Admin-PC') !== -1 || txt.indexOf('d8:43:ae') !== -1) {
              d.style.setProperty('display', 'none', 'important');
              d.style.setProperty('visibility', 'hidden', 'important');
              d.style.setProperty('opacity', '0', 'important');
              d.style.setProperty('pointer-events', 'none', 'important');
            }
          });
        } catch (e) {}
      };
      xuLy();
      const iv = setInterval(xuLy, 200);
      setTimeout(function () { clearInterval(iv); }, 30000);
    } catch (e) {}
  };
})(window.FTC_AX3000C);

