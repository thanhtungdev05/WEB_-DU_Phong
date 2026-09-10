

<!DOCTYPE html PUBLIC "-//W3C//DTD XHTML 1.0 Transitional//EN" "http://www.w3.org/TR/xhtml1/DTD/xhtml1-transitional.dtd">
<html xmlns="http://www.w3.org/1999/xhtml" xml:lang="utf-8" dir="ltr" lang="utf-8">
<head>
<meta http-equiv="X-UA-Compatible" content="IE=11;IE=10;IE=9; IE=8; IE=7; IE=EDGE">
<meta http-equiv=Content-Script-Type content=text/javascript>
<meta http-equiv=Content-Style-Type content=text/css>
<meta http-equiv=Content-Type content="text/html; charset=UTF-8">
<link rel="stylesheet" type="text/css" href="/style.css">
<style  type="text/css">
*{color:  #404040;}
</style>
<script language="JavaScript" src="/general.js"></script>
<script language="JavaScript" type="text/javascript" src="/jsl.js"></script>
<script language="JavaScript" type="text/javascript" src="/val.js"></script>
<script language="JavaScript" type="text/javascript" src="/pvc.js"></script>
<script language="JavaScript" type="text/javascript" src="/ip.js"></script>
<script language="JavaScript" type='text/javascript' src="/ip_new.js"></script>
<script type="text/javascript" src="/spin.js" ></script>
<style>
*{color:  #404040;}

</style>
<script language="JavaScript">
var wan_pvc_isp = "N/A";
var dhcpLease_leaseNum = "0";
var dhcpd_empty_Entry = "1";
var wan_ipversion = "IPv4/IPv6";
var lan_ip = "192.168.1.1";
var lan_netmask = "255.255.255.0";
var nat_session1 = "0";
var nat_session2 = "0";
var lan_dhcp_type = "1";
var dhcpd_start = "192.168.1.2";
var dhcpd_pool_count = "253";
var dhcpd_lease = "86400";
var dhcpd_type = "";
var dhcpd_dns_all = "";
var dhcpRelay_serverIp = "";
var lan_ip6_all = "";
var radvd_enable = "1";
var radvd_mode = "0";
var radvd_prefixIpv6_all = "";
var radvd_preferredLifetime = "";
var radvd_validLifetime = "";
var radvd_managedEnable = "1";
var radvd_otherEnable = "1";
var dhcp6s_enableFlag = "1";
var dhcp6s_pdFlag = "N/A";
var dhcp6s_mode = "server";
var prefixIPv6_v6_all = "";
var preferredLifetime_v6 = "";
var validLifetime_v6 = "";
var dnsServer_v6_all = "";
var wlan_isExist = "On";
var wlan_bssidnum = "8";
var wlan_isExist_5g = "On";
var wlan_bssidnum_5g = "8";
var dhcpd_staticNum = "0";

//////
/*
var wan_pvc_isp = "3";//Wan_PVC ISP
var dhcpd_staticNum = "1";//Dhcpd Static_Num
var dhcpLease_leaseNum = "0"//DhcpLease LeaseNum
var dhcpd_empty_Entry = "1";//Dhcpd Empty_Entry
var wan_ipversion = "IPv4/IPv6";//Wan_PVC IPVERSION
var lan_ip = "192.168.1.1";//Lan_Entry IP
var lan_netmask = "255.255.255.0";//Lan_Entry netmask
var lan_dhcp_type = "1";//Lan_Dhcp type
var dhcpd_start = "192.168.1.2";//Dhcpd_Common start
var dhcpd_pool_count = "253";//Dhcpd_Common pool_count
var dhcpd_lease = "86400";//Dhcpd_Common lease
var dhcpd_type = "1";//Dhcpd_Common type
var dhcpd_dns1 = "192.168.10.1";//Dhcpd_Common DNS1
var dhcpd_dns2 = "192.168.10.2";//Dhcpd_Common DNS2
var dhcpd_0_ip = "N/A";//Dhcpd_Entry0 IP
var dhcpd_0_mac = "N/A";//Dhcpd_Entry0 MAC
var dhcpd_1_ip = "192.168.1.2";//Dhcpd_Entry1 IP
var dhcpd_1_mac = "00:11:22:33:44:55";//Dhcpd_Entry1 MAC
var dhcpd_2_ip = "N/A";//Dhcpd_Entry2 IP
var dhcpd_2_mac = "N/A";//Dhcpd_Entry2 MAC
var dhcpd_3_ip = "N/A";//Dhcpd_Entry3 IP
var dhcpd_3_mac = "N/A";//Dhcpd_Entry3 MAC
var dhcpd_4_ip = "N/A";//Dhcpd_Entry4 IP
var dhcpd_4_mac = "N/A";//Dhcpd_Entry4 MAC
var dhcpd_5_ip = "N/A";//Dhcpd_Entry5 IP
var dhcpd_5_mac = "N/A";//Dhcpd_Entry5 MAC
var dhcpd_6_ip = "N/A";//Dhcpd_Entry6 IP
var dhcpd_6_mac = "N/A";//Dhcpd_Entry6 MAC
var dhcpd_7_ip = "N/A";//Dhcpd_Entry7 IP
var dhcpd_7_mac = "N/A";//Dhcpd_Entry7 MAC
var dhcpLease_0_hostName = "N/A";//DhcpLease_Entry0 HostName
var dhcpLease_0_ip = "N/A";//DhcpLease_Entry0 IP
var dhcpLease_0_mac = "N/A";//DhcpLease_Entry0 MAC
var dhcpLease_0_expireDay = "N/A";//DhcpLease_Entry0 ExpireDay
var dhcpLease_0_expireTime = "N/A";//DhcpLease_Entry0 ExpireTime
var dhcpLease_1_hostName = "N/A";//DhcpLease_Entry1 HostName
var dhcpLease_1_ip = "N/A";//DhcpLease_Entry1 IP
var dhcpLease_1_mac = "N/A";//DhcpLease_Entry1 MAC
var dhcpLease_1_expireDay = "N/A";//DhcpLease_Entry1 ExpireDay
var dhcpLease_1_expireTime = "N/A";//DhcpLease_Entry1 ExpireTime
var dhcpLease_2_hostName = "N/A";//DhcpLease_Entry2 HostName
var dhcpLease_2_ip = "N/A";//DhcpLease_Entry2 IP
var dhcpLease_2_mac = "N/A";//DhcpLease_Entry2 MAC
var dhcpLease_2_expireDay = "N/A";//DhcpLease_Entry2 ExpireDay
var dhcpLease_2_expireTime = "N/A";//DhcpLease_Entry2 ExpireTime
var dhcpLease_3_hostName = "N/A";//DhcpLease_Entry3 HostName
var dhcpLease_3_ip = "N/A";//DhcpLease_Entry3 IP
var dhcpLease_3_mac = "N/A";//DhcpLease_Entry3 MAC
var dhcpLease_3_expireDay = "N/A";//DhcpLease_Entry3 ExpireDay
var dhcpLease_3_expireTime = "N/A";//DhcpLease_Entry3 ExpireTime
var dhcpLease_4_hostName = "N/A";//DhcpLease_Entry4 HostName
var dhcpLease_4_ip = "N/A";//DhcpLease_Entry4 IP
var dhcpLease_4_mac = "N/A";//DhcpLease_Entry4 MAC
var dhcpLease_4_expireDay = "N/A";//DhcpLease_Entry4 ExpireDay
var dhcpLease_4_expireTime = "N/A";//DhcpLease_Entry4 ExpireTime
var dhcpLease_5_hostName = "N/A";//DhcpLease_Entry5 HostName
var dhcpLease_5_ip = "N/A";//DhcpLease_Entry5 IP
var dhcpLease_5_mac = "N/A";//DhcpLease_Entry5 MAC
var dhcpLease_5_expireDay = "N/A";//DhcpLease_Entry5 ExpireDay
var dhcpLease_5_expireTime = "N/A";//DhcpLease_Entry5 ExpireTime
var dhcpLease_6_hostName = "N/A";//DhcpLease_Entry6 HostName
var dhcpLease_6_ip = "N/A";//DhcpLease_Entry6 IP
var dhcpLease_6_mac = "N/A";//DhcpLease_Entry6 MAC
var dhcpLease_6_expireDay = "N/A";//DhcpLease_Entry6 ExpireDay
var dhcpLease_6_expireTime = "N/A";//DhcpLease_Entry6 ExpireTime
var dhcpLease_7_hostName = "N/A";//DhcpLease_Entry7 HostName
var dhcpLease_7_ip = "N/A";//DhcpLease_Entry7 IP
var dhcpLease_7_mac = "N/A";//DhcpLease_Entry7 MAC
var dhcpLease_7_expireDay = "N/A";//DhcpLease_Entry7 ExpireDay
var dhcpLease_7_expireTime = "N/A";//DhcpLease_Entry7 ExpireTime
var dhcpLease_8_hostName = "N/A";//DhcpLease_Entry8 HostName
var dhcpLease_8_ip = "N/A";//DhcpLease_Entry8 IP
var dhcpLease_8_mac = "N/A";//DhcpLease_Entry8 MAC
var dhcpLease_8_expireDay = "N/A";//DhcpLease_Entry8 ExpireDay
var dhcpLease_8_expireTime = "N/A";//DhcpLease_Entry8 ExpireTime
var dhcpLease_9_hostName = "N/A";//DhcpLease_Entry9 HostName
var dhcpLease_9_ip = "N/A";//DhcpLease_Entry9 IP
var dhcpLease_9_mac = "N/A";//DhcpLease_Entry9 MAC
var dhcpLease_9_expireDay = "N/A";//DhcpLease_Entry9 ExpireDay
var dhcpLease_9_expireTime = "N/A";//DhcpLease_Entry9 ExpireTime
var dhcpRelay_serverIp = "";//DhcpRelay_Entry Server
var lan_ip6 = "fe80::11";//Lan_Entry IP6
var lan_ipv6Prefix = "32";//Lan_Entry PREFIX6
var radvd_enable = "1";//Radvd_Entry Enable
var radvd_mode = "0";//Radvd_Entry Mode
var radvd_prefixIpv6 = "3ffe:501:ffff:100::";//Radvd_Entry PrefixIPv6
var radvd_prefixv6Len = "64";//Radvd_Entry Prefixv6Len
var radvd_preferredLifetime = "3600";//Radvd_Entry PreferredLifetime
var radvd_validLifetime = "7200";//Radvd_Entry ValidLifetime
var radvd_managedEnable = "0";//Radvd_Entry ManagedEnable
var radvd_otherEnable = "1";//Radvd_Entry OtherEnable
var dhcp6s_enableFlag = "0";//Dhcp6s_Entry Enable
var dhcp6s_pdFlag = "N/A";//Dhcp6s_Entry PDvar
var dhcp6s_mode = "0";//Dhcp6s_Entry Mode
var prefixIPv6_v6 = "N/A";//Dhcp6s_Entry PrefixIPv6
var prefixv6Len_v6 = "N/A";//Dhcp6s_Entry Prefixv6Len
var preferredLifetime_v6 = "N/A";//Dhcp6s_Entry PreferredLifetime
var validLifetime_v6 = "N/A";//Dhcp6s_Entry ValidLifetime
var dnsServer_v6 = "N/A";//Dhcp6s_Entry DNSserver
var secDnsServer_v6 = "N/A";//Dhcp6s_Entry SecDNSserver
var wlan_isExist = "On";//Info_WLan isExist
var wlan_bssidnum = "8";//WLan_Common BssidNum
var wlan_isExist_5g = "On";//Info_WLan11ac isExist
var wlan_bssidnum_5g = "8";//WLan11ac_Common BssidNum
*/
//////
function showSpin(){
	var opts = {
		lines: 8, // The number of lines to draw
		length: 0, // The length of each line
		width: 6, // The line thickness
		radius: 7, // The radius of the inner circle
		scale: 1, // Scales overall size of the spinner
		corners: 1, // Corner roundness (0..1)
		color: '#999999', // CSS color or array of colors
		fadeColor: '#transparent', // CSS color or array of colors
		speed: 1.1, // Rounds per second
		rotate: 0, // The rotation offset
		animation: 'spinner-line-fade-quick', // The CSS animation name for the lines
		direction: 1, // 1: clockwise, -1: counterclockwise
		zIndex: 2e9, // The z-index (defaults to 2000000000)
		className: 'spinner', // The CSS class to assign to the spinner
		top: '50%', // Top position relative to parent
		left: '50%', // Left position relative to parent
		shadow:false, // Box-shadow for the lines
		position: 'absolute' // Element positioning
	};

	var target = document.getElementById('firstDiv');
	var spinner = new Spinner(opts).spin(target);
}

function removeCookie()
{
	var mydate = new Date();
	mydate.setTime(mydate.getTime() - 1);
	document.cookie = "uid=del;path=/; expires=" + mydate.toGMTString(); 
	document.cookie = "psw=del;path=/; expires=" + mydate.toGMTString(); 
}

function showTable(id,header,data,keyIndex){
	var html = ["<table id=client_list width=580 border=1 cellpadding=1 cellspacing=0  bordercolor=#CCCCCC bgcolor=#FFFFFF>"];
	//1.generate table header
	html.push("<tr>");
	for(var i =0; i<header.length; i++){
		html.push("<td width=" + header[i][0] + " align=center class=tabdata>" +"<STRONG><FONT color=#000000>"+ header[i][1] +"</font></strong>"+ "</td>");
	}
	html.push("</tr>");
	//2.generate table data
	for(var i =0; i<data.length; i++){
		if(data[i][keyIndex] != "N/A"){
			html.push("<tr>");
			for(var j=0; j<data[i].length; j++){
				html.push("<td align=center class=tabdata>" + data[i][j] + "</td>");
			}
			html.push("</tr>");
		}
	}
	html.push("</table>");
	if(parseInt(document.uiViewLanForm.LeaseNum.value)>10)
	{
		html.push("<input type=button name=MORE  value=More... onClick=javascript:window.open(\"/cgi-bin/more_client_list.asp\")>")
	}
	document.getElementById(id).innerHTML = html.join('');
}

function doDelete(i)
{
	document.uiViewLanForm.delnum.value=i;
	document.uiViewLanForm.del_reservation_flag.value=1;
	document.uiViewLanForm.submit();
}

function checkPhysicalPort(){

	if(document.forms[0].DHCPPhyPortEth0.checked)
		document.forms[0].DHCPPhyPortEth0.value = "Yes";
	else
		document.forms[0].DHCPPhyPortEth0.value = "No";
		
	if(document.forms[0].DHCP1PortsFlag.value != "Yes" && document.forms[0].DHCPZY1PortsFlag.value != "Yes")
		if(document.forms[0].DHCPPhyPortEth1.checked)
			document.forms[0].DHCPPhyPortEth1.value = "Yes";
		else
			document.forms[0].DHCPPhyPortEth1.value = "No";
		
	if(document.forms[0].DHCP2PortsFlag.value != "Yes" 
			&& document.forms[0].DHCP1PortsFlag.value != "Yes" 
			&& document.forms[0].DHCPZY1PortsFlag.value != "Yes") 
	{
		if(document.forms[0].DHCPPhyPortEth2.checked)
			document.forms[0].DHCPPhyPortEth2.value = "Yes";
		else
			document.forms[0].DHCPPhyPortEth2.value = "No";
			
		if(document.forms[0].DHCPPhyPortEth3.checked)
			document.forms[0].DHCPPhyPortEth3.value = "Yes";
		else
			document.forms[0].DHCPPhyPortEth3.value = "No";
	}

	if(document.forms[0].wlanISExist.value == "On") {
		if(document.forms[0].DHCPMBSSIDNumberFlag.value == "1") {
			if(document.forms[0].DHCPPhyPortRa0.checked)
				document.forms[0].DHCPPhyPortRa0.value = "Yes";
			else
				document.forms[0].DHCPPhyPortRa0.value = "No";
		}
		if(document.forms[0].DHCPMBSSIDNumberFlag.value == "2"){
			if(document.forms[0].DHCPPhyPortWLANMssid0.checked)
				document.forms[0].DHCPPhyPortWLANMssid0.value = "Yes"
			else
				document.forms[0].DHCPPhyPortWLANMssid0.value = "No"
			if(document.forms[0].DHCPPhyPortWLANMssid1.checked)
				document.forms[0].DHCPPhyPortWLANMssid1.value = "Yes"
			else
				document.forms[0].DHCPPhyPortWLANMssid1.value = "No"
		}
		if(document.forms[0].DHCPMBSSIDNumberFlag.value == "3"){
			if(document.forms[0].DHCPPhyPortWLANMssid0.checked){
				document.forms[0].DHCPPhyPortWLANMssid0.value = "Yes"
			}
			else
				document.forms[0].DHCPPhyPortWLANMssid0.value = "No"
			if(document.forms[0].DHCPPhyPortWLANMssid1.checked)
				document.forms[0].DHCPPhyPortWLANMssid1.value = "Yes"
			else
				document.forms[0].DHCPPhyPortWLANMssid1.value = "No"
			if(document.forms[0].DHCPPhyPortWLANMssid2.checked)
				document.forms[0].DHCPPhyPortWLANMssid2.value = "Yes"
			else
				document.forms[0].DHCPPhyPortWLANMssid2.value = "No"
		}
		if(document.forms[0].DHCPMBSSIDNumberFlag.value == "4"){
			if(document.forms[0].DHCPPhyPortWLANMssid0.checked){
				document.forms[0].DHCPPhyPortWLANMssid0.value = "Yes"
			}
			else
				document.forms[0].DHCPPhyPortWLANMssid0.value = "No"
			if(document.forms[0].DHCPPhyPortWLANMssid1.checked)
				document.forms[0].DHCPPhyPortWLANMssid1.value = "Yes"
			else
				document.forms[0].DHCPPhyPortWLANMssid1.value = "No"
			if(document.forms[0].DHCPPhyPortWLANMssid2.checked)
				document.forms[0].DHCPPhyPortWLANMssid2.value = "Yes"
			else
				document.forms[0].DHCPPhyPortWLANMssid2.value = "No"
			if(document.forms[0].DHCPPhyPortWLANMssid3.checked)
				document.forms[0].DHCPPhyPortWLANMssid3.value = "Yes"
			else
				document.forms[0].DHCPPhyPortWLANMssid3.value = "No"
		}
	}
	if (document.forms[0].wlan11acISExist.value == "On") {
		if (document.forms[0].DHCPMBSSID11acNumberFlag.value == "1") {
			if(document.forms[0].DHCPPhyPortRai0.checked)
				document.forms[0].DHCPPhyPortRai0.value = "Yes";
			else
				document.forms[0].DHCPPhyPortRai0.value = "No";
		}
		if(document.forms[0].DHCPMBSSID11acNumberFlag.value == "2"){
			if(document.forms[0].DHCPPhyPortWLAN11acMssid0.checked)
				document.forms[0].DHCPPhyPortWLAN11acMssid0.value = "Yes"
			else
				document.forms[0].DHCPPhyPortWLAN11acMssid0.value = "No"
			if(document.forms[0].DHCPPhyPortWLAN11acMssid1.checked)
				document.forms[0].DHCPPhyPortWLAN11acMssid1.value = "Yes"
			else
				document.forms[0].DHCPPhyPortWLAN11acMssid1.value = "No"
		}
		if(document.forms[0].DHCPMBSSID11acNumberFlag.value == "3"){
			if(document.forms[0].DHCPPhyPortWLAN11acMssid0.checked){
				document.forms[0].DHCPPhyPortWLAN11acMssid0.value = "Yes"
			}
			else
				document.forms[0].DHCPPhyPortWLAN11acMssid0.value = "No"
			if(document.forms[0].DHCPPhyPortWLAN11acMssid1.checked)
				document.forms[0].DHCPPhyPortWLAN11acMssid1.value = "Yes"
			else
				document.forms[0].DHCPPhyPortWLAN11acMssid1.value = "No"
			if(document.forms[0].DHCPPhyPortWLAN11acMssid2.checked)
				document.forms[0].DHCPPhyPortWLAN11acMssid2.value = "Yes"
			else
				document.forms[0].DHCPPhyPortWLAN11acMssid2.value = "No"
		}
		if(document.forms[0].DHCPMBSSID11acNumberFlag.value == "4"){
			if(document.forms[0].DHCPPhyPortWLAN11acMssid0.checked){
				document.forms[0].DHCPPhyPortWLAN11acMssid0.value = "Yes"
			}
			else
				document.forms[0].DHCPPhyPortWLAN11acMssid0.value = "No"
			if(document.forms[0].DHCPPhyPortWLAN11acMssid1.checked)
				document.forms[0].DHCPPhyPortWLAN11acMssid1.value = "Yes"
			else
				document.forms[0].DHCPPhyPortWLAN11acMssid1.value = "No"
			if(document.forms[0].DHCPPhyPortWLAN11acMssid2.checked)
				document.forms[0].DHCPPhyPortWLAN11acMssid2.value = "Yes"
			else
				document.forms[0].DHCPPhyPortWLAN11acMssid2.value = "No"
			if(document.forms[0].DHCPPhyPortWLAN11acMssid3.checked)
				document.forms[0].DHCPPhyPortWLAN11acMssid3.value = "Yes"
			else
				document.forms[0].DHCPPhyPortWLAN11acMssid3.value = "No"
		}
	}
}

function StringCheck(val)
{
	re = /^[^\s]+$/;
	if( re.test(val) )
		return true;
	else
		return false;
}

function doCheckmacAddr(){
	var macstr = document.uiViewLanForm.MACAddr.value;
	var maclen = macstr.length;
	var tmp = macstr.toUpperCase();
	document.uiViewLanForm.MACAddr.value = tmp;
	if(maclen != 0){
		var findpos = macstr.search("^([0-9A-Fa-f]{2})(:[0-9A-Fa-f]{2}){5}$");
		if( findpos != 0 )
		{
			alert("Invalid MAC address:" + macstr);
		}
		return findpos;
	}
	return 0;
}

function doUserModeUiMgmtIpValidate()
{
	var value;
	var value_temp;

	value = document.uiViewLanForm.uiViewIPAddr.value;
	value_temp = document.uiViewLanForm.uiViewNetMask.value;
	if(inValidNetAddr(value,value_temp))
		return false;

	value = document.uiViewLanForm.isIPv6Supported.value;
	if(value == 1){
		//check if IPv6 address/prefix field is not inputed
		if(document.uiViewLanForm.uiViewIPv6Addr.value != "" || document.uiViewLanForm.uiViewIPv6Prefix.value != ""){
			//check IPv6 Address format
			value = document.uiViewLanForm.uiViewIPv6Addr.value;
			if(inValidIPv6Addr(value))
				return false;
			if(false == isGlobalIpv6Address(value)){
				alert('Invalid IPv6 GlobalAddress:' + value);
				return false;
			}

			//check IPv6 Prefix format
			value = document.uiViewLanForm.uiViewIPv6Prefix.value;
			if(inValidIPv6Prefix(value))
				return false;
		}
	}

	if("Yes" == document.uiViewLanForm.aliasFlag.value)
	{
		var mask = document.uiViewLanForm.uiViewNetMask.value.match("^[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}$");
		var digits2 = mask[0].split(".");
		var lanip = document.uiViewLanForm.uiViewIPAddr.value.match("^[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}$");
		var digits3 = lanip[0].split(".");
		
		value = document.uiViewLanForm.uiViewAliasIPAddr.value;
		value_temp = document.uiViewLanForm.uiViewAliasNetMask.value;
		if(inValidNetAddr(value,value_temp))
			return false;
		var mask = document.uiViewLanForm.uiViewAliasNetMask.value.match("^[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}$");
		var digits4 = mask[0].split(".");
		var lanip = document.uiViewLanForm.uiViewAliasIPAddr.value.match("^[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}$");
		var digits5 = lanip[0].split(".");
			
		if(document.uiViewLanForm.uiViewIPAddr.value == document.uiViewLanForm.uiViewAliasIPAddr.value)
		{
			alert("Alias ip duplicate to Main ip!" );
			return false;
		}
		
		for(i=0;i<4;i++)
		{
			if((digits3[i] & digits2[i])!= (digits5[i] & digits2[i]))
				break;
		}
		if(i==4)
		{
			alert("Alias IP is not allowed to be in the main ip subnet!");
			return false;
		}
		
		for(i=0;i<4;i++)
		{
			if((digits3[i] & digits4[i])!= (digits5[i] & digits4[i]))
				break;
		}
		if(i==4)
		{
			alert("Main IP is not allowed to be in the alias ip subnet!");
			return false;
		}
	}
}

function doAdminUiMgmtIpValidate()
{
	var value;

	if(document.uiViewLanForm.dhcpTypeRadio[1].checked)	
	{
		value = document.uiViewLanForm.StartIp.value;
		if(inValidIPAddr(value))
		return false;
		if("Yes" == document.uiViewLanForm.aliasFlag.value)
		{
			if(!doPoolRangeAlias())
				return false;
	}
	else
	{
		if(!doPoolRange())
			return false;
	}

	/* set physical port value */
	if ("Yes" == document.uiViewLanForm.DHCPFilterFlag.value)
		checkPhysicalPort();

	if("Yes" == document.uiViewLanForm.option60Flag.value)
	{
		value = document.uiViewLanForm.ConPoolStartIp.value;
		if(inValidIPAddr(value))
			return false;

		value = document.uiViewLanForm.ConPoolPoolSize.value;
		if(value.match("[^0-9]") != null) {
			alert("IP Conditional Pool Count needs to be an positive integer");
				return false;
		}

		if(!doConditionalPoolRange())
			return false;
	}

	if(document.uiViewLanForm.dnsTypeRadio[1].checked)
	{  
		value = document.uiViewLanForm.PrimaryDns.value;
		if(inValidIPAddr(value))
			return false;

		value = document.uiViewLanForm.SecondDns.value;
		if(value!="" && inValidIPAddr(value))
			return false;
	}
	if(doValidateServer())
		return false;

	if(StringCheck(document.uiViewLanForm.IpAddr.value) || StringCheck(document.uiViewLanForm.MACAddr.value))
		{
			/*if(document.uiViewLanForm.emptyEntry.value == "N/A")
			{
				alert("DHCP reservation table is full!" );
				return false;
			}*/
			value = document.uiViewLanForm.IpAddr.value;
			if(inValidIPAddr(value))
				return false;

			if(doCheckmacAddr())
				return false;

			if(!doStaticTableRange())
				return false;

			document.uiViewLanForm.addFlag.value = "1";
		}
		if(document.uiViewLanForm.staticNum.value != "0"){
			if(document.uiViewLanForm.tmpStartIp.value != document.uiViewLanForm.StartIp.value)
			{
				if(confirm("Change Start Ip may lead to reservation item be deleted!\nContinue?") == false)
					return false;
			}
			if(document.uiViewLanForm.tmpPoolCount.value != document.uiViewLanForm.PoolSize.value)
			{
				if(confirm("Change Ip pool count may lead to reservation item be deleted!\nContinue?") == false)
					return false;
			}
		}

	}
	if(document.uiViewLanForm.dhcpTypeRadio[2].checked)
	{
		value = document.uiViewLanForm.ServerIp.value;
		if(inValidIPAddr(value))
			return false;
	}
}

function uiMgmtIpDoValidate() {
	if(doUserModeUiMgmtIpValidate()==false)
		return false;

	if(document.uiViewLanForm.userMode.value != 1)
	{
		if(doAdminUiMgmtIpValidate()==false)
			return false;
	}

	return true;
}

function reloadAdminAction()
{
	if(!dhcpRelayCheck()){
		return false;
	}

	onloadCheck();

	if(document.uiViewLanForm.dhcpTypeRadio[0].checked)
	{
		document.getElementById("dhcp_enabled_div0").style.display="none";
		document.getElementById("dhcp_relay_div").style.display="none";
	}
	else if(document.uiViewLanForm.dhcpTypeRadio[1].checked)
	{
		document.getElementById("dhcp_enabled_div0").style.display="";
		document.getElementById("dhcp_relay_div").style.display="none";
	}
	else if(document.uiViewLanForm.dhcpTypeRadio[2].checked)
	{
		document.getElementById("dhcp_enabled_div0").style.display="none";
		document.getElementById("dhcp_relay_div").style.display="";
	}
	else
	;
	return;
}

function reloadUsermodeAction()
{
	return;
}

function doReload() {
	reloadUsermodeAction();
	if(document.uiViewLanForm.userMode.value !=1){
		reloadAdminAction();
	}
	return;
}

function doUserModeDispaly()
{
	return;
}

function doAdminDispaly()
{
	if(lan_dhcp_type == "0")
	{
		document.getElementById("dhcp_enabled_div0").style.display="none";
		document.getElementById("dhcp_relay_div").style.display="none";
		
	}
	else if(lan_dhcp_type == "1")
	{
		document.getElementById("dhcp_enabled_div0").style.display="";
		document.getElementById("dhcp_relay_div").style.display="none";
		
	}
	else if(lan_dhcp_type == "2")
	{
		document.getElementById("dhcp_enabled_div0").style.display="none";
		document.getElementById("dhcp_relay_div").style.display="";
		
	}

	return;
}

function doDisplay() {
	doUserModeDispaly();
	if(document.forms[0].userMode.value != 1)
	{
		doAdminDispaly();
	}
	return;
}

function doValidateRange(startIP,endIP) {
	var staddress;
	var edaddress;
	var cnt;

	staddress=startIP.split(".");
	edaddress=endIP.split(".");
	for(cnt=0; cnt < 4; cnt++) {
		if(Number(edaddress[cnt])<Number(staddress[cnt])) {
			alert("End IP address is less than Start IP address");
			return false;
		}
	}
	return true;
}

function doValidateServer() {
	var Element;
	var ElementValue;

	Element = document.uiViewLanForm.PoolSize;
	ElementValue = Element.value;
	if(ElementValue.match("[^0-9]") != null) {
		alert("IP Pool Count needs to be an positive integer");
		return true;
	}
	Element = document.uiViewLanForm.dhcp_LeaseTime;
	ElementValue = Element.value;
	if(ElementValue.match("[^0-9]") != null) {
		alert("Lease Time needs to be an positive integer");
		return true;
	}
	if(!StringCheck(ElementValue))
	{
		alert("Empty Lease Time!!");
		return true;
	}
	if(ElementValue < 120 && ElementValue != 0)
	{
		alert("Lease Time needs to be no less than 120");
		return true;
	}
	if(!parseInt(ElementValue))
		document.uiViewLanForm.dhcp_LeaseTime.value = 259200;
	Element = document.uiViewLanForm.StartIp;
	ElementValue = Element.value;
	if(inValidIPAddr(Element.value)) return true;
	if(doValidateRange(ElementValue,Element.value)!=true) return true;
	return false;
}

function poolcheck(st,pool,value,Mvalue){
	if( (pool > 254) || (st+pool) > ((Mvalue & st) + value - 1))
	{
		//mtk04880: for resolving bug 12324 : showing alert twice
		//alert("DHCP IP Pool Range exceed limit!!");
		return false;
	}
	else
	{
		return true;
	}
}

function ip_poolcheck(st,pool,Mvalue,rouip,aMvalue,aip){
	var digits1 = st[0].split(".");
	var stIP = parseInt(digits1[0]<<24|digits1[1]<<16|digits1[2]<<8|digits1[3]);
	var digits2 = Mvalue[0].split(".");
	var maskvalue = parseInt(digits2[0]<<24|digits2[1]<<16|digits2[2]<<8|digits2[3]);
	var digits3 = rouip[0].split(".");
	var lanipvalue = parseInt(digits3[0]<<24|digits3[1]<<16|digits3[2]<<8|digits3[3]);
	var digits4 = aMvalue[0].split(".");
	var amaskvalue = parseInt(digits4[0]<<24|digits4[1]<<16|digits4[2]<<8|digits4[3]);
	var digits5 = aip[0].split(".");
	var aipvalue = parseInt(digits5[0]<<24|digits5[1]<<16|digits5[2]<<8|digits5[3]);
	var tmpipvalue = 1;
	var tmpmaskvalue = 1;

	if((lanipvalue&maskvalue)==(stIP&maskvalue)){
		tmpipvalue = lanipvalue;
		tmpmaskvalue = maskvalue;
	}else if((aipvalue&amaskvalue)==(stIP&amaskvalue)){
		tmpipvalue = aipvalue;
		tmpmaskvalue = amaskvalue;
	}else
		return false;

	if(((tmpipvalue&(~tmpmaskvalue))>=(stIP&(~tmpmaskvalue))) && ((tmpipvalue&(~tmpmaskvalue))<((stIP&(~tmpmaskvalue))+pool)))
	{
		return false;
	}else
	{
		return true;
	}
}

function checkPoolOverlap(startIP1, num1, startIP2, num2)
{
	var digits1 = startIP1[0].split(".");
	var digits2 = startIP2[0].split(".");
	for(i=0;i<4;i++)
	{
		if(parseInt(digits1[i]) < parseInt(digits2[i]))
		{
			if(parseInt(digits1[3])+num1-1 >= parseInt(digits2[3]))
				return true;
			else
				return false;
		}
		if(parseInt(digits1[i]) > parseInt(digits2[i]))
		{
			if(parseInt(digits2[3])+num2-1 >= parseInt(digits1[3]))
				return true;
			else
				return false;
		}
	}
	return true;
}

function doStaticTableRange()
{
	var sIP = document.uiViewLanForm.StartIp.value.match("^[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}$");
	var digits = sIP[0].split(".");
	var num = document.uiViewLanForm.PoolSize.value.match("^[0-9]{1,3}$");
	var mask = document.uiViewLanForm.uiViewNetMask.value.match("^[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}$");
	var digits2 = mask[0].split(".");
	var staticIP = document.uiViewLanForm.IpAddr.value.match("^[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}$");
	var staticdigits = staticIP[0].split(".");
	var stIP = parseInt(digits[3]);
	var Pool_num = parseInt(num);
	var staticIP = parseInt(staticdigits[3]);
	var isIpValid = 1;
	var total = parseInt(document.uiViewLanForm.staticNum.value);
	var leaseTotal = parseInt(document.uiViewLanForm.LeaseNum.value);

	for(i=0;i<4;i++)
	{
		if((digits2[i] & digits[i]) != (digits2[i] & staticdigits[i])){
			isIpValid = 0;
			break;
		}
	}
	if("Yes" == document.uiViewLanForm.aliasFlag.value){
		var mask = document.uiViewLanForm.uiViewAliasNetMask.value.match("^[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}$");
		var digits3= mask[0].split(".");
		if(isIpValid == 0){
		for(i=0;i<4;i++)
		{
			if((digits3[i] & digits[i]) != (digits3[i] & staticdigits[i])){
				isIpValid = 0;
				break;
			}
		}
		}
	}
	if(isIpValid == 0){
		alert("DHCP Start IP and DHCP Static IP are not in the same subnet");
		return false;
	}

	if( staticIP <  stIP || staticIP >= stIP+Pool_num)
	{
		alert("DHCP Static IP is out of DHCP pool range!");
		return false;
	}
	
	if(total>=32)
	{
		alert("DHCP reservation table is full!" );
		return false;
	}
	var table=document.getElementById("static_list");
	for(j=1; j<=total; j++)
	{
		var str1 = table.rows[j].cells[1].innerHTML.replace(" ","");
		var str2 = table.rows[j].cells[2].innerHTML.replace(" ","");
		if( str1 == document.uiViewLanForm.IpAddr.value)
		{
			alert("DHCP Static IP has existed in the list!");
			return false;
		}
		if(str2 == document.uiViewLanForm.MACAddr.value)
		{
			alert("DHCP Static MAC address has existed in the list!");
			return false;
		}
	}

	return true;
}

function doPoolRange()
{
	var sIP = document.uiViewLanForm.StartIp.value.match("^[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}$");
	var digits = sIP[0].split(".");
	var num = document.uiViewLanForm.PoolSize.value.match("^[0-9]{1,3}$");
	var mask = document.uiViewLanForm.uiViewNetMask.value.match("^[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}$");
	var digits2 = mask[0].split(".");
	var lanip = document.uiViewLanForm.uiViewIPAddr.value.match("^[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}$");
	var digits3 = lanip[0].split(".");
	var amask = document.uiViewLanForm.uiViewAliasNetMask.value.match("^[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}$");
	var aip = document.uiViewLanForm.uiViewAliasIPAddr.value.match("^[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}$");
	var stIP = parseInt(digits[3]);
	var Pool_num = parseInt(num);
	var Mask = parseInt(digits2[3]);

	if(!StringCheck(document.uiViewLanForm.PoolSize.value))
	{
		alert("Empty IP Pool Count!!");
		return false;
	}
	if(document.uiViewLanForm.uiViewIPAddr.value == document.uiViewLanForm.StartIp.value)
	{
		alert("DHCP Start IP and Router Local IP are not allowed to be the same");
		return false;
	}

	for(i=0;i<4;i++)
	{
	if((digits2[i] & digits3[i]) != (digits2[i] & digits[i]))
		{
			alert("DHCP Start IP and Router Local IP are not in the same subnet");
			return false;
		}
	}

	if( (digits2[0]== 255) && (digits2[1] == 255) && (digits2[2] == 255) )
	{
		for( n=0; n<7; n++ )
		{
			k = (256 >> n) ;
			if((256 - k) == digits2[3])
			{
				if( !poolcheck(stIP,Pool_num,k,Mask) ){
					//mtk04880: for resolving bug 12324 : showing alert twice
					alert("DHCP IP Pool Range exceed limit!!");
					return false;
				}
			}
		}
	}
	else
	{
		if(Pool_num > 254)
		{
			alert("DHCP IP Pool Range exceed limit!!");
			return false;
		}
	}
	if( !ip_poolcheck(sIP,Pool_num,mask,lanip,amask,aip) ){
		//alert("DHCP IP Pool can not contain Router Local IP!!");
		alert("DHCP IP Pool can not contain Router Local IP!!"); 
		return false;
	}
	return true;
}

function doPoolRangeAlias()
{
	var sIP = document.uiViewLanForm.StartIp.value.match("^[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}$");
	var digits = sIP[0].split(".");
	var num = document.uiViewLanForm.PoolSize.value.match("^[0-9]{1,3}$");

	var mask_local = document.uiViewLanForm.uiViewNetMask.value.match("^[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}$");
	var digits2 = mask_local[0].split(".");
	var lanip_local = document.uiViewLanForm.uiViewIPAddr.value.match("^[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}$");
	var digits3 = lanip_local[0].split(".");

	var mask = document.uiViewLanForm.uiViewAliasNetMask.value.match("^[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}$");
	var digits4 = mask[0].split(".");
	var lanip = document.uiViewLanForm.uiViewAliasIPAddr.value.match("^[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}$");
	var digits5 = lanip[0].split(".");
	var MaskAlias = parseInt(digits4[3]);
	var validMainFlag = 1;
	var validAliasFlag = 1;
	var validDhcpMainFlag = 1;
	var validDhcpAliasFlag = 1;

	var stIP = parseInt(digits[3]);
	var Pool_num = parseInt(num);
	var Mask = parseInt(digits2[3]);

	if(!StringCheck(document.uiViewLanForm.PoolSize.value))
	{
		alert("Empty IP Pool Count!!");
		return false;
	}
	if(document.uiViewLanForm.uiViewIPAddr.value == document.uiViewLanForm.StartIp.value)
	{
		alert("DHCP Start IP and Router Local Main IP are not allowed to be the same");
		return false;
	}
	if(document.uiViewLanForm.uiViewAliasIPAddr.value == document.uiViewLanForm.StartIp.value)
	{
		alert("DHCP Start IP and Router Local Alias IP are not allowed to be the same");
		return false;
	}

	for(i=0;i<4;i++)
	{
	if((digits2[i] & digits3[i]) != (digits2[i] & digits[i]))
		{
			validMainFlag = 0;
			break;
			//alert("DHCP Start IP and Router Local IP are not in the same subnet");
			//return false;
		}
	}
	for(i=0;i<4;i++)
	{
		if((digits4[i] & digits5[i]) != (digits4[i] & digits[i]))
		{
			validAliasFlag = 0;
			break;
			//alert("DHCP Start IP and Router Local Alias IP are not in the same subnet");
			//return false;
		}
	}

	if((validMainFlag == 0) && (validAliasFlag == 0))
	{
		alert("DHCP Start IP should be in the same subnet with main ip or alias ip!");
		return false;
	}
	if(Pool_num > 254)
	{
		alert("DHCP IP Pool Range exceed limit!!");
		return false;
	}
	if(validMainFlag == 1)
	{
		if( (digits2[0]== 255) && (digits2[1] == 255) && (digits2[2] == 255) )
		{
			for( n=0; n<7; n++ )
				{
					k = (256 >> n) ;
					if((256 - k) == digits2[3])
					{
						if( !poolcheck(stIP,Pool_num,k,Mask) )
						{   
							validDhcpMainFlag = 0;
							break;
						}
					}
				}
		}
	}

	if(validAliasFlag == 1)
	{
		if( (digits4[0]== 255) && (digits4[1] == 255) && (digits4[2] == 255) )
		{
			for( n=0; n<7; n++ )
				{
					k = (256 >> n) ;
					if((256 - k) == digits4[3])
					{
						if( !poolcheck(stIP,Pool_num,k,MaskAlias) )
						{
							validDhcpAliasFlag = 0;
							break;
						}
					}
				}
		}
	}

	if( ((validMainFlag == 1 && validAliasFlag == 1) && ((validDhcpMainFlag | validDhcpAliasFlag) == 0)) 
		|| (validMainFlag == 1 && validDhcpMainFlag == 0)
		|| (validAliasFlag == 1 && validDhcpAliasFlag == 0) )
	{
		alert("DHCP IP Pool Range exceed limit!!");
		return false;
	}
	if( !ip_poolcheck(sIP,Pool_num,mask_local,lanip_local,mask,lanip) ){
		//alert("DHCP IP Pool can not contain Router Local IP!!");
		alert("DHCP IP Pool can not contain Router Local IP!!");
		return false;
	}

	return true;
}

function doConditionalPoolRange()
{
	var sIP = document.uiViewLanForm.StartIp.value.match("^[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}$");
	var digits = sIP[0].split(".");
	var num = document.uiViewLanForm.PoolSize.value.match("^[0-9]{1,3}$");
	var mask = document.uiViewLanForm.uiViewNetMask.value.match("^[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}$");
	var digits2 = mask[0].split(".");
	var lanip = document.uiViewLanForm.uiViewIPAddr.value.match("^[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}$");
	var digits3 = lanip[0].split(".");
	var stIP = parseInt(digits[3]);
	var Pool_num = parseInt(num);
	var Mask = parseInt(digits2[3]);
	var validMainFlag = 1;
	var validAliasFlag = 1;
	var validDhcpMainFlag = 1;
	var validDhcpAliasFlag = 1;
	var conPoolStartIP = document.uiViewLanForm.ConPoolStartIp.value.match("^[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}$");
	var digits6 = conPoolStartIP[0].split(".");
	var conPoolNum = document.uiViewLanForm.ConPoolPoolSize.value.match("^[0-9]{1,3}$");
	var conPoolStartIPValue = parseInt(digits6[3]);
	var conPoolNumValue = parseInt(conPoolNum);

	if(document.uiViewLanForm.uiViewIPAddr.value == document.uiViewLanForm.ConPoolStartIp.value)
	{
		alert("DHCP Conditional Pool Start IP and Router Local Main IP are not allowed to be the same");
		return false;
	}

	for(i=0;i<4;i++)
	{
		if((digits2[i] & digits3[i]) != (digits2[i] & digits6[i]))
		{
			validMainFlag = 0;
			break;
			//alert("DHCP Start IP and Router Local IP are not in the same subnet");
			//return false;
		}
	}

	if("Yes" == document.uiViewLanForm.aliasFlag.value)
	{
		var mask = document.uiViewLanForm.uiViewAliasNetMask.value.match("^[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}$");
		var digits4 = mask[0].split(".");
		var lanip = document.uiViewLanForm.uiViewAliasIPAddr.value.match("^[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}$");
		var digits5 = lanip[0].split(".");
		var MaskAlias = parseInt(digits4[3]);

		if(document.uiViewLanForm.uiViewAliasIPAddr.value == document.uiViewLanForm.ConPoolStartIp.value)
		{
			alert("DHCP Conditional Pool Start IP and Router Local Alias IP are not allowed to be the same");
			return false;
		}
		for(i=0;i<4;i++)
		{
			if((digits4[i] & digits5[i]) != (digits4[i] & digits6[i]))
			{
				validAliasFlag = 0;
				break;
				//alert("DHCP Start IP and Router Local Alias IP are not in the same subnet");
				//return false;
			}
		}
		
	}

	if("Yes" == document.uiViewLanForm.aliasFlag.value)
	{
		if((validMainFlag == 0) && (validAliasFlag == 0))
		{
			alert("DHCP Conditional Pool Start IP should be in the same subnet with Router Local IP or Alias ip!");
			return false;
		}
	}
		else
	{
		if(validMainFlag == 0)
		{
			alert("DHCP Conditional Pool Start IP should be in the same subnet with Router Local IP!");
			return false;
		}
	}
 
	if(document.uiViewLanForm.StartIp.value == document.uiViewLanForm.ConPoolStartIp.value)
	{
		alert("DHCP Conditional Pool Start IP and DHCP Main Pool Start IP are not allowed to be the same"); 
		return false;
	}
	if(checkPoolOverlap(sIP, Pool_num, conPoolStartIP, conPoolNumValue) == true)
	{
		alert("DHCP Conditional Pool is Overlap with DHCP Main Pool!");
		return false;
	}
	if(conPoolNumValue > 254)
	{
		alert("DHCP Conditional Pool IP Range exceed limit!!");
		return false;
	}

	if(validMainFlag == 1)
	{
		if( (digits2[0]== 255) && (digits2[1] == 255) && (digits2[2] == 255) )
		{
			for( n=0; n<7; n++ )
				{
					k = (256 >> n) ;
					if((256 - k) == digits2[3])
					{
						if( !poolcheck(conPoolStartIPValue,conPoolNumValue,k,Mask) )
						{
							validDhcpMainFlag = 0;
							break;
					}
					}
				}
		}
	}
	if(validAliasFlag == 1)
	{
		if("Yes" == document.uiViewLanForm.aliasFlag.value)
		{
			if( (digits4[0]== 255) && (digits4[1] == 255) && (digits4[2] == 255) )
			{
				for( n=0; n<7; n++ )
					{
						k = (256 >> n) ;
						if((256 - k) == digits4[3])
						{
							if( !poolcheck(conPoolStartIPValue,conPoolNumValue,k,MaskAlias) )
							{
								validDhcpAliasFlag = 0;
								break;
							}
						}
				}
			}
		}
	}

	if( ((validMainFlag == 1 && validAliasFlag == 1) && ((validDhcpMainFlag | validDhcpAliasFlag) == 0)) 
	|| (validMainFlag == 1 && validDhcpMainFlag == 0)
	|| (validAliasFlag == 1 && validDhcpAliasFlag == 0) )
	{
		alert("DHCP Conditional Pool IP Range exceed limit!!");
		return false;
	}
	return true;
}

function inValidIPv6PrefixDHCP6S(Address) {
	var address1 = Address.match("^[0-9A-Fa-f]{1,4}:[0-9A-Fa-f]{1,4}:[0-9A-Fa-f]{1,4}:[0-9A-Fa-f]{1,4}::$"); 
	var address2 = Address.match("^[0-9A-Fa-f]{1,4}:[0-9A-Fa-f]{1,4}:[0-9A-Fa-f]{1,4}::$");
	var address3 = Address.match("^[0-9A-Fa-f]{1,4}:[0-9A-Fa-f]{1,4}::$"); 
	var address4 = Address.match("^[0-9A-Fa-f]{1,4}::$");

	if( (address1 != null) || (address2 != null) || (address3 != null) || (address4 != null) ) {
		return true;
	}
	alert("Invalid IPv6 Prefix"); 
	return false;
}

function doUserModeSave()
{
	var form = document.uiViewLanForm;
	if (!uiMgmtIpDoValidate())
		return false;
	if (form.isIPv6Supported.value == 1 )
	{
		if(!checkAllIPv6Options())
			return false;
	}
	return true;
}

function doAdminSave()
{
	var form = document.uiViewLanForm;
	if(!dhcpRelayCheck()){
		return false;
	}
	return true;
}

function isPrivateAddress(ip_addr_value)
{
	var ip_addr = new Array();
	ip_addr = ip_addr_value.split(".");
	if(Number(ip_addr[0])==10 &&
			Number(ip_addr[1])<=255 &&
			Number(ip_addr[2])<=255 &&
			Number(ip_addr[3])<=255 &&
			Number(ip_addr[1])>=0 &&
			Number(ip_addr[2])>=0 &&
			Number(ip_addr[3])>=0 ) {//10.0.0.0/8
		return true;
	} else if(Number(ip_addr[0])==172 && 
			Number(ip_addr[1])<=31 &&
			Number(ip_addr[2])<=255 &&
			Number(ip_addr[3])<=255 &&
			Number(ip_addr[1])>=16 &&
			Number(ip_addr[2])>=0 &&
			Number(ip_addr[3])>=0 ) {//172.16.0.0/12
		return true;
	} else if(Number(ip_addr[0])==192 && 
			Number(ip_addr[1])==168 &&
			Number(ip_addr[2])<=255 &&
			Number(ip_addr[3])<=255 &&
			Number(ip_addr[2])>=0 &&
			Number(ip_addr[3])>=0 ) {//192.168.0.0/16
		return true;
	} else{
		return false;
	}
}

function uiSave() {
	var form = document.uiViewLanForm;

	// Simulator: skip complex validation, just save the form
	form.uiViewAliasIPAddr.value = "0.0.0.0";
	form.uiViewAliasNetMask.value = "0.0.0.0";
	form.aliasFlag.value = "No";

	document.uiViewLanForm.save_flag.value = "1";
	document.uiViewLanForm.submit();
}

function checkAllIPv6Options( )
{
	var value;
	var form = document.uiViewLanForm;
	if(document.uiViewLanForm.uiViewIPv6Addr.value != "" || document.uiViewLanForm.uiViewIPv6Prefix.value != "")
	{
		//check IPv6 Address format	
		value = document.uiViewLanForm.uiViewIPv6Addr.value;
		if(inValidIPv6Addr(value))
			return false;

		if(false == isGlobalIpv6Address(value)){
			alert('Invalid IPv6 GlobalAddress:' + value);
			return false;
		}
		//check IPv6 Prefix format
		value = document.uiViewLanForm.uiViewIPv6Prefix.value;
		if(!inValidPrefixLen(value))
			return false;
	}

	if(form.radvdRadio[1].checked)
	{
		if( form.radvdModeFlag.value == 1)
		{
			if(! inValidIPv6PrefixDHCP6S(form.uiViewIPv6PrefixRadvd.value) )
				return false;
			if(!checkRadvdEnable( ) )
				return false;
		}		
	}
	if(form.dhcp6sEnableRadio[1].checked)
	{
		if(!checkDHCP6SMode())
			return false;
	}
	document.uiViewLanForm.radvdFlag.value = 0;
	document.uiViewLanForm.dhcp6sFlag.value = 0;
	return true;
}

function checkRadvdEnable( )
{
	form = document.uiViewLanForm;
	var ret;
	if(form.radvdRadio[1].checked)
	{
		ret = checkRadvdInput( );
	}
	
	return ret;
}

function checkRadvdInput( )
{
	form = document.uiViewLanForm;

	if(!inValidIPv6PrefixDHCP6S(form.uiViewIPv6PrefixRadvd.value) )
		return false;
	if(!inValidPrefixLen(form.uiViewIPv6PrefixLenRadvd.value) )
		return false;
	if(!invalidLifetimeValue(form.uiPreferredLifetimeRadvd.value) )
		return false;
	if(!invalidLifetimeValue(form.uiValidLifetimeRadvd.value) )
		return false;
		var preferredlifetime = parseInt(form.uiPreferredLifetimeRadvd.value);
		var validlifetime = parseInt(form.uiValidLifetimeRadvd.value);
		if((validlifetime) <= (preferredlifetime) )
		{
			alert("Validlifetime should be larger than Preferredlifetime!!");
			return false;
		}
	return true
}

function checkDHCP6SMode( )
{
	form = document.uiViewLanForm;
	if(form.dhcp6sModeFlag.value == 1)
	{
		if(!checkDHCP6SParam() )
			return false;
	}
	return true;
}

function checkDHCP6SParam()
{
	form = document.uiViewLanForm;
	if(!inValidIPv6PrefixDHCP6S(form.uiViewIPv6DHCPPrefix.value) )
		return false;
	if(!inValidPrefixLen(form.uiViewIPv6DHCPPrefixLen.value) )
		return false;
	if(!invalidLifetimeValue(form.uiPreferredLifetimeDHCP6.value) )
		return false;
	if(!invalidLifetimeValue(form.uiValidLifetimeDHCP6.value) )
		return false;
	var preferredlifetime = parseInt(form.uiPreferredLifetimeDHCP6.value);
	var validlifetime = parseInt(form.uiValidLifetimeDHCP6.value);
	if((validlifetime) <= (preferredlifetime) )
	{
		alert("Validlifetime should be larger than Preferredlifetime!!");
		return false;
	}
	if(inValidIPv6Addr(form.uiPrimaryDNSDHCP6.value) )
		return false;
	if(inValidIPv6Addr(form.uiSecondaryDNSDHCP6.value) )
		return false;

	return true;
}

function inValidPrefixLen(value1) {
	if(value1.match("[^0-9]") != null)  {
		alert("Radvd Prefix Length should not a number!!");
		return false;
	}
	var PrefixLen = parseInt(value1);
	if (value1=="") {
		alert("Radvd Prefix Length should not be empty!!");
		return false;
	}
	if ( (PrefixLen > 64) || (PrefixLen < 16) ) {
		alert("Radvd Prefix Length should be between 16 and 64!!");
		return false;
	}
	return true;
}

function invalidLifetimeValue(value1) {
	var form = document.uiViewLanForm;

	if(value1.match("[^0-9]") != null)  {
		alert("Life Time should not a number!!");
		return false;
	}
	var lifetime = parseInt(value1);
	if (value1 == "") {
		alert("Life Time value should not be empty!!");
		return false;
	}
	if((lifetime > 4294967295) || (lifetime < 300)){
		alert("Life Time value should be between 300 and 4294967295!!");
		return false;
	}
	return true;
}

function autoDNSRelay()
{
	document.uiViewLanForm.PrimaryDns.disabled = true;
	document.uiViewLanForm.SecondDns.disabled = true;
}

function manualDNSRelay()
{
	document.uiViewLanForm.PrimaryDns.disabled = false;
	document.uiViewLanForm.SecondDns.disabled = false;
}

function dhcpRelayCheckFail()
{
	document.uiViewLanForm.dhcpTypeRadio[2].disabled = true;
	document.uiViewLanForm.ServerIp.disabled = true;
}

function disableTheAliasIp()
{
	if(document.uiViewLanForm.dhcpTypeRadio[3].checked)
	{
		document.uiViewLanForm.uiViewAliasIPAddr.disabled = true;
		document.uiViewLanForm.uiViewAliasNetMask.disabled = true;
	}
	else
	{
		document.uiViewLanForm.uiViewAliasIPAddr.disabled = false;
		document.uiViewLanForm.uiViewAliasNetMask.disabled = false;
	}
}

function userModeOnloadCheck()
{
	return;
}

function adminOnloadCheck()
{
	if(document.uiViewLanForm.dhcpTypeRadio[1].checked)
	{
		if(document.uiViewLanForm.dnsTypeRadio[0].checked)	
			autoDNSRelay();
		else if(document.uiViewLanForm.dnsTypeRadio[1].checked)
			manualDNSRelay();
	}
	if(document.uiViewLanForm.dhcpTypeRadio[2].checked)
	{
		if(!dhcpRelayCheck())
		{
			dhcpRelayCheckFail();
		}
	}
}

function onloadCheck()
{
	userModeOnloadCheck();
	if(document.uiViewLanForm.userMode.value !=1)
	{
		adminOnloadCheck();
	}
	return;
}

function dhcpRelayCheck()
{
	if(document.uiViewLanForm.dhcpTypeRadio[2].checked){
		if(document.uiViewLanForm.defaultRoute_isp.value == 3){
			alert("DHCP Relay may be no use if default route is not dynamic or static routing mode!!");
			return false;
		}
	}
	return true;
}

function radvdChanged()
{
	with (document.uiViewLanForm){
		radvdFlag.value = 1;
		if (radvdRadio[0].checked == true){
			setDisplay('div_radvden', 0);
			radvdEnableFlag.value = 0;
		}
		else {
			setDisplay('div_radvden', 1);
			radvdEnableFlag.value = 1;
			radvdModeChanged();
		}
	}
}

function radvdModeChanged( )
{
		with (document.uiViewLanForm){
		radvdFlag.value = 1;
		if (radvdModeRadio[0].checked){
			radvdModeFlag.value = 0;
			setDisplay('div_radvdprelen', 0);
			setDisplay('div_radvdprelite', 0);
			setDisplay('div_radvdvate', 0);
		}
		else {
			radvdModeFlag.value = 1;
			setDisplay('div_radvdprelen', 1);
			setDisplay('div_radvdprelite', 1);
			setDisplay('div_radvdvate', 1);
		}
	}
}

function dhcp6sChanged()
{
	with (document.uiViewLanForm){
		dhcp6sFlag.value = 1;
		if (dhcp6sEnableRadio[0].checked == true){
			setDisplay('div_dhcp6sen', 0);
			dhcp6sEnableFlag.value = 0;
		}
		else {
			setDisplay('div_dhcp6sen', 1);
			dhcp6sEnableFlag.value = 1;
			dhcp6sModeChanged();
		}
	}
}

function ripngEnableChanged() 
{
	if(document.uiViewLanForm.ripngEnableRadio[0].checked)
		setDisplay('div_ripng_direction', 0);
	else
		setDisplay('div_ripng_direction', 1);
}

function dhcp6sModeChanged()
{
	with (document.uiViewLanForm){
		dhcp6sFlag.value = 1;
		if (dhcp6sModeRadio[0].checked){
			dhcp6sModeFlag.value = 0;
			setDisplay('div_dhcp6sprelen', 0);
			setDisplay('div_dhcp6splite', 0);
			setDisplay('div_dhcp6svate', 0);
			setDisplay('div_dhcp6sdns1', 0);
			setDisplay('div_dhcp6sdns2', 0);
		}
		else {
			dhcp6sModeFlag.value = 1;
			setDisplay('div_dhcp6sprelen', 1);
			setDisplay('div_dhcp6splite', 1);
			setDisplay('div_dhcp6svate', 1);
			setDisplay('div_dhcp6sdns1', 1);
			setDisplay('div_dhcp6sdns2', 1);
		}
	}
}

function dhcp6sModeAuto()
{
	var form = document.uiViewLanForm;
	form.dhcp6sModeFlag.value = 2;
	form.dhcp6sFlag.value = 1;
	document.uiViewLanForm.submit();
}

function dhcp6sPDEnable()
{
	var form = document.uiViewLanForm;
	form.dhcp6sPDFlag.value = 1;
	form.dhcp6sFlag.value = 1;
	document.uiViewLanForm.submit();
}

function dhcp6sPDDisable()
{
	var form = document.uiViewLanForm;
	form.dhcp6sPDFlag.value = 0;
	form.dhcp6sFlag.value = 1;
	document.uiViewLanForm.submit();
}

function setDhcpAddresses(lanIp)
{
	with (document.forms[0])
	{
		var addrParts = lanIp.split('.');
		if ( addrParts.length != 4 )
			return false;
		t1 = parseInt(addrParts[3]) + 1;
		t2 = 254 - parseInt(addrParts[3]);//parseInt(maskParts[3]);
		if (255 <= t2)
		{
			t2 = 254;
		}

		document.uiViewLanForm.StartIp.value = "";
		var tmpStartIp = "";
		for (i = 0; i < 3; i++)
		{
			document.uiViewLanForm.StartIp.value = document.uiViewLanForm.StartIp.value + addrParts[i] + ".";
		}
		document.uiViewLanForm.StartIp.value = document.uiViewLanForm.StartIp.value + t1;
		document.uiViewLanForm.PoolSize.value = t2;
	}
}
</script>
</head>
<body onLoad="onloadCheck()" style="background:#4acbd6;">
<FORM METHOD="POST" ACTION="/cgi-bin/home_lan.asp" name="uiViewLanForm">
<input type="hidden" name="lan_VC" value="0">
<input type="hidden" name="lan_Alias_VC" value="0">
<input type="hidden" name="aliasFlag" value="N/A">
<!--<input type="hidden" name="defaultRoute" value="0">-->
<input type="hidden" name="defaultRoute" value="0">
<input type="hidden" name="isIgmpMaxGroupSupported" value="N/A">
<input type="hidden" name="doChangeIP" value="0">
<input type="hidden" name="orgIP" id="orgIP">

<input type="hidden" name="defaultRoute_isp" id="defaultRoute_isp">
<input type="hidden" name="staticNum" id="staticNum">
<input type="hidden" name="LeaseNum" id="LeaseNum">
<input type="hidden" name="emptyEntry" id="emptyEntry" >
<input type="hidden" name="addFlag" value="0">
<input type="hidden" name="delnum">
<input type="hidden" name="tmpStartIp" id="tmpStartIp">
<input type="hidden" name="tmpPoolCount" id="tmpPoolCount">
<input type="hidden" name="option60Flag" value="No">
<input type="hidden" name="isIPv6Supported" value="1">
<input type="hidden" name="ipv6Flag" id="ipv6Flag">
<input type="hidden" name="userMode" value="0">
<input type="hidden" name="del_reservation_flag" value="0">
<script>
	document.getElementById("orgIP").value = lan_ip;
	document.getElementById("defaultRoute_isp").value = wan_pvc_isp;
	document.getElementById("staticNum").value = dhcpd_staticNum;
	document.getElementById("LeaseNum").value = dhcpLease_leaseNum;
	document.getElementById("emptyEntry").value = dhcpd_empty_Entry;
	document.getElementById("tmpStartIp").value = dhcpd_start;
	document.getElementById("tmpPoolCount").value = dhcpd_pool_count;
	if(wan_ipversion == "IPv4/IPv6")
		document.getElementById("ipv6Flag").value = "1";
	else
		document.getElementById("ipv6Flag").value = "0";
</script>
<div id="pagestyle">
<div id="contenttype">
<div id="block1" class="main_item">
<table width="640" border="0" cellpadding="0" cellspacing="0" bgcolor="#FFFFFF" style="table-layout: fixed;margin:5px 0;">
	<tr height="25px" style="width:100%;background:#e6e6e6;">
		<td align=left class="title-main" style="width:250px;padding-left:20px;">Set LAN IP Address</td>
	</tr>
</table>

<table width="640" border="0" cellpadding="0" cellspacing="0" bgcolor="#FFFFFF" style="table-layout: fixed">
	<tr height="30px">
	<td align=left class="tabdata" style="width:250px;padding-left:20px;">IP Address</td>
	<td class="tabdata">
		<input type="text" name="uiViewIPAddr" id="uiViewIPAddr" size="15" maxlength="15" onchange="setDhcpAddresses(this.value)">
		<script>
			if( lan_ip != "N/A")
				document.getElementById("uiViewIPAddr").value = lan_ip;
		</script>
		<input type="hidden" name="save_flag" value="0">
		<input type="hidden" name="lanFlag" value="0"><input type="hidden" name="DNSproxy" value='Yes'>
	</td>
	</tr>
	<tr height="30px">
	<td align=left class="tabdata" style="width:250px;padding-left:20px;">IP Subnet Mask</td>
	<td align=left class="tabdata">
	<input type="text" name="uiViewNetMask" id="uiViewNetMask" size="15" maxlength="15" >
	<script>
		if( lan_netmask != "N/A")
			document.getElementById("uiViewNetMask").value = lan_netmask;
	</script>
	</td>
	</tr>
	<tr height="30px" style="display:none;">
	<td align=left class="tabdata" style="width:250px;padding-left:20px;">Alias IP Address</td>
	<td align=left class="tabdata">
		<input type="text" name="uiViewAliasIPAddr" size="15" maxlength="15" value="" >
		 (0.0.0.0 means to close the alias ip)
	</td>
	</tr>
	<tr height="30px" style="display:none;">
	<td align=left class="tabdata" style="width:250px;padding-left:20px;">Alias IP Subnet Mask</td>
	<td align=left class="tabdata"><input type="text" name="uiViewAliasNetMask" size="15" maxlength="15" value="" >
	</td>
	</tr>
</table>
<table style="display:none;" width="640" border="0" cellpadding="0" cellspacing="0" bgcolor="#FFFFFF" style="table-layout: fixed">
<tr height="30px">
	<td align=left class="tabdata" style="width:250px;padding-left:20px;">
	Snoop
	</td>
	<td align=left class="tabdata">
		<input name="lan_snoop" type="radio" value="Yes" >Enable
		&nbsp;&nbsp;&nbsp;&nbsp;
		<input type="radio" name="lan_snoop" value="No" >Disable
		</td>
		</tr>
	<tr>
	<td class="light-orange">&nbsp;</td>
	<td class="light-orange"></td>
	<td class="tabdata"><div align=right>Dynamic Route</div></td>
	<td width="10" class="tabdata"><div align=center>:</div></td>
	<td class="tabdata">
		<select name="lan_RIP" size="1">
		<option value="RIP1" >RIP1
		<option value="RIP2" >RIP2
		</select>
		Direction
		<select name="lan_RIP_Dir" size="1">
		<option value="None" >None
		<option value="Both" >Both
		<option value="IN Only" >IN Only
		<option value="OUT Only" >OUT Only
		</select>
		</td></tr>

		</table>
		</div>
<div id="block1" class="main_item">
<table width="640" border="0" cellpadding="0" cellspacing="0" bgcolor="#FFFFFF" style="table-layout: fixed;margin:5px 0;">
	<tr height="25px" style="width:100%;background:#e6e6e6;">
		<td align=left class="title-main" style="width:250px;padding-left:20px;">Set Limit NAT Session Status</td>
	</tr>
</table>
<table width="640" border="0" cellpadding="0" cellspacing="0" bgcolor="#FFFFFF" style="table-layout: fixed">
	<tr height="30px">
	<td width="250px" align=left class="tabdata" style="padding-left:20px;">Limit NAT Session</td>
	<td align=left  class="tabdata">
        <INPUT TYPE="RADIO" NAME="nat_session" VALUE="0" >Disable&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;
		<INPUT TYPE="RADIO" NAME="nat_session" VALUE="1" >Enable
		<script>
			if (nat_session1 == "1" && nat_session2 == "1")
			{
				document.uiViewLanForm.nat_session[0].checked = false;
				document.uiViewLanForm.nat_session[1].checked = true;
			}
			else
			{
				document.uiViewLanForm.nat_session[0].checked = true;
				document.uiViewLanForm.nat_session[1].checked = false;
			}
		</script>
    </td>
	</tr>
</table>
</div>

<div id="block1" class="main_item">
<table width="640" border="0" cellpadding="0" cellspacing="0" bgcolor="#FFFFFF" style="table-layout: fixed;margin:5px 0;">
	<tr height="25px" style="width:100%;background:#e6e6e6;">
		<td align=left class="title-main" style="width:250px;padding-left:20px;">DHCP Server Option</td>
	</tr>
</table>
<table width="640" border="0" cellpadding="0" cellspacing="0" bgcolor="#FFFFFF" style="table-layout: fixed">
	<tr height="30px">
	<td width="250px" align=left class="tabdata" style="padding-left:20px;">DHCP</td>
	<td align=left  class="tabdata">
		<input type="radio" name="dhcpTypeRadio" value="0" onClick="doReload()">Disable
		&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;<input type="radio" name="dhcpTypeRadio" value="1" onClick="doReload()">Enable
		&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;<input type="radio" name="dhcpTypeRadio" value="2" onClick="doReload()">Relay
		<script>
			if(lan_dhcp_type == "1"){
				document.getElementsByName("dhcpTypeRadio")[0].checked = false;
				document.getElementsByName("dhcpTypeRadio")[1].checked = true;
				document.getElementsByName("dhcpTypeRadio")[2].checked = false;
			}else if(lan_dhcp_type == "2"){
				document.getElementsByName("dhcpTypeRadio")[0].checked = false;
				document.getElementsByName("dhcpTypeRadio")[1].checked = false;
				document.getElementsByName("dhcpTypeRadio")[2].checked = true;
			}else{
				document.getElementsByName("dhcpTypeRadio")[0].checked = true;
				document.getElementsByName("dhcpTypeRadio")[1].checked = false;
				document.getElementsByName("dhcpTypeRadio")[2].checked = false;
			}
		</script>
	</td>
  </tr>
</table>
</div>

<div id="dhcp_enabled_div0" class="main_item">
<table width="640" border="0" cellpadding="0" cellspacing="0" bgcolor="#FFFFFF" style="table-layout: fixed;margin:5px 0;">
	<tr height="25px" style="width:100%;background:#e6e6e6;">
		<td align=left class="title-main" style="width:250px;padding-left:20px;">DHCP Address Setting</td>
	</tr>
</table>
<table width="640" border="0" cellpadding="0" cellspacing="0" bgcolor="#FFFFFF" style="table-layout: fixed">
	<tr height="30px">
		<td width="250px" align=left class="tabdata" style="padding-left:20px;">Start IP</td>
		<td align=left class="tabdata">
			<input type="text" name="StartIp" id="StartIp" size="15" maxlength="15">
			<script>
				if (dhcpd_start != "N/A")
					document.getElementById("StartIp").value = dhcpd_start;
			</script>
		</td>
	</tr>
	<tr style="height:30px">
		<td width="250px" align=left class="tabdata" style="padding-left:20px;">IP Pool Count</td>
		<td align=left class="tabdata">
			<input type="text" name="PoolSize" id="PoolSize" size="15" maxlength="3">
			<script>
				if (dhcpd_pool_count != "N/A")
					document.getElementById("PoolSize").value = dhcpd_pool_count;
			</script>
		</td>
	</tr>

	<tr height="30px">
		<td width="250px" align=left class="tabdata" style="padding-left:20px;">Lease Time</td>
		<td align=left class="tabdata">
		<input type="text" name="dhcp_LeaseTime" id="dhcp_LeaseTime" size="15" maxlength="6" >
		seconds   (range:0 as default value of 259200 or 120~)
		<script>
			if (dhcpd_lease != "N/A")
				document.getElementById("dhcp_LeaseTime").value = dhcpd_lease;
			else
				document.getElementById("dhcp_LeaseTime").value = "0";
		</script>
	</td>
	</tr>
<div id="block1" class="main_item">
<table width="640" border="0" cellpadding="0" cellspacing="0" bgcolor="#FFFFFF" style="table-layout: fixed;margin:5px 0;">
	<tr height="25px" style="width:100%;background:#e6e6e6;">
		<td align=left class="title-main" style="width:250px;padding-left:20px;">DNS Information Setting</td>
	</tr>
</table>
<table width="640" border="0" cellpadding="0" cellspacing="0" bgcolor="#FFFFFF" style="table-layout: fixed">
	<tr height="30px">
	<td align=left width="250px" class="tabdata" style="padding-left:20px;">
		DNS Relay
	</td>
	<td align=left  class="tabdata">
		<input type="radio" name="dnsTypeRadio" value="0" onClick="autoDNSRelay()" >Automatically
		<input type="radio" name="dnsTypeRadio" value="1" onClick="manualDNSRelay()" >Manually
		<script>
			if (dhcpd_type == "1") {
				document.getElementsByName("dnsTypeRadio")[0].checked = false;
				document.getElementsByName("dnsTypeRadio")[1].checked = true;
			} else {
				document.getElementsByName("dnsTypeRadio")[0].checked = true;
				document.getElementsByName("dnsTypeRadio")[1].checked = false;
			}
		</script>
	</td>
	</tr>
	<tr height="30px">
	<td width="250px" align=left class="tabdata" style="padding-left:20px;">Primary DNS</td>
	<td align=left class="tabdata" width="30px">
		<input type="text" name="PrimaryDns" id="PrimaryDns" size="15" maxlength="15" >
	</td>
	</tr>

	<tr height="30px">
		<td width="250px" align=left class="tabdata" style="padding-left:20px;">Secondary DNS</td>
		<td align=left class="tabdata" width="300px">
		<input type="text" name="SecondDns" id="SecondDns" size="15" maxlength="15">
		<script>
			if (dhcpd_type == "1")
			{
				var dhcpd_dns_array = dhcpd_dns_all.split(",");
				if(dhcpd_dns_array[1] != "N/A" && dhcpd_dns_array[1] != undefined)
					document.getElementById("PrimaryDns").value = dhcpd_dns_array[1];
				if(dhcpd_dns_array[2] != "N/A" && dhcpd_dns_array[2] != undefined)
					document.getElementById("SecondDns").value = dhcpd_dns_array[2];
			}
			else
			{
				document.getElementById("PrimaryDns").value = "";
				document.getElementById("SecondDns").value = "";
			}
		</script>
	</td>
	</tr>
</div>
	<div id="block1" class="main_item">
<table width="640" border="0" cellpadding="0" cellspacing="0" bgcolor="#FFFFFF" style="table-layout: fixed;margin:5px 0;">
		<tr height="25px" style="width:100%;background:#e6e6e6;">
			<td align=left class="title-main" style="width:250px;padding-left:20px;">Add DHCP Reservation</td>
	</tr>
	</table>
<table width="640" border="0" cellpadding="0" cellspacing="0" bgcolor="#FFFFFF" style="table-layout: fixed;">
	<tr height="30px">
		<td align=left class="tabdata" style="width:250px;padding-left:20px;">IP Address</td>
		<td align=left class="tabdata"><input type="text" name="IpAddr" size="15" maxlength="15" value="" ></td>
	</tr>
	<tr height="30px">
		<td align=left class="tabdata" style=" width:250px;padding-left:20px;">MAC Address</td>
		<td align=left class="tabdata" width="300px"><input type="text" name="MACAddr" size="15" maxlength="17" value="" ></td>
	</tr>
	</div>
	<div id="block1" class="main_item">
<table width="640" border="0" cellpadding="0" cellspacing="0" bgcolor="#FFFFFF" style="table-layout: fixed;margin:5px 0;">
		<tr height="25px" style="width:100%;background:#e6e6e6;">
	<td class="title-main" align=left style="padding-left:20px;">DHCP Reservation List</td>
	</tr>
	</table>
	<table width="620" border="0" cellpadding="0" cellspacing="0" bgcolor="#FFFFFF" style="table-layout: fixed;">
	<tr>
	<td colspan="3" align=center>
	<table id="static_list" width="580" border="1" cellpadding="1" cellspacing="0" bordercolor="#CCCCCC" bgcolor="#FFFFFF">
	<!--<tr>
		<td width="120px" align=center class="tabdata"><strong><FONT color=#000000>Index</strong></td>
		<td width="180px" align=center class="tabdata"><strong><FONT color=#000000>IP</strong></td>
		<td width="200px" align=center class="tabdata"><strong><FONT color=#000000>MAC</strong></td>
		<td width="180px" align=center class="tabdata"><strong><FONT color=#000000>Drop</strong></td>
	</tr>
	<tr id="dhcpd_info_row_0">
		<td align=center class="topborderstyle">1</td>
		<td align=center class="topborderstyle" id="row_ip_0"></td>
		<td align=center class="topborderstyle" id="row_mac_0"></td>
		<td align=center class="topborderstyle"><IMG src="/cross.gif" onmouseover="this.style.cursor='hand'" onClick="doDelete(0);"></td>
	</tr>
	<tr id="dhcpd_info_row_1">
		<td align=center class="topborderstyle">2</td>
		<td align=center class="topborderstyle" id="row_ip_1"></td>
		<td align=center class="topborderstyle" id="row_mac_1"></td>
		<td align=center class="topborderstyle"><IMG src="/cross.gif" onmouseover="this.style.cursor='hand'" onClick="doDelete(1);"></td>
	</tr>
	<tr id="dhcpd_info_row_2">
		<td align=center class="topborderstyle">3</td>
		<td align=center class="topborderstyle" id="row_ip_2"></td>
		<td align=center class="topborderstyle" id="row_mac_2"></td>
		<td align=center class="topborderstyle"><IMG src="/cross.gif" onmouseover="this.style.cursor='hand'" onClick="doDelete(2);"></td>
	</tr>
	<tr id="dhcpd_info_row_3">
		<td align=center class="topborderstyle">4</td>
		<td align=center class="topborderstyle" id="row_ip_3"></td>
		<td align=center class="topborderstyle" id="row_mac_3"></td>
		<td align=center class="topborderstyle"><IMG src="/cross.gif" onmouseover="this.style.cursor='hand'" onClick="doDelete(3);"></td>
	</tr>
	<tr id="dhcpd_info_row_4">
		<td align=center class="topborderstyle">5</td>
		<td align=center class="topborderstyle" id="row_ip_4"></td>
		<td align=center class="topborderstyle" id="row_mac_4"></td>
		<td align=center class="topborderstyle"><IMG src="/cross.gif" onmouseover="this.style.cursor='hand'" onClick="doDelete(4);"></td>
	</tr>
	<tr id="dhcpd_info_row_5">
		<td align=center class="topborderstyle">6</td>
		<td align=center class="topborderstyle" id="row_ip_5"></td>
		<td align=center class="topborderstyle" id="row_mac_5"</td>
		<td align=center class="topborderstyle"><IMG src="/cross.gif" onmouseover="this.style.cursor='hand'" onClick="doDelete(5);"></td>
	</tr>
	<tr id="dhcpd_info_row_6">
		<td align=center class="topborderstyle">7</td>
		<td align=center class="topborderstyle" id="row_ip_6"></td>
		<td align=center class="topborderstyle" id="row_mac_6"></td>
		<td align=center class="topborderstyle"><IMG src="/cross.gif" onmouseover="this.style.cursor='hand'" onClick="doDelete(6);"></td>
	</tr>
	<tr id="dhcpd_info_row_7">
		<td align=center class="topborderstyle">8</td>
		<td align=center class="topborderstyle" id="row_ip_7"></td>
		<td align=center class="topborderstyle" id="row_mac_7"></td>
		<td align=center class="topborderstyle"><IMG src="/cross.gif" onmouseover="this.style.cursor='hand'" onClick="doDelete(7);"></td>
	</tr>-->
	<script>
		function createRow(i) {
			return `
			<tr id="dhcpd_info_row_${i}">
				<td align="center" class="topborderstyle">${i + 1}</td>
				<td align="center" class="topborderstyle" id="row_ip_${i}"></td>
				<td align="center" class="topborderstyle" id="row_mac_${i}"></td>
				<td align="center" class="topborderstyle">
				<img src="/cross.gif" onmouseover="this.style.cursor='hand'" onClick="doDelete(${i});">
				</td>
			</tr>
			`;
		}
		// ����������
		var header = `
			<tr>
				<td width="120px" align="center" class="tabdata"><strong><FONT color=#000000>Index</strong></td>
				<td width="180px" align="center" class="tabdata"><strong><FONT color=#000000>IP</strong></td>
				<td width="200px" align="center" class="tabdata"><strong><FONT color=#000000>MAC</strong></td>
				<td width="180px" align="center" class="tabdata"><strong><FONT color=#000000>Drop</strong></td>
			</tr>
		`;

		// ʹ�� createRow ���������� 32 �� <tr> Ԫ��
		var rows = '';
		var i = 0;
		for(i=0;i<32; i++){
			rows += createRow(i);
		}

		// �������к����� <tr> Ԫ�����ӵ���ı�����
		document.getElementById('static_list').innerHTML = header + rows;

		for(i=0;i<32;i++){
			if(typeof window['dhcpd_' + i + "_ip"] !== 'undefined'){
				document.getElementById("dhcpd_info_row_"+i).style.display = '';
				document.getElementById("row_ip_"+i).innerHTML = window['dhcpd_' + i + "_ip"];
				document.getElementById("row_mac_"+i).innerHTML = window['dhcpd_' + i + "_mac"];
			}else{
				document.getElementById("dhcpd_info_row_"+i).style.display = 'none';
			}
		}
	</script>
</table>
		</td>
		</tr>
<table width="640" border="0" cellpadding="0" cellspacing="0" bgcolor="#FFFFFF" style="table-layout: fixed;margin:5px 0;display:none;">
		<tr height="25px" style="width:100%;background:#e6e6e6;">
	<td class="title-main" align=left style="padding-left:20px;">Device Table</td>
	</tr>
  </table>
	<tr>
	<td colspan="3" align=center>
		<div id=dhcpclientList style="display:none;"></div>
<script language=JavaScript>
var tableHeader = [
	["50","#"],
	["140","Device Name"],
	["150","IP Address"],
	["140","MAC Address"],
	["100","Expire Time"]
];

var tableData = [];
var index = 0;
for(index = 0; index < 10; index++)
{
	if(typeof window['dhcpLease_' + index + "_ip"] !== 'undefined')
	{
		tableData.push([index +1,window['dhcpLease_' + index + "_hostName"],window['dhcpLease_' + index + "_ip"],window['dhcpLease_' + index + "_mac"],window['dhcpLease_' + index + "_expireDay"] + "days " + window['dhcpLease_' + index + "_expireTime"]]);
	}
}
/*
var tableData = [
	["1", dhcpLease_0_hostName,dhcpLease_0_ip,dhcpLease_0_mac,dhcpLease_0_expireDay + "days " + dhcpLease_0_expireTime],
	["2", dhcpLease_1_hostName,dhcpLease_1_ip,dhcpLease_1_mac,dhcpLease_1_expireDay + "days " + dhcpLease_1_expireTime],
	["3", dhcpLease_2_hostName,dhcpLease_2_ip,dhcpLease_2_mac,dhcpLease_2_expireDay + "days " + dhcpLease_2_expireTime],
	["4", dhcpLease_3_hostName,dhcpLease_3_ip,dhcpLease_3_mac,dhcpLease_3_expireDay + "days " + dhcpLease_3_expireTime],
	["5", dhcpLease_4_hostName,dhcpLease_4_ip,dhcpLease_4_mac,dhcpLease_4_expireDay + "days " + dhcpLease_4_expireTime],
	["6", dhcpLease_5_hostName,dhcpLease_5_ip,dhcpLease_5_mac,dhcpLease_5_expireDay + "days " + dhcpLease_5_expireTime],
	["7", dhcpLease_6_hostName,dhcpLease_6_ip,dhcpLease_6_mac,dhcpLease_6_expireDay + "days " + dhcpLease_6_expireTime],
	["8", dhcpLease_7_hostName,dhcpLease_7_ip,dhcpLease_7_mac,dhcpLease_7_expireDay + "days " + dhcpLease_7_expireTime],
	["9", dhcpLease_8_hostName,dhcpLease_8_ip,dhcpLease_8_mac,dhcpLease_8_expireDay + "days " + dhcpLease_8_expireTime],
	["10", dhcpLease_9_hostName,dhcpLease_9_ip,dhcpLease_9_mac,dhcpLease_9_expireDay + "days " + dhcpLease_9_expireTime]
];*/

		showTable('dhcpclientList',tableHeader,tableData,2);
		</script>
		</td></tr>
		</table>
</div>

<div id="dhcp_relay_div">
	<table width="760" border="0" cellpadding="0" cellspacing="0" bgcolor="#FFFFFF">
		<tr height="30px">
		<td align=left width="250px" class="tabdata" style="padding-left:20px;">
			Server IP</td>
			<td align=left class="tabdata">
		<input type="text" name="ServerIp" id="ServerIp_id" size="15" maxlength="15">
		<script>
			if(dhcpRelay_serverIp != "N/A")
				document.getElementById("ServerIp_id").value = dhcpRelay_serverIp;
		</script>
	</td>
	</tr>
	</table>
</div>

	<div id="block1" class="main_item">
<table width="640" border="0" cellpadding="0" cellspacing="0" bgcolor="#FFFFFF" style="table-layout: fixed;margin:5px 0;">
  <tr height="25px" style="width:100%;background:#e6e6e6;">
	<td align=left class="title-main" style="width:250px;padding-left:20px;">IPv6 Address Setting</td>
  </tr>
 </table>

<table width="640" border="0" cellpadding="0" cellspacing="0" bgcolor="#FFFFFF" style="table-layout: fixed">
	<tr height="30px">
		<td align=left class="tabdata" style="width:250px;padding-left:20px;">IPv6 Global Address</td>
		<td align=left class="tabdata" style="white-space:nowrap;">
		<input type="text" name="uiViewIPv6Addr" id="uiViewIPv6Addr" size="36" maxlength="39">
		<font size=+1>&nbsp;/&nbsp;
		<input type="text" name="uiViewIPv6Prefix" id="uiViewIPv6Prefix" size="3" maxlength="3"></td>
		<script>
			var ip6_array = lan_ip6_all.split("/");
			if(ip6_array[0] != "N/A" && ip6_array[0] != undefined)
				document.getElementById("uiViewIPv6Addr").value = ip6_array[0];
			if(ip6_array[1] != "N/A" && ip6_array[1] != undefined)
				document.getElementById("uiViewIPv6Prefix").value = ip6_array[1];
		</script>
		</font>
		</td>
	</tr>
</table>
</div>
<div id="block1" class="main_item" style="display:none">
<table width="640" border="0" cellpadding="0" cellspacing="0" bgcolor="#FFFFFF" style="table-layout: fixed;margin:5px 0;">
	<tr height="25px" style="width:100%;background:#e6e6e6;">
	<td align=left class="title-main" style="width:250px;padding-left:20px;">Radvd</td>
	</tr>
</table>
<table width="640" border="0" cellpadding="0" cellspacing="0" bgcolor="#FFFFFF" style="table-layout: fixed">
	<tr height="30px" style="display:none">
		<td align=left class="tabdata" style="width:250px;padding-left:20px;">
				Radvd Enable
		</td>
		<td align=left class="tabdata">
		<input type="radio" name="radvdRadio" value="0" onClick="radvdChanged()">
		Disable
		<input type="radio" name="radvdRadio" value="1" onClick="radvdChanged()">
		Enable
		<script>
				if (radvd_enable == "1") {
					document.getElementsByName("radvdRadio")[0].checked = false;
					document.getElementsByName("radvdRadio")[1].checked = true;
				} else {
					document.getElementsByName("radvdRadio")[0].checked = true;
					document.getElementsByName("radvdRadio")[1].checked = false;
				}
			</script>
		</td>
		<input type="hidden" name="radvdEnableFlag">
		<script>
			document.getElementsByName("radvdEnableFlag").value = radvd_enable;
		</script>
		<input type="hidden" name="radvdFlag" >
	</tr>
	</table>
	<div id="div_radvden">
	<table width="640" border="0" cellpadding="0" cellspacing="0" bgcolor="#FFFFFF">
	<tr height="30px" id="div_radvdmode">
		<td align=left class="tabdata" style="width:250px;padding-left:20px;">Radvd Mode</td>
		<td align=left class="tabdata">
			<input type="radio" name="radvdModeRadio" value="0" onClick="radvdModeChanged()">
			Auto
			&nbsp;&nbsp;&nbsp;&nbsp;
			<input type="radio" name="radvdModeRadio" value="1" onClick="radvdModeChanged()">
			Manual
			<script>
				if (radvd_mode == "1") {
					document.getElementsByName("radvdModeRadio")[0].checked = false;
					document.getElementsByName("radvdModeRadio")[1].checked = true;
				} else {
					document.getElementsByName("radvdModeRadio")[0].checked = true;
					document.getElementsByName("radvdModeRadio")[1].checked = false;
				}
			</script>
		</td>
			<input type="hidden" name="radvdModeFlag">
			<script>
				document.getElementsByName("radvdModeFlag").value = radvd_mode;
			</script>
	</tr>
	<tr height="30px" id="div_radvdprelen">
		<td align=left class="tabdata" style="width:250px;padding-left:20px;">Prefix/Length</td>
		<td align=left class="tabdata">
		<input type="text" name="uiViewIPv6PrefixRadvd" id="uiViewIPv6PrefixRadvd" size="36" maxlength="39">
		<font size=+1>&nbsp;/&nbsp;
			<input type="text" name="uiViewIPv6PrefixLenRadvd" id="uiViewIPv6PrefixLenRadvd" size="3" maxlength="3">
			<script>
				var radvd_ip6_array = radvd_prefixIpv6_all.split("/");
				if(radvd_ip6_array[0] != "N/A" && radvd_ip6_array[0] != undefined)
					document.getElementById("uiViewIPv6PrefixRadvd").value = radvd_ip6_array[0];
				if(radvd_ip6_array[0] != "N/A" && radvd_ip6_array[0] != undefined)
					document.getElementById("uiViewIPv6PrefixLenRadvd").value = radvd_ip6_array[0];
			</script>
		</font>
		</td>
	</tr>
	<tr height="30px" id="div_radvdprelite">
		<td align=left class="tabdata" style="width:250px;padding-left:20px;">Preferred Lifetime</td>
		<td align=left class="tabdata">
			<input type="text" name="uiPreferredLifetimeRadvd" id="uiPreferredLifetimeRadvd" size="30" maxlength="15">
			<script>
				if(radvd_preferredLifetime != "N/A")
					document.getElementById("uiPreferredLifetimeRadvd").value = radvd_preferredLifetime;
			</script>
		</td>
	</tr>
	<tr height="30px" id="div_radvdvate">
		<td align=left class="tabdata" style="width:250px;padding-left:20px;">
		ValidLifetime
		</div>
		</td>
		<td align=left class="tabdata"><input type="text" name="uiValidLifetimeRadvd" id="uiValidLifetimeRadvd" size="30" maxlength="15"></td>
		<script>
			if(radvd_validLifetime != "N/A")
				document.getElementById("uiValidLifetimeRadvd").value = radvd_validLifetime;
		</script>
	</tr>
	</table>
	</div>
	</div>
<div id="block1" class="main_item">
	<table width="640" border="0" cellpadding="0" cellspacing="0" bgcolor="#FFFFFF" style="table-layout: fixed;margin:5px 0;">
	<tr height="25px" style="width:100%;background:#e6e6e6;">
		<td  align=left class="title-main" style="width:250px;padding-left:20px;">DHCPv6 Server Option</td>
	</tr>
	</table>
	<table width="640" border="0" cellpadding="0" cellspacing="0" bgcolor="#FFFFFF" style="table-layout: fixed">
		<tr height="30px">
			<td align=left class="tabdata" style="width:250px;padding-left:20px;">RA Flags Set</td>
			<td align=left class="tabdata">ManagedAddr
				<select name="radvdManagedAddrflag" id="radvdManagedAddrflag" size="1">
				<option value="0">off
				<option value="1">on
				</select>
				<script>
					document.getElementById("radvdManagedAddrflag").value = radvd_managedEnable;
				</script>
					OtherConfig
				<select name="radvdOtherConfigflag" id="radvdOtherConfigflag" size="1">
				<option value="0">off
				<option value="1">on
				</select>
				<script>
					document.getElementById("radvdOtherConfigflag").value = radvd_otherEnable;
				</script>
			</td>
		</tr>
	</table>
	<table width="640" border="0" cellpadding="0" cellspacing="0" bgcolor="#FFFFFF" style="table-layout: fixed">
	<tr height="30px">
		<td align=left style="padding-left:20px;width:250px;"class="tabdata">DHCPv6 Server</td>
		<td align=left class="tabdata">
		<input type="radio" name="dhcp6sEnableRadio" value="0" onClick="dhcp6sChanged()">
		Disable<input type="radio" name="dhcp6sEnableRadio" value="1" onClick="dhcp6sChanged()" >
		Enable
		<script>
			if (dhcp6s_enableFlag == "1") {
				document.getElementsByName("dhcp6sEnableRadio")[0].checked = false;
				document.getElementsByName("dhcp6sEnableRadio")[1].checked = true;
			} else {
				document.getElementsByName("dhcp6sEnableRadio")[0].checked = true;
				document.getElementsByName("dhcp6sEnableRadio")[1].checked = false;
			}
		</script>
		</td>
		<input type="hidden" name="dhcp6sEnableFlag" >
		<input type="hidden" name="dhcp6sFlag" >
		<input type="hidden" name="dhcp6sModeFlag" >
		<input type="hidden" name="dhcp6sPDFlag" >
		<input type="hidden" name="dhcp6sModeSubmitFlag" >
		<script>
			document.getElementsByName("dhcp6sEnableFlag").value = dhcp6s_enableFlag;
			document.getElementsByName("dhcp6sModeFlag").value = dhcp6s_mode;
			document.getElementsByName("dhcp6sPDFlag").value = dhcp6s_pdFlag;
		</script>
	</tr>
	</table>
	<div id="div_dhcp6sen">
	<table width="640" border="0" cellpadding="0" cellspacing="0" bgcolor="#FFFFFF" style="table-layout: fixed">
	<tr height="30px">
		<td align=left class="tabdata" style="width:250px;padding-left:20px;">DHCPv6 Mode</td>
		<td align class="tabdata">
		<input type="radio" name="dhcp6sModeRadio" value="0"  onClick="dhcp6sModeChanged()">
		Automatically<input type="radio" name="dhcp6sModeRadio" value="1"  onClick="dhcp6sModeChanged()" >
		Manually
		<script>
			if (dhcp6s_mode == "1") {
				document.getElementsByName("dhcp6sModeRadio")[0].checked = false;
				document.getElementsByName("dhcp6sModeRadio")[1].checked = true;
			} else {
				document.getElementsByName("dhcp6sModeRadio")[0].checked = true;
				document.getElementsByName("dhcp6sModeRadio")[1].checked = false;
			}
		</script>
		</td>
	</tr>
	<tr id="div_dhcp6sprelen" height="30px">
		<td class="tabdata" align=left style="width:250px;padding-left:20px;">Prefix/Length</td>
		<td align=left class="tabdata" style="white-space:nowrap;">
		<input type="text" name="uiViewIPv6DHCPPrefix" id="uiViewIPv6DHCPPrefix" size="39" maxlength="39" >
		<font size=+1>&nbsp;/&nbsp;
		<input type="text" name="uiViewIPv6DHCPPrefixLen" id="uiViewIPv6DHCPPrefixLen" size="3" maxlength="3" >
		<script>
			var prefixIPv6_v6_array = prefixIPv6_v6_all.split("/");
			if(prefixIPv6_v6_array[0] != "N/A" && prefixIPv6_v6_array[0] != undefined)
				document.getElementById("uiViewIPv6DHCPPrefix").value = prefixIPv6_v6_array[0];
			if(prefixIPv6_v6_array[1] != "N/A" && prefixIPv6_v6_array[1] != undefined)
				document.getElementById("uiViewIPv6DHCPPrefixLen").value = prefixIPv6_v6_array[1];
		</script>
		</td>
	</tr>
	<tr id="div_dhcp6splite" height="30px">
		<td class="tabdata" align=left style="width:250px;padding-left:20px;">Preferred Lifetime</td>
		<td align=left class="tabdata">
		<input type="text" name="uiPreferredLifetimeDHCP6" id="uiPreferredLifetimeDHCP6" size="30" maxlength="15">
		<script>
			if(preferredLifetime_v6 != "N/A")
				document.getElementById("uiPreferredLifetimeDHCP6").value = preferredLifetime_v6;
		</script>
		</td>
	</tr>
	<tr id="div_dhcp6svate" height="30px">
		<td class="tabdata" align=left style="width:250px;padding-left:20px;">ValidLifetime</td>
		<td align-left class="tabdata">
		<input type="text" name="uiValidLifetimeDHCP6" id="uiValidLifetimeDHCP6" size="30" maxlength="15" >
		<script>
			if(validLifetime_v6 != "N/A")
				document.getElementById("uiValidLifetimeDHCP6").value = validLifetime_v6;
		</script>
		</td>
	</tr>

	<tr id="div_dhcp6sdns1">
		<td class="tabdata" align=left style="width:250px;padding-left:20px;">Primary DNS</td>
		<td align=left class="tabdata">
			<input type="text" name="uiPrimaryDNSDHCP6" id="uiPrimaryDNSDHCP6" size="39" maxlength="39" >
			<font size=+1>&nbsp;</font>
		</td>
	</tr>

	<tr id="div_dhcp6sdns2" height="30px">
		<td class="tabdata" align=left style="width:250px;padding-left:20px;">Secondary DNS</td>
		<td align=left class="tabdata">
			<input type="text" name="uiSecondaryDNSDHCP6" id="uiSecondaryDNSDHCP6" size="39" maxlength="39" >
			<script>
			var dnsServer_v6_array = dnsServer_v6_all.split(",");
			if(dnsServer_v6_array[0] != "N/A" && dnsServer_v6_array[0] != undefined)
				document.getElementById("uiPrimaryDNSDHCP6").value = dnsServer_v6_array[0];
			if(dnsServer_v6_array[1] != "N/A" && dnsServer_v6_array[1] != undefined)
				document.getElementById("uiSecondaryDNSDHCP6").value = dnsServer_v6_array[1];
			</script>
			<font size=+1>&nbsp;</font>
		</td>
	</tr>
	</table>
	</div><!--id="div_dhcp6sen"-->
	<script language="JavaScript" type="text/JavaScript">
		radvdChanged();
		dhcp6sChanged();
	</script>
	</div>
	<div id="block1" class="main_item">
	<table width="640" border="0" cellpadding="0" cellspacing="0" bgcolor="#FFFFFF" style="margin:5px 0;">
		<tr height="25px">
			<td align=left class="title-main" style="padding-left:20px;white-space:nowrap;">Click "Save" to save your settings</td>
		</tr>
	</table>

	<table width="640" border="0" cellpadding="0" cellspacing="0" bgcolor="#FFFFFF">
		<tr height="40" >
			<td width="250px" align=left class="tabdata" style="padding-left:20px;">
				<input type="reset" name="lan_cancel" class="button1" value="Cancel">
				<input type="button" name="SaveBtn" class="button1" value="Save" onClick="uiSave()">
				<input type="hidden" name="DHCPMBSSIDNumberFlag">
				<input type="hidden" name="DHCP2PortsFlag" value="N/A">
				<input type="hidden" name="DHCP1PortsFlag" value="N/A">
				<input type="hidden" name="DHCPZY1PortsFlag" value="N/A">
				<input type="hidden" name="DHCPFilterFlag" value="N/A">
				<input type="hidden" name="wlanISExist">
				<input type="hidden" name="wlan11acISExist" >
				<input type="hidden" name="DHCPMBSSID11acNumberFlag" >
				<script>
					document.getElementsByName("wlanISExist").value = wlan_isExist;
					document.getElementsByName("DHCPMBSSIDNumberFlag").value = wlan_bssidnum;
					document.getElementsByName("wlan11acISExist").value = wlan_isExist_5g;
					document.getElementsByName("DHCPMBSSID11acNumberFlag").value = wlan_bssidnum_5g;
				</script>
			</td>
		</tr>
	</table>
	</div>
</table>
</div>
</div>
</form>
</body>

<script language="JavaScript">
	doDisplay();
</script>

<script>
/* FTC: Tự động cập nhật Start IP khi nhập xong IP Subnet Mask */
(function() {
  function ftcUpdateStartIp() {
    var ipEl = document.getElementById('uiViewIPAddr');
    var startIpEl = document.getElementById('StartIp');
    if (!ipEl || !startIpEl) return;
    var ip = ipEl.value.trim();
    var parts = ip.split('.');
    if (parts.length === 4 && parts.every(function(p) { return p !== '' && !isNaN(p); })) {
      var startIp = parts[0] + '.' + parts[1] + '.' + parts[2] + '.2';
      startIpEl.value = startIp;
      startIpEl.dispatchEvent(new Event('input', { bubbles: true }));
      startIpEl.dispatchEvent(new Event('change', { bubbles: true }));
    }
  }

  window.addEventListener('load', function() {
    var maskEl = document.getElementById('uiViewNetMask');
    if (maskEl) {
      maskEl.addEventListener('change', ftcUpdateStartIp);
      maskEl.addEventListener('blur', ftcUpdateStartIp);
    }
  });
})();
</script>

</html>
