import urllib.request
import gzip
import re

headers = {
    'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/130.0.0.0 Safari/537.36',
    'Referer': 'https://redecanais.by/embed.php?vid=3849b067b'
}

url = 'https://redecanais.by/player3/server.php?categoria=vod&server=RCFServer2&subfolder=ondemand&vid=SEMDSTR'
req = urllib.request.Request(url, headers=headers)
res = urllib.request.urlopen(req)
data = res.read()
try:
    html = gzip.decompress(data).decode('utf-8', errors='ignore')
except:
    html = data.decode('utf-8', errors='ignore')

# Search for video, hls, m3u8, mp4, Clappr, jwplayer, Artplayer, or URLs
urls = re.findall(r'https?://[^\s"\'<>,;)]+', html)
cdn_urls = [u for u in set(urls) if any(k in u for k in ['m3u8', 'mp4', 'cdn', 'stream', 'video', 'seg', 'vod', 'hls'])]
print("Found potential video/stream URLs:", len(cdn_urls))
for u in cdn_urls[:15]:
    print(" ", u)

# Check inline script snippets
scripts = re.findall(r'<script[^>]*>(.*?)</script>', html, re.S)
print("Inline scripts count:", len(scripts))
for i, s in enumerate(scripts):
    if any(k in s for k in ['player', 'source', 'video', 'hls', 'Clappr', 'setup']):
        print(f"\n--- Script {i} (len {len(s)}) ---")
        lines = [line.strip() for line in s.splitlines() if line.strip() and not line.strip().startswith('//')]
        print("\n".join(lines[:20]))
