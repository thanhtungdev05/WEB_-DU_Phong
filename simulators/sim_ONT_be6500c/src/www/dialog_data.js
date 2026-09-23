/* Markup hop thoai THAT cua ONT-BE6500C, chup truc tiep tu thiet bi
   192.168.1.1 ngay 2026-08-12 (xem reference/source/dialog_*.html).
   KHONG SUA TAY -- day la .outerHTML that cua .MuiDialog-paper, dan
   nguyen van vao day.

   CHU Y: chi co phan PAPER (noi dung hop thoai) duoc chup; phan bao ngoai
   (.MuiDialog-root / backdrop / sentinel) la cau truc MUI Modal CHUAN,
   khong doi giua cac hop thoai -- nav.js/dialog_binding.js se boc paper
   vao khung nay luc hien (giong cach devices/be6500c/src/www/wifi_api.js
   da lam va duoc xac nhan dung). */
window.__DIALOG = {
  reboot_confirm:
    '<h2 class="MuiTypography-root MuiTypography-h6 MuiDialogTitle-root css-4qavkk" id=":rg:">Are you sure you want to reboot your router?</h2><div class="MuiDialogContent-root css-zkijn5"><p class="MuiTypography-root MuiTypography-body2 css-s8etqm">Your Internet access will be unavailable for a minute or two while the system restarts.</p></div><div class="MuiDialogActions-root MuiDialogActions-spacing css-kvke90"><button class="MuiButtonBase-root MuiButton-root MuiButton-text MuiButton-textPrimary MuiButton-sizeSmall MuiButton-textSizeSmall MuiButton-colorPrimary MuiButton-root MuiButton-text MuiButton-textPrimary MuiButton-sizeSmall MuiButton-textSizeSmall MuiButton-colorPrimary css-ygftgi dlg-huy" tabindex="0" type="button">Cancel<span class="MuiTouchRipple-root css-w0pj6f"></span></button><button class="MuiButtonBase-root MuiButton-root MuiButton-text MuiButton-textPrimary MuiButton-sizeSmall MuiButton-textSizeSmall MuiButton-colorPrimary MuiButton-root MuiButton-text MuiButton-textPrimary MuiButton-sizeSmall MuiButton-textSizeSmall MuiButton-colorPrimary css-1eot1p5 dlg-tieptuc" tabindex="0" type="button">Reboot Now<span class="MuiTouchRipple-root css-w0pj6f"></span></button></div>',

  wifi_save:
    '<h2 class="MuiTypography-root MuiTypography-subtitle1 MuiDialogTitle-root css-18acnr3" id="alert-dialog-title">Before we continue...</h2><div class="MuiDialogContent-root css-1t6ynxd"><p class="MuiTypography-root MuiDialogContentText-root MuiTypography-body2 MuiDialogContentText-root css-1j29giz">To apply changes, Wi-Fi will restart and Wi-Fi-connected devices will briefly lose connection for a few seconds.</p></div><div class="MuiDialogActions-root MuiDialogActions-spacing css-kvke90"><button class="MuiButtonBase-root MuiButton-root MuiButton-text MuiButton-textPrimary MuiButton-sizeMedium MuiButton-textSizeMedium MuiButton-colorPrimary MuiButton-root MuiButton-text MuiButton-textPrimary MuiButton-sizeMedium MuiButton-textSizeMedium MuiButton-colorPrimary css-bbmok2 dlg-huy" tabindex="0" type="button">Cancel<span class="MuiTouchRipple-root css-w0pj6f"></span></button><button class="MuiButtonBase-root MuiButton-root MuiButton-text MuiButton-textPrimary MuiButton-sizeMedium MuiButton-textSizeMedium MuiButton-colorPrimary MuiButton-root MuiButton-text MuiButton-textPrimary MuiButton-sizeMedium MuiButton-textSizeMedium MuiButton-colorPrimary css-bbmok2 dlg-tieptuc" tabindex="0" type="button">Continue<span class="MuiTouchRipple-root css-w0pj6f"></span></button></div>',

  /* Chup GD4 (2026-08-13) tren trang Advanced > Static Routing that, luc
     bam nut Delete cua mot dong bang (icon thung rac). Dung CHUNG cho moi
     bang co dong: Port Forwarding, Static Routing IPv4/IPv6 -- xac nhan
     bang doc ma goc (RuleList-Ce4Vxx8G.js): ca hai trang deu goi chung
     mot ham confirm({okText:'Delete', title:'Are you sure to delete the
     selected item(s)?', message:'This action cannot be undone.'}). */
  delete_confirm:
    '<h2 class="MuiTypography-root MuiTypography-h6 MuiDialogTitle-root css-1hftikr" id=":r14:">Are you sure to delete the selected item(s)?</h2><div class="MuiDialogContent-root css-19i32em"><p class="MuiTypography-root MuiDialogContentText-root MuiTypography-body1 MuiDialogContentText-root css-1vl1q01">This action cannot be undone.</p></div><div class="MuiDialogActions-root MuiDialogActions-spacing css-kvke90"><button class="MuiButtonBase-root MuiButton-root MuiButton-text MuiButton-textPrimary MuiButton-sizeMedium MuiButton-textSizeMedium MuiButton-colorPrimary MuiButton-root MuiButton-text MuiButton-textPrimary MuiButton-sizeMedium MuiButton-textSizeMedium MuiButton-colorPrimary css-bbmok2 dlg-huy" tabindex="0" type="button">CANCEL<span class="MuiTouchRipple-root css-w0pj6f"></span></button><button class="MuiButtonBase-root MuiButton-root MuiButton-text MuiButton-textPrimary MuiButton-sizeMedium MuiButton-textSizeMedium MuiButton-colorPrimary MuiButton-root MuiButton-text MuiButton-textPrimary MuiButton-sizeMedium MuiButton-textSizeMedium MuiButton-colorPrimary css-bbmok2 dlg-tieptuc" tabindex="0" type="button">Delete<span class="MuiTouchRipple-root css-w0pj6f"></span></button></div>'
};

/* Hop thoai BIEU MAU (Add/Edit) -- KHAC voi __DIALOG o tren: luu ca PAPER
   (ke ca lop MuiDialog-paperWidthMd/Sm rieng cua tung hop thoai, vi kich
   thuoc hai hop thoai nay KHAC voi hop thoai xac nhan 2 nut). Chup truc
   tiep tren thiet bi that ngay 2026-08-13 (xem reference/source/
   dialog_portforward_add.html, dialog_routing_add.html). */
