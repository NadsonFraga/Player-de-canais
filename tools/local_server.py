#!/usr/bin/env python3
"""
Tvzinha Online - Local Development Resolver & Stream Proxy Server
Mirrors the exact behavior of Cloudflare Pages Functions (/api/resolve and /api/stream)
for zero-friction local testing on port 8787.
"""

from pathlib import Path
import os
import sys
import re
import json
import math
import base64
import hashlib
import hmac
import ipaddress
import socket
import time
import urllib.parse
import urllib.request
import urllib.error
import argparse
from http.server import HTTPServer, BaseHTTPRequestHandler
from socketserver import ThreadingMixIn

sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
import local_accounts  # noqa: E402  (mirror of functions/api/account/[[path]].js)
import local_sync  # noqa: E402  (mirror of functions/api/sync.js)
import local_providers  # noqa: E402  (mirror of functions/api/providers.js)

PORT = 8787
USER_AGENT = "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36"


def load_env_value(wanted):
    """A secret: the environment variable `wanted`, else the git-ignored .env file at the project root."""
    key = os.environ.get(wanted, "").strip()
    if key:
        return key
    env_path = os.path.join(os.path.dirname(os.path.dirname(os.path.abspath(__file__))), ".env")
    try:
        with open(env_path, encoding="utf-8") as env_file:
            for line in env_file:
                name, sep, value = line.strip().partition("=")
                if sep and name.strip() == wanted:
                    return value.strip().strip('"').strip("'")
    except OSError:
        pass
    return ""


def load_tmdb_api_key():
    """TMDB key (D3): the TMDB_API_KEY environment variable, else the git-ignored .env file at the project root."""
    return load_env_value("TMDB_API_KEY")


TMDB_API_KEY = load_tmdb_api_key()
# Optional server secret for the account hashes (functions/api/account/[[path]].js reads env.ACCOUNTS_PEPPER)
ACCOUNTS_PEPPER = load_env_value("ACCOUNTS_PEPPER")


def load_site_csp():
    """The Content-Security-Policy of the "/*" block in _headers (what Cloudflare sends), or "" when absent."""
    try:
        lines = (Path(__file__).resolve().parent.parent / "_headers").read_text(encoding="utf-8").splitlines()
    except OSError:
        return ""
    in_all = False
    for line in lines:
        if line and not line[0].isspace():
            in_all = line.strip() == "/*"
            continue
        if in_all and line.strip().lower().startswith("content-security-policy:"):
            return line.split(":", 1)[1].strip()
    return ""


SITE_CSP = load_site_csp()
if not TMDB_API_KEY:
    print("[LocalServer] TMDB_API_KEY not set (environment or .env): catalogs and /api/tmdb will fail", file=sys.stderr)

# In-memory resolver cache (TTL 30 minutes)
RESOLVE_CACHE = {}

# MGEB pages can take ~15 s on some titles: one long attempt instead of two short ones
MGEB_TIMEOUT_S = 25
# After the first MGEB lookup with sources, wait this long to merge the other one
MGEB_MERGE_WINDOW_S = 1.5


def fetch_imdb_id(tmdb_id: str, media_type: str = "movie"):
    """Fetches the canonical IMDb ID (tt...) from TMDB ("movie" or "serie")."""
    try:
        if media_type == "movie":
            url = f"https://api.themoviedb.org/3/movie/{tmdb_id}?api_key={TMDB_API_KEY}"
        else:
            url = f"https://api.themoviedb.org/3/tv/{tmdb_id}/external_ids?api_key={TMDB_API_KEY}"
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
    
    try:
        req = urllib.request.Request(url, headers=headers)
        with urllib.request.urlopen(req, timeout=MGEB_TIMEOUT_S) as res:
            html = res.read().decode("utf-8", errors="ignore")
        m = re.search(r"var\s+sources\s*=\s*(\[.*?\]);", html, re.DOTALL)
        if not m:
            return None
        sources = json.loads(m.group(1))
        title_m = re.search(r'var\s+title\s*=\s*"(.*?)";', html)
        title = title_m.group(1).replace(r"\/", "/") if title_m else ""
        return {"title": title, "sources": sources}
    except Exception as e:
        print(f"[LocalServer] Error fetching MGEB ({url}): {e}", file=sys.stderr)
    return None


# TMDB lists some shows as one long season (Jujutsu Kaisen: 59 episodes) while MGEB numbers
# them by the real seasons (24 / 23 / 12). TMDB keeps the real split in an episode group of
# type 6 ("Seasons").
SEASON_GROUPS_TTL_S = 24 * 60 * 60
SEASON_GROUPS_CACHE = {}


def regular_season_groups(detail):
    """Regular seasons of a TMDB episode group (specials, OVAs and empty groups skipped), as lists
    of (season, episode) in airing order; None when fewer than two."""
    groups = [
        g for g in ((detail or {}).get("groups") or [])
        if g.get("episodes")
        and not re.search(r"special|especia|ova|oad|extra", g.get("name") or "", re.I)
        and all((ep.get("season_number") or 0) >= 1 for ep in g["episodes"])
    ]
    groups.sort(key=lambda g: g.get("order") or 0)
    result = [
        [(ep["season_number"], ep["episode_number"]) for ep in sorted(g["episodes"], key=lambda ep: ep.get("order") or 0)]
        for g in groups
    ]
    return result if len(result) >= 2 else None


def map_merged_episode(groups, season, episode):
    """Maps a TMDB season/episode to its position in the real seasons: (season, episode) or None."""
    if not groups:
        return None
    for g, episodes in enumerate(groups):
        if (int(season), int(episode)) in episodes:
            return (g + 1, episodes.index((int(season), int(episode))) + 1)
    return None


def fetch_season_groups(tmdb_id):
    """The real season split of a show listed as one season on TMDB, or None (cached 24 h)."""
    cached = SEASON_GROUPS_CACHE.get(tmdb_id)
    if cached and time.time() - cached[0] < SEASON_GROUPS_TTL_S:
        return cached[1]

    def get(path):
        req = urllib.request.Request(f"https://api.themoviedb.org/3{path}?api_key={TMDB_API_KEY}",
                                     headers={"User-Agent": USER_AGENT})
        with urllib.request.urlopen(req, timeout=6) as res:
            return json.loads(res.read().decode("utf-8"))

    groups = None
    try:
        show = get(f"/tv/{tmdb_id}")
        regular = [s for s in show.get("seasons", []) if s.get("season_number", 0) >= 1 and s.get("episode_count", 0) > 0]
        if len(regular) == 1:
            candidates = [g for g in get(f"/tv/{tmdb_id}/episode_groups").get("results", []) if g.get("type") == 6]
            candidates.sort(key=lambda g: g.get("name") != "Seasons")
            for candidate in candidates[:3]:
                groups = regular_season_groups(get(f"/tv/episode_group/{candidate['id']}"))
                if groups:
                    break
    except Exception as e:
        print(f"[LocalServer] Season groups failed for TMDB {tmdb_id}: {e}", file=sys.stderr)
        groups = None
    SEASON_GROUPS_CACHE[tmdb_id] = (time.time(), groups)
    return groups


def mgeb_source_key(source):
    """Same file served over http/https or :80 counts once."""
    url = str(source.get("file", "")).strip()
    url = re.sub(r"^https?://", "", url, flags=re.I).replace(":80/", "/")
    return url.split("?")[0]


def mgeb_episode_matches(title, season, episode):
    """MGEB titles name the episode they serve ("Show - T1E1 - Name"). For an episode it does not
    have, MGEB answers with the T1E1 page, so a title naming another episode is refused.
    Titles without the pattern are kept."""
    m = re.search(r"\bT(\d+)E(\d+)\b", title or "", re.I)
    if not m:
        return True
    return int(m.group(1)) == int(season) and int(m.group(2)) == int(episode)


def first_then_merge(lookups, window_s):
    """Runs lookups (callables) in parallel; returns the first result with sources, merged
    with any other that arrives within window_s (first result's order first, no duplicates)."""
    from concurrent.futures import ThreadPoolExecutor, wait, FIRST_COMPLETED
    if not lookups:
        return None
    pool = ThreadPoolExecutor(max_workers=len(lookups))
    pending = {pool.submit(fn) for fn in lookups}
    results = []
    deadline = None
    while pending:
        timeout = None if deadline is None else max(0, deadline - time.time())
        done, pending = wait(pending, timeout=timeout, return_when=FIRST_COMPLETED)
        if not done:
            break
        for fut in done:
            try:
                r = fut.result()
            except Exception:
                r = None
            if r and r.get("sources"):
                results.append(r)
                if deadline is None:
                    deadline = time.time() + window_s
    pool.shutdown(wait=False, cancel_futures=True)
    if not results:
        return None
    seen, sources = set(), []
    for r in results:
        for s in r["sources"]:
            key = mgeb_source_key(s)
            if key not in seen:
                seen.add(key)
                sources.append(s)
    return {"title": results[0].get("title", ""), "sources": sources}


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

# ============================================================
# QUALITY PROBING (mirror of functions/api/resolve.js)
# Discovers the real resolution of each source so the player can rank
# them by quality and offer a unified "Qualidade" menu.
# ============================================================

PROBE_TIMEOUT_S = 3.5
PROBE_MAX_SOURCES = 6
# Probing stops after this budget; sources not measured in time keep host order
PROBE_BUDGET_S = 3.5
KIND_RANK = {"hls-multi": 0, "mp4-range": 1, "hls-single": 2, "mp4": 3, "unknown": 4}
H264_HIGH_PROFILES = {100, 110, 122, 244, 44, 83, 86, 118, 128, 138, 139, 134, 135}


def quality_class(width, height):
    """Maps a frame size to a standard quality class; width counts so 1920x800 is still 1080p."""
    w = int(width or 0)
    h = int(height or 0)
    by_w = 2160 if w >= 3800 else 1440 if w >= 2500 else 1080 if w >= 1900 else 720 if w >= 1260 else 480 if w >= 840 else 360 if w >= 620 else 240 if w > 0 else 0
    by_h = 2160 if h >= 2000 else 1440 if h >= 1400 else 1080 if h >= 1000 else 720 if h >= 700 else 480 if h >= 460 else 360 if h >= 340 else 240 if h > 0 else 0
    return max(by_w, by_h) or None


class ProbeHttpError(Exception):
    pass


def probe_fetch(url, referer, rng=None, max_bytes=2 * 1024 * 1024):
    """Returns (status, body, content_range); reads at most max_bytes since some hosts ignore Range."""
    headers = {"User-Agent": USER_AGENT}
    if referer:
        headers["Referer"] = referer
        if "zokoanime" in referer:
            headers["Origin"] = "https://zokoanime.video"
    if rng:
        headers["Range"] = rng
    try:
        with urllib.request.urlopen(urllib.request.Request(url, headers=headers), timeout=PROBE_TIMEOUT_S) as res:
            body = res.read(max_bytes) if max_bytes > 0 else b""
            return res.status, body, res.headers.get("Content-Range", "")
    except urllib.error.HTTPError as e:
        return e.code, b"", ""


