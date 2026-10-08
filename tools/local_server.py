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


def mgeb_source_key(source):
    """Same file served over http/https or :80 counts once."""
    url = str(source.get("file", "")).strip()
    url = re.sub(r"^https?://", "", url, flags=re.I).replace(":80/", "/")
    return url.split("?")[0]


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
PROBE_BUDGET_S = 2.5
KIND_RANK = {"hls-multi": 0, "hls-single": 1, "mp4-range": 2, "mp4": 3, "unknown": 4}
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


def probe_mp4(url, referer):
    """Reads the MP4 box layout with Range requests. Returns dict(res, ranged) or dict(dead)."""
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
            return {"res": parse_moov_resolution(buf, moov_at), "ranged": ranged}
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

        # Check the top variant: its first segment must start at byte 0, and its real
        # frame size replaces a declared resolution that is not there
        broken = False
        try:
            candidates = [v for v in variants if v["uri"]]
            candidates.sort(key=lambda v: (-(v["quality"] or 0), -v["bandwidth"]))
            if candidates:
                top = candidates[0]
                variant_url = urllib.parse.urljoin(url, top["uri"])
                v_status, v_body, _ = probe_fetch(variant_url, referer)
                if v_status < 400:
                    seg = probe_first_segment(variant_url, v_body.decode("utf-8", errors="ignore"), referer, True)
                    broken = seg["broken"]
                    measured = quality_class(*seg["res"]) if seg["res"] else None
                    if measured and top["quality"] and measured != top["quality"]:
                        qualities = [measured] + [q for q in qualities if q < measured]
        except Exception:
            pass  # The variant check is best effort
        return {"qualities": qualities, "multi": len(variants) > 1, "broken": broken, "synthetic": synthetic}

    # Media playlist: read the frame size from the first segment (fMP4 segments are skipped)
    seg = probe_first_segment(url, text, referer, True)
    q = quality_class(*seg["res"]) if seg["res"] else None
    return {"qualities": [q] if q else [], "broken": seg["broken"]}


def probe_source(src):
    """Adds quality, qualities, kind and alive to a source dict (returns a new dict)."""
    raw = src.get("raw_url", "")
    is_hls = src.get("type") == "hls" or ".m3u8" in raw
    referer = (src.get("headers") or {}).get("Referer", "")
    is_proxied = "/api/stream" in src.get("stream_url", "")
    qualities, kind, alive, synthetic = [], "unknown", True, False
    try:
        r = probe_hls(raw, referer) if is_hls else probe_mp4(raw, referer)
        if r.get("dead"):
            alive = not is_proxied
        elif is_hls:
            qualities = r["qualities"]
            kind = "hls-multi" if r.get("multi") else "hls-single"
            synthetic = bool(r.get("synthetic"))
            # A broken first segment stalls playback: keep it only as a last resort
            if r.get("broken"):
                alive = False
        else:
            q = quality_class(*r["res"]) if r.get("res") else None
            qualities = [q] if q else []
            kind = "mp4-range" if r.get("ranged") else "mp4"
    except Exception as e:
        # Timeouts and network errors leave the source as unknown but playable
        print(f"[LocalServer] Probe failed for {raw[:80]}: {e}", file=sys.stderr)
    qualities = sorted(qualities, reverse=True)
    return {**src, "quality": qualities[0] if qualities else None, "qualities": qualities, "kind": kind,
            "alive": alive, "synthetic": synthetic, "probed": True}


def is_mirror_source(src):
    """Re-hosting mirrors serve a synthetic "FirePlayer" master that always announces 360p + 720p
    whatever the real picture is (CAM copies included), so at equal declared quality they lose."""
    url = src.get("raw_url", "").lower()
    return "playercdn" in url or "workers.dev" in url or "powestream" in url


def is_low_trust_source(src):
    """Low trust: synthetic master, or a known re-hosting mirror."""
    return bool(src.get("synthetic")) or is_mirror_source(src)


def is_trusted_top_source(src):
    """A measured, healthy 1080p+ HLS from a trusted host: no need to wait for the others."""
    return (src.get("probed") and src.get("alive") and (src.get("quality") or 0) >= 1080
            and src.get("kind", "").startswith("hls") and not is_low_trust_source(src))


