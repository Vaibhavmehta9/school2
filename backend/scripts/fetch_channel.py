import urllib.request
import re
import json

url = "https://www.youtube.com/@sherwoodcollegenainital5366/videos"
headers = {
    "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
    "Accept-Language": "en-US,en;q=0.9",
}

req = urllib.request.Request(url, headers=headers)
try:
    with urllib.request.urlopen(req, timeout=10) as resp:
        html = resp.read().decode("utf-8")
        
        # Look for ytInitialData
        pattern = r"var ytInitialData = ({.*?});</script>"
        m = re.search(pattern, html)
        if m:
            data = json.loads(m.group(1))
            print("Extracted ytInitialData successfully!")
            # Traverse tabs
            with open("channel_data.json", "w", encoding="utf-8") as f:
                json.dump(data, f, indent=2)
        else:
            # Fallback regex
            video_ids = list(dict.fromkeys(re.findall(r'"videoId":"([a-zA-Z0-9_-]{11})"', html)))
            print("Video IDs found:", video_ids[:15])
            with open("channel_raw.html", "w", encoding="utf-8") as f:
                f.write(html)
except Exception as e:
    print("Error:", e)
