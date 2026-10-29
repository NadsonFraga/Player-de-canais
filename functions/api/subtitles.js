/**
 * Tvzinha Online - Cloudflare Pages Function: /api/subtitles
 * Multi-Source Subtitle Search & WebVTT CORS Proxy.
 *
 * Query:
 *   GET /api/subtitles?tmdb_id=...&imdb_id=...&type=movie|series&season=1&episode=1
 *   GET /api/subtitles?action=proxy&url=https://subs5.strem.io/...
 *
 * Mirrored by tools/local_server.py. Keep edge functions and local_server.py strictly identical.
 */

import { isAllowedOrigin, apiIpBlockedFor } from "./resolve.js";

const USER_AGENT = "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36";
const MAX_SUBTITLE_BYTES = 2 * 1024 * 1024; // 2 MB limit for subtitle text

// In-memory caches (isolate-level)
const imdbIdCache = new Map();
const subtitlesCache = new Map();
const SUBTITLE_CACHE_TTL_MS = 4 * 60 * 60 * 1000; // 4 hours

const LANG_MAP = {
  pob: { code: "pt-BR", label: "Português (Brasil)", flag: "br", priority: 1 },
  por: { code: "pt", label: "Português", flag: "pt", priority: 2 },
  eng: { code: "en", label: "Inglês", flag: "us", priority: 3 },
  spa: { code: "es", label: "Espanhol", flag: "es", priority: 4 },
  spl: { code: "es", label: "Espanhol (Latino)", flag: "es", priority: 4 },
  fre: { code: "fr", label: "Francês", flag: "fr", priority: 5 },
  fra: { code: "fr", label: "Francês", flag: "fr", priority: 5 },
  ita: { code: "it", label: "Italiano", flag: "it", priority: 6 },
  ger: { code: "de", label: "Alemão", flag: "de", priority: 7 },
  deu: { code: "de", label: "Alemão", flag: "de", priority: 7 },
  jpn: { code: "ja", label: "Japonês", flag: "ja", priority: 8 },
  kor: { code: "ko", label: "Coreano", flag: "ko", priority: 9 },
  chi: { code: "zh", label: "Chinês", flag: "zh", priority: 10 },
  zho: { code: "zh", label: "Chinês", flag: "zh", priority: 10 },
  zht: { code: "zh", label: "Chinês (Tradicional)", flag: "zh", priority: 10 },
  rus: { code: "ru", label: "Russo", flag: "ru", priority: 11 },
  pol: { code: "pl", label: "Polonês", flag: "pl", priority: 12 },
  ara: { code: "ar", label: "Árabe", flag: "ar", priority: 13 },
  ind: { code: "id", label: "Indonésio", flag: "id", priority: 14 },
  tur: { code: "tr", label: "Turco", flag: "tr", priority: 15 },
  vie: { code: "vi", label: "Vietnamita", flag: "vi", priority: 16 },
  srp: { code: "sr", label: "Sérvio", flag: "sr", priority: 17 },
  cat: { code: "ca", label: "Catalão", flag: "es", priority: 18 },
  ron: { code: "ro", label: "Romeno", flag: "ro", priority: 19 },
  nld: { code: "nl", label: "Holandês", flag: "nl", priority: 20 },
  dut: { code: "nl", label: "Holandês", flag: "nl", priority: 20 },
  swe: { code: "sv", label: "Sueco", flag: "sv", priority: 21 },
  ell: { code: "el", label: "Grego", flag: "el", priority: 22 },
  gre: { code: "el", label: "Grego", flag: "el", priority: 22 },
  cze: { code: "cs", label: "Tcheco", flag: "cs", priority: 23 },
  ces: { code: "cs", label: "Tcheco", flag: "cs", priority: 23 },
  hun: { code: "hu", label: "Húngaro", flag: "hu", priority: 24 },
  mal: { code: "ms", label: "Malaio", flag: "ms", priority: 25 },
  msa: { code: "ms", label: "Malaio", flag: "ms", priority: 25 },
  tha: { code: "th", label: "Tailandês", flag: "th", priority: 26 },
  hin: { code: "hi", label: "Hindi", flag: "hi", priority: 27 },
};

