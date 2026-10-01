/**
 * devices/ac1000HI/tooltips/bai8.js - Tooltip Hướng dẫn cho Bài 8: WiFi Timer
 */

if (!window.TOOLTIPS_AC1000HI) window.TOOLTIPS_AC1000HI = {};

window.TOOLTIPS_AC1000HI['LAB_AC1000HI_08'] = [
  // Bước 1: Chọn Maintenance ở Header
  {
    selector: 'a[onclick*="change_maint"]',
    text: 'Bước 1: chọn Maintenance',
    position: 'top'
  },
  // Bước 2: Chọn WiFi Timer ở Menu bên trái (Nav frame)
  {
    selector: 'a[href*="tools_wifitimer.asp"]',
    text: 'Bước 2: chọn WiFi Timer',
    position: 'top'
  },
  // Bước 3: Chọn Enable ở mục WiFi Timer Status
  {
    selector: 'input[name="wifitimer_enable"][value="1"], input[name="wifitimer_enable"]',
    text: 'Bước 3: chọn Enable',
    position: 'top'
  },
  // Bước 4: Nhập thời gian bắt đầu phát Wifi
  {
    selector: 'input[name="starttime"]',
    text: 'Bước 4: nhập thời gian bắt đầu phát Wifi, ví dụ 8:00',
    position: 'right'
  },
  // Bước 5: Nhập thời gian kết thúc phát Wifi
  {
    selector: 'input[name="endtime"]',
    text: 'Bước 5: nhập thời gian kết thúc phát Wifi, ví dụ 17:00',
    position: 'right'
  },
  // Bước 6: Chọn ngày trong tuần phát Wifi
  {
    selector: 'input[name="fri"]',
    text: 'Bước 6: chọn ngày trong tuần phát Wifi, ví dụ thứ 2, 3, 4, 5, 6',
    position: 'bottom'
  },
  // Bước 7: Chọn Save lưu cấu hình
  {
    selector: 'input[name="SaveBtn"], input[value="Save"], input[onclick*="uiSave"], #save, #btnSave, .button1',
    text: 'Bước 7: chọn Save lưu cấu hình',
    position: 'right'
  }
];
