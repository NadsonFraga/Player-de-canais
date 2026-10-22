#!/usr/bin/env node
/**
 * Standalone CLI extractor for Rive / CorsFlix.
 * Usage:
 *   node tools/extractors/rive/extract.mjs <tmdbId> [mediaType: movie|tv] [season] [episode] [preferredService]
 * Examples:
 *   node tools/extractors/rive/extract.mjs 533535 movie
 *   node tools/extractors/rive/extract.mjs 1396 tv 1 1 vanguard
 */

const SALT_TOKENS = [
  "4Z7lUo","gwIVSMD","PLmz2elE2v","Z4OFV0","SZ6RZq6Zc","zhJEFYxrz8","FOm7b0","axHS3q4KDq","o9zuXQ","4Aebt",
  "wgjjWwKKx","rY4VIxqSN","kfjbnSo","2DyrFA1M","YUixDM9B","JQvgEj0","mcuFx6JIek","eoTKe26gL","qaI9EVO1rB","0xl33btZL",
  "1fszuAU","a7jnHzst6P","wQuJkX","cBNhTJlEOf","KNcFWhDvgT","XipDGjST","PCZJlbHoyt","2AYnMZkqd","HIpJh","KH0C3iztrG",
  "W81hjts92","rJhAT","NON7LKoMQ","NMdY3nsKzI","t4En5v","Qq5cOQ9H","Y9nwrp","VX5FYVfsf","cE5SJG","x1vj1",
  "HegbLe","zJ3nmt4OA","gt7rxW57dq","clIE9b","jyJ9g","B5jXjMCSx","cOzZBZTV","FTXGy","Dfh1q1","ny9jqZ2POI",
  "X2NnMn","MBtoyD","qz4Ilys7wB","68lbOMye","3YUJnmxp","1fv5Imona","PlfvvXD7mA","ZarKfHCaPR","owORnX","dQP1YU",
  "dVdkx","qgiK0E","cx9wQ","5F9bGa","7UjkKrp","Yvhrj","wYXez5Dg3","pG4GMU","MwMAu","rFRD5wlM"
];

export function generateRiveSecretKey(id) {
  if (id === undefined) return "rive";
  try {
    let t, n;
    let r = String(id);
    if (isNaN(Number(id))) {
      let sum = r.split("").reduce((acc, char) => acc + char.charCodeAt(0), 0);
      t = SALT_TOKENS[sum % SALT_TOKENS.length] || Buffer.from(r).toString("base64");
      n = Math.floor((sum % r.length) / 2);
    } else {
      let num = Number(id);
      t = SALT_TOKENS[num % SALT_TOKENS.length] || Buffer.from(r).toString("base64");
      n = Math.floor((num % r.length) / 2);
    }
    
    let combined = r.slice(0, n) + t + r.slice(n);
    
    function hashPass1(str) {
      str = String(str);
      let acc = 0;
      for (let idx = 0; idx < str.length; idx++) {
        let code = str.charCodeAt(idx);
        acc = (code + (acc << 6) + (acc << 16) - acc) >>> 0;
        let rot = ((acc << (idx % 5)) | (acc >>> (32 - (idx % 5)))) >>> 0;
        let x = (code << (idx % 7)) | (code >>> (8 - (idx % 7)));
        acc ^= (rot ^ x) >>> 0;
        acc = (acc + ((acc >>> 11) ^ (acc << 3))) >>> 0;
      }
      acc ^= acc >>> 15;
      acc = ((acc & 65535) * 49842 + ((((acc >>> 16) * 49842) & 65535) << 16)) >>> 0;
      acc ^= acc >>> 13;
      acc = ((acc & 65535) * 40503 + ((((acc >>> 16) * 40503) & 65535) << 16)) >>> 0;
      acc ^= acc >>> 16;
      return acc.toString(16).padStart(8, "0");
    }
    
    function hashPass2(str) {
      str = String(str);
      let acc = (3735928559 ^ str.length) >>> 0;
      for (let idx = 0; idx < str.length; idx++) {
        let code = str.charCodeAt(idx);
        code ^= (131 * idx + 89 ^ (code << (idx % 5))) & 255;
        acc = (((acc << 7) | (acc >>> 25)) >>> 0) ^ code;
        let low = (acc & 65535) * 60205;
        let high = ((acc >>> 16) * 60205) << 16;
        acc = (low + high) >>> 0;
        acc ^= acc >>> 11;
      }
      acc ^= acc >>> 15;
      acc = ((acc & 65535) * 49842 + (((acc >>> 16) * 49842) << 16)) >>> 0;
      acc ^= acc >>> 13;
      acc = ((acc & 65535) * 40503 + (((acc >>> 16) * 40503) << 16)) >>> 0;
      acc ^= acc >>> 16;
      acc = ((acc & 65535) * 10196 + (((acc >>> 16) * 10196) << 16)) >>> 0;
      acc ^= acc >>> 15;
      return acc.toString(16).padStart(8, "0");
    }
    
    const hex = hashPass2(hashPass1(combined));
    return Buffer.from(hex).toString("base64");
  } catch (err) {
    return "topSecret";
  }
}

