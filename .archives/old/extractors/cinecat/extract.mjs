#!/usr/bin/env node
/**
 * Standalone CLI extractor for Cinecat (cdn.hls.lol / totallyacdn).
 * Usage:
 *   node tools/extractors/cinecat/extract.mjs <tmdbId> [mediaType: movie|series] [season] [episode]
 * Examples:
 *   node tools/extractors/cinecat/extract.mjs 533535 movie
 *   node tools/extractors/cinecat/extract.mjs 1396 series 1 1
 */

export async function extractCinecatStreams({
  tmdbId,
  mediaType = "movie",
  season = 1,
  episode = 1
}) {
  const isSeries = mediaType === "series" || mediaType === "tv";
  const endpoint = isSeries
    ? `https://cdn.hls.lol/content/series/${tmdbId}/${season}/${episode}`
    : `https://cdn.hls.lol/content/movie/${tmdbId}`;

  const headers = {
    "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/130.0.0.0 Safari/537.36",
    "Origin": "https://cinecat.eu",
    "Referer": "https://cinecat.eu/"
  };

  const res = await fetch(endpoint, { headers });
  if (!res.ok) {
    throw new Error(`Cinecat resolution returned HTTP ${res.status}`);
  }

  const data = await res.json();
  if (!data.found || !data.url) {
    throw new Error(`Media not found on Cinecat: ${JSON.stringify(data)}`);
  }

  return {
    provider: "cinecat",
    tmdbId,
    mediaType: isSeries ? "series" : "movie",
    title: data.title || "",
    season: isSeries ? Number(season) : undefined,
    episode: isSeries ? Number(episode) : undefined,
    streamUrl: data.url,
    type: data.type || "hls",
    referer: "https://cinecat.eu/"
  };
}

// CLI entry point
if (process.argv[1]?.endsWith("extract.mjs")) {
  const args = process.argv.slice(2);
  const tmdbId = args[0] || "533535";
  const mediaType = args[1] || "movie";
  const season = args[2] || 1;
  const episode = args[3] || 1;

  console.log(`[cinecat-extract] Resolving TMDB ${tmdbId} (${mediaType})...`);
  extractCinecatStreams({ tmdbId, mediaType, season, episode })
    .then((result) => {
      console.log(JSON.stringify(result, null, 2));
    })
    .catch((err) => {
      console.error("[cinecat-extract] Error:", err.message);
      process.exit(1);
    });
}
