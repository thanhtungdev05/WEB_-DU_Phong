import asyncio
import sys
sys.stdout.reconfigure(encoding='utf-8')
from playwright.async_api import async_playwright

async def run_full_navigation_test():
    print("============================================================")
    print("KIỂM THỬ TOÀN DIỆN ĐIỀU HƯỚNG QUAY VỀ HOME TRÊN THIẾT BỊ GIẢ LẬP")
    print("============================================================")

    async with async_playwright() as p:
        browser = await p.chromium.launch(headless=True)
        page = await browser.new_page(viewport={"width": 1400, "height": 900})

        page.on("console", lambda m: print(f"CONSOLE: [{m.type}] {m.text}"))
        page.on("pageerror", lambda e: print(f"PAGE ERROR: {e}"))

        print("\n1. Mở trang và đăng nhập...")
        await page.goto("http://127.0.0.1:8098/")
        await page.wait_for_timeout(1000)

        if await page.query_selector("#Frm_Username"):
            await page.fill("#Frm_Username", "admin")
            await page.fill("#Frm_Password", "admin")
            await page.click("#LoginId")
            await page.wait_for_selector("#mainNavigator", timeout=10000)
            await page.wait_for_timeout(1500)

        test_menus = [
            ("Topology", "#mmTopology"),
            ("Internet", "#internet"),
            ("Local Network", "#localnet"),
            ("Management & Diagnosis", "#mgrAndDiag")
        ]

        all_passed = True

        for menu_name, selector in test_menus:
            print(f"\n--- [Test] Chuyển sang '{menu_name}' ({selector}) rồi quay về Home ---")
            await page.click(selector)
            await page.wait_for_timeout(2000)

            # Bấm về Home
            await page.click("#homePage")
            await page.wait_for_timeout(2000)

            # Kiểm tra spinner và UI
            tip_disp = await page.evaluate("document.getElementById('tipLayer') ? window.getComputedStyle(document.getElementById('tipLayer')).display : 'none'")
            mask_disp = await page.evaluate("document.getElementById('blackMask') ? window.getComputedStyle(document.getElementById('blackMask')).display : 'none'")
            has_hgw = await page.evaluate("document.getElementById('HGW') !== null")

            if tip_disp == 'none' and mask_disp == 'none' and has_hgw:
                print(f"  -> THÀNH CÔNG: Từ '{menu_name}' về Home mượt mà, không kẹt spinner, HGW hiển thị.")
            else:
                print(f"  -> THẤT BẠI: tipLayer={tip_disp}, blackMask={mask_disp}, has_hgw={has_hgw}")
                all_passed = False

        print("\n--- [Test] Tương tác các widget trên Home Dashboard ---")
        # Kiểm tra chuyển tab trên Home Dashboard
        print("  Click 'LAN Devices'...")
        await page.click("#home_category_lan")
        await page.wait_for_timeout(500)
        
        print("  Click 'USB Devices'...")
        await page.click("#home_category_usb")
        await page.wait_for_timeout(500)

        print("  Click 'WLAN Devices'...")
        await page.click("#home_category_wlan")
        await page.wait_for_timeout(500)

        # Kiểm tra click link Firewall trên Home
        print("  Click link 'Firewall' trên Home...")
        await page.click("#FWUrl")
        await page.wait_for_timeout(2000)
        fw_tip = await page.evaluate("document.getElementById('tipLayer') ? window.getComputedStyle(document.getElementById('tipLayer')).display : 'none'")
        print(f"  -> Điều hướng sang Firewall: spinner tipLayer={fw_tip}")

        # Quay lại Home lần nữa
        print("  Quay lại Home từ Firewall...")
        await page.click("#homePage")
        await page.wait_for_timeout(2000)
        home_tip = await page.evaluate("document.getElementById('tipLayer') ? window.getComputedStyle(document.getElementById('tipLayer')).display : 'none'")
        print(f"  -> Quay lại Home: spinner tipLayer={home_tip}")

        if all_passed and home_tip == 'none':
            print("\n============================================================")
            print("KẾT QUẢ TỔNG THỂ: TẤT CẢ CÁC LUỒNG VỀ HOME ĐỀU HOẠT ĐỘNG HOÀN HẢO!")
            print("============================================================")
        else:
            print("\n============================================================")
            print("KẾT QUẢ TỔNG THỂ: CÓ LỖI XẢY RA!")
            print("============================================================")

        await page.screenshot(path="devices/ac1000z/full_nav_test_verified.png")
        await browser.close()

if __name__ == "__main__":
    asyncio.run(run_full_navigation_test())
