
var oldlanip;var wan_ip_array=new Array();function ShowDHCPCfg()
{var dhcpmode=parseInt($("input[name='dhcpSrvType']:checked").val());if(dhcpmode==0)
{$("#lancfg_dhcpserver").hide();$("#relayInfo").hide();$("#dhcpstaticTitle").hide();$("#dhcpstaticContent").hide();}
else if(dhcpmode==1)
{dhcpcfg_init(1);$("#lancfg_dhcpserver").show();$("#relayInfo").hide();$("#dhcpstaticTitle").show();$("#dhcpstaticContent").show();}
else
{dhcpcfg_init(2);$("#lancfg_dhcpserver").hide();$("#relayInfo").show();$("#dhcpstaticTitle").hide();$("#dhcpstaticContent").hide();}}
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
wan_ip_array[ip_num]=wan_json[i].ipaddr;ip_num++;}});}
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
{console.log("[SIM] LAN IP changed:", getValue("ethIpAddress"));}
function ftcNotifyPortalSaveLan(ip, mask, dhcpmode, start, end, lease) {
  try {
    var p = (window.parent && window.parent !== window) ? window.parent : ((window.top && window.top !== window) ? window.top : null);
    if (!p) return;
    var lessonKey = "ax3000s_LAB_AX3000S_05";
    if (!p._sessionRuleCache) p._sessionRuleCache = {};
    p._sessionRuleCacheScope = lessonKey;
    p._sessionRuleCache["lan_ip"] = { actualValue: ip, isSaved: true, isMatch: (ip === "192.168.2.1") };
    p._sessionRuleCache["lan_subnet"] = { actualValue: mask, isSaved: true, isMatch: (mask === "255.255.255.0") };
    p._sessionRuleCache["lan_dhcp_enable"] = { actualValue: String(dhcpmode), isSaved: true, isMatch: (dhcpmode == 1) };
    p._sessionRuleCache["lan_dhcp_start"] = { actualValue: start, isSaved: true, isMatch: (start === "192.168.2.2") };
    p._sessionRuleCache["lan_dhcp_end"] = { actualValue: end, isSaved: true, isMatch: (end === "192.168.2.254") };
    p._sessionRuleCache["lan_dhcp_lease"] = { actualValue: String(lease), isSaved: true, isMatch: (lease == 120) };
    p._hasClickedSaveInGuide = true;
    try {
      document._ftcIsSaved = true;
      document._ftcLastSaveInteraction = Date.now();
    } catch(e) {}
    if (typeof p.onSimulatorSave === "function") {
      try { p.onSimulatorSave(window, "lancfgv4"); } catch(e) {}
    }
    try {
      p.postMessage({
        type: "FTC_SAVE_SUCCESS",
        source: "ax3000s_lancfgv4",
        data: { ip: ip, mask: mask, dhcpmode: dhcpmode, start: start, end: end, lease: lease }
      }, "*");
    } catch(e) {}
  } catch(err) {
    console.warn("[AX3000S] ftcNotifyPortalSaveLan error:", err);
  }
}
function lancfg_apply()
{if(lancfgv4_pageCheckValue()==true)
{var dhcpmode=parseInt($("input[name='dhcpSrvType']:checked").val());
var ipVal=getValue("ethIpAddress");var maskVal=getValue("ethSubnetMask");
var startVal=getValue("dhcpEthStart");var endVal=getValue("dhcpEthEnd");
var leaseVal=parseInt(getValue("dhcpLeasedTime"));
ftcNotifyPortalSaveLan(ipVal, maskVal, dhcpmode, startVal, endVal, leaseVal);
loading_show();var dhcpdata={"dhcpmode":dhcpmode};if(dhcpmode==1)
{dhcpdata.startip=startVal;dhcpdata.endip=endVal;dhcpdata.leasetime=leaseVal;dhcpdata.dnsmode=parseInt($("input[name='dnsmode']:checked").val());if(dhcpdata.dnsmode==1)
{dhcpdata.pridns=getValue("dnsPrimary");if(checkNull(getValue("dnsSecondary"))==true)
dhcpdata.secdns=getValue("dnsSecondary");}}
else if(dhcpmode==2)
{dhcpdata.relay=getValue("dhcpSrvAddr");}
var lanparam=new Array("rtweb.lancfg","setLanCfg",{"ipaddr":ipVal,"netmask":maskVal});var dhcpsparam=new Array("rtweb.dhcpserver","set",dhcpdata);if(calcSubNet(oldlanip,maskVal)
!=calcSubNet(ipVal,maskVal))
{var destroyparam=new Array("rtweb.session","destroy",{});var jsonparam=[{"id":1,"params":lanparam},{"id":2,"params":dhcpsparam},{"id":3,"params":destroyparam}];}
else
{var jsonparam=[{"id":1,"params":lanparam},{"id":2,"params":dhcpsparam}];}
sk_auth_post(jsonparam,function(result){ftcNotifyPortalSaveLan(ipVal, maskVal, dhcpmode, startVal, endVal, leaseVal);if(1==result[0].result[1].result){hide_mode();warninfo_show(result[0].result[1].failreason);}else if(2==result[1].result[1].result){hide_mode();warninfo_show(result[1].result[1].failreason);}else
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