window.__DIALOG_FORM = {
  dialog_portforward_add:
    '<div class="MuiPaper-root MuiPaper-elevation MuiPaper-rounded MuiPaper-elevation24 MuiDialog-paper MuiDialog-paperScrollPaper MuiDialog-paperWidthMd MuiDialog-paperFullWidth css-vfu3if" role="dialog" aria-labelledby=":r3q:"><form class="css-1w5zf2q"><div class="MuiStack-root MuiTypography-root MuiTypography-h6 MuiDialogTitle-root css-1u6x2d2" id=":r3q:"><div class="panel"><button class="MuiButtonBase-root MuiIconButton-root MuiIconButton-sizeMedium css-1g58lic" tabindex="0" type="button"><svg class="MuiSvgIcon-root MuiSvgIcon-fontSizeMedium css-vubbuv" focusable="false" aria-hidden="true" viewBox="0 0 24 24" data-testid="CloseOutlinedIcon"><path d="M19 6.41 17.59 5 12 10.59 6.41 5 5 6.41 10.59 12 5 17.59 6.41 19 12 13.41 17.59 19 19 17.59 13.41 12z"></path></svg><span class="MuiTouchRipple-root css-w0pj6f"></span></button></div><h6 class="MuiTypography-root MuiTypography-h6 css-1b8el57">Add New</h6></div><div class="MuiDialogContent-root css-2jhhau"><div class="MuiStack-root css-yd8sa2"><label class="MuiFormControlLabel-root MuiFormControlLabel-labelPlacementEnd fullWidth css-dxboj2"><span class="MuiSwitch-root MuiSwitch-sizeMedium css-cd971p"><span class="MuiButtonBase-root MuiSwitch-switchBase MuiSwitch-colorSuccess Mui-checked PrivateSwitchBase-root MuiSwitch-switchBase MuiSwitch-colorSuccess Mui-checked Mui-checked css-mgpbom"><input class="PrivateSwitchBase-input MuiSwitch-input css-1m9pwf3" name="enabled" type="checkbox" value="true" checked=""><span class="MuiSwitch-thumb css-1rq3hts"></span><span class="MuiTouchRipple-root css-w0pj6f"></span></span><span class="MuiSwitch-track css-1ju1kxc"></span></span><span class="MuiTypography-root MuiTypography-subtitle3 MuiFormControlLabel-label css-1dao2k">Enable</span></label><div class="MuiFormControl-root MuiFormControl-fullWidth MuiTextField-root css-117wux8"><label class="MuiFormLabel-root MuiInputLabel-root MuiInputLabel-formControl MuiInputLabel-animated MuiInputLabel-sizeMedium MuiInputLabel-outlined MuiFormLabel-colorPrimary MuiInputLabel-root MuiInputLabel-formControl MuiInputLabel-animated MuiInputLabel-sizeMedium MuiInputLabel-outlined css-4mi22k" data-shrink="false" for=":r3s:" id=":r3s:-label">Name</label><div class="MuiInputBase-root MuiOutlinedInput-root MuiInputBase-colorPrimary MuiInputBase-fullWidth MuiInputBase-formControl css-190ak7x"><input aria-invalid="false" id=":r3s:" name="name" type="text" class="MuiInputBase-input MuiOutlinedInput-input css-1x5jdmq" value=""><fieldset aria-hidden="true" class="MuiOutlinedInput-notchedOutline css-igs3ac"><legend class="css-yjsfm1"><span>Name</span></legend></fieldset></div></div><div class="MuiStack-root css-lgk7oi"><div class="MuiFormControl-root MuiFormControl-fullWidth css-feqhe6"><label class="MuiFormLabel-root MuiInputLabel-root MuiInputLabel-formControl MuiInputLabel-animated MuiInputLabel-sizeMedium MuiInputLabel-outlined MuiFormLabel-colorPrimary MuiInputLabel-root MuiInputLabel-formControl MuiInputLabel-animated MuiInputLabel-sizeMedium MuiInputLabel-outlined css-4mi22k" data-shrink="false">Protocol</label><div class="MuiInputBase-root MuiOutlinedInput-root MuiInputBase-colorPrimary MuiInputBase-formControl css-ixhvle"><div tabindex="0" role="combobox" aria-controls=":r3t:" aria-expanded="false" aria-haspopup="listbox" aria-labelledby="mui-component-select-protocol" id="mui-component-select-protocol" class="MuiSelect-select MuiSelect-outlined MuiInputBase-input MuiOutlinedInput-input css-2wbphm"><span class="notranslate">​</span></div><input aria-invalid="false" name="protocol" aria-hidden="true" tabindex="-1" class="MuiSelect-nativeInput css-1k3x8v3" value=""><svg class="MuiSvgIcon-root MuiSvgIcon-fontSizeMedium MuiSelect-icon MuiSelect-iconOutlined css-sio56" focusable="false" aria-hidden="true" viewBox="0 0 24 24" data-testid="ArrowDropDownIcon"><path d="M7 10l5 5 5-5z"></path></svg><fieldset aria-hidden="true" class="MuiOutlinedInput-notchedOutline css-igs3ac"><legend class="css-yjsfm1"><span>Protocol</span></legend></fieldset></div></div><div class="MuiFormControl-root MuiFormControl-fullWidth MuiTextField-root css-117wux8"><label class="MuiFormLabel-root MuiInputLabel-root MuiInputLabel-formControl MuiInputLabel-animated MuiInputLabel-sizeMedium MuiInputLabel-outlined MuiFormLabel-colorPrimary MuiInputLabel-root MuiInputLabel-formControl MuiInputLabel-animated MuiInputLabel-sizeMedium MuiInputLabel-outlined css-4mi22k" data-shrink="false" for=":r3u:" id=":r3u:-label">External Port (e.g., 100 or 100-255)</label><div class="MuiInputBase-root MuiOutlinedInput-root MuiInputBase-colorPrimary MuiInputBase-fullWidth MuiInputBase-formControl css-190ak7x"><input aria-invalid="false" id=":r3u:" name="source.portRange" type="text" maxlength="11" class="MuiInputBase-input MuiOutlinedInput-input css-1x5jdmq" value=""><fieldset aria-hidden="true" class="MuiOutlinedInput-notchedOutline css-igs3ac"><legend class="css-yjsfm1"><span>External Port (e.g., 100 or 100-255)</span></legend></fieldset></div></div></div><div class="MuiStack-root css-lgk7oi"><div class="MuiAutocomplete-root MuiAutocomplete-hasPopupIcon css-xfnhxk"><div class="MuiFormControl-root MuiFormControl-fullWidth MuiTextField-root css-1pzl6jj"><label class="MuiFormLabel-root MuiInputLabel-root MuiInputLabel-formControl MuiInputLabel-animated MuiInputLabel-sizeMedium MuiInputLabel-outlined MuiFormLabel-colorPrimary MuiInputLabel-root MuiInputLabel-formControl MuiInputLabel-animated MuiInputLabel-sizeMedium MuiInputLabel-outlined css-4mi22k" data-shrink="false" for=":r3v:" id=":r3v:-label">Device / IP</label><div class="MuiInputBase-root MuiOutlinedInput-root MuiInputBase-colorPrimary MuiInputBase-fullWidth MuiInputBase-formControl MuiInputBase-adornedEnd MuiAutocomplete-inputRoot css-9aopjy"><input aria-invalid="false" autocomplete="off" id=":r3v:" type="text" class="MuiInputBase-input MuiOutlinedInput-input MuiInputBase-inputAdornedEnd MuiAutocomplete-input MuiAutocomplete-inputFocused css-1uvydh2" aria-autocomplete="list" aria-expanded="false" autocapitalize="none" spellcheck="false" role="combobox" value=""><div class="MuiAutocomplete-endAdornment css-mxlkbn"><button class="MuiButtonBase-root MuiIconButton-root MuiIconButton-sizeMedium MuiAutocomplete-popupIndicator css-16ntwwr" tabindex="-1" type="button" aria-label="Open" title="Open"><svg class="MuiSvgIcon-root MuiSvgIcon-fontSizeMedium css-vubbuv" focusable="false" aria-hidden="true" viewBox="0 0 24 24" data-testid="ArrowDropDownIcon"><path d="M7 10l5 5 5-5z"></path></svg><span class="MuiTouchRipple-root css-w0pj6f"></span></button></div><fieldset aria-hidden="true" class="MuiOutlinedInput-notchedOutline css-igs3ac"><legend class="css-yjsfm1"><span>Device / IP</span></legend></fieldset></div></div></div><div class="MuiFormControl-root MuiTextField-root css-f4l9or"><label class="MuiFormLabel-root MuiInputLabel-root MuiInputLabel-formControl MuiInputLabel-animated MuiInputLabel-sizeMedium MuiInputLabel-outlined MuiFormLabel-colorPrimary MuiInputLabel-root MuiInputLabel-formControl MuiInputLabel-animated MuiInputLabel-sizeMedium MuiInputLabel-outlined css-4mi22k" data-shrink="false" for=":r41:" id=":r41:-label">Internal Port (e.g., 100 or 100-255)</label><div class="MuiInputBase-root MuiOutlinedInput-root MuiInputBase-colorPrimary MuiInputBase-formControl css-j9o3g1"><input aria-invalid="false" id=":r41:" name="destination.portRange" type="text" maxlength="11" class="MuiInputBase-input MuiOutlinedInput-input css-1x5jdmq" value=""><fieldset aria-hidden="true" class="MuiOutlinedInput-notchedOutline css-igs3ac"><legend class="css-yjsfm1"><span>Internal Port (e.g., 100 or 100-255)</span></legend></fieldset></div></div></div></div></div><div class="MuiDialogActions-root MuiDialogActions-spacing css-kvke90"><div class="MuiStack-root alternative-layout dialogForm css-den97n"><button class="MuiButtonBase-root MuiButton-root MuiButton-contained MuiButton-containedPrimary MuiButton-sizeMedium MuiButton-containedSizeMedium MuiButton-colorPrimary MuiButton-root MuiButton-contained MuiButton-containedPrimary MuiButton-sizeMedium MuiButton-containedSizeMedium MuiButton-colorPrimary formActionButton submit alternative-layout alternative-layout--submit css-vpb1cu dlg-luu" tabindex="0" type="button"><span class="MuiBox-root css-rrm59m">Add</span></button><button class="MuiButtonBase-root MuiButton-root MuiButton-text MuiButton-textPrimary MuiButton-sizeMedium MuiButton-textSizeMedium MuiButton-colorPrimary MuiButton-root MuiButton-text MuiButton-textPrimary MuiButton-sizeMedium MuiButton-textSizeMedium MuiButton-colorPrimary formActionButton cancel alternative-layout css-1yoqrdw dlg-huybieumau" tabindex="0" type="button">Cancel<span class="MuiTouchRipple-root css-w0pj6f"></span></button></div></div></form></div>',

  /* Ban IPv4: co them o Mask (Autocomplete). Ban IPv6 (dialog_routing_add_ipv6
     duoi day) suy tu ban nay bang 3 sai khac DA DO truc tiep tren tab IPv6
     that (khong doan): (1) gia tri radio Internet la 'wan6' chu khong phai
     'wan', (2) o Destination la <textarea> (khong phai <input>) mang nhan
     'Destination IP/Prefix Length', (3) KHONG co o Mask. Xem
     reference/source/hop_dong_ghi_bang.json muc do_ipv6. */
  dialog_routing_add:
    '<div class="MuiPaper-root MuiPaper-elevation MuiPaper-rounded MuiPaper-elevation24 MuiDialog-paper MuiDialog-paperScrollPaper MuiDialog-paperWidthSm css-1qkl1td" role="dialog" aria-labelledby=":r43:"><form class="css-1w5zf2q"><div class="MuiStack-root css-yd8sa2"><h6 class="MuiTypography-root MuiTypography-subtitle1 css-1mjxmyi">Add New</h6><div class="MuiStack-root css-yd8sa2"><div class="MuiStack-root css-yd8sa2"><div class="MuiStack-root css-yd8sa2"><div class="MuiStack-root css-zwnr44"><h6 class="MuiTypography-root MuiTypography-subtitle1 css-xh7j6h">Interface</h6><div class="MuiFormControl-root css-i44wyl"><div class="MuiFormGroup-root MuiFormGroup-row MuiRadioGroup-root MuiRadioGroup-row css-p58oka" role="radiogroup"><label class="MuiFormControlLabel-root MuiFormControlLabel-labelPlacementEnd css-1bhtk5m"><span class="MuiButtonBase-root MuiRadio-root MuiRadio-colorPrimary PrivateSwitchBase-root MuiRadio-root MuiRadio-colorPrimary MuiRadio-root MuiRadio-colorPrimary css-d0pvr"><input class="PrivateSwitchBase-input css-1m9pwf3" name="radio" type="radio" value="lan"><span class="css-hyxlzm"><svg class="MuiSvgIcon-root MuiSvgIcon-fontSizeMedium css-q8lw68" focusable="false" aria-hidden="true" viewBox="0 0 24 24" data-testid="RadioButtonUncheckedIcon"><path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm0 18c-4.42 0-8-3.58-8-8s3.58-8 8-8 8 3.58 8 8-3.58 8-8 8z"></path></svg><svg class="MuiSvgIcon-root MuiSvgIcon-fontSizeMedium css-1c4tzn" focusable="false" aria-hidden="true" viewBox="0 0 24 24" data-testid="RadioButtonCheckedIcon"><path d="M8.465 8.465C9.37 7.56 10.62 7 12 7C14.76 7 17 9.24 17 12C17 13.38 16.44 14.63 15.535 15.535C14.63 16.44 13.38 17 12 17C9.24 17 7 14.76 7 12C7 10.62 7.56 9.37 8.465 8.465Z"></path></svg></span><span class="MuiTouchRipple-root css-w0pj6f"></span></span><span class="MuiTypography-root MuiTypography-body1 MuiFormControlLabel-label css-tfpe85">LAN</span></label><label class="MuiFormControlLabel-root MuiFormControlLabel-labelPlacementEnd css-1bhtk5m"><span class="MuiButtonBase-root MuiRadio-root MuiRadio-colorPrimary PrivateSwitchBase-root MuiRadio-root MuiRadio-colorPrimary Mui-checked MuiRadio-root MuiRadio-colorPrimary css-d0pvr"><input class="PrivateSwitchBase-input css-1m9pwf3" name="radio" type="radio" value="wan" checked=""><span class="css-hyxlzm"><svg class="MuiSvgIcon-root MuiSvgIcon-fontSizeMedium css-q8lw68" focusable="false" aria-hidden="true" viewBox="0 0 24 24" data-testid="RadioButtonUncheckedIcon"><path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm0 18c-4.42 0-8-3.58-8-8s3.58-8 8-8 8 3.58 8 8-3.58 8-8 8z"></path></svg><svg class="MuiSvgIcon-root MuiSvgIcon-fontSizeMedium css-1u5ei5s" focusable="false" aria-hidden="true" viewBox="0 0 24 24" data-testid="RadioButtonCheckedIcon"><path d="M8.465 8.465C9.37 7.56 10.62 7 12 7C14.76 7 17 9.24 17 12C17 13.38 16.44 14.63 15.535 15.535C14.63 16.44 13.38 17 12 17C9.24 17 7 14.76 7 12C7 10.62 7.56 9.37 8.465 8.465Z"></path></svg></span><span class="MuiTouchRipple-root css-w0pj6f"></span></span><span class="MuiTypography-root MuiTypography-body1 MuiFormControlLabel-label css-tfpe85">Internet</span></label><label class="MuiFormControlLabel-root MuiFormControlLabel-labelPlacementEnd css-1bhtk5m"><span class="MuiButtonBase-root MuiRadio-root MuiRadio-colorPrimary PrivateSwitchBase-root MuiRadio-root MuiRadio-colorPrimary MuiRadio-root MuiRadio-colorPrimary css-d0pvr"><input class="PrivateSwitchBase-input css-1m9pwf3" name="radio" type="radio" value="guest"><span class="css-hyxlzm"><svg class="MuiSvgIcon-root MuiSvgIcon-fontSizeMedium css-q8lw68" focusable="false" aria-hidden="true" viewBox="0 0 24 24" data-testid="RadioButtonUncheckedIcon"><path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm0 18c-4.42 0-8-3.58-8-8s3.58-8 8-8 8 3.58 8 8-3.58 8-8 8z"></path></svg><svg class="MuiSvgIcon-root MuiSvgIcon-fontSizeMedium css-1c4tzn" focusable="false" aria-hidden="true" viewBox="0 0 24 24" data-testid="RadioButtonCheckedIcon"><path d="M8.465 8.465C9.37 7.56 10.62 7 12 7C14.76 7 17 9.24 17 12C17 13.38 16.44 14.63 15.535 15.535C14.63 16.44 13.38 17 12 17C9.24 17 7 14.76 7 12C7 10.62 7.56 9.37 8.465 8.465Z"></path></svg></span><span class="MuiTouchRipple-root css-w0pj6f"></span></span><span class="MuiTypography-root MuiTypography-body1 MuiFormControlLabel-label css-tfpe85">Guest</span></label></div></div></div><div class="MuiStack-root css-3t77sb"><div class="MuiFormControl-root MuiFormControl-fullWidth MuiTextField-root css-117wux8"><label class="MuiFormLabel-root MuiInputLabel-root MuiInputLabel-formControl MuiInputLabel-animated MuiInputLabel-sizeMedium MuiInputLabel-outlined MuiFormLabel-colorPrimary MuiInputLabel-root MuiInputLabel-formControl MuiInputLabel-animated MuiInputLabel-sizeMedium MuiInputLabel-outlined css-4mi22k" data-shrink="false" for=":r47:" id=":r47:-label">Destination IP</label><div class="MuiInputBase-root MuiOutlinedInput-root MuiInputBase-colorPrimary MuiInputBase-fullWidth MuiInputBase-formControl css-190ak7x"><input aria-invalid="false" id=":r47:" name="data.0.target" type="text" class="MuiInputBase-input MuiOutlinedInput-input css-1x5jdmq" value=""><fieldset aria-hidden="true" class="MuiOutlinedInput-notchedOutline css-igs3ac"><legend class="css-yjsfm1"><span>Destination IP</span></legend></fieldset></div></div><div class="MuiAutocomplete-root MuiAutocomplete-fullWidth MuiAutocomplete-hasPopupIcon css-10ayzye"><div class="MuiFormControl-root MuiFormControl-fullWidth MuiTextField-root css-1pzl6jj"><label class="MuiFormLabel-root MuiInputLabel-root MuiInputLabel-formControl MuiInputLabel-animated MuiInputLabel-sizeMedium MuiInputLabel-outlined MuiFormLabel-colorPrimary MuiInputLabel-root MuiInputLabel-formControl MuiInputLabel-animated MuiInputLabel-sizeMedium MuiInputLabel-outlined css-4mi22k" data-shrink="false" for=":r48:" id=":r48:-label">Mask</label><div class="MuiInputBase-root MuiOutlinedInput-root MuiInputBase-colorPrimary MuiInputBase-fullWidth MuiInputBase-formControl MuiInputBase-adornedEnd MuiAutocomplete-inputRoot css-9aopjy"><input aria-invalid="false" autocomplete="off" id=":r48:" type="text" class="MuiInputBase-input MuiOutlinedInput-input MuiInputBase-inputAdornedEnd MuiAutocomplete-input MuiAutocomplete-inputFocused css-1uvydh2" aria-autocomplete="list" aria-expanded="false" autocapitalize="none" spellcheck="false" role="combobox" value=""><div class="MuiAutocomplete-endAdornment css-mxlkbn"><button class="MuiButtonBase-root MuiIconButton-root MuiIconButton-sizeMedium MuiAutocomplete-popupIndicator css-16ntwwr" tabindex="-1" type="button" aria-label="Open" title="Open"><svg class="MuiSvgIcon-root MuiSvgIcon-fontSizeMedium css-vubbuv" focusable="false" aria-hidden="true" viewBox="0 0 24 24" data-testid="ArrowDropDownIcon"><path d="M7 10l5 5 5-5z"></path></svg></button></div><fieldset aria-hidden="true" class="MuiOutlinedInput-notchedOutline css-igs3ac"><legend class="css-yjsfm1"><span>Mask</span></legend></fieldset></div></div></div><div class="MuiFormControl-root MuiFormControl-fullWidth MuiTextField-root css-117wux8"><label class="MuiFormLabel-root MuiInputLabel-root MuiInputLabel-formControl MuiInputLabel-animated MuiInputLabel-sizeMedium MuiInputLabel-outlined MuiFormLabel-colorPrimary MuiInputLabel-root MuiInputLabel-formControl MuiInputLabel-animated MuiInputLabel-sizeMedium MuiInputLabel-outlined css-4mi22k" data-shrink="false" for=":r4a:" id=":r4a:-label">Gateway IP</label><div class="MuiInputBase-root MuiOutlinedInput-root MuiInputBase-colorPrimary MuiInputBase-fullWidth MuiInputBase-formControl css-190ak7x"><input aria-invalid="false" id=":r4a:" name="data.0.gateway" type="text" class="MuiInputBase-input MuiOutlinedInput-input css-1x5jdmq" value=""><fieldset aria-hidden="true" class="MuiOutlinedInput-notchedOutline css-igs3ac"><legend class="css-yjsfm1"><span>Gateway IP</span></legend></fieldset></div></div></div></div></div></div><div class="MuiDialogActions-root MuiDialogActions-spacing css-kvke90"><div class="MuiStack-root alternative-layout dialogForm css-den97n"><button class="MuiButtonBase-root MuiButton-root MuiButton-contained MuiButton-containedPrimary MuiButton-sizeMedium MuiButton-containedSizeMedium MuiButton-colorPrimary MuiButton-root MuiButton-contained MuiButton-containedPrimary MuiButton-sizeMedium MuiButton-containedSizeMedium MuiButton-colorPrimary formActionButton submit alternative-layout alternative-layout--submit css-vpb1cu dlg-luu" tabindex="0" type="button"><span class="MuiBox-root css-rrm59m">ADD</span></button><button class="MuiButtonBase-root MuiButton-root MuiButton-text MuiButton-textPrimary MuiButton-sizeMedium MuiButton-textSizeMedium MuiButton-colorPrimary MuiButton-root MuiButton-text MuiButton-textPrimary MuiButton-sizeMedium MuiButton-textSizeMedium MuiButton-colorPrimary formActionButton cancel alternative-layout css-1yoqrdw dlg-huybieumau" tabindex="0" type="button">Cancel<span class="MuiTouchRipple-root css-w0pj6f"></span></button></div></div></form></div>',

  /* Chup GD4 phan 3 (2026-08-13) tren trang Advanced > LAN > Reserved IP
     that, hop thoai 'Add New Reserved IP' (reference/source/
     dialog_reserved_add.html). Ho tro NHIEU dong (mang 'data') qua nut
     '+ ADD' o cuoi form -- xem lan_reserved trong bang_binding.js. */
  dialog_reserved_add:
    '<div class="MuiPaper-root MuiPaper-elevation MuiPaper-rounded MuiPaper-elevation24 MuiDialog-paper MuiDialog-paperScrollPaper MuiDialog-paperWidthSm css-1qkl1td" role="dialog" aria-labelledby=":r56:"><form class="css-1w5zf2q"><div class="MuiStack-root css-yd8sa2"><h2 class="MuiTypography-root MuiTypography-h6 MuiDialogTitle-root css-1wc3usi" id=":r56:">Add New Reserved IP</h2><div class="MuiStack-root css-yd8sa2"><p class="MuiTypography-root MuiTypography-body2 css-1o25778">Current LAN IPv4 is set to <span class="MuiTypography-root MuiTypography-subtitle3 css-275kpj">192.168.1.1</span> and DHCP pool between 192.168.1.2 and 192.168.1.249.<br>Current Guest LAN IPv4 is set to <span class="MuiTypography-root MuiTypography-subtitle3 css-275kpj">192.168.5.1</span> and DHCP pool between 192.168.5.100 and 192.168.5.249.</p><div class="MuiStack-root css-yd8sa2"><div class="MuiStack-root css-2b9002"><input type="hidden" name="data.0.serverId" value="lan"><div class="MuiAutocomplete-root MuiAutocomplete-fullWidth MuiAutocomplete-hasPopupIcon css-9en7mf"><div class="MuiFormControl-root MuiFormControl-fullWidth MuiTextField-root css-1pzl6jj"><label class="MuiFormLabel-root MuiInputLabel-root MuiInputLabel-formControl MuiInputLabel-animated MuiInputLabel-sizeMedium MuiInputLabel-outlined MuiFormLabel-colorPrimary MuiInputLabel-root MuiInputLabel-formControl MuiInputLabel-animated MuiInputLabel-sizeMedium MuiInputLabel-outlined css-4mi22k" data-shrink="false" for=":r5b:" id=":r5b:-label">Device / MAC</label><div class="MuiInputBase-root MuiOutlinedInput-root MuiInputBase-colorPrimary MuiInputBase-fullWidth MuiInputBase-formControl MuiInputBase-adornedEnd MuiAutocomplete-inputRoot css-9aopjy"><input aria-invalid="false" autocomplete="off" id=":r5b:" type="text" class="MuiInputBase-input MuiOutlinedInput-input MuiInputBase-inputAdornedEnd MuiAutocomplete-input MuiAutocomplete-inputFocused css-1uvydh2" aria-autocomplete="list" aria-expanded="false" autocapitalize="none" spellcheck="false" role="combobox" value=""><div class="MuiAutocomplete-endAdornment css-mxlkbn"><button class="MuiButtonBase-root MuiIconButton-root MuiIconButton-sizeMedium MuiAutocomplete-popupIndicator css-16ntwwr" tabindex="-1" type="button" aria-label="Open" title="Open"><svg class="MuiSvgIcon-root MuiSvgIcon-fontSizeMedium css-vubbuv" focusable="false" aria-hidden="true" viewBox="0 0 24 24" data-testid="ArrowDropDownIcon"><path d="M7 10l5 5 5-5z"></path></svg><span class="MuiTouchRipple-root css-w0pj6f"></span></button></div><fieldset aria-hidden="true" class="MuiOutlinedInput-notchedOutline css-igs3ac"><legend class="css-yjsfm1"><span>Device / MAC</span></legend></fieldset></div></div></div><div class="MuiFormControl-root MuiFormControl-fullWidth MuiTextField-root css-iki850"><label class="MuiFormLabel-root MuiInputLabel-root MuiInputLabel-formControl MuiInputLabel-animated MuiInputLabel-sizeMedium MuiInputLabel-outlined MuiFormLabel-colorPrimary MuiInputLabel-root MuiInputLabel-formControl MuiInputLabel-animated MuiInputLabel-sizeMedium MuiInputLabel-outlined css-4mi22k" data-shrink="false" for=":r5d:" id=":r5d:-label">Reserved IP</label><div class="MuiInputBase-root MuiOutlinedInput-root MuiInputBase-colorPrimary MuiInputBase-fullWidth MuiInputBase-formControl css-190ak7x"><input aria-invalid="false" id=":r5d:" name="data.0.ipAddress" type="text" class="MuiInputBase-input MuiOutlinedInput-input css-1x5jdmq" value=""><fieldset aria-hidden="true" class="MuiOutlinedInput-notchedOutline css-igs3ac"><legend class="css-yjsfm1"><span>Reserved IP</span></legend></fieldset></div></div><button class="MuiButtonBase-root MuiIconButton-root MuiIconButton-sizeSmall css-qo3254" tabindex="0" type="button"><svg class="MuiSvgIcon-root MuiSvgIcon-fontSizeMedium css-vubbuv" focusable="false" aria-hidden="true" viewBox="0 0 24 24" data-testid="DeleteOutlinedIcon"><path d="M16 9v10H8V9zm-1.5-6h-5l-1 1H5v2h14V4h-3.5zM18 7H6v12c0 1.1.9 2 2 2h8c1.1 0 2-.9 2-2z"></path></svg><span class="MuiTouchRipple-root css-w0pj6f"></span></button></div></div><div class="MuiStack-root css-ago75i"><button class="MuiButtonBase-root MuiButton-root MuiButton-text MuiButton-textPrimary MuiButton-sizeMedium MuiButton-textSizeMedium MuiButton-colorPrimary MuiButton-root MuiButton-text MuiButton-textPrimary MuiButton-sizeMedium MuiButton-textSizeMedium MuiButton-colorPrimary css-bbmok2" tabindex="0" type="button"><span class="MuiButton-icon MuiButton-startIcon MuiButton-iconSizeMedium css-1l6c7y9"><svg class="MuiSvgIcon-root MuiSvgIcon-fontSizeSmall css-1k33q06" focusable="false" aria-hidden="true" viewBox="0 0 24 24" data-testid="AddIcon"><path d="M19 13h-6v6h-2v-6H5v-2h6V5h2v6h6z"></path></svg></span>ADD<span class="MuiTouchRipple-root css-w0pj6f"></span></button></div></div></div><div class="MuiDialogActions-root MuiDialogActions-spacing css-kvke90"><div class="MuiStack-root alternative-layout dialogForm css-den97n"><button class="MuiButtonBase-root MuiButton-root MuiButton-contained MuiButton-containedPrimary MuiButton-sizeMedium MuiButton-containedSizeMedium MuiButton-colorPrimary MuiButton-root MuiButton-contained MuiButton-containedPrimary MuiButton-sizeMedium MuiButton-containedSizeMedium MuiButton-colorPrimary formActionButton submit alternative-layout alternative-layout--submit css-vpb1cu dlg-luu" tabindex="0" type="button"><span class="MuiBox-root css-rrm59m">ADD</span><span class="MuiCircularProgress-root MuiCircularProgress-indeterminate MuiCircularProgress-colorPrimary css-1i7o5xq" role="progressbar" style="width: 16px; height: 16px;"><svg class="MuiCircularProgress-svg css-13o7eu2" viewBox="22 22 44 44"><circle class="MuiCircularProgress-circle MuiCircularProgress-circleIndeterminate css-14891ef" cx="44" cy="44" r="20.2" fill="none" stroke-width="3.6"></circle></svg></span><span class="MuiTouchRipple-root css-w0pj6f"></span></button><button class="MuiButtonBase-root MuiButton-root MuiButton-text MuiButton-textPrimary MuiButton-sizeMedium MuiButton-textSizeMedium MuiButton-colorPrimary MuiButton-root MuiButton-text MuiButton-textPrimary MuiButton-sizeMedium MuiButton-textSizeMedium MuiButton-colorPrimary formActionButton cancel alternative-layout css-1yoqrdw dlg-huybieumau" tabindex="0" type="button">Cancel<span class="MuiTouchRipple-root css-w0pj6f"></span></button></div></div></form></div>'
};