def parse_h264_sps(nal):
    """Reads an H.264 SPS NAL unit (header byte excluded) and returns (width, height)."""
    data = bytearray()
    for i, b in enumerate(nal):
        # Strip emulation prevention bytes (00 00 03)
        if i >= 2 and b == 3 and nal[i - 1] == 0 and nal[i - 2] == 0:
            continue
        data.append(b)
    state = {"pos": 0}

    def u(n):
        v = 0
        for _ in range(n):
            pos = state["pos"]
            if (pos >> 3) >= len(data):
                raise ValueError("SPS overflow")
            v = (v << 1) | ((data[pos >> 3] >> (7 - (pos & 7))) & 1)
            state["pos"] = pos + 1
        return v

    def ue():
        zeros = 0
        while u(1) == 0:
            zeros += 1
            if zeros > 31:
                raise ValueError("SPS ue overflow")
        return ((1 << zeros) - 1) + u(zeros) if zeros else 0

    def se():
        k = ue()
        return (k + 1) // 2 if k & 1 else -(k // 2)

    profile = u(8)
    u(16)
    ue()
    if profile in H264_HIGH_PROFILES:
        chroma = ue()
        if chroma == 3:
            u(1)
        ue()
        ue()
        u(1)
        if u(1):
            for i in range(8 if chroma != 3 else 12):
                if not u(1):
                    continue
                size = 16 if i < 6 else 64
                last = nxt = 8
                for _ in range(size):
                    if nxt != 0:
                        nxt = (last + se() + 256) % 256
                    last = last if nxt == 0 else nxt
    ue()
    poc_type = ue()
    if poc_type == 0:
        ue()
    elif poc_type == 1:
        u(1)
        se()
        se()
        for _ in range(ue()):
            se()
    ue()
    u(1)
    width_mbs = ue() + 1
    height_map_units = ue() + 1
    frame_mbs_only = u(1)
    if not frame_mbs_only:
        u(1)
    u(1)
    crop_l = crop_r = crop_t = crop_b = 0
    if u(1):
        crop_l, crop_r, crop_t, crop_b = ue(), ue(), ue(), ue()
    width = width_mbs * 16 - (crop_l + crop_r) * 2
    height = (2 - frame_mbs_only) * height_map_units * 16 - (crop_t + crop_b) * 2 * (2 - frame_mbs_only)
    return width, height


def parse_ts_resolution(buf):
    """Extracts the video frame size from the first bytes of an MPEG-TS segment."""
    start = -1
    for i in range(min(len(buf) - 376, 8192)):
        if buf[i] == 0x47 and buf[i + 188] == 0x47 and buf[i + 376] == 0x47:
            start = i
            break
    if start < 0:
        return None

    pmt_pid = video_pid = -1
    video_type = 0
    es = bytearray()
    p = start
    while p + 188 <= len(buf):
        if buf[p] != 0x47:
            break
        pusi = (buf[p + 1] & 0x40) != 0
        pid = ((buf[p + 1] & 0x1F) << 8) | buf[p + 2]
        afc = (buf[p + 3] >> 4) & 3
        off = p + 4
        if afc in (0, 2):
            p += 188
            continue
        if afc == 3:
            off += 1 + buf[off]
        if off >= p + 188:
            p += 188
            continue

        if pid == 0 and pmt_pid < 0:
            if pusi:
                off += 1 + buf[off]
            sec_len = ((buf[off + 1] & 0x0F) << 8) | buf[off + 2]
            end = min(off + 3 + sec_len - 4, p + 188)
            e = off + 8
            while e + 4 <= end:
                program = (buf[e] << 8) | buf[e + 1]
                if program != 0:
                    pmt_pid = ((buf[e + 2] & 0x1F) << 8) | buf[e + 3]
                    break
                e += 4
        elif pid == pmt_pid and video_pid < 0:
            if pusi:
                off += 1 + buf[off]
            sec_len = ((buf[off + 1] & 0x0F) << 8) | buf[off + 2]
            end = min(off + 3 + sec_len - 4, p + 188)
            prog_info_len = ((buf[off + 10] & 0x0F) << 8) | buf[off + 11]
            e = off + 12 + prog_info_len
            while e + 5 <= end:
                stream_type = buf[e]
                es_pid = ((buf[e + 1] & 0x1F) << 8) | buf[e + 2]
                es_info_len = ((buf[e + 3] & 0x0F) << 8) | buf[e + 4]
                if stream_type in (0x1B, 0x24):
                    video_pid, video_type = es_pid, stream_type
                    break
                e += 5 + es_info_len
        elif pid == video_pid:
            if pusi and buf[off] == 0 and buf[off + 1] == 0 and buf[off + 2] == 1:
                off += 9 + buf[off + 8]
            if off < p + 188:
                es.extend(buf[off:p + 188])
        p += 188

    # HEVC SPS parsing is not supported: resolution stays unknown
    if video_type != 0x1B or not es:
        return None
    for i in range(len(es) - 4):
        if es[i] == 0 and es[i + 1] == 0 and es[i + 2] == 1 and (es[i + 3] & 0x1F) == 7:
            end = len(es)
            for j in range(i + 4, len(es) - 2):
                if es[j] == 0 and es[j + 1] == 0 and es[j + 2] in (0, 1):
                    end = j
                    break
            try:
                return parse_h264_sps(bytes(es[i + 4:end]))
            except (ValueError, IndexError):
                return None
    return None


def read_box_header(buf, off):
    if off + 8 > len(buf):
        return None
    size = int.from_bytes(buf[off:off + 4], "big")
    box_type = buf[off + 4:off + 8].decode("latin1")
    header = 8
    if size == 1:
        if off + 16 > len(buf):
            return None
        size = int.from_bytes(buf[off + 8:off + 16], "big")
        header = 16
    return size, box_type, header


def parse_moov_resolution(buf, moov_start):
    """Finds the largest track size declared in tkhd boxes inside a moov buffer."""
    best = None

    def walk(start, end, depth):
        nonlocal best
        off = start
        while off + 8 <= end:
            box = read_box_header(buf, off)
            if not box or box[0] < 8:
                return
            size, box_type, header = box
            box_end = min(off + size, end)
            if box_type == "trak" and depth == 0:
                walk(off + header, box_end, 1)
            elif box_type == "tkhd" and depth == 1:
                version = buf[off + 8]
                w_off = off + (96 if version == 1 else 84)
                if w_off + 8 <= len(buf):
                    width = int.from_bytes(buf[w_off:w_off + 4], "big") / 65536
                    height = int.from_bytes(buf[w_off + 4:w_off + 8], "big") / 65536
                    if width > 0 and height > 0 and (not best or width * height > best[0] * best[1]):
                        best = (round(width), round(height))
            off += size

    moov = read_box_header(buf, moov_start)
    if not moov:
        return None
    walk(moov_start + moov[2], min(moov_start + moov[0], len(buf)), 0)
    return best


def parse_moov_duration(buf, moov_start):
    """Reads the movie length (seconds) from the mvhd box of a moov buffer."""
    moov = read_box_header(buf, moov_start)
    if not moov:
        return None
    end = min(moov_start + moov[0], len(buf))
    off = moov_start + moov[2]
    while off + 8 <= end:
        box = read_box_header(buf, off)
        if not box or box[0] < 8:
            return None
        if box[1] == "mvhd":
            v1 = buf[off + 8] == 1
            if off + (40 if v1 else 28) > len(buf):
                return None
            timescale = int.from_bytes(buf[off + (28 if v1 else 20):off + (32 if v1 else 24)], "big")
            duration = int.from_bytes(buf[off + 32:off + 40], "big") if v1 else int.from_bytes(buf[off + 24:off + 28], "big")
            # All bits set means "unknown"
            if not timescale or (not v1 and duration == 0xFFFFFFFF):
                return None
            return round(duration / timescale, 1) or None
        off += box[0]
    return None


def hls_playlist_duration(text):
    """Sums the #EXTINF of a media playlist. The length (seconds) is only given for a finished
    playlist (#EXT-X-ENDLIST): a live or partial one has no meaningful total."""
    values = [float(v) for v in re.findall(r"#EXTINF:\s*([\d.]+)", text)]
    return {"segments": len(values), "seconds": round(sum(values), 1) if "#EXT-X-ENDLIST" in text else None}


def probe_mp4(url, referer):
    """Reads the MP4 box layout with Range requests. Returns dict(res, ranged, duration) or dict(dead)."""
    status, buf, _ = probe_fetch(url, referer, "bytes=0-131071", 131072)
    if status >= 400:
        return {"dead": True}
    ranged = status == 206
    base = 0
    for _ in range(4):
        off = 0
        moov_at = next_abs = -1
        while off + 8 <= len(buf):
            box = read_box_header(buf, off)
            if not box or box[0] < 8:
                break
            if box[1] == "moov":
                moov_at = off
                break
            if off + box[0] > len(buf):
                next_abs = base + off + box[0]
                break
            off += box[0]
        if moov_at >= 0:
            return {"res": parse_moov_resolution(buf, moov_at), "ranged": ranged,
                    "duration": parse_moov_duration(buf, moov_at)}
        if next_abs < 0 or not ranged:
            break
        status, buf, _ = probe_fetch(url, referer, f"bytes={next_abs}-{next_abs + 131071}", 131072)
        if status != 206:
            break
        base = next_abs
    return {"res": None, "ranged": ranged}


def segment_starts_mid_file(status, content_range):
    """A segment is broken when a request for its start is answered with bytes from the middle of the file."""
    if status != 206:
        return False
    m = re.match(r"bytes\s+(\d+)-", content_range or "", re.I)
    return bool(m and int(m.group(1)) != 0)


def probe_first_segment(playlist_url, text, referer, read_resolution):
    """Checks the first TS segment of a media playlist and reads its frame size when asked."""
    if "#EXT-X-MAP" in text:
        return {"broken": False, "res": None}
    seg_line = next((l.strip() for l in text.splitlines() if l.strip() and not l.startswith("#")), None)
    if not seg_line:
        return {"broken": False, "res": None}
    seg_url = urllib.parse.urljoin(playlist_url, seg_line)
    if read_resolution:
        status, seg, content_range = probe_fetch(seg_url, referer, "bytes=0-131071", 131072)
    else:
        status, seg, content_range = probe_fetch(seg_url, referer, "bytes=0-1023", 0)
    if status >= 400:
        return {"broken": True, "res": None}
    return {
        "broken": segment_starts_mid_file(status, content_range),
        "res": parse_ts_resolution(seg) if read_resolution else None,
    }


def is_portuguese_audio_tag(line):
    """Detects whether an audio tag declares Portuguese audio (pt, pt-BR, etc)."""
    lang_m = re.search(r'LANGUAGE=["\']?([^"\',\s]+)["\']?', line, re.I)
    name_m = re.search(r'NAME=["\']?([^"\']+)["\']?', line, re.I)
    lang = (lang_m.group(1) if lang_m else "").lower()
    name = (name_m.group(1) if name_m else "").lower()
    return bool(re.search(r'(?:^|[^a-z])(pt|pt-br|pt_br|por)(?:[^a-z]|$)', lang, re.I) or
                re.search(r'portugu[eê]s|dublado|brasil|brazil', name, re.I))


def check_hls_audio_tracks(lines):
    """Checks audio tracks declared in an HLS master playlist (#EXT-X-MEDIA:TYPE=AUDIO)."""
    audio_lines = [l for l in lines if l.startswith("#EXT-X-MEDIA:TYPE=AUDIO") or (l.startswith("#EXT-X-MEDIA:") and re.search(r"TYPE=AUDIO", l, re.I))]
    if not audio_lines:
        return {"audio_mismatch": False, "has_pt_audio": False}
    has_pt = any(is_portuguese_audio_tag(l) for l in audio_lines)
    return {"audio_mismatch": not has_pt, "has_pt_audio": has_pt}


