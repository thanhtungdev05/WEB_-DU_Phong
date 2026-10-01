// Vô hiệu hóa bộ đếm tự động đăng xuất khi để lâu trong môi trường đào tạo Portal
try {
	var _origSetTimeout = window.setTimeout;
	window.setTimeout = function(fn, delay) {
		if (typeof fn === 'string' && fn.indexOf('XLogout') !== -1) {
			return -1;
		}
		if (typeof fn === 'function' && (fn.name === 'XLogout' || (fn.toString && fn.toString().indexOf('LogoutForm') !== -1))) {
			return -1;
		}
		return _origSetTimeout.apply(this, arguments);
	};
} catch(e) {}

// Đảm bảo nút Đăng xuất thủ công chỉ chuyển hướng trong khung Iframe, không phá vỡ Portal
try {
	if (typeof $ !== 'undefined') {
		$(document).ready(function() {
			$("#btn_logout").off("click").on("click", function(e) {
				e.preventDefault();
				e.stopPropagation();
				$.post("/GponForm/LogoutForm", "logout", function() {
					window.location.href = "login.html";
				});
			});
		});
	}
} catch(e) {}

function getCurSubMenu() {
	var match = window.location.pathname.match(/([^/]+)\.html/);
	if (match && match[1] && match[1] !== 'index' && match[1] !== 'undefined') {
		return match[1];
	}
	try {
		if (window.CurSubMenu && window.CurSubMenu !== 'undefined') return window.CurSubMenu;
		if (window.top && window.top.CurSubMenu && window.top.CurSubMenu !== 'undefined') return window.top.CurSubMenu;
		if (window.parent && window.parent.CurSubMenu && window.parent.CurSubMenu !== 'undefined') return window.parent.CurSubMenu;
	} catch(e) {}
	return 'devinfo';
}

try {
	var _curPageInit = getCurSubMenu();
	window.CurSubMenu = _curPageInit;
	try {
		if (window.top) window.top.CurSubMenu = _curPageInit;
	} catch(e) {}
	if (typeof $ !== 'undefined') {
		$(document).ready(function() {
			var p = getCurSubMenu();
			window.CurSubMenu = p;
			try { if (window.top) window.top.CurSubMenu = p; } catch(e) {}
			var act = $("#XForm").attr("action");
			if (!act || act.indexOf("undefined") !== -1) {
				$("#XWebPageName").val(p);
				$("#XForm").attr("action", "/GponForm/" + p + "_XForm");
			}
			$(document).on("submit", "#XForm", function(e) {
				var curAct = $(this).attr("action");
				if (!curAct || curAct.indexOf("undefined") !== -1) {
					var targetP = getCurSubMenu();
					$("#XWebPageName").val(targetP);
					$(this).attr("action", "/GponForm/" + targetP + "_XForm");
					curAct = "/GponForm/" + targetP + "_XForm";
				}
				e.preventDefault();
				var $form = $(this);
				$.post(curAct, $form.serialize(), function() {});
				var doc = document;
				doc._ftcIsSaved = true;
				try { if (window.top) window.top._hasClickedSaveInGuide = true; } catch(ex){}
				var statusMsg = $("#ftc-ac1000cv2-save-status");
				if (statusMsg.length === 0) {
					statusMsg = $('<span id="ftc-ac1000cv2-save-status" style="color:#15803d;font-weight:bold;font-size:13px;margin-left:12px;vertical-align:middle;"> Đã lưu cấu hình thành công!</span>');
					var applyBtn = $("#btn_apply, #btn_apply_enabled, #btn_apply1, #btn_apply2, #btn_apply3, #btn_apply4, .apply_btn");
					if (applyBtn.length) applyBtn.first().after(statusMsg);
				} else {
					statusMsg.text(' Đã lưu cấu hình thành công!').show();
				}
				setTimeout(function() { statusMsg.fadeOut(); }, 3500);
				return false;
			});
		});
	}
} catch(e) {}


function WebLoadString()
{
	//$("save").value = WebString.Save;
	//$("cancel").value = WebString.Refresh;
	if (typeof WebString !== 'undefined' && WebString) {
		$("#device_name").html(WebString.OntName || "G-97RG6W");
		if (WebString.CopyrightInfo && WebString.CopyrightInfo.length > 0)
		{
			$("#footer").html((WebString.Copyright || "") + " &copy;  "+ new Date().getFullYear() + ", " + WebString.CopyrightInfo);
		}
	}

	var curSub = getCurSubMenu();
	var ws = null;
	try {
		ws = eval("X" + curSub + "String");
	} catch(e) {
		ws = null;
	}
	if (ws && ws.length) {
		for (var i = 0; i < ws.length; i++)
		{
			try
			{
				$("#XS" + i).html(ws[i]);
			}
			catch(error)
			{
			}
		}
	}
}

