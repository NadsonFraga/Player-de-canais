/**
 * Tvzinha Online - Client-Side Stream Extractors (FenixFlix)
 * 
 * Executes directly in the user's browser to bypass Cloudflare-to-Cloudflare WAF / CF-Worker blocks,
 * utilizing the user's residential/mobile IP with open CORS (Access-Control-Allow-Origin: *).
 * Signs final proxy URLs through /api/resolve?action=sign for streams requiring custom Referer headers.
 */

import { STREAM_ENGINE_API_BASE } from '../core/constants.js?v=20261120_1206';
import { fetchTmdb } from '../core/tmdb.js?v=20261120_1206';

/* ============================================================
 * 0. STREAM SIGNING HELPER
 * ============================================================ */

function getApiBase() {
  if (STREAM_ENGINE_API_BASE) return STREAM_ENGINE_API_BASE;
  if (typeof window !== 'undefined' && window.location && window.location.origin) {
    return window.location.origin;
  }
  return 'http://127.0.0.1:8787';
}

/**
 * Signs an upstream stream URL through /api/resolve?action=sign to generate a valid /api/stream proxy URL.
 */
export async function signStreamUrl(url, referer = '', targetOrigin = '') {
  if (!url) return '';
  try {
    const params = new URLSearchParams({
      action: 'sign',
      url,
      referer,
      target_origin: targetOrigin
    });
    const res = await fetch(`${getApiBase()}/api/resolve?${params.toString()}`);
    if (res.ok) {
      const data = await res.json();
      if (data && data.success && data.signed_url) {
        return data.signed_url;
      }
    }
  } catch (e) {
    console.warn('[ClientProviders] Erro ao assinar URL individual:', e);
  }
  return url;
}

/**
 * Signs multiple stream URLs in a single batch request via /api/resolve?action=sign_batch.
 */
export async function signStreamUrlsBatch(items) {
  if (!items || !items.length) return [];
  try {
    const res = await fetch(`${getApiBase()}/api/resolve?action=sign_batch`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ items })
    });
    if (res.ok) {
      const data = await res.json();
      if (data && data.success && Array.isArray(data.items)) {
        return data.items;
      }
    }
  } catch (e) {
    console.warn('[ClientProviders] Erro no batch sign, recorrendo a URLs individuais:', e);
  }
  // Fallback: sign individually
  return Promise.all(items.map(async (it) => {
    const signed = await signStreamUrl(it.url, it.referer || '', it.origin || '');
    return { ...it, signed_url: signed };
  }));
}


function getStreamHeaders(rawUrl) {
  const defaultHeaders = { referer: 'https://embedplayer2.xyz/', origin: 'https://embedplayer2.xyz' };
  if (!rawUrl) return defaultHeaders;
  try {
    const lower = rawUrl.toLowerCase();
    if (lower.includes('zunderflix') || lower.includes('zunder')) {
      return { referer: 'https://zunderflix.lat/', origin: 'https://zunderflix.lat' };
    }
    if (lower.includes('hollymovies')) {
      return { referer: 'https://hollymovies.org/', origin: 'https://hollymovies.org' };
    }
    if (lower.includes('fenixhub') || lower.includes('fenixflix') || lower.includes('embedplayer2') || lower.includes('playercdn')) {
      return { referer: 'https://embedplayer2.xyz/', origin: 'https://embedplayer2.xyz' };
    }
    const u = new URL(rawUrl);
    return { referer: `${u.origin}/`, origin: u.origin };
  } catch (e) {
    return defaultHeaders;
  }
}

export const STREMIO_FENIX_ENDPOINTS = [
  'https://fenixflix.fenixhub.online'
];

function cleanEmojis(text) {
  return String(text || '')
    .replace(/[\u{1F600}-\u{1F64F}\u{1F300}-\u{1F5FF}\u{1F680}-\u{1F6FF}\u{1F1E0}-\u{1F1FF}\u{2600}-\u{27BF}\u{FE00}-\u{FE0F}\u{1F900}-\u{1F9FF}\u{1FA70}-\u{1FAFF}]/gu, '')
    .replace(/\s+/g, ' ')
    .trim();
}

