import urllib.request
import gzip
import re

headers = {
    'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/130.0.0.0 Safari/537.36',
    'Referer': 'https://redecanais.by/'
}

url = 'https://redecanais.by/browse-filmes-lancamentos-videos-1-date.html'
req = urllib.request.Request(url, headers=headers)
data = urllib.request.urlopen(req).read()
try:
    html = gzip.decompress(data).decode('utf-8', errors='ignore')
except:
    html = data.decode('utf-8', errors='ignore')

# Movie items on redecanais usually have href="...video.html" or "..._....html"
items = re.findall(r'href=["\'](https?://redecanais\.by/[^"\']+-video\.html|/[^"\']+-video\.html|[^"\']+_[\w\d]+\.html)["\']', html)
print("Found video items:", len(items))
for it in list(set(items))[:5]:
    print(" ", it)

if items:
    sample = items[0]
    if not sample.startswith('http'):
        sample = 'https://redecanais.by/' + sample.lstrip('/')
    print("Fetching sample:", sample)
    req2 = urllib.request.Request(sample, headers=headers)
    data2 = urllib.request.urlopen(req2).read()
    try:
        html2 = gzip.decompress(data2).decode('utf-8', errors='ignore')
    except:
        html2 = data2.decode('utf-8', errors='ignore')
    
    iframes = re.findall(r'<iframe[^>]+src=["\']([^"\']+)["\']', html2)
    print("Iframes on video page:")
    for ifr in iframes:
        print("  ", ifr)
    
    # Also look for embed player or video player
    players = re.findall(r'https?://[^\s"\'<>]*(?:player|embed|stream|m3u8|mp4)[^\s"\'<>]*', html2)
    print("Player/stream links:")
    for p in set(players)[:10]:
        print("  ", p)