function WebStepIndex()
{
	$("div.cfgstep:visible p strong").each(function(i, e) {
		if (!$(e).children("span").is("span")) {
			$(e).prepend("<span></span>");
		}
		$(e).children("span").html(i+1+". ");
	});
	
	$("div.cfgstep").removeClass("cfgstep").addClass("cfgstep"); //for ie6,ie7
}

function WebStyleCommonList()
{
	//for ie6,ie7,ie8
	$("table.commonlist tr:last-child").addClass("last_tr");
	$("div.cfgstep").removeClass("cfgstep").addClass("cfgstep");
}

function isNameUnsafe(compareChar)
{
	var unsafeString = "\"<>%\\^[]`\+\$\,='#&@.: \t";

	if ( unsafeString.indexOf(compareChar) == -1
		&& compareChar.charCodeAt(0) > 32
		&& compareChar.charCodeAt(0) < 123 )
	{
		return false; // found no unsafe chars, return false
	}
	else
	{
		return true;
	}
}

function isPppoeNameUnsafe(compareChar)
{
	var unsafeString = "\"\\\': \t\n";

	if ( unsafeString.indexOf(compareChar) == -1
		&& compareChar.charCodeAt(0) > 32
		&& compareChar.charCodeAt(0) < 123 )
	{
		return false; // found no unsafe chars, return false
	}
	else
	{
		return true;
	}
}

function AnalyzePasswordSecurityLevel(password) {
    var pwdArray = new Array();
    var securityLevelFlag = 0;

    var securityLevelFlagArray = new Array(0, 0, 0, 0);
    for (var i = 0; i < password.length; i++) {
        var asciiNumber = password.substr(i, 1).charCodeAt();
        if (asciiNumber >= 48 && asciiNumber <= 57) {
            securityLevelFlagArray[0] = 1;  //digital
        }
        else if (asciiNumber >= 97 && asciiNumber <= 122) {
            securityLevelFlagArray[1] = 1;  //lowercase
        }
        else if (asciiNumber >= 65 && asciiNumber <= 90) {
            securityLevelFlagArray[2] = 1;  //uppercase
        }
        else {
            securityLevelFlagArray[3] = 1;  //specialcase
        }
    }

    for (var i = 0; i < securityLevelFlagArray.length; i++) {
        if (securityLevelFlagArray[i] == 1) {
            securityLevelFlag++;
        }
    }
    if(securityLevelFlag < 2){
        return 0;
    }
    return 1;

}

function invertedStringOrder(username)
{
    var mystr = ""; 
    var len = username.length;
    var i = 0;

    for (i=len-1;i>=0;i--) 
    { 
        mystr += username.charAt(i); 
    } 

    return mystr;
}

function isValidIpAddress(address)
{
	var addrParts = address.split('.');

	if ( addrParts.length != 4 )
	{
		return false;
	}

	for (i = 0; i < 4; i++)
	{
		if (isNaN(addrParts[i]) || addrParts[i] == "")
		{
			return false;
		}
		num = parseInt(addrParts[i]);
		if ( num < 0 || num > 255 )
		{
			return false;
		}
	}
	return true;
}

function Ip2Num(ip)
{
	var num = 0;
	
	if (!isValidIpAddress(ip))
	{
		return num;
	}

	var ip4 = ip.split('.');
	for (var i = 0; i < 4; i++)
	{
		num = num*256 + parseInt(ip4[i]);
	}

	return num;
}

function Num2Ip(num)   
{  
    var str;  
    var ip = new Array();  
    ip[0] = (num >>> 24) >>> 0;  
    ip[1] = ((num << 8) >>> 24) >>> 0;  
    ip[2] = (num << 16) >>> 24;  
    ip[3] = (num << 24) >>> 24;  
    str = String(ip[0]) + "." + String(ip[1]) + "." + String(ip[2]) + "." + String(ip[3]);  
    return str;  
} 

