import asyncio
import os
import re
import sys
import json
sys.stdout.reconfigure(encoding='utf-8')
from playwright.async_api import async_playwright

HERE = os.path.dirname(os.path.abspath(__file__))
WWW = os.path.join(HERE, "src", "www")

async def run_audit():
    print("="*70)
    print("KIỂM TRA TOÀN DIỆN TẤT CẢ CÁC TRANG & MENU XEM CÒN BỊ KẸT SPINNER KHÔNG")
    print("="*70)

    # 1. Kiểm tra tĩnh file HTML
    index_file = os.path.join(WWW, "index.html")
    with open(index_file, "r", encoding="utf-8") as f:
        content = f.read()

    m = re.search(r'var menuTreeJSON = (\[.*?\]);', content)
    if not m:
        print("[LỖI] Không tìm thấy menuTreeJSON!")
        return

    menu_tree = json.loads(m.group(1))
    
    # Duyệt cây lấy danh sách tất cả các node lá và các node có area
    all_leaves = []
    
    def extract_nodes(node, path=""):
        node_id = node.get("id")
        node_name = node.get("name", node_id)
        current_path = f"{path} > {node_name}" if path else node_name
        children = node.get("children")
        if children:
            for c in children:
                extract_nodes(c, current_path)
        else:
            all_leaves.append({
                "id": node_id,
                "name": node_name,
                "path": current_path,
                "area": node.get("area", [])
            })

    for top in menu_tree:
        extract_nodes(top)

    print(f"\n[PHÂN TÍCH CẤU TRÚC] Tổng số trang / leaf menu trong toàn hệ thống: {len(all_leaves)}")
    
    # Kiểm tra sự tồn tại của file fragment cho từng leaf
    missing_files = []
    for item in all_leaves:
        f_name = f"{item['id']}.html"
        f_path = os.path.join(WWW, f_name)
        if not os.path.exists(f_path):
            missing_files.append((item['id'], item['path'], f_name))

    print(f"[KIỂM TRA TĨNH] Số trang thiếu file fragment HTML: {len(missing_files)}")
    for mid, path, fname in missing_files:
        print(f"  [!] Thiếu: {fname} (Menu: {path})")

    # 2. Kiểm tra động bằng Playwright trên trình duyệt thực
    print("\n" + "="*70)
    print("[KIỂM TRA ĐỘNG] Chạy Playwright duyệt tự động mọi menu trên giao diện")
    print("="*70)

    results = []

    async with async_playwright() as p:
        browser = await p.chromium.launch(headless=True)
        page = await browser.new_page(viewport={"width": 1400, "height": 900})

        console_errors = []
        page_errors = []
        page.on("console", lambda m: console_errors.append(f"[{m.type}] {m.text}") if m.type in ("error", "warning") else None)
        page.on("pageerror", lambda e: page_errors.append(str(e)))

        print("Đang truy cập http://127.0.0.1:8098/...")
        await page.goto("http://127.0.0.1:8098/")
        await page.wait_for_timeout(1000)

        if await page.query_selector("#Frm_Username"):
            print("Đang đăng nhập...")
            await page.fill("#Frm_Username", "admin")
            await page.fill("#Frm_Password", "admin")
            await page.click("#LoginId")
            await page.wait_for_selector("#mainNavigator", timeout=10000)
            await page.wait_for_timeout(1500)

        # Trích xuất toàn bộ selector có thể click trong cây menu trực tiếp từ trang
        menu_items_on_page = await page.evaluate('''() => {
            let items = [];
            // Lấy các menu top
            document.querySelectorAll("#mainNavigator li, #mainNavigator a").forEach(el => {
                if (el.id && el.offsetParent !== null) {
                    items.push({ id: el.id, text: el.innerText.trim(), level: 1 });
                }
            });
            return items;
        }''')

        print(f"Các menu chính trên thanh điều hướng top: {[m['text'] + ' (#' + m['id'] + ')' for m in menu_items_on_page]}")

        # Duyệt qua từng menu chính
        for top_menu in menu_items_on_page:
            top_id = top_menu["id"]
            top_text = top_menu["text"]
            if not top_id:
                continue

            print(f"\n---> [Menu Cấp 1] Click: {top_text} (#{top_id})")
            await page.click(f"#{top_id}")
            await page.wait_for_timeout(2000)

            # Lấy các menu cấp 2 (Left bar)
            sub_menus = await page.evaluate('''() => {
                let subs = [];
                // Selector menu cấp 2 trong template
                document.querySelectorAll("#menuBar ul li, .menuTwo, .menuThree, [id^='menu_']").forEach(el => {
                    if (el.id && el.offsetParent !== null) {
                        subs.push({ id: el.id, text: el.innerText.trim(), tag: el.tagName });
                    }
                });
                return subs;
            }''')

            # Kiểm tra trạng thái spinner ngay sau khi vào menu cấp 1
            tip_disp = await page.evaluate("document.getElementById('tipLayer') ? window.getComputedStyle(document.getElementById('tipLayer')).display : 'none'")
            mask_disp = await page.evaluate("document.getElementById('blackMask') ? window.getComputedStyle(document.getElementById('blackMask')).display : 'none'")
            status_top = "PASS" if tip_disp == 'none' and mask_disp == 'none' else "STUCK_SPINNER"
            print(f"     Trạng thái {top_text}: spinner={tip_disp}, mask={mask_disp} -> {status_top}")
            results.append({"path": top_text, "id": top_id, "status": status_top, "tip": tip_disp})

            # Nếu có submenu, duyệt qua từng submenu cấp 2 & 3
            if sub_menus:
                print(f"     Tìm thấy {len(sub_menus)} submenu items hiển thị")
                for sub in sub_menus:
                    sub_id = sub["id"]
                    sub_text = sub["text"]
                    if not sub_id or sub_id == top_id:
                        continue
                    try:
                        # Click submenu
                        await page.click(f"#{sub_id}", timeout=3000)
                        await page.wait_for_timeout(1500)

                        tip_disp_sub = await page.evaluate("document.getElementById('tipLayer') ? window.getComputedStyle(document.getElementById('tipLayer')).display : 'none'")
                        mask_disp_sub = await page.evaluate("document.getElementById('blackMask') ? window.getComputedStyle(document.getElementById('blackMask')).display : 'none'")
                        sub_st = "PASS" if tip_disp_sub == 'none' and mask_disp_sub == 'none' else "STUCK_SPINNER"
                        print(f"       + Submenu '{sub_text}' (#{sub_id}): spinner={tip_disp_sub} -> {sub_st}")
                        results.append({"path": f"{top_text} > {sub_text}", "id": sub_id, "status": sub_st, "tip": tip_disp_sub})
                    except Exception as err:
                        print(f"       + Submenu '{sub_text}' (#{sub_id}): Không thể click ({err})")

            # Sau khi duyệt xong mỗi menu top, thử bấm về Home xem có bị kẹt không
            await page.click("#homePage")
            await page.wait_for_timeout(1500)
            home_tip = await page.evaluate("document.getElementById('tipLayer') ? window.getComputedStyle(document.getElementById('tipLayer')).display : 'none'")
            print(f"     [Quay lại Home sau {top_text}]: spinner={home_tip} -> {'PASS' if home_tip == 'none' else 'STUCK_SPINNER'}")

        print("\n" + "="*70)
        print("TỔNG HỢP KẾT QUẢ KIỂM TRA TOÀN BỘ CÁC TRANG")
        print("="*70)
        stuck_items = [r for r in results if r["status"] != "PASS"]
        if not stuck_items and not missing_files:
            print(">>> KẾT QUẢ: 100% TẤT CẢ CÁC TRANG ĐỀU HOÀN TOÀN KHÔNG BỊ KẸT SPINNER! <<<")
        else:
            if missing_files:
                print(f"Cảnh báo thiếu {len(missing_files)} file fragment:")
                for m in missing_files:
                    print(f"  - {m[1]} ({m[0]}.html)")
            if stuck_items:
                print(f"Phát hiện {len(stuck_items)} trang bị kẹt spinner:")
                for s in stuck_items:
                    print(f"  - {s['path']} (#{s['id']})")

        await browser.close()

if __name__ == "__main__":
    asyncio.run(run_audit())
