import asyncio
import sys
sys.stdout.reconfigure(encoding='utf-8')
from playwright.async_api import async_playwright

async def verify_back_to_home():
    print("="*60)
    print("KIỂM TRA CHUYỂN TỪ TRANG KHÁC VỀ HOME TRÊN GIẢ LẬP")
    print("="*60)

    async with async_playwright() as p:
        browser = await p.chromium.launch(headless=True)
        page = await browser.new_page(viewport={"width": 1400, "height": 900})

        page.on("console", lambda m: print(f"CONSOLE: [{m.type}] {m.text}"))
        page.on("pageerror", lambda e: print(f"PAGE ERROR: {e}"))

        print("1. Mở http://127.0.0.1:8098/...")
        await page.goto("http://127.0.0.1:8098/")
        await page.wait_for_timeout(1000)

        # Login nếu có form
        if await page.query_selector("#Frm_Username"):
            print("Đang đăng nhập admin/admin...")
            await page.fill("#Frm_Username", "admin")
            await page.fill("#Frm_Password", "admin")
            await page.click("#LoginId")
            await page.wait_for_selector("#mainNavigator", timeout=10000)
            await page.wait_for_timeout(2000)

        print("\n2. Chuyển sang trang Management & Diagnosis...")
        await page.click("#mgrAndDiag")
        await page.wait_for_timeout(2000)

        print("3. Chuyển tiếp sang trang Internet...")
        await page.click("#internet")
        await page.wait_for_timeout(2000)

        print("4. BÂM VỀ HOME (#homePage)...")
        await page.click("#homePage")
        await page.wait_for_timeout(2500)

        # Kiểm tra trạng thái spinner và mask
        tip_disp = await page.evaluate("document.getElementById('tipLayer') ? window.getComputedStyle(document.getElementById('tipLayer')).display : 'none'")
        mask_disp = await page.evaluate("document.getElementById('blackMask') ? window.getComputedStyle(document.getElementById('blackMask')).display : 'none'")
        waiting_disp = await page.evaluate("document.getElementById('waitingImgArea') ? window.getComputedStyle(document.getElementById('waitingImgArea')).display : 'none'")
        
        # Kiểm tra các phần tử đặc trưng của Home Dashboard
        has_hgw = await page.evaluate("document.getElementById('HGW') !== null")
        has_fw_widget = await page.evaluate("document.getElementById('template_head_firewall') !== null || document.querySelector('.category_item') !== null")
        has_wlan_widget = await page.evaluate("document.getElementById('template_head_wlan') !== null || document.querySelector('.category_wlan') !== null")

        print("\n=== KẾT QUẢ KIỂM TRA QUAY VỀ HOME ===")
        print(f"  Trạng thái tipLayer (spinner): {tip_disp} -> {'THÀNH CÔNG (KHÔNG BỊ KẸT)' if tip_disp == 'none' else 'BỊ KẸT'}")
        print(f"  Trạng thái blackMask (màn mờ): {mask_disp}")
        print(f"  Trạng thái waitingImgArea: {waiting_disp}")
        print(f"  Widget HGW trên Home: {has_hgw}")
        print(f"  Widget Firewall trên Home: {has_fw_widget}")
        print(f"  Widget WLAN trên Home: {has_wlan_widget}")

        await page.screenshot(path="simulators/ac1000z/back_to_home_verified.png")
        print("\nĐã chụp ảnh minh chứng: simulators/ac1000z/back_to_home_verified.png")

        await browser.close()

if __name__ == "__main__":
    asyncio.run(verify_back_to_home())