/* Boc mot hop thoai BIEU MAU (paper DAY DU, ke ca lop kich thuoc rieng)
   vao khung MUI Modal chuan. KHAC voi __moHopThoai o cho: paper markup da
   TU MANG lop kich thuoc dung (paperWidthMd/paperWidthSm...) nen khong
   duoc bao boc them mot lop paper synthetic nhu ham kia -- chen thang. */
window.__moHopThoaiBieuMau = function (tenPaper) {
  var html = window.__DIALOG_FORM[tenPaper];
  if (!html) { console.warn('[dialog] khong co markup bieu mau cho', tenPaper); return null; }
  var d = document.createElement('div');
  d.setAttribute('role', 'presentation');
  d.className = 'MuiDialog-root MuiModal-root css-126xj0f';
  d.style.cssText = 'position: fixed !important; top: 0 !important; left: 0 !important; right: 0 !important; bottom: 0 !important; width: 100vw !important; height: 100vh !important; z-index: 1300 !important; display: flex !important; align-items: center !important; justify-content: center !important; overflow-y: auto !important; background: transparent !important;';
  
  var st = document.createElement('style');
  st.textContent =
    '.MuiDialog-root .MuiFormControl-root{position:relative !important;display:flex !important;flex-direction:column !important;width:100% !important;margin:0 !important}' +
    '.MuiDialog-root .MuiDialogTitle-root{display:flex !important;align-items:center !important;justify-content:space-between !important;padding:16px 24px !important;border-bottom:1px solid #e5e7eb !important;margin:0 !important;position:relative !important}' +
    '.MuiDialog-root .MuiDialogTitle-root .panel{order:2 !important;margin-left:auto !important}' +
    '.MuiDialog-root .MuiDialogTitle-root h6,.MuiDialog-root .MuiDialogTitle-root h2{order:1 !important;margin:0 !important;font-size:18px !important;font-weight:600 !important;color:#111827 !important}' +
    '.MuiDialog-root .MuiDialogTitle-root button{background:transparent !important;border:none !important;cursor:pointer !important;padding:4px !important;border-radius:50% !important;display:flex !important;align-items:center !important;justify-content:center !important;color:#6b7280 !important;transition:background-color 150ms,color 150ms !important}' +
    '.MuiDialog-root .MuiDialogTitle-root button:hover{background-color:#f3f4f6 !important;color:#111827 !important}' +
    '.MuiDialog-root .MuiDialogContent-root{padding:20px 24px !important;overflow-y:auto !important;box-sizing:border-box !important;display:flex !important;flex-direction:column !important;gap:16px !important}' +
    '.MuiDialog-root .MuiDialogContent-root > .MuiStack-root{display:flex !important;flex-direction:column !important;gap:16px !important;width:100% !important}' +
    '.MuiDialog-root .MuiStack-root.css-lgk7oi{display:flex !important;flex-direction:row !important;gap:16px !important;align-items:center !important;width:100% !important}' +
    '.MuiDialog-root .MuiStack-root.css-lgk7oi > *{flex:1 1 0% !important;min-width:0 !important}' +
    '.MuiDialog-root .MuiOutlinedInput-root,.MuiDialog-root .MuiInputBase-root{position:relative !important;border-radius:4px !important;box-sizing:border-box !important;width:100% !important;background-color:#ffffff !important}' +
    '.MuiDialog-root .MuiOutlinedInput-input,.MuiDialog-root .MuiInputBase-input{box-sizing:border-box !important;padding:12px 14px !important;height:auto !important;width:100% !important;font-size:14px !important}' +
    '.MuiDialog-root .MuiDialogActions-root{display:flex !important;align-items:center !important;justify-content:flex-end !important;padding:16px 24px !important;border-top:1px solid #e5e7eb !important;margin:0 !important;gap:12px !important}' +
    '.MuiDialog-root .dialogForm,.MuiDialog-root .alternative-layout{display:flex !important;flex-direction:row !important;align-items:center !important;justify-content:flex-end !important;gap:12px !important;margin:0 !important}' +
    '.MuiDialog-root button.dlg-luu,.MuiDialog-root button.submit{order:2 !important;display:inline-flex !important;align-items:center !important;justify-content:center !important;background-color:#2f54eb !important;color:#ffffff !important;font-weight:600 !important;font-size:14px !important;padding:8px 24px !important;border-radius:4px !important;border:none !important;cursor:pointer !important;height:38px !important;min-width:80px !important;box-shadow:0 2px 4px rgba(47,84,235,0.25) !important;transition:all 150ms ease !important}' +
    '.MuiDialog-root button.dlg-luu:hover,.MuiDialog-root button.submit:hover{background-color:#1d39c4 !important;box-shadow:0 4px 8px rgba(29,57,196,0.35) !important}' +
    '.MuiDialog-root button.dlg-huybieumau,.MuiDialog-root button.cancel{order:1 !important;display:inline-flex !important;align-items:center !important;justify-content:center !important;background-color:#ffffff !important;color:#4b5563 !important;font-weight:500 !important;font-size:14px !important;padding:8px 18px !important;border-radius:4px !important;border:1px solid #d1d5db !important;cursor:pointer !important;height:38px !important;min-width:80px !important;transition:all 150ms ease !important}' +
    '.MuiDialog-root button.dlg-huybieumau:hover,.MuiDialog-root button.cancel:hover{background-color:#f9fafb !important;border-color:#9ca3af !important;color:#111827 !important}';
  d.appendChild(st);

  d.innerHTML +=
    '<div aria-hidden="true" class="MuiBackdrop-root MuiModal-backdrop css-919eu4" style="position: fixed !important; inset: 0 !important; width: 100% !important; height: 100% !important; background-color: rgba(0, 0, 0, 0.5) !important; z-index: 1300 !important;"></div>' +
    '<div tabindex="0" data-testid="sentinelStart"></div>' +
    '<div class="MuiDialog-container MuiDialog-scrollPaper css-16u656j" role="presentation" tabindex="-1" style="position: relative !important; z-index: 1301 !important; width: 100% !important; height: 100% !important; display: flex !important; align-items: center !important; justify-content: center !important; padding: 20px !important; box-sizing: border-box !important; outline: 0 !important;">' +
    html + '</div><div tabindex="0" data-testid="sentinelEnd"></div>';
  document.body.appendChild(d);

  var paper = d.querySelector('.MuiDialog-paper, .MuiPaper-root');
  if (paper) {
    paper.style.cssText = 'position: relative !important; z-index: 1302 !important; margin: auto !important; max-height: calc(100vh - 48px) !important; max-width: 600px !important; width: 100% !important; background: #ffffff !important; border-radius: 8px !important; box-shadow: 0 10px 40px rgba(0,0,0,0.35) !important; display: flex !important; flex-direction: column !important; overflow-y: auto !important; box-sizing: border-box !important;';
  }

  function dong() { if (d.parentNode) d.parentNode.removeChild(d); }
  var bd = d.querySelector('.MuiBackdrop-root');
  if (bd) bd.addEventListener('click', dong);
  var oHuy = d.querySelector('.dlg-huybieumau');
  var oLuu = d.querySelector('.dlg-luu');
  if (oHuy) oHuy.addEventListener('click', dong);
  var nutDongX = d.querySelector('[data-testid="CloseOutlinedIcon"]');
  if (nutDongX) {
    var bX = nutDongX.closest('button');
    if (bX) bX.addEventListener('click', dong);
  }
  if (oLuu) {
    oLuu.style.display = 'inline-flex';
  }
  return { goc: d, dong: dong, oHuy: oHuy, oLuu: oLuu };
};

