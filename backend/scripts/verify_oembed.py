import urllib.request
import json

vids = [
    "7I4qHmhjK9Q", "eQInMXZn9a8", "3Jp9lAHx4jM", "TvTiEYHxAx8",
    "l6knLenWAX8", "3YaCOSSe_wI", "DH4vvUDc9CY", "d6YuaNV903Y",
    "RPynPsX0MrU", "AVOnUf5BTrc", "oWhQh0TnbHE"
]

for vid in vids:
    url = f"https://www.youtube.com/oembed?url=https://www.youtube.com/watch?v={vid}&format=json"
    try:
        req = urllib.request.Request(url, headers={"User-Agent": "Mozilla/5.0"})
        with urllib.request.urlopen(req, timeout=5) as r:
            d = json.loads(r.read().decode("utf-8"))
            print(f"{vid} => Title: '{d.get('title')}' | Channel: '{d.get('author_name')}'")
            print(f"   Thumb: {d.get('thumbnail_url')}")
    except Exception as e:
        print(f"{vid} => ERROR {e}")
