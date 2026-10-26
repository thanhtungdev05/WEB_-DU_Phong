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
import json, os, re

BASE = os.path.dirname(os.path.abspath(__file__))
SOURCE = os.path.normpath(os.path.join(BASE, "..", "reference", "source"))

import vg_config_store as config_store


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
_TOP_VE_PARENT = re.compile(
    r'\btop\.(act_sta|webcfg|ACTION_STATUS|iActionStatusFlag|iFwUpgradeState|'
    r'gettext|angular|myApp|locale)\b')


def sua_top_thanh_parent(s):
    """Doi top.X -> parent.X cho danh sach bien scaffolding frame o tren."""
    return _TOP_VE_PARENT.sub(r'parent.\1', s)


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
    2. Khi bam OK, luu snapshot va chuyen ve bang danh sach Port Redirection Table giong router DrayTek that va Bai 2.
    3. Tu dong khoi phuc (Auto-Restore) gia tri KTV da nhap khi quay lai trang Index 1.
    4. Xoa sach gia tri cu rac nhu value=","Peer ID"]" trong p2_130.html.
    """
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
        "document.location='/cgi-bin/ipnat.cgi?fid=0&iPageIdx=1&save_success=1';"
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

    # Co che Auto-Restore gia tri da nhap khi quay lai trang
    auto_restore_script = (
        "<script>"
        "function _ftcRestoreBai8(){"
        "try{"
        "var topWin=(typeof window!=='undefined'&&window.top)?window.top:window;"
        "var snap=(topWin&&topWin._FTC_VG2927_BAI8)||(typeof window!=='undefined'&&window._FTC_VG2927_BAI8)||(parent&&parent._FTC_VG2927_BAI8);"
        "if(snap&&snap.isSaved){"
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
    Dong bo du lieu KTV da luu tu snapshot top._FTC_VG2927_BAI8 vao aryPtRedirect[0],
    giup dong so 1 hien thi day du Camera, ALL, TCP, 8080, Any, 192.168.1.10.
    """
    s = re.sub(r"var\s+aryPtRedirect\s*=\s*;", 'var aryPtRedirect = [["","",0,0,0,-2,0,"Any"]];', s)
    sync_code = (
        "try {"
        "var topWin = (typeof window !== 'undefined' && window.top) ? window.top : window;"
        "var snap = (topWin && topWin._FTC_VG2927_BAI8) || (parent && parent._FTC_VG2927_BAI8) || window._FTC_VG2927_BAI8;"
        "if (snap && snap.isSaved) {"
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
    """Tap vi tri cac khai bao `var` o PHAM VI TOAN CUC (ngoai moi ham).

    VI SAO CAN (loi tu gay 26/7/2026): trang tr069.htm co HAI ham khai bao
    CUNG TEN bien cuc bo:
        function initWAN(){ var aryslt=["iPriWANProf","iSecWANProf"]; ... }
        function initVPN(){ var aryslt=["iPriVPNProf","iSecVPNProf"]; ... }
    Ban truoc thay MOI cho `var aryslt` bang mot gia tri duy nhat trong kho
    -> initVPN nhoi danh sach VPN vao o WAN, o VPN rong. Bien trong ham la
    bien CUC BO, khong phai NVRAM — tuyet doi khong duoc dung toi.

    VI SAO CAN quet ca <textarea id="*init" style="display:none">: mot so
    trang (menu.htm, header.htm, dashboard.htm, stringobj.htm...) KHONG khai
    bao bien NVRAM truc tiep trong <script>, ma giau trong mot the <textarea>
    an, roi dung JS doc `.value` cua no de tao <script> that va nhoi vao
    <head> luc chay (phat hien 2026-08-08 khi lam String Object). Neu chi
    quet <script> se bo sot TOAN BO cac bien nay — 12 trang, co trang toi
    90 bien (menu.htm) — khong bao gio thay duoc gia tri moi tu kho cau hinh,
    vi pham nguyen tac 2.5 ngay ca khi kho da co gia tri dung.
    """
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
    ky tu la o do sau 0). Tra ve [(ten, i_dau_gtri, i_cuoi_gtri), ...].

    VI SAO CAN (phat hien 2026-08-08 khi lam String Object): JS nen/minify gop
    NHIEU bien vao MOT `var`:  var a=1,  b=[2,3],  c="x";
    Ban cu chi doc duoc bien DAU TIEN (a), am tham bo qua b, c. Anh huong
    menu.htm (~90 bien), header.htm, dashboard.htm, stringobj.htm... — xem
    them giai thich o _toan_cuc().
    """
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
    """Thay ve phai cua `var TEN = ...` bang gia tri trong kho. Giu nguyen ten bien.

    CHI thay khai bao o pham vi TOAN CUC — xem giai thich o _toan_cuc().
    Xu ly ca khai bao gop nhieu bien — xem _quet_khai_bao().
    """
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
            # Chi thay khi gia tri THUC SU khac ban goc. Bang nhau thi giu nguyen
            # tung ky tu (ke ca kieu dau nhay) — nguyen tac 2.2.
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
    """Khoang (dau, cuoi) cua moi khoi <script>...</script>.

    VI SAO CAN: trang DrayTek dung JS dung bang, va trong JS co CHUOI chua the
    input, vi du trong mnatop.htm (NAT >> Open Ports):
        aryOpen[i] ? '<input type=checkbox value=1 name=enOpenPt"+i+" checked>'
                   : '<input type=checkbox value=1 name=enOpenPt"+i+">'
    Day KHONG phai the HTML that — day la MA NGUON JAVASCRIPT. Neu coi la the
    HTML roi sua vao, ta dang SUA CODE JS cua thiet bi, vi pham nguyen tac 2.2,
    va hau qua thay ngay tren man hinh: ca 40 o Open Ports deu bi tick.
    """
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
            # RADIO khac CHECKBOX: nhieu the cung `name`, moi the mot `value`.
            # Phai tick the co value BANG gia tri trong kho, khong duoc tick
            # theo bool — lam vay se tick ca nhom (vd iWebAuth=1 ma van tick value=0).
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
    """Trang goc co ton tai trong reference/source/ khong."""
    return os.path.exists(os.path.join(SOURCE, duong_dan_goc))


def render(duong_dan_goc):
    """Tra (noi_dung_bytes, thong_ke) hoac (None, None) neu khong co trang goc."""
    p = os.path.join(SOURCE, duong_dan_goc)
    if not os.path.exists(p):
        return None, None
    with open(p, "rb") as f:
        raw = f.read()
    try:
        s = raw.decode("utf-8")
        enc = "utf-8"
    except UnicodeDecodeError:
        s = raw.decode("latin-1")
        enc = "latin-1"

    cfg = config_store.trang(duong_dan_goc)
    s2, n_var = _thay_bien(s, cfg.get("vars", {}))
    s2, n_inp = _thay_input(s2, cfg.get("inputs", {}))
    s2 = sua_top_thanh_parent(s2)
    s2 = bat_tab_ipv6(s2)
    if "ipbandw.htm" in duong_dan_goc:
        s2 = sua_ipbandw_add(s2)
    if "ipbmac.htm" in duong_dan_goc:
        s2 = sua_ipbmac_add(s2)
    if "ENET.SHT" in duong_dan_goc or "enet.sht" in duong_dan_goc.lower():
        s2 = sua_enet_sht(s2)
    return s2.encode(enc, "replace"), {"bien": n_var, "input": n_inp,
                                       "goc_bytes": len(raw), "ra_bytes": len(s2)}


if __name__ == "__main__":
    import sys
    dd = sys.argv[1] if len(sys.argv) > 1 else "doc/enet1.htm"
    d, tk = render(dd)
    if d is None:
        print("khong co trang goc:", dd)
    else:
        print(dd, "->", tk)
