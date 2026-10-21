import asyncio
from playwright.async_api import async_playwright

async def trace_page():
    async with async_playwright() as p:
        browser = await p.chromium.launch(headless=True)
        page = await browser.new_page()

        page.on("console", lambda m: print(f"CONSOLE [{m.type}]: {m.text}"))
        page.on("request", lambda r: print(f"REQ -> {r.method} {r.url}"))
        page.on("response", lambda r: print(f"RESP <- {r.status} {r.url}"))
        page.on("pageerror", lambda e: print(f"PAGE ERROR: {e}"))

        await page.goto("http://127.0.0.1:8098/")
        await page.fill("#Frm_Username", "admin")
        await page.fill("#Frm_Password", "admin")
        await page.click("#loginBtn")
        await page.wait_for_selector("#mainNavigator", timeout=10000)
        await page.wait_for_timeout(2000)

        print("\n=== CLICKING MENU statusMgr ===")
        await page.evaluate("""
        () => {
            console.log("Before openLink, tipLayer display:", $("#tipLayer").css("display"));
            openLink('statusMgr');
            console.log("After openLink call, tipLayer display:", $("#tipLayer").css("display"));
        }
        """)

        # Wait 3 seconds and check
        for i in range(6):
            await page.wait_for_timeout(500)
            status = await page.evaluate("""
            () => {
                return {
                    tipLayer: $("#tipLayer").css("display"),
                    blackMask: $("#blackMask").css("display"),
                    waiting: $("#waitingImgArea").css("display"),
                    containerText: $("#commPageContainer").text().substring(0, 100),
                    dataHasBeenGot: $("#DataHasBeenGot").val()
                };
            }
            """)
            print(f"Time {(i+1)*0.5}s: {status}")

        await browser.close()

if __name__ == "__main__":
    asyncio.run(trace_page())
