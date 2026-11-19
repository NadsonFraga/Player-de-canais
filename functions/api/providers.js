/**
 * Tvzinha Online - Multi-Provider Native Stream Extractors for /api/resolve
 * Implements FenixFlix multi-cluster stream aggregator for Stremio HTTP backends.
 */

const USER_AGENT = "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/130.0.0.0 Safari/537.36";

export const STREMIO_FENIX_ENDPOINTS = [
  "https://fenixflix.fenixhub.online"
];

function cleanEmojis(text) {
  return String(text || "")
    .replace(/[\u{1F600}-\u{1F64F}\u{1F300}-\u{1F5FF}\u{1F680}-\u{1F6FF}\u{1F1E0}-\u{1F1FF}\u{2600}-\u{27BF}\u{FE00}-\u{FE0F}\u{1F900}-\u{1F9FF}\u{1FA70}-\u{1FAFF}]/gu, "")
    .replace(/\s+/g, " ")
    .trim();
}

function extractClusterName(title) {
  const clean = cleanEmojis(title);
  const m = clean.match(/\b(Zeus|Badger|Hypex|Figgs|Hydra|Apollo|Ares|Thor|Odin|Zunder|Hollymovies)\b/i);
  return m ? m[1].charAt(0).toUpperCase() + m[1].slice(1).toLowerCase() : "";
}

/* ============================================================
 * 1. FENIXFLIX (PT-BR Dublado & Subtitled Multi-Cluster Aggregator)
 * ============================================================ */
