
var timerId=null;var knobcpu=pureknob.createKnob(200,200);var knobmem=pureknob.createKnob(200,200);var Wlan2GEnable=0;var Wlan5GEnable=0;var DnsAddress="";var InternetStatus="down";var NatEnable=0;var LanAddress="";var DhcpEnable=0;var WanStatus=false;var LanStatus=[0,0,0,0];var RAMSize="";var ROMSize="";var EasyDiagnoseId;var DiagnoseNum=0;var femstatus_2G="";var femstatus_5G="";function dev_fini_timer()
{clearInterval(timerId);}
function distroy_devinfo()
{dev_fini_timer();}
function formatPercentage(value)
{return value+"%";}
function showtopo(menu_list,parentobj)
{$.each(menu_list,function(index,val){var devicerole;var connect_type;var eth=_("ETH");if(val.role=="master")
{devicerole=_("Controller");}
else
{devicerole=_("Agent");}
if(val.medium=="ethernet")
connect_type="<div style='color: #03bbff;font-size: 12px;'>"+eth+"</div>";else
connect_type="<div style='color: #03bbff;font-size: 12px;'>5G</div>";var li=$("<li></li>");if(val.role=="master")
{li.append("<div onclick='showdatalist(\""+val.macaddr+"\")' style='display:none;'><img src='luci-static/resources/cbi/router.svg' id='"+val.macaddr+"' style='width:67px;height:61px' /><span>"+devicerole+"</span></div>").append("<ul></ul>").appendTo(parentobj);}
else
{li.append("<div onclick='showdatalist(\""+val.macaddr+"\")'>"+connect_type+"<img src='luci-static/resources/cbi/router.svg' id='"+val.macaddr+"' style='width:67px;height:61px' /><span>"+devicerole+"</span></div>").append("<ul></ul>").appendTo(parentobj);}
if(val.agent.length>0)
{showtopo(val.agent,$(li).children().eq(1));}});}
function get_topo_agent(macaddr,menu_list)
{var agentarray=[];$.each(menu_list,function(index,val){if(val.role==2&&val.uplinkmac==macaddr)
{var agentjson={};agentjson.role="agent";agentjson.macaddr=val.mac;agentjson.ipaddr=val.ipv4;agentjson.medium=val.medium;agentjson.client=new Array();$.each(val.ETH_CLIENT,function(idx,obj){agentjson.client.push(obj);});$.each(val.RADIO,function(idx,obj){$.each(obj.VAP,function(i,objm){$.each(objm.RADIO_CLIENT,function(j,objn){objn.ifname=obj.ifname;agentjson.client.push(objn);});});});agentjson.agent=get_topo_agent(val.mac,menu_list);agentarray.push(agentjson);}});return agentarray;}
function trans_topo_data(data)
{var topojson={};$.each(data,function(index,val){if(val.role==1)
{topojson.role="master";topojson.macaddr=val.mac;topojson.ipaddr=val.ipv4;topojson.client=new Array();$.each(val.ETH_CLIENT,function(idx,obj){topojson.client.push(obj);});$.each(val.RADIO,function(idx,obj){$.each(obj.VAP,function(i,objm){$.each(objm.RADIO_CLIENT,function(j,objn){objn.ifname=obj.ifname;topojson.client.push(objn);});});});topojson.agent=get_topo_agent(val.mac,data);}});return topojson;}
function showall(data,parentobj)
{var topoarray=[];var topojson=trans_topo_data(data);topoarray.push(topojson);showtopo(topoarray,parentobj);}
function meshTopo_show(data)
{$("#toposhow").empty();var showlist=$("<ul id='org' style='display:none'></ul>");var tmp_jsTopoInfo=JSON.parse(data.result[1].TopologyInfo);showall(tmp_jsTopoInfo["topology information"],showlist);origntopo=tmp_jsTopoInfo["topology information"];$("#toposhow").append(showlist);$("#org").jOrgChart({chartElement:'#toposhow',dragAndDrop:false});$(".jOrgChart .node:eq(0)").css("height",0);}
function refreshData(){var ubusparam1=new Array("rtweb.devinfo","sysinfo",{});var ubusparam2=new Array("gwweb.netstatus","getNetStatus",{});var ubusparam3=new Array("system","info",{});var ubusparam4=new Array("rtweb.sta","getStaNum",{});var jsonparam=[{"id":1,"params":ubusparam1},{"id":2,"params":ubusparam2},{"id":3,"params":ubusparam3},{"id":4,"params":ubusparam4}];sk_auth_post(jsonparam,function(result){devinfo_update_netstatus(result[1].result[1].status);$("#SysUpTime").html(secondsToDhms(result[2].result[1].uptime));$("#DeviceNum").html(result[3].result[1].total);});}
function dev_init_timer()
{timerId=setInterval(refreshData,2000);}
function refreshMeshtopo(){var ubusparam_topy=new Array("rtweb.mesh","MeshTopyGet",{});var jsonparam_topy={"id":1,"params":ubusparam_topy};sk_auth_post(jsonparam_topy,function(result){meshTopo_show(result);});}
function meshtopo_init_timer()
{timerId=setInterval(refreshMeshtopo,10000);}
function is_router(data)
{if(data==null)
return false;for(var i=0;i<data.length;i++){if(data[i]==null)
continue;if(data[i].iswan==1){if(data[i].ispon!=1)
return true;}}
return false;}
function setWizardFlag()
{var ubusparam=new Array();var jsonparam={};apply_data={};ubusparam=new Array("rtweb.system","setWizardFlag",apply_data);jsonparam={"id":1,"params":ubusparam};sk_auth_apply(jsonparam,function(result){});}


