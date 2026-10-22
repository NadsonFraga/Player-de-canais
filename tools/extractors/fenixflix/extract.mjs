#!/usr/bin/env node
/**
 * Standalone CLI extractor for FenixFlix (fenixflix.fenixhub.online).
 * Direct PT-BR Dubbed stream contingency extractor for Tvzinha Online.
 * 
 * Usage:
 *   node tools/extractors/fenixflix/extract.mjs <id> [mediaType: movie|series] [season] [episode] [audio: dubbed|subbed|all]
 * 
 * Examples:
 *   node tools/extractors/fenixflix/extract.mjs 533535 movie
 *   node tools/extractors/fenixflix/extract.mjs tt15239678 movie
 *   node tools/extractors/fenixflix/extract.mjs 76479 series 1 1
 *   node tools/extractors/fenixflix/extract.mjs tt1190634 series 1 1
 */

const FENIX_BASE = "https://fenixflix.fenixhub.online";
const DEFAULT_USER_AGENT = "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/130.0.0.0 Safari/537.36";

/**
 * Normalizes input ID into Stremio-compatible identifier (e.g. tmdb:12345 or tt1234567).
 */
export function normalizeFenixId(id) {
  const str = String(id || "").trim();
  if (str.startsWith("tt") || str.startsWith("tmdb:")) {
    return str;
  }
  return `tmdb:${str}`;
}

/**
 * Extracts quality tier from stream name/title.
 */
function extractQuality(name = "", title = "") {
  const text = `${name} ${title}`.toLowerCase();
  if (text.includes("4k") || text.includes("2160p")) return "4K";
  if (text.includes("1080p") || text.includes("fhd")) return "1080p";
  if (text.includes("720p") || text.includes("hd")) return "720p";
  if (text.includes("480p")) return "480p";
  if (text.includes("360p")) return "360p";
  return "1080p"; // Default fallback
}

/**
 * Extracts audio language classification from title.
 */
function extractAudio(title = "") {
  const text = title.toLowerCase();
  if (text.includes("dublado")) return "dubbed";
  if (text.includes("legendado")) return "subbed";
  if (text.includes("nacional")) return "national";
  return "unknown";
}

/**
 * Extracts server engine label from title and behaviorHints.
 */
function extractServer(stream) {
  const binge = stream.behaviorHints?.bingeGroup || "";
  const matchBinge = binge.match(/fenixflix-([a-z0-9_-]+)/i);
  if (matchBinge) {
    return matchBinge[1].split("-")[0];
  }
  const lines = (stream.title || "").split("\n").map(l => l.trim());
  return lines[lines.length - 1] || "default";
}

/**
 * Core extraction function for FenixFlix streams.
 */
export async function extractFenixFlixStreams({
  id,
  mediaType = "movie",
  season = 1,
  episode = 1,
  audio = "dubbed",
  timeoutMs = 12000
}) {
  const isSeries = mediaType === "series" || mediaType === "tv";
  const queryId = normalizeFenixId(id);
  const endpoint = isSeries
    ? `${FENIX_BASE}/stream/series/${queryId}:${season}:${episode}.json`
    : `${FENIX_BASE}/stream/movie/${queryId}.json`;

  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), timeoutMs);

  try {
    const res = await fetch(endpoint, {
      headers: {
        "User-Agent": DEFAULT_USER_AGENT,
        "Accept": "application/json"
      },
      signal: controller.signal
    });

    if (!res.ok) {
      throw new Error(`FenixFlix responded with HTTP ${res.status}`);
    }

    const data = await res.json();
    const rawStreams = Array.isArray(data.streams) ? data.streams : [];

    if (rawStreams.length === 0) {
      throw new Error(`No streams available on FenixFlix for ${queryId}`);
    }

    // Parse and enrich each stream item
    const parsedStreams = rawStreams
      .filter(s => s && s.url && typeof s.url === "string")
      .map(s => {
        const quality = extractQuality(s.name, s.title);
        const streamAudio = extractAudio(s.title);
        const server = extractServer(s);
        const isHls = s.url.includes(".m3u8");

        return {
          name: s.name || `FenixFlix ${quality}`,
          server,
          quality,
          audio: streamAudio,
          url: s.url,
          type: isHls ? "hls" : "mp4",
          rawTitle: s.title || ""
        };
      });

    // Filter by audio preference if requested
    let filtered = parsedStreams;
    if (audio === "dubbed") {
      const dubbedOnly = parsedStreams.filter(s => s.audio === "dubbed" || s.audio === "national");
      if (dubbedOnly.length > 0) filtered = dubbedOnly;
    } else if (audio === "subbed") {
      const subbedOnly = parsedStreams.filter(s => s.audio === "subbed");
      if (subbedOnly.length > 0) filtered = subbedOnly;
    }

    // Sort order: Quality score desc (4K > 1080p > 720p), then HLS preference
    const qualityWeights = { "4K": 40, "1080p": 30, "720p": 20, "480p": 10, "360p": 5 };
    filtered.sort((a, b) => {
      const qA = qualityWeights[a.quality] || 0;
      const qB = qualityWeights[b.quality] || 0;
      if (qB !== qA) return qB - qA;
      // Prefer HLS if same quality
      if (a.type === "hls" && b.type !== "hls") return -1;
      if (b.type === "hls" && a.type !== "hls") return 1;
      return 0;
    });

    return {
      provider: "fenixflix",
      id: queryId,
      mediaType: isSeries ? "series" : "movie",
      season: isSeries ? Number(season) : undefined,
      episode: isSeries ? Number(episode) : undefined,
      totalFound: rawStreams.length,
      streams: filtered,
      bestStream: filtered[0] || null
    };
  } finally {
    clearTimeout(timer);
  }
}

// CLI entry point
if (process.argv[1]?.endsWith("extract.mjs")) {
  const args = process.argv.slice(2);
  const id = args[0] || "533535";
  const mediaType = args[1] || "movie";
  const season = args[2] || 1;
  const episode = args[3] || 1;
  const audio = args[4] || "dubbed";

  console.log(`[fenixflix-extract] Querying ID '${id}' (${mediaType}, audio=${audio})...`);
  extractFenixFlixStreams({ id, mediaType, season, episode, audio })
    .then((result) => {
      console.log(`[fenixflix-extract] Found ${result.totalFound} total streams (${result.streams.length} matching filter):`);
      console.log(JSON.stringify(result, null, 2));
    })
    .catch((err) => {
      console.error("[fenixflix-extract] Error:", err.message);
      process.exit(1);
    });
}
