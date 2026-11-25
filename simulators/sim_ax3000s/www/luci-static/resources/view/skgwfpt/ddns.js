
var ddns_service_seloptions=new Array();var ddns_interface_seloptions=new Array();var map=new Map();function pageLoad()
{ddns_init_server();ddns_get_wancfg();}
function ddns_start(cfg_name)
{var ubusparam1=new Array("rtweb.ddns","start",{"cfg_name":cfg_name});var jsonparam=[{"id":1,"params":ubusparam1}];var tableNode=document.getElementById("ddns_Body");loading_show();$(".loading p").html("Loading");sk_auth_post(jsonparam,function(result){ddns_get_status_timer();});}
function ddns_stop(cfg_name)
{var ubusparam1=new Array("rtweb.ddns","stop",{"cfg_name":cfg_name});var jsonparam=[{"id":1,"params":ubusparam1}];var tableNode=document.getElementById("ddns_Body");loading_show();$(".loading p").html("Loading");sk_auth_post(jsonparam,function(result){ddns_get_status_timer();});}
function ddns_enable(obj)
{var cfg_name="";cfg_name=$(obj).parent().parent().parent().children().eq(1).html().replace("&amp;","&");if(obj.checked==true){ddns_start(cfg_name)}else{ddns_stop(cfg_name)}
return;}
function ddns_show_cfg(itemValue,index)
{var tableNode=document.getElementById("ddns_Body");var itemStr="";var gui_name=ddns_get_GUI_by_sec(itemValue.interface);console.log("gui_name:"+gui_name);itemStr+="<tr>";itemStr+="<td><label class='skcheckbox'>";itemStr+=" <input type='checkbox' id='ddns_Sel_"+index+"' name='ddns_item' hidden>"
itemStr+="<label for='ddns_Sel_"+index+"' class='skcheckbox-label'></label>";itemStr+="</label></td>";itemStr+="<td style='word-wrap: break-word; max-width: 200px;'>"+itemValue.cfg_name+"</td>";itemStr+="<td>"+itemValue.service_name+"</td>";itemStr+="<td>"+itemValue.domain+"</td>";itemStr+="<td>"+gui_name+"</td>";itemStr+="<td id='ddns_Status_"+index+"' name='ddns_status' >"+"</td>";itemStr+="<td ><label class='skcheckbox'>";itemStr+=" <input type='checkbox' id='ddns_Enabel_"+index+"' name='ddns_enable_item' onClick='ddns_enable(this)' hidden>"
itemStr+="<label for='ddns_Enabel_"+index+"' class='skcheckbox-label'></label>";itemStr+="</label></td>";itemStr+="</tr>";tableNode.innerHTML+=itemStr;}
function ddns_get_cfg()
{var ubusparam1=new Array("rtweb.ddns","getCfg",{});var jsonparam=[{"id":1,"params":ubusparam1}];var tableNode=document.getElementById("ddns_Body");sk_auth_post(jsonparam,function(result){if(result[0].result[1].total!=0){tableNode.innerHTML="";map.clear();for(var i=0;i<result[0].result[1].total;i++){ddns_show_cfg(result[0].result[1].ddns_list[i],i);map.set(result[0].result[1].ddns_list[i].cfg_name,result[0].result[1].ddns_list[i].entry_index);}}else{tableNode.innerHTML="";tableNode.innerHTML="<tr align='center'><td colspan='7'>"+_("No data yet...")+"</td></tr>";}
ddns_get_status();});}
function ddns_edit_status(type)
{document.getElementById("ddns_del_btn").disabled=type;document.getElementById("ddns_add_btn").disabled=type;}
function ddns_get_status()
{var ubusparam1=new Array("luci.ddns","get_services_status",{});var jsonparam={"id":1,"params":ubusparam1};loading_show();$(".loading p").html("Loading");sk_auth_post(jsonparam,function(result){if(result.result.length>1){var tableNode=document.getElementById("ddns_Body");$(tableNode).children().each(function(index,element){var tmp_cfg_index=map.get($(element).children().eq(1).html().replace("&amp;","&"));var node=result.result[1][tmp_cfg_index];if(node!=null){var htm_node=$(this).children().eq(5);var check_node=$(this).children().eq(6).find("input");var status_str="";if(node.pid==0){status_str="Stopped";check_node.prop("checked",false);}else if(node.ip==""){status_str="Updating";check_node.prop("checked",true);}else{status_str="Succeed(IP:"+node.ip+")";check_node.prop("checked",true);}
htm_node.html(status_str);}});}
hide_mode();});}
function ddns_show_status(item){var state="";var tableNode=document.getElementById("ddns_Body");$(tableNode).children().each(function(index,element){if(element.children().eq(1).html()==item.cfg_name){element.children().eq(5).html()=str;}});}
function ddns_save_status(item){}
function ddns_get_status_timer(){return new Promise(resolve=>setTimeout("ddns_get_status();",1000));}
function ddns_get_GUI_by_sec(sec_name){console.log("sec_name:"+sec_name);for(var i=0;i<ddns_interface_seloptions.length;i++){if(sec_name==ddns_interface_seloptions[i].value){return ddns_interface_seloptions[i].name;}}
return"";}
function ddns_init_server(){ddns_service_seloptions=[];ddns_service_seloptions.push({"value":"dyndns.org","name":"dyndns.org"});ddns_service_seloptions.push({"value":"no-ip.com","name":"no-ip.com"});ddns_service_seloptions.push({"value":"cloudflare.com-v4","name":"cloudflare.com-v4"});ddns_service_seloptions.push({"value":"changeip.com","name":"changeip.com"});}
function ddns_get_wancfg(){var ubusparam1=new Array("gwweb.wancfg","status",{});var jsonparam=[{"id":1,"params":ubusparam1}];ddns_interface_seloptions=[];sk_auth_post(jsonparam,function(result){if(result[0].result[1].wan.length>0){for(var loop=0;loop<result[0].result[1].wan.length;loop++){ddns_interface_seloptions.push({"value":result[0].result[1].wan[loop].v4_secname,"name":result[0].result[1].wan[loop].GUIname});}}
ddns_get_cfg();});}
function ddns_addList()
{var data={"type":"form","tittle":_("DDNS_AddNewRule"),"panelContent":null,"submit":"ddns_add_rule"};data.panelContent=new Array();data.panelContent.push({"type":"text","id":"ddns_name","tittle":_("DDNS_Name"),"value":""});data.panelContent.push({"type":"select","id":"ddns_service","tittle":_("DDNS_Service"),"value":"","option":ddns_service_seloptions});data.panelContent.push({"type":"select","id":"ddns_if","tittle":_("DDNS_IF"),"value":"","option":ddns_interface_seloptions});data.panelContent.push({"type":"text","id":"ddns_hostname","tittle":_("DDNS_Hostname"),"value":""});data.panelContent.push({"type":"text","id":"ddns_username","tittle":_("DDNS_Username"),"value":""});data.panelContent.push({"type":"password","id":"ddns_password","tittle":_("DDNS_Password"),"value":""});panel_show(data);}
function ddns_add_rule()
{var data={};data.service_name=$("#ddns_service").val();data.domain=$("#ddns_hostname").val();data.username=$("#ddns_username").val();data.password=$("#ddns_password").val();data.cfg_name=$("#ddns_name").val();data.interface=$("#ddns_if").val();if(ddns_checkNull(data.interface)==false){warninfo_show(_("Warn_IF_Invalid"));$(".warn .close").unbind("click").on("click",function(){$(".warn").remove();});return;}
if(ddns_checkName(data.cfg_name)==false){$(".warn .close").unbind("click").on("click",function(){$(".warn").remove();});return;}
if(ddns_CheckURL(data.domain)==false){$(".warn .close").unbind("click").on("click",function(){$(".warn").remove();});return;}
if(ddns_checkUserName(data.username)==false){$(".warn .close").unbind("click").on("click",function(){$(".warn").remove();});return;}
if(ddns_checkUserPassword(data.password)==false){$(".warn .close").unbind("click").on("click",function(){$(".warn").remove();});return;}
var param=new Array("rtweb.ddns","setCfg",data);var jsonstr={"id":1,"params":param};sk_auth_post(jsonstr,function(result){var resultVal=result.result[1].result;if(resultVal!=0){warninfo_show(_("Repeat Error"));}else{ddns_get_cfg();}});}
function ddns_removeClick()
{var selist=document.getElementsByName("ddns_item");var table=document.getElementById("ddns_Body");var jsonArr=[];var paramId=1;if(selist.length==0)
return;for(var i=0;i<table.rows.length;i++){var row=table.rows[i];if(getChecked("ddns_Sel_"+i)){var cfg_name=row.cells[1].innerText;jsonArr.push({"id":(paramId++),"params":new Array("rtweb.ddns","delCfg",{"cfg_name":cfg_name})});}}
if(paramId==1){return;}
sk_auth_post(jsonArr,function(result){ddns_get_cfg();});}
function ddns_selectAll(obj)
{var selist=document.getElementsByName("ddns_item");if(selist.length=0)
return;for(var i=0;i<selist.length;i++){if(obj.checked)
selist[i].checked=true;else
selist[i].checked=false;}}
function ddns_checkName(str){const name_regex=/^[a-zA-Z0-9!@$%^*()+\-?.#'" /&]+$/;if(str.length>64){warninfo_show("DDNS's name must between in 1 to 64");return false;}
if(name_regex.test(str)==false){warninfo_show(_("Warn_Name_Invalid"));return false;}else{return true;}}
function ddns_checkNull(value)
{if(value==""||value==null)
return false;else
return true;}
function ddns_checkStrLengthRange(value,min,max)
{if(ddns_checkNull(value)==false)
{return-1;}
var len=value.length;if((len<min)||(len>max))
{return-3;}
return true;}
function ddns_CheckURL(url)
{var statu=ddns_checkStrLengthRange(url,1,64);if(statu==-1)
{warninfo_show(_("Warn_Url_Empty"));return false;}
if(statu==-3)
{warninfo_show(_("Warn_Url_too_Long"));return false;}
var field=url.split("://");if(typeof field[1]==='undefined'){var host_field=field[0].split(".");}else{var host_field=field[1].split(".");}
var hostRegex=/^[a-zA-Z0-9-]+$/;if(hostRegex.test(host_field[0])==false){warninfo_show(_("Warn_Url_Invalid"));return false;}else if(host_field[0].charAt(0)=='-'){warninfo_show(_("Warn_Url_Invalid"));return false;}
if(url.match("[^0-9a-zA-Z.:;,!@%#?_/&=+*'$()-]")!=null)
{warninfo_show(_("Warn_Url_Invalid"));return false;}
var strRegex=/((^((http|https)?:\/\/)([\w-]+\.)+[\w-]+(\/[\w- .\/_!@%#?%&=+:*'$()-]*)?$)|(^([\w-]+\.)+[\w-]+(\/[\w- .\/_!@%#?%&=+:*'$()-]*)?$))/;var re=new RegExp(strRegex);if(!re.test(url))
{warninfo_show(_("Warn_Url_Invalid"));return false;}
return true;}
function ddns_checkUserName(username)
{const username_regex=/^[a-zA-Z0-9!@$%^*()+\-?.#'" /&]+$/;if(username_regex.test(username)==false){warninfo_show(_("Warn_UserName_Invalid"));return false;}else{return true;}}
function ddns_checkUserPassword(userpassword)
{const userpwd_regex=/^[a-zA-Z0-9!@$%^*()+\-?.#'" /&]+$/;if(userpwd_regex.test(userpassword)==false){warninfo_show(_("Warn_UserPassword_Invalid"));return false;}else{return true;}}