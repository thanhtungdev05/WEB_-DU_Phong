
function pageLoad()
{get_wlan_guest_info();}
var wifi_guest_2G={ssidEnable:Array(4),ssid:Array(4),securityMode:Array(4),password:Array(4),hide:Array(4),acCrtlEN:Array(4),maxClient:Array(4),};var wifi_guest_5G={ssidEnable:Array(4),ssid:Array(4),securityMode:Array(4),password:Array(4),hide:Array(4),acCrtlEN:Array(4),maxClient:Array(4),};var bandSteering_array=new Array(4);var mesh_enable=0;var mesh_role=1;function display_each_ssid(enable,index,band)
{var enable_id="Chk_SsidEnable_2G_"+(index+1);var ssid_id="Txt_SSID_2G_"+(index+1);var auth_id="Sel_AuthMode_2G_"+(index+1);var password_id="Pwd_WpaPsk_2G_"+(index+1);if(band=="5G")
{enable_id="Chk_SsidEnable_5G_"+(index+1);ssid_id="Txt_SSID_5G_"+(index+1);auth_id="Sel_AuthMode_5G_"+(index+1);password_id="Pwd_WpaPsk_5G_"+(index+1);}
var enableobj=getObj(enable_id);var ssidobj=getObj(ssid_id);var authobj=getObj(auth_id);var passwordobj=getObj(password_id);if(enable){enableobj.disabled=false;ssidobj.disabled=false;authobj.disabled=false;reload_authMode(index,band);passwordobj.disabled=false;}
else{enableobj.disabled=true;ssidobj.disabled=true;authobj.disabled=true;passwordobj.disabled=true;}}
function get_wlan_guest_info()
{var ubusparamRadio=new Array("rtweb.wifi","wlanRadioGet",{});var jsonparamRadio={"id":1,"params":ubusparamRadio};sk_auth_post(jsonparamRadio,function(result){wifi_guest_2G.ieeeStandard=result.result[1].radios[0].netType;wifi_guest_5G.ieeeStandard=result.result[1].radios[1].netType;});var ubusmapInfo=new Array("rtweb.mesh","wlanMeshGet",{});var ubusparamBSS=new Array("rtweb.wifi","wlanBandSteeringGet",{});var jsonparamBSS={"id":1,"params":ubusparamBSS};var jsonparamMesh={"id":1,"params":ubusmapInfo};sk_auth_post(jsonparamMesh,function(result){mesh_enable=result.result[1].enable;mesh_role=result.result[1].role;sk_auth_post(jsonparamBSS,function(result){for(var i=0;i<=3;i++){wifi_guest_2G.ssidEnable[i]=result.result[1].cfg[i]["2.4G"].enable;wifi_guest_2G.ssid[i]=result.result[1].cfg[i]["2.4G"].ssid;wifi_guest_2G.password[i]=result.result[1].cfg[i]["2.4G"].password;wifi_guest_2G.securityMode[i]=result.result[1].cfg[i]["2.4G"].securityMode;wifi_guest_5G.ssidEnable[i]=result.result[1].cfg[i]["5G"].enable;wifi_guest_5G.ssid[i]=result.result[1].cfg[i]["5G"].ssid;wifi_guest_5G.password[i]=result.result[1].cfg[i]["5G"].password;wifi_guest_5G.securityMode[i]=result.result[1].cfg[i]["5G"].securityMode;bandSteering_array[i]=result.result[1].cfg[i].bandsteering_enable;if(i==0)
continue;show_wlan_bandsteering_info(i);show_wlan_guest_info_2G(i);show_wlan_guest_info_5G(i);}});});}
function show_wlan_bandsteering_info(index)
{var bandSteering_id="Chk_BandSteeringEnable_"+(index+1);var enableobj=getObj(bandSteering_id);if(bandSteering_array[index])
setChecked(bandSteering_id,true);else
setChecked(bandSteering_id,false);if(mesh_enable==true&&mesh_role==2)
{enableobj.disabled=true;}
reload_BandSteering(index);}
function reload_auth_wpa(auth_id,band)
{var selectElement=document.getElementById(auth_id);var optionToHide=selectElement.querySelector('option[value="WPA-PSK"]');var wifi_guest=wifi_guest_2G;if(band=="5G")
wifi_guest=wifi_guest_5G;if(wifi_guest.ieeeStandard=="anacaxbe")
{optionToHide.style.display="none";}
else
{optionToHide.style.display="";}}
function reload_authMode(index,band)
{var enable_id="Chk_SsidEnable_2G_"+(index+1);var auth_id="Sel_AuthMode_2G_"+(index+1);var password_id="Pwd_WpaPsk_2G_"+(index+1);if(band=="5G")
{enable_id="Chk_SsidEnable_5G_"+(index+1);auth_id="Sel_AuthMode_5G_"+(index+1);password_id="Pwd_WpaPsk_5G_"+(index+1);}
var enableobj=getObj(enable_id);var authobj=getObj(auth_id);var passwordobj=getObj(password_id);if(authobj.value=="Open System"){passwordobj.disabled=true;}else{if(enableobj.checked){passwordobj.disabled=false;}}
reload_auth_wpa(auth_id);}
function reload_Enable(index,band)
{var enable_id="Chk_SsidEnable_2G_"+(index+1);var ssid_id="Txt_SSID_2G_"+(index+1);var auth_id="Sel_AuthMode_2G_"+(index+1);var password_id="Pwd_WpaPsk_2G_"+(index+1);if(band=="5G")
{enable_id="Chk_SsidEnable_5G_"+(index+1);ssid_id="Txt_SSID_5G_"+(index+1);auth_id="Sel_AuthMode_5G_"+(index+1);password_id="Pwd_WpaPsk_5G_"+(index+1);}
var bs_enable_id="Chk_BandSteeringEnable_"+(index+1);var bs_obj=getObj(bs_enable_id);var enableobj=getObj(enable_id);var ssidobj=getObj(ssid_id);var authobj=getObj(auth_id);var passwordobj=getObj(password_id);if(enableobj.checked&&(band!="5G"||bs_obj.checked==false)){ssidobj.disabled=false;authobj.disabled=false;reload_authMode(index,band);passwordobj.disabled=false;}
else{ssidobj.disabled=true;authobj.disabled=true;passwordobj.disabled=true;}}
function ssid_set_suffix(str,band,operation)
{if(!str||!str.trim()||str.trim()==="2.4G"||str.trim()==="5G"){return "";}
var newStr=str;var suffix=" 2.4G";if(band=="5G")
{suffix=" 5G";}
if(operation=="Add")
{if(!str.endsWith(suffix))
{newStr=str+suffix;}}
else
{if(str.endsWith(suffix))
{newStr=str.slice(0,-suffix.length);}}
return newStr;}
function SetbandSteeringBSS(index,enable)
{if(enable)
{var enable_id_2G="Chk_SsidEnable_2G_"+(index+1);var ssid_id_2G="Txt_SSID_2G_"+(index+1);var auth_id_2G="Sel_AuthMode_2G_"+(index+1);var password_id_2G="Pwd_WpaPsk_2G_"+(index+1);var enable_id_5G="Chk_SsidEnable_5G_"+(index+1);var ssid_id_5G="Txt_SSID_5G_"+(index+1);var auth_id_5G="Sel_AuthMode_5G_"+(index+1);var password_id_5G="Pwd_WpaPsk_5G_"+(index+1);setChecked(enable_id_2G,true);if(index!==2){setChecked(enable_id_5G,true);}var newSsid=ssid_set_suffix(getValue(ssid_id_2G),"2.4G","Del");setValue(ssid_id_2G,newSsid);setValue(ssid_id_5G,newSsid);setValue(password_id_5G,getValue(password_id_2G));setValue(auth_id_5G,getValue(auth_id_2G));SelChange_Enable(index,"2.4G");if(index!==2){SelChange_Enable(index,"5G");}}
else
{var ssid_id_2G="Txt_SSID_2G_"+(index+1);var ssid_id_5G="Txt_SSID_5G_"+(index+1);var newSsid_2G=ssid_set_suffix(getValue(ssid_id_2G),"2.4G","Add");setValue(ssid_id_2G,newSsid_2G);var newSsid_5G=ssid_set_suffix(getValue(ssid_id_5G),"5G","Add");setValue(ssid_id_5G,newSsid_5G);if(index===2){setChecked("Chk_SsidEnable_5G_3",false);SelChange_Enable(index,"5G");}}}
function reload_BandSteering(index)
{var bandSteering_id="Chk_BandSteeringEnable_"+(index+1);var enableobj=getObj(bandSteering_id);var ssid_id_2G="Chk_SsidEnable_2G_"+(index+1);var ssidEnableobj_2G=getObj(ssid_id_2G);if(enableobj.checked){SetbandSteeringBSS(index,true);display_each_ssid(0,index,"5G");ssidEnableobj_2G.disabled=true;}
else{display_each_ssid(1,index,"5G");ssidEnableobj_2G.disabled=false;SetbandSteeringBSS(index,false);}}
function BandSteering_Enable(index)
{reload_BandSteering(index);}
function SelChange_Enable(index,band)
{if(index===2&&band==="2.4G"){var sVal=getValue("Txt_SSID_2G_3");if(!sVal||sVal==="2.4G"||sVal===" 2.4G"||sVal.trim()==="2.4G"){setValue("Txt_SSID_2G_3","");}}reload_Enable(index,band);reload_authMode(index,band);}
function SelChange_AuthMode(index,band)
{reload_authMode(index,band);reload_BandSteeringBss(index);}
function reload_BandSteeringBss(index)
{var bandSteering_id="Chk_BandSteeringEnable_"+(index+1);var enableobj=getObj(bandSteering_id);if(enableobj.checked)
{reload_BandSteering(index);}}
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
function setGuestBss(data,index,band)
{var enable_id="Chk_SsidEnable_2G_"+(index+1);var ssid_id="Txt_SSID_2G_"+(index+1);var auth_id="Sel_AuthMode_2G_"+(index+1);var password_id="Pwd_WpaPsk_2G_"+(index+1);if(band=="5G")
{enable_id="Chk_SsidEnable_5G_"+(index+1);ssid_id="Txt_SSID_5G_"+(index+1);auth_id="Sel_AuthMode_5G_"+(index+1);password_id="Pwd_WpaPsk_5G_"+(index+1);}
var ssidEn=0;var ssid=getValue(ssid_id);var securityMode=getValue(auth_id);var password=getValue(password_id);var encrypt=(securityMode=="Open System")?"None":"AESEncryption"
if(true==getChecked(enable_id))
{ssidEn=1;}
var objValue1={"band":band,"index":index+1,"ssid":ssid,"enable":ssidEn,"securityMode":securityMode,"encrypt":encrypt,"password":password,};data.push(objValue1);}
function setBssInfo(index)
{var data=[];setGuestBss(data,index,"2.4G");setGuestBss(data,index,"5G");var ubusparam=new Array("rtweb.wifi","wlanBasicSet",{"bss":data});var bandsteering_enable=0;var bs_enable_id="Chk_BandSteeringEnable_"+(index+1);if(true==getChecked(bs_enable_id))
bandsteering_enable=1;var ubusparam_bs=new Array("rtweb.wifi","wlanBandSteeringSet",{"index":index+1,"bandsteering_enable":bandsteering_enable,"bsSetssid":0});var jsonparam=[{"id":1,"params":ubusparam},{"id":2,"params":ubusparam_bs}];sk_auth_post(jsonparam,function(result){wifiReload();loading_show();setTimeout("hide_mode()",5000);});}
function show_wlan_guest_info_2G(index)
{var i=index;var enable_id="Chk_SsidEnable_2G_"+(index+1);var ssid_id="Txt_SSID_2G_"+(index+1);var auth_id="Sel_AuthMode_2G_"+(index+1);var password_id="Pwd_WpaPsk_2G_"+(index+1);if(wifi_guest_2G.ssidEnable[i]=="1")
{setChecked(enable_id,true);}
else
{setChecked(enable_id,false);}
var initSsid=wifi_guest_2G.ssid[i]||"";if(index===2&&(initSsid==="2.4G"||initSsid===" 2.4G"||initSsid.trim()==="2.4G")){initSsid="";}setValue(ssid_id,initSsid);setValue(auth_id,wifi_guest_2G.securityMode[i]);setValue(password_id,wifi_guest_2G.password[i]);if(mesh_enable==true&&mesh_role==2){display_each_ssid(0,index,"2.4G")}else{reload_Enable(index,"2.4G");}}
function show_wlan_guest_info_5G(index)
{var i=index;var enable_id="Chk_SsidEnable_5G_"+(index+1);var ssid_id="Txt_SSID_5G_"+(index+1);var auth_id="Sel_AuthMode_5G_"+(index+1);var password_id="Pwd_WpaPsk_5G_"+(index+1);if(index===2){setChecked(enable_id,false);}else if(wifi_guest_5G.ssidEnable[i]=="1")
{setChecked(enable_id,true);}
else
{setChecked(enable_id,false);}
setValue(ssid_id,wifi_guest_5G.ssid[i]);setValue(auth_id,wifi_guest_5G.securityMode[i]);setValue(password_id,wifi_guest_5G.password[i]);if(mesh_enable==true&&mesh_role==2){display_each_ssid(0,index,"5G")}else{reload_Enable(index,"5G");}}
function toggleCollapsible(header)
{header.classList.toggle('active');const content=header.nextElementSibling;if(content.style.maxHeight){content.style.maxHeight=null;}else{content.style.maxHeight=content.scrollHeight+"px";var sVal=getValue("Txt_SSID_2G_3");if(!sVal||sVal==="2.4G"||sVal===" 2.4G"||sVal.trim()==="2.4G"){setValue("Txt_SSID_2G_3","");}setChecked("Chk_SsidEnable_5G_3",false);reload_Enable(2,"5G");}}
function checkSSIDRepid(ssid,band,index)
{var ssid_all=wifi_guest_2G.ssid;if(band=="5G")
ssid_all=wifi_guest_5G.ssid;for(var i=0;i<=3;i++)
{if(i==index)
continue;if(ssid_all[i]==ssid)
return false;}
return true;}
function BntClick_Apply(index)
{var ssid_id_2G="Txt_SSID_2G_"+(index+1);var password_id_2G="Pwd_WpaPsk_2G_"+(index+1);var ssid_id_5G="Txt_SSID_5G_"+(index+1);var password_id_5G="Pwd_WpaPsk_5G_"+(index+1);var ssid_2G=getValue(ssid_id_2G);var password_2G=getValue(password_id_2G);var ssid_5G=getValue(ssid_id_5G);var password_5G=getValue(password_id_5G);var enable_id_2G="Chk_SsidEnable_2G_"+(index+1);var enable_id_5G="Chk_SsidEnable_5G_"+(index+1);var is2G=getChecked(enable_id_2G);var is5G=getChecked(enable_id_5G);var ret1=true,ret2=true;if(is2G){ret1=isValidSsid(ssid_2G);if(ret1==-1||ret1==-2||ret1==-3||ret1==-4){if(ret1==-1){parent.warninfo_show(_("basicSetting2g_ssidempty"));}else if(ret1==-2){parent.warninfo_show(_("basicSetting2g_ssidlengthlimit"));}else if(ret1==-3){parent.warninfo_show(_("basicSetting2g_ssidspacelimit"));}else if(ret1==-4){parent.warninfo_show(_("basicSetting2g_ssidcharlimit"));}return;}}if(is5G){ret2=isValidSsid(ssid_5G);if(ret2==-1||ret2==-2||ret2==-3||ret2==-4){if(ret2==-1){parent.warninfo_show(_("basicSetting2g_ssidempty"));}else if(ret2==-2){parent.warninfo_show(_("basicSetting2g_ssidlengthlimit"));}else if(ret2==-3){parent.warninfo_show(_("basicSetting2g_ssidspacelimit"));}else if(ret2==-4){parent.warninfo_show(_("basicSetting2g_ssidcharlimit"));}return;}}
if(is2G&&!checkSSIDRepid(ssid_2G,"2.4G",index))
{parent.warninfo_show(_("wlanMapSettingAll_ssidduplicated2G"));return;}
if(is5G&&!checkSSIDRepid(ssid_5G,"5G",index))
{parent.warninfo_show(_("wlanMapSettingAll_ssidduplicated5G"));return;}
if(is2G){ret1=isValidPassword(password_2G);if(ret1==-1||ret1==-2||ret1==-3||ret1==-4){if(ret1==-1){parent.warninfo_show(_("basicSetting2g_pwdempty"));}else if(ret1==-2){parent.warninfo_show(_("basicSetting2g_pwdlengthlimit"));}else if(ret1==-3){parent.warninfo_show(_("basicSetting2g_pwdcharlimit"));}else if(ret1==-4){parent.warninfo_show(_("basicSetting2g_pwdspacelimit"));}return;}}
if(is5G){ret2=isValidPassword(password_5G);if(ret2==-1||ret2==-2||ret2==-3||ret2==-4){if(ret2==-1){parent.warninfo_show(_("basicSetting2g_pwdempty"));}else if(ret2==-2){parent.warninfo_show(_("basicSetting2g_pwdlengthlimit"));}else if(ret2==-3){parent.warninfo_show(_("basicSetting2g_pwdcharlimit"));}else if(ret2==-4){parent.warninfo_show(_("basicSetting2g_pwdspacelimit"));}return;}}
var bs_enable_id="Chk_BandSteeringEnable_"+(index+1);
setBssInfo(index);}