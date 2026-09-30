/**
 * devices/ac1000HI/tooltips/bai9.js - Tooltip Hướng dẫn cho Bài 9: Reboot Timer
 */

if (!window.TOOLTIPS_AC1000HI) window.TOOLTIPS_AC1000HI = {};

window.TOOLTIPS_AC1000HI['LAB_AC1000HI_09'] = [
  // Bước 1: Chọn Maintenance ở Header
  {
    selector: 'a[onclick*="change_maint"]',
    text: 'Bước 1: chọn Maintenance',
    position: 'top'
  },
  // Bước 2: Chọn Reboot Timer ở Menu bên trái (Nav frame)
  {
    selector: 'a[href*="tools_reboottimer.asp"]',
    text: 'Bước 2: chọn Reboot Timer',
    position: 'top'
  },
  // Bước 3: Chọn Enable ở mục Reboot Timer Status
  {
    selector: 'input[name="reboottimer_enable"][value="1"], input[name="reboottimer_enable"]',
    text: 'Bước 3: chọn Enable',
    position: 'top'
  },
  // Bước 4: Chọn thời gian khởi động
  {
    selector: 'input[name="time"]',
    text: 'Bước 4: chọn thời gian khởi động, ví dụ 3:00',
    position: 'right'
  },
  // Bước 5: Chọn ngày trong tuần khởi động
  {
    selector: 'input[name="fri"]',
    text: 'Bước 5: chọn ngày trong tuần khởi động, ví dụ thứ 2, 4, 6',
    position: 'bottom'
  },
  // Bước 6: Chọn Save lưu cấu hình
  {
    selector: 'input[name="SaveBtn"], input[value="Save"], input[onclick*="uiSave"], #save, #btnSave, .button1',
    text: 'Bước 6: chọn Save lưu cấu hình',
    position: 'right'
  }
];
