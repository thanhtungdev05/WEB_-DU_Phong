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
<!--cindy add for  show cache image in webgui when click the "save" button 2019/02/15-->
<script type="text/javascript" src="/spin.js" ></script>
<!--cindy add for  show cache image in webgui when click the "save" button 2019/02/15-->
<link rel="stylesheet" type="text/css" href="/style.css">

<style  type="text/css">

*{color:  #404040;}

.tabletitlew
{
font:bold 13px Arial,Helvetica,sans-serif;
color:#FFFFFF;
}

</style>

<script language='javascript'>

//<!--cindy add for  show cache image in webgui when click the "save" button 2019/02/15-->
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
//<!--cindy add for  show cache image in webgui when click the "save" button 2019/02/15-->

//add for virtual server
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
		if((Number(edit_localIP_value[0]) == Number(localIP_value[0])) && (Number(edit_localIP_value[1]) == Number(localIP_value[1]))&&
	   		(Number(edit_localIP_value[2]) == Number(localIP_value[2])) && (Number(edit_localIP_value[3]) == Number(localIP_value[3]))) 
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
//cindy add internal port
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
//cindy add internal port
	Sports = new Array(10);
	Eports = new Array(10);
	return false;
}

function DeleteVirSer(j){
 	document.NAT_form.editnum.value = j;
	document.NAT_form.virsevFlag.value = 1;
	document.NAT_form.submit();

}


