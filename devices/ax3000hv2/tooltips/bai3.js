if (!window.TOOLTIPS_AX3000HV2) window.TOOLTIPS_AX3000HV2 = {};
window.TOOLTIPS_AX3000HV2['LAB_AX3000HV2_03'] = [
    {
        selector: '#MainMenu a:contains("Network"), a[onclick="change_basic(this);"]',
        text: 'Bước 1: Chọn Network',
        hideOnPage: 'wifi5',
        hideOnUrlIncludes: 'wifi5.asp',
        position: 'top'
    },
    {
        selector: 'a[href*="wifi5.asp"], a:contains("IOT SSID")',
        text: 'Bước 2: Chọn IOT SSID',
        hideOnPage: 'wifi5',
        hideOnUrlIncludes: 'wifi5.asp',
        position: 'top'
    },
    {
        selector: 'input[name="Enable_Wifi5_2G"][value="1"]',
        page: 'wifi5',
        urlIncludes: 'wifi5.asp',
        text: 'Bước 3: Ở mục 2.4G WiFi5, chọn Enable',
        position: 'top'
    },
    {
        selector: 'input[name="wifi5SSid_2G"], #wifi5SSid_2G',
        page: 'wifi5',
        urlIncludes: 'wifi5.asp',
        text: 'Bước 4: Nhập tên Wifi: FPT IoT',
        position: 'right',
        forcePosition: true
    },
    {
        selector: 'input[name="wifi5Pwd_2G"], #wifi5Pwd_2G',
        page: 'wifi5',
        urlIncludes: 'wifi5.asp',
        text: 'Bước 5: Nhập mật khẩu Wifi: fptiot123',
        position: 'right',
        forcePosition: true
    },
    {
        selector: 'input[value="Save"], input[name="SaveBtn"]',
        page: 'wifi5',
        urlIncludes: 'wifi5.asp',
        text: 'Bước 6: Chọn Save',
        position: 'top'
    }
];