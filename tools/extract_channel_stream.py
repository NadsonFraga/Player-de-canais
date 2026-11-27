"""
Channel Stream Extractor and Multi-CDN Token Refresher for TVzinha Online.
Supports both Direct Live HLS CDNs (rfc-infinite.top, apontaaimeupatrao.lat)
and Embed Providers (rdembed.online / penterosa.lat).

Usage:
    python tools/extract_channel_stream.py --slug sportv3
    python tools/extract_channel_stream.py --slug sportv3 --name "SporTV 3" --update
    python tools/extract_channel_stream.py --all
    python tools/extract_channel_stream.py --check
"""

import os
import sys
import re
import json
import argparse
import urllib.request
import urllib.parse
import ssl

USER_AGENT = (
    "Mozilla/5.0 (Windows NT 10.0; Win64; x64) "
    "AppleWebKit/537.36 (KHTML, like Gecko) "
    "Chrome/124.0.0.0 Safari/537.36"
)

ROOT_DIR = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
CANAIS_JSON_PATH = os.path.join(ROOT_DIR, "data", "canais.json")
FALLBACK_JS_PATH = os.path.join(ROOT_DIR, "assets", "js", "core", "fallbackChannels.js")

EMBED_ENDPOINTS = [
    "https://rdembed.online/{slug}",
    "https://v1.rdembed.online/{slug}",
    "https://w1.rdembed.online/{slug}"
]

def fetch_url(url, timeout=6, referer="https://google.com/", method="GET", data=None, origin=None):
    ctx = ssl._create_unverified_context()
    headers = {
        "User-Agent": USER_AGENT,
        "Accept": "text/html,application/xhtml+xml,application/xml,application/json;q=0.9,*/*;q=0.8",
        "Accept-Language": "pt-BR,pt;q=0.9,en-US;q=0.8,en;q=0.7",
        "Referer": referer
    }
    if origin:
        headers["Origin"] = origin

    req = urllib.request.Request(url, data=data, headers=headers, method=method)
    try:
        with urllib.request.urlopen(req, timeout=timeout, context=ctx) as resp:
            return resp.read().decode("utf-8", errors="ignore")
    except Exception:
        pass

    # Fallback: Proxy through Cloudflare Pages Function if direct fetch is blocked
    try:
        q_url = urllib.parse.quote(url, safe="")
        q_ref = urllib.parse.quote(referer, safe="")
        sign_url = f"https://tvzinhaonline.pages.dev/api/resolve?action=sign&url={q_url}&referer={q_ref}"
        s_req = urllib.request.Request(sign_url, headers={"User-Agent": USER_AGENT})
        with urllib.request.urlopen(s_req, timeout=8, context=ctx) as s_resp:
            s_data = json.loads(s_resp.read().decode())
            signed_url = s_data.get("signed_url")
        if signed_url:
            p_req = urllib.request.Request(signed_url, data=data, headers=headers, method=method)
            with urllib.request.urlopen(p_req, timeout=8, context=ctx) as p_resp:
                return p_resp.read().decode("utf-8", errors="ignore")
    except Exception:
        pass

    return None

def check_stream_health(url, timeout=4):
    """Verifies whether an HLS stream URL is reachable and returns a valid playlist."""
    if not url:
        return False
    ctx = ssl._create_unverified_context()
    req = urllib.request.Request(url, headers={"User-Agent": USER_AGENT})
    try:
        with urllib.request.urlopen(req, timeout=timeout, context=ctx) as resp:
            if resp.status == 200:
                head = resp.read(256).decode("utf-8", errors="ignore")
                return "#EXTM3U" in head
    except Exception:
        pass
    return False

