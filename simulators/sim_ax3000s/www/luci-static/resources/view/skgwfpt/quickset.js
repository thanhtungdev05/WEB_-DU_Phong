
var oldlanip;var wan_ip_array=new Array();function SyncIOTSsid(ssid)
{setValue("Txt_SSID_IOT",ssid+"-IOT")
console.log(getValue(Txt_SSID_IOT))}
function ShowDHCPCfg()
{var dhcpmode=parseInt($("input[name='dhcpSrvType']:checked").val());if(dhcpmode==0)
{$("#lancfg_dhcpserver").hide();$("#relayInfo").hide();$("#dhcpstaticTitle").hide();$("#dhcpstaticContent").hide();}
else if(dhcpmode==1)
{dhcpcfg_init(1);$("#lancfg_dhcpserver").show();$("#relayInfo").hide();$("#dhcpstaticTitle").show();}
else
{dhcpcfg_init(2);$("#lancfg_dhcpserver").hide();$("#dhcpstaticTitle").hide();$("#dhcpstaticContent").hide();}}
function dhcpcfg_init(mode)
{var dhcpsparam=new Array("rtweb.dhcpserver","get",{"mode":mode});var jsonparam={"id":1,"params":dhcpsparam};sk_auth_post(jsonparam,function(result){if(mode==1){setValue("dhcpEthStart",result.result[1].startip);setValue("dhcpEthEnd",result.result[1].endip);setValue("dhcpLeasedTime",result.result[1].leasetime);$("input[name='dnsmode'][value='"+result.result[1].dnsmode+"']").prop("checked",true);if(result.result[1].dnsmode==1)
{setValue("dnsPrimary",result.result[1].pridns);setValue("dnsSecondary",result.result[1].secdns);}}else if(mode==2){setValue("dhcpSrvAddr",result.result[1].relay);}});}
function dnsmodeClick()
{var dnsmode=parseInt($("input[name='dnsmode']:checked").val());if(dnsmode==0||dnsmode==2)
{$("#dnsv4Satic").hide();}
else
{$("#dnsv4Satic").show();}}
function setDhcpAddresses(lanIp){var dhcpmode=parseInt($("input[name='dhcpSrvType']:checked").val());if(dhcpmode!=1)
return;var minip=getObj("dhcpEthStart").value;var maxip=getObj("dhcpEthEnd").value;if(isValidIpAddress(getValue("ethIpAddress"))!=true){return false;}
else
{var cparts=lanIp.split(".");var minparts=minip.split(".");var maxparts=maxip.split(".");for(var i=0;i<3;i++)
{minparts[i]=cparts[i];maxparts[i]=cparts[i];}
getObj("dhcpEthStart").value=minparts[0]+"."+minparts[1]+"."+minparts[2]+"."+minparts[3];getObj("dhcpEthEnd").value=maxparts[0]+"."+maxparts[1]+"."+maxparts[2]+"."+maxparts[3];}}
function parse_result(data)
{$.each(data,function(index,obj){if(obj.id==1)
{setValue("ethIpAddress",obj.result[1].ipaddr);setValue("ethSubnetMask",obj.result[1].subnetmask);oldlanip=obj.result[1].ipaddr;}
else
{$("input[name='dhcpSrvType'][value='"+obj.result[1].dhcpmode+"']").prop("checked",true);if(obj.result[1].dhcpmode==1)
{setValue("dhcpEthStart",obj.result[1].startip);setValue("dhcpEthEnd",obj.result[1].endip);setValue("dhcpLeasedTime",obj.result[1].leasetime);$("input[name='dnsmode'][value='"+obj.result[1].dnsmode+"']").prop("checked",true);if(obj.result[1].dnsmode==1)
{setValue("dnsPrimary",obj.result[1].pridns);setValue("dnsSecondary",obj.result[1].secdns);}}
else if(obj.result[1].dhcpmode==2)
{setValue("dhcpSrvAddr",obj.result[1].relay);}
ShowDHCPCfg();dnsmodeClick();}});}
function pageLoad()
{var lanparam=new Array("rtweb.lancfg","getLanCfg",{});var dhcpsparam=new Array("rtweb.dhcpserver","get",{});var jsonparam=[{"id":1,"params":lanparam},{"id":2,"params":dhcpsparam}];sk_auth_post(jsonparam,function(result){parse_result(result);});dhcpStaticIpLoad();var wancfg_status=new Array("gwweb.wancfg","status",{});var wancfg_json={"id":1,"params":wancfg_status};sk_auth_post(wancfg_json,function(result){var wan_json=result.result[1].wan;var wan_num=wan_json.length;var ip_num=0;for(var i=0;i<wan_num;i++){if(wan_json[i].ipaddr==""){continue;}
wan_ip_array[ip_num]=wan_json[i].ipaddr;ip_num++;}});get_wlan_info();ubusGetCollect();}
function check_ip_net(arg)
{var field=arg.split(".");if(field[3]=="255"){return 1;}
for(var i=0;i<wan_ip_array.length;i++){var tmp_field=wan_ip_array[i].split(".");if(tmp_field[0]==field[0]&&tmp_field[1]==field[1]&&tmp_field[2]==field[2]){return 2;}}
if(field[0]=="0"){return 3;}
return 0;}
function checkValidMask(arg)
{if(arg=="255.0.0.0"||arg=="255.255.0.0"||arg=="255.255.255.0")
{return true;}else{return false;}}
function check2IP(startip,endip)
{var i;var startaddr=startip.split('.');var endaddr=endip.split('.');for(i=0;i<4;i++)
{if(Number(startaddr[i])>Number(endaddr[i]))
{return false;}
else if(Number(startaddr[i])<Number(endaddr[i]))
{return true;}}
return true;}
function lancfgv4_pageCheckValue()
{var dhcpmode=parseInt($("input[name='dhcpSrvType']:checked").val());var login_ip=getValue("ethIpAddress");if(check_ip_net(login_ip)==1){warninfo_show(_("IP Address must not be multicast IP"));return false;}else if(check_ip_net(login_ip)==2){warninfo_show(_("IP Address must not be in wan net"));return false;}else if(check_ip_net(login_ip)==3){warninfo_show(_("IP Address must not be invalid IP"));return false;}
if(isValidIpAddress(getValue("ethIpAddress"))==false||isMulticastAddr(getValue("ethIpAddress"))==true){warninfo_show(_("IP Address")+" : "+getValue("ethIpAddress")+" "+_("is invalid"));return false;}
if(isNetworkaddr(getValue("ethIpAddress"),getValue("ethSubnetMask"))){warninfo_show(_("IP Address")+" : "+getValue("ethIpAddress")+" "+_("is invalid"));return false;}
if(isValidSubnetMask(getValue("ethSubnetMask"))==false||isMulticastAddr(getValue("ethSubnetMask"))==true){warninfo_show(_("Subnet Mask")+" : "+getValue("ethSubnetMask")+" "+_("is invalid"));return;}
if(dhcpmode==1)
{if(isValidIpAddress(getValue("dhcpEthStart"))==false||isMulticastAddr(getValue("dhcpEthStart"))==true){warninfo_show(_("Start IP")+" : "+getValue("dhcpEthStart")+" "+_("is invalid"));return;}
if(isNetworkaddr(getValue("dhcpEthStart"),getValue("ethSubnetMask"))){warninfo_show(_("Start IP")+" : "+getValue("dhcpEthStart")+" "+_("is invalid"));return false;}
if(isValidIpAddress(getValue("dhcpEthEnd"))==false||isMulticastAddr(getValue("dhcpEthEnd"))==true){warninfo_show(_("End IP")+" : "+getValue("dhcpEthEnd")+" "+_("is invalid"));return;}
if(isNetworkaddr(getValue("dhcpEthEnd"),getValue("ethSubnetMask"))){warninfo_show(_("End IP")+" : "+getValue("dhcpEthEnd")+" "+_("is invalid"));return false;}
if(calcSubNet(getValue("dhcpEthStart"),getValue("ethSubnetMask"))==calcSubNet(getValue("ethIpAddress"),getValue("ethSubnetMask")))
{if(calcSubNet(getValue("dhcpEthEnd"),getValue("ethSubnetMask"))
!=calcSubNet(getValue("ethIpAddress"),getValue("ethSubnetMask")))
{warninfo_show(_("The DHCP pool end address is not in the same subnet as the LAN IP. Please reconfigure."));return false;}}
else
{if(calcSubNet(getValue("dhcpEthEnd"),getValue("ethSubnetMask"))==calcSubNet(getValue("ethIpAddress"),getValue("ethSubnetMask")))
{warninfo_show(_("The DHCP pool start address is not in the same subnet as the LAN IP. Please reconfigure."));return false;}
else
{warninfo_show(_("The LAN IP address, DHCP pool start address, and DHCP pool end address are not in the same subnet. Please reset them."));return false;}}
if((check2IP(getValue("dhcpEthStart"),getValue("dhcpEthEnd")))!=true)
{warninfo_show(_("The Start IP must smaller than the End IP!"));return false;}
var dnsmode=parseInt($("input[name='dnsmode']:checked").val());if(dnsmode==1)
{if(checkNull(getValue("dnsPrimary"))!=true)
{warninfo_show(_("Primary DNS is cannot be empty!"));return false;}
if(checkNull(getValue("dnsPrimary"))==true&&isValidIpAddressStaticDns(getValue("dnsPrimary"))==false)
{warninfo_show(_("Primary DNS is invalid!"));return false;}
if(checkNull(getValue("dnsSecondary"))==true&&isValidIpAddressStaticDns(getValue("dnsSecondary"))==false)
{warninfo_show(_("Secondary DNS is invalid!"));return false;}}}
else if(dhcpmode==2)
{if(isValidIpAddress(getValue("dhcpSrvAddr"))==false||isMulticastAddr(getValue("dhcpSrvAddr"))==true){warninfo_show(_("DHCP Server is invalid!"));return false;}}
return true;}
function jumpTonew()
{sk_redirect('/cgi-bin/luci/admin/network/lancfg/lancfgv4');}
function lancfg_apply()
{if(lancfgv4_pageCheckValue()==true)
{if(oldlanip!=getValue("ethIpAddress"))
{setTimeout("jumpTonew()",15000);}
var dhcpmode=parseInt($("input[name='dhcpSrvType']:checked").val());var dhcpdata={"dhcpmode":dhcpmode};if(dhcpmode==1)
{dhcpdata.startip=getValue("dhcpEthStart");dhcpdata.endip=getValue("dhcpEthEnd");dhcpdata.leasetime=parseInt(getValue("dhcpLeasedTime"));dhcpdata.dnsmode=parseInt($("input[name='dnsmode']:checked").val());if(dhcpdata.dnsmode==1)
{dhcpdata.pridns=getValue("dnsPrimary");if(checkNull(getValue("dnsSecondary"))==true)
dhcpdata.secdns=getValue("dnsSecondary");}}
else if(dhcpmode==2)
{dhcpdata.relay=getValue("dhcpSrvAddr");}
var lanparam=new Array("rtweb.lancfg","setLanCfg",{"ipaddr":getValue("ethIpAddress"),"netmask":getValue("ethSubnetMask")});var dhcpsparam=new Array("rtweb.dhcpserver","set",dhcpdata);if(calcSubNet(oldlanip,getValue("ethSubnetMask"))
!=calcSubNet(getValue("ethIpAddress"),getValue("ethSubnetMask")))
{var destroyparam=new Array("rtweb.session","destroy",{});var jsonparam=[{"id":1,"params":lanparam},{"id":2,"params":dhcpsparam},{"id":3,"params":destroyparam}];}
else
{var jsonparam=[{"id":1,"params":lanparam},{"id":2,"params":dhcpsparam}];}
sk_auth_post(jsonparam,function(result){if(1==result[0].result[1].result){hide_mode();warninfo_show(result[0].result[1].failreason);}else if(2==result[1].result[1].result){hide_mode();warninfo_show(result[1].result[1].failreason);}else if(oldlanip==getValue("ethIpAddress"))
hide_mode();});}}
function dhcpStaticIpItemLoad(itemValue,index)
{var tableNode=document.getElementById("dhcpstaticTBody");var itemStr="";itemStr+="<tr>";itemStr+="<td><label class='skcheckbox'>";itemStr+=" <input type='checkbox' id='staticIp_Sel_"+index+"' name='staticIpSelect' hidden>"
itemStr+="<label for='staticIp_Sel_"+index+"' class='skcheckbox-label'></label>";itemStr+="</label></td>";itemStr+="<td>"+itemValue.hostname+"</td>";itemStr+="<td>"+itemValue.mac+"</td>";itemStr+="<td>"+itemValue.ipaddr+"</td>";itemStr+="</tr>";tableNode.innerHTML+=itemStr;}
function dhcpStaticIpShowTable(resArr)
{var tableNode=document.getElementById("dhcpstaticTBody");var resArrLen=resArr.staticip.entries.length;tableNode.innerHTML="";if(!resArrLen){tableNode.innerHTML="<tr align='center'><td colspan='4'>"+_("No data yet...")+"</td></tr>";document.getElementById("staticIpAll_Sel").disabled=true;document.getElementById("staticIpAll_Sel").checked=false;return;}
document.getElementById("staticIpAll_Sel").checked=false;document.getElementById("staticIpAll_Sel").disabled=false;for(var i=0;i<resArrLen;i++){dhcpStaticIpItemLoad(resArr.staticip.entries[i],i);}}
function dhcpStaticIpLoad()
{var param=new Array("rtweb.staticip","getStaticIP",{});var jsonstr={"id":1,"params":param};sk_auth_post(jsonstr,function(result){dhcpStaticIpShowTable(result.result[1]);});}
function dhcpStaticIpSelectAll(obj)
{var selist=document.getElementsByName("staticIpSelect");if(selist.length=0)
return;for(var i=0;i<selist.length;i++){if(obj.checked)
selist[i].checked=true;else
selist[i].checked=false;}}
function dhcpStaticIpDel()
{var selist=document.getElementsByName("staticIpSelect");var table=document.getElementById("dhcpstaticTBody");var jsonArr=[];var paramId=1;if(selist.length==0)
return;for(var i=0;i<table.rows.length;i++){var row=table.rows[i];if(getChecked("staticIp_Sel_"+i)){var delmac=row.cells[2].innerText;var delip=row.cells[3].innerText;jsonArr.push({"id":(paramId++),"params":new Array("rtweb.staticip","delStaticIP",{"ipaddr":delip,"mac":delmac})});}}
if(paramId==1){return;}
sk_auth_apply(jsonArr,function(result){dhcpStaticIpLoad();});}
function ipToInt(ip)
{if(ip){var buf=ip.split(".");return(parseInt(buf[0])<<24|parseInt(buf[1])<<16|parseInt(buf[2])<<8|parseInt(buf[3]))>>>0;}else{return 0;}}
function isSameNet(ip1,ip2,mask)
{var addr1=ipToInt(ip1);var addr2=ipToInt(ip2);var Mask=ipToInt(mask);if((addr1&Mask)==(addr2&Mask)){return true;}
return false;}
function dhcpStaticIpAddSubmit()
{var data={};var ipaddr=$("#IpAdd_IpAddr").val();var ethIpAddr=getValue("ethIpAddress");var ethSubMask=getValue("ethSubnetMask");if(ethIpAddr==ipaddr||isSameNet(ethIpAddr,ipaddr,ethSubMask)==false){warninfo_show(_("IP Address ")+ipaddr+_(" is invalid:")+_("Is equal with the RouterIP, Or not in the same network segment with the RouterIP.."));return;}
data.mac=$("#IpAdd_MacAddr").val();data.ipaddr=ipaddr;data.hostname=$("#IpAdd_Hostname").val();var param=new Array("rtweb.staticip","addStaticIP",data);var jsonstr={"id":1,"params":param};sk_auth_apply(jsonstr,function(result){var resultVal=result.result[1].result;if(resultVal!=0){hide_mode();warninfo_show(_("Repeat Error"));}
else{hide_mode();dhcpStaticIpLoad();}});}
function selectDev(obj)
{if(obj.value=="manulMac"){$("#IpAdd_MacAddr").val("");$("#IpAdd_MacAddr").attr("disabled",false);$("#IpAdd_IpAddr").val("");$("#IpAdd_Hostname").val("");}
else{var paramList=obj.value.split(',');$("#IpAdd_MacAddr").val(paramList[0]);$("#IpAdd_MacAddr").attr("disabled",true);$("#IpAdd_IpAddr").val(paramList[1]);$("#IpAdd_Hostname").val(paramList[2]);$("#IpAdd_Hostname").attr("disabled",true);}}
function dhcpStaticIpAdd()
{var data={"type":"form","tittle":_("Add New Rule"),"panelContent":null,"submit":"dhcpStaticIpAddSubmit"};var param=new Array("rtweb.sta","getStaInfo",{});var jsonstr={"id":1,"params":param};sk_auth_post(jsonstr,function(result){var options=new Array();var staList=result.result[1].staDevices;options.push({"value":"manulMac","name":_("Select...")});for(var i=0;i<staList.length;i++){var staNode=staList[i];var param=[staNode.macAddr,staNode.ipAddr,staNode.hostname];options.push({"value":param,"name":staNode.hostname+" ("+staNode.macAddr+")"});}
data.panelContent=new Array();data.panelContent.push({"type":"select","id":"IpAdd_hostInfo","tittle":_("Select Device"),"value":"","option":options,"onchange":"selectDev"});data.panelContent.push({"type":"text","id":"IpAdd_Hostname","tittle":_("Hostname"),"value":""});data.panelContent.push({"type":"text","id":"IpAdd_MacAddr","datatype":"macaddr","tittle":_("MAC Address"),"value":""});data.panelContent.push({"type":"text","id":"IpAdd_IpAddr","datatype":"ipv4","tittle":_("IP Address"),"value":""});panel_show(data);});}
var ssid_array=new Array(4);var wifi_data={securityMode:Array(4),};var ssid_iot_global='';var pwd_iot_global='';var dfsEnable=0;var iot_bs_enable_global=0;var iot_enable_global='';function onClickSwitchRadio()
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
else if(obj.id==2){wifi_data.wificapability=obj.result[1].wificapability;}else if(obj.id==3){wifi_data.mapenable=obj.result[1].enable;wifi_data.role=obj.result[1].role;}else if(obj.id==4){wifi_data.bsenable=obj.result[1].cfg[0].bandsteering_enable;iot_bs_enable_global=obj.result[1].cfg[2].bandsteering_enable;for(var i=0;i<4;i++)
ssid_array[i]=obj.result[1].cfg[i]["2.4G"].ssid;}});var ubusparamRadio=new Array("rtweb.wifi","wlanRadioGet",{"band":"2.4G"});var ubusparamBSS=new Array("rtweb.wifi","wlanBasicGet",{"band":"2.4G","index":15});var jsonparamRadio={"id":1,"params":ubusparamRadio};sk_auth_post(jsonparamRadio,function(result){wifi_data.radioEnable=result.result[1].radios[0].enable;wifi_data.transmitpower=result.result[1].radios[0].transmitPower;wifi_data.ieeeStandard=result.result[1].radios[0].netType;wifi_data.bandwidth=result.result[1].radios[0].bandwidth;wifi_data.channel=result.result[1].radios[0].channel;wifi_data.country=result.result[1].radios[0].country;wifi_data.acsTime=result.result[1].radios[0].acsTime;wifi_data.guardInterval=result.result[1].radios[0].guardInterval;wifi_data.ch_20=result.result[1].radios[0].ch_2G_20;var jsonparamBSS={"id":1,"params":ubusparamBSS};sk_auth_post(jsonparamBSS,function(result){wifi_data.ssidEnable=result.result[1].bss[0].enable;wifi_data.ssid=result.result[1].bss[0].ssid;wifi_data.password_wlan=result.result[1].bss[0].password;for(var i=0;i<=3;i++){wifi_data.securityMode[i]=result.result[1].bss[i].securityMode;if(i==2){ssid_iot_global=result.result[1].bss[i].ssid;pwd_iot_global=result.result[1].bss[i].password;iot_enable_global=result.result[1].bss[i].enable;}}
wifi_data.encrypt=result.result[1].bss[0].encrypt;wifi_data.hide=result.result[1].bss[0].hide;wifi_data.acCtrlEN=result.result[1].bss[0].acCtrlEN;wifi_data.maxClient=result.result[1].bss[0].maxClient;wifi_data.muofdmadl=result.result[1].bss[0].muofdmadl;wifi_data.muofdmaul=result.result[1].bss[0].muofdmaul;wifi_data.mumimodl=result.result[1].bss[0].mumimodl;wifi_data.mumimoul=result.result[1].bss[0].mumimoul;wifi_data.wmm=result.result[1].bss[0].wmm;show_wlan_info();});});});}
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
{var bandwidth=cb.value;var channel=getValue("Sel_Channel");reload_channel_list(bandwidth,channel,dfsEnable);}
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
{var bsarray=[[wifi_data.ssid,'Txt_SSID'],[wifi_data.securityMode[0],'Sel_AuthMode'],[wifi_data.password_wlan,'Pwd_WpaPsk'],[wifi_data.encrypt,'Sel_Encryption']];var changebs=0;if(wifi_data.bsenable==1){for(var i=0;i<bsarray.length;i++){var originalValue=bsarray[i][0];var currentValue=getValue(bsarray[i][1]);if(originalValue!==currentValue){changebs=1;break;}}}
return changebs;}
function wifiReload()
{var ubusparam=new Array("rtweb.wifi","reload",{"band":2});var jsonparam={"id":1,"params":ubusparam};sk_auth_post(jsonparam,function(result){console.log("wifi reload");});}
function setBssInfo()
{var data=[];var iotdata=[];var iotdata5G=[];var ssidEn=0;var ssid=getValue("Txt_SSID");var securityMode=getValue("Sel_AuthMode");var encryption=getValue("Sel_Encryption");var password_wlan=getValue("Pwd_WpaPsk");var guardInterval=getValue("Sel_guardInterval");var maxClient=getValue("client_num");var ssid_iot=getValue("Txt_SSID_IOT");var password_wlan_iot=getValue("Pwd_WpaPsk_IOT");var iot_enable=1;var iot_bs_enable=1;var ssidHidden=0;var acCtrlEN=0;var muofdmaul_enable=0;var muofdmadl_enable=0;var mumimodl_enable=0;var mumimoul_enable=0;var wmm_enable=0;if($('input:radio[name="IOT"]:checked').val()=="Enable")
{iot_enable=1;}else
{iot_enable=0;}
if($('input:radio[name="IOTBS"]:checked').val()=="Enable")
{iot_bs_enable=1;}else
{iot_bs_enable=0;}
if(true==getChecked("Control_Enable"))
{acCtrlEN=1;}
if(true==getChecked("WMM_Enable"))
{wmm_enable=1;}
if(true==getChecked("UMUOFDMA_Enable"))
{muofdmaul_enable=1;}
if(true==getChecked("DMUOFDMA_Enable"))
{muofdmadl_enable=1;}
if(true==getChecked("DMUMIMO_Enable"))
{mumimodl_enable=1;}
if(true==getChecked("UMUMIMO_Enable"))
{mumimoul_enable=1;}
if(true==getChecked("Chk_SsidEnable"))
{ssidEn=1;}
if(true==getChecked("Chk_HideEnable"))
{ssidHidden=1;}
var objValue={"band":"2.4G","index":1,"ssid":ssid,"enable":ssidEn,"securityMode":securityMode,"encrypt":encryption,"password":getAES(password_wlan),"hide":ssidHidden,"maxClient":parseInt(maxClient),"acCtrlEN":acCtrlEN};data.push(objValue);var iotValue={"band":"2.4G","index":3,"ssid":ssid_iot,"enable":iot_enable,"password":getAES(password_wlan_iot)};iotdata.push(iotValue);var basicData=[{"band":"2.4G","index":1,"mumimoul":mumimoul_enable,"mumimodl":mumimodl_enable,"muofdmadl":muofdmadl_enable,"muofdmaul":muofdmaul_enable,"wmm":wmm_enable}];if(checkBandSteering_change()==1)
{var obj5g={"band":"5G","index":1,"ssid":ssid,"securityMode":securityMode,"password":getAES(password_wlan),"encrypt":encryption};data.push(obj5g);}
var iotData5G={"band":"5G","index":3,"enable":iot_enable};iotdata5G.push(iotData5G);if(getValue("Sel_PhyMode")=="bgnaxbe")
{for(var j=1;j<4;j++)
{if(wifi_data.securityMode[j]=="WPA-PSK")
{var objValue={"band":"2.4G","index":j+1,"securityMode":"WPA2-PSK"};data.push(objValue);}}}
var ubusparam=new Array("rtweb.wifi","wlanBasicSet_encrypt",{"bss":data});var ubusparam2=new Array("rtweb.wifi","wlanBasicSet",{"bss":basicData});var ubusparam3=new Array("rtweb.wifi","wlanBasicSet_encrypt",{"bss":iotdata});var ubusparam4=new Array("rtweb.wifi","wlanBandSteeringSet",{"index":3,"bandsteering_enable":iot_bs_enable,"bsSetssid":1});var ubusparam5=new Array("rtweb.wifi","wlanBasicSet_encrypt",{"bss":iotdata5G});var jsonparam=[{"id":1,"params":ubusparam},{"id":2,"params":ubusparam2},{"id":3,"params":ubusparam3},{"id":4,"params":ubusparam4},{"id":5,"params":ubusparam5}];sk_auth_post(jsonparam,function(result){wifiReload();setTimeout("hide_mode()",5000);pageLoad();});}
function setRadioInfo()
{var data=[];var radio=0;var nettype=getValue("Sel_PhyMode");var bandwidth=getValue("Sel_BandWidth");var channel=getValue("Sel_Channel");var power=getValue("Sel_TxPower");var acsTime=getValue("Txt_acsTime");var guardInterval=getValue("Sel_guardInterval");if(true==getChecked("Chk_RadioEnable"))
{radio=1;}
var objValue={"band":"2.4G","enable":radio,"transmitPower":parseInt(power),"channel":channel,"bandwidth":bandwidth,"guardInterval":parseInt(guardInterval),"netType":nettype,"acsTime":parseInt(acsTime)};data.push(objValue);var ubusparam=new Array("rtweb.wifi","wlanRadioSet",{"radios":data});var jsonparam=[{"id":1,"params":ubusparam}];sk_auth_post(jsonparam,function(result){setBssInfo();});}
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
setValue("Txt_SSID",wifi_data.ssid);setValue("Sel_AuthMode",wifi_data.securityMode[0]);setValue("Sel_Encryption",wifi_data.encrypt);setValue("Pwd_WpaPsk",wifi_data.password_wlan);setValue("Sel_PhyMode",wifi_data.ieeeStandard);setValue("Txt_acsTime",wifi_data.acsTime);setValue("Sel_guardInterval",wifi_data.guardInterval);setValue("client_num",wifi_data.maxClient);setValue("Txt_SSID_IOT",ssid_iot_global);setValue("Pwd_WpaPsk_IOT",pwd_iot_global);if(iot_bs_enable_global==1){$("input[type=radio][id='IOTBSEnable']").prop("checked",true);}
else{$("input[type=radio][id='IOTBSDisable']").prop("checked",true);}
if(iot_enable_global==1){$("input[type=radio][id='IOTEnable']").prop("checked",true);}
else{$("input[type=radio][id='IOTDisable']").prop("checked",true);}
reload_authMode(wifi_data.securityMode[0]);reload_auth_wpa();setiotctrl();if(wifi_data.wificapability)
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
function BntClick_Apply_wlan()
{var ssid=getValue("Txt_SSID");var password_wlan=getValue("Pwd_WpaPsk");var acsTime=getValue("Txt_acsTime");var channel=getValue("Sel_Channel");var ret=true;var ssid_iot=getValue("Txt_SSID_IOT");var password_wlan_iot=getValue("Pwd_WpaPsk_IOT");ret=isValidSsid(ssid);if(ret==-1){warninfo_show(_("basicSetting2g_ssidempty"));return;}else if(ret==-2){warninfo_show(_("basicSetting2g_ssidlengthlimit"));return;}else if(ret==-3){warninfo_show(_("basicSetting2g_ssidspacelimit"));return;}else if(ret==-4){warninfo_show(_("basicSetting2g_ssidcharlimit"));return;}
ret=isValidSsid(ssid_iot);if(ret==-1){warninfo_show(_("iotSetting2g_ssidempty"));return;}else if(ret==-2){warninfo_show(_("iotSetting2g_ssidlengthlimit"));return;}else if(ret==-3){warninfo_show(_("iotSetting2g_ssidspacelimit"));return;}else if(ret==-4){warninfo_show(_("iotSetting2g_ssidcharlimit"));return;}
if(!checkSSIDRepid(ssid))
{warninfo_show(_("basicSetting2g_ssidduplicated"));return;}
ret=isValidPassword(password_wlan);if(ret==-1){warninfo_show(_("basicSetting2g_pwdempty"));return;}else if(ret==-2){warninfo_show(_("basicSetting2g_pwdlengthlimit"));return;}else if(ret==-3){warninfo_show(_("basicSetting2g_pwdcharlimit"));return;}else if(ret==-4){warninfo_show(_("basicSetting2g_pwdspacelimit"));return;}
ret=isValidPassword(password_wlan_iot);if(ret==-1){warninfo_show(_("iotSetting2g_pwdempty"));return;}else if(ret==-2){warninfo_show(_("iotSetting2g_pwdlengthlimit"));return;}else if(ret==-3){warninfo_show(_("iotSetting2g_pwdcharlimit"));return;}else if(ret==-4){warninfo_show(_("iotSetting2g_pwdspacelimit"));return;}
setRadioInfo();}
var apply_data={};var buildStaticPPP=0;var lanPortNum=4;var actionapply="add";var selindex=0;var delist=new Array();var portlist={};var WanConnJson={};var allportlistarry=new Array();var brlanipaddr="";var brlansubnetmask="";var sfuBindPort="";var onuType="";var pppoe_static_ip_support="";var ft_passthrough_bridge="";var bridgeMaxMtu=1500;var bridgeMinMtu=1280;var ipMaxMtu=1500;var ipMinMtu=576;var ipMinMtuV6=1280;var pppMaxMtu=1492;var pppMinMtu=576;var pppMinMtuV6=1280;var currMaxMtu=1500;var currMinMtu=1280;function unSeleLanPort(portId)
{var f = document.forms[0];
var Box_TxPower = f.Box_TxPower, Chk_HideEnable = f.Chk_HideEnable, Chk_RadioEnable = f.Chk_RadioEnable, Chk_SsidEnable = f.Chk_SsidEnable, Control_Enable = f.Control_Enable, DMUMIMO_Enable = f.DMUMIMO_Enable, DMUOFDMA_Enable = f.DMUOFDMA_Enable, DSLiteEnable = f.DSLiteEnable, DSLiteEnableTable = f.DSLiteEnableTable, DSLiteModeTable = f.DSLiteModeTable, Defaultroute = f.Defaultroute, Defaultroutev6 = f.Defaultroutev6, Enable = f.Enable, EnableStaticIp = f.EnableStaticIp, IANATable = f.IANATable, IOT = f.IOT, IOTBS = f.IOTBS, IOTBSDisable = f.IOTBSDisable, IOTBSDisable_label = f.IOTBSDisable_label, IOTBSEnable = f.IOTBSEnable, IOTBSEnable_label = f.IOTBSEnable_label, IOTBSTable = f.IOTBSTable, IOTDisable = f.IOTDisable, IOTDisable_label = f.IOTDisable_label, IOTEnable = f.IOTEnable, IOTEnable_label = f.IOTEnable_label, IOTTable = f.IOTTable, IOT_PSK = f.IOT_PSK, IpVersion = f.IpVersion, Networkconfigid = f.Networkconfigid, OnDemandTable = f.OnDemandTable, PDTable = f.PDTable, PDTableStatic = f.PDTableStatic, Pwd_WpaPsk = f.Pwd_WpaPsk, Pwd_WpaPsk_IOT = f.Pwd_WpaPsk_IOT, Sel_AuthMode = f.Sel_AuthMode, Sel_BandWidth = f.Sel_BandWidth, Sel_Channel = f.Sel_Channel, Sel_Encryption = f.Sel_Encryption, Sel_PhyMode = f.Sel_PhyMode, Sel_TxPower = f.Sel_TxPower, Sel_guardInterval = f.Sel_guardInterval, Sky_Apply = f.Sky_Apply, Sky_Cancel = f.Sky_Cancel, Sky_DHCP_Disable = f.Sky_DHCP_Disable, Sky_DHCP_Enable = f.Sky_DHCP_Enable, Sky_DHCP_Mode_Auto = f.Sky_DHCP_Mode_Auto, Sky_DHCP_Mode_Proxy = f.Sky_DHCP_Mode_Proxy, Sky_DHCP_Mode_Static = f.Sky_DHCP_Mode_Static, Sky_DHCP_Relay = f.Sky_DHCP_Relay, Tr_Encryption = f.Tr_Encryption, Tr_WpaPSK = f.Tr_WpaPSK, Txt_SSID = f.Txt_SSID, Txt_SSID_IOT = f.Txt_SSID_IOT, Txt_acsTime = f.Txt_acsTime, UMUMIMO_Enable = f.UMUMIMO_Enable, UMUOFDMA_Enable = f.UMUOFDMA_Enable, WMM_Enable = f.WMM_Enable, briTable = f.briTable, bridgeapply = f.bridgeapply, btn_add = f.btn_add, btn_del = f.btn_del, btn_edit = f.btn_edit, button_apply = f.button_apply, client_num = f.client_num, connMode = f.connMode, d8021 = f.d8021, defGW = f.defGW, default_route = f.default_route, default_routev6 = f.default_routev6, defaultroute = f.defaultroute, defaultroutev6 = f.defaultroutev6, delegatePrefix = f.delegatePrefix, delegatePrefixLen = f.delegatePrefixLen, dhcpEthEnd = f.dhcpEthEnd, dhcpEthStart = f.dhcpEthStart, dhcpLeasedTime = f.dhcpLeasedTime, dhcpMode = f.dhcpMode, dhcpSrvAddr = f.dhcpSrvAddr, dhcpSrvType = f.dhcpSrvType, dhcpSrvType1 = f.dhcpSrvType1, dhcpSrvType2 = f.dhcpSrvType2, dhcpSrvType3 = f.dhcpSrvType3, dhcpstaticContent = f.dhcpstaticContent, dhcpstaticTBody = f.dhcpstaticTBody, dialMode = f.dialMode, dialTable = f.dialTable, dns6Primary = f.dns6Primary, dns6Secondary = f.dns6Secondary, dnsPrimary = f.dnsPrimary, dnsSecondary = f.dnsSecondary, dnsmode = f.dnsmode, dnsmode1 = f.dnsmode1, dnsmode2 = f.dnsmode2, dnsmode3 = f.dnsmode3, dnsv4Satic = f.dnsv4Satic, dnsv6Table = f.dnsv6Table, dnsv6disable = f.dnsv6disable, dnsv6enable = f.dnsv6enable, dnsv6mode = f.dnsv6mode, dsLiteServer = f.dsLiteServer, dsliteManualTable = f.dsliteManualTable, dsliteMode = f.dsliteMode, dsliteModeAuto = f.dsliteModeAuto, dsliteModeManual = f.dsliteModeManual, dsliteTable = f.dsliteTable, enable = f.enable, enbl6RD = f.enbl6RD, enblDSLite = f.enblDSLite, enblIANA = f.enblIANA, enblPD = f.enblPD, ethIpAddress = f.ethIpAddress, ethSubnetMask = f.ethSubnetMask, firstDns = f.firstDns, fullConeNat = f.fullConeNat, fullapply = f.fullapply, idleTime = f.idleTime, ipAddr = f.ipAddr, ipAddrTable = f.ipAddrTable, ipproto = f.ipproto, ipprotodhcp = f.ipprotodhcp, ipprotopppoe = f.ipprotopppoe, ipprotostatic = f.ipprotostatic, ipv6RDEnableTable = f.ipv6RDEnableTable, ipv6RDMode = f.ipv6RDMode, ipv6RDModeAuto = f.ipv6RDModeAuto, ipv6RDModeManual = f.ipv6RDModeManual, ipv6RDModeTable = f.ipv6RDModeTable, ipv6Table = f.ipv6Table, ipv6rdBrAddr = f.ipv6rdBrAddr, ipv6rdIpv4MaskLen = f.ipv6rdIpv4MaskLen, ipv6rdManualTable = f.ipv6rdManualTable, ipv6rdPrefix = f.ipv6rdPrefix, ipv6rdPrefixLen = f.ipv6rdPrefixLen, ipv6rdTable = f.ipv6rdTable, ipversionmode = f.ipversionmode, lan_port_list = f.lan_port_list, lancfg_StaticipAdd = f.lancfg_StaticipAdd, lancfg_StaticipDel = f.lancfg_StaticipDel, lancfg_dhcpserver = f.lancfg_dhcpserver, maximum_client = f.maximum_client, mtu = f.mtu, multiVID = f.multiVID, nat = f.nat, natEnble = f.natEnble, nattable = f.nattable, netMask = f.netMask, noipv6apply = f.noipv6apply, pdEnable = f.pdEnable, portbindtable = f.portbindtable, pppStaticEndAddress = f.pppStaticEndAddress, pppStaticIPAddress = f.pppStaticIPAddress, pppStaticIPEnableTable = f.pppStaticIPEnableTable, pppStaticIPTable = f.pppStaticIPTable, pppStaticStartAddress = f.pppStaticStartAddress, pppStaticSubnetMask = f.pppStaticSubnetMask, pppoeMode = f.pppoeMode, radio_hide = f.radio_hide, relayInfo = f.relayInfo, rouTable = f.rouTable, secondDns = f.secondDns, selectAll = f.selectAll, seletall = f.seletall, serviceMode = f.serviceMode, span_mtu = f.span_mtu, static6Table = f.static6Table, staticIpAll_Sel = f.staticIpAll_Sel, staticIp_Tbl = f.staticIp_Tbl, staticMode = f.staticMode, uPsd = f.uPsd, userName = f.userName, vlanID = f.vlanID, vlanMode = f.vlanMode, vlanvfg = f.vlanvfg, wanAddress6 = f.wanAddress6, wanAddress6prefix = f.wanAddress6prefix, wanGateway6 = f.wanGateway6, wanform = f.wanform, wanindex = f.wanindex, wantittleinfo = f.wantittleinfo;
if(true)
{if(portId==-1)
{for(var i=0;i<allportlistarry.length;i++)
{document.getElementById("LanPort"+i).checked=false;}}
else if(portId>=0&&portId<allportlistarry.length)
{document.getElementById("LanPort"+portId).checked=false;}}}
function seleLanPort(portId)
{var f = document.forms[0];
var Box_TxPower = f.Box_TxPower, Chk_HideEnable = f.Chk_HideEnable, Chk_RadioEnable = f.Chk_RadioEnable, Chk_SsidEnable = f.Chk_SsidEnable, Control_Enable = f.Control_Enable, DMUMIMO_Enable = f.DMUMIMO_Enable, DMUOFDMA_Enable = f.DMUOFDMA_Enable, DSLiteEnable = f.DSLiteEnable, DSLiteEnableTable = f.DSLiteEnableTable, DSLiteModeTable = f.DSLiteModeTable, Defaultroute = f.Defaultroute, Defaultroutev6 = f.Defaultroutev6, Enable = f.Enable, EnableStaticIp = f.EnableStaticIp, IANATable = f.IANATable, IOT = f.IOT, IOTBS = f.IOTBS, IOTBSDisable = f.IOTBSDisable, IOTBSDisable_label = f.IOTBSDisable_label, IOTBSEnable = f.IOTBSEnable, IOTBSEnable_label = f.IOTBSEnable_label, IOTBSTable = f.IOTBSTable, IOTDisable = f.IOTDisable, IOTDisable_label = f.IOTDisable_label, IOTEnable = f.IOTEnable, IOTEnable_label = f.IOTEnable_label, IOTTable = f.IOTTable, IOT_PSK = f.IOT_PSK, IpVersion = f.IpVersion, Networkconfigid = f.Networkconfigid, OnDemandTable = f.OnDemandTable, PDTable = f.PDTable, PDTableStatic = f.PDTableStatic, Pwd_WpaPsk = f.Pwd_WpaPsk, Pwd_WpaPsk_IOT = f.Pwd_WpaPsk_IOT, Sel_AuthMode = f.Sel_AuthMode, Sel_BandWidth = f.Sel_BandWidth, Sel_Channel = f.Sel_Channel, Sel_Encryption = f.Sel_Encryption, Sel_PhyMode = f.Sel_PhyMode, Sel_TxPower = f.Sel_TxPower, Sel_guardInterval = f.Sel_guardInterval, Sky_Apply = f.Sky_Apply, Sky_Cancel = f.Sky_Cancel, Sky_DHCP_Disable = f.Sky_DHCP_Disable, Sky_DHCP_Enable = f.Sky_DHCP_Enable, Sky_DHCP_Mode_Auto = f.Sky_DHCP_Mode_Auto, Sky_DHCP_Mode_Proxy = f.Sky_DHCP_Mode_Proxy, Sky_DHCP_Mode_Static = f.Sky_DHCP_Mode_Static, Sky_DHCP_Relay = f.Sky_DHCP_Relay, Tr_Encryption = f.Tr_Encryption, Tr_WpaPSK = f.Tr_WpaPSK, Txt_SSID = f.Txt_SSID, Txt_SSID_IOT = f.Txt_SSID_IOT, Txt_acsTime = f.Txt_acsTime, UMUMIMO_Enable = f.UMUMIMO_Enable, UMUOFDMA_Enable = f.UMUOFDMA_Enable, WMM_Enable = f.WMM_Enable, briTable = f.briTable, bridgeapply = f.bridgeapply, btn_add = f.btn_add, btn_del = f.btn_del, btn_edit = f.btn_edit, button_apply = f.button_apply, client_num = f.client_num, connMode = f.connMode, d8021 = f.d8021, defGW = f.defGW, default_route = f.default_route, default_routev6 = f.default_routev6, defaultroute = f.defaultroute, defaultroutev6 = f.defaultroutev6, delegatePrefix = f.delegatePrefix, delegatePrefixLen = f.delegatePrefixLen, dhcpEthEnd = f.dhcpEthEnd, dhcpEthStart = f.dhcpEthStart, dhcpLeasedTime = f.dhcpLeasedTime, dhcpMode = f.dhcpMode, dhcpSrvAddr = f.dhcpSrvAddr, dhcpSrvType = f.dhcpSrvType, dhcpSrvType1 = f.dhcpSrvType1, dhcpSrvType2 = f.dhcpSrvType2, dhcpSrvType3 = f.dhcpSrvType3, dhcpstaticContent = f.dhcpstaticContent, dhcpstaticTBody = f.dhcpstaticTBody, dialMode = f.dialMode, dialTable = f.dialTable, dns6Primary = f.dns6Primary, dns6Secondary = f.dns6Secondary, dnsPrimary = f.dnsPrimary, dnsSecondary = f.dnsSecondary, dnsmode = f.dnsmode, dnsmode1 = f.dnsmode1, dnsmode2 = f.dnsmode2, dnsmode3 = f.dnsmode3, dnsv4Satic = f.dnsv4Satic, dnsv6Table = f.dnsv6Table, dnsv6disable = f.dnsv6disable, dnsv6enable = f.dnsv6enable, dnsv6mode = f.dnsv6mode, dsLiteServer = f.dsLiteServer, dsliteManualTable = f.dsliteManualTable, dsliteMode = f.dsliteMode, dsliteModeAuto = f.dsliteModeAuto, dsliteModeManual = f.dsliteModeManual, dsliteTable = f.dsliteTable, enable = f.enable, enbl6RD = f.enbl6RD, enblDSLite = f.enblDSLite, enblIANA = f.enblIANA, enblPD = f.enblPD, ethIpAddress = f.ethIpAddress, ethSubnetMask = f.ethSubnetMask, firstDns = f.firstDns, fullConeNat = f.fullConeNat, fullapply = f.fullapply, idleTime = f.idleTime, ipAddr = f.ipAddr, ipAddrTable = f.ipAddrTable, ipproto = f.ipproto, ipprotodhcp = f.ipprotodhcp, ipprotopppoe = f.ipprotopppoe, ipprotostatic = f.ipprotostatic, ipv6RDEnableTable = f.ipv6RDEnableTable, ipv6RDMode = f.ipv6RDMode, ipv6RDModeAuto = f.ipv6RDModeAuto, ipv6RDModeManual = f.ipv6RDModeManual, ipv6RDModeTable = f.ipv6RDModeTable, ipv6Table = f.ipv6Table, ipv6rdBrAddr = f.ipv6rdBrAddr, ipv6rdIpv4MaskLen = f.ipv6rdIpv4MaskLen, ipv6rdManualTable = f.ipv6rdManualTable, ipv6rdPrefix = f.ipv6rdPrefix, ipv6rdPrefixLen = f.ipv6rdPrefixLen, ipv6rdTable = f.ipv6rdTable, ipversionmode = f.ipversionmode, lan_port_list = f.lan_port_list, lancfg_StaticipAdd = f.lancfg_StaticipAdd, lancfg_StaticipDel = f.lancfg_StaticipDel, lancfg_dhcpserver = f.lancfg_dhcpserver, maximum_client = f.maximum_client, mtu = f.mtu, multiVID = f.multiVID, nat = f.nat, natEnble = f.natEnble, nattable = f.nattable, netMask = f.netMask, noipv6apply = f.noipv6apply, pdEnable = f.pdEnable, portbindtable = f.portbindtable, pppStaticEndAddress = f.pppStaticEndAddress, pppStaticIPAddress = f.pppStaticIPAddress, pppStaticIPEnableTable = f.pppStaticIPEnableTable, pppStaticIPTable = f.pppStaticIPTable, pppStaticStartAddress = f.pppStaticStartAddress, pppStaticSubnetMask = f.pppStaticSubnetMask, pppoeMode = f.pppoeMode, radio_hide = f.radio_hide, relayInfo = f.relayInfo, rouTable = f.rouTable, secondDns = f.secondDns, selectAll = f.selectAll, seletall = f.seletall, serviceMode = f.serviceMode, span_mtu = f.span_mtu, static6Table = f.static6Table, staticIpAll_Sel = f.staticIpAll_Sel, staticIp_Tbl = f.staticIp_Tbl, staticMode = f.staticMode, uPsd = f.uPsd, userName = f.userName, vlanID = f.vlanID, vlanMode = f.vlanMode, vlanvfg = f.vlanvfg, wanAddress6 = f.wanAddress6, wanAddress6prefix = f.wanAddress6prefix, wanGateway6 = f.wanGateway6, wanform = f.wanform, wanindex = f.wanindex, wantittleinfo = f.wantittleinfo;
if(true)
{if(portId==-1)
{for(var i=0;i<allportlistarry.length;i++)
{document.getElementById("LanPort"+i).checked=true;}}
else if(portId>=0&&portId<allportlistarry.length)
{document.getElementById("LanPort"+portId).checked=true;}}}
function enableLanPort()
{var f = document.forms[0];
var Box_TxPower = f.Box_TxPower, Chk_HideEnable = f.Chk_HideEnable, Chk_RadioEnable = f.Chk_RadioEnable, Chk_SsidEnable = f.Chk_SsidEnable, Control_Enable = f.Control_Enable, DMUMIMO_Enable = f.DMUMIMO_Enable, DMUOFDMA_Enable = f.DMUOFDMA_Enable, DSLiteEnable = f.DSLiteEnable, DSLiteEnableTable = f.DSLiteEnableTable, DSLiteModeTable = f.DSLiteModeTable, Defaultroute = f.Defaultroute, Defaultroutev6 = f.Defaultroutev6, Enable = f.Enable, EnableStaticIp = f.EnableStaticIp, IANATable = f.IANATable, IOT = f.IOT, IOTBS = f.IOTBS, IOTBSDisable = f.IOTBSDisable, IOTBSDisable_label = f.IOTBSDisable_label, IOTBSEnable = f.IOTBSEnable, IOTBSEnable_label = f.IOTBSEnable_label, IOTBSTable = f.IOTBSTable, IOTDisable = f.IOTDisable, IOTDisable_label = f.IOTDisable_label, IOTEnable = f.IOTEnable, IOTEnable_label = f.IOTEnable_label, IOTTable = f.IOTTable, IOT_PSK = f.IOT_PSK, IpVersion = f.IpVersion, Networkconfigid = f.Networkconfigid, OnDemandTable = f.OnDemandTable, PDTable = f.PDTable, PDTableStatic = f.PDTableStatic, Pwd_WpaPsk = f.Pwd_WpaPsk, Pwd_WpaPsk_IOT = f.Pwd_WpaPsk_IOT, Sel_AuthMode = f.Sel_AuthMode, Sel_BandWidth = f.Sel_BandWidth, Sel_Channel = f.Sel_Channel, Sel_Encryption = f.Sel_Encryption, Sel_PhyMode = f.Sel_PhyMode, Sel_TxPower = f.Sel_TxPower, Sel_guardInterval = f.Sel_guardInterval, Sky_Apply = f.Sky_Apply, Sky_Cancel = f.Sky_Cancel, Sky_DHCP_Disable = f.Sky_DHCP_Disable, Sky_DHCP_Enable = f.Sky_DHCP_Enable, Sky_DHCP_Mode_Auto = f.Sky_DHCP_Mode_Auto, Sky_DHCP_Mode_Proxy = f.Sky_DHCP_Mode_Proxy, Sky_DHCP_Mode_Static = f.Sky_DHCP_Mode_Static, Sky_DHCP_Relay = f.Sky_DHCP_Relay, Tr_Encryption = f.Tr_Encryption, Tr_WpaPSK = f.Tr_WpaPSK, Txt_SSID = f.Txt_SSID, Txt_SSID_IOT = f.Txt_SSID_IOT, Txt_acsTime = f.Txt_acsTime, UMUMIMO_Enable = f.UMUMIMO_Enable, UMUOFDMA_Enable = f.UMUOFDMA_Enable, WMM_Enable = f.WMM_Enable, briTable = f.briTable, bridgeapply = f.bridgeapply, btn_add = f.btn_add, btn_del = f.btn_del, btn_edit = f.btn_edit, button_apply = f.button_apply, client_num = f.client_num, connMode = f.connMode, d8021 = f.d8021, defGW = f.defGW, default_route = f.default_route, default_routev6 = f.default_routev6, defaultroute = f.defaultroute, defaultroutev6 = f.defaultroutev6, delegatePrefix = f.delegatePrefix, delegatePrefixLen = f.delegatePrefixLen, dhcpEthEnd = f.dhcpEthEnd, dhcpEthStart = f.dhcpEthStart, dhcpLeasedTime = f.dhcpLeasedTime, dhcpMode = f.dhcpMode, dhcpSrvAddr = f.dhcpSrvAddr, dhcpSrvType = f.dhcpSrvType, dhcpSrvType1 = f.dhcpSrvType1, dhcpSrvType2 = f.dhcpSrvType2, dhcpSrvType3 = f.dhcpSrvType3, dhcpstaticContent = f.dhcpstaticContent, dhcpstaticTBody = f.dhcpstaticTBody, dialMode = f.dialMode, dialTable = f.dialTable, dns6Primary = f.dns6Primary, dns6Secondary = f.dns6Secondary, dnsPrimary = f.dnsPrimary, dnsSecondary = f.dnsSecondary, dnsmode = f.dnsmode, dnsmode1 = f.dnsmode1, dnsmode2 = f.dnsmode2, dnsmode3 = f.dnsmode3, dnsv4Satic = f.dnsv4Satic, dnsv6Table = f.dnsv6Table, dnsv6disable = f.dnsv6disable, dnsv6enable = f.dnsv6enable, dnsv6mode = f.dnsv6mode, dsLiteServer = f.dsLiteServer, dsliteManualTable = f.dsliteManualTable, dsliteMode = f.dsliteMode, dsliteModeAuto = f.dsliteModeAuto, dsliteModeManual = f.dsliteModeManual, dsliteTable = f.dsliteTable, enable = f.enable, enbl6RD = f.enbl6RD, enblDSLite = f.enblDSLite, enblIANA = f.enblIANA, enblPD = f.enblPD, ethIpAddress = f.ethIpAddress, ethSubnetMask = f.ethSubnetMask, firstDns = f.firstDns, fullConeNat = f.fullConeNat, fullapply = f.fullapply, idleTime = f.idleTime, ipAddr = f.ipAddr, ipAddrTable = f.ipAddrTable, ipproto = f.ipproto, ipprotodhcp = f.ipprotodhcp, ipprotopppoe = f.ipprotopppoe, ipprotostatic = f.ipprotostatic, ipv6RDEnableTable = f.ipv6RDEnableTable, ipv6RDMode = f.ipv6RDMode, ipv6RDModeAuto = f.ipv6RDModeAuto, ipv6RDModeManual = f.ipv6RDModeManual, ipv6RDModeTable = f.ipv6RDModeTable, ipv6Table = f.ipv6Table, ipv6rdBrAddr = f.ipv6rdBrAddr, ipv6rdIpv4MaskLen = f.ipv6rdIpv4MaskLen, ipv6rdManualTable = f.ipv6rdManualTable, ipv6rdPrefix = f.ipv6rdPrefix, ipv6rdPrefixLen = f.ipv6rdPrefixLen, ipv6rdTable = f.ipv6rdTable, ipversionmode = f.ipversionmode, lan_port_list = f.lan_port_list, lancfg_StaticipAdd = f.lancfg_StaticipAdd, lancfg_StaticipDel = f.lancfg_StaticipDel, lancfg_dhcpserver = f.lancfg_dhcpserver, maximum_client = f.maximum_client, mtu = f.mtu, multiVID = f.multiVID, nat = f.nat, natEnble = f.natEnble, nattable = f.nattable, netMask = f.netMask, noipv6apply = f.noipv6apply, pdEnable = f.pdEnable, portbindtable = f.portbindtable, pppStaticEndAddress = f.pppStaticEndAddress, pppStaticIPAddress = f.pppStaticIPAddress, pppStaticIPEnableTable = f.pppStaticIPEnableTable, pppStaticIPTable = f.pppStaticIPTable, pppStaticStartAddress = f.pppStaticStartAddress, pppStaticSubnetMask = f.pppStaticSubnetMask, pppoeMode = f.pppoeMode, radio_hide = f.radio_hide, relayInfo = f.relayInfo, rouTable = f.rouTable, secondDns = f.secondDns, selectAll = f.selectAll, seletall = f.seletall, serviceMode = f.serviceMode, span_mtu = f.span_mtu, static6Table = f.static6Table, staticIpAll_Sel = f.staticIpAll_Sel, staticIp_Tbl = f.staticIp_Tbl, staticMode = f.staticMode, uPsd = f.uPsd, userName = f.userName, vlanID = f.vlanID, vlanMode = f.vlanMode, vlanvfg = f.vlanvfg, wanAddress6 = f.wanAddress6, wanAddress6prefix = f.wanAddress6prefix, wanGateway6 = f.wanGateway6, wanform = f.wanform, wanindex = f.wanindex, wantittleinfo = f.wantittleinfo;
if(true)
{for(var i=0;i<allportlistarry.length;i++)
{var lanPortID="LanPort"+i;var lanPort=document.getElementById(lanPortID).disabled=false;if($("#"+lanPortID).parents(".skcheckbox-round").next().hasClass("skcheckbox-disabled"))
$("#"+lanPortID).parents(".skcheckbox-round").next().removeClass("skcheckbox-disabled");}}}
function disableLanPort()
{var i=0,j=0,k=0;var intf="";var parts="";var f = document.forms[0];
var Box_TxPower = f.Box_TxPower, Chk_HideEnable = f.Chk_HideEnable, Chk_RadioEnable = f.Chk_RadioEnable, Chk_SsidEnable = f.Chk_SsidEnable, Control_Enable = f.Control_Enable, DMUMIMO_Enable = f.DMUMIMO_Enable, DMUOFDMA_Enable = f.DMUOFDMA_Enable, DSLiteEnable = f.DSLiteEnable, DSLiteEnableTable = f.DSLiteEnableTable, DSLiteModeTable = f.DSLiteModeTable, Defaultroute = f.Defaultroute, Defaultroutev6 = f.Defaultroutev6, Enable = f.Enable, EnableStaticIp = f.EnableStaticIp, IANATable = f.IANATable, IOT = f.IOT, IOTBS = f.IOTBS, IOTBSDisable = f.IOTBSDisable, IOTBSDisable_label = f.IOTBSDisable_label, IOTBSEnable = f.IOTBSEnable, IOTBSEnable_label = f.IOTBSEnable_label, IOTBSTable = f.IOTBSTable, IOTDisable = f.IOTDisable, IOTDisable_label = f.IOTDisable_label, IOTEnable = f.IOTEnable, IOTEnable_label = f.IOTEnable_label, IOTTable = f.IOTTable, IOT_PSK = f.IOT_PSK, IpVersion = f.IpVersion, Networkconfigid = f.Networkconfigid, OnDemandTable = f.OnDemandTable, PDTable = f.PDTable, PDTableStatic = f.PDTableStatic, Pwd_WpaPsk = f.Pwd_WpaPsk, Pwd_WpaPsk_IOT = f.Pwd_WpaPsk_IOT, Sel_AuthMode = f.Sel_AuthMode, Sel_BandWidth = f.Sel_BandWidth, Sel_Channel = f.Sel_Channel, Sel_Encryption = f.Sel_Encryption, Sel_PhyMode = f.Sel_PhyMode, Sel_TxPower = f.Sel_TxPower, Sel_guardInterval = f.Sel_guardInterval, Sky_Apply = f.Sky_Apply, Sky_Cancel = f.Sky_Cancel, Sky_DHCP_Disable = f.Sky_DHCP_Disable, Sky_DHCP_Enable = f.Sky_DHCP_Enable, Sky_DHCP_Mode_Auto = f.Sky_DHCP_Mode_Auto, Sky_DHCP_Mode_Proxy = f.Sky_DHCP_Mode_Proxy, Sky_DHCP_Mode_Static = f.Sky_DHCP_Mode_Static, Sky_DHCP_Relay = f.Sky_DHCP_Relay, Tr_Encryption = f.Tr_Encryption, Tr_WpaPSK = f.Tr_WpaPSK, Txt_SSID = f.Txt_SSID, Txt_SSID_IOT = f.Txt_SSID_IOT, Txt_acsTime = f.Txt_acsTime, UMUMIMO_Enable = f.UMUMIMO_Enable, UMUOFDMA_Enable = f.UMUOFDMA_Enable, WMM_Enable = f.WMM_Enable, briTable = f.briTable, bridgeapply = f.bridgeapply, btn_add = f.btn_add, btn_del = f.btn_del, btn_edit = f.btn_edit, button_apply = f.button_apply, client_num = f.client_num, connMode = f.connMode, d8021 = f.d8021, defGW = f.defGW, default_route = f.default_route, default_routev6 = f.default_routev6, defaultroute = f.defaultroute, defaultroutev6 = f.defaultroutev6, delegatePrefix = f.delegatePrefix, delegatePrefixLen = f.delegatePrefixLen, dhcpEthEnd = f.dhcpEthEnd, dhcpEthStart = f.dhcpEthStart, dhcpLeasedTime = f.dhcpLeasedTime, dhcpMode = f.dhcpMode, dhcpSrvAddr = f.dhcpSrvAddr, dhcpSrvType = f.dhcpSrvType, dhcpSrvType1 = f.dhcpSrvType1, dhcpSrvType2 = f.dhcpSrvType2, dhcpSrvType3 = f.dhcpSrvType3, dhcpstaticContent = f.dhcpstaticContent, dhcpstaticTBody = f.dhcpstaticTBody, dialMode = f.dialMode, dialTable = f.dialTable, dns6Primary = f.dns6Primary, dns6Secondary = f.dns6Secondary, dnsPrimary = f.dnsPrimary, dnsSecondary = f.dnsSecondary, dnsmode = f.dnsmode, dnsmode1 = f.dnsmode1, dnsmode2 = f.dnsmode2, dnsmode3 = f.dnsmode3, dnsv4Satic = f.dnsv4Satic, dnsv6Table = f.dnsv6Table, dnsv6disable = f.dnsv6disable, dnsv6enable = f.dnsv6enable, dnsv6mode = f.dnsv6mode, dsLiteServer = f.dsLiteServer, dsliteManualTable = f.dsliteManualTable, dsliteMode = f.dsliteMode, dsliteModeAuto = f.dsliteModeAuto, dsliteModeManual = f.dsliteModeManual, dsliteTable = f.dsliteTable, enable = f.enable, enbl6RD = f.enbl6RD, enblDSLite = f.enblDSLite, enblIANA = f.enblIANA, enblPD = f.enblPD, ethIpAddress = f.ethIpAddress, ethSubnetMask = f.ethSubnetMask, firstDns = f.firstDns, fullConeNat = f.fullConeNat, fullapply = f.fullapply, idleTime = f.idleTime, ipAddr = f.ipAddr, ipAddrTable = f.ipAddrTable, ipproto = f.ipproto, ipprotodhcp = f.ipprotodhcp, ipprotopppoe = f.ipprotopppoe, ipprotostatic = f.ipprotostatic, ipv6RDEnableTable = f.ipv6RDEnableTable, ipv6RDMode = f.ipv6RDMode, ipv6RDModeAuto = f.ipv6RDModeAuto, ipv6RDModeManual = f.ipv6RDModeManual, ipv6RDModeTable = f.ipv6RDModeTable, ipv6Table = f.ipv6Table, ipv6rdBrAddr = f.ipv6rdBrAddr, ipv6rdIpv4MaskLen = f.ipv6rdIpv4MaskLen, ipv6rdManualTable = f.ipv6rdManualTable, ipv6rdPrefix = f.ipv6rdPrefix, ipv6rdPrefixLen = f.ipv6rdPrefixLen, ipv6rdTable = f.ipv6rdTable, ipversionmode = f.ipversionmode, lan_port_list = f.lan_port_list, lancfg_StaticipAdd = f.lancfg_StaticipAdd, lancfg_StaticipDel = f.lancfg_StaticipDel, lancfg_dhcpserver = f.lancfg_dhcpserver, maximum_client = f.maximum_client, mtu = f.mtu, multiVID = f.multiVID, nat = f.nat, natEnble = f.natEnble, nattable = f.nattable, netMask = f.netMask, noipv6apply = f.noipv6apply, pdEnable = f.pdEnable, portbindtable = f.portbindtable, pppStaticEndAddress = f.pppStaticEndAddress, pppStaticIPAddress = f.pppStaticIPAddress, pppStaticIPEnableTable = f.pppStaticIPEnableTable, pppStaticIPTable = f.pppStaticIPTable, pppStaticStartAddress = f.pppStaticStartAddress, pppStaticSubnetMask = f.pppStaticSubnetMask, pppoeMode = f.pppoeMode, radio_hide = f.radio_hide, relayInfo = f.relayInfo, rouTable = f.rouTable, secondDns = f.secondDns, selectAll = f.selectAll, seletall = f.seletall, serviceMode = f.serviceMode, span_mtu = f.span_mtu, static6Table = f.static6Table, staticIpAll_Sel = f.staticIpAll_Sel, staticIp_Tbl = f.staticIp_Tbl, staticMode = f.staticMode, uPsd = f.uPsd, userName = f.userName, vlanID = f.vlanID, vlanMode = f.vlanMode, vlanvfg = f.vlanvfg, wanAddress6 = f.wanAddress6, wanAddress6prefix = f.wanAddress6prefix, wanGateway6 = f.wanGateway6, wanform = f.wanform, wanindex = f.wanindex, wantittleinfo = f.wantittleinfo;
if(true)
{for(i=0;i<WanConnJson.length;i++)
{if(selindex!=WanConnJson[i].index)
{intf=WanConnJson[i].portbind
parts=intf.split(',');for(k=0;k<allportlistarry.length;k++)
{for(j=0;j<parts.length;j++)
{if(allportlistarry[k].ifname==parts[j])
{var lanPortID="LanPort"+k;var lanPort=document.getElementById(lanPortID).disabled=true;if($("#"+lanPortID).parents(".skcheckbox-round").next().hasClass("skcheckbox-disabled"))
$("#"+lanPortID).parents(".skcheckbox-round").next().addClass("skcheckbox-disabled");}}}}}
if(sfuBindPort.length>0)
{parts=sfuBindPort.split(',');for(k=0;k<allportlistarry.length;k++)
{for(j=0;j<parts.length;j++)
{if(allportlistarry[k].ifname==parts[j])
{var lanPortID="LanPort"+k;var lanPort=document.getElementById(lanPortID).disabled=true;if($("#"+lanPortID).parents(".skcheckbox-round").next().hasClass("skcheckbox-disabled"))
$("#"+lanPortID).parents(".skcheckbox-round").next().addClass("skcheckbox-disabled");}}}}}}
function show_span_mtu()
{var isppp=($('input:radio[name="ipproto"]:checked').val()=="pppoe");var ipversion=$("#IpVersion").val();var isroute=($("#connMode").val()=="route");if(isroute)
{if(isppp)
{if(ipversion=='0')
{currMinMtu=pppMinMtu;}
else
{currMinMtu=pppMinMtuV6;}
currMaxMtu=pppMaxMtu;}
else
{if(ipversion=='0')
{currMinMtu=ipMinMtu;}
else
{currMinMtu=ipMinMtuV6;}
currMaxMtu=ipMaxMtu;}}
else
{currMinMtu=bridgeMinMtu;currMaxMtu=bridgeMaxMtu;}
$("#span_mtu").html("("+currMinMtu+"-"+currMaxMtu+")");}
function enblPDClick(obj)
{var proto=$('input:radio[name="ipproto"]:checked').val();if(proto!="static")
{return;}
if(obj.checked==true)
{$("#PDTableStatic").show();}
else
{$("#PDTableStatic").hide();}}
function enbl6RDClick()
{var mode=$("#enbl6RD").is(':checked');if(mode==false){$("#ipv6RDModeTable").hide();$("#ipv6rdManualTable").hide();}else{$("#ipv6RDModeTable").show();$("#ipv6RDModeAuto").prop("checked",true);selectipv6RDMode();}}
function selectipv6RDMode(){var mode=$('input:radio[name="ipv6RDMode"]:checked').val();if(mode=="ipv6RDManual"){$("#ipv6rdManualTable").show();}else{$("#ipv6rdManualTable").hide();}}
function enblDSLiteClick()
{var mode=$("#enblDSLite").is(':checked');if(mode==false){$("#DSLiteModeTable").hide();$("#dsliteManualTable").hide();}else{$("#DSLiteModeTable").show();$("#dsliteModeAuto").prop("checked",true);selectdsliteMode();}}
function selectdsliteMode(){var mode=$('input:radio[name="dsliteMode"]:checked').val();if(mode=="dsliteManual"){$("#dsliteManualTable").show();}else{$("#dsliteManualTable").hide();}}
function changeIPVersion(ipversion)
{var mode=$("#serviceMode").val();var proto=$('input:radio[name="ipproto"]:checked').val();switch(parseInt(ipversion))
{case 0:$("#nattable").show();$("#nat").prop("checked",true);$("#ipv6Table").hide();if($("#connMode").val()=="route")
{if(mode==3)
{$("#nattable").hide();$("#nat").prop("checked",false);}
else
{$("#nat").prop("checked",true);}
if(proto=="static")
{$("#ipAddrTable").show();$("#dialTable").hide();}
else if(proto=="dhcp")
{$("#ipAddrTable").hide();$("#ppp_name").hide();}
else
{$("#ipAddrTable").hide();$("#dialTable").show();if(parseInt(pppoe_static_ip_support)==1)
{$("#pppStaticIPEnableTable").show();}}
$("#enblDSLite").prop("checked",false);$("#dsliteTable").hide();if(mode==8||mode==5||mode==7||mode==2){$("#default_route").show();$("#default_routev6").hide();}else{$("#default_route").hide();$("#default_routev6").hide();}}
var _6rd_exist=0;for(var i=0;i<WanConnJson.length;i++){if(WanConnJson[i].ipv6rd!=0)
_6rd_exist=1;}
if(0==_6rd_exist){$("#ipv6rdTable").show();$("#enbl6RD").prop("checked",false);$("#ipv6rdManualTable").hide();$("#ipv6RDModeTable").hide();}
break;case 1:$("#ipAddrTable").hide();$("#nattable").hide();$("#nat").prop("checked",false);$("#ipv6Table").show();$("#enblPD").prop("checked",true);if($("#connMode").val()=="route")
{if(mode==1||mode==3||mode==6)
{$("#PDTable").hide();$("#enblPD").prop("checked",false);}
else
{$("#PDTable").show();$("#enblPD").prop("checked",true);}
if(proto=="static")
{$("#dialTable").hide();$("#static6Table").show();$("#IANATable").hide();$("#PDTableStatic").show();}
else if(proto=="dhcp")
{$("#ppp_name").hide();$("#static6Table").hide();$("#IANATable").show();$("#PDTableStatic").hide();}
else
{$("#dialTable").show();$("#pppStaticIPEnableTable").hide();$("#static6Table").hide();$("#IANATable").show();$("#PDTableStatic").hide();}
var dslite_exist=0;for(var i=0;i<WanConnJson.length;i++){if(WanConnJson[i].dslite!=0)
dslite_exist=1;}
if(0==dslite_exist){$("#dsliteTable").show();$("#enblDSLite").prop("checked",false);$("#DSLiteModeTable").hide();$("#dsliteManualTable").hide();}
if(mode==8||mode==5||mode==7||mode==2){$("#default_route").hide();$("#default_routev6").show();}else{$("#default_route").hide();$("#default_routev6").hide();}}
$("#ipv6rdTable").hide();break;case 2:default:$("#nattable").show();$("#nat").prop("checked",true);$("#bridgeapply").hide();$("#noipv6apply").hide();$("#ipv6Table").show();if($("#connMode").val()=="route")
{if(mode==3)
{$("#nattable").hide();$("#nat").prop("checked",false);$("#PDTable").hide();$("#enblPD").prop("checked",false);}
else if(mode==1||mode==6)
{$("#PDTable").hide();$("#enblPD").prop("checked",false);$("#nat").prop("checked",true);}
else
{$("#PDTable").show();$("#enblPD").prop("checked",true);$("#nat").prop("checked",true);}
if(proto=="static")
{$("#ipAddrTable").show();$("#dialTable").hide();$("#static6Table").show();$("#IANATable").hide();$("#PDTableStatic").show();}
else if(proto=="dhcp")
{$("#ipAddrTable").hide();$("#ppp_name").hide();$("#ppp_psk").hide();$("#static6Table").hide();$("#IANATable").show();$("#PDTableStatic").hide();}
else
{$("#ipAddrTable").hide();$("#dialTable").show();$("#ppp_name").show();$("#ppp_psk").show();if(parseInt(pppoe_static_ip_support)==1)
{$("#pppStaticIPEnableTable").show();}
$("#static6Table").hide();$("#IANATable").show();$("#PDTableStatic").hide();}
$("#enblDSLite").prop("checked",false);$("#dsliteTable").hide();if(mode==8||mode==5||mode==7||mode==2){$("#default_route").show();$("#default_routev6").show();}else{$("#default_route").hide();$("#default_routev6").hide();}}
$("#ipv6rdTable").hide();break;}
show_span_mtu();}
function changeServiceMode(mode)
{if($("#connMode").val()=="bridge")
{$("#portbindtable").show();}
else
{if(mode==1||mode==3||mode==6)
{$("#portbindtable").hide();unSeleLanPort(-1);}
else
{$("#portbindtable").show();$("#nattable").show();}
changeIPVersion($("#IpVersion").val());}
if(allportlistarry.length<=1)
{$("#portbindtable").hide();}
if(mode==8||mode==5||mode==7||mode==2){$("#default_route").show();$("#default_routev6").show();}else{$("#default_route").hide();$("#default_routev6").hide();}}
function enableVlan(vlanmode)
{if(vlanmode=="2")
{$("#vlanvfg").show();}
else
{$("#vlanvfg").hide();}}
function enableDialMode(dialMode)
{if(dialMode=="2")
{$("#OnDemandTable").show();}
else
{$("#OnDemandTable").hide();}
$("#dialMode").val(dialMode);}
function setiotctrl()
{var ctrl=$('input:radio[name="IOT"]:checked').val();if(ctrl=="Enable")
{$("#IOT_SSID").show();$("#IOT_PSK").show();$("#IOTBSTable").show();}
else
{$("#IOT_SSID").hide();$("#IOT_PSK").hide();$("#IOTBSTable").hide();}}
function selectipproto(loadWanCfg)
{var proto=$('input:radio[name="ipproto"]:checked').val();changeIPVersion($("#IpVersion").val());if(proto=="static")
{$("input[type=radio][value='enable']").prop("checked",true);$("#dnsv6Table").show();$("#dnsv6disable").attr("disabled",true);}
else
{$("#dnsv6disable").attr("disabled",false);}
if(loadWanCfg!=1)
{if(proto=="static"||proto=="dhcp")
{$("#mtu").val(ipMaxMtu);}
else
{$("#mtu").val(pppMaxMtu);}
show_span_mtu();}}
function loadDefaultCfg()
{$("#enable").prop("checked",true);$("#connMode").val("route");changeConnMode("route");enableDialMode("1");$("#serviceMode").val("8");changeServiceMode("8");$("#IpVersion").val("2");changeIPVersion("2");unSeleLanPort(-1);enableLanPort();disableLanPort();$("#vlanMode").val("2");enableVlan("2");$("input[type=radio][value='dhcp']").prop("checked",true);selectipproto();$("#nat").prop("checked",true);$("#enblIANA").val("0");$("#enblPD").prop("checked",true);$("#enblPD").prop("checked",true);$("#default_route").show();$("#default_routev6").show();$("#defaultroute").prop("checked",true);for(var i=0;i<WanConnJson.length;i++){if(WanConnJson[i].is_defaultroute){$("#defaultroute").prop("checked",false);break;}}
$("#defaultroutev6").prop("checked",true);for(var i=0;i<WanConnJson.length;i++){if(WanConnJson[i].is_defaultroute_v6){$("#defaultroutev6").prop("checked",false);break;}}
show_span_mtu();}
function loadIpProtocol(IPVersion)
{var ipmode=0;if(IPVersion=='1')
ipmode=0;else if(IPVersion=='2')
ipmode=1;else if(IPVersion=='3')
ipmode=2;return ipmode;}
function loadBindPort(intf)
{var i=0,j=0;var parts=intf.split(',');for(i=0;i<allportlistarry.length;i++)
{for(j=0;j<parts.length;j++)
{if(allportlistarry[i].ifname==parts[j])
{seleLanPort(i);break;}
else
{unSeleLanPort(i);}}}}
function defroutecfg()
{$("#enable").prop("checked",true);$("#vlanMode").val("1");enableVlan("1");$("input[type=radio][value='pppoe']").prop("checked",true);selectipproto();$("#serviceMode").val("5");changeServiceMode("5");$("input[type=radio][name='dnsv6mode'][value='enable']").prop("checked",true);dns6Primary.value="2001:4860:4860::8888"
dns6Secondary.value="2001:4860:4860::8844"
selectdnsv6mode();$("#defaultroutev6").prop("checked",true);$("#defaultroute").prop("checked",true);hideElements();diableForFPT();}
function defbridgecfg()
{$("#vlanMode").val("1");enableVlan("1");hideElements();diableForFPT();}
function changeConnMode(mode)
{var f = document.forms[0];
var Box_TxPower = f.Box_TxPower, Chk_HideEnable = f.Chk_HideEnable, Chk_RadioEnable = f.Chk_RadioEnable, Chk_SsidEnable = f.Chk_SsidEnable, Control_Enable = f.Control_Enable, DMUMIMO_Enable = f.DMUMIMO_Enable, DMUOFDMA_Enable = f.DMUOFDMA_Enable, DSLiteEnable = f.DSLiteEnable, DSLiteEnableTable = f.DSLiteEnableTable, DSLiteModeTable = f.DSLiteModeTable, Defaultroute = f.Defaultroute, Defaultroutev6 = f.Defaultroutev6, Enable = f.Enable, EnableStaticIp = f.EnableStaticIp, IANATable = f.IANATable, IOT = f.IOT, IOTBS = f.IOTBS, IOTBSDisable = f.IOTBSDisable, IOTBSDisable_label = f.IOTBSDisable_label, IOTBSEnable = f.IOTBSEnable, IOTBSEnable_label = f.IOTBSEnable_label, IOTBSTable = f.IOTBSTable, IOTDisable = f.IOTDisable, IOTDisable_label = f.IOTDisable_label, IOTEnable = f.IOTEnable, IOTEnable_label = f.IOTEnable_label, IOTTable = f.IOTTable, IOT_PSK = f.IOT_PSK, IpVersion = f.IpVersion, Networkconfigid = f.Networkconfigid, OnDemandTable = f.OnDemandTable, PDTable = f.PDTable, PDTableStatic = f.PDTableStatic, Pwd_WpaPsk = f.Pwd_WpaPsk, Pwd_WpaPsk_IOT = f.Pwd_WpaPsk_IOT, Sel_AuthMode = f.Sel_AuthMode, Sel_BandWidth = f.Sel_BandWidth, Sel_Channel = f.Sel_Channel, Sel_Encryption = f.Sel_Encryption, Sel_PhyMode = f.Sel_PhyMode, Sel_TxPower = f.Sel_TxPower, Sel_guardInterval = f.Sel_guardInterval, Sky_Apply = f.Sky_Apply, Sky_Cancel = f.Sky_Cancel, Sky_DHCP_Disable = f.Sky_DHCP_Disable, Sky_DHCP_Enable = f.Sky_DHCP_Enable, Sky_DHCP_Mode_Auto = f.Sky_DHCP_Mode_Auto, Sky_DHCP_Mode_Proxy = f.Sky_DHCP_Mode_Proxy, Sky_DHCP_Mode_Static = f.Sky_DHCP_Mode_Static, Sky_DHCP_Relay = f.Sky_DHCP_Relay, Tr_Encryption = f.Tr_Encryption, Tr_WpaPSK = f.Tr_WpaPSK, Txt_SSID = f.Txt_SSID, Txt_SSID_IOT = f.Txt_SSID_IOT, Txt_acsTime = f.Txt_acsTime, UMUMIMO_Enable = f.UMUMIMO_Enable, UMUOFDMA_Enable = f.UMUOFDMA_Enable, WMM_Enable = f.WMM_Enable, briTable = f.briTable, bridgeapply = f.bridgeapply, btn_add = f.btn_add, btn_del = f.btn_del, btn_edit = f.btn_edit, button_apply = f.button_apply, client_num = f.client_num, connMode = f.connMode, d8021 = f.d8021, defGW = f.defGW, default_route = f.default_route, default_routev6 = f.default_routev6, defaultroute = f.defaultroute, defaultroutev6 = f.defaultroutev6, delegatePrefix = f.delegatePrefix, delegatePrefixLen = f.delegatePrefixLen, dhcpEthEnd = f.dhcpEthEnd, dhcpEthStart = f.dhcpEthStart, dhcpLeasedTime = f.dhcpLeasedTime, dhcpMode = f.dhcpMode, dhcpSrvAddr = f.dhcpSrvAddr, dhcpSrvType = f.dhcpSrvType, dhcpSrvType1 = f.dhcpSrvType1, dhcpSrvType2 = f.dhcpSrvType2, dhcpSrvType3 = f.dhcpSrvType3, dhcpstaticContent = f.dhcpstaticContent, dhcpstaticTBody = f.dhcpstaticTBody, dialMode = f.dialMode, dialTable = f.dialTable, dns6Primary = f.dns6Primary, dns6Secondary = f.dns6Secondary, dnsPrimary = f.dnsPrimary, dnsSecondary = f.dnsSecondary, dnsmode = f.dnsmode, dnsmode1 = f.dnsmode1, dnsmode2 = f.dnsmode2, dnsmode3 = f.dnsmode3, dnsv4Satic = f.dnsv4Satic, dnsv6Table = f.dnsv6Table, dnsv6disable = f.dnsv6disable, dnsv6enable = f.dnsv6enable, dnsv6mode = f.dnsv6mode, dsLiteServer = f.dsLiteServer, dsliteManualTable = f.dsliteManualTable, dsliteMode = f.dsliteMode, dsliteModeAuto = f.dsliteModeAuto, dsliteModeManual = f.dsliteModeManual, dsliteTable = f.dsliteTable, enable = f.enable, enbl6RD = f.enbl6RD, enblDSLite = f.enblDSLite, enblIANA = f.enblIANA, enblPD = f.enblPD, ethIpAddress = f.ethIpAddress, ethSubnetMask = f.ethSubnetMask, firstDns = f.firstDns, fullConeNat = f.fullConeNat, fullapply = f.fullapply, idleTime = f.idleTime, ipAddr = f.ipAddr, ipAddrTable = f.ipAddrTable, ipproto = f.ipproto, ipprotodhcp = f.ipprotodhcp, ipprotopppoe = f.ipprotopppoe, ipprotostatic = f.ipprotostatic, ipv6RDEnableTable = f.ipv6RDEnableTable, ipv6RDMode = f.ipv6RDMode, ipv6RDModeAuto = f.ipv6RDModeAuto, ipv6RDModeManual = f.ipv6RDModeManual, ipv6RDModeTable = f.ipv6RDModeTable, ipv6Table = f.ipv6Table, ipv6rdBrAddr = f.ipv6rdBrAddr, ipv6rdIpv4MaskLen = f.ipv6rdIpv4MaskLen, ipv6rdManualTable = f.ipv6rdManualTable, ipv6rdPrefix = f.ipv6rdPrefix, ipv6rdPrefixLen = f.ipv6rdPrefixLen, ipv6rdTable = f.ipv6rdTable, ipversionmode = f.ipversionmode, lan_port_list = f.lan_port_list, lancfg_StaticipAdd = f.lancfg_StaticipAdd, lancfg_StaticipDel = f.lancfg_StaticipDel, lancfg_dhcpserver = f.lancfg_dhcpserver, maximum_client = f.maximum_client, mtu = f.mtu, multiVID = f.multiVID, nat = f.nat, natEnble = f.natEnble, nattable = f.nattable, netMask = f.netMask, noipv6apply = f.noipv6apply, pdEnable = f.pdEnable, portbindtable = f.portbindtable, pppStaticEndAddress = f.pppStaticEndAddress, pppStaticIPAddress = f.pppStaticIPAddress, pppStaticIPEnableTable = f.pppStaticIPEnableTable, pppStaticIPTable = f.pppStaticIPTable, pppStaticStartAddress = f.pppStaticStartAddress, pppStaticSubnetMask = f.pppStaticSubnetMask, pppoeMode = f.pppoeMode, radio_hide = f.radio_hide, relayInfo = f.relayInfo, rouTable = f.rouTable, secondDns = f.secondDns, selectAll = f.selectAll, seletall = f.seletall, serviceMode = f.serviceMode, span_mtu = f.span_mtu, static6Table = f.static6Table, staticIpAll_Sel = f.staticIpAll_Sel, staticIp_Tbl = f.staticIp_Tbl, staticMode = f.staticMode, uPsd = f.uPsd, userName = f.userName, vlanID = f.vlanID, vlanMode = f.vlanMode, vlanvfg = f.vlanvfg, wanAddress6 = f.wanAddress6, wanAddress6prefix = f.wanAddress6prefix, wanGateway6 = f.wanGateway6, wanform = f.wanform, wanindex = f.wanindex, wantittleinfo = f.wantittleinfo;
if(true)
{IpVersion.disabled=false;}
$("#ipv6rdTable").hide();$("#dsliteTable").hide();if(allportlistarry.length>1)
{$("#portbindtable").show();}
if(mode=="bridge")
{$("#serviceMode").empty();$("#serviceMode").append("<option value=2>INTERNET</option>");$("#serviceMode").append("<option value=4>IPTV</option>");$("#serviceMode").append("<option value=3>VOIP</option>");$("#ipversionmode").hide();$("#Networkconfigid").hide();$("#ipv6Table").hide();$("#bridgeapply").show();$("#briTable").show();$("#nat").prop("checked",false);$("#rouTable").hide();$("#vlanMode").empty();$("#vlanMode").append("<option value=2 selected = \"selected\">TAG</option>");$("#vlanMode").append("<option value=1>TRANSPARENT</option>");enableVlan("2");$("#mtu").val(bridgeMaxMtu);$("#default_route").hide();$("#default_routev6").hide();defbridgecfg();}
else
{$("#serviceMode").empty();$("#serviceMode").append("<option value=8>TR069_VOIP_INTERNET</option>");$("#serviceMode").append("<option value=1>TR069</option>");$("#serviceMode").append("<option value=6>TR069_VOIP</option>");$("#serviceMode").append("<option value=5>TR069_INTERNET</option>");$("#serviceMode").append("<option value=3>VOIP</option>");$("#serviceMode").append("<option value=7>VOIP_INTERNET</option>");$("#serviceMode").append("<option value=2>INTERNET</option>");$("#serviceMode").append("<option value=4>IPTV</option>");$("#bridgeapply").hide();$("#ipversionmode").show();$("#Networkconfigid").show();$("#ipv6Table").show();changeIPVersion($("#IpVersion").val());$("#briTable").hide();$("#rouTable").show();$("#vlanMode").empty();$("#vlanMode").append("<option value=2 selected = \"selected\">TAG</option>");$("#vlanMode").append("<option value=1>UNTAG</option>");enableVlan("2");if($('input:radio[name="ipproto"]:checked').val()=="pppoe")
{$("#mtu").val(pppMaxMtu);}
else
{$("#mtu").val(ipMaxMtu);}
if(1==$("#IpVersion").val()){$("#dsliteTable").show();$("#default_route").hide();$("#default_routev6").show();}else if(0==$("#IpVersion").val()){$("#default_route").show();$("#default_routev6").hide();}else{$("#default_route").show();$("#default_routev6").show();}
defroutecfg();}
show_span_mtu();}
function loadWanCfg(selindex)
{var index=0;for(var i=0;i<WanConnJson.length;i++){if(WanConnJson[i].index==selindex)
index=i;}
if(WanConnJson[index].enable=="1")
$("#enable").prop("checked",true);else
$("#enable").prop("checked",false);var contypestr=getConnectypeStr(WanConnJson[index].networktype);if(contypestr=="Bridge")
{$("#connMode").val("bridge");changeConnMode("bridge");}
else
{$("#connMode").val("route");changeConnMode("route");}
var servermode=WanConnJson[index].servicelist;$("#serviceMode").val(servermode);changeServiceMode(servermode);if(contypestr!="Bridge")
{var ipversion=loadIpProtocol(WanConnJson[index].IPStack);$("#IpVersion").val(ipversion.toString());changeIPVersion(ipversion.toString());}
loadBindPort(WanConnJson[index].portbind);enableLanPort();disableLanPort();if(WanConnJson[index].vlanmode=="2")
{$("#vlanMode").val("2");$("#vlanID").val(WanConnJson[index].vlanid);if(WanConnJson[index].multivid=="0")
$("#multiVID").val("");else
$("#multiVID").val(WanConnJson[index].multivid);$("#d8021").val(WanConnJson[index].vlanpri);enableVlan("2");}
else
{$("#vlanMode").val("1");enableVlan("1");}
$("#mtu").val(WanConnJson[index].mtu);if(contypestr=="PPPoE")
{$("input[type=radio][value='pppoe']").prop("checked",true);$("#userName").val(WanConnJson[index].pppoename);$("#uPsd").val(WanConnJson[index].pppoepwd);if(WanConnJson[index].PPPoEStaticIPEnable==undefined||WanConnJson[index].PPPoEStaticIPEnable=='0')
{$("#EnableStaticIp").prop("checked",false);}
else
{$("#EnableStaticIp").prop("checked",true);}
$("#pppStaticIPAddress").val(WanConnJson[index].PPPoEStaticAddr);$("#pppStaticSubnetMask").val(WanConnJson[index].PPPoEStaticMask);$("#pppStaticStartAddress").val(WanConnJson[index].PPPoEStaticStartAddr);$("#pppStaticEndAddress").val(WanConnJson[index].PPPoEStaticEndAddr);PPPUseStaticIP();if(WanConnJson[index].dial==undefined||WanConnJson[index].dial=='0')
{enableDialMode("1");}
else
{enableDialMode("2");$("#idleTime").val(WanConnJson[index].dial/60);}
if(WanConnJson[index].peer_dnsv6==1)
{$("input[type=radio][value='disable']").prop("checked",true);$("#dnsv6Table").hide();}
else
{$("#dnsv6Table").show();$("input[type=radio][value='enable']").prop("checked",true);$("#dns6Primary").val(WanConnJson[index].peer_staticdns1v6);$("#dns6Secondary").val(WanConnJson[index].peer_staticdns2v6);}
selectipproto(1);}
else if(contypestr=="DHCP")
{$("input[type=radio][value='dhcp']").prop("checked",true);selectipproto(1);}
else if(contypestr=="Static IP")
{$("input[type=radio][value='static']").prop("checked",true);selectipproto(1);}
if(contypestr!="PPPoE"&&contypestr!="Bridge")
{if(ipversion==0||ipversion==2)
{$("#ipAddr").val(WanConnJson[index].ipaddr);$("#netMask").val(WanConnJson[index].subnetmask);$("#defGW").val(WanConnJson[index].gateway);$("#firstDns").val(WanConnJson[index].dns1);$("#secondDns").val(WanConnJson[index].dns2);}
if(ipversion==1||ipversion==2)
{var address6='';var prefixLen=64;var parts=WanConnJson[index].gua.split('/');if(parts.length>0)
address6=parts[0];if(parts.length>1)
prefixLen=parts[1];$("#wanAddress6").val(address6);$("#wanAddress6prefix").val(prefixLen);$("#wanGateway6").val(WanConnJson[index].gatewayv6);if(WanConnJson[index].networktype=='static')
{$("#dns6Primary").val(WanConnJson[index].dns1v6);$("#dns6Secondary").val(WanConnJson[index].dns2v6);}
else
{$("#dns6Primary").val(WanConnJson[index].peer_staticdns1v6);$("#dns6Secondary").val(WanConnJson[index].peer_staticdns2v6);}
if(WanConnJson[index].peer_dnsv6==1)
{$("#dnsv6Table").hide();$("input[type=radio][value='disable']").prop("checked",true);}
else
{$("#dnsv6Table").show();$("input[type=radio][value='enable']").prop("checked",true);}
if(WanConnJson[index].prefixsrc==2)
{var pd='';var pdLen=64;var pdParts=WanConnJson[index].prefix.split('/');if(pdParts.length>0)
pd=pdParts[0];if(pdParts.length>1)
pdLen=pdParts[1];$("#delegatePrefix").val(pd);$("#delegatePrefixLen").val(pdLen);}}}
if(contypestr!="Bridge")
{var service_Mode=$("#serviceMode").val();if(ipversion==0||ipversion==2)
{if(WanConnJson[index].natenable=="1")
$("#nat").prop("checked",true);else
$("#nat").prop("checked",false);if(service_Mode==3)
{$("#nattable").hide();}
else
{$("#nattable").show();}}
if(ipversion==1||ipversion==2)
{if(contypestr!="Static IP")
{if(WanConnJson[index].guasrc==1)
{$("#enblIANA").val(1);}
else
{$("#enblIANA").val(0);}}
if(WanConnJson[index].prefixsrc==1||WanConnJson[index].prefixsrc==2)
{$("#enblPD").prop("checked",true);}
else
{$("#enblPD").prop("checked",false);$("#PDTableStatic").hide();}
if(service_Mode==1||service_Mode==3||service_Mode==6)
{$("#PDTable").hide();}
else
{$("#PDTable").show();}}
if(ipversion==1)
{var dslite_exist=0;for(let i=0;i<WanConnJson.length;i++){if(WanConnJson[i].dslite!=0){dslite_exist=i;break;}}
if(dslite_exist!=0&&index!=dslite_exist){$("#dsliteTable").hide();}else{$("#dsliteTable").show();if(WanConnJson[index].dslite==0){$("#enblDSLite").prop("checked",false);$("#DSLiteModeTable").hide();}
else if(WanConnJson[index].dslite==1){$("#enblDSLite").prop("checked",true);$("#dsliteModeAuto").prop("checked",true);$("#dsliteManualTable").hide();}else{$("#enblDSLite").prop("checked",true);$("#dsliteModeManual").prop("checked",true);$("#dsLiteServer").val(WanConnJson[index].dslite_peeraddr);$("#dsliteManualTable").show();}}
if(WanConnJson[index].servicelist==8||WanConnJson[index].servicelist==5||WanConnJson[index].servicelist==7||WanConnJson[index].servicelist==2){$("#default_route").hide();$("#default_routev6").show();if(WanConnJson[index].is_defaultroute_v6==1)
$("#defaultroutev6").prop("checked",true);else
$("#defaultroutev6").prop("checked",false);}else{$("#default_route").hide();$("#default_routev6").hide();}}
else if(ipversion==0){var ipv6rd_exist=0;for(let i=0;i<WanConnJson.length;i++){if(WanConnJson[i].ipv6rd==1){ipv6rd_exist=i;break;}}
if(ipv6rd_exist!=0&&index!=ipv6rd_exist){$("#ipv6rdTable").hide();}else{$("#ipv6rdTable").show();if(WanConnJson[index].ipv6rd==0)
{$("#enbl6RD").prop("checked",false);$("#ipv6RDModeTable").hide();$("#ipv6rdManualTable").hide();}
else
{$("#enbl6RD").prop("checked",true);$("#ipv6RDModeTable").show();if(WanConnJson[index].ipv6rd==1)
{$("#ipv6RDModeAuto").prop("checked",true);$("#ipv6rdManualTable").hide();}
else
{$("#ipv6RDModeManual").prop("checked",true);$("#ipv6rdManualTable").show();$("#ipv6rdBrAddr").val(WanConnJson[index].ipv6rd_peeraddr);$("#ipv6rdIpv4MaskLen").val(WanConnJson[index].ipv6rd_ipv4mask_len);$("#ipv6rdPrefix").val(WanConnJson[index].ipv6rd_ipv6prefix);$("#ipv6rdPrefixLen").val(WanConnJson[index].ipv6rd_ipv6prefix_len);}}}
if(WanConnJson[index].servicelist==8||WanConnJson[index].servicelist==5||WanConnJson[index].servicelist==7||WanConnJson[index].servicelist==2){$("#default_route").show();$("#default_routev6").hide();if(WanConnJson[index].is_defaultroute==1)
$("#defaultroute").prop("checked",true);else
$("#defaultroute").prop("checked",false);}else{$("#default_route").hide();$("#default_routev6").hide();}}else{if(WanConnJson[index].servicelist==8||WanConnJson[index].servicelist==5||WanConnJson[index].servicelist==7||WanConnJson[index].servicelist==2){$("#default_route").show();$("#default_routev6").show();if(WanConnJson[index].is_defaultroute==1)
$("#defaultroute").prop("checked",true);else
$("#defaultroute").prop("checked",false);if(WanConnJson[index].is_defaultroute_v6==1)
$("#defaultroutev6").prop("checked",true);else
$("#defaultroutev6").prop("checked",false);}else{$("#default_route").hide();$("#default_routev6").hide();}}}
else
{$("#default_route").hide();$("#default_routev6").hide();}
show_span_mtu();}
function addwan()
{actionapply="add";selindex="";loadDefaultCfg();$("#wantittleinfo").html(_("wancfg_AddnewWANinterface"));enableForFPT();$("#wanindex").hide();$("#wanform").fadeIn(300);}
function editwan()
{var selectnum=0;var connname;if(WanConnJson.length==0)
return;var selist=$("input[name='rml']");if(selist.length===undefined)
{if(selist.checked==true)
{selectnum=1;selindex=selist.value;connname=getServerModeStr(WanConnJson[0].servicelist)}}
else
{for(var i=0;i<selist.length;i++){if(selist[i].checked==true)
{selindex=selist[i].value;connname=getServerModeStr(WanConnJson[i].servicelist)
selectnum++;}}}
if(selectnum!=1)
return false;actionapply="edit";loadWanCfg(selindex);diableForFPT();$("#wantittleinfo").html("Edit <i>"+connname+"</i> interface configuration");$("#wanindex").hide();$("#wanform").fadeIn(300);}
function diableForFPT()
{serviceMode.disabled=true;IpVersion.disabled=true;nat.disabled=true;}
function enableForFPT()
{serviceMode.disabled=false;IpVersion.disabled=false;nat.disabled=false;}
function delWanIface(index)
{apply_data={};if(ft_passthrough_bridge==='1'){var del_wancfg=WanConnJson[index-1];var utag_bridge_num=0;var same_vlan_route_wan=false;for(var i=0;i<WanConnJson.length;i++){if(!WanConnJson[i])
continue;if(WanConnJson[i].index==index){del_wancfg=WanConnJson[i];break;}}
if(del_wancfg){if(del_wancfg.networktype=="bridge"&&del_wancfg.vlanmode==1){var vlan_array=[];for(var i=0;i<WanConnJson.length;i++){if(WanConnJson[i].networktype=="bridge"&&WanConnJson[i].vlanmode==1)
utag_bridge_num++;}
for(var i=0;i<WanConnJson.length;i++){for(j=0;j<vlan_array.length;j++){if(WanConnJson[i].vlanid==vlan_array[j]){same_vlan_route_wan=true;break;}}
vlan_array[i]=WanConnJson[i].vlanid;}
if(same_vlan_route_wan&&utag_bridge_num==1){warninfo_show(_("wancfg_vlan_exist_on_del_utag_bridge_error"));return;}}}}
apply_data.index=parseInt(index);ubusparam=new Array("gwweb.wancfg","del_WanConnection",apply_data);jsonparam={"id":1,"params":ubusparam};sk_auth_apply(jsonparam,function(result){delist.shift();if(delist.length==0)
{pageLoad();return;}
delWanIface(delist[0]);});}
function removeClick()
{var selist=$("input[name='rml']");if(selist.length===undefined)
{if(selist.checked==true)
{delist.push(selist.value)}}
else
{for(var i=0;i<selist.length;i++){if(selist[i].checked==true)
{delist.push(selist[i].value)}}}
console.log(delist);if(delist.length==0)
return;delWanIface(delist[0]);}
function getServerModeStr(servMode)
{var smodestr;switch(parseInt(servMode))
{case 1:smodestr="TR069";break;case 2:smodestr="INTERNET";break;case 3:smodestr="VOIP";break;case 4:smodestr="IPTV";break;case 5:smodestr="TR069_INTERNET";break;case 6:smodestr="TR069_VOIP";break;case 7:smodestr="VOIP_INTERNET";break;default:smodestr="TR069_VOIP_INTERNET";break;}
return smodestr;}
function getIpmodeStr(ipProtocalMode)
{var ipProtocalstr;switch(parseInt(ipProtocalMode))
{case 1:ipProtocalstr="IPv4";break;case 2:ipProtocalstr="IPv6";break;case 3:ipProtocalstr="IPv4 & IPv6";break;default:ipProtocalstr="IPv4";break;}
return ipProtocalstr;}
function getConnectypeStr(connectype)
{var contypestr;connectype=connectype.toLowerCase();if(connectype=="dhcp")
{contypestr="DHCP";}
else if(connectype=="pppoe")
{contypestr="PPPoE";}
else if(connectype=="bridge")
{contypestr="Bridge";}
else if(connectype=="static")
{contypestr="Static IP";}
else if(connectype=="ds-lite")
{contypestr="DS-Lite";}
else
{contypestr="DHCP";}
return contypestr;}
function getVlanidprioStr(vlanmode,vlanid,priority)
{var vpstr;if(vlanmode!='2')
{vpstr="--";}
else
{vpstr=vlanid+" / "+priority;}
return vpstr;}
function creatPortbindList(portbind)
{var j=0;var portbindList="";var num=0;var lanPortLabel;var lanPortCheck;var list="";var f = document.forms[0];
var Box_TxPower = f.Box_TxPower, Chk_HideEnable = f.Chk_HideEnable, Chk_RadioEnable = f.Chk_RadioEnable, Chk_SsidEnable = f.Chk_SsidEnable, Control_Enable = f.Control_Enable, DMUMIMO_Enable = f.DMUMIMO_Enable, DMUOFDMA_Enable = f.DMUOFDMA_Enable, DSLiteEnable = f.DSLiteEnable, DSLiteEnableTable = f.DSLiteEnableTable, DSLiteModeTable = f.DSLiteModeTable, Defaultroute = f.Defaultroute, Defaultroutev6 = f.Defaultroutev6, Enable = f.Enable, EnableStaticIp = f.EnableStaticIp, IANATable = f.IANATable, IOT = f.IOT, IOTBS = f.IOTBS, IOTBSDisable = f.IOTBSDisable, IOTBSDisable_label = f.IOTBSDisable_label, IOTBSEnable = f.IOTBSEnable, IOTBSEnable_label = f.IOTBSEnable_label, IOTBSTable = f.IOTBSTable, IOTDisable = f.IOTDisable, IOTDisable_label = f.IOTDisable_label, IOTEnable = f.IOTEnable, IOTEnable_label = f.IOTEnable_label, IOTTable = f.IOTTable, IOT_PSK = f.IOT_PSK, IpVersion = f.IpVersion, Networkconfigid = f.Networkconfigid, OnDemandTable = f.OnDemandTable, PDTable = f.PDTable, PDTableStatic = f.PDTableStatic, Pwd_WpaPsk = f.Pwd_WpaPsk, Pwd_WpaPsk_IOT = f.Pwd_WpaPsk_IOT, Sel_AuthMode = f.Sel_AuthMode, Sel_BandWidth = f.Sel_BandWidth, Sel_Channel = f.Sel_Channel, Sel_Encryption = f.Sel_Encryption, Sel_PhyMode = f.Sel_PhyMode, Sel_TxPower = f.Sel_TxPower, Sel_guardInterval = f.Sel_guardInterval, Sky_Apply = f.Sky_Apply, Sky_Cancel = f.Sky_Cancel, Sky_DHCP_Disable = f.Sky_DHCP_Disable, Sky_DHCP_Enable = f.Sky_DHCP_Enable, Sky_DHCP_Mode_Auto = f.Sky_DHCP_Mode_Auto, Sky_DHCP_Mode_Proxy = f.Sky_DHCP_Mode_Proxy, Sky_DHCP_Mode_Static = f.Sky_DHCP_Mode_Static, Sky_DHCP_Relay = f.Sky_DHCP_Relay, Tr_Encryption = f.Tr_Encryption, Tr_WpaPSK = f.Tr_WpaPSK, Txt_SSID = f.Txt_SSID, Txt_SSID_IOT = f.Txt_SSID_IOT, Txt_acsTime = f.Txt_acsTime, UMUMIMO_Enable = f.UMUMIMO_Enable, UMUOFDMA_Enable = f.UMUOFDMA_Enable, WMM_Enable = f.WMM_Enable, briTable = f.briTable, bridgeapply = f.bridgeapply, btn_add = f.btn_add, btn_del = f.btn_del, btn_edit = f.btn_edit, button_apply = f.button_apply, client_num = f.client_num, connMode = f.connMode, d8021 = f.d8021, defGW = f.defGW, default_route = f.default_route, default_routev6 = f.default_routev6, defaultroute = f.defaultroute, defaultroutev6 = f.defaultroutev6, delegatePrefix = f.delegatePrefix, delegatePrefixLen = f.delegatePrefixLen, dhcpEthEnd = f.dhcpEthEnd, dhcpEthStart = f.dhcpEthStart, dhcpLeasedTime = f.dhcpLeasedTime, dhcpMode = f.dhcpMode, dhcpSrvAddr = f.dhcpSrvAddr, dhcpSrvType = f.dhcpSrvType, dhcpSrvType1 = f.dhcpSrvType1, dhcpSrvType2 = f.dhcpSrvType2, dhcpSrvType3 = f.dhcpSrvType3, dhcpstaticContent = f.dhcpstaticContent, dhcpstaticTBody = f.dhcpstaticTBody, dialMode = f.dialMode, dialTable = f.dialTable, dns6Primary = f.dns6Primary, dns6Secondary = f.dns6Secondary, dnsPrimary = f.dnsPrimary, dnsSecondary = f.dnsSecondary, dnsmode = f.dnsmode, dnsmode1 = f.dnsmode1, dnsmode2 = f.dnsmode2, dnsmode3 = f.dnsmode3, dnsv4Satic = f.dnsv4Satic, dnsv6Table = f.dnsv6Table, dnsv6disable = f.dnsv6disable, dnsv6enable = f.dnsv6enable, dnsv6mode = f.dnsv6mode, dsLiteServer = f.dsLiteServer, dsliteManualTable = f.dsliteManualTable, dsliteMode = f.dsliteMode, dsliteModeAuto = f.dsliteModeAuto, dsliteModeManual = f.dsliteModeManual, dsliteTable = f.dsliteTable, enable = f.enable, enbl6RD = f.enbl6RD, enblDSLite = f.enblDSLite, enblIANA = f.enblIANA, enblPD = f.enblPD, ethIpAddress = f.ethIpAddress, ethSubnetMask = f.ethSubnetMask, firstDns = f.firstDns, fullConeNat = f.fullConeNat, fullapply = f.fullapply, idleTime = f.idleTime, ipAddr = f.ipAddr, ipAddrTable = f.ipAddrTable, ipproto = f.ipproto, ipprotodhcp = f.ipprotodhcp, ipprotopppoe = f.ipprotopppoe, ipprotostatic = f.ipprotostatic, ipv6RDEnableTable = f.ipv6RDEnableTable, ipv6RDMode = f.ipv6RDMode, ipv6RDModeAuto = f.ipv6RDModeAuto, ipv6RDModeManual = f.ipv6RDModeManual, ipv6RDModeTable = f.ipv6RDModeTable, ipv6Table = f.ipv6Table, ipv6rdBrAddr = f.ipv6rdBrAddr, ipv6rdIpv4MaskLen = f.ipv6rdIpv4MaskLen, ipv6rdManualTable = f.ipv6rdManualTable, ipv6rdPrefix = f.ipv6rdPrefix, ipv6rdPrefixLen = f.ipv6rdPrefixLen, ipv6rdTable = f.ipv6rdTable, ipversionmode = f.ipversionmode, lan_port_list = f.lan_port_list, lancfg_StaticipAdd = f.lancfg_StaticipAdd, lancfg_StaticipDel = f.lancfg_StaticipDel, lancfg_dhcpserver = f.lancfg_dhcpserver, maximum_client = f.maximum_client, mtu = f.mtu, multiVID = f.multiVID, nat = f.nat, natEnble = f.natEnble, nattable = f.nattable, netMask = f.netMask, noipv6apply = f.noipv6apply, pdEnable = f.pdEnable, portbindtable = f.portbindtable, pppStaticEndAddress = f.pppStaticEndAddress, pppStaticIPAddress = f.pppStaticIPAddress, pppStaticIPEnableTable = f.pppStaticIPEnableTable, pppStaticIPTable = f.pppStaticIPTable, pppStaticStartAddress = f.pppStaticStartAddress, pppStaticSubnetMask = f.pppStaticSubnetMask, pppoeMode = f.pppoeMode, radio_hide = f.radio_hide, relayInfo = f.relayInfo, rouTable = f.rouTable, secondDns = f.secondDns, selectAll = f.selectAll, seletall = f.seletall, serviceMode = f.serviceMode, span_mtu = f.span_mtu, static6Table = f.static6Table, staticIpAll_Sel = f.staticIpAll_Sel, staticIp_Tbl = f.staticIp_Tbl, staticMode = f.staticMode, uPsd = f.uPsd, userName = f.userName, vlanID = f.vlanID, vlanMode = f.vlanMode, vlanvfg = f.vlanvfg, wanAddress6 = f.wanAddress6, wanAddress6prefix = f.wanAddress6prefix, wanGateway6 = f.wanGateway6, wanform = f.wanform, wanindex = f.wanindex, wantittleinfo = f.wantittleinfo;
if(true)
{var parts=portbind.split(',');for(i=0;i<parts.length;i++)
{for(j=0;j<allportlistarry.length;j++)
{if(allportlistarry[j].ifname==parts[i])
{portbindList+=allportlistarry[j].labelname;portbindList+=", ";num++;}}}}
if(num==0)
{portbindList="--";}
return portbindList;}
function showWanEntry()
{var wanEntry="";var i=0;var portbindListStr="--";$('#seletall').prop('checked',false);$("#wan_entry_list").empty();if(WanConnJson.length>0)
{for(i=0;i<WanConnJson.length;i++)
{if(WanConnJson[i].GUIname.indexOf("IPTV")!==-1)
continue;wanEntry+="<tr><td>";wanEntry+="<label class='skcheckbox'>";wanEntry+=" <input type='checkbox' id='rml"+i+"' name='rml' value='"+WanConnJson[i].index+"' onclick='changeSel(this)' hidden checked>";wanEntry+="<label for='rml"+i+"' class='skcheckbox-label'></label>";wanEntry+="</label>";wanEntry+="</td>";wanEntry+="<td>"+WanConnJson[i].GUIname+"</td>";wanEntry+="<td>"+getConnectypeStr(WanConnJson[i].networktype)+"</td>";wanEntry+="<td>"+getIpmodeStr(WanConnJson[i].IPStack)+"</td>";wanEntry+="<td>"+getVlanidprioStr(WanConnJson[i].vlanmode,WanConnJson[i].vlanid,WanConnJson[i].vlanpri)+"</td>";portbindListStr=creatPortbindList(WanConnJson[i].portbind);wanEntry+="<td style=\"max-width: 140px;overflow: hidden;text-overflow: ellipsis;white-space: nowrap;\">"+portbindListStr+"</td>";wanEntry+="</tr>";}
$("#seletall").attr("disabled",false);}
else
{wanEntry="<tr><td colspan='7'>No data yet...</td></tr>";$("#seletall").attr("disabled",true);}
$("#wan_entry_list").append(wanEntry);}
function saveMtu()
{var maxMtu;var f = document.forms[0];
var Box_TxPower = f.Box_TxPower, Chk_HideEnable = f.Chk_HideEnable, Chk_RadioEnable = f.Chk_RadioEnable, Chk_SsidEnable = f.Chk_SsidEnable, Control_Enable = f.Control_Enable, DMUMIMO_Enable = f.DMUMIMO_Enable, DMUOFDMA_Enable = f.DMUOFDMA_Enable, DSLiteEnable = f.DSLiteEnable, DSLiteEnableTable = f.DSLiteEnableTable, DSLiteModeTable = f.DSLiteModeTable, Defaultroute = f.Defaultroute, Defaultroutev6 = f.Defaultroutev6, Enable = f.Enable, EnableStaticIp = f.EnableStaticIp, IANATable = f.IANATable, IOT = f.IOT, IOTBS = f.IOTBS, IOTBSDisable = f.IOTBSDisable, IOTBSDisable_label = f.IOTBSDisable_label, IOTBSEnable = f.IOTBSEnable, IOTBSEnable_label = f.IOTBSEnable_label, IOTBSTable = f.IOTBSTable, IOTDisable = f.IOTDisable, IOTDisable_label = f.IOTDisable_label, IOTEnable = f.IOTEnable, IOTEnable_label = f.IOTEnable_label, IOTTable = f.IOTTable, IOT_PSK = f.IOT_PSK, IpVersion = f.IpVersion, Networkconfigid = f.Networkconfigid, OnDemandTable = f.OnDemandTable, PDTable = f.PDTable, PDTableStatic = f.PDTableStatic, Pwd_WpaPsk = f.Pwd_WpaPsk, Pwd_WpaPsk_IOT = f.Pwd_WpaPsk_IOT, Sel_AuthMode = f.Sel_AuthMode, Sel_BandWidth = f.Sel_BandWidth, Sel_Channel = f.Sel_Channel, Sel_Encryption = f.Sel_Encryption, Sel_PhyMode = f.Sel_PhyMode, Sel_TxPower = f.Sel_TxPower, Sel_guardInterval = f.Sel_guardInterval, Sky_Apply = f.Sky_Apply, Sky_Cancel = f.Sky_Cancel, Sky_DHCP_Disable = f.Sky_DHCP_Disable, Sky_DHCP_Enable = f.Sky_DHCP_Enable, Sky_DHCP_Mode_Auto = f.Sky_DHCP_Mode_Auto, Sky_DHCP_Mode_Proxy = f.Sky_DHCP_Mode_Proxy, Sky_DHCP_Mode_Static = f.Sky_DHCP_Mode_Static, Sky_DHCP_Relay = f.Sky_DHCP_Relay, Tr_Encryption = f.Tr_Encryption, Tr_WpaPSK = f.Tr_WpaPSK, Txt_SSID = f.Txt_SSID, Txt_SSID_IOT = f.Txt_SSID_IOT, Txt_acsTime = f.Txt_acsTime, UMUMIMO_Enable = f.UMUMIMO_Enable, UMUOFDMA_Enable = f.UMUOFDMA_Enable, WMM_Enable = f.WMM_Enable, briTable = f.briTable, bridgeapply = f.bridgeapply, btn_add = f.btn_add, btn_del = f.btn_del, btn_edit = f.btn_edit, button_apply = f.button_apply, client_num = f.client_num, connMode = f.connMode, d8021 = f.d8021, defGW = f.defGW, default_route = f.default_route, default_routev6 = f.default_routev6, defaultroute = f.defaultroute, defaultroutev6 = f.defaultroutev6, delegatePrefix = f.delegatePrefix, delegatePrefixLen = f.delegatePrefixLen, dhcpEthEnd = f.dhcpEthEnd, dhcpEthStart = f.dhcpEthStart, dhcpLeasedTime = f.dhcpLeasedTime, dhcpMode = f.dhcpMode, dhcpSrvAddr = f.dhcpSrvAddr, dhcpSrvType = f.dhcpSrvType, dhcpSrvType1 = f.dhcpSrvType1, dhcpSrvType2 = f.dhcpSrvType2, dhcpSrvType3 = f.dhcpSrvType3, dhcpstaticContent = f.dhcpstaticContent, dhcpstaticTBody = f.dhcpstaticTBody, dialMode = f.dialMode, dialTable = f.dialTable, dns6Primary = f.dns6Primary, dns6Secondary = f.dns6Secondary, dnsPrimary = f.dnsPrimary, dnsSecondary = f.dnsSecondary, dnsmode = f.dnsmode, dnsmode1 = f.dnsmode1, dnsmode2 = f.dnsmode2, dnsmode3 = f.dnsmode3, dnsv4Satic = f.dnsv4Satic, dnsv6Table = f.dnsv6Table, dnsv6disable = f.dnsv6disable, dnsv6enable = f.dnsv6enable, dnsv6mode = f.dnsv6mode, dsLiteServer = f.dsLiteServer, dsliteManualTable = f.dsliteManualTable, dsliteMode = f.dsliteMode, dsliteModeAuto = f.dsliteModeAuto, dsliteModeManual = f.dsliteModeManual, dsliteTable = f.dsliteTable, enable = f.enable, enbl6RD = f.enbl6RD, enblDSLite = f.enblDSLite, enblIANA = f.enblIANA, enblPD = f.enblPD, ethIpAddress = f.ethIpAddress, ethSubnetMask = f.ethSubnetMask, firstDns = f.firstDns, fullConeNat = f.fullConeNat, fullapply = f.fullapply, idleTime = f.idleTime, ipAddr = f.ipAddr, ipAddrTable = f.ipAddrTable, ipproto = f.ipproto, ipprotodhcp = f.ipprotodhcp, ipprotopppoe = f.ipprotopppoe, ipprotostatic = f.ipprotostatic, ipv6RDEnableTable = f.ipv6RDEnableTable, ipv6RDMode = f.ipv6RDMode, ipv6RDModeAuto = f.ipv6RDModeAuto, ipv6RDModeManual = f.ipv6RDModeManual, ipv6RDModeTable = f.ipv6RDModeTable, ipv6Table = f.ipv6Table, ipv6rdBrAddr = f.ipv6rdBrAddr, ipv6rdIpv4MaskLen = f.ipv6rdIpv4MaskLen, ipv6rdManualTable = f.ipv6rdManualTable, ipv6rdPrefix = f.ipv6rdPrefix, ipv6rdPrefixLen = f.ipv6rdPrefixLen, ipv6rdTable = f.ipv6rdTable, ipversionmode = f.ipversionmode, lan_port_list = f.lan_port_list, lancfg_StaticipAdd = f.lancfg_StaticipAdd, lancfg_StaticipDel = f.lancfg_StaticipDel, lancfg_dhcpserver = f.lancfg_dhcpserver, maximum_client = f.maximum_client, mtu = f.mtu, multiVID = f.multiVID, nat = f.nat, natEnble = f.natEnble, nattable = f.nattable, netMask = f.netMask, noipv6apply = f.noipv6apply, pdEnable = f.pdEnable, portbindtable = f.portbindtable, pppStaticEndAddress = f.pppStaticEndAddress, pppStaticIPAddress = f.pppStaticIPAddress, pppStaticIPEnableTable = f.pppStaticIPEnableTable, pppStaticIPTable = f.pppStaticIPTable, pppStaticStartAddress = f.pppStaticStartAddress, pppStaticSubnetMask = f.pppStaticSubnetMask, pppoeMode = f.pppoeMode, radio_hide = f.radio_hide, relayInfo = f.relayInfo, rouTable = f.rouTable, secondDns = f.secondDns, selectAll = f.selectAll, seletall = f.seletall, serviceMode = f.serviceMode, span_mtu = f.span_mtu, static6Table = f.static6Table, staticIpAll_Sel = f.staticIpAll_Sel, staticIp_Tbl = f.staticIp_Tbl, staticMode = f.staticMode, uPsd = f.uPsd, userName = f.userName, vlanID = f.vlanID, vlanMode = f.vlanMode, vlanvfg = f.vlanvfg, wanAddress6 = f.wanAddress6, wanAddress6prefix = f.wanAddress6prefix, wanGateway6 = f.wanGateway6, wanform = f.wanform, wanindex = f.wanindex, wantittleinfo = f.wantittleinfo;
if(true)
{maxMtu=parseInt(mtu.value);if(!isNumber(mtu.value)||maxMtu<currMinMtu||maxMtu>currMaxMtu)
{warninfo_show(_("wancfg_MTUValue")+": "+mtu.value+" "+_("wancfg_MTUValueError")+$("#span_mtu").html());return 0;}
apply_data.mtu=maxMtu}
return 1;}
var tr069ServiceBit=0;var internetServiceBit=1;var voipServiceBit=2;var otherServiceBit=3;function getServModeMask(serverlist)
{var servModeMask=(1<<internetServiceBit);switch(serverlist)
{case 8:servModeMask=(1<<tr069ServiceBit)|(1<<internetServiceBit)|(1<<voipServiceBit);break;case 1:servModeMask=(1<<tr069ServiceBit);break;case 6:servModeMask=(1<<tr069ServiceBit)|(1<<voipServiceBit);break;case 5:servModeMask=(1<<tr069ServiceBit)|(1<<internetServiceBit);break;case 3:servModeMask=(1<<voipServiceBit);break;case 7:servModeMask=(1<<internetServiceBit)|(1<<voipServiceBit);break;case 4:servModeMask=(1<<otherServiceBit);break;case 2:servModeMask=(1<<internetServiceBit);break;}
return servModeMask;}
function checkSameWanServiceExist(serviceBit)
{var i=0;var serviceMode=0;var servModeMask=0;for(i;i<WanConnJson.length;i++)
{serviceMode=WanConnJson[i].servicelist;servModeMask=getServModeMask(serviceMode)
if(actionapply=="add")
{if(servModeMask&(1<<serviceBit))
{return true;}}
else if(actionapply=="edit")
{if(selindex!=WanConnJson[i].index)
{if(servModeMask&(1<<serviceBit))
{return true;}}}}
return false;}
function saveServMode()
{var servModeMask=0;var serverlist=1;var f = document.forms[0];
var Box_TxPower = f.Box_TxPower, Chk_HideEnable = f.Chk_HideEnable, Chk_RadioEnable = f.Chk_RadioEnable, Chk_SsidEnable = f.Chk_SsidEnable, Control_Enable = f.Control_Enable, DMUMIMO_Enable = f.DMUMIMO_Enable, DMUOFDMA_Enable = f.DMUOFDMA_Enable, DSLiteEnable = f.DSLiteEnable, DSLiteEnableTable = f.DSLiteEnableTable, DSLiteModeTable = f.DSLiteModeTable, Defaultroute = f.Defaultroute, Defaultroutev6 = f.Defaultroutev6, Enable = f.Enable, EnableStaticIp = f.EnableStaticIp, IANATable = f.IANATable, IOT = f.IOT, IOTBS = f.IOTBS, IOTBSDisable = f.IOTBSDisable, IOTBSDisable_label = f.IOTBSDisable_label, IOTBSEnable = f.IOTBSEnable, IOTBSEnable_label = f.IOTBSEnable_label, IOTBSTable = f.IOTBSTable, IOTDisable = f.IOTDisable, IOTDisable_label = f.IOTDisable_label, IOTEnable = f.IOTEnable, IOTEnable_label = f.IOTEnable_label, IOTTable = f.IOTTable, IOT_PSK = f.IOT_PSK, IpVersion = f.IpVersion, Networkconfigid = f.Networkconfigid, OnDemandTable = f.OnDemandTable, PDTable = f.PDTable, PDTableStatic = f.PDTableStatic, Pwd_WpaPsk = f.Pwd_WpaPsk, Pwd_WpaPsk_IOT = f.Pwd_WpaPsk_IOT, Sel_AuthMode = f.Sel_AuthMode, Sel_BandWidth = f.Sel_BandWidth, Sel_Channel = f.Sel_Channel, Sel_Encryption = f.Sel_Encryption, Sel_PhyMode = f.Sel_PhyMode, Sel_TxPower = f.Sel_TxPower, Sel_guardInterval = f.Sel_guardInterval, Sky_Apply = f.Sky_Apply, Sky_Cancel = f.Sky_Cancel, Sky_DHCP_Disable = f.Sky_DHCP_Disable, Sky_DHCP_Enable = f.Sky_DHCP_Enable, Sky_DHCP_Mode_Auto = f.Sky_DHCP_Mode_Auto, Sky_DHCP_Mode_Proxy = f.Sky_DHCP_Mode_Proxy, Sky_DHCP_Mode_Static = f.Sky_DHCP_Mode_Static, Sky_DHCP_Relay = f.Sky_DHCP_Relay, Tr_Encryption = f.Tr_Encryption, Tr_WpaPSK = f.Tr_WpaPSK, Txt_SSID = f.Txt_SSID, Txt_SSID_IOT = f.Txt_SSID_IOT, Txt_acsTime = f.Txt_acsTime, UMUMIMO_Enable = f.UMUMIMO_Enable, UMUOFDMA_Enable = f.UMUOFDMA_Enable, WMM_Enable = f.WMM_Enable, briTable = f.briTable, bridgeapply = f.bridgeapply, btn_add = f.btn_add, btn_del = f.btn_del, btn_edit = f.btn_edit, button_apply = f.button_apply, client_num = f.client_num, connMode = f.connMode, d8021 = f.d8021, defGW = f.defGW, default_route = f.default_route, default_routev6 = f.default_routev6, defaultroute = f.defaultroute, defaultroutev6 = f.defaultroutev6, delegatePrefix = f.delegatePrefix, delegatePrefixLen = f.delegatePrefixLen, dhcpEthEnd = f.dhcpEthEnd, dhcpEthStart = f.dhcpEthStart, dhcpLeasedTime = f.dhcpLeasedTime, dhcpMode = f.dhcpMode, dhcpSrvAddr = f.dhcpSrvAddr, dhcpSrvType = f.dhcpSrvType, dhcpSrvType1 = f.dhcpSrvType1, dhcpSrvType2 = f.dhcpSrvType2, dhcpSrvType3 = f.dhcpSrvType3, dhcpstaticContent = f.dhcpstaticContent, dhcpstaticTBody = f.dhcpstaticTBody, dialMode = f.dialMode, dialTable = f.dialTable, dns6Primary = f.dns6Primary, dns6Secondary = f.dns6Secondary, dnsPrimary = f.dnsPrimary, dnsSecondary = f.dnsSecondary, dnsmode = f.dnsmode, dnsmode1 = f.dnsmode1, dnsmode2 = f.dnsmode2, dnsmode3 = f.dnsmode3, dnsv4Satic = f.dnsv4Satic, dnsv6Table = f.dnsv6Table, dnsv6disable = f.dnsv6disable, dnsv6enable = f.dnsv6enable, dnsv6mode = f.dnsv6mode, dsLiteServer = f.dsLiteServer, dsliteManualTable = f.dsliteManualTable, dsliteMode = f.dsliteMode, dsliteModeAuto = f.dsliteModeAuto, dsliteModeManual = f.dsliteModeManual, dsliteTable = f.dsliteTable, enable = f.enable, enbl6RD = f.enbl6RD, enblDSLite = f.enblDSLite, enblIANA = f.enblIANA, enblPD = f.enblPD, ethIpAddress = f.ethIpAddress, ethSubnetMask = f.ethSubnetMask, firstDns = f.firstDns, fullConeNat = f.fullConeNat, fullapply = f.fullapply, idleTime = f.idleTime, ipAddr = f.ipAddr, ipAddrTable = f.ipAddrTable, ipproto = f.ipproto, ipprotodhcp = f.ipprotodhcp, ipprotopppoe = f.ipprotopppoe, ipprotostatic = f.ipprotostatic, ipv6RDEnableTable = f.ipv6RDEnableTable, ipv6RDMode = f.ipv6RDMode, ipv6RDModeAuto = f.ipv6RDModeAuto, ipv6RDModeManual = f.ipv6RDModeManual, ipv6RDModeTable = f.ipv6RDModeTable, ipv6Table = f.ipv6Table, ipv6rdBrAddr = f.ipv6rdBrAddr, ipv6rdIpv4MaskLen = f.ipv6rdIpv4MaskLen, ipv6rdManualTable = f.ipv6rdManualTable, ipv6rdPrefix = f.ipv6rdPrefix, ipv6rdPrefixLen = f.ipv6rdPrefixLen, ipv6rdTable = f.ipv6rdTable, ipversionmode = f.ipversionmode, lan_port_list = f.lan_port_list, lancfg_StaticipAdd = f.lancfg_StaticipAdd, lancfg_StaticipDel = f.lancfg_StaticipDel, lancfg_dhcpserver = f.lancfg_dhcpserver, maximum_client = f.maximum_client, mtu = f.mtu, multiVID = f.multiVID, nat = f.nat, natEnble = f.natEnble, nattable = f.nattable, netMask = f.netMask, noipv6apply = f.noipv6apply, pdEnable = f.pdEnable, portbindtable = f.portbindtable, pppStaticEndAddress = f.pppStaticEndAddress, pppStaticIPAddress = f.pppStaticIPAddress, pppStaticIPEnableTable = f.pppStaticIPEnableTable, pppStaticIPTable = f.pppStaticIPTable, pppStaticStartAddress = f.pppStaticStartAddress, pppStaticSubnetMask = f.pppStaticSubnetMask, pppoeMode = f.pppoeMode, radio_hide = f.radio_hide, relayInfo = f.relayInfo, rouTable = f.rouTable, secondDns = f.secondDns, selectAll = f.selectAll, seletall = f.seletall, serviceMode = f.serviceMode, span_mtu = f.span_mtu, static6Table = f.static6Table, staticIpAll_Sel = f.staticIpAll_Sel, staticIp_Tbl = f.staticIp_Tbl, staticMode = f.staticMode, uPsd = f.uPsd, userName = f.userName, vlanID = f.vlanID, vlanMode = f.vlanMode, vlanvfg = f.vlanvfg, wanAddress6 = f.wanAddress6, wanAddress6prefix = f.wanAddress6prefix, wanGateway6 = f.wanGateway6, wanform = f.wanform, wanindex = f.wanindex, wantittleinfo = f.wantittleinfo;
if(true)
{serverlist=parseInt(serviceMode.value)
servModeMask=getServModeMask(serverlist);if(connMode.value!="bridge")
{if((servModeMask&(1<<tr069ServiceBit))&&(checkSameWanServiceExist(tr069ServiceBit)==true))
{warninfo_show(_("wancfg_TR69ExistedError"));serviceMode.focus();return 0;}}
if((servModeMask&(1<<voipServiceBit))&&(checkSameWanServiceExist(voipServiceBit)==true))
{warninfo_show(_("wancfg_VOIPExistedError"));serviceMode.focus();return 0;}
if((servModeMask&(1<<otherServiceBit))&&(checkSameWanServiceExist(otherServiceBit)==true))
{warninfo_show(_("wancfg_IPTVExistedError"));serviceMode.focus();return 0;}
apply_data.servicelist=serverlist;}
return 1;}
function checkAlreadyExistBridgeNotBoundPort()
{var i=0;for(i=0;i<WanConnJson.length;i++)
{if(selindex!=WanConnJson[i].index)
{if(3==WanConnJson[i].connType&&0==WanConnJson[i].bindPort)
{return true;}}}
return false;}
function saveBindPort()
{var i;var num=0;var bindportlist="";var f = document.forms[0];
var Box_TxPower = f.Box_TxPower, Chk_HideEnable = f.Chk_HideEnable, Chk_RadioEnable = f.Chk_RadioEnable, Chk_SsidEnable = f.Chk_SsidEnable, Control_Enable = f.Control_Enable, DMUMIMO_Enable = f.DMUMIMO_Enable, DMUOFDMA_Enable = f.DMUOFDMA_Enable, DSLiteEnable = f.DSLiteEnable, DSLiteEnableTable = f.DSLiteEnableTable, DSLiteModeTable = f.DSLiteModeTable, Defaultroute = f.Defaultroute, Defaultroutev6 = f.Defaultroutev6, Enable = f.Enable, EnableStaticIp = f.EnableStaticIp, IANATable = f.IANATable, IOT = f.IOT, IOTBS = f.IOTBS, IOTBSDisable = f.IOTBSDisable, IOTBSDisable_label = f.IOTBSDisable_label, IOTBSEnable = f.IOTBSEnable, IOTBSEnable_label = f.IOTBSEnable_label, IOTBSTable = f.IOTBSTable, IOTDisable = f.IOTDisable, IOTDisable_label = f.IOTDisable_label, IOTEnable = f.IOTEnable, IOTEnable_label = f.IOTEnable_label, IOTTable = f.IOTTable, IOT_PSK = f.IOT_PSK, IpVersion = f.IpVersion, Networkconfigid = f.Networkconfigid, OnDemandTable = f.OnDemandTable, PDTable = f.PDTable, PDTableStatic = f.PDTableStatic, Pwd_WpaPsk = f.Pwd_WpaPsk, Pwd_WpaPsk_IOT = f.Pwd_WpaPsk_IOT, Sel_AuthMode = f.Sel_AuthMode, Sel_BandWidth = f.Sel_BandWidth, Sel_Channel = f.Sel_Channel, Sel_Encryption = f.Sel_Encryption, Sel_PhyMode = f.Sel_PhyMode, Sel_TxPower = f.Sel_TxPower, Sel_guardInterval = f.Sel_guardInterval, Sky_Apply = f.Sky_Apply, Sky_Cancel = f.Sky_Cancel, Sky_DHCP_Disable = f.Sky_DHCP_Disable, Sky_DHCP_Enable = f.Sky_DHCP_Enable, Sky_DHCP_Mode_Auto = f.Sky_DHCP_Mode_Auto, Sky_DHCP_Mode_Proxy = f.Sky_DHCP_Mode_Proxy, Sky_DHCP_Mode_Static = f.Sky_DHCP_Mode_Static, Sky_DHCP_Relay = f.Sky_DHCP_Relay, Tr_Encryption = f.Tr_Encryption, Tr_WpaPSK = f.Tr_WpaPSK, Txt_SSID = f.Txt_SSID, Txt_SSID_IOT = f.Txt_SSID_IOT, Txt_acsTime = f.Txt_acsTime, UMUMIMO_Enable = f.UMUMIMO_Enable, UMUOFDMA_Enable = f.UMUOFDMA_Enable, WMM_Enable = f.WMM_Enable, briTable = f.briTable, bridgeapply = f.bridgeapply, btn_add = f.btn_add, btn_del = f.btn_del, btn_edit = f.btn_edit, button_apply = f.button_apply, client_num = f.client_num, connMode = f.connMode, d8021 = f.d8021, defGW = f.defGW, default_route = f.default_route, default_routev6 = f.default_routev6, defaultroute = f.defaultroute, defaultroutev6 = f.defaultroutev6, delegatePrefix = f.delegatePrefix, delegatePrefixLen = f.delegatePrefixLen, dhcpEthEnd = f.dhcpEthEnd, dhcpEthStart = f.dhcpEthStart, dhcpLeasedTime = f.dhcpLeasedTime, dhcpMode = f.dhcpMode, dhcpSrvAddr = f.dhcpSrvAddr, dhcpSrvType = f.dhcpSrvType, dhcpSrvType1 = f.dhcpSrvType1, dhcpSrvType2 = f.dhcpSrvType2, dhcpSrvType3 = f.dhcpSrvType3, dhcpstaticContent = f.dhcpstaticContent, dhcpstaticTBody = f.dhcpstaticTBody, dialMode = f.dialMode, dialTable = f.dialTable, dns6Primary = f.dns6Primary, dns6Secondary = f.dns6Secondary, dnsPrimary = f.dnsPrimary, dnsSecondary = f.dnsSecondary, dnsmode = f.dnsmode, dnsmode1 = f.dnsmode1, dnsmode2 = f.dnsmode2, dnsmode3 = f.dnsmode3, dnsv4Satic = f.dnsv4Satic, dnsv6Table = f.dnsv6Table, dnsv6disable = f.dnsv6disable, dnsv6enable = f.dnsv6enable, dnsv6mode = f.dnsv6mode, dsLiteServer = f.dsLiteServer, dsliteManualTable = f.dsliteManualTable, dsliteMode = f.dsliteMode, dsliteModeAuto = f.dsliteModeAuto, dsliteModeManual = f.dsliteModeManual, dsliteTable = f.dsliteTable, enable = f.enable, enbl6RD = f.enbl6RD, enblDSLite = f.enblDSLite, enblIANA = f.enblIANA, enblPD = f.enblPD, ethIpAddress = f.ethIpAddress, ethSubnetMask = f.ethSubnetMask, firstDns = f.firstDns, fullConeNat = f.fullConeNat, fullapply = f.fullapply, idleTime = f.idleTime, ipAddr = f.ipAddr, ipAddrTable = f.ipAddrTable, ipproto = f.ipproto, ipprotodhcp = f.ipprotodhcp, ipprotopppoe = f.ipprotopppoe, ipprotostatic = f.ipprotostatic, ipv6RDEnableTable = f.ipv6RDEnableTable, ipv6RDMode = f.ipv6RDMode, ipv6RDModeAuto = f.ipv6RDModeAuto, ipv6RDModeManual = f.ipv6RDModeManual, ipv6RDModeTable = f.ipv6RDModeTable, ipv6Table = f.ipv6Table, ipv6rdBrAddr = f.ipv6rdBrAddr, ipv6rdIpv4MaskLen = f.ipv6rdIpv4MaskLen, ipv6rdManualTable = f.ipv6rdManualTable, ipv6rdPrefix = f.ipv6rdPrefix, ipv6rdPrefixLen = f.ipv6rdPrefixLen, ipv6rdTable = f.ipv6rdTable, ipversionmode = f.ipversionmode, lan_port_list = f.lan_port_list, lancfg_StaticipAdd = f.lancfg_StaticipAdd, lancfg_StaticipDel = f.lancfg_StaticipDel, lancfg_dhcpserver = f.lancfg_dhcpserver, maximum_client = f.maximum_client, mtu = f.mtu, multiVID = f.multiVID, nat = f.nat, natEnble = f.natEnble, nattable = f.nattable, netMask = f.netMask, noipv6apply = f.noipv6apply, pdEnable = f.pdEnable, portbindtable = f.portbindtable, pppStaticEndAddress = f.pppStaticEndAddress, pppStaticIPAddress = f.pppStaticIPAddress, pppStaticIPEnableTable = f.pppStaticIPEnableTable, pppStaticIPTable = f.pppStaticIPTable, pppStaticStartAddress = f.pppStaticStartAddress, pppStaticSubnetMask = f.pppStaticSubnetMask, pppoeMode = f.pppoeMode, radio_hide = f.radio_hide, relayInfo = f.relayInfo, rouTable = f.rouTable, secondDns = f.secondDns, selectAll = f.selectAll, seletall = f.seletall, serviceMode = f.serviceMode, span_mtu = f.span_mtu, static6Table = f.static6Table, staticIpAll_Sel = f.staticIpAll_Sel, staticIp_Tbl = f.staticIp_Tbl, staticMode = f.staticMode, uPsd = f.uPsd, userName = f.userName, vlanID = f.vlanID, vlanMode = f.vlanMode, vlanvfg = f.vlanvfg, wanAddress6 = f.wanAddress6, wanAddress6prefix = f.wanAddress6prefix, wanGateway6 = f.wanGateway6, wanform = f.wanform, wanindex = f.wanindex, wantittleinfo = f.wantittleinfo;
if(true)
{for(i=0;i<allportlistarry.length;i++)
{var lanPort=document.getElementById("LanPort"+i);if(lanPort.checked==true)
{bindportlist+=lanPort.value;bindportlist+=","
num++;}}
if(connMode.value=="bridge"&&(2!=parseInt(serviceMode.value))&&num==allportlistarry.length)
{warninfo_show(_("wancfg_otherBridgeError"));return 0;}
apply_data.portbind=bindportlist;}
return 1;}
function saveNat()
{var enblNat=1;var f = document.forms[0];
var Box_TxPower = f.Box_TxPower, Chk_HideEnable = f.Chk_HideEnable, Chk_RadioEnable = f.Chk_RadioEnable, Chk_SsidEnable = f.Chk_SsidEnable, Control_Enable = f.Control_Enable, DMUMIMO_Enable = f.DMUMIMO_Enable, DMUOFDMA_Enable = f.DMUOFDMA_Enable, DSLiteEnable = f.DSLiteEnable, DSLiteEnableTable = f.DSLiteEnableTable, DSLiteModeTable = f.DSLiteModeTable, Defaultroute = f.Defaultroute, Defaultroutev6 = f.Defaultroutev6, Enable = f.Enable, EnableStaticIp = f.EnableStaticIp, IANATable = f.IANATable, IOT = f.IOT, IOTBS = f.IOTBS, IOTBSDisable = f.IOTBSDisable, IOTBSDisable_label = f.IOTBSDisable_label, IOTBSEnable = f.IOTBSEnable, IOTBSEnable_label = f.IOTBSEnable_label, IOTBSTable = f.IOTBSTable, IOTDisable = f.IOTDisable, IOTDisable_label = f.IOTDisable_label, IOTEnable = f.IOTEnable, IOTEnable_label = f.IOTEnable_label, IOTTable = f.IOTTable, IOT_PSK = f.IOT_PSK, IpVersion = f.IpVersion, Networkconfigid = f.Networkconfigid, OnDemandTable = f.OnDemandTable, PDTable = f.PDTable, PDTableStatic = f.PDTableStatic, Pwd_WpaPsk = f.Pwd_WpaPsk, Pwd_WpaPsk_IOT = f.Pwd_WpaPsk_IOT, Sel_AuthMode = f.Sel_AuthMode, Sel_BandWidth = f.Sel_BandWidth, Sel_Channel = f.Sel_Channel, Sel_Encryption = f.Sel_Encryption, Sel_PhyMode = f.Sel_PhyMode, Sel_TxPower = f.Sel_TxPower, Sel_guardInterval = f.Sel_guardInterval, Sky_Apply = f.Sky_Apply, Sky_Cancel = f.Sky_Cancel, Sky_DHCP_Disable = f.Sky_DHCP_Disable, Sky_DHCP_Enable = f.Sky_DHCP_Enable, Sky_DHCP_Mode_Auto = f.Sky_DHCP_Mode_Auto, Sky_DHCP_Mode_Proxy = f.Sky_DHCP_Mode_Proxy, Sky_DHCP_Mode_Static = f.Sky_DHCP_Mode_Static, Sky_DHCP_Relay = f.Sky_DHCP_Relay, Tr_Encryption = f.Tr_Encryption, Tr_WpaPSK = f.Tr_WpaPSK, Txt_SSID = f.Txt_SSID, Txt_SSID_IOT = f.Txt_SSID_IOT, Txt_acsTime = f.Txt_acsTime, UMUMIMO_Enable = f.UMUMIMO_Enable, UMUOFDMA_Enable = f.UMUOFDMA_Enable, WMM_Enable = f.WMM_Enable, briTable = f.briTable, bridgeapply = f.bridgeapply, btn_add = f.btn_add, btn_del = f.btn_del, btn_edit = f.btn_edit, button_apply = f.button_apply, client_num = f.client_num, connMode = f.connMode, d8021 = f.d8021, defGW = f.defGW, default_route = f.default_route, default_routev6 = f.default_routev6, defaultroute = f.defaultroute, defaultroutev6 = f.defaultroutev6, delegatePrefix = f.delegatePrefix, delegatePrefixLen = f.delegatePrefixLen, dhcpEthEnd = f.dhcpEthEnd, dhcpEthStart = f.dhcpEthStart, dhcpLeasedTime = f.dhcpLeasedTime, dhcpMode = f.dhcpMode, dhcpSrvAddr = f.dhcpSrvAddr, dhcpSrvType = f.dhcpSrvType, dhcpSrvType1 = f.dhcpSrvType1, dhcpSrvType2 = f.dhcpSrvType2, dhcpSrvType3 = f.dhcpSrvType3, dhcpstaticContent = f.dhcpstaticContent, dhcpstaticTBody = f.dhcpstaticTBody, dialMode = f.dialMode, dialTable = f.dialTable, dns6Primary = f.dns6Primary, dns6Secondary = f.dns6Secondary, dnsPrimary = f.dnsPrimary, dnsSecondary = f.dnsSecondary, dnsmode = f.dnsmode, dnsmode1 = f.dnsmode1, dnsmode2 = f.dnsmode2, dnsmode3 = f.dnsmode3, dnsv4Satic = f.dnsv4Satic, dnsv6Table = f.dnsv6Table, dnsv6disable = f.dnsv6disable, dnsv6enable = f.dnsv6enable, dnsv6mode = f.dnsv6mode, dsLiteServer = f.dsLiteServer, dsliteManualTable = f.dsliteManualTable, dsliteMode = f.dsliteMode, dsliteModeAuto = f.dsliteModeAuto, dsliteModeManual = f.dsliteModeManual, dsliteTable = f.dsliteTable, enable = f.enable, enbl6RD = f.enbl6RD, enblDSLite = f.enblDSLite, enblIANA = f.enblIANA, enblPD = f.enblPD, ethIpAddress = f.ethIpAddress, ethSubnetMask = f.ethSubnetMask, firstDns = f.firstDns, fullConeNat = f.fullConeNat, fullapply = f.fullapply, idleTime = f.idleTime, ipAddr = f.ipAddr, ipAddrTable = f.ipAddrTable, ipproto = f.ipproto, ipprotodhcp = f.ipprotodhcp, ipprotopppoe = f.ipprotopppoe, ipprotostatic = f.ipprotostatic, ipv6RDEnableTable = f.ipv6RDEnableTable, ipv6RDMode = f.ipv6RDMode, ipv6RDModeAuto = f.ipv6RDModeAuto, ipv6RDModeManual = f.ipv6RDModeManual, ipv6RDModeTable = f.ipv6RDModeTable, ipv6Table = f.ipv6Table, ipv6rdBrAddr = f.ipv6rdBrAddr, ipv6rdIpv4MaskLen = f.ipv6rdIpv4MaskLen, ipv6rdManualTable = f.ipv6rdManualTable, ipv6rdPrefix = f.ipv6rdPrefix, ipv6rdPrefixLen = f.ipv6rdPrefixLen, ipv6rdTable = f.ipv6rdTable, ipversionmode = f.ipversionmode, lan_port_list = f.lan_port_list, lancfg_StaticipAdd = f.lancfg_StaticipAdd, lancfg_StaticipDel = f.lancfg_StaticipDel, lancfg_dhcpserver = f.lancfg_dhcpserver, maximum_client = f.maximum_client, mtu = f.mtu, multiVID = f.multiVID, nat = f.nat, natEnble = f.natEnble, nattable = f.nattable, netMask = f.netMask, noipv6apply = f.noipv6apply, pdEnable = f.pdEnable, portbindtable = f.portbindtable, pppStaticEndAddress = f.pppStaticEndAddress, pppStaticIPAddress = f.pppStaticIPAddress, pppStaticIPEnableTable = f.pppStaticIPEnableTable, pppStaticIPTable = f.pppStaticIPTable, pppStaticStartAddress = f.pppStaticStartAddress, pppStaticSubnetMask = f.pppStaticSubnetMask, pppoeMode = f.pppoeMode, radio_hide = f.radio_hide, relayInfo = f.relayInfo, rouTable = f.rouTable, secondDns = f.secondDns, selectAll = f.selectAll, seletall = f.seletall, serviceMode = f.serviceMode, span_mtu = f.span_mtu, static6Table = f.static6Table, staticIpAll_Sel = f.staticIpAll_Sel, staticIp_Tbl = f.staticIp_Tbl, staticMode = f.staticMode, uPsd = f.uPsd, userName = f.userName, vlanID = f.vlanID, vlanMode = f.vlanMode, vlanvfg = f.vlanvfg, wanAddress6 = f.wanAddress6, wanAddress6prefix = f.wanAddress6prefix, wanGateway6 = f.wanGateway6, wanform = f.wanform, wanindex = f.wanindex, wantittleinfo = f.wantittleinfo;
if(true)
{if(nat.checked==true)
{enblNat=1;}
else
{if(IpVersion.value==1)
{enblNat=1;}
else
{enblNat=0;}}
apply_data.natenable=enblNat;}
return 1;}
function checkAllVlanParam(vlanId)
{var i=0;var vlanValue;for(i=0;i<WanConnJson.length;i++)
{if(selindex!=WanConnJson[i].index)
{vlanValue=WanConnJson[i].vlanid;if(vlanId==vlanValue)
{return false;}}}
return true;}
function saveVlan()
{var enVlanMux;var vlanMuxPr;var vlanMuxId;var vlanMuxMId;var f = document.forms[0];
var Box_TxPower = f.Box_TxPower, Chk_HideEnable = f.Chk_HideEnable, Chk_RadioEnable = f.Chk_RadioEnable, Chk_SsidEnable = f.Chk_SsidEnable, Control_Enable = f.Control_Enable, DMUMIMO_Enable = f.DMUMIMO_Enable, DMUOFDMA_Enable = f.DMUOFDMA_Enable, DSLiteEnable = f.DSLiteEnable, DSLiteEnableTable = f.DSLiteEnableTable, DSLiteModeTable = f.DSLiteModeTable, Defaultroute = f.Defaultroute, Defaultroutev6 = f.Defaultroutev6, Enable = f.Enable, EnableStaticIp = f.EnableStaticIp, IANATable = f.IANATable, IOT = f.IOT, IOTBS = f.IOTBS, IOTBSDisable = f.IOTBSDisable, IOTBSDisable_label = f.IOTBSDisable_label, IOTBSEnable = f.IOTBSEnable, IOTBSEnable_label = f.IOTBSEnable_label, IOTBSTable = f.IOTBSTable, IOTDisable = f.IOTDisable, IOTDisable_label = f.IOTDisable_label, IOTEnable = f.IOTEnable, IOTEnable_label = f.IOTEnable_label, IOTTable = f.IOTTable, IOT_PSK = f.IOT_PSK, IpVersion = f.IpVersion, Networkconfigid = f.Networkconfigid, OnDemandTable = f.OnDemandTable, PDTable = f.PDTable, PDTableStatic = f.PDTableStatic, Pwd_WpaPsk = f.Pwd_WpaPsk, Pwd_WpaPsk_IOT = f.Pwd_WpaPsk_IOT, Sel_AuthMode = f.Sel_AuthMode, Sel_BandWidth = f.Sel_BandWidth, Sel_Channel = f.Sel_Channel, Sel_Encryption = f.Sel_Encryption, Sel_PhyMode = f.Sel_PhyMode, Sel_TxPower = f.Sel_TxPower, Sel_guardInterval = f.Sel_guardInterval, Sky_Apply = f.Sky_Apply, Sky_Cancel = f.Sky_Cancel, Sky_DHCP_Disable = f.Sky_DHCP_Disable, Sky_DHCP_Enable = f.Sky_DHCP_Enable, Sky_DHCP_Mode_Auto = f.Sky_DHCP_Mode_Auto, Sky_DHCP_Mode_Proxy = f.Sky_DHCP_Mode_Proxy, Sky_DHCP_Mode_Static = f.Sky_DHCP_Mode_Static, Sky_DHCP_Relay = f.Sky_DHCP_Relay, Tr_Encryption = f.Tr_Encryption, Tr_WpaPSK = f.Tr_WpaPSK, Txt_SSID = f.Txt_SSID, Txt_SSID_IOT = f.Txt_SSID_IOT, Txt_acsTime = f.Txt_acsTime, UMUMIMO_Enable = f.UMUMIMO_Enable, UMUOFDMA_Enable = f.UMUOFDMA_Enable, WMM_Enable = f.WMM_Enable, briTable = f.briTable, bridgeapply = f.bridgeapply, btn_add = f.btn_add, btn_del = f.btn_del, btn_edit = f.btn_edit, button_apply = f.button_apply, client_num = f.client_num, connMode = f.connMode, d8021 = f.d8021, defGW = f.defGW, default_route = f.default_route, default_routev6 = f.default_routev6, defaultroute = f.defaultroute, defaultroutev6 = f.defaultroutev6, delegatePrefix = f.delegatePrefix, delegatePrefixLen = f.delegatePrefixLen, dhcpEthEnd = f.dhcpEthEnd, dhcpEthStart = f.dhcpEthStart, dhcpLeasedTime = f.dhcpLeasedTime, dhcpMode = f.dhcpMode, dhcpSrvAddr = f.dhcpSrvAddr, dhcpSrvType = f.dhcpSrvType, dhcpSrvType1 = f.dhcpSrvType1, dhcpSrvType2 = f.dhcpSrvType2, dhcpSrvType3 = f.dhcpSrvType3, dhcpstaticContent = f.dhcpstaticContent, dhcpstaticTBody = f.dhcpstaticTBody, dialMode = f.dialMode, dialTable = f.dialTable, dns6Primary = f.dns6Primary, dns6Secondary = f.dns6Secondary, dnsPrimary = f.dnsPrimary, dnsSecondary = f.dnsSecondary, dnsmode = f.dnsmode, dnsmode1 = f.dnsmode1, dnsmode2 = f.dnsmode2, dnsmode3 = f.dnsmode3, dnsv4Satic = f.dnsv4Satic, dnsv6Table = f.dnsv6Table, dnsv6disable = f.dnsv6disable, dnsv6enable = f.dnsv6enable, dnsv6mode = f.dnsv6mode, dsLiteServer = f.dsLiteServer, dsliteManualTable = f.dsliteManualTable, dsliteMode = f.dsliteMode, dsliteModeAuto = f.dsliteModeAuto, dsliteModeManual = f.dsliteModeManual, dsliteTable = f.dsliteTable, enable = f.enable, enbl6RD = f.enbl6RD, enblDSLite = f.enblDSLite, enblIANA = f.enblIANA, enblPD = f.enblPD, ethIpAddress = f.ethIpAddress, ethSubnetMask = f.ethSubnetMask, firstDns = f.firstDns, fullConeNat = f.fullConeNat, fullapply = f.fullapply, idleTime = f.idleTime, ipAddr = f.ipAddr, ipAddrTable = f.ipAddrTable, ipproto = f.ipproto, ipprotodhcp = f.ipprotodhcp, ipprotopppoe = f.ipprotopppoe, ipprotostatic = f.ipprotostatic, ipv6RDEnableTable = f.ipv6RDEnableTable, ipv6RDMode = f.ipv6RDMode, ipv6RDModeAuto = f.ipv6RDModeAuto, ipv6RDModeManual = f.ipv6RDModeManual, ipv6RDModeTable = f.ipv6RDModeTable, ipv6Table = f.ipv6Table, ipv6rdBrAddr = f.ipv6rdBrAddr, ipv6rdIpv4MaskLen = f.ipv6rdIpv4MaskLen, ipv6rdManualTable = f.ipv6rdManualTable, ipv6rdPrefix = f.ipv6rdPrefix, ipv6rdPrefixLen = f.ipv6rdPrefixLen, ipv6rdTable = f.ipv6rdTable, ipversionmode = f.ipversionmode, lan_port_list = f.lan_port_list, lancfg_StaticipAdd = f.lancfg_StaticipAdd, lancfg_StaticipDel = f.lancfg_StaticipDel, lancfg_dhcpserver = f.lancfg_dhcpserver, maximum_client = f.maximum_client, mtu = f.mtu, multiVID = f.multiVID, nat = f.nat, natEnble = f.natEnble, nattable = f.nattable, netMask = f.netMask, noipv6apply = f.noipv6apply, pdEnable = f.pdEnable, portbindtable = f.portbindtable, pppStaticEndAddress = f.pppStaticEndAddress, pppStaticIPAddress = f.pppStaticIPAddress, pppStaticIPEnableTable = f.pppStaticIPEnableTable, pppStaticIPTable = f.pppStaticIPTable, pppStaticStartAddress = f.pppStaticStartAddress, pppStaticSubnetMask = f.pppStaticSubnetMask, pppoeMode = f.pppoeMode, radio_hide = f.radio_hide, relayInfo = f.relayInfo, rouTable = f.rouTable, secondDns = f.secondDns, selectAll = f.selectAll, seletall = f.seletall, serviceMode = f.serviceMode, span_mtu = f.span_mtu, static6Table = f.static6Table, staticIpAll_Sel = f.staticIpAll_Sel, staticIp_Tbl = f.staticIp_Tbl, staticMode = f.staticMode, uPsd = f.uPsd, userName = f.userName, vlanID = f.vlanID, vlanMode = f.vlanMode, vlanvfg = f.vlanvfg, wanAddress6 = f.wanAddress6, wanAddress6prefix = f.wanAddress6prefix, wanGateway6 = f.wanGateway6, wanform = f.wanform, wanindex = f.wanindex, wantittleinfo = f.wantittleinfo;
if(true)
{if(vlanMode.value==2)
{enVlanMux=1;}
else
{enVlanMux=0;vlanMuxId=0;vlanMuxPr=0;}
if(enVlanMux&&vlanID.value=="")
{warninfo_show(_("wancfg_VLANIDError1"));return 0;}
if(enVlanMux)
{vlanMuxId=parseInt(vlanID.value);vlanMuxMId=parseInt(multiVID.value);}
else
{vlanMuxId=0;vlanMuxPr=0;vlanMuxMId=0;}
if(d8021.value=="")
{vlanMuxPr=0;}
else
{vlanMuxPr=d8021.value;}
if(enVlanMux&&(vlanMuxId<1||vlanMuxId>4094||isNumber(vlanID.value)==false))
{warninfo_show("VLAN ID : "+vlanID.value+" "+_("wancfg_VLANIDError2"));return 0;}
if(enVlanMux&&(multiVID.value!="")&&(vlanMuxMId<1||vlanMuxMId>4094||isNumber(multiVID.value)==false))
{warninfo_show("MULTI VLAN ID : "+multiVID.value+" "+_("wancfg_VLANIDError2"));return 0;}
if(enVlanMux&&(!vlanMuxMId)){vlanMuxMId=0;}
apply_data.vlanmode=parseInt(vlanMode.value);apply_data.vlanid=parseInt(vlanMuxId);apply_data.multivid=parseInt(vlanMuxMId);apply_data.vlanpri=parseInt(vlanMuxPr);}
return 1;}
function checkIsSpecialIP(ipAddress)
{if(isMulticastAddr(ipAddress)||isreserveaddr(ipAddress)||isLoopbackAddr(ipAddress)||isBroadcastAddr(ipAddress))
{return true;}
if(brlanipaddr!=""&&brlansubnetmask!=""&&isSameSubNet(ipAddress,brlansubnetmask,brlanipaddr,brlansubnetmask))
{return true;}
return false;}
function saveStaticIpAddr()
{var wanIpAddress;var wanSubnetMask;var wanIntfGateway;var dnsPrimary;var dnsSecondary;if(apply_data.servicelist==4)
{return 1;}
var f = document.forms[0];
var Box_TxPower = f.Box_TxPower, Chk_HideEnable = f.Chk_HideEnable, Chk_RadioEnable = f.Chk_RadioEnable, Chk_SsidEnable = f.Chk_SsidEnable, Control_Enable = f.Control_Enable, DMUMIMO_Enable = f.DMUMIMO_Enable, DMUOFDMA_Enable = f.DMUOFDMA_Enable, DSLiteEnable = f.DSLiteEnable, DSLiteEnableTable = f.DSLiteEnableTable, DSLiteModeTable = f.DSLiteModeTable, Defaultroute = f.Defaultroute, Defaultroutev6 = f.Defaultroutev6, Enable = f.Enable, EnableStaticIp = f.EnableStaticIp, IANATable = f.IANATable, IOT = f.IOT, IOTBS = f.IOTBS, IOTBSDisable = f.IOTBSDisable, IOTBSDisable_label = f.IOTBSDisable_label, IOTBSEnable = f.IOTBSEnable, IOTBSEnable_label = f.IOTBSEnable_label, IOTBSTable = f.IOTBSTable, IOTDisable = f.IOTDisable, IOTDisable_label = f.IOTDisable_label, IOTEnable = f.IOTEnable, IOTEnable_label = f.IOTEnable_label, IOTTable = f.IOTTable, IOT_PSK = f.IOT_PSK, IpVersion = f.IpVersion, Networkconfigid = f.Networkconfigid, OnDemandTable = f.OnDemandTable, PDTable = f.PDTable, PDTableStatic = f.PDTableStatic, Pwd_WpaPsk = f.Pwd_WpaPsk, Pwd_WpaPsk_IOT = f.Pwd_WpaPsk_IOT, Sel_AuthMode = f.Sel_AuthMode, Sel_BandWidth = f.Sel_BandWidth, Sel_Channel = f.Sel_Channel, Sel_Encryption = f.Sel_Encryption, Sel_PhyMode = f.Sel_PhyMode, Sel_TxPower = f.Sel_TxPower, Sel_guardInterval = f.Sel_guardInterval, Sky_Apply = f.Sky_Apply, Sky_Cancel = f.Sky_Cancel, Sky_DHCP_Disable = f.Sky_DHCP_Disable, Sky_DHCP_Enable = f.Sky_DHCP_Enable, Sky_DHCP_Mode_Auto = f.Sky_DHCP_Mode_Auto, Sky_DHCP_Mode_Proxy = f.Sky_DHCP_Mode_Proxy, Sky_DHCP_Mode_Static = f.Sky_DHCP_Mode_Static, Sky_DHCP_Relay = f.Sky_DHCP_Relay, Tr_Encryption = f.Tr_Encryption, Tr_WpaPSK = f.Tr_WpaPSK, Txt_SSID = f.Txt_SSID, Txt_SSID_IOT = f.Txt_SSID_IOT, Txt_acsTime = f.Txt_acsTime, UMUMIMO_Enable = f.UMUMIMO_Enable, UMUOFDMA_Enable = f.UMUOFDMA_Enable, WMM_Enable = f.WMM_Enable, briTable = f.briTable, bridgeapply = f.bridgeapply, btn_add = f.btn_add, btn_del = f.btn_del, btn_edit = f.btn_edit, button_apply = f.button_apply, client_num = f.client_num, connMode = f.connMode, d8021 = f.d8021, defGW = f.defGW, default_route = f.default_route, default_routev6 = f.default_routev6, defaultroute = f.defaultroute, defaultroutev6 = f.defaultroutev6, delegatePrefix = f.delegatePrefix, delegatePrefixLen = f.delegatePrefixLen, dhcpEthEnd = f.dhcpEthEnd, dhcpEthStart = f.dhcpEthStart, dhcpLeasedTime = f.dhcpLeasedTime, dhcpMode = f.dhcpMode, dhcpSrvAddr = f.dhcpSrvAddr, dhcpSrvType = f.dhcpSrvType, dhcpSrvType1 = f.dhcpSrvType1, dhcpSrvType2 = f.dhcpSrvType2, dhcpSrvType3 = f.dhcpSrvType3, dhcpstaticContent = f.dhcpstaticContent, dhcpstaticTBody = f.dhcpstaticTBody, dialMode = f.dialMode, dialTable = f.dialTable, dns6Primary = f.dns6Primary, dns6Secondary = f.dns6Secondary, dnsPrimary = f.dnsPrimary, dnsSecondary = f.dnsSecondary, dnsmode = f.dnsmode, dnsmode1 = f.dnsmode1, dnsmode2 = f.dnsmode2, dnsmode3 = f.dnsmode3, dnsv4Satic = f.dnsv4Satic, dnsv6Table = f.dnsv6Table, dnsv6disable = f.dnsv6disable, dnsv6enable = f.dnsv6enable, dnsv6mode = f.dnsv6mode, dsLiteServer = f.dsLiteServer, dsliteManualTable = f.dsliteManualTable, dsliteMode = f.dsliteMode, dsliteModeAuto = f.dsliteModeAuto, dsliteModeManual = f.dsliteModeManual, dsliteTable = f.dsliteTable, enable = f.enable, enbl6RD = f.enbl6RD, enblDSLite = f.enblDSLite, enblIANA = f.enblIANA, enblPD = f.enblPD, ethIpAddress = f.ethIpAddress, ethSubnetMask = f.ethSubnetMask, firstDns = f.firstDns, fullConeNat = f.fullConeNat, fullapply = f.fullapply, idleTime = f.idleTime, ipAddr = f.ipAddr, ipAddrTable = f.ipAddrTable, ipproto = f.ipproto, ipprotodhcp = f.ipprotodhcp, ipprotopppoe = f.ipprotopppoe, ipprotostatic = f.ipprotostatic, ipv6RDEnableTable = f.ipv6RDEnableTable, ipv6RDMode = f.ipv6RDMode, ipv6RDModeAuto = f.ipv6RDModeAuto, ipv6RDModeManual = f.ipv6RDModeManual, ipv6RDModeTable = f.ipv6RDModeTable, ipv6Table = f.ipv6Table, ipv6rdBrAddr = f.ipv6rdBrAddr, ipv6rdIpv4MaskLen = f.ipv6rdIpv4MaskLen, ipv6rdManualTable = f.ipv6rdManualTable, ipv6rdPrefix = f.ipv6rdPrefix, ipv6rdPrefixLen = f.ipv6rdPrefixLen, ipv6rdTable = f.ipv6rdTable, ipversionmode = f.ipversionmode, lan_port_list = f.lan_port_list, lancfg_StaticipAdd = f.lancfg_StaticipAdd, lancfg_StaticipDel = f.lancfg_StaticipDel, lancfg_dhcpserver = f.lancfg_dhcpserver, maximum_client = f.maximum_client, mtu = f.mtu, multiVID = f.multiVID, nat = f.nat, natEnble = f.natEnble, nattable = f.nattable, netMask = f.netMask, noipv6apply = f.noipv6apply, pdEnable = f.pdEnable, portbindtable = f.portbindtable, pppStaticEndAddress = f.pppStaticEndAddress, pppStaticIPAddress = f.pppStaticIPAddress, pppStaticIPEnableTable = f.pppStaticIPEnableTable, pppStaticIPTable = f.pppStaticIPTable, pppStaticStartAddress = f.pppStaticStartAddress, pppStaticSubnetMask = f.pppStaticSubnetMask, pppoeMode = f.pppoeMode, radio_hide = f.radio_hide, relayInfo = f.relayInfo, rouTable = f.rouTable, secondDns = f.secondDns, selectAll = f.selectAll, seletall = f.seletall, serviceMode = f.serviceMode, span_mtu = f.span_mtu, static6Table = f.static6Table, staticIpAll_Sel = f.staticIpAll_Sel, staticIp_Tbl = f.staticIp_Tbl, staticMode = f.staticMode, uPsd = f.uPsd, userName = f.userName, vlanID = f.vlanID, vlanMode = f.vlanMode, vlanvfg = f.vlanvfg, wanAddress6 = f.wanAddress6, wanAddress6prefix = f.wanAddress6prefix, wanGateway6 = f.wanGateway6, wanform = f.wanform, wanindex = f.wanindex, wantittleinfo = f.wantittleinfo;
if(true)
{if(IpVersion.value==1||connMode.value!="route"||$('input:radio[name="ipproto"]:checked').val()!="static")
{return 1;}
wanIpAddress=ipAddr.value;wanSubnetMask=netMask.value;wanIntfGateway=defGW.value;dnsPrimary=firstDns.value;dnsSecondary=secondDns.value;if(isValidIpAddress(wanIpAddress)==false||checkIsSpecialIP(wanIpAddress)==true)
{warninfo_show(_("wancfg_IPAddr")+" "+wanIpAddress+" "+_("wancfg_Invalid")+"!");return 0;}
if(isValidSubnetMask(wanSubnetMask)==false||checkIsSpecialIP(wanSubnetMask)==true)
{warninfo_show(_("wancfg_SubnetMask")+" "+wanSubnetMask+" "+_("wancfg_Invalid")+"!");return 0;}
if(isNetworkaddr(wanIpAddress,wanSubnetMask))
{warninfo_show(_("wancfg_IPAddr")+" "+wanIpAddress+" "+_("wancfg_Invalid")+"!");return 0;}
if(isValidIpAddress(wanIntfGateway)==false||checkIsSpecialIP(wanIntfGateway)==true)
{warninfo_show(_("wancfg_IPGateway")+" "+wanIntfGateway+" "+_("wancfg_Invalid")+"!");return 0;}
if(isNetworkaddr(wanIntfGateway,wanSubnetMask))
{warninfo_show(_("wancfg_IPGateway")+" "+wanIntfGateway+" "+_("wancfg_Invalid")+"!");return 0;}
if(isValidIpAddress(dnsPrimary)==false||checkIsSpecialIP(dnsPrimary)==true)
{warninfo_show(_("wancfg_PriDNS")+" "+dnsPrimary+" "+_("wancfg_Invalid")+"!");return 0;}
if(isNetworkaddr(dnsPrimary,wanSubnetMask))
{warninfo_show(_("wancfg_PriDNS")+" "+dnsPrimary+" "+_("wancfg_Invalid")+"!");return 0;}
if(dnsSecondary!=""&&(isValidIpAddress(dnsSecondary)==false||checkIsSpecialIP(dnsSecondary)==true))
{warninfo_show(_("wancfg_SecDNS")+" "+dnsSecondary+" "+_("wancfg_Invalid")+"!");return 0;}
if(dnsSecondary!=""&&isNetworkaddr(dnsSecondary,wanSubnetMask))
{warninfo_show(_("wancfg_SecDNS")+" "+dnsSecondary+" "+_("wancfg_Invalid")+"!");return 0;}
if(!isSameSubNet(wanIpAddress,wanSubnetMask,wanIntfGateway,wanSubnetMask))
{warninfo_show(_("wancfg_staticIPNotSameSubError"));return 0;}
apply_data.ipaddr=wanIpAddress;apply_data.subnetmask=wanSubnetMask;apply_data.gateway=wanIntfGateway;apply_data.dns1=dnsPrimary;if(dnsSecondary!="")
{apply_data.dns2=dnsSecondary;}}
return 1;}
function saveStaticIpv6Addr()
{var f = document.forms[0];
var Box_TxPower = f.Box_TxPower, Chk_HideEnable = f.Chk_HideEnable, Chk_RadioEnable = f.Chk_RadioEnable, Chk_SsidEnable = f.Chk_SsidEnable, Control_Enable = f.Control_Enable, DMUMIMO_Enable = f.DMUMIMO_Enable, DMUOFDMA_Enable = f.DMUOFDMA_Enable, DSLiteEnable = f.DSLiteEnable, DSLiteEnableTable = f.DSLiteEnableTable, DSLiteModeTable = f.DSLiteModeTable, Defaultroute = f.Defaultroute, Defaultroutev6 = f.Defaultroutev6, Enable = f.Enable, EnableStaticIp = f.EnableStaticIp, IANATable = f.IANATable, IOT = f.IOT, IOTBS = f.IOTBS, IOTBSDisable = f.IOTBSDisable, IOTBSDisable_label = f.IOTBSDisable_label, IOTBSEnable = f.IOTBSEnable, IOTBSEnable_label = f.IOTBSEnable_label, IOTBSTable = f.IOTBSTable, IOTDisable = f.IOTDisable, IOTDisable_label = f.IOTDisable_label, IOTEnable = f.IOTEnable, IOTEnable_label = f.IOTEnable_label, IOTTable = f.IOTTable, IOT_PSK = f.IOT_PSK, IpVersion = f.IpVersion, Networkconfigid = f.Networkconfigid, OnDemandTable = f.OnDemandTable, PDTable = f.PDTable, PDTableStatic = f.PDTableStatic, Pwd_WpaPsk = f.Pwd_WpaPsk, Pwd_WpaPsk_IOT = f.Pwd_WpaPsk_IOT, Sel_AuthMode = f.Sel_AuthMode, Sel_BandWidth = f.Sel_BandWidth, Sel_Channel = f.Sel_Channel, Sel_Encryption = f.Sel_Encryption, Sel_PhyMode = f.Sel_PhyMode, Sel_TxPower = f.Sel_TxPower, Sel_guardInterval = f.Sel_guardInterval, Sky_Apply = f.Sky_Apply, Sky_Cancel = f.Sky_Cancel, Sky_DHCP_Disable = f.Sky_DHCP_Disable, Sky_DHCP_Enable = f.Sky_DHCP_Enable, Sky_DHCP_Mode_Auto = f.Sky_DHCP_Mode_Auto, Sky_DHCP_Mode_Proxy = f.Sky_DHCP_Mode_Proxy, Sky_DHCP_Mode_Static = f.Sky_DHCP_Mode_Static, Sky_DHCP_Relay = f.Sky_DHCP_Relay, Tr_Encryption = f.Tr_Encryption, Tr_WpaPSK = f.Tr_WpaPSK, Txt_SSID = f.Txt_SSID, Txt_SSID_IOT = f.Txt_SSID_IOT, Txt_acsTime = f.Txt_acsTime, UMUMIMO_Enable = f.UMUMIMO_Enable, UMUOFDMA_Enable = f.UMUOFDMA_Enable, WMM_Enable = f.WMM_Enable, briTable = f.briTable, bridgeapply = f.bridgeapply, btn_add = f.btn_add, btn_del = f.btn_del, btn_edit = f.btn_edit, button_apply = f.button_apply, client_num = f.client_num, connMode = f.connMode, d8021 = f.d8021, defGW = f.defGW, default_route = f.default_route, default_routev6 = f.default_routev6, defaultroute = f.defaultroute, defaultroutev6 = f.defaultroutev6, delegatePrefix = f.delegatePrefix, delegatePrefixLen = f.delegatePrefixLen, dhcpEthEnd = f.dhcpEthEnd, dhcpEthStart = f.dhcpEthStart, dhcpLeasedTime = f.dhcpLeasedTime, dhcpMode = f.dhcpMode, dhcpSrvAddr = f.dhcpSrvAddr, dhcpSrvType = f.dhcpSrvType, dhcpSrvType1 = f.dhcpSrvType1, dhcpSrvType2 = f.dhcpSrvType2, dhcpSrvType3 = f.dhcpSrvType3, dhcpstaticContent = f.dhcpstaticContent, dhcpstaticTBody = f.dhcpstaticTBody, dialMode = f.dialMode, dialTable = f.dialTable, dns6Primary = f.dns6Primary, dns6Secondary = f.dns6Secondary, dnsPrimary = f.dnsPrimary, dnsSecondary = f.dnsSecondary, dnsmode = f.dnsmode, dnsmode1 = f.dnsmode1, dnsmode2 = f.dnsmode2, dnsmode3 = f.dnsmode3, dnsv4Satic = f.dnsv4Satic, dnsv6Table = f.dnsv6Table, dnsv6disable = f.dnsv6disable, dnsv6enable = f.dnsv6enable, dnsv6mode = f.dnsv6mode, dsLiteServer = f.dsLiteServer, dsliteManualTable = f.dsliteManualTable, dsliteMode = f.dsliteMode, dsliteModeAuto = f.dsliteModeAuto, dsliteModeManual = f.dsliteModeManual, dsliteTable = f.dsliteTable, enable = f.enable, enbl6RD = f.enbl6RD, enblDSLite = f.enblDSLite, enblIANA = f.enblIANA, enblPD = f.enblPD, ethIpAddress = f.ethIpAddress, ethSubnetMask = f.ethSubnetMask, firstDns = f.firstDns, fullConeNat = f.fullConeNat, fullapply = f.fullapply, idleTime = f.idleTime, ipAddr = f.ipAddr, ipAddrTable = f.ipAddrTable, ipproto = f.ipproto, ipprotodhcp = f.ipprotodhcp, ipprotopppoe = f.ipprotopppoe, ipprotostatic = f.ipprotostatic, ipv6RDEnableTable = f.ipv6RDEnableTable, ipv6RDMode = f.ipv6RDMode, ipv6RDModeAuto = f.ipv6RDModeAuto, ipv6RDModeManual = f.ipv6RDModeManual, ipv6RDModeTable = f.ipv6RDModeTable, ipv6Table = f.ipv6Table, ipv6rdBrAddr = f.ipv6rdBrAddr, ipv6rdIpv4MaskLen = f.ipv6rdIpv4MaskLen, ipv6rdManualTable = f.ipv6rdManualTable, ipv6rdPrefix = f.ipv6rdPrefix, ipv6rdPrefixLen = f.ipv6rdPrefixLen, ipv6rdTable = f.ipv6rdTable, ipversionmode = f.ipversionmode, lan_port_list = f.lan_port_list, lancfg_StaticipAdd = f.lancfg_StaticipAdd, lancfg_StaticipDel = f.lancfg_StaticipDel, lancfg_dhcpserver = f.lancfg_dhcpserver, maximum_client = f.maximum_client, mtu = f.mtu, multiVID = f.multiVID, nat = f.nat, natEnble = f.natEnble, nattable = f.nattable, netMask = f.netMask, noipv6apply = f.noipv6apply, pdEnable = f.pdEnable, portbindtable = f.portbindtable, pppStaticEndAddress = f.pppStaticEndAddress, pppStaticIPAddress = f.pppStaticIPAddress, pppStaticIPEnableTable = f.pppStaticIPEnableTable, pppStaticIPTable = f.pppStaticIPTable, pppStaticStartAddress = f.pppStaticStartAddress, pppStaticSubnetMask = f.pppStaticSubnetMask, pppoeMode = f.pppoeMode, radio_hide = f.radio_hide, relayInfo = f.relayInfo, rouTable = f.rouTable, secondDns = f.secondDns, selectAll = f.selectAll, seletall = f.seletall, serviceMode = f.serviceMode, span_mtu = f.span_mtu, static6Table = f.static6Table, staticIpAll_Sel = f.staticIpAll_Sel, staticIp_Tbl = f.staticIp_Tbl, staticMode = f.staticMode, uPsd = f.uPsd, userName = f.userName, vlanID = f.vlanID, vlanMode = f.vlanMode, vlanvfg = f.vlanvfg, wanAddress6 = f.wanAddress6, wanAddress6prefix = f.wanAddress6prefix, wanGateway6 = f.wanGateway6, wanform = f.wanform, wanindex = f.wanindex, wantittleinfo = f.wantittleinfo;
if(true)
{if(IpVersion.value==0||$('input:radio[name="ipproto"]:checked').val()!="static"||connMode.value!="route")
{return 1;}
var ipv6Addr;var ipv6prefix=wanAddress6prefix.value;if(wanAddress6prefix.value=='')
ipv6prefix=64;ipv6Addr=wanAddress6.value+"/"+ipv6prefix;if(wanAddress6.value==''||isValidIpv6Address(ipv6Addr)==false){warninfo_show(_("wancfg_WanAddress6Error2"));return 0;}
if(wanGateway6.value==''||sk_isValidIpAddress6(wanGateway6.value)==false){warninfo_show(_("wancfg_WanGWAddress6Error1"));return 0;}
if(dns6Primary.value==''){warninfo_show(_("wancfg_Dns6PrimaryError1"));return 0;}
if(dns6Primary.value!=''&&sk_isValidIpAddress6(dns6Primary.value)==false){warninfo_show(_("wancfg_Dns6PrimaryError2"));return 0;}
if(dns6Secondary.value!=''&&sk_isValidIpAddress6(dns6Secondary.value)==false){warninfo_show(_("wancfg_Dns6SecondaryError2"));return 0;}
if($("#PDTable").is(':visible')==true&&$("#enblPD").is(':checked')==true)
{var PD;var PDLen=delegatePrefixLen.value;if(delegatePrefixLen.value=='')
PDLen=64;if(delegatePrefix.value==''){warninfo_show(_("wancfg_PrefixError1"));return 0;}
PD=delegatePrefix.value+"/"+PDLen;if(delegatePrefix.value!=''&&isValidIpv6Address(PD)==false){warninfo_show(_("wancfg_PrefixError2"));return 0;}
apply_data.prefixsrc=2;apply_data.prefix=PD;}
else
{apply_data.prefixsrc=0}
apply_data.guasrc=2;apply_data.gatewayv6src=2;apply_data.dnsv6src=2;apply_data.gua=ipv6Addr;apply_data.gatewayv6=wanGateway6.value;apply_data.dns1v6=dns6Primary.value;if(dns6Secondary.value!='')
{apply_data.dns2v6=dns6Secondary.value;}}
return 1;}
function checkDSLiteExist()
{var i=0;for(i=0;i<WanConnJson.length;i++)
{if(parseInt(selindex)!=WanConnJson[i].index)
{if(WanConnJson[i].dslite=='1')
{return false;}}}
return true;}
function saveDslite(){var f = document.forms[0];
var Box_TxPower = f.Box_TxPower, Chk_HideEnable = f.Chk_HideEnable, Chk_RadioEnable = f.Chk_RadioEnable, Chk_SsidEnable = f.Chk_SsidEnable, Control_Enable = f.Control_Enable, DMUMIMO_Enable = f.DMUMIMO_Enable, DMUOFDMA_Enable = f.DMUOFDMA_Enable, DSLiteEnable = f.DSLiteEnable, DSLiteEnableTable = f.DSLiteEnableTable, DSLiteModeTable = f.DSLiteModeTable, Defaultroute = f.Defaultroute, Defaultroutev6 = f.Defaultroutev6, Enable = f.Enable, EnableStaticIp = f.EnableStaticIp, IANATable = f.IANATable, IOT = f.IOT, IOTBS = f.IOTBS, IOTBSDisable = f.IOTBSDisable, IOTBSDisable_label = f.IOTBSDisable_label, IOTBSEnable = f.IOTBSEnable, IOTBSEnable_label = f.IOTBSEnable_label, IOTBSTable = f.IOTBSTable, IOTDisable = f.IOTDisable, IOTDisable_label = f.IOTDisable_label, IOTEnable = f.IOTEnable, IOTEnable_label = f.IOTEnable_label, IOTTable = f.IOTTable, IOT_PSK = f.IOT_PSK, IpVersion = f.IpVersion, Networkconfigid = f.Networkconfigid, OnDemandTable = f.OnDemandTable, PDTable = f.PDTable, PDTableStatic = f.PDTableStatic, Pwd_WpaPsk = f.Pwd_WpaPsk, Pwd_WpaPsk_IOT = f.Pwd_WpaPsk_IOT, Sel_AuthMode = f.Sel_AuthMode, Sel_BandWidth = f.Sel_BandWidth, Sel_Channel = f.Sel_Channel, Sel_Encryption = f.Sel_Encryption, Sel_PhyMode = f.Sel_PhyMode, Sel_TxPower = f.Sel_TxPower, Sel_guardInterval = f.Sel_guardInterval, Sky_Apply = f.Sky_Apply, Sky_Cancel = f.Sky_Cancel, Sky_DHCP_Disable = f.Sky_DHCP_Disable, Sky_DHCP_Enable = f.Sky_DHCP_Enable, Sky_DHCP_Mode_Auto = f.Sky_DHCP_Mode_Auto, Sky_DHCP_Mode_Proxy = f.Sky_DHCP_Mode_Proxy, Sky_DHCP_Mode_Static = f.Sky_DHCP_Mode_Static, Sky_DHCP_Relay = f.Sky_DHCP_Relay, Tr_Encryption = f.Tr_Encryption, Tr_WpaPSK = f.Tr_WpaPSK, Txt_SSID = f.Txt_SSID, Txt_SSID_IOT = f.Txt_SSID_IOT, Txt_acsTime = f.Txt_acsTime, UMUMIMO_Enable = f.UMUMIMO_Enable, UMUOFDMA_Enable = f.UMUOFDMA_Enable, WMM_Enable = f.WMM_Enable, briTable = f.briTable, bridgeapply = f.bridgeapply, btn_add = f.btn_add, btn_del = f.btn_del, btn_edit = f.btn_edit, button_apply = f.button_apply, client_num = f.client_num, connMode = f.connMode, d8021 = f.d8021, defGW = f.defGW, default_route = f.default_route, default_routev6 = f.default_routev6, defaultroute = f.defaultroute, defaultroutev6 = f.defaultroutev6, delegatePrefix = f.delegatePrefix, delegatePrefixLen = f.delegatePrefixLen, dhcpEthEnd = f.dhcpEthEnd, dhcpEthStart = f.dhcpEthStart, dhcpLeasedTime = f.dhcpLeasedTime, dhcpMode = f.dhcpMode, dhcpSrvAddr = f.dhcpSrvAddr, dhcpSrvType = f.dhcpSrvType, dhcpSrvType1 = f.dhcpSrvType1, dhcpSrvType2 = f.dhcpSrvType2, dhcpSrvType3 = f.dhcpSrvType3, dhcpstaticContent = f.dhcpstaticContent, dhcpstaticTBody = f.dhcpstaticTBody, dialMode = f.dialMode, dialTable = f.dialTable, dns6Primary = f.dns6Primary, dns6Secondary = f.dns6Secondary, dnsPrimary = f.dnsPrimary, dnsSecondary = f.dnsSecondary, dnsmode = f.dnsmode, dnsmode1 = f.dnsmode1, dnsmode2 = f.dnsmode2, dnsmode3 = f.dnsmode3, dnsv4Satic = f.dnsv4Satic, dnsv6Table = f.dnsv6Table, dnsv6disable = f.dnsv6disable, dnsv6enable = f.dnsv6enable, dnsv6mode = f.dnsv6mode, dsLiteServer = f.dsLiteServer, dsliteManualTable = f.dsliteManualTable, dsliteMode = f.dsliteMode, dsliteModeAuto = f.dsliteModeAuto, dsliteModeManual = f.dsliteModeManual, dsliteTable = f.dsliteTable, enable = f.enable, enbl6RD = f.enbl6RD, enblDSLite = f.enblDSLite, enblIANA = f.enblIANA, enblPD = f.enblPD, ethIpAddress = f.ethIpAddress, ethSubnetMask = f.ethSubnetMask, firstDns = f.firstDns, fullConeNat = f.fullConeNat, fullapply = f.fullapply, idleTime = f.idleTime, ipAddr = f.ipAddr, ipAddrTable = f.ipAddrTable, ipproto = f.ipproto, ipprotodhcp = f.ipprotodhcp, ipprotopppoe = f.ipprotopppoe, ipprotostatic = f.ipprotostatic, ipv6RDEnableTable = f.ipv6RDEnableTable, ipv6RDMode = f.ipv6RDMode, ipv6RDModeAuto = f.ipv6RDModeAuto, ipv6RDModeManual = f.ipv6RDModeManual, ipv6RDModeTable = f.ipv6RDModeTable, ipv6Table = f.ipv6Table, ipv6rdBrAddr = f.ipv6rdBrAddr, ipv6rdIpv4MaskLen = f.ipv6rdIpv4MaskLen, ipv6rdManualTable = f.ipv6rdManualTable, ipv6rdPrefix = f.ipv6rdPrefix, ipv6rdPrefixLen = f.ipv6rdPrefixLen, ipv6rdTable = f.ipv6rdTable, ipversionmode = f.ipversionmode, lan_port_list = f.lan_port_list, lancfg_StaticipAdd = f.lancfg_StaticipAdd, lancfg_StaticipDel = f.lancfg_StaticipDel, lancfg_dhcpserver = f.lancfg_dhcpserver, maximum_client = f.maximum_client, mtu = f.mtu, multiVID = f.multiVID, nat = f.nat, natEnble = f.natEnble, nattable = f.nattable, netMask = f.netMask, noipv6apply = f.noipv6apply, pdEnable = f.pdEnable, portbindtable = f.portbindtable, pppStaticEndAddress = f.pppStaticEndAddress, pppStaticIPAddress = f.pppStaticIPAddress, pppStaticIPEnableTable = f.pppStaticIPEnableTable, pppStaticIPTable = f.pppStaticIPTable, pppStaticStartAddress = f.pppStaticStartAddress, pppStaticSubnetMask = f.pppStaticSubnetMask, pppoeMode = f.pppoeMode, radio_hide = f.radio_hide, relayInfo = f.relayInfo, rouTable = f.rouTable, secondDns = f.secondDns, selectAll = f.selectAll, seletall = f.seletall, serviceMode = f.serviceMode, span_mtu = f.span_mtu, static6Table = f.static6Table, staticIpAll_Sel = f.staticIpAll_Sel, staticIp_Tbl = f.staticIp_Tbl, staticMode = f.staticMode, uPsd = f.uPsd, userName = f.userName, vlanID = f.vlanID, vlanMode = f.vlanMode, vlanvfg = f.vlanvfg, wanAddress6 = f.wanAddress6, wanAddress6prefix = f.wanAddress6prefix, wanGateway6 = f.wanGateway6, wanform = f.wanform, wanindex = f.wanindex, wantittleinfo = f.wantittleinfo;
if(true){if(!enblDSLite.checked){apply_data.dslite_mode=0;}else{if($('input:radio[name="dsliteMode"]:checked').val()=="dsliteAuto"){apply_data.dslite_mode=1;}
else{if(dsLiteServer.value==''){warninfo_show(_("dsliteServer")+_("cannotBeEmptyError"));return-1;}
if(dsLiteServer.value.indexOf(":")==-1){if(dsLiteServer.value.indexOf(".")==-1){warninfo_show(_("dsliteServer")+dsLiteServer.value+_("isInvalidError"));return-1;}}else{if("::"==dsLiteServer.value||isValidIpv6Address(dsLiteServer.value)!=true||true==isMultiCastIpv6Address(dsLiteServer.value)){warninfo_show(_("dsliteServer")+dsLiteServer.value+_("isInvalidError"));return-1;}
if(!isGlobalIpv6Address(dsLiteServer.value)){warninfo_show(_("dsliteServer")+dsLiteServer.value+_("isInvalidError"));return-1;}}
apply_data.dslite_mode=2;apply_data.dslite_peeraddr=dsLiteServer.value;}
if((checkDSLiteExist()==false)){warninfo_show(_("dsliteExistError"));return-1;}}}
return 0;}
function checkIpv6rdExist()
{var i=0;for(i=0;i<WanConnJson.length;i++)
{if(parseInt(selindex)!=WanConnJson[i].index)
{if(WanConnJson[i].ipv6rd!=0)
{return false;}}}
return true;}
function saveIpv6rd(){var f = document.forms[0];
var Box_TxPower = f.Box_TxPower, Chk_HideEnable = f.Chk_HideEnable, Chk_RadioEnable = f.Chk_RadioEnable, Chk_SsidEnable = f.Chk_SsidEnable, Control_Enable = f.Control_Enable, DMUMIMO_Enable = f.DMUMIMO_Enable, DMUOFDMA_Enable = f.DMUOFDMA_Enable, DSLiteEnable = f.DSLiteEnable, DSLiteEnableTable = f.DSLiteEnableTable, DSLiteModeTable = f.DSLiteModeTable, Defaultroute = f.Defaultroute, Defaultroutev6 = f.Defaultroutev6, Enable = f.Enable, EnableStaticIp = f.EnableStaticIp, IANATable = f.IANATable, IOT = f.IOT, IOTBS = f.IOTBS, IOTBSDisable = f.IOTBSDisable, IOTBSDisable_label = f.IOTBSDisable_label, IOTBSEnable = f.IOTBSEnable, IOTBSEnable_label = f.IOTBSEnable_label, IOTBSTable = f.IOTBSTable, IOTDisable = f.IOTDisable, IOTDisable_label = f.IOTDisable_label, IOTEnable = f.IOTEnable, IOTEnable_label = f.IOTEnable_label, IOTTable = f.IOTTable, IOT_PSK = f.IOT_PSK, IpVersion = f.IpVersion, Networkconfigid = f.Networkconfigid, OnDemandTable = f.OnDemandTable, PDTable = f.PDTable, PDTableStatic = f.PDTableStatic, Pwd_WpaPsk = f.Pwd_WpaPsk, Pwd_WpaPsk_IOT = f.Pwd_WpaPsk_IOT, Sel_AuthMode = f.Sel_AuthMode, Sel_BandWidth = f.Sel_BandWidth, Sel_Channel = f.Sel_Channel, Sel_Encryption = f.Sel_Encryption, Sel_PhyMode = f.Sel_PhyMode, Sel_TxPower = f.Sel_TxPower, Sel_guardInterval = f.Sel_guardInterval, Sky_Apply = f.Sky_Apply, Sky_Cancel = f.Sky_Cancel, Sky_DHCP_Disable = f.Sky_DHCP_Disable, Sky_DHCP_Enable = f.Sky_DHCP_Enable, Sky_DHCP_Mode_Auto = f.Sky_DHCP_Mode_Auto, Sky_DHCP_Mode_Proxy = f.Sky_DHCP_Mode_Proxy, Sky_DHCP_Mode_Static = f.Sky_DHCP_Mode_Static, Sky_DHCP_Relay = f.Sky_DHCP_Relay, Tr_Encryption = f.Tr_Encryption, Tr_WpaPSK = f.Tr_WpaPSK, Txt_SSID = f.Txt_SSID, Txt_SSID_IOT = f.Txt_SSID_IOT, Txt_acsTime = f.Txt_acsTime, UMUMIMO_Enable = f.UMUMIMO_Enable, UMUOFDMA_Enable = f.UMUOFDMA_Enable, WMM_Enable = f.WMM_Enable, briTable = f.briTable, bridgeapply = f.bridgeapply, btn_add = f.btn_add, btn_del = f.btn_del, btn_edit = f.btn_edit, button_apply = f.button_apply, client_num = f.client_num, connMode = f.connMode, d8021 = f.d8021, defGW = f.defGW, default_route = f.default_route, default_routev6 = f.default_routev6, defaultroute = f.defaultroute, defaultroutev6 = f.defaultroutev6, delegatePrefix = f.delegatePrefix, delegatePrefixLen = f.delegatePrefixLen, dhcpEthEnd = f.dhcpEthEnd, dhcpEthStart = f.dhcpEthStart, dhcpLeasedTime = f.dhcpLeasedTime, dhcpMode = f.dhcpMode, dhcpSrvAddr = f.dhcpSrvAddr, dhcpSrvType = f.dhcpSrvType, dhcpSrvType1 = f.dhcpSrvType1, dhcpSrvType2 = f.dhcpSrvType2, dhcpSrvType3 = f.dhcpSrvType3, dhcpstaticContent = f.dhcpstaticContent, dhcpstaticTBody = f.dhcpstaticTBody, dialMode = f.dialMode, dialTable = f.dialTable, dns6Primary = f.dns6Primary, dns6Secondary = f.dns6Secondary, dnsPrimary = f.dnsPrimary, dnsSecondary = f.dnsSecondary, dnsmode = f.dnsmode, dnsmode1 = f.dnsmode1, dnsmode2 = f.dnsmode2, dnsmode3 = f.dnsmode3, dnsv4Satic = f.dnsv4Satic, dnsv6Table = f.dnsv6Table, dnsv6disable = f.dnsv6disable, dnsv6enable = f.dnsv6enable, dnsv6mode = f.dnsv6mode, dsLiteServer = f.dsLiteServer, dsliteManualTable = f.dsliteManualTable, dsliteMode = f.dsliteMode, dsliteModeAuto = f.dsliteModeAuto, dsliteModeManual = f.dsliteModeManual, dsliteTable = f.dsliteTable, enable = f.enable, enbl6RD = f.enbl6RD, enblDSLite = f.enblDSLite, enblIANA = f.enblIANA, enblPD = f.enblPD, ethIpAddress = f.ethIpAddress, ethSubnetMask = f.ethSubnetMask, firstDns = f.firstDns, fullConeNat = f.fullConeNat, fullapply = f.fullapply, idleTime = f.idleTime, ipAddr = f.ipAddr, ipAddrTable = f.ipAddrTable, ipproto = f.ipproto, ipprotodhcp = f.ipprotodhcp, ipprotopppoe = f.ipprotopppoe, ipprotostatic = f.ipprotostatic, ipv6RDEnableTable = f.ipv6RDEnableTable, ipv6RDMode = f.ipv6RDMode, ipv6RDModeAuto = f.ipv6RDModeAuto, ipv6RDModeManual = f.ipv6RDModeManual, ipv6RDModeTable = f.ipv6RDModeTable, ipv6Table = f.ipv6Table, ipv6rdBrAddr = f.ipv6rdBrAddr, ipv6rdIpv4MaskLen = f.ipv6rdIpv4MaskLen, ipv6rdManualTable = f.ipv6rdManualTable, ipv6rdPrefix = f.ipv6rdPrefix, ipv6rdPrefixLen = f.ipv6rdPrefixLen, ipv6rdTable = f.ipv6rdTable, ipversionmode = f.ipversionmode, lan_port_list = f.lan_port_list, lancfg_StaticipAdd = f.lancfg_StaticipAdd, lancfg_StaticipDel = f.lancfg_StaticipDel, lancfg_dhcpserver = f.lancfg_dhcpserver, maximum_client = f.maximum_client, mtu = f.mtu, multiVID = f.multiVID, nat = f.nat, natEnble = f.natEnble, nattable = f.nattable, netMask = f.netMask, noipv6apply = f.noipv6apply, pdEnable = f.pdEnable, portbindtable = f.portbindtable, pppStaticEndAddress = f.pppStaticEndAddress, pppStaticIPAddress = f.pppStaticIPAddress, pppStaticIPEnableTable = f.pppStaticIPEnableTable, pppStaticIPTable = f.pppStaticIPTable, pppStaticStartAddress = f.pppStaticStartAddress, pppStaticSubnetMask = f.pppStaticSubnetMask, pppoeMode = f.pppoeMode, radio_hide = f.radio_hide, relayInfo = f.relayInfo, rouTable = f.rouTable, secondDns = f.secondDns, selectAll = f.selectAll, seletall = f.seletall, serviceMode = f.serviceMode, span_mtu = f.span_mtu, static6Table = f.static6Table, staticIpAll_Sel = f.staticIpAll_Sel, staticIp_Tbl = f.staticIp_Tbl, staticMode = f.staticMode, uPsd = f.uPsd, userName = f.userName, vlanID = f.vlanID, vlanMode = f.vlanMode, vlanvfg = f.vlanvfg, wanAddress6 = f.wanAddress6, wanAddress6prefix = f.wanAddress6prefix, wanGateway6 = f.wanGateway6, wanform = f.wanform, wanindex = f.wanindex, wantittleinfo = f.wantittleinfo;
if(true){if(!enbl6RD.checked){apply_data.ipv6rd_mode=0;return 0;}else{if((checkIpv6rdExist()==false)){warninfo_show(_("ipv6rdExistError"));return-1;}
if($('input:radio[name="ipv6RDMode"]:checked').val()=="ipv6RDAuto"){apply_data.ipv6rd_mode=1;}
else
{if(ipv6rdBrAddr.value==''){warninfo_show(_("ipv6rdBRV4Addr ")+_("cannotBeEmptyError"));return-1;}
if(ipv6rdIpv4MaskLen.value==''){warninfo_show(_("ipv6rdV4MaskLen")+_("cannotBeEmptyError"));return-1;}
if(ipv6rdPrefix.value==''){warninfo_show(_("ipv6rdPrefix")+_("cannotBeEmptyError"));return-1;}
if(ipv6rdPrefixLen.value==''){warninfo_show(_("ipv6rdPrefixLen")+_("cannotBeEmptyError"));return-1;}
if(isValidIpAddress(ipv6rdBrAddr.value)==false){warninfo_show(_("ipv6rdBRV4Addr")+ipv6rdBrAddr.value+_("isInvalidError"));return-1;}
apply_data.ipv6rd_peeraddr=ipv6rdBrAddr.value;var maskLen;maskLen=parseInt(ipv6rdIpv4MaskLen.value);if(isNaN(ipv6rdIpv4MaskLen.value)||maskLen<0||maskLen>31){warninfo_show(_("ipv6rdV4MaskLen")+ipv6rdIpv4MaskLen.value+_("isInvalidError"));return-1;}
apply_data.ipv6rd_ipv4mask_len=maskLen;if(isValidIpv6Address(ipv6rdPrefix.value)==false||(ipv6rdPrefix.value.indexOf("2001:0db8")==0||ipv6rdPrefix.value.indexOf("2001:db8")==0)){warninfo_show(_("ipv6rdPrefix")+ipv6rdPrefix.value+_("isInvalidError"));return-1;}
var prefixLen;prefixLen=parseInt(ipv6rdPrefixLen.value);if(isNaN(ipv6rdPrefixLen.value)||prefixLen<=1||prefixLen>32){warninfo_show(_("ipv6rdPrefixLen")+ipv6rdPrefixLen.value+_("isInvalidError"));return-1;}
apply_data.ipv6rd_ipv6prefix=ipv6rdPrefix.value;apply_data.ipv6rd_ipv6prefix_len=prefixLen;apply_data.ipv6rd_mode=2;}}}
return 0;}
function saveIpVersion()
{var ver=2;var f = document.forms[0];
var Box_TxPower = f.Box_TxPower, Chk_HideEnable = f.Chk_HideEnable, Chk_RadioEnable = f.Chk_RadioEnable, Chk_SsidEnable = f.Chk_SsidEnable, Control_Enable = f.Control_Enable, DMUMIMO_Enable = f.DMUMIMO_Enable, DMUOFDMA_Enable = f.DMUOFDMA_Enable, DSLiteEnable = f.DSLiteEnable, DSLiteEnableTable = f.DSLiteEnableTable, DSLiteModeTable = f.DSLiteModeTable, Defaultroute = f.Defaultroute, Defaultroutev6 = f.Defaultroutev6, Enable = f.Enable, EnableStaticIp = f.EnableStaticIp, IANATable = f.IANATable, IOT = f.IOT, IOTBS = f.IOTBS, IOTBSDisable = f.IOTBSDisable, IOTBSDisable_label = f.IOTBSDisable_label, IOTBSEnable = f.IOTBSEnable, IOTBSEnable_label = f.IOTBSEnable_label, IOTBSTable = f.IOTBSTable, IOTDisable = f.IOTDisable, IOTDisable_label = f.IOTDisable_label, IOTEnable = f.IOTEnable, IOTEnable_label = f.IOTEnable_label, IOTTable = f.IOTTable, IOT_PSK = f.IOT_PSK, IpVersion = f.IpVersion, Networkconfigid = f.Networkconfigid, OnDemandTable = f.OnDemandTable, PDTable = f.PDTable, PDTableStatic = f.PDTableStatic, Pwd_WpaPsk = f.Pwd_WpaPsk, Pwd_WpaPsk_IOT = f.Pwd_WpaPsk_IOT, Sel_AuthMode = f.Sel_AuthMode, Sel_BandWidth = f.Sel_BandWidth, Sel_Channel = f.Sel_Channel, Sel_Encryption = f.Sel_Encryption, Sel_PhyMode = f.Sel_PhyMode, Sel_TxPower = f.Sel_TxPower, Sel_guardInterval = f.Sel_guardInterval, Sky_Apply = f.Sky_Apply, Sky_Cancel = f.Sky_Cancel, Sky_DHCP_Disable = f.Sky_DHCP_Disable, Sky_DHCP_Enable = f.Sky_DHCP_Enable, Sky_DHCP_Mode_Auto = f.Sky_DHCP_Mode_Auto, Sky_DHCP_Mode_Proxy = f.Sky_DHCP_Mode_Proxy, Sky_DHCP_Mode_Static = f.Sky_DHCP_Mode_Static, Sky_DHCP_Relay = f.Sky_DHCP_Relay, Tr_Encryption = f.Tr_Encryption, Tr_WpaPSK = f.Tr_WpaPSK, Txt_SSID = f.Txt_SSID, Txt_SSID_IOT = f.Txt_SSID_IOT, Txt_acsTime = f.Txt_acsTime, UMUMIMO_Enable = f.UMUMIMO_Enable, UMUOFDMA_Enable = f.UMUOFDMA_Enable, WMM_Enable = f.WMM_Enable, briTable = f.briTable, bridgeapply = f.bridgeapply, btn_add = f.btn_add, btn_del = f.btn_del, btn_edit = f.btn_edit, button_apply = f.button_apply, client_num = f.client_num, connMode = f.connMode, d8021 = f.d8021, defGW = f.defGW, default_route = f.default_route, default_routev6 = f.default_routev6, defaultroute = f.defaultroute, defaultroutev6 = f.defaultroutev6, delegatePrefix = f.delegatePrefix, delegatePrefixLen = f.delegatePrefixLen, dhcpEthEnd = f.dhcpEthEnd, dhcpEthStart = f.dhcpEthStart, dhcpLeasedTime = f.dhcpLeasedTime, dhcpMode = f.dhcpMode, dhcpSrvAddr = f.dhcpSrvAddr, dhcpSrvType = f.dhcpSrvType, dhcpSrvType1 = f.dhcpSrvType1, dhcpSrvType2 = f.dhcpSrvType2, dhcpSrvType3 = f.dhcpSrvType3, dhcpstaticContent = f.dhcpstaticContent, dhcpstaticTBody = f.dhcpstaticTBody, dialMode = f.dialMode, dialTable = f.dialTable, dns6Primary = f.dns6Primary, dns6Secondary = f.dns6Secondary, dnsPrimary = f.dnsPrimary, dnsSecondary = f.dnsSecondary, dnsmode = f.dnsmode, dnsmode1 = f.dnsmode1, dnsmode2 = f.dnsmode2, dnsmode3 = f.dnsmode3, dnsv4Satic = f.dnsv4Satic, dnsv6Table = f.dnsv6Table, dnsv6disable = f.dnsv6disable, dnsv6enable = f.dnsv6enable, dnsv6mode = f.dnsv6mode, dsLiteServer = f.dsLiteServer, dsliteManualTable = f.dsliteManualTable, dsliteMode = f.dsliteMode, dsliteModeAuto = f.dsliteModeAuto, dsliteModeManual = f.dsliteModeManual, dsliteTable = f.dsliteTable, enable = f.enable, enbl6RD = f.enbl6RD, enblDSLite = f.enblDSLite, enblIANA = f.enblIANA, enblPD = f.enblPD, ethIpAddress = f.ethIpAddress, ethSubnetMask = f.ethSubnetMask, firstDns = f.firstDns, fullConeNat = f.fullConeNat, fullapply = f.fullapply, idleTime = f.idleTime, ipAddr = f.ipAddr, ipAddrTable = f.ipAddrTable, ipproto = f.ipproto, ipprotodhcp = f.ipprotodhcp, ipprotopppoe = f.ipprotopppoe, ipprotostatic = f.ipprotostatic, ipv6RDEnableTable = f.ipv6RDEnableTable, ipv6RDMode = f.ipv6RDMode, ipv6RDModeAuto = f.ipv6RDModeAuto, ipv6RDModeManual = f.ipv6RDModeManual, ipv6RDModeTable = f.ipv6RDModeTable, ipv6Table = f.ipv6Table, ipv6rdBrAddr = f.ipv6rdBrAddr, ipv6rdIpv4MaskLen = f.ipv6rdIpv4MaskLen, ipv6rdManualTable = f.ipv6rdManualTable, ipv6rdPrefix = f.ipv6rdPrefix, ipv6rdPrefixLen = f.ipv6rdPrefixLen, ipv6rdTable = f.ipv6rdTable, ipversionmode = f.ipversionmode, lan_port_list = f.lan_port_list, lancfg_StaticipAdd = f.lancfg_StaticipAdd, lancfg_StaticipDel = f.lancfg_StaticipDel, lancfg_dhcpserver = f.lancfg_dhcpserver, maximum_client = f.maximum_client, mtu = f.mtu, multiVID = f.multiVID, nat = f.nat, natEnble = f.natEnble, nattable = f.nattable, netMask = f.netMask, noipv6apply = f.noipv6apply, pdEnable = f.pdEnable, portbindtable = f.portbindtable, pppStaticEndAddress = f.pppStaticEndAddress, pppStaticIPAddress = f.pppStaticIPAddress, pppStaticIPEnableTable = f.pppStaticIPEnableTable, pppStaticIPTable = f.pppStaticIPTable, pppStaticStartAddress = f.pppStaticStartAddress, pppStaticSubnetMask = f.pppStaticSubnetMask, pppoeMode = f.pppoeMode, radio_hide = f.radio_hide, relayInfo = f.relayInfo, rouTable = f.rouTable, secondDns = f.secondDns, selectAll = f.selectAll, seletall = f.seletall, serviceMode = f.serviceMode, span_mtu = f.span_mtu, static6Table = f.static6Table, staticIpAll_Sel = f.staticIpAll_Sel, staticIp_Tbl = f.staticIp_Tbl, staticMode = f.staticMode, uPsd = f.uPsd, userName = f.userName, vlanID = f.vlanID, vlanMode = f.vlanMode, vlanvfg = f.vlanvfg, wanAddress6 = f.wanAddress6, wanAddress6prefix = f.wanAddress6prefix, wanGateway6 = f.wanGateway6, wanform = f.wanform, wanindex = f.wanindex, wantittleinfo = f.wantittleinfo;
if(true)
{if(connMode.value!="bridge")
{if(IpVersion.value==0)
{ver=1;}
else if(IpVersion.value==1)
{ver=2;}
else if(IpVersion.value==2)
{ver=3;}}
else
{ver=3;}
apply_data.IPStack=ver;}}
function isContainNOSupportChar(str)
{for(var i=0;i<str.length;i++)
{var charCode=str.charCodeAt(i);if(!((charCode>=48&&charCode<=57)||(charCode>=65&&charCode<=90)||(charCode>=97&&charCode<=122)||(charCode==32)||(charCode==33)||(charCode==34)||(charCode==64)||(charCode==35)||(charCode==36)||(charCode==37)||(charCode==94)||(charCode==38)||(charCode==39)||(charCode==40)||(charCode==41)||(charCode==42)||(charCode==43)||(charCode==45)||(charCode==46)||(charCode==47)||(charCode==63)||(charCode==95)))
{return true;}}
return false;}
function savePppParam()
{var pppUserName;var pppPassword;var pppServerName;var pppIdleTime;var pppStaticIPEnable;var pppIpAddr;var pppInetMask;var pppIpStartAddr;var pppIpEndAddr;var f = document.forms[0];
var Box_TxPower = f.Box_TxPower, Chk_HideEnable = f.Chk_HideEnable, Chk_RadioEnable = f.Chk_RadioEnable, Chk_SsidEnable = f.Chk_SsidEnable, Control_Enable = f.Control_Enable, DMUMIMO_Enable = f.DMUMIMO_Enable, DMUOFDMA_Enable = f.DMUOFDMA_Enable, DSLiteEnable = f.DSLiteEnable, DSLiteEnableTable = f.DSLiteEnableTable, DSLiteModeTable = f.DSLiteModeTable, Defaultroute = f.Defaultroute, Defaultroutev6 = f.Defaultroutev6, Enable = f.Enable, EnableStaticIp = f.EnableStaticIp, IANATable = f.IANATable, IOT = f.IOT, IOTBS = f.IOTBS, IOTBSDisable = f.IOTBSDisable, IOTBSDisable_label = f.IOTBSDisable_label, IOTBSEnable = f.IOTBSEnable, IOTBSEnable_label = f.IOTBSEnable_label, IOTBSTable = f.IOTBSTable, IOTDisable = f.IOTDisable, IOTDisable_label = f.IOTDisable_label, IOTEnable = f.IOTEnable, IOTEnable_label = f.IOTEnable_label, IOTTable = f.IOTTable, IOT_PSK = f.IOT_PSK, IpVersion = f.IpVersion, Networkconfigid = f.Networkconfigid, OnDemandTable = f.OnDemandTable, PDTable = f.PDTable, PDTableStatic = f.PDTableStatic, Pwd_WpaPsk = f.Pwd_WpaPsk, Pwd_WpaPsk_IOT = f.Pwd_WpaPsk_IOT, Sel_AuthMode = f.Sel_AuthMode, Sel_BandWidth = f.Sel_BandWidth, Sel_Channel = f.Sel_Channel, Sel_Encryption = f.Sel_Encryption, Sel_PhyMode = f.Sel_PhyMode, Sel_TxPower = f.Sel_TxPower, Sel_guardInterval = f.Sel_guardInterval, Sky_Apply = f.Sky_Apply, Sky_Cancel = f.Sky_Cancel, Sky_DHCP_Disable = f.Sky_DHCP_Disable, Sky_DHCP_Enable = f.Sky_DHCP_Enable, Sky_DHCP_Mode_Auto = f.Sky_DHCP_Mode_Auto, Sky_DHCP_Mode_Proxy = f.Sky_DHCP_Mode_Proxy, Sky_DHCP_Mode_Static = f.Sky_DHCP_Mode_Static, Sky_DHCP_Relay = f.Sky_DHCP_Relay, Tr_Encryption = f.Tr_Encryption, Tr_WpaPSK = f.Tr_WpaPSK, Txt_SSID = f.Txt_SSID, Txt_SSID_IOT = f.Txt_SSID_IOT, Txt_acsTime = f.Txt_acsTime, UMUMIMO_Enable = f.UMUMIMO_Enable, UMUOFDMA_Enable = f.UMUOFDMA_Enable, WMM_Enable = f.WMM_Enable, briTable = f.briTable, bridgeapply = f.bridgeapply, btn_add = f.btn_add, btn_del = f.btn_del, btn_edit = f.btn_edit, button_apply = f.button_apply, client_num = f.client_num, connMode = f.connMode, d8021 = f.d8021, defGW = f.defGW, default_route = f.default_route, default_routev6 = f.default_routev6, defaultroute = f.defaultroute, defaultroutev6 = f.defaultroutev6, delegatePrefix = f.delegatePrefix, delegatePrefixLen = f.delegatePrefixLen, dhcpEthEnd = f.dhcpEthEnd, dhcpEthStart = f.dhcpEthStart, dhcpLeasedTime = f.dhcpLeasedTime, dhcpMode = f.dhcpMode, dhcpSrvAddr = f.dhcpSrvAddr, dhcpSrvType = f.dhcpSrvType, dhcpSrvType1 = f.dhcpSrvType1, dhcpSrvType2 = f.dhcpSrvType2, dhcpSrvType3 = f.dhcpSrvType3, dhcpstaticContent = f.dhcpstaticContent, dhcpstaticTBody = f.dhcpstaticTBody, dialMode = f.dialMode, dialTable = f.dialTable, dns6Primary = f.dns6Primary, dns6Secondary = f.dns6Secondary, dnsPrimary = f.dnsPrimary, dnsSecondary = f.dnsSecondary, dnsmode = f.dnsmode, dnsmode1 = f.dnsmode1, dnsmode2 = f.dnsmode2, dnsmode3 = f.dnsmode3, dnsv4Satic = f.dnsv4Satic, dnsv6Table = f.dnsv6Table, dnsv6disable = f.dnsv6disable, dnsv6enable = f.dnsv6enable, dnsv6mode = f.dnsv6mode, dsLiteServer = f.dsLiteServer, dsliteManualTable = f.dsliteManualTable, dsliteMode = f.dsliteMode, dsliteModeAuto = f.dsliteModeAuto, dsliteModeManual = f.dsliteModeManual, dsliteTable = f.dsliteTable, enable = f.enable, enbl6RD = f.enbl6RD, enblDSLite = f.enblDSLite, enblIANA = f.enblIANA, enblPD = f.enblPD, ethIpAddress = f.ethIpAddress, ethSubnetMask = f.ethSubnetMask, firstDns = f.firstDns, fullConeNat = f.fullConeNat, fullapply = f.fullapply, idleTime = f.idleTime, ipAddr = f.ipAddr, ipAddrTable = f.ipAddrTable, ipproto = f.ipproto, ipprotodhcp = f.ipprotodhcp, ipprotopppoe = f.ipprotopppoe, ipprotostatic = f.ipprotostatic, ipv6RDEnableTable = f.ipv6RDEnableTable, ipv6RDMode = f.ipv6RDMode, ipv6RDModeAuto = f.ipv6RDModeAuto, ipv6RDModeManual = f.ipv6RDModeManual, ipv6RDModeTable = f.ipv6RDModeTable, ipv6Table = f.ipv6Table, ipv6rdBrAddr = f.ipv6rdBrAddr, ipv6rdIpv4MaskLen = f.ipv6rdIpv4MaskLen, ipv6rdManualTable = f.ipv6rdManualTable, ipv6rdPrefix = f.ipv6rdPrefix, ipv6rdPrefixLen = f.ipv6rdPrefixLen, ipv6rdTable = f.ipv6rdTable, ipversionmode = f.ipversionmode, lan_port_list = f.lan_port_list, lancfg_StaticipAdd = f.lancfg_StaticipAdd, lancfg_StaticipDel = f.lancfg_StaticipDel, lancfg_dhcpserver = f.lancfg_dhcpserver, maximum_client = f.maximum_client, mtu = f.mtu, multiVID = f.multiVID, nat = f.nat, natEnble = f.natEnble, nattable = f.nattable, netMask = f.netMask, noipv6apply = f.noipv6apply, pdEnable = f.pdEnable, portbindtable = f.portbindtable, pppStaticEndAddress = f.pppStaticEndAddress, pppStaticIPAddress = f.pppStaticIPAddress, pppStaticIPEnableTable = f.pppStaticIPEnableTable, pppStaticIPTable = f.pppStaticIPTable, pppStaticStartAddress = f.pppStaticStartAddress, pppStaticSubnetMask = f.pppStaticSubnetMask, pppoeMode = f.pppoeMode, radio_hide = f.radio_hide, relayInfo = f.relayInfo, rouTable = f.rouTable, secondDns = f.secondDns, selectAll = f.selectAll, seletall = f.seletall, serviceMode = f.serviceMode, span_mtu = f.span_mtu, static6Table = f.static6Table, staticIpAll_Sel = f.staticIpAll_Sel, staticIp_Tbl = f.staticIp_Tbl, staticMode = f.staticMode, uPsd = f.uPsd, userName = f.userName, vlanID = f.vlanID, vlanMode = f.vlanMode, vlanvfg = f.vlanvfg, wanAddress6 = f.wanAddress6, wanAddress6prefix = f.wanAddress6prefix, wanGateway6 = f.wanGateway6, wanform = f.wanform, wanindex = f.wanindex, wantittleinfo = f.wantittleinfo;
if(true)
{if(connMode.value!="route"||$('input:radio[name="ipproto"]:checked').val()!="pppoe")
{return 1;}
pppUserName=userName.value;pppPassword=uPsd.value;if(dialMode.value==1)
{pppIdleTime=0;}
else
{pppIdleTime=parseInt(idleTime.value);if(isNaN(pppIdleTime)||pppIdleTime<30||pppIdleTime>9999)
{warninfo_show(_("wancfg_pppIdleTimeValue")+": "+idleTime.value+" "+_("wancfg_pppIdleTimeValueError"));return 0;}}
if(EnableStaticIp.checked==false)
{pppStaticIPEnable=0;}
else
{if(IpVersion.value==1)
{pppStaticIPEnable=0;}
else
{pppStaticIPEnable=1;}}
pppIpAddr=pppStaticIPAddress.value;pppInetMask=pppStaticSubnetMask.value;pppIpStartAddr=pppStaticStartAddress.value;pppIpEndAddr=pppStaticEndAddress.value;if(pppUserName.length==0)
{warninfo_show(_("wancfg_PPPoEUserNameError1"));return 0;}
else if(pppUserName.length>64)
{warninfo_show(_("wancfg_PPPoEUserNameError2"));return 0;}
if(isContainNOSupportChar(pppUserName)==true)
{warninfo_show(_("wancfg_PPPoEUserNameError3"));return 0;}
if(pppPassword.length==0)
{warninfo_show(_("wancfg_PPPoEPasswordError1"));return 0;}
else if(pppPassword.length>32)
{warninfo_show(_("wancfg_PPPoEPasswordError2"));return 0;}
if(isContainNOSupportChar(pppPassword)==true)
{warninfo_show(_("wancfg_PPPoEPasswordError3"));return 0;}
if(pppIpAddr.length>0&&(isValidIpAddress(pppIpAddr)==false||checkIsSpecialIP(pppIpAddr)==true))
{warninfo_show(_("wancfg_IPAddr")+" "+pppIpAddr+" "+_("wancfg_Invalid")+"!");return 0;}
if(pppInetMask.length>0&&(isValidSubnetMask(pppInetMask)==false||checkIsSpecialIP(pppInetMask)==true))
{warninfo_show(_("wancfg_SubnetMask")+" "+pppInetMask+" "+_("wancfg_Invalid")+"!");return 0;}
if(pppIpAddr.length>0&&pppInetMask.length>0&&isNetworkaddr(pppIpAddr,pppInetMask))
{warninfo_show(_("wancfg_IPAddr")+" "+ipAddr+" "+_("wancfg_Invalid")+"!");return 0;}
if(pppIpStartAddr.length>0&&(isValidIpAddress(pppIpStartAddr)==false||checkIsSpecialIP(pppIpStartAddr)==true))
{warninfo_show(_("wancfg_IPAddr")+" "+pppIpStartAddr+" "+_("wancfg_Invalid")+"!");return 0;}
if(pppIpEndAddr.length>0&&(isValidIpAddress(pppIpEndAddr)==false||checkIsSpecialIP(pppIpEndAddr)==true))
{warninfo_show(_("wancfg_IPAddr")+" "+pppIpEndAddr+" "+_("wancfg_Invalid")+"!");return 0;}
if(pppIpStartAddr.length>0&&!cmpIpAddress(pppIpStartAddr,pppIpEndAddr)){warninfo_show(_("wancfg_IPAddr")+" "+pppIpEndAddr+" "+_("wancfg_Invalid")+"!");return 0;}
apply_data.dial=pppIdleTime*60;apply_data.pppoename=pppUserName;apply_data.pppoepwd=getAES(pppPassword);apply_data.PPPoEStaticIPEnable=pppStaticIPEnable;apply_data.PPPoEStaticAddr=pppIpAddr;apply_data.PPPoEStaticMask=pppInetMask;apply_data.PPPoEStaticStartAddr=pppIpStartAddr;apply_data.PPPoEStaticEndAddr=pppIpEndAddr;}
return 1;}
function saveConnType()
{var wanConnType;var index=0;console.log("come here");var f = document.forms[0];
var Box_TxPower = f.Box_TxPower, Chk_HideEnable = f.Chk_HideEnable, Chk_RadioEnable = f.Chk_RadioEnable, Chk_SsidEnable = f.Chk_SsidEnable, Control_Enable = f.Control_Enable, DMUMIMO_Enable = f.DMUMIMO_Enable, DMUOFDMA_Enable = f.DMUOFDMA_Enable, DSLiteEnable = f.DSLiteEnable, DSLiteEnableTable = f.DSLiteEnableTable, DSLiteModeTable = f.DSLiteModeTable, Defaultroute = f.Defaultroute, Defaultroutev6 = f.Defaultroutev6, Enable = f.Enable, EnableStaticIp = f.EnableStaticIp, IANATable = f.IANATable, IOT = f.IOT, IOTBS = f.IOTBS, IOTBSDisable = f.IOTBSDisable, IOTBSDisable_label = f.IOTBSDisable_label, IOTBSEnable = f.IOTBSEnable, IOTBSEnable_label = f.IOTBSEnable_label, IOTBSTable = f.IOTBSTable, IOTDisable = f.IOTDisable, IOTDisable_label = f.IOTDisable_label, IOTEnable = f.IOTEnable, IOTEnable_label = f.IOTEnable_label, IOTTable = f.IOTTable, IOT_PSK = f.IOT_PSK, IpVersion = f.IpVersion, Networkconfigid = f.Networkconfigid, OnDemandTable = f.OnDemandTable, PDTable = f.PDTable, PDTableStatic = f.PDTableStatic, Pwd_WpaPsk = f.Pwd_WpaPsk, Pwd_WpaPsk_IOT = f.Pwd_WpaPsk_IOT, Sel_AuthMode = f.Sel_AuthMode, Sel_BandWidth = f.Sel_BandWidth, Sel_Channel = f.Sel_Channel, Sel_Encryption = f.Sel_Encryption, Sel_PhyMode = f.Sel_PhyMode, Sel_TxPower = f.Sel_TxPower, Sel_guardInterval = f.Sel_guardInterval, Sky_Apply = f.Sky_Apply, Sky_Cancel = f.Sky_Cancel, Sky_DHCP_Disable = f.Sky_DHCP_Disable, Sky_DHCP_Enable = f.Sky_DHCP_Enable, Sky_DHCP_Mode_Auto = f.Sky_DHCP_Mode_Auto, Sky_DHCP_Mode_Proxy = f.Sky_DHCP_Mode_Proxy, Sky_DHCP_Mode_Static = f.Sky_DHCP_Mode_Static, Sky_DHCP_Relay = f.Sky_DHCP_Relay, Tr_Encryption = f.Tr_Encryption, Tr_WpaPSK = f.Tr_WpaPSK, Txt_SSID = f.Txt_SSID, Txt_SSID_IOT = f.Txt_SSID_IOT, Txt_acsTime = f.Txt_acsTime, UMUMIMO_Enable = f.UMUMIMO_Enable, UMUOFDMA_Enable = f.UMUOFDMA_Enable, WMM_Enable = f.WMM_Enable, briTable = f.briTable, bridgeapply = f.bridgeapply, btn_add = f.btn_add, btn_del = f.btn_del, btn_edit = f.btn_edit, button_apply = f.button_apply, client_num = f.client_num, connMode = f.connMode, d8021 = f.d8021, defGW = f.defGW, default_route = f.default_route, default_routev6 = f.default_routev6, defaultroute = f.defaultroute, defaultroutev6 = f.defaultroutev6, delegatePrefix = f.delegatePrefix, delegatePrefixLen = f.delegatePrefixLen, dhcpEthEnd = f.dhcpEthEnd, dhcpEthStart = f.dhcpEthStart, dhcpLeasedTime = f.dhcpLeasedTime, dhcpMode = f.dhcpMode, dhcpSrvAddr = f.dhcpSrvAddr, dhcpSrvType = f.dhcpSrvType, dhcpSrvType1 = f.dhcpSrvType1, dhcpSrvType2 = f.dhcpSrvType2, dhcpSrvType3 = f.dhcpSrvType3, dhcpstaticContent = f.dhcpstaticContent, dhcpstaticTBody = f.dhcpstaticTBody, dialMode = f.dialMode, dialTable = f.dialTable, dns6Primary = f.dns6Primary, dns6Secondary = f.dns6Secondary, dnsPrimary = f.dnsPrimary, dnsSecondary = f.dnsSecondary, dnsmode = f.dnsmode, dnsmode1 = f.dnsmode1, dnsmode2 = f.dnsmode2, dnsmode3 = f.dnsmode3, dnsv4Satic = f.dnsv4Satic, dnsv6Table = f.dnsv6Table, dnsv6disable = f.dnsv6disable, dnsv6enable = f.dnsv6enable, dnsv6mode = f.dnsv6mode, dsLiteServer = f.dsLiteServer, dsliteManualTable = f.dsliteManualTable, dsliteMode = f.dsliteMode, dsliteModeAuto = f.dsliteModeAuto, dsliteModeManual = f.dsliteModeManual, dsliteTable = f.dsliteTable, enable = f.enable, enbl6RD = f.enbl6RD, enblDSLite = f.enblDSLite, enblIANA = f.enblIANA, enblPD = f.enblPD, ethIpAddress = f.ethIpAddress, ethSubnetMask = f.ethSubnetMask, firstDns = f.firstDns, fullConeNat = f.fullConeNat, fullapply = f.fullapply, idleTime = f.idleTime, ipAddr = f.ipAddr, ipAddrTable = f.ipAddrTable, ipproto = f.ipproto, ipprotodhcp = f.ipprotodhcp, ipprotopppoe = f.ipprotopppoe, ipprotostatic = f.ipprotostatic, ipv6RDEnableTable = f.ipv6RDEnableTable, ipv6RDMode = f.ipv6RDMode, ipv6RDModeAuto = f.ipv6RDModeAuto, ipv6RDModeManual = f.ipv6RDModeManual, ipv6RDModeTable = f.ipv6RDModeTable, ipv6Table = f.ipv6Table, ipv6rdBrAddr = f.ipv6rdBrAddr, ipv6rdIpv4MaskLen = f.ipv6rdIpv4MaskLen, ipv6rdManualTable = f.ipv6rdManualTable, ipv6rdPrefix = f.ipv6rdPrefix, ipv6rdPrefixLen = f.ipv6rdPrefixLen, ipv6rdTable = f.ipv6rdTable, ipversionmode = f.ipversionmode, lan_port_list = f.lan_port_list, lancfg_StaticipAdd = f.lancfg_StaticipAdd, lancfg_StaticipDel = f.lancfg_StaticipDel, lancfg_dhcpserver = f.lancfg_dhcpserver, maximum_client = f.maximum_client, mtu = f.mtu, multiVID = f.multiVID, nat = f.nat, natEnble = f.natEnble, nattable = f.nattable, netMask = f.netMask, noipv6apply = f.noipv6apply, pdEnable = f.pdEnable, portbindtable = f.portbindtable, pppStaticEndAddress = f.pppStaticEndAddress, pppStaticIPAddress = f.pppStaticIPAddress, pppStaticIPEnableTable = f.pppStaticIPEnableTable, pppStaticIPTable = f.pppStaticIPTable, pppStaticStartAddress = f.pppStaticStartAddress, pppStaticSubnetMask = f.pppStaticSubnetMask, pppoeMode = f.pppoeMode, radio_hide = f.radio_hide, relayInfo = f.relayInfo, rouTable = f.rouTable, secondDns = f.secondDns, selectAll = f.selectAll, seletall = f.seletall, serviceMode = f.serviceMode, span_mtu = f.span_mtu, static6Table = f.static6Table, staticIpAll_Sel = f.staticIpAll_Sel, staticIp_Tbl = f.staticIp_Tbl, staticMode = f.staticMode, uPsd = f.uPsd, userName = f.userName, vlanID = f.vlanID, vlanMode = f.vlanMode, vlanvfg = f.vlanvfg, wanAddress6 = f.wanAddress6, wanAddress6prefix = f.wanAddress6prefix, wanGateway6 = f.wanGateway6, wanform = f.wanform, wanindex = f.wanindex, wantittleinfo = f.wantittleinfo;
if(true)
{console.log("come in form");if(connMode.value=="bridge")
{wanConnType="ap-bridge";}
else
{if($('input:radio[name="ipproto"]:checked').val()=="pppoe")
{wanConnType="pppoe";}
else if($('input:radio[name="ipproto"]:checked').val()=="dhcp")
{if(apply_data.IPStack==2)
{wanConnType="dhcpv6";}
else
{wanConnType="dhcp";}}
else
{wanConnType="static";}}
apply_data.networktype=wanConnType;}
return 1;}
function saveIpv6Param()
{var dhcp6cForPd=0;var dhcp6cForAddr=0;var f = document.forms[0];
var Box_TxPower = f.Box_TxPower, Chk_HideEnable = f.Chk_HideEnable, Chk_RadioEnable = f.Chk_RadioEnable, Chk_SsidEnable = f.Chk_SsidEnable, Control_Enable = f.Control_Enable, DMUMIMO_Enable = f.DMUMIMO_Enable, DMUOFDMA_Enable = f.DMUOFDMA_Enable, DSLiteEnable = f.DSLiteEnable, DSLiteEnableTable = f.DSLiteEnableTable, DSLiteModeTable = f.DSLiteModeTable, Defaultroute = f.Defaultroute, Defaultroutev6 = f.Defaultroutev6, Enable = f.Enable, EnableStaticIp = f.EnableStaticIp, IANATable = f.IANATable, IOT = f.IOT, IOTBS = f.IOTBS, IOTBSDisable = f.IOTBSDisable, IOTBSDisable_label = f.IOTBSDisable_label, IOTBSEnable = f.IOTBSEnable, IOTBSEnable_label = f.IOTBSEnable_label, IOTBSTable = f.IOTBSTable, IOTDisable = f.IOTDisable, IOTDisable_label = f.IOTDisable_label, IOTEnable = f.IOTEnable, IOTEnable_label = f.IOTEnable_label, IOTTable = f.IOTTable, IOT_PSK = f.IOT_PSK, IpVersion = f.IpVersion, Networkconfigid = f.Networkconfigid, OnDemandTable = f.OnDemandTable, PDTable = f.PDTable, PDTableStatic = f.PDTableStatic, Pwd_WpaPsk = f.Pwd_WpaPsk, Pwd_WpaPsk_IOT = f.Pwd_WpaPsk_IOT, Sel_AuthMode = f.Sel_AuthMode, Sel_BandWidth = f.Sel_BandWidth, Sel_Channel = f.Sel_Channel, Sel_Encryption = f.Sel_Encryption, Sel_PhyMode = f.Sel_PhyMode, Sel_TxPower = f.Sel_TxPower, Sel_guardInterval = f.Sel_guardInterval, Sky_Apply = f.Sky_Apply, Sky_Cancel = f.Sky_Cancel, Sky_DHCP_Disable = f.Sky_DHCP_Disable, Sky_DHCP_Enable = f.Sky_DHCP_Enable, Sky_DHCP_Mode_Auto = f.Sky_DHCP_Mode_Auto, Sky_DHCP_Mode_Proxy = f.Sky_DHCP_Mode_Proxy, Sky_DHCP_Mode_Static = f.Sky_DHCP_Mode_Static, Sky_DHCP_Relay = f.Sky_DHCP_Relay, Tr_Encryption = f.Tr_Encryption, Tr_WpaPSK = f.Tr_WpaPSK, Txt_SSID = f.Txt_SSID, Txt_SSID_IOT = f.Txt_SSID_IOT, Txt_acsTime = f.Txt_acsTime, UMUMIMO_Enable = f.UMUMIMO_Enable, UMUOFDMA_Enable = f.UMUOFDMA_Enable, WMM_Enable = f.WMM_Enable, briTable = f.briTable, bridgeapply = f.bridgeapply, btn_add = f.btn_add, btn_del = f.btn_del, btn_edit = f.btn_edit, button_apply = f.button_apply, client_num = f.client_num, connMode = f.connMode, d8021 = f.d8021, defGW = f.defGW, default_route = f.default_route, default_routev6 = f.default_routev6, defaultroute = f.defaultroute, defaultroutev6 = f.defaultroutev6, delegatePrefix = f.delegatePrefix, delegatePrefixLen = f.delegatePrefixLen, dhcpEthEnd = f.dhcpEthEnd, dhcpEthStart = f.dhcpEthStart, dhcpLeasedTime = f.dhcpLeasedTime, dhcpMode = f.dhcpMode, dhcpSrvAddr = f.dhcpSrvAddr, dhcpSrvType = f.dhcpSrvType, dhcpSrvType1 = f.dhcpSrvType1, dhcpSrvType2 = f.dhcpSrvType2, dhcpSrvType3 = f.dhcpSrvType3, dhcpstaticContent = f.dhcpstaticContent, dhcpstaticTBody = f.dhcpstaticTBody, dialMode = f.dialMode, dialTable = f.dialTable, dns6Primary = f.dns6Primary, dns6Secondary = f.dns6Secondary, dnsPrimary = f.dnsPrimary, dnsSecondary = f.dnsSecondary, dnsmode = f.dnsmode, dnsmode1 = f.dnsmode1, dnsmode2 = f.dnsmode2, dnsmode3 = f.dnsmode3, dnsv4Satic = f.dnsv4Satic, dnsv6Table = f.dnsv6Table, dnsv6disable = f.dnsv6disable, dnsv6enable = f.dnsv6enable, dnsv6mode = f.dnsv6mode, dsLiteServer = f.dsLiteServer, dsliteManualTable = f.dsliteManualTable, dsliteMode = f.dsliteMode, dsliteModeAuto = f.dsliteModeAuto, dsliteModeManual = f.dsliteModeManual, dsliteTable = f.dsliteTable, enable = f.enable, enbl6RD = f.enbl6RD, enblDSLite = f.enblDSLite, enblIANA = f.enblIANA, enblPD = f.enblPD, ethIpAddress = f.ethIpAddress, ethSubnetMask = f.ethSubnetMask, firstDns = f.firstDns, fullConeNat = f.fullConeNat, fullapply = f.fullapply, idleTime = f.idleTime, ipAddr = f.ipAddr, ipAddrTable = f.ipAddrTable, ipproto = f.ipproto, ipprotodhcp = f.ipprotodhcp, ipprotopppoe = f.ipprotopppoe, ipprotostatic = f.ipprotostatic, ipv6RDEnableTable = f.ipv6RDEnableTable, ipv6RDMode = f.ipv6RDMode, ipv6RDModeAuto = f.ipv6RDModeAuto, ipv6RDModeManual = f.ipv6RDModeManual, ipv6RDModeTable = f.ipv6RDModeTable, ipv6Table = f.ipv6Table, ipv6rdBrAddr = f.ipv6rdBrAddr, ipv6rdIpv4MaskLen = f.ipv6rdIpv4MaskLen, ipv6rdManualTable = f.ipv6rdManualTable, ipv6rdPrefix = f.ipv6rdPrefix, ipv6rdPrefixLen = f.ipv6rdPrefixLen, ipv6rdTable = f.ipv6rdTable, ipversionmode = f.ipversionmode, lan_port_list = f.lan_port_list, lancfg_StaticipAdd = f.lancfg_StaticipAdd, lancfg_StaticipDel = f.lancfg_StaticipDel, lancfg_dhcpserver = f.lancfg_dhcpserver, maximum_client = f.maximum_client, mtu = f.mtu, multiVID = f.multiVID, nat = f.nat, natEnble = f.natEnble, nattable = f.nattable, netMask = f.netMask, noipv6apply = f.noipv6apply, pdEnable = f.pdEnable, portbindtable = f.portbindtable, pppStaticEndAddress = f.pppStaticEndAddress, pppStaticIPAddress = f.pppStaticIPAddress, pppStaticIPEnableTable = f.pppStaticIPEnableTable, pppStaticIPTable = f.pppStaticIPTable, pppStaticStartAddress = f.pppStaticStartAddress, pppStaticSubnetMask = f.pppStaticSubnetMask, pppoeMode = f.pppoeMode, radio_hide = f.radio_hide, relayInfo = f.relayInfo, rouTable = f.rouTable, secondDns = f.secondDns, selectAll = f.selectAll, seletall = f.seletall, serviceMode = f.serviceMode, span_mtu = f.span_mtu, static6Table = f.static6Table, staticIpAll_Sel = f.staticIpAll_Sel, staticIp_Tbl = f.staticIp_Tbl, staticMode = f.staticMode, uPsd = f.uPsd, userName = f.userName, vlanID = f.vlanID, vlanMode = f.vlanMode, vlanvfg = f.vlanvfg, wanAddress6 = f.wanAddress6, wanAddress6prefix = f.wanAddress6prefix, wanGateway6 = f.wanGateway6, wanform = f.wanform, wanindex = f.wanindex, wantittleinfo = f.wantittleinfo;
if(true)
{if(enblPD.checked)
{dhcp6cForPd=1;}
else
{dhcp6cForPd=0;}
if(enblIANA.value==1)
{dhcp6cForAddr=1;}
else
{dhcp6cForAddr=3;}
if(apply_data.networktype!="static")
{apply_data.dnsv6src=1;}
apply_data.peer_dnsv6=0;apply_data.peer_staticdns1v6="2001:4860:4860::8888"
apply_data.peer_staticdns2v6="2001:4860:4860::8844"
apply_data.prefixsrc=dhcp6cForPd;apply_data.guasrc=dhcp6cForAddr;}
return 1;}
function saveDefaultroute()
{var f = document.forms[0];
var Box_TxPower = f.Box_TxPower, Chk_HideEnable = f.Chk_HideEnable, Chk_RadioEnable = f.Chk_RadioEnable, Chk_SsidEnable = f.Chk_SsidEnable, Control_Enable = f.Control_Enable, DMUMIMO_Enable = f.DMUMIMO_Enable, DMUOFDMA_Enable = f.DMUOFDMA_Enable, DSLiteEnable = f.DSLiteEnable, DSLiteEnableTable = f.DSLiteEnableTable, DSLiteModeTable = f.DSLiteModeTable, Defaultroute = f.Defaultroute, Defaultroutev6 = f.Defaultroutev6, Enable = f.Enable, EnableStaticIp = f.EnableStaticIp, IANATable = f.IANATable, IOT = f.IOT, IOTBS = f.IOTBS, IOTBSDisable = f.IOTBSDisable, IOTBSDisable_label = f.IOTBSDisable_label, IOTBSEnable = f.IOTBSEnable, IOTBSEnable_label = f.IOTBSEnable_label, IOTBSTable = f.IOTBSTable, IOTDisable = f.IOTDisable, IOTDisable_label = f.IOTDisable_label, IOTEnable = f.IOTEnable, IOTEnable_label = f.IOTEnable_label, IOTTable = f.IOTTable, IOT_PSK = f.IOT_PSK, IpVersion = f.IpVersion, Networkconfigid = f.Networkconfigid, OnDemandTable = f.OnDemandTable, PDTable = f.PDTable, PDTableStatic = f.PDTableStatic, Pwd_WpaPsk = f.Pwd_WpaPsk, Pwd_WpaPsk_IOT = f.Pwd_WpaPsk_IOT, Sel_AuthMode = f.Sel_AuthMode, Sel_BandWidth = f.Sel_BandWidth, Sel_Channel = f.Sel_Channel, Sel_Encryption = f.Sel_Encryption, Sel_PhyMode = f.Sel_PhyMode, Sel_TxPower = f.Sel_TxPower, Sel_guardInterval = f.Sel_guardInterval, Sky_Apply = f.Sky_Apply, Sky_Cancel = f.Sky_Cancel, Sky_DHCP_Disable = f.Sky_DHCP_Disable, Sky_DHCP_Enable = f.Sky_DHCP_Enable, Sky_DHCP_Mode_Auto = f.Sky_DHCP_Mode_Auto, Sky_DHCP_Mode_Proxy = f.Sky_DHCP_Mode_Proxy, Sky_DHCP_Mode_Static = f.Sky_DHCP_Mode_Static, Sky_DHCP_Relay = f.Sky_DHCP_Relay, Tr_Encryption = f.Tr_Encryption, Tr_WpaPSK = f.Tr_WpaPSK, Txt_SSID = f.Txt_SSID, Txt_SSID_IOT = f.Txt_SSID_IOT, Txt_acsTime = f.Txt_acsTime, UMUMIMO_Enable = f.UMUMIMO_Enable, UMUOFDMA_Enable = f.UMUOFDMA_Enable, WMM_Enable = f.WMM_Enable, briTable = f.briTable, bridgeapply = f.bridgeapply, btn_add = f.btn_add, btn_del = f.btn_del, btn_edit = f.btn_edit, button_apply = f.button_apply, client_num = f.client_num, connMode = f.connMode, d8021 = f.d8021, defGW = f.defGW, default_route = f.default_route, default_routev6 = f.default_routev6, defaultroute = f.defaultroute, defaultroutev6 = f.defaultroutev6, delegatePrefix = f.delegatePrefix, delegatePrefixLen = f.delegatePrefixLen, dhcpEthEnd = f.dhcpEthEnd, dhcpEthStart = f.dhcpEthStart, dhcpLeasedTime = f.dhcpLeasedTime, dhcpMode = f.dhcpMode, dhcpSrvAddr = f.dhcpSrvAddr, dhcpSrvType = f.dhcpSrvType, dhcpSrvType1 = f.dhcpSrvType1, dhcpSrvType2 = f.dhcpSrvType2, dhcpSrvType3 = f.dhcpSrvType3, dhcpstaticContent = f.dhcpstaticContent, dhcpstaticTBody = f.dhcpstaticTBody, dialMode = f.dialMode, dialTable = f.dialTable, dns6Primary = f.dns6Primary, dns6Secondary = f.dns6Secondary, dnsPrimary = f.dnsPrimary, dnsSecondary = f.dnsSecondary, dnsmode = f.dnsmode, dnsmode1 = f.dnsmode1, dnsmode2 = f.dnsmode2, dnsmode3 = f.dnsmode3, dnsv4Satic = f.dnsv4Satic, dnsv6Table = f.dnsv6Table, dnsv6disable = f.dnsv6disable, dnsv6enable = f.dnsv6enable, dnsv6mode = f.dnsv6mode, dsLiteServer = f.dsLiteServer, dsliteManualTable = f.dsliteManualTable, dsliteMode = f.dsliteMode, dsliteModeAuto = f.dsliteModeAuto, dsliteModeManual = f.dsliteModeManual, dsliteTable = f.dsliteTable, enable = f.enable, enbl6RD = f.enbl6RD, enblDSLite = f.enblDSLite, enblIANA = f.enblIANA, enblPD = f.enblPD, ethIpAddress = f.ethIpAddress, ethSubnetMask = f.ethSubnetMask, firstDns = f.firstDns, fullConeNat = f.fullConeNat, fullapply = f.fullapply, idleTime = f.idleTime, ipAddr = f.ipAddr, ipAddrTable = f.ipAddrTable, ipproto = f.ipproto, ipprotodhcp = f.ipprotodhcp, ipprotopppoe = f.ipprotopppoe, ipprotostatic = f.ipprotostatic, ipv6RDEnableTable = f.ipv6RDEnableTable, ipv6RDMode = f.ipv6RDMode, ipv6RDModeAuto = f.ipv6RDModeAuto, ipv6RDModeManual = f.ipv6RDModeManual, ipv6RDModeTable = f.ipv6RDModeTable, ipv6Table = f.ipv6Table, ipv6rdBrAddr = f.ipv6rdBrAddr, ipv6rdIpv4MaskLen = f.ipv6rdIpv4MaskLen, ipv6rdManualTable = f.ipv6rdManualTable, ipv6rdPrefix = f.ipv6rdPrefix, ipv6rdPrefixLen = f.ipv6rdPrefixLen, ipv6rdTable = f.ipv6rdTable, ipversionmode = f.ipversionmode, lan_port_list = f.lan_port_list, lancfg_StaticipAdd = f.lancfg_StaticipAdd, lancfg_StaticipDel = f.lancfg_StaticipDel, lancfg_dhcpserver = f.lancfg_dhcpserver, maximum_client = f.maximum_client, mtu = f.mtu, multiVID = f.multiVID, nat = f.nat, natEnble = f.natEnble, nattable = f.nattable, netMask = f.netMask, noipv6apply = f.noipv6apply, pdEnable = f.pdEnable, portbindtable = f.portbindtable, pppStaticEndAddress = f.pppStaticEndAddress, pppStaticIPAddress = f.pppStaticIPAddress, pppStaticIPEnableTable = f.pppStaticIPEnableTable, pppStaticIPTable = f.pppStaticIPTable, pppStaticStartAddress = f.pppStaticStartAddress, pppStaticSubnetMask = f.pppStaticSubnetMask, pppoeMode = f.pppoeMode, radio_hide = f.radio_hide, relayInfo = f.relayInfo, rouTable = f.rouTable, secondDns = f.secondDns, selectAll = f.selectAll, seletall = f.seletall, serviceMode = f.serviceMode, span_mtu = f.span_mtu, static6Table = f.static6Table, staticIpAll_Sel = f.staticIpAll_Sel, staticIp_Tbl = f.staticIp_Tbl, staticMode = f.staticMode, uPsd = f.uPsd, userName = f.userName, vlanID = f.vlanID, vlanMode = f.vlanMode, vlanvfg = f.vlanvfg, wanAddress6 = f.wanAddress6, wanAddress6prefix = f.wanAddress6prefix, wanGateway6 = f.wanGateway6, wanform = f.wanform, wanindex = f.wanindex, wantittleinfo = f.wantittleinfo;
if(true)
{if(defaultroute.checked==true)
{apply_data.is_defaultroute=1;}
else
{apply_data.is_defaultroute=0;}
return true;}}
function saveDefaultroutev6()
{var f = document.forms[0];
var Box_TxPower = f.Box_TxPower, Chk_HideEnable = f.Chk_HideEnable, Chk_RadioEnable = f.Chk_RadioEnable, Chk_SsidEnable = f.Chk_SsidEnable, Control_Enable = f.Control_Enable, DMUMIMO_Enable = f.DMUMIMO_Enable, DMUOFDMA_Enable = f.DMUOFDMA_Enable, DSLiteEnable = f.DSLiteEnable, DSLiteEnableTable = f.DSLiteEnableTable, DSLiteModeTable = f.DSLiteModeTable, Defaultroute = f.Defaultroute, Defaultroutev6 = f.Defaultroutev6, Enable = f.Enable, EnableStaticIp = f.EnableStaticIp, IANATable = f.IANATable, IOT = f.IOT, IOTBS = f.IOTBS, IOTBSDisable = f.IOTBSDisable, IOTBSDisable_label = f.IOTBSDisable_label, IOTBSEnable = f.IOTBSEnable, IOTBSEnable_label = f.IOTBSEnable_label, IOTBSTable = f.IOTBSTable, IOTDisable = f.IOTDisable, IOTDisable_label = f.IOTDisable_label, IOTEnable = f.IOTEnable, IOTEnable_label = f.IOTEnable_label, IOTTable = f.IOTTable, IOT_PSK = f.IOT_PSK, IpVersion = f.IpVersion, Networkconfigid = f.Networkconfigid, OnDemandTable = f.OnDemandTable, PDTable = f.PDTable, PDTableStatic = f.PDTableStatic, Pwd_WpaPsk = f.Pwd_WpaPsk, Pwd_WpaPsk_IOT = f.Pwd_WpaPsk_IOT, Sel_AuthMode = f.Sel_AuthMode, Sel_BandWidth = f.Sel_BandWidth, Sel_Channel = f.Sel_Channel, Sel_Encryption = f.Sel_Encryption, Sel_PhyMode = f.Sel_PhyMode, Sel_TxPower = f.Sel_TxPower, Sel_guardInterval = f.Sel_guardInterval, Sky_Apply = f.Sky_Apply, Sky_Cancel = f.Sky_Cancel, Sky_DHCP_Disable = f.Sky_DHCP_Disable, Sky_DHCP_Enable = f.Sky_DHCP_Enable, Sky_DHCP_Mode_Auto = f.Sky_DHCP_Mode_Auto, Sky_DHCP_Mode_Proxy = f.Sky_DHCP_Mode_Proxy, Sky_DHCP_Mode_Static = f.Sky_DHCP_Mode_Static, Sky_DHCP_Relay = f.Sky_DHCP_Relay, Tr_Encryption = f.Tr_Encryption, Tr_WpaPSK = f.Tr_WpaPSK, Txt_SSID = f.Txt_SSID, Txt_SSID_IOT = f.Txt_SSID_IOT, Txt_acsTime = f.Txt_acsTime, UMUMIMO_Enable = f.UMUMIMO_Enable, UMUOFDMA_Enable = f.UMUOFDMA_Enable, WMM_Enable = f.WMM_Enable, briTable = f.briTable, bridgeapply = f.bridgeapply, btn_add = f.btn_add, btn_del = f.btn_del, btn_edit = f.btn_edit, button_apply = f.button_apply, client_num = f.client_num, connMode = f.connMode, d8021 = f.d8021, defGW = f.defGW, default_route = f.default_route, default_routev6 = f.default_routev6, defaultroute = f.defaultroute, defaultroutev6 = f.defaultroutev6, delegatePrefix = f.delegatePrefix, delegatePrefixLen = f.delegatePrefixLen, dhcpEthEnd = f.dhcpEthEnd, dhcpEthStart = f.dhcpEthStart, dhcpLeasedTime = f.dhcpLeasedTime, dhcpMode = f.dhcpMode, dhcpSrvAddr = f.dhcpSrvAddr, dhcpSrvType = f.dhcpSrvType, dhcpSrvType1 = f.dhcpSrvType1, dhcpSrvType2 = f.dhcpSrvType2, dhcpSrvType3 = f.dhcpSrvType3, dhcpstaticContent = f.dhcpstaticContent, dhcpstaticTBody = f.dhcpstaticTBody, dialMode = f.dialMode, dialTable = f.dialTable, dns6Primary = f.dns6Primary, dns6Secondary = f.dns6Secondary, dnsPrimary = f.dnsPrimary, dnsSecondary = f.dnsSecondary, dnsmode = f.dnsmode, dnsmode1 = f.dnsmode1, dnsmode2 = f.dnsmode2, dnsmode3 = f.dnsmode3, dnsv4Satic = f.dnsv4Satic, dnsv6Table = f.dnsv6Table, dnsv6disable = f.dnsv6disable, dnsv6enable = f.dnsv6enable, dnsv6mode = f.dnsv6mode, dsLiteServer = f.dsLiteServer, dsliteManualTable = f.dsliteManualTable, dsliteMode = f.dsliteMode, dsliteModeAuto = f.dsliteModeAuto, dsliteModeManual = f.dsliteModeManual, dsliteTable = f.dsliteTable, enable = f.enable, enbl6RD = f.enbl6RD, enblDSLite = f.enblDSLite, enblIANA = f.enblIANA, enblPD = f.enblPD, ethIpAddress = f.ethIpAddress, ethSubnetMask = f.ethSubnetMask, firstDns = f.firstDns, fullConeNat = f.fullConeNat, fullapply = f.fullapply, idleTime = f.idleTime, ipAddr = f.ipAddr, ipAddrTable = f.ipAddrTable, ipproto = f.ipproto, ipprotodhcp = f.ipprotodhcp, ipprotopppoe = f.ipprotopppoe, ipprotostatic = f.ipprotostatic, ipv6RDEnableTable = f.ipv6RDEnableTable, ipv6RDMode = f.ipv6RDMode, ipv6RDModeAuto = f.ipv6RDModeAuto, ipv6RDModeManual = f.ipv6RDModeManual, ipv6RDModeTable = f.ipv6RDModeTable, ipv6Table = f.ipv6Table, ipv6rdBrAddr = f.ipv6rdBrAddr, ipv6rdIpv4MaskLen = f.ipv6rdIpv4MaskLen, ipv6rdManualTable = f.ipv6rdManualTable, ipv6rdPrefix = f.ipv6rdPrefix, ipv6rdPrefixLen = f.ipv6rdPrefixLen, ipv6rdTable = f.ipv6rdTable, ipversionmode = f.ipversionmode, lan_port_list = f.lan_port_list, lancfg_StaticipAdd = f.lancfg_StaticipAdd, lancfg_StaticipDel = f.lancfg_StaticipDel, lancfg_dhcpserver = f.lancfg_dhcpserver, maximum_client = f.maximum_client, mtu = f.mtu, multiVID = f.multiVID, nat = f.nat, natEnble = f.natEnble, nattable = f.nattable, netMask = f.netMask, noipv6apply = f.noipv6apply, pdEnable = f.pdEnable, portbindtable = f.portbindtable, pppStaticEndAddress = f.pppStaticEndAddress, pppStaticIPAddress = f.pppStaticIPAddress, pppStaticIPEnableTable = f.pppStaticIPEnableTable, pppStaticIPTable = f.pppStaticIPTable, pppStaticStartAddress = f.pppStaticStartAddress, pppStaticSubnetMask = f.pppStaticSubnetMask, pppoeMode = f.pppoeMode, radio_hide = f.radio_hide, relayInfo = f.relayInfo, rouTable = f.rouTable, secondDns = f.secondDns, selectAll = f.selectAll, seletall = f.seletall, serviceMode = f.serviceMode, span_mtu = f.span_mtu, static6Table = f.static6Table, staticIpAll_Sel = f.staticIpAll_Sel, staticIp_Tbl = f.staticIp_Tbl, staticMode = f.staticMode, uPsd = f.uPsd, userName = f.userName, vlanID = f.vlanID, vlanMode = f.vlanMode, vlanvfg = f.vlanvfg, wanAddress6 = f.wanAddress6, wanAddress6prefix = f.wanAddress6prefix, wanGateway6 = f.wanGateway6, wanform = f.wanform, wanindex = f.wanindex, wantittleinfo = f.wantittleinfo;
if(true)
{if(defaultroutev6.checked==true)
{apply_data.is_defaultroute_v6=1;}
else
{apply_data.is_defaultroute_v6=0;}
return true;}}
function btnSave()
{var ubusparam=new Array();var jsonparam={};apply_data={};var f = document.forms[0];
var Box_TxPower = f.Box_TxPower, Chk_HideEnable = f.Chk_HideEnable, Chk_RadioEnable = f.Chk_RadioEnable, Chk_SsidEnable = f.Chk_SsidEnable, Control_Enable = f.Control_Enable, DMUMIMO_Enable = f.DMUMIMO_Enable, DMUOFDMA_Enable = f.DMUOFDMA_Enable, DSLiteEnable = f.DSLiteEnable, DSLiteEnableTable = f.DSLiteEnableTable, DSLiteModeTable = f.DSLiteModeTable, Defaultroute = f.Defaultroute, Defaultroutev6 = f.Defaultroutev6, Enable = f.Enable, EnableStaticIp = f.EnableStaticIp, IANATable = f.IANATable, IOT = f.IOT, IOTBS = f.IOTBS, IOTBSDisable = f.IOTBSDisable, IOTBSDisable_label = f.IOTBSDisable_label, IOTBSEnable = f.IOTBSEnable, IOTBSEnable_label = f.IOTBSEnable_label, IOTBSTable = f.IOTBSTable, IOTDisable = f.IOTDisable, IOTDisable_label = f.IOTDisable_label, IOTEnable = f.IOTEnable, IOTEnable_label = f.IOTEnable_label, IOTTable = f.IOTTable, IOT_PSK = f.IOT_PSK, IpVersion = f.IpVersion, Networkconfigid = f.Networkconfigid, OnDemandTable = f.OnDemandTable, PDTable = f.PDTable, PDTableStatic = f.PDTableStatic, Pwd_WpaPsk = f.Pwd_WpaPsk, Pwd_WpaPsk_IOT = f.Pwd_WpaPsk_IOT, Sel_AuthMode = f.Sel_AuthMode, Sel_BandWidth = f.Sel_BandWidth, Sel_Channel = f.Sel_Channel, Sel_Encryption = f.Sel_Encryption, Sel_PhyMode = f.Sel_PhyMode, Sel_TxPower = f.Sel_TxPower, Sel_guardInterval = f.Sel_guardInterval, Sky_Apply = f.Sky_Apply, Sky_Cancel = f.Sky_Cancel, Sky_DHCP_Disable = f.Sky_DHCP_Disable, Sky_DHCP_Enable = f.Sky_DHCP_Enable, Sky_DHCP_Mode_Auto = f.Sky_DHCP_Mode_Auto, Sky_DHCP_Mode_Proxy = f.Sky_DHCP_Mode_Proxy, Sky_DHCP_Mode_Static = f.Sky_DHCP_Mode_Static, Sky_DHCP_Relay = f.Sky_DHCP_Relay, Tr_Encryption = f.Tr_Encryption, Tr_WpaPSK = f.Tr_WpaPSK, Txt_SSID = f.Txt_SSID, Txt_SSID_IOT = f.Txt_SSID_IOT, Txt_acsTime = f.Txt_acsTime, UMUMIMO_Enable = f.UMUMIMO_Enable, UMUOFDMA_Enable = f.UMUOFDMA_Enable, WMM_Enable = f.WMM_Enable, briTable = f.briTable, bridgeapply = f.bridgeapply, btn_add = f.btn_add, btn_del = f.btn_del, btn_edit = f.btn_edit, button_apply = f.button_apply, client_num = f.client_num, connMode = f.connMode, d8021 = f.d8021, defGW = f.defGW, default_route = f.default_route, default_routev6 = f.default_routev6, defaultroute = f.defaultroute, defaultroutev6 = f.defaultroutev6, delegatePrefix = f.delegatePrefix, delegatePrefixLen = f.delegatePrefixLen, dhcpEthEnd = f.dhcpEthEnd, dhcpEthStart = f.dhcpEthStart, dhcpLeasedTime = f.dhcpLeasedTime, dhcpMode = f.dhcpMode, dhcpSrvAddr = f.dhcpSrvAddr, dhcpSrvType = f.dhcpSrvType, dhcpSrvType1 = f.dhcpSrvType1, dhcpSrvType2 = f.dhcpSrvType2, dhcpSrvType3 = f.dhcpSrvType3, dhcpstaticContent = f.dhcpstaticContent, dhcpstaticTBody = f.dhcpstaticTBody, dialMode = f.dialMode, dialTable = f.dialTable, dns6Primary = f.dns6Primary, dns6Secondary = f.dns6Secondary, dnsPrimary = f.dnsPrimary, dnsSecondary = f.dnsSecondary, dnsmode = f.dnsmode, dnsmode1 = f.dnsmode1, dnsmode2 = f.dnsmode2, dnsmode3 = f.dnsmode3, dnsv4Satic = f.dnsv4Satic, dnsv6Table = f.dnsv6Table, dnsv6disable = f.dnsv6disable, dnsv6enable = f.dnsv6enable, dnsv6mode = f.dnsv6mode, dsLiteServer = f.dsLiteServer, dsliteManualTable = f.dsliteManualTable, dsliteMode = f.dsliteMode, dsliteModeAuto = f.dsliteModeAuto, dsliteModeManual = f.dsliteModeManual, dsliteTable = f.dsliteTable, enable = f.enable, enbl6RD = f.enbl6RD, enblDSLite = f.enblDSLite, enblIANA = f.enblIANA, enblPD = f.enblPD, ethIpAddress = f.ethIpAddress, ethSubnetMask = f.ethSubnetMask, firstDns = f.firstDns, fullConeNat = f.fullConeNat, fullapply = f.fullapply, idleTime = f.idleTime, ipAddr = f.ipAddr, ipAddrTable = f.ipAddrTable, ipproto = f.ipproto, ipprotodhcp = f.ipprotodhcp, ipprotopppoe = f.ipprotopppoe, ipprotostatic = f.ipprotostatic, ipv6RDEnableTable = f.ipv6RDEnableTable, ipv6RDMode = f.ipv6RDMode, ipv6RDModeAuto = f.ipv6RDModeAuto, ipv6RDModeManual = f.ipv6RDModeManual, ipv6RDModeTable = f.ipv6RDModeTable, ipv6Table = f.ipv6Table, ipv6rdBrAddr = f.ipv6rdBrAddr, ipv6rdIpv4MaskLen = f.ipv6rdIpv4MaskLen, ipv6rdManualTable = f.ipv6rdManualTable, ipv6rdPrefix = f.ipv6rdPrefix, ipv6rdPrefixLen = f.ipv6rdPrefixLen, ipv6rdTable = f.ipv6rdTable, ipversionmode = f.ipversionmode, lan_port_list = f.lan_port_list, lancfg_StaticipAdd = f.lancfg_StaticipAdd, lancfg_StaticipDel = f.lancfg_StaticipDel, lancfg_dhcpserver = f.lancfg_dhcpserver, maximum_client = f.maximum_client, mtu = f.mtu, multiVID = f.multiVID, nat = f.nat, natEnble = f.natEnble, nattable = f.nattable, netMask = f.netMask, noipv6apply = f.noipv6apply, pdEnable = f.pdEnable, portbindtable = f.portbindtable, pppStaticEndAddress = f.pppStaticEndAddress, pppStaticIPAddress = f.pppStaticIPAddress, pppStaticIPEnableTable = f.pppStaticIPEnableTable, pppStaticIPTable = f.pppStaticIPTable, pppStaticStartAddress = f.pppStaticStartAddress, pppStaticSubnetMask = f.pppStaticSubnetMask, pppoeMode = f.pppoeMode, radio_hide = f.radio_hide, relayInfo = f.relayInfo, rouTable = f.rouTable, secondDns = f.secondDns, selectAll = f.selectAll, seletall = f.seletall, serviceMode = f.serviceMode, span_mtu = f.span_mtu, static6Table = f.static6Table, staticIpAll_Sel = f.staticIpAll_Sel, staticIp_Tbl = f.staticIp_Tbl, staticMode = f.staticMode, uPsd = f.uPsd, userName = f.userName, vlanID = f.vlanID, vlanMode = f.vlanMode, vlanvfg = f.vlanvfg, wanAddress6 = f.wanAddress6, wanAddress6prefix = f.wanAddress6prefix, wanGateway6 = f.wanGateway6, wanform = f.wanform, wanindex = f.wanindex, wantittleinfo = f.wantittleinfo;
if(true)
{if(enable.checked==true){apply_data.enable=1;}else{apply_data.enable=0;}
if(!saveMtu()||!saveServMode()||!saveBindPort()||!saveNat()||!saveVlan())
{return;}
if(!savePppParam()||!saveStaticIpAddr()||!saveStaticIpv6Addr())
{return;}
saveIpVersion();if(!saveConnType())
{return;}
if(connMode.value!="bridge"&&$('input:radio[name="ipproto"]:checked').val()!="static"&&(IpVersion.value==1||IpVersion.value==2))
{if(!saveIpv6Param())
{return;}}
if(connMode.value!="bridge"){if(IpVersion.value==1){if(saveDslite()){return;}}
else if(IpVersion.value==0){if(saveIpv6rd()){return;}}
if(apply_data.servicelist==8||apply_data.servicelist==5||apply_data.servicelist==7||apply_data.servicelist==2){if(IpVersion.value==0||IpVersion.value==2){if(!saveDefaultroute()){return;}}
if(IpVersion.value==1||IpVersion.value==2){if(!saveDefaultroutev6()){return;}}}}}
if(ft_passthrough_bridge==='1'){var utag_bridge_num=0;var same_vlan_route_wan=false;if(apply_data.networktype=="bridge"&&apply_data.vlanmode==1)
{var vlan_array=[];for(var i=0;i<WanConnJson.length;i++)
{if(WanConnJson[i].networktype=="bridge"&&WanConnJson[i].vlanmode==1)
utag_bridge_num++;}
for(var i=0;i<WanConnJson.length;i++)
{for(j=0;j<vlan_array.length;j++)
{if(WanConnJson[i].vlanid==vlan_array[j]){same_vlan_route_wan=true;break;}}
vlan_array[i]=WanConnJson[i].vlanid;}
if(same_vlan_route_wan&&!utag_bridge_num){warninfo_show(_("wancfg_vlan_exist_on_add_utag_bridge_error"));return;}}}
if(actionapply=="add")
{ubusparam=new Array("gwweb.wancfg","add_WanConnection_encrypt",apply_data);}
else if(actionapply=="edit")
{apply_data.index=parseInt(selindex);ubusparam=new Array("gwweb.wancfg","setWanCfg_encrypt",apply_data);}
else
{return;}
jsonparam={"id":1,"params":ubusparam};sk_auth_apply(jsonparam,function(result){pageLoad();});}
function btnCancel()
{pageLoad();}
function selectAll(obj)
{var selist=$("input[name='rml']");if(selist.length==0)
return;for(i=0;i<selist.length;i++){if($(obj).is(':checked'))
selist[i].checked=true;else
selist[i].checked=false;}
changeSel();}
function changeSel()
{var f = document.forms[0];
var Box_TxPower = f.Box_TxPower, Chk_HideEnable = f.Chk_HideEnable, Chk_RadioEnable = f.Chk_RadioEnable, Chk_SsidEnable = f.Chk_SsidEnable, Control_Enable = f.Control_Enable, DMUMIMO_Enable = f.DMUMIMO_Enable, DMUOFDMA_Enable = f.DMUOFDMA_Enable, DSLiteEnable = f.DSLiteEnable, DSLiteEnableTable = f.DSLiteEnableTable, DSLiteModeTable = f.DSLiteModeTable, Defaultroute = f.Defaultroute, Defaultroutev6 = f.Defaultroutev6, Enable = f.Enable, EnableStaticIp = f.EnableStaticIp, IANATable = f.IANATable, IOT = f.IOT, IOTBS = f.IOTBS, IOTBSDisable = f.IOTBSDisable, IOTBSDisable_label = f.IOTBSDisable_label, IOTBSEnable = f.IOTBSEnable, IOTBSEnable_label = f.IOTBSEnable_label, IOTBSTable = f.IOTBSTable, IOTDisable = f.IOTDisable, IOTDisable_label = f.IOTDisable_label, IOTEnable = f.IOTEnable, IOTEnable_label = f.IOTEnable_label, IOTTable = f.IOTTable, IOT_PSK = f.IOT_PSK, IpVersion = f.IpVersion, Networkconfigid = f.Networkconfigid, OnDemandTable = f.OnDemandTable, PDTable = f.PDTable, PDTableStatic = f.PDTableStatic, Pwd_WpaPsk = f.Pwd_WpaPsk, Pwd_WpaPsk_IOT = f.Pwd_WpaPsk_IOT, Sel_AuthMode = f.Sel_AuthMode, Sel_BandWidth = f.Sel_BandWidth, Sel_Channel = f.Sel_Channel, Sel_Encryption = f.Sel_Encryption, Sel_PhyMode = f.Sel_PhyMode, Sel_TxPower = f.Sel_TxPower, Sel_guardInterval = f.Sel_guardInterval, Sky_Apply = f.Sky_Apply, Sky_Cancel = f.Sky_Cancel, Sky_DHCP_Disable = f.Sky_DHCP_Disable, Sky_DHCP_Enable = f.Sky_DHCP_Enable, Sky_DHCP_Mode_Auto = f.Sky_DHCP_Mode_Auto, Sky_DHCP_Mode_Proxy = f.Sky_DHCP_Mode_Proxy, Sky_DHCP_Mode_Static = f.Sky_DHCP_Mode_Static, Sky_DHCP_Relay = f.Sky_DHCP_Relay, Tr_Encryption = f.Tr_Encryption, Tr_WpaPSK = f.Tr_WpaPSK, Txt_SSID = f.Txt_SSID, Txt_SSID_IOT = f.Txt_SSID_IOT, Txt_acsTime = f.Txt_acsTime, UMUMIMO_Enable = f.UMUMIMO_Enable, UMUOFDMA_Enable = f.UMUOFDMA_Enable, WMM_Enable = f.WMM_Enable, briTable = f.briTable, bridgeapply = f.bridgeapply, btn_add = f.btn_add, btn_del = f.btn_del, btn_edit = f.btn_edit, button_apply = f.button_apply, client_num = f.client_num, connMode = f.connMode, d8021 = f.d8021, defGW = f.defGW, default_route = f.default_route, default_routev6 = f.default_routev6, defaultroute = f.defaultroute, defaultroutev6 = f.defaultroutev6, delegatePrefix = f.delegatePrefix, delegatePrefixLen = f.delegatePrefixLen, dhcpEthEnd = f.dhcpEthEnd, dhcpEthStart = f.dhcpEthStart, dhcpLeasedTime = f.dhcpLeasedTime, dhcpMode = f.dhcpMode, dhcpSrvAddr = f.dhcpSrvAddr, dhcpSrvType = f.dhcpSrvType, dhcpSrvType1 = f.dhcpSrvType1, dhcpSrvType2 = f.dhcpSrvType2, dhcpSrvType3 = f.dhcpSrvType3, dhcpstaticContent = f.dhcpstaticContent, dhcpstaticTBody = f.dhcpstaticTBody, dialMode = f.dialMode, dialTable = f.dialTable, dns6Primary = f.dns6Primary, dns6Secondary = f.dns6Secondary, dnsPrimary = f.dnsPrimary, dnsSecondary = f.dnsSecondary, dnsmode = f.dnsmode, dnsmode1 = f.dnsmode1, dnsmode2 = f.dnsmode2, dnsmode3 = f.dnsmode3, dnsv4Satic = f.dnsv4Satic, dnsv6Table = f.dnsv6Table, dnsv6disable = f.dnsv6disable, dnsv6enable = f.dnsv6enable, dnsv6mode = f.dnsv6mode, dsLiteServer = f.dsLiteServer, dsliteManualTable = f.dsliteManualTable, dsliteMode = f.dsliteMode, dsliteModeAuto = f.dsliteModeAuto, dsliteModeManual = f.dsliteModeManual, dsliteTable = f.dsliteTable, enable = f.enable, enbl6RD = f.enbl6RD, enblDSLite = f.enblDSLite, enblIANA = f.enblIANA, enblPD = f.enblPD, ethIpAddress = f.ethIpAddress, ethSubnetMask = f.ethSubnetMask, firstDns = f.firstDns, fullConeNat = f.fullConeNat, fullapply = f.fullapply, idleTime = f.idleTime, ipAddr = f.ipAddr, ipAddrTable = f.ipAddrTable, ipproto = f.ipproto, ipprotodhcp = f.ipprotodhcp, ipprotopppoe = f.ipprotopppoe, ipprotostatic = f.ipprotostatic, ipv6RDEnableTable = f.ipv6RDEnableTable, ipv6RDMode = f.ipv6RDMode, ipv6RDModeAuto = f.ipv6RDModeAuto, ipv6RDModeManual = f.ipv6RDModeManual, ipv6RDModeTable = f.ipv6RDModeTable, ipv6Table = f.ipv6Table, ipv6rdBrAddr = f.ipv6rdBrAddr, ipv6rdIpv4MaskLen = f.ipv6rdIpv4MaskLen, ipv6rdManualTable = f.ipv6rdManualTable, ipv6rdPrefix = f.ipv6rdPrefix, ipv6rdPrefixLen = f.ipv6rdPrefixLen, ipv6rdTable = f.ipv6rdTable, ipversionmode = f.ipversionmode, lan_port_list = f.lan_port_list, lancfg_StaticipAdd = f.lancfg_StaticipAdd, lancfg_StaticipDel = f.lancfg_StaticipDel, lancfg_dhcpserver = f.lancfg_dhcpserver, maximum_client = f.maximum_client, mtu = f.mtu, multiVID = f.multiVID, nat = f.nat, natEnble = f.natEnble, nattable = f.nattable, netMask = f.netMask, noipv6apply = f.noipv6apply, pdEnable = f.pdEnable, portbindtable = f.portbindtable, pppStaticEndAddress = f.pppStaticEndAddress, pppStaticIPAddress = f.pppStaticIPAddress, pppStaticIPEnableTable = f.pppStaticIPEnableTable, pppStaticIPTable = f.pppStaticIPTable, pppStaticStartAddress = f.pppStaticStartAddress, pppStaticSubnetMask = f.pppStaticSubnetMask, pppoeMode = f.pppoeMode, radio_hide = f.radio_hide, relayInfo = f.relayInfo, rouTable = f.rouTable, secondDns = f.secondDns, selectAll = f.selectAll, seletall = f.seletall, serviceMode = f.serviceMode, span_mtu = f.span_mtu, static6Table = f.static6Table, staticIpAll_Sel = f.staticIpAll_Sel, staticIp_Tbl = f.staticIp_Tbl, staticMode = f.staticMode, uPsd = f.uPsd, userName = f.userName, vlanID = f.vlanID, vlanMode = f.vlanMode, vlanvfg = f.vlanvfg, wanAddress6 = f.wanAddress6, wanAddress6prefix = f.wanAddress6prefix, wanGateway6 = f.wanGateway6, wanform = f.wanform, wanindex = f.wanindex, wantittleinfo = f.wantittleinfo;
if(true)
{var selectnum=0;var selist=$("input[name='rml']");if(selist.length==0||selist.length===undefined)
{seletall.checked=false;btn_edit.disabled=true;btn_del.disabled=true;return;}
else
{for(var i=0;i<selist.length;i++)
{if(selist[i].checked==true)
{selectnum++;}}}
if(selectnum==selist.length)
{seletall.checked=true;}
else
{seletall.checked=false;}
if(selectnum==1)
{btn_edit.disabled=false;}
else
{btn_edit.disabled=true;}
if(selectnum>0)
{btn_del.disabled=false;}
else
{btn_del.disabled=true;}}}
function loadLanPortTable()
{if(lanPortNum==''||lanPortNum=='4')
{return;}
else if(lanPortNum=='3')
{$("#LanTable4").hide();}
else if(lanPortNum=='2')
{$("#LanTable3").hide();$("#LanTable4").hide();}
else if(lanPortNum=='1')
{$("#LanTable2").hide();$("#LanTable3").hide();$("#LanTable4").hide();}}
function checkWanNum()
{var f = document.forms[0];
var Box_TxPower = f.Box_TxPower, Chk_HideEnable = f.Chk_HideEnable, Chk_RadioEnable = f.Chk_RadioEnable, Chk_SsidEnable = f.Chk_SsidEnable, Control_Enable = f.Control_Enable, DMUMIMO_Enable = f.DMUMIMO_Enable, DMUOFDMA_Enable = f.DMUOFDMA_Enable, DSLiteEnable = f.DSLiteEnable, DSLiteEnableTable = f.DSLiteEnableTable, DSLiteModeTable = f.DSLiteModeTable, Defaultroute = f.Defaultroute, Defaultroutev6 = f.Defaultroutev6, Enable = f.Enable, EnableStaticIp = f.EnableStaticIp, IANATable = f.IANATable, IOT = f.IOT, IOTBS = f.IOTBS, IOTBSDisable = f.IOTBSDisable, IOTBSDisable_label = f.IOTBSDisable_label, IOTBSEnable = f.IOTBSEnable, IOTBSEnable_label = f.IOTBSEnable_label, IOTBSTable = f.IOTBSTable, IOTDisable = f.IOTDisable, IOTDisable_label = f.IOTDisable_label, IOTEnable = f.IOTEnable, IOTEnable_label = f.IOTEnable_label, IOTTable = f.IOTTable, IOT_PSK = f.IOT_PSK, IpVersion = f.IpVersion, Networkconfigid = f.Networkconfigid, OnDemandTable = f.OnDemandTable, PDTable = f.PDTable, PDTableStatic = f.PDTableStatic, Pwd_WpaPsk = f.Pwd_WpaPsk, Pwd_WpaPsk_IOT = f.Pwd_WpaPsk_IOT, Sel_AuthMode = f.Sel_AuthMode, Sel_BandWidth = f.Sel_BandWidth, Sel_Channel = f.Sel_Channel, Sel_Encryption = f.Sel_Encryption, Sel_PhyMode = f.Sel_PhyMode, Sel_TxPower = f.Sel_TxPower, Sel_guardInterval = f.Sel_guardInterval, Sky_Apply = f.Sky_Apply, Sky_Cancel = f.Sky_Cancel, Sky_DHCP_Disable = f.Sky_DHCP_Disable, Sky_DHCP_Enable = f.Sky_DHCP_Enable, Sky_DHCP_Mode_Auto = f.Sky_DHCP_Mode_Auto, Sky_DHCP_Mode_Proxy = f.Sky_DHCP_Mode_Proxy, Sky_DHCP_Mode_Static = f.Sky_DHCP_Mode_Static, Sky_DHCP_Relay = f.Sky_DHCP_Relay, Tr_Encryption = f.Tr_Encryption, Tr_WpaPSK = f.Tr_WpaPSK, Txt_SSID = f.Txt_SSID, Txt_SSID_IOT = f.Txt_SSID_IOT, Txt_acsTime = f.Txt_acsTime, UMUMIMO_Enable = f.UMUMIMO_Enable, UMUOFDMA_Enable = f.UMUOFDMA_Enable, WMM_Enable = f.WMM_Enable, briTable = f.briTable, bridgeapply = f.bridgeapply, btn_add = f.btn_add, btn_del = f.btn_del, btn_edit = f.btn_edit, button_apply = f.button_apply, client_num = f.client_num, connMode = f.connMode, d8021 = f.d8021, defGW = f.defGW, default_route = f.default_route, default_routev6 = f.default_routev6, defaultroute = f.defaultroute, defaultroutev6 = f.defaultroutev6, delegatePrefix = f.delegatePrefix, delegatePrefixLen = f.delegatePrefixLen, dhcpEthEnd = f.dhcpEthEnd, dhcpEthStart = f.dhcpEthStart, dhcpLeasedTime = f.dhcpLeasedTime, dhcpMode = f.dhcpMode, dhcpSrvAddr = f.dhcpSrvAddr, dhcpSrvType = f.dhcpSrvType, dhcpSrvType1 = f.dhcpSrvType1, dhcpSrvType2 = f.dhcpSrvType2, dhcpSrvType3 = f.dhcpSrvType3, dhcpstaticContent = f.dhcpstaticContent, dhcpstaticTBody = f.dhcpstaticTBody, dialMode = f.dialMode, dialTable = f.dialTable, dns6Primary = f.dns6Primary, dns6Secondary = f.dns6Secondary, dnsPrimary = f.dnsPrimary, dnsSecondary = f.dnsSecondary, dnsmode = f.dnsmode, dnsmode1 = f.dnsmode1, dnsmode2 = f.dnsmode2, dnsmode3 = f.dnsmode3, dnsv4Satic = f.dnsv4Satic, dnsv6Table = f.dnsv6Table, dnsv6disable = f.dnsv6disable, dnsv6enable = f.dnsv6enable, dnsv6mode = f.dnsv6mode, dsLiteServer = f.dsLiteServer, dsliteManualTable = f.dsliteManualTable, dsliteMode = f.dsliteMode, dsliteModeAuto = f.dsliteModeAuto, dsliteModeManual = f.dsliteModeManual, dsliteTable = f.dsliteTable, enable = f.enable, enbl6RD = f.enbl6RD, enblDSLite = f.enblDSLite, enblIANA = f.enblIANA, enblPD = f.enblPD, ethIpAddress = f.ethIpAddress, ethSubnetMask = f.ethSubnetMask, firstDns = f.firstDns, fullConeNat = f.fullConeNat, fullapply = f.fullapply, idleTime = f.idleTime, ipAddr = f.ipAddr, ipAddrTable = f.ipAddrTable, ipproto = f.ipproto, ipprotodhcp = f.ipprotodhcp, ipprotopppoe = f.ipprotopppoe, ipprotostatic = f.ipprotostatic, ipv6RDEnableTable = f.ipv6RDEnableTable, ipv6RDMode = f.ipv6RDMode, ipv6RDModeAuto = f.ipv6RDModeAuto, ipv6RDModeManual = f.ipv6RDModeManual, ipv6RDModeTable = f.ipv6RDModeTable, ipv6Table = f.ipv6Table, ipv6rdBrAddr = f.ipv6rdBrAddr, ipv6rdIpv4MaskLen = f.ipv6rdIpv4MaskLen, ipv6rdManualTable = f.ipv6rdManualTable, ipv6rdPrefix = f.ipv6rdPrefix, ipv6rdPrefixLen = f.ipv6rdPrefixLen, ipv6rdTable = f.ipv6rdTable, ipversionmode = f.ipversionmode, lan_port_list = f.lan_port_list, lancfg_StaticipAdd = f.lancfg_StaticipAdd, lancfg_StaticipDel = f.lancfg_StaticipDel, lancfg_dhcpserver = f.lancfg_dhcpserver, maximum_client = f.maximum_client, mtu = f.mtu, multiVID = f.multiVID, nat = f.nat, natEnble = f.natEnble, nattable = f.nattable, netMask = f.netMask, noipv6apply = f.noipv6apply, pdEnable = f.pdEnable, portbindtable = f.portbindtable, pppStaticEndAddress = f.pppStaticEndAddress, pppStaticIPAddress = f.pppStaticIPAddress, pppStaticIPEnableTable = f.pppStaticIPEnableTable, pppStaticIPTable = f.pppStaticIPTable, pppStaticStartAddress = f.pppStaticStartAddress, pppStaticSubnetMask = f.pppStaticSubnetMask, pppoeMode = f.pppoeMode, radio_hide = f.radio_hide, relayInfo = f.relayInfo, rouTable = f.rouTable, secondDns = f.secondDns, selectAll = f.selectAll, seletall = f.seletall, serviceMode = f.serviceMode, span_mtu = f.span_mtu, static6Table = f.static6Table, staticIpAll_Sel = f.staticIpAll_Sel, staticIp_Tbl = f.staticIp_Tbl, staticMode = f.staticMode, uPsd = f.uPsd, userName = f.userName, vlanID = f.vlanID, vlanMode = f.vlanMode, vlanvfg = f.vlanvfg, wanAddress6 = f.wanAddress6, wanAddress6prefix = f.wanAddress6prefix, wanGateway6 = f.wanGateway6, wanform = f.wanform, wanindex = f.wanindex, wantittleinfo = f.wantittleinfo;
if(true)
{if(WanConnJson.length>=8)
{btn_add.disabled=true;}
else
{btn_add.disabled=false;}}}
function comboPortListStr(list,num)
{var i=0;var portListHtml="";for(i=0;i<list.length;i++)
{allportlistarry.push(list[i]);if(i==0)
{portListHtml+="<div style='margin-bottom:5px;'>";portListHtml+="<ul>";}
portListHtml+="<li style='margin-right:10px; width:100px;'>";portListHtml+="<label class='skcheckbox-round'>";portListHtml+="<input type='checkbox' name='LanPort' id=LanPort"+(num+i)+" value='"+list[i].ifname+"' hidden/>";portListHtml+="<label for=LanPort"+(num+i)+" id='Lb_LanPort"+(num+i)+"' class='skcheckbox-round-label'>";portListHtml+="</label>";portListHtml+="</label>";portListHtml+="<label class='skcheckbox-text' for=LanPort"+(num+i)+">"+list[i].labelname+" </label>";portListHtml+="</li>";if(i==(list.length-1))
{portListHtml+="</ul>";portListHtml+="</div";}}
return portListHtml}
function showPortList()
{var portListHtml="";var i=0;var portbindListStr="--";var list=[];var num=0;var line=1;$("#lan_port_list").empty();allportlistarry=[];list=portlist.eth;portListHtml+=comboPortListStr(list,num);if(portlist.wlan2g!=undefined)
{list=portlist.wlan2g;num+=portlist.eth.length;portListHtml+=comboPortListStr(list,num);line++;}
if(portlist.wlan5g!=undefined)
{list=portlist.wlan5g;num+=portlist.wlan2g.length;portListHtml+=comboPortListStr(list,num);line++;}
if(portlist.wlan6g!=undefined)
{list=portlist.wlan6g;num+=portlist.wlan5g.length;portListHtml+=comboPortListStr(list,num);line++;}
document.getElementById('portbindtable').style.height=(line*25)+'px';$("#lan_port_list").append(portListHtml);}
function ubusGetCollect()
{var i=0;var ubusparam1=new Array("gwweb.wancfg","getWanCfg",{});var ubusparam2=new Array("gwweb.portinfo","get_lanlist",{});var ubusparam3=new Array("gwweb.pon.sfu","get_onuType",{});var ubusparam4=new Array("rtweb.lancfg","getLanCfg",{});var ubusparam5=new Array("skapi.feature","get",{"feature":"ft_pppoe_static_ip_support"});var jsonparam=[{"id":1,"params":ubusparam1},{"id":2,"params":ubusparam2},{"id":3,"params":ubusparam3},{"id":4,"params":ubusparam4},{"id":5,"params":ubusparam5}];sk_auth_post(jsonparam,function(result){WanConnJson=result[0].result[1].wan;portlist=result[1].result[1];if(result[2].result!=null)
{onuType=result[2].result[1].onuType;if(onuType=="hybrid")
{sfuBindPort=result[2].result[1].hybrid_lan;}
if(onuType=="hybrid"||onuType=="sfu")
for(i=0;i<WanConnJson.length;i++)
{if(WanConnJson[i].index==8)
{WanConnJson.splice(i,1);break;}}}
brlanipaddr=result[3].result[1].ipaddr;brlansubnetmask=result[3].result[1].subnetmask;pppoe_static_ip_support=result[4].result[1].ft_pppoe_static_ip_support;showPortList();showWanEntry();checkWanNum()
editwan();hideElements();});}
function PPPUseStaticIP(){if(parseInt(pppoe_static_ip_support)==1)
{$("#pppStaticIPEnableTable").show();if(EnableStaticIp.checked==true)
{$("#pppStaticIPTable").show();}
else
{$("#pppStaticIPTable").hide();}}
else
{$("#pppStaticIPEnableTable").hide();}}
function selectdnsv6mode()
{var dnsmode=$('input:radio[name="dnsv6mode"]:checked').val();if(dnsmode=='disable')
{$("#dnsv6Table").hide();}
else
{$("#dnsv6Table").show();}}
function hideElements(){$("#wanindex").hide();var divs=document.querySelectorAll('.hidden-div');divs.forEach(function(div){div.style.display='none';});}
function restartwan()
{var ubusparam=new Array();var jsonparam={};apply_data={};apply_data.index=1;ubusparam=new Array("gwweb.wancfg","setWanCfg_encrypt",apply_data);jsonparam={"id":1,"params":ubusparam};sk_auth_apply(jsonparam,function(result){pageLoad();});}
function apply_all()
{BntClick_Apply_wlan();btnSave();lancfg_apply();}