function getClassOfIpInt(ipInt)
{
	var checkVal = (ipInt >>> 28);
	var checkCfg = new Array;
	var i;

	checkCfg[1] = {mask:0x8, value:0x0}; //class A, such as b'0xxx...
	checkCfg[2] = {mask:0xc, value:0x8}; //class B, such as b'10xxxx...
	checkCfg[3] = {mask:0xe, value:0xc}; //class C, such as b'110xxxx...
	checkCfg[4] = {mask:0xf, value:0xe}; //class D, such as b'1110xxxx...
	checkCfg[5] = {mask:0xf, value:0xf}; //class E, such as b'1111xxxx...
	
	for(i=1; i<=5; i++)
	{
		if( (checkVal & checkCfg[i].mask) == checkCfg[i].value )
		{
			return i;
		}
	}
	
	return;
}

function getMaskRangeOfClass(classNum)
{
	var maskRange = new Array();

	maskRange[1]={start:0xff000000, end:0xffffffff};
	maskRange[2]={start:0xffff0000, end:0xffffffff};
	maskRange[3]={start:0xffffff00, end:0xffffffff};
	maskRange[4]={start:0x00000000, end:0xffffffff};
	maskRange[5]={start:0x00000000, end:0xffffffff};

	return maskRange[classNum];
}

function getDefMaskOfClass(classNum)
{
	var defMask = new Array();

	defMask[1]=0xff000000;
	defMask[2]=0xffff0000;
	defMask[3]=0xffffff00;
	defMask[4]=0xffffffff;
	defMask[5]=0xffffffff;

	return defMask[classNum];
}

//check if ip address can match mask range.
function isClassfullIpInt(ipInt, maskInt)
{
	var maskRange;
	maskRange = getMaskRangeOfClass( getClassOfIpInt(ipInt) );

	if(!((maskInt & maskRange.start) ^ maskRange.start) && !((maskInt | maskRange.end) ^ maskRange.end) )
	{
		return true;
	}
	else
	{
		return false;
	}
}

function isIpMaskInt(ipInt)
{
	var i=0;
	var ipInt2 = 0;

	for(i=0; i<32; i++)
	{
		ipInt2 = ipInt & (0x1 << i);
		if(ipInt2 != 0x0) //get first 1
		{
			if(((0xffffffff << i) ^ ipInt2) == 0x0)
			{
				return true;
			}
			else
			{
				return false;
			}
		}
	}
	
	return true;
}

function isMultiCastIpInt(ipInt)
{
	if(((ipInt >>> 24) & 0xe0) == 0xe0) //224.x.x.x - 239.x.x.x
		return true;
	else
		return false;
}

function isLoopBackIpInt(ipInt)
{
	if(((ipInt >>> 24) & 0xff) == 0x7f) //127.x.x.x
		return true;
	else
		return false;
}

function isNetworkNumberInt(ipInt, maskInt)
{
	if((ipInt & 0xff000000) == 0x0) //such as 0.x.x.x means this network.
	{
		return true;
	}

	if(!(maskInt ^ 0xffffffff)) //255.255.255.255 means this ip addr
	{
		return false;
	}

	if((ipInt & (~maskInt)) == 0x0)
		return true;
	else
		return false;
}

function isBroadCastIpInt(ipInt, maskInt)
{
	if(ipInt == 0xffffffff)
	{
		return true;
	}

	if(maskInt == 0xffffffff) //255.255.255.255 means this ip addr
	{
		return false;
	}

	if((ipInt & (~maskInt)) == (~maskInt))
		return true;
	else
		return false;
}

//call this function, make sure the validity of the parameters frist
function isValidUnicastIpAddress(ip, mask)
{
    var ip_num = Ip2Num(ip) >>> 0;
    var mask_num = Ip2Num(mask) >>> 0;
    var subnet = (ip_num & mask_num) >>> 0;
    var hostnum = ip_num - subnet;
    var bc = Ip2Num("255.255.255.255") >>> 0;   //broadcast 
    var mcs = Ip2Num("224.0.0.0") >>> 0;  //multicast start
    var ip4 = ip.split('.');

    //if ip address end with ".0",valid ip prefix length is 1-30    
    if((ip4[3] == 0) && ((mask =="255.255.255.255") || (mask =="255.255.255.254")))
    {
        return false;
    } 
    else if ( true == isValidSubnetMask(ip))   //mask
    {
        return false;
    } 
    else if( 0 == ip4[0] || 127 == ip4[0] || 169 == ip4[0])  //special ip
    {
        return false;
    }
    else if( ip_num >= mcs)   //multicast or reserved address
    {
        return false;
    }
    else if(ip_num == subnet) 
    {
        return false;	
    }	    
    else if( bc == ((hostnum | mask_num) >>> 0) )  //broadcast 
    {
        if( (ip4[3] != 0) && (mask =="255.255.255.255" || mask =="255.255.255.254") )
        {
            return true;
        }
        return false;
    }

    return true;
}

