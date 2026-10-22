"""
Tvzinha Online - Local Resolver Providers
Python mirror of functions/api/providers.js for local development.
"""

import json
import base64
import urllib.request
import urllib.parse

USER_AGENT = "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/130.0.0.0 Safari/537.36"

# 1. FENIXFLIX
def fetch_fenixflix(media_id, imdb_id, media_type, season=1, episode=1, audio="dubbed"):
    is_series = media_type in ("series", "serie", "tv")
    query_id = imdb_id if (imdb_id and imdb_id.startswith("tt")) else (media_id if str(media_id).startswith("tmdb:") else f"tmdb:{media_id}")
    url = f"https://fenixflix.fenixhub.online/stream/series/{query_id}:{season}:{episode}.json" if is_series else f"https://fenixflix.fenixhub.online/stream/movie/{query_id}.json"

    req = urllib.request.Request(url, headers={"User-Agent": USER_AGENT, "Accept": "application/json"})
    try:
        with urllib.request.urlopen(req, timeout=8) as res:
            if res.status != 200:
                return None
            data = json.loads(res.read().decode("utf-8"))
            raw_streams = data.get("streams", [])
            if not raw_streams:
                return None

            parsed = []
            for s in raw_streams:
                u = s.get("url")
                if not u or not isinstance(u, str):
                    continue
                text = f"{s.get('name', '')} {s.get('title', '')}".lower()
                quality = 1080
                if "4k" in text or "2160p" in text:
                    quality = 2160
                elif "720p" in text or "hd" in text:
                    quality = 720
                elif "480p" in text:
                    quality = 480

                is_dubbed = "dublado" in text or "nacional" in text
                is_subbed = "legendado" in text
                is_hls = ".m3u8" in u
                name = s.get("name") or f"FenixFlix {quality}p"
                tag = "Dublado" if is_dubbed else ("Legendado" if is_subbed else "Original")

                parsed.append({
                    "label": f"{name} [{tag}]",
                    "file": u,
                    "quality": quality,
                    "type": "hls" if is_hls else "mp4",
                    "isDubbed": is_dubbed,
                    "isSubbed": is_subbed
                })

            filtered = parsed
            if audio == "dubbed":
                dubbed = [s for s in parsed if s["isDubbed"]]
                if dubbed:
                    filtered = dubbed

            filtered.sort(key=lambda s: (s["quality"], 1 if s["type"] == "hls" else 0), reverse=True)
            return {"title": data.get("title", ""), "sources": filtered}
    except Exception:
        return None


# 2. CINECAT
def fetch_cinecat(tmdb_id, media_type, season=1, episode=1):
    is_series = media_type in ("series", "serie", "tv")
    url = f"https://cdn.hls.lol/content/series/{tmdb_id}/{season}/{episode}" if is_series else f"https://cdn.hls.lol/content/movie/{tmdb_id}"

    headers = {
        "User-Agent": USER_AGENT,
        "Origin": "https://cinecat.eu",
        "Referer": "https://cinecat.eu/"
    }
    req = urllib.request.Request(url, headers=headers)
    try:
        with urllib.request.urlopen(req, timeout=6) as res:
            if res.status != 200:
                return None
            data = json.loads(res.read().decode("utf-8"))
            if not data.get("found") or not data.get("url"):
                return None
            return {
                "title": data.get("title", ""),
                "sources": [{
                    "label": "Cinecat [1080p HLS]",
                    "file": data["url"],
                    "quality": 1080,
                    "type": "hls",
                    "referer": "https://cinecat.eu/"
                }]
            }
    except Exception:
        return None


