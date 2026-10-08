/**
 * Tvzinha Online - Cloudflare Pages Function: /api/resolve
 * Unified Stream Resolver for Movies, Series, and Animes.
 * Extracts direct clean HLS (.m3u8) / MP4 streams from MGEB and ZokoAnime.
 */

const USER_AGENT = "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36";
const TMDB_API_KEY = "2dca580c2a14b55200e784d157207b4d";

/**
 * Fetches canonical IMDb ID (tt...) from TMDB for unambiguous movie resolution in MGEB.
 */
async function fetchImdbId(tmdbId) {
  try {
    const url = `https://api.themoviedb.org/3/movie/${tmdbId}?api_key=${TMDB_API_KEY}`;
    const res = await fetch(url, { headers: { "User-Agent": USER_AGENT } });
    if (res.ok) {
      const data = await res.json();
      if (data.imdb_id && String(data.imdb_id).startsWith("tt")) {
        return String(data.imdb_id);
      }
    }
  } catch (e) {
    // Graceful fallback
  }
  return null;
}

export async function onRequestOptions() {
  return new Response(null, {
    status: 204,
    headers: {
      "Access-Control-Allow-Origin": "*",
      "Access-Control-Allow-Methods": "GET, HEAD, OPTIONS",
      "Access-Control-Allow-Headers": "Range, Content-Type, Accept, User-Agent, Referer, Origin",
      "Access-Control-Max-Age": "86400",
    },
  });
}

/**
 * XOR decryption for ZokoAnime payload
 */
function xorDecrypt(base64Str, key = "otaku-embed-v1") {
  const binaryStr = atob(base64Str);
  const keyBytes = new TextEncoder().encode(key);
  const resultBytes = new Uint8Array(binaryStr.length);

  for (let i = 0; i < binaryStr.length; i++) {
    resultBytes[i] = binaryStr.charCodeAt(i) ^ keyBytes[i % keyBytes.length];
  }

  // Decode latin1 and unquote URI
  let latin1 = "";
  for (let i = 0; i < resultBytes.length; i++) {
    latin1 += String.fromCharCode(resultBytes[i]);
  }
  return decodeURIComponent(latin1);
}

/**
 * Resolves MGEB streams for Movies, Series, and Dubbed Anime
 */
async function resolveMgeb(type, id, season = 1, episode = 1) {
  const embedUrl = type === "movie" 
    ? `https://mgeb.top/embed/${id}` 
    : `https://mgeb.top/embed/serie/${id}/${season}/${episode}`;

  const headers = {
    "User-Agent": USER_AGENT,
    "Referer": "https://tvzinhaonline.pages.dev/",
    "Accept-Language": "pt-BR,pt;q=0.9,en-US;q=0.8",
  };

  for (let attempt = 0; attempt < 2; attempt++) {
    try {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 12000);

      const res = await fetch(embedUrl, {
        headers,
        signal: controller.signal,
      });
      clearTimeout(timeoutId);

      if (!res.ok) continue;
      const html = await res.text();

      const sourcesMatch = html.match(/var\s+sources\s*=\s*(\[.*?\]);/s);
      if (!sourcesMatch) continue;

      const rawSources = JSON.parse(sourcesMatch[1]);
      const titleMatch = html.match(/var\s+title\s*=\s*"(.*?)";/);
      const title = titleMatch ? titleMatch[1].replace(/\\\//g, "/") : "";

      return {
        title,
        sources: rawSources,
      };
    } catch (e) {
      // Retry once on handshake timeout
    }
  }

  return null;
}

/**
 * Resolves ZokoAnime stream for Subtitled Animes (1080p FHD HLS + Subtitles)
 */
async function resolveZoko(malId, episode = 1) {
  const url = `https://zokoanime.video/stream/mal/${malId}/${episode}/sub`;
  const res = await fetch(url, {
    headers: {
      "User-Agent": USER_AGENT,
      "Referer": "https://tvzinhaonline.pages.dev/",
    },
  });

  if (!res.ok) return null;
  const html = await res.text();

  const pMatch = html.match(/window\.__P\s*=\s*["']([^"']+)["']/);
  if (!pMatch) return null;

  try {
    const jsonStr = xorDecrypt(pMatch[1]);
    const payload = JSON.parse(jsonStr);
    return payload;
  } catch (e) {
    return null;
  }
}

