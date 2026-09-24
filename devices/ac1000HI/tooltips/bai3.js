/**
 * devices/ac1000hi/tooltips/bai3.js
 */

if (!window.TOOLTIPS_AC1000HI) window.TOOLTIPS_AC1000HI = {};

window.TOOLTIPS_AC1000HI['LAB_AC1000HI_03'] = [
  // --- CHUNG ---
  {
    hideOnPage: 'home_wireless',
    selector: 'a.other[onclick*="change_basic"], a[onclick*="change_basic"]',
    text: 'Bước 1: Chọn tab Network',
    position: 'top'
  },
  {
    hideOnPage: 'home_wireless',
    selector: 'a.other[href*="home_wireless.asp"]',
    text: 'Bước 2: Chọn Wireless 2.4G',
    position: 'top'
  },

  // --- Cấu hình SSID Index 2 (IoT) ---
  {
    page: 'home_wireless.asp',
    hideOnPage: 'home_wireless_5g.asp',
    selector: 'select[name="SSID_INDEX"]',
    text: 'Bước 3: Đảm bảo chọn SSID index là 2',
    position: 'right',
    forcePosition: true,
    expected: '1'
  },
  {
    page: 'home_wireless.asp',
    hideOnPage: 'home_wireless_5g.asp',
    selector: 'input[name="ESSID"], input[name="ssid"]',
    text: 'Bước 4: Nhập tên Wifi IoT (VD: FPT Telecom_IoT)',
    position: 'right',
    forcePosition: true,
    expected: 'FPT Telecom_IoT'
  },
  {
    page: 'home_wireless.asp',
    hideOnPage: 'home_wireless_5g.asp',
    selector: 'input[name="PreSharedKey3"], input[name="PreSharedKey2"], input[name="PreSharedKey1"], input[name*="PreSharedKey"]',
    text: 'Bước 5: Nhập mật khẩu (VD: fpt12345)',
    position: 'right',
    forcePosition: true,
    expected: 'fpt12345'
  },
  {
    page: 'home_wireless.asp',
    hideOnPage: 'home_wireless_5g.asp',
    selector: 'input[name="BUTTON"][value="Save"], input[name="SaveBtn"], input[value="Save"], #save, #btnSave, .button1',
    text: 'Bước 6: Chọn Save & Apply',
    position: 'right',
    forcePosition: true
  }
];