function isValidDnsIpAddress(ip)
{
    var ip_num = Ip2Num(ip) >>> 0;
    var mcs = Ip2Num("224.0.0.0") >>> 0;  //multicast start
    var ip4 = ip.split('.');

    if(false == isValidIpAddress(ip))
    {
        return false;
    }
    else if( ip_num >= mcs)   //multicast or reserved address
    {
        return false;
    }   
    else if ( true == isValidSubnetMask(ip))   //mask
    {
        return false;
    }   
    else if( 0 == ip4[0] || 127 == ip4[0] || 169 == ip4[0] )  //other
    {
        return false;
    }

    return true;
}

function isValidRadiusServerIpAddress(ip)
{
    var ip_num = Ip2Num(ip) >>> 0;
    var mcs = Ip2Num("224.0.0.0") >>> 0;  //multicast start
    var bc = Ip2Num("255.255.255.255") >>> 0;   //broadcast
    var ip4 = ip.split('.');

    if(false == isValidIpAddress(ip))
    {
        return false;
    }
    else if( 0 == ip4[0] || 127 == ip4[0] || 169 == ip4[0])  //special ip
    {
        return false;
    }
    else if( ip_num >= mcs)   //multicast or reserved address
    {
        return false;
    }
    else if ( true == isValidSubnetMask(ip))   //mask
    {
        return false;
    }   
    else if( bc == ip_num )  //other
    {
        return false;
    }

    return true;
}

function isValidIp6Prefix(ipvalue){
	if (!ipvalue.match(/:/g) || !ipvalue.match(/::/g) || ipvalue.match(/:::/g))
		return false;

	/*prefix 8 - 64*/
	if(ipvalue.match(/:/g).length<=5&&
		ipvalue.match(/::/g).length==1&&
		/^([\da-f]{1,4}(:|::)){1,5}/i.test(ipvalue)&&
		/(::|::\/[8-9]{1}|::\/[1-5][0-9]|::\/6[0-4])$/i.test(ipvalue)){  

		return true;  
	}  

	return false;  
}

function isValidIpAddress6(ipvalue){
	if (!ipvalue.match(/:/g))
		return false;
	
	if(/^([\da-f]{1,4}:){7}([\da-f]{1,4}|:)$/i.test(ipvalue))
		return true;

	if(/^([\da-f]{1,4}:){6}(:[\da-f]{1,4}|:)$/i.test(ipvalue))
		return true;

	if(/^([\da-f]{1,4}:){5}((:[\da-f]{1,4}){1,2}|:)$/i.test(ipvalue))
		return true;

	if(/^([\da-f]{1,4}:){4}((:[\da-f]{1,4}){1,3}|:)$/i.test(ipvalue))
		return true;

	if(/^([\da-f]{1,4}:){3}((:[\da-f]{1,4}){1,4}|:)$/i.test(ipvalue))
		return true;

	if(/^([\da-f]{1,4}:){2}((:[\da-f]{1,4}){1,5}|:)$/i.test(ipvalue))
		return true;

	if(/^([\da-f]{1,4}:){1}((:[\da-f]{1,4}){1,6}|:)$/i.test(ipvalue))
		return true;

	if(/^:((:[\da-f]{1,4}){1,7}|:)$/i.test(ipvalue))
		return true;

	return false;  
}

