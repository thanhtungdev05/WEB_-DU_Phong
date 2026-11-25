
function pageLoad()
{getWlanAcl();getDeviceList();}
var devlistobj;var AgentMacList="";var index="";var flag="";var WlanACLEnable;var WlanACLode;var WlanACLEntries;function getDeviceList()
{var ubusparam=new Array("rtweb.sta","getStaInfo",{});var jsonparam={"id":1,"params":ubusparam};var mode=0;sk_auth_post(jsonparam,function(result){console.log(result.result[1]);devlistobj=result.result[1]["staDevices"];});}
function showAccessControl(mode)
{setValue("Sel_AccessMode",parseInt(mode));if((mode)==0){document.getElementById("Btn_Add").disabled=true;document.getElementById("Btn_Remove").disabled=true;}
else{document.getElementById("Btn_Add").disabled=false;document.getElementById("Btn_Remove").disabled=false;}}
function isValidDeviceName(value)
{var len=value.length;for(var i=0;i<len;i++){var a=value.charAt(i);if((a.match(/[^\S*$]/ig)!=null)){warninfo_show(_('wlanAccessControl_space'));return-1;}}
if(value==""||value==null){warninfo_show(_('wlanAccessControl_empty'));return-1;}
var len=getByteLen(value);if((len<1)||(len>32)){warninfo_show(_('wlanAccessControl_length'));return-1;}
for(var i=0;i<len;i++){if(value.charAt(i)=='%'||value.charAt(i)=='\\'||value.charAt(i)=='#'||value.charAt(i)=='&'||value.charAt(i)=='\"'||value.charAt(i)=='\''||value.charAt(i)=='+'){warninfo_show(_('wlanAccessControl_invalid'));return-1;}}
return true;}
function getEntryNumber()
{return WlanACLEntries?WlanACLEntries.length:0;}
function cleanMacTable()
{var rownum=getObj("wlanacl_MAC_Table").rows.length-1;for(var row=0;row<rownum;++row){getObj("wlanacl_MAC_Table").deleteRow(rownum-row);}}
function selectAll(obj)
{var selist=document.getElementsByName("rml");if(selist.length=0)
return;for(i=0;i<selist.length;i++){if($(obj).is(':checked'))
selist[i].checked=true;else
selist[i].checked=false;}}
function addline(index)
{var newline=getObj("wlanacl_MAC_Table").insertRow(-1);var newCell;var optionVal;var wlanAclTable=WlanACLEntries[index];{optionVal="<label class='skcheckbox'>";optionVal+="<input type='checkbox' id='rml"+index+"' name='rml' value='"+wlanAclTable["name"]+","+wlanAclTable["mac"]+"' hidden>";optionVal+="<label for='rml"+index+"' class='skcheckbox-label'></label>";optionVal+="</label>";newCell=newline.insertCell(-1);newCell.align="center";newCell.innerHTML=optionVal;newCell=newline.insertCell(-1);newCell.align="center";newCell.innerHTML=wlanAclTable["name"];newCell=newline.insertCell(-1);newCell.align="center";newCell.innerHTML=wlanAclTable["mac"];}}
function showTable()
{var num=getEntryNumber();if(num!=0){for(var i=0;i<num;i++){addline(i);}}else{var newline=getObj("wlanacl_MAC_Table").insertRow(-1);newline.setAttribute("align","center");var objcell=newline.insertCell(-1);objcell.colSpan=3;}}
function getWlanAcl()
{var ubusparam=new Array("rtweb.wifi.acl","getWlanAcl",{});var jsonparam={"id":1,"params":ubusparam};var mode=0;sk_auth_post(jsonparam,function(result){console.log(result.result[1]);WlanACLEnable=result.result[1]["wlanacl"]["enable"];WlanACLMode=result.result[1]["wlanacl"]["mode"];WlanACLEntries=result.result[1]["wlanacl"]["entries"];if(WlanACLEnable==0){mode=0;}else{mode=WlanACLMode+1;}
showAccessControl(mode);cleanMacTable();showTable();});}
function setWlanAcl()
{var ubusparam=new Array("rtweb.wifi.acl","setAclCfg",{"enable":parseInt(WlanACLEnable),"mode":parseInt(WlanACLMode)});var jsonparam={"id":1,"params":ubusparam};sk_auth_apply(jsonparam,function(result){console.log(result.result[1]);});}
function addWlanAcl(newname,newmac)
{var ubusparam=new Array("rtweb.wifi.acl","addAcl",{"name":newname,"mac":newmac});var jsonparam={"id":1,"params":ubusparam};sk_auth_apply(jsonparam,function(result){console.log(result.result[1]);if(result.result[1]["result"]=="0"){setTimeout(getWlanAcl(),300);}});}
function delWlanAcl(delname,delmac)
{var ubusparam=new Array("rtweb.wifi.acl","delAcl",{"name":delname,"mac":delmac});var jsonparam={"id":1,"params":ubusparam};sk_auth_apply(jsonparam,function(result){console.log(result.result[1]);if(result.result[1]["result"]=="0"){setTimeout(getWlanAcl(),300);}});}
function modifyWlanAcl(srcname,srcmac,dstname,dstmac)
{var ubusparam=new Array("rtweb.wifi.acl","modifyAcl",{"srcname":srcname,"srcmac":srcmac,"dstname":dstname,"dstmac":dstmac});var jsonparam={"id":1,"params":ubusparam};sk_auth_apply(jsonparam,function(result){console.log(result.result[1]);if(result.result[1]["result"]=="0"){getObj("wlanacl_MAC_Table").rows[index+1].cells[0].innerHTML=dstname;getObj("wlanacl_MAC_Table").rows[index+1].cells[1].innerHTML=dstmac;WlanACLEntries[index]["name"]=dstname;WlanACLEntries[index]["mac"]=dstmac;}});}
function select_dev(obj)
{if(obj.value=="manulMac"){$("#MacAddr",document).val("");$("#DevName",document).val("");$("#MacAddr",document).attr("disabled",false);}
else{var paramList=obj.value.split(',');$("#MacAddr",document).val(paramList[0]);$("#DevName",document).val(paramList[1]);$("#MacAddr",document).attr("disabled",true);}}
function BtnClick_AccessAddApply(mode)
{var macs="";var device_names="";var macVal=$("#MacAddr",document).val().toUpperCase();var deviceNameVal=$("#DevName",document).val();var ret=isValidDeviceName(deviceNameVal);if(ret==-1){return;}
for(var i=0;i<WlanACLEntries.length;i++){if(WlanACLEntries[i]["mac"]!=""){if(WlanACLEntries[i]["mac"]==macVal){warninfo_show(_('wlanAccessControl_macConflict'));return;}
if(WlanACLEntries[i]["name"]==deviceNameVal){warninfo_show(_('wlanAccessControl_nameConflict'));return;}
if(i==15){warninfo_show(_('wlanAccessControl_macMax'));return;}}}
var ret=isValidMacAddress(macVal);if(ret!=true){warninfo_show(_('wlanAccessControl_macInvalid'));return;}
addWlanAcl(deviceNameVal,macVal);}
function BtnClick_AccessAdd(mode)
{var data={"type":"form","tittle":"Add MAC Address","panelContent":null,"submit":"BtnClick_AccessAddApply"};data.panelContent=new Array();var options=new Array();options.push({"value":"manulMac","name":_('wlanAccessControl_Select')});$.each(devlistobj,function(index,obj){console.log(obj.macAddr+" --link_type is "+obj.type);if(obj.type!=""&&(obj.type==2||obj.type==3)){if(AgentMacList.indexOf(obj.macAddr)==-1){var param=[obj.macAddr,obj.hostname];options.push({"value":param,"name":obj.hostname+" ("+obj.macAddr+")"});}}});data.panelContent.push({"type":"select","id":"userMac","tittle":_('wlanAccessControl_DeviceList'),"value":"","option":options,"onchange":"select_dev"});data.panelContent.push({"type":"text","id":"DevName","tittle":_('wlanAccessControl_devname'),"value":""});data.panelContent.push({"type":"text","id":"MacAddr","tittle":_('wlanAccessControl_mac'),"value":""});panel_show(data);}
function BtnClick_AccessDel(no)
{var macs="";var device_names="";var isChked=0;var i=0;var rml=document.getElementsByName("rml");console.log(typeof(rml));if(typeof(rml)=="undefined")
return;if(typeof(rml.length)=="undefined"){if(rml.checked==true)
{isChked=1;macs+=rml.value.split(',')[0];device_names+=rml.value.split(',')[1];delWlanAcl(macs,device_names);}}
else{for(i=0;i<rml.length;i++){if(rml[i].checked==true){isChked=1;macs=rml[i].value.split(',')[0];device_names=rml[i].value.split(',')[1];delWlanAcl(macs,device_names);}}}
if(isChked==0)
return;}
function BntClick_Apply()
{var mode=getValue("Sel_AccessMode");if(mode==0){WlanACLEnable=0;}else{WlanACLEnable=1;WlanACLMode=mode-1;}
showAccessControl(mode);setWlanAcl();}