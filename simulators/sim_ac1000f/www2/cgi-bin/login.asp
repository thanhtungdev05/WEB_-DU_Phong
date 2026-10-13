<html xmlns="http://www.w3.org/1999/xhtml">
	<head>
		<title>login</title>
		<meta http-equiv="X-UA-Compatible" content="IE=9; IE=8; IE=7; IE=EDGE">
		<meta http-equiv=content-type content="text/html; charset=gb2312">
		<link rel="stylesheet" type="text/css" href="/style.css" tppabs="/style.css">
		<style  type="text/css">
			#div_visite
			{
				background:#f4f4f4 url(/bg.gif) repeat top left;
				border-radius: 8px 8px 8px 8px;
				-moz-border-radius: 8px 8px 8px 8px;
				-webkit-border-radius: 8px 8px 8px 8px;
				display:inline-block;
				position:relative;
				margin-left: auto;
				margin-right: auto;
				margin-top: 170px;
				padding: 15px 20px;
			       width: 500px;
			       height:350px;
			     	behavior:url(/PIE.htc);
			}
			    
			#fpt
			{
				background:url(/login.png) no-repeat top left;
				background-size: 100px 35px;
			}

			#usr
			{
				background:url(/usr.png?v=2) no-repeat center right;
				height:60px;
			}

			#pwd
			{
			 	background:url(/pwd.png?v=2) no-repeat center right;
				height:60px;
			}

			.button1
			{
				display:inline-block;
				cursor:pointer;
				color:#fff;
				font:bold 15px Arial,Verdana,sans-serif;
				margin:5px;
				padding:7px 14px;
				line-height:normal;
				overflow:visible;
				text-align:center;
				text-decoration:none;
				position:relative;
				background:#38a7dc;
				border:1px solid #38a7dc;
				outline:0;
			}

			#buttoncolor input:hover
			{
				display:inline-block;
				background:#1a6f98;
				color:#fff;
				outline:0;
			}
		</style>
		<script language=javascript type=text/javascript>
			document.onkeypress = function(e)
			{
				var code;
				if (!e)
				{
					var e=window.event;
				}
				if(e.keyCode)
				{
					code = e.keyCode;
				}
				else if(e.which)
				{
					code = e.which;
				}
				if(code == 13)
				{
				       if(document.getElementById('username').value != "" && document.getElementById('password').value == ""  )
				       {	
				       	document.getElementById('password').focus();	
					}
					else
					{
						submitform();
						return false;
					}
				}
			}
		
			function delCookie(name)
			{  
				var exp = new Date();  
				exp.setTime(exp.getTime() - 10000);  
				document.cookie = name + "=del;path=/;expires=" + exp.toGMTString();  
			}
			
			function doLoad()
			{
				delCookie("uid");
				delCookie("psw");
				delCookie("SESSIONID");
				delCookie("logout");
				delCookie("sysauth");
				try {
					document.getElementById('username').value = '';
					document.getElementById('password').value = '';
				} catch(e) {}
				document.configform.username.focus();
			}
			
			function submitform()
			{
				var username = document.getElementById('username');
				var password = document.getElementById('password');
				
				if (username.value == "")
				{
					alert("Account can't be blank!");
					return false;
				}
				if (password.value == "")
				{
					alert("Password can't be blank!");
					return false;
				}
				
				var cookie = "uid=" + username.value + ";path=/;";
				document.cookie = cookie;
				var cookie = "psw=" + password.value + ";path=/;";
				document.cookie = cookie;
				location.replace("/cgi-bin/requestFromLoginPage");
				return true;
			}
			
			function gotoLOID()
			{
				location.replace("/cgi-bin/access_auth.asp?islogin=0");
			}
		</script>
	</head>

	
		<body onload="doLoad()" height="100%" align="center">
			<div width="100%" height="100%" align="center">
				<div id=div_visite >
					<form id="configform" name="configform" action="/cgi-bin/login.asp" method="get">		
						<table  cellspacing="0" cellpadding="0" align="center" width="500">
							<tr>
								<td style="text-align:center;">
									<img src="/login.png" width="120" height="65">
								</td>
							</tr>
						</table>
						
						<!--gleaf added begin-->
						<table  cellspacing="0" cellpadding="0" width="500" style="margin-top:5px;">
						  	<tr height="20px">
								<td width="190px"></td>
						  		<td width="55px" style="color:grey; font-family: Arial,Helvetica,sans-serif;font-size: 15px;font-weight:bold;text-align:left;">hotline</td>
						  		<td style="color:red; font-family: Arial,Helvetica,sans-serif;font-size: 15px;font-weight:bold;text-align:left;">1900 6600</td>
						  	</tr>
						  </table>
						  <!--gleaf added end-->
						
						<table  cellspacing="0" cellpadding="0" align="center" width="500" height="200">
							<tr>
								<td>
									<table  cellspacing="0" cellpadding="0" align="center" border="0" width="500" height="160"  >									
									  	<tr>
										   	<td width=160px height=40px>
										   		<div id="usr"></div>
											</td>				    
											<td align=left>&nbsp;&nbsp;<input id="username" style="height:30px;width: 160px; font-family: arial;line-height:30px;" name="username" size="20" > </td>
									  	</tr>
									  
									  	<tr>
									     		<td height=40px>
									   			<div  id="pwd"></div>
									     		</td>
									     		<td align=left>&nbsp;&nbsp;<input id="password" style="height:30px;width: 160px; font-family: arial ;line-height:30px;" type="password" name="password" size="20"></td>
									  	</tr>
									  	
								  		<tr>
										   	<td height=25px></td>
										   	<td style="color:red; font-family: Arial,Helvetica,sans-serif;font-size: 15px;font-weight:bold;text-align:left;">
									   		 	
									    		</td>
									  	</tr>								  	  
									</table>
								</td>
							</tr>
							
							<tr>
								<td>
									<table  cellspacing="0" cellpadding="0"  border="0" width="500" align="center" >									 
									  	<tr id="buttoncolor"  height=40px>
											<!--amy
										    	<td   height=30px >
										    	</td>
										  
										    	<td> 
										    		<span width="175px" style="padding-left:155px;"><input id="btnsubmit" onclick="submitform()" type="button" value="Login" name="btnsubmit"></span>
										    		<span width="175px" style="padding-left:20px;"><input id="btncancel" type="reset" value="Cancel" name="btncancel"></span>
										    	</td>
										    	-->
										    	
										    	<td align=center>
									    			<input class="button1" onclick="submitform()" type="button" value="Login" name="btnsubmit">
										    	</td>
										</tr>							  	
									</table>
								</td>
							</tr>
						</table>

						<!--gleaf added begin-->
						<!--
						<table cellspacing="0"  width="500" style="padding-top:20px;">
							<tr height="20px">
								<td width="320px"></td>
						  		<td style="color:grey; font-family: Arial,Helvetica,sans-serif;font-size: 15px;font-weight:bold;text-align:left; padding-right:40px;">hotline</td>
						  	</tr>

						  	<tr height="30px">
						  		<td width="320px"></td>
						  		<td style="color:red; font-family: Arial,Helvetica,sans-serif;font-size: 20px;font-weight:bold;text-align:left; padding-right:40px;">1900 6600</td>
						  	</tr>
						  </table>
						  -->
						  <!--gleaf added end-->
					</form>
				</div>
			</div>
		</body>
			
</html>
