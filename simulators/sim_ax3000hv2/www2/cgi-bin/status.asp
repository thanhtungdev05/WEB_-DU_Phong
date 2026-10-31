<!DOCTYPE html
	PUBLIC "-//W3C//DTD XHTML 1.0 Transitional//EN" "http://www.w3.org/TR/xhtml1/DTD/xhtml1-transitional.dtd">
<html xmlns="http://www.w3.org/1999/xhtml" xml:lang="utf-8" lang="utf-8" dir="ltr">

<head>
	<meta http-equiv="X-UA-Compatible" content="IE=9; IE=8; IE=7; IE=EDGE">
	<meta http-equiv="Content-Type" content="text/html; charset=UTF-8">
	<meta http-equiv=Content-Script-Type content=text/javascript>
	<meta http-equiv=Content-Style-Type content=text/css>
	<link rel="stylesheet" type="text/css" href="/style.css" tppabs="http://192.168.1.1/css/style.css">
	<style type="text/css">
		#MainMenu li {
			list-style-type: none;
			float: left;
			padding: 0;
			margin: 0;
		}


		@font-face {
			font-family: "BeVietnamBold";
			src: url(/BeVietnam-Bold.ttf);
		}

		#MainMenu li a {
			font-size: 18px;
			font-weight: bold;
			font-family: "BeVietnamBold", Be Vietnam;
			padding: 0;
			margin: 0;
		}

		#MainMenu li a:hover {
			background-color: #a4e5ea;
			color: #fff;
		}

		#webgui a:hover {
			background-color: #ffcb00;
		}

		#logoutstyle table :hover {
			background-color: #ffcb00;
		}

		#languagestyle {
			cursor: pointer;
			font-size: 17px;
			font-weight: bold;
			font-family: "BeVietnamBold", Be Vietnam;
			background-color: #00A9A7;
			margin-left: 10px;
			padding: 0 5px 4px 5px;
			vertical-align: middle;
			color: #FFF;
		}

		#logoutstyle {
			cursor: pointer;
			font-size: 15px;
			font-weight: bold;
			font-family: "BeVietnamBold", Be Vietnam;
			margin: 0px;
			padding: 0;
			color: #FFF;
		}

		#MainMenu {
			width: 690;
			height: 65px;
			padding: 0;
			margin: 0;
			float: right;
		}

		.current {
			display: block;
			background-color: #fff;
			background-position: center;
			padding: 0;
			margin: 0;
			width: 115px;
			height: 65px;
			text-align: center;
			line-height: 65px;
			text-decoration: none;
			outline: 0;
			color: #4acbd6;
			border-radius: 10px 10px 0 0;
			font-size: 16px;
		}

		.other {
			display: block;
			background-color: #4acbd6;
			background-position: center;
			padding: 0;
			margin: 0;
			width: 115px;
			height: 65px;
			text-align: center;
			line-height: 65px;
			text-decoration: none;
			outline: 0;
			color: #fff;
			border-radius: 10px 10px 0 0;
			font-size: 16px;
		}

		.style-select select {
			background: #FFFFFF;
			width: 110px;
			font-size: 14px;
			border: 1px solid #00A9A7;
			height: 27px;
			color: #00A9A7;
			padding: 3px;
			position: relative;
			z-index: 1;
			appearance: none;
			-moz-appearance: none;
			/*for Firefox*/
			-webkit-appearance: none;
			/*for chrome and Safari*/
		}

		.dispear {
			width: 20px;
			height: 20px;
			background: #FFF;
			position: relative;
			z-index: 4;
			left: -4px;
			top: -23px;
		}
	</style>

	<script language="javascript">


		function doSubmit() {

			index = 2;

			document.forms[0].StatusActionFlag.value = index;
			document.forms[0].submit();
		}


		function delCookie(name) {
			var exp = new Date();
			exp.setTime(exp.getTime() - 10000);
			document.cookie = name + "=del;expires=" + exp.toGMTString();
			document.cookie = name + "=del;expires=" + exp.toGMTString() + ";path=/;";
		}

		function doLogout() {
			/*delCookie("uid");
			delCookie("psw");
			top.window.location.href="/cgi-bin/login.asp";
			document.cookie = "logout=1;path=/;";
			document.status_form.submit();*/
		}

		function transferpage() {
			top.test.nav.location = "/cgi-bin/status_deviceinfo.asp";
		}


		function change_basic(obj) {
			window.parent.nav.location = "/cgi-bin/navigation-basic.asp";
			var a = document.getElementById("MainMenu").getElementsByTagName("a");
			for (var i = 0; i < a.length; i++) {
				a[i].className = "other";
			}
			obj.className = "current";
		}

		function change_adv(obj) {
			window.parent.nav.location = "/cgi-bin/navigation-advanced.asp";
			var a = document.getElementById("MainMenu").getElementsByTagName("a");
			for (var i = 0; i < a.length; i++) {
				a[i].className = "other";
			}
			obj.className = "current";
		}

		function change_access(obj) {
			window.parent.nav.location = "/cgi-bin/navigation-access.asp";
			var a = document.getElementById("MainMenu").getElementsByTagName("a");
			for (var i = 0; i < a.length; i++) {
				a[i].className = "other";
			}
			obj.className = "current";
		}

		function change_maint(obj) {
			window.parent.nav.location = "/cgi-bin/navigation-maintenance.asp";
			var a = document.getElementById("MainMenu").getElementsByTagName("a");
			for (var i = 0; i < a.length; i++) {
				a[i].className = "other";
			}
			obj.className = "current";
		}

		function change_stat(obj) {
			window.parent.nav.location = "/cgi-bin/navigation-status.asp";
			var a = document.getElementById("MainMenu").getElementsByTagName("a");
			for (var i = 0; i < a.length; i++) {
				a[i].className = "other";
			}
			obj.className = "current";
		}

		function change_help(obj) {
			window.parent.nav.location = "/cgi-bin/navigation-help.asp";
			var a = document.getElementById("MainMenu").getElementsByTagName("a");
			for (var i = 0; i < a.length; i++) {
				a[i].className = "other";
			}
			obj.className = "current";
		}
		function doLoad() {
			tstart = document.cookie.indexOf("ipchange=1");
			if (tstart != -1) {
				delCookie("ipchange");
				delCookie("uid");
				delCookie("psw");
				top.window.location.href = "/cgi-bin/login.asp";
			}
			return;
		}
	</script>
