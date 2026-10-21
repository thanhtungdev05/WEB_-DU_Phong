import asyncio
from playwright.async_api import async_playwright

async def audit_submenus():
    async with async_playwright() as p:
        browser = await p.chromium.launch(headless=True)
        page = await browser.new_page(viewport={"width": 1400, "height": 900})

        console_logs = []
        page.on("console", lambda m: console_logs.append(f"[{m.type}] {m.text}"))
        page.on("pageerror", lambda e: console_logs.append(f"[PAGEERROR] {e}"))

        await page.goto("http://127.0.0.1:8098/")
        await page.wait_for_timeout(1000)

        # Login check
        if await page.query_selector("#Frm_Username"):
            await page.fill("#Frm_Username", "admin")
            await page.fill("#Frm_Password", "admin")
            await page.click("#LoginId")
            await page.wait_for_selector("#mainNavigator", timeout=10000)
            await page.wait_for_timeout(2000)

        test_hierarchy = [
            {
                "name": "Internet > WAN > WAN Config",
                "top": "#internet",
                "target_link": "ethWanConfig",
                "shot": "devices/ac1000z/audit_sub_wan_config.png"
            },
            {
                "name": "Internet > Security > Firewall",
                "top": "#internet",
                "target_link": "firewall",
                "shot": "devices/ac1000z/audit_sub_firewall.png"
            },
            {
                "name": "Internet > Security > Port Forwarding",
                "top": "#internet",
                "target_link": "portForwarding",
                "shot": "devices/ac1000z/audit_sub_port_forward.png"
            },
            {
                "name": "Local Network > WLAN > WLAN Basic",
                "top": "#localnet",
                "target_link": "wlanBasic",
                "shot": "devices/ac1000z/audit_sub_wlan_basic.png"
            },
            {
                "name": "Local Network > WLAN > Mesh Wi-Fi (NetSphere)",
                "top": "#localnet",
                "target_link": "smNetSphereMAP",
                "shot": "devices/ac1000z/audit_sub_mesh.png"
            },
            {
                "name": "Local Network > LAN > IPv4",
                "top": "#localnet",
                "target_link": "lanMgrIpv4",
                "shot": "devices/ac1000z/audit_sub_lan_ipv4.png"
            },
            {
                "name": "Management > System Mgmt > Device Mgmt (Reboot)",
                "top": "#mgrAndDiag",
                "target_link": "rebootAndReset",
                "shot": "devices/ac1000z/audit_sub_reboot.png"
            },
            {
                "name": "Management > Diagnosis > Network Diag (Ping/Trace)",
                "top": "#mgrAndDiag",
                "target_link": "networkDiag",
                "shot": "devices/ac1000z/audit_sub_diag.png"
            },
            {
                "name": "Management > IPv6 Switch",
                "top": "#mgrAndDiag",
                "target_link": "IPv6SwitchMgr",
                "shot": "devices/ac1000z/audit_sub_ipv6_switch.png"
            },
        ]

        results = []
        for item in test_hierarchy:
            pname = item["name"]
            top_sel = item["top"]
            target = item["target_link"]
            shot = item["shot"]

            print(f"\nNavigating to: {pname}...")
            console_logs.clear()

            # 1. Click top menu first to set context
            await page.click(top_sel)
            await page.wait_for_timeout(1000)

            # 2. Trigger openLink for target sub-page
            await page.evaluate(f"openLink('{target}');")
            await page.wait_for_timeout(2000)

            # 3. Check spinner
            tip_disp = await page.evaluate("document.getElementById('tipLayer') ? window.getComputedStyle(document.getElementById('tipLayer')).display : 'none'")
            mask_disp = await page.evaluate("document.getElementById('blackMask') ? window.getComputedStyle(document.getElementById('blackMask')).display : 'none'")
            waiting_disp = await page.evaluate("document.getElementById('waitingImgArea') ? window.getComputedStyle(document.getElementById('waitingImgArea')).display : 'none'")
            html_len = await page.evaluate("document.getElementById('commPageContainer') ? document.getElementById('commPageContainer').innerHTML.length : 0")

            is_stuck = (tip_disp != "none" or mask_disp != "none" or waiting_disp != "none")
            status_str = "STUCK" if is_stuck else "PASS (NO SPINNER)"
            print(f"  Result: {status_str} | HTML size: {html_len} bytes")
            if is_stuck:
                print(f"    Details: tip={tip_disp}, mask={mask_disp}, wait={waiting_disp}")
            if console_logs:
                print(f"    Logs: {console_logs[:2]}")

            await page.screenshot(path=shot)
            results.append((pname, status_str, is_stuck))

        print("\n" + "="*60)
        print("DEEP SUB-MENU AUDIT SUMMARY:")
        print("="*60)
        all_passed = True
        for name, status, stuck in results:
            print(f"[{'FAIL' if stuck else 'PASS'}] {name:<45} -> {status}")
            if stuck:
                all_passed = False

        if all_passed:
            print("\n>>> ALL TESTED DEEP SUBMENUS RENDERED PERFECTLY WITHOUT ANY SPINNER HANG! <<<")

        await browser.close()

if __name__ == "__main__":
    asyncio.run(audit_submenus())
