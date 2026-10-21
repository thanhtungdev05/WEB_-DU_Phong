import asyncio
from playwright.async_api import async_playwright

async def inspect_spinner():
    async with async_playwright() as p:
        browser = await p.chromium.launch(headless=True)
        page = await browser.new_page()

        await page.goto("http://127.0.0.1:8098/")
        await page.fill("#Frm_Username", "admin")
        await page.fill("#Frm_Password", "admin")
        await page.click("#loginBtn")
        await page.wait_for_selector("#mainNavigator", timeout=10000)
        await page.wait_for_timeout(2000)

        print("=== INITIAL AFTER LOGIN ===")
        print("tipLayer:", await page.evaluate("document.getElementById('tipLayer').outerHTML"))
        print("blackMask:", await page.evaluate("document.getElementById('blackMask').outerHTML"))
        print("computed tipLayer display:", await page.evaluate("window.getComputedStyle(document.getElementById('tipLayer')).display"))
        print("computed blackMask display:", await page.evaluate("window.getComputedStyle(document.getElementById('blackMask')).display"))
        print("computed waitingImgArea display:", await page.evaluate("window.getComputedStyle(document.getElementById('waitingImgArea')).display"))

        print("\n=== CALLING openLink('statusMgr') ===")
        await page.evaluate("openLink('statusMgr');")
        await page.wait_for_timeout(2000)

        print("tipLayer after openLink:", await page.evaluate("document.getElementById('tipLayer').outerHTML"))
        print("blackMask after openLink:", await page.evaluate("document.getElementById('blackMask').outerHTML"))
        print("computed tipLayer display:", await page.evaluate("window.getComputedStyle(document.getElementById('tipLayer')).display"))
        print("computed blackMask display:", await page.evaluate("window.getComputedStyle(document.getElementById('blackMask')).display"))
        print("computed waitingImgArea display:", await page.evaluate("window.getComputedStyle(document.getElementById('waitingImgArea')).display"))

        await browser.close()

if __name__ == "__main__":
    asyncio.run(inspect_spinner())