def probe_hls(url, referer):
    """Probes an HLS playlist: variants of a master (plus a first-segment sanity check),
    or the first TS segment of a media playlist for its frame size."""
    status, body, _ = probe_fetch(url, referer)
    if status >= 400:
        return {"dead": True}
    text = body.decode("utf-8", errors="ignore")
    if not text.lstrip().startswith("#EXTM3U"):
        return {"qualities": []}

    if "#EXT-X-STREAM-INF" in text:
        lines = text.splitlines()
        variants = []
        for i, line in enumerate(lines):
            if not line.startswith("#EXT-X-STREAM-INF"):
                continue
            uri = next((l.strip() for l in lines[i + 1:] if l.strip() and not l.startswith("#")), None)
            res = re.search(r"RESOLUTION=(\d+)x(\d+)", line, re.I)
            bw = re.search(r"(?:^#EXT-X-STREAM-INF:|[^-])BANDWIDTH=(\d+)", line, re.I)
            variants.append({
                "uri": uri,
                "quality": quality_class(res.group(1), res.group(2)) if res else None,
                "bandwidth": int(bw.group(1)) if bw else 0,
            })
        qualities = []
        for v in variants:
            if v["quality"] and v["quality"] not in qualities:
                qualities.append(v["quality"])
        # Re-hosting players ("FirePlayer") publish a fixed 360p/720p ladder whatever the real picture is
        bandwidths = ",".join(str(b) for b in sorted(v["bandwidth"] for v in variants))
        synthetic = bool(re.search(r"FirePlayer", text, re.I)) or bandwidths == "276000,2048000"

        audio_check = check_hls_audio_tracks(lines)
        audio_mismatch = audio_check["audio_mismatch"]
        has_pt_audio = audio_check["has_pt_audio"]

        # Check the top variant: its first segment must start at byte 0, and its real
        # frame size replaces a declared resolution that is not there
        broken = False
        duration = None
        empty = False
        try:
            candidates = [v for v in variants if v["uri"]]
            candidates.sort(key=lambda v: (-(v["quality"] or 0), -v["bandwidth"]))
            if candidates:
                top = candidates[0]
                variant_url = urllib.parse.urljoin(url, top["uri"])
                v_status, v_body, _ = probe_fetch(variant_url, referer)
                if v_status < 400:
                    media_text = v_body.decode("utf-8", errors="ignore")
                    length = hls_playlist_duration(media_text)
                    duration = length["seconds"]
                    empty = media_text.lstrip().startswith("#EXTM3U") and length["segments"] == 0
                    seg = probe_first_segment(variant_url, media_text, referer, True)
                    broken = seg["broken"]
                    measured = quality_class(*seg["res"]) if seg["res"] else None
                    if measured:
                        if not top["quality"]:
                            qualities = [measured] + [q for q in qualities if q != measured]
                        elif measured < top["quality"]:
                            # Real frame size is lower than advertised in playlist: downgrade fake resolution
                            qualities = [measured] + [q for q in qualities if q < measured]
                        # When measured >= top["quality"], keep the playlist's declared ladder so Hls.js levels match 1:1
        except Exception:
            pass  # The variant check is best effort
        return {"qualities": qualities, "multi": len(variants) > 1, "broken": broken, "synthetic": synthetic,
                "duration": duration, "empty": empty, "audio_mismatch": audio_mismatch, "has_pt_audio": has_pt_audio}

    # Media playlist: read the frame size from the first segment (fMP4 segments are skipped)
    length = hls_playlist_duration(text)
    seg = probe_first_segment(url, text, referer, True)
    q = quality_class(*seg["res"]) if seg["res"] else None
    is_explicit_sd = "-sd." in url or "/sd/" in url or "-sd-" in url or "_480p" in url
    is_explicit_ld = "-ld." in url or "/ld/" in url or "-ld-" in url or "_360p" in url
    if q and q > 480 and is_explicit_sd:
        q = 480
    if q and q > 360 and is_explicit_ld:
        q = 360
    return {"qualities": [q] if q else [], "broken": seg["broken"], "duration": length["seconds"],
            "empty": length["segments"] == 0, "audio_mismatch": False, "has_pt_audio": False}


def is_direct_mp4_source(src):
    """Detects direct MP4 streams hosted on known video CDNs."""
    raw = (src.get("raw_url") or "").lower()
    return ".mp4" in raw and ("fontedecanais" in raw or "57lgoe65efxo71.com" in raw or "77zzhf54vdll71.com" in raw or "/movies/" in raw)


def probe_source(src):
    """Adds quality, qualities, kind and alive to a source dict (returns a new dict)."""
    raw = src.get("raw_url", "")
    is_hls = src.get("type") == "hls" or ".m3u8" in raw
    is_direct_mp4 = is_direct_mp4_source(src)
    referer = (src.get("headers") or {}).get("Referer", "")
    is_proxied = "/api/stream" in src.get("stream_url", "")
    qualities, kind, alive, synthetic, duration = ([], "mp4-range" if is_direct_mp4 else "unknown", True, False, None)
    audio_mismatch = False
    has_pt_audio = False
    try:
        if is_hls:
            r = probe_hls(raw, referer)
            if r.get("dead"):
                alive = not is_proxied
            else:
                qualities = r["qualities"]
                kind = "hls-multi" if r.get("multi") else "hls-single"
                synthetic = bool(r.get("synthetic"))
                duration = r.get("duration") or None
                audio_mismatch = bool(r.get("audio_mismatch"))
                has_pt_audio = bool(r.get("has_pt_audio"))
                # A broken first segment stalls playback, and a playlist without segments plays
                # nothing: keep them only as a last resort
                if r.get("broken") or r.get("empty"):
                    alive = False
        else:
            r = probe_mp4(raw, referer)
            if r.get("dead"):
                alive = not is_proxied
            else:
                q = quality_class(*r["res"]) if r.get("res") else None
                qualities = [q] if q else []
                kind = "mp4-range" if (r.get("ranged") or is_direct_mp4) else "mp4"
                duration = r.get("duration") or None
    except Exception as e:
        qualities = []
        print(f"[LocalServer] Probe failed for {raw[:80]}: {e}", file=sys.stderr)
    qualities = sorted(qualities, reverse=True)
    return {
        **src,
        "quality": qualities[0] if qualities else None,
        "qualities": qualities,
        "kind": kind,
        "alive": alive,
        "synthetic": synthetic,
        "duration": duration,
        "duration_mismatch": False,
        "audio_mismatch": audio_mismatch,
        "has_pt_audio": has_pt_audio,
        "probed": True
    }


# Copies of the same video differ by 1-2 % (trimmed intros); a different video measured 7-8 % off
DURATION_TOLERANCE = 0.05
DURATION_MIN_GAP_S = 45


def durations_agree(seconds, reference):
    return abs(seconds - reference) <= max(DURATION_TOLERANCE * reference, DURATION_MIN_GAP_S)


def mark_duration_outliers(sources):
    """Hosts sometimes list another video under the same episode (another show, another cut).
    With 3 or more measured lengths, a source far from the median is flagged; it is ranked
    after the others but kept as a fallback. With fewer there is no majority to trust."""
    measured = [s for s in sources if s.get("alive") and (s.get("duration") or 0) > 0]
    if len(measured) < 3:
        return sources
    values = sorted(s["duration"] for s in measured)
    mid = len(values) // 2
    median = values[mid] if len(values) % 2 else (values[mid - 1] + values[mid]) / 2
    for s in measured:
        s["duration_mismatch"] = not durations_agree(s["duration"], median)
    return sources


def can_stop_probing(results):
    """Ranking may stop early on a trusted 1080p HLS, but only once another measured source
    confirms its length: the first trusted source may itself be the wrong video."""
    return any(
        is_trusted_top_source(t) and (t.get("duration") or 0) > 0 and any(
            o is not t and o.get("probed") and o.get("alive") and (o.get("duration") or 0) > 0
            and durations_agree(o["duration"], t["duration"]) for o in results)
        for t in results)


def is_mirror_source(src):
    """Re-hosting mirrors serve a synthetic "FirePlayer" master that always announces 360p + 720p
    whatever the real picture is (CAM copies included), so at equal declared quality they lose."""
    url = src.get("raw_url", "").lower()
    return "playercdn" in url or "workers.dev" in url or "powestream" in url


def is_low_trust_source(src):
    """Low trust: synthetic master, or a known re-hosting mirror."""
    return bool(src.get("synthetic")) or is_mirror_source(src)


def is_cam_source(src):
    """Detects CAM / TeleSync / Cinema recording markers in stream labels, titles and URLs."""
    text = f"{src.get('label') or ''} {src.get('title') or ''} {src.get('raw_url') or ''}"
    clean = re.sub(r"\.ts(?:[?#]|$)", " ", text, flags=re.I)
    return bool(re.search(r"\b(cam|camrip|telesync|telecine|hdts|hdtc|hdcam|cinema|gravado)\b", clean, re.I) or
                re.search(r"(?:[_\W]|^)(?:ts-?rip|hd-?ts)(?:[_\W]|$)", clean, re.I))


def is_trusted_top_source(src):
    """A measured, healthy 1080p+ HLS from a trusted host: no need to wait for the others."""
    return (src.get("probed") and src.get("alive") and not src.get("audio_mismatch") and (src.get("quality") or 0) >= 1080
            and src.get("kind", "").startswith("hls") and not is_low_trust_source(src) and not is_cam_source(src))


def is_hd_abr(src):
    """Detects an adaptive HLS multi-bitrate stream with HD quality (720p+)."""
    return src.get("kind") == "hls-multi" and (src.get("quality") or 0) >= 720


def rank_sources_by_quality(sources, tie_breaker=lambda s: 0, check_lengths=False, is_dubbed=True, quality_mode="balanced"):
    """Probes sources in parallel within PROBE_BUDGET_S and sorts them best-first.
    Returns early when a trusted 1080p HLS is measured; sources not measured in time stay
    "unknown" and fall back to kind/host order.
    With check_lengths (episodes, which all have one length; movies have legitimate cuts of
    different lengths), the early return also needs another source confirming the length, and
    a source whose length disagrees with the others goes after every agreeing live source."""
    from concurrent.futures import ThreadPoolExecutor, wait, FIRST_COMPLETED
    results = [dict(s) if s.get("probed") else {
        **s,
        "quality": None,
        "qualities": [],
        "kind": "mp4-range" if is_direct_mp4_source(s) else "unknown",
        "alive": True,
        "synthetic": False,
        "duration": None,
        "duration_mismatch": False,
        "audio_mismatch": False,
        "has_pt_audio": False,
        "probed": False
    } for s in sources]
    to_probe = [i for i, s in enumerate(sources[:PROBE_MAX_SOURCES]) if not s.get("probed")]
    if to_probe:
        pool = ThreadPoolExecutor(max_workers=len(to_probe))
        futures = {pool.submit(probe_source, sources[i]): i for i in to_probe}
        deadline = time.time() + PROBE_BUDGET_S
        pending = set(futures)
        while pending:
            done, pending = wait(pending, timeout=max(0, deadline - time.time()), return_when=FIRST_COMPLETED)
            if not done:
                break
            trusted = False
            for fut in done:
                try:
                    results[futures[fut]] = fut.result()
                except Exception:
                    continue
                trusted = trusted or is_trusted_top_source(results[futures[fut]])
            if can_stop_probing(results) if check_lengths else trusted:
                break
        pool.shutdown(wait=False, cancel_futures=True)
    if check_lengths:
        mark_duration_outliers(results)

    candidates = results
    if is_dubbed:
        valid_audio = [s for s in results if s.get("alive") and not s.get("audio_mismatch")]
        if valid_audio:
            candidates = [s for s in results if not s.get("audio_mismatch")]

    indexed = list(enumerate(candidates))
    indexed.sort(key=lambda x: (
        -int(x[1]["alive"]),
        int(bool(x[1].get("audio_mismatch"))),
        -int(bool(x[1].get("has_pt_audio"))),
        int(bool(x[1].get("duration_mismatch"))),
        int(is_cam_source(x[1])),
        (-int(is_hd_abr(x[1]))) if quality_mode != "highest" else 0,
        -(x[1]["quality"] or 0),
        int(is_low_trust_source(x[1])),
        KIND_RANK.get(x[1]["kind"], 99),
        -tie_breaker(x[1]),
        x[0],
    ))
    return [s for _, s in indexed]