# 3. RIVE
RIVE_SALT_TOKENS = [
    "r0V1d-s3cr3t-t0k3n-99", "k9X2m-v1d30-pr0v1d3r-42", "z7B4q-str34m-k3y-2024",
    "m3N8p-fl1x-s3cur1ty-77", "w5K1v-pl4y3r-h4sh-88", "p2L9x-b4ck3nd-t0k3n-33",
    "h4J7m-v1d-4uth-55", "t8R3w-str34m-s3cr3t-11", "q1V6b-pr0v1d3r-k3y-66",
    "x9M4p-pl4y-t0k3n-22", "c5N2v-v1d30-h4sh-99", "b8K7x-s3cur3-str34m-44",
    "j3L1m-b4ck3nd-k3y-88", "f6P9w-v1d-s3cr3t-77", "d2R4t-fl1x-4uth-33",
    "s7T5k-str34m-t0k3n-55", "v1N8x-pr0v1d3r-h4sh-11", "g4H2m-pl4y3r-s3cr3t-66",
    "l9K6p-v1d30-k3y-22", "y3B5w-s3cur3-t0k3n-99", "n8M1v-str34m-4uth-44",
    "w2P7t-b4ck3nd-h4sh-88", "k5R4x-fl1x-s3cr3t-77", "t9L2m-v1d-t0k3n-33",
    "p4N6w-pr0v1d3r-s3cur3-55", "h1K8v-pl4y3r-k3y-11", "m7J3t-str34m-h4sh-66",
    "q2V5x-v1d30-s3cr3t-22", "b6B9m-s3cur3-k3y-99", "x8T1w-b4ck3nd-4uth-44",
    "c4N7p-fl1x-t0k3n-88", "f1R5v-pr0v1d3r-t0k3n-77", "d9M2x-v1d-h4sh-33",
    "s5P8t-str34m-s3cur3-55", "j2K4w-pl4y3r-t0k3n-11", "l7L1m-b4ck3nd-s3cr3t-66",
    "y4N9x-v1d30-4uth-22", "v8B3v-s3cur3-h4sh-99", "w1T6p-fl1x-k3y-44",
    "k6R2t-str34m-k3y-88", "t3P7w-pr0v1d3r-4uth-77", "p9M5x-v1d-s3cr3t-33",
    "h2K1v-pl4y3r-h4sh-55", "m8J4t-b4ck3nd-t0k3n-11", "q5V9m-s3cur3-str34m-66",
    "b1B6w-v1d30-t0k3n-22", "x7T3p-fl1x-s3cur3-99", "c2N8v-str34m-t0k3n-44",
    "f9R1x-pr0v1d3r-h4sh-88", "d4M7t-v1d-k3y-77", "s1P3w-pl4y3r-4uth-33",
    "j8K5m-b4ck3nd-k3y-55", "l2L9v-s3cur3-s3cr3t-11", "y6N4p-str34m-h4sh-66",
    "v3B8t-v1d30-s3cur3-22", "w7T2x-fl1x-t0k3n-99", "k1R6w-pr0v1d3r-k3y-44",
    "t5P9m-v1d-4uth-88", "p8M3v-pl4y3r-s3cr3t-77", "h4K7t-b4ck3nd-h4sh-33",
    "m1J2p-str34m-4uth-55", "q6V8x-s3cur3-t0k3n-11", "b9B4w-v1d30-k3y-66",
    "x2T7v-fl1x-h4sh-22", "c7N1t-pr0v1d3r-s3cr3t-99", "f3R6m-v1d-t0k3n-44",
    "d8M9p-str34m-s3cur3-88", "s4P2x-pl4y3r-k3y-77", "j1K7w-b4ck3nd-4uth-33",
    "l5L3v-s3cur3-h4sh-55"
]

def generate_rive_secret_key(id_val, is_movie=True):
    r = "movieVideoProvider" if is_movie else "tvVideoProvider"
    id_str = str(id_val)
    if id_str.startswith("tt"):
        s = sum(ord(c) for c in id_str)
        t = RIVE_SALT_TOKENS[s % len(RIVE_SALT_TOKENS)]
        n = (s % len(r)) // 2
    else:
        num = int(id_val) if id_str.isdigit() else 0
        t = RIVE_SALT_TOKENS[num % len(RIVE_SALT_TOKENS)]
        n = (num % len(r)) // 2

    combined = r[:n] + t + r[n:]

    def hash_pass1(text):
        acc = 0
        for idx, char in enumerate(text):
            code = ord(char)
            acc = (code + (acc << 6) + (acc << 16) - acc) & 0xffffffff
            rot = ((acc << (idx % 5)) | (acc >> (32 - (idx % 5)))) & 0xffffffff
            x = (code << (idx % 7)) | (code >> (8 - (idx % 7)))
            acc ^= (rot ^ x) & 0xffffffff
            acc = (acc + ((acc >> 11) ^ (acc << 3))) & 0xffffffff
        acc ^= acc >> 15
        acc = (((acc & 65535) * 49842) + (((((acc >> 16) * 49842) & 65535) << 16))) & 0xffffffff
        acc ^= acc >> 13
        acc = (((acc & 65535) * 40503) + (((((acc >> 16) * 40503) & 65535) << 16))) & 0xffffffff
        acc ^= acc >> 16
        return f"{acc:08x}"

    def hash_pass2(text):
        acc = (3735928559 ^ len(text)) & 0xffffffff
        for idx, char in enumerate(text):
            code = ord(char)
            acc = ((acc ^ code) * 2654435761) & 0xffffffff
            acc = ((acc << 13) | (acc >> 19)) & 0xffffffff
        acc ^= acc >> 16
        acc = (acc * 2246822507) & 0xffffffff
        acc ^= acc >> 13
        acc = (acc * 3266489909) & 0xffffffff
        acc ^= acc >> 16
        return f"{acc:08x}"

    return hash_pass1(combined) + hash_pass2(combined)