/* Boc mot PAPER (chuoi HTML o tren) vao khung MUI Modal chuan, gan vao
   document.body, roi tra ve {dong, oHuy, oTiepTuc} de noi su kien.
   Dung chung cho moi hop thoai xac nhan trong toan bo ban gia lap. */
window.__moHopThoai = function (tenPaper) {
  var html = window.__DIALOG[tenPaper];
  if (!html) { console.warn('[dialog] khong co markup that cho', tenPaper); return null; }
  var d = document.createElement('div');
  d.setAttribute('role', 'presentation');
  d.className = 'MuiDialog-root MuiModal-root css-126xj0f';
  d.style.cssText = 'position: fixed !important; top: 0 !important; left: 0 !important; right: 0 !important; bottom: 0 !important; width: 100vw !important; height: 100vh !important; z-index: 1300 !important; display: flex !important; align-items: center !important; justify-content: center !important; overflow-y: auto !important; background: transparent !important;';
  d.innerHTML =
    '<div aria-hidden="true" class="MuiBackdrop-root MuiModal-backdrop css-919eu4" style="position: fixed !important; inset: 0 !important; width: 100% !important; height: 100% !important; background-color: rgba(0, 0, 0, 0.5) !important; z-index: 1300 !important;"></div>' +
    '<div tabindex="0" data-testid="sentinelStart"></div>' +
    '<div class="MuiDialog-container MuiDialog-scrollPaper css-16u656j" role="presentation" tabindex="-1" style="position: relative !important; z-index: 1301 !important; width: 100% !important; height: 100% !important; display: flex !important; align-items: center !important; justify-content: center !important; padding: 24px !important; box-sizing: border-box !important; outline: 0 !important;">' +
    '<div class="MuiPaper-root MuiPaper-elevation MuiPaper-rounded MuiPaper-elevation24 MuiDialog-paper MuiDialog-paperScrollPaper MuiDialog-paperWidthSm MuiDialog-paperFullWidth" role="dialog" style="position: relative !important; z-index: 1302 !important; margin: auto !important; max-height: calc(100vh - 64px) !important; max-width: 500px !important; width: 100% !important; background: #ffffff !important; border-radius: 8px !important; box-shadow: 0 10px 40px rgba(0,0,0,0.35) !important; display: flex !important; flex-direction: column !important; overflow-y: auto !important;">' +
    html + '</div></div><div tabindex="0" data-testid="sentinelEnd"></div>';
  document.body.appendChild(d);
  function dong() { if (d.parentNode) d.parentNode.removeChild(d); }
  var bd = d.querySelector('.MuiBackdrop-root');
  if (bd) bd.addEventListener('click', dong);
  var oHuy = d.querySelector('.dlg-huy');
  var oTiepTuc = d.querySelector('.dlg-tieptuc');
  if (oHuy) oHuy.addEventListener('click', dong);
  return { dong: dong, oHuy: oHuy, oTiepTuc: oTiepTuc };
};

