/**
 * devices/ax1800gz/tooltips/bai1.js
 * Tooltips cho Bài 1: Cấu hình PPPoE trên ONT AX1800GZ
 */

if (!window.TOOLTIPS_AX1800GZ) window.TOOLTIPS_AX1800GZ = {};

window.TOOLTIPS_AX1800GZ['LAB_AX1800GZ_01'] = [
  {
    selector: '#internet:not(.SelectMenuItem)',
    text: 'Bước 1: Chọn Internet',
    position: 'bottom'
  },
  {
    selector: '#internetConfig:not(.selectClass2Menu)',
    text: 'Bước 2: Chọn WAN',
    position: 'right'
  },
  {
    selector: '#template_Internet_0 .collapsibleInst:not(.instNameExp), [id^="instName_Internet"]:not(.instNameExp)',
    text: 'Bước 3: Nhấn vào internet_tr069',
    position: 'bottom',
    condition: function (doc) {
      const t = doc.querySelector('#template_Internet_0 .collapsibleInst, [id^="instName_Internet"]');
      return !t || !t.classList.contains('instNameExp');
    }
  },
  {
    selector: '[id^="UserName"]:not(:disabled), input[name^="UserName"]:not(:disabled)',
    text: 'Bước 4: Nhập Username: hnfdl-123456-789',
    position: 'right',
    expected: 'hnfdl-123456-789',
    condition: function (doc) {
      const el = doc.querySelector('[id^="UserName"]:not(:disabled), input[name^="UserName"]:not(:disabled)');
      return !el || el.value.trim() !== 'hnfdl-123456-789';
    }
  },
  {
    selector: '[id^="Password"]:not(:disabled), input[name^="Password"]:not(:disabled)',
    text: 'Bước 5: Nhập Password: d123456',
    position: 'right',
    expected: 'd123456',
    condition: function (doc) {
      const u = doc.querySelector('[id^="UserName"]:not(:disabled), input[name^="UserName"]:not(:disabled)');
      const p = doc.querySelector('[id^="Password"]:not(:disabled), input[name^="Password"]:not(:disabled)');
      return (!u || u.value.trim() === 'hnfdl-123456-789') && (!p || p.value.trim() !== 'd123456');
    }
  },
  {
    selector: '[id^="Btn_apply_internet"]:not(.disableBtn), #template_Internet_0 .Btn_apply:not(.disableBtn), .Btn_apply:not(.disableBtn)',
    text: 'Bước 6: Nhấn Apply để lưu cấu hình',
    position: 'top',
    condition: function (doc) {
      const u = doc.querySelector('[id^="UserName"]:not(:disabled), input[name^="UserName"]:not(:disabled)');
      const p = doc.querySelector('[id^="Password"]:not(:disabled), input[name^="Password"]:not(:disabled)');
      return !!(u && u.value.trim() === 'hnfdl-123456-789' && p && p.value.trim() === 'd123456');
    }
  }
];
