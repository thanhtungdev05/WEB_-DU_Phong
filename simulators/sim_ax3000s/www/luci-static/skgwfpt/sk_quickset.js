
$(document).ready(function(){get_Prpl_enable();$("a").on('click',function(e){var direct=$(this).attr("slide-direct");var goal=$(this).attr("href");var currentid=$(this).parents(".pagerole").attr('id');slide_page(direct,currentid,goal);});$(".wanselect ul li").on('click',function(e){$(this).siblings().each(function(i,item){if($(item).hasClass("selected"))
{$(item).removeClass("selected");}});if(!$(this).hasClass("selected"))
{$(this).addClass("selected");}
$(this).find("input[type=radio]").prop("checked","checked");});$(".bi-password").on('click',function(e){if($(this).hasClass("bi-eye-slash-fill"))
{$(this).prevAll("input").attr("type","text");$(this).removeClass("bi-eye-slash-fill").addClass("bi-eye-fill");$(this).prevAll("i").attr("style","right: 3.6em;");}
else
{$(this).prevAll("input").attr("type","password");$(this).removeClass("bi-eye-fill").addClass("bi-eye-slash-fill");}});$("input").on('keyup',function(e){var obj=$(this)[0];check_data_valid(obj);})
/* skip external router IP redirect in simulator iframe */});var wanmode;var radiolist;var radiolist24G;var radiolist5G;var g_ap_interval;var g_ap_timeout;function change_lang(lang)
{var ubusparam=new Array("uci","set",{"config":"luci","section":"main","values":{"lang":lang}});var ubusparam2=new Array("uci","apply",{"rollback":false,"timeout":1});var jsonparam=[{"id":1,"params":ubusparam},{"id":2,"params":ubusparam2}];sk_auth_post(jsonparam,function(result){window.location.reload();});}
function s8(bytes,off){var n=bytes[off];return(n>0x7F)?(n-256)>>>0:n;}
function u16(bytes,off){return((bytes[off+1]<<8)+bytes[off])>>>0;}
function sfh(s){if(s===null||s.length===0)
return null;var bytes=[];for(var i=0;i<s.length;i++){var ch=s.charCodeAt(i);if(ch<=0x7F)
bytes.push(ch);else if(ch<=0x7FF)
bytes.push(((ch>>>6)&0x1F)|0xC0,(ch&0x3F)|0x80);else if(ch<=0xFFFF)
bytes.push(((ch>>>12)&0x0F)|0xE0,((ch>>>6)&0x3F)|0x80,(ch&0x3F)|0x80);else if(code<=0x10FFFF)
bytes.push(((ch>>>18)&0x07)|0xF0,((ch>>>12)&0x3F)|0x80,((ch>>6)&0x3F)|0x80,(ch&0x3F)|0x80);}
if(!bytes.length)
return null;var hash=(bytes.length>>>0),len=(bytes.length>>>2),off=0,tmp;while(len--){hash+=u16(bytes,off);tmp=((u16(bytes,off+2)<<11)^hash)>>>0;hash=((hash<<16)^tmp)>>>0;hash+=hash>>>11;off+=4;}
switch((bytes.length&3)>>>0){case 3:hash+=u16(bytes,off);hash=(hash^(hash<<16))>>>0;hash=(hash^(s8(bytes,off+2)<<18))>>>0;hash+=hash>>>11;break;case 2:hash+=u16(bytes,off);hash=(hash^(hash<<11))>>>0;hash+=hash>>>17;break;case 1:hash+=s8(bytes,off);hash=(hash^(hash<<10))>>>0;hash+=hash>>>1;break;}
hash=(hash^(hash<<3))>>>0;hash+=hash>>>5;hash=(hash^(hash<<4))>>>0;hash+=hash>>>17;hash=(hash^(hash<<25))>>>0;hash+=hash>>>6;return(0x100000000+hash).toString(16).substr(1);}
function trimws(s){return String(s).trim().replace(/[ \t\n]+/g,' ');}
function _(s,c){var k=(c!=null?trimws(c)+'\u0001':'')+trimws(s);return(langs[sfh(k)])||s;}
function getAesString(data,key,iv)
{var key=CryptoJS.enc.Utf8.parse(key);var iv=CryptoJS.enc.Utf8.parse(iv);var encrypted=CryptoJS.AES.encrypt(data,key,{iv:iv,mode:CryptoJS.mode.CBC,padding:CryptoJS.pad.Pkcs7});return encrypted.toString();}
function getAES(data)
{var iv='0000000000000000';var encrypted=getAesString(data,ifkey,iv);var encrypted1=CryptoJS.enc.Utf8.parse(encrypted);return encrypted;}
function isValidStaticIpAddress(address){addrParts=address.split('.');if(addrParts.length!=4){return false;}
for(i=0;i<4;i++){if(isNaN(addrParts[i])||addrParts[i]==""){return false;}
num=parseInt(addrParts[i]);if(i==0){if((0<num&&num<127)||(127<num&&num<223)){continue;}else{return false;}}
if(i==3){if(0<num&&num<255){continue;}else{return false;}}
if(num<0||num>255){return false;}}
return true;}
function isPppNameUnsafe(compareChar){var unsafeString="\"\\`\,=' \t";if(unsafeString.indexOf(compareChar)==-1&&compareChar.charCodeAt(0)>32&&compareChar.charCodeAt(0)<123)
return false;else
return true;}
function isValidPppName(pppname){var i=0;if(checkStrLengthRange(pppname,1,64)!=true)
{return false;}
for(i=0;i<pppname.length;i++){if(isPppNameUnsafe(pppname.charAt(i))==true)
return false;}
return true;}
function check_pppusername(obj)
{var value=$(obj).val();if(!isValidPppName(value))
{if(!$(obj).hasClass("checkfail"))
$(obj).addClass("checkfail");$(obj).blur(function(){setTimeout(function(){$(obj).focus();},0);});$(obj).parents(".content").next().find("input").attr("disabled",true);}
else
{if($(obj).hasClass("checkfail"))
$(obj).removeClass("checkfail");if($(obj).nextAll(".warningshow"))
$(obj).nextAll(".warningshow").remove();$(obj).unbind("blur");$(obj).parents(".content").next().find("input").removeAttr("disabled");}}
function checkNull(value)
{if(value==""||value==null)
return false;else
return true;}
function checkStrLengthRange(value,min,max)
{if(checkNull(value)==false)
{return false;}
var len=value.length;if((len<min)||(len>max))
{return false;}
return true;}
function checkGenStringForASC(value)
{var length=value.length;for(var j=0;j<length;j++)
{var xx=value.charCodeAt(j);if(xx<=0||xx>255)
{return false;}}
return true;}
function isValidMPassword(value)
{if(checkGenStringForASC(value)!=true)
{return false;}
if(checkStrLengthRange(value,8,32)!=true)
{return false;}
return true;}
function check_mangepasswd(obj)
{var strongpwdwarn=_("WiFi Password Note");var managepwdwarn=_("i18n_comm The management password cannot be the same as the WiFi password.");var managepwdwarn1=_("i18n_comm The management password must contain numbers, special characters, uppercase letters, and lowercase letters.");if(operator=="ctcc"&&-3==checkStrSpecilCharacter($("#Frm_wlan_password").val()))
{if($("#Frm_wlan_password").hasClass("checkfail"))
$("#Frm_wlan_password").addClass("checkfail");if(!$("#Frm_wlan_password").nextAll(".warningshow")[0])
$("#Frm_wlan_password").parent(".skform-input").append("<span class='warningshow' style='left:10%;'>"+strongpwdwarn+"<span>");}
var value=$(obj).val();var warn1=_("i18n_comm The password must be 8 to 32 characters long and must not contain Chinese characters.");if(!isValidMPassword(value))
{if(!$(obj).hasClass("checkfail"))
$(obj).addClass("checkfail");if($(obj).nextAll(".warningshow")[0])
{$(obj).nextAll(".warningshow").eq(0).html(warn1);}
else
{$(obj).parent(".skform-input").append("<span class='warningshow' style='left:10%;'>"+warn1+"<span>");}
$(obj).blur(function(){setTimeout(function(){$(obj).focus();},0);});$(obj).parents(".content").next().find("input").attr("disabled",true);}
else if(operator=="ctcc"&&value==$("#Frm_wlan_password").val())
{if(!$(obj).hasClass("checkfail"))
$(obj).addClass("checkfail");if($(obj).nextAll(".warningshow")[0])
{$(obj).nextAll(".warningshow").eq(0).html(managepwdwarn);}
else
{$(obj).parent(".skform-input").append("<span class='warningshow' style='left:10%;'>"+managepwdwarn+"<span>");}
$(obj).blur(function(){setTimeout(function(){$(obj).focus();},0);});$(obj).parents(".content").next().find("input").attr("disabled",true);}
else if(operator=="ctcc"&&-3==checkStrSpecilCharacter(value))
{if(!$(obj).hasClass("checkfail"))
$(obj).addClass("checkfail");if($(obj).nextAll(".warningshow")[0])
{$(obj).nextAll(".warningshow").eq(0).html(managepwdwarn1);}
else
{$(obj).parent(".skform-input").append("<span class='warningshow' style='left:10%;'>"+managepwdwarn1+"<span>");}
$(obj).blur(function(){setTimeout(function(){$(obj).focus();},0);});}
else
{if($(obj).hasClass("checkfail"))
$(obj).removeClass("checkfail");if($(obj).nextAll(".warningshow"))
$(obj).nextAll(".warningshow").remove();$(obj).unbind("blur");$(obj).parents(".content").next().find("input").removeAttr("disabled");}}
function isValidIpAddress(address){ipParts=address.split('/');if(ipParts.length>2)return false;if(ipParts.length==2){num=parseInt(ipParts[1]);if(num<=0||num>32)
return false;}
if(ipParts[0]=='0.0.0.0'||ipParts[0]=='255.255.255.255')
return false;addrParts=ipParts[0].split('.');if(addrParts.length!=4)return false;for(i=0;i<4;i++){if(isNaN(addrParts[i])||addrParts[i]=="")
return false;num=parseInt(addrParts[i]);if(num<0||num>255)
return false;}
return true;}
function check_ipv4addr(obj)
{var value=$(obj).val();if(isValidIpAddress(value)==false||isValidStaticIpAddress(value)==false)
{if(!$(obj).hasClass("checkfail"))
$(obj).addClass("checkfail");$(obj).blur(function(){setTimeout(function(){$(obj).focus();},0);});$(obj).parents(".content").next().find("input").attr("disabled",true);}
else
{if($(obj).hasClass("checkfail"))
$(obj).removeClass("checkfail");if($(obj).nextAll(".warningshow"))
$(obj).nextAll(".warningshow").remove();$(obj).unbind("blur");$(obj).parents(".content").next().find("input").removeAttr("disabled");}}
function getLeftMostZeroBitPos(num){var i=0;var numArr=[128,64,32,16,8,4,2,1];for(i=0;i<numArr.length;i++)
if((num&numArr[i])==0)
return i;return numArr.length;}
function getRightMostOneBitPos(num){var i=0;var numArr=[1,2,4,8,16,32,64,128];for(i=0;i<numArr.length;i++)
if(((num&numArr[i])>>i)==1)
return(numArr.length-i-1);return-1;}
function isValidSubnetMask(mask){var i=0,num=0;var zeroBitPos=0,oneBitPos=0;var zeroBitExisted=false;if(mask=='0.0.0.0')
return false;maskParts=mask.split('.');if(maskParts.length!=4)return false;for(i=0;i<4;i++){if(isNaN(maskParts[i])==true)
return false;num=parseInt(maskParts[i]);if(num<0||num>255)
return false;if(zeroBitExisted==true&&num!=0)
return false;zeroBitPos=getLeftMostZeroBitPos(num);oneBitPos=getRightMostOneBitPos(num);if(zeroBitPos<oneBitPos)
return false;if(zeroBitPos<8)
zeroBitExisted=true;}
return true;}
function check_netmask(obj)
{var value=$(obj).val();if(!isValidSubnetMask(value))
{if(!$(obj).hasClass("checkfail"))
$(obj).addClass("checkfail");$(obj).blur(function(){setTimeout(function(){$(obj).focus();},0);});$(obj).parents(".content").next().find("input").attr("disabled",true);}
else
{if($(obj).hasClass("checkfail"))
$(obj).removeClass("checkfail");if($(obj).nextAll(".warningshow"))
$(obj).nextAll(".warningshow").remove();$(obj).unbind("blur");$(obj).parents(".content").next().find("input").removeAttr("disabled");}}
function isValidIpAddressStaticDns_quick(address){if(checkNull(address)==false)
{return true;}
ipParts=address.split('/');if(ipParts.length>2)return false;if(ipParts.length==2){num=parseInt(ipParts[1]);if(num<=0||num>32)
return false;}
if(ipParts[0]=='0.0.0.0'||ipParts[0]=='255.255.255.255')
return false;addrParts=ipParts[0].split('.');if(addrParts.length!=4)return false;num=parseInt(addrParts[3]);if(num==255||num==0)
return false;num=parseInt(addrParts[0]);if(num>=224)
return false;for(i=0;i<4;i++){if(isNaN(addrParts[i])||addrParts[i]=="")
return false;num=parseInt(addrParts[i]);if(num<0||num>255)
return false;}
return true;}
function check_staticdns(obj)
{var value=$(obj).val();if(!isValidIpAddressStaticDns_quick(value))
{if(!$(obj).hasClass("checkfail"))
$(obj).addClass("checkfail");$(obj).blur(function(){setTimeout(function(){$(obj).focus();},0);});$(obj).parents(".content").next().find("input").attr("disabled",true);}
else
{if($(obj).hasClass("checkfail"))
$(obj).removeClass("checkfail");if($(obj).nextAll(".warningshow"))
$(obj).nextAll(".warningshow").remove();$(obj).unbind("blur");$(obj).parents(".content").next().find("input").removeAttr("disabled");}}
function getByteLen(value){var len=0;for(var i=0;i<value.length;i++){var a=value.charAt(i);if(a.match(/[^\x00-\xff]/ig)!=null)
len+=3;else
len+=1;}
return len;}
function isValidSsid(value)
{if(value==""||value==null){return false;}
var len=getByteLen(value);if((len<1)||(len>29)){return false;}
return true;}
function check_wlanssid(obj)
{var warn1=_("i18n_comm Please enter 1-29 characters.");var value=$(obj).val();if(!isValidSsid(value))
{if(!$(obj).hasClass("checkfail"))
$(obj).addClass("checkfail");$(obj).parent(".skform-input").append("<span class='warningshow'>"+warn1+"<span>");$(obj).blur(function(){setTimeout(function(){$(obj).focus();},0);});$(obj).parents(".content").next().find("input").attr("disabled",true);}
else
{if($(obj).hasClass("checkfail"))
$(obj).removeClass("checkfail");if($(obj).nextAll(".warningshow"))
$(obj).nextAll(".warningshow").remove();$(obj).unbind("blur");$(obj).parents(".content").next().find("input").removeAttr("disabled");}}
function isValidwlanPassword(value,obj)
{var warn1=_("i18n_comm Password can't be NULL");var warn2=_("i18n_comm Please enter 8-63 characters.");var warn3=_("i18n_comm Invalid password, spaces are not supported.");var warn4=_("i18n_comm Invalid password, unsupported characters:");var reg=/^(?!.*[<>])[\da-zA-Z\?.@!#$%^*()+-_]/;if($(obj).nextAll(".warningshow"))
$(obj).nextAll(".warningshow").remove();if(value==""||value==null){$(obj).parent(".skform-input").append("<span class='warningshow'>"+warn1+"<span>");return false;}
var len=value.length;if((len<8)||(len>63)){$(obj).parent(".skform-input").append("<span class='warningshow'>"+warn2+"<span>");return false;}
for(var j=0;j<len;j++)
{var a=value.charAt(j);if(a==' '){$(obj).parent(".skform-input").append("<span class='warningshow'>"+warn3+"<span>");return false;}
if(value.charCodeAt(j)<33||value.charCodeAt(j)>122){$(obj).parent(".skform-input").append("<span class='warningshow'>"+warn4+""+a+"<span>");return false;}
if(!reg.test(a)){$(obj).parent(".skform-input").append("<span class='warningshow'>"+warn4+""+a+"<span>");return false;}}
return true;}
function check_wlanpasswd(obj)
{var strongpwdwarn=_("WiFi Password Note");var wlanpwdwarn=_("i18n_comm The WiFi password cannot be the same as the management password.");var value=$(obj).val();if("ap_password"==$(obj).attr("id")){return;}
if(!isValidwlanPassword(value,obj))
{if(!$(obj).hasClass("checkfail"))
$(obj).addClass("checkfail");$(obj).blur(function(){setTimeout(function(){$(obj).focus();},0);});$(obj).parents(".content").next().find("input").attr("disabled",true);}
else if(operator=="ctcc"&&value==$("#Frm_user_password").val())
{if(!$(obj).hasClass("checkfail"))
$(obj).addClass("checkfail");if($(obj).nextAll(".warningshow")[0])
{$(obj).nextAll(".warningshow").eq(0).html(wlanpwdwarn);}
else
{$(obj).parent(".skform-input").append("<span class='warningshow' style='left:10%;'>"+wlanpwdwarn+"<span>");}
$(obj).blur(function(){setTimeout(function(){$(obj).focus();},0);});$(obj).parents(".content").next().find("input").attr("disabled",true);}
else if(operator=="ctcc"&&-3==checkStrSpecilCharacter(value))
{if($(obj).hasClass("checkfail"))
$(obj).removeClass("checkfail");if($(obj).nextAll(".warningshow")[0])
{$(obj).nextAll(".warningshow").eq(0).html(strongpwdwarn);}
else
{$(obj).parent(".skform-input").append("<span class='warningshow' style='left:10%;'>"+strongpwdwarn+"<span>");}
$(obj).unbind("blur");if($(obj).parents(".content").next().find("input").is(":disabled")){$(obj).parents(".content").next().find("input").removeAttr("disabled");}}
else
{if($(obj).hasClass("checkfail"))
$(obj).removeClass("checkfail");if($(obj).nextAll(".warningshow"))
$(obj).nextAll(".warningshow").remove();$(obj).unbind("blur");$(obj).parents(".content").next().find("input").removeAttr("disabled");}}
function check_data_valid(obj)
{var datatype=$(obj).attr("data-type");switch(datatype)
{case"username":check_pppusername(obj);break;case"password":check_pppusername(obj);break;case"ipv4addr":check_ipv4addr(obj);break;case"netmask":check_netmask(obj);break;case"staticdns":check_staticdns(obj);break;case"wlanssid":check_wlanssid(obj);break;case"wlanpasswd":check_wlanpasswd(obj);break;case"mpasswd":check_mangepasswd(obj);break;}}
function slide_page(direct,currentid,goal)
{if(direct=="right")
{setTimeout("pageleftshow('"+currentid+"','"+goal+"');",30);}
else if(direct=="left")
{if(!$(goal).hasClass("pageleft"))
$(goal).addClass("pageleft");$(goal).siblings().each(function(i,item){if($(item).hasClass("pageleft"))
{$(item).removeClass("pageleft");}});$(currentid).siblings().each(function(i,item){if($(item).hasClass("pageright"))
{$(item).hide();$(item).removeClass("pageright");}});$("#"+currentid).removeClass('pageshow').addClass('pageright');$(goal).show();setTimeout("pagerightshow('"+currentid+"','"+goal+"');",30);}}
function pageleftshow(currentid,goal)
{if(!$(goal).hasClass("pageright"))
$(goal).addClass("pageright");$(goal).siblings().each(function(i,item){if($(item).hasClass("pageright"))
{$(item).removeClass("pageright");}
if($(item).hasClass("pageleft"))
{$(item).hide();$(item).removeClass("pageleft");}});$("#"+currentid).removeClass('pageshow').addClass('pageleft');$(goal).show();setTimeout("$('#"+currentid+"').hide(); $('"+goal+"').removeClass('pageright').addClass('pageshow');",400);}
function pagerightshow(currentid,goal)
{$(goal).removeClass("pageleft");setTimeout("$('#"+currentid+"').hide(); $('"+goal+"').removeClass('pageleft').addClass('pageshow');",400);}
function copyWifiPasswd(obj)
{if(!$(obj).is(':checked')){$("#userpasswdlist").slideDown(300);$("#Frm_user_password").val("");$("#Frm_user_password").keyup();$("#Frm_user_password_confim").val("");$("#Frm_user_password_confim").keyup();}
else{$("#userpasswdlist").slideUp(300);$("#Frm_user_password").val("12345678");$("#Frm_user_password").keyup();$("#Frm_user_password_confim").val("12345678");$("#Frm_user_password_confim").keyup();}}
function uplinkmode_check(checkrel)
{if(checkrel.checkresult=="1")
{switch(checkrel.uplinkmode)
{case"DHCP":$(".wanselect ul li:eq(0)").click();$("#wansnetload").hide();$(".wancheck").hide();$("#wanform").fadeIn(300);break;case"PPPoE":var direct="right";var currentid="wanselectpage";var goal="#pppsetpage";$(".wanselect ul li:eq(1)").click();$("#wansnetload").hide();$(".wancheck").hide();$("#wanform").fadeIn(300);slide_page(direct,currentid,goal);break;}
checkcount=0;}
else
{if(checkcount<2)
{setTimeout("ajax_check_upmode();",1000);checkcount++;}
else
{$(".wanselect ul li:eq(0)").click();$("#wansnetload").hide();$(".wancheck").hide();$("#wanform").fadeIn(300);checkcount=0;}}}
function ajax_check_upmode()
{$.get("rtUplinkModeCheck.cmd",function(result,status){var datarel=JSON.parse(result);uplinkmode_check(datarel);});}
function setinputfaile(obj)
{if(!$(obj).hasClass("checkfail"))
$(obj).addClass("checkfail");$(obj).blur(function(){setTimeout(function(){$(obj).focus();},0);});}
function checkisempty(obj)
{if($(obj).val()==""||$(obj).val()==null)
return true;else
return false;}
function set5GName()
{var ssid5GName;var ssid2GName=getValue("Frm_SSID_ABANDNAME");if(ssid2GName.length>0)
{if(getChecked("Frm_Dual_Freqency")==true)
{ssid5GName=ssid2GName;}
else
ssid5GName=ssid2GName+"-5G";}
else
{ssid5GName="";}
setValue("Frm_SSID_GBANDNAME",ssid5GName);}
function apAuthModeToStr(authmode)
{var strAuthMode;switch(authmode){case"0":strAuthMode="OPEN";break;case"1":strAuthMode="WEP";break;case"2":strAuthMode="WPA-Personal";break;case"3":strAuthMode="WPA2-Personal";break;case"6":strAuthMode="WPA/WPA2PSK";break;case"10":strAuthMode="WPA3PSK";break;case"11":strAuthMode="WPA2/WPA3PSK";break;default:strAuthMode=authmode;break;}
return strAuthMode;}
function apAuthModeToStaMode(authmode)
{var staAuthMode;switch(authmode){case"0":staAuthMode=0;break;case"1":staAuthMode=1;break;case"2":staAuthMode=2;break;case"3":staAuthMode=3;break;case"6":staAuthMode=6;break;case"10":staAuthMode=7;break;case"11":staAuthMode=8;break;default:staAuthMode=authmode;break;}
return staAuthMode;}
function utf8to16(str){var out,i,len,c;var char2,char3;out="";len=str.length;i=0;while(i<len){c=str.charCodeAt(i++);switch(c>>4)
{case 0:case 1:case 2:case 3:case 4:case 5:case 6:case 7:out+=str.charAt(i-1);break;case 12:case 13:char2=str.charCodeAt(i++);out+=String.fromCharCode(((c&0x1F)<<6)|(char2&0x3F));break;case 14:char2=str.charCodeAt(i++);char3=str.charCodeAt(i++);out+=String.fromCharCode(((c&0x0F)<<12)|((char2&0x3F)<<6)|((char3&0x3F)<<0));break;}}
return out;}
function transwanmode(wanmode)
{var zhcnmode;switch(wanmode){case"DHCP":zhcnmode=_("i18n_comm DHCP");break;case"PPPoE":zhcnmode=_("i18n_comm PPPoE");break;case"Static":zhcnmode=_("i18n_comm Static IP");break;case"Bridge":zhcnmode=_("i18n_comm Bridge");break;case"repeater":zhcnmode=_("i18n_comm Repeater");break;}
return zhcnmode;}
function jump()
{if(sid=="")
window.location.href = "app.html"; else
window.location.href = "login.html"; }
function generateRandomString(length){var characters='ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';var result='';for(var i=0;i<length;i++){var randomIndex=Math.floor(Math.random()*characters.length);result+=characters.charAt(randomIndex);}
return result;}
function ping_router()
{var wanparam=new Array("rtweb.devinfo","get",{});var jsonparam={"id":1,"params":wanparam};sk_auth_post(jsonparam,function(result){if(result.error&&result.error.message=="Object not found")
{setTimeout("ping_router()",3000);}
else
{jump();}},function(){setTimeout("ping_router()",3000);});}
function gotologin()
{var warn1=_("i18n_comm Redirecting, please ensure the device is properly connected...");$(".SuccPageInfo").hide();$("#datauploading p").html(warn1);$("#datauploading").show();ping_router();}
function isComplexEnough(password){var str=password;var regLetter=/[a-zA-Z]/;var regNumber=/[0-9]/;var regSpecial=/[_.!@#$%^&*`~()-+=]/g;var complex=0;if(regLetter.test(str)){++complex;}
if(regNumber.test(str)){++complex;}
if(regSpecial.test(str)){++complex;}
if(complex<3||str.length<8){return false;}else{return true;}};if(!Array.isArray){Array.isArray=function(arg){return Object.prototype.toString.call(arg)==='[object Array]';};}
function fill_data(data)
{data.jsonrpc="2.0";data.method="call";data.params.unshift(sid);}
function sk_auth_post(data,callback_func,err_func)
{if(Array.isArray(data))
{for(var i=0;i<data.length;i++)
{fill_data(data[i]);}}
else
fill_data(data);var datastr=JSON.stringify(data,null,4);$.ajax({url:"/ubus",type:"POST",data:datastr,dataType:"json",success:function(result){callback_func(result);},error:function(xhr,status,error){if(typeof err_func==='function')
{err_func();}}});}
function check_wan_phystatus()
{var phyparam=new Array("gwweb.wancfg","phystatus",{});var jsonparam={"id":1,"params":phyparam};sk_auth_post(jsonparam,function(rel){if(rel.error)
{setTimeout(check_wan_phystatus,2000);}
else
{if(rel.result[1].phystatus==true)
{$("#wanselectpage .pageheader").show();$("#wansnetload").hide();$(".wancheck").hide();$("#wanform").fadeIn(300);}
else
{$("#wanselectpage .pageheader").hide();$("#wansnetload").hide();$("#wanform").hide();$(".wancheck").fadeIn(300);}}});}
function startWanCheck()
{var direct="right";var currentid="mainpage";var goal="#wanselectpage";$("#wanform").hide();$(".wancheck").hide();$("#wansnetload").show();slide_page(direct,currentid,goal);check_wan_phystatus();}
function gotonetrescan()
{$("#wanform").hide();$(".wancheck").hide();$("#wansnetload").show();check_wan_phystatus();}
function showwanselect()
{$(".wancheck").hide();$("#wansnetload").hide();$("#wanform").fadeIn(300);$("#wanselectpage .pageheader").show();}
function show_wlan()
{var ubusparamGlobal=new Array("rtweb.wifi","wlanGlobalGet",{});var ubusparamBSS=new Array("rtweb.wifi","wlanBasicGet",{"band":"all","index":1});var jsonparam=[{"id":1,"params":ubusparamGlobal},{"id":2,"params":ubusparamBSS}];sk_auth_post(jsonparam,function(result){$.each(result,function(index,obj){if(obj.id==1)
{if(obj.result[1].bandsteering==1)
setChecked("Frm_Dual_Freqency",true);else
setChecked("Frm_Dual_Freqency",false);dualFrequency_set();}
else
{setValue("Frm_SSID_ABANDNAME",obj.result[1].bss[0].ssid);setValue("Frm_wlan_password",obj.result[1].bss[0].password);setValue("Frm_SSID_GBANDNAME",getValue("Frm_SSID_ABANDNAME")+"-5G");}});});}
function gotoselectwanmode(mode)
{var direct="right";var currentid="wanselectpage";var goal="#wlansetpage";var ids=['ppp_username','ppp_passwd','Frm_IPAddress','Frm_GateWay','Frm_DNS1','Frm_DNS2'];for(var i=0;i<ids.length;i++){$('#'+ids[i]).val('');if($('#'+ids[i]).hasClass("checkfail"))
$('#'+ids[i]).removeClass("checkfail");}
if(mode==0)
{wanmode="PPPoE";goal="#pppsetpage";}
else if(mode==2)
{wanmode="Static";goal="#staticsetpage";}
else
{if(mode==1)
{wanmode="DHCP";}
else if(mode=="3")
{wanmode="Bridge";}}
slide_page(direct,currentid,goal);show_wlan();}
function gotosetppp()
{var direct="right";var currentid="pppsetpage";var goal="#wlansetpage";if(checkisempty($("#ppp_username")[0])){setinputfaile($("#ppp_username")[0]);return false;}
if(checkisempty($("#ppp_passwd")[0])){setinputfaile($("#ppp_passwd")[0]);return false;}
slide_page(direct,currentid,goal);}
function gotosetstatic()
{var direct="right";var currentid="staticsetpage";var goal="#wlansetpage";if(checkisempty($("#Frm_IPAddress")[0])){setinputfaile($("#Frm_IPAddress")[0]);return false;}
if(checkisempty($("#Frm_SubnetMask")[0])){setinputfaile($("#Frm_SubnetMask")[0]);return false;}
if(checkisempty($("#Frm_GateWay")[0])){setinputfaile($("#Frm_GateWay")[0]);return false;}
if(checkisempty($("#Frm_DNS1")[0])){setinputfaile($("#Frm_DNS1")[0]);return false;}
slide_page(direct,currentid,goal);}
function convert_positive(a)
{if(a<0){a=a* -1;}
return a;}
function add_radiolist(radiol24G,radiol5G,mode)
{var ssign_l;var ssign_m;if(mode==0)
{ssign_l=0;ssign_m=60;}
else if(mode==1)
{ssign_l=60;ssign_m=84;}
else
{ssign_l=84;ssign_m=100;}
$.each(radiol5G,function(index,obj){obj.RadioType=1;var signal=convert_positive(obj.Signal);if(signal>ssign_l&&signal<=ssign_m)
{radiolist.push(obj);}});$.each(radiol24G,function(index,obj){obj.RadioType=0;var signal=convert_positive(obj.Signal);if(signal>ssign_l&&signal<=ssign_m)
{radiolist.push(obj);}});}
function apAuthModeToStr(authmode)
{var strAuthMode;switch(authmode){case"0":strAuthMode="OPEN";break;case"1":strAuthMode="WEP";break;case"2":strAuthMode="WPA-Personal";break;case"3":strAuthMode="WPA2-Personal";break;case"6":strAuthMode="WPA/WPA2PSK";break;case"10":strAuthMode="WPA3PSK";break;case"11":strAuthMode="WPA2/WPA3PSK";break;default:strAuthMode=authmode;break;}
return strAuthMode;}
function utf8HexToText(hex){const hexString=hex.slice(2);const bytes=[];for(let i=0;i<hexString.length;i+=2){bytes.push(parseInt(hexString.substr(i,2),16));}
const decoder=new TextDecoder('utf-8');const string=decoder.decode(new Uint8Array(bytes));return string;}
function SpeedFormated(result)
{var number2=result.result[1].number2;var number5=result.result[1].number5;if(number2+number5>0)
{for(var i=0;i<number2;i++)
{var Essid=result.result[1]["2.4G"][i].ssid;var Channel=result.result[1]["2.4G"][i].channel;var MacAddr=result.result[1]["2.4G"][i].bssid;var AuthMode=result.result[1]["2.4G"][i].securityMode;var Encrypt=result.result[1]["2.4G"][i].encrypt;var Signal=result.result[1]["2.4G"][i].rssi;var RadioType=result.result[1]["2.4G"][i].band;if(Essid.slice(0,2)=="0x"){Essid=utf8HexToText(Essid);}
radiolist24G.push({"Essid":Essid,"Channel":Channel,"MacAddr":MacAddr,"AuthMode":AuthMode,"Encrypt":Encrypt,"Signal":Signal,"RadioType":"0"});}
for(var i=0;i<number5;i++)
{var Essid=result.result[1]["5G"][i].ssid;var Channel=result.result[1]["5G"][i].channel;var MacAddr=result.result[1]["5G"][i].bssid;var AuthMode=result.result[1]["5G"][i].securityMode;var Encrypt=result.result[1]["5G"][i].encrypt;var Signal=result.result[1]["5G"][i].rssi;var RadioType=result.result[1]["5G"][i].band;if(Essid.slice(0,2)=="0x"){Essid=utf8HexToText(Essid);}
radiolist5G.push({"Essid":Essid,"Channel":Channel,"MacAddr":MacAddr,"AuthMode":AuthMode,"Encrypt":Encrypt,"Signal":Signal,"RadioType":"1"});}
var band;for(var i=0;i<3;i++)
add_radiolist(radiolist24G,radiolist5G,i);var row="";$.each(radiolist,function(index,obj){var signalclass;var signal=convert_positive(obj.Signal);if(signal<60)
signalclass="bi-wifi";else if(signal>=60&&signal<84)
signalclass="bi-wifi-2";else
signalclass="bi-wifi-1";if(obj.RadioType=="0")
band="2.4G";else
band="5G";if(obj.Essid!="")
{if(obj.AuthMode!="0")
row+="<li ui-index='"+index+"'><div class='list-li-lable'><div class='li-lable-ver1'><span>"+obj.Essid+"</span></div><div class='li-lable-ver2'><span>"+apAuthModeToStr(obj.AuthMode)+"&nbsp;&nbsp;"+(band)+"</span></div></div><div class='list-li-content'>"
+"<i class='bi-lock-fill'></i><i class='"+signalclass+"'></i><i class='bi-chevron-right'></i></div></li>";else
row+="<li ui-index='"+index+"'><div class='list-li-lable'><div class='li-lable-ver1'><span>"+obj.Essid+"</span></div><div class='li-lable-ver2'><span>"+"OPEN"+"&nbsp;&nbsp;"+(band)+"</span></div></div><div class='list-li-content'>"
+"<i class='"+signalclass+"'></i><i class='bi-chevron-right'></i></div></li>";}});$("#repeaterwlanlist").empty();$("#repeaterwlanlist").html(row);$("#connectwarning").hide();$("#repeatlist").fadeIn(300);$("#repeaterloading").hide();$("#repeaterform").hide();$("#repeaterwlanlist li").on('click',function(e){var index=$(this).attr("ui-index");$("#wlanindex").val(index);$("#ap_ssid").val(radiolist[index].Essid);$("#connectwarning").hide();$("#repeatlist").hide(300);$("#repeaterloading").hide();if(radiolist[index].AuthMode=="0")
$("#ap_password").parents(".skform-group").hide();else
$("#ap_password").parents(".skform-group").show();$("#repeaterform").fadeIn(300);});}}
function get_ap_list()
{var ajaxObj=new AJAXObj();var ubusparam=new Array("rtweb.wifi","wlanScanResultGet",{"band":"all"});var jsonparam={"id":1,"params":ubusparam};var number2=0,number5=0;sk_auth_post(jsonparam,function(result){number2=result.result[1].number2;number5=result.result[1].number5;if(number2==0&&number5==0){g_ap_interval=setTimeout("get_ap_list()",1000);}else{clearTimeout(g_ap_timeout);SpeedFormated(result);}});}
function get_ap_list_timeout()
{clearTimeout(g_ap_interval);clearTimeout(g_ap_timeout);$("#repeatlist").hide();$("#repeaterloading").hide();$("#repeaterform").hide();$("#connectwarning").fadeIn(300);}
function wifiscan_list()
{$("#connectwarning").hide();$("#repeatlist").hide();$("#repeaterform").hide();$("#repeaterloading").show();radiolist24G=new Array();radiolist5G=new Array();radiolist=new Array();var ubusparam=new Array("rtweb.wifi","wlanScanTrigger",{"band":"all"});var jsonparam={"id":1,"params":ubusparam};sk_auth_post(jsonparam,function(result){clearTimeout(g_ap_interval);clearTimeout(g_ap_timeout);get_ap_list();g_ap_timeout=setTimeout(get_ap_list_timeout,30000);});}
function gotorepeater()
{var direct="right";var currentid="wanselectpage";var goal="#repeatersetpage";wanmode="repeater";wifiscan_list();slide_page(direct,currentid,goal);}
function gotosetrepeater()
{var direct="right";var currentid="repeatersetpage";var goal="#wlansetpage";if(checkisempty($("#ap_password")[0])&&$("#ap_password").parents(".skform-group").is(":visible")){setinputfaile($("#ap_password")[0]);return false;}
wanmode="repeater";show_wlan();slide_page(direct,currentid,goal);}
function getmsg(id)
{var str=new Array();var warn1=_("i18n_comm Error, the SSID contains unsupported special characters:");str[0]=new Array(113,warn1);return getMsgFormArray(str,arguments);}
function quickcheckssid2g()
{var check;var msg;check=skyCheckSpecialChar(getValue("Frm_SSID_ABANDNAME"));if(check!=true)
{msg=getmsg(113,check);setinputfaile($("#Frm_SSID_ABANDNAME")[0]);if(!$("#Frm_SSID_ABANDNAME").nextAll(".warningshow")[0])
$("#Frm_SSID_ABANDNAME").parent(".skform-input").append("<span class='warningshow'>SSID"+msg+"<span>");$("#Frm_SSID_ABANDNAME").nextAll(".warningshow").css("left","20%");return false;}
return true;}
function quickcheckssid5g()
{var check;var msg;check=skyCheckSpecialChar(getValue("Frm_SSID_GBANDNAME"));if(check!=true)
{msg=getmsg(113,check);setinputfaile($("#Frm_SSID_GBANDNAME")[0]);if(!$("#Frm_SSID_GBANDNAME").nextAll(".warningshow")[0])
$("#Frm_SSID_GBANDNAME").parent(".skform-input").append("<span class='warningshow'>5G SSID"+msg+"<span>");$("#Frm_SSID_GBANDNAME").nextAll(".warningshow").css("left","20%");return false;}
return true;}
function wifiReload()
{var ubusparam=new Array("rtweb.wifi","reload",{});var jsonparam={"id":1,"params":ubusparam};sk_auth_post(jsonparam,function(result){console.log("wifi reload");});}
var enable;function get_Prpl_enable()
{var ubusparam=new Array("rtweb.mesh","wlanMeshGet",{});var jsonparam={"id":1,"params":ubusparam};sk_auth_post(jsonparam,function(result){enable=result.result[1].enable;console.log("get_Prplenable  enable=");console.log(enable);});}
function manage_apply()
{var radiodata=new Array();var bssiddata=new Array();var network_data={};var bandsteering=0;var userpassword;if($('#userpasswdcheck').is(':checked'))
userpassword=$("#Frm_wlan_password").val();else
userpassword=$("#Frm_user_password").val();var userparam=new Array("rtweb.session","setPassword",{"username":web_account,"password":getAES(userpassword)});var obj24g={"band":"2.4G","enable":1};var obj5g={"band":"5G","enable":1};radiodata.push(obj24g);radiodata.push(obj5g);var wifiradioparam=new Array("rtweb.wifi","wlanRadioSet",{"radios":radiodata});var ssid2=getValue("Frm_SSID_ABANDNAME");var password2=getAES(getValue("Frm_wlan_password"));var ssidHidden2=0;var ssid5=getValue("Frm_SSID_GBANDNAME");var password5=getAES(getValue("Frm_wlan_password"));var ssidHidden5=0;if($("#Frm_Dual_Freqency").is(':checked'))
{ssid5=ssid2;bandsteering=1;}
else
{bandsteering=0;}
var bssid24g={"band":"2.4G","index":1,"ssid":ssid2,"securityMode":"WPA2-PSK","encrypt":"AESEncryption","password":password2,"maxAssoc":64,"hide":ssidHidden2};bssiddata.push(bssid24g);var bssid5g={"band":"5G","index":1,"ssid":ssid5,"securityMode":"WPA2-PSK","encrypt":"AESEncryption","password":password5,"maxAssoc":64,"hide":ssidHidden5};bssiddata.push(bssid5g);var bssidparam=new Array("rtweb.wifi","wlanBasicSet_encrypt",{"bss":bssiddata});var global={"bandsteering":bandsteering,"bsSetssid":0};var ubusparamGlobal=new Array("rtweb.wifi","wlanGlobalSet",global);network_data.index=1;network_data.servicelist=2;switch(wanmode){case"DHCP":network_data.networktype="dhcp";break;case"PPPoE":network_data.networktype="pppoe";break;case"Static":network_data.networktype="static";break;case"Bridge":network_data.networktype="ap-bridge";break;case"repeater":break;}
if(network_data.networktype!="ap-bridge")
{network_data.natenable=1;}
else
{network_data.mtu=1500;network_data.vlanmode=1;network_data.IPStack=3;network_data.guasrc=3;network_data.dnsv6src=1;network_data.prefixsrc=1;network_data.prefix="/";}
if(network_data.networktype=="pppoe")
{network_data.pppoename=getValue("ppp_username");network_data.pppoepwd=getAES(getValue("ppp_passwd"));network_data.mtu=1492;network_data.IPStack=3;network_data.vlanmode=1;}
else if(network_data.networktype=="static")
{network_data.ipaddr=getValue("Frm_IPAddress");network_data.subnetmask=getValue("Frm_SubnetMask");network_data.gateway=getValue("Frm_GateWay");if(getValue("Frm_DNS1")!="")
{network_data.dns1=getValue("Frm_DNS1");}
if(getValue("Frm_DNS2")!="")
{network_data.dns2=getValue("Frm_DNS2");}
network_data.IPStack=1;network_data.mtu=1500;}
else if(network_data.networktype=="dhcp")
{network_data.vlanmode=1;network_data.IPStack=3;network_data.guasrc=3;network_data.dnsv6src=1;network_data.prefixsrc=1;network_data.prefix="/";network_data.mtu=1500;}
var wanparam;if(wanmode=="repeater")
{var index=$("#wlanindex").val();var apcpassword=$("#ap_password").val();var apssid=radiolist[index].Essid;if(radiolist[index].RadioType=="0"){band="2.4G";}else{band="5G";}
var auth=radiolist[index].AuthMode;var encrypt=radiolist[index].Encrypt;wanparam=new Array("rtweb.wifi","wlanApClientSet_encrypt",{"band":band,"index":0,"enable":1,"ssid":apssid,"password":getAES(apcpassword),"encrypt":encrypt,"securityMode":auth});}
else
wanparam=new Array("gwweb.wancfg","setWanCfg_encrypt",network_data);console.log('prplmesh.enalbe is'+' '+enable);var prplparam=new Array("rtweb.mesh","wlanMeshSet",{"enable":1,"roleexchange":1,"role":1,"mode":0});var jsonparam=[{"id":1,"params":userparam},{"id":3,"params":wanparam}];var jsonparam_wifi;if(enable)
{console.log("change role to controller");jsonparam_wifi=[{"id":1,"params":bssidparam},{"id":2,"params":wifiradioparam},{"id":3,"params":ubusparamGlobal},{"id":4,"params":prplparam}];}
else
{console.log("prplmesh is not enable");jsonparam_wifi=[{"id":1,"params":bssidparam},{"id":2,"params":wifiradioparam},{"id":3,"params":ubusparamGlobal}];}
sk_auth_post(jsonparam_wifi,function(result){wifiReload();sk_auth_post(jsonparam,function(result1){let endTid=setTimeout(function(){});for(let i=0;i<=endTid;i++){clearTimeout(i);}
setTimeout(function(){$("#datauploading").hide();$(".SuccPageInfo").fadeIn(300);},16000);});});}
function dualFrequency_set()
{if(getChecked("Frm_Dual_Freqency")==true)
{setValue("Frm_SSID_GBANDNAME",getValue("Frm_SSID_ABANDNAME"));jslDiDisplay("5g_ssid");}
else
{setValue("Frm_SSID_GBANDNAME",getValue("Frm_SSID_ABANDNAME")+"-5G");jslEnDisplay("5g_ssid");}}
function quicksetdata_appy()
{var quicksetparam=new Array("rtweb.system","quickset",{});var jsonparam={"id":1,"params":quicksetparam}
var TimeoutFlag=setTimeout(function(){$("#datauploading").hide();$(".SuccPageInfo").fadeIn(300);},20000);sk_auth_post(jsonparam,function(result){manage_apply();});}
function gotosetwifi()
{var warn1=_("i18n_comm Password can't be NULL");var warn2=_("i18n_comm Inconsistent with the router password");var warn3=_("i18n_comm The login password cannot exceed 32 characters.");if(checkisempty($("#Frm_SSID_ABANDNAME")[0])){setinputfaile($("#Frm_SSID_ABANDNAME")[0]);return false;}
if(checkisempty($("#Frm_SSID_GBANDNAME")[0])){setinputfaile($("#Frm_SSID_GBANDNAME")[0]);return false;}
if(false==quickcheckssid2g()||false==quickcheckssid5g())
{return false;}
if(checkisempty($("#Frm_wlan_password")[0])){setinputfaile($("#Frm_wlan_password")[0]);return false;}
if($("#userpasswdlist").is(":visible"))
{if(checkisempty($("#Frm_user_password")[0])){setinputfaile($("#Frm_user_password")[0]);if(!$("#Frm_user_password").nextAll(".warningshow")[0])
$("#Frm_user_password").parent(".skform-input").append("<span class='warningshow'>"+warn1+"<span>");return false;}
if(checkisempty($("#Frm_user_password_confim")[0])){setinputfaile($("#Frm_user_password_confim")[0]);if(!$("#Frm_user_password_confim").nextAll(".warningshow")[0])
$("#Frm_user_password_confim").parent(".skform-input").append("<span class='warningshow'>"+warn2+"<span>");return false;}
if($("#Frm_user_password").val()!=$("#Frm_user_password_confim").val())
{setinputfaile($("#Frm_user_password_confim")[0]);if(!$("#Frm_user_password_confim").nextAll(".warningshow")[0])
$("#Frm_user_password_confim").parent(".skform-input").append("<span class='warningshow'>"+warn2+"<span>");return false;}}
else
{if(!isValidMPassword($("#Frm_wlan_password").val()))
{setinputfaile($("#Frm_wlan_password")[0]);if(!$("#Frm_user_password_confim").nextAll(".warningshow")[0])
$("#Frm_wlan_password").parent(".skform-input").append("<span class='warningshow'>"+warn3+"<span>");return false;}}
var zhcnwanmode=transwanmode(wanmode);if($('#userpasswdcheck').is(':checked'))
var userpassword=$("#Frm_wlan_password").val();else
var userpassword=$("#Frm_user_password").val();var wlanssid24g=$("#Frm_SSID_ABANDNAME").val();if(!$("#Frm_Dual_Freqency").is(':checked'))
var wlanssid5g=$("#Frm_SSID_GBANDNAME").val();else
var wlanssid5g=wlanssid24g;var wlanpasswd24g=$("#Frm_wlan_password").val();var wlanpasswd5g=wlanpasswd24g;$("#wanconfigmode").html(zhcnwanmode);$("#user_passwd").html(userpassword);$("#ssid_name").html(wlanssid24g);$("#ssid_passwd").html(wlanpasswd24g);$("#ssid_name_5g").html(wlanssid5g);$("#ssid_passwd_5g").html(wlanpasswd5g);$("#wlansetpage").hide()
$("#SuccPage").fadeIn(300);window.location.hash="#SuccPage";quicksetdata_appy();}