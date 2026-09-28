
 
<!DOCTYPE html PUBLIC "-//W3C//DTD XHTML 1.0 Transitional//EN" "http://www.w3.org/TR/xhtml1/DTD/xhtml1-transitional.dtd">
<html xmlns="http://www.w3.org/1999/xhtml" xml:lang="utf-8" dir="ltr" lang="utf-8">
<head>
<meta http-equiv="X-UA-Compatible" content="IE=11;IE=10;IE=9; IE=8; IE=7; IE=EDGE">
<meta http-equiv=Content-Script-Type content=text/javascript>
<meta http-equiv=Content-Style-Type content=text/css>
<meta http-equiv=Content-Type content="text/html; charset=UTF-8">
<style>
*{color:  #404040;}
</style>
<script language="JavaScript" src="/general.js"></script>
<script language="JavaScript" type="text/javascript" src="/ip_new.js"></script>
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

var wpsenable;

var wepidx;
var WEPSelectIndex;
function doCheckWepSelectIndex()
{
	var wlan=document.WLAN;
	
	WEPSelectIndex = wlan.WEP_Selection.selectedIndex;
	
	return true;	
}


function doStartWPS(){
	if((document.WLAN.WPSMode_Selection[0].checked)&&(document.WLAN.isInWPSing.value==0))
	{
	 	var pincode = document.WLAN.WPSEnrolleePINCode;
        var len = pincode.value.length;
	if(doPINCodeCheck(pincode) == false)
	{
		return ;
	}
	
	
        if(len <= 0)
	{
	    	alert("WPS PIN code couldn't be null!");
		return;
	}
    
	

	}

	if(document.WLAN.isInWPSing.value==0){//xyyou???
		alert("Please Start WPS peer within 2 minutes.");
	}
	document.WLAN.WpsStart.value = 1;
	document.WLAN.submit();
}

function doResetOOB(){
	document.WLAN.WpsOOB.value = 1;
	document.WLAN.submit();
}

function doGenerate(){
	document.WLAN.WpsGenerate.value = "1";
	document.WLAN.submit();
}


function doWEPTypeChange(){

}
function strESSIDCheck(str) {
if(str.value.match(/[^\x00-\xff]/g)){
	alert("Invalid SSID Input!");
	return true;
}
if(document.WLAN.ESSID.value.length <= 0){
	alert("SSID is empty");
	return true;
}
return false;
}
function doRegionCheck(){
	var vCountryName = document.WLAN.Countries_Channels.value;
	var ctlCountryRegion = document.WLAN.hCountryRegion;
	var ctlCountryRegion0 = document.WLAN.CountryRegion0;
	var ctlCountryRegion1 = document.WLAN.CountryRegion1;
	var ctlCountryRegion2 = document.WLAN.CountryRegion2;
	var ctlCountryRegion3 = document.WLAN.CountryRegion3;
	var ctlCountryRegion5 = document.WLAN.CountryRegion5;
	if(vCountryName == "CANADA")
		ctlCountryRegion.value = ctlCountryRegion0.value;
	else if (vCountryName == "COLOMBIA")
		ctlCountryRegion.value = ctlCountryRegion0.value;
	else if (vCountryName == "DOMINICAN REPUBLIC")
		ctlCountryRegion.value = ctlCountryRegion0.value;
	else if (vCountryName == "GUATEMALA")
		ctlCountryRegion.value = ctlCountryRegion0.value;
	else if (vCountryName == "MEXICO")
		ctlCountryRegion.value = ctlCountryRegion0.value;
	else if (vCountryName == "NORWAY")
		ctlCountryRegion.value = ctlCountryRegion0.value;
	else if (vCountryName == "PANAMA")
		ctlCountryRegion.value = ctlCountryRegion0.value;
	else if (vCountryName == "PUERTO RICO")
		ctlCountryRegion.value = ctlCountryRegion0.value;
	else if (vCountryName == "UNITED STATES")
		ctlCountryRegion.value = ctlCountryRegion0.value;
	else if (vCountryName == "TAIWAN")
		ctlCountryRegion.value = ctlCountryRegion0.value;
	else if (vCountryName == "UZBEKISTAN")			             
		ctlCountryRegion.value = ctlCountryRegion0.value;		
	else if (vCountryName == "JAPAN")			             
		ctlCountryRegion.value = ctlCountryRegion5.value;		
//	else if (vCountryName == "SPAIN")			             
//		ctlCountryRegion.value = ctlCountryRegion2.value;		
//	else if (vCountryName == "FRANCE")			             
//		ctlCountryRegion.value = ctlCountryRegion3.value;		
	else
		ctlCountryRegion.value = ctlCountryRegion1.value;

	RefreshPage();
	
	document.WLAN.CountryChange.value = 1; 
	//document.WLAN.submit();
}

function dowpscheck(){

	var wlan=document.WLAN;
if(wlan.SSID_INDEX.value==0){	
	if(wlan.UseWPS_Selection[0].checked == true){

	//check if WscV2Supported
	

	//do simple check if only WPS 1.0 supported, use original check code in 1.0
	
	//WEPSelectIndex 1=WEP64,2=WEP128,3=Radius-WEP64,4=Radius-WEP128
	//if(WEPSelectIndex == 1 || WEPSelectIndex == 2 || WEPSelectIndex == 6 || WEPSelectIndex == 7){
	if(WEPSelectIndex == 6 || WEPSelectIndex == 7){
		alert("We should not use WEP when WPS function turned on!");
		if(wpsenable){
			wlan.UseWPS_Selection[0].checked = true;
		}else{
			wlan.UseWPS_Selection[1].checked = true;
		}
		//wlan.WEP_Selection.selectedIndex = wepidx;
		return 0;
	}else{
		return 1;
	}
	
	

	}
	else{
		return 1;
	}
}else{
	return 1;
}
}


//function doBroadcastSSIDChange(){
function doBroadcastSSIDChange(){

	//check if WscV2Supported
	
	
	return 1;
	
}

function doEncryptionChange(object){

	//check if WscV2Supported
	
	return 1;
}


function doWEPChange(){
	doCheckWepSelectIndex();
	var wlan=document.WLAN;

	

	//do simple check if only WPS 1.0 supported, use original check code in 1.0
	
	//if((wlan.SSID_INDEX.value==0) && (wlan.UseWPS_Selection[0].checked == true) &&(WEPSelectIndex == 1 || WEPSelectIndex == 2 || WEPSelectIndex == 6 || WEPSelectIndex == 7))
	if((wlan.SSID_INDEX.value==0) && (wlan.UseWPS_Selection[0].checked == true) &&(WEPSelectIndex == 6 || WEPSelectIndex == 7))
	{
		alert("We should not use WEP when WPS function turned on!");
		wlan.WEP_Selection.selectedIndex = wepidx;
	}
	
	
	if(WEPSelectIndex == 0)
	{
		var rv = confirm("Your network will be set to OPEN without security setting, we strongly suggest you choose WPA-PSK or WPA2-PSK encryption!!");
		if (rv == false)
		{
			wlan.WEP_Selection.selectedIndex = wepidx;
		}
	}

		document.WLAN.wlanWEPFlag.value = 1;
			
		doLoad();
}

function doWEPChange2(){

	if(dowpscheck()){

		document.WLAN.wlanWEPFlag.value = 1;
		//if(document.WLAN.WEP_Selection.selectedIndex != 9){
		if(WEPSelectIndex != 9){
		
			document.WLAN.WEP_Selection.selectedIndex = 9;
		
			document.WLAN.submit();
		}

	}

}
function doWDSEncrypTypeChange(){
		document.WLAN.wlanWEPFlag.value = 4;
		//document.WLAN.submit();
}

function doSSIDChange(){
	//alert(document.WLAN.SSID_INDEX.value);
	document.WLAN.wlanWEPFlag.value = 2;
	document.WLAN.submit();
}

function doWirelessModeChange(){
	document.WLAN.wlanWEPFlag.value = 1;
	if(document.WLAN.WirelessMode.selectedIndex>=3){
		document.WLAN.Is11nMode.value=1;
	}else{
		document.WLAN.Is11nMode.value=0;
		
		document.WLAN.WLanTxBeamForming[3].selected = true;
//		document.getElementById("WLanTxBeamForming").style.display="none";
		
	}
	//document.WLAN.submit();
	doLoad();
}

function doChannelBandwidthChange(){
	document.WLAN.wlanWEPFlag.value = 1;
	//if(document.WLAN.WLANExtensionChannel.selectedIndex==0){
	//	document.WLAN.ExtChannFlag.value = 0;
	//}else{
	//	document.WLAN.ExtChannFlag.value = 1;
	//}
	//document.WLAN.submit();
	doLoad();
}

function doExtChannChange(){
	if(document.WLAN.WLANExtensionChannel.selectedIndex==0){
		document.WLAN.ExtChannFlag.value = 0;
	}else{
		document.WLAN.ExtChannFlag.value = 1;
	}
}

function doExtChaLockChange() {
	if(document.WLAN.WirelessMode.selectedIndex >= 3){
		
		if(document.WLAN.WLANChannelBandwidth.selectedIndex == 1){
		
			document.WLAN.wlanWEPFlag.value = 1;
			//document.WLAN.submit();
			doLoad();
		}
	}
}
function doAccControlChange(){
	//document.WLAN.submit();
	RefreshPage();
	doLoad(); 
}

function doWPSUseChange(){
	if(dowpscheck()){
		document.WLAN.wlanWEPFlag.value = 1;
		//document.WLAN.submit();
		RefreshPage();
	        doLoad(); 
	}
}

function doWPSModeChange(){
	document.WLAN.wlanWEPFlag.value = 1;
	document.WLAN.submit();
}

function wpapskCheck(object) {
	var keyvalue=object.value;
	var wpapsklen=object.value.length;
	
   	if(wpapsklen >= 8 && wpapsklen < 64) {
    	if(keyvalue.match(/[^\x00-\xff]/g))
   	    {
//			alert("wpapsk Key should be between 8 and 63 ASCII characters(except \',\') or 64 Hex string.");
			alert("Pre-Shared Key should be between 8 and 63 ASCII characters or 64 Hex string.");
			return true;
//   	    } else {
//   	        for ( i = 0; i < wpapsklen; i++)
//   	        if (keyvalue.charAt(i) == ','){
////			   alert("wpapsk Key should be between 8 and 63 ASCII characters(except \',\') or 64 Hex string.");
//			   alert("Pre-Shared Key should be between 8 and 63 ASCII characters or 64 Hex string.");
//			   return true;
//   	        }
   	    }
	}else if(wpapsklen==64){
		for(i=0;i<64;i++){
			var c=keyvalue.charAt(i);
			if(doHexCheck(c)<0){
//				alert('wpapsk Key Hex value error!');
				alert("Pre-Shared Key Hex value error!");
				return true;
			}
		}
	}else {
//    	alert('wpapsk Key length error!');
    	alert("Pre-Shared Key length error!");
		return true;
	}			
	return false;
}

function RadiusKeyCheck(object) {
	var keyvalue=object.value;
	var radiuskeylen=object.value.length;
	
   	if(radiuskeylen < 8) {
    	alert('Radius Key length error!');
		return true;
	}else if(radiuskeylen==64){
		for(i=0;i<64;i++){
			var c=keyvalue.charAt(i);
			if(doHexCheck(c)<0){
				alert('Radius Key Hex value error!');
				return true;
			}
		}
	}else if(radiuskeylen > 64) {
    	alert('Radius Key length error!');
		return true;
	}			
	return false;
}

function WDSKeyCheck(object) {
	var keyvalue=object.value;
	var wdskeylen=object.value.length;
	
   	if(wdskeylen < 8) {
    	alert('WDS Key length error!');
		return true;
	}else if(wdskeylen==64){
		for(i=0;i<64;i++){
			var c=keyvalue.charAt(i);
			if(doHexCheck(c)<0){
				alert('WDS Key Hex value error!');
				return true;
			}
		}
	}else if(wdskeylen > 64) {
    	alert('WDS Key length error!');
		return true;
	}			
	return false;
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

function doNonSympolCheck(c)
{
	if ((c >= "0")&&(c <= "9"))
	{
		return 1;
	}
	else if ((c >= "A")&&(c <= "Z"))
	{
		return 1;
	}
	else if ((c >= "a")&&(c <= "z"))
	{
		return 1;
	}

  return -1;
}

function doKEYcheck(object)
{
	var index = object.value.indexOf("0x");
	len=object.value.length;
	
	if(len == 0){
		return true;
	}

	//if(document.WLAN.WEP_Selection.selectedIndex==1)
	if(WEPSelectIndex==1)
	{
//	        if(len==5)/*wep 64*/
//	        {
//		        for(i=0;i<len;i++)
//		        {
//			var c = object.value.charAt(i);	
//			if(doNonSympolCheck(c)==-1)
//			{
//				alert("Invalid Key Value");
//					return false;
//			}
//		}
//	}
	if(len==5)/*wep 64*/
	{
		return true;
	}
	else if(len==10)/*wep 64*/
	{
		for(i=0;i<len;i++)
		{
			var c = object.value.charAt(i);	
			if(doHexCheck(c)==-1)
			{
				alert("Invalid Key Value");
					return false;
			}
		}
	}
	//	else if(len==12)/*wep 64*/
	//	{
	//		if(index==0)
	//	{
	//		    for ( i = 2; i < len; i++ )
	//		{
	//			var c = object.value.charAt(i);	
	//			if(doHexCheck(c)==-1)
	//			{
	//				alert("Invalid Key Value");
	//				return;
	//			}
	//		}
	//	}
	//		else
	//		{
	//			alert("Invalid Key Value");
	//			return;
	//		}
	//	}
		else
		{
			alert("Invalid Key Value");
			return false;
		}
	}
	//else if(document.WLAN.WEP_Selection.selectedIndex==2)
	else if(WEPSelectIndex==2)
	{
//		if(len==13)/*wep 128*/
//	{
//		for(i=0;i<len;i++)
//		{
//			var c = object.value.charAt(i);	
//			if(doNonSympolCheck(c)==-1)
//			{
//				alert("Invalid Key Value");
//					return false;
//			}
//		}
//	}
	if(len==13)/*wep 128*/
	{
		return true;
	}
	else if(len==26)/*wep 128*/
	{
		for(i=0;i<len;i++)
		{
			var c = object.value.charAt(i);	
			if(doHexCheck(c)==-1)
			{
				alert("Invalid Key Value");
					return false;
			}
		}
	}
		//else if(len==28)/*wep 128*/
		//{
		//	if(index==0)
		//	{
		//	    for ( i = 2; i < len; i++ )
		//		{
		//			var c = object.value.charAt(i);	
		//			if(doHexCheck(c)==-1)
		//			{
		//				alert("Invalid Key Value");
		//				return;
		//			}
		//		}
		//	}
		//	else
		//	{
		//		alert("Invalid Key Value");
		//		return;
		//	}
		//}
		else
		{
			alert("Invalid Key Value");
			return false;
		}
	}
	if(document.WLAN.isDot1XSupported.value==1)
	{
		//if(document.WLAN.WEP_Selection.selectedIndex==6)
		if(WEPSelectIndex==6)
		{
//	        if(len==5)/*wep 64*/
//	        {
//		        for(i=0;i<len;i++)
//		        {
//					var c = object.value.charAt(i);	
//					if(doNonSympolCheck(c)==-1)
//					{
//						alert("Invalid Key Value");
//						return false;
//					}
//				}
//			}
			if(len==5)/*wep 64*/
			{
				return true;
			}
			else if(len==10)/*wep 64*/
			{
				for(i=0;i<len;i++)
				{
					var c = object.value.charAt(i);	
					if(doHexCheck(c)==-1)
					{
						alert("Invalid Key Value");
						return false;
					}
				}
			}
			else
			{
				alert("Invalid Key Value");
				return false;
			}
		}
		//else if(document.WLAN.WEP_Selection.selectedIndex==7)
		else if(WEPSelectIndex==7)
		{
//			if(len==13)/*wep 128*/
//			{
//				for(i=0;i<len;i++)
//				{
//					var c = object.value.charAt(i);	
//					if(doNonSympolCheck(c)==-1)
//					{
//						alert("Invalid Key Value");
//						return false;
//					}
//				}
//			}
			if(len==13)/*wep 128*/
			{
				return true;
			}
			else if(len==26)/*wep 128*/
			{
				for(i=0;i<len;i++)
				{
					var c = object.value.charAt(i);	
					if(doHexCheck(c)==-1)
					{
						alert("Invalid Key Value");
						return false;
					}
				}
			}
			else
			{
				alert("Invalid Key Value");
				return false;
			}
		}
	}
	return true;
}

function doMACcheck(object)
{
  var szAddr = object.value;
  var len = szAddr.length;
  var errMsg = "Invalid MAC Address";

  if ( len == 0 )
  {
    //object.value ="00:00:00:00:00:00";
    return;
  }

  if ( len == 12 )
  {
    var newAddr = "";
    var i = 0;

    for ( i = 0; i < len; i++ )
    {
      var c = szAddr.charAt(i);
      
      if ( doHexCheck(c) < 0 )
      {
      alert("Invalid MAC Address");        object.focus();
        return -1;
      }
      if ( (i == 2) || (i == 4) || (i == 6) || (i == 8) || (i == 10) )
        newAddr = newAddr + ":";
      newAddr = newAddr + c;
    }
    object.value = newAddr;
    return;
  }
  else if ( len == 17 )
  {
    var i = 2;
    var c0 = szAddr.charAt(0);
    var c1 = szAddr.charAt(1);

    if ( (doHexCheck(c0) < 0) || (doHexCheck(c1) < 0) )
    {
       alert("Invalid MAC Address");       	object.focus();
      return -1;
    }
    
    i = 2;
    while ( i < len )
    {
      var c0 = szAddr.charAt(i);
      var c1 = szAddr.charAt(i+1);
      var c2 = szAddr.charAt(i+2);  
      if ( (c0 != ":") || (doHexCheck(c1) < 0) || (doHexCheck(c2) < 0) )
      {
         alert("Invalid MAC Address");         	object.focus();
        return -1;
      }
      i = i + 3;
    }
    return; 
  }
  else
  {
  alert("Invalid MAC Address");     	object.focus();
    return -1;
  }
}

function isNumeric(s)
{
  var len= s.length;
  var ch;
  if(len==0)
    return false;
  for( i=0; i< len; i++)
  {
    ch= s.charAt(i);
    if( ch > '9' || ch < '0')
    {
      return false;
    }
  }
  return true;
}

function checkBeacon(value) 
{
  if (!isNumeric(value)) {
    alert("Non-integer value given" + value);    return true;
  }
  if (value < 20 || value > 1000) {
    alert("Beacon value must be between 20 and 999");    return true;  	
  }
  return false;
}

function checkRTS(value) 
{
  if (!isNumeric(value)) {
    alert("Non-integer value given" + value);    return true;
  }
  if (value < 1500 || value > 2347) {
    alert("RTS Threshold value must be between 1500 and 2347");    return true;  	
  }
  return false;
}

function checkFrag(value) 
{
  if (!isNumeric(value)) {
    alert("Non-integer value given" + value);    return true;
  }
  if (value < 256 || value > 2346) {
    alert("Fragmentation Threshold value must be between 256 and 2346");    return true;  	
  }
  if (value % 2) {
    alert("Fragmentation Threshold value must be an even number");    return true;  	
  }
  return false;
}

function checkDTIM(value) 
{
  if (!isNumeric(value)) {
    alert("Non-integer value given" + value);    return true;
  }
  if (value < 1 || value > 255) {
    alert("DTIM value must be between 1 and 255");		return true;
	}	
	return false;
}

function checkStationNum(value, limit) 
{
	if (!isNumeric(value) || parseInt(value,10) < 0 || parseInt(value,10) > parseInt(limit,10)){
    	alert("Station Number value must be between 0 and " + limit);
		return true;
	}	
	return false;
}

function checkRekeyinteral(value, flag) 
{
	if (!isNumeric(value)) {
		if(flag == 1){
			alert("WPA Group Rekey Interval : Non-integer value given"); 
		}else{
			alert("Key Renewal Interval : Non-integer value given");
		}
		return true;
	}
	if (value < 10 || value > 4194303) {
		if(flag == 1){
			alert("WPA Group Rekey Interval must be between 10 and 4194303");
		}else{
			alert("Key Renewal Interval must be between 10 and 4194303");
		}	
		return true;
	}	
	return false;
}

function quotationCheck(object, limit_len) {
	var len = object.value.length;
	var c;
	var i, j = 0;
    for (i = 0; i < len; i++)
    {
	 	var c = object.value.charAt(i);
      
	  	if (c == '"')
		{
			j += 6;
		}
		else
			j++;
    }
   	if (j > limit_len-1)
	{
    alert('too many quotation marks!');		return true;
	}	
	return false;
}

function ValidateChecksum(PIN)
{
	var accum = 0;
	accum += 3 * (((PIN - PIN % 10000000) / 10000000) % 10);
	accum += 1 * (((PIN - PIN % 1000000) / 1000000) % 10);
	accum += 3 * (((PIN - PIN % 100000) / 100000) % 10);
	accum += 1 * (((PIN - PIN % 10000) / 10000) % 10);
	accum += 3 * (((PIN - PIN % 1000) / 1000) % 10);
	accum += 1 * (((PIN - PIN % 100) / 100) % 10);
	accum += 3 * (((PIN - PIN % 10) / 10) % 10);
	accum += 1 * (((PIN - PIN % 1) / 1) % 10);
	if ((accum % 10) == 0)
		return true;
	else
		return false;
}




function doPINCodeCheck(object)
{
	var len= object.value.length;
	var ch;



	if (len > 0)
	{
		if(len < 8)
		{
			alert("WPS PIN code must be 8 digits!");
			return;
		}
		for( i=0; i < len; i++)
		{
			ch= object.value.charAt(i);
			if( ch > '9' || ch < '0')
			{
				alert("WPS PIN code must be 8 digits!");
				return;
			}
		}
		if (ValidateChecksum(Number(object.value)) == false)
		{
			alert("WPS PIN code checksum error!");
		}
		return;
	}
	

}
	


	
function doSaveWepKEY()			//wepkey save to wds0key~wds3key
{
	var group;
	var curCBX;
	var vAuthMode = document.WLAN.WEP_Selection.value;

	if(vAuthMode == "Radius-WEP64")
		group = document.WLAN.DefWEPKey1;
	else if(vAuthMode == "Radius-WEP128")
		group = document.WLAN.DefWEPKey2;
	else if(vAuthMode == "WEP-64Bits")
		group = document.WLAN.DefWEPKey3;
	else if(vAuthMode == "WEP-128Bits")
		group = document.WLAN.DefWEPKey4;
		
	if(group != null)
	{
		for (var i=0; i<group.length; i++)
		{
			if (group[i].checked)
			break;
		}
	}
	
	if(vAuthMode == "Radius-WEP64")
	{
		switch (i)
		{
			case 0:
				curCBX = document.WLAN.WEP_Key11;
				break;
			case 1:
				curCBX = document.WLAN.WEP_Key21;
				break;
			case 2:
				curCBX = document.WLAN.WEP_Key31;
				break;
			case 3:
				curCBX = document.WLAN.WEP_Key41;
				break;
			default:
			  ;
		}
		document.WLAN.WEP_Key.value = curCBX.value;
	}
	else if(vAuthMode == "Radius-WEP128")
	{
		switch (i)
		{
		case 0:
			curCBX = document.WLAN.WEP_Key12;
			break;
		case 1:
			curCBX = document.WLAN.WEP_Key22;
			break;
		case 2:
			curCBX = document.WLAN.WEP_Key32;
			break;
		case 3:
			curCBX = document.WLAN.WEP_Key42;
			break;
		default:
		  ;
		}
		document.WLAN.WEP_Key.value = curCBX.value;
	}
	else if(vAuthMode == "WEP-64Bits")
	{
		switch (i)
		{
		case 0:
			curCBX = document.WLAN.WEP_Key13;
			break;
		case 1:
			curCBX = document.WLAN.WEP_Key23;
			break;
		case 2:
			curCBX = document.WLAN.WEP_Key33;
			break;
		case 3:
			curCBX = document.WLAN.WEP_Key43;
			break;
		default:
		  ;
		}
		document.WLAN.WEP_Key.value = curCBX.value;
	}
	else if(vAuthMode == "WEP-128Bits")
	{
		switch (i)
		{
		case 0:
			curCBX = document.WLAN.WEP_Key14;
			break;
		case 1:
			curCBX = document.WLAN.WEP_Key24;
			break;
		case 2:
			curCBX = document.WLAN.WEP_Key34;
			break;
		case 3:
			curCBX = document.WLAN.WEP_Key44;
			break;
		default:
		  ;
		}
		document.WLAN.WEP_Key.value = curCBX.value;
	}
}


function doSave(){
	
	if(document.WLAN.SSID_INDEX.value==0){
        if(document.WLAN.WPSMode_Selection[0].checked)
        {
	var pincode = document.WLAN.WPSEnrolleePINCode;
	if((doPINCodeCheck(pincode) == false))
	{
	       return false;
	}
        }
	}
	
	
	if(checkBeacon(document.WLAN.BeaconInterval.value) ||
		checkRTS(document.WLAN.RTSThreshold.value) ||
		checkFrag(document.WLAN.FragmentThreshold.value) ||
		checkDTIM(document.WLAN.DTIM.value)
	
		|| checkStationNum(document.WLAN.StationNum.value, document.WLAN.maxStaNum.value)
	
	){
		return false;
	}
		
	//if(document.WLAN.WEP_Selection.selectedIndex == 3){
	if(WEPSelectIndex == 1){ 
		document.WLAN.hRekeyMethod.value = "TIME";
		if (wpapskCheck(document.WLAN.PreSharedKey2)){
			return false;
		}
		
		if(quotationCheck(document.WLAN.PreSharedKey2, 385) ){
			return false;	 
		}
		if(checkRekeyinteral(document.WLAN.keyRenewalInterval2.value, 0)){
			return false;
		}  			
	}
	//if(document.WLAN.WEP_Selection.selectedIndex == 4){
	if(WEPSelectIndex == 2){
		document.WLAN.hRekeyMethod.value = "TIME";
		if (wpapskCheck(document.WLAN.PreSharedKey1)){
			return false;
		}
		
		if(quotationCheck(document.WLAN.PreSharedKey1, 385) ){
			return false;	 
		}
		if(checkRekeyinteral(document.WLAN.keyRenewalInterval1.value, 0)){
			return false;
		}  			
	}
	//if(document.WLAN.WEP_Selection.selectedIndex == 5){
	if(WEPSelectIndex == 3){
		document.WLAN.hRekeyMethod.value = "TIME";
		if (wpapskCheck(document.WLAN.PreSharedKey3)){
			return false;
		}
		
		if(quotationCheck(document.WLAN.PreSharedKey3, 385) ){
			return false;	 
		}
		if(checkRekeyinteral(document.WLAN.keyRenewalInterval3.value, 0)){
			return false;
		}  			
	}
      	
	//if(document.WLAN.WEP_Selection.selectedIndex == 5){
	//	document.WLAN.hRekeyMethod.value = "TIME";		
	//}
	//if(document.WLAN.WEP_Selection.selectedIndex == 1){
	if(WEPSelectIndex == 1){ 
		document.WLAN.hRekeyMethod.value = "DISABLE";
		if((!doKEYcheck(document.WLAN.WEP_Key13))||
		(!doKEYcheck(document.WLAN.WEP_Key23))||
		(!doKEYcheck(document.WLAN.WEP_Key33))||
		(!doKEYcheck(document.WLAN.WEP_Key43))){
			//alert("key check fail");
			return false;
		}
	}
	
	//if(document.WLAN.WEP_Selection.selectedIndex == 2){
	if(WEPSelectIndex == 2){ 
		document.WLAN.hRekeyMethod.value = "DISABLE";
		if((!doKEYcheck(document.WLAN.WEP_Key14))||
		(!doKEYcheck(document.WLAN.WEP_Key24))||
		(!doKEYcheck(document.WLAN.WEP_Key34))||
		(!doKEYcheck(document.WLAN.WEP_Key44))){
			//alert("key check fail");
			return false;
		}
	}
	
	if(document.WLAN.isDot1XSupported.value==1)
	{	
		//if(document.WLAN.WEP_Selection.selectedIndex == 6)
		if(WEPSelectIndex == 6) 
		{
			if((!doKEYcheck(document.WLAN.WEP_Key11))||
			(!doKEYcheck(document.WLAN.WEP_Key21))||
			(!doKEYcheck(document.WLAN.WEP_Key31))||
			(!doKEYcheck(document.WLAN.WEP_Key41)))
			{
				//alert("key check fail");
				return false;
			}
		}
		//if(document.WLAN.WEP_Selection.selectedIndex == 7)
		if(WEPSelectIndex == 7) 
		{
			if((!doKEYcheck(document.WLAN.WEP_Key12))||
			(!doKEYcheck(document.WLAN.WEP_Key22))||
			(!doKEYcheck(document.WLAN.WEP_Key32))||
			(!doKEYcheck(document.WLAN.WEP_Key42)))
			{
				//alert("key check fail");
				return false;
			}
		}
		
		var vAuthMode = document.WLAN.WEP_Selection.selectedIndex;
		
		//var vAuthMode = document.WLAN.WEP_Selection.selectedIndex;
		//if((document.WLAN.WEP_Selection.selectedIndex == 6) ||(document.WLAN.WEP_Selection.selectedIndex == 7) 
		//|| (document.WLAN.WEP_Selection.selectedIndex == 8) || (document.WLAN.WEP_Selection.selectedIndex == 9)
		//|| (document.WLAN.WEP_Selection.selectedIndex == 10))
		if((WEPSelectIndex == 6) || (WEPSelectIndex == 7) || (WEPSelectIndex == 8) || (WEPSelectIndex == 9)
		|| (WEPSelectIndex == 10))
		{
			if(document.WLAN.isDot1XEnhanceSupported.value == 0)
			{
				if(vAuthMode == 6){
					radiusip = document.WLAN.radiusSVR_IP1.value;
				}
				else if(vAuthMode == 7){
					radiusip = document.WLAN.radiusSVR_IP2.value;
				}
				else if(vAuthMode == 8){
					radiusip = document.WLAN.radiusSVR_IP3.value;
				}
				else if(vAuthMode == 9){
					radiusip = document.WLAN.radiusSVR_IP4.value;
				}
				else if(vAuthMode == 10){
					radiusip = document.WLAN.radiusSVR_IP5.value;
				}								
				
				 if(inValidIPAddr(radiusip))
				 {
					return false;
				 }
			}
			 //serverport
			//radiusport = parseInt(document.WLAN.radiusSVR_Port.value);
			if(vAuthMode == 6){
				radiusport = parseInt(document.WLAN.radiusSVR_Port1.value);
				radiuskey = document.WLAN.radiusSVR_Key1.value;
				if(RadiusKeyCheck(document.WLAN.radiusSVR_Key1))
						return false; 
				session_timeout_interval = document.WLAN.radiusSVR_ReAuthInter1.value;
			}
			else if(vAuthMode == 7){
				radiusport = parseInt(document.WLAN.radiusSVR_Port2.value);
				radiuskey = document.WLAN.radiusSVR_Key2.value;
				if(RadiusKeyCheck(document.WLAN.radiusSVR_Key2))
						return false; 
				session_timeout_interval = document.WLAN.radiusSVR_ReAuthInter2.value;
			}
			else if(vAuthMode == 8){
				radiusport = parseInt(document.WLAN.radiusSVR_Port3.value);
				radiuskey = document.WLAN.radiusSVR_Key3.value;
				if(RadiusKeyCheck(document.WLAN.radiusSVR_Key3))
						return false; 
				session_timeout_interval = document.WLAN.radiusSVR_ReAuthInter3.value;
			}
			else if(vAuthMode == 9){
				radiusport = parseInt(document.WLAN.radiusSVR_Port4.value);
				radiuskey = document.WLAN.radiusSVR_Key4.value;
				if(RadiusKeyCheck(document.WLAN.radiusSVR_Key4))
						return false; 
				session_timeout_interval = document.WLAN.radiusSVR_ReAuthInter4.value;
			}
			else if(vAuthMode == 10){
				radiusport = parseInt(document.WLAN.radiusSVR_Port5.value);
				radiuskey = document.WLAN.radiusSVR_Key5.value;
				if(RadiusKeyCheck(document.WLAN.radiusSVR_Key5))
						return false; 
				session_timeout_interval = document.WLAN.radiusSVR_ReAuthInter5.value;
			}
			if(isNaN(radiusport) || radiusport < 0 || radiusport > 65535)
			{	
				alert("Radius Server Port number's range: 0 ~ 65535");
				return false;
			}
			
			// radius share key
			//radiuskey = document.WLAN.radiusSVR_Key.value;
			{
				if (radiuskey.length == 0)
				{
  					alert("Radius Share secret can not be empty"); 
  					return false; 
				}
			}
			//session_timeout_interval = document.WLAN.radiusSVR_ReAuthInter.value;
			{
				if (session_timeout_interval.length == 0)
				{
  					alert("Re-auth Interval can not be empty"); 
  					return false; 
				}
			}
   		 }
		//if((document.WLAN.WEP_Selection.selectedIndex == 8) //WPA
		//	|| (document.WLAN.WEP_Selection.selectedIndex == 9) //WPA2
		//	|| (document.WLAN.WEP_Selection.selectedIndex == 10)) //WPAWPA2
		if((WEPSelectIndex == 8) || (WEPSelectIndex == 9) || (WEPSelectIndex == 10))
		{
			if(vAuthMode == 8){
				WPARekeyInter = document.WLAN.WPARekeyInter3.value;
			}
			else if(vAuthMode == 9){
				WPARekeyInter = document.WLAN.WPARekeyInter4.value;
			}
			else if(vAuthMode == 10){
				WPARekeyInter = document.WLAN.WPARekeyInter5.value;
			}
			
			if(checkRekeyinteral(WPARekeyInter, 1)){
				return false;	
			}
   		 }
	}
	
	//if wds support meantime AuthMode of MAIN SSID is wpa2psk,wpapsk WPAPSKWPA2PSK , then check wds key 
	if(document.WLAN.isWDSSupported.value==1)
	{
		if(document.WLAN.WLAN_WDS_Active[0].checked == true)//if wds enable ,to check wds_key, or not to check
		{
			if(document.WLAN.isDot1XSupported.value==1)
			{
//				if((document.WLAN.WEP_Selection.selectedIndex == 3) ||
//				(document.WLAN.WEP_Selection.selectedIndex == 4) || (document.WLAN.WEP_Selection.selectedIndex == 5)
//				|| (document.WLAN.WEP_Selection.selectedIndex == 8) || (document.WLAN.WEP_Selection.selectedIndex == 9)
//				|| (document.WLAN.WEP_Selection.selectedIndex == 10))
				if((WEPSelectIndex == 3) || (WEPSelectIndex == 4) || (WEPSelectIndex == 5)
				|| (WEPSelectIndex == 8) || (WEPSelectIndex == 9) || (WEPSelectIndex == 10))
				{
					if (WDSKeyCheck(document.WLAN.WDS_Key))
					{
						return false;
					}
			
					if(quotationCheck(document.WLAN.WDS_Key, 385) )
					{
						return false;	 
					}  			
				}	
			}
			else
			{
//				if((document.WLAN.WEP_Selection.selectedIndex == 3) ||
//				(document.WLAN.WEP_Selection.selectedIndex == 4) || (document.WLAN.WEP_Selection.selectedIndex == 5))
				if((WEPSelectIndex == 3) || (WEPSelectIndex == 4) || (WEPSelectIndex == 5))
				{
					if (WDSKeyCheck(document.WLAN.WDS_Key))
					{
						return false;
					}
					if(quotationCheck(document.WLAN.WDS_Key, 385) )
					{
						return false;	 
					}  			
				}	
			}
		}
	}
	if(quotationCheck(document.WLAN.ESSID, 193)||strESSIDCheck(document.WLAN.ESSID)){
		return;	   
	}

/*
	if(!checkSelectedKEY()){
		return false;
	}
*/
	if(doMACcheck(document.WLAN.WLANFLT_MAC1) == -1)
	{
		return false;
	}
	if(doMACcheck(document.WLAN.WLANFLT_MAC2) == -1)
	{
		return false;
	}
	if(doMACcheck(document.WLAN.WLANFLT_MAC3) == -1)
	{
		return false;
	}
	if(doMACcheck(document.WLAN.WLANFLT_MAC4) == -1)
	{
		return false;
	}
	if(doMACcheck(document.WLAN.WLANFLT_MAC5) == -1)
	{
		return false;
	}
	if(doMACcheck(document.WLAN.WLANFLT_MAC6) == -1)
	{
		return false;
	}
	if(doMACcheck(document.WLAN.WLANFLT_MAC7) == -1)
	{
		return false;
	}
	if(doMACcheck(document.WLAN.WLANFLT_MAC8) == -1)
	{
		return false;
	}

	document.WLAN.wlanWEPFlag.value = 3;
	if(document.WLAN.WirelessMode.selectedIndex>=3){
		document.WLAN.Is11nMode.value=1;
			
	}else{
		document.WLAN.Is11nMode.value=0;
	}
		
	doSaveWepKEY();
		
		
	document.WLAN.submit();
}

function checkSelectedKEY(){
	var group;
	var curCBX;
	var vAuthMode = document.WLAN.WEP_Selection.value;
	if(vAuthMode == "Radius-WEP64"){
		group = document.WLAN.DefWEPKey1;
	}
	else if(vAuthMode == "Radius-WEP128"){
		group = document.WLAN.DefWEPKey2;
	}
	else if(vAuthMode == "WEP-64Bits"){
		group = document.WLAN.DefWEPKey3;
	}
	else if(vAuthMode == "WEP-128Bits"){
		group = document.WLAN.DefWEPKey4;
	}

	for (var i=0; i<group.length; i++){
		if (group[i].checked)
		break;
	}
	
	if(vAuthMode == "Radius-WEP64"){
		switch (i)
		{
		case 0:
			curCBX = document.WLAN.WEP_Key11;
			break;
		case 1:
			curCBX = document.WLAN.WEP_Key21;
			break;
		case 2:
			curCBX = document.WLAN.WEP_Key31;
			break;
		case 3:
			curCBX = document.WLAN.WEP_Key41;
			break;
		default:
		  ;
		}
	}
	else if(vAuthMode == "Radius-WEP128"){
		switch (i)
		{
		case 0:
			curCBX = document.WLAN.WEP_Key12;
			break;
		case 1:
			curCBX = document.WLAN.WEP_Key22;
			break;
		case 2:
			curCBX = document.WLAN.WEP_Key32;
			break;
		case 3:
			curCBX = document.WLAN.WEP_Key42;
			break;
		default:
		  ;
		}
	}
	else if(vAuthMode == "WEP-64Bits"){
		switch (i)
		{
		case 0:
			curCBX = document.WLAN.WEP_Key13;
			break;
		case 1:
			curCBX = document.WLAN.WEP_Key23;
			break;
		case 2:
			curCBX = document.WLAN.WEP_Key33;
			break;
		case 3:
			curCBX = document.WLAN.WEP_Key43;
			break;
		default:
		  ;
		}
	}
	else if(vAuthMode == "WEP-128Bits"){
		switch (i)
		{
		case 0:
			curCBX = document.WLAN.WEP_Key14;
			break;
		case 1:
			curCBX = document.WLAN.WEP_Key24;
			break;
		case 2:
			curCBX = document.WLAN.WEP_Key34;
			break;
		case 3:
			curCBX = document.WLAN.WEP_Key44;
			break;
		default:
		  ;
		}
	}
	
	len=curCBX.value.length;
	index = curCBX.value.indexOf("0x");
	
//	if(document.WLAN.WEP_Selection.selectedIndex==1)/*wep 64*/
	if(WEPSelectIndex==1)/*wep 64*/
	{
		if(len==5)
		{
			for(i=0;i<len;i++)
			{
				var c = curCBX.value.charAt(i);	
				if(doNonSympolCheck(c)==-1)
				{
					alert("Invalid Key Value");
					curCBX.focus();
					return false;
				}
			}
		}
		else if(len==10)
		{
			for(i=0;i<len;i++)
			{
				var c = curCBX.value.charAt(i);	
				if(doHexCheck(c)==-1)
				{
					alert("Invalid Key Value");
					curCBX.focus();
					return false;
				}
			}
		}
		else if(len==12)
		{
			if(index==0)
			{
				for(i=2;i<len;i++)
				{
					var c = curCBX.value.charAt(i);	
					if(doHexCheck(c)==-1)
					{
						alert("Invalid Key Value");
						curCBX.focus();
						return false;
					}
				}
			}
			else
			{
				alert("Invalid Key Value");
				curCBX.focus();
				return false;
			}
		}
		else
		{
			alert("Invalid Key Value");
			curCBX.focus();
			return false;
		}
	}
//	else if(document.WLAN.WEP_Selection.selectedIndex==2)/*wep 128*/
	else if(WEPSelectIndex==2)/*wep 128*/
	{
		if(len==13)
		{
			for(i=0;i<len;i++)
			{
				var c = curCBX.value.charAt(i);	
				if(doNonSympolCheck(c)==-1)
				{
					alert("Invalid Key Value");
					curCBX.focus();
					return false;
				}
			}
		}
		else if(len==26)
		{
			for(i=0;i<len;i++)
			{
				var c = curCBX.value.charAt(i);	
				if(doHexCheck(c)==-1)
				{
					alert("Invalid Key Value");
					curCBX.focus();
					return false;
				}
			}
		}
		else if(len==28)
		{
			if(index==0)
			{
				for(i=2;i<len;i++)
				{
					var c = curCBX.value.charAt(i);	
					if(doHexCheck(c)==-1)
					{
						alert("Invalid Key Value");
						curCBX.focus();
						return false;
					}
				}
			}
			else
			{
				alert("Invalid Key Value");
				curCBX.focus();
				return false;
			}
		}
		else
		{
			alert("Invalid Key Value");
			curCBX.focus();
			return false;
		}
	}
}

function checkFocus(value){
	//if(document.form.WEP_Selection.selectedIndex == 0){
	if(WEPSelectIndex == 0){
		document.form.WEP_Selection.focus();
	}
}

function autoWLAN_WDS_Active()
{
	if(document.WLAN.WDS_EncrypType_Selection != null){
		document.WLAN.WDS_EncrypType_Selection.disabled = false;
		document.WLAN.WDS_Key.disabled = false;
	}
	document.WLAN.WLANWDS_PEER_MAC1.disabled = false;
	document.WLAN.WLANWDS_PEER_MAC2.disabled = false;
	document.WLAN.WLANWDS_PEER_MAC3.disabled = false;
	document.WLAN.WLANWDS_PEER_MAC4.disabled = false;
}	

function autoWLAN_WDS_Deactive()
{
	if(document.WLAN.WDS_EncrypType_Selection != null){
		document.WLAN.WDS_EncrypType_Selection.disabled = true;
		document.WLAN.WDS_Key.disabled = true;
	}
	document.WLAN.WLANWDS_PEER_MAC1.disabled = true;
	document.WLAN.WLANWDS_PEER_MAC2.disabled = true;
	document.WLAN.WLANWDS_PEER_MAC3.disabled = true;
	document.WLAN.WLANWDS_PEER_MAC4.disabled = true;
}

function doLoad(){
	doCheckSSID();
	RefreshPage();
	doCheckWepSelectIndex();	
	
	
	
	if(document.WLAN.isDot1XSupported.value==1)
	{
		if(document.WLAN.isAuthenTypeSupported.value==1)
		{
			document.getElementById("WEP_Selection_div").style.display="none";
			document.getElementById("WEP_Selection_show_div").style.display="";
			doWEPChange2();
		}
		else
		{
			document.getElementById("WEP_Selection_div").style.display="";
			document.getElementById("WEP_Selection_show_div").style.display="none";
		}
	}	
	if(document.WLAN.WirelessMode.selectedIndex>=3){
		document.WLAN.Is11nMode.value=1;
		
		if(document.WLAN.WLANChannelBandwidth.selectedIndex == 1){
		
			if(document.WLAN.Channel_ID.selectedIndex <= 4){
				document.WLAN.WLANExtensionChannel.selectedIndex = 1;
				document.WLAN.WLANExtensionChannel.disabled = true;
				document.WLAN.ExtChannFlag.value = 1;
			}
			else if(document.WLAN.Channel_ID.selectedIndex >= 8){
				document.WLAN.WLANExtensionChannel.selectedIndex = 0;
				document.WLAN.WLANExtensionChannel.disabled = true;
				document.WLAN.ExtChannFlag.value = 0;
			}
			else{
				document.WLAN.WLANExtensionChannel.disabled = false;
				if(document.WLAN.WLANExtensionChannel.selectedIndex==0){
					document.WLAN.ExtChannFlag.value = 0;
				}else{
					document.WLAN.ExtChannFlag.value = 1;
				}
			}
				
		}
	}else{
		document.WLAN.Is11nMode.value=0;
	}

	if(document.WLAN.isInWPSing.value==1){
		document.WLAN.ResetOOB.disabled = true;
		document.WLAN.BUTTON.disabled = true;
		document.WLAN.CancelBtn.disabled = true;
	}
	if(document.WLAN.wlan_VC.value==0){
		wpsenable = document.WLAN.UseWPS_Selection[0].checked;
	}

//	wepidx = document.WLAN.WEP_Selection.selectedIndex;
	wepidx = WEPSelectIndex;

	if(document.WLAN.isWDSSupported.value==1)
	{
		if(document.WLAN.WLAN_WDS_Active[0].checked == true){//if wds enable
			autoWLAN_WDS_Active();
		}else if(document.WLAN.WLAN_WDS_Active[1].checked == true){//if wds disable
			autoWLAN_WDS_Deactive();
		}
	}
	if(document.WLAN.bharti_ssid2.value==1)
		doloadSSID2();		
}

function doCheckSSID()
{
	var ssid_val = document.WLAN.wlan_VC.value;
	var ssid_optval = document.WLAN.SSID_INDEX.value;
	if(ssid_val != ssid_optval)
	{
		document.WLAN.wlanWEPFlag.value = 2;
		document.WLAN.submit();
	}
}

function doloadSSID2()
{
	if(document.WLAN.SSID_INDEX.selectedIndex == 1)
	{
		var j;
		var frm = document.WLAN;
		for(j = 0; j < frm.elements.length; j++)
		{	
			if(frm.elements[j].type != "hidden")		
				frm.elements[j].disabled = true;
		}
	}
	document.WLAN.SSID_INDEX.disabled = false;
}

var bInit = 1;

function RefreshPage(){
	var autoText = "Auto";
	var index = 0;
	var ctlChannel_ID = document.WLAN.Channel_ID;
	var vChannel = ctlChannel_ID.value;
	var vCountryRegion = document.WLAN.hCountryRegion.value;
	if(bInit == 1){
		vChannel = "0";
		bInit = 0;
	}
	ctlChannel_ID.length = 0;
	if(vCountryRegion == 0){
		ctlChannel_ID.options[index++] = new Option(autoText, "0");
		ctlChannel_ID.options[index++] = new Option("01", "1");
		ctlChannel_ID.options[index++] = new Option("02", "2");
		ctlChannel_ID.options[index++] = new Option("03", "3");
		ctlChannel_ID.options[index++] = new Option("04", "4");
		ctlChannel_ID.options[index++] = new Option("05", "5");
		ctlChannel_ID.options[index++] = new Option("06", "6");
		ctlChannel_ID.options[index++] = new Option("07", "7");
		ctlChannel_ID.options[index++] = new Option("08", "8");
		ctlChannel_ID.options[index++] = new Option("09", "9");
		ctlChannel_ID.options[index++] = new Option("10", "10");
		ctlChannel_ID.options[index++] = new Option("11", "11");
	}else if(vCountryRegion == 2){
		ctlChannel_ID.options[index++] = new Option(autoText, "0");
		ctlChannel_ID.options[index++] = new Option("10", "10");
		ctlChannel_ID.options[index++] = new Option("11", "11");
	}else if(vCountryRegion == 3){
		ctlChannel_ID.options[index++] = new Option(autoText, "0");
		ctlChannel_ID.options[index++] = new Option("10", "10");
		ctlChannel_ID.options[index++] = new Option("11", "11");
		ctlChannel_ID.options[index++] = new Option("12", "12");
		ctlChannel_ID.options[index++] = new Option("13", "13");
	}else if(vCountryRegion == 4){
		ctlChannel_ID.options[index++] = new Option(autoText, "0");
		ctlChannel_ID.options[index++] = new Option("04", "4");
	}else if(vCountryRegion == 5){
		ctlChannel_ID.options[index++] = new Option(autoText, "0");
		ctlChannel_ID.options[index++] = new Option("01", "1");
		ctlChannel_ID.options[index++] = new Option("02", "2");
		ctlChannel_ID.options[index++] = new Option("03", "3");
		ctlChannel_ID.options[index++] = new Option("04", "4");
		ctlChannel_ID.options[index++] = new Option("05", "5");
		ctlChannel_ID.options[index++] = new Option("06", "6");
		ctlChannel_ID.options[index++] = new Option("07", "7");
		ctlChannel_ID.options[index++] = new Option("08", "8");
		ctlChannel_ID.options[index++] = new Option("09", "9");
		ctlChannel_ID.options[index++] = new Option("10", "10");
		ctlChannel_ID.options[index++] = new Option("11", "11");
		ctlChannel_ID.options[index++] = new Option("12", "12");
		ctlChannel_ID.options[index++] = new Option("13", "13");
		ctlChannel_ID.options[index++] = new Option("14", "14");
	}else if(vCountryRegion == 6){
		ctlChannel_ID.options[index++] = new Option(autoText, "0");
		ctlChannel_ID.options[index++] = new Option("03", "3");
		ctlChannel_ID.options[index++] = new Option("04", "4");
		ctlChannel_ID.options[index++] = new Option("05", "5");
		ctlChannel_ID.options[index++] = new Option("06", "6");
		ctlChannel_ID.options[index++] = new Option("07", "7");
		ctlChannel_ID.options[index++] = new Option("08", "8");
		ctlChannel_ID.options[index++] = new Option("09", "9");
	}else{
		ctlChannel_ID.options[index++] = new Option(autoText, "0");
		ctlChannel_ID.options[index++] = new Option("01", "1");
		ctlChannel_ID.options[index++] = new Option("02", "2");
		ctlChannel_ID.options[index++] = new Option("03", "3");
		ctlChannel_ID.options[index++] = new Option("04", "4");
		ctlChannel_ID.options[index++] = new Option("05", "5");
		ctlChannel_ID.options[index++] = new Option("06", "6");
		ctlChannel_ID.options[index++] = new Option("07", "7");
		ctlChannel_ID.options[index++] = new Option("08", "8");
		ctlChannel_ID.options[index++] = new Option("09", "9");
		ctlChannel_ID.options[index++] = new Option("10", "10");
		ctlChannel_ID.options[index++] = new Option("11", "11");
		ctlChannel_ID.options[index++] = new Option("12", "12");
		ctlChannel_ID.options[index++] = new Option("13", "13");
	}
	ctlChannel_ID.options[0].selected=true;
	SelectValue(ctlChannel_ID, vChannel);
	
	if(document.WLAN.Is11nMode.value == "1"){
		document.getElementById("11nMode_0_div").style.display="none";
		document.getElementById("11nMode_1_div").style.display="";
	}else{
		document.getElementById("11nMode_0_div").style.display="";
		document.getElementById("11nMode_1_div").style.display="none";
	}
	
	if(document.WLAN.WLANChannelBandwidth.value == "1")
	
		document.getElementById("HT_BW_1_div").style.display="";
	else
		document.getElementById("HT_BW_1_div").style.display="none";		
		
	if(document.WLAN.wlan_VC.value==0){
		document.getElementById("WPSSettingText_table").style.display="";
		if(document.WLAN.UseWPS_Selection[0].checked == true)
			document.getElementById("WPSConfMode_1_div").style.display="";
		else
			document.getElementById("WPSConfMode_1_div").style.display="none";
	}
	else
		document.getElementById("WPSSettingText_table").style.display="none";

	
	
	if(document.WLAN.WLAN_FltActive[0].checked == true)
		document.getElementById("accessControl_div").style.display="";
	else
		document.getElementById("accessControl_div").style.display="none";
		
	var vAuthMode = document.WLAN.WEP_Selection.value;
	if(document.getElementById("Radius-WEP64_div") != null) 
		document.getElementById("Radius-WEP64_div").style.display="none";
	if(document.getElementById("Radius-WEP128_div") != null)
		document.getElementById("Radius-WEP128_div").style.display="none";
	if(document.getElementById("WPA_div") != null)
		document.getElementById("WPA_div").style.display="none";
	if(document.getElementById("WPA2_div") != null)
		document.getElementById("WPA2_div").style.display="none";
	if(document.getElementById("WPA1WPA2_div") != null)
		document.getElementById("WPA1WPA2_div").style.display="none";
		
	if(vAuthMode == "Radius-WEP64"){
		if(document.getElementById("Radius-WEP64_div") != null) 
			document.getElementById("Radius-WEP64_div").style.display="";
	}
	if(vAuthMode == "Radius-WEP128"){
		if(document.getElementById("Radius-WEP128_div") != null)
			document.getElementById("Radius-WEP128_div").style.display="";
	}
	if(vAuthMode == "WPA"){
		if(document.getElementById("WPA_div") != null)
			document.getElementById("WPA_div").style.display="";
	}
	if(vAuthMode == "WPA2"){
		if(document.getElementById("WPA2_div") != null)
			document.getElementById("WPA2_div").style.display="";
	}
	if(vAuthMode == "WPA1WPA2"){
		if(document.getElementById("WPA1WPA2_div") != null)
			document.getElementById("WPA1WPA2_div").style.display="";
	}
		
	if(document.getElementById("WEP-64Bits_div") != null)
		document.getElementById("WEP-64Bits_div").style.display="none";
	if(document.getElementById("WEP-128Bits_div") != null)
		document.getElementById("WEP-128Bits_div").style.display="none";
	if(document.getElementById("WPA2PSK_div") != null)
		document.getElementById("WPA2PSK_div").style.display="none";
	if(document.getElementById("WPAPSK_div") != null)
		document.getElementById("WPAPSK_div").style.display="none";
	if(document.getElementById("WPAPSKWPA2PSK_div") != null)
		document.getElementById("WPAPSKWPA2PSK_div").style.display="none";	
	if(vAuthMode == "WEP-64Bits"){
		if(document.getElementById("WEP-64Bits_div") != null)
			document.getElementById("WEP-64Bits_div").style.display="";
	}else if(vAuthMode == "WEP-128Bits"){
		if(document.getElementById("WEP-128Bits_div") != null)
			document.getElementById("WEP-128Bits_div").style.display="";
	}else if(vAuthMode == "WPA2PSK"){
		if(document.getElementById("WPA2PSK_div") != null)
			document.getElementById("WPA2PSK_div").style.display="";
	}else if(vAuthMode == "WPAPSK"){
		if(document.getElementById("WPAPSK_div") != null)
			document.getElementById("WPAPSK_div").style.display="";
	}else if(vAuthMode == "WPAPSKWPA2PSK"){
		if(document.getElementById("WPAPSKWPA2PSK_div") != null)
			document.getElementById("WPAPSKWPA2PSK_div").style.display="";	
	}
	
	if(document.getElementById("else_div") != null)
		document.getElementById("else_div").style.display="none";
	if(vAuthMode == "OPEN")
		;
	else if(vAuthMode == "WEP-64Bits")
		;
	else if(vAuthMode == "WEP-128Bits")
		;
	else if(vAuthMode == "Radius-WEP64")
		;
	else if(vAuthMode == "Radius-WEP128")
		;
	else if(document.getElementById("else_div") != null)
		document.getElementById("else_div").style.display="";
}

function SelectValue(o,v){
	for(var i=0; i<o.options.length; i++)
		if(o.options[i].value == v){
		o.options[i].selected=true;
		break;
	}
}



</script>
</head>
<body onLoad="doLoad()" style="background:#4acbd6;">
<FORM METHOD="POST" ACTION="/cgi-bin/home_wireless.asp" name="WLAN">
<div id="pagestyle">
<div id="contenttype">
<INPUT TYPE="HIDDEN" NAME="isWPSSupported" value="1">
<INPUT TYPE="HIDDEN" NAME="WscV2Support" value="0">
<INPUT TYPE="HIDDEN" NAME="BasicRate_Value1" VALUE="15">
<INPUT TYPE="HIDDEN" NAME="BasicRate_Value2" VALUE="3">
<INPUT TYPE="HIDDEN" NAME="BasicRate_Value3" VALUE="351">
<INPUT TYPE="HIDDEN" NAME="CountryRegion0" value="0">
<INPUT TYPE="HIDDEN" NAME="CountryRegion1" value="1">
<INPUT TYPE="HIDDEN" NAME="CountryRegion2" value="2">
<INPUT TYPE="HIDDEN" NAME="CountryRegion3" value="3">
<INPUT TYPE="HIDDEN" NAME="CountryRegion5" value="5">
<INPUT TYPE="HIDDEN" NAME="CountryRegion6" value="6">
<INPUT TYPE="HIDDEN" NAME="HTMCSAUTO" value="33">
<INPUT TYPE="HIDDEN" NAME="HTBW" value="0">

<INPUT TYPE="HIDDEN" NAME="WPSConfigured" value="2">
<INPUT TYPE="HIDDEN" NAME="WpsConfModeAll" value="7">
<INPUT TYPE="HIDDEN" NAME="WpsConfModeNone" value="0">
<INPUT TYPE="HIDDEN" NAME="WpsStart" value="0">
<INPUT TYPE="HIDDEN" NAME="WpsOOB" value="0">
<INPUT TYPE="HIDDEN" NAME="isInWPSing" value="0">
<INPUT TYPE="HIDDEN" NAME="WpsGenerate" value="0">

<INPUT TYPE="HIDDEN" NAME="Is11nMode"  value="1">
<INPUT TYPE="HIDDEN" NAME="is11nSpecComply"  value="N/A">
<INPUT TYPE="HIDDEN" NAME="isWPA2PreAuthSupported"  value="N/A">

<INPUT TYPE="HIDDEN" NAME="ExtChannFlag"  value="1">
<INPUT type="HIDDEN" NAME="isAuthenTypeSupported" value="0">
<INPUT type="HIDDEN" NAME="isDot1XSupported" value="0">
<INPUT type="HIDDEN" NAME="isDot1XEnhanceSupported" value="0">
<INPUT TYPE="HIDDEN" NAME="wlan_VC" value="0">
<!--<INPUT TYPE="HIDDEN" NAME="WpsStart" value="N/A">
-->
<INPUT TYPE="HIDDEN" NAME="BssidNum" value="4">
<INPUT TYPE="HIDDEN" NAME="CountryName" value="VIETNAM">
<INPUT TYPE="HIDDEN" NAME="hCountryRegion" value="0">
<INPUT TYPE="HIDDEN" NAME="hRekeyMethod" value="DISABLE">
<INPUT type="HIDDEN" NAME="isWDSSupported" value="0">
<INPUT TYPE="HIDDEN" NAME="WDS_EncrypType_NONE" value="NONE">
<INPUT TYPE="HIDDEN" NAME="WDS_EncrypType_WEP" value="WEP">
<input type="HIDDEN" name="bharti_ssid2" value="0">
<INPUT TYPE="HIDDEN" NAME="isPerSSIDSupport" value="1">
<INPUT TYPE="HIDDEN" NAME="RTDEVICE" value="7615">

<INPUT TYPE="HIDDEN" NAME="WLanITxBfEn" value="N/A">
<INPUT TYPE="HIDDEN" NAME="WLanETxBfEnCond" value="N/A">
<INPUT TYPE="HIDDEN" NAME="WLanETxBfIncapable" value="N/A">
<INPUT TYPE="HIDDEN" NAME="WEP_Key" value="0">

	
<div class="main_item">
	<table width="640" border="0" cellpadding="0" cellspacing="0" bgcolor="#FFFFFF" style="table-layout: fixed;margin:5px 0;">
	    <tr height="25px" style="width:100%;background:#e6e6e6;">
	        <td align=left class="title-main" style="width:250px;padding-left:20px;">Set Wireless radio state</td>
	    </tr>
	</table>
<table width="640" border="0"  cellpadding="0" cellspacing="0" bgcolor="#FFFFFF" style="table-layout: fixed;">
	<tr height="30px">
		<td align=left class="tabdata" style="width:250px;padding-left:20px;">2.4G Radio</td>
		<td align=left class="tabdata">
			<INPUT TYPE="RADIO" NAME="wlan_APenable" VALUE="1" checked >Enable&nbsp;&nbsp;&nbsp;&nbsp;       
	  
			<INPUT TYPE="RADIO" NAME="wlan_APenable" VALUE="0"   >Disable
	
		</td>
	</tr>
</table>
<table width="640" border="0"  cellpadding="0" cellspacing="0" bgcolor="#FFFFFF" style="table-layout: fixed;">
	<tr height="30px">
		<td align=left class="tabdata" style="width:250px;padding-left:20px;">
		Channel</td>
		<td align=left class="tabdata">
			<SELECT NAME="Countries_Channels" SIZE="1" onChange="doRegionCheck()" style="display:none;">
				
<script language="JavaScript" type='text/javascript'>
	var countryarr = new Array(98);
	countryarr[0]="ALBANIA";
	countryarr[1]="ALGERIA";
	countryarr[2]="ARGENTINA";
	countryarr[3]="ARMENIA";
	countryarr[4]="AUSTRALIA";
	countryarr[5]="AUSTRIA";
	countryarr[6]="AZERBAIJAN";
	countryarr[7]="BAHRAIN";
	countryarr[8]="BELARUS";
	countryarr[9]="BELGIUM";
	countryarr[10]="BELIZE";
	countryarr[11]="BOLIVIA";
	countryarr[12]="BRAZIL";
	countryarr[13]="BRUNEI DARUSSALAM";
	countryarr[14]="BULGARIA";
	countryarr[15]="CANADA";
	countryarr[16]="CHILE";
	countryarr[17]="CHINA";
	countryarr[18]="COLOMBIA";
	countryarr[19]="COSTA RICA";
	countryarr[20]="CROATIA";
	countryarr[21]="CYPRUS";
	countryarr[22]="CZECH REPUBLIC";
	countryarr[23]="DENMARK";
	countryarr[24]="DOMINICAN REPUBLIC";
	countryarr[25]="ECUADOR";
	countryarr[26]="EGYPT";
	countryarr[27]="ELSALVADOR";
	countryarr[28]="FINLAND";
	countryarr[29]="FRANCE";
	countryarr[30]="GEORGIA";
	countryarr[31]="GERMANY";
	countryarr[32]="GREECE";
	countryarr[33]="GUATEMALA";
	countryarr[34]="HONDURAS";
	countryarr[35]="HONGKONG";
	countryarr[36]="HUNGARY";
	countryarr[37]="ICELAND";
	countryarr[38]="INDIA";
	countryarr[39]="INDONESIA";
	countryarr[40]="IRAN";
	countryarr[41]="IRELAND";
	countryarr[42]="ISRAEL";
	countryarr[43]="ITALY";
	countryarr[44]="JAPAN";
	countryarr[45]="KAZAKHSTAN";
	countryarr[46]="KOREA DEMOCRATIC";
	countryarr[47]="KOREA REPUBLIC";
	countryarr[48]="LATVIA";
	countryarr[49]="LEBANON";
	countryarr[50]="LIECHTENSTEIN";
	countryarr[51]="LITHUANIA";
	countryarr[52]="LUXEMBOURG";
	countryarr[53]="MACAU";
	countryarr[54]="MACEDONIA";
	countryarr[55]="MALAYSIA";
	countryarr[56]="MEXICO";
	countryarr[57]="MONACO";
	countryarr[58]="MOROCCO";
	countryarr[59]="NETHERLANDS";
	countryarr[60]="NEW ZEALAND";
	countryarr[61]="NORWAY";
	countryarr[62]="OMAN";
	countryarr[63]="PAKISTAN";
	countryarr[64]="PANAMA";
	countryarr[65]="PERU";
	countryarr[66]="PHILIPPINES";
	countryarr[67]="POLAND";
	countryarr[68]="PORTUGAL";
	countryarr[69]="PUERTO RICO";
	countryarr[70]="QATAR";
	countryarr[71]="ROMANIA";
	countryarr[72]="RUSSIA";
	countryarr[73]="SAUDI ARABIA";
	countryarr[74]="SINGAPORE";
	countryarr[75]="SLOVAKIA";
	countryarr[76]="SLOVENIA";
	countryarr[77]="SOUTH AFRICA";
	countryarr[78]="SPAIN";
	countryarr[79]="SWEDEN";
	countryarr[80]="SWITZERLAND";
	countryarr[81]="SYRIAN ARAB REPUBLIC";
	countryarr[82]="TAIWAN";
	countryarr[83]="THAILAND";
	countryarr[84]="TRINIDAD AND TOBAGO";
	countryarr[85]="TUNISIA";
	countryarr[86]="TURKEY";
	countryarr[87]="UKRAINE";
	countryarr[88]="UNITED ARAB EMIRATES";
	countryarr[89]="UNITED KINGDOM";
	countryarr[90]="UNITED STATES";
	countryarr[91]="URUGUAY";
	countryarr[92]="UZBEKISTAN";
	countryarr[93]="VENEZUELA";
	countryarr[94]="VIETNAM";
	countryarr[95]="YEMEN";
	countryarr[96]="ZIMBABWE";
	countryarr[97]="Undefined";
	
	for(i=0;i<98;i++)
	{
		if(document.WLAN.CountryName.value.match(countryarr[i]) != null)
		{
			document.WLAN.Countries_Channels[i]=new Option(countryarr[i],countryarr[i],false,true);
			document.WLAN.Countries_Channels[i].selected=true;
		}
		else
		{
			if(countryarr[i].match("TAIWAN") !=null){
				document.WLAN.Countries_Channels[i]=new Option(countryarr[i],countryarr[i],true,false);
				//document.WLAN.Countries_Channels[i].selected=true;
			}
		else{
			document.WLAN.Countries_Channels[i]=new Option(countryarr[i],countryarr[i],false,false);
			document.WLAN.Countries_Channels[i].selected=false;
		}
	}
}
</script>

			</SELECT>     
			<SELECT NAME="Channel_ID" SIZE="1" onChange="doExtChaLockChange()">
			</SELECT>
        Current Channel :
        
	        
	        	<INPUT TYPE="TEXT" NAME="CurrentChannel" SIZE="3" MAXLENGTH="2" VALUE="1" disabled>
        	
		
		</td>
	</tr>
	<tr height="30px">
		<td align=left class="tabdata" style="width:250px;padding-left:20px;">
			Beacon Interval</td>
		<td align=left class="tabdata">
			<INPUT TYPE="TEXT" NAME="BeaconInterval" SIZE="7" MAXLENGTH="4" VALUE="100"><font color="#000000">(range: 20~999)</font></td>
	</tr>
	<tr height="30px" style="display:none">
		<td align=left class="tabdata" style="width:250px;padding-left:20px;">
			RTS/CTS Threshold</td>
		<td align=left class="tabdata">
			<INPUT TYPE="TEXT" NAME="RTSThreshold" SIZE="7" MAXLENGTH="5" VALUE="2347"><font color="#000000">(range: 1500~2347)</font>
		</td>
	</tr>
	<tr height="30px" style="display:none">
		<td align=left class="tabdata" style="width:250px;padding-left:20px;">
			Fragmentation Threshold</td>
    	<td align=left class="tabdata">
			<INPUT TYPE="TEXT" NAME="FragmentThreshold" SIZE="7" MAXLENGTH="5" VALUE="2346"><font color="#000000">(range: 256~2346, even numbers only)</font>
		</td>
	</tr>
	<tr height="30px">
		<td align=left class="tabdata" style="width:250px;padding-left:20px;">
			DTIM</td>
		<td align=left class="tabdata">
			<INPUT TYPE="TEXT" NAME="DTIM" SIZE="7" MAXLENGTH="5" VALUE="1" ><font color="#000000">(range: 1~255)</font>
		</td>
	</tr>
	<tr height="30px">
		<td align=left class="tabdata" style="width:250px;padding-left:20px;">
			802.11 Mode</td>
		<td align=left class="tabdata">
			<SELECT NAME="WirelessMode" SIZE="1" onChange="doWirelessModeChange()">
				<OPTION value="1" >802.11b
				<OPTION value="4" >802.11g
				<OPTION value="0" >802.11b+g
				<OPTION value="6" >802.11n
				<OPTION value="7" >802.11g+n
				<OPTION value="9" selected >802.11b+g+n
			</SELECT>
		</td>
	</tr>
	<tr height="30px">
		<td align=left class="tabdata" style="width:250px;padding-left:20px;">
		<font color="#000000">Wireless Power Level</font></td>
		<td align=left class="tabdata">
			<SELECT NAME="TxPower" SIZE="1" >
				<OPTION value="50" >50%
				<OPTION value="60" >60%
				<OPTION value="70" >70%
				<OPTION value="80" >80%
				<OPTION value="90" >90%
				<OPTION value="100" selected >100%
			</SELECT>
		</td>
	</tr>
	
	<tr height="30px">
		<td align=left class="tabdata" style="width:250px;padding-left:20px;">
			Max Client Number</td>
		<td align=left class="tabdata">
			<input type="hidden" name="maxStaNum" value="31">
			<input name="StationNum" type="text" value="0" size="7" maxlength="2" onblur="value=isNumeric(value)?value:'0';">
        (range: 0~31, 0 means no limit)</td>
	</tr>
	
	<tr height="30px">
		<td align=left class="tabdata" style="width:250px;padding-left:20px;">WIFI Multicast State</td>
		<td align=left class="tabdata">
			<INPUT TYPE="RADIO" NAME="multicastState" VALUE="1" checked >Enable&nbsp;&nbsp;&nbsp;&nbsp;       
			<INPUT TYPE="RADIO" NAME="multicastState" VALUE="0"   >Disable
		</td>
	</tr>
	
	<tr height="30px" style="display:none;">
		<td align=left class="tabdata" style="width:250px;padding-left:20px;">
			Wireless LAN Scheduling</font></div></td>
		<td align=left class="tabdata">
			<input type="button" value="Scheduling" onclick="window.open('/cgi-bin/WLAN_Scheduling.asp','Scheduling','toolbar=no,menubar=no,height=450,width=780,location=0,left=200,top=400');">
		</td>
	</tr>
	
	</table>
</div>
<div id="11nMode_1_div" class="main_item">
<table width="640" border="0" cellpadding="0" cellspacing="0" bgcolor="#FFFFFF" style="table-layout: fixed;margin:5px 0;">
	<tr height="25px" style="width:100%;background:#e6e6e6;">
    	<td align=left class="title-main" style="width:250px;padding-left:20px;">11n Settings</td>
	</tr>
</table>
<table width="640" border="0" cellpadding="0" cellspacing="0" bgcolor="#FFFFFF" style="table-layout: fixed">
	<tr height="30px">
		<td align=left class="tabdata" style="width:250px;padding-left:20px;">Channel Bandwidth</td>
    <td align=left class="tabdata">
		<select name="WLANChannelBandwidth" onChange="doChannelBandwidthChange();">
          <option value="0" selected>20 MHz</option>
		  
		  <option value="1" >20/40 MHz</option>
		
        </select>
	</td>
  </tr>
	</table>
	<div id="HT_BW_1_div">
	<table width="640" border="0" cellpadding="0" cellspacing="0" bgcolor="#FFFFFF" style="table-layout: fixed;display:none;">
 	<tr height="30px">
		<td align=left class="tabdata" style="width:250px;padding-left:20px;">
    		Extension Channel</td>
    	<td align=left class="tabdata">
	        <select name="WLANExtensionChannel" onChange="doExtChannChange();">
		        <option value="0" >below the control channel</option>
				<option value="1" selected>above the control channel</option>
	        </select>
		</td>
  	</tr>
  </table>
</div>
	<table width="640" border="0" cellpadding="0" cellspacing="0" bgcolor="#FFFFFF" style="table-layout: fixed">
		<tr height="30px">
		<td align=left class="tabdata" style="width:250px;padding-left:20px;">
    		Guard Interval</td>
    <td align=left class="tabdata">
        <select name="WLANGuardInterval">
        <option value="0" selected>800 nsec</option>
		<option value="1" >400 nsec</option>
        </select>
	</td>
  </tr>
<tr height="30px">
	<td align=left class="tabdata" style="width:250px;padding-left:20px;">

    MCS</td>
    <td align=left class="tabdata">
        <select name="WLANMCS">
        <option value="0" >0</option>
        <option value="1" >1</option>
		<option value="2" >2</option>
		<option value="3" >3</option>
		<option value="4" >4</option>
		<option value="5" >5</option>
		<option value="6" >6</option>
        <option value="7" >7</option>
		

		
		<option value="33" selected>AUTO</option>
       </select>
	</td>
  </tr>
  
 
	
  
  </table>
  </div>
 <div  class="main_item">
  	<table width="640" border="0" cellpadding="0" cellspacing="0" bgcolor="#FFFFFF" style="table-layout: fixed;margin:5px 0;">
	    <tr height="25px" style="width:100%;background:#e6e6e6;">
	    	<td align=left class="title-main" style="width:250px;padding-left:20px;">SSID Settings</td>
		</tr>
	</table>

<table width="640" border="0" cellpadding="0" cellspacing="0" bgcolor="#FFFFFF" style="table-layout: fixed">

	<tr height="30px">
		<td align=left class="tabdata" style="width:250px;padding-left:20px;">SSID index</td>
		<td align=left class="tabdata">
		<select NAME="SSID_INDEX" SIZE="1" onChange="doSSIDChange()">
		<OPTION value="0" selected>1
	
		
		<OPTION value="1" >2
		
		<OPTION value="2" >3
		<OPTION value="3" >4
	
		</select>
		</td>
</tr>


	<tr height="30px">
	    <td align=left class="tabdata" style="width:250px;padding-left:20px;">PerSSID Switch</td>
	    <td align=left class="tabdata">
			<INPUT TYPE="RADIO" NAME="ESSID_Enable_Selection" VALUE="1" checked >
	        Enable 
	        <INPUT TYPE="RADIO" NAME="ESSID_Enable_Selection" VALUE="0"   >
	        Disable
		</td>
	</tr>

	<tr height="30px">
    	<td align=left class="tabdata" style="width:250px;padding-left:20px;">SSID Name</td>
		<td align=left class="tabdata">
			<INPUT TYPE="TEXT" NAME="ESSID" SIZE="35" MAXLENGTH="32" VALUE="FPT Telecom-EA40">
		</td>
	</tr>
	<tr height="30px">
    	<td align=left class="tabdata" style="width:250px;padding-left:20px;">SSID Broadcast State</td>
    	<td align=left class="tabdata">
			<INPUT TYPE="RADIO" NAME="ESSID_HIDE_Selection" VALUE="0" checked >Enable &nbsp;&nbsp;&nbsp;		
			<INPUT TYPE="RADIO" NAME="ESSID_HIDE_Selection" VALUE="1" onClick="doBroadcastSSIDChange();"   >Disable
		</td>
	</tr>
	</table>
	<div id="11nMode_0_div">
	<table width="640" border="0" cellpadding="0" cellspacing="0" bgcolor="#FFFFFF" style="table-layout: fixed">
	<tr height="30px">
    	<td align=left class="tabdata" style="width:250px;padding-left:20px;">
		WMM</td>
    	<td align=left class="tabdata">
			<INPUT TYPE="RADIO" NAME="WMM_Selection" VALUE="1"  >Enable&nbsp;&nbsp;&nbsp;&nbsp;
			<INPUT TYPE="RADIO" NAME="WMM_Selection" VALUE="0" checked  >Disable
		</td>
	</tr>
	</table>
	</div>

  
</div>


	<table width="640" border="0" cellpadding="0" cellspacing="0" bgcolor="#FFFFFF" style="table-layout: fixed;margin:5px 0;" id="WPSSettingText_table">
		<tr height="30px"style="width:100%;background:#e6e6e6;">
			<td align=left class="title-main" style="width:250px;padding-left:20px;">
				WPS Settings</td>
			<td width="440"></td>
		</tr>
  </table>
  <table width="640" border="0" cellpadding="0" cellspacing="0" bgcolor="#FFFFFF" style="table-layout: fixed">

  
  <tr height="30px">
  	<td align=left class="tabdata" style="width:250px;padding-left:20px;">
		Use WPS</td>
    <td align=left class="tabdata">
		<input name="UseWPS_Selection" VALUE="1" checked onClick="doWPSUseChange();" type="radio">Enable&nbsp;&nbsp;&nbsp;&nbsp;
		<input name="UseWPS_Selection" VALUE="0"   onClick="doWPSUseChange();" type="radio">Disable</td>
  </tr>
	</table>
	<div id="WPSConfMode_1_div" class="main_item">
  <table width="640" border="0" cellpadding="0" cellspacing="0" bgcolor="#FFFFFF" style="table-layout: fixed">
  <tr height="30px">
  	<td align=left class="tabdata" style="width:250px;padding-left:20px;">
	WPS State</td>
    <td align=left class="tabdata">
	  Configured
	</td>
  </tr>
  <tr height="30px">
  	<td align=left class="tabdata" style="width:250px;padding-left:20px;">
	WPS Mode</td>
    <td align=left class="tabdata">
		<input name="WPSMode_Selection" value="0" onClick="doWPSModeChange();"  type="radio">PIN code&nbsp;&nbsp;&nbsp;&nbsp;
		<input name="WPSMode_Selection" value="1" onClick="doWPSModeChange();" checked   type="radio">PBC</td>
  </tr>
  
  <tr height="30px">
  	<td align=left class="tabdata" style="width:250px;padding-left:20px;"></td>
    <td align=left class="tabdata">
		<input name="StartWPS" value="Start WPS " onclick="doStartWPS();" type="button"></td>
  </tr>
  <tr height="30px">
  	<td align=left class="tabdata" style="width:250px;padding-left:20px;">
		WPS Progress</td>
    <td align=left class="tabdata">
	Idle
	</td>
  </tr>
  <tr height="30px" style="display:none">
  	<td align=left class="tabdata" style="width:250px;padding-left:20px;"></td>
    <td align=left class="tabdata">
		<input name="ResetOOB" value="Reset to OOB" onclick="doResetOOB();" type="button" ></td>
  </tr>
</table>
	</div>
  
 
  
	<div  class="main_item">
<table width="640" border="0" cellpadding="0" cellspacing="0" bgcolor="#FFFFFF" style="table-layout: fixed;margin:5px 0;">
	<tr height="25px" style="width:100%;background:#e6e6e6;">
		<td align=left class="title-main" style="width:250px;padding-left:20px;">
			Select Security Type </td>
	</tr>
</table>

<table width="640" border="0" cellpadding="0" cellspacing="0" bgcolor="#FFFFFF" style="table-layout: fixed">
	<tr height="30px">
		<td align=left class="tabdata" style="width:250px;padding-left:20px;">
			Authentication Type</td>
		<td align=left class="tabdata">
			<SELECT NAME="WEP_Selection" SIZE="1" onChange="doWEPChange()">
			
			
				<OPTION >OPEN
				
			
				<!--<OPTION value="WEP-64Bits" >WEP-64Bits
				<OPTION value="WEP-128Bits" >WEP-128Bits-->
				<OPTION value="WPAPSK" >WPA-PSK
				<OPTION value="WPA2PSK" >WPA2-PSK 
				<OPTION value="WPAPSKWPA2PSK" selected>WPA-PSK/WPA2-PSK	
			</SELECT>
			<INPUT TYPE="HIDDEN" NAME="wlanWEPFlag" VALUE="0">
		</td>
	</tr>
	
</table>

<table width="640" border="0" cellpadding="0" cellspacing="0" bgcolor="#FFFFFF" style="table-layout: fixed">
	
	</table>
	<div id="WEP-64Bits_div">
	<table width="640" border="0" cellpadding="0" cellspacing="0" bgcolor="#FFFFFF" style="table-layout: fixed;margin:5px 0;">
		<tr height="25px" style="width:100%;background:#e6e6e6;">
			<td align=left class="title-main" style="width:250px;padding-left:20px;">
				WEP </td>
		</tr>
	</table>
	<table width="640" border="0" cellpadding="0" cellspacing="0" bgcolor="#FFFFFF">       
      <tr height="30px"> 
		<td align=left class="tabdata" style="width:250px;padding-left:20px;">WEP AuthType</td>
		<td align=left class="tabdata">
		<SELECT NAME="WEP_TypeSelection1" SIZE="1" onChange="doWEPTypeChange()">
				<OPTION value="OpenSystem" >OPENWEP
				<OPTION value="SharedKey" >SHAREDWEP
				<OPTION value="WEPAuto" selected>Both			
		</SELECT>
		</td>
	</tr>
      <tr height="30px"> 
        <td align=left class="tabdata" style="width:250px;padding-left:20px;">WEP-64Bits</td>
        <td align=left class="tabdata">For each key, please enter either (1) 5 characters, or (2) 10 characters ranging from 0~9, a, b, c, d, e, f.</td>
      </tr>
      <tr height="30px"> 
        <td align=left class="tabdata" style="width:250px;padding-left:20px;">WEP-128Bits</td>
        <td align=left class="tabdata">For each key, please enter either (1) 13 characters, or (2) 26 characters ranging from 0~9, a, b, c, d, e, f.</td>
      </tr>
      <tr height="30px"> 
        <td align=left class="tabdata" style="width:250px;padding-left:20px;"> 
            <INPUT TYPE="RADIO" NAME="DefWEPKey3" VALUE="1" checked >
            Key#1:</td>
        <td align=left class="tabdata"><INPUT TYPE="TEXT" NAME="WEP_Key13" SIZE="30" MAXLENGTH="28" VALUE="" onBlur="doKEYcheck(this)" > 
        </td>
      </tr>
      <tr height="30px"> 
        <td align=left class="tabdata" style="width:250px;padding-left:20px;"> 
            <INPUT TYPE="RADIO" NAME="DefWEPKey3" VALUE="2"  >
            Key#2:</td>
        <td align=left class="tabdata"><INPUT TYPE="TEXT" NAME="WEP_Key23" SIZE="30" MAXLENGTH="28" VALUE=""  onBlur="doKEYcheck(this)" > 
        </td>
      </tr>
      <tr height="30px"> 
        <td align=left class="tabdata" style="width:250px;padding-left:20px;"> 
            <INPUT TYPE="RADIO" NAME="DefWEPKey3" VALUE="3"  >
            Key#3:</td>
        <td align=left class="tabdata"><INPUT TYPE="TEXT" NAME="WEP_Key33" SIZE="30" MAXLENGTH="28" VALUE=""  onBlur="doKEYcheck(this)" > 
        </td>
      </tr>
      <tr height="30px"> 
        <td align=left class="tabdata" style="width:250px;padding-left:20px;"> 
            <INPUT TYPE="RADIO" NAME="DefWEPKey3" VALUE="4"  >
            Key#4:</td>
        <td align=left class="tabdata"><INPUT TYPE="TEXT" NAME="WEP_Key43" SIZE="30" MAXLENGTH="28" VALUE=""  onBlur="doKEYcheck(this)" > 
        </td>
      </tr>

	</table>
	</div>
	<div id="WEP-128Bits_div">
	<table width="640" border="0" cellpadding="0" cellspacing="0" bgcolor="#FFFFFF" style="table-layout: fixed;margin:5px 0;">
		<tr height="25px" style="width:100%;background:#e6e6e6;">
			<td align=left class="title-main" style="width:250px;padding-left:20px;">
				WEP </td>
		</tr>
	</table>
	<table width="640" border="0" cellpadding="0" cellspacing="0" bgcolor="#FFFFFF">
	<tr height="30px">
		<td align=left class="tabdata" style="width:250px;padding-left:20px;">WEP AuthType</td>
		<td align=left class="tabdata">
		<SELECT NAME="WEP_TypeSelection2" SIZE="1" onChange="doWEPTypeChange()">
				<OPTION value="OpenSystem" >OPENWEP
				<OPTION value="SharedKey" >SHAREDWEP
				<OPTION value="WEPAuto" selected>Both			
		</SELECT>
		</td>
	</tr>
	<tr height="30px">
		<td align=left class="tabdata" style="width:250px;padding-left:20px;">WEP-64Bits</td>
		<td align=left class="tabdata">For each key, please enter either (1) 5 characters, or (2) 10 characters ranging from 0~9, a, b, c, d, e, f.</td>
	</tr>
	<tr height="30px">
		<td align=left class="tabdata" style="width:250px;padding-left:20px;">WEP-128Bits</td>
		<td align=left class="tabdata">For each key, please enter either (1) 13 characters, or (2) 26 characters ranging from 0~9, a, b, c, d, e, f.</td>
	</tr>
	<tr height="30px">
		<td align=left class="tabdata" style="width:250px;padding-left:20px;">
			<INPUT TYPE="RADIO" NAME="DefWEPKey4" VALUE="1"  checked >
			Key#1:
		</td>
		<td align=left class="tabdata">   
			<INPUT TYPE="TEXT" NAME="WEP_Key14" SIZE="30" MAXLENGTH="28" VALUE="" onBlur="doKEYcheck(this);" >
		</td>
	</tr>
	<tr height="30px">                                                                                      
		<td align=left class="tabdata" style="width:250px;padding-left:20px;">                                                                                                                                                                                     
			<INPUT TYPE="RADIO" NAME="DefWEPKey4" VALUE="2"  >
			Key#2:
		</td>
		<td align=left class="tabdata">
			<INPUT TYPE="TEXT" NAME="WEP_Key24" SIZE="30" MAXLENGTH="28" VALUE=""  onBlur="doKEYcheck(this);" >
		</td>
	</tr>
	<tr height="30px">                                                                                      
		<td align=left class="tabdata" style="width:250px;padding-left:20px;">                                                                                                                                                                                     
			<INPUT TYPE="RADIO" NAME="DefWEPKey4" VALUE="3"  >
			Key#3:
		</td>
		<td align=left class="tabdata">           
			<INPUT TYPE="TEXT" NAME="WEP_Key34" SIZE="30" MAXLENGTH="28" VALUE=""  onBlur="doKEYcheck(this);" >
		</td>
	</tr>
	<tr height="30px">                                                                                      
    <td align=left class="tabdata" style="width:250px;padding-left:20px;">                                                                                                                                                                                     
			<INPUT TYPE="RADIO" NAME="DefWEPKey4" VALUE="4"  >
			Key#4:
		</td>
		<td align=left class="tabdata">
			<INPUT TYPE="TEXT" NAME="WEP_Key44" SIZE="30" MAXLENGTH="28" VALUE=""  onBlur="doKEYcheck(this);" >
		</td>
	</tr>

	</table>
	</div>
	<div id="WPA2PSK_div">
	<table width="640" border="0" cellpadding="0" cellspacing="0" bgcolor="#FFFFFF" style="table-layout: fixed;margin:5px 0;">
		<tr height="25px" style="width:100%;background:#e6e6e6;">
    		<td align=left class="title-main" style="width:250px;padding-left:20px;">WPA-PSK</td>
		</tr>
	</table>
<table width="640" border="0" cellpadding="0" cellspacing="0" bgcolor="#FFFFFF" style="table-layout: fixed">
	<tr height="30px">
		<td align=left class="tabdata" style="width:250px;padding-left:20px;">
			Encryption Type</td>
		<td align=left class="tabdata">
			<SELECT NAME="TKIP_Selection4" onChange="doEncryptionChange(this)" SIZE="1">
				<OPTION value="AES" selected>AES 
				<OPTION value="TKIP"  >TKIP
				<OPTION value="TKIPAES" >TKIP/AES
			</SELECT>
		</td>
	</tr>
</table>

<table width="640" border="0" cellpadding="0" cellspacing="0" bgcolor="#FFFFFF" style="table-layout: fixed;margin:5px 0;">
    <tr height="25px" style="width:100%;background:#e6e6e6;">
    	<td align=left class="title-main" style="width:250px;padding-left:20px;">Security Passphrase </td>
	</tr>
</table>

<table width="640" border="0" cellpadding="0" cellspacing="0" bgcolor="#FFFFFF" style="table-layout: fixed">
	<tr height="30px">
		<td align=left class="tabdata" style="width:250px;padding-left:20px;">
			Security Passphrase</td>
		<td align=left class="tabdata">
			<INPUT TYPE="TEXT" NAME="PreSharedKey1" SIZE="48" MAXLENGTH="64" VALUE="22800025" onBlur="wpapskCheck(this)"><font color="#000000">(8~63 characters or 64 Hex string)</font>
		</td>
	</tr>
	<tr height="30px" style="display:none">
		<td align=left class="tabdata" style="width:270px;">&nbsp;</td>
		<td align=left class="tabdata">
			(8~63 characters or 64 Hex string) </td>
	</tr>

	<tr height="30px" style="display:none;">
		<td align=left class="tabdata" style="width:250px;padding-left:20px;">
			Key Renewal Interval</td>
		<td align=left class="tabdata">
			<INPUT TYPE="TEXT" id="keyRenewalInterval1" NAME="keyRenewalInterval1" SIZE="7" MAXLENGTH="7" onBlur="checkRekeyinteral(this.value, 0)">
          	seconds   (10 ~ 4194303)
		  	<script language="JavaScript" type="text/JavaScript">
				var rekeystr = "3600";
				if("N/A" == rekeystr || "" == rekeystr){
					document.getElementById('keyRenewalInterval1').value = "3600";
				}
				else{
					document.getElementById('keyRenewalInterval1').value = rekeystr;
				}
			</script>
		  </td>
	</tr>
	</table>
	</div>
	<div id="WPAPSK_div">
	<table width="640" border="0" cellpadding="0" cellspacing="0" bgcolor="#FFFFFF" style="table-layout: fixed;margin:5px 0;">		
		<tr height="25px" style="width:100%;background:#e6e6e6;">
    		<td align=left class="title-main" style="width:250px;padding-left:20px;">WPA-PSK</td>
		 </tr>
	</table>

<table width="640" border="0" cellpadding="0" cellspacing="0" bgcolor="#FFFFFF" style="table-layout: fixed">
	<tr height="30px">
		<td align=left class="tabdata" style="width:250px;padding-left:20px;">
		Encryption Type</td>
		<td align=left class="tabdata">
			<SELECT NAME="TKIP_Selection5" onChange="doEncryptionChange(this)" SIZE="1">
				<OPTION value="AES" selected>AES 
				<OPTION value="TKIP" >TKIP
				<OPTION value="TKIPAES" >TKIP/AES
		</SELECT>
		</td>
	</tr>
</table>

<table width="640" border="0" cellpadding="0" cellspacing="0" bgcolor="#FFFFFF" style="table-layout: fixed;margin:5px 0;">
	<tr height="25px" style="width:100%;background:#e6e6e6;">
    	<td align=left class="title-main" style="width:250px;padding-left:20px;">Security Passphrase</td>
	</tr>
</table>

<table width="640" border="0" cellpadding="0" cellspacing="0" bgcolor="#FFFFFF" style="table-layout: fixed">
	<tr height="30px">
		<td align=left class="tabdata" style="width:250px;padding-left:20px;">
			Security Passphrase</td>
		<td align=left class="tabdata">
			<INPUT TYPE="TEXT" NAME="PreSharedKey2" SIZE="48" MAXLENGTH="64" VALUE="22800025" onBlur="wpapskCheck(this)">(8~63 characters or 64 Hex string)
		</td>
	</tr>
	<tr height="30px" style="display:none">
		<td align=left class="tabdata" style="width:270px;">&nbsp;</td>
		<td align=left class="tabdata">
			(8~63 characters or 64 Hex string) </td>
	</tr>

	<tr height="30px" style="display:none">
		<td align=left class="tabdata" style="width:250px;padding-left:20px;">
			Key Renewal Interval</td>
		<td align=left class="tabdata">
			<INPUT TYPE="TEXT" id="keyRenewalInterval2" NAME="keyRenewalInterval2" SIZE="7" MAXLENGTH="7" onBlur="checkRekeyinteral(this.value, 0)">
          	seconds   (10 ~ 4194303)
		  	<script language="JavaScript" type="text/JavaScript">
				var rekeystr = "3600";
				if("N/A" == rekeystr || "" == rekeystr){
					document.getElementById('keyRenewalInterval2').value = "3600";
				}
				else{
					document.getElementById('keyRenewalInterval2').value = rekeystr;
				}
			</script>
		  </td>
	</tr>
	</table>
	</div>
	<div id="WPAPSKWPA2PSK_div">
	<table width="640" border="0" cellpadding="0" cellspacing="0" bgcolor="#FFFFFF" style="table-layout: fixed;margin:5px 0;">
	<tr height="25px" style="width:100%;background:#e6e6e6;">
    	<td align=left class="title-main" style="width:250px;padding-left:20px;">WPA-PSK</td>
	</tr>
</table>

<table width="640" border="0" cellpadding="0" cellspacing="0" bgcolor="#FFFFFF" style="table-layout: fixed">
	<tr height="30px">
		<td align=left class="tabdata" style="width:250px;padding-left:20px;">
		Encryption Type</td>
		<td align=left class="tabdata">
			<SELECT NAME="TKIP_Selection6" onChange="doEncryptionChange(this)"s SIZE="1">
				<OPTION value="AES" selected>AES 
				<OPTION value="TKIP"  >TKIP
				<OPTION value="TKIPAES" >TKIP/AES 
			</SELECT>
		</td>
	</tr>
	</table>

<table width="640" border="0" cellpadding="0" cellspacing="0" bgcolor="#FFFFFF" style="table-layout: fixed;margin:5px 0;">
        <tr height="25px" style="width:100%;background:#e6e6e6;">
        	<td align=left class="title-main" style="width:250px;padding-left:20px;">Security Passphrase</td>
	</tr>
</table>

<table width="640" border="0" cellpadding="0" cellspacing="0" bgcolor="#FFFFFF" style="table-layout: fixed">
	<tr height="30px">
		<td align=left class="tabdata" style="width:250px;padding-left:20px;">
			Security Passphrase</td>
		<td align=left class="tabdata">
			<INPUT TYPE="TEXT" NAME="PreSharedKey3" SIZE="48" MAXLENGTH="64" VALUE="22800025" onBlur="wpapskCheck(this)"><font color="#000000">(8~63 characters or 64 Hex string)</font>
		</td>
	</tr>
	<tr height="30px" style="display:none">
		<td align=left class="tabdata" style="width:270px;">&nbsp;</td>
		<td align=left class="tabdata">
			(8~63 characters or 64 Hex string) </td>
	</tr>

	<tr height="30px" style="display:none">
		<td align=left class="tabdata" style="width:250px;padding-left:20px;">
			Key Renewal Interval</font></td>
		<td align=left class="tabdata">
			<INPUT TYPE="TEXT" id="keyRenewalInterval3" NAME="keyRenewalInterval3" SIZE="7" MAXLENGTH="7" onBlur="checkRekeyinteral(this.value, 0)">
          	seconds   (10 ~ 4194303)
		  	<script language="JavaScript" type="text/JavaScript">
				var rekeystr = "3600";
				if("N/A" == rekeystr || "" == rekeystr)
				{
					document.getElementById('keyRenewalInterval3').value = "3600";
				}
				else
				{
					document.getElementById('keyRenewalInterval3').value = rekeystr;
				}
			</script>
		  </td>
	</tr>
	</table>
	</div>
	</div>

<div class="main_item">
<table width="640" border="0" cellpadding="0" cellspacing="0" bgcolor="#FFFFFF" style="table-layout: fixed;margin:5px 0;">
	<tr height="25px" style="width:100%;background:#e6e6e6;">
        <td align=left class="title-main" style="width:250px;padding-left:20px;">
			Set MAC access control state</td>
	</tr>
</table>
<table width="640" border="0" cellpadding="0" cellspacing="0" bgcolor="#FFFFFF" style="table-layout: fixed">
<tr height="30px">
        <td align=left class="tabdata" style="width:250px;padding-left:20px;">
			Access Control State</td>
		<td align=left class="tabdata">
			<INPUT TYPE="RADIO" NAME="WLAN_FltActive" VALUE="1"  onClick="doAccControlChange();">Enable&nbsp;&nbsp;&nbsp;&nbsp;
			<INPUT TYPE="RADIO" NAME="WLAN_FltActive" VALUE="0" checked  onClick="doAccControlChange();">Disable
		</td>
	</tr>
</table>
<div id="accessControl_div">
<table width="640" border="0" cellpadding="0" cellspacing="0" bgcolor="#FFFFFF" style="table-layout: fixed">
	<tr height="30px">
		<td align=left class="tabdata" style="width:250px;padding-left:20px;">
			Access Control Model</td>
		<td align=left class="tabdata">
			<SELECT NAME="WLAN_FltAction" SIZE="1">
				<OPTION value="1" >Allow
				<OPTION value="2" >Deny
			</SELECT>
			the follow Wireless LAN station(s) association.
		</td>
	</tr>
</table>
<table width="640" border="0" cellpadding="0" cellspacing="0" bgcolor="#FFFFFF" style="table-layout: fixed">
	<tr height="30px">
  		<td align=left class="tabdata" style="width:250px;padding-left:20px;">Mac Address #1	</div></td>
 		<td align=left class="tabdata">
			<INPUT TYPE="TEXT" NAME="WLANFLT_MAC1" SIZE="20" MAXLENGTH="20" VALUE="">
		</td>
	</tr>
</table>
	<table width="640" border="0" cellpadding="0" cellspacing="0" bgcolor="#FFFFFF" style="table-layout: fixed">
	<tr height="30px">
  		<td align=left class="tabdata" style="width:250px;padding-left:20px;">Mac Address #2</td>
    	<td align=left class="tabdata">
			<INPUT TYPE="TEXT" NAME="WLANFLT_MAC2" SIZE="20" MAXLENGTH="20" VALUE="">
		</td>
	</tr>
</table>
	<table width="640" border="0" cellpadding="0" cellspacing="0" bgcolor="#FFFFFF" style="table-layout: fixed">
	<tr height="30px">
  		<td align=left class="tabdata" style="width:250px;padding-left:20px;">Mac Address #3	</div></td>
		<td align=left class="tabdata">
			<INPUT TYPE="TEXT" NAME="WLANFLT_MAC3" SIZE="20" MAXLENGTH="20" VALUE="">
		</td>
	</tr>
</table>
<table width="640" border="0" cellpadding="0" cellspacing="0" bgcolor="#FFFFFF" style="table-layout: fixed">
	<tr height="30px">
  		<td align=left class="tabdata" style="width:250px;padding-left:20px;">Mac Address #4</td>
    	<td align=left class="tabdata">
			<INPUT TYPE="TEXT" NAME="WLANFLT_MAC4" SIZE="20" MAXLENGTH="20" VALUE="">
		</td>
	</tr>
</table>
<table width="640" border="0" cellpadding="0" cellspacing="0" bgcolor="#FFFFFF" style="table-layout: fixed">
	<tr height="30px">
  		<td align=left class="tabdata" style="width:250px;padding-left:20px;">Mac Address #5</td>
		<td align=left class="tabdata">
			<INPUT TYPE="TEXT" NAME="WLANFLT_MAC5" SIZE="20" MAXLENGTH="20" VALUE="">
		</td>
	</tr>
</table>
<table width="640" border="0" cellpadding="0" cellspacing="0" bgcolor="#FFFFFF" style="table-layout: fixed">
	<tr height="30px">
  		<td align=left class="tabdata" style="width:250px;padding-left:20px;">Mac Address #6</td>
		<td align=left class="tabdata">
			<INPUT TYPE="TEXT" NAME="WLANFLT_MAC6" SIZE="20" MAXLENGTH="20" VALUE="">
		</td>
	</tr>
</table>
<table width="640" border="0" cellpadding="0" cellspacing="0" bgcolor="#FFFFFF" style="table-layout: fixed">
	<tr height="30px">
  		<td align=left class="tabdata" style="width:250px;padding-left:20px;">Mac Address #7</td>
    	<td align=left class="tabdata">
			<INPUT TYPE="TEXT" NAME="WLANFLT_MAC7" SIZE="20" MAXLENGTH="20" VALUE="">
		</td>
	</tr>
</table>
<table width="640" border="0" cellpadding="0" cellspacing="0" bgcolor="#FFFFFF" style="table-layout: fixed">
	<tr height="30px">
  		<td align=left class="tabdata" style="width:250px;padding-left:20px;">Mac Address #8</td>
		<td align=left class="tabdata">
			<INPUT TYPE="TEXT" NAME="WLANFLT_MAC8" SIZE="20" MAXLENGTH="20" VALUE="">
		</td>
	</tr>
</table>
</div>
<table width="640" border="0" cellpadding="0" cellspacing="0" bgcolor="#FFFFFF" style="table-layout: fixed;display:none">
	
	<tr height="30px">
  		<td align=left class="tabdata" style="width:250px;padding-left:20px;">Other</td>
		<td width="440"></td>
	</tr>
	<tr height="30px">
  		<td align=left class="tabdata" style="width:250px;padding-left:20px;">Tx Stream</td>
		<td align=left class="tabdata">
			<SELECT NAME="TxStream_Action" SIZE="1">
				<OPTION value="1" >1
				<OPTION value="2" selected>2
									
			</SELECT>
		</td>
	</tr>
</table>
<table width="640" border="0" cellpadding="0" cellspacing="0" bgcolor="#FFFFFF" style="table-layout: fixed;display:none">
	<tr height="30px">
  		<td align=left class="tabdata" style="width:250px;padding-left:20px;">Rx Stream</td>
		<td align=left class="tabdata">
			<SELECT NAME="RxStream_Action" SIZE="1">
				<OPTION value="1" >1
				<OPTION value="2" selected>2
														
			</SELECT>
		</td>
	</tr>	
	
</table>
</div>
<div class="main_item">
<table width="640" border="0" cellpadding="0" cellspacing="0" bgcolor="#FFFFFF" style="margin:5px 0;">
    <tr height="25px">
    	<td align=left class="title-main" style="padding-left:20px;white-space:nowrap;">Click "Save" to save your settings</td>
    </tr>
</table>
<table width="640" border="0" cellpadding="0" cellspacing="0" bgcolor="#FFFFFF">
	<tr height="40px">
		<td colspan="2" align=left class="tabdata" style="padding-left:20px;">
			<INPUT TYPE="BUTTON" NAME="BUTTON" class="button1" VALUE="Save" onClick="return doSave();">
			<INPUT TYPE="BUTTON" NAME="CancelBtn" class="button1" VALUE="Cancel" onClick="javascript:window.location='home_wireless.asp'">
			<INPUT TYPE="HIDDEN" NAME="CountryChange" VALUE="0">
		</td>
	</tr>
</table>
</div>
</div><!--end id=contenttype-->
</div><!--end id=pagestyle-->
</form>

</body>
</html>
<!-- BẮT ĐẦU SCRIPT CHẶN RELOAD TRANG KHI SAVE (TỰ ĐỘNG THÊM VÀO) -->
<script>
(function() {
    var STORE_KEY = 'ftc_sim_wifi24';

    // ── Lưu toàn bộ form vào localStorage ──
    function saveFormToStorage() {
        try {
            var form = document.WLAN || document.forms[0];
            if (!form) return;
            var data = {};
            for (var i = 0; i < form.elements.length; i++) {
                var el = form.elements[i];
                if (!el.name) continue;
                if (el.type === 'radio' || el.type === 'checkbox') {
                    if (el.checked) data[el.name] = el.value;
                } else {
                    data[el.name] = el.value;
                }
            }
            localStorage.setItem(STORE_KEY, JSON.stringify(data));
        } catch(e) {}
    }

    // ── Phục hồi form từ localStorage ──
    function restoreFormFromStorage() {
        try {
            var raw = localStorage.getItem(STORE_KEY);
            if (!raw) return;
            var data = JSON.parse(raw);
            var form = document.WLAN || document.forms[0];
            if (!form) return;
            for (var name in data) {
                var elements = form.elements[name];
                if (!elements) continue;
                var list = elements.length !== undefined && elements.tagName === undefined ? elements : [elements];
                for (var i = 0; i < list.length; i++) {
                    var el = list[i];
                    if (el.type === 'radio' || el.type === 'checkbox') {
                        el.checked = (el.value === data[name]);
                    } else {
                        el.value = data[name];
                    }
                }
            }
        } catch(e) {}
    }

    // ── Hàm hiển thị thông báo và lưu dữ liệu ──
    function showFakeSaveMsg(formEl) {
        // LƯU VÀO LOCALSTORAGE
        saveFormToStorage();

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
        setTimeout(function() { msgEl.innerHTML = ''; }, 2500);

        try {
            document._ftcIsSaved = true;
            document._ftc2gSaved = true;
            if (window.top) window.top._hasClickedSaveInGuide = true;
            if (window.parent) window.parent._hasClickedSaveInGuide = true;
            window.parent.postMessage({ type: 'FTC_SAVE_SUCCESS' }, '*');
        } catch(e) {}

        // BÁO CÁO RA PORTAL
        if (window.parent && window.parent.onSimulatorSave) {
            try { window.parent.onSimulatorSave(window); } catch(e) {}
        }
    }

    var isSavingAction = false;

    // Ghi nhận khi người dùng bấm trực tiếp vào nút Save / Apply
    document.addEventListener('click', function(e) {
        var btn = e.target && e.target.closest ? e.target.closest('input[value="Save"], input[name="BUTTON"], input[name="SaveBtn"], #save, #btnSave, .button1') : null;
        if (btn && (btn.value === 'Save' || (btn.textContent && btn.textContent.trim() === 'Save'))) {
            isSavingAction = true;
        }
    }, true);

    function isActualSaveAction(formEl) {
        if (isSavingAction) return true;
        try {
            var flag = formEl && formEl.wlanWEPFlag ? String(formEl.wlanWEPFlag.value) : '';
            // wlanWEPFlag === '3' là do doSave() thiết lập khi người dùng thực sự bấm Lưu
            if (flag === '3') return true;
        } catch(e) {}
        return false;
    }

    // 1. Chặn submit HTML native
    document.addEventListener('submit', function(e) {
        e.preventDefault();
        if (isActualSaveAction(e.target)) {
            isSavingAction = false;
            showFakeSaveMsg(e.target);
        }
    });

    // 2. Chặn submit bằng JS (document.form.submit())
    if (typeof HTMLFormElement !== 'undefined') {
        HTMLFormElement.prototype.submit = function() {
            var flag = this && this.wlanWEPFlag ? String(this.wlanWEPFlag.value) : '';
            // Nếu do doSSIDChange() (flag == 2) hoặc các tác vụ đổi dropdown khác gọi submit(): bỏ qua không lưu
            if (flag === '2') {
                isSavingAction = false;
                return;
            }
            if (isActualSaveAction(this)) {
                isSavingAction = false;
                showFakeSaveMsg(this);
            }
        };
    }

    // 3. Phục hồi dữ liệu khi trang load xong
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', restoreFormFromStorage);
    } else {
        restoreFormFromStorage();
    }
    // Phục hồi thêm lần nữa sau 800ms (đề phòng ASP JS render lại sau)
    setTimeout(restoreFormFromStorage, 800);
})();
</script>
<!-- KẾT THÚC SCRIPT CHẶN RELOAD -->
