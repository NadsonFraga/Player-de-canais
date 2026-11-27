"""
Tvzinha Online - Local Resolver Providers
Python mirror of functions/api/providers.js for local development.
"""

import json
import re
import base64
import urllib.request
import urllib.parse
import concurrent.futures

USER_AGENT = "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/130.0.0.0 Safari/537.36"

# 1. FENIXFLIX
STREMIO_FENIX_ENDPOINTS = [
    "https://fenixflix.fenixhub.online"
]

def clean_emojis(text):
    return re.sub(r'[\U00010000-\U0010ffff\u2600-\u27bf\ufe00-\ufe0f]', '', str(text or '')).strip()

def extract_cluster_name(title):
    clean = clean_emojis(title)
    m = re.search(r'\b(Zeus|Badger|Hypex|Figgs|Hydra|Apollo|Ares|Thor|Odin|Zunder|Hollymovies)\b', clean, re.I)
    return m.group(1).capitalize() if m else ""

def fetch_fenixflix(media_id, imdb_id, media_type, season=1, episode=1, audio="dubbed"):
    is_series = media_type in ("series", "serie", "tv", "anime")
    candidates = []
    if imdb_id and str(imdb_id).startswith("tt"):
        candidates.append(str(imdb_id))
    if media_id:
        candidates.append(str(media_id) if str(media_id).startswith("tmdb:") else f"tmdb:{media_id}")

    raw_streams = []
    data_title = ""

    def query_candidate(base_url, q_id):
        url = f"{base_url}/stream/series/{q_id}:{season}:{episode}.json" if is_series else f"{base_url}/stream/movie/{q_id}.json"
        req = urllib.request.Request(url, headers={"User-Agent": USER_AGENT, "Accept": "application/json"})
        try:
            with urllib.request.urlopen(req, timeout=6) as res:
                if res.status == 200:
                    j = json.loads(res.read().decode("utf-8"))
                    if isinstance(j.get("streams"), list) and j["streams"]:
                        return j.get("title", ""), j["streams"]
        except Exception:
            pass
        return "", []

    tasks = []
    for base in STREMIO_FENIX_ENDPOINTS:
        for q in candidates:
            tasks.append((base, q))

    if tasks:
        with concurrent.futures.ThreadPoolExecutor(max_workers=min(len(tasks), 10)) as executor:
            futures = [executor.submit(query_candidate, b, q) for b, q in tasks]
            seen_urls = set()
            for fut in concurrent.futures.as_completed(futures):
                try:
                    title, streams = fut.result()
                    if title and not data_title:
                        data_title = title
                    for s in streams:
                        u = s.get("url")
                        if u and u not in seen_urls:
                            seen_urls.add(u)
                            raw_streams.append(s)
                except Exception:
                    pass

    if not raw_streams:
        return None

    try:
        seen_clusters = set()
        parsed = []
        for s in raw_streams:
            u = s.get("url")
            if not u or not isinstance(u, str):
                continue
            raw_title = s.get("title", "")
            raw_name = s.get("name", "")
            text = f"{raw_name} {raw_title}".lower()
            quality = 1080
            if "4k" in text or "2160p" in text:
                quality = 2160
            elif "1440p" in text or "2k" in text:
                quality = 1440
            elif "1080p" in text or "fhd" in text or "full hd" in text or "fullhd" in text:
                quality = 1080
            elif "720p" in text or "hd" in text:
                quality = 720
            elif "480p" in text or "sd" in text:
                quality = 480
            elif "360p" in text:
                quality = 360

            is_subbed = "legendado" in text or "subbed" in text
            is_dubbed = (
                "dublado" in text
                or "nacional" in text
                or "dual" in text
                or "multi" in text
                or "tri áudio" in text
                or "tri audio" in text
                or "pt-br" in text
                or "ptbr" in text
                or ("🇧🇷" in raw_title and not is_subbed)
            )
            is_hls = ".m3u8" in u or "hls-proxy" in u or "/hls" in u or s.get("type") == "hls"

            raw_url = (u or "").lower()
            provider_tier = 3
            is_bot_stream = "/stream/" in raw_url or "squareweb.app" in raw_url or "fenixbot" in raw_url or "koyeb.app" in raw_url
            if "fenixhub.online" in raw_url:
                provider_tier = 4
            elif "zunder" in text or "zunderflix" in raw_url:
                provider_tier = 3
            elif "hollymovies" in text or "embedplayer2" in raw_url:
                provider_tier = 2
            elif is_bot_stream:
                provider_tier = 1

            cluster = extract_cluster_name(raw_title)
            dedup_key = (quality, cluster, "dub" if is_dubbed else "sub")
            if dedup_key in seen_clusters:
                continue
            seen_clusters.add(dedup_key)

            tag = "Dual Áudio" if "dual" in text else ("Dublado" if is_dubbed else ("Legendado" if is_subbed else "Original"))
            label_parts = [f"Fenix {quality}p"]
            if cluster:
                label_parts.append(f"· {cluster}")
            label_parts.append(f"[{tag}]")
            clean_label = " ".join(label_parts)

            parsed.append({
                "label": clean_label,
                "cluster": cluster,
                "file": u,
                "quality": quality,
                "providerTier": provider_tier,
                "type": "hls" if is_hls else "mp4",
                "isDubbed": is_dubbed,
                "isSubbed": is_subbed
            })

        # Sort: Audio preference first, then providerTier, quality, HLS
        def sort_key(s):
            pref_audio = 1 if (audio == "dubbed" and s["isDubbed"]) or (audio == "subtitled" and s["isSubbed"]) else 0
            return (pref_audio, s["providerTier"], s["quality"], 1 if s["type"] == "hls" else 0)

        parsed.sort(key=sort_key, reverse=True)
        return {"title": data_title or "", "sources": parsed}
    except Exception:
        return None

