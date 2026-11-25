#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
Nap trang GOC tu reference/source/ va thay gia tri mac dinh bang gia tri
lay tu config_store. GIU NGUYEN toan bo phan con lai.

NGUYEN TAC (CLAUDE.md 2.2) — chi duoc thay GIA TRI, tuyet doi khong dung toi:
  - cau truc DOM va thu tu phan tu
  - thuoc tinh name / id cua moi input, select, checkbox
  - ten ham JavaScript va ten bien toan cuc
  - the <script>, noi dung CSS/JS goc
  - duong dan, query string

Cach thay:
  1. Bien JS nhung trong trang:  var aryLanDhcp = [...]  ->  thay ve phai
  2. Thuoc tinh cua the input:   value="..." / checked / option selected

Trang nao chua co trong config.json thi tra NGUYEN BAN goc — khong bien doi.
"""
import json, os, re, sys

BASE = os.path.dirname(os.path.abspath(__file__))
SOURCE = os.path.normpath(os.path.join(BASE, "..", "reference", "source"))

import vg_config_store as config_store


def _kho():
    return sys.modules.get("vg_config_store", config_store)

_SOURCE_RAW_CACHE = {}
_SOURCE_EXISTS_CACHE = {}


# ------------------------------------------------------ tuong thich khung iframe
# KHONG PHAI thay GIA TRI (nguyen tac 2.2 o tren khong ap dung o day): day la loi
# moi trong scaffolding frame cua CHINH DU AN, khong phai loi cua thiet bi that.
#
# Tren router that, index.htm (frameset chua header/menu/act_sta/main) LUON LA
# cua so top cung cua trinh duyet, nen firmware viet `top.xxx` de "voi" toi cac
# bien toan cuc no khai bao (webcfg, act_sta, ACTION_STATUS...) — dung tren may
# that vi o do top === index.htm. O day, index.htm lai bi nhung THEM 1 lop
# <iframe> trong portal.html, nen `top` khong con la index.htm nua ma la
# portal.html (khong co cac bien nay) -> moi trang goi top.act_sta.damage_alert()
# deu nem TypeError ngay dong dau, lam crash toan bo script phia sau (bao gom ca
# doan hien cac khoi UI an cho JS, vd tab IPv4 cua Bandwidth Limit).
#
# Sua bang cach doi `top.` thanh `parent.` CHI cho dung tap ten bien nay — day
# la nhung ten CHAC CHAN thuoc ve index.htm (frame cha, luon dung du co bi nhung
# them iframe hay khong), khong phai gia tri cau hinh cua thiet bi nen khong vi
# pham nguyen tac "khong bia dat gia tri". Xem ISSUES.md muc [2026-xx-xx].
_VIGOR_TOP_TOKENS = (
    r'act_sta|webcfg|ACTION_STATUS|iActionStatusFlag|iFwUpgradeState|'
    r'gettext|angular|myApp|locale|authStr|notSupportWAN|idxperpage|idxperpages|'
    r'main|menu|printLogo|tab|diagAnalyze|location|showElmtByClass|hideElmtByClass|'
    r'showElmtById|hideElmtById|header|ifolderDelStop|ifolderDelStart|'
    r'ifolderStaRefreshEnd|advShow|signState|rootca_idx|fimage|certTitle|cert_name|'
    r'certidx|CAidx|setVle2Elmt|getVleFromElmt|cvmRestore|cpntCtrl|bHelpNote|'
    r'SHOW_MESH_NODE|SHOW_SYS_ADMIN|SHOW_WIZ_LOGOUT|writeNote|hasIllegalInputs|'
    r'isVR9Prj|isGeminiPrj|onclkIcon|sender|ctrl|document'
)
_TOP_VE_PARENT = re.compile(r'\b(?:window\.)?top\.(' + _VIGOR_TOP_TOKENS + r')\b')
_OPENER2_TOP_RE = re.compile(r'\bopener\.opener\.top\b')
_OPENER_TOP_RE = re.compile(r'\bopener\.top\b')
_BARE_TOP_VAR_RE = re.compile(r'(\b(?:(?:var|const|let)\s+)?(?:bg|tp|tmp2)\s*=\s*)(?:window\.)?top\b(?![.\w:])')
_BARE_TOP_TERN_RE = re.compile(r'((?:opener\s*\?\s*[^:;]+|\?\s*[^:;]+)\s*:\s*)(?:window\.)?top\b(?![.\w:])')
_SCRIPT_SPAN_RE = re.compile(r'(<script\b[^>]*>)(.*?)(</script>)', re.S | re.I)
_TEXTAREA_SPAN_RE = re.compile(r'(<textarea\b[^>]*>)(.*?)(</textarea>)', re.S | re.I)
_UNQUOTED_TOP_ATTR_RE = re.compile(r'(\bng-[a-z-]+\s*=\s*)(?:window\.)?top\.(' + _VIGOR_TOP_TOKENS + r')\b')

_VGROOT_EXPR = '(window.__vgRoot?window.__vgRoot():parent)'

_VG_IFRAME_STYLE = (
    '<style data-vg-responsive="1">'
    'html,body{max-width:100%;box-sizing:border-box}'
    '@media(max-width:960px){body{overflow-x:auto!important}'
    'table[width],form>table{max-width:100%!important;height:auto}}'
    '</style>'
)

_VG_IFRAME_SCRIPT = (
    '<script data-vg-shim="1">'
    '(function(){if(window.__vgRoot)return;'
    'window.__vgRoot=function(w){try{var cur=w||window;for(var i=0;i<8;i++){'
    'if(cur.__vgIsIndex||(typeof cur.authStr!=="undefined"&&typeof cur.printLogo==="function"))return cur;'
    'if(!cur.parent||cur.parent===cur)break;cur=cur.parent;}}catch(e){}'
    'try{if(w&&w.parent&&w.parent!==w)return w.parent;}catch(e){}return (window.parent&&window.parent!==window)?window.parent:window;};'
    'window.__vgPrefix=(function(){try{var cur=window;for(var i=0;i<8;i++){'
    'var p="";try{p=cur.location&&cur.location.pathname||"";}catch(e){}'
    r'var m=p.match(/^(\/sim_vigor2927)(?:\/|$)/);if(m)return m[1];'
    'if(!cur.parent||cur.parent===cur)break;cur=cur.parent;}}catch(e){}return "";})();'
    'window.__vgUrl=function(u){if(typeof u!=="string"||!window.__vgPrefix)return u;'
    'if(u.indexOf("/")===0&&u.indexOf("//")!==0&&u.indexOf(window.__vgPrefix+"/")!==0&&u!==window.__vgPrefix)return window.__vgPrefix+u;'
    'return u;};'
    'var pfx=window.__vgPrefix;'
    'if(pfx){'
    'try{if(window.XMLHttpRequest&&!XMLHttpRequest.prototype.__vgPatched){'
    'var xo=XMLHttpRequest.prototype.open;XMLHttpRequest.prototype.open=function(m,u){'
    'var args=Array.prototype.slice.call(arguments);if(typeof args[1]==="string")args[1]=window.__vgUrl(args[1]);'
    'return xo.apply(this,args);};XMLHttpRequest.prototype.__vgPatched=true;}}catch(e){}'
    'try{if(window.fetch&&!window.fetch.__vgPatched){'
    'var wf=window.fetch;window.fetch=function(u,init){if(typeof u==="string")u=window.__vgUrl(u);return wf.call(window,u,init);};'
    'window.fetch.__vgPatched=true;}}catch(e){}'
    'try{var wo=window.open;window.open=function(u,n,f){if(typeof u==="string")u=window.__vgUrl(u);return wo.call(window,u,n,f);};}catch(e){}'
    'document.addEventListener("submit",function(ev){var fm=ev.target;if(!fm||!fm.getAttribute)return;'
    'var act=fm.getAttribute("action")||"";if(act.indexOf("/")===0&&act.indexOf(pfx+"/")!==0)fm.setAttribute("action",window.__vgUrl(act));},true);'
    'document.addEventListener("click",function(ev){var a=ev.target&&ev.target.closest?ev.target.closest("a[href]"):null;'
    'if(!a)return;var hr=a.getAttribute("href")||"";if(hr.indexOf("/")===0&&hr.indexOf("//")!==0&&hr.indexOf(pfx+"/")!==0)a.setAttribute("href",window.__vgUrl(hr));},true);'
    '}'
    '})();'
    '</script>'
)


def _rewrite_vigor_js(js):
    js = _OPENER2_TOP_RE.sub('(window.__vgRoot?window.__vgRoot(opener&&opener.opener):opener.opener.parent)', js)
    js = _OPENER_TOP_RE.sub('(window.__vgRoot?window.__vgRoot(opener):opener.parent)', js)
    js = _TOP_VE_PARENT.sub(_VGROOT_EXPR + r'.\1', js)
    js = js.replace('.menu.lastClickedFolder', '.menu?.lastClickedFolder')
    js = _BARE_TOP_VAR_RE.sub(r'\1' + _VGROOT_EXPR, js)
    js = _BARE_TOP_TERN_RE.sub(r'\1' + _VGROOT_EXPR, js)
    return js


def sua_top_thanh_parent(s, is_js=False):
    """Doi cac bien scaffolding frame Vigor tu top -> __vgRoot()/parent de chay an toan trong iframe."""
    if is_js:
        return _rewrite_vigor_js(s)
    s = _SCRIPT_SPAN_RE.sub(lambda m: m.group(1) + _rewrite_vigor_js(m.group(2)) + m.group(3), s)
    s = _TEXTAREA_SPAN_RE.sub(lambda m: m.group(1) + _rewrite_vigor_js(m.group(2)) + m.group(3), s)
    s = _UNQUOTED_TOP_ATTR_RE.sub(r'\1parent.\2', s)
    return _TOP_VE_PARENT.sub(_VGROOT_EXPR + r'.\1', s)


def inject_iframe_shim(html, is_index=False):
    """Chen helper __vgRoot/__vgPrefix/__vgUrl va responsive CSS vao trang HTML Vigor."""
    if "window.__vgRoot" in html:
        return html
    if is_index:
        shim = (
            '<script>window.__vgIsIndex=true;</script>'
            + _VG_IFRAME_SCRIPT
            + '<script>(function(){function fitFs(){try{if(window.innerWidth>0&&window.innerWidth<1020){var fs=document.getElementsByTagName("frameset");if(fs.length>1&&fs[1].cols&&fs[1].cols.indexOf("214,")===0)fs[1].cols="184,*,0,0";}}catch(e){}}'
            + 'if(document.readyState==="loading")document.addEventListener("DOMContentLoaded",fitFs);else fitFs();'
            + 'window.addEventListener("resize",fitFs);})();</script>'
        )
    else:
        shim = _VG_IFRAME_STYLE + _VG_IFRAME_SCRIPT
    m_head = re.search(r'<head\b[^>]*>', html, re.I)
    if m_head:
        idx = m_head.end()
        return html[:idx] + shim + html[idx:]
    m_html = re.search(r'<html\b[^>]*>', html, re.I)
    if m_html:
        idx = m_html.end()
        return html[:idx] + '<head>' + shim + '</head>' + html[idx:]
    return shim + html


_RE_GETSTROBJ = re.compile(r'function getStrObj\(\)\{.*?\$http\.post\(.*?\n?.*?\}\);?\}')


def sua_getStrObj(s):
    """Triet tieu getStrObj() polling fid=4048 trong cac trang DrayTek (p2_188, p2_103, v.v.).
    Trang goc DrayTek goi de quy $http.post('/cgi-bin/v2x00.cgi', data) lay Object String;
    khi gap trang loi no se roi vao vong lap vo tan gay tran HTTP requests va spam log."""
    if "function getStrObj()" in s:
        s = _RE_GETSTROBJ.sub(
            "function getStrObj(){status=-1;if(typeof sCommentIdx!=='undefined'&&sCommentIdx!=0&&typeof aryObjStr!=='undefined'&&aryObjStr[sCommentIdx-1]){$scope.comment=aryObjStr[sCommentIdx-1];}else if(typeof $scope!=='undefined'){$scope.comment='';}}",
            s
        )
    return s


# ------------------------------------------------------ bat tab IPv6 (Vigor2927)
# KHONG PHAI bia dat: phan HTML/JS cho tab IPv6 (Enable/Disable, Default Limit,
# Limitation List... rieng cho IPv6) da CO SAN nguyen ven trong chinh trang goc
# (vd doc/ipbandw.htm co du <div id=page2> cho IPv6), chi bi an boi co `ng-show`
# doc theo bien `bDrayIpv6`. Bien nay do CGI that dien "0"/"1" tuy tinh trang
# IPv6 tren WAN LUC CHUP — toan bo 12 file HAR (moi buoi crawl) deu ghi nhan la
# "0" (thiet bi that dung de crawl chua bao gio bat IPv6 luc thu thap), NHUNG
# ban DOM cu hon (_pages/page_081.html, cung chinh trang Bandwidth Limit nay)
# lai co "1" — tuc la CHINH thiet bi that nay, o mot lan bat IPv6, da tung tra
# ve tab IPv6 hoat dong that. Theo yeu cau anh Huynn (2026-xx-xx): bat cung
# "1" de hien tab IPv6 cho muc dich dao tao, khong doi cau truc/HTML nao ca.
_BAT_TAB_IPV6 = re.compile(r"\bbDrayIpv6\s*=\s*parseInt\('0'\)")


def bat_tab_ipv6(s):
    """Doi bDrayIpv6=parseInt('0') -> parseInt('1') de luon hien tab IPv6."""
    return _BAT_TAB_IPV6.sub("bDrayIpv6=parseInt('1')", s)


def sua_ipbandw_add(s):
    """Trong doc/ipbandw.htm:
    1. Khai bao webcfg fallback an toan de tranh ReferenceError lam crash toan bo initParameter va bang Limitation List.
    2. Khi click nut Add, neu o TX/RX bi trong thi tu dong bu gia tri DefTx/DefRx.
    3. Khi click nut Add, danh dau co _ftcHasClickedAdd.
    4. Khi click nut OK (Luu cau hinh), neu nguoi dung da nhap dai IP Each ma chua bam Add,
       tu dong goi onClkBtnAdd(0) de xuat 1 dong vao bang Limitation List va luu vao form.
    5. Dong bo co _ftcIsSaved khi bam OK va khi load lai trang da co dong cau hinh.
    6. Bo tro cleardatatable tranh crash khi table chua duoc khoi tao.
    """
    target_head = "var bg=parent;var f=document.frm1;"
    replace_head = (
        "var bg=parent;var f=document.frm1;"
        "var webcfg=(typeof parent!=='undefined'&&parent.webcfg)?parent.webcfg:{adminauth:1,privilege:15,isBT498:0};"
        "window.webcfg=webcfg;"
    )
    if target_head in s:
        s = s.replace(target_head, replace_head, 1)

    old_clear = "function cleardatatable(typeCode){if(typeCode==1){custlstTable1.destroy();"
    new_clear = (
        "function cleardatatable(typeCode){"
        "if(typeCode==1){if(custlstTable1&&custlstTable1.destroy){try{custlstTable1.destroy();}catch(e){}}custlstTable1=initCustlstTable(1,custlstTable1);}"
        "else if(typeCode==0){if(custlstTable0&&custlstTable0.destroy){try{custlstTable0.destroy();}catch(e){}}custlstTable0=initCustlstTable(0,custlstTable0);}"
        "else if(typeCode==2){if(custlstTable2&&custlstTable2.destroy){try{custlstTable2.destroy();}catch(e){}}custlstTable2=initCustlstTable(2,custlstTable2);}"
        "}"
        "function _unused_old_cleardatatable(typeCode){if(typeCode==1){custlstTable1.destroy();"
    )
    if old_clear in s:
        s = s.replace(old_clear, new_clear, 1)

    old_txrx = "var bw_tx=parseInt(f.sIpBandwTx.value)+parseInt((bg.getVleFromElmt(f.iProfTx,0)==0)?0:0x8000);"
    new_txrx = (
        "if(typeCode==0){"
        "if(!f.sIpBandwTx.value||isNaN(parseInt(f.sIpBandwTx.value))){f.sIpBandwTx.value=(f.sIpBandwDefTx&&f.sIpBandwDefTx.value)?f.sIpBandwDefTx.value:'20';}"
        "if(!f.sIpBandwRx.value||isNaN(parseInt(f.sIpBandwRx.value))){f.sIpBandwRx.value=(f.sIpBandwDefRx&&f.sIpBandwDefRx.value)?f.sIpBandwDefRx.value:'25';}"
        "}"
        "var bw_tx=parseInt(f.sIpBandwTx.value)+parseInt((bg.getVleFromElmt(f.iProfTx,0)==0)?0:0x8000);"
    )
    if old_txrx in s:
        s = s.replace(old_txrx, new_txrx, 1)

    old_add = "clrTempInput(typeCode);sortTableList(typeCode);showOnSltIpBandwList(typeCode);"
    new_add = (
        "clrTempInput(typeCode);sortTableList(typeCode);showOnSltIpBandwList(typeCode);"
        "document._ftcHasClickedAdd=true;window._ftcHasClickedAdd=true;"
        "try{if(parent){parent._ftcHasClickedAdd=true;parent._ftcHasClickedAdd_vg2927=true;}if(top){top._ftcHasClickedAdd=true;top._ftcHasClickedAdd_vg2927=true;}}catch(e){}"
    )
    if old_add in s:
        s = s.replace(old_add, new_add)

    old_start_ok = "function onClkBtnOk(){var enable=bg.getVleFromElmt(f.sIpBandwEnable[0]);"
    new_start_ok = (
        "function onClkBtnOk(){"
        "try{"
        "var _hasEntry=false;"
        "if(typeof aryIpBandw!=='undefined'&&aryIpBandw&&aryIpBandw.length){"
        "for(var _k=0;_k<aryIpBandw.length;_k++){"
        "if(aryIpBandw[_k]&&(aryIpBandw[_k][0]||aryIpBandw[_k][1])){_hasEntry=true;break;}"
        "}"
        "}"
        "if(!_hasEntry&&f.sIpBandwFrom&&f.sIpBandwFrom.value&&f.sIpBandwTo&&f.sIpBandwTo.value){"
        "onClkBtnAdd(0);"
        "}"
        "}catch(e){}"
        "var enable=bg.getVleFromElmt(f.sIpBandwEnable[0]);"
    )
    if old_start_ok in s:
        s = s.replace(old_start_ok, new_start_ok, 1)

    old_submit = "if(checkWebChange()){f.webchange.value='1';}f.submit();}"
    new_submit = (
        "if(checkWebChange()){f.webchange.value='1';}"
        "document._ftcIsSaved=true;window._ftcIsSaved=true;"
        "try{if(parent){parent._hasClickedSaveInGuide=true;parent._ftcIsSaved=true;}if(top){top._hasClickedSaveInGuide=true;top._ftcIsSaved=true;}}catch(e){}"
        "f.submit();}"
    )
    if old_submit in s:
        s = s.replace(old_submit, new_submit, 1)

    old_init = "{custlstTable2=initCustlstTable(2,custlstTable2);}showOnSltIpBandwList(0);"
    new_init = (
        "{custlstTable2=initCustlstTable(2,custlstTable2);}showOnSltIpBandwList(0);"
        "try{"
        "if(typeof aryIpBandw!=='undefined'&&aryIpBandw&&aryIpBandw.length){"
        "for(var _k=0;_k<aryIpBandw.length;_k++){"
        "if(aryIpBandw[_k]&&(aryIpBandw[_k][0]||aryIpBandw[_k][1])){"
        "document._ftcHasClickedAdd=true;window._ftcHasClickedAdd=true;"
        "document._ftcIsSaved=true;window._ftcIsSaved=true;"
        "try{if(parent){parent._ftcHasClickedAdd=true;parent._hasClickedSaveInGuide=true;parent._ftcIsSaved=true;}if(top){top._ftcHasClickedAdd=true;top._hasClickedSaveInGuide=true;top._ftcIsSaved=true;}}catch(e){}"
        "break;"
        "}"
        "}"
        "}"
        "}catch(e){}"
    )
    if old_init in s:
        s = s.replace(old_init, new_init, 1)

    return s


def sua_ipbmac_add(s):
    """Trong doc/ipbmac.htm: cho phep o IP Address nhan BAT KY dia chi IPv4
    DUNG DINH DANG khi bam Add/Update, khong con bi checkInput() goc chan boi
    3 dieu kien rang buoc theo LAN that: "khong thuoc Subnet LAN dang bat",
    "trung IP cua LAN" va "la dia chi Subnet/Broadcast". Muc dich dao tao: hoc
    vien co the nhap SAI IP roi van bam Add/OK duoc (se bi cham diem sai o buoc
    so sanh dap an, TACH BACH voi buoc nhap lieu nay), thay vi bi native alert
    chan ngay khong cho luu duoc vao IP Bind List. Van giu nguyen 2 kiem tra
    con lai cua checkInput(): dung dinh dang IPv4 (bg.isStrIp) va MAC bat buoc
    hop le (bg.isValidMac) — chi bo phan rang buoc theo dai LAN.
    Dong thoi bo sung id ho tro tooltip va dong bo co luu _ftcIsSaved.
    """
    old = ("function checkInput(ip1,mac1){if(!bg.isStrIp(ip1)){alert(errMSG[0]);return false;}"
           "for(var k=0;k<aryLanAlsEn.length;k++){if(aryLanAlsEn[k]==1&&bg.isEqualLan(aryLanAlsIp[k],aryLanAlsMsk[k],ip1))break;}"
           "if(k==aryLanAlsEn.length){alert(errMSG[1]);return false;}"
           "if(ip1==aryLanAlsIp[k]){alert(errMSG[2]);return false;}"
           "if(isSubnetOrBroadcastIp(aryLanAlsIp[k],aryLanAlsMsk[k],ip1)){alert(errMSG[3]);return false;}"
           "if(mac1==''){alert(errMSG[4]);return false;}"
           "if(!bg.isValidMac(mac1))return false;return true;}")
    new = ("function checkInput(ip1,mac1){if(!bg.isStrIp(ip1)){alert(errMSG[0]);return false;}"
           "if(mac1==''){alert(errMSG[4]);return false;}"
           "if(!bg.isValidMac(mac1))return false;return true;}")
    if old in s:
        s = s.replace(old, new, 1)

    # Them ID de tooltip tro dung phan tu
    s = s.replace('<b translate>Disable</b>', '<b id="lbl-ipbmac-disable" translate>Disable</b>', 1)
    if 'id="txt-ipbmac-ip"' not in s:
        s = s.replace('name=sIpAddress', 'id="txt-ipbmac-ip" name=sIpAddress', 1)
    if 'id="btn-ipbmac-ok"' not in s:
        s = s.replace('name=btnOk onClick=onClkBtnOk()', 'id="btn-ipbmac-ok" name=btnOk onClick=onClkBtnOk()', 1)

    # Luu co khi bam Add
    old_add = 'addToIpMacList(idx);clrTempInput();}'
    new_add = ('addToIpMacList(idx);clrTempInput();'
               'document._ftcHasClickedAdd=true;window._ftcHasClickedAdd=true;'
               'document._ftcLastAddIp=ip1;document._ftcLastAddMac=mac1;'
               'try{if(parent){parent._ftcHasClickedAdd=true;parent._ftcLastAddIp=ip1;parent._ftcLastAddMac=mac1;}'
               'if(top){top._ftcHasClickedAdd=true;top._ftcLastAddIp=ip1;top._ftcLastAddMac=mac1;}}catch(e){}}')
    if old_add in s:
        s = s.replace(old_add, new_add, 1)

    # Luu co khi bam OK
    old_ok = 'f.submit();}}'
    new_ok = ('document._ftcIsSaved=true;window._ftcIsSaved=true;'
              'try{if(parent)parent._hasClickedSaveInGuide=true;if(top)top._hasClickedSaveInGuide=true;}catch(e){}'
              'f.submit();}}')
    if old_ok in s:
        s = s.replace(old_ok, new_ok, 1)

    # Danh dau _ftcIsSaved khi trang load lai da co cau hinh Bind IP to MAC duoc luu tren server
    old_init = 'noteMsg.innerHTML=noteMsg.innerHTML.replace("###MAC1###",exMac[0]).replace("###MAC2###",exMac[1]);}'
    new_init = ('noteMsg.innerHTML=noteMsg.innerHTML.replace("###MAC1###",exMac[0]).replace("###MAC2###",exMac[1]);'
                'if(sIpBndMacEnable==1&&aryIpBindMac&&aryIpBindMac.length>0){'
                'document._ftcIsSaved=true;window._ftcIsSaved=true;'
                'try{if(parent)parent._hasClickedSaveInGuide=true;if(top)top._hasClickedSaveInGuide=true;}catch(e){}}}')
    if old_init in s:
        s = s.replace(old_init, new_init, 1)

    return s


def sua_enet_sht(s):
    """Dong bo co luu _ftcIsSaved va xu ly luu cau hinh DHCP Vigor 2927 (doc/ENET.SHT)."""
    # 1. Luu co khi bam OK trong onClkBtnOk
    old_submit = 'f.sAct.value="";f.submit();}'
    new_submit = ('f.sAct.value="";'
                  'document._ftcIsSaved=true;window._ftcIsSaved=true;'
                  'try{if(parent)parent._hasClickedSaveInGuide=true;if(top)top._hasClickedSaveInGuide=true;}catch(e){}'
                  'f.submit();}')
    if old_submit in s:
        s = s.replace(old_submit, new_submit, 1)

    # 2. Tu dong chap nhan hop thoai confirm de tranh chan thao tac luu
    old_confirm = "if(str!=\"\"&&!confirm(str+gettext('Do you want to continue to save? The new configuration will take effect after rebooting the router.'))){return;}"
    new_confirm = ("document._ftcIsSaved=true;window._ftcIsSaved=true;"
                   "try{if(parent)parent._hasClickedSaveInGuide=true;if(top)top._hasClickedSaveInGuide=true;}catch(e){}")
    if old_confirm in s:
        s = s.replace(old_confirm, new_confirm, 1)

    # 3. Danh dau _ftcIsSaved khi trang load lai da co save_success=1
    old_init = "$scope.bPSTNTrunk=parseInt('0');$scope.$apply();}"
    new_init = ("$scope.bPSTNTrunk=parseInt('0');$scope.$apply();"
                "if(window.location.search&&window.location.search.indexOf('save_success=1')!==-1){"
                "document._ftcIsSaved=true;window._ftcIsSaved=true;"
                "try{if(parent)parent._hasClickedSaveInGuide=true;if(top)top._hasClickedSaveInGuide=true;}catch(e){}}}")
    if old_init in s:
        s = s.replace(old_init, new_init, 1)

    # 4. Tu dong dong bo Start IP va Gateway IP khi thay doi IP Address (sLanIp)
    auto_sync_js = (
        "<script>"
        "(function(){"
        "function syncLanToDhcp(){"
        "var ipEl=document.querySelector('input[name=\"sLanIp\"]');"
        "var stEl=document.querySelector('input[name=\"sDHCPStIP\"]');"
        "var gwEl=document.querySelector('input[name=\"sDHCPGwIP\"]');"
        "if(!ipEl||!stEl||!gwEl)return;"
        "var v=(ipEl.value||'').trim();"
        "var p=v.split('.');"
        "if(p.length===4&&p[0]!==''&&p[1]!==''&&p[2]!==''&&p[3]!==''){"
        "var prefix=p[0]+'.'+p[1]+'.'+p[2];"
        "stEl.value=prefix+'.10';"
        "gwEl.value=v;"
        "try{"
        "stEl.dispatchEvent(new Event('input',{bubbles:true}));"
        "stEl.dispatchEvent(new Event('change',{bubbles:true}));"
        "gwEl.dispatchEvent(new Event('input',{bubbles:true}));"
        "gwEl.dispatchEvent(new Event('change',{bubbles:true}));"
        "}catch(e){}"
        "}"
        "}"
        "function attachSync(){"
        "var ipEl=document.querySelector('input[name=\"sLanIp\"]');"
        "if(!ipEl||ipEl._ftcSyncBound)return;"
        "ipEl._ftcSyncBound=true;"
        "ipEl.addEventListener('input',syncLanToDhcp);"
        "ipEl.addEventListener('change',syncLanToDhcp);"
        "ipEl.addEventListener('blur',syncLanToDhcp);"
        "syncLanToDhcp();"
        "}"
        "if(document.readyState==='loading'){document.addEventListener('DOMContentLoaded',attachSync);}"
        "else{attachSync();}"
        "setTimeout(attachSync,300);"
        "})();"
        "</script>"
    )
    if "</body>" in s:
        s = s.replace("</body>", auto_sync_js + "</body>", 1)
    else:
        s += auto_sync_js

    return s


def sua_policyrt_detail(s, iPRIdx):
    """Trong _pages/p2_188.html (trang chi tiet 1 rule Load-Balance/Route Policy,
    fid=4041/gotoDetailSet): day la ban chup TINH cu, luon hien cung "Index: 0"
    va gia tri an iPRIdx=0 bat ke hoc vien bam vao rule so may. Thay bang so
    that lay tu tham so POST iPRIdx de hoc vien thay dung so rule dang sua."""
    if iPRIdx:
        s = s.replace("<b>Index:&nbsp;0</b>", "<b>Index:&nbsp;" + str(iPRIdx) + "</b>", 1)
        s = s.replace('name=iPRIdx type=hidden value="0"',
                       'name=iPRIdx type=hidden value="' + str(iPRIdx) + '"', 1)
    # Dong bo co luu _ftcIsSaved va ngan submit lam mat trang chi tiet
    save_sync = (
        "document._ftcIsSaved=true;window._ftcIsSaved=true;"
        "try{if(parent){parent._hasClickedSaveInGuide=true;parent._ftcIsSaved=true;}}catch(e){}"
        "try{if(top){top._hasClickedSaveInGuide=true;top._ftcIsSaved=true;}}catch(e){}"
    )
    if "function onClkBtnOk(){" in s:
        s = s.replace("function onClkBtnOk(){", "function onClkBtnOk(){" + save_sync, 1)
    old_tail = "f.multiWanAlias.value=composeMultiWanAlias(interfaceNum);}f.submit();}}"
    if old_tail in s:
        s = s.replace(old_tail, "f.multiWanAlias.value=composeMultiWanAlias(interfaceNum);}" + save_sync + "return true;}}", 1)
    # Dat cac gia tri mac dinh cho rule moi (tranh loi parseInt("") -> NaN khien Source/Dest bi bien thanh IP Subnet)
    s = s.replace('var rdSrcIPAny = parseInt("");', 'var rdSrcIPAny = parseInt("0");', 1)
    s = s.replace('var rdDstIPAny = parseInt("");', 'var rdDstIPAny = parseInt("0");', 1)
    s = s.replace('var rdDstPortAny = parseInt("");', 'var rdDstPortAny = parseInt("0");', 1)
    s = s.replace('var rdGWDefault = parseInt("5");', 'var rdGWDefault = parseInt("0");', 1)
    s = s.replace('var iPRNATforSrcSub = parseInt("0");', 'var iPRNATforSrcSub = parseInt("1");', 1)
    s = s.replace('var iPRWanIf = parseInt("0");', 'var iPRWanIf = parseInt("3");', 1)
    return s


def sua_ipnatp_detail(s):
    """Trong doc/ipnatp.htm va _pages/p2_130.html:
    1. Bo sung id cho Enable (#lbl-nat-enable, #chk-nat-enable), Mode, Public/Private Port/IP, nút OK (#btn-nat-ok).
    2. Khi bam OK, luu snapshot len ca vg_config_store (theo phien KTV tren server) lan window.top
       va chuyen ve bang danh sach Port Redirection Table giong router DrayTek that va Bai 2.
    3. Tu dong khoi phuc (Auto-Restore) gia tri KTV da nhap khi quay lai trang Index 1 (ke ca khi reload tab di dong).
    4. Xoa sach gia tri cu rac nhu value=","Peer ID"]" trong p2_130.html.
    """
    server_snap = _kho().lay("doc/ipnatp1.htm", "_ftc_bai8_snap")
    server_snap_json = json.dumps(server_snap, ensure_ascii=False) if server_snap else "null"
    save_handler = (
        "f.fid.value=2;"
        "var snap={"
        "enable:f.sPSrvEnable?!!f.sPSrvEnable.checked:false,"
        "mode:(f.sPSrvMode&&f.sPSrvMode.options[f.sPSrvMode.selectedIndex])?f.sPSrvMode.options[f.sPSrvMode.selectedIndex].text:'Single',"
        "svcName:f.sPSrvSvcName?f.sPSrvSvcName.value.trim():'Camera',"
        "proto:(f.sPSrvProto&&f.sPSrvProto.options[f.sPSrvProto.selectedIndex])?f.sPSrvProto.options[f.sPSrvProto.selectedIndex].text:'TCP',"
        "wanIf:(f.sltWanIfIdx&&(f.sltWanIfIdx.options[f.sltWanIfIdx.selectedIndex]?f.sltWanIfIdx.options[f.sltWanIfIdx.selectedIndex].text:f.sltWanIfIdx.value))||'WAN1',"
        "pubPort:f.sPSrvPubPort?f.sPSrvPubPort.value.trim():'8080',"
        "srcIp:'Any',"
        "prvIp:f.sPSrvPrvIp?f.sPSrvPrvIp.value.trim():'192.168.1.10',"
        "prvPort:f.sPSrvPrvPort?f.sPSrvPrvPort.value.trim():'8080',"
        "isSaved:true,"
        "savedAt:Date.now()"
        "};"
        "document._ftcIsSaved=true;window._ftcIsSaved=true;window._FTC_VG2927_BAI8=snap;"
        "try{if(parent){parent._FTC_VG2927_BAI8=snap;parent._ftcIsSaved=true;parent._hasClickedSaveInGuide=true;}}catch(e){}"
        "try{if(top){top._FTC_VG2927_BAI8=snap;top._ftcIsSaved=true;top._hasClickedSaveInGuide=true;}}catch(e){}"
        "try{if(top&&top.applyGuidePopups){top.applyGuidePopups();}}catch(e){}"
        "var q='&en='+(snap.enable?'1':'0')+'&svc='+encodeURIComponent(snap.svcName)+'&proto='+encodeURIComponent(snap.proto)"
        "+'&wanIf='+encodeURIComponent(snap.wanIf)+'&pub='+encodeURIComponent(snap.pubPort)+'&prv='+encodeURIComponent(snap.prvIp)"
        "+'&prvPort='+encodeURIComponent(snap.prvPort);"
        "document.location='/cgi-bin/ipnat.cgi?fid=0&iPageIdx=1&save_success=1'+q;"
        "return true;}}"
    )
    old_tail = "f.fid.value=2;f.submit();}}"
    if old_tail in s:
        s = s.replace(old_tail, save_handler, 1)

    s = s.replace('name=sPSrvEnable type=checkbox value=1>&nbsp;Enable',
                  'id="chk-nat-enable" name=sPSrvEnable type=checkbox value=1>&nbsp;<span id="lbl-nat-enable">Enable</span>', 1)
    if 'id="btn-nat-ok"' not in s:
        s = s.replace('name=btnOk onclick=onClkBtnOk()', 'id="btn-nat-ok" name=btnOk onclick=onClkBtnOk()', 1)

    # Don dep du lieu rac neu la p2_130.html
    s = s.replace('value=","Peer ID"]"', 'value=""', 1)
    s = s.replace('value="8265"', 'value="0"', 1)
    s = s.replace('<b>Index No.&nbsp;0</b>', '<b>Index No.&nbsp;1</b>', 1)
    s = s.replace('name=iProfileIdx type=hidden value="0"', 'name=iProfileIdx type=hidden value="1"', 1)

    # Co che Auto-Restore gia tri da nhap khi quay lai trang (uu tien server_snap theo phien KTV)
    auto_restore_script = (
        "<script>"
        "var _ftcServerSnap=" + server_snap_json + ";"
        "function _ftcRestoreBai8(){"
        "try{"
        "var topWin=(typeof window!=='undefined'&&window.top)?window.top:window;"
        "var snap=_ftcServerSnap||(topWin&&topWin._FTC_VG2927_BAI8)||(typeof window!=='undefined'&&window._FTC_VG2927_BAI8)||(parent&&parent._FTC_VG2927_BAI8);"
        "if(snap&&snap.isSaved){"
        "try{if(topWin)topWin._FTC_VG2927_BAI8=snap;if(parent)parent._FTC_VG2927_BAI8=snap;}catch(e){}"
        "var f=document.frm1;"
        "if(f){"
        "if(f.sPSrvEnable&&snap.enable)f.sPSrvEnable.checked=true;"
        "if(f.sPSrvSvcName&&snap.svcName)f.sPSrvSvcName.value=snap.svcName;"
        "if(f.sltWanIfIdx&&snap.wanIf){if(snap.wanIf==='WAN1')f.sltWanIfIdx.value='0';else if(snap.wanIf==='ALL')f.sltWanIfIdx.value='6';}"
        "if(f.sPSrvPubPort&&snap.pubPort)f.sPSrvPubPort.value=snap.pubPort;"
        "if(f.sPSrvPrvIp&&snap.prvIp)f.sPSrvPrvIp.value=snap.prvIp;"
        "if(f.sPSrvPrvPort&&snap.prvPort)f.sPSrvPrvPort.value=snap.prvPort;"
        "document._ftcIsSaved=true;window._ftcIsSaved=true;"
        "}"
        "}"
        "}catch(e){}"
        "}"
        "if(document.readyState==='loading'){document.addEventListener('DOMContentLoaded',_ftcRestoreBai8);}"
        "else{_ftcRestoreBai8();}"
        "setTimeout(_ftcRestoreBai8,100);"
        "setTimeout(_ftcRestoreBai8,500);"
        "</script>"
    )
    if "</body>" in s:
        s = s.replace("</body>", auto_restore_script + "</body>", 1)
    return s


def sua_ipnatp_list(s):
    """Trong doc/ipnatp1.htm, _pages/page_042.html va _pages/deep_032.html:
    Dong bo du lieu KTV da luu tu vg_config_store (_ftc_bai8_snap) hoac snapshot top._FTC_VG2927_BAI8
    vao aryPtRedirect[0], giup dong so 1 hien thi day du Camera, ALL, TCP, 8080, Any, 192.168.1.10.
    """
    server_snap = _kho().lay("doc/ipnatp1.htm", "_ftc_bai8_snap")
    server_snap_json = json.dumps(server_snap, ensure_ascii=False) if server_snap else "null"
    s = re.sub(r"var\s+aryPtRedirect\s*=\s*;", 'var aryPtRedirect = [["","",0,0,0,-2,0,"Any"]];', s)
    sync_code = (
        "try {"
        "var _ftcServerSnap = " + server_snap_json + ";"
        "var topWin = (typeof window !== 'undefined' && window.top) ? window.top : window;"
        "var snap = _ftcServerSnap || (topWin && topWin._FTC_VG2927_BAI8) || (parent && parent._FTC_VG2927_BAI8) || window._FTC_VG2927_BAI8;"
        "if (snap && snap.isSaved) {"
        "try{if(topWin)topWin._FTC_VG2927_BAI8=snap;if(parent)parent._FTC_VG2927_BAI8=snap;}catch(e){}"
        "document._ftcIsSaved = true; window._ftcIsSaved = true;"
        "try{if(parent){parent._hasClickedSaveInGuide=true;parent._ftcIsSaved=true;}if(top){top._hasClickedSaveInGuide=true;top._ftcIsSaved=true;}}catch(e){}"
        "var svc = snap.svcName || 'Camera';"
        "var pub = snap.pubPort || '8080';"
        "var prv = snap.prvIp || '192.168.1.10';"
        "var proto = snap.proto || 'TCP';"
        "var wanIf = snap.wanIf || 'WAN1';"
        "var src = snap.srcIp || 'Any';"
        "if (typeof aryPtRedirect !== 'undefined' && Array.isArray(aryPtRedirect) && aryPtRedirect.length > 0) {"
        "aryPtRedirect[0] = [svc, prv, 0, snap.enable ? 1 : 0, parseInt(pub || 8080), (wanIf === 'ALL' ? -2 : 0), proto === 'UDP' ? 17 : 6, src];"
        "}"
        "function _ftcSyncTableCells() {"
        "var r0 = document.querySelector('tr.row0');"
        "if (r0) {"
        "var tds = r0.querySelectorAll('td');"
        "if (tds && tds.length >= 9) {"
        "var chk = tds[1].querySelector('input[type=\"checkbox\"]');"
        "if (chk) chk.checked = true;"
        "tds[2].innerHTML = '&nbsp;' + svc;"
        "tds[3].innerHTML = '&nbsp;' + wanIf;"
        "tds[4].innerHTML = '&nbsp;' + proto;"
        "tds[5].innerHTML = '&nbsp;' + pub;"
        "tds[6].innerHTML = '&nbsp;' + src;"
        "tds[7].innerHTML = '&nbsp;' + prv;"
        "var chkSel = tds[8].querySelector('input[type=\"checkbox\"]');"
        "if (chkSel) chkSel.checked = false;"
        "}"
        "}"
        "}"
        "if (document.readyState === 'loading') { document.addEventListener('DOMContentLoaded', _ftcSyncTableCells); }"
        "else { _ftcSyncTableCells(); }"
        "setTimeout(_ftcSyncTableCells, 50);"
        "setTimeout(_ftcSyncTableCells, 200);"
        "setTimeout(_ftcSyncTableCells, 600);"
        "}"
        "} catch(e) {};"
    )
    if 'var str="";' in s:
        s = s.replace('var str="";', sync_code + 'var str="";', 1)
    elif "</head>" in s:
        s = s.replace("</head>", "<script>" + sync_code + "</script></head>", 1)
    return s


# ------------------------------------------------------------ tien ich

def _js(v):
    """Doi gia tri Python sang literal JS."""
    if isinstance(v, bool):
        return "1" if v else "0"
    if isinstance(v, (int, float)):
        return str(v)
    if isinstance(v, (list, dict)):
        return json.dumps(v, separators=(",", ""))
    return json.dumps(str(v), ensure_ascii=False)


def _can_bang(s, i):
    mo = s[i]
    dong = "]" if mo == "[" else "}"
    d = 0
    while i < len(s):
        c = s[i]
        if c in "\"'":
            q, i = c, i + 1
            while i < len(s) and s[i] != q:
                i += 2 if s[i] == "\\" else 1
        elif c == mo:
            d += 1
        elif c == dong:
            d -= 1
            if d == 0:
                return i + 1
        i += 1
    return -1


# ------------------------------------------------------------ thay gia tri

def _toan_cuc(s):
    """Tap vi tri cac khai bao `var` o PHAM VI TOAN CUC (ngoai moi ham)."""
    ok = set()
    khoi = (list(re.finditer(r'<script\b[^>]*>(.*?)</script>', s, re.S | re.I)) +
            list(re.finditer(r'<textarea\s+id=["\']?\w*init["\']?[^>]*>(.*?)</textarea>', s, re.S | re.I)))
    for msc in khoi:
        than, goc = msc.group(1), msc.start(1)
        d, i, n = 0, 0, len(than)
        while i < n:
            c = than[i]
            if c in '"\'':
                q, i = c, i + 1
                while i < n and than[i] != q:
                    i += 2 if than[i] == '\\' else 1
            elif c == '/' and i + 1 < n and than[i + 1] == '/':
                i = than.find('\n', i)
                if i < 0:
                    break
            elif c == '/' and i + 1 < n and than[i + 1] == '*':
                i = than.find('*/', i)
                if i < 0:
                    break
                i += 1
            elif c == '{':
                d += 1
            elif c == '}':
                d -= 1
            elif d == 0 and than.startswith('var', i) and (i == 0 or not than[i - 1].isalnum()):
                ok.add(goc + i)
            i += 1
    return ok


def _quet_khai_bao(s, i):
    """Tu vi tri NGAY SAU 'var ', tach tung khai bao `ten = gia_tri` cach nhau
    boi dau phay trong CUNG mot cau lenh var, dung khi het chuoi (gap ';' hoac
    ky tu la o do sau 0). Tra ve [(ten, i_dau_gtri, i_cuoi_gtri), ...]."""
    ra, n = [], len(s)
    while i < n:
        while i < n and s[i] in ' \t\r\n':
            i += 1
        m = re.match(r'\w+', s[i:])
        if not m:
            break
        ten = m.group(0)
        i += m.end()
        while i < n and s[i] in ' \t\r\n':
            i += 1
        if i >= n or s[i] != '=':
            break
        i += 1
        while i < n and s[i] in ' \t\r\n':
            i += 1
        if i >= n:
            break
        if s[i] in '[{':
            j = _can_bang(s, i)
            if j < 0:
                break
        else:
            m2 = re.match(r'''(parseInt\s*\(\s*['"]?(-?\d+)['"]?\s*\)|-?\d+(?:\.\d+)?|"[^"]*"|'[^']*'|true|false|null)''', s[i:])
            if not m2:
                break
            j = i + m2.end()
        ra.append((ten, i, j))
        i = j
        while i < n and s[i] in ' \t\r\n':
            i += 1
        if i < n and s[i] == ',':
            i += 1
            continue
        break
    return ra


def _thay_bien(s, vars_):
    """Thay ve phai cua `var TEN = ...` bang gia tri trong kho. Giu nguyen ten bien."""
    if not vars_:
        return s, 0
    tc = _toan_cuc(s)
    ra, i, n = [], 0, 0
    for m in re.finditer(r'\bvar\s+', s):
        if m.start() not in tc:
            continue
        for ten, j, k in _quet_khai_bao(s, m.end()):
            if ten not in vars_:
                continue
            goc_txt = s[j:k]
            try:
                m_pi = re.match(r"parseInt\s*\(\s*['\"]?(-?\d+)['\"]?\s*\)", goc_txt)
                if m_pi and int(m_pi.group(1)) == int(vars_[ten]):
                    continue
                if json.loads(goc_txt.replace("'", '"')) == vars_[ten]:
                    continue
            except Exception:
                pass
            ra.append(s[i:j])
            ra.append(_js(vars_[ten]))
            i = k
            n += 1
    ra.append(s[i:])
    return "".join(ra), n


def _vung_script(s):
    """Khoang (dau, cuoi) cua moi khoi <script>...</script>."""
    return [(m.start(), m.end()) for m in
            re.finditer(r'<script\b[^>]*>.*?</script>', s, re.I | re.S)]


def _trong_script(vung, i):
    return any(d <= i < c for d, c in vung)


def _thay_input(s, inputs):
    """Thay value / checked / option selected. Giu nguyen name, id, thu tu thuoc tinh."""
    if not inputs:
        return s, 0
    dem = [0]
    vung = _vung_script(s)

    def _inp(m):
        if _trong_script(vung, m.start()):     # the nam trong chuoi JS — khong dung toi
            return m.group(0)
        a = m.group(1)
        nm = re.search(r'\bname\s*=\s*["\']?([\w\[\].-]+)', a, re.I)
        if not nm or nm.group(1) not in inputs:
            return m.group(0)
        ten = nm.group(1)
        gt = inputs[ten]
        ty = (re.search(r'\btype\s*=\s*["\']?(\w+)', a, re.I) or [None, "text"])[1].lower()
        if ty in ("button", "submit", "reset", "image", "file"):
            return m.group(0)
        if ty == "radio":
            v = re.search(r'\bvalue\s*=\s*["\']?([^"\'>\s]*)', a, re.I)
            a2 = re.sub(r'\s+checked(?:\s*=\s*["\']?\w*["\']?)?', "", a, flags=re.I)
            if v is not None and str(v.group(1)) == str(gt):
                a2 = a2.rstrip() + " checked"
            dem[0] += 1
            return "<input" + a2 + ">"
        if ty == "checkbox":
            co = bool(gt) and str(gt) not in ("0", "", "False")
            a2 = re.sub(r'\s+checked(?:\s*=\s*["\']?\w*["\']?)?', "", a, flags=re.I)
            if co:
                a2 = a2.rstrip() + " checked"
            dem[0] += 1
            return "<input" + a2 + ">"
        if "{{" in a:                       # o Angular — de nguyen cho JS xu ly
            return m.group(0)
        if re.search(r'\bvalue\s*=', a, re.I):
            a2 = re.sub(r'(\bvalue\s*=\s*")[^"]*(")', lambda x: x.group(1) + str(gt) + x.group(2), a, flags=re.I)
        else:
            a2 = a.rstrip() + f' value="{gt}"'
        dem[0] += 1
        return "<input" + a2 + ">"

    s = re.sub(r"<input\b([^>]*)>", _inp, s, flags=re.I)
    vung = _vung_script(s)          # tinh lai: chuoi da doi do lan thay tren

    def _sel(m):
        if _trong_script(vung, m.start()):     # <select> trong chuoi JS — bo qua
            return m.group(0)
        head, than = m.group(1), m.group(2)
        nm = re.search(r'\bname\s*=\s*["\']?([\w\[\].-]+)', head, re.I)
        if not nm or nm.group(1) not in inputs:
            return m.group(0)
        gt = str(inputs[nm.group(1)])

        def _opt(o):
            at = o.group(1)
            at = re.sub(r'\s+selected(?:\s*=\s*["\']?\w*["\']?)?', "", at, flags=re.I)
            v = re.search(r'\bvalue\s*=\s*["\']?([^"\'>\s]*)', at, re.I)
            if v and v.group(1) == gt:
                at = at.rstrip() + " selected"
            return "<option" + at + ">"

        than = re.sub(r"<option\b([^>]*)>", _opt, than, flags=re.I)
        dem[0] += 1
        return "<select" + head + ">" + than + "</select>"

    s = re.sub(r"<select\b([^>]*)>(.*?)</select>", _sel, s, flags=re.I | re.S)
    return s, dem[0]


# ------------------------------------------------------------ API

def co_trang(duong_dan_goc):
    """Trang goc co ton tai trong reference/source/ khong (co cache RAM)."""
    if duong_dan_goc in _SOURCE_EXISTS_CACHE:
        return _SOURCE_EXISTS_CACHE[duong_dan_goc]
    exists = os.path.exists(os.path.join(SOURCE, duong_dan_goc))
    _SOURCE_EXISTS_CACHE[duong_dan_goc] = exists
    return exists


def _phan_tich_bien_goc(s):
    """Phan tich 1 lan duy nhat danh sach (ten, j, k, goc_txt, parsed_val) cua trang goc."""
    tc = _toan_cuc(s)
    spans = []
    for m in re.finditer(r'\bvar\s+', s):
        if m.start() not in tc:
            continue
        for ten, j, k in _quet_khai_bao(s, m.end()):
            goc_txt = s[j:k]
            parsed_ok = False
            parsed_val = None
            m_pi = re.match(r"parseInt\s*\(\s*['\"]?(-?\d+)['\"]?\s*\)", goc_txt)
            if m_pi:
                try:
                    parsed_val = ("pi", int(m_pi.group(1)))
                    parsed_ok = True
                except Exception:
                    pass
            else:
                try:
                    parsed_val = ("json", json.loads(goc_txt.replace("'", '"')))
                    parsed_ok = True
                except Exception:
                    pass
            spans.append((ten, j, k, goc_txt, parsed_ok, parsed_val))
    return spans


def _thay_bien_nhanh(s, spans, vars_):
    """Thay bien JS tu danh sach spans da phan tich san O(so_bien) thay vi quet toan trang."""
    if not vars_ or not spans:
        return s, 0
    ra, i, n = [], 0, 0
    for ten, j, k, _goc_txt, parsed_ok, parsed_val in spans:
        if ten not in vars_:
            continue
        v_new = vars_[ten]
        if parsed_ok:
            try:
                if parsed_val[0] == "pi" and parsed_val[1] == int(v_new):
                    continue
                if parsed_val[0] == "json" and parsed_val[1] == v_new:
                    continue
            except Exception:
                pass
        ra.append(s[i:j])
        ra.append(_js(v_new))
        i = k
        n += 1
    if n == 0:
        return s, 0
    ra.append(s[i:])
    return "".join(ra), n


def render(duong_dan_goc):
    """Tra (noi_dung_bytes, thong_ke) hoac (None, None) neu khong co trang goc."""
    kho = _kho()
    cached = _SOURCE_RAW_CACHE.get(duong_dan_goc)
    if cached is None:
        p = os.path.join(SOURCE, duong_dan_goc)
        if not co_trang(duong_dan_goc):
            return None, None
        with open(p, "rb") as f:
            raw = f.read()
        try:
            s = raw.decode("utf-8")
            enc = "utf-8"
        except UnicodeDecodeError:
            s = raw.decode("latin-1")
            enc = "latin-1"
        def_page = getattr(kho, "_DEFAULT_PAGES", {}).get(duong_dan_goc) or {}
        def_inputs = dict(def_page.get("inputs") or {})
        if def_inputs:
            s, _ = _thay_input(s, def_inputs)
        if "<title>Authorization Required !!!</title>" in s:
            s = s.replace("<title>Authorization Required !!!</title>", "<title>Service Activation Wizard</title>")
        s = sua_top_thanh_parent(s)
        s = bat_tab_ipv6(s)
        s = sua_getStrObj(s)
        s = inject_iframe_shim(s, is_index=(duong_dan_goc.lower() == "index.htm"))
        if "ipbandw.htm" in duong_dan_goc:
            s = sua_ipbandw_add(s)
        if "ipbmac.htm" in duong_dan_goc:
            s = sua_ipbmac_add(s)
        if "ENET.SHT" in duong_dan_goc or "enet.sht" in duong_dan_goc.lower():
            s = sua_enet_sht(s)
        spans = _phan_tich_bien_goc(s)
        cached = (s, enc, len(raw), spans, def_inputs)
        _SOURCE_RAW_CACHE[duong_dan_goc] = cached

    s, enc, goc_bytes, spans, def_inputs = cached
    cfg = kho.trang(duong_dan_goc)
    s2, n_var = _thay_bien_nhanh(s, spans, cfg.get("vars", {}))
    cur_inputs = cfg.get("inputs") or {}
    if cur_inputs is def_inputs or not cur_inputs:
        diff_inputs = {}
    else:
        diff_inputs = {k: v for k, v in cur_inputs.items() if def_inputs.get(k) != v}
    s2, n_inp = _thay_input(s2, diff_inputs)
    return s2.encode(enc, "replace"), {"bien": n_var, "input": n_inp,
                                       "goc_bytes": goc_bytes, "ra_bytes": len(s2)}


if __name__ == "__main__":
    import sys
    dd = sys.argv[1] if len(sys.argv) > 1 else "doc/enet1.htm"
    d, tk = render(dd)
    if d is None:
        print("khong co trang goc:", dd)
    else:
        print(dd, "->", tk)