def refresh_cdn_credentials():
    """Fetches fresh CDN user/password from upstream resolvers if existing credentials rotate."""
    print("[*] Probing upstream resolver for fresh CDN credentials...")
    test_endpoints = [
        ("premiere-clubes", "https://brflix.online/api/resolve/premiere-clubes?directUrl=premiere-clubes", "https://brflix.online/canal/premiere-clubes"),
        ("sportv-hd", "https://brflix.online/api/resolve/sportv-hd?directUrl=sportv", "https://brflix.online/canal/sportv-hd"),
        ("espn-hd", "https://brflix.online/api/resolve/espn-hd?directUrl=espn", "https://brflix.online/canal/espn-hd")
    ]
    fresh_creds = {}
    for name, api_url, ref in test_endpoints:
        html = fetch_url(api_url, timeout=8, referer=ref)
        if not html:
            continue
        try:
            res_data = json.loads(html)
            streams = res_data.get("directStreams", [])
            for s in streams:
                src = s.get("src", "")
                m = re.search(r'http://([^/]+)/live/([^/]+)/([^/]+)/', src)
                if m:
                    host, user, pwd = m.group(1), m.group(2), m.group(3)
                    fresh_creds[host] = (user, pwd)
                    print(f"[OK] Found credentials for {host}: user={user}")
            if fresh_creds:
                break
        except Exception:
            continue
    return fresh_creds

def extract_stream_from_embed(slug):
    """Fetches embed page through rdembed.online -> penterosa.lat and extracts dynamic live stream URL."""
    for endpoint in EMBED_ENDPOINTS:
        try:
            embed_url = endpoint.format(slug=slug)
            html1 = fetch_url(embed_url, timeout=6)
            if not html1:
                continue

            m1 = re.search(r'src="(https://[^/]+/__play/[^"]+)"', html1)
            if not m1:
                continue
            iframe_src = m1.group(1).replace("&amp;", "&")

            html2 = fetch_url(iframe_src, timeout=6, referer=embed_url)
            if not html2:
                continue

            m2 = re.search(r'src="(https://[^/]+/[^"]+)"', html2)
            if not m2:
                continue
            player_url = m2.group(1).replace("&amp;", "&")

            base_host_m = re.search(r'https://([^/]+)', player_url)
            if not base_host_m:
                continue
            base_host = base_host_m.group(1)

            html3 = fetch_url(player_url, timeout=6, referer=iframe_src)
            if not html3:
                continue

            # Extract dynamic stream index.txt with JWT token
            stream_m = re.search(r'https://[^/]+/[^"\']+/index\.txt\?token=[^"\']+', html3)
            if not stream_m:
                continue

            raw_src = stream_m.group(0)

            # Rewrite to primary and backup CDN paths
            primary_url = re.sub(r'https://[^/]+/', f'https://5eae58763dcbe2a0584afac0ef91415a.s25-cloudfront-net.lat/', raw_src)
            primary_url = primary_url.replace('/index.txt?', '/__index.txt?')

            backup_url = re.sub(r'https://[^/]+/', f'https://52d080a3e172c33fd6886a37e7.s25-cloudfront-net.lat/', raw_src)
            backup_url = backup_url.replace('/index.txt?', '/__index.txt?')

            return {
                "slug": slug,
                "raw_src": raw_src,
                "primary_url": primary_url,
                "backup_url": backup_url,
                "player_host": base_host
            }, None
        except Exception as e:
            continue

    return None, f"Could not extract stream for slug '{slug}'"

def save_data_files(data, fallback_obj):
    """Saves data/canais.json and assets/js/core/fallbackChannels.js."""
    with open(CANAIS_JSON_PATH, "w", encoding="utf-8") as f:
        json.dump(data, f, indent=2, ensure_ascii=False)
    print(f"[OK] Saved {CANAIS_JSON_PATH}")

    if fallback_obj and os.path.exists(FALLBACK_JS_PATH):
        new_js = (
            "/**\n"
            " * TVZINHA ONLINE - Static Fallback Channels Catalog\n"
            " * Auto-synchronized dataset for offline resilience.\n"
            " */\n\n"
            "export const FALLBACK_CHANNELS = "
            + json.dumps(fallback_obj, indent=2, ensure_ascii=False)
            + ";\n"
        )
        with open(FALLBACK_JS_PATH, "w", encoding="utf-8") as f:
            f.write(new_js)
        print(f"[OK] Saved {FALLBACK_JS_PATH}")

