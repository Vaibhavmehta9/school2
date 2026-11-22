import json

with open("channel_data.json", "r", encoding="utf-8") as f:
    data = json.load(f)

videos = []

def extract_videos(obj):
    if isinstance(obj, dict):
        if "videoRenderer" in obj:
            vr = obj["videoRenderer"]
            vid = vr.get("videoId")
            title = vr.get("title", {}).get("runs", [{}])[0].get("text", "")
            length = vr.get("lengthText", {}).get("simpleText", "")
            published = vr.get("publishedTimeText", {}).get("simpleText", "")
            view_count = vr.get("viewCountText", {}).get("simpleText", "")
            thumbnails = vr.get("thumbnail", {}).get("thumbnails", [])
            thumb = thumbnails[-1].get("url") if thumbnails else ""
            videos.append({
                "videoId": vid,
                "title": title,
                "length": length,
                "published": published,
                "viewCount": view_count,
                "thumbnail": thumb
            })
        for v in obj.values():
            extract_videos(v)
    elif isinstance(obj, list):
        for item in obj:
            extract_videos(item)

extract_videos(data)

print(f"Total videos extracted: {len(videos)}")
for i, v in enumerate(videos, 1):
    print(f"{i}. ID: {v['videoId']} | Length: {v['length']} | Published: {v['published']}")
    print(f"   Title: {v['title']}")
    print(f"   URL: https://www.youtube.com/watch?v={v['videoId']}")
    print()
