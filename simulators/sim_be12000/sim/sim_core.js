/* ============================================================================
 * sim_core.js - Lop gia lap BE12000 chay TRONG TRINH DUYET.
 *
 * VI SAO CAN FILE NAY
 *   Thiet bi that KHONG co file trang rieng: moi thu di qua MOT URL duy nhat
 *   la '/' voi tham so _type/_tag, do server sinh ra. Ban goc dung server
 *   Python (server.py + dispatch.py + session.py + config_store.py). Du an
 *   nay la web TINH (Firebase Hosting) nen khong chay duoc Python.
 *   File nay chuyen logic do sang JavaScript va CHAN XMLHttpRequest.
 *
 * DOI CHIEU NGUON GOC (giu dung hanh vi, khong "sua cho dep")
 *   session.py      -> phan Session: dang nhap 3 buoc, sha256(matkhau+muoi),
 *                      token doi sau moi POST, khoa 60s sau 5 lan sai
 *   dispatch.py     -> phan Dispatch: menuView + thay _sessionTmpToken song,
 *                      menuData doc/ghi, rang buoc ngu canh (SessionTimeout)
 *   config_store.py -> phan Store: sinh XML, doc/ghi instance, cac dang
 *                      phan hoi ghi (ghiDangKieu)
 *   state/factory.json + spec/cgi-map.json -> sim/seed_data.js
 *
 * LUU TRANG THAI: ban goc ghi ra src/state/*.json. O day dung localStorage.
 * ========================================================================== */