/* ============================================================
 * QUALITY PROBING
 * Discovers the real resolution of each source so the player can rank
 * them by quality and offer a unified "Qualidade" menu.
 * ============================================================ */

const PROBE_TIMEOUT_MS = 3500;
const PROBE_MAX_SOURCES = 6;
const KIND_RANK = { "hls-multi": 0, "hls-single": 1, "mp4-range": 2, "mp4": 3, "unknown": 4 };

/**
 * Maps a frame size to a standard quality class (2160, 1440, 1080, 720, 480, 360, 240).
 * Width is considered too, so a 1920x800 cinemascope frame is still 1080p.
 */
function qualityClass(width, height) {
  const w = Number(width) || 0;
  const h = Number(height) || 0;
  const byW = w >= 3800 ? 2160 : w >= 2500 ? 1440 : w >= 1900 ? 1080 : w >= 1260 ? 720 : w >= 840 ? 480 : w >= 620 ? 360 : w > 0 ? 240 : 0;
  const byH = h >= 2000 ? 2160 : h >= 1400 ? 1440 : h >= 1000 ? 1080 : h >= 700 ? 720 : h >= 460 ? 480 : h >= 340 ? 360 : h > 0 ? 240 : 0;
  return Math.max(byW, byH) || null;
}

async function probeFetch(url, referer, range, maxBytes = 2 * 1024 * 1024) {
  const headers = { "User-Agent": USER_AGENT };
  if (referer) headers["Referer"] = referer;
  if (referer && referer.includes("zokoanime")) headers["Origin"] = "https://zokoanime.video";
  if (range) headers["Range"] = range;
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), PROBE_TIMEOUT_MS);
  try {
    const res = await fetch(url, { headers, signal: controller.signal });
    // Read at most maxBytes: some hosts ignore Range and send the whole file
    const chunks = [];
    let size = 0;
    if (res.body && maxBytes > 0) {
      const reader = res.body.getReader();
      while (size < maxBytes) {
        const { done, value } = await reader.read();
        if (done) break;
        chunks.push(value);
        size += value.length;
      }
      reader.cancel().catch(() => {});
    } else if (res.body) {
      res.body.cancel().catch(() => {});
    }
    const buf = new Uint8Array(size);
    let o = 0;
    for (const c of chunks) { buf.set(c, o); o += c.length; }
    return { status: res.status, contentRange: res.headers.get("Content-Range") || "", buf };
  } finally {
    clearTimeout(timeoutId);
  }
}

/** Reads an H.264 SPS NAL unit (header byte excluded) and returns its frame size. */
function parseH264Sps(nal) {
  const bytes = [];
  for (let i = 0; i < nal.length; i++) {
    // Strip emulation prevention bytes (00 00 03)
    if (i >= 2 && nal[i] === 3 && nal[i - 1] === 0 && nal[i - 2] === 0) continue;
    bytes.push(nal[i]);
  }
  let pos = 0;
  const u = (n) => {
    let v = 0;
    for (let i = 0; i < n; i++) {
      const byte = bytes[pos >> 3];
      if (byte === undefined) throw new Error("SPS overflow");
      v = (v << 1) | ((byte >> (7 - (pos & 7))) & 1);
      pos++;
    }
    return v;
  };
  const ue = () => {
    let zeros = 0;
    while (u(1) === 0) {
      if (++zeros > 31) throw new Error("SPS ue overflow");
    }
    return zeros ? ((1 << zeros) - 1) + u(zeros) : 0;
  };
  const se = () => {
    const k = ue();
    return k & 1 ? (k + 1) / 2 : -(k / 2);
  };

  const profile = u(8);
  u(16);
  ue();
  if ([100, 110, 122, 244, 44, 83, 86, 118, 128, 138, 139, 134, 135].includes(profile)) {
    const chroma = ue();
    if (chroma === 3) u(1);
    ue();
    ue();
    u(1);
    if (u(1)) {
      for (let i = 0; i < (chroma !== 3 ? 8 : 12); i++) {
        if (!u(1)) continue;
        const size = i < 6 ? 16 : 64;
        let last = 8, next = 8;
        for (let j = 0; j < size; j++) {
          if (next !== 0) next = (last + se() + 256) % 256;
          last = next === 0 ? last : next;
        }
      }
    }
  }
  ue();
  const pocType = ue();
  if (pocType === 0) {
    ue();
  } else if (pocType === 1) {
    u(1);
    se();
    se();
    const n = ue();
    for (let i = 0; i < n; i++) se();
  }
  ue();
  u(1);
  const widthMbs = ue() + 1;
  const heightMapUnits = ue() + 1;
  const frameMbsOnly = u(1);
  if (!frameMbsOnly) u(1);
  u(1);
  let cropL = 0, cropR = 0, cropT = 0, cropB = 0;
  if (u(1)) {
    cropL = ue(); cropR = ue(); cropT = ue(); cropB = ue();
  }
  return {
    width: widthMbs * 16 - (cropL + cropR) * 2,
    height: (2 - frameMbsOnly) * heightMapUnits * 16 - (cropT + cropB) * 2 * (2 - frameMbsOnly),
  };
}

