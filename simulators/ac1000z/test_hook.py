import asyncio
from playwright.async_api import async_playwright

async def test_fragment_load():
    async with async_playwright() as p:
        browser = await p.chromium.launch(headless=True)
        page = await browser.new_page()

        page.on("console", lambda m: print(f"CONSOLE [{m.type}]: {m.text}"))
        page.on("pageerror", lambda e: print(f"PAGE ERROR: {e}"))

        await page.goto("http://127.0.0.1:8098/")
        await page.fill("#Frm_Username", "admin")
        await page.fill("#Frm_Password", "admin")
        await page.click("#loginBtn")
        await page.wait_for_selector("#mainNavigator", timeout=10000)
        await page.wait_for_timeout(2000)

        print("\n--- Test Direct Fetch of statusMgr ---")
        fetch_res = await page.evaluate("""
        async () => {
            const resp = await fetch('/?_type=menuView&_tag=statusMgr');
            const text = await resp.text();
            return {
                status: resp.status,
                contentType: resp.headers.get('content-type'),
                len: text.length,
                preview: text.substring(0, 200)
            };
        }
        """)
        print("Fetch result:", fetch_res)

        print("\n--- Test openLink('statusMgr') with hooks ---")
        hook_res = await page.evaluate("""
        () => {
            const pc = $("#commPageContainer");
            const oldSucc = pc.succfunction;
            pc.succfunction = function(html) {
                console.log("HOOK succfunction CALLED! HTML length:", html ? html.length : 0);
                try {
                    oldSucc(html);
                    console.log("HOOK oldSucc finished successfully!");
                } catch(e) {
                    console.error("HOOK oldSucc ERROR:", e.stack);
                }
            };
            const oldErr = pc.errorfunction;
            pc.errorfunction = function() {
                console.error("HOOK errorfunction CALLED!");
                oldErr();
            };
            openLink('statusMgr');
            return "openLink called";
        }
        """)
        print("Hook setup result:", hook_res)

        await page.wait_for_timeout(3000)

        after_status = await page.evaluate("""
        () => {
            return {
                htmlLen: $("#commPageContainer").html().length,
                tipDisplay: $("#tipLayer").css("display"),
                blackMask: $("#blackMask").css("display")
            };
        }
        """)
        print("After status:", after_status)

        await browser.close()

if __name__ == "__main__":
    asyncio.run(test_fragment_load())