MAL_PREFIX_CACHE = {}

# Every MyAnimeList request gets this long; a slow or blocking answer must not hold the resolve
MAL_SEARCH_TIMEOUT_S = 2.0
# Hard limit for a whole title lookup (searches plus the Jikan fallback)
MAL_LOOKUP_BUDGET_S = 4.0


def search_mal_prefix(keyword: str):
    clean_kw = keyword.strip()
    if clean_kw in MAL_PREFIX_CACHE:
        return MAL_PREFIX_CACHE[clean_kw]
    try:
        encoded = urllib.parse.quote(clean_kw)
        url = f"https://myanimelist.net/search/prefix.json?type=anime&keyword={encoded}"
        req = urllib.request.Request(url, headers={"User-Agent": USER_AGENT})
        with urllib.request.urlopen(req, timeout=MAL_SEARCH_TIMEOUT_S) as res:
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

# Only entries tied with the best MAL match are tried as fallbacks: a lower-ranked entry is a different
# show, and playing it silently would be worse than reporting that nothing was found
MAL_RUNNER_UP_MARGIN = 0


def is_latin_text(text: str) -> bool:
    # Text without Latin letters (e.g. the Japanese TMDB original_name) cannot take "Season N" suffixes
    return not re.search(r'[ɐ-￿]', text)


def lookup_mal_candidates(title: str, original_title: str = "", season: int = 1, season_name: str = "", year: int = 0):
    """
    Ranks MyAnimeList entries for a TMDB anime title with season and arc awareness.
    The pt-BR TMDB name is often a translation MAL does not know ("Frieren e a Jornada para o Além"),
    so the TMDB original name (Japanese) is searched too. Returns up to 3 ids, best first.
    """
    def strip_notes(t):
        return re.sub(r'\(.*?\)|\[.*?\]', '', t or '').strip()

    clean_title = strip_notes(title)
    clean_original = strip_notes(original_title)

    clean_sname = ""
    if season_name:
        sname_cand = re.sub(r'^(Temporada|Season)\s*\d+[:\-]?\s*', '', season_name, flags=re.I).strip()
        if sname_cand.lower() not in ["especiais", "specials", "temporada", "season", ""] and len(sname_cand) > 2:
            clean_sname = sname_cand

    variants = [clean_title]
    if clean_original and clean_original.lower() != clean_title.lower():
        variants.append(clean_original)

    queries = []
    queued = set()

    def add_query(q, priority):
        key = q.strip().lower()
        if not key or key in queued:
            return
        queued.add(key)
        queries.append((q, priority))

    for base in variants:
        if is_latin_text(base):
            if clean_sname:
                add_query(f"{base} {clean_sname}", 50)
                add_query(clean_sname, 40)
            if season > 1:
                add_query(f"{base} Season {season}", 35)
                add_query(f"{base} Part {season}", 35)
                suffix = "nd" if season == 2 else "rd" if season == 3 else "th"
                add_query(f"{base} {season}{suffix} Season", 30)
        add_query(base, 10)

    # All searches run in parallel; results are merged in query order so ranking stays deterministic.
    # urllib's timeout does not cover DNS, so the whole lookup also has a hard deadline: threads that
    # miss it are abandoned (daemon-like) instead of holding the resolve.
    from concurrent.futures import ThreadPoolExecutor, wait
    deadline = time.time() + MAL_LOOKUP_BUDGET_S
    pool = ThreadPoolExecutor(max_workers=len(queries) + 1)
    futures = [pool.submit(search_mal_prefix, q_text) for q_text, _ in queries]
    done, _pending = wait(futures, timeout=MAL_SEARCH_TIMEOUT_S + 0.5)
    results = [f.result() if f in done else [] for f in futures]

    candidates = []
    seen = set()
    for (q_text, q_priority), items in zip(queries, results):
        for idx, it in enumerate(items[:6]):
            iid = it.get("id")
            if iid and iid not in seen:
                seen.add(iid)
                rank_bonus = max(0, 15 - idx * 3)
                candidates.append((it, q_priority + rank_bonus))

    if not candidates:
        # Fallback to Jikan API search, inside what is left of the lookup budget
        def jikan_first_id():
            encoded = urllib.parse.quote(f"{clean_title} {clean_sname}".strip())
            url = f"https://api.jikan.moe/v4/anime?q={encoded}&limit=1"
            req = urllib.request.Request(url, headers={"User-Agent": USER_AGENT})
            with urllib.request.urlopen(req, timeout=MAL_SEARCH_TIMEOUT_S) as res:
                data = json.loads(res.read().decode("utf-8"))
            return data["data"][0].get("mal_id") if data.get("data") else None

        try:
            jikan_id = pool.submit(jikan_first_id).result(timeout=max(0.3, deadline - time.time()))
            if jikan_id:
                pool.shutdown(wait=False)
                return [jikan_id]
        except Exception as e:
            print(f"[LocalServer] Jikan fallback error: {e!r}", file=sys.stderr)
        pool.shutdown(wait=False)
        return []

    pool.shutdown(wait=False)

    title_keys = [v.lower() for v in variants if is_latin_text(v)]

    def score_item(cand_tuple):
        cand, base_score = cand_tuple
        c_name = cand.get("name", "").lower()
        payload = cand.get("payload") or {}
        mtype = str(payload.get("media_type", "")).upper()
        pts = base_score

        if mtype in ["TV", "ONA"]:
            pts += 40
        elif mtype in ["SPECIAL", "TV SPECIAL", "OVA", "MOVIE"]:
            # Specials, OVAs and movies are never the episodic series (e.g. "Episode of East Blue" for One Piece)
            pts -= 100

        # Heavy penalty for recaps, summaries, PVs, pilots
        if any(bad in c_name for bad in ["pilot", "kanketsu-hen", "recap", "summary", "preview", "remix", "music", "special"]):
            pts -= 60

        # Spin-offs mention the title without starting with it ("Boruto: Naruto Next Generations")
        if any(len(key) > 2 and key in c_name and not c_name.startswith(key) for key in title_keys):
            pts -= 50

        if clean_sname:
            s_words = [w.lower() for w in re.findall(r'\b[a-zA-Z]{3,}\b', clean_sname)]
            matches = sum(1 for w in s_words if w in c_name)
            if matches:
                pts += (matches * 25)

        # Remakes share one title ("Hunter x Hunter" 1999 vs 2011): the show's first air year picks the right
        # entry. Only season 1 is compared, later seasons start years after the show's first air date.
        start_year = str(payload.get("start_year", "")).strip()
        if year and season == 1 and start_year.isdigit() and int(start_year):
            gap = abs(int(start_year) - year)
            if gap <= 1:
                pts += 30
            elif gap >= 3:
                pts -= 30

        # An explicit season marker for another season ("2nd Season" when asking for season 1) is a mismatch
        marker = re.search(r'(\d+)(?:st|nd|rd|th)\s*season|season\s*(\d+)|part\s*(\d+)', c_name)
        if marker and int(marker.group(1) or marker.group(2) or marker.group(3)) != season:
            pts -= 30

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

    scored = sorted(((score_item(c), c[0]) for c in candidates), key=lambda x: x[0], reverse=True)
    best_score, best_item = scored[0]
    print(f"[LocalServer] Resolved Anime MAL ID: {best_item.get('id')} ('{best_item.get('name')}') for '{title}' / '{original_title}' (T{season} '{season_name}')", file=sys.stderr)
    return [it.get("id") for score, it in scored if score >= best_score - MAL_RUNNER_UP_MARGIN][:3]


# ============================================================
# MAL LOOKUP CACHE
# Hits live a week, misses only minutes (a rate limit or captcha from MyAnimeList must not stick).
# ============================================================
MAL_CACHE_HIT_TTL_S = 7 * 24 * 3600
MAL_CACHE_MISS_TTL_S = 5 * 60
MAL_LOOKUP_CACHE = {}


def get_mal_candidates(title: str, original_title: str = "", season: int = 1, season_name: str = "", year: int = 0):
    """Cached front for lookup_mal_candidates."""
    key = "|".join(str(v if v is not None else "").strip().lower() for v in (title, original_title, season, season_name, year))
    cached = MAL_LOOKUP_CACHE.get(key)
    if cached and time.time() - cached[0] < cached[1]:
        return cached[2]
    ids = lookup_mal_candidates(title, original_title, season, season_name, year)
    MAL_LOOKUP_CACHE[key] = (time.time(), MAL_CACHE_HIT_TTL_S if ids else MAL_CACHE_MISS_TTL_S, ids)
    return ids


# ============================================================
# EPISODE NUMBERING
# The anime host numbers episodes inside each MyAnimeList entry and answers 404 right after the last one.
# Some entries cover the whole show (Dragon Ball Z, One Piece), others a single season (Jujutsu Kaisen),
# so a season's episode must be sent as the absolute number for the first kind and the relative for the second.
# ============================================================
# An entry that still has this share of the show's episodes covers the whole show
WHOLE_SHOW_RATIO = 0.9
ENTRY_SPAN_CACHE = {}


def pick_episode_number(mal_id, season: int, relative: int, absolute: int, total: int):
    if not absolute or absolute == relative or season <= 1:
        return relative
    if not total:
        return absolute
    key = f"{mal_id}:{total}"
    if key not in ENTRY_SPAN_CACHE:
        data = fetch_zoko(str(mal_id), math.ceil(total * WHOLE_SHOW_RATIO))
        ENTRY_SPAN_CACHE[key] = bool(data and data.get("src"))
    return absolute if ENTRY_SPAN_CACHE[key] else relative


# ============================================================
# SUBTITLE TRACKS
# The host lists every language alphabetically and marks them all with the same lang code, so the
# language comes from the label. Only Portuguese (Brazilian when known) and English are kept.
# ============================================================
def subtitle_language(track: dict) -> str:
    label = str(track.get("label") or track.get("name") or "").strip().lower()
    lang = str(track.get("lang") or "").strip().lower()
    if "portugu" in label:
        return "pt-BR" if re.search(r"brazil|brasil", label) else "pt"
    if re.match(r"^(english|ingl[eê]s)\b", label):
        return "en"
    if re.match(r"^pt[-_]?br$", lang):
        return "pt-BR"
    if lang.startswith("pt"):
        return "pt"
    if not label and lang.startswith("en"):
        return "en"
    return "other"


def normalize_subtitles(tracks: list) -> list:
    by_language = {}
    for track in tracks:
        language = subtitle_language(track)
        if language != "other" and language not in by_language:
            by_language[language] = track
    chosen = []
    if "pt-BR" in by_language:
        chosen.append(("pt-BR", "Português (Brasil)", by_language["pt-BR"]))
    elif "pt" in by_language:
        chosen.append(("pt", "Português", by_language["pt"]))
    if "en" in by_language:
        chosen.append(("en", "Inglês", by_language["en"]))
    return [
        {"lang": lang, "label": label, "default": index == 0, "url": track.get("url", "")}
        for index, (lang, label, track) in enumerate(chosen)
    ]

# ---------- TMDB reads (/api/tmdb): same rules as functions/api/tmdb.js
TMDB_ALLOWED_PATH = re.compile(r"^/(movie|tv|discover|trending|search|genre|collection|person|find)(/|\?|$)")
TMDB_CACHE = {}
TMDB_CACHE_TTL_S = 1800