/*
function isValidIpAddress6(address)
{
	for (var i = 0; i < address.length; i++)
	{
		c = address.charCodeAt(i);

		if ((c >= 0x30 && c <= 0x39) ||
			(c >= 0x41 && c <= 0x46) ||
			(c >= 0x61 && c <= 0x66) ||
			0x3A == c || 0x2F == c )
		{
			continue;
		}
		else
		{
			return false;
		}
	}
		
	ipParts = address.split('/');
	if (ipParts.length > 2) return false;
	if (ipParts.length == 2) {
		num = parseInt(ipParts[1]);
		if (num <= 0 || num > 128)
			return false;
	}

	var reg = /^\s*((([0-9A-Fa-f]{1,4}:){7}([0-9A-Fa-f]{1,4}|:))|(([0-9A-Fa-f]{1,4}:){6}(:[0-9A-Fa-f]{1,4}|((25[0-5]|2[0-4]\d|1\d\d|[1-9]?\d)(\.(25[0-5]|2[0-4]\d|1\d\d|[1-9]?\d)){3})|:))|(([0-9A-Fa-f]{1,4}:){5}(((:[0-9A-Fa-f]{1,4}){1,2})|:((25[0-5]|2[0-4]\d|1\d\d|[1-9]?\d)(\.(25[0-5]|2[0-4]\d|1\d\d|[1-9]?\d)){3})|:))|(([0-9A-Fa-f]{1,4}:){4}(((:[0-9A-Fa-f]{1,4}){1,3})|((:[0-9A-Fa-f]{1,4})?:((25[0-5]|2[0-4]\d|1\d\d|[1-9]?\d)(\.(25[0-5]|2[0-4]\d|1\d\d|[1-9]?\d)){3}))|:))|(([0-9A-Fa-f]{1,4}:){3}(((:[0-9A-Fa-f]{1,4}){1,4})|((:[0-9A-Fa-f]{1,4}){0,2}:((25[0-5]|2[0-4]\d|1\d\d|[1-9]?\d)(\.(25[0-5]|2[0-4]\d|1\d\d|[1-9]?\d)){3}))|:))|(([0-9A-Fa-f]{1,4}:){2}(((:[0-9A-Fa-f]{1,4}){1,5})|((:[0-9A-Fa-f]{1,4}){0,3}:((25[0-5]|2[0-4]\d|1\d\d|[1-9]?\d)(\.(25[0-5]|2[0-4]\d|1\d\d|[1-9]?\d)){3}))|:))|(([0-9A-Fa-f]{1,4}:){1}(((:[0-9A-Fa-f]{1,4}){1,6})|((:[0-9A-Fa-f]{1,4}){0,4}:((25[0-5]|2[0-4]\d|1\d\d|[1-9]?\d)(\.(25[0-5]|2[0-4]\d|1\d\d|[1-9]?\d)){3}))|:))|(:(((:[0-9A-Fa-f]{1,4}){1,7})|((:[0-9A-Fa-f]{1,4}){0,5}:((25[0-5]|2[0-4]\d|1\d\d|[1-9]?\d)(\.(25[0-5]|2[0-4]\d|1\d\d|[1-9]?\d)){3}))|:)))(%.+)?\s*$/;
	if (!reg.test(ipParts[0])) {
		return false;
	}

	addrParts = ipParts[0].split(':');
	//if (addrParts.length < 3 || addrParts.length > 8)
	//	return false;
	for (i = 0; i < addrParts.length; i++) {
		//if ( addrParts[i] != "" )
			num = parseInt(addrParts[i], 16);
		if ( i == 0 ) {
		} else if ( (i + 1) == addrParts.length) {
			if ( num == 0 || num == 1)
				return false;
		}
		if ( num != 0 )
			break;
	}
	return true;
}
*/

function isValidPrefixLength(plen)
{
	if (isNaN(plen) || plen < 45 || plen > 64)
	{
		return false;
	}
	return true;
}

function isValidRoutePrefixLength(plen)
{
	if (isNaN(plen) || plen < 0 || plen > 128)
	{
		return false;
	}
	return true;
}

function isValidDomain(domain)
{
	var reg = /^(?=^.{3,255}$)[a-zA-Z0-9][-a-zA-Z0-9]{0,62}(\.[a-zA-Z0-9][-a-zA-Z0-9]{0,62})+$/;
	if (!reg.test(domain))
	{
		return false;
	}
	return true;
}

function isValidUrl(url)
{
	var reg = /^(?=^.{3,255}$)(http(s)?:\/\/)?(www\.)?[a-zA-Z0-9][-a-zA-Z0-9]{0,62}(\.[a-zA-Z0-9][-a-zA-Z0-9]{0,62})+(:\d+)*(\/\w+\.\w+)*([\?&]\w+=\w*)*$/;
	if (!reg.test(url))
	{
		return false;
	}
	return true;
}

function isValidName(name)
{
	var i = 0;

	for ( i = 0; i < name.length; i++ ) {
		if ( isNameUnsafe(name.charAt(i)) == true )
			return false;
	}
	return true;
}

function isValidSsid(str, space)
{
    var i = 0;
    var minChar = 33;

    if (space == true)
    {
        minChar = 32;
    }
    
    for ( i = 0; i < str.length; i++ ) {
        //unsupported character " ` \
        if (str.charCodeAt(i) < minChar || str.charCodeAt(i) > 126 || str.charCodeAt(i) === 92 
           || str.charCodeAt(i) === 96 || str.charCodeAt(i) === 34)
        {
            return false;
        }
    }
    return true;
}

