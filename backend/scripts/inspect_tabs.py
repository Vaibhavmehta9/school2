import json

with open("channel_data.json", "r", encoding="utf-8") as f:
    text = f.read()

import re
video_matches = re.findall(r'"videoId":"([a-zA-Z0-9_-]{11})"', text)
unique_vids = list(dict.fromkeys(video_matches))
print("Found video IDs in text:", len(unique_vids), unique_vids[:20])

data = json.loads(text)
tabs = data.get("contents", {}).get("twoColumnBrowseResultsRenderer", {}).get("tabs", [])
print(f"Tabs count: {len(tabs)}")
for t in tabs:
    tab_renderer = t.get("tabRenderer", {})
    title = tab_renderer.get("title", "")
    selected = tab_renderer.get("selected", False)
    print(f"Tab: '{title}' | selected: {selected}")
    content = tab_renderer.get("content", {})
    print("Content keys:", list(content.keys()) if content else "None")
