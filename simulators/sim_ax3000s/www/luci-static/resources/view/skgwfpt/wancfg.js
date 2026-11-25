
var apply_data={};var buildStaticPPP=0;var lanPortNum=4;var actionapply="add";var selindex=0;var delist=new Array();var portlist={};var WanConnJson={};var allportlistarry=new Array();var brlanipaddr="";var brlansubnetmask="";var sfuBindPort="";var onuType="";var pppoe_static_ip_support="";var ft_passthrough_bridge="";var bridgeMaxMtu=1500;var bridgeMinMtu=1280;var ipMaxMtu=1500;var ipMinMtu=576;var ipMinMtuV6=1280;var pppMaxMtu=1600;var pppMinMtu=576;var pppMinMtuV6=1280;var currMaxMtu=1500;var currMinMtu=1280;function unSeleLanPort(portId)
{var f = document.forms[0];
var IpVersion = f.IpVersion, connMode = f.connMode, serviceMode = f.serviceMode, vlanMode = f.vlanMode, vlanID = f.vlanID, multiVID = f.multiVID, d8021 = f.d8021, mtu = f.mtu, nat = f.nat, ipAddr = f.ipAddr, netMask = f.netMask, defGW = f.defGW, firstDns = f.firstDns, secondDns = f.secondDns, userName = f.userName, uPsd = f.uPsd, dialMode = f.dialMode, idleTime = f.idleTime, EnableStaticIp = f.EnableStaticIp, pppStaticIPAddress = f.pppStaticIPAddress, pppStaticSubnetMask = f.pppStaticSubnetMask, pppStaticStartAddress = f.pppStaticStartAddress, pppStaticEndAddress = f.pppStaticEndAddress, enblIANA = f.enblIANA, defaultroute = f.defaultroute, defaultroutev6 = f.defaultroutev6, wanAddress6 = f.wanAddress6, wanAddress6prefix = f.wanAddress6prefix, wanGateway6 = f.wanGateway6, enblPD = f.enblPD, delegatePrefix = f.delegatePrefix, delegatePrefixLen = f.delegatePrefixLen, dns6Primary = f.dns6Primary, dns6Secondary = f.dns6Secondary, enbl6RD = f.enbl6RD, ipv6rdBrAddr = f.ipv6rdBrAddr, ipv6rdIpv4MaskLen = f.ipv6rdIpv4MaskLen, ipv6rdPrefix = f.ipv6rdPrefix, ipv6rdPrefixLen = f.ipv6rdPrefixLen, enblDSLite = f.enblDSLite, dsLiteServer = f.dsLiteServer, enable = f.enable, seletall = f.seletall, btn_edit = f.btn_edit, btn_del = f.btn_del, btn_add = f.btn_add;
if(true)
{if(portId==-1)
{for(var i=0;i<allportlistarry.length;i++)
{document.getElementById("LanPort"+i).checked=false;}}
else if(portId>=0&&portId<allportlistarry.length)
{document.getElementById("LanPort"+portId).checked=false;}}}
function seleLanPort(portId)
{var f = document.forms[0];
var IpVersion = f.IpVersion, connMode = f.connMode, serviceMode = f.serviceMode, vlanMode = f.vlanMode, vlanID = f.vlanID, multiVID = f.multiVID, d8021 = f.d8021, mtu = f.mtu, nat = f.nat, ipAddr = f.ipAddr, netMask = f.netMask, defGW = f.defGW, firstDns = f.firstDns, secondDns = f.secondDns, userName = f.userName, uPsd = f.uPsd, dialMode = f.dialMode, idleTime = f.idleTime, EnableStaticIp = f.EnableStaticIp, pppStaticIPAddress = f.pppStaticIPAddress, pppStaticSubnetMask = f.pppStaticSubnetMask, pppStaticStartAddress = f.pppStaticStartAddress, pppStaticEndAddress = f.pppStaticEndAddress, enblIANA = f.enblIANA, defaultroute = f.defaultroute, defaultroutev6 = f.defaultroutev6, wanAddress6 = f.wanAddress6, wanAddress6prefix = f.wanAddress6prefix, wanGateway6 = f.wanGateway6, enblPD = f.enblPD, delegatePrefix = f.delegatePrefix, delegatePrefixLen = f.delegatePrefixLen, dns6Primary = f.dns6Primary, dns6Secondary = f.dns6Secondary, enbl6RD = f.enbl6RD, ipv6rdBrAddr = f.ipv6rdBrAddr, ipv6rdIpv4MaskLen = f.ipv6rdIpv4MaskLen, ipv6rdPrefix = f.ipv6rdPrefix, ipv6rdPrefixLen = f.ipv6rdPrefixLen, enblDSLite = f.enblDSLite, dsLiteServer = f.dsLiteServer, enable = f.enable, seletall = f.seletall, btn_edit = f.btn_edit, btn_del = f.btn_del, btn_add = f.btn_add;
if(true)
{if(portId==-1)
{for(var i=0;i<allportlistarry.length;i++)
{document.getElementById("LanPort"+i).checked=true;}}
else if(portId>=0&&portId<allportlistarry.length)
{document.getElementById("LanPort"+portId).checked=true;}}}
function enableLanPort()
{var f = document.forms[0];
var IpVersion = f.IpVersion, connMode = f.connMode, serviceMode = f.serviceMode, vlanMode = f.vlanMode, vlanID = f.vlanID, multiVID = f.multiVID, d8021 = f.d8021, mtu = f.mtu, nat = f.nat, ipAddr = f.ipAddr, netMask = f.netMask, defGW = f.defGW, firstDns = f.firstDns, secondDns = f.secondDns, userName = f.userName, uPsd = f.uPsd, dialMode = f.dialMode, idleTime = f.idleTime, EnableStaticIp = f.EnableStaticIp, pppStaticIPAddress = f.pppStaticIPAddress, pppStaticSubnetMask = f.pppStaticSubnetMask, pppStaticStartAddress = f.pppStaticStartAddress, pppStaticEndAddress = f.pppStaticEndAddress, enblIANA = f.enblIANA, defaultroute = f.defaultroute, defaultroutev6 = f.defaultroutev6, wanAddress6 = f.wanAddress6, wanAddress6prefix = f.wanAddress6prefix, wanGateway6 = f.wanGateway6, enblPD = f.enblPD, delegatePrefix = f.delegatePrefix, delegatePrefixLen = f.delegatePrefixLen, dns6Primary = f.dns6Primary, dns6Secondary = f.dns6Secondary, enbl6RD = f.enbl6RD, ipv6rdBrAddr = f.ipv6rdBrAddr, ipv6rdIpv4MaskLen = f.ipv6rdIpv4MaskLen, ipv6rdPrefix = f.ipv6rdPrefix, ipv6rdPrefixLen = f.ipv6rdPrefixLen, enblDSLite = f.enblDSLite, dsLiteServer = f.dsLiteServer, enable = f.enable, seletall = f.seletall, btn_edit = f.btn_edit, btn_del = f.btn_del, btn_add = f.btn_add;
if(true)
{for(var i=0;i<allportlistarry.length;i++)
{var lanPortID="LanPort"+i;var lanPort=document.getElementById(lanPortID).disabled=false;if($("#"+lanPortID).parents(".skcheckbox-round").next().hasClass("skcheckbox-disabled"))
$("#"+lanPortID).parents(".skcheckbox-round").next().removeClass("skcheckbox-disabled");}}}
function disableLanPort()
{var i=0,j=0,k=0;var intf="";var parts="";var f = document.forms[0];
var IpVersion = f.IpVersion, connMode = f.connMode, serviceMode = f.serviceMode, vlanMode = f.vlanMode, vlanID = f.vlanID, multiVID = f.multiVID, d8021 = f.d8021, mtu = f.mtu, nat = f.nat, ipAddr = f.ipAddr, netMask = f.netMask, defGW = f.defGW, firstDns = f.firstDns, secondDns = f.secondDns, userName = f.userName, uPsd = f.uPsd, dialMode = f.dialMode, idleTime = f.idleTime, EnableStaticIp = f.EnableStaticIp, pppStaticIPAddress = f.pppStaticIPAddress, pppStaticSubnetMask = f.pppStaticSubnetMask, pppStaticStartAddress = f.pppStaticStartAddress, pppStaticEndAddress = f.pppStaticEndAddress, enblIANA = f.enblIANA, defaultroute = f.defaultroute, defaultroutev6 = f.defaultroutev6, wanAddress6 = f.wanAddress6, wanAddress6prefix = f.wanAddress6prefix, wanGateway6 = f.wanGateway6, enblPD = f.enblPD, delegatePrefix = f.delegatePrefix, delegatePrefixLen = f.delegatePrefixLen, dns6Primary = f.dns6Primary, dns6Secondary = f.dns6Secondary, enbl6RD = f.enbl6RD, ipv6rdBrAddr = f.ipv6rdBrAddr, ipv6rdIpv4MaskLen = f.ipv6rdIpv4MaskLen, ipv6rdPrefix = f.ipv6rdPrefix, ipv6rdPrefixLen = f.ipv6rdPrefixLen, enblDSLite = f.enblDSLite, dsLiteServer = f.dsLiteServer, enable = f.enable, seletall = f.seletall, btn_edit = f.btn_edit, btn_del = f.btn_del, btn_add = f.btn_add;
if(true)
{for(i=0;i<WanConnJson.length;i++)
{if(selindex!=WanConnJson[i].index)
{intf=WanConnJson[i].portbind
parts=intf.split(',');for(k=0;k<allportlistarry.length;k++)
{for(j=0;j<parts.length;j++)
{if(allportlistarry[k].ifname==parts[j])
{var lanPortID="LanPort"+k;var lanPort=document.getElementById(lanPortID).disabled=true;if($("#"+lanPortID).parents(".skcheckbox-round").next().hasClass("skcheckbox-disabled"))
$("#"+lanPortID).parents(".skcheckbox-round").next().addClass("skcheckbox-disabled");}}}}}
if(sfuBindPort.length>0)
{parts=sfuBindPort.split(',');for(k=0;k<allportlistarry.length;k++)
{for(j=0;j<parts.length;j++)
{if(allportlistarry[k].ifname==parts[j])
{var lanPortID="LanPort"+k;var lanPort=document.getElementById(lanPortID).disabled=true;if($("#"+lanPortID).parents(".skcheckbox-round").next().hasClass("skcheckbox-disabled"))
$("#"+lanPortID).parents(".skcheckbox-round").next().addClass("skcheckbox-disabled");}}}}}}
function show_span_mtu()
{var isppp=($('input:radio[name="ipproto"]:checked').val()=="pppoe");var ipversion=$("#IpVersion").val();var isroute=($("#connMode").val()=="route");if(isroute)
{if(isppp)
{if(ipversion=='0')
{currMinMtu=pppMinMtu;}
else
{currMinMtu=pppMinMtuV6;}
currMaxMtu=pppMaxMtu;}
else
{if(ipversion=='0')
{currMinMtu=ipMinMtu;}
else
{currMinMtu=ipMinMtuV6;}
currMaxMtu=ipMaxMtu;}}
else
{currMinMtu=bridgeMinMtu;currMaxMtu=bridgeMaxMtu;}
$("#span_mtu").html("("+currMinMtu+"-"+currMaxMtu+")");}
function enblPDClick(obj)
{var proto=$('input:radio[name="ipproto"]:checked').val();if(proto!="static")
{return;}
if(obj.checked==true)
{$("#PDTableStatic").show();}
else
{$("#PDTableStatic").hide();}}
function enbl6RDClick()
{var mode=$("#enbl6RD").is(':checked');if(mode==false){$("#ipv6RDModeTable").hide();$("#ipv6rdManualTable").hide();}else{$("#ipv6RDModeTable").show();$("#ipv6RDModeAuto").prop("checked",true);selectipv6RDMode();}}
function selectipv6RDMode(){var mode=$('input:radio[name="ipv6RDMode"]:checked').val();if(mode=="ipv6RDManual"){$("#ipv6rdManualTable").show();}else{$("#ipv6rdManualTable").hide();}}
function enblDSLiteClick()
{var mode=$("#enblDSLite").is(':checked');if(mode==false){$("#DSLiteModeTable").hide();$("#dsliteManualTable").hide();}else{$("#DSLiteModeTable").show();$("#dsliteModeAuto").prop("checked",true);selectdsliteMode();}}
function selectdsliteMode(){var mode=$('input:radio[name="dsliteMode"]:checked').val();if(mode=="dsliteManual"){$("#dsliteManualTable").show();}else{$("#dsliteManualTable").hide();}}
function changeIPVersion(ipversion)
{var mode=$("#serviceMode").val();var proto=$('input:radio[name="ipproto"]:checked').val();switch(parseInt(ipversion))
{case 0:$("#nattable").show();$("#nat").prop("checked",true);$("#ipv6Table").hide();if($("#connMode").val()=="route")
{if(mode==3)
{$("#nattable").hide();$("#nat").prop("checked",false);}
else
{$("#nat").prop("checked",true);}
if(proto=="static")
{$("#ipAddrTable").show();$("#dialTable").hide();}
else if(proto=="dhcp")
{$("#ipAddrTable").hide();$("#dialTable").hide();}
else
{$("#ipAddrTable").hide();$("#dialTable").show();if(parseInt(pppoe_static_ip_support)==1)
{$("#pppStaticIPEnableTable").show();}}
$("#enblDSLite").prop("checked",false);$("#dsliteTable").hide();if(mode==8||mode==5||mode==7||mode==2){$("#default_route").show();$("#default_routev6").hide();}else{$("#default_route").hide();$("#default_routev6").hide();}}
var _6rd_exist=0;for(var i=0;i<WanConnJson.length;i++){if(WanConnJson[i].ipv6rd!=0)
_6rd_exist=1;}
if(0==_6rd_exist){$("#ipv6rdTable").show();$("#enbl6RD").prop("checked",false);$("#ipv6rdManualTable").hide();$("#ipv6RDModeTable").hide();}
break;case 1:$("#ipAddrTable").hide();$("#nattable").hide();$("#nat").prop("checked",false);$("#ipv6Table").show();$("#enblPD").prop("checked",true);if($("#connMode").val()=="route")
{if(mode==1||mode==3||mode==6)
{$("#PDTable").hide();$("#enblPD").prop("checked",false);}
else
{$("#PDTable").show();$("#enblPD").prop("checked",true);}
if(proto=="static")
{$("#dialTable").hide();$("#static6Table").show();$("#IANATable").hide();$("#PDTableStatic").show();}
else if(proto=="dhcp")
{$("#dialTable").hide();$("#static6Table").hide();$("#IANATable").show();$("#PDTableStatic").hide();}
else
{$("#dialTable").show();$("#pppStaticIPEnableTable").hide();$("#static6Table").hide();$("#IANATable").show();$("#PDTableStatic").hide();}
var dslite_exist=0;for(var i=0;i<WanConnJson.length;i++){if(WanConnJson[i].dslite!=0)
dslite_exist=1;}
if(0==dslite_exist){$("#dsliteTable").show();$("#enblDSLite").prop("checked",false);$("#DSLiteModeTable").hide();$("#dsliteManualTable").hide();}
if(mode==8||mode==5||mode==7||mode==2){$("#default_route").hide();$("#default_routev6").show();}else{$("#default_route").hide();$("#default_routev6").hide();}}
$("#ipv6rdTable").hide();break;case 2:default:$("#nattable").show();$("#nat").prop("checked",true);$("#bridgeapply").hide();$("#noipv6apply").hide();$("#ipv6Table").show();$("#fullapply").show();if($("#connMode").val()=="route")
{if(mode==3)
{$("#nattable").hide();$("#nat").prop("checked",false);$("#PDTable").hide();$("#enblPD").prop("checked",false);}
else if(mode==1||mode==6)
{$("#PDTable").hide();$("#enblPD").prop("checked",false);$("#nat").prop("checked",true);}
else
{$("#PDTable").show();$("#enblPD").prop("checked",true);$("#nat").prop("checked",true);}
if(proto=="static")
{$("#ipAddrTable").show();$("#dialTable").hide();$("#static6Table").show();$("#IANATable").hide();$("#PDTableStatic").show();}
else if(proto=="dhcp")
{$("#ipAddrTable").hide();$("#dialTable").hide();$("#static6Table").hide();$("#IANATable").show();$("#PDTableStatic").hide();}
else
{$("#ipAddrTable").hide();$("#dialTable").show();if(parseInt(pppoe_static_ip_support)==1)
{$("#pppStaticIPEnableTable").show();}
$("#static6Table").hide();$("#IANATable").show();$("#PDTableStatic").hide();}
$("#enblDSLite").prop("checked",false);$("#dsliteTable").hide();if(mode==8||mode==5||mode==7||mode==2){$("#default_route").show();$("#default_routev6").show();}else{$("#default_route").hide();$("#default_routev6").hide();}}
$("#ipv6rdTable").hide();break;}
show_span_mtu();}
function changeServiceMode(mode)
{if($("#connMode").val()=="bridge")
{$("#portbindtable").show();}
else
{if(mode==1||mode==3||mode==6)
{$("#portbindtable").hide();unSeleLanPort(-1);}
else
{$("#portbindtable").show();$("#nattable").show();}
changeIPVersion($("#IpVersion").val());}
if(allportlistarry.length<=1)
{$("#portbindtable").hide();}
if(mode==8||mode==5||mode==7||mode==2){$("#default_route").show();$("#default_routev6").show();}else{$("#default_route").hide();$("#default_routev6").hide();}}
function enableVlan(vlanmode)
{if(vlanmode=="2")
{$("#vlanvfg").show();}
else
{$("#vlanvfg").hide();}}
function enableDialMode(dialMode)
{if(dialMode=="2")
{$("#OnDemandTable").show();}
else
{$("#OnDemandTable").hide();}
$("#dialMode").val(dialMode);}
function selectipproto(loadWanCfg)
{var proto=$('input:radio[name="ipproto"]:checked').val();changeIPVersion($("#IpVersion").val());if(proto=="static")
{$("input[type=radio][value='enable']").prop("checked",true);$("#dnsv6Table").show();$("#dnsv6disable").attr("disabled",true);}
else
{$("#dnsv6disable").attr("disabled",false);}
if(loadWanCfg!=1)
{if(proto=="static"||proto=="dhcp")
{$("#mtu").val(ipMaxMtu);}
else
{$("#mtu").val(pppMaxMtu);}
show_span_mtu();}}
function loadDefaultCfg()
{$("#enable").prop("checked",true);$("#connMode").val("route");changeConnMode("route");enableDialMode("1");$("#serviceMode").val("8");changeServiceMode("8");$("#IpVersion").val("2");changeIPVersion("2");unSeleLanPort(-1);enableLanPort();disableLanPort();$("#vlanMode").val("2");enableVlan("2");$("input[type=radio][value='dhcp']").prop("checked",true);selectipproto();$("#nat").prop("checked",true);$("#enblIANA").val("0");$("#enblPD").prop("checked",true);$("#enblPD").prop("checked",true);$("#default_route").show();$("#default_routev6").show();$("#defaultroute").prop("checked",true);for(var i=0;i<WanConnJson.length;i++){if(WanConnJson[i].is_defaultroute){$("#defaultroute").prop("checked",false);break;}}
$("#defaultroutev6").prop("checked",true);for(var i=0;i<WanConnJson.length;i++){if(WanConnJson[i].is_defaultroute_v6){$("#defaultroutev6").prop("checked",false);break;}}
show_span_mtu();}
function loadIpProtocol(IPVersion)
{var ipmode=0;if(IPVersion=='1')
ipmode=0;else if(IPVersion=='2')
ipmode=1;else if(IPVersion=='3')
ipmode=2;return ipmode;}
function loadBindPort(intf)
{var i=0,j=0;var parts=intf.split(',');for(i=0;i<allportlistarry.length;i++)
{for(j=0;j<parts.length;j++)
{if(allportlistarry[i].ifname==parts[j])
{seleLanPort(i);break;}
else
{unSeleLanPort(i);}}}}
function defroutecfg()
{$("#enable").prop("checked",true);$("#vlanMode").val("1");enableVlan("1");$("input[type=radio][value='pppoe']").prop("checked",true);selectipproto();$("#serviceMode").val("5");changeServiceMode("5");$("input[type=radio][name='dnsv6mode'][value='enable']").prop("checked",true);dns6Primary.value="2001:4860:4860::8888"
dns6Secondary.value="2001:4860:4860::8844"
selectdnsv6mode();$("#defaultroutev6").prop("checked",true);$("#defaultroute").prop("checked",true);hideElements();diableForFPT();}
function defbridgecfg()
{$("#vlanMode").val("1");enableVlan("1");hideElements();diableForFPT();}
function changeConnMode(mode)
{var f = document.forms[0];
var IpVersion = f.IpVersion, connMode = f.connMode, serviceMode = f.serviceMode, vlanMode = f.vlanMode, vlanID = f.vlanID, multiVID = f.multiVID, d8021 = f.d8021, mtu = f.mtu, nat = f.nat, ipAddr = f.ipAddr, netMask = f.netMask, defGW = f.defGW, firstDns = f.firstDns, secondDns = f.secondDns, userName = f.userName, uPsd = f.uPsd, dialMode = f.dialMode, idleTime = f.idleTime, EnableStaticIp = f.EnableStaticIp, pppStaticIPAddress = f.pppStaticIPAddress, pppStaticSubnetMask = f.pppStaticSubnetMask, pppStaticStartAddress = f.pppStaticStartAddress, pppStaticEndAddress = f.pppStaticEndAddress, enblIANA = f.enblIANA, defaultroute = f.defaultroute, defaultroutev6 = f.defaultroutev6, wanAddress6 = f.wanAddress6, wanAddress6prefix = f.wanAddress6prefix, wanGateway6 = f.wanGateway6, enblPD = f.enblPD, delegatePrefix = f.delegatePrefix, delegatePrefixLen = f.delegatePrefixLen, dns6Primary = f.dns6Primary, dns6Secondary = f.dns6Secondary, enbl6RD = f.enbl6RD, ipv6rdBrAddr = f.ipv6rdBrAddr, ipv6rdIpv4MaskLen = f.ipv6rdIpv4MaskLen, ipv6rdPrefix = f.ipv6rdPrefix, ipv6rdPrefixLen = f.ipv6rdPrefixLen, enblDSLite = f.enblDSLite, dsLiteServer = f.dsLiteServer, enable = f.enable, seletall = f.seletall, btn_edit = f.btn_edit, btn_del = f.btn_del, btn_add = f.btn_add;
if(true)
{IpVersion.disabled=false;}
$("#ipv6rdTable").hide();$("#dsliteTable").hide();if(allportlistarry.length>1)
{$("#portbindtable").show();}
if(mode=="bridge")
{$("#serviceMode").empty();$("#serviceMode").append("<option value=2>INTERNET</option>");$("#serviceMode").append("<option value=4>IPTV</option>");$("#serviceMode").append("<option value=3>VOIP</option>");$("#ipversionmode").hide();$("#Networkconfigid").hide();$("#ipv6Table").hide();$("#bridgeapply").show();$("#nat").prop("checked",false);$("#vlanMode").empty();$("#vlanMode").append("<option value=2 selected = \"selected\">TAG</option>");$("#vlanMode").append("<option value=1>TRANSPARENT</option>");enableVlan("2");$("#mtu").val(bridgeMaxMtu);$("#default_route").hide();$("#default_routev6").hide();defbridgecfg();}
else
{$("#serviceMode").empty();$("#serviceMode").append("<option value=8>TR069_VOIP_INTERNET</option>");$("#serviceMode").append("<option value=1>TR069</option>");$("#serviceMode").append("<option value=6>TR069_VOIP</option>");$("#serviceMode").append("<option value=5>TR069_INTERNET</option>");$("#serviceMode").append("<option value=3>VOIP</option>");$("#serviceMode").append("<option value=7>VOIP_INTERNET</option>");$("#serviceMode").append("<option value=2>INTERNET</option>");$("#serviceMode").append("<option value=4>IPTV</option>");$("#bridgeapply").hide();$("#ipversionmode").show();$("#Networkconfigid").show();$("#ipv6Table").show();changeIPVersion($("#IpVersion").val());$("#vlanMode").empty();$("#vlanMode").append("<option value=2 selected = \"selected\">TAG</option>");$("#vlanMode").append("<option value=1>UNTAG</option>");enableVlan("2");if($('input:radio[name="ipproto"]:checked').val()=="pppoe")
{$("#mtu").val(pppMaxMtu);}
else
{$("#mtu").val(ipMaxMtu);}
if(1==$("#IpVersion").val()){$("#dsliteTable").show();$("#default_route").hide();$("#default_routev6").show();}else if(0==$("#IpVersion").val()){$("#default_route").show();$("#default_routev6").hide();}else{$("#default_route").show();$("#default_routev6").show();}
defroutecfg();}
show_span_mtu();}
function loadWanCfg(selindex)
{var index=0;for(var i=0;i<WanConnJson.length;i++){if(WanConnJson[i].index==selindex)
index=i;}
if(WanConnJson[index].enable=="1")
$("#enable").prop("checked",true);else
$("#enable").prop("checked",false);var contypestr=getConnectypeStr(WanConnJson[index].networktype);if(contypestr=="Bridge")
{$("#connMode").val("bridge");changeConnMode("bridge");}
else
{$("#connMode").val("route");changeConnMode("route");}
var servermode=WanConnJson[index].servicelist;$("#serviceMode").val(servermode);changeServiceMode(servermode);if(contypestr!="Bridge")
{var ipversion=loadIpProtocol(WanConnJson[index].IPStack);$("#IpVersion").val(ipversion.toString());changeIPVersion(ipversion.toString());}
loadBindPort(WanConnJson[index].portbind);enableLanPort();disableLanPort();if(WanConnJson[index].vlanmode=="2")
{$("#vlanMode").val("2");$("#vlanID").val(WanConnJson[index].vlanid);if(WanConnJson[index].multivid=="0")
$("#multiVID").val("");else
$("#multiVID").val(WanConnJson[index].multivid);$("#d8021").val(WanConnJson[index].vlanpri);enableVlan("2");}
else
{$("#vlanMode").val("1");enableVlan("1");}
$("#mtu").val(WanConnJson[index].mtu);if(contypestr=="PPPoE")
{$("input[type=radio][value='pppoe']").prop("checked",true);$("#userName").val(WanConnJson[index].pppoename);$("#uPsd").val(WanConnJson[index].pppoepwd);if(WanConnJson[index].PPPoEStaticIPEnable==undefined||WanConnJson[index].PPPoEStaticIPEnable=='0')
{$("#EnableStaticIp").prop("checked",false);}
else
{$("#EnableStaticIp").prop("checked",true);}
$("#pppStaticIPAddress").val(WanConnJson[index].PPPoEStaticAddr);$("#pppStaticSubnetMask").val(WanConnJson[index].PPPoEStaticMask);$("#pppStaticStartAddress").val(WanConnJson[index].PPPoEStaticStartAddr);$("#pppStaticEndAddress").val(WanConnJson[index].PPPoEStaticEndAddr);PPPUseStaticIP();if(WanConnJson[index].dial==undefined||WanConnJson[index].dial=='0')
{enableDialMode("1");}
else
{enableDialMode("2");$("#idleTime").val(WanConnJson[index].dial/60);}
if(WanConnJson[index].peer_dnsv6==1)
{$("input[type=radio][value='disable']").prop("checked",true);$("#dnsv6Table").hide();}
else
{$("#dnsv6Table").show();$("input[type=radio][value='enable']").prop("checked",true);$("#dns6Primary").val(WanConnJson[index].peer_staticdns1v6);$("#dns6Secondary").val(WanConnJson[index].peer_staticdns2v6);}
selectipproto(1);}
else if(contypestr=="DHCP")
{$("input[type=radio][value='dhcp']").prop("checked",true);selectipproto(1);}
else if(contypestr=="Static IP")
{$("input[type=radio][value='static']").prop("checked",true);selectipproto(1);}
if(contypestr!="PPPoE"&&contypestr!="Bridge")
{if(ipversion==0||ipversion==2)
{$("#ipAddr").val(WanConnJson[index].ipaddr);$("#netMask").val(WanConnJson[index].subnetmask);$("#defGW").val(WanConnJson[index].gateway);$("#firstDns").val(WanConnJson[index].dns1);$("#secondDns").val(WanConnJson[index].dns2);}
if(ipversion==1||ipversion==2)
{var address6='';var prefixLen=64;var parts=WanConnJson[index].gua.split('/');if(parts.length>0)
address6=parts[0];if(parts.length>1)
prefixLen=parts[1];$("#wanAddress6").val(address6);$("#wanAddress6prefix").val(prefixLen);$("#wanGateway6").val(WanConnJson[index].gatewayv6);if(WanConnJson[index].networktype=='static')
{$("#dns6Primary").val(WanConnJson[index].dns1v6);$("#dns6Secondary").val(WanConnJson[index].dns2v6);}
else
{$("#dns6Primary").val(WanConnJson[index].peer_staticdns1v6);$("#dns6Secondary").val(WanConnJson[index].peer_staticdns2v6);}
if(WanConnJson[index].peer_dnsv6==1)
{$("#dnsv6Table").hide();$("input[type=radio][value='disable']").prop("checked",true);}
else
{$("#dnsv6Table").show();$("input[type=radio][value='enable']").prop("checked",true);}
if(WanConnJson[index].prefixsrc==2)
{var pd='';var pdLen=64;var pdParts=WanConnJson[index].prefix.split('/');if(pdParts.length>0)
pd=pdParts[0];if(pdParts.length>1)
pdLen=pdParts[1];$("#delegatePrefix").val(pd);$("#delegatePrefixLen").val(pdLen);}}}
if(contypestr!="Bridge")
{var service_Mode=$("#serviceMode").val();if(ipversion==0||ipversion==2)
{if(WanConnJson[index].natenable=="1")
$("#nat").prop("checked",true);else
$("#nat").prop("checked",false);if(service_Mode==3)
{$("#nattable").hide();}
else
{$("#nattable").show();}}
if(ipversion==1||ipversion==2)
{if(contypestr!="Static IP")
{if(WanConnJson[index].guasrc==1)
{$("#enblIANA").val(1);}
else
{$("#enblIANA").val(0);}}
if(WanConnJson[index].prefixsrc==1||WanConnJson[index].prefixsrc==2)
{$("#enblPD").prop("checked",true);}
else
{$("#enblPD").prop("checked",false);$("#PDTableStatic").hide();}
if(service_Mode==1||service_Mode==3||service_Mode==6)
{$("#PDTable").hide();}
else
{$("#PDTable").show();}}
if(ipversion==1)
{var dslite_exist=0;for(let i=0;i<WanConnJson.length;i++){if(WanConnJson[i].dslite!=0){dslite_exist=i;break;}}
if(dslite_exist!=0&&index!=dslite_exist){$("#dsliteTable").hide();}else{$("#dsliteTable").show();if(WanConnJson[index].dslite==0){$("#enblDSLite").prop("checked",false);$("#DSLiteModeTable").hide();}
else if(WanConnJson[index].dslite==1){$("#enblDSLite").prop("checked",true);$("#dsliteModeAuto").prop("checked",true);$("#dsliteManualTable").hide();}else{$("#enblDSLite").prop("checked",true);$("#dsliteModeManual").prop("checked",true);$("#dsLiteServer").val(WanConnJson[index].dslite_peeraddr);$("#dsliteManualTable").show();}}
if(WanConnJson[index].servicelist==8||WanConnJson[index].servicelist==5||WanConnJson[index].servicelist==7||WanConnJson[index].servicelist==2){$("#default_route").hide();$("#default_routev6").show();if(WanConnJson[index].is_defaultroute_v6==1)
$("#defaultroutev6").prop("checked",true);else
$("#defaultroutev6").prop("checked",false);}else{$("#default_route").hide();$("#default_routev6").hide();}}
else if(ipversion==0){var ipv6rd_exist=0;for(let i=0;i<WanConnJson.length;i++){if(WanConnJson[i].ipv6rd==1){ipv6rd_exist=i;break;}}
if(ipv6rd_exist!=0&&index!=ipv6rd_exist){$("#ipv6rdTable").hide();}else{$("#ipv6rdTable").show();if(WanConnJson[index].ipv6rd==0)
{$("#enbl6RD").prop("checked",false);$("#ipv6RDModeTable").hide();$("#ipv6rdManualTable").hide();}
else
{$("#enbl6RD").prop("checked",true);$("#ipv6RDModeTable").show();if(WanConnJson[index].ipv6rd==1)
{$("#ipv6RDModeAuto").prop("checked",true);$("#ipv6rdManualTable").hide();}
else
{$("#ipv6RDModeManual").prop("checked",true);$("#ipv6rdManualTable").show();$("#ipv6rdBrAddr").val(WanConnJson[index].ipv6rd_peeraddr);$("#ipv6rdIpv4MaskLen").val(WanConnJson[index].ipv6rd_ipv4mask_len);$("#ipv6rdPrefix").val(WanConnJson[index].ipv6rd_ipv6prefix);$("#ipv6rdPrefixLen").val(WanConnJson[index].ipv6rd_ipv6prefix_len);}}}
if(WanConnJson[index].servicelist==8||WanConnJson[index].servicelist==5||WanConnJson[index].servicelist==7||WanConnJson[index].servicelist==2){$("#default_route").show();$("#default_routev6").hide();if(WanConnJson[index].is_defaultroute==1)
$("#defaultroute").prop("checked",true);else
$("#defaultroute").prop("checked",false);}else{$("#default_route").hide();$("#default_routev6").hide();}}else{if(WanConnJson[index].servicelist==8||WanConnJson[index].servicelist==5||WanConnJson[index].servicelist==7||WanConnJson[index].servicelist==2){$("#default_route").show();$("#default_routev6").show();if(WanConnJson[index].is_defaultroute==1)
$("#defaultroute").prop("checked",true);else
$("#defaultroute").prop("checked",false);if(WanConnJson[index].is_defaultroute_v6==1)
$("#defaultroutev6").prop("checked",true);else
$("#defaultroutev6").prop("checked",false);}else{$("#default_route").hide();$("#default_routev6").hide();}}}
else
{$("#default_route").hide();$("#default_routev6").hide();}
show_span_mtu();}
function addwan()
{actionapply="add";selindex="";loadDefaultCfg();$("#wantittleinfo").html(_("wancfg_AddnewWANinterface"));enableForFPT();$("#wanindex").hide();$("#wanform").fadeIn(300);}
function editwan()
{var selectnum=0;var connname;if(WanConnJson.length==0)
return;var selist=$("input[name='rml']");if(selist.length===undefined)
{if(selist.checked==true)
{selectnum=1;selindex=selist.value;connname=getServerModeStr(WanConnJson[0].servicelist)}}
else
{for(var i=0;i<selist.length;i++){if(selist[i].checked==true)
{selindex=selist[i].value;connname=getServerModeStr(WanConnJson[i].servicelist)
selectnum++;}}}
if(selectnum!=1)
return false;actionapply="edit";loadWanCfg(selindex);diableForFPT();$("#wantittleinfo").html("Edit <i>"+connname+"</i> interface configuration");$("#wanindex").hide();$("#wanform").fadeIn(300);}
function diableForFPT()
{serviceMode.disabled=true;IpVersion.disabled=true;nat.disabled=true;}
function enableForFPT()
{serviceMode.disabled=false;IpVersion.disabled=false;nat.disabled=false;}
function delWanIface(index)
{apply_data={};if(ft_passthrough_bridge==='1'){var del_wancfg=WanConnJson[index-1];var utag_bridge_num=0;var same_vlan_route_wan=false;for(var i=0;i<WanConnJson.length;i++){if(!WanConnJson[i])
continue;if(WanConnJson[i].index==index){del_wancfg=WanConnJson[i];break;}}
if(del_wancfg){if(del_wancfg.networktype=="bridge"&&del_wancfg.vlanmode==1){var vlan_array=[];for(var i=0;i<WanConnJson.length;i++){if(WanConnJson[i].networktype=="bridge"&&WanConnJson[i].vlanmode==1)
utag_bridge_num++;}
for(var i=0;i<WanConnJson.length;i++){for(j=0;j<vlan_array.length;j++){if(WanConnJson[i].vlanid==vlan_array[j]){same_vlan_route_wan=true;break;}}
vlan_array[i]=WanConnJson[i].vlanid;}
if(same_vlan_route_wan&&utag_bridge_num==1){warninfo_show(_("wancfg_vlan_exist_on_del_utag_bridge_error"));return;}}}}
apply_data.index=parseInt(index);ubusparam=new Array("gwweb.wancfg","del_WanConnection",apply_data);jsonparam={"id":1,"params":ubusparam};sk_auth_apply(jsonparam,function(result){delist.shift();if(delist.length==0)
{pageLoad();return;}
delWanIface(delist[0]);});}
function removeClick()
{var selist=$("input[name='rml']");if(selist.length===undefined)
{if(selist.checked==true)
{delist.push(selist.value)}}
else
{for(var i=0;i<selist.length;i++){if(selist[i].checked==true)
{delist.push(selist[i].value)}}}
console.log(delist);if(delist.length==0)
return;delWanIface(delist[0]);}
function getServerModeStr(servMode)
{var smodestr;switch(parseInt(servMode))
{case 1:smodestr="TR069";break;case 2:smodestr="INTERNET";break;case 3:smodestr="VOIP";break;case 4:smodestr="IPTV";break;case 5:smodestr="TR069_INTERNET";break;case 6:smodestr="TR069_VOIP";break;case 7:smodestr="VOIP_INTERNET";break;default:smodestr="TR069_VOIP_INTERNET";break;}
return smodestr;}
function getIpmodeStr(ipProtocalMode)
{var ipProtocalstr;switch(parseInt(ipProtocalMode))
{case 1:ipProtocalstr="IPv4";break;case 2:ipProtocalstr="IPv6";break;case 3:ipProtocalstr="IPv4 & IPv6";break;default:ipProtocalstr="IPv4";break;}
return ipProtocalstr;}
function getConnectypeStr(connectype)
{var contypestr;connectype=connectype.toLowerCase();if(connectype=="dhcp")
{contypestr="DHCP";}
else if(connectype=="pppoe")
{contypestr="PPPoE";}
else if(connectype=="bridge")
{contypestr="Bridge";}
else if(connectype=="static")
{contypestr="Static IP";}
else if(connectype=="ds-lite")
{contypestr="DS-Lite";}
else
{contypestr="DHCP";}
return contypestr;}
function getVlanidprioStr(vlanmode,vlanid,priority)
{var vpstr;if(vlanmode!='2')
{vpstr="--";}
else
{vpstr=vlanid+" / "+priority;}
return vpstr;}
function creatPortbindList(portbind)
{var j=0;var portbindList="";var num=0;var lanPortLabel;var lanPortCheck;var list="";var f = document.forms[0];
var IpVersion = f.IpVersion, connMode = f.connMode, serviceMode = f.serviceMode, vlanMode = f.vlanMode, vlanID = f.vlanID, multiVID = f.multiVID, d8021 = f.d8021, mtu = f.mtu, nat = f.nat, ipAddr = f.ipAddr, netMask = f.netMask, defGW = f.defGW, firstDns = f.firstDns, secondDns = f.secondDns, userName = f.userName, uPsd = f.uPsd, dialMode = f.dialMode, idleTime = f.idleTime, EnableStaticIp = f.EnableStaticIp, pppStaticIPAddress = f.pppStaticIPAddress, pppStaticSubnetMask = f.pppStaticSubnetMask, pppStaticStartAddress = f.pppStaticStartAddress, pppStaticEndAddress = f.pppStaticEndAddress, enblIANA = f.enblIANA, defaultroute = f.defaultroute, defaultroutev6 = f.defaultroutev6, wanAddress6 = f.wanAddress6, wanAddress6prefix = f.wanAddress6prefix, wanGateway6 = f.wanGateway6, enblPD = f.enblPD, delegatePrefix = f.delegatePrefix, delegatePrefixLen = f.delegatePrefixLen, dns6Primary = f.dns6Primary, dns6Secondary = f.dns6Secondary, enbl6RD = f.enbl6RD, ipv6rdBrAddr = f.ipv6rdBrAddr, ipv6rdIpv4MaskLen = f.ipv6rdIpv4MaskLen, ipv6rdPrefix = f.ipv6rdPrefix, ipv6rdPrefixLen = f.ipv6rdPrefixLen, enblDSLite = f.enblDSLite, dsLiteServer = f.dsLiteServer, enable = f.enable, seletall = f.seletall, btn_edit = f.btn_edit, btn_del = f.btn_del, btn_add = f.btn_add;
if(true)
{var parts=portbind.split(',');for(i=0;i<parts.length;i++)
{for(j=0;j<allportlistarry.length;j++)
{if(allportlistarry[j].ifname==parts[i])
{portbindList+=allportlistarry[j].labelname;portbindList+=", ";num++;}}}}
if(num==0)
{portbindList="--";}
return portbindList;}
function showWanEntry()
{var wanEntry="";var i=0;var portbindListStr="--";$('#seletall').prop('checked',false);$("#wan_entry_list").empty();if(WanConnJson.length>0)
{for(i=0;i<WanConnJson.length;i++)
{if(WanConnJson[i].GUIname.indexOf("IPTV")!==-1)
continue;wanEntry+="<tr><td>";wanEntry+="<label class='skcheckbox'>";wanEntry+=" <input type='checkbox' id='rml"+i+"' name='rml' value='"+WanConnJson[i].index+"' onclick='changeSel(this)' hidden checked>";wanEntry+="<label for='rml"+i+"' class='skcheckbox-label'></label>";wanEntry+="</label>";wanEntry+="</td>";wanEntry+="<td>"+WanConnJson[i].GUIname+"</td>";wanEntry+="<td>"+getConnectypeStr(WanConnJson[i].networktype)+"</td>";wanEntry+="<td>"+getIpmodeStr(WanConnJson[i].IPStack)+"</td>";wanEntry+="<td>"+getVlanidprioStr(WanConnJson[i].vlanmode,WanConnJson[i].vlanid,WanConnJson[i].vlanpri)+"</td>";portbindListStr=creatPortbindList(WanConnJson[i].portbind);wanEntry+="<td style=\"max-width: 140px;overflow: hidden;text-overflow: ellipsis;white-space: nowrap;\">"+portbindListStr+"</td>";wanEntry+="</tr>";}
$("#seletall").attr("disabled",false);}
else
{wanEntry="<tr><td colspan='7'>No data yet...</td></tr>";$("#seletall").attr("disabled",true);}
$("#wan_entry_list").append(wanEntry);}
function saveMtu()
{var maxMtu;var f = document.forms[0];
var IpVersion = f.IpVersion, connMode = f.connMode, serviceMode = f.serviceMode, vlanMode = f.vlanMode, vlanID = f.vlanID, multiVID = f.multiVID, d8021 = f.d8021, mtu = f.mtu, nat = f.nat, ipAddr = f.ipAddr, netMask = f.netMask, defGW = f.defGW, firstDns = f.firstDns, secondDns = f.secondDns, userName = f.userName, uPsd = f.uPsd, dialMode = f.dialMode, idleTime = f.idleTime, EnableStaticIp = f.EnableStaticIp, pppStaticIPAddress = f.pppStaticIPAddress, pppStaticSubnetMask = f.pppStaticSubnetMask, pppStaticStartAddress = f.pppStaticStartAddress, pppStaticEndAddress = f.pppStaticEndAddress, enblIANA = f.enblIANA, defaultroute = f.defaultroute, defaultroutev6 = f.defaultroutev6, wanAddress6 = f.wanAddress6, wanAddress6prefix = f.wanAddress6prefix, wanGateway6 = f.wanGateway6, enblPD = f.enblPD, delegatePrefix = f.delegatePrefix, delegatePrefixLen = f.delegatePrefixLen, dns6Primary = f.dns6Primary, dns6Secondary = f.dns6Secondary, enbl6RD = f.enbl6RD, ipv6rdBrAddr = f.ipv6rdBrAddr, ipv6rdIpv4MaskLen = f.ipv6rdIpv4MaskLen, ipv6rdPrefix = f.ipv6rdPrefix, ipv6rdPrefixLen = f.ipv6rdPrefixLen, enblDSLite = f.enblDSLite, dsLiteServer = f.dsLiteServer, enable = f.enable, seletall = f.seletall, btn_edit = f.btn_edit, btn_del = f.btn_del, btn_add = f.btn_add;
if(true)
{maxMtu=parseInt(mtu.value);if(!isNumber(mtu.value)||maxMtu<currMinMtu||maxMtu>currMaxMtu)
{warninfo_show(_("wancfg_MTUValue")+": "+mtu.value+" "+_("wancfg_MTUValueError")+$("#span_mtu").html());return 0;}
apply_data.mtu=maxMtu}
return 1;}
var tr069ServiceBit=0;var internetServiceBit=1;var voipServiceBit=2;var otherServiceBit=3;function getServModeMask(serverlist)
{var servModeMask=(1<<internetServiceBit);switch(serverlist)
{case 8:servModeMask=(1<<tr069ServiceBit)|(1<<internetServiceBit)|(1<<voipServiceBit);break;case 1:servModeMask=(1<<tr069ServiceBit);break;case 6:servModeMask=(1<<tr069ServiceBit)|(1<<voipServiceBit);break;case 5:servModeMask=(1<<tr069ServiceBit)|(1<<internetServiceBit);break;case 3:servModeMask=(1<<voipServiceBit);break;case 7:servModeMask=(1<<internetServiceBit)|(1<<voipServiceBit);break;case 4:servModeMask=(1<<otherServiceBit);break;case 2:servModeMask=(1<<internetServiceBit);break;}
return servModeMask;}
function checkSameWanServiceExist(serviceBit)
{var i=0;var serviceMode=0;var servModeMask=0;for(i;i<WanConnJson.length;i++)
{serviceMode=WanConnJson[i].servicelist;servModeMask=getServModeMask(serviceMode)
if(actionapply=="add")
{if(servModeMask&(1<<serviceBit))
{return true;}}
else if(actionapply=="edit")
{if(selindex!=WanConnJson[i].index)
{if(servModeMask&(1<<serviceBit))
{return true;}}}}
return false;}
function saveServMode()
{var servModeMask=0;var serverlist=1;var f = document.forms[0];
var IpVersion = f.IpVersion, connMode = f.connMode, serviceMode = f.serviceMode, vlanMode = f.vlanMode, vlanID = f.vlanID, multiVID = f.multiVID, d8021 = f.d8021, mtu = f.mtu, nat = f.nat, ipAddr = f.ipAddr, netMask = f.netMask, defGW = f.defGW, firstDns = f.firstDns, secondDns = f.secondDns, userName = f.userName, uPsd = f.uPsd, dialMode = f.dialMode, idleTime = f.idleTime, EnableStaticIp = f.EnableStaticIp, pppStaticIPAddress = f.pppStaticIPAddress, pppStaticSubnetMask = f.pppStaticSubnetMask, pppStaticStartAddress = f.pppStaticStartAddress, pppStaticEndAddress = f.pppStaticEndAddress, enblIANA = f.enblIANA, defaultroute = f.defaultroute, defaultroutev6 = f.defaultroutev6, wanAddress6 = f.wanAddress6, wanAddress6prefix = f.wanAddress6prefix, wanGateway6 = f.wanGateway6, enblPD = f.enblPD, delegatePrefix = f.delegatePrefix, delegatePrefixLen = f.delegatePrefixLen, dns6Primary = f.dns6Primary, dns6Secondary = f.dns6Secondary, enbl6RD = f.enbl6RD, ipv6rdBrAddr = f.ipv6rdBrAddr, ipv6rdIpv4MaskLen = f.ipv6rdIpv4MaskLen, ipv6rdPrefix = f.ipv6rdPrefix, ipv6rdPrefixLen = f.ipv6rdPrefixLen, enblDSLite = f.enblDSLite, dsLiteServer = f.dsLiteServer, enable = f.enable, seletall = f.seletall, btn_edit = f.btn_edit, btn_del = f.btn_del, btn_add = f.btn_add;
if(true)
{serverlist=parseInt(serviceMode.value)
servModeMask=getServModeMask(serverlist);if(connMode.value!="bridge")
{if((servModeMask&(1<<tr069ServiceBit))&&(checkSameWanServiceExist(tr069ServiceBit)==true))
{warninfo_show(_("wancfg_TR69ExistedError"));serviceMode.focus();return 0;}}
if((servModeMask&(1<<voipServiceBit))&&(checkSameWanServiceExist(voipServiceBit)==true))
{warninfo_show(_("wancfg_VOIPExistedError"));serviceMode.focus();return 0;}
if((servModeMask&(1<<otherServiceBit))&&(checkSameWanServiceExist(otherServiceBit)==true))
{warninfo_show(_("wancfg_IPTVExistedError"));serviceMode.focus();return 0;}
apply_data.servicelist=serverlist;}
return 1;}
function checkAlreadyExistBridgeNotBoundPort()
{var i=0;for(i=0;i<WanConnJson.length;i++)
{if(selindex!=WanConnJson[i].index)
{if(3==WanConnJson[i].connType&&0==WanConnJson[i].bindPort)
{return true;}}}
return false;}
function saveBindPort()
{var i;var num=0;var bindportlist="";var f = document.forms[0];
var IpVersion = f.IpVersion, connMode = f.connMode, serviceMode = f.serviceMode, vlanMode = f.vlanMode, vlanID = f.vlanID, multiVID = f.multiVID, d8021 = f.d8021, mtu = f.mtu, nat = f.nat, ipAddr = f.ipAddr, netMask = f.netMask, defGW = f.defGW, firstDns = f.firstDns, secondDns = f.secondDns, userName = f.userName, uPsd = f.uPsd, dialMode = f.dialMode, idleTime = f.idleTime, EnableStaticIp = f.EnableStaticIp, pppStaticIPAddress = f.pppStaticIPAddress, pppStaticSubnetMask = f.pppStaticSubnetMask, pppStaticStartAddress = f.pppStaticStartAddress, pppStaticEndAddress = f.pppStaticEndAddress, enblIANA = f.enblIANA, defaultroute = f.defaultroute, defaultroutev6 = f.defaultroutev6, wanAddress6 = f.wanAddress6, wanAddress6prefix = f.wanAddress6prefix, wanGateway6 = f.wanGateway6, enblPD = f.enblPD, delegatePrefix = f.delegatePrefix, delegatePrefixLen = f.delegatePrefixLen, dns6Primary = f.dns6Primary, dns6Secondary = f.dns6Secondary, enbl6RD = f.enbl6RD, ipv6rdBrAddr = f.ipv6rdBrAddr, ipv6rdIpv4MaskLen = f.ipv6rdIpv4MaskLen, ipv6rdPrefix = f.ipv6rdPrefix, ipv6rdPrefixLen = f.ipv6rdPrefixLen, enblDSLite = f.enblDSLite, dsLiteServer = f.dsLiteServer, enable = f.enable, seletall = f.seletall, btn_edit = f.btn_edit, btn_del = f.btn_del, btn_add = f.btn_add;
if(true)
{for(i=0;i<allportlistarry.length;i++)
{var lanPort=document.getElementById("LanPort"+i);if(lanPort.checked==true)
{bindportlist+=lanPort.value;bindportlist+=","
num++;}}
if(connMode.value=="bridge"&&(2!=parseInt(serviceMode.value))&&num==allportlistarry.length)
{warninfo_show(_("wancfg_otherBridgeError"));return 0;}
apply_data.portbind=bindportlist;}
return 1;}
function saveNat()
{var enblNat=1;var f = document.forms[0];
var IpVersion = f.IpVersion, connMode = f.connMode, serviceMode = f.serviceMode, vlanMode = f.vlanMode, vlanID = f.vlanID, multiVID = f.multiVID, d8021 = f.d8021, mtu = f.mtu, nat = f.nat, ipAddr = f.ipAddr, netMask = f.netMask, defGW = f.defGW, firstDns = f.firstDns, secondDns = f.secondDns, userName = f.userName, uPsd = f.uPsd, dialMode = f.dialMode, idleTime = f.idleTime, EnableStaticIp = f.EnableStaticIp, pppStaticIPAddress = f.pppStaticIPAddress, pppStaticSubnetMask = f.pppStaticSubnetMask, pppStaticStartAddress = f.pppStaticStartAddress, pppStaticEndAddress = f.pppStaticEndAddress, enblIANA = f.enblIANA, defaultroute = f.defaultroute, defaultroutev6 = f.defaultroutev6, wanAddress6 = f.wanAddress6, wanAddress6prefix = f.wanAddress6prefix, wanGateway6 = f.wanGateway6, enblPD = f.enblPD, delegatePrefix = f.delegatePrefix, delegatePrefixLen = f.delegatePrefixLen, dns6Primary = f.dns6Primary, dns6Secondary = f.dns6Secondary, enbl6RD = f.enbl6RD, ipv6rdBrAddr = f.ipv6rdBrAddr, ipv6rdIpv4MaskLen = f.ipv6rdIpv4MaskLen, ipv6rdPrefix = f.ipv6rdPrefix, ipv6rdPrefixLen = f.ipv6rdPrefixLen, enblDSLite = f.enblDSLite, dsLiteServer = f.dsLiteServer, enable = f.enable, seletall = f.seletall, btn_edit = f.btn_edit, btn_del = f.btn_del, btn_add = f.btn_add;
if(true)
{if(nat.checked==true)
{enblNat=1;}
else
{if(IpVersion.value==1)
{enblNat=1;}
else
{enblNat=0;}}
apply_data.natenable=enblNat;}
return 1;}
function checkAllVlanParam(vlanId)
{var i=0;var vlanValue;for(i=0;i<WanConnJson.length;i++)
{if(selindex!=WanConnJson[i].index)
{vlanValue=WanConnJson[i].vlanid;if(vlanId==vlanValue)
{return false;}}}
return true;}
function saveVlan()
{var enVlanMux;var vlanMuxPr;var vlanMuxId;var vlanMuxMId;var f = document.forms[0];
var IpVersion = f.IpVersion, connMode = f.connMode, serviceMode = f.serviceMode, vlanMode = f.vlanMode, vlanID = f.vlanID, multiVID = f.multiVID, d8021 = f.d8021, mtu = f.mtu, nat = f.nat, ipAddr = f.ipAddr, netMask = f.netMask, defGW = f.defGW, firstDns = f.firstDns, secondDns = f.secondDns, userName = f.userName, uPsd = f.uPsd, dialMode = f.dialMode, idleTime = f.idleTime, EnableStaticIp = f.EnableStaticIp, pppStaticIPAddress = f.pppStaticIPAddress, pppStaticSubnetMask = f.pppStaticSubnetMask, pppStaticStartAddress = f.pppStaticStartAddress, pppStaticEndAddress = f.pppStaticEndAddress, enblIANA = f.enblIANA, defaultroute = f.defaultroute, defaultroutev6 = f.defaultroutev6, wanAddress6 = f.wanAddress6, wanAddress6prefix = f.wanAddress6prefix, wanGateway6 = f.wanGateway6, enblPD = f.enblPD, delegatePrefix = f.delegatePrefix, delegatePrefixLen = f.delegatePrefixLen, dns6Primary = f.dns6Primary, dns6Secondary = f.dns6Secondary, enbl6RD = f.enbl6RD, ipv6rdBrAddr = f.ipv6rdBrAddr, ipv6rdIpv4MaskLen = f.ipv6rdIpv4MaskLen, ipv6rdPrefix = f.ipv6rdPrefix, ipv6rdPrefixLen = f.ipv6rdPrefixLen, enblDSLite = f.enblDSLite, dsLiteServer = f.dsLiteServer, enable = f.enable, seletall = f.seletall, btn_edit = f.btn_edit, btn_del = f.btn_del, btn_add = f.btn_add;
if(true)
{if(vlanMode.value==2)
{enVlanMux=1;}
else
{enVlanMux=0;vlanMuxId=0;vlanMuxPr=0;}
if(enVlanMux)
{vlanMuxId=parseInt(vlanID.value);vlanMuxMId=parseInt(multiVID.value);if(isNaN(vlanMuxId)) vlanMuxId=0;if(isNaN(vlanMuxMId)) vlanMuxMId=0;}
else
{vlanMuxId=0;vlanMuxPr=0;vlanMuxMId=0;}
if(d8021.value=="")
{vlanMuxPr=0;}
else
{vlanMuxPr=d8021.value;}
if(enVlanMux&&(!vlanMuxMId)){vlanMuxMId=0;}
apply_data.vlanmode=parseInt(vlanMode.value);apply_data.vlanid=parseInt(vlanMuxId);apply_data.multivid=parseInt(vlanMuxMId);apply_data.vlanpri=parseInt(vlanMuxPr);}
return 1;}
function checkIsSpecialIP(ipAddress)
{if(isMulticastAddr(ipAddress)||isreserveaddr(ipAddress)||isLoopbackAddr(ipAddress)||isBroadcastAddr(ipAddress))
{return true;}
if(brlanipaddr!=""&&brlansubnetmask!=""&&isSameSubNet(ipAddress,brlansubnetmask,brlanipaddr,brlansubnetmask))
{return true;}
return false;}
function saveStaticIpAddr()
{var wanIpAddress;var wanSubnetMask;var wanIntfGateway;var dnsPrimary;var dnsSecondary;if(apply_data.servicelist==4)
{return 1;}
var f = document.forms[0];
var IpVersion = f.IpVersion, connMode = f.connMode, serviceMode = f.serviceMode, vlanMode = f.vlanMode, vlanID = f.vlanID, multiVID = f.multiVID, d8021 = f.d8021, mtu = f.mtu, nat = f.nat, ipAddr = f.ipAddr, netMask = f.netMask, defGW = f.defGW, firstDns = f.firstDns, secondDns = f.secondDns, userName = f.userName, uPsd = f.uPsd, dialMode = f.dialMode, idleTime = f.idleTime, EnableStaticIp = f.EnableStaticIp, pppStaticIPAddress = f.pppStaticIPAddress, pppStaticSubnetMask = f.pppStaticSubnetMask, pppStaticStartAddress = f.pppStaticStartAddress, pppStaticEndAddress = f.pppStaticEndAddress, enblIANA = f.enblIANA, defaultroute = f.defaultroute, defaultroutev6 = f.defaultroutev6, wanAddress6 = f.wanAddress6, wanAddress6prefix = f.wanAddress6prefix, wanGateway6 = f.wanGateway6, enblPD = f.enblPD, delegatePrefix = f.delegatePrefix, delegatePrefixLen = f.delegatePrefixLen, dns6Primary = f.dns6Primary, dns6Secondary = f.dns6Secondary, enbl6RD = f.enbl6RD, ipv6rdBrAddr = f.ipv6rdBrAddr, ipv6rdIpv4MaskLen = f.ipv6rdIpv4MaskLen, ipv6rdPrefix = f.ipv6rdPrefix, ipv6rdPrefixLen = f.ipv6rdPrefixLen, enblDSLite = f.enblDSLite, dsLiteServer = f.dsLiteServer, enable = f.enable, seletall = f.seletall, btn_edit = f.btn_edit, btn_del = f.btn_del, btn_add = f.btn_add;
if(true)
{if(IpVersion.value==1||connMode.value!="route"||$('input:radio[name="ipproto"]:checked').val()!="static")
{return 1;}
wanIpAddress=ipAddr.value;wanSubnetMask=netMask.value;wanIntfGateway=defGW.value;dnsPrimary=firstDns.value;dnsSecondary=secondDns.value;if(isValidIpAddress(wanIpAddress)==false||checkIsSpecialIP(wanIpAddress)==true)
{warninfo_show(_("wancfg_IPAddr")+" "+wanIpAddress+" "+_("wancfg_Invalid")+"!");return 0;}
if(isValidSubnetMask(wanSubnetMask)==false||checkIsSpecialIP(wanSubnetMask)==true)
{warninfo_show(_("wancfg_SubnetMask")+" "+wanSubnetMask+" "+_("wancfg_Invalid")+"!");return 0;}
if(isNetworkaddr(wanIpAddress,wanSubnetMask))
{warninfo_show(_("wancfg_IPAddr")+" "+wanIpAddress+" "+_("wancfg_Invalid")+"!");return 0;}
if(isValidIpAddress(wanIntfGateway)==false||checkIsSpecialIP(wanIntfGateway)==true)
{warninfo_show(_("wancfg_IPGateway")+" "+wanIntfGateway+" "+_("wancfg_Invalid")+"!");return 0;}
if(isNetworkaddr(wanIntfGateway,wanSubnetMask))
{warninfo_show(_("wancfg_IPGateway")+" "+wanIntfGateway+" "+_("wancfg_Invalid")+"!");return 0;}
if(isValidIpAddress(dnsPrimary)==false||checkIsSpecialIP(dnsPrimary)==true)
{warninfo_show(_("wancfg_PriDNS")+" "+dnsPrimary+" "+_("wancfg_Invalid")+"!");return 0;}
if(isNetworkaddr(dnsPrimary,wanSubnetMask))
{warninfo_show(_("wancfg_PriDNS")+" "+dnsPrimary+" "+_("wancfg_Invalid")+"!");return 0;}
if(dnsSecondary!=""&&(isValidIpAddress(dnsSecondary)==false||checkIsSpecialIP(dnsSecondary)==true))
{warninfo_show(_("wancfg_SecDNS")+" "+dnsSecondary+" "+_("wancfg_Invalid")+"!");return 0;}
if(dnsSecondary!=""&&isNetworkaddr(dnsSecondary,wanSubnetMask))
{warninfo_show(_("wancfg_SecDNS")+" "+dnsSecondary+" "+_("wancfg_Invalid")+"!");return 0;}
if(!isSameSubNet(wanIpAddress,wanSubnetMask,wanIntfGateway,wanSubnetMask))
{warninfo_show(_("wancfg_staticIPNotSameSubError"));return 0;}
apply_data.ipaddr=wanIpAddress;apply_data.subnetmask=wanSubnetMask;apply_data.gateway=wanIntfGateway;apply_data.dns1=dnsPrimary;if(dnsSecondary!="")
{apply_data.dns2=dnsSecondary;}}
return 1;}
function saveStaticIpv6Addr()
{var f = document.forms[0];
var IpVersion = f.IpVersion, connMode = f.connMode, serviceMode = f.serviceMode, vlanMode = f.vlanMode, vlanID = f.vlanID, multiVID = f.multiVID, d8021 = f.d8021, mtu = f.mtu, nat = f.nat, ipAddr = f.ipAddr, netMask = f.netMask, defGW = f.defGW, firstDns = f.firstDns, secondDns = f.secondDns, userName = f.userName, uPsd = f.uPsd, dialMode = f.dialMode, idleTime = f.idleTime, EnableStaticIp = f.EnableStaticIp, pppStaticIPAddress = f.pppStaticIPAddress, pppStaticSubnetMask = f.pppStaticSubnetMask, pppStaticStartAddress = f.pppStaticStartAddress, pppStaticEndAddress = f.pppStaticEndAddress, enblIANA = f.enblIANA, defaultroute = f.defaultroute, defaultroutev6 = f.defaultroutev6, wanAddress6 = f.wanAddress6, wanAddress6prefix = f.wanAddress6prefix, wanGateway6 = f.wanGateway6, enblPD = f.enblPD, delegatePrefix = f.delegatePrefix, delegatePrefixLen = f.delegatePrefixLen, dns6Primary = f.dns6Primary, dns6Secondary = f.dns6Secondary, enbl6RD = f.enbl6RD, ipv6rdBrAddr = f.ipv6rdBrAddr, ipv6rdIpv4MaskLen = f.ipv6rdIpv4MaskLen, ipv6rdPrefix = f.ipv6rdPrefix, ipv6rdPrefixLen = f.ipv6rdPrefixLen, enblDSLite = f.enblDSLite, dsLiteServer = f.dsLiteServer, enable = f.enable, seletall = f.seletall, btn_edit = f.btn_edit, btn_del = f.btn_del, btn_add = f.btn_add;
if(true)
{if(IpVersion.value==0||$('input:radio[name="ipproto"]:checked').val()!="static"||connMode.value!="route")
{return 1;}
var ipv6Addr;var ipv6prefix=wanAddress6prefix.value;if(wanAddress6prefix.value=='')
ipv6prefix=64;ipv6Addr=wanAddress6.value+"/"+ipv6prefix;if(wanAddress6.value==''||isValidIpv6Address(ipv6Addr)==false){warninfo_show(_("wancfg_WanAddress6Error2"));return 0;}
if(wanGateway6.value==''||sk_isValidIpAddress6(wanGateway6.value)==false){warninfo_show(_("wancfg_WanGWAddress6Error1"));return 0;}
if(dns6Primary.value==''){warninfo_show(_("wancfg_Dns6PrimaryError1"));return 0;}
if(dns6Primary.value!=''&&sk_isValidIpAddress6(dns6Primary.value)==false){warninfo_show(_("wancfg_Dns6PrimaryError2"));return 0;}
if(dns6Secondary.value!=''&&sk_isValidIpAddress6(dns6Secondary.value)==false){warninfo_show(_("wancfg_Dns6SecondaryError2"));return 0;}
if($("#PDTable").is(':visible')==true&&$("#enblPD").is(':checked')==true)
{var PD;var PDLen=delegatePrefixLen.value;if(delegatePrefixLen.value=='')
PDLen=64;if(delegatePrefix.value==''){warninfo_show(_("wancfg_PrefixError1"));return 0;}
PD=delegatePrefix.value+"/"+PDLen;if(delegatePrefix.value!=''&&isValidIpv6Address(PD)==false){warninfo_show(_("wancfg_PrefixError2"));return 0;}
apply_data.prefixsrc=2;apply_data.prefix=PD;}
else
{apply_data.prefixsrc=0}
apply_data.guasrc=2;apply_data.gatewayv6src=2;apply_data.dnsv6src=2;apply_data.gua=ipv6Addr;apply_data.gatewayv6=wanGateway6.value;apply_data.dns1v6=dns6Primary.value;if(dns6Secondary.value!='')
{apply_data.dns2v6=dns6Secondary.value;}}
return 1;}
function checkDSLiteExist()
{var i=0;for(i=0;i<WanConnJson.length;i++)
{if(parseInt(selindex)!=WanConnJson[i].index)
{if(WanConnJson[i].dslite=='1')
{return false;}}}
return true;}
function saveDslite(){var f = document.forms[0];
var IpVersion = f.IpVersion, connMode = f.connMode, serviceMode = f.serviceMode, vlanMode = f.vlanMode, vlanID = f.vlanID, multiVID = f.multiVID, d8021 = f.d8021, mtu = f.mtu, nat = f.nat, ipAddr = f.ipAddr, netMask = f.netMask, defGW = f.defGW, firstDns = f.firstDns, secondDns = f.secondDns, userName = f.userName, uPsd = f.uPsd, dialMode = f.dialMode, idleTime = f.idleTime, EnableStaticIp = f.EnableStaticIp, pppStaticIPAddress = f.pppStaticIPAddress, pppStaticSubnetMask = f.pppStaticSubnetMask, pppStaticStartAddress = f.pppStaticStartAddress, pppStaticEndAddress = f.pppStaticEndAddress, enblIANA = f.enblIANA, defaultroute = f.defaultroute, defaultroutev6 = f.defaultroutev6, wanAddress6 = f.wanAddress6, wanAddress6prefix = f.wanAddress6prefix, wanGateway6 = f.wanGateway6, enblPD = f.enblPD, delegatePrefix = f.delegatePrefix, delegatePrefixLen = f.delegatePrefixLen, dns6Primary = f.dns6Primary, dns6Secondary = f.dns6Secondary, enbl6RD = f.enbl6RD, ipv6rdBrAddr = f.ipv6rdBrAddr, ipv6rdIpv4MaskLen = f.ipv6rdIpv4MaskLen, ipv6rdPrefix = f.ipv6rdPrefix, ipv6rdPrefixLen = f.ipv6rdPrefixLen, enblDSLite = f.enblDSLite, dsLiteServer = f.dsLiteServer, enable = f.enable, seletall = f.seletall, btn_edit = f.btn_edit, btn_del = f.btn_del, btn_add = f.btn_add;
if(true){if(!enblDSLite.checked){apply_data.dslite_mode=0;}else{if($('input:radio[name="dsliteMode"]:checked').val()=="dsliteAuto"){apply_data.dslite_mode=1;}
else{if(dsLiteServer.value==''){warninfo_show(_("dsliteServer")+_("cannotBeEmptyError"));return-1;}
if(dsLiteServer.value.indexOf(":")==-1){if(dsLiteServer.value.indexOf(".")==-1){warninfo_show(_("dsliteServer")+dsLiteServer.value+_("isInvalidError"));return-1;}}else{if("::"==dsLiteServer.value||isValidIpv6Address(dsLiteServer.value)!=true||true==isMultiCastIpv6Address(dsLiteServer.value)){warninfo_show(_("dsliteServer")+dsLiteServer.value+_("isInvalidError"));return-1;}
if(!isGlobalIpv6Address(dsLiteServer.value)){warninfo_show(_("dsliteServer")+dsLiteServer.value+_("isInvalidError"));return-1;}}
apply_data.dslite_mode=2;apply_data.dslite_peeraddr=dsLiteServer.value;}
if((checkDSLiteExist()==false)){warninfo_show(_("dsliteExistError"));return-1;}}}
return 0;}
function checkIpv6rdExist()
{var i=0;for(i=0;i<WanConnJson.length;i++)
{if(parseInt(selindex)!=WanConnJson[i].index)
{if(WanConnJson[i].ipv6rd!=0)
{return false;}}}
return true;}
function saveIpv6rd(){var f = document.forms[0];
var IpVersion = f.IpVersion, connMode = f.connMode, serviceMode = f.serviceMode, vlanMode = f.vlanMode, vlanID = f.vlanID, multiVID = f.multiVID, d8021 = f.d8021, mtu = f.mtu, nat = f.nat, ipAddr = f.ipAddr, netMask = f.netMask, defGW = f.defGW, firstDns = f.firstDns, secondDns = f.secondDns, userName = f.userName, uPsd = f.uPsd, dialMode = f.dialMode, idleTime = f.idleTime, EnableStaticIp = f.EnableStaticIp, pppStaticIPAddress = f.pppStaticIPAddress, pppStaticSubnetMask = f.pppStaticSubnetMask, pppStaticStartAddress = f.pppStaticStartAddress, pppStaticEndAddress = f.pppStaticEndAddress, enblIANA = f.enblIANA, defaultroute = f.defaultroute, defaultroutev6 = f.defaultroutev6, wanAddress6 = f.wanAddress6, wanAddress6prefix = f.wanAddress6prefix, wanGateway6 = f.wanGateway6, enblPD = f.enblPD, delegatePrefix = f.delegatePrefix, delegatePrefixLen = f.delegatePrefixLen, dns6Primary = f.dns6Primary, dns6Secondary = f.dns6Secondary, enbl6RD = f.enbl6RD, ipv6rdBrAddr = f.ipv6rdBrAddr, ipv6rdIpv4MaskLen = f.ipv6rdIpv4MaskLen, ipv6rdPrefix = f.ipv6rdPrefix, ipv6rdPrefixLen = f.ipv6rdPrefixLen, enblDSLite = f.enblDSLite, dsLiteServer = f.dsLiteServer, enable = f.enable, seletall = f.seletall, btn_edit = f.btn_edit, btn_del = f.btn_del, btn_add = f.btn_add;
if(true){if(!enbl6RD.checked){apply_data.ipv6rd_mode=0;return 0;}else{if((checkIpv6rdExist()==false)){warninfo_show(_("ipv6rdExistError"));return-1;}
if($('input:radio[name="ipv6RDMode"]:checked').val()=="ipv6RDAuto"){apply_data.ipv6rd_mode=1;}
else
{if(ipv6rdBrAddr.value==''){warninfo_show(_("ipv6rdBRV4Addr ")+_("cannotBeEmptyError"));return-1;}
if(ipv6rdIpv4MaskLen.value==''){warninfo_show(_("ipv6rdV4MaskLen")+_("cannotBeEmptyError"));return-1;}
if(ipv6rdPrefix.value==''){warninfo_show(_("ipv6rdPrefix")+_("cannotBeEmptyError"));return-1;}
if(ipv6rdPrefixLen.value==''){warninfo_show(_("ipv6rdPrefixLen")+_("cannotBeEmptyError"));return-1;}
if(isValidIpAddress(ipv6rdBrAddr.value)==false){warninfo_show(_("ipv6rdBRV4Addr")+ipv6rdBrAddr.value+_("isInvalidError"));return-1;}
apply_data.ipv6rd_peeraddr=ipv6rdBrAddr.value;var maskLen;maskLen=parseInt(ipv6rdIpv4MaskLen.value);if(isNaN(ipv6rdIpv4MaskLen.value)||maskLen<0||maskLen>31){warninfo_show(_("ipv6rdV4MaskLen")+ipv6rdIpv4MaskLen.value+_("isInvalidError"));return-1;}
apply_data.ipv6rd_ipv4mask_len=maskLen;if(isValidIpv6Address(ipv6rdPrefix.value)==false||(ipv6rdPrefix.value.indexOf("2001:0db8")==0||ipv6rdPrefix.value.indexOf("2001:db8")==0)){warninfo_show(_("ipv6rdPrefix")+ipv6rdPrefix.value+_("isInvalidError"));return-1;}
var prefixLen;prefixLen=parseInt(ipv6rdPrefixLen.value);if(isNaN(ipv6rdPrefixLen.value)||prefixLen<=1||prefixLen>32){warninfo_show(_("ipv6rdPrefixLen")+ipv6rdPrefixLen.value+_("isInvalidError"));return-1;}
apply_data.ipv6rd_ipv6prefix=ipv6rdPrefix.value;apply_data.ipv6rd_ipv6prefix_len=prefixLen;apply_data.ipv6rd_mode=2;}}}
return 0;}
function saveIpVersion()
{var ver=2;var f = document.forms[0];
var IpVersion = f.IpVersion, connMode = f.connMode, serviceMode = f.serviceMode, vlanMode = f.vlanMode, vlanID = f.vlanID, multiVID = f.multiVID, d8021 = f.d8021, mtu = f.mtu, nat = f.nat, ipAddr = f.ipAddr, netMask = f.netMask, defGW = f.defGW, firstDns = f.firstDns, secondDns = f.secondDns, userName = f.userName, uPsd = f.uPsd, dialMode = f.dialMode, idleTime = f.idleTime, EnableStaticIp = f.EnableStaticIp, pppStaticIPAddress = f.pppStaticIPAddress, pppStaticSubnetMask = f.pppStaticSubnetMask, pppStaticStartAddress = f.pppStaticStartAddress, pppStaticEndAddress = f.pppStaticEndAddress, enblIANA = f.enblIANA, defaultroute = f.defaultroute, defaultroutev6 = f.defaultroutev6, wanAddress6 = f.wanAddress6, wanAddress6prefix = f.wanAddress6prefix, wanGateway6 = f.wanGateway6, enblPD = f.enblPD, delegatePrefix = f.delegatePrefix, delegatePrefixLen = f.delegatePrefixLen, dns6Primary = f.dns6Primary, dns6Secondary = f.dns6Secondary, enbl6RD = f.enbl6RD, ipv6rdBrAddr = f.ipv6rdBrAddr, ipv6rdIpv4MaskLen = f.ipv6rdIpv4MaskLen, ipv6rdPrefix = f.ipv6rdPrefix, ipv6rdPrefixLen = f.ipv6rdPrefixLen, enblDSLite = f.enblDSLite, dsLiteServer = f.dsLiteServer, enable = f.enable, seletall = f.seletall, btn_edit = f.btn_edit, btn_del = f.btn_del, btn_add = f.btn_add;
if(true)
{if(connMode.value!="bridge")
{if(IpVersion.value==0)
{ver=1;}
else if(IpVersion.value==1)
{ver=2;}
else if(IpVersion.value==2)
{ver=3;}}
else
{ver=3;}
apply_data.IPStack=ver;}}
function isContainNOSupportChar(str)
{for(var i=0;i<str.length;i++)
{var charCode=str.charCodeAt(i);if(!((charCode>=48&&charCode<=57)||(charCode>=65&&charCode<=90)||(charCode>=97&&charCode<=122)||(charCode==32)||(charCode==33)||(charCode==34)||(charCode==64)||(charCode==35)||(charCode==36)||(charCode==37)||(charCode==94)||(charCode==38)||(charCode==39)||(charCode==40)||(charCode==41)||(charCode==42)||(charCode==43)||(charCode==45)||(charCode==46)||(charCode==47)||(charCode==63)||(charCode==95)))
{return true;}}
return false;}
function savePppParam()
{var pppUserName;var pppPassword;var pppServerName;var pppIdleTime;var pppStaticIPEnable;var pppIpAddr;var pppInetMask;var pppIpStartAddr;var pppIpEndAddr;var f = document.forms[0];
var IpVersion = f.IpVersion, connMode = f.connMode, serviceMode = f.serviceMode, vlanMode = f.vlanMode, vlanID = f.vlanID, multiVID = f.multiVID, d8021 = f.d8021, mtu = f.mtu, nat = f.nat, ipAddr = f.ipAddr, netMask = f.netMask, defGW = f.defGW, firstDns = f.firstDns, secondDns = f.secondDns, userName = f.userName, uPsd = f.uPsd, dialMode = f.dialMode, idleTime = f.idleTime, EnableStaticIp = f.EnableStaticIp, pppStaticIPAddress = f.pppStaticIPAddress, pppStaticSubnetMask = f.pppStaticSubnetMask, pppStaticStartAddress = f.pppStaticStartAddress, pppStaticEndAddress = f.pppStaticEndAddress, enblIANA = f.enblIANA, defaultroute = f.defaultroute, defaultroutev6 = f.defaultroutev6, wanAddress6 = f.wanAddress6, wanAddress6prefix = f.wanAddress6prefix, wanGateway6 = f.wanGateway6, enblPD = f.enblPD, delegatePrefix = f.delegatePrefix, delegatePrefixLen = f.delegatePrefixLen, dns6Primary = f.dns6Primary, dns6Secondary = f.dns6Secondary, enbl6RD = f.enbl6RD, ipv6rdBrAddr = f.ipv6rdBrAddr, ipv6rdIpv4MaskLen = f.ipv6rdIpv4MaskLen, ipv6rdPrefix = f.ipv6rdPrefix, ipv6rdPrefixLen = f.ipv6rdPrefixLen, enblDSLite = f.enblDSLite, dsLiteServer = f.dsLiteServer, enable = f.enable, seletall = f.seletall, btn_edit = f.btn_edit, btn_del = f.btn_del, btn_add = f.btn_add;
if(true)
{if(connMode.value!="route"||$('input:radio[name="ipproto"]:checked').val()!="pppoe")
{return 1;}
pppUserName=userName.value;pppPassword=uPsd.value;if(dialMode.value==1)
{pppIdleTime=0;}
else
{pppIdleTime=parseInt(idleTime.value);if(isNaN(pppIdleTime)||pppIdleTime<30||pppIdleTime>9999)
{warninfo_show(_("wancfg_pppIdleTimeValue")+": "+idleTime.value+" "+_("wancfg_pppIdleTimeValueError"));return 0;}}
if(EnableStaticIp.checked==false)
{pppStaticIPEnable=0;}
else
{if(IpVersion.value==1)
{pppStaticIPEnable=0;}
else
{pppStaticIPEnable=1;}}
pppIpAddr=pppStaticIPAddress.value;pppInetMask=pppStaticSubnetMask.value;pppIpStartAddr=pppStaticStartAddress.value;pppIpEndAddr=pppStaticEndAddress.value;if(pppUserName.length==0)
{warninfo_show(_("wancfg_PPPoEUserNameError1"));return 0;}
else if(pppUserName.length>64)
{warninfo_show(_("wancfg_PPPoEUserNameError2"));return 0;}
if(isContainNOSupportChar(pppUserName)==true)
{warninfo_show(_("wancfg_PPPoEUserNameError3"));return 0;}
if(pppPassword.length==0)
{warninfo_show(_("wancfg_PPPoEPasswordError1"));return 0;}
else if(pppPassword.length>32)
{warninfo_show(_("wancfg_PPPoEPasswordError2"));return 0;}
if(isContainNOSupportChar(pppPassword)==true)
{warninfo_show(_("wancfg_PPPoEPasswordError3"));return 0;}
if(pppIpAddr.length>0&&(isValidIpAddress(pppIpAddr)==false||checkIsSpecialIP(pppIpAddr)==true))
{warninfo_show(_("wancfg_IPAddr")+" "+pppIpAddr+" "+_("wancfg_Invalid")+"!");return 0;}
if(pppInetMask.length>0&&(isValidSubnetMask(pppInetMask)==false||checkIsSpecialIP(pppInetMask)==true))
{warninfo_show(_("wancfg_SubnetMask")+" "+pppInetMask+" "+_("wancfg_Invalid")+"!");return 0;}
if(pppIpAddr.length>0&&pppInetMask.length>0&&isNetworkaddr(pppIpAddr,pppInetMask))
{warninfo_show(_("wancfg_IPAddr")+" "+ipAddr+" "+_("wancfg_Invalid")+"!");return 0;}
if(pppIpStartAddr.length>0&&(isValidIpAddress(pppIpStartAddr)==false||checkIsSpecialIP(pppIpStartAddr)==true))
{warninfo_show(_("wancfg_IPAddr")+" "+pppIpStartAddr+" "+_("wancfg_Invalid")+"!");return 0;}
if(pppIpEndAddr.length>0&&(isValidIpAddress(pppIpEndAddr)==false||checkIsSpecialIP(pppIpEndAddr)==true))
{warninfo_show(_("wancfg_IPAddr")+" "+pppIpEndAddr+" "+_("wancfg_Invalid")+"!");return 0;}
if(pppIpStartAddr.length>0&&!cmpIpAddress(pppIpStartAddr,pppIpEndAddr)){warninfo_show(_("wancfg_IPAddr")+" "+pppIpEndAddr+" "+_("wancfg_Invalid")+"!");return 0;}
apply_data.dial=pppIdleTime*60;apply_data.pppoename=pppUserName;apply_data.pppoepwd=getAES(pppPassword);apply_data.PPPoEStaticIPEnable=pppStaticIPEnable;apply_data.PPPoEStaticAddr=pppIpAddr;apply_data.PPPoEStaticMask=pppInetMask;apply_data.PPPoEStaticStartAddr=pppIpStartAddr;apply_data.PPPoEStaticEndAddr=pppIpEndAddr;}
return 1;}
function saveConnType()
{var wanConnType;var index=0;var f = document.forms[0];
var IpVersion = f.IpVersion, connMode = f.connMode, serviceMode = f.serviceMode, vlanMode = f.vlanMode, vlanID = f.vlanID, multiVID = f.multiVID, d8021 = f.d8021, mtu = f.mtu, nat = f.nat, ipAddr = f.ipAddr, netMask = f.netMask, defGW = f.defGW, firstDns = f.firstDns, secondDns = f.secondDns, userName = f.userName, uPsd = f.uPsd, dialMode = f.dialMode, idleTime = f.idleTime, EnableStaticIp = f.EnableStaticIp, pppStaticIPAddress = f.pppStaticIPAddress, pppStaticSubnetMask = f.pppStaticSubnetMask, pppStaticStartAddress = f.pppStaticStartAddress, pppStaticEndAddress = f.pppStaticEndAddress, enblIANA = f.enblIANA, defaultroute = f.defaultroute, defaultroutev6 = f.defaultroutev6, wanAddress6 = f.wanAddress6, wanAddress6prefix = f.wanAddress6prefix, wanGateway6 = f.wanGateway6, enblPD = f.enblPD, delegatePrefix = f.delegatePrefix, delegatePrefixLen = f.delegatePrefixLen, dns6Primary = f.dns6Primary, dns6Secondary = f.dns6Secondary, enbl6RD = f.enbl6RD, ipv6rdBrAddr = f.ipv6rdBrAddr, ipv6rdIpv4MaskLen = f.ipv6rdIpv4MaskLen, ipv6rdPrefix = f.ipv6rdPrefix, ipv6rdPrefixLen = f.ipv6rdPrefixLen, enblDSLite = f.enblDSLite, dsLiteServer = f.dsLiteServer, enable = f.enable, seletall = f.seletall, btn_edit = f.btn_edit, btn_del = f.btn_del, btn_add = f.btn_add;
if(true)
{if(connMode.value=="bridge")
{wanConnType="ap-bridge";}
else
{if($('input:radio[name="ipproto"]:checked').val()=="pppoe")
{wanConnType="pppoe";}
else if($('input:radio[name="ipproto"]:checked').val()=="dhcp")
{if(apply_data.IPStack==2)
{wanConnType="dhcpv6";}
else
{wanConnType="dhcp";}}
else
{wanConnType="static";}}
apply_data.networktype=wanConnType;}
return 1;}
function saveIpv6Param()
{var dhcp6cForPd=0;var dhcp6cForAddr=0;var f = document.forms[0];
var IpVersion = f.IpVersion, connMode = f.connMode, serviceMode = f.serviceMode, vlanMode = f.vlanMode, vlanID = f.vlanID, multiVID = f.multiVID, d8021 = f.d8021, mtu = f.mtu, nat = f.nat, ipAddr = f.ipAddr, netMask = f.netMask, defGW = f.defGW, firstDns = f.firstDns, secondDns = f.secondDns, userName = f.userName, uPsd = f.uPsd, dialMode = f.dialMode, idleTime = f.idleTime, EnableStaticIp = f.EnableStaticIp, pppStaticIPAddress = f.pppStaticIPAddress, pppStaticSubnetMask = f.pppStaticSubnetMask, pppStaticStartAddress = f.pppStaticStartAddress, pppStaticEndAddress = f.pppStaticEndAddress, enblIANA = f.enblIANA, defaultroute = f.defaultroute, defaultroutev6 = f.defaultroutev6, wanAddress6 = f.wanAddress6, wanAddress6prefix = f.wanAddress6prefix, wanGateway6 = f.wanGateway6, enblPD = f.enblPD, delegatePrefix = f.delegatePrefix, delegatePrefixLen = f.delegatePrefixLen, dns6Primary = f.dns6Primary, dns6Secondary = f.dns6Secondary, enbl6RD = f.enbl6RD, ipv6rdBrAddr = f.ipv6rdBrAddr, ipv6rdIpv4MaskLen = f.ipv6rdIpv4MaskLen, ipv6rdPrefix = f.ipv6rdPrefix, ipv6rdPrefixLen = f.ipv6rdPrefixLen, enblDSLite = f.enblDSLite, dsLiteServer = f.dsLiteServer, enable = f.enable, seletall = f.seletall, btn_edit = f.btn_edit, btn_del = f.btn_del, btn_add = f.btn_add;
if(true)
{if(enblPD.checked)
{dhcp6cForPd=1;}
else
{dhcp6cForPd=0;}
if(enblIANA.value==1)
{dhcp6cForAddr=1;}
else
{dhcp6cForAddr=3;}
if(apply_data.networktype!="static")
{apply_data.dnsv6src=1;}
var dnsmode=$('input:radio[name="dnsv6mode"]:checked').val();if(dnsmode=='enable')
{if(dns6Primary.value==''){warninfo_show(_("wancfg_Dns6PrimaryError1"));return 0;}
if(dns6Primary.value!=''&&sk_isValidIpAddress6(dns6Primary.value)==false){warninfo_show(_("wancfg_Dns6PrimaryError2"));return 0;}
if(dns6Secondary.value!=''&&sk_isValidIpAddress6(dns6Secondary.value)==false){warninfo_show(_("wancfg_Dns6SecondaryError2"));return 0;}
apply_data.peer_dnsv6=0;apply_data.peer_staticdns1v6=dns6Primary.value;if(dns6Secondary.value!='')
{apply_data.peer_staticdns2v6=dns6Secondary.value;}}
else
{apply_data.peer_dnsv6=1;}
apply_data.prefixsrc=dhcp6cForPd;apply_data.guasrc=dhcp6cForAddr;}
return 1;}
function saveDefaultroute()
{var f = document.forms[0];
var IpVersion = f.IpVersion, connMode = f.connMode, serviceMode = f.serviceMode, vlanMode = f.vlanMode, vlanID = f.vlanID, multiVID = f.multiVID, d8021 = f.d8021, mtu = f.mtu, nat = f.nat, ipAddr = f.ipAddr, netMask = f.netMask, defGW = f.defGW, firstDns = f.firstDns, secondDns = f.secondDns, userName = f.userName, uPsd = f.uPsd, dialMode = f.dialMode, idleTime = f.idleTime, EnableStaticIp = f.EnableStaticIp, pppStaticIPAddress = f.pppStaticIPAddress, pppStaticSubnetMask = f.pppStaticSubnetMask, pppStaticStartAddress = f.pppStaticStartAddress, pppStaticEndAddress = f.pppStaticEndAddress, enblIANA = f.enblIANA, defaultroute = f.defaultroute, defaultroutev6 = f.defaultroutev6, wanAddress6 = f.wanAddress6, wanAddress6prefix = f.wanAddress6prefix, wanGateway6 = f.wanGateway6, enblPD = f.enblPD, delegatePrefix = f.delegatePrefix, delegatePrefixLen = f.delegatePrefixLen, dns6Primary = f.dns6Primary, dns6Secondary = f.dns6Secondary, enbl6RD = f.enbl6RD, ipv6rdBrAddr = f.ipv6rdBrAddr, ipv6rdIpv4MaskLen = f.ipv6rdIpv4MaskLen, ipv6rdPrefix = f.ipv6rdPrefix, ipv6rdPrefixLen = f.ipv6rdPrefixLen, enblDSLite = f.enblDSLite, dsLiteServer = f.dsLiteServer, enable = f.enable, seletall = f.seletall, btn_edit = f.btn_edit, btn_del = f.btn_del, btn_add = f.btn_add;
if(true)
{if(defaultroute.checked==true)
{apply_data.is_defaultroute=1;}
else
{apply_data.is_defaultroute=0;}
return true;}}
function saveDefaultroutev6()
{var f = document.forms[0];
var IpVersion = f.IpVersion, connMode = f.connMode, serviceMode = f.serviceMode, vlanMode = f.vlanMode, vlanID = f.vlanID, multiVID = f.multiVID, d8021 = f.d8021, mtu = f.mtu, nat = f.nat, ipAddr = f.ipAddr, netMask = f.netMask, defGW = f.defGW, firstDns = f.firstDns, secondDns = f.secondDns, userName = f.userName, uPsd = f.uPsd, dialMode = f.dialMode, idleTime = f.idleTime, EnableStaticIp = f.EnableStaticIp, pppStaticIPAddress = f.pppStaticIPAddress, pppStaticSubnetMask = f.pppStaticSubnetMask, pppStaticStartAddress = f.pppStaticStartAddress, pppStaticEndAddress = f.pppStaticEndAddress, enblIANA = f.enblIANA, defaultroute = f.defaultroute, defaultroutev6 = f.defaultroutev6, wanAddress6 = f.wanAddress6, wanAddress6prefix = f.wanAddress6prefix, wanGateway6 = f.wanGateway6, enblPD = f.enblPD, delegatePrefix = f.delegatePrefix, delegatePrefixLen = f.delegatePrefixLen, dns6Primary = f.dns6Primary, dns6Secondary = f.dns6Secondary, enbl6RD = f.enbl6RD, ipv6rdBrAddr = f.ipv6rdBrAddr, ipv6rdIpv4MaskLen = f.ipv6rdIpv4MaskLen, ipv6rdPrefix = f.ipv6rdPrefix, ipv6rdPrefixLen = f.ipv6rdPrefixLen, enblDSLite = f.enblDSLite, dsLiteServer = f.dsLiteServer, enable = f.enable, seletall = f.seletall, btn_edit = f.btn_edit, btn_del = f.btn_del, btn_add = f.btn_add;
if(true)
{if(defaultroutev6.checked==true)
{apply_data.is_defaultroute_v6=1;}
else
{apply_data.is_defaultroute_v6=0;}
return true;}}
function btnSave()
{var ubusparam=new Array();var jsonparam={};apply_data={};var f = document.forms[0];
var IpVersion = f.IpVersion, connMode = f.connMode, serviceMode = f.serviceMode, vlanMode = f.vlanMode, vlanID = f.vlanID, multiVID = f.multiVID, d8021 = f.d8021, mtu = f.mtu, nat = f.nat, ipAddr = f.ipAddr, netMask = f.netMask, defGW = f.defGW, firstDns = f.firstDns, secondDns = f.secondDns, userName = f.userName, uPsd = f.uPsd, dialMode = f.dialMode, idleTime = f.idleTime, EnableStaticIp = f.EnableStaticIp, pppStaticIPAddress = f.pppStaticIPAddress, pppStaticSubnetMask = f.pppStaticSubnetMask, pppStaticStartAddress = f.pppStaticStartAddress, pppStaticEndAddress = f.pppStaticEndAddress, enblIANA = f.enblIANA, defaultroute = f.defaultroute, defaultroutev6 = f.defaultroutev6, wanAddress6 = f.wanAddress6, wanAddress6prefix = f.wanAddress6prefix, wanGateway6 = f.wanGateway6, enblPD = f.enblPD, delegatePrefix = f.delegatePrefix, delegatePrefixLen = f.delegatePrefixLen, dns6Primary = f.dns6Primary, dns6Secondary = f.dns6Secondary, enbl6RD = f.enbl6RD, ipv6rdBrAddr = f.ipv6rdBrAddr, ipv6rdIpv4MaskLen = f.ipv6rdIpv4MaskLen, ipv6rdPrefix = f.ipv6rdPrefix, ipv6rdPrefixLen = f.ipv6rdPrefixLen, enblDSLite = f.enblDSLite, dsLiteServer = f.dsLiteServer, enable = f.enable, seletall = f.seletall, btn_edit = f.btn_edit, btn_del = f.btn_del, btn_add = f.btn_add;
if(true)
{if(enable.checked==true){apply_data.enable=1;}else{apply_data.enable=0;}
if(!saveMtu()||!saveServMode()||!saveBindPort()||!saveNat()||!saveVlan())
{return;}
if(!savePppParam()||!saveStaticIpAddr()||!saveStaticIpv6Addr())
{return;}
saveIpVersion();if(!saveConnType())
{return;}
if(connMode.value!="bridge"&&$('input:radio[name="ipproto"]:checked').val()!="static"&&(IpVersion.value==1||IpVersion.value==2))
{if(!saveIpv6Param())
{return;}}
if(connMode.value!="bridge"){if(IpVersion.value==1){if(saveDslite()){return;}}
else if(IpVersion.value==0){if(saveIpv6rd()){return;}}
if(apply_data.servicelist==8||apply_data.servicelist==5||apply_data.servicelist==7||apply_data.servicelist==2){if(IpVersion.value==0||IpVersion.value==2){if(!saveDefaultroute()){return;}}
if(IpVersion.value==1||IpVersion.value==2){if(!saveDefaultroutev6()){return;}}}}}
if(ft_passthrough_bridge==='1'){var utag_bridge_num=0;var same_vlan_route_wan=false;if(apply_data.networktype=="bridge"&&apply_data.vlanmode==1)
{var vlan_array=[];for(var i=0;i<WanConnJson.length;i++)
{if(WanConnJson[i].networktype=="bridge"&&WanConnJson[i].vlanmode==1)
utag_bridge_num++;}
for(var i=0;i<WanConnJson.length;i++)
{for(j=0;j<vlan_array.length;j++)
{if(WanConnJson[i].vlanid==vlan_array[j]){same_vlan_route_wan=true;break;}}
vlan_array[i]=WanConnJson[i].vlanid;}
if(same_vlan_route_wan&&!utag_bridge_num){warninfo_show(_("wancfg_vlan_exist_on_add_utag_bridge_error"));return;}}}
if(actionapply=="add")
{ubusparam=new Array("gwweb.wancfg","add_WanConnection_encrypt",apply_data);}
else if(actionapply=="edit")
{apply_data.index=parseInt(selindex);ubusparam=new Array("gwweb.wancfg","setWanCfg_encrypt",apply_data);}
else
{return;}
jsonparam={"id":1,"params":ubusparam};sk_auth_apply(jsonparam,function(result){pageLoad();});}
function btnCancel()
{pageLoad();}
function selectAll(obj)
{var selist=$("input[name='rml']");if(selist.length==0)
return;for(i=0;i<selist.length;i++){if($(obj).is(':checked'))
selist[i].checked=true;else
selist[i].checked=false;}
changeSel();}
function changeSel()
{var f = document.forms[0];
var IpVersion = f.IpVersion, connMode = f.connMode, serviceMode = f.serviceMode, vlanMode = f.vlanMode, vlanID = f.vlanID, multiVID = f.multiVID, d8021 = f.d8021, mtu = f.mtu, nat = f.nat, ipAddr = f.ipAddr, netMask = f.netMask, defGW = f.defGW, firstDns = f.firstDns, secondDns = f.secondDns, userName = f.userName, uPsd = f.uPsd, dialMode = f.dialMode, idleTime = f.idleTime, EnableStaticIp = f.EnableStaticIp, pppStaticIPAddress = f.pppStaticIPAddress, pppStaticSubnetMask = f.pppStaticSubnetMask, pppStaticStartAddress = f.pppStaticStartAddress, pppStaticEndAddress = f.pppStaticEndAddress, enblIANA = f.enblIANA, defaultroute = f.defaultroute, defaultroutev6 = f.defaultroutev6, wanAddress6 = f.wanAddress6, wanAddress6prefix = f.wanAddress6prefix, wanGateway6 = f.wanGateway6, enblPD = f.enblPD, delegatePrefix = f.delegatePrefix, delegatePrefixLen = f.delegatePrefixLen, dns6Primary = f.dns6Primary, dns6Secondary = f.dns6Secondary, enbl6RD = f.enbl6RD, ipv6rdBrAddr = f.ipv6rdBrAddr, ipv6rdIpv4MaskLen = f.ipv6rdIpv4MaskLen, ipv6rdPrefix = f.ipv6rdPrefix, ipv6rdPrefixLen = f.ipv6rdPrefixLen, enblDSLite = f.enblDSLite, dsLiteServer = f.dsLiteServer, enable = f.enable, seletall = f.seletall, btn_edit = f.btn_edit, btn_del = f.btn_del, btn_add = f.btn_add;
if(true)
{var selectnum=0;var selist=$("input[name='rml']");if(selist.length==0||selist.length===undefined)
{seletall.checked=false;btn_edit.disabled=true;btn_del.disabled=true;return;}
else
{for(var i=0;i<selist.length;i++)
{if(selist[i].checked==true)
{selectnum++;}}}
if(selectnum==selist.length)
{seletall.checked=true;}
else
{seletall.checked=false;}
if(selectnum==1)
{btn_edit.disabled=false;}
else
{btn_edit.disabled=true;}
if(selectnum>0)
{btn_del.disabled=false;}
else
{btn_del.disabled=true;}}}
function loadLanPortTable()
{if(lanPortNum==''||lanPortNum=='4')
{return;}
else if(lanPortNum=='3')
{$("#LanTable4").hide();}
else if(lanPortNum=='2')
{$("#LanTable3").hide();$("#LanTable4").hide();}
else if(lanPortNum=='1')
{$("#LanTable2").hide();$("#LanTable3").hide();$("#LanTable4").hide();}}
function checkWanNum()
{var f = document.forms[0];
var IpVersion = f.IpVersion, connMode = f.connMode, serviceMode = f.serviceMode, vlanMode = f.vlanMode, vlanID = f.vlanID, multiVID = f.multiVID, d8021 = f.d8021, mtu = f.mtu, nat = f.nat, ipAddr = f.ipAddr, netMask = f.netMask, defGW = f.defGW, firstDns = f.firstDns, secondDns = f.secondDns, userName = f.userName, uPsd = f.uPsd, dialMode = f.dialMode, idleTime = f.idleTime, EnableStaticIp = f.EnableStaticIp, pppStaticIPAddress = f.pppStaticIPAddress, pppStaticSubnetMask = f.pppStaticSubnetMask, pppStaticStartAddress = f.pppStaticStartAddress, pppStaticEndAddress = f.pppStaticEndAddress, enblIANA = f.enblIANA, defaultroute = f.defaultroute, defaultroutev6 = f.defaultroutev6, wanAddress6 = f.wanAddress6, wanAddress6prefix = f.wanAddress6prefix, wanGateway6 = f.wanGateway6, enblPD = f.enblPD, delegatePrefix = f.delegatePrefix, delegatePrefixLen = f.delegatePrefixLen, dns6Primary = f.dns6Primary, dns6Secondary = f.dns6Secondary, enbl6RD = f.enbl6RD, ipv6rdBrAddr = f.ipv6rdBrAddr, ipv6rdIpv4MaskLen = f.ipv6rdIpv4MaskLen, ipv6rdPrefix = f.ipv6rdPrefix, ipv6rdPrefixLen = f.ipv6rdPrefixLen, enblDSLite = f.enblDSLite, dsLiteServer = f.dsLiteServer, enable = f.enable, seletall = f.seletall, btn_edit = f.btn_edit, btn_del = f.btn_del, btn_add = f.btn_add;
if(true)
{if(WanConnJson.length>=8)
{btn_add.disabled=true;}
else
{btn_add.disabled=false;}}}
function comboPortListStr(list,num)
{var i=0;var portListHtml="";for(i=0;i<list.length;i++)
{allportlistarry.push(list[i]);if(i==0)
{portListHtml+="<div style='margin-bottom:5px;'>";portListHtml+="<ul>";}
portListHtml+="<li style='margin-right:10px; width:100px;'>";portListHtml+="<label class='skcheckbox-round'>";portListHtml+="<input type='checkbox' name='LanPort' id=LanPort"+(num+i)+" value='"+list[i].ifname+"' hidden/>";portListHtml+="<label for=LanPort"+(num+i)+" id='Lb_LanPort"+(num+i)+"' class='skcheckbox-round-label'>";portListHtml+="</label>";portListHtml+="</label>";portListHtml+="<label class='skcheckbox-text' for=LanPort"+(num+i)+">"+list[i].labelname+" </label>";portListHtml+="</li>";if(i==(list.length-1))
{portListHtml+="</ul>";portListHtml+="</div";}}
return portListHtml}
function showPortList()
{var portListHtml="";var i=0;var portbindListStr="--";var list=[];var num=0;var line=1;$("#lan_port_list").empty();allportlistarry=[];list=portlist.eth;portListHtml+=comboPortListStr(list,num);if(portlist.wlan2g!=undefined)
{list=portlist.wlan2g;num+=portlist.eth.length;portListHtml+=comboPortListStr(list,num);line++;}
if(portlist.wlan5g!=undefined)
{list=portlist.wlan5g;num+=portlist.wlan2g.length;portListHtml+=comboPortListStr(list,num);line++;}
if(portlist.wlan6g!=undefined)
{list=portlist.wlan6g;num+=portlist.wlan5g.length;portListHtml+=comboPortListStr(list,num);line++;}
document.getElementById('portbindtable').style.height=(line*25)+'px';$("#lan_port_list").append(portListHtml);}
function ubusGetCollect()
{var i=0;var ubusparam1=new Array("gwweb.wancfg","getWanCfg",{});var ubusparam2=new Array("gwweb.portinfo","get_lanlist",{});var ubusparam3=new Array("gwweb.pon.sfu","get_onuType",{});var ubusparam4=new Array("rtweb.lancfg","getLanCfg",{});var ubusparam5=new Array("skapi.feature","get",{"feature":"ft_pppoe_static_ip_support"});var jsonparam=[{"id":1,"params":ubusparam1},{"id":2,"params":ubusparam2},{"id":3,"params":ubusparam3},{"id":4,"params":ubusparam4},{"id":5,"params":ubusparam5}];sk_auth_post(jsonparam,function(result){WanConnJson=result[0].result[1].wan;portlist=result[1].result[1];if(result[2].result!=null)
{onuType=result[2].result[1].onuType;if(onuType=="hybrid")
{sfuBindPort=result[2].result[1].hybrid_lan;}
if(onuType=="hybrid"||onuType=="sfu")
for(i=0;i<WanConnJson.length;i++)
{if(WanConnJson[i].index==8)
{WanConnJson.splice(i,1);break;}}}
brlanipaddr=result[3].result[1].ipaddr;brlansubnetmask=result[3].result[1].subnetmask;pppoe_static_ip_support=result[4].result[1].ft_pppoe_static_ip_support;showPortList();showWanEntry();checkWanNum()
editwan();hideElements();});}
function pageLoad(){ubusGetCollect();}
function PPPUseStaticIP(){if(parseInt(pppoe_static_ip_support)==1)
{$("#pppStaticIPEnableTable").show();if(EnableStaticIp.checked==true)
{$("#pppStaticIPTable").show();}
else
{$("#pppStaticIPTable").hide();}}
else
{$("#pppStaticIPEnableTable").hide();}}
function selectdnsv6mode()
{var dnsmode=$('input:radio[name="dnsv6mode"]:checked').val();if(dnsmode=='disable')
{$("#dnsv6Table").hide();}
else
{$("#dnsv6Table").show();}}
function hideElements(){$("#wanindex").hide();var divs=document.querySelectorAll('.hidden-div');divs.forEach(function(div){div.style.display='none';});}
function restartwan()
{var ubusparam=new Array();var jsonparam={};apply_data={};apply_data.index=1;ubusparam=new Array("gwweb.wancfg","setWanCfg_encrypt",apply_data);jsonparam={"id":1,"params":ubusparam};sk_auth_apply(jsonparam,function(result){pageLoad();});}