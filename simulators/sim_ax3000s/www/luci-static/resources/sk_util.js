
function isHexaDigit(digit){var hexVals=new Array("0","1","2","3","4","5","6","7","8","9","A","B","C","D","E","F","a","b","c","d","e","f");var len=hexVals.length;var i=0;var ret=false;for(i=0;i<len;i++)
if(digit==hexVals[i])break;if(i<len)
ret=true;return ret;}
function myTrim(str,chr)
{if("."==chr)
{var reg=new RegExp('((\\'+chr+')*$)','g');}
else
{var reg=new RegExp('(('+chr+')*$)','g');}
return str.replace(reg,"");}
function isValidKey(val,size){var ret=false;var len=val.length;var dbSize=size*2;if(len==size)
ret=true;else if(len==dbSize){for(i=0;i<dbSize;i++)
if(isHexaDigit(val.charAt(i))==false)
break;if(i==dbSize)
ret=true;}else
ret=false;return ret;}
function isValidHexKey(val,size){var ret=false;if(val.length==size){for(i=0;i<val.length;i++){if(isHexaDigit(val.charAt(i))==false){break;}}
if(i==val.length){ret=true;}}
return ret;}
function isNameUnsafe(compareChar){var unsafeString="\"<>%\\^[]`\+\$\,='#&@.: \t";if(unsafeString.indexOf(compareChar)==-1&&compareChar.charCodeAt(0)>32&&compareChar.charCodeAt(0)<123)
return false;else
return true;}
function isValidName(name){var i=0;for(i=0;i<name.length;i++){if(isNameUnsafe(name.charAt(i))==true)
return false;}
return true;}
function isHostNameUnsafe(compareChar){var unsafeString="\"<>%\\^[]`\+\$\,='#&@.: \t";if(unsafeString.indexOf(compareChar)==-1)
return false;else
return true;}
function isValidHostName(name){var i=0;for(i=0;i<name.length;i++){if(isHostNameUnsafe(name.charAt(i))==true)
return false;}
return true;}
function isCharUnsafe(compareChar){var unsafeString="\"<>%\\^[]`\+\$\,='#&@.:\t";if(unsafeString.indexOf(compareChar)==-1&&compareChar.charCodeAt(0)>=32&&compareChar.charCodeAt(0)<123)
return false;else
return true;}
function isValidNameWSpace(name){var i=0;for(i=0;i<name.length;i++){if(isCharUnsafe(name.charAt(i))==true)
return false;}
return true;}
function checkeURLSimple(URL){var strRegex='^((https|http)?://)'
+'(([0-9]{1,3}\.){3}[0-9]{1,3}'
+'|'
+'([0-9A-Za-z]{1,61}\.)+'
+'[A-Za-z]{2,6})'
+'(:[0-9]{1,4})?'
+'((/?)|'
+'(/[0-9A-Za-z_!~*\'().;?:@&=+$,%#-]+)+/?)$';var re=new RegExp(strRegex);if(re.test(URL)){return(true);}else{return(false);}}
function checkeURL(URL){var strRegex='^((https|http|ftp|rtsp|mms)?://)'
+'?(([0-9a-z_!~*\'().&=+$%-]+: )?[0-9a-z_!~*\'().&=+$%-]+@)?'
+'(([0-9]{1,3}\.){3}[0-9]{1,3}'
+'|'
+'[0-9A-Za-z]{3}\.'
+'([0-9A-Za-z]{1,61}\.)+'
+'[A-Za-z]{2,6})'
+'(:[0-9]{1,4})?'
+'((/?)|'
+'(/[0-9A-Za-z_!~*\'().;?:@&=+$,%#-]+)+/?)$';var re=new RegExp(strRegex);if(re.test(URL)){return(true);}else{return(false);}}
function isSameSubNet(lan1Ip,lan1Mask,lan2Ip,lan2Mask){var count=0;lan1a=lan1Ip.split('.');lan1m=lan1Mask.split('.');lan2a=lan2Ip.split('.');lan2m=lan2Mask.split('.');for(i=0;i<4;i++){l1a_n=parseInt(lan1a[i]);l1m_n=parseInt(lan1m[i]);l2a_n=parseInt(lan2a[i]);l2m_n=parseInt(lan2m[i]);if((l1a_n&l1m_n)==(l2a_n&l2m_n))
count++;}
if(count==4)
return true;else
return false;}
function calcSubNet(ipaddr,netmask)
{var ips=ipaddr.split(".");var ns=netmask.split(".");var sub="";if(ips.length!=4||ns.length!=4)
return"0.0.0.0";for(var i=0;i<4;i++)
{sub+=ips[i]&ns[i];sub+=".";}
sub=myTrim(sub,".");return sub;}
function checkNull(value)
{if(value==""||value==null)
return false;else
return true;}
function isMulticastAddr(address){ipParts=address.split('.');num=parseInt(addrParts[0]);if(num<=239&&num>=224)
{return true;}
return false;}
function isValidIpAddress(address){ipParts=address.split('/');if(ipParts.length>2)return false;if(ipParts.length==2){num=parseInt(ipParts[1]);if(num<=0||num>32)
return false;}
if(ipParts[0]=='0.0.0.0'||ipParts[0]=='255.255.255.255')
return false;addrParts=ipParts[0].split('.');if(addrParts.length!=4)return false;for(i=0;i<4;i++){if(isNaN(addrParts[i])||(-1!=addrParts[i].indexOf(" "))||addrParts[i]=="")
return false;num=parseInt(addrParts[i]);if(num<0||num>255)
return false;}
return true;}
function isValidIpAddressStaticDns(address){ipParts=address.split('/');if(ipParts.length>2)return false;if(ipParts.length==2){num=parseInt(ipParts[1]);if(num<=0||num>32)
return false;}
if(ipParts[0]=='0.0.0.0'||ipParts[0]=='255.255.255.255')
return false;addrParts=ipParts[0].split('.');if(addrParts.length!=4)return false;num=parseInt(addrParts[3]);if(num==255||num==0)
return false;num=parseInt(addrParts[0]);if(num>=224)
return false;for(i=0;i<4;i++){if(isNaN(addrParts[i])||addrParts[i]=="")
return false;num=parseInt(addrParts[i]);if(num<0||num>255)
return false;}
return true;}
function isValidIpNet6(address){ipParts=address.split('/');cnt=0;if(ipParts.length>2)return false;if(ipParts.length==2){num=parseInt(ipParts[1]);if(num<=0||num>128)
return false;}
addrParts=ipParts[0].split(':');if(addrParts.length<3||addrParts.length>8)
return false;for(i=0;i<addrParts.length;i++){if(addrParts[i]!=""){num=parseInt(addrParts[i],16);if(num>0xffff||0==num)
return false;}
else
cnt+=1;if(i==0){}
else if((i+1)==addrParts.length){}}
if(cnt>2)
return false;return true;}
function ParseIpv6Array(str)
{var Num;var i,j;var finalAddrArray=new Array();var falseAddrArray=new Array();var addrArray=str.split(':');Num=addrArray.length;if(Num>8)
{return falseAddrArray;}
for(i=0;i<Num;i++)
{if((addrArray[i].length>4)||(addrArray[i].length<1))
{return falseAddrArray;}
for(j=0;j<addrArray[i].length;j++)
{if((addrArray[i].charAt(j)<'0')||(addrArray[i].charAt(j)>'f')||((addrArray[i].charAt(j)>'9')&&(addrArray[i].charAt(j)<'a')))
{return falseAddrArray;}}
finalAddrArray[i]='';for(j=0;j<(4-addrArray[i].length);j++)
{finalAddrArray[i]+='0';}
finalAddrArray[i]+=addrArray[i];}
return finalAddrArray;}
function getFullIpv6Address(address)
{var c='';var i=0,j=0,k=0,n=0;var startAddress=new Array();var endAddress=new Array();var finalAddress='';var startNum=0;var endNum=0;var lowerAddress;var totalNum=0;lowerAddress=address.toLowerCase();var addrParts=lowerAddress.split('::');if(addrParts.length==2)
{if(addrParts[0]!='')
{startAddress=ParseIpv6Array(addrParts[0]);if(startAddress.length==0)
{return'';}}
if(addrParts[1]!='')
{endAddress=ParseIpv6Array(addrParts[1]);if(endAddress.length==0)
{return'';}}
if(startAddress.length+endAddress.length>=8)
{return'';}}
else if(addrParts.length==1)
{startAddress=ParseIpv6Array(addrParts[0]);if(startAddress.length!=8)
{return'';}}
else
{return'';}
for(i=0;i<startAddress.length;i++)
{finalAddress+=startAddress[i];if(i!=7)
{finalAddress+=':';}}
for(;i<8-endAddress.length;i++)
{finalAddress+='0000';if(i!=7)
{finalAddress+=':';}}
for(;i<8;i++)
{finalAddress+=endAddress[i-(8-endAddress.length)];if(i!=7)
{finalAddress+=':';}}
return finalAddress;}
function isMultiCastIpv6Address(address)
{var tempAddress=getFullIpv6Address(address);if(tempAddress.substring(0,2)=='ff')
{return true;}
return false;}
function isSiteLocalIpv6Address(address)
{var tempAddress=getFullIpv6Address(address);if((tempAddress.substring(0,3)=='fec')||(tempAddress.substring(0,3)=='fed')||(tempAddress.substring(0,3)=='fee')||(tempAddress.substring(0,3)=='fef'))
{return true;}
return false;}
function isLinkLocalIpv6Address(address)
{var tempAddress=getFullIpv6Address(address);if((tempAddress.substring(0,3)=='fe8')||(tempAddress.substring(0,3)=='fe9')||(tempAddress.substring(0,3)=='fea')||(tempAddress.substring(0,3)=='feb'))
{return true;}
return false;}
function isGlobalIpv6Address(address)
{var tempAddress=getFullIpv6Address(address);var temp=0;if((tempAddress=='')||(tempAddress=='0000:0000:0000:0000:0000:0000:0000:0000')||(tempAddress=='0000:0000:0000:0000:0000:0000:0000:0001')||(tempAddress.substring(0,3)=='fe8')||(tempAddress.substring(0,3)=='fe9')||(tempAddress.substring(0,3)=='fea')||(tempAddress.substring(0,3)=='feb')||(tempAddress.substring(0,2)=='ff'))
{return false;}
return true;}
function sk_isValidIpAddress6(address){var tempAddress=getFullIpv6Address(address);if(tempAddress==''||(tempAddress=='0000:0000:0000:0000:0000:0000:0000:0000')||(tempAddress=='0000:0000:0000:0000:0000:0000:0000:0001'))
{return false;}
return true;}
function isValidIpv6Address(address){ipParts=address.split('/');if(ipParts.length>2)return false;if(ipParts.length==2){num=parseInt(ipParts[1]);if(num<=0||num>128)
return false;}
if(sk_isValidIpAddress6(ipParts[0])==false)
{return false;}
return true;}
function isLinkLocalIpv6Address(address)
{var tempAddress=getFullIpv6Address(address);if((tempAddress.substring(0,3)=='fe8')||(tempAddress.substring(0,3)=='fe9')||(tempAddress.substring(0,3)=='fea')||(tempAddress.substring(0,3)=='feb'))
{return true;}
return false;}
function isValidIpAddress6StaticDns(address){ipParts=address.split('/');cnt=0;if(ipParts.length>2)return false;if(ipParts.length==2){num=parseInt(ipParts[1]);if(num<=0||num>128)
return false;}
addrParts=ipParts[0].split(':');if(addrParts.length<3||addrParts.length>8)
return false;for(i=0;i<addrParts.length;i++){if(addrParts[i]!=""){num=parseInt(addrParts[i],16);if(num>0xffff||isNaN(num))
return false;}
else
cnt+=1;if(i==0){}
else if((i+1)==addrParts.length){}}
if(cnt>1)
return false;return true;}
function isValidPrefixLength(prefixLen){var num;num=parseInt(prefixLen);if(num<=0||num>128)
return false;return true;}
function isValidMetric(metric){var num;num=parseInt(metric);if(num<0||num>9999)
return false;return true;}
function areSamePrefix(addr1,addr2){var i,j;var a=[0,0,0,0,0,0,0,0];var b=[0,0,0,0,0,0,0,0];addr1Parts=addr1.split(':');if(addr1Parts.length<3||addr1Parts.length>8)
return false;addr2Parts=addr2.split(':');if(addr2Parts.length<3||addr2Parts.length>8)
return false;j=0;for(i=0;i<addr1Parts.length;i++){if(addr1Parts[i]==""){if((i!=0)&&(i+1!=addr1Parts.length)){j=j+(8-addr1Parts.length+1);}
else{j++;}}
else{a[j]=parseInt(addr1Parts[i],16);j++;}}
j=0;for(i=0;i<addr2Parts.length;i++){if(addr2Parts[i]==""){if((i!=0)&&(i+1!=addr2Parts.length)){j=j+(8-addr2Parts.length+1);}
else{j++;}}
else{b[j]=parseInt(addr2Parts[i],16);j++;}}
for(i=0;i<4;i++){if(a[i]!=b[i]){return false;}}
return true;}
function getLeftMostZeroBitPos(num){var i=0;var numArr=[128,64,32,16,8,4,2,1];for(i=0;i<numArr.length;i++)
if((num&numArr[i])==0)
return i;return numArr.length;}
function getRightMostOneBitPos(num){var i=0;var numArr=[1,2,4,8,16,32,64,128];for(i=0;i<numArr.length;i++)
if(((num&numArr[i])>>i)==1)
return(numArr.length-i-1);return-1;}
function isValidSubnetMask(mask){var i=0,num=0;var zeroBitPos=0,oneBitPos=0;var zeroBitExisted=false;if(mask=='0.0.0.0'||mask=='255.255.255.255')
return false;maskParts=mask.split('.');if(maskParts.length!=4)return false;for(i=0;i<4;i++){if(isNaN(maskParts[i])==true||(-1!=maskParts[i].indexOf(" "))||maskParts[i]=="")
return false;num=parseInt(maskParts[i]);if(num<0||num>255)
return false;if(zeroBitExisted==true&&num!=0)
return false;zeroBitPos=getLeftMostZeroBitPos(num);oneBitPos=getRightMostOneBitPos(num);if(zeroBitPos<oneBitPos)
return false;if(zeroBitPos<8)
zeroBitExisted=true;}
return true;}
function isValidPort(port){var fromport=0;var toport=100;portrange=port.split(':');if(portrange.length<1||portrange.length>2){return false;}
if(isNaN(portrange[0]))
return false;fromport=parseInt(portrange[0]);if(portrange.length>1){if(isNaN(portrange[1]))
return false;toport=parseInt(portrange[1]);if(toport<=fromport)
return false;}
if(fromport<1||fromport>65535||toport<1||toport>65535)
return false;return true;}
function isValidNatPort(port){var fromport=0;var toport=100;portrange=port.split('-');if(portrange.length<1||portrange.length>2){return false;}
if(isNaN(portrange[0]))
return false;fromport=parseInt(portrange[0]);if(portrange.length>1){if(isNaN(portrange[1]))
return false;toport=parseInt(portrange[1]);if(toport<=fromport)
return false;}
if(fromport<1||fromport>65535||toport<1||toport>65535)
return false;return true;}
function isValidMacAddress(address){var c='';var num=0;var i=0,j=0;var zeros=0;addrParts=address.split(':');if(addrParts.length!=6)return false;for(i=0;i<6;i++){if(addrParts[i]=='')
return false;for(j=0;j<addrParts[i].length;j++){c=addrParts[i].toLowerCase().charAt(j);if((c>='0'&&c<='9')||(c>='a'&&c<='f'))
continue;else
return false;}
num=parseInt(addrParts[i],16);if(num==NaN||num<0||num>255)
return false;if(num==0)
zeros++;}
if(zeros==6)
return false;if(parseInt(addrParts[0],16)&1)
return false;return true;}
function isValidMacMask(mask){var c='';var num=0;var i=0,j=0;var zeros=0;var zeroBitPos=0,oneBitPos=0;var zeroBitExisted=false;maskParts=mask.split(':');if(maskParts.length!=6)return false;for(i=0;i<6;i++){if(maskParts[i]=='')
return false;for(j=0;j<maskParts[i].length;j++){c=maskParts[i].toLowerCase().charAt(j);if((c>='0'&&c<='9')||(c>='a'&&c<='f'))
continue;else
return false;}
num=parseInt(maskParts[i],16);if(num==NaN||num<0||num>255)
return false;if(zeroBitExisted==true&&num!=0)
return false;if(num==0)
zeros++;zeroBitPos=getLeftMostZeroBitPos(num);oneBitPos=getRightMostOneBitPos(num);if(zeroBitPos<oneBitPos)
return false;if(zeroBitPos<8)
zeroBitExisted=true;}
if(zeros==6)
return false;return true;}
var hexVals=new Array("0","1","2","3","4","5","6","7","8","9","A","B","C","D","E","F");var unsafeString="\"<>%\\^[]`\+\$\,'#&";function isUnsafe(compareChar)
{if(unsafeString.indexOf(compareChar)==-1&&compareChar.charCodeAt(0)>32&&compareChar.charCodeAt(0)<123)
return false;else
return true;}
function decToHex(num,radix)
{var hexString="";while(num>=radix){temp=num%radix;num=Math.floor(num/radix);hexString+=hexVals[temp];}
hexString+=hexVals[num];return reversal(hexString);}
function reversal(s)
{var len=s.length;var trans="";for(i=0;i<len;i++)
trans=trans+s.substring(len-i-1,len-i);s=trans;return s;}
function convert(val)
{return"%"+decToHex(val.charCodeAt(0),16);}
function encodeUrl(val)
{var len=val.length;var i=0;var newStr="";var original=val;for(i=0;i<len;i++){if(val.substring(i,i+1).charCodeAt(0)<255){if(isUnsafe(val.substring(i,i+1))==false)
newStr=newStr+val.substring(i,i+1);else
newStr=newStr+convert(val.substring(i,i+1));}else{alert("Found a non-ISO-8859-1 character at position: "+(i+1)+",\nPlease eliminate before continuing.");newStr=original;i=len;}}
return newStr;}
var markStrChars="\"'";function isMarkStrChar(compareChar)
{if(markStrChars.indexOf(compareChar)==-1)
return false;else
return true;}
function processMarkStrChars(str){var i=0;var retStr='';for(i=0;i<str.length;i++){if(isMarkStrChar(str.charAt(i))==true)
retStr+='\\';retStr+=str.charAt(i);}
return retStr;}
function showhide(element,sh)
{var status;if(sh==1){status="block";}
else{status="none";}
if(document.getElementById)
{document.getElementById(element).style.display=status;}
else if(document.all)
{document.all[element].style.display=status;}
else if(document.layers)
{document.layers[element].display=status;}}
function getSelect(item)
{var idx;if(item.options.length>0){idx=item.selectedIndex;return item.options[idx].value;}
else{return'';}}
function setSelect(item,value)
{for(i=0;i<item.options.length;i++){if(item.options[i].value==value){item.selectedIndex=i;break;}}}
function setCheck(item,value)
{if(value=='1'){item.checked=true;}else{item.checked=false;}}
function setDisable(item,value)
{if(value==1||value=='1'){item.disabled=true;}else{item.disabled=false;}}
function submitText(item)
{return'&'+item.name+'='+item.value;}
function submitSelect(item)
{return'&'+item.name+'='+getSelect(item);}
function submitCheck(item)
{var val;if(item.checked==true){val=1;}
else{val=0;}
return'&'+item.name+'='+val;}
function isHexaDigit(digit){var hexVals=new Array("0","1","2","3","4","5","6","7","8","9","A","B","C","D","E","F","a","b","c","d","e","f");var len=hexVals.length;var i=0;var ret=false;for(i=0;i<len;i++)
if(digit==hexVals[i])break;if(i<len)
ret=true;return ret;}
function isInValidDhcpPool(lan1StartIp,lan1EndIp,lan2StartIp,lan2EndIp)
{lan1addrEnd=lan1EndIp.split('.');lan1addrStart=lan1StartIp.split('.');lan2addrEnd=lan2EndIp.split('.');lan2addrStart=lan2StartIp.split('.');E1=parseInt(lan1addrEnd[3])+1;S1=parseInt(lan1addrStart[3])+1;E2=parseInt(lan2addrEnd[3])+1;S2=parseInt(lan2addrStart[3])+1;if(E1>S2&&E1<E2)
return false;if(S1>S2&&S1<E2)
return false;if(S2>S1&&S2<E1)
return false;if(E2>S1&&E2<E1)
return false;return true;}
function isValidIpAddress_dhcpDevice(address){var i=0;if(address=='255.255.255.255')
return false;addrParts=address.split('.');if(addrParts.length!=4)return false;for(i=0;i<4;i++){if(isNaN(addrParts[i])||addrParts[i]=="")
return false;num=parseInt(addrParts[i]);if(num<0||num>255)
return false;}
return true;}
function isValidDigit(digit){var hexVals=new Array("0","1","2","3","4","5","6","7","8","9");var len=hexVals.length;var i=0;var ret=false;for(i=0;i<len;i++)
if(digit==hexVals[i])break;if(i<len)
ret=true;return ret;}
function isValidServerPort(val){var ret=false;var max=65535;var min=0;var i=0;if((val.length>1)&&(val.charAt(0)=='0'))
{return false;}
for(i;i<val.length;i++)
{if(isValidDigit(val.charAt(i))==false)
break;}
if(i==val.length)
{ret=true;}
if(ret==true)
{if((val<=max)&&(val>=min))
ret=true;else
ret=false;}
return ret;}
function isValidValue(val)
{var ret=false;var min=0;var i=0;if((val.length>1)&&(val.charAt(0)=='0'))
{return false;}
for(i;i<val.length;i++)
{if(isValidDigit(val.charAt(i))==false)
break;}
if(i==val.length)
{ret=true;}
if(ret==true)
{if(val>min)
{ret=true;}
else
{ret=false;}}
return ret;}
function isSameSubNet(lan1Ip,lan1Mask,lan2Ip,lan2Mask){var count=0;lan1a=lan1Ip.split('.');lan1m=lan1Mask.split('.');lan2a=lan2Ip.split('.');lan2m=lan2Mask.split('.');for(i=0;i<4;i++){var l1a_n=parseInt(lan1a[i],10);var l1m_n=parseInt(lan1m[i],10);var l2a_n=parseInt(lan2a[i],10);var l2m_n=parseInt(lan2m[i],10);if((l1a_n&l1m_n)==(l2a_n&l2m_n))
count++;}
if(count==4)
return true;else
return false;}
function isInteger(value)
{if(/^(\+|-)?\d+$/.test(value))
{return true;}
else
{return false;}}
function isPlusInteger(value)
{if(isInteger(value)&&parseInt(value)>=0)
{return true;}
else
{return false;}}
function isNumber(val)
{var len=val.length;var sign=0;for(var i=0;i<len;++i)
{if((val.charAt(i)=='-')&&(sign==0))
{sign=1;continue;}
if((val.charAt(i)>'9')||(val.charAt(i)<'0'))
{return false;}
sign=1;}
return true;}
function isValidMinWaitTime(val){var ret=false;var i=0;if((val.length>1)&&(val.charAt(0)=='0'))
{return false;}
for(i;i<val.length;i++)
{if(isValidDigit(val.charAt(i))==false)
break;}
if(i==val.length)
{ret=true;}
if(ret==true)
{if((parseInt(val)<=1350)&&(parseInt(val)>=3))
ret=true;else
ret=false;}
return ret;}
function isValidMaxWaitTime(val){var ret=false;var i=0;if((val.length>1)&&(val.charAt(0)=='0'))
{return false;}
for(i;i<val.length;i++)
{if(isValidDigit(val.charAt(i))==false)
break;}
if(i==val.length)
{ret=true;}
if(ret==true)
{if((parseInt(val)<=1800)&&(parseInt(val)>=4))
ret=true;else
ret=false;}
return ret;}
function IsNotDigit(fData)
{var i;for(i=0;i<fData.length;i++)
{if(!(fData.charAt(i)>='0'&&fData.charAt(i)<='9'))
return true;}
return false;}
function isValidNetMask(address){ipParts=address.split('/');if(ipParts.length>2)return false;if(ipParts.length==2){num=parseInt(ipParts[1]);if(num<=0||num>32)
return false;}
if(ipParts[0]=='0.0.0.0'||ipParts[0]=='255.255.255.255')
return false;addrParts=ipParts[0].split('.');if(addrParts.length!=4)return false;for(i=0;i<4;i++){if(isNaN(addrParts[i])||addrParts[i]=="")
return false;num=parseInt(addrParts[i]);if(num<0||num>255)
return false;}
return true;}
function isValidIpAddress_dhcpDevice(address){var i=0;if(address=='255.255.255.255')
return false;addrParts=address.split('.');if(addrParts.length!=4)return false;for(i=0;i<4;i++){if(IsNotDigit(addrParts[i])||addrParts[i]=="")
return false;num=parseInt(addrParts[i]);if(i==0&&num==0)
{return false;}
if(num<0||num>=255)
return false;}
if(parseInt(addrParts[3])==0)
return false;return true;}
function isValidPrefixAddress(address){var i=0,num=0;var space=0;addrParts=address.split(':');if(addrParts.length<3||addrParts.length>8)
return false;for(i=0;i<addrParts.length;i++){if(addrParts[i]!=""&&isValidHexKey(addrParts[i],addrParts[i].length))
num=parseInt(addrParts[i],16);else
{space++;if(space>1&&(i+1)!=addrParts.length)
return false;continue;}
if(i==0){if((num&0xf000)==0xf000)
return false;}
if(num>0xffff||num<0)
return false;}
return true;}
function numOfRow(valuelist,rowDelimiter){if(typeof(rowD)=='undefined')
rowD='|';var numR=0;if(valuelist!=''){if(rowD!=''){var tnodes=valuelist.split(rowD);}else{var tnodes=valuelist;}
numR=tnodes.length-2;return numR;}
return numR;}
function numOfCol(valuelist,rowD,colD){if(typeof(rowD)=='undefined')
rowD='|';if(typeof(colD)=='undefined')
colD='/';var numC=0;if(valuelist!=''){if(rowD!=''){var tnodes=valuelist.split(rowD);}else{var tnodes=valuelist;}
if(tnodes.length>0){if(colD!=''){var tdata=tnodes[0].split(colD);numC=tdata.length-1;}}
return numC;}
return numC;}
function getParamNum(valuelist,colNum,rowD,colD){var i;if(valuelist!=''){if(rowD!=''){var tnodes=valuelist.split(rowD);}else{var tnodes=valuelist;}
var row=numOfRow(valuelist,rowD);var names=tnodes[row].split(colD);for(i=0;i<names.length;i++){if(names[i]==colNum){return i;}}}
return-1;}
function getValueFromList(valuelist,colNum,rowNum,rowD,colD){if(typeof(rowD)=='undefined')
rowD='|';if(typeof(colD)=='undefined')
colD='/';if(typeof(rowNum)=='undefined')
rowNum=0;var n;if(isNaN(colNum))
n=getParamNum(valuelist,colNum,rowD,colD);else
n=colNum;var mName=new Array();if(valuelist!=''&&n!=-1){if(rowD!=''){var tnodes=valuelist.split(rowD);}else{var tnodes=valuelist;}
var tdata=tnodes[rowNum].split(colD);(tdata[n])?mName=tdata[n]:mName='';return mName;}
return mName;}
function getColFromList(valuelist,colNum,rowD,colD){if(typeof(rowD)=='undefined')
rowD='|';if(typeof(colD)=='undefined')
colD='/';var n;if(isNaN(colNum))
n=getParamNum(valuelist,colNum,rowD,colD);else
n=colNum;var mName=new Array();if(valuelist!=''){if(rowD!=''){var tnodes=valuelist.split(rowD);}else{var tnodes=valuelist;}
for(i=0;i<tnodes.length-1;i++){var tdata=tnodes[i].split(colD);(tdata[n])?mName[i]=tdata[n]:mName[i]='';}
return mName;}
return mName;}
function getIpMaskBit(mask){var i=0,num=0;var oneBitPos=0;if(isValidSubnetMask(mask)==false)
return-1;maskParts=mask.split('.');for(i=0;i<4;i++){num=parseInt(maskParts[i]);oneBitPos=getRightMostOneBitPos(num);if(oneBitPos<7){return i*8+oneBitPos+1;}}
return 32;}
function markDscpToName(mark){var i;var dscpMarkDesc=new Array('auto','default','AF13','AF12','AF11','CS1','AF23','AF22','F21','S2','AF33','AF32','AF31','CS3','AF43','AF42','AF41','CS4','EF','CS5','CS6','CS7','');var dscpMarkValues=new Array(-2,0x00,0x38,0x30,0x28,0x20,0x58,0x50,0x48,0x40,0x78,0x70,0x68,0x60,0x98,0x90,0x88,0x80,0xB8,0xA0,0xC0,0xE0);if(mark==-1)
return'';for(i=0;dscpMarkDesc[i]!='';i++)
{if(mark==dscpMarkValues[i])
return dscpMarkDesc[i];}
return dscpMarkDesc[0];}
function String_Replace(expression,find,replacewith,start){var index=expression.indexOf(find,start);if(index==-1)
return expression;var findLen=find.length;var newexp="";newexp=expression.substring(0,index)+(replacewith)+(expression.substring(index+findLen));return String_Replace(newexp,find,replacewith,index+1+findLen);}
function SsidisIncludeInvalidChar(val){var len=val.length;for(i=0;i<len;i++)
{if(val.charAt(i)=='&')
{return false;}}
return true;}
function isPppNameUnsafe(compareChar){var unsafeString="\"\\`\,=' \t";if(unsafeString.indexOf(compareChar)==-1&&compareChar.charCodeAt(0)>32&&compareChar.charCodeAt(0)<123)
return false;else
return true;}
function isValidPppName(pppname){var i=0;for(i=0;i<pppname.length;i++){if(isPppNameUnsafe(pppname.charAt(i))==true)
return false;}
return true;}
function Resizeiframe()
{getElById('mainFrameid').style.height=531;var mainbody=mainFrame.document.body.scrollHeight;var trmainbody=getElById('trmain').clientHeight;var mainbodyoffset=getElById('mainFrameid').offsetHeight;var end=mainbody;if(end<(trmainbody-31))
end=trmainbody-31;getElById('mainFrameid').style.height=end;}
function getByteLen(value){var len=0;for(var i=0;i<value.length;i++){var a=value.charAt(i);if(a.match(/[^\x00-\xff]/ig)!=null)
len+=3;else
len+=1;}
return len;}
function MobileisValidSsid(value)
{if(value==""||value==null){return-1;}
var len=getByteLen(value);if((len<1)||(len>32)){return-2;}
for(var i=0;i<len;i++){if(value.charAt(i)=='%'||value.charAt(i)=='\\'){return-3;}}
return true;}
function MobileisValidGuestSsid(value)
{if(value==""||value==null){return-1;}
var len=getByteLen(value);if((len<1)||(len>29)){return-2;}
for(var i=0;i<len;i++){if(value.charAt(i)=='%'||value.charAt(i)=='\\'){return-3;}}
return true;}
function isValidSsid(value)
{var reg=/^[\da-zA-Z\?.@!$%^*()+-_#'"\s\/&]/;if(value==""||value==null){return-1;}
var len=getByteLen(value);if((len<1)||(len>32)){return-2;}
for(var i=0;i<len;i++){if(value.charCodeAt(i)<32||value.charCodeAt(i)>126){return-4;}
var a=value.charAt(i);if(value.charCodeAt(i)<255){if(a==' '){}
if(!reg.test(a)){}}}}
function isValidSsid2(value)
{if(value==""||value==null){warninfo_show("Wifi名称不能为空！");return-1;}
var len=getByteLen(value);if((len<1)||(len>29)){warninfo_show("Wifi名称长度无效，当输入英文时，最多可输入29个字符。如果含有中文，一个中文字符将占用多个英文字符的长度！");return-2;}
for(var i=0;i<len;i++){if(value.charAt(i)=='%'||value.charAt(i)=='\\'){warninfo_show("Wifi名称不能包含无效字'%'或'\\'!");return-3;}}
return true;}
function MobileisValidPassword(value)
{if(value==""||value==null){return-1;}
var len=value.length;if((len<8)||(len>63)){return-2;}
for(var i=0;i<len;i++){var a=value.charAt(i);if((a.match(/[^\x00-\xff]|[%\\]/ig)!=null)){return-3;}}
return true;}
function isValidPassword(value)
{var reg=/^[\da-zA-Z\!@$%^*()+-?._#'"\s\/&]+$/;if(value==""||value==null){return-1;}
var len=value.length;if((len<8)||(len>63)){return-2;}
for(var i=0;i<len;i++){var a=value.charAt(i);if(a==' '){}
if(value.charCodeAt(i)<32||value.charCodeAt(i)>126){return-3;}
if(!reg.test(a)){}}
return true;}
function isComplexEnough(password){var str=password;var regLetter=/[a-zA-Z]/;var regNumber=/[0-9]/;var regSpecial=/[_.!@#$%^&*`~()-+=]/g;var complex=0;if(regLetter.test(str)){++complex;}
if(regNumber.test(str)){++complex;}
if(regSpecial.test(str)){++complex;}
if(complex<3||str.length<8){return false;}else{return true;}};function isValidWpsPin(value){if(value==""||value==null){warninfo_show("PIN码不能为空！");return-1;}
var len=value.length;for(var i=0;i<len;i++){var a=value.charAt(i);if((a.match(/[^0-9]/ig)!=null)){warninfo_show("PIN码无效，请重新输入！");return-3;}}
return true;}
function isreserveaddr(address)
{ipParts=address.split('.');num=parseInt(addrParts[0]);if(num<=255&&num>=240)
{return true;}
return false;}
function isMulticastAddr(address){ipParts=address.split('.');num=parseInt(addrParts[0]);if(num<=239&&num>=224)
{return true;}
return false;}
function isLoopbackAddr(address){ipParts=address.split('.');num=parseInt(addrParts[0]);if(num==127)
{return true;}
return false;}
function isBroadcastAddr(address){ipParts=address.split('.');num=parseInt(addrParts[3]);if(num==255)
{return true;}
return false;}
function isNetworkaddr(lanIP,lanMask){var count=0;lana=lanIP.split('.');lanm=lanMask.split('.');for(i=0;i<4;i++){la_n=parseInt(lana[i]);lm_n=parseInt(lanm[i]);if((la_n&lm_n)==la_n)
count++;}
if(count==4)
return true;else
return false;}
function cmpIpv6Address(minAddr,maxAddr)
{var fullMinAddr=getFullIpv6Address(minAddr);var fullMaxAddr=getFullIpv6Address(maxAddr);var minParts=fullMinAddr.split(':');var maxParts=fullMaxAddr.split(':');var retVal=false;if((minParts.length!=8)||(maxParts.length!=8))
{return retVal;}
for(var i=0;i<8;i++)
{if(minParts[i]>maxParts[i])
{retVal=false;break;}
else if(minParts[i]<=maxParts[i])
{retVal=true;break;}}
if(i==8)
{retVal=true;}
return retVal;}
function cmpIpAddress(minAddr,maxAddr)
{var temp1=minAddr.split('.')
var temp2=maxAddr.split('.')
for(var i=0;i<4;i++){if(Number(temp1[i])>Number(temp2[i])){return false;}
else if(Number(temp1[i])<Number(temp2[i])){return true;}}
return true;}