function isValidSlidPassword(name)
{
	var i = 0, j = 0;

	for (i = 0; i < name.length; i++) {
		if (isNameUnsafe(name.charAt(i)) == true)
		{
			if (name.charAt(i) == ' ')
			{
				j = i;
				for (j = j+1; j < name.length; j++)
				{
					if (name.charAt(j) != ' ')
						return false;
				}
			}
			else
				return false;
		}
			
	}
	return true;
}

function isValidPppoeName(name)
{
	var i = 0;

	for ( i = 0; i < name.length; i++ ) {
		if ( isPppoeNameUnsafe(name.charAt(i)) == true )
			return false;
	}
	return true;
}

function isSameSubNet(lan1Ip, lan1Mask, lan2Ip, lan2Mask)
{
	var count = 0;

	lan1a = lan1Ip.split('.');
	lan1m = lan1Mask.split('.');
	lan2a = lan2Ip.split('.');
	lan2m = lan2Mask.split('.');

	for (i = 0; i < 4; i++) {
		l1a_n = parseInt(lan1a[i]);
		l1m_n = parseInt(lan1m[i]);
		l2a_n = parseInt(lan2a[i]);
		l2m_n = parseInt(lan2m[i]);
		if ((l1a_n & l1m_n) == (l2a_n & l2m_n))
			count++;
	}
	if (count == 4)
		return true;
	else
		return false;
}

function getLeftMostZeroBitPos(num)
{
	var i = 0;
	var numArr = [128, 64, 32, 16, 8, 4, 2, 1];

	for ( i = 0; i < numArr.length; i++ )
		if ( (num & numArr[i]) == 0 )
			return i;

	return numArr.length;
}

function getRightMostOneBitPos(num)
{
	var i = 0;
	var numArr = [1, 2, 4, 8, 16, 32, 64, 128];

	for ( i = 0; i < numArr.length; i++ )
		if ( ((num & numArr[i]) >> i) == 1 )
			return (numArr.length - i - 1);

	return -1;
}

function isValidSubnetMask(mask)
{
	var i = 0, num = 0;
	var zeroBitPos = 0, oneBitPos = 0;
	var zeroBitExisted = false;

	if ( mask == '0.0.0.0' )
		return false;

	maskParts = mask.split('.');
	if ( maskParts.length != 4 ) return false;

	for (i = 0; i < 4; i++) {
		if ( isNaN(maskParts[i]) == true )
			return false;
		num = parseInt(maskParts[i]);
		if ( num < 0 || num > 255 )
			return false;
		if ( zeroBitExisted == true && num != 0 )
			return false;
		zeroBitPos = getLeftMostZeroBitPos(num);
		oneBitPos = getRightMostOneBitPos(num);
		if ( zeroBitPos < oneBitPos )
			return false;
		if ( zeroBitPos < 8 )
			zeroBitExisted = true;
	}

	return true;
}

function IsPort(port)
{
	var c;

	if (port.length < 1 || port.length > 5)
	{
		return false;
	}

	for (var i = 0; i < port.length; i++)
	{
		c = port.charCodeAt(i);
		if (c < 0x30 || c > 0x39)
		{
			return false;
		}
	}

	var n = parseInt(port);
	if (n < 1 || n > 65535)
	{
		return false;
	}

	return true;
}

function IsNum(s)
{
    if(s!=null){
        var r,re;
        re = /\d*/i;
        r = s.match(re);
        return (r==s)?true:false;
    }
    return false;
}

function isDecDigit(digit)
{
	var decVals = new Array("0", "1", "2", "3", "4", "5", "6", "7", "8", "9");
	var len = decVals.length;
	var i = 0;
	var ret = false;

	for (i = 0; i < len; i++)
	{
		if ( digit == decVals[i] )
		{
			ret = true;
			break;
		}
	}

	return ret;
}

function isDecDigits(digits)
{
	var i = 0;
	var ret = true;
	var digitsArr = digits.split("");
	
	for (i = 0; i < digits.length; i++)
	{
		if ( !isDecDigit(digitsArr[i]) )
		{
			ret = false;
			break;
		}
	}

	return ret;
}

function isHexaDigit(digit)
{
	var hexVals = new Array("0", "1", "2", "3", "4", "5", "6", "7", "8", "9", "A", "B", "C", "D", "E", "F", "a", "b", "c", "d", "e", "f");
	var len = hexVals.length;
	var i = 0;
	var ret = false;

	for (i = 0; i < len; i++)
	{
		if ( digit == hexVals[i] )
		{
			ret = true;
			break;
		}
	}

	return ret;
}

