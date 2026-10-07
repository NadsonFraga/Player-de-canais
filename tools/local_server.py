#!/usr/bin/env python3
"""
Tvzinha Online - Local Development Resolver & Stream Proxy Server
Mirrors the exact behavior of Cloudflare Pages Functions (/api/resolve and /api/stream)
for zero-friction local testing on port 8787.
"""

import os
import sys
import re
import json
import base64
import time
import urllib.parse
import urllib.request
import urllib.error
from http.server import HTTPServer, BaseHTTPRequestHandler
from socketserver import ThreadingMixIn

PORT = 8787
USER_AGENT = "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36"
TMDB_API_KEY = "2dca580c2a14b55200e784d157207b4d"

# In-memory resolver cache (TTL 30 minutes)
RESOLVE_CACHE = {}

def fetch_imdb_id(tmdb_id: str):
    """Fetches canonical IMDb ID (tt...) from TMDB for unambiguous movie resolution in MGEB."""
    try:
        url = f"https://api.themoviedb.org/3/movie/{tmdb_id}?api_key={TMDB_API_KEY}"
        req = urllib.request.Request(url, headers={"User-Agent": USER_AGENT})
        with urllib.request.urlopen(req, timeout=6) as res:
            data = json.loads(res.read().decode("utf-8"))
        imdb_id = data.get("imdb_id")
        if imdb_id and str(imdb_id).startswith("tt"):
            return str(imdb_id)
    except Exception as e:
        print(f"[LocalServer] Error fetching IMDb ID for TMDB {tmdb_id}: {e}", file=sys.stderr)
    return None

def xor_decrypt(data_str: str, key: str = "otaku-embed-v1") -> str:
    raw_bytes = base64.b64decode(data_str)
    key_bytes = key.encode("utf-8")
    decrypted = bytearray()
    for i, b in enumerate(raw_bytes):
        decrypted.append(b ^ key_bytes[i % len(key_bytes)])
    return urllib.parse.unquote(decrypted.decode("latin1", errors="replace"))

def fetch_mgeb(media_type: str, media_id: str, season: int = 1, episode: int = 1):
    if media_type == "movie":
        url = f"https://mgeb.top/embed/{media_id}"
    else:
        url = f"https://mgeb.top/embed/serie/{media_id}/{season}/{episode}"

    headers = {
        "User-Agent": USER_AGENT,
        "Referer": "https://tvzinhaonline.pages.dev/",
        "Accept-Language": "pt-BR,pt;q=0.9,en-US;q=0.8",
    }
    
    for attempt in range(2):
        try:
            req = urllib.request.Request(url, headers=headers)
            with urllib.request.urlopen(req, timeout=12) as res:
                html = res.read().decode("utf-8", errors="ignore")
            m = re.search(r"var\s+sources\s*=\s*(\[.*?\]);", html, re.DOTALL)
            if not m:
                continue
            sources = json.loads(m.group(1))
            title_m = re.search(r'var\s+title\s*=\s*"(.*?)";', html)
            title = title_m.group(1).replace(r"\/", "/") if title_m else ""
            return {"title": title, "sources": sources}
        except Exception as e:
            if attempt == 1:
                print(f"[LocalServer] Error fetching MGEB ({url}): {e}", file=sys.stderr)
    return None


def fetch_zoko(mal_id: str, episode: int = 1):
    url = f"https://zokoanime.video/stream/mal/{mal_id}/{episode}/sub"
    req = urllib.request.Request(
        url,
        headers={
            "User-Agent": USER_AGENT,
            "Referer": "https://tvzinhaonline.pages.dev/",
        }
    )
    try:
        with urllib.request.urlopen(req, timeout=12) as res:
            html = res.read().decode("utf-8", errors="ignore")
        p_match = re.search(r'window\.__P\s*=\s*["\']([^"\']+)["\']', html)
        if not p_match:
            return None
        decrypted = xor_decrypt(p_match.group(1))
        return json.loads(decrypted)
    except Exception as e:
        print(f"[LocalServer] Error fetching ZokoAnime: {e}", file=sys.stderr)
        return None

MAL_PREFIX_CACHE = {}

