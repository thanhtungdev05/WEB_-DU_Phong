/**
 * devices/ac1000hi/tooltips/bai6.js
 * Bài 6: Cấu hình Port Forwarding trên ONT AC1000HI
 */

if (!window.TOOLTIPS_AC1000HI) window.TOOLTIPS_AC1000HI = {};

window.TOOLTIPS_AC1000HI['LAB_AC1000HI_06'] = [
  {
    selector: 'a[onclick*="change_basic"]',
    text: 'Bước 1: Chọn tab Network',
    position: 'top'
  },
  {
    selector: 'a[href*="adv_nat_top.asp"]',
    text: 'Bước 2: Chọn NAT',
    position: 'top'
  },
  {
    page: 'adv_nat_top',
    selector: 'select[name="NATtyleChange"]',
    text: 'Bước 3: Chọn Virtual Server',
    position: 'right',
    expected: '1'
  },
  {
    page: 'adv_nat_top',
    selector: 'input[name="start_port1"]',
    text: 'Bước 4: Nhập Start External Port (VD: 3389)',
    position: 'right',
    expected: '3389'
  },
  {
    page: 'adv_nat_top',
    selector: 'input[name="end_port1"]',
    text: 'Bước 5: Nhập End External Port (VD: 3389)',
    position: 'right',
    expected: '3389'
  },
  {
    page: 'adv_nat_top',
    selector: 'input[name="Addr1"]',
    text: 'Bước 6: Nhập IP Address (VD: 192.168.1.254)',
    position: 'right',
    expected: '192.168.1.254'
  },
  {
    page: 'adv_nat_top',
    selector: 'input[name="local_sport"]',
    text: 'Bước 7: Nhập Start Internal Port (VD: 3389)',
    position: 'right',
    expected: '3389'
  },
  {
    page: 'adv_nat_top',
    selector: 'input[name="local_eport"]',
    text: 'Bước 8: Nhập End Internal Port (VD: 3389)',
    position: 'right',
    expected: '3389'
  },
  {
    page: 'adv_nat_top',
    selector: 'input[name="AddBtn"], input[value="Add"], input[onclick*="Add_virtualsvr"]',
    text: 'Bước 9: Chọn Add để lưu cấu hình và nộp bài',
    position: 'right'
  }
];

