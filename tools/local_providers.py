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

