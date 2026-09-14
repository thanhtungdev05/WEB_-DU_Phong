/**
 * devices/be15000/tooltips/common_login.js
 * Tooltip đăng nhập chung cho BE15000
 */

if (!window.TOOLTIPS_BE15000) window.TOOLTIPS_BE15000 = {};

window.TOOLTIPS_BE15000._common_login = [
  {
    selector: 'input#Frm_Username, input[name="Frm_Username"]',
    text: 'Nhập Username: admin',
    position: 'right'
  },
  {
    selector: 'input#Frm_Password, input[name="Frm_Password"]',
    text: 'Nhập Password: admin',
    position: 'right'
  },
  {
    selector: '#LoginId, input[type="button"].login',
    text: 'Bấm Login để đăng nhập vào thiết bị',
    position: 'bottom'
  }
];
