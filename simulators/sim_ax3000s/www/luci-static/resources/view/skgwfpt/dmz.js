
function pageLoad()
{wanInfoLoad();contentLoad();check_fwlevel()}
function check_fwlevel()
{var level=0;var ubusparam=new Array("rtweb.firewall","getFwLevel",{});var jsonparam={"id":1,"params":ubusparam};sk_auth_post(jsonparam,function(result){console.log(result.result[1]);level=result.result[1]["firewalllevel"]["level"];if(level==2)
{warninfo_show(_("DMZnottakeeffect"));}});}
function contentLoad()
{var ubusparam=new Array("rtweb.sta","getStaInfo",{});var jsonparam={"id":1,"params":ubusparam};sk_auth_post(jsonparam,function(result){hostInfoLoad(result.result[1]);});}
function hostInfoLoad(resArr)
{var resLen=resArr.total;var lanHost=resArr.staDevices;clearSelect("at-dmz-selectLan");addSelectOption("at-dmz-selectLan","select","Select...");for(var i=0;i<resLen;i++){addSelectOption("at-dmz-selectLan",lanHost[i].ipAddr,lanHost[i].hostname+"("+lanHost[i].ipAddr+")");}
dmzInfoLoad();}
function wanInfoLoad()
{var ubusparam=new Array("gwweb.wancfg","status",{});var jsonparam={"id":1,"params":ubusparam};sk_auth_post(jsonparam,function(result){wanInfoConfig(result.result[1]);});}
function wanInfoConfig(resArr)
{var resLen=resArr.wan.length;var wanInfo=resArr.wan;console.log(resArr);clearSelect("skg_dmz_selectWan");addSelectOption("skg_dmz_selectWan","ALL","ALL");for(var i=0;i<resLen;i++){addSelectOption("skg_dmz_selectWan",wanInfo[i].ipaddr,wanInfo[i].GUIname+"("+wanInfo[i].ipaddr+")");}}
function dmzInfoLoad()
{var ubusparam=new Array("rtweb.firewall","getDMZCfg",{});var jsonparam={"id":1,"params":ubusparam};sk_auth_post(jsonparam,function(result){var resArr=result.result[1];var enable=resArr.enable;var staIPAddr=resArr.staip;var wan="ALL";if(resArr.wan_zone!=""){wan=resArr.wan_zone;}
if(enable){setDmzAllDisabled(false);setChecked("at-dmz-enable",true);}
else{setDmzAllDisabled(true);setChecked("at-dmz-enable",false);}
setHostIPAddr(staIPAddr,enable);setValue("skg_dmz_selectWan",wan);});}
function setDmzAllDisabled(flag)
{document.getElementById("at-dmz-selectLan").disabled=flag;document.getElementById("at-lan-addr").disabled=flag;}
var selectHostIPAddr="";function setHostIPAddr(addr,enable)
{var HostNode=document.getElementById("at-dmz-selectLan");var HostSize=HostNode.length;var selectLanFlag=0;for(var i=0;i<HostSize;i++){if(addr==HostNode[i].value){selectLanFlag=1;break;}}
if(selectLanFlag){setValue("at-dmz-selectLan",addr);setValue("at-lan-addr",addr);if(enable){document.getElementById("at-lan-addr").disabled=true;}}
else{selectHostIPAddr=addr;setValue("at-dmz-selectLan","select");setValue("at-lan-addr",addr);if(enable){document.getElementById("at-lan-addr").disabled=false;}}}
function dmzEnableClick(ob)
{if(ob.checked){setDmzAllDisabled(false);}
else{setDmzAllDisabled(true);}}
function dmzSelectClick(ob)
{if(ob.value=="select"){setValue("at-lan-addr",selectHostIPAddr);document.getElementById("at-lan-addr").disabled=false;}
else{setValue("at-lan-addr",ob.value);document.getElementById("at-lan-addr").disabled=true;}}
function dmzSelectWANClick(ob)
{}
function dmzGetSubRange(ip,mask)
{var lanGwIp=ip.split(".");var lanNetMask=mask.split(".");var startIpArr=[];var endIpArr=[];var startIp="";var endIp="";for(var i=0;i<4;i++){lanGwIp[i]=('00000000'+Number(lanGwIp[i]).toString(2)).slice(-8);lanNetMask[i]=('00000000'+Number(lanNetMask[i]).toString(2)).slice(-8);startIpArr[i]=lanGwIp[i];endIpArr[i]=lanGwIp[i];for(var j=0;j<8;j++){if(lanNetMask[i][j]=='0'){startIpArr[i]=startIpArr[i].substring(0,j)+"0"+startIpArr[i].substring(j+1);endIpArr[i]=endIpArr[i].substring(0,j)+"1"+endIpArr[i].substring(j+1);}}
startIpArr[i]=parseInt(startIpArr[i],2);endIpArr[i]=parseInt(endIpArr[i],2);startIp+=startIpArr[i];endIp+=endIpArr[i];if(i<3){startIp+=".";endIp+=".";}}
return{startIp,endIp};}
function dmzHostIPAddrCheck(brLanInfo)
{var lanHostIPAddr=getValue("at-lan-addr");var brLanIpAddr=brLanInfo.ipaddr;var brLanSegMask=brLanInfo.subnetmask;if(lanHostIPAddr==''){warninfo_show(_("The IP address is Null!"));return false;}
if(!isValidIpAddress(lanHostIPAddr)){warninfo_show(_("The IP address format error!"));return false;}
if(isValidIpAddress(brLanInfo.ipaddr)&&!isSameSubNet(brLanIpAddr,brLanSegMask,lanHostIPAddr,brLanSegMask)){warninfo_show(_("The IP address is not within the LAN subnet!"));return false;}
var ipRange=dmzGetSubRange(brLanIpAddr,brLanSegMask);if(lanHostIPAddr==brLanInfo.ipaddr||lanHostIPAddr==ipRange.startIp||lanHostIPAddr==ipRange.endIp){warninfo_show(_("The IP address format error!"));return false;}
return true;}
function dmzButtonApplyClick()
{var lanparam=new Array("rtweb.lancfg","getLanCfg",{});var jsonparam={"id":1,"params":lanparam};sk_auth_post(jsonparam,function(result){if(result.result[0]==0){dmzInfoApply(result.result[1]);}});}
function dmzInfoApply(brLanInfo)
{var dmzEnable=getChecked("at-dmz-enable");if(dmzEnable&&!dmzHostIPAddrCheck(brLanInfo)){return false;}
var dmzData={};dmzData.enable=0;if(dmzEnable){dmzData.enable=1;}
dmzData.staip=getValue("at-lan-addr");if("ALL"!=getValue("skg_dmz_selectWan")){dmzData.wan_zone=getValue("skg_dmz_selectWan");}else{dmzData.wan_zone="";}
var ubusparam=new Array("rtweb.firewall","setDMZCfg",dmzData);var jsonparam={"id":1,"params":ubusparam};sk_auth_apply(jsonparam,function(result){if(3==result.result[1].result){warninfo_show(_(result.result[1].failreason));}
contentLoad();});}