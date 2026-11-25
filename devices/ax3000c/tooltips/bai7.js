/**
 * devices/ax3000c/tooltips/bai7.js — Bộ Tooltip Chuẩn Hóa Chuyên Biệt cho Bài 7:
 * Cấu hình Mesh AX3000CV2 với AX3000CV2 (FPT EasyMesh Controller + Agent)
 * 
 * Chuẩn hóa 23 bước tuần tự (Bước 1 -> Bước 23), câu chữ ngắn gọn, dứt khoát.
 * Cơ chế Live Validation Wizard: Xong bước nào ẩn bước đó, nhập sai thì đứng yên cho KTV nhập đúng.
 * Tương thích 100% với Vue Element UI Firmware 0.5.3 (Connection Type, Passphrase, Use separate SSID).
 */

if (!window.TOOLTIPS_AX3000C) window.TOOLTIPS_AX3000C = {};

(function (F) {
  // Static definitions (fallback khi không có live DOM)
  window.TOOLTIPS_AX3000C['LAB_AX3000CV2_07_STEP1'] = [
    {
      selector: 'li.el-submenu:not(.is-opened) > .el-submenu__title[data-ftc-menu="Network"]',
      text: 'Bước 4: Chọn Network',
      position: 'right',
      hideOnPage: 'network/easymesh'
    },
    {
      selector: 'li.el-submenu.is-opened li.el-submenu:not(.is-opened) > .el-submenu__title[data-ftc-menu="Wi-Fi"], [data-ftc-menu="Wi-Fi"]',
      text: 'Bước 4: Chọn Wi-Fi',
      position: 'right',
      hideOnPage: 'network/easymesh'
    },
    {
      selector: 'li.el-submenu.is-opened li.el-submenu.is-opened li.el-menu-item[data-ftc-menu="Easymesh"], [data-ftc-menu="Easymesh"]',
      text: 'Bước 4: Chọn Easymesh',
      position: 'right',
      hideOnPage: 'network/easymesh'
    },
    {
      selector: '.el-form-item[data-ftc-nhan="Enabled"] .el-switch',
      text: 'Bước 5: Bật Enabled',
      position: 'right',
      page: 'network/easymesh'
    },
    {
      selector: F.o('MeshRole'),
      text: 'Bước 6: Chọn MeshRole: Controller',
      position: 'right',
      page: 'network/easymesh'
    },
    {
      selector: F.nut('Apply'),
      text: 'Bước 7: Bấm Apply',
      position: 'top',
      page: 'network/easymesh'
    }
  ];

  window.TOOLTIPS_AX3000C['LAB_AX3000CV2_07_WAN'] = [
    {
      selector: 'li.el-submenu:not(.is-opened) > .el-submenu__title[data-ftc-menu="Network"]',
      text: 'Bước 8: Chọn Network',
      position: 'right',
      hideOnPage: 'network/wan'
    },
    {
      selector: 'li.el-submenu.is-opened li.el-submenu:not(.is-opened) > .el-submenu__title[data-ftc-menu="WAN"], [data-ftc-menu="WAN"]',
      text: 'Bước 8: Chọn WAN',
      position: 'right',
      hideOnPage: 'network/wan'
    },
    {
      selector: 'li.el-submenu.is-opened li.el-submenu.is-opened li.el-menu-item[data-ftc-menu="WAN"], [data-ftc-menu="WAN"]',
      text: 'Bước 8: Chọn WAN',
      position: 'right',
      hideOnPage: 'network/wan'
    },
    {
      selector: F.o('Connection Type') + ', ' + F.o('Protocol'),
      text: 'Bước 9: Chọn Connection Type: PPPoE',
      position: 'right',
      page: 'network/wan'
    },
    {
      selector: F.o('PPP Username') + ', ' + F.o('Username'),
      text: 'Bước 10: Nhập Username: sgfdl-123456-789',
      position: 'right',
      page: 'network/wan'
    },
    {
      selector: F.o('PPP Password') + ', ' + F.o('Password'),
      text: 'Bước 11: Nhập Password: d123456',
      position: 'right',
      page: 'network/wan'
    },
    {
      selector: F.nut('Apply'),
      text: 'Bước 12: Bấm Apply',
      position: 'top',
      page: 'network/wan'
    }
  ];

  window.TOOLTIPS_AX3000C['LAB_AX3000CV2_07_WIFI'] = [
    {
      selector: 'li.el-submenu:not(.is-opened) > .el-submenu__title[data-ftc-menu="Network"]',
      text: 'Bước 13: Chọn Network',
      position: 'right',
      hideOnPage: 'network/wifi'
    },
    {
      selector: 'li.el-submenu.is-opened li.el-submenu:not(.is-opened) > .el-submenu__title[data-ftc-menu="Wi-Fi"], [data-ftc-menu="Wi-Fi"]',
      text: 'Bước 13: Chọn Wi-Fi',
      position: 'right',
      hideOnPage: 'network/wifi'
    },
    {
      selector: 'li.el-submenu.is-opened li.el-submenu.is-opened li.el-menu-item[data-ftc-menu="Wi-Fi"], [data-ftc-menu="Wi-Fi"]',
      text: 'Bước 13: Chọn Wi-Fi',
      position: 'right',
      hideOnPage: 'network/wifi'
    },
    {
      selector: '.el-switch[data-ftc-cong-tac="Use separate SSID"], .el-switch[data-ftc-cong-tac*="separate"], .el-switch[data-ftc-cong-tac*="Separate"], .el-form-item[data-ftc-nhan*="separate SSID"] .el-switch',
      text: 'Bước 14: Tắt Use separate SSID',
      position: 'right',
      page: 'network/wifi'
    },
    {
      selector: '#pane-hostssid ' + F.o('SSID') + ', ' + F.o('SSID'),
      text: 'Bước 15: Nhập SSID: FPT Telecom',
      position: 'right',
      page: 'network/wifi'
    },
    {
      selector: '#pane-hostssid ' + F.o('Passphrase') + ', ' + F.o('Passphrase') + ', ' + F.o('Password') + ', ' + F.o('WPA Pre-Shared Key'),
      text: 'Bước 16: Nhập Password: fpt12345',
      position: 'right',
      page: 'network/wifi'
    },
    {
      selector: F.nut('Apply'),
      text: 'Bước 17: Bấm Apply',
      position: 'top',
      page: 'network/wifi'
    }
  ];

  window.TOOLTIPS_AX3000C['LAB_AX3000CV2_07_TOPO'] = [
    {
      selector: 'li.el-submenu:not(.is-opened) > .el-submenu__title[data-ftc-menu="Status"]',
      text: 'Chọn Status',
      position: 'right',
      hideOnPage: 'status/easymesh'
    },
    {
      selector: 'li.el-submenu.is-opened li.el-menu-item[data-ftc-menu="Easymesh Topo"], li.el-submenu.is-opened li.el-menu-item[data-ftc-menu*="Easymesh"], [data-ftc-menu*="Easymesh"]',
      text: 'Chọn Easymesh Topo',
      position: 'right',
      hideOnPage: 'status/easymesh'
    },
    {
      selector: '.el-table, #topology-table, .easymesh-topo-content, .el-card__body',
      text: 'Bước 23: Kiểm tra Topology và bấm "Nộp bài & Chấm điểm"',
      position: 'top',
      page: 'status/easymesh'
    }
  ];

  // Helper hàm Live Validation Wizard: Trả về DUY NHẤT 1 bước chưa hoàn tất dựa trên DOM thực tế
  window.TOOLTIPS_AX3000C.getMeshBai7LiveStep = function (doc, phase) {
    if (!doc) return [];
    const hash = (doc.location && doc.location.hash) ? doc.location.hash.toLowerCase() : '';

    if (phase === 'easymesh') {
      if (!hash.includes('network/easymesh')) {
        const isNetOpen = Boolean(doc.querySelector('li.el-submenu.is-opened > .el-submenu__title[data-ftc-menu="Network"]'));
        if (!isNetOpen) {
          return [{
            selector: 'li.el-submenu:not(.is-opened) > .el-submenu__title[data-ftc-menu="Network"]',
            text: 'Bước 4: Chọn Network',
            position: 'right'
          }];
        }
        const isWifiOpen = Boolean(doc.querySelector('li.el-submenu.is-opened li.el-submenu.is-opened > .el-submenu__title[data-ftc-menu="Wi-Fi"]'));
        if (!isWifiOpen) {
          return [{
            selector: 'li.el-submenu.is-opened li.el-submenu:not(.is-opened) > .el-submenu__title[data-ftc-menu="Wi-Fi"], [data-ftc-menu="Wi-Fi"]',
            text: 'Bước 4: Chọn Wi-Fi',
            position: 'right'
          }];
        }
        return [{
          selector: 'li.el-submenu.is-opened li.el-submenu.is-opened li.el-menu-item[data-ftc-menu="Easymesh"], [data-ftc-menu="Easymesh"]',
          text: 'Bước 4: Chọn Easymesh',
          position: 'right'
        }];
      }

      // Đang ở network/easymesh: kiểm tra live giá trị
      const sw = doc.querySelector('.el-form-item[data-ftc-nhan="Enabled"] .el-switch');
      const isSwOn = Boolean(sw && (sw.classList.contains('is-checked') || (sw.querySelector('input') && sw.querySelector('input').checked)));
      if (!isSwOn) {
        return [{
          selector: '.el-form-item[data-ftc-nhan="Enabled"] .el-switch',
          text: 'Bước 5: Bật Enabled',
          position: 'right',
          page: 'network/easymesh'
        }];
      }

      const rInp = doc.querySelector('.el-form-item[data-ftc-nhan="MeshRole"] input');
      const rVal = rInp ? (rInp.value || '').trim().toLowerCase() : '';
      if (rVal !== 'controller') {
        return [{
          selector: '.el-form-item[data-ftc-nhan="MeshRole"] input, .el-form-item[data-ftc-nhan="MeshRole"] .el-select',
          text: 'Bước 6: Chọn MeshRole: Controller',
          position: 'right',
          page: 'network/easymesh'
        }];
      }

      return [{
        selector: '.el-main button[data-ftc-nut="Apply"]',
        text: 'Bước 7: Bấm Apply',
        position: 'top',
        page: 'network/easymesh'
      }];
    }

    if (phase === 'wan') {
      if (!hash.includes('network/wan')) {
        const isNetOpen = Boolean(doc.querySelector('li.el-submenu.is-opened > .el-submenu__title[data-ftc-menu="Network"]'));
        if (!isNetOpen) {
          return [{
            selector: 'li.el-submenu:not(.is-opened) > .el-submenu__title[data-ftc-menu="Network"]',
            text: 'Bước 8: Chọn Network',
            position: 'right'
          }];
        }
        const isWanOpen = Boolean(doc.querySelector('li.el-submenu.is-opened li.el-submenu.is-opened > .el-submenu__title[data-ftc-menu="WAN"]'));
        if (!isWanOpen) {
          return [{
            selector: 'li.el-submenu.is-opened li.el-submenu:not(.is-opened) > .el-submenu__title[data-ftc-menu="WAN"], [data-ftc-menu="WAN"]',
            text: 'Bước 8: Chọn WAN',
            position: 'right'
          }];
        }
        return [{
          selector: 'li.el-submenu.is-opened li.el-submenu.is-opened li.el-menu-item[data-ftc-menu="WAN"], [data-ftc-menu="WAN"]',
          text: 'Bước 8: Chọn WAN',
          position: 'right'
        }];
      }

      // Đang ở network/wan: kiểm tra live giá trị
      const protoInp = doc.querySelector('.el-form-item[data-ftc-nhan="Connection Type"] input, .el-form-item[data-ftc-nhan="Protocol"] input');
      const protoVal = protoInp ? (protoInp.value || '').trim().toUpperCase() : '';
      if (protoVal !== 'PPPOE') {
        return [{
          selector: '.el-form-item[data-ftc-nhan="Connection Type"] input, .el-form-item[data-ftc-nhan="Connection Type"] .el-select, .el-form-item[data-ftc-nhan="Protocol"] input',
          text: 'Bước 9: Chọn Connection Type: PPPoE',
          position: 'right',
          page: 'network/wan'
        }];
      }

      const uInp = doc.querySelector('.el-form-item[data-ftc-nhan="PPP Username"] input, .el-form-item[data-ftc-nhan="Username"] input');
      const uVal = uInp ? (uInp.value || '').trim() : '';
      if (uVal !== 'sgfdl-123456-789') {
        return [{
          selector: '.el-form-item[data-ftc-nhan="PPP Username"] input, .el-form-item[data-ftc-nhan="Username"] input',
          text: 'Bước 10: Nhập Username: sgfdl-123456-789',
          position: 'right',
          page: 'network/wan'
        }];
      }

      const pInp = doc.querySelector('.el-form-item[data-ftc-nhan="PPP Password"] input, .el-form-item[data-ftc-nhan="Password"] input');
      const pVal = pInp ? (pInp.value || '').trim() : '';
      if (pVal !== 'd123456') {
        return [{
          selector: '.el-form-item[data-ftc-nhan="PPP Password"] input, .el-form-item[data-ftc-nhan="Password"] input',
          text: 'Bước 11: Nhập Password: d123456',
          position: 'right',
          page: 'network/wan'
        }];
      }

      return [{
        selector: '.el-main button[data-ftc-nut="Apply"]',
        text: 'Bước 12: Bấm Apply',
        position: 'top',
        page: 'network/wan'
      }];
    }

    if (phase === 'wifi') {
      if (!hash.includes('network/wifi')) {
        const isNetOpen = Boolean(doc.querySelector('li.el-submenu.is-opened > .el-submenu__title[data-ftc-menu="Network"]'));
        if (!isNetOpen) {
          return [{
            selector: 'li.el-submenu:not(.is-opened) > .el-submenu__title[data-ftc-menu="Network"]',
            text: 'Bước 13: Chọn Network',
            position: 'right'
          }];
        }
        const isWifiOpen = Boolean(doc.querySelector('li.el-submenu.is-opened li.el-submenu.is-opened > .el-submenu__title[data-ftc-menu="Wi-Fi"]'));
        if (!isWifiOpen) {
          return [{
            selector: 'li.el-submenu.is-opened li.el-submenu:not(.is-opened) > .el-submenu__title[data-ftc-menu="Wi-Fi"], [data-ftc-menu="Wi-Fi"]',
            text: 'Bước 13: Chọn Wi-Fi',
            position: 'right'
          }];
        }
        return [{
          selector: 'li.el-submenu.is-opened li.el-submenu.is-opened li.el-menu-item[data-ftc-menu="Wi-Fi"], [data-ftc-menu="Wi-Fi"]',
          text: 'Bước 13: Chọn Wi-Fi',
          position: 'right'
        }];
      }

      // Đang ở network/wifi: kiểm tra live giá trị
      const sepSw = doc.querySelector('.el-switch[data-ftc-cong-tac="Use separate SSID"], .el-switch[data-ftc-cong-tac*="separate"], .el-switch[data-ftc-cong-tac*="Separate"], .el-form-item[data-ftc-nhan*="separate SSID"] .el-switch, .el-switch:has(.el-switch__label)');
      const isSepOn = Boolean(sepSw && (sepSw.classList.contains('is-checked') || (sepSw.querySelector('input') && sepSw.querySelector('input').checked)));
      if (isSepOn) {
        return [{
          selector: '.el-switch[data-ftc-cong-tac="Use separate SSID"], .el-switch[data-ftc-cong-tac*="separate"], .el-switch[data-ftc-cong-tac*="Separate"], .el-form-item[data-ftc-nhan*="separate SSID"] .el-switch',
          text: 'Bước 14: Tắt Use separate SSID',
          position: 'right',
          page: 'network/wifi'
        }];
      }

      // Ô SSID trên tab Host SSID
      const sInp = doc.querySelector('#pane-hostssid .el-form-item[data-ftc-nhan="SSID"] input, .el-form-item[data-ftc-nhan="SSID"] input');
      const sVal = sInp ? (sInp.value || '').trim() : '';
      if (sVal !== 'FPT Telecom') {
        return [{
          selector: '#pane-hostssid .el-form-item[data-ftc-nhan="SSID"] input, .el-form-item[data-ftc-nhan="SSID"] input',
          text: 'Bước 15: Nhập SSID: FPT Telecom',
          position: 'right',
          page: 'network/wifi'
        }];
      }

      // Ô mật khẩu trên tab Host SSID: Firmware 0.5.3 nhãn chuẩn là 'Passphrase'
      const pwInp = doc.querySelector('#pane-hostssid .el-form-item[data-ftc-nhan="Passphrase"] input, .el-form-item[data-ftc-nhan="Passphrase"] input, .el-form-item[data-ftc-nhan="Password"] input, .el-form-item[data-ftc-nhan="WPA Pre-Shared Key"] input');
      const pwVal = pwInp ? (pwInp.value || '').trim() : '';
      if (pwVal !== 'fpt12345') {
        return [{
          selector: '#pane-hostssid .el-form-item[data-ftc-nhan="Passphrase"] input, .el-form-item[data-ftc-nhan="Passphrase"] input, .el-form-item[data-ftc-nhan="Password"] input',
          text: 'Bước 16: Nhập Password: fpt12345',
          position: 'right',
          page: 'network/wifi'
        }];
      }

      return [{
        selector: '.el-main button[data-ftc-nut="Apply"]',
        text: 'Bước 17: Bấm Apply',
        position: 'top',
        page: 'network/wifi'
      }];
    }

    if (phase === 'topo') {
      if (!hash.includes('status/easymesh') && !hash.includes('status/easymeshtopo')) {
        const isStatusOpen = Boolean(doc.querySelector('li.el-submenu.is-opened > .el-submenu__title[data-ftc-menu="Status"]'));
        if (!isStatusOpen) {
          return [{
            selector: 'li.el-submenu:not(.is-opened) > .el-submenu__title[data-ftc-menu="Status"]',
            text: 'Chọn Status',
            position: 'right'
          }];
        }
        return [{
          selector: 'li.el-submenu.is-opened li.el-menu-item[data-ftc-menu="Easymesh Topo"], li.el-submenu.is-opened li.el-menu-item[data-ftc-menu*="Easymesh"], [data-ftc-menu*="Easymesh"]',
          text: 'Chọn Easymesh Topo',
          position: 'right'
        }];
      }

      return [{
        selector: '.el-table, #topology-table, .easymesh-topo-content, .el-card__body',
        text: 'Bước 23: Kiểm tra Topology và bấm "Nộp bài & Chấm điểm"',
        position: 'top',
        page: 'status/easymesh'
      }];
    }

    return [];
  };

  // Mặc định cho bài 7
  window.TOOLTIPS_AX3000C['LAB_AX3000CV2_07'] = window.TOOLTIPS_AX3000C['LAB_AX3000CV2_07_STEP1'];
})(window.FTC_AX3000C || {
  o: function (nhan) { return '.el-form-item[data-ftc-nhan="' + nhan + '"] input'; },
  nut: function (chu) { return '.el-main button[data-ftc-nut="' + chu + '"]'; }
});