function json(status, body, extraHeaders = {}) {
  return new Response(JSON.stringify(body), {
    status,
    headers: {
      "Content-Type": "application/json; charset=utf-8",
      ...extraHeaders,
    },
  });
}

/**
 * Subtitle cues keep italics, bold and underline only. Any other tag is dropped
 * and a stray "<" or ">" is escaped, so the player renders cue HTML safely.
 */
export function fixMojibake(text) {
  if (!text || typeof text !== "string") return text;
  try {
    if (/[\u00C2\u00C3]/.test(text)) {
      return decodeURIComponent(escape(text));
    }
  } catch (e) {}
  return text
    .replace(/\u00C3\u00A1/g, "á").replace(/\u00C3\u00A0/g, "à").replace(/\u00C3\u00A2/g, "â").replace(/\u00C3\u00A3/g, "ã")
    .replace(/\u00C3\u00A9/g, "é").replace(/\u00C3\u00AA/g, "ê").replace(/\u00C3\u00AD/g, "í")
    .replace(/\u00C3\u00B3/g, "ó").replace(/\u00C3\u00B4/g, "ô").replace(/\u00C3\u00B5/g, "õ")
    .replace(/\u00C3\u00BA/g, "ú").replace(/\u00C3\u00A7/g, "ç")
    .replace(/\u00C3\u0081/g, "Á").replace(/\u00C3\u0080/g, "À").replace(/\u00C3\u0082/g, "Â").replace(/\u00C3\u0083/g, "Ã")
    .replace(/\u00C3\u0089/g, "É").replace(/\u00C3\u008A/g, "Ê").replace(/\u00C3\u008D/g, "Í")
    .replace(/\u00C3\u0093/g, "Ó").replace(/\u00C3\u0094/g, "Ô").replace(/\u00C3\u0095/g, "Õ")
    .replace(/\u00C3\u009A/g, "Ú").replace(/\u00C3\u0087/g, "Ç");
}

export function cleanVtt(text) {
  if (!text) return "WEBVTT\n\n";
  const fixed = fixMojibake(text);
  // Convert ASS line break notation to newline
  const withLineBreaks = fixed.replace(/\\N/g, "\n");
  return withLineBreaks.split("\n").map(line => {
    if (line.includes("-->")) return line;
    return line
      // Strip all SSA/ASS override tags and MicroDVD tags: {...}
      .replace(/\{[^}]*\}/g, "")
      // Keep only <i>, <b>, <u> formatting
      .replace(/<\/?[a-zA-Z][^<>]*>/g, tag => (/^<\/?[ibu]>$/i.test(tag) ? tag.toLowerCase() : ""))
      // Escape stray unescaped < or >
      .replace(/<(?!\/?[ibu]>)/g, "&lt;")
      .replace(/(?<!<[ibu])(?<!<\/[ibu])>/g, "&gt;");
  }).join("\n");
}

/**
 * Converts SubRip (.srt) subtitle text to standard WebVTT format and sanitizes tags.
 */
export function srtToVtt(srtText) {
  if (!srtText) return "WEBVTT\n\n";
  let text = srtText.replace(/^\uFEFF/, "").replace(/\r\n/g, "\n").replace(/\r/g, "\n");
  if (/^WEBVTT/i.test(text.trim())) {
    return cleanVtt(text);
  }
  // Convert timestamps: 00:00:00,000 --> 00:00:00,000 to 00:00:00.000 --> 00:00:00.000
  text = text.replace(/(\d{1,2}:\d{2}:\d{2}),(\d{3})\s*-->\s*(\d{1,2}:\d{2}:\d{2}),(\d{3})/g, "$1.$2 --> $3.$4");
  return "WEBVTT\n\n" + cleanVtt(text);
}

/**
 * Resolves TMDB ID to canonical IMDb ID (tt...).
 */