(function () {
    'use strict';

    if (window.__BE12000_SIM__) return;
    window.__BE12000_SIM__ = true;

    var KHOA_LUU = 'BE12000_state';
    var SEED = window.BE12000_SEED || {};
    var NGU_CANH = SEED.nguCanh || {};

    var TEN_DANG_NHAP = 'admin';
    var MAT_KHAU = 'admin';

    function banSao(x) { return JSON.parse(JSON.stringify(x)); }

    function thoat(s) {
        return String(s === undefined || s === null ? '' : s)
            .replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
    }

    /* instidentity: "echo" (mac dinh, echo instId) | "rong" (luon rong)
       | "tu_truong:<ten>" (doc gia tri tu 1 truong KHAC trong thamSo).
       Dung chung cho cac dang xac_nhan_trong / day_du_co_instidentity*. */
    function layInstIdentity(mucTag, instId, thamSo) {
        var ttri = mucTag.instidentity || 'echo';
        if (ttri === 'rong') return '';
        if (typeof ttri === 'string' && ttri.indexOf('tu_truong:') === 0) return thamSo[ttri.slice(10)] || '';
        return instId;
    }

    /* ====================================================================
     * 1. SESSION  (chuyen tu session.py)
     * ================================================================== */
    /* Dong bo token song ra bien toan cuc cua trang.
       index.html cua ban goc khai bao san `var _sessionTmpToken = "\x.."` (gia tri
       CHUP SAN tu thiet bi that). Ban goc thay gia tri nay o phia server moi lan
       phuc vu '/'; web tinh khong lam duoc vay, nen sim phai gan lai bang token
       dang song - neu khong, MOI POST deu bi tra SessionTimeout.
       Ngoai ra token DOI sau moi POST (chong phat lai, giong thiet bi that) nen
       phai gan lai sau moi lan doi, khong chi mot lan luc tai trang. */
    function dongBoTokenRaTrang() {
        try {
            if (typeof window._sessionTmpToken !== 'undefined') {
                window._sessionTmpToken = Session.sessToken;
            }
        } catch (e) { }
    }

    var BO_KY_TU = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
    function chuoiNgauNhien(n) {
        var s = '';
        for (var i = 0; i < n; i++) s += BO_KY_TU.charAt(Math.floor(Math.random() * BO_KY_TU.length));
        return s;
    }

    var Session = {
        sessToken: chuoiNgauNhien(24),
        loginToken: null,
        daDangNhap: false,
        lanHoatDongCuoi: 0,
        timeoutGiay: 300,
        viewHienTai: null,
        soLanSai: 0,
        khoaDen: 0,

        conHan: function () {
            if (!this.daDangNhap) return false;
            return (Date.now() / 1000 - this.lanHoatDongCuoi) <= this.timeoutGiay;
        },
        cham: function () { this.lanHoatDongCuoi = Date.now() / 1000; this.luu(); },
        kiemToken: function (t) { return !!t && t === this.sessToken; },
        doiToken: function () {
            this.sessToken = chuoiNgauNhien(24);
            this.luu();
            dongBoTokenRaTrang();      // giu client luon gui token con hieu luc
            return this.sessToken;
        },

        luu: function () {
            try {
                sessionStorage.setItem('BE12000_session', JSON.stringify({
                    sessToken: this.sessToken, daDangNhap: this.daDangNhap,
                    lanHoatDongCuoi: this.lanHoatDongCuoi, viewHienTai: this.viewHienTai
                }));
            } catch (e) { }
        },
        khoiPhuc: function () {
            try {
                var s = JSON.parse(sessionStorage.getItem('BE12000_session') || 'null');
                if (s) {
                    this.sessToken = s.sessToken || this.sessToken;
                    this.daDangNhap = !!s.daDangNhap;
                    this.lanHoatDongCuoi = s.lanHoatDongCuoi || 0;
                    this.viewHienTai = s.viewHienTai || null;
                }
            } catch (e) { }
        },

        jsonLoginEntry: function () {
            var conKhoa = Math.max(0, Math.floor(this.khoaDen - Date.now() / 1000));
            return JSON.stringify({
                lockingTime: conKhoa, loginErrMsg: '', promptMsg: '', sess_token: this.sessToken
            });
        },

        xmlLoginToken: function () {
            this.loginToken = chuoiNgauNhien(8);
            this.luu();
            try { sessionStorage.setItem('BE12000_loginToken', this.loginToken); } catch (e) { }
            return '<?xml version="1.0"?>\n<ajax_response_xml_root>' + this.loginToken + '</ajax_response_xml_root>';
        },

        // sha256(matkhau + muoi) -- doc nguyen van tu g_loginToken() cua thiet bi that
        dangNhap: function (ten, matKhauBam, tokenGui) {
            var conKhoa = Math.max(0, Math.floor(this.khoaDen - Date.now() / 1000));
            if (conKhoa > 0) {
                return { body: JSON.stringify({ lockingTime: conKhoa, loginErrMsg: 'locking', promptMsg: '', sess_token: this.doiToken() }), ok: false };
            }
            if (!this.kiemToken(tokenGui)) {
                return { body: JSON.stringify({ lockingTime: 0, loginErrMsg: 'token', promptMsg: '', sess_token: this.doiToken() }), ok: false };
            }
            var muoi = this.loginToken;
            try { muoi = muoi || sessionStorage.getItem('BE12000_loginToken'); } catch (e) { }
            var mongDoi = sha256(MAT_KHAU + (muoi || ''));
            this.loginToken = null;                     // muoi dung mot lan

            if (ten === TEN_DANG_NHAP && String(matKhauBam).toLowerCase() === mongDoi) {
                this.daDangNhap = true;
                this.soLanSai = 0;
                this.viewHienTai = null;
                this.cham();
                return { body: JSON.stringify({ sess_token: this.doiToken(), login_need_refresh: 1 }), ok: true };
            }
            this.soLanSai++;
            if (this.soLanSai >= 5) { this.khoaDen = Date.now() / 1000 + 60; this.soLanSai = 0; }
            return {
                body: JSON.stringify({
                    lockingTime: Math.max(0, Math.floor(this.khoaDen - Date.now() / 1000)),
                    loginErrMsg: 'failed', promptMsg: '', sess_token: this.doiToken()
                }), ok: false
            };
        },

        dangXuat: function () {
            this.daDangNhap = false;
            this.viewHienTai = null;
            this.doiToken();
            return JSON.stringify({ need_refresh: 1 });
        }
    };
    Session.khoiPhuc();

    /* ====================================================================
     * 2. STORE  (chuyen tu config_store.py)
     * ================================================================== */
    var Store = {
        _st: null,

        state: function () {
            if (this._st) return this._st;
            var luu = null;
            try { luu = localStorage.getItem(KHOA_LUU); } catch (e) { }
            if (luu) { try { this._st = JSON.parse(luu); } catch (e) { this._st = null; } }
            if (!this._st) this._st = banSao(SEED.factory || {});
            return this._st;
        },
        luu: function () {
            try { localStorage.setItem(KHOA_LUU, JSON.stringify(this._st)); } catch (e) { }
        },
        datLaiFactory: function () { this._st = banSao(SEED.factory || {}); this.luu(); },

        mucTag: function (tag) { return (this.state().dataTags || {})[tag] || null; },
        // Python: data_tag in dataTags OR data_tag in jsonDataTags (jsonThoDataTags
        // KHONG duoc kiem rieng - cac dataTag do van co mat trong dataTags, vd topo_lua.lua).
        coDataTag: function (tag) {
            return !!this.mucTag(tag) || !!(this.state().jsonDataTags || {})[tag];
        },

        dinhDang: function (tag) {
            var s = this.state();
            if ((s.jsonDataTags || {})[tag]) return 'json';
            if ((s.jsonThoDataTags || {})[tag]) return 'json_tho';
            var m = this.mucTag(tag) || {};
            if (m.dinhDangDoc === 'duong_dan_tho') return 'duong_dan_tho';
            return 'xml';
        },

        doiTuongCua: function (tag) { return (this.mucTag(tag) || {}).objects || []; },

        thuTuPara: function (tag, tenObj) {
            // Python: "if rieng:" coi [] la falsy -> roi ve paraOrder mac dinh cua
            // object. JS coi [] la truthy nen phai kiem .length rieng de khop hanh vi.
            var m = this.mucTag(tag) || {};
            var rieng = m.paraOrder && m.paraOrder[tenObj];
            if (rieng && rieng.length) return rieng;
            var o = (this.state().objects || {})[tenObj] || {};
            return o.paraOrder || [];
        },

        instances: function (tenObj) {
            var o = (this.state().objects || {})[tenObj] || {};
            return o.instances || [];
        },

        sinhKhoiObj: function (p, tag, tenObj, dsInstanceGhiDe, dsTruongGhiDe) {
            var thuTu = dsTruongGhiDe || this.thuTuPara(tag, tenObj);
            var dinhNghia = (this.state().objects || {})[tenObj] || {};
            var bocRieng = !!dinhNghia.bocRiengTungInstance;
            var ds = dsInstanceGhiDe || this.instances(tenObj);

            if (bocRieng) {
                ds.forEach(function (muc) {
                    p.push('<' + tenObj + '>', '<Instance>');
                    thuTu.forEach(function (ten) {
                        if (ten in muc) p.push('<ParaName>' + ten + '</ParaName><ParaValue>' + thoat(muc[ten]) + '</ParaValue>');
                    });
                    p.push('</Instance>', '</' + tenObj + '>');
                });
                return;
            }
            p.push('<' + tenObj + '>');
            ds.forEach(function (muc) {
                p.push('<Instance>');
                thuTu.forEach(function (ten) {
                    if (ten in muc) p.push('<ParaName>' + ten + '</ParaName><ParaValue>' + thoat(muc[ten]) + '</ParaValue>');
                });
                p.push('</Instance>');
            });
            p.push('</' + tenObj + '>');
        },

        /* xml_cho() - dinh dang y het thiet bi that.
           Nhanh LOI giu khai bao <?xml?> + xuong dong (nguyen ban
           wan_internet_lua.lua); nhanh THANH CONG 1 dong, khong khai bao
           (2 mau bang chung dong nhat: sntp_lua.lua, energy_config_lua.lua). */
        xmlCho: function (tag, maLoi, theThemSauHeader, dsDoiTuong) {
            if (maLoi) {
                return ['<?xml version="1.0"?>', '<ajax_response_xml_root>',
                    '<IF_ERRORSTR>' + maLoi + '</IF_ERRORSTR>',
                    '<IF_ERRORPARAM>SUCC</IF_ERRORPARAM>',
                    '<IF_ERRORTYPE>SUCC</IF_ERRORTYPE>',
                    '</ajax_response_xml_root>'].join('\n');
            }
            var p = ['<ajax_response_xml_root>',
                '<IF_ERRORPARAM>SUCC</IF_ERRORPARAM>',
                '<IF_ERRORTYPE>SUCC</IF_ERRORTYPE>',
                '<IF_ERRORSTR>SUCC</IF_ERRORSTR>',
                '<IF_ERRORID>0</IF_ERRORID>'];
            if (theThemSauHeader) p.push(theThemSauHeader);

            var m = this.mucTag(tag) || {};
            var self = this;
            if (dsDoiTuong) {
                dsDoiTuong.forEach(function (o) { self.sinhKhoiObj(p, tag, o); });
            } else if (m.renderOrder) {
                var scalar = m.scalarTags || {};
                m.renderOrder.forEach(function (lenh) {
                    var i = lenh.indexOf(':');
                    var loai = lenh.slice(0, i), ten = lenh.slice(i + 1);
                    if (loai === 'scalar') p.push('<' + ten + '>' + thoat(scalar[ten] || '') + '</' + ten + '>');
                    else self.sinhKhoiObj(p, tag, ten);
                });
            } else {
                this.doiTuongCua(tag).forEach(function (o) { self.sinhKhoiObj(p, tag, o); });
            }
            p.push('</ajax_response_xml_root>');
            return p.join('');
        },

        jsonCho: function (tag, maLoi) {
            var d = (this.state().jsonDataTags || {})[tag];
            if (maLoi) return JSON.stringify({ IF_ERRORSTR: maLoi });
            return JSON.stringify(d && d.noiDung !== undefined ? d.noiDung : (d || {}));
        },
        jsonThoCho: function (tag) {
            var d = (this.state().jsonThoDataTags || {})[tag];
            return JSON.stringify(d && d.noiDung !== undefined ? d.noiDung : (d || {}));
        },

        dinhNghiaObj: function (tenObj) { return (this.state().objects || {})[tenObj] || {}; },

        /* ghi() - ghi cac truong vao instance thu <inst> cua object.
           Tra ve danh sach truong da doi. Chi ghi truong DA TON TAI trong
           instance (nhu ban goc): truong la thi bo qua, khong tu them moi. */
        ghi: function (tenObj, thuocObj, inst) {
            var ds = this.instances(tenObj);
            var i = inst || 0;
            if (!ds[i]) return [];
            var daDoi = [];
            for (var k in thuocObj) {
                if (!Object.prototype.hasOwnProperty.call(thuocObj, k)) continue;
                if (!(k in ds[i])) continue;
                if (String(ds[i][k]) !== String(thuocObj[k])) {
                    ds[i][k] = thuocObj[k];
                    daDoi.push(k);
                }
            }
            return daDoi;
        },

        /* chi_so_ghi_mac_dinh() - chon INDEX instance de ghi trong nhanh ghi
           MAC DINH, khi object khai bao chonTheoTruong (vd OBJ_PORT_BINDING_ID:
           nhieu instance, khong _InstID, chon qua gia tri 1 truong rieng nhu
           WANViewName). Khong khai bao -> tra 0 (hanh vi cu, khong doi). */
        chiSoGhiMacDinh: function (tenObj, thamSo) {
            var obj = this.dinhNghiaObj(tenObj);
            var tenTruong = obj.chonTheoTruong;
            if (!tenTruong) return 0;
            var giaTriCanTim = (thamSo || {})[tenTruong];
            if (giaTriCanTim === undefined) return 0;
            var ds = this.instances(tenObj);
            for (var i = 0; i < ds.length; i++) {
                if (ds[i][tenTruong] === giaTriCanTim) return i;
            }
            return 0;
        },

        /* ---- doi tuong KIEU DANH SACH (them/xoa item, vd Local Service Control) ---- */
        laDoiTuongDanhSach: function (tenObj) { return this.dinhNghiaObj(tenObj).danhSach || null; },
        truongIdDanhSach: function (tenObj) {
            var ds = this.dinhNghiaObj(tenObj).danhSach || {};
            return ds.truongId || '_InstID';
        },
        laDoiTuongChiSo: function (tenObj) { return this.dinhNghiaObj(tenObj).danhSachChiSo || null; },

        chiSoTheoInstId: function (tenObj, instIdValue) {
            var truongId = this.truongIdDanhSach(tenObj);
            var ds = this.instances(tenObj);
            for (var i = 0; i < ds.length; i++) {
                if (ds[i][truongId] === instIdValue) return i;
            }
            return -1;
        },

        taoInstanceMoi: function (tenObj, capGiaTri) {
            var obj = this.dinhNghiaObj(tenObj);
            var danhSach = obj.danhSach;
            if (!danhSach) return null;
            var doiTuong = (this.state().objects || {})[tenObj];
            doiTuong.instances = doiTuong.instances || [];
            var soHienTai = doiTuong.instances.length;
            var moiId = (danhSach.tienToId || '') + (soHienTai + 1);
            var truongId = danhSach.truongId || '_InstID';
            var thuTu = obj.paraOrder || [];
            var mucMoi = {};
            thuTu.forEach(function (ten) { mucMoi[ten] = ''; });
            for (var k in capGiaTri) {
                if (Object.prototype.hasOwnProperty.call(capGiaTri, k) && k in mucMoi) mucMoi[k] = capGiaTri[k];
            }
            mucMoi[truongId] = moiId;    // ID luon tu sinh, khong bi capGiaTri ghi de
            doiTuong.instances.push(mucMoi);
            return moiId;
        },

        ghiTheoInstId: function (tenObj, instIdValue, capGiaTri) {
            var idx = this.chiSoTheoInstId(tenObj, instIdValue);
            if (idx < 0) return [];
            return this.ghi(tenObj, capGiaTri, idx);
        },

        xoaInstance: function (tenObj, instIdValue) {
            var doiTuong = (this.state().objects || {})[tenObj];
            if (!doiTuong) return false;
            var idx = this.chiSoTheoInstId(tenObj, instIdValue);
            if (idx < 0) return false;
            doiTuong.instances.splice(idx, 1);
            return true;
        },

        /* ---- dataTag KIEU JSON (cay luu tru rieng, vd multicast_model.lua) ---- */
        doiTuongJsonCua: function (tag) {
            var m = (this.state().jsonDataTags || {})[tag] || {};
            return Object.keys(m.objects || {});
        },
        ghiJson: function (tag, tenObj, capGiaTri) {
            var m = (this.state().jsonDataTags || {})[tag];
            if (!m) return [];
            var obj = (m.objects || {})[tenObj];
            if (!obj) return [];
            obj.instances = obj.instances || [];
            if (!obj.instances[0]) obj.instances[0] = {};
            var hang = obj.instances[0];
            var daDoi = [];
            for (var k in capGiaTri) {
                if (!Object.prototype.hasOwnProperty.call(capGiaTri, k)) continue;
                if (!(k in hang)) continue;
                if (hang[k] !== capGiaTri[k]) { hang[k] = capGiaTri[k]; daDoi.push(k); }
            }
            return daDoi;
        },
        jsonGhiThanhCong: function () {
            return JSON.stringify({ IF_ERRORPARAM: 'SUCC', IF_ERRORTYPE: 'SUCC', IF_ERRORSTR: 'SUCC', IF_ERRORID: 0 });
        },

        /* ---- ngoai le dinh dang: tai file rong, duong dan tho, 2-buoc ---- */
        laTaiFileRong: function (tag) { return (this.mucTag(tag) || {}).dinhDangGhi === 'tai_file_rong'; },
        duongDanThoCho: function (tag, thamSo) {
            var m = this.mucTag(tag) || {};
            var tenTso = m.thamSoDuongDan || 'querydir';
            return ((thamSo || {})[tenTso] || '') + '|';
        },
        hanhDongTheoBuoc: function (tag) { return (this.mucTag(tag) || {}).hanhDongTheoBuoc || null; },

        /* xml_ghi_thanhcong() - dinh dang phan hoi GHI, KHAC NHAU tuy dataTag
           (chon qua dataTags[tag].ghiDangKieu). Cac dang da co bang chung that. */
        xmlGhiThanhCong: function (tag, thamSo, ghiDeDang, truongIdThe) {
            var m = this.mucTag(tag) || {};
            var dang = ghiDeDang || m.ghiDangKieu || null;
            var tenTheId = truongIdThe || '_InstID';
            var instId = thamSo[tenTheId] || thamSo['_InstID'] || '';

            if (dang === 'xac_nhan_trong') {
                var ident = layInstIdentity(m, instId, thamSo);
                return ['<ajax_response_xml_root>',
                    '<INSTIDENTITY>' + thoat(ident) + '</INSTIDENTITY>',
                    '<IF_ERRORID>0</IF_ERRORID>',
                    '<IF_ERRORTYPE>SUCC</IF_ERRORTYPE>',
                    '<IF_ERRORSTR>SUCC</IF_ERRORSTR>',
                    '<IF_ERRORPARAM>SUCC</IF_ERRORPARAM>',
                    '</ajax_response_xml_root>'].join('');
            }

            if (dang === 'rut_gon') {
                var p = ['<ajax_response_xml_root>',
                    '<INSTIDENTITY>' + thoat(instId) + '</INSTIDENTITY>',
                    '<IF_ERRORID>0</IF_ERRORID>',
                    '<IF_ERRORTYPE>SUCC</IF_ERRORTYPE>',
                    '<IF_ERRORSTR>SUCC</IF_ERRORSTR>',
                    '<IF_ERRORPARAM>SUCC</IF_ERRORPARAM>',
                    '<' + tenTheId + '>' + thoat(instId) + '</' + tenTheId + '>'];
                if (m.theThemSauRutGon) p.push(m.theThemSauRutGon);
                p.push('</ajax_response_xml_root>');
                return p.join('');
            }

            if (dang === 'xoa_gon') {
                return ['<ajax_response_xml_root>',
                    '<IF_ERRORPARAM>SUCC</IF_ERRORPARAM>',
                    '<IF_ERRORTYPE>SUCC</IF_ERRORTYPE>',
                    '<IF_ERRORSTR>SUCC</IF_ERRORSTR>',
                    '<IF_ERRORID>0</IF_ERRORID>',
                    '<' + tenTheId + '></' + tenTheId + '>',
                    '</ajax_response_xml_root>'].join('');
            }

            if (dang === 'day_du_co_instidentity') {
                // wlan_wps_lua.lua: INSTIDENTITY dau, KHONG _InstID, du lieu object
                // DAY DU (mac dinh doiTuongCua() hoac doiTuongGhiRieng neu co han che).
                var idn = layInstIdentity(m, instId, thamSo);
                var p1 = ['<ajax_response_xml_root>',
                    '<INSTIDENTITY>' + thoat(idn) + '</INSTIDENTITY>',
                    '<IF_ERRORID>0</IF_ERRORID>',
                    '<IF_ERRORTYPE>SUCC</IF_ERRORTYPE>',
                    '<IF_ERRORSTR>SUCC</IF_ERRORSTR>',
                    '<IF_ERRORPARAM>SUCC</IF_ERRORPARAM>'];
                var dsTenObj = m.doiTuongGhiRieng || this.doiTuongCua(tag);
                var truongRieng = m.truongGhiRieng || {};
                var self1 = this;
                dsTenObj.forEach(function (tenObj) {
                    var dinhNghia = self1.dinhNghiaObj(tenObj);
                    var dsTruong = truongRieng[tenObj];
                    if (dinhNghia.bocRiengTungInstance) {
                        var dsInst = self1.instances(tenObj).filter(function (i) { return i._InstID === idn; }).slice(0, 1);
                        self1.sinhKhoiObj(p1, tag, tenObj, dsInst, dsTruong);
                    } else {
                        self1.sinhKhoiObj(p1, tag, tenObj, null, dsTruong);
                    }
                });
                p1.push('</ajax_response_xml_root>');
                return p1.join('');
            }

            if (dang === 'day_du_co_instidentity_va_instid') {
                // dhcp6s_dhcpserver_lua.lua: INSTIDENTITY (tu truong khac) + _InstID
                // (echo top-level) + du lieu object DAY DU.
                var idn2 = layInstIdentity(m, instId, thamSo);
                var p2 = ['<ajax_response_xml_root>',
                    '<INSTIDENTITY>' + thoat(idn2) + '</INSTIDENTITY>',
                    '<IF_ERRORID>0</IF_ERRORID>',
                    '<IF_ERRORTYPE>SUCC</IF_ERRORTYPE>',
                    '<IF_ERRORSTR>SUCC</IF_ERRORSTR>',
                    '<IF_ERRORPARAM>SUCC</IF_ERRORPARAM>',
                    '<_InstID>' + thoat(instId) + '</_InstID>'];
                var dsTenObj2 = m.doiTuongGhiRieng || this.doiTuongCua(tag);
                var self2 = this;
                dsTenObj2.forEach(function (tenObj) { self2.sinhKhoiObj(p2, tag, tenObj); });
                p2.push('</ajax_response_xml_root>');
                return p2.join('');
            }

            if (dang === 'day_du_gioi_han') {
                // wlan_wlanbasicadconf_lua.lua: dang day_du (header PARAM,TYPE,STR,ID),
                // KHONG INSTIDENTITY, KHONG _InstID, CHI echo object trong doiTuongGhiRieng.
                return this.xmlCho(tag, null, null, m.doiTuongGhiRieng || []);
            }

            if (dang === 'toi_gian') {
                return ['<ajax_response_xml_root>',
                    '<IF_ERRORID>0</IF_ERRORID>',
                    '<IF_ERRORTYPE>SUCC</IF_ERRORTYPE>',
                    '<IF_ERRORSTR>SUCC</IF_ERRORSTR>',
                    '<IF_ERRORPARAM>SUCC</IF_ERRORPARAM>',
                    '</ajax_response_xml_root>'].join('');
            }

            // Mac dinh (dang "day_du" kieu sntp_lua.lua): echo <_InstID> + du lieu day du
            return this.xmlCho(tag, null, '<_InstID>' + thoat(instId) + '</_InstID>');
        }
    };

    /* ====================================================================
     * 3. DISPATCH  (chuyen tu dispatch.py)
     * ================================================================== */
    // Thay MOI cho _sessionTmpToken="\x.." bang token dang song.
    // Bat buoc: neu khong, script nhung trong fragment views/*.html se ghi de
    // token dung bang gia tri CU chup san -> moi Apply deu bi SessionTimeout.
    var MAU_TOKEN = /(_sessionTmpToken\s*=\s*")((?:\\x[0-9a-fA-F]{2})+)(")/g;
    function hexEscape(s) {
        var r = '';
        for (var i = 0; i < s.length; i++) {
            var h = s.charCodeAt(i).toString(16);
            r += '\\x' + (h.length < 2 ? '0' + h : h);
        }
        return r;
    }
    function thayTokenSong(html, token) {
        return html.replace(MAU_TOKEN, function (m, a, b, c) { return a + hexEscape(token) + c; });
    }
    window.BE12000_thayTokenSong = thayTokenSong;

    function dungNguCanh(dataTag) {
        var choPhep = NGU_CANH[dataTag];
        if (!choPhep || !choPhep.length) return true;   // chua co bang chung -> khong chan
        return choPhep.indexOf(Session.viewHienTai) >= 0;
    }

    function trang404() {
        return '<html>\n    <head>\n        <title>404 Not Found</title>\n    </head>\n'
            + '    <body>\n        <h1>404 Not Found</h1>\n    </body>\n</html>';
    }

    function phanTichThamSo(chuoi) {
        var ra = {};
        (chuoi || '').split('&').forEach(function (c) {
            if (!c) return;
            var i = c.indexOf('=');
            var k = i < 0 ? c : c.slice(0, i);
            var v = i < 0 ? '' : c.slice(i + 1);
            try { ra[decodeURIComponent(k.replace(/\+/g, ' '))] = decodeURIComponent(v.replace(/\+/g, ' ')); }
            catch (e) { ra[k] = v; }
        });
        return ra;
    }

    /* Xu ly mot "request" -> {body, kieu, ma} */
    function xuLy(method, url, body) {
        var q = url.indexOf('?');
        var ts = phanTichThamSo(q < 0 ? '' : url.slice(q + 1));
        if (method === 'POST' && body) {
            var tsBody = phanTichThamSo(body);
            for (var k in tsBody) if (Object.prototype.hasOwnProperty.call(tsBody, k)) ts[k] = tsBody[k];
        }
        var loai = ts._type, tag = ts._tag;

        // ---- loginData ----
        if (loai === 'loginData') {
            if (tag === 'login_entry' && method === 'GET') return { body: Session.jsonLoginEntry(), kieu: 'application/json', ma: 200 };
            if (tag === 'login_token') return { body: Session.xmlLoginToken(), kieu: 'text/xml', ma: 200 };
            if (tag === 'login_entry' && method === 'POST') {
                var kq = Session.dangNhap(ts.Username || ts.username || TEN_DANG_NHAP,
                    ts.Password || ts.password || '', ts._sessionTOKEN);
                return { body: kq.body, kieu: 'application/json', ma: 200 };
            }
            if (tag === 'logout_entry') return { body: Session.dangXuat(), kieu: 'application/json', ma: 200 };
            if (tag === 'modeswitch_entry') return { body: JSON.stringify({ need_refresh: 1 }), kieu: 'application/json', ma: 200 };
            return { body: JSON.stringify({}), kieu: 'application/json', ma: 200 };
        }

        // ---- hiddenData (doi ngon ngu, gio he thong...) ----
        if (loai === 'hiddenData') {
            Session.doiToken();
            return { body: JSON.stringify({ need_refresh: 0, sess_token: Session.sessToken }), kieu: 'application/json', ma: 200 };
        }

        // Chua dang nhap -> giong server.py: menuData tra SessionTimeout, menuView tra 404
        if ((loai === 'menuView' || loai === 'menuData') && !Session.conHan()) {
            if (loai === 'menuData') return { body: Store.xmlCho(tag || '', 'SessionTimeout'), kieu: 'text/xml', ma: 200 };
            return { body: trang404(), kieu: 'text/html', ma: 404 };
        }

        // ---- menuView: tra fragment views/<tag>.html (nap dong ben duoi) ----
        if (loai === 'menuView') {
            Session.cham();
            return { chuyenTiepView: tag };
        }

        // ---- menuData ----
        if (loai === 'menuData') {
            Session.cham();
            if (!Store.coDataTag(tag)) return { body: trang404(), kieu: 'text/html', ma: 404 };
            var dd = Store.dinhDang(tag);

            if (method === 'GET') {
                // ngoai le thu 3: van ban thuan (vd dms_querydir_lua.lua) - tham_so o
                // day la CAC THAM SO URL cua GET, khong lien quan _sessionTOKEN/ngu canh
                if (dd === 'duong_dan_tho') return { body: Store.duongDanThoCho(tag, ts), kieu: 'text/plain', ma: 200 };
                if (dd === 'json') {
                    if (!dungNguCanh(tag)) return { body: Store.jsonCho(tag, 'SessionTimeout'), kieu: 'application/json', ma: 200 };
                    return { body: Store.jsonCho(tag), kieu: 'application/json', ma: 200 };
                }
                if (dd === 'json_tho') return { body: Store.jsonThoCho(tag), kieu: 'application/json', ma: 200 };
                if (!dungNguCanh(tag)) return { body: Store.xmlCho(tag, 'SessionTimeout'), kieu: 'text/xml', ma: 200 };
                return { body: Store.xmlCho(tag), kieu: 'text/xml', ma: 200 };
            }

            // POST = GHI
            // Ngoai le HOAN TOAN KHAC hop dong: endpoint TAI FILE (multipart,
            // khong _sessionTOKEN). Phai xu ly TRUOC buoc kiem token thong
            // thuong. Bang chung that: noi dung RONG (thiet bi chua co log).
            if (Store.laTaiFileRong(tag)) {
                return { body: '', kieu: 'application/octet-stream;', ma: 200 };
            }

            if (!Session.kiemToken(ts._sessionTOKEN)) {
                return { body: Store.xmlCho(tag, 'SessionTimeout'), kieu: 'text/xml', ma: 200 };
            }
            var boQua = { IF_ACTION: 1, _InstID: 1, _sessionTOKEN: 1 };
            var giaTri = {};
            for (var k2 in ts) {
                if (!Object.prototype.hasOwnProperty.call(ts, k2)) continue;
                if (boQua[k2] || k2.indexOf('Btn_') === 0 || k2 === '_type' || k2 === '_tag') continue;
                giaTri[k2] = ts[k2];
            }

            // dataTag KIEU JSON (cay luu tru rieng, khong dung doiTuongCua()/ghi() cua nhanh XML)
            if (Store.dinhDang(tag) === 'json') {
                Store.doiTuongJsonCua(tag).forEach(function (tenObj) {
                    Store.ghiJson(tag, tenObj, giaTri);
                });
                Store.luu();
                Session.doiToken();
                Session.cham();
                return { body: Store.jsonGhiThanhCong(tag), kieu: 'application/json', ma: 200 };
            }

            var dsTenObj = Store.doiTuongCua(tag);

            // doi tuong KIEU DANH SACH (them/xoa item qua "Create New Item"/thung rac)
            // - phai xu ly TRUOC nhanh ghi() thong thuong: _InstID=-1 (tao moi) khong
            // tuong ung instance nao co san, Delete khong duoc ghi() ho tro.
            if (dsTenObj.length && Store.laDoiTuongDanhSach(dsTenObj[0])) {
                var tenObjDS = dsTenObj[0];
                var truongId = Store.truongIdDanhSach(tenObjDS);
                var hanhDong = ts.IF_ACTION || '';
                var tsMoi = {};
                for (var kk in ts) if (Object.prototype.hasOwnProperty.call(ts, kk)) tsMoi[kk] = ts[kk];

                if (hanhDong === 'Delete') {
                    Store.xoaInstance(tenObjDS, ts[truongId] || '');
                    Store.luu();
                    Session.doiToken();
                    Session.cham();
                    tsMoi[truongId] = '';
                    return { body: Store.xmlGhiThanhCong(tag, tsMoi, 'xoa_gon', truongId), kieu: 'text/xml', ma: 200 };
                }

                var thuocObjDS = {};
                var thuTuDS = Store.thuTuPara(tag, tenObjDS);
                thuTuDS.forEach(function (t) { if (t in giaTri && t !== truongId) thuocObjDS[t] = giaTri[t]; });
                var instIdGui = ts[truongId] || '';
                if (instIdGui === '-1') {
                    var moiId = Store.taoInstanceMoi(tenObjDS, thuocObjDS);
                    tsMoi[truongId] = moiId || '';
                } else {
                    Store.ghiTheoInstId(tenObjDS, instIdGui, thuocObjDS);
                }
                Store.luu();
                Session.doiToken();
                Session.cham();
                return { body: Store.xmlGhiThanhCong(tag, tsMoi, 'rut_gon', truongId), kieu: 'text/xml', ma: 200 };
            }

            // doi tuong KIEU CHI SO (sua NHIEU instance CO SAN trong 1 POST, hau to _<n>
            // - vd Remote Service Port Control: _InstNum, _InstID_0.._InstID_N)
            if (dsTenObj.length && Store.laDoiTuongChiSo(dsTenObj[0])) {
                var tenObjCS = dsTenObj[0];
                var thuTuCS = Store.thuTuPara(tag, tenObjCS);
                var soLuong = parseInt(ts._InstNum || '0', 10) || 0;
                for (var i = 0; i < soLuong; i++) {
                    var instIdI = ts['_InstID_' + i] || '';
                    if (!instIdI) continue;
                    var thuocObjCS = {};
                    thuTuCS.forEach(function (truong) {
                        if (truong === '_InstID') return;
                        var khoa = truong + '_' + i;
                        if (khoa in ts) thuocObjCS[truong] = ts[khoa];
                    });
                    if (Object.keys(thuocObjCS).length) Store.ghiTheoInstId(tenObjCS, instIdI, thuocObjCS);
                }
                Store.luu();
                Session.doiToken();
                Session.cham();
                return { body: Store.xmlGhiThanhCong(tag, ts, 'xac_nhan_trong'), kieu: 'text/xml', ma: 200 };
            }

            // dataTag co QUY TRINH 2 BUOC (IF_ACTION khac nhau, moi buoc ghi/khong ghi
            // + dang response RIENG) - vd IPv6 Switch: Apply khong ghi, Restart moi ghi
            var buocHanhDong = Store.hanhDongTheoBuoc(tag);
            var hanhDongHienTai = ts.IF_ACTION || '';
            if (buocHanhDong && buocHanhDong[hanhDongHienTai]) {
                var cauHinhBuoc = buocHanhDong[hanhDongHienTai];
                if (cauHinhBuoc.ghi !== false) {
                    dsTenObj.forEach(function (tenObj) {
                        var thuTu = Store.thuTuPara(tag, tenObj);
                        var thuocObj = {};
                        thuTu.forEach(function (t) { if (t in giaTri) thuocObj[t] = giaTri[t]; });
                        if (Object.keys(thuocObj).length) Store.ghi(tenObj, thuocObj, 0);
                    });
                    Store.luu();
                    // Token CHI xoay o buoc THAT SU ghi (Apply/Restart co token giong nhau)
                    Session.doiToken();
                }
                Session.cham();
                return { body: Store.xmlGhiThanhCong(tag, ts, cauHinhBuoc.dang), kieu: 'text/xml', ma: 200 };
            }

            // Nhanh ghi MAC DINH (~70 dataTag chi co 1 instance/khong can chon)
            dsTenObj.forEach(function (tenObj) {
                var thuTu = Store.thuTuPara(tag, tenObj);
                var thuocObj = {};
                thuTu.forEach(function (t) { if (t in giaTri) thuocObj[t] = giaTri[t]; });
                if (Object.keys(thuocObj).length) {
                    var viTri = Store.chiSoGhiMacDinh(tenObj, ts);
                    Store.ghi(tenObj, thuocObj, viTri);
                }
            });
            Store.luu();
            Session.doiToken();
            Session.cham();
            return { body: Store.xmlGhiThanhCong(tag, ts), kieu: 'text/xml', ma: 200 };
        }

        return null;   // khong phai request cua thiet bi -> de trinh duyet xu ly binh thuong
    }

    /* ====================================================================
     * 4. CHAN XMLHttpRequest (client dung jQuery $.ajax/$.post/$.get)
     * ================================================================== */
    var XHRGoc = window.XMLHttpRequest;

    function XHRGia() {
        this._that = new XHRGoc();
        this._chan = false;
        this.readyState = 0;
        this.status = 0;
        this.responseText = '';
        this.responseXML = null;
        this.onreadystatechange = null;
        this.onload = null;
        this.onerror = null;
        this.ontimeout = null;
    }

    XHRGia.prototype.open = function (method, url) {
        this._method = (method || 'GET').toUpperCase();
        this._url = url || '';
        this._chan = this._url.indexOf('_type=') >= 0;
        if (!this._chan) return this._that.open.apply(this._that, arguments);
        this.readyState = 1;
    };

    XHRGia.prototype.setRequestHeader = function () {
        if (!this._chan) return this._that.setRequestHeader.apply(this._that, arguments);
    };

    XHRGia.prototype.getAllResponseHeaders = function () {
        if (!this._chan) return this._that.getAllResponseHeaders();
        return 'content-type: ' + (this._kieu || 'text/plain') + '\r\n';
    };
    XHRGia.prototype.getResponseHeader = function (h) {
        if (!this._chan) return this._that.getResponseHeader(h);
        if (String(h).toLowerCase() === 'content-type') return this._kieu || 'text/plain';
        return null;
    };
    XHRGia.prototype.abort = function () { if (!this._chan) return this._that.abort(); };

    XHRGia.prototype.send = function (body) {
        var self = this;
        if (!this._chan) {
            // chuyen tiep su kien cua XHR that
            ['readyState', 'status', 'responseText', 'responseXML', 'response'].forEach(function () { });
            this._that.onreadystatechange = function () {
                self.readyState = self._that.readyState;
                self.status = self._that.status;
                try { self.responseText = self._that.responseText; } catch (e) { }
                try { self.responseXML = self._that.responseXML; } catch (e) { }
                try { self.response = self._that.response; } catch (e) { }
                if (self.onreadystatechange) self.onreadystatechange();
                if (self.readyState === 4 && self.onload) self.onload();
            };
            return this._that.send(body);
        }

        var kq = xuLy(this._method, this._url, typeof body === 'string' ? body : null);

        var hoanTat = function (noiDung, kieu, ma) {
            self._kieu = kieu;
            self.status = ma;
            self.responseText = noiDung;
            self.response = noiDung;
            if (/xml/.test(kieu)) {
                try { self.responseXML = new DOMParser().parseFromString(noiDung, 'text/xml'); } catch (e) { self.responseXML = null; }
            }
            self.readyState = 4;
            if (self.onreadystatechange) self.onreadystatechange();
            if (self.onload) self.onload();
        };

        if (!kq) { return hoanTat('', 'text/plain', 404); }

        // menuView: phai nap file views/<tag>.html roi thay token
        if (kq.chuyenTiepView) {
            var tag = kq.chuyenTiepView;
            if (!/^[A-Za-z0-9_]+$/.test(tag)) return setTimeout(function () { hoanTat(trang404(), 'text/html', 404); }, 0);
            var x = new XHRGoc();
            x.open('GET', '../views/' + tag + '.html', true);
            x.onload = function () {
                if (x.status >= 200 && x.status < 300) {
                    Session.viewHienTai = tag;
                    Session.luu();
                    hoanTat(thayTokenSong(x.responseText, Session.sessToken), 'text/html; charset=utf-8', 200);
                } else {
                    hoanTat(trang404(), 'text/html', 404);
                }
            };
            x.onerror = function () { hoanTat(trang404(), 'text/html', 404); };
            x.send();
            return;
        }

        setTimeout(function () { hoanTat(kq.body, kq.kieu, kq.ma); }, 0);
    };

    window.XMLHttpRequest = XHRGia;

    /* ====================================================================
     * 5. Tien ich
     * ================================================================== */
    window.BE12000_datLaiFactory = function () {
        Store.datLaiFactory();
        try { sessionStorage.removeItem('BE12000_session'); } catch (e) { }
        return true;
    };
    window.BE12000_SIM_API = { Session: Session, Store: Store, xuLy: xuLy, dongBoToken: dongBoTokenRaTrang };

    // Gan token song NGAY SAU khi cac script noi tuyen cua trang chay xong
    // (chung khai bao `var _sessionTmpToken = "<gia tri chup san>"`).
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', dongBoTokenRaTrang);
    } else {
        dongBoTokenRaTrang();
    }
    window.addEventListener('load', dongBoTokenRaTrang);

    console.log('[BE12000] Lop gia lap san sang - '
        + Object.keys((Store.state().dataTags) || {}).length + ' dataTag, '
        + Object.keys((Store.state().objects) || {}).length + ' object.');
})();
