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
        print("RichGrid contents length:", len(contents))
        for item in contents[:10]:
            print(list(item.keys()))
            if "richItemRenderer" in item:
                content_item = item["richItemRenderer"].get("content", {})
                print("richItem content keys:", list(content_item.keys()))
                if "videoRenderer" in content_item:
                    vr = content_item["videoRenderer"]
                    print("Video ID:", vr.get("videoId"))
                    print("Title:", vr.get("title", {}).get("runs", [{}])[0].get("text"))
                    print("Length:", vr.get("lengthText", {}).get("simpleText"))
                    print("---")