export async function resolveFenixFlix({ id, imdbId, type, season = 1, episode = 1, audio = "dubbed" }) {
  const isSeries = type === "series" || type === "serie" || type === "tv" || type === "anime";
  const resolvedImdbId = await Promise.resolve(imdbId).catch(() => null);
  const queryCandidates = [];
  if (resolvedImdbId && String(resolvedImdbId).startsWith("tt")) {
    queryCandidates.push(String(resolvedImdbId));
  }
  if (id) {
    const rawId = String(id);
    queryCandidates.push(rawId.startsWith("tmdb:") ? rawId : `tmdb:${rawId}`);
  }

  const debug = { endpoint: null, status: null, statusText: null, error: null, streams: 0, body: null };
  let rawStreams = [];
  let dataTitle = "";

  const fetchCandidateFromBase = async (baseUrl, qId) => {
    const endpoint = isSeries
      ? `${baseUrl}/stream/series/${qId}:${season}:${episode}.json`
      : `${baseUrl}/stream/movie/${qId}.json`;
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), 6000);
    try {
      const res = await fetch(endpoint, {
        headers: { "User-Agent": USER_AGENT, "Accept": "application/json" },
        signal: controller.signal
      });
      clearTimeout(timer);
      if (res.ok) {
        const j = await res.json();
        if (Array.isArray(j.streams) && j.streams.length > 0) {
          return { endpoint, status: res.status, title: j.title || "", streams: j.streams };
        }
      }
      return { endpoint, status: res.status, title: "", streams: [] };
    } catch (e) {
      clearTimeout(timer);
      return { endpoint, status: null, error: e.message || String(e), streams: [] };
    }
  };

  const tasks = [];
  for (const base of STREMIO_FENIX_ENDPOINTS) {
    for (const qId of queryCandidates) {
      tasks.push(fetchCandidateFromBase(base, qId));
    }
  }

  const results = await Promise.allSettled(tasks);
  const seenUrls = new Set();
  for (const r of results) {
    if (r.status === "fulfilled" && r.value) {
      const val = r.value;
      if (!debug.endpoint && val.endpoint) {
        debug.endpoint = val.endpoint;
        debug.status = val.status;
      }
      if (val.title && !dataTitle) dataTitle = val.title;
      for (const s of (val.streams || [])) {
        if (s && s.url && !seenUrls.has(s.url)) {
          seenUrls.add(s.url);
          rawStreams.push(s);
        }
      }
    }
  }
  debug.streams = rawStreams.length;

  try {
    if (!rawStreams.length) return { title: "", sources: [], debug };

    const parsed = rawStreams
      .filter(s => s && s.url && typeof s.url === "string")
      .map(s => {
        const rawTitle = s.title || "";
        const rawName = s.name || "";
        const text = `${rawName} ${rawTitle}`.toLowerCase();
        let quality = 1080;
        if (text.includes("4k") || text.includes("2160p")) quality = 2160;
        else if (text.includes("1440p") || text.includes("2k")) quality = 1440;
        else if (text.includes("1080p") || text.includes("fhd") || text.includes("full hd") || text.includes("fullhd")) quality = 1080;
        else if (text.includes("720p") || text.includes("hd")) quality = 720;
        else if (text.includes("480p") || text.includes("sd")) quality = 480;
        else if (text.includes("360p")) quality = 360;

        const isSubbed = text.includes("legendado") || text.includes("subbed");
        const isDubbed = text.includes("dublado") ||
                         text.includes("nacional") ||
                         text.includes("dual") ||
                         text.includes("multi") ||
                         text.includes("tri áudio") ||
                         text.includes("tri audio") ||
                         text.includes("pt-br") ||
                         text.includes("ptbr") ||
                         (rawTitle.includes("🇧🇷") && !isSubbed);
        const isHls = s.url.includes(".m3u8") || s.url.includes("hls-proxy") || s.url.includes("/hls") || (s.type === "hls");

        // Provider trust, audio compatibility & speed tiers:
        // 4: Dedicated high-speed official web VOD masters (fenixhub.online / Zeus / Badger) -> guaranteed AAC web audio, 0ms startup
        // 3: Verified mirrors & direct CDNs (zunder, zunderflix)
        // 2: Third-party web scrapers & adaptive HLS (hollymovies / embedplayer2) -> AAC web audio
        // 1: Un-transcoded bot torrent streams (squareweb.app, koyeb.app, fenixbot, /stream/) -> raw MKVs with E-AC-3 audio (unsupported by HTML5 video / silent in browsers), sleep-prone containers
        const rawUrl = (s.url || "").toLowerCase();
        let providerTier = 3;
        const isBotStream = rawUrl.includes("/stream/") || rawUrl.includes("squareweb.app") || rawUrl.includes("fenixbot") || rawUrl.includes("koyeb.app");
        if (rawUrl.includes("fenixhub.online")) {
          providerTier = 4;
        } else if (text.includes("zunder") || rawUrl.includes("zunderflix")) {
          providerTier = 3;
        } else if (text.includes("hollymovies") || rawUrl.includes("embedplayer2")) {
          providerTier = 2;
        } else if (isBotStream) {
          providerTier = 1;
        }

        const cluster = extractClusterName(rawTitle);
        const tag = isDubbed ? (text.includes("dual") ? "Dual Áudio" : "Dublado") : (isSubbed ? "Legendado" : "Original");
        const labelParts = [`Fenix ${quality}p`];
        if (cluster) labelParts.push(`· ${cluster}`);
        labelParts.push(`[${tag}]`);
        const cleanLabel = labelParts.join(" ");

        return {
          label: cleanLabel,
          cluster,
          file: s.url,
          quality,
          providerTier,
          type: isHls ? "hls" : "mp4",
          isDubbed,
          isSubbed
        };
      });

    // Sort order:
    // 1. Audio preference: Dubbed first (if audio === "dubbed"), else Subbed first
    // 2. Provider tier: official masters (4) > mirrors (3) > third-party (2) > bot (1)
    // 3. Resolution: 2160p > 1080p > 720p > 480p
    // 4. HLS preference within identical tier & resolution
    parsed.sort((a, b) => {
      if (audio === "dubbed") {
        if (a.isDubbed && !b.isDubbed) return -1;
        if (!a.isDubbed && b.isDubbed) return 1;
      } else if (audio === "subtitled") {
        if (a.isSubbed && !b.isSubbed) return -1;
        if (!a.isSubbed && b.isSubbed) return 1;
      }
      if (b.providerTier !== a.providerTier) return b.providerTier - a.providerTier;
      if (b.quality !== a.quality) return b.quality - a.quality;
      if (a.type === "hls" && b.type !== "hls") return -1;
      if (b.type === "hls" && a.type !== "hls") return 1;
      return 0;
    });

    return {
      title: dataTitle || "",
      sources: parsed,
      debug
    };
  } catch (err) {
    debug.error = err.message || String(err);
    return { title: "", sources: [], debug };
  }
}
