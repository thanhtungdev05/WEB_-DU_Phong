import asyncio
import re
import json
import sys
from playwright.async_api import async_playwright

async def run_audit():
    with open('simulators/ac1000z/src/www/index.html', 'r', encoding='utf-8') as f:
        c = f.read()

    m = re.search(r'var menuTreeJSON = (\[.*?\]);', c, re.DOTALL)
    data = json.loads(m.group(1))
    leaf_pages = []

    def parse_node(node, path=""):
        name = node.get("name", node.get("id", ""))
        nid = node.get("id", "")
        current = f"{path} > {name}" if path else name
        children = node.get("children", [])
        if not children and "area" in node:
            leaf_pages.append({
                "id": nid,
                "name": name,
                "path": current,
            })
        for child in children:
            parse_node(child, current)

    for top in data:
        parse_node(top)

    print(f"Loaded {len(leaf_pages)} pages to test.")

    async with async_playwright() as p:
        browser = await p.chromium.launch(headless=True)
        context = await browser.new_context(viewport={"width": 1400, "height": 900})
        page = await context.new_page()

        console_errors = []
        page.on("console", lambda msg: console_errors.append(f"[{msg.type}] {msg.text}") if msg.type in ("error", "warning") else None)
        failed_requests = []
        page.on("requestfailed", lambda req: failed_requests.append(f"FAILED: {req.url} - {req.failure}"))
        page.on("response", lambda resp: failed_requests.append(f"HTTP {resp.status}: {resp.url}") if resp.status >= 400 else None)
        page.on("pageerror", lambda err: console_errors.append(f"[pageerror] {err.message}"))

        print("Navigating to http://127.0.0.1:8098/...")
        await page.goto("http://127.0.0.1:8098/", wait_until="networkidle")

        title = await page.title()
        print(f"Login page title: {title}")
        
        # Perform login
        await page.fill("#Frm_Username", "admin")
        await page.fill("#Frm_Password", "admin")
        await page.click("#loginBtn")

        # Wait for navigation to index dashboard
        await page.wait_for_selector("#mainNavigator", timeout=10000)
        await page.wait_for_timeout(2000)

        print("Login SUCCESS! Beginning comprehensive test of all 68 pages...")

        stuck_pages = []
        ok_pages = []

        for idx, item in enumerate(leaf_pages, 1):
            pid = item["id"]
            pname = item["name"]
            ppath = item["path"]

            console_errors.clear()
            failed_requests.clear()

            # Execute openLink(pid)
            try:
                await page.evaluate(f"openLink('{pid}');")
            except Exception as e:
                print(f"[{idx:2d}/{len(leaf_pages)}] FAIL EXEC openLink('{pid}'): {e}")
                stuck_pages.append((idx, pid, ppath, f"Exception: {e}", list(console_errors), list(failed_requests)))
                continue

            # Check for spinner to disappear (up to 2 seconds)
            spinner_visible = True
            for _ in range(20):
                await page.wait_for_timeout(100)
                is_tip_layer = await page.evaluate("document.getElementById('tipLayer') && window.getComputedStyle(document.getElementById('tipLayer')).display !== 'none'")
                is_mask = await page.evaluate("document.getElementById('blackMask') && window.getComputedStyle(document.getElementById('blackMask')).display !== 'none'")
                if not is_tip_layer and not is_mask:
                    spinner_visible = False
                    break

            if spinner_visible:
                print(f"[{idx:2d}/{len(leaf_pages)}] STUCK SPINNER: {pid:<20} | {ppath}")
                if console_errors:
                    print(f"      Console: {console_errors[:2]}")
                if failed_requests:
                    print(f"      Requests: {failed_requests[:2]}")
                stuck_pages.append((idx, pid, ppath, "Spinner Stuck", list(console_errors), list(failed_requests)))
            else:
                if console_errors or failed_requests:
                    print(f"[{idx:2d}/{len(leaf_pages)}] OK (warnings): {pid:<20} | {ppath}")
                    if console_errors:
                        print(f"      Console: {console_errors[:2]}")
                    if failed_requests:
                        print(f"      Requests: {failed_requests[:2]}")
                else:
                    print(f"[{idx:2d}/{len(leaf_pages)}] PASS: {pid:<20} | {ppath}")
                ok_pages.append((idx, pid, ppath))

        print("\n" + "="*60)
        print(f"AUDIT SUMMARY: Total: {len(leaf_pages)}, Passed: {len(ok_pages)}, Stuck/Failed: {len(stuck_pages)}")
        print("="*60)
        for s in stuck_pages:
            print(f"- #{s[0]} [{s[1]}] {s[2]}")
            print(f"  Reason: {s[3]}")
            if s[4]:
                print(f"  Console: {s[4]}")
            if s[5]:
                print(f"  Failed Reqs: {s[5]}")

        await browser.close()

if __name__ == "__main__":
    asyncio.run(run_audit())