async function resolveImdbId(tmdbId, type, tmdbApiKey) {
  if (!tmdbId || !tmdbApiKey) return null;
  const cacheKey = `${type}:${tmdbId}`;
  const cached = imdbIdCache.get(cacheKey);
  if (cached && Date.now() - cached.at < 24 * 60 * 60 * 1000) {
    return cached.imdbId;
  }

  try {
    const isMovie = type === "movie";
    const url = isMovie
      ? `https://api.themoviedb.org/3/movie/${tmdbId}?api_key=${tmdbApiKey}`
      : `https://api.themoviedb.org/3/tv/${tmdbId}/external_ids?api_key=${tmdbApiKey}`;
    
    const res = await fetch(url, { headers: { "User-Agent": USER_AGENT } });
    if (res.ok) {
      const data = await res.json();
      if (data.imdb_id && String(data.imdb_id).startsWith("tt")) {
        const imdbId = String(data.imdb_id);
        imdbIdCache.set(cacheKey, { at: Date.now(), imdbId });
        return imdbId;
      }
    }
  } catch (e) {
    // Fallback gracefully
  }
  return null;
}

/**
 * Checks whether an outbound URL is safe to fetch (anti-SSRF guard).
 */
function isSafeUpstreamUrl(urlStr) {
  try {
    const parsed = new URL(urlStr);
    if (parsed.protocol !== "http:" && parsed.protocol !== "https:") return false;
    const host = parsed.hostname.toLowerCase();
    if (host === "localhost" || host === "127.0.0.1" || host === "::1") return false;
    if (/^192\.168\.\d{1,3}\.\d{1,3}$/.test(host)) return false;
    if (/^10\.\d{1,3}\.\d{1,3}\.\d{1,3}$/.test(host)) return false;
    if (/^172\.(1[6-9]|2\d|3[0-1])\.\d{1,3}\.\d{1,3}$/.test(host)) return false;
    return true;
  } catch (e) {
    return false;
  }
}

/**
 * Proxy action: fetches upstream subtitle file, converts to WebVTT, sanitizes and returns with CORS.
 */
async function handleProxy(urlStr, corsHeaders) {
  if (!urlStr || !isSafeUpstreamUrl(urlStr)) {
    return json(400, { error: "invalid_url" }, corsHeaders);
  }

  try {
    const upstream = await fetch(urlStr, {
      headers: { "User-Agent": USER_AGENT },
    });
    if (!upstream.ok) {
      return json(upstream.status, { error: "upstream_failed" }, corsHeaders);
    }

    const text = await upstream.text();
    if (text.length > MAX_SUBTITLE_BYTES) {
      return json(502, { error: "subtitle_too_large" }, corsHeaders);
    }

    const vtt = srtToVtt(text);
    return new Response(vtt, {
      status: 200,
      headers: {
        "Content-Type": "text/vtt; charset=utf-8",
        "Access-Control-Allow-Origin": "*",
        "Cache-Control": "public, max-age=86400",
        "X-Content-Type-Options": "nosniff",
      },
    });
  } catch (e) {
    return json(502, { error: "upstream_unreachable" }, corsHeaders);
  }
}

export async function onRequestOptions(context) {
  const origin = context.request.headers.get("Origin");
  if (!isAllowedOrigin(origin)) return new Response(null, { status: 403 });
  return new Response(null, {
    status: 204,
    headers: {
      "Access-Control-Allow-Origin": origin || "*",
      "Access-Control-Allow-Methods": "GET, HEAD, OPTIONS",
      "Access-Control-Allow-Headers": "Range, Content-Type, Accept, User-Agent, Origin",
      "Access-Control-Max-Age": "86400",
      "Vary": "Origin",
    },
  });
}

