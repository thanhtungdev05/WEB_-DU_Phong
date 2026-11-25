
function pageLoad()
{get_wlan_info();}
var wifi_data={securityMode:Array(4),};var dfsEnable=0;function onClickSwitchRadio()
{if(getChecked("Chk_RadioEnable")==false)
{jslDiDisplay("radio_hide");}
else
{jslEnDisplay("radio_hide");}}
function web_disaplay_mesh(enable)
{setDisable(getObj("Chk_SsidEnable"),enable);setDisable(getObj("Txt_SSID"),enable);setDisable(getObj("Sel_AuthMode"),enable);setDisable(getObj("Pwd_WpaPsk"),enable);setDisable(getObj("Sel_Encryption"),enable);setDisable(getObj("Chk_HideEnable"),enable);setDisable(getObj("Sel_PhyMode"),enable);setDisable(getObj("Sel_BandWidth"),enable);setDisable(getObj("Sel_Channel"),enable);setDisable(getObj("Sel_BandWidth"),enable);setDisable(getObj("Sel_Channel"),enable);setDisable(getObj("Txt_acsTime"),enable);setDisable(getObj("Sel_TxPower"),enable);setDisable(getObj("button_apply"),enable);showhide("11n_DFSEnable",!enable);}
function web_disaplay_repeater(enable)
{setDisable(getObj("Sel_Channel"),enable);}
function reset_bandwidth_option()
{var bandwidthobj=getObj("Sel_BandWidth");if(wifi_data.ch_20.length==0){bandwidthobj.options[1].style.display='none';}
if(wifi_data.ch_40.length==0){bandwidthobj.options[2].style.display='none';}
if(wifi_data.ch_80.length==0){bandwidthobj.options[3].style.display='none';}
if(wifi_data.ch_160.length==0){bandwidthobj.options[4].style.display='none';}}
function get_wlan_info()
{var ubusparamMLO=new Array("rtweb.wifi","wlanMLOGet",{});var ubusparamInfo=new Array("rtweb.wifi","wlanInfoGet",{});var ubusmapInfo=new Array("rtweb.mesh","wlanMeshGet",{});var ubusbsInfo=new Array("rtweb.wifi","wlanGlobalGet",{});var ubusRepeaterInfo=new Array("rtweb.wifi","wlanApClientGet",{});var ubusBandsteeInfo=new Array("rtweb.wifi","wlanBandSteeringGet",{"index":1});var jsonparamglobal=[{"id":1,"params":ubusparamMLO},{"id":2,"params":ubusparamInfo},{"id":3,"params":ubusmapInfo},{"id":4,"params":ubusbsInfo},{"id":5,"params":ubusRepeaterInfo},{"id":6,"params":ubusBandsteeInfo}];sk_auth_post(jsonparamglobal,function(result){$.each(result,function(index,obj){if(obj.id==1)
{wifi_data.mloEnable=obj.result[1].enable;}
else if(obj.id==2){wifi_data.wificapability=obj.result[1].wificapability;}else if(obj.id==3){wifi_data.mapenable=obj.result[1].enable;wifi_data.role=obj.result[1].role;}else if(obj.id==6){wifi_data.bsenable=obj.result[1].cfg[0].bandsteering_enable;}else if(obj.id==5){wifi_data.RepeaterEnable=obj.result[1].enable;wifi_data.RepeaterBand=obj.result[1].band;wifi_data.RepeaterLink=obj.result[1].link;}});var ubusparamRadio=new Array("rtweb.wifi","wlanRadioGet",{"band":"5G"});var ubusparamBSS=new Array("rtweb.wifi","wlanBasicGet",{"band":"5G","index":15});var jsonparamRadio={"id":1,"params":ubusparamRadio};sk_auth_post(jsonparamRadio,function(result){wifi_data.radioEnable=result.result[1].radios[0].enable;wifi_data.transmitpower=result.result[1].radios[0].transmitPower;wifi_data.ieeeStandard=result.result[1].radios[0].netType;wifi_data.bandwidth=result.result[1].radios[0].bandwidth;wifi_data.channel=result.result[1].radios[0].channel;wifi_data.country=result.result[1].radios[0].country;wifi_data.acsTime=result.result[1].radios[0].acsTime;wifi_data.dfs=result.result[1].radios[0].dfschannelEnable;wifi_data.guardInterval=result.result[1].radios[0].guardInterval;wifi_data.ch_20=result.result[1].radios[0].ch_5G_20;wifi_data.ch_40=result.result[1].radios[0].ch_5G_40;wifi_data.ch_80=result.result[1].radios[0].ch_5G_80;wifi_data.ch_160=result.result[1].radios[0].ch_5G_160;wifi_data.muofdmadl=result.result[1].radios[0].muofdmadl;wifi_data.muofdmaul=result.result[1].radios[0].muofdmaul;wifi_data.mumimodl=result.result[1].radios[0].mumimodl;wifi_data.mumimoul=result.result[1].radios[0].mumimoul;var jsonparamBSS={"id":1,"params":ubusparamBSS};sk_auth_post(jsonparamBSS,function(result){wifi_data.ssidEnable=result.result[1].bss[0].enable;wifi_data.ssid=result.result[1].bss[0].ssid;wifi_data.password=result.result[1].bss[0].password;for(var i=0;i<=3;i++){wifi_data.securityMode[i]=result.result[1].bss[i].securityMode;}
wifi_data.encrypt=result.result[1].bss[0].encrypt;wifi_data.hide=result.result[1].bss[0].hide;wifi_data.acCtrlEN=result.result[1].bss[0].acCtrlEN;wifi_data.maxClient=result.result[1].bss[0].maxClient;wifi_data.wmm=result.result[1].bss[0].wmm;show_wlan_info();reset_bandwidth_option();});});});}
function get_countryCode_bandwidth(bandwidth)
{var bw=20;if(bandwidth=="20Mhz"){bw=20;}else if(bandwidth=="40Mhz"){bw=40;}else if(bandwidth=="80Mhz"){bw=80;}else if(bandwidth=="160Mhz"){bw=160;}else{bw=20;}
return bw;}
function reload_bandwidth_list(phyMode,bandwidth,channel)
{var bandwidthobj=getObj("Sel_BandWidth");var adjust_bandwidth=bandwidth;var bw_40=40,bw_80=80,bw_160=160,find=0,support_ax=1,support_ac=1;if(phyMode=="a"){jslDiDisplay("11n_BandWidth5G");}else{jslEnDisplay("11n_BandWidth5G");}
if(phyMode.indexOf("ax")==-1){bandwidthobj.options[4].style.display='none';support_ax=0;if(bandwidth=="160Mhz")
{setValue("Sel_BandWidth","Auto");adjust_bandwidth="Auto";}
if(phyMode.indexOf("ac")==-1){if(bandwidth=="80Mhz")
{setValue("Sel_BandWidth","Auto");adjust_bandwidth="Auto";}
support_ac=0;bandwidthobj.options[1].style.display='';bandwidthobj.options[2].style.display='';bandwidthobj.options[3].style.display='none';bandwidthobj.options[4].style.display='none';}else{support_ac=1;bandwidthobj.options[1].style.display='';bandwidthobj.options[2].style.display='';bandwidthobj.options[3].style.display='';bandwidthobj.options[4].style.display='none';}}else{bandwidthobj.options[1].style.display='';bandwidthobj.options[2].style.display='';bandwidthobj.options[3].style.display='';bandwidthobj.options[4].style.display='';support_ax=1;support_ac=1;}
if(dfsEnable==0)
{bandwidthobj.options[4].style.display='none';}
if(channel=="auto")
return;var channelArr40=wifi_data.ch_40;find=0;for(var j=0;j<channelArr40.length;j++)
{if(channelArr40[j]==parseInt(channel))
{find=1;break;}}
if(find){bandwidthobj.options[2].style.display='';}else{bandwidthobj.options[2].style.display='none';}
if(support_ac)
{var channelArr80=wifi_data.ch_80;find=0;for(var j=0;j<channelArr80.length;j++)
{if(channelArr80[j]==parseInt(channel))
{find=1;break;}}
if(find){bandwidthobj.options[3].style.display='';}else{bandwidthobj.options[3].style.display='none';}}
if(support_ax)
{find=0;var channelArr160=wifi_data.ch_160;for(var j=0;j<channelArr160.length;j++)
{if(channelArr160[j]==parseInt(channel))
{find=1;}}
if(find&&dfsEnable==1){bandwidthobj.options[4].style.display='';}else{bandwidthobj.options[4].style.display='none';if(bandwidth=="160Mhz")
{adjust_bandwidth="Auto";}}}
setValue("Sel_BandWidth",adjust_bandwidth);reset_bandwidth_option();}
function reload_channel_list(bandw,channel,dfsEnable)
{var bandwidth=20,found=0;var channelobj=getObj("Sel_Channel");var channelArr=wifi_data.ch_20;bandwidth=get_countryCode_bandwidth(bandw);if(bandwidth==20){channelArr=wifi_data.ch_20;}else if(bandwidth==40){channelArr=wifi_data.ch_40;}else if(bandwidth==80){channelArr=wifi_data.ch_80;}else if(bandwidth==160){channelArr=wifi_data.ch_160;}else{channelArr=wifi_data.ch_20;}
channelobj.length=0;channelobj.options[0]=new Option("Auto","auto");for(var i=0;i<channelArr.length;i++)
{channelobj.options[i+1]=new Option(channelArr[i].toString(),channelArr[i].toString());}
for(var j=0;j<channelobj.length;j++)
{var channelInt=parseInt(channelobj[j].value);if(channelInt>=52&&channelInt<=144)
{if(dfsEnable==1)
{channelobj[j].style.display='';}else{channelobj[j].style.display='none';}}
if(parseInt(channel)==channelobj[j].value&&channelobj[j].style.display!='none')
{found=1;}}
if(found==1){setValue("Sel_Channel",channel);jslDiDisplay("11n_acsTime5G");}else{setValue("Sel_Channel","auto");jslEnDisplay("11n_acsTime5G");if(getValue("Txt_acsTime")=="0")
setValue("Txt_acsTime","900");}
jslDiDisplay("11n_acsTime5G");}
function reload_auth_wpa()
{var selectElement=document.getElementById('Sel_AuthMode');var optionToHide=selectElement.querySelector('option[value="WPA-PSK"]');if(getValue("Sel_PhyMode")=="anacaxbe")
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
{var bandwidth=cb.value;var channel=getValue("Sel_Channel");reload_channel_list(bandwidth,channel,dfsEnable);}
function SelChange_Channel(cb)
{var channel=cb.value;var phyMode=getValue("Sel_PhyMode");var bandwidth=getValue("Sel_BandWidth");jslDiDisplay("11n_acsTime5G");}
function SelChange_AuthMode(cb)
{var security=cb.value;reload_authMode(security);}
function ChkClick_DfsEnable(cb)
{var bandwidth=getValue("Sel_BandWidth");var channel=getValue("Sel_Channel");var phyMode=getValue("Sel_PhyMode");if(getChecked("Chk_DFSEnable")==false){dfsEnable=0;if(bandwidth=="160Mhz"){setValue("Sel_BandWidth","Auto");bandwidth="Auto";}}else{dfsEnable=1;}
reload_channel_list(bandwidth,channel,dfsEnable);reload_bandwidth_list(phyMode,bandwidth,channel);}
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
{warninfo_show(_('wlanBasicSeting5g_ssidNone'));return false;}
if(ssid.length>32)
{warninfo_show(_('wlanBasicSeting5g_ssidTooLong'));return false;}
if(isValidAscii(ssid))
{warninfo_show(_('wlanBasicSeting5g_ssidInvalid'));return false;}
return true;}
function checkWlanPassword(password)
{if(isValidWPAPskKey(password)!=true){warninfo_show(_('wlanBasicSeting5g_passwordTooLong'));return false;}
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
{var ubusparam=new Array("rtweb.wifi","reload",{"band":5});var jsonparam={"id":1,"params":ubusparam};sk_auth_post(jsonparam,function(result){console.log("wifi reload");});}
function setBssInfo()
{var data=[];var ssidEn=0;var ssid=getValue("Txt_SSID");var securityMode=getValue("Sel_AuthMode");var encryption=getValue("Sel_Encryption");var password=getValue("Pwd_WpaPsk");var maxClient=getValue("client_num");var ssidHidden=0;var acCtrlEN=0;var wmm_enable=0;if(true==getChecked("Control_Enable"))
{acCtrlEN=1;}
if(true==getChecked("WMM_Enable"))
{wmm_enable=1;}
if(true==getChecked("Chk_SsidEnable"))
{ssidEn=1;}
if(true==getChecked("Chk_HideEnable"))
{ssidHidden=1;}
var objValue={"band":"5G","index":1,"ssid":ssid,"enable":ssidEn,"securityMode":securityMode,"encrypt":encryption,"password":getAES(password),"hide":ssidHidden,"maxClient":parseInt(maxClient),"acCtrlEN":acCtrlEN};data.push(objValue);var basicData=[{"band":"5G","index":1,"wmm":wmm_enable}];if(checkBandSteering_change()==1)
{var obj24g={"band":"2.4G","index":1,"ssid":ssid,"securityMode":securityMode,"password":getAES(password),"encrypt":encryption};data.push(obj24g);}
if(getValue("Sel_PhyMode")=="anacaxbe")
{for(var j=1;j<4;j++)
{if(wifi_data.securityMode[j]=="WPA-PSK")
{var objValue={"band":"5G","index":j+1,"securityMode":"WPA2-PSK"};data.push(objValue);}}}
var ubusparam=new Array("rtweb.wifi","wlanBasicSet_encrypt",{"bss":data});var ubusparam2=new Array("rtweb.wifi","wlanBasicSet",{"bss":basicData});var jsonparam=[{"id":1,"params":ubusparam},{"id":2,"params":ubusparam2}];sk_auth_post(jsonparam,function(result){wifiReload();loading_show();setTimeout(function(){hide_mode();},5000);});}
function setRadioInfo()
{var data=[];var radio=0,dfs=0;var nettype=getValue("Sel_PhyMode");var bandwidth=getValue("Sel_BandWidth");var channel=getValue("Sel_Channel");var power=getValue("Sel_TxPower");var acsTime=getValue("Txt_acsTime");var guardInterval=getValue("Sel_guardInterval");var muofdmaul_enable=0;var muofdmadl_enable=0;var mumimodl_enable=0;var mumimoul_enable=0;if(true==getChecked("UMUOFDMA_Enable"))
{muofdmaul_enable=1;}
if(true==getChecked("DMUOFDMA_Enable"))
{muofdmadl_enable=1;}
if(true==getChecked("DMUMIMO_Enable"))
{mumimodl_enable=1;}
if(true==getChecked("UMUMIMO_Enable"))
{mumimoul_enable=1;}
if(true==getChecked("Chk_RadioEnable"))
{radio=1;}
if(true==getChecked("Chk_DFSEnable"))
{dfs=1;}
var objValue={"band":"5G","enable":radio,"transmitPower":parseInt(power),"channel":channel,"bandwidth":bandwidth,"guardInterval":parseInt(guardInterval),"netType":nettype,"acsTime":parseInt(acsTime),"dfschannelEnable":dfs,"mumimoul":mumimoul_enable,"mumimodl":mumimodl_enable,"muofdmadl":muofdmadl_enable,"muofdmaul":muofdmaul_enable};data.push(objValue);var ubusparam=new Array("rtweb.wifi","wlanRadioSet",{"radios":data});var jsonparam=[{"id":1,"params":ubusparam}];sk_auth_post(jsonparam,function(result){setBssInfo();});}
function show_wlan_info()
{if(wifi_data.mloEnable=="1")
jslDisable("Sel_Encryption","Chk_HideEnable","Sel_PhyMode");jslDisable("Chk_RadioEnable","Chk_SsidEnable");if(wifi_data.bsenable==1){jslDisable("Sel_AuthMode","Txt_SSID","Pwd_WpaPsk");}
if(wifi_data.radioEnable=="1")
{setChecked("Chk_RadioEnable",true);if(wifi_data.acCtrlEN=="1"){setChecked("Control_Enable",true);}else{setChecked("Control_Enable",false);}
jslEnDisplay("radio_hide");if(wifi_data.mumimodl=="1"){setChecked("DMUMIMO_Enable",true);}else{setChecked("DMUMIMO_Enable",false);}
if(wifi_data.mumimoul=="1"){setChecked("UMUMIMO_Enable",true);}else{setChecked("UMUMIMO_Enable",false);}
if(wifi_data.muofdmadl=="1"){setChecked("DMUOFDMA_Enable",true);}else{setChecked("DMUOFDMA_Enable",false);}
if(wifi_data.muofdmaul=="1"){setChecked("UMUOFDMA_Enable",true);}else{setChecked("UMUOFDMA_Enable",false);}
if(wifi_data.wmm=="1"){setChecked("WMM_Enable",true);}else{setChecked("WMM_Enable",false);}}
else
{setChecked("Chk_RadioEnable",false);jslDiDisplay("radio_hide");}
if(wifi_data.ssidEnable=="1")
{setChecked("Chk_SsidEnable",true);}
else
{setChecked("Chk_SsidEnable",false);}
setValue("Txt_SSID",wifi_data.ssid);setValue("Sel_AuthMode",wifi_data.securityMode[0]);setValue("Sel_Encryption",wifi_data.encrypt);setValue("Pwd_WpaPsk",wifi_data.password);setValue("Sel_PhyMode",wifi_data.ieeeStandard);setValue("Txt_acsTime",wifi_data.acsTime);setValue("Sel_guardInterval",wifi_data.guardInterval);setValue("client_num",wifi_data.maxClient);reload_authMode(wifi_data.securityMode[0]);reload_auth_wpa();if(wifi_data.wificapability)
{if(wifi_data.wificapability.indexOf("BE")==-1)
{var mode=document.getElementById("Sel_PhyMode");for(var i=0;i<mode.options.length;i++)
{if(mode.options[i].value==="anacaxbe"){mode.options[i].style.display='none';}}}}
if(wifi_data.ieeeStandard.length==0)
setValue("Sel_PhyMode","anacax");else
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
dfsEnable=wifi_data.dfs;if(wifi_data.dfs==0)
{setChecked("Chk_DFSEnable",false);}
else
{setChecked("Chk_DFSEnable",true);}
reload_channel_list(wifi_data.bandwidth,wifi_data.channel,dfsEnable);reload_bandwidth_list(wifi_data.ieeeStandard,wifi_data.bandwidth,wifi_data.channel);if(wifi_data.mapenable==1){if(wifi_data.role==2){web_disaplay_mesh(1);}}else{if(wifi_data.RepeaterEnable==1&&wifi_data.RepeaterBand=="5G"&&wifi_data.RepeaterLink==1){web_disaplay_repeater(1);}}}
function BntClick_Apply()
{var ssid=getValue("Txt_SSID");var password=getValue("Pwd_WpaPsk");var acsTime=getValue("Txt_acsTime");var channel=getValue("Sel_Channel");var ret=true;ret=isValidSsid(ssid);if(ret==-1){warninfo_show(_("basicSetting2g_ssidempty"));return;}else if(ret==-2){warninfo_show(_("basicSetting2g_ssidlengthlimit"));return;}else if(ret==-3){warninfo_show(_("basicSetting2g_ssidspacelimit"));return;}else if(ret==-4){warninfo_show(_("basicSetting2g_ssidcharlimit"));return;}
ret=isValidPassword(password);if(ret==-1){warninfo_show(_("basicSetting2g_pwdempty"));return;}else if(ret==-2){warninfo_show(_("basicSetting2g_pwdlengthlimit"));return;}else if(ret==-3){warninfo_show(_("basicSetting2g_pwdcharlimit"));return;}else if(ret==-4){warninfo_show(_("basicSetting2g_pwdspacelimit"));return;}
setRadioInfo();}