def tmdb_target(path, key):
    """The TMDB address for `path`, or None when the path is not an allowed read."""
    if not isinstance(path, str) or not TMDB_ALLOWED_PATH.match(path) or ".." in path or re.search(r"[\s\\]", path):
        return None
    parsed = urllib.parse.urlsplit("https://api.themoviedb.org/3" + path)
    if parsed.netloc != "api.themoviedb.org" or not parsed.path.startswith("/3/"):
        return None
    query = [(k, v) for k, v in urllib.parse.parse_qsl(parsed.query, keep_blank_values=True) if k != "api_key"]
    query.append(("api_key", key))
    return urllib.parse.urlunsplit((parsed.scheme, parsed.netloc, parsed.path, urllib.parse.urlencode(query), ""))


class ThreadedHTTPServer(ThreadingMixIn, HTTPServer):
    daemon_threads = True
    # Python's default queue is 5 pending connections; a browser opens more than that at once (modules, styles,
    # images, video segments) and Windows refuses the rest, so pages failed to load at random
    request_queue_size = 128

import http.server

# ---------- Stream proxy (/api/stream): same rules as functions/api/stream.js, checked by tools/test_stream_proxy.py

# Whatever the proxy returns must never run as a page here
STREAM_SAFETY_HEADERS = {
    "X-Content-Type-Options": "nosniff",
    "Content-Security-Policy": "sandbox; default-src 'none'",
}
STREAM_UPSTREAM_TIMEOUT_S = 15
STREAM_MAX_REDIRECTS = 5
# Playlists and subtitles are read whole to be rewritten; real ones stay well under 1 MB
STREAM_MAX_BUFFERED_BYTES = 5 * 1024 * 1024
STREAM_MEDIA_TYPE = re.compile(r"^(video/|audio/|application/(mp4|octet-stream)$|binary/octet-stream$)", re.I)
# Hosts disguise segments (".jpeg", text/html): the address decides the type, else plain data
STREAM_TYPE_BY_EXTENSION = {"ts": "video/mp2t", "mp4": "video/mp4", "m4s": "video/mp4", "m4v": "video/mp4",
                            "aac": "audio/aac", "m4a": "audio/mp4", "mp3": "audio/mpeg"}


def is_http_url(value):
    try:
        parts = urllib.parse.urlsplit(value or "")
    except ValueError:
        return False
    return parts.scheme in ("http", "https") and bool(parts.hostname)


def stream_media_type(upstream_type, url):
    """Content type of a binary answer: media types as they come, anything else from the address, else plain data."""
    media = (upstream_type or "").split(";")[0].strip()
    if STREAM_MEDIA_TYPE.match(media):
        return media
    extension = urllib.parse.urlsplit(url).path.rsplit(".", 1)[-1].lower()
    return STREAM_TYPE_BY_EXTENSION.get(extension, "application/octet-stream")


def clean_vtt(text):
    """Subtitle cues keep italics, bold and underline only. Any other complete tag is dropped and a stray "<" or ">"
    (a tag split over two lines) is escaped, so the player can draw the cue as HTML without running anything."""
    lines = []
    for line in text.split("\n"):
        if "-->" not in line:
            line = re.sub(r"</?[a-zA-Z][^<>]*>", lambda m: m.group(0).lower() if re.fullmatch(r"</?[ibu]>", m.group(0), re.I) else "", line)
            line = re.sub(r"<(?!/?[ibu]>)", "&lt;", line)
            line = re.sub(r"(?<!<[ibu])(?<!</[ibu])>", "&gt;", line)
        lines.append(line)
    return "\n".join(lines)


def read_capped(resp):
    """Reads a whole body up to STREAM_MAX_BUFFERED_BYTES; None when it is bigger."""
    body = resp.read(STREAM_MAX_BUFFERED_BYTES + 1)
    return None if len(body) > STREAM_MAX_BUFFERED_BYTES else body


class _NoRedirect(urllib.request.HTTPRedirectHandler):
    """Redirects come back as HTTPError 3xx so fetch_upstream checks every new address."""

    def redirect_request(self, *args, **kwargs):
        return None


_UPSTREAM_OPENER = urllib.request.build_opener(_NoRedirect)


def upstream_open(req, timeout):
    """One upstream request, redirects not followed (tests replace this function)."""
    return _UPSTREAM_OPENER.open(req, timeout=timeout)


def fetch_upstream(target_url, referer, origin, range_header=None, accept=None):
    """Fetches the target following redirects one by one (each new address must be http/https again).
    Returns (response, final_url), or (None, url) after too many or a bad redirect. Upstream errors raise HTTPError."""
    url = target_url
    for _ in range(STREAM_MAX_REDIRECTS + 1):
        req = urllib.request.Request(url)
        req.add_header("User-Agent", USER_AGENT)
        req.add_header("Referer", referer)
        if origin:
            req.add_header("Origin", origin)
        if range_header:
            req.add_header("Range", range_header)
        if accept:
            req.add_header("Accept", accept)
        try:
            return upstream_open(req, STREAM_UPSTREAM_TIMEOUT_S), url
        except urllib.error.HTTPError as e:
            location = e.headers.get("Location") if e.headers else None
            if 300 <= e.code < 400 and location:
                e.close()
                url = urllib.parse.urljoin(url, location)
                if not is_http_url(url):
                    return None, url
                continue
            raise
    return None, url


# Turnstile (functions/api/account turnstileVerifier). Without TURNSTILE_SECRET in .env the local server behaves like
# Cloudflare's test keys: the test widget on localhost hands out this dummy token, which always passes
TURNSTILE_SECRET = load_env_value("TURNSTILE_SECRET")
TURNSTILE_TEST_TOKEN = "XXXX.DUMMY.TOKEN.XXXX"
CAPTCHA_HOSTS = re.compile(r"(^|\.)tvzinhaonline\.pages\.dev$")


def verify_captcha(token, action, ip):
    """'ok' | 'failed' | 'unavailable', as the function's turnstileVerifier."""
    if not TURNSTILE_SECRET:
        return "ok" if token == TURNSTILE_TEST_TOKEN else "failed"
    data = urllib.parse.urlencode({"secret": TURNSTILE_SECRET, "response": token, "remoteip": ip or ""}).encode("utf-8")
    try:
        req = urllib.request.Request("https://challenges.cloudflare.com/turnstile/v0/siteverify", data=data, method="POST")
        with urllib.request.urlopen(req, timeout=5) as res:
            answer = json.loads(res.read().decode("utf-8"))
    except Exception:
        return "unavailable"
    ok = answer.get("success") and answer.get("action") == action and CAPTCHA_HOSTS.search(str(answer.get("hostname") or ""))
    return "ok" if ok else "failed"


# Calls per minute from one IP to /api/resolve and /api/tmdb (same as API_IP_LIMIT in functions/api/resolve.js)
API_IP_LIMIT = {"max": 300, "windowMs": 60 * 1000}
_API_IP_WINDOWS = {}


