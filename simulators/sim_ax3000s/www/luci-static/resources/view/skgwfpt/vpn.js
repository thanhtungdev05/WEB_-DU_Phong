
var VpnConJson={};var actionapply="add";var delist=new Array();var apply_data={};var ipsec_existed=-1;function pageLoad(){contentLoad();}
function contentLoad(){var ubusparam=new Array("gwweb.vpn","get",{});var jsonparam={"id":1,"params":ubusparam};sk_auth_post(jsonparam,function(result){VpnConJson=result.result[1].vpncfg;showVpnEntry();});}
function showVpnEntry()
{var vpnEntry="";var i=0;var vpntype=["PPTP","L2TP","L2TP over IPSec","unknow"];var buttonColor,buttonText;$('#seletall').prop('checked',false);$("#vpn_entry_list").empty();if(VpnConJson.length>0)
{for(i=0;i<VpnConJson.length;i++)
{if(VpnConJson[i]==null)
continue;vpnEntry+="<tr><td>";vpnEntry+="<label class='skcheckbox'>";vpnEntry+=" <input type='checkbox' id='rml"+i+"' name='rml' value='"+VpnConJson[i].index+"' onclick='changeSel(this)' hidden>";vpnEntry+="<label for='rml"+i+"' class='skcheckbox-label'></label>";vpnEntry+="</label>";vpnEntry+="</td>";if(VpnConJson[i].encrypt_mode==1){vpnEntry+="<td>"+vpntype[2]+"</td>";}else{vpnEntry+="<td>"+vpntype[VpnConJson[i].TunnelType<=1?VpnConJson[i].TunnelType:3]+"</td>";}
vpnEntry+="<td>"+VpnConJson[i].TunnelName+"</td>";vpnEntry+="<td>"+VpnConJson[i].TunnelServer+"</td>";if(VpnConJson[i].enable===1){buttonColor='red';buttonText='Disable';}else if(VpnConJson[i].enable===0){buttonColor='green';buttonText='Enable';}
vpnEntry+="<td>"+"<input type='button' id='"+VpnConJson[i].index+"' value='"+buttonText;vpnEntry+="' onclick='vpnaction(this)' style='background-color: "+buttonColor+"; color: white;border: none;";vpnEntry+="border-radius: 2px;cursor: pointer;border: 1px solid #ccc;'"
vpnEntry+="</tr>";if(VpnConJson[i].encrypt_mode==1){ipsec_existed=VpnConJson[i].index;}}
$("#seletall").attr("disabled",false);}
else
{vpnEntry="<tr><td colspan='7'>No data yet...</td></tr>";$("#seletall").attr("disabled",true);}
$("#vpn_entry_list").append(vpnEntry);}
function changeSel()
{var f = document.forms[0];
var L2tpAdvTable = f.L2tpAdvTable, MPPEEnable = f.MPPEEnable, PreShareKey = f.PreShareKey, Sky_Apply = f.Sky_Apply, Sky_Cancel = f.Sky_Cancel, btn_add = f.btn_add, btn_del = f.btn_del, btn_edit = f.btn_edit, ca_div = f.ca_div, enableMPPE = f.enableMPPE, enableVPN = f.enableVPN, enableencrypt = f.enableencrypt, encryptEnable = f.encryptEnable, encryptMode = f.encryptMode, encrypt_table = f.encrypt_table, filename1 = f.filename1, fullapply = f.fullapply, mppe_div = f.mppe_div, privKeyPaswd_upload = f.privKeyPaswd_upload, psk_div = f.psk_div, seletall = f.seletall, serverIpaddr = f.serverIpaddr, serverName = f.serverName, uPsd = f.uPsd, userName = f.userName, vpnEnble = f.vpnEnble, vpnMode = f.vpnMode, vpn_config = f.vpn_config, vpn_info = f.vpn_info, vpntittleinfo = f.vpntittleinfo;
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
function selectAll(obj)
{var selist=$("input[name='rml']");if(selist.length==0)
return;for(i=0;i<selist.length;i++){if($(obj).is(':checked'))
selist[i].checked=true;else
selist[i].checked=false;}
changeSel();}
function vpnaction(obj)
{var ubusparam=new Array();var jsonparam={};apply_data={};apply_data.index=parseInt(obj.id);apply_data.action=obj.value=="Disable"?0:1;ubusparam=new Array("gwweb.vpn","action",apply_data);jsonparam={"id":1,"params":ubusparam};sk_auth_apply(jsonparam,function(result){$("#vpn_config").hide();$("#vpn_info").fadeIn(300);pageLoad();});}
function check_quotation_mark_existed(str)
{return str.includes("'")||str.includes('"');}
function btnSave()
{var ubusparam=new Array();var jsonparam={};var servername;var serveripaddr;var username;var password;var psk;apply_data={};var f = document.forms[0];
var L2tpAdvTable = f.L2tpAdvTable, MPPEEnable = f.MPPEEnable, PreShareKey = f.PreShareKey, Sky_Apply = f.Sky_Apply, Sky_Cancel = f.Sky_Cancel, btn_add = f.btn_add, btn_del = f.btn_del, btn_edit = f.btn_edit, ca_div = f.ca_div, enableMPPE = f.enableMPPE, enableVPN = f.enableVPN, enableencrypt = f.enableencrypt, encryptEnable = f.encryptEnable, encryptMode = f.encryptMode, encrypt_table = f.encrypt_table, filename1 = f.filename1, fullapply = f.fullapply, mppe_div = f.mppe_div, privKeyPaswd_upload = f.privKeyPaswd_upload, psk_div = f.psk_div, seletall = f.seletall, serverIpaddr = f.serverIpaddr, serverName = f.serverName, uPsd = f.uPsd, userName = f.userName, vpnEnble = f.vpnEnble, vpnMode = f.vpnMode, vpn_config = f.vpn_config, vpn_info = f.vpn_info, vpntittleinfo = f.vpntittleinfo;
if(true)
{if(enableVPN.checked==true)
apply_data.enable=1;else
apply_data.enable=0;if(vpnMode.value=="0")
apply_data.type=0;else if(vpnMode.value=="1")
apply_data.type=1;else
warninfo_show(_("vpncfg_Mode")+_("vpncfg_VPNTypeError"));servername=serverName.value;if(servername.length==0)
{warninfo_show(_("vpncfg_ServerName")+_("vpncfg_ServerNameEmptyError"));return;}
else if(serverName.length>64)
{warninfo_show(_("vpncfg_ServerName")+_("vpncfg_ServerNameTooLongError"));return 0;}
if(enableMPPE.checked==true)
apply_data.pptp_mppe=1;else
apply_data.pptp_mppe=0;serveripaddr=serverIpaddr.value;if(serveripaddr.length==0)
{warninfo_show(_("vpncfg_IPAddr")+_("vpncfg_ServerIpAddrEmptyError"));return;}
if(serveripaddr[0]<'0'||serveripaddr[0]>'9')
{if(serveripaddr.indexOf(".")==-1)
{warninfo_show(_("vpncfg_IPAddr")+_("vpncfg_Invalid")+"!");return 0;}
if(serveripaddr.length>32)
{warninfo_show(_("vpncfg_IPAddr")+_("vpncfg_Invalid")+"!");return 0;}}
else
{if(isValidIpAddress(serveripaddr)==false||checkIsSpecialIP(serveripaddr)==true)
{warninfo_show(_("vpncfg_IPAddr")+" "+serveripaddr+" "+_("vpncfg_Invalid")+"!");return 0;}}
username=userName.value;if(username.length==0)
{warninfo_show(_("vpncfg_Username")+_("vpncfg_UserNameEmptyError"));return;}
if(username.length>64)
{warninfo_show(_("vpncfg_Username")+_("vpncfg_UserNameTooLongError"));return;}
if(apply_data.type==1&&check_quotation_mark_existed(username)){warninfo_show(_("vpncfg_Username")+_("vpncfg_Invalid")+"!");return;}
password=uPsd.value;if(password.length==0)
{warninfo_show(_("vpncfg_Uassword")+_("vpncfg_PasswordEmptyError"));return;}
if(password.length>64)
{warninfo_show(_("vpncfg_Uassword")+_("vpncfg_PasswordTooLongError"));return;}
if(apply_data.type==1&&check_quotation_mark_existed(password)){warninfo_show(_("vpncfg_Uassword")+_("vpncfg_Invalid")+"!");return;}
if(enableencrypt.checked==true){psk=PreShareKey.value;if(encryptMode.value=="psk"){if(psk.length==0){warninfo_show(_("vpncfg_PreShareKey")+_("vpncfg_EncryptKeyEmptyError"));return;}
if(psk.length>64){warninfo_show(_("vpncfg_PreShareKey")+_("vpncfg_EncryptKeyTooLongError"));return;}
if(/[\u4e00-\u9fa5]/.test(psk)){warninfo_show(_("vpncfg_PreShareKey")+_("vpncfg_EncryptKeyContainsChineseError"));return;}
if(check_quotation_mark_existed(psk)){warninfo_show(_("vpncfg_PreShareKey")+_("vpncfg_Invalid")+"!");return;}}}}
apply_data.name=servername;apply_data.server=serveripaddr;apply_data.username=username;apply_data.password=getAES(password);if(enableencrypt.checked==true){if(encryptMode.value=="psk"){apply_data.encrypt_mode=1;apply_data.encrypt_key=psk;}else{apply_data.encrypt_mode=2;}}else{apply_data.encrypt_mode=0;}
if(actionapply=="add")
{if(apply_data.encrypt_mode==1&&ipsec_existed!=-1){warninfo_show(_("vpncfg_ipsec_existed!"));return;}
ubusparam=new Array("gwweb.vpn","add",apply_data);}
else if(actionapply=="edit")
{apply_data.index=parseInt(selindex);if(apply_data.encrypt_mode==1&&ipsec_existed!=selindex&&ipsec_existed!=-1){warninfo_show(_("vpncfg_ipsec_existed!"));return;}
ubusparam=new Array("gwweb.vpn","edit",apply_data);}
else
{return;}
jsonparam={"id":1,"params":ubusparam};sk_auth_apply(jsonparam,function(result){$("#vpn_config").hide();$("#vpn_info").fadeIn(300);pageLoad();});}
function btnCancel()
{$("#vpn_config").hide();$("#vpn_info").fadeIn(300);pageLoad();}
function loadVpnCfg(selindex)
{var index=0;for(var i=0;i<VpnConJson.length;i++){if(VpnConJson[i].index==selindex)
index=i;}
if(VpnConJson[index].enable=="1"){$("#enableVPN").prop("checked",true);}else{$("#enableVPN").prop("checked",false);}
$("#vpnMode").val(VpnConJson[index].TunnelType);$("#serverName").val(VpnConJson[index].TunnelName);$("#serverIpaddr").val(VpnConJson[index].TunnelServer);$("#userName").val(VpnConJson[index].Username);$("#uPsd").val(VpnConJson[index].password);if(VpnConJson[index].TunnelType!=0){$("#L2tpAdvTable").fadeIn(300);if(VpnConJson[index].encrypt_mode==1){$("#enableencrypt").prop("checked",true);$("#encrypt_table").fadeIn(300);$("#PreShareKey").val(VpnConJson[index].encrypt_key);}else{$("#encrypt_table").hide();$("#enableencrypt").prop("checked",false);}
$("#mppe_div").hide();$("#enableMPPE").prop("checked",false);}else{$("#L2tpAdvTable").hide();$("#mppe_div").fadeIn(300);if(VpnConJson[index].pptp_mppe=="1"){$("#enableMPPE").prop("checked",true);}else{$("#enableMPPE").prop("checked",false);}}}
function add_vpn()
{actionapply="add";selindex="";$("#vpnMode").val(1);$("#vpntittleinfo").html(_("vpncfg_AddnewVPNinterface"));$("#enableVPN").prop("checked",true);$("#serverName").val("");$("#serverIpaddr").val("");$("#userName").val("");$("#uPsd").val("");$("#L2tpAdvTable").fadeIn(300);$("#enableencrypt").prop("checked",false);$("#encrypt_table").hide();$("#mppe_div").hide();$("#enableMPPE").prop("checked",false);$("#vpn_info").hide();$("#vpn_config").fadeIn(300);}
function edit_vpn()
{var selectnum=0;var connname;var vpntype=["PPTP","L2TP","unknow"];if(VpnConJson.length==0)
return;var selist=$("input[name='rml']");if(selist.length===undefined)
{if(selist.checked==true)
{selectnum=1;selindex=selist.value;connname=vpntype[VpnConJson[0].TunnelType];}}
else
{for(var i=0;i<selist.length;i++){if(selist[i].checked==true)
{selindex=selist[i].value;connname=vpntype[VpnConJson[i].TunnelType];selectnum++;}}}
if(selectnum!=1)
return false;actionapply="edit";loadVpnCfg(parseInt(selindex));$("#vpntittleinfo").html("Edit <i>"+connname+"</i>  configuration");$("#vpn_info").hide();$("#vpn_config").fadeIn(300);}
function del_vpn(index)
{apply_data={};apply_data.index=parseInt(index);if(apply_data.index==ipsec_existed)
ipsec_existed=-1;ubusparam=new Array("gwweb.vpn","delete",apply_data);jsonparam={"id":1,"params":ubusparam};sk_auth_apply(jsonparam,function(result){delist.shift();if(delist.length==0)
{pageLoad();return;}
del_vpn(delist[0]);});}
function removeClick()
{var selist=$("input[name='rml']");if(selist.length===undefined)
{if(selist.checked==true)
{delist.push(selist.value)}}
else
{for(var i=0;i<selist.length;i++){if(selist[i].checked==true)
{delist.push(selist[i].value)}}}
console.log(delist);if(delist.length==0)
return;del_vpn(delist[0]);}
function changeVpnMode(mode)
{if(mode=="1"){$("#L2tpAdvTable").show();}else{$("#L2tpAdvTable").hide();$("#mppe_div").show();$("#enableMPPE").prop("checked",true);}}
function changeVpnencryptMode(mode)
{if(mode=="ca")
{$("#ca_div").show();$("#psk_div").hide();}
else
{$("#ca_div").hide();$("#psk_div").show();}}
function enableEncrypt()
{var mode=$("#enableencrypt").is(':checked');if(mode==false){$("#encrypt_table").hide();}else{$("#encrypt_table").show();}}
function checkIsSpecialIP(ipAddress)
{if(isMulticastAddr(ipAddress)||isreserveaddr(ipAddress)||isLoopbackAddr(ipAddress)||isBroadcastAddr(ipAddress))
{return true;}
return false;}