def search_mal_prefix(keyword: str):
    clean_kw = keyword.strip()
    if clean_kw in MAL_PREFIX_CACHE:
        return MAL_PREFIX_CACHE[clean_kw]
    try:
        encoded = urllib.parse.quote(clean_kw)
        url = f"https://myanimelist.net/search/prefix.json?type=anime&keyword={encoded}"
        req = urllib.request.Request(url, headers={"User-Agent": USER_AGENT})
        with urllib.request.urlopen(req, timeout=5) as res:
            data = json.loads(res.read().decode("utf-8"))
        items = []
        for cat in data.get("categories", []):
            if cat.get("type") == "anime":
                items.extend(cat.get("items", []))
        MAL_PREFIX_CACHE[clean_kw] = items
        return items
    except Exception as e:
        print(f"[LocalServer] MAL prefix search error for '{keyword}': {e}", file=sys.stderr)
        return []

def fetch_mal_id_from_title(title: str, season: int = 1, season_name: str = ""):
    clean_title = re.sub(r'\(.*?\)|\[.*?\]', '', title).strip()
    
    clean_sname = ""
    if season_name:
        sname_cand = re.sub(r'^(Temporada|Season)\s*\d+[:\-]?\s*', '', season_name, flags=re.I).strip()
        if sname_cand.lower() not in ["especiais", "specials", "temporada", "season", ""] and len(sname_cand) > 2:
            clean_sname = sname_cand

    # Build prioritized query list
    queries = []
    if clean_sname:
        queries.append((f"{clean_title} {clean_sname}", 50))
        queries.append((clean_sname, 40))
    
    if season > 1:
        queries.append((f"{clean_title} Season {season}", 35))
        queries.append((f"{clean_title} Part {season}", 35))
        suffix = "nd" if season == 2 else "rd" if season == 3 else "th"
        queries.append((f"{clean_title} {season}{suffix} Season", 30))

    queries.append((clean_title, 10))

    candidates = []
    seen = set()

    for q_text, q_priority in queries:
        items = search_mal_prefix(q_text)
        for idx, it in enumerate(items[:6]):
            iid = it.get("id")
            if iid and iid not in seen:
                seen.add(iid)
                rank_bonus = max(0, 15 - idx * 3)
                candidates.append((it, q_priority + rank_bonus))
        if len(candidates) >= 12:
            break

    if not candidates:
        # Fallback to Jikan API search
        try:
            encoded = urllib.parse.quote(f"{clean_title} {clean_sname}".strip())
            url = f"https://api.jikan.moe/v4/anime?q={encoded}&limit=1"
            req = urllib.request.Request(url, headers={"User-Agent": USER_AGENT})
            with urllib.request.urlopen(req, timeout=5) as res:
                data = json.loads(res.read().decode("utf-8"))
            if data.get("data") and len(data["data"]) > 0:
                return data["data"][0].get("mal_id")
        except Exception as e:
            print(f"[LocalServer] Jikan fallback error: {e}", file=sys.stderr)
        return None

    if season == 1 and not clean_sname:
        return candidates[0][0].get("id")

    def score_item(cand_tuple):
        cand, base_score = cand_tuple
        c_name = cand.get("name", "").lower()
        payload = cand.get("payload") or {}
        mtype = str(payload.get("media_type", "")).upper()
        pts = base_score

        if mtype in ["TV", "ONA"]:
            pts += 40
        elif mtype in ["SPECIAL", "TV SPECIAL", "OVA", "MOVIE"]:
            pts -= 35

        # Heavy penalty for recaps, summaries, PVs, pilots
        if any(bad in c_name for bad in ["pilot", "kanketsu-hen", "recap", "summary", "preview", "remix", "music", "special"]):
            pts -= 60

        if clean_sname:
            s_words = [w.lower() for w in re.findall(r'\b[a-zA-Z]{3,}\b', clean_sname)]
            matches = sum(1 for w in s_words if w in c_name)
            if matches:
                pts += (matches * 25)

        season_patterns = [
            rf'\bpart\s*{season}\b',
            rf'\bseason\s*{season}\b',
            rf'\b{season}(?:st|nd|rd|th)\s*season\b',
            rf'\b{season}\b',
        ]
        for pat in season_patterns:
            if re.search(pat, c_name):
                pts += 25
                break

        return pts

    candidates.sort(key=score_item, reverse=True)
    best_id = candidates[0][0].get("id")
    best_name = candidates[0][0].get("name")
    print(f"[LocalServer] Resolved Anime MAL ID: {best_id} ('{best_name}') for '{title}' (T{season} '{season_name}')", file=sys.stderr)
    return best_id

