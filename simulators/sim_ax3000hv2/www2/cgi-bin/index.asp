<!DOCTYPE html PUBLIC "-//W3C//DTD XHTML 1.0 Frameset//EN" "http://www.w3.org/TR/xhtml1/DTD/xhtml1-frameset.dtd">
<html xmlns="http://www.w3.org/1999/xhtml" xml:lang="utf-8" lang="utf-8" dir="ltr">
<head>
<title>GPON Home Gateway</title>
<meta http-equiv="X-UA-Compatible" content="IE=EmulateIE7" />
<meta http-equiv="Content-Type" content="text/html; charset=UTF-8">
<meta http-equiv=Content-Script-Type content=text/javascript>
<meta http-equiv=Content-Style-Type content=text/css>
<script language="JavaScript" type="text/JavaScript">

var ary_strings = [
		['DesIPInvalid', 'Invalid destination IP address:'],
		['SorIPInvalid', 'Invalid Source IP Address!'],
		['IPIsEmpty', 'IP address is empty!'],
		['DesNetInvalid', 'Invalid Destination network mask!'],
		['SorNetInvalid', 'Invalid Source network mask!'],
		['SubMaskInvalid', 'Invalid subnet mask:'],
		['ContentCHN', 'can not contain chinese!!'],
		['IntegerInValid','An integer can only have digits'],
		['VPIInValid','VPI must be in the range 0-255'],
		['VCIInValid','VCI must be in the range 32-65535'],
		['PCRInvalid','PCR must be Interger'],
		['PCRSizeInvalid','PCR Range: 0 <= PCR <= 5500'],
		['SCRInvalid','SCR must be Interger'],
		['SCRSizeInvalid','SCR must be less than or equal to PCR'],
		['MBSInvalid','MBS must be Interger'],
		['MBRSizeInvalid','MBS Range: 0 <= MBS <= 65535'],
		['UpdateSucc','File upload succeeded, starting flash erasing and programming!!'],
		['VirsvrCgiRule','Rule'],
		['VirsvrCgiStartPort','Start Port'],
		['VirsvrCgiEndPort','End Port'],
		['VirsvrCgiLocalIP','Local IP Address'],
		['VirsvrCgiLocalStartPort','Start Port Local'],
		['VirsvrCgiLocalEndPort','End Port Local'],
		['VirsvrCgiEdit','Edit'],
		['VirsvrCgiDrop','Drop'],
		['ACLCgiIndexText','Index'],
		['ACLCgiActiveText','Active'],
		['ACLCgiSeIPAddrText','Secure IP Address'],
		['ACLCgiApplicationText','Application'],
		['ACLCgiInterfaceText','Interface'],
		['natcgiip','IP Address'],
		['natcginumber','Session number'],
		['natcgiremove','Remove'],
		['ShouldFailed','Should be filled'],
		['InvalidIP','Invalid IP'],
		['InvalidIPRange','Invalid IP, range:'],
		['ShouldCharacter','Should start with Character'],
		['StartCharacter','Start with character'],
		['InvalidName','Invalid Name'],
		['InvalidNum',' should be a number'],
		['EnterPassword','Enter a password before apply'],
		['PasswordConfirm','Password and Confirmed Password must match'],
		['NameCharacter','Host Name must start with a character'],
		['NameFormat','Host Name does not have correct format'],
		['NameContain','A host name must contain 1..63 characters'],
		['InvalidGWIP','Invalid Gateway IP address'],
		['InvalidMac','Invalid Mac address'],
		['InvalidNetwork','Invalid network address'],
		['InvalidNetSrc','Invalid net in source'],
		['InvalidNetMask','Invalid network mask'],
		['SelectSize','Please select a ping size less than 64000'],
		['SelectCount','please select ping count less than 10'],
		['InvalidPort','Invalid port number:'],
		['InvalidIpAddr','Invalid IP address'],
		['UserPassInvalid','A Username/Password cannot start with a number'],
		['UsernameNum','A name can not start with a number.'],
		['UserPassalpha','A Username/Password name can only have alpha-numeric characters'],
		['Usernamealpha','A name can only have alpha-numeric characters'],
		['UserPassone','A Username/Password must contain at least one character'],
		['Usernameone','A name must contain at least one character'],
		['UserPassStart','An Username/Password can start only with  alpha-numeric characters'],
		['integerDigits','An integer can only have digits'],
		['NatIPAddrRuleType','Rule Type'],
		['NatIPAddrStartIP','Local Start IP'],
		['NatIPAddrEndIP','Local End IP'],
		['NatIPAddrPublicStartIP','Public Start IP'],
		['NatIPAddrPublicEndIP','Public End IP'],
		['KeywordText','Keyword'],
		['SystemLogText','System Log Information'],
		['SystemLogDateText','Date'],
		['SystemLogTimeText','Time'],
		['SystemLogLevelText','Level'],
		['SystemLogSystemText','System'],
		['SystemLogActionText','Action'],
		['SystemLogText0','Click "Save" to save log file'],
		['SystemLogText1','Save'],
		['SystemLogText2','Refresh'],
		['SystemLogSetReadingText','Set System Log Level'],
		['SystemLogReadingText','Reading Level'],
		['SystemLogEmergencyText','Emergency'],
		['SystemLogAlertText','Alert'],
		['SystemLogCriticalText','Critical'],
		['SystemLogErrorText','Error'],
		['SystemLogWarningText','Warning'],
		['SystemLogNoticeText','Notice'],
		['SystemLogInformationalText','Info'],
		['SystemLogDebugText','Debug'],
		['vpiRange','VPI must be in the range 0-255'],
		['vciRange','VCI must be in the range 32-65535'],
		['pcrRange','PCR must be less than 64'],
		['InvalidIpAndNetMask','Invalid Ip & netMask'],
		['InvalidIPv6Addr','Invalid IPv6 Address:'],
		['InvalidIPv6Prefix','Invalid IPv6 Prefix:'],
		['IPv6WanIPGWDomain','IPv6 Wan IP Address and Default Gateway not at same network domain'],
		['CopyrightText','Copyright © 2022 FPT. All Rights Reserved.'],
		['','']
    ];


    function delCookie(name)
    {  
            var exp = new Date();  
            exp.setTime(exp.getTime() - 10000);  
            document.cookie = name + "=del;path=/;expires=" + exp.toGMTString();  
    }

    function doLoad()
    {
            document.configform.username.focus();
            delCookie("uid");
            delCookie("psw");
            delCookie("logout");
    }
