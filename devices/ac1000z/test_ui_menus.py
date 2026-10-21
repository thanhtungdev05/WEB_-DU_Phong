import asyncio
from playwright.async_api import async_playwright

async def test_menu_clicks():
    async with async_playwright() as p:
        browser = await p.chromium.launch(headless=True)
        page = await browser.new_page(viewport={"width": 1400, "height": 900})

        page.on("console", lambda m: print(f"CONSOLE [{m.type}]: {m.text}"))
        page.on("pageerror", lambda e: print(f"PAGE ERROR: {e}"))
        page.on("requestfailed", lambda req: print(f"FAILED REQ: {req.url}"))

        print("1. Opening / and logging in with #LoginId...")
        await page.goto("http://127.0.0.1:8098/")
        await page.fill("#Frm_Username", "admin")
        await page.fill("#Frm_Password", "admin")
        await page.click("#LoginId")

        # Wait for dashboard
        await page.wait_for_selector("#mainNavigator", timeout=10000)
        await page.wait_for_timeout(2000)
        print("Dashboard loaded successfully!")

        test_menus = [
            ("Topology", "#mmTopology"),
            ("Internet", "#internet"),
            ("Local Network", "#localnet"),
            ("Management & Diagnosis", "#mgrAndDiag"),
        ]

        for name, selector in test_menus:
            print(f"\n--- Clicking Top Menu: {name} ({selector}) ---")
            await page.click(selector)
            await page.wait_for_timeout(1500)

            # Check spinner state
            tip_disp = await page.evaluate("window.getComputedStyle(document.getElementById('tipLayer')).display")
            mask_disp = await page.evaluate("window.getComputedStyle(document.getElementById('blackMask')).display")
            waiting_disp = await page.evaluate("window.getComputedStyle(document.getElementById('waitingImgArea')).display")
            html_len = await page.evaluate("document.getElementById('commPageContainer').innerHTML.length")

            print(f"Result for {name}:")
            print(f"  tipLayer: {tip_disp}")
            print(f"  blackMask: {mask_disp}")
            print(f"  waitingImgArea: {waiting_disp}")
            print(f"  commPageContainer HTML length: {html_len}")

        await browser.close()

if __name__ == "__main__":
    asyncio.run(test_menu_clicks())