function devinfo_get_data()
{var ubusparam=new Array("rtweb.devinfo","get",{});var sfuparam=new Array("gwweb.pon.sfu","get_onuType",{});var uplinkparam=new Array("gwweb.portinfo","show_portinfo",{});var ubusparam4=new Array("gwweb.wancfg","status",{});var ubusparam5=new Array("basicControl.InfoSystem","get",{});var jsonparam=[{"id":1,"params":ubusparam},{"id":2,"params":sfuparam},{"id":3,"params":uplinkparam},{"id":4,"params":ubusparam4},{"id":5,"params":ubusparam5}];sk_auth_post(jsonparam,function(result){var tmp=result[0].result[1];if(tmp.wizard_init==0){setWizardFlag();sk_redirect('/cgi-bin/luci/admin/wizard');}
$("#ModelName").html(tmp.model);$("#SoftwareVer").html(tmp.softver);$("#HardwareVer").html(tmp.hardver);$("#DevSn").html(tmp.sn);$("#GponSn").html(tmp.gponsn);$("#Compiletime").html(tmp.compile_time);var portinfo=result[2].result[1]["portinfo"];if(result[1].result==null||is_router(portinfo)){$("#onutpye").html("Router");}else{if(result[1].result[1].onuType=="sfu"){$("#onutpye").html("SFU ONT");}else{$("#onutpye").html("HGU ONT");}}
if(result[1].result==null)
{$("#ponsntab").hide();}
WanConnJson=result[3].result[1].wan;for(i=0;i<WanConnJson.length;i++)
{if(WanConnJson[i].GUIname.indexOf("TR069")!=-1)
{$("#WanMacAddr").html(WanConnJson[i].mac_addr);}}
if(result[4].result)
{$("#LastRebootType").html(result[4].result[1].eventlog.action_reboot);}});}
function draw_usage()
{var showSymbol_flag=false;if(usage_time.length==1)
showSymbol_flag=true;var chartDom=document.getElementById('myChart');var myChart=echarts.init(chartDom);var option;option={legend:{data:['CPU Usage','Memory Usage'],textStyle:{fontFamily:["Microsoft YaHei","Arial","SimSun","Verdana","Helvetica","Sans-Serif","Geneva"]}},xAxis:{type:'category',axisLabel:{formatter:function(value,index){var date=new Date(parseInt(value)*1000);var options={month:'short',day:'numeric',hour:'2-digit',minute:'2-digit',hour12:false};var formattedDate=date.toLocaleString('en-US',options);return formattedDate.replace(',','');},},axisTick:{alignWithLabel:true,},boundaryGap:true,data:usage_time,},yAxis:{type:'value',min:0,max:100,},series:[{name:'CPU Usage',data:cpu_usage,type:'line',showSymbol:showSymbol_flag,smooth:true,},{name:'Memory Usage',data:mem_usage,type:'line',showSymbol:showSymbol_flag,smooth:true,},]};option&&myChart.setOption(option);}
var usage_time=[];var cpu_usage=[];var mem_usage=[];function show_usage()
{var randnum=generateRandomString(10);var postdata={"sessionid":encodeURIComponent(envcar.sessionid),"command":"cat /tmp/usage.log"};$.ajax({url:"/cgi-bin/cgi-exec?"+randnum,type:"POST",data:postdata,dataType:"text",success:function(result){const lines=result.split('\n');var intervals=Math.floor(lines.length/200)+1;for(var i=0;i<lines.length;i++)
{if(i%intervals!=0)
continue;var arr=lines[i].split(',');if(arr.length!=3)
{console.log(lines[i]);continue;}
usage_time.push(arr[0]);cpu_usage.push(arr[1]);mem_usage.push(arr[2]);}
draw_usage();}});}
function pageLoad()
{knobmem.setProperty('angleStart',-0.75*Math.PI);knobmem.setProperty('angleEnd',0.75*Math.PI);knobmem.setProperty('trackWidth',0.2);knobmem.setProperty('valMin',0);knobmem.setProperty('valMax',100);knobcpu.setProperty('angleStart',-0.75*Math.PI);knobcpu.setProperty('angleEnd',0.75*Math.PI);knobcpu.setProperty('trackWidth',0.2);knobcpu.setProperty('valMin',0);knobcpu.setProperty('valMax',100);devinfo_get_data();refreshData();dev_init_timer();show_usage();startEasyDiagnose();}
function redrawcanv(obj,val)
{if(parseInt(val)<=60)
obj.setProperty('colorFG','#88ff88');else if(parseInt(val)>60&&parseInt(val)<=80)
obj.setProperty('colorFG','#FDDD60');else
obj.setProperty('colorFG','#FF6E76');obj.setValue(val);}
function cpuKnob(cpuUsage){redrawcanv(knobcpu,cpuUsage);const node=knobcpu.node();const elem=document.getElementById('Cpuinfo');elem.appendChild(node);}
function memKnob(memUsage){redrawcanv(knobmem,memUsage);const node=knobmem.node();const elem=document.getElementById('Meminfo');elem.appendChild(node);}
function secondsToDhms(seconds)
{if(typeof seconds!=="number"||seconds<0){throw new Error("Invalid input");}
var days=Math.floor(seconds/(24*3600));seconds%=24*3600;var hours=Math.floor(seconds/3600);seconds%=3600;var minutes=Math.floor(seconds/60);seconds%=60;var result="";if(days>0){result+=days+"D ";}
if(hours>0){result+=hours+"H ";}
if(minutes>0){result+=minutes+"M ";}
if(seconds>0){result+=seconds+"S";}
return result.trim();}
function devinfo_update_netstatus(flag)
{var netobj=$("#NetStatus");if(flag==0)
{if($(netobj).hasClass("icon-connected"))
$(netobj).removeClass("icon-connected").addClass("icon-disconnected");}else{if($(netobj).hasClass("icon-disconnected"))
$(netobj).removeClass("icon-disconnected").addClass("icon-connected");}}
function startEasyDiagnose()
{DiagnoseNum=0;GetDiagnoseStatus();}
function GetDiagnoseStatus()
{if(DiagnoseNum==0){resetDianoseStatus();var ubusparam=new Array("gwweb.wancfg","status",{});var ubusparam2=new Array("gwweb.pon.sfu","get_onuType",{});var ubusparam3=new Array("gwweb.wancfg","getWanCfg",{});var ubusparam4=new Array("gwweb.wancfg","internet_status",{});var ubusparam5=new Array("rtweb.lancfg","getLanCfg",{});var ubusparam6=new Array("rtweb.dhcpserver","get",{});var ubusparam7=new Array("gwweb.wancfg","phystatus",{});var ubusparam8=new Array("rtweb.wifi","wlanRadioGet",{});var ubusparam9=new Array("rtweb.lancfg","getLanStats",{});var ubusparam10=new Array("rtweb.devinfo","get",{});var ubusparam11=new Array("diag.fem","get_2G_status",{});var ubusparam12=new Array("diag.fem","get_5G_status",{});var jsonparam=[{"id":1,"params":ubusparam},{"id":2,"params":ubusparam2},{"id":3,"params":ubusparam3},{"id":4,"params":ubusparam4},{"id":5,"params":ubusparam5},{"id":6,"params":ubusparam6},{"id":7,"params":ubusparam7},{"id":8,"params":ubusparam8},{"id":9,"params":ubusparam9},{"id":10,"params":ubusparam10},{"id":11,"params":ubusparam11},{"id":12,"params":ubusparam12}];sk_auth_post(jsonparam,function(result){Diagnose_parse_result(result);DiagnoseNum=1;initProgressStatus();clearInterval(EasyDiagnoseId);EasyDiagnoseId=setInterval(GetDiagnoseStatus,1000);});}
else{DiagnoseNum++;initProgressStatus();}}
function Diagnose_parse_result(result)
{WanConnJson=result[0].result[1].wan;var WanCfgJson=result[2].result[1].wan;var internetWanIndex=-1;if(result[7].result)
{WlanRadioJson=result[7].result[1].radios;for(i=0;i<WlanRadioJson.length;i++)
{if(WlanRadioJson[i].band=="2.4G")
{Wlan2GEnable=WlanRadioJson[i].enable;}
else if(WlanRadioJson[i].band=="5G")
{Wlan5GEnable=WlanRadioJson[i].enable;}}}
if(result[1].result!=null&&(result[1].result[1].onuType=="hybrid"||result[1].result[1].onuType=="sfu"))
for(var i=0;i<WanConnJson.length;i++)
{if(WanConnJson[i].index==8)
{WanConnJson.splice(i,1);break;}}
for(i=0;i<WanConnJson.length;i++)
{if(WanConnJson[i].GUIname.indexOf("INTERNET_R")!=-1&&WanConnJson[i].v4_status.indexOf("up")!=-1)
{internetWanIndex=WanConnJson[i].index-1;if(WanConnJson[i].GUIname.indexOf("TR069")!=-1)
break;}}
if(internetWanIndex!=-1)
{DnsAddress=WanConnJson[internetWanIndex].dns1;NatEnable=WanCfgJson[internetWanIndex].natenable;}
InternetStatus=result[3].result[1].v4status;LanAddress=result[4].result[1].ipaddr;if(result[5].result[1].dhcpmode!=0)
DhcpEnable=1;WanStatus=result[6].result[1].phystatus;if(result[8].result)
{var portarray=result[8].result[1]["rtweb.lancfg"];if(portarray.length==4)
{for(var i=0;i<4;i++){var textId="#Lan"+(i+1)+"Text";$(textId).html(portarray[i].devname);if(portarray[i].status==0)
{LanStatus[i]=0;}
else
{LanStatus[i]=1;}}}}
RAMSize=result[9].result[1].ram;ROMSize=result[9].result[1].flash;femstatus_2G=result[10].result[1].status;femstatus_5G=result[11].result[1].status;}
function resetDianoseStatus()
{Wlan2GEnable=0;Wlan5GEnable=0;DnsAddress="";InternetStatus="down";NatEnable=0;LanAddress="";DhcpEnable=0;WanStatus=false;LanStatus.fill(0);RAMSize="";ROMSize="";femstatus_2G="";femstatus_5G="";$("#2GfemStatus").html(femstatus_2G);$("#5GfemStatus").html(femstatus_5G);$("#DnsIP").html(DnsAddress);$("#LanIP").html(LanAddress);$("#RAMSize").html(RAMSize);$("#ROMSize").html(ROMSize);for(var i=0;i<4;i++){var statusId="#Lan"+(i+1)+"Status";$(statusId).html("");}}
function initProgressStatus()
{var progress=(DiagnoseNum-1)*25;console.log("progress="+progress);if(progress==100)
{$("#2GfemStatus").html(femstatus_2G);$("#5GfemStatus").html(femstatus_5G);$("#DnsIP").html(DnsAddress);$("#LanIP").html(LanAddress);$("#RAMSize").html(RAMSize);$("#ROMSize").html(ROMSize);for(var i=0;i<4;i++){var statusId="#Lan"+(i+1)+"Status";if(LanStatus[i]==0)
{$(statusId).html("Link down");}
else
{$(statusId).html("Link up");}}
clearInterval(EasyDiagnoseId);progress=0;EasyDiagnose();}
else
{document.getElementById("WlanCheck").style.width=progress+"%";document.getElementById("WlanCheck").className="progress-fail-status progress-bar-striped progress-bar-animated";document.getElementById("WlanImg").src="luci-static/resources/cbi/cancel.svg";document.getElementById("DnsCheck").style.width=progress+"%";document.getElementById("DnsCheck").className="progress-fail-status progress-bar-striped progress-bar-animated";document.getElementById("DnsImg").src="luci-static/resources/cbi/cancel.svg";document.getElementById("InternetCheck").style.width=progress+"%";document.getElementById("InternetCheck").className="progress-fail-status progress-bar-striped progress-bar-animated";document.getElementById("InternetImg").src="luci-static/resources/cbi/cancel.svg";document.getElementById("NatCheck").style.width=progress+"%";document.getElementById("NatCheck").className="progress-fail-status progress-bar-striped progress-bar-animated";document.getElementById("NatImg").src="luci-static/resources/cbi/cancel.svg";document.getElementById("LanCheck").style.width=progress+"%";document.getElementById("LanCheck").className="progress-fail-status progress-bar-striped progress-bar-animated";document.getElementById("LanImg").src="luci-static/resources/cbi/cancel.svg";document.getElementById("DhcpCheck").style.width=progress+"%";document.getElementById("DhcpCheck").className="progress-fail-status progress-bar-striped progress-bar-animated";document.getElementById("DhcpImg").src="luci-static/resources/cbi/cancel.svg";document.getElementById("WanCheck").style.width=progress+"%";document.getElementById("WanCheck").className="progress-fail-status progress-bar-striped progress-bar-animated";document.getElementById("WanImg").src="luci-static/resources/cbi/cancel.svg";for(var i=0;i<4;i++)
{var checkId="Lan"+(i+1)+"Check";var imgId="Lan"+(i+1)+"Img";document.getElementById(checkId).style.width=progress+"%";document.getElementById(checkId).className="progress-fail-status progress-bar-striped progress-bar-animated";document.getElementById(imgId).src="luci-static/resources/cbi/cancel.svg";}
document.getElementById("RAMSizeCheck").style.width=progress+"%";document.getElementById("RAMSizeCheck").className="progress-fail-status progress-bar-striped progress-bar-animated";document.getElementById("RAMSizeImg").src="luci-static/resources/cbi/cancel.svg";document.getElementById("ROMSizeCheck").style.width=progress+"%";document.getElementById("ROMSizeCheck").className="progress-fail-status progress-bar-striped progress-bar-animated";document.getElementById("ROMSizeImg").src="luci-static/resources/cbi/cancel.svg";document.getElementById("2GfemCheck").style.width=progress+"%";document.getElementById("2GfemCheck").className="progress-fail-status progress-bar-striped progress-bar-animated";document.getElementById("2GfemImg").src="luci-static/resources/cbi/cancel.svg";document.getElementById("5GfemCheck").style.width=progress+"%";document.getElementById("5GfemCheck").className="progress-fail-status progress-bar-striped progress-bar-animated";document.getElementById("5GfemImg").src="luci-static/resources/cbi/cancel.svg";}}
function EasyDiagnose()
{WlanCheck();DnsCheck();InternetCheck();NatCheck();LanCheck();DhcpCheck();WanCheck();LanStatusCheck();RAMSizeCheck();ROMSizeCheck();FemCheck_2G();FemCheck_5G();}
function WlanCheck()
{if(Wlan2GEnable==1&&Wlan5GEnable==1)
{document.getElementById("WlanCheck").style.width='100%';document.getElementById("WlanCheck").className="progress-success-status"
document.getElementById("WlanImg").src="luci-static/resources/cbi/check_circle.svg";}
else if(Wlan2GEnable==0&&Wlan5GEnable==0)
{document.getElementById("WlanCheck").style.width='100%';document.getElementById("WlanCheck").className="progress-fail-status"
document.getElementById("WlanImg").src="luci-static/resources/cbi/cancel.svg";}
else
{document.getElementById("WlanCheck").style.width='100%';document.getElementById("WlanCheck").className="progress-fail-status"
document.getElementById("WlanImg").src="luci-static/resources/cbi/cancel.svg";}}
function DnsCheck()
{if(DnsAddress.length!=0)
{document.getElementById("DnsCheck").style.width='100%';document.getElementById("DnsCheck").className="progress-success-status"
document.getElementById("DnsImg").src="luci-static/resources/cbi/check_circle.svg";}
else
{document.getElementById("DnsCheck").style.width='100%';document.getElementById("DnsCheck").className="progress-fail-status"
document.getElementById("DnsImg").src="luci-static/resources/cbi/cancel.svg";}}
function InternetCheck()
{if(InternetStatus=="up")
{document.getElementById("InternetCheck").style.width='100%';document.getElementById("InternetCheck").className="progress-success-status"
document.getElementById("InternetImg").src="luci-static/resources/cbi/check_circle.svg";}
else
{document.getElementById("InternetCheck").style.width='100%';document.getElementById("InternetCheck").className="progress-fail-status"
document.getElementById("InternetImg").src="luci-static/resources/cbi/cancel.svg";}}
function NatCheck()
{if(NatEnable==1)
{document.getElementById("NatCheck").style.width='100%';document.getElementById("NatCheck").className="progress-success-status";document.getElementById("NatImg").src="luci-static/resources/cbi/check_circle.svg";}
else
{document.getElementById("NatCheck").style.width='100%';document.getElementById("NatCheck").className="progress-fail-status";document.getElementById("NatImg").src="luci-static/resources/cbi/cancel.svg";}}
function LanCheck()
{if(LanAddress.length!=0)
{document.getElementById("LanCheck").style.width='100%';document.getElementById("LanCheck").className="progress-success-status";document.getElementById("LanImg").src="luci-static/resources/cbi/check_circle.svg";}
else
{document.getElementById("LanCheck").style.width='100%';document.getElementById("LanCheck").className="progress-fail-status";document.getElementById("LanImg").src="luci-static/resources/cbi/cancel.svg";}}
function DhcpCheck()
{if(DhcpEnable=="1")
{document.getElementById("DhcpCheck").style.width='100%';document.getElementById("DhcpCheck").className="progress-success-status";document.getElementById("DhcpImg").src="luci-static/resources/cbi/check_circle.svg";}
else
{document.getElementById("DhcpCheck").style.width='100%';document.getElementById("DhcpCheck").className="progress-fail-status";document.getElementById("DhcpImg").src="luci-static/resources/cbi/cancel.svg";}}
function WanCheck()
{if(WanStatus)
{document.getElementById("WanCheck").style.width='100%';document.getElementById("WanCheck").className="progress-success-status";document.getElementById("WanImg").src="luci-static/resources/cbi/check_circle.svg";}
else
{document.getElementById("WanCheck").style.width='100%';document.getElementById("WanCheck").className="progress-fail-status";document.getElementById("WanImg").src="luci-static/resources/cbi/cancel.svg";}}
function LanStatusCheck()
{for(var i=0;i<4;i++)
{var checkId="Lan"+(i+1)+"Check";var imgId="Lan"+(i+1)+"Img";if(LanStatus[i]==1)
{document.getElementById(checkId).style.width='100%';document.getElementById(checkId).className="progress-success-status";document.getElementById(imgId).src="luci-static/resources/cbi/check_circle.svg";}
else
{document.getElementById(checkId).style.width='100%';document.getElementById(checkId).className="progress-fail-status";document.getElementById(imgId).src="luci-static/resources/cbi/cancel.svg";}}}
function RAMSizeCheck()
{if(RAMSize.length!=0)
{document.getElementById("RAMSizeCheck").style.width='100%';document.getElementById("RAMSizeCheck").className="progress-success-status";document.getElementById("RAMSizeImg").src="luci-static/resources/cbi/check_circle.svg";}
else
{document.getElementById("RAMSizeCheck").style.width='100%';document.getElementById("RAMSizeCheck").className="progress-fail-status";document.getElementById("RAMSizeImg").src="luci-static/resources/cbi/cancel.svg";}}
function ROMSizeCheck()
{if(ROMSize.length!=0)
{document.getElementById("ROMSizeCheck").style.width='100%';document.getElementById("ROMSizeCheck").className="progress-success-status";document.getElementById("ROMSizeImg").src="luci-static/resources/cbi/check_circle.svg";}
else
{document.getElementById("ROMSizeCheck").style.width='100%';document.getElementById("ROMSizeCheck").className="progress-fail-status";document.getElementById("ROMSizeImg").src="luci-static/resources/cbi/cancel.svg";}}
function FemCheck_2G()
{if(femstatus_2G=="0/2")
{console.log("femstatus_2G is "+femstatus_2G);document.getElementById("2GfemCheck").style.width='100%';document.getElementById("2GfemCheck").className="progress-fail-status";document.getElementById("2GfemImg").src="luci-static/resources/cbi/cancel.svg";}
else
{document.getElementById("2GfemCheck").style.width='100%';document.getElementById("2GfemCheck").className="progress-success-status";document.getElementById("2GfemImg").src="luci-static/resources/cbi/check_circle.svg";}}
function FemCheck_5G()
{if(femstatus_5G=="0/3")
{document.getElementById("5GfemCheck").style.width='100%';document.getElementById("5GfemCheck").className="progress-fail-status";document.getElementById("5GfemImg").src="luci-static/resources/cbi/cancel.svg";}
else
{document.getElementById("5GfemCheck").style.width='100%';document.getElementById("5GfemCheck").className="progress-success-status";document.getElementById("5GfemImg").src="luci-static/resources/cbi/check_circle.svg";}}
function easyDiagBtnApply()
{$("#easyDiag-card").hide();startEasyDiagnose();$('#easyDiag-card').delay(300).show(0);}