import asyncio
from playwright.async_api import async_playwright

async def check_err():
    async with async_playwright() as p:
        browser = await p.chromium.launch(headless=True)
        page = await browser.new_page()

        def on_err(err):
            print("=== PAGE ERROR ===")
            print("Message:", err.message)
            print("Stack:", err.stack)

        page.on("pageerror", on_err)
        page.on("console", lambda m: print(f"CONSOLE [{m.type}]: {m.text}"))

        await page.goto("http://127.0.0.1:8098/")
        await page.fill("#Frm_Username", "admin")
        await page.fill("#Frm_Password", "admin")
        await page.click("#loginBtn")
        await page.wait_for_selector("#mainNavigator", timeout=10000)
        await page.wait_for_timeout(2000)

        print("\n--- Invoking openLink('statusMgr') ---")
        res = await page.evaluate("""
        () => {
            try {
                openLink('statusMgr');
                return "called openLink OK";
            } catch(e) {
                return "EVAL ERROR: " + e.stack;
            }
        }
        """)
        print("Evaluate result:", res)
        await page.wait_for_timeout(2000)
        await browser.close()

if __name__ == "__main__":
    asyncio.run(check_err())
