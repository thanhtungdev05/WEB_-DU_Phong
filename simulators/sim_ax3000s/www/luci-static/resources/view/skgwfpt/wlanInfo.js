
function convertInterfaceName(interfaceName){if(interfaceName.startsWith('ra')){if(interfaceName.includes('i')){const index=interfaceName.replace('rai','');return`Wi-Fi 5G${index === '0' ? '' : '_' + (parseInt(index) + 1)}`;}else{const index=interfaceName.replace('ra','');return`Wi-Fi 2.4G${index === '0' ? '' : '_' + (parseInt(index) + 1)}`;}}
return interfaceName;}
function wlan_show_info(data)
{$.each(data,function(index,obj){if(obj.id==1)
{if(obj.result[1].radios[0].enable=="1")
$('#Txt_GbandStatus').text("Working");else
$('#Txt_GbandStatus').text("Closed");if(obj.result[1].radios[1].enable=="1")
$('#Txt_AbandStatus').text("Working");else
$('#Txt_AbandStatus').text("Closed");if(obj.result[1].radios[0].channel=="auto")
$('#Txt_GbandChannel').text(obj.result[1].radios[0].channelInuse+" (Auto)");else
$('#Txt_GbandChannel').text(obj.result[1].radios[0].channelInuse+" (Manual)");if(obj.result[1].radios[1].channel=="auto")
$('#Txt_AbandChannel').text(obj.result[1].radios[1].channelInuse+" (Auto)");else
$('#Txt_AbandChannel').text(obj.result[1].radios[1].channelInuse+" (Manual)");}
else if(obj.id==4)
{if(obj.result[1].meshroleexchange==0)
{$('#Txt_meshRole').text("Auto");}
else
{if(obj.result[1].role==2)
{$('#Txt_meshRole').text("Agent");}
else
{$('#Txt_meshRole').text("Main-Router (Controller)");}}}
else if(obj.id==2)
{var ssidInfoTab="";var ssidinfo=obj.result[1]["bss"];for(var i=0;i<ssidinfo.length;i++){if(ssidinfo[i].enable==0)
continue;if(ssidinfo[i].backhual==1)
continue;ssidInfoTab+="<tr><td class='hd'>"+convertInterfaceName(ssidinfo[i].ifname)+"</td><td>"+ssidinfo[i].ssid+"</td><td>"+ssidinfo[i].band+"</td><td>"+ssidinfo[i].securityMode+"</td><td>"+ssidinfo[i].encrypt+"</td><td><input type='button' value='View' onClick='ViewClick(\""+ssidinfo[i].ssid+"\",\""+ssidinfo[i].ifname+"\")'></td></tr>";}
$("#Tab_SsidInfo").html(ssidInfoTab);}
else if(obj.id==3)
{var ssidStatisticsTab="";var ssidStats=obj.result[1]["bss"];for(var i=0;i<ssidStats.length;i++){if(ssidStats[i].enable==0)
continue;if(ssidStats[i].ifname=="rai7")
continue;ssidStatisticsTab+="<tr><td class='hd'>"+convertInterfaceName(ssidStats[i].ifname)+"</td><td>"+ssidStats[i].rxBytes+"</td><td>"+ssidStats[i].rxPackets+"</td><td>"+ssidStats[i].rxError+"</td><td>"+ssidStats[i].rxDrop+"</td><td>"+ssidStats[i].txBytes+"</td><td>"+ssidStats[i].txPackets+"</td><td>"+ssidStats[i].txError+"</td><td>"+ssidStats[i].txDrop+"</td></tr>";}
$("#Tab_SsidStatistics").html(ssidStatisticsTab);}});}
function ViewClick(ssid,ifname){var first3name=ifname.substring(0,3);if(first3name==="rai")
{if(ifname==="rai0")
{sk_redirect('/cgi-bin/luci/admin/wlan/wlanaband/wlanBasicSetting5g');}
else
{sk_redirect('/cgi-bin/luci/admin/wlan/advance/wlanMapSettingAll');}}
else
{if(ifname==="ra0")
{sk_redirect('/cgi-bin/luci/admin/wlan/wlangband/wlanBasicSetting2g');}
else
{sk_redirect('/cgi-bin/luci/admin/wlan/advance/wlanMapSettingAll');}}}
function pageLoad()
{var ubusparamRadio=new Array("rtweb.wifi","wlanRadioGet",{"band":"all"});var ubusparamBSS=new Array("rtweb.wifi","wlanBasicGet",{"band":"all"});var ubusparamBSSInfo=new Array("rtweb.wifi","wlanBasicStat",{"band":"all"});var ubusparammesh=new Array("rtweb.mesh","wlanMeshGet",{});var jsonparam=[{"id":1,"params":ubusparamRadio},{"id":2,"params":ubusparamBSS},{"id":3,"params":ubusparamBSSInfo},{"id":4,"params":ubusparammesh}];sk_auth_post(jsonparam,function(result){wlan_show_info(result);});}