/**
 * devices/ac1000f/tooltips/bai6.js — Tooltip Hướng dẫn cho Bài 6: Cấu hình Port Forwarding (Virtual Server)
 */

if (!window.TOOLTIPS_AC1000F) window.TOOLTIPS_AC1000F = {};

window.TOOLTIPS_AC1000F['LAB_AC1000F_06'] = [
    // Bước 1: Chọn Network ở Header
    {
        selector: 'a[onclick*="change_bg2"]',
        text: 'Bước 1: chọn Network',
        position: 'top'
    },
    // Bước 2: Chọn NAT ở Menu bên trái (Nav frame)
    {
        selector: 'a[href*="adv_nat_top.asp"]',
        text: 'Bước 2: chọn NAT',
        position: 'top'
    },
    // Bước 3: Chọn Virtual Server ở mục IPv4 NAT Type
    {
        selector: 'select[name="NATtyleChange"]',
        text: 'Bước 3: chọn Virtual Server',
        position: 'right'
    },
    // Bước 4: Nhập port bắt đầu (Start External Port)
    {
        selector: 'input[name="start_port1"], #uiViewPvcVpi1',
        text: 'Bước 4: nhập port bắt đầu, ví dụ 3389',
        position: 'right'
    },
    // Bước 5: Nhập port kết thúc (End External Port)
    {
        selector: 'input[name="end_port1"], #uiViewPvcVpi2',
        text: 'Bước 5: nhập port kết thúc, ví dụ 3389',
        position: 'right'
    },
    // Bước 6: Nhập IP cần NAT (Local IP Address)
    {
        selector: 'input[name="Addr1"], #uiViewIpAddressMark',
        text: 'Bước 6: nhập IP cần NAT, ví dụ 192.168.1.254',
        position: 'right'
    },
    // Bước 7: Nhập port bắt đầu (Start Internal Port)
    {
        selector: 'input[name="local_sport"]',
        text: 'Bước 7: nhập port bắt đầu, ví dụ 3389',
        position: 'right'
    },
    // Bước 8: Nhập port kết thúc (End Internal Port)
    {
        selector: 'input[name="local_eport"]',
        text: 'Bước 8: nhập port kết thúc, ví dụ 3389',
        position: 'right'
    },
    // Bước 9: Nhấn Add để lưu cấu hình
    {
        selector: 'input[name="AddBtn"], input[value="Add"], input[onclick*="Add_virtualsvr"]',
        text: 'Bước 9: nhấn Add để lưu cấu hình',
        position: 'right'
    }
];