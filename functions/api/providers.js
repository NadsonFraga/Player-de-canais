/**
 * Tvzinha Online - Multi-Provider Native Stream Extractors for /api/resolve
 * Implements FenixFlix and Movy resolvers.
 */

const USER_AGENT = "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/130.0.0.0 Safari/537.36";

/* ============================================================
 * 1. FENIXFLIX (PT-BR Dublado Native Stream Aggregator)
 * ============================================================ */
export async function resolveFenixFlix({ id, imdbId, type, season = 1, episode = 1, audio = "dubbed" }) {
  const isSeries = type === "series" || type === "serie" || type === "tv" || type === "anime";
  const queryCandidates = [];
  if (imdbId && imdbId.startsWith("tt")) {
    queryCandidates.push(imdbId);
  }
  if (id) {
    queryCandidates.push(String(id).startsWith("tmdb:") ? id : `tmdb:${id}`);
  }

  let data = null;
  let rawStreams = [];
  const debug = { endpoint: null, status: null, statusText: null, error: null, streams: 0, body: null };

  for (const qId of queryCandidates) {
    const endpoint = isSeries
      ? `https://fenixflix.fenixhub.online/stream/series/${qId}:${season}:${episode}.json`
      : `https://fenixflix.fenixhub.online/stream/movie/${qId}.json`;
    debug.endpoint = endpoint;

    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), 6000);
    try {
      const res = await fetch(endpoint, {
        headers: { "User-Agent": USER_AGENT, "Accept": "application/json" },
        signal: controller.signal
      });
      clearTimeout(timer);
      debug.status = res.status;
      debug.statusText = res.statusText;
      if (res.ok) {
        const j = await res.json();
        if (Array.isArray(j.streams) && j.streams.length > 0) {
          data = j;
          rawStreams = j.streams;
          debug.streams = rawStreams.length;
          break;
        }
      }
    } catch (e) {
      clearTimeout(timer);
      debug.error = e.message || String(e);
    }
  }

  try {
    if (!rawStreams.length) return { title: "", sources: [], debug };

    const parsed = rawStreams
      .filter(s => s && s.url && typeof s.url === "string")
      .map(s => {
        const text = `${s.name || ''} ${s.title || ''}`.toLowerCase();
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
                         (text.includes("🇧🇷") && !isSubbed);
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

        const tag = isDubbed ? (text.includes("dual") ? "Dual Áudio" : "Dublado") : (isSubbed ? "Legendado" : "Original");
        const cleanName = s.name || `FenixFlix ${quality}p`;
        return {
          label: `${cleanName} [${tag}]`,
          file: s.url,
          quality,
          providerTier,
          type: isHls ? "hls" : "mp4",
          isDubbed,
          isSubbed
        };
      });

    // Prefer dubbed if available
    let filtered = parsed;
    if (audio === "dubbed") {
      const dubbed = parsed.filter(s => s.isDubbed);
      if (dubbed.length > 0) filtered = dubbed;
    }

    // Sort: Provider tier > Quality > HLS tie-breaker within identical tier & resolution
    filtered.sort((a, b) => {
      if (b.providerTier !== a.providerTier) return b.providerTier - a.providerTier;
      if (b.quality !== a.quality) return b.quality - a.quality;
      if (a.type === "hls" && b.type !== "hls") return -1;
      if (b.type === "hls" && a.type !== "hls") return 1;
      return 0;
    });

    return {
      title: data.title || "",
      sources: filtered,
      debug
    };
  } catch (err) {
    debug.error = err.message || String(err);
    return { title: "", sources: [], debug };
  }
}





