"""
Channel Stream Extractor for TVzinha Online.
Scrapes and extracts direct HLS streams from embed providers (e.g. EmbedTV clusters)
and optionally updates data/canais.json and assets/js/core/fallbackChannels.js directly.

Usage:
    python tools/extract_channel_stream.py --slug sportv3
    python tools/extract_channel_stream.py --slug sportv3 --name "SporTV 3" --update
"""

import os
import sys
import re
import json
import argparse
import urllib.request
import ssl

USER_AGENT = (
    "Mozilla/5.0 (Windows NT 10.0; Win64; x64) "
    "AppleWebKit/537.36 (KHTML, like Gecko) "
    "Chrome/124.0.0.0 Safari/537.36"
)

ROOT_DIR = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
CANAIS_JSON_PATH = os.path.join(ROOT_DIR, "data", "canais.json")
FALLBACK_JS_PATH = os.path.join(ROOT_DIR, "assets", "js", "core", "fallbackChannels.js")

# Primary and backup CDN subdomains on active infrastructure
PRIMARY_CDN_PREFIX = "5eae58763dcbe2a0584afac0ef91415a"
BACKUP_CDN_PREFIX = "52d080a3e172c33fd6886a37e7"

EMBED_ENDPOINTS = [
    "https://w7.embedtv.cc/{slug}",
    "https://w7.embedtv.lat/{slug}",
    "https://7a6111736975081d37f185029a1fc088.embedtv.cc/{slug}"
]

def fetch_url(url, timeout=10):
    ctx = ssl._create_unverified_context()
    req = urllib.request.Request(
        url,
        headers={
            "User-Agent": USER_AGENT,
            "Accept": "text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8",
            "Accept-Language": "pt-BR,pt;q=0.9,en-US;q=0.8,en;q=0.7",
            "Referer": "https://google.com/"
        }
    )
    try:
        with urllib.request.urlopen(req, timeout=timeout, context=ctx) as resp:
            return resp.read().decode("utf-8", errors="ignore")
    except Exception as exc:
        return None

def extract_stream_from_embed(slug):
    """Fetches embed page and parses the dynamic stream URL."""
    html = None
    for endpoint in EMBED_ENDPOINTS:
        target = endpoint.format(slug=slug)
        html = fetch_url(target, timeout=10)
        if html and "const src" in html:
            break

    if not html:
        return None, f"Could not fetch working embed page for slug '{slug}'"

    match = re.search(r'const\s+src\s*=\s*"([^"]+)"', html)
    if not match:
        return None, f"No stream URL found in embed HTML for slug '{slug}'"

    raw_src = match.group(1)

    m_base = re.match(r'^(https://[^/]+/stream/[^/]+/).*$', raw_src)
    if not m_base:
        return None, f"Unexpected stream URL pattern: {raw_src}"

    base_path = m_base.group(1)
    
    # Extract domain suffix (e.g. s25-cloudfront-net.lat)
    domain_match = re.search(r'https://[^.]+\.([^/]+)', base_path)
    domain_suffix = domain_match.group(1) if domain_match else "s25-cloudfront-net.lat"
    
    # Path token: /stream/<token>/
    token_match = re.search(r'/stream/([^/]+)/', base_path)
    stream_token = token_match.group(1) if token_match else ""

    src1 = f"https://{PRIMARY_CDN_PREFIX}.{domain_suffix}/stream/{stream_token}/error.txt"
    src2 = f"https://{BACKUP_CDN_PREFIX}.{domain_suffix}/stream/{stream_token}/error.txt"

    return {
        "slug": slug,
        "raw_src": raw_src,
        "token": stream_token,
        "primary_url": src1,
        "backup_url": src2,
    }, None

def find_channel_in_data(data, slug, channel_name):
    """Finds category and channel key across nested dictionary categories."""
    for cat_name, channels in data.items():
        if isinstance(channels, dict):
            for ch_name, ch_data in channels.items():
                if ch_name.lower() == channel_name.lower():
                    return cat_name, ch_name
                sources = ch_data.get("sources", [])
                if any(s.get("slug") == slug for s in sources):
                    return cat_name, ch_name
    return None, None