/* ===================== MENU CUA MUI SELECT (popup chon) =====================
   Markup THAT, chup tren thiet bi 2026-08-13 tu o 'Connection Type' cua trang
   Advanced > WAN -- xem reference/source/do_nhanh_an_wan.json muc
   'popup_cua_MUI_Select'.

   Truoc do du an KHONG co markup nay nen phai dung hop chon tu che
   ('sim-chon-*') o ba cho: o Mode cua trang LAN, o Protocol cua Port
   Forwarding, o Device/MAC cua Reserved IP. Nay thay het bang markup that.

   window.__moMenuChon(oAnchor, ten, dsTuyChon, giaTriDangChon, khiChon)
     oAnchor         : phan tu de can le popup (MuiSelect-select hoac button)
     ten             : ten dinh danh de dat id cho menu
     dsTuyChon       : [{gt: '<data-value>', chu: '<chu hien thi>', voHieu: false}]
     giaTriDangChon  : gia tri hien tai, de danh dau Mui-selected
     khiChon(gt,chu) : goi lai khi nguoi dung chon mot muc

   Tuy chon: mot muc co the thay 'chu' (van ban tho) bang 'phan' -- mang
   cac doan Typography xep doc trong 1 Stack, kem 'chip' (tuy chon) o dau.
   Dung cho o "Security Mode" o che do gop bang tan (Wi-Fi > General),
   khop dung markup that da do tren thiet bi 192.168.1.1 ngay 2026-08-18
   (xem reference/source/do_security_mode_wifi.json):
     { gt, chip: 'Default'|null, phan: ['WPA2/3', '(2.4GHz, 5GHz)'] }
   Tra ve ham dong() de tu dong neu can. */
