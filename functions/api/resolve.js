/**
 * Tvzinha Online - Cloudflare Pages Function: /api/resolve
 * Unified Stream Resolver for Movies, Series, and Animes.
 * Extracts direct clean HLS (.m3u8) / MP4 streams from MGEB and ZokoAnime.
 */

const USER_AGENT = "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36";

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

/**
 * Fetches MyAnimeList ID from title via fast prefix search or public Jikan API
 */
async function getMalIdFromTitle(title) {
  // Method 1: Official MyAnimeList quick prefix search (fast & reliable)
  try {
    const cleanTitle = title.replace(/\(.*?\)|\[.*?\]/g, '').trim();
    const searchUrl = `https://myanimelist.net/search/prefix.json?type=anime&keyword=${encodeURIComponent(cleanTitle)}`;
    const res = await fetch(searchUrl, {
      headers: { "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64)" },
    });
    if (res.ok) {
      const data = await res.json();
      if (data.categories && data.categories.length > 0 && data.categories[0].items && data.categories[0].items.length > 0) {
        return data.categories[0].items[0].id;
      }
    }
  } catch (e) {
    // Fallback to Jikan
  }

  // Method 2: Public Jikan API
  try {
    const searchUrl = `https://api.jikan.moe/v4/anime?q=${encodeURIComponent(title)}&limit=1`;
    const res = await fetch(searchUrl, {
      headers: { "User-Agent": USER_AGENT },
    });
    if (res.ok) {
      const data = await res.json();
      if (data.data && data.data.length > 0) {
        return data.data[0].mal_id;
      }
    }
  } catch (e) {
    // Graceful fallback on API miss
  }
  return null;
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
      malId = await getMalIdFromTitle(titleParam);
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

        result = {
          success: true,
          title: titleParam || `Anime Ep ${episode}`,
          category: "anime",
          audio: "subtitled",
          primary_source: {
            label: "ZokoAnime [1080p FHD HLS]",
            type: "hls",
            stream_url: streamUrl,
            raw_url: zokoData.src,
            headers: {
              "Referer": "https://zokoanime.video/",
              "Origin": "https://zokoanime.video",
            },
          },
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
  if (!result && id) {
    const mgebType = type === "anime" ? "serie" : type;
    const mgebData = await resolveMgeb(mgebType, id, season, episode);
    if (mgebData && mgebData.sources && mgebData.sources.length > 0) {
      const parsedSources = mgebData.sources.map((s, idx) => {
        const rawFile = s.file || "";
        let referer = "https://embedplayer2.xyz/";
        if (rawFile.includes("peliculaplay.com")) referer = "https://mgeb.top/";
        
        return {
          label: s.label || `Servidor ${idx + 1}`,
          type: s.type || (rawFile.includes(".m3u8") ? "hls" : "mp4"),
          stream_url: `${proxyBase}?url=${encodeURIComponent(rawFile)}&referer=${encodeURIComponent(referer)}`,
          raw_url: rawFile,
          headers: {
            "Referer": referer,
          },
        };
      });

      function scoreSource(src) {
        const u = (src.raw_url || "").toLowerCase();
        if (u.includes("playercdn.workers.dev") || u.includes("cache/hls")) return -100;
        // Prioritize official MGEB master streams (calibrated Rec.709 8-bit SDR)
        if (u.includes("fontedecanais")) return 100;
        if (u.includes(".m3u8") || u.includes("peliculaplay.com") || u.includes("97bf1.com") || u.includes("playspelis.com")) return 85;
        if (u.includes(".mp4")) return 80;
        return 20;
      }

      const validSources = parsedSources.filter(s => scoreSource(s) > 0);
      if (validSources.length > 0) {
        validSources.sort((a, b) => scoreSource(b) - scoreSource(a));
      }

      const primary = validSources.length > 0 ? validSources[0] : parsedSources[0];
      const fallbacks = validSources.length > 0 ? validSources.slice(1) : parsedSources.slice(1);

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
