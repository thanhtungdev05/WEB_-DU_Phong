if (!window.TOOLTIPS_AX3000HV2) window.TOOLTIPS_AX3000HV2 = {};
window.TOOLTIPS_AX3000HV2['LAB_AX3000HV2_03'] = [
    {
        selector: '#MainMenu a:contains("Network")',
        text: 'Bước 1: Chọn Network',
        position: 'top'
    },
    {
        selector: 'a[href*="wifi5.asp"], a:contains("IOT SSID")',
        text: 'Bước 2: Chọn IOT SSID',
        hideOnUrlIncludes: 'wifi5.asp',
        position: 'top'
    },
    {
        selector: 'input[name="Enable_Wifi5_2G"][value="1"]',
        urlIncludes: 'wifi5.asp',
        text: 'Bước 3: Chọn Enable',
        position: 'top'
    },
    {
        selector: 'input[name="wifi5SSid_2G"], #wifi5SSid_2G',
        urlIncludes: 'wifi5.asp',
        text: 'Bước 4: Nhập tên Wifi: FPT IoT',
        position: 'right',
        forcePosition: true
    },
    {
        selector: 'input[name="wifi5Pwd_2G"], #wifi5Pwd_2G',
        urlIncludes: 'wifi5.asp',
        text: 'Bước 5: Nhập mật khẩu Wifi: fptiot123',
        position: 'right',
        forcePosition: true
    },
    {
        selector: 'input[name="Enable_Wifi5_5G"][value="1"]',
        urlIncludes: 'wifi5.asp',
        text: 'Bước 6: Chọn Enable 5G',
        position: 'top'
    },
    {
        selector: 'input[name="wifi5SSid_5G"], #wifi5SSid_5G',
        urlIncludes: 'wifi5.asp',
        text: 'Bước 7: Nhập tên Wifi 5G: FPT IoT',
        position: 'right',
        forcePosition: true
    },
    {
        selector: 'input[name="wifi5Pwd_5G"], #wifi5Pwd_5G',
        urlIncludes: 'wifi5.asp',
        text: 'Bước 8: Nhập mật khẩu Wifi 5G: fptiot123',
        position: 'right',
        forcePosition: true
    },
    {
        selector: 'input[value="Save"], input[name="SaveBtn"]',
        urlIncludes: 'wifi5.asp',
        text: 'Bước 9: Chọn Save',
        position: 'top'
    }
];