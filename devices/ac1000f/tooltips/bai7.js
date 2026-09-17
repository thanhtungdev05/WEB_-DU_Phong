/**
 * devices/ac1000f/tooltips/bai7.js — Tooltip Hướng dẫn cho Bài 7: Backup/Restore file cấu hình
 */

if (!window.TOOLTIPS_AC1000F) window.TOOLTIPS_AC1000F = {};

window.TOOLTIPS_AC1000F['LAB_AC1000F_07'] = [
  // Bước 1: Chọn Maintenance ở Header
  {
    selector: 'a[onclick*="change_bg5"]',
    text: 'Bước 1: Chọn tab Maintenance',
    position: 'top',
    hideOnPage: 'tools_update.asp'
  },
  // Bước 2: Chọn Firmware ở Menu bên trái (Nav frame)
  {
    selector: 'a[href*="tools_update.asp"]',
    text: 'Bước 2: Chọn Firmware',
    position: 'top',
    hideOnPage: 'tools_update.asp'
  },
  // Bước 3: Chọn Download để tải file cấu hình
  {
    page: 'tools_update.asp',
    selector: 'input[value="Download"], input[onclick*="backup_settings"]',
    text: 'Bước 3: Chọn Download để tải file cấu hình',
    position: 'right'
  },
  // Bước 4: Chọn Browse để chọn file cấu hình bạn đang có
  {
    page: 'tools_update.asp',
    selector: 'label[for="xFile0"], input[name="tools_FW_UploadFile0"], #xFile0',
    text: 'Bước 4: Chọn Browse để chọn file cấu hình bạn đang có',
    position: 'right'
  },
  // Bước 5: Chọn Restore để cập nhật file cấu hình này
  {
    page: 'tools_update.asp',
    selector: 'input[value="Restore"], input[onclick*="uiDoUpdate0"]',
    text: 'Bước 5: Chọn Restore để cập nhật file cấu hình này',
    position: 'right'
  }
];
