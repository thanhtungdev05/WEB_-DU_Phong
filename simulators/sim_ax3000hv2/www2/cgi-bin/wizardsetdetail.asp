<html>

<head>
	<title></title>
	<meta http-equiv=Content-Script-Type content=text/javascript>
	<meta http-equiv=Content-Style-Type content=text/css>
	<meta http-equiv=Content-Type content="text/html; charset=iso-8859-1">
	<link rel="stylesheet" href="/style.css" type="text/css">
	<script type='text/javascript' src="/jsl.js"></script>
	<style type="text/css"></style>
	<script>
		var orgPwd="50E3598CBA";
var timezone="GMT+10:00";
var wan_vlanid_var = "";
var wan_dot1q_var = "No";
var wan_pvc0_entry0_ISP="2";
var wan_pvc0_entry0_name="fpt";
var wan_pvc0_entry0_pwd="fpt";

		var step_num = 0;
		/****** step 1 ******/
		function step1_save()//username and pwd of login
		{
			if (document.wzSetform.uiViewPassword.value.length == 0) {
				alert("Empty Password Invaild.");
				return -1;
			}

			var password = document.wzSetform.uiViewPassword.value;

			for (var i = 0; i < password.length; i++) {
				var ascNum = password.charCodeAt(i);
				if (ascNum < 33 || ascNum > 126 || ascNum == 59) {
					alert("Password Invalid.The password can not contain semicolon(;) !!");
					return -1;
				}
			}

			if (document.wzSetform.uiViewPassword.value != document.wzSetform.uiViewPasswordConfirm.value) {
				alert("Your Password and Confirm Password must match before you can apply.");
				return -1;
			}

			if (quotationCheck(document.forms[0].uiViewPassword, 30))
				return -1;
			if (document.wzSetform.uiViewPassword.value != orgPwd)
				document.wzSetform.isPwdChanged.value = 1;
			return 0;
		}

		function quotationCheck(object, limit_len) {
			var len = object.value.length;
			var c;
			var i, j = 0;

			for (i = 0; i < len; i++) {
				var c = object.value.charAt(i);

				if (c == '"') {
					j += 6;
				}
				else
					j++;
			}

			if (j > limit_len) {
				alert('Input too many character,double quotation marks(") will be count as 6 characters(&quot;)!!');
				return true;
			}
			return false;
		}
		/******step 3 ******/
		function step3_save()//8021q
		{
			if ((document.wzSetform.wan_8021q.value == 1) && (document.wzSetform.disp_wan_8021q.value == 1)) {
				document.wzSetform.wan8021qFlag.value = 1;
			}

			if (document.wzSetform.wan_dot1q[0].checked) {
				var value = document.wzSetform.wan_vid.value;

				if (!isNumeric(value)) {
					alert("VLANID must be in the range 0~4095");
					return -1;
				}

				if (parseInt(value) > 4095 || parseInt(value) < 0) {
					alert("VLANID must be in the range 0~4095");
					return -1;
				}
			}
			return 0;
		}
		function wanVidOper(onOff) {
			var value;

			if (onOff != 1)
				value = true;
			else
				value = false;

			document.wzSetform.wan_vid.disabled = value;
		}
		function wan8021QCheck() {
			var form = document.wzSetform;

			if ((form.wan_8021q.value == 1) && (form.disp_wan_8021q.value == 1)) {
				if (!form.wan_dot1q[0].checked) {
					wanVidOper(0);//disabled vlan id controls
				}
			}
		}
		function isNumeric(s) {
			var len = s.length;
			var ch;

			if (len == 0)
				return false;

			for (i = 0; i < len; i++) {
				ch = s.charAt(i);
				if (ch > '9' || ch < '0') {
					return false;
				}
			}
			return true;
		}
		/******step 5******/
		function step5_save()///username and pwd of pppoe
		{
			if (document.wzSetform.uiViewUserNameMark.value.length <= 0 || document.wzSetform.uiViewPasswordMark.value.length <= 0) {
				alert("please input username and password");
				return -1;
			}

			if (isValidNameEx(document.wzSetform.uiViewUserNameMark.value) == false) {
				alert("username invalid!");
				return -1;
			}
			if (isValidNameEx(document.wzSetform.uiViewPasswordMark.value) == false) {
				alert("password invalid!");
				return -1;
			}
			return 0;
		}

		function isValidNameEx(name) {
			var i = 0;

			for (i = 0; i < name.length; i++) {
				if (isNameUnsafeEx(name.charAt(i)) == true) {
					return false;
				}
			}

			return true;
		}

		function isNameUnsafeEx(compareChar) {
			if (compareChar.charCodeAt(0) > 32
				&& compareChar.charCodeAt(0) < 127)
				return false; // found no unsafe chars, return false
			else
				return true;
		}

		function pvcDoValidatePage() {
			var value;
			var message;
			value = document.wzSetform.uiViewPvcVpi.value;

			if (!isNumeric(value)) {
				alert("Input for VPI has to be an integer");
				return false;
			}
			else if (Number(value) > 255 || Number(value) < 0) {
				alert("VPI must be in the range 0-255");
				return false;
			}

			value = document.wzSetform.uiViewPvcVci.value;

			if (!isNumeric(value)) {
				alert("Input for VCI has to be an integer");
				return false;
			}
			else if (Number(value) > 65535 || Number(value) < 32) {
				alert("VCI must be in the range 32-65535");
				return false;
			}
			return true;
		}
		/*****exit*******/
		function ExitWizard() {
			if (confirm("Quit setup wizard and discard settings ?")) {
				window.parent.close();
			}
		}
		/******next step******/
		function next_step() {
			if (step_num == 6) {
				document.wzSetform.submit();
				return;
			}

			//check
			var ret = 0;
			if (step_num == 1) {
				ret = step1_save();
				step_num++;//add for hide time zone setting
			} else if (step_num == 3)
				ret = step3_save();
			else if (step_num == 5)
				ret = step5_save();
			if (ret == -1)
				return;

			step_num = step_num + 1;
			show_detail();
		}
		/******back step******/
		function back_step() {
			if (step_num > 0)
				step_num = step_num - 1;
			if (step_num == 2)
				step_num--;//add for hide time zone setting
			show_detail();
		}
		function show_detail() {
			var i = 0;
			var div_id = "";
			for (i = 0; i < 7; i++) {
				div_id = "";
				div_id = "step_" + i;
				if (step_num == i)
					document.getElementById(div_id).style.display = "";
				else
					document.getElementById(div_id).style.display = "none";
			}
			if (step_num == 0)
				document.getElementById("BackBtn").style.display = "none";
			else
				document.getElementById("BackBtn").style.display = "";
			if (step_num == 3)
				wan8021QCheck();
		}
	</script>
