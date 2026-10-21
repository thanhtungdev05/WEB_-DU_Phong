import asyncio
from playwright.async_api import async_playwright

async def trace_cookies():
    async with async_playwright() as p:
        browser = await p.chromium.launch(headless=True)
        context = await browser.new_context()
        page = await context.new_page()

        page.on("request", lambda r: print(f"REQ -> {r.method} {r.url}\n       Headers Cookie: {r.headers.get('cookie')}"))
        page.on("response", lambda r: print(f"RESP <- {r.status} {r.url}\n        Set-Cookie: {r.headers.get('set-cookie')}"))

        print("\n--- 1. Goto / ---")
        await page.goto("http://127.0.0.1:8098/")
        await page.wait_for_selector("#Frm_Username")

        print("\n--- 2. Submit Login ---")
        await page.fill("#Frm_Username", "admin")
        await page.fill("#Frm_Password", "admin")
        await page.click("#loginBtn")
        await page.wait_for_selector("#mainNavigator", timeout=10000)

        cookies = await context.cookies()
        print("\nCookies in browser context after login:", cookies)

        print("\n--- 3. Call fetch menuView statusMgr ---")
        res = await page.evaluate("""
        async () => {
            const resp = await fetch('/?_type=menuView&_tag=statusMgr');
            const txt = await resp.text();
            return {
                status: resp.status,
                txt: txt.substring(0, 150)
            };
        }
        """)
        print("Fetch result:", res)

        await browser.close()

if __name__ == "__main__":
    asyncio.run(trace_cookies())
