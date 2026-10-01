/**
 * devices/be12000/tooltips/bai1.js
 * Tooltips cho Bài 1: Cấu hình PPPoE
 */

if (!window.TOOLTIPS_BE12000) window.TOOLTIPS_BE12000 = {};

window.TOOLTIPS_BE12000['LAB_BE12000_01'] = [
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
    selector: '#Internet_container:not(:has([id^="template_Internet_"])) #addInstBar_Internet, #addInstBar_Internet',
    text: 'Bước 3: Chọn Create New Item',
    position: 'bottom'
  },
  {
    selector: '#WANCName:not(:disabled), input[id^="WANCName"]:not(:disabled)',
    text: 'Bước 4: Nhập Connection Name: FPT',
    position: 'right',
    expected: 'FPT'
  },
  {
    selector: '#UserName:not(:disabled), input[id^="UserName"]:not(:disabled)',
    text: 'Bước 5: Nhập Username: hnfdl-123456-789',
    position: 'right',
    expected: 'hnfdl-123456-789'
  },
  {
    selector: '#Password:not(:disabled), input[id^="Password"]:not(:disabled)',
    text: 'Bước 6: Nhập Password: d123456',
    position: 'right',
    expected: 'd123456'
  },
  {
    selector: '#Btn_apply_internet:not(.disableBtn), .Btn_apply:not(.disableBtn)',
    text: 'Bước 7: Nhấn Apply để lưu cấu hình',
    position: 'top'
  }
];
