


<!DOCTYPE html PUBLIC "-//W3C//DTD XHTML 1.0 Transitional//EN" "http://www.w3.org/TR/xhtml1/DTD/xhtml1-transitional.dtd">
<html xmlns="http://www.w3.org/1999/xhtml" xml:lang="utf-8" dir="ltr" lang="utf-8">
<head>
<meta http-equiv="X-UA-Compatible" content="IE=11;IE=10;IE=9; IE=8; IE=7; IE=EDGE">
<meta http-equiv=Content-Script-Type content=text/javascript>
<meta http-equiv=Content-Style-Type content=text/css>
<meta http-equiv=Content-Type content="text/html; charset=UTF-8">
<script language="JavaScript" type='text/javascript' src="/ip_new.js"></script>
<script language="JavaScript" src="/general.js"></script>
<script language="JavaScript" type="text/javascript" src="/jsl.js"></script>
<script type="text/javascript" src="/spin.js" ></script>
<link rel="stylesheet" type="text/css" href="/style.css">
<style  type="text/css">

*{color:  #404040;}

</style>

<script language='javascript'>
//////
/*var virServer_0_startport = "1";//VirServer_Entry0 STARTPORT
var virServer_0_endport = "2";//VirServer_Entry0 ENDPORT
var virServer_0_localip = "192.168.22.1";//VirServer_Entry0 LOCALIP
var virServer_0_localsport = "11";//VirServer_Entry0 LOCAL_SPORT
var virServer_0_localeport = "22";//VirServer_Entry0 LOCAL_EPORT
var virServer_1_startport = "3";
var virServer_1_endport = "4";
var virServer_1_localip = "192.168.22.2";
var virServer_1_localsport = "33";
var virServer_1_localeport = "44";
var virServer_2_startport = "5";
var virServer_2_endport = "6";
var virServer_2_localip = "192.168.22.3";
var virServer_2_localsport = "55";
var virServer_2_localeport = "66";*/
//////


//////
/*var lanhost0_ip = "192.168.29.1";
var lanhost6_ip = "192.168.29.7";*/
//////
var lanhost0_ip = "192.168.1.179";


function showSpin0(){
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

	var target = document.getElementById('firstDiv0');
	var spinner = new Spinner(opts).spin(target);
}

function showSpin1(){
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

	var target = document.getElementById('firstDiv1');
	var spinner = new Spinner(opts).spin(target);
}

function showSpin2(){
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

	var target = document.getElementById('firstDiv2');
	var spinner = new Spinner(opts).spin(target);
}

function chkRule(){
	var startP_Value = parseInt(document.NAT_form.start_port1.value);
	var endP_value = parseInt(document.NAT_form.end_port1.value);
	var localIP_value = document.NAT_form.Addr1.value.split(".");
	var edit_id = document.NAT_form.editnum.value;

	for(var i=0; i<tableData1.length; i++)
	{
		var edit_startP_value = parseInt(tableData1[i][1]);
		var edit_endP_value = parseInt(tableData1[i][2]);
		var edit_localIP_valueTmp = tableData1[i][3];
		var edit_localIP_value = edit_localIP_valueTmp.split(".");

		if((edit_id != i) && (isNaN(edit_startP_value) == 0)){
			if((Number(edit_localIP_value[0]) == Number(localIP_value[0])) &&
					(Number(edit_localIP_value[1]) == Number(localIP_value[1])) &&
					(Number(edit_localIP_value[2]) == Number(localIP_value[2])) &&
					(Number(edit_localIP_value[3]) == Number(localIP_value[3]))) 
			{
					if((edit_startP_value == startP_Value) && (edit_endP_value == endP_value))
					{
						alert("Invalid !! The same NAT rules");
						return true;
					}
			}
			else
			{
				if(!((startP_Value > edit_endP_value) || (endP_value < edit_startP_value)))
				{
					alert("Invalid !! One port should not be assigned to different IP address");
					return true;
				}
			}
		}
	}

	return false;
}


function chkPortRange()
{
	var port = parseInt(document.NAT_form.start_port1.value);
	var port1 = parseInt(document.NAT_form.end_port1.value);
	var port2 = parseInt(document.NAT_form.local_sport.value);
	var port3 = parseInt(document.NAT_form.local_eport.value);

	if (port > 65535 || port < 1 || port1 > 65535 || port1< 1 || isNaN(port) || isNaN(port1))
	{
		alert("The Port value must position between 1 to 65535.");
		return true;
	}
	if (port1 < port)
	{
		alert("End port must greater than Start port.");
		return true;
	}

	if(!(isNum(document.NAT_form.start_port1.value) && isNum(document.NAT_form.end_port1.value)))
	{
		alert("Maximal number of rules: 8; Available rules 0.");
		return true;
	}
	if (port2 > 65535 || port2 < 1 || port3 > 65535 || port3< 1 || isNaN(port2) || isNaN(port3))
	{
		alert("The Port value must position between 1 to 65535.");
		return true;
	}
	if (port3 < port2)
	{
		alert("End port must greater than Start port.");
		return true;
	}

	if(!(isNum(document.NAT_form.local_sport.value) && isNum(document.NAT_form.local_eport.value)))
	{
		alert("Maximal number of rules: 8; Available rules 0.");
		return true;
	}
	Sports = new Array(10);
	Eports = new Array(10);
	return false;
}

function DeleteVirSer(j){
	document.NAT_form.editnum.value = j;
	document.NAT_form.virsevFlag.value = 1;
	document.NAT_form.submit();
}


function showTableVir(id,header,data,keyIndex)
{
	var html = ["<table id=Virser_client_list border=0  cellpadding=1 cellspacing=0  bgcolor=#FFFFFF>"];
	// 1.generate table header
	html.push("<tr height=30px>");
	for(var i =0; i<header.length; i++){
		html.push("<td width=" + header[i][0] + " align=center class=tabdata>" +"<STRONG><FONT color=#000000>"+ header[i][1] +" </strong>"+ "</td>");
	}
	html.push("</tr>");
	// 2.generate table data

	for(var i =0; i<data.length; i++){
		if(data[i][keyIndex] != "N/A" && data[i][keyIndex] != ""){
			html.push("<tr height=30px id=tablebutton>");
			for(var j=0; j<(data[i].length - 1); j++){
				html.push("<td align=center class=topborderstyle>" + data[i][j] + "</td>");
			}
			html.push('<td align=center class=topborderstyle> <input class= "button3" TYPE="button" name="RemoveBtn" value="Remove" onClick=DeleteVirSer(' + data[i][j] + ');> </td>');

			html.push("</tr>");
		}
	}
	html.push("</table>");
	document.getElementById(id).innerHTML = html.join('');
}

function Add_virtualsvr() 
{
	if (chkPortRange())
		return;
	if(document.NAT_form.Virsvr_IP_select[0].selected == true)
	{
		if(inValidIPAddr(document.NAT_form.Addr1.value))
		{
			return;
		}
		else
		{
			document.NAT_form.VirsvrIPAddFlag.value = 1;
		}
	}

	for(var i=0; i<tableData1.length; i++){

		var Endport_value = tableData1[i][2];
		if(Endport_value == "N/A")
		{
			document.NAT_form.editnum.value = i;
			break;
		}
	}

	if(i == 32)
	{
		alert("The number is not positive integer!");
		return true;
	}

	if (chkRule())
		return;
	showSpin1();
	document.NAT_form.virsevFlag.value = 2;
	document.NAT_form.submit();
}

function showTableDMZ(id,header,data,keyIndex){
	var html = ["<table id=DMZ_client_list width=600 border=0  cellpadding=1 cellspacing=0 >"];
	// 1.generate table header
	html.push("<tr height=30px>");
	for(var i =0; i<header.length; i++){
		if(i < (header.length - 1))
			html.push("<td width=" + header[i][0]  + " align=left class=tabdata>" +"<STRONG><FONT color=#000000>" + header[i][1] +" </strong>"+ "</td>");    
		else
			html.push("<td width=" + header[i][0]  + " align=center class=tabdata>" +"<STRONG><FONT color=#000000>" + header[i][1] +" </strong>"+ "</td>");    
	}

	html.push("</tr>");
	// 2.generate table data
	for(var i =0; i<data.length; i++){
	//     alert("data[i][keyIndex] = " + data[i][keyIndex]);
		if(data[i][keyIndex] != "N/A" && data[i][keyIndex] != "" && data[i][keyIndex] != "0.0.0.0" && data[i][keyIndex] != "0" ){
			html.push("<tr height=30px id=tablebutton>");
			for(var j=0; j<(data[i].length - 1); j++){
				html.push("<td align=left class=topborderstyle>" + data[i][j] + "</td>");
			}
			html.push('<td align=center class=topborderstyle> <input class= "button3" TYPE="button" name="RemoveBtn" value="Remove" onClick=doDelete();> </td>');
			html.push("</tr>");
		}
	}
	html.push("</table>");
	document.getElementById(id).innerHTML = html.join('');
}

function doDelete()
{
	document.NAT_form.dmz_remove.value = 0;
	document.NAT_form.dmzFlag.value = 2;
	document.NAT_form.submit();
}

function doInactive() {
	if(document.NAT_form.dmz_active[0].checked)
	{
		document.getElementById("DMZ_active").style.display="";
	}
	else
	{
		document.getElementById("DMZ_active").style.display="none";
		document.NAT_form.dmzHostIP.value="0.0.0.0";
	}
}

function ApplyDMZ()
{
	if (document.NAT_form.dmz_active[0].checked)  
	{
		if(document.NAT_form.DMZ_IP_select[0].selected == true)
		{
			if(inValidIPAddr(document.NAT_form.dmzHostIP.value))
			{
				return;
			}
			else
			{
				document.NAT_form.IPAddFlag.value = 1;
			}
		}
	}

	if(document.NAT_form.dmz_active[1].checked)
	{
		document.NAT_form.dmz_remove.value = 0;
	}
	else
	{
		document.NAT_form.dmz_remove.value = 1;
	}

	showSpin0();
	document.NAT_form.dmzFlag.value = 1;
	document.NAT_form.submit();
}

function doNATtypeChange()
{
	if(document.NAT_form.NATtyleChange.selectedIndex == 0)
	{
		window.location='adv_nat_top.asp'; 
		/*document.getElementById("DMZ_selected").style.display="block";
		document.getElementById("virtual_selected").style.display="none";
		document.getElementById("Triggering_selected").style.display="none";
		doInactive();*/
	}
	else if(document.NAT_form.NATtyleChange.selectedIndex == 1)
	{
		//window.location='adv_nat_top_VirtualServer.asp';
		document.getElementById("virtual_selected").style.display="block";
		document.getElementById("DMZ_selected").style.display="none";
		document.getElementById("Triggering_selected").style.display="none";
		document.NAT_form.start_port1.value = "0";
		document.NAT_form.end_port1.value = "0";
		document.NAT_form.local_sport.value = "0";
		document.NAT_form.local_eport.value = "0";
		document.NAT_form.Addr1.value = "0.0.0.0";
	}
	else
	{
		window.location='adv_nat_top_PortTriggering.asp';
		/*document.getElementById("Triggering_selected").style.display="block";
		document.getElementById("DMZ_selected").style.display="none";
		document.getElementById("virtual_selected").style.display="none";*/
	}
	return;
}

function doload()
{
	//else if(document.NAT_form.NATtyleChange.selectedIndex == 1)
	if(document.NAT_form.NATtyleChange.selectedIndex == 0)
	{
		document.getElementById("DMZ_selected").style.display="block";
		document.getElementById("virtual_selected").style.display="none";
		document.getElementById("Triggering_selected").style.display="none";
		doInactive(); 
	}
	else if(document.NAT_form.NATtyleChange.selectedIndex == 1)
	{
		document.getElementById("virtual_selected").style.display="block";
		document.getElementById("DMZ_selected").style.display="none";
		document.getElementById("Triggering_selected").style.display="none";
		document.NAT_form.start_port1.value = "0";
		document.NAT_form.end_port1.value = "0";
		document.NAT_form.local_sport.value = "0";
		document.NAT_form.local_eport.value = "0";
		document.NAT_form.Addr1.value = "0.0.0.0";
	}
	//else(document.NAT_form.NATtyleChange.selectedIndex == 2)
	else if(document.NAT_form.NATtyleChange.selectedIndex == 2)
	{
		//document.NAT_form.PortTriggering_Applications.value = document.NAT_form.PortTriggering_App_idx.value ;

		//if(document.NAT_form.PortTriggering_App_idx.selectedIndex == 0)
		//{
		document.getElementById("Triggering_selected").style.display="block";
		document.getElementById("DMZ_selected").style.display="none";
		document.getElementById("virtual_selected").style.display="none";
		document.NAT_form.Trig_start_port.value="0";
		document.NAT_form.Trig_end_port.value="0";
		document.NAT_form.Open_start_port.value="0";
		document.NAT_form.Open_end_port.value="0";
	//}
	}
}

//port triggering start
function isNum(num){
	var reNum =/^\+?[1-9][0-9]*$/;
	return (reNum.test(num));
}

function chkTrigPortRange()
{
	var  port1 = parseInt(document.NAT_form.Trig_start_port.value);
	var  port2 = parseInt(document.NAT_form.Trig_end_port.value);
	var  port3 = parseInt(document.NAT_form.Open_start_port.value);
	var  port4 = parseInt(document.NAT_form.Open_end_port.value);

	if (port1 > 65535 || port1 < 1 || port2 > 65535 || port2 < 1 || isNaN(port1) || isNaN(port2)||
			port3 > 65535 || port3 < 1 || port4 > 65535 || port4 < 1 || isNaN(port3) || isNaN(port4))
	{
		alert("The Port value must position between 1 to 65535.");
		return true;
	}
	if (port2 < port1 || port4 < port3)
	{
		alert("End port must greater than Start port.");
		return true;
	}

	if(!(isNum(document.NAT_form.Trig_start_port.value) && isNum(document.NAT_form.Trig_end_port.value) &&
				isNum(document.NAT_form.Open_start_port.value) && isNum(document.NAT_form.Open_end_port.value)))
	{
		alert("The number is not positive integer!");
		return true;
	}

	return false;
}

function chkTrigRuleLimit()
{
	var  edit_Trig_id = document.NAT_form.editTrigNum.value;
	var  Trig_startP_value = parseInt(document.NAT_form.Trig_start_port.value);
	var  Trig_endP_vaule = parseInt(document.NAT_form.Trig_end_port.value);
	var  Trig_Ptcl_value = document.NAT_form.Trig_PtclChoose.value;
	var  Open_startP_value = parseInt(document.NAT_form.Open_start_port.value);
	var  Open_endP_value = parseInt(document.NAT_form.Open_end_port.value);
	var  Open_Ptcl_value = document.NAT_form.Open_PtclChange.value;


	for(var i=0; i<tableData2.length; i++){
		var table_Trig_startP = parseInt(tableData2[i][2]);
		var table_Trig_endP = parseInt(tableData2[i][3]);
		var table_Trig_Ptcl = tableData2[i][4];
		var table_Open_startP = parseInt(tableData2[i][5]);
		var table_Open_endP = parseInt(tableData2[i][6]);
		var table_Open_Ptcl = tableData2[i][7];
		var tcpudp = "TCP/UDP";

		if((edit_Trig_id != i) && (isNaN(table_Trig_startP) == 0))
		{
			if((Trig_startP_value == table_Trig_startP) && (Trig_endP_vaule == table_Trig_endP) &&
					(Open_startP_value == table_Open_startP) && (Open_endP_value == table_Open_endP))
			{
				if((Trig_Ptcl_value == table_Trig_Ptcl) && (Open_Ptcl_value == table_Open_Ptcl))
				{
					alert("Rule has been set,Please check!");
					return true;
				}
				else if(((table_Trig_Ptcl == tcpudp) && (table_Open_Ptcl == tcpudp))) 
				//((Trig_Ptcl_value == "TCP/UDP") && (table_Open_Ptcl == "TCP/UDP")) ||
				//((Open_Ptcl_value == "TCP/UDP") && (table_Trig_Ptcl == "TCP/UDP")) )
				//((Trig_Ptcl_value == "TCP/UDP") && (Open_Ptcl_value == "TCP/UDP"))) 
				{
					alert("Rule has been set,Please check!");
					return true;
				}
				else if((table_Trig_Ptcl == tcpudp) && (Open_Ptcl_value != tcpudp))
				{
					if(Open_Ptcl_value == table_Open_Ptcl)
					{
						alert("Rule has been set,Please check!");
						return true;
					}
				}
				else if((table_Open_Ptcl == tcpudp) && (Trig_Ptcl_value != tcpudp))
				{
					if(Trig_Ptcl_value == table_Trig_Ptcl)
					{
						alert("Rule has been set,Please check!");
						return true;
					}
				}
				else{
					return false;
				}
			}
		}
	}
}                          

function quotationCheck(object, limit_len) 
{
	var len = object.value.length;
	var c;
	var i, j = 0;
	if(!len)
	{
		alert("No Application Name!");
		return true;
	}
	for (i = 0; i < len; i++)
	{
		var c = object.value.charAt(i);
		if (c == '"')
		{
			j += 6;
		}
		else
		{
			j++;
		}
	}

	if (j > limit_len)
	{
		alert('too many quotation marks!');
		return true;
	}
	return false;
}


function showTableTrig(id2,header2,data2,keyIndex2)
{
	var html = ["<table id=Trig_client_list width=640 border=0  cellpadding=1 cellspacing=0 bgcolor=#FFFFFF>"];
	// 1.generate table header2
	html.push("<tr height=30px>");
	for(var i =0; i<header2.length; i++){
		html.push("<td width=" + header2[i][0] + " align=center class=tabdata>" +"<STRONG>" + header2[i][1] +" </strong>"+ "</td>");
	}
	html.push("</tr>");
	// 2.generate table data
	//      alert("data2.length = " + data2.length);
	for(var i =0; i<data2.length; i++){
		//      alert("i = " + i + "  data2[i][keyIndex2] = " + data2[i][keyIndex2]);
		if(data2[i][keyIndex2] != "N/A" && data2[i][keyIndex2] != ""){
			html.push("<tr height=30px id=tablebutton>");
			for(var j=0; j<(data2[i].length - 1); j++){
				html.push("<td align=center class=topborderstyle>" + data2[i][j] + "</td>");
			}
			html.push('<td align=center class=topborderstyle> <input class= "button3" TYPE="button" name="RemoveBtn" value="Remove" onClick=DeleteTrig(' + data2[i][j] + ');> </td>');

			html.push("</tr>");
		}
	}
	html.push("</table>");
	document.getElementById(id2).innerHTML = html.join('');
}

function DeleteTrig(j)
{
	document.NAT_form.editTrigNum.value = j;
	document.NAT_form.TrigFlag.value = 2;
	document.NAT_form.submit();
}


function addTrigRule(){
	if (chkTrigPortRange())
		return;  

	if (quotationCheck(document.forms[0].PortTriggering_Applications, 15) )
		return;         


	for(var i=0; i<tableData2.length; i++){
		var Endport_value = tableData2[i][2];
		if(Endport_value == "N/A")
		{
			document.NAT_form.editTrigNum.value = i;
			break;
		}
	}

	if(i == 8)
	{
		alert("Maximal number of rules: 8; Available rules 0.");
		return true;
	}

	if(chkTrigRuleLimit())
		return;

	showSpin2();
	document.NAT_form.TrigFlag.value = 1;
	document.NAT_form.submit();
}

function doIPaddressChange()
{
	if(document.NAT_form.DMZ_IP_select[0].selected == true)
	{
		document.getElementById("ManuallyIPAddr").style.display=""; 
		document.NAT_form.dmzHostIP.disabled = false;
	}
	else
	{
		document.getElementById("ManuallyIPAddr").style.display="none";
	} 
}

function doIPaddressChange1()
{
	if(document.NAT_form.Virsvr_IP_select[0].selected == true)
	{
		document.getElementById("ManuallyVirsvrIPAddr").style.display=""; 
		document.NAT_form.virsvrHostIP.disabled = false;
	}
	else
	{
		document.getElementById("ManuallyVirsvrIPAddr").style.display="none";
	} 
}
</script>
</head>
<body onload=doload() style="background:#4acbd6;">
<form name="NAT_form" method="post">
<input TYPE="hidden" name="natFlag" value="1">
<input TYPE="hidden" name="service_num_flag" value="0">
<input TYPE="hidden" name="dmzFlag" value="0">
<input TYPE="hidden" name="dmzdeactive" value="No">
<input TYPE="hidden" name="dmz_remove" value="0">

<div id="pagestyle">
<div id="contenttype">
<div id="block1" class="main_item">
<table width="640px" border="0"  cellpadding="0" cellspacing="0" style="table-layout: fixed;margin:5px 0;" bgcolor="#FFFFFF">
	<tr height="25px" style="width:100%;background:#e6e6e6;">
	<td align=left class="title-main" style="width:250px;padding-left:20px;"> Select IPv4 NAT Type  </td>
	</tr>
</table>

<table width="640px" border="0"  cellpadding="0" cellspacing="0" style="table-layout: fixed">
	<tr height="30px">
		<td align=left class="tabdata" style="width:250px;padding-left:20px;"> IPv4 NAT Type</td>
		<td align=left class="tabdata">
			<select name="NATtyleChange" size="1" onchange="doNATtypeChange()">
			<option value="0">DMZ 
			<option value="1" selected>Virtual Server 
			<option value="2">Port Triggering </option>
			</select>
		</td>
	</tr>
</table>
</div> <!--end id=block1-->

<div id="DMZ_selected">
<div id="block1" class="main_item">
<table width="640px" border="0"  cellpadding="0" cellspacing="0" style="table-layout: fixed;margin:5px 0;">
	<tr height="25px" style="width:100%;background:#e6e6e6;">
		<td align=left class="title-main" style="width:250px;padding-left:20px;"> Set DMZ State </td>
	</tr>
</table>

<table width="640" border="0" cellpadding="0" cellspacing="0" bgcolor="#FFFFFF" style="table-layout: fixed" >
	<tr height="30px">
		<td width="250px" align=left class="tabdata" style="padding-left:20px;"> DMZ State</td>
		<td align=left class="tabdata">
			<input name="dmz_active" type="radio" value="Yes"  onClick="doInactive()">
								 Enable&nbsp;&nbsp;&nbsp;&nbsp;
			<input name="dmz_active" type="radio" value="No"  checked onClick="doInactive()">    
				 Disable
		</td>
	</tr>
</table>
</div><!--end id=block2-->


<div id="DMZ_active" style="display:none;">

<div id="block1" class="main_item">
<table width="640px" border="0"  cellpadding="0" cellspacing="0" style="table-layout: fixed;margin:5px 0;">
<tr height="25px" style="width:100%;background:#e6e6e6;">
	<td align=left class="title-main" style="width:250px;padding-left:20px;"> Set DMZ Host IP Address</td>
</tr>
</table>

<table width="640" border="0" cellpadding="0" cellspacing="0" bgcolor="#FFFFFF" style="table-layout: fixed" >
	<tr height="30px">
		<td width="250px" align=left class="tabdata" style="padding-left:20px;"> DMZ Host IP</td>
		<input type="hidden" name="IPAddFlag" value="0">
		<td align=left class="tabdata">
			<SELECT name="DMZ_IP_select" SIZE="1" onchange="doIPaddressChange()">
				<OPTION value="0" selected >Manually Enter IP Address
			 
				<OPTION value="">
			 
			 
				<OPTION value="">
				
			 
				<OPTION value="">
				
				
				<OPTION value="">
				
				
				<OPTION value="">
				
				
				<OPTION value="">
				
				
				<OPTION value="">
				 
				
				<OPTION value="">
				        
			</SELECT>
		</td>
	</tr>
	<tr id="ManuallyIPAddr" height="30px">
		<td align=left class="tabdata" style="width:250px;padding-left:20px;">
			IP Address 
		</td>
		<td align=left class="tabdata">
			<input type="text" class="uiTextInput"  size="15" maxlength="15" name="dmzHostIP" id="uiViewdmzHostIP" value="" PLACEHOLDER="0.0.0.0">
		</td>
	</tr>
</table>
</div><!--end id=block2-->
</div>

<div id="block1" class="main_item">
<table width="640px" border="0"  cellpadding="0" cellspacing="0" style="table-layout: fixed;margin:5px 0;">
	<tr height="25px">
	<td align=left class="title-main" style="padding-left:20px;white-space:nowrap;">
		Click "Add" to save your settings </td>
	</tr>
</table>

<table width="640" border="0" cellpadding="0" cellspacing="0" bgcolor="#FFFFFF">
	<tr height="40" id="buttoncolor">
		<td width="250px" align=left class="tabdata" style="padding-left:20px;">
			<input TYPE="button" name="ApplyBtn" class="button1" value="Add" onClick="ApplyDMZ()">
		</td>
		<td id="firstDiv0" style="float:left;"></td>
	</tr> 
</table>
</div><!--end id=ApplyBtn0-->

<div id="block2" class="main_item">
<table width="640" border="0" cellpadding="0" cellspacing="0" bgcolor="#FFFFFF" style="table-layout: fixed;margin:5px 0;">
	<tr height="25px" style="width:100%;background:#e6e6e6;">
		<td class="title-main" align=left style="padding-left:20px;"> DMZ Hosted Device </td>
	</tr>
</table>

<table width="640" border="0" cellpadding="0" cellspacing="0" style="table-layout: fixed">
	<tr>
		<td align=left class="tabdata">
			<div class="configstyle">
			<div id=DMZconfigration></div>
			</div>
		</td>
	</tr>
</table>

<script language=JavaScript>
var tableHeader = [
	["200px","DMZ State"],
	["100px","IP Address"],
	["300px","Edit"]
];

var tableData = [
	["Enable","","0"]
];

showTableDMZ('DMZconfigration',tableHeader,tableData,1);

</script>
</table> 

</div><!--end block2-->
</div> <!--end id=DMZ_selected -->

<!-- virtual server start-->
<div id="virtual_selected" style="display:none;">
<div id="block1" class="main_item">
<table width="640px" border="0"  cellpadding="0" cellspacing="0" style="table-layout: fixed;margin:5px 0;">
	<tr height="25px" style="width:100%;background:#e6e6e6;">
		<td align=left class="title-main" style="width:250px;padding-left:20px;"> Setting Virtual Server </td>
	</tr>
</table>

<table width="640" border="0" cellpadding="0" cellspacing="0" bgcolor="#FFFFFF" >
	<tr height="30px">
		<td width="250px" align=left class="tabdata" style="padding-left:20px;"> Start External Port</td>
		<td align=left class="tabdata">
		<input type="text" size="5" maxlength="5" name="start_port1" value=""  id="uiViewPvcVpi1">
		</td>
	</tr>
	<tr height="30px">
		<td width="250px" align=left class="tabdata" style="padding-left:20px;"> End External Port</td>
		<td align=left class="tabdata">
		<input type="text" size="5" maxlength="5" value="" name="end_port1" id="uiViewPvcVpi2"></td>      
	</tr>
	<tr height="30px">
		<td width="250px" align=left class="tabdata" style="padding-left:20px;"> Local IP Address</td>
		<input type="hidden" name="VirsvrIPAddFlag" value="0">
		<td align=left class="tabdata">
			<SELECT name="Virsvr_IP_select" id="Virsvr_IP_select" SIZE="1" onchange="doIPaddressChange1()">
				<OPTION value="0" selected >Manually Enter IP Address
				<script>
					var index = 0;
					var lanhostNames = ['lanhost0_ip','lanhost1_ip','lanhost2_ip','lanhost3_ip','lanhost4_ip','lanhost5_ip','lanhost6_ip','lanhost7_ip'];
					for(index=0; index < lanhostNames.length; index++)
					{
						if(typeof window[lanhostNames[index]] !== 'undefined')
						{
							var option = document.createElement("option");
							option.value = window[lanhostNames[index]];
							//option.text = window[lanhostNames[index]];
							option.appendChild(document.createTextNode(window[lanhostNames[index]]));
							document.getElementById("Virsvr_IP_select").appendChild(option);
						}
					}
				</script>           
			</SELECT>
		</td>
	</tr>

	<tr id="ManuallyVirsvrIPAddr" height="30px">
		<td align=left class="tabdata" style="width:250px;padding-left:20px;">
		IP Address 
		</td>
		<td align=left class="tabdata">
			<input type="text" class="uiTextInput" size="16" maxlength="15" name="Addr1" id="uiViewIpAddressMark" value="" PLACEHOLDER="0.0.0.0">
		</td>
	</tr>

	<tr height="30px">
		<td width="250px" align=left class="tabdata" style="padding-left:20px;"> Start Internal Port</td>
		<td align=left class="tabdata">
			<input type="text" size="5" maxlength="5" name="local_sport" value=""></td>
	</tr>
		<tr height="30px">
		<td width="250px" align=left class="tabdata" style="padding-left:20px;"> End Internal Port</td>
		<td align=left class="tabdata">
			<input type="text" size="5" maxlength="5" name="local_eport" value=""></td>
	</tr>
</table>
</div><!--end id=block2-->

<div id="block1" class="main_item">
<table width="640px" border="0"  cellpadding="0" cellspacing="0" style="table-layout: fixed;margin:5px 0;" bgcolor="#FFFFFF">
	<tr height="25px">
		<td align=left class="title-main" style="padding-left:20px;white-space:nowrap;"> Click "Save" to save your settings </td>
	</tr>
</table>

<table width="640" border="0" cellpadding="0" cellspacing="0" bgcolor="#FFFFFF" >
	<tr height="30px" id="buttoncolor">
		<td width="250px" align=left class="tabdata" style="padding-left:20px;">
			<input TYPE="button" name="AddBtn" class="button1" value="Save" onClick="Add_virtualsvr()">
		</td>
		<td id="firstDiv1" style="float:left;"></td>
	</tr> 
</table>
</div>

<!--virtual server table start-->
<div id="block2"  class="main_item">
<table width="640" border="0" cellpadding="0" cellspacing="0" bgcolor="#FFFFFF" style="table-layout: fixed;margin:5px 0;">
	<tr height="25px" style="width:100%;background:#e6e6e6;">    <td class="title-main" align=left style="padding-left:20px;">
	Virtual Server List</td>
	</tr>
</table>

<table width="640" border="0" cellpadding="0" cellspacing="0" style="table-layout: fixed">
	<tr>
		<td align=left class="tabdata">
			<div class="configstyle">
			<div id=Virserconfigration></div>
			</div>
		</td>
	</tr>
</table>
<script language=JavaScript>
var tableHeader1 = [
	["30px","Rule"],
	["100px","Start External Port"],
	["100px","End External Port"],
	["140px","Local IP Address"],
	["100px","Start Internal Port"],
	["100px","End Internal Port"],
	["120px","Edit"]
];
/*
var virServer_1_src_dport = "11-12";
var virServer_1_dest_ip = "192.168.29.105";
var virServer_1_dest_port = "13-14";*/
var tableData1 = [];
var index = 0;

for(index = 0; index < 32; index++)
{
	if(typeof window['virServer_' + index + '_dest_ip'] !== 'undefined')
	{
		tableData1.push([(index+1).toString(),window['virServer_' + index + '_src_dport'].split("-")[0],window['virServer_' + index + '_src_dport'].split("-")[1],window['virServer_' + index + '_dest_ip'],window['virServer_' + index + '_dest_port'].split("-")[0],window['virServer_' + index + '_dest_port'].split("-")[1],index.toString()]);
	}
}

showTableVir('Virserconfigration',tableHeader1,tableData1,2);

</script>

</div><!--end class=cfglist-->
<!--virtual server table end-->

</div><!--end id=virtual_selected-->

<!--virtual server end-->

<!--Port Triggering  start -->
<div id= "Triggering_selected" style="display:none;">
<div id="block1" class="main_item">
<table width="640px" border="0"  cellpadding="0" cellspacing="0" style="table-layout: fixed;margin:5px 0;">
	<tr height="25px" style="width:100%;background:#e6e6e6;">
		<td align=left class="title-main" style="width:250px;padding-left:20px;"> Set an application name </td>
	</tr>
</table>

<table width="640" border="0" cellpadding="0" cellspacing="0" bgcolor="#FFFFFF" style="table-layout: fixed" >
	<tr height="30px">
		<td align=left class="tabdata" style="width:250px;padding-left:20px;"> Application</td>
		<td align=left class="tabdata">
			<input maxLength=15 size=15 name=PortTriggering_Applications value="">&nbsp;&nbsp; (length range:1~15) 
		</td>
	</tr>
</table>
</div><!--end id=block2-->

<div id="Customer_setting">
<div id="block1" class="main_item">
<table width="640px" border="0"  cellpadding="0" cellspacing="0" style="table-layout: fixed;margin:5px 0;">
	<tr height="25px" style="width:100%;background:#e6e6e6;">
		<td align=left class="title-main" style="width:250px;padding-left:20px;"> Set Triggering Port Range </td>
	</tr>
</table>

<table width="640" border="0" cellpadding="0" cellspacing="0" bgcolor="#FFFFFF" style="table-layout: fixed" >
	<tr height="30px">
		<td width="250px" align=left class="tabdata" style="padding-left:20px;"> Start Port</td>
		<td align=left class="tabdata">
			<input type="text" size="5" maxlength="5" name="Trig_start_port" value="">
		</td>
	</tr>
	<tr height="30px">
		<td width="250px" align=left class="tabdata" style="padding-left:20px;"> End Port</td>
		<td align=left class="tabdata">
			<input type="text" size="5" maxlength="5" name="Trig_end_port" value="">
		</td>
	</tr>
	<tr height="30px">
		<td width="250px" align=left class="tabdata" style="padding-left:20px;"> Protocol</td>
		<td align=left class="tabdata">
			<select name="Trig_PtclChoose" size="1" >
			<OPTION selected value="TCP/UDP">TCP/UDP
			<OPTION value="TCP">TCP
			<OPTION value="UDP">UDP
			</OPTION>
		</td>
	</tr>
</table>
</div><!--end id=block2--> 

<div id="block1" class="main_item">
<table width="640px" border="0"  cellpadding="0" cellspacing="0" style="table-layout: fixed;margin:5px 0;">

	<tr height="25px" style="width:100%;background:#e6e6e6;">
		<td align=left class="title-main" style="width:250px;padding-left:20px;"> Set Opening Port Range 
		</td>
	</tr>
</table>

<table width="640" border="0" cellpadding="0" cellspacing="0" bgcolor="#FFFFFF" style="table-layout: fixed" >
	<tr height="30px">
		<td width="250px" align=left class="tabdata" style="padding-left:20px;"> Start Port</td>
		<td align=left class="tabdata">
			<input type="text" size="5" maxlength="5" name="Open_start_port" value="">
		</td>
	</tr>
	<tr height="30px">
		<td width="250px" align=left class="tabdata" style="padding-left:20px;"> End Port</td>
		<td align=left class="tabdata">
			<input type="text" size="5" maxlength="5" name="Open_end_port" value="">
		</td>
	</tr>
	<tr height="30px">
		<td width="250px" align=left class="tabdata" style="padding-left:20px;"> Protocol</td>
		<td align=left class="tabdata">
			<select name="Open_PtclChange" size="1">
			<OPTION selected value="TCP/UDP">TCP/UDP
			<OPTION value="TCP">TCP
			<OPTION value="UDP">UDP
			</OPTION>
		</td>
	</tr>
</table>
</div><!--end id=block2-->
</div><!--end id="Customer_setting" -->

<div id="block1" class="main_item">
<table width="640px" border="0"  cellpadding="0" cellspacing="0" style="table-layout: fixed;margin:5px 0;" bgcolor="#FFFFFF">
	<tr height="25px">
		<td align=left class="title-main" style="padding-left:20px;white-space:nowrap;"> Click "Add" to save your settings </td>
	</tr>
</table>

<table width="640" border="0" cellpadding="0" cellspacing="0" bgcolor="#FFFFFF">
	<tr height="30px" id="buttoncolor">
		<td width="250px" align=left class="tabdata" style="padding-left:20px;">
			<input TYPE="button" name="AddBtn" class="button1" value="Add" onClick="addTrigRule()">
		</td>
		<td id="firstDiv2" style="float:left;"></td>
	</tr> 
</table>
</div><!--end id="ApplyBtn0"-->
<div class="main_item">
<table width="640" border="0" cellpadding="0" cellspacing="0" bgcolor="#FFFFFF" style="table-layout: fixed">
	<tr height="25px" style="width:100%;background:#e6e6e6;">
		<td class="title-main" align=left style="padding-left:20px;">
		Port Triggering List</td>
	</tr>
</table>

<table width="640" border="0" cellpadding="0" cellspacing="0" bgcolor="#FFFFFF" style="table-layout: fixed">
	<tr height="30px">
		<td align=left class="tabdata" width="180px"></td>
		<td align=left class="tabdata" width="195px"><STRONG><FONT color=#000000>Triggering Port Range</STRONG> </td>
		<td align=left class="tabdata" width="175px"><STRONG><FONT color=#000000>Opening Port Range</STRONG> </td>
		<td align=left class="tabdata" width="90px"></td>
	</tr>
</table>

<table width="600" border="0" cellpadding="0" cellspacing="0" style="table-layout: fixed;margin:5px 0;">
	<tr>
		<td align=left class="tabdata">
			 <div id=Virserconfigration></div>
		</td>
	</tr> 
</table>

<!--Port Triggering list start-->
<div id="block2">
<input TYPE="hidden" name="editTrigNum" value="0">
<input TYPE="hidden" name="TrigFlag" value="0">
<input type="hidden" value="" name=PortTriggering_CanUseNumFlag
<table width="600" border="0" cellpadding="0" cellspacing="0" style="table-layout: fixed">
<input TYPE="hidden" name="editnum" value="0">
<input TYPE="hidden" name="virsevFlag" value="0">
	<tr>
		<td align=left class="tabdata">
		<div id=porttriggeringCfg></div></td>
	</tr>
</table>
<script>
var tableHeader2 = [
	["10%","Rule"],
	["15%","Application"],
	["10%","Start Port"],
	["10%","End Port"],
	["10%","Protocol"],
	["10%","Start Port"],
	["10%","End Port"],
	["10%","Protocol"],
	["15%","Edit"]
];

var tableData2 = [
	["1", "","","","","","","","0"],
	["2", "","","","","","","","1"],
	["3", "","","","","","","","2"],
	["4", "","","","","","","","3"],
	["5", "","","","","","","","4"],
	["6", "","","","","","","","5"],
	["7", "","","","","","","","6"],
	["8", "","","","","","","","7"]
];

showTableTrig('porttriggeringCfg',tableHeader2,tableData2,2);

</script>
</div><!--end class="cfglist"-->
</div>
</div><!--end id=Triggering_selected-->
<!--Port Triggering  end-->

</div><!--end id=contenttype-->
</div><!--end id=pagestyle-->
</form>

<script>
/* FTC: Chặn cơ chế submit nhưng vẫn báo cho hệ thống chấm điểm biết đã lưu */
window.addEventListener('load', function() {
    var form = document.NAT_form;
    if (form) {
        // Chặn hành động reload trang khi form bị submit
        form.addEventListener('submit', function(e) {
            e.preventDefault();
        });
    }

    if (typeof window.Add_virtualsvr === 'function') {
        window.Add_virtualsvr = function() {
            if (typeof chkPortRange === 'function' && chkPortRange()) return;
            if (document.NAT_form.Virsvr_IP_select[0].selected == true) {
                if(typeof inValidIPAddr === 'function' && inValidIPAddr(document.NAT_form.Addr1.value)) {
                    return;
                }
            }
            if (typeof chkRule === 'function' && chkRule()) return;
            
            // Can thiệp thẳng vào cờ đánh dấu của Grading Engine
            document._ftcIsSaved = true;
        };
    }
});
</script>

</body>
</html>        
