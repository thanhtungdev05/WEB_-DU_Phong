import asyncio
import os
import re
import sys
import json
sys.stdout.reconfigure(encoding='utf-8')
from playwright.async_api import async_playwright

HERE = os.path.dirname(os.path.abspath(__file__))
WWW = os.path.join(HERE, "src", "www")

async def test_all_pages():
    print("="*75)
    print("KIỂM TRA ĐIỀU HƯỚNG VÀ SPINNER CHO TOÀN BỘ 68 TRANG TRÊN THIẾT BỊ GIẢ LẬP")
    print("="*75)

    index_file = os.path.join(WWW, "index.html")
    with open(index_file, "r", encoding="utf-8") as f:
        content = f.read()

    m = re.search(r'var menuTreeJSON = (\[.*?\]);', content)
    menu_tree = json.loads(m.group(1))

    all_targets = []
    def extract_leaves(node, path=""):
        node_id = node.get("id")
        node_name = node.get("name", node_id)
        current_path = f"{path} > {node_name}" if path else node_name
        children = node.get("children")
        if children:
            for c in children:
                extract_leaves(c, current_path)
        else:
            all_targets.append({
                "id": node_id,
                "name": node_name,
                "path": current_path
            })

    for top in menu_tree:
        extract_leaves(top)

    print(f"Tổng số trang cần kiểm tra: {len(all_targets)}")

    async with async_playwright() as p:
        browser = await p.chromium.launch(headless=True)
        page = await browser.new_page(viewport={"width": 1400, "height": 900})

        print("1. Đăng nhập vào thiết bị giả lập...")
        await page.goto("http://127.0.0.1:8098/")
        await page.wait_for_timeout(1000)

        if await page.query_selector("#Frm_Username"):
            await page.fill("#Frm_Username", "admin")
            await page.fill("#Frm_Password", "admin")
            await page.click("#LoginId")
            await page.wait_for_selector("#mainNavigator", timeout=10000)
            await page.wait_for_timeout(1500)

        passed_count = 0
        failed_count = 0
        failed_list = []

        print("\n2. Tiến hành mở lần lượt từng trang và kiểm tra trạng thái:")
        for idx, item in enumerate(all_targets, 1):
            tid = item["id"]
            pname = item["path"]

            # Mở trang bằng openLink
            try:
                await page.evaluate(f"openLink('{tid}');")
            except Exception as e:
                print(f"[{idx:02d}/{len(all_targets)}] [LỖI GỌI] {pname:<50} -> {e}")
                failed_count += 1
                failed_list.append((pname, tid, f"JS error: {e}"))
                continue

            await page.wait_for_timeout(1200)

            # Kiểm tra spinner
            tip_disp = await page.evaluate("document.getElementById('tipLayer') ? window.getComputedStyle(document.getElementById('tipLayer')).display : 'none'")
            mask_disp = await page.evaluate("document.getElementById('blackMask') ? window.getComputedStyle(document.getElementById('blackMask')).display : 'none'")
            container_len = await page.evaluate("document.getElementById('commPageContainer') ? document.getElementById('commPageContainer').innerHTML.length : (document.getElementById('homeWrapper') ? document.getElementById('homeWrapper').innerHTML.length : 0)")

            is_stuck = (tip_disp != "none" or mask_disp != "none")

            if is_stuck or container_len < 20:
                print(f"[{idx:02d}/{len(all_targets)}] [THẤT BẠI] {pname:<50} -> spinner={tip_disp}, mask={mask_disp}, html_len={container_len}")
                failed_count += 1
                failed_list.append((pname, tid, f"spinner={tip_disp}, len={container_len}"))
            else:
                passed_count += 1
                print(f"[{idx:02d}/{len(all_targets)}] [OK] {pname:<50} -> PASS (spinner={tip_disp})")

        print("\n3. Kiểm tra chuyển từ trang cuối cùng về lại Home...")
        await page.click("#homePage")
        await page.wait_for_timeout(1500)
        home_tip = await page.evaluate("document.getElementById('tipLayer') ? window.getComputedStyle(document.getElementById('tipLayer')).display : 'none'")
        print(f"   Trạng thái sau khi bấm về Home: spinner={home_tip} -> {'PASS' if home_tip == 'none' else 'THẤT BẠI'}")

        print("\n" + "="*75)
        print("TỔNG KẾT KẾT QUẢ KIỂM TRA TOÀN DIỆN 68 TRANG:")
        print("="*75)
        print(f"  + Số trang PASS: {passed_count}/{len(all_targets)} ({passed_count/len(all_targets)*100:.1f}%)")
        print(f"  + Số trang THẤT BẠI: {failed_count}/{len(all_targets)}")

        if failed_count > 0:
            print("\nDANH SÁCH CÁC TRANG BỊ LỖI:")
            for p, tid, reason in failed_list:
                print(f"  - {p} (id: {tid}): {reason}")
        else:
            print("\n>>> KHÔNG CÒN BẤT KỲ TRANG NÀO BỊ KẸT SPINNER HOẶC LỖI ĐIỀU HƯỚNG! <<<")

        await browser.close()

if __name__ == "__main__":
    asyncio.run(test_all_pages())