class ThreadedHTTPServer(ThreadingMixIn, HTTPServer):
    daemon_threads = True

import http.server

PROJECT_ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))

class DevAPIHandler(http.server.SimpleHTTPRequestHandler):
    extensions_map = {
        **http.server.SimpleHTTPRequestHandler.extensions_map,
        '.js': 'application/javascript; charset=utf-8',
        '.mjs': 'application/javascript; charset=utf-8',
        '.json': 'application/json; charset=utf-8',
        '.css': 'text/css; charset=utf-8',
        '.svg': 'image/svg+xml',
        '.webp': 'image/webp',
    }

    def __init__(self, *args, **kwargs):
        super().__init__(*args, directory=PROJECT_ROOT, **kwargs)

    def send_cors_headers(self, status=200, content_type="application/json"):
        self.send_response(status)
        self.send_header("Access-Control-Allow-Origin", "*")
        self.send_header("Access-Control-Allow-Methods", "GET, HEAD, OPTIONS")
        self.send_header("Access-Control-Allow-Headers", "Range, Content-Type, Accept, User-Agent, Referer, Origin")
        self.send_header("Access-Control-Expose-Headers", "Content-Length, Content-Range, Accept-Ranges")
        if content_type:
            self.send_header("Content-Type", content_type)

    def end_headers(self):
        self.send_header("Cache-Control", "no-cache, no-store, must-revalidate")
        self.send_header("Pragma", "no-cache")
        self.send_header("Expires", "0")
        super().end_headers()

    def do_OPTIONS(self):
        self.send_cors_headers(204, content_type=None)
        self.send_header("Access-Control-Max-Age", "86400")
        self.end_headers()

    def do_HEAD(self):
        try:
            parsed = urllib.parse.urlparse(self.path)
            path = parsed.path
            params = urllib.parse.parse_qs(parsed.query)

            if path == "/api/stream":
                self.handle_stream(params, is_head=True)
            elif path == "/api/resolve":
                self.send_cors_headers(200, "application/json; charset=utf-8")
                self.end_headers()
            elif path == "/health":
                self.send_cors_headers(200, "application/json")
                self.end_headers()
            else:
                super().do_HEAD()
        except Exception as e:
            try:
                self.send_cors_headers(500, "application/json")
                self.end_headers()
            except Exception:
                pass

    def do_GET(self):
        try:
            parsed = urllib.parse.urlparse(self.path)
            path = parsed.path
            params = urllib.parse.parse_qs(parsed.query)

            if path == "/api/resolve":
                self.handle_resolve(params)
            elif path == "/api/stream":
                self.handle_stream(params, is_head=False)
            elif path == "/health":
                self.send_cors_headers(200, "application/json")
                self.end_headers()
                self.wfile.write(b'{"status":"healthy","service":"tvzinha-local-resolver"}')
            else:
                super().do_GET()
        except Exception as e:
            print(f"[LocalServer] Error in do_GET: {e}", file=sys.stderr)
            try:
                self.send_cors_headers(500, "application/json")
                self.end_headers()
                self.wfile.write(json.dumps({"error": str(e)}).encode("utf-8"))
            except Exception:
                pass

    def handle_resolve(self, params):
        media_id = params.get("id", [""])[0]
        media_type = params.get("type", ["movie"])[0]
        season = int(params.get("season", ["1"])[0])
        episode = int(params.get("episode", ["1"])[0])
        lang = params.get("lang", ["sub" if media_type == "anime" else "dub"])[0]
        title_param = params.get("title", [""])[0]
        season_name_param = params.get("season_name", [""])[0]
        mal_id = params.get("mal_id", [""])[0]
        imdb_id = params.get("imdb_id", [""])[0]

        host_header = self.headers.get("Host", f"127.0.0.1:{PORT}")
        proxy_base = f"http://{host_header}/api/stream"

        cache_key = f"{host_header}_{media_type}_{media_id}_{imdb_id}_{season}_{episode}_{lang}_{mal_id}_{title_param}_{season_name_param}"
        now = time.time()
        if cache_key in RESOLVE_CACHE:
            cached_time, cached_res = RESOLVE_CACHE[cache_key]
            if now - cached_time < 1800:
                self.send_cors_headers(200, "application/json; charset=utf-8")
                self.end_headers()
                self.wfile.write(json.dumps(cached_res, ensure_ascii=False).encode("utf-8"))
                return

        result = None

        # Route 1: Anime Subtitled via ZokoAnime
        if media_type == "anime" and lang == "sub":
            if not mal_id and title_param:
                mal_id = fetch_mal_id_from_title(title_param, season, season_name_param)
            elif not mal_id and media_id:
                mal_id = media_id

            if mal_id:
                zoko_data = fetch_zoko(str(mal_id), episode)
                if zoko_data and zoko_data.get("src"):
                    master_url = zoko_data["src"]
                    stream_url = f"{proxy_base}?url={urllib.parse.quote(master_url, safe='')}&referer={urllib.parse.quote('https://zokoanime.video/', safe='')}"
                    
                    subtitles = []
                    for s in zoko_data.get("subtitles", []):
                        sub_src = s.get("src", "")
                        subtitles.append({
                            "lang": s.get("lang", "pt-BR"),
                            "label": s.get("label", "Legenda"),
                            "default": bool(s.get("default")),
                            "url": f"{proxy_base}?url={urllib.parse.quote(sub_src, safe='')}&referer={urllib.parse.quote('https://zokoanime.video/', safe='')}",
                        })

                    result = {
                        "success": True,
                        "title": title_param or f"Anime Ep {episode}",
                        "category": "anime",
                        "audio": "subtitled",
                        "primary_source": {
                            "label": "ZokoAnime [1080p FHD HLS]",
                            "type": "hls",
                            "stream_url": stream_url,
                            "raw_url": master_url,
                            "headers": {
                                "Referer": "https://zokoanime.video/",
                                "Origin": "https://zokoanime.video",
                            },
                        },
                        "fallback_sources": [],
                        "subtitles": subtitles,
                        "aniskip": {
                            "mal_id": int(mal_id) if str(mal_id).isdigit() else None,
                            "episode": episode,
                            "ready": True,
                        },
                    }

        # Route 2: Movies, Series or Anime Dubbed via MGEB
        if not result and (media_id or imdb_id):
            mgeb_type = "serie" if media_type == "anime" else media_type
            target_id = imdb_id if (imdb_id and imdb_id.startswith("tt")) else media_id

            # For movies: check canonical IMDb ID to eliminate TV series collisions (e.g. 1422 -> The Middle vs The Departed)
            if media_type == "movie" and target_id and str(target_id).isdigit():
                resolved_imdb = fetch_imdb_id(str(target_id))
                if resolved_imdb:
                    target_id = resolved_imdb

            mgeb_data = fetch_mgeb(mgeb_type, target_id, season, episode)

            # Sanity check: If movie resolution returned a TV episode title, fallback to IMDb resolution
            if mgeb_data and media_type == "movie":
                ret_title = mgeb_data.get("title", "")
                is_tv_collision = bool(re.search(r'[-–]\s*T\d+E\d+|S\d+E\d+|Epis[oó]dio|\bPiloto\b', ret_title, re.I))
                if is_tv_collision and not str(target_id).startswith("tt"):
                    resolved_imdb = fetch_imdb_id(str(media_id))
                    if resolved_imdb and resolved_imdb != target_id:
                        retry_data = fetch_mgeb("movie", resolved_imdb)
                        if retry_data and retry_data.get("sources"):
                            mgeb_data = retry_data
                            target_id = resolved_imdb
                            is_tv_collision = False

                if is_tv_collision:
                    print(f"[LocalServer] Rejected TV series collision for movie: {ret_title}", file=sys.stderr)
                    mgeb_data = None

            if mgeb_data and mgeb_data.get("sources"):
                raw_sources = mgeb_data["sources"]
                parsed_sources = []
                for idx, s in enumerate(raw_sources):
                    raw_file = s.get("file", "").strip().replace("mgeb.top/../", "mgeb.top/").replace("mgeb.top/..", "mgeb.top")
                    is_direct_mp4 = ".mp4" in raw_file and ("fontedecanais" in raw_file or "57lgoe65efxo71.com" in raw_file)
                    direct_clean_url = raw_file
                    if is_direct_mp4:
                        # Convert to secure HTTPS and strip port :80 to prevent SSL handshake errors
                        direct_clean_url = re.sub(r'^http://', 'https://', raw_file, flags=re.I).replace(':80/', '/')

                    referer = "https://embedplayer2.xyz/"
                    if "peliculaplay.com" in raw_file or "cache/hls" in raw_file or "mgeb.top" in raw_file:
                        referer = "https://mgeb.top/"

                    final_stream_url = direct_clean_url if is_direct_mp4 else f"{proxy_base}?url={urllib.parse.quote(raw_file, safe='')}&referer={urllib.parse.quote(referer, safe='')}"

                    parsed_sources.append({
                        "label": s.get("label", f"Servidor {idx + 1}"),
                        "type": s.get("type", "hls" if ".m3u8" in raw_file else "mp4"),
                        "stream_url": final_stream_url,
                        "raw_url": direct_clean_url,
                        "headers": {"Referer": referer},
                    })

                def score_source(src):
                    url = src.get("raw_url", "").lower()
                    # Tier 1: Proven robust datacenter-safe HLS CDNs (Score 95)
                    if "cache/hls" in url or "peliculaplay.com" in url or "playspelis.com" in url or "flixlat.com" in url or "97bf1.com" in url:
                        return 95
                    # Tier 2: Direct sanitized HTTPS MP4 (Score 90 - Fast, zero-WAF, native seeking)
                    if "fontedecanais" in url or "57lgoe65efxo71.com" in url:
                        return 90
                    # Tier 3: Standard generic HLS streams (Score 80)
                    if ".m3u8" in url:
                        return 80
                    # Tier 4: Fallback PlayerCDN / Worker mirrors (Score 60 - Preserved as safety net)
                    if "playercdn" in url or "workers.dev" in url or "powestream" in url:
                        return 60
                    # Tier 5: Other MP4 streams (Score 50)
                    if ".mp4" in url:
                        return 50
                    return 10

                valid_sources = [s for s in parsed_sources if score_source(s) > 0]
                if valid_sources:
                    valid_sources.sort(key=score_source, reverse=True)
                    primary = valid_sources[0]
                    fallbacks = valid_sources[1:]
                else:
                    primary = parsed_sources[0]
                    fallbacks = parsed_sources[1:]

                result = {
                    "success": True,
                    "title": mgeb_data.get("title") or title_param or ("Filme" if media_type == "movie" else f"Série T{season}E{episode}"),
                    "category": media_type,
                    "audio": "subtitled" if lang == "sub" else "dubbed",
                    "primary_source": primary,
                    "fallback_sources": fallbacks,
                    "subtitles": [],
                    "aniskip": {
                        "mal_id": int(mal_id) if mal_id and str(mal_id).isdigit() else None,
                        "episode": episode,
                        "ready": bool(mal_id),
                    },
                }

        if result:
            RESOLVE_CACHE[cache_key] = (now, result)
            self.send_cors_headers(200, "application/json; charset=utf-8")
            self.end_headers()
            self.wfile.write(json.dumps(result, ensure_ascii=False).encode("utf-8"))
        else:
            self.send_cors_headers(404, "application/json; charset=utf-8")
            self.end_headers()
            self.wfile.write(b'{"success":false,"error":"No direct streams resolved","fallback_recommended":true}')

    def handle_stream(self, params, is_head=False):
        target_url = params.get("url", [""])[0]
        if not target_url:
            self.send_cors_headers(400, "text/plain")
            self.end_headers()
            self.wfile.write(b"Missing 'url' query parameter")
            return

        referer = params.get("referer", [""])[0]
        if not referer:
            if "dramahot.top" in target_url or "zokoanime.video" in target_url:
                referer = "https://zokoanime.video/"
            elif "playercdn.workers.dev" in target_url or "embedplayer2.xyz" in target_url:
                referer = "https://embedplayer2.xyz/"
            elif "peliculaplay.com" in target_url:
                referer = "https://mgeb.top/"
            else:
                referer = "https://tvzinhaonline.pages.dev/"

        req = urllib.request.Request(target_url)
        req.add_header("User-Agent", USER_AGENT)
        req.add_header("Referer", referer)
        if "zokoanime" in referer:
            req.add_header("Origin", "https://zokoanime.video")

        if "Range" in self.headers:
            req.add_header("Range", self.headers["Range"])
        elif is_head:
            req.add_header("Range", "bytes=0-0")

        try:
            with urllib.request.urlopen(req, timeout=15) as resp:
                content_type = resp.headers.get("Content-Type", "")
                is_m3u8 = ".m3u8" in target_url or "mpegurl" in content_type.lower()

                if is_m3u8 and resp.status == 200:
                    raw_playlist = resp.read().decode("utf-8", errors="ignore")
                    base_url = target_url
                    host_header = self.headers.get("Host", f"127.0.0.1:{PORT}")
                    proxy_base = f"http://{host_header}/api/stream"

                    rewritten_lines = []
                    for line in raw_playlist.splitlines():
                        trimmed = line.strip()
                        if not trimmed:
                            rewritten_lines.append(line)
                            continue

                        if trimmed.startswith("#"):
                            def replace_uri(m):
                                sub_uri = m.group(1)
                                abs_sub = urllib.parse.urljoin(base_url, sub_uri)
                                proxied = f"{proxy_base}?url={urllib.parse.quote(abs_sub, safe='')}&referer={urllib.parse.quote(referer, safe='')}"
                                return f'URI="{proxied}"'
                            rewritten = re.sub(r'URI=["\']([^"\']+)["\']', replace_uri, line)
                            rewritten_lines.append(rewritten)
                        else:
                            abs_url = urllib.parse.urljoin(base_url, trimmed)
                            proxied = f"{proxy_base}?url={urllib.parse.quote(abs_url, safe='')}&referer={urllib.parse.quote(referer, safe='')}"
                            rewritten_lines.append(proxied)

                    body = "\n".join(rewritten_lines).encode("utf-8")
                    self.send_cors_headers(resp.status, "application/vnd.apple.mpegurl; charset=utf-8")
                    self.send_header("Content-Length", str(len(body)))
                    self.end_headers()
                    if not is_head:
                        self.wfile.write(body)
                    return

                is_vtt = ".vtt" in target_url or "text/vtt" in content_type.lower()
                if is_vtt and resp.status == 200:
                    raw_vtt = resp.read().decode("utf-8", errors="ignore")
                    # Clean raw formatting tags like <i>, </i>, <b>, </b> from VTT cues
                    cleaned_vtt = re.sub(r'</?[a-zA-Z][^>]*>', '', raw_vtt)
                    body = cleaned_vtt.encode("utf-8")
                    self.send_cors_headers(resp.status, "text/vtt; charset=utf-8")
                    self.send_header("Content-Length", str(len(body)))
                    self.end_headers()
                    if not is_head:
                        self.wfile.write(body)
                    return

                # Binary / Segment passthrough
                self.send_cors_headers(resp.status, content_type)
                for h in ["Content-Length", "Content-Range", "Accept-Ranges"]:
                    if h in resp.headers:
                        self.send_header(h, resp.headers[h])
                self.end_headers()

                if is_head:
                    return

                # Stream in 64KB chunks with disconnect tolerance
                try:
                    while True:
                        chunk = resp.read(65536)
                        if not chunk:
                            break
                        self.wfile.write(chunk)
                except (ConnectionResetError, ConnectionAbortedError, BrokenPipeError):
                    pass
        except urllib.error.HTTPError as e:
            self.send_cors_headers(e.code, "text/plain")
            self.end_headers()
            if not is_head:
                self.wfile.write(f"Upstream HTTP Error {e.code}".encode("utf-8"))
        except Exception as e:
            self.send_cors_headers(502, "application/json")
            self.end_headers()
            if not is_head:
                self.wfile.write(json.dumps({"error": str(e)}).encode("utf-8"))

def get_local_ip():
    try:
        import socket
        s = socket.socket(socket.AF_INET, socket.SOCK_DGRAM)
        s.connect(("8.8.8.8", 80))
        ip = s.getsockname()[0]
        s.close()
        return ip
    except Exception:
        return "127.0.0.1"

def run():
    server = ThreadedHTTPServer(("0.0.0.0", PORT), DevAPIHandler)
    local_ip = get_local_ip()
    print(f"[Tvzinha Local Server] Running on all interfaces (port {PORT}):")
    print(f" -> Localhost: http://localhost:{PORT}")
    print(f" -> Network (Wi-Fi/Mobile): http://{local_ip}:{PORT}")
    try:
        server.serve_forever()
    except KeyboardInterrupt:
        print("\nShutting down server.")
        server.server_close()

if __name__ == "__main__":
    run()
