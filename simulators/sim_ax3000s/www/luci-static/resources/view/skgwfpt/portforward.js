
var VirCfgJson = {}; var waninfoTable = {}; var stainfoTable = {}; var lancfg = {}; var PORTFORWARDING_MAX_ENTRY = 32; var actionapply = "add"; var delist = new Array(); var selindex = 0; var APP = [{ "name": "Custom Service", "proto": 0, "ex_port": "", "in_port": "" }, { "name": "Domain Name Server", "proto": 2, "ex_port": "53", "in_port": "53" }, { "name": "FTP Server", "proto": 1, "ex_port": "21", "in_port": "21" }, { "name": "IPSEC", "proto": 2, "ex_port": "500", "in_port": "500" }, { "name": "Mail POP3", "proto": 1, "ex_port": "110", "in_port": "110" }, { "name": "Mail SMTP", "proto": 1, "ex_port": "25", "in_port": "25" }, { "name": "PPTP", "proto": 1, "ex_port": "1723", "in_port": "1723" }, { "name": "Real Player 8 Plus", "proto": 2, "ex_port": "7070", "in_port": "7070" }, { "name": "Secure Shell Server", "proto": 1, "ex_port": "22", "in_port": "22" }, { "name": "Secure Web Server HTTPS", "proto": 1, "ex_port": "443", "in_port": "443" }, { "name": "SNMP", "proto": 2, "ex_port": "161", "in_port": "161" }, { "name": "SNMP Trap", "proto": 2, "ex_port": "162", "in_port": "162" }, { "name": "Telnet Server", "proto": 1, "ex_port": "23", "in_port": "23" }, { "name": "TFTP", "proto": 2, "ex_port": "69", "in_port": "69" }, { "name": "Web Server HTTP", "proto": 1, "ex_port": "80", "in_port": "80" }]; function pageLoad() { contentLoad(); check_fwlevel() }
function check_fwlevel() {
    var level = 0; var ubusparam = new Array("rtweb.firewall", "getFwLevel", {}); var jsonparam = { "id": 1, "params": ubusparam }; sk_auth_post(jsonparam, function (result) {
        console.log(result.result[1]); level = result.result[1]["firewalllevel"]["level"]; if (level == 2) { warninfo_show(_("PFnottakeeffect")); }
    });
}
function contentLoad() { var ubusparam1 = new Array("gwweb.virserver", "get", {}); var ubusparam2 = new Array("gwweb.wancfg", "status", {}); var ubusparam3 = new Array("rtweb.sta", "getStaInfo", {}); var ubusparam4 = new Array("rtweb.lancfg", "getLanCfg", {}); var jsonparam = [{ "id": 1, "params": ubusparam1 }, { "id": 2, "params": ubusparam2 }, { "id": 3, "params": ubusparam3 }, { "id": 4, "params": ubusparam4 }]; sk_auth_post(jsonparam, function (result) { VirCfgJson = result[0].result[1].vircfg; waninfoTable = result[1].result[1].wan; stainfoTable = result[2].result[1].staDevices; lancfg = result[3].result[1]; showVircfgEntry(); }); }
function changeSel() {
    var f = document.forms[0]; var selectnum = 0; var selist = $("input[name='rml']"); if (selist.length == 0 || selist.length === undefined) { f.seletall.checked = false; f.btn_edit.disabled = true; f.btn_del.disabled = true; return; }
    else {
        for (var i = 0; i < selist.length; i++) {
            if (selist[i].checked == true) { selectnum++; }
        }
    }
    if (selectnum == selist.length) { f.seletall.checked = true; }
    else { f.seletall.checked = false; }
    if (selectnum == 1) { f.btn_edit.disabled = false; }
    else { f.btn_edit.disabled = true; }
    if (selectnum > 0) { f.btn_del.disabled = false; }
    else { f.btn_del.disabled = true; }
}
function selectAll(obj) {
    var selist = $("input[name='rml']"); if (selist.length == 0)
        return; for (i = 0; i < selist.length; i++) {
            if ($(obj).is(':checked'))
                selist[i].checked = true; else
                selist[i].checked = false;
        }
    changeSel();
}
function select_dev(value) { if (value == "manulIp") { sIp.value = ""; } else { sIp.value = value; } }
function appSelect(sName) {
    for (var i = 0; i < APP.length; i++) {
        if (APP[i].name == sName) { $("#cusSrvName").val(APP[i].name); $("#proto").val(APP[i].proto); $("#ex_port").val(APP[i].ex_port); $("#in_port").val(APP[i].in_port); return; }
    }
}
function app_init() { $("#srvName").empty(); $.each(APP, function (name, obj) { $("#srvName").append(new Option(obj.name, obj.name)); }); }
function calculateBroadcastAddress(ipAddress, subnetMask) { const ipNumber = ipToNumber(ipAddress); const maskNumber = ipToNumber(subnetMask); const broadcastNumber = ipNumber | ~maskNumber; return numberToIp(broadcastNumber); }
function ipToNumber(ipAddress) { const ipParts = ipAddress.split('.').map(Number); return ipParts.reduce((acc, part) => acc << 8 | part, 0); }
function numberToIp(ipNumber) { const ipParts = [(ipNumber >> 24) & 255, (ipNumber >> 16) & 255, (ipNumber >> 8) & 255, ipNumber & 255]; return ipParts.join('.'); }
function showVircfgEntry() {
    var proto = ["TCP/UDP", "TCP", "UDP"]; var itemStr = ""; $("#at-portforward-tbody").empty(); $("#seletall").attr("disabled", false); if (VirCfgJson.length > 0) {
        for (var i = 1; i <= PORTFORWARDING_MAX_ENTRY; i++) {
            for (var j = 0; j < VirCfgJson.length; j++) {
                if (VirCfgJson[j] == null)
                    continue; if ((VirCfgJson[j].idx) != i) { continue; }
                itemStr += "<tr><td>"; itemStr += "<label class='skcheckbox'>"; itemStr += " <input type='checkbox' id='rml" + j + "' name='rml' value='" + VirCfgJson[j].idx + "' onclick='changeSel(this)' hidden>"; itemStr += "<label for='rml" + j + "' class='skcheckbox-label'></label>"; itemStr += "</label>"; itemStr += "</td>"; itemStr += "<td>" + VirCfgJson[j].idx + "</td>"; itemStr += '<td style="word-break: break-all;">' + VirCfgJson[j].description + "</td>"; itemStr += "<td>" + VirCfgJson[j].ex_port + "</td>"; itemStr += "<td>" + proto[VirCfgJson[j].protocol] + "</td>"; itemStr += "<td>" + VirCfgJson[j].in_port + "</td>"; itemStr += "<td>" + VirCfgJson[j].address + "</td>"; if (VirCfgJson[j].wanidx > 0) { for (var k = 0; k < waninfoTable.length; k++) { if (waninfoTable[k].index == VirCfgJson[j].wanidx) { itemStr += "<td>" + waninfoTable[k].GUIname + "</td>"; } } } else { itemStr += "<td></td>"; }
                itemStr += "</tr>";
            }
        }
    } else { itemStr = "<tr><td colspan='7'>No data yet...</td></tr>"; $("#seletall").attr("disabled", true); $("#seletall").checked = false; }
    $("#at-portforward-tbody").append(itemStr);
}
function edit_vircfg() {
    var selectnum = 0; if (VirCfgJson.length == 0)
        return; var selist = $("input[name='rml']"); if (selist.length === undefined) {
        if (selist.checked == true) { selectnum = 1; selindex = selist.value; }
    }
    else {
        for (var i = 0; i < selist.length; i++) {
            if (selist[i].checked == true) { selindex = selist[i].value; selectnum++; }
        }
    }
    if (selectnum != 1)
        return false; $("#vir_info").hide(); $("#vir_cfg").fadeIn(300); actionapply = "edit"; $("#dstWanIf").empty(); $("#dmzOpt").empty(); $.each(waninfoTable, function (index, obj) { if (obj.v4_type != "bridge") { $("#dstWanIf").append(new Option(obj.GUIname, obj.index)); } }); app_init(); loadVirCfg(selindex);
}
function add_vircfg() { $("#vir_info").hide(); $("#vir_cfg").fadeIn(300); actionapply = "add"; $("#enableVir").prop("checked", true); $("#cusSrvName").val(""); $("#ex_port").val(""); $("#in_port").val(""); $("#sIp").val(""); $("#rIp").val(""); $("#leasetime").val(""); $("#dstWanIf").empty(); $("#dmzOpt").empty(); $("#ipver").val(1); $("#srvName").val(""); $("#Proto").val(0); $.each(waninfoTable, function (index, obj) { if (obj.v4_type != "bridge") { $("#dstWanIf").append(new Option(obj.GUIname, obj.index)); } }); $("#dmzOpt").append(new Option("Select...", "manulIp")); $.each(stainfoTable, function (index, obj) { $("#dmzOpt").append(new Option(obj.hostname + " (" + obj.ipAddr + ")", obj.ipAddr)); }); app_init(); }
function parseString(str) {
    const parts = str.split(','); const set = new Set(); for (const part of parts) { if (part.includes('-')) { const [start, end] = part.split('-').map(Number); for (let i = start; i <= end; i++) { set.add(i); } } else { set.add(Number(part)); } }
    return set;
}
function checkAlreadyExistBoundPort(data) {
    if (data == null) { warninfo_show('External port is invalid.'); return true; }
    const set1 = parseString(data.ex_port); for (var i = 0; i < VirCfgJson.length; i++) {
        if (VirCfgJson[i] == null)
            continue; if (selindex == VirCfgJson[i].idx)
            continue; if (VirCfgJson[i].wanidx != data.wanidx)
            continue; if (VirCfgJson[i].ip_version != data.ip_version)
            continue; if ((VirCfgJson[i].protocol != 0) && (data.protocol != 0) && (VirCfgJson[i].protocol != data.protocol))
            continue; const set2 = parseString(VirCfgJson[i].ex_port); for (let num of set1) { if (set2.has(num)) { warninfo_show('External port:' + num + ' is already used.'); return true; } }
    }
    return false;
}
function btnSave() {
    apply_data = {}; var f = document.forms[0];
    if (f.enableVir.checked == true)
        apply_data.enable = 1; else
        apply_data.enable = 0; apply_data.wanidx = parseInt(f.dstWanIf.value); apply_data.protocol = parseInt(f.Proto.value); if (f.cusSrvName.value == "") {/* bypassed warning */ }
    if (f.cusSrvName.value.length > 32) {/* bypassed warning */ }
    apply_data.description = f.cusSrvName.value; if (parseInt(f.ipver.value) == 1) {
        if (isValidIpAddress(f.sIp.value) == false || !(isSameSubNet(lancfg.ipaddr, lancfg.subnetmask, f.sIp.value, lancfg.subnetmask))) {/* bypassed warning */ }
        var boardcast_address = calculateBroadcastAddress(lancfg.ipaddr, lancfg.subnetmask); if (lancfg.ipaddr == f.sIp.value || f.sIp.value == boardcast_address || f.sIp.value.split(".")[3] == '0') {/* bypassed warning */ }
        if (f.rIp.value != '' && f.rIp.value != '*' && isValidIpAddress(f.rIp.value) == false) {/* bypassed warning */ }
    } else {
        if (isValidIpv6Address(f.sIp.value) == false) {/* bypassed warning */ }
        if (f.rIp.value != '' && f.rIp.value != '*' && isValidIpv6Address(f.rIp.value) == false) {/* bypassed warning */ }
    }
    apply_data.ip_version = parseInt(f.ipver.value); apply_data.address = f.sIp.value; apply_data.remote_addr = f.rIp.value; apply_data.lease_time = parseInt(f.leasetime.value); if (f.ex_port.value === "") {/* bypassed warning */ }
    const regex = /^[0-9,-]*$/; if (!regex.test(f.ex_port.value)) {/* bypassed warning */ }
    var port = f.ex_port.value.split(","); for (var i = 0; i < port.length; i++) {
        if (port[i] === "") {/* bypassed warning */ }
        if (port[i].indexOf("-") !== -1) { var port1 = port[i].split("-"); if (!port1[0] || !port1[1] || parseInt(port1[0]) > parseInt(port1[1]) || parseInt(port1[0]) > 65535 || parseInt(port1[0]) < 1 || parseInt(port1[1]) > 65535 || parseInt(port1[1]) < 1) {/* bypassed warning */ } } else { if (parseInt(port[i]) > 65535 || parseInt(port[i]) < 1) {/* bypassed warning */ } }
    }
    apply_data.ex_port = f.ex_port.value; if (checkAlreadyExistBoundPort(apply_data)) { return; }
    if (f.in_port.value === "") {/* bypassed warning */ }
    const regex1 = /^[0-9-]*$/; if (!regex1.test(f.in_port.value)) {/* bypassed warning */ }
    if (f.in_port.value.indexOf("-") !== -1) { var port1 = f.in_port.value.split("-"); if (!port1[0] || !port1[1] || parseInt(port1[0]) > parseInt(port1[1]) || parseInt(port1[0]) > 65535 || parseInt(port1[0]) < 1 || parseInt(port1[1]) > 65535 || parseInt(port1[1]) < 1) {/* bypassed warning */ } } else { if (parseInt(f.in_port.value) > 65535 || parseInt(f.in_port.value) < 1) {/* bypassed warning */ } }
    apply_data.in_port = f.in_port.value;
if (actionapply == "add") {
    if (VirCfgJson.length >= PORTFORWARDING_MAX_ENTRY) {/* bypassed warning */ }
    ubusparam = new Array("gwweb.virserver", "add", apply_data);
}
else if (actionapply == "edit") { apply_data.idx = parseInt(selindex); ubusparam = new Array("gwweb.virserver", "edit", apply_data); }
else { return; }
jsonparam = { "id": 1, "params": ubusparam }; sk_auth_apply(jsonparam, function (result) {
    if (result.result.length > 1) { if (3 == result.result[1].result) { warninfo_show(result.result[1].failreason); } }
    $("#vir_cfg").hide(); $("#vir_info").fadeIn(300); pageLoad();
});
}
function btnCancel() { $("#vir_cfg").hide(); $("#vir_info").fadeIn(300); pageLoad(); }
function changeIPVer(ipver) {
    $("#dmzOpt").empty(); $("#sIp").val(""); $("#dmzOpt").append(new Option("Select...", "manulIp")); $.each(stainfoTable, function (index, obj) {
        if (ipver == 1)
            $("#dmzOpt").append(new Option(obj.hostname + " (" + obj.ipAddr + ")", obj.ipAddr)); else if (obj.ipv6_array[0])
            $("#dmzOpt").append(new Option(obj.hostname + " (" + obj.ipv6_array[0] + ")", obj.ipv6_array[0]));
    });
}
function loadVirCfg(selindex) {
    var index = 0; for (var i = 0; i < VirCfgJson.length; i++) {
        if (VirCfgJson[i].idx == selindex)
            index = i;
    }
    if (VirCfgJson[index].enable == "1") { $("#enableVir").prop("checked", true); } else { $("#enableVir").prop("checked", false); }
    $("#cusSrvName").val(VirCfgJson[index].description); $("#dstWanIf").val(VirCfgJson[index].wanidx); $("#sIp").val(VirCfgJson[index].address); $("#ex_port").val(VirCfgJson[index].ex_port); $("#in_port").val(VirCfgJson[index].in_port); $("#srvName").val(VirCfgJson[index].description); $("#Proto").val(VirCfgJson[index].protocol); $("#ipver").val(VirCfgJson[index].ip_version); $("#rIp").val(VirCfgJson[index].remote_addr); $("#leasetime").val(VirCfgJson[index].lease_duration); $("#dmzOpt").append(new Option("Select...", "manulIp")); var num = 0; $.each(stainfoTable, function (num, obj) {
        if (VirCfgJson[index].ip_version == 1)
            $("#dmzOpt").append(new Option(obj.hostname + " (" + obj.ipAddr + ")", obj.ipAddr)); else if (obj.ipv6_array[0])
            $("#dmzOpt").append(new Option(obj.hostname + " (" + obj.ipv6_array[0] + ")", obj.ipv6_array[0]));
    }); $("#dmzOpt").val(VirCfgJson[index].address);
}
function del_vircfg(index) {
    apply_data = {}; apply_data.idx = parseInt(index); ubusparam = new Array("gwweb.virserver", "delete", apply_data); jsonparam = { "id": 1, "params": ubusparam }; sk_auth_apply(jsonparam, function (result) {
        delist.shift(); if (delist.length == 0) { pageLoad(); return; }
        del_vircfg(delist[0]);
    });
}
function removeClick() {
    var selist = $("input[name='rml']"); if (selist.length === undefined) {
        if (selist.checked == true) { delist.push(selist.value) }
    }
    else {
        for (var i = 0; i < selist.length; i++) {
            if (selist[i].checked == true) { delist.push(selist[i].value) }
        }
    }
    console.log(delist); if (delist.length == 0)
        return; del_vircfg(delist[0]);
}
