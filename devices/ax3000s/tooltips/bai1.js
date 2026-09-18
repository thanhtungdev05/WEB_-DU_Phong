/**
 * devices/ax3000s/tooltips/bai1.js — Tooltip Hướng dẫn cho Bài 1: Cấu hình PPPoE
 */

if (!window.TOOLTIPS_AX3000S) window.TOOLTIPS_AX3000S = {};

window.TOOLTIPS_AX3000S['LAB_AX3000S_01'] = [
    // Chọn Network
    {
        selector: "#Sky_Network li, #Sky_Network span, #Sky_Network, #nav-layer1 a[href*='/network'] li, a[href*='/network'] span, a[href*='/network']",
        text: 'Bước 1: Chọn Network',
        position: 'bottom',
        hideOnPage: 'wancfg'
    },
    // Chọn WAN Configuration
    {
        selector: "a[href*='/wancfg'], #Sky_WAN_Configuration .dt, #Sky_WAN_Configuration, #layer2-leaf-wancfg",
        text: 'Bước 2: Chọn WAN Configuration',
        position: 'right'
    },
    // Chọn Add
    {
        selector: '#btn_add',
        text: 'Bước 3: Chọn Add',
        position: 'bottom',
        page: 'wancfg'
    },
    // Chọn PPPoE
    {
        selector: 'input[value="pppoe"], #pppoeMode, label[for="ipprotopppoe"]',
        text: 'Bước 4: Chọn PPPoE',
        position: 'top',
        page: 'wancfg'
    },
    // Điền Username: hnfdl-123456-789
    {
        selector: 'input[name="userName"], #userName',
        text: 'Bước 5: Điền Username: hnfdl-123456-789',
        position: 'right',
        page: 'wancfg',
        expected: 'hnfdl-123456-789'
    },
    // Điền Password: d123456
    {
        selector: 'input[name="uPsd"], #uPsd',
        text: 'Bước 6: Điền Password: d123456',
        position: 'right',
        page: 'wancfg',
        expected: 'd123456'
    },
    // Nhấn Save & Apply
    {
        selector: '#Sky_Apply',
        text: 'Bước 7: Nhấn Save & Apply',
        position: 'top',
        page: 'wancfg'
    }
];