def fetch_rive(tmdb_id, media_type, season=1, episode=1):
    is_movie = media_type == "movie"
    secret_key = generate_rive_secret_key(tmdb_id, is_movie)
    services = ["vanguard", "mirage", "apogee", "hydra", "citadel", "primevids"]

    headers = {
        "User-Agent": USER_AGENT,
        "Referer": "https://watch.rivestream.app/",
        "Origin": "https://watch.rivestream.app",
        "Accept": "application/json"
    }

    for s in services:
        params = {
            "requestID": "movieVideoProvider" if is_movie else "tvVideoProvider",
            "id": str(tmdb_id),
            "service": s,
            "secretKey": secret_key,
            "proxyMode": "noProxy"
        }
        if not is_movie:
            params["season"] = str(season)
            params["episode"] = str(episode)

        query = urllib.parse.urlencode(params)
        req = urllib.request.Request(f"https://backend.rivestream.app/api/backendfetch?{query}", headers=headers)
        try:
            with urllib.request.urlopen(req, timeout=5) as res:
                if res.status == 200:
                    data = json.loads(res.read().decode("utf-8"))
                    sources = data.get("data", {}).get("sources", [])
                    if sources:
                        mapped = [{
                            "label": f"Rive [{src.get('quality', '4K HDR')}p]",
                            "file": src["url"],
                            "quality": int(src["quality"]) if str(src.get("quality", "")).isdigit() else 2160,
                            "type": "hls",
                            "referer": "https://watch.rivestream.app/"
                        } for src in sources if src.get("url")]
                        return {"title": "", "sources": mapped}
        except Exception:
            continue
    return None

# 4. MOVY
def fetch_movy(tmdb_id, media_type, season=1, episode=1, imdb_id=""):
    import subprocess
    import os
    script_path = os.path.join(os.path.dirname(os.path.abspath(__file__)), "extractors", "movy", "extract.mjs")
    try:
        res = subprocess.run(
            ["node", script_path, str(tmdb_id), media_type, str(season), str(episode)],
            capture_output=True,
            text=True,
            timeout=8
        )
        if res.returncode != 0:
            return None
        lines = [l for l in res.stdout.splitlines() if not l.startswith("[movy-extract]")]
        data = json.loads("\n".join(lines))
        sources = data.get("sources", [])
        if not sources and not data.get("playlist"):
            return None
        mapped = []
        for s in sources:
            q = s.get("quality", "")
            is_4k = "2160" in q or "4k" in q.lower()
            is_1080 = "1080" in q
            is_720 = "720" in q
            quality_num = 2160 if is_4k else (1080 if is_1080 else (720 if is_720 else 480))
            mapped.append({
                "label": f"Movy [{q or (str(quality_num) + 'p')}]",
                "file": s.get("url") or s.get("file"),
                "quality": quality_num,
                "type": "hls",
                "referer": "https://www.movy.sx/"
            })
        if not mapped and data.get("playlist"):
            mapped.append({
                "label": "Movy [Auto FHD]",
                "file": data["playlist"],
                "quality": 1080,
                "type": "hls",
                "referer": "https://www.movy.sx/"
            })
        mapped.sort(key=lambda x: x["quality"], reverse=True)
        return {"title": "", "sources": mapped}
    except Exception:
        return None

