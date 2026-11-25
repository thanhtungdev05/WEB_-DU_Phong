
var ScheduleEntry;var SchIpFilterArray;function pageLoad()
{getSchedule();schedule_getIpFilter();contentLoad();}
function getSchedule()
{var ubusparam=new Array("gwweb.schedule","getSchedule",{});var jsonparam={"id":1,"params":ubusparam};sk_auth_post(jsonparam,function(result){ScheduleEntry=result.result[1]["schedule"]["entries"];});}
function schedule_getIpFilter()
{var ubusparam=new Array("rtweb.ipfilter","getIpFilterItem",{});var jsonparam={"id":1,"params":ubusparam};sk_auth_post(jsonparam,function(result){SchIpFilterArray=result.result[1]["ipfilter"]["entries"];});}
function contentLoad()
{var ubusparam=new Array("rtweb.ipfilter","getIpFilterBasic",{});var jsonparam={"id":1,"params":ubusparam};sk_auth_post(jsonparam,function(result){basicSwitchLoad(result);ipFilterInfoTableLoad();});}
var curModeType;function basicSwitchLoad(res)
{var enable=0;var mode=0;if(res.result[0]!=-1){enable=res.result[1].enable;mode=res.result[1].mode;}
if(!enable){setAllDiabled(true);}
else{setAllDiabled(false);}
curModeType=mode;setChecked("at-ipfilter-enable0",enable?false:true);setChecked("at-ipfilter-enable1",enable?true:false);setChecked("at-ipfilter-mode0",mode?false:true);setChecked("at-ipfilter-mode1",mode?true:false);}
function ipFilterInfoTableLoad()
{var ubusparam=new Array("rtweb.ipfilter","getIpFilterItem",{});var jsonparam={"id":1,"params":ubusparam};sk_auth_post(jsonparam,function(result){var resArr=result.result[1];tableLoad(resArr);});}
function tableLoad(resArr)
{var tableNode=document.getElementById("at-ipfilter-nodata-tbody");var resLength=resArr.ipfilter.num;tableNode.innerHTML="";if(!resLength){document.getElementById("at-ipfilter-selectall").disabled=true;tableNode.innerHTML+="<tr align='center'><td colspan='10'>"+_("No_Data_Yet")+"</td></tr>";}
else{document.getElementById("at-ipfilter-selectall").disabled=false;}
document.getElementById("at-ipfilter-tbody").innerHTML="";document.getElementById("at-ipfilter-selectall").checked=false;if(getChecked("at-ipfilter-enable0")){document.getElementById("at-ipfilter-selectall").disabled=true;}
for(var i=0;i<resLength;i++){tableItemLoad(resArr.ipfilter.entries[i]);}}
function getShowProtocolStr(protocol)
{if(protocol=="tcpudp"){return"TCP/UDP";}
else if(protocol=="tcp"){return"TCP";}
else if(protocol=="udp"){return"UDP";}
else if(protocol=="icmp"){return"ICMP";}
else{return"None";}}
function GetSchedulerDayString(daysNumStr)
{var dayString='';if((daysNumStr.indexOf("1",0))!=-1)
dayString+="/"+_("Mon");if((daysNumStr.indexOf("2",0))!=-1)
dayString+="/"+_("Tue");if((daysNumStr.indexOf("3",0))!=-1)
dayString+="/"+_("Wed");if((daysNumStr.indexOf("4",0))!=-1)
dayString+="/"+_("Thu");if((daysNumStr.indexOf("5",0))!=-1)
dayString+="/"+_("Fri");if((daysNumStr.indexOf("6",0))!=-1)
dayString+="/"+_("Sat");if((daysNumStr.indexOf("7",0))!=-1)
dayString+="/"+_("Sun");if(dayString!=""){dayString=dayString.substring(1);}
return dayString;}
function tableItemLoad(itemValue)
{var tableNode=document.getElementById("at-ipfilter-tbody");var ipFilterName=itemValue.filterName;var ipFilterSche=itemValue.scheduler;var ipFilterProtocol=itemValue.protocol;var ipFltSrcIpStart=itemValue.srcIPStart;var ipFltSrcIpEnd=itemValue.srcIPEnd;var ipFltDstIpStart=itemValue.dstIPStart;var ipFltDstIpEnd=itemValue.dstIPEnd;var ipFltSrcPortStart=itemValue.srcPortStart==0?"":itemValue.srcPortStart.toString();var ipFltSrcPortEnd=itemValue.srcPortEnd==0?"":itemValue.srcPortEnd.toString();var ipFltDstPortStart=itemValue.dstPortStart==0?"":itemValue.dstPortStart.toString();var ipFltDstPortEnd=itemValue.dstPortEnd==0?"":itemValue.dstPortEnd.toString();var ipFltDisStr="";var itemStr="";if(getChecked("at-ipfilter-enable0")){ipFltDisStr="disabled";}
ipFilterProtocol=getShowProtocolStr(itemValue.protocol);itemStr+="<tr name='at-filter-raw' id='at-"+ipFilterName+"-IpFilterTr'><th><label class='skcheckbox'>";itemStr+="<input type='checkbox' ";itemStr+="name='at-ipfilter-item' id='at-"+ipFilterName+"-IpFilterInpts' ";itemStr+=ipFltDisStr+" hidden />";itemStr+="<label for='at-"+ipFilterName+"-IpFilterInpts' class='skcheckbox-label'></label>";itemStr+="</label></th>";itemStr+="<th>"+ipFilterName+"</th>";itemStr+="<th id='ifProto'>"+ipFilterProtocol+"</th>";itemStr+="<th id='ifSIS' style='width: 10%'>"+ipFltSrcIpStart+"-"+ipFltSrcIpEnd+"</th>";itemStr+="<th id='ifSPS'>"+ipFltSrcPortStart+"-"+ipFltSrcPortEnd+"</th>";itemStr+="<th id='ifDIS' style='width: 10%'>"+ipFltDstIpStart+"-"+ipFltDstIpEnd+"</th>";itemStr+="<th id='ifDPS'>"+ipFltDstPortStart+"-"+ipFltDstPortEnd+"</th>";var curSchedule=ScheduleEntry.filter(obj=>obj.schedulename===ipFilterSche);itemStr+="<th>"+GetSchedulerDayString(curSchedule[0].weekdays)+"</th>";itemStr+="<th>"+curSchedule[0].timestart.substring(0,5)+"</th>";itemStr+="<th>"+curSchedule[0].timestop.substring(0,5)+"</th>";itemStr+="</tr>";tableNode.innerHTML+=itemStr;}
function setAllDiabled(type)
{document.getElementById("at-ipfilter-mode0").disabled=type;document.getElementById("at-ipfilter-mode1").disabled=type;document.getElementById("at-ip-filter-addbtn").disabled=type;document.getElementById("at-ip-filter-delbtn").disabled=type;}
function enableSwitchClick(ob)
{var nodeId=ob.id;var switchEnableTmp=false;if(nodeId.indexOf("0")!=-1){switchEnableTmp=false;}
else if(nodeId.indexOf("1")!=-1){switchEnableTmp=true;}
setChecked("at-ipfilter-mode0",curModeType?false:true);setChecked("at-ipfilter-mode1",curModeType?true:false);if(switchEnableTmp){setAllDiabled(false);}
else{setAllDiabled(true);}}
function modeVerifyDoing()
{setChecked("at-ipfilter-mode0",curModeType?true:false);setChecked("at-ipfilter-mode1",curModeType?false:true);}
function modeSwitchClick(ob)
{var nodeId=ob.id;var switchModeTmp=false;if(nodeId.indexOf("0")!=-1){switchModeTmp=false;}
else if(nodeId.indexOf("1")!=-1){switchModeTmp=true;}
setChecked("at-ipfilter-mode0",curModeType?false:true);setChecked("at-ipfilter-mode1",curModeType?true:false);if(switchModeTmp!=curModeType){var res=confirm(_("filterModeSwitchTipText"));if(res==true){modeVerifyDoing();}}}
function ipBasicBtnClickApply()
{var enable=getChecked("at-ipfilter-enable0");var mode=getChecked("at-ipfilter-mode0");var basic={};basic.enable=1;basic.mode=1;if(enable){basic.enable=0;}
if(mode){basic.mode=0;}
var ubusparam=new Array("rtweb.ipfilter","setIpFilterBasic",basic);var jsonparam={"id":1,"params":ubusparam};sk_auth_apply(jsonparam,function(result){if(result.result[1].result==0){contentLoad();}});}
function BtnPanelShowLoad(scheItemList)
{var data={"type":"form","tittle":_("Add_IP_Filter"),"panelContent":null,"submit":"ipFilterAddApply"};var options=new Array();options.push({"value":"none","name":_("None")});options.push({"value":"tcpudp","name":_("TCP/UDP")});options.push({"value":"tcp","name":_("TCP")});options.push({"value":"udp","name":_("UDP")});options.push({"value":"icmp","name":_("ICMP")});data.panelContent=new Array();data.panelContent.push({"type":"text","id":"at-ipfilter-name","tittle":_("Filter_Name"),"value":""});data.panelContent.push({"type":"select","id":"at-ipfilter-protocol","tittle":_("Protocol"),"value":"","option":options,"onchange":"ipFilterProtocolChange"});data.panelContent.push({"type":"textrange","id":"at-ipflt-srcaddr","tittle":_("Source_Address"),"value":"","allowdstartempty":1,"allowdendempty":1});data.panelContent.push({"type":"textrange","id":"at-ipflt-srcport","tittle":_("Source_Port"),"value":"","allowdstartempty":1,"allowdendempty":1});data.panelContent.push({"type":"textrange","id":"at-ipflt-dstaddr","tittle":_("Destination_Address"),"value":"","allowdstartempty":1,"allowdendempty":1});data.panelContent.push({"type":"textrange","id":"at-ipflt-dstport","tittle":_("Destination_Port"),"value":"","allowdstartempty":1,"allowdendempty":1});data.panelContent.push({"type":"timerange","id":"sc_time","tittle":_("Time"),"value":""});data.panelContent.push({"type":"week","id":"week","tittle":_("Repeat_Period"),"value":""});panel_show(data);}
function setAddPanelStyle()
{var srcIpNode=document.getElementById("at-ipflt-srcaddrstart");var endIpNode=document.getElementById("at-ipflt-srcaddrend");document.getElementById("at-ipfilter-name").style.padding="0px 6px";document.getElementById("at-ipfilter-protocol").style.padding="0px 6px";document.getElementById("at-ipflt-srcaddrstart").style.padding="0px 6px";document.getElementById("at-ipflt-srcaddrend").style.padding="0px 6px";document.getElementById("at-ipflt-srcportstart").style.padding="0px 6px";document.getElementById("at-ipflt-srcportend").style.padding="0px 6px";document.getElementById("at-ipflt-dstaddrstart").style.padding="0px 6px";document.getElementById("at-ipflt-dstaddrend").style.padding="0px 6px";document.getElementById("at-ipflt-dstportstart").style.padding="0px 6px";document.getElementById("at-ipflt-dstportend").style.padding="0px 6px";srcIpNode.addEventListener('input',function(){if(srcIpNode.value==""){srcIpNode.style="border-color:red";}
else{srcIpNode.style="border-color:#ccc";}});endIpNode.addEventListener('input',function(){if(endIpNode.value==""){endIpNode.style="border-color:red";}
else{endIpNode.style="border-color:#ccc";}});document.getElementById("at-ipfilter-name").maxLength="32";}
function getparentChecked(id)
{return($("#"+id,document).is(':checked'));}
function getparentTime()
{var hourval_start;var minval_start;var hourval_end;var minval_end;var days='';var stimev;var etimev;var weekdays;var days_num=0;var Schedule_Name='';hourval_start=getparentValue("sc_timestarthour");if(parseInt(hourval_start)<10){hourval_start="0"+hourval_start;}
minval_start=getparentValue("sc_timestartmin");if(parseInt(minval_start)<10){minval_start="0"+minval_start;}
stimev=hourval_start+":"+minval_start;hourval_end=getparentValue("sc_timeendhour");if(parseInt(hourval_end)<10){hourval_end="0"+hourval_end;}
minval_end=getparentValue("sc_timeendmin");if(parseInt(minval_end)<10){minval_end="0"+minval_end;}
etimev=hourval_end+":"+minval_end;if(etimev==stimev){warninfo_show(_("Warning_Not_Same_Time"));return["","","",""];}
if(etimev<stimev){warninfo_show(_("Warning_Time_Start_Must_LessThen_End"));return["","","",""];}
if(getparentChecked("weekMon"))
{days+=",1";days_num=days_num+(1<<0);}
if(getparentChecked("weekTue"))
{days+=",2";days_num=days_num+(1<<1);}
if(getparentChecked("weekWed"))
{days+=",3";days_num=days_num+(1<<2);}
if(getparentChecked("weekThur"))
{days+=",4";days_num=days_num+(1<<3);}
if(getparentChecked("weekFri"))
{days+=",5";days_num=days_num+(1<<4);}
if(getparentChecked("weekSat"))
{days+=",6";days_num=days_num+(1<<5);}
if(getparentChecked("weekSun"))
{days+=",7";days_num=days_num+(1<<6);}
if(days==''){warninfo_show(_("Warning_Select_Weekdays"));return["","","",""];}
weekdays=days.substring(1);Schedule_Name="RP"+days_num+"T"+hourval_start+"h"+minval_start+"m"+"To"+hourval_end+"h"+minval_end+"m";return[stimev,etimev,weekdays,Schedule_Name];}
function schedule_checkInUse(schname)
{var numIpf=SchIpFilterArray?SchIpFilterArray.length:0;for(var k=0;k<numIpf;++k){if(schname==SchIpFilterArray[k]["schedulename"]||schname==SchIpFilterArray[k]["scheduler"]){return true;}}
return false;}
function ipFilterBtnAdd()
{var ubusparam=new Array("gwweb.schedule","getSchedule",{});var jsonparam={"id":1,"params":ubusparam};sk_auth_post(jsonparam,function(result){SchIpFilterArray=result.result[1].schedule.entries;BtnPanelShowLoad(SchIpFilterArray);setAddPanelStyle();});}
var ipVersionValue=4;function ipFilterAddApply()
{var ubusparam=new Array("rtweb.lancfg","getLanCfg",{});var jsonparam={"id":1,"params":ubusparam};sk_auth_post(jsonparam,function(result){var resArr=result.result[1];ipFilterAddApplyDoing(resArr);});}
function ipFilterAddApplyDoing(brLanInfo)
{if(!ipFilterInfoCheck(brLanInfo)){$(".warn .close").unbind("click").on("click",function(){$(".warn").remove();});return;}
var arr=getparentTime();if(arr[0]==""||arr[1]==""||arr[2]==""||arr[3]=="")
{$(".warn .close").unbind("click").on("click",function(){$(".warn").remove();});return;}
var ipFilterData={};ipFilterData.action="add";ipFilterData.ipVersion=ipVersionValue;ipFilterData.name=getValue("at-ipfilter-name");ipFilterData.scheduler=arr[3];ipFilterData.protocol=getValue("at-ipfilter-protocol");ipFilterData.srcIPStart=getValue("at-ipflt-srcaddrstart");ipFilterData.srcIPEnd=getValue("at-ipflt-srcaddrend");ipFilterData.dstIPStart=getValue("at-ipflt-dstaddrstart");ipFilterData.dstIPEnd=getValue("at-ipflt-dstaddrend");if(getValue("at-ipfilter-protocol")!="icmp"||getValue("at-ipfilter-protocol")!="none"){var ipFltsps=Number(getValue("at-ipflt-srcportstart"));var ipFltspe=Number(getValue("at-ipflt-srcportend"));var ipFltdps=Number(getValue("at-ipflt-dstportstart"));var ipFltdpe=Number(getValue("at-ipflt-dstportend"));ipFilterData.srcPortStart=ipFltsps;ipFilterData.srcPortEnd=ipFltspe;ipFilterData.dstPortStart=ipFltdps;ipFilterData.dstPortEnd=ipFltdpe;}
if((ipFilterData.srcIPStart=="")&&(ipFilterData.srcIPEnd=="")&&(ipFilterData.dstIPStart=="")&&(ipFilterData.dstIPEnd=="")&&(ipFilterData.srcPortStart==0)&&(ipFilterData.srcPortEnd==0)&&(ipFilterData.dstPortStart==0)&&(ipFilterData.dstPortEnd==0)){warninfo_show("There must be at least ip or port");return;}
if((ipFilterData.srcIPStart=="")&&(ipFilterData.srcIPEnd=="")&&(ipFilterData.dstIPStart=="")&&(ipFilterData.dstIPEnd=="")){ipFilterData.ipVersion=0;}
if(false==schedule_checkInUse(arr[3]))
{var ubusparam=new Array("gwweb.schedule","setSchedule",{"action":"add","schedulename":arr[3],"timestart":arr[0],"timestop":arr[1],"weekdays":arr[2]});var ubusparam_2=new Array("rtweb.ipfilter","setIpFilterItem",ipFilterData);var jsonparam=[{"id":1,"params":ubusparam},{"id":2,"params":ubusparam_2}];sk_auth_apply(jsonparam,function(result){hide_mode();if(result[1].result[0]==-1){warninfo_show(_(result[1].result[1].failreason));}else if(result[1].result[0]==112){warninfo_show(_(result[1].result[1].failreason));}else if(result[0].result[0]==-1){warninfo_show(_(result[0].result[1].failreason));}else if(result[0].result[0]==112){warninfo_show(_(result[0].result[1].failreason));}
pageLoad();});}
else
{var ubusparam=new Array("rtweb.ipfilter","setIpFilterItem",ipFilterData);var jsonparam={"id":1,"params":ubusparam};sk_auth_apply(jsonparam,function(result){hide_mode();if(result.result[0]==-1){warninfo_show(_(result.result[1].failreason));}else if(result.result[0]==112){warninfo_show(_(result.result[1].failreason));}
pageLoad();});}}
function ipFilterProtocolChange(ob)
{var protocol=ob.value;if(protocol=="icmp"||protocol=="none"){document.getElementById("at-ipflt-srcportstart").disabled=true;document.getElementById("at-ipflt-srcportend").disabled=true;document.getElementById("at-ipflt-dstportstart").disabled=true;document.getElementById("at-ipflt-dstportend").disabled=true;}
else{document.getElementById("at-ipflt-srcportstart").disabled=false;document.getElementById("at-ipflt-srcportend").disabled=false;document.getElementById("at-ipflt-dstportstart").disabled=false;document.getElementById("at-ipflt-dstportend").disabled=false;}}
function ipFltCheckRuleSame()
{var IpFilterNode=document.getElementsByName("at-filter-raw");var ipFilterLen=0;var protocolTmp=getShowProtocolStr(getValue("at-ipfilter-protocol"));var srcAddrTmp=getValue("at-ipflt-srcaddrstart")+'-'+getValue("at-ipflt-srcaddrend");var srcPortTmp=getValue("at-ipflt-srcportstart")+"-"+getValue("at-ipflt-srcportend");var dstAddrTmp=getValue("at-ipflt-dstaddrstart")+"-"+getValue("at-ipflt-dstaddrend");var dstPortTmp=getValue("at-ipflt-dstportstart")+"-"+getValue("at-ipflt-dstportend");ipFilterLen=IpFilterNode.length;if(ipFilterLen>0){var itemSize=IpFilterNode.length;if(itemSize>0){for(var i=0;i<itemSize;i++){if(IpFilterNode[i].getElementsByTagName("th").ifProto.innerHTML==protocolTmp&&IpFilterNode[i].getElementsByTagName("th").ifSIS.innerHTML==srcAddrTmp&&IpFilterNode[i].getElementsByTagName("th").ifSPS.innerHTML==srcPortTmp&&IpFilterNode[i].getElementsByTagName("th").ifDIS.innerHTML==dstAddrTmp&&IpFilterNode[i].getElementsByTagName("th").ifDPS.innerHTML==dstPortTmp){warninfo_show(_("Warn_Filter_Same"));return false;}}}}
return true;}
function getSubRange(ip,mask)
{var lanGwIp=ip.split(".");var lanNetMask=mask.split(".");var startIpArr=[];var endIpArr=[];var startIp="";var endIp="";for(var i=0;i<4;i++){lanGwIp[i]=('00000000'+Number(lanGwIp[i]).toString(2)).slice(-8);lanNetMask[i]=('00000000'+Number(lanNetMask[i]).toString(2)).slice(-8);startIpArr[i]=lanGwIp[i];endIpArr[i]=lanGwIp[i];for(var j=0;j<8;j++){if(lanNetMask[i][j]=='0'){startIpArr[i]=startIpArr[i].substring(0,j)+"0"+startIpArr[i].substring(j+1);endIpArr[i]=endIpArr[i].substring(0,j)+"1"+endIpArr[i].substring(j+1);}}
startIpArr[i]=parseInt(startIpArr[i],2);endIpArr[i]=parseInt(endIpArr[i],2);startIp+=startIpArr[i];endIp+=endIpArr[i];if(i<3){startIp+=".";endIp+=".";}}
return{startIp,endIp};}
function ipFltCheckIP()
{var ipFltSrcIPSValue=getValue("at-ipflt-srcaddrstart");var ipFltSrcIPEValue=getValue("at-ipflt-srcaddrend");var ipFltDstIPSValue=getValue("at-ipflt-dstaddrstart");var ipFltDstIPEValue=getValue("at-ipflt-dstaddrend");var ipVersionFlag=0;if(ipFltSrcIPSValue!=""&&ipFltSrcIPEValue!=""){if(isValidIpAddress(ipFltSrcIPSValue)){ipVersionFlag=4;}
else if(isValidIpv6Address(ipFltSrcIPSValue)){ipVersionFlag=6;}
else{warninfo_show(_("Warn_Format_Error")+": "+ipFltSrcIPSValue);return false;}
if(isValidIpAddress(ipFltSrcIPEValue)){if(ipVersionFlag!=4){warninfo_show(_("Warn_Srcip_Version_Mismatch"));return false;}
if(!cmpIpAddress(ipFltSrcIPSValue,ipFltSrcIPEValue)){warninfo_show(_("Warn_Srcip_Range_Error"));return false;}}
else if(isValidIpv6Address(ipFltSrcIPEValue)){if(ipVersionFlag!=6){warninfo_show(_("Warn_Srcip_Version_Mismatch"));return false;}
if(!cmpIpv6Address(ipFltSrcIPSValue,ipFltSrcIPEValue)){warninfo_show(_("Warn_Srcip_Range_Error"));return false;}}
else{warninfo_show(_("Warn_Format_Error")+": "+ipFltSrcIPEValue);return false;}}
if(ipFltDstIPSValue!=""){if(ipFltDstIPEValue==""){warninfo_show(_("Warn_DstIp_Cannot_Be_NULL"));return false;}
if(isValidIpAddress(ipFltDstIPSValue)){if(ipVersionFlag!=4){warninfo_show(_("Warn_DstIp_Version_Mismatch"));return false;}}
else if(isValidIpv6Address(ipFltDstIPSValue)){if(ipVersionFlag!=6){warninfo_show(_("Warn_DstIp_Version_Mismatch"));return false;}}
else{warninfo_show(_("Warn_Format_Error")+": "+ipFltDstIPSValue);return false;}
if(isValidIpAddress(ipFltDstIPEValue)){if(ipVersionFlag!=4){warninfo_show(_("Warn_DstIp_Version_Mismatch"));return false;}
if(!cmpIpAddress(ipFltDstIPSValue,ipFltDstIPEValue)){warninfo_show(_("Warn_DstIp_Range_Error"));return false;}}
else if(isValidIpv6Address(ipFltDstIPEValue)){if(ipVersionFlag!=6){warninfo_show(_("Warn_DstIp_Version_Mismatch"));return false;}
if(!cmpIpv6Address(ipFltDstIPSValue,ipFltDstIPEValue)){warninfo_show(_("Warn_DstIp_Range_Error"));return false;}}
else{warninfo_show(_("Warn_Format_Error")+": "+ipFltDstIPEValue);return false;}}
else{if(ipFltDstIPEValue!=""){warninfo_show(_("Warn_DstIp_Cannot_Be_NULL"));return false;}}
ipVersionValue=ipVersionFlag;return true;}
function ipFltCheckPort()
{var ipFltSrcPortSValue=getValue("at-ipflt-srcportstart");var ipFltSrcPortEValue=getValue("at-ipflt-srcportend");var ipFltDstPortSValue=getValue("at-ipflt-dstportstart");var ipFltDstPortEValue=getValue("at-ipflt-dstportend");var ipFilterProtocolValue=getValue("at-ipfilter-protocol");if(ipFilterProtocolValue=="icmp"||ipFilterProtocolValue=="none"){if(ipFltSrcPortSValue!=0||ipFltSrcPortEValue!=0||ipFltDstPortSValue!=0||ipFltDstPortEValue!=0){warninfo_show(_("Warn_ICMP_NONE_Neednt_Port"));return false;}}
if(Number(ipFltSrcPortSValue)>Number(ipFltSrcPortEValue)){warninfo_show(_("Warn_Source_Port_Range_Error"));return false;}
if(Number(ipFltDstPortSValue)>Number(ipFltDstPortEValue)){warninfo_show(_("Warn_Dest_Port_Range_Error"));return false;}
if(!isValidPort(ipFltSrcPortSValue)||!isValidPort(ipFltSrcPortEValue)||!isValidPort(ipFltDstPortSValue)||!isValidPort(ipFltDstPortEValue)){warninfo_show(_("Warn_Port_Invalid"));return false;}
return true;}
function ipFltCheckIPValid(brLanInfo)
{var ipFltSrcIPSValue=getValue("at-ipflt-srcaddrstart");var ipFltSrcIPEValue=getValue("at-ipflt-srcaddrend");var ipFltDstIPSValue=getValue("at-ipflt-dstaddrstart");var ipFltDstIPEValue=getValue("at-ipflt-dstaddrend");var brLanAddr=brLanInfo.ipaddr;var brLanMask=brLanInfo.subnetmask;if(ipVersionValue==4&&(!isSameSubNet(ipFltSrcIPSValue,brLanMask,brLanAddr,brLanMask)||!isSameSubNet(ipFltSrcIPEValue,brLanMask,brLanAddr,brLanMask))){warninfo_show(_("Warn_SrcIp_Need_LanSubnet"));return false;}
if(ipVersionValue==4){var lanInfo=getSubRange(brLanAddr,brLanMask);if(ipFltSrcIPSValue==lanInfo.startIp||ipFltSrcIPSValue==lanInfo.endIp||ipFltSrcIPEValue==lanInfo.startIp||ipFltSrcIPEValue==lanInfo.endIp){warninfo_show(_("Warn_SrcIp_No_Valid"));return false;}}
if(ipVersionValue==6&&(!(ipFltSrcIPSValue!=""&&isGlobalIpv6Address(ipFltSrcIPSValue))||!(ipFltSrcIPEValue!=""&&isGlobalIpv6Address(ipFltSrcIPEValue)))){warninfo_show(_("Warn_SrcIpv6_Not_Global"));return false;}
if(ipVersionValue==6&&(ipFltDstIPSValue!=""&&ipFltDstIPEValue!="")&&(!isGlobalIpv6Address(ipFltDstIPSValue)||!isGlobalIpv6Address(ipFltDstIPEValue))){warninfo_show(_("Warn_DstIpv6_Not_Global"));return false;}
if(ipVersionValue==6&&((ipFltSrcIPSValue!=""&&isMultiCastIpv6Address(ipFltSrcIPSValue))||(ipFltSrcIPEValue!=""&&isMultiCastIpv6Address(ipFltSrcIPEValue)))){warninfo_show(_("Warn_SrcIpv6_Is_Multicast"));return false;}
if(ipVersionValue==6&&(ipFltDstIPSValue!=""&&ipFltDstIPEValue!="")&&(isMultiCastIpv6Address(ipFltDstIPSValue))||isMultiCastIpv6Address(ipFltDstIPEValue)){warninfo_show(_("Warn_DstIpv6_Is_Multicast"));return false;}
return true;}
function ipFilterInfoCheck(brLanInfo)
{var IpFilterNode=document.getElementsByName("at-ipfilter-item");var ipFltNameValue=getValue("at-ipfilter-name");var ipFilterLen=0;var sameFlag=0;ipFilterLen=IpFilterNode.length;if(ipFilterLen>0){var itemSize=IpFilterNode.length;if(itemSize>0){for(var i=0;i<itemSize;i++){if(IpFilterNode[i].id.split('-')[1]==ipFltNameValue){sameFlag=1;}}}
else{if(IpFilterNode.id.split('-')[1]==ipFltNameValue){sameFlag=1;}}}
if(ipFltNameValue.length>32||ipFltNameValue.length<=0){warninfo_show(_("Warn_Filter_Name_Length"));return false;}
if(sameFlag){warninfo_show(_("Warn_Filter_Name_Exist")+": "+ipFltNameValue);return false;}
if(!isValidName(ipFltNameValue)){warninfo_show(_("Warn_Filter_Name_Valid"));return false;}
if(!ipFltCheckRuleSame()){return false;}
if(!ipFltCheckIP()){return false;}
if(!ipFltCheckPort()){return false;}
if(!ipFltCheckIPValid(brLanInfo)){return false;}
return true;}
function deleteIPfilterArrayAndGetScheduleName(nameToDelete){let deletedScheduleName="";let outArray=SchIpFilterArray.filter(obj=>{if(obj.filterName===nameToDelete){deletedScheduleName=obj.scheduler;return false;}
return true;});SchIpFilterArray=outArray;return deletedScheduleName;}
function findByName(nameToFind){return}
function ipFilterBtnDel()
{var itemList=document.getElementsByName("at-ipfilter-item");var itemSize=0;var jsonArr=[];var paramId=1;if(itemList==null){return;}
itemSize=itemList.length;if(itemSize>0){for(var i=0;i<itemSize;i++){if(!itemList[i].checked){continue;}
var ipFilterNameValue=itemList[i].id.split("-")[1];var ipFilterData={};ipFilterData.action="del";ipFilterData.name=ipFilterNameValue;jsonArr.push({"id":(paramId++),"params":new Array("rtweb.ipfilter","setIpFilterItem",ipFilterData)});var schedule_name=deleteIPfilterArrayAndGetScheduleName(ipFilterNameValue);if(false==schedule_checkInUse(schedule_name))
{var curSchedule=ScheduleEntry.filter(obj=>obj.schedulename===schedule_name);jsonArr.push({"id":(paramId++),"params":new Array("gwweb.schedule","setSchedule",{"action":"del","schedulename":schedule_name,"timestart":curSchedule[0].timestart,"timestop":curSchedule[0].timestop,"weekdays":curSchedule[0].weekdays})});}}}
else{if(itemList.checked){var ipFilterNameValue=itemList.id.split("-")[1];var ipFilterData={};ipFilterData.action="del";ipFilterData.name=ipFilterNameValue;jsonArr.push({"id":1,"params":new Array("rtweb.ipfilter","setIpFilterItem",ipFilterData)});var schedule_name=deleteIPfilterArrayAndGetScheduleName(ipFilterNameValue);if(false==schedule_checkInUse(schedule_name))
{var curSchedule=ScheduleEntry.filter(obj=>obj.schedulename===schedule_name);jsonArr.push({"id":2,"params":new Array("gwweb.schedule","setSchedule",{"action":"del","schedulename":schedule_name,"timestart":curSchedule[0].timestart,"timestop":curSchedule[0].timestop,"weekdays":curSchedule[0].weekdays})});}}}
if(!jsonArr.length){warninfo_show(_("deleteError"));return;}
sk_auth_apply(jsonArr,function(result){ipFilterInfoTableLoad();});}
function ipFilterSelectAllClick(ob)
{var itemList=document.getElementsByName("at-ipfilter-item");var itemSize=itemList.length;if(ob.checked){for(var i=0;i<itemSize;i++){itemList[i].checked=true;}
ob.checked=true;}
else{for(var i=0;i<itemSize;i++){itemList[i].checked=false;}
ob.checked=false;}}