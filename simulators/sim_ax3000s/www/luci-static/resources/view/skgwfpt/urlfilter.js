
function pageLoad()
{console.log("URL过滤页面初始化");urlf_getSchedule();}
var UrlFilterEnable;var UrlFilterMode;var UrlFilterEntry;var UrlEntry=new Array();var KeyEntry=new Array();var UrlfScheduleEntry;function urlf_getSchedule()
{var ubusparam=new Array("gwweb.schedule","getSchedule",{});var jsonparam={"id":1,"params":ubusparam};sk_auth_post(jsonparam,function(result){console.log(result.result[1]);UrlfScheduleEntry=result.result[1]["schedule"]["entries"];setTimeout(getUrlFilter(),300);});}
function urlf_getScheduleEntryNumber()
{return UrlfScheduleEntry?UrlfScheduleEntry.length:0;}
function getUrlfEntryNumber()
{return UrlFilterEntry?UrlFilterEntry.length:0;}
function urlf_getUrlNumber()
{return UrlEntry?UrlEntry.length:0;}
function urlf_getKeyNumber()
{return KeyEntry?KeyEntry.length:0;}
function urlf_initEntryList()
{UrlEntry=[];KeyEntry=[];var num=getUrlfEntryNumber();for(var i=0;i<num;++i){if(UrlFilterEntry[i]["url"].indexOf(".")!=-1){UrlEntry.push(UrlFilterEntry[i]);}else{KeyEntry.push(UrlFilterEntry[i]);}}}
var curModeType;function getUrlFilter()
{var ubusparam=new Array("rtweb.urlfilter","getUrlFilter",{});var jsonparam={"id":1,"params":ubusparam};sk_auth_post(jsonparam,function(result){console.log(result.result[1]);UrlFilterEnable=result.result[1]["urlfilter"]["enable"];UrlFilterMode=result.result[1]["urlfilter"]["mode"];UrlFilterEntry=result.result[1]["urlfilter"]["entries"];curModeType=UrlFilterMode;urlf_initEntryList();urlf_pageGetValue();urlf_cleanUrlTable();urlf_cleanKeyTable();urlf_showUrlTable();urlf_showKeyTable();});}
function urlf_getScheduleParaByName(schname)
{var timestart="",timestop="",weekdays="";if(schname=="Always"){return["","",""];}
var num=urlf_getScheduleEntryNumber();for(var i=0;i<num;++i){if(schname==UrlfScheduleEntry[i]["schedulename"]){timestart=UrlfScheduleEntry[i]["timestart"];timestop=UrlfScheduleEntry[i]["timestop"];weekdays=UrlfScheduleEntry[i]["weekdays"];}}
return[timestart,timestop,weekdays];}
function urlf_getScheduleName(timestart,timestop,weekdays)
{if(timestart==""){return"Always";}
var num=urlf_getScheduleEntryNumber();for(var i=0;i<num;++i){if(timestart==UrlfScheduleEntry[i]["timestart"]&&timestop==UrlfScheduleEntry[i]["timestop"]&&weekdays==UrlfScheduleEntry[i]["weekdays"]){return UrlfScheduleEntry[i]["schedulename"];}}
return"undefined";}
function setUrlFilter(action,enable,mode,url,timestart,timestop,weekdays,schedule)
{var ubusparam=new Array("rtweb.urlfilter","setUrlFilter",{"enable":enable,"mode":mode,"action":action,"url":url,"timestart":timestart,"timestop":timestop,"weekdays":weekdays,"extra":(schedule==null?'':schedule)});var jsonparam={"id":1,"params":ubusparam};sk_auth_apply(jsonparam,function(result){console.log(result.result[1]);if(result.result[1]["result"]=="0"){setTimeout(getUrlFilter(),300);}});}
function urlf_pageGetValue(){if(UrlFilterEnable=="1"){urlftEn1.checked=false;urlftEn2.checked=true;urlftMode1.disabled=false;urlftMode2.disabled=false;}else{urlftEn1.checked=true;urlftEn2.checked=false;urlftMode1.disabled=true;urlftMode2.disabled=true;}
if(UrlFilterMode=="1"){urlftMode1.checked=false;urlftMode2.checked=true;}else{urlftMode1.checked=true;urlftMode2.checked=false;}}
function urlf_cleanUrlTable()
{var rownum=getObj("Tbl_Scheduler_Url").rows.length-1;for(var row=0;row<rownum;++row){getObj("Tbl_Scheduler_Url").deleteRow(rownum-row);}}
function urlf_cleanKeyTable()
{var rownum=getObj("Tbl_Scheduler_Key").rows.length-1;for(var row=0;row<rownum;++row){getObj("Tbl_Scheduler_Key").deleteRow(rownum-row);}}
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
function urlf_addline_url(index)
{var newline=getObj("Tbl_Scheduler_Url").insertRow(-1);var optionVal="";var newCell;var scheduleName=urlf_getScheduleName(UrlEntry[index]["timestart"],UrlEntry[index]["timestop"],UrlEntry[index]["weekdays"]);var schEntryStr=UrlEntry[index]["timestart"]+"|"+UrlEntry[index]["timestop"]+"|"+UrlEntry[index]["weekdays"]+"|"+scheduleName;optionVal="<tr><td><label class='skcheckbox'> <input type='checkbox' id='rml"+index+"' name='rml' value='"+UrlEntry[index]["url"]+"#"+
schEntryStr+"' hidden><label for='rml"+index+"' class='skcheckbox-label'></label></label></td>";newCell=newline.insertCell(-1);newCell.align="center";newCell.innerHTML=optionVal;{newCell=newline.insertCell(-1);newCell.align="center";newCell.innerHTML=UrlEntry[index]["url"];}
{newCell=newline.insertCell(-1);newCell.align="center";newCell.innerHTML=GetSchedulerDayString(UrlEntry[index]["weekdays"]);}
{newCell=newline.insertCell(-1);newCell.align="center";newCell.innerHTML=UrlEntry[index]["timestart"].substring(0,5);}
{newCell=newline.insertCell(-1);newCell.align="center";newCell.innerHTML=UrlEntry[index]["timestop"].substring(0,5);}}
function urlf_showUrlTable()
{var num=urlf_getUrlNumber();if(num!=0){for(var i=0;i<num;i++){urlf_addline_url(i);}
urlf_seletall.checked=false;urlf_seletall.disabled=false;}else{var newline=getObj("Tbl_Scheduler_Url").insertRow(-1);newline.setAttribute("align","center");var objcell=newline.insertCell(-1);objcell.colSpan=5;objcell.innerHTML=_("No_Data_Yet");urlf_seletall.checked=false;urlf_seletall.disabled=true;}}
function urlf_addline_key(index)
{var newline=getObj("Tbl_Scheduler_Key").insertRow(-1);var optionVal="";var newCell;var scheduleName=urlf_getScheduleName(KeyEntry[index]["timestart"],KeyEntry[index]["timestop"],KeyEntry[index]["weekdays"]);var schEntryStr=KeyEntry[index]["timestart"]+"|"+KeyEntry[index]["timestop"]+"|"+KeyEntry[index]["weekdays"]+"|"+scheduleName;optionVal="<tr><td><label class='skcheckbox'> <input type='checkbox' id='rmlkey"+index+"' name='rmlkey' value='"+KeyEntry[index]["url"]+"#"+
schEntryStr+"' hidden><label for='rmlkey"+index+"' class='skcheckbox-label'></label></label></td>";newCell=newline.insertCell(-1);newCell.align="center";newCell.innerHTML=optionVal;{newCell=newline.insertCell(-1);newCell.align="center";newCell.innerHTML=KeyEntry[index]["url"];}
{newCell=newline.insertCell(-1);newCell.align="center";newCell.innerHTML=GetSchedulerDayString(KeyEntry[index]["weekdays"]);}
{newCell=newline.insertCell(-1);newCell.align="center";newCell.innerHTML=KeyEntry[index]["timestart"].substring(0,5);}
{newCell=newline.insertCell(-1);newCell.align="center";newCell.innerHTML=KeyEntry[index]["timestop"].substring(0,5);}}
function urlf_showKeyTable()
{var num=urlf_getKeyNumber();if(num!=0){for(var i=0;i<num;i++){urlf_addline_key(i);}
urlf_seletallkey.checked=false;urlf_seletallkey.disabled=false;}else{var newline=getObj("Tbl_Scheduler_Key").insertRow(-1);newline.setAttribute("align","center");var objcell=newline.insertCell(-1);objcell.colSpan=5;objcell.innerHTML=_("No_Data_Yet")
urlf_seletallkey.checked=false;urlf_seletallkey.disabled=true;}}
function url_selectAll(obj)
{var selist=document.getElementsByName("rml");if(selist.length=0)
return;for(i=0;i<selist.length;i++){if($(obj).is(':checked'))
selist[i].checked=true;else
selist[i].checked=false;}}
function url_selectAllKey(obj)
{var selist=document.getElementsByName("rmlkey");if(selist.length=0)
return;for(i=0;i<selist.length;i++){if($(obj).is(':checked'))
selist[i].checked=true;else
selist[i].checked=false;}}
function RadioClick_urlFilterEn()
{}
function modeVerifyDoing()
{setChecked("urlftMode1",curModeType?true:false);setChecked("urlftMode2",curModeType?false:true);}
function RadioClick_urlFilterMode(tmp)
{var switchModeTmp=false;if(tmp==0){switchModeTmp=false;}
else if(tmp==1){switchModeTmp=true;}
setChecked("urlftMode1",curModeType?false:true);setChecked("urlftMode2",curModeType?true:false);if(switchModeTmp!=curModeType){var res=confirm(_("filterModeSwitchTipText"));if(res==true){modeVerifyDoing();}}}
function urlf_deleteAllEntry()
{var jsonArr=[];var paramId=1;var num=getUrlfEntryNumber();for(i=0;i<num;i++){var url=UrlFilterEntry[i]["url"];var timestart=UrlFilterEntry[i]["timestart"];var timestop=UrlFilterEntry[i]["timestop"];var weekdays=UrlFilterEntry[i]["weekdays"];jsonArr.push({"id":(paramId++),"params":new Array("rtweb.urlfilter","setUrlFilter",{"enable":UrlFilterEnable,"mode":UrlFilterMode,"action":"del","url":url,"timestart":timestart,"timestop":timestop,"weekdays":weekdays})});}
if(paramId==1){return;}
sk_auth_apply(jsonArr,function(result){setTimeout(getUrlFilter(),300);});}
function Urlf_BntClick_Apply()
{var newEnable=0;var newMode=0;if(urlftEn2.checked){newEnable=1;}
if(urlftMode2.checked){newMode=1;}
if(newEnable==UrlFilterEnable&&newMode==UrlFilterMode){console.log("no change: enable="+newEnable+" mode="+newMode);return;}
if(newEnable=="0"){newMode=UrlFilterMode;}
if(newMode!=UrlFilterMode){urlf_deleteAllEntry();}
setUrlFilter("apply",newEnable,newMode,null,null,null,null,null);loading_show();}
function BtnClick_UrlFilterAdd()
{if(UrlFilterEnable=='0')
{warninfo_show(_("Warning_Enable_first"));return;}
if(getUrlfEntryNumber()>31)
{warninfo_show(_("Warning_Maximum_32_Rules"));return;}
var data={"type":"form","tittle":_("Add_URL_Filter"),"panelContent":null,"submit":"BtnClick_UrlFilterAddApply"};data.panelContent=new Array();data.panelContent.push({"type":"text","id":"TodUrlAdd","datatype":"url","tittle":_("URL_Address"),"value":""});var seloptions=new Array();seloptions.push({"value":"Always","name":"Always"});data.panelContent.push({"type":"timerange","id":"sc_time","tittle":_("Time"),"value":""});data.panelContent.push({"type":"week","id":"week","tittle":_("Repeat_Period"),"value":""});panel_show(data);getObj("TodUrlAdd").style.padding="0px 6px";}
function getparentValue(id)
{return($("#"+id,document).val());}
function check_urlentry_exist(arg)
{var num=urlf_getUrlNumber();for(var i=0;i<num;i++){if(arg.toLowerCase()==UrlEntry[i]["url"].toLowerCase()){warninfo_show(_("Warn_Url_Exist"));return false;}}
return true;}
function isValidURL(url){const hostnameRegex=/^(?!:\/\/)([a-zA-Z0-9-_]{1,63}\.)+[a-zA-Z]{2,6}$/;try{const parsedUrl=new URL(url);const{protocol,hostname,pathname,search,hash,port}=parsedUrl;const validSchemes=['http:','https:'];if(!validSchemes.includes(protocol)){return false;}
if(!hostnameRegex.test(hostname)){return false;}
if(port&&(isNaN(port)||port<=0||port>65535)){return false;}
return true;}catch(e){if(!hostnameRegex.test(url)){return false;}
return true;}}
function BtnClick_UrlFilterAddApply()
{var url=getparentValue("TodUrlAdd");var is_valid=isValidURL(url);if(is_valid==false)
{warninfo_show(_("Url < "+url+" > is invalid"));return;}
if(urlf_checkParameterInvalid(url)==false)
{$(".warn .close").unbind("click").on("click",function(){$(".warn").remove();});return;}
if(check_urlentry_exist(url)==false){$(".warn .close").unbind("click").on("click",function(){$(".warn").remove();});return;}
var arr=getparentTime();if(arr[0]==""||arr[1]==""||arr[2]=="")
return;hide_mode();loading_show();var timestart=arr[0];var timestop=arr[1];var weekdays=arr[2];setUrlFilter("add",UrlFilterEnable,UrlFilterMode,url,timestart,timestop,weekdays,null);}
function urlf_checkParameterInvalid(url)
{if(url.length>63)
{warninfo_show(_("Warn_Url_Len_Over_63_chars"));return false;}
if(!urlf_CheckURL(url))
{warninfo_show(_("Warn_Url_Invalid"));return false;}}
function checkNull(value)
{if(value==""||value==null)
return false;else
return true;}
function checkStrLengthRange(value,min,max)
{if(checkNull(value)==false)
{return-1;}
var len=value.length;if((len<min)||(len>max))
{return-3;}
return true;}
function urlf_CheckURL(url)
{var statu=checkStrLengthRange(url,1,256);if(statu==-1)
{warninfo_show(_("Warn_Url_Empty"));return false;}
if(statu==-3)
{warninfo_show(_("Warn_Url_too_Long"));return false;}
if(url.match("[^0-9a-zA-Z.:;,!@%#?_/&=+*'$()-]")!=null)
{warninfo_show(_("Warn_Url_Invalid"));return false;}
var strRegex=/((^((http|https)?:\/\/)([\w-]+\.)+[\w-]+(:[0-9]+)?(\/[\w- .\/_!@%#?%&=+:*'$()-]*)?$)|(^([\w-]+\.)+[\w-]+(:[0-9]+)?(\/[\w- .\/_!@%#?%&=+:*'$()-]*)?$))/;var re=new RegExp(strRegex);if(!re.test(url))
{warninfo_show(_("Warn_Url_Invalid"));return false;}
return true;}
function BtnClick_UrlFilterRemoveApply(rml){if(UrlFilterEnable=='0')
{warninfo_show(_("Warning_Enable_first"));return;}
var selist=document.getElementsByName("rml");if(selist.length=0){return;}
var jsonArr=[];var paramId=1;for(i=0;i<selist.length;i++){if(selist[i].checked==true){var url=selist[i].value.split("#")[0];var schEntryStr=selist[i].value.split("#")[1];console.log("url="+url+" schedule="+schEntryStr);var timestart=schEntryStr.split("|")[0];var timestop=schEntryStr.split("|")[1];var weekdays=schEntryStr.split("|")[2];jsonArr.push({"id":(paramId++),"params":new Array("rtweb.urlfilter","setUrlFilter",{"enable":UrlFilterEnable,"mode":UrlFilterMode,"action":"del","url":url,"timestart":timestart,"timestop":timestop,"weekdays":weekdays})});}}
if(paramId==1){return;}
sk_auth_apply(jsonArr,function(result){setTimeout(getUrlFilter(),300);});}
function BtnClick_KeyFilterAdd()
{if(UrlFilterEnable=='0')
{warninfo_show(_("Warning_Enable_first"));return;}
if(getUrlfEntryNumber()>31)
{warninfo_show(_("Warning_Maximum_32_Rules"));return;}
var data={"type":"form","tittle":_("Add_Keyword_Filter"),"panelContent":null,"submit":"BtnClick_KeyFilterAddApply"};data.panelContent=new Array();data.panelContent.push({"type":"text","id":"urlfKeyword","tittle":_("Keyword"),"value":""});data.panelContent.push({"type":"timerange","id":"sc_time","tittle":_("Time"),"value":""});data.panelContent.push({"type":"week","id":"week","tittle":_("Repeat_Period"),"value":""});panel_show(data);getObj("urlfKeyword").style.padding="0px 6px";}
function check_keywordentry_exist(arg)
{var num=urlf_getKeyNumber();for(var i=0;i<num;i++){if(arg.toLowerCase()==KeyEntry[i]["url"].toLowerCase()){warninfo_show(_("Warn_Key_Exist"));return false;}}
return true;}
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
function BtnClick_KeyFilterAddApply()
{var keyword=getparentValue("urlfKeyword");if(urlf_checkkeywordInvalid(keyword)==false)
{$(".warn .close").unbind("click").on("click",function(){$(".warn").remove();});return;}
if(check_keywordentry_exist(keyword)==false){$(".warn .close").unbind("click").on("click",function(){$(".warn").remove();});return;}
var arr=getparentTime();if(arr[0]==""||arr[1]==""||arr[2]==""){$(".warn .close").unbind("click").on("click",function(){$(".warn").remove();});return;}
hide_mode();loading_show();var timestart=arr[0];var timestop=arr[1];var weekdays=arr[2];setUrlFilter("add",UrlFilterEnable,UrlFilterMode,keyword,timestart,timestop,weekdays,null);}
function urlf_checkkeywordInvalid(keyword)
{if(keyword.length>63)
{warninfo_show(_("Warn_Key_Len_Over_63_chars"));return false;}
if(isValidName(keyword)==false)
{warninfo_show(_("Warn_Key_Invalid"));return false;}}
function BtnClick_KeyFilterRemoveApply(rmlkey){if(UrlFilterEnable=='0')
{warninfo_show(_("Warning_Enable_first"));return;}
var selist=document.getElementsByName("rmlkey");if(selist.length=0){return;}
var jsonArr=[];var paramId=1;for(i=0;i<selist.length;i++){if(selist[i].checked==true){var url=selist[i].value.split("#")[0];var schEntryStr=selist[i].value.split("#")[1];console.log("url="+url+" schedule="+schEntryStr);var timestart=schEntryStr.split("|")[0];var timestop=schEntryStr.split("|")[1];var weekdays=schEntryStr.split("|")[2];jsonArr.push({"id":(paramId++),"params":new Array("rtweb.urlfilter","setUrlFilter",{"enable":UrlFilterEnable,"mode":UrlFilterMode,"action":"del","url":url,"timestart":timestart,"timestop":timestop,"weekdays":weekdays})});}}
if(paramId==1){return;}
sk_auth_apply(jsonArr,function(result){setTimeout(getUrlFilter(),300);});}