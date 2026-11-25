
function change_pwd(newpwd)
{var host=window.location.host;var ubusparam=new Array("rtweb.session","setPassword",{"username":envcar.loginuser,"password":newpwd});var jsonparam={"id":1,"params":ubusparam};sk_auth_post(jsonparam,function(result){hide_mode();window.location.href="login.html";});}
function btnApply()
{var oldpwd=$("#pwdOld").val();var newpwd=$("#pwdNew").val();var confpwd=$("#pwdCfm").val();if(newpwd!=confpwd){warninfo_show(_("passwdNoMatchTipText"));return;}
if(newpwd.length>16||newpwd.length<8){warninfo_show(_("passwdCharactersNumsTipText"));return;}
var len=newpwd.length;for(var i=0;i<len;i++){var a=newpwd.charAt(i);if((a.match(/[^\x00-\xff]/ig)!=null)){warninfo_show(_("passwdNoChineseTipText"));return;}}
loading_show();var ubusparam=new Array("rtweb.session","login",{"username":envcar.loginuser,"password":getAES(oldpwd),"timeout":1});var jsonparam={"id":1,"params":ubusparam};sk_auth_post(jsonparam,function(result){if(result.result[1].result==0)
change_pwd(getAES(newpwd));else
{hide_mode();warninfo_show(_("oldpasswderrorTipText"));}});}