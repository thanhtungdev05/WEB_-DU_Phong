import re
import json

with open('devices/ac1000z/src/www/index.html', 'r', encoding='utf-8') as f:
    c = f.read()

m = re.search(r'var menuTreeJSON = (\[.*?\]);', c, re.DOTALL)
if m:
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
                "area": node["area"][0].get("area", "") if node["area"] else ""
            })
        for child in children:
            parse_node(child, current)
            
    for top in data:
        parse_node(top)
        
    print(f"Total navigable leaf pages: {len(leaf_pages)}")
    for i, p in enumerate(leaf_pages, 1):
        print(f"{i:2d}. ID: {p['id']:<25} | Path: {p['path']}")
