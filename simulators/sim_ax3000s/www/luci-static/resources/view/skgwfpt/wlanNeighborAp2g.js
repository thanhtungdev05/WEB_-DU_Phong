
function pageLoad()
{getWpsCfg();}
var gNeighboringTimerFlag;var gNeighboringTimerOut;var scanflag=0;var radiolistall;var radiolista2g;function formLoad(){}
function NeighboringTimerOut()
{clearTimeout(gNeighboringTimerFlag);clearTimeout(gNeighboringTimerOut);hide_mode();if(scanflag==0)
{setTimeout(function(){warninfo_show("Scan failed!");},2000);}}
function sortSignal(a,b)
{return b.Signal-a.Signal;}
function utf8to16(str){var out,i,len,c;var char2,char3;out="";len=str.length;i=0;while(i<len){c=str.charCodeAt(i++);if(c>=0x4e00&&c<=0x9fa5)
{out+=String.fromCharCode(c);continue;}
switch(c>>4)
{case 0:case 1:case 2:case 3:case 4:case 5:case 6:case 7:out+=str.charAt(i-1);break;case 12:case 13:char2=str.charCodeAt(i++);out+=String.fromCharCode(((c&0x1F)<<6)|(char2&0x3F));break;case 14:char2=str.charCodeAt(i++);char3=str.charCodeAt(i++);out+=String.fromCharCode(((c&0x0F)<<12)|((char2&0x3F)<<6)|((char3&0x3F)<<0));break;}}
return out;}
function decode(str){var code=decodeURIComponent(str).toString();return utf8to16(unescape(code)).toString();}
function NeighboringResultQuery()
{radiolista2g=new Array();var ubusparam=new Array("rtweb.wifi","wlanScanResultGet",{"band":"2.4G"});var jsonparam={"id":1,"params":ubusparam};var number2=0;sk_auth_post(jsonparam,function(result){flag=0;scanflag=1;number2=result.result[1].number2;if(number2!=0)
{clearTimeout(gNeighboringTimerOut);for(var i=1;i<number2;i++)
{var Essid=result.result[1]["2.4G"][i].ssid;var Channel=result.result[1]["2.4G"][i].channel;var MacAddr=result.result[1]["2.4G"][i].bssid;var AuthMode=result.result[1]["2.4G"][i].securityMode;var Signal=result.result[1]["2.4G"][i].rssi;var RadioType=result.result[1]["2.4G"][i].band;var Encryption=result.result[1]["2.4G"][i].encrypt;radiolista2g.push({"Ssid":Essid,"Channel":Channel,"MacAddr":MacAddr,"AuthMode":AuthMode,"RSSI":Signal,"Encryption":Encryption,});}
var row="";$.each(radiolista2g,function(index,obj){if(obj.Ssid!="nknow")
row+="<tr><td>"+obj.Ssid+"</td><td>"+obj.MacAddr+"</td><td>"+obj.Channel+"</td><td>"+obj.AuthMode+"</td><td>"+obj.Encryption+"</td><td>"+obj.RSSI+"</td></tr>";});$("#NeighborTbody").html(row);hide_mode();$("#resulttb").show();}
else
{gNeighboringTimerFlag=setTimeout("NeighboringResultQuery()",1000);}});}
function BntClick_ScanNeighbor()
{clearTimeout(gNeighboringTimerFlag);clearTimeout(gNeighboringTimerOut);scanflag=0;$(".loading p",document).html("scanning for wireless signals...");loading_show();var ubusparam=new Array("rtweb.wifi","wlanScanTrigger",{"band":"2.4G"});var jsonparam={"id":1,"params":ubusparam};sk_auth_post(jsonparam,function(result){NeighboringResultQuery();gNeighboringTimerOut=setTimeout("NeighboringTimerOut()",1000*25);});}
function BntClick_PbcApply()
{setwpsCfg("pbc","");}
function BntClick_PinApply()
{var pin=getValue("Txt_WPSPIN");if(isvalidpin(pin)==false)
{warninfo_show(_('wlanWpsConfig2g_pininvalid'));return false;}
setwpsCfg("pin","pin");}
function BntClick_Apply()
{setwpsCfg();}