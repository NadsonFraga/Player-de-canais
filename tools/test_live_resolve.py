import urllib.request
import json
import urllib.parse

cases = [
    {'title': "JoJo's Bizarre Adventure", 'season': 5, 'episode': 1, 'season_name': 'Stone Ocean'},
    {'title': "JoJo's Bizarre Adventure", 'season': 4, 'episode': 1, 'season_name': 'Golden Wind'},
    {'title': "JoJo's Bizarre Adventure", 'season': 1, 'episode': 1, 'season_name': 'Phantom Blood'},
]

for c in cases:
    params = urllib.parse.urlencode({
        'type': 'anime',
        'lang': 'sub',
        'title': c['title'],
        'season': c['season'],
        'episode': c['episode'],
        'season_name': c['season_name'],
    })
    url = f"http://localhost:8787/api/resolve?{params}"
    try:
        req = urllib.request.Request(url, headers={'User-Agent': 'TestClient/1.0'})
        with urllib.request.urlopen(req, timeout=12) as res:
            data = json.loads(res.read().decode('utf-8'))
        source_label = data.get('primary_source', {}).get('label')
        stream_url = data.get('primary_source', {}).get('stream_url', '')[:80]
        mal_id = data.get('aniskip', {}).get('mal_id')
        print(f"SUCCESS [T{c['season']}: {c['season_name']}]: MAL ID = {mal_id} | Label = {source_label} | Stream = {stream_url}...")
    except Exception as e:
        print(f"ERROR [T{c['season']}: {c['season_name']}]: {e}")
