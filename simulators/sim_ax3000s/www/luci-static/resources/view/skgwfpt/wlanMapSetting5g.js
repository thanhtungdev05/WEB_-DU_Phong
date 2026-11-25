
function pageLoad()
{get_wlan_guest_info();}
var wifi_guest={ssidEnable:Array(3),ssid:Array(3),securityMode:Array(3),password:Array(3),hide:Array(3),acCrtlEN:Array(3),maxClient:Array(3),};var mesh_enable=0;var mesh_role=1;function display_each_ssid(enable,index)
{var enable_id="Chk_ABandEnable_"+index;var ssid_id="Txt_ABandSSID_"+index;var auth_id="Sel_ABandAuth_"+index;var password_id="Txt_ABandPSK_"+index;var hide_id="Sel_ABandHide_"+index;var ebableobj=getObj(enable_id);var ssidobj=getObj(ssid_id);var authobj=getObj(auth_id);var passwordobj=getObj(password_id);var hideobj=getObj(hide_id);if(enable){ebableobj.disabled=false;ssidobj.disabled=false;authobj.disabled=false;reload_authMode(index);passwordobj.disabled=false;hideobj.disabled=false;}
else{ebableobj.disabled=true;ssidobj.disabled=true;authobj.disabled=true;passwordobj.disabled=true;hideobj.disabled=true;}}
function get_wlan_guest_info()
{var ubusparamRadio=new Array("rtweb.wifi","wlanRadioGet",{"band":"5G"});var jsonparamRadio={"id":1,"params":ubusparamRadio};sk_auth_post(jsonparamRadio,function(result){wifi_guest.ieeeStandard=result.result[1].radios[0].netType;});var ubusmapInfo=new Array("rtweb.mesh","wlanMeshGet",{});var ubusparamBSS=new Array("rtweb.wifi","wlanBasicGet",{"band":"5G","index":15});var jsonparamBSS={"id":1,"params":ubusparamBSS};var jsonparamMesh={"id":1,"params":ubusmapInfo};sk_auth_post(jsonparamMesh,function(result){mesh_enable=result.result[1].enable;mesh_role=result.result[1].role;sk_auth_post(jsonparamBSS,function(result){for(var i=1;i<=3;i++){wifi_guest.ssidEnable[i]=result.result[1].bss[i].enable;wifi_guest.ssid[i]=result.result[1].bss[i].ssid;wifi_guest.password[i]=result.result[1].bss[i].password;wifi_guest.securityMode[i]=result.result[1].bss[i].securityMode;wifi_guest.hide[i]=result.result[1].bss[i].hide;show_wlan_guest_info(i);reload_authMode(i);}});});}
function reload_auth_wpa(auth_id)
{var selectElement=document.getElementById(auth_id);var optionToHide=selectElement.querySelector('option[value="WPA-PSK"]');if(wifi_guest.ieeeStandard=="anacaxbe")
{optionToHide.style.display="none";}
else
{optionToHide.style.display="";}}
function reload_authMode(index)
{var enable_id="Chk_ABandEnable_"+index;var auth_id="Sel_ABandAuth_"+index;var password_id="Txt_ABandPSK_"+index;var ebableobj=getObj(enable_id);var authobj=getObj(auth_id);var passwordobj=getObj(password_id);if(authobj.value=="Open System"){passwordobj.disabled=true;}else{if(ebableobj.checked){passwordobj.disabled=false;}}
reload_auth_wpa(auth_id);}
function reload_Enable(index)
{var enable_id="Chk_ABandEnable_"+index;var ssid_id="Txt_ABandSSID_"+index;var auth_id="Sel_ABandAuth_"+index;var password_id="Txt_ABandPSK_"+index;var hide_id="Sel_ABandHide_"+index;var acCtrlEN="AccessEnable_"+index;var maxClient="maxClient_"+index;var ebableobj=getObj(enable_id);var ssidobj=getObj(ssid_id);var authobj=getObj(auth_id);var passwordobj=getObj(password_id);var hideobj=getObj(hide_id);var accessEnable=getObj(acCtrlEN);var max=getObj(maxClient);if(ebableobj.checked){ssidobj.disabled=false;authobj.disabled=false;reload_authMode(index);passwordobj.disabled=false;hideobj.disabled=false;accessEnable.disabled=false;if(accessEnable.checked){max.disabled=false;}else{max.disabled=true;}}
else{ssidobj.disabled=true;authobj.disabled=true;passwordobj.disabled=true;hideobj.disabled=true;accessEnable.disabled=true;max.disabled=true;}}
function SelChange_Enable(index)
{reload_Enable(index);}
function AccessChange_Enable(index)
{var acCtrlEN="AccessEnable_"+index;var maxClient="maxClient_"+index;var accessEnable=getObj(acCtrlEN);var max=getObj(maxClient);if(accessEnable.checked){max.disabled=false;}else{max.disabled=true;}}
function SelChange_AuthMode(index)
{reload_authMode(index);}
function isValidWPAPskKey(val){var ret=false;var len=val.length;var maxSize=64;var minSize=8;if(len>=minSize&&len<maxSize)
ret=true;else if(len==maxSize){for(i=0;i<maxSize;i++)
if(isHexaDigit(val.charAt(i))==false)
break;if(i==maxSize)
ret=true;}else
ret=false;return ret;}
function isValidAscii(val)
{for(var i=0;i<val.length;i++)
{var ch=val.charAt(i);if(ch<' '||ch>'~')
{return false;}}
return true;}
function checkWlanSsid(ssid)
{if(ssid=='')
{warninfo_show(_('wlanBasicSeting2g_ssidNone'));return false;}
if(ssid.length>32)
{warninfo_show(_('wlanBasicSeting2g_ssidTooLong'));return false;}
if(isValidAscii(ssid))
{warninfo_show(_('wlanBasicSeting2g_ssidInvalid'));return false;}
return true;}
function checkWlanPassword(password)
{if(isValidWPAPskKey(password)!=true){warninfo_show(_('wlanBasicSeting2g_passwordTooLong'));return false;}
return true;}
function checkWlanInfo()
{if(checkWlanSsid(getValue("Txt_SSID"))!=true)
{return false;}
if(checkWlanPassword(getValue("Pwd_WpaPsk"))!=true)
{return false;}
return true;}
function wifiReload()
{var ubusparam=new Array("rtweb.wifi","reload",{"band":2});var jsonparam={"id":1,"params":ubusparam};sk_auth_post(jsonparam,function(result){console.log("wifi reload");});}
function setGuestBss(data,index)
{var enable_id="Chk_ABandEnable_"+index;var ssid_id="Txt_ABandSSID_"+index;var auth_id="Sel_ABandAuth_"+index;var password_id="Txt_ABandPSK_"+index;var hide_id="Sel_ABandHide_"+index;var acCtrlEN="AccessEnable_"+index;var maxClient="maxClient_"+index;var accessEnable=0;var max=getValue(maxClient);var ssidEn=0;var ssidHidden=getValue(hide_id);var ssid=getValue(ssid_id);var securityMode=getValue(auth_id);var password=getValue(password_id);var encrypt=(securityMode=="Open System")?"None":"AESEncryption"
if(true==getChecked(enable_id))
{ssidEn=1;}
if(true==getChecked(acCtrlEN))
{accessEnable=1;}
var objValue1={"band":"5G","index":index+1,"ssid":ssid,"enable":ssidEn,"securityMode":securityMode,"encrypt":encrypt,"password":password,"maxAssoc":64,"hide":parseInt(ssidHidden),"maxClient":parseInt(max),"acCtrlEN":accessEnable};data.push(objValue1);}
function setBssInfo()
{var data=[];setGuestBss(data,1);setGuestBss(data,2);setGuestBss(data,3);var ubusparam=new Array("rtweb.wifi","wlanBasicSet",{"bss":data});var jsonparam=[{"id":1,"params":ubusparam}];sk_auth_post(jsonparam,function(result){wifiReload();loading_show();setTimeout("hide_mode()",5000);});}
function show_wlan_guest_info(index)
{var enabld_id="Chk_ABandEnable_"+index;var ssid_id="Txt_ABandSSID_"+index;var auth_id="Sel_ABandAuth_"+index;var password_id="Txt_ABandPSK_"+index;var hide_id="Sel_ABandHide_"+index;var i=index;var acCtrlEN="AccessEnable_"+index;var maxClient="maxClient_"+index;if(wifi_guest.ssidEnable[i]=="1")
{setChecked(enabld_id,true);}
else
{setChecked(enabld_id,false);}
if(wifi_guest.acCrtlEN[i]=="1")
{setChecked(acCtrlEN,true);}
else
{setChecked(acCtrlEN,false);}
setValue(ssid_id,wifi_guest.ssid[i]);setValue(auth_id,wifi_guest.securityMode[i]);setValue(password_id,wifi_guest.password[i]);setValue(hide_id,wifi_guest.hide[i]);if(mesh_enable==true&&mesh_role==2){display_each_ssid(0,index)}else{reload_Enable(index);}}
function BntClick_Apply()
{var ssid1=getValue("Txt_ABandSSID_1");var password1=getValue("Txt_ABandPSK_1");var ssid2=getValue("Txt_ABandSSID_2");var password2=getValue("Txt_ABandPSK_2");var ssid3=getValue("Txt_ABandSSID_3");var password3=getValue("Txt_ABandPSK_3");var ret1=true,ret2=true,ret3=true;ret1=isValidSsid(ssid1);ret2=isValidSsid(ssid2);ret3=isValidSsid(ssid3);if(ret1==-1||ret2==-1||ret3==-1){warninfo_show(_("basicSetting2g_ssidempty"));return;}else if(ret1==-2||ret2==-2||ret3==-2){warninfo_show(_("basicSetting2g_ssidlengthlimit"));return;}else if(ret1==-3||ret2==-3||ret3==-3){warninfo_show(_("basicSetting2g_ssidspacelimit"));return;}else if(ret1==-4||ret2==-4||ret3==-4){warninfo_show(_("basicSetting2g_ssidcharlimit"));return;}
ret1=isValidPassword(password1);ret2=isValidPassword(password2);ret3=isValidPassword(password3);if(ret1==-1||ret2==-1||ret3==-1){warninfo_show(_("basicSetting2g_pwdempty"));return;}else if(ret1==-2||ret2==-2||ret3==-2){warninfo_show(_("basicSetting2g_pwdlengthlimit"));return;}else if(ret1==-3||ret2==-3||ret3==-3){warninfo_show(_("basicSetting2g_pwdcharlimit"));return;}else if(ret1==-4||ret2==-4||ret3==-3){warninfo_show(_("basicSetting2g_pwdspacelimit"));return;}
setBssInfo();}