function extractClusterName(title) {
  const clean = cleanEmojis(title);
  const m = clean.match(/\b(Zeus|Badger|Hypex|Figgs|Hydra|Apollo|Ares|Thor|Odin|Zunder|Hollymovies)\b/i);
  return m ? m[1].charAt(0).toUpperCase() + m[1].slice(1).toLowerCase() : '';
}

/* ============================================================
 * 1. FENIXFLIX (PT-BR Dublado Native Stream Aggregator)
 * ============================================================ */

export async function resolveFenixFlixClient(options = {}) {
  const { id, type = 'movie', season = 1, episode = 1, title = '' } = options;
  const audio = options.audio || (options.lang === 'sub' ? 'subtitled' : 'dubbed');
  let imdbId = options.imdbId || options.imdb_id;
  const isSeries = type === 'series' || type === 'serie' || type === 'tv' || type === 'anime';

  // 1. Resolve IMDb ID from TMDB if not provided
  if (!imdbId && id && /^\d+$/.test(String(id))) {
    try {
      const tmdbPath = isSeries ? `tv/${id}/external_ids` : `movie/${id}`;
      const tmdbData = await fetchTmdb(tmdbPath);
      if (tmdbData && tmdbData.imdb_id && String(tmdbData.imdb_id).startsWith('tt')) {
        imdbId = String(tmdbData.imdb_id);
      }
    } catch (e) {
      console.warn('[ClientProviders] Erro ao buscar IMDb ID no TMDB para FenixFlix:', e);
    }
  }

  // 2. Build candidate query IDs (prioritize IMDb tt..., fallback to tmdb:...)
  const queryCandidates = [];
  if (imdbId && imdbId.startsWith('tt')) {
    queryCandidates.push(imdbId);
  }
  if (id) {
    queryCandidates.push(String(id).startsWith('tmdb:') ? id : `tmdb:${id}`);
  }

  let data = null;
  let rawStreams = [];

  if (queryCandidates.length > 0) {
    const controller = new AbortController();
    // Unified parallel budget of 4.5 seconds
    const timer = setTimeout(() => controller.abort(), 4500);

    try {
      const fetchCandidate = async (baseUrl, qId) => {
        const endpoint = isSeries
          ? `${baseUrl}/stream/series/${qId}:${season}:${episode}.json`
          : `${baseUrl}/stream/movie/${qId}.json`;
        try {
          const res = await fetch(endpoint, {
            headers: { 'Accept': 'application/json' },
            signal: controller.signal
          });
          if (res.ok) {
            const j = await res.json();
            if (Array.isArray(j.streams) && j.streams.length > 0) {
              return j;
            }
          }
        } catch (_) {}
        return null;
      };

      const tasks = [];
      for (const base of STREMIO_FENIX_ENDPOINTS) {
        for (const q of queryCandidates) {
          tasks.push(fetchCandidate(base, q));
        }
      }

      const results = await Promise.allSettled(tasks);
      clearTimeout(timer);

      const seenUrls = new Set();
      for (const r of results) {
        if (r.status === 'fulfilled' && r.value) {
          const j = r.value;
          if (!data) data = j;
          for (const s of (j.streams || [])) {
            if (s && s.url && !seenUrls.has(s.url)) {
              seenUrls.add(s.url);
              rawStreams.push(s);
            }
          }
        }
      }
    } catch (e) {
      clearTimeout(timer);
    }
  }

  try {
    if (!rawStreams.length) {
      return { success: false, error: 'FenixFlix sem fontes para este título', provider: 'fenixflix', reason: 'no_sources' };
    }

    const seenClusters = new Set();
    const parsed = [];
    for (const s of rawStreams) {
      if (!s || !s.url || typeof s.url !== 'string') continue;

      const rawTitle = s.title || '';
      const rawName = s.name || '';
      const text = `${rawName} ${rawTitle}`.toLowerCase();
      let quality = 1080;
      if (text.includes('4k') || text.includes('2160p')) quality = 2160;
      else if (text.includes('1440p') || text.includes('2k')) quality = 1440;
      else if (text.includes('1080p') || text.includes('fhd') || text.includes('full hd') || text.includes('fullhd')) quality = 1080;
      else if (text.includes('720p') || text.includes('hd')) quality = 720;
      else if (text.includes('480p') || text.includes('sd')) quality = 480;
      else if (text.includes('360p')) quality = 360;

      const isSubbed = text.includes('legendado') || text.includes('subbed');
      const isDubbed = text.includes('dublado') ||
                       text.includes('nacional') ||
                       text.includes('dual') ||
                       text.includes('multi') ||
                       text.includes('tri áudio') ||
                       text.includes('tri audio') ||
                       text.includes('pt-br') ||
                       text.includes('ptbr') ||
                       (rawTitle.includes('🇧🇷') && !isSubbed);
      const isHls = s.url.includes('.m3u8') || s.url.includes('hls-proxy') || s.url.includes('/hls') || (s.type === 'hls');

      // Provider trust, audio compatibility & speed tiers:
      // 4: Dedicated high-speed official web VOD masters (fenixhub.online / Zeus / Badger) -> guaranteed AAC web audio, 0ms startup
      // 3: Verified mirrors & direct CDNs (zunder, zunderflix)
      // 2: Third-party web scrapers & adaptive HLS (hollymovies / embedplayer2) -> AAC web audio
      // 1: Un-transcoded bot torrent streams (squareweb.app, koyeb.app, fenixbot, /stream/) -> raw MKVs with E-AC-3 audio (unsupported by HTML5 video / silent in browsers), sleep-prone containers
      const rawUrl = (s.url || '').toLowerCase();
      let providerTier = 3;
      const isBotStream = rawUrl.includes('/stream/') || rawUrl.includes('squareweb.app') || rawUrl.includes('fenixbot') || rawUrl.includes('koyeb.app');
      if (rawUrl.includes('fenixhub.online')) {
        providerTier = 4;
      } else if (text.includes('zunder') || rawUrl.includes('zunderflix')) {
        providerTier = 3;
      } else if (text.includes('hollymovies') || rawUrl.includes('embedplayer2')) {
        providerTier = 2;
      } else if (isBotStream) {
        providerTier = 1;
      }

      const cluster = extractClusterName(rawTitle);
      const dedupKey = `${quality}_${cluster}_${isDubbed ? 'dub' : 'sub'}`;
      if (seenClusters.has(dedupKey)) continue;
      seenClusters.add(dedupKey);

      const tag = isDubbed ? (text.includes('dual') ? 'Dual Áudio' : 'Dublado') : (isSubbed ? 'Legendado' : 'Original');
      const labelParts = [`Fenix ${quality}p`];
      if (cluster) labelParts.push(`· ${cluster}`);
      labelParts.push(`[${tag}]`);
      const cleanLabel = labelParts.join(' ');

      parsed.push({
        label: cleanLabel,
        cluster,
        file: s.url,
        quality,
        providerTier,
        type: isHls ? 'hls' : 'mp4',
        isDubbed,
        isSubbed
      });
    }

    // Sort order:
    // 1. Audio preference: Dubbed first (if audio === 'dubbed'), else Subbed first
    // 2. Official library master vs untrusted scraper (FenixHub > Zunder > Hollymovies)
    // 3. Resolution (2160p > 1080p > 720p > 480p)
    // 4. Prefer adaptive HLS within identical tier & resolution
    parsed.sort((a, b) => {
      if (audio === 'dubbed') {
        if (a.isDubbed && !b.isDubbed) return -1;
        if (!a.isDubbed && b.isDubbed) return 1;
      } else if (audio === 'subtitled') {
        if (a.isSubbed && !b.isSubbed) return -1;
        if (!a.isSubbed && b.isSubbed) return 1;
      }
      if (b.providerTier !== a.providerTier) return b.providerTier - a.providerTier;
      if (b.quality !== a.quality) return b.quality - a.quality;
      if (a.type === 'hls' && b.type !== 'hls') return -1;
      if (b.type === 'hls' && a.type !== 'hls') return 1;
      return 0;
    });

    if (!parsed.length) {
      return { success: false, error: 'FenixFlix sem fontes correspondentes ao áudio selecionado', provider: 'fenixflix', reason: 'no_sources' };
    }

    // Sign proxy URLs for streams needing referer
    const itemsToSign = parsed.map(s => {
      const rawFile = (s.file || '').trim();
      // FenixHub and Fenixbot streams redirect to upstream CDNs with self-signed SSL certs (e.g. dbonline.tech-cdn.top).
      // They MUST be proxied via /api/stream to guarantee valid HTTPS, HTTP 206 Range, and open CORS without browser ERR_CERT_AUTHORITY_INVALID.
      const isDirectMp4 = (rawFile.includes('.mp4') || rawFile.includes('/stream/')) && (
        rawFile.includes('fontedecanais') ||
        rawFile.includes('57lgoe65efxo71.com') ||
        rawFile.includes('77zzhf54vdll71.com') ||
        rawFile.includes('/movies/') ||
        rawFile.includes('/series/')
      ) && !rawFile.includes('fenixhub') && !rawFile.includes('fenixflix') && !rawFile.includes('fenixbot') && !rawFile.includes('tech-cdn');
      const directCleanUrl = isDirectMp4 ? rawFile.replace(/^http:\/\//i, 'https://').replace(/:80\//, '/') : rawFile;
      const { referer, origin } = getStreamHeaders(rawFile);
      return {
        url: directCleanUrl,
        referer,
        origin,
        sourceItem: s,
        isDirectMp4
      };
    });

    const signedResults = await signStreamUrlsBatch(itemsToSign);

    const sources = signedResults.map((item, idx) => {
      const s = item.sourceItem || filtered[idx];
      const finalStreamUrl = item.isDirectMp4 ? item.url : (item.signed_url || item.url);
      const isDirectHls = !item.isDirectMp4 && s.type === 'hls' && /^https:\/\//i.test(s.file);
      return {
        label: s.label,
        type: s.type,
        stream_url: finalStreamUrl,
        direct_url: isDirectHls ? s.file : null,
        raw_url: s.file,
        headers: { 'Referer': item.referer, 'Origin': item.origin },
        quality: s.quality || 1080,
        isDubbed: Boolean(s.isDubbed),
        isSubbed: Boolean(s.isSubbed),
        audio: s.isDubbed ? 'dubbed' : (s.isSubbed ? 'subtitled' : 'original')
      };
    });

    return {
      success: true,
      title: data.title || title || (type === 'movie' ? 'Filme' : `Série T${season}E${episode}`),
      category: type,
      audio: audio === 'subtitled' ? 'subtitled' : 'dubbed',
      provider: 'fenixflix',
      primary_source: sources[0],
      fallback_sources: sources.slice(1),
      subtitles: [],
      aniskip: { mal_id: null, episode, ready: false }
    };
  } catch (err) {
    console.error('[ClientProviders] Erro FenixFlix:', err);
    return { success: false, error: err.message || 'Erro ao carregar FenixFlix', provider: 'fenixflix', reason: 'error' };
  }
}







/* ============================================================
 * 5. UNIFIED DISPATCHER
 * ============================================================ */

export const CLIENT_PROVIDERS = ['fenixflix'];

export async function resolveClientProvider(source, options) {
  switch (source) {
    case 'fenixflix':
      return resolveFenixFlixClient(options);
    default:
      return null;
  }
}
