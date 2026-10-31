

<!DOCTYPE html PUBLIC "-//W3C//DTD XHTML 1.0 Transitional//EN" "http://www.w3.org/TR/xhtml1/DTD/xhtml1-transitional.dtd">
<html xmlns="http://www.w3.org/1999/xhtml" xml:lang="utf-8" lang="utf-8" dir="ltr">
	<head>
		<meta http-equiv="X-UA-Compatible" content="IE=9; IE=8; IE=7; IE=EDGE">
		<meta http-equiv="Content-Type" content="text/html; charset=UTF-8">
		<meta http-equiv=Content-Script-Type content=text/javascript>
		<meta http-equiv=Content-Style-Type content=text/css>
		<link rel="stylesheet" type="text/css" href="/style.css" tppabs="http://192.168.1.1/css/style.css">
		<style type="text/css">
			
				#menu li
				{
				       list-style-type:none;
					float:left;
					padding:0;
					margin:0;
				}
			

			#menu li a
			{
				font-size:18px;
				font-weight:bold;
				font-family:Arial,Helvetica,sans-serif;
				padding:0;
				margin:0;
				transition: background-color 0.25s ease, color 0.25s ease;
			}
			
			#menu li a:hover
			{
			 	background-color:#FF9933;
			}
			
			#webgui a:hover
			{
			  	background-color:#FF9933;
			}
			
			#logoutstyle table :hover
			{
			 	background-color:#FF9933;
			}
			
			#languagestyle
			{
				cursor:pointer;
				color: #fff;
				font:bold 17px Arial,Verdana,sans-serif;
				background-color:#38A7DC;				
				margin-left:10px;
				padding:0 5px 4px 5px;
				vertical-align:middle;
			}
			
			#logoutstyle
			{
				cursor:pointer;
				color: #fff;
				font:bold 15px Arial,Verdana,sans-serif;
				margin:0px;
				padding:0;
			}
			
			#menu
			{			
				width:690;
				height:65px;
				padding:0;
				margin:0;
				float:right;
			}

			.current
			{
				display:block;
				background-color:#1a6f98;
				background-position:center;
				padding:0;
				margin:0;
				width:115px;
				height:65px;
				text-align:center;
				line-height:65px;
				text-decoration:none;
				outline:0;
				color:#fff;
				transition: background-color 0.25s ease;
			}
				
			.other
			{
				display:block;
				background-color:#38A7DC;
				background-position:center;
				padding:0;
				margin:0;
				width:115px;
				height:65px;
				text-align:center;
				line-height:65px;
				text-decoration:none;
				outline:0;
				color:#fff;
				transition: background-color 0.25s ease;
			}

			.style-select select
			{
			   background: #FFFFFF;
			   width: 110px;
			   font-size: 14px;
			   border: 1px solid #38A7DC;
			   height: 27px;
			   color: #38A7DC;
			   padding:3px;
			   position:relative; z-index:1;
			   appearance:none;
			   -moz-appearance:none;/*for Firefox*/
			   -webkit-appearance: none; /*for chrome and Safari*/
			}	
			.dispear
			{
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
			
				
			function doSubmit()
			{
			
				index=2;
			
				document.forms[0].StatusActionFlag.value = index;
				document.forms[0].submit();
			}

			
				function delCookie(name)
				{  
					var exp = new Date();  
					exp.setTime(exp.getTime() - 10000);  
					document.cookie = name + "=del;path=/;expires=" + exp.toGMTString();  
				}
			
				function doLogout()
				{
					delCookie("uid");
					delCookie("psw");
					//top.location.replace("/cgi-bin/login.asp");
					//cindy add because https is invalid 
					parent.window.location.href="/cgi-bin/login.asp";
					//cindy add because https is invalid 
					document.cookie = "logout=1;path=/;";
					document.status_form.submit();
				}

				function transferpage()
				{
					parent.test.nav.location="/cgi-bin/status_deviceinfo.asp"; 
				}
			

			function change_bg1(obj)
			{
			   	window.parent.nav.location="/cgi-bin/navigation.asp";
			    	var a=document.getElementById("menu").getElementsByTagName("a");
			    	for(var i=0;i<a.length;i++)
			    	{
			    		a[i].className="other";
			    	}
			    	obj.className="current";
			}

			function change_bg2(obj)
			{
			    	window.parent.nav.location="/cgi-bin/navigation-basic.asp";
			    	var a=document.getElementById("menu").getElementsByTagName("a");
			    	for(var i=0;i<a.length;i++)
			    	{
			        	a[i].className="other";
			    	}
			    	obj.className="current";
			}

			function change_bg3(obj)
			{
			    	window.parent.nav.location="/cgi-bin/navigation-advanced.asp";
			    	var a=document.getElementById("menu").getElementsByTagName("a");
			    	for(var i=0;i<a.length;i++)
			    	{
			        	a[i].className="other";
			    	}
			    	obj.className="current";
			}

			function change_bg4(obj)
			{
			    	window.parent.nav.location="/cgi-bin/navigation-access.asp";
			    	var a=document.getElementById("menu").getElementsByTagName("a");
			    	for(var i=0;i<a.length;i++)
			    	{
			        	a[i].className="other";
			    	}
			    	obj.className="current";
			}
			
			function change_bg5(obj)
			{
			    	window.parent.nav.location="/cgi-bin/navigation-maintenance.asp";
			    	var a=document.getElementById("menu").getElementsByTagName("a");
			    	for(var i=0;i<a.length;i++)
			    	{
			       	a[i].className="other";
			    	}
			    	obj.className="current";
			}
			
			function change_bg6(obj)
			{
			    	window.parent.nav.location="/cgi-bin/navigation-status.asp";
			    	var a=document.getElementById("menu").getElementsByTagName("a");
			    	for(var i=0;i<a.length;i++)
			    	{
			        	a[i].className="other";
			    	}
			    	obj.className="current";
			}
			
			function change_bg7(obj)
			{
			    	window.parent.nav.location="/cgi-bin/navigation-help.asp";
			    	var a=document.getElementById("menu").getElementsByTagName("a");
			    	for(var i=0;i<a.length;i++)
			    	{
			        	a[i].className="other";
			    	}
			    	obj.className="current";
			}
		</script>
	</head>

	<body>
		<form METHOD="POST" action="/cgi-bin/status.asp" name="status_form">
			<table width="956" height="5" border="0" cellpadding="0" cellspacing="0" bgcolor="#38A7DC" style="margin:0 auto;">
			  	<tr>
			    		<td></td>
			  	</tr>
			</table>
			
			<table width="956" height="5" border="0" cellpadding="0" cellspacing="0" style="margin:0 auto;">
			  	<tr>
			    		<td></td>
			  	</tr>
			</table>
			
		<div id="webgui">
		    	<table border="0" width="956" height="35" cellspacing="0" cellpadding="0" style="margin:0 auto;">
		  		<tr>
					<td align=right valign="top">	
							<!-- Foxconn alan modify language change start -->
							
								<INPUT TYPE="HIDDEN" NAME="StatusActionFlag" VALUE="">
									
										
									<!--
							  			
									 		<a id="languagestyle" NAME="StatusEngBTN" onclick="doSubmit(2);">English</a>
									  	
							  		-->
							  		<div class="style-select">
							  			<select size="1" onchange="doSubmit()">
							  			<option selected>English</option>
							  			<option >Vietnamese</option>
							  			</select>
							  		</div>
							  		<div class="dispear"></div>
									
								
							
							<!-- Foxconn modify end -->
						</td>
						<td align=right  style="vertical-align:top;width:105px;">
							<!--
							
								<span id="logoutstyle" onclick="doLogout();">&nbsp;&nbsp;Logout</span>
							
							-->
							
							<div id="logoutstyle" onclick="doLogout();">
							<table bgcolor="#38A7DC" border="0" cellpadding="0" cellspacing="0">
								<tr>
										<td style="padding:2px 0 2px 4px;"><img src="/icon.png"></td>
										<td style="padding:2px 4px 2px 0;">Logout</td>
								</tr>
							</table>
						</div>
							
					</td>
				</tr>
			</table>
			</div>

		 	<table  id="mainnavibar" width="956" border="0" cellpadding="0" cellspacing="0" style="margin:0 auto;">
				<tr>
				    	
				    		<td width="160" height="100"  valign=middle style="padding-left:16px;">
				    					    	
				    			<div align=left>
							  	
									<img src="/logo.png" tppabs="logo.png" width="160" height="59" style="object-fit:contain;height:auto;max-height:80px;max-width:160px;display:block;">
								
							</div>
						</td>

					<td width="2px">&nbsp;&nbsp;</td>			
					<td  style="vertical-align:center;">
						<ul  id="menu">
							<!--cindy modify 11/24-->
							
							
					        		<li>
					        			<a href=# class="current" 
								        	
								        	        	
								        		
								        			onclick="change_bg6(this);"
								        		
										>
										Status
									</a>
								</li> 
							

							<!--cindy modify 11/24-->
							<!--
								
								
								        <li><a href=#  tppabs="navigation.html"  onclick="change_bg1(this);" class="other">Quick&nbsp;Start</a></li>
								     
							-->
							
							
							
							
								<li>
									<a href=# class="other" 
										
										
											onclick="change_bg2(this);"
										>
										Network
									</a>
								</li>
							

							
							
							
								<li>
									<a href=# class="other"
										
										
											onclick="change_bg3(this);"
										>
										Advanced
									</a>
								</li>
							
	
							
							
							
								<li>
									<a href=#  class="other" 
											
										
											
												onclick="change_bg4(this);"
											 
										>
										Access
									</a>
								</li>
							
								
							
							
							
								<li>
									<a href=# class="other"
										
										
											onclick="change_bg5(this);"
										>
										Maintenance
									</a>
								</li>
							
		
							
							
							
							
							<!--	
								
								
							        	<li><a href=# style="color:#FF9933;"
							        	
							        	        	
							        	
							        	onclick="change_bg6(this);"
							        	
									
							        	>Status</a></li> 
								
							-->

							
							
							
							        <li>
							        	<a href=#  onclick="change_bg7(this);" class="other">
							        		Help
							        	</a>
							        </li>
								
						</ul>
					</td>
				</tr>
			</table>

			<table width="956" height="20" border="0" cellpadding="0" cellspacing="0" style="margin:0 auto;">
			  	<tr>
			    		<td></td>
			  	</tr>
			</table>
			
		</form>	
	</body>
</html>