</script>
</head>
<frameset rows="159,*" framespacing="0"  frameborder="0" >
        <frame name="header" src="/cgi-bin/status.asp" marginwidth="0" marginheight="0" frameborder="0" scrolling="no" style="background-color:#4acbd6;">

    <frameset cols="*,956,*,0" framespacing="0"  frameborder="0">
                        <frame name="blank" noresize src="/cgi-bin/blank.asp" marginwidth="0" marginheight="0" frameborder="0" scrolling="no" style="background-color:#4acbd6;">

        <frameset cols="266.5,*" framespacing="0"  frameborder="0">
                        <frame name="nav" noresize src="/cgi-bin/navigation-status.asp" marginwidth="0" marginheight="0" frameborder="0" scrolling="auto" style="background-color:#4acbd6;">
            <frame name="main" noresize src="/cgi-bin/status_deviceinfo.asp" marginwidth="0" marginheight="0" frameborder="0" scrolling="auto" style="background-color:#4acbd6;">
        </frameset>

                        <frame name="blank" noresize src="/cgi-bin/blank.asp" marginwidth="0" marginheight="0" frameborder="0" scrolling="no" style="background-color:#4acbd6;">
		<frame name="refreshfrm" noresize src="/cgi-bin/refresh.asp" marginwidth="0" marginheight="0" frameborder="no" border="0" scrolling="no" target="_self" style="background-color:#4acbd6;">
    </frameset>

    <noframes>
        <body>
            <p>Sorry, the browser does not support frames!</p>
        </body>
    </noframes>
</frameset>
<body onload="doLoad()">
</body>
</html>
