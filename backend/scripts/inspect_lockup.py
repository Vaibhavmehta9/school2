import json

with open("channel_data.json", "r", encoding="utf-8") as f:
    data = json.load(f)

tabs = data.get("contents", {}).get("twoColumnBrowseResultsRenderer", {}).get("tabs", [])
for t in tabs:
    tab_renderer = t.get("tabRenderer", {})
    if tab_renderer.get("title") == "Videos":
        content = tab_renderer.get("content", {})
        rg = content.get("richGridRenderer", {})
        contents = rg.get("contents", [])
        for i, item in enumerate(contents):
            if "richItemRenderer" in item:
                content_item = item["richItemRenderer"].get("content", {})
                if "lockupViewModel" in content_item:
                    lvm = content_item["lockupViewModel"]
                    print(f"Item {i}:")
                    print("contentId:", lvm.get("contentId"))
                    print("metadata:", json.dumps(lvm.get("metadata", {}), indent=2))
                    renderer_context = lvm.get("rendererContext", {})
                    # Also look for on-tap command
                    print("onTap:", json.dumps(lvm.get("onTap", {}), indent=2))
                    print("="*40)
