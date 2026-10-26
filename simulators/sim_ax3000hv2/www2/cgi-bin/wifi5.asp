

<!DOCTYPE html PUBLIC "-//W3C//DTD XHTML 1.0 Transitional//EN" "http://www.w3.org/TR/xhtml1/DTD/xhtml1-transitional.dtd">
<html xmlns="http://www.w3.org/1999/xhtml" xml:lang="utf-8" dir="ltr" lang="utf-8">
<head>
<meta http-equiv="X-UA-Compatible" content="IE=11;IE=10;IE=9; IE=8; IE=7; IE=EDGE">
<meta http-equiv=Content-Script-Type content=text/javascript>
<meta http-equiv=Content-Style-Type content=text/css>
<meta http-equiv=Content-Type content="text/html; charset=UTF-8">
<!--<script language="JavaScript" src="OutVariant.asp"></script>-->
<link rel="stylesheet" type="text/css" href="/style.css">
<style  type="text/css">
*{color:  #404040;}
</style>
</head>

<script type="text/javascript" src="/spin.js" ></script>
<script language="JavaScript">
//////
/*
var apon_2g = "1";//WLan_Common APOn wireless.radio0.disabled
var apon_5g = "1";//WLan11ac_Common APOn wireless.radio1.disabled
var wifi5_enable_2g = "1";//WLan_Entry4 EnableSSID
var wifi5_ssid_2g = "wifi5-2g";//WLan_Entry4 SSID
var wifi5_psk_2g = "12345678";//WLan_Entry4 WPAPSK
var wifi5_enable_5g = "1";//WLan11ac_Entry4 EnableSSID
var wifi5_ssid_5g = "wifi5-5g";//WLan11ac_Entry4 SSID
var wifi5_psk_5g = "12345678";//WLan11ac_Entry4 WPAPSK
*/
//////
var apon_2g = "1";
var apon_5g = "1";
var wifi5_enable_2g = "0";
var wifi5_hideSSID_2g = "0";
var wifi5_ssid_2g = "FPT Telecom\-1691 \- IoT";
var wifi5_psk_2g = "24BA7659";
var wifi5_enable_5g = "0";
var wifi5_hideSSID_5g = "0";
var wifi5_ssid_5g = "FPT Telecom\-1691 \- IoT";
var wifi5_psk_5g = "24BA7659";

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

function wifi5Switch_2g(on_off)
{      
	if(on_off)
		document.getElementById("wifi5_2G_active").style.display="block";
	else
		document.getElementById("wifi5_2G_active").style.display="none";
}
function wifi5Switch_5g(on_off)
{      
	if(on_off)
		document.getElementById("wifi5_5G_active").style.display="block";
	else
		document.getElementById("wifi5_5G_active").style.display="none";
}

function doHexCheck(c)
{
	if ((c >= "0")&&(c <= "9"))
	{
		return 1;
	}
	else if ((c >= "A")&&(c <= "F"))
	{
		return 1;
	}
	else if ((c >= "a")&&(c <= "f"))
	{
		return 1;
	}

	return -1;
}

function wpapskCheck(object)
{
	var keyvalue=object.value;
	var wpapsklen=object.value.length;

	if(wpapsklen >= 8 && wpapsklen < 64)
	{
		if(keyvalue.match(/[^\x00-\xff]/g))
		{
			alert("Pre-Shared Key should be between 8 and 63 ASCII characters or 64 Hex string.");
			return true;
		}
	}
	else if(wpapsklen==64)
	{
		for(i=0;i<64;i++)
		{
			var c=keyvalue.charAt(i);
			if(doHexCheck(c)<0)
			{
				alert("Pre-Shared Key Hex value error!");
				return true;
			}
		}
	}
	else 
	{
		alert("Pre-Shared Key length error!");
		return true;
	}
	return false;
}

function strESSIDCheck(str) {
if(str.value.match(/[^\x00-\xff]/g)){
	alert("Invalid SSID Input!");
	return true;
}
return false;
}

function checkSubmit()
{
	var is2G = (document.wifi5_form.Enable_Wifi5_2G.value == 1 || (document.wifi5_form.Enable_Wifi5_2G[0] && document.wifi5_form.Enable_Wifi5_2G[0].checked));
	var is5G = (document.wifi5_form.Enable_Wifi5_5G.value == 1 || (document.wifi5_form.Enable_Wifi5_5G[0] && document.wifi5_form.Enable_Wifi5_5G[0].checked));

	if (is2G && wpapskCheck(document.wifi5_form.wifi5Pwd_2G)){
		return false;
	}
	if (is5G && wpapskCheck(document.wifi5_form.wifi5Pwd_5G)){
		return false;
	}
	if((is2G && document.wifi5_form.wifi5SSid_2G.value.length <= 0)
		|| (is5G && document.wifi5_form.wifi5SSid_5G.value.length <= 0 )){
		alert("SSID is empty");
		return false;
	}
	
	if(is2G && (strESSIDCheck(document.wifi5_form.wifi5SSid_2G)))
	{
	    return false;
	}
	
	if(is5G && (strESSIDCheck(document.wifi5_form.wifi5SSid_5G)))
	{
	    return false;
	}
	//showSpin();
	document.wifi5_form.SaveFlag.value = 1;
	var org_enable_2g = wifi5_enable_2g;
	var org_enable_5g = wifi5_enable_5g;
	if(document.wifi5_form.Enable_Wifi5_2G.value != org_enable_2g)
	{
		document.wifi5_form.is_2g_change.value = 1;
	}
	else
	{
		if(document.wifi5_form.Enable_Wifi5_2G.value == 1)
		{
			var org_hidden_2g = wifi5_hideSSID_2g;
			var org_ssid_2g = wifi5_ssid_2g;
			var org_pwd_2g = wifi5_psk_2g;
			if(document.wifi5_form.wifi5SSid_2G.value != org_ssid_2g || document.wifi5_form.wifi5Pwd_2G.value != org_pwd_2g || document.wifi5_form.ESSID_HIDE_Selection_2G.value != org_hidden_2g)
			{
				document.wifi5_form.is_2g_change.value = 1;
			}
		}
	}

	if(document.wifi5_form.Enable_Wifi5_5G.value != org_enable_5g)
	{
		document.wifi5_form.is_5g_change.value = 1;
	}
	else
	{
		if(document.wifi5_form.Enable_Wifi5_5G.value == 1)
		{
			var org_hidden_5g = wifi5_hideSSID_5g;
			var org_ssid_5g = wifi5_ssid_5g;
			var org_pwd_5g = wifi5_psk_5g;
			if(document.wifi5_form.wifi5SSid_5G.value != org_ssid_5g || document.wifi5_form.wifi5Pwd_5G.value != org_pwd_5g || document.wifi5_form.ESSID_HIDE_Selection_5G.value != org_hidden_5g)
			{
				document.wifi5_form.is_5g_change.value = 1;
			}
		}
	}
	
	document.wifi5_form.submit();
}

function doLoad()
{
	var waitMessage = document.getElementById("waiting_div");
	if(waitMessage)
		waitMessage.style.display = "none";
	if(apon_2g == "0") {
		document.wifi5_form.Enable_Wifi5_2G[0].disabled = true;
		document.wifi5_form.Enable_Wifi5_2G[1].disabled = true;
		document.wifi5_form.Enable_Wifi5_2G[0].checked = false;
		document.wifi5_form.Enable_Wifi5_2G[1].checked = true;
		document.getElementById("wifi5_2G_active").style.display="none";
	}
	if(apon_5g == "0") {
		document.wifi5_form.Enable_Wifi5_5G[0].disabled = true;
		document.wifi5_form.Enable_Wifi5_5G[1].disabled = true;
		document.wifi5_form.Enable_Wifi5_5G[0].checked = false;
		document.wifi5_form.Enable_Wifi5_5G[1].checked = true;
		document.getElementById("wifi5_5G_active").style.display="none";
	}
}
</script>

<body onLoad="doLoad()" style="background:#4acbd6;">
	<form method="post" action="/cgi-bin/wifi5.asp" name="wifi5_form">
		<div id="pagestyle">
		<div id="contenttype">
				<div id="block1">
				<div class="main_item">
						<table width="640" border="0"  cellpadding="0" cellspacing="0" bgcolor="#FFFFFF" class="tabdata" style="margin:5px 0px;">
							<tr height="25px" style="width:100%;background:#e6e6e6;">
								<td  align="left" class="title-main" style="padding-left:20px;">2.4G WiFi5</td>
							</tr>
						</table>
						<table width="640" border="0"  cellpadding="0" cellspacing="0" bgcolor="#FFFFFF" class="tabdata" >
							<tr height="30px">
								<td width="250px" align=left class="tabdata" style="padding-left:20px;">2.4G WiFi5</td>
								<td align=left class="tabdata">
									<input type="radio" name="Enable_Wifi5_2G" onClick="wifi5Switch_2g(1)" value="1">
									Enable 
									&nbsp;&nbsp;&nbsp;&nbsp;
									<input type="radio" name="Enable_Wifi5_2G"  onClick="wifi5Switch_2g(0)"value="0">       
									Disable 
									<script>
									if (wifi5_enable_2g == "1") {
										document.getElementsByName("Enable_Wifi5_2G")[0].checked = true;
										document.getElementsByName("Enable_Wifi5_2G")[1].checked = false;
									} else {
										document.getElementsByName("Enable_Wifi5_2G")[0].checked = false;
										document.getElementsByName("Enable_Wifi5_2G")[1].checked = true;
									}
									</script>
								</td>
							</tr>
						</table>
					<div id="wifi5_2G_active" >
					<script>
					if(wifi5_enable_2g == "1")
						document.getElementById("wifi5_2G_active").style.display = "";
					else
						document.getElementById("wifi5_2G_active").style.display = "none";
					</script>
						<table width="640" border="0"  cellpadding="0" cellspacing="0" bgcolor="#FFFFFF" class="tabdata" >
							<tr height="30px">
								<td width="250px" align=left class="tabdata" style="padding-left:20px;">SSID Broadcast State</td>
								<td align=left class="tabdata">
									<input type="radio" name="ESSID_HIDE_Selection_2G" value="0">
									Enable
									&nbsp;&nbsp;&nbsp;&nbsp;
									<input type="radio" name="ESSID_HIDE_Selection_2G" value="1">
									Disable
								</td>
								<script>
								if (wifi5_hideSSID_2g == "0") {
									document.getElementsByName("ESSID_HIDE_Selection_2G")[0].checked = true;
									document.getElementsByName("ESSID_HIDE_Selection_2G")[1].checked = false;
								} else {
									document.getElementsByName("ESSID_HIDE_Selection_2G")[0].checked = false;
									document.getElementsByName("ESSID_HIDE_Selection_2G")[1].checked = true;
								}
								</script>
							</tr>
							<tr height="30px">
								<td width="250px" align=left class="tabdata" style="padding-left:20px;">SSID Name</td>
								<td align=left class="tabdata">
									<input type="text" name="wifi5SSid_2G" id="wifi5SSid_2G" size="35" maxlength="32">
									<script>
									document.getElementById("wifi5SSid_2G").value = wifi5_ssid_2g;
									</script>
								</td>
							</tr>
							<tr height="30px">
								<td width="250px" align=left class="tabdata" style="padding-left:20px;">Security Passphrase</td>
								<td align=left class="tabdata">
									<input type="text" name="wifi5Pwd_2G" id="wifi5Pwd_2G" size="35" maxlength="64" onBlur="wpapskCheck(this)">(8~63 characters or 64 Hex string)
									<script>
									document.getElementById("wifi5Pwd_2G").value = wifi5_psk_2g;
									</script>
								</td>
							</tr>
						</table>
					</div>
					<table width="640" border="0"  cellpadding="0" cellspacing="0" bgcolor="#FFFFFF" class="tabdata" style="margin:5px 0px;">
							<tr height="25px" style="width:100%;background:#e6e6e6;">
								<td  align="left" class="title-main" style="padding-left:20px;">5G WiFi5</td>
							</tr>
						</table>
						<table width="640" border="0"  cellpadding="0" cellspacing="0" bgcolor="#FFFFFF" class="tabdata" >
							<tr height="30px">
								<td width="250px" align=left class="tabdata" style="padding-left:20px;">5G WiFi5</td>
								<td align=left class="tabdata">
									<input type="radio" name="Enable_Wifi5_5G" onClick="wifi5Switch_5g(1)" value="1">
									Enable
									&nbsp;&nbsp;&nbsp;&nbsp;
									<input type="radio" name="Enable_Wifi5_5G"  onClick="wifi5Switch_5g(0)" value="0">
									Disable  
									<script>
									if (wifi5_enable_5g == "1") {
										document.getElementsByName("Enable_Wifi5_5G")[0].checked = true;
										document.getElementsByName("Enable_Wifi5_5G")[1].checked = false;
									} else {
										document.getElementsByName("Enable_Wifi5_5G")[0].checked = false;
										document.getElementsByName("Enable_Wifi5_5G")[1].checked = true;
									}
									</script>
								</td>
							</tr>
						</table>
					<div id="wifi5_5G_active" >
					<script>
					if(wifi5_enable_5g == "1")
						document.getElementById("wifi5_5G_active").style.display = "";
					else
						document.getElementById("wifi5_5G_active").style.display = "none";
					</script>
						<table width="640" border="0"  cellpadding="0" cellspacing="0" bgcolor="#FFFFFF" class="tabdata" >
							<tr height="30px">
								<td width="250px" align=left class="tabdata" style="padding-left:20px;">SSID Broadcast State</td>
								<td align=left class="tabdata">
									<input type="radio" name="ESSID_HIDE_Selection_5G" value="0">
									Enable
									&nbsp;&nbsp;&nbsp;&nbsp;
									<input type="radio" name="ESSID_HIDE_Selection_5G" value="1">
									Disable
								</td>
								<script>
								if (wifi5_hideSSID_5g == "0") {
									document.getElementsByName("ESSID_HIDE_Selection_5G")[0].checked = true;
									document.getElementsByName("ESSID_HIDE_Selection_5G")[1].checked = false;
								} else {
									document.getElementsByName("ESSID_HIDE_Selection_5G")[0].checked = false;
									document.getElementsByName("ESSID_HIDE_Selection_5G")[1].checked = true;
								}
								</script>
							</tr>
							<tr height="30px">
								<td width="250px" align=left class="tabdata" style="padding-left:20px;">SSID Name</td>
								<td align=left class="tabdata">
									<input type="text" name="wifi5SSid_5G" id="wifi5SSid_5G" size="35" maxlength="32">
									<script>
									document.getElementById("wifi5SSid_5G").value = wifi5_ssid_5g;
									</script>
								</td>
							</tr>
							<tr height="30px">
								<td width="250px" align=left class="tabdata" style="padding-left:20px;">Security Passphrase</td>
								<td align=left class="tabdata">
									<input type="text" name="wifi5Pwd_5G" id="wifi5Pwd_5G" size="35" maxlength="64" onBlur="wpapskCheck(this)">(8~63 characters or 64 Hex string)
									<script>
									document.getElementById("wifi5Pwd_5G").value = wifi5_psk_5g;
									</script>
								</td>
							</tr>
						</table>
					</div>
		</div><!--block1-->

		<div id="button0" class="main_item">
			<table width="640" border="0" cellpadding="0" cellspacing="0" bgcolor="#FFFFFF" class="tabdata" style="margin:5px 0px;">
				<tr height="25px">
					<td  align=left class="title-main" style="white-space:nowrap;padding-left:20px;">Click "Save" to save your settings</td>
				</tr>
			</table>
			<table width="640" border="0" cellpadding="0" cellspacing="0" bgcolor="#FFFFFF" class="tabdata" >
				<tr height="40px">
					<td colspan="2" align=left class="tabdata" style="padding-left:20px;">
						<input type="submit" name="SaveBtn" class="button1" value="Save" onClick=" return checkSubmit()">
						<input type="hidden" name="SaveFlag" value="0">
						<input type="hidden" name="is_2g_change" value="0">
						<input type="hidden" name="is_5g_change" value="0">
					</td>
					<td id="firstDiv" style="float:left;"></td>
				</tr>
			</table>
		</div>
		</div>
		</div>
	</form>
</body>
</html>