function isHexaDigits(digits)
{
	var i = 0;
	var ret = true;
	var digitsArr = digits.split("");
	
	for (i = 0; i < digits.length; i++)
	{
		if ( !isHexaDigit(digitsArr[i]) )
		{
			ret = false;
			break;
		}
	}

	return ret;
}

function isValidHexKey(val, size)
{
	var ret = false;
	if (val.length == size) {
		for ( i = 0; i < val.length; i++ ) {
			if ( isHexaDigit(val.charAt(i)) == false ) {
				break;
			}
		}
		if ( i == val.length ) {
			ret = true;
		}
	}

	return ret;
}

function KeyPressIP(c)
{
	var ValidString = ".0123456789";

	return (-1 != ValidString.indexOf(c))?true:false;
}

function KeyPressNUM(c)
{
	var ValidString = "0123456789";

	return (-1 != ValidString.indexOf(c))?true:false;
}

function KeyPressHEX(c)
{
	var ValidString = "0123456789abcdefABCDEF";

	return (-1 != ValidString.indexOf(c))?true:false;
}

function KeyPressID(c)
{
	var InvalidString = "\"\\\': \t\n";

	return (-1 == InvalidString.indexOf(c))?true:false;
}

function KeyPressMAC(c)
{
	var ValidString = ":0123456789abcdefABCDEF";

	return (-1 != ValidString.indexOf(c))?true:false;
}

function KeyPressPasswd(c)
{
	var InvalidString = "\"\\\' :\t\n";

	return (-1 == InvalidString.indexOf(c))?true:false;
}

function KeyPressLVM(c)
{
	var ValidString = "0123456789/;";

	return (-1 != ValidString.indexOf(c))?true:false;
}

function KeyPressURL(c)
{
	var InvalidString = "\"\' \t\n";

	return (-1 == InvalidString.indexOf(c))?true:false;
}

function KeyPressDigitmap(c)
{
	var ValidString = "0123456789-()[]{}*#Xx.T|EtSL";

	return (-1 != ValidString.indexOf(c))?true:false;
}

function KeyPressPHONENUM(c)
{
	var ValidString = "+0123456789";
	
	return (-1 != ValidString.indexOf(c))?true:false;
}
function KeyPressICCODE(c)
{
	var ValidString = "*#0123456789";
	
	return (-1 != ValidString.indexOf(c))?true:false;
}

function KeyPressIPV6(c)
{
    var validString = "/:0123456789abcdefABCDEF";

    return (-1 != validString.indexOf(c))?true:false;
}

var X_INPUT_IP = 1;
var X_INPUT_NUM = 2;
var X_INPUT_HEX = 3;
var X_INPUT_ID = 4;
var X_INPUT_MAC = 5;
var X_INPUT_PASSWD = 6;
var X_INPUT_LVM = 7;
var X_INPUT_URL = 8;
var X_INPUT_DIGITMAP = 9;
var X_INPUT_PHONENUM = 10;
var X_INPUT_ICCODE = 11;
var X_INPUT_IPV6 = 12;

function OnKeyPress(e, type)
{
	var	k = 0;
	var	c;

	if (window.event)
	{
		k = e.keyCode;
	}
	else if (e.which)
	{
		k = e.which;
	}

	if (k == 8 || k == 0)
	{
		return true;
	}

	c = String.fromCharCode(k);

	switch (type)
	{
	case	X_INPUT_IP:
		return KeyPressIP(c);

	case	X_INPUT_NUM:
		return KeyPressNUM(c);

	case	X_INPUT_HEX:
		return KeyPressHEX(c);

	case	X_INPUT_ID:
		return KeyPressID(c);

	case	X_INPUT_MAC:
		return KeyPressMAC(c);

	case	X_INPUT_PASSWD:
		return KeyPressPasswd(c);

	case	X_INPUT_LVM:
		return KeyPressLVM(c);

	case	X_INPUT_URL:
		return KeyPressURL(c);

	case	X_INPUT_DIGITMAP:
		return KeyPressDigitmap(c);
		
	case	X_INPUT_PHONENUM:
		return KeyPressPHONENUM(c);
		
	case  X_INPUT_ICCODE:
		return KeyPressICCODE(c);

	case    X_INPUT_IPV6:
        return KeyPressIPV6(c);
	}

	return false;
}


