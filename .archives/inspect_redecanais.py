import urllib.request
import re

headers = {
    'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/130.0.0.0 Safari/537.36',
    'Referer': 'https://redecanais.fm/'
}

url = 'https://redecanais.fm/'
req = urllib.request.Request(url, headers=headers)
try:
    html = urllib.request.urlopen(req, timeout=10).read().decode('utf-8', errors='ignore')
    print("RedeCanais home len:", len(html))
    # Find links to movies or players
    links = re.findall(r'href=["\']([^"\']*(?:filme|serie|video|player)[^"\']*)["\']', html, re.I)
    print("Found links:", links[:10])
except Exception as e:
    print("Error:", e)