function showTableVir(id,header,data,keyIndex){
	var html = ["<table id=Virser_client_list border=0  cellpadding=1 cellspacing=0>"];
	// 1.generate table header
	html.push("<tr height=30px>");
	for(var i =0; i<header.length; i++){
		html.push("<td width=" + header[i][0] + " align=center class=tabdata>" +"<STRONG><FONT color=#000000>"+ header[i][1] +" </strong>"+ "</td>");
	}
	html.push("</tr>");
 	// 2.generate table data

 	for(var i =0; i<data.length; i++){
	//	alert("i = " + i + "  data[i][keyIndex] = " + data[i][keyIndex]);
		if(data[i][keyIndex] != "N/A" && data[i][keyIndex] != ""){
			html.push("<tr height=30px id=tablebutton>");
			for(var j=0; j<(data[i].length - 1); j++){
				html.push("<td align=center class=topborderstyle>" + data[i][j] + "</td>");
			}
			html.push('<td align=center class=topborderstyle> <INPUT class= "button3" TYPE="button" NAME="RemoveBtn" VALUE="Remove" onClick=DeleteVirSer(' + data[i][j] + ');> </td>');

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
	//gleaf modified begin
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
	
	/*if (inValidIPAddr(document.forms[0].Addr1.value))
		return;*/
	//gleaf modified end

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
	// FIX CHO GIẢ LẬP: Chặn submit form và update giao diện table
	var v_sport = document.NAT_form.start_port1.value;
	var v_eport = document.NAT_form.end_port1.value;
	var v_ip = document.NAT_form.Addr1.value;
	var v_lsport = document.NAT_form.local_sport.value;
	var v_leport = document.NAT_form.local_eport.value;
	
	if(document.NAT_form.Virsvr_IP_select.selectedIndex > 0) {
		v_ip = document.NAT_form.Virsvr_IP_select.options[document.NAT_form.Virsvr_IP_select.selectedIndex].text;
	}

	tableData1[i][1] = v_sport;
	tableData1[i][2] = v_eport;
	tableData1[i][3] = v_ip;
	tableData1[i][4] = v_lsport;
	tableData1[i][5] = v_leport;

	showTableVir('Virserconfigration', tableHeader1, tableData1, 2);
	try {
		localStorage.setItem('ftc_sim_portfwd', JSON.stringify({
			start_port1: v_sport,
			end_port1: v_eport,
			Addr1: v_ip,
			local_sport: v_lsport,
			local_eport: v_leport
		}));
	} catch (e) { }
	alert("Thêm cấu hình Virtual Server thành công!");
}

window.showTableVirtualServer = function(id, header, data, keyIndex) {
	showTableVir('Virserconfigration', header, data, keyIndex);
};
//virtual server add end

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
 //	alert("data[i][keyIndex] = " + data[i][keyIndex]);
		if(data[i][keyIndex] != "N/A" && data[i][keyIndex] != "" && data[i][keyIndex] != "0.0.0.0" && data[i][keyIndex] != "0" ){
			html.push("<tr height=30px id=tablebutton>");
			for(var j=0; j<(data[i].length - 1); j++){
				html.push("<td align=left class=topborderstyle>" + data[i][j] + "</td>");
			}
			html.push('<td align=center class=topborderstyle> <INPUT class= "button3" TYPE="button" NAME="RemoveBtn" VALUE="Remove" onClick=doDelete();> </td>');
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
 	document.NAT_form.saveFlag.value = 1;
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
	//gleaf modified begin
        /*if (document.NAT_form.dmz_active[0].checked && 
	inValidIPAddr(document.NAT_form.dmzHostIP.value))
	{		
				return;
	}*/

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
	//gleaf modified end

	if(document.NAT_form.dmz_active[1].checked)
	{
		document.NAT_form.dmz_remove.value = 0;
	}
	else
	{
		document.NAT_form.dmz_remove.value = 1;
	}
	
	showSpin0();//cindy add 
	document.NAT_form.dmzFlag.value = 1;
	document.NAT_form.saveFlag.value = 1;
	document.NAT_form.submit();
}

function doNATtypeChange()
{	
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
		//cindy add internal port
		document.NAT_form.local_sport.value = "0";
		document.NAT_form.local_eport.value = "0";
		//cindy add for internal port
        document.NAT_form.Addr1.value = "0.0.0.0";
	}
	else
	{
		document.getElementById("Triggering_selected").style.display="block";
		document.getElementById("DMZ_selected").style.display="none";
		document.getElementById("virtual_selected").style.display="none";	
	}
	return;
	
}
/*wang add end DMZ*/

function doload()
{
	//doNATtypeChange();
/*
	if(document.NAT_form.NATtyleChange.selectedIndex == 0)
	{
	    doInactive(); 
	}
*/
	//else if(document.NAT_form.NATtyleChange.selectedIndex == 1)
	 if(document.NAT_form.NATtyleChange.selectedIndex == 1)
	{
		document.NAT_form.start_port1.value = "0";
		document.NAT_form.end_port1.value = "0";
		//cindy add internal port
		document.NAT_form.local_sport.value = "0";
		document.NAT_form.local_eport.value = "0";
		//cindy add for internal port
        document.NAT_form.Addr1.value = "0.0.0.0";
	}
	//else(document.NAT_form.NATtyleChange.selectedIndex == 2)
	else if(document.NAT_form.NATtyleChange.selectedIndex == 2)
	{
		//document.NAT_form.PortTriggering_Applications.value = document.NAT_form.PortTriggering_App_idx.value ;
		
	   //if(document.NAT_form.PortTriggering_App_idx.selectedIndex == 0)
		//{
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
 
function chkTrigPortRange(){

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

	if(!(isNum(document.NAT_form.Trig_start_port.value) && isNum(document.NAT_form.Trig_end_port.value)
	   && isNum(document.NAT_form.Open_start_port.value) && isNum(document.NAT_form.Open_end_port.value)))
	{
		alert("The number is not positive integer!");
		return true;
	}
	
	return false;
}

//wang check whether the rules has been set
function chkTrigRuleLimit(){
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


function showTableTrig(id2,header2,data2,keyIndex2){
	var html = ["<table id=Trig_client_list width=600 border=0  cellpadding=1 cellspacing=0 >"];
	// 1.generate table header2
	html.push("<tr height=30px>");
	for(var i =0; i<header2.length; i++){
		html.push("<td width=" + header2[i][0] + " align=center class=tabdata>" +"<STRONG><FONT color=#000000>" + header2[i][1] +" </strong>"+ "</td>");
	}
	html.push("</tr>");
 	// 2.generate table data
//	alert("data2.length = " + data2.length);
 	for(var i =0; i<data2.length; i++){
	//	alert("i = " + i + "  data2[i][keyIndex2] = " + data2[i][keyIndex2]);
		if(data2[i][keyIndex2] != "N/A" && data2[i][keyIndex2] != ""){
			html.push("<tr height=30px id=tablebutton>");
			for(var j=0; j<(data2[i].length - 1); j++){
				html.push("<td align=center class=topborderstyle>" + data2[i][j] + "</td>");
			}
			html.push('<td align=center class=topborderstyle> <INPUT class= "button3" TYPE="button" NAME="RemoveBtn" VALUE="Remove" onClick=DeleteTrig(' + data2[i][j] + ');> </td>');

			html.push("</tr>");
		}
	}
	html.push("</table>");
	document.getElementById(id2).innerHTML = html.join('');
}

function DeleteTrig(j){
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
	
	showSpin2();//cindy add 
	document.NAT_form.TrigFlag.value = 1;
	document.NAT_form.submit();
}


/*
function doAppChange(selectIndex) 
{
//	ruleSetting(selectIndex);
   alert("PortTriggering_App_idx =  " + document.NAT_form.PortTriggering_App_idx.selectedIndex);
	document.NAT_form.PortTriggering_Applications.value = document.NAT_form.PortTriggering_App_idx.value ;

	var i = document.NAT_form.PortTriggering_App_idx.selectedIndex ;
	if(i == 0)
	{
		document.getElementById("Customer_setting").style.display="";	
	}
	else
	{
		document.getElementById("Customer_setting").style.display="none";
		//document.NAT_form.dmzHostIP.value="0.0.0.0"
		
	}		
}*/

//port triggering end


//gleaf add begin
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
//gleaf add end 
</script>
</head>
<body onload=doload()>
<form name="NAT_form" method="post">
<INPUT TYPE="HIDDEN" NAME="natFlag" VALUE="1">
<INPUT TYPE="HIDDEN" NAME="service_num_flag" VALUE="0">
<INPUT TYPE="HIDDEN" NAME="dmzFlag" VALUE="0">
<INPUT TYPE="HIDDEN" NAME="saveFlag" VALUE="0">
<INPUT TYPE="HIDDEN" NAME="dmzdeactive" VALUE="No">
<INPUT TYPE="HIDDEN" NAME="dmz_remove" VALUE="0">

<div id="pagestyle">
<div id="contenttype">
<div id="block1">
<table width="640px" border="0"  cellpadding="0" cellspacing="0" style="table-layout: fixed;margin:5px 0;">
<tr height="25px" style="width:100%;background:#e6e6e6;">		
<td align=left class="title-main" style="width:250px;padding-left:20px;"> Select IPv4 NAT Type  </td>
	</tr>
</table>
	
<table width="640px" border="0"  cellpadding="0" cellspacing="0" style="table-layout: fixed">
   <tr height="30px">
   <td align=left class="tabdata" style="width:250px;padding-left:20px;"> IPv4 NAT Type</td>
   <td align=left class="tabdata">
    <select name="NATtyleChange" size="1" onchange="doNATtypeChange()">
    <option value="0" selected>DMZ 
    <option value="1" >Virtual Server 
	<option value="2" >Port Triggering 
	</option>
	</select>
   </td>
  </tr>
</table>
</div> <!--end id=block1-->


<DIV id="DMZ_selected">

<div id="block1">
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


<DIV id="DMZ_active" style="display:none;">

<div id="block1">
<table width="640px" border="0"  cellpadding="0" cellspacing="0" style="table-layout: fixed;margin:5px 0;">
	<tr height="25px" style="width:100%;background:#e6e6e6;">		
		<td align=left class="title-main" style="width:250px;padding-left:20px;"> Set DMZ Host IP Address </td>
	</tr>
</table>	

<table width="640" border="0" cellpadding="0" cellspacing="0" bgcolor="#FFFFFF" style="table-layout: fixed" >		
	<tr height="30px">
		<td width="250px" align=left class="tabdata" style="padding-left:20px;"> DMZ Host IP </td>
		<!--gleaf begin-->
		<!--<td align=left class="tabdata">
			<input type="text" class="uiTextInput"  size="15" maxlength="15" name="dmzHostIP" id="uiViewdmzHostIP" VALUE="0.0.0.0">
		</td>-->    
		
		<input type="HIDDEN" name="IPAddFlag" value="0">
		<td align=left class="tabdata">
			<SELECT NAME="DMZ_IP_select" SIZE="1" onchange="doIPaddressChange()">
				<OPTION value="0" selected >Manually Enter IP Address
			        
			       
					<OPTION value="192.168.1.179">192.168.1.179
			       
			        
			       
				
			       
			       
			       
			       
			       
			       
			       
			       
			        
				
			               
			</SELECT>
		</td>
	</tr>

	<tr id="ManuallyIPAddr" height="30px">
		<td align=left class="tabdata" style="width:250px;padding-left:20px;">
			IP Address 
		</td>
		<td align=left class="tabdata">
			<input type="text" class="uiTextInput"  size="15" maxlength="15" name="dmzHostIP" id="uiViewdmzHostIP" VALUE="" PLACEHOLDER="0.0.0.0">
		</td>
	</tr>
	<!--gleaf end-->	
</table>
</div><!--end id=block2-->
</DIV>

<div id="block1">
<table width="640px" border="0"  cellpadding="0" cellspacing="0" style="table-layout: fixed;margin:5px 0;">
	<tr height="25px">		
	<td align=left class="title-main" style="padding-left:20px;white-space:nowrap;">
		 Click "Add" to save your settings </td>
	</tr>
</table>	

<table width="640" border="0" cellpadding="0" cellspacing="0" bgcolor="#FFFFFF">
  <tr height="40" id="buttoncolor">
    <td width="250px" align=left class="tabdata" style="padding-left:20px;">
		<INPUT TYPE="button" NAME="ApplyBtn" class="button1" VALUE="Add" onClick="ApplyDMZ()">
	</td>
	<td id="firstDiv0" style="float:left;"></td><!--cindy add for  show cache image in webgui when click the "save" button 2019/02/15-->
	</tr> 
</table>
</div><!--end id=ApplyBtn0-->

<div id="block2">
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
	["Enable","0.0.0.0","0"]
];


showTableDMZ('DMZconfigration',tableHeader,tableData,1);

</script>
</table> 

</div><!--end block2-->
</DIV> <!--end id=DMZ_selected -->


<!-- virtual server start-->

<DIV id="virtual_selected" style="display:none;">

<div id="block1">
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
	</tr>
		<tr height="30px">
		<td width="250px" align=left class="tabdata" style="padding-left:20px;"> End External Port </td>
		<td align=left class="tabdata">
			<input type="text" size="5" maxlength="5" value="" name="end_port1" id="uiViewPvcVpi2">       
	</tr>
		<tr height="30px">
		<td width="250px" align=left class="tabdata" style="padding-left:20px;"> Local IP Address</td>
		<!--gleaf begin-->
		<!--<td align=left class="tabdata">
			<input type="text" class="uiTextInput" size="16" maxlength="15" name="Addr1" id="uiViewIpAddressMark" value="">-->
		
		<input type="HIDDEN" name="VirsvrIPAddFlag" value="0">
		<td align=left class="tabdata">
			<SELECT NAME="Virsvr_IP_select" SIZE="1" onchange="doIPaddressChange1()">
				<OPTION value="0" selected >Manually Enter IP Address
			        
			       
					<OPTION value="192.168.1.179">192.168.1.179
			       
			        
			       
				
			       
			       
			       
			       
			       
			       
			       
			       
			        
				
			               
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

	<!--cindy add start for local port-->	
	<tr height="30px">
		<td width="250px" align=left class="tabdata" style="padding-left:20px;"> Start Internal Port</td>
		<td align=left class="tabdata">
			<input type="text" size="5" maxlength="5" name="local_sport" value="">       
	</tr>
		<tr height="30px">
		<td width="250px" align=left class="tabdata" style="padding-left:20px;"> End Internal Port </td>
		<td align=left class="tabdata">
			<input type="text" size="5" maxlength="5" name="local_eport" value="">       
	</tr>

	<!--cindy add end for local port-->	
	
	<!--gleaf end-->	
</table>	
</div><!--end id=block2-->

<div id="block1">
<table width="640px" border="0"  cellpadding="0" cellspacing="0" style="table-layout: fixed;margin:5px 0;">

	<tr height="25px">		
		<td align=left class="title-main" style="padding-left:20px;white-space:nowrap;"> Click "Add" to save your settings </td>
	</tr>
</table>	

<table width="640" border="0" cellpadding="0" cellspacing="0" bgcolor="#FFFFFF" >
	<tr height="30px" id="buttoncolor">
	<td width="250px" align=left class="tabdata" style="padding-left:20px;">
		<INPUT TYPE="button" NAME="AddBtn" class="button1" VALUE="Add" onClick="Add_virtualsvr()">
	</td>
	<td id="firstDiv1" style="float:left;"></td><!--cindy add for  show cache image in webgui when click the "save" button 2019/02/15-->
	</tr> 
</table>
</div>

<!--virtual server table start-->
<div id="block2" >
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
	["100px","End External Port "],
	["140px","Local IP Address"],
	["100px","Start Internal Port"],
	["100px","End Internal Port "],
	["120px","Edit"]
];

var tableData1 = [
	["1", "N/A","N/A","N/A","N/A","N/A","0"],
	["2", "N/A","N/A","N/A","N/A","N/A","1"],
	["3", "N/A","N/A","N/A","N/A","N/A","2"],
	["4", "N/A","N/A","N/A","N/A","N/A","3"],
	["5", "N/A","N/A","N/A","N/A","N/A","4"],
	["6", "N/A","N/A","N/A","N/A","N/A","5"],
	["7", "N/A","N/A","N/A","N/A","N/A","6"],
	["8", "N/A","N/A","N/A","N/A","N/A","7"],
	["9", "N/A","N/A","N/A","N/A","N/A","8"],
	["10", "N/A","N/A","N/A","N/A","N/A","9"],
	["11", "N/A","N/A","N/A","N/A","N/A","10"],
	["12", "N/A","N/A","N/A","N/A","N/A","11"],
	["13", "N/A","N/A","N/A","N/A","N/A","12"],
	["14", "N/A","N/A","N/A","N/A","N/A","13"],
	["15", "N/A","N/A","N/A","N/A","N/A","14"],
	["16", "N/A","N/A","N/A","N/A","N/A","15"],
	["17", "N/A","N/A","N/A","N/A","N/A","16"],
	["18", "N/A","N/A","N/A","N/A","N/A","17"],
	["19", "N/A","N/A","N/A","N/A","N/A","18"],
	["20", "N/A","N/A","N/A","N/A","N/A","19"],
	["21", "N/A","N/A","N/A","N/A","N/A","20"],
	["22", "N/A","N/A","N/A","N/A","N/A","21"],
	["23", "N/A","N/A","N/A","N/A","N/A","22"],
	["24", "N/A","N/A","N/A","N/A","N/A","23"],
	["25", "N/A","N/A","N/A","N/A","N/A","24"],
	["26", "N/A","N/A","N/A","N/A","N/A","25"],
	["27", "N/A","N/A","N/A","N/A","N/A","26"],
	["28", "N/A","N/A","N/A","N/A","N/A","27"],
	["29", "N/A","N/A","N/A","N/A","N/A","28"],
	["30", "N/A","N/A","N/A","N/A","N/A","29"],
	["31", "N/A","N/A","N/A","N/A","N/A","30"],
	["32", "N/A","N/A","N/A","N/A","N/A","31"]
];

showTableVir('Virserconfigration',tableHeader1,tableData1,2);

</script>

</div><!--end class=cfglist-->
<!--virtual server table end-->

</DIV><!--end id=virtual_selected-->

<!--virtual server end-->


<!--Port Triggering  start -->

<DIV id= "Triggering_selected" style="display:none;">

<div id="block1">
<table width="640px" border="0"  cellpadding="0" cellspacing="0" style="table-layout: fixed;margin:5px 0;">
	
	<tr height="25px" style="width:100%;background:#e6e6e6;">		
		<td align=left class="title-main" style="width:250px;padding-left:20px;"> Set an application name </td>
	</tr>
</table>	

<table width="640" border="0" cellpadding="0" cellspacing="0" bgcolor="#FFFFFF" style="table-layout: fixed" >	
  <tr height="30px">
   <td align=left class="tabdata" style="width:250px;padding-left:20px;"> Application</td>
   <td align=left class="tabdata">								
								<INPUT maxLength=15 size=15 name=PortTriggering_Applications value="">&nbsp;&nbsp; (length range:1~15) 
							<!--	<SELECT onchange=doAppChange(this.selectedIndex) size=1 name=PortTriggering_App_idx>
								<OPTION selected>User Setting
								<OPTION>Aim Talk
								<OPTION>Asheron's Call
								<OPTION>Calista IPPhone
								<OPTION>Delta Force
								<OPTION>ICQ
								<OPTION>Napster
								<OPTION>Net2Phone
								<OPTION>QuickTimeClient
								<OPTION>Rainbow 6 Game
								</OPTION>
								</SELECT> -->
	</td>
  </tr>
</table>	
</div><!--end id=block2-->

<div id="Customer_setting">
<div id="block1">
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
	</tr>
		<tr height="30px">
		<td width="250px" align=left class="tabdata" style="padding-left:20px;"> End Port</td>
		<td align=left class="tabdata">
			<input type="text" size="5" maxlength="5" name="Trig_end_port" value="">       
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

<div id="block1">
<table width="640px" border="0"  cellpadding="0" cellspacing="0" style="table-layout: fixed;margin:5px 0;">
	
	<tr height="25px" style="width:100%;background:#e6e6e6;">		
		<td align=left class="title-main" style="width:250px;padding-left:20px;"> Set Opening Port Range </td>
	</tr>
</table>	

<table width="640" border="0" cellpadding="0" cellspacing="0" bgcolor="#FFFFFF" style="table-layout: fixed" >	
	<tr height="30px">
		<td width="250px" align=left class="tabdata" style="padding-left:20px;"> Start Port</td>
		<td align=left class="tabdata">
			<input type="text" size="5" maxlength="5" name="Open_start_port" value="">       
	</tr>
		<tr height="30px">
		<td width="250px" align=left class="tabdata" style="padding-left:20px;"> End Port</td>
		<td align=left class="tabdata">
			<input type="text" size="5" maxlength="5" name="Open_end_port" value="">       
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

<div id="block1">
<table width="640px" border="0"  cellpadding="0" cellspacing="0" style="table-layout: fixed;margin:5px 0;">

	<tr height="25px">		
		<td align=left class="title-main" style="padding-left:20px;white-space:nowrap;"> Click "Add" to save your settings </td>
	</tr>
</table>	

<table width="640" border="0" cellpadding="0" cellspacing="0" bgcolor="#FFFFFF">
	<tr height="30px" id="buttoncolor">
	<td width="250px" align=left class="tabdata" style="padding-left:20px;">
		<INPUT TYPE="button" NAME="AddBtn" class="button1" VALUE="Add" onClick="addTrigRule()">
	</td>
	<td id="firstDiv2" style="float:left;"></td><!--cindy add for  show cache image in webgui when click the "save" button 2019/02/15-->
	</tr> 
</table>
</div><!--end id="ApplyBtn0"-->

<table width="640" border="0" cellpadding="0" cellspacing="0" bgcolor="#FFFFFF" style="table-layout: fixed">
	<tr height="25px" style="width:100%;background:#e6e6e6;">	
    <td class="title-main" align=left style="padding-left:20px;">
    Port Triggering List</td>
	</tr>
</table>

<table width="640" border="0" cellpadding="0" cellspacing="0" bgcolor="#FFFFFF" style="table-layout: fixed">
	<tr height="30px">
     <td align=left class="tabdata" width="165px"></td>
     <td align=left class="tabdata" width="200px"><STRONG><FONT color=#000000>Triggering Port Range</STRONG> </td>
     <td align=left class="tabdata" width="180px"><STRONG><FONT color=#000000>Opening Port Range</STRONG> </td>
     <td align=left class="tabdata" width="115px"></td>
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
<INPUT TYPE="HIDDEN" NAME="editTrigNum" value="0">
<INPUT TYPE="HIDDEN" NAME="TrigFlag" value="0">
<input type=hidden value="8" name=PortTriggering_CanUseNumFlag>
		
<table width="600" border="0" cellpadding="0" cellspacing="0" style="table-layout: fixed">
<INPUT TYPE="HIDDEN" NAME="editnum" value="0">
<INPUT TYPE="HIDDEN" NAME="virsevFlag" VALUE="0">
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
	
	["1", "N/A","N/A","N/A","N/A","N/A","N/A","N/A","0"],
	["2", "N/A","N/A","N/A","N/A","N/A","N/A","N/A","1"],
	["3", "N/A","N/A","N/A","N/A","N/A","N/A","N/A","2"],
	["4", "N/A","N/A","N/A","N/A","N/A","N/A","N/A","3"],
	["5", "N/A","N/A","N/A","N/A","N/A","N/A","N/A","4"],
	["6", "N/A","N/A","N/A","N/A","N/A","N/A","N/A","5"],
	["7", "N/A","N/A","N/A","N/A","N/A","N/A","N/A","6"],
	["8", "N/A","N/A","N/A","N/A","N/A","N/A","N/A","7"]
];

showTableTrig('porttriggeringCfg',tableHeader2,tableData2,2);

</script>
</div><!--end class="cfglist"-->
</DIV><!--end id=Triggering_selected-->
<!--Port Triggering  end-->

</div><!--end id=contenttype-->
</div><!--end id=pagestyle-->

		
			<table width="690" border="0" cellpadding="0" cellspacing="0">
				<tr height="30">
					<td width="20">&nbsp;</td>
					<td width="250">&nbsp;</td>
					<td width="420"></td>
				</tr>	
				<tr>
					<td align=center colSpan=3 style="background-color:transparent;font-family: Arial,Helvetica,sans-serif;"><font size=2>Copyright © 2019 FPT. All Rights Reserved.   </font></td>
				</tr>
				<tr height="10">
					<td width="20">&nbsp;</td>
					<td width="250">&nbsp;</td>
					<td width="420"></td>
				</tr>	
			</table>
		
</form>
</body>
</html>

<!-- BẮT ĐẦU SCRIPT CHẶN RELOAD TRANG KHI SAVE (TỰ ĐỘNG THÊM VÀO) -->
<script>
(function() {
    // Hàm hiển thị thông báo thành công giả lập
    function showFakeSaveMsg(formEl) {
        var target = document.getElementById('firstDiv') || document.getElementById('firstDiv0') || document.getElementById('firstDiv2') || document.getElementById('buttoncolor') || document.getElementById('button0');
        if (!target) {
            var btns = formEl ? formEl.querySelectorAll('.button1') : [];
            if (btns.length > 0) {
                target = document.createElement('span');
                btns[0].parentNode.insertBefore(target, btns[0].nextSibling);
            } else {
                target = document.body;
            }
        }
        if (!document.getElementById('fakeSaveMsg')) {
            var msg = document.createElement('span');
            msg.id = 'fakeSaveMsg';
            msg.style.color = '#15803d';
            msg.style.fontWeight = 'bold';
            msg.style.fontSize = '12px';
            msg.style.marginLeft = '10px';
            msg.style.lineHeight = '24px';
            target.appendChild(msg);
        }
        var msgEl = document.getElementById('fakeSaveMsg');
        msgEl.innerHTML = '✔ Saved successfully!';
        
        // Hiện spinner một chút cho giống thật
        if (typeof showSpin === 'function') {
            try { showSpin(); } catch(e){}
        } else if (typeof showSpin2 === 'function') {
            try { showSpin2(); } catch(e){}
        }
        
        setTimeout(function() {
            msgEl.innerHTML = '';
        }, 2500);

        // BÁO CÁO RA PORTAL (duyệt lên qua frameset để tìm đúng portal)
        try {
            var w = window;
            for (var i = 0; i < 10; i++) {
                if (w.onSimulatorSave) {
                    w.onSimulatorSave(window);
                    break;
                }
                if (w === w.parent) break;
                w = w.parent;
            }
        } catch(e) {}
    }

    // 1. Chặn submit HTML native (các nút <input type="submit">)
    document.addEventListener('submit', function(e) {
        e.preventDefault();
        showFakeSaveMsg(e.target);
    });

    // 2. Chặn submit bằng JS (document.form.submit())
    if (typeof HTMLFormElement !== 'undefined') {
        var originalSubmit = HTMLFormElement.prototype.submit;
        HTMLFormElement.prototype.submit = function() {
            showFakeSaveMsg(this);
        };
    }
})();
</script>
<!-- KẾT THÚC SCRIPT CHẶN RELOAD -->
