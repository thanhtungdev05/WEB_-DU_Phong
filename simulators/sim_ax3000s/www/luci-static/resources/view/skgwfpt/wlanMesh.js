
var origntopo;var stalist;var g_repeat_switch;var g_mesh_enable_old;var lanconf;var timerId=null;function parse_mesh_data(data)
{setChecked("Frm_MapEnableOn",(data.result[1].enable==1)?true:false);if(data.result[1].meshroleexchange==0)
{setValue("Frm_DeviceRole","3");$("#toposhow_mode").show();$("#wan_mesh").show();}
else
{if(data.result[1].role==2)
{setValue("Frm_DeviceRole","2");$("#toposhow_mode").hide();$("#wan_mesh").hide();document.getElementById("Frm_MapEnableOn").disabled=true;document.getElementById("Frm_DeviceRole").disabled=true;document.getElementById("Frm_Steering").disabled=true;document.getElementById('btn_mesh_ok').style.display='none';}
else
{setValue("Frm_DeviceRole","1");$("#toposhow_mode").show();$("#wan_mesh").show();}}
setValue("Frm_Steering",data.result[1].rssi);}
function wan_mac_shift(mac,offset)
{let macArray=mac.split(':').map(part=>parseInt(part,16));macArray[5]+=offset;if(macArray[5]>0xff){macArray[4]+=Math.floor(macArray[5]/0x100);macArray[5]=macArray[5]%0x100;if(macArray[4]>0xff){macArray[3]+=Math.floor(macArray[4]/0x100);macArray[4]=macArray[4]%0x100;}}
return macArray.map(part=>part.toString(16).padStart(2,'0')).join(':');}
function get_topo_agent(macaddr,menu_list)
{var agentarray=[];$.each(menu_list,function(index,val){if(val.role==2&&val.uplinkmac==macaddr)
{var agentjson={};agentjson.role="agent";agentjson.macaddr=val.mac;agentjson.ipaddr=val.ipv4;agentjson.medium=val.medium;agentjson.rate=val.rate;agentjson.client=new Array();$.each(val.ETH_CLIENT,function(idx,obj){agentjson.client.push(obj);});$.each(val.RADIO,function(idx,obj){$.each(obj.VAP,function(i,objm){$.each(objm.RADIO_CLIENT,function(j,objn){objn.ifname=obj.ifname;agentjson.client.push(objn);});});});agentjson.agent=get_topo_agent(val.mac,menu_list);agentarray.push(agentjson);}});return agentarray;}
function trans_topo_data(data)
{var topojson={};$.each(data,function(index,val){if(val.role==1)
{topojson.role="master";topojson.macaddr=val.mac;topojson.ipaddr=val.ipv4;topojson.client=new Array();$.each(val.ETH_CLIENT,function(idx,obj){topojson.client.push(obj);});$.each(val.RADIO,function(idx,obj){$.each(obj.VAP,function(i,objm){$.each(objm.RADIO_CLIENT,function(j,objn){objn.ifname=obj.ifname;topojson.client.push(objn);});});});topojson.agent=get_topo_agent(val.mac,data);}});return topojson;}
function showdatalist(macaddr)
{var eth=_("ETH");var devicelist=_("Device list");var device=_("Device");var Controller=_("Controller");var ethAgent=_("Agent(ETH)");var wifiAgent=_("Agent(WiFi)");var ConnMode=_("Connect Mode:");$("body").append("<div class='backimg'></div>");var paneldiv=$("<div>");paneldiv.addClass("panel");paneldiv.css("width","550px");paneldiv.hide();var tittlediv=$("<div>");tittlediv.addClass("panel-header");tittlediv.append("<h3>"+devicelist+"</h3>");paneldiv.append(tittlediv);var contentdiv=$("<div>");contentdiv.addClass("panel-content");contentdiv.append("<table><colgroup><col style=\"width:30%\"><col style=\"width:70%\"></colgroup><tbody id=\"devlistbody\"></tbody></table>");paneldiv.append(contentdiv);paneldiv.append("<span class=\"close\" onclick=\"hide_mode();\" style=\"top: -13px;\"><i class=\"bi-x\"></i></span>");$("body").append(paneldiv);$.each(origntopo,function(index,val){if(macaddr==val.mac)
{var str;var agentip=val.ipv4;if(val.role==1)
{if(val.mac.toLowerCase()==lanconf.macaddr.toLowerCase()){agentip=lanconf.ipaddr;}
str+="<tr><td><img src='luci-static/resources/cbi/router.svg'/></td><td><ul><li><span>"+device+":</span> <span>"+Controller+"</span></li><li><span>MAC:</span><span>";}
else
{$.each(stalist,function(index,tmpSta){if(tmpSta.macAddr.toLowerCase()==macaddr.toLowerCase()){agentip=tmpSta.ipAddr;}});var location="http://"+agentip;if(val.medium=='ethernet')
str+="<tr><td><img src='luci-static/resources/cbi/router.svg'/ style='cursor:pointer;' onclick='location.href=\""+location+"\"'></td><td><ul><li><span>"+device+":</span> <span>"+ethAgent+"</span></li><li><span>MAC:</span><span>";else
str+="<tr><td><img src='luci-static/resources/cbi/router.svg'/ style='cursor:pointer;' onclick='location.href=\""+location+"\"'></td><td><ul><li><span>"+device+":</span> <span>"+wifiAgent+"</span></li><li><span>MAC:</span><span>";}
if(val.role==1)
str+=val.mac+"</span></li><li><span>IP:</span><span onclick=\"location.href='http://"+agentip+"'\">"+agentip+"</span></li></ul></td></tr>";else
{const matchedItem=stalist.find(Item=>Item.macAddr===val.mac.toUpperCase());if(matchedItem!=undefined)
str+=wan_mac_shift(val.mac,1)+"</span></li><li><span>IP:</span><span onclick=\"location.href='http://"+agentip+"'\">"+agentip+"</span></li><li><span>RSSI:</span><span>"+(val.rssi===0?'-':val.rssi)+"</span></li><li><span>Backhaul PhyRate:</span><span>"+(val.rssi===0?matchedItem.negorate/1000:val.rate/10|0)+"</span></li></ul></td></tr>";else
str+=wan_mac_shift(val.mac,1)+"</span></li><li><span>IP:</span><span onclick=\"location.href='http://"+agentip+"'\">"+agentip+"</span></li><li><span>RSSI:</span><span>"+(val.rssi===0?'-':val.rssi)+"</span></li><li><span>Backhaul PhyRate:</span><span>"+(val.rssi===0?'-':val.rate/10|0)+"</span></li></ul></td></tr>";}
if(val.ETH_CLIENT.length>0)
{$.each(val.ETH_CLIENT,function(idx,vdev){$.each(stalist,function(index,tmpSta){if(tmpSta.macAddr.toLowerCase()==vdev.mac.toLowerCase()){vdev.ipv4=tmpSta.ipAddr;vdev.name=tmpSta.hostname}});if(vdev.ipv4!="0.0.0.0"){str+="<tr><td><img src='luci-static/resources/cbi/iphone.png'/></td><td><ul><li><span>"+device+":</span> <span>"+vdev.name+"</span></li><li><span>MAC:</span><span>"+vdev.mac+"</span></li><li><span>IP:</span>"
+"<span>"+vdev.ipv4+"</span></li><li><span>"+ConnMode+"</span><span>"+eth+"</span></li></ul></td></tr>";}});}
$.each(val.RADIO,function(idx,obj){$.each(obj.VAP,function(i,objm){$.each(objm.RADIO_CLIENT,function(j,objn){$.each(stalist,function(index,tmpSta1){if(tmpSta1.macAddr.toLowerCase()==objn.mac.toLowerCase()){objn.ipv4=tmpSta1.ipAddr;objn.name=tmpSta1.hostname;}});if(objn.ipv4!="0.0.0.0"){if(obj.ifname=="ra0")
str+="<tr><td><img src='luci-static/resources/cbi/iphone.png'/></td><td><ul><li><span>"+device+":</span> <span>"+objn.name+"</span></li><li><span>MAC:</span><span>"+objn.mac+"</span></li><li><span>IP:</span>"
+"<span>"+objn.ipv4+"</span></li><li><span>"+ConnMode+"</span><span>2.4G</span></li></ul></td></tr>";else
str+="<tr><td><img src='luci-static/resources/cbi/iphone.png'/></td><td><ul><li><span>"+device+":</span> <span>"+objn.name+"</span></li><li><span>MAC:</span><span>"+objn.mac+"</span></li><li><span>IP:</span>"
+"<span>"+objn.ipv4+"</span></li><li><span>"+ConnMode+"</span><span>5G</span></li></ul></td></tr>";}});});});$("#devlistbody",document).append(str);}});$(".panel").fadeIn(300);}
function showtopo(menu_list,parentobj)
{$.each(menu_list,function(index,val){var devicerole;var connect_type;var eth=_("ETH");if(val.role=="master")
{devicerole=_("Controller");}
else
{devicerole=_("Agent");}
if(val.medium=="ethernet")
connect_type="<div style='color: #03bbff;font-size: 12px;'>"+eth+"</div>";else
connect_type="<div style='color: #03bbff;font-size: 12px;'>5G</div>";var li=$("<li></li>");if(val.role=="master")
{li.append("<div onclick='showdatalist(\""+val.macaddr+"\")'><img src='luci-static/resources/cbi/router.svg' id='"+val.macaddr+"' style='width:67px;height:61px' /><span>"+devicerole+"</span></div>").append("<ul></ul>").appendTo(parentobj);}
else
{li.append("<div onclick='showdatalist(\""+val.macaddr+"\")'>"+connect_type+"<img src='luci-static/resources/cbi/router.svg' id='"+val.macaddr+"' style='width:67px;height:61px' /><span>"+devicerole+"</span></div>").append("<ul></ul>").appendTo(parentobj);}
if(val.agent&&val.agent.length>0)
{showtopo(val.agent,$(li).children().eq(1));}});}
function showall(data,parentobj)
{var topoarray=[];var topojson=trans_topo_data(data);topoarray.push(topojson);showtopo(topoarray,parentobj);}
function meshTopo_show(data){$("#toposhow").empty();var showlist=$("<ul id='org' style='display:none'></ul>");if(data.result&&data.result[1]&&data.result[1].TopologyInfo){var tmp_jsTopoInfo=JSON.parse(data.result[1].TopologyInfo);showall(tmp_jsTopoInfo["topology information"],showlist);origntopo=tmp_jsTopoInfo["topology information"];}else{return;}
$("#toposhow").append(showlist);$("#org").jOrgChart({chartElement:'#toposhow',dragAndDrop:false});$(".jOrgChart .node:eq(0)").css("height",80);}
function refreshMeshtopo(){var ubusstalist=new Array("rtweb.sta","getStaInfo",{});var jsonstalist={"id":1,"params":ubusstalist};var ubusparam_topy=new Array("rtweb.mesh","MeshTopyGet",{});var jsonparam_topy={"id":1,"params":ubusparam_topy};if(getValue("Frm_DeviceRole")!="2")
{sk_auth_post(jsonstalist,function(result){stalist=result.result[1].staDevices;});sk_auth_post(jsonparam_topy,function(result){meshTopo_show(result);});}}
function meshtopo_init_timer()
{timerId=setInterval(refreshMeshtopo,6000);}
function pageLoad()
{var ubusparam=new Array("rtweb.mesh","wlanMeshGet",{});var jsonparam={"id":1,"params":ubusparam};sk_auth_post(jsonparam,function(result){parse_mesh_data(result);g_mesh_enable_old=result.result[1].enable;if(result.result[1].enable==1&&result.result[1].role==1)
{$("#toposhow_mode").show();}
else
{$("#toposhow_mode").hide();}});var ubusrepeat=new Array("rtweb.wifi","wlanApClientGet",{});var jsonrepeat={"id":1,"params":ubusrepeat};sk_auth_post(jsonrepeat,function(result){if(result&&result.result&&result.result.length>1&&typeof result.result[1]==='object'&&result.result[1].hasOwnProperty('enable')){g_repeat_switch=result.result[1].enable;}else{console.error('Invalid response from wlanApClientGet API:',result);g_repeat_switch=false;}});var ubusstalist=new Array("rtweb.sta","getStaInfo",{});var jsonstalist={"id":1,"params":ubusstalist};sk_auth_post(jsonstalist,function(result){stalist=result.result[1].staDevices;});var ubuslancfg=new Array("rtweb.lancfg","getLanCfg",{});var jsonlancfg={"id":1,"params":ubuslancfg};sk_auth_post(jsonlancfg,function(result){lanconf=result.result[1];});refreshMeshtopo();meshtopo_init_timer();}
function setBssInfo()
{var data=[];var ssidEn=(getChecked("Frm_MapEnableOn")==true)?1:0;var objValue={"band":"5G","index":8,"enable":ssidEn};data.push(objValue);var ubusparam=new Array("rtweb.wifi","wlanBasicSet_encrypt",{"bss":data});var jsonparam=[{"id":1,"params":ubusparam}];sk_auth_post(jsonparam,function(result){wifiReload();loading_show();setTimeout("hide_mode()",5000);});}
function setRadioEnable()
{var data=[];var radio=1;var objValue={"band":"5G","enable":radio};data.push(objValue);var ubusparam=new Array("rtweb.wifi","wlanRadioSet",{"radios":data});var jsonparam=[{"id":1,"params":ubusparam}];sk_auth_post(jsonparam,function(result){});}
function wifiReload()
{var ubusparam=new Array("rtweb.wifi","reload",{"band":2});var jsonparam={"id":1,"params":ubusparam};sk_auth_post(jsonparam,function(result){console.log("wifi reload");});}
function meshcfg_apply()
{var meshdata={};meshdata.enable=(getChecked("Frm_MapEnableOn")==true)?1:0;if(getValue("Frm_DeviceRole")=="1")
{meshdata.role=1;meshdata.meshroleexchange=1;}
else if(getValue("Frm_DeviceRole")=="2")
{meshdata.role=2;meshdata.meshroleexchange=1;}
else
{meshdata.meshroleexchange=0;}
meshdata.rssi_threshhold=parseInt(getValue("Frm_Steering"));if(meshdata.enable!=g_mesh_enable_old)
{if(meshdata.enable==1)
{setRadioEnable();}
setBssInfo();g_mesh_enable_old=meshdata.enable;}
var ubusparam=new Array("rtweb.mesh","wlanMeshSet",meshdata);var jsonparam={"id":1,"params":ubusparam};sk_auth_apply(jsonparam,function(result){});}
function check_agent()
{if(getValue("Frm_DeviceRole")=="2")
{document.getElementById("agenttips").style.color="red";document.getElementById("agenttips").style.display="block";document.getElementById("agenttips").style.textIndent="33%";$("#agenttips").show();}
else
$("#agenttips").hide();}
function select_devicerole()
{var autoOption=document.getElementById('autoOption');autoOption.disabled=true;if(getValue("Frm_DeviceRole")=="1"||getValue("Frm_DeviceRole")=="3")
{$("#toposhow_mode").show();$("#wan_mesh").show();}
else
{$("#toposhow_mode").hide();$("#wan_mesh").hide();}
check_agent();}
function switch_mesh_enable()
{var error=_("Please confirm that WiFi Repeater is turned off!");if(getChecked("Frm_MapEnableOn")==true){if(g_repeat_switch==1)
{warninfo_show(error);setChecked("Frm_MapEnableOn",false);return;}
$("#mesh_cfg").show();select_devicerole();}
else
{$("#mesh_cfg").hide();$("#toposhow_mode").hide();}}