window.__moMenuChon = function (oAnchor, dsTuyChon, giaTriDangChon, khiChon) {
  var cu = document.querySelector('.MuiPopover-root[data-sim-menu]');
  if (cu) { cu.remove(); return null; }
  if (!oAnchor) return null;

  var ten = 'chon';
  if (typeof dsTuyChon === 'string') {
    ten = dsTuyChon;
    dsTuyChon = arguments[2];
    giaTriDangChon = arguments[3];
    khiChon = arguments[4];
  } else {
    ten = oAnchor.getAttribute('name')
      || (oAnchor.id || '').replace('mui-component-select-', '')
      || 'chon';
  }

  function esc(s) {
    return String(s == null ? '' : s).replace(/[&<>"]/g, function (c) {
      return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c];
    });
  }

  var r = oAnchor.getBoundingClientRect();

  function noiDung(t) {
    if (!t.phan) return esc(t.chu);
    var trong = '';
    if (t.chip) {
      trong += '<div class="MuiChip-root MuiChip-filled MuiChip-sizeMedium '
        + 'MuiChip-colorDefault MuiChip-filledDefault css-o8x9y1">'
        + '<span class="MuiChip-label MuiChip-labelMedium css-9iedg7">'
        + esc(t.chip) + '</span></div>';
    }
    trong += t.phan.map(function (p, i) {
      var lop = (i % 2 === 0) ? 'css-v6shwc' : 'css-u79te2';
      return '<p class="MuiTypography-root MuiTypography-body1 ' + lop
        + '">' + esc(p) + '</p>';
    }).join('');
    return '<div class="MuiStack-root css-1r9kwv0">' + trong + '</div>';
  }

  var muc = dsTuyChon.map(function (t) {
    var dangChon = t.gt === giaTriDangChon;
    var lop = 'MuiButtonBase-root MuiMenuItem-root MuiMenuItem-gutters'
      + (dangChon ? ' Mui-selected Mui-focusVisible' : '')
      + ' MuiMenuItem-root MuiMenuItem-gutters'
      + (dangChon ? ' Mui-selected' : '')
      + (t.voHieu ? ' Mui-disabled' : '')
      + ' css-x3whsd';
    var bgStyle = dangChon ? 'background-color: rgba(47, 84, 235, 0.08) !important; font-weight: 500 !important; color: #2f54eb !important;' : 'background-color: transparent; color: rgba(0, 0, 0, 0.87);';
    var liStyle = 'list-style: none !important; margin: 0 !important; padding: 8px 16px !important; min-height: 36px !important; display: flex !important; align-items: center !important; cursor: pointer !important; font-family: Inter, -apple-system, sans-serif !important; font-size: 14px !important; box-sizing: border-box !important; ' + bgStyle;
    return '<li class="' + lop + '" tabindex="' + (dangChon ? '0' : '-1')
      + '" role="option" color="secondary"'
      + ' aria-selected="' + (dangChon ? 'true' : 'false') + '"'
      + (t.voHieu ? ' aria-disabled="true"' : '')
      + ' style="' + liStyle + '"'
      + ' data-value="' + esc(t.gt) + '">' + noiDung(t)
      + '<span class="MuiTouchRipple-root css-w0pj6f"></span></li>';
  }).join('');

  var menuTop = (r.bottom + 180 > window.innerHeight && r.top > 180)
    ? Math.max(8, Math.round(r.top - 160))
    : Math.round(r.bottom + 2);
  var menuLeft = Math.max(8, Math.round(r.left));

  var d = document.createElement('div');
  d.setAttribute('role', 'presentation');
  d.setAttribute('data-sim-menu', '1');
  d.id = 'menu-' + ten;
  d.className = 'MuiPopover-root MuiMenu-root MuiModal-root css-1sucic7';
  d.innerHTML =
    '<div aria-hidden="true" class="MuiBackdrop-root MuiBackdrop-invisible MuiModal-backdrop css-esi9ax" '
    + 'style="opacity: 1; position: fixed; inset: 0; z-index: 1300; background: transparent;"></div>'
    + '<div tabindex="0" data-testid="sentinelStart"></div>'
    + '<div class="MuiPaper-root MuiPaper-elevation MuiPaper-rounded MuiPaper-elevation8 '
    + 'MuiPopover-paper MuiMenu-paper MuiMenu-paper css-ivedc8" tabindex="-1" '
    + 'style="opacity: 1; transform: none; position: fixed; z-index: 1301; min-width: ' + Math.max(160, Math.round(r.width)) + 'px; '
    + 'top: ' + menuTop + 'px; '
    + 'left: ' + menuLeft + 'px; transform-origin: 0px 0px; background: #ffffff !important; border-radius: 4px !important; '
    + 'box-shadow: 0px 5px 15px -3px rgba(0,0,0,0.2), 0px 8px 10px 1px rgba(0,0,0,0.14) !important; border: 1px solid #d0d7de !important; overflow-x: hidden; overflow-y: auto; max-height: calc(100% - 96px);">'
    + '<ul class="MuiList-root MuiList-padding MuiMenu-list css-r8u8y9" role="listbox" '
    + 'tabindex="-1" style="list-style: none !important; margin: 0 !important; padding: 6px 0 !important; background: #ffffff !important;">' + muc + '</ul></div>'
    + '<div tabindex="0" data-testid="sentinelEnd"></div>';
  document.body.appendChild(d);

  function dong() { if (d.parentNode) d.parentNode.removeChild(d); }
  d.querySelector('.MuiBackdrop-root').addEventListener('click', dong);
  d.querySelectorAll('li').forEach(function (li) {
    li.addEventListener('mouseenter', function () {
      if (li.className.indexOf('Mui-disabled') < 0 && li.className.indexOf('Mui-selected') < 0) {
        li.style.backgroundColor = 'rgba(0, 0, 0, 0.04)';
      }
    });
    li.addEventListener('mouseleave', function () {
      if (li.className.indexOf('Mui-selected') < 0) {
        li.style.backgroundColor = 'transparent';
      }
    });
    li.addEventListener('click', function () {
      if (li.className.indexOf('Mui-disabled') >= 0) return;
      dong();
      khiChon(li.getAttribute('data-value'), li.textContent.trim());
    });
  });
  return dong;
};

