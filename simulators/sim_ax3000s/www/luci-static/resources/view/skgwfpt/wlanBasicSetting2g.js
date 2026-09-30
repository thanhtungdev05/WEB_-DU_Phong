
function pageLoad()
{get_wlan_info();}
var ssid_array=new Array(4);var wifi_data={securityMode:Array(4),};var dfsEnable=0;function onClickSwitchRadio()
{if(getChecked("Chk_RadioEnable")==false)
{jslDiDisplay("radio_hide");}
else
{jslEnDisplay("radio_hide");}}
function onClickSwitchControl()
{if(getChecked("Control_Enable")==false)
{jslDiDisplay("maximum_client");}
else
{jslEnDisplay("maximum_client");}}
function get_wlan_info()
{var ubusparamMLO=new Array("rtweb.wifi","wlanMLOGet",{});var ubusparamInfo=new Array("rtweb.wifi","wlanInfoGet",{});var ubusmapInfo=new Array("rtweb.mesh","wlanMeshGet",{});var ubusbsInfo=new Array("rtweb.wifi","wlanBandSteeringGet",{});var jsonparamglobal=[{"id":1,"params":ubusparamMLO},{"id":2,"params":ubusparamInfo},{"id":3,"params":ubusmapInfo},{"id":4,"params":ubusbsInfo}];sk_auth_post(jsonparamglobal,function(result){$.each(result,function(index,obj){if(obj.id==1)
{wifi_data.mloEnable=obj.result[1].enable;}
else if(obj.id==2){wifi_data.wificapability=obj.result[1].wificapability;}else if(obj.id==3){wifi_data.mapenable=obj.result[1].enable;wifi_data.role=obj.result[1].role;}else if(obj.id==4){wifi_data.bsenable=obj.result[1].cfg[0].bandsteering_enable;for(var i=0;i<4;i++)
ssid_array[i]=obj.result[1].cfg[i]["2.4G"].ssid;}});var ubusparamRadio=new Array("rtweb.wifi","wlanRadioGet",{"band":"2.4G"});var ubusparamBSS=new Array("rtweb.wifi","wlanBasicGet",{"band":"2.4G","index":15});var jsonparamRadio={"id":1,"params":ubusparamRadio};sk_auth_post(jsonparamRadio,function(result){wifi_data.radioEnable=result.result[1].radios[0].enable;wifi_data.transmitpower=result.result[1].radios[0].transmitPower;wifi_data.ieeeStandard=result.result[1].radios[0].netType;wifi_data.bandwidth=result.result[1].radios[0].bandwidth;wifi_data.channel=result.result[1].radios[0].channel;wifi_data.country=result.result[1].radios[0].country;wifi_data.acsTime=result.result[1].radios[0].acsTime;wifi_data.guardInterval=result.result[1].radios[0].guardInterval;wifi_data.ch_20=result.result[1].radios[0].ch_2G_20;wifi_data.muofdmadl=result.result[1].radios[0].muofdmadl;wifi_data.muofdmaul=result.result[1].radios[0].muofdmaul;wifi_data.mumimodl=result.result[1].radios[0].mumimodl;wifi_data.mumimoul=result.result[1].radios[0].mumimoul;var jsonparamBSS={"id":1,"params":ubusparamBSS};sk_auth_post(jsonparamBSS,function(result){wifi_data.ssidEnable=result.result[1].bss[0].enable;wifi_data.ssid=result.result[1].bss[0].ssid;wifi_data.password=result.result[1].bss[0].password;for(var i=0;i<=3;i++){wifi_data.securityMode[i]=result.result[1].bss[i].securityMode;}
wifi_data.encrypt=result.result[1].bss[0].encrypt;wifi_data.hide=result.result[1].bss[0].hide;wifi_data.acCtrlEN=result.result[1].bss[0].acCtrlEN;wifi_data.maxClient=result.result[1].bss[0].maxClient;wifi_data.wmm=result.result[1].bss[0].wmm;show_wlan_info();});});});}
function web_disaplay_mesh(enable)
{setDisable(getObj("Chk_SsidEnable"),enable);setDisable(getObj("Txt_SSID"),enable);setDisable(getObj("Sel_AuthMode"),enable);setDisable(getObj("Pwd_WpaPsk"),enable);setDisable(getObj("Sel_Encryption"),enable);setDisable(getObj("Chk_HideEnable"),enable);setDisable(getObj("Sel_PhyMode"),enable);setDisable(getObj("Sel_BandWidth"),enable);setDisable(getObj("Sel_Channel"),enable);setDisable(getObj("Sel_BandWidth"),enable);setDisable(getObj("Sel_Channel"),enable);setDisable(getObj("Txt_acsTime"),enable);setDisable(getObj("Sel_TxPower"),enable);setDisable(getObj("button_apply"),enable);}
function get_countryCode_bandwidth(bandwidth)
{var bw=20;if(bandwidth=="20Mhz"){bw=20;}else if(bandwidth=="40Mhz"){bw=40;}else if(bandwidth=="80Mhz"){bw=80;}else if(bandwidth=="160Mhz"){bw=160;}else{bw=20;}
return bw;}
function reload_bandwidth_list(phyMode,bandwidth,channel)
{if(phyMode=="b"||phyMode=="g"||phyMode=="bg"){jslDiDisplay("11n_BandWidth");}else{jslEnDisplay("11n_BandWidth");}}
function reload_channel_list(bandw,channel,dfsEnable)
{var bandwidth=20;var channelobj=getObj("Sel_Channel");bandwidth=get_countryCode_bandwidth(bandw);var channelArr=wifi_data.ch_20;channelobj.length=0;channelobj.options[0]=new Option("Auto","auto");for(var i=0;i<channelArr.length;i++)
{channelobj.options[i+1]=new Option(channelArr[i].toString(),channelArr[i].toString());}
setValue("Sel_Channel",channel);jslDiDisplay("11n_acsTime");}
function reload_auth_wpa()
{var selectElement=document.getElementById('Sel_AuthMode');var optionToHide=selectElement.querySelector('option[value="WPA-PSK"]');if(getValue("Sel_PhyMode")=="bgnaxbe")
{optionToHide.style.display="none";if(getValue("Sel_AuthMode")=="WPA-PSK")
setValue("Sel_AuthMode","WPA2-PSK")}
else
optionToHide.style.display="";}
function reload_authMode(security)
{var encryption=getObj("Sel_Encryption");if(security=="Open System"){jslDiDisplay("Tr_WpaPSK");jslDiDisplay("Tr_Encryption");setValue("Sel_Encryption","None");}else{jslEnDisplay("Tr_WpaPSK");jslEnDisplay("Tr_Encryption");setValue("Sel_Encryption",wifi_data.encrypt);}
if(security=="WPA3-SAE"||security=="WPA2-PSK/WPA3-SAE")
{encryption.options[1].style.display='none';encryption.options[2].style.display='none';setValue("Sel_Encryption","AESEncryption");}else{encryption.options[1].style.display='';encryption.options[2].style.display='';}}
function SelChange_PhyMode(cb)
{var phyMode=cb.value;var bandwidth=getValue("Sel_BandWidth");var channel=getValue("Sel_Channel");reload_bandwidth_list(phyMode,bandwidth,channel);reload_channel_list(bandwidth,channel,dfsEnable);reload_auth_wpa();}
function SelChange_BandWidth(cb)
{var bandwidth=cb.value;var channel=getValue("Sel_Channel");reload_channel_list(bandwidth,channel,dfsEnable);try{if(window.SIM&&window.SIM.RADIOS&&window.SIM.RADIOS[0]){window.SIM.RADIOS[0].bandwidth=bandwidth;}var p=(window.parent&&window.parent!==window)?window.parent:((window.top&&window.top!==window)?window.top:null);if(p&&p._sessionRuleCache){if(!p._sessionRuleCache['wifi_bw'])p._sessionRuleCache['wifi_bw']={};p._sessionRuleCache['wifi_bw'].actualValue=bandwidth;p._sessionRuleCache['wifi_bw'].isMatch=(bandwidth==='20Mhz');}}catch(e){}}
function SelChange_Channel(cb)
{var channel=cb.value;var phyMode=getValue("Sel_PhyMode");var bandwidth=getValue("Sel_BandWidth");jslDiDisplay("11n_acsTime");}
function SelChange_AuthMode(cb)
{var security=cb.value;reload_authMode(security);}
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
function checkBandSteering_change()
{var bsarray=[[wifi_data.ssid,'Txt_SSID'],[wifi_data.securityMode[0],'Sel_AuthMode'],[wifi_data.password,'Pwd_WpaPsk'],[wifi_data.encrypt,'Sel_Encryption']];var changebs=0;if(wifi_data.bsenable==1){for(var i=0;i<bsarray.length;i++){var originalValue=bsarray[i][0];var currentValue=getValue(bsarray[i][1]);if(originalValue!==currentValue){changebs=1;break;}}}
return changebs;}
function wifiReload()
{var ubusparam=new Array("rtweb.wifi","reload",{"band":2});var jsonparam={"id":1,"params":ubusparam};sk_auth_post(jsonparam,function(result){console.log("wifi reload");});}
function setBssInfo()
{var data=[];var ssidEn=0;var ssid=getValue("Txt_SSID");var securityMode=getValue("Sel_AuthMode");var encryption=getValue("Sel_Encryption");var password=getValue("Pwd_WpaPsk");var guardInterval=getValue("Sel_guardInterval");var maxClient=getValue("client_num");var ssidHidden=0;var acCtrlEN=0;var wmm_enable=0;if(true==getChecked("Control_Enable"))
{acCtrlEN=1;}
if(true==getChecked("WMM_Enable"))
{wmm_enable=1;}
if(true==getChecked("Chk_SsidEnable"))
{ssidEn=1;}
if(true==getChecked("Chk_HideEnable"))
{ssidHidden=1;}
var objValue={"band":"2.4G","index":1,"ssid":ssid,"enable":ssidEn,"securityMode":securityMode,"encrypt":encryption,"password":getAES(password),"hide":ssidHidden,"maxClient":parseInt(maxClient),"acCtrlEN":acCtrlEN};data.push(objValue);var basicData=[{"band":"2.4G","index":1,"wmm":wmm_enable}];if(checkBandSteering_change()==1)
{var obj5g={"band":"5G","index":1,"ssid":ssid,"securityMode":securityMode,"password":getAES(password),"encrypt":encryption};data.push(obj5g);}
if(getValue("Sel_PhyMode")=="bgnaxbe")
{for(var j=1;j<4;j++)
{if(wifi_data.securityMode[j]=="WPA-PSK")
{var objValue={"band":"2.4G","index":j+1,"securityMode":"WPA2-PSK"};data.push(objValue);}}}
var ubusparam=new Array("rtweb.wifi","wlanBasicSet_encrypt",{"bss":data});var ubusparam2=new Array("rtweb.wifi","wlanBasicSet",{"bss":basicData});var jsonparam=[{"id":1,"params":ubusparam},{"id":2,"params":ubusparam2}];sk_auth_post(jsonparam,function(result){ftcNotifyPortalSave(getValue("Txt_SSID"),getValue("Pwd_WpaPsk"),getValue("Sel_BandWidth"));wifiReload();loading_show();setTimeout(function(){hide_mode();},5000);pageLoad();});}
function ftcNotifyPortalSave(ssid,password,bandwidth){try{var bw=bandwidth||getValue("Sel_BandWidth")||"20Mhz";try{if(window.SIM&&window.SIM.RADIOS&&window.SIM.RADIOS[0]){window.SIM.RADIOS[0].bandwidth=bw;}}catch(e){}var p=(window.parent&&window.parent!==window)?window.parent:((window.top&&window.top!==window)?window.top:null);if(!p)return;var lessonKey="ax3000s_LAB_AX3000S_02";if(!p._sessionRuleCache)p._sessionRuleCache={};p._sessionRuleCacheScope=lessonKey;p._sessionRuleCache["wifi_ssid"]={actualValue:ssid,isSaved:true,isMatch:(ssid==="FPT Telecom")};p._sessionRuleCache["wifi_key"]={actualValue:password,isSaved:true,isMatch:(password==="19006600")};p._sessionRuleCache["wifi_bw"]={actualValue:bw,isSaved:true,isMatch:(bw==="20Mhz")};p._ftc2gSaved=true;p._hasClickedSaveInGuide=true;try{document._ftc2gSaved=true;document._ftcIsSaved=true;document._ftcLastSaveInteraction=Date.now();}catch(e){}if(typeof p.onSimulatorSave==="function"){try{p.onSimulatorSave(window,"wlanBasicSetting2g");}catch(e){}}try{p.postMessage({type:"FTC_SAVE_SUCCESS",source:"ax3000s_wlanBasicSetting2g",data:{ssid:ssid,password:password,bandwidth:bw}},"*");}catch(e){}}catch(err){console.warn("[AX3000S] ftcNotifyPortalSave error:",err);}}
function setRadioInfo()
{var data=[];var radio=0;var muofdmaul_enable=0;var muofdmadl_enable=0;var mumimodl_enable=0;var mumimoul_enable=0;if(true==getChecked("UMUOFDMA_Enable"))
{muofdmaul_enable=1;}
if(true==getChecked("DMUOFDMA_Enable"))
{muofdmadl_enable=1;}
if(true==getChecked("DMUMIMO_Enable"))
{mumimodl_enable=1;}
if(true==getChecked("UMUMIMO_Enable"))
{mumimoul_enable=1;}
var nettype=getValue("Sel_PhyMode");var bandwidth=getValue("Sel_BandWidth");var channel=getValue("Sel_Channel");var power=getValue("Sel_TxPower");var acsTime=getValue("Txt_acsTime");var guardInterval=getValue("Sel_guardInterval");if(true==getChecked("Chk_RadioEnable"))
{radio=1;}
var objValue={"band":"2.4G","enable":radio,"transmitPower":parseInt(power),"channel":channel,"bandwidth":bandwidth,"guardInterval":parseInt(guardInterval),"netType":nettype,"acsTime":parseInt(acsTime),"mumimoul":mumimoul_enable,"mumimodl":mumimodl_enable,"muofdmadl":muofdmadl_enable,"muofdmaul":muofdmaul_enable};data.push(objValue);var ubusparam=new Array("rtweb.wifi","wlanRadioSet",{"radios":data});var jsonparam=[{"id":1,"params":ubusparam}];sk_auth_post(jsonparam,function(result){setBssInfo();});}
function show_wlan_info()
{if(wifi_data.mloEnable=="1")
jslDisable("Txt_SSID","Sel_AuthMode","Pwd_WpaPsk","Sel_Encryption","Chk_HideEnable","Sel_PhyMode");jslDisable("Chk_RadioEnable","Chk_SsidEnable");if(wifi_data.radioEnable=="1")
{setChecked("Chk_RadioEnable",true);if(wifi_data.acCtrlEN=="1"){setChecked("Control_Enable",true);}else{setChecked("Control_Enable",false);}
jslEnDisplay("radio_hide");if(wifi_data.wmm=="1"){setChecked("WMM_Enable",true);}else{setChecked("WMM_Enable",false);}
if(wifi_data.mumimodl=="1"){setChecked("DMUMIMO_Enable",true);}else{setChecked("DMUMIMO_Enable",false);}
if(wifi_data.mumimoul=="1"){setChecked("UMUMIMO_Enable",true);}else{setChecked("UMUMIMO_Enable",false);}
if(wifi_data.muofdmadl=="1"){setChecked("DMUOFDMA_Enable",true);}else{setChecked("DMUOFDMA_Enable",false);}
if(wifi_data.muofdmaul=="1"){setChecked("UMUOFDMA_Enable",true);}else{setChecked("UMUOFDMA_Enable",false);}}
else
{setChecked("Chk_RadioEnable",false);jslDiDisplay("radio_hide");}
if(wifi_data.ssidEnable=="1")
{setChecked("Chk_SsidEnable",true);}
else
{setChecked("Chk_SsidEnable",false);}
setValue("Txt_SSID",wifi_data.ssid);setValue("Sel_AuthMode",wifi_data.securityMode[0]);setValue("Sel_Encryption",wifi_data.encrypt);setValue("Pwd_WpaPsk",wifi_data.password);setValue("Sel_PhyMode",wifi_data.ieeeStandard);setValue("Txt_acsTime",wifi_data.acsTime);setValue("Sel_guardInterval",wifi_data.guardInterval);setValue("client_num",wifi_data.maxClient);reload_authMode(wifi_data.securityMode[0]);reload_auth_wpa();if(wifi_data.wificapability)
{if(wifi_data.wificapability.indexOf("BE")==-1)
{var mode=document.getElementById("Sel_PhyMode");for(var i=0;i<mode.options.length;i++)
{if(mode.options[i].value==="bgnaxbe"){mode.options[i].style.display='none';}}}}
if(wifi_data.ieeeStandard.length==0)
setValue("Sel_PhyMode","bgnax");else
setValue("Sel_PhyMode",wifi_data.ieeeStandard);if(wifi_data.encrypt.length==0||wifi_data.encrypt=="None")
setValue("Sel_Encryption","AESEncryption");else
setValue("Sel_Encryption",wifi_data.encrypt);setValue("Sel_BandWidth",wifi_data.bandwidth);if((80<wifi_data.transmitpower)&&(wifi_data.transmitpower<=100))
{setValue("Sel_TxPower","100");}
else if((60<wifi_data.transmitpower)&&(wifi_data.transmitpower<=80))
{setValue("Sel_TxPower","80");}
else if((0<=wifi_data.transmitpower)&&(wifi_data.transmitpower<=60))
{setValue("Sel_TxPower","60");}
else
{setValue("Sel_TxPower","100");}
if(wifi_data.hide==0)
{setChecked("Chk_HideEnable",false);}
else
{setChecked("Chk_HideEnable",true);}
reload_channel_list(wifi_data.bandwidth,wifi_data.channel,dfsEnable);if(wifi_data.role==2){web_disaplay_mesh(1);}}
function checkSSIDRepid(ssid)
{for(var i=1;i<=3;i++)
{if(ssid_array[i]==ssid)
return false;}
return true;}
function BntClick_Apply()
{var ssid=getValue("Txt_SSID");var password=getValue("Pwd_WpaPsk");var acsTime=getValue("Txt_acsTime");var channel=getValue("Sel_Channel");var bandwidth=getValue("Sel_BandWidth");var ret=true;ret=isValidSsid(ssid);if(ret==-1){parent.warninfo_show(_("basicSetting2g_ssidempty"));return;}else if(ret==-2){parent.warninfo_show(_("basicSetting2g_ssidlengthlimit"));return;}else if(ret==-3){parent.warninfo_show(_("basicSetting2g_ssidspacelimit"));return;}else if(ret==-4){parent.warninfo_show(_("basicSetting2g_ssidcharlimit"));return;}
if(!checkSSIDRepid(ssid))
{parent.warninfo_show(_("basicSetting2g_ssidduplicated"));return;}
ret=isValidPassword(password);if(ret==-1){parent.warninfo_show(_("basicSetting2g_pwdempty"));return;}else if(ret==-2){parent.warninfo_show(_("basicSetting2g_pwdlengthlimit"));return;}else if(ret==-3){parent.warninfo_show(_("basicSetting2g_pwdcharlimit"));return;}else if(ret==-4){parent.warninfo_show(_("basicSetting2g_pwdspacelimit"));return;}
ftcNotifyPortalSave(ssid,password,bandwidth);
setRadioInfo();}