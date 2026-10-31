if (!window.TOOLTIPS_AX3000HV2) window.TOOLTIPS_AX3000HV2 = {};

function isWifi52GEnabled(doc) {
    var en = doc.querySelector('input[name="Enable_Wifi5_2G"][value="1"]');
    return Boolean(en && en.checked);
}

function isWifi52GSsidDone(doc) {
    var el = doc.querySelector('input[name="wifi5SSid_2G"], #wifi5SSid_2G');
    var val = el ? String(el.value || '').trim() : '';
    return val.toLowerCase() === 'fpt iot';
}

function isWifi52GPwdDone(doc) {
    var el = doc.querySelector('input[name="wifi5Pwd_2G"], #wifi5Pwd_2G');
    var val = el ? String(el.value || '').trim() : '';
    return val === 'fptiot123';
}

function isWifi5Saved(doc) {
    return Boolean(doc._ftcIsSaved || (doc.location && doc.location.search && doc.location.search.includes('save_success=1')));
}

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
        position: 'top',
        condition: function (doc) {
            return !isWifi52GEnabled(doc);
        }
    },
    {
        selector: 'input[name="wifi5SSid_2G"], #wifi5SSid_2G',
        page: 'wifi5',
        urlIncludes: 'wifi5.asp',
        text: 'Bước 4: Nhập tên Wifi: FPT IoT',
        position: 'right',
        forcePosition: true,
        condition: function (doc) {
            return isWifi52GEnabled(doc) && !isWifi52GSsidDone(doc);
        }
    },
    {
        selector: 'input[name="wifi5Pwd_2G"], #wifi5Pwd_2G',
        page: 'wifi5',
        urlIncludes: 'wifi5.asp',
        text: 'Bước 5: Nhập mật khẩu Wifi: fptiot123',
        position: 'right',
        forcePosition: true,
        condition: function (doc) {
            return isWifi52GEnabled(doc) && isWifi52GSsidDone(doc) && !isWifi52GPwdDone(doc);
        }
    },
    {
        selector: 'input[value="Save"], input[name="SaveBtn"]',
        page: 'wifi5',
        urlIncludes: 'wifi5.asp',
        text: 'Bước 6: Chọn Save',
        position: 'top',
        hideWhenSaved: true,
        condition: function (doc) {
            return isWifi52GEnabled(doc) && isWifi52GSsidDone(doc) && isWifi52GPwdDone(doc) && !isWifi5Saved(doc);
        }
    }
];