</head>

<body topmargin="10" leftmargin="0" onload="show_detail()">
	<form name="wzSetform" method="post" action="/cgi-bin/wizardclose.asp">
		<input type="hidden" name="wzExitFlag">
		<table width="500" border="0" align="center" cellpadding="0" cellspacing="0">
			<tr>
				<td width="500" height="5" valign="baseline" class="orange"></td>
			</tr>
		</table>
		<table border="0" width="500" align="center" cellspacing="0" cellpadding="0">
			<tr>
				<td width="200" height="50" align="center" valign="middle" bgcolor="#FFFFFF">
					<div align="left"><img src="/logo.png" width="160" height="59" style="object-fit:contain;height:auto;max-height:60px;max-width:160px;display:block;"></div>
				</td>
				<td width="300" height="50" align="right" valign="bottom" bgcolor="#FFFFFF" class="model">
					
						
									GPON ONU
										
				</td>
			</tr>
			<tr>
				<td width="500" colspan="2" class="orange"> </td>
			</tr>
		</table>

		<table width="500" height="2" border="0" align="center" cellpadding="0" cellspacing="0" class="orange">
			<tr>
				<td class="orange"> </td>
			</tr>
		</table>
		<div id="step_0" name="start">
			<table width="500" height="35" border="0" align="center" cellpadding="0" cellspacing="0" color="#ffcb00">
				<tr>
					<td width="500" bgcolor="#FFFFFF" class="headline">&nbsp; Quick Start
					</td>
				</tr>
			</table>

			<table width="500" border="0" align="center" cellpadding="2" cellspacing="0" bgcolor="#FFFFFF">
				<tr>
					<td width="40">&#12288;</td>
					<td colspan="2" class="tabdata">
						The Wizard will guide you through these four quick steps. Begin by clicking on NEXT.
					</td>
				</tr>

				<tr>
					<td width="40">&#12288;</td>
					<td width="30"></td>
					<td class="tabdata" align="left">
						Step 1. Set your new password
					</td>
				</tr>

				<tr style="display:none">
					<td width="40">&#12288;</td>
					<td width="30"></td>
					<td class="tabdata">
						Step 2. Choose your time zone
					</td>
				</tr>

				<tr>
					<td>&#12288;</td>
					<td width="30"></td>
					<td class="tabdata">
						Step 2. Set your Internet connection
					</td>
				</tr>
				<tr>
					<td>&#12288;</td>
					<td></td>
					<td class="tabdata">
						Step 3. Confirm the Configuration and Save it
					</td>
				</tr>
			</table>
		</div>
		<div id="step_1" name="pwd">
			<INPUT type="HIDDEN" name="isPwdChanged" value="0">
			<table width="500" height="35" border="0" align="center" cellpadding="0" cellspacing="0" color="#ffcb00">
				<tr>
					<td width="500" bgcolor="#FFFFFF" class="headline">&nbsp;
						Quick Start - Password
					</td>
				</tr>
			</table>
			<table width="500" border="0" align="center" cellpadding="2" cellspacing="0" bgcolor="#FFFFFF">
				<tr>
					<td width="40">&nbsp;</td>
					<td colspan="2" class="tabdata">
						You may change the admin account password by entering in a new password. Click NEXT to continue.
							<input type="hidden" name="wzExitFlag">
					</td>
				</tr>
				<tr>
					<td></td>
					<td></td>
					<td></td>
				</tr>
				<tr>
					<td height="10"></td>
					<td></td>
					<td></td>
				</tr>
				<tr>
					<td width="40">&nbsp;</td>
					<td width="150" class="tabdata" align="right">
						New Password :
					</td>
					<td width="310" class="tabdata" align="left">
						<div align="left">
							<input type="password" size="32" maxlength="30" value="" name="uiViewPassword" id="uiViewPassword">
						</div>
					</td>
				</tr>
				<tr>
					<td width="40">&nbsp;</td>
					<td width="150" class="tabdata" align="right">
						Confirm Password :
					</td>
					<td class="tabdata" align="left">
						<input type="password" name="uiViewPasswordConfirm" value="" id="uiViewPasswordConfirm" size="32" maxlength="30">
				</tr>
				<tr>
					<td width="40">&nbsp;</td>
					<td width="150">&nbsp;</td>
					<td width="200" class="tabdata" align="left">
						(length range:1~30)
					</td>
				</tr>
			</table>
		</div>
		<div id="step_2" name="tz">
			<table width="500" height="35" border="0" align="center" cellpadding="0" cellspacing="0" color="#ffcb00">
				<tr>
					<td width="500" bgcolor="#FFFFFF" class="headline">&nbsp;
						Quick Start - Time Zone
					</td>
				</tr>
			</table>
			<table width="500" border="0" align="center" cellpadding="2" cellspacing="0" bgcolor="#FFFFFF">
				<tr>
					<td width="40">&#12288;</td>
					<td colspan="2" class="tabdata">
						Select the appropriate time zone for your location and click NEXT to continue.
					</td>
				</tr>
				<tr>
					<td width="40" height="10"></td>
					<td width="150" class="tabdata" align="right"></td>
					<td width="310" class="tabdata" align="left"></td>
				</tr>
				<tr>
					<td width="40">&#12288;</td>
					<td colspan="2" align="left" class="tabdata">
						<select id="uiViewdateTZ" name="uiViewdateTZ" size="1">
							<option value="GMT-12:00">(GMT-12:00) Enewetak, Kwajalein
							<option value="GMT-11:00">(GMT-11:00) Midway Island, Samoa
							<option value="GMT-10:00">(GMT-10:00) Hawaii
							<option value="GMT-09:00">(GMT-09:00) Alaska
							<option value="GMT-08:00">(GMT-08:00) Pacific Time (US,Canada)
							<option value="GMT-07:00">(GMT-07:00) Mountain Time (US & Canada)
							<option value="GMT-06:00">(GMT-06:00) Central Time (US & Canada), Maxico City, Saskatchewan
							<option value="GMT-05:00">(GMT-05:00) Eastern Time (US & Canada), Indiana(East)
							<option value="GMT-04:00">(GMT-04:00) Altlantic Time (Canada), Caracas, La Poz
							<option value="GMT-03:30">(GMT-03:30) Newfoundland
							<option value="GMT-03:00">(GMT-03:00) Brasilia, Buenos Aires, Georgetown
							<option value="GMT-02:00">(GMT-02:00) Mid-Atlantic
							<option value="GMT-01:00">(GMT-01:00) Azores, Cape Verde Is
							<option value="GMT">(GMT) Greenwich Mean Time : Dublin, Edinburgh, Lisbon, London
							<option value="GMT+01:00">(GMT+01:00) Berlin, Stockholm, Rome, Bern, Brussels, Vienna
							<option value="GMT+02:00">(GMT+02:00) Athens, Helsinki, Istanbul, Cairo, Eastern Europe, Israel
							<option value="GMT+03:00">(GMT+03:00) Baghdad, Kuwait, Nairobi, Riyadh, Moscow
							<option value="GMT+03:30">(GMT+03:30) Tehran
							<option value="GMT+04:00">(GMT+04:00) Abu Dhabi, Muscat, Tbilisi, Kazan, Volgograd
							<option value="GMT+04:30">(GMT+04:30) Kabul
							<option value="GMT+05:00">(GMT+05:00) Islamabad, Karachi, Ekaterinburg, Tashkent
							<option value="GMT+05:30">(GMT+05:30) New Delhi
							<option value="GMT+06:00">(GMT+06:00) Almaty, Dhaka
							<option value="GMT+06:30">(GMT+06:30) Yangon(Rangoon)
							<option value="GMT+07:00">(GMT+07:00) Bangkok, Jakarta, Hanoi
							<option value="GMT+08:00">(GMT+08:00) Beijing, Hong Kong, Perth, Singapore, Taipei
							<option value="GMT+09:00">(GMT+09:00) Tokyo, Osaka, Sapporo, Seoul, Yakutsk
							<option value="GMT+09:30">(GMT+09:30) Adelaide, Darwin
							<option value="GMT+10:00">(GMT+10:00) Brisbane, Canberra, Melbourne, Sydney, Hobart
							<option value="GMT+11:00">(GMT+11:00) Magadan, Solomon Is., New Caledonia
							<option value="GMT+12:00">(GMT+12:00) Fiji, Kamchatka, Marshall Is., Wellington, Auckland
							<option value="GMT+13:00">(GMT+13:00) Samoa, Nuku'alofa
								<script>
									document.getElementById("uiViewdateTZ").value = timezone;
								</script>
						</select>
					</td>
				</tr>
			</table>
		</div>
		<div id="step_3" name="8021q">
			<INPUT type="HIDDEN" name="wan_8021q" value="1">
			<INPUT type="HIDDEN" name="disp_wan_8021q" value="1">
			<INPUT type="HIDDEN" name="wan8021qFlag" value="0">
			<table width="500" height="35" border="0" align="center" cellpadding="0" cellspacing="0" color="#ffcb00">
				<tr>
					<td width="500" bgcolor="#FFFFFF" class="headline">&nbsp;
						Quick Start - 802.1q
					</td>
				</tr>
			</table>
			<table width="500" border="0" align="center" cellpadding="2" cellspacing="0" bgcolor="#FFFFFF">
				<tr>
					<td width="40">&#12288;</td>
					<td colspan="2" class="tabdata">
						Select the WAN interface and configure the 802.1q.Click NEXT to continue.
							<input type="hidden" name="wzExitFlag">
					</td>
				</tr>
				<tr>
					<td></td>
					<td></td>
					<td></td>
				</tr>
				<tr>
					<td width="40" height="40">&#12288;</td>
					<td width="150" class="tabdata" align="left">
						<div align=left>
							<font color="#000000"><B>
									802.1q
								</B></font>
						</div>
					</td>
					<td class="tabdata" align=left>
						<INPUT value="Yes" type=radio name="wan_dot1q" onclick="wanVidOper(1)">
						<FONT color=#000000>
							Tag
						</FONT>
						<INPUT value="No" type=radio name="wan_dot1q" onclick="wanVidOper(0)">
						<FONT color=#000000>
							Untag
						</FONT>
						<script>
							if (wan_dot1q_var == "Yes") {
								document.getElementsByName("wan_dot1q")[0].checked = true;
								document.getElementsByName("wan_dot1q")[1].checked = false;
							}
							else {
								document.getElementsByName("wan_dot1q")[0].checked = false;
								document.getElementsByName("wan_dot1q")[1].checked = true;
							}
						</script>
					</td>
				</tr>

				<tr>
					<td width="40" height="40">&#12288;</td>
					<td width="150" class="tabdata" align="left">
						<div align=left>
							<font color="#000000"><B>
									VLAN ID
								</B></font>
						</div>
					</td>
					<td class="tabdata" align=left>
						<INPUT maxLength=5 size=5 name="wan_vid" id="wan_vid">
						<FONT color=#000000>
							(range: 0~4095)
						</FONT>
						<script>
							document.getElementById("wan_vid").value = wan_vlanid_var;
						</script>
					</td>
				</tr>
			</table>
		</div>
		<div id="step_4" name="conType">
			<table width="500" height="35" border="0" align="center" cellpadding="0" cellspacing="0" color="#ffcb00">
				<tr>
					<td width="500" bgcolor="#FFFFFF" class="headline">&nbsp;
						Quick Start - ISP Connection Type
					</td>
				</tr>
			</table>
			<table width="500" border="0" align="center" cellpadding="2" cellspacing="0" bgcolor="#FFFFFF">
				<tr>
					<td width="40">&#12288;</td>
					<td colspan="2" class="tabdata">
						Select the WAN Transfer Mode and internet connection type to connect to your ISP. Click NEXT to continue.
							<input type="hidden" name="wzExitFlag">
					</td>
				</tr>

				<tr>
					<td></td>
					<td></td>
					<td></td>
				</tr>
				<tr>
					<td>&#12288;</td>
					<td height="40" width="100" class="tabdata" align="left">
						<input value="2" type="radio" name="Typeradio" id="uiViewConTypeStatus2">
						<script>
							if (wan_pvc0_entry0_ISP == "2")
								document.getElementById("uiViewConTypeStatus2").checked = true;
						</script>
						PPPoE
					</td>
					<td class="tabdata" align="left">
						<span class="databold">
							Choose this option if your ISP uses PPPoE. (For most PON users)
						</span>
					</td>
				</tr>
			</table>
		</div>
		<div id="step_5" name="ppp">
			<table width="500" height="35" border="0" align="center" cellpadding="0" cellspacing="0" color="#ffcb00">
				<tr>
					<td width="500" bgcolor="#FFFFFF" class="headline">&nbsp;
						Quick Start - PPPoE
					</td>
				</tr>
			</table>
			<table width="500" border="0" align="center" cellpadding="2" cellspacing="0" bgcolor="#FFFFFF">
				<tr>
					<td width="40">&#12288;</td>
					<td colspan="2" class="tabdata">
						Enter the PPPoE information provided to you by your ISP. Click NEXT to continue.
					</td>
				</tr>
				<tr>
					<td height="10"></td>
					<td></td>
					<td></td>
				</tr>
				<tr>
					<td>&#12288;</td>
					<td class="tabdata" align="right">
						Username:
					</td>
					<td class="tabdata" align="left">
						<input type="text" size="14" maxlength="32" class="" name="uiViewUserNameMark" id="uiViewUserName">
						<script>
							if (wan_pvc0_entry0_name != "N/A")
								document.getElementById("uiViewUserName").value = wan_pvc0_entry0_name;
						</script>
					</td>
				</tr>
				<tr>
					<td>&#12288;</td>
					<td class="tabdata" align="right">
						Password:
					</td>
					<td class="tabdata" align="left">
						<input type="password" size="14" maxlength="32" class="" name="uiViewPasswordMark" id="uiViewPasswordMark">
						<script>
							if (wan_pvc0_entry0_pwd != "N/A")
								document.getElementById("uiViewPasswordMark").value = wan_pvc0_entry0_pwd;
						</script>
					</td>
				</tr>
			</table>
		</div>
		<div id="step_6" name="comp">
			<table width="500" height="35" border="0" align="center" cellpadding="0" cellspacing="0" color="#ffcb00">
				<tr>
					<td width="500" bgcolor="#FFFFFF" class="headline">
						<div align="left">&nbsp;
							Quick Start Completed !!
					</td>
				</tr>
			</table>
			<table width="500" border="0" align="center" cellpadding="2" cellspacing="0" bgcolor="#FFFFFF">
				<tr>
					<td width="40">&nbsp;</td>
					<td colspan="2" class="tabdata">
						The Setup Wizard has completed. Click on BACK to modify changes or mistakes.Click NEXT to save the current settings.
							<input type="hidden" name="wzExitFlag">
					</td>
				</tr>
			</table>
		</div>
		<table width="500" height="40" border="0" align="center" cellpadding="0" cellspacing="0" class="orange">
			<tr>
				<td class="orange">
					<div id="button0" align="right" style="width:500px">
						<input name="BackBtn" id="BackBtn" type="button" width="50" class="button1" value="Back" class="tabdata" onClick="back_step()" >
						<input name="NextBtn" type="button" width="50" class="button1" value="Next" class="tabdata" onClick="next_step()">
						<input name="ExitBtn" type="button" width="50" class="button1" value="Exit" class="tabdata" onClick="ExitWizard()">
					</div>
				</td>
			</tr>
		</table>
	</form>
</body>

</html>