def api_ip_blocked_for(ip, now=None):
    now = now if now is not None else int(time.time() * 1000)
    key = ip or "unknown"
    entry = _API_IP_WINDOWS.get(key)
    if not entry or now - entry["start"] > API_IP_LIMIT["windowMs"]:
        entry = {"start": now, "count": 0}
        _API_IP_WINDOWS[key] = entry
    entry["count"] += 1
    if entry["count"] > API_IP_LIMIT["max"]:
        return -(-(entry["start"] + API_IP_LIMIT["windowMs"] - now) // 1000)
    return 0


# Signed proxy addresses (same as functions/api/stream.js): HMAC of exp, url, referer and origin
STREAM_LINK_TTL_S = 24 * 3600
_STREAM_SECRET = load_env_value("STREAM_SIGNING_KEY") or ACCOUNTS_PEPPER


def stream_signing_key():
    """The HMAC key for proxy addresses, or None when no secret is set (the proxy stays open)."""
    return f"tvzinha-stream|{_STREAM_SECRET}".encode("utf-8") if _STREAM_SECRET else None


def link_signature(key, exp, url, referer, origin):
    mac = hmac.new(key, f"{exp}\n{url}\n{referer}\n{origin}".encode("utf-8"), hashlib.sha256).digest()[:16]
    return base64.urlsafe_b64encode(mac).decode("ascii").rstrip("=")


def proxied_stream_url(proxy_base, key, url, referer="", origin="", exp=None):
    out = f"{proxy_base}?url={urllib.parse.quote(url, safe='')}&referer={urllib.parse.quote(referer, safe='')}"
    if origin:
        out += f"&origin={urllib.parse.quote(origin, safe='')}"
    if key:
        expires = exp or int(time.time()) + STREAM_LINK_TTL_S
        out += f"&exp={expires}&sig={link_signature(key, expires, url, referer, origin)}"
    return out


def link_is_valid(key, params, url, referer, origin):
    if not key:
        return True
    try:
        exp = int(params.get("exp", [""])[0])
    except ValueError:
        return False
    now = int(time.time())
    if exp < now or exp > now + 2 * STREAM_LINK_TTL_S:
        return False
    return hmac.compare_digest(params.get("sig", [""])[0], link_signature(key, exp, url, referer, origin))


def is_private_address(url):
    """True when the address points at this computer or the local network (the local proxy must not reach them;
    Cloudflare refuses them by itself)."""
    try:
        host = urllib.parse.urlparse(url).hostname or ""
        infos = socket.getaddrinfo(host, None)
    except (OSError, ValueError, UnicodeError):
        # Not resolvable: the request fails by itself
        return False
    for info in infos:
        try:
            ip = ipaddress.ip_address(info[4][0].split("%")[0])
        except ValueError:
            return True
        if ip.is_private or ip.is_loopback or ip.is_link_local or ip.is_reserved or ip.is_multicast or ip.is_unspecified:
            return True
    return False


# The same private paths as functions/_middleware.js, plus any dot-file or dot-folder (.env, .git) that only exists here
BLOCKED_PREFIXES = ["/.archives/", "/tools/", "/docs/", "/.github/", "/.git/", "/scratch/", "/.agents/"]
BLOCKED_FILES = ["/claude.md", "/gemini.md", "/agents.md", "/.gitignore", "/_headers"]


def is_blocked_path(raw_path):
    try:
        path = urllib.parse.unquote(raw_path, errors="strict")
    except UnicodeDecodeError:
        return True
    path = re.sub(r"/{2,}", "/", path.lower().replace("\\", "/"))
    if path in BLOCKED_FILES:
        return True
    if any(path.startswith(prefix) or path == prefix[:-1] for prefix in BLOCKED_PREFIXES):
        return True
    return any(part.startswith(".") and part != ".well-known" for part in path.split("/") if part)


def is_allowed_origin(origin: str) -> bool:
    """Checks whether an Origin header is permitted to access /api/resolve (D5)."""
    if not origin:
        return True
    try:
        parsed = urllib.parse.urlparse(origin)
        scheme = (parsed.scheme or "").lower()
        if scheme not in ("http", "https"):
            return False
        host = (parsed.hostname or "").lower()
        if host in ("localhost", "127.0.0.1"):
            return True
        if re.match(r"^192\.168\.\d{1,3}\.\d{1,3}$", host):
            return True
        if re.match(r"^10\.\d{1,3}\.\d{1,3}\.\d{1,3}$", host):
            return True
        if re.match(r"^172\.(1[6-9]|2\d|3[0-1])\.\d{1,3}\.\d{1,3}$", host):
            return True
        # Our site and its previews only (any other *.pages.dev site is someone else's)
        if host == "tvzinhaonline.pages.dev" or host.endswith(".tvzinhaonline.pages.dev"):
            return True
        return False
    except Exception:
        return False


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

    def send_cors_headers(self, status=200, content_type="application/json", origin=None):
        self.send_response(status)
        allow_origin = origin if origin else "*"
        self.send_header("Access-Control-Allow-Origin", allow_origin)
        self.send_header("Access-Control-Allow-Methods", "GET, HEAD, POST, OPTIONS")
        self.send_header("Access-Control-Allow-Headers", "Range, Content-Type, Accept, User-Agent, Referer, Origin")
        self.send_header("Access-Control-Expose-Headers", "Content-Length, Content-Range, Accept-Ranges")
        self.send_header("Vary", "Origin")
        if content_type:
            self.send_header("Content-Type", content_type)

    def send_not_found(self):
        """Private files answer 404 as if they did not exist (functions/_middleware.js)."""
        body = b"Not found"
        self.send_response(404)
        self.send_header("Content-Type", "text/plain; charset=utf-8")
        self.send_header("Content-Length", str(len(body)))
        self.end_headers()
        if self.command != "HEAD":
            self.wfile.write(body)

    def end_headers(self):
        self.send_header("Cache-Control", "no-cache, no-store, must-revalidate")
        self.send_header("Pragma", "no-cache")
        self.send_header("Expires", "0")
        already_sent = {h.split(b":", 1)[0].lower() for h in getattr(self, "_headers_buffer", [])}
        if b"x-content-type-options" not in already_sent:
            self.send_header("X-Content-Type-Options", "nosniff")
        if b"referrer-policy" not in already_sent:
            self.send_header("Referrer-Policy", "strict-origin-when-cross-origin")
        if b"permissions-policy" not in already_sent:
            self.send_header("Permissions-Policy", "camera=(), microphone=(), geolocation=(), interest-cohort=()")
        if b"x-frame-options" not in already_sent:
            self.send_header("X-Frame-Options", "SAMEORIGIN")
        # The production CSP from _headers ("/*" block); /api/stream sends its own sandbox policy
        if b"content-security-policy" not in already_sent and SITE_CSP:
            self.send_header("Content-Security-Policy", SITE_CSP)
        super().end_headers()

    def do_OPTIONS(self):
        parsed = urllib.parse.urlparse(self.path)
        origin = self.headers.get("Origin")
        restricted = parsed.path in ("/api/resolve", "/api/tmdb")
        if restricted and not is_allowed_origin(origin):
            self.send_response(403)
            self.end_headers()
            return
        self.send_cors_headers(204, content_type=None, origin=origin if restricted else "*")
        self.send_header("Access-Control-Max-Age", "86400")
        self.end_headers()

    def do_HEAD(self):
        try:
            parsed = urllib.parse.urlparse(self.path)
            path = parsed.path
            params = urllib.parse.parse_qs(parsed.query)

            if not path.startswith("/api/") and is_blocked_path(self.path.split("?", 1)[0]):
                self.send_not_found()
                return
            if path == "/api/stream":
                self.handle_stream(params, is_head=True)
            elif path == "/api/resolve":
                origin = self.headers.get("Origin")
                if not is_allowed_origin(origin):
                    self.send_response(403)
                    self.send_header("Content-Type", "application/json; charset=utf-8")
                    self.end_headers()
                    return
                self.send_cors_headers(200, "application/json; charset=utf-8", origin=origin)
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

            if not path.startswith("/api/") and is_blocked_path(self.path.split("?", 1)[0]):
                self.send_not_found()
                return
            if path in ("/api/resolve", "/api/tmdb"):
                wait = api_ip_blocked_for(self.client_address[0] if self.client_address else "")
                if wait:
                    self.send_response(429)
                    self.send_header("Content-Type", "application/json; charset=utf-8")
                    self.send_header("Retry-After", str(wait))
                    self.end_headers()
                    self.wfile.write(b'{"success":false,"error":"too_many_requests"}')
                    return
            if path == "/api/resolve":
                origin = self.headers.get("Origin")
                if not is_allowed_origin(origin):
                    self.send_response(403)
                    self.send_header("Content-Type", "application/json; charset=utf-8")
                    self.end_headers()
                    self.wfile.write(b'{"success":false,"error":"CORS origin forbidden"}')
                    return
                self.handle_resolve(params, origin=origin)
            elif path == "/api/tmdb":
                self.handle_tmdb(params, origin=self.headers.get("Origin"))
            elif path.startswith("/api/account/"):
                self.handle_account("GET", path)
            elif path == "/api/sync":
                self.handle_sync("GET")
            elif path == "/api/stream":
                self.handle_stream(params, is_head=False)
            elif path == "/health":
                self.send_cors_headers(200, "application/json")
                self.end_headers()
                self.wfile.write(b'{"status":"healthy","service":"tvzinha-local-resolver"}')
            elif path == "/__dev/clear-cache":
                # Local-only helper for tools/player_benchmark.mjs (measures cold resolves)
                RESOLVE_CACHE.clear()
                MAL_PREFIX_CACHE.clear()
                MAL_LOOKUP_CACHE.clear()
                ENTRY_SPAN_CACHE.clear()
                self.send_cors_headers(200, "application/json")
                self.end_headers()
                self.wfile.write(b'{"cleared":true}')
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

    def do_POST(self):
        try:
            path = urllib.parse.urlparse(self.path).path
            if path == "/api/resolve":
                self.handle_resolve_post()
            elif path.startswith("/api/account/"):
                self.handle_account("POST", path)
            elif path == "/api/sync":
                self.handle_sync("POST")
            else:
                self.send_response(404)
                self.end_headers()
        except Exception as e:
            print(f"[LocalServer] Error in do_POST: {e}", file=sys.stderr)
            try:
                self.send_response(500)
                self.end_headers()
            except Exception:
                pass

    def handle_resolve_post(self):
        origin = self.headers.get("Origin")
        if not is_allowed_origin(origin):
            self.send_response(403)
            self.send_header("Content-Type", "application/json; charset=utf-8")
            self.end_headers()
            self.wfile.write(b'{"success":false,"error":"CORS origin forbidden"}')
            return
        parsed = urllib.parse.urlparse(self.path)
        params = urllib.parse.parse_qs(parsed.query)
        action = params.get("action", [""])[0]
        if action in ("sign", "sign_batch"):
            length = int(self.headers.get("Content-Length") or 0)
            raw = self.rfile.read(min(length, 65536)) if length else b""
            try:
                body = json.loads(raw.decode("utf-8")) if raw else {}
            except Exception:
                self.send_json(400, {"success": False, "error": "Invalid JSON"}, origin)
                return
            items = body if isinstance(body, list) else (body.get("items") if isinstance(body.get("items"), list) else [body])
            host_header = self.headers.get("Host", f"127.0.0.1:{PORT}")
            proxy_base = f"http://{host_header}/api/stream"
            stream_key = stream_signing_key()
            signed = []
            for item in items:
                if not item or not isinstance(item, dict) or not item.get("url"):
                    continue
                signed_url = proxied_stream_url(proxy_base, stream_key, item["url"], item.get("referer", ""), origin=item.get("origin", ""))
                signed.append({**item, "signed_url": signed_url})
            self.send_json(200, {"success": True, "items": signed}, origin)
            return
        self.send_json(400, {"success": False, "error": "Unsupported action"}, origin)

    def handle_account(self, method, path):
        """/api/account/*: same answers as functions/api/account/[[path]].js. No CORS headers: only this site reads them."""
        body = None
        if method == "POST":
            length = int(self.headers.get("Content-Length") or 0)
            raw = self.rfile.read(min(length, 8192)) if length else b""
            body, error = local_accounts.parse_body(raw)
            if error:
                self.send_account_reply({"status": 413 if error == "too_large" else 400, "json": {"error": error}, "setCookie": None})
                return
        host = self.headers.get("Host") or "127.0.0.1:8787"
        result = local_accounts.handle_account({
            "method": method,
            "path": path[len("/api/account/"):],
            "body": body,
            "cookie": self.headers.get("Cookie") or "",
            "origin": self.headers.get("Origin"),
            "requestOrigin": f"http://{host}",
            "customHeader": self.headers.get("X-Tvzinha-Request"),
            "ip": self.client_address[0] if self.client_address else "",
            "now": int(time.time() * 1000),
            # Plain http here: a Secure cookie would be refused on a phone opening the LAN address
            "secure": False,
            "pepper": ACCOUNTS_PEPPER,
        }, local_accounts.local_database(), verify_captcha=verify_captcha)
        self.send_account_reply(result)

    def handle_sync(self, method):
        """/api/sync: same answers as functions/api/sync.js."""
        body = None
        if method == "POST":
            limit = local_sync.SYNC_LIMITS["bodyBytes"]
            length = int(self.headers.get("Content-Length") or 0)
            raw = self.rfile.read(min(length, limit + 1)) if length else b""
            body, error = local_accounts.parse_body(raw, limit)
            if error:
                self.send_account_reply({"status": 413 if error == "too_large" else 400, "json": {"error": error}, "setCookie": None})
                return
        host = self.headers.get("Host") or "127.0.0.1:8787"
        result = local_sync.handle_sync({
            "method": method,
            "body": body,
            "cookie": self.headers.get("Cookie") or "",
            "origin": self.headers.get("Origin"),
            "requestOrigin": f"http://{host}",
            "customHeader": self.headers.get("X-Tvzinha-Request"),
            "ip": self.client_address[0] if self.client_address else "",
            "now": int(time.time() * 1000),
            "secure": False,
        }, local_accounts.local_database())
        self.send_account_reply(result)

    def send_account_reply(self, result):
        self.send_response(result["status"])
        self.send_header("Content-Type", "application/json; charset=utf-8")
        if result.get("setCookie"):
            self.send_header("Set-Cookie", result["setCookie"])
        self.end_headers()
        self.wfile.write(json.dumps(result["json"]).encode("utf-8"))

    def send_json(self, status, payload, origin=None):
        body = payload if isinstance(payload, bytes) else json.dumps(payload).encode("utf-8")
        self.send_cors_headers(status, "application/json; charset=utf-8", origin=origin)
        self.end_headers()
        self.wfile.write(body)

    def handle_tmdb(self, params, origin=None):
        """/api/tmdb: same rules as functions/api/tmdb.js (kept in memory 30 min instead of the edge cache)."""
        if not is_allowed_origin(origin):
            self.send_response(403)
            self.send_header("Content-Type", "application/json; charset=utf-8")
            self.end_headers()
            self.wfile.write(b'{"error":"origin_forbidden"}')
            return
        if not TMDB_API_KEY:
            self.send_json(503, {"error": "tmdb_key_missing"}, origin)
            return
        path = (params.get("path") or [""])[0]
        target = tmdb_target(path, TMDB_API_KEY)
        if not target:
            self.send_json(400, {"error": "path_not_allowed"}, origin)
            return
        cached = TMDB_CACHE.get(path)
        if cached and time.time() - cached[0] < TMDB_CACHE_TTL_S:
            self.send_json(200, cached[1], origin)
            return
        try:
            req = urllib.request.Request(target, headers={"Accept": "application/json", "User-Agent": USER_AGENT})
            with urllib.request.urlopen(req, timeout=15) as res:
                body = res.read()
            TMDB_CACHE[path] = (time.time(), body)
            self.send_json(200, body, origin)
        except urllib.error.HTTPError as e:
            self.send_json(e.code, e.read() or b"{}", origin)
        except Exception:
            self.send_json(502, {"error": "tmdb_unreachable"}, origin)

    def handle_resolve(self, params, origin=None):
        host_header = self.headers.get("Host", f"127.0.0.1:{PORT}")
        proxy_base = f"http://{host_header}/api/stream"
        stream_key = stream_signing_key()

        action = params.get("action", [""])[0]
        if action == "sign":
            target_url = params.get("url", [""])[0]
            referer = params.get("referer", [""])[0]
            target_origin = params.get("target_origin", [""])[0]
            if not target_url:
                self.send_json(400, {"success": False, "error": "Missing url parameter"}, origin)
                return
            signed_url = proxied_stream_url(proxy_base, stream_key, target_url, referer, origin=target_origin)
            self.send_json(200, {"success": True, "signed_url": signed_url}, origin)
            return

        media_id = params.get("id", [""])[0]
        media_type = params.get("type", ["movie"])[0]
        season = int(params.get("season", ["1"])[0])
        episode = int(params.get("episode", ["1"])[0])
        lang = params.get("lang", ["sub" if media_type == "anime" else "dub"])[0]
        title_param = params.get("title", [""])[0]
        season_name_param = params.get("season_name", [""])[0]
        # TMDB original_name (e.g. Japanese): MyAnimeList knows it even when the pt-BR title is a translation
        original_title_param = params.get("original_title", [""])[0]
        year_param = params.get("year", [""])[0]
        year_value = int(year_param) if year_param.isdigit() else 0
        # The client sends both numberings; the server picks the one the chosen MAL entry uses
        absolute_param = params.get("absolute_episode", [""])[0]
        absolute_episode = int(absolute_param) if absolute_param.isdigit() else 0
        total_param = params.get("total_episodes", [""])[0]
        total_episodes = int(total_param) if total_param.isdigit() else 0
        mal_id = params.get("mal_id", [""])[0]
        imdb_id = params.get("imdb_id", [""])[0]
        quality_mode = params.get("quality_mode", ["balanced"])[0]
        # Identifiers go into other sites' addresses: digits only (IMDb: "tt" + digits)
        if (media_id and not re.fullmatch(r"\d{1,9}", media_id)) or (mal_id and not re.fullmatch(r"\d{1,9}", mal_id)) \
                or (imdb_id and not re.fullmatch(r"tt\d{1,10}", imdb_id)):
            self.send_json(400, {"success": False, "error": "Invalid media identifier"}, origin)
            return
        # aniskip_only=1: only the MyAnimeList entry and its episode number (skip times for anime played from another host)
        aniskip_only = params.get("aniskip_only", [""])[0] == "1"

        cache_key = f"{host_header}_{media_type}_{media_id}_{imdb_id}_{season}_{episode}_{lang}_{mal_id}_{title_param}_{original_title_param}_{year_value}_{absolute_episode}_{total_episodes}_{season_name_param}_{aniskip_only}"
        now = time.time()
        # Per-step durations exposed as a Server-Timing header (ms)
        timings = {}

        def timed(name, fn, *args, **kwargs):
            started = time.time()
            try:
                return fn(*args, **kwargs)
            finally:
                timings[name] = timings.get(name, 0) + (time.time() - started) * 1000

        if not media_id and not mal_id and not title_param:
            self.send_cors_headers(400, "application/json; charset=utf-8", origin=origin)
            self.end_headers()
            self.wfile.write(b'{"success":false,"error":"Missing required media identifier (id, mal_id, or title)"}')
            return

        if cache_key in RESOLVE_CACHE:
            cached_time, cached_res = RESOLVE_CACHE[cache_key]
            if now - cached_time < 60:
                self.send_cors_headers(200, "application/json; charset=utf-8", origin=origin)
                self.send_header("Server-Timing", 'cache;desc="hit"')
                self.end_headers()
                self.wfile.write(json.dumps(cached_res, ensure_ascii=False).encode("utf-8"))
                return

        result = None

        source_param = params.get("source", [""])[0]
        requested_source = source_param or ("anime_native" if (media_type == "anime" and lang == "sub") else "mgeb")

        # Route 1: Anime Subtitled via ZokoAnime
        if requested_source == "anime_native" or (media_type == "anime" and lang == "sub" and requested_source == "mgeb"):
            mal_ids = []
            if not mal_id and title_param:
                mal_ids = timed("mal", get_mal_candidates, title_param, original_title_param, season, season_name_param, year_value)
            elif mal_id:
                mal_ids = [mal_id]
            elif media_id:
                mal_ids = [media_id]

            # Entries tied for best are all tried before giving up (the first one may be missing on the stream host)
            zoko_data = None
            effective_episode = episode
            for candidate_id in mal_ids:
                candidate_episode = timed("span", pick_episode_number, candidate_id, season, episode, absolute_episode, total_episodes)
                data = timed("zoko", fetch_zoko, str(candidate_id), candidate_episode)
                if data and data.get("src"):
                    zoko_data = data
                    mal_id = candidate_id
                    effective_episode = candidate_episode
                    break

            if zoko_data and aniskip_only:
                result = {"success": True, "aniskip": {"mal_id": int(mal_id) if str(mal_id).isdigit() else None, "episode": effective_episode, "ready": True}}
            elif zoko_data:
                master_url = zoko_data["src"]
                stream_url = proxied_stream_url(proxy_base, stream_key, master_url, "https://zokoanime.video/")
                
                # Proxy URLs, keeping only Portuguese and English
                subtitles = normalize_subtitles([
                    {
                        "lang": s.get("lang", ""),
                        "label": s.get("label", ""),
                        "url": proxied_stream_url(proxy_base, stream_key, s.get("src", ""), "https://zokoanime.video/"),
                    }
                    for s in zoko_data.get("subtitles", [])
                ])

                zoko_source = timed("probe", probe_source, {
                    "label": "ZokoAnime",
                    "type": "hls",
                    "stream_url": stream_url,
                    "raw_url": master_url,
                    "headers": {
                        "Referer": "https://zokoanime.video/",
                        "Origin": "https://zokoanime.video",
                    },
                })
                if zoko_source["quality"]:
                    zoko_source["label"] = f"ZokoAnime [{zoko_source['quality']}p HLS]"

                result = {
                    "success": True,
                    "title": title_param or f"Anime Ep {episode}",
                    "category": "anime",
                    "audio": "subtitled",
                    "provider": "anime_native",
                    "primary_source": zoko_source,
                    "fallback_sources": [],
                    "subtitles": subtitles,
                    "aniskip": {
                        "mal_id": int(mal_id) if str(mal_id).isdigit() else None,
                        "episode": effective_episode,
                        "ready": True,
                    },
                }

        # Route 2: FenixFlix (PT-BR Dublado)
        if not result and requested_source == "fenixflix" and (media_id or imdb_id):
            fenix_data = timed("fenixflix", local_providers.fetch_fenixflix, media_id, imdb_id, media_type, season, episode, "dubbed")
            if fenix_data and fenix_data.get("sources"):
                parsed = []
                for s in fenix_data["sources"]:
                    raw_file = s["file"].strip()
                    referer = s.get("referer", "https://embedplayer2.xyz/")
                    is_mp4 = ".mp4" in raw_file and ("fontedecanais" in raw_file or "57lgoe65efxo71.com" in raw_file)
                    clean_url = re.sub(r'^http://', 'https://', raw_file).replace(':80/', '/') if is_mp4 else raw_file
                    stream_url = clean_url if is_mp4 else proxied_stream_url(proxy_base, stream_key, raw_file, referer)
                    is_hls = s.get("type") == "hls" or ".m3u8" in raw_file
                    parsed.append({
                        "label": s.get("label", f"FenixFlix {s.get('quality', 1080)}p"),
                        "type": "hls" if is_hls else "mp4",
                        "stream_url": stream_url,
                        "direct_url": raw_file if (not is_mp4 and is_hls and raw_file.startswith("https://")) else None,
                        "raw_url": clean_url,
                        "headers": {"Referer": referer},
                        "quality": s.get("quality", 1080)
                    })
                ranked = timed("probe", rank_sources_by_quality, parsed, lambda s: 90, media_type == "serie", is_dubbed=lang != "sub", quality_mode=quality_mode)
                result = {
                    "success": True,
                    "title": fenix_data.get("title") or title_param or ("Filme" if media_type == "movie" else f"Série T{season}E{episode}"),
                    "category": media_type,
                    "audio": "dubbed",
                    "provider": "fenixflix",
                    "primary_source": ranked[0],
                    "fallback_sources": ranked[1:],
                    "subtitles": [],
                    "aniskip": {"mal_id": int(mal_id) if str(mal_id).isdigit() else None, "episode": episode, "ready": bool(mal_id)}
                }



        # Route 5: Movy (Wecollege CDN)
        if not result and requested_source == "movy" and media_id:
            movy_data = timed("movy", local_providers.fetch_movy, media_id, media_type, season, episode, imdb_id)
            if movy_data and movy_data.get("sources"):
                parsed = [{
                    "label": s["label"],
                    "type": "hls",
                    "stream_url": proxied_stream_url(proxy_base, stream_key, s["file"], s["referer"]),
                    "direct_url": s["file"],
                    "raw_url": s["file"],
                    "headers": {"Referer": s["referer"]},
                    "quality": s.get("quality", 1080)
                } for s in movy_data["sources"]]
                result = {
                    "success": True,
                    "title": title_param or ("Filme" if media_type == "movie" else f"Série T{season}E{episode}"),
                    "category": media_type,
                    "audio": "original",
                    "provider": "movy",
                    "primary_source": parsed[0],
                    "fallback_sources": parsed[1:],
                    "subtitles": [],
                    "aniskip": {"mal_id": int(mal_id) if str(mal_id).isdigit() else None, "episode": episode, "ready": bool(mal_id)}
                }

        # Route 6: MGEB (Player Principal Atual)
        mgeb_episode_mismatch = [False]
        if not result and requested_source == "mgeb" and (media_id or imdb_id):
            mgeb_type = "serie" if media_type == "anime" else media_type
            given_imdb = imdb_id if (imdb_id and imdb_id.startswith("tt")) else None
            tmdb_id = media_id if (media_id and str(media_id).isdigit()) else None

            # MGEB answers by IMDb id and by TMDB id with different (rotating) source lists:
            # ask both in parallel, take the first with sources and merge the other if it arrives soon.
            # A numeric movie id may collide with a TV series (e.g. 1422 -> The Middle vs The Departed).
            def is_tv_collision(data):
                return media_type == "movie" and bool(re.search(r'[-–]\s*T\d+E\d+|S\d+E\d+|Epis[oó]dio|\bPiloto\b', data.get("title", ""), re.I))

            imdb_found = []

            def imdb_lookup_id():
                if not imdb_found:
                    imdb_found.append(given_imdb or (timed("tmdb", fetch_imdb_id, str(tmdb_id), mgeb_type) if tmdb_id else None))
                return imdb_found[0]

            def lookup_mgeb(s, e):
                def check_episode(data):
                    if data and mgeb_type == "serie" and not mgeb_episode_matches(data.get("title", ""), s, e):
                        print(f"[LocalServer] Rejected answer for another episode: {data.get('title')}", file=sys.stderr)
                        mgeb_episode_mismatch[0] = True
                        return None
                    return data

                def lookup_by_imdb():
                    tt = imdb_lookup_id()
                    return check_episode(fetch_mgeb(mgeb_type, tt, s, e)) if tt else None

                def lookup_by_id():
                    data = fetch_mgeb(mgeb_type, tmdb_id or media_id, s, e)
                    if data and is_tv_collision(data):
                        print(f"[LocalServer] Rejected TV series collision for movie: {data.get('title')}", file=sys.stderr)
                        return None
                    return check_episode(data)

                lookups = [lookup_by_imdb]
                if tmdb_id or (not given_imdb and media_id):
                    lookups.append(lookup_by_id)
                return first_then_merge(lookups, MGEB_MERGE_WINDOW_S)

            mgeb_data = timed("mgeb", lookup_mgeb, season, episode)
            mgeb_episode = (season, episode)
            # MGEB answered for another episode: the show may be one long season on TMDB and split on MGEB
            if not mgeb_data and mgeb_episode_mismatch[0] and tmdb_id and mgeb_type == "serie":
                mapped = map_merged_episode(timed("groups", fetch_season_groups, str(tmdb_id)), season, episode)
                if mapped and mapped != (season, episode):
                    mgeb_data = timed("mgeb2", lookup_mgeb, *mapped)
                    if mgeb_data:
                        mgeb_episode = mapped

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

                    final_stream_url = direct_clean_url if is_direct_mp4 else proxied_stream_url(proxy_base, stream_key, raw_file, referer)
                    source_type = s.get("type") or ("hls" if ".m3u8" in raw_file else "mp4")
                    # Every HLS segment through the proxy is one function call (~450 an hour of video). The player tries
                    # the host first and falls back to the proxy, so hosts that need their Referer still play
                    direct_url = raw_file if (not is_direct_mp4 and source_type == "hls" and re.match(r'^https://', raw_file, re.I)) else None

                    parsed_sources.append({
                        "label": s.get("label", f"Servidor {idx + 1}"),
                        "type": source_type,
                        "stream_url": final_stream_url,
                        "direct_url": direct_url,
                        "raw_url": direct_clean_url,
                        "headers": {"Referer": referer},
                    })

                def score_source(src):
                    url = src.get("raw_url", "").lower()
                    # Tier 1: Proven robust datacenter-safe HLS CDNs & Direct sanitized HTTPS MP4 (Score 95)
                    if ("cache/hls" in url or "peliculaplay.com" in url or "playspelis.com" in url or "flixlat.com" in url or "97bf1.com" in url
                            or "fontedecanais" in url or "57lgoe65efxo71.com" in url or "77zzhf54vdll71.com" in url):
                        return 95
                    # Tier 2: Standard generic HLS streams (Score 80)
                    if ".m3u8" in url:
                        return 80
                    # Tier 3: Fallback PlayerCDN / Worker mirrors (Score 60 - Preserved as safety net)
                    if "playercdn" in url or "workers.dev" in url or "powestream" in url:
                        return 60
                    # Tier 4: Other MP4 streams (Score 50)
                    if ".mp4" in url:
                        return 50
                    return 10

                # Best quality first; the host score only breaks ties between equal qualities
                ranked_sources = timed("probe", rank_sources_by_quality, parsed_sources, score_source, mgeb_type == "serie", is_dubbed=lang != "sub", quality_mode=quality_mode)
                primary = ranked_sources[0]
                fallbacks = ranked_sources[1:]

                result = {
                    "success": True,
                    "title": mgeb_data.get("title") or title_param or ("Filme" if media_type == "movie" else f"Série T{season}E{episode}"),
                    "category": media_type,
                    "audio": "subtitled" if lang == "sub" else "dubbed",
                    "primary_source": primary,
                    "fallback_sources": fallbacks,
                    "mgeb_episode": f"T{mgeb_episode[0]}E{mgeb_episode[1]}" if mgeb_type == "serie" else None,
                    "subtitles": [],
                    "aniskip": {
                        "mal_id": int(mal_id) if mal_id and str(mal_id).isdigit() else None,
                        "episode": episode,
                        "ready": bool(mal_id),
                    },
                }

        timings["total"] = (time.time() - now) * 1000
        server_timing = ", ".join(f"{k};dur={v:.0f}" for k, v in timings.items())
        if result:
            RESOLVE_CACHE[cache_key] = (now, result)
            self.send_cors_headers(200, "application/json; charset=utf-8", origin=origin)
            self.send_header("Server-Timing", server_timing)
            self.end_headers()
            self.wfile.write(json.dumps(result, ensure_ascii=False).encode("utf-8"))
        else:
            self.send_cors_headers(404, "application/json; charset=utf-8", origin=origin)
            self.send_header("Server-Timing", server_timing)
            self.end_headers()
            reason = ("anime_not_found" if media_type == "anime" and lang == "sub"
                      else "episode_mismatch" if mgeb_episode_mismatch[0] else "no_sources")
            self.wfile.write(json.dumps({"success": False, "error": "No direct streams resolved", "reason": reason, "fallback_recommended": True}).encode("utf-8"))

    def send_stream_headers(self, status, content_type):
        """CORS (casting receivers fetch from another origin) plus the headers that keep any answer from running
        as a page here. Upstream headers are never copied."""
        self.send_cors_headers(status, content_type)
        for name, value in STREAM_SAFETY_HEADERS.items():
            self.send_header(name, value)

    def send_stream_error(self, status, error, is_head=False):
        body = json.dumps({"error": error}).encode("utf-8")
        self.send_stream_headers(status, "application/json")
        self.end_headers()
        if not is_head:
            self.wfile.write(body)

    def handle_stream(self, params, is_head=False):
        target_url = params.get("url", [""])[0]
        referer = params.get("referer", [""])[0]
        origin = params.get("origin", [""])[0]

        # Only web addresses, and no line break that could add a header upstream
        if not is_http_url(target_url) or re.search(r"[\r\n]", referer + origin):
            self.send_stream_error(400, "bad_request", is_head)
            return
        # Only addresses this site made (signed by /api/resolve or by this proxy for a playlist's parts)
        signing_key = stream_signing_key()
        if not link_is_valid(signing_key, params, target_url, referer, origin):
            self.send_stream_error(403, "forbidden", is_head)
            return
        link_exp = int(params.get("exp", ["0"])[0]) if signing_key else None
        # Never this computer or the local network (Cloudflare refuses them by itself)
        if is_private_address(target_url):
            self.send_stream_error(403, "forbidden", is_head)
            return

        # Custom referer override or automatic provider detection
        if not referer:
            if "dramahot.top" in target_url or "zokoanime.video" in target_url:
                referer, origin = "https://zokoanime.video/", "https://zokoanime.video"
            elif "playercdn.workers.dev" in target_url or "embedplayer2.xyz" in target_url:
                referer, origin = "https://embedplayer2.xyz/", "https://embedplayer2.xyz"
            elif "googlevideo.com" in target_url or "blogger.com" in target_url:
                referer = "https://www.blogger.com/"
            elif "peliculaplay.com" in target_url:
                referer = "https://mgeb.top/"
            else:
                referer = "https://tvzinhaonline.pages.dev/"
        # The anime host checks Origin together with its Referer (the resolver's probe sends both)
        if not origin and "zokoanime" in referer:
            origin = "https://zokoanime.video"

        try:
            resp, final_url = fetch_upstream(target_url, referer, origin, self.headers.get("Range"), self.headers.get("Accept"))
        except urllib.error.HTTPError as e:
            # Upstream error: the status is kept (the player retries on it), the host's page is not passed on
            e.close()
            self.send_stream_headers(e.code, "text/plain; charset=utf-8")
            self.end_headers()
            if not is_head:
                self.wfile.write(b"upstream_error")
            return
        except Exception as e:
            print(f"[LocalServer] Stream upstream request failed for {target_url[:120]}: {e}", file=sys.stderr)
            self.send_stream_error(502, "upstream_failed", is_head)
            return
        if resp is None:
            self.send_stream_error(502, "upstream_failed", is_head)
            return

        with resp:
            content_type = (resp.headers.get("Content-Type", "") or "").lower()
            is_m3u8 = ".m3u8" in target_url or ".m3u8" in final_url or "mpegurl" in content_type
            is_vtt = ".vtt" in target_url or ".vtt" in final_url or "text/vtt" in content_type
            is_ok = 200 <= resp.status < 300

            # HLS playlist: rewrite relative and absolute paths (against the final address) so segments route through here
            if is_m3u8 and is_ok:
                if is_head:
                    self.send_stream_headers(resp.status, "application/vnd.apple.mpegurl; charset=utf-8")
                    self.end_headers()
                    return
                raw = read_capped(resp)
                if raw is None:
                    self.send_stream_error(502, "upstream_too_large")
                    return
                host_header = self.headers.get("Host", f"127.0.0.1:{PORT}")
                proxy_base = f"http://{host_header}/api/stream"

                def proxied(uri):
                    # The playlist's parts expire with the playlist
                    return proxied_stream_url(proxy_base, signing_key, urllib.parse.urljoin(final_url, uri), referer, exp=link_exp)

                rewritten_lines = []
                for line in raw.decode("utf-8", errors="ignore").split("\n"):
                    trimmed = line.strip()
                    if not trimmed:
                        rewritten_lines.append(line)
                    elif trimmed.startswith("#"):
                        # URI in tags (e.g., #EXT-X-KEY:METHOD=...,URI="...", #EXT-X-MAP:URI="...")
                        rewritten_lines.append(re.sub(r'URI=["\']([^"\']+)["\']', lambda m: f'URI="{proxied(m.group(1))}"', line))
                    else:
                        rewritten_lines.append(proxied(trimmed))
                body = "\n".join(rewritten_lines).encode("utf-8")
                self.send_stream_headers(resp.status, "application/vnd.apple.mpegurl; charset=utf-8")
                self.send_header("Content-Length", str(len(body)))
                self.end_headers()
                self.wfile.write(body)
                return

            # WebVTT subtitles: only harmless formatting tags reach the player
            if is_vtt and is_ok:
                if is_head:
                    self.send_stream_headers(resp.status, "text/vtt; charset=utf-8")
                    self.end_headers()
                    return
                raw = read_capped(resp)
                if raw is None:
                    self.send_stream_error(502, "upstream_too_large")
                    return
                body = clean_vtt(raw.decode("utf-8", errors="ignore")).encode("utf-8")
                self.send_stream_headers(resp.status, "text/vtt; charset=utf-8")
                self.send_header("Content-Length", str(len(body)))
                self.end_headers()
                self.wfile.write(body)
                return

            # Binary / segment stream (.ts, .m4s, .mp4): built from scratch, only the range headers come from upstream
            self.send_stream_headers(resp.status, stream_media_type(content_type, final_url))
            for name in ["Content-Length", "Content-Range", "Accept-Ranges"]:
                if resp.headers.get(name):
                    self.send_header(name, resp.headers[name])
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
    parser = argparse.ArgumentParser(description="Tvzinha Local Development Server")
    parser.add_argument("--lan", action="store_true", help="Listen on all network interfaces (0.0.0.0) for testing on phones/LAN")
    parser.add_argument("--port", type=int, default=PORT, help=f"Port to listen on (default: {PORT})")
    args = parser.parse_args()

    port = args.port
    host = "0.0.0.0" if args.lan else "127.0.0.1"
    server = ThreadedHTTPServer((host, port), DevAPIHandler)
    local_ip = get_local_ip()
    if args.lan:
        print(f"[Tvzinha Local Server] Running on ALL network interfaces (port {port}):")
        print(f" -> Localhost: http://localhost:{port}")
        print(f" -> Network (Wi-Fi/Mobile): http://{local_ip}:{port}")
    else:
        print(f"[Tvzinha Local Server] Running on LOCALHOST ONLY (port {port}):")
        print(f" -> Localhost: http://127.0.0.1:{port} (use --lan to enable phone/network access)")
    try:
        server.serve_forever()
    except KeyboardInterrupt:
        print("\nShutting down server.")
        server.server_close()

if __name__ == "__main__":
    run()
