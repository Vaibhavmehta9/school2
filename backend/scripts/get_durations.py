import json

with open("channel_data.json", "r", encoding="utf-8") as f:
    text = f.read()

import re
# Look for videoId and simpleText length
data = json.loads(text)
tabs = data.get("contents", {}).get("twoColumnBrowseResultsRenderer", {}).get("tabs", [])
for t in tabs:
    tab_renderer = t.get("tabRenderer", {})
    if tab_renderer.get("title") == "Videos":
        contents = tab_renderer.get("content", {}).get("richGridRenderer", {}).get("contents", [])
        for item in contents:
            lvm = item.get("richItemRenderer", {}).get("content", {}).get("lockupViewModel", {})
            vid = lvm.get("contentId")
            if not vid: continue
            # Find length text
            overlays = lvm.get("contentImage", {}).get("collectionThumbnailViewModel", {})
            # search json dump for this video
            item_str = json.dumps(item)
            length_match = re.search(r'"text":\s*"([0-9]+:[0-9]+(?::[0-9]+)?)"', item_str)
            length = length_match.group(1) if length_match else "N/A"
            title = lvm.get("metadata", {}).get("lockupMetadataViewModel", {}).get("title", {}).get("content", "")
            print(f"{vid} | {length} | {title}")