export async function onRequestGet(context) {
  const { request, env } = context;
  const origin = request.headers.get("Origin");
  if (!isAllowedOrigin(origin)) return json(403, { error: "origin_forbidden" });
  
  const corsHeaders = {
    "Access-Control-Allow-Origin": origin || "*",
    "Vary": "Origin",
  };

  const ipWait = apiIpBlockedFor(request.headers.get("CF-Connecting-IP"));
  if (ipWait) {
    return json(429, { error: "too_many_requests" }, { ...corsHeaders, "Retry-After": String(ipWait) });
  }

  const urlObj = new URL(request.url);
  const action = urlObj.searchParams.get("action") || "";

  // Proxy Mode: convert & sanitize external subtitle
  if (action === "proxy") {
    const targetUrl = urlObj.searchParams.get("url") || "";
    return handleProxy(targetUrl, corsHeaders);
  }

  // Search Mode: Query Stremio OpenSubtitles v3
  const rawType = (urlObj.searchParams.get("type") || urlObj.searchParams.get("mediaType") || "movie").toLowerCase();
  const type = rawType === "tv" || rawType === "anime" || rawType === "series" || rawType === "serie" ? "series" : "movie";
  let imdbId = urlObj.searchParams.get("imdb_id") || urlObj.searchParams.get("imdbId") || "";
  const tmdbId = urlObj.searchParams.get("tmdb_id") || urlObj.searchParams.get("tmdbId") || urlObj.searchParams.get("id") || "";
  const season = parseInt(urlObj.searchParams.get("season") || "1", 10) || 1;
  const episode = parseInt(urlObj.searchParams.get("episode") || "1", 10) || 1;

  // Resolve IMDb ID if missing
  if ((!imdbId || !imdbId.startsWith("tt")) && tmdbId) {
    const tmdbApiKey = (env && env.TMDB_API_KEY) || "";
    imdbId = await resolveImdbId(tmdbId, type, tmdbApiKey);
  }

  if (!imdbId || !imdbId.startsWith("tt")) {
    return json(200, { imdb_id: null, subtitles: [] }, corsHeaders);
  }

  // Cache check
  const cacheKey = type === "movie" ? `movie:${imdbId}` : `series:${imdbId}:${season}:${episode}`;
  const cached = subtitlesCache.get(cacheKey);
  if (cached && Date.now() - cached.at < SUBTITLE_CACHE_TTL_MS) {
    return json(200, cached.data, corsHeaders);
  }

  const stremioUrl = type === "movie"
    ? `https://opensubtitles-v3.strem.io/subtitles/movie/${imdbId}.json`
    : `https://opensubtitles-v3.strem.io/subtitles/series/${imdbId}:${season}:${episode}.json`;

  try {
    const res = await fetch(stremioUrl, {
      headers: { "User-Agent": USER_AGENT },
    });
    if (!res.ok) {
      return json(200, { imdb_id: imdbId, subtitles: [] }, corsHeaders);
    }

    const data = await res.json();
    const rawList = Array.isArray(data.subtitles) ? data.subtitles : [];

    const processed = rawList.map((sub, idx) => {
      const rawLang = String(sub.lang || "").toLowerCase();
      const info = LANG_MAP[rawLang] || {
        code: rawLang,
        label: (sub.lang || "Outro").toUpperCase(),
        flag: "other",
        priority: 99,
      };

      const release = (sub.releaseGroup || sub.releaseFormat || sub.movieReleaseName || sub.subtitleFileName || "")
        .replace(/\.srt$/i, "")
        .trim();

      return {
        id: String(sub.id || idx),
        lang: info.code,
        label: info.label,
        flag: info.flag,
        priority: info.priority,
        release: release || info.label,
        fileName: sub.subtitleFileName || "",
        format: "vtt",
        url: `/api/subtitles?action=proxy&url=${encodeURIComponent(sub.url)}`,
        direct_url: sub.url,
      };
    });

    // Sort by priority (PT-BR -> PT -> EN -> ...)
    processed.sort((a, b) => a.priority - b.priority);

    const payload = {
      imdb_id: imdbId,
      subtitles: processed,
    };

    subtitlesCache.set(cacheKey, { at: Date.now(), data: payload });
    return json(200, payload, corsHeaders);
  } catch (e) {
    return json(200, { imdb_id: imdbId, subtitles: [] }, corsHeaders);
  }
}

