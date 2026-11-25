
$(document).ready(function(){if(typeof window.navTo==='function')return;$(".nav-layer1 a,.layer2-menu a").on('click',function(e){e.preventDefault();sk_redirect($(this).attr('href'));});$("#language").change(function(){change_lang($(this).val());});History.Adapter.bind(window,'statechange',function(){var State=History.getState();show_lev1TreeMenu(State.data);show_lev23TreeMenu(State.data);loadView(State.data.path);});});const activeRequests=[];function sk_redirect(id)
{if(id&&id.indexOf('/wizard')!==-1){if(typeof loadView==='function'){loadView('quickset');}return false;}if(id&&id.indexOf('/logout')!==-1){window.location.href='login.html';return false;}if(typeof window.navTo==='function'){window.navTo(id);return false;}var data={};var webtittle;var idarray=id.split("/");data.lev1tree=idarray[4];if(idarray.length>5)
data.lev2tree=idarray[5];if(idarray.length>6)
data.lev3tree=idarray[6];if(idarray.length==5)
{if(treemenu[idarray[4]].action.type!="skview")
{data.lev2tree=$("#layer2-ul-"+data.lev1tree).children().first().attr("id").split("-")[2];id+="/"+data.lev2tree;if(treemenu[idarray[4]].children[data.lev2tree].action.type=="skview")
{webtittle=treemenu[idarray[4]].children[data.lev2tree].title;data.path=treemenu[idarray[4]].children[data.lev2tree].action.path;}
else
{id=$("#layer2-ul-"+data.lev1tree).children().first().find(".layer3-menu").find("a").eq(0).attr("href");idarray=id.split("/");data.lev3tree=idarray[6];webtittle=treemenu[idarray[4]].children[idarray[5]].children[idarray[6]].title;data.path=treemenu[idarray[4]].children[idarray[5]].children[idarray[6]].action.path;}}
else
{webtittle=treemenu[idarray[4]].title;data.path=treemenu[idarray[4]].action.path;}}
else if(idarray.length==6)
{if(treemenu[idarray[4]].children[idarray[5]].action.type!="skview")
{id=$("#layer2-leaf-"+data.lev2tree).find(".layer3-menu").find("a").eq(0).attr("href");idarray=id.split("/");data.lev3tree=idarray[6];webtittle=treemenu[idarray[4]].children[idarray[5]].children[idarray[6]].title;data.path=treemenu[idarray[4]].children[idarray[5]].children[idarray[6]].action.path;}
else
{webtittle=treemenu[idarray[4]].children[idarray[5]].title;data.path=treemenu[idarray[4]].children[idarray[5]].action.path;}}
else
{webtittle=treemenu[idarray[4]].children[idarray[5]].children[idarray[6]].title;data.path=treemenu[idarray[4]].children[idarray[5]].children[idarray[6]].action.path;}
data.url=id;if(window.location.pathname===id)
{loadView(data.path);}
History.pushState(data,webtittle,id);}
function show_lev1TreeMenu(treeData)
{$(".nav-layer1>a").each(function(i,item){var id=$(item).attr("href");var idarray=id.split("/");if(treeData.lev1tree==idarray[4])
{if(!$(item).find("li").hasClass("selected"))
$(item).find("li").addClass("selected");}
else
{if($(item).find("li").hasClass("selected"))
$(item).find("li").removeClass("selected");}});}
function select_layer2(obj)
{if($(obj).parents("li").find(".layer3-menu").is(":hidden"))
{$(obj).parents("li").find(".layer3-menu").slideDown(300);if(!$(obj).parents("li").find(".menu-array").hasClass("layer3-show"))
$(obj).parents("li").find(".menu-array").addClass("layer3-show");}
else
{$(obj).parents("li").find(".layer3-menu").slideUp(300);if($(obj).parents("li").find(".menu-array").hasClass("layer3-show"))
$(obj).parents("li").find(".menu-array").removeClass("layer3-show");}
if(!$(obj).hasClass("layer2-folder-select"))
{sk_redirect($(obj).parents("li").find(".layer3-menu>ul>a").eq(0).attr("href"));}}
function show_lev23TreeMenu_real(obj,treeData)
{var layer2Id="layer2-leaf-"+treeData.lev2tree;$(obj).children().each(function(i,item){if(layer2Id==$(item).attr("id"))
{if(!$(item).has('.layer3-menu').length)
{if(!$(item).find(".dt").hasClass("layer2-select"))
$(item).find(".dt").addClass("layer2-select");}
else
{if(!$(item).find(".dt").hasClass("layer2-folder-select"))
$(item).find(".dt").addClass("layer2-folder-select");if(!$(item).find(".menu-array").hasClass("layer3-show"))
$(item).find(".menu-array").addClass("layer3-show");if($(item).find(".layer3-menu").is(":hidden"))
{$(item).find(".layer3-menu").slideDown(300);}
$(item).find(".layer3-menu").find("a").each(function(idx,cobj){if($(cobj).attr("href")==treeData.url)
{if(!$(cobj).find("li").hasClass("active"))
$(cobj).find("li").addClass("active");}
else
{if($(cobj).find("li").hasClass("active"))
$(cobj).find("li").removeClass("active");}})}}
else
{if(!$(item).has('.layer3-menu').length)
{if($(item).find(".dt").hasClass("layer2-select"))
$(item).find(".dt").removeClass("layer2-select");}
else
{if($(item).find(".dt").hasClass("layer2-folder-select"))
$(item).find(".dt").removeClass("layer2-folder-select");if($(item).find(".layer3-menu").is(":visible"))
$(item).find(".layer3-menu").slideUp(300);if($(item).find(".menu-array").hasClass("layer3-show"))
$(item).find(".menu-array").removeClass("layer3-show");}}});}
function show_lev23TreeMenu(treeData)
{var layer2Id="layer2-ul-"+treeData.lev1tree;$(".layer2-menu>ul").each(function(i,item){if($(item).attr("id")==layer2Id)
{$(item).show();show_lev23TreeMenu_real(item,treeData)}
else
$(item).hide();});}
var g_timeout=null;function init_expritime()
{var host=window.location.host;var ubusparam=new Array("system","board",{});var jsonparam={"id":1,"params":ubusparam};sk_auth_post(jsonparam,function(result){if(result.error)
window.location.href='login.html';else
window.location.href='login.html';});}
function renew_session()
{$.ajax({url:"/cgi-bin/luci/admin/renew",type:"get",dataType:"json",success:function(result){if(g_timeout)
clearTimeout(g_timeout);var timeout=(parseInt(envcar.sessiontime)+1)*1000
g_timeout=setTimeout("init_expritime()",timeout);},error:function(xhr,status,error){/* keep simulated session alive inside iframe */}});}
if(!Array.isArray){Array.isArray=function(arg){return Object.prototype.toString.call(arg)==='[object Array]';};}
function fill_data(data)
{data.jsonrpc="2.0";data.method="call";data.params.unshift(envcar.sessionid);}
function sk_auth_post(data,callback_func,err_func)
{if(Array.isArray(data))
{for(var i=0;i<data.length;i++)
{fill_data(data[i]);}}
else
fill_data(data);var datastr=JSON.stringify(data,null,4);const xhr=$.ajax({url:"/ubus",type:"POST",data:datastr,dataType:"json",success:function(result){callback_func(result);},complete:function(){const index=activeRequests.indexOf(xhr);if(index!==-1){activeRequests.splice(index,1);}},error:function(xhr,status,error){if(typeof err_func==='function')
{err_func();}}});activeRequests.push(xhr);}
function sk_auth_apply(data,callback_func)
{loading_show();if(Array.isArray(data))
{for(var i=0;i<data.length;i++)
{fill_data(data[i]);}}
else
fill_data(data);var datastr=JSON.stringify(data,null,4);const xhr=$.ajax({url:"/ubus",type:"POST",data:datastr,dataType:"json",success:function(result){callback_func(result);dealy_hide_mode(1000);},error:function(xhr,status){dealy_hide_mode(1000);},complete:function(){const index=activeRequests.indexOf(xhr);if(index!==-1){activeRequests.splice(index,1);}}});activeRequests.push(xhr);renew_session();}
function change_lang(lang)
{var ubusparam=new Array("uci","set",{"config":"luci","section":"main","values":{"lang":lang}});var ubusparam2=new Array("uci","apply",{"rollback":false,"timeout":1});var jsonparam=[{"id":1,"params":ubusparam},{"id":2,"params":ubusparam2}];sk_auth_post(jsonparam,function(result){window.location.reload();});}
function s8(bytes,off){var n=bytes[off];return(n>0x7F)?(n-256)>>>0:n;}
function u16(bytes,off){return((bytes[off+1]<<8)+bytes[off])>>>0;}
function sfh(s){if(s===null||s.length===0)
return null;var bytes=[];for(var i=0;i<s.length;i++){var ch=s.charCodeAt(i);if(ch<=0x7F)
bytes.push(ch);else if(ch<=0x7FF)
bytes.push(((ch>>>6)&0x1F)|0xC0,(ch&0x3F)|0x80);else if(ch<=0xFFFF)
bytes.push(((ch>>>12)&0x0F)|0xE0,((ch>>>6)&0x3F)|0x80,(ch&0x3F)|0x80);else if(code<=0x10FFFF)
bytes.push(((ch>>>18)&0x07)|0xF0,((ch>>>12)&0x3F)|0x80,((ch>>6)&0x3F)|0x80,(ch&0x3F)|0x80);}
if(!bytes.length)
return null;var hash=(bytes.length>>>0),len=(bytes.length>>>2),off=0,tmp;while(len--){hash+=u16(bytes,off);tmp=((u16(bytes,off+2)<<11)^hash)>>>0;hash=((hash<<16)^tmp)>>>0;hash+=hash>>>11;off+=4;}
switch((bytes.length&3)>>>0){case 3:hash+=u16(bytes,off);hash=(hash^(hash<<16))>>>0;hash=(hash^(s8(bytes,off+2)<<18))>>>0;hash+=hash>>>11;break;case 2:hash+=u16(bytes,off);hash=(hash^(hash<<11))>>>0;hash+=hash>>>17;break;case 1:hash+=s8(bytes,off);hash=(hash^(hash<<10))>>>0;hash+=hash>>>1;break;}
hash=(hash^(hash<<3))>>>0;hash+=hash>>>5;hash=(hash^(hash<<4))>>>0;hash+=hash>>>17;hash=(hash^(hash<<25))>>>0;hash+=hash>>>6;return(0x100000000+hash).toString(16).substr(1);}
function trimws(s){return String(s).trim().replace(/[ \t\n]+/g,' ');}
function _(s,c){var k=(c!=null?trimws(c)+'\u0001':'')+trimws(s);return(langs[sfh(k)])||s;}
function loadScript(url){return new Promise((resolve,reject)=>{const script=document.createElement('script');script.type='text/javascript';script.src=url;script.onload=resolve;script.onerror=reject;document.head.appendChild(script);});}
function clearTimer()
{let endTid=setTimeout(function(){});for(let i=0;i<=endTid;i++){clearTimeout(i);clearInterval(i);}
activeRequests.forEach((request)=>{request.abort();});}
function removeScript(filename){const scripts=document.getElementsByTagName('script');for(let i=0;i<scripts.length;i++){if(scripts[i].src.indexOf(filename)==-1?false:true){scripts[i].parentNode.removeChild(scripts[i]);pageLoad=null;break;}}}
var oldpath=null;function load_bindfunc()
{$(".bi-password").unbind("click");$(".bi-password").on('click',function(e){if($(this).hasClass("bi-eye-slash-fill"))
{$(this).prev().attr("type","text");$(this).removeClass("bi-eye-slash-fill").addClass("bi-eye-fill");}
else
{$(this).prev().attr("type","password");$(this).removeClass("bi-eye-fill").addClass("bi-eye-slash-fill");}});$(".skform-hideshow").unbind("click");$(".skform-hideshow").on('click',function(e){if($(this).next().is(':hidden'))
{$(this).next().slideDown(300);if($(this).find("i").hasClass("bi-chevron-down"))
$(this).find("i").removeClass("bi-chevron-down").addClass("bi-chevron-up");}
else
{$(this).next().slideUp(300);if($(this).find("i").hasClass("bi-chevron-up"))
$(this).find("i").removeClass("bi-chevron-up").addClass("bi-chevron-down");}});}
function generateRandomString(length){var characters='ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';var result='';for(var i=0;i<length;i++){var randomIndex=Math.floor(Math.random()*characters.length);result+=characters.charAt(randomIndex);}
return result;}
function delay_load_view_Function(param_reponse,param_status,param_view,param_randnum,delay){setTimeout(function(){if(param_status!="success")
{}
else
{var path=envcar.resource+"/view/skgwfpt/"+param_view;var jspath=path+".js?v="+param_randnum;var replacedText=param_reponse.replace(/{{(.*?)}}/g,(match,key)=>{return _(key.trim())||'';});$(".content-detail").html(replacedText);if(oldpath)
{var oldjspath=envcar.resource+"/view/skgwfpt/"+oldpath+".js";removeScript(oldpath);}
loadScript(jspath).then(()=>{var initfun="pageLoad";try{if(typeof(eval(initfun))=="function"){eval(initfun+"()");}}catch(e){console.log("no init function pageLoad");}
oldpath=param_view;}).catch((error)=>{console.error('Script loading failed:',error);});load_bindfunc();}},delay);renew_session();}
function loadView(view)
{var randnum=generateRandomString(10);var path=envcar.resource+"/view/skgwfpt/"+view;var htmlpath=path+".htm?v="+randnum;clearTimer();$(".content-detail").load(htmlpath,null,function(response,status,xhr){delay_load_view_Function(response,status,view,randnum,1);});}
function loading_show_data(data)
{$("body").append("<div class='backimg'></div>");var loaddiv=$("<div>");loaddiv.addClass("panel");loaddiv.addClass("loading");loaddiv.hide();var childdiv=$("<div>");childdiv.addClass("lds-dual-ring");loaddiv.append(childdiv);loaddiv.append("<p>"+data+"</p>");$("body").append(loaddiv);$(".loading").fadeIn(300);}
function loading_show()
{loading_show_data(_("Data is being saved..."));}
function hide_mode()
{$(".backimg").remove();$(".panel").fadeOut(300);$(".panel").remove();}
function dealy_hide_mode(time)
{setTimeout("hide_mode()",time);}
function warninfo_show(data)
{$("body").append("<div class='backimg'></div>");var warndiv=$("<div>");warndiv.addClass("panel");warndiv.addClass("warn");warndiv.hide();var childdiv=$("<div>");childdiv.attr("id","Sky_panel");childdiv.addClass("panel-waring");childdiv.append("<i class=\"bi-exclamation-triangle\"></i>");childdiv.append("<span>"+data+"</span>");warndiv.append(childdiv);warndiv.append("<span class=\"close\"><i class=\"bi-x\"></i></span>");$(".backimg").on('click',function(e){hide_mode();});$("body").append(warndiv);$(".close").on('click',function(e){hide_mode();});$(".warn").fadeIn(300);}
var weekjs=[{"name":"Mon","value":"Mon"},{"name":"Tue","value":"Tue"},{"name":"Wed","value":"Wed"},{"name":"Thur","value":"Thu"},{"name":"Fri","value":"Fri"},{"name":"Sat","value":"Sat"},{"name":"Sun","value":"Sun"}];function panel_show(data)
{$("body").append("<div class='backimg'></div>");var panneldiv=$("<div>");panneldiv.addClass("panel");if(data.width)
panneldiv.width(data.width);panneldiv.hide();var headerdiv=$("<div>");headerdiv.addClass("panel-header");headerdiv.append("<h3>"+data.tittle+"</h3>");panneldiv.append(headerdiv);var contdiv=$("<div>");contdiv.addClass("panel-content");$.each(data.panelContent,function(index,obj){var row="";if(obj.hide==1)
row+="<div class='skform-model-group' style='display:none;'>";else
row+="<div class='skform-model-group'>";row+="<label class='skform-model-tittle' for='"+obj.id+"'>"+obj.tittle+":</label>";if(obj.type=="text")
{if(obj.allowdempty)
row+="<input type='text' class='skform-model-control' data-type='"+obj.datatype+"' allowdempty='"+obj.allowdempty+"' value='"+obj.value+"' id='"+obj.id+"' name='"+obj.id+"'/>";else
row+="<input type='text' class='skform-model-control' data-type='"+obj.datatype+"' value='"+obj.value+"' id='"+obj.id+"' name='"+obj.id+"'/>";if(obj.datatype=="macaddr")
{row+="<b>(XX:XX:XX:XX:XX:XX)</b>";}}
else if(obj.type=="textrange")
{if(obj.allowdstartempty)
row+="<input type='text' class='skform-model-control skform-model-controlsmall' data-type='"+obj.datatype+"' allowdempty='"+obj.allowdstartempty+"' value='"+obj.value+"' id='"+obj.id+"start' name='"+obj.id+"start'/>";else
row+="<input type='text' class='skform-model-control skform-model-controlsmall' data-type='"+obj.datatype+"' value='"+obj.value+"' id='"+obj.id+"start' name='"+obj.id+"start'/>";row+="&nbsp;-&nbsp;";if(obj.allowdendempty)
row+="<input type='text' class='skform-model-control skform-model-controlsmall' data-type='"+obj.datatype+"' allowdempty='"+obj.allowdendempty+"' value='"+obj.value+"' id='"+obj.id+"end' name='"+obj.id+"end'/>";else
row+="<input type='text' class='skform-model-control skform-model-controlsmall' data-type='"+obj.datatype+"' value='"+obj.value+"' id='"+obj.id+"end' name='"+obj.id+"end'/>";}
else if(obj.type=="password")
{row+="<input type='password' class='skform-model-control' value='"+obj.value+"' id='"+obj.id+"' name='"+obj.id+"'/>"
+"<i class='bi bi-eye-slash-fill bi-password' style='position: unset'></i>";}
else if(obj.type=="select")
{if(obj.onchange)
row+="<select class='skform-model-control' value='"+obj.value+"' id='"+obj.id+"' onchange='"+obj.onchange+"(this)' name='"+obj.id+"'>";else
row+="<select class='skform-model-control' value='"+obj.value+"' id='"+obj.id+"' name='"+obj.id+"'>";$.each(obj.option,function(i,val){row+="<option value='"+val.value+"'>"+val.name+"</option>";});row+="</select>"}
else if(obj.type=="radio")
{row+="<div class='skform-model-content'><ul>";$.each(obj.option,function(i,val){row+="<li>";var optionid=val.id+i;if(i==0)
row+="<label class='skradio'><input type='radio' checked name='"+val.id+"' id='"+optionid+"' value='"+obj.value+"'  hidden=''><label for='"+optionid+"' class='skradio-label'></label></label>";else
row+="<label class='skradio'><input type='radio' name='"+val.id+"' id='"+optionid+"' value='"+obj.value+"' hidden=''><label for='"+optionid+"' class='skradio-label'></label></label>";row+="<label class='skradio-text' for='"+optionid+"'>"+val.label+"</label></li>";});row+="</ul></div>"}
else if(obj.type=="switch")
{row+="<div style='display:inline-block;'><label class='switch-slide' style='position: relative;top: 1px;'>";if(obj.checked==1)
{if(obj.onclick)
row+=" <input name='"+obj.id+"' id='"+obj.id+"' type='checkbox' onclick='"+obj.onclick+"(this)' checked >";else
row+=" <input name='"+obj.id+"' id='"+obj.id+"' type='checkbox' checked >";}
else
{if(obj.onclick)
row+=" <input name='"+obj.id+"' id='"+obj.id+"' type='checkbox' onclick='"+obj.onclick+"(this)' >";else
row+=" <input name='"+obj.id+"' id='"+obj.id+"' type='checkbox' >";}
row+="<label for='"+obj.id+"' class='switch-slide-label'></label> </label></div>";}
else if(obj.type=="time")
{row+="<select class='skform-model-control' style='width: 60px;padding: 2px;' value='' id='"+obj.id+"hour' name='"+obj.id+"hour'>";for(var i=0;i<24;i++)
{var hourshow;if(i<10)
hourshow="0"+i;else
hourshow=i;row+="<option value='"+i+"'>"+hourshow+"</option>";}
row+="</select>&nbsp;:&nbsp;";row+="<select class='skform-model-control' style='width: 60px;padding: 2px;' value='' id='"+obj.id+"min' name='"+obj.id+"min'>";for(var i=0;i<60;i++)
{var minshow;if(i<10)
minshow="0"+i;else
minshow=i;row+="<option value='"+i+"'>"+minshow+"</option>";}
row+="</select>";}
else if(obj.type=="timerange")
{row+="<select class='skform-model-control' style='width: 43px;padding: 4px 0px;' value='' id='"+obj.id+"starthour' name='"+obj.id+"starthour'>";for(var i=0;i<24;i++)
{var hourshow;if(i<10)
hourshow="0"+i;else
hourshow=i;row+="<option value='"+i+"'>"+hourshow+"</option>";}
row+="</select>&nbsp;:&nbsp;";row+="<select class='skform-model-control' style='width: 43px;padding: 4px 0px;' value='' id='"+obj.id+"startmin' name='"+obj.id+"startmin'>";for(var i=0;i<60;i++)
{var minshow;if(i<10)
minshow="0"+i;else
minshow=i;row+="<option value='"+i+"'>"+minshow+"</option>";}
row+="</select>&nbsp;to&nbsp;";row+="<select class='skform-model-control' style='width: 43px;padding: 4px 0px;' value='' id='"+obj.id+"endhour' name='"+obj.id+"endhour'>";for(var i=0;i<24;i++)
{var hourshow;if(i<10)
hourshow="0"+i;else
hourshow=i;row+="<option value='"+i+"'>"+hourshow+"</option>";}
row+="</select>&nbsp;:&nbsp;";row+="<select class='skform-model-control' style='width: 43px;padding: 4px 0px;' value='' id='"+obj.id+"endmin' name='"+obj.id+"endmin'>";for(var i=0;i<60;i++)
{var minshow;if(i<10)
minshow="0"+i;else
minshow=i;row+="<option value='"+i+"'>"+minshow+"</option>";}
row+="</select>";}
else if(obj.type=="week")
{for(var i=0;i<7;i++)
{row+="<input type='checkbox' name='"+obj.id+weekjs[i].name+"' class='region' id='"+obj.id+weekjs[i].name+"' hidden /><label for='"+obj.id+weekjs[i].name+"' id='"+obj.id+weekjs[i].name+"_btn'><span>"+weekjs[i].value+"</span></label>";}}
row+="</div>";contdiv.append(row);});panneldiv.append(contdiv);var footerdiv=$("<div>");footerdiv.addClass("panel-footer");footerdiv.append("<input type=\"button\" class=\"sk-btn-model-apply\" id=\"panelSave_btn\" value=\""+_("Save & Apply")+"\" onclick=\"\">");panneldiv.append(footerdiv);panneldiv.append("<span class=\"close\"><i class=\"bi-x\"></i></span>");panneldiv.find(".bi-password").on('click',function(e){if($(this).hasClass("bi-eye-slash-fill"))
{$(this).prev().attr("type","text");$(this).removeClass("bi-eye-slash-fill").addClass("bi-eye-fill");}
else
{$(this).prev().attr("type","password");$(this).removeClass("bi-eye-fill").addClass("bi-eye-slash-fill");}});panneldiv.find(".close").on('click',function(e){hide_mode();});footerdiv.find(".sk-btn-model-apply").on("click",function(){var skchecked=0;contdiv.find(".skform-model-control").each(function(i,item){if($(this).attr("data-checked")=="false"&&$(this).is(":visible"))
{if($(this).next().length>0)
{if($(this).next().prop("nodeName")!="INPUT")
$(this).next().remove();else if($(this).next().next().length>0)
$(this).next().next().remove();}
skchecked=1;if($(this).attr("data-type")=="ipv4"||$(this).attr("data-type")=="ipv6")
$(this).parent().append("<span>Please enter the correct IP address!</span>");else if($(this).attr("data-type")=="macaddr")
$(this).parent().append("<span>Please enter the correct MAC address!</span>");else
$(this).parent().append("<span>Please enter the correct "+$(this).prev().html()+"!</span>");return false;}
if($(this).is(":visible")&&$(this).attr("allowdempty")!="1"&&($(this).attr("type")=="text"||$(this).attr("type")=="password")&&!$(this).val())
{if($(this).next().length>0)
{if($(this).next().prop("nodeName")!="INPUT")
$(this).next().remove();else if($(this).next().next().length>0)
$(this).next().next().remove();}
skchecked=1;if($(this).attr("data-type")=="ipv4"||$(this).attr("data-type")=="ipv6")
$(this).parent().append("<span>IP address cannot be empty!</span>");else if($(this).attr("data-type")=="macaddr")
$(this).parent().append("<span>MAC address cannot be empty!</span>");else
{$(this).parent().append("<span>"+$(this).prev().html()+" cannot be empty!</span>");}
$(this).attr({"style":"border-color:red"});return false;}});if(skchecked==0)
eval(data.submit+"();");});contdiv.find(".skform-model-control").each(function(i,item){if($(this).attr("data-type")=="ipv4")
{$(this).on('keyup',function(e){if(isValidIpAddress($(this).val())==false)
$(this).attr({"data-checked":false,"style":"border-color:red"});else
{$(this).attr({"data-checked":true,"style":""});}})}
else if($(this).attr("data-type")=="ipv6")
{$(this).on('keyup',function(e){if(isValidIpv6Address($(this).val())==false)
$(this).attr({"data-checked":false,"style":"border-color:red"});else
{$(this).attr({"data-checked":true,"style":""});}})}
else if($(this).attr("data-type")=="username")
{$(this).on('keyup',function(e){if(isValidName($(this).val())==false)
$(this).attr({"data-checked":false,"style":"border-color:red"});else
{$(this).attr({"data-checked":true,"style":""});}})}
else if($(this).attr("data-type")=="macaddr")
{$(this).on('keyup',function(e){if(isValidMacAddress($(this).val())==false)
$(this).attr({"data-checked":false,"style":"border-color:red"});else
{$(this).attr({"data-checked":true,"style":""});}})}
else if($(this).attr("data-type")=="prefix")
{$(this).on('keyup',function(e){if(isValidPrefixLength($(this).val())==false)
$(this).attr({"data-checked":false,"style":"border-color:red"});else
{$(this).attr({"data-checked":true,"style":""});}})}
else if($(this).attr("data-type")=="Metric")
{$(this).on('keyup',function(e){if(isValidMetric($(this).val())==false)
$(this).attr({"data-checked":false,"style":"border-color:red"});else
{$(this).attr({"data-checked":true,"style":""});}})}});$("body").append(panneldiv);panneldiv.fadeIn(300);}
function daillog_show(data)
{$("body").append("<div class='backimg'></div>");var daildiv=$("<div>");daildiv.addClass("panel");daildiv.addClass("dialog");daildiv.hide();var childdiv=$("<div>");childdiv.attr("id","Sky_panel");childdiv.addClass("panel-dialog");childdiv.append("<i class=\"bi-question-circle\"></i>");childdiv.append("<span>"+data.info+"</span>");daildiv.append(childdiv);var footdiv=$("<div>");footdiv.addClass("panel-footer");footdiv.append("<input type=\"button\" class=\"sk-btn-model-confirm\" style=\"margin-right:12px;\" value=\"Confirm\" onclick=\""+data.submit+"();\">");footdiv.append("<input type=\"button\" class=\"sk-btn-model-cancel\" value=\"Cancel\" onclick=\"hide_mode();\">");daildiv.append(footdiv);$(".dialog .panel-footer .sk-btn-model-cancel").on("click",function(){if(data.ifcancel=="1")
{eval(data.cancelfunc+"();");}
else
hide_mode();});$("body").append(daildiv);$(".dialog").fadeIn(300);}
function ping_gateway()
{var wanparam=new Array("rtweb.devinfo","get",{});var jsonparam={"id":1,"params":wanparam};sk_auth_post(jsonparam,function(result){if(result.error&&result.error.message=="Object not found")
{setTimeout("ping_gateway()",3000);}
else
{window.location.href='app.html';}},function(){setTimeout("ping_gateway()",3000);});}
function getAesString(data,key,iv)
{var key=CryptoJS.enc.Utf8.parse(key);var iv=CryptoJS.enc.Utf8.parse(iv);var encrypted=CryptoJS.AES.encrypt(data,key,{iv:iv,mode:CryptoJS.mode.CBC,padding:CryptoJS.pad.Pkcs7});return encrypted.toString();}
function getAES(data)
{var iv='0000000000000000';var encrypted=getAesString(data,ifkey,iv);var encrypted1=CryptoJS.enc.Utf8.parse(encrypted);return encrypted;}