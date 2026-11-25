
function pageLoad()
{console.log("MAC过滤页面初始化");getStaInfo();macf_getSchedule();}
var MacFilterEnable;var MacFilterMode;var MacFilterEntry;var mfstalist=new Array();var MacfScheduleEntry;function macf_getSchedule()
{var ubusparam=new Array("gwweb.schedule","getSchedule",{});var jsonparam={"id":1,"params":ubusparam};sk_auth_post(jsonparam,function(result){console.log(result.result[1]);MacfScheduleEntry=result.result[1]["schedule"]["entries"];setTimeout(getMacFilter(),300);});}
function macf_getScheduleEntryNumber()
{return MacfScheduleEntry?MacfScheduleEntry.length:0;}
function getStaInfo()
{var ubusparam=new Array("rtweb.sta","getStaInfo",{});var jsonparam={"id":1,"params":ubusparam};sk_auth_post(jsonparam,function(result){console.log(result.result[1]);mfstalist=[];for(var i=0;i<result.result[1].total;i++)
{var pData=result.result[1].staDevices[i];mfstalist.push({"hostname":pData.hostname,"macaddr":pData.macAddr,});}});}
function getMacfEntryNumber()
{return MacFilterEntry?MacFilterEntry.length:0;}
var curModeType;function getMacFilter()
{var ubusparam=new Array("rtweb.macfilter","getMacFilter",{});var jsonparam={"id":1,"params":ubusparam};sk_auth_post(jsonparam,function(result){console.log(result.result[1]);MacFilterEnable=result.result[1]["macfilter"]["enable"];MacFilterMode=result.result[1]["macfilter"]["mode"];MacFilterEntry=result.result[1]["macfilter"]["entries"];curModeType=MacFilterMode;macf_pageGetValue();macf_cleanMacTable();macf_showTable();});}
function macf_getScheduleParaByName(schname)
{var timestart="",timestop="",weekdays="";if(schname=="Always"){return["","",""];}
var num=macf_getScheduleEntryNumber();for(var i=0;i<num;++i){if(schname==MacfScheduleEntry[i]["schedulename"]){timestart=MacfScheduleEntry[i]["timestart"];timestop=MacfScheduleEntry[i]["timestop"];weekdays=MacfScheduleEntry[i]["weekdays"];}}
return[timestart,timestop,weekdays];}
function macf_getScheduleName(timestart,timestop,weekdays)
{if((timestart==""||timestart.substring(0,5)=="00:00")&&(timestop==""||timestop.substring(0,5)=="23:59")&&(weekdays=="1,2,3,4,5,6,7"||weekdays=="")){return"Always";}
var num=macf_getScheduleEntryNumber();for(var i=0;i<num;++i){if(timestart==MacfScheduleEntry[i]["timestart"]&&timestop==MacfScheduleEntry[i]["timestop"]&&weekdays==MacfScheduleEntry[i]["weekdays"]){return MacfScheduleEntry[i]["schedulename"];}}
return"undefined";}
function setMacFilter(action,enable,mode,filtername,mac,timestart,timestop,weekdays,schedule)
{var ubusparam=new Array("rtweb.macfilter","setMacFilter",{"enable":enable,"mode":mode,"action":action,"filtername":filtername,"mac":mac,"timestart":timestart,"timestop":timestop,"weekdays":weekdays,"extra":schedule});var jsonparam={"id":1,"params":ubusparam};sk_auth_apply(jsonparam,function(result){console.log(result.result[1]);if(result.result[1]["result"]=="0"){setTimeout(getMacFilter(),300);}});}
function macf_pageGetValue(){if(MacFilterEnable=="1"){macf_switchType0.checked=false;macf_switchType1.checked=true;macf_policyType0.disabled=false;}else{macf_switchType0.checked=true;macf_switchType1.checked=false;macf_policyType0.disabled=true;}
if(MacFilterMode=="1"){macf_policyType0.checked=false;}else{macf_policyType0.checked=true;}}
function macf_cleanMacTable()
{var rownum=getObj("macf_MAC_Table").rows.length-1;for(var row=0;row<rownum;++row){getObj("macf_MAC_Table").deleteRow(rownum-row);}}
function fucon(){}
function fucoff(){}
function modeVerifyDoing()
{setChecked("macf_policyType0",curModeType?true:false);}
function chgPolicy(tmp){var switchModeTmp=false;if(tmp==0){switchModeTmp=false;}
else if(tmp==1){switchModeTmp=true;}
setChecked("macf_policyType0",curModeType?false:true);if(switchModeTmp!=curModeType){var res=confirm(_("filterModeSwitchTipText"));if(res==true){modeVerifyDoing();}}}
function macf_deleteAllEntry()
{var jsonArr=[];var paramId=1;var selist=document.getElementsByName("rml");if(selist.length=0){return;}
for(i=0;i<selist.length;i++){var mac=selist[i].value.split("#")[0];var schEntryStr=selist[i].value.split("#")[1];console.log("mac="+mac+" schedule="+schEntryStr);var timestart=schEntryStr.split("|")[0];var timestop=schEntryStr.split("|")[1];var weekdays=schEntryStr.split("|")[2];jsonArr.push({"id":(paramId++),"params":new Array("rtweb.macfilter","setMacFilter",{"enable":MacFilterEnable,"mode":MacFilterMode,"action":"del","filtername":null,"mac":mac,"timestart":timestart,"timestop":timestop,"weekdays":weekdays})});}
if(paramId==1){return;}
sk_auth_apply(jsonArr,function(result){setTimeout(getMacFilter(),300);});}
function Macf_BntClick_Apply()
{var newEnable=0;var newMode=0;if(macf_switchType1.checked){newEnable=1;}
if(newEnable==MacFilterEnable&&newMode==MacFilterMode){console.log("no change: enable="+newEnable+" mode="+newMode);return;}
if(newEnable=="0"){newMode=MacFilterMode;}
if(newMode!=MacFilterMode){macf_deleteAllEntry();}
setMacFilter("apply",newEnable,newMode,null,null,null,null,null,null);loading_show();}
function getImage(src,strmethod,Btn_id)
{return("<input type=\"button\" id=\""+Btn_id+"\"  onclick=\""+strmethod
+"\" style=\"width:20px;height:20px;border:0px;padding:2px;cursor:pointer;background:url("+src+");\">");}
function macf_getHostnameByMac(mac)
{for(var i=0;i<mfstalist.length;i++){if(mac==mfstalist[i]["macaddr"]){return mfstalist[i]["hostname"];}}
return"";}
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
function macfilter_enable(obj)
{var mac=obj.value.split("#")[0];var filtername=obj.value.split("#")[1];var enable=0;if(obj.checked==true)
enable=1;var action="fptSet";var ubusparam=new Array("rtweb.macfilter","setMacFilter",{"action":action,"filtername":filtername,"actenable":enable,"mac":mac});var jsonparam={"id":1,"params":ubusparam};sk_auth_apply(jsonparam,function(result){console.log(result.result[1]);if(result.result[1]["result"]=="0"){setTimeout(getMacFilter(),300);}});}
function macf_addline(index)
{var newline=getObj("macf_MAC_Table").insertRow(-1);var optionVal="";var newCell;var scheduleName=macf_getScheduleName(MacFilterEntry[index]["timestart"],MacFilterEntry[index]["timestop"],MacFilterEntry[index]["weekdays"]);var schEntryStr=MacFilterEntry[index]["timestart"]+"|"+MacFilterEntry[index]["timestop"]+"|"+MacFilterEntry[index]["weekdays"]+"|"+scheduleName;var weekdays="1,2,3,4,5,6,7";var timestart="00:00";var timestop="23:59";if(scheduleName!="Always")
{weekdays=MacFilterEntry[index]["weekdays"];timestart=MacFilterEntry[index]["timestart"].substring(0,5);timestop=MacFilterEntry[index]["timestop"].substring(0,5);}
optionVal="<tr><td><label class='skcheckbox'> <input type='checkbox' id='rml"+index+"' name='rml' value='"+MacFilterEntry[index]["mac"]+"#"+
schEntryStr+"' hidden><label for='rml"+index+"' class='skcheckbox-label'></label></label></td>";newCell=newline.insertCell(-1);newCell.align="center";newCell.innerHTML=optionVal;{newCell=newline.insertCell(-1);newCell.align="center";newCell.innerHTML=MacFilterEntry[index]["filtername"];}
{newCell=newline.insertCell(-1);newCell.align="center";newCell.innerHTML=MacFilterEntry[index]["mac"];}
{newCell=newline.insertCell(-1);newCell.align="center";newCell.innerHTML=GetSchedulerDayString(weekdays);}
{newCell=newline.insertCell(-1);newCell.align="center";newCell.innerHTML=timestart;}
{newCell=newline.insertCell(-1);newCell.align="center";newCell.innerHTML=timestop;}
{optionVal="<td><label class='skcheckbox'> <input type='checkbox' id='rmlEnable"+index+"' name='rmlEnable' onClick='macfilter_enable(this)' value = '"+
MacFilterEntry[index]["mac"]+"#"+MacFilterEntry[index]["filtername"]+"'";if(MacFilterEntry[index]["actenable"]==1)
optionVal+=" hidden checked>";else
optionVal+=" hidden>";optionVal+="<label for='rmlEnable"+index+"' class='skcheckbox-label'></label></label></td>";newCell=newline.insertCell(-1);newCell.align="center";newCell.innerHTML=optionVal;}}
function macf_showTable()
{var num=getMacfEntryNumber();if(num!=0){for(var i=0;i<num;i++){macf_addline(i);}
seletall.checked=false;seletall.disabled=false;}else{var newline=getObj("macf_MAC_Table").insertRow(-1);newline.setAttribute("align","center");var objcell=newline.insertCell(-1);objcell.colSpan=7;objcell.innerHTML=_("No_Data_Yet")
seletall.checked=false;seletall.disabled=true;}}
function selectAll(obj)
{var selist=document.getElementsByName("rml");if(selist.length=0)
return;for(i=0;i<selist.length;i++){if($(obj).is(':checked'))
selist[i].checked=true;else
selist[i].checked=false;}}
function Macf_removeClick(rml){if(MacFilterEnable=='0')
{warninfo_show(_("Warning_Enable_first"));return;}
var selist=document.getElementsByName("rml");if(selist.length=0){return;}
var jsonArr=[];var paramId=1;for(i=0;i<selist.length;i++){if(selist[i].checked==true){var mac=selist[i].value.split("#")[0];var schEntryStr=selist[i].value.split("#")[1];console.log("mac="+mac+" schedule="+schEntryStr);var timestart=schEntryStr.split("|")[0];var timestop=schEntryStr.split("|")[1];var weekdays=schEntryStr.split("|")[2];jsonArr.push({"id":(paramId++),"params":new Array("rtweb.macfilter","setMacFilter",{"enable":MacFilterEnable,"mode":MacFilterMode,"action":"del","filtername":null,"mac":mac,"timestart":timestart,"timestop":timestop,"weekdays":weekdays})});}}
if(paramId==1){return;}
sk_auth_apply(jsonArr,function(result){setTimeout(getMacFilter(),300);});}
function macf_select_dev(obj)
{if(obj.value=="manulMac"){$("#MfMac",document).val("");$("#MfMac",document).attr("disabled",false);$("#FilterName",document).val("");}
else{var paramList=obj.value.split(',');$("#MfMac",document).val(paramList[0]);$("#MfMac",document).attr("disabled",true);$("#FilterName",document).val(paramList[1]);}}
function getparentChecked(id)
{return($("#"+id,document).is(':checked'));}
function getparentTime()
{var hourval;var minval;var days='';var stimev;var etimev;var weekdays;hourval=getparentValue("sc_timestarthour");if(parseInt(hourval)<10){hourval="0"+hourval;}
minval=getparentValue("sc_timestartmin");if(parseInt(minval)<10){minval="0"+minval;}
stimev=hourval+":"+minval;hourval=getparentValue("sc_timeendhour");if(parseInt(hourval)<10){hourval="0"+hourval;}
minval=getparentValue("sc_timeendmin");if(parseInt(minval)<10){minval="0"+minval;}
etimev=hourval+":"+minval;if(etimev==stimev){warninfo_show(_("Warning_Not_Same_Time"));return["","",""];;}
if(etimev<stimev){warninfo_show(_("Warning_Time_Start_Must_LessThen_End"));return["","",""];;}
if(getparentChecked("weekMon"))
days+=",1";if(getparentChecked("weekTue"))
days+=",2";if(getparentChecked("weekWed"))
days+=",3";if(getparentChecked("weekThur"))
days+=",4";if(getparentChecked("weekFri"))
days+=",5";if(getparentChecked("weekSat"))
days+=",6";if(getparentChecked("weekSun"))
days+=",7";if(days==''){warninfo_show(_("Warning_Select_Weekdays"));return["","",""];;}
weekdays=days.substring(1);return[stimev+":00",etimev+":59",weekdays];}
function add_macfilter_rule()
{var macAddr=getparentValue("MfMac");console.log("macAddr="+macAddr);if(true==macf_pageCheckValue(-1))
{var arr=getparentTime();var TimeCheckErr=false;if(arr[0]==""||arr[1]==""||arr[2]=="")
{$(".warn .close").unbind("click").on("click",function(){$(".warn").remove();});return;}
var macAddr=getparentValue("MfMac");var filterName=getparentValue("FilterName");hide_mode();loading_show();var timestart=arr[0];var timestop=arr[1];var weekdays=arr[2];setMacFilter("fptAdd",MacFilterEnable,MacFilterMode,filterName,macAddr,timestart,timestop,weekdays,null);}
else
{$(".warn .close").unbind("click").on("click",function(){$(".warn").remove();});}}
function Macf_btnAdd()
{if(MacFilterEnable=='0')
{warninfo_show(_("Warning_Enable_first"));return;}
if(getMacfEntryNumber()>31)
{warninfo_show(_("Warning_Maximum_32_Rules"));return;}
var data={"type":"form","tittle":_("Add_New_Rule"),"panelContent":null,"submit":"add_macfilter_rule"};data.panelContent=new Array();var options=new Array();options.push({"value":"manulMac","name":_("User_Define_Select")});$.each(mfstalist,function(index,obj){var param=[obj.macaddr,obj.hostname];options.push({"value":param,"name":obj.hostname+" ("+obj.macaddr+")"});});data.panelContent.push({"type":"select","id":"userMac","tittle":_("Select_Device"),"value":"","option":options,"onchange":"macf_select_dev"});data.panelContent.push({"type":"text","id":"FilterName","tittle":_("Filter_Name"),"value":""});data.panelContent.push({"type":"text","id":"MfMac","datatype":"macaddr","tittle":_("MAC_Address"),"value":""});data.panelContent.push({"type":"timerange","id":"sc_time","tittle":_("Time"),"value":""});data.panelContent.push({"type":"week","id":"week","tittle":_("Repeat_Period"),"value":""});panel_show(data);getObj("FilterName").style.padding="0px 6px";getObj("MfMac").style.padding="0px 6px";}
function getparentValue(id)
{return($("#"+id,document).val());}
function CheckMac(Addr)
{var c='';var i=0,j=0;var len=Addr.length;var addrParts;if(len==12)
{for(i=0;i<Addr.length;i++)
{c=Addr.charAt(j);if((c>='0'&&c<='9')||(c>='a'&&c<='f'))
{continue;}
else
{return false;}}}
else if(len=17)
{if(Addr.search(':')!=-1)
{addrParts=Addr.split(':');}
else if(Addr.search("-")!=-1)
{addrParts=Addr.split('-');}
else
{return false;}
for(i=0;i<6;i++)
{if(addrParts[i].length!=2)
{return false;}
for(j=0;j<addrParts[i].length;j++)
{c=addrParts[i].toLowerCase().charAt(j);if((c>='0'&&c<='9')||(c>='a'&&c<='f'))
{continue;}
else
{return false;}}}}
else
{return false;}
return true;}
function macf_checkSameEntry(macAddr,schedule)
{var arr=macf_getScheduleParaByName(schedule);var timestart=arr[0];var timestop=arr[1];var weekdays=arr[2];var num=getMacfEntryNumber();for(var i=0;i<num;i++){if(macAddr.toLowerCase()==MacFilterEntry[i]["mac"].toLowerCase()&&timestart==MacFilterEntry[i]["timestart"]&&timestop==MacFilterEntry[i]["timestop"]&&weekdays==MacFilterEntry[i]["weekdays"]){return false;}}
return true;}
function macf_pageCheckValue(index)
{var msg="";var macAddr=getparentValue("MfMac");console.log("macAddr="+macAddr);var schedule=getparentValue("MfMacScheduleName");var filterName=getparentValue("FilterName");if(filterName.length<=0||filterName.length>32){warninfo_show(_("Warn_Filter_Name_Length"));return false;}
if(index==-1){if(getMacfEntryNumber()>=32){warninfo_show(_("Warning_Maximum_32_Rules"));return false;}}
if(macAddr=="")
{warninfo_show(_("Warning_MAC_NULL"));return false;}
if(CheckMac(macAddr)!=true||macAddr.toLowerCase()=="ff:ff:ff:ff:ff:ff"||macAddr=="00:00:00:00:00:00")
{warninfo_show(_("Waning_MAC_Invalid"));return false;}
var num=getMacfEntryNumber();for(var i=0;i<num;i++){if(filterName==MacFilterEntry[i]["filtername"])
{warninfo_show(_("Warning_Filtername_Exist"));return false;}
if(macAddr.toLowerCase()==MacFilterEntry[i]["mac"].toLowerCase())
{warninfo_show(_("Warning_Mac_Exist"));return false;}}
return true;}