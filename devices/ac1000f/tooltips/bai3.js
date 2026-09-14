/**
 * devices/ac1000f/tooltips/bai3.js — Tooltip Hướng dẫn cho Bài 3: Cấu hình Wi-Fi IoT
 */

if (!window.TOOLTIPS_AC1000F) window.TOOLTIPS_AC1000F = {};

window.TOOLTIPS_AC1000F['LAB_AC1000F_03'] = [
  {
    selector: 'a[onclick*="change_bg2"]',
    text: 'Bước 1: Chọn tab Network',
    position: 'top'
  },
  {
    selector: 'a[href*="home_wireless.asp"]',
    text: 'Bước 2: Chọn Wireless 2.4G',
    position: 'top'
  },
  {
    page: 'home_wireless.asp',
    selector: 'select[name="SSID_INDEX"]',
    text: 'Bước 3: Chọn SSID index là 2',
    position: 'right',
    expected: '1'
  },
  {
    page: 'home_wireless.asp',
    selector: 'input[name="ESSID"], input[name="ssid"]',
    text: 'Bước 4: Nhập tên Wifi IoT (VD: FPT Telecom-7EA8)',
    position: 'right',
    expected: 'FPT Telecom-7EA8'
  },
  {
    page: 'home_wireless.asp',
    selector: 'input[name="PreSharedKey1"], input[name="PreSharedKey2"], input[name="PreSharedKey3"], input[name*="PreSharedKey"]',
    text: 'Bước 5: Nhập mật khẩu (VD: 00032934)',
    position: 'right',
    expected: '00032934'
  },
  {
    page: 'home_wireless.asp',
    selector: 'input[name="SaveBtn"], input[value="Save"], input[name="save"], #save, #btnSave, .button1',
    text: 'Bước 6: Chọn Save & Apply',
    position: 'right'
  }
];
