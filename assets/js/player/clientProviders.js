/**
 * Tvzinha Online - Client-Side Stream Extractors (FenixFlix, Movy)
 * 
 * Executes directly in the user's browser to bypass Cloudflare-to-Cloudflare WAF / CF-Worker blocks,
 * utilizing the user's residential/mobile IP with open CORS (Access-Control-Allow-Origin: *).
 * Signs final proxy URLs through /api/resolve?action=sign for streams requiring custom Referer headers.
 */

import { STREAM_ENGINE_API_BASE } from '../core/constants.js?v=20261028_2242';

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


/* ============================================================
 * 1. FENIXFLIX (PT-BR Dublado Native Stream Aggregator)
 * ============================================================ */

export async function resolveFenixFlixClient({ id, imdbId, type = 'movie', season = 1, episode = 1, audio = 'dubbed', title = '' }) {
  const isSeries = type === 'series' || type === 'serie' || type === 'tv' || type === 'anime';
  const queryId = (imdbId && imdbId.startsWith('tt')) ? imdbId : (id && String(id).startsWith('tmdb:') ? id : `tmdb:${id}`);
  const endpoint = isSeries
    ? `https://fenixflix.fenixhub.online/stream/series/${queryId}:${season}:${episode}.json`
    : `https://fenixflix.fenixhub.online/stream/movie/${queryId}.json`;

  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), 9000);

  try {
    const res = await fetch(endpoint, {
      headers: { 'Accept': 'application/json' },
      signal: controller.signal
    });
    if (!res.ok) {
      return { success: false, error: `FenixFlix retornou HTTP ${res.status}`, provider: 'fenixflix', reason: 'no_sources' };
    }
    const data = await res.json();
    const rawStreams = Array.isArray(data.streams) ? data.streams : [];
    if (!rawStreams.length) {
      return { success: false, error: 'FenixFlix sem fontes para este título', provider: 'fenixflix', reason: 'no_sources' };
    }

    const parsed = rawStreams
      .filter(s => s && s.url && typeof s.url === 'string')
      .map(s => {
        const text = `${s.name || ''} ${s.title || ''}`.toLowerCase();
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
                         (text.includes('🇧🇷') && !isSubbed);
        const isHls = s.url.includes('.m3u8');
        const cleanName = s.name || `FenixFlix ${quality}p`;

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

        const tag = isDubbed ? (text.includes('dual') ? 'Dual Áudio' : 'Dublado') : (isSubbed ? 'Legendado' : 'Original');

        return {
          label: `${cleanName} [${tag}]`,
          file: s.url,
          quality,
          providerTier,
          type: isHls ? 'hls' : 'mp4',
          isDubbed,
          isSubbed
        };
      });

    let filtered = parsed;
    if (audio === 'dubbed') {
      const dubbed = parsed.filter(s => s.isDubbed);
      if (dubbed.length > 0) filtered = dubbed;
    }

    filtered.sort((a, b) => {
      // 1. Official library master vs untrusted scraper (FenixHub > Zunder > Hollymovies)
      if (b.providerTier !== a.providerTier) return b.providerTier - a.providerTier;
      // 2. Declared/detected resolution
      if (b.quality !== a.quality) return b.quality - a.quality;
      // 3. Prefer adaptive HLS within identical tier & resolution
      if (a.type === 'hls' && b.type !== 'hls') return -1;
      if (b.type === 'hls' && a.type !== 'hls') return 1;
      return 0;
    });

    if (!filtered.length) {
      return { success: false, error: 'FenixFlix sem fontes correspondentes ao áudio selecionado', provider: 'fenixflix', reason: 'no_sources' };
    }

    // Sign proxy URLs for streams needing referer
    const itemsToSign = filtered.map(s => {
      const rawFile = (s.file || '').trim();
      const isDirectMp4 = (rawFile.includes('.mp4') || rawFile.includes('/stream/')) && (
        rawFile.includes('fontedecanais') ||
        rawFile.includes('57lgoe65efxo71.com') ||
        rawFile.includes('77zzhf54vdll71.com') ||
        rawFile.includes('fenixhub.online') ||
        rawFile.includes('fenixflix') ||
        rawFile.includes('koyeb.app') ||
        rawFile.includes('squareweb.app') ||
        rawFile.includes('fenixbot') ||
        rawFile.includes('/movies/') ||
        rawFile.includes('/series/')
      );
      const directCleanUrl = isDirectMp4 ? rawFile.replace(/^http:\/\//i, 'https://').replace(/:80\//, '/') : rawFile;
      const referer = 'https://embedplayer2.xyz/';
      return {
        url: directCleanUrl,
        referer,
        origin: 'https://embedplayer2.xyz',
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
        headers: { 'Referer': item.referer || 'https://embedplayer2.xyz/' },
        quality: s.quality || 1080
      };
    });

    return {
      success: true,
      title: data.title || title || (type === 'movie' ? 'Filme' : `Série T${season}E${episode}`),
      category: type,
      audio: 'dubbed',
      provider: 'fenixflix',
      primary_source: sources[0],
      fallback_sources: sources.slice(1),
      subtitles: [],
      aniskip: { mal_id: null, episode, ready: false }
    };
  } catch (err) {
    console.error('[ClientProviders] Erro FenixFlix:', err);
    return { success: false, error: err.message || 'Erro ao carregar FenixFlix', provider: 'fenixflix', reason: 'error' };
  } finally {
    clearTimeout(timer);
  }
}







