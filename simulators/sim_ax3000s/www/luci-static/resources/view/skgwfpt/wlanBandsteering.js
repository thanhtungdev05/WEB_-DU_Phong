
function pageLoad()
{get_wlan_info();}
var wifi_data={};var mesh_enable=0;var mesh_role=1;var mlo_enable=0;function web_disaplay(enable)
{setDisable(getObj("rssi2g"),enable);setDisable(getObj("rssi5g"),enable);setDisable(getObj("button_apply"),enable);}
function get_wlan_info()
{var ubusparamRadio=new Array("rtweb.wifi","wlanGlobalGet",{});var ubusparamBs=new Array("rtweb.wifi","wlanBandSteeringGet",{"index":1});var ubusmapInfo=new Array("rtweb.mesh","wlanMeshGet",{});var ubusparamMLO=new Array("rtweb.wifi","wlanMLOGet",{});var jsonparamMesh=[{"id":1,"params":ubusmapInfo},{"id":2,"params":ubusparamMLO}];var jsonparamRadio=[{"id":1,"params":ubusparamRadio},{"id":2,"params":ubusparamBs}];sk_auth_post(jsonparamMesh,function(result){mesh_enable=result[0].result[1].enable;mesh_role=result[0].result[1].role;mlo_enable=result[1].result[1].enable;sk_auth_post(jsonparamRadio,function(result){wifi_data.bandsteering=result[1].result[1].cfg[0].bandsteering_enable;wifi_data.lowRSSI2G=result[0].result[1].lowRSSI2G;wifi_data.lowRSSI5G=result[0].result[1].lowRSSI5G;show_wlan_info();});});}
function show_wlan_info()
{jslDisable("Chk_RadioEnable");if(wifi_data.bandsteering==1)
{setChecked("Chk_RadioEnable",true);}
else
{setChecked("Chk_RadioEnable",false);}
setValue("rssi2g",wifi_data.lowRSSI2G);setValue("rssi5g",wifi_data.lowRSSI5G);if(mesh_enable==true&&mesh_role==2){web_disaplay(1);}}
function BntClick_Apply()
{var band_steering=0;var RSSI2G=parseInt(getValue("rssi2g"));var RSSI5G=parseInt(getValue("rssi5g"));if(getChecked("Chk_RadioEnable")==true){band_steering=1;}
if(RSSI2G<-110||RSSI2G>-20)
{warninfo_show("RSSI2G : "+rssi2g.value+" "+_("wlanbs_RangeErr"));return 0;}
if(RSSI5G<-110||RSSI5G>-20)
{warninfo_show("RSSI5G : "+rssi5g.value+" "+_("wlanbs_RangeErr"));return 0;}
var ubusparam=new Array("rtweb.wifi","wlanGlobalSet",{"lowRSSI2G":RSSI2G,"lowRSSI5G":RSSI5G});var jsonparam={"id":1,"params":ubusparam};sk_auth_post(jsonparam,function(result){var ubusparam_reload=new Array("rtweb.wifi","reload",{});var jsonparam_reload={"id":1,"params":ubusparam_reload};sk_auth_post(jsonparam_reload,function(result){console.log("wifi reload");loading_show();setTimeout("hide_mode()",5000);});});}