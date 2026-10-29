import asyncio
from playwright.async_api import async_playwright

async def sniff_real_device():
    async with async_playwright() as p:
        browser = await p.chromium.launch(headless=True)
        page = await browser.new_page(viewport={"width": 1400, "height": 900})

        page.on("request", lambda r: print(f"REAL REQ -> {r.method} {r.url}\n         Headers: {dict(r.headers)}"))
        page.on("response", lambda r: print(f"REAL RESP <- {r.status} {r.url} (len: {len(r.headers.get('content-length', ''))})"))

        print("1. Opening real device http://192.168.1.1/...")
        await page.goto("http://192.168.1.1/")
        await page.fill("#Frm_Username", "admin")
        await page.fill("#Frm_Password", "admin")
        print("2. Submitting login on real device...")
        await page.click("#LoginId")

        await page.wait_for_selector("#mainNavigator", timeout=10000)
        print("Logged into real device! Waiting 2s...")
        await page.wait_for_timeout(2000)

        print("\n3. Clicking Management on real device...")
        await page.click("#mgrAndDiag")
        await page.wait_for_timeout(3000)

        await browser.close()

if __name__ == "__main__":
    asyncio.run(sniff_real_device())