/* ============================================================
 * 4. MOVY (Wecollege PRNG Decryption / Fast CDN)
 * ============================================================ */

const MOVY_CONSTANTS_D = [
  0x428a2f98, 0x71374491, 0xb5c0fbcf, 0xe9b5dba5,
  0x3956c25b, 0x59f111f1, 0x923f82a4, 0xab1c5ed5,
  0xd807aa98, 0x12835b01, 0x243185be, 0x550c7dc3,
  0x72be5d74, 0x80deb1fe, 0x9bdc06a7, 0xc19bf174
];
const MOVY_MAGIC_MVM1 = [109, 118, 109, 49]; // "mvm1"
const movyIsEven = (e) => (e * (e + 1) & 1) === 0;

function movyMix32(e) {
  e >>>= 0;
  e ^= e >>> 16;
  e = Math.imul(e, 0x85ebca6b) >>> 0;
  e ^= e >>> 13;
  e = Math.imul(e, 0xc2b2ae35) >>> 0;
  return (e ^= e >>> 16) >>> 0;
}

function movyRotl32(e, a) {
  e >>>= 0;
  a &= 31;
  return a === 0 ? e >>> 0 : (e << a | e >>> (32 - a)) >>> 0;
}

function movyBase64UrlToBytes(str) {
  let b64 = str.replace(/-/g, "+").replace(/_/g, "/");
  while (b64.length % 4) b64 += "=";
  const binary = atob(b64);
  const bytes = new Uint8Array(binary.length);
  for (let i = 0; i < binary.length; i++) {
    bytes[i] = binary.charCodeAt(i);
  }
  return bytes;
}

function movyInitKeystreamState(seed, mediaId) {
  let mediaIdNum = Number(mediaId);
  let S = Array(61);
  let seedHash = (() => {
    let acc = 0x811c9dc5;
    for (let t = 0; t < seed.length; t++) {
      acc = Math.imul(acc ^ seed.charCodeAt(t), 0x1000193) >>> 0;
    }
    return movyMix32(acc);
  })();

  let s = movyMix32(seedHash ^ movyMix32((mediaIdNum >>> 0) ^ 0x9e3779b9)) >>> 0;

  for (let e = 0; e < 8; e++) {
    if (movyIsEven(e)) {
      let a = s % 61;
      s = movyRotl32((s + 0x9e3779b9) >>> 0, 7 + (7 & e));
      S[a] = (s ^ movyMix32(s)) >>> 0;
      s = movyMix32((s + a) >>> 0);
    } else {
      S[e] = MOVY_CONSTANTS_D[15 & e];
    }
  }

  return { S, acc: movyMix32(0xa5a5a5a5 ^ s) >>> 0 };
}

function movyNextKeystreamWord(state, step) {
  let S = state.S;
  let l = state.acc;
  let d_idx = l % 61;
  let r = 0 - Number(d_idx in S);
  let s_val = S[d_idx] >>> 0;
  let c_val = Math.imul(0x9e3779b9, step + 1) >>> 0;
  let n_val = (s_val ^ c_val) >>> 0;
  let b_val = (((l ^ n_val) >>> 0) | ((l & n_val & r) >>> 0)) >>> 0;
  let rotated = (movyRotl32((b_val + l) >>> 0, 31 & d_idx) ^ movyRotl32(l, 31 & Math.imul(d_idx, 7))) >>> 0;
  l = movyMix32((rotated + 0x9e3779b9) >>> 0);
  S[d_idx] = l >>> 0;
  state.acc = l;
  return l >>> 0;
}