def rank_sources_by_quality(sources, tie_breaker=lambda s: 0):
    """Probes sources in parallel within PROBE_BUDGET_S and sorts them best-first.
    Returns early when a trusted 1080p HLS is confirmed; sources not measured in
    time stay "unknown" and fall back to kind/host order."""
    from concurrent.futures import ThreadPoolExecutor, wait, FIRST_COMPLETED
    results = [{**s, "quality": None, "qualities": [], "kind": "unknown", "alive": True,
                "synthetic": False, "probed": False} for s in sources]
    to_probe = sources[:PROBE_MAX_SOURCES]
    if to_probe:
        pool = ThreadPoolExecutor(max_workers=len(to_probe))
        futures = {pool.submit(probe_source, src): i for i, src in enumerate(to_probe)}
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
            if trusted:
                break
        pool.shutdown(wait=False, cancel_futures=True)
    indexed = list(enumerate(results))
    indexed.sort(key=lambda x: (
        -int(x[1]["alive"]),
        -(x[1]["quality"] or 0),
        int(is_low_trust_source(x[1])),
        KIND_RANK[x[1]["kind"]],
        -tie_breaker(x[1]),
        x[0],
    ))
    return [s for _, s in indexed]


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
            elif path == "/__dev/clear-cache":
                # Local-only helper for tools/player_benchmark.mjs (measures cold resolves)
                RESOLVE_CACHE.clear()
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
        # Per-step durations exposed as a Server-Timing header (ms)
        timings = {}

        def timed(name, fn, *args):
            started = time.time()
            try:
                return fn(*args)
            finally:
                timings[name] = timings.get(name, 0) + (time.time() - started) * 1000

        if cache_key in RESOLVE_CACHE:
            cached_time, cached_res = RESOLVE_CACHE[cache_key]
            if now - cached_time < 1800:
                self.send_cors_headers(200, "application/json; charset=utf-8")
                self.send_header("Server-Timing", 'cache;desc="hit"')
                self.end_headers()
                self.wfile.write(json.dumps(cached_res, ensure_ascii=False).encode("utf-8"))
                return

        result = None

        # Route 1: Anime Subtitled via ZokoAnime
        if media_type == "anime" and lang == "sub":
            if not mal_id and title_param:
                mal_id = timed("mal", fetch_mal_id_from_title, title_param, season, season_name_param)
            elif not mal_id and media_id:
                mal_id = media_id

            if mal_id:
                zoko_data = timed("zoko", fetch_zoko, str(mal_id), episode)
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
                        "primary_source": zoko_source,
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
            given_imdb = imdb_id if (imdb_id and imdb_id.startswith("tt")) else None
            tmdb_id = media_id if (media_id and str(media_id).isdigit()) else None

            # MGEB answers by IMDb id and by TMDB id with different (rotating) source lists:
            # ask both in parallel, take the first with sources and merge the other if it arrives soon.
            # A numeric movie id may collide with a TV series (e.g. 1422 -> The Middle vs The Departed).
            def is_tv_collision(data):
                return media_type == "movie" and bool(re.search(r'[-–]\s*T\d+E\d+|S\d+E\d+|Epis[oó]dio|\bPiloto\b', data.get("title", ""), re.I))

            def lookup_by_imdb():
                tt = given_imdb or (timed("tmdb", fetch_imdb_id, str(tmdb_id), mgeb_type) if tmdb_id else None)
                return fetch_mgeb(mgeb_type, tt, season, episode) if tt else None

            def lookup_by_id():
                data = fetch_mgeb(mgeb_type, tmdb_id or media_id, season, episode)
                if data and is_tv_collision(data):
                    print(f"[LocalServer] Rejected TV series collision for movie: {data.get('title')}", file=sys.stderr)
                    return None
                return data

            lookups = [lookup_by_imdb]
            if tmdb_id or (not given_imdb and media_id):
                lookups.append(lookup_by_id)
            mgeb_data = timed("mgeb", first_then_merge, lookups, MGEB_MERGE_WINDOW_S)

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

                # Best quality first; the host score only breaks ties between equal qualities
                ranked_sources = timed("probe", rank_sources_by_quality, parsed_sources, score_source)
                primary = ranked_sources[0]
                fallbacks = ranked_sources[1:]

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

        timings["total"] = (time.time() - now) * 1000
        server_timing = ", ".join(f"{k};dur={v:.0f}" for k, v in timings.items())
        if result:
            RESOLVE_CACHE[cache_key] = (now, result)
            self.send_cors_headers(200, "application/json; charset=utf-8")
            self.send_header("Server-Timing", server_timing)
            self.end_headers()
            self.wfile.write(json.dumps(result, ensure_ascii=False).encode("utf-8"))
        else:
            self.send_cors_headers(404, "application/json; charset=utf-8")
            self.send_header("Server-Timing", server_timing)
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