/** Extracts the video frame size from the first bytes of an MPEG-TS segment. */
function parseTsResolution(buf) {
  let start = -1;
  for (let i = 0; i + 376 < buf.length && i < 8192; i++) {
    if (buf[i] === 0x47 && buf[i + 188] === 0x47 && buf[i + 376] === 0x47) { start = i; break; }
  }
  if (start < 0) return null;

  let pmtPid = -1, videoPid = -1, videoType = 0;
  const chunks = [];
  for (let p = start; p + 188 <= buf.length; p += 188) {
    if (buf[p] !== 0x47) break;
    const pusi = (buf[p + 1] & 0x40) !== 0;
    const pid = ((buf[p + 1] & 0x1f) << 8) | buf[p + 2];
    const afc = (buf[p + 3] >> 4) & 3;
    if (afc === 0 || afc === 2) continue;
    let off = p + 4;
    if (afc === 3) off += 1 + buf[off];
    if (off >= p + 188) continue;

    if (pid === 0 && pmtPid < 0) {
      if (pusi) off += 1 + buf[off];
      const secLen = ((buf[off + 1] & 0x0f) << 8) | buf[off + 2];
      const end = Math.min(off + 3 + secLen - 4, p + 188);
      for (let e = off + 8; e + 4 <= end; e += 4) {
        const program = (buf[e] << 8) | buf[e + 1];
        if (program !== 0) { pmtPid = ((buf[e + 2] & 0x1f) << 8) | buf[e + 3]; break; }
      }
    } else if (pid === pmtPid && videoPid < 0) {
      if (pusi) off += 1 + buf[off];
      const secLen = ((buf[off + 1] & 0x0f) << 8) | buf[off + 2];
      const end = Math.min(off + 3 + secLen - 4, p + 188);
      const progInfoLen = ((buf[off + 10] & 0x0f) << 8) | buf[off + 11];
      for (let e = off + 12 + progInfoLen; e + 5 <= end;) {
        const streamType = buf[e];
        const esPid = ((buf[e + 1] & 0x1f) << 8) | buf[e + 2];
        const esInfoLen = ((buf[e + 3] & 0x0f) << 8) | buf[e + 4];
        if (streamType === 0x1b || streamType === 0x24) { videoPid = esPid; videoType = streamType; break; }
        e += 5 + esInfoLen;
      }
    } else if (pid === videoPid) {
      if (pusi && buf[off] === 0 && buf[off + 1] === 0 && buf[off + 2] === 1) off += 9 + buf[off + 8];
      if (off < p + 188) chunks.push(buf.subarray(off, p + 188));
    }
  }
  // HEVC SPS parsing is not supported: resolution stays unknown
  if (videoType !== 0x1b || chunks.length === 0) return null;

  const total = chunks.reduce((n, c) => n + c.length, 0);
  const es = new Uint8Array(total);
  let o = 0;
  for (const c of chunks) { es.set(c, o); o += c.length; }

  for (let i = 0; i + 4 < es.length; i++) {
    if (es[i] === 0 && es[i + 1] === 0 && es[i + 2] === 1 && (es[i + 3] & 0x1f) === 7) {
      let end = es.length;
      for (let j = i + 4; j + 2 < es.length; j++) {
        if (es[j] === 0 && es[j + 1] === 0 && (es[j + 2] === 1 || es[j + 2] === 0)) { end = j; break; }
      }
      try {
        return parseH264Sps(es.subarray(i + 4, end));
      } catch (e) {
        return null;
      }
    }
  }
  return null;
}

