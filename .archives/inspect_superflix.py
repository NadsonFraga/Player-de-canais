import urllib.request
import re

url = "https://superflixapi.boats/filme/550"
headers = {
    'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/130.0.0.0 Safari/537.36',
    'Referer': 'https://tvzinhaonline.pages.dev/'
}

req = urllib.request.Request(url, headers=headers)
try:
    html = urllib.request.urlopen(req).read().decode('utf-8', errors='ignore')
    print("SuperFlix HTML length:", len(html))
    # Look for scripts, iframes, players, m3u8
    m3u8s = re.findall(r'https?://[^\s"\'<>]+\.m3u8[^\s"\'<>]*', html)
    print("Found m3u8:", m3u8s)
    iframes = re.findall(r'<iframe[^>]+src=["\']([^"\']+)["\']', html)
    print("Found iframes:", iframes)
    scripts = re.findall(r'<script[^>]+src=["\']([^"\']+)["\']', html)
    print("Found script src:", scripts)
except Exception as e:
    print("SuperFlix error:", e)