function movyDecryptPayload(encryptedB64, seed, mediaId) {
  const cipherBytes = movyBase64UrlToBytes(encryptedB64);
  const state = movyInitKeystreamState(seed, mediaId);
  const len = cipherBytes.length;
  
  let step = 0;
  let pos = 0;
  while (pos < len) {
    let word = movyNextKeystreamWord(state, step++);
    cipherBytes[pos++] ^= (word & 255);
    if (pos < len) cipherBytes[pos++] ^= ((word >>> 8) & 255);
    if (pos < len) cipherBytes[pos++] ^= ((word >>> 16) & 255);
    if (pos < len) cipherBytes[pos++] ^= ((word >>> 24) & 255);
  }

  for (let i = 0; i < MOVY_MAGIC_MVM1.length; i++) {
    if (cipherBytes[i] !== MOVY_MAGIC_MVM1[i]) {
      throw new Error(`Magic signature mismatch at byte ${i}`);
    }
  }

  const payload = cipherBytes.subarray(MOVY_MAGIC_MVM1.length);
  return JSON.parse(new TextDecoder("utf-8").decode(payload));
}

export async function resolveMovyClient({ id, type = 'movie', season = 1, episode = 1, title = '', year = '', imdbId = '' }) {
  const tmdbId = /^\d+$/.test(id) ? id : null;
  if (!tmdbId) {
    return { success: false, error: 'Movy requer ID numérico do TMDB', provider: 'movy', reason: 'invalid_id' };
  }

  const isSeries = type === 'series' || type === 'serie' || type === 'tv' || type === 'anime';
  const mediaType = isSeries ? 'tv' : 'movie';
  const headers = {
    'Origin': 'https://www.movy.sx',
    'Referer': 'https://www.movy.sx/'
  };

  try {
    // 1. Get seed
    const seedRes = await fetch(`https://api.wecollege.net/seed?mediaId=${tmdbId}`, { headers });
    if (!seedRes.ok) throw new Error(`Seed falhou com HTTP ${seedRes.status}`);
    const { seed } = await seedRes.json();

    // 2. Query sources
    const params = new URLSearchParams({
      title: encodeURIComponent(title || 'title'),
      mediaType,
      seasonId: String(season),
      episodeId: String(episode),
      tmdbId: String(tmdbId),
      imdbId: imdbId || '',
      year: String(year || '2024'),
      enc: '2',
      seed
    });

    const sourcesRes = await fetch(`https://api.wecollege.net/miami/sources?${params.toString()}`, { headers });
    if (!sourcesRes.ok) throw new Error(`Sources falhou com HTTP ${sourcesRes.status}`);
    const encryptedText = await sourcesRes.text();
    const data = movyDecryptPayload(encryptedText, seed, tmdbId);

    const rawSources = Array.isArray(data?.sources) ? data.sources : [];
    if (!rawSources.length && !data?.playlist) {
      return { success: false, error: 'Movy sem fontes para este título', provider: 'movy', reason: 'no_sources' };
    }

    // Process sources
    const playlistUrl = data.playlist || (rawSources[0]?.url);
    const signedUrl = await signStreamUrl(playlistUrl, 'https://www.movy.sx/');

    const sourceObj = {
      label: 'Movy Miami [FHD HLS]',
      type: 'hls',
      stream_url: signedUrl,
      direct_url: playlistUrl,
      raw_url: playlistUrl,
      headers: { 'Referer': 'https://www.movy.sx/' },
      quality: 1080
    };

    return {
      success: true,
      title: title || (type === 'movie' ? 'Filme' : `Série T${season}E${episode}`),
      category: type,
      audio: 'original',
      provider: 'movy',
      primary_source: sourceObj,
      fallback_sources: [],
      subtitles: [],
      aniskip: { mal_id: null, episode, ready: false }
    };
  } catch (err) {
    console.error('[ClientProviders] Erro Movy:', err);
    return { success: false, error: err.message || 'Erro ao carregar Movy', provider: 'movy', reason: 'error' };
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
    case 'movy':
      return resolveMovyClient(options);
    default:
      return null;
  }
}