/* ================== POPUP CUA MUI AUTOCOMPLETE (khac Select) ==================
   Markup THAT, do truc tiep tren thiet bi 192.168.1.1 ngay 2026-08-20 tu o
   'Device / MAC' cua dialog Add New Reserved IP (Advanced > LAN > Reserved
   IP) -- xem reference/source/do_popup_autocomplete_reserved_ip.json.

   Truoc do o nay muon markup cua Select (__moMenuChon) vi chua co bang
   chung rieng cua Autocomplete -- da ghi trong ISSUES.md la gap "3 cho de
   ngo, muc 2" cua Advanced/LAN GD4 phan 3. Nay thay bang markup that: popup
   dung <ul class="MuiAutocomplete-listbox"> + <li ... MuiAutocomplete-
   option ...>, KHONG phai <ul class="MuiMenu-list"> cua Select. O input luc
   MO cung doi lop/thuoc tinh (Mui-expanded/Mui-focused o root,
   MuiAutocomplete-inputFocused + aria-expanded=true o input, doi nut
   popupIndicator sang bien the '-Open' + nhan 'Close') -- cau truc con lai
   (label/fieldset) giu nguyen tu ban chup tinh GD1, khong doi.

   window.__moPopupAutocomplete(oInput, dsTuyChon, giaTriDangChon, khiChon)
     oInput          : phan tu <input class="MuiAutocomplete-input">
     dsTuyChon       : [{gt: '<gia tri that, vd MAC>', chu: '<chu hien thi>'}]
     giaTriDangChon  : gia tri hien tai (de danh dau aria-selected, hien
                       Autocomplete THAT khong to dam muc dang chon bang
                       Mui-selected nhu Select -- chi dung aria-selected)
     khiChon(gt,chu) : goi lai khi nguoi dung chon mot muc; neu goi voi
                       (null,null) nghia la dong ma khong chon (backdrop/Esc)
   Tra ve ham dong() de tu dong neu can. */
window.__moPopupAutocomplete = function (oInput, dsTuyChon, giaTriDangChon, khiChon) {
  var cu = document.querySelector('.MuiPopper-root[data-sim-autocomplete]');
  if (cu) { cu.remove(); return null; }
  if (!oInput) return null;

  function esc(s) {
    return String(s == null ? '' : s).replace(/[&<>"]/g, function (c) {
      return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c];
    });
  }

  var root = oInput.closest('.MuiAutocomplete-root');
  var wrap = oInput.closest('.MuiInputBase-root');
  var endBtn = wrap ? wrap.querySelector('.MuiAutocomplete-popupIndicator') : null;
  var r = (root || oInput).getBoundingClientRect();
  var idBase = 'sim-autocomplete-' + Math.random().toString(36).slice(2, 8);

  /* Doi trang thai MO cua input/root/nut, dung markup that da do (xem
     reference/source/do_popup_autocomplete_reserved_ip.json). */
  if (root) {
    root.classList.add('Mui-expanded', 'Mui-focused');
    root.setAttribute('aria-owns', idBase + '-listbox');
  }
  oInput.classList.add('MuiAutocomplete-inputFocused');
  oInput.setAttribute('aria-expanded', 'true');
  oInput.setAttribute('aria-controls', idBase + '-listbox');
  if (endBtn) {
    endBtn.classList.add('MuiAutocomplete-popupIndicatorOpen');
    endBtn.setAttribute('aria-label', 'Close');
    endBtn.setAttribute('title', 'Close');
  }

  var muc = dsTuyChon.map(function (t, i) {
    var dangChon = t.gt === giaTriDangChon;
    return '<li class="MuiButtonBase-root MuiMenuItem-root MuiMenuItem-gutters '
      + 'MuiMenuItem-root MuiMenuItem-gutters MuiAutocomplete-option css-1u4mc98" '
      + 'tabindex="-1" role="option" id="' + idBase + '-option-' + i + '" '
      + 'data-option-index="' + i + '" aria-selected="' + (dangChon ? 'true' : 'false') + '" '
      + 'data-sim-gia-tri="' + esc(t.gt) + '">' + esc(t.chu)
      + '<span class="MuiTouchRipple-root css-w0pj6f"></span></li>';
  }).join('');

  var d = document.createElement('div');
  d.setAttribute('role', 'presentation');
  d.setAttribute('data-sim-autocomplete', '1');
  d.className = 'MuiPopper-root MuiAutocomplete-popper css-1mtsuo7';
  d.style.position = 'fixed';
  d.style.zIndex = '1300';
  d.style.top = Math.round(r.bottom) + 'px';
  d.style.left = Math.round(r.left) + 'px';
  d.style.width = Math.round(r.width) + 'px';
  if (muc) {
    d.innerHTML = '<div class="MuiPaper-root MuiPaper-elevation MuiPaper-rounded '
      + 'MuiPaper-elevation1 MuiAutocomplete-paper css-1b4fw37">'
      + '<ul class="MuiAutocomplete-listbox css-1cv6o38" role="listbox" id="' + idBase + '-listbox">'
      + muc + '</ul></div>';
  } else {
    /* Danh sach rong: thiet bi that hien "No options" (mau chu MUI mac
       dinh) -- chua co bang chung markup rieng cho truong hop nay, dung
       lop MuiAutocomplete-noOptions da biet ten tu tai lieu MUI chuan de
       khong de trong khong (ghi ro day la suy dien co can cu ten lop
       API cong khai, khong phai bang chung do truc tiep). */
    d.innerHTML = '<div class="MuiPaper-root MuiPaper-elevation MuiPaper-rounded '
      + 'MuiPaper-elevation1 MuiAutocomplete-paper css-1b4fw37">'
      + '<div class="MuiAutocomplete-noOptions" role="presentation">No options</div></div>';
  }
  document.body.appendChild(d);

  function dong(daChon) {
    if (d.parentNode) d.parentNode.removeChild(d);
    if (root) root.classList.remove('Mui-expanded', 'Mui-focused');
    oInput.classList.remove('MuiAutocomplete-inputFocused');
    oInput.setAttribute('aria-expanded', 'false');
    if (endBtn) {
      endBtn.classList.remove('MuiAutocomplete-popupIndicatorOpen');
      endBtn.setAttribute('aria-label', 'Open');
      endBtn.setAttribute('title', 'Open');
    }
    if (!daChon) return;
  }
  d.querySelectorAll('li[data-sim-gia-tri]').forEach(function (li) {
    li.addEventListener('click', function () {
      var gt = li.getAttribute('data-sim-gia-tri');
      var chu = li.textContent.trim();
      dong(true);
      khiChon(gt, chu);
    });
  });
  /* Bam ra ngoai thi dong khong chon -- khac Select (co backdrop rieng),
     Autocomplete that dong khi mat focus/click ngoai. Dung mousedown +
     setTimeout 0 de khong dong ngay khi bam chinh o input (mo lai). */
  setTimeout(function () {
    function raNgoai(ev) {
      if (d.contains(ev.target) || oInput === ev.target) return;
      document.removeEventListener('mousedown', raNgoai, true);
      dong(false);
    }
    document.addEventListener('mousedown', raNgoai, true);
  }, 0);
  return dong;
};

