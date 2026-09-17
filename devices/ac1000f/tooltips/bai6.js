/**
 * devices/ac1000f/tooltips/bai6.js — Tooltip Hướng dẫn cho Bài 6: Cấu hình Port Forwarding (Virtual Server)
 */

if (!window.TOOLTIPS_AC1000F) window.TOOLTIPS_AC1000F = {};

window.TOOLTIPS_AC1000F['LAB_AC1000F_06'] = [
    // Bước 1: Chọn Network ở Header
    {
        selector: 'a[onclick*="change_bg2"]',
        text: 'Bước 1: Chọn tab Network',
        position: 'top',
        hideOnPage: 'adv_nat_top.asp'
    },
    // Bước 2: Chọn NAT ở Menu bên trái (Nav frame)
    {
        selector: 'a[href*="adv_nat_top.asp"]',
        text: 'Bước 2: Chọn NAT',
        position: 'top',
        hideOnPage: 'adv_nat_top.asp'
    },
    // Bước 3: Chọn Virtual Server ở mục IPv4 NAT Type
    {
        page: 'adv_nat_top.asp',
        selector: 'select[name="NATtyleChange"]',
        text: 'Bước 3: Chọn Virtual Server',
        position: 'right'
    },
    // Bước 4: Nhập port bắt đầu (Start External Port)
    {
        page: 'adv_nat_top.asp',
        selector: 'input[name="start_port1"], #uiViewPvcVpi1',
        text: 'Bước 4: Nhập Start External Port (VD: 3389)',
        position: 'right',
        expected: '3389'
    },
    // Bước 5: Nhập port kết thúc (End External Port)
    {
        page: 'adv_nat_top.asp',
        selector: 'input[name="end_port1"], #uiViewPvcVpi2',
        text: 'Bước 5: Nhập End External Port (VD: 3389)',
        position: 'right',
        expected: '3389'
    },
    // Bước 6: Nhập IP cần NAT (Local IP Address)
    {
        page: 'adv_nat_top.asp',
        selector: 'input[name="Addr1"], #uiViewIpAddressMark',
        text: 'Bước 6: Nhập Local IP (VD: 192.168.1.254)',
        position: 'right',
        expected: '192.168.1.254'
    },
    // Bước 7: Nhập port bắt đầu (Start Internal Port)
    {
        page: 'adv_nat_top.asp',
        selector: 'input[name="local_sport"]',
        text: 'Bước 7: Nhập Start Internal Port (VD: 3389)',
        position: 'right',
        expected: '3389'
    },
    // Bước 8: Nhập port kết thúc (End Internal Port)
    {
        page: 'adv_nat_top.asp',
        selector: 'input[name="local_eport"]',
        text: 'Bước 8: Nhập End Internal Port (VD: 3389)',
        position: 'right',
        expected: '3389'
    },
    // Bước 9: Nhấn Add để lưu cấu hình
    {
        page: 'adv_nat_top.asp',
        selector: 'input[onclick*="Add_virtualsvr"]',
        text: 'Bước 9: Nhấn Add để lưu cấu hình',
        position: 'right'
    }
];