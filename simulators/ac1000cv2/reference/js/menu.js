function getTopContext() {
	try {
		if (window.top && window.top.MainMenu) return window.top;
		if (window.parent && window.parent.MainMenu) return window.parent;
	} catch(e) {}
	if (window.MainMenu) return window;
	return (window.top || window);
}

if (!window.MainMenu && !(window.top && window.top.MainMenu)) {
	try {
		$.ajax({
			url: 'script/rg_menu.js',
			async: false,
			dataType: 'script'
		});
	} catch(e) {}
}

function WebCreatMenu()
{
	var _ctx = getTopContext();
	var curMatch = window.location.pathname.match(/([^/]+)\.html/);
	var curPageName = curMatch ? curMatch[1] : 'devinfo';

	if (!_ctx.CurSubMenu || _ctx.CurSubMenu === 'undefined') {
		_ctx.CurSubMenu = curPageName;
	}

	if (_ctx.MainMenu && (_ctx.CurMainMenu === undefined || _ctx.CurMainMenu === 0)) {
		$.each(_ctx.MainMenu, function(mi, mv) {
			if (mv.submenu) {
				$.each(mv.submenu, function(si, sv) {
					if (sv.id === curPageName) {
						_ctx.CurMainMenu = mi;
						return false;
					}
					if (sv.submenu) {
						for (var k = 0; k < sv.submenu.length; k++) {
							if (sv.submenu[k].id === curPageName) {
								_ctx.CurMainMenu = mi;
								return false;
							}
						}
					}
				});
			}
		});
	}

	var main_menu = $("#main_menu");
	var TotalMenuNumber = 0;
	var CurMenuNumber = 0;
	var menuList = _ctx.MainMenu || [];

	$.each(menuList, function(mi, mv) {
	    if (_ctx.XHas80211acWifi && (mv.id.match("wifi5") != null)) {
	        mv.show = 7;
		}

		// disable the menu if slot do not defined
	    if ((0 == _ctx.num_5g_wifi) && (0 == _ctx.num_wifi) && 
			(mv.id.match("m1_wireless") != null)) {
	        mv.show = 0;
        }
	    if ((0 == _ctx.WebPotsNumber) && (mv.id.match("m1_voip") != null)) {
	        mv.show = 0;
        }
	    
		if (mv.show > 0) {
			TotalMenuNumber++;
		}
		var userLevel = _ctx.XCurrentUser !== undefined ? _ctx.XCurrentUser : 2;
		if ((mv.show & userLevel) != 0) {
			var page = (mv.submenu && mv.submenu[0]) ? mv.submenu[0].id : "devinfo";
			var cls = "";
			CurMenuNumber++;
			if (mv.submenu && mv.submenu[0] && mv.submenu[0].submenu)
			{
				page = mv.submenu[0].submenu[0].id;
			}
			if (mi == (_ctx.CurMainMenu || 0))
			{
				cls = "selected";
			}
			var title = mv.id;
			try { title = eval('MenuString.' + mv.id) || mv.id; } catch(e) {}
			main_menu.append("<li id='mm" + mi + "' class=" + mv.id + "><a href='" + page + ".html' class='" + cls +"'><span>" + title + "</span></a></li>");
		}
	});

	var firstLink = $("#mm0 a");
	var MenuAWidth = firstLink.length ? parseInt(firstLink.css("width")) : 80;
	if (isNaN(MenuAWidth) || MenuAWidth <= 0) MenuAWidth = 80;
	var MenuWidth = MenuAWidth * CurMenuNumber;
	var leftPad = parseInt(main_menu.css("padding-left")) || 0;
	var MenuPadding = leftPad + (MenuAWidth/2) * (TotalMenuNumber - CurMenuNumber);
	if (!isNaN(MenuWidth) && MenuWidth > 0) main_menu.css("width", MenuWidth);
	if (!isNaN(MenuPadding) && MenuPadding > 0) {
		main_menu.css("padding-left", MenuPadding);
		main_menu.css("padding-right", MenuPadding);
	}

	main_menu.children("li").click(function(e) {
		var id = e.currentTarget.id;
		var idx = parseInt(id.substring(2, id.length));
		_ctx.CurMainMenu = idx;
		if (window.top) window.top.CurMainMenu = idx;
		var mv = menuList[idx];
		if (mv && mv.submenu) {
			if (!mv.submenu[0].submenu) {
				_ctx.CurSubMenu = mv.submenu[0].id;
				if (window.top) window.top.CurSubMenu = mv.submenu[0].id;
			} else {
				_ctx.CurSubMenu = mv.submenu[0].submenu[0].id;
				if (window.top) window.top.CurSubMenu = mv.submenu[0].submenu[0].id;
			}
		}
	});

	WebCreatSubMenu();
}
	
