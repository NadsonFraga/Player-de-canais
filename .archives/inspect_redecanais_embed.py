import urllib.request
import gzip
import re

headers = {
    'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/130.0.0.0 Safari/537.36',
    'Referer': 'https://redecanais.by/sem-desistir-dublado-2026-1080p_3849b067b.html'
}

endpoints = [
    'https://redecanais.by/player3/server.php?categoria=vod&server=RCFServer2&subfolder=ondemand&vid=SEMDSTR',
    'https://redecanais.by/embed.php?vid=3849b067b'
]

for ep in endpoints:
    print("\n=== Fetching:", ep)
    req = urllib.request.Request(ep, headers=headers)
    try:
        res = urllib.request.urlopen(req)
        data = res.read()
        try:
            html = gzip.decompress(data).decode('utf-8', errors='ignore')
        except:
            html = data.decode('utf-8', errors='ignore')
        print("Status:", res.status, "len:", len(html))
        # Look for video src, m3u8, mp4, jwplayer, artplayer, clappr, or iframes
        video_srcs = re.findall(r'https?://[^\s"\'<>]+\.(?:m3u8|mp4)[^\s"\'<>]*', html)
        print("Video streams found:", video_srcs)
        inner_iframes = re.findall(r'<iframe[^>]+src=["\']([^"\']+)["\']', html)
        print("Inner iframes:", inner_iframes)
        # Search for file: or source:
        sources = re.findall(r'(?:file|sources?|src)\s*:\s*["\']([^"\']+)["\']', html)
        print("Sources/files:", sources[:5])
    except Exception as e:
        print("Error:", e)
