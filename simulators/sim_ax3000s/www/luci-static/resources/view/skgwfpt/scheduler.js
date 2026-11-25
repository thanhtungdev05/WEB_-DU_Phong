
function pageLoad()
{contentLoad();}
function contentLoad()
{var param=new Array("rtweb.system","get_schwifi_fpt",{});var jsonstr={"id":1,"params":param};sk_auth_post(jsonstr,function(result){tableLoad(result.result[1]);timeLoad();});}
function tableLoad(resArr)
{document.getElementById("at-schetimer-tbody").innerHTML="";tableItemLoad(resArr.wifitask);}
function tableItemLoad(wifitask)
{var tableNode=document.getElementById("at-schetimer-tbody");var itemStr="";if(wifitask.length==0)
{itemStr+="<tr id='at-"+0+"-"+0+"-Tr'>";itemStr+="<th>Disable</th>";itemStr+="<th>00:00</th>";itemStr+="<th>00:00</th>";itemStr+="<th></th>";itemStr+="</tr>";}
else if(wifitask.length==1)
{if(wifitask[0].WifiOnOff==true)
{var OntaskId=wifitask[0].TaskId;var OntimeStr="";var repeatPeriodStr="";var StatusStr=wifitask[0].Enable==1?"Enable":"Disable";OntimeStr+=wifitask[0].Hour<10?"0"+wifitask[0].Hour:wifitask[0].Hour;OntimeStr+=":";OntimeStr+=wifitask[0].Minute<10?"0"+wifitask[0].Minute:wifitask[0].Minute;repeatPeriodStr+=wifitask[0].Monday?"Mon/":"";repeatPeriodStr+=wifitask[0].Tuesday?"Tue/":"";repeatPeriodStr+=wifitask[0].Wednesday?"Wed/":"";repeatPeriodStr+=wifitask[0].Thursday?"Thur/":"";repeatPeriodStr+=wifitask[0].Friday?"Fri/":"";repeatPeriodStr+=wifitask[0].Saturday?"Sat/":"";repeatPeriodStr+=wifitask[0].Sunday?"Sun/":"";if(repeatPeriodStr!=""){repeatPeriodStr=repeatPeriodStr.substring(0,repeatPeriodStr.length-1);}
itemStr+="<tr id='at-"+OntaskId+"-"+0+"-Tr'>";itemStr+="<th>"+StatusStr+"</th>";itemStr+="<th>"+OntimeStr+"</th>";itemStr+="<th> </th>";itemStr+="<th>"+repeatPeriodStr+"</th>";itemStr+="</tr>";}
else
{var OfftaskId=wifitask[0].TaskId;var OfftimeStr="";var repeatPeriodStr="";var StatusStr=wifitask[0].Enable==1?"Enable":"Disable";OfftimeStr+=wifitask[0].Hour<10?"0"+wifitask[0].Hour:wifitask[0].Hour;OfftimeStr+=":";OfftimeStr+=wifitask[0].Minute<10?"0"+wifitask[0].Minute:wifitask[0].Minute;repeatPeriodStr+=wifitask[0].Monday?"Mon/":"";repeatPeriodStr+=wifitask[0].Tuesday?"Tue/":"";repeatPeriodStr+=wifitask[0].Wednesday?"Wed/":"";repeatPeriodStr+=wifitask[0].Thursday?"Thur/":"";repeatPeriodStr+=wifitask[0].Friday?"Fri/":"";repeatPeriodStr+=wifitask[0].Saturday?"Sat/":"";repeatPeriodStr+=wifitask[0].Sunday?"Sun/":"";if(repeatPeriodStr!=""){repeatPeriodStr=repeatPeriodStr.substring(0,repeatPeriodStr.length-1);}
itemStr+="<tr id='at-"+0+"-"+OfftaskId+"-Tr'>";itemStr+="<th>"+StatusStr+"</th>";itemStr+="<th> </th>";itemStr+="<th>"+OfftimeStr+"</th>";itemStr+="<th>"+repeatPeriodStr+"</th>";itemStr+="</tr>";}}
else
{var on=0;var off=0;if(wifitask[0].WifiOnOff==true)
{on=0;off=1;}
else
{on=1;off=0;}
var OntaskId=wifitask[on].TaskId;var OfftaskId=wifitask[off].TaskId;var OntimeStr="";var OfftimeStr="";var repeatPeriodStr="";var StatusStr=(wifitask[on].Enable&&wifitask[off].Enable)==1?"Enable":"Disable";OntimeStr+=wifitask[on].Hour<10?"0"+wifitask[on].Hour:wifitask[on].Hour;OntimeStr+=":";OntimeStr+=wifitask[on].Minute<10?"0"+wifitask[on].Minute:wifitask[on].Minute;OfftimeStr+=wifitask[off].Hour<10?"0"+wifitask[off].Hour:wifitask[off].Hour;OfftimeStr+=":";OfftimeStr+=wifitask[off].Minute<10?"0"+wifitask[off].Minute:wifitask[off].Minute;repeatPeriodStr+=wifitask[on].Monday?"Mon/":"";repeatPeriodStr+=wifitask[on].Tuesday?"Tue/":"";repeatPeriodStr+=wifitask[on].Wednesday?"Wed/":"";repeatPeriodStr+=wifitask[on].Thursday?"Thur/":"";repeatPeriodStr+=wifitask[on].Friday?"Fri/":"";repeatPeriodStr+=wifitask[on].Saturday?"Sat/":"";repeatPeriodStr+=wifitask[on].Sunday?"Sun/":"";if(repeatPeriodStr!=""){repeatPeriodStr=repeatPeriodStr.substring(0,repeatPeriodStr.length-1);}
itemStr+="<tr id='at-"+OntaskId+"-"+OfftaskId+"-Tr'>";itemStr+="<th>"+StatusStr+"</th>";itemStr+="<th>"+OntimeStr+"</th>";itemStr+="<th>"+OfftimeStr+"</th>";itemStr+="<th>"+repeatPeriodStr+"</th>";itemStr+="</tr>";}
tableNode.innerHTML+=itemStr;}
function setDiableTable(isDisabled)
{}
function timeLoad()
{var param=new Array("rtweb.ntp","getNtp",{});var jsonstr={"id":1,"params":param};sk_auth_post(jsonstr,function(result){var resArr=result.result[1];var syncStatus="";setHTML("curSystime",resArr.time);if(resArr.syncsta){setDiableTable(false);syncStatus=_("Synchronized");}
else{setDiableTable(true);syncStatus+=_("Unsynchronized");}
setHTML("syncStatus",syncStatus);});}
var OntaskIdSet=0;var OfftaskIdSet=0;function BtnPanelShowLoad(value,OntaskIdValue,OfftaskIdValue)
{var data={"type":"form","tittle":_("wifiCloseSche"),"panelContent":null,"submit":"wifiTimerAddApply"};var options=new Array();OntaskIdSet=OntaskIdValue;OfftaskIdSet=OfftaskIdValue;options.push({"id":"at-act-select","label":_("Enable")});options.push({"id":"at-act-select","label":_("Disable")});data.panelContent=new Array();data.panelContent.push({"type":"radio","tittle":_("Enable"),"value":"","option":options});data.panelContent.push({"type":"time","id":"at-on-select-time","tittle":_("On Time"),"value":""});data.panelContent.push({"type":"time","id":"at-off-select-time","tittle":_("Off Time"),"value":""});data.panelContent.push({"type":"week","id":"at-add-week","tittle":_("Repeat Period"),"value":""});panel_show(data);editDataLoad(value);}
function wifiTimerAddApply()
{var Ondata={};var Offdata={};Ondata.WifiOnOff=true;Offdata.WifiOnOff=false;if(getChecked("at-act-select0")){Ondata.Enable=true;Offdata.Enable=true;}
else
{Ondata.Enable=false;Offdata.Enable=false;}
Ondata.TaskId=OntaskIdSet;Offdata.TaskId=OfftaskIdSet;Ondata.Hour=Number(getValue("at-on-select-timehour"));Ondata.Minute=Number(getValue("at-on-select-timemin"));Offdata.Hour=Number(getValue("at-off-select-timehour"));Offdata.Minute=Number(getValue("at-off-select-timemin"));;Ondata.Monday=getChecked("at-add-weekMon");Ondata.Tuesday=getChecked("at-add-weekTue");Ondata.Wednesday=getChecked("at-add-weekWed");Ondata.Thursday=getChecked("at-add-weekThur");Ondata.Friday=getChecked("at-add-weekFri");Ondata.Saturday=getChecked("at-add-weekSat");Ondata.Sunday=getChecked("at-add-weekSun");Offdata.Monday=getChecked("at-add-weekMon");Offdata.Tuesday=getChecked("at-add-weekTue");Offdata.Wednesday=getChecked("at-add-weekWed");Offdata.Thursday=getChecked("at-add-weekThur");Offdata.Friday=getChecked("at-add-weekFri");Offdata.Saturday=getChecked("at-add-weekSat");Offdata.Sunday=getChecked("at-add-weekSun");var param1=new Array("rtweb.system","set_schwifi_fpt",Ondata);var param2=new Array("rtweb.system","set_schwifi_fpt",Offdata);var jsonstr=[{"id":1,"params":param1},{"id":2,"params":param2}];sk_auth_apply(jsonstr,function(result){var resultVal=(result[0].result[1].result&&result[1].result[1].result);if(resultVal!=0){if(resultVal==-2){hide_mode();warninfo_show(_("rpError"));}
else{hide_mode();if(result[0].result[1].result!=0)
warninfo_show(result[0].result[1].failreason);else
warninfo_show(result[1].result[1].failreason);}}
else{hide_mode();contentLoad();}});}
function editDataLoad(value)
{if(value.select==_("Enable")){setChecked("at-act-select0",true);}
else{setChecked("at-act-select1",true);}
var OntimeHour=value.ontime.split(":")[0];var OntimeMint=value.ontime.split(":")[1];setValue("at-on-select-timehour",Number(OntimeHour));setValue("at-on-select-timemin",Number(OntimeMint));var OfftimeHour=value.offtime.split(":")[0];var OfftimeMint=value.offtime.split(":")[1];setValue("at-off-select-timehour",Number(OfftimeHour));setValue("at-off-select-timemin",Number(OfftimeMint));if(value.week.length>0)
{var weekArr=value.week.split("/");var weekSize=weekArr.length;if(weekSize>0){for(var i=0;i<weekSize;i++){setChecked("at-add-week"+weekArr[i],true);}}}}
function BtnClickWlanTimerEdit()
{var tableNode=document.getElementById("at-schetimer-tbody");var rowNode=tableNode.rows[0];var editValue={};editValue.select=rowNode.cells[0].innerHTML;editValue.ontime=rowNode.cells[1].innerHTML;editValue.offtime=rowNode.cells[2].innerHTML;editValue.week=rowNode.cells[3].innerHTML;BtnPanelShowLoad(editValue,Number(rowNode.id.split("-")[1]),Number(rowNode.id.split("-")[2]));}