/* ================== MENU EDIT/DELETE CUA NUT 3 CHAM (mobile) ==================
   Markup THAT, do truc tiep tren thiet bi 192.168.1.1 ngay 2026-08-20 tu nut 3
   cham cua dong "Admin-PC" (Advanced > LAN > Reserved IP, ban dien thoai, qua
   iframe cung-origin 420px) -- xem
   reference/source/do_menu_ba_cham_luc_mo.json.

   Truoc do moMenuBaCham() trong bang_binding.js TAM dung __moMenuChon() (markup
   cua MUI Select) vi chua co anh chup rieng luc MO -- ghi ro trong ISSUES.md.
   Nay thay bang markup THAT: <li role="menuitem"> co icon (EditOutlinedIcon/
   DeleteOutlineRoundedIcon) + <hr> Divider giua Edit/Delete -- KHAC voi Select
   (role="option", data-value, khong icon, khong divider). Wrapper ngoai cung
   (role=presentation id="long-menu", backdrop) TRUNG voi shell dang dung cho
   __moMenuChon/__moPopupAutocomplete -- tai su dung dung, khong bia moi.

   window.__moMenuBaCham(oNeo, dsTuyChon, khiChon)
     oNeo      : phan tu nut 3 cham (neo vi tri)
     dsTuyChon : [{gt, chu, testId, d}] -- d la pathD cua icon SVG (D_EDIT/
                 D_DEL da co san trong bang_binding.js, KHONG bia icon moi)
     khiChon(gt) : goi lai khi chon 1 muc
   Tra ve ham dong() de tu dong neu can. */
window.__moMenuBaCham = function (oNeo, dsTuyChon, khiChon) {
  var cu = document.querySelector('.MuiPopover-root[data-sim-ba-cham]');
  if (cu) { cu.remove(); return null; }
  if (!oNeo) return null;

  function esc(s) {
    return String(s == null ? '' : s).replace(/[&<>"]/g, function (c) {
      return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c];
    });
  }

  var r = oNeo.getBoundingClientRect();

  var muc = dsTuyChon.map(function (t, i) {
    var item = '<li class="MuiButtonBase-root MuiMenuItem-root MuiMenuItem-gutters '
      + 'MuiMenuItem-root MuiMenuItem-gutters css-e68ia9" tabindex="' + (i === 0 ? '0' : '-1')
      + '" role="menuitem" data-value="' + esc(t.gt) + '">'
      + '<div class="MuiListItemIcon-root css-1f8bwsm">'
      + '<svg class="MuiSvgIcon-root MuiSvgIcon-fontSizeMedium css-vubbuv" focusable="false" '
      + 'aria-hidden="true" viewBox="0 0 24 24" data-testid="' + esc(t.testId) + '">'
      + '<path d="' + t.d + '"></path></svg></div>'
      + '<div class="MuiListItemText-root css-1tsvksn"><span class="MuiTypography-root '
      + 'MuiTypography-body1 MuiListItemText-primary css-8hzn2u">' + esc(t.chu) + '</span></div>'
      + '<span class="MuiTouchRipple-root css-w0pj6f"></span></li>';
    /* Divider chi giua Edit va Delete (2 muc dau) -- do duoc dung 1 <hr> giua
       chung, chua co bang chung cho menu >2 muc nen chi chen sau muc dau. */
    return item + (i === 0 && dsTuyChon.length > 1
      ? '<hr class="MuiDivider-root MuiDivider-fullWidth css-9y6cpa">' : '');
  }).join('');

  var d = document.createElement('div');
  d.setAttribute('role', 'presentation');
  d.setAttribute('data-sim-ba-cham', '1');
  d.id = 'long-menu';
  d.className = 'MuiPopover-root MuiMenu-root MuiModal-root css-1sucic7';
  d.innerHTML =
    '<div aria-hidden="true" class="MuiBackdrop-root MuiBackdrop-invisible MuiModal-backdrop css-esi9ax" '
    + 'style="opacity: 1; position: fixed; inset: 0; z-index: 1300;"></div>'
    + '<div tabindex="0" data-testid="sentinelStart"></div>'
    + '<div class="MuiPaper-root MuiPaper-elevation MuiPaper-rounded MuiPaper-elevation8 '
    + 'MuiPopover-paper MuiMenu-paper MuiMenu-paper css-cn14vc" tabindex="-1" '
    + 'style="opacity: 1; transform: none; position: fixed; z-index: 1300; '
    + 'top: ' + Math.round(r.top) + 'px; left: ' + Math.round(r.left) + 'px; transform-origin: 0px 0px;">'
    + '<ul class="MuiList-root MuiList-padding MuiMenu-list css-r8u8y9" role="menu" tabindex="0">'
    + muc + '</ul></div>'
    + '<div tabindex="0" data-testid="sentinelEnd"></div>';
  document.body.appendChild(d);

  function dong() { if (d.parentNode) d.parentNode.removeChild(d); }
  d.querySelector('.MuiBackdrop-root').addEventListener('click', dong);
  d.querySelectorAll('li[role="menuitem"]').forEach(function (li) {
    li.addEventListener('click', function () {
      dong();
      khiChon(li.getAttribute('data-value'));
    });
  });
  return dong;
};

/* Noi mot o MUI Select that (co <div .MuiSelect-select> hien chu + <input>
   an mang gia tri) voi menu o tren. Dung chung cho moi trang.
     oHienThi : div .MuiSelect-select (id = 'mui-component-select-<ten>')
     oInput   : input an mang name = ten truong
     dsTuyChon: nhu tren, hoac ham tra ve danh sach (de tinh lai moi lan mo)
     khiDoi   : goi sau khi gia tri doi */
/* Nhan cua o Select phai "nhay len" (data-shrink=true + lop Mui-
   InputLabel-shrink) khi co gia tri, giong het co "value" that cua MUI --
   khong thi chu da chon de len ngay tren chu placeholder cua nhan. Bang
   chung tinh chi chup dung 1 trang thai nhan (luc rong), nen phai tu dong
   bo lai moi lan gia tri doi -- cung ho voi loi cham-giua-radio/checkbox-
   tick da gap truoc do (trang thai khong co mat luc chup thi khong tu
   dung duoc). Phat hien khi kiem m_network__portforward 2026-08-14. */
function dongBoNhanChon(oHienThi, coGiaTri) {
  var fc = oHienThi.closest('.MuiFormControl-root');
  if (!fc) return;
  var nhan = fc.querySelector('.MuiInputLabel-root');
  if (!nhan) return;
  window.__dongBoNhanChonThuc(nhan, coGiaTri);
}
/* Tach rieng phan dat thuoc tinh/lop len <label> de dung lai duoc o noi
   khac (vd o Autocomplete cua wireMacAutocomplete() trong bang_binding.js
   -- cung mot ho loi "nhan khong nhay len khi co gia tri", ban chup tinh
   chi bat duoc trang thai RONG). */
window.__dongBoNhanChonThuc = function (nhan, coGiaTri) {
  nhan.setAttribute('data-shrink', coGiaTri ? 'true' : 'false');
  nhan.classList.toggle('MuiInputLabel-shrink', !!coGiaTri);
  nhan.classList.toggle('MuiFormLabel-filled', !!coGiaTri);
  if (coGiaTri) {
    nhan.classList.remove('css-4mi22k');
    nhan.classList.add('css-1sqw6hd');
  } else {
    nhan.classList.remove('css-1sqw6hd');
    nhan.classList.add('css-4mi22k');
  }
  var fc = nhan.closest('.MuiFormControl-root');
  if (fc) {
    var leg = fc.querySelector('fieldset legend');
    if (leg) {
      if (coGiaTri) {
        leg.classList.remove('css-yjsfm1');
        leg.classList.add('css-14lo706');
      } else {
        leg.classList.remove('css-14lo706');
        leg.classList.add('css-yjsfm1');
      }
    }
  }
};

window.__noiOChon = function (oHienThi, oInput, dsTuyChon, khiDoi) {
  if (!oHienThi || !oInput || oHienThi.__simDaNoi) return;
  oHienThi.__simDaNoi = true;
  oHienThi.style.cursor = 'pointer';
  dongBoNhanChon(oHienThi, !!oInput.value);
  oHienThi.addEventListener('click', function () {
    /* GD5 phan 2 nhom Advanced (2026-08-14): khi truong bi khoa boi
       apDungPhuThuoc() (vd Dynamic Server o DDNS luc Enable dang tat),
       o Select van la mot <div>, khong tu chan click nhu <input
       disabled> that. Phai tu kiem tra 'aria-disabled' truoc khi mo
       menu, neu khong nguoi dung van chon duoc gia tri cho truong dang
       hien thi la bi khoa. */
    if (oHienThi.getAttribute('aria-disabled') === 'true') return;
    var ds = (typeof dsTuyChon === 'function') ? dsTuyChon() : dsTuyChon;
    window.__moMenuChon(oHienThi, ds, oInput.value, function (gt, chu) {
      oInput.value = gt;
      oHienThi.textContent = chu;
      dongBoNhanChon(oHienThi, !!gt);
      oInput.dispatchEvent(new Event('change', { bubbles: true }));
      if (khiDoi) khiDoi(gt, chu);
    });
  });
};
