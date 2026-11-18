import urllib.request
import re

headers = {
    'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/130.0.0.0 Safari/537.36',
    'Referer': 'https://redecanais.by/'
}

url = 'https://redecanais.by/'
req = urllib.request.Request(url, headers=headers)
html = urllib.request.urlopen(req, timeout=10).read().decode('utf-8', errors='ignore')

links = re.findall(r'href=["\']([^"\']+)["\']', html)
clean_links = [l for l in set(links) if not l.startswith('#') and len(l) > 5 and not l.endswith('.css') and not l.endswith('.js')]
print("Total links:", len(clean_links))
for l in clean_links[:15]:
    print(" ", l)
