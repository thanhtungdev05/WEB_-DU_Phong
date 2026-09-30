/**
 * devices/ac1000HI/tooltips/bai7.js - Tooltip Hướng dẫn cho Bài 7: Backup/Restore file cấu hình
 */

if (!window.TOOLTIPS_AC1000HI) window.TOOLTIPS_AC1000HI = {};

window.TOOLTIPS_AC1000HI['LAB_AC1000HI_07'] = [
  // Bước 1: Chọn Maintenance ở Header
  {
    selector: 'a[onclick*="change_maint"]',
    text: 'Bước 1: chọn Maintenance',
    position: 'top'
  },
  // Bước 2: Chọn Firmware ở Menu bên trái (Nav frame)
  {
    selector: 'a[href*="tools_update.asp"]',
    text: 'Bước 2: chọn Firmware',
    position: 'top'
  },
  // Bước 3: Chọn Download để tải file cấu hình
  {
    selector: 'input[value="Download"], input[onclick*="backup_settings"]',
    text: 'Bước 3: chọn Download để tải file cấu hình',
    position: 'right'
  },
  // Bước 4: Chọn Browse để chọn file cấu hình bạn đang có
  {
    selector: 'label[for="xFile0"], input[name="tools_FW_UploadFile0"], #xFile0',
    text: 'Bước 4: chọn Browse để chọn file cấu hình bạn đang có',
    position: 'right'
  },
  // Bước 5: Chọn Restore để cập nhật file cấu hình này
  {
    selector: 'input[value="Restore"], input[onclick*="uiDoUpdate0"]',
    text: 'Bước 5: chọn Restore để cập nhật file cấu hình này',
    position: 'right'
  }
];
