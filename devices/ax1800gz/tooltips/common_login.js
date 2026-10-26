/**
 * devices/ax1800gz/tooltips/common_login.js — Tooltip Đăng nhập chung cho AX1800GZ
 */

if (!window.TOOLTIPS_AX1800GZ) window.TOOLTIPS_AX1800GZ = {};

window.TOOLTIPS_AX1800GZ._common_login = [
  {
    selector: 'input#Frm_Username, input[name="Frm_Username"]',
    text: 'Nhập tên đăng nhập: admin',
    position: 'right'
  },
  {
    selector: 'input#Frm_Password, input[name="Frm_Password"]',
    text: 'Nhập mật khẩu: admin',
    position: 'right'
  },
  {
    selector: '#Btn_login, #LoginId, .loginBtn, input[type="submit"], input[type="button"][value="Login"], input#LoginId, button#LoginId',
    text: 'Nhấn Login để đăng nhập',
    position: 'bottom'
  }
];