def update_channel_data(slug, channel_name, src1, src2):
    """Updates data/canais.json and assets/js/core/fallbackChannels.js."""
    if not os.path.exists(CANAIS_JSON_PATH):
        print(f"[Error] {CANAIS_JSON_PATH} not found.")
        return False

    with open(CANAIS_JSON_PATH, "r", encoding="utf-8") as f:
        data = json.load(f)

    cat_name, ch_name = find_channel_in_data(data, slug, channel_name)
    if not cat_name or not ch_name:
        print(f"[Warning] Channel with slug '{slug}' or name '{channel_name}' not found in canais.json.")
        return False

    # Update sources
    new_sources = [
        {
            "name": "Servidor 1 (Principal)",
            "url": src1,
            "slug": slug,
            "cdn": "CDN 1"
        },
        {
            "name": "Servidor 2 (Backup)",
            "url": src2,
            "slug": slug,
            "cdn": "CDN 2"
        }
    ]
    data[cat_name][ch_name]["sources"] = new_sources

    # Prune obsolete / dead contingency links for this channel
    contingency = data[cat_name][ch_name].get("contingency", {})
    cleaned_contingency = {}
    for c_name, c_url in contingency.items():
        if "nossoplayer" in c_url or "dlive.sx" in c_url or "localhost70.xyz" in c_url:
            continue
        cleaned_contingency[c_name] = c_url
    
    # Ensure Servidor 5 (EmbedTV) is present
    cleaned_contingency["Servidor 5 (EmbedTV)"] = f"https://w7.embedtv.cc/{slug}"
    data[cat_name][ch_name]["contingency"] = cleaned_contingency

    with open(CANAIS_JSON_PATH, "w", encoding="utf-8") as f:
        json.dump(data, f, indent=2, ensure_ascii=False)
    print(f"[OK] Updated {CANAIS_JSON_PATH} for channel '[{cat_name}] {ch_name}'.")

    # Update fallbackChannels.js
    if os.path.exists(FALLBACK_JS_PATH):
        with open(FALLBACK_JS_PATH, "r", encoding="utf-8") as f:
            js_content = f.read()

        m_json = re.search(r'export\s+const\s+FALLBACK_CHANNELS\s*=\s*({[\s\S]*?});\s*$', js_content)
        if m_json:
            try:
                fallback_obj = json.loads(m_json.group(1))
                fb_cat, fb_ch = find_channel_in_data(fallback_obj, slug, channel_name)
                if fb_cat and fb_ch:
                    fallback_obj[fb_cat][fb_ch]["sources"] = new_sources
                    fallback_obj[fb_cat][fb_ch]["contingency"] = cleaned_contingency
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
                    print(f"[OK] Updated {FALLBACK_JS_PATH} for channel '[{fb_cat}] {fb_ch}'.")
            except Exception as e:
                print(f"[Warning] Could not parse FALLBACK_CHANNELS in {FALLBACK_JS_PATH}: {e}")

    return True

def main():
    parser = argparse.ArgumentParser(description="Extract live HLS stream for a channel.")
    parser.add_argument("--slug", default="sportv3", help="Channel slug (e.g. sportv3, sportv2, sportv)")
    parser.add_argument("--name", default="SporTV 3", help="Channel display name in canais.json")
    parser.add_argument("--update", action="store_true", help="Automatically update canais.json and fallbackChannels.js")
    args = parser.parse_args()

    slug = args.slug.strip().lower()
    print(f"[*] Extracting stream for slug: '{slug}'...")

    result, err = extract_stream_from_embed(slug)
    if err:
        print(f"[FAIL] {err}")
        sys.exit(1)

    print(f"[*] Raw embed stream: {result['raw_src']}")
    print(f"[*] Primary URL:     {result['primary_url']}")
    print(f"[*] Backup URL:      {result['backup_url']}")

    if args.update:
        print(f"[*] Applying updates to repository data files for '{args.name}'...")
        updated = update_channel_data(slug, args.name, result["primary_url"], result["backup_url"])
        if updated:
            print("[SUCCESS] All files updated and synchronized.")
        else:
            print("[FAIL] Failed to update data files.")
            sys.exit(1)
    else:
        print("[INFO] Run with --update to persist these sources into canais.json and fallbackChannels.js.")

if __name__ == "__main__":
    main()
