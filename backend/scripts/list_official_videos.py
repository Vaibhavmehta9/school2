import json

with open("channel_data.json", "r", encoding="utf-8") as f:
    data = json.load(f)

videos = []

tabs = data.get("contents", {}).get("twoColumnBrowseResultsRenderer", {}).get("tabs", [])
for t in tabs:
    tab_renderer = t.get("tabRenderer", {})
    if tab_renderer.get("title") == "Videos":
        content = tab_renderer.get("content", {})
        rg = content.get("richGridRenderer", {})
        contents = rg.get("contents", [])
        for item in contents:
            if "richItemRenderer" in item:
                content_item = item["richItemRenderer"].get("content", {})
                if "lockupViewModel" in content_item:
                    lvm = content_item["lockupViewModel"]
                    vid = lvm.get("contentId")
                    meta = lvm.get("metadata", {}).get("lockupMetadataViewModel", {})
                    title = meta.get("title", {}).get("content", "")
                    
                    # Extract views and time
                    rows = meta.get("metadata", {}).get("contentMetadataViewModel", {}).get("metadataRows", [])
                    details = []
                    for r in rows:
                        for p in r.get("metadataParts", []):
                            txt = p.get("text", {}).get("content", "")
                            if txt:
                                details.append(txt)
                    
                    videos.append({
                        "id": vid,
                        "title": title,
                        "details": " • ".join(details),
                        "url": f"https://www.youtube.com/watch?v={vid}"
                    })

print(f"Total official videos found: {len(videos)}")
for i, v in enumerate(videos, 1):
    print(f"{i}. [{v['id']}] {v['title']} ({v['details']})")
    print(f"   URL: {v['url']}")
