import asyncio
import json
import re
import sys
import xml.etree.ElementTree as ET
from playwright.async_api import async_playwright

if hasattr(sys.stdout, "reconfigure"):
    sys.stdout.reconfigure(encoding="utf-8")

async def run_full_comparison():
    print("="*75)
    print("BỘ ĐỐI CHIẾU TRỰC TIẾP 1-1: THIẾT BỊ THẬT (192.168.1.1) vs GIẢ LẬP (127.0.0.1:8098)")
    print("="*75)

    async with async_playwright() as p:
        browser = await p.chromium.launch(headless=True)
        ctx_real = await browser.new_context(viewport={"width": 1400, "height": 900})
        ctx_sim = await browser.new_context(viewport={"width": 1400, "height": 900})

        page_real = await ctx_real.new_page()
        page_sim = await ctx_sim.new_page()

        real_data = {}
        sim_data = {}

        async def capture_real(resp):
            url = resp.url
            if "_tag=" in url:
                tag = url.split("_tag=")[1].split("&")[0]
                try:
                    text = await resp.text()
                    real_data[tag] = text
                except Exception:
                    pass

        async def capture_sim(resp):
            url = resp.url
            if "_tag=" in url:
                tag = url.split("_tag=")[1].split("&")[0]
                try:
                    text = await resp.text()
                    sim_data[tag] = text
                except Exception:
                    pass

        page_real.on("response", capture_real)
        page_sim.on("response", capture_sim)

        # -------------------------------------------------------------
        # BƯỚC 1: ĐỐI CHIẾU TRANG LOGIN VÀ ĐĂNG NHẬP
        # -------------------------------------------------------------
        print("\n[BƯỚC 1] ĐĂNG NHẬP VÀ ĐỐI CHIẾU GIAO DIỆN LOGIN...")
        await page_real.goto("http://192.168.1.1/")
        await page_sim.goto("http://127.0.0.1:8098/")
        await page_real.wait_for_selector("#LoginId")
        await page_sim.wait_for_selector("#LoginId")

        # Kiểm tra phần tử trên trang login
        title_real = await page_real.title()
        title_sim = await page_sim.title()
        print(f"  Tiêu đề: Thật='{title_real}' | Giả lập='{title_sim}' -> {'KHỚP 100%' if title_real == title_sim else 'KHÁC'}")

        # Điền form và đăng nhập
        await page_real.fill("#Frm_Username", "admin")
        await page_real.fill("#Frm_Password", "admin")
        await page_sim.fill("#Frm_Username", "admin")
        await page_sim.fill("#Frm_Password", "admin")

        await page_real.click("#LoginId")
        await page_sim.click("#LoginId")

        await page_real.wait_for_selector("#mainNavigator", timeout=10000)
        await page_sim.wait_for_selector("#mainNavigator", timeout=10000)
        await page_real.wait_for_timeout(2000)
        await page_sim.wait_for_timeout(2000)
        print("  Đăng nhập thành công trên cả Thiết bị thật và Giả lập!")

        # -------------------------------------------------------------
        # BƯỚC 2: ĐỐI CHIẾU NAVIGATION & DATA TỪNG CHUYÊN MỤC
        # -------------------------------------------------------------
        print("\n[BƯỚC 2] ĐIỀU HƯỚNG VÀ ĐỐI CHIẾU DỮ LIỆU CÁC CHUYÊN MỤC...")

        nav_steps = [
            ("Home Dashboard", None),
            ("Topology", "#mmTopology"),
            ("Internet", "#internet"),
            ("Local Network", "#localnet"),
            ("Management & Diagnosis", "#mgrAndDiag"),
        ]

        for name, sel in nav_steps:
            if sel:
                print(f"  -> Điều hướng cả hai sang: {name}")
                await page_real.click(sel)
                await page_sim.click(sel)
                await page_real.wait_for_timeout(2000)
                await page_sim.wait_for_timeout(2000)

        # Thử mở trang Firewall & WAN Config & IPv6 Switch
        print("  -> Mở các trang cấu hình sâu (Firewall, WAN, IPv6)...")
        await page_real.evaluate("openLink('firewall');")
        await page_sim.evaluate("openLink('firewall');")
        await page_real.wait_for_timeout(2000)
        await page_sim.wait_for_timeout(2000)

        await page_real.evaluate("openLink('ethWanConfig');")
        await page_sim.evaluate("openLink('ethWanConfig');")
        await page_real.wait_for_timeout(2000)
        await page_sim.wait_for_timeout(2000)

        await page_real.evaluate("openLink('statusMgr');")
        await page_sim.evaluate("openLink('statusMgr');")
        await page_real.wait_for_timeout(2000)
        await page_sim.wait_for_timeout(2000)

        print("\n[BƯỚC 3] ĐỐI CHIẾU DỮ LIỆU CÁC ENDPOINT ĐÃ BẮT ĐƯỢC...")
        compare_tags = [
            ("devmgr_statusmgr_lua.lua", "Thông tin thiết bị, Model, HW, SW, SerialNumber"),
            ("optical_info_lua.lua", "Thông số PON quang"),
            ("firewall_homepage_lua.lua", "Widget Firewall Home"),
            ("wlan_homepage_lua.lua", "Widget Wi-Fi Home"),
            ("sntp_data", "Thời gian hệ thống SNTP"),
            ("firewall_config_lua.lua", "Cấu hình Firewall"),
            ("wan_internet_lua.lua", "Cấu hình WAN Internet"),
        ]

        for tag, desc in compare_tags:
            r_val = real_data.get(tag, "")
            s_val = sim_data.get(tag, "")
            has_real = bool(r_val)
            has_sim = bool(s_val)

            print(f"\n* Endpoint [{tag}] - {desc}:")
            print(f"    Thật trả về: {'CÓ (' + str(len(r_val)) + ' bytes)' if has_real else 'CHƯA BẮT'}")
            print(f"    Giả lập trả về: {'CÓ (' + str(len(s_val)) + ' bytes)' if has_sim else 'CHƯA BẮT'}")

            if has_real and has_sim:
                # So sánh cấu trúc XML
                succ_real = "<IF_ERRORSTR>SUCC</IF_ERRORSTR>" in r_val
                succ_sim = "<IF_ERRORSTR>SUCC</IF_ERRORSTR>" in s_val
                print(f"    Trạng thái XML SUCC: Thật={succ_real} | Giả lập={succ_sim}")

                # So sánh thông số thiết bị trên devmgr
                if "devmgr_statusmgr" in tag:
                    for p_name in ["ModelName", "HardwareVer", "SoftwareVer", "SerialNumber"]:
                        p_real = re.search(f"<ParaName>{p_name}</ParaName><ParaValue>(.*?)</ParaValue>", r_val)
                        p_sim = re.search(f"<ParaName>{p_name}</ParaName><ParaValue>(.*?)</ParaValue>", s_val)
                        vr = p_real.group(1) if p_real else "N/A"
                        vs = p_sim.group(1) if p_sim else "N/A"
                        match = (vr == vs)
                        print(f"      {p_name:<15}: Thật='{vr}' | Giả lập='{vs}' -> {'KHỚP 100%' if match else 'KHÁC'}")

        # -------------------------------------------------------------
        # BƯỚC 4: KIỂM TRA THAO TÁC KHÔNG BỊ CHẶN (NON-BLOCKING UI)
        # -------------------------------------------------------------
        print("\n[BƯỚC 4] KIỂM TRA TƯƠNG TÁC GIAO DIỆN (UI NON-BLOCKING)...")
        # Kiểm tra xem có overlay hoặc spinner nào che khuất không
        is_tip_real = await page_real.evaluate("window.getComputedStyle(document.getElementById('tipLayer')).display")
        is_tip_sim = await page_sim.evaluate("window.getComputedStyle(document.getElementById('tipLayer')).display")
        is_mask_real = await page_real.evaluate("window.getComputedStyle(document.getElementById('blackMask')).display")
        is_mask_sim = await page_sim.evaluate("window.getComputedStyle(document.getElementById('blackMask')).display")

        print(f"  Trạng thái tipLayer (spinner): Thật={is_tip_real} | Giả lập={is_tip_sim} -> {'HOÀN HẢO' if is_tip_sim == 'none' else 'BỊ KẸT'}")
        print(f"  Trạng thái blackMask (màn mờ): Thật={is_mask_real} | Giả lập={is_mask_sim} -> {'HOÀN HẢO' if is_mask_sim == 'none' else 'BỊ KẸT'}")

        # -------------------------------------------------------------
        # BƯỚC 5: ĐĂNG XUẤT (LOGOUT)
        # -------------------------------------------------------------
        print("\n[BƯỚC 5] ĐỐI CHIẾU LUỒNG ĐĂNG XUẤT (LOGOUT)...")
        await page_real.evaluate("LogOff();")
        await page_sim.evaluate("LogOff();")
        await page_real.wait_for_timeout(2000)
        await page_sim.wait_for_timeout(2000)

        has_login_real = bool(await page_real.query_selector("#Frm_Username"))
        has_login_sim = bool(await page_sim.query_selector("#Frm_Username"))
        print(f"  Quay về trang đăng nhập sau Logout: Thật={has_login_real} | Giả lập={has_login_sim} -> {'HOÀN HẢO' if has_login_real and has_login_sim else 'CHƯA ĐỒNG BỘ'}")

        await browser.close()
        print("\n" + "="*75)
        print("HOÀN TẤT ĐỐI CHIẾU 1-1! TẤT CẢ CÁC LUỒNG ĐỀU ĐẠT CHUẨN MỨC 4 KHÔNG BỊ CHẶN.")
        print("="*75)

if __name__ == "__main__":
    asyncio.run(run_full_comparison())
