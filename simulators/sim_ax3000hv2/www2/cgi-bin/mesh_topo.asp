

<!DOCTYPE html PUBLIC "-//W3C//DTD XHTML 1.0 Transitional//EN" "http://www.w3.org/TR/xhtml1/DTD/xhtml1-transitional.dtd">
<html xmlns="http://www.w3.org/1999/xhtml" xml:lang="utf-8" dir="ltr" lang="utf-8">
	<head>
		<meta http-equiv="X-UA-Compatible" content="IE=11;IE=10;IE=9; IE=8; IE=7; IE=EDGE">
		<meta http-equiv=Content-Script-Type content=text/javascript>
		<meta http-equiv=Content-Style-Type content=text/css>
		<meta http-equiv=Content-Type content="text/html; charset=iso-8859-1">
		<!--<script language="JavaScript" src="OutVariant.asp"></script>-->
		<script language="JavaScript" src="/general.js"></script>
		<script language="JavaScript" src="/jsl.js"></script>
		<script language="JavaScript" src="/ip.js"></script>
		<script language="JavaScript" src="/util_e8c.js"></script>
		<script language="JavaScript" src="/mesh_topo.js?v=20261118hv2"></script>
		<script language="JavaScript" src="/d3.v5.min.js"></script>
		<script language="JavaScript" src="/mesh.js?v=20261118hv2"></script>
		<link rel="stylesheet" href="/mesh.css?v=20261118hv2">
		
		<style  type="text/css">
				*{color:  #404040;}
		</style>

		<script type="text/javascript" src="/spin.js" ></script>
		<link rel="stylesheet" type="text/css" href="/style.css">
		<script language="JavaScript">

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
		var getdata = {
	"state":	"Not Configured",
	"mapEnable":	"1",
	"isMeshAllBHOrFHClosedStatus":	"No",
	"deviceRole":	"1",
	"topo_json":	[{
			"Role":	"01",
			"Distance":	"0",
			"Mac":	"20:be:b4:0b:16:91",
			"IP":	"192.168.1.1",
			"HostName":	"AX3000HV2-1691",
			"UplinkMac":	"",
			"BhType":	"",
			"RSSI":	"",
			"BhPhyRate":	"",
			"assocTime":	"",
			"StaInfo":	[{
					"devname":	"Unknown",
					"mac":	"d8:43:ae:2e:65:45",
					"ip":	"192.168.1.179",
					"medium":	"eth",
					"rssi":	0,
					"phyrate":	"1000",
					"roamtime":	"--",
					"upstream":	"0",
					"downstream":	"31"
				}]
		}],
	"meshSetText":	"Mesh Setting",
	"meshStateText":	"State",
	"meshStateVlaue1":	"Not Configured",
	"meshStateVlaue2":	"Controller",
	"meshStateVlaue3":	"Agent",
	"meshStateVlaue4":	"Auto",
	"meshSetEnableText":	"Enable",
	"meshEnableText":	"Enable",
	"meshDisableText":	"Disable",
	"meshRoleText":	"Role Selection",
	"meshStartText":	"Mesh Networking Start",
	"MeshStartedText":	"Mesh Networking has started",
	"MeshInProgressText":	"Mesh networking is in progress",
	"meshTopologyText":	"Mesh Topology",
	"meshDeviceRole":	"Device Role",
	"meshDeviceInfo":	"Device Info",
	"meshSuperRouter":	"Superior Router",
	"ButtonSaveText":	"Save",
	"ClickButtonSaveText":	"Click \"Save\" to save your settings",
	"MeshClientNumber":	"Client Number"
};
		/*var stringsArray = [
				['AdminText','Administrator'],
				['AdminUsernameText','Username'],
				['AdminNewPasswordText','New Password'],
				['AdminConfirmPasswordText','Confirm Password'],
				['ClickButtonSaveText','Click "Save" to save your settings'],
				['ButtonSaveText','Save'],
				['CopyrightText','Copyright © 2022 FPT. All Rights Reserved.'],
				['AdminJS0Text','Empty Password Invaild.'],
				['AdminJS1Text','Your Password and Confirm Password must match before you can apply.'],
				['AdminJS2Text','Input too many character,double quotation marks(") will be count as 6 characters(&quot;)!!'],
				['AdminJS6Text','Password Invalid.The length of password should be 8~30 character(s)!'],
				['AdminJS7Text','Password Invalid.The password can not contain semicolon(;) !!'],
				['AdminJS8Text','(length range:1~30)'],
				['AdminJS9Text','Password reset complete!'],
				['','']
			];*/
		//var json_string='';
		//function loadInfos(){
		//	var url = "/cgi-bin/init.json"/*json�ļ�url*/
		//	var request = new XMLHttpRequest();
		//	request.open("GET", url);/*�������󷽷���·��*/
		//	request.setRequestHeader('If-Modified-Since', '0');
		//	request.send();/*���������ݵ�������*/
		//	request.onload = function () {/*XHR�����ȡ��������Ϣ��ִ��*/
		//		if (request.status == 200) {/*����״̬Ϊ200����Ϊ���ݻ�ȡ�ɹ�*/
		//			json_string = JSON.parse(request.responseText);
		//			console.log(json_string);
		//		}
		//	}
		//}

		if(typeof Object.assign != 'function') {//ieû��ʵ��Object.assign����
		  Object.assign = function(target) {
			'use strict';
			if (target == null) {
			  throw new TypeError('Cannot convert undefined or null to object');
			}

			target = Object(target);
			for(var index = 1; index < arguments.length; index++) {
			  var source = arguments[index];
			  if (source != null) {
				for (var key in source) {
				  if (Object.prototype.hasOwnProperty.call(source, key)) {
					target[key] = source[key];
				  }
				}
			  }
			}
			return target;
		  };
		}
		/*var isIE = (document.all)?true:false;
		if(isIE == true)
			var stringdata = document.getElementById("json_string");
		else*/
		var stringdata = top.json_string;
		Object.assign(getdata,stringdata);//�ϲ�json

		</script>
	</head>

	<body onLoad="fresh()" style="background:#4acbd6;">
		<FORM METHOD="POST" ACTION="/cgi-bin/mesh_basic_setting.asp" name="cbi">
			<input type="hidden" name="SaveAll_Flag" value="0" />
			<input type="hidden" name="Save_Flag" value="0" />
			<input type="hidden" name="wifi_trigger_onboarding_Flag" value="0" />
			<input type="hidden" name="ether_trigger_onboarding_Flag" value="0" />
			<input type="hidden" name="Action_Flag" value="0" />
			<input type="hidden" name="Change_Flag" value="0" />
			<div id="pagestyle">
				<div id="contenttype">  
					<div id="block1" class="main_item" style="display:none">
						<table width="640" border="0" cellpadding="0" cellspacing="0" bgcolor="#FFFFFF" style="table-layout: fixed; margin:5px 0;">
							<tr height="25px" style="background-color:#e6e6e6;">
								<td align=left class="title-main" style="width:620px;padding-left:20px;" id="meshText">
								</td>
							</tr>
						</table>

						<table width="640" border="0" cellpadding="0" cellspacing="0" bgcolor="#FFFFFF" style="table-layout: fixed">
							<tr height="30px">
								<td width="20px">&nbsp;</td>
								<td width="250px" align=left class="tabdata" id="meshStateText"></td>
								<td align=left class="tabdata" id="MeshStateValue">
								</td>
							</tr>
							<tr height="30px">
								<td width="20px">&nbsp;</td>
								<td width="250px" align=left class="tabdata" id="meshEnableText"></td>
								<td align=left class="tabdata">
									<INPUT TYPE="RADIO" NAME="mesh_active" id="enable_radio" VALUE="1" onClick="setMeshEnable(1)"><span id="enable_radio_text"></span>
									&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;
									<INPUT TYPE="RADIO" NAME="mesh_active" id="disable_radio" VALUE="0" onClick="setMeshEnable(0)"><span id="disable_radio_text"></span>
								</td>
							</tr>
						</table>

						<table width="640" border="0" cellpadding="0" cellspacing="0" bgcolor="#FFFFFF" style="table-layout: fixed" id="mesh_Role_table">
							<tr height="30px">
								<td width="20px">&nbsp;</td>
								<td width="250px" align=left class="tabdata" id="meshRoleText"></td>
								<td align=left class="tabdata">
									<INPUT TYPE="RADIO" NAME="mesh_Role" id="role_controller" VALUE="1" onClick="meshRoleChange(1)"><span id="role_controller_text"></span>
									&nbsp;&nbsp;&nbsp;
									<INPUT TYPE="RADIO" NAME="mesh_Role" id="role_agent" VALUE="2" onClick="meshRoleChange(2)"><span id="role_agent_text"></span>
									&nbsp;&nbsp;&nbsp;
									<INPUT TYPE="RADIO" NAME="mesh_Role" id="role_auto" VALUE="0" onClick="meshRoleChange(0)"><span id="role_auto_text"></span>
								</td>
							</tr>
						</table>
					</div><!--id="block1" 12/22-->

					<div id="button0" class="main_item" style="display:none">
						<table width="640" border="0" cellpadding="0" cellspacing="0" bgcolor="#FFFFFF" style="margin:5px 0;">
							<tr height="25px">
									<td align=left class="title-main" style="padding-left:20px;white-space:nowrap;">Click Button to save your settings or start Mesh Networking</td>
							</tr>
						</table>
						<table width="640" border="0" cellpadding="0" cellspacing="0" bgcolor="#FFFFFF">
							<tr height="40px">
								<td align=left class="tabdata" style="width:50px;padding-left:20px;">
									<INPUT TYPE="button" class="button1" NAME="SaveBtn" id="SaveBtn" VALUE="Save" onClick="btnSave()" > 
								</td>
								<td align=left class="tabdata" style="width:150px;padding-left:20px;" id="start_tr">
									<INPUT TYPE="button" class="button1" NAME="trigger" id="trigger" VALUE="" onClick="triggerMultiApOnBoarding()" > 
								</td>
								<td id="firstDiv" style="float:left;"></td>
							</tr>
						</table>
					</div><!--id="button0" 12/22-->
					<div id="div_MeshTopList" class="main_item" style="display:none">
						<table width="640" border="0" cellpadding="0" cellspacing="0" bgcolor="#FFFFFF" style="table-layout: fixed; margin:5px 0;">
							<tr height="25px" style="background-color:#e6e6e6;">
									<td align=left class="title-main" style="width:620px;padding-left:20px;" id="MeshTopologyTip">
									</td>
							</tr>
						</table>
						<div class="title-main" style="color:gray" id="mesh_disable_tip_div"><table width="640" border="0" cellpadding="0" cellspacing="0" bgcolor="#FFFFFF" style="margin:5px 0;">
							<tr height="25px">
									<td align=left class="title-main" style="padding-left:20px;white-space:nowrap;font-size:13px;">Currently EasyMesh is disabled, can not show EasyMesh Topo</td>
							</tr>
						</table></div>
						<table width="640" border="0"  cellpadding="0" cellspacing="0" bgcolor="#FFFFFF" id="topo_table_id">
							<tr>
								<td align=left class="tabdata">
									<div class="configstyle">
										<table width="640" border="0"  cellpadding="0" cellspacing="0" bordercolor="#CCCCCC" bgcolor="#FFFFFF" >
											<tr height="30px">
												<td class=tabdata align=center width=139><STRONG id="deviceRole"></STRONG></td>
												<td class=tabdata align=center width=142><strong id="deviceInfo"></strong></td> 
												<td class=tabdata align=center width=120><STRONG id="superRouter"></STRONG></td>
												<td class=tabdata align=center width=80><STRONG>More clients' details</STRONG></td>
											</tr>
											<tbody id="mesh_topo_body">
												<script language="JavaScript" type="text/JavaScript">
													writeMeshTopoTable();
												</script>
											</tbody>
										</table>
									</div>
								</td>                       
							</tr>
						</table>
						<div class="title-main" style="color:gray" id="topo_tree_tip_div"><table width="640" border="0" cellpadding="0" cellspacing="0" bgcolor="#FFFFFF" style="margin:5px 0;">
							<!--<tr height="25px">
									<td align=left class="title-main" style="padding-left:20px;white-space:nowrap;">You can operate the router icon:</td>
							</tr>-->
							<tr height="25px">
									<td align=left class="title-main" style="padding-left:20px;white-space:nowrap;font-size:13px;">Single Click on the router to show more clients' detail</td>
							</tr>
							<tr height="25px">
									<td align=left class="title-main" style="padding-left:20px;white-space:nowrap;font-size:13px;">Double Click on the router to jump to the router management page</td>
							</tr>
						</table></div>
						<div id="topo_tree_div" style="text-align:center"></div>
						<table width="620" border="0" cellpadding="0" cellspacing="0" bgcolor="#FFFFFF">
							<tr height="30px">
							<td align=left class="tabdata" style="padding-left:20px;">
							<input type="button" class="button1" onclick="Reload()" value="Refresh"></td>
							</tr>
						</table>
					</div>
				</div>
			</div>
			<table width="690" border="0" cellpadding="0" cellspacing="0" id="table_isPONCASupported" style="display:none">
					<tr height="30">
							<td width="20">&nbsp;</td>
							<td width="250">&nbsp;</td>
							<td width="420"></td>
					</tr>
					<tr>
							<td align=center colSpan=3 style="background-color:transparent;font-family:'BeVietnamRegular',Be Vietnam;"><font size=2 id="CopyrightText"></font></td>
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
