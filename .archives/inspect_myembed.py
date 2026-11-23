import urllib.request
import re

url = "https://myembed.biz/filme/550"
req = urllib.request.Request(url, headers={'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64)'})
html = urllib.request.urlopen(req).read().decode('utf-8', errors='ignore')

print("=== Streams ===")
streams = re.findall(r'https?://[^\s"\'<>]+\.(?:m3u8|mp4)[^\s"\'<>]*', html)
for s in set(streams):
    print(" ", s)

print("=== Iframes ===")
iframes = re.findall(r'<iframe[^>]+src=["\']([^"\']+)["\']', html)
for i in set(iframes):
    print(" ", i)

print("=== APIs / Fetches ===")
apis = re.findall(r'fetch\([\'"]([^\'"]+)[\'"]', html)
for a in set(apis):
    print(" ", a)

print("=== Player configs ===")
configs = re.findall(r'(?:file|source|url|stream)\s*:\s*[\'"]([^\'"]+)[\'"]', html, re.I)
for c in list(set(configs))[:10]:
    print(" ", c)