</head>

<body onLoad="doLoad();">
	<form METHOD="POST" action="/cgi-bin/status.asp" name="status_form" style="background: rgb(74, 203, 214)">
		<!--<table width="956" height="5" border="0" cellpadding="0" cellspacing="0" style="margin:0 auto;">
				<tr>
					<td></td>
				</tr>
			</table>-->

		<table width="956" height="5" border="0" cellpadding="0" cellspacing="0" style="margin:0 auto;">
			<tr>
				<td></td>
			</tr>
		</table>

		<div id="webgui">
			<table border="0" width="956" height="35" cellspacing="0" cellpadding="0" style="margin:0 auto;">
				<tr>
					<td align=right valign="bottom">

						<INPUT TYPE="HIDDEN" NAME="StatusActionFlag" VALUE="">



						<div class="style-select">
							<select size="1" onchange="doSubmit()">
								<option selected>English</option>
								<option>Vietnamese</option>
							</select>
						</div>
						<!--<div class="dispear"></div>-->



					</td>
					<td align=right style="vertical-align:bottom;width:105px;">

						<div id="logoutstyle"><!-- onclick="doLogout();">-->
							<table bgcolor="#4acbd6" border="0" cellpadding="0" cellspacing="0">
								<tr>
									<td style="padding:2px 4px 2px 0;">
										<a href="/cgi-bin/logout.cgi" target="_parent"
											style="text-decoration:none;color:#fff" onClick="doLogout()">
											<span class="logout">Logout</span>
										</a>
									</td>
								</tr>
							</table>
						</div>

					</td>
				</tr>
			</table>
		</div>

		<table id="mainnavibar" width="956" border="0" cellpadding="0" cellspacing="0" style="margin:0 auto;">
			<tr>

				<td width="160" height="120" valign=middle style="padding-left:16px;vertical-align:top;">

					<div align=left>

						<img src="/logo.png" tppabs="logo.png" width="160" height="59" style="object-fit:contain;height:auto;max-height:80px;max-width:160px;display:block;">

					</div>
				</td>

				<td width="2px">&nbsp;&nbsp;</td>
				<td style="vertical-align:bottom;">
					<ul id="MainMenu">


						<li>
							<a href=# class="current" onclick="change_stat(this);">
								Status
							</a>
						</li>





						<li>
							<a href=# class="other" onclick="change_basic(this);">
								Network
							</a>
						</li>





						<li>
							<a href=# class="other" onclick="change_access(this);">
								Access
							</a>
						</li>





						<li>
							<a href=# class="other" onclick="change_adv(this);">
								Advanced
							</a>
						</li>





						<li>
							<a href=# class="other" onclick="change_maint(this);">
								Maintenance
							</a>
						</li>









						<li>
							<a href=# onclick="change_help(this);" class="other">
								Help
							</a>
						</li>

					</ul>
				</td>
			</tr>
		</table>

		<!--<table width="956" height="20" border="0" cellpadding="0" cellspacing="0" style="margin:0 auto;">
				<tr>
					<td></td>
				</tr>
			</table>-->

	</form>
</body>

</html>