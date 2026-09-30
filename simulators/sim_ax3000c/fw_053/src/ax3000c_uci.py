# -*- coding: utf-8 -*-
"""
UCI (OpenWrt) — doc tep /etc/config/*, dung cay "uci get", xuat lai dang uci commit.

Dung chung cho moi thiet bi chay OpenWrt/libuci (AX3000CV2 la thiet bi dau tien).

BANG CHUNG (AX3000CV2, fw 0.5.3, 2026-09-25):
  - Ten section an danh = "cfg" + %02x(so thu tu section trong goi, dem ca section
    co ten, bat dau tu 1) + %04x(djb(kieu section) mod 65536), djb: h=5381; h=h*33+c.
    Khop do that: system cfg01e48a / rngd cfg037450 / dhcp host cfg04fe63 /
    firewall redirect cfg303837 (reference/api/khung_that_uci.json, hop_dong_ghi_nhom9_bang.json).
  - Tep da qua "uci commit" co dang chuan: moi section mo dau bang dong trong,
    "config <kieu>[ '<ten>']", option/list thut 1 TAB, gia tri trong '...', cuoi tep them
    mot dong trong. Kiem: xuat(doc(t)) == t cho moi tep da commit trong
    reference/backup (tools/kiem_may_chu.py nhom BK).
  - Tep CHUA commit (nguyen ban tu firmware) giu dinh dang goc (chu thich, nhay kep,
    thut le khac) — chi doc duoc, khong xuat lai trung byte; noi goi phai giu van ban goc
    khi cau hinh khong doi.
"""


def djb(chuoi):
    h = 5381
    for c in chuoi.encode("utf-8"):
        h = (h * 33 + c) & 0xffffffff
    return h


def _tach(dong):
    """Tach mot dong uci thanh cac tu (ho tro '...', "...", \\ , # chu thich)."""
    ra, i, n = [], 0, len(dong)
    while i < n:
        c = dong[i]
        if c in " \t\r":
            i += 1
            continue
        if c == "#":
            break
        tu = ""
        while i < n and dong[i] not in " \t\r":
            c = dong[i]
            if c == "'":
                j = dong.index("'", i + 1)
                tu += dong[i + 1:j]
                i = j + 1
            elif c == '"':
                i += 1
                while dong[i] != '"':
                    if dong[i] == "\\" and i + 1 < n:
                        i += 1
                    tu += dong[i]
                    i += 1
                i += 1
            elif c == "\\" and i + 1 < n:
                tu += dong[i + 1]
                i += 2
            elif c == "#":
                break
            else:
                tu += c
                i += 1
        ra.append(tu)
        if i < n and dong[i] == "#":
            break
    return ra


def doc(van_ban):
    """
    Van ban tep -> danh sach section: [{"type", "name"(None neu an danh), "opts": [(ten, gia_tri|list)]}].
    Thu tu option giu nguyen; list gom lai tai vi tri lan xuat hien dau.
    """
    ds, sec = [], None
    for dong in van_ban.split("\n"):
        t = _tach(dong)
        if not t:
            continue
        if t[0] == "config":
            sec = {"type": t[1] if len(t) > 1 else "", "name": t[2] if len(t) > 2 else None, "opts": []}
            ds.append(sec)
        elif t[0] in ("option", "list") and sec is not None and len(t) >= 2:
            gt = t[2] if len(t) > 2 else ""
            if t[0] == "list":
                cu = next((o for o in sec["opts"] if o[0] == t[1]), None)
                if cu is not None and isinstance(cu[1], list):
                    cu[1].append(gt)
                else:
                    sec["opts"] = [o for o in sec["opts"] if o[0] != t[1]]
                    sec["opts"].append([t[1], [gt]])
            else:
                sec["opts"] = [o for o in sec["opts"] if o[0] != t[1]]
                sec["opts"].append([t[1], gt])
    return ds


def thanh_cay(ds):
    """Danh sach section -> dict dung hinh dang 'values' cua ubus uci get."""
    cay = {}
    for i, s in enumerate(ds):
        an = s["name"] is None
        ten = "cfg%02x%04x" % (i + 1, djb(s["type"]) % 65536) if an else s["name"]
        v = {".anonymous": an, ".type": s["type"], ".name": ten, ".index": i}
        for k, gt in s["opts"]:
            v[k] = list(gt) if isinstance(gt, list) else gt
        cay[ten] = v
    return cay


def tu_cay(cay):
    """Nguoc cua thanh_cay: cay 'uci get' -> danh sach section theo .index (de sua roi dung lai)."""
    ds = []
    for ten, sec in sorted(cay.items(), key=lambda kv: kv[1].get(".index", 0)):
        ds.append({"type": sec.get(".type", ""), "name": None if sec.get(".anonymous") else ten,
                   "opts": [[k, list(v) if isinstance(v, list) else v]
                            for k, v in sec.items() if not k.startswith(".")]})
    return ds


def ten_cac_section(ds):
    """Ten (co ten hoac cfgXXXXXX) cua tung section trong danh sach, dung quy tac thanh_cay."""
    return [s["name"] if s["name"] is not None else "cfg%02x%04x" % (i + 1, djb(s["type"]) % 65536)
            for i, s in enumerate(ds)]


def dat_option(sec, k, v):
    """
    Quy tac ghi DO THAT (AX3000CV2 2026-09-25, uci set + moi data_repo *_set):
      gia tri doi / option moi -> option CHUYEN XUONG CUOI section;
      gia tri giu nguyen -> giu cho; '' hoac None -> XOA option (do: systemlog server '').
    Tra ve True neu co thay doi.
    """
    cu = next((o for o in sec["opts"] if o[0] == k), None)
    if v is None or v == "" or v == []:
        if cu is None:
            return False
        sec["opts"].remove(cu)
        return True
    if cu is not None and cu[1] == v:
        return False
    if cu is not None:
        sec["opts"].remove(cu)
    sec["opts"].append([k, list(v) if isinstance(v, list) else v])
    return True


def _q(v):
    return "'" + str(v).replace("'", "'\\''") + "'"


def xuat(cay):
    """Cay 'uci get' -> van ban tep dang uci commit (dinh dang da do)."""
    ra = ""
    for ten, sec in sorted(cay.items(), key=lambda kv: kv[1].get(".index", 0)):
        ra += "\nconfig " + sec.get(".type", "")
        if not sec.get(".anonymous"):
            ra += " " + _q(ten)
        ra += "\n"
        for k, v in sec.items():
            if k.startswith("."):
                continue
            if isinstance(v, list):
                for x in v:
                    ra += "\tlist " + k + " " + _q(x) + "\n"
            else:
                ra += "\toption " + k + " " + _q(v) + "\n"
    return ra + "\n"
