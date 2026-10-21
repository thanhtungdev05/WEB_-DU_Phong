import asyncio
from playwright.async_api import async_playwright

async def audit():
    async with async_playwright() as p:
        browser = await p.chromium.launch(headless=True)
        page = await browser.new_page(viewport={"width": 1400, "height": 900})

        console_logs = []
        page.on("console", lambda m: console_logs.append(f"[{m.type}] {m.text}"))
        page.on("pageerror", lambda e: console_logs.append(f"[PAGEERROR] {e}"))

        print("1. Opening http://127.0.0.1:8098/...")
        await page.goto("http://127.0.0.1:8098/")
        await page.wait_for_timeout(1000)

        # Check if login is needed
        username_input = await page.query_selector("#Frm_Username")
        if username_input:
            print("Login form detected. Logging in...")
            await page.fill("#Frm_Username", "admin")
            await page.fill("#Frm_Password", "admin")
            await page.click("#LoginId")
            await page.wait_for_selector("#mainNavigator", timeout=10000)
            await page.wait_for_timeout(2000)
            print("Logged in successfully!")
        else:
            print("Already on dashboard (session active).")

        # Snapshot Dashboard
        await page.screenshot(path="devices/ac1000z/audit_dashboard.png")
        print("Captured audit_dashboard.png")

        menus_to_test = [
            ("Topology", "#mmTopology", "devices/ac1000z/audit_topology.png"),
            ("Internet", "#internet", "devices/ac1000z/audit_internet.png"),
            ("Local Network", "#localnet", "devices/ac1000z/audit_localnet.png"),
            ("Management & Diagnosis", "#mgrAndDiag", "devices/ac1000z/audit_mgr.png"),
        ]

        for name, sel, shot_path in menus_to_test:
            print(f"\nTesting Menu: {name} (selector: {sel})")
            console_logs.clear()
            
            # Click menu
            await page.click(sel)
            await page.wait_for_timeout(2000)

            # Check spinner
            tip_disp = await page.evaluate("document.getElementById('tipLayer') ? window.getComputedStyle(document.getElementById('tipLayer')).display : 'none'")
            mask_disp = await page.evaluate("document.getElementById('blackMask') ? window.getComputedStyle(document.getElementById('blackMask')).display : 'none'")
            waiting_disp = await page.evaluate("document.getElementById('waitingImgArea') ? window.getComputedStyle(document.getElementById('waitingImgArea')).display : 'none'")
            html_len = await page.evaluate("document.getElementById('commPageContainer') ? document.getElementById('commPageContainer').innerHTML.length : 0")

            print(f"  Status:")
            print(f"    tipLayer: {tip_disp}")
            print(f"    blackMask: {mask_disp}")
            print(f"    waitingImgArea: {waiting_disp}")
            print(f"    commPageContainer length: {html_len}")
            if console_logs:
                print(f"    Console: {console_logs[:3]}")

            await page.screenshot(path=shot_path)
            print(f"  Saved screenshot: {shot_path}")

        # Test sub-page click (e.g. inside Internet, click WAN config, Firewall)
        print("\nTesting Sub-menu clicks...")
        # Try clicking WAN Config inside Internet
        wan_cfg_btn = await page.query_selector("#ethWanConfig")
        if wan_cfg_btn:
            print("Found #ethWanConfig, clicking...")
            await page.click("#ethWanConfig")
            await page.wait_for_timeout(2000)
            await page.screenshot(path="devices/ac1000z/audit_wan_config.png")
            print("Saved audit_wan_config.png")

        # Try clicking Firewall inside Internet
        firewall_btn = await page.query_selector("#firewall")
        if firewall_btn:
            print("Found #firewall, clicking...")
            await page.click("#firewall")
            await page.wait_for_timeout(2000)
            await page.screenshot(path="devices/ac1000z/audit_firewall.png")
            print("Saved audit_firewall.png")

        await browser.close()
        print("\nAudit completed!")

if __name__ == "__main__":
    asyncio.run(audit())