const DEFAULT_SERVICES = [
  "vanguard", "mirage", "apogee", "velocity", "ignite",
  "tampa", "meridian", "savannah", "solstice", "primevids"
];

export async function extractRiveStreams({
  tmdbId,
  mediaType = "movie",
  season = 1,
  episode = 1,
  preferredService = null
}) {
  const secretKey = generateRiveSecretKey(tmdbId);
  const headers = {
    "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/130.0.0.0 Safari/537.36",
    "Origin": "https://watch.rivestream.app",
    "Referer": "https://watch.rivestream.app/"
  };

  const servicesToTry = preferredService ? [preferredService, ...DEFAULT_SERVICES.filter(s => s !== preferredService)] : DEFAULT_SERVICES;

  const allFoundSources = [];
  const allCaptions = [];

  for (const service of servicesToTry) {
    const isMovie = mediaType === "movie";
    const endpoint = isMovie ? "movieVideoProvider" : "tvVideoProvider";
    const query = new URLSearchParams({
      requestID: endpoint,
      id: String(tmdbId),
      service,
      secretKey,
      proxyMode: "noProxy"
    });
    if (!isMovie) {
      query.set("season", String(season));
      query.set("episode", String(episode));
    }
    if (service === "primevids" || service === "citadel") {
      query.set("cb", String(Math.floor(Date.now() / 3e6)));
    }

    const url = `https://backend.rivestream.app/api/backendfetch?${query.toString()}`;
    try {
      const res = await fetch(url, { headers });
      if (!res.ok) continue;
      const json = await res.json();
      const sources = json?.data?.sources || [];
      const captions = json?.data?.captions || [];

      if (sources.length > 0) {
        allFoundSources.push(...sources);
        if (captions.length > 0) allCaptions.push(...captions);
        // Found valid high quality stream, break early for fast response
        break;
      }
    } catch {
      // Continue to next service
    }
  }

  return {
    tmdbId,
    mediaType,
    secretKey,
    sources: allFoundSources,
    captions: allCaptions
  };
}

// CLI entry point
if (process.argv[1]?.endsWith("extract.mjs")) {
  const args = process.argv.slice(2);
  const tmdbId = args[0] || "533535";
  const mediaType = args[1] || "movie";
  const season = args[2] || 1;
  const episode = args[3] || 1;
  const preferredService = args[4] || null;

  console.log(`[rive-extract] Extracting TMDB ${tmdbId} (${mediaType})...`);
  extractRiveStreams({ tmdbId, mediaType, season, episode, preferredService })
    .then((result) => {
      console.log(JSON.stringify(result, null, 2));
    })
    .catch((err) => {
      console.error("[rive-extract] Error:", err.message);
      process.exit(1);
    });
}