function readBoxHeader(buf, off) {
  if (off + 8 > buf.length) return null;
  let size = ((buf[off] << 24) >>> 0) + (buf[off + 1] << 16) + (buf[off + 2] << 8) + buf[off + 3];
  const type = String.fromCharCode(buf[off + 4], buf[off + 5], buf[off + 6], buf[off + 7]);
  let header = 8;
  if (size === 1) {
    if (off + 16 > buf.length) return null;
    size = 0;
    for (let i = 0; i < 8; i++) size = size * 256 + buf[off + 8 + i];
    header = 16;
  }
  return { size, type, header };
}

/** Finds the largest track size declared in tkhd boxes inside a moov buffer. */
function parseMoovResolution(buf, moovStart) {
  let best = null;
  const walk = (start, end, depth) => {
    let off = start;
    while (off + 8 <= end) {
      const box = readBoxHeader(buf, off);
      if (!box || box.size < 8) return;
      const boxEnd = Math.min(off + box.size, end);
      if (box.type === "trak" && depth === 0) {
        walk(off + box.header, boxEnd, 1);
      } else if (box.type === "tkhd" && depth === 1) {
        const version = buf[off + 8];
        const wOff = off + (version === 1 ? 96 : 84);
        if (wOff + 8 <= buf.length) {
          const width = (((buf[wOff] << 24) >>> 0) + (buf[wOff + 1] << 16) + (buf[wOff + 2] << 8) + buf[wOff + 3]) / 65536;
          const height = (((buf[wOff + 4] << 24) >>> 0) + (buf[wOff + 5] << 16) + (buf[wOff + 6] << 8) + buf[wOff + 7]) / 65536;
          if (width > 0 && height > 0 && (!best || width * height > best.width * best.height)) {
            best = { width: Math.round(width), height: Math.round(height) };
          }
        }
      }
      off += box.size;
    }
  };
  const moov = readBoxHeader(buf, moovStart);
  if (!moov) return null;
  walk(moovStart + moov.header, Math.min(moovStart + moov.size, buf.length), 0);
  return best;
}

/** Reads the MP4 box layout with Range requests and returns { res, ranged }. */
async function probeMp4(url, referer) {
  const first = await probeFetch(url, referer, "bytes=0-131071", 131072);
  if (first.status >= 400) return { dead: true };
  const ranged = first.status === 206;
  let buf = first.buf;
  let base = 0;
  for (let hop = 0; hop < 4; hop++) {
    let off = 0;
    let moovAt = -1;
    let nextAbs = -1;
    while (off + 8 <= buf.length) {
      const box = readBoxHeader(buf, off);
      if (!box || box.size < 8) break;
      if (box.type === "moov") { moovAt = off; break; }
      if (off + box.size > buf.length) { nextAbs = base + off + box.size; break; }
      off += box.size;
    }
    if (moovAt >= 0) {
      return { res: parseMoovResolution(buf, moovAt), ranged };
    }
    if (nextAbs < 0 || !ranged) break;
    const next = await probeFetch(url, referer, `bytes=${nextAbs}-${nextAbs + 131071}`, 131072);
    if (next.status !== 206) break;
    buf = next.buf;
    base = nextAbs;
  }
  return { res: null, ranged };
}

/**
 * A segment is broken when a request for its start is answered with bytes from
 * the middle of the file (seen on some CDNs): players never get past it.
 */
function segmentStartsMidFile(resp) {
  if (resp.status !== 206) return false;
  const m = /bytes\s+(\d+)-/i.exec(resp.contentRange);
  return Boolean(m && Number(m[1]) !== 0);
}

/** Checks the first TS segment of a media playlist and reads its frame size when asked. */
async function probeFirstSegment(playlistUrl, text, referer, readResolution) {
  if (text.includes("#EXT-X-MAP")) return { broken: false, res: null };
  const segLine = text.split(/\r?\n/).find(l => l.trim() && !l.startsWith("#"));
  if (!segLine) return { broken: false, res: null };
  const segUrl = new URL(segLine.trim(), playlistUrl).toString();
  const seg = readResolution
    ? await probeFetch(segUrl, referer, "bytes=0-131071", 131072)
    : await probeFetch(segUrl, referer, "bytes=0-1023", 0);
  if (seg.status >= 400) return { broken: true, res: null };
  return {
    broken: segmentStartsMidFile(seg),
    res: readResolution ? parseTsResolution(seg.buf) : null,
  };
}

/**
 * Probes an HLS playlist: variants of a master (plus a sanity check of the first
 * segment), or the first TS segment of a media playlist for its frame size.
 */
