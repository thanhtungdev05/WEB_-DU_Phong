/**
 * devices/be12000/tooltips/bai1.js
 * Tooltips cho Bài 1: Cấu hình PPPoE
 */

if (!window.TOOLTIPS_BE12000) window.TOOLTIPS_BE12000 = {};

window.TOOLTIPS_BE12000['LAB_BE12000_01'] = [
  {
    selector: '#internet:not(.SelectMenuItem)',
    text: 'Chọn Internet',
    position: 'bottom'
  },
  {
    selector: '#internetConfig:not(.selectClass2Menu)',
    text: 'Chọn WAN',
    position: 'right'
  },
  {
    selector: '#addInstBar_Internet',
    text: 'Chọn Create New Item',
    position: 'bottom'
  },
  {
    selector: '#UserName:not(:disabled), input[id^="UserName"]:not(:disabled)',
    text: 'Bước 1: Nhập Username: hnfdl-123456-789',
    position: 'right',
    expected: 'hnfdl-123456-789'
  },
  {
    selector: '#Password:not(:disabled), input[id^="Password"]:not(:disabled)',
    text: 'Bước 2: Nhập Password: d123456',
    position: 'right',
    expected: 'd123456'
  },
  {
    selector: '#Btn_apply_internet:not(.disableBtn), .Btn_apply:not(.disableBtn)',
    text: 'Chọn Apply để lưu cấu hình',
    position: 'top'
  }
];