function WebCreatSubMenu()
{
	var _ctx = getTopContext();
	var sub_menu = $("#sub_menu");
	var curMainIdx = _ctx.CurMainMenu !== undefined ? _ctx.CurMainMenu : 0;
	var menuList = _ctx.MainMenu || [];
	var cm = menuList[curMainIdx];
	if (!cm || !cm.submenu) return;

	$.each(cm.submenu, function(si, sv) {
	    if (_ctx.XHas80211acWifi && (sv.id.match("wifi5") != null)) {
	        sv.show = 7;
		}

		if ((sv.id.match("wifi5") != null) && (0 == _ctx.num_5g_wifi)) {
			sv.show = 0;
		}
		if ((sv.id.match("wifi") != null) && (0 == _ctx.num_wifi)) {
			sv.show = 0;
		}
		if ((sv.id.match("wifi5info") != null) && (0 == _ctx.num_5g_wifi)) {
			sv.show = 0;
		}
		if ((sv.id.match("wifiinfo") != null) && (0 == _ctx.num_wifi)) {
			sv.show = 0;
		}
		if ((sv.id.match("usb") != null) && (0 == _ctx.num_usb)) {
			sv.show = 0;
		}
         
		var userLevel = _ctx.XCurrentUser !== undefined ? _ctx.XCurrentUser : 2;
 		if ((sv.show & userLevel) != 0) {
			var page = sv.id;
			var cls = "";
			if (sv.submenu)
			{
				page = sv.submenu[0].id;
			}
			if (page == _ctx.CurSubMenu)
			{
				cls = "selected";
			}
			
			var title = sv.id;
			try { title = eval('MenuString.' + sv.id) || sv.id; } catch(e) {}
			sub_menu.append("<li id='" + sv.id + "'><a href='" + page + ".html' class='" + cls +"'>" + title + "</a></li>");
			if (sv.submenu)
			{
				$("#"+sv.id).append("<ul></ul>");
				$.each(sv.submenu, function(ssi, ssv) {
					cls = "";
					if (ssv.id == _ctx.CurSubMenu)
					{
						cls = "selected";
						$("#"+sv.id+" a:first").addClass("selected");
					}
            	    if (_ctx.XHas80211acWifi && (ssv.id.match("wifi5") != null)) {
            	        ssv.show = 7;
                    }
					if ((ssv.id.match("usbstr") != null) && (0 == _ctx.num_usb)) {
						ssv.show = 0;
					}
					if ((ssv.id.match("usbprinter") != null) && (0 == _ctx.num_usb)) {
						ssv.show = 0;
					}
					if ((ssv.id.match("wifiwps") != null) && (0 == _ctx.num_5g_wifi)) {
						ssv.show = 0;
					}
					if ((ssv.show & userLevel) != 0) {
						var stitle = ssv.id;
						try { stitle = eval('MenuString.' + ssv.id) || ssv.id; } catch(e) {}
						$("#"+sv.id+" ul").append("<li id='" + ssv.id + "'><a href='" + ssv.id + ".html' class='" + cls +"'>" + stitle + "</a></li>");
					}
				});
			}
		}
	});
	
	sub_menu.addClass("sub_menu");
	sub_menu.children("li:last-child").addClass("last_li");

	sub_menu.find("a").click(function(e) {
		var subId = e.currentTarget.href.replace(/(.*\/){0,}([^.]+).*/ig, "$2");
		_ctx.CurSubMenu = subId;
		if (window.top) window.top.CurSubMenu = subId;
	});

	var content_title = $("#content_title");
	var title = "";
	var desc = "";
	try { title = eval('MenuString.' + _ctx.CurSubMenu) || ""; } catch(e) {}
	try { desc = eval('DescString.' + _ctx.CurSubMenu) || ""; } catch(e) {}
	content_title.html(title);
	if (desc && desc.length > 0)
	{
		content_title.append(" <span>" + desc + "</span>");
	}
}