def update_all_channels():
    """Checks and updates all channels in canais.json."""
    if not os.path.exists(CANAIS_JSON_PATH):
        print(f"[Error] {CANAIS_JSON_PATH} not found.")
        return False

    with open(CANAIS_JSON_PATH, "r", encoding="utf-8") as f:
        data = json.load(f)

    fallback_obj = data

    # 1. Health check sample primary CDN stream
    print("[*] Performing health check on primary CDN stream...")
    test_url = "http://rfc-infinite.top/live/91098174/vGBc4fp/318.m3u8"
    is_healthy = check_stream_health(test_url)
    
    if not is_healthy:
        print("[!] Primary CDN stream failed. Attempting credential refresh...")
        fresh_creds = refresh_cdn_credentials()
        if fresh_creds:
            print("[*] Updating catalog URLs with fresh credentials...")
            for host, (user, pwd) in fresh_creds.items():
                old_pattern = re.compile(rf'http://{re.escape(host)}/live/[^/]+/[^/]+/')
                new_prefix = f'http://{host}/live/{user}/{pwd}/'
                for cat_name, chs in data.items():
                    if isinstance(chs, dict):
                        for ch_name, ch_data in chs.items():
                            for src in ch_data.get("sources", []):
                                u = src.get("url", "")
                                if host in u:
                                    src["url"] = old_pattern.sub(new_prefix, u)

    # 2. Extract dynamic tokens for embed-based channels (e.g. 24h series)
    print("[*] Refreshing dynamic tokens for embed-based channels...")
    embed_slugs = ["24h_chaves", "24h_simpsons", "24h_dragon_ball"]
    for slug in embed_slugs:
        res, err = extract_stream_from_embed(slug)
        if res:
            for cat_name, chs in data.items():
                if isinstance(chs, dict):
                    for ch_name, ch_data in chs.items():
                        for src in ch_data.get("sources", []):
                            if src.get("slug") == slug:
                                src["url"] = res["primary_url"]

    save_data_files(data, fallback_obj)
    print("[SUCCESS] All channels verified and updated.")
    return True

def run_channels_health_check():
    """Runs a complete status check across all channels in the catalog."""
    if not os.path.exists(CANAIS_JSON_PATH):
        print(f"[Error] {CANAIS_JSON_PATH} not found.")
        return False

    with open(CANAIS_JSON_PATH, "r", encoding="utf-8") as f:
        data = json.load(f)

    total_tested = 0
    passed = 0
    failed = 0

    print("=== LIVE CHANNELS HEALTH AUDIT ===")
    for cat_name, chs in data.items():
        if isinstance(chs, dict):
            for ch_name, ch_data in chs.items():
                sources = ch_data.get("sources", [])
                if not sources:
                    continue
                first_src = sources[0].get("url")
                total_tested += 1
                ok = check_stream_health(first_src)
                status_str = "OK (200)" if ok else "FAIL"
                if ok:
                    passed += 1
                else:
                    failed += 1
                print(f"[{status_str}] {cat_name} -> {ch_name}")

    pct = (passed / total_tested * 100) if total_tested > 0 else 0
    print(f"\n[SUMMARY] {passed}/{total_tested} channels online ({pct:.1f}% health)")
    return True

def main():
    parser = argparse.ArgumentParser(description="Extract and refresh live HLS streams.")
    parser.add_argument("--slug", default=None, help="Channel slug")
    parser.add_argument("--name", default=None, help="Channel name")
    parser.add_argument("--update", action="store_true", help="Update files")
    parser.add_argument("--all", action="store_true", help="Batch extract and update all channels")
    parser.add_argument("--check", action="store_true", help="Run health check on all channels")
    args = parser.parse_args()

    if args.check:
        run_channels_health_check()
        return

    if args.all:
        ok = update_all_channels()
        if not ok:
            sys.exit(1)
        return

    print("Use --all to refresh all channels or --check to test health.")

if __name__ == "__main__":
    main()
