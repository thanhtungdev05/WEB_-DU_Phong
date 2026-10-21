import asyncio
from playwright.async_api import async_playwright

async def debug_one():
    async with async_playwright() as p:
        browser = await p.chromium.launch(headless=True)
        page = await browser.new_page(viewport={"width": 1400, "height": 900})

        page.on('console', lambda msg: print(f'CONSOLE [{msg.type}]: {msg.text}'))
        page.on('response', lambda r: print(f'RESP {r.status}: {r.url}'))
        page.on('pageerror', lambda e: print(f'PAGE ERROR: {e}'))

        print("1. Loading login...")
        await page.goto('http://127.0.0.1:8098/')
        await page.wait_for_selector('#Frm_Username')
        
        print("2. Submitting login...")
        await page.fill('#Frm_Username', 'admin')
        await page.fill('#Frm_Password', 'admin')
        await page.click('#loginBtn')

        print("3. Waiting for dashboard navigation...")
        await page.wait_for_selector('#mainNavigator', timeout=10000)
        print("DASHBOARD DETECTED!")
        await page.wait_for_timeout(2000)

        tip_init = await page.evaluate("window.getComputedStyle(document.getElementById('tipLayer')).display")
        mask_init = await page.evaluate("window.getComputedStyle(document.getElementById('blackMask')).display")
        print(f"tipLayer after dashboard load: {tip_init}")
        print(f"blackMask after dashboard load: {mask_init}")

        print("\n4. Navigating to statusMgr...")
        await page.evaluate("openLink('statusMgr');")
        await page.wait_for_timeout(2000)

        tip_display = await page.evaluate("document.getElementById('tipLayer') ? window.getComputedStyle(document.getElementById('tipLayer')).display : 'none'")
        mask_display = await page.evaluate("document.getElementById('blackMask') ? window.getComputedStyle(document.getElementById('blackMask')).display : 'none'")
        waiting_display = await page.evaluate("document.getElementById('waitingImgArea') ? window.getComputedStyle(document.getElementById('waitingImgArea')).display : 'none'")
        container_html = await page.evaluate("document.getElementById('commPageContainer').innerHTML.substring(0, 300)")

        print(f"tipLayer display: {tip_display}")
        print(f"blackMask display: {mask_display}")
        print(f"waitingImgArea display: {waiting_display}")
        print(f"commPageContainer: {container_html}")

        await browser.close()

if __name__ == '__main__':
    asyncio.run(debug_one())
