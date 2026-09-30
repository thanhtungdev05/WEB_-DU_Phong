/**
 * devices/ac1000HI/tooltips/bai10.js - Tooltip Hướng dẫn cho Bài 10: Chặn Web (URL Filter)
 */

if (!window.TOOLTIPS_AC1000HI) window.TOOLTIPS_AC1000HI = {};

window.TOOLTIPS_AC1000HI['LAB_AC1000HI_10'] = [
  // Bước 1: Chọn Access ở Header
  {
    selector: 'a[onclick*="change_access"]',
    text: 'Bước 1: chọn Access',
    position: 'top'
  },
  // Bước 2: Chọn Filter ở Menu bên trái (Nav frame)
  {
    selector: 'a[href*="access_URLfilter.asp"], a[href*="access_ipfilter.asp"]',
    text: 'Bước 2: chọn Filter',
    position: 'top'
  },
  // Bước 3: Chọn URL Filter ở Filter Type Selection
  {
    selector: 'select[name="FILTERTYPE_index"]',
    text: 'Bước 3: chọn URL Filter',
    position: 'right'
  },
  // Bước 4: Chọn Enable ở mục URL Filter Editing Individual active
  {
    selector: 'input[name="SingleRule_active"][value="1"], input[name="SingleRule_active"]',
    text: 'Bước 4: chọn Enable',
    position: 'top'
  },
  // Bước 5: Điền địa chỉ Web muốn chặn
  {
    selector: 'input[name="UrlFilter_URL"]',
    text: 'Bước 5: điền địa chỉ Web muốn chặn ví dụ: https://facebook.com',
    position: 'right'
  },
  // Bước 6: Chọn Save lưu cấu hình
  {
    selector: 'input[name="UrlFilterApply"], input[value="Save"], input[onclick*="doSubmit"], #save, #btnSave, .button1',
    text: 'Bước 6: chọn Save lưu cấu hình',
    position: 'right'
  }
];
