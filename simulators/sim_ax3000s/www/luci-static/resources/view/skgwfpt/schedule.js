
function pageLoad()
{console.log("schedule页面初始化");getSchedule();schedule_getMacFilter();schedule_getUrlFilter();schedule_getIpFilter();}
var dayslst=new Array("Mon","Tue","Wed","Thu","Fri","Sat","Sun");var ScheduleEntry;var SchMacFilterArray;var SchUrlFilterArray;var SchIpFilterArray;function schedule_getMacFilter()
{var ubusparam=new Array("rtweb.macfilter","getMacFilter",{});var jsonparam={"id":1,"params":ubusparam};sk_auth_post(jsonparam,function(result){console.log(result.result[1]);SchMacFilterArray=result.result[1]["macfilter"]["entries"];});}
function schedule_getUrlFilter()
{var ubusparam=new Array("rtweb.urlfilter","getUrlFilter",{});var jsonparam={"id":1,"params":ubusparam};sk_auth_post(jsonparam,function(result){console.log(result.result[1]);SchUrlFilterArray=result.result[1]["urlfilter"]["entries"];});}
function schedule_getIpFilter()
{var ubusparam=new Array("rtweb.ipfilter","getIpFilterItem",{});var jsonparam={"id":1,"params":ubusparam};sk_auth_post(jsonparam,function(result){console.log(result.result[1]);SchIpFilterArray=result.result[1]["ipfilter"]["entries"];});}
function schedule_checkInUse(schname,timestart,timestop,weekdays)
{var numMacf=SchMacFilterArray?SchMacFilterArray.length:0;for(var i=0;i<numMacf;++i){if(timestart==SchMacFilterArray[i]["timestart"]&&timestop==SchMacFilterArray[i]["timestop"]&&weekdays==SchMacFilterArray[i]["weekdays"]){return true;}}
var numUrlf=SchUrlFilterArray?SchUrlFilterArray.length:0;for(var j=0;j<numUrlf;++j){if(timestart==SchUrlFilterArray[j]["timestart"]&&timestop==SchUrlFilterArray[j]["timestop"]&&weekdays==SchUrlFilterArray[j]["weekdays"]){return true;}}
var numIpf=SchIpFilterArray?SchIpFilterArray.length:0;for(var k=0;k<numIpf;++k){if(schname==SchIpFilterArray[k]["scheduler"]){return true;}}
return false;}
function getScheduleEntryNumber()
{return ScheduleEntry?ScheduleEntry.length:0;}
function getSchedule()
{var ubusparam=new Array("gwweb.schedule","getSchedule",{});var jsonparam={"id":1,"params":ubusparam};sk_auth_post(jsonparam,function(result){console.log(result.result[1]);ScheduleEntry=result.result[1]["schedule"]["entries"];schedule_cleanTable();schedule_showTable();});}
function setSchedule(action,schedulename,timestart,timestop,weekdays)
{var ubusparam=new Array("gwweb.schedule","setSchedule",{"action":action,"schedulename":schedulename,"timestart":timestart,"timestop":timestop,"weekdays":weekdays});var jsonparam={"id":1,"params":ubusparam};sk_auth_apply(jsonparam,function(result){console.log(result.result[1]);if(result.result[1]["result"]=="0"){setTimeout(getSchedule(),300);}});}
function schedule_cleanTable()
{var rownum=getObj("Tbl_Scheduler").rows.length-1;for(var row=0;row<rownum;++row){getObj("Tbl_Scheduler").deleteRow(rownum-row);}}
function schedule_showTable()
{var num=getScheduleEntryNumber();if(num!=0){for(var i=0;i<num;i++){schedule_addline(i);}
schedule_seletall.checked=false;schedule_seletall.disabled=false;}else{var newline=getObj("Tbl_Scheduler").insertRow(-1);newline.setAttribute("align","center");var objcell=newline.insertCell(-1);objcell.colSpan=5;objcell.innerHTML=_("No_Data_Yet");schedule_seletall.checked=false;schedule_seletall.disabled=true;}}
function schedule_addline(index)
{var newline=getObj("Tbl_Scheduler").insertRow(-1);var optionVal="";var newCell;var schEntryStr=ScheduleEntry[index]["timestart"]+"|"+ScheduleEntry[index]["timestop"]+"|"+
ScheduleEntry[index]["weekdays"]+"|"+ScheduleEntry[index]["schedulename"];optionVal="<tr><td><label class='skcheckbox'> <input type='checkbox' id='rml"+index+"' name='rml' value='"+schEntryStr+"' hidden><label for='rml"+index+"' class='skcheckbox-label'></label></label></td>";newCell=newline.insertCell(-1);newCell.align="center";newCell.innerHTML=optionVal;{newCell=newline.insertCell(-1);newCell.align="center";newCell.innerHTML=ScheduleEntry[index]["schedulename"];}
{newCell=newline.insertCell(-1);newCell.align="center";newCell.innerHTML=GetSchedulerDayString(ScheduleEntry[index]["weekdays"]);}
{newCell=newline.insertCell(-1);newCell.align="center";newCell.innerHTML=ScheduleEntry[index]["timestart"].substring(0,5);}
{newCell=newline.insertCell(-1);newCell.align="center";newCell.innerHTML=ScheduleEntry[index]["timestop"].substring(0,5);}}
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
function schedule_selectAll(obj)
{var selist=document.getElementsByName("rml");if(selist.length=0)
return;for(i=0;i<selist.length;i++){if($(obj).is(':checked'))
selist[i].checked=true;else
selist[i].checked=false;}}
function BtnClick_SchedulerAdd()
{if(getScheduleEntryNumber()>31)
{warninfo_show(_("Warning_Maximum_32_Rules"));return;}
var data={"type":"form","tittle":_("Add_New_Scheduler"),"panelContent":null,"submit":"BtnClick_SchedulerAddApply"};data.panelContent=new Array();data.panelContent.push({"type":"text","id":"sc_name","tittle":_("Schedule_Name"),"value":""});data.panelContent.push({"type":"timerange","id":"sc_time","tittle":_("Time"),"value":""});data.panelContent.push({"type":"week","id":"week","tittle":_("Repeat_Period"),"value":""});panel_show(data);getObj("sc_name").style.padding="0px 6px";}
function getparentValue(id)
{return($("#"+id,document).val());}
function getparentChecked(id)
{return($("#"+id,document).is(':checked'));}
function BtnClick_SchedulerAddApply()
{var schname=getparentValue("sc_name");var hourval;var minval;var days='';var stimev;var etimev;var weekdays;if(schname==''){warninfo_show(_("Warning_Enter_Schedule_Name"));return;}else if(isValidName(getparentValue("sc_name"))==false){warninfo_show(_("Warning_Enter_Valid_Rule_Name_No_Special"));return;}else if(schname=="Always"){warninfo_show(_("Warning_Enter_Valid_Rule_Name"));return;}
if(schname.length<=0||schname.length>32){warninfo_show(_("Warn_Filter_Name_Length"));return;}
hourval=getparentValue("sc_timestarthour");if(parseInt(hourval)<10){hourval="0"+hourval;}
minval=getparentValue("sc_timestartmin");if(parseInt(minval)<10){minval="0"+minval;}
stimev=hourval+":"+minval;hourval=getparentValue("sc_timeendhour");if(parseInt(hourval)<10){hourval="0"+hourval;}
minval=getparentValue("sc_timeendmin");if(parseInt(minval)<10){minval="0"+minval;}
etimev=hourval+":"+minval;if(etimev==stimev){warninfo_show(_("Warning_Not_Same_Time"));return;}
if(etimev<stimev){warninfo_show(_("Warning_Time_Start_Must_LessThen_End"));return;}
if(getparentChecked("weekMon"))
days+=",1";if(getparentChecked("weekTue"))
days+=",2";if(getparentChecked("weekWed"))
days+=",3";if(getparentChecked("weekThur"))
days+=",4";if(getparentChecked("weekFri"))
days+=",5";if(getparentChecked("weekSat"))
days+=",6";if(getparentChecked("weekSun"))
days+=",7";if(days==''){warninfo_show(_("Warning_Select_Weekdays"));return;}
weekdays=days.substring(1);var num=getScheduleEntryNumber();for(var ii=0;ii<num;ii++){if(ScheduleEntry[ii]["schedulename"]==getparentValue("sc_name"))
{warninfo_show(_("Warning_ScheduleName_Exist"));return;}
if((ScheduleEntry[ii]["timestart"]==stimev)&&(ScheduleEntry[ii]["timestop"]==etimev)&&(ScheduleEntry[ii]["weekdays"]==weekdays))
{warninfo_show(_("Warning_Config_Exist"));return;}}
setSchedule("add",schname,stimev,etimev,weekdays);hide_mode();loading_show();}
function BtnClick_SchedulerRemoveApply(rml)
{var selist=document.getElementsByName("rml");if(selist.length=0){return;}
var jsonArr=[];var paramId=1;for(i=0;i<selist.length;i++){if(selist[i].checked==true){var entry=selist[i].value.split("|");var schedulename=entry[3];var timestart=entry[0];var timestop=entry[1];var weekdays=entry[2];if(schedule_checkInUse(schedulename,timestart,timestop,weekdays)==true){warninfo_show("("+schedulename+") "+_("Warning_RemoveError_Schedule_Using"));return;}
jsonArr.push({"id":(paramId++),"params":new Array("gwweb.schedule","setSchedule",{"action":"del","schedulename":schedulename,"timestart":timestart,"timestop":timestop,"weekdays":weekdays})});}}
if(paramId==1){return;}
sk_auth_apply(jsonArr,function(result){setTimeout(getSchedule(),300);});}