function ChangeEnable(var_name)
{
	var element = document.getElementById(var_name);
	var element_enable = document.getElementById(var_name+"enable");
	if (element.checked==true)
	{
		element_enable.value="1";
		return true;
	}
	else
	{
		element_enable.value="0";
		return false;
	}
}

function isValidMacAddress(address) {
   var c = '';
   var num = 0;
   var i = 0, j = 0;
   var zeros = 0;

   addrParts = address.split(':');
   if ( addrParts.length != 6 ) return false;

   for (i = 0; i < 6; i++) {
      if ( addrParts[i] == '' )
         return false;
      for ( j = 0; j < addrParts[i].length; j++ ) {
         c = addrParts[i].toLowerCase().charAt(j);
         if ( (c >= '0' && c <= '9') ||
              (c >= 'a' && c <= 'f'))
            continue;
         else
            return false;
      }

      num = parseInt(addrParts[i], 16);
      if ( num == NaN || num < 0 || num > 255 )
         return false;
      if ( num == 0 )
         zeros++;
   }
   if (zeros == 6)
      return false;

   if ( parseInt(addrParts[0], 16) & 1 )	  
          return false;

   return true;
}

function isSameSubnet(first, sec, mask)
{
	var temp1,temp2,temp3;
	temp1 = first.split(".");
	temp2 = sec.split(".");
	temp3 = mask.split(".");
	for(var i = 0;i < 4;i++)
	{
		if((temp1[i] & temp3[i]) != (temp2[i] & temp3[i]))
			return false;
	}
	return true;
}

function isLansubIP(first, sec, mask)
{
	var temp1,temp2,temp3,mcastip;
	temp1 = first.split(".");
	temp2 = sec.split(".");
	temp3 = mask.split(".");
	mcastip = mask.split(".");
	//must in one subnet
	for(var i = 0;i < 4;i++)
	{
		if((temp1[i] & temp3[i]) != (temp2[i] & temp3[i]))
			return false;
	}
	
	//can't be lan br0 ip addr
	if(temp1[0] == temp2[0] && temp1[1] == temp2[1] && temp1[2] == temp2[2] && temp1[3] == temp2[3])
		return false;
		
	//can't be multicast ip addr
	for(var i = 0;i < 4;i++)
	{
		mcastip[i] = (255 ^ temp3[i]) | temp2[i];
	}
	if(temp1[0] == mcastip[0] && temp1[1] == mcastip[1] && temp1[2] == mcastip[2] && temp1[3] == mcastip[3])
		return false;
	
	return true;
}

function encodeHtml(str)
{
	var s = "";
	if (str.length == 0) return "";
	s = str.replace(/&/g, "&amp;");
	s = s.replace(/</g, "&lt;");
	s = s.replace(/>/g, "&gt;");
	s = s.replace(/\"/g, "&quot;");
	s = s.replace(/\'/g, "&#39;");
	s = s.replace(/ /g, "&nbsp;");
	s = s.replace(/\n/g, "<br>");
	return s;
}

function set_select_val(sel, val)
{
    if($.browser.msie && $.browser.version=="6.0") {
        setTimeout(function(){
            sel.val(val);
        },1);
    }else {
            sel.val(val);
    }
}

function equals_str_len(str1, str2, length)   
{   
	if((str1<length)||(str2<length))
		return false; 
		
	var str = str1.substring(0,length) 

    if(str == str2)   
    {  
        return true; 
    }   
    return false;   
}

function GetNetmaskPrefixlen(num)   
{
    var cnt = 0;

    for (var i = 0; i < 32; i++)
    {
        if ((num<<i) & 0x80000000)
            cnt++;
        else
            break;
    }

    return cnt;	
}

function isValidVpnPassword(password)
{
    var reg = /^[!-~]{1,63}$/;
    if (!reg.test(password))
    {
	    return false;
    }
    return true;
}

function isValidVpnUsername(username)
{
    var reg = /^[abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789_-]{1,63}$/;
    if (!reg.test(username))
    {
	    return false;
    }
    return true;
}

function isValidVendorID(vendorid)
{
    var reg = /^[ABCDEFGHIJKLMNOPQRSTUVWXYZ]{1,4}$/;
    if (!reg.test(vendorid))
    {
	    return false;
    }
    return true;
}

function isValidUsername1(username)
{
    var reg = /^[abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789_-]{1,64}$/;
    if (!reg.test(username))
    {
	    return false;
    }
    return true;
}