async function probeHls(url, referer) {
  const first = await probeFetch(url, referer);
  if (first.status >= 400) return { dead: true };
  const text = new TextDecoder().decode(first.buf);
  if (!text.trimStart().startsWith("#EXTM3U")) return { qualities: [] };

  if (text.includes("#EXT-X-STREAM-INF")) {
    const qualities = [];
    for (const m of text.matchAll(/#EXT-X-STREAM-INF:([^\n\r]*)/g)) {
      const res = m[1].match(/RESOLUTION=(\d+)x(\d+)/i);
      const q = res ? qualityClass(res[1], res[2]) : null;
      if (q && !qualities.includes(q)) qualities.push(q);
    }
    const variants = (text.match(/#EXT-X-STREAM-INF/g) || []).length;
    let broken = false;
    try {
      const variantLine = text.split(/\r?\n/).find(l => l.trim() && !l.startsWith("#"));
      if (variantLine) {
        const variantUrl = new URL(variantLine.trim(), url).toString();
        const media = await probeFetch(variantUrl, referer);
        if (media.status < 400) {
          broken = (await probeFirstSegment(variantUrl, new TextDecoder().decode(media.buf), referer, false)).broken;
        }
      }
    } catch (e) {
      // The variant check is best effort
    }
    return { qualities, multi: variants > 1, broken };
  }

  // Media playlist: read the frame size from the first segment (fMP4 segments are skipped)
  const seg = await probeFirstSegment(url, text, referer, true);
  const q = seg.res ? qualityClass(seg.res.width, seg.res.height) : null;
  return { qualities: q ? [q] : [], broken: seg.broken };
}

/**
 * Adds quality metadata to a source: quality (top class), qualities (desc),
 * kind (hls-multi | hls-single | mp4-range | mp4 | unknown) and alive.
 */
async function probeSource(src) {
  const isHls = src.type === "hls" || (src.raw_url || "").includes(".m3u8");
  const referer = src.headers ? src.headers.Referer : "";
  const isProxied = (src.stream_url || "").includes("/api/stream");
  let qualities = [];
  let kind = "unknown";
  let alive = true;
  try {
    if (isHls) {
      const r = await probeHls(src.raw_url, referer);
      if (r.dead) {
        alive = !isProxied;
      } else {
        qualities = r.qualities;
        kind = r.multi ? "hls-multi" : "hls-single";
        // A broken first segment stalls playback: keep it only as a last resort
        if (r.broken) alive = false;
      }
    } else {
      const r = await probeMp4(src.raw_url, referer);
      if (r.dead) {
        alive = !isProxied;
      } else {
        const q = r.res ? qualityClass(r.res.width, r.res.height) : null;
        qualities = q ? [q] : [];
        kind = r.ranged ? "mp4-range" : "mp4";
      }
    }
  } catch (e) {
    // Timeouts and network errors leave the source as unknown but playable
  }
  qualities.sort((a, b) => b - a);
  return { ...src, quality: qualities[0] || null, qualities, kind, alive };
}

/**
 * Re-hosting mirrors (playercdn/workers.dev/powestream) serve a synthetic "FirePlayer"
 * master that always announces 360p + 720p whatever the real picture is (CAM copies
 * included), so at equal declared quality they lose to every other source.
 */
function isMirrorSource(src) {
  const u = (src.raw_url || "").toLowerCase();
  return u.includes("playercdn") || u.includes("workers.dev") || u.includes("powestream");
}

/** Probes sources in parallel (capped) and sorts them best-first. */
async function rankSourcesByQuality(sources, tieBreaker = () => 0) {
  const probed = await Promise.all(sources.map((s, i) => (
    i < PROBE_MAX_SOURCES ? probeSource(s) : Promise.resolve({ ...s, quality: null, qualities: [], kind: "unknown", alive: true })
  )));
  return probed
    .map((s, i) => ({ s, i }))
    .sort((a, b) => (
      (Number(b.s.alive) - Number(a.s.alive)) ||
      ((b.s.quality || 0) - (a.s.quality || 0)) ||
      (Number(isMirrorSource(a.s)) - Number(isMirrorSource(b.s))) ||
      (KIND_RANK[a.s.kind] - KIND_RANK[b.s.kind]) ||
      (tieBreaker(b.s) - tieBreaker(a.s)) ||
      (a.i - b.i)
    ))
    .map(x => x.s);
}

/**
 * Fetches MyAnimeList ID from title via fast prefix search or public Jikan API with season and arc awareness
 */
async function getMalIdFromTitle(title, season = 1, seasonName = "") {
  const cleanTitle = title.replace(/\(.*?\)|\[.*?\]/g, '').trim();

  let cleanSname = "";
  if (seasonName) {
    const snameCand = seasonName.replace(/^(Temporada|Season)\s*\d+[:\-]?\s*/i, '').trim();
    if (!["especiais", "specials", "temporada", "season", ""].includes(snameCand.toLowerCase()) && snameCand.length > 2) {
      cleanSname = snameCand;
    }
  }

  const queries = [];
  if (cleanSname) {
    queries.push({ q: `${cleanTitle} ${cleanSname}`, priority: 50 });
    queries.push({ q: cleanSname, priority: 40 });
  }

  if (season > 1) {
    queries.push({ q: `${cleanTitle} Season ${season}`, priority: 35 });
    queries.push({ q: `${cleanTitle} Part ${season}`, priority: 35 });
    const suffix = season === 2 ? "nd" : season === 3 ? "rd" : "th";
    queries.push({ q: `${cleanTitle} ${season}${suffix} Season`, priority: 30 });
  }

  queries.push({ q: cleanTitle, priority: 10 });

  const candidates = [];
  const seen = new Set();

  for (const { q, priority } of queries) {
    try {
      const searchUrl = `https://myanimelist.net/search/prefix.json?type=anime&keyword=${encodeURIComponent(q.trim())}`;
      const res = await fetch(searchUrl, {
        headers: { "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64)" },
      });
      if (res.ok) {
        const data = await res.json();
        const items = (data.categories || []).flatMap(c => c.type === 'anime' ? (c.items || []) : []);
        for (let idx = 0; idx < Math.min(items.length, 6); idx++) {
          const it = items[idx];
          if (it.id && !seen.has(it.id)) {
            seen.add(it.id);
            const rankBonus = Math.max(0, 15 - idx * 3);
            candidates.push({ item: it, baseScore: priority + rankBonus });
          }
        }
      }
    } catch (e) {}

    if (candidates.length >= 12) break;
  }

  if (candidates.length === 0) {
    // Fallback to Public Jikan API
    try {
      const jikanQuery = `${cleanTitle} ${cleanSname}`.trim();
      const searchUrl = `https://api.jikan.moe/v4/anime?q=${encodeURIComponent(jikanQuery)}&limit=1`;
      const res = await fetch(searchUrl, {
        headers: { "User-Agent": USER_AGENT },
      });
      if (res.ok) {
        const data = await res.json();
        if (data.data && data.data.length > 0) {
          return data.data[0].mal_id;
        }
      }
    } catch (e) {}
    return null;
  }

  if (season === 1 && !cleanSname) {
    return candidates[0].item.id;
  }

  candidates.sort((a, b) => {
    const scoreA = calculateItemScore(a.item, a.baseScore, cleanSname, season);
    const scoreB = calculateItemScore(b.item, b.baseScore, cleanSname, season);
    return scoreB - scoreA;
  });

  return candidates[0].item.id;
}

function calculateItemScore(cand, baseScore, cleanSname, season) {
  const cName = (cand.name || "").toLowerCase();
  const payload = cand.payload || {};
  const mtype = String(payload.media_type || "").toUpperCase();
  let pts = baseScore;

  if (["TV", "ONA"].includes(mtype)) {
    pts += 40;
  } else if (["SPECIAL", "TV SPECIAL", "OVA", "MOVIE"].includes(mtype)) {
    pts -= 35;
  }

  // Heavy penalty for recaps, summaries, PVs, pilots
  if (["pilot", "kanketsu-hen", "recap", "summary", "preview", "remix", "music", "special"].some(bad => cName.includes(bad))) {
    pts -= 60;
  }

  if (cleanSname) {
    const sWords = cleanSname.toLowerCase().match(/\b[a-z]{3,}\b/g) || [];
    const matches = sWords.filter(w => cName.includes(w)).length;
    if (matches > 0) {
      pts += (matches * 25);
    }
  }

  const seasonPatterns = [
    new RegExp(`\\bpart\\s*${season}\\b`, 'i'),
    new RegExp(`\\bseason\\s*${season}\\b`, 'i'),
    new RegExp(`\\b${season}(?:st|nd|rd|th)\\s*season\\b`, 'i'),
    new RegExp(`\\b${season}\\b`, 'i'),
  ];
  for (const pat of seasonPatterns) {
    if (pat.test(cName)) {
      pts += 25;
      break;
    }
  }

  return pts;
}

export async function onRequestGet(context) {
  const { request } = context;
  const urlObj = new URL(request.url);

  const id = urlObj.searchParams.get("id");
  const type = urlObj.searchParams.get("type") || "movie"; // 'movie' | 'serie' | 'anime'
  const season = parseInt(urlObj.searchParams.get("season") || "1", 10);
  const episode = parseInt(urlObj.searchParams.get("episode") || "1", 10);
  const lang = urlObj.searchParams.get("lang") || (type === "anime" ? "sub" : "dub");
  const titleParam = urlObj.searchParams.get("title") || "";
  const seasonNameParam = urlObj.searchParams.get("season_name") || "";
  let malId = urlObj.searchParams.get("mal_id");

  if (!id && !malId && !titleParam) {
    return new Response(JSON.stringify({ success: false, error: "Missing required media identifier (id, mal_id, or title)" }), {
      status: 400,
      headers: { "Content-Type": "application/json", "Access-Control-Allow-Origin": "*" },
    });
  }

  const proxyBase = `${urlObj.origin}/api/stream`;
  let result = null;

  // ROTA 1: Anime Legendado (ZokoAnime)
  if (type === "anime" && lang === "sub") {
    if (!malId && titleParam) {
      malId = await getMalIdFromTitle(titleParam, season, seasonNameParam);
    } else if (!malId && id) {
      // If numeric ID is passed for anime, test as MAL ID or title
      malId = id;
    }

    if (malId) {
      const zokoData = await resolveZoko(malId, episode);
      if (zokoData && zokoData.src) {
        const streamUrl = `${proxyBase}?url=${encodeURIComponent(zokoData.src)}&referer=${encodeURIComponent("https://zokoanime.video/")}`;
        
        // Build subtitles list with proxy URLs
        const subtitles = (zokoData.subtitles || []).map(s => ({
          lang: s.lang || "pt-BR",
          label: s.label || "Legenda",
          default: Boolean(s.default),
          url: `${proxyBase}?url=${encodeURIComponent(s.src)}&referer=${encodeURIComponent("https://zokoanime.video/")}`,
        }));

        const zokoSource = await probeSource({
          label: "ZokoAnime",
          type: "hls",
          stream_url: streamUrl,
          raw_url: zokoData.src,
          headers: {
            "Referer": "https://zokoanime.video/",
            "Origin": "https://zokoanime.video",
          },
        });
        if (zokoSource.quality) zokoSource.label = `ZokoAnime [${zokoSource.quality}p HLS]`;

        result = {
          success: true,
          title: titleParam || `Anime Ep ${episode}`,
          category: "anime",
          audio: "subtitled",
          primary_source: zokoSource,
          fallback_sources: [],
          subtitles,
          aniskip: {
            mal_id: parseInt(malId, 10),
            episode,
            ready: true,
          },
        };
      }
    }
  }

  // ROTA 2: Filmes, Séries ou Anime Dublado (MGEB)
  const imdbId = urlObj.searchParams.get("imdb_id");
  if (!result && (id || imdbId)) {
    const mgebType = type === "anime" ? "serie" : type;
    let targetId = (imdbId && imdbId.startsWith("tt")) ? imdbId : id;

    // For movies: resolve canonical IMDb ID if target is numeric to eliminate TV series collisions (e.g. 1422 -> The Middle vs The Departed)
    if (type === "movie" && targetId && /^\d+$/.test(targetId)) {
      const resolvedImdb = await fetchImdbId(targetId);
      if (resolvedImdb) {
        targetId = resolvedImdb;
      }
    }

    let mgebData = await resolveMgeb(mgebType, targetId, season, episode);

    // Sanity check: If movie resolution returned a TV episode title, fallback to IMDb resolution or discard collision
    if (mgebData && type === "movie") {
      const retTitle = mgebData.title || "";
      let isTvCollision = /[-–]\s*T\d+E\d+|S\d+E\d+|Epis[oó]dio|\bPiloto\b/i.test(retTitle);
      if (isTvCollision && !String(targetId).startsWith("tt")) {
        const resolvedImdb = await fetchImdbId(id);
        if (resolvedImdb && resolvedImdb !== targetId) {
          const retryData = await resolveMgeb("movie", resolvedImdb);
          if (retryData && retryData.sources && retryData.sources.length > 0) {
            mgebData = retryData;
            targetId = resolvedImdb;
            isTvCollision = false;
          }
        }
      }

      if (isTvCollision) {
        mgebData = null;
      }
    }

    if (mgebData && mgebData.sources && mgebData.sources.length > 0) {
      const parsedSources = mgebData.sources.map((s, idx) => {
        let rawFile = (s.file || "").trim();
        // Normalize any relative path artifacts from MGEB embed
        rawFile = rawFile.replace("mgeb.top/../", "mgeb.top/").replace("mgeb.top/..", "mgeb.top");

        const isDirectMp4 = rawFile.includes(".mp4") && (rawFile.includes("fontedecanais") || rawFile.includes("57lgoe65efxo71.com"));
        let directCleanUrl = rawFile;
        if (isDirectMp4) {
          // Explicitly convert to secure HTTPS and strip port :80 to prevent SSL handshake errors
          directCleanUrl = rawFile.replace(/^http:\/\//i, "https://").replace(/:80\//, "/");
        }

        let referer = "https://embedplayer2.xyz/";
        if (rawFile.includes("peliculaplay.com") || rawFile.includes("cache/hls") || rawFile.includes("mgeb.top")) {
          referer = "https://mgeb.top/";
        }
        
        // Direct MP4 streams bypass datacenter proxy to eliminate Cloudflare WAF 403 blocks and enable native HTTP 206 byte-ranges
        const finalStreamUrl = isDirectMp4
          ? directCleanUrl
          : `${proxyBase}?url=${encodeURIComponent(rawFile)}&referer=${encodeURIComponent(referer)}`;

        return {
          label: s.label || `Servidor ${idx + 1}`,
          type: s.type || (rawFile.includes(".m3u8") ? "hls" : "mp4"),
          stream_url: finalStreamUrl,
          raw_url: directCleanUrl,
          headers: {
            "Referer": referer,
          },
        };
      });

      function scoreSource(src) {
        const u = (src.raw_url || "").toLowerCase();
        // Tier 1: Proven robust datacenter-safe HLS CDNs (Score 95)
        if (u.includes("cache/hls") || u.includes("peliculaplay.com") || u.includes("playspelis.com") || u.includes("flixlat.com") || u.includes("97bf1.com")) {
          return 95;
        }
        // Tier 2: Direct sanitized HTTPS MP4 (Score 90 - Fast, zero-WAF, native seeking)
        if (u.includes("fontedecanais") || u.includes("57lgoe65efxo71.com")) {
          return 90;
        }
        // Tier 3: Standard generic HLS streams (Score 80)
        if (u.includes(".m3u8")) {
          return 80;
        }
        // Tier 4: Fallback PlayerCDN / Worker mirrors (Score 60 - Preserved as safety net)
        if (u.includes("playercdn") || u.includes("workers.dev") || u.includes("powestream")) {
          return 60;
        }
        // Tier 5: Other MP4 streams (Score 50)
        if (u.includes(".mp4")) {
          return 50;
        }
        return 10;
      }

      // Best quality first; the host score only breaks ties between equal qualities
      const rankedSources = await rankSourcesByQuality(parsedSources, scoreSource);
      const primary = rankedSources[0];
      const fallbacks = rankedSources.slice(1);

      result = {
        success: true,
        title: mgebData.title || titleParam || (type === "movie" ? "Filme" : `Série T${season}E${episode}`),
        category: type,
        audio: lang === "sub" ? "subtitled" : "dubbed",
        primary_source: primary,
        fallback_sources: fallbacks,
        subtitles: [],
        aniskip: {
          mal_id: malId ? parseInt(malId, 10) : null,
          episode,
          ready: Boolean(malId),
        },
      };
    }
  }

  if (result) {
    return new Response(JSON.stringify(result), {
      status: 200,
      headers: {
        "Content-Type": "application/json; charset=utf-8",
        "Access-Control-Allow-Origin": "*",
        "Cache-Control": "public, max-age=1800",
      },
    });
  }

  return new Response(JSON.stringify({
    success: false,
    error: "No direct streams resolved for the requested title.",
    fallback_recommended: true,
  }), {
    status: 404,
    headers: {
      "Content-Type": "application/json",
      "Access-Control-Allow-Origin": "*",
    },
  });
}
